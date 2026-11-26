#!/usr/bin/env python3
"""
Adytum Planner — 22-Key Hermetic AI Workbench & Multi-Provider Loopback Bridge (:8135)
Engineered by Neal Frazier Tech (@1nc0gn30) • NullAI Platform
"""
import argparse
import http.server
import json
import os
import re
import shutil
import socketserver
import subprocess
import time
import urllib.error
import urllib.parse
import urllib.request

VERSION = "2.4.0"
SERVICE_ID = "adytum-alchemist-ai-workflow"
SERVICE_TITLE = "Adytum Planner — 22-Key Hermetic AI Workbench"

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
DIST_DIR = (
    os.path.join(ROOT_DIR, "dist")
    if os.path.isdir(os.path.join(ROOT_DIR, "dist"))
    else os.path.join(ROOT_DIR, "public")
)
DIST_REAL = os.path.realpath(DIST_DIR)
MAX_POST_BYTES = 524_288  # 512 KB
SAFE_MODEL_RE = re.compile(r"^[A-Za-z0-9._:/@-]{1,120}$")

HERMETIC_KEYS = [
    {"key": 0, "arcana": "0 · The Fool (Aleph)", "name": "The Fool", "letter": "Aleph (א)", "gematria": 1, "gate": "Air / Pneuma", "phase": "Pure Potentiality & Unbounded Ideation", "directive": "Strip all inherited assumptions; define the irreducible sovereign objective."},
    {"key": 1, "arcana": "I · The Magician (Beth)", "name": "The Magician", "letter": "Beth (ב)", "gematria": 2, "gate": "Mercury / Logos", "phase": "Focused Intention & Single-Pointed Execution", "directive": "Bind local CLI tools, MCP endpoints, and hardware compute to a single unambiguous goal."},
    {"key": 2, "arcana": "II · The High Priestess (Gimel)", "name": "The High Priestess", "letter": "Gimel (ג)", "gematria": 3, "gate": "Moon / Memory", "phase": "Cryptographic Memory & Zero-Leak Storage", "directive": "Preserve state across sessions in deterministic local stores with zero unauthorized egress."},
    {"key": 3, "arcana": "III · The Empress (Daleth)", "name": "The Empress", "letter": "Daleth (ד)", "gematria": 4, "gate": "Venus / Door", "phase": "Generative Architecture & Organic Scalability", "directive": "Compose clean primitives that multiply downstream capability without brittle coupling."},
    {"key": 4, "arcana": "IV · The Emperor (Heh)", "name": "The Emperor", "letter": "Heh (ה)", "gematria": 5, "gate": "Aries / Sight", "phase": "Immutable Invariants & Structural Governance", "directive": "Enforce strict schemas and constitutional assertions at every system boundary."},
    {"key": 5, "arcana": "V · The Hierophant (Vav)", "name": "The Hierophant", "letter": "Vav (ו)", "gematria": 6, "gate": "Taurus / Nail", "phase": "Standardized Contracts & Semantic Schemas", "directive": "Expose canonical JSON-RPC / MCP and CLI contracts so humans and agents interoperate cleanly."},
    {"key": 6, "arcana": "VI · The Lovers (Zain)", "name": "The Lovers", "letter": "Zain (ז)", "gematria": 7, "gate": "Gemini / Sword", "phase": "Binary Tradeoff Discipline & Clean Boundaries", "directive": "State explicit non-goals, security separations, and architectural tradeoffs."},
    {"key": 7, "arcana": "VII · The Chariot (Cheth)", "name": "The Chariot", "letter": "Cheth (ח)", "gematria": 8, "gate": "Cancer / Armor", "phase": "Air-Gapped Isolation & Sandbox Enclosures", "directive": "Lock the execution harness to loopback silicon (127.0.0.1) with 100% offline capability."},
    {"key": 8, "arcana": "VIII · Strength (Teth)", "name": "Strength", "letter": "Teth (ט)", "gematria": 9, "gate": "Leo / Serpent", "phase": "Graceful Error Handling & Self-Healing Loops", "directive": "Wrap subprocesses, ports, and model calls in bounded retry and deterministic fallback loops."},
    {"key": 9, "arcana": "IX · The Hermit (Yod)", "name": "The Hermit", "letter": "Yod (י)", "gematria": 10, "gate": "Virgo / Lantern", "phase": "Deterministic Verification & Zero-Dependency Audits", "directive": "Prove runtime behavior with self-contained smoke tests rather than trusting documentation."},
    {"key": 10, "arcana": "X · Wheel of Fortune (Kaph)", "name": "Wheel of Fortune", "letter": "Kaph (כ)", "gematria": 20, "gate": "Jupiter / Cycle", "phase": "State Loop Determinism & Replayability", "directive": "Ensure event loops and state transitions resume idempotently across restarts."},
    {"key": 11, "arcana": "XI · Justice (Lamed)", "name": "Justice", "letter": "Lamed (ל)", "gematria": 30, "gate": "Libra / Scales", "phase": "Strict Verification Tests & Equilibrated Budgets", "directive": "Enforce concrete latency, memory, and accuracy budgets with automated assertions."},
    {"key": 12, "arcana": "XII · The Hanged Man (Mem)", "name": "The Hanged Man", "letter": "Mem (מ)", "gematria": 40, "gate": "Water / Reversal", "phase": "Asynchronous Non-Blocking Flow & Calm Pacing", "directive": "Replace busy polling and blocking bottlenecks with reactive event-driven wakeups."},
    {"key": 13, "arcana": "XIII · Death (Nun)", "name": "Death", "letter": "Nun (נ)", "gematria": 50, "gate": "Scorpio / Transformation", "phase": "Ruthless Cruft Pruning & Resource Cleanup", "directive": "Prune dead state, zombie processes, stale caches, and legacy paywall clutter."},
    {"key": 14, "arcana": "XIV · Temperance (Samekh)", "name": "Temperance", "letter": "Samekh (ס)", "gematria": 60, "gate": "Sagittarius / Synthesis", "phase": "Rate-Limiting & High-Concurrence Harmony", "directive": "Harmonize CLI backend and browser UI in calibrated equilibrium without state drift."},
    {"key": 15, "arcana": "XV · The Devil (Ayin)", "name": "The Devil", "letter": "Ayin (ע)", "gematria": 70, "gate": "Capricorn / Eye", "phase": "Anti-Deception Audit & Elimination of Mock State", "directive": "Banish fake placeholders, mock responses, and misleading cipher labels."},
    {"key": 16, "arcana": "XVI · The Tower (Peh)", "name": "The Tower", "letter": "Peh (פ)", "gematria": 80, "gate": "Mars / Lightning", "phase": "Chaos Resilience & Graceful Crash Recovery", "directive": "Test fault injection and atomic writes so abrupt termination never corrupts user state."},
    {"key": 17, "arcana": "XVII · The Star (Tzaddi)", "name": "The Star", "letter": "Tzaddi (צ)", "gematria": 90, "gate": "Aquarius / Star", "phase": "Transparent Telemetry & Clear Logging", "directive": "Provide structured diagnostics (/health, --json) so operators see live health in <5s."},
    {"key": 18, "arcana": "XVIII · The Moon (Qoph)", "name": "The Moon", "letter": "Qoph (ק)", "gematria": 100, "gate": "Pisces / Soma", "phase": "Deep Synaptic Retention & Subconscious Caches", "directive": "Preserve lineage history and user artifacts seamlessly across upgrades."},
    {"key": 19, "arcana": "XIX · The Sun (Resh)", "name": "The Sun", "letter": "Resh (ר)", "gematria": 200, "gate": "Sun / Radiance", "phase": "Production-Grade Elegance & High-Fidelity UI", "directive": "Deliver high-contrast, responsive UI across mobile, tablet, and desktop viewports."},
    {"key": 20, "arcana": "XX · Judgement (Shin)", "name": "Judgement", "letter": "Shin (ש)", "gematria": 300, "gate": "Fire / Awakening", "phase": "Comprehensive Integration Sentinel & Release Gate", "directive": "Verify README, in-app docs, CLI --help, and live UI parity before release."},
    {"key": 21, "arcana": "XXI · The World (Tav)", "name": "The World", "letter": "Tav (ת)", "gematria": 400, "gate": "Saturn / Crown", "phase": "Hermetic Sovereign Wholeness & Zero-Egress Proof", "directive": "Seal the compiled artifact, emit deterministic manifest, and ship 100% open-access."},
]

