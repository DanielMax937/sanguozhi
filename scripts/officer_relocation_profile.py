"""P0-67 versioned officer relocation and fixed-argument movement preparation.

Reuses the P0-66 frame shape without changing its API/trace contracts. New
control paths operate in the same frame and commit exactly one revision.
"""
from __future__ import annotations
import copy
from capture_transaction_profile import exact_keys, integer, boolean
from capture_personnel_profile import text
from mission_cancellation_v2_profile import _digest
from mission_event_listener_profile import _json
from base_ownership_primitives import BaseOwnershipPrimitives, validate_event
from officer_relocation_primitives import OfficerRelocationPrimitives
from recursive_officer_return_profile import _Planner as RecursivePlanner, _Reject
from base_ownership_frame import FRAME_PROFILE_ID, validate_frame, frame_domain, TABLES
from native_sort_primitives import NativeSortPrimitives
from return_route_primitives import ReturnRoutePrimitives
from empty_legion_primitives import EmptyLegionPrimitives

PROFILE_ID = 'source-idb-S1-S2-officer-relocation-v1'
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
    if entry in ('relocate-officer','prepare-movement'):
        exact_keys(a,{'personId','targetBuildingId'},'relocation args')
        integer(a['personId'],'person ID',0,1099)
        integer(a['targetBuildingId'],'target building ID',I32_MIN,I32_MAX)
    elif entry=='cancel-mission':
        exact_keys(a,{'personId'},'cancel args');integer(a['personId'],'person ID',0,1099)
    elif entry=='event': validate_event(a)
    elif entry=='base-ownership':
        exact_keys(a,{'buildingId','requestedLegionId'},'base ownership args')
        for k in a: integer(a[k],k,I32_MIN,I32_MAX)
    elif entry=='return':
        exact_keys(a,{'personId','targetBuildingId','showNotice','noticeVariant'},'return args')
        integer(a['personId'],'person ID',0,1099)
        for k in ('targetBuildingId','showNotice','noticeVariant'): integer(a[k],k,I32_MIN,I32_MAX)
    elif entry in ('legion','governor'):
        exact_keys(a,{'targetId'},'role args');integer(a['targetId'],'role target',I32_MIN,I32_MAX)
    elif entry=='roster-sort':
        exact_keys(a,{'table','targetId'},'roster sort args')
        if a['table'] not in ('buildings','legions'): raise ValueError('roster table')
        integer(a['targetId'],'roster target',0,16383 if a['table']=='buildings' else 46)
    elif entry=='role-sort':
        exact_keys(a,{'candidateIds','leader'},'role sort args');boolean(a['leader'],'leader')
        if type(a['candidateIds']) is not list: raise ValueError('candidate pointer list')
        for pid in a['candidateIds']:
            integer(pid,'candidate pointer',0,1099)
            if not any(p['id']==pid for p in state['frame']['persons']): raise ValueError('unreadable candidate')
    elif entry=='capacity':
        exact_keys(a,{'personId'},'capacity args');integer(a['personId'],'person ID',0,1099)
    elif entry=='route':
        exact_keys(a,{'personId','targetOutput','territoryOutput'},'route args')
        integer(a['personId'],'person ID',0,1099)
        for k in ('targetOutput','territoryOutput'): boolean(a[k],k)
    elif entry=='at-home':
        exact_keys(a,{'personId'},'at-home args');integer(a['personId'],'person ID',0,1099)
    elif entry=='target-force':
        exact_keys(a,{'buildingId'},'target-force args');integer(a['buildingId'],'building ID',0,16383)
    elif entry=='merge-legion':
        exact_keys(a,{'sourceLegionId','destinationLegionId'},'merge args')
        for k in a: integer(a[k],k,I32_MIN,I32_MAX)
    elif entry=='force-legion':
        exact_keys(a,{'forceId','ordinal'},'force legion args')
        for k in a: integer(a[k],k,I32_MIN,I32_MAX)
    else: raise ValueError('unsupported officer-relocation entry')
    exact_keys(policy,{'id','ruleset','unknownEffects','frameProfile','registryDomain','listAssumption','engineGuard','sortDomain','nativePlatform','routeDomain','emptyLegionDomain','baseOwnershipDomain','relocationDomain','provenance'},'recursive policy')
    for k in ('id','provenance'): text(policy[k],k)
    if policy['ruleset'] not in ('PC-PK1.1','PC-Vanilla-assumed'): raise ValueError('separate ruleset required')
    if policy['unknownEffects'] not in ('observed-frame','reject'): raise ValueError('mutable observation or reject required')
    if policy['frameProfile']!=FRAME_PROFILE_ID: raise ValueError('expanded frame required')
    if policy['registryDomain']!='initialized-unmodified-registry-v1': raise ValueError('registry domain required')
    if policy['listAssumption']!='readable-acyclic-successful-allocation-v1': raise ValueError('successful allocation domain required')
    if policy['nativePlatform']!='unmodified-successful-probes-allocator-locks-v1': raise ValueError('native platform domain required')
    if policy['relocationDomain']!='canonical-officer-relocation-v1': raise ValueError('relocation domain required')
    if policy['baseOwnershipDomain']!='canonical-base-ownership-v1': raise ValueError('base ownership domain required')
    if policy['emptyLegionDomain']!='canonical-live-empty-legion-v1': raise ValueError('empty legion domain required')
    if policy['routeDomain']!='canonical-unaliased-route-output-v1': raise ValueError('native route domain required')
    if policy['sortDomain']!='canonical-person-rosters-1-0-0-0-v1': raise ValueError('native sort domain required')
    exact_keys(policy['engineGuard'],{'maxEventDepth','maxNativeCalls','maxSortDepth'},'engine guard')
    integer(policy['engineGuard']['maxSortDepth'],'engine sort depth',1,128)
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


