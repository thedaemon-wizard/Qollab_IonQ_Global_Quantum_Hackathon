"""Published DI-QKD experiments evaluated with this project's bounds.

``data/experiments.json`` holds the published S and Q values (with sources). Here we
evaluate the same asymptotic formulas the app uses on them, at the central values and at
the one-sigma "unfavourable corner" (S - sigma_S, Q + sigma_Q). These are our
recomputations, not the authors' key rates; their protocols differ in detail.

For Lu et al. 2026 the deposited Fig. 5C rates are shown next to our (1 - gamma) r_Acin.
Ours is 0.0008-0.0015 higher at every distance; the authors' exact formula is not printed
in the paper, so the difference is reported, not explained.
"""

from __future__ import annotations

import json

from bellkit import bounds, paths


def load() -> dict:
    with open(paths.EXPERIMENTS, encoding="utf-8") as fh:
        return json.load(fh)


def _rates(s: float, q: float | None) -> dict:
    out = {
        "kaniewski_F": bounds.kaniewski_extractability(s),
        "pironio_Hmin": bounds.min_entropy_pironio(s),
    }
    out["di_rate_acin"] = bounds.di_rate_acin(s, q) if q is not None else None
    return out


def evaluate_point(p: dict) -> dict:
    s, q = p["S"], p["Q"]
    corner_s = s - p["S_err"]
    corner_q = q + p["Q_err"] if q is not None else None
    return {
        **p,
        "central": _rates(s, q),
        "corner": {"S": corner_s, "Q": corner_q, **_rates(corner_s, corner_q)},
    }


def evaluate_published_rates(block: dict) -> list[dict]:
    gamma = block["test_round_fraction"]
    rows = []
    for r in block["rows"]:
        ours = bounds.di_rate_acin(r["S"], r["Q"])
        ours_scaled = (1.0 - gamma) * ours if ours is not None else None
        corner = bounds.di_rate_acin(r["S"] - r["S_err"], r["Q"] + r["Q_err"])
        rows.append(
            {
                **r,
                "ours": ours_scaled,
                "difference": ours_scaled - r["rate"] if ours_scaled is not None else None,
                "corner": corner,
            }
        )
    return rows


def summary() -> dict:
    data = load()
    return {
        "sources": data["sources"],
        "note": data["note"],
        "points": [evaluate_point(p) for p in data["points"]],
        "published_rates": {
            **{k: v for k, v in data["published_rates"].items() if k != "rows"},
            "rows": evaluate_published_rates(data["published_rates"]),
        },
    }
