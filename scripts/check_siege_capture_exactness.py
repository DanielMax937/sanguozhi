"""P0-3 siege/capture-resource exactness validation."""
import json
from pathlib import Path
from math import sqrt, trunc


def retain_pct(charisma: int | None) -> int:
    if charisma is None:
        return 5
    return max(5, trunc(charisma / 10))


def retained(amount: int, charisma: int | None) -> int:
    return trunc(amount * retain_pct(charisma) / 100)


def ordinary_durability(troops: int, attack: int, power: int, target_mul: float) -> int:
    return trunc(
        sqrt(troops)
        * attack
        * sqrt(1 / 1500)
        * (1 + power / 25)
        * target_mul
    )


def main() -> None:
    root=Path(__file__).resolve().parents[1]
    d=json.loads(
        (root/"docs/sources/siege-capture-exactness.json")
        .read_text(encoding="utf-8")
    )

    assert d["garrisonDamage"]["core"]=="005ADC30"
    assert d["durability"]["ordinaryHelper"]=="005ADDC0"
    assert d["durability"]["ramWoodBeastHelper"]=="005ADE20"

    assert retain_pct(None)==5
    assert retain_pct(0)==5
    assert retain_pct(49)==5
    assert retain_pct(50)==5
    assert retain_pct(59)==5
    assert retain_pct(60)==6
    assert retain_pct(99)==9
    assert retain_pct(100)==10
    assert retain_pct(110)==11

    assert retained(10000,49)==500
    assert retained(10000,80)==800
    assert retained(999,100)==99

    assert ordinary_durability(10000,80,15,0.7)==231
    assert ordinary_durability(10000,80,5,0.7)==173

    assert d["captureResources"]["appliesTo"] == [
        "money","food","troops","all12EquipmentSlots"
    ]
    assert d["captureResources"]["explicitUpperCap"] is False
    assert d["status"]["durabilityInnerFunctions"]=="open"

    print("PASS: P0-3 siege call chain and capture-resource formula")
    print("005ADDC0/005ADE20 inner functions remain explicitly open.")


if __name__=="__main__":
    main()
