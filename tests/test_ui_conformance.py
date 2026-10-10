"""Static checks of the browser code (ui/, main.js, index.html).

- Python is called only from ui/core/api.js (one bridge, JSON strings in and out).
- No browser storage (Qollab's sandboxed frame has none) and no hash routing (it would add
  entries to the parent page's history).
- index.html has no <script> (Qollab loads main.js itself).
- Every icon name used exists in the vendored Tabler subset.
- Every module parses (when Node.js is available).
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
        used |= set(re.findall(r"\bicon\('([a-z0-9-]+)'", src))
        used |= set(re.findall(r"\bicon: '([a-z0-9-]+)'", src))
        used |= set(re.findall(r"\bbutton\('[^']*', '([a-z0-9-]+)'", src))
        used |= set(re.findall(r"\bn\('[a-z]+', \d+, \d+, \d+, '([a-z0-9-]+)'", src))
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
