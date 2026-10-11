"""Checks against the optional backends and the circuit drawing (each part skips if its package is
missing):

- the IBM Fez noise model (Aer, FakeFez) run through ``app.run_json`` lands between the local
  bound and the quantum maximum;
- the packed single circuit that IonQ simulators get is accepted by qiskit-ionq's own encoder
  (no API key, no network) and stays within the profile's 25 qubits;
- the interface's SVG circuit diagram (ui/widgets/circuit_svg.js, fed by ``circuits_json``)
  draws the same gates, qubit by qubit, as Qiskit's text drawing of the same circuit.
"""

import json
import math
import re
import socket
import warnings
from collections import defaultdict
from pathlib import Path

import pytest

from bellkit import app, config, execution
from bellkit.circuits import build_plan, make_units

ROOT = Path(__file__).resolve().parents[1]

# The requests the Backends view offers (ui/views/circuits.js), with noise and Eve where they
# change the circuit.
REQUESTS = [
    {"module": "bell"},
    {"module": "bell", "include_yy": True},
    {
        "module": "bell",
        "channel": {"kind": "depolarizing", "strength": 0.1},
        "eve": {"enabled": True, "phi_deg": 90},
    },
    {"module": "chain", "hops": 2, "channel": {"kind": "depolarizing", "strength": 0.05}},
    {"module": "purify", "rotation": "dejmps", "channel": {"kind": "depolarizing", "strength": 0.05}},
]


def test_fake_fez_noise_model_gives_s_between_2_and_tsirelson():
    pytest.importorskip("qiskit_aer")
    fake_provider = pytest.importorskip("qiskit_ibm_runtime.fake_provider")
    from qiskit_aer import AerSimulator

    backend = AerSimulator.from_backend(fake_provider.FakeFez())
    rep = json.loads(app.run_json(backend, json.dumps({"module": "bell", "shots": 2000, "seed": 11})))
    assert rep["backend"]["profile"] == "ibm_noise"
    s = rep["analysis"]["S"]["point"]
    assert 2 < s < 2 * math.sqrt(2)
    # the noise model is on: the key error rate is not zero
    assert rep["analysis"]["Q_Z"]["point"] > 0


class _NoNetwork:
    def __enter__(self):
        self.saved = (socket.socket.connect, socket.create_connection)

        def refuse(*args, **kwargs):
            raise OSError("network access in a unit test")

        socket.socket.connect = refuse
        socket.create_connection = refuse
        return self

    def __exit__(self, *exc):
        socket.socket.connect, socket.create_connection = self.saved


class _EncodeOnly:
    """An IonQ-named backend: run() encodes the job with qiskit-ionq and stops there."""

    name = "ionq_simulator"

    def __init__(self, encode):
        self.encode = encode
        self.encoded = None

    def run(self, payload, **options):
        self.encoded = (payload, *self.encode(payload), options)
        raise _Stop


class _Stop(Exception):
    pass


# what fits the IonQ profile in one circuit (with Eve the Bell run needs 31 qubits: refused, see
# test_app.py; so are the chain and purification, below)
IONQ_REQUESTS = [
    REQUESTS[0],
    REQUESTS[1],
    {"module": "bell", "channel": {"kind": "depolarizing", "strength": 0.1}},
]


@pytest.mark.parametrize("req", IONQ_REQUESTS, ids=["default", "yy", "noise"])
def test_packed_ionq_circuit_is_encoded_by_qiskit_ionq(req):
    helpers = pytest.importorskip("qiskit_ionq.helpers")
    cfg = config.load()
    profile = config.resolve_profile(cfg, "ionq_simulator", "IonQSimulatorBackend")
    exp = app.parse_request(req, cfg)
    units = make_units(exp, config.settings(cfg), app._yy_setting(cfg) if exp.include_yy else None)
    plan = build_plan(units, profile["layout"])
    backend = _EncodeOnly(helpers.qiskit_circ_to_ionq_circ)
    with _NoNetwork(), warnings.catch_warnings(), pytest.raises(_Stop):
        warnings.simplefilter("ignore")
        execution.run_plan(backend, plan, profile, profile["shots"], None)
    circuit, gates, num_meas, _meas_map, options = backend.encoded
    assert profile["layout"] == "packed_single_circuit" and profile["max_qubits"] == 25
    assert circuit.num_qubits == plan.total_qubits_largest <= 25
    assert num_meas == circuit.num_clbits
    assert gates and {g["gate"] for g in gates} <= {"h", "x", "y", "z", "rx", "ry", "rz", "s", "si"}
    assert options == {"shots": profile["shots"]}


def test_chain_and_purification_are_refused_on_ionq_before_encoding():
    cfg = config.load()
    profile = config.resolve_profile(cfg, "ionq_simulator", "IonQSimulatorBackend")
    for req in REQUESTS[3:]:
        exp = app.parse_request(req, cfg)
        plan = build_plan(make_units(exp, config.settings(cfg), None), profile["layout"])
        with pytest.raises(execution.PlanTooLarge):
            execution.check_plan(plan, profile)


# --- the SVG circuit diagram against Qiskit's text drawing ---------------------------------

_SVG_SRC = (ROOT / "ui/widgets/circuit_svg.js").read_text(encoding="utf-8")
_NAMES_JS = re.search(r"const NAMES = \{([^}]*)\}", _SVG_SRC).group(1)
_SVG_NAMES = dict(re.findall(r"(\w+): '([^']+)'", _NAMES_JS))
# gates the SVG draws with a special shape: (box drawn on the target, label of that box)
_SPECIAL = {"cx": "x", "cry": "ry", "cz": None, "measure": "m", "barrier": None}
_BOX = re.compile(r"┤ ?([^┤├]*?) ?├")


def _svg_boxes(unit: dict) -> dict:
    """Per qubit, the boxed gates the SVG diagram draws, in order (control dots are not boxes)."""
    rows = defaultdict(list)
    for op in unit["ops"]:
        name = op["name"]
        if name in _SPECIAL:
            if _SPECIAL[name]:
                rows[op["qubits"][-1]].append(_SPECIAL[name])
        else:
            assert name in _SVG_NAMES, f"{unit['name']}: the SVG would print the raw name {name!r}"
            rows[op["qubits"][0]].append(name)
    return dict(rows)


def _text_boxes(unit: dict) -> dict:
    rows = {}
    for line in unit["text"].splitlines():
        m = re.match(r"\s*q_(\d+): (.*)$", line)
        if m:
            labels = [lab.split("(")[0].strip().lower() for lab in _BOX.findall(m.group(2))]
            if labels:
                rows[int(m.group(1))] = labels
    return rows


@pytest.mark.parametrize("req", REQUESTS, ids=["bell", "yy", "noise+eve", "chain", "purify"])
def test_svg_circuit_draws_the_gates_of_qiskits_text_drawing(req):
    units = json.loads(app.circuits_json(json.dumps(req)))["units"]
    assert units
    for unit in units:
        boxes = _svg_boxes(unit)
        assert boxes and boxes == _text_boxes(unit), unit["name"]
