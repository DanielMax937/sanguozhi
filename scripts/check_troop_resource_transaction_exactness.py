"""P0-9 troop resource transaction boundary validation."""
import json
from pathlib import Path

EQUIPMENT_KIND = {
    0: "default",
    1: "quantity",
    2: "quantity",
    3: "quantity",
    4: "quantity",
    5: "piece",
    6: "piece",
    7: "piece",
    8: "piece",
    9: "default",
    10: "piece",
    11: "piece",
}

def battle_equipment_cost(equipment_id: int, troops: int) -> int:
    kind = EQUIPMENT_KIND[equipment_id]
    if kind == "default":
        return 0
    if kind == "quantity":
        return troops
    return 1

def accepted_with_capacity(current: int, capacity: int, incoming: int):
    room = max(capacity - current, 0)
    accepted = min(incoming, room)
    return accepted, incoming - accepted

def main() -> None:
    root = Path(__file__).resolve().parents[1]
    d = json.loads(
        (root / "docs/sources/troop-resource-transaction-exactness.json")
        .read_text(encoding="utf-8")
    )

    assert d["status"]["audit"] == "complete"
    assert d["status"]["battleResourceCaps"] == "resolved"
    assert d["status"]["transportBasicCaps"] == "resolved"
    assert d["status"]["commitOpcodeOrder"] == "open"
    assert d["status"]["returnFinalizer"] == "open"

    battle = d["runtimeCaps"]["battle"]
    assert battle["money"] == 10_000
    assert battle["food"] == 50_000

    transport = d["runtimeCaps"]["transport"]
    assert transport["troops"] == 60_000
    assert transport["money"] == 100_000
    assert transport["food"] == 500_000
    assert transport["equipmentQuantity"] == 100_000

    assert d["runtimeCaps"]["troopStrengthStorageHardBoundary"] == 65_535
    assert transport["troops"] < d["runtimeCaps"]["troopStrengthStorageHardBoundary"]

    assert battle_equipment_cost(0, 10_000) == 0
    assert battle_equipment_cost(1, 10_000) == 10_000
    assert battle_equipment_cost(4, 7_000) == 7_000
    assert battle_equipment_cost(5, 10_000) == 1
    assert battle_equipment_cost(8, 1) == 1
    assert battle_equipment_cost(9, 10_000) == 0
    assert battle_equipment_cost(10, 10_000) == 1
    assert battle_equipment_cost(11, 1) == 1

    assert accepted_with_capacity(90_000, 100_000, 5_000) == (5_000, 0)
    assert accepted_with_capacity(98_000, 100_000, 5_000) == (2_000, 3_000)
    assert accepted_with_capacity(100_000, 100_000, 1) == (0, 1)

    assert d["commit"]["exactCaller"] == "open"
    assert d["commit"]["exactOrder"] == "open"
    assert d["return"]["exactCaller"] == "open"
    assert d["return"]["exactOrder"] == "open"

    modern = d["modernReconstructionBoundary"]
    assert modern["sangoInfinityCommitOrder"] == "not-fidelity-evidence"
    assert modern["sangoInfinityReturnOrder"] == "not-fidelity-evidence"

    print("PASS: P0-9 troop resource transaction boundaries")
    print("Capacities/semantic invariants validated; original finalizer order remains open.")

if __name__ == "__main__":
    main()
