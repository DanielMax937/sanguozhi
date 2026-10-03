"""P0-26 shared 005BA410 helper boundary checks."""
import json
from pathlib import Path

def main():
    root = Path(__file__).resolve().parents[1]
    p = root / "docs/sources/shared-numeric-helper-005ba410-boundary.json"
    d = json.loads(p.read_text(encoding="utf-8"))

    r = d["reverse"]
    assert r["function"] == "005BA410"
    assert r["functionBounds"] == ["0x5BA410", "0x5BA4C0"]
    assert r["hiringCaller"] == "005C4F80"
    assert r["rumorCallSite"] == "005D052C"
    assert r["rumorPreparedStackArgs"] == 4
    assert r["rumorKnownRawArg"] == "20 * edi"

    x = d["resolved"]
    assert x["sharedAcrossHiringAndRumor"] is True
    assert x["hiringSpecificHelper"] is False
    assert x["rumorCallsitePreparesFourStackInputs"] is True
    assert x["exactBusinessSemanticsResolved"] is False

    print("PASS: P0-26 proves 005BA410 is shared by hiring and rumor probability paths.")
    print("Its exact arithmetic and input semantics remain open.")

if __name__ == "__main__":
    main()
