"""P0-56 byte/provenance checks for mission37 completion and routed member pass.

Standard-library-only verification of the committed textual source corpus.
No EXE, IDB parser, game model, native machine code, or callback is executed.
IDB source fingerprints and contiguous per-range hashes preserve S1/S2 identity;
relative calls, tables and scalar byte columns are checked independently of the
rendered disassembly labels. Run: python scripts/check_return_mission_source.py
"""
import hashlib
import json
from pathlib import Path
import struct
import unittest

from check_facility_mission_cancellation_evidence import read_range

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / 'docs/sources/return-mission-lifecycle.json'
DIRECTORY = MANIFEST.with_suffix('')


def load_evidence():
    evidence = json.loads(MANIFEST.read_text())
    raw = {}
    for container in evidence['containers']:
        path = DIRECTORY / container['file']
        assert hashlib.sha256(path.read_bytes()).hexdigest() == container['sha256']
        assert len(path.read_text().splitlines()) == container['lineCount']
    for row in evidence['ranges']:
        key = row['source'], row['start']
        assert key not in raw
        raw[key] = read_range(DIRECTORY, row)
    for comparison in evidence['comparisons']:
        start = comparison['start']
        assert comparison['identical'] == (raw['S1', start] == raw['S2', start])
        for source in ('S1', 'S2'):
            assert hashlib.sha256(raw[source, start]).hexdigest() == comparison[source + 'sha256']
    for row in evidence['personPassRanges']:
        a = int(row['start'], 16) - int(row['parentRange'], 16)
        b = int(row['endExclusive'], 16) - int(row['parentRange'], 16)
        assert hashlib.sha256(raw[row['source'], row['parentRange']][a:b]).hexdigest() == row['sha256']
    return evidence, raw


