"""E5 food-consumption reference checks.

Reference arithmetic only. The original executable's 00707A74 rounding helper
and starvation-desertion routine are not emulated here.
"""
from __future__ import annotations
from fractions import Fraction


def floor_fraction(x: Fraction) -> int:
    return x.numerator // x.denominator


def field_food(troops: int, troop_type: str, defense: str | None = None) -> int:
    if troops < 0:
        raise ValueError("negative troops")
    if troop_type == "transport":
        multiplier = Fraction(1, 1)
    elif troop_type == "combat":
        multipliers = {
            None: Fraction(2, 1),
            "camp": Fraction(5, 3),
            "fort": Fraction(4, 3),
            "citadel": Fraction(1, 1),
        }
        if defense not in multipliers:
            raise ValueError("bad defense facility")
        multiplier = multipliers[defense]
    else:
        raise ValueError("bad troop type")
    raw = Fraction(troops, 20) * multiplier  # troops * 0.05 * multiplier
    value = floor_fraction(raw)
    return max(1, value) if troops > 0 else 0


def garrison_food(troops: int, tuntian_port_or_gate: bool = False) -> int:
    if troops < 0:
        raise ValueError("negative troops")
    if tuntian_port_or_gate:
        return 0
    value = floor_fraction(Fraction(troops, 40))
    return max(1, value) if troops > 0 else 0


def fire_food(current_food: int, politics: int) -> int:
    if current_food < 0 or politics < 0:
        raise ValueError("negative input")
    raw = Fraction(current_food * (600 - 5 * politics), 10000)
    return floor_fraction(raw)


def main() -> None:
    expected = {
        ("combat", None): 1000,
        ("combat", "camp"): 833,
        ("combat", "fort"): 666,
        ("combat", "citadel"): 500,
        ("transport", None): 500,
    }
    for key, value in expected.items():
        troop_type, defense = key
        got = field_food(10000, troop_type, defense)
        assert got == value, (key, got, value)

    assert garrison_food(10000) == 250
    assert garrison_food(10000, True) == 0

    # Transport ignores defense-facility discounts in the original branch.
    assert field_food(10000, "transport", "citadel") == 500

    assert fire_food(50000, 100) == 500
    assert fire_food(50000, 0) == 3000

    assert field_food(1, "combat") == 1
    assert field_food(1, "transport") == 1
    assert garrison_food(1) == 1

    print("PASS: E5 /10, /20, /40, defense multipliers, tuntian, fire-food and minimum-one checks")
    print("Reference floor arithmetic only; 00707A74 and starvation desertion are not proven.")


if __name__ == "__main__":
    main()
