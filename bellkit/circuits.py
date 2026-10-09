"""Circuits for the three modules: Bell test, entanglement-swapping chain, purification.

Each *unit* is one measurement setting of one module. A unit knows how many qubits and
classical bits it needs and writes its gates onto given qubits/clbits, so the same builder
serves both layouts:

- ``multi_circuit``: one circuit per unit (local simulators accept many circuits per job);
- ``packed_single_circuit``: all units side by side in ONE circuit, one register per unit
  (IonQ through Qollab accepts a single circuit per job - verified 2026-10-09).

All measurements are terminal; corrections (Pauli frame) and post-selection happen in
classical post-processing, because IonQ targets do not run dynamic circuits.

Conventions (spec section 1): outcome bit 0 = +1. A measurement along angle theta in the
X-Z plane is Ry(-theta) followed by a Z measurement; the Y basis is Sdg, H, Z measurement.
"""

from __future__ import annotations

import math
from contextlib import contextmanager
from dataclasses import dataclass, field

from qiskit import ClassicalRegister, QuantumCircuit, QuantumRegister

from bellkit.channels import PauliChannel

MODULES = ("bell", "chain", "purify")
ROTATIONS = ("none", "dejmps")


@dataclass(frozen=True)
class Experiment:
    """What to simulate. Built from a UI request (see ``app.parse_request``)."""

    module: str
    channel: PauliChannel
    eve_phi_deg: float | None = None
    hops: int = 1
    rotation: str = "none"
    include_yy: bool = False

    def __post_init__(self) -> None:
        if self.module not in MODULES:
            raise ValueError(f"unknown module {self.module!r}")
        if self.rotation not in ROTATIONS:
            raise ValueError(f"unknown rotation {self.rotation!r}")
        if self.hops < 1:
            raise ValueError("hops must be >= 1")
        if self.module != "bell" and (self.eve_phi_deg is not None or self.include_yy):
            raise ValueError("the eavesdropper and the YY setting belong to the Bell module")


@dataclass(frozen=True)
class ClbitMap:
    """Positions (within the unit's own clbits) of the bits the decoder needs."""

    alice: int
    bob: int
    frame_z: tuple[int, ...] = ()
    frame_x: tuple[int, ...] = ()
    keep_equal: tuple[int, int] | None = None


@dataclass(frozen=True)
class Unit:
    name: str
    setting: dict
    num_qubits: int
    num_clbits: int
    clbits: ClbitMap
    experiment: Experiment = field(repr=False)


def _channel_ancillas(channel: PauliChannel) -> int:
    return 0 if channel.is_identity else 2


def apply_pauli_channel(qc: QuantumCircuit, channel: PauliChannel, target, anc_x, anc_z) -> None:
    th_ax, th_az0, th_az1 = channel.ancilla_angles()
    qc.ry(th_ax, anc_x)
    qc.ry(th_az0, anc_z)
    qc.cry(th_az1 - th_az0, anc_x, anc_z)
    qc.cx(anc_x, target)
    qc.cz(anc_z, target)


def _measure_in(qc: QuantumCircuit, qubit, basis: str, angle_deg: float | None) -> None:
    if basis == "y":
        qc.sdg(qubit)
        qc.h(qubit)
    else:
        qc.ry(-math.radians(angle_deg), qubit)


def _bell_pair(qc: QuantumCircuit, a, b) -> None:
    qc.h(a)
    qc.cx(a, b)


def _unit_size(exp: Experiment) -> tuple[int, int]:
    anc = _channel_ancillas(exp.channel)
    if exp.module == "bell":
        return 2 + anc + (1 if exp.eve_phi_deg is not None else 0), 2
    if exp.module == "chain":
        return exp.hops * (2 + anc), 2 + 2 * (exp.hops - 1)
    return 4 + 2 * anc, 4  # purify


