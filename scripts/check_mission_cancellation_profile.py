"""Mission-cancel routing, source-specific refunds, atomicity and replay tests."""
import copy
import json
import hashlib
import re
import struct
from pathlib import Path
from check_personnel_detachment_profile import read_source_range
import unittest
import mission_cancellation_profile as m


def fixture(mission=15,source='S1'):
    p={'id':10,'allocated':True,'valid':True,'status':3,'homeBaseId':0,'locationId':0,
       'missionId':mission,'missionArgs':[1,1200,2000,1,0],'missionDuration':7,'acted':False}
    state={'source':source,'revision':0,'appliedCommands':[], 'persons':[p,dict(p,id=11)],
           'bases':[{'id':i,'valid':True,'resourceValid':True,'kind':0,'forceId':1,'money':99900} for i in (0,1)],
           'forces':[{'id':1,'valid':True,'query33':False,'query38':False}]}
    command={'id':'cancel-1','expectedRevision':0,'personId':10}
    observations={'provenance':'synthetic helper-return observations','returnDistance':None,'s2Skill267':None}
    policy={'id':'test-projection','ruleset':'PC-PK1.1','unknownEffects':'record-only','provenance':'synthetic test only'}
    if mission==20:p['missionArgs'][1]=11
    if mission==21:p['missionArgs'][1]=0
    return state,command,observations,policy


def person(trace):return trace['after']['persons'][0]


