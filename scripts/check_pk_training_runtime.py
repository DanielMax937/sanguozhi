"""Check newly normalized runtime constants against existing main references.

Reference arithmetic/data validation only; not a stock San11PK.exe regression.
"""
from __future__ import annotations
import json
from pathlib import Path
from check_training_morale import training_base_gain, actual_gain, technique_points

ROOT = Path(__file__).resolve().parents[1]
BASELINE = '5c5611bb067c0dfe13cea1126ad69a12dade697c'


def main() -> None:
    data = json.loads((ROOT / 'docs/sources/pk-training-runtime.json').read_text())
    rules = data['rules']
    assert data['baseline']['commit'] == BASELINE
    levels = set(data['evidenceLevels'])
    assert levels == {'opcode-exact', 'address-level', 'reverse-engineered-partial',
                      'empirical-high', 'documented-guide', 'compatibility-assumption',
                      'compatibility-reconstruction', 'provisional-engine-rule', 'open'}
    for key, rule in rules.items():
        assert rule['id'] == key and rule['level'] in levels
        assert rule['originalEvidence'] and rule['note']
        source = rule['source']
        assert (ROOT / source['path']).is_file()
        if source['commit'] is not None:
            assert source['commit'] == BASELINE
            assert BASELINE in source['url']
        else:
            assert source['introducedWith'] in {'pk-training-slice-v1', 'pk-training-lifecycle-v2'}
            assert source['url'] is None  # do not invent a main URL for this new guide
    f = rules['train.formula']['value']
    drill = rules['train.drill']['value']
    tp = rules['train.tp']['value']
    count = 0
    for wars in ([0], [100], [80, 60, 40], [100, 100, 100]):
        for troops in (0, 1, 1999, 2000, 2001, 5000, 10000, 50000, 100000, 150000):
            for boosted in (False, True):
                denominator = min(f['denominatorCap'], f['denominatorBase'] + troops // f['troopsDivisor'])
                gain = (sum(wars) + max(wars)) // denominator + f['flatGain']
                if boosted:
                    gain = gain * drill['numerator'] // drill['denominator']
                assert gain == training_base_gain(list(wars), troops, boosted)
                for current, cap in ((0, 100), (95, 100), (100, 120), (119, 120)):
                    delta = min(gain, max(0, cap - current))
                    assert delta == actual_gain(list(wars), troops, boosted, current, cap)
                    assert delta // tp['divisor'] + tp['flat'] == technique_points(delta)
                count += 1
    tech = json.loads((ROOT / 'docs/sources/techniques.json').read_text())
    cap = rules['train.moraleCap']['value']
    row = next(r for r in tech['techniques'] if r['id'] == cap['techniqueId'])
    assert row['name'] == '熟练兵'
    assert row['effect']['moraleCap'] == cap['trainedSoldiers'] == 120
    assert row['effect']['baseMoraleCap'] == cap['ordinary'] == 100
    assert tech['techniquePointCap'] == rules['resource.tpCap']['value'] == 10000
    assert rules['resource.meritCap']['value'] == 60000
    assert rules['train.ap']['value'] == {'ordinary': 20, 'militaryOffice': 10, 'gold': 0}
    assert rules['train.rewards']['value'] == {'warXp': 2, 'merit': 50}
    assert rules['ap.recovery']['level'] == 'empirical-high'
    assert rules['engine.presentationOmitted']['level'] == 'provisional-engine-rule'
    assert rules['train.gateOpen']['level'] == 'open'
    assert rules['engine.version']['value']['supported'] == 'pk'
    assert rules['engine.progression']['value']['conversionThreshold'] == 100
    assert rules['engine.progression']['value']['experienceCap'] == 3000
    assert rules['engine.progression']['level'] == 'compatibility-reconstruction'
    assert data['profileId'] == 'pk-training-lifecycle-v2'
    assert data['lifecycleBaseline']['commit'] == '56f1aa4ad9cf2bff5612b1777e16dc54be0cdefb'
    print(f'PASS: {len(rules)} provenance/evidence records, {count} formula vectors and existing technique data')
    print('New runtime normalization, not original executable certification; source gate/reset recovered separately; stock equivalence, full scheduler and Vanilla stay open.')


if __name__ == '__main__':
    main()
