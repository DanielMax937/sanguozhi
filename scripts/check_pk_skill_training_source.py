"""Bind the narrow S1 skill predicate to existing complete caller/helper bytes only."""
from copy import deepcopy
import hashlib
import json
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
IDB = 'c591cb40ce6d6be9246148002532dedc042463f36cd39c5ed300b7c449feefab'
COMMIT = '66e167e40c3440929ec016f3872aefc3486434c1'
PINS = {
    '0049DC60': (199, 'df2ecab2bee55d4a5bea0018acbb3894031747654552e53d3afd20815454989e'),
    '004890F0': (38, '28b915b82376fbebe6a95c983a5b1e9bb19d3fefb49a53a1a45312c4c0a5862f'),
}


def one(rows, **match):
    selected = [r for r in rows if all(r.get(k) == v for k, v in match.items())]
    assert len(selected) == 1, match
    return selected[0]


def check(profile, caller, helper, asm):
    assert profile['profileId'] == 's1-pk-skill-training-v1'
    assert profile['version'] == 'pk'
    assert profile['scope'] == 'already-selected-category-2-scalar-eligibility-only'
    assert profile['level'] == 'compatibility-reconstruction'
    assert profile['stockOriginalVerified'] is False and profile['originalExecutableExecuted'] is False
    assert profile['source'] == {
        'id': 'S1', 'repository': 'sjn4048/311MemoryResearch', 'commit': COMMIT,
        'url': 'https://github.com/sjn4048/311MemoryResearch/tree/' + COMMIT,
        'idbSha256': IDB, 'grade': 'idb-stored-byte-exact / mod-associated-stock-unverified',
        'callerManifest': 'docs/sources/training-lifecycle-source-profile.json',
        'helperManifest': 'docs/sources/capture-personnel-source-profile.json',
        'helperUse': 'standalone-scalar-evidence-only-no-capture-execution',
    }
    csource = one(caller['sourceProfiles'], id='S1')
    assert csource['idbSha256'] == IDB and csource['commit'] == COMMIT
    assert csource['repository'] == 'sjn4048/311MemoryResearch' and '血色5.0' in csource['inputPath']
    hsource = one(helper['sources'], source='S1')
    assert hsource['idbSha256'] == IDB and '血色5.0' in hsource['recordedInputPath']
    assert hsource['url'] == 'https://github.com/sjn4048/311MemoryResearch/blob/' + COMMIT + '/IDA%20Related/san11pk.zip'
    assert profile['constants'] == {'targetMin': 0, 'targetMax': 99}
    assert profile['domains'] == {
        'person.rawE8': [-2147483648, 2147483647],
        'trainingRecord.raw58': [-2147483648, 2147483647],
        'entryPrecondition': 'caller-already-passed-pointer-gates-and-selected-category-2',
        'nativeIdMapping': 'none-raw-scalars-not-guide-candidate-ids',
        'outOfRangeTarget': 'helper-false-caller-true-even-if-current-equals-target',
    }
    assert profile['evidence'] == {
        'category': ['0049DD05..0049DD08'], 'targetAndCall': ['0049DD0A..0049DD10'],
        'inversion': ['0049DD15..0049DD1D'], 'helperRange': ['004890F4..004890FB'],
        'helperEquality': ['004890FE..0048910E'], 'helperOutOfRange': ['00489111..00489113'],
    }
    assert profile['remainingOpen'] == [
        'complete research and cultivation command eligibility and execution',
        'aptitude getter chain and aptitude/skill completion writers',
        'AP, gold, duration, use counters, mission clearing and presentation',
        'native 98-record table mapping and original-data equivalence',
        'hidden-selection algorithm, weights and RNG',
        'full scheduler and engine/save/replay integration',
        'clean-stock PC-PK1.1, S2, Vanilla and console equivalence',
    ]
    crow = one(caller['functions'], start='0049DC60')
    hrow = one(helper['ranges'], source='S1', start='004890F0')
    assert crow['length'] == PINS['0049DC60'][0] and crow['sha256'] == PINS['0049DC60'][1]
    assert crow['disassembly'] == '0049DC60.asm.txt'
    assert hrow == {'source': 'S1', 'start': '004890F0', 'endExclusive': '00489116',
                    'sha256': PINS['004890F0'][1], 'file': 'S1-004890F0.asm.txt', 'kind': 'code'}
    blobs = {}
    for start, (length, digest) in PINS.items():
        assembled = bytearray(); cursor = int(start, 16)
        for line in asm[start].splitlines():
            match = re.fullmatch(r'([0-9A-F]{8})  ((?:[0-9a-f]{2} )*[0-9a-f]{2})\s+\S.*', line)
            assert match is not None and int(match[1], 16) == cursor
            part = bytes.fromhex(match[2]); assembled.extend(part); cursor += len(part)
        blob = bytes(assembled)
        assert len(blob) == length and hashlib.sha256(blob).hexdigest() == digest
        blobs[start] = blob
    assert bytes.fromhex(crow['bytesHex']) == blobs['0049DC60']

    def at(start, address, expected):
        offset = int(address, 16) - int(start, 16); raw = bytes.fromhex(expected)
        assert blobs[start][offset:offset + len(raw)] == raw, address

    # Actual category check, record+58 load, person ECX and relative call target.
    at('0049DC60', '0049DD05', '83 f8 02 75 aa')
    at('0049DC60', '0049DD0A', '8b 76 58 56 8b cf e8 db b3 fe ff')
    displacement = int.from_bytes(blobs['0049DC60'][0xb1:0xb5], 'little', signed=True)
    assert 0x0049DD15 + displacement == 0x004890F0
    # Pops interleaved with NEG/SBB/INC preserve the inversion's carry flag.
    at('0049DC60', '0049DD15', 'f7 d8 5b 1b c0 5f 40 5e c2 08 00')
    at('004890F0', '004890F0', '8b 44 24 04 85 c0 7c 19 83 f8 63 7f 14')
    at('004890F0', '004890FE', '8b b1 e8 00 00 00 33 d2 3b f0 0f 94 c2 5e 8b c2 c2 04 00')
    at('004890F0', '00489111', '33 c0 c2 04 00')


