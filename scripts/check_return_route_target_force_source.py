"""P0-64 independent byte-only route/target-force source checker.

Imports the SHA-pinned previous byte resolver only; never imports model code,
executes an EXE, or trusts disassembly text for claims. Optional IDB verification
uses a separate raw-ID1 file layout reader, no IDB library dependency.
"""
import argparse
import ast
import hashlib
import json
from pathlib import Path
import struct
import sys
import unittest
import check_native_roster_sort_source as prior

ROOT=Path(__file__).resolve().parents[1]
MANIFEST=ROOT/'docs/sources/return-route-target-force.json'
PRIOR_SHA='0180677bea36af4b11dc5e6c50ae45b09e20a27841ed58da1c7d7b18bc570d52'
digest=lambda value:hashlib.sha256(value).hexdigest()


def load_evidence():
    e=json.loads(MANIFEST.read_text())
    assert e['priorEvidence']==[{'id':'native-roster-sort','path':'docs/sources/native-roster-sort.json','sha256':PRIOR_SHA}]
    assert digest((ROOT/e['priorEvidence'][0]['path']).read_bytes())==PRIOR_SHA
    assert json.loads((ROOT/e['priorEvidence'][0]['path']).read_text())['sources']==e['sources']
    resolved=prior.resolve_manifest(MANIFEST,{})
    ins={k:rows for k,(_,rows) in resolved.items()}
    raw={k:b''.join(b for _,b in rows) for k,rows in ins.items()}
    for r in e['referencedRanges']+e['newRanges']:
        value=raw[r['source'],r['start'],r['endExclusive']]
        assert digest(value)==r['sha256']==r['independentId1Sha256']
    for r in e['comparisons']:
        a,b=(raw[s,r['start'],r['endExclusive']] for s in ('S1','S2'))
        assert r['identical']==(a==b)
        assert r['differingByteCount']==sum(x!=y for x,y in zip(a,b))
        assert digest(a)==r['S1sha256'] and digest(b)==r['S2sha256']
    assert {(r['start'],r['endExclusive']) for r in e['comparisons']}=={(a,b) for s,a,b in raw if s=='S1' and ('S2',a,b) in raw}
    unpaired={(s,a,b) for s,a,b in raw if ('S2' if s=='S1' else 'S1',a,b) not in raw}
    assert {(r['source'],r['start'],r['endExclusive']) for r in e['unpairedRangeShapes']}==unpaired
    for r in e['unpairedRangeShapes']:assert digest(raw[r['source'],r['start'],r['endExclusive']])==r['sha256']
    for(s,a,b),v in raw.items():
        for(t,c,d),w in raw.items():
            left,right=max(int(a,16),int(c,16)),min(int(b,16),int(d,16))
            if s==t and left<right:assert v[left-int(a,16):right-int(a,16)]==w[left-int(c,16):right-int(c,16)]
    return e,raw,ins


