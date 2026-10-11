"""Source checks for interface states that are hard to see in a unit test: a status line that a
blocker from another view overwrote gets its own message back, the sticky header never hides
what is scrolled to, and post-selected results say what their device-independent rows assume."""

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def _src(name: str) -> str:
    return (ROOT / name).read_text(encoding="utf-8")


def test_lab_status_keeps_its_own_message_apart_from_the_blocker():
    lab = _src("ui/views/lab.js")
    # every write of the view's own message goes through setStatus; only showStatus touches the DOM
    assert re.findall(r"status\.textContent = ", lab) == ["status.textContent = "]
    assert "if (status.textContent !== text) status.textContent = text;" in lab
    assert "showStatus(blocker && !ownTurn ? blocker : ownStatus);" in lab


def test_repeater_status_lines_get_their_own_message_back():
    rep = _src("ui/views/repeater.js")
    assert "const text = blocker && el !== lastRun ? blocker : ownStatus.get(el);" in rep
    assert "statusEl.textContent =" not in rep


def test_simulated_results_are_not_called_certified_or_confirmed():
    lab = _src("ui/views/lab.js")
    assert "DI key certified" not in lab and "violation confirmed" not in lab
    assert "'S above 2 at the conservative end (simulated counts)'" in lab


def test_post_selected_ladder_names_the_herald_assumption():
    common = _src("ui/views/common.js")
    assert "const HERALD = 'conditional on a setting-independent herald (post-selected)';" in common
    rep = _src("ui/views/repeater.js")
    assert "postSelected: Boolean(rep.purification)," in rep


def test_sticky_header_height_drives_scroll_padding_and_nav_offset():
    css = _src("main.css")
    assert re.search(r"html \{ scroll-padding-top: calc\(var\(--hdr, \d+px\) \+ 8px\); \}", css)
    nav = re.search(r"\.bk-nav \{[^}]*\}", css).group(0)
    assert "top: var(--hdr" in nav and "max-height: calc(100vh - var(--hdr" in nav
    assert "new ResizeObserver(syncHeader).observe(header)" in _src("main.js")


def test_circuit_gate_angles_are_at_least_10px():
    sizes = [float(x) for x in re.findall(r"font-size:([\d.]+)px", _src("ui/widgets/circuit_svg.js"))]
    assert sizes and min(sizes) >= 10


def test_app_wording_matches_the_readme():
    # the QPU refusal is a name/class match, not a guarantee about every backend
    for view in ("ui/views/overview.js", "ui/views/method.js"):
        assert "never submits to quantum hardware" not in _src(view)
        assert "“qpu”" in _src(view)
    # Rosenfeld et al. 2017: the atoms are 398 m apart
    assert "two atoms 398 m apart" in _src("ui/views/experiments.js")
    # the disc of the 2D slice is exact only when also E01 = E10
    assert "the disc when also $E_{01} = E_{10}$" in _src("ui/views/space.js")
    # the June Munich run does not clear 2 at 95 %, so the tour does not place it beyond every local model
    tour = _src("ui/views/tour_steps.js")
    assert "Your run and the Munich data sit between the diamond and the disc" not in tour
    assert "the June run does not clear 2 at 95%" in tour
