"""E15 debate psychological damage validation."""
import json
from pathlib import Path


def trunc_div(a: int, b: int) -> int:
    assert b != 0
    sign = -1 if (a < 0) ^ (b < 0) else 1
    return sign * (abs(a) // abs(b))


def debate_attack(my_int: int, opp_int: int) -> int:
    return 100 + trunc_div(40 * (my_int - opp_int), 131 - my_int)


def card_power(level: int, matches_topic: bool) -> int:
    return 1 + level + (10 if matches_topic else 0)


LEVEL = {"small": 10, "medium": 15, "large": 20}


def topic_damage(
    attack: int,
    level: str,
    matches_topic: bool,
    roll: int = 0,
    anger_coef: int = 10,
    topic_coef_override: int | None = None,
) -> int:
    assert 0 <= roll <= 4
    topic_coef = topic_coef_override
    if topic_coef is None:
        topic_coef = 10 if matches_topic else 6
    return trunc_div(
        (attack + roll) * anger_coef * LEVEL[level] * topic_coef,
        1000,
    )


def shout_damage(attack: int, roll: int = 0, anger_coef: int = 10) -> int:
    return trunc_div((attack + roll) * anger_coef * 15 * 12, 1000)


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    d = json.loads(
        (root / "docs/sources/debate-psychological-damage.json")
        .read_text(encoding="utf-8")
    )

    assert debate_attack(30, 30) == 100
    assert debate_attack(80, 80) == 100
    assert debate_attack(100, 100) == 100
    assert debate_attack(100, 80) == 125
    assert debate_attack(80, 100) == 85

    assert card_power(0, False) == 1
    assert card_power(2, False) == 3
    assert card_power(0, True) == 11
    assert card_power(2, True) == 13

    # Equal INT golden ranges.
    assert [topic_damage(100, "small", True, r) for r in range(5)] == [100,101,102,103,104]
    assert [topic_damage(100, "medium", True, r) for r in range(5)] == [150,151,153,154,156]
    assert [topic_damage(100, "large", True, r) for r in range(5)] == [200,202,204,206,208]

    assert [topic_damage(100, "small", False, r) for r in range(5)] == [60,60,61,61,62]
    assert [topic_damage(100, "medium", False, r) for r in range(5)] == [90,90,91,92,93]
    assert [topic_damage(100, "large", False, r) for r in range(5)] == [120,121,122,123,124]

    assert [shout_damage(100, r) for r in range(5)] == [180,181,183,185,187]

    # Power and damage are intentionally independent.
    assert card_power(0, True) > card_power(2, False)
    assert topic_damage(100, "small", True, 0) < topic_damage(100, "large", False, 0)

    assert d["cardPower"]["rhetoric"] == {
        "ignore": 120,
        "shout": 110,
        "sophistry": 20,
        "compose": 0,
        "agitate": 0,
    }
    assert d["visibleHandCount"][">=90"] == 6

    print("PASS: E15 debate power/damage separation and psychological damage formula")
    print("Generic PC-PK-oriented topic-card damage is closed; person/platform exceptions remain open.")


if __name__ == "__main__":
    main()
