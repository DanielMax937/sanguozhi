"""Bind the S1 stat-training core to actual byte sequences, never execute game code."""
from copy import deepcopy
import hashlib
import json
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
PINS = {
    '0049DC60': (199, 'df2ecab2bee55d4a5bea0018acbb3894031747654552e53d3afd20815454989e'),
    '005D91A0': (642, '03bd98a0a4fc5a8c3d9798c93f788329d3d67e696e683c798cb8f3a401bb7edd'),
    '004A55A0': (90, '7d29bdddc0bbf99619e74336c5d707b258d0b6a122533d3fcb77575ce076f7c1'),
    '0048A810': (67, '4b7d3043c82cce5110c5a24ae9908d18a06874e5ca696171a7f8cf29aaf0bcaa'),
    '0048A390': (191, '9d6571c2cb96db26a7ed36162e89de16343e4e130422d462ddfd46fa4427c640'),
}


def check(profile, manifest, disassemblies):
    assert profile['profileId'] == 's1-pk-stat-training-v1'
    assert profile['version'] == 'pk'
    assert profile['scope'] == 'stat-branch-numeric-qualification-and-completion-only'
    assert profile['level'] == 'compatibility-reconstruction'
    assert profile['stockOriginalVerified'] is False
    assert profile['originalExecutableExecuted'] is False
    assert profile['source']['id'] == 'S1'
    assert profile['source']['repository'] == 'sjn4048/311MemoryResearch'
    assert profile['source']['commit'] == '66e167e40c3440929ec016f3872aefc3486434c1'
    assert profile['source']['idbSha256'] == 'c591cb40ce6d6be9246148002532dedc042463f36cd39c5ed300b7c449feefab'
    assert profile['source']['grade'] == 'idb-stored-byte-exact / mod-associated-stock-unverified'
    assert profile['source']['manifest'] == 'docs/sources/training-lifecycle-source-profile.json'
    assert profile['source']['url'] == 'https://github.com/sjn4048/311MemoryResearch/tree/' + profile['source']['commit']
    assert manifest['sourceProfiles'][0]['idbSha256'] == profile['source']['idbSha256']
    assert '血色5.0' in manifest['sourceProfiles'][0]['inputPath']
    assert profile['attributes'] == ['leadership', 'war', 'intelligence', 'politics', 'charisma']
    assert profile['constants'] == {'startXpExclusive': 2000, 'pointsPerCompletion': 5,
                                  'xpPerPoint': 100, 'xpCap': 3000, 'growthMin': 1, 'growthMax': 100}
    assert profile['domains'] == {
        'xp': [0, 3000], 'target': [1, 100], 'resolved-native-growth': [1, 100],
        'ordinary-no-age-talent': [0, 100], 'ordinaryExcludesNativePersonIds': [700, 799],
        'negativeCompletionDelta': 'explicitly-rejected-not-clamped-to-zero',
        'resolvedGrowthAfter': 'unknown-null-until-native-getter-resolved-again',
    }
    assert profile['evidence'] == {
        'qualification': ['0049DCAE..0049DCB4', '0049DCBF..0049DCD3'],
        'completion': ['005D9283..005D9297', '005D929E..005D92CA'],
        'writer': ['004A55CF', '0048A838..0048A84B'],
        'getter': ['0048A3BB..0048A3FC', '0048A405..0048A44F'],
    }
    assert profile['remainingOpen'] == [
        'complete research and cultivation command eligibility and execution',
        'AP, gold, duration, use counters, mission clearing and presentation',
        'native 98-record table mapping and original-data equivalence',
        'hidden-selection algorithm, weights and RNG',
        'age/special-person getter implementation and negative-delta raw-word behavior',
        'full scheduler and engine/save/replay integration',
        'clean-stock PC-PK1.1, S2, Vanilla and console equivalence',
    ]
    rows = {r['start']: r for r in manifest['functions']}
    blobs = {}
    for start, (length, digest) in PINS.items():
        row = rows[start]
        assert row['length'] == length and row['sha256'] == digest
        blob = bytes.fromhex(row['bytesHex'])
        assert len(blob) == length and hashlib.sha256(blob).hexdigest() == digest
        assembled = bytearray()
        cursor = int(start, 16)
        for line in disassemblies[start].splitlines():
            match = re.fullmatch(r'([0-9A-F]{8})  ((?:[0-9a-f]{2} )*[0-9a-f]{2})\s+\S.*', line)
            assert match is not None and int(match[1], 16) == cursor
            part = bytes.fromhex(match[2]); assembled.extend(part); cursor += len(part)
        assert bytes(assembled) == blob
        blobs[start] = blob

    def at(start, address, expected):
        offset = int(address, 16) - int(start, 16)
        raw = bytes.fromhex(expected)
        assert blobs[start][offset:offset + len(raw)] == raw, address

    # unsigned XP <2000, then getter + signed current<target; distinct from completion
    at('0049DC60', '0049DCAE', '66 3d d0 07 72 08')
    at('0049DC60', '0049DCBF', 'e8 cc c6 fe ff 0f b6 c0 33 c9 3b c6 0f 9c c1')
    # Actual subtraction, upper cap5 only; no lower clamp or qualification call inserted
    at('005D91A0', '005D9283', 'e8 08 11 eb ff 0f b6 c8 2b f1 83 fe 05 7c 05 be 05 00 00 00')
    at('005D91A0', '005D929E', 'e8 dd fe ea ff 6b f6 64 0f b7 c0 03 c6 3d b8 0b 00 00 7e 05 b8 b8 0b 00 00')
    at('005D91A0', '005D92C5', 'e8 d6 c2 ec ff')
    # Wrapper actually calls the shared word writer, including attribute0..4 gate
    at('004A55A0', '004A55B7', '85 ff 7c 38 83 ff 04 7f 33')
    at('004A55A0', '004A55CF', 'e8 3c 52 fe ff')
    at('0048A810', '0048A814', '85 d2 7c 38 83 fa 04 7f 33')
    at('0048A810', '0048A838', '66 3d b8 0b 72 05 b8 b8 0b 00 00 66 89 84 51 2a 01 00 00')
    # Preserve special-person/age branching as a boundary, not a guessed ordinary formula
    at('0048A390', '0048A3BB', '3d bc 02 00 00 7c 07 3d 1f 03 00 00 7e 5e')
    at('0048A390', '0048A3D9', 'e8 52 fc ff ff 85 c0 74 1a')
    at('0048A390', '0048A405', '66 8b b4 77 2a 01 00 00')
    at('0048A390', '0048A414', 'b8 1f 85 eb 51 f7 e9 c1 fa 05 8b c2 c1 e8 1f 03 c2 03 d8')
    at('0048A390', '0048A427', '83 fb 01 7f 0b')
    at('0048A390', '0048A437', '83 fb 64 7c 0b')


