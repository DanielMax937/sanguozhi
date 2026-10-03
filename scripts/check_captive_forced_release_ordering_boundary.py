"""P0-20 forced-release ordering/shrink boundary checks."""
import json
from pathlib import Path

def main():
    root = Path(__file__).resolve().parents[1]
    p = root / "docs/sources/captive-forced-release-ordering-boundary.json"
    d = json.loads(p.read_text(encoding="utf-8"))

    assert d["callChain"]["comparator"] == "0058C320"
    assert d["callChain"]["shrinkCall"] == "00590964 -> 004A8E10"

    e = d["exact"]
    assert e["comparatorPassedAsFunctionPointer"] is True
    assert e["orderingOccursBeforeShrinkLoop"] is True
    assert e["shrinkReceivesOnlyListThisPointer"] is True
    assert e["shrinkReceivesExplicitPersonOrIndex"] is False
    assert e["shrinkRepeatedUntilExactReleaseCount"] is True
    assert e["arbitraryBusinessReselectionEachIteration"] is False

    assert "004A8E10 removes front or back" in d["open"]
    assert d["compatibilityFallback"]["evidence"] == "provisional-engine-rule"

    print("PASS: P0-20 locks one-time comparator ordering plus repeated no-arg list shrink.")
    print("Comparator key/orientation and shrink side intentionally remain open.")

if __name__ == "__main__":
    main()
