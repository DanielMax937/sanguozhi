"""Check E3 reference data, not the original game executable.

Run: python scripts/check_unit_panels.py
Uses rational constants and final floor as an explicit compatibility profile.
This does not emulate x87 or prove the behavior of 00707A74.
"""
from __future__ import annotations
import json
from fractions import Fraction
from pathlib import Path
from typing import Any


def require(condition: bool, message: str) -> None:
    if not condition:
        raise ValueError(message)


def panel(data: dict[str, Any], args: list[Any]) -> list[int]:
    require(len(args) == 8, 'Expected eight input fields')
    gear, war, lead, pol, aptitude, elite, transport, status = args
    require(type(gear) is int and 0 <= gear < 12, 'Invalid equipment ID')
    require(all(type(x) is int and 1 <= x <= 100 for x in (war, lead, pol)), 'Attributes must be 1..100')
    require(type(aptitude) is int and 0 <= aptitude <= 3, 'Invalid aptitude')
    require(type(elite) is bool and type(transport) is bool, 'Flags must be booleans')
    require(type(status) is int and status in (0, 1, 2), 'Unsupported status')
    row = data['equipment'][gear]
    p = data['parameters']
    ratio = lambda key: Fraction(*p[key])
    inc = p['eliteBaseIncrement'] if elite and row['eliteTechId'] is not None else 0
    a = Fraction(p['aptitudeNumerators'][aptitude], p['aptitudeDenominator'])
    if gear == 0:
        a = ratio('swordAptitude')
    elif gear == 9 and transport:
        a = ratio('transportSmallBoatAptitude')
    state = ratio('confusedMultiplier') if status == 1 else Fraction(1)
    atk_type = ratio('transportAttackMultiplier') if transport else Fraction(1)
    def_type = ratio('transportDefenseConstructionMultiplier') if transport else Fraction(1)
    values = [Fraction(war * (row['baseAttack'] + inc), 100) * a * atk_type * state,
              Fraction(lead * (row['baseDefense'] + inc), 100) * a * def_type * state,
              (pol * ratio('constructionPoliticsMultiplier') + p['constructionOffset']) * def_type * state]
    return [max(p['minimumPanel'], x.numerator // x.denominator) for x in values]


def main() -> None:
    path = Path(__file__).resolve().parents[1] / 'docs/sources/unit-panels.json'
    data = json.loads(path.read_text(encoding='utf8'))
    rows = data['equipment']
    require(len(rows) == 12 and [r['id'] for r in rows] == list(range(12)), 'Expected IDs 0..11 exactly once')
    require([r['id'] for r in rows if r['eliteTechId'] is not None] == [1, 2, 3, 4], 'Elite scope mismatch')
    require(len({v['id'] for v in data['vectors']}) == len(data['vectors']), 'Duplicate vector ID')
    for v in data['vectors']:
        actual = panel(data, v['input'])
        require(actual == v['expected'], f"{v['id']}: {actual} != {v['expected']}")
    comparisons = 0
    for gear in range(12):
        for stat in range(1, 101):
            for aptitude in range(4):
                normal = panel(data, [gear, stat, stat, stat, aptitude, False, False, 0])
                elite = panel(data, [gear, stat, stat, stat, aptitude, True, False, 0])
                confused = panel(data, [gear, stat, stat, stat, aptitude, False, False, 1])
                require(all(b >= a for a, b in zip(normal, elite)), 'Elite lowered a panel')
                require(all(b <= a for a, b in zip(normal, confused)), 'Confusion increased a panel')
                if gear not in (1, 2, 3, 4):
                    require(elite == normal, 'Elite leaked into an ineligible equipment type')
                comparisons += 1
    require(panel(data, [4, 100, 100, 75, 3, True, False, 0])[0] == 115, 'Panel incorrectly clamped at 100')
    require(panel(data, [0, 99, 99, 75, 3, False, True, 0])[0] == 14, 'Transport precision regression')
    invalid = [12, 100, 100, 75, 3, False, False, 0]
    try:
        panel(data, invalid)
    except ValueError:
        pass
    else:
        raise ValueError('Invalid input was accepted')
    print(f"PASS: {len(rows)} equipment rows, {len(data['vectors'])} reference vectors, {comparisons} parameter combinations")
    print('Reference arithmetic only; original executable/FPU behavior was not tested.')


if __name__ == '__main__':
    main()
