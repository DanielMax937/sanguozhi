"""E13 abnormal-status duration/recovery evidence validation."""
import json
from pathlib import Path


def tick(remaining: int, in_pk_defense_aura: bool) -> int:
    step = 2 if in_pk_defense_aura else 1
    return max(0, remaining - step)


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    d = json.loads(
        (root / "docs/sources/status-duration-recovery.json")
        .read_text(encoding="utf-8")
    )

    recovery = d["exactReverse"]["recovery"]
    assert recovery["normalStep"] == 1
    assert recovery["pkQualifiedDefenseFacilityStep"] == 2
    assert recovery["addressAuraStep"] == "00599CAB"

    auto = d["exactReverse"]["lowTroopAutoConfusion"]
    assert auto["durationExpression"] == "GetRandomX(2)+1"
    assert auto["possibleCounts"] == [1, 2]

    assert tick(3, False) == 2
    assert tick(1, False) == 0
    assert tick(3, True) == 1
    assert tick(1, True) == 0

    fallback = d["compatibilityFallback"]
    assert fallback["normal"] == {"durations": [1, 2], "weights": [70, 30]}
    assert fallback["critical"] == {"durations": [2, 3], "weights": [70, 30]}

    assert "005917D0 original false-report initial-duration generation" in d["open"]
    assert "00591A20 original disturb initial-duration generation" in d["open"]

    print("PASS: E13 deterministic recovery and source-bounded duration evidence")
    print("Ordinary False Report/Disturb initial duration remains intentionally open.")


if __name__ == "__main__":
    main()
