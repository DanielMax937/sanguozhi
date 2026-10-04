"""P0-59 source-local event8/14 mission listener projection.

Native dispatch, event predicates and cancellation entrance gates are modeled.
Successful handler tails require full, stage-bound replacement observations or
atomically defer. No callback noninterference is assumed. Old APIs are unchanged.
"""
from __future__ import annotations
import copy
from capture_transaction_profile import exact_keys, integer, boolean
from capture_personnel_profile import text
from mission_cancellation_v2_profile import _digest, HANDLERS

PROFILE_ID = 'source-idb-S1-S2-mission-event-listeners-v1'
I32_MIN, I32_MAX = -2**31, 2**31-1
PREDICATES = (
    '005BBCB0','00441880','005C6930','00441880','00441880','005D7F00',
    '00441880','00441880','00441880','005CB180','005CB180','00441880',
    '005C5420','00441880','00441880','005BA530','005BA5C0','005BA650',
    '005BA6E0','005BA770','005BA800','005BA890','005BF300','005B7560',
    '005D00A0','00441880','00441880','00441880','00441880','00441880',
    '00441880','00441880','00441880','00441880','00441880','00441880',
    '00441880',None,'005BBCB0','00441880','00441880','005D9D60',
    '005D9D60','005D9D60')
FRAME_KEYS = {'persons','buildings','cities','activePersonIds','executingPersonId','rngState','data'}
PERSON_KEYS = {'id','valid','missionId','missionArgs','locationId','data'}


def _json(value, label):
    """Finite JSON only; opaque projection data is preserved, never interpreted."""
    if value is None or type(value) in (str,bool): return
    if type(value) is int: integer(value,label,-2**63,2**64-1);return
    if type(value) is list:
        for x in value: _json(x,label)
        return
    if type(value) is dict and all(type(k) is str for k in value):
        for x in value.values(): _json(x,label)
        return
    raise ValueError(label+' must contain only finite JSON scalar/list/object values')


def _data(value,label):
    if type(value) is not dict: raise ValueError(label+' object required')
    _json(value,label)


def validate_frame(frame):
    exact_keys(frame,FRAME_KEYS,'observation frame')
    tables=(('persons',PERSON_KEYS,1099),
            ('buildings',{'id','valid','kind','data'},16383),
            ('cities',{'id','valid','data'},41))
    for name,keys,maximum in tables:
        if type(frame[name]) is not list: raise ValueError(name+' list required')
        seen=set()
        for row in frame[name]:
            exact_keys(row,keys,name);integer(row['id'],name+' ID',0,maximum)
            boolean(row['valid'],name+' valid');_data(row['data'],name+' data')
            if row['id'] in seen: raise ValueError('duplicate '+name+' ID')
            seen.add(row['id'])
    for p in frame['persons']:
        integer(p['missionId'],'mission ID',I32_MIN,I32_MAX)
        integer(p['locationId'],'raw actual location',I32_MIN,I32_MAX)
        if type(p['missionArgs']) is not list or len(p['missionArgs'])!=5: raise ValueError('five mission args required')
        for n in p['missionArgs']:integer(n,'mission argument',I32_MIN,I32_MAX)
    for b in frame['buildings']:integer(b['kind'],'raw building kind',I32_MIN,I32_MAX)
    ids={p['id'] for p in frame['persons']}
    if type(frame['activePersonIds']) is not list:raise ValueError('active person list required')
    for pid in frame['activePersonIds']:
        integer(pid,'active person ID',0,1099)
        if pid not in ids:raise ValueError('active pointer requires explicit readable person slot')
    if frame['executingPersonId'] is not None:
        integer(frame['executingPersonId'],'executing person ID',0,1099)
        if frame['executingPersonId'] not in ids:raise ValueError('executing pointer requires explicit readable person slot')
    integer(frame['rngState'],'rng state',0,0xffffffff);_data(frame['data'],'frame data')


def _domain(frame):
    # These fixed typed pointer slots are the complete observation domain. Row
    # data keys outside list-valued fields cannot silently disappear. Lists are
    # atomic values because roster/list length changes are legitimate effects.
    def keys(v):
        return {k:keys(x) for k,x in v.items()} if type(v) is dict else None
    return {name:{row['id']:keys(row['data']) for row in frame[name]}
            for name in ('persons','buildings','cities')} | {'data':keys(frame['data'])}


