"""P0-25 hiring success-rate signature boundary checks."""
import json
from pathlib import Path

def main():
    root = Path(__file__).resolve().parents[1]
    p = root / "docs/sources/hiring-success-rate-signature-boundary.json"
    d = json.loads(p.read_text(encoding="utf-8"))

    r = d["reverse"]
    assert r["function"] == "005C4F80"
    assert r["functionBounds"] == ["0x5C4F80", "0x5C51C0"]
    assert r["internalHelper"] == "005BA410"
    assert r["caller"] == "004AFD60"

    assert d["arguments"] == [
        "target person pointer",
        "executor person pointer",
        "mode",
        "dateKey",
    ]

    x = d["resolved"]
    assert x["loyaltyIsExplicitScalarArgument"] is False
    assert x["charmIsExplicitScalarArgument"] is False
    assert x["compatibilityIsExplicitScalarArgument"] is False
    assert x["deterministicSevenInputsBelongTo005BA4C0Not005C4F80"] is True
    assert x["dateKeyPassedToSuccessRate"] is True

    print("PASS: P0-25 locks GetHiringSuccessRate signature and separates it from deterministic inputs.")
    print("Internal success-rate formula and 005BA410 remain open.")

if __name__ == "__main__":
    main()
