"""P0-16 food-raid caller exactness evidence validation."""
import json
from pathlib import Path


def main():
    root = Path(__file__).resolve().parents[1]
    p = root / "docs/sources/food-raid-caller-exactness.json"
    d = json.loads(p.read_text(encoding="utf-8"))

    a = d["addresses"]
    assert a["defenseSkillCheck"] == "005B03BA"
    assert a["zeroDamageWrite"] == "005B03C6"
    assert a["foodRaidCall"] == "005B03F9"
    assert a["counterBypassTarget"] == "005B0404"

    e = d["exact"]
    assert e["defenseSkillCanSetTroopDamageZeroBeforeFoodRaid"] is True
    assert e["callerStillInvokesFoodRaidAfterZeroDamage"] is True
    assert e["foodRaidStoredSeparatelyFromTroopDamage"] is True
    assert e["explicitDamageArgumentAtRecoveredCallSite"] is False
    assert e["counterattackBypassSkipsFoodRaid"] is True

    assert d["interpretation"]["damageZeroImpliesSkip"] == "false-at-caller-level"
    assert d["interpretation"]["helperCanNeverInspectDamage"] == "not-proven"

    print("PASS: P0-16 caller ordering preserves food-raid invocation after zero troop damage.")
    print("005ADB20 internals, RNG and resource clamps intentionally remain open.")


if __name__ == "__main__":
    main()
