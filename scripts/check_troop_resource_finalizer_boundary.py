"""P0-32 troop resource finalizer boundary checks."""
import json
from pathlib import Path

def main():
    root = Path(__file__).resolve().parents[1]
    p = root / "docs/sources/troop-resource-finalizer-boundary.json"
    d = json.loads(p.read_text(encoding="utf-8"))

    r = d["resolved"]
    assert r["resourcePrimitivesAreFinalizers"] is False
    assert r["draftFunctionsSeparateFromCommit"] is True
    assert r["commitAndReturnAreSeparateTransactionLayers"] is True
    assert "004AE2A0" in r["buildingResourcePrimitives"]
    assert "004AE510" in r["troopResourcePrimitives"]

    print("PASS: P0-32 keeps resource primitives distinct from unresolved commit/return finalizers.")
    print("Commit order, rollback and return finalizer remain open.")

if __name__ == "__main__":
    main()
