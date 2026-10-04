"""P0-62 live native return/list/role/event recursion in one atomic transaction.

Only declared canonical source domains execute. Opaque sorts and transitive
callbacks require stage-bound mutable observations. Resource limits are engine
safety guards, never claimed original SAN11 recursion/termination rules.
"""
from __future__ import annotations
import copy
from contextlib import contextmanager
from capture_transaction_profile import exact_keys, integer, boolean
from capture_personnel_profile import text
from mission_cancellation_v2_profile import _digest, HANDLERS
from mission_event_listener_profile import PREDICATES, _json
from mission_event_composition_profile import validate_event
from mission_composition_frame import SharedFrameAdapter, ListenerPrimitiveAdapter, TailPrimitiveAdapter
from recursive_return_frame import FRAME_PROFILE_ID, validate_frame, frame_domain
from recursive_role_primitives import RecursiveRolePrimitives

PROFILE_ID = 'source-idb-S1-S2-recursive-officer-return-v1'
I32_MIN, I32_MAX = -2**31, 2**31-1


def validate(state,command,observations,policy):
    exact_keys(state,{'source','revision','appliedCommands','frame'},'recursive state')
    if state['source'] not in ('S1','S2'): raise ValueError('source S1/S2 required')
    integer(state['revision'],'revision',0,I32_MAX); validate_frame(state['frame'])
    if type(state['appliedCommands']) is not list: raise ValueError('applied command list')
    seen=set()
    for r in state['appliedCommands']:
        exact_keys(r,{'id','sha256'},'applied command');text(r['id'],'command ID')
        if type(r['sha256']) is not str or len(r['sha256'])!=64 or any(c not in '0123456789abcdef' for c in r['sha256']): raise ValueError('applied digest')
        if r['id'] in seen: raise ValueError('duplicate command ID')
        seen.add(r['id'])
    exact_keys(command,{'id','expectedRevision','entry','args'},'recursive command')
    text(command['id'],'command ID');integer(command['expectedRevision'],'expected revision',0,I32_MAX)
    a=command['args']; entry=command['entry']
    if entry=='event': validate_event(a)
    elif entry=='return':
        exact_keys(a,{'personId','targetBuildingId','showNotice','noticeVariant'},'return args')
        integer(a['personId'],'person ID',0,1099)
        for k in ('targetBuildingId','showNotice','noticeVariant'): integer(a[k],k,I32_MIN,I32_MAX)
    elif entry in ('legion','governor'):
        exact_keys(a,{'targetId'},'role args');integer(a['targetId'],'role target',I32_MIN,I32_MAX)
    else: raise ValueError('unsupported recursive entry')
    exact_keys(policy,{'id','ruleset','unknownEffects','frameProfile','registryDomain','listAssumption','engineGuard','provenance'},'recursive policy')
    for k in ('id','provenance'): text(policy[k],k)
    if policy['ruleset'] not in ('PC-PK1.1','PC-Vanilla-assumed'): raise ValueError('separate ruleset required')
    if policy['unknownEffects'] not in ('observed-frame','reject'): raise ValueError('mutable observation or reject required')
    if policy['frameProfile']!=FRAME_PROFILE_ID: raise ValueError('expanded frame required')
    if policy['registryDomain']!='initialized-unmodified-registry-v1': raise ValueError('registry domain required')
    if policy['listAssumption']!='readable-acyclic-successful-allocation-v1': raise ValueError('successful allocation domain required')
    exact_keys(policy['engineGuard'],{'maxEventDepth','maxNativeCalls'},'engine guard')
    integer(policy['engineGuard']['maxEventDepth'],'engine event depth',1,32)
    integer(policy['engineGuard']['maxNativeCalls'],'engine call budget',1,100000)
    exact_keys(observations,{'source','provenance','records'},'recursive observations')
    if observations['source']!=state['source']: raise ValueError('observation source mismatch')
    text(observations['provenance'],'provenance')
    if type(observations['records']) is not list: raise ValueError('ordered records required')
    domain=frame_domain(state['frame'])
    for index,r in enumerate(observations['records']):
        base={'index','source','kind','helper','args','callStack','before','provenance'}
        if type(r) is not dict or r.get('kind') not in ('query','effect','effect-query'): raise ValueError('boundary kind')
        extra={'result'} if r['kind']=='query' else {'after','rngConsumption','result'} if r['kind']=='effect-query' else {'after','rngConsumption'}
        exact_keys(r,base|extra,'boundary record');integer(r['index'],'index',0,I32_MAX)
        if r['index']!=index: raise ValueError('contiguous boundary index required')
        if r['source']!=state['source']: raise ValueError('record source mismatch')
        for k in ('helper','provenance'): text(r[k],k)
        if type(r['args']) is not dict or type(r['callStack']) is not list or not r['callStack']: raise ValueError('args/stack required')
        _json(r['args'],'args');_json(r['callStack'],'call stack');validate_frame(r['before'])
        if frame_domain(r['before'])!=domain: raise ValueError('before domain mismatch')
        if r['kind'] in ('query','effect-query'): _json(r['result'],'query result')
        if r['kind']!='query':
            validate_frame(r['after'])
            if frame_domain(r['after'])!=domain: raise ValueError('after domain mismatch')
            c=r['rngConsumption'];exact_keys(c,{'kind','calls'},'RNG observation')
            if c['kind']=='unknown':
                if c['calls'] is not None: raise ValueError('unknown calls must be null')
            elif c['kind']=='observed-count': integer(c['calls'],'observed calls',0,I32_MAX)
            else: raise ValueError('RNG evidence kind')


