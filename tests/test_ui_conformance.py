"""Static checks of the browser code (ui/, main.js, index.html).

- Python is called only from ui/core/api.js (one bridge, JSON strings in and out).
- No browser storage (Qollab's sandboxed frame has none) and no hash routing (it would add
  entries to the parent page's history).
- index.html has no <script> (Qollab loads main.js itself).
- Every icon name used exists in the vendored Tabler subset.
- Every module parses (when Node.js is available).
- The Bell Lab protocol diagram follows the stepper, has no timers of its own and never runs a
  job; its animation runs only while the replay plays and stops under reduced motion.
"""

import re
import shutil
import subprocess
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parent.parent
JS = sorted([ROOT / "main.js", *(ROOT / "ui").rglob("*.js")])


def test_python_called_only_from_api():
    offenders = [
        p.relative_to(ROOT).as_posix()
        for p in JS
        if re.search(r"\.callPromising\(", p.read_text(encoding="utf-8"))
    ]
    assert offenders == ["ui/core/api.js"]


@pytest.mark.parametrize("path", JS, ids=lambda p: p.relative_to(ROOT).as_posix())
def test_no_storage_or_hash_routing(path):
    src = path.read_text(encoding="utf-8")
    for pattern in (
        "localStorage",
        "sessionStorage",
        "indexedDB",
        "location.hash",
        "history.pushState",
        "eval(",
    ):
        assert pattern not in src, f"{path.name} uses {pattern}"


def test_index_html_has_no_script():
    assert "<script" not in (ROOT / "index.html").read_text(encoding="utf-8").lower()


def test_icon_names_exist():
    icons_src = (ROOT / "ui" / "core" / "icons.js").read_text(encoding="utf-8")
    available = set(re.findall(r'^  "([a-z0-9-]+)":', icons_src, re.M))
    used = set()
    for p in JS:
        src = p.read_text(encoding="utf-8")
        for args in re.findall(r"\bicon\(([^(){}]*)", src):  # names before any options object
            args = re.sub(r"[=!]==?\s*'[^']*'", "", args)  # drop comparisons in ternary conditions
            used |= set(re.findall(r"'([a-z0-9]+(?:-[a-z0-9]+)*)'", args))
        used |= set(re.findall(r"\bicon: '([a-z0-9-]+)'", src))
        used |= set(re.findall(r"\bbutton\('[^']*', '([a-z0-9-]+)'", src))
        used |= set(re.findall(r"\bn\('[a-z]+', \d+, \d+, \d+, '([a-z0-9-]+)'", src))
        used |= set(re.findall(r"\bnode\('[a-z]+', '[a-z]+', \d+, \d+, \d+, \d+, '([a-z0-9-]+)'", src))
        used |= set(re.findall(r"viewFrame\([^,]+, [^,]+, '([a-z0-9-]+)'", src))
        for block in re.findall(r"const ICON = \{([^}]*)\}", src):
            used |= set(re.findall(r": '([a-z0-9-]+)'", block))
    assert used, "no icon names found"
    assert sorted(used - available) == []


@pytest.mark.skipif(shutil.which("node") is None, reason="Node.js not installed")
@pytest.mark.parametrize("path", JS, ids=lambda p: p.relative_to(ROOT).as_posix())
def test_modules_parse(path, tmp_path):
    copy = tmp_path / "module.mjs"
    copy.write_text(path.read_text(encoding="utf-8"), encoding="utf-8")
    out = subprocess.run(["node", "--check", str(copy)], capture_output=True, text=True)
    assert out.returncode == 0, out.stderr


@pytest.mark.parametrize("path", JS, ids=lambda p: p.relative_to(ROOT).as_posix())
def test_no_top_level_name_clashes_with_qollab_globals(path):
    """Qollab bundles main.js with its relative imports into one function that receives
    `backend` and `sendFile`; a module-level declaration of either name breaks the run
    (found on Qollab 2026-10-10: "Identifier 'backend' has already been declared")."""
    src = path.read_text(encoding="utf-8")
    clash = re.findall(r"^(?:export\s+)?(?:let|const|var|function|class)\s+(backend|sendFile)\b", src, re.M)
    assert not clash, f"{path.name} declares {clash}"


def _function_body(src: str, signature: str) -> str:
    start = src.index(signature)
    end = src.index("\n    }\n", start)
    return src[start:end]


def test_lab_flow_follows_the_stepper():
    lab = (ROOT / "ui" / "views" / "lab.js").read_text(encoding="utf-8")
    show = _function_body(lab, "function showStage(i) {")
    # the diagram reads the stepper's statuses after they are set, never its own guess
    assert "flow.update(stepItems.map((li) => li.dataset.status), rep, i);" in show
    assert show.rindex("flow.update(") > show.rindex("setAttribute('data-status'")
    assert "flow.reset();" in _function_body(lab, "function clearResults() {")
    assert "flow.setPlaying(state === 'replay' || state === 'running');" in lab


def test_lab_flow_has_no_timers_and_never_runs_a_job():
    for name in ("ui/views/lab_flow.js", "ui/widgets/diagram.js"):
        src = (ROOT / name).read_text(encoding="utf-8")
        for pattern in ("setInterval", "setTimeout", "requestAnimationFrame", "Date.now", "performance.now"):
            assert pattern not in src, f"{name} uses {pattern}"
    flow = (ROOT / "ui" / "views" / "lab_flow.js").read_text(encoding="utf-8")
    for pattern in ("ctx.api", "submitRun", "callPromising", "backend.run"):
        assert pattern not in flow.replace("'one backend.run'", ""), pattern
    assert "role: 'img'" in (ROOT / "ui" / "widgets" / "diagram.js").read_text(encoding="utf-8")


def test_endless_animations_only_while_playing_or_busy():
    css = (ROOT / "main.css").read_text(encoding="utf-8")
    rules = re.findall(r"([^{}]+)\{[^{}]*animation:[^;}]*infinite", css)
    selectors = sorted(" ".join(r.split()) for r in rules)
    assert selectors == [
        ".diagram.flow[data-playing='true'] .edge[data-status='active']",
        ".diagram.flow[data-playing='true'] .node[data-status='active'] rect",
        ".spinner",
    ], selectors
    reduced = css[css.index("@media (prefers-reduced-motion: reduce)") :]
    assert "animation-iteration-count: 1 !important" in reduced.split("}")[0] + "}"
