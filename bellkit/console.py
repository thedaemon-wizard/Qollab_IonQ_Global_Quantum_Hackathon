"""Summary lines for the run console on Qollab (judges are told to look there for results).

The functions only format numbers that a report already holds; they compute nothing. Python's
own output does not reach that console from a function the page calls, so each line travels
back in the JSON result as ``console_line`` and ui/core/api.js passes it to ``console.log``,
which Qollab routes to the console.
"""

from __future__ import annotations

from decimal import ROUND_HALF_UP, Decimal

TAG = "[Bell-Test Lab]"

# Certificates in the order of the ladder, with the report key that says whether each holds.
CERTIFICATES = (
    ("bell_violation", "Bell violation"),
    ("entangled_trusted", "entanglement witness"),
    ("rate_bbm92", "BBM92 key"),
    ("self_test_nontrivial", "self-test"),
    ("min_entropy_pironio", "DI randomness"),
    ("rate_di_acin", "DI key"),
)


def line(text: str) -> str:
    return f"{TAG} {text}"


def _pct(x: float, digits: int) -> str:
    """Percent with ties rounded up, as the page's toFixed does (Python's own format rounds
    exact ties to even), so the console and the page never differ in the last digit."""
    q = Decimal(100 * x).quantize(Decimal(1).scaleb(-digits), rounding=ROUND_HALF_UP)
    return f"{q}%"


def _holds(value) -> bool:
    return value is True or (isinstance(value, (int, float)) and not isinstance(value, bool) and value > 0)


def run_summary(report: dict) -> str:
    exp, a = report["experiment"], report["analysis"]
    titles = {"bell": "Bell Lab run", "chain": f"{exp['hops']}-link chain", "purify": "Purification run"}
    title = titles[exp["module"]]
    s, qz, qx = a["S"], a["Q_Z"], a["Q_X"]
    level = round(100 * (1 - a["delta"] / 2), 1)
    held = [name for key, name in CERTIFICATES if _holds(a["ladder_conservative"].get(key))]
    parts = [
        f"{title} on {report['backend']['name']}: {report['shots']} shots per setting, "
        f"{report['seconds']} s, canary {_pct(report['canary_fraction'], 0)}.",
        f"S = {s['point']:.3f} ({level}% interval {s['low']:.3f} to {s['high']:.3f});",
        f"Q_Z = {_pct(qz['point'], 2)}, Q_X = {_pct(qx['point'], 2)}.",
    ]
    if "purification" in report:
        p = report["purification"]
        parts.append(f"Kept {p['kept']} of {p['total']} rounds.")
    parts.append(f"Holding at the conservative end: {', '.join(held) if held else 'none'}.")
    return " ".join(parts)
