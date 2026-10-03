"""P0-31 office classifier / internal-entry boundary checks."""
import json
from pathlib import Path

def main():
    root = Path(__file__).resolve().parents[1]
    p = root / "docs/sources/office-classifier-entry80-boundary.json"
    d = json.loads(p.read_text(encoding="utf-8"))

    r = d["reverse"]
    assert r["classifier"] == "005FA650"
    assert r["classifierBounds"] == ["0x5FA650", "0x5FA6E0"]
    assert r["officeStructSize"] == "0x3C"
    assert r["officeArrayCount"] == 81

    x = d["resolved"]
    assert x["classifierRole"] == "office -> officeType"
    assert x["internalEntry80Exists"] is True
    assert x["internalEntry80ClassificationResolved"] is False

    assert d["fallback"]["internalEntry80Type"] is None

    print("PASS: P0-31 locks 81-entry office array and classifier boundary.")
    print("Internal office index 80 classification intentionally remains open.")

if __name__ == "__main__":
    main()
