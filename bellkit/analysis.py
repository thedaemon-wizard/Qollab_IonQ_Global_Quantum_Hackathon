"""From per-setting outcome tables to estimates, intervals and the certificate ladder.

Confidence handling (Bonferroni): S is bracketed with Hoeffding at delta/2 and each QBER
with a Wilson interval at delta/2, so (S_low, Q_high) hold jointly with confidence >= 1 - delta.
Every certificate is reported twice: at the point estimate and at the conservative end.
"""

from __future__ import annotations

from bellkit import bounds
from bellkit.stats import Table, hoeffding_halfwidth_sum, hoeffding_halfwidth_witness, wilson_interval


def _setting_by_role(settings: list[dict], role: str) -> dict:
    for s in settings:
        if role in s["roles"]:
            return s
    raise KeyError(role)


def analyse(tables: dict[str, Table], settings: list[dict], delta: float) -> dict:
    """``tables`` maps setting id -> Table; ``settings`` are the resolved settings used."""
    half = delta / 2.0
    per_setting = {}
    for s in settings:
        t = tables[s["id"]]
        per_setting[s["id"]] = {
            **t.as_dict(),
            "N": t.total,
            "E": t.correlator(),
            "SE": t.standard_error(),
            "alice_deg": s.get("alice_deg"),
            "bob_deg": s.get("bob_deg"),
            "roles": s["roles"],
        }

    chsh = [s for s in settings if "chsh" in s["roles"]]
    s_point = sum(s["chsh_sign"] * per_setting[s["id"]]["E"] for s in chsh)
    s_se = sum(per_setting[s["id"]]["SE"] ** 2 for s in chsh) ** 0.5
    t_s = hoeffding_halfwidth_sum([per_setting[s["id"]]["N"] for s in chsh], half)

    def qber(role: str) -> dict:
        s = _setting_by_role(settings, role)
        t = tables[s["id"]]
        lo, hi = wilson_interval(t.disagreements, t.total, half)
        return {"point": t.disagreements / t.total, "low": lo, "high": hi, "N": t.total}

    q_z, q_x = qber("bbm92_z"), qber("bbm92_x")
    e_zz = per_setting[_setting_by_role(settings, "bbm92_z")["id"]]["E"]
    e_xx = per_setting[_setting_by_role(settings, "bbm92_x")["id"]]["E"]
    n_zz = per_setting[_setting_by_role(settings, "bbm92_z")["id"]]["N"]
    n_xx = per_setting[_setting_by_role(settings, "bbm92_x")["id"]]["N"]
    w_point = (e_xx + e_zz) / 2.0
    w_low = w_point - hoeffding_halfwidth_witness(n_xx, n_zz, half)

    yy = [s for s in settings if "witness_yy" in s["roles"]]
    fidelity = None
    if yy:
        e_yy = per_setting[yy[0]["id"]]["E"]
        fidelity = bounds.fidelity_from_correlators(e_xx, e_yy, e_zz)

    s_low, s_high = s_point - t_s, s_point + t_s
    ladder_point = bounds.certificate_ladder(s_point, q_z["point"], q_x["point"], e_xx, e_zz)
    ladder_conservative = bounds.certificate_ladder(s_low, q_z["high"], q_x["high"], w_low, w_low)
    return {
        "settings": per_setting,
        "S": {
            "point": s_point,
            "se": s_se,
            "low": s_low,
            "high": s_high,
            "halfwidth_hoeffding": t_s,
            "above_classical": s_low > bounds.LOCAL_BOUND,
            "inconclusive": s_low <= bounds.LOCAL_BOUND < s_high,
            "outside_quantum_set": s_point > bounds.TSIRELSON,
        },
        "Q_Z": q_z,
        "Q_X": q_x,
        "E_ZZ": e_zz,
        "E_XX": e_xx,
        "witness": {"point": w_point, "low": w_low},
        "fidelity_with_yy": fidelity,
        "ladder_point": ladder_point,
        "ladder_conservative": ladder_conservative,
        "delta": delta,
        "method": "Hoeffding (S, delta/2) and Wilson (QBER, delta/2); asymptotic formulas at confidence ends",
    }
