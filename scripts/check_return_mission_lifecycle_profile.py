"""P0-56 isolated completion/one-hop gates, atomic preflight and replay."""
import copy
import itertools
import json
import random
import unittest
from unittest.mock import patch
import return_mission_lifecycle_profile as m
import mission_cancellation_v2_profile as cancel


def fixture(source='S1',kind='advance',home=4,location=0):
    p=dict(id=7,allocated=True,valid=True,status=2,homeBaseId=home,locationId=location,
           missionId=37,missionArgs=[321,11,22,33,44],missionDuration=99,acted=False)
    bases=[dict(id=i,valid=True,resourceValid=True,kind=0 if i<42 else 1 if i<52 else 2,
                forceId=0,money=1234) for i in sorted({0,3,4,home}&set(range(87)))]
    state=dict(source=source,revision=0,appliedCommands=[],persons=[p],bases=bases,
               forces=[dict(id=0,valid=True,query33=False,query38=False)],rngState=0x12345678)
    command=dict(id='return-1',expectedRevision=0,personId=7,kind=kind)
    observations=dict(source=source,provenance='synthetic source-bound runtime slots',globalStop=False,
        territories=[dict(id=b['id'],cityId=b['id'] if b['id']<42 else 4) for b in bases],
        cities=[dict(id=0,valid=True,neighbors=[3,-1,-1,-1,-1,-1])])
    policy=dict(id='record-return-mission-v1',ruleset='PC-PK1.1',unknownEffects='record-only',
        provenance='explicit bounded projection',callbackAssumption='noninterference-v1',
        homeDomain='valid-canonical-only-v1',memberSelection='supplied-node-v1')
    return [state,command,observations,policy]


def run(f):return m.project_return_mission(*f)
def person(t):return t['after']['persons'][0]
def base(t,bid):return next(b for b in t['after']['bases'] if b['id']==bid)
def helpers(t):return [s['helper'] for s in t['steps']]
def arrival(f):f[2]['cities'][0]['neighbors']=[4,-1,-1,-1,-1,-1];return f