def main():
    profile = json.loads((ROOT / 'docs/sources/pk-skill-training-s1.json').read_text())
    caller = json.loads((ROOT / profile['source']['callerManifest']).read_text())
    helper = json.loads((ROOT / profile['source']['helperManifest']).read_text())
    asm = {
        '0049DC60': (ROOT / 'docs/sources/training-lifecycle-source-profile/0049DC60.asm.txt').read_text(),
        '004890F0': (ROOT / 'docs/sources/capture-personnel-source-profile/S1-004890F0.asm.txt').read_text(),
    }
    check(profile, caller, helper, asm)
    mutants = []
    for key, value in [('scope', 'full-command'), ('version', 'vanilla'), ('level', 'stock-opcode-exact'),
                       ('stockOriginalVerified', True), ('originalExecutableExecuted', True)]:
        p = deepcopy(profile); p[key] = value; mutants.append((key, p, caller, helper, asm))
    for key, value in [('id', 'S2'), ('idbSha256', 'wrong'), ('commit', 'wrong'),
                       ('helperUse', 'capture-execution')]:
        p = deepcopy(profile); p['source'][key] = value; mutants.append(('source-' + key, p, caller, helper, asm))
    for key in profile['constants']:
        p = deepcopy(profile); p['constants'][key] += 1; mutants.append((key, p, caller, helper, asm))
    for key in profile['domains']:
        p = deepcopy(profile); p['domains'][key] = None; mutants.append(('domain-' + key, p, caller, helper, asm))
    for key in profile['evidence']:
        p = deepcopy(profile); p['evidence'][key] = []; mutants.append(('evidence-' + key, p, caller, helper, asm))
    p = deepcopy(profile); p['remainingOpen'].pop(); mutants.append(('remaining-open', p, caller, helper, asm))
    c = deepcopy(caller); one(c['sourceProfiles'], id='S1')['idbSha256'] = 'wrong'; mutants.append(('caller-idb', profile, c, helper, asm))
    h = deepcopy(helper); one(h['sources'], source='S1')['idbSha256'] = 'wrong'; mutants.append(('helper-idb', profile, caller, h, asm))
    h = deepcopy(helper); one(h['ranges'], source='S1', start='004890F0')['source'] = 'S2'; mutants.append(('helper-cross-source', profile, caller, h, asm))
    c = deepcopy(caller); row = one(c['functions'], start='0049DC60'); row['bytesHex'] = '00' + row['bytesHex'][2:]
    mutants.append(('caller-manifest-bytes', profile, c, helper, asm))
    for start in PINS:
        a = dict(asm); a[start] = a[start].replace(start + '  ', '00000000  ', 1)
        mutants.append(('address-' + start, profile, caller, helper, a))
        a = dict(asm); lines = a[start].splitlines(); a[start] = '\n'.join(lines[:-1]) + '\n'
        mutants.append(('truncation-' + start, profile, caller, helper, a))
        a = dict(asm); a[start] = a[start].replace('  8b ', '  8a ', 1)
        mutants.append(('bytes-' + start, profile, caller, helper, a))
    a = dict(asm); a['004890F0'] = (ROOT / 'docs/sources/capture-personnel-source-profile/S2-004890F0.asm.txt').read_text()
    mutants.append(('actual-S2-helper', profile, caller, helper, a))
    for name, *mutant in mutants:
        check(profile, caller, helper, asm)  # unchanged positive control for each negative
        try:
            check(*mutant)
        except AssertionError:
            pass
        else:
            raise AssertionError('Source mutation survived: ' + name)
    print(f'PASS: S1 caller199/helper38 full-byte hashes and continuous addresses; 6 opcode sequences; {len(mutants)} source/profile mutants killed with controls')
    print('Scalar category-2 eligibility only; no native execution, capture/P0-78, writer or stock claim.')


if __name__ == '__main__':
    main()
