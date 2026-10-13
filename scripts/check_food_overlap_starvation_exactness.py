"""P0-12 food overlap/starvation boundary validation."""
import json
import hashlib
import re
import struct
from pathlib import Path
from urllib.parse import quote

def f32_from_bits(bits: int) -> float:
    return struct.unpack("<f", struct.pack("<I", bits))[0]

MULTIPLIERS = {
    "none": f32_from_bits(0x40000000),
    "camp": f32_from_bits(0x3FD55555),
    "fort": f32_from_bits(0x3FAAAAAB),
    "fortress": f32_from_bits(0x3F800000),
}
FOOD_SCALE = f32_from_bits(0x3D4CCCCD)

def normal_food_cost(troops: int, kind: str) -> int:
    return int(troops * MULTIPLIERS[kind] * FOOD_SCALE)

def check_facility_siege_troop_loss(d: dict) -> dict:
    """Bind the naming correction to the complete listing; execute no game code."""
    assert d["functions"]["facilitySiegeTroopLossCaller"] == "00599AA0"
    assert "besiegedStarvedStrategicPointPopulationLoss" not in d["functions"]
    e = d["facilitySiegeTroopLoss"]
    expected_boundary = {
        "address": "00599AA0",
        "meaning": "facility-siege-troop-strength-loss-caller",
        "evidenceLevel": "source-listing-reconstruction",
        "historicalSireLabel": "ReducePopForStarvedBesiegedSP",
        "historicalLabelPolicy": "preserve-source-label-reject-starved-population-interpretation",
        "explicitFoodZeroGateInCaller": False,
        "foodZeroGateInside004B99B0": "open",
        "allVersionsLackFoodZeroGate": "not-established",
        "independentPopulationWriterEstablished": False,
        "isFieldTroopStarvationHandler": False,
        "cleanStockIdentity": "open",
        "arithmeticBehaviorChanged": False,
    }
    for key, value in expected_boundary.items():
        assert type(e[key]) is type(value) and e[key] == value, key
    assert "误译" in e["correction"] and "设施兵力" in e["correction"]

    source = e["source"]
    assert source["repository"] == "sjn4048/311MemoryResearch"
    assert source["commit"] == "66e167e40c3440929ec016f3872aefc3486434c1"
    assert source["path"] == "内存资料/整理/Func-自动04-兵临城下逃兵处理.txt"
    assert source["url"] == (
        f'https://github.com/{source["repository"]}/blob/'
        f'{source["commit"]}/{quote(source["path"], safe="/")}'
    )
    assert source["encoding"] == "GBK"
    text = source["textUtf8"]
    original = text.encode("gbk")
    assert original.decode("gbk") == text
    assert len(original) == source["byteLength"] == 5773
    assert hashlib.sha256(original).hexdigest() == source["sha256"] == (
        "5ab2acbcbea6d0a1cddc7c9eb3d1199fff7374332c894174cdb59fabbd98df6b"
    )
    assert hashlib.sha256(text.encode("utf-8")).hexdigest() == source["utf8Sha256"] == (
        "83e6707c512db7bf9a91d440b97ed4d39da81dea2ca9e2c1db494d82249ddf7b"
    )
    blob = f"blob {len(original)}\0".encode("ascii") + original
    assert hashlib.sha1(blob).hexdigest() == source["gitBlobSha1"] == (
        "3b6c61f221951851d7125aa4b3ca19f910e864aa"
    )

    caller = e["caller"]
    assert caller["start"] == "00599AA0"
    assert caller["endExclusive"] == "00599B8A"
    rows = [
        (int(address, 16), bytes.fromhex(raw))
        for address, raw in re.findall(
            r"^([0-9A-F]{8}) - ([0-9a-f ]+?) + -", text, re.MULTILINE
        )
    ]
    assert len(rows) == caller["instructionCount"] == 85
    cursor = int(caller["start"], 16)
    body = bytearray()
    for address, raw in rows:
        assert address == cursor and raw
        body.extend(raw)
        cursor += len(raw)
    assert cursor == int(caller["endExclusive"], 16)
    assert len(body) == caller["byteLength"] == 234
    assert hashlib.sha256(body).hexdigest() == caller["sha256"] == (
        "6fba1cdb6ac06777a6057f35a6863840fc82370a96af69710a6169c93fbde31e"
    )
    instructions = dict(rows)
    direct_calls = {
        f"{address:08X}": f"{address + 5 + int.from_bytes(raw[1:], 'little', signed=True):08X}"
        for address, raw in rows if raw[0] == 0xE8
    }
    assert direct_calls == {
        "00599AB6": "00490D00", "00599ABE": "0047A630",
        "00599AF9": "004B99B0", "00599B0E": "00472150",
        "00599B3A": "00707A74", "00599B4A": "004AE3C0",
        "00599B57": "00588B50", "00599B6B": "004875C0",
    }
    virtual_calls = {
        f"{address:08X}": raw.hex() for address, raw in rows if raw[0] == 0xFF
    }
    assert virtual_calls == {
        "00599AD2": "ff5040", "00599AEA": "ff5250", "00599B60": "ff5250",
    }
    # Lock the full caller's explicit gates and facility-strength read/write sites.
    # Unknown callees may have additional conditions; no inference about their bodies.
    for address, raw in {
        "00599AC6": "85c0", "00599AC8": "0f84a2000000",
        "00599AD5": "85c0", "00599AD7": "0f8c93000000",
        "00599ADD": "83f82e", "00599AE0": "0f8f8a000000",
        "00599AED": "8bd8", "00599AEF": "85db", "00599AF1": "7e7d",
        "00599AFE": "85c0", "00599B00": "746e",
        "00599B1D": "c1fa05", "00599B63": "85c0", "00599B65": "7f09",
        "00599B67": "6a00", "00599B75": "83f857", "00599B7C": "0f8c2effffff",
    }.items():
        assert instructions[int(address, 16)].hex() == raw, address
    assert caller["facilityIdsInclusive"] == [0, 86]
    assert caller["explicitGates"] == [
        "00490D00 resolves facility; 0047A630 result nonzero",
        "virtual+0x40 owner signed in 0..46",
        "virtual+0x50 facility troop strength signed > 0",
        "004B99B0 result nonzero",
    ]
    assert caller["strengthGetterCallSites"] == ["00599AEA", "00599B60"]
    assert caller["strengthWriterCallSite"] == "00599B4A"
    assert caller["strengthWriter"] == "004AE3C0"
    assert caller["zeroMoraleCallSite"] == "00599B6B"
    assert caller["zeroMoraleWriter"] == "004875C0"
    assert caller["instructionTextCorrection"] == (
        "00599B1D c1 fa 05 = SAR EDX,5; source mnemonic SAR DL,05 is a typo"
    )
    assert caller["inlineModificationAdviceApplied"] is False
    assert e["open"] == [
        "004B99B0 full body and all internal conditions",
        "0084B0A0 original constant bytes",
        "same-source x87 environment and 00707A74 conversion contract",
        "same-source RNG range/distribution/sequence",
        "full helper and actual strength/morale writer semantics",
        "clean stock and cross-version identity",
    ]
    return expected_boundary