class Cancellation(unittest.TestCase):
    def test_registry_partitions(self):
        self.assertEqual(len(m.HANDLERS),44)
        self.assertEqual(m.NOOP_MISSIONS,(1,3,4,6,7,8,11,13,14,25,26,27,28,29,30,31,32,33,34,35,36,39,40))
        for mission in range(44):
            f=fixture(mission);f[0]['persons'][0]['missionArgs']=[-1]*5
            t=m.project_cancellation(*f)
            if mission in m.NOOP_MISSIONS or mission==37:
                self.assertEqual(person(t),f[0]['persons'][0]);self.assertEqual(t['unknownEffects'],[])
            elif mission not in m.REFUND_ARG:
                self.assertEqual(t['unknownEffects'][0]['helper'],m.HANDLERS[mission]);self.assertEqual(person(t),f[0]['persons'][0])

    def test_entry_mission_signed_bounds_and_separate_validity(self):
        for mission in (-2**31,-1,44,2**31-1):
            f=fixture(mission);t=m.project_cancellation(*f)
            self.assertEqual(t['reason'],'entry-gate-no-op');self.assertEqual(person(t),f[0]['persons'][0])
        f=fixture();f[0]['persons'][0].update(allocated=False,valid=False)
        self.assertEqual(m.project_cancellation(*f)['reason'],'entry-gate-no-op')
        f=fixture();f[0]['persons'][0]['valid']=False
        self.assertEqual(m.project_cancellation(*f)['reason'],'command-gate-no-op')

    def test_refund_argument_matrix_and_source_s1_clamp(self):
        for mission,arg in m.REFUND_ARG.items():
            f=fixture(mission);before=copy.deepcopy(f);t=m.project_cancellation(*f)
            self.assertEqual(f,before);self.assertTrue(t['accepted'])
            self.assertEqual((person(t)['missionId'],person(t)['missionArgs'],person(t)['missionDuration'],person(t)['acted']),(-1,[0]*5,0,True))
            self.assertEqual(t['after']['bases'][0]['money'],99900 if arg is None else 100000)
            self.assertFalse(t['evidence']['completeGameTransaction'])
            helpers=[x['helper'] for x in t['steps']]
            self.assertLess(helpers.index('004A5780'),helpers.index('004A5660'))
            if arg is not None:self.assertLess(helpers.index('004A5600/00489B40'),helpers.index('004AE2A0'))

    def test_away_delays_refund_and_keeps_signed_amount(self):
        for amount in (-2**31,-1,0,1,1200,2**31-1):
            f=fixture();p=f[0]['persons'][0];p['locationId']=1;p['missionArgs'][1]=amount
            f[2]['returnDistance']=2;t=m.project_cancellation(*f)
            self.assertEqual((person(t)['missionId'],person(t)['missionArgs'],person(t)['missionDuration'],person(t)['acted']),(37,[amount,0,0,0,0],2,True))
            self.assertEqual(t['after']['bases'],f[0]['bases'])
            self.assertFalse(next(x for x in t['steps'] if x['helper']=='004A73A0')['cancelOld'])
        f[2]['returnDistance']=-1
        self.assertEqual(person(m.project_cancellation(*f))['missionDuration'],255)

    def test_no_money_call_for_nonpositive_refund(self):
        for amount in (-2**31,-1,0):
            f=fixture();f[0]['persons'][0]['missionArgs'][1]=amount;t=m.project_cancellation(*f)
            self.assertEqual(t['after']['bases'],f[0]['bases']);self.assertNotIn('004AE2A0',[x['helper'] for x in t['steps']])

    def test_all_command_gates(self):
        for mission in m.REFUND_ARG:
            f=fixture(mission);f[0]['forces'][0]['valid']=False
            t=m.project_cancellation(*f);self.assertEqual(t['reason'],'command-gate-no-op');self.assertEqual(t['unknownEffects'],[])
        for amount in (-1,0,999):
            f=fixture(20);f[0]['persons'][0]['missionArgs'][2]=amount;f[0]['persons'][0]['missionArgs'][1]=800
            self.assertEqual(m.project_cancellation(*f)['reason'],'command-gate-no-op')
        f=fixture(20);f[0]['persons'][1]['valid']=False
        self.assertEqual(m.project_cancellation(*f)['reason'],'command-gate-no-op')
        for index in (0,1):
            f=fixture(21);f[0]['bases'][index]['valid']=False
            self.assertEqual(m.project_cancellation(*f)['reason'],'command-gate-no-op')

    def test_s2_hook_does_not_force_acted_and_city_cap_differs(self):
        for query,acted in [(False,True),(True,False)]:
            f=fixture(source='S2');f[2]['s2Skill267']=query;t=m.project_cancellation(*f)
            self.assertEqual(person(t)['acted'],acted);self.assertEqual(t['after']['bases'][0]['money'],101100)
        f=fixture(source='S2');f[0]['persons'][0]['acted']=True;f[2]['s2Skill267']=True
        self.assertTrue(person(m.project_cancellation(*f))['acted'])
        # Away branch calls 00489B40 directly, never the S2 004A5600 hook.
        f=fixture(source='S2');f[0]['persons'][0]['locationId']=1;f[2]['returnDistance']=3
        self.assertTrue(person(m.project_cancellation(*f))['acted'])

    def test_money_capacities_every_source_kind_query(self):
        for source in ('S1','S2'):
            for kind in (0,1,2):
                for valid in (False,True):
                    for q33 in (False,True):
                        for q38 in (False,True):
                            cap=m.money_capacity(source,kind,valid,q33,q38)
                            expected=(100000 if source=='S1' else 200000) if kind==0 else ((40000 if valid and q33 else 10000) if source=='S1' else (100000 if valid and q38 else 50000))
                            self.assertEqual(cap,expected)
        for source in ('S1','S2'):
            f=fixture(source=source);f[0]['persons'][0].update(homeBaseId=42,locationId=42)
            f[0]['bases'].append({'id':42,'valid':True,'resourceValid':True,'kind':1,'forceId':1,'money':9800})
            if source=='S2':f[2]['s2Skill267']=False
            t=m.project_cancellation(*f);self.assertEqual(t['after']['bases'][-1]['money'],10000 if source=='S1' else 11000)

    def test_overflow_and_exact_cap(self):
        self.assertEqual(m.money_after_refund(1,2**31-1,100000),0)
        self.assertEqual(m.money_after_refund(0,100000,100000),100000)
        self.assertEqual(m.money_after_refund(100000,1,100000),100000)
        self.assertEqual(m.money_after_refund(200000,1,100000),100000)

    def test_captive_skips_return_callback(self):
        f=fixture();f[0]['persons'][0]['status']=5
        self.assertNotIn('004BF6F0',[x['helper'] for x in m.project_cancellation(*f)['unknownEffects']])

    def test_atomic_record_reject_replay_and_conflicts(self):
        f=fixture();before=copy.deepcopy(f);f[3]['unknownEffects']='reject';t=m.project_cancellation(*f)
        self.assertFalse(t['accepted']);self.assertEqual(t['after'],f[0]);self.assertEqual(t['steps'],[])
        f[3]['unknownEffects']='record-only';t=m.project_cancellation(*f)
        repeated=m.project_cancellation(t['after'],*f[1:]);self.assertTrue(repeated['replayed']);self.assertEqual(repeated['after'],t['after'])
        command=dict(f[1],personId=11);conflict=m.project_cancellation(t['after'],command,*f[2:])
        self.assertEqual(conflict['reason'],'replay-payload-conflict');self.assertEqual(conflict['after'],t['after'])
        stale=m.project_cancellation(t['after'],dict(f[1],id='cancel-2'),*f[2:])
        self.assertEqual(stale['reason'],'revision-conflict');self.assertEqual(stale['after'],t['after'])
        f=fixture(1);f[3]['unknownEffects']='reject';self.assertTrue(m.project_cancellation(*f)['accepted'])
        self.assertEqual(before[0]['revision'],0)

    def test_self_contained_trace_and_resigned_tamper_rejection(self):
        for mission in (1,15,0):
            for policy in ('record-only','reject'):
                f=fixture(mission);f[3]['unknownEffects']=policy;t=m.project_cancellation(*f)
                self.assertEqual(m.replay_cancellation(t),t)
                self.assertEqual(t['before'],f[0]);self.assertEqual(t['command'],f[1])
                self.assertEqual(t['observations'],f[2]);self.assertEqual(t['policy'],f[3])
                for mutate in (lambda q:q['after']['persons'][0].update(acted=not q['after']['persons'][0]['acted']),
                               lambda q:q.update(reason='invented'),
                               lambda q:q['steps'].append({'helper':'invented'}),
                               lambda q:q['unknownEffects'].append({'helper':'invented'}),
                               lambda q:q['evidence'].update(stockVerified=True)):
                    bad=copy.deepcopy(t);mutate(bad)
                    with self.assertRaises(ValueError):m.replay_cancellation(bad)
                    bad.pop('traceHash');bad['traceHash']=m._digest(bad)
                    with self.assertRaises(ValueError):m.replay_cancellation(bad)
        f=fixture();f[3]['ruleset']='PC-Vanilla-assumed'
        self.assertEqual(m.project_cancellation(*f)['evidence']['runtimeStatus'],'compatibility-assumption')

    def test_required_observations_and_invalid_inputs_are_atomic(self):
        mutations=[lambda f:f[0]['persons'][0].update(locationId=1),
                   lambda f:f[0].update(source='S2'),
                   lambda f:f[0]['forces'].clear(),
                   lambda f:f[0]['persons'][0]['missionArgs'].__setitem__(1,True),
                   lambda f:f[0]['persons'][0].update(allocated=False),
                   lambda f:f[0]['persons'].append(copy.deepcopy(f[0]['persons'][0])),
                   lambda f:f[0]['bases'][0].update(kind=1),
                   lambda f:f[0].update(source='stock'),
                   lambda f:f[3].update(unknownEffects='execute'),
                   lambda f:f[2].update(provenance=''),
                   lambda f:f[2].update(returnDistance=256),
                   lambda f:f[2].update(returnDistance=-2)]
        for mutate in mutations:
            f=fixture();mutate(f);before=copy.deepcopy(f)
            with self.assertRaises(ValueError):m.project_cancellation(*f)
            self.assertEqual(f,before)


