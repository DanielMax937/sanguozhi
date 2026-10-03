"""P0-36 morale weighted-merge rounding boundary checks."""
import json
from pathlib import Path

def main():
    root = Path(__file__).resolve().parents[1]
    p = root / "docs/sources/morale-weighted-merge-rounding-boundary.json"
    d = json.loads(p.read_text(encoding="utf-8"))

    r = d["reverse"]
    assert r["buildingMergeHelper"] == "004B9840"
    assert r["buildingMergeBounds"] == ["0x4B9840", "0x4B98A0"]

    x = d["resolved"]
    assert x["buildingMergeHelperBoundary"] is True
    assert x["troopMergeHelperFound"] is False
    assert x["nonDivisibleRoundingResolved"] is False
    assert x["ftol2CanBeAssumedWithoutXref"] is False

    assert d["fallback"]["rounding"] == "floor"
    assert d["fallback"]["evidence"] == "compatibility-rounding-only"

    print("PASS: P0-36 locks building morale-merge helper boundary while preserving rounding as open.")

if __name__ == "__main__":
    main()