def validate(state,command,observations,policy):
    exact_keys(state,{'source','revision','appliedCommands','frame'},'listener state')
    if state['source'] not in ('S1','S2'):raise ValueError('source S1/S2 required')
    integer(state['revision'],'revision',0,I32_MAX);validate_frame(state['frame'])
    if type(state['appliedCommands']) is not list:raise ValueError('appliedCommands list')
    seen=set()
    for r in state['appliedCommands']:
        exact_keys(r,{'id','sha256'},'applied command');text(r['id'],'command ID')
        if type(r['sha256']) is not str or len(r['sha256'])!=64 or any(x not in '0123456789abcdef' for x in r['sha256']):raise ValueError('applied digest')
        if r['id'] in seen:raise ValueError('duplicate command ID')
        seen.add(r['id'])
    exact_keys(command,{'id','expectedRevision','event'},'listener command')
    text(command['id'],'command ID');integer(command['expectedRevision'],'expected revision',0,I32_MAX)
    event=command['event'];exact_keys(event,{'id','subjectType','subjectId','argument'},'event')
    integer(event['id'],'event ID',8,14)
    if event['id'] not in (8,14):raise ValueError('only event8/14 supported')
    if event['subjectType'] not in ('person','building','null'):raise ValueError('typed event subject required')
    if event['subjectType']=='null':
        if event['subjectId'] is not None:raise ValueError('null subject must have null ID')
    else:integer(event['subjectId'],'subject ID',0,1099 if event['subjectType']=='person' else 16383)
    integer(event['argument'],'event argument dword',I32_MIN,I32_MAX)
    exact_keys(policy,{'id','ruleset','handlerTails','pointerDomain','registryDomain','listAssumption','provenance'},'listener policy')
    for k in ('id','provenance'):text(policy[k],k)
    if policy['ruleset'] not in ('PC-PK1.1','PC-Vanilla-assumed'):raise ValueError('separate ruleset required')
    if policy['handlerTails'] not in ('observed-frame','reject'):raise ValueError('handler tail mode')
    if policy['pointerDomain']!='typed-fixed-observation-slots-v1':raise ValueError('typed fixed observation domain required')
    if policy['registryDomain']!='initialized-unmodified-registry-v1':raise ValueError('source registry domain required')
    if policy['listAssumption']!='successful-copy-and-traversal-v1':raise ValueError('list domain required')
    exact_keys(observations,{'source','provenance','handlerFrames'},'listener observations')
    if observations['source']!=state['source']:raise ValueError('observation source mismatch')
    text(observations['provenance'],'observation provenance')
    if type(observations['handlerFrames']) is not list:raise ValueError('handlerFrames list')
    seen=set()
    for r in observations['handlerFrames']:
        exact_keys(r,{'visitIndex','personId','missionId','helper','tailStart','event','currentBuildingId','targetType','targetId','before','after','rngConsumption','provenance'},'handler frame')
        integer(r['visitIndex'],'visit index',0,I32_MAX);integer(r['personId'],'listener ID',0,1099)
        if r['missionId'] not in (23,24) or type(r['missionId']) is not int:raise ValueError('handler mission23/24')
        if r['helper']!=HANDLERS[r['missionId']]:raise ValueError('handler frame address mismatch')
        if r['tailStart']!=('005B6D87' if r['missionId']==23 else '005CFBEB'):raise ValueError('tail start mismatch')
        if _digest(r['event'])!=_digest(command['event']):raise ValueError('handler frame event mismatch')
        integer(r['currentBuildingId'],'saved current building ID',0,86)
        if r['targetType']!=('city' if r['missionId']==23 else 'building'):raise ValueError('saved target type mismatch')
        integer(r['targetId'],'saved target ID',0,41 if r['missionId']==23 else 16383)
        text(r['provenance'],'handler frame provenance');validate_frame(r['before']);validate_frame(r['after'])
        if _domain(r['before'])!=_domain(state['frame']) or _domain(r['after'])!=_domain(state['frame']):raise ValueError('handler frame changed observation domain')
        exact_keys(r['rngConsumption'],{'kind','calls'},'observed RNG consumption')
        if r['rngConsumption']['kind']=='unknown':
            if r['rngConsumption']['calls'] is not None:raise ValueError('unknown RNG count must be null')
        elif r['rngConsumption']['kind']=='observed-count':integer(r['rngConsumption']['calls'],'observed RNG calls',0,I32_MAX)
        else:raise ValueError('RNG consumption evidence required')
        if r['visitIndex'] in seen:raise ValueError('duplicate handler visit observation')
        seen.add(r['visitIndex'])


class _Reject(Exception):pass


