"""P0-35 defense overlap / starvation boundary checks."""
import json
from pathlib import Path

def main():
    root = Path(__file__).resolve().parents[1]
    p = root / "docs/sources/food-overlap-starvation-function-boundary.json"
    d = json.loads(p.read_text(encoding="utf-8"))

    r = d["reverse"]
    assert r["defenseFacilitySelector"] == "0049D180"
    assert r["selectorBounds"] == ["0x49D180", "0x49D200"]
    assert r["perTurnFoodScheduler"] == "0059BF40"
    assert r["besiegedStarvedSPPopulationLoss"] == "00599AA0"

    x = d["resolved"]
    assert x["selectorReturnsSingleType"] is True
    assert x["overlapEffectsStack"] is False
    assert x["starvationSeparateFromFoodScheduler"] is True
    assert x["function00599AA0IsFieldTroopStarvation"] is False
    assert x["starvationHandlerFound"] is False

    print("PASS: P0-35 locks selector boundary and keeps starvation handler explicitly unresolved.")

if __name__ == "__main__":
    main()
