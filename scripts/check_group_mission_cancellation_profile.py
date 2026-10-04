"""P0-53 grouped cancellation: exact fields/order, sparse domain and replay."""
import copy
import hashlib
import json
from pathlib import Path
import struct
import unittest
from unittest.mock import patch
import group_mission_cancellation_profile as m
from check_mission_cancellation_profile import fixture as basic_fixture
from check_personnel_detachment_profile import read_source_range
from check_capture_relocation_profile import read_bytes

ROOT=Path(__file__).resolve().parents[1]


def fixture(mission=2,source='S1'):
    state,cmd,_,policy=basic_fixture(mission,source)
    base=state['persons'][0]
    state['persons']=[dict(copy.deepcopy(base),id=i,forceId=1,missionArgs=[1,7,501,1000,-123]) for i in (20,10,30,40,50)]
    by_id(state,10)['locationId']=1;by_id(state,30)['status']=5
    for f in state['forces']:f.update(researchId=12,researchDuration=8)
    state.update(personsComplete=True,cities=[{'id':1,'valid':True,'rawCountersA9AC':[-1,0,10,30]}],
                 weaponTypes=[{'id':i,'valid':True} for i in range(12)],
                 researchTypes=[{'id':i,'valid':True} for i in range(36 if source=='S1' else 64)])
    cmd.update(personId=20,id='group-cancel-1')
    obs={'provenance':'synthetic source-helper observations, not original savegame',
         'perPerson':[{'id':i,'returnDistance':2,'s2Skill267':False if source=='S2' else None} for i in (10,20,30,40,50)]}
    policy['id']='record-group-cancellation-v1'
    return [state,cmd,obs,policy]


def by_id(state,i):return next(p for p in state['persons'] if p['id']==i)
def run(f):return m.project_group_cancellation(*f)
def group(t):return next(s['personIds'] for s in t['steps'] if s['helper']=='005B8250')


