"""P0-10 deputy relationship + _ftol2 boundary validation."""
import json
import math
from pathlib import Path


def trunc_zero(x: float) -> int:
    return math.trunc(x)


def combine(main: int, deputy: int, divisor: int) -> int:
    if deputy <= main:
        return main
    return main + (deputy - main) // divisor


def combine_two(main: int, sub1: int, sub2: int, divisor1: int, divisor2: int) -> int:
    return max(
        combine(main, sub1, divisor1),
        combine(main, sub2, divisor2),
    )


def panel(stat: int, base: int, aptitude: float) -> int:
    return trunc_zero(stat * base * aptitude * 0.01)


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    d = json.loads(
        (root / "docs/sources/deputy-rounding-exactness.json")
        .read_text(encoding="utf-8")
    )

    assert d["status"]["ftol2Identity"] == "resolved"
    assert d["floatConversion"]["identifiedRuntimeHelper"] == "_ftol2"
    assert d["floatConversion"]["semantics"] == "truncate toward zero"

    # _ftol2 / C cast semantics
    assert trunc_zero(58.9) == 58
    assert trunc_zero(71.25) == 71
    assert trunc_zero(-58.9) == -58
    assert math.floor(-58.9) == -59  # proves trunc != floor for negatives

    rel = d["relationship"]["leadershipAndWar"]
    assert rel["normal"]["divisor"] == 4
    assert rel["love"]["divisor"] == 2
    assert rel["blood"]["divisor"] == 3
    assert rel["spouseOrSworn"]["divisor"] == 1

    # Wiki/PS2 regression vectors, now with exact positive final truncation.
    assert combine(50, 100, 2) == 75
    assert combine(50, 100, 3) == 66
    assert combine(50, 100, 4) == 62
    assert panel(75, 95, 1.0) == 71
    assert panel(66, 95, 1.0) == 62
    assert panel(62, 95, 1.0) == 58

    assert combine(1, 100, 2) == 50
    assert combine(1, 100, 3) == 34
    assert combine(1, 100, 4) == 25
    assert panel(50, 95, 1.0) == 47
    assert panel(34, 95, 1.0) == 32
    assert panel(25, 95, 1.0) == 23

    assert combine(80, 100, 1) == 100
    assert combine(90, 80, 4) == 90  # lower deputy never reduces main

    # Two deputy bonuses are alternatives, not additive.
    assert combine_two(50, 90, 100, 4, 4) == 62

    assert d["relationship"]["intelligencePoliticsCharisma"]["usesRelationshipDivisor"] is False
    assert d["status"]["bloodDeputyThird"] == "cross-platform-high-pc-opcode-open"

    print("PASS: P0-10 deputy and _ftol2 boundaries")
    print("Positive 00707A74 conversion is exact floor; blood /3 PC opcode remains open.")


if __name__ == "__main__":
    main()
