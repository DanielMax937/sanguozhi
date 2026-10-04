"""P0-60 independent byte-column checks; no IDB/EXE/model execution.

Checks contiguous committed source ranges, source fingerprints, raw-ID1 readback
hashes, source differences, canonical virtual slots, branch/call targets and exact
write order. Rendered instruction names are never used as evidence.
"""
import hashlib
import json
from pathlib import Path
import struct
import unittest
from check_facility_mission_cancellation_evidence import read_range

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / 'docs/sources/mission-notification-tail.json'
DIRECTORY = MANIFEST.with_suffix('')


def load_evidence():
    evidence = json.loads(MANIFEST.read_text())
    raw = {}
    for row in evidence['containers']:
        path = DIRECTORY / row['file']
        assert hashlib.sha256(path.read_bytes()).hexdigest() == row['sha256']
        assert len(path.read_text().splitlines()) == row['lineCount']
    for row in evidence['ranges']:
        key = row['source'], row['start']
        assert key not in raw
        raw[key] = read_range(DIRECTORY, row)
        assert row['sha256'] == row['independentId1Sha256']
    for row in evidence['comparisons']:
        a, b = (raw[s, row['start']] for s in ('S1', 'S2'))
        assert len(a) == len(b)
        assert row['identical'] == (a == b)
        assert row['differingByteCount'] == sum(x != y for x, y in zip(a, b))
        for s in ('S1', 'S2'):
            assert hashlib.sha256(raw[s, row['start']]).hexdigest() == row[s+'sha256']
    return evidence, raw


