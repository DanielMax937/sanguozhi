"""Independent raw-assembly oracle for the live event9 home getter.

S1/S2 complete00495520,00490D00,004A31E0 and004BA1D0 establish the
source-ordered transcript below. The prior independent reset interpreter is
reused only up to004BA44C. Expected frames never call production planners,
primitives, projectors, or validators. Synthetic full-frame callback answers
are explicit test inputs, not native execution or clean-stock certification.
"""
import copy
import hashlib
import importlib
import inspect
import itertools
import json
from pathlib import Path
import random
import textwrap
import unittest
from contextlib import ExitStack
from unittest.mock import patch

import native_event9_home_getter_profile as m
import native_event9_troop_reset_profile as previous
from check_native_event9_troop_reset_profile import (
    Oracle as TroopOracle, fixture as troop_fixture,
    INHERITED_ENTRIES as TROOP_INHERITED, RESET_HELPERS as TROOP_HELPERS,
    FORCE_HELPERS, pointer, set_force, effects, presentations, virtual_sites,
    raw_pair, raw44, FORCE_VTABLE, VTABLE, I32_MIN, I32_MAX,
    scalar_leaves, change_leaf, changed_scalar)
from check_native_event9_selection_profile import node
from check_native_live_position_profile import Oracle as PositionOracle, FALLBACK
from check_empty_legion_profile import set_legion
from check_recursive_officer_return_profile import row, digest, refresh_person

SOURCES = ('S1', 'S2')
PROFILE = 'source-idb-S1-S2-native-event9-home-getter-v1'
FRAME = 'source-idb-S1-S2-native-event9-home-getter-frame-v1'
DOMAIN = 'canonical-live-event9-home-getter-v1'
INHERITED_ENTRIES = TROOP_INHERITED + ('event9-troop-reset',)
HOME_HELPERS = ('004BA44E/home-getter-call', '00495525/direct-troop-validity-call',
    '00495528/troop-home-validity', '00490B00/home-person-pointer',
    '0047A630/home-person-validity', '00495549/home-result',
    '00495551/home-result', '00490D00/home-building-pointer',
    '004BA45E/home-getter-continuation')
REMAINDER = '004BA45E/event9-reaction-remainder'
UNKNOWN = '004BA1D0/unknown-virtual'
MANAGER = 0x07201958


def fixture(entry='event9-home-getter', source='S1', **kw):
    f = troop_fixture('event9-troop-reset' if entry == 'event9-home-getter'
                      else entry, source, **kw)
    f[1].update(entry=entry, id='native-event9-home-getter-1')
    if entry.startswith('event9-'):
        row(f[0]['frame'])['homeBaseId'] = 0
    f[3].update(id='native-event9-home-getter-observe-v1', frameProfile=FRAME,
                event9HomeGetterDomain=DOMAIN)
    return f


def target_fixture(source='S1', **kw):
    f = fixture(source=source, **kw)
    row(f[0]['frame'], 0, 'troops').update(rawOrder2C=1, rawTarget30=0)
    set_force(f[0]['frame'], playerIndex=0)
    return f


def run(f):
    #The raw getter calls its virtual08 directly, never the wrapper used by
    #earlier event9 sites. Instrument that negative invariant independently.
    wrapped_valid = m._Planner.event9_valid
    def no_invented_wrapper(planner, address, site):
        if site == '00495525':
            raise AssertionError('raw00495525 is direct virtual08, not a wrapper')
        return wrapped_valid(planner, address, site)
    with patch.object(m._Planner, 'event9_valid', no_invented_wrapper):
        return m.project_native_event9_home_getter(*f)


def remainders(trace):
    return effects(trace, REMAINDER)


def selected_troops(trace):
    return [r['args']['troopPointer']['id'] for r in remainders(trace)]


def homes(trace):
    return [r['args']['homeBaseId'] for r in remainders(trace)]


def add_person(world, pid, **kw):
    existing = next((r for r in world['persons'] if r['id'] == pid), None)
    if existing is None:
        existing = dict(copy.deepcopy(row(world)), id=pid)
        world['persons'].append(existing)
    existing.update(kw)
    refresh_person(existing)
    return existing


class Oracle(TroopOracle):
    """Source-transcribed saved troop/person lifetime and signed numeric ranges."""
    def __init__(self, *args, **kw):
        super().__init__(*args, **kw)
        self.home_steps = []

    def home_step(self, helper, **details):
        self.home_steps.append(dict(helper=helper, **copy.deepcopy(details),
            callStack=copy.deepcopy(self.stack), frame=copy.deepcopy(self.w)))

    def troop_reset(self, arguments):
        # Independent inherited442..44C transcript; replace only its opaque
        #suffix. No production primitive is used to derive a frame or answer.
        address = copy.deepcopy(arguments['troopPointer'])
        self.troop_step('004BA447/troop-reset-call', troopPointer=address,
            savedForcePointer=copy.deepcopy(arguments['savedForcePointer']),
            managerIdentity=arguments['managerIdentity'], raw44Argument=-1,
            incomingEcxRead=False)
        with self.inside('004AD2B0', troopPointer=address, raw44Argument=-1,
                         site='004BA447'):
            self.troop_storage(address)
            passed = self.valid_pointer(address, '004AD2B6')
            self.troop_step('004AD2BE/troop-reset-validity',
                            troopPointer=address, passed=passed)
            if passed:
                self.troop_storage(address)['raw44'] = -1
                self.troop_step('00495A32/raw44-store', troopPointer=address,
                    byteOffset=68, byteWidth=4, value=-1,
                    unsignedBits=4294967295, signedArgument=-1, directStore=True)
        self.troop_step('004BA44C/troop-reset-continuation',
            savedTroopPointer=address,
            savedForcePointer=copy.deepcopy(arguments['savedForcePointer']),
            managerIdentity=arguments['managerIdentity'],
            eventMemoryDomain='immutable-command-event-v1',
            parameterStackNetBytes=0, reactionRemainderObserved=True)
        self.home_getter(arguments)

    def troop_home(self, address):
        #520 PUSH ESI;521 MOV ESI,ECX retains the caller's saved troop.523
        #reads this object's current vtable,525 calls+08 directly. There is no
        #0047A630 null/probe gate here and raw44 is never read by this getter.
        with self.inside('00495520', troopPointer=address, site='004BA44E'):
            current = self.troop_storage(address)
            self.home_step('00495525/direct-troop-validity-call',
                troopPointer=address, vtableAddress=current['vtableAddress'],
                virtualSlot=8, wrapperCalled=False)
            passed = (self.canonical_troop_valid(address['id'])
                      if current['vtableAddress'] == VTABLE
                      else self.virtual(address, 8, '00495525'))
            self.home_step('00495528/troop-home-validity',
                troopPointer=address, passed=passed)
            if passed:
                #52C occurs AFTER the potentially frame-replacing call.535
                #constructs the numeric person pointer;53A saves it in ESI.
                leader = self.troop_storage(address)['leaderId']
                person = pointer('persons', leader) if 0 <= leader <= 1099 else None
                self.save(savedHomePersonPointer=person)
                self.home_step('00490B00/home-person-pointer', rawLeaderId=leader,
                    personPointer=person, managerIdentity=MANAGER, fieldsRead=False)
                record = None
                if person is not None:
                    record = next((r for r in self.w['persons'] if r['id'] == person['id']), None)
                    if record is None:
                        raise ValueError('oracle reached unrepresented home person storage')
                #Canonical type10 virtual08 only. No new person-vtable or
                #effect-query schema is invented at the53D wrapper.
                valid = record is not None and (record['rawDword17C'] != 0
                    or record['status'] in (0,1,2,3,4,5,7))
                self.home_step('0047A630/home-person-validity', personPointer=person,
                    passed=valid, site='0049553D')
                if valid:
                    #549 reads the saved person's+98 DWORD.004A31E0 saves its
                    #person arg in ESI, reads+98 at3209 and stores home scalar
                    #to+98 at3272, independently identifying homeBaseId.
                    home = next(r for r in self.w['persons'] if r['id'] == person['id'])['homeBaseId']
                    self.home_step('00495549/home-result', personPointer=person,
                        homeBaseId=home, byteOffset=152, byteWidth=4,
                        signedStorage=True)
                    return home
            self.home_step('00495551/home-result', homeBaseId=-1,
                returnedSentinel=True)
            return -1

    def home_getter(self, arguments):
        troop = copy.deepcopy(arguments['troopPointer'])
        self.home_step('004BA44E/home-getter-call', troopPointer=troop,
            managerIdentity=arguments['managerIdentity'], callerEsiPreserved=True)
        home = self.troop_home(troop)
        #453 PUSH scalar;454 MOV ECX,07201958;459 CALL00490D00. Its signed
        #bounds and LEA do not read a building row or call virtual08.
        building = pointer('buildings', home) if 0 <= home <= 16383 else None
        self.home_step('00490D00/home-building-pointer', homeBaseId=home,
            buildingPointer=building, managerIdentity=MANAGER, stride=56,
            storageOffset=0x89730, fieldsRead=False, validityRead=False)
        self.home_step('004BA45E/home-getter-continuation', troopPointer=troop,
            savedForcePointer=copy.deepcopy(arguments['savedForcePointer']),
            managerIdentity=arguments['managerIdentity'], homeBaseId=home,
            homeBuildingPointer=building,
            eventMemoryDomain='immutable-command-event-v1',
            parameterStackNetBytes=0, reactionRemainderObserved=True)
        bound = dict(copy.deepcopy(arguments), homeBaseId=home,
            homeBuildingPointer=copy.deepcopy(building),
            homeResolverManagerIdentity=MANAGER,
            #45E pushes building,45F pushes4,461 pushes saved troop;462
            #loads this incoming ECX before467, without proving it is read.
            reactionCall=dict(helper='004AD220', site='004BA467', incomingEcx=0x0799895C,
                argumentOrder=[copy.deepcopy(troop), 4, copy.deepcopy(building)],
                pushOrder=[copy.deepcopy(building), 4, copy.deepcopy(troop)]))
        PositionOracle.boundary(self, 'event9-reaction-remainder', 'effect',
                               REMAINDER, bound)

    def run(self):
        if self.f[1]['entry'] != 'event9-home-getter':
            return super().run()
        try:
            self.selection(self.f[1]['args'])
        finally:
            self.f[2]['records'] = copy.deepcopy(self.records)
        return self


