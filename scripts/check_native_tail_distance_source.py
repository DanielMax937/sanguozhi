"""Independent source/AST checks for the bounded005B8400 native distance closure.

Stdlib plus frozen source checkers only. Production modules and target machine
code are never imported/executed. Optional IDBs reverify full fingerprints and
all1,236 inherited raw ID1 intervals, including46 focused inherited/reused intervals (zero new unique intervals).
"""
import argparse
import ast
import io
import json
from pathlib import Path
import struct
import sys
import unittest

from check_generic_facility_source import GenericFacilitySource, load_evidence as load_prior
from check_live_zero_refund_source import branches
from check_officer_relocation_source import SOURCE_HASHES, digest, read_rows, verify_calls, verify_raw_id1

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / 'docs/sources/native_tail_distance.json'
DIRECTORY = MANIFEST.with_suffix('')
BASELINE = '8b21e340d577810ca664e829d1d9cb35b1046fc4'
HISTORICAL_EXTRACTION_BASELINE = '803d6aa6ea8b9af38f96cda892e4cd4278a4d290'
PINS={'docs/sources/generic-facility.json': 'b1244b414dc712ecb71a9d7b56e240bb61eba02fbe038281b995c788dec05df9', 'scripts/check_generic_facility_source.py': '2bee13a5305c54b63a7d02268b5d3798691f4ba81977e72e4cf2e4b4860d10ba', 'scripts/generic_facility_profile.py': '0a91f92d8dd1a23e6bd48a2f395239711d9a6dd83dbd27dd9dbf6b239c917b0d', 'scripts/generic_facility_primitives.py': '7d06405e7c9cc795c8ec09a31799ca0fe051b0e2809e0687a134fca58c77f461', 'scripts/check_generic_facility_profile.py': 'ee764ffcbf5922e70403677510931aaa5bb49ee03a23240875d53c4ba2a851ad', 'scripts/officer_relocation_primitives.py': 'f0787cd4f58a47ed83806d851ab8c52fce08817354cee9255c9ad124cd47cc51', 'scripts/return_route_primitives.py': 'd7a98e0209698c35c6ab6fc69d1ca961bab00965d3ef542f0240b73660a6ecc2', 'scripts/return_route_tables.py': '7569dfb995eaf38c26cbdd69d444c82d3225964a7b2d73e8c69108376cf18352', 'scripts/return_mission_lifecycle_profile.py': '2b2dc7cc74018200a0b02effcf7a748295439f9c3599a566c39290a8b8cb98c6'}
BODY_HASHES={'005B8400': ('005B84E2', {'S1': '72e5086aa0b0a1dd846a1c805df826fd010ca8199f5880d1491e62e74369d6b0', 'S2': '72e5086aa0b0a1dd846a1c805df826fd010ca8199f5880d1491e62e74369d6b0'}), '00490D00': ('00490D21', {'S1': '534216ae648797120a1ced66decc784947f7a05b4b23b844d303c16ea5c6091a', 'S2': '534216ae648797120a1ced66decc784947f7a05b4b23b844d303c16ea5c6091a'}), '0049E4D0': ('0049E4FB', {'S1': 'ceefad36fa02092bcedd902908fbb6309c9bea3d4d16898cb72edda05d683ac1', 'S2': 'ceefad36fa02092bcedd902908fbb6309c9bea3d4d16898cb72edda05d683ac1'}), '0049E450': ('0049E4C4', {'S1': '13b358fb26d20b04b393bc594a40c2b4d4487ed96c26fd6059a9d9659a26d67d', 'S2': '13b358fb26d20b04b393bc594a40c2b4d4487ed96c26fd6059a9d9659a26d67d'}), '0047B480': ('0047B4AA', {'S1': 'cc2baaaec3925264a81eefcf859bdf803023623ad5fbf37e4c9a94920a9c89d7', 'S2': 'cc2baaaec3925264a81eefcf859bdf803023623ad5fbf37e4c9a94920a9c89d7'}), '004839F0': ('004839FC', {'S1': '56b58ce4a05e2ecdfa055b04e499f6a144840249d8e11b28065dfce3bcfee08e', 'S2': '56b58ce4a05e2ecdfa055b04e499f6a144840249d8e11b28065dfce3bcfee08e'}), '00487DC0': ('00487DC4', {'S1': 'a97a61afc73231cb78bb2c78600f652c4d2d996c15d963c8764c5c055bf114d1', 'S2': 'a97a61afc73231cb78bb2c78600f652c4d2d996c15d963c8764c5c055bf114d1'}), '0047A630': ('0047A656', {'S1': '39414d5052e472ece3b8b80f46b47178be3331aed847fafc4ebd4028aedebe1d', 'S2': '39414d5052e472ece3b8b80f46b47178be3331aed847fafc4ebd4028aedebe1d'}), '00472070': ('004720AB', {'S1': 'ba76fa401ab64a66e9ee58fd742a90a8aed891eb0815679089dcb0521e09c536', 'S2': 'ba76fa401ab64a66e9ee58fd742a90a8aed891eb0815679089dcb0521e09c536'}), '00486400': ('00486424', {'S1': 'c5f03d3151997a9c57011d7fec3a0e7a61a5f1989a4d5eba46a468965527e2d7', 'S2': 'c5f03d3151997a9c57011d7fec3a0e7a61a5f1989a4d5eba46a468965527e2d7'}), '00573470': ('00573476', {'S1': '21faa16607cb70438711aab3fa582829af50aa15d5946524996fc7aa8a8e4e6d', 'S2': '21faa16607cb70438711aab3fa582829af50aa15d5946524996fc7aa8a8e4e6d'}), '004A73A0': ('004A740E', {'S1': '6dbbc7827f8a64f9c4f8e90e9ea3691260d5e8d4ca187eb6970e9de2cc26ea56', 'S2': '6dbbc7827f8a64f9c4f8e90e9ea3691260d5e8d4ca187eb6970e9de2cc26ea56'}), '004A5660': ('004A5682', {'S1': 'ab24ca4352b8935daa2ce25929eab3b68318dc802fcd64dcd954195e7f370e72', 'S2': 'ab24ca4352b8935daa2ce25929eab3b68318dc802fcd64dcd954195e7f370e72'}), '0048A8B0': ('0048A8D2', {'S1': '322cb17b9afd835f01b92079ad112eec2a85e9f2786b903433b8ae0b69983cf8', 'S2': '322cb17b9afd835f01b92079ad112eec2a85e9f2786b903433b8ae0b69983cf8'}), '00489BD0': ('00489C0F', {'S1': 'd54e29a33757c8e2870d8b595d3cd1175032b260050a12ada902053cc527c620', 'S2': 'd54e29a33757c8e2870d8b595d3cd1175032b260050a12ada902053cc527c620'}), '004A5600': ('004A5622', {'S1': '469e3a076f2dd39447ed00a439df84539740067d7eb95ae2fecce1b8e7850f81', 'S2': 'ba6c6d920a0fc1aca5619eb56c8b243f55fccd20c985dfb85184f883b0750a60'}), '00489B40': ('00489B6D', {'S1': '65a6bf561c8f4504f006ce811a02a4ddabe23f1cd7959fa72ce8a8f7a4d4ecb5', 'S2': '65a6bf561c8f4504f006ce811a02a4ddabe23f1cd7959fa72ce8a8f7a4d4ecb5'}), '00482F80': ('00482FC0', {'S1': 'a3294bd1f816574db08694971a10cf95a2b40d8877cdda4bf13b622f498aff4c', 'S2': 'a3294bd1f816574db08694971a10cf95a2b40d8877cdda4bf13b622f498aff4c'}), '004A5780': ('004A57A9', {'S1': 'bea4fd2a008efef375f126734b2b798b2f82aaac8a00ccd5dd93034d28f1af55', 'S2': 'bea4fd2a008efef375f126734b2b798b2f82aaac8a00ccd5dd93034d28f1af55'}), '00488C70': ('00488C7F', {'S1': 'a297e2bb914b85540fcb3b06aecdea40aa041a2d6cd13cef5fd2654648f9bd6a', 'S2': 'a297e2bb914b85540fcb3b06aecdea40aa041a2d6cd13cef5fd2654648f9bd6a'}), '0079C718': ('0079C774', {'S1': '93644003052b306a2543d1e4cd26359f5e743ec4450b0b0d59742f7f4ecaffec', 'S2': '93644003052b306a2543d1e4cd26359f5e743ec4450b0b0d59742f7f4ecaffec'}), '0079C2B0': ('0079C330', {'S1': 'd692c5d627bf8182061c550e469f9e0b13e17d483aadbec413ec11491d3f0272', 'S2': 'c43c9e7e16ef2efa065e931224a872a8d97c6463bca829b7aaeb6212c2992d0d'}), '0079B830': ('0079BF14', {'S1': 'deda8ff7828a2c42df89457adcec1b36df55f7ff78337be347e94698dc6b3e8f', 'S2': 'edd622ed95be439d7a5eee27fc429937e5224a1dd0fa296859e95863eee667ff'})}
VERIFICATION_HASHES={'raw-verification.json': '46662aed24bf1c45b688217e768f3d9ecd5628ad5b57dacbe703b4c66bf9be6a', 'disassembly-verification.json': 'f96b756bbbc534162185dbc58294ca033f8ada28ccb3566da064c901822b3fe8'}


