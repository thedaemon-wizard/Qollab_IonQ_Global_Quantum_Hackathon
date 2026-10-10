"""Closed-form bounds on keys, randomness and states as functions of CHSH S and QBERs.

Every function evaluates a published asymptotic formula. Called with confidence-interval
endpoints they give conservative *illustrations*; they are not finite-size security proofs.

Sources (see docs/references.md):
- BBM92 / Shor-Preskill rate 1 - h(e_Z) - h(e_X) (trusted devices, one-way, asymptotic).
- Acin et al., PRL 98, 230501 (2007), Eqs. (2)-(3); Pironio et al., NJP 11, 045021 (2009),
  Eqs. (11)-(12): DI key rate against collective attacks.
- Pironio et al., Nature 464, 1021 (2010), App. A Eq. (6): local min-entropy bound.
- Kaniewski, PRL 117, 070402 (2016), Eq. (10): self-testing extractability bound.
- Toth & Guhne, PRL 94, 060501 (2005), Thm 1: two-setting fidelity witness.
"""

from __future__ import annotations

import math

SQRT2 = math.sqrt(2.0)
TSIRELSON = 2.0 * SQRT2
LOCAL_BOUND = 2.0
KANIEWSKI_BETA = (16.0 + 14.0 * SQRT2) / 17.0


def binary_entropy(x: float) -> float:
    if x <= 0.0 or x >= 1.0:
        return 0.0
    return -x * math.log2(x) - (1.0 - x) * math.log2(1.0 - x)


def _clamp_qber(q: float) -> float:
    return min(max(q, 0.0), 0.5)


def _clamp_s(s: float) -> float:
    return min(s, TSIRELSON)


def is_bell_violation(s: float) -> bool:
    return s > LOCAL_BOUND


def eve_holevo_chsh(s: float) -> float:
    """Pironio 2009 Eq. (11): upper bound on Eve's Holevo information for CHSH value s."""
    if not is_bell_violation(s):
        return 1.0
    sc = _clamp_s(s)
    return binary_entropy((1.0 + math.sqrt((sc / 2.0) ** 2 - 1.0)) / 2.0)


def bbm92_rate(e_z: float, e_x: float) -> float:
    """Trusted-device asymptotic key fraction (may be negative: no key)."""
    return 1.0 - binary_entropy(_clamp_qber(e_z)) - binary_entropy(_clamp_qber(e_x))


def di_rate_acin(s: float, q: float) -> float | None:
    """Acin 2007 DI key fraction; ``None`` means 'not certified' (S <= 2)."""
    if not is_bell_violation(s):
        return None
    return 1.0 - binary_entropy(_clamp_qber(q)) - eve_holevo_chsh(s)


def local_von_neumann(s: float) -> float:
    """H(B|E) for the output of a CHSH-setting measurement (0 when S <= 2)."""
    return 1.0 - eve_holevo_chsh(s)


def min_entropy_pironio(s: float) -> float:
    """Pironio 2010 local min-entropy bound per run (0 when S <= 2)."""
    if not is_bell_violation(s):
        return 0.0
    sc = _clamp_s(s)
    return 1.0 - math.log2(1.0 + math.sqrt(max(0.0, 2.0 - sc * sc / 4.0)))


def kaniewski_extractability(s: float) -> float:
    """Kaniewski 2016 lower bound on singlet extractability (trivial value 1/2)."""
    sc = _clamp_s(s)
    return max(0.5, 0.5 + 0.5 * (sc - KANIEWSKI_BETA) / (TSIRELSON - KANIEWSKI_BETA))


def fidelity_bracket(e_xx: float, e_zz: float) -> tuple[float, float]:
    """Bounds on <Phi+|rho|Phi+> when only XX and ZZ are measured (any two-qubit state)."""
    return max(0.0, (e_xx + e_zz) / 2.0), (1.0 + min(e_xx, e_zz)) / 2.0


def fidelity_from_correlators(e_xx: float, e_yy: float, e_zz: float) -> float:
    """<Phi+|rho|Phi+> = (1 + XX - YY + ZZ) / 4 (needs the YY setting)."""
    return (1.0 + e_xx - e_yy + e_zz) / 4.0


def bisect(f, lo: float, hi: float, tol: float = 1e-13) -> float:
    """Root of a continuous f on [lo, hi] with a sign change (no SciPy at runtime)."""
    f_lo = f(lo)
    if f_lo * f(hi) > 0:
        raise ValueError("no sign change on the bracket")
    while hi - lo > tol:
        mid = 0.5 * (lo + hi)
        f_mid = f(mid)
        if f_lo * f_mid <= 0:
            hi = mid
        else:
            lo, f_lo = mid, f_mid
    return 0.5 * (lo + hi)


def di_zero_s(q: float) -> float | None:
    """The S at which the Acin rate is zero for QBER q (None if no S <= 2*sqrt(2) gives a key)."""
    if di_rate_acin(TSIRELSON, q) <= 0.0:
        return None
    lo = LOCAL_BOUND + 1e-12
    if di_rate_acin(lo, q) >= 0.0:  # q = 0: any violation gives a key
        return LOCAL_BOUND
    return bisect(lambda s: di_rate_acin(s, q), lo, TSIRELSON)


def werner_s(q: float) -> float:
    """CHSH value of the Werner (depolarised Phi+) state with QBER q, at the fixed angles."""
    return TSIRELSON * (1.0 - 2.0 * q)


def thresholds() -> dict:
    """Where each certificate switches on along the Werner family (computed, not typed in)."""
    q_bbm92 = bisect(lambda q: bbm92_rate(q, q), 1e-9, 0.5 - 1e-9)
    q_acin = bisect(lambda q: di_rate_acin(werner_s(q), q), 1e-6, 0.1464)
    q_chsh = (1.0 - LOCAL_BOUND / TSIRELSON) / 2.0
    q_kaniewski = (1.0 - KANIEWSKI_BETA / TSIRELSON) / 2.0
    return {
        "chsh": {"S": LOCAL_BOUND, "Q_werner": q_chsh, "v_werner": 1.0 - 2.0 * q_chsh},
        "kaniewski": {"S": KANIEWSKI_BETA, "Q_werner": q_kaniewski, "v_werner": 1.0 - 2.0 * q_kaniewski},
        "bbm92": {"S_werner": werner_s(q_bbm92), "Q": q_bbm92, "v_werner": 1.0 - 2.0 * q_bbm92},
        "acin": {"S_werner": werner_s(q_acin), "Q_werner": q_acin, "v_werner": 1.0 - 2.0 * q_acin},
        "witness": {"v_werner": 0.5},
        "tsirelson": TSIRELSON,
    }


def certificate_ladder(s: float, q_z: float, q_x: float, e_xx: float, e_zz: float) -> dict:
    """All certificates for one (S, Q_Z, Q_X, XX, ZZ) tuple, plus which ones are 'on'."""
    f_lo, f_hi = fidelity_bracket(e_xx, e_zz)
    r_di = di_rate_acin(s, q_z)
    return {
        "witness_fidelity_low": f_lo,
        "witness_fidelity_high": f_hi,
        "entangled_trusted": f_lo > 0.5,
        "bell_violation": is_bell_violation(s),
        "kaniewski_extractability": kaniewski_extractability(s),
        "self_test_nontrivial": s > KANIEWSKI_BETA,
        "min_entropy_pironio": min_entropy_pironio(s),
        "von_neumann_local": local_von_neumann(s),
        "rate_bbm92": bbm92_rate(q_z, q_x),
        "rate_di_acin": r_di,
        "di_certified": r_di is not None and r_di > 0.0,
    }
