"""P0-39 fire lifetime setter candidate boundary checks."""
import json
from pathlib import Path

def main():
    root = Path(__file__).resolve().parents[1]
    p = root / "docs/sources/fire-lifetime-rng-setter-candidate-boundary.json"
    d = json.loads(p.read_text(encoding="utf-8"))

    r = d["reverse"]
    assert r["facilityFireQueryBounds"] == ["0x486320", "0x4863C0"]
    assert r["troopFireQueryBounds"] == ["0x495CA0", "0x495CE0"]

    x = d["resolved"]
    assert x["queryFunctionsAreStateChecks"] is True
    assert x["queryFunctionsAreLifetimeSetters"] is False
    assert x["setterCandidateFamilyNarrowed"] is True
    assert x["baseLifetimeRngResolved"] is False
    assert x["reigniteSemanticsResolved"] is False

    print("PASS: P0-39 narrows fire lifetime setter search to ignition execution paths.")

if __name__ == "__main__":
    main()
