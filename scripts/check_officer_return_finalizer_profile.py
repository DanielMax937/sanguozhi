"""P0-57 scalar/call-order, atomic observation, source and replay boundaries."""
import copy
import itertools
import json
import random
import unittest
from unittest.mock import patch
import officer_return_finalizer_profile as m


def fixture(source='S1'):
    p=dict(id=7,allocated=True,valid=True,status=2,homeBaseId=0,locationId=0,
        rawLegionId=1,flags124=0x80000101,missionId=37,missionArgs=[500,11,22,33,44],missionDuration=9,acted=True)
    state=dict(source=source,revision=0,appliedCommands=[],persons=[p],rngState=0x12345678,
        buildings=[dict(id=0,valid=True,kind=0,legionId=1,subtypeValid=True),
                   dict(id=4,valid=True,kind=0,legionId=2,subtypeValid=True)],
        legions=[dict(id=1,valid=True,forceId=0),dict(id=2,valid=True,forceId=0)],
        forces=[dict(id=0,valid=True,field128=1)])
    command=dict(id='return-1',expectedRevision=0,personId=7,targetBuildingId=4,showNotice=0,noticeVariant=1)
    observations=dict(source=source,provenance='synthetic source-bound observed slots',noticeEligible=None,
        actualTroopMember=None,oldLegionRosterContains=True,targetForceId=0)
    policy=dict(id='record-officer-return-v1',ruleset='PC-PK1.1',unknownEffects='record-only',
        provenance='explicit bounded scalar projection',callbackAssumption='noninterference-v1',pointerDomain='array-slots-v1')
    return [state,command,observations,policy]


def run(f): return m.project_officer_return(*f)
def person(t): return t['after']['persons'][0]
def helpers(t): return [s['helper'] for s in t['steps']]
def effects(t): return [e['helper'] for e in t['unknownEffects']]
def target(f): return next(b for b in f[0]['buildings'] if b['id']==f[1]['targetBuildingId'])
def snap(e): return e['snapshot']['persons'][0]


