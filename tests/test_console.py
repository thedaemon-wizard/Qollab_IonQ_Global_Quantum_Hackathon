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


def test_purification_line_says_post_selected():
    """Purified rounds are post-selected: the console line says the device-independent rungs
    assume a herald that does not depend on the settings; other runs carry no such note."""
    req = {"module": "purify", "rotation": "dejmps", "channel": {"kind": "depolarizing", "strength": 0.05},
           "shots": 1000, "seed": 1}
    rep = json.loads(app.run_json(BasicSimulator(), json.dumps(req)))
    line = rep["console_line"]
    assert line.startswith("[Bell-Test Lab] Purification run on basic_simulator")
    assert line.endswith(" (post-selected; device-independent rungs assume a setting-independent herald).")
    bell = {"module": "bell", "channel": {"kind": "none", "strength": 0}, "eve": {"enabled": False},
            "include_yy": False, "shots": 500, "seed": 1}
    assert "post-selected" not in json.loads(app.run_json(BasicSimulator(), json.dumps(bell)))["console_line"]
