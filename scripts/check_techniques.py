"""E7 technique-tree reference validation.

This validates the structured 36-technique data and exact invariants that are
already source-audited. It is not an executable-game regression test.
"""
from __future__ import annotations
import json
from pathlib import Path


def main() -> None:
    path = Path(__file__).resolve().parents[1] / "docs/sources/techniques.json"
    data = json.loads(path.read_text(encoding="utf-8"))
    rows = data["techniques"]

    assert len(rows) == 36
    assert [r["id"] for r in rows] == list(range(36))

    expected_tp = [1000, 2000, 3000, 5000]
    expected_gold = [1000, 2000, 5000, 10000]
    for r in rows:
        idx = r["level"] - 1
        assert r["techniquePointCost"] == expected_tp[idx]
        assert r["goldCost"] == expected_gold[idx]
        assert r["branchId"] == r["id"] // 4
        assert r["level"] == r["id"] % 4 + 1
        assert r["pkOnly"] == (r["id"] >= 32)

    by_id = {r["id"]: r for r in rows}

    assert by_id[3]["effect"]["damageMultiplier"] == 1.15
    assert by_id[3]["effect"]["baseAttackDelta"] == 10
    assert by_id[3]["effect"]["mobilityDelta"] == 6
    assert by_id[7]["effect"]["mobilityDelta"] == 6
    assert by_id[11]["effect"]["mobilityDelta"] == 6
    assert by_id[15]["effect"]["mobilityDelta"] == 2

    assert by_id[5]["effect"]["blockProbability"] == 0.30
    assert by_id[6]["effect"]["blockProbability"] == 0.30
    assert by_id[13]["effect"]["mobilityDelta"] == 4
    assert by_id[16]["effect"]["moraleCap"] == 120
    assert by_id[18]["effect"]["commandCapacityDelta"] == 3000
    assert by_id[19]["effect"]["buildingDamageMultiplierOrdinary"] == 1.4
    assert by_id[19]["effect"]["buildingDamageMultiplierSiegeAndShip"] == 1.2
    assert by_id[20]["effect"]["siegeMobilityDelta"] == 4
    assert by_id[26]["effect"]["baseMaxDurabilityDelta"] == 3000
    assert by_id[27]["effect"]["baseCounterDamageMultiplier"] == 2.0
    assert by_id[29]["effect"]["firePlanRangeDelta"] == 2
    assert by_id[32]["effect"]["transportMobilityDelta"] == 3
    assert by_id[34]["effect"]["naturalOrderLossImmunityProbability"] == 0.50
    assert by_id[35]["effect"]["loyaltyLossImmunityProbability"] == "2/3"

    assert data["techniquePointCap"] == 10000
    assert data["research"]["actionPoints"] == 50
    assert data["research"]["abilityExperienceByLevel"] == [10, 20, 30, 50]\n    assert data["research"]["meritByLevel"] == [500, 1000, 2000, 3000]\n    assert data["research"]["meritEvidence"] == "documented-current-wiki-candidate"\n    assert data["research"]["meritExactness"] == "unresolved"

    print("PASS: 36 techniques, IDs/branches/levels, costs and audited constants")
    print("Reference-data validation only; research-time, patch differences, and research-merit exactness remain open.")


if __name__ == "__main__":
    main()
