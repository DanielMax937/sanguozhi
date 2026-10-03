"""P0-27 deterministic hiring generator boundary checks."""
import json
from pathlib import Path

def main():
    root = Path(__file__).resolve().parents[1]
    p = root / "docs/sources/hiring-deterministic-generator-boundary.json"
    d = json.loads(p.read_text(encoding="utf-8"))

    r = d["reverse"]
    assert r["function"] == "005BA4C0"
    assert r["functionBounds"] == ["0x5BA4C0", "0x5BA4F0"]
    assert r["functionLengthHex"] == "0x30"
    assert r["knownCallSite"] == "004AFE97"

    assert len(d["inputs"]) == 7
    assert d["inputs"][-1] == 0

    x = d["resolved"]
    assert x["normalHiringUsesDeterministicHelper"] is True
    assert x["nonzeroModeUsesDifferentRuntimeProbabilityHelper"] is True
    assert x["knownCrossDomainCallerFound"] is False
    assert x["uniqueCallerProven"] is False

    print("PASS: P0-27 locks the small deterministic hiring helper boundary and seven-input callsite.")
    print("Input mixing formula, range and hidden callers remain open.")

if __name__ == "__main__":
    main()