def make_units(exp: Experiment, settings: list[dict], yy_setting: dict | None) -> list[Unit]:
    chosen = list(settings)
    if exp.include_yy:
        if yy_setting is None:
            raise ValueError("YY requested but no YY setting is configured")
        chosen.append(yy_setting)
    n_q, n_c = _unit_size(exp)
    units = []
    for s in chosen:
        if exp.module == "chain":
            frame_z = tuple(3 + 2 * j for j in range(exp.hops - 1))
            frame_x = tuple(2 + 2 * j for j in range(exp.hops - 1))
            cmap = ClbitMap(alice=0, bob=1, frame_z=frame_z, frame_x=frame_x)
        elif exp.module == "purify":
            cmap = ClbitMap(alice=0, bob=1, keep_equal=(2, 3))
        else:
            cmap = ClbitMap(alice=0, bob=1)
        units.append(Unit(f"{exp.module}_{s['id']}", s, n_q, n_c, cmap, exp))
    return units


@contextmanager
def _section(qc: QuantumCircuit, notes: list | None, group: str):
    """Record which instructions of ``qc`` belong to one teaching section."""
    start = len(qc.data)
    yield
    if notes is not None and len(qc.data) > start:
        notes.append((group, start, len(qc.data)))


def write_unit(qc: QuantumCircuit, unit: Unit, qubits: list, clbits: list, notes: list | None = None) -> None:
    """Write one unit's gates onto ``qubits`` / ``clbits`` of ``qc``.

    ``notes`` (optional) receives (section, first_instruction, end_instruction) triples used
    to colour the circuit diagram; sections are source, eve, channel, bsm, purify, basis,
    measure.
    """
    exp, s = unit.experiment, unit.setting
    alice_basis = s.get("alice_basis", "xz")
    bob_basis = s.get("bob_basis", "xz")
    if exp.module == "bell":
        a, b = qubits[0], qubits[1]
        nxt = 2
        with _section(qc, notes, "source"):
            _bell_pair(qc, a, b)
        if exp.eve_phi_deg is not None:
            with _section(qc, notes, "eve"):
                qc.cry(math.radians(exp.eve_phi_deg), b, qubits[nxt])
            nxt += 1
        if not exp.channel.is_identity:
            with _section(qc, notes, "channel"):
                apply_pauli_channel(qc, exp.channel, b, qubits[nxt], qubits[nxt + 1])
        with _section(qc, notes, "basis"):
            _measure_in(qc, a, alice_basis, s.get("alice_deg"))
            _measure_in(qc, b, bob_basis, s.get("bob_deg"))
        with _section(qc, notes, "measure"):
            qc.measure(a, clbits[0])
            qc.measure(b, clbits[1])
        return
    if exp.module == "chain":
        n = exp.hops
        left = [qubits[2 * k] for k in range(n)]
        right = [qubits[2 * k + 1] for k in range(n)]
        for k in range(n):
            with _section(qc, notes, "source"):
                _bell_pair(qc, left[k], right[k])
            if not exp.channel.is_identity:
                with _section(qc, notes, "channel"):
                    apply_pauli_channel(
                        qc, exp.channel, right[k], qubits[2 * n + 2 * k], qubits[2 * n + 2 * k + 1]
                    )
        with _section(qc, notes, "bsm"):
            for j in range(n - 1):  # deferred Bell measurement at intermediate node j
                qc.cx(right[j], left[j + 1])
                qc.h(right[j])
        with _section(qc, notes, "basis"):
            _measure_in(qc, left[0], alice_basis, s.get("alice_deg"))
            _measure_in(qc, right[n - 1], bob_basis, s.get("bob_deg"))
        with _section(qc, notes, "measure"):
            qc.measure(left[0], clbits[0])
            qc.measure(right[n - 1], clbits[1])
            for j in range(n - 1):
                qc.measure(right[j], clbits[2 + 2 * j])  # m_x(j): control bit
                qc.measure(left[j + 1], clbits[3 + 2 * j])  # m_z(j): target bit
        return
    # purify: pair 1 (control) = qubits 0, 1; pair 2 (target) = qubits 2, 3
    a1, b1, a2, b2 = qubits[0], qubits[1], qubits[2], qubits[3]
    with _section(qc, notes, "source"):
        _bell_pair(qc, a1, b1)
        _bell_pair(qc, a2, b2)
    if not exp.channel.is_identity:
        with _section(qc, notes, "channel"):
            apply_pauli_channel(qc, exp.channel, b1, qubits[4], qubits[5])
            apply_pauli_channel(qc, exp.channel, b2, qubits[6], qubits[7])
    with _section(qc, notes, "purify"):
        if exp.rotation == "dejmps":
            qc.rx(math.pi / 2, a1)
            qc.rx(math.pi / 2, a2)
            qc.rx(-math.pi / 2, b1)
            qc.rx(-math.pi / 2, b2)
        qc.cx(a1, a2)
        qc.cx(b1, b2)
    with _section(qc, notes, "basis"):
        _measure_in(qc, a1, alice_basis, s.get("alice_deg"))
        _measure_in(qc, b1, bob_basis, s.get("bob_deg"))
    with _section(qc, notes, "measure"):
        qc.measure(a1, clbits[0])
        qc.measure(b1, clbits[1])
        qc.measure(a2, clbits[2])
        qc.measure(b2, clbits[3])


