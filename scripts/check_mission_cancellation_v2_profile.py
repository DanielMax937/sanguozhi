"""P0-52 six zero-refund handlers, their gates, byte anchors and v1 isolation."""
import copy
import hashlib
import json
from pathlib import Path
import struct
import unittest
import mission_cancellation_v2_profile as m
import mission_cancellation_profile as old
from check_mission_cancellation_profile import fixture as old_fixture
from check_personnel_detachment_profile import read_source_range
from check_capture_relocation_profile import read_bytes

ROOT=Path(__file__).resolve().parents[1]


def fixture(mission=9,source='S1'):
    f=list(old_fixture(mission,source))
    f[2].update(targetBuildings=[],targetCities=[{'id':1,'valid':True}])
    if source=='S2':f[2]['s2Skill267']=False
    f[3]['id']='record-zero-refund-cancellation-v2'
    return f


def person(t):return t['after']['persons'][0]


class ZeroRefund(unittest.TestCase):
    def test_all_six_home_and_away_sources_replay(self):
        for source in ('S1','S2'):
            for mission in m.ZERO_REFUND_MISSIONS:
                for away in (False,True):
                    f=fixture(mission,source);f[0]['persons'][0]['locationId']=int(away)
                    f[2]['returnDistance']=4;before=copy.deepcopy(f);t=m.project_cancellation(*f)
                    self.assertEqual(f,before);self.assertTrue(t['accepted']);self.assertEqual(m.replay_cancellation(t),t)
                    p=person(t);self.assertEqual(p['missionId'],37 if away else -1)
                    self.assertEqual(p['missionArgs'],[0]*5);self.assertEqual(p['missionDuration'],4 if away else 0)
                    self.assertTrue(p['acted']);self.assertEqual(t['after']['bases'],f[0]['bases'])
                    self.assertEqual(t['after']['forces'],f[0]['forces']);self.assertEqual(t['after']['persons'][1],f[0]['persons'][1])
                    steps=t['steps'];helpers=[x['helper'] for x in steps]
                    self.assertNotIn('004AE2A0',helpers);self.assertNotIn('005BC9F0',helpers)
                    self.assertEqual(next(x for x in steps if x['helper']=='005B8400')['refund'],0)
                    self.assertLess(helpers.index(m.HANDLERS[mission]),helpers.index('005B8400'))
                    if away:self.assertLess(helpers.index('004A73A0'),helpers.index('004A5660'))
                    else:self.assertLess(helpers.index('004A5780'),helpers.index('004A5660'))

    def test_gate_short_circuits_person_then_current_then_target(self):
        for mission in m.ZERO_REFUND_MISSIONS:
            for invalid in ('actor','location-range','current'):
                f=fixture(mission);p=f[0]['persons'][0];p['missionArgs'][0]=46
                f[2]['targetCities']=[];f[0]['forces']=[]
                if invalid=='actor':p['valid']=False;f[0]['bases']=[]
                elif invalid=='location-range':p['locationId']=87;f[0]['bases']=[]
                else:f[0]['bases'][0]['valid']=False
                t=m.project_cancellation(*f)
                self.assertEqual(t['reason'],'command-gate-no-op');self.assertEqual(person(t),p)
                self.assertEqual(t['unknownEffects'],[])
                self.assertFalse(any('targetId' in s or 'argumentIndex' in s for s in t['steps']))

    def test_current_location_not_home_is_the_gate(self):
        for mission in m.ZERO_REFUND_MISSIONS:
            f=fixture(mission);f[0]['persons'][0].update(homeBaseId=-1,locationId=1)
            f[2]['returnDistance']=-1;t=m.project_cancellation(*f)
            self.assertEqual(person(t)['missionId'],37);self.assertEqual(person(t)['missionDuration'],255)
            f[0]['persons'][0].update(homeBaseId=0,locationId=1086)
            self.assertEqual(m.project_cancellation(*f)['reason'],'command-gate-no-op')

    def test_9_10_target_only_checks_integer_range(self):
        for mission in (9,10):
            for value in (-2**31,-1,0,86,87,1099,1100,16383,16384,2**31-1):
                f=fixture(mission);f[0]['persons'][0]['missionArgs'][0]=value
                f[0]['forces']=[] # the actor-force read is presentation-only, not a gate
                t=m.project_cancellation(*f)
                self.assertEqual(person(t)['missionId'],-1 if 0<=value<=16383 else mission)
                self.assertEqual(t['after']['bases'],f[0]['bases'])

    def test_12_target_validity_is_not_a_gate(self):
        for value in (-1,0,10,11,1099,1100):
            f=fixture(12);f[0]['persons'][0]['missionArgs'][0]=value
            f[0]['persons'][1]['valid']=False
            t=m.project_cancellation(*f)
            self.assertEqual(person(t)['missionId'],-1 if 0<=value<=1099 else 12)
            # Missing target person 1099 is legal in the scalar domain: no validity read.

    def test_22_force_validity_not_merely_range(self):
        for valid in (False,True):
            f=fixture(22);f[0]['forces'][0]['valid']=valid
            self.assertEqual(person(m.project_cancellation(*f))['missionId'],-1 if valid else 22)
        for value in (-1,47,2**31-1):
            f=fixture(22);f[0]['persons'][0]['missionArgs'][0]=value;f[0]['forces']=[]
            self.assertEqual(m.project_cancellation(*f)['reason'],'command-gate-no-op')
        f=fixture(22);f[0]['forces']=[]
        with self.assertRaisesRegex(ValueError,'missing observed target force'):m.project_cancellation(*f)

    def test_23_city_subtype_not_building_validity(self):
        for city,valid in [(0,True),(1,False),(41,True)]:
            f=fixture(23);f[0]['persons'][0]['missionArgs'][0]=city
            f[2]['targetCities']=[{'id':city,'valid':valid}]
            self.assertEqual(person(m.project_cancellation(*f))['missionId'],-1 if valid else 23)
        for city in (-1,42,16383):
            f=fixture(23);f[0]['persons'][0]['missionArgs'][0]=city;f[2]['targetCities']=[]
            self.assertEqual(m.project_cancellation(*f)['reason'],'command-gate-no-op')
        f=fixture(23);f[2]['targetCities']=[]
        with self.assertRaisesRegex(ValueError,'target city subtype'):m.project_cancellation(*f)

    def test_24_includes_nonbase_buildings(self):
        for target in (0,1,86,87,1099,16383):
            for valid in (False,True):
                f=fixture(24);f[0]['persons'][0]['missionArgs'][0]=target
                if target<2:
                    f[0]['bases'][target]['valid']=valid
                else:f[2]['targetBuildings']=[{'id':target,'valid':valid}]
                self.assertEqual(person(m.project_cancellation(*f))['missionId'],-1 if valid else 24)
        for target in (-1,16384,2**31-1):
            f=fixture(24);f[0]['persons'][0]['missionArgs'][0]=target
            self.assertEqual(m.project_cancellation(*f)['reason'],'command-gate-no-op')

    def test_s2_acted_hook_and_captive_boundary(self):
        for mission in m.ZERO_REFUND_MISSIONS:
            f=fixture(mission,'S2');f[2]['s2Skill267']=True;f[0]['persons'][0]['status']=5
            t=m.project_cancellation(*f);self.assertFalse(person(t)['acted'])
            self.assertNotIn('004BF6F0',[x['helper'] for x in t['unknownEffects']])
            f[0]['persons'][0]['locationId']=1;f[2]['returnDistance']=255
            t=m.project_cancellation(*f);self.assertTrue(person(t)['acted'])
            self.assertNotIn('0090CBA0',[x['helper'] for x in t['steps']])

    def test_atomic_reject_and_replay_conflicts(self):
        for mission in m.ZERO_REFUND_MISSIONS:
            f=fixture(mission);before=copy.deepcopy(f);f[3]['unknownEffects']='reject'
            t=m.project_cancellation(*f);self.assertFalse(t['accepted']);self.assertEqual(t['after'],f[0]);self.assertEqual(t['steps'],[])
            f[3]['unknownEffects']='record-only';self.assertEqual(f,before);t=m.project_cancellation(*f)
            again=m.project_cancellation(t['after'],*f[1:]);self.assertTrue(again['replayed']);self.assertEqual(again['after'],t['after'])
            conflict=m.project_cancellation(t['after'],dict(f[1],personId=11),*f[2:])
            self.assertEqual(conflict['reason'],'replay-payload-conflict')
            stale=m.project_cancellation(t['after'],dict(f[1],id='new'),*f[2:])
            self.assertEqual(stale['reason'],'revision-conflict')

    def test_errors_are_atomic_even_after_gate_and_mutation_stage(self):
        mutations=[lambda f:f[0]['bases'].clear(),
            lambda f:f[0]['persons'][0].update(locationId=1),
            lambda f:f[0].update(source='S2'),
            lambda f:f[2].update(returnDistance=256),
            lambda f:f[2].update(targetBuildings=[{'id':1,'valid':False}]),
            lambda f:f[2].update(targetCities=[{'id':1,'valid':True}]*2),
            lambda f:f[2].update(targetBuildings=[{'id':16384,'valid':True}]),
            lambda f:f[2].update(targetCities=[{'id':42,'valid':True}]),
            lambda f:f[2].update(targetBuildings=[{'id':87,'valid':1}])]
        for mutate in mutations:
            f=fixture();mutate(f);before=copy.deepcopy(f)
            with self.assertRaises(ValueError):m.project_cancellation(*f)
            self.assertEqual(f,before)

    def test_v1_unchanged_and_prior_handlers_equivalent(self):
        for mission in range(44):
            f=fixture(mission);g=copy.deepcopy(f);g[2].pop('targetBuildings');g[2].pop('targetCities')
            t=m.project_cancellation(*f);v1=old.project_cancellation(*g)
            if mission not in m.ZERO_REFUND_MISSIONS:
                self.assertEqual(t['after'],v1['after']);self.assertEqual(t['unknownEffects'],v1['unknownEffects'])
                self.assertEqual(t['reason'],v1['reason'])
            else:self.assertEqual(v1['reason'],'unresolved-handler')
            self.assertEqual(old.replay_cancellation(v1),v1)
            with self.assertRaises(ValueError):m.replay_cancellation(v1)

    def test_full_trace_tampering(self):
        for mission in m.ZERO_REFUND_MISSIONS:
            f=fixture(mission);t=m.project_cancellation(*f)
            for mutate in (lambda q:q['after']['persons'][0].update(acted=False),
                           lambda q:q.update(reason='fiction'),
                           lambda q:q['steps'].reverse(),
                           lambda q:q['unknownEffects'].clear(),
                           lambda q:q['evidence'].update(stockVerified=True)):
                bad=copy.deepcopy(t);mutate(bad)
                with self.assertRaises(ValueError):m.replay_cancellation(bad)
                bad.pop('traceHash');bad['traceHash']=m._digest(bad)
                with self.assertRaises(ValueError):m.replay_cancellation(bad)
        f[3]['ruleset']='PC-Vanilla-assumed'
        self.assertEqual(m.project_cancellation(*f)['evidence']['runtimeStatus'],'compatibility-assumption')


