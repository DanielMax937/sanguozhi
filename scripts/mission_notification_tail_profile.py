"""P0-60 independent source-local notification/zero-refund return projection.

Known ordered writes are executed; presentation, observer and full-return effects
require stage-bound mutable frames or atomic rejection. No old API is modified.
"""
from __future__ import annotations
import copy
from capture_transaction_profile import exact_keys, integer, boolean
from capture_personnel_profile import text
from mission_cancellation_v2_profile import _digest
from mission_event_listener_profile import _json

PROFILE_ID = 'source-idb-S1-S2-mission-notification-tail-v1'
I32_MIN, I32_MAX = -2**31, 2**31-1
TABLES = {
    'persons': ({'id','allocated','valid','status','homeBaseId','locationId','rawLegionId','missionId','missionArgs','missionDuration','flags124','data'},1099),
    'buildings': ({'id','valid','kind','data'},16383),
    'cities': ({'id','valid','data'},41),
    'forces': ({'id','valid','playerIndex','raw44','data'},46),
    'legions': ({'id','valid','forceId','number','data'},46),
}
FRAME_KEYS = set(TABLES) | {'activePersonIds','executingPersonId','managerDirty','observerPresent','rngState','data'}


def validate_frame(frame):
    exact_keys(frame,FRAME_KEYS,'tail frame')
    for name,(keys,hi) in TABLES.items():
        if type(frame[name]) is not list: raise ValueError(name+' list required')
        seen=set()
        for row in frame[name]:
            exact_keys(row,keys,name);integer(row['id'],name+' ID',0,hi);boolean(row['valid'],name+' valid')
            if row['id'] in seen: raise ValueError('duplicate '+name+' ID')
            seen.add(row['id'])
            if type(row['data']) is not dict:raise ValueError('row data object required')
            _json(row['data'],'row data')
    for p in frame['persons']:
        boolean(p['allocated'],'allocated')
        if p['valid'] and not p['allocated']: raise ValueError('valid person must be allocated')
        for k in ('status','homeBaseId','locationId','rawLegionId','missionId'):integer(p[k],k,I32_MIN,I32_MAX)
        integer(p['missionDuration'],'duration byte',0,255);integer(p['flags124'],'flags124',0,0xffffffff)
        if type(p['missionArgs']) is not list or len(p['missionArgs'])!=5:raise ValueError('five mission args required')
        for v in p['missionArgs']:integer(v,'mission arg',I32_MIN,I32_MAX)
    for b in frame['buildings']:integer(b['kind'],'kind',I32_MIN,I32_MAX)
    for f in frame['forces']:
        integer(f['playerIndex'],'force player index',I32_MIN,I32_MAX);integer(f['raw44'],'force raw+44 dword',I32_MIN,I32_MAX)
    for l in frame['legions']:
        integer(l['forceId'],'legion force',I32_MIN,I32_MAX);integer(l['number'],'legion number dword',I32_MIN,I32_MAX)
        if l['valid'] and not 0<=l['forceId']<=46:raise ValueError('valid legion requires numeric force0..46')
    ids={p['id'] for p in frame['persons']}
    if type(frame['activePersonIds']) is not list:raise ValueError('ordered active list required')
    for pid in frame['activePersonIds']:
        integer(pid,'active ID',0,1099)
        if pid not in ids:raise ValueError('unreadable active pointer')
    if frame['executingPersonId'] is not None:
        integer(frame['executingPersonId'],'executing ID',0,1099)
        if frame['executingPersonId'] not in ids:raise ValueError('unreadable executing pointer')
    integer(frame['rngState'],'RNG state',0,0xffffffff)
    integer(frame['managerDirty'],'manager dirty dword',0,0xffffffff);boolean(frame['observerPresent'],'observer presence')
    if type(frame['data']) is not dict:raise ValueError('frame data object required')
    _json(frame['data'],'frame data')


def _domain(frame):
    def keys(v):return {k:keys(x) for k,x in v.items()} if type(v) is dict else None
    return {n:{r['id']:keys(r['data']) for r in frame[n]} for n in TABLES} | {'data':keys(frame['data'])}