class ReturnRouteTargetForceSource(unittest.TestCase):
    @classmethod
    def setUpClass(cls):cls.e,cls.raw,cls.ins=load_evidence()
    def body(self,s,f):return max((v for(src,a,_),v in self.raw.items() if(src,a)==(s,f)),key=len)
    def at(self,s,f,a,expected):
        v=bytes.fromhex(expected);off=a-int(f,16)
        self.assertEqual(self.body(s,f)[off:off+len(v)],v)
    def call(self,s,f,a,target):
        b=self.body(s,f);off=a-int(f,16);self.assertEqual(b[off],0xe8)
        self.assertEqual(a+5+struct.unpack_from('<i',b,off+1)[0],target)

    def test_01_fingerprints_budget_and_mod_limit(self):
        e=self.e
        self.assertEqual(e['profileId'],'source-idb-S1-S2-return-route-target-force-v1')
        self.assertEqual(e['baselineCommit'],'28d0b0b8aa6e2c781b791886093b806e6e3d1ad3')
        self.assertEqual([r['idbSha256'] for r in e['sources']],['c591cb40ce6d6be9246148002532dedc042463f36cd39c5ed300b7c449feefab','aa7f2c983b266633d6e23c494d4f8e1b03e5251632505cae103e176ae850dfd8'])
        self.assertEqual((len(self.raw),sum(map(len,self.raw.values()))),(681,65834))
        self.assertEqual(e['rangeBudget'],dict(priorIntervals=667,newIntervals=14,totalIntervals=681,totalSelectedBytesBothSources=65834,sameShapePairs=337,identicalSameShapePairs=328,differentSameShapePairs=9,unpairedIntervalShapes=7))
        for k in ('stockOriginalVerified','originalExeExecuted','recordedExeHashesIndependentlyVerified'):self.assertIs(e[k],False)
        self.assertEqual(e['adoption'],{'PC-PK1.1':'compatibility-reconstruction','PC-Vanilla-assumed':'compatibility-assumption','PS2-Wii':'open'})
        self.assertIn('MOD-associated',e['provenance']['sourceClassification'])

    def test_02_exact_call_ledgers(self):
        expected=set('005BA320 004896C0 00489730 00487EB0 00487B30 0049E450 0047B2B0 0047E070 00480FF0 00491770 004BF6F0'.split())
        for s in ('S1','S2'):
            self.assertEqual(set(self.e['callLedgers'][s]),expected)
            for f,ledger in self.e['callLedgers'][s].items():
                key=max((k for k in self.ins if k[:2]==(s,f)),key=lambda k:int(k[2],16))
                calls=[(a,b) for a,b in self.ins[key] if b[0]==0xe8 or (b[0]==0xff and b[1]&0x38==0x10)]
                self.assertEqual([f'{a:08X}' for a,_ in calls],[r['site'] for r in ledger])
                for(a,b),row in zip(calls,ledger):
                    self.assertEqual(b,bytes.fromhex(row['bytes']))
                    if b[0]==0xe8:self.assertEqual(a+5+struct.unpack_from('<i',b,1)[0],int(row['target'],16))
                    else:self.assertIs(row['indirect'],True)

    def test_03_mission_switch_all_entries_and_signed_range(self):
        expected={9:'arg0',10:'arg0',12:'arg1',**{i:'forceArg0RulerHome' for i in range(15,23)},23:'arg0',24:'arg0',37:'home'}
        self.assertEqual({int(k):v for k,v in self.e['contracts']['routeDispatch'].items()},expected)
        targets={0x5ba341:'arg0',0x5ba34a:'arg1',0x5ba353:'forceArg0RulerHome',0x5ba393:'home',0x5ba3a4:'false'}
        for s in ('S1','S2'):
            f='005BA320';self.at(s,f,0x5ba324,'8b 81 3c 01 00 00 83 c0 f7 83 f8 1c 56 77 71')
            index=self.body(s,'005BA3F0');table=self.body(s,'005BA3DC')
            self.assertEqual(len(index),29);self.assertEqual(len(table),20)
            for mission in range(9,38):self.assertEqual(targets[struct.unpack_from('<I',table,4*index[mission-9])[0]],expected.get(mission,'false'))
            self.at(s,f,0x5ba399,'85 c0 7c 07 3d ff 3f 00 00 7e 04 33 c0 5e c3')

    def test_04_argument_getter_and_force_ruler_home_no_force_valid_gate(self):
        for s in ('S1','S2'):
            f='005BA320'
            self.at(s,f,0x5ba341,'6a 00');self.call(s,f,0x5ba343,0x4897b0)
            self.at(s,f,0x5ba34a,'6a 01');self.call(s,f,0x5ba34c,0x4897b0)
            self.at(s,f,0x5ba353,'6a 00');self.call(s,f,0x5ba355,0x4897b0)
            self.at(s,f,0x5ba35a,'85 c0 7c 46 83 f8 2e 7f 41')
            self.call(s,f,0x5ba369,0x490aa0);self.at(s,f,0x5ba36e,'8b 40 04 50')
            self.call(s,f,0x5ba377,0x490b00);self.call(s,f,0x5ba37f,0x47a630)
            self.at(s,f,0x5ba387,'85 c0 74 19 8b 86 98 00 00 00 eb 06 8b 81 98 00 00 00')
            self.assertEqual(self.body(s,'004897B0'),bytes.fromhex('8b44240485c07c0f83f8067d0a8b848140010000c2040083c8ffc20400'))
            self.assertEqual([r.get('target') for r in self.e['callLedgers'][s][f]],[ '004897B0','004897B0','004897B0','00490AA0','00490B00','0047A630','00490D00','0049E450'])

    def test_05_outputs_id_before_territory_and_no_write_on_failure(self):
        for s in ('S1','S2'):
            f='005BA320';self.at(s,f,0x5ba3a8,'8b 4c 24 0c 85 c9 74 02 89 01')
            self.at(s,f,0x5ba3b2,'8b 74 24 10 85 f6 74 18 50')
            self.call(s,f,0x5ba3c0,0x490d00);self.call(s,f,0x5ba3cb,0x49e450)
            self.at(s,f,0x5ba3d0,'89 06 b8 01 00 00 00 5e c3')
        self.assertIn('distinct caller-owned scalar cells',self.e['contracts']['routeOutputOrder'])

    def test_06_at_home_cached_compare_then_live_home(self):
        for s in ('S1','S2'):
            self.at(s,'004896C0',0x4896c0,'8b 81 98 00 00 00 85 c0 8b 91 9c 00 00 00')
            self.at(s,'004896C0',0x489707,'83 c8 ff 3b d0 75 17 6a 00 6a 00 51')
            self.call(s,'004896C0',0x489713,0x5ba320)
            self.at(s,'004896C0',0x48971b,'85 c0 75 06 b8 01 00 00 00 c3 33 c0 c3')
            self.call(s,'00489730',0x489734,0x4896c0)
            self.at(s,'00489730',0x489739,'85 c0 74 3c 8b 87 98 00 00 00')
            self.call(s,'00489730',0x489749,0x490d00);self.call(s,'00489730',0x489751,0x47a630)
            self.at(s,'00489730',0x48975d,'8b 06 8b ce ff 50 44 8b 17 8b cf 8b f0 ff 52 44')

    def test_07_category_priority_and_kind24_exception(self):
        for s in ('S1','S2'):
            f='00487B30'
            for at in (0x487b45,0x487b6a,0x487b9a):self.call(s,f,at,0x490b90)
            self.at(s,f,0x487b4a,'83 b8 b4 00 00 00 01 74 59')
            self.at(s,f,0x487b53,'8b 46 08 83 f8 18 74 2d')
            self.at(s,f,0x487b7a,'33 c9 83 f8 03 0f 94 c1 8b c1 85 c0 75 24')
            self.at(s,f,0x487b9f,'83 b8 b4 00 00 00 02 74 04 33 c0 5e c3 b8 01 00 00 00 5e c3')
            self.call(s,'00487EB0',0x487eb4,0x487b30)
            self.at(s,'00487EB0',0x487eb9,'85 c0 74 06 8b 46 0c 5e 59 c3')

    def test_08_facility_getter_no_validity_gate(self):
        for s in ('S1','S2'):
            self.assertEqual(self.body(s,'00490B90'),bytes.fromhex('8b44240485c07c1583f83f7f1069c0d00000008d8408549c0700c2040033c0c20400'))
            self.call(s,'00487EB0',0x487ed6,0x490b90)
            self.at(s,'00487EB0',0x487ec3,'8b 46 08 85 c0 57 7c 77 83 f8 3f 7f 72')
            self.at(s,'00487EB0',0x487edb,'83 b8 b4 00 00 00 04 75 5e')

    def test_09_category4_direct_linear_memory_no_coordinate_gate(self):
        for s in ('S1','S2'):
            f='00487EB0'
            self.at(s,f,0x487ee4,'8b 06 8b ce ff 50 3c 8b 00')
            self.at(s,f,0x487ef5,'0f bf c0 69 c0 c8 00 00 00 c1 f9 10 03 c1 8d 14 80 8b 04 95 6c 0e fb 06 c1 e8 05 83 e0 7f 50')
            self.call(s,f,0x487f14,0x4839f0);self.call(s,f,0x487f22,0x490a10);self.call(s,f,0x487f2a,0x47a630)
            self.at(s,f,0x487f32,'85 c0 74 0c 8b 17 8b cf 5f 5e 83 c4 04 ff 62 40')
            self.assertEqual(self.body(s,'00487DC0'),bytes.fromhex('8d411ec3'))
        self.assertIn('linear index200*x+y lies0..39999',self.e['contracts']['territorialCategory'])

    def test_10_route_territory_bounds_and_unsigned_unvalidated_result(self):
        for s in ('S1','S2'):
            f='0049E450';self.call(s,f,0x49e45a,0x47a630)
            self.at(s,f,0x49e466,'8b 06 8b ce ff 50 3c 8b 00')
            self.at(s,f,0x49e475,'0f bf c0 c1 f9 10 85 c0 7c 13 3d c8 00 00 00 7d 0c 85 c9 7c 08 81 f9 c8 00 00 00 7c 08')
            self.at(s,f,0x49e49a,'69 c0 c8 00 00 00 03 c1 8d 0c 80 8b 14 8d 6c 0e fb 06 c1 ea 05 83 e2 7f')
            self.call(s,f,0x49e4b3,0x4839f0)
            self.at(s,f,0x49e4b8,'83 c4 04 8b f8 8b c7 5f 5e c2 04 00')
            self.assertEqual(self.body(s,'004839F0'),bytes.fromhex('8b4424040fb680b0c27900c3'))

    def test_11_source_distinct_territory_table_exact_literal_artifact(self):
        tree=ast.parse((ROOT/'scripts/return_route_tables.py').read_text())
        assignments=[node for node in tree.body if isinstance(node,ast.Assign)]
        self.assertEqual(len(assignments),1);self.assertEqual(assignments[0].targets[0].id,'TERRITORY_CITY_TABLES')
        literal=ast.literal_eval(assignments[0].value)
        for s in ('S1','S2'):
            table=self.body(s,'0079C2B0');self.assertEqual(len(table),128)
            self.assertEqual(literal[s],tuple(table));self.assertEqual(self.e['territoryMapping'][s],list(table))
            self.assertEqual(table[:42],bytes(range(42)))
            self.assertEqual(table[96:100],b'\xff'*4)
        self.assertNotEqual(literal['S1'][42:87],literal['S2'][42:87])
        self.assertEqual(literal['S1'][87:],literal['S2'][87:])
        self.assertEqual((literal['S1'][42],literal['S2'][42]),(5,19))

    def test_12_fallback_kind_id_normalization_and_subtype_validity(self):
        for s in ('S1','S2'):
            f='00487EB0';self.call(s,f,0x487f48,0x491770)
            self.at(s,f,0x487f4d,'8b 76 08 83 ee 00 74 7a 4e 74 3f 4e 0f 85 a2 00 00 00')
            self.at(s,f,0x487f5f,'83 f8 34 7c 0a 83 f8 56 7f 05 83 c0 cc')
            self.at(s,f,0x487f97,'83 f8 2a 7c 0a 83 f8 33 7f 05 83 c0 d6')
            self.at(s,f,0x487fcf,'85 c0 7c 05 83 f8 29 7e 03 83 c8 ff')
            for a,target in ((0x487f77,0x490a70),(0x487faf,0x490a40),(0x487fe1,0x490a10),(0x487f7f,0x47a630),(0x487fb7,0x47a630),(0x487fe9,0x47a630)):self.call(s,f,a,target)
            self.at(s,f,0x488001,'5f 83 c8 ff 5e 59 c3')

    def test_13_canonical_virtual_tables_legion_force_and_position(self):
        for s in ('S1','S2'):
            for table,getter in [('0079BF58',0x47c320),('0079C170',0x483810),('0079C7D0',0x483810)]:
                self.assertEqual(struct.unpack_from('<II',self.body(s,table),0x40),(0x47b2b0,getter))
            self.assertEqual(struct.unpack_from('<III',self.body(s,'0079C718'),0x3c),(0x487dc0,0x487eb0,0x4867d0))
            self.assertEqual(struct.unpack_from('<I',self.body(s,'0079BFB0'),0x40)[0],0x65d6c0)
            self.assertEqual(self.body(s,'0047C320'),bytes.fromhex('8b4138c3'))
            self.assertEqual(self.body(s,'00483810'),bytes.fromhex('8b4120c3'))
            self.assertEqual(self.body(s,'0065D6C0'),bytes.fromhex('8b4104c3'))

    def test_14_subtype_force_validates_legion_not_force(self):
        for s in ('S1','S2'):
            f='0047B2B0';self.at(s,f,0x47b2b0,'8b 01 56 ff 50 44 50')
            self.call(s,f,0x47b2bc,0x490ad0);self.call(s,f,0x47b2c4,0x47a630)
            self.at(s,f,0x47b2cc,'85 c0 74 08 8b 16 8b ce 5e ff 62 40 83 c8 ff 5e c3')
            self.assertEqual([r.get('target') for r in self.e['callLedgers'][s][f]],[None,'00490AD0','0047A630'])

    def test_15_strict_force_and_legion_validity_aliases(self):
        for s in ('S1','S2'):
            force=self.body(s,'0079C0E8');legion=self.body(s,'0079BFB0')
            self.assertEqual((struct.unpack_from('<I',force,8)[0],struct.unpack_from('<I',force,0x2c)[0]),(0x480ff0,0x480fd0))
            self.assertEqual((struct.unpack_from('<I',legion,8)[0],struct.unpack_from('<I',legion,0x2c)[0]),(0x47e070,0x47e050))
            self.assertEqual(self.body(s,'00480FD0'),bytes.fromhex('8b44240483f81a740a83f801740533c0c20400b801000000c20400'))
            self.assertEqual(self.body(s,'0047E050'),bytes.fromhex('8b44240483f81a740a83f802740533c0c20400b801000000c20400'))
            self.at(s,'00480FF0',0x480ff3,'8b 06 6a 01 ff 50 2c 85 c0 74 16 8b 76 04 85 f6 7c 0f 81 fe 4b 04 00 00 7f 07')
            self.at(s,'0047E070',0x47e073,'8b 06 6a 02 ff 50 2c 85 c0 74 17 8b 16 8b ce ff 52 40 85 c0 7c 0c 83 f8 2e 7f 07')
            self.assertEqual(struct.unpack_from('<I',legion,4)[0],0x41c130)
            self.assertEqual(self.body(s,'0041C130'),bytes.fromhex('8b01ff6008'))

    def test_16_allocated_force_is_distinct_from_valid(self):
        for s in ('S1','S2'):
            self.assertEqual(struct.unpack_from('<I',self.body(s,'0079C0E8'),4)[0],0x481870)
            self.at(s,'00481870',0x481873,'8b 06 ff 50 08 85 c0 75 11 8b 16 8b ce ff 52 28 83 f8 2a 7c 0c 83 f8 2d 7f 07')
            self.assertEqual(self.body(s,'005584E0'),bytes.fromhex('b801000000c3'))
            self.assertEqual(self.body(s,'005733A0'),bytes.fromhex('b802000000c3'))

    def test_17_saved_caller_force_and_repeated_live_target_resolution(self):
        for s in ('S1','S2'):
            f='004BF6F0';self.at(s,f,0x4bf7cd,'ff 52 40 50')
            self.call(s,f,0x4bf7d6,0x490aa0)
            self.at(s,f,0x4bf7db,'8b ce 89 44 24 20')
            self.at(s,f,0x4bf7ee,'ff 50 40 8b 17 8b cf 8b e8 ff 52 40 3b c5')
            self.at(s,f,0x4bf862,'ff 52 40 85 c0 0f 8c a4 00 00 00 83 f8 2e 0f 8f 9b 00 00 00')
            self.at(s,f,0x4bf87a,'ff 50 40 8b 17 8b cf 8b e8 ff 52 40 3b e8')
            self.call(s,f,0x4bf83e,0x4a31e0);self.call(s,f,0x4bf859,0x4a0cb0)

    def test_18_contract_no_hook_purity_inference_and_inherited_frozen(self):
        c=self.e['contracts']
        for token in ['queries377/278','whole-frame effect-query','RNG evidence']:self.assertIn(token,c['mutableBoundary'])
        for k in ('fullNativeExecution','originalSaveEquivalence','queryHooksExecuted'):self.assertIs(c[k],False)
        self.assertIn('Missing reached data is not null',c['representationDomain'])
        for token in ['force extinction','empty-legion redistribution','query hook internals']:self.assertIn(token,c['stillOpen'])
        for row in self.e['inheritedPrimitiveDependencies']:self.assertEqual(digest((ROOT/row['path']).read_bytes()),row['sha256'])
        self.assertEqual(self.e['platformAssumptions'],json.loads((ROOT/'docs/sources/native-roster-sort.json').read_text())['platformAssumptions'])


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--idb-s1');parser.add_argument('--idb-s2')
    args,remaining=parser.parse_known_args()
    if bool(args.idb_s1)!=bool(args.idb_s2):parser.error('Pass both IDBs for raw verification')
    if args.idb_s1:
        e,raw,_=load_evidence()
        for sid,path in [('S1',args.idb_s1),('S2',args.idb_s2)]:
            identity=next(r for r in e['sources'] if r['source']==sid)
            selected={(a,b):v for(s,a,b),v in raw.items() if s==sid}
            prior.verify_raw_id1(path,identity,selected)
            print(f'{sid}: whole-IDB fingerprint and {len(selected)} raw-ID1 ranges verified',flush=True)
    unittest.main(argv=[sys.argv[0]]+remaining)

if __name__=='__main__':main()
