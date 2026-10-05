"""Independent dual-IDB source checks for004891C0 native troop membership.

Only stdlib and frozen independent source checkers are imported. No production
model or original executable is executed. Optional IDBs verify complete hashes
and every inherited/new selected interval through raw ID1 low-byte mapping.
"""
import argparse
import ast
import io
import json
from pathlib import Path
import struct
import sys
import unittest

from check_native_tail_distance_source import NativeTailDistanceSource, load_evidence as load_prior
from check_live_zero_refund_source import branches
from check_officer_relocation_source import SOURCE_HASHES, digest, read_rows, verify_calls, verify_raw_id1

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / 'docs/sources/native_troop_membership.json'
DIRECTORY = MANIFEST.with_suffix('')
BASELINE = 'c190abfd43985251eee4936fdccb5d3910d4fed7'
HISTORICAL_EXTRACTION_BASELINE = '19f72abbd6d0a9dfaccd83530de003f71fdbd1fa'
PINS = {'docs/sources/native_tail_distance.json': 'd36a616d9ee3c8172e23477e4824e1bcd94f2ec4eb6405c7a640e5c4feb989c9', 'scripts/check_native_tail_distance_source.py': '8152ff8d0b368c4ad852d15b5c738337719b4b43a6f14c346f94e1b4b42dfad2', 'scripts/native_tail_distance_profile.py': '7ef9ed70f29534b774ab35d299992b6396b01e44692acce6c2223a3ebe5f38f7', 'scripts/native_tail_distance_primitives.py': '97d5f57057cade421ac1b83361914e6f7c44c4b3a25dfb5f1f33831821f285a0', 'scripts/check_native_tail_distance_profile.py': '4c7ea04e7d0b46cf32ed7f23ed5af371fbda3bdb89be780f8adaacc3cfa8dfa2', 'scripts/officer_relocation_primitives.py': 'f0787cd4f58a47ed83806d851ab8c52fce08817354cee9255c9ad124cd47cc51', 'scripts/recursive_return_frame.py': 'cd1f7cd1fbe3940987426c3f704bb56e6232ebd1d0c1e91d62ee9a70a5142810', 'scripts/recursive_role_primitives.py': 'ad28535effcc10a4a096dccf67e1293ae552b94e0c9795e0ad14fd0ee19cf14e'}
BODY_HASHES = {'004195D0': ['004195D4', {'S1': '031a1d90a8a2c46993613c8b2828efd0c52f20f2852d5f2ff930bc6acc0090c8', 'S2': '031a1d90a8a2c46993613c8b2828efd0c52f20f2852d5f2ff930bc6acc0090c8'}], '0041C130': ['0041C135', {'S1': '81794790c0ad77391e995d91903df71d532fdf23777b0a32cef0c4606e844a6f', 'S2': '81794790c0ad77391e995d91903df71d532fdf23777b0a32cef0c4606e844a6f'}], '00468E60': ['00468E66', {'S1': '5df10ed21e27c6f4dcad30a3050f43ccebae8ffa69612802165a96b9efeefddb', 'S2': '5df10ed21e27c6f4dcad30a3050f43ccebae8ffa69612802165a96b9efeefddb'}], '00472070': ['004720AB', {'S1': 'ba76fa401ab64a66e9ee58fd742a90a8aed891eb0815679089dcb0521e09c536', 'S2': 'ba76fa401ab64a66e9ee58fd742a90a8aed891eb0815679089dcb0521e09c536'}], '0047A5D0': ['0047A5D9', {'S1': '336e6d1ac6f11f67df7db7d5f89a438c5a41aa1673b4e071afda2050a291f656', 'S2': '336e6d1ac6f11f67df7db7d5f89a438c5a41aa1673b4e071afda2050a291f656'}], '0047A5E0': ['0047A5E7', {'S1': '96b136d90c06f657a1f15ed871a1d1a08aa9415104b91c66c2f3337a15ba454f', 'S2': '96b136d90c06f657a1f15ed871a1d1a08aa9415104b91c66c2f3337a15ba454f'}], '0047A630': ['0047A656', {'S1': '39414d5052e472ece3b8b80f46b47178be3331aed847fafc4ebd4028aedebe1d', 'S2': '39414d5052e472ece3b8b80f46b47178be3331aed847fafc4ebd4028aedebe1d'}], '0047AA80': ['0047AA90', {'S1': '9a2bb180f23db262c8ced963c3328bd2d09e74d4690e53d97b55b240a525dcf3', 'S2': '9a2bb180f23db262c8ced963c3328bd2d09e74d4690e53d97b55b240a525dcf3'}], '004883D0': ['004883EB', {'S1': 'c7dd95b24263a58b616df7adf489d1f07f502af3168d73d09da287ca65ca10c3', 'S2': 'c7dd95b24263a58b616df7adf489d1f07f502af3168d73d09da287ca65ca10c3'}], '004883F0': ['00488422', {'S1': '1a09de9f631ef197445be47b0d0886b4b49e942d128bd27ed615a38f5290a088', 'S2': '1a09de9f631ef197445be47b0d0886b4b49e942d128bd27ed615a38f5290a088'}], '00488430': ['00488461', {'S1': '7491f2b7b02c21e417945fbd0ee295ad3c5d2c24a99a159e443f306d0acb7f1f', 'S2': '7491f2b7b02c21e417945fbd0ee295ad3c5d2c24a99a159e443f306d0acb7f1f'}], '004891C0': ['0048921F', {'S1': '1d57cbaee05e849f951219305481215bd4daebe7c840f3ffb0e99730099c5f37', 'S2': '1d57cbaee05e849f951219305481215bd4daebe7c840f3ffb0e99730099c5f37'}], '00489F10': ['00489F22', {'S1': 'c9dfadf9bea7a72ed7f905c625e17ccb73ae47616ed799e24fccf78dc8697164', 'S2': 'c9dfadf9bea7a72ed7f905c625e17ccb73ae47616ed799e24fccf78dc8697164'}], '00490B00': ['00490B24', {'S1': '2cb3b51ef504a63e94a8fde3c94d5f9f80fb72d88b0df61f41d2608da575736c', 'S2': '2cb3b51ef504a63e94a8fde3c94d5f9f80fb72d88b0df61f41d2608da575736c'}], '00490E70': ['00490E94', {'S1': '69dce2910ef46501efb42c693e70432a5d30e9156664c3ae48fb55303d72a1be', 'S2': '69dce2910ef46501efb42c693e70432a5d30e9156664c3ae48fb55303d72a1be'}], '00491310': ['0049135A', {'S1': 'ff8455e17139f3794426e7601a069acbed1e81a61f2398b911e75cd0402849f1', 'S2': 'ff8455e17139f3794426e7601a069acbed1e81a61f2398b911e75cd0402849f1'}], '00495340': ['00495382', {'S1': 'a49821777993b52dbcdcc0ae4e7e60da729e39e5843a9a8847d67219080dbb17', 'S2': 'a49821777993b52dbcdcc0ae4e7e60da729e39e5843a9a8847d67219080dbb17'}], '00495390': ['004953C4', {'S1': 'd53b87f5995ef377db0aba6be78ef06be98475c7ca91218ef46db4c7012ca0f0', 'S2': 'd53b87f5995ef377db0aba6be78ef06be98475c7ca91218ef46db4c7012ca0f0'}], '00496000': ['0049600B', {'S1': 'a7d8de85f3a382332a20ec851c7eb3c1230565729a5a4cb30eff4c1a33e39c6a', 'S2': 'a7d8de85f3a382332a20ec851c7eb3c1230565729a5a4cb30eff4c1a33e39c6a'}], '00496040': ['00496095', {'S1': '53b3259ab3c5ad65284858ebbb9f4964efe9f9326b7086ffcc88bac821e9ab55', 'S2': '53b3259ab3c5ad65284858ebbb9f4964efe9f9326b7086ffcc88bac821e9ab55'}], '00496D90': ['00496DA2', {'S1': '04fc43ea99ccb0bfbb25c4dfc4b2843bc5d1464f9b50d2c2fae1b5dd3a327b7a', 'S2': '04fc43ea99ccb0bfbb25c4dfc4b2843bc5d1464f9b50d2c2fae1b5dd3a327b7a'}], '0067F810': ['0067F816', {'S1': '07297dca94be1b975a5dc696b5976f205b84057995fa3d3fbb157101b1ae8098', 'S2': '07297dca94be1b975a5dc696b5976f205b84057995fa3d3fbb157101b1ae8098'}], '0079C780': ['0079C7D0', {'S1': '31b9e76589f399ca3b91451fd4948da9672865716e98c45b3780817468b3021c', 'S2': '31b9e76589f399ca3b91451fd4948da9672865716e98c45b3780817468b3021c'}], '0079CC18': ['0079CC80', {'S1': 'efa4fcf33c37aa292173d640d6f873f32332c2ca46406423eb39de04ed3c75ff', 'S2': 'efa4fcf33c37aa292173d640d6f873f32332c2ca46406423eb39de04ed3c75ff'}], '0079CC80': ['0079CC8C', {'S1': 'c91f9bac358b29d91d06111e118d050dea803503c960c40ca8d2c625f7dcdfc5', 'S2': 'ac94994b7d6f10ce5b1666bf88192dd47dce742a74b215d1f780973250fa998c'}], '00911B50': ['00911B69', {'S2': 'ae04e98e8c54c9c6775eaa1d9f449364554fc0685ca1676d4b67f5f5d637f924'}]}
VERIFICATION_HASHES = {'raw-verification.json': '8f65a4038d3e1c0857032fcfbe4b273bc31437697d054e54d84ffd53cc757d3e', 'recovery-evidence-S1.json': '0eeffdca4077cb6c0d730410b3c50425e50ce5381582037ef7794d29bb0d82a7', 'recovery-evidence-S2.json': '3789a472c2b1d92f5ee564cc3b7d3290f842d1b2b53cfa2dd467d0b52dd2a4ab'}
BUDGET = {'focusedIntervals': 51, 'reusedExactInheritedIntervals': 30, 'newUniqueIntervals': 21, 'codeIntervals': 45, 'dataIntervals': 6, 'selectedBytesBothSources': 1951, 'instructions': 598, 'callSites': 35, 'branchSites': 99, 'inheritedSelectedIntervals': 1236, 'allSelectedIntervals': 1257, 'newMachineCodeBytesRecovered': 365}