class OfficerReturn(unittest.TestCase):
    def test_four_scalars_and_no_caller_reset(self):
        for source in ('S1','S2'):
            f=fixture(source);before=copy.deepcopy(f);t=run(f)
            self.assertTrue(t['accepted']);self.assertEqual(f,before)
            expected=copy.deepcopy(f[0]['persons'][0]);expected.update(homeBaseId=4,locationId=4,rawLegionId=2,flags124=expected['flags124']|512)
            self.assertEqual(person(t),expected)
            self.assertEqual(t['after']['buildings'],f[0]['buildings']);self.assertEqual(t['after']['legions'],f[0]['legions'])
            h=helpers(t)
            self.assertLess(h.index('004A3272'),h.index('004A0CB0'))
            self.assertLess(h.index('004A0CB0'),h.index('004A3355'))
            self.assertLess(h.index('004A3355'),h.index('00489E70/00472520'))
            self.assertEqual(t,m.replay_officer_return(t))

    def test_list_stage_snapshots_preserve_remove_write_add_sort_order(self):
        t=run(fixture());es=t['unknownEffects']
        home_remove=next(e for e in es if e['helper']=='004A2CB0')
        home_add=next(e for e in es if e['helper']=='0047C1B0' and 'roster' in e)
        home_sort=next(e for e in es if e['helper']=='0047CD50' and 'roster' in e)
        loc=next(e for e in es if e['helper']=='004B9480')
        leg_find=next(e for e in es if e['helper']=='00482AF0')
        leg_remove=next(e for e in es if e['helper']=='00482FC0')
        leg_add=next(e for e in es if e['helper']=='0047C1B0' and 'legionId' in e)
        leg_sort=next(e for e in es if e['helper']=='0047CD50' and 'legionId' in e)
        selected=[home_remove,home_add,home_sort,loc,leg_find,leg_remove,leg_add,leg_sort]
        self.assertEqual([es.index(e) for e in selected],sorted(es.index(e) for e in selected))
        self.assertEqual(snap(home_remove)['homeBaseId'],0)
        for e in (home_add,home_sort): self.assertEqual((snap(e)['homeBaseId'],snap(e)['locationId']),(4,0))
        self.assertEqual((snap(loc)['locationId'],snap(loc)['rawLegionId']),(4,1))
        for e in (leg_find,leg_remove): self.assertEqual(snap(e)['rawLegionId'],1)
        for e in (leg_add,leg_sort):
            self.assertEqual(snap(e)['rawLegionId'],2);self.assertTrue(snap(e)['flags124']&512)
        self.assertEqual(home_sort['arguments'],[1,0,0,0]);self.assertEqual(leg_sort['arguments'],[1,0,0,0])

    def test_same_home_and_same_legion_still_have_roster_calls(self):
        f=fixture();f[1]['targetBuildingId']=0;t=run(f)
        self.assertEqual(person(t)['homeBaseId'],0);self.assertEqual(person(t)['rawLegionId'],1)
        self.assertEqual(effects(t).count('0047C1B0'),2);self.assertEqual(effects(t).count('0047CD50'),2)
        self.assertIn('004A2CB0',effects(t));self.assertIn('00482FC0',effects(t))
        self.assertEqual(len([e for e in t['unknownEffects'] if e['helper']=='004BE2A0']),1)
        self.assertNotIn('004BCA30',effects(t))

    def test_invalid_actor_then_target_short_circuit_all_observations(self):
        for allocated in (False,True):
            f=fixture();f[0]['persons'][0].update(valid=False,allocated=allocated)
            f[0].update(buildings=[],legions=[],forces=[]);f[2].update(targetForceId=None,oldLegionRosterContains=None)
            t=run(f);self.assertEqual(t['reason'],'invalid-actor-no-op');self.assertEqual(person(t),f[0]['persons'][0])
            self.assertTrue(t['accepted']);self.assertEqual(t['unknownEffects'],[])
        for tid in (-1,4):
            f=fixture();f[1]['targetBuildingId']=tid;f[0]['buildings']=[dict(id=4,valid=False,kind=0,legionId=999,subtypeValid=None)]
            f[0].update(legions=[],forces=[]);f[2].update(targetForceId=None,oldLegionRosterContains=None)
            t=run(f);self.assertEqual(t['reason'],'invalid-target-no-op');self.assertTrue(t['accepted']);self.assertEqual(t['unknownEffects'],[])

    def test_notice_predicate_and_captive_gate_before_fields(self):
        for source,show,eligible,status in itertools.product(('S1','S2'),(0,1,-7),(False,True),(2,5)):
            f=fixture(source);f[1].update(showNotice=show,noticeVariant=-31);f[2]['noticeEligible']=eligible if show else None
            f[0]['persons'][0]['status']=status;t=run(f);expect=show!=0 and eligible and status!=5
            self.assertEqual('004B93D0' in effects(t),expect);self.assertEqual('004F55E0' in effects(t),expect)
            if expect:
                e=next(e for e in t['unknownEffects'] if e['helper']=='004B93D0')
                self.assertEqual(snap(e),f[0]['persons'][0]);self.assertEqual(e['messageId'],0x175d)
                self.assertEqual(e['arguments'],[0x175d,7,4,-31])
                display=next(e for e in t['unknownEffects'] if e['helper']=='004F55E0')
                self.assertEqual(display['arguments'],['unexecuted-formatted-text',4,1,-1])

    def test_ruler_ownership_is_atomic_explicit_defer(self):
        for source in ('S1','S2'):
            f=fixture(source);f[0]['persons'][0]['status']=0;f[0]['forces'][0]['field128']=0
            # Unreached roster inputs must not matter once ownership is deferred.
            target(f)['subtypeValid']=None;f[2]['oldLegionRosterContains']=None
            with patch.object(m,'_apply',side_effect=AssertionError('writer reached')): t=run(f)
            self.assertFalse(t['accepted']);self.assertEqual(t['reason'],'unsupported-ruler-ownership')
            self.assertEqual(t['after'],f[0]);self.assertEqual(t['steps'],[]);self.assertEqual(t['unknownEffects'],[])

    def test_ruler_ownership_gates_numeric_force_object_and_field(self):
        for valid,field,force in itertools.product((False,True),(0,1,-1),(0,1)):
            f=fixture();f[0]['persons'][0]['status']=0;f[0]['forces'][0].update(valid=valid,field128=field)
            f[2]['targetForceId']=force;t=run(f)
            self.assertEqual(t['accepted'],not(valid and field==0 and force==0))
        f=fixture();f[0]['persons'][0]['status']=0;f[0]['legions'][0]['valid']=False
        f[2].update(targetForceId=-1,oldLegionRosterContains=None);f[0]['forces']=[]
        self.assertTrue(run(f)['accepted'])

    def test_numeric_same_force_gate_does_not_require_valid_force_object(self):
        for fid in (0,41,42,46):
            f=fixture();f[0]['legions'][0]['forceId']=fid;f[2]['targetForceId']=fid;f[0]['forces']=[]
            t=run(f);self.assertTrue(t['accepted']);self.assertEqual(person(t)['rawLegionId'],2)
            self.assertTrue(t['plan']['affiliationGate'])
        f=fixture();f[2]['targetForceId']=1;t=run(f)
        self.assertFalse(t['plan']['affiliationGate']);self.assertEqual(person(t)['rawLegionId'],1)
        self.assertEqual(person(t)['homeBaseId'],4);self.assertEqual(person(t)['locationId'],4)
        self.assertNotIn('004A3355',helpers(t));self.assertNotIn('004BE2A0',effects(t));self.assertNotIn('004BCA30',effects(t))

    def test_person_force_getter_requires_legion_valid_not_bit9(self):
        for raw in (-2**31,-1,47,2**31-1):
            f=fixture();f[0]['persons'][0]['rawLegionId']=raw;f[0]['legions']=[];f[0]['forces']=[]
            f[2].update(targetForceId=None,oldLegionRosterContains=None);t=run(f)
            self.assertEqual(person(t)['rawLegionId'],raw);self.assertFalse(t['plan']['affiliationGate'])
        f=fixture();f[0]['legions'][0]['valid']=False;f[0]['legions']=f[0]['legions'][:1]
        f[2].update(targetForceId=None,oldLegionRosterContains=None);t=run(f)
        self.assertFalse(t['plan']['affiliationGate']);self.assertEqual(person(t)['rawLegionId'],1)
        for bit in (0,512):
            f=fixture();f[0]['persons'][0]['flags124']|=bit;t=run(f)
            self.assertTrue(t['plan']['affiliationGate'])

    def test_actual_troop_predicate_is_observed_not_location_range(self):
        for location,member in itertools.product((87,88,1086),(False,True)):
            f=fixture();f[0]['persons'][0]['locationId']=location;f[2]['actualTroopMember']=member;t=run(f)
            self.assertEqual(person(t)['locationId'],location if member else 4)
            self.assertEqual('004A0CB0' in helpers(t),not member)
            self.assertEqual('004B9480' in effects(t),not member)
            self.assertEqual(person(t)['homeBaseId'],4);self.assertEqual(person(t)['rawLegionId'],2)
        for location in (-2**31,-1,0,86,1087,2**31-1):
            f=fixture();f[0]['persons'][0]['locationId']=location;t=run(f)
            self.assertFalse(t['plan']['troopMember']);self.assertEqual(person(t)['locationId'],4)

    def test_exact_canonical_base_id_and_generic_target_minus_one(self):
        for tid,kind in [(0,0),(41,0),(42,1),(51,1),(52,2),(86,2),(16383,3),(42,0),(0,1),(86,1)]:
            f=fixture();f[1]['targetBuildingId']=tid
            f[0]['buildings']=[dict(id=0,valid=True,kind=0,legionId=1,subtypeValid=True)]
            b=dict(id=tid,valid=True,kind=kind,legionId=2,subtypeValid=True)
            if tid==0:f[0]['buildings'][0]=b
            else:f[0]['buildings'].append(b)
            t=run(f);canonical=(kind==0 and tid<=41) or (kind==1 and 42<=tid<=51) or (kind==2 and 52<=tid<=86)
            self.assertEqual(person(t)['homeBaseId'],tid);self.assertEqual(person(t)['locationId'],tid if canonical else -1)
            self.assertEqual(person(t)['rawLegionId'],2 if canonical else -1)

    def test_invalid_old_building_can_still_have_valid_home_roster(self):
        f=fixture();f[0]['buildings'][0]['valid']=False;t=run(f)
        self.assertIn('004A2CB0',effects(t));self.assertNotIn('004BCA30',effects(t))
        f[0]['buildings'][0]['subtypeValid']=False;t=run(f)
        self.assertNotIn('004A2CB0',effects(t))

    def test_subtype_gate_is_not_building_valid_gate(self):
        f=fixture();target(f)['subtypeValid']=False;t=run(f)
        self.assertEqual(person(t)['homeBaseId'],4);self.assertEqual(person(t)['locationId'],4)
        self.assertEqual(person(t)['rawLegionId'],-1)
        self.assertEqual(effects(t).count('0047C1B0'),0);self.assertEqual(effects(t).count('0047CD50'),0)
        self.assertEqual(person(t)['flags124'],f[0]['persons'][0]['flags124'])

    def test_legion_raw_write_domain_and_bit9_preservation(self):
        for requested,flags in itertools.product((-2**31,-2,-1,0,46,47,2**31-1),(0,1,511,512,0xffffffff)):
            f=fixture();p=f[0]['persons'][0];p['flags124']=flags;p['acted']=bool(flags&1)
            target(f)['legionId']=requested
            if 0<=requested<=46 and requested not in (1,2): f[0]['legions'].append(dict(id=requested,valid=False,forceId=-1))
            t=run(f);valid=requested==-1 or 0<=requested<=46
            self.assertEqual(person(t)['rawLegionId'],requested if valid else 1)
            self.assertEqual(person(t)['flags124'],flags|512 if 0<=requested<=46 else flags)
            self.assertIn('00482FC0',effects(t))
            self.assertEqual('004A3355' in helpers(t),valid)
            if valid:
                rm=next(e for e in t['unknownEffects'] if e['helper']=='00482FC0')
                self.assertEqual(snap(rm)['rawLegionId'],1)

    def test_missing_old_legion_roster_node_skips_only_erase(self):
        f=fixture();f[2]['oldLegionRosterContains']=False;t=run(f)
        self.assertIn('00482AF0',effects(t));self.assertNotIn('00482FC0',effects(t))
        self.assertEqual(person(t)['rawLegionId'],2);self.assertEqual(effects(t).count('0047C1B0'),2)

    def test_saved_status_controls_old_role_and_old_home_last(self):
        for status,same in itertools.product((-2**31,-1,0,1,2,5,2**31-1),(False,True)):
            f=fixture();f[0]['persons'][0]['status']=status
            if same:target(f)['legionId']=1
            t=run(f);roles=[e for e in t['unknownEffects'] if e['helper']=='004BE2A0']
            self.assertEqual([e['subject'] for e in roles],['old','new'] if status<=1 and not same else ['new'])
            for e in roles:
                self.assertEqual(snap(e)['rawLegionId'],1 if same else 2)
                self.assertEqual(e['refreshFlag'],0)
            self.assertEqual('004BCA30' in effects(t),not same)
            if not same:self.assertEqual(effects(t)[-1],'004BCA30')
            self.assertEqual(person(t)['status'],status)

    def test_new_invalid_legion_still_gets_role_call_boundary(self):
        f=fixture();f[0]['legions'][1]['valid']=False;t=run(f)
        self.assertEqual(person(t)['rawLegionId'],2);self.assertEqual(effects(t).count('0047C1B0'),1)
        e=next(e for e in t['unknownEffects'] if e['helper']=='004BE2A0')
        self.assertEqual(e['subject'],'new');self.assertFalse(e['legionValid'])

    def test_preflight_missing_all_reached_observations_before_apply(self):
        cases=[]
        for name in ('buildings','legions'):
            for row in fixture()[0][name]:
                f=fixture();f[0][name]=[r for r in f[0][name] if r['id']!=row['id']];cases.append(f)
        f=fixture();f[0]['persons'][0]['status']=0;f[0]['forces']=[];cases.append(f)
        for name in ('targetForceId','oldLegionRosterContains'):
            f=fixture();f[2][name]=None;cases.append(f)
        f=fixture();f[1]['showNotice']=1;cases.append(f)
        f=fixture();f[0]['persons'][0]['locationId']=87;cases.append(f)
        for i in range(2):
            f=fixture();f[0]['buildings'][i]['subtypeValid']=None;cases.append(f)
        for f in cases:
            before=copy.deepcopy(f)
            with patch.object(m,'_apply',side_effect=AssertionError('writer reached')):
                with self.assertRaisesRegex(ValueError,'observed|required'):run(f)
            self.assertEqual(f,before)

    def test_unused_observations_not_required_on_short_circuit(self):
        f=fixture();f[2]['targetForceId']=1;f[2]['oldLegionRosterContains']=None
        f[0]['legions']=f[0]['legions'][:1];f[0]['forces']=[];self.assertTrue(run(f)['accepted'])
        f=fixture();f[0]['persons'][0]['homeBaseId']=-1;f[0]['buildings']=f[0]['buildings'][1:]
        self.assertTrue(run(f)['accepted']);self.assertNotIn('004A2CB0',effects(run(f)))

    def test_atomic_record_reject_and_snapshot_isolation(self):
        f=fixture();f[3]['unknownEffects']='reject';before=copy.deepcopy(f);t=run(f)
        self.assertFalse(t['accepted']);self.assertEqual(t['reason'],'unknown-effects-rejected')
        self.assertEqual(t['after'],f[0]);self.assertEqual(t['steps'],[]);self.assertEqual(f,before)
        self.assertTrue(t['unknownEffects']);self.assertEqual(m.replay_officer_return(t),t)
        t=run(fixture());e=copy.deepcopy(t['unknownEffects'][0]['snapshot'])
        t['after']['persons'][0]['missionArgs'][0]=999
        self.assertEqual(t['unknownEffects'][0]['snapshot'],e)

    def test_idempotency_new_command_reexecutes_and_payload_conflict(self):
        f=fixture();t=run(f);g=copy.deepcopy(f);g[0]=t['after'];u=run(g)
        self.assertTrue(u['replayed']);self.assertEqual(u['after'],t['after']);self.assertEqual(u['unknownEffects'],[])
        for key,val in [('targetBuildingId',0),('showNotice',1),('noticeVariant',0),('personId',8),('expectedRevision',1)]:
            g=copy.deepcopy(f);g[0]=copy.deepcopy(t['after']);g[1][key]=val
            if key=='personId':g[0]['persons'].append(dict(g[0]['persons'][0],id=8))
            u=run(g);self.assertFalse(u['accepted']);self.assertEqual(u['reason'],'replay-payload-conflict')
        g=copy.deepcopy(f);g[0]=t['after'];g[1].update(id='return-2',expectedRevision=1);u=run(g)
        self.assertTrue(u['accepted']);self.assertFalse(u['replayed']);self.assertIn('004A2CB0',effects(u))
        self.assertEqual(person(t),person(u))

    def test_revision_conflict_exhaustion_and_json_replay_tamper(self):
        f=fixture();f[1]['expectedRevision']=1;t=run(f)
        self.assertFalse(t['accepted']);self.assertEqual(t['reason'],'revision-conflict')
        f=fixture();f[0]['revision']=f[1]['expectedRevision']=2**31-1
        with self.assertRaisesRegex(ValueError,'exhausted'):run(f)
        t=json.loads(json.dumps(run(fixture())));self.assertEqual(t,m.replay_officer_return(t))
        for field in ('after','rng','unknownEffects','plan'):
            u=copy.deepcopy(t)
            if field=='after':u[field]['persons'][0]['homeBaseId']=99
            elif field=='rng':u[field]['consumed']=1
            elif field=='unknownEffects':u[field][0]['beforeStepIndex']+=1
            else:u[field]['notice']=True
            u['traceHash']=m._digest({k:v for k,v in u.items() if k!='traceHash'})
            with self.assertRaisesRegex(ValueError,'replay mismatch'):m.replay_officer_return(u)
        u=copy.deepcopy(t);u['traceHash']='0'*64
        with self.assertRaisesRegex(ValueError,'hash mismatch'):m.replay_officer_return(u)

    def test_rng_and_unverified_full_return_boundary(self):
        for source,seed,ruleset in itertools.product(('S1','S2'),(0,1,0xffffffff),('PC-PK1.1','PC-Vanilla-assumed')):
            f=fixture(source);f[0]['rngState']=seed;f[3]['ruleset']=ruleset;t=run(f)
            self.assertEqual(t['rng'],dict(kind='zero-local-calls',initialState=seed,finalState=seed,calls=[],consumed=0,unexecutedCallbacksCovered=False))
            for k in ('stockVerified','vanillaVerified','completeGameTransaction','fullReturnExecuted','callbacksExecuted','rostersExecuted','roleReconciliationExecuted'):
                self.assertFalse(t['evidence'][k])
            self.assertEqual(t['evidence']['runtimeStatus'],'compatibility-reconstruction' if ruleset=='PC-PK1.1' else 'compatibility-assumption')

    def test_strict_shape_ranges_source_and_policy(self):
        changes=[(0,'rngState',True),(0,'source','S3'),(1,'showNotice',True),(1,'noticeVariant',2**31),
            (1,'targetBuildingId',16384),(2,'source','S2'),(2,'noticeEligible',1),(2,'targetForceId',True),
            (3,'callbackAssumption','silent'),(3,'pointerDomain','arbitrary'),(3,'ruleset','Vanilla'),(3,'unknownEffects','ignore')]
        for i,k,v in changes:
            f=fixture();f[i][k]=v
            with self.assertRaises(ValueError):run(f)
        for name in ('persons','buildings','legions','forces'):
            f=fixture();f[0][name].append(copy.deepcopy(f[0][name][0]))
            with self.assertRaisesRegex(ValueError,'duplicate'):run(f)
        f=fixture();f[0]['persons'][0]['allocated']=False
        with self.assertRaisesRegex(ValueError,'allocated'):run(f)
        f=fixture();f[0]['legions'][0]['forceId']=47
        with self.assertRaisesRegex(ValueError,'valid legion'):run(f)
        f=fixture();f[2]['extra']=True
        with self.assertRaises(ValueError):run(f)

    def test_repeated_live_getter_sites_stay_after_callback_stages(self):
        f=fixture();f[0]['persons'][0]['status']=0;t=run(f)
        sites=[s.get('callSite') for s in t['steps'] if 'callSite' in s]
        self.assertEqual(sites,['004BF7CD','004BF7EE','004BF7F7','004BF862','004BF87A','004BF883',
                               '004BF892','004BF8A2','004BF8F7','004BF900'])
        ui=next(e for e in t['unknownEffects'] if e['helper']=='004B9480')
        self.assertEqual(t['steps'][ui['beforeStepIndex']]['callSite'],'004BF862')
        f[1]['showNotice']=1;f[2]['noticeEligible']=False;t=run(f)
        self.assertIn('0047A6D0',helpers(t));self.assertNotIn('00488C70',helpers(t))
        f=fixture();f[1]['targetBuildingId']=0;t=run(f)
        self.assertIn('004BF900',[s.get('callSite') for s in t['steps']])
        self.assertNotIn('004BCA30',effects(t))

    def test_flags_aliases_and_query_input_are_strict(self):
        f=fixture();f[0]['persons'][0]['acted']=False
        with self.assertRaisesRegex(ValueError,'bit0'):run(f)
        t=run(fixture());es=[e for e in t['unknownEffects'] if 'roster' in e and e['roster']['buildingId']==4]
        self.assertEqual(len(es),2);es[0]['roster']['buildingId']=999
        self.assertEqual(es[1]['roster']['buildingId'],4);self.assertEqual(t['plan']['targetHomeRoster']['buildingId'],4)
        t=run(fixture());t['steps'][0]['passed']=False
        self.assertTrue(t['after']['persons'][0]['valid'])

    def test_seeded_scalar_oracle_and_replay_384_cases(self):
        rng=random.Random(57)
        for i in range(384):
            f=fixture('S1' if i%2==0 else 'S2');p=f[0]['persons'][0]
            p['status']=rng.choice([0,1,2,3,5,-1]);p['flags124']=rng.randrange(2**32);p['acted']=bool(p['flags124']&1)
            p['locationId']=rng.choice([-1,0,86,87,1086,1087]);member=rng.choice([False,True])
            f[2]['actualTroopMember']=member if 87<=p['locationId']<=1086 else None
            f[2]['targetForceId']=rng.choice([0,1,-1,46]);f[2]['oldLegionRosterContains']=rng.choice([False,True])
            requested=rng.choice([-2,-1,0,1,2,46,47]);target(f)['legionId']=requested
            if requested in (0,46):f[0]['legions'].append(dict(id=requested,valid=False,forceId=-1))
            t=run(f);expected=copy.deepcopy(p);expected['homeBaseId']=4
            if not (87<=p['locationId']<=1086 and member):expected['locationId']=4
            if f[2]['targetForceId']==0:
                if -1<=requested<=46:expected['rawLegionId']=requested
                if 0<=requested<=46:expected['flags124']|=512
            self.assertTrue(t['accepted']);self.assertEqual(person(t),expected);self.assertEqual(t,m.replay_officer_return(t))


if __name__=='__main__': unittest.main()
