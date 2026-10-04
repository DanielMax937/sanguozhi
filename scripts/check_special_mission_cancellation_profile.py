"""P0-55 independent API/gate/order/atomicity/replay regression checks."""
import copy
import itertools
import random
import unittest
from unittest.mock import patch
import special_mission_cancellation_profile as m


def fixture(source='S1',mission=41,location=4,home=4):
    person=dict(id=7,allocated=True,valid=True,status=2,homeBaseId=home,locationId=location,
                missionId=mission,missionArgs=[97,16383,9,-99,123],missionDuration=23,acted=False)
    state=dict(source=source,revision=0,appliedCommands=[],persons=[person],
               buildings=[dict(id=16383,valid=True)],capabilityTraining=[dict(id=97,valid=True)])
    command=dict(id='cancel-training',expectedRevision=0,personId=7)
    observations=dict(provenance='synthetic source-bound observation',returnDistance=12,s2Skill267=False)
    policy=dict(id='record-special-cancellation-v1',ruleset='PC-PK1.1',unknownEffects='record-only',
                provenance='explicit bounded test policy',callbackAssumption='noninterference-v1')
    return [state,command,observations,policy]


def run(f):return m.project_special_cancellation(*f)
def actor(t):return t['after']['persons'][0]
def helpers(t):return [s['helper'] for s in t['steps']]


