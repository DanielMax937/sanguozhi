"""P0-14 technology research-time boundary validation."""
import json
from pathlib import Path

def apply_talent_office(base_turns: int, has_office: bool) -> int:
    return max(1, base_turns - (2 if has_office else 0))

def main():
    root = Path(__file__).resolve().parents[1]
    d = json.loads(
        (root / "docs/sources/technique-research-time-exactness.json")
        .read_text(encoding="utf-8")
    )

    assert d["status"]["researchTimeContainingFunction"] == "resolved"
    assert d["functions"]["researchTimeCalculator"]["start"] == "005D7DD0"
    assert d["functions"]["researchTimeCalculator"]["endExclusive"] == "005D7F00"

    assert d["talentOffice"]["reductionTurns"] == 2
    assert d["talentOffice"]["minimumTurns"] == 1
    assert apply_talent_office(9, True) == 7
    assert apply_talent_office(3, True) == 1
    assert apply_talent_office(2, True) == 1
    assert apply_talent_office(1, True) == 1

    assert d["runtime"]["unit"] == "turn/ten-day period"
    assert d["runtime"]["decrementPerTurn"] == 1
    assert d["technologyStruct"]["recoveredResearchTimeField"] is False

    assert d["superDifficulty"]["thresholds"] == [70, 140, 210, 280]
    assert d["difficulty"]["doNotCopySuperThresholds"] is True
    assert d["difficulty"]["beginner"] == "open"
    assert d["difficulty"]["advanced"] == "open"

    anchors = d["superDifficulty"]["knownAnchors"]
    derived = [x for x in anchors if x.get("derivedFromExactTalentOfficeReduction")]
    assert derived == [{
        "attributeSum": 280,
        "talentOffice": False,
        "level": 4,
        "days": 80,
        "derivedFromExactTalentOfficeReduction": True,
    }]

    print("PASS: P0-14 research-time boundaries")
    print("Talent-office tail is exact; base-time matrix remains explicitly partial.")

if __name__ == "__main__":
    main()
