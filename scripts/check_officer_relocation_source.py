"""Independent P0-67 officer-relocation source-evidence checks.

Uses only stdlib and committed byte columns; never imports the production model
or runs target machine code. Optional --idb-s1/--idb-s2 verify whole-IDB hashes
and raw uncompressed ID1 low bytes for new and inherited selected intervals.
Instruction boundaries are the recovered artifact rows, not a fresh x86 decode.
"""
import argparse
import ast
import hashlib
import json
import mmap
from pathlib import Path
import struct
import sys
import unittest

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / 'docs/sources/officer-relocation.json'
DIRECTORY = MANIFEST.with_suffix('')
HEX = frozenset('0123456789abcdefABCDEF')
SOURCE_HASHES = {
    'S1': 'c591cb40ce6d6be9246148002532dedc042463f36cd39c5ed300b7c449feefab',
    'S2': 'aa7f2c983b266633d6e23c494d4f8e1b03e5251632505cae103e176ae850dfd8',
}
RECOVERY_HASHES = {
    'recovery-evidence.json': '1f1eacac0632138551cbfa502f2213e66fdd3e5368dc6e5acbf30ac9b0246d9e',
    'recovery-verification.json': 'cc2a80472e38b271166022c4bcc3c2a1908cfeccc149cdbdb5e599b2adda6c64',
}
EVIDENCE_HASHES = {'docs/sources/base-ownership-events.json': '61f2a3ccc507f98815779b7e506d3fd8c1737cfa86701c9d77d322a9a73692a4', 'docs/sources/capture-personnel-source-profile.json': '632cf7baeebd7f4e95933275405a50d6fefadeb44221f971e470bdef9d4cd140', 'docs/sources/capture-relocation-source-profile.json': '7b357eb4268490113a96aebdce152e0af1a889efb54ca77fbb5b4c9f9e6da8f5', 'docs/sources/empty-legion-redistribution.json': '024c072b41eb0ec3e98d255cbcf5078a158f4dcb673f046cfef0f2ab9f9abf27', 'docs/sources/facility-mission-cancellation.json': 'd00e7326ba4053781bdf608170027de4e7e83b0beab58539c31a318ac761a042', 'docs/sources/group-mission-cancellation.json': 'd3e789bf1784a9fcc0ce1dcb177857e1cca3753beaa3d0f6f3fc0d22774922fa', 'docs/sources/legion-role-reconciliation.json': '05afefd64dfba8bb05f31171f5187e30078ea3846f745da60abe57c61a4f57c2', 'docs/sources/mission-cancellation-zero-refund.json': '96141b4710c73a9e1aeec30968d9924c48708a8e841df1b010dd622f7685a9bf', 'docs/sources/mission-event-composition.json': '998f10640c519cb33d0c8685f0180b86cafbee160b945935ed5c0878190110ed', 'docs/sources/mission-event-listeners.json': 'e3f80912a9b2a39eaf6cb507089bd37daff1ce0f9249c9acb129243145b7e065', 'docs/sources/mission-notification-tail.json': '100fb16d11cd9a23609f5aae0f059b3231d139425fc45335fbf05231b5376fc8', 'docs/sources/native-roster-sort.json': '0180677bea36af4b11dc5e6c50ae45b09e20a27841ed58da1c7d7b18bc570d52', 'docs/sources/officer-return-finalizer.json': 'f2c4cd30808b086507de3b15e0fae1c950070c1be9e34d54e92169a874a1225a', 'docs/sources/personnel-detachment-source-profile.json': 'd793bbd6d58f794e9a6c200d2dd29db346f7b3a6b8e165dd70d157ce68c9c28e', 'docs/sources/recursive-officer-return.json': '114f8657135c69fde4c39efe27ee58d9df1d000f57710bddc955c2b613f51f82', 'docs/sources/return-mission-lifecycle.json': '0f502f7d32a60b035afea99def41fd399eeb43ecc6a8ddf30add817b3372d130', 'docs/sources/return-route-target-force.json': 'aceac5caee2d55baa9ab440c315925d0db516101116a97c4f3dbf1adc861d4af'}
API_HASHES = {'scripts/base_ownership_events_profile.py': '6ef7ca54f310103e7f329a31c6f3440bafcff07eb6b30e7f03845e23dfe1873b', 'scripts/base_ownership_frame.py': 'd784d3c2f00c17b1788acad3a616a6f9121c86e8ad87cca8142a8f54ee8a6ac4', 'scripts/base_ownership_primitives.py': '71d844de160722b07b2a4694f6f7a960b6f9fac3b5079916a5075307c82748b3', 'scripts/capture_personnel_profile.py': '477f404faea0ee0ccbcfc968890af7705419b2e3d7f98d7711260f1de5b76c5d', 'scripts/capture_relocation_profile.py': '846f18492452a8745b69afaf8bcbc85de197122b4269f9076edbfc7f5f1c4615', 'scripts/capture_selector_profile.py': 'd2cff58cb7ef2997351d701cd4f83c3103866621d238dca36e0c39f0e703235c', 'scripts/capture_transaction_profile.py': 'f07b454a74a692db29eeab302f23efcab8b019387843253756e22a3b690cfeff', 'scripts/empty_legion_frame.py': 'f59d2a9cd3535885ff83f97f9e1cd85d096368f5acebfc892c42ed5578fae898', 'scripts/empty_legion_primitives.py': '8c913bbed7f824b688a01badfe26e83a3454eb38dd806125c95be13fb1b0845e', 'scripts/mission_cancellation_v2_profile.py': '2f070f11dfac647e9c28d070081928b3fd105d40b2a78ea4f7c81a08699a80a2', 'scripts/mission_composition_frame.py': 'e21ca6176d6ff83759efa204f821d6a87323fc643856fa9e714f4ec3230c398a', 'scripts/mission_event_composition_profile.py': 'd2f2c6d403a1a12ff488d088e24cd652d98438fa054b095f078a4e2890394c87', 'scripts/mission_event_listener_profile.py': '0fbb973bb9e2a0960f9dc245057594ae699df46f5552628deeae977ca63479ac', 'scripts/mission_notification_tail_profile.py': '5352697af974690724f712e4353ef9c2aee46b8602cb36eca6d24b5c1f1d51e5', 'scripts/native_sort_frame.py': '5d125d9577a738977b6ed98fd5c0093904fd072a8bc22746413ed52eada2bc1e', 'scripts/native_sort_primitives.py': '8c9a825c290ddd57a8bfd5a755c58dc896cf7651452f648e00e921b34b323c55', 'scripts/recursive_officer_return_profile.py': '71730182c0c9725c60beaef9f8d74e717f9e281ca2266b7f2e5c9da9fd5707c8', 'scripts/recursive_return_frame.py': 'cd1f7cd1fbe3940987426c3f704bb56e6232ebd1d0c1e91d62ee9a70a5142810', 'scripts/recursive_role_primitives.py': 'ad28535effcc10a4a096dccf67e1293ae552b94e0c9795e0ad14fd0ee19cf14e', 'scripts/return_mission_lifecycle_profile.py': '2b2dc7cc74018200a0b02effcf7a748295439f9c3599a566c39290a8b8cb98c6', 'scripts/return_route_frame.py': '12ac3d443a33e8596eb6641cc0bd4db482a8bed82e795b31571af9446feb54e1', 'scripts/return_route_primitives.py': 'd7a98e0209698c35c6ab6fc69d1ca961bab00965d3ef542f0240b73660a6ecc2', 'scripts/return_route_tables.py': '7569dfb995eaf38c26cbdd69d444c82d3225964a7b2d73e8c69108376cf18352'}


