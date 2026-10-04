"""P0-62 source-only recursive-return evidence checks (standard library).

Default: verify SHA-pinned prior manifests, containers and contiguous byte columns.
Optional --idb-s1/--idb-s2: rehash each complete IDB and read raw uncompressed
IDAv6 ID1 low-byte columns independently. No target code, model, disassembler,
IDAPython, foreign source script, game executable or callback is executed.
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
MANIFEST = ROOT / 'docs/sources/recursive-officer-return.json'
HEX = frozenset('0123456789abcdefABCDEF')
PRIOR_HASHES = {
    'officer-return-finalizer': 'f2c4cd30808b086507de3b15e0fae1c950070c1be9e34d54e92169a874a1225a',
    'legion-role-reconciliation': '05afefd64dfba8bb05f31171f5187e30078ea3846f745da60abe57c61a4f57c2',
    'mission-event-composition': '998f10640c519cb33d0c8685f0180b86cafbee160b945935ed5c0878190110ed',
}


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
    prior = {}
    for ref in evidence['priorEvidence']:
        assert ref['sha256'] == PRIOR_HASHES[ref['id']]
        path = ROOT / ref['path']
        assert digest(path.read_bytes()) == ref['sha256']
        assert json.loads(path.read_text())['sources'] == evidence['sources']
        prior[ref['id']] = resolve_manifest(path, {})
    raw, instructions = {}, {}
    for row in evidence['referencedRanges']:
        key = row['source'], row['start'], row['endExclusive']
        assert key not in raw
        candidates = []
        for name in row['evidence']:
            candidate, parsed = prior[name][key]
            assert candidate['sha256'] == row['sha256']
            candidates.append(parsed)
        assert candidates and all(p == candidates[0] for p in candidates)
        instructions[key] = candidates[0]
        raw[key] = b''.join(value for _, value in candidates[0])
        assert digest(raw[key]) == row['independentId1Sha256'] == row['sha256']
    assert set(raw) == set().union(*(set(p) for p in prior.values()))
    for comparison in evidence['comparisons']:
        key = comparison['start'], comparison['endExclusive']
        a, b = (raw[(s,) + key] for s in ('S1', 'S2'))
        assert comparison['identical'] == (a == b)
        assert comparison['differingByteCount'] == sum(x != y for x, y in zip(a, b))
        assert comparison['S1sha256'] == digest(a)
        assert comparison['S2sha256'] == digest(b)
    expected_unpaired = {(s, a, b) for s, a, b in raw
                         if (('S2' if s == 'S1' else 'S1'), a, b) not in raw}
    assert {(r['source'], r['start'], r['endExclusive']) for r in evidence['unpairedRangeShapes']} == expected_unpaired
    for row in evidence['unpairedRangeShapes']:
        assert digest(raw[row['source'],row['start'],row['endExclusive']]) == row['sha256']
    assert {(r['start'],r['endExclusive']) for r in evidence['comparisons']} == {
        (a,b) for s,a,b in raw if s == 'S1' and ('S2',a,b) in raw}
    # Overlapping widths have separate provenance and must agree byte-for-byte.
    for (source, start, end), value in raw.items():
        for (other, a, b), other_value in raw.items():
            left, right = max(int(start, 16), int(a, 16)), min(int(end, 16), int(b, 16))
            if source == other and left < right:
                assert value[left-int(start, 16):right-int(start, 16)] == other_value[left-int(a, 16):right-int(a, 16)]
    return evidence, raw, instructions


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


class RecursiveOfficerReturnSource(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.e, cls.raw, cls.instructions = load_evidence()

    def body(self, source, function):
        found = [(key, value) for key, value in self.raw.items() if key[:2] == (source, function)]
        return max(found, key=lambda item:len(item[1]))[1]

    def at(self, source, function, address, expected):
        value = bytes.fromhex(expected)
        offset = address-int(function, 16)
        self.assertEqual(self.body(source, function)[offset:offset+len(value)], value)

    def call(self, source, function, address, target):
        raw = self.body(source, function)
        offset = address-int(function, 16)
        self.assertEqual(raw[offset], 0xe8)
        self.assertEqual(address+5+struct.unpack_from('<i', raw, offset+1)[0], target)

    def test_01_provenance_budget_and_adoption_are_separate(self):
        self.assertEqual(self.e['profileId'], 'source-idb-S1-S2-recursive-officer-return-v1')
        self.assertEqual(self.e['baselineCommit'], 'a3c94e9d045688fe93c3c9b9172db30d5a89333a')
        self.assertEqual(len(self.raw), 611)
        self.assertEqual(sum(map(len, self.raw.values())), 53266)
        self.assertEqual(len(self.e['comparisons']), 302)
        self.assertEqual(len(self.e['unpairedRangeShapes']), 7)
        budget=self.e['rangeBudget']
        self.assertEqual((budget['identicalSameShapePairs'],budget['differentSameShapePairs'],
                          budget['duplicateIntervalReferencesRemoved']),(296,6,121))
        self.assertEqual(budget['totalSelectedBytesBothSources'],sum(map(len,self.raw.values())))
        self.assertEqual(self.e['newRanges'], [])
        self.assertEqual(self.e['containers'], [])
        self.assertEqual(set(PRIOR_HASHES), {r['id'] for r in self.e['priorEvidence']})
        self.assertEqual([s['idbSha256'] for s in self.e['sources']], [
            'c591cb40ce6d6be9246148002532dedc042463f36cd39c5ed300b7c449feefab',
            'aa7f2c983b266633d6e23c494d4f8e1b03e5251632505cae103e176ae850dfd8'])
        self.assertTrue(all('血色' in s['recordedInputPath'] for s in self.e['sources']))
        for key in ('stockOriginalVerified', 'originalExeExecuted', 'recordedExeHashesIndependentlyVerified'):
            self.assertIs(self.e[key], False)
        self.assertEqual(self.e['adoption'], {'PC-PK1.1':'compatibility-reconstruction',
            'PC-Vanilla-assumed':'compatibility-assumption', 'PS2-Wii':'open'})

    def test_02_complete_call_ledgers_read_byte_columns(self):
        self.assertEqual(set(self.e['callLedgers']), {
            '004BF6F0','004A31E0','004A32F0','004A0CB0','004A2CB0','0047C1B0',
            '00482AF0','00482FC0','0047CD50','004BE2A0','004BCA30','004B3A20','004BBAA0'})
        for source in ('S1', 'S2'):
            for function, ledger in self.e['callLedgers'].items():
                key = max((k for k in self.instructions if k[:2] == (source, function)), key=lambda k:int(k[2],16))
                calls = [(a,b) for a,b in self.instructions[key]
                         if b[0] == 0xe8 or (b[0] == 0xff and b[1]&0x38 == 0x10)]
                self.assertEqual([f'{a:08X}' for a,_ in calls], [r['site'] for r in ledger])
                for (address,value), row in zip(calls,ledger):
                    self.assertEqual(value, bytes.fromhex(row['bytes']))
                    if value[0] == 0xe8:
                        self.assertEqual(address+5+struct.unpack_from('<i',value,1)[0], int(row['target'],16))
                    else:
                        self.assertEqual(row['kind'], 'indirect')

    def test_03_return_saves_before_notice_and_keeps_pointer_arguments(self):
        for s in ('S1','S2'):
            f='004BF6F0'
            self.at(s,f,0x4bf736,'89 44 24 14 8b 86 a0 00 00 00 89 44 24 0c 8b 86 98 00 00 00')
            self.at(s,f,0x4bf759,'89 44 24 18 ff 52 44')
            self.at(s,f,0x4bf76d,'89 44 24 10')
            self.call(s,f,0x4bf771,0x486890)
            self.call(s,f,0x4bf77c,0x490b00)
            self.call(s,f,0x4bf7ba,0x4b93d0)
            self.call(s,f,0x4bf7c0,0x4f55e0)
            self.at(s,f,0x4bf7c8,'8b 16 55 8b ce ff 52 40')
            self.at(s,f,0x4bf836,'8b 4c 24 18 51 56 8b cb')
            self.call(s,f,0x4bf83e,0x4a31e0)

    def test_04_live_ownership_status_then_location_callback_then_force_rereads(self):
        for s in ('S1','S2'):
            f='004BF6F0'
            self.call(s,f,0x4bf7e1,0x488c00)
            self.at(s,f,0x4bf7ee,'ff 50 40')
            self.at(s,f,0x4bf7f7,'ff 52 40')
            self.at(s,f,0x4bf80f,'8b 85 28 01 00 00 85 c0 75 1d')
            self.call(s,f,0x4bf831,0x4b40c0)
            self.call(s,f,0x4bf845,0x4891c0)
            self.call(s,f,0x4bf859,0x4a0cb0)
            self.at(s,'004A0CB0',0x4a0cdb,'89 87 9c 00 00 00')
            self.call(s,'004A0CB0',0x4a0ce1,0x4b9480)
            self.at(s,f,0x4bf862,'ff 52 40 85 c0 0f 8c a4 00 00 00 83 f8 2e')
            self.at(s,f,0x4bf87a,'ff 50 40 8b 17 8b cf 8b e8 ff 52 40 3b e8')

    def test_05_saved_new_legion_survives_old_role_recursive_effect(self):
        for s in ('S1','S2'):
            f='004BF6F0'
            self.call(s,f,0x4bf899,0x4a32f0)
            self.at(s,f,0x4bf89e,'8b 17 8b cf ff 52 44')
            self.call(s,f,0x4bf8ab,0x490ad0)
            self.at(s,f,0x4bf8b0,'8b f0 83 7c 24 10 01 7f 1f 8b 6c 24 14')
            self.at(s,f,0x4bf8ca,'3b ee 74 0a 6a 00 55 8b cb')
            self.call(s,f,0x4bf8d3,0x4be2a0)
            self.at(s,f,0x4bf8d8,'6a 00 56 8b cb')
            self.call(s,f,0x4bf8dd,0x4be2a0)
            self.at(s,f,0x4bf8e2,'8b 74 24 1c')
            self.at(s,f,0x4bf8f7,'ff 50 44 8b 16 8b ce 8b f8 ff 52 44 3b c7')
            self.call(s,f,0x4bf90c,0x4bca30)

    def test_06_home_and_legion_keep_remove_write_append_sort_order(self):
        for s in ('S1','S2'):
            self.at(s,'004A31E0',0x4a3207,'8b f8 8b 86 98 00 00 00')
            self.call(s,'004A31E0',0x4a326a,0x4a2cb0)
            self.at(s,'004A31E0',0x4a3270,'85 ff 89 ae 98 00 00 00 74 65 8b 47 08')
            self.call(s,'004A31E0',0x4a32cb,0x47c1b0)
            self.at(s,'004A31E0',0x4a32d0,'6a 00 6a 00 6a 00 8b cf 6a 01')
            self.call(s,'004A31E0',0x4a32da,0x47cd50)
            self.call(s,'004A32F0',0x4a3330,0x482af0)
            self.call(s,'004A32F0',0x4a333c,0x482fc0)
            self.at(s,'004A32F0',0x4a3341,'8b 7c 24 10 83 ff ff 74 09 85 ff 7c 1d 83 ff 2e 7f 18')
            self.at(s,'004A32F0',0x4a3355,'89 be 94 00 00 00')
            self.call(s,'004A32F0',0x4a338b,0x47c1b0)
            self.call(s,'004A32F0',0x4a339a,0x47cd50)

    def test_07_find_first_match_append_duplicates_and_conditional_erase(self):
        for s in ('S1','S2'):
            self.at(s,'00482AF0',0x482b25,'8b 77 04')
            self.at(s,'00482AF0',0x482b6a,'8b 0f 8b 54 24 1c 33 c0 3b ca 0f 94 c0 85 c0 75 26')
            self.at(s,'00482AF0',0x482b7b,'8b 36 85 f6 75 c0')
            self.at(s,'004A2CB0',0x4a2cbf,'85 c0 74 08')
            self.at(s,'0047C1B0',0x47c1d5,'8b 4e 08 8b 06 6a 00 51 8b ce')
            self.at(s,'0047C1B0',0x47c1e7,'ff 10 8b f8 85 ff 75 20')
            self.at(s,'0047C1B0',0x47c213,'89 57 08 8b 46 08 85 c0 74 04 89 38')
            self.at(s,'0047C1B0',0x47c229,'89 7e 08')
            self.call(s,'00482FC0',0x483054,0x482bd0)

    def test_08_small_sort_has_no_filter_rank_allocation_or_callback(self):
        for s in ('S1','S2'):
            f='0047CD50'
            self.at(s,f,0x47cd6c,'8b 73 0c 83 fe 02 89 5c 24 10 7d 18')
            self.at(s,f,0x47cd78,'5e b8 01 00 00 00')
            self.at(s,f,0x47cd8d,'c2 10 00')
            self.call(s,f,0x47cd9a,0x43f140)
            self.at(s,f,0x47cdd6,'3b fd')
            self.at(s,f,0x47cde2,'5f 5d 5e 33 c0')

    def test_09_large_sort_caches_keys_clears_original_and_rechecks_allocation(self):
        for s in ('S1','S2'):
            f='0047CD50'
            self.call(s,f,0x47ce49,0x47bed0)
            self.call(s,f,0x47ce51,0x47a600)
            self.at(s,f,0x47ce61,'33 c0 85 db 0f 94 c0 55 89 37 8b 16 50 51 8b ce ff 52 14')
            self.at(s,f,0x47ce79,'89 47 04')
            self.at(s,f,0x47ce94,'3b dd b8 e0 68 4a 00 75 05 b8 60 69 4a 00')
            self.call(s,f,0x47ceaa,0x47c6a0)
            self.call(s,f,0x47ced5,0x47be50)
            self.call(s,f,0x47cefd,0x47a600)
            self.call(s,f,0x47cf0c,0x47c1b0)
            self.assertEqual(struct.unpack_from('<I',self.body(s,'0079C780'),0x14)[0],0x488720)

    def test_10_role_keeps_old_and_selected_pointers_across_events(self):
        for s in ('S1','S2'):
            f='004BE2A0'
            self.at(s,f,0x4be4da,'8b 46 0c')
            self.call(s,f,0x4be4e3,0x490b00)
            self.at(s,f,0x4be4e8,'8b d8')
            self.at(s,f,0x4be5b0,'8b 28 53')
            self.at(s,f,0x4be5e3,'8b 8d 98 00 00 00 8b f8 8b 83 98 00 00 00 3b c1')
            self.call(s,f,0x4be5f7,0x489730)
            self.call(s,f,0x4be65d,0x4b3a20)
            self.at(s,f,0x4be662,'6a 03 8b cb')
            self.call(s,f,0x4be666,0x4898f0)
            self.call(s,f,0x4be66d,0x488c00)
            self.call(s,f,0x4be681,0x489730)
            self.at(s,f,0x4be68a,'8b 85 98 00 00 00')
            self.call(s,f,0x4be6e7,0x4b3a20)
            self.at(s,f,0x4be6ec,'55 b9 58 19 20 07')
            self.call(s,f,0x4be6f2,0x491310)
            self.call(s,f,0x4be6fd,0x4a0940)

    def test_11_role_base_loop_reads_live_after_previous_base_events(self):
        for s in ('S1','S2'):
            f='004BE2A0'
            self.at(s,f,0x4be702,'33 ed 55')
            self.call(s,f,0x4be70a,0x490d00)
            self.call(s,f,0x4be713,0x487e10)
            self.call(s,f,0x4be722,0x4912c0)
            self.at(s,f,0x4be727,'8b 17 8b cf 8b d8 ff 52 44 3b c3 75 0c')
            self.call(s,f,0x4be73b,0x4bca30)
            self.at(s,f,0x4be740,'45 83 fd 57 7c be')
            self.assertEqual(self.body(s,'00487E10'),bytes.fromhex('e8 6b e8 ff ff 33 c9 83 f8 ff 0f 95 c1 8b c1 c3'))

    def test_12_governor_filter_saved_legion_and_route_then_live_home(self):
        for s in ('S1','S2'):
            f='004BCA30'
            self.call(s,f,0x4bcb30,0x4cf360)
            self.at(s,f,0x4bcb35,'8b 13 55 8b cb ff 52 44 50 68 e0 95 4b 00')
            self.call(s,f,0x4bcb47,0x4bc870)
            self.at(s,'004B95E0',0x4b95e9,'ff 50 44 3b 44 24 0c 75 12')
            self.call(s,'004B95E0',0x4b95f4,0x489730)
            self.call(s,'004BBA10',0x4bba5f,0x47a600)
            self.at(s,'004BBA10',0x4bba6e,'ff 54 24 28 83 c4 0c 85 c0 74 0a')
            self.call(s,'004BBA10',0x4bba7e,0x47c1b0)
            self.call(s,'00489730',0x489734,0x4896c0)
            self.at(s,'00489730',0x48973d,'8b 87 98 00 00 00')
            self.at(s,'00489730',0x489761,'ff 50 44 8b 17 8b cf 8b f0 ff 52 44')

    def test_13_governor_selected_pointer_and_empty_event14_survive_nested_event8(self):
        for s in ('S1','S2'):
            f='004BCA30'
            self.at(s,f,0x4bcb70,'83 b8 a0 00 00 00 01 7f 04 89 44 24 44')
            self.call(s,f,0x4bcb9d,0x486890)
            self.at(s,f,0x4bcc24,'8b 74 24 44 56')
            self.call(s,f,0x4bcc29,0x47a630)
            self.call(s,f,0x4bcc5a,0x4b3a20)
            self.call(s,f,0x4bcc6a,0x4b3a20)
            self.at(s,f,0x4bcc6f,'6a 00 53 6a 0e 8b ce')
            self.call(s,f,0x4bcc76,0x4bbaa0)

    def test_14_governor_event_before_write_saved_request_no_revalidation(self):
        for s in ('S1','S2'):
            f='004B3A20'
            self.call(s,f,0x4b3a3b,0x47a630)
            self.at(s,f,0x4b3a45,'75 04 85 db 75 4d')
            self.at(s,f,0x4b3a6d,'3b f3 74 0c 6a 00 56 6a 08 8b cd')
            self.call(s,f,0x4b3a78,0x4bbaa0)
            self.call(s,f,0x4b3a7f,0x486890)
            self.at(s,f,0x4b3a84,'53 b9 58 19 20 07')
            self.call(s,f,0x4b3a8a,0x491310)
            self.call(s,f,0x4b3a92,0x487780)
            self.at(s,'00487780',0x48778e,'8b 76 08')
            self.call(s,'00487780',0x487836,0x47a630)
            self.at(s,'004898F0',0x489902,'89 81 a0 00 00 00 c2 04 00')

    def test_15_effect_and_unsafe_branches_are_not_native_execution_claims(self):
        contracts=self.e['contracts']
        self.assertFalse(contracts['fullNativeExecution'])
        self.assertFalse(contracts['originalSaveEquivalence'])
        self.assertEqual(contracts['sort']['directDomain'],'entry count < 2')
        self.assertEqual(contracts['sort']['generalDomain'],'explicit whole-0047CD50 effect/query boundary')
        self.assertIn('004B80A0',contracts['fallbackBoundaries'])
        self.assertIn('004BE348..004BE4D7',contracts['fallbackBoundaries'])
        self.assertIn('004B40C0',contracts['fallbackBoundaries'])
        self.assertEqual(contracts['unknownEffectPolicy'],'reject unless an explicit stage-bound handler returns a validated live frame and required observation')
        for s in ('S1','S2'):
            self.call(s,'004BE2A0',0x4be31f,0x4b80a0)
            self.at(s,'004BE2A0',0x4be340,'85 c0 0f 85 92 01 00 00')
            self.call(s,'004BE2A0',0x4be4c0,0x4bd3b0)
            self.call(s,'004BBAA0',0x4bbac5,0x4a8110)

    def test_16_unchanged_shared_primitives_are_hash_pinned_without_importing(self):
        expected = {
            'scripts/mission_composition_frame.py': 'e21ca6176d6ff83759efa204f821d6a87323fc643856fa9e714f4ec3230c398a',
            'scripts/mission_event_listener_profile.py': '0fbb973bb9e2a0960f9dc245057594ae699df46f5552628deeae977ca63479ac',
            'scripts/mission_notification_tail_profile.py': '5352697af974690724f712e4353ef9c2aee46b8602cb36eca6d24b5c1f1d51e5',
            'scripts/mission_event_composition_profile.py': 'd2f2c6d403a1a12ff488d088e24cd652d98438fa054b095f078a4e2890394c87',
            'scripts/mission_cancellation_v2_profile.py': '2f070f11dfac647e9c28d070081928b3fd105d40b2a78ea4f7c81a08699a80a2',
        }
        self.assertEqual({r['path']:r['sha256'] for r in self.e['primitiveImplementationDependencies']}, expected)
        for path, sha in expected.items():
            self.assertEqual(digest((ROOT/path).read_bytes()), sha)

    def test_17_person_allocation_validity_are_live_raw_status_predicates(self):
        contract=self.e['contracts']['personPredicates']
        self.assertIn('not independent native storage',contract['cacheContract'])
        self.assertIn('BEFORE',contract['cacheContract'])
        for source in ('S1','S2'):
            table=self.body(source,'0079C780')
            self.assertEqual(struct.unpack_from('<I',table,4)[0],0x4883f0)
            self.assertEqual(struct.unpack_from('<I',table,8)[0],0x488430)
            self.assertEqual(struct.unpack_from('<I',table,0x2c)[0],0x4883d0)
            self.assertEqual(self.body(source,'004883D0'),bytes.fromhex(
                '8b44240483f81a740a83f80a740533c0c20400b801000000c20400'))
            self.at(source,'004883F0',0x4883f3,'8b 06 6a 0a ff 50 2c 85 c0 74 19')
            self.at(source,'004883F0',0x4883fe,'8b 86 7c 01 00 00 85 c0 75 13')
            self.at(source,'004883F0',0x488408,'8b b6 a0 00 00 00 85 f6 7c 05 83 fe 08 7e 04')
            self.at(source,'00488430',0x488433,'8b 06 ff 50 04 85 c0 74 21')
            self.at(source,'00488430',0x48843c,'8b 86 7c 01 00 00 85 c0 75 10')
            self.at(source,'00488430',0x488446,'8b b6 a0 00 00 00 83 fe 06 74 0c 83 fe 08 74 07')
            self.at(source,'00488430',0x488456,'b8 01 00 00 00 5e c3 33 c0 5e c3')


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--idb-s1')
    parser.add_argument('--idb-s2')
    args, remaining=parser.parse_known_args()
    if bool(args.idb_s1) != bool(args.idb_s2):
        parser.error('Pass both --idb-s1 and --idb-s2 for independent raw-ID1 verification')
    if args.idb_s1:
        evidence, raw, _=load_evidence()
        for source,path in [('S1',args.idb_s1),('S2',args.idb_s2)]:
            identity=next(s for s in evidence['sources'] if s['source']==source)
            selected={(a,b):value for (s,a,b),value in raw.items() if s==source}
            verify_raw_id1(path,identity,selected)
            print(f'{source}: verified whole-IDB SHA256 and {len(selected)} raw-ID1 ranges',flush=True)
    unittest.main(argv=[sys.argv[0]]+remaining)


if __name__=='__main__':
    main()