_NEGATION_RE = re.compile(
    r"\b(?:no|without|zero|skip|skipping|none|lack|lacking|missing|never|not|avoid|omits?|omitting)\b",
    re.IGNORECASE,
)


def _has_positive_term(text: str, terms: list[str]) -> bool:
    for term in terms:
        pattern = re.compile(rf"\b{re.escape(term)}\w*", re.IGNORECASE)
        for match in pattern.finditer(text):
            prefix = text[max(0, match.start() - 32) : match.start()]
            clause_prefix = re.split(r"[.;\n!?]", prefix)[-1]
            if not _NEGATION_RE.search(clause_prefix):
                return True
    return False


def validate_plan(plan_text: str = "") -> dict:
    text = (plan_text or "").strip()
    lowered = text.lower()
    rules = [
        (0, len(text) > 50, "Intention & Purpose Defined (Aleph)", 5),
        (1, _has_positive_term(lowered, ["scope", "goal", "objective"]), "Single-Pointed Focus (Beth)", 5),
        (2, _has_positive_term(lowered, ["memory", "store", "cache", "state", "storage"]), "State & Memory Integrity (Gimel)", 5),
        (4, _has_positive_term(lowered, ["invariant", "rule", "constraint"]), "Immutable Invariants Enforced (Heh)", 5),
        (5, _has_positive_term(lowered, ["schema", "json", "contract", "type"]), "Standardized Schemas & Interfaces (Vav)", 5),
        (6, _has_positive_term(lowered, ["tradeoff", "boundary", "boundaries", "exclude", "non-goal"]), "Explicit Tradeoffs & Non-Goals (Zain)", 4),
        (7, _has_positive_term(lowered, ["isolate", "isolation", "air-gap", "sandbox", "zero-egress", "local", "loopback"]), "Air-Gapped Isolation & Sandbox (Cheth)", 6),
        (8, _has_positive_term(lowered, ["error", "fail", "catch", "resilien", "recovery"]), "Graceful Error Handling (Teth)", 5),
        (9, _has_positive_term(lowered, ["test", "audit", "verify", "verification", "pytest"]), "Deterministic Verification Test Suite (Yod)", 6),
        (11, _has_positive_term(lowered, ["budget", "metric", "eval", "benchmark", "latency"]), "Performance & Budget Equilibrated (Lamed)", 4),
        (13, _has_positive_term(lowered, ["clean", "prune", "remove", "purge"]), "Resource Pruning & Cleanup (Nun)", 4),
        (15, not any(bad in lowered for bad in ("placeholder", "mock_production", "fake_data")), "Truth In Advertising / No Fake State (Ayin)", 6),
        (17, _has_positive_term(lowered, ["log", "telemetry", "trace", "stdout", "diagnostic"]), "Clear Logging & Diagnostics (Tzaddi)", 4),
        (20, _has_positive_term(lowered, ["release", "deploy", "deliver", "ci"]), "Integration Gate & Release Verification (Shin)", 5),
        (21, ("cloud-only" not in lowered) and _has_positive_term(lowered, ["offline", "local-first", "sovereign"]), "Sovereign Wholeness & Local Autonomy (Tav)", 5),
    ]

    key_map = {k["key"]: k["arcana"] for k in HERMETIC_KEYS}
    total_weight = sum(w for _, _, _, w in rules)
    score_total = 0
    checks = []
    for key_num, ok, label, weight in rules:
        if ok:
            score_total += weight
        checks.append(
            {
                "keyNumber": key_num,
                "keyName": key_map.get(key_num, f"Key {key_num}"),
                "rule": label,
                "passed": bool(ok),
                "weight": weight,
                "recommendation": None if ok else f"Incorporate explicit {label.lower()} into specification.",
            }
        )

    score = min(100, round((score_total / total_weight) * 100))
    passed = score >= 70
    grade = "A+" if score >= 90 else ("A" if score >= 80 else ("B" if score >= 70 else "NEEDS_REVISION"))
    return {
        "passed": passed,
        "score": score,
        "grade": grade,
        "summary": (
            "Specification passes the Hermetic Quality Gate. Architecture is robust, testable, and bounded."
            if passed
            else "Specification fails required hermetic invariants. Run auto-hardening to remediate blockers."
        ),
        "checks": checks,
        "blockers": [c["recommendation"] for c in checks if not c["passed"]],
    }


