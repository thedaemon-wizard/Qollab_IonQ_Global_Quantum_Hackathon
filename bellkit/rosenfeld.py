"""Re-analysis of the Munich event-ready Bell test (Rosenfeld et al., PRL 119, 010402, 2017).

The open event files (Zenodo 10.5281/zenodo.22936124, CC BY 4.0) list one valid atom-atom
event per row: heralded state (Psi- or Psi+), lab-1 setting and result, lab-2 setting and
result. We map every event onto this project's CHSH form S = E00 + E01 + E10 - E11 with
x = lab-1 setting bit and y = lab-2 setting bit, using the per-event weight

    w = -u            if x = 0,
    w = +u            if x = 1 and the state is Psi-,
    w = -u            if x = 1 and the state is Psi+,

where u = +1 when both results agree and -1 otherwise. This is the paper's g-signed
estimator (Supplement Eq. S2) rewritten; E_xy is the mean of w over the events with
setting (x, y). The paper uses the first 5,000 events of each heralded state.

These data have no key-basis pair, so no QBER or key rate can be computed from them: only
the CHSH-based certificates apply.
"""

from __future__ import annotations

import csv
import math

from bellkit import bounds, paths
from bellkit.stats import hoeffding_halfwidth_sum

STATES = ("Psi-", "Psi+")
SETTINGS = ((0, 0), (0, 1), (1, 0), (1, 1))
CHSH_SIGN = {(0, 0): 1, (0, 1): 1, (1, 0): 1, (1, 1): -1}
RUNS = {
    "2016-04-15": {"path": paths.ROSENFELD_APRIL, "label": "15 April 2016 run (main-text S)"},
    "2016-06-14": {"path": paths.ROSENFELD_JUNE, "label": "14 June 2016 public run"},
}


def read_events(path: str) -> list[tuple[str, int, int]]:
    """(state, setting key (x, y) packed as 2x+y, u) for every row, in file order."""
    events = []
    with open(path, encoding="utf-8", newline="") as fh:
        reader = csv.reader(fh, delimiter="\t")
        header = next(reader)
        col = {name: i for i, name in enumerate(header)}
        for row in reader:
            state = row[col["Bell-state"]]
            if state not in STATES:
                raise ValueError(f"unexpected Bell-state {state!r}")
            x, y = int(row[col["setting lab 1"]]), int(row[col["setting lab 2"]])
            u = 1 if row[col["result lab 1"]] == row[col["result lab 2"]] else -1
            events.append((state, 2 * x + y, u))
    return events


def first_per_state(events: list, n: int) -> list:
    """Keep the first ``n`` events of each heralded state, preserving file order."""
    seen = dict.fromkeys(STATES, 0)
    kept = []
    for ev in events:
        if seen[ev[0]] < n:
            seen[ev[0]] += 1
            kept.append(ev)
    return kept


def _weight(state: str, key: int, u: int) -> int:
    x = key >> 1
    if x == 0:
        return -u
    return u if state == "Psi-" else -u


def _chsh(sums: list[float], counts: list[int]) -> dict:
    corr = {}
    for k, (x, y) in enumerate(SETTINGS):
        corr[f"E{x}{y}"] = sums[k] / counts[k] if counts[k] else float("nan")
    s = sum(CHSH_SIGN[xy] * corr[f"E{xy[0]}{xy[1]}"] for xy in SETTINGS)
    se = math.sqrt(sum((1.0 - corr[f"E{x}{y}"] ** 2) / counts[k] for k, (x, y) in enumerate(SETTINGS)))
    return {
        "S": s,
        "se": se,
        "E": corr,
        "N": dict(zip([f"N{x}{y}" for x, y in SETTINGS], counts, strict=True)),
    }


def estimate(events: list) -> dict:
    sums, counts = [0.0] * 4, [0] * 4
    for state, key, u in events:
        sums[key] += _weight(state, key, u)
        counts[key] += 1
    return _chsh(sums, counts)


def running_s(events: list, points: int) -> list[dict]:
    """S after the first k events, at about ``points`` evenly spaced k (for the chart)."""
    step = max(1, len(events) // points)
    sums, counts, out = [0.0] * 4, [0] * 4, []
    for i, (state, key, u) in enumerate(events, start=1):
        sums[key] += _weight(state, key, u)
        counts[key] += 1
        if (i % step == 0 or i == len(events)) and all(counts):
            r = _chsh(sums, counts)
            out.append({"events": i, "S": r["S"], "se": r["se"]})
    return out


def certificates(s: float) -> dict:
    """CHSH-only certificates (no QBER available in these data)."""
    return {
        "S": s,
        "bell_violation": bounds.is_bell_violation(s),
        "kaniewski_F": bounds.kaniewski_extractability(s),
        "pironio_Hmin": bounds.min_entropy_pironio(s),
        "local_HBE": bounds.local_von_neumann(s),
    }


def analyse_run(run_id: str, events_per_state: int, delta: float, points: int) -> dict:
    """One run: per state, pooled, Hoeffding lower end, running S.

    Only S is estimated from these data, so the whole ``delta`` goes to the S interval.
    """
    meta = RUNS[run_id]
    events = first_per_state(read_events(meta["path"]), events_per_state)
    per_state = {st: estimate([e for e in events if e[0] == st]) for st in STATES}
    pooled = estimate(events)
    half = hoeffding_halfwidth_sum(list(pooled["N"].values()), delta)
    return {
        "run": run_id,
        "label": meta["label"],
        "events_per_state": events_per_state,
        "delta": delta,
        "per_state": per_state,
        "pooled": pooled,
        "hoeffding_halfwidth": half,
        "S_low": pooled["S"] - half,
        "point": certificates(pooled["S"]),
        "conservative": certificates(pooled["S"] - half),
        "running": running_s(events, points),
    }
