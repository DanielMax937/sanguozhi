"""P0-22 salary-shortfall prepare/finalize boundary checks."""
import json
from pathlib import Path

def main():
    root = Path(__file__).resolve().parents[1]
    p = root / "docs/sources/salary-shortfall-loyalty-boundary.json"
    d = json.loads(p.read_text(encoding="utf-8"))

    assert d["callChain"]["prepareCall"] == "005909BD -> 0058D5E0"
    assert d["callChain"]["finalizeCall"] == "00590A27 -> 0058C190"
    assert d["callChain"]["salaryIdentityMask"] == "0x0F"

    pstage = d["prepareStage"]
    assert pstage["argFacility"] is True
    assert pstage["argActiveOfficerList"] is True
    assert pstage["thisCrossFacilityAccumulator"] is True
    assert pstage["calledOnlyOnSalaryShortfallPath"] is True

    fstage = d["finalizeStage"]
    assert fstage["calledAfterAllFacilityLoops"] is True
    assert fstage["explicitExtraArgs"] is False
    assert fstage["thisAccumulatedContainer"] is True

    e = d["exact"]
    assert e["perFacilityImmediateLoyaltyWrite"] is False
    assert e["crossFacilityBatching"] is True
    assert e["prepareAndApplyStagesSeparated"] is True

    print("PASS: P0-22 locks salary-shortfall prepare/batch-finalize architecture.")
    print("Affected-officer selector and per-officer loss remain open.")

if __name__ == "__main__":
    main()
