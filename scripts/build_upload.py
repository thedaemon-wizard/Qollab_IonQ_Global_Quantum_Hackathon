"""Build the Qollab upload zip from qollab_manifest.json.

Usage: python scripts/build_upload.py [--check]

The zip contains exactly the files the manifest lists (no stale files from earlier
uploads). With --check, only list the files and the limits, without writing the zip.
"""

from __future__ import annotations

import argparse
import json
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def collect(manifest: dict) -> list[Path]:
    files: list[Path] = []
    for pattern in manifest["include"]:
        matches = sorted(p for p in ROOT.glob(pattern) if p.is_file() and "__pycache__" not in p.parts)
        if not matches and not any(ch in pattern for ch in "*?["):
            raise FileNotFoundError(f"manifest lists a missing file: {pattern}")
        files.extend(m for m in matches if m not in files)
    return files


def check_limits(files: list[Path], limits: dict) -> list[str]:
    problems = []
    if len(files) > limits["max_files"]:
        problems.append(f"{len(files)} files > {limits['max_files']}")
    for f in files:
        if f.stat().st_size > limits["max_file_bytes"]:
            problems.append(f"{f.relative_to(ROOT)} is {f.stat().st_size} bytes")
    readme = ROOT / "README.md"
    if readme in files and len(readme.read_text(encoding="utf-8")) > limits["max_readme_chars"]:
        problems.append("README.md is longer than the Qollab write-up limit")
    return problems


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--check", action="store_true", help="list files and check limits only")
    args = parser.parse_args()
    manifest = json.loads((ROOT / "qollab_manifest.json").read_text(encoding="utf-8"))
    files = collect(manifest)
    problems = check_limits(files, manifest["limits"])
    for f in files:
        print(f"{f.stat().st_size:>9}  {f.relative_to(ROOT)}")
    print(f"{len(files)} files, {sum(f.stat().st_size for f in files)} bytes")
    if problems:
        print("LIMITS EXCEEDED:\n  " + "\n  ".join(problems), file=sys.stderr)
        return 1
    if not args.check:
        out = ROOT / manifest["zip_name"]
        out.parent.mkdir(parents=True, exist_ok=True)
        with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as zf:
            for f in files:
                zf.write(f, f.relative_to(ROOT).as_posix())
        print(f"wrote {out.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
