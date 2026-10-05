"""Independent static source checks for live handlers 9/10/12/22.

Only stdlib and the frozen prior source checker are imported; no production
model or target machine code is run. Rows, complete relative-call/branch
ledgers, saved-pointer gates and inherited source/API hashes are verified.
Optional --idb-s1/--idb-s2 verify fingerprinted raw ID1 bytes for the entire
bounded inherited evidence closure as well as these eight handler intervals.
"""
import argparse
import ast
import json
from pathlib import Path
import struct
import sys
import unittest

from check_officer_relocation_source import (
    SOURCE_HASHES, digest, read_rows, verify_calls, load_evidence as load_prior,
    verify_raw_id1,
)

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / 'docs/sources/live-zero-refund.json'
DIRECTORY = MANIFEST.with_suffix('')
PINS = {
    'docs/sources/officer-relocation.json': '198d78ac9ab81bb8d05c3dffb9b382421a3a672a26a11058b1acdad34c70f3a9',
    'scripts/check_officer_relocation_source.py': '94217a6ad86377bd8af579dd166d45168012adac4a996310dabe5305b09f5a71',
    'scripts/officer_relocation_profile.py': '7a538a9cc7662c3bf0e8e62c9bf9a9007e0fae2a0fcfa14b65a84e06363fb538',
    'scripts/officer_relocation_primitives.py': 'f0787cd4f58a47ed83806d851ab8c52fce08817354cee9255c9ad124cd47cc51',
    'scripts/officer_relocation_tables.py': 'be00dd195a64d5782e25fb17d89cb1784ed8f97b9c7245c80ce85fe49fc0872f',
    'scripts/check_officer_relocation_profile.py': '4e461c5b60cab60fea26f87fec3a158129c6757defd871b1fa935f6821abca53',
}
VERIFICATION_HASHES = {'raw-verification.json': '4893af46424bacb28dcb150dfbe3433e74380bccf2993bfbdfcd9cb2c6e47bbc', 'disassembly-verification.json': '058d92ca4c7aae832f8b5e6cd648c4013dad987950a18ce91c250e8521f3614b'}

# Independently declared body hashes/regions, not imported from a model.
BODIES = {
    9: ('005CB050', '005CB177', '63ef89f2b55faae9aea25c885ae229a65ed24487bca73410bbf9b3d37bbae6c9'),
    10: ('005D5DD0', '005D5EF7', '918f1b3d84c37b10c36ebdd81f78499ee9158c3bbb535831b3b52a6805daf6f4'),
    12: ('005C4E70', '005C4F7E', '70416a83c176fe2d8535e3f834fd5ceebdcce0c290ac808741beb5d3ba742261'),
    22: ('005BEDA0', '005BEEE2', 'b5f6702bc864e81bd071cf85e70e5782b29f7b0716acb96b9c13e055091c601e'),
}
PRESENTATION = {
    9: ('005CB0E2', '005CB15E', 0x13a5, 0x5c1a40),
    10: ('005D5E62', '005D5EDE', 0x207e, 0x5c1a40),
    12: ('005C4EF4', '005C4F65', 0x13e9, 0x5c45e0),
    22: ('005BEE58', '005BEEC9', 0x1595, 0x5cf9f0),
}


def branches(instructions):
    result = []
    for site, b in instructions:
        if 0x70 <= b[0] <= 0x7f or b[0] == 0xeb:
            assert len(b) == 2
            target = site + 2 + struct.unpack_from('<b', b, 1)[0]
        elif b[0] == 0xe9 or b[0] == 0x0f and 0x80 <= b[1] <= 0x8f:
            assert len(b) in (5, 6)
            target = site + len(b) + struct.unpack_from('<i', b, len(b)-4)[0]
        else:
            continue
        result.append(dict(site=f'{site:08X}', bytes=b.hex(' '), target=f'{target:08X}'))
    return result


