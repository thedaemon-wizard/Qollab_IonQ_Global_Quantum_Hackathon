"""Our bounds on published S and Q values (data/experiments.json)."""

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
