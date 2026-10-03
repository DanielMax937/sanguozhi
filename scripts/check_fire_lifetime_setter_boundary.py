"""P0-18 fire lifetime setter boundary checks."""
import json
from pathlib import Path


def main():
    root = Path(__file__).resolve().parents[1]
    p = root / "docs/sources/fire-lifetime-setter-boundary.json"
    d = json.loads(p.read_text(encoding="utf-8"))

    rev = d["reverseEvidence"]
    assert rev["isBuildingOnFire"] == "00486320"
    assert rev["isTroopOnFire"] == "00495CA0"
    assert rev["genericCounterRoutine"] == "00599CF0"
    assert rev["genericCounterRoutineContainsKnownFireLifetimeLogic"] is False
    assert rev["publishedFireLifetimeSetter"] is None
    assert rev["publishedReigniteHelper"] is None

    resolved = d["resolved"]
    assert resolved["fireStateQueryLayerExists"] is True
    assert resolved["fireStateQueryIsNotLifetimeSetter"] is True
    assert resolved["genericCounterReuseSupported"] is False

    assert d["open"]["reigniteSemantics"] is True
    assert d["open"]["setterBody"] is True

    print("PASS: P0-18 preserves fire-state queries while keeping lifetime setter/reignite semantics open.")


if __name__ == "__main__":
    main()
