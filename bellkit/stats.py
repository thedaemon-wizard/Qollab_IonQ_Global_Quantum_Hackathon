"""Correlators from counts, and finite-sample confidence intervals.

- Correlator per setting: E = (n00 + n11 - n01 - n10) / N with N the realised total.
- S interval: Hoeffding for a sum of independent bounded terms (each shot of setting k
  contributes a term with range 2/N_k): t = sqrt(2 ln(2/delta) * sum_k 1/N_k).
- QBER interval: Wilson score interval.
Both assume independent shots; they are not composable security statements.
"""

from __future__ import annotations

import math
from dataclasses import dataclass
from statistics import NormalDist


@dataclass(frozen=True)
class Table:
    """Joint outcome counts of one setting: n[a][b] for Alice bit a and Bob bit b."""

    n00: int
    n01: int
    n10: int
    n11: int

    @property
    def total(self) -> int:
        return self.n00 + self.n01 + self.n10 + self.n11

    @property
    def disagreements(self) -> int:
        return self.n01 + self.n10

    def correlator(self) -> float:
        if self.total == 0:
            raise ValueError("empty table")
        return (self.n00 + self.n11 - self.n01 - self.n10) / self.total

    def standard_error(self) -> float:
        e = self.correlator()
        return math.sqrt(max(0.0, 1.0 - e * e) / self.total)

    def as_dict(self) -> dict:
        return {"n00": self.n00, "n01": self.n01, "n10": self.n10, "n11": self.n11}


def hoeffding_halfwidth_sum(totals: list[int], delta: float) -> float:
    """Two-sided Hoeffding half-width for sum_k (+-) E_k, each E_k a mean of N_k values in [-1, 1]."""
    return math.sqrt(2.0 * math.log(2.0 / delta) * sum(1.0 / n for n in totals))


def hoeffding_halfwidth_witness(n_xx: int, n_zz: int, delta: float) -> float:
    """Two-sided Hoeffding half-width for (E_XX + E_ZZ) / 2."""
    return math.sqrt(math.log(2.0 / delta) * (1.0 / n_xx + 1.0 / n_zz) / 2.0)


def wilson_interval(k: int, n: int, delta: float) -> tuple[float, float]:
    """Two-sided Wilson score interval at confidence 1 - delta for a binomial proportion."""
    if n <= 0:
        raise ValueError("n must be positive")
    z = NormalDist().inv_cdf(1.0 - delta / 2.0)
    p = k / n
    denom = 1.0 + z * z / n
    centre = (p + z * z / (2.0 * n)) / denom
    half = z / denom * math.sqrt(p * (1.0 - p) / n + z * z / (4.0 * n * n))
    return max(0.0, centre - half), min(1.0, centre + half)
