"""P0-65 source-only empty-legion redistribution evidence checks.

Reads committed contiguous byte columns, complete-function hashes and call
ledgers. No game/model/IDB parser imports or machine-code execution. Optional
--idb-s1 / --idb-s2 independently verify complete fingerprints and raw ID1 bytes.
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
MANIFEST = ROOT / 'docs/sources/empty-legion-redistribution.json'
DIRECTORY = MANIFEST.with_suffix('')
HEX = frozenset('0123456789abcdefABCDEF')
PRIOR_HASHES = {
    'legion-role-reconciliation': '05afefd64dfba8bb05f31171f5187e30078ea3846f745da60abe57c61a4f57c2',
    'return-route-target-force': 'aceac5caee2d55baa9ab440c315925d0db516101116a97c4f3dbf1adc861d4af',
}


def digest(value): return hashlib.sha256(value).hexdigest()


def read_rows(row):
    address = int(row['start'], 16)
    instructions = []
    for line in (DIRECTORY / row['file']).read_text().splitlines():
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
    evidence = json.loads(MANIFEST.read_text())
    assert {r['id']:r['sha256'] for r in evidence['priorEvidence']} == PRIOR_HASHES
    for r in evidence['priorEvidence']:
        p = ROOT / r['path']
        assert digest(p.read_bytes()) == r['sha256']
        assert json.loads(p.read_text())['sources'] == evidence['sources']
    raw, instructions = {}, {}
    for row in evidence['newRanges']:
        key = row['source'], row['start']
        assert key not in raw
        raw[key], instructions[key] = read_rows(row)
    pairs = {a for s,a in raw if ('S1',a) in raw and ('S2',a) in raw}
    assert {r['start'] for r in evidence['comparisons']} == pairs
    for r in evidence['comparisons']:
        a,b = raw['S1',r['start']],raw['S2',r['start']]
        assert len(a) == len(b) == int(r['endExclusive'],16)-int(r['start'],16)
        assert r['identical'] == (a == b)
        assert r['differingByteCount'] == sum(x != y for x,y in zip(a,b))
        assert r['S1sha256'] == digest(a) and r['S2sha256'] == digest(b)
    assert {(r['source'],r['start']) for r in evidence['sourceSpecificRanges']} == set(raw)-{(s,a) for a in pairs for s in ('S1','S2')}
    return evidence, raw, instructions


def verify_raw_id1(path, identity, selected):
    """Independent low-byte reader of these fingerprinted uncompressed IDA6 IDBs."""
    with Path(path).open('rb') as fp:
        assert hashlib.file_digest(fp,'sha256').hexdigest() == identity['idbSha256']
        with mmap.mmap(fp.fileno(),0,access=mmap.ACCESS_READ) as data:
            assert data[:4] == b'IDA1' and struct.unpack_from('<H',data,0x1e)[0] == 6
            section = struct.unpack_from('<Q',data,0xe)[0]
            assert data[section] == 0
            length = struct.unpack_from('<Q',data,section+1)[0]
            body = section+9
            assert body+length <= len(data) and data[body:body+4] == b'VA*\0'
            count = struct.unpack_from('<I',data,body+8)[0]
            assert 0 < count <= (0x2000-0x14)//8
            segments,offset = [],body+0x2000
            for i in range(count):
                a,b = struct.unpack_from('<II',data,body+0x14+8*i)
                assert a < b
                segments.append((a,b,offset));offset += 4*(b-a)
            assert offset <= body+length
            for a,expected in selected.items():
                address = int(a,16)
                matches = [(lo,hi,p) for lo,hi,p in segments if lo <= address and address+len(expected) <= hi]
                assert len(matches) == 1
                lo,_,offset = matches[0]; offset += 4*(address-lo)
                assert data[offset:offset+4*len(expected):4] == expected, (identity['source'],a)


class EmptyLegionSource(unittest.TestCase):
    @classmethod
    def setUpClass(cls): cls.e,cls.raw,cls.instructions = load_evidence()

    def at(self,s,f,a,hexbytes):
        value = bytes.fromhex(hexbytes);offset = a-int(f,16)
        self.assertEqual(self.raw[s,f][offset:offset+len(value)],value)

    def call(self,s,f,a,target):
        b = self.raw[s,f];o = a-int(f,16)
        self.assertEqual(b[o],0xe8)
        self.assertEqual(a+5+struct.unpack_from('<i',b,o+1)[0],target)

    def test_01_identity_scope_and_budget(self):
        self.assertEqual(self.e['profileId'],'source-idb-S1-S2-empty-legion-redistribution-v1')
        self.assertEqual(self.e['baselineCommit'],'116c6dd44d7fc1d102b3dab6f9716a8dde3a4abe')
        self.assertEqual([r['idbSha256'] for r in self.e['sources']],[
            'c591cb40ce6d6be9246148002532dedc042463f36cd39c5ed300b7c449feefab',
            'aa7f2c983b266633d6e23c494d4f8e1b03e5251632505cae103e176ae850dfd8'])
        for k in ('stockOriginalVerified','originalExeExecuted','recordedExeHashesIndependentlyVerified'):
            self.assertIs(self.e[k],False)
        self.assertTrue(all('血色' in r['recordedInputPath'] for r in self.e['sources']))
        self.assertEqual(self.e['adoption'],{'PC-PK1.1':'compatibility-reconstruction','PC-Vanilla-assumed':'compatibility-assumption','PS2-Wii':'open'})
        self.assertEqual((len(self.raw),sum(map(len,self.raw.values()))),(155,26651))
        self.assertEqual(self.e['rangeBudget'],dict(sourceSpecificIntervals=1,newIntervals=155,sameShapePairs=77,totalSelectedBytesBothSources=26651,identicalSameShapePairs=73,differentSameShapePairs=4))
        self.assertEqual([(r['start'],r['differingByteCount']) for r in self.e['comparisons'] if not r['identical']],
                         [('00472150',4),('004C0C30',11),('0079B830',1084),('0079C2B0',32)])

    def test_02_every_code_range_has_complete_call_ledger(self):
        for r in self.e['newRanges']:
            self.assertEqual(r['boundaryKind'],'complete-IDB-function' if r['kind']=='code' else 'bounded-data')
            if r['kind'] != 'code': continue
            s,f = r['source'],r['start'];ledger = self.e['callLedgers'][s][f]
            calls = [(a,b) for a,b in self.instructions[s,f] if b[0]==0xe8 or (b[0]==0xff and b[1]&0x38==0x10)]
            self.assertEqual([f'{a:08X}' for a,_ in calls],[r['site'] for r in ledger])
            for (a,b),item in zip(calls,ledger):
                self.assertEqual(b,bytes.fromhex(item['bytes']))
                self.assertEqual(item['kind'],'direct' if b[0]==0xe8 else 'indirect')
                if b[0]==0xe8: self.assertEqual(a+5+struct.unpack_from('<i',b,1)[0],int(item['target'],16))

    def test_03_dispatch_force_and_empty_gates(self):
        for s in ('S1','S2'):
            f='004BE2A0'
            for a,t in [(0x4be2c5,0x47a630),(0x4be2fe,0x490aa0),(0x4be30a,0x4bbdb0),(0x4be31f,0x4b80a0),(0x4be33b,0x4b9550)]:self.call(s,f,a,t)
            self.at(s,f,0x4be2df,'3b c7 0f 8c 92 04 00 00 83 f8 29 0f 8f 89 04 00 00')
            self.at(s,f,0x4be312,'85 c0 75 23')
            self.at(s,f,0x4be316,'8b 44 24 68 50 57 53 8b cd')
            self.at(s,f,0x4be340,'85 c0 0f 85 92 01 00 00 8b 46 08 83 f8 01 0f 85 54 01 00 00')

    def test_04_nonprimary_merge_parameter_direction(self):
        for s in ('S1','S2'):
            f='004BE2A0'
            self.at(s,f,0x4be4a8,'6a 01 8b cb')
            for a,t in [(0x4be4ac,0x481240),(0x4be4b7,0x490ad0),(0x4be4c0,0x4bd3b0)]:self.call(s,f,a,t)
            self.at(s,f,0x4be4bc,'50 56 8b cd')
            self.at(s,f,0x4be4d7,'c2 08 00')

    def test_05_ordinal_scan_first_match_and_null_force_conversion(self):
        for s in ('S1','S2'):
            f='00481240'
            self.at(s,f,0x481244,'83 f8 01');self.at(s,f,0x48124d,'7c 52 83 f8 08 7f 4d')
            self.call(s,f,0x481266,0x490ad0);self.call(s,f,0x48126e,0x47a630)
            self.call(s,f,0x481280,0x491270)
            self.at(s,f,0x48128e,'3b c7 75 09 8b 4c 24 14 39 4e 08 74 10 43 83 fb 2f 7c bf')
            self.at(s,'00491270',0x491275,'85 f6 57 74 36')
            self.at(s,'00491270',0x4912a9,'78 05 83 f8 2e 7e 03 83 c8 ff')

    def test_06_primary_anchor_and_collection_domain(self):
        for s in ('S1','S2'):
            self.at(s,'00481210',0x481210,'8b 49 04')
            self.call(s,'00481210',0x48121a,0x490b00);self.call(s,'00481210',0x481222,0x47a630)
            self.at(s,'00481210',0x48122c,'74 08 8b 86 98 00 00 00')
            f='004CE2F0'
            for a,t in [(0x4ce2f8,0x49f150),(0x4ce302,0x47a630),(0x4ce316,0x491270),(0x4ce326,0x490a10),(0x4ce32e,0x47a630),(0x4ce348,0x4ba130)]:self.call(s,f,a,t)
            self.at(s,f,0x4ce341,'3b d8 75 08')
            self.at(s,f,0x4ce34d,'47 83 ff 2a 7c cd')

    def test_07_primary_filter_field5_is_legion_not_force(self):
        for s in ('S1','S2'):
            table=self.raw[s,'0079BF58']
            self.assertEqual(struct.unpack_from('<I',table,0x10)[0],0x47b180)
            self.assertEqual(struct.unpack_from('<I',table,0x44)[0],0x47c320)
            self.call(s,'0047B180',0x47b186,0x4c0c30)
            self.assertEqual(struct.unpack_from('<I',self.raw[s,'004C1620'],20)[0],0x4c0f38)
            self.at(s,'004C0C30',0x4c0f38,'8b 16 8b ce ff 52 44')
            self.assertEqual(self.raw[s,'0047C320'],bytes.fromhex('8b4138c3'))
            self.assertEqual(struct.unpack_from('<I',self.raw[s,'00659034'],4)[0],0x658fd2)
            self.at(s,'00658FB0',0x658fdc,'3b d1 0f 95 c0')
            self.at(s,'004BE2A0',0x4be3bf,'6a 01 56')
            self.at(s,'004BE2A0',0x4be3cc,'50 6a 05')

    def test_08_city_allocated_delegates_live_valid_predicate(self):
        self.assertIs(self.e['contracts']['cityType']['canonicalValidConstant'],True)
        self.assertIs(self.e['contracts']['cityType']['canonicalAllocatedConstant'],True)
        for s in ('S1','S2'):
            self.at(s,'0047C2B0',0x47c2cd,'c7 06 58 bf 79 00')
            self.assertEqual(struct.unpack_from('<II',self.raw[s,'0079BF58'],4),(0x41c130,0x47b150))
            self.assertEqual(self.raw[s,'0041C130'],bytes.fromhex('8b01ff6008'))
            self.at(s,'0047B150',0x47b150,'8b 01 ff 50 24 83 e8 06')
            self.assertEqual(struct.unpack_from('<I',self.raw[s,'0079BF58'],0x24)[0],0x47b110)
            self.assertEqual(self.raw[s,'0047B110'],bytes.fromhex('b806000000c3'))
            self.call(s,'004BC780',0x4bc7ef,0x47a600)

    def test_09_nearest_directed_distance_strict_min_and_ties(self):
        for s in ('S1','S2'):
            f='0049F1D0'
            for a,t in [(0x49f20d,0x49ef50),(0x49f216,0x47c4c0),(0x49f229,0x49e450),(0x49f235,0x49e450),(0x49f23c,0x47b480),(0x49f27b,0x472150)]:self.call(s,f,a,t)
            self.at(s,f,0x49f21b,'8b 94 24 c8 00 00 00 8b 4c 24 14 52 8b f8')
            self.at(s,f,0x49f22e,'8b 4c 24 14 57 8b d8')
            self.at(s,f,0x49f23a,'50 53')
            self.at(s,f,0x49f244,'3b c5 7d 10')
            self.at(s,f,0x49f258,'75 0d')
            self.at(s,'0047B480',0x47b49a,'6b c0 2a 0f b6 84 08 30 b8 79 00')
            self.at(s,'0049E450',0x49e4ac,'c1 ea 05 83 e2 7f')

    def test_10_rng_singleton_gate_and_source_specific_hook(self):
        for s in ('S1','S2'):
            self.at(s,'00472150',0x472154,'83 f9 02 7c 27 66 85 c9 74 22')
            self.at(s,'00472150',0x472163,'69 c0 65 89 07 6c 05 39 30 00 00 a3 44 5d 8a 00')
            self.at(s,'00472150',0x472180,'66 33 c0 c3')
        self.at('S1','00472150',0x47215e,'a1 44 5d 8a 00')
        self.call('S2','00472150',0x47215e,0x8eb010)
        self.assertEqual(self.raw['S2','008EB010'],bytes.fromhex('a12003fe7f03050800fe7f03051400fe7f25ffff00000305445d8a00c3'))
        self.assertNotIn(('S1','008EB010'),self.raw)

    def test_11_primary_loop_direction_and_fallback_discarded_lookup(self):
        for s in ('S1','S2'):
            f='004BE2A0'
            self.at(s,f,0x4be404,'56 57 8b cd');self.call(s,f,0x4be408,0x4bd3b0)
            self.call(s,f,0x4be40f,0x4b9550);self.at(s,f,0x4be414,'85 c0 75 21')
            self.call(s,f,0x4be44c,0x4b9550);self.at(s,f,0x4be451,'85 c0 0f 85 1f 03 00 00')
            self.at(s,f,0x4be459,'bb 02 00 00 00')
            self.call(s,f,0x4be465,0x481240)
            self.at(s,f,0x4be46a,'53 b9 58 19 20 07')
            self.call(s,f,0x4be470,0x490ad0)
            self.at(s,f,0x4be484,'56 57 8b cd');self.call(s,f,0x4be488,0x4bd3b0)
            self.at(s,f,0x4be48d,'43 83 fb 08 7e cd')

    def test_12_merge_leader_demotion_clear_then_refresh(self):
        for s in ('S1','S2'):
            f='004BD3B0'
            self.at(s,f,0x4bd3ca,'8b 6c 24 3c 8b 45 0c')
            self.at(s,f,0x4bd3f3,'83 be a0 00 00 00 01 7f 54')
            for a,t in [(0x4bd411,0x489730),(0x4bd438,0x486890),(0x4bd44b,0x4898f0),(0x4bd455,0x4a0940),(0x4bd470,0x4bca30)]:self.call(s,f,a,t)
            self.at(s,f,0x4bd43d,'3b 44 24 10 75 04 6a 02 eb 02 6a 03')
            self.at(s,f,0x4bd450,'6a ff 55 8b cb')
            self.at(s,f,0x4bd475,'8b 74 24 48 33 ff 3b f7 0f 84 8a 01 00 00')

    def test_13_two_snapshot_copies_and_sequential_member_setter(self):
        for s in ('S1','S2'):
            self.at(s,'004BD3B0',0x4bd4ab,'83 c5 30 55')
            self.call(s,'004BD3B0',0x4bd4b7,0x49f820)
            self.call(s,'004BD3B0',0x4bd4cf,0x4a33b0)
            self.call(s,'004A33B0',0x4a3403,0x49f820)
            self.call(s,'004A33B0',0x4a3434,0x4a32f0)
            self.call(s,'0049F820',0x49f867,0x47bed0)
            self.call(s,'0049F820',0x49f871,0x47c1b0)
            self.assertNotIn('0047A600',[r.get('target') for r in self.e['callLedgers'][s]['0049F820']])
            self.at(s,'004A32F0',0x4a3353,'85 ff 89 be 94 00 00 00')
            self.call(s,'004A32F0',0x4a339a,0x47cd50)

    def test_14_facility_scan_bound_and_mutable_call_boundary(self):
        for s in ('S1','S2'):
            f='004BD3B0'
            self.call(s,f,0x4bd4ee,0x47a630);self.call(s,f,0x4bd4fc,0x487e10)
            self.at(s,f,0x4bd51a,'ff 52 44 3b c7 75 18')
            self.call(s,f,0x4bd534,0x4ad550)
            self.at(s,f,0x4bd539,'45 81 fd 00 40 00 00 7c 9e')
            self.call(s,'004AD550',0x4ad5eb,0x4876a0)
            self.at(s,'004AD550',0x4ad632,'6a 00 56 6a 09')
            self.at(s,'004AD550',0x4ad653,'6a 00 56 6a 0a')

    def test_15_destination_leader_home_after_base_scan_and_mismatch_rehome(self):
        for s in ('S1','S2'):
            self.at(s,'0047E3B0',0x47e3b0,'8b 49 0c')
            self.at(s,'0047E3B0',0x47e3cc,'74 08 8b 86 98 00 00 00')
            f='004BD3B0'
            self.call(s,f,0x4bd546,0x47e3b0)
            self.call(s,f,0x4bd55a-1,0x47a630)
            self.call(s,f,0x4bd57c,0x47bed0)
            self.at(s,f,0x4bd5b4,'ff 52 44 8b f8 8b 06 8b ce ff 50 44 3b f8 74 09')
            self.call(s,f,0x4bd5c8,0x4a8270)
            self.at(s,f,0x4bd60d,'8b 55 00 57 8b cd ff 52 20')

    def test_16_real_constructor_proves_reset_slot(self):
        for s in ('S1','S2'):
            self.at(s,'0047EB10',0x47eb18,'c7 06 b0 bf 79 00')
            self.assertEqual(struct.unpack_from('<I',self.raw[s,'0079BFB0'],0x20)[0],0x47e470)
            self.assertEqual(struct.unpack_from('<I',self.raw[s,'0079BFB0'],0x24)[0],0x5733a0)
            self.assertEqual(self.raw[s,'00423230'],bytes.fromhex('c20400'))

    def test_17_reset_scalar_writes_order_flags_and_roster(self):
        for s in ('S1','S2'):
            f='0047E470'
            self.call(s,f,0x47e478,0x423230)
            self.at(s,f,0x47e47d,'83 c8 ff 33 c9 89 4e 08 89 4e 24 89 4e 28 88 4e 2c 8b ce')
            self.at(s,f,0x47e490,'89 46 04 89 46 0c 89 46 10 89 46 14 89 46 18 89 46 1c 89 46 20')
            self.call(s,f,0x47e4a5,0x47e280);self.at(s,f,0x47e4aa,'8d 4e 30');self.call(s,f,0x47e4ad,0x47be50)
            self.at(s,'0047E280',0x47e287,'bf ff f7 ff ff 83 ce ff')
            self.at(s,'0047E280',0x47e290,'83 fa 0b 75 0a 8b 48 28 23 cf 89 70 20')
            self.at(s,'0047E280',0x47e352,'83 c2 06 83 fa 0c 89 48 28 0f 8c 2f ff ff ff')

    def test_18_extinction_full_entry_but_open_transitive_helpers(self):
        for s in ('S1','S2'):
            boundaries=self.e['extinctionHelperBoundaries'][s]
            direct=[r for r in self.e['callLedgers'][s]['004B80A0'] if r['kind']=='direct']
            self.assertEqual([(r['site'],r['target']) for r in boundaries],[(r['site'],r['target']) for r in direct])
            for r in boundaries:
                self.assertEqual(r['functionStart'],r['target'])
                self.assertGreater(int(r['endExclusive'],16),int(r['target'],16))
            for a,t in [(0x4b824b,0x4bccd0),(0x4b826d,0x4ae790),(0x4b8278,0x4bbaa0),(0x4b82f5,0x4cf480),(0x4b8413,0x4ae8e0),(0x4b8420,0x4b7030),(0x4b8466,0x4ce4c0),(0x4b848b,0x4bd3b0),(0x4b84de,0x4a92c0),(0x4b84e6,0x4b6fd0),(0x4b84ed,0x4a0ec0)]:self.call(s,'004B80A0',a,t)
            self.at(s,'004B80A0',0x4b8272,'57 53 6a 0f')
            self.at(s,'004B80A0',0x4b8485,'8b 00 57 50 8b cd')

    def test_19_explicit_open_boundaries_and_no_stock_claim(self):
        c=self.e['contracts']
        for k in ('sourceValidGuard','destinationValidGuard','samePointerGuard','sameForceGuard'):
            self.assertIs(c['merge'][k],False)
        self.assertIs(c['primary']['fallbackDoesNotUseLookupResult'],True)
        self.assertIs(c['primary']['fallbackEarlyPresenceExit'],False)
        self.assertIs(c['extinction']['fullTransitiveClosure'],False)
        for k in ('fullNativeTransaction','stockOriginalVerified','originalSaveEquivalence','queryHooksExecuted'):
            self.assertIs(c['claims'][k],False)
        for key in ('004AD550','004A8270','004BCA30','geography'):
            self.assertIn(key,c['mutableBoundaries'])
        self.assertEqual(c['reset']['untouchedPadding'],['2D','2E','2F'])

    def test_20_legion_presence_city_and_officer_not_or(self):
        self.assertIn('BOTH',self.e['contracts']['entry']['legionPresence'])
        for source in ('S1','S2'):
            f='004B9550'
            self.at(source,f,0x4b9583,'3b c3 74 0c')
            self.at(source,f,0x4b9587,'47 83 ff 2a 7c d5 5f 5e 33 c0 5b c3')
            self.at(source,f,0x4b9593,'33 ff 57')
            self.call(source,f,0x4b959b,0x490b00)
            self.call(source,f,0x4b95a3,0x47a630)
            self.at(source,f,0x4b95b6,'3b c3 74 0f')
            self.at(source,f,0x4b95ba,'47 81 ff 4c 04 00 00 7c d2 5f 5e 33 c0 5b c3')
            self.at(source,f,0x4b95c9,'5f 5e b8 01 00 00 00 5b c3')

    def test_21_generic_building_validity_is_signed_kind_range(self):
        self.assertEqual(self.e['contracts']['genericBuildingType']['canonicalValidityExpression'],
                         '0 <= signed(rawBuildingKind) <= 63')
        for source in ('S1','S2'):
            self.at(source,'004880A0',0x4880a8,'c7 06 18 c7 79 00')
            table=self.raw[source,'0079C718']
            self.assertEqual(struct.unpack_from('<II',table,4),(0x41c130,0x486400))
            self.assertEqual(struct.unpack_from('<I',table,0x24)[0],0x573470)
            self.assertEqual(self.raw[source,'00573470'],bytes.fromhex('b805000000c3'))
            self.assertEqual(self.raw[source,'00486400'],bytes.fromhex(
                '568bf18b06ff502483f80575138b460885c07c0c83f83f7f07b8010000005ec333c05ec3'))

    def test_22_gate_and_port_subtype_validity_constant_in_canonical_domain(self):
        specifications=[('gate','0079C170','004834E0','006903A0','004838E0',0x4838e8,7),
                        ('port','0079C7D0','0048D7C0','00557AC0','0048DD70',0x48dd78,8)]
        for source in ('S1','S2'):
            for name,vt,getter,type_getter,ctor,store,type_id in specifications:
                c=self.e['contracts']['gatePortType'][name]
                self.assertIs(c['canonicalValidConstant'],True)
                self.assertIs(c['canonicalAllocatedConstant'],True)
                self.assertEqual(c['constantType'],type_id)
                self.at(source,ctor,store,'c7 06 '+int(vt,16).to_bytes(4,'little').hex(' '))
                table=self.raw[source,vt]
                self.assertEqual(struct.unpack_from('<II',table,4),(0x41c130,int(getter,16)))
                self.assertEqual(struct.unpack_from('<I',table,0x24)[0],int(type_getter,16))
                self.assertEqual(self.raw[source,type_getter],bytes([0xb8,type_id,0,0,0,0xc3]))
                self.assertEqual(self.raw[source,getter],bytes.fromhex('8b01ff502483e8')+bytes([type_id])+bytes.fromhex('f7d81bc040c3'))


if __name__ == '__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--idb-s1');parser.add_argument('--idb-s2')
    args,extra=parser.parse_known_args()
    if args.idb_s1 or args.idb_s2:
        e,raw,_=load_evidence()
        for source,path in [('S1',args.idb_s1),('S2',args.idb_s2)]:
            if path:
                verify_raw_id1(path,next(r for r in e['sources'] if r['source']==source),{a:v for (s,a),v in raw.items() if s==source})
                print(f'{source}: complete IDB fingerprint and independent raw ID1 verification passed')
    unittest.main(argv=[sys.argv[0]]+extra,verbosity=2)
