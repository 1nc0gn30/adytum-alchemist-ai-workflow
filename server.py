#!/usr/bin/env python3
"""
Adytum Sanctuary 3D — 22 Major Arcana Study Workstation Daemon
Engineered by 1nc0gn30 (@1nc0gn30) • NullAI Platform
"""
import argparse
import http.server
import json
import os
import socketserver

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
DIST_DIR = (
    os.path.join(ROOT_DIR, "dist")
    if os.path.isdir(os.path.join(ROOT_DIR, "dist"))
    else os.path.join(ROOT_DIR, "public")
)
LOOPBACK_ORIGINS = {"http://127.0.0.1", "http://localhost", "https://127.0.0.1", "https://localhost"}


def _allowed_origin(origin: str) -> str:
    if not origin:
        return ""
    base = ":".join(origin.split(":")[:2])
    return origin if base in LOOPBACK_ORIGINS else ""


class AdytumHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIST_DIR, **kwargs)

    def log_message(self, format, *args):
        pass

    def _send_json(self, payload, status=200):
        body = json.dumps(payload).encode("utf-8")
        origin = self.headers.get("Origin", "")
        allowed = _allowed_origin(origin)
        if origin and not allowed:
            err = json.dumps({"error": "Cross-origin requests restricted to loopback"}).encode("utf-8")
            self.send_response(403)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(err)))
            self.end_headers()
            self.wfile.write(err)
            return
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        if allowed:
            self.send_header("Access-Control-Allow-Origin", allowed)
            self.send_header("Vary", "Origin")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        clean_path = self.path.split("?")[0]
        if clean_path in ("/health", "/api/health", "/api/status"):
            return self._send_json(
                {
                    "status": "online",
                    "service": "adytum-alchemist-ai-workflow",
                    "title": "Adytum Sanctuary 3D (22 Major Arcana)",
                    "arcana_count": 22,
                    "port": int(os.environ.get("ADYTUM_PORT", "8135")),
                }
            )
        req_path = clean_path.lstrip("/")
        full_path = os.path.join(DIST_DIR, req_path)
        if req_path and not os.path.exists(full_path):
            self.path = "/index.html"
        return super().do_GET()


def main():
    ap = argparse.ArgumentParser(description="Adytum Sanctuary HTTP server")
    ap.add_argument("--port", type=int, default=int(os.environ.get("ADYTUM_PORT", "8135")))
    ap.add_argument("--host", default="127.0.0.1")
    args, _ = ap.parse_known_args()
    os.environ["ADYTUM_PORT"] = str(args.port)
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer((args.host, args.port), AdytumHandler) as httpd:
        httpd.serve_forever()


if __name__ == "__main__":
    main()