class SpecialCancellation(unittest.TestCase):
    def test_all_missions_sources_and_full_replay(self):
        for source,mission in itertools.product(('S1','S2'),(41,42,43)):
            f=fixture(source,mission);before=copy.deepcopy(f);t=run(f)
            self.assertTrue(t['accepted']);self.assertEqual(f,before)
            self.assertEqual(actor(t)['missionId'],-1);self.assertEqual(actor(t)['missionArgs'],[0]*5)
            self.assertEqual(actor(t)['missionDuration'],0);self.assertTrue(actor(t)['acted'])
            self.assertEqual(t,m.replay_special_cancellation(t))
            self.assertEqual(t['after']['buildings'],f[0]['buildings'])
            self.assertEqual(t['after']['capabilityTraining'],f[0]['capabilityTraining'])
            self.assertFalse(t['evidence']['stockVerified']);self.assertFalse(t['evidence']['vanillaVerified'])

    def test_gate_order_and_argument_indices(self):
        t=run(fixture());g=[s for s in t['steps'] if 'subject' in s]
        self.assertEqual([x['subject'] for x in g],['actor','target-building','capability-training'])
        self.assertEqual([x['argumentIndex'] for x in g[1:]],[1,0])
        self.assertEqual([x['maximum'] for x in g[1:]],[16383,97])
        self.assertEqual(t['steps'][-1],dict(helper='005D9C60',returnValue=1,refund=0))

    def test_invalid_actor_short_circuits_every_dependency(self):
        f=fixture();f[0]['persons'][0]['valid']=False;f[0]['buildings']=[];f[0]['capabilityTraining']=[]
        f[2].update(returnDistance=None,s2Skill267=None);t=run(f)
        self.assertEqual(t['reason'],'command-gate-no-op');self.assertEqual(t['unknownEffects'],[])
        self.assertEqual(actor(t),f[0]['persons'][0]);self.assertEqual(t['steps'][-1]['returnValue'],0)

    def test_entry_gate_and_unsupported_do_not_fake_other_implementations(self):
        for mission in (-1,44,-2**31,2**31-1):
            f=fixture(mission=mission);f[0]['buildings']=[];f[0]['capabilityTraining']=[]
            t=run(f);self.assertEqual(t['reason'],'entry-gate-no-op');self.assertTrue(t['accepted'])
        f=fixture();f[0]['persons'][0].update(allocated=False,valid=False)
        self.assertEqual(run(f)['reason'],'entry-gate-no-op')
        for mission in (0,2,5,9,15,37,38,40):
            t=run(fixture(mission=mission));self.assertFalse(t['accepted'])
            self.assertEqual(t['reason'],'unsupported-mission');self.assertEqual(t['after'],t['before'])

    def test_building_out_of_range_and_invalid_short_circuit_record_gate(self):
        for target in (-2**31,-1,16384,2**31-1):
            f=fixture();f[0]['persons'][0]['missionArgs'][1]=target;f[0]['buildings']=[];f[0]['capabilityTraining']=[]
            t=run(f);self.assertEqual(t['reason'],'command-gate-no-op')
            self.assertNotIn('00490F50/0047A630',helpers(t))
        f=fixture();f[0]['buildings'][0]['valid']=False;f[0]['capabilityTraining']=[]
        f[2].update(returnDistance=None,s2Skill267=None)
        self.assertEqual(run(f)['reason'],'command-gate-no-op')

    def test_building_and_training_domain_endpoints(self):
        for building,training in itertools.product((0,86,87,1099,1100,16383),(0,97)):
            f=fixture();f[0]['persons'][0]['missionArgs'][:2]=[training,building]
            f[0]['buildings']=[dict(id=building,valid=True)];f[0]['capabilityTraining']=[dict(id=training,valid=True)]
            self.assertEqual(run(f)['reason'],'special-cancellation-projected')
        for training in (-2**31,-1,98,1099,16383,2**31-1):
            f=fixture();f[0]['persons'][0]['missionArgs'][0]=training;f[0]['capabilityTraining']=[]
            self.assertEqual(run(f)['reason'],'command-gate-no-op')
        f=fixture();f[0]['capabilityTraining'][0]['valid']=False
        self.assertEqual(run(f)['reason'],'command-gate-no-op')

    def test_missing_reached_slots_are_errors_not_invalid(self):
        for name in ('buildings','capabilityTraining'):
            f=fixture();f[0][name]=[];before=copy.deepcopy(f)
            with self.assertRaisesRegex(ValueError,'missing observed'):run(f)
            self.assertEqual(f,before)

    def test_no_current_or_home_validity_gate(self):
        for source,location in itertools.product(('S1','S2'),(-1,0,86,87,1086)):
            f=fixture(source,location=location,home=16383)
            # Same observed slot is valid solely because args[1] uses it.
            # Current -1/0/86 never requires a building observation.
            t=run(f);self.assertTrue(t['accepted']);self.assertEqual(actor(t)['missionId'],37)
            self.assertEqual(actor(t)['locationId'],location)
            self.assertEqual(actor(t)['homeBaseId'],16383)
            self.assertEqual(actor(t)['missionDuration'],12)
            self.assertFalse(any(s.get('subject')=='current-building' for s in t['steps']))
        f=fixture(home=5);f[0]['buildings'].append(dict(id=4,valid=False));f[0]['buildings'].append(dict(id=5,valid=False))
        self.assertTrue(run(f)['accepted'])

    def test_troop_location_equals_invalid_home_sentinel_resets(self):
        for source,location,query,status in itertools.product(('S1','S2'),(-1,87,1086),(False,True),(2,5)):
            f=fixture(source,location=location,home=-1);f[0]['persons'][0]['status']=status
            f[2].update(returnDistance=None,s2Skill267=query);t=run(f)
            self.assertEqual(actor(t)['missionId'],-1);self.assertEqual(actor(t)['missionDuration'],0)
            self.assertEqual(actor(t)['acted'],not(source=='S2' and query))
            self.assertNotIn('0049E4D0',helpers(t))
            calls=[e for e in t['unknownEffects'] if e['helper']=='004BF6F0']
            self.assertEqual(len(calls),int(status!=5))
            if calls:self.assertEqual(calls[0]['arguments'],[7,-1,0,1])

    def test_return_distance_low_byte_and_no_refund(self):
        for distance in (-1,0,1,254,255):
            f=fixture(location=87);f[2].update(returnDistance=distance,s2Skill267=None);t=run(f)
            self.assertEqual(actor(t)['missionDuration'],distance&255)
            self.assertEqual(actor(t)['missionArgs'],[0]*5);self.assertTrue(actor(t)['acted'])
            self.assertNotIn('004AE2A0',helpers(t));self.assertNotIn('0090CBA0',helpers(t))

    def test_preflight_is_before_any_scalar_writer(self):
        for source,location,home,key in [('S1',87,4,'returnDistance'),('S2',4,4,'s2Skill267'),('S2',87,-1,'s2Skill267')]:
            f=fixture(source,location=location,home=home);f[2][key]=None;before=copy.deepcopy(f)
            with patch.object(m,'_return_zero',side_effect=AssertionError('writer reached')):
                with self.assertRaisesRegex(ValueError,'observed'):run(f)
            self.assertEqual(f,before)
        f=fixture('S2',location=87);f[0]['capabilityTraining'][0]['valid']=False
        f[2].update(returnDistance=None,s2Skill267=None)
        self.assertEqual(run(f)['reason'],'command-gate-no-op')

    def test_reset_stage_order_and_snapshot_isolation(self):
        t=run(fixture());h=helpers(t)
        self.assertLess(h.index('004A5780'),h.index('004A5660'))
        self.assertLess(h.index('004A5660'),h.index('004A5600/00489B40'))
        p=next(s['person'] for s in t['steps'] if s['helper']=='004A5780')
        self.assertEqual((p['missionId'],p['missionDuration'],p['acted']),(-1,23,False))
        p=next(s['person'] for s in t['steps'] if s['helper']=='004A5660')
        self.assertEqual((p['missionDuration'],p['acted']),(0,False))
        unknown=t['unknownEffects'];self.assertEqual(unknown[0]['snapshot']['persons'][0]['missionId'],41)
        self.assertEqual(unknown[-1]['snapshot']['persons'][0]['missionId'],-1)
        unknown[-1]['snapshot']['persons'][0]['missionArgs'][0]=999
        self.assertEqual(actor(t)['missionArgs'],[0]*5)

    def test_away_stage_order_and_snapshots(self):
        t=run(fixture(location=87));h=helpers(t)
        self.assertLess(h.index('0049E4D0'),h.index('004A73A0'))
        self.assertLess(h.index('004A73A0'),h.index('004A5660'))
        before_duration=next(s['person'] for s in t['steps'] if s['helper']=='004A73A0')
        self.assertEqual((before_duration['missionId'],before_duration['missionDuration'],before_duration['acted']),(37,23,True))
        self.assertEqual(t['unknownEffects'][1]['snapshot']['persons'][0],before_duration)

    def test_presentation_is_conditional_and_uses_home_not_argument_or_location(self):
        for mission in (41,42,43):
            f=fixture(mission=mission,home=-1,location=87);t=run(f);event=t['unknownEffects'][0]
            self.assertEqual(event['helper'],'005B81D0/005DA320/0063B180')
            self.assertEqual(event['notificationHomeId'],-1)
            self.assertEqual(event['capabilityTrainingId'],97)
            self.assertEqual(event['vtableSlot'],m.PRESENTATION_SLOTS[mission])
            self.assertFalse(event['conditionEvaluated']);self.assertFalse(event['notificationHomeValidityChecked'])
            self.assertFalse(t['evidence']['callbacksExecuted'])

    def test_s2_same_location_acted_hook_only(self):
        for initial,query in itertools.product((False,True),(False,True)):
            f=fixture('S2');f[0]['persons'][0]['acted']=initial;f[2]['s2Skill267']=query
            t=run(f);self.assertEqual(actor(t)['acted'],initial or not query)
        f=fixture('S1');f[2]['s2Skill267']=None;self.assertTrue(actor(run(f))['acted'])

    def test_record_reject_atomicity_and_noop_policy(self):
        for source,location,home in itertools.product(('S1','S2'),(4,87),(-1,4)):
            f=fixture(source,location=location,home=home);f[3]['unknownEffects']='reject';before=copy.deepcopy(f)
            t=run(f);self.assertFalse(t['accepted']);self.assertEqual(t['after'],f[0]);self.assertEqual(t['steps'],[])
            self.assertTrue(t['unknownEffects']);self.assertEqual(t,m.replay_special_cancellation(t));self.assertEqual(f,before)
        f=fixture();f[3]['unknownEffects']='reject';f[0]['buildings'][0]['valid']=False
        self.assertTrue(run(f)['accepted'])

    def test_replay_guard_revision_and_payload_conflict(self):
        f=fixture();t=run(f);f[0]=copy.deepcopy(t['after']);r=run(f)
        self.assertEqual(r['reason'],'replay');self.assertEqual(r['after'],t['after'])
        f[1]['expectedRevision']=1;self.assertEqual(run(f)['reason'],'replay-payload-conflict')
        f=fixture();f[1]['expectedRevision']=1;self.assertEqual(run(f)['reason'],'revision-conflict')
        f=fixture();f[0]['revision']=2**31-1;f[1]['expectedRevision']=2**31-1
        with self.assertRaisesRegex(ValueError,'exhausted'):run(f)

    def test_trace_hash_and_resigned_output_tampering(self):
        for resign in (False,True):
            t=run(fixture());t['after']['persons'][0]['missionDuration']=9
            if resign:t['traceHash']=m.core._digest({k:v for k,v in t.items() if k!='traceHash'})
            with self.assertRaises(ValueError):m.replay_special_cancellation(t)
        t=run(fixture());t['profileId']='old-api';t['traceHash']=m.core._digest({k:v for k,v in t.items() if k!='traceHash'})
        with self.assertRaisesRegex(ValueError,'replay mismatch'):m.replay_special_cancellation(t)

    def test_structural_rejection_strict_domains_and_policy(self):
        mutations=[lambda f:f[0].update(extra=True),lambda f:f[0].update(source='stock'),
                   lambda f:f[0]['persons'][0].update(homeBaseId=16384),lambda f:f[0]['persons'][0].update(locationId=1087),
                   lambda f:f[0]['persons'][0].update(missionArgs=[0]*6),lambda f:f[0]['persons'][0].update(status=True),
                   lambda f:f[0]['persons'][0].update(valid=True,allocated=False),lambda f:f[0]['persons'].append(copy.deepcopy(f[0]['persons'][0])),
                   lambda f:f[0]['buildings'].append(copy.deepcopy(f[0]['buildings'][0])),lambda f:f[0]['buildings'][0].update(id=True),
                   lambda f:f[0]['capabilityTraining'][0].update(id=98),lambda f:f[0]['capabilityTraining'][0].update(valid=1),
                   lambda f:f[0]['capabilityTraining'].append(copy.deepcopy(f[0]['capabilityTraining'][0])),
                   lambda f:f[2].update(returnDistance=256),lambda f:f[2].update(returnDistance=True),
                   lambda f:f[2].update(s2Skill267=1),lambda f:f[2].update(provenance=''),
                   lambda f:f[3].pop('callbackAssumption'),lambda f:f[3].update(callbackAssumption='guaranteed'),
                   lambda f:f[3].update(unknownEffects='execute'),lambda f:f[3].update(ruleset='Vanilla')]
        for mutate in mutations:
            f=fixture();mutate(f);before=copy.deepcopy(f)
            with self.assertRaises(ValueError):run(f)
            self.assertEqual(f,before)

    def test_vanilla_explicit_assumption_and_old_modules_unchanged(self):
        f=fixture();f[3]['ruleset']='PC-Vanilla-assumed'
        self.assertEqual(run(f)['evidence']['runtimeStatus'],'compatibility-assumption')
        import mission_cancellation_profile as v1
        self.assertNotEqual(m.PROFILE_ID,v1.PROFILE_ID);self.assertNotEqual(m.PROFILE_ID,m.core.PROFILE_ID)
        self.assertEqual(m.core.ZERO_REFUND_MISSIONS,(9,10,12,22,23,24))

    def test_deterministic_boundary_fuzz(self):
        rng=random.Random(551)
        for _ in range(360):
            source=rng.choice(('S1','S2'));loc=rng.choice((-1,0,4,86,87,1086));home=rng.choice((-1,0,4,86,87,16383))
            f=fixture(source,rng.choice((41,42,43)),loc,home);f[2]['returnDistance']=rng.choice((-1,0,1,128,255));f[2]['s2Skill267']=bool(rng.getrandbits(1))
            f[0]['persons'][0]['status']=rng.randrange(-1,9);f[0]['persons'][0]['acted']=bool(rng.getrandbits(1));old=copy.deepcopy(f[0]['persons'][0]);t=run(f)
            normalized=loc if 0<=loc<=86 else -1
            self.assertEqual(actor(t)['missionId'],-1 if normalized==home else 37)
            self.assertEqual(actor(t)['missionDuration'],0 if normalized==home else f[2]['returnDistance']&255)
            self.assertEqual(actor(t)['locationId'],old['locationId']);self.assertEqual(actor(t)['homeBaseId'],home)
            self.assertEqual(t,m.replay_special_cancellation(t))


if __name__=='__main__':unittest.main()
