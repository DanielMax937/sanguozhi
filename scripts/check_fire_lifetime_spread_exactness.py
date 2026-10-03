"""P0-4 fire lifetime / spread boundary validation."""
import json
from pathlib import Path


def shifted_profile(base: dict[int, float], bonus: int) -> dict[int, float]:
    return {turns + bonus: weight for turns, weight in base.items()}


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    d = json.loads(
        (root / "docs/sources/fire-lifetime-spread-exactness.json")
        .read_text(encoding="utf-8")
    )

    duration = d["duration"]
    fallback = duration["fallbackProfile"]

    assert d["status"]["audit"] == "complete"
    assert d["status"]["baseLifetimeRng"] == "open"
    assert duration["criticalBonusTurns"] == 1
    assert duration["criticalTransform"] == "baseDuration+1"
    assert fallback["notOriginalConstant"] is True
    assert fallback["evidence"] == "secondary-code-reconstruction"

    base = {
        int(k): float(v)
        for k, v in fallback["normalStoredCounterWeights"].items()
    }
    assert abs(sum(base.values()) - 1.0) < 1e-12
    assert base == {1: 0.7, 2: 0.3}
    assert shifted_profile(base, duration["criticalBonusTurns"]) == {
        2: 0.7,
        3: 0.3,
    }

    paired = duration["pairedObservation"]
    assert [
        b - a
        for a, b in zip(
            paired["normalVisibleTurns"],
            paired["criticalVisibleTurns"],
        )
    ] == [1, 1, 1]

    spread = d["naturalSpread"]
    assert spread["fidelityEnabled"] is False
    assert spread["fidelityProbability"] == 0
    assert "fire-trap chain detonation" in spread["separateFrom"]

    reverse = d["reverseEvidence"]
    assert reverse["genericCounterRoutineExcluded"] == "00599CF0"
    assert reverse["fireLifetimeSetterFound"] is False
    assert reverse["ambientSpreadCallChainFound"] is False

    assert d["implementation"]["mustParameterizeLifetimeBySource"] is True
    assert "PC-PK1.1 fire lifetime setter" in d["open"]

    print("PASS: P0-4 fire-duration and ambient-spread boundaries")
    print("Base lifetime RNG remains explicitly open; 70/30 is fallback only.")


if __name__ == "__main__":
    main()
