"""Circuits + decoder against closed-form models, with exact distributions (no sampling)."""

import math

import pytest
from qiskit import ClassicalRegister, QuantumCircuit, QuantumRegister

from bellkit import app, models
from bellkit.channels import PauliChannel
from bellkit.circuits import Experiment, build_plan, make_units, write_unit
from bellkit.decode import table_from_counts
from tests.conftest import exact_counts

TOL = 1e-9


def unit_circuit(unit):
    qr, cr = QuantumRegister(unit.num_qubits, "q"), ClassicalRegister(unit.num_clbits, "c")
    qc = QuantumCircuit(qr, cr)
    write_unit(qc, unit, list(qr), list(cr))
    return qc


def measured(exp, settings, yy=None, with_frame=True):
    out = {}
    for unit in make_units(exp, settings, yy):
        counts = exact_counts(unit_circuit(unit))
        cmap = unit.clbits
        if not with_frame:
            from dataclasses import replace

            cmap = replace(cmap, frame_z=(), frame_x=())
        table, kept, total = table_from_counts(counts, cmap, 0, unit.setting["bob_basis"])
        out[unit.setting["id"]] = (table.correlator(), kept / total)
    return out


def s_of(e, settings):
    return sum(s["chsh_sign"] * e[s["id"]][0] for s in settings if "chsh" in s["roles"])


@pytest.mark.parametrize(
    "channel",
    [
        PauliChannel.from_kind("depolarizing", 0.1),
        PauliChannel.from_kind("dephasing", 0.1),
        PauliChannel.from_kind("bit_flip", 0.1),
        PauliChannel.from_kind("y_flip", 0.1),
        PauliChannel(0.7, 0.1, 0.05, 0.15),
    ],
)
def test_bell_with_pauli_channel_matches_model(channel, settings):
    e = measured(Experiment("bell", channel), settings)
    pred = models.predict(channel, settings)
    for s in settings:
        assert e[s["id"]][0] == pytest.approx(pred["E"][s["id"]], abs=TOL)
    assert s_of(e, settings) == pytest.approx(pred["S_fixed"], abs=TOL)


def test_spec_vectors_for_werner_v09(settings):
    pred = models.predict(PauliChannel.from_kind("depolarizing", 0.1), settings)
    assert pred["S_fixed"] == pytest.approx(2.545584, abs=1e-6)
    assert pred["Q_Z"] == pytest.approx(0.05, abs=1e-12)
    assert pred["fidelity"] == pytest.approx(0.925, abs=1e-12)


@pytest.mark.parametrize(
    ("phi", "s_expected", "qx_expected"), [(0, 2.828427, 0.0), (90, 2.414214, 0.146447), (180, 1.414214, 0.5)]
)
def test_eavesdropper(phi, s_expected, qx_expected, settings):
    ch = PauliChannel.from_kind("none", 0.0)
    e = measured(Experiment("bell", ch, eve_phi_deg=phi), settings)
    assert s_of(e, settings) == pytest.approx(s_expected, abs=1e-6)
    assert (1 - e["x_x"][0]) / 2 == pytest.approx(qx_expected, abs=1e-6)
    assert (1 - e["key_z"][0]) / 2 == pytest.approx(0.0, abs=TOL)


@pytest.mark.parametrize(("kind", "e_yy"), [("depolarizing", -0.9), ("y_flip", -1.0), ("dephasing", -0.8)])
def test_yy_setting_separates_y_flip_from_werner(kind, e_yy, cfg, settings):
    ch = PauliChannel.from_kind(kind, 0.1)
    yy = app._yy_setting(cfg)
    e = measured(Experiment("bell", ch, include_yy=True), settings, yy)
    assert e["y_y"][0] == pytest.approx(e_yy, abs=TOL)


@pytest.mark.parametrize("hops", [1, 2, 3])
@pytest.mark.parametrize("kind", ["depolarizing", "y_flip", "dephasing"])
def test_chain_with_pauli_frame(hops, kind, settings):
    ch = PauliChannel.from_kind(kind, 0.1)
    e = measured(Experiment("chain", ch, hops=hops), settings)
    pred = models.predict(ch, settings, hops=hops)
    assert s_of(e, settings) == pytest.approx(pred["S_fixed"], abs=TOL)
    assert (1 - e["key_z"][0]) / 2 == pytest.approx(pred["Q_Z"], abs=TOL)


@pytest.mark.parametrize("hops", [2, 3])
def test_chain_without_frame_loses_all_correlation(hops, settings):
    e = measured(
        Experiment("chain", PauliChannel.from_kind("none", 0.0), hops=hops), settings, with_frame=False
    )
    assert all(abs(v[0]) < TOL for v in e.values())


def test_chain_spec_vectors(settings):
    for hops, s_expected in [(1, 2.545584), (2, 2.291026), (3, 2.061923)]:
        pred = models.predict(PauliChannel.from_kind("depolarizing", 0.1), settings, hops=hops)
        assert pred["S_fixed"] == pytest.approx(s_expected, abs=1e-6)


@pytest.mark.parametrize(
    ("kind", "rotation", "p_success", "s_expected"),
    [
        ("y_flip", "none", 0.82, 2.793934),
        ("y_flip", "dejmps", 1.0, 2.319310),
        ("dephasing", "none", 1.0, 2.319310),
        ("dephasing", "dejmps", 0.82, 2.793934),
        ("bit_flip", "none", 0.82, 2.793934),
    ],
)
def test_purification_post_selection(kind, rotation, p_success, s_expected, settings):
    ch = PauliChannel.from_kind(kind, 0.1)
    e = measured(Experiment("purify", ch, rotation=rotation), settings)
    assert s_of(e, settings) == pytest.approx(s_expected, abs=1e-6)
    for _, kept_fraction in e.values():
        assert kept_fraction == pytest.approx(p_success, abs=1e-9)
    pred = models.predict(ch, settings, purify_rotation=rotation)
    assert pred["P_success"] == pytest.approx(p_success, abs=1e-9)
    assert pred["S_fixed"] == pytest.approx(s_expected, abs=1e-6)


def test_purification_werner_input(settings):
    ch = PauliChannel.from_kind("depolarizing", 0.2)  # F = 0.85
    pred = models.predict(ch, settings, purify_rotation="none")
    assert pred["P_success"] == pytest.approx(0.82, abs=1e-9)
    assert pred["fidelity"] == pytest.approx(0.884146, abs=1e-6)
    assert pred["S_fixed"] == pytest.approx(2.483497, abs=1e-6)


def test_packed_layout_decodes_like_separate_circuits(settings):
    exp = Experiment("bell", PauliChannel.from_kind("none", 0.0), eve_phi_deg=90)
    units = make_units(exp, settings, None)
    plan = build_plan(units, "packed_single_circuit")
    counts = exact_counts(plan.circuits[0])
    assert all(k[-1] == "1" for k in counts)  # canary register is global clbit 0
    for unit, _ci, offset in plan.placements:
        table, _, _ = table_from_counts(counts, unit.clbits, offset, unit.setting["bob_basis"])
        expected = models.predict(exp.channel, settings, eve_phi_deg=90)["E"][unit.setting["id"]]
        assert table.correlator() == pytest.approx(expected, abs=TOL)
    assert math.isclose(plan.total_qubits_largest, 1 + 6 * 3)
