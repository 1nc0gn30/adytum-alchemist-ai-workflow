import http.client
import json
import os
import socket
import subprocess
import sys
import time
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parent.parent
SERVER_PY = ROOT / "server.py"


def _free_port() -> int:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(("127.0.0.1", 0))
        return int(s.getsockname()[1])


@pytest.fixture(scope="module")
def live_server():
    port = _free_port()
    proc = subprocess.Popen(
        [sys.executable, str(SERVER_PY), "--port", str(port), "--host", "127.0.0.1"],
        cwd=str(ROOT),
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    deadline = time.time() + 5.0
    ready = False
    while time.time() < deadline:
        try:
            conn = http.client.HTTPConnection("127.0.0.1", port, timeout=1.0)
            conn.request("GET", "/health")
            resp = conn.getresponse()
            resp.read()
            conn.close()
            if resp.status == 200:
                ready = True
                break
        except OSError:
            time.sleep(0.08)
    assert ready, "server.py failed to become healthy on loopback"
    yield port
    proc.terminate()
    try:
        proc.wait(timeout=3)
    except subprocess.TimeoutExpired:
        proc.kill()


def _req(port: int, method: str, path: str, body: str | None = None, headers: dict | None = None):
    conn = http.client.HTTPConnection("127.0.0.1", port, timeout=3.0)
    hdrs = dict(headers or {})
    if body is not None and "Content-Type" not in hdrs:
        hdrs["Content-Type"] = "application/json"
    conn.request(method, path, body=body, headers=hdrs)
    resp = conn.getresponse()
    raw = resp.read().decode("utf-8", errors="replace")
    resp_headers = {k.lower(): v for k, v in resp.getheaders()}
    conn.close()
    return resp.status, resp_headers, raw


def test_health_and_status_endpoints(live_server):
    for ep in ("/health", "/api/health", "/api/status"):
        status, _, raw = _req(live_server, "GET", ep)
        assert status == 200
        data = json.loads(raw)
        assert data["status"] == "online"
        assert data["service"] == "adytum-alchemist-ai-workflow"
        assert data["version"] == "2.4.0"
        assert data["arcana_count"] == 22
        assert data["port"] == live_server


def test_cors_origin_urlparse_enforcement(live_server):
    # Loopback allowed
    status, hdrs, _ = _req(
        live_server, "GET", "/api/status", headers={"Origin": "http://127.0.0.1:3000"}
    )
    assert status == 200
    assert hdrs.get("access-control-allow-origin") == "http://127.0.0.1:3000"
    assert hdrs.get("vary") == "Origin"

    # Evil / spoofed origins blocked with 403
    for bad_origin in (
        "https://evil.example.com",
        "http://localhost.evil.com",
        "http://127.0.0.1.evil.com",
        "http://127.0.0.1:8135.evil.com",
        "http://user:pass@127.0.0.1:3000",
        "ftp://127.0.0.1:3000",
    ):
        status, hdrs, _ = _req(live_server, "GET", "/api/status", headers={"Origin": bad_origin})
        assert status == 403, f"Expected 403 for {bad_origin}, got {status}"
        assert "access-control-allow-origin" not in hdrs


def test_options_preflight(live_server):
    status, hdrs, _ = _req(
        live_server, "OPTIONS", "/api/validate", headers={"Origin": "http://127.0.0.1:3000"}
    )
    assert status == 204
    assert hdrs.get("access-control-allow-origin") == "http://127.0.0.1:3000"
    assert "POST" in hdrs.get("access-control-allow-methods", "")
    assert "OPTIONS" in hdrs.get("access-control-allow-methods", "")
    assert "Content-Type" in hdrs.get("access-control-allow-headers", "")

    bad_status, _, _ = _req(
        live_server, "OPTIONS", "/api/validate", headers={"Origin": "https://evil.example"}
    )
    assert bad_status == 403


def test_traversal_has_no_existence_oracle(live_server):
    s_exist, _, b_exist = _req(live_server, "GET", "/../../../../../etc/passwd")
    s_miss, _, b_miss = _req(live_server, "GET", "/../../../../../etc/nonexistent_xyz_99999")
    s_enc, _, b_enc = _req(live_server, "GET", "/..%2f..%2f..%2f..%2f..%2fetc/passwd")
    assert s_exist == 400
    assert s_miss == 400
    assert s_enc == 400
    assert b_exist == b_miss == b_enc


def test_api_keys_endpoints(live_server):
    status, _, raw = _req(live_server, "GET", "/api/keys")
    assert status == 200
    data = json.loads(raw)
    assert data["count"] == 22
    assert len(data["keys"]) == 22
    assert data["keys"][0]["name"] == "The Fool"
    assert data["keys"][21]["name"] == "The World"

    status7, _, raw7 = _req(live_server, "GET", "/api/keys/7")
    assert status7 == 200
    assert json.loads(raw7)["name"] == "The Chariot"

    status_bad, _, _ = _req(live_server, "GET", "/api/keys/99")
    assert status_bad == 404


def test_api_validate_negation_aware_and_harden(live_server):
    flawed = "Quick cloud-only prototype using placeholder mock_production responses and fake_data timers with no tests or boundaries."
    status, _, raw = _req(live_server, "POST", "/api/validate", body=json.dumps({"text": flawed}))
    assert status == 200
    audit = json.loads(raw)
    assert audit["passed"] is False
    assert audit["score"] < 30
    by_key = {c["keyNumber"]: c["passed"] for c in audit["checks"]}
    assert by_key[9] is False, "Key 9 must FAIL on 'with no tests'"
    assert by_key[6] is False, "Key 6 must FAIL on 'no ... boundaries'"
    assert by_key[15] is False, "Key 15 must FAIL on placeholder/mock_production/fake_data"
    assert by_key[21] is False, "Key 21 must FAIL on cloud-only"

    h_status, _, h_raw = _req(
        live_server,
        "POST",
        "/api/harden",
        body=json.dumps({"text": flawed, "projectName": "AuditTest"}),
    )
    assert h_status == 200
    h_data = json.loads(h_raw)
    assert h_data["audit"]["passed"] is True
    assert h_data["audit"]["score"] == 100
    assert "with no tests" not in h_data["hardened"].lower()
    assert "mock_production" not in h_data["hardened"].lower()


def test_api_providers_discovery_and_probe(live_server):
    status, _, raw = _req(live_server, "GET", "/api/providers")
    assert status == 200
    data = json.loads(raw)
    ids = {p["id"] for p in data["providers"]}
    for required in (
        "agy_bridge",
        "ollama_local",
        "azoth_local",
        "agy_cli",
        "hermes_cli",
        "grok_cli",
        "codex_cli",
        "claude_code",
        "openai",
        "anthropic",
        "gemini_api",
        "openrouter",
        "xai_grok",
        "ollama_cloud",
        "custom_openai",
    ):
        assert required in ids, f"Missing provider {required}"

    # Reject invalid shell-injection model names on /api/chat
    bad_status, _, bad_raw = _req(
        live_server,
        "POST",
        "/api/chat",
        body=json.dumps({
            "provider": "agy_cli",
            "model": "gemini; rm -rf /",
            "messages": [{"role": "user", "content": "hi"}],
        }),
    )
    assert bad_status == 400
    assert "Invalid model" in bad_raw

    # Reject missing API key cleanly on cloud provider test
    t_status, _, t_raw = _req(
        live_server,
        "POST",
        "/api/providers/test",
        body=json.dumps({"provider": "anthropic", "apiKey": ""}),
    )
    assert t_status == 200
    t_data = json.loads(t_raw)
    assert t_data["ok"] is False
    assert t_data["status"] == "missing_key"
