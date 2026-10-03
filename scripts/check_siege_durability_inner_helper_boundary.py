"""P0-42 siege durability inner helper boundary checks."""
import json
from pathlib import Path

def main():
    root = Path(__file__).resolve().parents[1]
    p = root / "docs/sources/siege-durability-inner-helper-boundary.json"
    d = json.loads(p.read_text(encoding="utf-8"))

    r = d["reverse"]
    assert r["ordinaryBounds"] == ["0x5ADDC0", "0x5ADE20"]
    assert r["ramWoodBeastBounds"] == ["0x5ADE20", "0x5ADEB0"]
    assert r["ordinaryCaller"] == "005B04E9"
    assert r["ramWoodBeastCaller"] == "005B04FF"

    x = d["resolved"]
    assert x["ordinaryHelperThreeScalarArgs"] is True
    assert x["ramWoodBeastHelperThreeScalarArgs"] is True
    assert x["helperReturnsX87Float"] is True
    assert x["criticalAppliedAfterHelper"] is True
    assert x["targetTypeMultiplierAppliedAfterHelper"] is True

    print("PASS: P0-42 locks siege durability helper boundaries and x87 return contract.")

if __name__ == "__main__":
    main()
