"""E14 pinned modern translated-reference checks; not a native-game oracle."""
import json
from pathlib import Path


def trunc_div(a: int, b: int) -> int:
    assert b != 0
    sign = -1 if (a < 0) ^ (b < 0) else 1
    return sign * (abs(a) // abs(b))


def duel_score(self_str: int, other_str: int) -> int:
    hi = max(self_str, other_str)
    lo = min(self_str, other_str)

    curve = trunc_div(max(hi - 5, 0) ** 2, 1500)
    decade_gap = max(trunc_div(hi, 10) - trunc_div(lo, 10), 1)

    x = self_str - lo
    c = max(x + decade_gap - curve - 1, 0) * decade_gap

    y = min(x, curve)
    z = y + decade_gap - curve

    d = y * (curve - y)
    d += trunc_div(y * (y + 1), 2)
    d += trunc_div(max(z, 0) * max(z - 1, 0), 2)

    return 180 + c + d


def action_ratio(a: int, b: int) -> int:
    aa = duel_score(a, b) ** 2
    bb = duel_score(b, a) ** 2
    total = aa + bb
    if aa >= bb:
        return min(trunc_div(aa * 100, total), 99)
    return 100 - min(trunc_div(bb * 100, total), 99)


STANCE = {
    "attack": {"attack": 16, "attackSub": 3},
    "defense": {"attack": 14, "attackSub": 2},
    "spirit": {"attack": 14, "attackSub": 3},
}


def ordinary_damage(a: int, b: int, stance: str) -> int:
    ratio = action_ratio(a, b)
    s = STANCE[stance]
    n = trunc_div(s["attack"] * ratio, 50)
    n = trunc_div(n * s["attackSub"] * 7, 27)
    return max(n, 3)


def dodge_chance(defender: int, attacker: int, defense_stance: bool = False) -> int:
    n = 10 + trunc_div(defender - attacker, 3)
    n = min(max(n, 5), 30)
    if defense_stance:
        n += 25
    return n



SPIRIT_COEFFICIENTS = {"attack": 4, "defense": 8, "spirit": 10, "fury": 7}


def reference_result_inputs(
    n: int, defender_stance: str, result: str, invulnerable: bool = False
) -> tuple[int, int, int]:
    """CalcDamage 2630–2676 only: (HP, attacker raw, defender raw).

    Regression domain: already-resolved integer n in 0..13, four stances,
    hit/block/dodge, and an explicit invulnerable flag. No action selection,
    modifiers, hooks, RNG, state writes, or native-game equivalence is modeled.
    Values below the ordinary base minimum are synthetic branch boundaries.
    """
    if type(n) is not int or not 0 <= n <= 13:
        raise ValueError("reference n must be an integer in 0..13")
    if type(defender_stance) is not str or defender_stance not in SPIRIT_COEFFICIENTS:
        raise ValueError("unknown reference stance")
    if type(result) is not str or result not in ("hit", "block", "dodge"):
        raise ValueError("unknown reference result")
    if type(invulnerable) is not bool:
        raise ValueError("invulnerable must be boolean")
    defensive = defender_stance in ("defense", "spirit")
    # This early return is independent of the ordinary result, including block.
    if invulnerable:
        return (0, 0, max(trunc_div(n, 2), 1) if defensive else 0)
    if result == "block":
        hp = (max(trunc_div(n * 3, 10), 1) if defender_stance == "defense"
              else trunc_div(n, 2))
        return (hp, trunc_div(n * 3, 4), max(trunc_div(n, 2), 1))
    if result == "dodge":
        if defender_stance == "defense":
            return (0, 0, n)
        return (0, 0, max(trunc_div(n, 2), 1) if defensive else 0)
    return (n, n, n)


def reference_requested_gain(value: int, stance: str, *, attack: bool) -> int:
    """CalcSpiritGain subset: HP100 / source Normal / no sword only.

    Raw integer value is limited to regression domain 0..13. attack=False is
    the defender role even on dodge/invulnerability, not an assertion of a hit.
    Returns requested gain before cap/writer, never an actual state delta.
    """
    if type(value) is not int or not 0 <= value <= 13:
        raise ValueError("reference raw spirit must be an integer in 0..13")
    if type(stance) is not str or stance not in SPIRIT_COEFFICIENTS:
        raise ValueError("unknown reference stance")
    if type(attack) is not bool:
        raise ValueError("attack must be boolean")
    if value <= 0:
        return 0
    minimum = 5 if not attack and stance in ("defense", "spirit") else 3
    n = trunc_div(max(value, minimum) * SPIRIT_COEFFICIENTS[stance], 7)
    if not attack:
        n = trunc_div(n * 5, 4)
    return max(n, 1)


def assert_literal(actual: object, expected: object) -> None:
    """Type-exact local JSON pin check, not upstream source revalidation."""
    assert type(actual) is type(expected), (actual, expected)
    if isinstance(expected, dict):
        assert actual.keys() == expected.keys()
        for key, value in expected.items():
            assert_literal(actual[key], value)
    elif isinstance(expected, list):
        assert len(actual) == len(expected)
        for left, right in zip(actual, expected):
            assert_literal(left, right)
    else:
        assert actual == expected, (actual, expected)


def check_result_spirit_reference() -> None:
    # Literal expected tuples and gains are derived from the pinned C# source;
    # they are not independently measured native fixtures.
    n = ordinary_damage(100, 100, "attack")
    expected = {
        "attack": {"hit": ((12, 12, 12), (6, 7)),
                   "block": ((6, 9, 6), (5, 3)),
                   "dodge": ((0, 0, 0), (0, 0))},
        "defense": {"hit": ((12, 12, 12), (6, 16)),
                    "block": ((3, 9, 6), (5, 7)),
                    "dodge": ((0, 0, 12), (0, 16))},
        "spirit": {"hit": ((12, 12, 12), (6, 21)),
                   "block": ((6, 9, 6), (5, 10)),
                   "dodge": ((0, 0, 6), (0, 10))},
        "fury": {"hit": ((12, 12, 12), (6, 15)),
                 "block": ((6, 9, 6), (5, 7)),
                 "dodge": ((0, 0, 0), (0, 0))},
    }
    invulnerable_expected = {
        "attack": ((0, 0, 0), (0, 0)),
        "defense": ((0, 0, 6), (0, 7)),
        "spirit": ((0, 0, 6), (0, 10)),
        "fury": ((0, 0, 0), (0, 0)),
    }
    for stance, results in expected.items():
        for result, (raw, gains) in results.items():
            assert reference_result_inputs(n, stance, result) == raw
            assert (reference_requested_gain(raw[1], "attack", attack=True),
                    reference_requested_gain(raw[2], stance, attack=False)) == gains
            # Real CalcActionResult returns Blocked for invulnerability. Passing
            # all results here tests only CalcDamage's independent early-return priority.
            inv_raw, inv_gains = invulnerable_expected[stance]
            assert reference_result_inputs(n, stance, result, True) == inv_raw
            assert (reference_requested_gain(inv_raw[1], "attack", attack=True),
                    reference_requested_gain(inv_raw[2], stance, attack=False)) == inv_gains
        for attack in (True, False):
            assert reference_requested_gain(0, stance, attack=attack) == 0
    assert reference_result_inputs(13, "defense", "dodge") == (0, 0, 13)
    assert reference_result_inputs(13, "spirit", "dodge") == (0, 0, 6)
    assert reference_result_inputs(1, "spirit", "dodge") == (0, 0, 1)
    for stance in ("defense", "spirit"):
        for result in ("hit", "block", "dodge"):
            assert reference_result_inputs(1, stance, result, True) == (0, 0, 1)
    assert reference_requested_gain(1, "defense", attack=False) == 6
    assert reference_requested_gain(1, "spirit", attack=False) == 8


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    d = json.loads(
        (root / "docs/sources/duel-continuous-core.json")
        .read_text(encoding="utf-8")
    )

    assert action_ratio(1, 1) == 50
    assert action_ratio(80, 80) == 50
    assert action_ratio(100, 100) == 50

    assert action_ratio(100, 95) == 55
    assert action_ratio(80, 75) == 52
    assert action_ratio(100, 80) == 62
    assert action_ratio(80, 60) == 60

    assert ordinary_damage(100, 100, "attack") == 12
    assert ordinary_damage(100, 100, "defense") == 7
    assert ordinary_damage(100, 100, "spirit") == 10

    # Same martial difference, different absolute band -> different output.
    assert ordinary_damage(100, 95, "attack") == 13
    assert ordinary_damage(80, 75, "attack") == 12

    assert 12 // 2 == 6
    assert max(12 * 3 // 10, 1) == 3
    assert 12 * 3 // 4 == 9
    assert 9 // 2 == 4
    assert max(9 * 3 // 10, 1) == 2

    assert 50 * 20 // 55 == 18
    assert (50 * 20 // 55) * 6 // 5 == 21
    assert (50 * 20 // 55) * 3 == 54
    assert (50 * 20 // 55) * 3 // 2 == 27

    assert dodge_chance(100, 95) == 11
    assert dodge_chance(75, 80) == 9  # C/C# truncation: -5/3 -> -1
    assert dodge_chance(100, 95, True) == 36

    # Literal manifest checks only: no network fetch or upstream rehash occurs.
    assert_literal(d["schemaVersion"], 1)
    assert_literal(d["audit"], "E14")
    assert_literal(d["evidenceLevel"], "translated-source-reference")
    assert_literal(d["target"],
                   "pinned modern translated-source duel reference; native PC-PK/PK1.1 unverified")
    source = d["provenance"]["translatedCore"]
    for key, expected in {
        "repository": "tankyc/sango_infinity",
        "path": "Project/Assets/Sango/Scripts/Game/Duel/Duel.cs",
        "commit": "a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef",
        "gitBlobSha1": "d0e825097067c58c95c37e067d1c2a2688a74898",
        "utf8Bytes": 142829,
        "sha256": "4c72e962a9b5dc07ae6bb26285c1e165a511c8c66d5b669520fd1d5b78e3ef07",
        "url": "https://github.com/tankyc/sango_infinity/blob/"
               "a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Duel/Duel.cs",
        "byteDefinition": "Complete saved connector content encoded as UTF-8 with LF; "
                          "no newline or whitespace normalization",
        "lineAttribution": {
            "stanceCoefficients": [276, 279], "calcAttackDamage": [1794, 1805],
            "calcSpiritGain": [2271, 2323], "calcDamage": [2573, 2677],
            "rawSpiritInitialization": [2630, 2631], "invulnerableBranch": [2645, 2652],
            "blockBranch": [2657, 2664], "dodgeBranch": [2665, 2673],
            "invulnerableActionResult": [2719, 2720], "rawSpiritToRequestedGain": [2790, 2801],
        },
    }.items():
        assert_literal(source[key], expected)
    assert_literal(d["sources"][0], source["url"])
    assert_literal(d["versionBoundary"], {
        "pcPkGenericCore": "translated-source-reference",
        "pcPk11NativeEquivalence": "unverified", "vanilla": "unverified",
        "console": "open", "originalUnresolvedGroups": 43,
    })
    assert_literal(d["provenance"]["directAddressCorroboration"]["addresses"],
                   ["005097C3", "005097EB"])
    assert_literal(d["ordinaryDamage"]["equalStrength"],
                   {"attack": 12, "defense": 7, "spirit": 10})
    assert_literal(d["spiritGain"]["swordMultiplier"], "*3/2")
    assert_literal(d["spiritGain"]["stanceCoefficients"], SPIRIT_COEFFICIENTS)
    for stance, coefficient in SPIRIT_COEFFICIENTS.items():
        assert_literal(d["stances"][stance]["spiritGain"], coefficient)
    assert_literal(d["spiritGain"]["zeroBeforeMinimum"],
                   "value<=0 returns 0 before any positive minimum")
    assert_literal(d["spiritGain"]["resultBranch"], {
        "n": "already-resolved pre-result damage; ordinary action after modifiers "
             "and identity person hook in regression anchors",
        "outputTuple": ["hpDamage", "attackerRawSpirit", "defenderRawSpirit"],
        "priority": ["invulnerable", "ordinary result"], "hit": "(n,n,n)",
        "block": "(defense ? max(trunc(n*3/10),1) : trunc(n/2), "
                 "trunc(n*3/4), max(trunc(n/2),1))",
        "dodgeDefense": "(0,0,n)", "dodgeSpirit": "(0,0,max(trunc(n/2),1))",
        "dodgeAttackOrFury": "(0,0,0)",
        "invulnerableDefenseOrSpirit": "(0,0,max(trunc(n/2),1))",
        "invulnerableAttackOrFury": "(0,0,0)",
    })
    check_result_spirit_reference()

    print("PASS: E14 pinned translated-reference arithmetic anchors and "
          "dodge/invulnerable spirit branch regressions")
    print("Manifest literals checked only; upstream source was not revalidated.")
    print("No native game equivalence, full hit-resolution coverage, engine integration, "
          "or original43 closure is established.")


if __name__ == "__main__":
    main()
