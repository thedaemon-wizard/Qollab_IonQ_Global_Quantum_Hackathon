"""Single-qubit Pauli channels on Bob's half of each link (pure math, no Qiskit).

A Pauli channel maps rho -> sum_k p_k sigma_k rho sigma_k with (p_I, p_X, p_Y, p_Z). In the
circuit it is realised exactly with two ancillas (see ``circuits.apply_pauli_channel``).
On a Phi+ pair it multiplies the correlators by l_Z, l_X, l_Y (see the properties below).
"""

from __future__ import annotations

import math
from dataclasses import dataclass

KINDS = ("none", "depolarizing", "dephasing", "bit_flip", "y_flip", "custom")
_TOL = 1e-9


@dataclass(frozen=True)
class PauliChannel:
    p_i: float
    p_x: float
    p_y: float
    p_z: float

    def __post_init__(self) -> None:
        probs = (self.p_i, self.p_x, self.p_y, self.p_z)
        if any(p < -_TOL for p in probs) or abs(sum(probs) - 1.0) > 1e-6:
            raise ValueError(f"invalid Pauli probabilities {probs}")

    @staticmethod
    def from_kind(kind: str, strength: float) -> PauliChannel:
        """Named channels. ``strength`` is the error probability q, or lambda for depolarizing.

        depolarizing(lambda): Werner visibility v = 1 - lambda, p_X = p_Y = p_Z = lambda / 4.
        """
        if kind not in KINDS or kind == "custom":
            raise ValueError(f"unknown named channel {kind!r}")
        q = float(strength)
        if not 0.0 <= q <= 1.0:
            raise ValueError("strength must lie in [0, 1]")
        if kind == "none":
            return PauliChannel(1.0, 0.0, 0.0, 0.0)
        if kind == "depolarizing":
            return PauliChannel(1.0 - 0.75 * q, q / 4.0, q / 4.0, q / 4.0)
        if kind == "dephasing":
            return PauliChannel(1.0 - q, 0.0, 0.0, q)
        if kind == "bit_flip":
            return PauliChannel(1.0 - q, q, 0.0, 0.0)
        return PauliChannel(1.0 - q, 0.0, q, 0.0)  # y_flip

    @property
    def is_identity(self) -> bool:
        return self.p_i >= 1.0 - _TOL

    @property
    def l_z(self) -> float:
        return 1.0 - 2.0 * (self.p_x + self.p_y)

    @property
    def l_x(self) -> float:
        return 1.0 - 2.0 * (self.p_y + self.p_z)

    @property
    def l_y(self) -> float:
        return 1.0 - 2.0 * (self.p_x + self.p_z)

    def bell_weights(self) -> tuple[float, float, float, float]:
        """Weights (A, B, C, D) of (Phi+, Psi-, Psi+, Phi-) after the channel acts on Phi+."""
        return self.p_i, self.p_y, self.p_x, self.p_z

    def ancilla_angles(self) -> tuple[float, float, float]:
        """Ry angles (theta_ax, theta_az0, theta_az1) of the two-ancilla construction.

        P(a_x = 1) = p_X + p_Y; P(a_z = 1 | a_x = 0) = p_Z / (p_I + p_Z);
        P(a_z = 1 | a_x = 1) = p_Y / (p_X + p_Y). Branches: I, X, Z, ZX (= iY).
        """

        def angle(p: float) -> float:
            return 2.0 * math.asin(math.sqrt(min(1.0, max(0.0, p))))

        p_flip = self.p_x + self.p_y
        no_flip = self.p_i + self.p_z
        th_ax = angle(p_flip)
        th_az0 = angle(self.p_z / no_flip) if no_flip > _TOL else 0.0
        th_az1 = angle(self.p_y / p_flip) if p_flip > _TOL else th_az0
        return th_ax, th_az0, th_az1

    def as_dict(self) -> dict:
        return {"p_i": self.p_i, "p_x": self.p_x, "p_y": self.p_y, "p_z": self.p_z}
