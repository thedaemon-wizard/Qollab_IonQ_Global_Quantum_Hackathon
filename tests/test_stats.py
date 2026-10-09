import pytest

from bellkit.stats import Table, hoeffding_halfwidth_sum, hoeffding_halfwidth_witness, wilson_interval


def test_correlator_and_standard_error():
    t = Table(409, 91, 91, 409)
    assert t.correlator() == pytest.approx(0.636)
    assert t.standard_error() == pytest.approx(((1 - 0.636**2) / 1000) ** 0.5)


def test_hoeffding_halfwidth_matches_spec():
    assert hoeffding_halfwidth_sum([1000] * 4, 0.025) == pytest.approx(0.187233, abs=1e-6)
    assert hoeffding_halfwidth_sum([10000] * 4, 0.025) == pytest.approx(0.059208, abs=1e-6)
    assert hoeffding_halfwidth_witness(1000, 1000, 0.05) == pytest.approx(0.060736, abs=1e-6)


def test_wilson_matches_spec():
    lo, hi = wilson_interval(50, 1000, 0.025)
    assert lo == pytest.approx(0.036677, abs=1e-6)
    assert hi == pytest.approx(0.067822, abs=1e-6)


def test_wilson_coverage_is_close_to_nominal():
    import random

    rng = random.Random(3)
    delta, n, p, trials = 0.05, 1000, 0.05, 2000
    covered = 0
    for _ in range(trials):
        k = sum(rng.random() < p for _ in range(n))
        lo, hi = wilson_interval(k, n, delta)
        covered += lo <= p <= hi
    assert covered / trials >= 0.93


def test_empty_table_is_an_error():
    with pytest.raises(ValueError):
        Table(0, 0, 0, 0).correlator()
