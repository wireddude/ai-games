#!/usr/bin/env python3
"""
Solar System Lab — local server with live program discovery.

Run:
    python3 server.py            # serves on http://localhost:8000
    python3 server.py 9000       # serves on http://localhost:9000

What it does:
  * Serves every file in this folder (so the simulators work).
  * Exposes /manifest.json — a live list of all .html programs in the folder,
    re-scanned on every request. Drop a new .html file in and it appears
    automatically (the menu also polls this endpoint).
  * Serves index.html at the root.

No dependencies — uses only the Python standard library.
"""
import json
import os
import re
import sys
import time
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

ROOT = os.path.dirname(os.path.abspath(__file__))
TITLE_RE = re.compile(r"<title[^>]*>(.*?)</title>", re.I | re.S)


def discover():
    """Scan ROOT for .html files (excluding index.html) and return a manifest."""
    items = []
    for fn in sorted(os.listdir(ROOT)):
        if not fn.lower().endswith(".html") or fn.lower() == "index.html":
            continue
        path = os.path.join(ROOT, fn)
        if not os.path.isfile(path):
            continue
        title = fn
        try:
            with open(path, "r", encoding="utf-8", errors="ignore") as fh:
                head = fh.read(8192)
            m = TITLE_RE.search(head)
            if m:
                title = m.group(1).strip()
        except OSError:
            pass
        st = os.stat(path)
        items.append(
            {
                "name": fn,
                "title": title,
                "size": st.st_size,
                "modified": int(st.st_mtime),
            }
        )
    return items


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def do_GET(self):
        path = self.path.split("?", 1)[0]
        if path in ("/manifest.json", "/api/manifest"):
            self._send_json(discover())
            return
        if path == "/":
            self.path = "/index.html"
        super().do_GET()

    def _send_json(self, data):
        body = json.dumps(data).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, fmt, *args):
        sys.stderr.write("[%s] %s\n" % (time.strftime("%H:%M:%S"), fmt % args))


def main():
    port = 8000
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            pass
    server = ThreadingHTTPServer(("0.0.0.0", port), Handler)
    print("Solar System Lab running at http://localhost:%d" % port)
    print("Drop new .html files into the folder — they appear automatically.")
    print("Press Ctrl+C to stop.")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down.")
        server.server_close()


if __name__ == "__main__":
    main()