def validate(state,command,observations,policy):
    exact_keys(state,{'source','revision','appliedCommands','frame'},'tail state')
    if state['source'] not in ('S1','S2'):raise ValueError('source S1/S2 required')
    integer(state['revision'],'revision',0,I32_MAX);validate_frame(state['frame'])
    if type(state['appliedCommands']) is not list:raise ValueError('appliedCommands list required')
    seen=set()
    for r in state['appliedCommands']:
        exact_keys(r,{'id','sha256'},'applied command');text(r['id'],'command ID')
        if type(r['sha256']) is not str or len(r['sha256'])!=64 or any(c not in '0123456789abcdef' for c in r['sha256']):raise ValueError('applied digest')
        if r['id'] in seen:raise ValueError('duplicate command ID')
        seen.add(r['id'])
    exact_keys(command,{'id','expectedRevision','personId','kind'},'tail command')
    text(command['id'],'command ID');integer(command['expectedRevision'],'expected revision',0,I32_MAX);integer(command['personId'],'actor ID',0,1099)
    if command['personId'] not in {p['id'] for p in state['frame']['persons']}:raise ValueError('actor slot required')
    if command['kind'] not in ('notification-gate','return-zero','handler23','handler24','ensure-active','set-acted'):raise ValueError('unsupported tail command')
    exact_keys(policy,{'id','ruleset','unknownEffects','pointerDomain','listAssumption','provenance'},'tail policy')
    for k in ('id','provenance'):text(policy[k],k)
    if policy['ruleset'] not in ('PC-PK1.1','PC-Vanilla-assumed'):raise ValueError('separate ruleset required')
    if policy['unknownEffects'] not in ('observed-frame','reject'):raise ValueError('mutable effects or reject required')
    if policy['pointerDomain']!='fixed-canonical-observed-getters-v1':raise ValueError('canonical getter observation domain required')
    if policy['listAssumption']!='readable-acyclic-successful-append-v1':raise ValueError('successful list domain required')
    exact_keys(observations,{'source','provenance','records'},'tail observations')
    if observations['source']!=state['source']:raise ValueError('observation source mismatch')
    text(observations['provenance'],'provenance')
    if type(observations['records']) is not list:raise ValueError('ordered boundary records required')
    for i,r in enumerate(observations['records']):
        base={'index','kind','helper','args','before','provenance'}
        if type(r) is not dict or r.get('kind') not in ('query','effect','effect-query'):raise ValueError('boundary kind')
        exact_keys(r,base|({'result'} if r['kind']=='query' else {'after','rngConsumption','result'} if r['kind']=='effect-query' else {'after','rngConsumption'}),'boundary record')
        integer(r['index'],'boundary index',0,I32_MAX)
        if r['index']!=i:raise ValueError('ordered contiguous boundary index')
        for k in ('helper','provenance'):text(r[k],k)
        if type(r['args']) is not dict:raise ValueError('args object required')
        _json(r['args'],'args');validate_frame(r['before'])
        if _domain(r['before'])!=_domain(state['frame']):raise ValueError('before domain mismatch')
        if r['kind'] in ('query','effect-query'):_json(r['result'],'query result')
        if r['kind']!='query':
            validate_frame(r['after'])
            if _domain(r['after'])!=_domain(state['frame']):raise ValueError('after domain mismatch')
            c=r['rngConsumption'];exact_keys(c,{'kind','calls'},'RNG observation')
            if c['kind']=='unknown':
                if c['calls'] is not None:raise ValueError('unknown count must be null')
            elif c['kind']=='observed-count':integer(c['calls'],'observed calls',0,I32_MAX)
            else:raise ValueError('RNG evidence kind')


class _Reject(Exception):pass


