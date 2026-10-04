"""P0-57 bounded officer return byte/provenance checks; no engine execution.

Uses only the standard library and the existing textual-byte parser. Checks
new containers, hash-pinned prior ranges, exact calls/branches/stores and vtables.
No IDB parser, EXE, game model, native bytes or callbacks are executed.
"""
import hashlib
import json
from pathlib import Path
import struct
import unittest

from check_facility_mission_cancellation_evidence import HEX, read_range

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / 'docs/sources/officer-return-finalizer.json'
DIRECTORY = MANIFEST.with_suffix('')


def instruction_rows(directory, row):
    lines = (directory / row['file']).read_text().splitlines()
    if 'lineStart' in row:
        lines = lines[row['lineStart'] - 1:row['lineStart'] - 1 + row['lineCount']]
    result = []
    for line in lines:
        if not line.strip() or line.lstrip().startswith(';'):
            continue
        tokens = line.split()
        values = []
        for token in tokens[1:]:
            if len(token) != 2 or not set(token) <= HEX:
                break
            values.append(int(token, 16))
        result.append((int(tokens[0], 16), bytes(values)))
    return result


def load_evidence():
    e = json.loads(MANIFEST.read_text())
    raw, instructions, prior = {}, {}, {}
    for r in e['priorEvidence']:
        p = ROOT / r['path']
        assert hashlib.sha256(p.read_bytes()).hexdigest() == r['sha256']
        prior[r['id']] = p.with_suffix(''), json.loads(p.read_text())
    for container in e['containers']:
        p = DIRECTORY / container['file']
        assert hashlib.sha256(p.read_bytes()).hexdigest() == container['sha256']
        assert len(p.read_text().splitlines()) == container['lineCount']
    rows = []
    for ref in e['referencedRanges']:
        directory, prior_e = prior[ref['evidence']]
        r = next(r for r in prior_e.get('ranges', prior_e.get('newRanges', []))
                 if (r['source'], r['start']) == (ref['source'], ref['start']))
        assert all(ref[k] == r[k] for k in ('source', 'start', 'endExclusive', 'sha256'))
        rows.append((directory, r))
    rows.extend((DIRECTORY, r) for r in e['newRanges'])
    for directory, r in rows:
        key = r['source'], r['start']
        assert key not in raw
        raw[key] = read_range(directory, r)
        instructions[key] = instruction_rows(directory, r)
    for r in e['comparisons']:
        for source in ('S1', 'S2'):
            assert hashlib.sha256(raw[source, r['start']]).hexdigest() == r[source + 'sha256']
        assert r['identical'] == (raw['S1', r['start']] == raw['S2', r['start']])
    return e, raw, instructions


