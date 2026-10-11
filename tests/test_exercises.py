"""The answers to the README's three exercises ("Who it is for and how to use it").

Each exercise uses the app's own controls on the built-in simulator (Qiskit BasicSimulator, the
app's fixed seed), so these runs give the same counts a learner gets on Qollab.
"""

import json
import math

import pytest
from qiskit.providers.basic_provider import BasicSimulator

from bellkit import app, bounds


def _run(**req):
    return json.loads(app.run_json(BasicSimulator(), json.dumps(req)))["analysis"]


def _first_failure(shots):
    """Smallest depolarizing strength (1 % steps) at which the conservative DI key fails."""
    for step in range(0, 51):
        lam = step / 100
        a = _run(module="bell", channel={"kind": "depolarizing", "strength": lam}, shots=shots)
        if not a["ladder_conservative"]["di_certified"]:
            return lam
    return None


@pytest.mark.parametrize(("shots", "answer"), [(10_000, 0.14), (2_000, 0.10)])
def test_exercise1_finite_statistics_decide_the_di_key(shots, answer):
    assert _first_failure(shots) == pytest.approx(answer)


def test_exercise1_asymptotic_crossing_without_statistics():
    # Werner state from depolarizing strength lam: S = 2 sqrt(2) (1 - lam), Q = lam / 2.
    def rate(lam):
        return bounds.di_rate_acin(2 * math.sqrt(2) * (1 - lam), lam / 2)

    assert rate(0.14) > 0 > rate(0.15)


def test_exercise2_eavesdropper_shows_in_the_second_basis():
    noise = {"kind": "depolarizing", "strength": 0.05}
    clean = _run(module="bell", channel=noise)
    eve = _run(module="bell", channel=noise, eve={"enabled": True, "phi_deg": 180})
    assert eve["Q_Z"]["point"] == clean["Q_Z"]["point"] == pytest.approx(0.0236)
    assert eve["Q_X"]["point"] == pytest.approx(0.5012)
    assert eve["S"]["point"] == pytest.approx(1.355, abs=5e-4)
    cons = eve["ladder_conservative"]
    assert not cons["bell_violation"] and not cons["di_certified"] and cons["rate_bbm92"] < 0


def test_exercise3_swapping_and_purification():
    noise = {"kind": "depolarizing", "strength": 0.05}
    chain = [_run(module="chain", hops=n, channel=noise) for n in (1, 2, 3, 4)]
    cons = [a["ladder_conservative"] for a in chain]
    assert [c["di_certified"] for c in cons] == [True, True, False, False]
    assert all(c["rate_bbm92"] > 0 for c in cons)
    assert cons[3]["rate_bbm92"] == pytest.approx(0.054, abs=5e-4)
    assert all(c["bell_violation"] for c in cons)
    assert chain[2]["Q_Z"]["point"] == pytest.approx(0.0744, abs=5e-5)
    assert chain[3]["S"]["point"] == pytest.approx(2.294, abs=5e-4)

    req = {"module": "purify", "rotation": "dejmps", "channel": noise}
    rep = json.loads(app.run_json(BasicSimulator(), json.dumps(req)))
    assert (rep["purification"]["kept"], rep["purification"]["total"]) == (57107, 60000)
    assert rep["analysis"]["Q_Z"]["point"] == pytest.approx(0.0003, abs=5e-5)
