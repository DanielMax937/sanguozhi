"""P0-35 defense overlap / starvation boundary checks."""
import json
from pathlib import Path
from check_food_overlap_starvation_exactness import check_facility_siege_troop_loss

def main():
    root = Path(__file__).resolve().parents[1]
    p = root / "docs/sources/food-overlap-starvation-function-boundary.json"
    d = json.loads(p.read_text(encoding="utf-8"))

    r = d["reverse"]
    assert r["defenseFacilitySelector"] == "0049D180"
    assert r["selectorBounds"] == ["0x49D180", "0x49D200"]
    assert r["perTurnFoodScheduler"] == "0059BF40"
    assert r["facilitySiegeTroopLossCaller"] == "00599AA0"
    assert "besiegedStarvedSPPopulationLoss" not in r

    x = d["resolved"]
    assert x["selectorReturnsSingleType"] is True
    assert x["overlapEffectsStack"] is False
    assert x["starvationSeparateFromFoodScheduler"] is True
    assert x["function00599AA0IsFieldTroopStarvation"] is False
    assert x["starvationHandlerFound"] is False

    evidence = json.loads(
        (root / "docs/sources/food-overlap-starvation-exactness.json")
        .read_text(encoding="utf-8")
    )
    expected = check_facility_siege_troop_loss(evidence)
    assert d["facilitySiegeTroopLossBoundary"] == {
        "sourceEvidenceFile": "food-overlap-starvation-exactness.json",
        "sourceEvidenceKey": "facilitySiegeTroopLoss",
        **expected,
    }
    assert evidence["facilitySiegeTroopLoss"]["source"]["url"] in d["sources"]
    for name in (
        "47-food-overlap-starvation-exactness.md",
        "70-food-overlap-starvation-function-boundary.md",
        "20-food-consumption.md", "04-military.md", "13-open-exactness.md", "SOURCES.md",
    ):
        text = (root / "docs/rules" / name).read_text(encoding="utf-8")
        assert "00599AA0" in text and "004B99B0" in text, name
        assert "ReducePopForStarvedBesiegedSP" in text and "误译" in text, name
        assert "设施围城兵力减员 caller" in text, name

    print("PASS: P0-35 locks selector boundary and keeps starvation handler explicitly unresolved.")
    print("Shared 00599AA0 evidence and six documentation corrections are consistent; arithmetic unchanged.")

if __name__ == "__main__":
    main()
