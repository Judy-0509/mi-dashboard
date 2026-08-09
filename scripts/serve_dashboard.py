from __future__ import annotations

import argparse
import os
import socket
import threading
import webbrowser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


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


def main() -> None:
    args = parse_args()
    package_root = Path(__file__).resolve().parent.parent
    site_root = package_root / "site"
    index_file = site_root / "index.html"

    if not index_file.is_file():
        raise SystemExit(f"대시보드 파일을 찾을 수 없습니다: {index_file}")

    os.chdir(site_root)
    server = ThreadingHTTPServer((args.host, args.port), SimpleHTTPRequestHandler)
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