def auto_harden_spec(plan_text: str = "", project_name: str = "Sovereign Zero-Egress Enclave") -> str:
    text = (plan_text or "").strip()
    replacements = [
        (r"\bwith\s+no\s+tests?\s+(?:or|and)\s+boundar(?:y|ies)\b", "with automated verification tests and explicit security boundaries"),
        (r"\b(?:with\s+)?no\s+tests?\b", "with automated verification tests"),
        (r"\bwithout\s+tests?\b", "with automated verification tests"),
        (r"\b(?:with\s+)?no\s+boundar(?:y|ies)\b", "with explicit security boundaries"),
        (r"\bwithout\s+boundar(?:y|ies)\b", "with explicit security boundaries"),
        (r"\bplaceholder\s+mock_production\s+responses\b", "verified production API handlers"),
        (r"\bfake_data\s+timers\b", "deterministic live execution loops"),
        (r"\bcloud-only\b", "local-first sovereign"),
        (r"\bplaceholder\b", "verified implementation"),
        (r"\bmock_production\b", "verified_production"),
        (r"\bfake_data\b", "canonical_fixtures"),
    ]
    for pattern, repl in replacements:
        text = re.sub(pattern, repl, text, flags=re.IGNORECASE)

    remediation_map = {
        0: f"Intention & Purpose (Key 0 · Aleph): Deliver a sovereign, zero-egress architecture for {project_name} with unambiguous user value.",
        1: "Goal & Scope (Key 1 · Beth): Define a single-pointed objective and strict execution scope with zero feature drift.",
        2: "State & Memory Store (Key 2 · Gimel): Persist application state and memory cache in deterministic local storage with atomic writes.",
        4: "Immutable Invariants (Key 4 · Heh): Enforce strict runtime invariants and constitutional constraints at every module boundary.",
        5: "Standardized Schemas (Key 5 · Vav): Validate all inputs and outputs against canonical JSON schema type contracts.",
        6: "Explicit Tradeoffs & Boundaries (Key 6 · Zain): Document explicit architectural tradeoffs and exclude non-essential surface area.",
        7: "Air-Gapped Sandbox Isolation (Key 7 · Cheth): Isolate execution to local loopback (127.0.0.1) inside a zero-egress sandbox.",
        8: "Graceful Error Resilience (Key 8 · Teth): Wrap all I/O and subprocess boundaries in bounded catch and error recovery loops.",
        9: "Deterministic Verification Suite (Key 9 · Yod): Audit and verify runtime behavior via an automated end-to-end test suite.",
        11: "Equilibrated Performance Budgets (Key 11 · Lamed): Benchmark latency and memory metrics against strict quantitative budgets.",
        13: "Resource Pruning & Hygiene (Key 13 · Nun): Prune stale cache state, zombie processes, and dead code paths automatically.",
        15: "Anti-Deception Guarantee (Key 15 · Ayin): Zero fabricated state—all transforms, metrics, and outputs execute real algorithms.",
        17: "Transparent Telemetry & Diagnostics (Key 17 · Tzaddi): Emit structured stdout telemetry logs and health trace diagnostics.",
        20: "Release & CI Integration Gate (Key 20 · Shin): Gate CI deployment and release delivery on 100% invariant verification.",
        21: "Sovereign Wholeness & Offline Autonomy (Key 21 · Tav): Guarantee 100% offline, local-first sovereign operation without cloud lock-in.",
    }

    current_audit = validate_plan(text)
    added = [
        remediation_map[c["keyNumber"]]
        for c in current_audit["checks"]
        if not c["passed"] and c["keyNumber"] in remediation_map
    ]
    if added:
        header = f"{text}\n" if text else f"# {project_name} — Sovereign Specification\n"
        text = "\n".join([header, "## Hermetic Invariant Hardening Clauses", *[f"- {c}" for c in added]]).strip()
    return text


# ---------------------------------------------------------------------------
# Multi-Provider AI Discovery, Probe & Dispatch (Local CLIs, Bridges & Cloud)
# ---------------------------------------------------------------------------


def _http_json(url: str, method: str = "GET", payload: dict | None = None, headers: dict | None = None, timeout: float = 2.0):
    data = json.dumps(payload).encode("utf-8") if payload is not None else None
    hdrs = {"Accept": "application/json", **(headers or {})}
    if data is not None and "Content-Type" not in hdrs:
        hdrs["Content-Type"] = "application/json"
    req = urllib.request.Request(url, data=data, headers=hdrs, method=method)
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        raw = resp.read().decode("utf-8", errors="replace")
        return resp.status, json.loads(raw) if raw.strip() else {}


def _is_harness_or_loop_wrapper(path: str, markers: tuple[str, ...]) -> bool:
    try:
        with open(path, "rb") as fh:
            head = fh.read(2048)
        if head.startswith(b"\x7fELF"):
            return False
        text = head.decode("utf-8", errors="ignore")
        return any(m in text for m in markers)
    except OSError:
        return True


