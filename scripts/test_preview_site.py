import io
import json
import unittest
from email.message import Message
from pathlib import Path
from unittest.mock import patch
from urllib.error import HTTPError, URLError

from verify_preview_site import NoRedirects, verify_preview


URL = "https://ashy-beach-033c7d01e-74.7.azurestaticapps.net"


class Response:
    def __init__(self, headers, body=b""):
        self.headers = headers
        self.body = body

    def __enter__(self):
        return self

    def __exit__(self, *arguments):
        return False

    def read(self, limit):
        return self.body[:limit]

    def close(self):
        pass


class PreviewSiteTests(unittest.TestCase):
    def fixture(self):
        config = json.loads(
            (Path(__file__).resolve().parents[1] / "www/public/staticwebapp.config.json").read_text(
                encoding="utf-8"
            )
        )
        headers = Message()
        for name, value in config["globalHeaders"].items():
            headers[name] = value
        headers["Strict-Transport-Security"] = "max-age=31536000"
        headers["X-Robots-Tag"] = "none"
        robots = Message()
        robots["Content-Type"] = "text/plain; charset=utf-8"
        responses = [
            Response(headers, b"<title>Jamula</title>"),
            Response(robots),
            HTTPError(URL, 404, "not found", Message(), io.BytesIO(b"Page not found")),
        ]
        opener = unittest.mock.Mock()
        opener.open.side_effect = responses
        return opener, headers, robots, responses

    def test_verifies_live_preview_contract(self):
        opener, _, _, _ = self.fixture()
        with patch("verify_preview_site.build_opener", return_value=opener):
            verify_preview(URL)
        self.assertEqual(opener.open.call_count, 3)
        self.assertEqual(opener.open.call_args_list[0].args[0], URL + "/")

    def test_production_and_external_urls_are_rejected_without_requests(self):
        for url in (
            "https://ashy-beach-033c7d01e.7.azurestaticapps.net",
            "https://jamula.net",
            "http://ashy-beach-033c7d01e-74.7.azurestaticapps.net",
            URL + "?redirect=elsewhere",
            URL + ".evil.example",
        ):
            with self.subTest(url=url), patch("verify_preview_site.build_opener") as build:
                with self.assertRaises(ValueError):
                    verify_preview(url)
                build.assert_not_called()

    def test_missing_noindex_fails(self):
        opener, headers, _, _ = self.fixture()
        del headers["X-Robots-Tag"]
        with patch("verify_preview_site.build_opener", return_value=opener):
            with self.assertRaisesRegex(ValueError, "X-Robots-Tag"):
                verify_preview(URL)

    def test_changed_security_header_fails(self):
        opener, headers, _, _ = self.fixture()
        headers.replace_header("X-Frame-Options", "SAMEORIGIN")
        with patch("verify_preview_site.build_opener", return_value=opener):
            with self.assertRaisesRegex(ValueError, "X-Frame-Options"):
                verify_preview(URL)

    def test_wrong_robots_mime_type_fails(self):
        opener, _, robots, _ = self.fixture()
        robots.replace_header("Content-Type", "text/html")
        with patch("verify_preview_site.build_opener", return_value=opener):
            with self.assertRaisesRegex(ValueError, "MIME type"):
                verify_preview(URL)

    def test_missing_route_success_is_not_accepted(self):
        opener, _, _, responses = self.fixture()
        responses[-1] = Response(Message(), b"Page not found")
        with patch("verify_preview_site.build_opener", return_value=opener):
            with self.assertRaisesRegex(ValueError, "did not return 404"):
                verify_preview(URL)

    def test_readiness_failures_are_bounded_and_visible(self):
        opener = unittest.mock.Mock()
        opener.open.side_effect = URLError("not ready")
        with (
            patch("verify_preview_site.build_opener", return_value=opener),
            patch("verify_preview_site.time.sleep") as sleep,
            patch("sys.stderr", new_callable=io.StringIO) as errors,
        ):
            with self.assertRaises(URLError):
                verify_preview(URL)
            self.assertEqual(opener.open.call_count, 18)
            self.assertEqual(sleep.call_count, 17)
            self.assertIn("attempt 18 failed", errors.getvalue())

    def test_redirects_are_never_followed(self):
        self.assertIsNone(NoRedirects().redirect_request(None, None, 302, "", {}, "https://evil"))


if __name__ == "__main__":
    unittest.main()
