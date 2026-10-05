"""Independent source checks for bounded004B40C0 generic-facility entry.

Stdlib and frozen source checkers only; never imports a production model or
executes target code. Optional IDB arguments reverify whole-file fingerprints
and every inherited/new raw ID1 interval. Recovered instruction boundaries are
independently checked in the pinned fresh-disassembly report.
"""
import argparse
import ast
import io
import json
from pathlib import Path
import struct
import sys
import unittest

from check_live_zero_refund_source import (
    LiveZeroRefundSource, branches, load_evidence as load_prior,
)
from check_officer_relocation_source import (
    SOURCE_HASHES, digest, read_rows, verify_calls, verify_raw_id1,
)

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / 'docs/sources/generic-facility.json'
DIRECTORY = MANIFEST.with_suffix('')
BASELINE = '094f94b41795169df73fe708f9bbd29083949ea1'
PINS = {
    'docs/sources/live-zero-refund.json': 'a60f70beef9dd1b78b5d1c68e14dba42f386820d263ed71df71f5a620101c855',
    'scripts/check_live_zero_refund_source.py': 'df91b1ddd785c20599febb213fe4cf68b44ef224ca89fc9bc8cf15cce1b4841f',
    'scripts/live_zero_refund_profile.py': '06b407f0ed14a7b3cf6b86ddda8e26f947ca60909936312ec1a95578f30db003',
    'scripts/live_zero_refund_primitives.py': '80dec4a1cf4864e6583e8b9e551624ff913a23cd7025c7977874b9a9258402b8',
    'scripts/check_live_zero_refund_profile.py': '6acde031d70c5757b20e5b1378fc41d9bf8ea1bfa5b4d4abf512a30e101566cb',
}
# Byte-stream hashes; text artifact hashes are separately checked by read_rows.
BODIES = {
    '004195D0': ('004195D4', '031a1d90a8a2c46993613c8b2828efd0c52f20f2852d5f2ff930bc6acc0090c8'),
    '00472070': ('004720AB', 'ba76fa401ab64a66e9ee58fd742a90a8aed891eb0815679089dcb0521e09c536'),
    '0047A630': ('0047A656', '39414d5052e472ece3b8b80f46b47178be3331aed847fafc4ebd4028aedebe1d'),
    '00490AD0': ('00490AF2', 'd03849242416ef33815626c63a49db94f0d84740bbe3ae137b638ad756be3333'),
    '004912C0': ('00491308', '19360d0d0373c30434cb79322992b787627daf84282d61d0511499aab5ab73d8'),
    '00491770': ('004917BC', '57db6d0a75e755ba06d4cf80f7dd9e634d89cf02e272c4c7ad3ae053e213f41b'),
    '004A8270': ('004A843E', '33e969717e776f93f034a86f50126248976e380564f59c802fc5c41d1d9c992f'),
    '004AD550': ('004AD665', '8e8978b13d407231a923db828a355b8ff08d1893e99dd1c3d9995e74022fc12c'),
    '004B40C0': ('004B49AD', '722fe6179b4d9396d1c8047e2dfafea57b11d7d035398638313ee0808e96e151'),
    '00707B1A': ('00707B28', 'c2f499d23d185ab906a17d4ae0e659346458674eea7f37bf0933e090773e3f48'),
    '00707D40': ('00707D7D', 'f36f56e85a3b8f0b9f0aaa3f1a49f9bda1143c728ff69d6c27517e4f359a69b8'),
}
SEGMENTS = {
    'entryAndGenericBranch': ('004B40C0', '004B415D', 'f7c7d8590d2429d99c72b71bb8f933202abf10981d9d4c8641fcc98addb63d8a'),
    'canonicalContinuation': ('004B415D', '004B4988', '9d09fc7cd9201467fe6f3cec6f6e9c1110007446b25c3594b1d3adcba206167e'),
    'commonEpilogue': ('004B4988', '004B49AD', '55bac57c21a1d036598ff93cc6c4c0ea296a4b603405e381498c27ef179bcb8e'),
}
CONTRACTS = {
    'normalExecutionOnly': True,
    'entryValidity': {
        'helper': '0047A630', 'callSite': '004B40FB',
        'nullOrProbeFailureResult': 0, 'nonNullReadableWritableThenVirtualSlot': '08',
        'zeroResultDestination': '004B4988', 'invalidBuildingNativeResult': 0,
        'oldLegionReadBeforeValidity': False,
    },
    'oldLegion': {
        'scalarReadSite': '004B410F', 'virtualSlot': '44',
        'getter': '00490AD0', 'getterSite': '004B4118',
        'canonicalIdMinimum': 0, 'canonicalIdMaximum': 46,
        'outOfRangeConstructsNull': True, 'validityChecked': False,
        'rowFieldsReadByGetter': False, 'savedPointerEspOffsetAtContinuation': '10',
        'oldScalarStillLiveAtContinuation': False,
    },
    'requestedLegion': {
        'pointerArgumentIndex': 2, 'pointerToId': '004912C0', 'callSite': '004B4145',
        'nullResult': -1, 'canonicalIdMinimum': 0, 'canonicalIdMaximum': 46,
        'objectValidityCheckedByConversion': False, 'alignmentCheckedByConversion': False,
        'fixedArrayBase': '0720CB64', 'slotStride': 80,
        'signedDeltaDivision': 'truncate-toward-zero', 'badQuotientResult': -1,
        'identityStub': '004195D0', 'identityStubResult': -1,
        'arbitraryRawPointersModeled': False,
    },
    'genericBranch': {
        'minimumBuildingId': 87, 'maximumBuildingId': 16383,
        'requestedLegionValidityGate': False, 'ownershipPrimitive': '004AD550',
        'ownershipCallSite': '004B414E', 'ownershipArguments': ['building-pointer', 'converted-requested-legion-id'],
        'ownershipManager': 'same-entry-gameplay-manager',
        'normalReturnValue': 1, 'ownershipReturnValueIgnored': True,
        'ownershipSameLiveFrame': True, 'event9And10EffectsRetained': True,
    },
    'canonicalContinuation': {
        'address': '004B415D', 'boundaryKind': 'full-frame-RNG-effect-query-or-atomic-reject',
        'esi': 'entry-building-pointer', 'ebp': 'entry-gameplay-manager',
        'eax': '00491770-building-id-result', 'ecx': '07201958',
        'espRelativeToEntry': -6464,
        'stack': {
            '10': 'saved-old-legion-pointer', '14': 'entry-gameplay-manager',
            '1930': 'saved-security-cookie', '1934': 'previous-fs0',
            '1938': 'exception-handler-0072F946', '193C': 'exception-state-minus-one',
            '1940': 'return-address', '1944': 'entry-building-pointer',
            '1948': 'entry-requested-legion-pointer', '194C': 'entry-third-argument-dword',
        },
        'requestedPointerAlreadyValidated': False, 'requestedPointerAlreadyConverted': False,
        'savedOldLegionPointerAlreadyValidated': False, 'stackLocalsInitializedByContinuation': False,
        'managerFixedGlobalEstablished': False, 'instructionAtBoundary': 'push-edi',
        'normalReturnValues': [0, 1],
        'genericNoncanonicalPointerBehaviorImplemented': False,
    },
    'platform': {
        'stackProbe': '00707D40', 'stackAllocationBytes': 6444,
        'securityCookieAddress': '008E0BAC', 'securityCheck': '00707B1A',
        'securityMismatchDestination': '00707AE9', 'securityMatchPreservesEax': True,
        'callerCleanupBytes': 12, 'fs0RestoredOnNormalReturn': True,
        'faultsAndSecurityFailureExecuted': False, 'rawMachineResumeImplemented': False,
    },
    'uncovered': [
        'canonical-base-capture-and-extinction', 'troop-reaction-and-membership',
        'surrender-and-captive-policy', 'recursive-return-ruler-ownership',
        'arbitrary-or-misaligned-machine-pointers', 'process-memory-probes-and-custom-vtables',
        'stack-probe-faults-security-failure-and-SEH-unwinding',
        'callback-observation-authenticity-and-real-RNG-consumption',
        'clean-stock-PK-Vanilla-and-console-equivalence',
    ],
}
VERIFICATION_HASHES = {'raw-verification.json': '12cfeda2a728110d4654ef5db52b9f530bd7b0eb4a04337d0a8130d8e3e7da9d', 'disassembly-verification.json': '6145d31718b75c5c6f3a32d97ce528a6ba6b55ce6c154c1592fa1a691bd68041'}


