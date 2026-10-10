"""Local harness for the UI (repository only; not uploaded to Qollab).

Serves the repository and answers the Python calls that Qollab would answer in the browser:
``main.js`` imports ``bellkit.app``; the harness page maps that import to ``shim_app.js``,
which POSTs each call here. The backend is a real local simulator chosen with
``?backend=basic_simulator`` (default) or ``?backend=fake_fez`` (IBM Fez noise model).
IonQ backends need Qollab (or an IonQ API key) and are not emulated.

Usage: python tools/devserver/server.py [--port 8765] [--out DIR]
Then open http://127.0.0.1:8765/tools/devserver/dev.html
"""

from __future__ import annotations

import argparse
import functools
import json
import sys
import traceback
import types
from http.server import HTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from typing import ClassVar

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))


def make_backend(name: str):
    if name == "basic_simulator":
        from qiskit.providers.basic_provider import BasicSimulator

        return BasicSimulator()
    if name == "fake_fez":
        from qiskit_ibm_runtime.fake_provider import FakeFez

        return FakeFez()
    raise ValueError(f"backend {name!r} is not available in the local harness")


def install_fake_js(out_dir: Path) -> None:
    """Stand-in for Qollab's ``js.sendFile``: writes the file to ``out_dir``."""

    def send_file(name, mime, data):
        out_dir.mkdir(parents=True, exist_ok=True)
        path = out_dir / Path(name).name
        if isinstance(data, bytes):
            path.write_bytes(data)
        else:
            path.write_text(str(data), encoding="utf-8")
        print(f"sendFile -> {path} ({mime})")

    sys.modules["js"] = types.SimpleNamespace(sendFile=send_file)


class Handler(SimpleHTTPRequestHandler):
    backends: ClassVar[dict] = {}

    def log_message(self, fmt, *args):  # quieter console
        if args and "/call/" in str(args[0]):
            sys.stderr.write(f"{self.address_string()} {fmt % args}\n")

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def do_POST(self):
        if not self.path.startswith("/call/"):
            self.send_error(404)
            return
        from bellkit import app

        fn = self.path.removeprefix("/call/")
        body = json.loads(self.rfile.read(int(self.headers.get("Content-Length", 0))) or b"{}")
        args = []
        for a in body.get("args", []):
            if isinstance(a, dict) and "__backend__" in a:
                name = a["__backend__"]
                if name not in self.backends:
                    self.backends[name] = make_backend(name)
                args.append(self.backends[name])
            else:
                args.append(a)
        try:
            if fn.startswith("_") or not callable(getattr(app, fn, None)):
                raise AttributeError(f"no function {fn}")
            out = {"ok": True, "value": getattr(app, fn)(*args)}
        except Exception:
            out = {"ok": False, "error": traceback.format_exc()}
        data = json.dumps(out).encode()
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)


def main() -> None:
    parser = argparse.ArgumentParser(description="Bell-Test Lab local harness")
    parser.add_argument("--port", type=int, default=8765)
    parser.add_argument("--out", type=Path, default=ROOT / "dist" / "sent_files")
    args = parser.parse_args()
    install_fake_js(args.out)
    handler = functools.partial(Handler, directory=str(ROOT))
    # Single-threaded on purpose: Qiskit's Rust extension crashed when called from a worker thread.
    server = HTTPServer(("127.0.0.1", args.port), handler)
    print(f"http://127.0.0.1:{args.port}/tools/devserver/dev.html")
    server.serve_forever()


if __name__ == "__main__":
    main()
