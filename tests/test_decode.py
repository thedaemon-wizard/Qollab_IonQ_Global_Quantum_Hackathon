import pytest

from bellkit.circuits import ClbitMap
from bellkit.decode import bit, canary_fraction, table_from_counts


def test_bit_reads_from_the_right_and_ignores_spaces():
    assert [bit("10 00 01", j) for j in range(6)] == [1, 0, 0, 0, 0, 1]


def test_hex_keys_are_rejected():
    with pytest.raises(ValueError):
        bit("0x1", 0)


def test_frame_flips_bob_by_xor_of_selected_bits():
    cmap = ClbitMap(alice=0, bob=1, frame_z=(3,), frame_x=(2,))
    # key bits (right to left): alice=0, bob=0, m_x=1, m_z=1
    table, _, _ = table_from_counts({"1100": 10}, cmap, 0, "z")
    assert table.n01 == 10  # bob flipped by m_z
    table, _, _ = table_from_counts({"1100": 10}, cmap, 0, "x")
    assert table.n01 == 10  # bob flipped by m_x


def test_post_selection_keeps_equal_target_bits():
    cmap = ClbitMap(alice=0, bob=1, keep_equal=(2, 3))
    table, kept, total = table_from_counts({"0000": 5, "0100": 7, "1100": 3}, cmap, 0, "z")
    assert (kept, total) == (8, 15)
    assert table.n00 == 8


def test_canary_fractions():
    assert canary_fraction({"01": 9, "11": 1}, "circuit", "01") == pytest.approx(0.9)
    assert canary_fraction({"00 1": 3, "10 0": 1}, "register", "01", clbit=0) == pytest.approx(0.75)
