"""Static checks against the Qollab platform rules (Docs, checked 2026-10-09/10).

- Results are read with backend.run + get_counts; Sampler/Estimator are not used (on IonQ
  the Sampler path returns all-zero counts without an error).
- No dynamic circuits (no IonQ target runs them), no measure_all (we name every clbit).
- The injected ``backend`` is never created or reassigned in Python.
- Data files are referenced by literal paths so that Qollab ships them.
- Upload limits: 100 files, 2 MB per file, README within the write-up limit.
"""

import ast
import json
import re
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parent.parent
PY_FILES = sorted((ROOT / "bellkit").glob("*.py"))
sys.path.insert(0, str(ROOT / "scripts"))
import build_upload  # noqa: E402

FORBIDDEN = {
    "Sampler": r"\bSampler(V2)?\b",
    "Estimator": r"\bEstimator(V2)?\b",
    "fake_provider import": r"fake_provider",
    "measure_all": r"\bmeasure_all\b",
    "c_if": r"\bc_if\b",
    "if_test": r"\bif_test\b",
    "while_loop": r"\bwhile_loop\b",
    "input()": r"\binput\(",
    "IonQProvider": r"IonQProvider",
}


@pytest.mark.parametrize("path", PY_FILES, ids=lambda p: p.name)
def test_no_forbidden_api(path):
    src = path.read_text(encoding="utf-8")
    hits = [name for name, rx in FORBIDDEN.items() if re.search(rx, src)]
    assert not hits, f"{path.name}: {hits}"


@pytest.mark.parametrize("path", PY_FILES, ids=lambda p: p.name)
def test_backend_never_assigned(path):
    tree = ast.parse(path.read_text(encoding="utf-8"))
    for node in ast.walk(tree):
        targets = []
        if isinstance(node, ast.Assign):
            targets = node.targets
        elif isinstance(node, ast.AnnAssign | ast.AugAssign):
            targets = [node.target]
        for t in targets:
            assert not (isinstance(t, ast.Name) and t.id == "backend"), f"{path.name}:{node.lineno}"


def test_only_execution_runs_jobs():
    for path in PY_FILES:
        if path.name != "execution.py":
            assert ".run(" not in path.read_text(encoding="utf-8"), path.name


def test_data_paths_are_literals_and_shipped():
    from bellkit import paths

    manifest = json.loads((ROOT / "qollab_manifest.json").read_text(encoding="utf-8"))
    shipped = {p.relative_to(ROOT).as_posix() for p in build_upload.collect(manifest)}
    tree = ast.parse((ROOT / "bellkit" / "paths.py").read_text(encoding="utf-8"))
    literals = [
        n.value.value for n in tree.body if isinstance(n, ast.Assign) and isinstance(n.value, ast.Constant)
    ]
    for name in ("DEFAULTS", "EXPERIMENTS", "RECORDED_RUNS", "ROSENFELD_APRIL", "ROSENFELD_JUNE"):
        value = getattr(paths, name)
        assert value in literals
        assert (ROOT / value).is_file(), value
        assert value in shipped, value


def test_requirements_pin_matches_platform():
    assert (ROOT / "requirements.txt").read_text(encoding="utf-8").split() == ["qiskit==2.5.2"]


def test_upload_limits():
    manifest = json.loads((ROOT / "qollab_manifest.json").read_text(encoding="utf-8"))
    files = build_upload.collect(manifest)
    assert build_upload.check_limits(files, manifest["limits"]) == []
    assert not any(
        p.relative_to(ROOT).parts[0] in {"tests", "scripts", "tools", "docs", "results"} for p in files
    )
