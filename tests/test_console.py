"""Every run returns one summary line for Qollab's run console (where judges look for results)."""

import json

from qiskit.providers.basic_provider import BasicSimulator

from bellkit import app


def test_run_reports_its_numbers():
    req = {"module": "bell", "channel": {"kind": "depolarizing", "strength": 0.05},
           "eve": {"enabled": False}, "include_yy": False, "shots": 2000, "seed": 1}
    rep = json.loads(app.run_json(BasicSimulator(), json.dumps(req)))
    line = rep["console_line"]
    assert line.startswith("[Bell-Test Lab] Bell Lab run on basic_simulator: 2000 shots per setting")
    assert f"S = {rep['analysis']['S']['point']:.3f}" in line
    assert f"Q_Z = {rep['analysis']['Q_Z']['point']:.2%}" in line


def test_start_and_selftest_lines():
    info = json.loads(app.describe_backend_json(BasicSimulator()))
    st = json.loads(app.selftest_json())
    assert info["console_line"].startswith("[Bell-Test Lab] started on basic_simulator")
    assert st["console_line"].endswith(f"formula self-check: {st['passed']} of {st['total']} passed.")