def main():
    profile = json.loads((ROOT / 'docs/sources/pk-stat-training-s1.json').read_text())
    manifest = json.loads((ROOT / profile['source']['manifest']).read_text())
    asm = {start: (ROOT / 'docs/sources/training-lifecycle-source-profile' / (start + '.asm.txt')).read_text() for start in PINS}
    check(profile, manifest, asm)
    mutants = []
    for key in profile['constants']:
        p = deepcopy(profile); p['constants'][key] += 1; mutants.append((p, manifest, asm))
    for key, value in [('stockOriginalVerified', True), ('originalExecutableExecuted', True), ('version', 'vanilla'), ('level', 'opcode-exact')]:
        p = deepcopy(profile); p[key] = value; mutants.append((p, manifest, asm))
    p = deepcopy(profile); p['source']['id'] = 'S2'; mutants.append((p, manifest, asm))
    p = deepcopy(profile); p['remainingOpen'].pop(); mutants.append((p, manifest, asm))
    p = deepcopy(profile); p['domains']['ordinaryExcludesNativePersonIds'] = []; mutants.append((p, manifest, asm))
    p = deepcopy(profile); p['evidence']['writer'] = []; mutants.append((p, manifest, asm))
    for start in PINS:
        m = deepcopy(manifest); row = next(x for x in m['functions'] if x['start'] == start)
        raw = bytearray.fromhex(row['bytesHex']); raw[0] ^= 1
        row['bytesHex'] = raw.hex(); row['sha256'] = hashlib.sha256(raw).hexdigest()
        mutants.append((profile, m, asm))
        a = dict(asm); a[start] = a[start].replace(start + '  ', '00000000  ', 1)
        mutants.append((profile, manifest, a))
    for mutant in mutants:
        check(profile, manifest, asm)  # unchanged control for every mutation
        try:
            check(*mutant)
        except AssertionError:
            pass
        else:
            raise AssertionError('Source/profile mutation survived')
    print(f'PASS: S1 five full function fingerprints/disassemblies, 15 opcode sequences, {len(mutants)} killed source/profile mutations with controls')
    print('S1 numeric reconstruction only; full commands, scheduler, native table, clean-stock and other versions stay open.')


if __name__ == '__main__':
    main()
