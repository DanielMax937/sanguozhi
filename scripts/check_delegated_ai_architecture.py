"""E20 delegated/COM AI architecture validation."""
import json
from pathlib import Path
from math import ceil


def force_base_strength(total_troops: int) -> int:
    return ceil(total_troops / 10000) * 10 if total_troops > 0 else 0


def carry_gold(city_gold: int, roll_pass: bool, rand_0_5: int = 0) -> int:
    if city_gold >= 10000:
        return (15 + rand_0_5) * 100 if roll_pass else 0
    if city_gold >= 2000:
        return 1000 if roll_pass else 0
    return 0


def clamp_sortie_probability(raw: int) -> int:
    return max(5, min(100, raw))


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    d = json.loads(
        (root / "docs/sources/delegated-ai-architecture.json")
        .read_text(encoding="utf-8")
    )

    assert d["globalUtilityTable"]["supported"] is False
    assert d["tacticalCore"]["sharedExecutor"] == "005AD980"
    assert d["sortie"]["function"] == "005EF440"
    assert d["sortie"]["minimumPlannedTroops"] == 5000
    assert d["sortie"]["probability"] == {
        "min": 5, "max": 100, "helper": "004721D0"
    }

    assert clamp_sortie_probability(-20) == 5
    assert clamp_sortie_probability(47) == 47
    assert clamp_sortie_probability(200) == 100

    assert d["sortie"]["food"]["horizon"] == "travelTime*5+15"
    assert d["sortie"]["food"]["carryCap"] == 50000

    assert carry_gold(9999, True) == 1000
    assert carry_gold(10000, True, 0) == 1500
    assert carry_gold(10000, True, 5) == 2000
    assert carry_gold(1999, True) == 0

    assert d["sortie"]["siegeSelection"]["ram"] == 90
    assert d["sortie"]["siegeSelection"]["towerWoodBeastCatapult"] == 80

    assert force_base_strength(0) == 0
    assert force_base_strength(1) == 10
    assert force_base_strength(10000) == 10
    assert force_base_strength(10001) == 20
    assert force_base_strength(99999) == 100

    assert d["commanderSelector"]["restraint"] == {
        "advantage": 1.3,
        "disadvantage": 0.7,
    }
    assert d["cityDelegation"]["reverseSchedulerStatus"] == "open"

    print("PASS: E20 modular AI architecture, sortie gates, local selectors and force strength")
    print("Domestic scheduler remains open; no global action-weight table is asserted.")


if __name__ == "__main__":
    main()