class _Reject(Exception): pass


class _Planner(SharedFrameAdapter, ListenerPrimitiveAdapter, TailPrimitiveAdapter, RecursiveRolePrimitives):
    def __init__(self,state,command,observations,policy):
        self.frame=copy.deepcopy(state['frame']);self.source=state['source'];self.command=command
        self.records=observations['records'];self.policy=policy;self.cursor=0;self.stack=[]
        self.steps=[];self.effects=[];self.queries=[];self.events=[];self.event_contexts=[];self.actor_contexts=[]
        self.nativeCalls=0;self.returnCalls=0

    @property
    def pid(self): return self.actor_contexts[-1] if self.actor_contexts else None
    @property
    def event(self): return self.event_contexts[-1]['event'] if self.event_contexts else None
    def defer(self,reason): raise _Reject(reason)

    @contextmanager
    def actor(self,pid):
        self.actor_contexts.append(pid)
        try: yield
        finally: self.actor_contexts.pop()

    @contextmanager
    def scope(self,helper,**locals):
        # Resource accounting counts modeled scope entries, including explicit
        # saved-local scopes. It is not a literal x86 CALL/comparator count.
        self.nativeCalls+=1
        if self.nativeCalls>self.policy['engineGuard']['maxNativeCalls']: self.defer('engine-guard-native-call-budget')
        self.stack.append(dict(helper=helper,locals=copy.deepcopy(locals)))
        try: yield
        finally: self.stack.pop()

    def save(self,**locals): self.stack[-1]['locals'].update(copy.deepcopy(locals))
    def step(self,helper,**details):
        if helper in ('handler/saved-pointers','005B8400'): self.save(**details)
        self.steps.append(dict(helper=helper,**copy.deepcopy(details),callStack=copy.deepcopy(self.stack),frame=copy.deepcopy(self.frame)))

    def boundary(self,kind,helper,**args):
        # Reused tail primitive now invokes native return, never an old projected
        # transaction or an observation that swallows its role/event stages.
        if helper=='004BF6F0': return self.officer_return(**args)
        binding=dict(index=self.cursor,source=self.source,kind=kind,helper=helper,args=copy.deepcopy(args),callStack=copy.deepcopy(self.stack),before=copy.deepcopy(self.frame))
        if kind!='query' and self.policy['unknownEffects']=='reject':
            self.effects.append(dict(**binding,deferred=True));self.defer('unresolved-effect:'+helper)
        if self.cursor>=len(self.records): raise ValueError('missing '+helper+' boundary observation')
        r=self.records[self.cursor]
        if any(_digest(r[k])!=_digest(v) for k,v in binding.items()): raise ValueError('stale or misbound '+helper+' observation')
        self.cursor+=1
        if kind=='query':
            if helper=='0049E4D0': self.save(savedDistance=r['result'])
            self.queries.append(copy.deepcopy(r));self.step(helper,result=r['result'],**args);return r['result']
        self.effects.append(copy.deepcopy(r));self.frame=copy.deepcopy(r['after']);self.step(helper,observed=True,**args)
        if kind=='effect-query': return r['result']

    def return_zero(self):
        with self.scope('005B8400',personId=self.pid,refund=0): self.return_zero_primitive()

    def dispatch(self,visit,pid,mission):
        with self.actor(pid),self.scope('005B9D30',visitIndex=visit,personId=pid,capturedMissionId=mission):
            self.step('005B9D30',personId=pid,capturedMissionId=mission,predicate=PREDICATES[mission],handler=HANDLERS[mission],selfBypass=False)
            passed=self.predicate(self.person(),mission);self.step(PREDICATES[mission]+'/result',returnValue=int(passed))
            if not passed: return 0,None
            with self.scope(HANDLERS[mission],personId=pid,capturedMissionId=mission): value=self.handler_primitive(mission)
            self.step('005B9D30/return',returnValue=1,handlerReturnIgnored=True)
            return 1,value

    def listeners(self,context):
        copied=list(self.frame['activePersonIds']);context['copiedActivePersonIds']=copied
        with self.scope('004A8110',copiedActivePersonIds=copied):
            self.step('0049F820',copiedActivePersonIds=copied)
            for visit,pid in enumerate(copied):
                r=dict(visitIndex=visit,personId=pid,missionId=None,dispatcherReturn=None,handlerReturn=None);context['visits'].append(r)
                self.step('004A8110/visit',visitIndex=visit,personId=pid,executingPersonId=self.frame['executingPersonId'])
                if pid==self.frame['executingPersonId']: r['route']='executing-person-skip';continue
                mission=self.slot('persons',pid)['missionId'];r['missionId']=mission
                if not 0<=mission<=43: r['route']='mission-range-skip';continue
                if mission==37: r.update(route='mission37-skip',dispatcherReturn=0);continue
                dispatch,handler=self.dispatch(visit,pid,mission)
                r.update(route='handler-called' if dispatch else 'predicate-false',dispatcherReturn=dispatch,handlerReturn=handler)
            self.step('0047C100',temporaryListDestroyed=True)

    def emit_event(self,event):
        validate_event(event)
        if len(self.event_contexts)>=self.policy['engineGuard']['maxEventDepth']: self.defer('engine-guard-event-depth')
        context=dict(eventIndex=len(self.events),parentEventIndex=self.event_contexts[-1]['eventIndex'] if self.event_contexts else None,event=copy.deepcopy(event),copiedActivePersonIds=[],visits=[])
        self.events.append(context);self.event_contexts.append(context)
        try:
            with self.scope('004BBAA0',event=event):
                self.step('004BBAA0/stack-event',event=event);self.listeners(context)
                self.step('004BA1D0',event=event,route='event8/14-no-op')
                present=self.frame['observerPresent'];self.step('004EC870',caller='004BBAA0',observerPresent=present)
                if present:self.boundary('effect','observer.virtual1B4',nativeArgs=[0,0,0,0],caller='004BBAA0')
                self.step('004BBAA0/return',event=event)
        finally: self.event_contexts.pop()

    def roster_id(self,bid):
        b=self.slot('buildings',bid)
        if b is None:return None
        canonical=(b['kind']==0 and 0<=bid<=41) or (b['kind']==1 and 42<=bid<=51) or (b['kind']==2 and 52<=bid<=86)
        return bid if canonical and b['subtypeValid'] else None

    def base_id(self,bid):
        b=self.slot('buildings',bid)
        if b is None:return -1
        return bid if (b['kind']==0 and 0<=bid<=41) or (b['kind']==1 and 42<=bid<=51) or (b['kind']==2 and 52<=bid<=86) else -1

    def roster_remove(self,table,rid,key,pid):
        values=self.slot(table,rid)[key];found=pid in values
        self.step('00482AF0',table=table,rosterId=rid,personId=pid,found=found,searchFromHead=True)
        if found: values.remove(pid);self.step('00482FC0',table=table,rosterId=rid,personId=pid,firstOnly=True)

    def roster_append_sort(self,table,rid,key,pid):
        self.slot(table,rid)[key].append(pid);self.step('0047C1B0',table=table,rosterId=rid,personId=pid,append=True)
        with self.scope('0047CD50',table=table,rosterId=rid,rosterField=key,arguments=[1,0,0,0]):
            count=len(self.slot(table,rid)[key]);self.step('0047CD50/count',count=count)
            if count>=2:self.boundary('effect','0047CD50',table=table,rosterId=rid,rosterField=key,arguments=[1,0,0,0])
            else:self.step('0047CD50/return',returnValue=1,countBelowTwo=True)

    def set_home(self,pid,requested):
        with self.scope('004A31E0',personId=pid,requestedHomeId=requested):
            p=self.slot('persons',pid);self.step('004A31E0/allocated',passed=p['allocated'])
            if not p['allocated']:return
            self.slot('buildings',requested);old=p['homeBaseId'];roster=self.roster_id(old)
            if roster is not None:self.roster_remove('buildings',roster,'homeRosterIds',pid)
            self.write('persons',pid,'homeBaseId',requested,'004A3272')
            roster=self.roster_id(requested)
            if roster is not None:self.roster_append_sort('buildings',roster,'homeRosterIds',pid)

    def set_legion(self,pid,requested):
        with self.scope('004A32F0',personId=pid,requestedLegionId=requested):
            p=self.slot('persons',pid);self.step('004A32F0/allocated',passed=p['allocated'])
            if not p['allocated']:return
            old=p['rawLegionId']
            if self.valid('legions',old):self.roster_remove('legions',old,'rosterIds',pid)
            if requested==-1 or 0<=requested<=46:
                self.write('persons',pid,'rawLegionId',requested,'004A3355')
                if requested>=0:self.write('persons',pid,'flags124',self.slot('persons',pid)['flags124']|(1<<9),'00489E70/00472520')
            if self.valid('legions',requested):self.roster_append_sort('legions',requested,'rosterIds',pid)

    def target_force(self,bid,stage):
        value=self.boundary('effect-query','00487EB0/virtual+40',buildingId=bid,stage=stage)
        integer(value,'target force result',I32_MIN,I32_MAX);return value

    def officer_return(self,personId,targetBuildingId,showNotice,noticeVariant):
        pid=personId;target=targetBuildingId
        with self.actor(pid),self.scope('004BF6F0',personId=pid,targetBuildingId=target,showNotice=showNotice,noticeVariant=noticeVariant):
            self.returnCalls+=1
            self.step('0047A630/actor',passed=self.valid('persons',pid))
            if not self.valid('persons',pid):return
            self.step('0047A630/target',passed=self.valid('buildings',target))
            if not self.valid('buildings',target):return
            p=self.person();old_status=p['status'];old_home=p['homeBaseId'];old_legion=p['rawLegionId']
            old_home=old_home if self.slot('buildings',old_home) is not None else -1
            old_legion=old_legion if self.slot('legions',old_legion) is not None else -1
            self.save(savedTargetId=target,savedOldStatus=old_status,savedOldHomeId=old_home,savedOldLegionId=old_legion)
            unused_governor=self.governor_id(target);self.slot('persons',unused_governor)
            self.step('00486890/00490B00',targetBuildingId=target,governorId=unused_governor,resultUsed=False)
            if showNotice:
                force=self.actor_force();legion=self.slot('legions',self.person()['rawLegionId'])
                eligible=bool(force and force['valid'] and 0<=force['playerIndex']<=7 and legion and legion['valid'] and legion['number']==1)
                self.step('0047A6D0',personId=pid,result=eligible)
                if eligible and self.person()['status']!=5:
                    self.boundary('effect','004B93D0/004F55E0',personId=pid,targetBuildingId=target,noticeVariant=noticeVariant,messageId=0x175d,displayArgs=[target,1,-1])
            saved_force=self.force_of(pid);self.slot('forces',saved_force);self.save(savedOldForceId=saved_force)
            if self.person()['status']==0:
                comparison_force=self.force_of(pid);self.save(savedRulerCompareForceId=comparison_force)
                target_force=self.target_force(target,'ruler')
                if comparison_force==target_force and self.valid('forces',saved_force) and self.slot('forces',saved_force)['field128']==0:
                    self.defer('unsupported-ruler-ownership')
            self.set_home(pid,target)
            location=self.person()['locationId'];troop=False
            if 87<=location<=1086:
                troop=self.boundary('query','004891C0',personId=pid,locationId=location)
                boolean(troop,'actual troop membership')
            self.step('004891C0/result',personId=pid,locationId=location,actualTroopMember=troop)
            if not troop:
                normalized=self.base_id(target)
                with self.scope('004A0CB0',personId=pid,requestedLocationId=normalized):
                    if self.person()['allocated']:
                        self.write('persons',pid,'locationId',normalized,'004A0CDB')
                        present=self.frame['observerPresent'];self.step('004B9480/004EC870',observerPresent=present)
                        if present:self.boundary('effect','observer.virtual1B4',nativeArgs=[0,0,0,0],caller='004B9480')
            live_force=self.force_of(pid);self.step('004BF862/force-range',forceId=live_force,passed=0<=live_force<=46)
            if not 0<=live_force<=46:return
            compare_force=self.force_of(pid);self.save(savedAffiliationCompareForceId=compare_force)
            if compare_force!=self.target_force(target,'affiliation'):return
            requested=self.base_legion(target);self.set_legion(pid,requested)
            # The setter's sort may replace target contents. Native caller reads
            # target+44 again NOW and retains that legion pointer across old role.
            new_legion=self.base_legion(target);new_legion=new_legion if self.slot('legions',new_legion) is not None else -1
            self.save(savedNewLegionId=new_legion)
            if old_status<=1 and self.valid('legions',old_legion) and old_legion!=new_legion:self.legion(old_legion)
            self.legion(new_legion)
            if self.valid('buildings',old_home):
                target_legion=self.base_legion(target);old_home_legion=self.base_legion(old_home)
                self.step('004BF8F7/004BF900',targetLegionId=target_legion,oldHomeLegionId=old_home_legion)
                if target_legion!=old_home_legion:self.governor(old_home)
            self.step('004BF6F0/return',personId=pid)

    def run(self):
        entry=self.command['entry'];args=self.command['args']
        if entry=='event':self.emit_event(args)
        elif entry=='return':self.officer_return(**args)
        elif entry=='legion':self.legion(args['targetId'])
        else:self.governor(args['targetId'])
        if self.cursor!=len(self.records):raise ValueError('unused boundary observations')


