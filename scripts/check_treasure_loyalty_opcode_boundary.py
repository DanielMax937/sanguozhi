"""P0-24 treasure transfer / loyalty boundary checks."""
import json
from pathlib import Path

def main():
    root = Path(__file__).resolve().parents[1]
    p = root / "docs/sources/treasure-loyalty-opcode-boundary.json"
    d = json.loads(p.read_text(encoding="utf-8"))

    r = d["reverse"]
    assert r["commandId"] == 14
    assert r["treasureValueField"] == "0x3C"
    assert r["setTreasureOwnerAndCity"] == "004A0A40"
    assert r["lowLevelOwnerCitySetter"] == "00484DE0"
    assert r["setTreasureStatus"] == "004A0A70"
    assert r["modifyPersonLoyalty"] == "004A6CF0"

    x = d["resolved"]
    assert x["treasureOwnershipMutationSeparateFromLoyalty"] is True
    assert x["treasureStateMutationSeparateFromOwnership"] is True
    assert x["grantGainEqualsValue"] == "empirical-high-candidate"
    assert x["confiscationMinus30"] == "empirical-high-not-reverse"

    print("PASS: P0-24 separates treasure ownership/state mutation from loyalty side effects.")
    print("Grant value->loyalty and confiscation -30 exact opcodes remain open.")

if __name__ == "__main__":
    main()
