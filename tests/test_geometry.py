import math

import pytest

from bellkit import geometry

S2 = 1 / math.sqrt(2)


@pytest.mark.parametrize(
    ("e", "local", "quantum"),
    [
        ((S2, S2, S2, -S2), False, True),
        ((1, 1, 1, -1), False, False),
        ((1, 1, 1, 1), True, True),
        ((1, 1, -1, 1), False, False),
        ((0.636396, 0.636396, 0.636396, -0.636396), False, True),
        ((0.6, 0.6, 0.6, -0.6), False, True),
        ((0.75, 0.75, 0.75, -0.75), False, False),
        ((1, 0.9, 0.9, 0.5), False, False),
        ((0.5226, 0.6091, 0.6051, -0.4844), False, True),
    ],
)
def test_membership(e, local, quantum):
    m = geometry.membership(e)
    assert m["in_local"] is local
    assert m["in_quantum"] is quantum


def test_tsirelson_point_is_on_the_quantum_boundary():
    assert geometry.max_tlm((S2, S2, S2, -S2)) == pytest.approx(math.pi, abs=1e-12)


def test_symmetric_section_heights():
    assert geometry.symmetric_quantum_half_height(S2, -S2) == pytest.approx(S2, abs=1e-12)
    assert geometry.symmetric_local_half_height(1, -1) == pytest.approx(0.0)
    assert geometry.symmetric_local_half_height(1, 1) == pytest.approx(1.0)


def test_volume_ratios_match_le_et_al():
    import random

    rng = random.Random(1)
    n, in_l, in_q = 60000, 0, 0
    for _ in range(n):
        e = tuple(rng.uniform(-1, 1) for _ in range(4))
        in_l += geometry.in_local(e)
        in_q += geometry.in_quantum(e)
    assert in_l / n == pytest.approx(2 / 3, abs=0.01)
    assert in_q / n == pytest.approx(3 * math.pi**2 / 32, abs=0.01)
