"""Versioned004891C0 native troop-membership composition.

One live frame and one atomic revision, with immutable older APIs. Source-local
MOD-associated reconstructions are not clean-stock or executed gameplay proof.
"""
from __future__ import annotations
import copy
from mission_cancellation_v2_profile import _digest
from recursive_officer_return_profile import _Reject
from base_ownership_frame import FRAME_PROFILE_ID as PREVIOUS_FRAME_PROFILE_ID
from native_troop_membership_frame import FRAME_PROFILE_ID, validate_frame, frame_domain, tail_distance_snapshot
from capture_transaction_profile import exact_keys
from native_tail_distance_profile import _Planner as TailDistancePlanner, validate as validate_tail_distance
from native_troop_membership_primitives import NativeTroopMembershipPrimitives

PROFILE_ID = 'source-idb-S1-S2-native-troop-membership-v1'
I32_MAX = 2**31-1


def validate(state, command, observations, policy):
    if type(policy) is not dict or policy.get('troopMembershipDomain') != 'canonical-native-troop-membership-v1':
        raise ValueError('native troop membership domain required')
    if policy.get('frameProfile') != FRAME_PROFILE_ID:
        raise ValueError('native troop membership frame profile required')
    exact_keys(state, {'source', 'revision', 'appliedCommands', 'frame'}, 'troop state')
    validate_frame(state['frame'])
    domain = frame_domain(state['frame'])
    exact_keys(observations, {'source', 'provenance', 'records'}, 'troop observations')
    if type(observations['records']) is not list:
        raise ValueError('ordered records required')
    inherited_observations = copy.deepcopy(observations)
    for record in inherited_observations['records']:
        if type(record) is not dict or 'before' not in record:
            raise ValueError('boundary record with before frame required')
        for key in ('before', 'after'):
            if key in record:
                validate_frame(record[key])
                if frame_domain(record[key]) != domain:
                    raise ValueError(key + ' domain mismatch')
                record[key] = tail_distance_snapshot(record[key])
    inherited = dict(policy)
    del inherited['troopMembershipDomain']
    inherited['frameProfile'] = PREVIOUS_FRAME_PROFILE_ID
    inherited_state = dict(state, frame=tail_distance_snapshot(state['frame']))
    exact_keys(command, {'id', 'expectedRevision', 'entry', 'args'}, 'troop command')
    checked = dict(command, entry='at-home') if command['entry'] == 'troop-member' else command
    # The old validator sees detached diagnostic views only. Execution and all
    # callback bindings retain the complete new frame in one mutable owner.
    validate_tail_distance(inherited_state, checked, inherited_observations, inherited)


class _Planner(NativeTroopMembershipPrimitives, TailDistancePlanner):
    def run(self):
        if self.command['entry'] != 'troop-member':
            return super().run()
        self.nativeResult = self.troop_member(self.command['args']['personId'])
        if self.cursor != len(self.records):
            raise ValueError('unused boundary observations')


def project_native_troop_membership(state,command,observations,policy):
    validate(state,command,observations,policy)
    result=dict(schemaVersion=1,profileId=PROFILE_ID,frameProfileId=FRAME_PROFILE_ID,source=state['source'],accepted=False,replayed=False,reason=None,nativeResult=None,
        before=copy.deepcopy(state),after=copy.deepcopy(state),command=copy.deepcopy(command),observations=copy.deepcopy(observations),policy=copy.deepcopy(policy),
        events=[],steps=[],observedEffects=[],queries=[],nativeCalls=0,returnCalls=0,
        rng=dict(initialState=state['frame']['rngState'],finalState=state['frame']['rngState'],localCalls=0,observedCalls=0,allCountsKnown=True,globalConsumptionVerified=False),
        evidence=dict(sourceLocalOnly=True,stockVerified=False,vanillaVerified=False,recursiveNativeProjection=True,nativeSortProjection=True,nativeCapacityProjection=True,nativeRouteProjection=True,nativeTargetForceProjection=True,emptyLegionDispatchProjection=True,legionMergeProjection=True,baseOwnershipProjection=True,baseEventPredicateProjection=True,officerRelocationProjection=True,movementPreparationProjection=True,cancellationDispatchProjection=True,liveZeroRefundCancellationProjection=True,genericFacilityTransferProjection=True,nativeTailDistanceProjection=True,tailDistanceQueryRequired=False,tailDistanceSavedInParentScope=True,sourceSpecificDirectedDistanceTables=True,canonicalCaptureContinuationExecuted=False,entryManagerIdentitySymbolic=True,arbitraryPointersSupported=False,platformFaultsExecuted=False,implementedZeroRefundMissions=[9,10,12,22,23,24],presentationSegmentsExecuted=False,rulerCaptureExecuted=False,allCancellationHandlersExecuted=False,troopMembershipNative=True,canonicalTroopVtable=0x0079CC18,troopValidityDerived=True,unknownTroopVtableRequiresObservation=True,nonBasePositionNative=False,event9TailExecuted=False,sortStable=False,completeGameTransaction=False,
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
    result.update(accepted=True,reason='native-troop-membership-composed',after=after,events=plan.events,steps=plan.steps,observedEffects=plan.effects,queries=plan.queries,nativeCalls=plan.nativeCalls,returnCalls=plan.returnCalls,nativeResult=copy.deepcopy(plan.nativeResult))
    counts=[r['rngConsumption'] for r in plan.effects];known=all(c['kind']=='observed-count' for c in counts)
    result['rng'].update(finalState=plan.frame['rngState'],localCalls=plan.localRngCalls,allCountsKnown=known,observedCalls=sum(c['calls'] for c in counts) if known else None)
    return finish()


def replay_native_troop_membership(trace):
    if type(trace) is not dict:raise ValueError('trace object required')
    value=copy.deepcopy(trace);digest=value.pop('traceHash',None)
    if digest!=_digest(value):raise ValueError('trace hash mismatch')
    try:result=project_native_troop_membership(trace['before'],trace['command'],trace['observations'],trace['policy'])
    except (KeyError,TypeError) as error:raise ValueError('invalid trace inputs') from error
    if result!=trace:raise ValueError('trace replay mismatch')
    return result
