from __future__ import annotations

import argparse
import socket
import threading
import webbrowser
from http.server import ThreadingHTTPServer
from pathlib import Path

if __package__:
    from scripts.editorial import (
        EditorialStore,
        PasswordAuth,
        SessionManager,
        create_editorial_handler,
    )
else:
    from editorial import (
        EditorialStore,
        PasswordAuth,
        SessionManager,
        create_editorial_handler,
    )


def local_ipv4() -> str | None:
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as sock:
            sock.connect(("8.8.8.8", 80))
            return str(sock.getsockname()[0])
    except OSError:
        return None


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="MI Intelligence Portal local server")
    parser.add_argument("--host", default="0.0.0.0")
    parser.add_argument("--port", type=int, default=8000)
    parser.add_argument("--open", action="store_true", dest="open_browser")
    return parser.parse_args()


def create_dashboard_server(
    package_root: Path, host: str, port: int
) -> ThreadingHTTPServer:
    package_root = Path(package_root).resolve()
    site_root = package_root / "site"
    index_file = site_root / "index.html"
    defaults_path = package_root / "editorial-defaults.json"
    runtime_dir = package_root / "runtime" / "editorial"

    if not index_file.is_file():
        raise SystemExit(f"대시보드 파일을 찾을 수 없습니다: {index_file}")

    store = EditorialStore(defaults_path, runtime_dir)
    handler = create_editorial_handler(
        site_root,
        store,
        PasswordAuth(runtime_dir / "auth.json"),
        SessionManager(),
    )
    return ThreadingHTTPServer((host, port), handler)


def main() -> None:
    args = parse_args()
    package_root = Path(__file__).resolve().parent.parent
    server = create_dashboard_server(package_root, args.host, args.port)
    local_url = f"http://localhost:{args.port}"
    lan_ip = local_ipv4()

    print("\nMI Intelligence Portal이 실행되었습니다.")
    print(f"내 PC: {local_url}")
    if lan_ip and args.host == "0.0.0.0":
        print(f"같은 사내망: http://{lan_ip}:{args.port}")
    print("종료하려면 이 창에서 Ctrl+C를 누르세요.\n")

    if args.open_browser:
        threading.Timer(0.5, lambda: webbrowser.open(local_url)).start()

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n대시보드를 종료합니다.")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
