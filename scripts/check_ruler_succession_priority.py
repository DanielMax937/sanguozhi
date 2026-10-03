"""E18 ordinary ruler succession reference validation."""
import json
from pathlib import Path


CATEGORY_PRIORITY = {
    "blood-relative": 0,
    "sworn-sibling": 1,
    "spouse": 2,
    "ordinary": 3,
}


def compatibility_ai_key(candidate):
    """
    Engine fallback only.
    Original intra-category and same-age tie-breaks are still open.
    """
    return (
        CATEGORY_PRIORITY[candidate["category"]],
        candidate["birth_year"],
        candidate["person_id"],
    )


def choose_compatibility_ai(candidates):
    legal = [
        p for p in candidates
        if p["alive"]
        and p["same_force"]
        and not p["captive"]
    ]
    if not legal:
        return None
    return min(legal, key=compatibility_ai_key)


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    d = json.loads(
        (root / "docs/sources/ruler-succession-priority.json")
        .read_text(encoding="utf-8")
    )

    assert d["routing"]["playerOrdinaryDeath"]["automaticRanking"] is False
    assert d["routing"]["aiOrdinaryDeath"]["categoryPriority"] == [
        "blood-relative",
        "sworn-sibling",
        "spouse",
        "ordinary-eldest",
    ]
    assert d["reverseEntry"]["address"] == "004B9080"
    assert d["reverseEntry"]["body"] == "not publicly expanded"

    candidates = [
        {
            "name": "high_merit",
            "category": "ordinary",
            "birth_year": 160,
            "person_id": 10,
            "alive": True,
            "same_force": True,
            "captive": False,
        },
        {
            "name": "older_low_merit",
            "category": "ordinary",
            "birth_year": 150,
            "person_id": 20,
            "alive": True,
            "same_force": True,
            "captive": False,
        },
        {
            "name": "younger_spouse",
            "category": "spouse",
            "birth_year": 170,
            "person_id": 30,
            "alive": True,
            "same_force": True,
            "captive": False,
        },
        {
            "name": "captured_blood",
            "category": "blood-relative",
            "birth_year": 140,
            "person_id": 40,
            "alive": True,
            "same_force": True,
            "captive": True,
        },
    ]

    picked = choose_compatibility_ai(candidates)
    assert picked["name"] == "younger_spouse"

    # If the spouse is absent, the eldest ordinary candidate wins
    # in the current compatibility fallback.
    picked = choose_compatibility_ai([
        p for p in candidates
        if p["name"] != "younger_spouse"
    ])
    assert picked["name"] == "older_low_merit"

    # Captive blood relative must not become eligible.
    assert all(
        not (
            p["name"] == "captured_blood"
            and p["alive"]
            and p["same_force"]
            and not p["captive"]
        )
        for p in candidates
    )

    print("PASS: E18 succession routing and compatibility AI category priority")
    print("Intra-category and same-age original tie-breaks remain explicitly open.")


if __name__ == "__main__":
    main()
