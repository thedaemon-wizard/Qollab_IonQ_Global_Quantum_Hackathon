"""The Qollab write-up made from the README by scripts/make_writeup.py."""

import importlib.util
import re
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parent.parent
_spec = importlib.util.spec_from_file_location("mw", ROOT / "scripts" / "make_writeup.py")
mw = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(mw)

README = (ROOT / "README.md").read_text(encoding="utf-8")


def test_standalone_youtube_link_becomes_embedded_player():
    text = (
        "Intro.\n\n[Demo video (1:00)](https://youtu.be/abc_DEF-123)\n\n"
        "[Long form](https://www.youtube.com/watch?v=abc_DEF-123)\n\n"
        "Inline: see [the video](https://youtu.be/abc_DEF-123) here.\n"
        "[Docs](https://example.org/watch)\n"
    )
    out = mw.convert(text, "v1.0-submission")
    assert "\n![Demo video (1:00)](https://youtu.be/abc_DEF-123)\n" in out
    assert "\n![Long form](https://www.youtube.com/watch?v=abc_DEF-123)\n" in out
    assert "see [the video](https://youtu.be/abc_DEF-123) here" in out  # prose links stay links
    assert "\n[Docs](https://example.org/watch)\n" in out


def test_readme_keeps_a_plain_video_link_for_github():
    lines = [ln for ln in README.splitlines() if "youtu" in ln]
    assert lines, "README links the demo video"
    assert not any(re.search(r"!\[[^\]]*\]\(https://(youtu\.be|www\.youtube\.com)", ln) for ln in lines)
    assert any(re.fullmatch(mw.VIDEO_LINE, ln) for ln in lines)


@pytest.mark.parametrize("images", [True, False])
def test_writeup_embeds_the_demo_video(images):
    video = next(m for ln in README.splitlines() if (m := re.fullmatch(mw.VIDEO_LINE, ln)))
    out = mw.convert(README, "v1.0-submission", images)
    assert f"![{video.group(1)}]({video.group(2)})" in out.splitlines()
    assert len(out) <= mw.LIMIT
