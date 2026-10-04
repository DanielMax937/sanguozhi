"""P0-59 byte/registry/event branch checks. No IDB or target-code execution."""
import hashlib
import json
from pathlib import Path
import re
import struct
import unittest
from check_facility_mission_cancellation_evidence import read_range
import mission_event_listener_profile as model

ROOT=Path(__file__).resolve().parents[1]
MANIFEST=ROOT/'docs/sources/mission-event-listeners.json'
DIRECTORY=MANIFEST.with_suffix('')


class SourceTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.e=json.loads(MANIFEST.read_text());cls.raw={}
        for r in cls.e['containers']:
            p=DIRECTORY/r['file'];assert hashlib.sha256(p.read_bytes()).hexdigest()==r['sha256'];assert len(p.read_text().splitlines())==r['lineCount']
        for r in cls.e['ranges']:
            key=r['source'],r['start'];assert key not in cls.raw
            cls.raw[key]=read_range(DIRECTORY,r);assert r['sha256']==r['independentId1Sha256']
        for r in cls.e['comparisons']:
            for s in ('S1','S2'):assert hashlib.sha256(cls.raw[s,r['start']]).hexdigest()==r[s+'sha256']
            assert r['identical']==(cls.raw['S1',r['start']]==cls.raw['S2',r['start']])
    def at(self,s,fn,address,expected):
        value=bytes.fromhex(expected);offset=address-int(fn,16);self.assertEqual(self.raw[s,fn][offset:offset+len(value)],value)
    def call(self,s,fn,address,target):
        b=self.raw[s,fn];o=address-int(fn,16);self.assertEqual(b[o],0xe8);self.assertEqual(address+5+struct.unpack_from('<i',b,o+1)[0],target)
    def contains(self,s,fn,pattern):self.assertIn(bytes.fromhex(pattern),self.raw[s,fn])
    def test_01_hashes_scope_and_source_adoption(self):
        self.assertEqual(len(self.raw),338);self.assertEqual(sum(map(len,self.raw.values())),22202)
        self.assertEqual(self.e['profileId'],model.PROFILE_ID);self.assertEqual(len(self.e['comparisons']),169)
        self.assertTrue(all(r['identical'] for r in self.e['comparisons']))
        self.assertEqual([r['idbSha256'] for r in self.e['sources']],['c591cb40ce6d6be9246148002532dedc042463f36cd39c5ed300b7c449feefab','aa7f2c983b266633d6e23c494d4f8e1b03e5251632505cae103e176ae850dfd8'])
        for k in ('stockOriginalVerified','originalExeExecuted','recordedExeHashesIndependentlyVerified'):self.assertFalse(self.e[k])
        self.assertEqual(self.e['adoption']['PC-PK1.1'],'compatibility-reconstruction');self.assertEqual(self.e['adoption']['PC-Vanilla-assumed'],'compatibility-assumption')
    def test_02_reconstruct_all_registry_stores_and_vtables(self):
        dispatch=self.e['dispatch'];self.assertEqual([r['mission'] for r in dispatch],list(range(44)))
        for s in ('S1','S2'):
            body=self.raw[s,'005BA8E0'];self.assertIn(bytes.fromhex('33 c0 8d 56 08 b9 2c 00 00 00 8b fa f3 ab'),body)
            actual={}
            for x in re.finditer(rb'\x8d\x86(.{4})\x89\x46(.)',body,re.DOTALL):actual[(x[2][0]-8)//4]=struct.unpack('<I',x[1])[0]
            for x in re.finditer(rb'\x8d\x86(.{4})\x89\x86(.{4})',body,re.DOTALL):actual[(struct.unpack('<I',x[2])[0]-8)//4]=struct.unpack('<I',x[1])[0]
            for code in ('8d 86 b8 00 00 00 89 02','8d 9e 78 05 00 00','89 5e 24','8d ae 38 0a 00 00','89 6e 44','8d 86 10 19 00 00 5f 89 86 b4 00 00 00'):self.assertIn(bytes.fromhex(code),body)
            actual.update({0:0xb8,7:0x578,15:0xa38,43:0x1910});self.assertEqual(set(actual),set(range(44))-{37})
            for r in dispatch:
                mission=r['mission'];self.assertEqual(r.get('predicate'),model.PREDICATES[mission]);self.assertEqual(r.get('handler'),model.HANDLERS[mission])
                if mission==37:continue
                offset=int(r['objectOffset'],16);vt=int(r['vtable'],16);self.assertEqual(actual[mission],offset)
                pair=self.raw[s,f'{vt+8:08X}'];self.assertEqual(struct.unpack('<II',pair),(int(r['predicate'],16),int(r['handler'],16)))
                if r['constructor']=='inline':
                    prefix=b'\xc7\x03' if mission==7 else b'\xc7\x45\x00' if mission==15 else b'\xc7\x86'+struct.pack('<I',offset)
                    self.assertIn(prefix+struct.pack('<I',vt),body)
                else:
                    needle=b'\x8d\x8e'+struct.pack('<I',offset);pos=body.index(needle)
                    targets=[0x5ba8e0+i+5+struct.unpack_from('<i',body,i+1)[0] for i in range(pos+6,pos+30) if body[i]==0xe8]
                    self.assertIn(int(r['constructor'],16),targets);self.assertIn(b'\xc7\x06'+struct.pack('<I',vt),self.raw[s,r['constructor']])
    def test_03_event_wrapper_order(self):
        for s in ('S1','S2'):
            self.call(s,'004BBAA0',0x4bbac5,0x4a8110);self.call(s,'004BBAA0',0x4bbad1,0x4ba1d0);self.call(s,'004BBAA0',0x4bbad6,0x4ec870)
            self.contains(s,'004BBAA0','ff 92 b4 01 00 00')
    def test_04_active_list_copy_live_executing_mission_and_bounds(self):
        for s in ('S1','S2'):
            self.at(s,'004A8110',0x4a8153,'68 dc 1a 20 07');self.call(s,'004A8110',0x4a8160,0x49f820)
            self.call(s,'004A8110',0x4a817f,0x47bed0)
            self.at(s,'004A8110',0x4a8184,'8b 00 3b 05 94 15 77 09 74 1b 8b 88 3c 01 00 00 3b ce 7c 11 83 f9 2b 7f 0c')
            self.call(s,'004A8110',0x4a81a4,0x5b9d30);self.call(s,'004A8110',0x4a81bc,0x47c100)
    def test_05_dispatch_captures_mission_and_ignores_handler_return(self):
        for s in ('S1','S2'):
            self.at(s,'005B9D30',0x5b9d37,'8b 9d 3c 01 00 00 83 fb 25')
            self.at(s,'005B9D30',0x5b9d4b,'8b 44 99 08 85 c0')
            self.at(s,'005B9D30',0x5b9dd4,'8b 4c 98 08 8b 11 57 55 ff 52 08 85 c0 74 1b')
            self.at(s,'005B9D30',0x5b9de7,'8b 4c 98 08 8b 11 57 55 ff 52 0c 5f 5d b8 01 00 00 00')
            self.assertEqual(self.raw[s,'00441880'],bytes.fromhex('33 c0 c2 08 00'))
    def test_06_switch_maps_to_false_on_unrelated_events(self):
        for s in ('S1','S2'):
            for mapping,jumps,dest in [('005B2230','005B2220',0x5b2219),('005B64F8','005B64E4',0x5b64de),('005BE1A0','005BE190',0x5be189),('005CC634','005CC624',0x5cc61c),('005CD398','005CD380',0x5cd378)]:
                for ev in (8,14):self.assertEqual(struct.unpack_from('<I',self.raw[s,jumps],self.raw[s,mapping][ev]*4)[0],dest)
            self.assertEqual(struct.unpack_from('<I',self.raw[s,'005BBE0C'],self.raw[s,'005BBE20'][8-2]*4)[0],0x5bbe02)
            self.at(s,'005BBCB0',0x5bbcd9,'83 c1 fe 83 f9 0a')
            self.at(s,'005C5420',0x5c5449,'83 f9 07')
            self.at(s,'005B7560',0x5b7594,'83 f9 09')
            self.assertEqual(struct.unpack_from('<I',self.raw[s,'005B7720'],8*4)[0],0x5b7696)
    def test_07_direct_event_branch_subtractions(self):
        for s in ('S1','S2'):
            for fn,first in [('005CB180',0x5cb1a9),('005D7F00',0x5d7f32),('005D9D60',0x5d9d92)]:
                self.at(s,fn,first,'83 e8 02');self.at(s,fn,first+5,'83 e8 07')
            self.at(s,'005C6930',0x5c6969,'83 e8 02');self.at(s,'005C6930',0x5c6972,'83 e8 07');self.at(s,'005C6930',0x5c697b,'83 e8 03')
            self.at(s,'005BF300',0x5bf334,'83 e8 02');self.at(s,'005BF300',0x5bf339,'83 e8 0d')
            self.at(s,'005B2D90',0x5b2d96,'83 e8 00');self.at(s,'005B2D90',0x5b2d9d,'83 e8 02');self.at(s,'005B2D90',0x5b2da2,'83 e8 0d')
    def test_08_context_wrappers_are_not_no_instruction_claim(self):
        expected=[('005BA530',0x5ba541,0x5b8f90,0x5ba547,0x5b2d90),('005BA5C0',0x5ba5d1,0x5b9c40,0x5ba5d7,0x5b2160),('005BA650',0x5ba661,0x5b9000,0x5ba667,0x5be0d0),('005BA6E0',0x5ba6f1,0x5b9060,0x5ba6f7,0x5b63e0),('005BA770',0x5ba781,0x5b90f0,0x5ba787,0x5b2d90),('005BA800',0x5ba811,0x5b9160,0x5ba817,0x5cc540),('005BA890',0x5ba8a1,0x5b9200,0x5ba8a7,0x5cd230)]
        for s in ('S1','S2'):
            for fn,a,t,b,u in expected:self.call(s,fn,a,t);self.call(s,fn,b,u)
            self.at(s,'005CD230',0x5cd239,'ff 10')
            self.assertEqual(struct.unpack('<III',self.raw[s,'00849368'])[0],0x572760)
    def test_09_type_and_identity_stubs(self):
        for s in ('S1','S2'):
            self.assertEqual(self.raw[s,'004195D0'],bytes.fromhex('83 c8 ff c3'))
            self.assertEqual(self.raw[s,'0067F810'],bytes.fromhex('b8 0a 00 00 00 c3'))
            self.assertEqual(self.raw[s,'00573470'],bytes.fromhex('b8 05 00 00 00 c3'))
            self.contains(s,'00491310','b8 1f 85 eb 51 f7 ee c1 fa 07');self.contains(s,'00491770','b8 93 24 49 92 f7 ee 03 d6 c1 fa 05')
            self.contains(s,'004897B0','83 f8 06')
    def test_10_mission23_subject_person_arg1_and_valid_gates(self):
        for s in ('S1','S2'):
            for a,t in [(0x5b7566,0x47a630),(0x5b757c,0x4897b0),(0x5b7587,0x4897b0),(0x5b769f,0x67f810),(0x5b76b1,0x47a630),(0x5b76c3,0x491310)]:self.call(s,'005B7560',a,t)
            self.at(s,'005B7560',0x5b7578,'6a 00');self.at(s,'005B7560',0x5b7581,'6a 01')
            self.at(s,'005B7560',0x5b76a7,'ff 57 2c');self.at(s,'005B7560',0x5b76c8,'3b c3 75 4c')
    def test_11_mission24_event14_raw_kind_and_arg0(self):
        for s in ('S1','S2'):
            for a,t in [(0x5d00a6,0x47a630),(0x5d00bc,0x4897b0),(0x5d00e5,0x573470),(0x5d00f7,0x47a630),(0x5d0145,0x491770)]:self.call(s,'005D00A0',a,t)
            self.at(s,'005D00A0',0x5d00c9,'83 e8 02');self.at(s,'005D00A0',0x5d00d2,'83 e8 07');self.at(s,'005D00A0',0x5d00d7,'83 e8 05')
            self.at(s,'005D00A0',0x5d0103,'8b 46 08 83 f8 01 74 34 83 f8 02 74 2f')
    def test_12_handlers_recheck_live_actor_location_and_separate_targets(self):
        for s in ('S1','S2'):
            for fn,calls in [('005B6D00',[(0x5b6d13,0x47a630),(0x5b6d37,0x490d00),(0x5b6d3f,0x47a630),(0x5b6d4f,0x4897b0),(0x5b6d66,0x490a10),(0x5b6d70,0x47a630)]),('005CFB70',[(0x5cfb83,0x47a630),(0x5cfba7,0x490d00),(0x5cfbaf,0x47a630),(0x5cfbbf,0x4897b0),(0x5cfbca,0x490d00),(0x5cfbd4,0x47a630)])]:
                for a,t in calls:self.call(s,fn,a,t)
                self.assertNotIn(bytes.fromhex('3c 01 00 00'),self.raw[s,fn][:0x87])
            self.contains(s,'005B6D00','83 f8 56');self.contains(s,'005CFB70','83 f8 56');self.contains(s,'005B6D00','83 f8 29')
    def test_13_post_listener_subsystem_noop_has_separate_observer(self):
        for s in ('S1','S2'):
            self.at(s,'004BA1D0',0x4ba1e6,'83 e8 09');self.at(s,'004BA1D0',0x4ba1ff,'83 e8 07');self.at(s,'004BA1D0',0x4ba204,'83 e8 02')
            b=self.raw[s,'004BA1D0'];self.assertEqual(0x4ba207+6+struct.unpack_from('<i',b,0x4ba209-0x4ba1d0)[0],0x4ba478)
            self.assertEqual({r['address'] for r in self.e['boundaries'] if r['kind'].endswith('handler-tail')},{'005B6D87','005CFBEB'})
    def test_14_known_return_tail_contains_mission_mutation_but_not_composed(self):
        for s in ('S1','S2'):
            self.contains(s,'005B8400','6a 25 6a 00 56');self.contains(s,'005B8400','85 c0 7e 17')
            for fn in ('005B6D00','005CFB70'):
                raw=self.raw[s,fn];targets=[int(fn,16)+i+5+struct.unpack_from('<i',raw,i+1)[0] for i in range(len(raw)-4) if raw[i]==0xe8]
                self.assertIn(0x5b8400,targets);self.assertIn(0x5b81d0,targets)


if __name__=='__main__':unittest.main()
