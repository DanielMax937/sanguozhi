"""P0-11 training/morale boundary validation."""
import json
from pathlib import Path

def morale_recovery(in_platform: bool, has_music: bool, has_poetry: bool) -> int:
    if in_platform:
        return 20 if has_poetry else 10
    if has_music:
        return 5
    return 0

def apply_cap(current: int, gain: int, cap: int) -> int:
    return min(cap, current + gain)

def main() -> None:
    root = Path(__file__).resolve().parents[1]
    d = json.loads(
        (root / "docs/sources/training-morale-exactness.json")
        .read_text(encoding="utf-8")
    )

    assert d["status"]["audit"] == "complete"
    assert d["training"]["gate"]["function"] == "005C4100"
    assert d["training"]["execution"]["function"] == "005C4220"
    assert d["training"]["execution"]["setTrainingStatus"] == "004AD080"
    assert d["training"]["cadence"]["oncePerTurn"] is True
    assert d["training"]["cadence"]["resetCaller"] == "open"

    mr = d["moraleRecovery"]
    assert mr["function"] == "0059A230"
    assert mr["musicPlatform"]["gain"] == 10
    assert mr["musicSkill"]["gain"] == 5
    assert mr["poetrySkill"]["extraPlatformGain"] == 10

    assert morale_recovery(False, False, False) == 0
    assert morale_recovery(False, True, False) == 5
    assert morale_recovery(False, False, True) == 0
    assert morale_recovery(True, False, False) == 10
    assert morale_recovery(True, True, False) == 10
    assert morale_recovery(True, False, True) == 20
    assert morale_recovery(True, True, True) == 20

    assert apply_cap(95, 10, 100) == 100
    assert apply_cap(110, 20, 120) == 120

    print("PASS: P0-11 training/morale boundaries")
    print("Historical P0-11 baseline preserved; P0-47 recovers S1 source gate/reset xrefs. Stock equivalence and complete scheduler remain open.")

if __name__ == "__main__":
    main()
