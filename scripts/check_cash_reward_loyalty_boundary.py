"""P0-21 cash reward loyalty boundary checks."""
import json
from pathlib import Path

def main():
    root = Path(__file__).resolve().parents[1]
    p = root / "docs/sources/cash-reward-loyalty-boundary.json"
    d = json.loads(p.read_text(encoding="utf-8"))

    r = d["reverse"]
    assert r["rewardExecutionContainingFunction"] == ["0x5B5D60", "0x5B5FA0"]
    assert r["setLoyalty"] == "0048A770"
    assert r["modifyPersonLoyalty"] == "004A6CF0"
    assert r["loyaltyField"] == "0xAC"

    x = d["resolved"]
    assert x["trueLoyaltyRange"] == "0..255"
    assert x["displayCap"] == 100
    assert x["trueLoyaltyCanExceedDisplayCap"] is True
    assert x["rewardMustNotClampToDisplay100BeforeFutureEffects"] is True

    e = d["empiricalConstraints"]
    assert set(e["observedGains"]) == {5, 8, 9}
    assert e["fixedGainModelRejected"] is True
    assert e["modernBase11ModelRejected"] is True

    print("PASS: P0-21 separates reward delta calculation from true-loyalty write primitives.")
    print("Reward RNG/charm/giri formula intentionally remains open.")

if __name__ == "__main__":
    main()
