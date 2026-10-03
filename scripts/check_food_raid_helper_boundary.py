"""P0-41 food-raid helper boundary checks."""
import json
from pathlib import Path

def main():
    root = Path(__file__).resolve().parents[1]
    p = root / "docs/sources/food-raid-helper-boundary.json"
    d = json.loads(p.read_text(encoding="utf-8"))

    r = d["reverse"]
    assert r["helper"] == "005ADB20"
    assert r["helperBounds"] == ["0x5ADB20", "0x5ADBE0"]
    assert r["techniqueCheckAddress"] == "005ADB55"
    assert r["techniqueId"] == 1
    assert r["caller"]["targetRegister"] == "EAX"
    assert r["caller"]["attackerRegister"] == "ESI"

    x = d["resolved"]
    assert x["helperBoundaryExact"] is True
    assert x["techniqueCheckInsideHelper"] is True
    assert x["explicitDamageArgument"] is False
    assert x["rngResolved"] is False
    assert x["resourceClampResolved"] is False

    print("PASS: P0-41 locks food-raid helper boundary while keeping RNG/clamp open.")

if __name__ == "__main__":
    main()
