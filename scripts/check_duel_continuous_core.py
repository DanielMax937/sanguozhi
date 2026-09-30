"""E14 duel continuous-core reference validation."""
import json
from pathlib import Path


def trunc_div(a: int, b: int) -> int:
    assert b != 0
    sign = -1 if (a < 0) ^ (b < 0) else 1
    return sign * (abs(a) // abs(b))


def duel_score(self_str: int, other_str: int) -> int:
    hi = max(self_str, other_str)
    lo = min(self_str, other_str)

    curve = trunc_div(max(hi - 5, 0) ** 2, 1500)
    decade_gap = max(trunc_div(hi, 10) - trunc_div(lo, 10), 1)

    x = self_str - lo
    c = max(x + decade_gap - curve - 1, 0) * decade_gap

    y = min(x, curve)
    z = y + decade_gap - curve

    d = y * (curve - y)
    d += trunc_div(y * (y + 1), 2)
    d += trunc_div(max(z, 0) * max(z - 1, 0), 2)

    return 180 + c + d


def action_ratio(a: int, b: int) -> int:
    aa = duel_score(a, b) ** 2
    bb = duel_score(b, a) ** 2
    total = aa + bb
    if aa >= bb:
        return min(trunc_div(aa * 100, total), 99)
    return 100 - min(trunc_div(bb * 100, total), 99)


STANCE = {
    "attack": {"attack": 16, "attackSub": 3},
    "defense": {"attack": 14, "attackSub": 2},
    "spirit": {"attack": 14, "attackSub": 3},
}


def ordinary_damage(a: int, b: int, stance: str) -> int:
    ratio = action_ratio(a, b)
    s = STANCE[stance]
    n = trunc_div(s["attack"] * ratio, 50)
    n = trunc_div(n * s["attackSub"] * 7, 27)
    return max(n, 3)


def dodge_chance(defender: int, attacker: int, defense_stance: bool = False) -> int:
    n = 10 + trunc_div(defender - attacker, 3)
    n = min(max(n, 5), 30)
    if defense_stance:
        n += 25
    return n


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    d = json.loads(
        (root / "docs/sources/duel-continuous-core.json")
        .read_text(encoding="utf-8")
    )

    assert action_ratio(1, 1) == 50
    assert action_ratio(80, 80) == 50
    assert action_ratio(100, 100) == 50

    assert action_ratio(100, 95) == 55
    assert action_ratio(80, 75) == 52
    assert action_ratio(100, 80) == 62
    assert action_ratio(80, 60) == 60

    assert ordinary_damage(100, 100, "attack") == 12
    assert ordinary_damage(100, 100, "defense") == 7
    assert ordinary_damage(100, 100, "spirit") == 10

    # Same martial difference, different absolute band -> different output.
    assert ordinary_damage(100, 95, "attack") == 13
    assert ordinary_damage(80, 75, "attack") == 12

    assert 12 // 2 == 6
    assert max(12 * 3 // 10, 1) == 3
    assert 12 * 3 // 4 == 9
    assert 9 // 2 == 4
    assert max(9 * 3 // 10, 1) == 2

    assert 50 * 20 // 55 == 18
    assert (50 * 20 // 55) * 6 // 5 == 21
    assert (50 * 20 // 55) * 3 == 54
    assert (50 * 20 // 55) * 3 // 2 == 27

    assert dodge_chance(100, 95) == 11
    assert dodge_chance(75, 80) == 9  # C/C# truncation: -5/3 -> -1
    assert dodge_chance(100, 95, True) == 36

    assert d["provenance"]["directAddressCorroboration"]["addresses"] == [
        "005097C3", "005097EB"
    ]
    assert d["ordinaryDamage"]["equalStrength"] == {
        "attack": 12, "defense": 7, "spirit": 10
    }
    assert d["spiritGain"]["swordMultiplier"] == "*3/2"

    print("PASS: E14 duel actionRatio, hit/block/dodge, damage and source anchors")
    print("Generic PC-PK-oriented core is closed; person/platform exceptions remain open.")


if __name__ == "__main__":
    main()
