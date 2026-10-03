"""P0-29 auto-office scheduler boundary checks."""
import json
from pathlib import Path

def main():
    root = Path(__file__).resolve().parents[1]
    p = root / "docs/sources/auto-office-scheduler-boundary.json"
    d = json.loads(p.read_text(encoding="utf-8"))

    r = d["resolved"]
    assert r["selector"] == "005FAF00"
    assert r["candidateListPassedByCaller"] is True
    assert r["selectorBuildsCandidateList"] is False
    assert r["selectorWritesOfficeAssignment"] is False
    assert r["selectorRemovesWinner"] is False
    assert r["singleOfficeTieDependsOnCallerOrder"] is True

    f = d["fallback"]
    assert f["evidence"] == "provisional-scheduler-fallback"

    print("PASS: P0-29 separates exact single-office selector from unresolved multi-office scheduler.")
    print("Office order, candidate construction and winner-removal semantics remain open.")

if __name__ == "__main__":
    main()
