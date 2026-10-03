"""E19 council proposal pool validation."""
import json
from pathlib import Path

EXPECTED_IDS = [
    "domestic-build", "recruit", "produce-equipment", "patrol", "train",
    "search", "hire", "appoint-strategist", "remove-facility",
    "invade", "intercept", "military-build",
    "amicability-gift", "alliance", "break-alliance", "ceasefire",
    "demand-surrender", "exchange-prisoner", "request-reinforcement",
    "two-tigers", "drive-tiger", "rumor",
]

EXPECTED_GROUP_COUNTS = {
    "domestic": 9,
    "sortie": 3,
    "diplomacy-strategy": 10,
}


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    d = json.loads(
        (root / "docs/sources/council-proposal-pool.json")
        .read_text(encoding="utf-8")
    )

    proposals = d["proposals"]
    ids = [p["id"] for p in proposals]

    assert d["proposalCount"] == 22
    assert len(proposals) == 22
    assert len(set(ids)) == 22
    assert ids == EXPECTED_IDS

    group_counts = {}
    for p in proposals:
        group_counts[p["displayGroup"]] = (
            group_counts.get(p["displayGroup"], 0) + 1
        )
    assert group_counts == EXPECTED_GROUP_COUNTS

    assert d["command"]["cost"] == {
        "money": 0,
        "actionPower": 0,
        "duration": "none",
    }
    assert d["command"]["maxParticipants"] == 6

    assert d["stages"]["policy"]["displayGroups"] == [
        "domestic", "sortie", "diplomacy-strategy"
    ]
    assert d["stages"]["policy"]["messageSpeechSubtypes"] == [
        "sortie-attack", "sortie-defense",
        "domestic", "diplomacy-strategy"
    ]

    assert set(d["excludedOldFallbackTypes"]) == {
        "technique-research", "transport", "reward/praise"
    }

    assert d["techniquePointGain"]["value"] == 10
    assert d["selector"]["status"] == "open"
    assert d["execution"]["acceptedProposalResourceAndApCallChain"] == "open"

    print("PASS: E19 22-type council proposal pool and two-stage decision schema")
    print("Proposal chooser and accepted-proposal execution call chain remain open.")


if __name__ == "__main__":
    main()