class OfficerReturnSource(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.e, cls.raw, cls.instructions = load_evidence()

    def at(self, source, function, address, expected):
        offset = address - int(function, 16)
        expected = bytes.fromhex(expected)
        self.assertEqual(self.raw[source, function][offset:offset + len(expected)], expected)

    def calls(self, source, function, pairs):
        raw = self.raw[source, function]
        for address, target in pairs:
            offset = address - int(function, 16)
            self.assertEqual(raw[offset], 0xe8)
            self.assertEqual(address + 5 + struct.unpack_from('<i', raw, offset + 1)[0], target)

    def test_01_fingerprints_budget_and_separate_adoption(self):
        self.assertEqual(self.e['baselineCommit'], '1ff61538c16a1e95dddc15cd228f63d7e15cd356')
        self.assertEqual(self.e['profileId'], 'source-idb-S1-S2-officer-return-finalizer-v1')
        self.assertEqual([s['idbSha256'] for s in self.e['sources']], [
            'c591cb40ce6d6be9246148002532dedc042463f36cd39c5ed300b7c449feefab',
            'aa7f2c983b266633d6e23c494d4f8e1b03e5251632505cae103e176ae850dfd8'])
        self.assertTrue(all('血色' in s['recordedInputPath'] for s in self.e['sources']))
        for key in ('stockOriginalVerified', 'originalExeExecuted', 'recordedExeHashesIndependentlyVerified'):
            self.assertFalse(self.e[key])
        self.assertEqual(self.e['adoption']['PC-PK1.1'], 'compatibility-reconstruction')
        self.assertEqual(self.e['adoption']['PC-Vanilla-assumed'], 'compatibility-assumption')
        self.assertEqual((len(self.e['newRanges']), len(self.e['referencedRanges']), len(self.e['comparisons'])), (54, 54, 54))
        self.assertEqual(sum(map(len, self.raw.values())), 9560)
        self.assertEqual(self.e['rangeBudget']['newCorpusBytes'], 3744)
        self.assertTrue(all(r['identical'] for r in self.e['comparisons']))

    def test_02_complete_call_ledgers_from_instruction_byte_columns(self):
        self.assertEqual(set(self.e['callLedgers']), {'004BF6F0', '004A31E0', '004A32F0', '004A0CB0', '00489E70', '004A2CB0'})
        for source in ('S1', 'S2'):
            for fn, ledger in self.e['callLedgers'].items():
                calls = [(a, b) for a, b in self.instructions[source, fn]
                         if b[0] == 0xe8 or (b[0] == 0xff and (b[1] & 0x38) == 0x10)]
                self.assertEqual([f'{a:08X}' for a, _ in calls], [r['site'] for r in ledger])
                for (a, b), r in zip(calls, ledger):
                    self.assertEqual(b, bytes.fromhex(r['bytes']))
                    if b[0] == 0xe8:
                        self.assertEqual(a + 5 + struct.unpack_from('<i', b, 1)[0], int(r['target'], 16))
                        self.assertEqual(r['kind'], 'direct')
                    else:
                        self.assertEqual(r['kind'], 'indirect')

    def test_03_valid_entry_and_saved_values_before_notice(self):
        for s in ('S1', 'S2'):
            f = '004BF6F0'
            self.calls(s, f, [(0x4bf702, 0x47a630), (0x4bf71b, 0x47a630),
                             (0x4bf731, 0x491770), (0x4bf750, 0x490d00),
                             (0x4bf766, 0x490ad0), (0x4bf771, 0x486890), (0x4bf77c, 0x490b00)])
            self.at(s, f, 0x4bf70a, '85 c0 0f 84 01 02 00 00')
            self.at(s, f, 0x4bf723, '85 c0 0f 84 e7 01 00 00')
            self.at(s, f, 0x4bf736, '89 44 24 14 8b 86 a0 00 00 00 89 44 24 0c 8b 86 98 00 00 00')
            self.at(s, f, 0x4bf759, '89 44 24 18 ff 52 44')
            self.at(s, f, 0x4bf76d, '89 44 24 10')
            self.at(s, f, 0x4bf7c8, '8b 16 55')  # PUSH EBP shifts saved local offsets.

    def test_04_notice_three_gates_and_message_order(self):
        for s in ('S1', 'S2'):
            f = '004BF6F0'
            self.at(s, f, 0x4bf788, '85 c0 74 3c')
            self.calls(s, f, [(0x4bf78e, 0x47a6d0), (0x4bf799, 0x488c70),
                             (0x4bf7ba, 0x4b93d0), (0x4bf7c0, 0x4f55e0)])
            self.at(s, f, 0x4bf793, '85 c0 74 31')
            self.at(s, f, 0x4bf79e, '85 c0 75 26')
            self.at(s, f, 0x4bf7b1, '68 5d 17 00 00')
            self.at(s, '004B93D0', 0x4b940a, 'c2 10 00')
            self.at(s, f, 0x4bf7a9, '6a ff 6a 01 57 50 57 56')
            self.at(s, f, 0x4bf7bf, '50')
            self.at(s, f, 0x4bf7c5, '83 c4 10')
            self.at(s, '004F55E0', 0x4f5639, 'c3')
            self.assertEqual(self.raw[s, '00488C70'], bytes.fromhex('8b 91 a0 00 00 00 33 c0 83 fa 05 0f 94 c0 c3'))

    def test_05_ruler_ownership_gate_occurs_before_home(self):
        for s in ('S1', 'S2'):
            f = '004BF6F0'
            self.calls(s, f, [(0x4bf7d6, 0x490aa0), (0x4bf7e1, 0x488c00),
                             (0x4bf803, 0x47a630), (0x4bf828, 0x490ad0),
                             (0x4bf831, 0x4b40c0), (0x4bf83e, 0x4a31e0)])
            self.at(s, f, 0x4bf7e6, '85 c0 74 4c')
            self.at(s, f, 0x4bf7fa, '3b c5 75 38')
            self.at(s, f, 0x4bf80b, '85 c0 74 27 8b 85 28 01 00 00 85 c0 75 1d')
            self.at(s, f, 0x4bf81d, 'ff 50 44 6a 00 50')
            self.assertEqual(self.raw[s, '00488C00'], bytes.fromhex('8b 91 a0 00 00 00 33 c0 85 d2 0f 94 c0 c3'))

    def test_06_home_remove_store_add_sort_and_no_same_home_shortcut(self):
        for s in ('S1', 'S2'):
            f = '004A31E0'
            self.calls(s, f, [(0x4a31e6, 0x47a600), (0x4a3202, 0x490d00),
                             (0x4a3215, 0x490d00), (0x4a326a, 0x4a2cb0),
                             (0x4a32cb, 0x47c1b0), (0x4a32da, 0x47cd50)])
            self.at(s, f, 0x4a321c, '85 c9 74 50 8b 41 08')
            self.at(s, f, 0x4a324a, '8d 4b 70')
            self.at(s, f, 0x4a3263, '8d 8b b4 00 00 00')
            self.at(s, f, 0x4a3270, '85 ff 89 ae 98 00 00 00 74 65')
            self.at(s, f, 0x4a32d0, '6a 00 6a 00 6a 00 8b cf 6a 01')
        self.assertFalse(self.e['contracts']['home']['sameHomeShortcut'])

    def test_07_fixed_slot_getters_and_independent_subtype_validity(self):
        for s in ('S1', 'S2'):
            self.at(s, '00490D00', 0x490d00, '8b 44 24 04 85 c0 7c 14 3d ff 3f 00 00 7f 0d')
            self.at(s, '00490D00', 0x490d0f, '6b c0 38 8d 84 08 30 97 08 00 c2 04 00')
            self.calls(s, '004866F0', [(0x4866f6, 0x491770), (0x48670d, 0x490a10)])
            self.calls(s, '00486720', [(0x486726, 0x491770), (0x48673e, 0x490a40), (0x48674d, 0x490a40)])
            self.calls(s, '00486760', [(0x486766, 0x491770), (0x48677e, 0x490a70), (0x48678d, 0x490a70)])
            self.at(s, '00486720', 0x48672b, '83 f8 2a 7c 14 83 f8 33 7f 0f 83 c0 d6')
            self.at(s, '00486760', 0x48676b, '83 f8 34 7c 14 83 f8 56 7f 0f 83 c0 cc')
            self.calls(s, '004A31E0', [(0x4a323e, 0x47a630), (0x4a3257, 0x47a630),
                                    (0x4a329b, 0x47a630), (0x4a32b6, 0x47a630)])

    def test_08_legion_remove_precedes_raw_id_gate_then_bit9_add_sort(self):
        for s in ('S1', 'S2'):
            f = '004A32F0'
            self.calls(s, f, [(0x4a32f6, 0x47a600), (0x4a3314, 0x490ad0),
                (0x4a331c, 0x47a630), (0x4a3330, 0x482af0), (0x4a333c, 0x482fc0),
                (0x4a3366, 0x489e70), (0x4a3371, 0x490ad0), (0x4a3379, 0x47a630),
                (0x4a338b, 0x47c1b0), (0x4a339a, 0x47cd50)])
            self.at(s, f, 0x4a3328, '6a 00 83 c7 30 56 8b cf')
            self.at(s, f, 0x4a3335, '85 c0 74 08')
            self.at(s, f, 0x4a3345, '83 ff ff 74 09 85 ff 7c 1d 83 ff 2e 7f 18')
            self.at(s, f, 0x4a3353, '85 ff 89 be 94 00 00 00 7c 0e 83 ff 2e 7f 09 6a 01')
            self.at(s, f, 0x4a3390, '6a 00 6a 00 6a 00 6a 01 8b cf')
        self.assertFalse(self.e['contracts']['legion']['sameLegionShortcut'])

    def test_09_bit9_is_dword_or_preserving_surrounding_bits(self):
        for s in ('S1', 'S2'):
            self.at(s, '00489E70', 0x489e70, '8b 44 24 04 50 81 c1 24 01 00 00 6a 09 51')
            self.calls(s, '00489E70', [(0x489e7e, 0x472520)])
            self.at(s, '00472520', 0x47252c, '8b c8 c1 e9 05 56 83 e0 1f')
            self.at(s, '00472520', 0x472563, 'b8 01 00 00 00 d3 e0 8b 0e 5f 0b c8 89 0e')
            self.at(s, '00472520', 0x47255d, '85 c0 8b cf 74 10')

    def test_10_remove_find_and_conditional_erase_are_distinct(self):
        for s in ('S1', 'S2'):
            self.calls(s, '004A2CB0', [(0x4a2cba, 0x482af0), (0x4a2cc6, 0x482fc0)])
            self.at(s, '004A2CB0', 0x4a2cbf, '85 c0 74 08')
            self.at(s, '00482AF0', 0x482b25, '8b 77 04')
            self.at(s, '00482AF0', 0x482b43, '8d 7e 08')
            self.at(s, '00482AF0', 0x482b6a, '8b 0f 8b 54 24 1c 33 c0 3b ca 0f 94 c0')
            self.at(s, '0047C1B0', 0x47c213, '89 57 08')
            self.at(s, '0047CD50', 0x47cd6c, '8b 73 0c 83 fe 02')

    def test_11_troop_location_requires_valid_troop_and_leader_or_two_deputies(self):
        for s in ('S1', 'S2'):
            self.at(s, '004891C0', 0x4891c4, '8b 87 9c 00 00 00 83 f8 57 7c 4b 3d 3e 04 00 00 7f 44')
            self.calls(s, '004891C0', [(0x4891f0, 0x490e70), (0x4891f8, 0x47a630),
                                     (0x48920a, 0x491310), (0x489212, 0x495390)])
            self.at(s, '004891C0', 0x489200, '85 c0 74 16')
            self.at(s, '00495390', 0x4953a0, '8b 71 0c')
            self.calls(s, '00495390', [(0x4953b0, 0x495340)])
            self.at(s, '00495340', 0x495353, '8d 51 10')
            self.at(s, '00495340', 0x49536a, '40 83 c2 04 83 f8 02 7c e3')

    def test_12_matching_kind_base_getter_preserves_canonical_id_else_minus_one(self):
        for s in ('S1', 'S2'):
            f = '00486680'
            self.at(s, f, 0x486680, '8b 41 08 83 e8 00 74 4c 48 74 26 48 75 5a')
            self.at(s, f, 0x486699, '83 f8 34 7c 4a 83 f8 56 7f 45')
            self.at(s, f, 0x4866ad, '83 c0 34 c3')
            self.at(s, f, 0x4866bc, '83 f8 2a 7c 27 83 f8 33 7f 22')
            self.at(s, f, 0x4866d0, '83 c0 2a c3')
            self.at(s, f, 0x4866df, '85 c0 7c 05 83 f8 29 7e 03 83 c8 ff c3')
            self.calls(s, '004BF6F0', [(0x4bf845, 0x4891c0), (0x4bf850, 0x486680), (0x4bf859, 0x4a0cb0)])
            self.at(s, '004BF6F0', 0x4bf84a, '85 c0 75 10')

    def test_13_actual_location_write_then_ui_callback(self):
        for s in ('S1', 'S2'):
            self.calls(s, '004A0CB0', [(0x4a0cb9, 0x47a600), (0x4a0ce1, 0x4b9480)])
            self.at(s, '004A0CB0', 0x4a0cc9, '83 f8 ff 74 0b 85 c0 7c 14 3d 3e 04 00 00 7f 0d')
            self.at(s, '004A0CB0', 0x4a0cdb, '89 87 9c 00 00 00')
            self.calls(s, '004B9480', [(0x4b9480, 0x4ec870)])
            self.at(s, '004B9480', 0x4b9485, '85 c0 74 12 8b 10 6a 00 6a 00 6a 00 6a 00 8b c8 ff 92 b4 01 00 00')

    def test_14_affiliation_gate_numeric_force_and_live_double_read(self):
        for s in ('S1', 'S2'):
            f = '004BF6F0'
            self.at(s, f, 0x4bf862, 'ff 52 40 85 c0 0f 8c a4 00 00 00 83 f8 2e 0f 8f 9b 00 00 00')
            self.at(s, f, 0x4bf87a, 'ff 50 40 8b 17 8b cf 8b e8 ff 52 40 3b e8 0f 85 83 00 00 00')
            self.at(s, f, 0x4bf892, 'ff 50 44 50 56 8b cb')
            self.calls(s, f, [(0x4bf899, 0x4a32f0), (0x4bf8ab, 0x490ad0)])
            self.at(s, f, 0x4bf89e, '8b 17 8b cf ff 52 44')

    def test_15_saved_role_gates_and_live_old_home_legion_comparison(self):
        for s in ('S1', 'S2'):
            f = '004BF6F0'
            self.at(s, f, 0x4bf8b2, '83 7c 24 10 01 7f 1f 8b 6c 24 14')
            self.calls(s, f, [(0x4bf8be, 0x47a630), (0x4bf8d3, 0x4be2a0),
                             (0x4bf8dd, 0x4be2a0), (0x4bf8e7, 0x47a630), (0x4bf90c, 0x4bca30)])
            self.at(s, f, 0x4bf8c6, '85 c0 74 0e 3b ee 74 0a 6a 00 55 8b cb')
            self.at(s, f, 0x4bf8d8, '6a 00 56 8b cb')
            self.at(s, f, 0x4bf8e2, '8b 74 24 1c')
            self.at(s, f, 0x4bf8ef, '85 c0 74 1e')
            self.at(s, f, 0x4bf8f7, 'ff 50 44 8b 16 8b ce 8b f8 ff 52 44 3b c7 74 0a 6a 00 56 8b cb')

    def test_16_person_legion_force_vtables_and_no_status_bit9_getter_dependency(self):
        for s in ('S1', 'S2'):
            self.assertEqual(struct.unpack_from('<II', self.raw[s, '0079C780'], 0x40), (0x47b2b0, 0x4883b0))
            self.assertEqual(struct.unpack_from('<I', self.raw[s, '0079BFB0'], 0x40)[0], 0x65d6c0)
            self.assertEqual(self.raw[s, '004883B0'], bytes.fromhex('8b 81 94 00 00 00 c3'))
            self.assertEqual(self.raw[s, '0065D6C0'], bytes.fromhex('8b 41 04 c3'))
            self.calls(s, '0047B2B0', [(0x47b2bc, 0x490ad0), (0x47b2c4, 0x47a630)])
            self.at(s, '0047B2B0', 0x47b2d0, '8b 16 8b ce 5e ff 62 40 83 c8 ff')
            self.at(s, '0047E070', 0x47e085, '85 c0 7c 0c 83 f8 2e 7f 07')
            self.at(s, '00490AD0', 0x490ad4, '85 c0 7c 15 83 f8 2e 7f 10')

    def test_17_building_legion_uses_valid_subtype_raw_getter_without_normalization(self):
        for s in ('S1', 'S2'):
            self.assertEqual(struct.unpack_from('<II', self.raw[s, '0079C718'], 0x40), (0x487eb0, 0x4867d0))
            for table, getter in (('0079BF98', 0x47c320), ('0079C1B0', 0x483810), ('0079C810', 0x483810)):
                self.assertEqual(struct.unpack('<II', self.raw[s, table]), (0x47b2b0, getter))
            self.assertEqual(self.raw[s, '0047C320'], bytes.fromhex('8b 41 38 c3'))
            self.assertEqual(self.raw[s, '00483810'], bytes.fromhex('8b 41 20 c3'))
            self.calls(s, '004867D0', [(0x486808, 0x490a70), (0x486810, 0x47a630),
                (0x48683c, 0x490a40), (0x486844, 0x47a630), (0x48686a, 0x490a10), (0x486872, 0x47a630)])
            self.at(s, '004867D0', 0x486886, '83 c8 ff 5e c3')
            self.calls(s, '00487EB0', [(0x487eb4, 0x487b30)])
            self.at(s, '00487EB0', 0x487eb9, '85 c0 74 06 8b 46 0c')
            self.at(s, '00487EB0', 0x487edb, '83 b8 b4 00 00 00 04')

    def test_18_only_four_scalar_families_projected_and_role_reconciliation_deferred(self):
        c = self.e['contracts']
        self.assertTrue(c['getters']['buildingForce']['observationBoundary'])
        self.assertTrue(all(not v for v in self.e['implementationBoundary']['evidenceFlags'].values()))
        self.assertFalse(c['getters']['personLegion']['usesStatusOrBit9'])
        self.assertFalse(c['getters']['buildingLegion']['subtypeLegionIdNormalizes'])
        self.assertIn('acted bit0', c['entry']['doesNotWrite'])
        self.assertIn('mission', c['entry']['doesNotWrite'])
        for fn in ('004BE2A0', '004BCA30', '004B40C0'):
            self.assertIn('unexecuted', c['deferred'][fn])
        self.assertEqual([r['stage'] for r in c['orderedBoundaries']], [
            'notice', 'ownership', 'home', 'actual-location', 'affiliation-gate',
            'legion', 'resolve-new-legion', 'old-legion-role', 'new-legion-role', 'old-home-role'])


if __name__ == '__main__':
    unittest.main()