CANARY_NAME = "canary"


def canary_circuit() -> QuantumCircuit:
    """X on qubit 0 of two: the counts key must read '01' (little-endian check)."""
    qc = QuantumCircuit(QuantumRegister(2, "q"), ClassicalRegister(2, "c"), name=CANARY_NAME)
    qc.x(0)
    qc.measure([0, 1], [0, 1])
    return qc


@dataclass(frozen=True)
class Plan:
    """Circuits to submit plus where each unit's bits live (global clbit offsets)."""

    layout: str
    circuits: list
    placements: list  # (unit, circuit_index, clbit_offset)
    canary: dict  # {"circuit_index": int, "kind": "circuit"|"register", "clbit": int|None}
    total_qubits_largest: int


def build_plan(units: list[Unit], layout: str) -> Plan:
    if layout == "multi_circuit":
        circuits, placements = [], []
        for i, unit in enumerate(units):
            qr = QuantumRegister(unit.num_qubits, "q")
            cr = ClassicalRegister(unit.num_clbits, "c")
            qc = QuantumCircuit(qr, cr, name=unit.name)
            write_unit(qc, unit, list(qr), list(cr))
            circuits.append(qc)
            placements.append((unit, i, 0))
        circuits.append(canary_circuit())
        largest = max(u.num_qubits for u in units)
        return Plan(
            layout, circuits, placements, {"circuit_index": len(circuits) - 1, "kind": "circuit"}, largest
        )
    if layout == "packed_single_circuit":
        canary_q, canary_c = QuantumRegister(1, "canary_q"), ClassicalRegister(1, "canary")
        qregs = [QuantumRegister(u.num_qubits, f"q{i}") for i, u in enumerate(units)]
        cregs = [ClassicalRegister(u.num_clbits, f"u{i}") for i, u in enumerate(units)]
        qc = QuantumCircuit(canary_q, *qregs, canary_c, *cregs, name="packed")
        qc.x(canary_q[0])
        qc.measure(canary_q[0], canary_c[0])
        placements, offset = [], 1
        for unit, qr, cr in zip(units, qregs, cregs, strict=True):
            write_unit(qc, unit, list(qr), list(cr))
            placements.append((unit, 0, offset))
            offset += unit.num_clbits
        total = 1 + sum(u.num_qubits for u in units)
        return Plan(layout, [qc], placements, {"circuit_index": 0, "kind": "register", "clbit": 0}, total)
    raise ValueError(f"unknown layout {layout!r}")
