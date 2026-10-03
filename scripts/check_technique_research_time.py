"""E11 research-time evidence validation."""
import json
from pathlib import Path

def apply_talent_office(base_days: int) -> int:
    if base_days % 10:
        raise ValueError("whole 10-day turns required")
    return max(10, base_days - 20)

def main():
    p=Path(__file__).resolve().parents[1]/"docs/sources/technique-research-time.json"
    d=json.loads(p.read_text(encoding="utf-8"))
    assert d["turnDays"]==10
    assert d["researcherCount"]==3
    assert d["evidence"]["superEmpirical"]["bucketThresholds"]==[70,140,210,280]
    office=d["evidence"]["exactReverse"]["talentOffice"]
    assert office["subtractDays"]==20 and office["minimumDays"]==10
    assert apply_talent_office(30)==10
    assert apply_talent_office(80)==60
    anchors=d["evidence"]["superEmpirical"]["anchors"]
    assert any(a.get("relatedAbilitySum")==210 and a.get("levelDays")==[30,40,60,90] for a in anchors)
    assert any(a.get("relatedAbilitySum")==280 and a.get("level")==4 and a.get("days")==80 for a in anchors)
    assert d["evidence"]["guideDisplayAnchors"]["familyA"]["levelDays"]==[30,40,60,90]
    assert d["evidence"]["guideDisplayAnchors"]["familyB"]["levelDays"]==[40,50,70,100]
    print("PASS: E11 exact Talent Office transform and source-bounded timing anchors")
    print("Full ability-bucket matrix intentionally remains open.")

if __name__=="__main__":
    main()
