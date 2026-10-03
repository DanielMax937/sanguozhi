"""P0-30 automatic office qualification-helper boundary checks."""
import json
from pathlib import Path

def main():
    root = Path(__file__).resolve().parents[1]
    p = root / "docs/sources/auto-office-qualification-helper-boundary.json"
    d = json.loads(p.read_text(encoding="utf-8"))

    r = d["reverse"]
    assert r["function"] == "005FA4D0"
    assert r["functionBounds"] == ["0x5FA4D0", "0x5FA580"]
    assert r["inputs"] == ["person pointer", "office pointer"]
    assert r["rejectOnFalse"] is True

    x = d["resolved"]
    assert x["preScoreQualificationGate"] is True
    assert x["finalRankingSeparate"] is True
    assert x["loyalty90GateInsideHelper"] is False
    assert x["loyalty90GateHandledBySelector"] is True

    print("PASS: P0-30 locks office qualification-helper boundary and separates it from ranking.")
    print("Merit/location/identity/status internals remain open.")

if __name__ == "__main__":
    main()