def digest(data):
    return hashlib.sha256(data).hexdigest()


def parse_rows(lines, start, end):
    """Reject gaps, overlaps, empty byte rows and interval-length mismatches."""
    address, instructions = int(start, 16), []
    for line in lines:
        if not line.strip() or line.lstrip().startswith(';'):
            continue
        tokens = line.split()
        assert int(tokens[0], 16) == address, (start, line, hex(address))
        value = []
        for token in tokens[1:]:
            if len(token) != 2 or not set(token) <= HEX:
                break
            value.append(int(token, 16))
        assert value, line
        instructions.append((address, bytes(value)))
        address += len(value)
    assert address == int(end, 16), (start, hex(address), end)
    return b''.join(b for _, b in instructions), instructions


def read_rows(directory, row):
    path = (directory / row['file']).resolve()
    assert path.is_relative_to(ROOT)
    lines = path.read_text().splitlines()
    if 'lineStart' in row:
        first, count = row['lineStart']-1, row['lineCount']
        assert first >= 0 and count > 0 and first+count <= len(lines)
        lines = lines[first:first+count]
    raw, instructions = parse_rows(lines, row['start'], row['endExclusive'])
    assert digest(raw) == row['sha256'], (path, row['start'])
    for field in ('rawId1Sha256', 'independentId1Sha256'):
        if field in row:
            assert row[field] == row['sha256']
    if 'artifactSha256' in row:
        assert digest(path.read_bytes()) == row['artifactSha256']
    return raw, instructions


