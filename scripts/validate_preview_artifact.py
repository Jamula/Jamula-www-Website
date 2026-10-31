from __future__ import annotations

import json
import shutil
import stat
import sys
from pathlib import Path, PurePosixPath
from zipfile import ZipFile


MAX_BYTES = 100 * 1024 * 1024
MAX_FILES = 20000


def extract_preview(archive: Path, destination: Path, trusted_config: Path) -> None:
    if destination.exists() and (destination.is_symlink() or any(destination.iterdir())):
        raise ValueError("The extraction destination must be empty and not a symlink.")
    if archive.stat().st_size > MAX_BYTES:
        raise ValueError("The compressed preview artifact exceeds the size limit.")
    expected_config = json.loads(trusted_config.read_text(encoding="utf-8"))
    with ZipFile(archive) as bundle:
        entries = bundle.infolist()
        if not entries or len(entries) > MAX_FILES:
            raise ValueError("The preview artifact has an invalid file count.")
        if sum(entry.file_size for entry in entries) > MAX_BYTES:
            raise ValueError("The expanded preview artifact exceeds the size limit.")
        seen: set[str] = set()
        files = []
        for entry in entries:
            name = entry.orig_filename
            relative = PurePosixPath(name)
            if (
                not name
                or "\\" in name
                or ":" in name
                or any(ord(character) < 32 for character in name)
                or relative.is_absolute()
                or any(part in (".", "..") for part in name.rstrip("/").split("/"))
                or "//" in name
                or name.casefold().rstrip("/") in seen
            ):
                raise ValueError(f"Unsafe or duplicated artifact path: {name!r}")
            seen.add(name.casefold().rstrip("/"))
            mode = entry.external_attr >> 16
            kind = stat.S_IFMT(mode)
            if entry.flag_bits & 1 or kind not in (0, stat.S_IFREG, stat.S_IFDIR):
                raise ValueError(f"Encrypted or non-regular artifact entry: {name!r}")
            if not entry.is_dir():
                files.append(entry)
        names = {entry.filename for entry in files}
        if not {"index.html", "404.html", "robots.txt", "staticwebapp.config.json"} <= names:
            raise ValueError("The preview artifact is missing required static files.")
        observed_config = json.loads(bundle.read("staticwebapp.config.json"))
        if observed_config != expected_config:
            raise ValueError("Preview configuration differs from the trusted default branch.")
        destination.mkdir(parents=True, exist_ok=True)
        for entry in files:
            target = destination.joinpath(*PurePosixPath(entry.filename).parts)
            target.parent.mkdir(parents=True, exist_ok=True)
            with bundle.open(entry) as source, target.open("xb") as output:
                shutil.copyfileobj(source, output)


if __name__ == "__main__":
    if len(sys.argv) != 4:
        raise SystemExit("Usage: validate_preview_artifact.py ARCHIVE DESTINATION TRUSTED_CONFIG")
    extract_preview(*(Path(argument) for argument in sys.argv[1:]))
    print("Preview artifact paths, size, static files, and trusted configuration verified.")
