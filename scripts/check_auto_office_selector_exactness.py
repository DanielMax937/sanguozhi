"""P0-8 automatic office selector validation."""
import json
from pathlib import Path


def office_type(office_id: int):
    if 0 <= office_id <= 3:
        return "top-civil"
    if 0 <= office_id < 80:
        return "military" if office_id % 8 >= 4 else "civil"
    return "unknown"


def loyalty_bonus(loyalty: int) -> int:
    if loyalty < 90:
        raise ValueError("candidate rejected before scoring")
    return 9 * min(loyalty - 90, 10)


def score_weighted(kind, l, w, i, p, loyalty):
    if loyalty < 90:
        return None
    bonus = loyalty_bonus(loyalty)

    if kind == "top-civil":
        base = l + i
        return None if base < 150 else base + bonus

    if kind == "military":
        return None if max(l, w) < 60 else l + w + bonus

    if kind == "civil":
        civil = max(i, p)
        return None if civil < 70 else civil + bonus

    return None


def score_affinity(kind, l, w, i, p, loyalty):
    if loyalty < 90:
        return None
    martial = max(l, w)
    civil = max(i, p)

    if kind == "military":
        return martial if martial >= civil else None

    if kind in ("top-civil", "civil"):
        return civil if civil > martial else None

    return None


def select_first_wins(candidates):
    best = None
    best_score = -(2 ** 31)
    for name, score in candidates:
        if score is None:
            continue
        if score > best_score:
            best = name
            best_score = score
    return best, best_score


def main():
    root = Path(__file__).resolve().parents[1]
    d = json.loads(
        (root / "docs/sources/auto-office-selector-exactness.json")
        .read_text(encoding="utf-8")
    )

    assert d["status"]["selectorScoring"] == "resolved"
    assert d["functions"]["selector"] == "005FAF00"
    assert d["functions"]["qualification"] == "005FA4D0"
    assert d["functions"]["officeClassifier"] == "005FA650"

    assert office_type(0) == "top-civil"
    assert office_type(3) == "top-civil"
    assert office_type(4) == "military"
    assert office_type(8) == "civil"
    assert office_type(12) == "military"
    assert office_type(44) == "military"
    assert office_type(79) == "military"
    assert office_type(80) == "unknown"

    assert loyalty_bonus(90) == 0
    assert loyalty_bonus(91) == 9
    assert loyalty_bonus(100) == 90
    assert loyalty_bonus(150) == 90

    assert score_weighted("top-civil", 80, 1, 70, 1, 90) == 150
    assert score_weighted("top-civil", 79, 1, 70, 1, 90) is None

    assert score_weighted("military", 60, 1, 1, 1, 90) == 61
    assert score_weighted("military", 59, 59, 1, 1, 90) is None
    assert score_weighted("military", 70, 60, 1, 1, 100) == 220

    assert score_weighted("civil", 1, 1, 70, 60, 90) == 70
    assert score_weighted("civil", 1, 1, 69, 69, 90) is None

    # affinity equality goes military, not civil
    assert score_affinity("military", 70, 50, 70, 50, 90) == 70
    assert score_affinity("civil", 70, 50, 70, 50, 90) is None
    assert score_affinity("top-civil", 70, 50, 70, 50, 90) is None

    # final tie is stable first-wins
    assert select_first_wins([("A", 100), ("B", 100), ("C", 99)]) == ("A", 100)
    assert select_first_wins([("A", 100), ("B", 101)]) == ("B", 101)

    assert d["merit"]["finalScoreRole"] is False
    assert d["fallback"]["doNotAliasModeToAIUntilCallerResolved"] is True

    print("PASS: P0-8 automatic office selector core")
    print("Scoring/tie are exact; caller order and eligibility helper remain open.")


if __name__ == "__main__":
    main()
