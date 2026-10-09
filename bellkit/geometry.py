"""Geometry of CHSH correlations, for the 3D view.

Correlators E = (E00, E01, E10, E11) with S = E00 + E01 + E10 - E11 (unbiased marginals).
- No-signalling (correlators only): the cube |E_xy| <= 1.
- Local polytope: the cube and s.E <= 2 for the 8 sign vectors s with product -1
  (Fine, PRL 48, 291 (1982); 16 facets in total).
- Quantum set (Tsirelson-Landau-Masanes): the cube and s.asin(E) <= pi for the same s
  (Le et al., Quantum 7, 947 (2023), Thm 1).
The 3D view uses the Alice-Bob symmetric section E01 = E10 =: m of Le et al. (Fig. 2),
which is both a section and a projection; there the sets are the cube,
|E00 - E11| + 2|m| <= 2 (local) and |asin E00 - asin E11| + 2|asin m| <= pi (quantum).
"""

from __future__ import annotations

import itertools
import math

SIGN_VECTORS = tuple(s for s in itertools.product((1, -1), repeat=4) if s[0] * s[1] * s[2] * s[3] == -1)


def _asin(x: float) -> float:
    return math.asin(max(-1.0, min(1.0, x)))


def in_no_signalling(e: tuple[float, ...], tol: float = 1e-12) -> bool:
    return all(abs(x) <= 1.0 + tol for x in e)


def max_chsh(e: tuple[float, ...]) -> float:
    return max(sum(si * xi for si, xi in zip(s, e, strict=True)) for s in SIGN_VECTORS)


def max_tlm(e: tuple[float, ...]) -> float:
    return max(sum(si * _asin(xi) for si, xi in zip(s, e, strict=True)) for s in SIGN_VECTORS)


def in_local(e: tuple[float, ...], tol: float = 1e-12) -> bool:
    return in_no_signalling(e, tol) and max_chsh(e) <= 2.0 + tol


def in_quantum(e: tuple[float, ...], tol: float = 1e-12) -> bool:
    return in_no_signalling(e, tol) and max_tlm(e) <= math.pi + tol


def symmetric_coordinates(e: tuple[float, float, float, float]) -> tuple[float, float, float]:
    """Map a correlator vector into the symmetric section: (E00, E11, (E01 + E10) / 2)."""
    return e[0], e[3], (e[1] + e[2]) / 2.0


def symmetric_local_half_height(x: float, y: float) -> float:
    return min(1.0, max(0.0, (2.0 - abs(x - y)) / 2.0))


def symmetric_quantum_half_height(x: float, y: float) -> float:
    gap = abs(_asin(x) - _asin(y))
    return min(1.0, max(0.0, math.sin((math.pi - gap) / 2.0)))


def symmetric_mesh(points: int) -> dict:
    """Height fields m = +-h(x, y) on a points x points grid over (E00, E11) in [-1, 1]^2."""
    grid = [-1.0 + 2.0 * i / (points - 1) for i in range(points)]
    quantum = [[symmetric_quantum_half_height(x, y) for x in grid] for y in grid]
    local = [[symmetric_local_half_height(x, y) for x in grid] for y in grid]
    return {"grid": grid, "quantum_half_height": quantum, "local_half_height": local}


def membership(e: tuple[float, float, float, float]) -> dict:
    return {
        "S": e[0] + e[1] + e[2] - e[3],
        "max_chsh": max_chsh(e),
        "max_tlm": max_tlm(e),
        "in_no_signalling": in_no_signalling(e),
        "in_local": in_local(e),
        "in_quantum": in_quantum(e),
        "symmetric": symmetric_coordinates(e),
    }
