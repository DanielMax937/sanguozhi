"""P0-61 atomic 004BBAA0(event8/14), real listener/handler/tail call order.

Known primitives execute against one live frame. Presentation, full return and
nonnull observer bodies remain stage-bound mutable observations or rejection.
The native caller's copied nodes and scalar locals survive observed mutations.
"""
from __future__ import annotations
import copy
from contextlib import contextmanager
from capture_transaction_profile import exact_keys, integer
from capture_personnel_profile import text
from mission_cancellation_v2_profile import _digest, HANDLERS
from mission_event_listener_profile import PREDICATES, _json
from mission_composition_frame import (
    FRAME_PROFILE_ID, validate_frame, frame_domain, SharedFrameAdapter,
    ListenerPrimitiveAdapter, TailPrimitiveAdapter,
)

PROFILE_ID = 'source-idb-S1-S2-mission-event-composition-v1'
I32_MIN, I32_MAX = -2**31, 2**31 - 1


def validate_event(event):
    exact_keys(event, {'id','subjectType','subjectId','argument'}, 'event')
    integer(event['id'], 'event ID', 8, 14)
    if event['id'] not in (8,14): raise ValueError('only event8/14 supported')
    if event['subjectType'] not in ('person','building','null'): raise ValueError('typed subject required')
    if event['subjectType'] == 'null':
        if event['subjectId'] is not None: raise ValueError('null subject ID')
    else:
        integer(event['subjectId'], 'subject ID', 0, 1099 if event['subjectType']=='person' else 16383)
    integer(event['argument'], 'event argument', I32_MIN, I32_MAX)


def validate(state, command, observations, policy):
    exact_keys(state, {'source','revision','appliedCommands','frame'}, 'composed state')
    if state['source'] not in ('S1','S2'): raise ValueError('source S1/S2 required')
    integer(state['revision'], 'revision', 0, I32_MAX)
    validate_frame(state['frame'])
    if type(state['appliedCommands']) is not list: raise ValueError('appliedCommands list required')
    seen = set()
    for r in state['appliedCommands']:
        exact_keys(r, {'id','sha256'}, 'applied command')
        text(r['id'], 'command ID')
        if type(r['sha256']) is not str or len(r['sha256']) != 64 or any(c not in '0123456789abcdef' for c in r['sha256']):
            raise ValueError('applied digest')
        if r['id'] in seen: raise ValueError('duplicate command ID')
        seen.add(r['id'])
    exact_keys(command, {'id','expectedRevision','event'}, 'composed command')
    text(command['id'], 'command ID')
    integer(command['expectedRevision'], 'expected revision', 0, I32_MAX)
    validate_event(command['event'])
    exact_keys(policy, {'id','ruleset','unknownEffects','frameProfile','registryDomain','listAssumption','provenance'}, 'composed policy')
    for k in ('id','provenance'): text(policy[k], k)
    if policy['ruleset'] not in ('PC-PK1.1','PC-Vanilla-assumed'): raise ValueError('separate ruleset required')
    if policy['unknownEffects'] not in ('observed-frame','reject'): raise ValueError('mutable effects or reject required')
    if policy['frameProfile'] != FRAME_PROFILE_ID: raise ValueError('versioned shared frame required')
    if policy['registryDomain'] != 'initialized-unmodified-registry-v1': raise ValueError('registry domain required')
    if policy['listAssumption'] != 'readable-acyclic-successful-copy-append-v1': raise ValueError('list domain required')
    exact_keys(observations, {'source','provenance','records'}, 'composed observations')
    if observations['source'] != state['source']: raise ValueError('observation source mismatch')
    text(observations['provenance'], 'provenance')
    if type(observations['records']) is not list: raise ValueError('ordered records required')
    domain = frame_domain(state['frame'])
    for index, r in enumerate(observations['records']):
        base = {'index','source','kind','helper','args','callStack','before','provenance'}
        if type(r) is not dict or r.get('kind') not in ('query','effect','effect-query'): raise ValueError('boundary kind')
        extra = {'result'} if r['kind']=='query' else {'after','rngConsumption','result'} if r['kind']=='effect-query' else {'after','rngConsumption'}
        exact_keys(r, base | extra, 'boundary record')
        integer(r['index'], 'boundary index', 0, I32_MAX)
        if r['index'] != index: raise ValueError('ordered contiguous boundary index')
        if r['source'] != state['source']: raise ValueError('record source mismatch')
        for k in ('helper','provenance'): text(r[k], k)
        if type(r['args']) is not dict or type(r['callStack']) is not list or not r['callStack']: raise ValueError('args and call stack required')
        _json(r['args'], 'args'); _json(r['callStack'], 'call stack')
        validate_frame(r['before'])
        if frame_domain(r['before']) != domain: raise ValueError('before domain mismatch')
        if r['kind'] in ('query','effect-query'): _json(r['result'], 'query result')
        if r['kind'] != 'query':
            validate_frame(r['after'])
            if frame_domain(r['after']) != domain: raise ValueError('after domain mismatch')
            c = r['rngConsumption']; exact_keys(c, {'kind','calls'}, 'RNG observation')
            if c['kind'] == 'unknown':
                if c['calls'] is not None: raise ValueError('unknown calls must be null')
            elif c['kind'] == 'observed-count': integer(c['calls'], 'observed calls', 0, I32_MAX)
            else: raise ValueError('RNG evidence kind')


