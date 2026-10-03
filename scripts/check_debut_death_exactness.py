"""P0-5 debut/lifespan profile boundary validation."""
import json
from pathlib import Path


def effective_debut_year(birth: int, debut: int, mode: str, ignore_age: bool):
    if ignore_age:
        return None
    if mode == "fictional":
        return birth + 15
    return debut


def compatibility_lifetime_threshold(
    birth: int,
    historical_threshold: int,
    mode: str,
    ignore_age: bool,
):
    if ignore_age:
        return None
    if mode == "historical":
        return historical_threshold
    if mode == "longevity":
        return historical_threshold + 20
    if mode == "fictional":
        return birth + 99
    raise ValueError(mode)


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    d = json.loads(
        (root / "docs/sources/debut-death-exactness.json")
        .read_text(encoding="utf-8")
    )

    assert d["status"]["audit"] == "complete"
    assert d["reverse"]["monthlyAction"] == "00590C30"
    assert d["reverse"]["ageDeathHandler"] == "005833D0"
    assert d["reverse"]["getDeathYear"] == "0048A000"
    assert d["reverse"]["isMarkedForDeath"] == "00489160"

    assert d["debut"]["fictional"]["adultAge"] == 15
    assert effective_debut_year(181, 208, "historical", False) == 208
    assert effective_debut_year(181, 208, "fictional", False) == 196
    assert effective_debut_year(181, 208, "historical", True) is None

    assert d["lifespan"]["longevity"]["compatibilityExtraYears"] == 20
    assert d["lifespan"]["fictional"]["compatibilityAgeThreshold"] == 99
    assert compatibility_lifetime_threshold(169, 222, "historical", False) == 222
    assert compatibility_lifetime_threshold(169, 222, "longevity", False) == 242
    assert compatibility_lifetime_threshold(169, 222, "fictional", False) == 268
    assert compatibility_lifetime_threshold(169, 222, "historical", True) is None

    dist = d["fallback"]["annualMarkDistribution"]
    assert abs(sum(dist.values()) - 1.0) < 1e-12
    assert d["fallback"]["annualMarkDistributionEvidence"] == "provisional-engine-rule"
    assert d["fallback"]["mustRunInsideMonthStartLifecycleDispatcher"] is True

    assert d["causeOfDeath"]["unnatural"]["hardCap15Rejected"] is True
    assert d["runtime"]["scenarioInitPermanentDeathDate"] is False

    print("PASS: P0-5 debut/lifespan boundary model")
    print("005833D0 and 0048A000 internals remain explicitly open.")


if __name__ == "__main__":
    main()
