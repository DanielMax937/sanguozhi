"""P0-1 hiring probability exactness boundary validation."""
import json
from pathlib import Path


def nonzero_factor10(giri: int) -> int:
    return min(10, 15 - 2 * giri)


def apply_nonzero_mode(p: int, giri: int) -> int:
    return min(100, (p * nonzero_factor10(giri)) // 10)


def date_key(day: int, month: int, year: int) -> int:
    return day * 7 + month * 5 + year * 3


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    d = json.loads(
        (root / "docs/sources/hiring-probability-exactness.json")
        .read_text(encoding="utf-8")
    )

    assert d["status"] == "narrowed-still-open"
    assert d["outerControlFlow"]["function"] == "004AFD60"
    assert d["outerControlFlow"]["forcedGate"] == "004AF7D0"
    assert d["outerControlFlow"]["successRate"] == "005C4F80"

    assert d["normalMode"]["thirdParameter"] == 0
    assert d["normalMode"]["externalGiriFactor10"] == 10
    assert d["normalMode"]["finalCheck"] == "deterministicValue < successRate"
    assert len(d["normalMode"]["deterministicInputs"]) == 7

    assert nonzero_factor10(0) == 10
    assert nonzero_factor10(1) == 10
    assert nonzero_factor10(2) == 10
    assert nonzero_factor10(3) == 9
    assert nonzero_factor10(4) == 7

    assert apply_nonzero_mode(80, 3) == 72
    assert apply_nonzero_mode(80, 4) == 56
    assert apply_nonzero_mode(150, 0) == 100

    assert date_key(1, 1, 200) == 612
    assert d["dateKey"]["remoteHiringUsesOrderDate"] is True

    assert d["successRate"]["completeBodyPubliclyRecovered"] is False
    assert d["hardGate"]["completeBodyPubliclyRecovered"] is False
    assert d["rejectedModernModFormula"]["label"] == "SIRE-modern-mod-system"

    print("PASS: P0-1 original hiring outer chain and exactness boundary")
    print("005C4F80/005BA410/005BA4C0 remain open; modern SIRE formula is MOD-only.")


if __name__ == "__main__":
    main()
