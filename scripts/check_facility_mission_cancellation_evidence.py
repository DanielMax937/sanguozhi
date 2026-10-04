"""P0-54 independent bounded-IDB evidence checks; no engine/model execution.

Run directly with the Python standard library. This validates committed textual
bytes, provenance-chain hashes, source comparisons, relative calls, switch
maps, and scalar store widths. It does not need the unredistributed IDBs.
"""
import hashlib
import json
from pathlib import Path
import struct
import unittest

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / 'docs/sources/facility-mission-cancellation.json'
DIRECTORY = MANIFEST.with_suffix('')
HEX = frozenset('0123456789abcdefABCDEF')


def read_range(directory, row):
    """Read contiguous byte columns, independent of rendered instruction names."""
    lines = (directory / row['file']).read_text().splitlines()
    if 'lineStart' in row:
        start = row['lineStart'] - 1
        lines = lines[start:start + row['lineCount']]
    out = bytearray()
    first = end = None
    for line in lines:
        if not line.strip() or line.lstrip().startswith(';'):
            continue
        parts = line.split()
        address = int(parts[0], 16)
        values = []
        for token in parts[1:]:
            if len(token) != 2 or not set(token) <= HEX:
                break
            values.append(int(token, 16))
        if not values:
            raise AssertionError('Missing bytes: ' + line)
        if first is None:
            first = address
        if end is not None and address != end:
            raise AssertionError(f'Noncontiguous bytes: {end:08X} / {address:08X}')
        out.extend(values)
        end = address + len(values)
    raw = bytes(out)
    assert (first, end, hashlib.sha256(raw).hexdigest()) == (
        int(row['start'], 16), int(row['endExclusive'], 16), row['sha256'])
    return raw


def load_evidence():
    evidence = json.loads(MANIFEST.read_text())
    prior = {}
    for row in evidence['priorEvidence']:
        path = ROOT / row['path']
        assert hashlib.sha256(path.read_bytes()).hexdigest() == row['sha256']
        prior[row['id']] = (path.with_suffix(''), json.loads(path.read_text()))
    raw = {}
    for ref in evidence['referencedRanges']:
        directory, manifest = prior[ref['evidence']]
        rows = manifest.get('ranges', manifest.get('newRanges', []))
        row = next(r for r in rows if (r['source'], r['start']) == (ref['source'], ref['start']))
        assert all(ref[k] == row[k] for k in ('source', 'start', 'endExclusive', 'sha256'))
        key = row['source'], row['start']
        assert key not in raw
        raw[key] = read_range(directory, row)
    for container in evidence['containers']:
        path = DIRECTORY / container['file']
        assert hashlib.sha256(path.read_bytes()).hexdigest() == container['sha256']
        assert len(path.read_text().splitlines()) == container['lineCount']
    for row in evidence['newRanges']:
        key = row['source'], row['start']
        assert key not in raw
        raw[key] = read_range(DIRECTORY, row)
    for row in evidence['comparisons']:
        for source in ('S1', 'S2'):
            assert hashlib.sha256(raw[source, row['start']]).hexdigest() == row[source + 'sha256']
        assert row['identical'] == (raw['S1', row['start']] == raw['S2', row['start']])
    return evidence, raw


