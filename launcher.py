"""Cross-platform launcher for Redact PII.

Usage:
    uv run python launcher.py            # default port 8000
    uv run python launcher.py --port 9001

Behaviour:
    1. Builds the frontend if `frontend/dist` is missing (npm required).
    2. Starts Uvicorn on 127.0.0.1:<port>.
    3. Waits for /api/health and opens the default browser.
    4. Ctrl+C performs a clean shutdown.
"""
from __future__ import annotations

import argparse
import shutil
import subprocess
import sys
import threading
import time
import urllib.error
import urllib.request
import webbrowser
from pathlib import Path

ROOT = Path(__file__).resolve().parent
FRONTEND = ROOT / "frontend"
DIST = FRONTEND / "dist"


def log(msg: str) -> None:
    print(f"\033[36m[redactpii]\033[0m {msg}", flush=True)


def err(msg: str) -> None:
    print(f"\033[31m[redactpii]\033[0m {msg}", file=sys.stderr, flush=True)


def have(cmd: str) -> bool:
    return shutil.which(cmd) is not None


def ensure_frontend_build() -> None:
    if DIST.exists() and any(DIST.iterdir()):
        return
    if not have("npm"):
        err(
            "Node.js / npm no encontrado. Instálalo desde https://nodejs.org "
            "para poder construir la interfaz."
        )
        sys.exit(1)
    log("Compilando la interfaz (primer arranque, puede tardar un minuto)…")
    subprocess.check_call(["npm", "install"], cwd=FRONTEND, shell=False)
    subprocess.check_call(["npm", "run", "build"], cwd=FRONTEND, shell=False)


def wait_and_open(url: str, timeout: float = 30.0) -> None:
    deadline = time.time() + timeout
    health = f"{url}/api/health"
    while time.time() < deadline:
        try:
            with urllib.request.urlopen(health, timeout=1) as r:
                if r.status == 200:
                    log(f"Abriendo {url} en el navegador…")
                    webbrowser.open(url)
                    return
        except (urllib.error.URLError, ConnectionError, TimeoutError):
            time.sleep(0.3)
    err("El servidor no respondió a tiempo. Abre el navegador manualmente.")


def main() -> int:
    parser = argparse.ArgumentParser(description="Lanzador de Redact PII")
    parser.add_argument("--port", type=int, default=8000)
    parser.add_argument(
        "--no-browser", action="store_true", help="No abrir el navegador"
    )
    args = parser.parse_args()

    ensure_frontend_build()

    url = f"http://127.0.0.1:{args.port}"

    if not args.no_browser:
        threading.Thread(target=wait_and_open, args=(url,), daemon=True).start()

    log(f"Sirviendo en {url} — pulsa Ctrl+C para detener")
    try:
        import uvicorn

        uvicorn.run(
            "backend.main:app",
            host="127.0.0.1",
            port=args.port,
            log_level="warning",
        )
    except KeyboardInterrupt:
        log("Detenido.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
