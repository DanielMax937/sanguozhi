"""P0-19 death lifecycle layer-boundary checks."""
import json
from pathlib import Path

def main():
    root = Path(__file__).resolve().parents[1]
    p = root / "docs/sources/death-lifecycle-layer-boundary.json"
    d = json.loads(p.read_text(encoding="utf-8"))

    r = d["reverse"]
    assert r["monthlyAction"] == "00590C30"
    assert r["monthStartCheck"] == "00482680"
    assert r["lifecycleHandler"] == "005833D0"
    assert r["getDeathYear"] == "0048A000"
    assert r["isMarkedForDeath"] == "00489160"
    assert r["isDead"] == "00488C80"
    assert r["healthLevelField"] == "0x15C"

    x = d["resolved"]
    assert x["lifecycleHandlerRunsAtMonthStart"] is True
    assert x["getDeathYearIsSeparateQueryLayer"] is True
    assert x["markedForDeathIsSeparateRuntimeLayer"] is True
    assert x["healthLevelIsSeparateRuntimeLayer"] is True
    assert x["finalDeadIdentityIsSeparateLayer"] is True
    assert x["scenarioInitPermanentFinalDeathDateSupported"] is False

    assert len(d["layerModel"]) == 5

    print("PASS: P0-19 preserves distinct death-year, flag, health and final-death layers.")
    print("Internal transitions in 005833D0 and 0048A000 intentionally remain open.")

if __name__ == "__main__":
    main()
