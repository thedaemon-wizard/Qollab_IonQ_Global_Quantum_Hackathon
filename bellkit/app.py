"""The interface main.js calls. Every function takes and returns JSON strings.

Only ``backend`` crosses the JS/Python boundary as an object (Qollab injects it into JS);
everything else is plain JSON so that no proxies leak between the two runtimes.
"""

from __future__ import annotations

import json
import math

from bellkit import analysis, bounds, config, decode, execution, experiments, geometry, models, rosenfeld
from bellkit.channels import PauliChannel
from bellkit.circuits import Experiment, build_plan, make_units, write_unit
from bellkit.stats import Table

SCHEMA_RUN = "bellkit.run/1"


class RequestError(ValueError):
    """The request from the UI is outside the configured ranges."""


def _within(value: float, rng: dict, name: str) -> float:
    if not rng["min"] <= value <= rng["max"]:
        raise RequestError(f"{name}={value} is outside [{rng['min']}, {rng['max']}]")
    return value


def parse_request(req: dict, cfg: dict) -> Experiment:
    channel_req = req.get("channel", {"kind": "none"})
    kind = channel_req.get("kind", "none")
    if kind == "custom":
        p = channel_req["p"]
        channel = PauliChannel(p["p_i"], p["p_x"], p["p_y"], p["p_z"])
    else:
        strength = (
            0.0
            if kind == "none"
            else _within(float(channel_req["strength"]), cfg["channels"]["strength"], "strength")
        )
        channel = PauliChannel.from_kind(kind, strength)
    module = req.get("module", "bell")
    eve = req.get("eve") or {}
    phi = _within(float(eve["phi_deg"]), cfg["eve"]["phi_deg"], "phi_deg") if eve.get("enabled") else None
    hops = int(req.get("hops", 1))
    if module == "chain":
        _within(hops, cfg["chain"]["hops"], "hops")
    return Experiment(
        module=module,
        channel=channel,
        eve_phi_deg=phi,
        hops=hops if module == "chain" else 1,
        rotation=req.get("rotation", "none") if module == "purify" else "none",
        include_yy=bool(req.get("include_yy", False)) and module == "bell",
    )


def _yy_setting(cfg: dict) -> dict | None:
    for s in cfg.get("optional_settings", []):
        if "witness_yy" in s["roles"]:
            return {
                "id": s["id"],
                "alice_basis": s["alice_basis"],
                "bob_basis": s["bob_basis"],
                "roles": s["roles"],
            }
    return None


def _settings_used(cfg: dict, exp: Experiment) -> list[dict]:
    used = config.settings(cfg)
    if exp.include_yy:
        used.append(_yy_setting(cfg))
    return used


def config_json() -> str:
    return json.dumps(config.load())


def describe_backend_json(backend) -> str:
    cfg = config.load()
    name = str(getattr(backend, "name", "unknown"))
    profile = config.resolve_profile(cfg, name)
    return json.dumps(
        {
            "name": name,
            "num_qubits": getattr(backend, "num_qubits", None),
            "profile": {k: v for k, v in profile.items() if k != "match"},
        }
    )


def _prediction(exp: Experiment, cfg: dict) -> dict:
    return models.predict(
        exp.channel,
        _settings_used(cfg, exp),
        eve_phi_deg=exp.eve_phi_deg,
        hops=exp.hops,
        purify_rotation=exp.rotation if exp.module == "purify" else None,
    )


