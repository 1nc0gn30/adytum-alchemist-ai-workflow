#!/usr/bin/env python3
"""
Adytum Sanctuary 3D — 22 Major Arcana Interactive Tarot & Esoteric 3D Diorama Server
Engineered by 1nc0gn30 (@1nc0gn30) • NullAI Platform
"""
import argparse
import http.server
import json
import os
import socketserver

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
DIST_DIR = os.path.join(ROOT_DIR, "dist") if os.path.isdir(os.path.join(ROOT_DIR, "dist")) else os.path.join(ROOT_DIR, "public")

class AdytumHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIST_DIR, **kwargs)

    def log_message(self, format, *args):
        pass

    def _send_json(self, payload, status=200):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path in ("/health", "/api/health", "/api/status"):
            return self._send_json({
                "status": "online",
                "service": "adytum-alchemist-ai-workflow",
                "title": "Adytum Sanctuary 3D (22 Major Arcana)",
                "arcana_count": 22,
                "port": 8135
            })
        # SPA fallback
        req_path = self.path.split("?")[0].lstrip("/")
        full_path = os.path.join(DIST_DIR, req_path)
        if req_path and not os.path.exists(full_path):
            self.path = "/index.html"
        return super().do_GET()

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--port", type=int, default=8135)
    args, _ = ap.parse_known_args()
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("127.0.0.1", args.port), AdytumHandler) as httpd:
        httpd.serve_forever()

if __name__ == "__main__":
    main()
