"""P0-58 bounded legion/governor source checks; standard library only.

Checks committed contiguous byte columns, hashes, prior evidence chains, exact
calls/branches/stores/tables and explicit projection boundaries. Does not execute
the role model, IDB parser, EXE, native code, capacity hooks or mission callbacks.
"""
import hashlib
import json
from pathlib import Path
import struct
import unittest
from check_facility_mission_cancellation_evidence import HEX, read_range

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / 'docs/sources/legion-role-reconciliation.json'
DIRECTORY = MANIFEST.with_suffix('')


def instruction_rows(directory, row):
    lines = (directory / row['file']).read_text().splitlines()
    if 'lineStart' in row:
        lines = lines[row['lineStart']-1:row['lineStart']-1+row['lineCount']]
    result = []
    for line in lines:
        if not line.strip() or line.lstrip().startswith(';'): continue
        tokens = line.split(); values = []
        for token in tokens[1:]:
            if len(token) != 2 or not set(token) <= HEX: break
            values.append(int(token, 16))
        result.append((int(tokens[0], 16), bytes(values)))
    return result


def load_evidence():
    e = json.loads(MANIFEST.read_text()); raw = {}; instructions = {}; prior = {}
    for row in e['priorEvidence']:
        p = ROOT / row['path']
        assert hashlib.sha256(p.read_bytes()).hexdigest() == row['sha256']
        prior[row['id']] = p.with_suffix(''), json.loads(p.read_text())
    for row in e['containers']:
        p = DIRECTORY / row['file']
        assert hashlib.sha256(p.read_bytes()).hexdigest() == row['sha256']
        assert len(p.read_text().splitlines()) == row['lineCount']
    rows = []
    for ref in e['referencedRanges']:
        directory, old = prior[ref['evidence']]
        r = next(r for r in old.get('ranges', old.get('newRanges', []))
                 if (r['source'],r['start'],r['endExclusive']) == (ref['source'],ref['start'],ref['endExclusive']))
        assert all(ref[k] == r[k] for k in ('source','start','endExclusive','sha256'))
        rows.append((directory,r))
    rows.extend((DIRECTORY,r) for r in e['newRanges'])
    for directory,r in rows:
        key = r['source'],r['start']; assert key not in raw
        raw[key] = read_range(directory,r); instructions[key] = instruction_rows(directory,r)
    for r in e['comparisons']:
        for s in ('S1','S2'):
            assert hashlib.sha256(raw[s,r['start']]).hexdigest() == r[s+'sha256']
        assert r['identical'] == (raw['S1',r['start']] == raw['S2',r['start']])
    for r in e['sourceSpecificRanges']:
        assert hashlib.sha256(raw[r['source'],r['start']]).hexdigest() == r['sha256']
        assert ('S1',r['start']) not in raw
    return e,raw,instructions