def run_json(backend, request_json: str) -> str:
    cfg = config.load()
    req = json.loads(request_json)
    exp = parse_request(req, cfg)
    name = str(getattr(backend, "name", "unknown"))
    profile = config.resolve_profile(cfg, name)
    if profile.get("refuse"):
        raise execution.RefusedBackend(profile["refuse_reason"])
    settings = _settings_used(cfg, exp)
    units = make_units(exp, config.settings(cfg), _yy_setting(cfg) if exp.include_yy else None)
    plan = build_plan(units, profile["layout"])
    shots = int(req.get("shots") or profile["shots"])
    seed = req.get("seed", cfg["seed"])
    run = execution.run_plan(backend, plan, profile, shots, seed)

    canary_counts = run["counts"][plan.canary["circuit_index"]]
    canary = decode.canary_fraction(
        canary_counts, plan.canary["kind"], cfg["canary"]["expected"], plan.canary.get("clbit")
    )
    if canary < cfg["canary"]["min_majority_fraction"]:
        raise decode.BitOrderError(f"canary read as expected in only {canary:.1%} of shots")

    tables: dict[str, Table] = {}
    selection = {}
    for unit, circuit_index, offset in plan.placements:
        table, kept, total = decode.table_from_counts(
            run["counts"][circuit_index], unit.clbits, offset, unit.setting["bob_basis"]
        )
        tables[unit.setting["id"]] = table
        selection[unit.setting["id"]] = {"kept": kept, "total": total}
    result = analysis.analyse(tables, settings, cfg["confidence"]["delta"])
    chsh_ids = [s["id"] for s in settings if "chsh" in s["roles"]]
    measured_e = tuple(result["settings"][i]["E"] for i in chsh_ids)
    report = {
        "schema": SCHEMA_RUN,
        "backend": {"name": name, "profile": profile["id"], "profile_label": profile["label"]},
        "request": req,
        "experiment": {
            "module": exp.module,
            "channel": exp.channel.as_dict(),
            "eve_phi_deg": exp.eve_phi_deg,
            "hops": exp.hops,
            "rotation": exp.rotation,
            "include_yy": exp.include_yy,
        },
        "layout": plan.layout,
        "shots": shots,
        "seed": seed if profile.get("seed_option") else None,
        "seconds": run["seconds"],
        "canary_fraction": canary,
        "circuits": {"logical": run["logical"], "compiled": run["compiled"]},
        "selection": selection,
        "analysis": result,
        "prediction": _prediction(exp, cfg),
        "geometry": geometry.membership(measured_e),
    }
    if exp.module == "purify":
        kept = sum(v["kept"] for v in selection.values())
        total = sum(v["total"] for v in selection.values())
        report["purification"] = {"P_success_measured": kept / total, "kept": kept, "total": total}
    return json.dumps(report)


def _grid(lo: float, hi: float, points: int) -> list[float]:
    return [lo + (hi - lo) * i / (points - 1) for i in range(points)]


def theory_json(request_json: str) -> str:
    cfg = config.load()
    req = json.loads(request_json)
    exp = parse_request(req, cfg)
    points = cfg["theory_grid"]["points"]
    settings = config.settings(cfg)
    kind = req.get("channel", {}).get("kind", "none")
    rng = cfg["channels"]["strength"]
    strength_curve = []
    if kind not in ("none", "custom"):
        for q in _grid(rng["min"], rng["max"], points):
            ch = PauliChannel.from_kind(kind, q)
            p = models.predict(ch, settings, eve_phi_deg=exp.eve_phi_deg)
            strength_curve.append(
                {
                    "strength": q,
                    "S": p["S_fixed"],
                    "Q_Z": p["Q_Z"],
                    "Q_X": p["Q_X"],
                    "rate_bbm92": bounds.bbm92_rate(p["Q_Z"], p["Q_X"]),
                    "rate_di": bounds.di_rate_acin(p["S_fixed"], p["Q_Z"]),
                }
            )
    werner = []
    for q in _grid(0.0, 0.16, points):
        s = bounds.werner_s(q)
        werner.append(
            {"Q": q, "S": s, "rate_bbm92": bounds.bbm92_rate(q, q), "rate_di": bounds.di_rate_acin(s, q)}
        )
    s_curve = []
    for s in _grid(2.0, bounds.TSIRELSON, points):
        s_curve.append(
            {
                "S": s,
                "min_entropy": bounds.min_entropy_pironio(s),
                "von_neumann": bounds.local_von_neumann(s),
                "kaniewski": bounds.kaniewski_extractability(s),
            }
        )
    hops_rng = cfg["chain"]["hops"]
    hops_curve = []
    for n in range(hops_rng["min"], hops_rng["max"] + 1):
        p = models.predict(exp.channel, settings, hops=n)
        hops_curve.append(
            {
                "hops": n,
                "S": p["S_fixed"],
                "Q_Z": p["Q_Z"],
                "Q_X": p["Q_X"],
                "rate_bbm92": bounds.bbm92_rate(p["Q_Z"], p["Q_X"]),
                "rate_di": bounds.di_rate_acin(p["S_fixed"], p["Q_Z"]),
            }
        )
    purification = {}
    for rotation in cfg["purification"]["rotations"]:
        p = models.predict(exp.channel, settings, purify_rotation=rotation)
        purification[rotation] = {"P_success": p["P_success"], "fidelity": p["fidelity"], "S": p["S_fixed"]}
    return json.dumps(
        {
            "prediction": _prediction(exp, cfg),
            "thresholds": bounds.thresholds(),
            "strength_curve": strength_curve,
            "werner_rates": werner,
            "s_curve": s_curve,
            "hops_curve": hops_curve,
            "purification": purification,
            "input_fidelity": exp.channel.p_i,
        }
    )


