"""P0-15 technique-research merit exactness evidence validation."""
import json
from pathlib import Path


def main():
    root = Path(__file__).resolve().parents[1]
    p = root / "docs/sources/technique-research-merit-exactness.json"
    d = json.loads(p.read_text(encoding="utf-8"))

    current = d["tables"]["currentWiki"]
    early = d["tables"]["earlyGuide"]
    consensus = d["tables"]["consensus"]

    assert current == [500, 1000, 2000, 3000]
    assert early == [500, 1000, 1500, 2500]
    assert current[:2] == early[:2] == [500, 1000]
    assert consensus == {
        "level1": 500,
        "level2": 1000,
        "level3": None,
        "level4": None,
    }

    rev = d["reverseEvidence"]
    assert rev["researchCommandAnchor"] == "005D8F68"
    assert rev["researchCommandContainingFunction"] == "sub_5D8C50"
    assert rev["publishedTechniqueResearchCompletionMeritAddress"] is None
    assert d["claims"]["pcPk11Exactness"] == "unresolved"
    assert d["claims"]["participantDistribution"] == "unresolved"
    assert d["compatibilityCandidate"] == current

    print("PASS: P0-15 preserves both merit tables and the PC-PK1.1 reverse-evidence boundary.")
    print("Lv3/Lv4 and participant allocation intentionally remain unresolved.")


if __name__ == "__main__":
    main()
