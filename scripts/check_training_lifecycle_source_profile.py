"""Static source-profile bytes and restricted reference math, never stock EXE execution."""
from pathlib import Path
import hashlib
import json
import re

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'docs/sources/training-lifecycle-source-profile.json'
ASM = DATA.with_suffix('')


def main():
    data = json.loads(DATA.read_text())
    assert data['stockOriginalVerified'] is False
    assert data['originalExecutableExecuted'] is False
    assert data['defaultRuntimeEvidence'] == 'compatibility-reconstruction'
    assert data['sourceProfiles'][0]['idbSha256'] == 'c591cb40ce6d6be9246148002532dedc042463f36cd39c5ed300b7c449feefab'
    assert '血色5.0' in data['sourceProfiles'][0]['inputPath']
    assert '血色衣冠6.0' in data['sourceProfiles'][1]['inputPath']
    functions = {int(row['start'], 16): row for row in data['functions']}
    blobs = {}
    for start, row in functions.items():
        blob = bytes.fromhex(row['bytesHex'])
        assert len(blob) == row['length']
        assert hashlib.sha256(blob).hexdigest() == row['sha256']
        reconstructed = bytearray()
        cursor = start
        for line in (ASM / row['disassembly']).read_text().splitlines():
            match = re.match(r'^([0-9A-F]{8})  ((?:[0-9a-f]{2} )*[0-9a-f]{2})\s+\S', line)
            assert match, line
            assert int(match[1], 16) == cursor
            chunk = bytes.fromhex(match[2])
            reconstructed.extend(chunk)
            cursor += len(chunk)
        assert bytes(reconstructed) == blob
        blobs[start] = blob

    def at(fn, addr, hex_bytes):
        expected = bytes.fromhex(hex_bytes)
        assert blobs[fn][addr-fn:addr-fn+len(expected)] == expected, hex(addr)

    at(0x5c4100, 0x5c41a5, '3b c7 5f 56 7c 36')
    at(0x4a70d0, 0x4a7143, '03 dd')
    at(0x4a70d0, 0x4a7153, '81 fb b8 0b 00 00 7e 05 bb b8 0b 00 00')
    at(0x48a810, 0x48a838, '66 3d b8 0b 72 05 b8 b8 0b 00 00')
    at(0x48a390, 0x48a414, 'b8 1f 85 eb 51 f7 e9 c1 fa 05 8b c2 c1 e8 1f 03 c2 03 d8')
    at(0x48a390, 0x48a437, '83 fb 64 7c 0b')
    at(0x47b730, 0x47b730, 'c7 81 a4 00 00 00 00 00 00 00 c3')
    at(0x48da10, 0x48da10, 'c7 41 68 00 00 00 00 c3')
    at(0x598630, 0x59867a, '6a 00 8b ce e8 bd 14 ef ff')
    at(0x4a54a0, 0x4a5512, '3b f5 74 0d 6a 54')
    at(0x5d91a0, 0x5d92a3, '6b f6 64 0f b7 c0 03 c6 3d b8 0b 00 00')
    tails = next(row for row in data['noncontiguousChunks'] if row['target'] == '00487860')
    assert tails['chunks'] == [['00487860','00487918'],['0047B730','0047B73B'],['0048DA10','0048DA18']]

    for row in data['sourceComparisons']:
        s1 = blobs[int(row['start'], 16)]
        s2 = bytes.fromhex(row['s2BytesHex'])
        assert len(s1) == row['sjnLength'] and len(s2) == row['seanLength']
        assert hashlib.sha256(s1).hexdigest() == row['sjnSha256']
        assert hashlib.sha256(s2).hexdigest() == row['seanSha256']
        assert (s1 == s2) == row['identical']
        actual = [{'address':f'{int(row["start"],16)+i:08X}', 'sjnByte':a, 'seanByte':b}
                  for i, (a,b) in enumerate(zip(s1,s2)) if a != b]
        assert actual == row['differentOffsets']
    different = {row['start'] for row in data['sourceComparisons'] if not row['identical']}
    assert {'004A70D0','0048A810','0048A390','005C4080'} <= different

    def gain(base, xp, delta=2):
        new = min(3000, xp+delta)
        return {'xp':new, 'actualXp':new-xp, 'war':max(1,min(100,base+new//100)),
                'remainder':new%100, 'sourceUiDisplayXp':100 if new>=3000 else new%100}

    for vector in data['validation']['vectors']:
        assert gain(vector['base'], vector['xpBefore']) == vector['expected']
    count = 0
    for base in [0,1,3,70,80,98,99,100]:
        for xp in range(3001):
            result = gain(base,xp)
            assert 0 <= result['xp'] <= 3000 and 0 <= result['actualXp'] <= 2
            assert 1 <= result['war'] <= 100
            assert result['war'] >= max(1,min(100,base+xp//100))
            count += 1
    rules = json.loads((ROOT / 'docs/sources/pk-training-runtime.json').read_text())['rules']
    assert rules['engine.progression']['level'] == 'compatibility-reconstruction'
    assert rules['engine.progression']['value']['experienceCap'] == data['rules']['xp']['cap'] == 3000
    assert rules['engine.progression']['value']['conversionThreshold'] == data['rules']['xp']['perStatPoint'] == 100
    assert rules['engine.scheduler']['level'] == 'provisional-engine-rule'
    assert data['rules']['reset']['filterByForceOrCorps'] is False
    assert data['rules']['reset']['laterMissionHandlerMaySetActed'] is True
    assert 'clean-stock PC-PK1.1 equivalence' in data['remainingOpen']
    print(f'PASS: {len(functions)} function/chunk fingerprints + disassemblies, 11 opcode assertions, {len(data["sourceComparisons"])} S1/S2 comparisons, 5 vectors and {count} growth invariants')
    print('Source-bound static/reference validation only; stock PK, complete scheduler and cross-version equivalence stay open.')


if __name__ == '__main__':
    main()
