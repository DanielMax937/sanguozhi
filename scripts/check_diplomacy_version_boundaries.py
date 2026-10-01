"""P0-2 diplomacy version-boundary validation."""
import json
from pathlib import Path


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    d = json.loads(
        (root / "docs/sources/diplomacy-version-boundaries.json")
        .read_text(encoding="utf-8")
    )

    assert d["status"] == "version-boundary-resolved/constants-still-open"

    assert d["vanilla"]["1.1"]["officialChanges"] == [
        "friendship gain/loss balance"
    ]
    assert d["vanilla"]["1.2"]["officialChanges"] == [
        "friendship gain/loss balance",
        "strategy/diplomacy success rates",
    ]
    assert d["vanilla"]["1.3-plus"]["explicitDiplomacyChanges"] is False

    assert d["pk"]["addsSuperDifficulty"] is True
    assert d["pk"]["formulaCorpus"]["difficultyMultipliers"] == {
        "beginner": 1.0,
        "advanced": 0.8,
        "super": 0.7,
    }
    assert d["pk"]["formulaCorpus"]["exactBuild"] == "open"

    office = d["pk"]["reverseSupport"]["diplomacyOffice"]
    assert office["actionPointMultiplier"] == 0.5
    assert office["amicabilityGoldMultiplier"] == 0.5
    assert office["successRateMultiplier"] == 1.0

    assert "vanilla-pc-1.0" in d["profiles"]
    assert "vanilla-pc-1.1" in d["profiles"]
    assert "vanilla-pc-1.2-plus" in d["profiles"]
    assert "pk-pc-formula-corpus" in d["profiles"]
    assert "console-separate-open" in d["profiles"]

    assert any(
        "compatibilityAssumption=true" in rule
        for rule in d["safetyRules"]
    )

    print("PASS: P0-2 diplomacy patch boundaries and profile separation")
    print("Version boundaries are resolved; exact Vanilla constants remain open.")


if __name__ == "__main__":
    main()
