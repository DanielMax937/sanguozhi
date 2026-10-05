"""Independent dual-IDB native00489610 live-position source verification.

Only stdlib and frozen independent source checkers are imported. No production
model or original executable is executed. Optional IDBs verify full hashes and
all inherited/new raw ID1 intervals. Disassembly recovery is pinned separately.
"""
import argparse
import ast
import io
import json
from pathlib import Path
import struct
import sys
import unittest

from check_native_troop_membership_source import NativeTroopMembershipSource, load_evidence as load_prior
from check_live_zero_refund_source import branches
from check_officer_relocation_source import SOURCE_HASHES, digest, read_rows, verify_calls, verify_raw_id1

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / 'docs/sources/native_live_position.json'
DIRECTORY = MANIFEST.with_suffix('')
BASELINE = '8a47624d5923b447597c9fab18dc1e84fa1eade4'
HISTORICAL_EXTRACTION_BASELINE = '8a0860b29e3cfac6266adcbdd9d6cc6505744c83'
PINS = {'docs/sources/native_troop_membership.json': 'b6814232ea9fbb1675322994556a9620b2ec864ee54738abec739bfdcc1ca29e', 'scripts/check_native_troop_membership_source.py': '4a772f10d50229948683e9500efeaf18eb99e40c832fd62991073b08acd6567f', 'scripts/native_troop_membership_profile.py': 'b1b9e7e3b5a796468b235be0d7f621b54ac61137b245551702d1471de074ae5b', 'scripts/native_troop_membership_frame.py': '3e0c9f4b7207c2f6b078e7a074b024f19675be85eaff3898da3b1e56888d6c5e', 'scripts/native_troop_membership_primitives.py': 'cc8be8d9d6d4d586824e8b71385822db98ddda9af1803fb34f362e9c7faf7a06', 'scripts/check_native_troop_membership_profile.py': '4ce8cf358e22250210b480f77218538ab0beec4757949463208851653b5944c9', 'scripts/officer_relocation_primitives.py': 'f0787cd4f58a47ed83806d851ab8c52fce08817354cee9255c9ad124cd47cc51', 'scripts/recursive_return_frame.py': 'cd1f7cd1fbe3940987426c3f704bb56e6232ebd1d0c1e91d62ee9a70a5142810', 'scripts/officer_relocation_tables.py': 'be00dd195a64d5782e25fb17d89cb1784ed8f97b9c7245c80ce85fe49fc0872f'}
BODY_HASHES = {'0041C130': ['0041C135', {'S1': '81794790c0ad77391e995d91903df71d532fdf23777b0a32cef0c4606e844a6f', 'S2': '81794790c0ad77391e995d91903df71d532fdf23777b0a32cef0c4606e844a6f'}], '00468E60': ['00468E66', {'S1': '5df10ed21e27c6f4dcad30a3050f43ccebae8ffa69612802165a96b9efeefddb', 'S2': '5df10ed21e27c6f4dcad30a3050f43ccebae8ffa69612802165a96b9efeefddb'}], '00472070': ['004720AB', {'S1': 'ba76fa401ab64a66e9ee58fd742a90a8aed891eb0815679089dcb0521e09c536', 'S2': 'ba76fa401ab64a66e9ee58fd742a90a8aed891eb0815679089dcb0521e09c536'}], '0047A5D0': ['0047A5D9', {'S1': '336e6d1ac6f11f67df7db7d5f89a438c5a41aa1673b4e071afda2050a291f656', 'S2': '336e6d1ac6f11f67df7db7d5f89a438c5a41aa1673b4e071afda2050a291f656'}], '0047A630': ['0047A656', {'S1': '39414d5052e472ece3b8b80f46b47178be3331aed847fafc4ebd4028aedebe1d', 'S2': '39414d5052e472ece3b8b80f46b47178be3331aed847fafc4ebd4028aedebe1d'}], '0047A950': ['0047A9AB', {'S1': '974e85528388589df23cda1314ca9992cd4e3be4c837a541e04452c0fff18108', 'S2': '974e85528388589df23cda1314ca9992cd4e3be4c837a541e04452c0fff18108'}], '0047AA80': ['0047AA90', {'S1': '9a2bb180f23db262c8ced963c3328bd2d09e74d4690e53d97b55b240a525dcf3', 'S2': '9a2bb180f23db262c8ced963c3328bd2d09e74d4690e53d97b55b240a525dcf3'}], '00483B00': ['00483B1E', {'S1': 'a5a4e3333b75a6d64582c4998ec5f87d3e2f929616a094182bdce39a99b4b412', 'S2': 'a5a4e3333b75a6d64582c4998ec5f87d3e2f929616a094182bdce39a99b4b412'}], '00486400': ['00486424', {'S1': 'c5f03d3151997a9c57011d7fec3a0e7a61a5f1989a4d5eba46a468965527e2d7', 'S2': 'c5f03d3151997a9c57011d7fec3a0e7a61a5f1989a4d5eba46a468965527e2d7'}], '00487DC0': ['00487DC4', {'S1': 'a97a61afc73231cb78bb2c78600f652c4d2d996c15d963c8764c5c055bf114d1', 'S2': 'a97a61afc73231cb78bb2c78600f652c4d2d996c15d963c8764c5c055bf114d1'}], '004880A0': ['004880B8', {'S1': '672200b358bfbf28d0eca996b11adc2250ddb5de243887c13c6b8242c07ae09d', 'S2': '672200b358bfbf28d0eca996b11adc2250ddb5de243887c13c6b8242c07ae09d'}], '004883D0': ['004883EB', {'S1': 'c7dd95b24263a58b616df7adf489d1f07f502af3168d73d09da287ca65ca10c3', 'S2': 'c7dd95b24263a58b616df7adf489d1f07f502af3168d73d09da287ca65ca10c3'}], '004883F0': ['00488422', {'S1': '1a09de9f631ef197445be47b0d0886b4b49e942d128bd27ed615a38f5290a088', 'S2': '1a09de9f631ef197445be47b0d0886b4b49e942d128bd27ed615a38f5290a088'}], '00488430': ['00488461', {'S1': '7491f2b7b02c21e417945fbd0ee295ad3c5d2c24a99a159e443f306d0acb7f1f', 'S2': '7491f2b7b02c21e417945fbd0ee295ad3c5d2c24a99a159e443f306d0acb7f1f'}], '00489610': ['0048968A', {'S1': 'd2213aa3397f098ba26d3af5566126c69e3aadbe58de881e90fdd08ea289a497', 'S2': 'd2213aa3397f098ba26d3af5566126c69e3aadbe58de881e90fdd08ea289a497'}], '00489F10': ['00489F22', {'S1': 'c9dfadf9bea7a72ed7f905c625e17ccb73ae47616ed799e24fccf78dc8697164', 'S2': 'c9dfadf9bea7a72ed7f905c625e17ccb73ae47616ed799e24fccf78dc8697164'}], '00490B00': ['00490B24', {'S1': '2cb3b51ef504a63e94a8fde3c94d5f9f80fb72d88b0df61f41d2608da575736c', 'S2': '2cb3b51ef504a63e94a8fde3c94d5f9f80fb72d88b0df61f41d2608da575736c'}], '00490D00': ['00490D21', {'S1': '534216ae648797120a1ced66decc784947f7a05b4b23b844d303c16ea5c6091a', 'S2': '534216ae648797120a1ced66decc784947f7a05b4b23b844d303c16ea5c6091a'}], '00490E70': ['00490E94', {'S1': '69dce2910ef46501efb42c693e70432a5d30e9156664c3ae48fb55303d72a1be', 'S2': '69dce2910ef46501efb42c693e70432a5d30e9156664c3ae48fb55303d72a1be'}], '00496030': ['00496034', {'S1': '7c5a62b9fc7d2511344d53723148f1cbcc38548931bd247f5f671657e168c9dd', 'S2': '7c5a62b9fc7d2511344d53723148f1cbcc38548931bd247f5f671657e168c9dd'}], '00496040': ['00496095', {'S1': '53b3259ab3c5ad65284858ebbb9f4964efe9f9326b7086ffcc88bac821e9ab55', 'S2': '53b3259ab3c5ad65284858ebbb9f4964efe9f9326b7086ffcc88bac821e9ab55'}], '00496D90': ['00496DA2', {'S1': '04fc43ea99ccb0bfbb25c4dfc4b2843bc5d1464f9b50d2c2fae1b5dd3a327b7a', 'S2': '04fc43ea99ccb0bfbb25c4dfc4b2843bc5d1464f9b50d2c2fae1b5dd3a327b7a'}], '004A6340': ['004A637F', {'S1': '6e6194904d069ac0941fcaa8866a99b23b31d4a52f7284a9534692918d590ffe', 'S2': '6e6194904d069ac0941fcaa8866a99b23b31d4a52f7284a9534692918d590ffe'}], '00573470': ['00573476', {'S1': '21faa16607cb70438711aab3fa582829af50aa15d5946524996fc7aa8a8e4e6d', 'S2': '21faa16607cb70438711aab3fa582829af50aa15d5946524996fc7aa8a8e4e6d'}], '0067F810': ['0067F816', {'S1': '07297dca94be1b975a5dc696b5976f205b84057995fa3d3fbb157101b1ae8098', 'S2': '07297dca94be1b975a5dc696b5976f205b84057995fa3d3fbb157101b1ae8098'}], '0073BE10': ['0073BE1B', {'S1': 'a196e463a5a15be8d29907f3e90113fa1090c74c910050d107059266e4e6b239', 'S2': 'a196e463a5a15be8d29907f3e90113fa1090c74c910050d107059266e4e6b239'}], '0079C1D0': ['0079C1D4', {'S1': 'ad95131bc0b799c0b1af477fb14fcf26a6a9f76079e48bf090acb7e8367bfd0e', 'S2': 'ad95131bc0b799c0b1af477fb14fcf26a6a9f76079e48bf090acb7e8367bfd0e'}], '0079C358': ['0079C558', {'S1': '1baebecf5fe9802f84a50368e9602469796cba9a1a9b1b0f2bfe82d85dad6fac', 'S2': '1baebecf5fe9802f84a50368e9602469796cba9a1a9b1b0f2bfe82d85dad6fac'}], '0079C718': ['0079C774', {'S1': '93644003052b306a2543d1e4cd26359f5e743ec4450b0b0d59742f7f4ecaffec', 'S2': '93644003052b306a2543d1e4cd26359f5e743ec4450b0b0d59742f7f4ecaffec'}], '0079C780': ['0079C7D0', {'S1': '31b9e76589f399ca3b91451fd4948da9672865716e98c45b3780817468b3021c', 'S2': '31b9e76589f399ca3b91451fd4948da9672865716e98c45b3780817468b3021c'}], '0079CC18': ['0079CC80', {'S1': 'efa4fcf33c37aa292173d640d6f873f32332c2ca46406423eb39de04ed3c75ff', 'S2': 'efa4fcf33c37aa292173d640d6f873f32332c2ca46406423eb39de04ed3c75ff'}], '06EE794C': ['06EE7950', {'S1': 'df3f619804a92fdb4057192dc43dd748ea778adc52bc498ce80524c014b81119', 'S2': 'ad95131bc0b799c0b1af477fb14fcf26a6a9f76079e48bf090acb7e8367bfd0e'}]}
VERIFICATION_HASHES = {'raw-verification.json': '25a34b4f762b3c908a7dd41f96ebdb702279d2531bcc593962654e426117e778', 'recovery-evidence-S1.json': '22e0927560594c16ef9894c3f209b080d8391c72f5906483d40e06a87bf375a1', 'recovery-evidence-S2.json': 'd8dd05e2a71d2f3453d16ab50d0b0e1f69cd1dfc7252b63d4a2c1073be0b5c2f'}
BUDGET = {'focusedIntervals': 64, 'reusedExactInheritedIntervals': 58, 'newUniqueIntervals': 6, 'codeIntervals': 52, 'completeIDBFunctionIntervals': 51, 'boundedStoreReturnIntervals': 1, 'dataIntervals': 12, 'selectedBytesBothSources': 3356, 'instructions': 674, 'callSites': 40, 'branchSites': 102, 'inheritedSelectedIntervals': 1257, 'allSelectedIntervals': 1263, 'newMachineCodeBytesRecovered': 30}

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
    image = {}
    for (source, start, end), value in selected.items():
        for offset, byte in enumerate(value):
            key = source, int(start, 16) + offset
            assert key not in image or image[key] == byte, key
            image[key] = byte
    return e, raw, ins, prior, selected