class ReturnMissionSource(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.e, cls.raw = load_evidence()

    def at(self, source, function, address, expected):
        offset = address - int(function, 16)
        expected = bytes.fromhex(expected)
        self.assertEqual(self.raw[source, function][offset:offset + len(expected)], expected)

    def call_at(self, source, function, address, target, opcode=0xe8):
        offset = address - int(function, 16)
        raw = self.raw[source, function]
        self.assertEqual(raw[offset], opcode)
        self.assertEqual(address + 5 + struct.unpack_from('<i', raw, offset + 1)[0], target)

    def test_01_separate_fingerprints_and_bounded_provenance(self):
        self.assertEqual(len(self.e['ranges']), 106)
        self.assertEqual(len(self.e['comparisons']), 53)
        self.assertEqual(len(self.e['containers']), 4)
        self.assertEqual(self.e['baselineCommit'], 'b488a9f6a38fbb45e6e6c2ac64cd68f6fa3f97ed')
        self.assertEqual(self.e['profileId'], 'source-idb-S1-S2-return-mission-lifecycle-v1')
        self.assertEqual([s['idbSha256'] for s in self.e['sources']], [
            'c591cb40ce6d6be9246148002532dedc042463f36cd39c5ed300b7c449feefab',
            'aa7f2c983b266633d6e23c494d4f8e1b03e5251632505cae103e176ae850dfd8'])
        for key in ('stockOriginalVerified', 'originalExeExecuted', 'recordedExeHashesIndependentlyVerified'):
            self.assertFalse(self.e[key])
        self.assertTrue(all('血色' in s['recordedInputPath'] for s in self.e['sources']))
        self.assertEqual(self.e['adoption']['PC-PK1.1'], 'compatibility-reconstruction')
        self.assertEqual(self.e['adoption']['PC-Vanilla-assumed'], 'compatibility-assumption')
        self.assertIn('004BF6F0', self.e['contracts']['deferred'])

    def test_02_switch_bytes_resolve_mission37_and_dispatcher_zero(self):
        for source in ('S1', 'S2'):
            for byte_table, bias, pointer_table, selector, branch in (
                    ('005BA2E8', 2, '005BA298', 15, 0x5ba1e6),
                    ('005BA3F0', 9, '005BA3DC', 3, 0x5ba393)):
                index = self.raw[source, byte_table][37 - bias]
                self.assertEqual(index, selector)
                self.assertEqual(struct.unpack_from('<I', self.raw[source, pointer_table], index * 4)[0], branch)
            self.at(source, '005B9B40', 0x5b9b4d, '83 f8 25 56 74 32')
            self.at(source, '005B9B40', 0x5b9b85, '33 c0 5e 83 c4 0c c2 04 00')
            self.at(source, '005B9E10', 0x5b9e1f, '89 71 04')
            self.at(source, '005B9E10', 0x5b9e29, '83 c0 fe 33 ff 83 f8 29')
            self.at(source, '005B9E10', 0x5b9e3b, '0f b6 80 e8 a2 5b 00 53 ff 24 85 98 a2 5b 00')
            self.call_at(source, '005B9E10', 0x5ba1e7, 0x5b9b90)
            self.call_at(source, '005B9E10', 0x5ba1ec, 0x5ba27e, opcode=0xe9)
            self.at(source, '005B9E10', 0x5ba27c, '8b f8 5b')
            self.at(source, '005B9E10', 0x5ba283, '8b c7 5f 5e c7 41 04 00 00 00 00')
        self.assertEqual(self.e['contracts']['completion']['handlerReturn'], 1)
        self.assertEqual(self.e['contracts']['completion']['dispatcherReturn'], 0)

    def test_03_completion_refund_before_reset_without_legion_compare(self):
        for source in ('S1', 'S2'):
            fn = '005B9B90'
            self.assertEqual(len(self.raw[source, fn]), 0x6f)
            for address, target in ((0x5b9b96, 0x47a630), (0x5b9baf, 0x490d00),
                    (0x5b9bc8, 0x4897b0), (0x5b9bd8, 0x4ae2a0),
                    (0x5b9be3, 0x4a5780), (0x5b9bf0, 0x4a5660)):
                self.call_at(source, fn, address, target)
            self.at(source, fn, 0x5b9b9e, '85 c0 74 54 8b 86 98 00 00 00')
            self.at(source, fn, 0x5b9bb6, '8b 06 8b ce ff 50 44 8b 17 8b cf ff 52 44 6a 00 8b ce')
            self.at(source, fn, 0x5b9bcd, '85 c0 7e 0c 50 57')
            self.at(source, fn, 0x5b9be8, '6a 00 56')
            self.at(source, fn, 0x5b9bf6, 'b8 01 00 00 00 5e c2 04 00')
        c = self.e['contracts']['completion']
        self.assertFalse(c['homeValidityGateBeforeDereference'])
        self.assertTrue(c['noSameLegionGate'])
        for key in ('changesActed', 'movesLocation', 'callsReturnHome'):
            self.assertFalse(c[key])

    def test_04_runtime_link_order_and_cursor_advance_before_live_predicates(self):
        for source in ('S1', 'S2'):
            self.assertEqual(self.raw[source, '00482AE0'], bytes.fromhex('8b 81 88 01 00 00 c3'))
            self.at(source, '0047BED0', 0x47befa, '8b 37')
            self.at(source, '0047BED0', 0x47bf1a, '8b 06 89 07')
            self.at(source, '0047BED0', 0x47bf25, '8d 46 08')
            self.at(source, '00482F20', 0x482f30, '83 3f 00 74 3d 57 8d 8b 84 01 00 00')
            self.call_at(source, '00482F20', 0x482f3c, 0x47bed0)
            self.at(source, '00482F20', 0x482f41, '8b 30 56')
            self.call_at(source, '00482F20', 0x482f44, 0x47a630)
            self.at(source, '00482F20', 0x482f4c, '85 c0 74 e0 8b 86 3c 01 00 00 85 c0 7c d6 83 f8 2b 7f d1')
            self.call_at(source, '00482F20', 0x482f61, 0x489120)
            self.at(source, '00482F20', 0x482f66, '85 c0 75 c6')
            self.at(source, '00489120', 0x489120, '81 c1 24 01 00 00 6a 00 51')
            self.call_at(source, '00489120', 0x489129, 0x472590)
            self.at(source, '00472590', 0x4725c4, '8b cf 8b 3e b8 01 00 00 00 d3 e0 33 c9 23 c7')

    def test_05_person_pass_stop_flag_recheck_and_equal_local_slice(self):
        for source in ('S1', 'S2'):
            fn = '00599CF0'
            self.call_at(source, fn, 0x599dfd, 0x482ae0)
            self.at(source, fn, 0x599e12, 'a1 f8 59 6a 09 85 c0 0f 85 f9 01 00 00')
            self.call_at(source, fn, 0x599e29, 0x482f20)
            self.call_at(source, fn, 0x599e31, 0x47a630)
            self.call_at(source, fn, 0x599e54, 0x5ba320)
            self.at(source, fn, 0x59a00c, '8b 44 24 18 85 c0 0f 85 fa fd ff ff')
        self.assertEqual(self.e['personPassRanges'][0]['sha256'], self.e['personPassRanges'][1]['sha256'])
        self.call_at('S1', '00599CF0', 0x59a06b, 0x5cafd0)
        self.call_at('S2', '00599CF0', 0x59a06b, 0x8eaa30, opcode=0xe9)

    def test_06_mission37_home_route_and_optional_outputs(self):
        for source in ('S1', 'S2'):
            fn = '005BA320'
            self.at(source, fn, 0x5ba324, '8b 81 3c 01 00 00 83 c0 f7 83 f8 1c')
            self.at(source, fn, 0x5ba333, '0f b6 80 f0 a3 5b 00 ff 24 85 dc a3 5b 00')
            self.at(source, fn, 0x5ba393, '8b 81 98 00 00 00 85 c0 7c 07 3d ff 3f 00 00 7e 04')
            self.at(source, fn, 0x5ba3a8, '8b 4c 24 0c 85 c9 74 02 89 01')
            self.at(source, fn, 0x5ba3b2, '8b 74 24 10 85 f6 74 18')
            self.call_at(source, fn, 0x5ba3c0, 0x490d00)
            self.call_at(source, fn, 0x5ba3cb, 0x49e450)
            self.at(source, fn, 0x5ba3d0, '89 06 b8 01 00 00 00')
            self.at(source, '00490D00', 0x490d00, '8b 44 24 04 85 c0 7c 14 3d ff 3f 00 00 7f 0d')

    def test_07_neighbor_slots_strict_minimum_first_tie_and_no_sort(self):
        for source in ('S1', 'S2'):
            fn = '00598D60'
            self.at(source, fn, 0x598d68, '3b c1 75 03 8b c1 c3')
            self.at(source, fn, 0x598d77, 'c7 44 24 10 ff ff ff ff bf ff ff ff 7f')
            self.call_at(source, fn, 0x598d84, 0x490a10)
            self.call_at(source, fn, 0x598d8c, 0x47a630)
            self.call_at(source, fn, 0x598da3, 0x47bc30)
            self.at(source, fn, 0x598daa, '85 f6 7c 1d 83 fe 29 7f 18')
            self.call_at(source, fn, 0x598db9, 0x47b480)
            self.at(source, fn, 0x598db3, '8b 44 24 18 50 56')
            self.at(source, fn, 0x598dc1, '3b c7 7d 06 89 74 24 14 8b f8 43 83 fb 06 7c cf')
            self.at(source, '0047BC30', 0x47bc30, '8b 44 24 04 85 c0 7c 0c 83 f8 05 7f 07 8b 44 81 1c')

    def test_08_distance_source_matrix_and_territorial_boundary(self):
        for source in ('S1', 'S2'):
            raw = self.raw[source, '0079B830']
            self.assertEqual(len(raw), 42 * 42)
            self.at(source, '0047B480', 0x47b49a, '6b c0 2a 0f b6 84 08 30 b8 79 00 c3 83 c8 ff c3')
            self.call_at(source, '0049E450', 0x49e45a, 0x47a630)
            self.at(source, '0049E450', 0x49e46a, 'ff 50 3c')
            self.at(source, '0049E450', 0x49e4a5, '8b 14 8d 6c 0e fb 06 c1 ea 05 83 e2 7f')
            self.call_at(source, '0049E450', 0x49e4b3, 0x4839f0)
            self.at(source, '004839F0', 0x4839f4, '0f b6 80 b0 c2 79 00')
        self.assertEqual(sum(a != b for a, b in zip(self.raw['S1', '0079B830'], self.raw['S2', '0079B830'])), 1084)

    def test_09_move_guards_and_actual_membership_not_troop_range_only(self):
        for source in ('S1', 'S2'):
            fn = '004A0CF0'
            for address, target in ((0x4a0cf9, 0x47a600), (0x4a0d07, 0x4891c0),
                    (0x4a0d20, 0x488350), (0x4a0d2c, 0x4a0cb0)):
                self.call_at(source, fn, address, target)
            self.at(source, fn, 0x4a0d0c, '85 c0 75 21')
            self.at(source, fn, 0x4a0d14, '85 c0 7c 19 3d ff 3f 00 00 7f 12')
            self.at(source, '004891C0', 0x4891c4, '8b 87 9c 00 00 00 83 f8 57 7c 4b 3d 3e 04 00 00 7f 44')
            for address, target in ((0x4891f0, 0x490e70), (0x4891f8, 0x47a630),
                    (0x48920a, 0x491310), (0x489212, 0x495390)):
                self.call_at(source, '004891C0', address, target)
            self.at(source, '00495390', 0x4953a0, '8b 71 0c')
            self.call_at(source, '00495390', 0x4953b0, 0x495340)
            self.at(source, '00495340', 0x495353, '8d 51 10')
            self.at(source, '00495340', 0x49536a, '40 83 c2 04 83 f8 02 7c e3')

    def test_10_canonical_normalizer_and_dword_location_write(self):
        for source in ('S1', 'S2'):
            fn = '00488350'
            self.at(source, fn, 0x488354, '85 c0 7c 05 83 f8 29 7e 33')
            self.at(source, fn, 0x48835d, '83 f8 2a 7c 13 83 f8 33 7f 0e')
            self.at(source, fn, 0x488375, '83 f8 34 7c 13 83 f8 56 7f 0e')
            self.at(source, fn, 0x48838d, '83 c8 ff c3')
            self.call_at(source, '004A0CB0', 0x4a0cb9, 0x47a600)
            self.at(source, '004A0CB0', 0x4a0cc9, '83 f8 ff 74 0b 85 c0 7c 14 3d 3e 04 00 00 7f 0d')
            self.at(source, '004A0CB0', 0x4a0cdb, '89 87 9c 00 00 00')
            self.call_at(source, '004A0CB0', 0x4a0ce1, 0x4b9480)

    def test_11_enroute_order_without_duration_gate(self):
        for source in ('S1', 'S2'):
            fn = '00599CF0'
            self.at(source, fn, 0x599e64, '8b 86 9c 00 00 00 85 c0 7c 05 83 f8 56 7e 02 8b c5')
            self.call_at(source, fn, 0x599e7b, 0x490d00)
            self.call_at(source, fn, 0x599e86, 0x49e450)
            self.call_at(source, fn, 0x599e91, 0x598d60)
            self.at(source, fn, 0x599eac, '3b 7c 24 10 74 34 57 56')
            self.call_at(source, fn, 0x599eb9, 0x4a0cf0)
            self.at(source, fn, 0x599ebe, '6a 01 8b ce')
            self.call_at(source, fn, 0x599ec2, 0x489b40)
            self.call_at(source, fn, 0x599ecd, 0x47b480)
            self.call_at(source, fn, 0x599edc, 0x4a5660)
            self.call_at(source, fn, 0x599ee1, 0x59a00c, opcode=0xe9)
            # Routed arm ends before the nonroute duration read at00599FF7.
            a, b = 0x599e64 - 0x599cf0, 0x599fa4 - 0x599cf0
            self.assertNotIn(bytes.fromhex('8a 86 58 01 00 00'), self.raw[source, fn][a:b])
        self.assertFalse(self.e['contracts']['route']['durationGate'])

    def test_12_arrival_completion_then_conditional_return_then_direct_tail(self):
        for source in ('S1', 'S2'):
            fn = '00599CF0'
            for address, target in ((0x599ef1, 0x4a0cf0), (0x599efe, 0x4a5660),
                    (0x599f0f, 0x5b9e10), (0x599f3e, 0x490d00),
                    (0x599f46, 0x47a630), (0x599f58, 0x488c70),
                    (0x599f7e, 0x4bf6f0), (0x599f87, 0x489b40), (0x599f90, 0x48a8b0)):
                self.call_at(source, fn, address, target)
            self.at(source, fn, 0x599f03, '8b 9e 3c 01 00 00')
            self.at(source, fn, 0x599f14, '8b 86 3c 01 00 00 85 c0 7c 09 83 f8 2b 0f 8e e5 00 00 00')
            self.at(source, fn, 0x599f4e, '85 c0 0f 84 b6 00 00 00')
            self.at(source, fn, 0x599f5d, '85 c0 75 22 83 fb 09 74 0c 83 fb 0a 74 07')
            self.at(source, fn, 0x599f74, '6a 01 50 57 56')
            self.at(source, fn, 0x599f83, '6a 00 8b ce')
            self.at(source, fn, 0x599f8c, '6a 00 8b ce')
            self.assertEqual(self.raw[source, '00488C70'], bytes.fromhex('8b 91 a0 00 00 00 33 c0 83 fa 05 0f 94 c0 c3'))

    def test_13_invalid_next_clears_only_mission_and_five_args(self):
        for source in ('S1', 'S2'):
            self.at(source, '00599CF0', 0x599f97, '56 b9 5c 89 99 07')
            self.call_at(source, '00599CF0', 0x599f9d, 0x4a5780)
            self.at(source, '00599CF0', 0x599fa2, 'eb 68')
            self.call_at(source, '004A5780', 0x4a5786, 0x47a600)
            self.at(source, '004A5780', 0x4a5792, '6a 00 6a 00 6a 00 6a 00 6a 00 6a ff 8b ce')
            self.call_at(source, '004A5780', 0x4a57a0, 0x489bd0)
            for address, expected in ((0x489bd8, '89 81 3c 01 00 00'),
                    (0x489be2, '89 91 40 01 00 00'), (0x489bec, '89 81 44 01 00 00'),
                    (0x489bf6, '89 91 48 01 00 00'), (0x489c00, '89 81 4c 01 00 00'),
                    (0x489c06, '89 91 50 01 00 00')):
                self.at(source, '00489BD0', address, expected)

    def test_14_action_bit_and_duration_byte_are_distinct_and_direct(self):
        for source in ('S1', 'S2'):
            self.at(source, '00489B40', 0x489b40, '8b 44 24 04 50 81 c1 24 01 00 00 6a 00 51')
            self.call_at(source, '00489B40', 0x489b4e, 0x472520)
            self.call_at(source, '00489B40', 0x489b5b, 0x4a06a0)
            self.call_at(source, '00489B40', 0x489b65, 0x4b9480)
            self.at(source, '00472520', 0x472573, '8b 06 ba 01 00 00 00 d3 e2 f7 d2 23 c2 89 06')
            self.call_at(source, '004A5660', 0x4a5666, 0x47a630)
            self.call_at(source, '004A5660', 0x4a5679, 0x48a8b0)
            self.at(source, '0048A8B0', 0x48a8b0, '8a 44 24 04 84 c0 77 0b 32 c0 88 81 58 01 00 00 c2 04 00')
            self.at(source, '0048A8B0', 0x48a8c3, '3c ff 72 02 0c ff 88 81 58 01 00 00 c2 04 00')
        self.assertNotEqual(self.raw['S1', '004A5600'], self.raw['S2', '004A5600'])
        self.call_at('S2', '004A5600', 0x4a5619, 0x90cba0)

    def test_15_refund_signed_wrap_and_source_specific_getter_writer_caps(self):
        for source in ('S1', 'S2'):
            fn = '004AE2A0'
            for address, target in ((0x4ae2a6, 0x47a630), (0x4ae2b6, 0x486c80),
                    (0x4ae2bf, 0x486d30), (0x4ae2db, 0x47a630), (0x4ae2ea, 0x487310)):
                self.call_at(source, fn, address, target)
            self.at(source, fn, 0x4ae2c8, '03 cb 85 c9 7f 04 33 ff eb 08 3b c1 8b f8 7e 02 8b f9')
            self.at(source, fn, 0x4ae2ef, '8b c7 5f 2b c3')
            city, query, enhanced, default = ((100000, 33, 40000, 10000) if source == 'S1' else (200000, 38, 100000, 50000))
            self.at(source, '00486D30', 0x486ddc, ('b8' + struct.pack('<I', city).hex()))
            self.at(source, '0047BCF0', 0x47bd00, ('3d' + struct.pack('<I', city).hex()))
            self.at(source, '0047BCF0', 0x47bd07, ('b8' + struct.pack('<I', city).hex()))
            self.at(source, '0048D820', 0x48d840, f'6a {query:02x}')
            self.at(source, '0048D820', 0x48d84b, 'b8' + struct.pack('<I', enhanced).hex())
            self.at(source, '0048D820', 0x48d852, 'b8' + struct.pack('<I', default).hex())
            self.at(source, '00483660', 0x483683, f'6a {query:02x}')
            self.at(source, '00483660', 0x48368e, 'b9' + struct.pack('<I', enhanced).hex())
            self.at(source, '00483660', 0x483695, 'b9' + struct.pack('<I', default).hex())
            # Separate subtype lookups and validity checks remain visible.
            for address, target in ((0x486cc0, 0x47a630), (0x486d15, 0x47a630)):
                self.call_at(source, '00486C80', address, target)
            for address, target in ((0x487354, 0x47a630), (0x487390, 0x47a630), (0x4873c6, 0x47a630)):
                self.call_at(source, '00487310', address, target)

    def test_16_full_return_home_is_a_deferred_effect_boundary(self):
        for source in ('S1', 'S2'):
            fn = '004BF6F0'
            for address, target in ((0x4bf7ba, 0x4b93d0), (0x4bf7c0, 0x4f55e0),
                    (0x4bf831, 0x4b40c0), (0x4bf83e, 0x4a31e0), (0x4bf859, 0x4a0cb0),
                    (0x4bf899, 0x4a32f0), (0x4bf8d3, 0x4be2a0), (0x4bf8dd, 0x4be2a0),
                    (0x4bf90c, 0x4bca30)):
                self.call_at(source, fn, address, target)
        self.assertEqual([r['start'] for r in self.e['comparisons'] if not r['identical']], [
            '0047BCF0', '00483660', '00486D30', '0048D820', '004A5600', '00599CF0', '0079B830'])
        self.assertIn('unexecuted', self.e['contracts']['deferred']['004BF6F0'])
        self.assertIn('outer scheduler', self.e['contracts']['scope'])


if __name__ == '__main__':
    unittest.main()
