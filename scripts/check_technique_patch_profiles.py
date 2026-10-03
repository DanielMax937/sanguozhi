"""Validate E8 technique patch-profile data."""
from __future__ import annotations
import json
from pathlib import Path

def main() -> None:
    path = Path(__file__).resolve().parents[1] / "docs/sources/technique-version-deltas.json"
    data = json.loads(path.read_text(encoding="utf-8"))
    deltas = {d["techniqueId"]: d for d in data["vanillaPc10ReportedDeltas"]}
    assert set(deltas) == {0, 3, 7, 11, 19, 24, 27}
    assert deltas[0]["vanilla10"]["damageMultiplier"] == 1.20
    assert deltas[0]["laterDocumented"]["damageMultiplier"] == 1.10
    assert deltas[3]["vanilla10"]["mobilityDelta"] == 2
    assert deltas[3]["laterDocumented"]["mobilityDelta"] == 6
    assert deltas[24]["vanilla10"]["reportedRecoveryMultiplier"] == 4.0
    assert deltas[24]["laterDocumented"]["reportedRecoveryMultiplier"] == 2.5
    assert deltas[27]["vanilla10"]["counterDamageMultiplier"] == 1.20
    assert deltas[27]["laterDocumented"]["counterDamageMultiplier"] == 2.0
    pk = data["pkPc11ReverseBaseline"]
    assert pk["constants"]["trainingDamageMultiplier"] == 1.10
    assert pk["constants"]["eliteDamageMultiplier"] == 1.15
    assert pk["constants"]["eliteOverridesTrainingDamage"] is True
    assert pk["engineerTraining"]["domesticFacilityRelativeMultiplier"] == 2.0
    assert pk["engineerTraining"]["fixedBaseRelativeMultiplier"] == 2.5
    assert pk["explosiveRefiningBug"]["presentInStudiedBinary"] is True
    fixes = data["unofficialPatchExamples"]
    assert any(x.get("address") == "005AE01B" for x in fixes)
    assert any(x.get("address") == "005AE083" for x in fixes)
    print("PASS: E8 timeline boundaries, Vanilla deltas, PK baseline and community-fix separation")
    print("Exact transition patch for retrospective Vanilla deltas remains intentionally unknown.")

if __name__ == "__main__":
    main()