class SourceEvidence(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        root=Path(__file__).resolve().parents[1]
        cls.evidence=json.loads((root/'docs/sources/personnel-detachment-source-profile.json').read_text())
        cls.ranges={}
        for r in cls.evidence['ranges']:
            start,end,raw=read_source_range(r)
            if start!=int(r['start'],16) or end!=int(r['endExclusive'],16) or hashlib.sha256(raw).hexdigest()!=r['sha256']:
                raise AssertionError('source range/hash mismatch')
            cls.ranges[(r['source'],r['start'])]=raw

    def raw(self,source,address):return self.ranges[(source,address)]

    def test_registry_constructor_to_all_43_cancel_slots(self):
        dispatch=self.evidence['missionCancellationDispatch']
        self.assertEqual([x['mission'] for x in dispatch],list(range(44)))
        for source in ('S1','S2'):
            body=self.raw(source,'005BA8E0')
            self.assertIn(bytes.fromhex('33 c0 8d 56 08 b9 2c 00 00 00 8b fa f3 ab'),body)
            # Reconstruct the actual registry stores, not just the JSON mapping.
            object_by_slot={}
            for match in re.finditer(rb'\x8d\x86(.{4})\x89\x46(.)',body,re.DOTALL):
                offset=struct.unpack('<I',match[1])[0];slot=match[2][0]
                object_by_slot[(slot-8)//4]=offset
            for match in re.finditer(rb'\x8d\x86(.{4})\x89\x86(.{4})',body,re.DOTALL):
                offset=struct.unpack('<I',match[1])[0];slot=struct.unpack('<I',match[2])[0]
                object_by_slot[(slot-8)//4]=offset
            # First, register-held, and epilogue-interleaved stores.
            self.assertIn(bytes.fromhex('8d 86 b8 00 00 00 89 02'),body);object_by_slot[0]=0xb8
            self.assertIn(bytes.fromhex('8d 9e 78 05 00 00'),body);self.assertIn(bytes.fromhex('89 5e 24'),body);object_by_slot[7]=0x578
            self.assertIn(bytes.fromhex('8d ae 38 0a 00 00'),body);self.assertIn(bytes.fromhex('89 6e 44'),body);object_by_slot[15]=0xa38
            self.assertIn(bytes.fromhex('8d 86 10 19 00 00 5f 89 86 b4 00 00 00'),body);object_by_slot[43]=0x1910
            self.assertEqual(set(object_by_slot),set(range(44))-{37})
            for row in dispatch:
                mission=row['mission'];self.assertEqual(row['cancel'],m.HANDLERS[mission])
                if mission==37:
                    self.assertIsNone(row['objectOffset']);continue
                offset=int(row['objectOffset'],16);vt=int(row['vtable'],16)
                self.assertEqual(object_by_slot[mission],offset)
                if row['constructor']=='inline':
                    if mission==7:pattern=b'\xc7\x03'+struct.pack('<I',vt)
                    elif mission==15:pattern=b'\xc7\x45\x00'+struct.pack('<I',vt)
                    else:pattern=b'\xc7\x86'+struct.pack('<II',offset,vt)
                    self.assertIn(pattern,body)
                else:
                    ctor=int(row['constructor'],16)
                    # Find LEA ECX,[ESI+objectOffset]; CALL relative constructor.
                    needle=b'\x8d\x8e'+struct.pack('<I',offset)
                    pos=body.index(needle)
                    calls=[0x5ba8e0+i+5+struct.unpack('<i',body[i+1:i+5])[0]
                           for i in range(pos+6,pos+30) if body[i]==0xe8]
                    self.assertIn(ctor,calls)
                    self.assertIn(b'\xc7\x06'+struct.pack('<I',vt),self.raw(source,row['constructor']))
                slot=self.raw(source,f'{vt+12:08X}')
                self.assertEqual(len(slot),4);self.assertEqual(struct.unpack('<I',slot)[0],int(row['cancel'],16))

    def test_dispatch_and_refund_opcode_anchors(self):
        for source in ('S1','S2'):
            wrapper=self.raw(source,'004A57B0')
            self.assertEqual(0x4a57b6+5+struct.unpack('<i',wrapper[7:11])[0],0x47a600)
            dispatcher=self.raw(source,'005B9B40')
            self.assertIn(bytes.fromhex('83 f8 25'),dispatcher)
            self.assertIn(bytes.fromhex('8b 4c 81 08'),dispatcher)
            self.assertIn(bytes.fromhex('ff 50 0c'),dispatcher)
            self.assertEqual(self.raw(source,'00441880'),bytes.fromhex('33 c0 c2 08 00'))
            ret=self.raw(source,'005B8400')
            self.assertIn(bytes.fromhex('6a 25 6a 00 56'),ret)
            self.assertIn(bytes.fromhex('85 c0 7e 17'),ret) # refund>0 only
            self.assertIn(bytes.fromhex('3b c7'),ret) # location/home comparison
            self.assertIn(bytes.fromhex('03 cb 85 c9 7f 04'),self.raw(source,'004AE2A0'))
        for source,cap in [('S1',100000),('S2',200000)]:
            self.assertIn(b'\xb8'+struct.pack('<I',cap),self.raw(source,'00486D30'))
            self.assertIn(b'\x3d'+struct.pack('<I',cap),self.raw(source,'0047BCF0'))
        self.assertIn(bytes.fromhex('6a 21'),self.raw('S1','0048D820'))
        self.assertIn(bytes.fromhex('6a 26'),self.raw('S2','0048D820'))
        hook=self.raw('S2','0090CBA0')
        self.assertIn(bytes.fromhex('68 0b 01 00 00'),hook)
        self.assertIn(bytes.fromhex('85 c0 59 75 07 6a 01'),hook)
        self.assertFalse(self.evidence['stockOriginalVerified'])


if __name__=='__main__':unittest.main()
