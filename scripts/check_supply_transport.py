"""E6 supply/transport reference checks.

This is a compatibility/reference model for confirmed constraints and the
documented morale-weighting example. It does not emulate the unrecovered
PC-PK1.1 supply/arrival finalizers or their rounding details.
"""
from __future__ import annotations
from fractions import Fraction


def supplyable_troops(
    target_strength: int,
    target_limit: int,
    supplier_strength: int,
    matching_equipment: int | None,
) -> int:
    if min(target_strength, target_limit, supplier_strength) < 0:
        raise ValueError("negative input")
    room = max(0, target_limit - target_strength)
    amount = min(room, supplier_strength)
    if matching_equipment is not None:
        amount = min(amount, matching_equipment)
    return amount


def weighted_morale(
    old_strength: int,
    old_morale: int,
    added_strength: int,
    added_morale: int,
) -> Fraction:
    total = old_strength + added_strength
    if total <= 0:
        raise ValueError("positive final strength required")
    return Fraction(
        old_strength * old_morale + added_strength * added_morale,
        total,
    )


def main() -> None:
    # Wiki's canonical example.
    assert weighted_morale(2500, 0, 2500, 100) == 50

    # Matching spear/halberd/crossbow/horse equipment can bind first.
    assert supplyable_troops(5000, 10000, 5000, 2000) == 2000

    # Sword-style replenishment has no one-for-one equipment cargo gate.
    assert supplyable_troops(5000, 10000, 5000, None) == 5000

    # Command capacity can bind first.
    assert supplyable_troops(9000, 10000, 5000, 5000) == 1000

    # Supplier soldiers can bind first.
    assert supplyable_troops(1000, 10000, 750, 5000) == 750

    print("PASS: E6 weighted-morale example and supply-cap reference constraints")
    print("Reference semantics only; finalizer ordering/rounding is not proven.")


if __name__ == "__main__":
    main()