class FacilityEvidence(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.e, cls.raw = load_evidence()

    def at(self, source, function, address, expected):
        offset = address - int(function, 16)
        expected = bytes.fromhex(expected)
        self.assertEqual(self.raw[source, function][offset:offset + len(expected)], expected)

    def call_at(self, source, function, address, target):
        raw = self.raw[source, function]
        offset = address - int(function, 16)
        self.assertEqual(raw[offset], 0xe8)
        self.assertEqual(address + 5 + struct.unpack('<i', raw[offset + 1:offset + 5])[0], target)

    def test_independent_provenance_and_bounded_counts(self):
        self.assertEqual(len(self.e['newRanges']), 77)
        self.assertEqual(len(self.e['referencedRanges']), 24)
        self.assertEqual(len(self.e['containers']), 6)
        self.assertEqual([r['start'] for r in self.e['comparisons'] if not r['identical']],
                         ['00484DE0', '00489CE0', '004B0C80'])
        self.assertFalse(self.e['stockOriginalVerified'])
        self.assertFalse(self.e['originalExeExecuted'])
        self.assertFalse(self.e['recordedExeHashesIndependentlyVerified'])
        self.assertEqual(self.e['adoption']['PC-Vanilla-assumed'], 'compatibility-assumption')
        self.assertTrue(all('血色' in s['recordedInputPath'] for s in self.e['sources']))
        self.assertEqual([r['source'] for r in self.e['sources']], ['S1', 'S2'])

    def test_model_profile_consistency(self):
        import facility_mission_cancellation_profile as model
        self.assertEqual(self.e['profileId'], model.PROFILE_ID)
        self.assertEqual(tuple((int(w['offset'], 16), w['width'], w['value'])
                         for w in self.e['contracts']['facilityReset']['writes']), model.RESET_STORES)
        self.assertEqual(model.BUILDING_VTABLE, 0x79c718)
        self.assertEqual(sorted(model.HANDLERS), self.e['contracts']['missions'])

    def test_full_handlers_order_and_reason_one(self):
        for source in ('S1', 'S2'):
            for function in ('005BBE30', '005D69D0'):
                self.assertEqual(self.raw[source, function], self.raw['S1', function])
            for function, calls in (
                ('005BBE30', [(0x5bbe3f, 0x47a630), (0x5bbe6e, 0x490d00),
                             (0x5bbe76, 0x47a630), (0x5bbe94, 0x4866f0),
                             (0x5bbebc, 0x5b8250), (0x5bbed7, 0x490d00),
                             (0x5bbedf, 0x47a630), (0x5bbef1, 0x5b81d0),
                             (0x5bbf88, 0x5b8400), (0x5bbfa7, 0x490b30),
                             (0x5bbfc1, 0x4a0f00), (0x5bbfda, 0x4b09b0)]),
                ('005D69D0', [(0x5d69df, 0x47a630), (0x5d6a0e, 0x490d00),
                             (0x5d6a16, 0x47a630), (0x5d6a33, 0x4866f0),
                             (0x5d6a4b, 0x490d00), (0x5d6a53, 0x47a630),
                             (0x5d6a64, 0x5b81d0), (0x5d6aea, 0x5b8400),
                             (0x5d6b08, 0x4b09b0)])):
                for address, target in calls:
                    self.call_at(source, function, address, target)
            self.at(source, '005BBE30', 0x5bbf85, '6a 00 53')
            self.at(source, '005D69D0', 0x5d6ae7, '6a 00 57')
            self.at(source, '005BBE30', 0x5bbfcd, '83 39 0c 74 0d 6a 01 57')
            self.at(source, '005D69D0', 0x5d6afb, '83 f9 0c 74 0d 6a 01 56')

    def test_shared_gate_is_actual_location_city_not_target_type(self):
        for source in ('S1', 'S2'):
            self.at(source, '005BBE30', 0x5bbe55, '8b 86 9c 00 00 00 85 c0 7c 05 83 f8 56')
            self.at(source, '005D69D0', 0x5d69f5, '8b 87 9c 00 00 00 85 c0 7c 05 83 f8 56')
            self.at(source, '005BBE30', 0x5bbe86, '8b 47 08 85 c0')
            self.at(source, '005D69D0', 0x5d6a26, '8b 46 08 85 c0')
            self.at(source, '005BBE30', 0x5bbef9, '85 c0 74 6d')
            self.at(source, '005BBE30', 0x5bbfe1, 'b8 01 00 00 00')
            self.at(source, '005D69D0', 0x5d6b0e, 'b8 01 00 00 00')
            self.at(source, '005BBE30', 0x5bbeb2, '6a 03 8d 4c 24 14 51 50 6a 00')

    def test_treasure_range_gate_setter_and_exact_s2_hook(self):
        for source in ('S1', 'S2'):
            self.at(source, '005BBE30', 0x5bbf99, '83 7f 08 1e 5b 75 26 6a 2a')
            self.at(source, '005BBE30', 0x5bbfac, '8b 48 40 85 c9 7c 08 81 f9 4b 04 00 00 7e 0b')
            self.call_at(source, '004A0F00', 0x4a0f06, 0x47a630)
            self.at(source, '004A0F00', 0x4a0f12, '6a ff 6a ff 8b ce')
            self.call_at(source, '004A0F00', 0x4a0f18, 0x484de0)
            self.at(source, '004A0F00', 0x4a0f1d, '6a 00 8b ce')
            self.call_at(source, '004A0F00', 0x4a0f21, 0x484e20)
            self.at(source, '00484E20', 0x484e32, '89 41 48')
        self.at('S1', '00484DE0', 0x484de0, '83 c8 ff 89 41 40 89 41 44')
        self.at('S2', '00484DE0', 0x484de0, '8b 41 40 83 ca ff 89 51 40 89 51 44')
        self.call_at('S2', '00484DE0', 0x484dec, 0x8ea230)
        self.call_at('S2', '00484DE0', 0x484e03, 0x8ea230)
        hook = self.raw['S2', '008EA230']
        self.assertEqual(len(hook), 0x26)
        self.assertEqual(hook[-3:], bytes.fromhex('5e 59 c3'))
        for address, target in ((0x8ea238, 0x490b00), (0x8ea240, 0x47a630), (0x8ea24e, 0x48a2d0)):
            self.call_at('S2', '008EA230', address, target)

    def test_facility_constructor_vtable_and_all_reset_store_widths(self):
        expected = bytes.fromhex(
            '8b 44 24 04 56 50 8b f1 e8 f3 cd f9 ff 33 c0 83 c9 ff '
            '89 4e 08 89 4e 0c 66 89 46 10 89 46 14 89 46 18 88 46 1c '
            '66 89 4e 1e 66 89 4e 20 89 46 28 89 46 2c 5e c2 04 00')
        for source in ('S1', 'S2'):
            self.assertEqual(self.raw[source, '00486430'], expected)
            self.assertEqual(self.raw[source, '00423230'], bytes.fromhex('c2 04 00'))
            table = self.raw[source, '0079C718']
            self.assertEqual(struct.unpack_from('<I', table, 0x20)[0], 0x486430)
            self.assertEqual(struct.unpack_from('<I', table, 0x24)[0], 0x573470)
            self.assertEqual(struct.unpack_from('<I', table, 0x2c)[0], 0x4863d0)
            self.at(source, '0047A660', 0x47a687, 'ff 50 2c')
            self.at(source, '004863D0', 0x4863df, '83 fe 05 74 04 5e c2 04 00 b8 01 00 00 00 5e c2 04 00')
            self.assertEqual(struct.unpack_from('<I', table, 0x08)[0], 0x486400)
            self.assertEqual(self.raw[source, '00573470'], bytes.fromhex('b8 05 00 00 00 c3'))
            self.at(source, '004880A0', 0x4880a8, 'c7 06 18 c7 79 00 66 c7 46 22 ff ff')
            self.at(source, '00486400', 0x486408, '83 f8 05 75 13 8b 46 08 85 c0 7c 0c 83 f8 3f')
            self.at(source, '004A3180', 0x4a3186, '6a 05 56')
            self.call_at(source, '004A3180', 0x4a318b, 0x47a660)
            self.call_at(source, '004A3180', 0x4a31ad, 0x4a1e40)
            self.call_at(source, '004A3180', 0x4a31bc, 0x4a2370)
            self.at(source, '004A3180', 0x4a31c1, '8b 06 6a 00 8b ce ff 50 20')
            self.call_at(source, '004A3180', 0x4a31cf, 0x4b06e0)
        writes = self.e['contracts']['facilityReset']['writes']
        self.assertEqual([(int(w['offset'], 16), w['width'], w['value']) for w in writes],
                         [(8,4,-1),(12,4,-1),(16,2,0),(20,4,0),(24,4,0),
                          (28,1,0),(30,2,-1),(32,2,-1),(40,4,0),(44,4,0)])

    def test_destruction_order_and_home_write(self):
        for source in ('S1', 'S2'):
            for address, target in ((0x4b0a5f, 0x487a30), (0x4b0bda, 0x4cf270),
                                    (0x4b0c39, 0x4b06e0), (0x4b0c41, 0x4a3180)):
                self.call_at(source, '004B09B0', address, target)
            self.at(source, '004B09B0', 0x4b0bca, '6a 3f')
            self.at(source, '004B09B0', 0x4b0c00, '39 b8 98 00 00 00 75 0a c7 80 98 00 00 00 ff ff ff ff')
            self.at(source, '00487A30', 0x487a47, '8b 80 b4 00 00 00 33 c9 83 f8 04')

    def test_counter_two_level_tables_and_modulo_byte_writers(self):
        pointers = (0x4b0aeb,0x4b0afb,0x4b0b0b,0x4b0b1b,0x4b0b2b,
                    0x4b0af0,0x4b0b00,0x4b0b10,0x4b0b6f)
        for source in ('S1', 'S2'):
            self.assertEqual(struct.unpack('<9I', self.raw[source, '004B0C5C']), pointers)
            expected = [0,1,2,3,4]+[8]*16+([5,5,6,6,7,7] if source=='S1' else [0,0,1,1,2,2])
            self.assertEqual(list(self.raw[source, '004B0C80']), expected)
            self.at(source, '004B09B0', 0x4b0ad1, '83 c0 df 83 f8 1a')
            self.at(source, '004B09B0', 0x4b0add, '0f b6 88 80 0c 4b 00 ff 24 8d 5c 0c 4b 00')
            for index in range(5):
                branch = 0x4b0aeb + index * 0x10
                self.at(source, '004B09B0', branch, '39 5e 14')
                self.at(source, '004B09B0', branch+5, '6a ff 8b cf')
                writer = 0x47b820+index*0x20
                self.call_at(source, '004B09B0', branch+9, writer)
                offset = struct.pack('<I', 0xa8+index)
                self.assertEqual(self.raw[source, f'{writer:08X}'],
                    bytes.fromhex('8a 91')+offset+bytes.fromhex('8a 44 24 04 02 d0 88 91')+offset+bytes.fromhex('c2 04 00'))

    def test_allocated_selector_filters_do_not_add_validity(self):
        for source in ('S1', 'S2'):
            for address, target in ((0x4cf28b,0x490b00),(0x4cf293,0x47a600),
                                    (0x4cf2a2,0x489fe0),(0x4cf2ad,0x489ce0),
                                    (0x4cf2b8,0x489c30),(0x4cf2c3,0x489c50)):
                self.call_at(source, '004CF270', address, target)
            self.at(source, '0047A600', 0x47a623, 'ff 60 04')
            self.at(source, '0047A630', 0x47a653, 'ff 60 08')
            self.at(source, '004CF270', 0x4cf2d4, '47 81 ff 4c 04 00 00 7c a8')
            self.at(source, '00489C30', 0x489c35, '83 f8 2a 7c 0b 83 f8 2d 7f 06')
            self.at(source, '00489C50', 0x489c55, '83 e8 2e f7 d8 1b c0 40')
            self.call_at(source, '00489CE0', 0x489ce6, 0x491310)
            low, high = (700,799) if source=='S1' else (704,753)
            self.at(source, '00489CE0', 0x489ceb, '3d '+struct.pack('<I',low).hex(' ')+' 7c 0d 3d '+struct.pack('<I',high).hex(' '))

    def test_status_mask63_from_complete_table_and_and_opcodes(self):
        targets = (0x488b8d,0x488b41,0x488b49,0x488b51,0x488b59,
                   0x488b61,0x488b69,0x488b71,0x488b79,0x488b83)
        for source in ('S1', 'S2'):
            self.assertEqual(struct.unpack('<10I', self.raw[source, '00488B9C']), targets)
            self.at(source, '00488B30', 0x488b34, '40 83 f8 09 77 5d ff 24 85 9c 8b 48 00')
            self.call_at(source, '00489FE0', 0x489fec, 0x488b30)
            accepted = []
            for status, target in zip(range(-1,9), targets):
                function = self.raw[source, '00488B30']
                off = target - 0x488b30
                self.assertEqual(function[off:off+4], bytes.fromhex('8b 44 24 08'))
                if function[off+4:off+6] == bytes.fromhex('83 e0'):
                    mask = function[off+6]
                    self.assertEqual(function[off+7], 0xc3)
                else:
                    self.assertEqual(function[off+4], 0x25)
                    mask = struct.unpack_from('<I', function, off+5)[0]
                    self.assertEqual(function[off+9], 0xc3)
                self.assertEqual(mask, 0x1000 if status==-1 else 1<<status)
                if mask & 63:
                    accepted.append(status)
            self.assertEqual(accepted, [0,1,2,3,4,5])
            self.at(source, '00488B30', 0x488b97, '33 c0 c3')


if __name__ == '__main__':
    unittest.main()
