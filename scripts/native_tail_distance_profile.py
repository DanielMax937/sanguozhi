"""Versioned native005B8400 tail-distance composition.

One live frame and one atomic revision, with immutable older APIs. Source-local
MOD-associated reconstructions are not clean-stock or executed gameplay proof.
"""
from __future__ import annotations
import copy
from mission_cancellation_v2_profile import _digest
from recursive_officer_return_profile import _Reject
from base_ownership_frame import FRAME_PROFILE_ID
from generic_facility_profile import _Planner as GenericFacilityPlanner, validate as validate_facility
from native_tail_distance_primitives import NativeTailDistancePrimitives

PROFILE_ID = 'source-idb-S1-S2-native-tail-distance-v1'
I32_MAX = 2**31-1


def validate(state, command, observations, policy):
    if type(policy) is not dict or policy.get('tailDistanceDomain') != 'canonical-native-tail-distance-v1':
        raise ValueError('native tail distance domain required')
    inherited = dict(policy)
    del inherited['tailDistanceDomain']
    validate_facility(state, command, observations, inherited)


class _Planner(NativeTailDistancePrimitives, GenericFacilityPlanner):
    pass


def project_native_tail_distance(state,command,observations,policy):
    validate(state,command,observations,policy)
    result=dict(schemaVersion=1,profileId=PROFILE_ID,frameProfileId=FRAME_PROFILE_ID,source=state['source'],accepted=False,replayed=False,reason=None,nativeResult=None,
        before=copy.deepcopy(state),after=copy.deepcopy(state),command=copy.deepcopy(command),observations=copy.deepcopy(observations),policy=copy.deepcopy(policy),
        events=[],steps=[],observedEffects=[],queries=[],nativeCalls=0,returnCalls=0,
        rng=dict(initialState=state['frame']['rngState'],finalState=state['frame']['rngState'],localCalls=0,observedCalls=0,allCountsKnown=True,globalConsumptionVerified=False),
        evidence=dict(sourceLocalOnly=True,stockVerified=False,vanillaVerified=False,recursiveNativeProjection=True,nativeSortProjection=True,nativeCapacityProjection=True,nativeRouteProjection=True,nativeTargetForceProjection=True,emptyLegionDispatchProjection=True,legionMergeProjection=True,baseOwnershipProjection=True,baseEventPredicateProjection=True,officerRelocationProjection=True,movementPreparationProjection=True,cancellationDispatchProjection=True,liveZeroRefundCancellationProjection=True,genericFacilityTransferProjection=True,nativeTailDistanceProjection=True,tailDistanceQueryRequired=False,tailDistanceSavedInParentScope=True,sourceSpecificDirectedDistanceTables=True,canonicalCaptureContinuationExecuted=False,entryManagerIdentitySymbolic=True,arbitraryPointersSupported=False,platformFaultsExecuted=False,implementedZeroRefundMissions=[9,10,12,22,23,24],presentationSegmentsExecuted=False,rulerCaptureExecuted=False,allCancellationHandlersExecuted=False,troopMembershipNative=False,nonBasePositionNative=False,event9TailExecuted=False,sortStable=False,completeGameTransaction=False,
            rulesetEvidence='MOD-associated S1/S2 evidence; requested PC-PK1.1 is compatibility reconstruction, not clean-stock certification',callbacksAssumedNoninterfering=False,observationAuthenticityVerified=False,machineCodeExecuted=False,engineGuardIsOriginalRule=False,
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
    result.update(accepted=True,reason='native-tail-distance-composed',after=after,events=plan.events,steps=plan.steps,observedEffects=plan.effects,queries=plan.queries,nativeCalls=plan.nativeCalls,returnCalls=plan.returnCalls,nativeResult=copy.deepcopy(plan.nativeResult))
    counts=[r['rngConsumption'] for r in plan.effects];known=all(c['kind']=='observed-count' for c in counts)
    result['rng'].update(finalState=plan.frame['rngState'],localCalls=plan.localRngCalls,allCountsKnown=known,observedCalls=sum(c['calls'] for c in counts) if known else None)
    return finish()


def replay_native_tail_distance(trace):
    if type(trace) is not dict:raise ValueError('trace object required')
    value=copy.deepcopy(trace);digest=value.pop('traceHash',None)
    if digest!=_digest(value):raise ValueError('trace hash mismatch')
    try:result=project_native_tail_distance(trace['before'],trace['command'],trace['observations'],trace['policy'])
    except (KeyError,TypeError) as error:raise ValueError('invalid trace inputs') from error
    if result!=trace:raise ValueError('trace replay mismatch')
    return result