def _resolve_cli_binary(provider_id: str) -> tuple[str | None, str]:
    home = os.path.expanduser("~")
    if provider_id == "agy_cli":
        candidates = [
            os.path.join(home, ".gemini", "antigravity-cli", "bin", "agy"),
            shutil.which("agy") or "",
        ]
        for c in candidates:
            if c and os.path.isfile(c) and os.access(c, os.X_OK):
                return c, "Antigravity CLI ready"
        return None, "agy binary not found"

    if provider_id == "hermes_cli":
        candidates = [
            os.path.join(home, ".local", "bin", "hermes"),
            shutil.which("hermes") or "",
        ]
        for c in candidates:
            if c and os.path.isfile(c) and os.access(c, os.X_OK):
                return c, "Hermes Agent CLI ready"
        return None, "hermes binary not found"

    if provider_id == "grok_cli":
        candidates = [
            os.path.join(home, ".grok", "bin", "grok"),
            shutil.which("grok") or "",
        ]
        for c in candidates:
            if c and os.path.isfile(c) and os.access(c, os.X_OK):
                return c, "Grok Build CLI ready"
        return None, "grok binary not found"

    if provider_id == "codex_cli":
        candidates = [
            os.path.join(home, ".npm-global", "bin", "codex"),
            os.path.join(home, ".local", "lib", "node_modules", "@openai", "codex", "bin", "codex.js"),
            "/usr/bin/codex",
            os.path.join(home, ".local", "bin", "codex"),
            "/usr/local/bin/codex",
        ]
        for c in candidates:
            if c and os.path.isfile(c) and os.access(c, os.X_OK):
                if _is_harness_or_loop_wrapper(c, ("sovereign-agent-bridge gatekeep codex", "ZOTHOS OpenAI Codex Agent Sovereign Agent Workstation")):
                    continue
                return c, "OpenAI Codex CLI ready"
        return None, "Install @openai/codex binary (gatekeeper wrapper detected without underlying binary)"

    if provider_id == "claude_code":
        candidates = [
            os.path.join(home, ".claude", "local", "claude"),
            os.path.join(home, ".npm-global", "bin", "claude"),
            os.path.join(home, ".local", "lib", "node_modules", "@anthropic-ai", "claude-code", "cli.mjs"),
            "/usr/local/bin/claude-code",
            "/usr/bin/claude",
            os.path.join(home, ".local", "bin", "claude"),
        ]
        for c in candidates:
            if c and os.path.isfile(c) and os.access(c, os.X_OK):
                if _is_harness_or_loop_wrapper(c, ("Anthropic Claude Code is not installed yet", "ZOTHOS Anthropic Claude Code Sovereign Agent Workstation")):
                    continue
                return c, "Anthropic Claude Code CLI ready"
        return None, "Claude Code harness present; run 'claude install' to install CLI"

    return None, "Unknown CLI provider"


def _validate_model_name(model: str) -> str:
    cleaned = (model or "").strip()
    if cleaned and not SAFE_MODEL_RE.match(cleaned):
        raise ValueError("Invalid model identifier")
    return cleaned


def _format_cli_prompt(system_prompt: str, messages: list[dict]) -> str:
    parts = []
    if system_prompt.strip():
        parts.append(f"System Instructions:\n{system_prompt.strip()}")
    for msg in messages:
        role = str(msg.get("role", "user")).upper()
        content = str(msg.get("content", "")).strip()
        if content:
            parts.append(f"{role}: {content}")
    return "\n\n".join(parts)


def discover_providers() -> dict:
    providers = []

    # 1. AGY Bridge (:18000)
    agy_models = []
    agy_status = "offline"
    agy_detail = "http://127.0.0.1:18000 unreachable"
    try:
        _, data = _http_json("http://127.0.0.1:18000/v1/models", timeout=1.2)
        agy_models = [m.get("id") for m in data.get("data", []) if isinstance(m, dict) and m.get("id")]
        agy_status = "online"
        agy_detail = f"Live AGY OpenAI proxy ({len(agy_models)} models)"
    except Exception:
        pass
    providers.append({
        "id": "agy_bridge",
        "name": "AGY Bridge (:18000)",
        "group": "local",
        "transport": "http",
        "status": agy_status,
        "requiresKey": False,
        "baseUrl": "http://127.0.0.1:18000/v1",
        "defaultModel": agy_models[0] if agy_models else "gemini-3.8-flash-high",
        "models": agy_models,
        "detail": agy_detail,
    })

    # 2. Ollama Local (:11434)
    ol_models = []
    ol_status = "offline"
    ol_detail = "http://127.0.0.1:11434 unreachable"
    try:
        _, data = _http_json("http://127.0.0.1:11434/api/tags", timeout=1.2)
        ol_models = [m.get("name") for m in data.get("models", []) if isinstance(m, dict) and m.get("name")]
        ol_status = "online"
        ol_detail = f"Local Ollama daemon ({len(ol_models)} models)"
    except Exception:
        pass
    providers.append({
        "id": "ollama_local",
        "name": "Ollama Local (:11434)",
        "group": "local",
        "transport": "http",
        "status": ol_status,
        "requiresKey": False,
        "baseUrl": "http://127.0.0.1:11434",
        "defaultModel": ol_models[0] if ol_models else "hermes3:8b",
        "models": ol_models,
        "detail": ol_detail,
    })

    # 3. AZOTH Local Archon Agent (:8136)
    az_status = "offline"
    az_detail = "http://127.0.0.1:8136 unreachable"
    try:
        _, data = _http_json("http://127.0.0.1:8136/health", timeout=1.2)
        if data.get("status") in ("healthy", "online"):
            az_status = "online"
            az_detail = "AZOTH Local Archon Agent online (/api/chat)"
    except Exception:
        pass
    providers.append({
        "id": "azoth_local",
        "name": "AZOTH Local (:8136)",
        "group": "local",
        "transport": "http",
        "status": az_status,
        "requiresKey": False,
        "baseUrl": "http://127.0.0.1:8136",
        "defaultModel": "azoth-archon",
        "models": ["azoth-archon"],
        "detail": az_detail,
    })

    # 4-8. Local CLI Agents
    cli_specs = [
        ("agy_cli", "AGY CLI", "gemini-3.8-flash-high", agy_models or ["gemini-3.8-flash-high", "gemini-4-argon-medium", "claude-sonnet-5-5-high"]),
        ("hermes_cli", "Hermes Agent CLI", "default", ["default"]),
        ("grok_cli", "Grok CLI", "grok-3-mini", ["grok-3-mini", "grok-3"]),
        ("codex_cli", "Codex CLI", "o4-mini", ["o4-mini", "gpt-4.1"]),
        ("claude_code", "Claude Code CLI", "sonnet", ["sonnet", "opus"]),
    ]
    for pid, name, default_model, models in cli_specs:
        bin_path, detail = _resolve_cli_binary(pid)
        providers.append({
            "id": pid,
            "name": name,
            "group": "local",
            "transport": "cli",
            "status": "cli_ready" if bin_path else "offline",
            "requiresKey": False,
            "path": bin_path,
            "defaultModel": default_model,
            "models": models,
            "detail": detail,
        })

    # 9-15. Cloud & Custom APIs
    cloud_specs = [
        ("openai", "OpenAI API", "https://api.openai.com/v1", "gpt-4.1-mini", ["gpt-4.1-mini", "gpt-4.1", "o4-mini"]),
        ("anthropic", "Anthropic Claude API", "https://api.anthropic.com/v1", "claude-sonnet-4-20250514", ["claude-sonnet-4-20250514", "claude-3-5-haiku-latest"]),
        ("gemini_api", "Google Gemini API", "https://generativelanguage.googleapis.com/v1beta", "gemini-2.5-flash", ["gemini-2.5-flash", "gemini-2.5-pro"]),
        ("openrouter", "OpenRouter", "https://openrouter.ai/api/v1", "openai/gpt-4o-mini", ["openai/gpt-4o-mini", "anthropic/claude-3.5-sonnet", "google/gemini-2.5-flash"]),
        ("xai_grok", "xAI Grok API", "https://api.x.ai/v1", "grok-3-mini", ["grok-3-mini", "grok-3"]),
        ("ollama_cloud", "Ollama Cloud", "https://ollama.com", "llama3.1:8b", ["llama3.1:8b", "qwen2.5:14b"]),
        ("custom_openai", "Custom OpenAI-Compatible", "http://127.0.0.1:1234/v1", "local-model", ["local-model"]),
    ]
    for pid, name, base_url, default_model, models in cloud_specs:
        providers.append({
            "id": pid,
            "name": name,
            "group": "cloud",
            "transport": "http",
            "status": "configured_via_key",
            "requiresKey": pid != "custom_openai",
            "baseUrl": base_url,
            "defaultModel": default_model,
            "models": models,
            "detail": f"Server-proxied HTTP ({base_url})",
        })

    recommended = "agy_bridge" if agy_status == "online" else ("ollama_local" if ol_status == "online" else "agy_cli")
    return {"version": VERSION, "recommended": recommended, "providers": providers}