def prior_rows(manifest):
    prior = manifest.get('priorEvidence', [])
    return [prior] if isinstance(prior, dict) else prior


def is_call(b):
    return b[0] == 0xe8 or (len(b) >= 2 and b[0] == 0xff and b[1] & 0x38 == 0x10)


def verify_calls(instructions, ledger, complete=True):
    calls = [(a, b) for a, b in instructions if is_call(b)]
    if complete:
        assert [f'{a:08X}' for a, _ in calls] == [c['site'] for c in ledger]
    index = dict(instructions)
    for c in ledger:
        a, b = int(c['site'], 16), bytes.fromhex(c['bytes'])
        assert index[a] == b and is_call(b)
        if 'kind' in c:
            assert c['kind'] == ('direct' if b[0] == 0xe8 else 'indirect')
        if b[0] == 0xe8:
            assert len(b) == 5
            assert a+5+struct.unpack_from('<i', b, 1)[0] == int(c['target'], 16)
    return len(ledger)


def load_evidence():
    e = json.loads(MANIFEST.read_text())
    assert {r['path']: r['sha256'] for r in e['inheritedEvidence']} == EVIDENCE_HASHES
    assert {r['path']: r['sha256'] for r in e['inheritedPrimitiveDependencies']} == API_HASHES
    for r in e['inheritedEvidence'] + e['inheritedArtifacts'] + e['inheritedPrimitiveDependencies']:
        assert digest((ROOT/r['path']).read_bytes()) == r['sha256'], r['path']
    assert {r['file']: r['sha256'] for r in e['provenance']['recoveryArtifacts']} == RECOVERY_HASHES
    for filename, expected in RECOVERY_HASHES.items():
        assert digest((DIRECTORY/filename).read_bytes()) == expected
    original = json.loads((DIRECTORY/'recovery-evidence.json').read_text())
    for key in ('sources', 'functionRegions', 'callLedgers', 'comparisons'):
        assert e[key] == original[key]
    assert e['rangeBudget'] == original['budget']
    assert [{k:v for k,v in r.items() if k not in ('artifactSha256','boundaryKind')} for r in e['ranges']] == original['ranges']
    raw, instructions, selected = {}, {}, {}
    for row in e['ranges']:
        key = row['source'], row['start']
        assert key not in raw
        raw[key], instructions[key] = read_rows(DIRECTORY, row)
        selected[key + (row['endExclusive'],)] = raw[key]
    inherited, inherited_rows, inherited_ins, artifacts = {}, {}, {}, {}
    all_physical_rows = 0
    for dep in e['inheritedEvidence']:
        p = ROOT/dep['path']; m = json.loads(p.read_text())
        assert dep['profileId'] == m['profileId']
        assert {s['source']:s['idbSha256'] for s in m['sources']} == SOURCE_HASHES
        assert m['stockOriginalVerified'] is False and m['originalExeExecuted'] is False
        inherited[dep['id']] = m
        for r in prior_rows(m):
            assert EVIDENCE_HASHES[r['path']] == r['sha256']
        for row in m.get('ranges', []) + m.get('newRanges', []):
            assert 'file' in row
            b, ins = read_rows(p.with_suffix(''), row)
            key = row['source'], row['start'], row['endExclusive'], row['sha256']
            if key in inherited_rows:
                assert inherited_rows[key] == b
            inherited_rows[key], inherited_ins[key] = b, ins
            selected[key[:3]] = b
            path = (p.with_suffix('')/row['file']).resolve()
            artifacts[str(path.relative_to(ROOT))] = digest(path.read_bytes())
            all_physical_rows += 1
        for c in m.get('containers', []):
            path = (p.with_suffix('')/c['file']).resolve()
            assert digest(path.read_bytes()) == c['sha256']
            if 'lineCount' in c:
                assert len(path.read_text().splitlines()) == c['lineCount']
            artifacts[str(path.relative_to(ROOT))] = c['sha256']
    assert {r['path']:r['sha256'] for r in e['inheritedArtifacts']} == artifacts
    for m in inherited.values():
        for row in m.get('referencedRanges', []):
            key = row['source'], row['start'], row['endExclusive'], row['sha256']
            assert key in inherited_rows, key
    # Every overlapping new/inherited byte must agree, even when regions differ.
    image = {}
    for (source, start, end), b in selected.items():
        for offset, byte in enumerate(b):
            key = source, int(start,16)+offset
            assert key not in image or image[key] == byte, key
            image[key] = byte
    return e, raw, instructions, inherited, inherited_rows, inherited_ins, selected, all_physical_rows


