#!/usr/bin/env python3
"""
Adytum Planner — 22-Key Hermetic AI Workbench Daemon (:8135)
Engineered by Neal Frazier Tech (@1nc0gn30) • NullAI Platform
"""
import argparse
import http.server
import json
import os
import re
import socketserver
import urllib.parse

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
MAX_POST_BYTES = 262_144  # 256 KB

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
            # Split at clause/sentence breaks so earlier sentences do not negate later ones.
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


def _allowed_origin(origin: str) -> str:
    if not origin:
        return ""
    raw = origin.strip()
    try:
        parsed = urllib.parse.urlparse(raw)
        port = parsed.port  # raises ValueError on malformed ports like :8135.evil.com
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

        if clean_path not in ("/api/validate", "/api/harden"):
            return self._send_json({"error": "Endpoint not found"}, status=404)

        try:
            length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            return self._send_json({"error": "Invalid Content-Length"}, status=400)
        if length < 0 or length > MAX_POST_BYTES:
            return self._send_json({"error": "Payload size out of bounds"}, status=413)

        raw = self.rfile.read(length).decode("utf-8", errors="replace") if length else ""
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


def main():
    ap = argparse.ArgumentParser(description="Adytum Planner HTTP server")
    ap.add_argument("--port", type=int, default=int(os.environ.get("ADYTUM_PORT", "8135")))
    ap.add_argument("--host", default="127.0.0.1")
    args, _ = ap.parse_known_args()
    os.environ["ADYTUM_PORT"] = str(args.port)
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer((args.host, args.port), AdytumHandler) as httpd:
        httpd.serve_forever()


if __name__ == "__main__":
    main()
