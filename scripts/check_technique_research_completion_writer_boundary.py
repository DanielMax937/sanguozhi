"""P0-38 technique research completion writer boundary checks."""
import json
from pathlib import Path

def main():
    root = Path(__file__).resolve().parents[1]
    p = root / "docs/sources/technique-research-completion-writer-boundary.json"
    d = json.loads(p.read_text(encoding="utf-8"))

    r = d["reverse"]
    assert r["perTurnCounterFunction"] == "00599CF0"
    assert r["setResearchTimeLeft"] == "004815E0"
    assert r["abilityResearchCompletionHandler"] == "005CE600"
    assert r["researchCommandAnchor"] == "005D8F68"

    x = d["resolved"]
    assert x["techResearchBranchOnlyDecrements"] is True
    assert x["techCompletionCallInsideCountdownBranch"] is False
    assert x["abilityResearchCompletionInlineAfterZero"] is True
    assert x["researchMissionDependsOnForceResearchTimeLeft"] is True
    assert x["researchCommandAnchorIsCompletionWriter"] is False

    print("PASS: P0-38 separates technique countdown from unresolved completion writer.")

if __name__ == "__main__":
    main()
