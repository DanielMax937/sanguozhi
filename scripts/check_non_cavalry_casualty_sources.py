"""E16 non-cavalry casualty source validation."""
import json
from pathlib import Path


PERSONALITY = {
    "timid": 0,
    "calm": 1,
    "bold": 2,
    "reckless": 3,
}


def stat_tier_secondary(diff: int) -> int:
    """00596480 thresholds: secondary-corroborated, not instruction-level confirmed."""
    if diff <= 0:
        return -2
    if diff <= 6:
        return -1
    if diff <= 12:
        return 0
    return 1


def sniper_chance(base: int, tier: int, personality: str, critical: bool) -> int:
    p = base + tier + PERSONALITY[personality] + (1 if critical else 0) - 1
    return max(0, p)


def ability_protection(max_stat: int) -> int:
    if max_stat <= 70:
        return 0
    if max_stat <= 80:
        return 1
    if max_stat <= 90:
        return 2
    return 3


def hellfire_death(max_stat: int, personality: str, high: bool) -> int:
    base = 4 if high else 2
    return max(0, base + PERSONALITY[personality] - ability_protection(max_stat))


def hellfire_injury(max_stat: int, personality: str) -> int:
    return max(0, 2 + PERSONALITY[personality] - ability_protection(max_stat))


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    d = json.loads(
        (root / "docs/sources/non-cavalry-casualty-sources.json")
        .read_text(encoding="utf-8")
    )

    # Archer sniper: peak is 6%, no dedicated death.
    assert sniper_chance(0, 1, "reckless", False) == 3
    assert sniper_chance(0, 1, "reckless", True) == 4
    assert sniper_chance(1, 1, "reckless", True) == 5
    assert sniper_chance(2, 1, "reckless", True) == 6
    assert sniper_chance(0, -2, "timid", False) == 0

    # Secondary threshold mapping is kept explicit and separately labelled.
    assert stat_tier_secondary(0) == -2
    assert stat_tier_secondary(1) == -1
    assert stat_tier_secondary(6) == -1
    assert stat_tier_secondary(7) == 0
    assert stat_tier_secondary(12) == 0
    assert stat_tier_secondary(13) == 1

    # Hellfire conditional tables.
    assert hellfire_death(70, "timid", False) == 2
    assert hellfire_death(70, "reckless", False) == 5
    assert hellfire_death(100, "timid", False) == 0
    assert hellfire_death(100, "reckless", False) == 2

    assert hellfire_death(70, "timid", True) == 4
    assert hellfire_death(70, "reckless", True) == 7
    assert hellfire_death(100, "timid", True) == 1
    assert hellfire_death(100, "reckless", True) == 4

    assert hellfire_injury(70, "timid") == 2
    assert hellfire_injury(70, "reckless") == 5
    assert hellfire_injury(100, "timid") == 0
    assert hellfire_injury(100, "reckless") == 2

    assert d["genericPostDestructionRoll"]["exists"] is False
    assert d["archerSniping"]["maximumConditionalPercent"] == 6
    assert d["archerSniping"]["critical"]["opcode"]["mnemonic"] == "SETNE CL"
    assert d["hellfire"]["injury"]["independentOfDeathSetting"] is True
    assert d["mightyWarrior"]["chancePercent"] == 50

    print("PASS: E16 source-specific casualty routing and conditional probability tables")
    print("No universal post-destruction officer casualty roll is added.")


if __name__ == "__main__":
    main()
