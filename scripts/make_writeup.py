"""Turn README.md into the Qollab project write-up.

Usage: python scripts/make_writeup.py [git-ref]   (default ref: v1.0-submission)

Qollab's write-up renders Markdown and KaTeX but not Mermaid, and shows images only from
allowed hosts. This script points relative images and links at the public repository at the
given ref, drops the Mermaid block (the PNG above it carries the same diagram) and checks the
length limit. Output: dist/writeup.md.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
REPO = "thedaemon-wizard/Qollab_IonQ_Global_Quantum_Hackathon"
LIMIT = 65_000


def convert(text: str, ref: str) -> str:
    raw = f"https://raw.githubusercontent.com/{REPO}/{ref}/"
    blob = f"https://github.com/{REPO}/blob/{ref}/"
    text = re.sub(r"```mermaid\n.*?```\n\n?", "", text, flags=re.S)
    text = re.sub(
        r"!\[([^\]]*)\]\((?!https?://)([^)]+)\)", lambda m: f"![{m.group(1)}]({raw}{m.group(2)})", text
    )
    text = re.sub(
        r"(?<!!)\[([^\]]+)\]\((?!https?://|#)([^)]+)\)", lambda m: f"[{m.group(1)}]({blob}{m.group(2)})", text
    )
    return text


def main() -> int:
    ref = sys.argv[1] if len(sys.argv) > 1 else "v1.0-submission"
    out = convert((ROOT / "README.md").read_text(encoding="utf-8"), ref)
    if len(out) > LIMIT:
        print(f"write-up is {len(out)} characters, over the {LIMIT} limit", file=sys.stderr)
        return 1
    dest = ROOT / "dist" / "writeup.md"
    dest.parent.mkdir(exist_ok=True)
    dest.write_text(out, encoding="utf-8")
    print(f"{len(out)} characters -> {dest.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
