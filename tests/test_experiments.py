"""Our bounds on published S and Q values (data/experiments.json)."""

from pathlib import Path

import pytest

from bellkit import experiments


@pytest.fixture(scope="module")
def summary():
    return experiments.summary()


def test_every_point_names_a_source(summary):
    for p in summary["points"]:
        assert p["source"] in summary["sources"]


def test_liu_101km_not_robust_at_one_sigma(summary):
    p = next(p for p in summary["points"] if p["id"] == "liu2026_101km")
    assert p["central"]["di_rate_acin"] == pytest.approx(0.0865, abs=1e-4)
    assert p["corner"]["di_rate_acin"] == pytest.approx(-0.0379, abs=1e-4)


def test_lu_fig5c_recomputation(summary):
    rows = {r["distance_km"]: r for r in summary["published_rates"]["rows"]}
    expected = {
        11: (0.410635, 0.368588),
        20: (0.290764, 0.220219),
        50: (0.161711, 0.033191),
        70: (0.073450, -0.053815),
        100: (0.078660, -0.066269),
    }
    for km, (ours, corner) in expected.items():
        assert rows[km]["ours"] == pytest.approx(ours, abs=2e-6)
        assert rows[km]["corner"] == pytest.approx(corner, abs=2e-6)
        assert 7e-4 < rows[km]["difference"] < 1.5e-3  # ours is higher at every distance


def test_point_without_qber_has_no_key_rate(summary):
    p = next(p for p in summary["points"] if p["Q"] is None)
    assert p["central"]["di_rate_acin"] is None


def test_lu_difference_range_is_quoted_as_computed(summary):
    """The README, references.md, the Real data caption and the module docstring quote the range of
    our Fig. 5C differences; it must be the computed one (5 decimals), not a double rounding."""
    diffs = [r["difference"] for r in summary["published_rates"]["rows"]]
    lo, hi = f"{min(diffs):.5f}", f"{max(diffs):.5f}"
    assert (lo, hi) == ("0.00079", "0.00145")
    root = Path(__file__).resolve().parents[1]
    en_dash = "\u2013"
    for rel, sep in [
        ("README.md", en_dash),
        ("docs/references.md", en_dash),
        ("ui/views/experiments.js", en_dash),
        ("bellkit/experiments.py", "-"),
    ]:
        text = (root / rel).read_text(encoding="utf-8")
        assert f"{lo}{sep}{hi}" in text, rel
        for old in (f"0.0008{en_dash}0.0015", "0.0008-0.0015"):
            assert old not in text, rel
