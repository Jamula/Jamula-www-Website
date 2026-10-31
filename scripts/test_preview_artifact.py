import json
import stat
import tempfile
import unittest
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile, ZipInfo

from validate_preview_artifact import MAX_BYTES, extract_preview


class PreviewArtifactTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name)
        self.config = {"globalHeaders": {"X-Frame-Options": "DENY"}}
        self.trusted = self.root / "trusted.json"
        self.trusted.write_text(json.dumps(self.config), encoding="utf-8")

    def archive(self, extra=None, config=None):
        archive = self.root / "site.zip"
        with ZipFile(archive, "w", compression=ZIP_DEFLATED) as bundle:
            bundle.writestr("index.html", "<title>Jamula</title>")
            bundle.writestr("404.html", "Page not found")
            bundle.writestr("robots.txt", "User-agent: *")
            bundle.writestr("staticwebapp.config.json", json.dumps(config or self.config))
            for name, value in extra or []:
                if isinstance(name, str):
                    entry = ZipInfo("placeholder")
                    entry.filename = name
                    entry.orig_filename = name
                    entry.compress_type = ZIP_DEFLATED
                    name = entry
                bundle.writestr(name, value)
        return archive

    def test_valid_static_files_are_extracted(self):
        archive = self.archive([("assets/site.js", "console.log('static content')")])
        destination = self.root / "dist"
        extract_preview(archive, destination, self.trusted)
        self.assertEqual(
            (destination / "assets/site.js").read_text(), "console.log('static content')"
        )

    def test_unsafe_paths_are_rejected_before_any_extraction(self):
        for name in ("../escape", "/escape", "a/../../escape", "a\\escape", "C:/escape", "a//b"):
            with self.subTest(name=name):
                archive = self.archive([(name, "bad")])
                destination = self.root / "dist"
                with self.assertRaises(ValueError):
                    extract_preview(archive, destination, self.trusted)
                self.assertFalse(destination.exists())

    def test_symlinks_are_rejected(self):
        entry = ZipInfo("link")
        entry.create_system = 3
        entry.external_attr = (stat.S_IFLNK | 0o777) << 16
        with self.assertRaisesRegex(ValueError, "non-regular"):
            extract_preview(self.archive([(entry, "../escape")]), self.root / "dist", self.trusted)

    def test_case_colliding_paths_are_rejected(self):
        with self.assertRaisesRegex(ValueError, "duplicated"):
            extract_preview(
                self.archive([("INDEX.HTML", "bad")]), self.root / "dist", self.trusted
            )

    def test_changed_configuration_is_rejected(self):
        with self.assertRaisesRegex(ValueError, "trusted default branch"):
            extract_preview(
                self.archive(config={"navigationFallback": {"rewrite": "/index.html"}}),
                self.root / "dist",
                self.trusted,
            )

    def test_expanded_size_limit_is_enforced(self):
        with self.assertRaisesRegex(ValueError, "expanded"):
            extract_preview(
                self.archive([("large.txt", b"x" * MAX_BYTES)]), self.root / "dist", self.trusted
            )

    def test_missing_required_files_are_rejected(self):
        archive = self.root / "empty.zip"
        with ZipFile(archive, "w") as bundle:
            bundle.writestr("index.html", "incomplete")
        with self.assertRaisesRegex(ValueError, "required static files"):
            extract_preview(archive, self.root / "dist", self.trusted)

    def test_existing_files_are_not_overwritten(self):
        destination = self.root / "dist"
        destination.mkdir()
        existing = destination / "index.html"
        existing.write_text("existing", encoding="utf-8")
        with self.assertRaisesRegex(ValueError, "destination must be empty"):
            extract_preview(self.archive(), destination, self.trusted)
        self.assertEqual(existing.read_text(), "existing")


if __name__ == "__main__":
    unittest.main()
