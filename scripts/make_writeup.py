"""Turn README.md into the Qollab project write-up.

Usage: python scripts/make_writeup.py [git-ref] [--no-images]   (default ref: v1.0-submission)

Qollab's write-up renders Markdown and KaTeX but not Mermaid, and shows images only from
allowed hosts. This script points relative images and links at the public repository at the
given ref, drops the Mermaid block (the PNG above it carries the same diagram), turns a YouTube
link that stands alone on its line into Qollab's embedded player, drops the README title (Qollab
shows the project title above the write-up), and checks the length limit.
Output: dist/writeup.md.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
REPO = "thedaemon-wizard/Qollab_IonQ_Global_Quantum_Hackathon"
LIMIT = 65_000
# Relative targets only: anything with a scheme (https:, mailto:), protocol-relative (//) or an
# in-page anchor (#) is left alone.
LOCAL_IMAGE = r"!\[([^\]]*)\]\((?![a-z][a-z0-9+.-]*:|//)([^)]+)\)"
LOCAL_LINK = r"(?<!!)\[([^\]]+)\]\((?![a-z][a-z0-9+.-]*:|//|#)([^)]+)\)"
# A YouTube link alone on its line. Qollab's write-up renders image syntax with a YouTube URL as an
# embedded player; GitHub would show a broken image, so the README keeps a plain link.
VIDEO_LINE = r"^\[([^\]]+)\]\((https://(?:youtu\.be/|www\.youtube\.com/watch\?v=)[^)\s]+)\)[ \t]*$"


def convert(text: str, ref: str, images: bool = True) -> str:
    raw = f"https://raw.githubusercontent.com/{REPO}/{ref}/"
    blob = f"https://github.com/{REPO}/blob/{ref}/"
    text = text.replace("\r\n", "\n")
    # Qollab shows the project title above the write-up, so the README's own title would repeat.
    text = re.sub(r"\A# [^\n]*\n+", "", text)
    text = re.sub(r"```mermaid\n.*?```\n\n?", "", text, flags=re.S)
    # GitHub needs ```math blocks (it would eat * and backslash escapes inside $$...$$);
    # Qollab's write-up renders $$...$$.
    text = re.sub(r"```math\n(.*?)\n```", lambda m: f"$${m.group(1)}$$", text, flags=re.S)
    # Inline math is written $`...`$ in the README, so GitHub keeps \, \! \{ \% and * inside it;
    # Qollab renders $...$ with KaTeX, and an inline formula must stay on one line.
    text = re.sub(r"\$`([^`\n]+?)`\$", lambda m: f"${m.group(1)}$", text)
    unpaired = [
        n for n, line in enumerate(text.split("\n"), 1) if "$`" in line or "`$" in line or line.count("$") % 2
    ]
    if unpaired:
        raise ValueError(f"math delimiters unconverted or unpaired on write-up lines {unpaired}")
    if not images:  # while the repository is private the image URLs would not load
        text = re.sub(r"!\[[^\]]*\]\([^)]+\)\n\n?", "", text)
        marker = f"> https://github.com/{REPO}\n"
        if marker not in text:
            raise ValueError("repository line not found; cannot add the interim note")
        text = text.replace(
            marker,
            marker + ">\n> *Interim version: the repository and its links go public with"
            " the final submission; figures and screenshots appear then.*\n",
            1,
        )
    text = re.sub(VIDEO_LINE, lambda m: f"![{m.group(1)}]({m.group(2)})", text, flags=re.M)
    text = re.sub(LOCAL_IMAGE, lambda m: f"![{m.group(1)}]({raw}{m.group(2)})", text)
    text = re.sub(LOCAL_LINK, lambda m: f"[{m.group(1)}]({blob}{m.group(2)})", text)
    return text


def main() -> int:
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    ref = args[0] if args else "v1.0-submission"
    images = "--no-images" not in sys.argv
    out = convert((ROOT / "README.md").read_text(encoding="utf-8"), ref, images)
    if len(out) > LIMIT:
        print(f"write-up is {len(out)} characters, over the {LIMIT} limit", file=sys.stderr)
        return 1
    dest = ROOT / "dist" / ("writeup.md" if images else "writeup_no_images.md")
    dest.parent.mkdir(exist_ok=True)
    dest.write_text(out, encoding="utf-8")
    print(f"{len(out)} characters -> {dest.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