def main() -> None:
    root = Path(__file__).resolve().parents[1]
    d = json.loads(
        (root / "docs/sources/food-overlap-starvation-exactness.json")
        .read_text(encoding="utf-8")
    )
    assert d["status"]["audit"] == "complete"
    assert d["selector"]["returnsSingleType"] is True
    assert d["selector"]["multiplierStacking"] is False
    assert d["selector"]["overlapWinner"] == "open"

    assert MULTIPLIERS["none"] == 2.0
    assert MULTIPLIERS["camp"] == 1.6666666269302368
    assert MULTIPLIERS["fort"] == 1.3333333730697632
    assert MULTIPLIERS["fortress"] == 1.0
    assert FOOD_SCALE == 0.05000000074505806

    for kind, expected in {"none":1000,"camp":833,"fort":666,"fortress":500}.items():
        assert normal_food_cost(10_000, kind) == expected
    for kind, expected in {"none":1800,"camp":1499,"fort":1200,"fortress":900}.items():
        assert normal_food_cost(18_000, kind) == expected

    assert d["scheduler"]["troopStrengthReductionIn0059BF40"] is False
    assert d["starvation"]["exactFunction"] == "open"
    assert d["starvation"]["legacyRetentionEvidence"] == "provenance-unresolved"
    assert d["starvation"]["legacyRetentionPolicy"] == "legacy-compatibility-only"

    check_facility_siege_troop_loss(d)

    print("PASS: P0-12 food overlap/starvation boundaries")
    print("Multiplier bits/non-stacking exact; overlap winner and starvation formula remain open.")
    print("00599AA0 naming correction bound to 85 instructions/234 source bytes; helper/stock remain open.")

if __name__ == "__main__":
    main()