class _Planner:
    def __init__(self,frame,event,observations,policy):
        self.frame=copy.deepcopy(frame);self.event=copy.deepcopy(event)
        self.observations={r['visitIndex']:r for r in observations['handlerFrames']}
        self.policy=policy;self.steps=[];self.effects=[];self.visits=[];self.used=set()
        self.copied=list(frame['activePersonIds'])
    def table(self,name):return {r['id']:r for r in self.frame[name]}
    def step(self,helper,**d):
        self.steps.append(dict(helper=helper,**copy.deepcopy(d),snapshot=copy.deepcopy(self.frame)))
    def valid(self,name,pid):
        # Omitted non-active typed slots are explicitly invalid in this domain.
        r=self.table(name).get(pid);return r is not None and r['valid']
    def predicate(self,p,mission):
        helper=PREDICATES[mission]
        if helper=='00441880':
            self.step(helper,predicate=True,returnValue=0);return False
        self.step(helper,phase='predicate-entry',personId=p['id'],missionId=mission)
        if mission not in (23,24):
            self.step(helper,phase='event-not-handled',eventId=self.event['id'],returnValue=0)
            return False
        self.step('0047A630',phase='predicate-listener',personId=p['id'],passed=p['valid'])
        if not p['valid']:return False
        args=p['missionArgs'][:]
        self.step('004897B0',argumentIndices=[0,1] if mission==23 else [0],values=args[:2] if mission==23 else args[:1])
        if (mission,self.event['id']) not in ((23,8),(24,14)):
            self.step(helper,phase='event-not-handled',eventId=self.event['id'],returnValue=0);return False
        person=mission==23;kind='person' if person else 'building';name='persons' if person else 'buildings'
        sid=self.event['subjectId'];cast=self.event['subjectType']==kind
        self.step('virtual+2C' if self.event['subjectType']!='null' else 'null-subject-skip-type-query',virtualCalled=self.event['subjectType']!='null',typeHelper='0067F810' if person else '00573470',typeId=10 if person else 5,subjectType=self.event['subjectType'],castSucceeded=cast)
        passed=cast and self.valid(name,sid)
        self.step('0047A630',phase='predicate-subject',passed=passed)
        if not passed:return False
        if not person:
            raw_kind=self.table('buildings')[sid]['kind']
            self.step('005D00A0/kind',kind=raw_kind,passed=raw_kind in (1,2))
            if raw_kind not in (1,2):return False
        target=args[1] if person else args[0]
        passed=sid==target
        self.step('00491310' if person else '00491770',subjectId=sid,targetId=target,passed=passed)
        return passed
    def handler(self,visit,pid,mission):
        p=self.table('persons')[pid];helper=HANDLERS[mission]
        self.step(helper,phase='handler-entry',personId=pid,capturedMissionId=mission,event=self.event)
        self.step('0047A630',phase='handler-listener',personId=pid,passed=p['valid'])
        if not p['valid']:return 0
        location=p['locationId'] if 0<=p['locationId']<=86 else -1
        passed=self.valid('buildings',location)
        self.step('inline-location-normalization/00490D00/0047A630',phase='current-building',effectiveLocationId=location,passed=passed)
        if not passed:return 0
        target=p['missionArgs'][0]
        table='cities' if mission==23 else 'buildings';maximum=41 if mission==23 else 16383
        passed=0<=target<=maximum and self.valid(table,target)
        self.step('004897B0/00490A10/0047A630' if mission==23 else '004897B0/00490D00/0047A630',phase='target',rawTargetId=target,effectiveTargetId=target if 0<=target<=maximum else -1,passed=passed)
        if not passed:return 0
        boundary=dict(visitIndex=visit,personId=pid,missionId=mission,helper=helper,
            reason='presentation and 005B8400 zero-refund return tail require an observed replacement',
            event=copy.deepcopy(self.event),tailStart='005B6D87' if mission==23 else '005CFBEB',currentBuildingId=location,targetType='city' if mission==23 else 'building',targetId=target,before=copy.deepcopy(self.frame),beforeStepIndex=len(self.steps))
        self.effects.append(boundary)
        if self.policy['handlerTails']=='reject':raise _Reject('handler-tail-rejected')
        if visit not in self.observations:raise ValueError('missing handler frame for visit '+str(visit))
        r=self.observations[visit]
        if (r['personId'],r['missionId'],r['helper'])!=(pid,mission,helper):raise ValueError('handler frame call mismatch')
        if any(r[k]!=boundary[k] for k in ('tailStart','event','currentBuildingId','targetType','targetId')):raise ValueError('handler frame saved call context mismatch')
        if _digest(r['before'])!=_digest(self.frame):raise ValueError('handler frame before does not match live observation domain')
        self.used.add(visit);self.frame=copy.deepcopy(r['after'])
        boundary.update(after=copy.deepcopy(self.frame),provenance=r['provenance'],rngConsumption=copy.deepcopy(r['rngConsumption']),replacementApplied=True)
        self.step(helper+'/observed-tail',personId=pid,refund=0,returnValue=1)
        return 1
    def run(self):
        self.step('0049F820',copiedActivePersonIds=self.copied)
        for visit,pid in enumerate(self.copied):
            p=self.table('persons')[pid]
            r=dict(visitIndex=visit,personId=pid,missionId=None,dispatcherReturn=None,handlerReturn=None)
            self.visits.append(r)
            self.step('004A8110/visit',visitIndex=visit,personId=pid,executingPersonId=self.frame['executingPersonId'])
            if pid==self.frame['executingPersonId']:r['route']='executing-person-skip';continue
            mission=p['missionId'];r['missionId']=mission
            if not 0<=mission<=43:r['route']='mission-range-skip';continue
            if mission==37:r.update(route='mission37-skip',dispatcherReturn=0);continue
            self.step('005B9D30',personId=pid,capturedMissionId=mission,predicate=PREDICATES[mission],handler=HANDLERS[mission],selfBypass=False)
            passed=self.predicate(p,mission)
            self.step(PREDICATES[mission]+'/result',returnValue=int(passed))
            if not passed:r.update(route='predicate-false',dispatcherReturn=0);continue
            result=self.handler(visit,pid,mission)
            r.update(route='handler-called',dispatcherReturn=1,handlerReturn=result)
            self.step('005B9D30/return',returnValue=1,handlerReturnIgnored=True)
        if set(self.observations)!=self.used:raise ValueError('unused handler frame observations')
        self.step('0047C100',temporaryListDestroyed=True)


