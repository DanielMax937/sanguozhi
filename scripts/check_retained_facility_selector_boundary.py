"""P0-45 retained domestic facility selector boundary checks."""
import json
from pathlib import Path

def main():
    root = Path(__file__).resolve().parents[1]
    p = root / "docs/sources/retained-facility-selector-boundary.json"
    d = json.loads(p.read_text(encoding="utf-8"))

    bins = d["retainedCountBins"]
    assert bins["100+"] == 5
    assert bins["80-99"] == 4
    assert bins["60-79"] == 3
    assert bins["40-59"] == 2
    assert bins["0-39"] == 1

    x = d["resolved"]
    assert x["singleFacilityLootIsSelector"] is False
    assert x["capturedResourceRetentionIsSelector"] is False
    assert x["uniformRandomSelectorProven"] is False

    print("PASS: P0-45 preserves retain-count bins while leaving facility selector unresolved.")

if __name__ == "__main__":
    main()