def load_evidence():
    e = json.loads(MANIFEST.read_text())
    pins = [e['priorEvidence'], e['inheritedChecker']] + e['retainedApiFiles']
    assert {r['path']: r['sha256'] for r in pins} == PINS
    for path, expected in PINS.items():
        assert digest((ROOT/path).read_bytes()) == expected, path
    prior = load_prior()
    inherited, selected = prior[3], dict(prior[6])
    origin_path = ROOT/'docs/sources/personnel-detachment-source-profile.json'
    origin = json.loads(origin_path.read_text())
    raw, ins = {}, {}
    for row in e['ranges']:
        key = row['source'], row['start']
        assert key not in raw
        assert row['inheritedManifest'] == str(origin_path.relative_to(ROOT))
        assert row['inheritedRange'] in origin['ranges']
        old_raw, old_ins = read_rows(origin_path.with_suffix(''), row['inheritedRange'])
        raw[key], ins[key] = read_rows(DIRECTORY, row)
        assert (raw[key], ins[key]) == (old_raw, old_ins)
        selected[key + (row['endExclusive'],)] = raw[key]
    return e, raw, ins, prior, selected


class LiveZeroRefundSource(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.e, cls.raw, cls.ins, cls.prior, cls.selected = load_evidence()

    def at(self, source, function, offset, hexbytes):
        value = bytes.fromhex(hexbytes)
        self.assertEqual(self.raw[source, function][offset:offset+len(value)], value)

    def call(self, source, function, offset, target):
        site = int(function, 16) + offset
        raw = self.raw[source, function][offset:offset+5]
        self.assertEqual(raw[0], 0xe8)
        self.assertEqual(site+5+struct.unpack_from('<i', raw, 1)[0], target)

    def helper(self, source, start):
        hits = [b for (s,a,z,h), b in self.prior[4].items() if s == source and a == start]
        self.assertTrue(hits, start)
        self.assertTrue(all(b == hits[0] for b in hits))
        return hits[0]

    def test_01_source_identity_no_stock_claim(self):
        self.assertEqual(self.e['profileId'], 'source-idb-S1-S2-live-zero-refund-v1')
        self.assertEqual(self.e['baselineCommit'], 'e8bae319e5d1b08057fd091a90d305d58c9d7669')
        self.assertEqual({s['source']:s['idbSha256'] for s in self.e['sources']}, SOURCE_HASHES)
        self.assertEqual(self.e['sources'], self.prior[0]['sources'])
        self.assertTrue(all('血色' in s['recordedInputPath'] for s in self.e['sources']))
        for flag in ('stockOriginalVerified','originalExeExecuted','recordedExeHashesIndependentlyVerified'):
            self.assertIs(self.e[flag], False)
        self.assertEqual(self.e['adoption'], {'PC-PK1.1':'compatibility-reconstruction','PC-Vanilla-assumed':'compatibility-assumption','PS2-Wii':'open'})
        self.assertIs(self.e['contracts']['noninterferenceAssumption'], False)
        self.assertIs(self.e['contracts']['stockCertification'], False)

    def test_02_frozen_prior_api_and_full_evidence_closure(self):
        # load_prior independently checks recursively declared manifests,
        # physical byte artifacts, overlapping intervals and 23 legacy modules.
        self.assertEqual(len(self.prior[0]['inheritedEvidence']), 17)
        self.assertEqual(len(self.prior[0]['inheritedArtifacts']), 622)
        self.assertEqual(len(self.prior[0]['inheritedPrimitiveDependencies']), 23)
        self.assertEqual(self.prior[7], 1852)
        self.assertEqual(len(self.prior[1]), 92)
        self.assertEqual({r['file']:r['sha256'] for r in self.e['provenance']['verificationArtifacts']}, VERIFICATION_HASHES)
        for name, expected in VERIFICATION_HASHES.items():
            self.assertEqual(digest((DIRECTORY/name).read_bytes()), expected, name)
        for path, expected in PINS.items():
            self.assertEqual(digest((ROOT/path).read_bytes()), expected, path)

    def test_03_complete_body_hashes_and_cross_source_equality(self):
        self.assertEqual(len(self.raw), 8)
        for mission, (a,z,h) in BODIES.items():
            for source in SOURCE_HASHES:
                row = next(r for r in self.e['ranges'] if r['source']==source and r['start']==a)
                self.assertEqual((row['endExclusive'], row['sha256']), (z,h))
                self.assertEqual(digest(self.raw[source,a]), h)
                self.assertEqual(len(self.raw[source,a]), int(z,16)-int(a,16))
                self.assertEqual(self.raw[source,a][-3:], b'\xc2\x08\x00')
            self.assertEqual(self.raw['S1',a], self.raw['S2',a])
        self.assertEqual(self.e['rangeBudget'], dict(intervals=8,selectedBytesBothSources=2364,identicalSourcePairs=4,callSites=130,branchSites=56))

    def test_04_complete_call_and_branch_ledgers(self):
        calls = jumps = 0
        self.assertEqual(set(self.e['callLedgers']), set(SOURCE_HASHES))
        for source in SOURCE_HASHES:
            self.assertEqual(set(self.e['callLedgers'][source]), {r[0] for r in BODIES.values()})
            for a,_,_ in BODIES.values():
                calls += verify_calls(self.ins[source,a], self.e['callLedgers'][source][a])
                ledger = branches(self.ins[source,a])
                self.assertEqual(ledger, self.e['branchLedgers'][source][a])
                addresses = {site for site,_ in self.ins[source,a]}
                for row in ledger:
                    self.assertIn(int(row['target'],16), addresses)
                jumps += len(ledger)
        self.assertEqual((calls,jumps), (130,56))

    def test_05_common_actor_current_and_saved_pointer_gates(self):
        for source in SOURCE_HASHES:
            for mission,(a,_,_) in BODIES.items():
                self.at(source,a,0x0e,'8b 75 08 57 56')
                self.call(source,a,0x13,0x47a630)
                self.at(source,a,0x1f,'8b 86 9c 00 00 00 85 c0 7c 05 83 f8 56 7e 03 83 c8 ff 50')
                self.call(source,a,0x37,0x490d00)
                self.at(source,a,0x3c,'8b d8 53')
                self.call(source,a,0x3f,0x47a630)
                self.at(source,a,0x4b,'6a 00 8b ce')
                self.call(source,a,0x4f,0x4897b0)

    def test_06_building_target_range_only_and_force_result_discarded(self):
        for source in SOURCE_HASHES:
            for mission in (9,10):
                a=BODIES[mission][0]
                self.at(source,a,0x54,'8b f8 85 ff 7c 08 81 ff ff 3f 00 00 7e 0b')
                self.at(source,a,0x62,'33 c0')
                self.at(source,a,0x6d,'8b 06 8b ce ff 50 40 50')
                self.call(source,a,0x7a,0x490aa0)
                self.call(source,a,0x80,0x47a630)
                self.at(source,a,0x85,'56')
                self.call(source,a,0x86,0x5b81d0)
                # TEST only after005B81D0; the preceding force validity is not a gate.
                self.at(source,a,0x8b,'83 c4 08 85 c0 74 7c')
                self.call(source,a,0x98,0x490d00)

    def test_07_person_pointer_constructed_before_notification_without_validity(self):
        for source in SOURCE_HASHES:
            a=BODIES[12][0]
            self.at(source,a,0x54,'85 c0 7c 07 3d 4b 04 00 00 7e 0b')
            self.at(source,a,0x6a,'50 b9 58 19 20 07')
            self.call(source,a,0x70,0x490b00)
            self.at(source,a,0x75,'56 8b f8')
            self.call(source,a,0x78,0x5b81d0)
            calls=self.e['callLedgers'][source][a]
            self.assertEqual(sum(r.get('target')=='0047A630' for r in calls),2)
            self.assertNotIn('00490AA0',[r.get('target') for r in calls])
            self.assertNotIn(b'\xff\x50\x40',[b for _,b in self.ins[source,a]])
            # Getter only computes fixed-array identity; no target row validity/fields.
            helper=self.helper(source,'00490B00')
            self.assertEqual(helper,bytes.fromhex('8b 44 24 04 85 c0 7c 17 3d 4b 04 00 00 7f 10 69 c0 90 01 00 00 8d 84 08 bc c0 00 00 c2 04 00 33 c0 c2 04 00'))

    def test_08_force_target_and_pre_notification_color_are_separate(self):
        for source in SOURCE_HASHES:
            a=BODIES[22][0]
            self.call(source,a,0x5a,0x490aa0)
            self.at(source,a,0x5f,'50 89 44 24 18')
            self.call(source,a,0x64,0x47a630)
            self.at(source,a,0x69,'83 c4 04 85 c0 75 0b 33 c0')
            self.at(source,a,0x7f,'c7 44 24 10 ff ff ff ff ff 50 40 50')
            self.call(source,a,0x90,0x490aa0)
            self.at(source,a,0x95,'8b f8 57')
            self.call(source,a,0x98,0x47a630)
            self.at(source,a,0x9d,'83 c4 04 85 c0 74 07 8b 4f 44 89 4c 24 10 56')
            self.call(source,a,0xac,0x5b81d0)
            self.at(source,a,0xb8,'8b 54 24 14 52 56')
            self.assertNotIn('0047A770',[r.get('target') for r in self.e['callLedgers'][source][a]])

    def test_09_fresh_notification_canonical_reads(self):
        for source in SOURCE_HASHES:
            raw=self.helper(source,'005B81D0')
            self.assertEqual(digest(raw),'46e4e5388d0aa9babd6b1a2c71d1de33dd5b69aa5cddb87b3407e6a89b3817c5')
            landmarks={0x10:'75 02 5e c3',0x19:'ff 50 40',0x34:'74 3f',0x3a:'ff 52 48',0x3f:'74 34',0x45:'ff 50 44',0x60:'74 13',0x6b:'74 08',0x6d:'5f b8 01 00 00 00 5e c3',0x75:'5f 33 c0 5e c3'}
            for offset,b in landmarks.items():
                value=bytes.fromhex(b);self.assertEqual(raw[offset:offset+len(value)],value)
            self.assertEqual(digest(self.helper(source,'0047B2B0')),'2b871355a493a19960355b895dcbf725a6b3c931af48f71d233989991aac5017')
            self.assertEqual(digest(self.helper(source,'0047A6D0')),'0e654e75b52c3a8e80e3d2452676daec53cb21e28423d18c66001ba2214cf7d1')

    def test_10_exact_opaque_regions_message_arguments_and_color_timing(self):
        for source in SOURCE_HASHES:
            for mission,(ps,pe,message,formatter) in PRESENTATION.items():
                a=BODIES[mission][0];start,end=int(ps,16),int(pe,16)
                handler=next(r for r in self.e['handlers'] if r['missionId']==mission)
                self.assertEqual((handler['presentation']['start'],handler['presentation']['endExclusive'],handler['presentation']['messageId']),(ps,pe,message))
                calls=[r for r in self.e['callLedgers'][source][a] if start<=int(r['site'],16)<end]
                direct=[int(r['target'],16) for r in calls if 'target' in r]
                expected=([0x490d00] if mission in (9,10) else [])+[formatter,0x49b390,0x4d06a0]+([0x47a770] if mission!=22 else [])+[0x63add0]
                self.assertEqual(direct,expected)
                self.assertEqual(sum(r['kind']=='indirect' for r in calls),2)
                region=self.raw[source,a][start-int(a,16):end-int(a,16)]
                self.assertIn(b'\x68'+struct.pack('<I',message),region)
                self.assertEqual(region[-3:],b'\x8b\x75\x08')
                self.assertEqual(handler['presentation']['kind'],'full-frame-RNG-effect-or-atomic-reject')
                # The preceding zero-result branch skips exactly this region.
                previous=next(r for r in self.e['branchLedgers'][source][a] if int(r['site'],16)==start-2)
                self.assertEqual(previous['target'],pe)

    def test_11_zero_refund_tail_live_reads_and_success_one(self):
        for source in SOURCE_HASHES:
            for mission,(a,_,_) in BODIES.items():
                pe=PRESENTATION[mission][1];off=int(pe,16)-int(a,16)
                self.at(source,a,off,'6a 00 56')
                self.call(source,a,off+3,0x5b8400)
                self.at(source,a,off+8,'83 c4 08 5f 5e b8 01 00 00 00 5b 8b e5 5d c2 08 00')
                row=next(r for r in self.e['handlers'] if r['missionId']==mission)
                self.assertEqual((row['successResult'],row['gateFailureResult']),(1,0))
                self.assertIs(row['eventArgumentRead'],False)
                self.assertIs(row['tail']['validityRecheckAtTailEntry'],False)
            tail=self.helper(source,'005B8400')
            self.assertEqual(tail[:0x20],bytes.fromhex('56 8b 74 24 08 8b 86 9c 00 00 00 85 c0 57 7c 05 83 f8 56 7e 03 83 c8 ff 8b be 98 00 00 00 3b c7'))
            self.assertEqual(tail[0x9a:0xa2],bytes.fromhex('8b 44 24 10 85 c0 7e 17'))
            # Zero refund skips004AE2A0; common return stages remain inherited.
            self.assertEqual(tail[0xc0:0xc4],bytes.fromhex('85 c0 75 1b'))

    def test_12_wrapper_dispatch_and_inherited_source_specific_tail(self):
        for source in SOURCE_HASHES:
            dispatcher=self.helper(source,'005B9B40')
            self.assertEqual(digest(dispatcher),'f14b892a5be8603044ef0991aac7cb4d95cc577296683f06a28bf12b7f921e8b')
            self.assertIn(bytes.fromhex('ff 50 0c'),dispatcher)
            self.assertNotIn(bytes.fromhex('ff 50 08'),dispatcher)
        self.assertNotEqual(self.helper('S1','004A5600'),self.helper('S2','004A5600'))
        self.assertTrue(any(s=='S2' and a=='0090CBA0' for s,a,z,h in self.prior[4]))

    def test_13_checker_imports_no_production_model(self):
        for filename in ('check_live_zero_refund_source.py','check_officer_relocation_source.py'):
            tree=ast.parse((ROOT/'scripts'/filename).read_text())
            modules=[]
            for node in ast.walk(tree):
                if isinstance(node,ast.Import):modules.extend(a.name.split('.')[0] for a in node.names)
                elif isinstance(node,ast.ImportFrom):modules.append((node.module or '').split('.')[0])
            self.assertTrue(set(modules)<= {'argparse','ast','hashlib','json','mmap','pathlib','struct','sys','unittest','check_officer_relocation_source'},modules)
        self.assertNotIn('live_zero_refund_profile',sys.modules)
        self.assertNotIn('officer_relocation_profile',sys.modules)


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--idb-s1',type=Path)
    parser.add_argument('--idb-s2',type=Path)
    parser.add_argument('--report',type=Path,help='Write machine-readable verification summary')
    args=parser.parse_args()
    result=unittest.TextTestRunner(verbosity=2).run(unittest.defaultTestLoader.loadTestsFromTestCase(LiveZeroRefundSource))
    if not result.wasSuccessful():return 1
    e,raw,ins,prior,selected=load_evidence()
    verified=[]
    for source,path in (('S1',args.idb_s1),('S2',args.idb_s2)):
        if path is None:continue
        verify_raw_id1(path,source,selected)
        verified.append(dict(source=source,idbSha256=SOURCE_HASHES[source],intervals=sum(s==source for s,a,z in selected),selectedIntervalBytes=sum(len(b) for (s,a,z),b in selected.items() if s==source)))
    report=dict(checker='check_live_zero_refund_source.py',sourceProfile=e['profileId'],baselineCommit=e['baselineCommit'],sourceTests=result.testsRun,sourceTestsPassed=True,bodyIntervals=len(raw),bodyBytes=sum(map(len,raw.values())),bodyCallSites=130,bodyBranchSites=56,retainedDirectPins=len(PINS),inheritedManifests=18,inheritedPhysicalArtifacts=622,inheritedRangeRecords=1852,inheritedPriorNewIntervals=92,inheritedApiModules=23,rawId1Verification=verified,machineCodeExecuted=False,originalExeExecuted=False,stockOriginalVerified=False,recordedExeHashesIndependentlyVerified=False)
    if args.report:
        args.report.write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps(report,sort_keys=True))
    return 0


if __name__=='__main__':
    raise SystemExit(main())