class Evidence(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.e=json.loads((ROOT/'docs/sources/mission-cancellation-zero-refund.json').read_text())
        path=ROOT/cls.e['priorEvidence']['path']
        assert hashlib.sha256(path.read_bytes()).hexdigest()==cls.e['priorEvidence']['sha256']
        prior=json.loads(path.read_text());cls.raw={}
        for ref in cls.e['referencedRanges']:
            r=next(r for r in prior['ranges'] if (r['source'],r['start'])==(ref['source'],ref['start']))
            assert all(r[k]==ref[k] for k in ref)
            start,end,raw=read_source_range(r)
            assert (start,end,hashlib.sha256(raw).hexdigest())==(int(r['start'],16),int(r['endExclusive'],16),r['sha256'])
            cls.raw[(r['source'],r['start'])]=raw
        for r in cls.e['newRanges']:
            start,end,raw=read_bytes(ROOT/'docs/sources/mission-cancellation-zero-refund'/r['file'])
            assert (start,end,hashlib.sha256(raw).hexdigest())==(int(r['start'],16),int(r['endExclusive'],16),r['sha256'])
            cls.raw[(r['source'],r['start'])]=raw

    def test_all_six_byte_bodies_and_direct_zero_call(self):
        self.assertEqual([r['missionId'] for r in self.e['handlers']],list(m.ZERO_REFUND_MISSIONS))
        for r in self.e['handlers']:
            a=r['handler'];self.assertEqual(a,m.HANDLERS[r['missionId']])
            self.assertEqual(self.raw['S1',a],self.raw['S2',a])
            for source in ('S1','S2'):
                raw=self.raw[source,a]
                # PUSH 0; PUSH ESI; CALL 005B8400 must be the handler's final call.
                positions=[i for i in range(len(raw)-8) if raw[i:i+4]==bytes.fromhex('6a 00 56 e8')]
                calls=[(i,int(a,16)+i+8+struct.unpack('<i',raw[i+4:i+8])[0]) for i in positions]
                self.assertEqual([target for _,target in calls if target==0x5b8400],[0x5b8400])
                i=next(i for i,target in calls if target==0x5b8400);self.assertNotIn(b'\xe8',raw[i+8:])
                self.assertIn(bytes.fromhex('b8 01 00 00 00'),raw[i+8:])
                self.assertIn(bytes.fromhex('83 f8 56'),raw[:110])
                self.assertEqual(r['return']['refund'],0)

    def test_range_and_target_pointer_opcode_anchors(self):
        for source in ('S1','S2'):
            for address in ('005CB050','005D5DD0'):
                self.assertIn(bytes.fromhex('81 ff ff 3f 00 00'),self.raw[source,address])
            self.assertIn(bytes.fromhex('3d 4b 04 00 00'),self.raw[source,'005C4E70'])
            self.assertIn(bytes.fromhex('83 f8 29'),self.raw[source,'005B6D00'])
            for address,limit in [('00490D00','3d ff 3f 00 00'),('00490AA0','83 f8 2e'),('00490A10','83 f8 29')]:
                self.assertIn(bytes.fromhex(limit),self.raw[source,address])
            # Mission12 resolves a target pointer, then immediately prepares presentation,
            # with no call to IsLegalPtr(target) in between.
            raw=self.raw[source,'005C4E70'];start=0x5c4e70
            self.assertEqual(start+0x70+5+struct.unpack('<i',raw[0x71:0x75])[0],0x490b00)
            self.assertEqual(raw[0x75:0x78],bytes.fromhex('56 8b f8'))
            self.assertEqual(start+0x78+5+struct.unpack('<i',raw[0x79:0x7d])[0],0x5b81d0)
        self.assertFalse(self.e['stockOriginalVerified']);self.assertFalse(self.e['originalExeExecuted'])
        self.assertEqual(self.e['adoption']['PC-Vanilla-assumed'],'compatibility-assumption')


if __name__=='__main__':unittest.main()