def load_evidence():
    e = json.loads(MANIFEST.read_text())
    assert {r['path']: r['sha256'] for r in [e['priorEvidence']] + e['retainedFiles']} == PINS
    for path, h in PINS.items():
        assert digest((ROOT / path).read_bytes()) == h, path
    prior = load_prior()
    selected = dict(prior[4])
    raw, ins = {}, {}
    for row in e['ranges']:
        key = row['source'], row['start']
        assert key not in raw
        raw[key], ins[key] = read_rows(DIRECTORY, row)
        interval = key + (row['endExclusive'],)
        if row['inheritedBytes']:
            assert selected[interval] == raw[key]
        else:
            assert row['start'] in ('00707B1A', '00707D40')
        selected[interval] = raw[key]
    return e, raw, ins, prior, selected


class GenericFacilitySource(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.e, cls.raw, cls.ins, cls.prior, cls.selected = load_evidence()

    def at(self, source, function, address, hexbytes):
        b = bytes.fromhex(hexbytes)
        offset = address - int(function, 16)
        self.assertEqual(self.raw[source, function][offset:offset + len(b)], b)

    def call(self, source, function, address, target):
        off = address - int(function, 16)
        b = self.raw[source, function][off:off + 5]
        self.assertEqual(b[0], 0xe8)
        self.assertEqual(address + 5 + struct.unpack_from('<i', b, 1)[0], target)

    def test_01_identity_and_source_limitations(self):
        self.assertEqual(self.e['profileId'], 'source-idb-S1-S2-generic-facility-v1')
        self.assertEqual(self.e['baselineCommit'], BASELINE)
        self.assertEqual(self.e['sources'], self.prior[0]['sources'])
        self.assertEqual({s['source']: s['idbSha256'] for s in self.e['sources']}, SOURCE_HASHES)
        self.assertTrue(all('血色' in s['recordedInputPath'] for s in self.e['sources']))
        for key in ('stockOriginalVerified', 'originalExeExecuted', 'recordedExeHashesIndependentlyVerified'):
            self.assertIs(self.e[key], False)
        self.assertEqual(self.e['adoption'], {'PC-PK1.1': 'compatibility-reconstruction', 'PC-Vanilla-assumed': 'compatibility-assumption', 'PS2-Wii': 'open'})
        self.assertEqual(self.e['contracts'], CONTRACTS)

    def test_02_inherited_closure_and_frozen_api(self):
        # Run all 13 frozen source tests; they pin the preceding reports, all
        # 17 older manifests, 622 physical artifacts,1852 range records and23
        # legacy modules, plus officer-relocation's six immediate file pins.
        result = unittest.TextTestRunner(stream=io.StringIO()).run(
            unittest.defaultTestLoader.loadTestsFromTestCase(LiveZeroRefundSource))
        self.assertTrue(result.wasSuccessful(), (result.failures, result.errors))
        self.assertEqual(result.testsRun, 13)
        self.assertEqual(len(self.prior[3][0]['inheritedEvidence']), 17)
        self.assertEqual(len(self.prior[3][0]['inheritedArtifacts']), 622)
        self.assertEqual(self.prior[3][7], 1852)
        self.assertEqual(len(self.prior[4]), 1232)
        self.assertEqual(len(self.selected), 1236)
        for p, h in PINS.items():
            self.assertEqual(digest((ROOT / p).read_bytes()), h)

    def test_03_all_intervals_hashes_and_cross_source_equality(self):
        self.assertEqual(set(self.raw), {(s, a) for s in SOURCE_HASHES for a in BODIES})
        for a, (z, h) in BODIES.items():
            for source in SOURCE_HASHES:
                row = next(r for r in self.e['ranges'] if (r['source'], r['start']) == (source, a))
                self.assertEqual((row['endExclusive'], row['sha256']), (z, h))
                self.assertEqual(len(self.raw[source, a]), int(z, 16) - int(a, 16))
                self.assertEqual(digest(self.raw[source, a]), h)
            self.assertEqual(self.raw['S1', a], self.raw['S2', a])
        self.assertEqual(self.e['rangeBudget'], dict(intervals=22, selectedBytesBothSources=6764,
            identicalSourcePairs=11, instructions=2222, callSites=404, branchSites=208))
        self.assertEqual(sum(len(v) for v in self.ins.values()), 2222)
        # A 12-byte row exceeds a fixed 30-character byte column. A decoder
        # that silently clips such rows gets the wrong004B40C0 hash.
        self.assertEqual(dict(self.ins['S1', '004B40C0'])[0x4b420d],
                         bytes.fromhex('c7 84 24 50 19 00 00 00 00 00 00'))

    def test_04_complete_calls_branches_and_segment_hashes(self):
        call_count = branch_count = 0
        for source in SOURCE_HASHES:
            self.assertEqual(set(self.e['callLedgers'][source]), set(BODIES))
            self.assertEqual(set(self.e['branchLedgers'][source]), set(BODIES))
            for a in BODIES:
                call_count += verify_calls(self.ins[source, a], self.e['callLedgers'][source][a])
                ledger = branches(self.ins[source, a])
                self.assertEqual(ledger, self.e['branchLedgers'][source][a])
                branch_count += len(ledger)
            for name, (a, z, h) in SEGMENTS.items():
                self.assertEqual(self.e['nativeRegions'][name]['start'], a)
                self.assertEqual(self.e['nativeRegions'][name]['endExclusive'], z)
                self.assertEqual(digest(self.raw[source, '004B40C0'][int(a, 16)-0x4b40c0:int(z, 16)-0x4b40c0]), h)
        self.assertEqual((call_count, branch_count), (404, 208))

    def test_05_entry_validity_and_zero_return_before_old_legion_read(self):
        for s in SOURCE_HASHES:
            self.call(s, '004B40C0', 0x4b40fb, 0x47a630)
            self.at(s, '004B40C0', 0x4b4100, '83 c4 04 85 c0 0f 84 7d 08 00 00')
            self.at(s, '004B40C0', 0x4b410b, '8b 06 8b ce ff 50 44 50 b9 58 19 20 07')
            self.call(s, '004B40C0', 0x4b4118, 0x490ad0)
            b = self.raw[s, '0047A630']
            self.assertEqual(b, bytes.fromhex('56 8b 74 24 08 85 f6 74 11 6a 01 6a 04 56 e8 2d 7a ff ff 83 c4 0c 85 c0 75 04 33 c0 5e c3 8b 06 8b ce 5e ff 60 08'))
            self.assertEqual([r['bytes'] for r in self.e['callLedgers'][s]['00472070']],
                             ['ff 15 68 e2 74 00', 'ff 15 6c e2 74 00'])

    def test_06_old_pointer_construction_without_validity_or_dereference(self):
        for s in SOURCE_HASHES:
            self.assertEqual(self.raw[s, '00490AD0'], bytes.fromhex('8b 44 24 04 85 c0 7c 15 83 f8 2e 7f 10 8d 04 80 c1 e0 04 8d 84 08 0c b2 00 00 c2 04 00 33 c0 c2 04 00'))
            self.assertEqual(self.e['callLedgers'][s]['00490AD0'], [])
            self.at(s, '004B40C0', 0x4b411d, '56 b9 58 19 20 07 89 44 24 14')
            self.call(s, '004B40C0', 0x4b4127, 0x491770)

    def test_07_requested_pointer_conversion_range_not_validity(self):
        for s in SOURCE_HASHES:
            self.assertEqual(self.raw[s, '004195D0'], bytes.fromhex('83 c8 ff c3'))
            self.at(s, '004912C0', 0x4912c0, '56 8b 74 24 08 85 f6 57 74 36 8d b9 0c b2 00 00 85 ff 74 2c 53')
            self.call(s, '004912C0', 0x4912d5, 0x4195d0)
            self.call(s, '004912C0', 0x4912dc, 0x4195d0)
            self.at(s, '004912C0', 0x4912e1, '3b d8 5b 75 1a 2b f7 b8 67 66 66 66 f7 ee c1 fa 05 8b c2 c1 e8 1f 03 c2 78 05 83 f8 2e 7e 03 83 c8 ff 5f 5e c2 04 00')
            self.assertEqual([r['target'] for r in self.e['callLedgers'][s]['004912C0']], ['004195D0', '004195D0'])
        self.assertEqual(0x7201958 + 0xb20c, 0x720cb64)
        # Independent arithmetic interpretation of the recovered multiply/shift
        # sequence; this is not target-code execution or a runtime model test.
        def quotient(delta):
            high = (delta * 0x66666667) >> 32
            q = high >> 5
            return q + ((q & 0xffffffff) >> 31)
        for delta in (-3761, -80, -79, -1, 0, 1, 79, 80, 3680, 3759, 3760, 2**31-1, -2**31):
            expected = abs(delta) // 80 * (-1 if delta < 0 else 1)
            self.assertEqual(quotient(delta), expected)
        self.assertEqual(quotient(-1), 0)  # Explicitly no alignment/range-of-address gate.

    def test_08_building_id_and_generic_range_only(self):
        for s in SOURCE_HASHES:
            self.at(s, '00491770', 0x49177a, '8d b9 30 97 08 00')
            self.at(s, '00491770', 0x491796, '2b f7 b8 93 24 49 92 f7 ee 03 d6 c1 fa 05 8b c2 c1 e8 1f 03 c2 78 07 3d ff 3f 00 00 7e 03 83 c8 ff')
            self.at(s, '004B40C0', 0x4b412c, '83 f8 57 7c 2c 3d ff 3f 00 00 7f 25')
            jumps = [r for r in self.e['branchLedgers'][s]['004B40C0'] if r['site'] in ('004B412F', '004B4136')]
            self.assertEqual([r['target'] for r in jumps], ['004B415D', '004B415D'])

    def test_09_generic_call_arguments_and_forced_success(self):
        for s in SOURCE_HASHES:
            self.at(s, '004B40C0', 0x4b4138, '8b 8c 24 48 19 00 00 51 b9 58 19 20 07')
            self.call(s, '004B40C0', 0x4b4145, 0x4912c0)
            self.at(s, '004B40C0', 0x4b414a, '50 56 8b cd')
            self.call(s, '004B40C0', 0x4b414e, 0x4ad550)
            self.at(s, '004B40C0', 0x4b4153, 'b8 01 00 00 00 e9 2b 08 00 00')
            entry_calls = [r for r in self.e['callLedgers'][s]['004B40C0'] if int(r['site'], 16) < 0x4b415d]
            self.assertEqual([r.get('target', 'virtual44') for r in entry_calls],
                ['00707D40', '0047A630', 'virtual44', '00490AD0', '00491770', '004912C0', '004AD550'])
            self.assertEqual([r['target'] for r in self.e['branchLedgers'][s]['004B40C0'] if r['site'] == '004B4158'], ['004B4988'])

    def test_10_canonical_boundary_retains_original_inputs_and_saved_pointer(self):
        for s in SOURCE_HASHES:
            self.at(s, '004B40C0', 0x4b40e4, '55 56 8b b4 24 44 19 00 00 8b e9 56 89 84 24 34 19 00 00 89 6c 24 18')
            self.at(s, '004B40C0', 0x4b415d, '57 8b bc 24 4c 19 00 00 57')
            self.call(s, '004B40C0', 0x4b4166, 0x47a630)
            self.at(s, '004B40C0', 0x4b4176, '57 c7 44 24 24 ff ff ff ff c7 44 24 14 00 00 00 00')
            self.at(s, '004B40C0', 0x4b4253, '8b 74 24 18 56')
            self.call(s, '004B40C0', 0x4b4258, 0x47a630)
            # The third original dword is first inspected after the boundary.
            self.at(s, '004B40C0', 0x4b4238, '83 bc 24 54 19 00 00 04')
            self.at(s, '004B40C0', 0x4b416b, '83 c4 04 85 c0 0f 84 11 08 00 00')
            self.at(s, '004B40C0', 0x4b4981, 'b8 01 00 00 00 5b 5f')
            exits = [r for r in self.e['branchLedgers'][s]['004B40C0']
                     if 0x4b415d <= int(r['site'], 16) < 0x4b4988
                     and int(r['target'], 16) >= 0x4b4981]
            self.assertEqual([(r['site'], r['target']) for r in exits],
                             [('004B4170', '004B4987'), ('004B4282', '004B4981')])
            self.assertFalse(any(b[0] in (0xc2, 0xc3) for a, b in self.ins[s, '004B40C0']
                                 if 0x4b415d <= a < 0x4b4988))
        self.assertEqual(12 + 0x192c + 8, 0x1940)
        self.assertEqual(0x1940 + 4, 0x1944)
        self.assertFalse(CONTRACTS['canonicalContinuation']['requestedPointerAlreadyConverted'])

    def test_11_manager_identity_and_ownership_events_remain_live(self):
        for s in SOURCE_HASHES:
            self.at(s, '004A8270', 0x4a833f, '6a 00 50 b9 58 19 20 07')
            self.call(s, '004A8270', 0x4a8347, 0x490ad0)
            self.at(s, '004A8270', 0x4a834c, '50 53 8b cf')
            self.call(s, '004A8270', 0x4a8350, 0x4b40c0)
            self.at(s, '004AD550', 0x4ad62e, '8b 4c 24 10 6a 00 56 6a 09')
            self.call(s, '004AD550', 0x4ad637, 0x4bbaa0)
            self.at(s, '004AD550', 0x4ad64f, '8b 4c 24 10 6a 00 56 6a 0a')
            self.call(s, '004AD550', 0x4ad658, 0x4bbaa0)
            self.call(s, '004AD550', 0x4ad5e3, 0x4867a0)
            self.call(s, '004AD550', 0x4ad5eb, 0x4876a0)

    def test_12_normal_stack_probe_cookie_epilogue_and_exception_exclusion(self):
        for s in SOURCE_HASHES:
            self.at(s, '004B40C0', 0x4b40c0, '6a ff 68 46 f9 72 00 64 a1 00 00 00 00 50 b8 2c 19 00 00 64 89 25 00 00 00 00')
            self.call(s, '004B40C0', 0x4b40da, 0x707d40)
            self.at(s, '004B40C0', 0x4b4988, '8b 8c 24 34 19 00 00 5e 64 89 0d 00 00 00 00 8b 8c 24 2c 19 00 00 5d')
            self.call(s, '004B40C0', 0x4b499f, 0x707b1a)
            self.at(s, '004B40C0', 0x4b49a4, '81 c4 38 19 00 00 c2 0c 00')
            self.assertEqual(self.raw[s, '00707B1A'], bytes.fromhex('3b 0d ac 0b 8e 00 75 01 c3 e9 c1 ff ff ff'))
            self.assertEqual(self.e['branchLedgers'][s]['00707B1A'][-1]['target'], '00707AE9')
            self.at(s, '00707D40', 0x707d55, '51 8d 4c 24 08 81 e9 00 10 00 00 2d 00 10 00 00 85 01')
            self.at(s, '00707D40', 0x707d6e, '2b c8 8b c4 85 01 8b e1 8b 08 8b 40 04 50 c3')
        # Inherited cleanup fragments differ; body equality is no proof of
        # exception-path equality, let alone clean-stock equivalence.
        self.assertNotEqual(self.prior[3][1]['S1', '0072F930'], self.prior[3][1]['S2', '0072F930'])

    def test_13_verification_artifacts_and_no_production_imports(self):
        self.assertEqual({r['file']: r['sha256'] for r in self.e['provenance']['verificationArtifacts']}, VERIFICATION_HASHES)
        for f, h in VERIFICATION_HASHES.items():
            self.assertEqual(digest((DIRECTORY / f).read_bytes()), h)
        report = json.loads((DIRECTORY / 'disassembly-verification.json').read_text())
        self.assertEqual((report['bodyIntervals'], report['bodyBytes'], report['instructions']), (22, 6764, 2222))
        self.assertTrue(all(r['allBoundariesMatch'] for r in report['checked']))
        tree = ast.parse(Path(__file__).read_text())
        imports = []
        for node in ast.walk(tree):
            if isinstance(node, ast.Import): imports.extend(a.name.split('.')[0] for a in node.names)
            elif isinstance(node, ast.ImportFrom): imports.append((node.module or '').split('.')[0])
        self.assertTrue(set(imports) <= {'argparse', 'ast', 'io', 'json', 'pathlib', 'struct', 'sys', 'unittest', 'check_live_zero_refund_source', 'check_officer_relocation_source'})
        self.assertNotIn('generic_facility_profile', sys.modules)
        self.assertNotIn('live_zero_refund_profile', sys.modules)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--idb-s1', type=Path)
    parser.add_argument('--idb-s2', type=Path)
    parser.add_argument('--report', type=Path)
    args = parser.parse_args()
    result = unittest.TextTestRunner(verbosity=2).run(unittest.defaultTestLoader.loadTestsFromTestCase(GenericFacilitySource))
    if not result.wasSuccessful(): return 1
    e, raw, ins, prior, selected = load_evidence()
    verified = []
    for s, p in (('S1', args.idb_s1), ('S2', args.idb_s2)):
        if p is None: continue
        verify_raw_id1(p, s, selected)
        verified.append(dict(source=s, idbSha256=SOURCE_HASHES[s], intervals=sum(k[0] == s for k in selected),
            selectedIntervalBytes=sum(len(b) for k, b in selected.items() if k[0] == s)))
    report = dict(checker='check_generic_facility_source.py', sourceProfile=e['profileId'], baselineCommit=BASELINE,
        sourceTests=result.testsRun, inheritedSourceTests=13, sourceTestsPassed=True,
        bodyIntervals=len(raw), bodyBytes=sum(map(len, raw.values())), bodyInstructions=2222,
        bodyCallSites=404, bodyBranchSites=208, retainedDirectPins=len(PINS), inheritedManifests=19,
        inheritedPhysicalArtifacts=622, inheritedRangeRecords=1852, inheritedRelocationIntervals=92,
        inheritedZeroRefundIntervals=8, inheritedLegacyApiModules=23, rawId1Verification=verified,
        machineCodeExecuted=False, originalExeExecuted=False, stockOriginalVerified=False,
        recordedExeHashesIndependentlyVerified=False, platformFaultsExecuted=False)
    if args.report: args.report.write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps(report, sort_keys=True))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
