"""E9 food-raid compatibility-reference checks.

The original 005ADB20 body is not recovered.  The discrete k=10..20 model is
explicitly a compatibility reconstruction, not claimed original EXE RNG.
"""
from __future__ import annotations


def raw_raid(attack: int, troops: int, k: int) -> int:
    if attack < 0 or troops < 0 or not 10 <= k <= 20:
        raise ValueError("invalid input")
    return min(troops // 2, attack * k // 10)


def safe_transfer(
    attack: int,
    troops: int,
    k: int,
    attacker_food: int,
    attacker_food_limit: int,
    target_food: int,
) -> int:
    raid = raw_raid(attack, troops, k)
    return min(raid, target_food, max(0, attacker_food_limit - attacker_food))


def main() -> None:
    vals = [raw_raid(84, 10000, k) for k in range(10, 21)]
    assert vals[0] == 84
    assert vals[-1] == 168
    assert vals == sorted(vals)

    assert raw_raid(105, 10000, 20) == 210

    # Troop-count cap dominates.
    assert raw_raid(100, 200, 10) == 100
    assert raw_raid(100, 200, 20) == 100

    # Conservative non-fidelity resource-safety fallback.
    assert safe_transfer(105, 10000, 20, 49950, 50000, 10000) == 50
    assert safe_transfer(105, 10000, 20, 0, 50000, 70) == 70
    assert safe_transfer(105, 10000, 20, 0, 50000, 10000) == 210

    print("PASS: E9 documented bounds, troop cap and conservative transfer fallback")
    print("RNG/final transfer semantics remain open until 005ADB20 is recovered.")


if __name__ == "__main__":
    main()
