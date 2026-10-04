"""Independent tail oracle, stage-bound mutation, preflight and replay checks."""
import copy
import itertools
import json
import random
import unittest
import mission_notification_tail_profile as m


def fixture(kind='return-zero',source='S1',home=0,location=0):
    person=dict(id=7,allocated=True,valid=True,status=5,homeBaseId=home,locationId=location,rawLegionId=0,missionId=23,missionArgs=[0,9,3,4,5],missionDuration=99,flags124=0x102,data={'note':'keep'})
    frame=dict(persons=[person,dict(person,id=9)],buildings=[dict(id=i,valid=True,kind=0,data={'governorId':-1}) for i in (0,1,42,16383)],cities=[dict(id=0,valid=True,data={})],forces=[dict(id=0,valid=True,playerIndex=-1,raw44=9,data={})],legions=[dict(id=0,valid=True,forceId=0,number=1,data={})],activePersonIds=[9,9],executingPersonId=None,managerDirty=0,observerPresent=False,rngState=8,data={'roster':[9,7]})
    return [dict(source=source,revision=0,appliedCommands=[],frame=frame),dict(id='tail-1',expectedRevision=0,personId=7,kind=kind),dict(source=source,provenance='synthetic fixture, not native capture',records=[]),dict(id='observe-v1',ruleset='PC-PK1.1',unknownEffects='observed-frame',pointerDomain='fixed-canonical-observed-getters-v1',listAssumption='readable-acyclic-successful-append-v1',provenance='explicit bounded model')]


def run(f):return m.project_mission_notification_tail(*f)
def p(frame):return frame['persons'][0]
def helpers(t):return [s['helper'] for s in t['steps']]
def record(f,kind,helper,args,before,result=None,after=None,count=0):
    r=dict(index=len(f[2]['records']),kind=kind,helper=helper,args=copy.deepcopy(args),before=copy.deepcopy(before),provenance='synthetic stage fixture')
    if kind in ('query','effect-query'):r['result']=result
    if kind!='query':r.update(after=copy.deepcopy(before if after is None else after),rngConsumption=dict(kind='unknown' if count is None else 'observed-count',calls=count))
    f[2]['records'].append(r);return r


def return_oracle(f,start=None,distance=3,query267=False,observer=None,full_return=None,count=0):
    """Independent state interpreter; production planner is never used to seed observations."""
    w=copy.deepcopy(start if start is not None else f[0]['frame']);actor=w['persons'][0]
    home=actor['homeBaseId'];location=actor['locationId'] if actor['locationId'] in range(87) else -1
    def write_acted(wrapper):
        nonlocal w,actor
        if wrapper and not actor['valid']:return
        if wrapper and f[0]['source']=='S2':
            record(f,'effect-query','004890F0',dict(personId=7,skillId=267),w,result=query267)
            if query267:return
        actor['flags124']=actor['flags124']|1;w['managerDirty']=1
        if w['observerPresent']:
            new=copy.deepcopy(w)
            if observer:observer(new)
            record(f,'effect','observer.virtual1B4',dict(nativeArgs=[0,0,0,0],caller='004B9480'),w,after=new,count=count)
            w=new;actor=w['persons'][0]
    if home!=location:
        record(f,'query','0049E4D0',dict(currentBuildingId=location,homeBuildingId=home if 0<=home<=16383 else -1),w,result=distance)
        if actor['valid']:
            actor['missionId']=37;actor['missionArgs']=[0,0,0,0,0]
            write_acted(False)
            if actor['valid'] and 7 not in w['activePersonIds']:w['activePersonIds']=w['activePersonIds']+[7]
        if actor['valid']:actor['missionDuration']=distance%256
    else:
        if actor['allocated']:actor['missionId']=-1;actor['missionArgs']=[0,0,0,0,0]
        if actor['valid']:actor['missionDuration']=0
        write_acted(True)
        if actor['status']!=5:
            new=copy.deepcopy(w)
            if full_return:full_return(new)
            record(f,'effect','004BF6F0',dict(personId=7,targetBuildingId=home,showNotice=0,noticeVariant=1),w,after=new,count=count)
            w=new
    return w