class Groups(unittest.TestCase):
    def test_two_missions_both_sources_exact_three_and_no_refund(self):
        for source in ('S1','S2'):
            for mission in (2,5):
                f=fixture(mission,source);before=copy.deepcopy(f);t=run(f)
                self.assertTrue(t['accepted']);self.assertEqual(group(t),[10,20,30]);self.assertEqual(f,before)
                self.assertEqual(t,m.replay_group_cancellation(t))
                self.assertEqual(by_id(t['after'],10)['missionId'],37)
                self.assertEqual(by_id(t['after'],10)['missionDuration'],2)
                for i in (20,30):
                    p=by_id(t['after'],i);self.assertEqual(p['missionId'],-1);self.assertEqual(p['missionDuration'],0)
                for i in (10,20,30):self.assertEqual(by_id(t['after'],i)['missionArgs'],[0]*5)
                for i in (40,50):self.assertEqual(by_id(t['after'],i),by_id(f[0],i))
                self.assertEqual(t['after']['bases'],f[0]['bases']);self.assertNotIn('004AE2A0',[s['helper'] for s in t['steps']])
                unknown_returns=[x['personId'] for x in t['unknownEffects'] if x['helper']=='004BF6F0']
                self.assertEqual(unknown_returns,[20])

    def test_group_does_not_filter_owner_location_target_or_actor(self):
        f=fixture();f[1]['personId']=40
        by_id(f[0],10).update(forceId=2,locationId=1086,homeBaseId=-1)
        by_id(f[0],20)['missionArgs'][0]=41
        by_id(f[0],30)['missionArgs'][1]=0
        t=run(f);self.assertEqual(group(t),[10,20,30])
        self.assertEqual(by_id(t['after'],40),by_id(f[0],40))
        self.assertEqual(by_id(t['after'],10)['missionId'],-1) # normalized -1 == home -1
        self.assertEqual(t['after']['cities'][0]['rawCountersA9AC'],[-1,0,11,30])

    def test_matching_is_mission_and_signed_group_only(self):
        for mission in (0,2,5):
            for key in (-2**31,-1,0,2**31-1):
                f=fixture(2);slot=1 if mission==0 else 2
                for p in f[0]['persons']:p['missionId']=mission;p['missionArgs'][slot]=key
                self.assertEqual(m.collect_group(f[0]['persons'],mission,key),[10,20,30])
                by_id(f[0],10)['valid']=False;by_id(f[0],20)['missionId']=1
                by_id(f[0],30)['missionArgs'][slot]=0 if key else 1
                self.assertEqual(m.collect_group(f[0]['persons'],mission,key),[40,50])
        self.assertEqual(m.collect_group([],2,0),[]);self.assertEqual(m.collect_group(f[0]['persons'],9,0),[])

    def test_counter_jump_map_and_signed_input_clamp(self):
        expected={1:0,2:0,3:0,4:1,5:2,6:2,7:2,8:2,9:3,10:3,11:3}
        self.assertEqual(m.COUNTER_INDEX,expected)
        for value in range(-128,128):self.assertEqual(m.counter_after_cancel(value),max(-1,min(30,value+1)))
        for source in ('S1','S2'):
            for weapon in range(12):
                for value in (-128,-2,-1,0,29,30,31,127):
                    f=fixture(2,source);by_id(f[0],20)['missionArgs'][1]=weapon
                    f[0]['cities'][0]['rawCountersA9AC']=[value]*4;t=run(f)
                    want=[value]*4
                    if weapon:want[expected[weapon]]=max(-1,min(30,value+1))
                    self.assertEqual(t['after']['cities'][0]['rawCountersA9AC'],want)
                    step=next(s for s in t['steps'] if s['helper']=='004B3EE0')
                    self.assertEqual(step['actualDelta'],0 if not weapon else want[expected[weapon]]-value)

    def test_invalid_city_skips_counter_but_still_cancels_group(self):
        f=fixture();f[0]['cities'][0]['valid']=False;t=run(f)
        self.assertEqual(t['after']['cities'],f[0]['cities']);self.assertEqual(group(t),[10,20,30])
        self.assertEqual(by_id(t['after'],20)['missionId'],-1)
        f[0]['cities']=[]
        with self.assertRaisesRegex(ValueError,'target city subtype'):run(f)
        # Mission5 does not read city validity outside the omitted presentation path.
        f=fixture(5);f[0]['cities']=[];self.assertTrue(run(f)['accepted'])

    def test_force_reset_uses_actor_force_not_group_member_or_target(self):
        f=fixture(5);f[0]['forces'].append(dict(f[0]['forces'][0],id=2,researchId=15,researchDuration=99))
        by_id(f[0],10)['forceId']=2;t=run(f)
        self.assertEqual((t['after']['forces'][0]['researchId'],t['after']['forces'][0]['researchDuration']),(-1,0))
        self.assertEqual(t['after']['forces'][1],f[0]['forces'][1])
        for valid in (False,True):
            f=fixture(5);f[0]['forces'][0]['valid']=valid;t=run(f)
            self.assertEqual(t['after']['forces'][0]['researchId'],-1 if valid else 12)
            self.assertEqual(by_id(t['after'],20)['missionId'],-1)
        f=fixture(5);by_id(f[0],20)['forceId']=-1;f[0]['forces']=[]
        self.assertEqual(by_id(run(f)['after'],20)['missionId'],-1)

    def test_research_type_range_is_source_specific(self):
        for source,maximum in [('S1',35),('S2',63)]:
            for value in (-2**31,-1,0,35,36,63,64,2**31-1):
                f=fixture(5,source);by_id(f[0],20)['missionArgs'][1]=value;t=run(f)
                self.assertEqual(t['reason'],'group-and-fields-projected' if 0<=value<=maximum else 'command-gate-no-op')
        f=fixture(5,'S2');by_id(f[0],20)['missionArgs'][1]=63;f[0]['researchTypes'][63]['valid']=False
        self.assertEqual(run(f)['reason'],'command-gate-no-op')

    def test_source_effect_order_and_snapshots(self):
        for mission in (2,5):
            f=fixture(mission);t=run(f);steps=t['steps'];names=[s['helper'] for s in steps]
            first_field='004B3EE0' if mission==2 else '004B53E0/004815C0'
            self.assertLess(names.index('005B8250'),names.index(first_field))
            presentation=t['unknownEffects'][0]
            self.assertEqual(presentation['helper'],'005B81D0/004D06A0/0063ADD0')
            self.assertGreater(presentation['beforeStepIndex'],names.index(first_field))
            self.assertLess(presentation['beforeStepIndex'],names.index('005B8400'))
            if mission==5:self.assertLess(names.index(first_field),names.index('004815E0'))
            self.assertEqual([s['personId'] for s in steps if s['helper']=='005B8400'],[10,20,30])
            p20=[s for s in steps if s.get('personId')==20 and 'person' in s]
            self.assertEqual(p20[0]['helper'],'004A5780');self.assertEqual(p20[0]['person']['missionDuration'],7)
            self.assertEqual(p20[1]['helper'],'004A5660');self.assertFalse(p20[1]['person']['acted'])
            self.assertTrue(p20[2]['person']['acted'])

    def test_s2_hook_only_affects_home_branch(self):
        f=fixture(5,'S2')
        for obs in f[2]['perPerson']:obs['s2Skill267']=True
        t=run(f);self.assertTrue(by_id(t['after'],10)['acted'])
        self.assertFalse(by_id(t['after'],20)['acted']);self.assertFalse(by_id(t['after'],30)['acted'])
        by_id(f[0],20)['acted']=True;self.assertTrue(by_id(run(f)['after'],20)['acted'])

    def test_person_then_location_then_city_then_type_short_circuit(self):
        for mission in (2,5):
            for gate in ('actor','location','city','type'):
                f=fixture(mission);p=by_id(f[0],20)
                f[0]['weaponTypes']=[];f[0]['researchTypes']=[];f[0]['cities']=[];f[0]['forces']=[]
                if gate=='actor':p['valid']=False;f[0]['bases']=[]
                elif gate=='location':p['locationId']=87;f[0]['bases']=[]
                elif gate=='city':p['missionArgs'][0]=42
                else:p['missionArgs'][1]=-1
                t=run(f);self.assertEqual(t['reason'],'command-gate-no-op')
                self.assertEqual(t['unknownEffects'],[]);self.assertEqual(t['after']['persons'],f[0]['persons'])
                self.assertNotIn('005B8250',[s['helper'] for s in t['steps']])

    def test_current_building_need_not_be_city(self):
        for mission in (2,5):
            f=fixture(mission);by_id(f[0],20).update(locationId=42,homeBaseId=42)
            f[0]['bases'].append({'id':42,'valid':True,'kind':1,'resourceValid':True,'forceId':1,'money':10})
            self.assertTrue(run(f)['accepted'])

    def test_unknown_reject_revision_replay_and_alias(self):
        for mission in (2,5):
            f=fixture(mission);before=copy.deepcopy(f);f[3]['unknownEffects']='reject';t=run(f)
            self.assertFalse(t['accepted']);self.assertEqual(t['after'],f[0]);self.assertEqual(t['steps'],[])
            self.assertEqual(m.replay_group_cancellation(t),t)
            f[3]['unknownEffects']='record-only';self.assertEqual(f,before);t=run(f)
            again=m.project_group_cancellation(t['after'],*f[1:]);self.assertTrue(again['replayed'])
            conflict=m.project_group_cancellation(t['after'],dict(f[1],personId=40),*f[2:])
            self.assertEqual(conflict['reason'],'replay-payload-conflict')
            stale=m.project_group_cancellation(t['after'],dict(f[1],id='other'),*f[2:])
            self.assertEqual(stale['reason'],'revision-conflict')
            t['after']['persons'][0]['missionArgs'][0]=123;self.assertEqual(f,before)

    def test_late_errors_do_not_partially_write_fields_or_people(self):
        for mission in (2,5):
            f=fixture(mission,'S2');f[2]['perPerson']=[{'id':10,'returnDistance':2,'s2Skill267':None}]
            before=copy.deepcopy(f)
            with self.assertRaisesRegex(ValueError,'query267 required for person 20'):run(f)
            self.assertEqual(f,before)
            f=fixture(mission);f[2]['perPerson']=[];before=copy.deepcopy(f)
            with self.assertRaisesRegex(ValueError,'distance required'):run(f)
            self.assertEqual(f,before)

    def test_preflight_before_all_scalar_writers_and_no_irrelevant_requirements(self):
        for mission in (2,5):
            for missing in (20,30):
                f=fixture(mission,'S2')
                f[2]['perPerson']=[r for r in f[2]['perPerson'] if r['id']!=missing]
                with patch.object(m,'counter_after_cancel') as counter, patch.object(m,'_reset_research') as research, patch.object(m,'_return_zero') as ret:
                    with self.assertRaisesRegex(ValueError,'query267 required for person '+str(missing)):run(f)
                    counter.assert_not_called();research.assert_not_called();ret.assert_not_called()
            f=fixture(mission,'S2')
            f[2]['perPerson']=[r for r in f[2]['perPerson'] if r['id'] in (10,20,30)]
            for r in f[2]['perPerson']:
                if r['id']==10:r['s2Skill267']=None # away bypasses hook
                else:r['returnDistance']=None # home never requests distance
            self.assertTrue(run(f)['accepted'])
            f=fixture(mission)
            f[2]['perPerson']=[{'id':10,'returnDistance':2,'s2Skill267':None}]
            self.assertTrue(run(f)['accepted']) # S1 home needs neither observation

    def test_input_domain(self):
        changes=[lambda f:f[0].update(personsComplete=False),lambda f:f[0].update(personsComplete=1),
            lambda f:f[0]['persons'].append(copy.deepcopy(f[0]['persons'][0])),
            lambda f:f[0]['cities'][0]['rawCountersA9AC'].__setitem__(1,128),
            lambda f:f[0]['cities'][0]['rawCountersA9AC'].__setitem__(1,True),
            lambda f:f[0]['researchTypes'].append({'id':36,'valid':True}),
            lambda f:f[0]['weaponTypes'].append({'id':12,'valid':True}),
            lambda f:f[0]['forces'][0].update(researchDuration=256),
            lambda f:f[0]['persons'][0].update(forceId=47),
            lambda f:f[2]['perPerson'].append(copy.deepcopy(f[2]['perPerson'][0])),
            lambda f:f[2]['perPerson'][0].update(returnDistance=256),
            lambda f:f[2]['perPerson'][0].update(s2Skill267=0),
            lambda f:f[2].update(provenance='')]
        for change in changes:
            f=fixture();change(f);before=copy.deepcopy(f)
            with self.assertRaises(ValueError):run(f)
            self.assertEqual(f,before)

    def test_other_handlers_remain_unsupported_and_vanilla_separate(self):
        for mission in (0,1,9,15,37,38,41):
            f=fixture();by_id(f[0],20)['missionId']=mission;t=run(f)
            self.assertFalse(t['accepted']);self.assertEqual(t['after'],f[0]);self.assertEqual(t['reason'],'unsupported-mission')
        f=fixture();f[3]['ruleset']='PC-Vanilla-assumed'
        self.assertEqual(run(f)['evidence']['runtimeStatus'],'compatibility-assumption')

    def test_resigned_trace_tamper_and_mutable_input_snapshots(self):
        f=fixture();t=run(f);snap=copy.deepcopy(t)
        f[0]['persons'][0]['missionArgs'][0]=3;f[2]['perPerson'].clear();f[3]['id']='changed'
        self.assertEqual(t,snap)
        for change in (lambda q:q['after']['cities'][0]['rawCountersA9AC'].__setitem__(2,25),
                       lambda q:q['steps'].reverse(),lambda q:q['unknownEffects'].clear(),
                       lambda q:q['evidence'].update(stockVerified=True),lambda q:q.update(reason='fake')):
            bad=copy.deepcopy(t);change(bad)
            with self.assertRaises(ValueError):m.replay_group_cancellation(bad)
            bad.pop('traceHash');bad['traceHash']=m.core._digest(bad)
            with self.assertRaises(ValueError):m.replay_group_cancellation(bad)