def load_evidence():
    e = json.loads(MANIFEST.read_text())
    assert {r['path']: r['sha256'] for r in [e['priorEvidence']] + e['retainedFiles']} == PINS
    for path, expected in PINS.items():
        assert digest((ROOT / path).read_bytes()) == expected, path
    prior = load_prior()
    selected = dict(prior[4])
    raw, ins = {}, {}
    for row in e['ranges']:
        key = row['source'], row['start']
        assert key not in raw
        raw[key], ins[key] = read_rows(DIRECTORY, row)
        fullkey = key + (row['endExclusive'],)
        if fullkey in selected:
            assert selected[fullkey] == raw[key]
            assert row['evidenceUse'] == 'reused-exact-inherited-interval'
        else:
            assert row['evidenceUse'] == 'new-unique-interval'
        selected[fullkey] = raw[key]
    # Check every overlapping byte, including differently bounded prior regions.
    image = {}
    for (source, start, end), value in selected.items():
        for offset, byte in enumerate(value):
            key = source, int(start, 16) + offset
            assert key not in image or image[key] == byte, key
            image[key] = byte
    return e, raw, ins, prior, selected


class NativeTroopMembershipSource(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.e, cls.raw, cls.ins, cls.prior, cls.selected = load_evidence()

    def at(self, source, function, address, hexbytes):
        value = bytes.fromhex(hexbytes)
        off = address - int(function, 16)
        self.assertEqual(self.raw[source, function][off:off + len(value)], value)

    def call(self, source, function, address, target):
        off = address - int(function, 16)
        value = self.raw[source, function][off:off + 5]
        self.assertEqual(value[0], 0xe8)
        self.assertEqual(address + 5 + struct.unpack_from('<i', value, 1)[0], target)

    def test_01_identity_scope_and_baseline(self):
        self.assertEqual(self.e['profileId'], 'source-idb-S1-S2-native-troop-membership-v1')
        self.assertEqual(self.e['frameProfileId'], 'source-idb-S1-S2-native-troop-membership-frame-v1')
        self.assertEqual(self.e['baselineCommit'], BASELINE)
        self.assertEqual(self.e['sources'], self.prior[0]['sources'])
        self.assertEqual({r['source']: r['idbSha256'] for r in self.e['sources']}, SOURCE_HASHES)
        self.assertTrue(all('血色' in r['recordedInputPath'] for r in self.e['sources']))
        self.assertEqual(self.e['adoption'], {'PC-PK1.1': 'compatibility-reconstruction', 'PC-Vanilla-assumed': 'compatibility-assumption', 'PS2-Wii': 'open'})
        for flag in ('stockOriginalVerified', 'originalExeExecuted', 'recordedExeHashesIndependentlyVerified', 'rawRuntimeMapCaptured'):
            self.assertIs(self.e[flag], False)

    def test_02_frozen_prior_source_closure(self):
        result = unittest.TextTestRunner(stream=io.StringIO()).run(
            unittest.defaultTestLoader.loadTestsFromTestCase(NativeTailDistanceSource))
        self.assertTrue(result.wasSuccessful(), (result.failures, result.errors))
        self.assertEqual(result.testsRun, 12)
        self.assertEqual(len(self.prior[4]), 1236)
        self.assertEqual(len(self.selected), BUDGET['allSelectedIntervals'])

    def test_03_complete_function_regions_raw_and_artifact_pins(self):
        self.assertEqual(set(self.raw), {(s, a) for a, (_, hashes) in BODY_HASHES.items() for s in hashes})
        for row in self.e['ranges']:
            end, hashes = BODY_HASHES[row['start']]
            self.assertEqual(row['endExclusive'], end)
            self.assertEqual(digest(self.raw[row['source'], row['start']]), hashes[row['source']])
            self.assertEqual(row['rawId1Sha256'], hashes[row['source']])
            if row['kind'] == 'code':
                self.assertEqual(row['boundaryKind'], 'complete-IDB-function')
                self.assertEqual(row['ownerFunction'], row['start'])
                self.assertEqual(self.e['functionRegions'][row['source'] + ':' + row['start']],
                    [dict(start=row['start'], endExclusive=end)])
        self.assertEqual(self.e['rangeBudget'], BUDGET)
        self.assertEqual(len(self.raw), BUDGET['focusedIntervals'])
        self.assertEqual(sum(map(len, self.raw.values())), BUDGET['selectedBytesBothSources'])
        code = [r for r in self.e['ranges'] if r['kind'] == 'code']
        self.assertEqual(len(code), BUDGET['codeIntervals'])
        self.assertEqual(sum(len(self.ins[r['source'], r['start']]) for r in code), BUDGET['instructions'])
        self.assertEqual(sum(r['evidenceUse'] == 'new-unique-interval' for r in self.e['ranges']), BUDGET['newUniqueIntervals'])
        self.assertEqual(sum(r['evidenceUse'] == 'reused-exact-inherited-interval' for r in self.e['ranges']), BUDGET['reusedExactInheritedIntervals'])
        old_bytes = {(s, int(a, 16) + i) for s, a, z in self.prior[4] for i in range(int(z, 16) - int(a, 16))}
        new_code = {(r['source'], int(r['start'], 16) + i) for r in code for i in range(len(self.raw[r['source'], r['start']]))} - old_bytes
        self.assertEqual(len(new_code), BUDGET['newMachineCodeBytesRecovered'])

    def test_04_complete_call_and_branch_ledgers(self):
        total_calls = total_branches = 0
        for row in self.e['ranges']:
            source, start = row['source'], row['start']
            ledger = self.e['callLedgers'][source][start]
            if row['kind'] == 'data':
                self.assertEqual(ledger, [])
                continue
            total_calls += verify_calls(self.ins[source, start], ledger)
            expected = branches(self.ins[source, start])
            self.assertEqual(self.e['branchLedgers'][source][start], expected)
            total_branches += len(expected)
            for branch in expected:
                target = int(branch['target'], 16)
                self.assertTrue(int(start, 16) <= target < int(row['endExclusive'], 16)
                    or (start == '00496000' and target == 0x0047a5e0), branch)
        self.assertEqual(total_calls, BUDGET['callSites'])
        self.assertEqual(total_branches, BUDGET['branchSites'])

    def test_05_common_troop_vtable_constructor_and_source_specific_tail(self):
        expected = [0x496db0, 0x41c130, 0x496040, 0x495200, 0x495220, 0x495240,
                    0x4195d0, 0x423230, 0x4960a0, 0x468e60, 0x4951c0, 0x4951d0,
                    0x497270, 0x496f40, 0x496f90, 0x496030, 0x4955a0, 0x495560,
                    0x47a690, 0x495ca0, 0x496010, 0x496020, 0x47a8a0, 0x495600,
                    0x47a850, 0x5730e0]
        for s in SOURCE_HASHES:
            self.assertEqual(list(struct.unpack('<26I', self.raw[s, '0079CC18'])), expected)
            # Source-specific trailing word: S1 float50; S2 a patched code pointer.
            # Do not claim the S2 vtable ends at the common 26-slot block.
            self.assertEqual(struct.unpack('<3I', self.raw[s, '0079CC80']), ((0x42480000 if s == 'S1' else 0x00911b50), 0x3f2aaaab, 0x3dcccccd))
            self.call(s, '00496D90', 0x496d93, 0x47aa80)
            self.at(s, '00496D90', 0x496d98, 'c7 06 18 cc 79 00 8b c6 5e c3')
            self.assertEqual(self.raw[s, '0047AA80'], bytes.fromhex('8b c1 c7 00 88 b7 79 00 c7 40 04 04 00 00 00 c3'))
            self.assertEqual(self.raw[s, '0041C130'], bytes.fromhex('8b 01 ff 60 08'))
            self.assertEqual(self.raw[s, '00468E60'], bytes.fromhex('b8 0b 00 00 00 c3'))
            self.at(s, '00496000', 0x496000, 'c7 01 18 cc 79 00 e9 d5 45 fe ff')
            self.assertEqual(self.raw[s, '0047A5E0'], bytes.fromhex('c7 01 28 b7 79 00 c3'))

    def test_06_troop_validity_type_leader_and_full_failure_epilogue(self):
        for s in SOURCE_HASHES:
            self.assertEqual(len(self.raw[s, '00496040']), 85)
            self.at(s, '00496040', 0x496043, '8b 06 ff 50 24 83 f8 0b 75 44')
            self.at(s, '00496040', 0x49604d, '8b 46 0c 50 b9 58 19 20 07')
            self.call(s, '00496040', 0x496056, 0x490b00)
            self.call(s, '00496040', 0x49605c, 0x47a630)
            self.at(s, '00496040', 0x496064, '85 c0 74 29')
            self.at(s, '00496040', 0x49608a, 'b8 01 00 00 00 5e c3 33 c0 5e c3')
            self.assertEqual([r['site'] for r in self.e['branchLedgers'][s]['00496040'] if r['target'] == '00496091'],
                             ['0049604B', '00496066', '0049607F'])

    def test_07_deputy_validity_is_signed_upper_bound_only(self):
        for s in SOURCE_HASHES:
            self.at(s, '00496040', 0x496068, '33 c0 8d 4e 10 8d 49 00')
            self.at(s, '00496040', 0x496070, '85 c0 7c 0d 83 f8 02 7d 08 81 39 4c 04 00 00 7d 10')
            self.at(s, '00496040', 0x496081, '40 83 c1 04 83 f8 02 7c e6')
            # No person lookup, deputy-validity call, or lower-bound check on a deputy.
            self.assertEqual([r['site'] for r in self.e['callLedgers'][s]['00496040']],
                             ['00496045', '00496056', '0049605C'])

    def test_08_getters_construct_pointers_without_validity_or_row_read(self):
        for s in SOURCE_HASHES:
            self.assertEqual(self.raw[s, '00490E70'], bytes.fromhex(
                '8b 44 24 04 85 c0 7c 17 3d e7 03 00 00 7f 10 69 c0 f4 00 00 00 8d 84 08 30 97 16 00 c2 04 00 33 c0 c2 04 00'))
            self.assertEqual(self.raw[s, '00490B00'], bytes.fromhex(
                '8b 44 24 04 85 c0 7c 17 3d 4b 04 00 00 7f 10 69 c0 90 01 00 00 8d 84 08 bc c0 00 00 c2 04 00 33 c0 c2 04 00'))

    def test_09_actual_membership_location_bounds_and_native_call_order(self):
        for s in SOURCE_HASHES:
            self.at(s, '004891C0', 0x4891c4, '8b 87 9c 00 00 00 83 f8 57 7c 4b 3d 3e 04 00 00 7f 44')
            self.at(s, '004891C0', 0x4891e2, '83 c0 a9 eb 03 83 c8 ff')
            self.assertEqual([c['target'] for c in self.e['callLedgers'][s]['004891C0']],
                             ['00490E70', '0047A630', '00491310', '00495390'])
            self.at(s, '004891C0', 0x489202, '74 16')
            self.at(s, '004891C0', 0x48921a, '5f 33 c0 5e c3')

    def test_10_leader_or_exact_two_deputies_signed_actor_guard(self):
        for s in SOURCE_HASHES:
            self.at(s, '00495390', 0x495394, '85 c0 7c 17 3d 4b 04 00 00 7f 10')
            self.at(s, '00495390', 0x4953a0, '8b 71 0c 33 d2 3b f0 0f 94 c2')
            self.call(s, '00495390', 0x4953b0, 0x495340)
            self.at(s, '00495390', 0x4953b9, 'c2 04 00 b8 01 00 00 00 c2 04 00')
            self.at(s, '00495340', 0x495345, '85 f6 7c 2a 81 fe 4b 04 00 00 7f 22')
            self.at(s, '00495340', 0x495351, '33 c0 8d 51 10')
            self.at(s, '00495340', 0x495356, '85 c0 7c 09 83 f8 02 7d 04 8b 0a eb 03 83 c9 ff')
            self.at(s, '00495340', 0x495366, '3b ce 74 0f 40 83 c2 04 83 f8 02 7c e3')
            self.at(s, '00495340', 0x495373, '33 c0 5e c2 04 00 b8 01 00 00 00 5e c2 04 00')

    def test_11_actor_id_uses_fixed_pointer_difference_and_bounded_signed_id(self):
        for s in SOURCE_HASHES:
            self.assertEqual(self.raw[s, '004195D0'], bytes.fromhex('83 c8 ff c3'))
            self.at(s, '00491310', 0x49131a, '8d b9 bc c0 00 00 85 ff 74 2e')
            self.call(s, '00491310', 0x491325, 0x4195d0)
            self.call(s, '00491310', 0x49132c, 0x4195d0)
            self.at(s, '00491310', 0x491336, '2b f7 b8 1f 85 eb 51 f7 ee c1 fa 07 8b c2 c1 e8 1f 03 c2')
            self.at(s, '00491310', 0x491349, '78 07 3d 4b 04 00 00 7e 03 83 c8 ff 5f 5e c2 04 00')

    def test_12_person_constructor_and_virtual_allocation_validity_type_dispatch(self):
        for s in SOURCE_HASHES:
            table = struct.unpack('<20I', self.raw[s, '0079C780'])
            self.assertEqual((table[1], table[2], table[9], table[11]), (0x4883f0, 0x488430, 0x67f810, 0x4883d0))
            self.call(s, '00489F10', 0x489f13, 0x47a5d0)
            self.at(s, '00489F10', 0x489f18, 'c7 06 80 c7 79 00 8b c6 5e c3')
            self.assertEqual(self.raw[s, '0047A5D0'], bytes.fromhex('8b c1 c7 00 48 b7 79 00 c3'))
            self.assertEqual(self.raw[s, '0067F810'], bytes.fromhex('b8 0a 00 00 00 c3'))
            self.at(s, '004883D0', 0x4883d4, '83 f8 1a 74 0a 83 f8 0a 74 05')
            self.at(s, '004883D0', 0x4883de, '33 c0 c2 04 00 b8 01 00 00 00 c2 04 00')

    def test_13_person_validity_raw17c_and_signed_status_live_reads(self):
        for s in SOURCE_HASHES:
            self.at(s, '004883F0', 0x4883f3, '8b 06 6a 0a ff 50 2c 85 c0 74 19')
            self.at(s, '004883F0', 0x4883fe, '8b 86 7c 01 00 00 85 c0 75 13')
            self.at(s, '004883F0', 0x488408, '8b b6 a0 00 00 00 85 f6 7c 05 83 fe 08 7e 04')
            self.at(s, '004883F0', 0x488417, '33 c0 5e c3 b8 01 00 00 00 5e c3')
            self.at(s, '00488430', 0x488433, '8b 06 ff 50 04 85 c0 74 21')
            self.at(s, '00488430', 0x48843c, '8b 86 7c 01 00 00 85 c0 75 10')
            self.at(s, '00488430', 0x488446, '8b b6 a0 00 00 00 83 fe 06 74 0c 83 fe 08 74 07')
            self.at(s, '00488430', 0x488456, 'b8 01 00 00 00 5e c3 33 c0 5e c3')

    def test_14_platform_boundary_and_validity_tail_dispatch(self):
        for s in SOURCE_HASHES:
            self.at(s, '0047A630', 0x47a635, '85 f6 74 11 6a 01 6a 04 56')
            self.call(s, '0047A630', 0x47a63e, 0x472070)
            self.at(s, '0047A630', 0x47a646, '85 c0 75 04 33 c0 5e c3 8b 06 8b ce 5e ff 60 08')
            self.at(s, '00472070', 0x472080, 'ff 15 68 e2 74 00')
            self.at(s, '00472070', 0x472094, 'ff 15 6c e2 74 00')
        self.assertIn('platform probe failures', self.e['semantics']['excluded'])
        self.assertIn('troop position virtual+3C', self.e['semantics']['excluded'])
        self.assertIn('mutable fallback06EE794C', self.e['semantics']['excluded'])
        self.assertNotIn('00496030', BODY_HASHES)
        self.assertNotIn('06EE794C', BODY_HASHES)

    def test_15_source_pairs_and_independent_verification_records(self):
        for row in self.e['comparisons']:
            start = row['start']
            a, b = self.raw['S1', start], self.raw['S2', start]
            self.assertEqual(row['identical'], a == b)
            self.assertEqual(row['differingByteCount'], sum(x != y for x, y in zip(a, b)))
            if start == '0079CC80':
                self.assertEqual(row['differingByteCount'], 4)
            else:
                self.assertEqual(a, b)
            for source, value in [('S1', a), ('S2', b)]:
                self.assertEqual(row[source + 'length'], len(value))
                self.assertEqual(row[source + 'sha256'], digest(value))
        self.assertEqual(len(self.e['comparisons']), len(BODY_HASHES) - 1)
        self.assertEqual(self.raw['S2', '00911B50'][-1], 0xc3)
        self.call('S2', '00911B50', 0x911b63, 0x8e8930)
        self.assertEqual(BODY_HASHES['00911B50'][0], '00911B69')
        self.assertEqual({r['file']: r['sha256'] for r in self.e['provenance']['verificationArtifacts']}, VERIFICATION_HASHES)
        for path, expected in VERIFICATION_HASHES.items():
            self.assertEqual(digest((DIRECTORY / path).read_bytes()), expected)
        for s in SOURCE_HASHES:
            recovery = json.loads((DIRECTORY / ('recovery-evidence-' + s + '.json')).read_text())
            self.assertEqual(recovery['sources'], self.e['sources'])
            self.assertEqual(recovery['functionRegions'], {k: v for k, v in self.e['functionRegions'].items() if k.startswith(s + ':')})
            self.assertEqual(recovery['callLedgers'][s], self.e['callLedgers'][s])
            self.assertEqual(recovery['ranges'], [{k: v for k, v in r.items() if k != 'evidenceUse'} for r in self.e['ranges'] if r['source'] == s])
        raw_report = json.loads((DIRECTORY / 'raw-verification.json').read_text())
        self.assertEqual(raw_report['baselineCommit'], HISTORICAL_EXTRACTION_BASELINE)
        self.assertEqual({r['source']: r['idbSha256'] for r in raw_report['rawId1Verification']}, SOURCE_HASHES)
        for flag in ('machineCodeExecuted', 'originalExeExecuted', 'stockOriginalVerified', 'recordedExeHashesIndependentlyVerified'):
            self.assertIs(raw_report[flag], False)

    def test_16_no_production_import_or_machine_code_execution(self):
        tree = ast.parse(Path(__file__).read_text())
        imports = []
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                imports.extend(alias.name.split('.')[0] for alias in node.names)
            elif isinstance(node, ast.ImportFrom):
                imports.append((node.module or '').split('.')[0])
        self.assertTrue(set(imports) <= {'argparse', 'ast', 'io', 'json', 'pathlib', 'struct', 'sys', 'unittest', 'check_native_tail_distance_source', 'check_live_zero_refund_source', 'check_officer_relocation_source'})
        for name in ('native_troop_membership_profile', 'native_troop_membership_frame', 'native_troop_membership_primitives', 'native_tail_distance_profile'):
            self.assertNotIn(name, sys.modules)


    def test_17_production_ast_retains_live_reads_and_unknown_vtable_boundary(self):
        # Inspect syntax only; production code is never imported or run here.
        tree = ast.parse((ROOT / 'scripts/native_troop_membership_primitives.py').read_text())
        funcs = {n.name: n for n in ast.walk(tree) if isinstance(n, ast.FunctionDef)}
        validity = ast.unparse(funcs['native_troop_valid'])
        membership = ast.unparse(funcs['troop_member'])
        self.assertIn("leader = self.slot('troops', tid)['leaderId']", validity)
        self.assertIn('person_predicates(person)[1]', validity)
        self.assertIn('for index in range(2):', validity)
        self.assertIn("value = self.slot('troops', tid)['deputyIds'][index]", validity)
        self.assertIn('passed = value < 1100', validity)
        self.assertNotIn("person['valid']", validity)
        self.assertIn("location = self.slot('persons', pid)['locationId']", membership)
        self.assertIn('bounded = 87 <= location <= 1086', membership)
        self.assertIn("troop['vtableAddress'] != CANONICAL_TROOP_VTABLE", membership)
        self.assertIn("super().boundary('query', '004891C0'", membership)
        self.assertIn("leader = self.slot('troops', tid)['leaderId']", membership)
        self.assertIn("deputy = self.slot('troops', tid)['deputyIds'][index]", membership)
        frame = ast.parse((ROOT / 'scripts/native_troop_membership_frame.py').read_text())
        keys = next(n.value for n in frame.body if isinstance(n, ast.Assign) and any(isinstance(t, ast.Name) and t.id == 'TROOP_KEYS' for t in n.targets))
        self.assertEqual(ast.literal_eval(keys), {'id', 'vtableAddress', 'leaderId', 'deputyIds'})
        self.assertNotIn('position', ast.unparse(keys))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--idb-s1', type=Path)
    parser.add_argument('--idb-s2', type=Path)
    parser.add_argument('--report', type=Path)
    args = parser.parse_args()
    result = unittest.TextTestRunner(verbosity=2).run(unittest.defaultTestLoader.loadTestsFromTestCase(NativeTroopMembershipSource))
    if not result.wasSuccessful():
        return 1
    e, raw, ins, prior, selected = load_evidence()
    verified = []
    for source, path in (('S1', args.idb_s1), ('S2', args.idb_s2)):
        if path is not None:
            verify_raw_id1(path, source, selected)
            verified.append(dict(source=source, idbSha256=SOURCE_HASHES[source], intervals=sum(k[0] == source for k in selected),
                selectedIntervalBytes=sum(len(b) for k, b in selected.items() if k[0] == source)))
    report = dict(checker=Path(__file__).name, sourceProfile=e['profileId'], baselineCommit=BASELINE,
        sourceTests=result.testsRun, inheritedSourceTests=12, nestedInheritedSourceTests=13,
        sourceTestsPassed=True, rangeBudget=BUDGET, rawId1Verification=verified,
        machineCodeExecuted=False, originalExeExecuted=False, stockOriginalVerified=False,
        recordedExeHashesIndependentlyVerified=False, rawRuntimeMapCaptured=False,
        commonTroopVtableSlots=26, sourceSpecificS2TrailingWordPreserved=True, completeValidityFailureEpilogue=True, deputySignedUpperBoundOnly=True)
    if args.report:
        args.report.write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps(report, sort_keys=True))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