class ReturnMission(unittest.TestCase):
    def test_standalone_completion_order_and_no_caller_writes(self):
        for source,acted in itertools.product(('S1','S2'),(False,True)):
            f=fixture(source,'complete');f[0]['persons'][0]['acted']=acted
            f[2].update(globalStop=None,territories=[],cities=[]);before=copy.deepcopy(f);t=run(f)
            self.assertTrue(t['accepted']);self.assertEqual(f,before);self.assertEqual(t['reason'],'complete')
            self.assertEqual(base(t,4)['money'],1555);self.assertEqual(person(t)['missionId'],-1)
            self.assertEqual(person(t)['missionArgs'],[0]*5);self.assertEqual(person(t)['missionDuration'],0)
            self.assertEqual(person(t)['locationId'],0);self.assertEqual(person(t)['acted'],acted)
            self.assertLess(helpers(t).index('004AE2A0'),helpers(t).index('004A5780'))
            refund=next(x for x in t['steps'] if x['helper']=='004AE2A0')
            self.assertEqual(refund['person']['missionId'],37);self.assertEqual(refund['person']['missionDuration'],99)
            self.assertEqual(t['steps'][-1],dict(helper='005B9B90',returnValue=1))
            self.assertNotIn('004BF6F0',[x['helper'] for x in t['unknownEffects']])
            self.assertEqual(t,m.replay_return_mission(t))

    def test_positive_only_refund_and_unused_other_arguments(self):
        for amount in (-2**31,-1,0,1,321,2**31-1):
            f=fixture(kind='complete');f[0]['persons'][0]['missionArgs']=[amount,-2**31,2**31-1,-11,42]
            if amount<=0:f[0]['bases'][-1]['resourceValid']=False;f[0]['forces']=[]
            t=run(f);expected=1234 if amount<=0 else cancel.money_after_refund(1234,amount,100000)
            self.assertEqual(base(t,4)['money'],expected);self.assertEqual(person(t)['missionArgs'],[0]*5)
            self.assertEqual('004AE2A0' in helpers(t),amount>0)

    def test_separate_source_money_caps_city_port_gate(self):
        for source,home,force_valid,query in itertools.product(('S1','S2'),(4,42,86),(False,True),(False,True)):
            f=fixture(source,'complete',home=home);b=next(b for b in f[0]['bases'] if b['id']==home)
            b['money']=0;f[0]['persons'][0]['missionArgs'][0]=300000
            f[0]['forces'][0].update(valid=force_valid,query33=query,query38=query)
            t=run(f);expected=cancel.money_capacity(source,b['kind'],force_valid,query,query)
            self.assertEqual(base(t,home)['money'],expected)

    def test_source_query33_and_query38_not_interchanged(self):
        for source,q33,q38 in itertools.product(('S1','S2'),(False,True),(False,True)):
            f=fixture(source,'complete',home=42);f[0]['persons'][0]['missionArgs'][0]=300000
            f[0]['forces'][0].update(query33=q33,query38=q38)
            t=run(f);cap=(40000 if q33 else 10000) if source=='S1' else (100000 if q38 else 50000)
            self.assertEqual(base(t,42)['money'],cap)

    def test_port_gate_query_ledger_precedes_money_write(self):
        for source,home in itertools.product(('S1','S2'),(42,86)):
            f=fixture(source,'complete',home=home);t=run(f)
            e=next(e for e in t['unknownEffects'] if e['helper']=='0048D820/00483660')
            self.assertEqual(next(b for b in e['snapshot']['bases'] if b['id']==home)['money'],1234)
            self.assertEqual(e['snapshot']['persons'][0]['missionId'],37)
            self.assertEqual(e['snapshot']['persons'][0]['missionArgs'],[321,11,22,33,44])
            self.assertEqual(t['steps'][e['beforeStepIndex']]['helper'],'004AE2A0')
            self.assertEqual(base(t,home)['money'],1555)

    def test_signed_overflow_and_already_over_cap(self):
        for source,old,amount in itertools.product(('S1','S2'),(0,99999,200001,2**31-1),(1,2**31-1)):
            f=fixture(source,'complete');next(b for b in f[0]['bases'] if b['id']==4)['money']=old
            f[0]['persons'][0]['missionArgs'][0]=amount;t=run(f)
            cap=100000 if source=='S1' else 200000
            total=((old+amount+2**31)%2**32)-2**31
            self.assertEqual(base(t,4)['money'],min(total,cap) if total>0 else 0)

    def test_invalid_actor_helper_noop_short_circuits_home(self):
        for allocated in (False,True):
            f=fixture(kind='complete',home=16383);f[0]['persons'][0].update(valid=False,allocated=allocated)
            f[0]['bases']=[];f[0]['forces']=[];f[2].update(globalStop=None,territories=[],cities=[])
            t=run(f);self.assertEqual(t['reason'],'invalid-actor-no-op');self.assertTrue(t['accepted'])
            self.assertEqual(person(t),f[0]['persons'][0]);self.assertEqual(t['unknownEffects'],[])
            self.assertEqual(t['steps'][-1]['returnValue'],1)

    def test_live_active_filter_and_global_stop_before_dependencies(self):
        for field,value in [('valid',False),('acted',True),('missionId',-1),('missionId',44)]:
            f=fixture();f[0]['persons'][0][field]=value;f[0]['bases']=[];f[0]['forces']=[]
            f[2].update(territories=[],cities=[]);t=run(f)
            self.assertEqual(t['reason'],'active-filter-no-op');self.assertEqual(person(t),f[0]['persons'][0])
            self.assertEqual(t['unknownEffects'],[])
        f=fixture();f[2].update(globalStop=True,territories=[],cities=[]);f[0]['bases']=[]
        t=run(f);self.assertEqual(t['reason'],'global-stop-no-op');self.assertEqual(len(t['steps']),1)

    def test_single_hop_ignores_duration_and_preserves_refund(self):
        for source,duration in itertools.product(('S1','S2'),(0,1,99,255)):
            f=fixture(source);f[0]['persons'][0]['missionDuration']=duration;t=run(f)
            self.assertEqual(t['reason'],'move-one-city');self.assertEqual(person(t)['locationId'],3)
            self.assertTrue(person(t)['acted']);self.assertEqual(person(t)['missionId'],37)
            self.assertEqual(person(t)['missionArgs'],f[0]['persons'][0]['missionArgs'])
            self.assertEqual(person(t)['missionDuration'],m.city_distance(source,3,4))
            self.assertEqual(base(t,4)['money'],1234);self.assertNotIn('005B9B90',helpers(t))

    def test_tie_uses_first_neighbor_slot_not_city_id(self):
        for source in ('S1','S2'):
            distances={i:m.city_distance(source,i,4) for i in range(42)}
            group=next([i for i,d in distances.items() if d==v] for v in set(distances.values())
                       if len([i for i,d in distances.items() if d==v])>=2 and v>0)
            low,high=sorted(group)[:2]
            for slots,expected in [([high,low,-1,-1,-1,-1],high),([low,high,-1,-1,-1,-1],low)]:
                f=fixture(source);f[2]['cities'][0]['neighbors']=slots;t=run(f)
                self.assertEqual(person(t)['locationId'],expected)
                self.assertEqual([x['selected'] for x in t['plan']['neighborScores']],[True,False])

    def test_numeric_neighbors_only_no_ownership_validity_or_improvement_gate(self):
        f=fixture();f[2]['cities'][0]['neighbors']=[-2**31,42,2**31-1,-1,0,0]
        t=run(f);self.assertEqual(t['reason'],'move-one-city');self.assertEqual(person(t)['locationId'],0)
        self.assertEqual(len(t['plan']['neighborScores']),2)
        self.assertEqual([r['slot'] for r in t['plan']['neighborScores']],[4,5])
        # Selected next-city building slot need not be observed or valid.
        f=fixture();f[0]['bases']=[b for b in f[0]['bases'] if b['id']!=3]
        t=run(f);self.assertEqual(person(t)['locationId'],3)

    def test_source_distance_tables_are_separate(self):
        self.assertEqual(m.city_distance('S1',2,4),2);self.assertEqual(m.city_distance('S2',2,4),1)
        f=fixture('S1');f[2]['cities'][0]['neighbors']=[7,2,-1,-1,-1,-1]
        g=copy.deepcopy(f);g[0]['source']=g[2]['source']='S2'
        self.assertEqual(person(run(f))['locationId'],7);self.assertEqual(person(run(g))['locationId'],2)
        self.assertEqual(m.city_distance('S1',-1,4),-1)

    def test_arrival_move_duration_refund_reset_return_direct_acted_tail(self):
        for source,status in itertools.product(('S1','S2'),(2,5)):
            f=arrival(fixture(source));f[0]['persons'][0]['status']=status;t=run(f);h=helpers(t)
            self.assertEqual(t['reason'],'arrival-completion');self.assertEqual(person(t)['locationId'],4)
            self.assertEqual(base(t,4)['money'],1555);self.assertEqual(person(t)['missionId'],-1)
            self.assertFalse(person(t)['acted']);self.assertEqual(person(t)['missionDuration'],0)
            self.assertLess(h.index('004A5660'),h.index('004AE2A0'))
            self.assertLess(h.index('004AE2A0'),h.index('004A5780'))
            self.assertLess(h.index('004A5780'),h.index('00489B40'));self.assertEqual(h[-1],'0048A8B0')
            ds=[s for s in t['steps'] if s['helper']=='005B9E10'];self.assertEqual(ds[-1]['returnValue'],0)
            rs=[e for e in t['unknownEffects'] if e['helper']=='004BF6F0'];self.assertEqual(len(rs),int(status!=5))
            if rs:
                self.assertEqual(rs[0]['arguments'],[7,4,1,1]);self.assertEqual(rs[0]['snapshot']['bases'][-1]['money'],1555)
                self.assertEqual(rs[0]['snapshot']['persons'][0]['missionId'],-1)
            self.assertNotIn('0090CBA0',h);self.assertNotIn('004A5600',h)

    def test_same_territorial_city_arrives_at_exact_port_or_gate(self):
        for home in (42,86):
            f=fixture(home=home,location=4);f[2]['cities']=[];t=run(f)
            self.assertEqual(person(t)['locationId'],home);self.assertEqual(t['plan']['nextCity'],4)
            self.assertEqual(t['plan']['neighborScores'],[])

    def test_no_next_clears_only_mission_and_args(self):
        for variant in ('invalid-city','no-neighbors','invalid-base','sentinel','troop'):
            f=fixture();f[3]['unknownEffects']='reject'
            if variant=='invalid-city':f[2]['cities'][0].update(valid=False,neighbors=None)
            if variant=='no-neighbors':f[2]['cities'][0]['neighbors']=[-1,42,43,-2,999,2**31-1]
            if variant=='invalid-base':f[0]['bases'][0]['valid']=False;f[2]['cities']=[]
            if variant=='sentinel':f[0]['persons'][0]['locationId']=-1;f[2]['cities']=[]
            if variant=='troop':f[0]['persons'][0]['locationId']=87;f[2]['cities']=[]
            t=run(f);self.assertEqual(t['reason'],'no-next-city-reset');self.assertTrue(t['accepted'])
            expected=copy.deepcopy(f[0]['persons'][0]);expected.update(missionId=-1,missionArgs=[0]*5)
            self.assertEqual(person(t),expected);self.assertEqual(base(t,4)['money'],1234)
            self.assertEqual(t['unknownEffects'],[]);self.assertNotIn('004A5660',helpers(t))

    def test_nonrouted_duration_wait_is_not_decremented_or_completed(self):
        f=fixture(home=-1);f[0]['bases']=[];f[2].update(territories=[],cities=[])
        t=run(f);self.assertEqual(t['reason'],'nonrouted-duration-wait');self.assertEqual(person(t),f[0]['persons'][0])
        f[0]['persons'][0]['missionDuration']=0;t=run(f)
        self.assertEqual(t['reason'],'unsupported-home-domain');self.assertFalse(t['accepted'])

    def test_bounded_home_geography_resource_are_explicit_refusals(self):
        cases=[]
        for kind,home in itertools.product(('complete','advance'),(87,16383)):
            cases.append((fixture(kind=kind,home=home),'unsupported-home-domain'))
        f=fixture();next(b for b in f[0]['bases'] if b['id']==4)['valid']=False
        cases.append((f,'unsupported-home-domain'))
        f=fixture();next(r for r in f[2]['territories'] if r['id']==4)['cityId']=-1
        cases.append((f,'unsupported-target-geography'))
        f=arrival(fixture());next(b for b in f[0]['bases'] if b['id']==4)['resourceValid']=False
        cases.append((f,'unsupported-home-resource'))
        for f,reason in cases:
            before=copy.deepcopy(f);t=run(f);self.assertEqual(t['reason'],reason)
            self.assertFalse(t['accepted']);self.assertEqual(t['after'],f[0]);self.assertEqual(f,before)
            self.assertEqual(t['steps'],[]);self.assertEqual(t['unknownEffects'],[])

    def test_preflight_all_reached_observations_before_writer(self):
        cases=[]
        f=fixture();f[2]['globalStop']=None;cases.append(f)
        f=fixture();f[0]['bases']=[b for b in f[0]['bases'] if b['id']!=4];cases.append(f)
        f=fixture();f[0]['bases']=[b for b in f[0]['bases'] if b['id']!=0];cases.append(f)
        for bid in (0,4):
            f=fixture();f[2]['territories']=[r for r in f[2]['territories'] if r['id']!=bid];cases.append(f)
        f=fixture();f[2]['cities']=[];cases.append(f)
        f=fixture();f[2]['cities'][0]['neighbors']=None;cases.append(f)
        f=fixture(kind='complete',home=42);f[0]['forces']=[];cases.append(f)
        f=fixture(home=42,location=4);f[0]['forces']=[];cases.append(f)
        for f in cases:
            before=copy.deepcopy(f)
            with patch.object(m,'_apply',side_effect=AssertionError('writer reached')):
                with self.assertRaisesRegex(ValueError,'observed|missing'):run(f)
            self.assertEqual(f,before)

    def test_short_circuit_avoids_unused_resource_and_city_observations(self):
        f=fixture();f[0]['forces']=[];next(b for b in f[0]['bases'] if b['id']==4)['resourceValid']=False
        self.assertEqual(run(f)['reason'],'move-one-city')
        f=fixture(location=4);f[2]['cities']=[];f[0]['forces']=[]
        self.assertEqual(run(f)['reason'],'arrival-completion')
        f=fixture(kind='complete',home=42);f[0]['persons'][0]['missionArgs'][0]=0;f[0]['forces']=[]
        next(b for b in f[0]['bases'] if b['id']==42)['resourceValid']=False
        self.assertEqual(run(f)['reason'],'complete')

    def test_atomic_callback_reject_and_snapshot_isolation(self):
        f=arrival(fixture());f[3]['unknownEffects']='reject';before=copy.deepcopy(f);t=run(f)
        self.assertEqual(t['reason'],'unknown-effects-rejected');self.assertFalse(t['accepted'])
        self.assertEqual(t['after'],f[0]);self.assertEqual(t['steps'],[]);self.assertEqual(f,before)
        self.assertTrue(t['unknownEffects']);self.assertEqual(t,m.replay_return_mission(t))
        t=run(arrival(fixture()));snapshot=copy.deepcopy(t['unknownEffects'][0]['snapshot'])
        t['after']['persons'][0]['missionArgs'][0]=999
        self.assertEqual(t['unknownEffects'][0]['snapshot'],snapshot)

    def test_zero_rng_and_evidence_boundaries(self):
        for seed,source,kind in itertools.product((0,1,0xffffffff),('S1','S2'),('complete','advance')):
            f=fixture(source,kind);f[0]['rngState']=seed;f[3]['ruleset']='PC-Vanilla-assumed';t=run(f)
            self.assertEqual(t['rng']['initialState'],seed);self.assertEqual(t['rng']['finalState'],seed)
            self.assertEqual(t['rng']['calls'],[]);self.assertEqual(t['rng']['consumed'],0)
            self.assertEqual(t['after']['rngState'],seed);self.assertFalse(t['rng']['unexecutedCallbacksCovered'])
            for flag in ('stockVerified','vanillaVerified','schedulerExecuted','wholeActiveListExecuted','completeGameTransaction','callbacksExecuted','listMembershipVerified'):
                self.assertFalse(t['evidence'][flag])
            self.assertEqual(t['evidence']['runtimeStatus'],'compatibility-assumption')

    def test_idempotency_conflicts_and_double_refund_protection(self):
        for kind in ('complete','advance'):
            f=arrival(fixture(kind=kind));t=run(f);g=copy.deepcopy(f);g[0]=t['after'];r=run(g)
            self.assertEqual(r['reason'],'replay');self.assertEqual(r['after'],t['after'])
            g[1]['kind']='complete' if kind=='advance' else 'advance'
            self.assertEqual(run(g)['reason'],'replay-payload-conflict')
            g=copy.deepcopy(f);g[1]['expectedRevision']=1;self.assertEqual(run(g)['reason'],'revision-conflict')
            g=copy.deepcopy(f);g[0]=t['after'];g[1].update(id='return-again',expectedRevision=1)
            r=run(g);self.assertEqual(base(r,4)['money'],1555)
            self.assertEqual(r['reason'],'active-filter-no-op' if kind=='advance' else 'unsupported-mission')

    def test_next_step_needs_explicit_external_acted_reset(self):
        f=fixture();t=run(f);g=copy.deepcopy(f);g[0]=t['after'];g[1].update(id='next',expectedRevision=1)
        self.assertEqual(run(g)['reason'],'active-filter-no-op')
        # A new externally observed phase snapshot supplies reset and geography.
        g[0]['persons'][0]['acted']=False
        g[2]['cities']=[dict(id=3,valid=True,neighbors=[4,-1,-1,-1,-1,-1])]
        r=run(g);self.assertEqual(r['reason'],'arrival-completion');self.assertEqual(base(r,4)['money'],1555)

    def test_cancellation_deferred_refund_to_arrival_without_changing_old_api(self):
        for source in ('S1','S2'):
            f=fixture(source);f[0]['persons'][0].update(missionId=15,missionArgs=[0,600,0,0,0])
            old={k:copy.deepcopy(v) for k,v in f[0].items() if k!='rngState'}
            ct=cancel.project_cancellation(old,dict(id='cancel',personId=7,expectedRevision=0),
                dict(provenance='synthetic',returnDistance=3,s2Skill267=None,targetBuildings=[],targetCities=[]),
                {k:v for k,v in f[3].items() if k not in ('callbackAssumption','homeDomain','memberSelection')})
            self.assertEqual(ct['schemaVersion'],2);self.assertEqual(ct,cancel.replay_cancellation(ct))
            self.assertEqual(ct['after']['persons'][0]['missionArgs'],[600,0,0,0,0])
            self.assertEqual(next(b for b in ct['after']['bases'] if b['id']==4)['money'],1234)
            f[0]=dict(copy.deepcopy(ct['after']),rngState=0x12345678)
            f[1].update(expectedRevision=1);f[0]['persons'][0]['acted']=False
            arrival(f);t=run(f);self.assertEqual(base(t,4)['money'],1834);self.assertEqual(person(t)['missionId'],-1)

    def test_trace_json_roundtrip_hash_and_resigned_forgery(self):
        t=run(arrival(fixture()));self.assertEqual(t,m.replay_return_mission(json.loads(json.dumps(t))))
        for key,value in [('reason','fake'),('profileId','other')]:
            bad=copy.deepcopy(t);bad[key]=value
            with self.assertRaisesRegex(ValueError,'hash'):m.replay_return_mission(bad)
        bad=copy.deepcopy(t);bad['after']['bases'][-1]['money']+=1
        bad['traceHash']=cancel._digest({k:v for k,v in bad.items() if k!='traceHash'})
        with self.assertRaisesRegex(ValueError,'replay mismatch'):m.replay_return_mission(bad)
        bad=copy.deepcopy(t);bad['rng']['consumed']=1
        bad['traceHash']=cancel._digest({k:v for k,v in bad.items() if k!='traceHash'})
        with self.assertRaisesRegex(ValueError,'replay mismatch'):m.replay_return_mission(bad)

    def test_strict_shapes_domains_source_and_policy(self):
        changes=[lambda f:f[0].update(rngState=True),lambda f:f[0].update(rngState=2**32),
            lambda f:f[0]['persons'][0].update(homeBaseId=16384),
            lambda f:f[0]['persons'][0].update(valid=True,allocated=False),
            lambda f:f[2].update(source='S2'),lambda f:f[2].update(globalStop=1),
            lambda f:f[2]['cities'][0].update(neighbors=[1]*5),
            lambda f:f[2]['cities'][0].update(neighbors=[True]*6),
            lambda f:f[2]['territories'].append(copy.deepcopy(f[2]['territories'][0])),
            lambda f:f[2]['cities'].append(copy.deepcopy(f[2]['cities'][0])),
            lambda f:f[3].update(callbackAssumption='none'),lambda f:f[3].update(homeDomain='generic'),
            lambda f:f[3].update(memberSelection='all-people'),lambda f:f[1].update(kind='turn'),
            lambda f:f[0].update(extra=1),lambda f:f[2].update(s2Skill267=True)]
        for edit in changes:
            f=fixture();edit(f);before=copy.deepcopy(f)
            with self.assertRaises(ValueError):run(f)
            self.assertEqual(f,before)

    def test_fuzz_source_neighbor_oracle_and_complete_replay(self):
        rng=random.Random(5637)
        for _ in range(256):
            source=rng.choice(['S1','S2']);f=fixture(source)
            slots=[rng.randint(-5,46) for _ in range(6)];f[2]['cities'][0]['neighbors']=slots
            f[0]['persons'][0]['missionDuration']=rng.randrange(256)
            f[0]['persons'][0]['missionArgs'][0]=rng.randint(-10,200000)
            valid=[(m.city_distance(source,n,4),slot,n) for slot,n in enumerate(slots) if 0<=n<42]
            t=run(f);self.assertEqual(t,m.replay_return_mission(t))
            expected=min(valid)[2] if valid else -1
            self.assertEqual(t['plan']['nextCity'],expected)
            self.assertEqual(t['rng']['consumed'],0)
            if expected>=0:self.assertEqual(person(t)['locationId'],4 if expected==4 else expected)
            else:self.assertEqual(person(t)['missionId'],-1)


if __name__=='__main__':unittest.main()
