"""P0-37 research difficulty matrix boundary checks."""
import json
from pathlib import Path

def main():
    root = Path(__file__).resolve().parents[1]
    p = root / "docs/sources/technique-research-difficulty-matrix-boundary.json"
    d = json.loads(p.read_text(encoding="utf-8"))

    r = d["reverse"]
    assert r["calculator"] == "005D7DD0"
    assert r["calculatorBounds"] == ["0x5D7DD0", "0x5D7F00"]

    x = d["resolved"]
    assert x["calculatorBoundaryExact"] is True
    assert x["difficultyFieldExists"] is True
    assert x["calculatorDifficultyReadProven"] is False
    assert x["superThresholdsEvidence"] == "empirical-high"
    assert x["beginnerMatrixResolved"] is False
    assert x["advancedMatrixResolved"] is False

    assert d["superObservedThresholds"] == [70,140,210,280]

    print("PASS: P0-37 keeps Super thresholds empirical and Beginner/Advanced matrices open.")

if __name__ == "__main__":
    main()
