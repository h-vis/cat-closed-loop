from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import base64
import json
import re
import sys
import time


ROOT = Path(__file__).resolve().parent
SCREENSHOT_DIR = ROOT / "screenshot"


class MakerRequestHandler(SimpleHTTPRequestHandler):
    def do_POST(self):
        if self.path != "/save-screenshot":
            self.send_error(404, "Not found")
            return

        try:
            content_length = int(self.headers.get("Content-Length", "0"))
            payload = json.loads(self.rfile.read(content_length).decode("utf-8"))
            data_url = payload.get("imageData", "")
            stage_number = str(payload.get("stageNumber", "stage"))
            match = re.fullmatch(r"data:image/png;base64,(.+)", data_url)
            if not match:
                raise ValueError("imageData must be a PNG data URL")

            safe_stage = re.sub(r"[^0-9A-Za-z_-]+", "-", stage_number).strip("-") or "stage"
            timestamp = time.strftime("%Y%m%d-%H%M%S")
            file_name = f"closed-loop-{safe_stage}-{timestamp}.png"
            SCREENSHOT_DIR.mkdir(parents=True, exist_ok=True)
            file_path = SCREENSHOT_DIR / file_name
            file_path.write_bytes(base64.b64decode(match.group(1)))

            body = json.dumps(
                {"ok": True, "fileName": file_name, "path": str(file_path)},
                ensure_ascii=False,
            ).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
        except Exception as error:
            body = json.dumps({"ok": False, "error": str(error)}).encode("utf-8")
            self.send_response(400)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8010
    server = ThreadingHTTPServer(("127.0.0.1", port), MakerRequestHandler)
    print(f"Serving maker at http://127.0.0.1:{port}/maker.html", flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
