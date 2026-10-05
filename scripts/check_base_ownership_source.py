"""P0-66 source-only ownership/event9/10 evidence checks.

Only committed byte columns, source identities, call/region ledgers and stdlib
are used. No game model, third-party parser, or target-code execution. Optional
--idb-s1/--idb-s2 verify whole-IDB fingerprints and all raw ID1 selected bytes.
"""
import argparse
import hashlib
import json
import mmap
from pathlib import Path
import re
import struct
import sys
import unittest

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / 'docs/sources/base-ownership-events.json'
DIRECTORY = MANIFEST.with_suffix('')
HEX = frozenset('0123456789abcdefABCDEF')
PRIOR_HASHES = {
    'empty-legion-redistribution': '024c072b41eb0ec3e98d255cbcf5078a158f4dcb673f046cfef0f2ab9f9abf27',
    'mission-event-listeners': 'e3f80912a9b2a39eaf6cb507089bd37daff1ce0f9249c9acb129243145b7e065',
}


def digest(b): return hashlib.sha256(b).hexdigest()


def read_rows(directory, row):
    lines = (directory / row['file']).read_text().splitlines()
    if 'lineStart' in row:
        lines = lines[row['lineStart']-1:row['lineStart']-1+row['lineCount']]
    address, instructions = int(row['start'], 16), []
    for line in lines:
        if not line.strip() or line.lstrip().startswith(';'): continue
        parts = line.split()
        assert int(parts[0], 16) == address, line
        value = []
        for token in parts[1:]:
            if len(token) != 2 or not set(token) <= HEX: break
            value.append(int(token, 16))
        assert value
        instructions.append((address, bytes(value)))
        address += len(value)
    assert address == int(row['endExclusive'], 16)
    raw = b''.join(b for _, b in instructions)
    assert digest(raw) == row['sha256'] == row['independentId1Sha256']
    return raw, instructions


def load_evidence():
    e = json.loads(MANIFEST.read_text())
    assert {r['id']: r['sha256'] for r in e['priorEvidence']} == PRIOR_HASHES
    prior, selected, raw, instructions, kinds = {}, [], {}, {}, {}
    for r in e['priorEvidence']:
        p = ROOT / r['path']
        assert digest(p.read_bytes()) == r['sha256']
        m = json.loads(p.read_text())
        assert m['sources'] == e['sources']
        prior[r['id']] = m, p.with_suffix('')
    for ref in e['referencedRanges']:
        m, directory = prior[ref['evidence']]
        matches = [r for r in m['ranges'] if (r['source'], r['start'], r['endExclusive']) ==
                   (ref['source'], ref['start'], ref['endExclusive'])]
        assert len(matches) == 1
        row = matches[0]
        assert row['sha256'] == ref['sha256'] == ref['independentId1Sha256']
        key = row['source'], row['start']
        raw[key], instructions[key] = read_rows(directory, row)
        kinds[key] = row['kind']; selected.append((key[0], key[1], raw[key]))
    new = {}
    for row in e['newRanges']:
        key = row['source'], row['start']
        assert key not in new
        b, ins = read_rows(DIRECTORY, row)
        raw[key], instructions[key], new[key], kinds[key] = b, ins, b, row['kind']
        selected.append((key[0], key[1], b))
    pairs = {a for s, a in new if ('S1', a) in new and ('S2', a) in new}
    assert {r['start'] for r in e['comparisons']} == pairs
    for r in e['comparisons']:
        a, b = new['S1', r['start']], new['S2', r['start']]
        for source, data in [('S1', a), ('S2', b)]:
            assert int(r[source+'endExclusive'], 16)-int(r['start'], 16) == len(data)
            assert r[source+'sha256'] == digest(data)
        assert r['identical'] == (a == b)
        assert r['sameShape'] == (len(a) == len(b))
        assert r['differingByteCount'] == sum(x != y for x, y in zip(a, b)) + abs(len(a)-len(b))
    assert {(r['source'], r['start']) for r in e['sourceSpecificRanges']} == set(new)-{(s, a) for a in pairs for s in ('S1', 'S2')}
    return e, raw, instructions, new, selected, kinds


