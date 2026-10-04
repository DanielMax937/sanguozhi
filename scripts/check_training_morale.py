"""E4 training/morale reference checks.

This verifies the decoded positive-integer training formula and representative
vectors. It does not execute San11PK.exe or prove unrecovered command gates.
"""
from __future__ import annotations


MAGIC_DIV_2000 = 0x10624DD3


def asm_div_2000_nonnegative(value: int) -> int:
    if value < 0:
        raise ValueError("nonnegative value required")
    high32 = (value * MAGIC_DIV_2000) >> 32
    return high32 >> 7


def training_base_gain(wars: list[int], troops: int, drill_ground: bool) -> int:
    if not 1 <= len(wars) <= 3:
        raise ValueError("training requires 1..3 officers")
    if any(w < 0 for w in wars) or troops < 0:
        raise ValueError("negative input")
    denominator = min(100, 20 + troops // 2000)
    gain = (sum(wars) + max(wars)) // denominator + 3
    if drill_ground:
        gain = gain * 3 // 2
    return gain


def actual_gain(wars: list[int], troops: int, drill_ground: bool,
                current: int, cap: int) -> int:
    return min(training_base_gain(wars, troops, drill_ground),
               max(0, cap - current))


def technique_points(delta: int) -> int:
    return delta // 2 + 5


def main() -> None:
    for troops in range(0, 150001):
        assert asm_div_2000_nonnegative(troops) == troops // 2000

    vectors = [
        ([100, 100, 100], 0, False, 23),
        ([100, 100, 100], 0, True, 34),
        ([100, 100, 100], 10000, False, 19),
        ([100, 100, 100], 10000, True, 28),
        ([100, 100, 100], 100000, False, 8),
        ([100, 100, 100], 100000, True, 12),
        ([100, 100, 100], 150000, False, 7),
        ([100, 100, 100], 150000, True, 10),
        ([80, 60, 40], 50000, False, 8),
        ([80, 60, 40], 50000, True, 12),
        ([100], 5000, False, 12),
        ([100], 5000, True, 18),
    ]
    for wars, troops, drill, expected in vectors:
        got = training_base_gain(wars, troops, drill)
        assert got == expected, (wars, troops, drill, got, expected)

    delta = actual_gain([100, 100, 100], 10000, False, 95, 100)
    assert delta == 5
    assert technique_points(delta) == 7

    assert actual_gain([100, 100, 100], 10000, False, 100, 120) == 19
    assert technique_points(19) == 14

    print(
        "PASS: div2000 equivalence for 0..150000, "
        f"{len(vectors)} training vectors, cap and technique-point checks"
    )
    print("Reference arithmetic only; source gate reconstruction is checked separately by P0-47; stock equivalence is not tested.")


if __name__ == "__main__":
    main()
