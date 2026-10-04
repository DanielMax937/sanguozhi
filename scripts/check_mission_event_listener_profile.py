"""P0-59 listener behavior, full-frame replacement, atomicity and replay tests."""
import copy
import itertools
import json
import random
import unittest
import mission_event_listener_profile as m


def person(pid=7,mission=23,**kw):
    p=dict(id=pid,valid=True,missionId=mission,missionArgs=[0,9,3,4,5],locationId=0,
           data=dict(status=3,homeBaseId=0,flags124=0x102,missionDuration=9))
    p.update(kw);return p


def fixture(event=8,source='S1'):
    frame=dict(persons=[person(),person(9,37)],
               buildings=[dict(id=0,valid=True,kind=0,data={'governorId':9}),dict(id=42,valid=True,kind=1,data={'governorId':-1})],
               cities=[dict(id=0,valid=True,data={'money':200})],activePersonIds=[7],executingPersonId=None,rngState=7,data={'note':'preserved','roster':[7,9]})
    if event==14:frame['persons'][0].update(missionId=24,missionArgs=[42,0,3,4,5])
    state=dict(source=source,revision=0,appliedCommands=[],frame=frame)
    command=dict(id='event-1',expectedRevision=0,event=dict(id=event,subjectType='person' if event==8 else 'building',subjectId=9 if event==8 else 42,argument=0))
    obs=dict(source=source,provenance='synthetic source-bound fixture, not a runtime capture',handlerFrames=[])
    policy=dict(id='observe-listeners-v1',ruleset='PC-PK1.1',handlerTails='observed-frame',pointerDomain='typed-fixed-observation-slots-v1',registryDomain='initialized-unmodified-registry-v1',listAssumption='successful-copy-and-traversal-v1',provenance='bounded fixed-array interpretation')
    return [state,command,obs,policy]


def run(f):return m.project_mission_event(*f)
def row(frame,name,pid):return next(p for p in frame[name] if p['id']==pid)
def tail(f,before=None,after=None,visit=0,pid=7,mission=None,count=0):
    if before is None:before=f[0]['frame']
    if after is None:after=before
    if mission is None:mission=row(before,'persons',pid)['missionId']
    r=dict(visitIndex=visit,personId=pid,missionId=mission,helper=m.HANDLERS[mission],tailStart='005B6D87' if mission==23 else '005CFBEB',event=copy.deepcopy(f[1]['event']),currentBuildingId=row(before,'persons',pid)['locationId'],targetType='city' if mission==23 else 'building',targetId=row(before,'persons',pid)['missionArgs'][0],before=copy.deepcopy(before),after=copy.deepcopy(after),
           rngConsumption=dict(kind='unknown' if count is None else 'observed-count',calls=count),provenance='synthetic explicit whole-domain replacement')
    f[2]['handlerFrames'].append(r);return r


def oracle(f):
    """Independent visit interpreter: no production predicates/planner/helpers."""
    state,command,observed,policy=copy.deepcopy(f);w=state['frame'];event=command['event'];seq=w['activePersonIds'][:]
    obs={x['visitIndex']:x for x in observed['handlerFrames']};visits=[]
    for i,pid in enumerate(seq):
        ps={p['id']:p for p in w['persons']};bs={b['id']:b for b in w['buildings']};cs={c['id']:c for c in w['cities']};p=ps[pid];mission=p['missionId']
        v=dict(visitIndex=i,personId=pid,missionId=None,dispatcherReturn=None,handlerReturn=None);visits.append(v)
        if w['executingPersonId']==pid:v['route']='executing-person-skip';continue
        v['missionId']=mission
        if mission<0 or mission>43:v['route']='mission-range-skip';continue
        if mission==37:v.update(route='mission37-skip',dispatcherReturn=0);continue
        pred=False;sid=event['subjectId']
        if p['valid']:
            if event['id']==8 and mission==23 and event['subjectType']=='person':
                pred=sid in ps and ps[sid]['valid'] and p['missionArgs'][1]==sid
            if event['id']==14 and mission==24 and event['subjectType']=='building':
                pred=sid in bs and bs[sid]['valid'] and bs[sid]['kind'] in [1,2] and p['missionArgs'][0]==sid
        if not pred:v.update(route='predicate-false',dispatcherReturn=0);continue
        loc=p['locationId'];target=p['missionArgs'][0]
        gate=0<=loc<=86 and loc in bs and bs[loc]['valid']
        gate=gate and ((0<=target<=41 and target in cs and cs[target]['valid']) if mission==23 else (0<=target<=16383 and target in bs and bs[target]['valid']))
        if gate:
            if policy['handlerTails']=='reject':return None,None
            assert obs[i]['before']==w
            w=copy.deepcopy(obs[i]['after'])
        v.update(route='handler-called',dispatcherReturn=1,handlerReturn=int(gate))
    return w,visits


