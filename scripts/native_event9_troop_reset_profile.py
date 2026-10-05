"""Versioned004BA442..004BA44C saved-troop raw44 reset.

One mutable frame/revision retains all predecessor APIs, schemas and traces.
Source-local MOD reconstruction; no full reaction, capture, runtime or stock claim.
"""
from __future__ import annotations
import copy
from mission_cancellation_v2_profile import _digest
from recursive_officer_return_profile import _Reject
from capture_transaction_profile import exact_keys
from native_event9_force_reset_frame import FRAME_PROFILE_ID as PREVIOUS_FRAME_PROFILE_ID
from native_event9_force_reset_profile import _Planner as ForceResetPlanner, validate as validate_force_reset
from native_event9_troop_reset_frame import FRAME_PROFILE_ID, validate_frame, frame_domain
from native_event9_troop_reset_primitives import NativeEvent9TroopResetPrimitives

PROFILE_ID = 'source-idb-S1-S2-native-event9-troop-reset-v1'
I32_MAX = 2**31-1
DIRECT_ENTRIES = ('event9-troop-reset',)


def validate(state, command, observations, policy):
    if type(policy) is not dict or policy.get('event9TroopResetDomain') != 'canonical-live-event9-troop-reset-v1':
        raise ValueError('native event9 troop reset domain required')
    if policy.get('frameProfile') != FRAME_PROFILE_ID:
        raise ValueError('native event9 troop reset frame profile required')
    exact_keys(state, {'source', 'revision', 'appliedCommands', 'frame'}, 'event9 troop reset state')
    validate_frame(state['frame'])
    # Storage keys and domains are identical to the preceding force-reset
    # frame; its validator checks every full before/after observation as well.
    # Only the protocol version and newly required domain differ.
    inherited = dict(policy)
    del inherited['event9TroopResetDomain']
    inherited['frameProfile'] = PREVIOUS_FRAME_PROFILE_ID
    exact_keys(command, {'id', 'expectedRevision', 'entry', 'args'}, 'event9 troop reset command')
    checked = dict(command, entry='event9-force-reset') if command['entry'] in DIRECT_ENTRIES else command
    validate_force_reset(state, checked, observations, inherited)


class _Planner(NativeEvent9TroopResetPrimitives, ForceResetPlanner):
    def run(self):
        if self.command['entry'] not in DIRECT_ENTRIES:
            return super().run()
        self.event9_selection(self.command['args'])
        if self.cursor != len(self.records):
            raise ValueError('unused boundary observations')


def project_native_event9_troop_reset(state,command,observations,policy):
    validate(state,command,observations,policy)
    result=dict(schemaVersion=1,profileId=PROFILE_ID,frameProfileId=FRAME_PROFILE_ID,source=state['source'],accepted=False,replayed=False,reason=None,nativeResult=None,
        before=copy.deepcopy(state),after=copy.deepcopy(state),command=copy.deepcopy(command),observations=copy.deepcopy(observations),policy=copy.deepcopy(policy),
        events=[],steps=[],observedEffects=[],queries=[],nativeCalls=0,returnCalls=0,
        rng=dict(initialState=state['frame']['rngState'],finalState=state['frame']['rngState'],localCalls=0,observedCalls=0,allCountsKnown=True,globalConsumptionVerified=False),
        evidence=dict(sourceLocalOnly=True,stockVerified=False,vanillaVerified=False,recursiveNativeProjection=True,nativeSortProjection=True,nativeCapacityProjection=True,nativeRouteProjection=True,nativeTargetForceProjection=True,emptyLegionDispatchProjection=True,legionMergeProjection=True,baseOwnershipProjection=True,baseEventPredicateProjection=True,officerRelocationProjection=True,movementPreparationProjection=True,cancellationDispatchProjection=True,liveZeroRefundCancellationProjection=True,genericFacilityTransferProjection=True,nativeTailDistanceProjection=True,tailDistanceQueryRequired=False,tailDistanceSavedInParentScope=True,sourceSpecificDirectedDistanceTables=True,canonicalCaptureContinuationExecuted=False,entryManagerIdentitySymbolic=True,arbitraryPointersSupported=False,platformFaultsExecuted=False,implementedZeroRefundMissions=[9,10,12,22,23,24],presentationSegmentsExecuted=False,rulerCaptureExecuted=False,allCancellationHandlersExecuted=False,troopMembershipNative=True,canonicalTroopVtable=0x0079CC18,troopValidityDerived=True,unknownTroopVtableRequiresObservation=True,nonBasePositionNative=True,nativePositionPointerDistinct=True,explicitMutableFallbackRequired=True,positionDwordReadAtomic=True,unknownPositionDispatchRequiresEffectObservation=True,unrepresentedPositionReadRequiresObservation=True,fallbackSeededFromIdb=False,event9SelectionPreludeNative=True,event9LiveNodeTraversal=True,event9SavedNextBeforeCallback=True,event9ReactionSuffixObserved=False,event9PresentationDecisionNative=True,event9PresentationCombinedObserved=True,event9ReactionStart='004BA44C',event9ForceResetNative=True,event9ForceResetStart='004BA432',event9ForceResetEndExclusive='004BA442',event9TroopResetNative=True,event9TroopResetStart='004BA442',event9TroopResetEndExclusive='004BA44C',event9TroopRaw44Dword=True,event9TroopRaw44SignedStorage=True,event9SavedForceIdentityPreserved=True,event9GeneralTroopSettersExposed=False,event9ForceRaw94Dword=True,event9ForceRaw98Byte=True,event9GeneralForceSettersExposed=False,event9ReactionRemainderObserved=True,event9EventMemoryDomain='immutable-command-event-v1',event9MutableEventMemorySupported=False,canonicalForceVtable=0x0079C0E8,unknownForceDispatchOutsideEvent9Supported=False,event9TailExecuted=False,sortStable=False,completeGameTransaction=False,
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
    result.update(accepted=True,reason='native-event9-troop-reset-composed',after=after,events=plan.events,steps=plan.steps,observedEffects=plan.effects,queries=plan.queries,nativeCalls=plan.nativeCalls,returnCalls=plan.returnCalls,nativeResult=copy.deepcopy(plan.nativeResult))
    counts=[r['rngConsumption'] for r in plan.effects];known=all(c['kind']=='observed-count' for c in counts)
    result['rng'].update(finalState=plan.frame['rngState'],localCalls=plan.localRngCalls,allCountsKnown=known,observedCalls=sum(c['calls'] for c in counts) if known else None)
    return finish()


def replay_native_event9_troop_reset(trace):
    if type(trace) is not dict:raise ValueError('trace object required')
    value=copy.deepcopy(trace);digest=value.pop('traceHash',None)
    if digest!=_digest(value):raise ValueError('trace hash mismatch')
    try:result=project_native_event9_troop_reset(trace['before'],trace['command'],trace['observations'],trace['policy'])
    except (KeyError,TypeError) as error:raise ValueError('invalid trace inputs') from error
    if result!=trace:raise ValueError('trace replay mismatch')
    return result
