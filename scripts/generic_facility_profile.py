"""Versioned 004B40C0 generic-facility entry/early-return composition.

One live frame and one atomic revision, with immutable older APIs. Source-local
MOD-associated reconstructions are not clean-stock or executed gameplay proof.
"""
from __future__ import annotations
import copy
from mission_cancellation_v2_profile import _digest
from recursive_officer_return_profile import _Reject
from base_ownership_frame import FRAME_PROFILE_ID
from capture_transaction_profile import exact_keys, integer
from live_zero_refund_profile import _Planner as ZeroRefundPlanner, validate as validate_zero_refund
from generic_facility_primitives import GenericFacilityPrimitives

PROFILE_ID = 'source-idb-S1-S2-generic-facility-v1'
I32_MAX = 2**31-1


def validate(state, command, observations, policy):
    if type(policy) is not dict or policy.get('facilityDomain') != 'canonical-generic-facility-v1':
        raise ValueError('generic facility domain required')
    inherited = dict(policy)
    del inherited['facilityDomain']
    exact_keys(command, {'id','expectedRevision','entry','args'}, 'facility command')
    checked = command
    if command['entry'] == 'ruler-transfer':
        args = command['args']
        exact_keys(args, {'buildingId','requestedLegionId','nativeArgument'}, 'ruler transfer args')
        integer(args['buildingId'], 'building ID', -2**31, I32_MAX)
        integer(args['nativeArgument'], 'native argument', -2**31, I32_MAX)
        if args['requestedLegionId'] is not None:
            integer(args['requestedLegionId'], 'canonical requested legion pointer', 0, 46)
        # Reuse unchanged state/observation/policy validators. This temporary
        # command validates only input shape; it never projects a transaction.
        checked = dict(command, entry='base-ownership', args=dict(
            buildingId=args['buildingId'],
            requestedLegionId=-1 if args['requestedLegionId'] is None else args['requestedLegionId']))
    validate_zero_refund(state, checked, observations, inherited)


class _Planner(GenericFacilityPrimitives, ZeroRefundPlanner):
    def run(self):
        if self.command['entry'] != 'ruler-transfer':
            return super().run()
        self.nativeResult = self.ruler_transfer(**self.command['args'])
        if self.cursor != len(self.records):
            raise ValueError('unused boundary observations')


def project_generic_facility(state,command,observations,policy):
    validate(state,command,observations,policy)
    result=dict(schemaVersion=1,profileId=PROFILE_ID,frameProfileId=FRAME_PROFILE_ID,source=state['source'],accepted=False,replayed=False,reason=None,nativeResult=None,
        before=copy.deepcopy(state),after=copy.deepcopy(state),command=copy.deepcopy(command),observations=copy.deepcopy(observations),policy=copy.deepcopy(policy),
        events=[],steps=[],observedEffects=[],queries=[],nativeCalls=0,returnCalls=0,
        rng=dict(initialState=state['frame']['rngState'],finalState=state['frame']['rngState'],localCalls=0,observedCalls=0,allCountsKnown=True,globalConsumptionVerified=False),
        evidence=dict(sourceLocalOnly=True,stockVerified=False,vanillaVerified=False,recursiveNativeProjection=True,nativeSortProjection=True,nativeCapacityProjection=True,nativeRouteProjection=True,nativeTargetForceProjection=True,emptyLegionDispatchProjection=True,legionMergeProjection=True,baseOwnershipProjection=True,baseEventPredicateProjection=True,officerRelocationProjection=True,movementPreparationProjection=True,cancellationDispatchProjection=True,liveZeroRefundCancellationProjection=True,genericFacilityTransferProjection=True,canonicalCaptureContinuationExecuted=False,entryManagerIdentitySymbolic=True,arbitraryPointersSupported=False,platformFaultsExecuted=False,implementedZeroRefundMissions=[9,10,12,22,23,24],presentationSegmentsExecuted=False,rulerCaptureExecuted=False,allCancellationHandlersExecuted=False,troopMembershipNative=False,nonBasePositionNative=False,event9TailExecuted=False,sortStable=False,completeGameTransaction=False,
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
    result.update(accepted=True,reason='native-generic-facility-composed',after=after,events=plan.events,steps=plan.steps,observedEffects=plan.effects,queries=plan.queries,nativeCalls=plan.nativeCalls,returnCalls=plan.returnCalls,nativeResult=copy.deepcopy(plan.nativeResult))
    counts=[r['rngConsumption'] for r in plan.effects];known=all(c['kind']=='observed-count' for c in counts)
    result['rng'].update(finalState=plan.frame['rngState'],localCalls=plan.localRngCalls,allCountsKnown=known,observedCalls=sum(c['calls'] for c in counts) if known else None)
    return finish()


def replay_generic_facility(trace):
    if type(trace) is not dict:raise ValueError('trace object required')
    value=copy.deepcopy(trace);digest=value.pop('traceHash',None)
    if digest!=_digest(value):raise ValueError('trace hash mismatch')
    try:result=project_generic_facility(trace['before'],trace['command'],trace['observations'],trace['policy'])
    except (KeyError,TypeError) as error:raise ValueError('invalid trace inputs') from error
    if result!=trace:raise ValueError('trace replay mismatch')
    return result
