"""P0-23 rumor effect-helper boundary checks."""
import json
from pathlib import Path

def main():
    root = Path(__file__).resolve().parents[1]
    p = root / "docs/sources/rumor-effect-helper-boundary.json"
    d = json.loads(p.read_text(encoding="utf-8"))

    r = d["reverse"]
    assert r["successCalculatorEnd"] == "005D05AD"
    assert r["postSuccessFunction1"] == ["0x5D05B0", "0x5D05F0"]
    assert r["postSuccessFunction2"] == ["0x5D05F0", "0x5D07C0"]

    x = d["resolved"]
    assert x["successFormulaSeparatedFromEffects"] is True
    assert x["postSuccessHelpersAreDistinctFunctions"] is True
    assert x["effectRoleAssignmentResolved"] is False
    assert x["blanketAllOfficerSameLossRejected"] is True

    assert d["architecture"]["targetSelector"] == "open"
    assert d["architecture"]["perTargetLoyaltyLoss"] == "open"
    assert d["architecture"]["securityLoss"] == "open"

    print("PASS: P0-23 separates rumor success calculation from two post-success helper functions.")
    print("Target selection, loyalty loss and security loss roles intentionally remain open.")

if __name__ == "__main__":
    main()
