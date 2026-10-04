"""P0-63 source-only native roster/role sort and capacity evidence checks.

Reads committed machine-byte columns and SHA-pinned evidence only; no model,
game EXE, disassembler or IDB parser dependency is imported or executed.
Optional --idb-s1/--idb-s2 verifies complete fingerprints and raw ID1 bytes.
"""
import argparse
import hashlib
import json
import mmap
from pathlib import Path
import struct
import sys
import unittest

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / 'docs/sources/native-roster-sort.json'
HEX = frozenset('0123456789abcdefABCDEF')
PRIOR_HASHES = {'recursive-officer-return': '114f8657135c69fde4c39efe27ee58d9df1d000f57710bddc955c2b613f51f82'}


def digest(value):
    return hashlib.sha256(value).hexdigest()


def instruction_rows(directory, row):
    lines = (directory / row['file']).read_text().splitlines()
    if 'lineStart' in row:
        start = row['lineStart'] - 1
        lines = lines[start:start + row['lineCount']]
        assert len(lines) == row['lineCount']
    address = int(row['start'], 16)
    result = []
    for line in lines:
        if not line.strip() or line.lstrip().startswith(';'):
            continue
        parts = line.split()
        assert int(parts[0], 16) == address, (row['source'], row['start'], line)
        values = []
        for token in parts[1:]:
            if len(token) != 2 or not set(token) <= HEX:
                break
            values.append(int(token, 16))
        assert values
        result.append((address, bytes(values)))
        address += len(values)
    assert address == int(row['endExclusive'], 16)
    raw = b''.join(value for _, value in result)
    assert digest(raw) == row['sha256']
    if 'independentId1Sha256' in row:
        assert digest(raw) == row['independentId1Sha256']
    return result


def resolve_manifest(path, cache):
    """Resolve only explicit machine-byte references, retaining interval widths."""
    path = path.resolve()
    if path in cache:
        return cache[path]
    evidence = json.loads(path.read_text())
    directory = path.with_suffix('')
    for container in evidence.get('containers', []):
        target = directory / container['file']
        assert digest(target.read_bytes()) == container['sha256']
        assert len(target.read_text().splitlines()) == container['lineCount']
    out = {}
    for row in evidence.get('ranges', []) + evidence.get('newRanges', []):
        key = row['source'], row['start'], row['endExclusive']
        parsed = instruction_rows(directory, row)
        out[key] = row, parsed
    prior = {r['id']: r for r in evidence.get('priorEvidence', []) if isinstance(r, dict)}
    for row in evidence.get('referencedRanges', []):
        # Older manifests also use this field for descriptive, non-byte references.
        if 'evidence' not in row:
            continue
        names = row['evidence']
        if isinstance(names, str):
            names = [names]
        key = row['source'], row['start'], row['endExclusive']
        values = []
        for name in names:
            ref = prior[name]
            target = ROOT / ref['path']
            assert digest(target.read_bytes()) == ref['sha256']
            found = resolve_manifest(target, cache)[key]
            assert found[0]['sha256'] == row['sha256']
            values.append(found)
        assert values and all(v[1] == values[0][1] for v in values)
        if key in out:
            assert out[key][1] == values[0][1]
        out[key] = values[0]
    cache[path] = out
    return out


