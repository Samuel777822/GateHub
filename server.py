"""GateHub local server — serves the app at http://localhost:5173 (this laptop only).

Started automatically by GateHub.vbs. Run by hand with:  py server.py
"""
import http.server, os, socket, sys, threading
from functools import partial
from pathlib import Path

ROOT = Path(__file__).resolve().parent
PORT = int(os.environ.get("PORT", "5173"))

class Handler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        ".js": "application/javascript", ".mjs": "application/javascript",
        ".json": "application/json", ".webmanifest": "application/manifest+json",
        ".svg": "image/svg+xml", ".ico": "image/x-icon", ".png": "image/png", ".jpg": "image/jpeg",
    }
    def end_headers(self):
        p = self.path.split("?")[0]
        if not p.startswith("/data/img/") and not p.startswith("/assets/"):
            self.send_header("Cache-Control", "no-cache")
        super().end_headers()
    def log_message(self, *args):
        pass  # stay quiet

class V6Server(http.server.ThreadingHTTPServer):
    address_family = socket.AF_INET6

def main():
    handler = partial(Handler, directory=str(ROOT))
    servers = []
    try:
        servers.append(http.server.ThreadingHTTPServer(("127.0.0.1", PORT), handler))
    except OSError:
        sys.exit(0)  # already running
    try:
        servers.append(V6Server(("::1", PORT), handler))
    except OSError:
        pass  # IPv6 loopback unavailable — IPv4 is enough
    for s in servers[1:]:
        threading.Thread(target=s.serve_forever, daemon=True).start()
    servers[0].serve_forever()

if __name__ == "__main__":
    main()
