from __future__ import annotations

import json
import re
import sys
import time
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlparse
from urllib.request import HTTPRedirectHandler, build_opener


class NoRedirects(HTTPRedirectHandler):
    def redirect_request(self, request, response, code, message, headers, new_url):
        return None


def verify_preview(url: str) -> None:
    parsed = urlparse(url)
    if (
        parsed.scheme != "https"
        or not re.fullmatch(r"ashy-beach-033c7d01e-[1-9][0-9]*\.7\.azurestaticapps\.net", parsed.netloc)
        or parsed.path not in ("", "/")
        or parsed.query
        or parsed.fragment
    ):
        raise ValueError("Only an isolated Jamula PR preview URL may be verified.")
    opener = build_opener(NoRedirects)
    base = url.rstrip("/")
    for attempt in range(18):
        try:
            with opener.open(f"{base}/", timeout=20) as response:
                headers = response.headers
                home = response.read(5 * 1024 * 1024).decode("utf-8")
            break
        except (HTTPError, URLError, TimeoutError) as error:
            print(f"Preview readiness attempt {attempt + 1} failed: {error}", file=sys.stderr)
            if attempt == 17:
                raise
            time.sleep(10)
    expected = json.loads(
        (Path(__file__).resolve().parents[1] / "www/public/staticwebapp.config.json").read_text(
            encoding="utf-8"
        )
    )
    if not re.search(r"<title>[^<]*Jamula", home, re.IGNORECASE):
        raise ValueError("The preview home page has an unexpected title.")
    for name, value in expected["globalHeaders"].items():
        if headers.get(name) != value:
            raise ValueError(f"The preview has an unexpected {name} header.")
    if not headers.get("Strict-Transport-Security"):
        raise ValueError("The preview does not enforce HSTS.")
    if "none" not in headers.get("X-Robots-Tag", "").lower():
        raise ValueError("The preview does not enforce X-Robots-Tag: none.")
    with opener.open(f"{base}/robots.txt", timeout=20) as response:
        if response.headers.get_content_type() != "text/plain":
            raise ValueError("The preview robots.txt MIME type is not text/plain.")
    try:
        opener.open(f"{base}/__jamula_missing_route__", timeout=20).close()
    except HTTPError as error:
        if error.code != 404 or b"Page not found" not in error.read(5 * 1024 * 1024):
            raise ValueError("The preview does not serve the expected 404 page.") from error
    else:
        raise ValueError("The preview missing route did not return 404.")
    print("Live preview headers, noindex, robots MIME type, and 404 response verified.")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit("Usage: verify_preview_site.py HTTPS_PREVIEW_URL")
    verify_preview(sys.argv[1])
