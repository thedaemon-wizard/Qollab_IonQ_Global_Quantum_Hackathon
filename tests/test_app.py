"""Contract of the JSON interface that main.js calls."""

import json

import pytest
from qiskit.providers.basic_provider import BasicSimulator

from bellkit import app, execution


class NamedBackend:
    """Stands in for a backend we must never run on."""

    def __init__(self, name):
        self.name = name

    def run(self, *args, **kwargs):  # pragma: no cover - must not be reached
        raise AssertionError("run() must not be called")


def run(req, backend=None):
    return json.loads(app.run_json(backend or BasicSimulator(), json.dumps(req)))


def test_run_report_contract():
    rep = run({"module": "bell", "channel": {"kind": "depolarizing", "strength": 0.1}, "shots": 2000})
    assert rep["schema"] == app.SCHEMA_RUN
    assert rep["backend"]["profile"] == "ideal"
    assert rep["layout"] == "multi_circuit"
    assert rep["canary_fraction"] == 1.0
    a = rep["analysis"]
    assert set(a["settings"]) == {"key_z", "x_x", "c00", "c01", "c10", "c11"}
    assert a["S"]["low"] < a["S"]["point"] < a["S"]["high"]
    assert a["Q_Z"]["low"] <= a["Q_Z"]["point"] <= a["Q_Z"]["high"]
    assert set(a["ladder_point"]) == set(a["ladder_conservative"])
    assert rep["geometry"]["in_quantum"] in (True, False)


def test_same_seed_same_numbers():
    req = {"module": "bell", "channel": {"kind": "dephasing", "strength": 0.05}, "shots": 1000, "seed": 7}
    assert run(req)["analysis"]["S"]["point"] == run(req)["analysis"]["S"]["point"]


def test_quantum_hardware_is_refused_before_any_run():
    with pytest.raises(execution.RefusedBackend):
        run({"module": "bell"}, NamedBackend("ionq_qpu.forte-1"))


def test_plan_too_large_for_ionq_is_refused_before_any_run():
    req = {
        "module": "bell",
        "channel": {"kind": "depolarizing", "strength": 0.1},
        "eve": {"enabled": True, "phi_deg": 90},
    }
    with pytest.raises(execution.PlanTooLarge):
        run(req, NamedBackend("ionq_simulator"))


@pytest.mark.parametrize(
    "req",
    [
        {"module": "bell", "channel": {"kind": "depolarizing", "strength": 0.9}},
        {"module": "bell", "eve": {"enabled": True, "phi_deg": 400}},
        {"module": "chain", "hops": 99},
    ],
)
def test_out_of_range_requests_are_rejected(req):
    with pytest.raises(app.RequestError):
        app.parse_request(req, app.config.load())


def test_theory_curves():
    th = json.loads(
        app.theory_json(json.dumps({"module": "bell", "channel": {"kind": "y_flip", "strength": 0.1}}))
    )
    assert th["thresholds"]["acin"]["S_werner"] == pytest.approx(2.4240086649, abs=1e-8)
    assert len(th["strength_curve"]) == app.config.load()["theory_grid"]["points"]
    assert th["purification"]["none"]["S"] == pytest.approx(2.793934, abs=1e-6)


def test_circuits_json_marks_sections_and_draws_text():
    c = json.loads(
        app.circuits_json(
            json.dumps({"module": "chain", "hops": 2, "channel": {"kind": "y_flip", "strength": 0.1}})
        )
    )
    assert len(c["units"]) == 6
    sections = {op["section"] for u in c["units"] for op in u["ops"]}
    assert {"source", "channel", "bsm", "basis", "measure"} <= sections
    assert "other" not in sections
    assert "q_0" in c["units"][0]["text"]


def test_selftest_all_pass():
    st = json.loads(app.selftest_json())
    assert st["passed"] == st["total"] > 0


def test_geometry_json_reference_points():
    g = json.loads(app.geometry_json(json.dumps({"mine": [0.6, 0.6, 0.6, -0.6]})))
    assert g["points"]["PR box"]["in_quantum"] is False
    assert g["points"]["mine"]["in_quantum"] is True
    assert len(g["mesh"]["grid"]) == len(g["mesh"]["quantum_half_height"])
