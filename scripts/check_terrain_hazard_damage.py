"""E17 terrain hazard damage reference validation."""
import json
from pathlib import Path


def get_random_x_values(x: int):
    return range(0, x)


def plank_damage(roll: int, immune: bool = False) -> int:
    if immune:
        return 0
    assert 0 <= roll < 200
    return 100 + roll


def poison_damage(roll: int, immune: bool = False) -> int:
    if immune:
        return 0
    assert 0 <= roll < 200
    return 200 + roll


def rockfall_troop_damage(roll: int, traverse: bool = False) -> int:
    assert 0 <= roll < 500
    raw = 1500 + roll
    if traverse:
        return int(raw * 0.1)
    return raw


def rockfall_building_damage(roll: int) -> int:
    assert 0 <= roll < 1000
    return 800 + roll


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    d = json.loads(
        (root / "docs/sources/terrain-hazard-damage.json")
        .read_text(encoding="utf-8")
    )

    assert min(get_random_x_values(200)) == 0
    assert max(get_random_x_values(200)) == 199

    assert plank_damage(0) == 100
    assert plank_damage(199) == 299
    assert plank_damage(100, immune=True) == 0

    assert poison_damage(0) == 200
    assert poison_damage(199) == 399
    assert poison_damage(100, immune=True) == 0

    assert rockfall_troop_damage(0) == 1500
    assert rockfall_troop_damage(499) == 1999
    assert rockfall_troop_damage(0, traverse=True) == 150
    assert rockfall_troop_damage(499, traverse=True) == 199

    assert rockfall_building_damage(0) == 800
    assert rockfall_building_damage(999) == 1799

    assert d["random"]["semantics"] == "0..X-1"
    assert d["plankPath"]["exactRange"] == [100, 299]
    assert d["poisonSpring"]["exactRange"] == [200, 399]
    assert d["poisonSpring"]["energyDamage"] == 0
    assert d["rockfall"]["traverseMultiplier"] == 0.1
    assert d["rockfall"]["confusionChance"] == 0
    assert "whether common trap base 50 participates independently in final rockfall damage" in d["rockfall"]["unresolved"]

    print("PASS: E17 terrain hazard ranges, immunity boundaries, and rockfall parameter model")
    print("Rockfall common-base finalizer remains explicitly unresolved.")


if __name__ == "__main__":
    main()
