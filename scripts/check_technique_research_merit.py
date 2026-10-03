"""E12 technique-research merit evidence validation."""
import json
from pathlib import Path


def main():
    root = Path(__file__).resolve().parents[1]
    p = root / "docs/sources/technique-research-merit.json"
    d = json.loads(p.read_text(encoding="utf-8"))

    current = d["candidates"]["currentWikiMainTable"]["meritByLevel"]
    early = d["candidates"]["early2006GuideAndWikiTips"]["meritByLevel"]
    tp = d["levelTechniquePointCost"]

    assert current == [500, 1000, 2000, 3000]
    assert early == [500, 1000, 1500, 2500]
    assert current[:2] == early[:2] == [500, 1000]
    assert d["consensus"] == {
        "level1": 500,
        "level2": 1000,
        "level3": None,
        "level4": None,
    }
    assert d["exactness"] == "unresolved"

    # Document an arithmetic feature of the early table, not an engine formula.
    assert early == [x // 2 for x in tp]
    assert d["primaryCompatibilityCandidate"] == current

    print("PASS: E12 stores both conflicting merit tables and shared Lv1/Lv2 values")
    print("Lv3/Lv4 exact PC-PK1.1 merit constants intentionally remain unresolved.")


if __name__ == "__main__":
    main()
