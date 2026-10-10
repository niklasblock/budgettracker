import socket
import sys
import threading
import time
import urllib.request

import uvicorn

from app.main import app as fastapi_app

PREFERRED_PORT = 8000


def log(message: str) -> None:
    try:
        print(message, flush=True)
    except Exception:
        pass  # windowed app without stdout


def port_is_free(port: int) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(("127.0.0.1", port)) != 0


def pick_port() -> int:
    """Use port 8000 if free, otherwise any free port (e.g. another instance is running)"""
    if port_is_free(PREFERRED_PORT):
        return PREFERRED_PORT
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


def wait_for_server(port: int, timeout: float = 15.0) -> bool:
    """Poll /health until the server answers instead of sleeping a fixed time"""
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            with urllib.request.urlopen(f"http://127.0.0.1:{port}/health", timeout=1) as r:
                if r.status == 200:
                    return True
        except Exception:
            time.sleep(0.2)
    return False


def main() -> None:
    import webview

    port = pick_port()
    if port != PREFERRED_PORT:
        log(f"Port {PREFERRED_PORT} ist belegt (läuft noch eine andere Instanz?) - nutze Port {port}.")

    server = uvicorn.Server(uvicorn.Config(fastapi_app, host="127.0.0.1", port=port))
    threading.Thread(target=server.run, daemon=True).start()

    if not wait_for_server(port):
        webview.create_window(
            title="Budget Tracker",
            html="<body style='font-family:sans-serif;padding:2rem'>"
                 "<h3>Server konnte nicht gestartet werden</h3>"
                 "<p>Bitte alle Budget-Tracker-Instanzen beenden und erneut starten.</p></body>",
            width=500, height=250,
        )
        webview.start()
        sys.exit(1)

    webview.create_window(
        title="Budget Tracker",
        url=f"http://127.0.0.1:{port}/static/index.html",
        width=1000,
        height=700,
        min_size=(800, 600),
    )
    webview.start()


if __name__ == "__main__":
    main()