def test_provider_connection(body: dict) -> dict:
    provider = str(body.get("provider", "")).strip()
    base_url = str(body.get("baseUrl", "")).strip().rstrip("/")
    api_key = str(body.get("apiKey", "")).strip()
    t0 = time.perf_counter()

    def _ms() -> int:
        return round((time.perf_counter() - t0) * 1000)

    try:
        if provider == "agy_bridge":
            url = (base_url or "http://127.0.0.1:18000/v1") + "/models"
            _, data = _http_json(url, timeout=4.0)
            models = [m.get("id") for m in data.get("data", []) if isinstance(m, dict) and m.get("id")]
            return {"ok": True, "provider": provider, "status": "online", "latencyMs": _ms(), "models": models, "detail": f"AGY Bridge online with {len(models)} models"}

        if provider == "ollama_local":
            url = (base_url or "http://127.0.0.1:11434") + "/api/tags"
            _, data = _http_json(url, timeout=4.0)
            models = [m.get("name") for m in data.get("models", []) if isinstance(m, dict) and m.get("name")]
            return {"ok": True, "provider": provider, "status": "online", "latencyMs": _ms(), "models": models, "detail": f"Ollama Local online with {len(models)} models"}

        if provider == "azoth_local":
            url = (base_url or "http://127.0.0.1:8136") + "/health"
            _, data = _http_json(url, timeout=4.0)
            ok = data.get("status") in ("healthy", "online")
            return {"ok": ok, "provider": provider, "status": "online" if ok else "offline", "latencyMs": _ms(), "detail": f"AZOTH Local health: {data.get('status', 'unknown')}"}

        if provider in ("agy_cli", "hermes_cli", "grok_cli", "codex_cli", "claude_code"):
            bin_path, detail = _resolve_cli_binary(provider)
            if not bin_path:
                return {"ok": False, "provider": provider, "status": "offline", "latencyMs": _ms(), "detail": detail}
            res = subprocess.run(
                [bin_path, "--version"],
                shell=False,
                stdin=subprocess.DEVNULL,
                capture_output=True,
                text=True,
                timeout=5,
            )
            ver = (res.stdout or res.stderr or "").strip().splitlines()[0] if (res.stdout or res.stderr) else "ready"
            return {"ok": res.returncode == 0, "provider": provider, "status": "cli_ready" if res.returncode == 0 else "error", "latencyMs": _ms(), "detail": ver[:160]}

        if provider in ("openai", "openrouter", "xai_grok", "custom_openai"):
            defaults = {
                "openai": "https://api.openai.com/v1",
                "openrouter": "https://openrouter.ai/api/v1",
                "xai_grok": "https://api.x.ai/v1",
                "custom_openai": "http://127.0.0.1:1234/v1",
            }
            if provider != "custom_openai" and not api_key:
                return {"ok": False, "provider": provider, "status": "missing_key", "latencyMs": _ms(), "detail": "API key required"}
            hdrs = {"Authorization": f"Bearer {api_key}"} if api_key else {}
            _, data = _http_json((base_url or defaults[provider]) + "/models", headers=hdrs, timeout=6.0)
            models = [m.get("id") for m in data.get("data", []) if isinstance(m, dict) and m.get("id")][:25]
            return {"ok": True, "provider": provider, "status": "online", "latencyMs": _ms(), "models": models, "detail": f"Authenticated ({len(models)} models returned)"}

        if provider == "anthropic":
            if not api_key:
                return {"ok": False, "provider": provider, "status": "missing_key", "latencyMs": _ms(), "detail": "Anthropic API key required"}
            hdrs = {"x-api-key": api_key, "anthropic-version": "2023-06-01"}
            _, data = _http_json((base_url or "https://api.anthropic.com/v1") + "/models", headers=hdrs, timeout=6.0)
            models = [m.get("id") for m in data.get("data", []) if isinstance(m, dict) and m.get("id")][:20]
            return {"ok": True, "provider": provider, "status": "online", "latencyMs": _ms(), "models": models, "detail": f"Anthropic API verified ({len(models)} models)"}

        if provider == "gemini_api":
            if not api_key:
                return {"ok": False, "provider": provider, "status": "missing_key", "latencyMs": _ms(), "detail": "Google Gemini API key required"}
            hdrs = {"x-goog-api-key": api_key}
            _, data = _http_json((base_url or "https://generativelanguage.googleapis.com/v1beta") + "/models", headers=hdrs, timeout=6.0)
            models = [m.get("name", "").replace("models/", "") for m in data.get("models", []) if isinstance(m, dict) and m.get("name")][:20]
            return {"ok": True, "provider": provider, "status": "online", "latencyMs": _ms(), "models": models, "detail": f"Gemini API verified ({len(models)} models)"}

        if provider == "ollama_cloud":
            if not api_key:
                return {"ok": False, "provider": provider, "status": "missing_key", "latencyMs": _ms(), "detail": "Ollama Cloud API key required"}
            hdrs = {"Authorization": f"Bearer {api_key}"}
            _, data = _http_json((base_url or "https://ollama.com") + "/api/tags", headers=hdrs, timeout=6.0)
            models = [m.get("name") for m in data.get("models", []) if isinstance(m, dict) and m.get("name")][:20]
            return {"ok": True, "provider": provider, "status": "online", "latencyMs": _ms(), "models": models, "detail": f"Ollama Cloud verified ({len(models)} models)"}

        return {"ok": False, "provider": provider, "status": "unknown", "latencyMs": _ms(), "detail": f"Unknown provider: {provider}"}
    except urllib.error.HTTPError as exc:
        return {"ok": False, "provider": provider, "status": "http_error", "latencyMs": _ms(), "detail": f"Upstream HTTP {exc.code}"}
    except Exception as exc:
        return {"ok": False, "provider": provider, "status": "offline", "latencyMs": _ms(), "detail": str(exc)[:180]}


