"""P0-61 independent static composition checks; no model/target-code execution.

Default mode checks only committed source bytes with the Python standard library.
Optional --idb-s1 PATH --idb-s2 PATH also rehashes each whole IDB and independently
reads its raw ID1 low-byte columns, without importing IDAPython or a disassembler.
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
MANIFEST = ROOT / 'docs/sources/mission-event-composition.json'
HEX = frozenset('0123456789abcdefABCDEF')


def digest(raw):
    return hashlib.sha256(raw).hexdigest()


def read_range(directory, row):
    """Parse byte columns, never rendered instruction names or comments."""
    lines = (directory / row['file']).read_text().splitlines()
    first = row['lineStart'] - 1
    lines = lines[first:first + row['lineCount']]
    assert len(lines) == row['lineCount']
    out = bytearray()
    address = int(row['start'], 16)
    for line in lines:
        parts = line.split()
        assert parts and int(parts[0], 16) == address
        values = []
        for token in parts[1:]:
            if len(token) != 2 or not set(token) <= HEX:
                break
            values.append(int(token, 16))
        assert values
        out.extend(values)
        address += len(values)
    assert address == int(row['endExclusive'], 16)
    assert digest(out) == row['sha256'] == row['independentId1Sha256']
    return bytes(out)


def load_evidence():
    e = json.loads(MANIFEST.read_text())
    priors = {}
    for ref in e['priorEvidence']:
        path = ROOT / ref['path']
        assert digest(path.read_bytes()) == ref['sha256']
        p = json.loads(path.read_text())
        assert p['sources'] == e['sources']
        directory = path.with_suffix('')
        for row in p['containers']:
            target = directory / row['file']
            assert digest(target.read_bytes()) == row['sha256']
            assert len(target.read_text().splitlines()) == row['lineCount']
        priors[ref['id']] = {
            (r['source'], r['start']): (r, read_range(directory, r))
            for r in p['ranges']
        }
    raw = {}
    for ref in e['referencedRanges']:
        key = ref['source'], ref['start']
        assert key not in raw
        assert ref['evidence']
        values = []
        for name in ref['evidence']:
            row, value = priors[name][key]
            assert all(ref[k] == row[k] for k in
                       ('source', 'start', 'endExclusive', 'sha256', 'kind', 'role'))
            values.append(value)
        assert all(value == values[0] for value in values)
        assert ref['sha256'] == ref['independentId1Sha256']
        raw[key] = values[0]
    assert set(raw) == set().union(*(set(p) for p in priors.values()))
    for row in e['comparisons']:
        a, b = (raw[s, row['start']] for s in ('S1', 'S2'))
        assert len(a) == len(b)
        assert row['identical'] == (a == b)
        assert row['differingByteCount'] == sum(x != y for x, y in zip(a, b))
        assert row['S1sha256'] == digest(a) and row['S2sha256'] == digest(b)
    return e, raw


def verify_raw_id1(path, identity, selected):
    """Read only the known IDAv6 uncompressed ID1 format, independently."""
    with Path(path).open('rb') as fp:
        assert hashlib.file_digest(fp, 'sha256').hexdigest() == identity['idbSha256']
        with mmap.mmap(fp.fileno(), 0, access=mmap.ACCESS_READ) as data:
            assert data[:4] == b'IDA1'
            assert struct.unpack_from('<H', data, 0x1e)[0] == 6
            section = struct.unpack_from('<Q', data, 0x0e)[0]
            assert data[section] == 0, 'Compressed ID1 is outside this reader'
            length = struct.unpack_from('<Q', data, section + 1)[0]
            body = section + 9
            assert body + length <= len(data)
            assert data[body:body+4] == b'VA*\x00'
            count = struct.unpack_from('<I', data, body + 8)[0]
            assert 0 < count <= (0x2000 - 0x14) // 8
            segments = []
            offset = body + 0x2000
            for i in range(count):
                start, end = struct.unpack_from('<II', data, body + 0x14 + 8*i)
                assert start < end
                segments.append((start, end, offset))
                offset += 4 * (end - start)
            assert offset <= body + length
            for address, expected in selected.items():
                address = int(address, 16)
                matches = [(a, b, o) for a, b, o in segments
                           if a <= address and address + len(expected) <= b]
                assert len(matches) == 1
                a, _, o = matches[0]
                offset = o + 4 * (address - a)
                actual = data[offset:offset + 4*len(expected):4]
                assert actual == expected, (identity['source'], f'{address:08X}')


class EventCompositionSource(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.e, cls.raw = load_evidence()

    def at(self, s, fn, address, expected):
        raw = bytes.fromhex(expected)
        offset = address - int(fn, 16)
        self.assertEqual(self.raw[s, fn][offset:offset+len(raw)], raw)

    def call(self, s, fn, address, target, opcode=0xe8):
        raw = self.raw[s, fn]
        offset = address - int(fn, 16)
        self.assertEqual(raw[offset], opcode)
        self.assertEqual(address+5+struct.unpack_from('<i', raw, offset+1)[0], target)

    def test_01_source_identity_adoption_and_deduplicated_budget(self):
        self.assertEqual(self.e['profileId'], 'source-idb-S1-S2-mission-event-composition-v1')
        self.assertEqual(self.e['baselineCommit'], '1e5862e045c9aec3db14540c2bd8decc565a321b')
        self.assertEqual([s['idbSha256'] for s in self.e['sources']], [
            'c591cb40ce6d6be9246148002532dedc042463f36cd39c5ed300b7c449feefab',
            'aa7f2c983b266633d6e23c494d4f8e1b03e5251632505cae103e176ae850dfd8'])
        self.assertEqual(len(self.raw), 425)
        self.assertEqual(sum(map(len, self.raw.values())), 29809)
        self.assertEqual(len(self.e['comparisons']), 212)
        self.assertEqual(self.e['rangeBudget'], {
            'commonRangesPerSource':212, 'rangesBothSources':425,
            'sourceSpecificRanges':1, 'referencedRanges':425, 'newByteRanges':0,
            'totalSelectedBytesBothSources':29809,
            'identicalCommonRangePairs':208, 'differentCommonRangePairs':4,
            'priorDuplicateRangeReferencesRemoved':36})
        for key in ('stockOriginalVerified', 'originalExeExecuted',
                    'recordedExeHashesIndependentlyVerified'):
            self.assertIs(self.e[key], False)
        self.assertEqual(self.e['adoption'], {'PC-PK1.1':'compatibility-reconstruction',
            'PC-Vanilla-assumed':'compatibility-assumption', 'PS2-Wii':'open'})

    def test_02_prior_primitives_are_pinned_without_source_collapse(self):
        self.assertEqual({p['id'] for p in self.e['priorEvidence']},
                         {'mission-event-listeners', 'mission-notification-tail'})
        self.assertEqual([r['start'] for r in self.e['comparisons'] if not r['identical']],
                         ['004890F0', '004A5600', '0079B830', '0079C2B0'])
        self.assertNotIn(('S1', '0090CBA0'), self.raw)
        self.assertIn(('S2', '0090CBA0'), self.raw)
        self.assertEqual(self.raw['S1', '004BBAA0'], self.raw['S2', '004BBAA0'])
        self.assertEqual(self.raw['S1', '004EC870'], self.raw['S2', '004EC870'])

    def test_03_wrapper_event_stack_record_and_same_manager(self):
        for s in ('S1', 'S2'):
            self.at(s, '004BBAA0', 0x4bbaa0,
                    '83 ec 0c 8b 44 24 10 8b 54 24 18 56 8b f1 8b 4c 24 18')
            self.at(s, '004BBAA0', 0x4bbab2,
                    '89 44 24 04 8d 44 24 04 89 4c 24 08 50 8b ce 89 54 24 10')
            self.call(s, '004BBAA0', 0x4bbac5, 0x4a8110)
            self.at(s, '004BBAA0', 0x4bbaca, '8d 4c 24 04 51 8b ce')
            self.call(s, '004BBAA0', 0x4bbad1, 0x4ba1d0)

    def test_04_post_observer_fresh_read_null_branch_and_four_zeros(self):
        for s in ('S1', 'S2'):
            self.call(s, '004BBAA0', 0x4bbad6, 0x4ec870)
            self.at(s, '004BBAA0', 0x4bbadb,
                    '85 c0 5e 74 12 8b 10 6a 00 6a 00 6a 00 6a 00 8b c8 ff 92 b4 01 00 00')
            self.at(s, '004BBAA0', 0x4bbaf2, '83 c4 0c c2 0c 00')
            self.assertEqual(self.raw[s, '004EC870'], bytes.fromhex('a1 48 a0 1b 09 c3'))
            # No fixed success-value assignment follows the optional callback.
            self.assertEqual(len(self.raw[s, '004BBAA0']), 0x58)

    def test_05_second_subsystem_8_and_14_reach_only_epilogue(self):
        for s in ('S1', 'S2'):
            fn = '004BA1D0'
            self.at(s, fn, 0x4ba1e1, '8b 07 83 cd ff 83 e8 09')
            self.at(s, fn, 0x4ba1fd, '74 68 83 e8 07 74 09 83 e8 02 0f 85 6b 02 00 00')
            for event in (8, 14):
                a = (event - 9) & 0xffffffff
                self.assertNotEqual(a, 0)
                a = (a - 7) & 0xffffffff
                self.assertNotEqual(a, 0)
                self.assertNotEqual((a - 2) & 0xffffffff, 0)
            self.assertEqual(self.raw[s, '004BA478'],
                             bytes.fromhex('5f 5e 5d 5b 81 c4 84 0b 00 00 c2 04 00'))

    def test_06_copy_pointers_then_live_executing_and_live_mission(self):
        for s in ('S1', 'S2'):
            self.at(s, '004A8110', 0x4a8153, '68 dc 1a 20 07')
            self.call(s, '004A8110', 0x4a8160, 0x49f820)
            self.call(s, '0049F820', 0x49f867, 0x47bed0)
            self.at(s, '0049F820', 0x49f86c, '8b 08 51 8b cf')
            self.call(s, '0049F820', 0x49f871, 0x47c1b0)
            self.at(s, '004A8110', 0x4a8184,
                    '8b 00 3b 05 94 15 77 09 74 1b 8b 88 3c 01 00 00 3b ce 7c 11 83 f9 2b 7f 0c')
            self.call(s, '004A8110', 0x4a81a4, 0x5b9d30)
            self.call(s, '004A8110', 0x4a81bc, 0x47c100)

    def test_07_captured_mission_not_live_mission_selects_handler(self):
        for s in ('S1', 'S2'):
            self.at(s, '005B9D30', 0x5b9d37, '8b 9d 3c 01 00 00 83 fb 25')
            self.at(s, '005B9D30', 0x5b9dd4, '8b 4c 98 08 8b 11 57 55 ff 52 08 85 c0 74 1b')
            self.at(s, '005B9D30', 0x5b9de7,
                    '8b 4c 98 08 8b 11 57 55 ff 52 0c 5f 5d b8 01 00 00 00')

    def test_08_saved_handler_pointers_raw44_and_restored_actor(self):
        for s in ('S1', 'S2'):
            for fn, current, target, raw44, gate, start, end, call in [
                ('005B6D00',0x5b6d3c,0x5b6d6c,0x5b6db0,0x5b6db8,0x5b6dc4,0x5b6e35,0x5b6e38),
                ('005CFB70',0x5cfbac,0x5cfbd0,0x5cfc14,0x5cfc1c,0x5cfc28,0x5cfc99,0x5cfc9c)]:
                self.at(s, fn, current, '8b d8')
                self.at(s, fn, target, '89 44 24 18')
                self.at(s, fn, raw44, '8b 4f 44 89 4c 24 10')
                self.call(s, fn, gate, 0x5b81d0)
                self.at(s, fn, start, '8b 54 24 14 52 56')
                self.at(s, fn, end-3, '8b 75 08')
                self.at(s, fn, end, '6a 00 56')
                self.call(s, fn, call, 0x5b8400)

    def test_09_return_reloads_live_fields_then_preserves_saved_home_or_distance(self):
        for s in ('S1', 'S2'):
            self.at(s, '005B8400', 0x5b8405,
                    '8b 86 9c 00 00 00 85 c0 57 7c 05 83 f8 56 7e 03 83 c8 ff')
            self.at(s, '005B8400', 0x5b8418, '8b be 98 00 00 00 3b c7 74 53')
            self.call(s, '005B8400', 0x5b8442, 0x49e4d0)
            self.at(s, '005B8400', 0x5b844f, '8b f8')
            self.call(s, '005B8400', 0x5b8460, 0x4a73a0)
            self.at(s, '005B8400', 0x5b8465, '57 56')
            self.call(s, '005B8400', 0x5b846c, 0x4a5660)
            self.call(s, '005B8400', 0x5b8495, 0x4a5600)
            self.call(s, '005B8400', 0x5b84bb, 0x488c70)
            self.at(s, '005B8400', 0x5b84c4, '57')
            self.call(s, '005B8400', 0x5b84ca, 0x490d00)
            self.at(s, '005B8400', 0x5b84cf, '6a 01 6a 00 50 56')
            self.call(s, '005B8400', 0x5b84da, 0x4bf6f0)

    def test_10_acted_observer_is_a_separate_earlier_runtime_read(self):
        for s in ('S1', 'S2'):
            for site, target in [(0x489b4e,0x472520), (0x489b5b,0x4a06a0),
                                 (0x489b65,0x4b9480)]:
                self.call(s, '00489B40', site, target)
            self.call(s, '004B9480', 0x4b9480, 0x4ec870)
            self.at(s, '004B9480', 0x4b9485,
                    '85 c0 74 12 8b 10 6a 00 6a 00 6a 00 6a 00 8b c8 ff 92 b4 01 00 00 c3')
            self.call(s, '004A73A0', 0x4a73f8, 0x489b40)
            self.call(s, '004A73A0', 0x4a7403, 0x482f80)
            self.call(s, '00482F80', 0x482f89, 0x47a630)
            self.call(s, '004A5660', 0x4a5666, 0x47a630)

    def test_11_source_specific_acted_wrapper_and_query_remain_open(self):
        self.call('S1', '004A5600', 0x4a5619, 0x489b40)
        self.call('S2', '004A5600', 0x4a5619, 0x90cba0)
        self.call('S2', '0090CBA0', 0x90cbb7, 0x4890f0)
        self.at('S2', '0090CBA0', 0x90cbbc, '85 c0 59 75 07 6a 01')
        self.call('S2', '0090CBA0', 0x90cbc3, 0x489b40)
        self.call('S2', '004890F0', 0x4890f4, 0x9142f8, 0xe9)
        self.call('S2', '004890F0', 0x4890fb, 0x8ea258, 0xe9)

    def test_12_boundary_extents_and_open_closure_are_explicit(self):
        boundaries = {r['id']: r for r in self.e['boundaries']}
        self.assertEqual(boundaries['presentation23']['start'], '005B6DC4')
        self.assertEqual(boundaries['presentation23']['endExclusive'], '005B6E35')
        self.assertEqual(boundaries['presentation24']['start'], '005CFC28')
        self.assertEqual(boundaries['presentation24']['endExclusive'], '005CFC99')
        self.assertEqual(boundaries['post-event-observer']['readCallSite'], '004BBAD6')
        self.assertEqual(boundaries['post-event-observer']['callbackSite'], '004BBAEC')
        self.assertEqual(boundaries['post-event-observer']['arguments'], [0,0,0,0])
        self.assertEqual(boundaries['full-return']['helper'], '004BF6F0')
        self.assertEqual(boundaries['s2-query267']['source'], 'S2')
        self.assertIs(self.e['contracts']['nativeReturnValueSpecified'], False)
        self.assertIs(self.e['contracts']['recursiveEventInternalsRecovered'], False)
        self.assertIs(self.e['contracts']['completeGameTransactionVerified'], False)

    def test_13_reused_primitive_files_are_hash_locked(self):
        refs = self.e['primitiveImplementationDependencies']
        self.assertEqual({r['path'] for r in refs}, {
            'scripts/mission_event_listener_profile.py',
            'scripts/mission_notification_tail_profile.py'})
        for ref in refs:
            self.assertEqual(digest((ROOT / ref['path']).read_bytes()), ref['sha256'])
            self.assertTrue(ref['primitiveMethods'])


if __name__ == '__main__':
    parser = argparse.ArgumentParser(add_help=False)
    parser.add_argument('--idb-s1')
    parser.add_argument('--idb-s2')
    args, remaining = parser.parse_known_args()
    if args.idb_s1 or args.idb_s2:
        e, raw = load_evidence()
        for identity in e['sources']:
            path = args.idb_s1 if identity['source'] == 'S1' else args.idb_s2
            if path:
                selected = {a:b for (s,a),b in raw.items() if s == identity['source']}
                verify_raw_id1(path, identity, selected)
                print(f"{identity['source']}: whole-IDB hash and {len(selected)} raw ID1 ranges verified")
    unittest.main(argv=[sys.argv[0]] + remaining)
