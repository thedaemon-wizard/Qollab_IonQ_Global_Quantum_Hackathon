"""Closed-form predictions (no sampling) for what the circuits should produce.

The shared state is described by its correlation matrix in the Bell basis, diagonal
(T_xx, T_yy, T_zz) for every case built here. A measurement at angles (theta_A, theta_B)
in the X-Z plane then gives E = T_zz cos(tA) cos(tB) + T_xx sin(tA) sin(tB).

- Link channel: T = (l_X, -l_Y, l_Z) (Phi+ has T = (1, -1, 1)).
- Eavesdropper cry(phi) before the channel: T_xx and T_yy scale by cos(phi/2).
- Chain of n links with the Pauli frame: T_zz = l_Z^n, T_xx = l_X^n, T_yy = -l_Y^n.
- Purification: recurrence on Bell weights (DEJMPS, PRL 77, 2818 (1996), Eq. 7).
"""

from __future__ import annotations

import math

from bellkit.bounds import SQRT2
from bellkit.channels import PauliChannel


def bell_weights_to_t(weights: tuple[float, float, float, float]) -> tuple[float, float, float]:
    """(A, B, C, D) weights of (Phi+, Psi-, Psi+, Phi-) -> (T_xx, T_yy, T_zz)."""
    a, b, c, d = weights
    return a - b + c - d, -a - b + c + d, a - b - c + d


def purify_step(weights: tuple[float, float, float, float], rotation: str) -> tuple[tuple, float]:
    """One bilateral-CNOT round with Z-parity post-selection. Returns (new weights, P_success)."""
    a, b, c, d = weights
    if rotation == "dejmps":  # Rx(+pi/2) on Alice, Rx(-pi/2) on Bob swaps Psi- and Phi-
        b, d = d, b
    norm = (a + d) ** 2 + (b + c) ** 2
    new = ((a * a + d * d) / norm, 2 * b * c / norm, (b * b + c * c) / norm, 2 * a * d / norm)
    return new, norm


def correlation_diagonal(
    channel: PauliChannel, eve_phi_deg: float | None = None, hops: int = 1, purify_rotation: str | None = None
) -> tuple[float, float, float]:
    if purify_rotation is not None:
        weights, _ = purify_step(channel.bell_weights(), purify_rotation)
        return bell_weights_to_t(weights)
    t_xx, t_yy, t_zz = channel.l_x**hops, -(channel.l_y**hops), channel.l_z**hops
    if eve_phi_deg is not None:
        c = math.cos(math.radians(eve_phi_deg) / 2.0)
        t_xx *= c
        t_yy *= c
    return t_xx, t_yy, t_zz


def correlator(t: tuple[float, float, float], alice_deg: float, bob_deg: float) -> float:
    t_xx, _, t_zz = t
    ta, tb = math.radians(alice_deg), math.radians(bob_deg)
    return t_zz * math.cos(ta) * math.cos(tb) + t_xx * math.sin(ta) * math.sin(tb)


def predict(
    channel: PauliChannel,
    settings: list[dict],
    eve_phi_deg: float | None = None,
    hops: int = 1,
    purify_rotation: str | None = None,
) -> dict:
    t = correlation_diagonal(channel, eve_phi_deg, hops, purify_rotation)
    t_xx, t_yy, t_zz = t
    per = {s["id"]: correlator(t, s["alice_deg"], s["bob_deg"]) for s in settings if "alice_deg" in s}
    chsh = [s for s in settings if "chsh" in s["roles"]]
    out = {
        "T": {"xx": t_xx, "yy": t_yy, "zz": t_zz},
        "E": per,
        "S_fixed": sum(s["chsh_sign"] * per[s["id"]] for s in chsh),
        "S_max_horodecki": 2.0 * math.sqrt(sum(sorted((t_xx**2, t_yy**2, t_zz**2))[1:])),
        "Q_Z": (1.0 - t_zz) / 2.0,
        "Q_X": (1.0 - t_xx) / 2.0,
        "fidelity": (1.0 + t_xx - t_yy + t_zz) / 4.0,
    }
    if purify_rotation is not None:
        _, p_success = purify_step(channel.bell_weights(), purify_rotation)
        out["P_success"] = p_success
    if eve_phi_deg is not None:
        half = math.radians(eve_phi_deg) / 2.0
        out["eve_agree_z"] = 0.5 + math.sin(half) ** 2 / 2.0
        out["eve_guess_helstrom"] = (1.0 + math.sin(half)) / 2.0
    return out


def s_fixed_from_t(t_xx: float, t_zz: float) -> float:
    """CHSH at the fixed angles (+-45 deg for Alice, 0/90 deg for Bob)."""
    return SQRT2 * (t_xx + t_zz)