class _Planner:
    def __init__(self,state,command,observations,policy):
        self.frame=copy.deepcopy(state['frame']);self.source=state['source'];self.command=command
        self.records=observations['records'];self.policy=policy;self.cursor=0
        self.steps=[];self.effects=[];self.queries=[];self.pid=command['personId'];self.returnValue=None
    def row(self,name,rid):return next((r for r in self.frame[name] if r['id']==rid),None)
    def person(self):return self.row('persons',self.pid)
    def slot(self,name,rid):
        if not 0<=rid<=TABLES[name][1]:return None
        r=self.row(name,rid)
        if r is None:raise ValueError('missing observed '+name+' slot '+str(rid))
        return r
    def step(self,helper,**details):self.steps.append(dict(helper=helper,**copy.deepcopy(details),frame=copy.deepcopy(self.frame)))
    def boundary(self,kind,helper,**args):
        binding=dict(index=self.cursor,kind=kind,helper=helper,args=args,before=copy.deepcopy(self.frame))
        if kind!='query' and self.policy['unknownEffects']=='reject':
            self.effects.append(dict(**binding,deferred=True));raise _Reject('unresolved-effect:'+helper)
        if self.cursor>=len(self.records):raise ValueError('missing '+helper+' boundary observation')
        r=self.records[self.cursor]
        if any(_digest(r[k])!=_digest(v) for k,v in binding.items()):raise ValueError('stale or misbound '+helper+' observation')
        self.cursor+=1
        if kind=='query':self.queries.append(copy.deepcopy(r));self.step(helper,result=r['result'],**args);return r['result']
        self.effects.append(copy.deepcopy(r));self.frame=copy.deepcopy(r['after']);self.step(helper,observed=True,**args)
        if kind=='effect-query':return r['result']
    def actor_force(self):
        lid=self.person()['rawLegionId'];legion=self.slot('legions',lid)
        valid=bool(legion and legion['valid']);fid=legion['forceId'] if valid else -1
        self.step('0047B2B0',rawLegionId=lid,legionValid=valid,forceId=fid)
        return self.slot('forces',fid)
    def notification(self):
        p=self.person();self.step('005B81D0/actor-valid',passed=p['valid'])
        if not p['valid']:return 0
        force=self.actor_force();valid=bool(force and force['valid'])
        self.step('005B81D0/force-valid',passed=valid)
        if not valid:return 0
        player=0<=force['playerIndex']<=7;self.step('00480FA0',forceId=force['id'],playerIndex=force['playerIndex'],result=player)
        if not player:return 0
        legion=self.slot('legions',p['rawLegionId']);valid=bool(legion and legion['valid'])
        self.step('005B81D0/legion-valid',legionId=p['rawLegionId'],passed=valid)
        if not valid:return 0
        # Canonical legion virtual48 repeats force-valid/player. virtual44
        # resolves the same fixed-array slot; no mutation occurs between reads.
        force=self.slot('forces',legion['forceId']);valid=bool(force and force['valid'])
        player=bool(valid and 0<=force['playerIndex']<=7)
        self.step('0047A690',legionId=legion['id'],forceValid=valid,playerQuery=player)
        if not player:return 0
        self.step('0047A6D0',resolvedLegionId=legion['id'],valid=legion['valid'],number=legion['number'],result=legion['number']==1)
        return int(legion['number']==1)
    def acted(self,wrapper=True):
        if wrapper:
            self.step('004A5600',personId=self.pid,passed=self.person()['valid'])
            if not self.person()['valid']:return
            if self.source=='S2':
                answer=self.boundary('effect-query','004890F0',personId=self.pid,skillId=267)
                boolean(answer,'S2 skill267 result');self.step('0090CBA0',query267=answer)
                if answer:return
        self.person()['flags124']|=1;self.step('00489B40/00472520',personId=self.pid,bit=0,value=True)
        self.frame['managerDirty']=1;self.step('004A06A0/004829B0',address='07201B24',value=1)
        present=self.frame['observerPresent'];self.step('004B9480/004EC870',observerPresent=present)
        if present:self.boundary('effect','observer.virtual1B4',nativeArgs=[0,0,0,0],caller='004B9480')
    def active(self):
        passed=self.person()['valid'];self.step('00482F80/valid',personId=self.pid,passed=passed)
        if not passed:return
        found=self.pid in self.frame['activePersonIds'];self.step('00482AF0',personId=self.pid,found=found)
        if not found:self.frame['activePersonIds'].append(self.pid);self.step('0047C1B0',personId=self.pid,append=True)
    def duration(self,value):
        passed=self.person()['valid'];self.step('004A5660/valid',personId=self.pid,passed=passed)
        if passed:self.person()['missionDuration']=value&255;self.step('0048A8B0',value=value&255,rawInput=value)
    def return_zero(self):
        p=self.person();location=p['locationId'] if 0<=p['locationId']<=86 else -1;home=p['homeBaseId']
        self.step('005B8400',personId=self.pid,normalizedLocationId=location,savedHomeId=home,refund=0)
        if location!=home:
            # These are getter identities, not building-validity gates.
            self.slot('buildings',location);self.slot('buildings',home)
            distance=self.boundary('query','0049E4D0',currentBuildingId=location,homeBuildingId=home if 0<=home<=16383 else -1)
            integer(distance,'source distance result',-1,255)
            p=self.person();self.step('004A73A0/valid',passed=p['valid'],cancelOld=False,missionId=37)
            if p['valid']:
                p['missionId']=37;p['missionArgs']=[0]*5;self.step('00489BD0',missionId=37,missionArgs=[0]*5)
                self.acted(wrapper=False);self.active()
            self.duration(distance)
        else:
            p=self.person();self.step('004A5780/allocated',passed=p['allocated'])
            if p['allocated']:p['missionId']=-1;p['missionArgs']=[0]*5;self.step('00489BD0',missionId=-1,missionArgs=[0]*5)
            self.duration(0);self.acted()
            status=self.person()['status'];self.step('00488C70',status=status,result=status==5)
            if status!=5:
                self.slot('buildings',home)
                self.boundary('effect','004BF6F0',personId=self.pid,targetBuildingId=home,showNotice=0,noticeVariant=1)
    def handler(self,mission):
        p=self.person();self.step('handler/actor-valid',mission=mission,passed=p['valid'])
        if not p['valid']:return 0
        current=p['locationId'] if 0<=p['locationId']<=86 else -1
        b=self.slot('buildings',current);self.step('handler/current-valid',buildingId=current,passed=bool(b and b['valid']))
        if not b or not b['valid']:return 0
        target=p['missionArgs'][0];name='cities' if mission==23 else 'buildings'
        if mission==23 and not 0<=target<=41:target=-1
        t=self.slot(name,target);self.step('handler/target-valid',targetType=name,targetId=target,passed=bool(t and t['valid']))
        if not t or not t['valid']:return 0
        force=self.actor_force();saved44=force['raw44'] if force and force['valid'] else -1
        self.step('handler/saved-pointers',currentBuildingId=current,targetType=name,targetId=target,savedForce44=saved44)
        if self.notification():
            self.boundary('effect','005B6DC4..005B6E35' if mission==23 else '005CFC28..005CFC99',personId=self.pid,currentBuildingId=current,targetType=name,targetId=target,savedForce44=saved44,messageId=0x15a6 if mission==23 else 0x15b6)
        self.return_zero();return 1
    def run(self):
        kind=self.command['kind']
        if kind=='notification-gate':self.returnValue=self.notification()
        elif kind=='return-zero':self.return_zero()
        elif kind=='ensure-active':self.active()
        elif kind=='set-acted':self.acted()
        else:self.returnValue=self.handler(23 if kind=='handler23' else 24)
        if self.cursor!=len(self.records):raise ValueError('unused boundary observations')


