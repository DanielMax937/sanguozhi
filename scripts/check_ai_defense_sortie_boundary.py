"""P0-43 defensive sortie legacy-rule boundary checks."""
import json
from pathlib import Path

def main():
    root = Path(__file__).resolve().parents[1]
    p = root / "docs/sources/ai-defense-sortie-boundary.json"
    d = json.loads(p.read_text(encoding="utf-8"))

    x = d["resolved"]
    assert x["legacyThreeTileOnePointTwoRuleSupported"] is False
    assert x["singleTroopRatioGateSupported"] is False
    assert x["minimumPlannedTroopsExact"] is True
    assert x["multiStageResourceAndProbabilityPipeline"] is True
    assert x["fixedThreeTileDefenseTriggerResolved"] is False

    assert d["reverse"]["minimumPlannedTroops"] == 5000
    assert d["reverse"]["foodPlanningHelper"] == "005F6470"

    print("PASS: P0-43 rejects legacy 3-tile/1.2 rule and preserves procedural AI sortie pipeline.")

if __name__ == "__main__":
    main()