def verify_raw_id1(path, identity, selected):
    """Independent reader for these fingerprinted uncompressed IDA6 IDBs."""
    with Path(path).open('rb') as fp:
        assert hashlib.file_digest(fp, 'sha256').hexdigest() == identity['idbSha256']
        with mmap.mmap(fp.fileno(), 0, access=mmap.ACCESS_READ) as data:
            assert data[:4] == b'IDA1' and struct.unpack_from('<H', data, 0x1e)[0] == 6
            section = struct.unpack_from('<Q', data, 0xe)[0]
            assert data[section] == 0
            length = struct.unpack_from('<Q', data, section+1)[0]
            body = section+9
            assert body+length <= len(data) and data[body:body+4] == b'VA*\0'
            count = struct.unpack_from('<I', data, body+8)[0]
            assert 0 < count <= (0x2000-0x14)//8
            segments, offset = [], body+0x2000
            for i in range(count):
                a, b = struct.unpack_from('<II', data, body+0x14+8*i)
                assert a < b
                segments.append((a, b, offset)); offset += 4*(b-a)
            assert offset <= body+length
            for source, start, expected in selected:
                if source != identity['source']: continue
                address = int(start, 16)
                matches = [(lo, hi, p) for lo, hi, p in segments if lo <= address and address+len(expected) <= hi]
                assert len(matches) == 1
                lo, _, offset = matches[0]; offset += 4*(address-lo)
                assert data[offset:offset+4*len(expected):4] == expected, (source, start)