def load_evidence():
    e = json.loads(MANIFEST.read_text())
    assert {r['path']: r['sha256'] for r in [e['priorEvidence']] + e['retainedFiles']} == PINS
    for p, h in PINS.items():
        assert digest((ROOT / p).read_bytes()) == h, p
    prior = load_prior()
    selected = dict(prior[4])
    raw, ins = {}, {}
    for row in e['ranges']:
        key = row['source'], row['start']
        assert key not in raw
        origin = ROOT / row['inheritedManifest']
        inherited = json.loads(origin.read_text())
        assert row['inheritedRange'] in inherited.get('ranges', []) + inherited.get('newRanges', [])
        raw[key], ins[key] = read_rows(DIRECTORY, row)
        assert (raw[key], ins[key]) == read_rows(origin.with_suffix(''), row['inheritedRange'])
        assert selected[key + (row['endExclusive'],)] == raw[key]
    return e, raw, ins, prior, selected


class NativeTailDistanceSource(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.e, cls.raw, cls.ins, cls.prior, cls.selected = load_evidence()

    def at(self, source, function, address, hexbytes):
        b = bytes.fromhex(hexbytes)
        off = address - int(function, 16)
        self.assertEqual(self.raw[source, function][off:off + len(b)], b)

    def call(self, source, function, address, target):
        off = address - int(function, 16)
        b = self.raw[source, function][off:off + 5]
        self.assertEqual(b[0], 0xe8)
        self.assertEqual(address + 5 + struct.unpack_from('<i', b, 1)[0], target)

    def test_01_identity_and_frozen_baseline(self):
        self.assertEqual(self.e['profileId'], 'source-idb-S1-S2-native-tail-distance-v1')
        self.assertEqual(self.e['baselineCommit'], BASELINE)
        self.assertEqual(self.e['sources'], self.prior[0]['sources'])
        self.assertEqual({r['source']: r['idbSha256'] for r in self.e['sources']}, SOURCE_HASHES)
        self.assertTrue(all('血色' in r['recordedInputPath'] for r in self.e['sources']))
        self.assertEqual(self.e['adoption'], {'PC-PK1.1': 'compatibility-reconstruction', 'PC-Vanilla-assumed': 'compatibility-assumption', 'PS2-Wii': 'open'})
        for flag in ('stockOriginalVerified', 'originalExeExecuted', 'recordedExeHashesIndependentlyVerified'):
            self.assertIs(self.e[flag], False)

    def test_02_frozen_prior_source_closure(self):
        result = unittest.TextTestRunner(stream=io.StringIO()).run(
            unittest.defaultTestLoader.loadTestsFromTestCase(GenericFacilitySource))
        self.assertTrue(result.wasSuccessful(), (result.failures, result.errors))
        self.assertEqual(result.testsRun, 13)
        self.assertEqual(len(self.selected), 1236)
        self.assertEqual(sum(s == 'S1' for s, _, _ in self.selected), 612)
        self.assertEqual(sum(s == 'S2' for s, _, _ in self.selected), 624)
        for p, h in PINS.items():
            self.assertEqual(digest((ROOT / p).read_bytes()), h)

    def test_03_all_selected_intervals_and_independent_artifacts(self):
        self.assertEqual(set(self.raw), {(s, a) for s in SOURCE_HASHES for a in BODY_HASHES})
        for row in self.e['ranges']:
            a, s = row['start'], row['source']
            z, hashes = BODY_HASHES[a]
            self.assertEqual((row['endExclusive'], row['sha256']), (z, hashes[s]))
            self.assertEqual(len(self.raw[s, a]), int(z, 16) - int(a, 16))
            self.assertEqual(digest(self.raw[s, a]), hashes[s])
        self.assertEqual(self.e['rangeBudget'], dict(intervals=46, codeIntervals=40, dataIntervals=6,
            selectedBytesBothSources=6078, instructions=780, callSites=80, branchSites=72))
        self.assertEqual({r['file']: r['sha256'] for r in self.e['provenance']['verificationArtifacts']}, VERIFICATION_HASHES)
        for f, h in VERIFICATION_HASHES.items():
            self.assertEqual(digest((DIRECTORY / f).read_bytes()), h)
        report = json.loads((DIRECTORY / 'disassembly-verification.json').read_text())
        self.assertEqual((report['codeIntervals'], report['instructions']), (40, 780))
        self.assertTrue(all(r['allBoundariesMatch'] for r in report['checked']))
        self.assertEqual(self.e['provenance']['newMachineCodeBytesRecovered'], 0)
        self.assertIs(self.e['provenance']['rawRuntimeMapCaptured'], False)

    def test_04_complete_calls_branches_and_actual_source_differences(self):
        calls = jumps = 0
        for row in self.e['ranges']:
            s, a = row['source'], row['start']
            if row['kind'] != 'code': continue
            calls += verify_calls(self.ins[s, a], self.e['callLedgers'][s][a])
            ledger = branches(self.ins[s, a])
            self.assertEqual(ledger, self.e['branchLedgers'][s][a])
            jumps += len(ledger)
        self.assertEqual((calls, jumps), (80, 72))
        differences = [a for a in BODY_HASHES if self.raw['S1', a] != self.raw['S2', a]]
        self.assertEqual(set(differences), {'004A5600', '0079C2B0', '0079B830'})
        self.call('S1', '004A5600', 0x4a5619, 0x489b40)
        self.call('S2', '004A5600', 0x4a5619, 0x90cba0)

    def test_05_tail_snapshots_current_and_raw_home_before_native_query(self):
        for s in SOURCE_HASHES:
            self.at(s, '005B8400', 0x5b8405, '8b 86 9c 00 00 00 85 c0 57 7c 05 83 f8 56 7e 03 83 c8 ff 8b be 98 00 00 00 3b c7 74 53')
            self.at(s, '005B8400', 0x5b8422, '53 50 b9 58 19 20 07')
            self.call(s, '005B8400', 0x5b8429, 0x490d00)
            self.at(s, '005B8400', 0x5b842e, '57 b9 58 19 20 07 8b d8')
            self.call(s, '005B8400', 0x5b8436, 0x490d00)
            self.at(s, '005B8400', 0x5b843b, '50 53 b9 cc b3 80 07')
            self.call(s, '005B8400', 0x5b8442, 0x49e4d0)
            # Current was EBX and is the last push, hence argument1. No entry
            # actor-valid call and no home normalization before equality.
            self.assertEqual(self.e['callLedgers'][s]['005B8400'][0]['target'], '00490D00')
            self.assertEqual(self.raw[s, '00490D00'], bytes.fromhex('8b44240485c07c143dff3f00007f0d6bc0388d840830970800c2040033c0c20400'))

    def test_06_distance_argument_order_and_saved_first_territory(self):
        for s in SOURCE_HASHES:
            self.at(s, '0049E4D0', 0x49e4d0, '8b 44 24 04 56 57 50 8b f1')
            self.call(s, '0049E4D0', 0x49e4d9, 0x49e450)
            self.at(s, '0049E4D0', 0x49e4de, '8b 4c 24 10 51 8b ce 8b f8')
            self.call(s, '0049E4D0', 0x49e4e7, 0x49e450)
            self.at(s, '0049E4D0', 0x49e4ec, '50 57')
            self.call(s, '0049E4D0', 0x49e4ee, 0x47b480)
            self.at(s, '0049E4D0', 0x49e4f3, '83 c4 08 5f 5e c2 08 00')
            self.assertEqual([r['target'] for r in self.e['callLedgers'][s]['0049E4D0']], ['0049E450', '0049E450', '0047B480'])

    def test_07_signed_coordinates_no_extra_category_gate(self):
        for s in SOURCE_HASHES:
            self.call(s, '0049E450', 0x49e45a, 0x47a630)
            self.at(s, '0049E450', 0x49e466, '8b 06 8b ce ff 50 3c 8b 00')
            self.at(s, '0049E450', 0x49e475, '0f bf c0 c1 f9 10 85 c0 7c 13 3d c8 00 00 00 7d 0c 85 c9 7c 08 81 f9 c8 00 00 00 7c 08')
            self.at(s, '0049E450', 0x49e49a, '69 c0 c8 00 00 00 03 c1 8d 0c 80 8b 14 8d 6c 0e fb 06 c1 ea 05 83 e2 7f')
            self.call(s, '0049E450', 0x49e4b3, 0x4839f0)
            self.assertEqual(self.raw[s, '00487DC0'], bytes.fromhex('8d411ec3'))
            self.assertEqual(self.raw[s, '004839F0'], bytes.fromhex('8b4424040fb680b0c27900c3'))
            self.assertEqual([r.get('target', 'virtual3C') for r in self.e['callLedgers'][s]['0049E450']], ['0047A630', 'virtual3C', '004839F0'])
        self.assertEqual(200 * 199 + 199, 39999)
        # x/y are sign-extended16-bit; guarded multiply/add never overflow.
        for word, expected in ((0, 0), (199, 199), (200, 200), (0x7fff, 32767), (0x8000, -32768), (0xffff, -1)):
            self.assertEqual(struct.unpack('<h', struct.pack('<H', word))[0], expected)
        for raw in (0, 31, 32, 127 << 5, 0xffffffff, 0x80000000):
            self.assertEqual((raw >> 5) & 127, (raw & 0xfe0) // 32)

    def test_08_canonical_generic_validity_and_vtable(self):
        for s in SOURCE_HASHES:
            b = self.raw[s, '0079C718']
            self.assertEqual(tuple(struct.unpack_from('<I', b, off)[0] for off in (8, 0x24, 0x3c)), (0x486400, 0x573470, 0x487dc0))
            self.assertEqual(self.raw[s, '00573470'], bytes.fromhex('b805000000c3'))
            self.assertEqual(self.raw[s, '00486400'], bytes.fromhex('568bf18b06ff502483f80575138b460885c07c0c83f83f7f07b8010000005ec333c05ec3'))
            self.assertEqual(self.raw[s, '0047A630'], bytes.fromhex('568b74240885f674116a016a0456e82d7affff83c40c85c0750433c05ec38b068bce5eff6008'))
            self.assertEqual([r['bytes'] for r in self.e['callLedgers'][s]['00472070']], ['ff 15 68 e2 74 00', 'ff 15 6c e2 74 00'])
        # These are canonical/source validity requirements, not permission to
        # execute platform probes or substitute external vtables.

    def test_09_unsigned_tables_source_specific_indexing_not_asymmetry_claim(self):
        literal_tree = ast.parse((ROOT / 'scripts/return_route_tables.py').read_text())
        literal = next(ast.literal_eval(n.value) for n in literal_tree.body if isinstance(n, ast.Assign))
        for s in SOURCE_HASHES:
            mapping, distance = self.raw[s, '0079C2B0'], self.raw[s, '0079B830']
            self.assertEqual(literal[s], tuple(mapping))
            self.assertEqual(mapping[:42], bytes(range(42)))
            self.assertEqual(mapping[96:100], bytes([255] * 4))
            self.assertEqual((len(mapping), len(distance)), (128, 1764))
            self.assertTrue(all(distance[i * 42 + j] == distance[j * 42 + i] for i in range(42) for j in range(42)))
            self.assertEqual(self.raw[s, '0047B480'], bytes.fromhex('8b44240485c07c1e83f8297f198b4c240885c97c1183f9297f0c6bc02a0fb6840830b87900c383c8ffc3'))
        self.assertEqual(sum(a != b for a, b in zip(self.raw['S1', '0079B830'], self.raw['S2', '0079B830'])), 1084)
        self.assertEqual(sum(a != b for a, b in zip(self.raw['S1', '0079C2B0'], self.raw['S2', '0079C2B0'])), 32)
        self.assertEqual((self.raw['S1', '0079C2B0'][42], self.raw['S2', '0079C2B0'][42]), (5, 19))

    def test_10_saved_distance_survives_acted_effects_lowbyte_duration_is_live_valid(self):
        for s in SOURCE_HASHES:
            self.at(s, '005B8400', 0x5b8447, '6a 00 6a 00 6a 00 6a 00 8b f8')
            self.at(s, '005B8400', 0x5b8455, '50 6a 25 6a 00 56 b9 5c 89 99 07')
            self.call(s, '005B8400', 0x5b8460, 0x4a73a0)
            self.at(s, '005B8400', 0x5b8465, '57 56 b9 5c 89 99 07')
            self.call(s, '005B8400', 0x5b846c, 0x4a5660)
            self.call(s, '004A5660', 0x4a5666, 0x47a630)
            self.at(s, '004A5660', 0x4a566b, '83 c4 04 85 c0 74 0c 8b 44 24 0c 50 8b ce')
            self.call(s, '004A5660', 0x4a5679, 0x48a8b0)
            self.assertEqual(self.raw[s, '0048A8B0'], bytes.fromhex('8a44240484c0770b32c0888158010000c204003cff72020cff888158010000c20400'))
            targets = [r['target'] for r in self.e['callLedgers'][s]['004A73A0']]
            self.assertEqual(targets[-3:], ['00489BD0', '00489B40', '00482F80'])
        for value in (-2**31, -257, -256, -1, 0, 1, 254, 255, 256, 2**31-1):
            al = value & 255
            interpreted = 0 if al == 0 else 255 if al >= 255 else al
            self.assertEqual(interpreted, value % 256)
        self.assertEqual((-1) & 255, 255)

    def test_11_new_interceptor_reuses_primitive_then_saves_parent_scope(self):
        # AST inspection only, not a production import or a test-only runtime
        # implementation. Scope pop belongs to the frozen helper's context.
        tree = ast.parse((ROOT / 'scripts/native_tail_distance_primitives.py').read_text())
        cls = next(n for n in tree.body if isinstance(n, ast.ClassDef))
        self.assertEqual(cls.name, 'NativeTailDistancePrimitives')
        method = next(n for n in cls.body if isinstance(n, ast.FunctionDef))
        self.assertEqual(method.name, 'boundary')
        gate, fallback = method.body
        expected_gate = ast.parse("kind == 'query' and helper == '0049E4D0'", mode='eval').body
        self.assertEqual(ast.dump(gate.test), ast.dump(expected_gate))
        expected = ast.parse("distance = self.movement_distance(args['currentBuildingId'], args['homeBuildingId'])\nself.save(savedDistance=distance)\nself.step('0049E4D0', result=distance, native=True, **args)\nreturn distance").body
        self.assertEqual([ast.dump(n) for n in gate.body], [ast.dump(n) for n in expected])
        self.assertEqual(ast.dump(fallback), ast.dump(ast.parse('return super().boundary(kind, helper, **args)').body[0]))
        profile = ast.parse((ROOT / 'scripts/native_tail_distance_profile.py').read_text())
        planner = next(n for n in profile.body if isinstance(n, ast.ClassDef) and n.name == '_Planner')
        self.assertEqual([ast.unparse(n) for n in planner.bases], ['NativeTailDistancePrimitives', 'GenericFacilityPlanner'])
        # Frozen primitive still computes first territory, saves it inside its
        # helper scope, computes second, then uses directed row-major distance.
        old = ast.parse((ROOT / 'scripts/officer_relocation_primitives.py').read_text())
        movement = next(n for n in ast.walk(old) if isinstance(n, ast.FunctionDef) and n.name == 'movement_distance')
        body = movement.body[0].body
        self.assertEqual([ast.unparse(n) for n in body[:3]], ["first = self.territory(origin)", 'self.save(savedOriginTerritoryId=first)', 'second = self.territory(target)'])

    def test_12_no_production_import_or_stock_execution_claim(self):
        tree = ast.parse(Path(__file__).read_text())
        imports = []
        for n in ast.walk(tree):
            if isinstance(n, ast.Import): imports.extend(a.name.split('.')[0] for a in n.names)
            if isinstance(n, ast.ImportFrom): imports.append((n.module or '').split('.')[0])
        self.assertTrue(set(imports) <= {'argparse', 'ast', 'io', 'json', 'pathlib', 'struct', 'sys', 'unittest', 'check_generic_facility_source', 'check_live_zero_refund_source', 'check_officer_relocation_source'})
        for name in ('native_tail_distance_profile', 'officer_relocation_primitives', 'generic_facility_profile'):
            self.assertNotIn(name, sys.modules)
        raw_report = json.loads((DIRECTORY / 'raw-verification.json').read_text())
        self.assertEqual(raw_report['baselineCommit'], HISTORICAL_EXTRACTION_BASELINE)
        for flag in ('machineCodeExecuted', 'originalExeExecuted', 'stockOriginalVerified'):
            self.assertIs(raw_report[flag], False)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--idb-s1', type=Path)
    parser.add_argument('--idb-s2', type=Path)
    parser.add_argument('--report', type=Path)
    args = parser.parse_args()
    result = unittest.TextTestRunner(verbosity=2).run(unittest.defaultTestLoader.loadTestsFromTestCase(NativeTailDistanceSource))
    if not result.wasSuccessful(): return 1
    e, raw, ins, prior, selected = load_evidence()
    verified = []
    for s, p in (('S1', args.idb_s1), ('S2', args.idb_s2)):
        if p is None: continue
        verify_raw_id1(p, s, selected)
        verified.append(dict(source=s, idbSha256=SOURCE_HASHES[s], intervals=sum(k[0] == s for k in selected),
            selectedIntervalBytes=sum(len(b) for k, b in selected.items() if k[0] == s)))
    report = dict(checker=Path(__file__).name, sourceProfile=e['profileId'], baselineCommit=BASELINE,
        sourceTests=result.testsRun, inheritedSourceTests=13, sourceTestsPassed=True,
        focusedInheritedReusedIntervals=46, newUniqueIntervals=0, newMachineCodeBytesRecovered=0,
        selectedBytesBothSources=6078, codeIntervals=40,
        instructions=780, callSites=80, branchSites=72, inheritedSelectedIntervals=1236,
        retainedDirectPins=len(PINS), rawId1Verification=verified,
        machineCodeExecuted=False, originalExeExecuted=False, stockOriginalVerified=False,
        recordedExeHashesIndependentlyVerified=False, rawRuntimeMapCaptured=False,
        actualDistanceTablesSymmetric=True, directedArgumentIndexingVerified=True)
    if args.report: args.report.write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps(report, sort_keys=True))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