class _Reject(Exception): pass


class _Planner(SharedFrameAdapter, ListenerPrimitiveAdapter, TailPrimitiveAdapter):
    def __init__(self, state, command, observations, policy):
        self.frame = copy.deepcopy(state['frame'])
        self.source = state['source']; self.event = copy.deepcopy(command['event'])
        self.records = observations['records']; self.policy = policy
        self.cursor = 0; self.pid = None; self.stack = []
        self.steps = []; self.effects = []; self.queries = []; self.visits = []; self.copied = []

    @contextmanager
    def scope(self, helper, **locals):
        self.stack.append(dict(helper=helper, locals=copy.deepcopy(locals)))
        try: yield
        finally: self.stack.pop()

    def step(self, helper, **details):
        # Preserve native locals independently of replacement live frames. The
        # primitive reports these immediately after the corresponding reads.
        if helper == 'handler/saved-pointers': self.stack[-1]['locals'].update(copy.deepcopy(details))
        if helper == '005B8400': self.stack[-1]['locals'].update(copy.deepcopy(details))
        self.steps.append(dict(helper=helper, **copy.deepcopy(details), callStack=copy.deepcopy(self.stack), frame=copy.deepcopy(self.frame)))

    def boundary(self, kind, helper, **args):
        binding = dict(index=self.cursor, source=self.source, kind=kind, helper=helper,
            args=copy.deepcopy(args), callStack=copy.deepcopy(self.stack), before=copy.deepcopy(self.frame))
        if kind != 'query' and self.policy['unknownEffects'] == 'reject':
            self.effects.append(dict(**binding, deferred=True)); raise _Reject('unresolved-effect:'+helper)
        if self.cursor >= len(self.records): raise ValueError('missing '+helper+' boundary observation')
        r = self.records[self.cursor]
        if any(_digest(r[k]) != _digest(v) for k,v in binding.items()): raise ValueError('stale or misbound '+helper+' observation')
        self.cursor += 1
        if kind == 'query':
            if helper == '0049E4D0':
                # This scalar is live in the native return caller's saved
                # locals while its acted observer can replace the live frame.
                self.stack[-1]['locals']['savedDistance'] = copy.deepcopy(r['result'])
            self.queries.append(copy.deepcopy(r)); self.step(helper, result=r['result'], **args)
            return r['result']
        self.effects.append(copy.deepcopy(r)); self.frame = copy.deepcopy(r['after'])
        self.step(helper, observed=True, **args)
        if kind == 'effect-query': return r['result']

    def return_zero(self):
        with self.scope('005B8400', personId=self.pid, refund=0):
            self.return_zero_primitive()

    def dispatch(self, visit, pid, mission):
        with self.scope('005B9D30', visitIndex=visit, personId=pid, capturedMissionId=mission):
            self.step('005B9D30', personId=pid, capturedMissionId=mission,
                predicate=PREDICATES[mission], handler=HANDLERS[mission], selfBypass=False)
            passed = self.predicate(self.person(), mission)
            self.step(PREDICATES[mission]+'/result', returnValue=int(passed))
            if not passed: return 0, None
            with self.scope(HANDLERS[mission], personId=pid, capturedMissionId=mission):
                value = self.handler_primitive(mission)
            self.step('005B9D30/return', returnValue=1, handlerReturnIgnored=True)
            return 1, value

    def listeners(self):
        self.copied = list(self.frame['activePersonIds'])
        with self.scope('004A8110', copiedActivePersonIds=self.copied):
            self.step('0049F820', copiedActivePersonIds=self.copied)
            for visit, pid in enumerate(self.copied):
                self.pid = pid
                r = dict(visitIndex=visit, personId=pid, missionId=None, dispatcherReturn=None, handlerReturn=None)
                self.visits.append(r)
                self.step('004A8110/visit', visitIndex=visit, personId=pid, executingPersonId=self.frame['executingPersonId'])
                if pid == self.frame['executingPersonId']: r['route']='executing-person-skip'; continue
                mission = self.person()['missionId']; r['missionId']=mission
                if not 0 <= mission <= 43: r['route']='mission-range-skip'; continue
                if mission == 37: r.update(route='mission37-skip', dispatcherReturn=0); continue
                dispatch, handler = self.dispatch(visit, pid, mission)
                r.update(route='handler-called' if dispatch else 'predicate-false', dispatcherReturn=dispatch, handlerReturn=handler)
            self.step('0047C100', temporaryListDestroyed=True)
        self.pid = None

    def run(self):
        with self.scope('004BBAA0', event=self.event):
            self.step('004BBAA0/stack-event', event=self.event)
            self.listeners()
            # Both IDs branch to the epilogue, after the temporary list dies.
            self.step('004BA1D0', event=self.event, route='event8/14-no-op')
            present = self.frame['observerPresent']
            self.step('004EC870', caller='004BBAA0', observerPresent=present)
            if present:
                self.boundary('effect','observer.virtual1B4', nativeArgs=[0,0,0,0], caller='004BBAA0')
            self.step('004BBAA0/return', event=self.event)
        if self.cursor != len(self.records): raise ValueError('unused boundary observations')