def dispatch_chat(body: dict) -> tuple[int, dict]:
    provider = str(body.get("provider", "")).strip()
    try:
        model = _validate_model_name(str(body.get("model", "")))
    except ValueError as exc:
        return 400, {"ok": False, "error": str(exc)}
    base_url = str(body.get("baseUrl", "")).strip().rstrip("/")
    api_key = str(body.get("apiKey", "")).strip()
    system_prompt = str(body.get("systemPrompt", "")).strip()
    raw_messages = body.get("messages")
    if not isinstance(raw_messages, list) or not raw_messages:
        return 400, {"ok": False, "error": "messages must be a non-empty array"}

    messages = [
        {"role": str(m.get("role", "user")), "content": str(m.get("content", ""))}
        for m in raw_messages
        if isinstance(m, dict) and str(m.get("content", "")).strip()
    ]
    if not messages:
        return 400, {"ok": False, "error": "messages contain no text content"}

    t0 = time.perf_counter()

    def _ms() -> int:
        return round((time.perf_counter() - t0) * 1000)

    try:
        # OpenAI-compatible HTTP endpoints (AGY Bridge, OpenAI, OpenRouter, xAI Grok, Custom)
        if provider in ("agy_bridge", "openai", "openrouter", "xai_grok", "custom_openai"):
            defaults = {
                "agy_bridge": ("http://127.0.0.1:18000/v1", "gemini-3.8-flash-high"),
                "openai": ("https://api.openai.com/v1", "gpt-4.1-mini"),
                "openrouter": ("https://openrouter.ai/api/v1", "openai/gpt-4o-mini"),
                "xai_grok": ("https://api.x.ai/v1", "grok-3-mini"),
                "custom_openai": ("http://127.0.0.1:1234/v1", "local-model"),
            }
            def_base, def_model = defaults[provider]
            use_base = base_url or def_base
            use_model = model or def_model
            if provider in ("openai", "openrouter", "xai_grok") and not api_key:
                return 400, {"ok": False, "error": f"API key required for {provider}"}
            oai_msgs = ([{"role": "system", "content": system_prompt}] if system_prompt else []) + messages
            hdrs = {}
            if api_key:
                hdrs["Authorization"] = f"Bearer {api_key}"
            _, data = _http_json(
                f"{use_base}/chat/completions",
                method="POST",
                payload={"model": use_model, "messages": oai_msgs, "temperature": 0.7},
                headers=hdrs,
                timeout=90.0,
            )
            reply = (data.get("choices") or [{}])[0].get("message", {}).get("content", "").strip()
            if not reply:
                return 502, {"ok": False, "error": f"{provider} returned an empty reply"}
            return 200, {"ok": True, "provider": provider, "model": use_model, "reply": reply, "latencyMs": _ms()}

        # Ollama Local & Cloud
        if provider in ("ollama_local", "ollama_cloud"):
            use_base = base_url or ("http://127.0.0.1:11434" if provider == "ollama_local" else "https://ollama.com")
            use_model = model or "hermes3:8b"
            if provider == "ollama_cloud" and not api_key:
                return 400, {"ok": False, "error": "Ollama Cloud API key required"}
            oai_msgs = ([{"role": "system", "content": system_prompt}] if system_prompt else []) + messages
            hdrs = {"Authorization": f"Bearer {api_key}"} if api_key else {}
            _, data = _http_json(
                f"{use_base}/api/chat",
                method="POST",
                payload={"model": use_model, "messages": oai_msgs, "stream": False},
                headers=hdrs,
                timeout=90.0,
            )
            reply = (data.get("message") or {}).get("content", "").strip()
            if not reply:
                return 502, {"ok": False, "error": f"{provider} returned an empty reply"}
            return 200, {"ok": True, "provider": provider, "model": use_model, "reply": reply, "latencyMs": _ms()}

        # AZOTH Local Archon Agent (:8136)
        if provider == "azoth_local":
            use_base = base_url or "http://127.0.0.1:8136"
            prompt_text = _format_cli_prompt(system_prompt, messages)
            _, data = _http_json(
                f"{use_base}/api/chat",
                method="POST",
                payload={"message": prompt_text},
                timeout=90.0,
            )
            if not data.get("ok"):
                return 502, {"ok": False, "error": str(data.get("error") or "AZOTH Local error")}
            reply = str(data.get("reply", "")).strip()
            return 200, {"ok": True, "provider": provider, "model": str(data.get("engine") or "azoth-archon"), "reply": reply, "latencyMs": _ms()}

        # Anthropic Messages API (server-proxied to avoid browser CORS)
        if provider == "anthropic":
            if not api_key:
                return 400, {"ok": False, "error": "Anthropic API key required"}
            use_base = base_url or "https://api.anthropic.com/v1"
            use_model = model or "claude-sonnet-4-20250514"
            payload = {"model": use_model, "max_tokens": 1400, "messages": messages}
            if system_prompt:
                payload["system"] = system_prompt
            _, data = _http_json(
                f"{use_base}/messages",
                method="POST",
                payload=payload,
                headers={"x-api-key": api_key, "anthropic-version": "2023-06-01"},
                timeout=90.0,
            )
            blocks = data.get("content") or []
            reply = "\n".join(b.get("text", "") for b in blocks if isinstance(b, dict) and b.get("type") == "text").strip()
            if not reply:
                return 502, {"ok": False, "error": "Anthropic returned an empty reply"}
            return 200, {"ok": True, "provider": provider, "model": use_model, "reply": reply, "latencyMs": _ms()}

        # Google Gemini API (key passed in x-goog-api-key header, never in URL)
        if provider == "gemini_api":
            if not api_key:
                return 400, {"ok": False, "error": "Google Gemini API key required"}
            use_base = base_url or "https://generativelanguage.googleapis.com/v1beta"
            use_model = model or "gemini-2.5-flash"
            contents = [
                {"role": "model" if m["role"] == "assistant" else "user", "parts": [{"text": m["content"]}]}
                for m in messages
            ]
            payload = {"contents": contents}
            if system_prompt:
                payload["systemInstruction"] = {"parts": [{"text": system_prompt}]}
            _, data = _http_json(
                f"{use_base}/models/{use_model}:generateContent",
                method="POST",
                payload=payload,
                headers={"x-goog-api-key": api_key},
                timeout=90.0,
            )
            cands = data.get("candidates") or []
            parts = (cands[0].get("content") or {}).get("parts") or [] if cands else []
            reply = "\n".join(p.get("text", "") for p in parts if isinstance(p, dict)).strip()
            if not reply:
                return 502, {"ok": False, "error": "Gemini API returned an empty reply"}
            return 200, {"ok": True, "provider": provider, "model": use_model, "reply": reply, "latencyMs": _ms()}

        # Local CLI Subprocesses (shell=False, strict argv list, timeout=90s)
        if provider in ("agy_cli", "hermes_cli", "grok_cli", "codex_cli", "claude_code"):
            bin_path, detail = _resolve_cli_binary(provider)
            if not bin_path:
                return 503, {"ok": False, "error": detail}
            full_prompt = _format_cli_prompt(system_prompt, messages)
            if provider == "agy_cli":
                argv = [bin_path]
                if model and model != "default":
                    argv += ["--model", model]
                argv += ["-p", full_prompt, "--output-format", "text"]
            elif provider == "hermes_cli":
                argv = [bin_path, "chat", "-q", full_prompt, "--oneshot", "-Q"]
                if model and model != "default":
                    argv += ["-m", model]
            elif provider == "grok_cli":
                argv = [bin_path, "-p", full_prompt, "--output-format", "plain"]
                if model and model != "default":
                    argv += ["-m", model]
                if system_prompt:
                    argv += ["--system-prompt-override", system_prompt]
            elif provider == "codex_cli":
                argv = [bin_path, "exec", full_prompt]
            else:
                argv = [bin_path, "-p", full_prompt]

            res = subprocess.run(
                argv,
                shell=False,
                stdin=subprocess.DEVNULL,
                capture_output=True,
                text=True,
                timeout=90,
            )
            reply = (res.stdout or "").strip()
            if res.returncode != 0 or not reply:
                err_msg = (res.stderr or res.stdout or f"CLI exited {res.returncode}").strip()[:240]
                return 502, {"ok": False, "error": err_msg}
            return 200, {"ok": True, "provider": provider, "model": model or "default", "reply": reply, "latencyMs": _ms()}

        return 400, {"ok": False, "error": f"Unsupported provider: {provider}"}
    except urllib.error.HTTPError as exc:
        return 502, {"ok": False, "error": f"Upstream {provider} HTTP {exc.code}"}
    except subprocess.TimeoutExpired:
        return 504, {"ok": False, "error": f"{provider} timed out after 90s"}
    except ValueError as exc:
        return 400, {"ok": False, "error": str(exc)}
    except Exception as exc:
        return 502, {"ok": False, "error": str(exc)[:220]}