class NotificationTailSource(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.e, cls.raw = load_evidence()

    def at(self, s, fn, address, expected):
        b = bytes.fromhex(expected); o = address-int(fn, 16)
        self.assertEqual(self.raw[s, fn][o:o+len(b)], b)

    def call(self, s, fn, address, target, opcode=0xe8):
        b = self.raw[s, fn]; o = address-int(fn, 16)
        self.assertEqual(b[o], opcode)
        self.assertEqual(address+5+struct.unpack_from('<i', b, o+1)[0], target)

    def contains(self, s, fn, pattern):
        self.assertIn(bytes.fromhex(pattern), self.raw[s, fn])

    def test_01_source_identity_and_exact_budget(self):
        self.assertEqual(self.e['profileId'], 'source-idb-S1-S2-mission-notification-tail-v1')
        self.assertEqual(len(self.raw), 123)
        self.assertEqual(sum(map(len, self.raw.values())), 10811)
        self.assertEqual(len(self.e['comparisons']), 61)
        self.assertEqual(self.e['rangeBudget'], {'commonRangesPerSource':61,
            'commonCodeRangesPerSource':55, 'commonDataRangesPerSource':6,
            'sourceSpecificRanges':1, 'rangesBothSources':123,
            'totalSelectedBytesBothSources':10811})
        self.assertEqual([s['idbSha256'] for s in self.e['sources']], [
            'c591cb40ce6d6be9246148002532dedc042463f36cd39c5ed300b7c449feefab',
            'aa7f2c983b266633d6e23c494d4f8e1b03e5251632505cae103e176ae850dfd8'])
        for key in ('stockOriginalVerified','originalExeExecuted','recordedExeHashesIndependentlyVerified'):
            self.assertFalse(self.e[key])
        self.assertTrue(all('血色' in s['recordedInputPath'] for s in self.e['sources']))
        self.assertEqual(self.e['adoption']['PC-PK1.1'], 'compatibility-reconstruction')
        self.assertEqual(self.e['adoption']['PC-Vanilla-assumed'], 'compatibility-assumption')

    def test_02_actual_differences_are_wrapper_query_entry_and_distance_table(self):
        self.assertEqual([r['start'] for r in self.e['comparisons'] if not r['identical']],
                         ['004890F0','004A5600','0079B830','0079C2B0'])
        self.assertEqual(next(r['differingByteCount'] for r in self.e['comparisons']
                             if r['start']=='0079B830'), 1084)
        self.assertEqual(next(r['differingByteCount'] for r in self.e['comparisons']
                             if r['start']=='0079C2B0'), 32)
        self.assertEqual(self.raw['S1','005B8400'], self.raw['S2','005B8400'])
        self.assertEqual(self.raw['S1','004A73A0'], self.raw['S2','004A73A0'])
        self.assertNotIn(('S1','0090CBA0'), self.raw)
        self.assertEqual(self.e['sourceSpecificRanges'][0]['start'], '0090CBA0')

    def test_03_notification_gate_order_and_short_circuits(self):
        for s in ('S1','S2'):
            fn='005B81D0'
            for a,t in [(0x5b81d6,0x47a630),(0x5b81f2,0x490aa0),
                        (0x5b81fa,0x47a630),(0x5b821e,0x490ad0),
                        (0x5b8226,0x47a630),(0x5b8234,0x47a6d0)]:self.call(s,fn,a,t)
            for a,b in [(0x5b81de,'85 c0 75 02 5e c3'),
                        (0x5b81e9,'ff 50 40'),(0x5b8202,'85 c0 74 3f'),
                        (0x5b820a,'ff 52 48 85 c0 74 34'),(0x5b8215,'ff 50 44'),
                        (0x5b822e,'85 c0 74 13'),(0x5b8239,'85 c0 74 08'),
                        (0x5b823d,'5f b8 01 00 00 00 5e c3'),
                        (0x5b8245,'5f 33 c0 5e c3')]:self.at(s,fn,a,b)

    def test_04_canonical_vtables_and_assignment_bytes(self):
        for s in ('S1','S2'):
            for vt,off,vals in [('0079C780',4,(0x4883f0,0x488430)),
                    ('0079C780',0x40,(0x47b2b0,0x4883b0,0x47a690)),
                    ('0079BFB0',8,(0x47e070,)),
                    ('0079BFB0',0x40,(0x65d6c0,0x47e3a0,0x47a690)),
                    ('0079C0E8',8,(0x480ff0,)),('0079C0E8',0x48,(0x480fa0,))]:
                self.assertEqual(struct.unpack_from('<'+'I'*len(vals),self.raw[s,vt],off), vals)
            self.at(s,'004883A0',0x4883a0,'c7 01 80 c7 79 00')
            self.at(s,'00480F90',0x480f90,'c7 01 e8 c0 79 00')
            self.at(s,'0047E410',0x47e42d,'c7 06 b0 bf 79 00')

    def test_05_force_derivation_does_not_normalize_raw_person_legion(self):
        for s in ('S1','S2'):
            self.assertEqual(self.raw[s,'004883B0'],bytes.fromhex('8b 81 94 00 00 00 c3'))
            self.assertEqual(self.raw[s,'0065D6C0'],bytes.fromhex('8b 41 04 c3'))
            self.at(s,'0047B2B0',0x47b2b3,'ff 50 44')
            self.call(s,'0047B2B0',0x47b2bc,0x490ad0)
            self.call(s,'0047B2B0',0x47b2c4,0x47a630)
            self.at(s,'0047B2B0',0x47b2cc,'85 c0 74 08')
            self.at(s,'0047B2B0',0x47b2d5,'ff 62 40 83 c8 ff 5e c3')
            self.contains(s,'00490AA0','83 f8 2e');self.contains(s,'00490AD0','83 f8 2e')

    def test_06_legion_notice_rechecks_force_then_self_then_number(self):
        for s in ('S1','S2'):
            self.at(s,'0047A6D0',0x47a6d5,'ff 50 48 85 c0 74 41')
            self.at(s,'0047A6D0',0x47a6e0,'ff 52 44')
            self.call(s,'0047A6D0',0x47a6e9,0x490ad0)
            self.at(s,'0047A6D0',0x47a709,'ff 50 08 85 c0 74 0d')
            self.at(s,'0047A6D0',0x47a710,'8b 4e 08 33 c0 83 f9 01 0f 94 c0')
            self.at(s,'0047A690',0x47a693,'ff 50 40')
            self.call(s,'0047A690',0x47a69c,0x490aa0)
            self.at(s,'0047A690',0x47a6bc,'ff 52 08 85 c0 75 04')
            self.at(s,'0047A690',0x47a6cc,'ff 60 48')
            self.call(s,'0047E3A0',0x47e3a6,0x4912c0)
            self.contains(s,'004912C0','b8 67 66 66 66 f7 ee c1 fa 05')
            self.contains(s,'004912C0','83 f8 2e')
            self.assertEqual(self.raw[s,'004195D0'],bytes.fromhex('83 c8 ff c3'))

    def test_07_canonical_validity_and_player_field_are_distinct(self):
        for s in ('S1','S2'):
            self.at(s,'00480FA0',0x480fa0,'8b 41 60 85 c0 7c 0b 83 f8 07 7f 06')
            self.at(s,'00480FF0',0x480ffe,'8b 76 04 85 f6 7c 0f 81 fe 4b 04 00 00')
            self.at(s,'0047E070',0x47e075,'6a 02 ff 50 2c')
            self.at(s,'0047E070',0x47e082,'ff 52 40 85 c0 7c 0c 83 f8 2e 7f 07')
            self.at(s,'0047A600',0x47a623,'ff 60 04');self.at(s,'0047A630',0x47a653,'ff 60 08')
            self.contains(s,'004883F0','8b 86 7c 01 00 00')
            self.at(s,'00488430',0x48844c,'83 fe 06 74 0c 83 fe 08 74 07')
            for fn,cls in [('004883D0',10),('0047E050',2),('00480FD0',1)]:
                self.contains(s,fn, f'83 f8 {cls:02x}')

    def test_08_active_list_validity_pointer_search_and_append_only(self):
        for s in ('S1','S2'):
            self.call(s,'00482F80',0x482f89,0x47a630)
            self.at(s,'00482F80',0x482f9a,'6a 00 81 c6 84 01 00 00 57 8b ce')
            self.call(s,'00482F80',0x482fa5,0x482af0)
            self.at(s,'00482F80',0x482faa,'85 c0 75 08 57 8b ce')
            self.call(s,'00482F80',0x482fb1,0x47c1b0)
            self.at(s,'00482F80',0x482fb6,'5f b8 01 00 00 00 5e c2 04 00')
            self.at(s,'00482AF0',0x482b25,'8b 77 04')
            self.at(s,'00482AF0',0x482b6a,'8b 0f 8b 54 24 1c 33 c0 3b ca 0f 94 c0')
            self.at(s,'00482AF0',0x482b7b,'8b 36 85 f6 75 c0')
            self.assertEqual(0x7201958+0x184,0x7201adc)

    def test_09_append_payload_and_tail_links_without_hidden_dedup(self):
        for s in ('S1','S2'):
            self.at(s,'0047C1B0',0x47c1d5,'8b 4e 08 8b 06 6a 00 51')
            self.at(s,'0047C1B0',0x47c1e7,'ff 10')
            self.at(s,'0047C1B0',0x47c1eb,'85 ff 75 20')
            self.at(s,'0047C1B0',0x47c20f,'8b 54 24 1c 89 57 08 8b 46 08 85 c0 74 04 89 38 eb 03 89 7e 04')
            self.at(s,'0047C1B0',0x47c229,'89 7e 08')

    def test_10_acted_bit_write_then_manager_dirty_then_observer(self):
        for s in ('S1','S2'):
            self.at(s,'00489B40',0x489b40,'8b 44 24 04 50 81 c1 24 01 00 00 6a 00 51')
            for site,target in [(0x489b4e,0x472520),(0x489b5b,0x4a06a0),(0x489b65,0x4b9480)]:self.call(s,'00489B40',site,target)
            self.at(s,'00472520',0x47256d,'0b c8 89 0e')
            self.at(s,'00472520',0x47257c,'f7 d2 23 c2 89 06')
            self.at(s,'004A06A0',0x4a06a0,'6a 01 b9 58 19 20 07')
            self.call(s,'004A06A0',0x4a06a7,0x4829b0)
            self.at(s,'004829B0',0x4829b4,'89 81 cc 01 00 00')
            self.assertEqual(0x7201958+0x1cc,0x7201b24)
            self.call(s,'004B9480',0x4b9480,0x4ec870)
            self.at(s,'004B9480',0x4b9485,'85 c0 74 12 8b 10 6a 00 6a 00 6a 00 6a 00 8b c8 ff 92 b4 01 00 00 c3')
            self.assertEqual(self.raw[s,'004EC870'],bytes.fromhex('a1 48 a0 1b 09 c3'))

    def test_11_s2_wrapper_hook_nonzero_query267_only(self):
        for s in ('S1','S2'):
            self.call(s,'004A5600',0x4a5606,0x47a630)
            self.at(s,'004A5600',0x4a560e,'85 c0 74 0c')
        self.call('S1','004A5600',0x4a5619,0x489b40)
        self.call('S2','004A5600',0x4a5619,0x90cba0)
        self.at('S2','0090CBA0',0x90cba0,'8b 44 24 04 85 c0 75 09 50')
        self.call('S2','0090CBA0',0x90cba9,0x489b40)
        self.at('S2','0090CBA0',0x90cbb1,'51 68 0b 01 00 00')
        self.call('S2','0090CBA0',0x90cbb7,0x4890f0)
        self.at('S2','0090CBA0',0x90cbbc,'85 c0 59 75 07 6a 01')
        self.call('S2','0090CBA0',0x90cbc3,0x489b40)
        self.call('S2','004890F0',0x4890f4,0x9142f8,opcode=0xe9)
        self.call('S2','004890F0',0x4890fb,0x8ea258,opcode=0xe9)
        self.contains('S1','004890F0','83 f8 63')

    def test_12_mission_setup_direct_writer_then_live_list_recheck(self):
        for s in ('S1','S2'):
            fn='004A73A0'
            self.call(s,fn,0x4a73a9,0x47a630)
            self.at(s,fn,0x4a73ba,'85 ff 7c 4a 83 ff 2b 7f 45')
            self.at(s,fn,0x4a73c7,'85 c0 74 08')
            for a,t in [(0x4a73ce,0x4a57b0),(0x4a73ef,0x489bd0),
                        (0x4a73f8,0x489b40),(0x4a7403,0x482f80)]:self.call(s,fn,a,t)
            self.at(s,fn,0x4a73f4,'6a 01 8b ce')
            for a,b in [(0x489bd8,'89 81 3c 01 00 00'),(0x489be2,'89 91 40 01 00 00'),
                        (0x489bec,'89 81 44 01 00 00'),(0x489bf6,'89 91 48 01 00 00'),
                        (0x489c00,'89 81 4c 01 00 00'),(0x489c06,'89 91 50 01 00 00')]:self.at(s,'00489BD0',a,b)

    def test_13_return_saved_location_home_and_away_order(self):
        for s in ('S1','S2'):
            fn='005B8400'
            self.at(s,fn,0x5b8405,'8b 86 9c 00 00 00 85 c0 57 7c 05 83 f8 56 7e 03 83 c8 ff')
            self.at(s,fn,0x5b8418,'8b be 98 00 00 00 3b c7 74 53')
            for a,t in [(0x5b8429,0x490d00),(0x5b8436,0x490d00),
                        (0x5b8442,0x49e4d0),(0x5b8460,0x4a73a0),(0x5b846c,0x4a5660)]:self.call(s,fn,a,t)
            self.at(s,fn,0x5b8447,'6a 00 6a 00 6a 00 6a 00 8b f8 8b 44 24 24 50 6a 25 6a 00 56')
            self.at(s,fn,0x5b8465,'57 56')

    def test_14_home_clear_duration_wrapper_status_finalizer_order(self):
        for s in ('S1','S2'):
            fn='005B8400'
            for a,t in [(0x5b847b,0x4a5780),(0x5b8488,0x4a5660),(0x5b8495,0x4a5600),
                        (0x5b84b4,0x4ae2a0),(0x5b84bb,0x488c70),(0x5b84da,0x4bf6f0)]:self.call(s,fn,a,t)
            self.at(s,fn,0x5b848d,'6a 01 56')
            self.at(s,fn,0x5b849a,'8b 44 24 10 85 c0 7e 17')
            self.at(s,fn,0x5b84c0,'85 c0 75 1b')
            self.at(s,fn,0x5b84cf,'6a 01 6a 00 50 56')
            self.assertEqual(self.raw[s,'00488C70'],bytes.fromhex('8b 91 a0 00 00 00 33 c0 83 fa 05 0f 94 c0 c3'))
            self.call(s,'004A5780',0x4a5786,0x47a600)
            self.at(s,'004A5780',0x4a5792,'6a 00 6a 00 6a 00 6a 00 6a 00 6a ff')
            self.call(s,'004A5780',0x4a57a0,0x489bd0)
            self.call(s,'004A5660',0x4a5666,0x47a630)
            self.call(s,'004A5660',0x4a5679,0x48a8b0)
            self.at(s,'0048A8B0',0x48a8b0,'8a 44 24 04')
            self.at(s,'0048A8B0',0x48a8c9,'88 81 58 01 00 00')

    def test_15_handler_saved_raw44_presentation_and_zero_refund_callers(self):
        for s in ('S1','S2'):
            for fn,raw44,gate,presentation,msg,formatter,observer,tail,call in [
                ('005B6D00',0x5b6db0,0x5b6db8,0x5b6dc4,0x15a6,0x5b6dd6,0x5b6e2d,0x5b6e35,0x5b6e38),
                ('005CFB70',0x5cfc14,0x5cfc1c,0x5cfc28,0x15b6,0x5cfc3a,0x5cfc91,0x5cfc99,0x5cfc9c)]:
                self.at(s,fn,raw44,'8b 4f 44 89 4c 24 10')
                self.call(s,fn,gate,0x5b81d0)
                self.at(s,fn,presentation,'8b 54 24 14 52 56 68 '+struct.pack('<I',msg).hex(' '))
                self.call(s,fn,formatter,0x5cf9f0);self.call(s,fn,observer,0x63add0)
                self.at(s,fn,tail,'6a 00 56');self.call(s,fn,call,0x5b8400)
                self.at(s,fn,call+10,'b8 01 00 00 00')
            for row in self.e['keyCalls']:self.call(s,row['caller'],int(row['address'],16),int(row['target'],16))

    def test_16_distance_is_directed_source_table_and_invalid_minus_one(self):
        for s in ('S1','S2'):
            self.call(s,'0049E4D0',0x49e4d9,0x49e450)
            self.call(s,'0049E4D0',0x49e4e7,0x49e450)
            self.call(s,'0049E4D0',0x49e4ee,0x47b480)
            self.at(s,'0047B480',0x47b49a,'6b c0 2a 0f b6 84 08 30 b8 79 00 c3 83 c8 ff c3')
            self.assertEqual(len(self.raw[s,'0079B830']),42*42)
            self.at(s,'0049E450',0x49e4a5,'8b 14 8d 6c 0e fb 06 c1 ea 05 83 e2 7f')

    def test_17_distance_canonical_virtuals_and_territorial_leaf_are_pure_reads(self):
        for s in ('S1','S2'):
            vt=self.raw[s,'0079C718']
            for off,target in [(8,0x486400),(0x24,0x573470),(0x3c,0x487dc0)]:
                self.assertEqual(struct.unpack_from('<I',vt,off)[0],target)
            self.at(s,'004880A0',0x4880a8,'c7 06 18 c7 79 00')
            self.at(s,'00486400',0x486405,'ff 50 24 83 f8 05 75 13')
            self.assertEqual(self.raw[s,'00573470'],bytes.fromhex('b8 05 00 00 00 c3'))
            self.assertEqual(self.raw[s,'00487DC0'],bytes.fromhex('8d 41 1e c3'))
            self.assertEqual(self.raw[s,'004839F0'],bytes.fromhex('8b 44 24 04 0f b6 80 b0 c2 79 00 c3'))
            self.assertEqual(len(self.raw[s,'0079C2B0']),128)
            self.call(s,'0049E450',0x49e4b3,0x4839f0)
            self.at(s,'0049E450',0x49e46a,'ff 50 3c 8b 00')
            self.at(s,'0049E450',0x49e475,'0f bf c0 c1 f9 10')
            self.at(s,'0049E450',0x49e47f,'3d c8 00 00 00')
            self.at(s,'0049E450',0x49e48a,'81 f9 c8 00 00 00')

    def test_18_open_closures_are_explicit_not_silent_zero_effects(self):
        kinds={r['kind'] for r in self.e['boundaries']}
        self.assertTrue({'mission23-presentation','mission24-presentation','acted-observer',
            'mutable-query267-observation','territorial-distance-query','positive-refund-callee',
            'return-home-finalizer','successful-linked-list-allocation'} <= kinds)
        self.assertFalse(self.e['contracts']['returnTail']['actorValidityAt005B8400Entry'])
        self.assertEqual(self.e['contracts']['returnTail']['mission23And24Refund'],0)
        for s in ('S1','S2'):
            self.assertNotIn((s,'004BF6F0'),self.raw)
            self.assertNotIn((s,'004AE2A0'),self.raw)


if __name__ == '__main__':
    unittest.main()