def project_mission_event(state,command,observations,policy):
    """Project only 004A8110(event8/14), not 004BA1D0/UI or a governor write."""
    validate(state,command,observations,policy)
    result=dict(schemaVersion=1,profileId=PROFILE_ID,source=state['source'],accepted=False,replayed=False,reason=None,
        before=copy.deepcopy(state),after=copy.deepcopy(state),command=copy.deepcopy(command),observations=copy.deepcopy(observations),policy=copy.deepcopy(policy),
        copiedActivePersonIds=[],visits=[],steps=[],observedEffects=[],
        rng=dict(initialState=state['frame']['rngState'],finalState=state['frame']['rngState'],localCalls=0,observedTailCalls=0,allTailCountsKnown=True,globalConsumptionVerified=False),
        evidence=dict(sourceLocalOnly=True,stockVerified=False,vanillaVerified=False,handlerTailsExecuted=False,callbacksAssumedNoninterfering=False,
            fullEventExecuted=False,fullReturnExecuted=False,completeGameTransaction=False,observationAuthenticityVerified=False,
            runtimeStatus='compatibility-reconstruction' if policy['ruleset']=='PC-PK1.1' else 'compatibility-assumption'))
    def finish():result['traceHash']=_digest(result);return result
    digest=_digest(command);old=next((r for r in state['appliedCommands'] if r['id']==command['id']),None)
    if old:
        result['replayed']=old['sha256']==digest;result['accepted']=result['replayed']
        result['reason']='replay' if result['replayed'] else 'replay-payload-conflict';return finish()
    if command['expectedRevision']!=state['revision']:result['reason']='revision-conflict';return finish()
    if state['revision']==I32_MAX:raise ValueError('revision exhausted')
    plan=_Planner(state['frame'],command['event'],observations,policy)
    try:plan.run()
    except _Reject as error:
        result.update(reason=str(error),observedEffects=copy.deepcopy(plan.effects));return finish()
    result.update(accepted=True,reason='listeners-projected',copiedActivePersonIds=plan.copied,visits=plan.visits,steps=plan.steps,observedEffects=plan.effects)
    after=copy.deepcopy(state);after['frame']=plan.frame;after['revision']+=1;after['appliedCommands'].append(dict(id=command['id'],sha256=digest));result['after']=after
    counts=[e['rngConsumption'] for e in plan.effects]
    known=all(c['kind']=='observed-count' for c in counts)
    result['rng'].update(finalState=plan.frame['rngState'],allTailCountsKnown=known,observedTailCalls=sum(c['calls'] for c in counts) if known else None)
    return finish()


def replay_mission_event(trace):
    if type(trace) is not dict:raise ValueError('trace object required')
    value=copy.deepcopy(trace);digest=value.pop('traceHash',None)
    if digest!=_digest(value):raise ValueError('trace hash mismatch')
    try:result=project_mission_event(trace['before'],trace['command'],trace['observations'],trace['policy'])
    except (KeyError,TypeError) as error:raise ValueError('invalid trace inputs') from error
    if result!=trace:raise ValueError('trace replay mismatch')
    return result