def project_mission_notification_tail(state,command,observations,policy):
    validate(state,command,observations,policy)
    result=dict(schemaVersion=1,profileId=PROFILE_ID,source=state['source'],accepted=False,replayed=False,reason=None,
        before=copy.deepcopy(state),after=copy.deepcopy(state),command=copy.deepcopy(command),observations=copy.deepcopy(observations),policy=copy.deepcopy(policy),steps=[],observedEffects=[],queries=[],returnValue=None,
        rng=dict(initialState=state['frame']['rngState'],finalState=state['frame']['rngState'],localCalls=0,observedCalls=0,allCountsKnown=True,globalConsumptionVerified=False),
        evidence=dict(sourceLocalOnly=True,stockVerified=False,vanillaVerified=False,fullReturnExecuted=False,fullEventExecuted=False,completeGameTransaction=False,callbacksAssumedNoninterfering=False,observationAuthenticityVerified=False,
                      runtimeStatus='compatibility-reconstruction' if policy['ruleset']=='PC-PK1.1' else 'compatibility-assumption'))
    def finish():result['traceHash']=_digest(result);return result
    digest=_digest(command);old=next((r for r in state['appliedCommands'] if r['id']==command['id']),None)
    if old:
        result.update(replayed=old['sha256']==digest,accepted=old['sha256']==digest,reason='replay' if old['sha256']==digest else 'replay-payload-conflict');return finish()
    if command['expectedRevision']!=state['revision']:result['reason']='revision-conflict';return finish()
    if state['revision']==I32_MAX:raise ValueError('revision exhausted')
    plan=_Planner(state,command,observations,policy)
    try:plan.run()
    except _Reject as error:result.update(reason=str(error),observedEffects=copy.deepcopy(plan.effects));return finish()
    result.update(accepted=True,reason='tail-projected',steps=plan.steps,observedEffects=plan.effects,queries=plan.queries,returnValue=plan.returnValue)
    after=copy.deepcopy(state);after.update(frame=plan.frame,revision=state['revision']+1);after['appliedCommands'].append(dict(id=command['id'],sha256=digest));result['after']=after
    counts=[e['rngConsumption'] for e in plan.effects];known=all(c['kind']=='observed-count' for c in counts)
    result['rng'].update(finalState=plan.frame['rngState'],allCountsKnown=known,observedCalls=sum(c['calls'] for c in counts) if known else None)
    return finish()


def replay_mission_notification_tail(trace):
    if type(trace) is not dict:raise ValueError('trace object required')
    value=copy.deepcopy(trace);digest=value.pop('traceHash',None)
    if digest!=_digest(value):raise ValueError('trace hash mismatch')
    try:result=project_mission_notification_tail(trace['before'],trace['command'],trace['observations'],trace['policy'])
    except (KeyError,TypeError) as error:raise ValueError('invalid trace inputs') from error
    if result!=trace:raise ValueError('trace replay mismatch')
    return result
