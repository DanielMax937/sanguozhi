"""P0-12 food overlap/starvation boundary validation."""
import json
import struct
from pathlib import Path

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

    print("PASS: P0-12 food overlap/starvation boundaries")
    print("Multiplier bits/non-stacking exact; overlap winner and starvation formula remain open.")

if __name__ == "__main__":
    main()