def project_mission_event_composition(state, command, observations, policy):
    validate(state, command, observations, policy)
    result = dict(schemaVersion=1, profileId=PROFILE_ID, frameProfileId=FRAME_PROFILE_ID,
        source=state['source'], accepted=False, replayed=False, reason=None,
        before=copy.deepcopy(state), after=copy.deepcopy(state), command=copy.deepcopy(command),
        observations=copy.deepcopy(observations), policy=copy.deepcopy(policy),
        copiedActivePersonIds=[], visits=[], steps=[], observedEffects=[], queries=[],
        rng=dict(initialState=state['frame']['rngState'], finalState=state['frame']['rngState'],
            localCalls=0, observedCalls=0, allCountsKnown=True, globalConsumptionVerified=False),
        evidence=dict(sourceLocalOnly=True, stockVerified=False, vanillaVerified=False,
            knownHandlerTailsExecuted=False, eventWrapperExecuted=False, fullReturnExecuted=False,
            fullEventMachineCodeExecuted=False, completeGameTransaction=False,
            callbacksAssumedNoninterfering=False, observationAuthenticityVerified=False,
            runtimeStatus='compatibility-reconstruction' if policy['ruleset']=='PC-PK1.1' else 'compatibility-assumption'))
    def finish(): result['traceHash']=_digest(result); return result
    # Effect records and policy are part of this new API's idempotency payload.
    digest = _digest(dict(command=command, observations=observations, policy=policy))
    old = next((r for r in state['appliedCommands'] if r['id']==command['id']), None)
    if old:
        same = old['sha256']==digest
        result.update(accepted=same, replayed=same, reason='replay' if same else 'replay-payload-conflict')
        return finish()
    if command['expectedRevision'] != state['revision']: result['reason']='revision-conflict'; return finish()
    if state['revision'] == I32_MAX: raise ValueError('revision exhausted')
    plan = _Planner(state, command, observations, policy)
    try: plan.run()
    except _Reject as error:
        result.update(reason=str(error), observedEffects=copy.deepcopy(plan.effects)); return finish()
    after = copy.deepcopy(state); after.update(frame=plan.frame, revision=state['revision']+1)
    after['appliedCommands'].append(dict(id=command['id'], sha256=digest))
    result.update(accepted=True, reason='event-composed', after=after, copiedActivePersonIds=plan.copied,
        visits=plan.visits, steps=plan.steps, observedEffects=plan.effects, queries=plan.queries)
    counts = [r['rngConsumption'] for r in plan.effects]; known = all(c['kind']=='observed-count' for c in counts)
    result['rng'].update(finalState=plan.frame['rngState'], allCountsKnown=known,
        observedCalls=sum(c['calls'] for c in counts) if known else None)
    result['evidence'].update(knownHandlerTailsExecuted=any(v['handlerReturn']==1 for v in plan.visits), eventWrapperExecuted=True)
    return finish()


def replay_mission_event_composition(trace):
    if type(trace) is not dict: raise ValueError('trace object required')
    value=copy.deepcopy(trace); digest=value.pop('traceHash',None)
    if digest != _digest(value): raise ValueError('trace hash mismatch')
    try:
        result=project_mission_event_composition(trace['before'],trace['command'],trace['observations'],trace['policy'])
    except (KeyError,TypeError) as error: raise ValueError('invalid trace inputs') from error
    if result != trace: raise ValueError('trace replay mismatch')
    return result
