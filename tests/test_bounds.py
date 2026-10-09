"""Golden values from the verified implementation spec (sections 4-5)."""

import math
import random

import pytest

from bellkit import bounds

TOL = 1e-6


def test_thresholds_are_computed_not_typed():
    th = bounds.thresholds()
    assert th["bbm92"]["Q"] == pytest.approx(0.1100278644, abs=1e-9)
    assert th["bbm92"]["S_werner"] == pytest.approx(2.2060155322, abs=1e-8)
    assert th["acin"]["Q_werner"] == pytest.approx(0.0714917588, abs=1e-9)
    assert th["acin"]["S_werner"] == pytest.approx(2.4240086649, abs=1e-8)
    assert th["kaniewski"]["S"] == pytest.approx(2.1058229337, abs=1e-9)
    assert th["kaniewski"]["Q_werner"] == pytest.approx(0.1277395809, abs=1e-9)
    assert th["chsh"]["v_werner"] == pytest.approx(1 / math.sqrt(2), abs=1e-12)


@pytest.mark.parametrize(
    ("s", "q", "h_vn", "h_min", "kan", "r_di", "r_bbm"),
    [
        (2.2, 0.111091, 0.157288, 0.082515, 0.565165, -0.345911, -0.006398),
        (2.4, 0.075736, 0.346112, 0.194021, 0.703553, -0.040861, 0.226053),
        (2.5, 0.058058, 0.456436, 0.267568, 0.772748, 0.136747, 0.360624),
        (2.6, 0.040381, 0.581580, 0.361438, 0.841942, 0.337545, 0.511931),
        (2.7, 0.022703, 0.728482, 0.492781, 0.911136, 0.572123, 0.687282),
    ],
)
def test_certificate_ladder_values(s, q, h_vn, h_min, kan, r_di, r_bbm):
    assert q == pytest.approx((1 - s / bounds.TSIRELSON) / 2, abs=1e-6)  # Werner QBER for this S
    q = (1 - s / bounds.TSIRELSON) / 2
    assert bounds.local_von_neumann(s) == pytest.approx(h_vn, abs=TOL)
    assert bounds.min_entropy_pironio(s) == pytest.approx(h_min, abs=TOL)
    assert bounds.kaniewski_extractability(s) == pytest.approx(kan, abs=TOL)
    assert bounds.di_rate_acin(s, q) == pytest.approx(r_di, abs=TOL)
    assert bounds.bbm92_rate(q, q) == pytest.approx(r_bbm, abs=TOL)


def test_no_certificate_at_or_below_the_classical_bound():
    assert bounds.di_rate_acin(2.0, 0.146447) is None
    assert bounds.min_entropy_pironio(2.0) == 0.0
    assert bounds.local_von_neumann(2.0) == 0.0
    assert bounds.kaniewski_extractability(2.0) == 0.5


@pytest.mark.parametrize("s", [bounds.TSIRELSON, 2.9])
def test_clamped_at_tsirelson_without_nan(s):
    assert bounds.min_entropy_pironio(s) == pytest.approx(1.0, abs=1e-9)
    assert bounds.local_von_neumann(s) == pytest.approx(1.0, abs=1e-9)
    assert bounds.kaniewski_extractability(s) == pytest.approx(1.0, abs=1e-9)


@pytest.mark.parametrize(("s", "value"), [(2.07, 0.0264), (2.414, 0.2034), (2.7, 0.4928)])
def test_pironio_matches_references_sheet(s, value):
    assert bounds.min_entropy_pironio(s) == pytest.approx(value, abs=5e-5)


@pytest.mark.parametrize(("q", "rate"), [(0.01, 0.7766), (0.02, 0.6123), (0.05, 0.2250), (0.07, 0.0146)])
def test_acin_on_werner_matches_references_sheet(q, rate):
    assert bounds.di_rate_acin(bounds.werner_s(q), q) == pytest.approx(rate, abs=5e-5)


def test_fidelity_bracket_examples():
    assert bounds.fidelity_bracket(0.9, 0.9) == pytest.approx((0.9, 0.95))
    assert bounds.fidelity_bracket(0.8, 1.0) == pytest.approx((0.9, 0.9))
    assert bounds.fidelity_bracket(0.6, 0.7) == pytest.approx((0.65, 0.80))


def test_fidelity_bracket_holds_for_random_states():
    numpy = pytest.importorskip("numpy")
    from qiskit.quantum_info import DensityMatrix, Pauli, random_density_matrix

    rng = random.Random(7)
    phi_plus = DensityMatrix.from_label("00").evolve(_bell_prep())
    for _ in range(300):
        rho = random_density_matrix(4, seed=rng.randrange(10**9))
        xx = numpy.real(rho.expectation_value(Pauli("XX")))
        zz = numpy.real(rho.expectation_value(Pauli("ZZ")))
        f = numpy.real(numpy.trace(rho.data @ phi_plus.data))
        lo, hi = bounds.fidelity_bracket(xx, zz)
        assert lo - 1e-12 <= f <= hi + 1e-12


def _bell_prep():
    from qiskit import QuantumCircuit

    qc = QuantumCircuit(2)
    qc.h(0)
    qc.cx(0, 1)
    return qc