class BaseOwnershipSource(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.e, cls.raw, cls.ins, cls.new, cls.selected, cls.kinds = load_evidence()

    def at(self, s, f, a, hexbytes):
        value = bytes.fromhex(hexbytes); offset = a-int(f, 16)
        self.assertEqual(self.raw[s, f][offset:offset+len(value)], value)

    def call(self, s, f, a, target):
        b = self.raw[s, f]; o = a-int(f, 16)
        self.assertEqual(b[o], 0xe8)
        self.assertEqual(a+5+struct.unpack_from('<i', b, o+1)[0], target)

    def test_01_identity_scope_budget(self):
        self.assertEqual(self.e['profileId'], 'source-idb-S1-S2-base-ownership-events-v1')
        self.assertEqual(self.e['baselineCommit'], '874f6126bd82d4bfc2ff6daf778ec60a5120bc35')
        self.assertEqual([s['idbSha256'] for s in self.e['sources']], [
            'c591cb40ce6d6be9246148002532dedc042463f36cd39c5ed300b7c449feefab',
            'aa7f2c983b266633d6e23c494d4f8e1b03e5251632505cae103e176ae850dfd8'])
        for key in ('stockOriginalVerified', 'originalExeExecuted', 'recordedExeHashesIndependentlyVerified'):
            self.assertIs(self.e[key], False)
        self.assertTrue(all('血色' in s['recordedInputPath'] for s in self.e['sources']))
        self.assertEqual(self.e['adoption'], {'PC-PK1.1':'compatibility-reconstruction', 'PC-Vanilla-assumed':'compatibility-assumption', 'PS2-Wii':'open'})
        self.assertEqual(self.e['rangeBudget'], dict(newIntervals=145, referencedIntervals=338,
            newSelectedBytesBothSources=10641, referencedSelectedBytesBothSources=22202,
            pairedStarts=72, identicalPairs=68, differentPairs=4, sourceSpecificIntervals=1))
        self.assertEqual((len(self.new), len(self.selected), sum(len(b) for _, _, b in self.selected)), (145, 483, 32843))

    def test_02_complete_call_ledgers(self):
        for (s, f), ins in self.ins.items():
            if self.kinds[s, f] != 'code': continue
            calls = [(a, b) for a, b in ins if b[0] == 0xe8 or (b[0] == 0xff and b[1]&0x38 == 0x10)]
            ledger = self.e['callLedgers'][s][f]
            self.assertEqual([f'{a:08X}' for a, _ in calls], [r['site'] for r in ledger])
            for (a, b), row in zip(calls, ledger):
                self.assertEqual(b, bytes.fromhex(row['bytes']))
                self.assertEqual(row['kind'], 'direct' if b[0] == 0xe8 else 'indirect')
                if b[0] == 0xe8:
                    self.assertEqual(a+5+struct.unpack_from('<i', b, 1)[0], int(row['target'], 16))

    def test_03_complete_idb_function_regions_include_tails(self):
        code = {(r['source'], r['start']): r for r in self.e['newRanges'] if r['kind'] == 'code'}
        for key, regions in self.e['functionRegions'].items():
            s, owner = key.split(':')
            for region in regions:
                r = code[s, region['start']]
                self.assertEqual((r['endExclusive'], r['ownerFunction']), (region['endExclusive'], owner))
                self.assertEqual(r['boundaryKind'], 'complete-IDB-function-region' if len(regions)>1 else 'complete-IDB-function')
        self.assertEqual(self.e['functionRegions']['S2:0047A7D0'], [
            {'start':'0047A7D0', 'endExclusive':'0047A82A'}, {'start':'008EA050', 'endExclusive':'008EA05D'}])
        self.assertEqual([(r['start'], r['differingByteCount']) for r in self.e['comparisons'] if not r['identical']],
                         [('0047A7D0',6), ('004811E0',12), ('0072EB70',10), ('0072F4F0',10)])

    def test_04_entry_validity_and_requested_range(self):
        for s in ('S1','S2'):
            self.call(s,'004AD550',0x4ad55b,0x47a630)
            self.at(s,'004AD550',0x4ad570,'83 fd ff 74 11 85 ed 0f 8c e2 00 00 00 83 fd 2e')
            self.at(s,'004AD550',0x4ad58c,'ff 50 44')
            self.at(s,'004AD550',0x4ad597,'ff 52 40')
            self.call(s,'004AD550',0x4ad5a7,0x490ad0)
            self.at(s,'004AD550',0x4ad5a4,'83 cb ff')
            self.at(s,'004AD550',0x4ad5bf,'ff 50 40 8b d8 85 db')

    def test_05_ownership_write_event_order(self):
        for s in ('S1','S2'):
            for a,t in [(0x4ad5d7,0x487b30),(0x4ad5e3,0x4867a0),(0x4ad5eb,0x4876a0),
                        (0x4ad5ff,0x4866f0),(0x4ad617,0x4815f0),(0x4ad620,0x47b6f0),
                        (0x4ad629,0x47b710),(0x4ad637,0x4bbaa0),(0x4ad658,0x4bbaa0)]:
                self.call(s,'004AD550',a,t)
            self.at(s,'004AD550',0x4ad5f4,'ff 52 40 39 44 24 18 8b ce 74 45')
            self.at(s,'004AD550',0x4ad632,'6a 00 56 6a 09')
            self.at(s,'004AD550',0x4ad644,'8b 06 ff 50 44 39 44 24 1c 74 0e')
            self.at(s,'004AD550',0x4ad653,'6a 00 56 6a 0a')

    def test_06_raw_owner_and_category_predicate(self):
        for s in ('S1','S2'):
            self.assertEqual(self.raw[s,'004867A0'],bytes.fromhex('8b44240483f8ff740985c07c0883f82e7f0389410cc20400'))
            for a,t in [(0x487b45,0x490b90),(0x487b6a,0x490b90),(0x487b9a,0x490b90)]:self.call(s,'00487B30',a,t)
            self.at(s,'00487B30',0x487b4a,'83 b8 b4 00 00 00 01')
            self.at(s,'00487B30',0x487b56,'83 f8 18 74 2d')
            self.at(s,'00487B30',0x487b7c,'83 f8 03')
            self.at(s,'00487B30',0x487b9f,'83 b8 b4 00 00 00 02')

    def test_07_subtype_dispatch_numeric_ranges(self):
        for s in ('S1','S2'):
            self.call(s,'004876A0',0x4876a9,0x491770)
            self.at(s,'004876A0',0x4876ae,'8b 76 08 83 ee 00')
            for a,h in [(0x4876c4,'83 f8 34 7c 0a 83 f8 56'),(0x487700,'83 f8 2a 7c 0a 83 f8 33'),(0x48773c,'85 c0 7c 05 83 f8 29')]:self.at(s,'004876A0',a,h)
            for a,t in [(0x4876dc,0x490a70),(0x487718,0x490a40),(0x48774e,0x490a10),
                        (0x4876f7,0x48db30),(0x487733,0x483730),(0x487769,0x47cbd0)]:self.call(s,'004876A0',a,t)

    def test_08_canonical_virtual_slot_resolution(self):
        for s in ('S1','S2'):
            for item in self.e['contracts']['canonicalVtables'].values():
                raw=self.raw[s,item['table']]
                for key,offset in [('force40',0x40),('legion44',0x44),('baseMaximum4C',0x4c)]:
                    if key in item:self.assertEqual(struct.unpack_from('<I',raw,offset)[0],int(item[key],16))
            self.assertEqual(self.raw[s,'0065D6C0'],bytes.fromhex('8b4104c3'))
            self.assertEqual(self.raw[s,'0047C320'],bytes.fromhex('8b4138c3'))
            self.assertEqual(self.raw[s,'00483810'],bytes.fromhex('8b4120c3'))
            self.assertEqual(self.raw[s,'0047C330'],bytes.fromhex('668b8182000000c3'))
            self.assertEqual(self.raw[s,'0048DC10'],bytes.fromhex('668b4162c3'))

    def test_09_legion_writes_then_unsigned_clamp(self):
        for s in ('S1','S2'):
            for f,store,off,current,max1,cmp,max2,setter,helper in [
                ('0047CBD0',0x47cbeb,0x38,0x47cc1a,0x47cc24,0x47cc29,0x47cc31,0x47cc39,0x47c4f0),
                ('00483730',0x48374b,0x20,0x48377f,0x483789,0x48378e,0x483796,0x48379e,0x4835b0),
                ('0048DB30',0x48db4b,0x20,0x48db7f,0x48db89,0x48db8e,0x48db96,0x48db9e,0x48d9c0)]:
                self.at(s,f,store,f'89 46 {off:02x}')
                self.at(s,f,current,'66 8b 7f 10')
                self.call(s,f,max1,0x47a7d0);self.call(s,f,max2,0x47a7d0)
                self.at(s,f,cmp,'66 3b f8 5f 76 0f')
                self.call(s,f,setter,helper)

    def test_10_source_specific_maximum_and_complete_s2_tail(self):
        for s in ('S1','S2'):
            self.at(s,'0047A7D0',0x47a7d6,'ff 50 4c')
            self.at(s,'0047A7D0',0x47a7df,'ff 52 40')
            self.call(s,'0047A7D0',0x47a813,0x4811e0)
            self.at(s,'0047A7D0',0x47a81c,'81 c7 b8 0b 00 00 66 8b c7')
            self.call(s,'004811E0',0x4811f2,0x472590)
        self.at('S1','0047A7D0',0x47a80f,'6a 1a')
        self.at('S1','0047A7D0',0x47a825,'5f 5e c3')
        self.at('S2','0047A7D0',0x47a80f,'6a 24')
        self.at('S2','0047A7D0',0x47a825,'e9 26 f8 46 00')
        self.assertEqual(self.raw['S2','008EA050'],bytes.fromhex('663dc05d760466b8c05d5f5ec3'))
        self.assertNotIn(('S1','008EA050'),self.raw)
        self.at('S1','004811E0',0x4811e8,'83 f8 23')
        self.at('S2','004811E0',0x4811e8,'83 f8 3f')

    def test_11_generic_durability_setter_calls_max_before_signed_tests(self):
        for s in ('S1','S2'):
            self.call(s,'00487E20',0x487e23,0x487150)
            self.at(s,'00487E20',0x487e2c,'66 85 c9 7f 0a 33 c0 66 89 46 10')
            self.at(s,'00487E20',0x487e3b,'66 3b c1 7e f3 66 89 4e 10')
            for f,a in [('0047C4F0',0x47c529),('004835B0',0x4835ee),('0048D9C0',0x48d9fe)]:self.call(s,f,a,0x487e20)
            self.at(s,'00487150',0x4871ef,'e9 dc 35 ff ff')
            self.at(s,'00487150',0x48721a,'66 8b 86 c2 00 00 00')

    def test_12_city_reset_id_not_territory_and_dword_masks(self):
        for s in ('S1','S2'):
            self.call(s,'004866F0',0x4866f6,0x491770)
            self.at(s,'004866F0',0x4866fb,'85 c0 7c 05 83 f8 29')
            self.call(s,'004866F0',0x48670d,0x490a10)
            for f,base,bit in [('004815F0',0x4815f0,0),('0047B6F0',0x47b6f0,1),('0047B710',0x47b710,4)]:
                self.at(s,f,base+5,'81 c1 a4 00 00 00')
                self.at(s,f,base+11,f'6a {bit:02x} 51');self.call(s,f,base+14,0x472520)
            self.at(s,'00472520',0x472542,'ff 15 68 e2 74 00')
            self.at(s,'00472520',0x47254f,'ff 15 6c e2 74 00')
            self.at(s,'00472520',0x472573,'8b 06 ba 01 00 00 00 d3 e2 f7 d2 23 c2 89 06')

    def test_13_event_wrapper_copy_and_live_order(self):
        for s in ('S1','S2'):
            for a,t in [(0x4bbac5,0x4a8110),(0x4bbad1,0x4ba1d0),(0x4bbad6,0x4ec870)]:self.call(s,'004BBAA0',a,t)
            self.at(s,'004BBAA0',0x4bbae2,'6a 00 6a 00 6a 00 6a 00')
            self.call(s,'004A8110',0x4a8160,0x49f820)
            self.at(s,'004A8110',0x4a8184,'8b 00 3b 05 94 15 77 09 74 1b 8b 88 3c 01 00 00')
            self.at(s,'004A8110',0x4a8194,'3b ce 7c 11 83 f9 2b 7f 0c')
            self.call(s,'004A8110',0x4a81a4,0x5b9d30)
            self.at(s,'005B9D30',0x5b9d37,'8b 9d 3c 01 00 00 83 fb 25')
            self.at(s,'005B9D30',0x5b9def,'ff 52 0c 5f 5d b8 01 00 00 00')

    def test_14_full_event9_troop_boundary_and_event10_skip(self):
        for s in ('S1','S2'):
            self.assertEqual(len(self.raw[s,'004BA1D0']),0x2b5)
            self.at(s,'004BA1D0',0x4ba1e6,'83 e8 09')
            self.at(s,'004BA1D0',0x4ba1fd,'74 68 83 e8 07 74 09 83 e8 02 0f 85 6b 02 00 00')
            self.at(s,'004BA1D0',0x4ba285,'a1 d0 b4 3f 07')
            for a,t in [(0x4ba2a0,0x4922c0),(0x4ba42a,0x4f55e0),(0x4ba43d,0x4b5020),(0x4ba447,0x4ad2b0),(0x4ba467,0x4ad220)]:self.call(s,'004BA1D0',a,t)
            self.at(s,'004BA1D0',0x4ba472,'0f 85 1e fe ff ff')

    def test_15_all44_registry_pairs_are_pinned(self):
        old=json.loads((ROOT/'docs/sources/mission-event-listeners.json').read_text())
        self.assertEqual([r['mission'] for r in self.e['dispatch']],list(range(44)))
        for s in ('S1','S2'):
            for a,b in zip(self.e['dispatch'],old['dispatch']):
                self.assertEqual((a['predicate'],a['handler']),(b.get('predicate'),b.get('handler')))
                if a['mission']==37:continue
                pair=self.raw[s,f'{int(b["vtable"],16)+8:08X}']
                self.assertEqual(struct.unpack('<II',pair),(int(a['predicate'],16),int(a['handler'],16)))

    def test_16_event9_home_and_argument_families(self):
        positive={0,2,5,9,10,21,23,24,38,41,42,43}
        self.assertEqual({r['mission'] for r in self.e['dispatch'] if r['event9'] not in ('predicate-false','dispatcher-skip')},positive)
        for s in ('S1','S2'):
            self.assertEqual(struct.unpack_from('<I',self.raw[s,'005BBE0C'],self.raw[s,'005BBE20'][7]*4)[0],0x5bbd31)
            self.at(s,'005BBCB0',0x5bbd5c,'8b bf 98 00 00 00')
            self.call(s,'005BBCB0',0x5bbd68,0x491770)
            self.at(s,'005BBCB0',0x5bbd6d,'3b c7')
            for f,a,h in [('005C6930',0x5c6a51,'3b c5'),('005D7F00',0x5d7f6e,'3b c7'),('005CB180',0x5cb1e5,'3b c3'),('005B7560',0x5b7709,'3b c7'),('005D00A0',0x5d014a,'3b c3'),('005D9D60',0x5d9dce,'3b c7')]:self.at(s,f,a,h)
            self.at(s,'005D9D60',0x5d9d78,'6a 01')
            self.at(s,'005D9D60',0x5d9d81,'6a 00')
            self.assertEqual(struct.unpack_from('<I',self.raw[s,'005B7720'],9*4)[0],0x5b76d7)
            self.at(s,'005D00A0',0x5d00d5,'74 41')
            self.at(s,'005D00A0',0x5d0118,'8b 71 04')

    def test_17_event10_false_tables_and_bounds(self):
        self.assertTrue(all(r['event10']=='predicate-false' for r in self.e['dispatch'] if r['mission']!=37))
        for s in ('S1','S2'):
            self.assertEqual(struct.unpack_from('<I',self.raw[s,'005BBE0C'],self.raw[s,'005BBE20'][8]*4)[0],0x5bbe02)
            for table,jumps,dest in [('005B2230','005B2220',0x5b2219),('005B64F8','005B64E4',0x5b64de),('005BE1A0','005BE190',0x5be189),('005CC634','005CC624',0x5cc61c),('005CD398','005CD380',0x5cd378)]:
                for event in ([10] if table=='005CD398' else [9,10]):
                    self.assertEqual(struct.unpack_from('<I',self.raw[s,jumps],self.raw[s,table][event]*4)[0],dest)
            self.at(s,'005C5420',0x5c5449,'83 f9 07')
            self.at(s,'005B7560',0x5b7594,'83 f9 09')
            self.assertEqual(self.raw[s,'00441880'],bytes.fromhex('33c0c20800'))

    def test_18_wrappers_prepare_context_before_predicates(self):
        rows=[('005BA530',0x5ba541,0x5b8f90,0x5ba547,0x5b2d90),('005BA5C0',0x5ba5d1,0x5b9c40,0x5ba5d7,0x5b2160),('005BA650',0x5ba661,0x5b9000,0x5ba667,0x5be0d0),('005BA6E0',0x5ba6f1,0x5b9060,0x5ba6f7,0x5b63e0),('005BA770',0x5ba781,0x5b90f0,0x5ba787,0x5b2d90),('005BA800',0x5ba811,0x5b9160,0x5ba817,0x5cc540),('005BA890',0x5ba8a1,0x5b9200,0x5ba8a7,0x5cd230)]
        for s in ('S1','S2'):
            for f,a,t,b,u in rows:self.call(s,f,a,t);self.call(s,f,b,u)
            for a,t in [(0x5b9224,0x47a630),(0x5b9249,0x4897b0),(0x5b9254,0x490aa0),(0x5b9260,0x5bc560),(0x5b926b,0x490d00),(0x5b9277,0x5bc560),(0x5b9283,0x5bc560),(0x5b928e,0x490d00),(0x5b929a,0x5bc560)]:self.call(s,'005B9200',a,t)
            self.at(s,'005B9200',0x5b9233,'8b af 3c 01 00 00')
            self.at(s,'005B9200',0x5b923b,'ff 50 08 3b e8 5d 75 19')

    def test_19_mission21_valid_context_then_pointer_equality(self):
        for s in ('S1','S2'):
            self.assertEqual(struct.unpack('<III',self.raw[s,'00849368'])[0],0x572760)
            self.at(s,'005CD230',0x5cd239,'ff 10')
            self.assertEqual(struct.unpack_from('<I',self.raw[s,'005CD380'],self.raw[s,'005CD398'][9]*4)[0],0x5cd330)
            self.at(s,'005CD230',0x5cd34a,'3b 7b 0c')
            self.at(s,'005CD230',0x5cd369,'3b 73 10')
            calls=[r['target'] for r in self.e['callLedgers'][s]['005CD230'] if r['kind']=='direct' and 0x5cd330<=int(r['site'],16)<0x5cd378]
            self.assertEqual(calls,['00573470','00573470'])
            self.assertEqual(self.raw[s,'00573470'],bytes.fromhex('b805000000c3'))

    def test_20_no_implicit_successful_handler_or_troop_closure(self):
        self.assertIn('full-frame/RNG',self.e['contracts']['eventDispatch']['event9Tail'])
        self.assertIn('unexpanded cancellation',self.e['contracts']['eventDispatch']['noGeneralClosure'])
        self.assertIn('Exception cleanup chunks',self.e['contracts']['memoryDomain'])
        self.assertEqual(self.e['contracts']['ownership']['cityReset']['storeWidth'],4)


if __name__ == '__main__':
    parser=argparse.ArgumentParser(add_help=False)
    parser.add_argument('--idb-s1');parser.add_argument('--idb-s2')
    args,remaining=parser.parse_known_args()
    if args.idb_s1 or args.idb_s2:
        e,_,_,_,selected,_=load_evidence()
        for s,path in [('S1',args.idb_s1),('S2',args.idb_s2)]:
            if path:
                verify_raw_id1(path,next(r for r in e['sources'] if r['source']==s),selected)
                print(s+' whole-IDB fingerprint and selected raw-ID1 bytes verified')
    unittest.main(argv=[sys.argv[0]]+remaining)
