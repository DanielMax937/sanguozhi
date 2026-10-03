"""P0-13 supply/transport boundary validation."""
import json
from pathlib import Path

def weighted_morale_floor(old_troops, old_morale, add_troops, incoming_morale):
    total = old_troops + add_troops
    if total <= 0:
        return old_morale
    return (
        old_troops * old_morale
        + add_troops * incoming_morale
    ) // total

def clip_transfer(current, limit, incoming):
    room = max(limit-current, 0)
    accepted = min(room, incoming)
    return accepted, incoming-accepted

def main():
    root=Path(__file__).resolve().parents[1]
    d=json.loads(
      (root/"docs/sources/supply-transport-finalizer-exactness.json")
      .read_text(encoding="utf-8")
    )

    assert d["status"]["audit"]=="complete"
    assert d["transportArrival"]["containingFunction"]["start"]=="004BF1F0"
    assert d["transportArrival"]["containingFunction"]["rewardAddress"]=="004BF522"
    assert d["transportArrival"]["merit"]==200
    assert d["transportArrival"]["overflow"]["behavior"]=="discard with warning"

    assert d["wildSupply"]["modes"]["manual"]["slider"] is True
    assert d["wildSupply"]["modes"]["automatic"]["fillTowardTargetCaps"] is True
    assert d["wildSupply"]["targetTransportAllowed"] is False
    assert d["wildSupply"]["quantityEquipmentIds"]==[1,2,3,4]

    assert weighted_morale_floor(2500,0,2500,100)==50
    # Compatibility result only; exact non-divisible rounding remains open.
    assert weighted_morale_floor(1000,0,500,100)==33
    assert d["moraleMerge"]["nonDivisibleRounding"]=="open"

    assert clip_transfer(9000,10000,2000)==(1000,1000)
    assert clip_transfer(10000,10000,500)==(0,500)

    assert d["rewards"]["fieldSupplyMerit"]==100
    assert d["rewards"]["fieldSupplyLeaderLeadershipExp"]==2

    print("PASS: P0-13 supply/transport boundary model")
    print("Arrival containing function/caps resolved; field finalizer and morale rounding remain open.")

if __name__=="__main__":
    main()
