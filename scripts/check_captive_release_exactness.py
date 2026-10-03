"""P0-7 captive release boundary validation."""
import json
from pathlib import Path


def maintenance_release(prisoner_count: int, gold: int):
    paid = min(prisoner_count, gold // 50)
    released = prisoner_count - paid
    remaining_gold = gold - paid * 50
    return paid, released, remaining_gold


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    d = json.loads(
        (root / "docs/sources/captive-release-exactness.json")
        .read_text(encoding="utf-8")
    )

    assert d["status"]["audit"] == "complete"
    assert d["status"]["maintenanceReleaseCount"] == "resolved"
    assert d["maintenance"]["costPerPrisoner"] == 50

    assert maintenance_release(10, 500) == (10, 0, 0)
    assert maintenance_release(10, 499) == (9, 1, 49)
    assert maintenance_release(10, 249) == (4, 6, 49)
    assert maintenance_release(10, 0) == (0, 10, 0)
    assert maintenance_release(0, 999) == (0, 0, 999)

    pipe = d["maintenance"]["selectionPipeline"]
    assert pipe["comparator"] == "0058C320"
    assert pipe["genericListAlgorithm"] == "004AA200"
    assert pipe["listShrinkHelper"] == "004A8E10"
    assert pipe["perFacilityAccumulator"] == "0058D1D0"
    assert pipe["monthlyFinalizer"] == "0058D430"
    assert d["maintenance"]["selectionCountEqualsReleaseCount"] is True
    assert d["maintenance"]["comparatorBusinessMeaning"] == "open"

    cmd = d["manualReleaseCommand"]
    assert cmd["goldCost"] == 0
    assert cmd["actionPointCost"] == 0
    assert cmd["maxPersons"] == 6
    assert cmd["releaseEnemyCaptiveRaisesTechniquePoints"] is True
    assert cmd["techniquePointAmount"] == "open"

    forb = d["forbiddenPeriodEvidence"]
    assert forb["manualReleaseExactConclusion"] == "disputed"
    assert forb["compatibilityCandidateMonths"] == 3

    assert len(d["exitCausesMustBeSeparate"]) >= 6

    fallback = d["fallback"]
    assert fallback["maintenanceSelectorEvidence"] == "provisional-engine-rule"
    assert fallback["manualReleaseTechniquePointGainEvidence"] == "empirical-compatibility"
    assert fallback["manualReleaseForbiddenEvidence"] == "disputed-compatibility-candidate"
    assert fallback["maintenanceReleaseTechniquePointGainEvidence"] == "conservative-no-unproven-reward"

    print("PASS: P0-7 captive release boundary model")
    print("Forced release count is exact; comparator and release side effects remain explicit gaps.")


if __name__ == "__main__":
    main()