def verify_raw_id1(path, source, selected):
    """Independent parser for fingerprinted uncompressed IDA6 ID1 storage."""
    with Path(path).open('rb') as fp:
        assert hashlib.file_digest(fp, 'sha256').hexdigest() == SOURCE_HASHES[source]
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
                lo, hi = struct.unpack_from('<II', data, body+0x14+8*i)
                assert lo < hi
                segments.append((lo, hi, offset)); offset += 4*(hi-lo)
            assert offset <= body+length
            for (s, start, end), expected in selected.items():
                if s != source:
                    continue
                a, z = int(start,16), int(end,16)
                matches = [(lo,hi,p) for lo,hi,p in segments if lo <= a and z <= hi]
                assert len(matches) == 1 and z-a == len(expected)
                lo, _, p = matches[0]; p += 4*(a-lo)
                assert data[p:p+4*len(expected):4] == expected, (s,start,end)


class OfficerRelocationSource(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        (cls.e,cls.raw,cls.ins,cls.inherited,cls.inherited_raw,
         cls.inherited_ins,cls.selected,cls.physical_rows) = load_evidence()

    def at(self, source, function, address, hexbytes):
        b = bytes.fromhex(hexbytes); off = address-int(function,16)
        self.assertEqual(self.raw[source,function][off:off+len(b)],b)

    def call(self, source, function, site, target):
        off = site-int(function,16); b = self.raw[source,function][off:off+5]
        self.assertEqual(b[0],0xe8)
        self.assertEqual(site+5+struct.unpack_from('<i',b,1)[0],target)

    def test_01_source_identity_and_scope(self):
        self.assertEqual(self.e['profileId'],'source-idb-S1-S2-officer-relocation-v1')
        self.assertEqual(self.e['baselineCommit'],'5215348ebd12cd4bc7b221008775052411fb92bb')
        self.assertEqual({s['source']:s['idbSha256'] for s in self.e['sources']},SOURCE_HASHES)
        self.assertTrue(all('血色' in s['recordedInputPath'] for s in self.e['sources']))
        for name in ('stockOriginalVerified','originalExeExecuted','recordedExeHashesIndependentlyVerified'):
            self.assertIs(self.e[name],False)
        self.assertEqual(self.e['adoption'],{'PC-PK1.1':'compatibility-reconstruction','PC-Vanilla-assumed':'compatibility-assumption','PS2-Wii':'open'})

    def test_02_interval_and_source_difference_budget(self):
        self.assertEqual(self.e['rangeBudget'],{'intervals':92,'selectedBytesBothSources':14930,'pairedStarts':44,'identicalPairs':40})
        self.assertEqual((len(self.raw),sum(map(len,self.raw.values()))),(92,14930))
        pairs = {f for s,f in self.raw if ('S1',f) in self.raw and ('S2',f) in self.raw}
        self.assertEqual({r['start'] for r in self.e['comparisons']},pairs)
        for r in self.e['comparisons']:
            a,b = self.raw['S1',r['start']],self.raw['S2',r['start']]
            self.assertEqual(r['identical'],a==b)
            for source,value in [('S1',a),('S2',b)]:
                self.assertEqual(r[source+'length'],len(value));self.assertEqual(r[source+'sha256'],digest(value))
            self.assertEqual(r['differingByteCount'],sum(x!=y for x,y in zip(a,b))+abs(len(a)-len(b)))
        self.assertEqual([r['start'] for r in self.e['comparisons'] if not r['identical']],['004890F0','004A5600','0072F930','06EE794C'])
        self.assertEqual(set(self.raw)-{(s,f) for s in SOURCE_HASHES for f in pairs},
                         {('S2',f) for f in ('00489116','0072FC90','0090CBA0','009142F8')})

    def test_03_all_new_calls_complete_at_recovered_boundaries(self):
        code = {(r['source'],r['start']) for r in self.e['ranges'] if r['kind']=='code'}
        self.assertEqual({(s,f) for s,fs in self.e['callLedgers'].items() for f in fs},set(self.raw))
        self.assertTrue(all(self.e['callLedgers'][s][f] == [] for s,f in set(self.raw)-code))
        count = sum(verify_calls(self.ins[s,f],self.e['callLedgers'][s][f]) for s,f in code)
        self.assertEqual(count,718)

    def test_04_complete_regions_and_ruler_cleanup(self):
        code = {(r['source'],r['start']):r for r in self.e['ranges'] if r['kind']=='code'}
        covered=set()
        for key,regions in self.e['functionRegions'].items():
            source,owner=key.split(':')
            for region in regions:
                row=code[source,region['start']];covered.add((source,region['start']))
                self.assertEqual((row['endExclusive'],row['ownerFunction']),(region['endExclusive'],owner))
                self.assertEqual(row['boundaryKind'],'complete-IDB-function-region' if len(regions)>1 else 'complete-IDB-function')
        self.assertEqual(covered,set(code))
        self.assertEqual(len(self.raw['S1','004B40C0']),2285)
        self.assertEqual(len(self.raw['S2','004B40C0']),2285)
        self.assertEqual(self.e['functionRegions']['S2:004890F0'],[
            {'start':'004890F0','endExclusive':'00489100'},
            {'start':'00489116','endExclusive':'0048911B'},
            {'start':'009142F8','endExclusive':'00914314'}])

    def test_05_inherited_manifest_and_static_api_closure(self):
        self.assertEqual((len(self.inherited),len(self.e['inheritedArtifacts']),self.physical_rows),(17,622,1852))
        reached=set();pending=list(self.e['inheritedEvidenceRoots'])
        while pending:
            name=pending.pop()
            if name in reached:continue
            reached.add(name)
            pending.extend(Path(r['path']).stem for r in prior_rows(self.inherited[name]))
        self.assertEqual(reached,set(self.inherited))
        reached=set();pending=['scripts/base_ownership_events_profile.py']
        while pending:
            filename=pending.pop()
            if filename in reached:continue
            reached.add(filename)
            for node in ast.walk(ast.parse((ROOT/filename).read_text())):
                names=([node.module.split('.')[0]] if node.module else []) if isinstance(node,ast.ImportFrom) else [a.name.split('.')[0] for a in node.names] if isinstance(node,ast.Import) else []
                pending.extend('scripts/'+n+'.py' for n in names if (ROOT/'scripts'/f'{n}.py').exists())
        self.assertEqual(reached,set(API_HASHES))
        self.assertEqual(len(reached),23)

    def test_06_inherited_callsite_bytes_and_targets(self):
        # Older manifests have intentionally narrower ledgers; verify every
        # recorded call while keeping their declared coverage unchanged.
        checked=0
        for manifest in self.inherited.values():
            ledger=manifest.get('callLedgers',{})
            per_source=ledger if 'S1' in ledger else {s:ledger for s in SOURCE_HASHES}
            for source,functions in per_source.items():
                for function,calls in functions.items():
                    rows=[(k,ins) for k,ins in self.inherited_ins.items() if k[0:2]==(source,function)]
                    self.assertTrue(rows,(source,function))
                    match=[ins for _,ins in rows if all(int(c['site'],16) in dict(ins) for c in calls)]
                    self.assertTrue(match,(source,function))
                    checked+=verify_calls(max(match,key=len),calls,complete=False)
        self.assertEqual(checked,3583)

    def test_07_saved_home_nested_demotion_and_governor_clear(self):
        for s in SOURCE_HASHES:
            self.call(s,'004A8270',0x4a8279,0x47a630);self.call(s,'004A8270',0x4a828f,0x47a630)
            self.at(s,'004A8270',0x4a82a0,'8b ae 98 00 00 00')
            self.at(s,'004A8270',0x4a82b5,'8b 86 98 00 00 00')
            self.at(s,'004A8270',0x4a82ce,'0f 84 a7 00 00 00')
            self.at(s,'004A8270',0x4a82d4,'83 be a0 00 00 00 02 75 50')
            self.at(s,'004A8270',0x4a82e8,'3b e8 74 41 6a 03')
            self.call(s,'004A8270',0x4a82f1,0x4a5af0)
            self.at(s,'004A8270',0x4a82f6,'8b 6c 24 18 55')
            self.call(s,'004A8270',0x4a830d,0x491310);self.call(s,'004A8270',0x4a8318,0x486890)
            self.call(s,'004A8270',0x4a8328,0x4b3a20)
            self.call(s,'004A5AF0',0x4a5af6,0x47a600)
            self.call(s,'004A5AF0',0x4a5b09,0x4898f0)

    def test_08_ruler_person_legion_and_after_call_home(self):
        for s in SOURCE_HASHES:
            self.call(s,'004A8270',0x4a832f,0x488c00)
            self.at(s,'004A8270',0x4a8338,'8b 16 8b ce ff 52 44 6a 00 50')
            self.call(s,'004A8270',0x4a8347,0x490ad0)
            self.at(s,'004A8270',0x4a834c,'50 53 8b cf')
            self.call(s,'004A8270',0x4a8350,0x4b40c0)
            self.at(s,'004A8270',0x4a8357,'8b 03 8b cb ff 50 44')
            self.call(s,'004A8270',0x4a8362,0x4a32f0)
            self.call(s,'004A8270',0x4a836d,0x491770)
            self.call(s,'004A8270',0x4a8376,0x4a31e0)

    def test_09_troop_then_live_location_home(self):
        for s in SOURCE_HASHES:
            self.call(s,'004A8270',0x4a837d,0x4891c0)
            self.at(s,'004A8270',0x4a8382,'85 c0 0f 85 ad 00 00 00')
            self.at(s,'004A8270',0x4a838a,'8b 86 9c 00 00 00 85 c0 7c 05 83 f8 56 7e 03 83 c8 ff')
            self.at(s,'004A8270',0x4a839c,'8b ae 98 00 00 00 3b c5 56 74 4f')
            self.call(s,'004891C0',0x4891f8,0x47a630)
            self.call(s,'004891C0',0x489212,0x495390)
            self.assertNotEqual(self.raw[s,'00495340'],b'')

    def test_10_away_raw_writes_after_cancellation_and_movement_arguments(self):
        for s in SOURCE_HASHES:
            for site,target in [(0x4a83a7,0x47a630),(0x4a83b6,0x4a57b0),(0x4a83c9,0x489bd0),(0x4a83d2,0x489b40),(0x4a83dd,0x482f80),(0x4a83ea,0x4a7990)]:
                self.call(s,'004A8270',site,target)
            self.at(s,'004A8270',0x4a83b1,'74 2f')
            self.at(s,'004A8270',0x4a83bb,'6a 00 6a 00 6a 00 6a 00 6a 00 6a 25')
            self.at(s,'004A8270',0x4a83e2,'6a 00 6a ff 53 56')
            calls=[c['target'] for c in self.e['callLedgers'][s]['004A8270'] if c['kind']=='direct' and 0x4a83b6<=int(c['site'],16)<=0x4a83ea]
            self.assertEqual(calls,['004A57B0','00489BD0','00489B40','00482F80','004A7990'])

    def test_11_same_home_no_cancellation_and_saved_home_return(self):
        for s in SOURCE_HASHES:
            calls=[c['target'] for c in self.e['callLedgers'][s]['004A8270'] if c['kind']=='direct' and int(c['site'],16)>=0x4a83f8]
            self.assertEqual(calls,['004A5780','004A5660','004A5600','00488C70','00490D00','004BF6F0'])
            self.at(s,'004A8270',0x4a8418,'85 c0 75 1b 55')
            self.at(s,'004A8270',0x4a8427,'6a 01 6a 00 50 56')
        self.call('S1','004A5600',0x4a5619,0x489b40)
        self.call('S2','004A5600',0x4a5619,0x90cba0)

    def test_12_cancellation_gate_capture_and_native_event(self):
        for s in SOURCE_HASHES:
            self.call(s,'004A57B0',0x4a57b6,0x47a600)
            self.at(s,'004A57B0',0x4a57c2,'8b 86 3c 01 00 00 85 c0 7c 10 83 f8 2b 7f 0b')
            self.call(s,'004A57B0',0x4a57d7,0x5b9b40)
            self.at(s,'005B9B40',0x5b9b44,'8b 82 3c 01 00 00 83 ec 0c 83 f8 25')
            self.at(s,'005B9B40',0x5b9b54,'8b 7c 81 08')
            self.at(s,'005B9B40',0x5b9b63,'89 74 24 08 89 74 24 0c')
            self.at(s,'005B9B40',0x5b9b70,'c7 44 24 08 ff ff ff ff')
            self.at(s,'005B9B40',0x5b9b7b,'ff 50 0c')
            self.assertEqual(len(self.e['callLedgers'][s]['005B9B40']),1)
        dispatch=self.inherited['mission-event-listeners']['dispatch']
        self.assertEqual([r['mission'] for r in dispatch],list(range(44)))
        self.assertEqual([dispatch[n]['cancel'] for n in (23,24)],['005B6D00','005CFB70'])
        for s in SOURCE_HASHES:
            for row in dispatch:
                if 'vtable' not in row:
                    self.assertEqual(row['mission'],37)
                    continue
                address=int(row['vtable'],16)+0xc
                matches=[b[address-int(start,16):address-int(start,16)+4] for (src,start,end,h),b in self.inherited_raw.items() if src==s and int(start,16)<=address and address+4<=int(end,16)]
                self.assertTrue(matches,(s,row['mission'],row['vtable']))
                self.assertTrue(all(struct.unpack('<I',b)[0]==int(row['cancel'],16) for b in matches))

    def test_13_movement_validation_distance_saved_and_zero_fourth(self):
        for s in SOURCE_HASHES:
            for site,target in [(0x4a79a0,0x47a630),(0x4a79b5,0x47a630),(0x4a79c8,0x4a6340),(0x4a79eb,0x490d00),(0x4a79f6,0x49e4d0)]:
                self.call(s,'004A7990',site,target)
            self.at(s,'004A7990',0x4a79cd,'8b e8 85 ed 89 6c 24 18 bb 01 00 00 00')
            self.at(s,'004A7990',0x4a79dc,'81 fd ff 3f 00 00')
            self.at(s,'004A7990',0x4a79fd,'8b 44 24 24 85 c0 74 56')
            self.at(s,'004A7990',0x4a7a5b,'6a 01 8b ce')
            self.call(s,'004A7990',0x4a7a5f,0x489b40)
            self.at(s,'004A7990',0x4a7a64,'53 8b ce')
            self.call(s,'004A7990',0x4a7a67,0x48a8b0)
            self.assertEqual(self.e['callLedgers'][s]['0048A8B0'],[])
            self.at(s,'0048A8B0',0x48a8b0,'8a 44 24 04')
            self.at(s,'0048A8B0',0x48a8c9,'88 81 58 01 00 00')

    def test_14_movement_live_force_current_then_fresh_home(self):
        for s in SOURCE_HASHES:
            self.at(s,'004A7990',0x4a7a6c,'8b 16 8b ce ff 52 40 8b d8')
            self.at(s,'004A7990',0x4a7a75,'85 db 0f 8c 8a 00 00 00 83 fb 2e')
            self.call(s,'004A7990',0x4a7aae,0x47a630)
            self.at(s,'004A7990',0x4a7abe,'ff 50 40 3b c3 75 0e')
            self.call(s,'004A7990',0x4a7acc,0x4bca30)
            self.at(s,'004A7990',0x4a7ad7,'8b b6 98 00 00 00')
            self.call(s,'004A7990',0x4a7aeb,0x47a630)
            self.at(s,'004A7990',0x4a7af7,'3b f7 74 0c')
            self.call(s,'004A7990',0x4a7b02,0x4bca30)
            calls=[c for c in self.e['callLedgers'][s]['004A7990'] if int(c['site'],16)>=0x4a7ad7]
            self.assertEqual([c.get('target') for c in calls],['00490D00','0047A630','004BCA30'])

    def test_15_origin_coordinates_signed_table_and_directed_distance(self):
        for s in SOURCE_HASHES:
            self.call(s,'004A6340',0x4a634a,0x47a630)
            self.at(s,'004A6340',0x4a6356,'8b 86 9c 00 00 00 85 c0 7c 0c 83 f8 56')
            self.call(s,'004A6340',0x4a636e,0x47a950)
            self.at(s,'0047A950',0x47a953,'ff 50 3c')
            self.at(s,'0047A950',0x47a95d,'0f bf c0 c1 f9 10')
            self.at(s,'0047A950',0x47a97a,'69 c0 c8 00 00 00 03 c1 8d 0c 80 8b 14 8d 6c 0e fb 06 c1 ea 05 83 e2 7f 6a 01 52')
            self.call(s,'0047A950',0x47a995,0x483b00)
            self.at(s,'00483B00',0x483b04,'8b 04 85 58 c3 79 00')
            self.at(s,'00483B00',0x483b17,'f7 d8 c3')
            table=struct.unpack('<128i',self.raw[s,'0079C358'])
            self.assertTrue(any(n<0 for n in table));self.assertEqual(len(table),128)
            self.call(s,'0049E4D0',0x49e4d9,0x49e450)
            self.call(s,'0049E4D0',0x49e4e7,0x49e450)
            self.at(s,'0049E4D0',0x49e4ec,'50 57')
            self.call(s,'0049E4D0',0x49e4ee,0x47b480)

    def test_16_person_position_and_mutable_fallback(self):
        for s in SOURCE_HASHES:
            self.assertEqual(struct.unpack_from('<I',self.raw[s,'0079C780'],0x3c)[0],0x489610)
            self.at(s,'00489610',0x489648,'ff 60 3c')
            self.at(s,'00489610',0x489680,'ff 62 3c')
            self.at(s,'00489610',0x489683,'b8 4c 79 ee 06')
            targets=[r.get('target') for r in self.e['callLedgers'][s]['00489610']]
            self.assertNotIn('004891C0',targets);self.assertNotIn('00495390',targets)
        self.assertEqual(self.raw['S1','06EE794C'],bytes.fromhex('00000000'))
        self.assertEqual(self.raw['S2','06EE794C'],bytes.fromhex('ffffffff'))
        self.assertIn('never runtime defaults',self.e['contracts']['geography']['fallbackSnapshot'])

    def test_17_original_top_level_and_cross_profile_bytes_agree(self):
        for s in SOURCE_HASHES:
            for address in ('004A8270','004A31E0','004A32F0','004BF6F0','004BCA30'):
                new=self.raw[s,address]
                matches=[b for (source,start,end,h),b in self.inherited_raw.items() if (source,start)==(s,address) and len(b)==len(new)]
                self.assertTrue(matches,(s,address))
                self.assertTrue(all(b==new for b in matches))

    def test_18_explicit_unsupported_boundaries(self):
        boundaries={r['address']:r for r in self.e['boundaries']}
        self.assertEqual(set(boundaries),{'004B40C0','005B9B40','004891C0','00489610','inherited','platform'})
        self.assertEqual(boundaries['004B40C0']['kind'],'effect-query-or-reject')
        self.assertEqual(self.e['contracts']['cancellation']['nativeHandlers'],[23,24])
        self.assertIs(self.e['contracts']['cancellation']['predicatesCalled'],False)
        self.assertIs(self.e['contracts']['away']['postCancelRevalidation'],False)
        self.assertIs(self.e['contracts']['away']['movementAfterFailedPreCancelValidGate'],True)
        self.assertIs(self.e['contracts']['sameHome']['cancellationDispatch'],False)
        for section in ('away','movement'):
            self.assertIs(self.e['contracts'][section]['actualLocationWrite'],False)
        self.assertIn('not a native rule',self.e['contracts']['memoryDomain'])

    def test_19_parser_rejects_gaps_overlaps_empty_and_truncation(self):
        for lines in [ ['1000 90 nop','1002 c3 ret'],['1000 90 nop','1000 c3 ret'],['1000 nop'],['1000 90 nop'] ]:
            with self.assertRaises(AssertionError):parse_rows(lines,'1000','1002')
        self.assertEqual(parse_rows(['1000 90 nop','1001 c3 ret'],'1000','1002')[0],b'\x90\xc3')


if __name__ == '__main__':
    parser=argparse.ArgumentParser(add_help=False)
    parser.add_argument('--idb-s1');parser.add_argument('--idb-s2')
    args,remaining=parser.parse_known_args()
    if args.idb_s1 or args.idb_s2:
        evidence=load_evidence()
        for source,path in [('S1',args.idb_s1),('S2',args.idb_s2)]:
            if path:
                verify_raw_id1(path,source,evidence[6])
                print(source+' whole-IDB fingerprint and new/inherited raw-ID1 intervals verified')
    unittest.main(argv=[sys.argv[0]]+remaining)