class NativeEvent9HomeGetterTests(unittest.TestCase):
    maxDiff = 14000
    oracle_cases = 0
    rejection_cases = 0
    mutation_cases = 0

    def assert_model(self, expected, trace):
        self.assertTrue(trace['accepted'], trace['reason'])
        self.assertEqual(trace['after']['frame'], expected.w)
        self.assertEqual(trace['nativeResult'], expected.native_result)
        self.assertEqual(trace['events'], expected.events)
        self.assertEqual(trace['returnCalls'], expected.return_calls)
        self.assertEqual(trace['observedEffects'], [r for r in expected.records if r['kind'] != 'query'])
        self.assertEqual(trace['queries'], [r for r in expected.records if r['kind'] == 'query'])
        for helpers, expected_steps in ((FORCE_HELPERS, expected.reset_steps),
                (TROOP_HELPERS, expected.troop_steps), (HOME_HELPERS, expected.home_steps)):
            self.assertEqual([s for s in trace['steps'] if s['helper'] in helpers], expected_steps)
        self.assertEqual(selected_troops(trace), expected.selected)
        self.assertEqual([(s['currentNodeId'], s['savedNextNodeId'], s['troopPointer'])
            for s in trace['steps'] if s['helper'] == '004922C0/advance'], expected.selection_visits)
        self.assertEqual([(s['enabled'], s['savedForcePointer']) for s in trace['steps']
            if s['helper'] == '004BA37D/presentation-gate'], expected.gates)
        actual_force = []
        for step in trace['steps']:
            if step['helper'] == '00480FF0/event9-force-valid':
                actual_force.append(('valid', step['forcePointer'], step['rulerId'], step['passed'], step['site']))
            if step['helper'] == '00480FA0/event9-player':
                actual_force.append(('player', step['forcePointer'], step['playerIndex'], step['passed'], step['site']))
        self.assertEqual(actual_force, expected.force_checks)
        self.assertEqual(trace['rng']['initialState'], expected.f[0]['frame']['rngState'])
        self.assertEqual(trace['rng']['finalState'], expected.w['rngState'])
        self.assertEqual(trace['rng']['localCalls'], expected.local_rng)
        counts = [r['rngConsumption'] for r in expected.records if r['kind'] != 'query']
        known = all(c['kind'] == 'observed-count' for c in counts)
        self.assertEqual(trace['rng']['allCountsKnown'], known)
        self.assertEqual(trace['rng']['observedCalls'], sum(c['calls'] for c in counts) if known else None)

    def check_oracle(self, f, replay=True, **kw):
        expected = Oracle(f, **kw).run()
        before = copy.deepcopy(f)
        trace = run(f)
        self.assert_model(expected, trace)
        type(self).oracle_cases += 1
        self.assertEqual(trace['profileId'], PROFILE)
        self.assertEqual(trace['frameProfileId'], FRAME)
        self.assertEqual(trace['after']['revision'], f[0]['revision'] + 1)
        self.assertEqual(len(trace['after']['appliedCommands']), len(f[0]['appliedCommands']) + 1)
        self.assertEqual(f, before)
        for record in presentations(trace) + remainders(trace):
            self.assertEqual(record['callStack'][-1]['helper'], '004BA296/visit')
            self.assertEqual(record['callStack'][-1]['locals']['savedForcePointer'], record['args']['savedForcePointer'])
            self.assertEqual(record['args']['savedForcePointer'], pointer('forces', record['args']['raw44']))
            self.assertEqual(record['callStack'][-1]['locals']['savedTroopPointer'], record['args']['troopPointer'])
        for record in remainders(trace):
            self.assertEqual(record['args']['homeResolverManagerIdentity'], MANAGER)
        if replay:
            self.assertEqual(trace, m.replay_native_event9_home_getter(json.loads(json.dumps(trace))))
        return trace

    def atomic_error(self, f):
        before = copy.deepcopy(f)
        with self.assertRaises(ValueError):
            run(f)
        type(self).rejection_cases += 1
        self.assertEqual(f, before)

    def atomic_defer(self, f, reason):
        before = copy.deepcopy(f)
        trace = run(f)
        self.assertFalse(trace['accepted'])
        self.assertEqual(trace['reason'], reason)
        self.assertEqual(trace['after'], f[0])
        for key in ('events', 'steps', 'queries'):
            self.assertEqual(trace[key], [])
        self.assertEqual(f, before)
        self.assertEqual(trace, m.replay_native_event9_home_getter(trace))
        type(self).rejection_cases += 1
        return trace

    def test_01_all_twenty_five_inherited_and_new_entries_both_sources(self):
        self.assertEqual(len(INHERITED_ENTRIES), 25)
        for source, entry in itertools.product(SOURCES, INHERITED_ENTRIES + ('event9-home-getter',)):
            with self.subTest(source=source, entry=entry):
                self.check_oracle(fixture(entry, source))

    def test_02_prior_order_direct_getter_and_complete_saved_continuation(self):
        for source, entry in itertools.product(SOURCES, ('event9-selection',
                'event9-presentation', 'event9-force-reset', 'event9-troop-reset', 'event9-home-getter')):
            trace = self.check_oracle(target_fixture(source, entry=entry))
            self.assertEqual([r['helper'] for r in trace['observedEffects']], ['004BA411/event9-presentation', REMAINDER])
            ordered = [s['helper'] for s in trace['steps'] if s['helper'] in FORCE_HELPERS + TROOP_HELPERS + HOME_HELPERS]
            self.assertEqual(ordered, list(FORCE_HELPERS + TROOP_HELPERS + HOME_HELPERS[:6] + HOME_HELPERS[7:]))
            self.assertEqual(raw44(remainders(trace)[0]['before']), -1)
            self.assertEqual(raw_pair(remainders(trace)[0]['before']), (0xFFFFFFFF, 0))
            self.assertEqual(homes(trace), [0])
            r = remainders(trace)[0]
            self.assertEqual(r['args']['homeBuildingPointer'], pointer('buildings', 0))
            self.assertEqual(r['args']['homeResolverManagerIdentity'], 0x07201958)
            self.assertEqual(r['args']['reactionCall'],dict(helper='004AD220',site='004BA467',incomingEcx=0x0799895C,
                argumentOrder=[pointer('troops',0),4,pointer('buildings',0)],
                pushOrder=[pointer('buildings',0),4,pointer('troops',0)]))
            self.assertEqual(r['args']['managerIdentity'], 'entry-ecx')
            self.assertEqual(r['args']['raw44'], 0)
            self.assertEqual(r['args']['troopPointer'], pointer('troops', 0))
            home_step = next(s for s in trace['steps'] if s['helper'] == '00495549/home-result')
            self.assertEqual(home_step['callStack'][-1], dict(helper='00495520', locals=dict(
                troopPointer=pointer('troops', 0), site='004BA44E', savedHomePersonPointer=pointer('persons', 7))))
            self.assertEqual(home_step['personPointer'], pointer('persons', 7))
            self.assertEqual((home_step['byteOffset'], home_step['byteWidth']), (152, 4))

    def test_03_signed_home_extremes_and_numeric_resolver_boundaries(self):
        for source, home in itertools.product(SOURCES,
                (I32_MIN, -16384, -2, -1, 0, 1, 42, 86, 87, 1099, 1100, 16382, 16383, 16384, I32_MAX)):
            f = target_fixture(source)
            row(f[0]['frame'])['homeBaseId'] = home
            trace = self.check_oracle(f)
            self.assertEqual(homes(trace), [home])
            self.assertEqual(remainders(trace)[0]['args']['homeBuildingPointer'],
                pointer('buildings', home) if 0 <= home <= 16383 else None)
            self.assertEqual(row(trace['after']['frame'])['homeBaseId'], home)
            self.assertEqual(row(trace['after']['frame'], 0, 'forces')['rawByte98'], 0)

    def test_04_resolver_never_reads_building_storage_validity_or_subtype(self):
        for source, home, variant in itertools.product(SOURCES, (0, 1, 42, 1000, 16383), ('absent', 'invalid', 'valid')):
            f = fixture(source=source); w = f[0]['frame']; row(w)['homeBaseId'] = home
            b = next((r for r in w['buildings'] if r['id'] == home), None)
            if b is None and variant != 'absent':
                b = dict(copy.deepcopy(row(w, 16383, 'buildings')), id=home)
                w['buildings'].append(b)
            if variant == 'absent':
                w['buildings'] = [r for r in w['buildings'] if r['id'] != home]
                w['cities'] = [r for r in w['cities'] if r['id'] != home]
                if f[1]['args']['subjectId'] == home: f[1]['args']['subjectId'] = 42 if home != 42 else 1
                if home < 87:
                    #The inherited frame requires all87 base storage slots,
                    #including all42 city subtypes. Keep that exact domain.
                    self.atomic_error(f)
                    continue
            elif variant == 'invalid':
                b.update(kind=-1, valid=False)
            trace = self.check_oracle(f)
            self.assertEqual(homes(trace), [home])
            self.assertEqual(remainders(trace)[0]['args']['homeBuildingPointer'], pointer('buildings', home))
            step = next(s for s in trace['steps'] if s['helper'] == '00490D00/home-building-pointer')
            self.assertFalse(step['fieldsRead']); self.assertFalse(step['validityRead'])

    def test_05_direct_canonical_validity_status_raw_flags_and_deputy_bounds(self):
        for source, status, flag in itertools.product(SOURCES,
                (I32_MIN, -1, *range(10), I32_MAX), (0, 1, 0xFFFFFFFF)):
            f = target_fixture(source)
            def effect(stage, after, context):
                if stage == 'event9-presentation': row(after).update(status=status, rawDword17C=flag, homeBaseId=16383)
                return 0
            trace = self.check_oracle(f, effect=effect, replay=False)
            valid = bool(flag) or status in (0,1,2,3,4,5,7)
            self.assertEqual(homes(trace), [16383 if valid else -1])
            self.assertEqual(len([s for s in trace['steps'] if s['helper'] == '00490B00/home-person-pointer']), int(valid))
        for source, index, deputy in itertools.product(SOURCES, (0,1), (I32_MIN,-1,0,1099,1100,I32_MAX)):
            f = target_fixture(source)
            def effect(stage, after, context):
                if stage == 'event9-presentation': row(after,0,'troops')['deputyIds'][index] = deputy
                return 0
            trace = self.check_oracle(f, effect=effect, replay=False)
            self.assertEqual(homes(trace), [0 if deputy < 1100 else -1])

    def test_06_unknown_true_rereads_leader_and_saved_current_person(self):
        for source, leader, vtable in itertools.product(SOURCES,
                (I32_MIN,-1,0,7,9,1099,1100,I32_MAX), (0, VTABLE, 0xFFFFFFFF)):
            f = target_fixture(source); w = f[0]['frame']
            for pid in (0,7,9,1099): add_person(w,pid,homeBaseId=pid+400,status=3,rawDword17C=0)
            def effect(stage, after, context):
                if stage == 'event9-presentation': row(after,0,'troops')['vtableAddress'] = 0
                if context['args'].get('site') == '00495525':
                    replacement = dict(copy.deepcopy(row(after,0,'troops')),
                        leaderId=leader, deputyIds=[1100,I32_MAX], vtableAddress=vtable, raw44=47)
                    after['troops'] = [replacement if r['id']==0 else copy.deepcopy(r) for r in after['troops']]
                    if 0 <= leader <= 1099: row(after,leader,'persons')['homeBaseId'] = 16383-leader
                    after['rngState'] = 0xF1234567
                    return dict(result=True,count=3)
                return 0
            trace = self.check_oracle(f,effect=effect,replay=False)
            self.assertEqual(homes(trace), [16383-leader if 0 <= leader <= 1099 else -1])
            self.assertEqual(virtual_sites(trace), ['004AD2B6','00495525'])
            self.assertEqual(raw44(trace['after']['frame']),47)
            home_pointer = next(s for s in trace['steps'] if s['helper']=='00490B00/home-person-pointer')
            self.assertEqual(home_pointer['personPointer'],pointer('persons',leader) if 0 <= leader <= 1099 else None)
            getter_record = [r for r in effects(trace,UNKNOWN) if r['args']['site']=='00495525'][0]
            self.assertEqual(getter_record['callStack'][-1],dict(helper='00495520',locals=dict(troopPointer=pointer('troops',0),site='004BA44E')))

    def test_07_true_troop_callback_then_invalid_or_unallocated_person(self):
        for source, status, flag in itertools.product(SOURCES,
                (I32_MIN,-1,*range(10),I32_MAX),(0,1,0xFFFFFFFF)):
            f = target_fixture(source)
            def effect(stage,after,context):
                if stage=='event9-presentation': row(after,0,'troops')['vtableAddress']=0
                if context['args'].get('site')=='00495525':
                    row(after,0,'troops').update(leaderId=9,vtableAddress=VTABLE)
                    row(after,9,'persons').update(status=status,rawDword17C=flag,homeBaseId=1099)
                    return dict(result=True,count=0)
                return 0
            trace=self.check_oracle(f,effect=effect,replay=False)
            valid=bool(flag) or status in (0,1,2,3,4,5,7)
            self.assertEqual(homes(trace),[1099 if valid else -1])
            valid_step=next(s for s in trace['steps'] if s['helper']=='0047A630/home-person-validity')
            self.assertEqual(valid_step['personPointer'],pointer('persons',9))
            self.assertEqual(valid_step['passed'],valid)
            self.assertNotIn('0049553D',virtual_sites(trace))

    def test_08_false_direct_callback_retains_full_frame_rng_without_leader_read(self):
        for source,leader,count in itertools.product(SOURCES,(1098,-1,I32_MAX),(0,7,None)):
            f=target_fixture(source)
            def effect(stage,after,context):
                if stage=='event9-presentation': row(after,0,'troops')['vtableAddress']=0
                if context['args'].get('site')=='00495525':
                    row(after,0,'troops').update(leaderId=leader,vtableAddress=VTABLE,raw44=I32_MIN)
                    row(after)['homeBaseId']=16383
                    set_force(after,rawDword94=19,rawByte98=255)
                    after[FALLBACK].update(positionX=-32768,positionY=32767)
                    after['data']['nested']['value']=0x95525
                    after['troopListHead']=None
                    after['rngState']=0xABCDEF12
                    return dict(result=False,count=count)
                return 0
            trace=self.check_oracle(f,effect=effect)
            self.assertEqual(homes(trace),[-1]);self.assertEqual(raw44(trace['after']['frame']),I32_MIN)
            self.assertEqual(raw_pair(trace['after']['frame']),(19,255))
            getter=[r for r in effects(trace,UNKNOWN) if r['args']['site']=='00495525'][0]
            self.assertEqual(remainders(trace)[0]['before'],getter['after'])
            self.assertFalse(any(s['helper']=='00490B00/home-person-pointer' for s in trace['steps']))
            self.assertEqual(trace['rng']['observedCalls'],count)

    def test_09_live_vtable_transition_and_exact_once_direct_dispatch(self):
        for source,first,second,answer in itertools.product(SOURCES,(0,VTABLE),(0,VTABLE),(False,True)):
            f=target_fixture(source)
            def effect(stage,after,context):
                if stage=='event9-presentation': row(after,0,'troops')['vtableAddress']=first
                if context['args'].get('site')=='004AD2B6':
                    row(after,0,'troops')['vtableAddress']=second
                    return dict(result=answer,count=1)
                if context['args'].get('site')=='00495525': return dict(result=answer,count=2)
                return 0
            trace=self.check_oracle(f,effect=effect)
            new_unknown=first==0 and second==0
            self.assertEqual(virtual_sites(trace).count('00495525'),int(new_unknown))
            self.assertEqual(homes(trace),[-1 if new_unknown and not answer else 0])
            steps=[s for s in trace['steps'] if s['helper']=='00495525/direct-troop-validity-call']
            self.assertEqual(len(steps),1);self.assertFalse(steps[0]['wrapperCalled'])
            self.assertEqual(steps[0]['vtableAddress'],second if first==0 else VTABLE)

    def test_10_saved_identities_survive_all_callback_mutations(self):
        for source in SOURCES:
            f=target_fixture(source);w=f[0]['frame'];set_force(w,1);set_force(w,46)
            row(w,0,'troops')['raw44']=1
            def effect(stage,after,context):
                if stage=='event9-presentation':
                    row(after,0,'troops').update(vtableAddress=0,raw44=46,rawTarget30=1)
                    row(after,17,'troopListNodes')['troopId']=999
                if context['args'].get('site')=='00495525':
                    row(after,0,'troops').update(raw44=47,leaderId=9,rawTarget30=42)
                    row(after,9,'persons')['homeBaseId']=16383
                    row(after,7,'persons')['homeBaseId']=I32_MAX
                    set_legion(row(after,0,'legions'),forceId=46)
                    return dict(result=True,count=1)
                if stage=='event9-reaction-remainder':
                    self.assertEqual(context['args']['homeBaseId'],16383)
                    self.assertEqual(context['args']['homeBuildingPointer'],pointer('buildings',16383))
                    row(after,9,'persons')['homeBaseId']=0
                    row(after,0,'troops')['leaderId']=7
                return 0
            trace=self.check_oracle(f,effect=effect)
            r=remainders(trace)[0]
            self.assertEqual(r['args']['troopPointer'],pointer('troops',0))
            self.assertEqual(r['args']['savedForcePointer'],pointer('forces',1))
            self.assertEqual(r['args']['targetPointer'],pointer('buildings',0))
            self.assertEqual(r['args']['raw44'],1)
            self.assertEqual(homes(trace),[16383]);self.assertEqual(row(trace['after']['frame'],9,'persons')['homeBaseId'],0)

    def test_11_missing_reached_person_or_troop_storage_is_atomic(self):
        for source in SOURCES:
            f=target_fixture(source)
            def missing(stage,after,context):
                if stage=='event9-presentation': row(after,0,'troops')['vtableAddress']=0
                if context['args'].get('site')=='00495525':
                    row(after,0,'troops')['leaderId']=1098
                    return dict(result=True,count=0)
                return 0
            with self.assertRaisesRegex(ValueError,'unrepresented home person'): Oracle(f,effect=missing).run()
            self.atomic_error(f)
            for table,ident in (('troops',0),('persons',9)):
                for answer in (False,True):
                    g=target_fixture(source)
                    def removed(stage,after,context):
                        if stage=='event9-presentation': row(after,0,'troops')['vtableAddress']=0
                        if context['args'].get('site')=='00495525':
                            row(after,0,'troops')['leaderId']=9
                            after[table]=[r for r in after[table] if r['id']!=ident]
                            return dict(result=answer,count=1)
                        return 0
                    if answer:
                        with self.assertRaises(ValueError): Oracle(g,effect=removed).run()
                    else: Oracle(g,effect=removed).run()
                    self.atomic_error(g)

    def test_12_person_home_signed_schema_and_no_person_callback_extension(self):
        for source in SOURCES:
            f=target_fixture(source);Oracle(f).run()
            for place,index in [('initial',None)]+[(key,i) for i in range(2) for key in ('before','after')]:
                for bad in (I32_MIN-1,I32_MAX+1,0xFFFFFFFF,True,False,0.5,None,'0',[],{}):
                    g=copy.deepcopy(f);w=g[0]['frame'] if place=='initial' else g[2]['records'][index][place]
                    row(w)['homeBaseId']=bad;self.atomic_error(g)
                for defect in ('missing-home','vtable','virtual08','cache','raw-byte-alias','home-pointer-cache'):
                    g=copy.deepcopy(f);w=g[0]['frame'] if place=='initial' else g[2]['records'][index][place]
                    p=row(w)
                    if defect=='missing-home':del p['homeBaseId']
                    elif defect=='vtable':p['vtableAddress']=0
                    elif defect=='virtual08':p['virtual08']=True
                    elif defect=='cache':p['valid']=False
                    elif defect=='raw-byte-alias':p['rawByte98']=0
                    else:p['homeBuildingPointer']=pointer('buildings',0)
                    self.atomic_error(g)

    def test_13_every_callback_and_continuation_argument_scope_leaf_bound(self):
        for source in SOURCES:
            f=target_fixture(source)
            def effect(stage,after,context):
                if stage=='event9-presentation':row(after,0,'troops')['vtableAddress']=0
                return 0
            Oracle(f,effect=effect).run()
            self.assertEqual([r['helper'] for r in f[2]['records']],['004BA411/event9-presentation',UNKNOWN,UNKNOWN,REMAINDER])
            for index,record in enumerate(f[2]['records']):
                for root in ('args','callStack'):
                    for path,value in scalar_leaves(record[root]):
                        with self.subTest(source=source,index=index,root=root,path=path):
                            g=copy.deepcopy(f);change_leaf(g[2]['records'][index][root],path,changed_scalar(value));self.atomic_error(g)
                    g=copy.deepcopy(f)
                    if root=='args':g[2]['records'][index][root]['unbound']=1
                    else:g[2]['records'][index][root].pop()
                    self.atomic_error(g)
                for key in record['args']:
                    g=copy.deepcopy(f);del g[2]['records'][index]['args'][key];self.atomic_error(g)
            for stale in ('004BA44C/event9-reaction-remainder','004BA442/event9-reaction-remainder','004BA432/event9-reaction'):
                g=copy.deepcopy(f);g[2]['records'][-1]['helper']=stale;self.atomic_error(g)

    def test_14_observation_order_identity_frames_and_fixed_domain(self):
        for source in SOURCES:
            f=target_fixture(source)
            def effect(stage,after,context):
                if stage=='event9-presentation':row(after,0,'troops')['vtableAddress']=0
                return 0
            Oracle(f,effect=effect).run()
            for index in range(4):
                for defect in ('index','source','kind','helper','missing','extra','reverse',
                        'before-rng','before-home','before-leader','before-vtable','before-force98',
                        'after-remove','after-add','missing-after','unknown-field','rng-kind','rng-count'):
                    g=copy.deepcopy(f);rs=g[2]['records'];r=rs[index]
                    if defect=='index':r['index']+=1
                    elif defect=='source':r['source']='S2' if source=='S1' else 'S1'
                    elif defect=='kind':r['kind']='query'
                    elif defect=='helper':r['helper']='00495520'
                    elif defect=='missing':del rs[index]
                    elif defect=='extra':rs.append(copy.deepcopy(rs[-1]));rs[-1]['index']+=1
                    elif defect=='reverse':rs.reverse()
                    elif defect=='before-rng':r['before']['rngState']^=1
                    elif defect=='before-home':row(r['before'])['homeBaseId']^=1
                    elif defect=='before-leader':row(r['before'],0,'troops')['leaderId']=9
                    elif defect=='before-vtable':row(r['before'],0,'troops')['vtableAddress']^=1
                    elif defect=='before-force98':row(r['before'],0,'forces')['rawByte98']^=1
                    elif defect=='after-remove':r['after']['troops'].pop()
                    elif defect=='after-add':r['after']['troops'].append(dict(copy.deepcopy(r['after']['troops'][0]),id=99))
                    elif defect=='missing-after':del r['after']
                    elif defect=='unknown-field':r['unexpected']=1
                    elif defect=='rng-kind':r['rngConsumption']['kind']='assumed'
                    else:r['rngConsumption']['calls']=-1
                    self.atomic_error(g)

    def test_15_unknown08_strict_boolean_and_no_invented_person_observations(self):
        for source in SOURCES:
            f=target_fixture(source)
            def effect(stage,after,context):
                if stage=='event9-presentation':row(after,0,'troops')['vtableAddress']=0
                return 0
            Oracle(f,effect=effect).run()
            for invalid in (0,1,-1,0xFFFFFFFF,None,'true',[],{}):
                g=copy.deepcopy(f);g[2]['records'][2]['result']=invalid;self.atomic_error(g)
            for slot in (0,4,44,64,72):
                g=copy.deepcopy(f);g[2]['records'][2]['args']['virtualSlot']=slot;self.atomic_error(g)
            for site in ('0049553D','004AD2B6','004BA2A8'):
                g=copy.deepcopy(f);g[2]['records'][2]['args']['site']=site;self.atomic_error(g)
            g=copy.deepcopy(f);r=copy.deepcopy(g[2]['records'][2]);r['args'].update(pointer=pointer('persons',7),site='0049553D')
            g[2]['records'].insert(3,r)
            for i,r in enumerate(g[2]['records']):r['index']=i
            self.atomic_error(g)

    def test_16_missing_suffix_after_getter_and_stores_is_atomic(self):
        for source,unknown in itertools.product(SOURCES,(False,True)):
            f=target_fixture(source)
            def effect(stage,after,context):
                if unknown and stage=='event9-presentation':row(after,0,'troops')['vtableAddress']=0
                after['rngState']=(after['rngState']+0x12345)&0xFFFFFFFF
                after['data']['nested']['value']+=1
                return 2
            Oracle(f,effect=effect).run();f[2]['records'].pop();self.atomic_error(f)
            if unknown:
                g=copy.deepcopy(f);g[2]['records'].pop();self.atomic_error(g)

    def test_17_reject_policy_first_unresolved_boundary_is_atomic(self):
        for source in SOURCES:
            f=target_fixture(source);f[3]['unknownEffects']='reject'
            self.atomic_defer(f,'unresolved-effect:004BA411/event9-presentation')
            f=fixture(source=source);f[3]['unknownEffects']='reject'
            trace=self.atomic_defer(f,'unresolved-effect:'+REMAINDER)
            self.assertEqual(trace['observedEffects'][0]['args']['homeBaseId'],0)
            self.assertEqual(trace['observedEffects'][0]['args']['homeBuildingPointer'],pointer('buildings',0))
            self.assertEqual(raw44(trace['observedEffects'][0]['before']),-1)
            self.assertEqual(raw_pair(trace['observedEffects'][0]['before']),(0xFFFFFFFF,0))
            f=fixture(source=source);row(f[0]['frame'],0,'troops')['vtableAddress']=0;f[3]['unknownEffects']='reject'
            self.atomic_defer(f,'unresolved-effect:'+UNKNOWN)

    def test_18_exact_policy_command_domain_and_no_general_getter(self):
        for source in SOURCES:
            for key in ('event9HomeGetterDomain','event9TroopResetDomain','event9ForceResetDomain',
                    'event9PresentationDomain','event9SelectionDomain','event9EventMemoryDomain','frameProfile'):
                for value in (None,'','unsupported',True):
                    f=fixture(source=source);f[3][key]=value;self.atomic_error(f)
                f=fixture(source=source);del f[3][key];self.atomic_error(f)
            for where in range(4):
                f=fixture(source=source);f[where]['unexpected']=1;self.atomic_error(f)
            for entry in ('home-getter','troop-home','00495520','00490D00','building-pointer'):
                f=fixture(source=source);f[1]['entry']=entry;self.atomic_error(f)
            for field in ('troopPointer','savedForcePointer','homeBaseId','homeBuildingPointer','homeResolverManagerIdentity'):
                f=fixture(source=source);f[1]['args'][field]=0;self.atomic_error(f)
            f=fixture(source=source);f[0]['frame']['personVtableDomain']='arbitrary';self.atomic_error(f)

    def test_19_revision_idempotence_conflict_exhaustion_and_exact_replay(self):
        f=target_fixture();trace=self.check_oracle(f)
        g=copy.deepcopy(f);g[0]=copy.deepcopy(trace['after'])
        replayed=run(g);self.assertTrue(replayed['replayed']);self.assertEqual(replayed['after'],g[0])
        for where in ('policy','observation','command'):
            h=copy.deepcopy(g)
            if where=='policy':h[3]['id']+='-different'
            elif where=='observation':h[2]['provenance']+='-different'
            else:h[1]['args']['argument']+=1
            self.atomic_defer(h,'replay-payload-conflict')
        f[1]['expectedRevision']+=1;self.atomic_defer(f,'revision-conflict')
        f[0]['revision']=I32_MAX;f[1]['expectedRevision']=I32_MAX;self.atomic_error(f)
        for field in ('after','steps','evidence','profileId','frameProfileId','observedEffects','rng'):
            for rehash in (False,True):
                altered=copy.deepcopy(trace)
                if field=='after':row(altered[field]['frame'])['homeBaseId']=46
                elif field=='steps':next(s for s in altered[field] if s['helper']=='00495549/home-result')['byteWidth']=1
                elif field=='evidence':altered[field]['stockVerified']=True
                elif field=='observedEffects':altered[field][-1]['args']['homeBaseId']=46
                elif field=='rng':altered[field]['observedCalls']+=1
                else:altered[field]='wrong'
                if rehash:altered['traceHash']=digest({k:v for k,v in altered.items() if k!='traceHash'})
                with self.assertRaises(ValueError):m.replay_native_event9_home_getter(altered)
                type(self).rejection_cases+=1

    def test_20_saved_next_cursor_and_home_before_later_mutation(self):
        for source,mutate_at in itertools.product(SOURCES,('getter08','event9-reaction-remainder')):
            f=target_fixture(source);w=f[0]['frame']
            w['troopListNodes']=[node(17,29),node(29,55),node(55)];set_force(w,46)
            def effect(stage,after,context):
                if stage=='event9-presentation':row(after,context['args']['troopPointer']['id'],'troops')['vtableAddress']=0
                matching=stage==mutate_at or (mutate_at=='getter08' and context['args'].get('site')=='00495525')
                if matching and any(r['id']==17 for r in after['troopListNodes']):
                    after['troopListNodes']=[node(29,None,999),node(55)];after['troopListHead']=55
                    row(after,999,'troops').update(raw44=46,rawOrder2C=1,rawTarget30=0)
                    row(after)['homeBaseId']=16383
                return 0
            trace=self.check_oracle(f,effect=effect)
            self.assertEqual(selected_troops(trace),[0,999])
            self.assertEqual([r['args']['savedNextNodeId'] for r in remainders(trace)],[29,None])
            self.assertEqual(homes(trace),[16383,16383] if mutate_at=='getter08' else [0,16383])

    def test_21_complete_rng_order_force_reset_troop_reset_getter_suffix(self):
        for source,count in itertools.product(SOURCES,(0,2,None)):
            f=target_fixture(source)
            def effect(stage,after,context):
                if stage=='event9-presentation':
                    set_force(after,vtableAddress=0);row(after,0,'troops')['vtableAddress']=0
                    after['rngState']=0x12345678;return 3
                site=context['args'].get('site')
                if site=='004B5026':
                    self.assertEqual(raw44(after),0);self.assertEqual(after['rngState'],0x12345678)
                    after['rngState']=0x23456789;return dict(result=True,count=4)
                if site=='004AD2B6':
                    self.assertEqual(raw_pair(after),(0xFFFFFFFF,0));self.assertEqual(after['rngState'],0x23456789)
                    after['rngState']=0x3456789A;return dict(result=True,count=5)
                if site=='00495525':
                    self.assertEqual(raw44(after),-1);self.assertEqual(after['rngState'],0x3456789A)
                    row(after,0,'troops')['leaderId']=9;row(after,9,'persons')['homeBaseId']=16383
                    after['rngState']=0x456789AB;return dict(result=True,count=6)
                if stage=='event9-reaction-remainder':
                    self.assertEqual(context['args']['homeBaseId'],16383);self.assertEqual(after['rngState'],0x456789AB)
                    after['rngState']=0x56789ABC;return count
                return 0
            trace=self.check_oracle(f,effect=effect)
            self.assertEqual([r['helper'] for r in trace['observedEffects']],['004BA411/event9-presentation',UNKNOWN,UNKNOWN,UNKNOWN,REMAINDER])
            self.assertEqual(virtual_sites(trace),['004B5026','004AD2B6','00495525'])
            self.assertEqual(trace['rng']['observedCalls'],None if count is None else 18+count)
            self.assertEqual(trace['rng']['localCalls'],0);self.assertEqual(trace['rng']['finalState'],0x56789ABC)

    def test_22_all_previous_entry_apis_frames_and_suffix_are_unchanged(self):
        for source,entry in itertools.product(SOURCES,INHERITED_ENTRIES):
            old=troop_fixture(entry,source);expected=TroopOracle(old).run()
            trace=previous.project_native_event9_troop_reset(*old)
            self.assertTrue(trace['accepted']);self.assertEqual(trace['after']['frame'],expected.w)
            self.assertEqual(trace,previous.replay_native_event9_troop_reset(trace))
            self.assertFalse(any(s['helper'] in HOME_HELPERS for s in trace['steps']))
            self.assertFalse(any(r['helper']==REMAINDER for r in trace['observedEffects']))
            self.atomic_error(old)
            with self.assertRaises(ValueError):previous.project_native_event9_troop_reset(*fixture(entry,source))
            type(self).rejection_cases+=1
        old=troop_fixture();TroopOracle(old).run();trace=previous.project_native_event9_troop_reset(*old)
        self.assertEqual([r['helper'] for r in trace['observedEffects']],['004BA44C/event9-reaction-remainder'])
        self.assertNotIn('homeBaseId',trace['observedEffects'][0]['args'])

    def test_23_expected_frames_survive_poisoned_production(self):
        names=('native_event9_home_getter_profile','native_event9_troop_reset_profile',
            'native_event9_force_reset_profile','native_event9_presentation_profile','native_event9_selection_profile',
            'native_live_position_profile','native_troop_membership_profile','native_tail_distance_profile',
            'generic_facility_profile','live_zero_refund_profile','officer_relocation_profile',
            'base_ownership_events_profile','empty_legion_redistribution_profile','return_route_target_force_profile',
            'native_roster_sort_profile','recursive_officer_return_profile')
        primitives=('native_event9_home_getter_primitives','native_event9_troop_reset_primitives',
            'native_event9_force_reset_primitives','native_event9_presentation_primitives','native_event9_selection_primitives',
            'native_live_position_primitives','native_troop_membership_primitives','native_tail_distance_primitives')
        frames=('native_event9_home_getter_frame','native_event9_troop_reset_frame','native_event9_force_reset_frame',
            'native_event9_presentation_frame','native_event9_selection_frame','native_live_position_frame',
            'native_troop_membership_frame','recursive_return_frame','base_ownership_frame')
        f=target_fixture()
        def effect(stage,after,context):
            if stage=='event9-presentation':row(after,0,'troops')['vtableAddress']=0
            if context['args'].get('site')=='00495525':
                row(after,0,'troops')['leaderId']=9;row(after,9,'persons')['homeBaseId']=16383
                return dict(result=True,count=4)
            return 0
        with ExitStack() as stack:
            for name in names+frames:
                module=importlib.import_module(name)
                for attr in dir(module):
                    if attr.startswith(('project_','validate')) or attr in ('_Planner','frame_domain','person_predicates'):
                        stack.enter_context(patch.object(module,attr,side_effect=AssertionError('production oracle dependency')))
            for name in primitives:
                module=importlib.import_module(name)
                for attr in ('person_predicates','ptr'):
                    if hasattr(module,attr):stack.enter_context(patch.object(module,attr,side_effect=AssertionError('production helper dependency')))
                for cls in vars(module).values():
                    if not isinstance(cls,type) or cls.__module__!=name:continue
                    for attr,value in vars(cls).items():
                        if callable(value):stack.enter_context(patch.object(cls,attr,side_effect=AssertionError('production primitive dependency')))
            expected=Oracle(f,effect=effect).run()
        self.assertEqual(expected.selected,[0]);self.assertEqual(expected.records[-1]['args']['homeBaseId'],16383)
        self.assertEqual([r['helper'] for r in expected.records],['004BA411/event9-presentation',UNKNOWN,UNKNOWN,REMAINDER])

    def test_24_recursion_ownership_non_event_paths_and_engine_guards(self):
        for source in SOURCES:
            f=fixture('event',source);f[1]['args']=dict(id=9,subjectType='building',subjectId=0,argument=417)
            w=f[0]['frame'];row(w).update(missionId=0,homeBaseId=0)
            w.update(observerPresent=True,troopListNodes=[node(17),node(29,None,999)])
            row(w,999,'troops').update(rawOrder2C=1,rawTarget30=0);set_force(w,playerIndex=0)
            def effect(stage,after,context):
                if stage=='ownership-handler':after['troopListHead']=29
                if stage=='event9-presentation':after['troopListHead']=None
                if stage=='event-observer':after['troopListNodes']=[]
                return 0
            trace=self.check_oracle(f,effect=effect);self.assertEqual(selected_troops(trace),[999])
            self.assertEqual(remainders(trace)[0]['callStack'][0]['helper'],'004BBAA0')
            for eid in (8,9,10,14):
                g=fixture(source=source);g[1]['args']['id']=eid;g[0]['frame']['troopListHead']=None if eid==9 else 0xFFFFFFFF
                trace=self.check_oracle(g);self.assertEqual(trace['observedEffects'],[])
            g=target_fixture(source);g[0]['frame']['troopListNodes']=[node(17,29),node(29,17,None)]
            g[3]['event9NodeLimit']=3
            with self.assertRaisesRegex(ValueError,'oracle node guard reached'):Oracle(g).run()
            self.atomic_defer(g,'engine-guard-event9-node-budget')
        f=target_fixture();Oracle(f).run();limit=run(f)['nativeCalls']
        #Only budget calibration uses production counts, never semantic answers.
        for limit_value in (1,limit-1):
            f[3]['engineGuard']['maxNativeCalls']=limit_value;self.atomic_defer(f,'engine-guard-native-call-budget')
        f[3]['engineGuard']['maxNativeCalls']=limit;self.assertTrue(run(f)['accepted'])

    def test_25_seeded_live_frame_sequences_and_evolving_commits(self):
        rand=random.Random(0x495520)
        for index in range(64):
            f=target_fixture(SOURCES[index%2]);w=f[0]['frame']
            w['troopListNodes']=[node(17,29),node(29,None,999)];set_force(w,46)
            for tid in (0,999):row(w,tid,'troops').update(raw44=rand.choice((0,46)),rawOrder2C=rand.choice((0,1,4)),rawTarget30=0)
            home=rand.choice((I32_MIN,-1,0,42,1000,16383,16384,I32_MAX));leader=rand.choice((-1,7,9,1100))
            answer=rand.choice((False,True));replacement=rand.choice((VTABLE,0,0xFFFFFFFF))
            def effect(stage,after,context):
                if stage=='event9-presentation':row(after,context['args']['troopPointer']['id'],'troops')['vtableAddress']=0
                if stage=='event9-unknown-virtual':
                    after['rngState']=(after['rngState']+0x95520)&0xFFFFFFFF
                    if context['args']['site']=='00495525':
                        tid=context['args']['pointer']['id'];row(after,tid,'troops').update(leaderId=leader,vtableAddress=replacement)
                        for pid in (7,9):row(after,pid,'persons')['homeBaseId']=home
                        return dict(result=answer,count=None if index%7==0 else 1)
                if stage=='event9-reaction-remainder':after['data']['nested']['value']+=1
                return 0
            self.check_oracle(f,effect=effect,replay=index%8==0)
        f=target_fixture()
        for turn in range(8):
            f[1].update(id='home-evolving-'+str(turn),expectedRevision=turn)
            def effect(stage,after,context):
                if stage=='event9-presentation':row(after,0,'troops')['vtableAddress']=0
                if context['args'].get('site')=='00495525':
                    row(after,0,'troops')['leaderId']=9 if turn%2 else 7
                    row(after,9 if turn%2 else 7,'persons')['homeBaseId']=16383 if turn%2 else I32_MIN
                    return dict(result=True,count=turn%2)
                if stage=='event9-reaction-remainder':row(after,0,'troops').update(raw44=0,leaderId=7,vtableAddress=VTABLE)
                return 0
            trace=self.check_oracle(f,effect=effect);self.assertEqual(homes(trace),[16383 if turn%2 else I32_MIN])
            self.assertEqual(trace['after']['revision'],turn+1);f[0]=copy.deepcopy(trace['after'])

    def test_26_raw_complete_getter_resolver_and_caller_opcodes(self):
        root=Path(__file__).resolve().parents[1]/'docs/sources/native_event9_home_getter'
        expected={
            '00495520':[('00495520','56'),('00495521','8b f1'),('00495523','8b 06'),
                ('00495525','ff 50 08'),('00495528','85 c0'),('0049552A','74 25'),
                ('0049552C','8b 46 0c'),('0049552F','50'),('00495530','b9 58 19 20 07'),
                ('00495535','e8 c6 b5 ff ff'),('0049553A','8b f0'),('0049553C','56'),
                ('0049553D','e8 ee 50 fe ff'),('00495542','83 c4 04'),('00495545','85 c0'),
                ('00495547','74 08'),('00495549','8b 86 98 00 00 00'),('0049554F','5e'),
                ('00495550','c3'),('00495551','83 c8 ff'),('00495554','5e'),('00495555','c3')],
            '00490D00':[('00490D00','8b 44 24 04'),('00490D04','85 c0'),('00490D06','7c 14'),
                ('00490D08','3d ff 3f 00 00'),('00490D0D','7f 0d'),('00490D0F','6b c0 38'),
                ('00490D12','8d 84 08 30 97 08 00'),('00490D19','c2 04 00'),
                ('00490D1C','33 c0'),('00490D1E','c2 04 00')],
            '004BA1D0':[('004BA44C','8b ce'),('004BA44E','e8 cd b0 fd ff'),
                ('004BA453','50'),('004BA454','b9 58 19 20 07'),('004BA459','e8 a2 68 fd ff'),
                ('004BA45E','50'),('004BA45F','6a 04'),('004BA461','56'),
                ('004BA462','b9 5c 89 99 07'),('004BA467','e8 b4 2d ff ff')],
            '004A31E0':[('004A31E1','8b 74 24 08'),('004A3209','8b 86 98 00 00 00'),
                ('004A3272','89 ae 98 00 00 00')]}
        for function,instructions in expected.items():
            source_raw=[]
            for source in SOURCES:
                lines=(root/(source+'-'+function+'.asm.txt')).read_text().splitlines()
                raw={line[:8]:line[10:40].strip() for line in lines}
                for address,octets in instructions:self.assertEqual(raw[address],octets,(source,address))
                if function in ('00495520','00490D00'):self.assertEqual(len(lines),len(instructions))
                source_raw.append(bytes.fromhex(' '.join(raw.values())))
            self.assertEqual(source_raw[0],source_raw[1])

    def test_27_evidence_remains_source_local_and_bounded(self):
        trace=self.check_oracle(target_fixture());evidence=trace['evidence']
        for key in ('sourceLocalOnly','event9ForceResetNative','event9TroopResetNative','event9HomeGetterNative',
                'event9DirectTroop08','event9CanonicalPersonHomeDword','event9HomeScalarSignedStorage',
                'event9NumericHomeBuildingPointer','event9SavedForceIdentityPreserved','event9ReactionRemainderObserved'):
            self.assertTrue(evidence[key])
        for key in ('stockVerified','vanillaVerified','event9HomeBuildingStorageRead','event9HomeGeneralGetterExposed',
                'event9GeneralForceSettersExposed','event9GeneralTroopSettersExposed','completeGameTransaction',
                'machineCodeExecuted','event9TailExecuted','event9MutableEventMemorySupported',
                'callbacksAssumedNoninterfering','observationAuthenticityVerified','engineGuardIsOriginalRule'):
            self.assertFalse(evidence[key])
        self.assertEqual(evidence['event9HomeGetterStart'],'004BA44C')
        self.assertEqual(evidence['event9HomeGetterEndExclusive'],'004BA45E')
        self.assertEqual(evidence['event9ReactionStart'],'004BA45E')
        self.assertFalse(trace['rng']['globalConsumptionVerified'])

    def test_28_semantic_mutants_killed_after_same_fixture_baseline_pass(self):
        import native_event9_home_getter_primitives as primitive
        cls=primitive.NativeEvent9HomeGetterPrimitives
        getter=textwrap.dedent(inspect.getsource(cls.event9_troop_home))
        outer=textwrap.dedent(inspect.getsource(cls.event9_home_getter))
        #Source transformations change one semantic claim at a time. Every
        #mutant first runs its own exact fixture through unmodified production.
        variants=[]
        def add(name,method,old,new,scenario='live'):
            original=getter if method=='event9_troop_home' else outer
            self.assertIn(old,original,name)
            changed=original.replace(old,new,1);self.assertNotEqual(changed,original,name)
            variants.append((name,method,changed,scenario))
        G='event9_troop_home';O='event9_home_getter'
        add('skip-home-after-raw44-reset',O,'home = self.event9_troop_home(troop)',
            "home = -1 if self.slot('troops', troop['id'])['raw44'] == -1 else self.event9_troop_home(troop)")
        add('wrong-saved-troop',O,"troop = copy.deepcopy(args['troopPointer'])","troop = dict(storage='troops', id=999)")
        add('wrong-saved-force',O,"copy.deepcopy(args['savedForcePointer'])","dict(storage='forces', id=46)")
        add('stale-pre-callback-leader',G,"leader = self.slot('troops', troop['id'])['leaderId']","leader = current['leaderId']")
        add('revalidate-after-callback',G,'if not passed:',"if not passed or not self.native_troop_valid(troop['id']):")
        add('ignore-false-answer',G,'if not passed:','if False:',scenario='false')
        add('always-reject-true-answer',G,'if not passed:','if True:')
        add('false-result-zero',G,'return -1','return 0',scenario='false')
        add('wrong-direct-slot',G,"self.event9_unknown_virtual(troop, 8, '00495525')","self.event9_unknown_virtual(troop, 4, '00495525')")
        add('wrong-direct-site',G,"self.event9_unknown_virtual(troop, 8, '00495525')","self.event9_unknown_virtual(troop, 8, '0049553D')")
        add('incorrect-wrapper-claim',G,'wrapperCalled=False','wrapperCalled=True')
        add('invent-wrapper-at-direct08',G,"self.event9_unknown_virtual(troop, 8, '00495525')","self.event9_valid(troop, '00495525')")
        add('person-low-bound-off-by-one',G,'0 <= leader <= 1099','1 <= leader <= 1099',scenario='person-zero')
        add('person-high-bound-off-by-one',G,'0 <= leader <= 1099','0 <= leader <= 1098',scenario='person-last')
        add('person-upper-escape',G,'0 <= leader <= 1099','0 <= leader <= 1100',scenario='person-out')
        add('skip-person-validity',G,'if not valid:','if False:',scenario='invalid-person')
        add('wrong-saved-person-for-home',G,"self.slot('persons', person['id'])['homeBaseId']","self.slot('persons', 7)['homeBaseId']")
        add('read-force98-instead-of-person98',G,"self.slot('persons', person['id'])['homeBaseId']","self.slot('forces', 0)['rawByte98']")
        add('truncate-home-to-byte',G,"home = self.slot('persons', person['id'])['homeBaseId']","home = self.slot('persons', person['id'])['homeBaseId'] & 255")
        add('unsigned-home-coercion',G,"home = self.slot('persons', person['id'])['homeBaseId']","home = self.slot('persons', person['id'])['homeBaseId'] & 0xffffffff",scenario='negative-home')
        add('home-field-width',G,'byteWidth=4','byteWidth=1')
        add('home-field-offset',G,'byteOffset=0x98','byteOffset=0x44')
        add('building-low-bound-off-by-one',O,'0 <= home <= 16383','1 <= home <= 16383',scenario='zero-home')
        add('building-high-bound-off-by-one',O,'0 <= home <= 16383','0 <= home <= 16382',scenario='last-home')
        add('building-upper-escape',O,'0 <= home <= 16383','0 <= home <= 16384',scenario='out-home')
        add('building-rejects-absent-storage',O,'self.step(\'00490D00/home-building-pointer\'',
            "self.slot('buildings', home)\n    self.step('00490D00/home-building-pointer'",scenario='absent-home')
        add('building-tests-validity',O,"building = ptr('buildings', home) if 0 <= home <= 16383 else None",
            "building = ptr('buildings', home) if 0 <= home <= 16383 and self.slot('buildings', home)['valid'] else None",scenario='invalid-building')
        add('wrong-resolver-manager',O,'managerIdentity=CANONICAL_OBJECT_MANAGER','managerIdentity=0x0799895C')
        add('wrong-building-stride',O,'stride=0x38','stride=0x34')
        add('wrong-building-offset',O,'storageOffset=0x89730','storageOffset=0x89734')
        add('claims-building-read',O,'fieldsRead=False','fieldsRead=True')
        add('unbalanced-getter-stack',O,'parameterStackNetBytes=0','parameterStackNetBytes=4')
        add('caller-esi-not-preserved',O,'callerEsiPreserved=True','callerEsiPreserved=False')
        add('old-suffix',O,REMAINDER,'004BA44C/event9-reaction-remainder')
        add('drop-home-binding',O,'bound = dict(copy.deepcopy(args), homeBaseId=home,','bound = dict(copy.deepcopy(args), homeBaseId=0,')
        add('drop-pointer-binding',O,'homeBuildingPointer=copy.deepcopy(building)','homeBuildingPointer=None')
        add('wrong-bound-resolver-manager',O,'homeResolverManagerIdentity=CANONICAL_OBJECT_MANAGER','homeResolverManagerIdentity=0x0799895C')
        add('wrong-reaction-helper',O,"reactionCall=dict(helper='004AD220'","reactionCall=dict(helper='004AD2B0'")
        add('wrong-reaction-ecx',O,'incomingEcx=0x0799895C','incomingEcx=0x07201958')
        add('wrong-reaction-literal',O,'argumentOrder=[copy.deepcopy(troop), 4, copy.deepcopy(building)]',
            'argumentOrder=[copy.deepcopy(troop), 0, copy.deepcopy(building)]')
        add('wrong-reaction-push-order',O,'pushOrder=[copy.deepcopy(building), 4, copy.deepcopy(troop)]',
            'pushOrder=[copy.deepcopy(troop), 4, copy.deepcopy(building)]')
        add('invent-person-callback',G,"valid = person_predicates(self.slot('persons', person['id']))[1]",
            "valid = self.event9_unknown_virtual(person, 8, '0049553D')")
        for name,method,mutant,scenario in variants:
            for source in SOURCES:
                f=target_fixture(source);w=f[0]['frame'];set_force(w,1);set_force(w,46)
                row(w,0,'troops')['raw44']=1;row(w)['homeBaseId']=42
                add_person(w,0,homeBaseId=41);add_person(w,1099,homeBaseId=43)
                def effect(stage,after,context):
                    if stage=='event9-presentation':
                        row(after,0,'troops').update(vtableAddress=0,raw44=46)
                        row(after,17,'troopListNodes')['troopId']=999
                    if context['args'].get('site')=='00495525':
                        leader={'person-zero':0,'person-last':1099,'person-out':1100}.get(scenario,9)
                        home={'zero-home':0,'last-home':16383,'out-home':16384,'negative-home':I32_MIN,
                            'absent-home':1000,'invalid-building':16383}.get(scenario,16383)
                        replacement=dict(copy.deepcopy(row(after,0,'troops')),leaderId=leader,
                            deputyIds=[1100,I32_MAX],vtableAddress=VTABLE,raw44=47)
                        after['troops']=[replacement if r['id']==0 else copy.deepcopy(r) for r in after['troops']]
                        if 0<=leader<=1099:row(after,leader,'persons').update(homeBaseId=home,status=6 if scenario=='invalid-person' else 3,rawDword17C=0)
                        if scenario=='invalid-building':row(after,16383,'buildings').update(kind=-1,valid=False)
                        after['rngState']=0xF1234567
                        return dict(result=scenario!='false',count=3)
                    return 0
                expected=Oracle(f,effect=effect).run()
                self.assert_model(expected,run(f))
                namespace=dict(vars(primitive));exec(mutant,namespace)
                before=copy.deepcopy(f)
                with self.subTest(source=source,mutation=name),patch.object(cls,method,namespace[method]):
                    #The out-of-range person-pointer mutant may dereference the
                    #resolver's null slot; that TypeError is itself the killed
                    #range-guard defect, not an arbitrary accepted test error.
                    failures=(AssertionError,ValueError,RecursionError) + ((TypeError,) if name=='person-upper-escape' else ())
                    with self.assertRaises(failures):
                        self.assert_model(expected,run(f))
                self.assertEqual(f,before);type(self).mutation_cases+=1

    @classmethod
    def tearDownClass(cls):
        print('Independent home-getter oracle coverage: %d accepted semantic cases; %d atomic rejection cases; %d killed production mutations' %
              (cls.oracle_cases,cls.rejection_cases,cls.mutation_cases))


if __name__=='__main__':
    unittest.main()
