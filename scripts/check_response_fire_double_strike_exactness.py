"""P0-17 response-fire / double-strike directionality checks."""
import json
from pathlib import Path


def main():
    root = Path(__file__).resolve().parents[1]
    p = root / "docs/sources/response-fire-double-strike-exactness.json"
    d = json.loads(p.read_text(encoding="utf-8"))

    pc = d["pcAddressEvidence"]
    assert pc["doubleStrikeSkillCheck"] == "00586EE8"
    assert pc["indirectVsCrossbowSuppression"] == "00586E12"
    assert pc["doubleStrikeProbability"] == "00586F0F"
    assert pc["targetUnitTypeAtSuppression"] == 3
    assert pc["probabilityPercent"] == 50
    assert pc["supportAttackExcluded"] is True
    assert pc["failedTacticFollowupNormalAttackEligible"] is True

    e = d["exact"]
    assert e["attackerDoubleStrikeDisabledOnIndirectAttackAgainstCrossbow"] is True
    assert e["supportAttackCanDoubleStrike"] is False
    assert e["failedTacticFollowupNormalAttackCanDoubleStrike"] is True

    assert d["interpretation"]["suppressionRequiresTechnique9"] == "open"
    assert d["interpretation"]["suppressionIsDedicatedResponseFireOpcode"] == "not-proven"

    print("PASS: P0-17 separates attacker double-strike suppression from response-fire double strike.")
    print("00584DC8 full caller and PC chain-depth semantics intentionally remain open.")


if __name__ == "__main__":
    main()