def circuits_json(request_json: str) -> str:
    """Logical circuits of every setting, with sections for the diagram and Qiskit's text drawing."""
    cfg = config.load()
    exp = parse_request(json.loads(request_json), cfg)
    units = make_units(exp, config.settings(cfg), _yy_setting(cfg) if exp.include_yy else None)
    out = []
    from qiskit import ClassicalRegister, QuantumCircuit, QuantumRegister

    for unit in units:
        qr, cr = QuantumRegister(unit.num_qubits, "q"), ClassicalRegister(unit.num_clbits, "c")
        qc = QuantumCircuit(qr, cr, name=unit.name)
        notes: list = []
        write_unit(qc, unit, list(qr), list(cr), notes)
        section_of = {}
        for group, start, end in notes:
            for i in range(start, end):
                section_of[i] = group
        ops = []
        for i, inst in enumerate(qc.data):
            ops.append(
                {
                    "name": inst.operation.name,
                    "qubits": [qc.find_bit(q).index for q in inst.qubits],
                    "clbits": [qc.find_bit(c).index for c in inst.clbits],
                    "params": [float(p) for p in inst.operation.params],
                    "section": section_of.get(i, "other"),
                }
            )
        out.append(
            {
                "name": unit.name,
                "setting": unit.setting["id"],
                "num_qubits": unit.num_qubits,
                "num_clbits": unit.num_clbits,
                "ops": ops,
                "text": str(qc.draw(output="text", fold=-1)),
            }
        )
    packed = sum(u.num_qubits for u in units) + 1
    return json.dumps({"units": out, "packed_qubits": packed})


def geometry_json(points_json: str) -> str:
    cfg = config.load()
    named = json.loads(points_json) if points_json else {}
    s2 = 1.0 / math.sqrt(2.0)
    refs = {
        "Tsirelson point": (s2, s2, s2, -s2),
        "PR box": (1.0, 1.0, 1.0, -1.0),
        "local deterministic": (1.0, 1.0, 1.0, 1.0),
    }
    refs.update({k: tuple(v) for k, v in named.items()})
    return json.dumps(
        {
            "mesh": geometry.symmetric_mesh(cfg["theory_grid"]["points"] // 2 + 1),
            "points": {k: geometry.membership(v) for k, v in refs.items()},
        }
    )


def rosenfeld_json() -> str:
    """Both Munich runs re-analysed, with the pooled correlators placed in the CHSH geometry."""
    cfg = config.load()
    rcfg = cfg["rosenfeld"]
    runs = []
    for run_id in rosenfeld.RUNS:
        r = rosenfeld.analyse_run(
            run_id, rcfg["events_per_state"], cfg["confidence"]["delta"], rcfg["running_points"]
        )
        e = r["pooled"]["E"]
        r["geometry"] = geometry.membership((e["E00"], e["E01"], e["E10"], e["E11"]))
        runs.append(r)
    return json.dumps({"runs": runs, "thresholds": bounds.thresholds()})


def experiments_json() -> str:
    return json.dumps({**experiments.summary(), "thresholds": bounds.thresholds()})


def selftest_json() -> str:
    """Fast in-app checks of the formulas against published or derived values."""
    th = bounds.thresholds()
    checks = [
        ("BBM92 threshold Q = 0.1100278644", abs(th["bbm92"]["Q"] - 0.1100278644) < 1e-9),
        ("Acin threshold S = 2.4240086649 (Werner)", abs(th["acin"]["S_werner"] - 2.4240086649) < 1e-8),
        ("Pironio H_min(2.5) = 0.267568", abs(bounds.min_entropy_pironio(2.5) - 0.267568) < 1e-6),
        (
            "Kaniewski bound at S = 2.5 is 0.772748",
            abs(bounds.kaniewski_extractability(2.5) - 0.772748) < 1e-6,
        ),
        (
            "Werner v = 0.9 gives S = 2.545584",
            abs(
                models.predict(PauliChannel.from_kind("depolarizing", 0.1), config.settings(config.load()))[
                    "S_fixed"
                ]
                - 2.545584
            )
            < 1e-6,
        ),
        (
            "Tsirelson point lies on the quantum boundary",
            abs(geometry.max_tlm((2**-0.5,) * 3 + (-(2**-0.5),)) - math.pi) < 1e-9,
        ),
        ("PR box is outside the quantum set", not geometry.in_quantum((1.0, 1.0, 1.0, -1.0))),
        (
            "Munich 15 April 2016 run: S = 2.2213 (paper 2.221)",
            abs(
                rosenfeld.estimate(
                    rosenfeld.first_per_state(
                        rosenfeld.read_events(rosenfeld.RUNS["2016-04-15"]["path"]),
                        config.load()["rosenfeld"]["events_per_state"],
                    )
                )["S"]
                - 2.2213
            )
            < 1e-4,
        ),
    ]
    return json.dumps(
        {
            "passed": sum(ok for _, ok in checks),
            "total": len(checks),
            "checks": [{"name": n, "ok": bool(ok)} for n, ok in checks],
        }
    )
