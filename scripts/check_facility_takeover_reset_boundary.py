"""P0-44 facility takeover reset boundary checks."""
import json
from pathlib import Path

def main():
    root = Path(__file__).resolve().parents[1]
    p = root / "docs/sources/facility-takeover-reset-boundary.json"
    d = json.loads(p.read_text(encoding="utf-8"))

    r = d["reverse"]
    assert r["setFacilityDurability"] == "00487E20"
    assert r["setFacilityDurabilityBounds"] == ["0x487E20", "0x487E50"]
    assert r["capturedResourceRetention"] == "004B329B"

    x = d["resolved"]
    assert x["fallByZeroDurabilityBehavior"] is True
    assert x["fallByZeroTroopsBehavior"] is True
    assert x["resourceRetentionFormulaExact"] is True
    assert x["takeoverResetWriterResolved"] is False
    assert x["tenPercentDurabilityResetExact"] is False

    print("PASS: P0-44 separates exact captured-resource retention from unresolved takeover reset.")

if __name__ == "__main__":
    main()