def load_evidence():
    evidence = json.loads(MANIFEST.read_text())
    assert {r['id']:r['sha256'] for r in evidence['priorEvidence']} == PRIOR_HASHES
    for ref in evidence['priorEvidence']:
        path=ROOT/ref['path']
        assert digest(path.read_bytes()) == ref['sha256']
        assert json.loads(path.read_text())['sources'] == evidence['sources']
    resolved=resolve_manifest(MANIFEST,{})
    instructions={key:rows for key,(_,rows) in resolved.items()}
    raw={key:b''.join(value for _,value in rows) for key,rows in instructions.items()}
    for row in evidence['newRanges']+evidence['referencedRanges']:
        assert digest(raw[row['source'],row['start'],row['endExclusive']]) == row['independentId1Sha256']
    for row in evidence['comparisons']:
        a,b=(raw[s,row['start'],row['endExclusive']] for s in ('S1','S2'))
        assert row['identical'] == (a==b)
        assert row['differingByteCount'] == sum(x!=y for x,y in zip(a,b))
        assert row['S1sha256']==digest(a) and row['S2sha256']==digest(b)
    assert {(r['start'],r['endExclusive']) for r in evidence['comparisons']} == {
        (a,b) for s,a,b in raw if s=='S1' and ('S2',a,b) in raw}
    unpaired={(s,a,b) for s,a,b in raw if ('S2' if s=='S1' else 'S1',a,b) not in raw}
    assert {(r['source'],r['start'],r['endExclusive']) for r in evidence['unpairedRangeShapes']} == unpaired
    for row in evidence['unpairedRangeShapes']:
        assert digest(raw[row['source'],row['start'],row['endExclusive']]) == row['sha256']
    for (s,a,b),value in raw.items():
        for (t,c,d),other in raw.items():
            left,right=max(int(a,16),int(c,16)),min(int(b,16),int(d,16))
            if s==t and left<right:
                assert value[left-int(a,16):right-int(a,16)] == other[left-int(c,16):right-int(c,16)]
    return evidence,raw,instructions


def verify_raw_id1(path, identity, selected):
    """No IDB library: verify known uncompressed IDAv6 raw file layout."""
    with Path(path).open('rb') as fp:
        assert hashlib.file_digest(fp, 'sha256').hexdigest() == identity['idbSha256']
        with mmap.mmap(fp.fileno(), 0, access=mmap.ACCESS_READ) as data:
            assert data[:4] == b'IDA1'
            assert struct.unpack_from('<H', data, 0x1e)[0] == 6
            section = struct.unpack_from('<Q', data, 0x0e)[0]
            assert data[section] == 0, 'Compressed ID1 is outside this reader'
            length = struct.unpack_from('<Q', data, section+1)[0]
            body = section+9
            assert body+length <= len(data) and data[body:body+4] == b'VA*\x00'
            count = struct.unpack_from('<I', data, body+8)[0]
            assert 0 < count <= (0x2000-0x14)//8
            segments, offset = [], body+0x2000
            for i in range(count):
                start, end = struct.unpack_from('<II', data, body+0x14+8*i)
                assert start < end
                segments.append((start, end, offset))
                offset += 4*(end-start)
            assert offset <= body+length
            for (start, end), expected in selected.items():
                address = int(start, 16)
                assert address+len(expected) == int(end, 16)
                matches = [(a, b, o) for a, b, o in segments if a <= address and address+len(expected) <= b]
                assert len(matches) == 1
                a, _, offset = matches[0]
                offset += 4*(address-a)
                assert data[offset:offset+4*len(expected):4] == expected, (identity['source'], start, end)