class ListenerTests(unittest.TestCase):
    def test_01_both_sources_and_events_apply_explicit_frames(self):
        for source,event in itertools.product(('S1','S2'),(8,14)):
            f=fixture(event,source);after=copy.deepcopy(f[0]['frame']);row(after,'persons',7).update(missionId=37,missionArgs=[0]*5);after['rngState']=123
            tail(f,after=after,count=3);original=copy.deepcopy(f);t=run(f)
            self.assertTrue(t['accepted']);self.assertEqual(t['after']['frame'],after);self.assertEqual(f,original)
            self.assertEqual(t['visits'][0]['dispatcherReturn'],1);self.assertEqual(t['visits'][0]['handlerReturn'],1)
            self.assertEqual(t['rng']['localCalls'],0);self.assertEqual(t['rng']['observedTailCalls'],3);self.assertFalse(t['evidence']['callbacksAssumedNoninterfering'])
            self.assertEqual(m.replay_mission_event(json.loads(json.dumps(t))),t)
    def test_02_all_44_missions_each_event_both_sources(self):
        for source,event,mission in itertools.product(('S1','S2'),(8,14),range(44)):
            f=fixture(event,source);f[0]['frame']['persons'][0]['missionId']=mission
            relevant=mission==(23 if event==8 else 24)
            if relevant:tail(f)
            t=run(f);w,visits=oracle(f);self.assertEqual(t['after']['frame'],w);self.assertEqual(t['visits'],visits)
            self.assertEqual(len(t['observedEffects']),int(relevant))
    def test_03_full_integer_mission_boundary_matrix(self):
        for mission in (-2**31,-1,0,23,24,37,43,44,2**31-1):
            f=fixture();f[0]['frame']['persons'][0]['missionId']=mission
            if mission==23:tail(f)
            self.assertEqual(run(f)['visits'],oracle(f)[1])
    def test_04_currently_executing_is_skipped_before_mission_dispatch(self):
        f=fixture();f[0]['frame']['executingPersonId']=7;t=run(f)
        self.assertEqual(t['visits'][0]['route'],'executing-person-skip');self.assertFalse(any(s['helper']=='005B9D30' for s in t['steps']))
    def test_05_listener_validity_is_in_predicate_not_outer_wrapper(self):
        f=fixture();f[0]['frame']['persons'][0]['valid']=False;t=run(f)
        self.assertTrue(any(s['helper']=='005B9D30' for s in t['steps']));self.assertEqual(t['visits'][0]['dispatcherReturn'],0)
    def test_06_subject_cast_null_missing_and_invalid(self):
        for event in (8,14):
            for st,sid in [('null',None),('person',1099),('building',16383)]:
                f=fixture(event);f[1]['event'].update(subjectType=st,subjectId=sid)
                self.assertEqual(run(f)['visits'][0]['route'],'predicate-false')
            f=fixture(event);name='persons' if event==8 else 'buildings';row(f[0]['frame'],name,f[1]['event']['subjectId'])['valid']=False
            self.assertEqual(run(f)['visits'][0]['route'],'predicate-false')
    def test_07_event8_uses_arg1_not_arg0(self):
        f=fixture();f[0]['frame']['persons'][0]['missionArgs'][0]=9;t=run(f)
        self.assertEqual((t['visits'][0]['dispatcherReturn'],t['visits'][0]['handlerReturn']),(1,0))
        f=fixture();f[0]['frame']['persons'][0]['missionArgs'][1]=0
        self.assertEqual(run(f)['visits'][0]['dispatcherReturn'],0)
    def test_08_event14_rawkind_gate_no_canonical_subtype_assumption(self):
        for kind in (-1,0,1,2,3,63):
            f=fixture(14);row(f[0]['frame'],'buildings',42)['kind']=kind
            if kind in (1,2):tail(f)
            self.assertEqual(run(f)['visits'][0]['dispatcherReturn'],int(kind in (1,2)))
        f=fixture(14);f[1]['event']['subjectId']=0;f[0]['frame']['persons'][0]['missionArgs'][0]=0;row(f[0]['frame'],'buildings',0)['kind']=2;tail(f)
        self.assertEqual(run(f)['visits'][0]['handlerReturn'],1)
    def test_09_current_base_shortcircuits_before_target(self):
        for location in (-2**31,-1,41,87,1086,16383,2**31-1):
            f=fixture();f[0]['frame']['persons'][0]['locationId']=location;t=run(f)
            self.assertEqual(t['visits'][0]['handlerReturn'],0);self.assertFalse(any(s.get('phase')=='target' for s in t['steps']))
    def test_10_city_subtype_separate_from_building_validity(self):
        f=fixture();f[0]['frame']['cities'][0]['valid']=False;t=run(f)
        self.assertEqual(t['visits'][0]['handlerReturn'],0)
        f=fixture();f[0]['frame']['persons'][0]['missionArgs'][0]=1;f[0]['frame']['cities'].append(dict(id=1,valid=True,data={}));tail(f)
        self.assertEqual(run(f)['visits'][0]['handlerReturn'],1)
    def test_11_event14_target_building_domain_to16383(self):
        f=fixture(14);f[0]['frame']['buildings'].append(dict(id=16383,valid=True,kind=1,data={}));f[1]['event']['subjectId']=16383;f[0]['frame']['persons'][0]['missionArgs'][0]=16383;tail(f)
        self.assertEqual(run(f)['visits'][0]['handlerReturn'],1)
    def test_12_handler_gate_failure_dispatcher_still_one(self):
        f=fixture();f[0]['frame']['persons'][0]['missionArgs'][0]=-1;t=run(f)
        self.assertEqual((t['visits'][0]['handlerReturn'],t['visits'][0]['dispatcherReturn']),(0,1));self.assertEqual(t['observedEffects'],[])
    def test_13_copied_list_duplicate_live_mission_then_skip(self):
        f=fixture();f[0]['frame']['activePersonIds']=[7,7];a=copy.deepcopy(f[0]['frame']);a['activePersonIds']=[];row(a,'persons',7)['missionId']=37;tail(f,after=a);t=run(f)
        self.assertEqual(t['copiedActivePersonIds'],[7,7]);self.assertEqual([v['route'] for v in t['visits']],['handler-called','mission37-skip']);self.assertEqual(t['after']['frame']['activePersonIds'],[])
    def test_14_removed_member_still_visited_added_member_not_visited(self):
        f=fixture();f[0]['frame']['persons'].append(person(8,23));f[0]['frame']['activePersonIds']=[7,8]
        a=copy.deepcopy(f[0]['frame']);a['activePersonIds']=[9];row(a,'persons',8)['missionId']=43;tail(f,after=a);t=run(f)
        self.assertEqual([v['personId'] for v in t['visits']],[7,8]);self.assertEqual(t['visits'][1]['missionId'],43)
    def test_15_executing_pointer_reread_each_visit(self):
        f=fixture();f[0]['frame']['activePersonIds']=[7,7];a=copy.deepcopy(f[0]['frame']);a['executingPersonId']=7;tail(f,after=a)
        self.assertEqual(run(f)['visits'][1]['route'],'executing-person-skip')
    def test_16_two_callbacks_stage_before_must_use_previous_after(self):
        f=fixture();f[0]['frame']['activePersonIds']=[7,7];a=copy.deepcopy(f[0]['frame']);a['data']['note']='first';tail(f,after=a)
        b=copy.deepcopy(a);b['data']['note']='second';tail(f,before=a,after=b,visit=1);t=run(f);self.assertEqual(t['after']['frame']['data']['note'],'second')
        f[2]['handlerFrames'][1]['before']=copy.deepcopy(f[0]['frame'])
        with self.assertRaisesRegex(ValueError,'live observation'):run(f)
    def test_17_handler_can_change_next_subject_validity_and_arguments(self):
        f=fixture();f[0]['frame']['activePersonIds']=[7,7];a=copy.deepcopy(f[0]['frame']);row(a,'persons',9)['valid']=False;tail(f,after=a)
        self.assertEqual(run(f)['visits'][1]['route'],'predicate-false')
    def test_18_unknown_rng_count_not_zero_claim(self):
        f=fixture();tail(f,count=None);t=run(f)
        self.assertIsNone(t['rng']['observedTailCalls']);self.assertFalse(t['rng']['allTailCountsKnown']);self.assertFalse(t['rng']['globalConsumptionVerified'])
    def test_19_reject_atomically_no_command_consumption(self):
        f=fixture();f[3]['handlerTails']='reject';t=run(f)
        self.assertFalse(t['accepted']);self.assertEqual(t['after'],f[0]);self.assertEqual(t['steps'],[]);self.assertEqual(t['visits'],[]);self.assertEqual(t['reason'],'handler-tail-rejected')
        self.assertEqual(t['observedEffects'][0]['before'],f[0]['frame'])
    def test_20_missing_late_observation_atomic_and_input_unchanged(self):
        f=fixture();f[0]['frame']['activePersonIds']=[7,7];a=copy.deepcopy(f[0]['frame']);a['data']['note']='mutation';tail(f,after=a);original=copy.deepcopy(f)
        with self.assertRaisesRegex(ValueError,'visit 1'):run(f)
        self.assertEqual(f,original)
    def test_21_unused_or_wrong_call_frame_rejected(self):
        f=fixture();tail(f,visit=1)
        with self.assertRaises(ValueError):run(f)
        f=fixture();tail(f);f[0]['frame']['persons'][0]['missionId']=37
        with self.assertRaisesRegex(ValueError,'unused'):run(f)
        f=fixture();r=tail(f);r['personId']=9
        with self.assertRaisesRegex(ValueError,'call mismatch'):run(f)
    def test_22_replay_and_payload_conflict(self):
        f=fixture();tail(f);t=run(f);f[0]=t['after'];r=run(f)
        self.assertTrue(r['replayed']);self.assertEqual(r['after'],t['after'])
        f[1]['event']['argument']=1;f[2]['handlerFrames'][0]['event']=copy.deepcopy(f[1]['event']);r=run(f);self.assertFalse(r['accepted']);self.assertEqual(r['reason'],'replay-payload-conflict')
    def test_23_revision_conflict_and_exhaustion(self):
        f=fixture();f[1]['expectedRevision']=1;self.assertEqual(run(f)['reason'],'revision-conflict')
        f[0]['revision']=f[1]['expectedRevision']=m.I32_MAX
        with self.assertRaisesRegex(ValueError,'exhausted'):run(f)
    def test_24_trace_recomputed_hash_cannot_hide_outcome_tamper(self):
        f=fixture();tail(f);t=run(f);t['visits'][0]['dispatcherReturn']=0;t.pop('traceHash');t['traceHash']=m._digest(t)
        with self.assertRaisesRegex(ValueError,'replay mismatch'):m.replay_mission_event(t)
    def test_25_no_snapshot_aliases(self):
        f=fixture();tail(f);t=run(f);old=copy.deepcopy(t['observedEffects'][0]['before']);t['after']['frame']['persons'][0]['missionArgs'][0]=999
        self.assertEqual(t['observedEffects'][0]['before'],old);self.assertEqual(t['before'],f[0]);self.assertEqual(t['steps'][0]['snapshot'],f[0]['frame'])
    def test_26_domain_preserved_and_json_types(self):
        mutations=[lambda f:f[0]['frame']['persons'].append(copy.deepcopy(f[0]['frame']['persons'][0])),
                   lambda f:f[0]['frame']['persons'][0].update(missionId=True),
                   lambda f:f[0]['frame']['activePersonIds'].append(8),
                   lambda f:f[0]['frame']['data'].update(value=float('nan')),
                   lambda f:f[0]['frame'].update(executingPersonId=8),
                   lambda f:f[0]['frame']['persons'][0].update(missionArgs=[0]*6)]
        for mutate in mutations:
            f=fixture();mutate(f)
            with self.assertRaises(ValueError):run(f)
        for mutate in (lambda a:a['persons'].pop(),lambda a:a['data'].pop('note'),lambda a:row(a,'persons',7)['data'].pop('status')):
            f=fixture();r=tail(f);mutate(r['after'])
            with self.assertRaises(ValueError):run(f)
    def test_27_source_ruleset_and_registry_boundaries(self):
        f=fixture();f[2]['source']='S2'
        with self.assertRaisesRegex(ValueError,'source mismatch'):run(f)
        f=fixture();f[3]['registryDomain']='patched'
        with self.assertRaisesRegex(ValueError,'registry domain'):run(f)
        f=fixture();f[3]['ruleset']='PC-Vanilla-assumed';tail(f);self.assertEqual(run(f)['evidence']['runtimeStatus'],'compatibility-assumption')
    def test_28_event_argument_preserved_but_ignored_by_these_predicates(self):
        f=fixture();f[1]['event']['argument']=-2**31;tail(f);t=run(f)
        self.assertEqual(t['observedEffects'][0]['event'],f[1]['event'])
    def test_29_reject_policy_accepts_proven_noop_paths(self):
        f=fixture();f[3]['handlerTails']='reject';f[0]['frame']['persons'][0]['missionId']=22;t=run(f)
        self.assertTrue(t['accepted']);self.assertEqual(t['observedEffects'],[])
    def test_30_independent_seeded_oracle_768_cases(self):
        rng=random.Random(59)
        for case in range(768):
            f=fixture(rng.choice((8,14)),rng.choice(('S1','S2')));w=f[0]['frame'];w['persons'] += [person(i,rng.choice((23,24,37,-1,44,12))) for i in range(10,14)]
            for p in w['persons']:
                p['valid']=rng.choice((True,True,False));p['locationId']=rng.choice((0,42,87,-1));p['missionArgs'][:2]=[rng.choice((0,42,-1)),rng.choice((9,10,1099))]
            w['activePersonIds']=[rng.choice([7,9,10,11,12,13]) for _ in range(rng.randrange(8))];w['executingPersonId']=rng.choice((None,None,7,9))
            # Add explicit identity frames only where independent scalar gates pass.
            for i,pid in enumerate(w['activePersonIds']):
                p=row(w,'persons',pid);e=f[1]['event'];hit=p['valid'] and pid!=w['executingPersonId']
                if e['id']==8:hit=hit and p['missionId']==23 and p['missionArgs'][1]==9 and row(w,'persons',9)['valid'] and p['missionArgs'][0]==0
                else:hit=hit and p['missionId']==24 and p['missionArgs'][0]==42
                hit=hit and p['locationId'] in (0,42)
                if hit:tail(f,visit=i,pid=pid)
            t=run(f);after,visits=oracle(f);self.assertEqual(t['after']['frame'],after);self.assertEqual(t['visits'],visits)
            self.assertEqual(m.replay_mission_event(json.loads(json.dumps(t))),t)

    def test_31_event_and_saved_pointer_observations_are_bound(self):
        for change in (lambda r:r['event'].update(argument=1),lambda r:r.update(currentBuildingId=42),lambda r:r.update(targetId=1),lambda r:r.update(tailStart='005CFBEB')):
            f=fixture();r=tail(f);change(r)
            with self.assertRaises(ValueError):run(f)
    def test_32_bool_integer_before_and_event_are_not_equal_snapshots(self):
        f=fixture();f[0]['frame']['data']['note']=1;r=tail(f);r['before']['data']['note']=True
        with self.assertRaisesRegex(ValueError,'live observation'):run(f)
        f=fixture();f[1]['event']['argument']=1;r=tail(f);r['event']['argument']=True
        with self.assertRaisesRegex(ValueError,'event mismatch'):run(f)
    def test_33_null_subject_does_not_call_type_query(self):
        f=fixture();f[1]['event'].update(subjectType='null',subjectId=None);t=run(f)
        self.assertFalse(any(s['helper']=='virtual+2C' for s in t['steps']))
    def test_34_empty_list_no_side_effect_boundary(self):
        f=fixture();f[0]['frame']['activePersonIds']=[];t=run(f)
        self.assertTrue(t['accepted']);self.assertEqual(t['visits'],[]);self.assertEqual(t['after']['frame'],f[0]['frame'])


if __name__=='__main__':unittest.main()