def project_recursive_officer_return(state,command,observations,policy):
    validate(state,command,observations,policy)
    result=dict(schemaVersion=1,profileId=PROFILE_ID,frameProfileId=FRAME_PROFILE_ID,source=state['source'],accepted=False,replayed=False,reason=None,
        before=copy.deepcopy(state),after=copy.deepcopy(state),command=copy.deepcopy(command),observations=copy.deepcopy(observations),policy=copy.deepcopy(policy),
        events=[],steps=[],observedEffects=[],queries=[],nativeCalls=0,returnCalls=0,
        rng=dict(initialState=state['frame']['rngState'],finalState=state['frame']['rngState'],localCalls=0,observedCalls=0,allCountsKnown=True,globalConsumptionVerified=False),
        evidence=dict(sourceLocalOnly=True,stockVerified=False,vanillaVerified=False,recursiveNativeProjection=True,completeGameTransaction=False,
            callbacksAssumedNoninterfering=False,observationAuthenticityVerified=False,machineCodeExecuted=False,engineGuardIsOriginalRule=False,
            runtimeStatus='compatibility-reconstruction' if policy['ruleset']=='PC-PK1.1' else 'compatibility-assumption'))
    def finish():result['traceHash']=_digest(result);return result
    digest=_digest(dict(command=command,observations=observations,policy=policy))
    old=next((r for r in state['appliedCommands'] if r['id']==command['id']),None)
    if old:
        same=old['sha256']==digest;result.update(accepted=same,replayed=same,reason='replay' if same else 'replay-payload-conflict');return finish()
    if command['expectedRevision']!=state['revision']:result['reason']='revision-conflict';return finish()
    if state['revision']==I32_MAX:raise ValueError('revision exhausted')
    plan=_Planner(state,command,observations,policy)
    try:plan.run()
    except _Reject as error:result.update(reason=str(error),observedEffects=copy.deepcopy(plan.effects));return finish()
    after=copy.deepcopy(state);after.update(frame=plan.frame,revision=state['revision']+1);after['appliedCommands'].append(dict(id=command['id'],sha256=digest))
    result.update(accepted=True,reason='native-recursive-composed',after=after,events=plan.events,steps=plan.steps,observedEffects=plan.effects,queries=plan.queries,nativeCalls=plan.nativeCalls,returnCalls=plan.returnCalls)
    counts=[r['rngConsumption'] for r in plan.effects];known=all(c['kind']=='observed-count' for c in counts)
    result['rng'].update(finalState=plan.frame['rngState'],allCountsKnown=known,observedCalls=sum(c['calls'] for c in counts) if known else None)
    return finish()


def replay_recursive_officer_return(trace):
    if type(trace) is not dict:raise ValueError('trace object required')
    value=copy.deepcopy(trace);digest=value.pop('traceHash',None)
    if digest!=_digest(value):raise ValueError('trace hash mismatch')
    try:result=project_recursive_officer_return(trace['before'],trace['command'],trace['observations'],trace['policy'])
    except (KeyError,TypeError) as error:raise ValueError('invalid trace inputs') from error
    if result!=trace:raise ValueError('trace replay mismatch')
    return result
