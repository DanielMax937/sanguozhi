"""P0-6 non-natural loyalty exactness validation."""
import json
from pathlib import Path


def salary_transaction(gold_after_captive: int, salary_sum: int) -> tuple[int, bool]:
    """Return (gold_after_salary, shortfall).

    PC-PK1.1 outer transaction is all-or-nothing per facility.
    """
    if salary_sum <= gold_after_captive:
        return gold_after_captive - salary_sum, False
    return gold_after_captive, True


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    d = json.loads(
        (root / "docs/sources/nonnatural-loyalty-exactness.json")
        .read_text(encoding="utf-8")
    )

    assert d["status"]["audit"] == "complete"
    assert d["status"]["salaryPaymentTransaction"] == "resolved"
    assert d["status"]["blanketAllOfficerRumorModel"] == "rejected"

    reward = d["cashReward"]
    assert reward["goldPerPerson"] == 100
    assert reward["apPerPerson"] == 5
    assert reward["multiSelect"] is True
    assert reward["oncePerPersonPerTurn"] is True
    assert reward["gain"]["random"] is True
    assert min(reward["gain"]["observedGains"]) < 11

    salary = d["salary"]
    assert salary["paymentMode"] == "all-or-nothing-per-facility"
    assert salary["activeIdentityMask"] == "0x0F"
    assert salary_transaction(1000, 600) == (400, False)
    assert salary_transaction(600, 600) == (0, False)
    assert salary_transaction(599, 600) == (599, True)
    assert salary_transaction(80, 100) == (80, True)

    rumor = d["rumor"]
    assert rumor["successFormulaSeparateFromEffect"] is True
    assert rumor["blanketAllOfficersSameLoss"] is False
    assert rumor["targetSelector"] == "open"
    assert rumor["effectHelpers"] == ["005D05B0", "005D05F0"]

    modern = d["modernReconstructionBoundary"]
    assert modern["sangoInfinityRewardBase11"] == "not-fidelity"
    assert modern["sangoInfinityRumorAllLivingOfficers8to15"] == "not-fidelity"

    print("PASS: P0-6 non-natural loyalty boundaries")
    print("Salary payment transaction is exact; reward/rumor inner formulas remain open.")


if __name__ == "__main__":
    main()
