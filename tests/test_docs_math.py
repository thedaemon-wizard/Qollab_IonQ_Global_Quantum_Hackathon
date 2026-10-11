"""Docs typeset their formulas: GitHub math in the Markdown sources, KaTeX syntax in the
Qollab write-up made from the README."""

import importlib.util
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SOURCES = [ROOT / "README.md", ROOT / "docs" / "references.md", ROOT / "docs" / "review.md"]
OPEN, CLOSE = "$`", "`$"


def _spans(line):
    """Inline formulas of one line, in order; raises if a span is left open."""
    out, i = [], 0
    while (a := line.find(OPEN, i)) >= 0:
        b = line.find(CLOSE, a + 2)
        assert b > a, f"open formula: {line}"
        out.append(line[a + 2 : b])
        i = b + 2
    return out


def test_markdown_formulas_are_safe_for_github():
    total = 0
    for path in SOURCES:
        text = path.read_text(encoding="utf-8")
        assert "\n ```math" not in text and "\n  ```math" not in text
        for line in text.splitlines():
            for tex in _spans(line):
                total += 1
                assert "|" not in tex, tex  # \lvert, \rvert, \mid keep table cells whole
                bare = tex.replace(r"\langle", "").replace(r"\rangle", "")
                assert all(
                    bare[k - 1 : k] == " " and bare[k + 1 : k + 2] == " "
                    for k, c in enumerate(bare)
                    if c in "<>"
                ), tex
    assert total > 300


def test_writeup_converts_every_formula():
    spec = importlib.util.spec_from_file_location("mw", ROOT / "scripts" / "make_writeup.py")
    mw = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mw)
    readme = (ROOT / "README.md").read_text(encoding="utf-8")
    inline = sum(len(_spans(line)) for line in readme.splitlines())
    fences = readme.count("```math")
    for images in (True, False):
        out = mw.convert(readme, "v1.0-submission", images)
        assert OPEN not in out and CLOSE not in out and "```math" not in out
        assert not out.startswith("# ")  # Qollab shows the project title above the write-up
        assert out.count("$$") == 2 * fences
        assert out.replace("$$", "").count("$") == 2 * inline


def test_markdown_math_uses_github_safe_macros():
    # GitHub's math renderer rejects \\operatorname ("The following macros are not allowed").
    docs = sorted((ROOT / "docs").glob("*.md"))
    paths = [ROOT / "README.md", *docs, ROOT / "results" / "a11y" / "README.md"]
    for path in paths:
        assert "\\operatorname" not in path.read_text(encoding="utf-8"), path.name