class TailTests(unittest.TestCase):
    def test_01_same_and_away_both_sources(self):
        for source,away,query in itertools.product(('S1','S2'),(False,True),(False,True)):
            f=fixture(source=source,home=int(away));expected=return_oracle(f,query267=query);before=copy.deepcopy(f);t=run(f)
            self.assertTrue(t['accepted']);self.assertEqual(t['after']['frame'],expected);self.assertEqual(f,before)
            self.assertEqual(t,m.replay_mission_notification_tail(json.loads(json.dumps(t))))
    def test_02_notification_short_circuit_and_canonical_player_domain(self):
        for player,num in itertools.product((-2**31,-1,0,7,8,2**31-1),(-1,0,1,2,2**31-1)):
            f=fixture('notification-gate');w=f[0]['frame'];w['forces'][0]['playerIndex']=player;w['legions'][0]['number']=num
            t=run(f);self.assertEqual(t['returnValue'],int(0<=player<=7 and num==1));self.assertFalse(t['observedEffects']);self.assertEqual(t['after']['frame'],w)
    def test_03_notification_actor_legion_force_invalid_and_sentinels(self):
        for name,field,value in [('persons','valid',False),('persons','rawLegionId',-1),('persons','rawLegionId',47),('legions','valid',False),('forces','valid',False)]:
            f=fixture('notification-gate');f[0]['frame']['forces'][0]['playerIndex']=0;f[0]['frame'][name][0][field]=value
            self.assertEqual(run(f)['returnValue'],0)
        f=fixture('notification-gate');f[0]['frame']['persons'][0]['valid']=False;f[0]['frame']['legions']=[];f[0]['frame']['forces']=[]
        self.assertEqual(helpers(run(f)),['005B81D0/actor-valid'])
    def test_04_ensure_active_preserves_order_and_duplicates(self):
        for seq in ([],[9],[9,7,9],[7,7,9]):
            f=fixture('ensure-active');f[0]['frame']['activePersonIds']=seq[:];t=run(f)
            self.assertEqual(t['after']['frame']['activePersonIds'],seq if 7 in seq else seq+[7])
        f=fixture('ensure-active');p(f[0]['frame'])['valid']=False;self.assertEqual(run(f)['after']['frame']['activePersonIds'],[9,9])
    def test_05_acted_dirty_observer_order_even_bit_already_set(self):
        for source,query,flags in itertools.product(('S1','S2'),(False,True),(0,0xffffffff)):
            f=fixture('set-acted',source);w=f[0]['frame'];p(w)['flags124']=flags;w['observerPresent']=True
            stage=copy.deepcopy(w)
            if source=='S2':record(f,'effect-query','004890F0',dict(personId=7,skillId=267),stage,result=query)
            if source!='S2' or not query:
                p(stage)['flags124']|=1;stage['managerDirty']=1
                record(f,'effect','observer.virtual1B4',dict(nativeArgs=[0,0,0,0],caller='004B9480'),stage)
            t=run(f);self.assertEqual(t['after']['frame'],stage)
            if source!='S2' or not query:
                h=helpers(t);self.assertLess(h.index('00489B40/00472520'),h.index('004A06A0/004829B0'));self.assertLess(h.index('004A06A0/004829B0'),h.index('observer.virtual1B4'))
    def test_06_away_observer_changes_live_valid_list_and_duration(self):
        for invalidate in (False,True):
            f=fixture(home=1);f[0]['frame']['observerPresent']=True
            def mutate(w):
                p(w).update(valid=not invalidate,missionId=9,missionDuration=122);w['activePersonIds']=[7,9,7];w['rngState']=81
            expected=return_oracle(f,observer=mutate,distance=255,count=None);t=run(f)
            self.assertEqual(t['after']['frame'],expected);self.assertEqual(p(t['after']['frame'])['missionDuration'],122 if invalidate else 255)
            self.assertIsNone(t['rng']['observedCalls']);self.assertFalse(t['rng']['allCountsKnown'])
    def test_07_away_observer_removal_is_followed_by_tail_append(self):
        f=fixture(home=1);f[0]['frame']['activePersonIds']=[7,9,7];f[0]['frame']['observerPresent']=True
        expected=return_oracle(f,observer=lambda w:w.update(activePersonIds=[9,9]));t=run(f)
        self.assertEqual(t['after']['frame'],expected);self.assertEqual(expected['activePersonIds'],[9,9,7])
    def test_08_same_reset_does_not_remove_active_members(self):
        f=fixture();f[0]['frame']['activePersonIds']=[7,9,7];return_oracle(f);t=run(f)
        self.assertEqual(t['after']['frame']['activePersonIds'],[7,9,7]);self.assertNotIn('00482AF0',helpers(t))
    def test_09_same_observer_live_status_and_saved_home(self):
        f=fixture();p(f[0]['frame'])['status']=2;f[0]['frame']['observerPresent']=True
        expected=return_oracle(f,observer=lambda w:p(w).update(status=5,homeBaseId=1))
        t=run(f);self.assertEqual(t['after']['frame'],expected);self.assertNotIn('004BF6F0',helpers(t))
        f=fixture();f[0]['frame']['observerPresent']=True
        expected=return_oracle(f,observer=lambda w:p(w).update(status=2,homeBaseId=1),full_return=lambda w:w.update(rngState=987))
        t=run(f);self.assertEqual(t['after']['frame'],expected);self.assertEqual(t['observedEffects'][-1]['args']['targetBuildingId'],0)
    def test_10_invalid_allocated_person_still_resets_and_checks_status(self):
        for allocated in (False,True):
            f=fixture();p(f[0]['frame']).update(valid=False,allocated=allocated,status=5);expected=return_oracle(f);t=run(f)
            self.assertEqual(t['after']['frame'],expected);self.assertEqual(p(expected)['missionId'],-1 if allocated else 23)
            self.assertEqual(p(expected)['missionDuration'],99);self.assertEqual(expected['managerDirty'],0)
    def test_11_troop_location_normalizes_to_minus_one_and_home_minus_one_same(self):
        f=fixture(home=-1,location=87);expected=return_oracle(f);self.assertEqual(run(f)['after']['frame'],expected)
        f=fixture(home=1,location=87);expected=return_oracle(f,distance=-1);t=run(f)
        self.assertEqual(t['after']['frame'],expected);self.assertEqual(t['queries'][0]['args']['currentBuildingId'],-1)
    def test_12_no_building_valid_gate_in_return(self):
        f=fixture(home=1);f[0]['frame']['buildings'][0]['valid']=False;f[0]['frame']['buildings'][1]['valid']=False
        expected=return_oracle(f,distance=-1);self.assertEqual(run(f)['after']['frame'],expected)
    def test_13_duration_is_low_byte_for_source_distance_domain(self):
        for d in (-1,0,1,127,254,255):
            f=fixture(home=1);return_oracle(f,distance=d);self.assertEqual(p(run(f)['after']['frame'])['missionDuration'],d%256)
    def test_14_handler_gates_actor_current_then_target(self):
        for kind in ('handler23','handler24'):
            for edit in ('actor','location','current','target'):
                f=fixture(kind);w=f[0]['frame']
                if edit=='actor':p(w)['valid']=False
                elif edit=='location':p(w)['locationId']=87
                elif edit=='current':w['buildings'][0]['valid']=False
                else:p(w)['missionArgs'][0]=-1
                t=run(f);self.assertEqual(t['returnValue'],0);self.assertEqual(t['after']['frame'],w)
    def test_15_handler_success_no_notification(self):
        for kind,source in itertools.product(('handler23','handler24'),('S1','S2')):
            f=fixture(kind,source);p(f[0]['frame'])['missionId']=-123;expected=return_oracle(f);t=run(f)
            self.assertEqual(t['returnValue'],1);self.assertEqual(t['after']['frame'],expected)
    def test_16_handler_city_subtype_and_wide_building_target(self):
        f=fixture('handler23',home=1,location=1);f[0]['frame']['buildings'][0]['valid']=False;expected=return_oracle(f);self.assertEqual(run(f)['after']['frame'],expected)
        f=fixture('handler24');p(f[0]['frame'])['missionArgs'][0]=16383;expected=return_oracle(f);self.assertEqual(run(f)['after']['frame'],expected)
    def test_17_presentation_mutation_precedes_live_return_reads(self):
        for kind in ('handler23','handler24'):
            f=fixture(kind);w=f[0]['frame'];w['forces'][0]['playerIndex']=0
            after=copy.deepcopy(w);p(after).update(homeBaseId=1,locationId=0,missionId=42);after['rngState']=3
            record(f,'effect','005B6DC4..005B6E35' if kind=='handler23' else '005CFC28..005CFC99',dict(personId=7,currentBuildingId=0,targetType='cities' if kind=='handler23' else 'buildings',targetId=0,savedForce44=9,messageId=0x15a6 if kind=='handler23' else 0x15b6),w,after=after,count=2)
            expected=return_oracle(f,start=after);t=run(f);self.assertEqual(t['after']['frame'],expected);self.assertEqual(t['rng']['observedCalls'],2);self.assertEqual(p(expected)['missionId'],37)
    def test_18_presentation_can_invalidate_actor_before_return(self):
        f=fixture('handler23');w=f[0]['frame'];w['forces'][0]['playerIndex']=0;after=copy.deepcopy(w);p(after).update(valid=False,status=5)
        record(f,'effect','005B6DC4..005B6E35',dict(personId=7,currentBuildingId=0,targetType='cities',targetId=0,savedForce44=9,messageId=0x15a6),w,after=after)
        expected=return_oracle(f,start=after);t=run(f);self.assertEqual(t['returnValue'],1);self.assertEqual(t['after']['frame'],expected)
    def test_19_reject_is_atomic_after_prior_known_writes(self):
        f=fixture(home=1);f[0]['frame']['observerPresent']=True;f[3]['unknownEffects']='reject'
        record(f,'query','0049E4D0',dict(currentBuildingId=0,homeBuildingId=1),f[0]['frame'],result=3)
        before=copy.deepcopy(f);t=run(f);self.assertFalse(t['accepted']);self.assertEqual(t['after'],f[0]);self.assertEqual(t['steps'],[]);self.assertEqual(f,before);self.assertEqual(t,m.replay_mission_notification_tail(t))
    def test_20_reject_no_open_boundary_still_accepts(self):
        f=fixture();f[3]['unknownEffects']='reject';return_oracle(f);self.assertTrue(run(f)['accepted'])
    def test_21_late_missing_unused_stale_wrong_source_are_atomic_errors(self):
        for bad in ('missing','unused','stale','source','helper','args','order'):
            f=fixture(home=1);f[0]['frame']['observerPresent']=True;return_oracle(f)
            if bad=='missing':f[2]['records'].pop()
            elif bad=='unused':f[2]['records'].append(dict(copy.deepcopy(f[2]['records'][-1]),index=2))
            elif bad=='stale':f[2]['records'][-1]['before']['rngState']+=1
            elif bad=='source':f[2]['source']='S2'
            elif bad=='helper':f[2]['records'][-1]['helper']='unknown'
            elif bad=='args':f[2]['records'][-1]['args']['caller']='different'
            else:f[2]['records'][-1]['index']=0
            before=copy.deepcopy(f)
            with self.assertRaises(ValueError):run(f)
            self.assertEqual(f,before)
    def test_22_domain_and_json_type_validation(self):
        for bad in ('missing-slot','duplicate','domain','bool-int','rng','query-bool','allocated','float'):
            f=fixture(home=1);f[0]['frame']['observerPresent']=True;return_oracle(f)
            if bad=='missing-slot':f[0]['frame']['buildings'].pop(1)
            elif bad=='duplicate':f[0]['frame']['persons'].append(copy.deepcopy(p(f[0]['frame'])))
            elif bad=='domain':f[2]['records'][-1]['after']['persons'][0]['data'].pop('note')
            elif bad=='bool-int':f[2]['records'][-1]['before']['managerDirty']=True
            elif bad=='rng':f[2]['records'][-1]['rngConsumption']={'kind':'unknown','calls':0}
            elif bad=='query-bool':f[2]['records'][0]['result']=True
            elif bad=='allocated':p(f[0]['frame'])['allocated']=False
            else:f[0]['frame']['data']['float']=0.5
            with self.assertRaises(ValueError):run(f)
    def test_23_idempotency_revision_and_payload_conflicts(self):
        f=fixture();return_oracle(f);t=run(f);g=copy.deepcopy(f);g[0]=t['after'];r=run(g)
        self.assertTrue(r['replayed']);self.assertEqual(r['after'],t['after']);self.assertEqual(r['steps'],[])
        g[1]['kind']='ensure-active';self.assertEqual(run(g)['reason'],'replay-payload-conflict')
        f=fixture();f[1]['expectedRevision']=1;self.assertEqual(run(f)['reason'],'revision-conflict')
        f=fixture();f[0]['revision']=f[1]['expectedRevision']=2**31-1
        with self.assertRaises(ValueError):run(f)
    def test_24_snapshot_aliases_and_resigned_trace_tampering(self):
        f=fixture(home=1);f[0]['frame']['observerPresent']=True;return_oracle(f);t=run(f)
        for path in ('after','steps','evidence','rng'):
            bad=copy.deepcopy(t)
            if path=='after':bad['after']['frame']['rngState']+=1
            elif path=='steps':bad['steps'][0]['frame']['rngState']+=1
            elif path=='evidence':bad['evidence']['stockVerified']=True
            else:bad['rng']['observedCalls']=2
            bad.pop('traceHash');bad['traceHash']=m._digest(bad)
            with self.assertRaises(ValueError):m.replay_mission_notification_tail(bad)
        t['steps'][0]['frame']['data']['roster'].append(88)
        self.assertNotIn(88,t['before']['frame']['data']['roster']);self.assertNotIn(88,t['steps'][1]['frame']['data']['roster'])
    def test_25_vanilla_is_separate_unverified_assumption(self):
        f=fixture();f[3]['ruleset']='PC-Vanilla-assumed';return_oracle(f);t=run(f)
        self.assertEqual(t['evidence']['runtimeStatus'],'compatibility-assumption');self.assertFalse(t['evidence']['vanillaVerified'])
    def test_26_512_seeded_independent_return_oracles_and_replays(self):
        rng=random.Random(0x60)
        for i in range(512):
            f=fixture(source=rng.choice(('S1','S2')),home=rng.randrange(2));w=f[0]['frame'];a=p(w)
            a.update(status=rng.choice((2,5)),flags124=rng.randrange(2**32),missionDuration=rng.randrange(256),missionId=rng.randrange(-1,44));w['observerPresent']=rng.choice((False,True));w['activePersonIds']=rng.choice([[],[7],[9,7,7],[9,9]])
            flip=rng.choice((False,True));clear=rng.choice((False,True))
            def observer(v):
                if flip:p(v)['valid']=False
                if clear:v['activePersonIds']=[]
                v['rngState']=(v['rngState']+31)&0xffffffff
            expected=return_oracle(f,distance=rng.randrange(-1,256),query267=rng.choice((False,True)),observer=observer,full_return=lambda v:v.update(rngState=59),count=None if i%3==0 else i%5)
            before=copy.deepcopy(f);t=run(f);self.assertEqual(t['after']['frame'],expected);self.assertEqual(f,before);self.assertEqual(t,m.replay_mission_notification_tail(json.loads(json.dumps(t))))

    def test_27_s2_query267_mutation_has_no_second_validity_gate(self):
        for answer in (False,True):
            f=fixture('set-acted','S2');before=f[0]['frame'];after=copy.deepcopy(before)
            p(after).update(valid=False,status=2);after['rngState']=333
            record(f,'effect-query','004890F0',dict(personId=7,skillId=267),before,result=answer,after=after,count=None)
            expected=copy.deepcopy(after)
            if not answer:p(expected)['flags124']|=1;expected['managerDirty']=1
            t=run(f);self.assertEqual(t['after']['frame'],expected);self.assertIsNone(t['rng']['observedCalls'])
    def test_28_s2_query_rejection_precedes_acted_write(self):
        f=fixture('set-acted','S2');f[3]['unknownEffects']='reject';t=run(f)
        self.assertFalse(t['accepted']);self.assertEqual(t['after'],f[0]);self.assertEqual(t['observedEffects'][0]['helper'],'004890F0')
    def test_29_out_of_range_home_getter_uses_sentinel_pointer(self):
        for home in (-2**31,-2,16384,2**31-1):
            f=fixture(home=home);expected=return_oracle(f,distance=-1);t=run(f)
            self.assertEqual(t['after']['frame'],expected);self.assertEqual(t['queries'][0]['args']['homeBuildingId'],-1)
    def test_30_missing_canonical_slot_is_not_guessed_invalid(self):
        f=fixture('notification-gate');f[0]['frame']['legions']=[]
        with self.assertRaises(ValueError):run(f)
        f=fixture('handler24');p(f[0]['frame'])['missionArgs'][0]=100
        with self.assertRaises(ValueError):run(f)
    def test_31_query_boolean_identity_is_not_integer_equality(self):
        f=fixture('set-acted','S2');record(f,'effect-query','004890F0',dict(personId=7,skillId=267),f[0]['frame'],result=1)
        with self.assertRaises(ValueError):run(f)

    def test_32_distance_observations_cannot_invent_unreachable_results(self):
        for distance in (-2**31,-2,256,2**31-1):
            f=fixture(home=1);return_oracle(f,distance=distance)
            with self.assertRaises(ValueError):run(f)

    def test_33_valid_legion_force_field_must_be_canonical(self):
        for force in (-1,47,2**31-1):
            f=fixture('notification-gate');f[0]['frame']['legions'][0]['forceId']=force
            with self.assertRaises(ValueError):run(f)


if __name__=='__main__':unittest.main()