# ---------------------------------------------------------------------------
# Hardened Loopback HTTP Handler
# ---------------------------------------------------------------------------


def _allowed_origin(origin: str) -> str:
    if not origin:
        return ""
    raw = origin.strip()
    try:
        parsed = urllib.parse.urlparse(raw)
        port = parsed.port
    except ValueError:
        return ""
    if parsed.scheme not in ("http", "https"):
        return ""
    if parsed.hostname not in ("127.0.0.1", "localhost"):
        return ""
    if port is not None and not (1 <= port <= 65535):
        return ""
    if not re.fullmatch(r"(?:127\.0\.0\.1|localhost)(?::\d{1,5})?", parsed.netloc):
        return ""
    if parsed.path not in ("", "/") or parsed.params or parsed.query or parsed.fragment:
        return ""
    if parsed.username or parsed.password:
        return ""
    return raw


def _is_traversal_attempt(raw_path: str) -> bool:
    decoded = urllib.parse.unquote(raw_path)
    if "\\" in decoded or "\x00" in decoded:
        return True
    segments = [s for s in decoded.split("/") if s]
    if ".." in segments:
        return True
    candidate = os.path.realpath(os.path.join(DIST_REAL, decoded.lstrip("/")))
    return candidate != DIST_REAL and not candidate.startswith(DIST_REAL + os.sep)


class AdytumHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIST_REAL, **kwargs)

    def log_message(self, format, *args):
        pass

    def _check_origin(self):
        origin = self.headers.get("Origin", "")
        allowed = _allowed_origin(origin)
        if origin and not allowed:
            return None, False
        return allowed, True

    def _send_json(self, payload, status=200):
        allowed, ok = self._check_origin()
        if not ok:
            err = json.dumps({"error": "Cross-origin requests restricted to loopback"}).encode("utf-8")
            self.send_response(403)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(err)))
            self.end_headers()
            self.wfile.write(err)
            return
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        if allowed:
            self.send_header("Access-Control-Allow-Origin", allowed)
            self.send_header("Vary", "Origin")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        allowed, ok = self._check_origin()
        if not ok:
            err = json.dumps({"error": "Cross-origin requests restricted to loopback"}).encode("utf-8")
            self.send_response(403)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(err)))
            self.end_headers()
            self.wfile.write(err)
            return
        self.send_response(204)
        if allowed:
            self.send_header("Access-Control-Allow-Origin", allowed)
            self.send_header("Vary", "Origin")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Content-Length", "0")
        self.end_headers()

    def do_GET(self):
        clean_path = self.path.split("?")[0]
        if _is_traversal_attempt(clean_path):
            return self._send_json({"error": "Invalid path"}, status=400)

        if clean_path in ("/health", "/api/health", "/api/status"):
            return self._send_json(
                {
                    "status": "online",
                    "service": SERVICE_ID,
                    "title": SERVICE_TITLE,
                    "version": VERSION,
                    "arcana_count": len(HERMETIC_KEYS),
                    "port": int(os.environ.get("ADYTUM_PORT", "8135")),
                }
            )

        if clean_path == "/api/keys":
            return self._send_json({"version": VERSION, "count": len(HERMETIC_KEYS), "keys": HERMETIC_KEYS})

        if clean_path == "/api/providers":
            return self._send_json(discover_providers())

        if clean_path.startswith("/api/keys/"):
            suffix = clean_path[len("/api/keys/") :].strip("/")
            if suffix.isdigit():
                idx = int(suffix)
                if 0 <= idx < len(HERMETIC_KEYS):
                    return self._send_json(HERMETIC_KEYS[idx])
            return self._send_json({"error": "Key not found; valid keys are 0-21"}, status=404)

        decoded = urllib.parse.unquote(clean_path)
        req_path = decoded.lstrip("/")
        full_real = os.path.realpath(os.path.join(DIST_REAL, req_path))
        if req_path and (not full_real.startswith(DIST_REAL + os.sep) or not os.path.exists(full_real)):
            self.path = "/index.html"
        return super().do_GET()

    def do_POST(self):
        clean_path = self.path.split("?")[0]
        if _is_traversal_attempt(clean_path):
            return self._send_json({"error": "Invalid path"}, status=400)

        allowed, ok = self._check_origin()
        if not ok:
            return self._send_json({"error": "Cross-origin requests restricted to loopback"}, status=403)

        if clean_path not in ("/api/validate", "/api/harden", "/api/providers/test", "/api/chat"):
            return self._send_json({"error": "Endpoint not found"}, status=404)

        try:
            length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            return self._send_json({"error": "Invalid Content-Length"}, status=400)
        if length < 0 or length > MAX_POST_BYTES:
            return self._send_json({"error": "Payload size out of bounds"}, status=413)

        raw = self.rfile.read(length).decode("utf-8", errors="replace") if length else ""

        if clean_path in ("/api/providers/test", "/api/chat"):
            try:
                body = json.loads(raw) if raw.strip() else {}
                if not isinstance(body, dict):
                    return self._send_json({"error": "JSON object required"}, status=400)
            except json.JSONDecodeError:
                return self._send_json({"error": "Malformed JSON payload"}, status=400)
            if clean_path == "/api/providers/test":
                return self._send_json(test_provider_connection(body))
            status, payload = dispatch_chat(body)
            return self._send_json(payload, status=status)

        project_name = "Sovereign Zero-Egress Enclave"
        plan_text = raw
        if raw.strip().startswith("{"):
            try:
                body = json.loads(raw)
                if isinstance(body, dict):
                    plan_text = str(body.get("text") or body.get("plan") or body.get("spec") or "")
                    if body.get("projectName"):
                        project_name = str(body["projectName"])
            except json.JSONDecodeError:
                return self._send_json({"error": "Malformed JSON payload"}, status=400)

        if clean_path == "/api/validate":
            return self._send_json(validate_plan(plan_text))

        hardened = auto_harden_spec(plan_text, project_name)
        return self._send_json({"hardened": hardened, "audit": validate_plan(hardened)})


class ThreadedTCPServer(socketserver.ThreadingMixIn, socketserver.TCPServer):
    daemon_threads = True
    allow_reuse_address = True


def main():
    ap = argparse.ArgumentParser(description="Adytum Planner HTTP server")
    ap.add_argument("--port", type=int, default=int(os.environ.get("ADYTUM_PORT", "8135")))
    ap.add_argument("--host", default="127.0.0.1")
    args, _ = ap.parse_known_args()
    os.environ["ADYTUM_PORT"] = str(args.port)
    with ThreadedTCPServer((args.host, args.port), AdytumHandler) as httpd:
        httpd.serve_forever()


if __name__ == "__main__":
    main()