def read_container(r):
    path=ROOT/'docs/sources/group-mission-cancellation'/r['file']
    lines=path.read_text().splitlines()[r['lineStart']-1:r['lineStart']-1+r['lineCount']]
    out=bytearray();start=end=None
    for line in lines:
        parts=line.split();address=int(parts[0],16);raw=[]
        for token in parts[1:]:
            if len(token)!=2 or any(c not in '0123456789abcdefABCDEF' for c in token):break
            raw.append(int(token,16))
        assert raw
        if start is None:start=address
        if end is not None:assert end==address
        out.extend(raw);end=address+len(raw)
    return start,end,bytes(out)


class Evidence(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.e=json.loads((ROOT/'docs/sources/group-mission-cancellation.json').read_text());prior={};cls.raw={}
        for entry in cls.e['priorEvidence']:
            path=ROOT/entry['path'];assert hashlib.sha256(path.read_bytes()).hexdigest()==entry['sha256']
            prior[entry['id']]=json.loads(path.read_text())
        for ref in cls.e['referencedRanges']:
            manifest=prior[ref['evidence']];key='ranges' if ref['evidence']=='P0-51' else 'newRanges'
            row=next(r for r in manifest[key] if (r['source'],r['start'])==(ref['source'],ref['start']))
            assert all(row[k]==ref[k] for k in ('source','start','endExclusive','sha256'))
            if ref['evidence']=='P0-51':start,end,raw=read_source_range(row)
            else:start,end,raw=read_bytes(ROOT/'docs/sources/mission-cancellation-zero-refund'/row['file'])
            assert (start,end,hashlib.sha256(raw).hexdigest())==(int(row['start'],16),int(row['endExclusive'],16),row['sha256'])
            cls.raw[row['source'],row['start']]=raw
        for c in cls.e['containers']:
            path=ROOT/'docs/sources/group-mission-cancellation'/c['file']
            assert hashlib.sha256(path.read_bytes()).hexdigest()==c['sha256']
            assert len(path.read_text().splitlines())==c['lineCount']
        for r in cls.e['newRanges']:
            start,end,raw=read_container(r)
            assert (start,end,hashlib.sha256(raw).hexdigest())==(int(r['start'],16),int(r['endExclusive'],16),r['sha256'])
            cls.raw[r['source'],r['start']]=raw
        for r in cls.e['comparisons']:
            for sid in ('S1','S2'):assert hashlib.sha256(cls.raw[sid,r['start']]).hexdigest()==r[sid+'sha256']
            assert r['identical']==(cls.raw['S1',r['start']]==cls.raw['S2',r['start']])

    def call_at(self,source,function,address,target):
        raw=self.raw[source,function];offset=address-int(function,16)
        self.assertEqual(raw[offset],0xe8)
        self.assertEqual(address+5+struct.unpack('<i',raw[offset+1:offset+5])[0],target)

    def test_handler_source_order_and_zero_refund_calls(self):
        for source in ('S1','S2'):
            for f,group,field,presentation,ret in [('005C6AA0',0x5c6b6a,0x5c6bcd,0x5c6bd3,0x5c6c74),
                                                  ('005D7FC0',0x5d8092,0x5d80c9,0x5d80cf,0x5d81d4)]:
                self.call_at(source,f,group,0x5b8250)
                self.call_at(source,f,field,0x4b3ee0 if f=='005C6AA0' else 0x4b53e0)
                self.call_at(source,f,presentation,0x5b81d0);self.call_at(source,f,ret,0x5b8400)
                self.assertLess(group,field);self.assertLess(field,presentation);self.assertLess(presentation,ret)
                raw=self.raw[source,f];o=ret-int(f,16)
                self.assertEqual(raw[o-3:o],bytes.fromhex('6a 00 57'))
                self.assertIn(bytes.fromhex('6a 03 8d 4c 24'),raw)
                self.assertEqual(raw,self.raw['S1',f])

    def test_group_filter_counter_jump_tables_and_writers(self):
        for source in ('S1','S2'):
            raw=self.raw[source,'005B8250']
            for hexes in ('81 fb 4c 04 00 00','39 86 3c 01 00 00','3b 44 24 18',
                          '39 7c 24 20 7e 45','bd 02 00 00 00','bd 01 00 00 00'):
                self.assertIn(bytes.fromhex(hexes),raw)
            mapping=list(self.raw[source,'004B4028'])
            self.assertEqual(mapping,[m.COUNTER_INDEX[i] for i in range(1,12)])
            self.assertEqual(struct.unpack('<4I',self.raw[source,'004B4018']),(0x4b3f18,0x4b3f58,0x4b3f98,0x4b3fd8))
            raw=self.raw[source,'004B3EE0']
            for offset in (0xa9,0xaa,0xab,0xac):
                self.assertIn(bytes.fromhex('0f be b7')+struct.pack('<I',offset),raw)
                self.assertIn(bytes.fromhex('88 9f')+struct.pack('<I',offset),raw)
            self.assertEqual(raw.count(bytes.fromhex('83 fb ff')),4)
            self.assertEqual(raw.count(bytes.fromhex('83 fb 1e')),4)
            self.call_at(source,'004B53E0',0x4b53f9,0x4815c0)
            self.call_at(source,'004B53E0',0x4b5405,0x4815e0)
            self.assertIn(bytes.fromhex('89 81 9c 00 00 00'),self.raw[source,'004815C0'])
            self.assertIn(bytes.fromhex('88 81 a0 00 00 00'),self.raw[source,'004815E0'])

    def test_s2_extended_research_getter_and_independent_evidence(self):
        self.assertIn(bytes.fromhex('83 f8 23'),self.raw['S1','004815C0'])
        self.assertIn(bytes.fromhex('83 f8 3f'),self.raw['S2','004815C0'])
        self.assertEqual(self.raw['S1','00490C70'][-5:],bytes.fromhex('33 c0 c2 04 00'))
        raw=self.raw['S2','00490C70'];self.assertEqual(raw[-5],0xe9)
        self.assertEqual(0x490c8a+5+struct.unpack('<i',raw[-4:])[0],0x914000)
        hook=self.raw['S2','00914000']
        self.assertEqual(hook,bytes.fromhex('83 f8 3f 77 0d 83 e8 24 6b c0 6c 05 00 00 9a 00 eb 02 31 c0 c2 04 00'))
        self.assertEqual(len(self.e['newRanges']),21);self.assertEqual(len(self.e['referencedRanges']),25)
        self.assertEqual(sum(not r['identical'] for r in self.e['comparisons']),2)
        self.assertFalse(self.e['stockOriginalVerified']);self.assertFalse(self.e['originalExeExecuted'])
        self.assertEqual(self.e['adoption']['PC-Vanilla-assumed'],'compatibility-assumption')


if __name__=='__main__':unittest.main()
