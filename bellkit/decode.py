"""Turn counts dictionaries into per-setting outcome tables.

Qiskit count keys are little-endian: the rightmost character is global clbit 0. With
several registers the key is space-separated and the last-added register is leftmost, so
removing the spaces and indexing from the right gives the global clbit order in every case.
"""

from __future__ import annotations

from bellkit.circuits import ClbitMap
from bellkit.stats import Table


class BitOrderError(RuntimeError):
    """The canary bit did not read as expected: the key layout is not what we assume."""


def bit(key: str, index: int) -> int:
    flat = key.replace(" ", "")
    if flat.startswith("0x"):
        raise ValueError("hexadecimal count keys are not supported")
    return int(flat[-1 - index])


def table_from_counts(counts: dict, cmap: ClbitMap, offset: int, bob_basis: str) -> tuple[Table, int, int]:
    """Outcome table for one unit, with the Pauli frame and post-selection applied.

    Returns (table, kept_shots, total_shots). The Pauli frame flips Bob's bit by the XOR of
    the target bits (Z basis) or of the control bits (X basis) of every intermediate
    Bell measurement; it is undefined for other Bob bases, which the chain never uses.
    """
    n = [[0, 0], [0, 0]]
    kept = total = 0
    frame_bits = cmap.frame_z if bob_basis == "z" else cmap.frame_x
    if (cmap.frame_z or cmap.frame_x) and bob_basis not in ("z", "x"):
        raise ValueError("the Pauli frame is defined only for Bob's Z and X bases")
    for key, count in counts.items():
        total += count
        if cmap.keep_equal is not None:
            i, j = cmap.keep_equal
            if bit(key, offset + i) != bit(key, offset + j):
                continue
        kept += count
        a = bit(key, offset + cmap.alice)
        b = bit(key, offset + cmap.bob)
        for f in frame_bits:
            b ^= bit(key, offset + f)
        n[a][b] += count
    return Table(n[0][0], n[0][1], n[1][0], n[1][1]), kept, total


def canary_fraction(counts: dict, kind: str, expected: str, clbit: int | None = None) -> float:
    """Fraction of shots in which the canary reads as expected.

    ``kind == "circuit"``: a separate two-qubit circuit whose whole key must equal
    ``expected``. ``kind == "register"``: a one-bit register at global clbit ``clbit`` that
    must read 1.
    """
    total = sum(counts.values())
    if total == 0:
        raise BitOrderError("canary returned no shots")
    if kind == "circuit":
        good = sum(c for k, c in counts.items() if k.replace(" ", "") == expected)
    else:
        good = sum(c for k, c in counts.items() if bit(k, clbit) == 1)
    return good / total