class _Planner(OfficerRelocationPrimitives, BaseOwnershipPrimitives, EmptyLegionPrimitives, ReturnRoutePrimitives, NativeSortPrimitives, RecursivePlanner):
    def __init__(self,*args):
        super().__init__(*args)
        self.nativeResult = None
        self.localRngCalls = 0

    def slot(self,name,rid):
        if not 0 <= rid <= TABLES[name][1]: return None
        row=self.row(name,rid)
        if row is None: raise ValueError('missing observed '+name+' slot '+str(rid))
        return row

    def run(self):
        entry=self.command['entry'];a=self.command['args']
        if entry=='relocate-officer':
            self.relocate_officer(**a)
        elif entry=='prepare-movement':
            self.nativeResult=self.prepare_movement(**a)
        elif entry=='cancel-mission':
            self.nativeResult=self.cancel_mission(a['personId'])
        elif entry=='base-ownership':
            self.base_ownership(**a)
        elif entry=='merge-legion':
            self.merge_legion(a['sourceLegionId'],a['destinationLegionId'])
        elif entry=='force-legion':
            self.nativeResult=self.force_legion(a['forceId'],a['ordinal'])
        elif entry=='route':
            self.nativeResult=self.route(a['personId'],a['targetOutput'],a['territoryOutput'],'direct')
        elif entry=='target-force':
            self.nativeResult=self.target_force(a['buildingId'],'direct')
        elif entry=='at-home':
            self.nativeResult=self.at_home(a['personId'],'direct')
        elif entry=='roster-sort':
            if a['table']=='buildings' and self.roster_id(a['targetId']) is None:
                self.defer('unsupported-noncanonical-building-roster')
            key='homeRosterIds' if a['table']=='buildings' else 'rosterIds'
            self.nativeResult=self.sort_roster(a['table'],a['targetId'],key)
        elif entry=='role-sort':
            self.nativeResult=self._role_rank(a['candidateIds'],'direct',a['leader'])
        elif entry=='capacity':
            self.nativeResult=self.capacity(a['personId'])
        else:
            super().run()
        if self.cursor!=len(self.records): raise ValueError('unused boundary observations')


def project_officer_relocation(state,command,observations,policy):
    validate(state,command,observations,policy)
    result=dict(schemaVersion=1,profileId=PROFILE_ID,frameProfileId=FRAME_PROFILE_ID,source=state['source'],accepted=False,replayed=False,reason=None,nativeResult=None,
        before=copy.deepcopy(state),after=copy.deepcopy(state),command=copy.deepcopy(command),observations=copy.deepcopy(observations),policy=copy.deepcopy(policy),
        events=[],steps=[],observedEffects=[],queries=[],nativeCalls=0,returnCalls=0,
        rng=dict(initialState=state['frame']['rngState'],finalState=state['frame']['rngState'],localCalls=0,observedCalls=0,allCountsKnown=True,globalConsumptionVerified=False),
        evidence=dict(sourceLocalOnly=True,stockVerified=False,vanillaVerified=False,recursiveNativeProjection=True,nativeSortProjection=True,nativeCapacityProjection=True,nativeRouteProjection=True,nativeTargetForceProjection=True,emptyLegionDispatchProjection=True,legionMergeProjection=True,baseOwnershipProjection=True,baseEventPredicateProjection=True,officerRelocationProjection=True,movementPreparationProjection=True,cancellationDispatchProjection=True,rulerCaptureExecuted=False,allCancellationHandlersExecuted=False,troopMembershipNative=False,nonBasePositionNative=False,event9TailExecuted=False,sortStable=False,completeGameTransaction=False,
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
    result.update(accepted=True,reason='native-officer-relocation-composed',after=after,events=plan.events,steps=plan.steps,observedEffects=plan.effects,queries=plan.queries,nativeCalls=plan.nativeCalls,returnCalls=plan.returnCalls,nativeResult=copy.deepcopy(plan.nativeResult))
    counts=[r['rngConsumption'] for r in plan.effects];known=all(c['kind']=='observed-count' for c in counts)
    result['rng'].update(finalState=plan.frame['rngState'],localCalls=plan.localRngCalls,allCountsKnown=known,observedCalls=sum(c['calls'] for c in counts) if known else None)
    return finish()


def replay_officer_relocation(trace):
    if type(trace) is not dict:raise ValueError('trace object required')
    value=copy.deepcopy(trace);digest=value.pop('traceHash',None)
    if digest!=_digest(value):raise ValueError('trace hash mismatch')
    try:result=project_officer_relocation(trace['before'],trace['command'],trace['observations'],trace['policy'])
    except (KeyError,TypeError) as error:raise ValueError('invalid trace inputs') from error
    if result!=trace:raise ValueError('trace replay mismatch')
    return result