def signed_word(word):
    return struct.unpack('<h', struct.pack('<H', word & 65535))[0]


def packed_position(word):
    """Independent scalar interpretation of0047A956/5D/60, not model code."""
    return signed_word(word), signed_word(word >> 16)


def signed_neg(value):
    return struct.unpack('<i', struct.pack('<I', (-value) & 0xffffffff))[0]


class NativeLivePositionSource(unittest.TestCase):
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
        self.assertEqual(self.e['profileId'], 'source-idb-S1-S2-native-live-position-v1')
        self.assertEqual(self.e['frameProfileId'], 'source-idb-S1-S2-native-live-position-frame-v1')
        self.assertEqual(self.e['baselineCommit'], BASELINE)
        self.assertEqual(self.e['sources'], self.prior[0]['sources'])
        self.assertEqual({r['source']: r['idbSha256'] for r in self.e['sources']}, SOURCE_HASHES)
        self.assertTrue(all('血色' in r['recordedInputPath'] for r in self.e['sources']))
        self.assertEqual(self.e['adoption'], {'PC-PK1.1': 'compatibility-reconstruction', 'PC-Vanilla-assumed': 'compatibility-assumption', 'PS2-Wii': 'open'})
        for flag in ('stockOriginalVerified', 'originalExeExecuted', 'recordedExeHashesIndependentlyVerified', 'rawRuntimeMapCaptured'):
            self.assertIs(self.e[flag], False)

    def test_02_all_frozen_prior_source_closure(self):
        result = unittest.TextTestRunner(stream=io.StringIO()).run(
            unittest.defaultTestLoader.loadTestsFromTestCase(NativeTroopMembershipSource))
        self.assertTrue(result.wasSuccessful(), (result.failures, result.errors))
        self.assertEqual(result.testsRun, 17)
        self.assertEqual(len(self.prior[4]), 1257)
        self.assertEqual(len(self.selected), BUDGET['allSelectedIntervals'])

    def test_03_exact_body_pins_and_interval_budget(self):
        self.assertEqual(set(self.raw), {(s, a) for a, (_, hashes) in BODY_HASHES.items() for s in hashes})
        for row in self.e['ranges']:
            end, hashes = BODY_HASHES[row['start']]
            self.assertEqual(row['endExclusive'], end)
            self.assertEqual(digest(self.raw[row['source'], row['start']]), hashes[row['source']])
            self.assertEqual(row['rawId1Sha256'], hashes[row['source']])
            if row['kind'] == 'code':
                self.assertEqual(row['ownerFunction'], row['start'])
                if (row['source'], row['start']) == ('S1', '0073BE10'):
                    self.assertEqual(row['boundaryKind'], 'bounded-store-return-block-ID0-function-absent')
                    self.assertNotIn('S1:0073BE10', self.e['functionRegions'])
                else:
                    self.assertEqual(row['boundaryKind'], 'complete-IDB-function')
                    self.assertEqual(self.e['functionRegions'][row['source'] + ':' + row['start']],
                        [dict(start=row['start'], endExclusive=end)])
        self.assertEqual(self.e['rangeBudget'], BUDGET)
        self.assertEqual(len(self.raw), BUDGET['focusedIntervals'])
        self.assertEqual(sum(map(len, self.raw.values())), BUDGET['selectedBytesBothSources'])
        code = [r for r in self.e['ranges'] if r['kind'] == 'code']
        self.assertEqual(len(code), BUDGET['codeIntervals'])
        self.assertEqual(sum(len(self.ins[r['source'], r['start']]) for r in code), BUDGET['instructions'])
        self.assertEqual(sum(r['boundaryKind'] == 'complete-IDB-function' for r in code), BUDGET['completeIDBFunctionIntervals'])
        self.assertEqual(sum(r['boundaryKind'] == 'bounded-store-return-block-ID0-function-absent' for r in code), BUDGET['boundedStoreReturnIntervals'])
        self.assertEqual(sum(r['evidenceUse'] == 'new-unique-interval' for r in self.e['ranges']), BUDGET['newUniqueIntervals'])
        self.assertEqual(sum(r['evidenceUse'] == 'reused-exact-inherited-interval' for r in self.e['ranges']), BUDGET['reusedExactInheritedIntervals'])
        old_bytes = {(s, int(a, 16) + i) for s, a, z in self.prior[4] for i in range(int(z, 16) - int(a, 16))}
        new_code = {(r['source'], int(r['start'], 16) + i) for r in code for i in range(len(self.raw[r['source'], r['start']]))} - old_bytes
        self.assertEqual(len(new_code), BUDGET['newMachineCodeBytesRecovered'])

    def test_04_all_call_and_branch_ledgers(self):
        calls = jumps = 0
        for row in self.e['ranges']:
            source, start = row['source'], row['start']
            ledger = self.e['callLedgers'][source][start]
            if row['kind'] == 'data':
                self.assertEqual(ledger, [])
                continue
            calls += verify_calls(self.ins[source, start], ledger)
            expected = branches(self.ins[source, start])
            self.assertEqual(self.e['branchLedgers'][source][start], expected)
            jumps += len(expected)
            for branch in expected:
                target = int(branch['target'], 16)
                self.assertTrue(int(start, 16) <= target < int(row['endExclusive'], 16), branch)
        self.assertEqual(calls, BUDGET['callSites'])
        self.assertEqual(jumps, BUDGET['branchSites'])

    def test_05_person_vtable_constructor_and_position_slot(self):
        for s in SOURCE_HASHES:
            table = struct.unpack('<20I', self.raw[s, '0079C780'])
            self.assertEqual((table[1], table[2], table[9], table[11], table[15]),
                             (0x4883f0, 0x488430, 0x67f810, 0x4883d0, 0x489610))
            self.call(s, '00489F10', 0x489f13, 0x47a5d0)
            self.at(s, '00489F10', 0x489f18, 'c7 06 80 c7 79 00 8b c6 5e c3')

    def test_06_complete_position_path_saved_location_and_base_gate(self):
        for s in SOURCE_HASHES:
            self.assertEqual(len(self.raw[s, '00489610']), 122)
            self.at(s, '00489610', 0x489610, '56 8b b1 9c 00 00 00 85 f6 57 7c 09 83 fe 56 7f 04 8b c6 eb 03 83 c8 ff')
            self.assertEqual(self.raw[s, '00489610'].count(bytes.fromhex('9c 00 00 00')), 1)
            self.at(s, '00489610', 0x489628, '50 b9 58 19 20 07')
            self.call(s, '00489610', 0x48962e, 0x490d00)
            self.at(s, '00489610', 0x489633, '8b f8 57')
            self.call(s, '00489610', 0x489636, 0x47a630)
            self.at(s, '00489610', 0x48963b, '83 c4 04 85 c0 74 09')
            self.assertEqual([c['target'] for c in self.e['callLedgers'][s]['00489610']],
                             ['00490D00', '0047A630', '00490E70', '0047A630'])

    def test_07_saved_troop_location_gate_and_getter_identity(self):
        for s in SOURCE_HASHES:
            self.at(s, '00489610', 0x48964b, '83 fe 57 7c 0d 81 fe 3e 04 00 00 7f 05 8d 46 a9 eb 03 83 c8 ff')
            self.at(s, '00489610', 0x489660, '50 b9 58 19 20 07')
            self.call(s, '00489610', 0x489666, 0x490e70)
            self.at(s, '00489610', 0x48966b, '8b f0 56')
            self.call(s, '00489610', 0x48966e, 0x47a630)
            self.assertEqual(self.raw[s, '00490D00'], bytes.fromhex(
                '8b44240485c07c143dff3f00007f0d6bc0388d840830970800c2040033c0c20400'))
            self.assertEqual(self.raw[s, '00490E70'], bytes.fromhex(
                '8b44240485c07c173de70300007f1069c0f40000008d840830971600c2040033c0c20400'))
        for location, expected in ((-2**31, None), (-1, None), (0, None), (86, None),
                                   (87, 0), (88, 1), (1086, 999), (1087, None), (2**31-1, None)):
            self.assertEqual(location - 87 if 87 <= location <= 1086 else None, expected)

    def test_08_current_vtable_tail_dispatches_do_not_load_coordinates(self):
        for s in SOURCE_HASHES:
            self.at(s, '00489610', 0x489642, '8b 07 8b cf 5f 5e ff 60 3c')
            self.at(s, '00489610', 0x489673, '83 c4 04 85 c0 5f 74 08 8b 16 8b ce 5e ff 62 3c')
            self.assertEqual(self.raw[s, '00487DC0'], bytes.fromhex('8d 41 1e c3'))
            self.assertEqual(self.raw[s, '00496030'], bytes.fromhex('8d 41 3c c3'))
            self.assertEqual(self.e['callLedgers'][s]['00487DC0'], [])
            self.assertEqual(self.e['callLedgers'][s]['00496030'], [])
        self.assertEqual(self.e['semantics']['baseVtable']['positionByteOffset'], 0x1e)
        self.assertEqual(self.e['semantics']['troopVtable']['positionByteOffset'], 0x3c)

    def test_09_base_vtable_constructor_and_native_validity(self):
        for s in SOURCE_HASHES:
            table = struct.unpack('<23I', self.raw[s, '0079C718'])
            self.assertEqual((table[1], table[2], table[9], table[15]),
                             (0x41c130, 0x486400, 0x573470, 0x487dc0))
            self.call(s, '004880A0', 0x4880a3, 0x47aa80)
            self.at(s, '004880A0', 0x4880a8, 'c7 06 18 c7 79 00 66 c7 46 22 ff ff 8b c6 5e c3')
            self.assertEqual(self.raw[s, '00573470'], bytes.fromhex('b8 05 00 00 00 c3'))
            self.assertEqual(self.raw[s, '00486400'], bytes.fromhex(
                '56 8b f1 8b 06 ff 50 24 83 f8 05 75 13 8b 46 08 85 c0 7c 0c 83 f8 3f 7f 07 b8 01 00 00 00 5e c3 33 c0 5e c3'))

    def test_10_troop_vtable_constructor_validity_and_no_membership_check(self):
        for s in SOURCE_HASHES:
            table = struct.unpack('<26I', self.raw[s, '0079CC18'])
            self.assertEqual((table[1], table[2], table[9], table[15]),
                             (0x41c130, 0x496040, 0x468e60, 0x496030))
            self.call(s, '00496D90', 0x496d93, 0x47aa80)
            self.at(s, '00496D90', 0x496d98, 'c7 06 18 cc 79 00 8b c6 5e c3')
            self.assertEqual(self.raw[s, '00468E60'], bytes.fromhex('b8 0b 00 00 00 c3'))
            self.at(s, '00496040', 0x496043, '8b 06 ff 50 24 83 f8 0b 75 44')
            self.at(s, '00496040', 0x49604d, '8b 46 0c 50 b9 58 19 20 07')
            self.call(s, '00496040', 0x496056, 0x490b00)
            self.call(s, '00496040', 0x49605c, 0x47a630)
            self.at(s, '00496040', 0x496070, '85 c0 7c 0d 83 f8 02 7d 08 81 39 4c 04 00 00 7d 10')
            self.at(s, '00496040', 0x496081, '40 83 c1 04 83 f8 02 7c e6')
            self.at(s, '00496040', 0x49608a, 'b8 01 00 00 00 5e c3 33 c0 5e c3')
            #00489610 never calls membership004891C0 or00495390.
            self.assertFalse({'004891C0', '00495390'} & {c.get('target') for c in self.e['callLedgers'][s]['00489610']})

    def test_11_person_live_validity_chain_and_platform_boundary(self):
        for s in SOURCE_HASHES:
            self.at(s, '004883F0', 0x4883f3, '8b 06 6a 0a ff 50 2c 85 c0 74 19')
            self.at(s, '004883F0', 0x4883fe, '8b 86 7c 01 00 00 85 c0 75 13')
            self.at(s, '004883F0', 0x488408, '8b b6 a0 00 00 00 85 f6 7c 05 83 fe 08 7e 04')
            self.at(s, '00488430', 0x488433, '8b 06 ff 50 04 85 c0 74 21')
            self.at(s, '00488430', 0x48843c, '8b 86 7c 01 00 00 85 c0 75 10')
            self.at(s, '00488430', 0x488446, '8b b6 a0 00 00 00 83 fe 06 74 0c 83 fe 08 74 07')
            self.at(s, '0047A630', 0x47a635, '85 f6 74 11 6a 01 6a 04 56')
            self.call(s, '0047A630', 0x47a63e, 0x472070)
            self.at(s, '0047A630', 0x47a646, '85 c0 75 04 33 c0 5e c3 8b 06 8b ce 5e ff 60 08')
            self.assertEqual([r['bytes'] for r in self.e['callLedgers'][s]['00472070']],
                             ['ff 15 68 e2 74 00', 'ff 15 6c e2 74 00'])

    def test_12_fallback_is_address_not_snapshot_default(self):
        for s in SOURCE_HASHES:
            self.at(s, '00489610', 0x489683, 'b8 4c 79 ee 06 5e c3')
        self.assertEqual(self.raw['S1', '06EE794C'], b'\0' * 4)
        self.assertEqual(self.raw['S2', '06EE794C'], b'\xff' * 4)
        fallback = self.e['semantics']['fallback']
        self.assertEqual(fallback['address'], '06EE794C')
        self.assertEqual(fallback['bytes'], 4)
        self.assertTrue(fallback['mutable'])
        self.assertTrue(fallback['requiredExplicitFrameStorage'])
        self.assertIsNone(fallback['canonicalDefault'])
        self.assertEqual(fallback['idbSnapshots'], {'S1': '00000000', 'S2': 'FFFFFFFF'})

    def test_13_mutable_store_block_preserves_source_boundary_difference(self):
        for s in SOURCE_HASHES:
            self.assertEqual(self.raw[s, '0073BE10'], bytes.fromhex('a1 d0 c1 79 00 a3 4c 79 ee 06 c3'))
            self.assertEqual(self.raw[s, '0079C1D0'], b'\xff' * 4)
            self.assertEqual(self.e['callLedgers'][s]['0073BE10'], [])
            self.assertEqual(self.e['branchLedgers'][s]['0073BE10'], [])
        self.assertNotIn('S1:0073BE10', self.e['functionRegions'])
        self.assertEqual(self.e['functionRegions']['S2:0073BE10'],
                         [dict(start='0073BE10', endExclusive='0073BE1B')])
        self.assertIn('fallback initialization or reset scheduling', self.e['semantics']['excluded'])

    def test_14_position_caller_single_packed_read_then_signed_words(self):
        for s in SOURCE_HASHES:
            self.at(s, '0047A950', 0x47a950, '51 8b 01 ff 50 3c 8b 00 8b c8 89 04 24 0f bf c0 c1 f9 10')
            self.assertEqual(self.raw[s, '0047A950'].count(bytes.fromhex('8b 00')), 1)
            self.assertEqual(self.e['callLedgers'][s]['0047A950'][0],
                             dict(site='0047A953', bytes='ff 50 3c', kind='indirect', operand='dword ptr [eax + 0x3c]'))
        for x in (-32768, -1, 0, 1, 199, 200, 32767):
            for y in (-32768, -1, 0, 1, 199, 200, 32767):
                packed = (x & 65535) | ((y & 65535) << 16)
                self.assertEqual(packed_position(packed), (x, y))

    def test_15_coordinate_guards_precede_map_read(self):
        for s in SOURCE_HASHES:
            self.at(s, '0047A950', 0x47a963, '85 c0 7c 3f 3d c8 00 00 00 7d 38 85 c9 7c 34 81 f9 c8 00 00 00 7d 2c')
            self.at(s, '0047A950', 0x47a97a, '69 c0 c8 00 00 00 03 c1 8d 0c 80 8b 14 8d 6c 0e fb 06 c1 ea 05 83 e2 7f')
            self.at(s, '0047A950', 0x47a992, '6a 01 52')
            self.call(s, '0047A950', 0x47a995, 0x483b00)
            self.at(s, '0047A950', 0x47a99a, '83 c4 08 85 c0 7c 05 83 f8 57 7c 03 83 c8 ff 59 c3')
        self.assertEqual(200 * 199 + 199, 39999)
        self.assertEqual(0x06fb0e6c + 20 * 39999, 0x07074358)
        for raw in (0, 31, 32, 127 << 5, 0xffffffff, 0x80000000):
            self.assertEqual((raw >> 5) & 127, (raw & 0xfe0) // 32)

    def test_16_source_selected_signed_dword_map_and_negation(self):
        tree = ast.parse((ROOT / 'scripts/officer_relocation_tables.py').read_text())
        values = next(ast.literal_eval(n.value) for n in tree.body if isinstance(n, ast.Assign))
        for s in SOURCE_HASHES:
            table = struct.unpack('<128i', self.raw[s, '0079C358'])
            self.assertEqual(values[s], tuple(table))
            self.assertEqual(self.raw[s, '00483B00'], bytes.fromhex(
                '8b4424048b048558c3790085c07d0e8b4c240885c97403f7d8c383c8ffc3'))
            self.assertEqual(table[:42], tuple(range(42)))
            for index, entry in enumerate(table):
                native = signed_neg(entry) if entry < 0 else entry
                # All current source entries happen to be in representable range.
                self.assertEqual(native, abs(entry), (s, index))
        self.assertEqual(self.raw['S1', '0079C358'], self.raw['S2', '0079C358'])
        self.assertEqual(signed_neg(-2**31), -2**31)
        self.assertEqual(signed_neg(-1), 1)
        self.assertEqual(signed_neg(0), 0)

    def test_17_movement_origin_base_fast_path_omits_base_validation(self):
        for s in SOURCE_HASHES:
            self.call(s, '004A6340', 0x4a634a, 0x47a630)
            self.at(s, '004A6340', 0x4a634f, '83 c4 04 85 c0 74 22 8b 86 9c 00 00 00 85 c0 7c 0c 83 f8 56 7f 07 3d ff 3f 00 00 7e 0e')
            self.call(s, '004A6340', 0x4a636e, 0x47a950)
            self.at(s, '004A6340', 0x4a6373, '5f 5e c2 04 00 8b c7 5f 5e c2 04 00')
            self.assertEqual([c['target'] for c in self.e['callLedgers'][s]['004A6340']],
                             ['0047A630', '0047A950'])

    def test_18_source_pairs_and_independent_recovery_records(self):
        differences = []
        for row in self.e['comparisons']:
            start = row['start']
            a, b = self.raw['S1', start], self.raw['S2', start]
            self.assertEqual(row['identical'], a == b)
            self.assertEqual(row['differingByteCount'], sum(x != y for x, y in zip(a, b)))
            if a != b:
                differences.append(start)
            for source, value in [('S1', a), ('S2', b)]:
                self.assertEqual(row[source + 'length'], len(value))
                self.assertEqual(row[source + 'sha256'], digest(value))
        self.assertEqual(differences, ['06EE794C'])
        self.assertEqual(len(self.e['comparisons']), len(BODY_HASHES))
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

    def test_19_no_production_import_or_machine_code_execution(self):
        tree = ast.parse(Path(__file__).read_text())
        imports = []
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                imports.extend(alias.name.split('.')[0] for alias in node.names)
            elif isinstance(node, ast.ImportFrom):
                imports.append((node.module or '').split('.')[0])
        self.assertTrue(set(imports) <= {'argparse', 'ast', 'io', 'json', 'pathlib', 'struct', 'sys', 'unittest', 'check_native_troop_membership_source', 'check_live_zero_refund_source', 'check_officer_relocation_source'})
        for name in ('native_live_position_profile', 'native_live_position_frame', 'native_live_position_primitives',
                     'native_troop_membership_profile', 'native_troop_membership_frame', 'native_troop_membership_primitives'):
            self.assertNotIn(name, sys.modules)

    def test_20_unknown_dispatch_and_missing_memory_remain_open(self):
        semantics = self.e['semantics']
        self.assertIn('not native-invalid', semantics['unknownDispatch'])
        self.assertIn('effect-query', semantics['unknownDispatch'])
        self.assertIn('Missing reached in-range rows', semantics['pointerDomain'])
        self.assertIn('after any callback', semantics['pointerLifetime'])
        self.assertIn('noncanonical vtable native bodies', semantics['excluded'])
        self.assertIn('unrepresented or unreadable process memory', semantics['excluded'])
        self.assertIn('platform probe failures', semantics['excluded'])
        self.assertIn('S2 virtual+68 tail business or complete vtable extent', semantics['excluded'])


    def test_21_production_ast_preserves_explicit_live_pointer_storage(self):
        # Source-to-model structural guard only. Never imports model modules.
        tree = ast.parse((ROOT / 'scripts/native_live_position_primitives.py').read_text())
        funcs = {n.name: n for n in ast.walk(tree) if isinstance(n, ast.FunctionDef)}
        pointer_text = ast.unparse(funcs['position_pointer'])
        read_text = ast.unparse(funcs['read_position'])
        movement = ast.unparse(funcs['movement_origin'])
        self.assertEqual(pointer_text.count("self.slot('persons', pid)['locationId']"), 1)
        self.assertIn('self.save(savedLocationId=location)', pointer_text)
        self.assertIn("self.boundary('effect-query', '00489610/unknown-troop-virtual'", pointer_text)
        self.assertIn('coordinateWordsRead=False', pointer_text)
        self.assertNotIn("['positionX']", pointer_text)
        self.assertNotIn("['positionY']", pointer_text)
        self.assertIn('self.frame[FALLBACK_KEY]', read_text)
        self.assertIn("self.slot(storage, address['id'])", read_text)
        self.assertIn("self.boundary('query', '0047A956/unrepresented-dword'", read_text)
        self.assertIn('singleDwordRead=True', read_text)
        self.assertLess(movement.index('address = self.position_pointer(pid)'), movement.index('position = self.read_position(address)'))
        self.assertIn('TERRITORY_BASE_TABLES[self.source][territory]', movement)
        self.assertIn("self.slot('mapCells', linear)['rawTerritoryDword']", movement)
        frame = ast.parse((ROOT / 'scripts/native_live_position_frame.py').read_text())
        assignments = {n.targets[0].id: n.value for n in frame.body if isinstance(n, ast.Assign) and isinstance(n.targets[0], ast.Name)}
        self.assertEqual(ast.literal_eval(assignments['POSITION_KEYS']), {'positionX', 'positionY'})
        self.assertEqual(ast.literal_eval(assignments['FALLBACK_KEY']), 'fallbackPosition06EE794C')
        frame_funcs = {n.name: ast.unparse(n) for n in frame.body if isinstance(n, ast.FunctionDef)}
        self.assertIn('validate_position(frame[FALLBACK_KEY])', frame_funcs['validate_frame'])
        self.assertIn('integer(value[key], key, -32768, 32767)', frame_funcs['validate_position'])
        self.assertNotIn('.get(FALLBACK_KEY', ast.unparse(frame))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--idb-s1', type=Path)
    parser.add_argument('--idb-s2', type=Path)
    parser.add_argument('--report', type=Path)
    args = parser.parse_args()
    result = unittest.TextTestRunner(verbosity=2).run(unittest.defaultTestLoader.loadTestsFromTestCase(NativeLivePositionSource))
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
        sourceTests=result.testsRun, inheritedSourceTests=17, nestedInheritedSourceTests=[12, 13],
        sourceTestsPassed=True, rangeBudget=BUDGET, rawId1Verification=verified,
        machineCodeExecuted=False, originalExeExecuted=False, stockOriginalVerified=False,
        recordedExeHashesIndependentlyVerified=False, rawRuntimeMapCaptured=False,
        returnedPointerSeparateFromPackedRead=True, fallbackSnapshotIsNotDefault=True,
        sourceSpecificInitializerBoundaryPreserved=True, signedCoordinateMapAndTableVerified=True)
    if args.report:
        args.report.write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps(report, sort_keys=True))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