class LegionRoleSource(unittest.TestCase):
    @classmethod
    def setUpClass(cls): cls.e,cls.raw,cls.instructions = load_evidence()

    def at(self,s,fn,address,expected):
        b = bytes.fromhex(expected); off = address-int(fn,16)
        self.assertEqual(self.raw[s,fn][off:off+len(b)],b)

    def call(self,s,fn,address,target,opcode=0xe8):
        b = self.raw[s,fn];off=address-int(fn,16)
        self.assertEqual(b[off],opcode)
        self.assertEqual(address+5+struct.unpack_from('<i',b,off+1)[0],target)

    def test_01_source_hashes_budgets_and_adoption(self):
        self.assertEqual(self.e['baselineCommit'],'6d62e86caddd50887b4d4792cb1918526e980722')
        self.assertEqual(self.e['profileId'],'source-idb-S1-S2-stable-legion-roles-v1')
        self.assertEqual([s['idbSha256'] for s in self.e['sources']],[
            'c591cb40ce6d6be9246148002532dedc042463f36cd39c5ed300b7c449feefab',
            'aa7f2c983b266633d6e23c494d4f8e1b03e5251632505cae103e176ae850dfd8'])
        self.assertTrue(all('血色' in s['recordedInputPath'] for s in self.e['sources']))
        self.assertEqual((len(self.e['newRanges']),len(self.e['referencedRanges']),len(self.raw)),(88,111,199))
        self.assertEqual(sum(map(len,self.raw.values())),21881)
        self.assertEqual(self.e['rangeBudget']['newCorpusBytes'],12927)
        self.assertEqual((len(self.e['comparisons']),len(self.e['sourceSpecificRanges'])),(98,3))
        self.assertEqual([r['start'] for r in self.e['comparisons'] if not r['identical']],
                         ['004811E0','004890F0','0049D420','0049D540'])
        for k in ('stockOriginalVerified','originalExeExecuted','recordedExeHashesIndependentlyVerified'):
            self.assertFalse(self.e[k])
        self.assertEqual(self.e['adoption'],{'PC-PK1.1':'compatibility-reconstruction','PC-Vanilla-assumed':'compatibility-assumption','PS2-Wii':'open'})

    def test_02_complete_call_ledgers_from_bytes(self):
        self.assertEqual(len(self.e['callLedgers']),12)
        for s in ('S1','S2'):
            for fn,ledger in self.e['callLedgers'].items():
                calls=[(a,b) for a,b in self.instructions[s,fn] if b[0]==0xe8 or (b[0]==0xff and b[1]&0x38==0x10)]
                self.assertEqual([f'{a:08X}' for a,_ in calls],[r['site'] for r in ledger])
                for (a,b),r in zip(calls,ledger):
                    self.assertEqual(b,bytes.fromhex(r['bytes']))
                    if b[0]==0xe8:
                        self.assertEqual(a+5+int.from_bytes(b[1:5],'little',signed=True),int(r['target'],16))
                        self.assertEqual(r['kind'],'direct')
                    else:self.assertEqual(r['kind'],'indirect')

    def test_03_legion_entry_gates_scan_bounds_and_order(self):
        for s in ('S1','S2'):
            f='004BE2A0'
            for a,t in [(0x4be2c5,0x47a630),(0x4be30a,0x4bbdb0),(0x4be31f,0x4b80a0),
                        (0x4be33b,0x4b9550),(0x4be526,0x490b00),(0x4be52e,0x47a630),
                        (0x4be557,0x47c1b0),(0x4be57c,0x4aa200),(0x4be6fd,0x4a0940),
                        (0x4be70a,0x490d00),(0x4be713,0x487e10),(0x4be73b,0x4bca30)]:self.call(s,f,a,t)
            self.at(s,f,0x4be2df,'3b c7 0f 8c 92 04 00 00 83 f8 29 0f 8f 89 04 00 00')
            self.at(s,f,0x4be340,'85 c0 0f 85 92 01 00 00')
            self.at(s,f,0x4be561,'81 ff 4c 04 00 00')
            self.at(s,f,0x4be56d,'6a 00 6a 00 68 90 ef 4c 00 6a 01')
            self.at(s,f,0x4be738,'6a 00 57')
            self.at(s,f,0x4be740,'45 83 fd 57 7c be')

    def test_04_force_and_corps_use_distinct_allocated_valid_city_gates(self):
        for s in ('S1','S2'):
            self.call(s,'004BBDB0',0x4bbe09,0x4cf480)
            self.at(s,'004BBDB0',0x4bbdf8,'6a 0f')
            self.call(s,'004BBDB0',0x4bbe46,0x490a10)
            self.call(s,'004BBDB0',0x4bbe4e,0x47a630)
            self.at(s,'004BBDB0',0x4bbe73,'83 fb 2a 7c c8')
            self.call(s,'004CF480',0x4cf492,0x47a630)
            self.call(s,'004CF480',0x4cf4be,0x47a600)
            self.call(s,'004CF480',0x4cf4dc,0x489fe0)
            self.at(s,'004CF480',0x4cf4ee,'81 ff 4c 04 00 00 7c ba')
            self.call(s,'004B9550',0x4b9568,0x490a10)
            self.call(s,'004B9550',0x4b9570,0x47a630)
            self.call(s,'004B9550',0x4b959b,0x490b00)
            self.call(s,'004B9550',0x4b95a3,0x47a630)
            self.at(s,'004B9550',0x4b9588,'83 ff 2a 7c d5')
            self.at(s,'004B9550',0x4b95bb,'81 ff 4c 04 00 00 7c d2')

    def test_05_status_mask15_and_separate_validity_vtables(self):
        for s in ('S1','S2'):
            self.assertEqual(struct.unpack('<10I',self.raw[s,'00488B9C']),
                (0x488b8d,0x488b41,0x488b49,0x488b51,0x488b59,0x488b61,0x488b69,0x488b71,0x488b79,0x488b83))
            self.at(s,'00488B30',0x488b30,'8b 44 24 04 40 83 f8 09 77 5d')
            for a,v in [(0x488b45,1),(0x488b4d,2),(0x488b55,4),(0x488b5d,8)]:self.at(s,'00488B30',a,f'83 e0 {v:02x}')
            self.assertEqual(struct.unpack_from('<II',self.raw[s,'0079C780'],4),(0x4883f0,0x488430))
            self.at(s,'00488430',0x48844c,'83 fe 06 74 0c 83 fe 08 74 07')
            self.assertEqual(struct.unpack('<I',self.raw[s,'0079BF60'])[0],0x47b150)
            self.assertEqual(struct.unpack('<II',self.raw[s,'0079BF98']),(0x47b2b0,0x47c320))
            self.assertEqual(struct.unpack_from('<II',self.raw[s,'0079C780'],0x40),(0x47b2b0,0x4883b0))
            self.at(s,'0047C320',0x47c320,'8b 41 38 c3')
            self.at(s,'004883B0',0x4883b0,'8b 81 94 00 00 00 c3')
            self.at(s,'0065D6C0',0x65d6c0,'8b 41 04 c3')

    def test_06_leader_comparator_capacity_office_derived_leadership_pointer(self):
        for s in ('S1','S2'):
            f='004CEF90'
            for a,t in [(0x4cefbf,0x488c00),(0x4cefc8,0x488c00),(0x4cefe6,0x48a4f0),
                        (0x4ceff0,0x48a4f0),(0x4cf028,0x489070),(0x4cf032,0x489070)]:self.call(s,f,a,t)
            self.at(s,f,0x4cefed,'0f b7 d8')
            self.at(s,f,0x4ceff5,'0f b7 c0')
            self.at(s,f,0x4cf009,'8b 86 a4 00 00 00 8b 8f a4 00 00 00')
            self.at(s,f,0x4cf01d,'0f 9c c2')
            self.at(s,f,0x4cf02f,'0f b6 d8')
            self.at(s,f,0x4cf042,'0f 9f c1')
            self.at(s,f,0x4cf04b,'3b f7 5b 1b c0')
            self.at(s,'00489070',0x489070,'8a 81 70 01 00 00 c3')
            self.at(s,'00489080',0x489080,'8a 81 71 01 00 00 c3')

    def test_07_sort_flags_algorithm_only_and_left_true_first(self):
        for s in ('S1','S2'):
            self.call(s,'004AA200',0x4aa2c3,0x4a8f40)
            self.call(s,'004AA200',0x4aa2ca,0x4a8ff0)
            self.call(s,'004A8F40',0x4a8fb2,0x4a69e0)
            self.call(s,'004A8FF0',0x4a9093,0x4a6b70)
            self.at(s,'004A69E0',0x4a6b44,'ff 54 24 34 83 c4 10 85 c0 75 0c')
            self.at(s,'004A6B70',0x4a6c9e,'ff 54 24 38 83 c4 10 85 c0 74 0a 8b 14 b7 89 14 ab')

    def test_08_old_leader_home_condition_and_transient_clear_before_status(self):
        for s in ('S1','S2'):
            f='004BE2A0'
            self.call(s,f,0x4be5c5,0x488c10)
            self.at(s,f,0x4be5e3,'8b 8d 98 00 00 00 8b f8 8b 83 98 00 00 00 3b c1 74 38')
            self.call(s,f,0x4be5f7,0x489730)
            self.at(s,f,0x4be629,'6a 02 eb 37')
            self.at(s,f,0x4be65a,'6a 00 57')
            self.call(s,f,0x4be65d,0x4b3a20)
            self.at(s,f,0x4be662,'6a 03 8b cb')
            self.call(s,f,0x4be666,0x4898f0)
            self.call(s,f,0x4be66d,0x488c00)
            self.at(s,f,0x4be674,'75 76 6a 01 8b cd')
            self.call(s,f,0x4be67a,0x4898f0)
            self.call(s,f,0x4be681,0x489730)
            self.at(s,f,0x4be6cb,'83 bf a0 00 00 00 02 75 0d 3b fd 74 09 6a 03')
            self.call(s,f,0x4be6dc,0x4898f0)
            self.call(s,f,0x4be6e7,0x4b3a20)
            self.call(s,f,0x4be6fd,0x4a0940)

    def test_09_leader_setter_only_scalar_id_gate(self):
        for s in ('S1','S2'):
            self.call(s,'004A0940',0x4a0946,0x47a630)
            self.call(s,'004A0940',0x4a0969,0x47e110)
            self.at(s,'004A0940',0x4a0956,'83 f8 ff 74 0b 85 c0 7c 0f 3d 4b 04 00 00 7f 08')
            self.assertEqual(self.raw[s,'0047E110'],bytes.fromhex('8b 44 24 04 83 f8 ff 74 0b 85 c0 7c 0a 3d 4b 04 00 00 7f 03 89 41 0c c2 04 00'))
            self.at(s,'004898F0',0x489902,'89 81 a0 00 00 00 c2 04 00')

    def test_10_refresh_zero_roster_filter_last_leader_shortcut(self):
        for s in ('S1','S2'):
            f='004BCA30'
            self.at(s,f,0x4bca93,'39 6c 24 48')
            self.at(s,f,0x4bca9b,'0f 84 82 00 00 00')
            self.at(s,f,0x4bcb23,'6a 0f 53')
            self.call(s,f,0x4bcb30,0x4cf360)
            self.at(s,f,0x4bcb3e,'68 e0 95 4b 00')
            self.call(s,f,0x4bcb47,0x4bc870)
            self.at(s,f,0x4bcb70,'83 b8 a0 00 00 00 01 7f 04 89 44 24 44 39 6c 24 48 75 dd')
            self.call(s,f,0x4bcb92,0x4b2090)
            self.call(s,'004CF360',0x4cf373,0x487e10)
            self.call(s,'004CF360',0x4cf37f,0x487bc0)
            self.call(s,'004CF360',0x4cf3af,0x47a600)
            self.call(s,'004CF360',0x4cf3be,0x489fe0)
            self.at(s,'004B95E0',0x4b95e9,'ff 50 44 3b 44 24 0c 75 12')
            self.call(s,'004B95E0',0x4b95f4,0x489730)
            self.call(s,'004BBA10',0x4bba5f,0x47a600)

    def test_11_governor_own_comparator_not_office_or_leader_sort(self):
        for s in ('S1','S2'):
            self.at(s,'004B2090',0x4b2139,'57 57 68 60 f1 4c 00 57')
            self.call(s,'004B2090',0x4b2145,0x4aa200)
            f='004CF160'
            self.at(s,f,0x4cf194,'8b 87 a0 00 00 00 83 f8 01 7e 09')
            self.at(s,f,0x4cf1cf,'66 3b c3 75 26')
            for a,t in [(0x4cf1c1,0x48a4f0),(0x4cf1ca,0x48a4f0),(0x4cf1d6,0x489070),
                        (0x4cf202,0x489080),(0x4cf20b,0x489080)]:self.call(s,f,a,t)
            self.at(s,f,0x4cf22e,'66 8b 8f ae 00 00 00 33 c0 66 8b 86 ae 00 00 00 66 3b c1 75 b7')
            self.at(s,f,0x4cf243,'8b 07 8b cf ff 50 28')
            self.at(s,f,0x4cf257,'0f 9c c1')

    def test_12_governor_cleanup_and_empty_event_after_clear(self):
        for s in ('S1','S2'):
            f='004BCA30'
            self.at(s,f,0x4bcbcd,'3b f8 8b 86 a0 00 00 00 75 07 83 f8 02 75 48 eb 3d')
            self.call(s,f,0x4bcbf7,0x47a630)
            self.at(s,f,0x4bcbff,'85 c0 74 21')
            self.at(s,f,0x4bcc17,'3b c5 74 09 8b ce 6a 03')
            self.call(s,f,0x4bcc1f,0x4898f0)
            self.call(s,f,0x4bcc37,0x488c10)
            self.call(s,f,0x4bcc42,0x488c00)
            self.at(s,f,0x4bcc4b,'6a 02 8b ce')
            self.call(s,f,0x4bcc4f,0x4898f0)
            self.call(s,f,0x4bcc5a,0x4b3a20)
            self.call(s,f,0x4bcc6a,0x4b3a20)
            self.at(s,f,0x4bcc6f,'6a 00 53 6a 0e 8b ce')
            self.call(s,f,0x4bcc76,0x4bbaa0)

    def test_13_governor_setter_event8_before_subtype_store(self):
        for s in ('S1','S2'):
            f='004B3A20'
            self.at(s,f,0x4b3a45,'75 04 85 db 75 4d')
            self.at(s,f,0x4b3a6b,'74 10 3b f3 74 0c 6a 00 56 6a 08')
            self.call(s,f,0x4b3a78,0x4bbaa0)
            self.call(s,f,0x4b3a7f,0x486890)
            self.call(s,f,0x4b3a8a,0x491310)
            self.call(s,f,0x4b3a92,0x487780)
            self.call(s,'00487780',0x4877d7,0x48d9a0)
            self.call(s,'00487780',0x487813,0x48d9a0)
            self.call(s,'00487780',0x487849,0x47b4b0)
            self.at(s,'0047B4B0',0x47b4c4,'89 41 34 c2 04 00')
            self.at(s,'0048D9A0',0x48d9b4,'89 41 64 c2 04 00')
            self.assertEqual(struct.unpack('<I',self.raw[s,'0079BFAC'])[0],0x47c310)
            for p in ('0079C1C4','0079C824'):self.assertEqual(struct.unpack('<I',self.raw[s,p])[0],0x485160)

    def test_14_event_mission_dispatch_then_noop_event8_14_then_ui(self):
        for s in ('S1','S2'):
            f='004BBAA0'
            self.call(s,f,0x4bbac5,0x4a8110)
            self.call(s,f,0x4bbad1,0x4ba1d0)
            self.call(s,f,0x4bbad6,0x4ec870)
            self.at(s,f,0x4bbadd,'5e 74 12')
            self.at(s,f,0x4bbae2,'6a 00 6a 00 6a 00 6a 00 8b c8 ff 92 b4 01 00 00')
            self.at(s,'004BA1D0',0x4ba1e6,'83 e8 09')
            self.at(s,'004BA1D0',0x4ba1ff,'83 e8 07 74 09 83 e8 02 0f 85 6b 02 00 00')
            self.call(s,'004A8110',0x4a81a4,0x5b9d30)
            self.at(s,'004A8110',0x4a8198,'83 f9 2b 7f 0c')
            self.at(s,'005B9D30',0x5b9d3d,'83 fb 25')
            self.at(s,'005B9D30',0x5b9ddc,'ff 52 08')
            self.at(s,'005B9D30',0x5b9def,'ff 52 0c')

    def test_15_home_eligibility_and_route_switch_targets(self):
        for s in ('S1','S2'):
            self.at(s,'004896C0',0x489707,'83 c8 ff 3b d0 75 17 6a 00 6a 00 51')
            self.call(s,'004896C0',0x489713,0x5ba320)
            self.at(s,'004896C0',0x48971b,'85 c0 75 06')
            self.call(s,'00489730',0x489734,0x4896c0)
            self.call(s,'00489730',0x489749,0x490d00)
            self.call(s,'00489730',0x489751,0x47a630)
            self.at(s,'00489730',0x489761,'ff 50 44 8b 17 8b cf 8b f0 ff 52 44 2b f0')
            pointers=struct.unpack('<5I',self.raw[s,'005BA3DC'])
            self.assertEqual(pointers,(0x5ba341,0x5ba34a,0x5ba353,0x5ba393,0x5ba3a4))
            for mission in range(9,38):
                want=0 if mission in (9,10,23,24) else 1 if mission==12 else 2 if 15<=mission<=22 else 3 if mission==37 else 4
                self.assertEqual(self.raw[s,'005BA3F0'][mission-9],want)
            self.at(s,'005BA320',0x5ba36e,'8b 40 04')
            self.at(s,'005BA320',0x5ba399,'85 c0 7c 07 3d ff 3f 00 00 7e 04')

    def test_16_explicit_capacity_source_deltas_and_hooks(self):
        self.at('S1','0049D540',0x49d57c,'6a 12')
        self.at('S2','0049D540',0x49d57c,'6a 03')
        self.call('S2','0049D540',0x49d58f,0x90d1a8,0xe9)
        self.at('S2','0090D1A8',0x90d1aa,'68 16 01 00 00')
        self.call('S2','0090D1A8',0x90d1af,0x4890f0)
        self.at('S2','0090D1A8',0x90d1b8,'81 c3 d0 07 00 00')
        self.call('S2','0049D420',0x49d459,0x90e8d8,0xe9)
        self.at('S2','0090E8D8',0x90e8da,'68 79 01 00 00')
        self.call('S2','0090E8D8',0x90e8df,0x4890f0)
        self.assertEqual(struct.unpack('<2I',self.raw['S2','0090E908']),(12000,15000))
        self.at('S1','0049D420',0x49d4c7,'75 23')
        self.at('S2','0049D420',0x49d4c7,'eb 23')
        self.at('S1','0049D420',0x49d4fe,'be 2c 00 00 00')
        self.at('S2','0049D420',0x49d4fe,'be 00 00 00 00')
        self.at('S1','004811E0',0x4811e8,'83 f8 23')
        self.at('S2','004811E0',0x4811e8,'83 f8 3f')
        self.call('S2','004890F0',0x4890f4,0x9142f8,0xe9)
        self.call('S2','004890F0',0x4890fb,0x8ea258,0xe9)

    def test_17_contracts_keep_unsupported_transitive_effects_explicit(self):
        c=self.e['contracts']
        self.assertEqual(c['forcePresence']['statusMask15'],[0,1,2,3])
        self.assertFalse(c['corpsPresence']['statusMaskApplied'])
        self.assertFalse(c['governorRefresh0']['requiresCandidateHomeEqualsBase'])
        self.assertFalse(c['governorRefresh0']['requiresCandidateForceEqualsBase'])
        self.assertEqual(c['governorRefresh0']['leaderShortcut'],'last surviving status<=1 candidate')
        self.assertFalse(c['leaderSetter']['advisorWrite']);self.assertFalse(c['governorSetter']['advisorWrite'])
        self.assertFalse(c['capacityBoundary']['queryHooksExecuted'])
        self.assertFalse(c['projectionPolicy']['fullNativeTransaction'])
        for key in ('004B80A0','004BE348..004BE4D7','004BCA30 refreshFlag!=0','capacity','events','composition'):
            self.assertIn(key,c['deferred'])
        self.assertIn('source+stage+person',c['capacityBoundary']['observations'])
        self.assertIn('callback noninterference',c['routeBoundary']['observation'])
        self.assertIn('reject preflights atomically',c['projectionPolicy']['unknownEffects'])


if __name__ == '__main__': unittest.main(verbosity=2)