class NativeRosterSortSource(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.e,cls.raw,cls.instructions=load_evidence()

    def body(self,s,f):
        return max((v for (src,a,_),v in self.raw.items() if (src,a)==(s,f)),key=len)

    def at(self,s,f,a,expected):
        b=bytes.fromhex(expected);offset=a-int(f,16)
        self.assertEqual(self.body(s,f)[offset:offset+len(b)],b)

    def call(self,s,f,a,target):
        b=self.body(s,f);off=a-int(f,16)
        self.assertEqual(b[off],0xe8)
        self.assertEqual(a+5+struct.unpack_from('<i',b,off+1)[0],target)

    def test_01_provenance_budget_and_independent_identity(self):
        self.assertEqual(self.e['profileId'],'source-idb-S1-S2-native-roster-sort-v1')
        self.assertEqual(self.e['baselineCommit'],'fd1323511ae7f2d1a1f171e787bca2300444cc4b')
        self.assertEqual((len(self.raw),sum(map(len,self.raw.values()))),(667,65134))
        self.assertEqual((len(self.e['referencedRanges']),len(self.e['newRanges'])),(611,56))
        self.assertEqual(self.e['rangeBudget'],dict(priorIntervals=611,newIntervals=56,totalIntervals=667,
            totalSelectedBytesBothSources=65134,sameShapePairs=330,identicalSameShapePairs=321,
            differentSameShapePairs=9,unpairedIntervalShapes=7))
        self.assertEqual([s['idbSha256'] for s in self.e['sources']], [
            'c591cb40ce6d6be9246148002532dedc042463f36cd39c5ed300b7c449feefab',
            'aa7f2c983b266633d6e23c494d4f8e1b03e5251632505cae103e176ae850dfd8'])
        for k in ('stockOriginalVerified','originalExeExecuted','recordedExeHashesIndependentlyVerified'):
            self.assertIs(self.e[k],False)
        self.assertEqual(self.e['adoption'],{'PC-PK1.1':'compatibility-reconstruction',
            'PC-Vanilla-assumed':'compatibility-assumption','PS2-Wii':'open'})

    def test_02_all_sort_key_comparator_capacity_call_ledgers(self):
        expected=set('0047B910 0047C6A0 004A6960 00488720 004C9610 004C90E0 004C8720 '
            '004AA200 004A8F40 004A69E0 004A8FF0 004A6B70 004CEF90 004CF160 '
            '0049D420 0049D540 004811E0 00472590 00494CB0 0048E0F0'.split())
        for s in ('S1','S2'):
            self.assertEqual(set(self.e['callLedgers'][s]),expected)
            for f,ledger in self.e['callLedgers'][s].items():
                key=max((k for k in self.instructions if k[:2]==(s,f)),key=lambda k:int(k[2],16))
                calls=[(a,b) for a,b in self.instructions[key] if b[0]==0xe8 or
                       (b[0]==0xff and b[1]&0x38==0x10)]
                self.assertEqual([f'{a:08X}' for a,_ in calls],[r['site'] for r in ledger])
                for(a,b),row in zip(calls,ledger):
                    self.assertEqual(b,bytes.fromhex(row['bytes']))
                    if b[0]==0xe8:self.assertEqual(a+5+struct.unpack_from('<i',b,1)[0],int(row['target'],16))
                    else:self.assertIs(row['indirect'],True)

    def test_03_roster_shortcut_key_cache_selected_quicksort_and_refilter(self):
        for s in ('S1','S2'):
            f='0047CD50'
            self.at(s,f,0x47cd6c,'8b 73 0c 83 fe 02 89 5c 24 10 7d 18')
            self.at(s,f,0x47cd78,'5e b8 01 00 00 00')
            self.call(s,f,0x47ce49,0x47bed0);self.call(s,f,0x47ce51,0x47a600)
            self.at(s,f,0x47ce61,'33 c0 85 db 0f 94 c0 55 89 37 8b 16 50 51 8b ce ff 52 14')
            self.at(s,f,0x47ce79,'89 47 04')
            self.at(s,f,0x47ce94,'3b dd b8 e0 68 4a 00 75 05 b8 60 69 4a 00')
            self.call(s,f,0x47ceaa,0x47c6a0);self.call(s,f,0x47ced5,0x47be50)
            self.call(s,f,0x47cefd,0x47a600);self.call(s,f,0x47cf0c,0x47c1b0)
            self.assertEqual(self.body(s,'005C2430'),bytes.fromhex('8bc1c70000000000c7400400000000c3'))
            self.assertEqual(self.body(s,'00505E50'),b'\xc3')

    def test_04_key0_virtual_and_two_jump_tables_reach_canonical_id(self):
        for s in ('S1','S2'):
            v=self.body(s,'0079C780')
            self.assertEqual(struct.unpack_from('<I',v,0x14)[0],0x488720)
            self.assertEqual(struct.unpack_from('<I',v,0x28)[0],0x4883c0)
            self.call(s,'00488720',0x488732,0x4c9610)
            self.call(s,'004C9610',0x4c9616,0x47a600)
            self.at(s,'004C9610',0x4c962c,'8d 43 eb 3d f8 00 00 00 0f 87 1f 01 00 00')
            self.call(s,'004C9610',0x4c9765,0x4c90e0)
            self.call(s,'004C90E0',0x4c90e9,0x47a600)
            data=self.body(s,'004C94AC');index=data[0x4c94d8-0x4c94ac]
            self.assertEqual(index,0);self.assertEqual(struct.unpack_from('<I',data,4*index)[0],0x4c9484)
            self.call(s,'004C90E0',0x4c9486,0x4c8720)
            self.call(s,'004C8720',0x4c8726,0x47a600)
            data=self.body(s,'004C8E88');index=data[0x4c8fd8-0x4c8e88]
            self.assertEqual(index,0);self.assertEqual(struct.unpack_from('<I',data,4*index)[0],0x4c8e72)
            self.call(s,'004C8720',0x4c8e78,0x491310)
            self.call(s,'004883C0',0x4883c6,0x491310)
            self.at(s,'00488720',0x48873a,'83 fe 49 74 10 83 f8 ff 75 0b 8b c7 f7 d8 1b c0 05 00 00 00 80')

    def test_05_id_conversion_and_fixed_readable_domain(self):
        for s in ('S1','S2'):
            self.at(s,'00491310',0x49131a,'8d b9 bc c0 00 00')
            self.at(s,'00491310',0x491336,'2b f7 b8 1f 85 eb 51 f7 ee c1 fa 07')
            self.at(s,'00491310',0x491349,'78 07 3d 4b 04 00 00 7e 03')
            self.assertEqual(self.body(s,'004195D0'),bytes.fromhex('83c8ffc3'))
            self.at(s,'00472070',0x472080,'ff 15 68 e2 74 00')
            self.at(s,'00472070',0x472094,'ff 15 6c e2 74 00')
            self.at(s,'0047A600',0x47a61e,'8b 06 8b ce 5e ff 60 04')

    def test_06_roster_comparator_live_gates_cached_keys_right_id_first(self):
        for s in ('S1','S2'):
            f='004A6960'
            self.call(s,f,0x4a6979,0x47a600);self.call(s,f,0x4a6986,0x47a600)
            self.at(s,f,0x4a6992,'8b 7f 04 8b 5b 04 3b fb 75 1f')
            self.at(s,f,0x4a699c,'8b 45 00 8b cd ff 50 28 8b 16 8b ce 8b f8 ff 52 28')
            self.at(s,f,0x4a69af,'3b c7 0f 9c c1')
            self.at(s,f,0x4a69be,'3b fb 5d 5f 0f 9c c0')
            self.at(s,f,0x4a69c7,'3b f5 5e 5d 1b c0 5f f7 d8')

    def test_07_quicksort_wrappers_copy_before_sort_clear_after_sort(self):
        for s in ('S1','S2'):
            self.call(s,'0047C6A0',0x47c6eb,0x47bed0)
            self.at(s,'0047C6A0',0x47c6f6,'89 14 b3 46')
            self.call(s,'0047C6A0',0x47c712,0x47b910)
            self.call(s,'0047C6A0',0x47c71c,0x47be50)
            self.call(s,'0047C6A0',0x47c72d,0x47c1b0)
            self.call(s,'004A8F40',0x4a8fb2,0x4a69e0)

    def test_08_quicksort_pivot_identity_scan_order_and_false_swaps(self):
        for s in ('S1','S2'):
            for f,delta in [('0047B910',0),('004A69E0',0x2b0d0)]:
                self.at(s,f,0x47b97e+delta,'8d 04 37 99 2b c2 d1 f8 8b 34 83')
                self.at(s,f,0x47b98b+delta,'8b 14 ab 3b d6 8d 04 ab')
                self.at(s,f,0x47b9ac+delta,'56 50 ff 54 24 34')
                self.at(s,f,0x47b9ec+delta,'50 56 ff 54 24 34')
                self.at(s,f,0x47ba16+delta,'3b e9 7d 13')
                self.at(s,f,0x47ba20+delta,'89 14 ab 89 04 8b 45 49')
                self.at(s,f,0x47ba2d+delta,'4d 3b fd 7d 1e')
                self.call(s,f,0x47ba44+delta,int(f,16))
                self.at(s,f,0x47ba50+delta,'8b 44 24 20 41 3b c8 7d 32')
                self.at(s,f,0x47ba74+delta,'ff 54 24 34 83 c4 10 85 c0 75 0c')
                self.at(s,f,0x47ba85+delta,'89 0c bb 89 04 b3')

    def test_09_role_sort_flags_filter_and_caller_contract(self):
        for s in ('S1','S2'):
            f='004AA200'
            self.at(s,f,0x4aa220,'3b eb')
            self.at(s,f,0x4aa23d,'83 7e 0c 02 0f 8c e3 00 00 00')
            self.call(s,f,0x4aa28f,0x47a600)
            self.call(s,f,0x4aa2c3,0x4a8f40);self.call(s,f,0x4aa2ca,0x4a8ff0)
            self.call(s,f,0x4aa2d4,0x47be50);self.call(s,f,0x4aa2f6,0x47a600)
            self.call(s,f,0x4aa305,0x47c1b0)
            self.call(s,'004A8FF0',0x4a9093,0x4a6b70)

    def test_10_merge_left_recursive_first_and_false_takes_right(self):
        for s in ('S1','S2'):
            f='004A6B70'
            self.call(s,f,0x4a6c27,0x4a6b70);self.call(s,f,0x4a6c4a,0x4a6b70)
            self.at(s,f,0x4a6c60,'8b 14 83 40 89 14 8f 41')
            self.at(s,f,0x4a6c97,'51 8b 0c b7 52 50 51 ff 54 24 38')
            self.at(s,f,0x4a6ca5,'85 c0 74 0a 8b 14 b7 89 14 ab 45 46')
            self.at(s,f,0x4a6cb3,'8b 44 24 20 8b 0c 83 89 0c ab 45 40')

    def test_11_leader_capacity_order_low16_live_office_and_no_same_pointer_gate(self):
        for s in ('S1','S2'):
            f='004CEF90'
            self.call(s,f,0x4cefe6,0x48a4f0);self.call(s,f,0x4ceff0,0x48a4f0)
            self.at(s,f,0x4cefeb,'8b cf 0f b7 d8')
            self.at(s,f,0x4ceff5,'0f b7 c0 3b d8 74 0d')
            self.at(s,f,0x4cf009,'8b 86 a4 00 00 00 8b 8f a4 00 00 00')
            self.at(s,f,0x4cf01d,'0f 9c c2')
            self.call(s,f,0x4cf028,0x489070);self.call(s,f,0x4cf032,0x489070)
            self.at(s,f,0x4cf04b,'3b f7 5b 1b c0')
            # All pre-capacity comparison opcodes are pinned by full range hash;
            # the first person-pointer compare occurs only at final fallback.
            prefix=self.body(s,f)[:0x4cefe4-int(f,16)]
            self.assertNotIn(bytes.fromhex('3b f7'),prefix)

    def test_12_governor_duplicate_gate_repeated_getters_and_left_id_first(self):
        for s in ('S1','S2'):
            f='004CF160'
            self.at(s,f,0x4cf18c,'3b fe 0f 84 ce 00 00 00')
            self.call(s,f,0x4cf1c1,0x48a4f0);self.call(s,f,0x4cf1ca,0x48a4f0)
            self.at(s,f,0x4cf1cf,'66 3b c3 75 26')
            for a in [0x4cf1d6,0x4cf1df,0x4cf1ea,0x4cf1f3]:self.call(s,f,a,0x489070)
            for a in [0x4cf202,0x4cf20b,0x4cf216,0x4cf21f]:self.call(s,f,a,0x489080)
            self.at(s,f,0x4cf22e,'66 8b 8f ae 00 00 00 33 c0 66 8b 86 ae 00 00 00')
            self.at(s,f,0x4cf243,'8b 07 8b cf ff 50 28 8b 16 8b ce 8b f8 ff 52 28')
            self.at(s,f,0x4cf255,'3b f8 0f 9c c1')

    def test_13_capacity_base_saved_force_and_source_specific_fallback(self):
        for s in ('S1','S2'):
            f='0049D420'
            self.at(s,f,0x49d446,'8b d8 53')
            self.call(s,f,0x49d468,0x488c00)
            self.call(s,f,0x49d473,0x436740)
            self.at(s,f,0x49d4a8,'85 ed 8b b7 a4 00 00 00')
            self.call(s,f,0x49d4bc,0x490b00)
            self.at(s,f,0x49d4c1,'8b 57 54 3b 50 54')
            self.at(s,f,0x49d4ec,'be 14 00 00 00')
            self.call(s,f,0x49d4f5,0x481350)
            self.at(s,f,0x49d505,'85 f6 7c 05 83 fe 50 7e 05 be 50 00 00 00')
            self.at(s,f,0x49d52d,'0f b7 46 2c')
        self.at('S1','0049D420',0x49d459,'8b 53 40 33 c9')
        self.at('S2','0049D420',0x49d459,'e9 7a 14 47 00')
        self.at('S1','0049D420',0x49d4c7,'75 23')
        self.at('S2','0049D420',0x49d4c7,'eb 23')
        self.at('S1','0049D420',0x49d4fe,'be 2c 00 00 00')
        self.at('S2','0049D420',0x49d4fe,'be 00 00 00 00')

    def test_14_capacity_hooks_mutable_timing_and_saved_base(self):
        f='0090E8D8';s='S2'
        self.at(s,f,0x90e8d8,'8b cf 68 79 01 00 00')
        self.call(s,f,0x90e8df,0x4890f0);self.call(s,f,0x90e8ea,0x488c00)
        self.at(s,f,0x90e8ef,'8b 04 85 08 e9 90 00')
        self.at(s,f,0x90e8fb,'8b 53 40 31 c9 e9 59 eb b8 ff')
        self.assertEqual(self.body(s,'0090E908'),struct.pack('<II',12000,15000))
        for s in ('S1','S2'):
            self.call(s,'0049D540',0x49d546,0x49d420)
            self.at(s,'0049D540',0x49d54b,'57 8b d8')
            self.call(s,'0049D540',0x49d54e,0x47a630)
            self.at(s,'0049D540',0x49d558,'74 3d')
            self.call(s,'0049D540',0x49d568,0x490aa0)
            self.at(s,'0049D540',0x49d57a,'74 13')
            self.at(s,'0049D540',0x49d589,'81 c3 b8 0b 00 00')
        self.at('S1','0049D540',0x49d57c,'6a 12')
        self.at('S2','0049D540',0x49d57c,'6a 03')
        self.at('S2','0049D540',0x49d58f,'e9 14 fc 46 00')
        self.at('S2','0090D1A8',0x90d1a8,'8b cf 68 16 01 00 00')
        self.call('S2','0090D1A8',0x90d1af,0x4890f0)
        self.at('S2','0090D1A8',0x90d1b4,'85 c0 74 06 81 c3 d0 07 00 00')

    def test_15_technique_bits_and_normal_force_id_gate(self):
        for s in ('S1','S2'):
            self.at(s,'004811E0',0x4811ed,'50 83 c1 58 51')
            self.call(s,'004811E0',0x4811f2,0x472590)
            self.at(s,'00472590',0x47259f,'8b c8 c1 e9 05 56 83 e0 1f 8d 34 8a')
            self.at(s,'00472590',0x4725c4,'8b cf 8b 3e b8 01 00 00 00 d3 e0')
            self.at(s,'00481350',0x481350,'8b 01 ff 50 28 85 c0 7c 0b 83 f8 29 7f 06')
        self.at('S1','004811E0',0x4811e8,'83 f8 23')
        self.at('S2','004811E0',0x4811e8,'83 f8 3f')

    def test_16_canonical_title_office_validity_is_constant_true(self):
        for s in ('S1','S2'):
            self.at(s,'00494C60',0x494c68,'c7 06 80 cb 79 00')
            self.at(s,'0048E0A0',0x48e0a8,'c7 06 64 c8 79 00')
            self.assertEqual(struct.unpack_from('<I',self.body(s,'0079CB80'),8)[0],0x494cb0)
            self.assertEqual(struct.unpack_from('<I',self.body(s,'0079C864'),8)[0],0x48e0f0)
            self.assertEqual(struct.unpack_from('<I',self.body(s,'0079CB80'),0x24)[0],0x5ba520)
            self.assertEqual(struct.unpack_from('<I',self.body(s,'0079C864'),0x24)[0],0x5ba5b0)
            self.at(s,'00494CB0',0x494cb0,'8b 01 ff 50 24 83 e8 0f f7 d8 1b c0 40 c3')
            self.at(s,'0048E0F0',0x48e0f0,'8b 01 ff 50 24 83 e8 10 f7 d8 1b c0 40 c3')
            self.assertEqual(self.body(s,'005BA520'),bytes.fromhex('b80f000000c3'))
            self.assertEqual(self.body(s,'005BA5B0'),bytes.fromhex('b810000000c3'))
            self.at(s,'00490BF0',0x490bf8,'83 f8 09 7f 0d 6b c0 34 8d 84 08 d4 d7 07 00')
            self.at(s,'00490C10',0x490c18,'83 f8 50 7f 0d 6b c0 3c 8d 84 08 dc d9 07 00')

    def test_17_force_validity_has_no_new_capacity_field_dependency(self):
        for s in ('S1','S2'):
            self.assertEqual(struct.unpack_from('<I',self.body(s,'0079C0E8'),8)[0],0x480ff0)
            self.at(s,'00480FF0',0x480ff3,'8b 06 6a 01 ff 50 2c')
            self.at(s,'00480FF0',0x480ffe,'8b 76 04 85 f6 7c 0f 81 fe 4b 04 00 00')
            self.at(s,'00436740',0x436740,'8b 41 3c c3')

    def test_18_list_receiver_identity_pool_vtables_and_clear_order(self):
        for s in ('S1','S2'):
            self.assertEqual(struct.unpack('<III',self.body(s,'0079BF24')),(0x47bf60,0x5d7a70,0x5b3b90))
            self.assertEqual(struct.unpack('<III',self.body(s,'007E81EC')),(0x4a7fa0,0x5d7a70,0x5b3b90))
            self.at(s,'0047BED0',0x47bf1a,'8b 06 89 07')
            self.at(s,'0047BE50',0x47be9d,'89 5f 0c 89 5f 10 89 5f 08 89 5f 04 ff 52 08')
            self.at(s,'0047C1B0',0x47c213,'89 57 08 8b 46 08 85 c0 74 04 89 38')
            self.at(s,'005B3B90',0x5b3b93,'8b 4e 14 85 c9 74 10')

    def test_19_semantic_claims_remain_bounded(self):
        c=self.e['contracts'];self.assertEqual(c['rosterFlags'],[1,0,0,0])
        self.assertEqual(c['nativePlatformPolicy'],'unmodified-successful-probes-allocator-locks-v1')
        self.assertIn('quicksort',c['rosterAlgorithm']);self.assertIn('mergesort',c['governorAlgorithm'])
        self.assertIn('no stable',c['ties']);self.assertIn('field0 only',c['rosterScalarKey'])
        self.assertEqual(c['capacityMutableBoundaries']['S1'],[])
        self.assertEqual([r['queryId'] for r in c['capacityMutableBoundaries']['S2']],[377,278])
        self.assertIn('valid=true',c['canonicalTitleOfficeValidity'])
        self.assertIn('API support boundary',c['directBuildingRosterDomain'])
        self.assertIn('before count shortcut',c['directBuildingRosterDomain'])
        for k in ('fullNativeExecution','originalSaveEquivalence','queryHooksExecuted'):self.assertIs(c[k],False)

    def test_20_inherited_primitives_pinned_without_model_imports(self):
        expected = {'scripts/recursive_officer_return_profile.py': '71730182c0c9725c60beaef9f8d74e717f9e281ca2266b7f2e5c9da9fd5707c8', 'scripts/recursive_role_primitives.py': 'ad28535effcc10a4a096dccf67e1293ae552b94e0c9795e0ad14fd0ee19cf14e', 'scripts/recursive_return_frame.py': 'cd1f7cd1fbe3940987426c3f704bb56e6232ebd1d0c1e91d62ee9a70a5142810', 'scripts/mission_composition_frame.py': 'e21ca6176d6ff83759efa204f821d6a87323fc643856fa9e714f4ec3230c398a', 'scripts/mission_event_listener_profile.py': '0fbb973bb9e2a0960f9dc245057594ae699df46f5552628deeae977ca63479ac', 'scripts/mission_notification_tail_profile.py': '5352697af974690724f712e4353ef9c2aee46b8602cb36eca6d24b5c1f1d51e5', 'scripts/mission_event_composition_profile.py': 'd2f2c6d403a1a12ff488d088e24cd652d98438fa054b095f078a4e2890394c87', 'scripts/mission_cancellation_v2_profile.py': '2f070f11dfac647e9c28d070081928b3fd105d40b2a78ea4f7c81a08699a80a2'}
        self.assertEqual({r['path']:r['sha256'] for r in self.e['inheritedPrimitiveDependencies']},expected)
        for path,sha in expected.items():self.assertEqual(digest((ROOT/path).read_bytes()),sha)
        domain=self.e['contracts']['representationDomain']
        for token in ('coherent linked-list count/head/tail','successful allocation','unmodified platform memory probes','arbitrary IAT/vtable hooks'):
            self.assertIn(token,domain)
        imports=self.e['platformAssumptions']
        self.assertEqual(imports['0074E268']['idbSymbol'],'IsBadReadPtr')
        self.assertEqual(imports['0074E26C']['idbSymbol'],'IsBadWritePtr')
        self.assertIn('no live IAT resolution',imports['evidenceBoundary'])


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--idb-s1');parser.add_argument('--idb-s2')
    args,remaining=parser.parse_known_args()
    if bool(args.idb_s1)!=bool(args.idb_s2):parser.error('Pass both IDBs for raw verification')
    if args.idb_s1:
        evidence,raw,_=load_evidence()
        for source,path in [('S1',args.idb_s1),('S2',args.idb_s2)]:
            identity=next(s for s in evidence['sources'] if s['source']==source)
            selected={(a,b):v for(s,a,b),v in raw.items() if s==source}
            verify_raw_id1(path,identity,selected)
            print(f'{source}: whole-IDB fingerprint and {len(selected)} raw-ID1 ranges verified',flush=True)
    unittest.main(argv=[sys.argv[0]]+remaining)


if __name__=='__main__':main()
