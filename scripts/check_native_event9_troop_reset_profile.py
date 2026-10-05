"""Independent raw-source oracle for the bounded saved-troop raw44 reset.

The inherited independent force-reset oracle supplies selection/presentation.
Its force reset transcript is repeated below with explicit provenance, replacing
only its old opaque004BA442 continuation. New004BA442..44C,004AD2B0 and00495A20
semantics are independently transcribed from complete S1/S2 raw assembly.
Expected frames never call production planners, primitives, projectors or frame
validators. Mutable effects/virtual answers are synthetic full-frame inputs,
not machine execution, clean-stock evidence or a complete game transaction.
"""
import copy
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

import native_event9_troop_reset_profile as m
import native_event9_force_reset_profile as previous
from check_native_event9_force_reset_profile import (
    Oracle as ForceOracle, fixture as force_fixture,
    INHERITED_ENTRIES as FORCE_INHERITED, RESET_HELPERS as FORCE_HELPERS,
    pointer, set_force, effects, presentations, virtual_sites, raw_pair,
    FORCE_VTABLE, VTABLE, I32_MIN, I32_MAX, scalar_leaves, change_leaf,
    changed_scalar)
from check_native_event9_selection_profile import node
from check_native_live_position_profile import Oracle as PositionOracle, FALLBACK
from check_empty_legion_profile import set_legion
from check_recursive_officer_return_profile import row, digest

SOURCES = ('S1', 'S2')
PROFILE = 'source-idb-S1-S2-native-event9-troop-reset-v1'
FRAME = 'source-idb-S1-S2-native-event9-troop-reset-frame-v1'
DOMAIN = 'canonical-live-event9-troop-reset-v1'
INHERITED_ENTRIES = FORCE_INHERITED + ('event9-force-reset',)
RESET_HELPERS = ('004BA447/troop-reset-call', '004AD2BE/troop-reset-validity',
    '00495A32/raw44-store', '004BA44C/troop-reset-continuation')
REMAINDER = '004BA44C/event9-reaction-remainder'
UNKNOWN = '004BA1D0/unknown-virtual'


def fixture(entry='event9-troop-reset', source='S1', **kw):
    f = force_fixture('event9-force-reset' if entry == 'event9-troop-reset'
                      else entry, source, **kw)
    f[1].update(entry=entry, id='native-event9-troop-reset-1')
    f[3].update(id='native-event9-troop-reset-observe-v1', frameProfile=FRAME,
                event9TroopResetDomain=DOMAIN)
    return f


def target_fixture(source='S1', **kw):
    f = fixture(source=source, **kw)
    row(f[0]['frame'], 0, 'troops').update(rawOrder2C=1, rawTarget30=0)
    set_force(f[0]['frame'], playerIndex=0)
    return f


def run(f):
    return m.project_native_event9_troop_reset(*f)


def remainders(trace):
    return effects(trace, REMAINDER)


def selected_troops(trace):
    return [r['args']['troopPointer']['id'] for r in remainders(trace)]


def raw44(world, tid=0):
    return row(world, tid, 'troops')['raw44']


class Oracle(ForceOracle):
    """Saved identity and direct signed raw44 store from the raw instructions."""
    def __init__(self, *args, **kw):
        super().__init__(*args, **kw)
        self.troop_steps = []

    def troop_step(self, helper, **details):
        self.troop_steps.append(dict(helper=helper, **copy.deepcopy(details),
            callStack=copy.deepcopy(self.stack), frame=copy.deepcopy(self.w)))

    def troop_storage(self, address):
        troop = next((r for r in self.w['troops'] if r['id'] == address['id']), None)
        if troop is None:
            raise ValueError('oracle reached unrepresented troop storage')
        return troop

    def reset(self, arguments):
        # Explicitly inherited independent004BA432/004B5020 interpreter from
        # check_native_event9_force_reset_profile. Only its final opaque boundary
        # changes; the preceding five expected steps remain source-identical.
        address = copy.deepcopy(arguments['savedForcePointer'])
        self.reset_step('004BA43D/force-reset-call', forcePointer=address,
            managerIdentity=arguments['managerIdentity'], raw94Argument=-1,
            raw98Argument=0, incomingEcxRead=False)
        with self.inside('004B5020', forcePointer=address, raw94Argument=-1,
                         raw98Argument=0, site='004BA43D'):
            self.reset_storage(address)
            passed = self.valid_pointer(address, '004B5026')
            self.reset_step('004B502E/force-reset-validity', forcePointer=address,
                            passed=passed)
            if passed:
                self.reset_storage(address)['rawDword94'] = (1 << 32) - 1
                self.reset_step('004815A2/raw94-store', forcePointer=address,
                    byteOffset=148, byteWidth=4, value=4294967295,
                    signedArgument=-1, directStore=True)
                self.reset_storage(address)['rawByte98'] = 0
                self.reset_step('004815B4/raw98-store', forcePointer=address,
                    byteOffset=152, byteWidth=1, value=0, lowByteArgument=0,
                    directStore=True)
        self.reset_step('004BA442/force-reset-continuation',
            savedForcePointer=address, managerIdentity=arguments['managerIdentity'],
            eventMemoryDomain='immutable-command-event-v1',
            parameterStackNetBytes=0, reactionRemainderObserved=True)
        self.troop_reset(arguments)

    def troop_reset(self, arguments):
        #442 PUSH -1,444 PUSH saved ESI,445 MOV ECX,EDI,447 CALL004AD2B0.
        #The helper saves arg1 into ESI, calls validity once, and never reads its
        #incoming manager ECX. Its direct setter receives the literal -1.
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
                #495A24 CMP -1 takes JE directly to495A32. Signed field storage
                #encodes DWORD FFFFFFFF as -1. Resolve current storage at the saved
                #identity, without rechecking leader, deputies or replaced vtable.
                self.troop_storage(address)['raw44'] = -1
                self.troop_step('00495A32/raw44-store', troopPointer=address,
                    byteOffset=68, byteWidth=4, value=-1,
                    unsignedBits=4294967295, signedArgument=-1, directStore=True)
        #Setter RET4 and helper RET8 consume their own arguments. Earlier EBX
        #still names the pre-presentation force; do not recompute it from raw44.
        self.troop_step('004BA44C/troop-reset-continuation',
            savedTroopPointer=address,
            savedForcePointer=copy.deepcopy(arguments['savedForcePointer']),
            managerIdentity=arguments['managerIdentity'],
            eventMemoryDomain='immutable-command-event-v1',
            parameterStackNetBytes=0, reactionRemainderObserved=True)
        PositionOracle.boundary(self, 'event9-reaction-remainder', 'effect',
                               REMAINDER, copy.deepcopy(arguments))

    def run(self):
        if self.f[1]['entry'] != 'event9-troop-reset':
            return super().run()
        try:
            self.selection(self.f[1]['args'])
        finally:
            self.f[2]['records'] = copy.deepcopy(self.records)
        return self


class NativeEvent9TroopResetTests(unittest.TestCase):
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
        self.assertEqual([s for s in trace['steps'] if s['helper'] in FORCE_HELPERS], expected.reset_steps)
        self.assertEqual([s for s in trace['steps'] if s['helper'] in RESET_HELPERS], expected.troop_steps)
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
        if replay:
            self.assertEqual(trace, m.replay_native_event9_troop_reset(json.loads(json.dumps(trace))))
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
        self.assertEqual(trace, m.replay_native_event9_troop_reset(trace))
        type(self).rejection_cases += 1
        return trace

    def test_01_all_twenty_four_inherited_and_new_entries_both_sources(self):
        self.assertEqual(len(INHERITED_ENTRIES), 24)
        for source, entry in itertools.product(SOURCES, INHERITED_ENTRIES + ('event9-troop-reset',)):
            with self.subTest(source=source, entry=entry):
                self.check_oracle(fixture(entry, source))

    def test_02_exact_force_then_troop_store_and_balanced_scopes(self):
        for source, entry in itertools.product(SOURCES, ('event9-selection',
                'event9-presentation', 'event9-force-reset', 'event9-troop-reset')):
            trace = self.check_oracle(target_fixture(source, entry=entry))
            self.assertEqual([r['helper'] for r in trace['observedEffects']], ['004BA411/event9-presentation', REMAINDER])
            stores = [s for s in trace['steps'] if s['helper'] in FORCE_HELPERS[2:4] + RESET_HELPERS[2:3]]
            self.assertEqual([s['byteWidth'] for s in stores], [4, 1, 4])
            self.assertEqual([raw44(s['frame']) for s in stores], [0, 0, -1])
            self.assertEqual(raw_pair(stores[0]['frame']), (0xFFFFFFFF, 0xA5))
            self.assertEqual(raw_pair(stores[1]['frame']), (0xFFFFFFFF, 0))
            self.assertEqual(raw_pair(stores[2]['frame']), (0xFFFFFFFF, 0))
            self.assertEqual(stores[2]['callStack'][-1], dict(helper='004AD2B0', locals=dict(
                troopPointer=pointer('troops', 0), raw44Argument=-1, site='004BA447')))
            self.assertEqual(raw44(presentations(trace)[0]['after']), 0)
            self.assertEqual(raw44(remainders(trace)[0]['before']), -1)
            self.assertEqual(remainders(trace)[0]['args']['savedForcePointer'], pointer('forces', 0))
            self.assertEqual(remainders(trace)[0]['args']['raw44'], 0)

    def test_03_signed_raw44_edges_selection_and_postpresentation_storage(self):
        edges = (I32_MIN, -1, 0, 1, 46, 47, I32_MAX)
        for source, value in itertools.product(SOURCES, edges):
            f = target_fixture(source)
            set_force(f[0]['frame'], 1); set_force(f[0]['frame'], 46)
            row(f[0]['frame'], 0, 'troops')['raw44'] = value
            trace = self.check_oracle(f)
            self.assertEqual(raw44(trace['after']['frame']), -1 if 0 <= value <= 46 else value)
            self.assertEqual(len(remainders(trace)), int(0 <= value <= 46))
            g = target_fixture(source)
            def effect(stage, after, context):
                if stage == 'event9-presentation': row(after, 0, 'troops')['raw44'] = value
                return 0
            trace = self.check_oracle(g, effect=effect)
            self.assertEqual(raw44(trace['after']['frame']), -1)

    def test_04_live_leader_signed_edges_at_reset(self):
        for source, leader in itertools.product(SOURCES, (I32_MIN, -1, 0, 1099, 1100, I32_MAX)):
            f = target_fixture(source)
            # Existing represented person1099 may be valid or invalid; make it
            #valid using its raw status without invoking any production helper.
            for pid in (0, 1099):
                p = copy.deepcopy(row(f[0]['frame'], 7, 'persons')); p['id'] = pid
                if not any(r['id'] == pid for r in f[0]['frame']['persons']): f[0]['frame']['persons'].append(p)
            def effect(stage, after, context):
                if stage == 'event9-presentation':
                    row(after, 0, 'troops').update(leaderId=leader, raw44=46)
                    if 0 <= leader <= 1099:
                        row(after, leader, 'persons').update(status=0, rawDword17C=0)
                return 0
            trace = self.check_oracle(f, effect=effect)
            valid = 0 <= leader <= 1099
            self.assertEqual(raw44(trace['after']['frame']), -1 if valid else 46)
            self.assertEqual(len([s for s in trace['steps'] if s['helper'] == RESET_HELPERS[2]]), int(valid))
            self.assertEqual(raw_pair(trace['after']['frame']), (0xFFFFFFFF, 0))

    def test_05_live_person_raw_status_override_and_deputy_bounds(self):
        for source, status, flag in itertools.product(SOURCES, (I32_MIN, -1, *range(10), I32_MAX), (0, 1, 0xFFFFFFFF)):
            f = target_fixture(source)
            def effect(stage, after, context):
                if stage == 'event9-presentation':
                    row(after, 7, 'persons').update(status=status, rawDword17C=flag)
                    row(after, 0, 'troops')['raw44'] = 46
                return 0
            trace = self.check_oracle(f, effect=effect, replay=False)
            self.assertEqual(raw44(trace['after']['frame']), -1 if flag or status in (0,1,2,3,4,5,7) else 46)
        for source, index, value in itertools.product(SOURCES, (0,1), (I32_MIN, -1, 0, 1099, 1100, I32_MAX)):
            f = target_fixture(source)
            def effect(stage, after, context):
                if stage == 'event9-presentation':
                    row(after, 0, 'troops')['deputyIds'][index] = value
                    row(after, 0, 'troops')['raw44'] = 46
                return 0
            trace = self.check_oracle(f, effect=effect, replay=False)
            self.assertEqual(raw44(trace['after']['frame']), -1 if value < 1100 else 46)

    def test_06_no_presentation_still_performs_both_resets(self):
        for source, variant in itertools.product(SOURCES, ('null', 'invalid-target', 'nonplayer')):
            f = target_fixture(source)
            if variant == 'null': row(f[0]['frame'], 0, 'troops')['rawOrder2C'] = 0
            elif variant == 'invalid-target': row(f[0]['frame'], 0, 'buildings').update(kind=-1, valid=False)
            else: set_force(f[0]['frame'], playerIndex=-1)
            trace = self.check_oracle(f)
            self.assertEqual(presentations(trace), [])
            self.assertEqual(raw44(trace['after']['frame']), -1)
            self.assertEqual(raw_pair(trace['after']['frame']), (0xFFFFFFFF, 0))

    def test_07_saved_troop_force_manager_and_target_survive_presentation(self):
        for source in SOURCES:
            f = target_fixture(source); w = f[0]['frame']
            set_force(w, 1, rawDword94=17, rawByte98=19)
            set_force(w, 46, rawDword94=23, rawByte98=29)
            row(w, 0, 'troops')['raw44'] = 1
            def effect(stage, after, context):
                if stage == 'event9-presentation':
                    row(after, 0, 'troops').update(raw44=46, rawTarget30=1)
                    row(after, 17, 'troopListNodes')['troopId'] = 999
                    set_legion(row(after, 0, 'legions'), forceId=46)
                    after['data']['nested']['value'] = 411
                    after['rngState'] = 0xF1234567
                    return 3
                return 0
            trace = self.check_oracle(f, effect=effect)
            self.assertEqual(raw44(trace['after']['frame']), -1)
            self.assertEqual(raw44(trace['after']['frame'], 999), raw44(w, 999))
            self.assertEqual(raw_pair(trace['after']['frame'], 1), (0xFFFFFFFF, 0))
            self.assertEqual(raw_pair(trace['after']['frame'], 46), (23, 29))
            r = remainders(trace)[0]
            self.assertEqual(r['args']['troopPointer'], pointer('troops', 0))
            self.assertEqual(r['args']['savedForcePointer'], pointer('forces', 1))
            self.assertEqual(r['args']['targetPointer'], pointer('buildings', 0))
            self.assertEqual(r['args']['managerIdentity'], 'entry-ecx')

    def test_08_prior_force_callback_changes_live_troop_validity(self):
        for source, leader in itertools.product(SOURCES, (-1, 7, 1100)):
            f = target_fixture(source)
            def effect(stage, after, context):
                if stage == 'event9-presentation': set_force(after, vtableAddress=0)
                if context['args'].get('site') == '004B5026':
                    row(after, 0, 'troops').update(leaderId=leader, raw44=46)
                    after['rngState'] = 0xAD2B0
                    return dict(result=True, count=5)
                return 0
            trace = self.check_oracle(f, effect=effect)
            self.assertEqual(virtual_sites(trace), ['004B5026'])
            self.assertEqual(raw44(trace['after']['frame']), -1 if leader == 7 else 46)
            self.assertEqual(raw_pair(trace['after']['frame']), (0xFFFFFFFF, 0))

    def test_09_unknown_troop08_true_replaces_frame_and_never_revalidates(self):
        for source, vtable, leader, count in itertools.product(SOURCES,
                (0, VTABLE, 0xFFFFFFFF), (-1, 1100), (0, None)):
            f = target_fixture(source)
            def effect(stage, after, context):
                if stage == 'event9-presentation': row(after, 0, 'troops')['vtableAddress'] = 0
                if context['args'].get('site') == '004AD2B6':
                    replacement = dict(copy.deepcopy(row(after, 0, 'troops')),
                        vtableAddress=vtable, leaderId=leader, deputyIds=[1100, I32_MAX], raw44=46)
                    after['troops'] = [replacement if r['id'] == 0 else copy.deepcopy(r) for r in after['troops']]
                    after['rngState'] = 0xFEDCBA98
                    return dict(result=True, count=count)
                return 0
            trace = self.check_oracle(f, effect=effect, replay=False)
            self.assertEqual(virtual_sites(trace), ['004AD2B6'])
            self.assertEqual(raw44(trace['after']['frame']), -1)
            self.assertEqual(row(trace['after']['frame'], 0, 'troops')['leaderId'], leader)
            record = effects(trace, UNKNOWN)[0]
            self.assertEqual(record['callStack'][-1], dict(helper='004AD2B0', locals=dict(
                troopPointer=pointer('troops', 0), raw44Argument=-1, site='004BA447')))
            self.assertEqual(record['args'], dict(pointer=pointer('troops', 0), virtualSlot=8, site='004AD2B6'))

    def test_10_unknown08_false_preserves_callback_mutations_and_rng(self):
        for source, count in itertools.product(SOURCES, (0, 7, None)):
            f = target_fixture(source)
            def effect(stage, after, context):
                if stage == 'event9-presentation': row(after, 0, 'troops')['vtableAddress'] = 0
                if context['args'].get('site') == '004AD2B6':
                    row(after, 0, 'troops').update(raw44=I32_MIN, vtableAddress=VTABLE, leaderId=0)
                    set_force(after, rawDword94=123, rawByte98=255)
                    after[FALLBACK].update(positionX=-32768, positionY=32767)
                    after['data']['nested']['value'] = 0xAD2B6
                    after['rngState'] = 0xABCDEF12
                    after['troopListHead'] = None
                    return dict(result=False, count=count)
                return 0
            trace = self.check_oracle(f, effect=effect)
            self.assertEqual(raw44(trace['after']['frame']), I32_MIN)
            self.assertEqual(raw_pair(trace['after']['frame']), (123, 255))
            self.assertEqual(remainders(trace)[0]['before'], effects(trace, UNKNOWN)[0]['after'])
            self.assertFalse(any(s['helper'] == RESET_HELPERS[2] for s in trace['steps']))

    def test_11_unknown_initial_vtable_and_each_new_validity_is_once(self):
        for source, answer in itertools.product(SOURCES, (False, True)):
            f = target_fixture(source); row(f[0]['frame'], 0, 'troops')['vtableAddress'] = 0
            def effect(stage, after, context):
                if context['args'].get('site') == '004AD2B6': return dict(result=answer, count=2)
                return 0
            trace = self.check_oracle(f, effect=effect)
            self.assertEqual(virtual_sites(trace).count('004AD2B6'), 1)
            self.assertEqual(raw44(trace['after']['frame']), -1 if answer else 0)
            self.assertEqual(len([s for s in trace['steps'] if s['helper'] == RESET_HELPERS[1]]), 1)

    def test_12_missing_reached_storage_and_removed_callback_rows_are_errors(self):
        for source in SOURCES:
            f = target_fixture(source)
            f[0]['frame']['troops'] = [r for r in f[0]['frame']['troops'] if r['id'] != 0]
            self.atomic_error(f)
            for stage_to_remove in ('event9-presentation', 'troop08'):
                for answer in (True, False):
                    g = target_fixture(source)
                    def effect(stage, after, context):
                        if stage == 'event9-presentation':
                            row(after, 0, 'troops')['vtableAddress'] = 0
                            if stage_to_remove == stage:
                                after['troops'] = [r for r in after['troops'] if r['id'] != 0]
                        if stage_to_remove == 'troop08' and context['args'].get('site') == '004AD2B6':
                            after['troops'] = [r for r in after['troops'] if r['id'] != 0]
                            return dict(result=answer, count=1)
                        return 0
                    if stage_to_remove == 'event9-presentation' or answer:
                        with self.assertRaisesRegex(ValueError, 'unrepresented troop storage'):
                            Oracle(g, effect=effect).run()
                    else:
                        # An observed frame cannot shrink the fixed manager-slot
                        #domain, even when a false return avoids a later store.
                        Oracle(g, effect=effect).run()
                    self.atomic_error(g)
            h = target_fixture(source)
            def absent_leader(stage, after, context):
                if stage == 'event9-presentation': row(after, 0, 'troops')['leaderId'] = 1098
                return 0
            with self.assertRaises(ValueError): Oracle(h, effect=absent_leader).run()
            self.atomic_error(h)

    def test_13_signed_raw44_exact_schema_in_initial_and_observed_frames(self):
        for source in SOURCES:
            f = target_fixture(source); Oracle(f).run()
            places = [('initial', None)] + [(key, i) for i in range(2) for key in ('before', 'after')]
            for place, index in places:
                for bad in (I32_MIN-1, I32_MAX+1, 0xFFFFFFFF, True, False, 0.5, None, '-1', [], {}):
                    g = copy.deepcopy(f)
                    world = g[0]['frame'] if place == 'initial' else g[2]['records'][index][place]
                    row(world, 0, 'troops')['raw44'] = bad
                    self.atomic_error(g)
                for defect in ('missing-raw44', 'unsigned-alias', 'validity-cache', 'force-word', 'force-byte'):
                    g = copy.deepcopy(f)
                    world = g[0]['frame'] if place == 'initial' else g[2]['records'][index][place]
                    if defect == 'missing-raw44': del row(world, 0, 'troops')['raw44']
                    elif defect == 'unsigned-alias': row(world, 0, 'troops')['rawDword44'] = 0xFFFFFFFF
                    elif defect == 'validity-cache': row(world, 0, 'troops')['valid'] = True
                    elif defect == 'force-word': row(world, 0, 'forces')['rawDword94'] = -1
                    else: row(world, 0, 'forces')['rawByte98'] = 256
                    self.atomic_error(g)

    def test_14_every_observation_argument_and_scope_leaf_is_exactly_bound(self):
        for source in SOURCES:
            f = target_fixture(source)
            def effect(stage, after, context):
                if stage == 'event9-presentation': row(after, 0, 'troops')['vtableAddress'] = 0
                return 0
            Oracle(f, effect=effect).run()
            self.assertEqual([r['helper'] for r in f[2]['records']], ['004BA411/event9-presentation', UNKNOWN, REMAINDER])
            for index, record in enumerate(f[2]['records']):
                for root in ('args', 'callStack'):
                    for path, value in scalar_leaves(record[root]):
                        with self.subTest(source=source, record=index, root=root, path=path):
                            g = copy.deepcopy(f)
                            change_leaf(g[2]['records'][index][root], path, changed_scalar(value))
                            self.atomic_error(g)
                    g = copy.deepcopy(f)
                    if root == 'args': g[2]['records'][index][root]['unbound'] = 1
                    else: g[2]['records'][index][root].pop()
                    self.atomic_error(g)
                for key in record['args']:
                    g = copy.deepcopy(f); del g[2]['records'][index]['args'][key]; self.atomic_error(g)

    def test_15_record_order_identity_before_frame_and_fixed_domain(self):
        for source in SOURCES:
            f = target_fixture(source)
            def effect(stage, after, context):
                if stage == 'event9-presentation': row(after, 0, 'troops')['vtableAddress'] = 0
                return 0
            Oracle(f, effect=effect).run()
            for index in range(3):
                for defect in ('index', 'source', 'kind', 'helper', 'missing', 'extra', 'reverse',
                    'before-rng', 'before-data', 'before-raw44', 'before-raw94', 'before-raw98',
                    'before-vtable', 'before-leader', 'before-deputy', 'before-fallback',
                    'before-head', 'before-node', 'after-remove', 'after-add', 'after-id',
                    'missing-after', 'missing-before', 'unknown-field', 'rng-kind', 'rng-count'):
                    with self.subTest(source=source, record=index, defect=defect):
                        g = copy.deepcopy(f); rs = g[2]['records']; record = rs[index]
                        if defect == 'index': record['index'] += 1
                        elif defect == 'source': record['source'] = 'S2' if source == 'S1' else 'S1'
                        elif defect == 'kind': record['kind'] = 'query'
                        elif defect == 'helper': record['helper'] = '004BA442/event9-reaction-remainder'
                        elif defect == 'missing': del rs[index]
                        elif defect == 'extra': rs.append(copy.deepcopy(rs[-1])); rs[-1]['index'] += 1
                        elif defect == 'reverse': rs.reverse()
                        elif defect == 'before-rng': record['before']['rngState'] ^= 1
                        elif defect == 'before-data': record['before']['data']['nested']['value'] += 1
                        elif defect == 'before-raw44': row(record['before'], 0, 'troops')['raw44'] ^= 1
                        elif defect == 'before-raw94': row(record['before'], 0, 'forces')['rawDword94'] ^= 1
                        elif defect == 'before-raw98': row(record['before'], 0, 'forces')['rawByte98'] ^= 1
                        elif defect == 'before-vtable': row(record['before'], 0, 'troops')['vtableAddress'] ^= 1
                        elif defect == 'before-leader': row(record['before'], 0, 'troops')['leaderId'] = -1
                        elif defect == 'before-deputy': row(record['before'], 0, 'troops')['deputyIds'][1] = 1100
                        elif defect == 'before-fallback': record['before'][FALLBACK]['positionX'] += 1
                        elif defect == 'before-head': record['before']['troopListHead'] = None
                        elif defect == 'before-node': record['before']['troopListNodes'][0]['nextNodeId'] = 29
                        elif defect == 'after-remove': record['after']['troops'].pop()
                        elif defect == 'after-add':
                            record['after']['troops'].append(dict(copy.deepcopy(record['after']['troops'][0]), id=99))
                        elif defect == 'after-id': record['after']['troops'][0]['id'] = 99
                        elif defect == 'missing-after': del record['after']
                        elif defect == 'missing-before': del record['before']
                        elif defect == 'unknown-field': record['ignored'] = 1
                        elif defect == 'rng-kind': record['rngConsumption']['kind'] = 'assumed'
                        elif defect == 'rng-count': record['rngConsumption']['calls'] = -1
                        self.atomic_error(g)

    def test_16_reset08_result_strict_boolean_no_virtual_setter_observation(self):
        for source in SOURCES:
            f = target_fixture(source)
            def effect(stage, after, context):
                if stage == 'event9-presentation': row(after, 0, 'troops')['vtableAddress'] = 0
                return 0
            Oracle(f, effect=effect).run()
            for invalid in (0, 1, -1, 0xFFFFFFFF, None, 'true', [], {}):
                g = copy.deepcopy(f); g[2]['records'][1]['result'] = invalid; self.atomic_error(g)
            for slot in (0, 4, 0x40, 0x44, 0x48):
                g = copy.deepcopy(f); g[2]['records'][1]['args']['virtualSlot'] = slot; self.atomic_error(g)
            for setter in ('004AD2C9', '00495A20', '00495A32'):
                g = copy.deepcopy(f); g[2]['records'][1]['helper'] = setter; self.atomic_error(g)

    def test_17_missing_remainder_after_both_stores_is_atomic(self):
        for source, unknown in itertools.product(SOURCES, (False, True)):
            f = target_fixture(source)
            def effect(stage, after, context):
                if unknown and stage == 'event9-presentation': row(after, 0, 'troops')['vtableAddress'] = 0
                after['rngState'] = (after['rngState'] + 0x12345) & 0xFFFFFFFF
                after['data']['nested']['value'] += 100
                return 2
            Oracle(f, effect=effect).run()
            f[2]['records'].pop()
            self.atomic_error(f)
            for stale_helper in ('004BA442/event9-reaction-remainder', '004BA432/event9-reaction'):
                g = copy.deepcopy(f); g[2]['records'].append(copy.deepcopy(g[2]['records'][-1]))
                g[2]['records'][-1]['helper'] = stale_helper
                self.atomic_error(g)

    def test_18_unknown_policy_reject_at_new_reset_or_remainder_is_atomic(self):
        for source in SOURCES:
            f = target_fixture(source); f[3]['unknownEffects'] = 'reject'
            self.atomic_defer(f, 'unresolved-effect:004BA411/event9-presentation')
            f = fixture(source=source); f[3]['unknownEffects'] = 'reject'
            trace = self.atomic_defer(f, 'unresolved-effect:' + REMAINDER)
            self.assertEqual(raw44(trace['observedEffects'][0]['before']), -1)
            self.assertEqual(raw_pair(trace['observedEffects'][0]['before']), (0xFFFFFFFF, 0))
            # Reject policy cannot skip earlier virtual boundaries. An observed
            #presentation with reject switched on must reject at that earlier
            #boundary, even if a later reset08 record exists.
            f = target_fixture(source)
            def effect(stage, after, context):
                if stage == 'event9-presentation': row(after, 0, 'troops')['vtableAddress'] = 0
                return 0
            Oracle(f, effect=effect).run(); f[3]['unknownEffects'] = 'reject'
            self.atomic_defer(f, 'unresolved-effect:004BA411/event9-presentation')

    def test_19_policy_command_domain_and_no_general_setters(self):
        for source in SOURCES:
            for key in ('event9TroopResetDomain', 'event9ForceResetDomain', 'event9PresentationDomain',
                        'event9SelectionDomain', 'event9EventMemoryDomain', 'frameProfile'):
                for value in (None, '', 'unsupported', True):
                    f = fixture(source=source); f[3][key] = value; self.atomic_error(f)
                f = fixture(source=source); del f[3][key]; self.atomic_error(f)
            for where in (0,1,2,3):
                f = fixture(source=source); f[where]['unrecognized'] = 1; self.atomic_error(f)
            for entry in ('troop-setter', 'troop-reset', '004AD2B0', '00495A20', '00495A32'):
                f = fixture(source=source); f[1]['entry'] = entry; self.atomic_error(f)
            for field in ('raw44Argument', 'troopPointer', 'savedForcePointer', 'managerIdentity'):
                f = fixture(source=source); f[1]['args'][field] = 0; self.atomic_error(f)
            for value in (None, {}, (), 'records'):
                f = fixture(source=source); f[2]['records'] = value; self.atomic_error(f)
            f = fixture(source=source); f[0]['frame']['mutableEventMemory'] = {'id':9}; self.atomic_error(f)

    def test_20_revision_idempotence_conflict_exhaustion_and_exact_replay(self):
        f = target_fixture(); trace = self.check_oracle(f)
        g = copy.deepcopy(f); g[0] = copy.deepcopy(trace['after'])
        replayed = run(g)
        self.assertTrue(replayed['replayed']); self.assertEqual(replayed['after'], g[0])
        for where in ('policy', 'observation', 'command'):
            h = copy.deepcopy(g)
            if where == 'policy': h[3]['id'] += '-different'
            elif where == 'observation': h[2]['provenance'] += '-different'
            else: h[1]['args']['argument'] += 1
            self.atomic_defer(h, 'replay-payload-conflict')
        f[1]['expectedRevision'] += 1; self.atomic_defer(f, 'revision-conflict')
        f[0]['revision'] = I32_MAX; f[1]['expectedRevision'] = I32_MAX; self.atomic_error(f)
        for field in ('after', 'steps', 'evidence', 'profileId', 'frameProfileId', 'observedEffects', 'rng'):
            for rehash in (False, True):
                altered = copy.deepcopy(trace)
                if field == 'after': row(altered[field]['frame'], 0, 'troops')['raw44'] = 46
                elif field == 'steps': next(s for s in altered[field] if s['helper'] == RESET_HELPERS[2])['byteWidth'] = 1
                elif field == 'evidence': altered[field]['stockVerified'] = True
                elif field == 'observedEffects': altered[field][-1]['helper'] = '004BA442/event9-reaction-remainder'
                elif field == 'rng': altered[field]['observedCalls'] += 1
                else: altered[field] = 'wrong'
                if rehash: altered['traceHash'] = digest({k:v for k,v in altered.items() if k != 'traceHash'})
                with self.assertRaises(ValueError): m.replay_native_event9_troop_reset(altered)
                type(self).rejection_cases += 1

    def test_21_saved_cursor_survives_troop_callback_and_remainder_mutations(self):
        for source, mutate_at in itertools.product(SOURCES, ('event9-presentation', 'troop08', 'event9-reaction-remainder')):
            f = target_fixture(source); w = f[0]['frame']
            w['troopListNodes'] = [node(17,29), node(29,55), node(55)]
            set_force(w,46)
            def effect(stage, after, context):
                if mutate_at == 'troop08' and stage == 'event9-presentation':
                    row(after,0,'troops')['vtableAddress'] = 0
                matching = stage == mutate_at or (mutate_at == 'troop08' and context['args'].get('site') == '004AD2B6')
                if matching and any(r['id'] == 17 for r in after['troopListNodes']):
                    after['troopListNodes'] = [node(29,None,999), node(55)]
                    after['troopListHead'] = 55
                    row(after,999,'troops').update(raw44=46,rawOrder2C=1,rawTarget30=0)
                return 0
            trace = self.check_oracle(f,effect=effect)
            self.assertEqual(selected_troops(trace),[0,999])
            self.assertEqual([s['currentNodeId'] for s in trace['steps'] if s['helper'] == '004922C0/advance'],[17,29])
            self.assertEqual([r['args']['savedNextNodeId'] for r in remainders(trace)],[29,None])
            self.assertEqual([raw44(trace['after']['frame'],tid) for tid in (0,999)],[-1,-1])

    def test_22_revisit_observes_reset_until_remainder_explicitly_rearms(self):
        for source, rearm in itertools.product(SOURCES,(False,True)):
            f = target_fixture(source); w = f[0]['frame']; w['troopListNodes'] = [node(17,17)]
            set_force(w,46,rawDword94=44,rawByte98=55)
            def effect(stage,after,context):
                if stage == 'event9-reaction-remainder':
                    row(after,17,'troopListNodes')['nextNodeId'] = None
                    if rearm: row(after,0,'troops')['raw44'] = 46
                return 0
            trace = self.check_oracle(f,effect=effect)
            self.assertEqual([r['args']['savedForcePointer'] for r in remainders(trace)],
                [pointer('forces',0),pointer('forces',46)] if rearm else [pointer('forces',0)])
            self.assertEqual([r['args']['savedNextNodeId'] for r in remainders(trace)],[17,None] if rearm else [17])
            self.assertEqual(len([s for s in trace['steps'] if s['helper']=='004922C0/advance']),2)
            self.assertEqual([r['args']['event'] for r in remainders(trace)],[f[1]['args']] * (2 if rearm else 1))

    def test_23_full_rng_order_presentation_force08_troop08_remainder(self):
        for source,count in itertools.product(SOURCES,(0,2,None)):
            f = target_fixture(source)
            def effect(stage,after,context):
                if stage == 'event9-presentation':
                    set_force(after,vtableAddress=0,rawDword94=77,rawByte98=88)
                    row(after,0,'troops')['vtableAddress'] = 0
                    after['rngState'] = 0x12345678
                    return 3
                if context['args'].get('site') == '004B5026':
                    self.assertEqual(raw44(after),0)
                    after['rngState'] = 0x23456789
                    return dict(result=True,count=4)
                if context['args'].get('site') == '004AD2B6':
                    self.assertEqual(raw_pair(after),(0xFFFFFFFF,0))
                    self.assertEqual(after['rngState'],0x23456789)
                    after['rngState'] = 0x3456789A
                    return dict(result=True,count=5)
                if stage == 'event9-reaction-remainder':
                    self.assertEqual(raw44(after),-1)
                    self.assertEqual(after['rngState'],0x3456789A)
                    row(after,0,'troops')['raw44'] = 46
                    after['rngState'] = 0x456789AB
                    return count
                return 0
            trace = self.check_oracle(f,effect=effect)
            self.assertEqual([r['helper'] for r in trace['observedEffects']],
                ['004BA411/event9-presentation',UNKNOWN,UNKNOWN,REMAINDER])
            self.assertEqual(virtual_sites(trace),['004B5026','004AD2B6'])
            self.assertEqual(raw44(trace['after']['frame']),46)
            self.assertEqual(trace['rng']['observedCalls'],None if count is None else 12+count)
            self.assertEqual(trace['rng']['localCalls'],0)
            self.assertEqual(trace['rng']['finalState'],0x456789AB)

    def test_24_node_and_native_guards_after_partial_reset_are_atomic(self):
        for source in SOURCES:
            f = target_fixture(source); f[0]['frame']['troopListNodes'] = [node(17,29),node(29,17,None)]
            f[3]['event9NodeLimit'] = 3
            with self.assertRaisesRegex(ValueError,'oracle node guard reached'): Oracle(f).run()
            trace = self.atomic_defer(f,'engine-guard-event9-node-budget')
            self.assertEqual(len(remainders(trace)),1)
            self.assertEqual(raw44(remainders(trace)[0]['before']),-1)
            g = target_fixture(source); g[0]['frame']['troopListNodes'] = [node(17,29),node(29,None,999)]
            Oracle(g).run()
            g[2]['records'] = g[2]['records'][:2]
            g[2]['records'][-1]['after']['troopListNodes'] = [node(17)]
            self.atomic_error(g)
        f = target_fixture(); Oracle(f).run()
        # Budget calibration alone reads production call count. Semantic frames
        #and binding expectations never depend on this measurement.
        limit = run(f)['nativeCalls']
        for value in (1,limit-1):
            f[3]['engineGuard']['maxNativeCalls'] = value
            self.atomic_defer(f,'engine-guard-native-call-budget')
        f[3]['engineGuard']['maxNativeCalls'] = limit
        self.assertTrue(run(f)['accepted'])

    def test_25_all_predecessor_entry_apis_and_frames_remain_unupgraded(self):
        for source,entry in itertools.product(SOURCES,INHERITED_ENTRIES):
            old = force_fixture(entry,source); expected = ForceOracle(old).run()
            trace = previous.project_native_event9_force_reset(*old)
            self.assertTrue(trace['accepted']); self.assertEqual(trace['after']['frame'],expected.w)
            self.assertEqual(trace,previous.replay_native_event9_force_reset(trace))
            self.assertFalse(any(s['helper'] in RESET_HELPERS for s in trace['steps']))
            self.assertFalse(any(r['helper']==REMAINDER for r in trace['observedEffects']))
            self.atomic_error(old)
            with self.assertRaises(ValueError): previous.project_native_event9_force_reset(*fixture(entry,source))
            type(self).rejection_cases += 1
        for source in SOURCES:
            old = force_fixture(source=source); ForceOracle(old).run()
            trace = previous.project_native_event9_force_reset(*old)
            self.assertEqual(raw44(trace['after']['frame']),0)
            self.assertEqual([r['helper'] for r in trace['observedEffects']],['004BA442/event9-reaction-remainder'])

    def test_26_oracle_independent_with_all_production_code_poisoned(self):
        names = ('native_event9_troop_reset_profile','native_event9_force_reset_profile',
            'native_event9_presentation_profile','native_event9_selection_profile',
            'native_live_position_profile','native_troop_membership_profile',
            'native_tail_distance_profile','generic_facility_profile','live_zero_refund_profile',
            'officer_relocation_profile','base_ownership_events_profile','empty_legion_redistribution_profile',
            'return_route_target_force_profile','native_roster_sort_profile','recursive_officer_return_profile')
        primitive_names = ('native_event9_troop_reset_primitives','native_event9_force_reset_primitives',
            'native_event9_presentation_primitives','native_event9_selection_primitives',
            'native_live_position_primitives','native_troop_membership_primitives','native_tail_distance_primitives')
        frame_names = ('native_event9_troop_reset_frame','native_event9_force_reset_frame',
            'native_event9_presentation_frame','native_event9_selection_frame','native_live_position_frame',
            'native_troop_membership_frame','recursive_return_frame','base_ownership_frame')
        f = target_fixture()
        def effect(stage,after,context):
            if stage=='event9-presentation': row(after,0,'troops')['vtableAddress']=0
            return 0
        with ExitStack() as stack:
            for name in names+frame_names:
                module=importlib.import_module(name)
                for attr in dir(module):
                    if attr.startswith(('project_','validate')) or attr in ('_Planner','frame_domain'):
                        stack.enter_context(patch.object(module,attr,side_effect=AssertionError('production oracle dependency')))
            for name in primitive_names:
                module=importlib.import_module(name)
                for cls in vars(module).values():
                    if not isinstance(cls,type) or cls.__module__!=name: continue
                    for attr,value in vars(cls).items():
                        if callable(value): stack.enter_context(patch.object(cls,attr,side_effect=AssertionError('production primitive oracle dependency')))
            expected=Oracle(f,effect=effect).run()
        self.assertEqual(expected.selected,[0])
        self.assertEqual([r['helper'] for r in expected.records],['004BA411/event9-presentation',UNKNOWN,REMAINDER])
        self.assertEqual(raw44(expected.w),-1)

    def test_27_evidence_is_explicitly_bounded(self):
        trace=self.check_oracle(target_fixture()); evidence=trace['evidence']
        for key in ('sourceLocalOnly','event9SelectionPreludeNative','event9LiveNodeTraversal',
                    'event9SavedNextBeforeCallback','event9PresentationDecisionNative',
                    'event9PresentationCombinedObserved','event9ForceResetNative','event9ForceRaw94Dword',
                    'event9ForceRaw98Byte','event9TroopResetNative','event9TroopRaw44Dword',
                    'event9TroopRaw44SignedStorage','event9SavedForceIdentityPreserved','event9ReactionRemainderObserved'):
            self.assertTrue(evidence[key])
        for key in ('stockVerified','vanillaVerified','event9ReactionSuffixObserved',
                    'event9GeneralForceSettersExposed','event9GeneralTroopSettersExposed',
                    'completeGameTransaction','canonicalCaptureContinuationExecuted','presentationSegmentsExecuted',
                    'rulerCaptureExecuted','event9TailExecuted','machineCodeExecuted',
                    'event9MutableEventMemorySupported','unknownForceDispatchOutsideEvent9Supported',
                    'callbacksAssumedNoninterfering','observationAuthenticityVerified','engineGuardIsOriginalRule'):
            self.assertFalse(evidence[key])
        self.assertEqual(evidence['event9ForceResetStart'],'004BA432')
        self.assertEqual(evidence['event9ForceResetEndExclusive'],'004BA442')
        self.assertEqual(evidence['event9TroopResetStart'],'004BA442')
        self.assertEqual(evidence['event9TroopResetEndExclusive'],'004BA44C')
        self.assertEqual(evidence['event9ReactionStart'],'004BA44C')
        self.assertEqual(evidence['event9EventMemoryDomain'],'immutable-command-event-v1')
        self.assertFalse(trace['rng']['globalConsumptionVerified'])

    def test_28_recursive_event_and_ownership_composition(self):
        for source in SOURCES:
            f=fixture('event',source)
            f[1]['args']=dict(id=9,subjectType='building',subjectId=0,argument=417)
            w=f[0]['frame']; row(w).update(missionId=0,homeBaseId=0)
            w.update(observerPresent=True,troopListNodes=[node(17),node(29,None,999)])
            row(w,999,'troops').update(rawOrder2C=1,rawTarget30=0)
            set_force(w,playerIndex=0)
            def effect(stage,after,context):
                if stage=='ownership-handler': after['troopListHead']=29
                elif stage=='event9-presentation': after['troopListHead']=None
                elif stage=='event-observer':
                    self.assertEqual(raw_pair(after),(0xFFFFFFFF,0))
                    self.assertEqual(raw44(after,999),-1)
                    after['troopListNodes']=[]
                return 0
            trace=self.check_oracle(f,effect=effect)
            self.assertEqual(selected_troops(trace),[999])
            self.assertEqual([r['helper'] for r in trace['observedEffects']],
                ['005BBE30','004BA411/event9-presentation',REMAINDER,'observer.virtual1B4'])
            self.assertEqual(remainders(trace)[0]['callStack'][0]['helper'],'004BBAA0')
            f=fixture('base-ownership',source); f[0]['frame']['activePersonIds']=[]
            f[1]['args']['requestedLegionId']=-1
            self.assertEqual(selected_troops(self.check_oracle(f)),[0])

    def test_29_non_event9_empty_unsupported_and_unknown_force_paths(self):
        for source,eid in itertools.product(SOURCES,(8,9,10,14)):
            f=target_fixture(source); f[1]['args']['id']=eid
            f[0]['frame']['troopListHead']=None if eid==9 else 0xFFFFFFFF
            trace=self.check_oracle(f)
            self.assertEqual(trace['observedEffects'],[])
            self.assertFalse(any(s['helper'] in RESET_HELPERS for s in trace['steps']))
        for source,eid in itertools.product(SOURCES,(16,18)):
            f=target_fixture(source); f[1]['args']['id']=eid; self.atomic_error(f)
        for source,entry in itertools.product(SOURCES,('role-sort','capacity')):
            f=fixture(entry,source); set_force(f[0]['frame'],vtableAddress=0)
            self.atomic_defer(f,'unsupported-noncanonical-force-outside-event9-presentation')
        for source,entry in itertools.product(SOURCES,('position-pointer','force-legion','target-force')):
            f=fixture(entry,source); set_force(f[0]['frame'],vtableAddress=0); self.check_oracle(f)

    def test_30_seeded_mutable_troop_force_and_live_node_sequences(self):
        rand=random.Random(0x4AD2B0)
        for index in range(72):
            f=target_fixture(SOURCES[index%2]); w=f[0]['frame']
            ids=[901,11,700,53]; rand.shuffle(ids); w['troopListHead']=ids[0]
            w['troopListNodes']=[node(nid,ids[i+1] if i+1<len(ids) else None,
                rand.choice((0,999,None))) for i,nid in enumerate(ids)]
            rand.shuffle(w['troopListNodes'])
            for fid in (0,46):
                set_force(w,fid,rulerId=rand.choice((-1,0,1099,1100)),
                    playerIndex=rand.choice((-1,0,7,8)),vtableAddress=rand.choice((0,FORCE_VTABLE)),
                    rawDword94=rand.randrange(1<<32),rawByte98=rand.randrange(256))
            for tid in (0,999):
                row(w,tid,'troops').update(raw44=rand.choice((-1,0,46,47)),
                    rawOrder2C=rand.choice((0,1,4,6)),rawTarget30=0,
                    vtableAddress=rand.choice((0,VTABLE)))
            def effect(stage,after,context):
                if stage=='event9-unknown-virtual':
                    after['rngState']=(after['rngState']+0x12345)&0xFFFFFFFF
                    slot=context['args']['virtualSlot']
                    if slot==64:return dict(result=-1,count=1)
                    site=context['args']['site']
                    if site=='004B5026':
                        row(after,0,'troops').update(leaderId=7 if index%2 else -1,
                            vtableAddress=0 if index%3 else VTABLE)
                    if site=='004AD2B6':
                        tid=context['args']['pointer']['id']
                        replacement=dict(copy.deepcopy(row(after,tid,'troops')),
                            raw44=I32_MIN+index,leaderId=-1,
                            vtableAddress=VTABLE if index%2 else 0)
                        after['troops']=[replacement if r['id']==tid else copy.deepcopy(r) for r in after['troops']]
                    return dict(result=(context['index']+index)%3!=0,count=None if index%7==0 else 1)
                if stage=='event9-presentation':
                    row(after,context['args']['troopPointer']['id'],'troops')['vtableAddress']=0
                    after[FALLBACK]['positionX']+=1
                if stage=='event9-reaction-remainder':
                    after['data']['nested']['value']+=1
                    if index%3==0 and context['args']['savedNextNodeId'] is not None:
                        row(after,context['args']['savedNextNodeId'],'troopListNodes')['nextNodeId']=None
                return 0
            self.check_oracle(f,effect=effect,replay=index%8==0)

    def test_31_evolving_commits_reobserve_troop_storage_and_saved_force(self):
        f=target_fixture(); f[0]['frame']['troopListNodes']=[node(17,29),node(29,None,999)]
        set_force(f[0]['frame'],46)
        for turn in range(10):
            f[1].update(id='event9-troop-reset-evolving-'+str(turn),expectedRevision=turn)
            def effect(stage,after,context):
                if stage=='event9-presentation':
                    row(after,context['args']['troopPointer']['id'],'troops')['vtableAddress']=0
                if context['args'].get('site')=='004AD2B6':
                    tid=context['args']['pointer']['id']
                    row(after,tid,'troops').update(leaderId=-1,vtableAddress=VTABLE)
                    return dict(result=turn%3!=0,count=turn%2)
                if stage=='event9-reaction-remainder':
                    after[FALLBACK]['positionY']+=1
                    after['troopListHead']=29 if turn%2==0 else 17
                    for tid in (0,999):
                        row(after,tid,'troops').update(raw44=46 if turn%2 else 0,
                            leaderId=7,vtableAddress=0 if turn%2 else VTABLE)
                return 0
            trace=self.check_oracle(f,effect=effect)
            self.assertEqual(trace['after']['revision'],turn+1)
            f[0]=copy.deepcopy(trace['after'])

    def test_32_fresh_source_call_slice_and_complete_helper_setter(self):
        root=Path(__file__).resolve().parents[1]/'docs/sources/native_event9_troop_reset'
        expected={
            '004BA1D0':[('004BA442','6a ff'),('004BA444','56'),
                ('004BA445','8b cf'),('004BA447','e8 64 2e ff ff'),('004BA44C','8b ce')],
            '004AD2B0':[('004AD2B0','56'),('004AD2B1','8b 74 24 08'),
                ('004AD2B5','56'),('004AD2B6','e8 75 d3 fc ff'),
                ('004AD2BB','83 c4 04'),('004AD2BE','85 c0'),
                ('004AD2C0','74 0c'),('004AD2C2','8b 44 24 0c'),
                ('004AD2C6','50'),('004AD2C7','8b ce'),
                ('004AD2C9','e8 52 87 fe ff'),('004AD2CE','5e'),('004AD2CF','c2 08 00')],
            '00495A20':[('00495A20','8b 44 24 04'),('00495A24','83 f8 ff'),
                ('00495A27','74 09'),('00495A29','85 c0'),('00495A2B','7c 08'),
                ('00495A2D','83 f8 2e'),('00495A30','7f 03'),
                ('00495A32','89 41 44'),('00495A35','c2 04 00')]}
        raw_by_source={}
        for source,(function,instructions) in itertools.product(SOURCES,expected.items()):
            lines=(root/(source+'-'+function+'.asm.txt')).read_text().splitlines()
            actual={line[:8]:line[10:40].strip() for line in lines}
            for address,raw in instructions: self.assertEqual(actual[address],raw,(source,address))
            if function!='004BA1D0': self.assertEqual(len(lines),len(instructions))
            raw_by_source[(source,function)]=[actual[address] for address,_ in instructions]
        for function in expected:
            self.assertEqual(raw_by_source[('S1',function)],raw_by_source[('S2',function)])

    def test_33_semantic_mutations_killed_by_independent_expectations(self):
        import native_event9_troop_reset_primitives as primitive
        cls=primitive.NativeEvent9TroopResetPrimitives
        original=textwrap.dedent(inspect.getsource(cls.event9_troop_reset))
        variants={
            'wrong-signed-value':original.replace("['raw44'] = -1","['raw44'] = 46"),
            'unsigned-storage':original.replace("['raw44'] = -1","['raw44'] = 0xffffffff"),
            'wrong-width':original.replace('byteWidth=4','byteWidth=1'),
            'wrong-offset':original.replace('byteOffset=0x44','byteOffset=0x94'),
            'wrong-unsigned-bits':original.replace('unsignedBits=0xffffffff','unsignedBits=0xfffffffe'),
            'wrong-troop':original.replace("troop = copy.deepcopy(args['troopPointer'])","troop = dict(storage='troops', id=999)"),
            'reload-current-force':original.replace("force = copy.deepcopy(args['savedForcePointer'])",
                "force = dict(storage='forces', id=self.slot('troops', troop['id'])['raw44'])"),
            'second-leader-gate':original.replace('if passed:',"if passed and 0 <= self.slot('troops', troop['id'])['leaderId'] <= 1099:"),
            'second-vtable-gate':original.replace('if passed:',"if passed and self.slot('troops', troop['id'])['vtableAddress'] == 0x0079CC18:"),
            'second-validity':original.replace('if passed:',"if passed and self.event9_valid(troop, '004AD2B6'):"),
            'ignore-validity':original.replace('if passed:','if True:'),
            'skip-reset':original.replace('if passed:','if False:'),
            'old-remainder':original.replace(REMAINDER,'004BA442/event9-reaction-remainder'),
            'wrong-validity-site':original.replace("'004AD2B6'","'004BA2A8'"),
            'manager-read':original.replace('incomingEcxRead=False','incomingEcxRead=True'),
            'unbalanced-stack':original.replace('parameterStackNetBytes=0','parameterStackNetBytes=8'),
            'virtual-setter':original.replace("self.slot('troops', troop['id'])['raw44'] = -1",
                "self.event9_unknown_virtual(troop, 0x44, '004AD2C9')"),
            'premature-store':original.replace("passed = self.event9_valid(troop, '004AD2B6')",
                "self.slot('troops', troop['id'])['raw44'] = -1\n        passed = self.event9_valid(troop, '004AD2B6')"),
            'cached-pre-callback-storage':original.replace("passed = self.event9_valid(troop, '004AD2B6')",
                "cached = self.slot('troops', troop['id'])\n        passed = self.event9_valid(troop, '004AD2B6')")
                .replace("self.slot('troops', troop['id'])['raw44'] = -1","cached['raw44'] = -1"),
        }
        for name,mutant in variants.items():
            self.assertNotEqual(mutant,original,name)
            for source in SOURCES:
                f=target_fixture(source); w=f[0]['frame']
                set_force(w,1);set_force(w,46);row(w,0,'troops')['raw44']=1
                def effect(stage,after,context):
                    if stage=='event9-presentation':
                        row(after,0,'troops').update(raw44=46,vtableAddress=0)
                        row(after,17,'troopListNodes')['troopId']=999
                    if context['args'].get('site')=='004AD2B6':
                        replacement=dict(copy.deepcopy(row(after,0,'troops')),
                            raw44=47,leaderId=-1,vtableAddress=0)
                        after['troops']=[replacement if r['id']==0 else copy.deepcopy(r) for r in after['troops']]
                        return dict(result=name!='ignore-validity',count=0)
                    return 0
                expected=Oracle(f,effect=effect).run()
                # Baseline success on exactly the same independent fixture is
                #required before a mutant may count as killed.
                self.assert_model(expected,run(f))
                namespace={'copy':copy};exec(mutant,namespace)
                before=copy.deepcopy(f)
                with self.subTest(source=source,mutation=name),patch.object(cls,'event9_troop_reset',namespace['event9_troop_reset']):
                    with self.assertRaises((AssertionError,ValueError,RecursionError)):
                        self.assert_model(expected,run(f))
                self.assertEqual(f,before)
                type(self).mutation_cases+=1

    def test_34_force_reset_false_still_reaches_independent_troop_reset(self):
        for source, unknown, answer in itertools.product(SOURCES, (False, True), (False, True)):
            f = target_fixture(source)
            def effect(stage, after, context):
                if stage == 'event9-presentation':
                    set_force(after, vtableAddress=0 if unknown else FORCE_VTABLE,
                              rulerId=0 if answer else -1)
                if context['args'].get('site') == '004B5026':
                    return dict(result=answer, count=1)
                return 0
            trace = self.check_oracle(f, effect=effect)
            self.assertEqual(raw_pair(trace['after']['frame']),
                             (0xFFFFFFFF, 0) if answer else (0x89ABCDEF, 0xA5))
            self.assertEqual(raw44(trace['after']['frame']), -1)
            self.assertEqual(len([s for s in trace['steps'] if s['helper'] == RESET_HELPERS[2]]), 1)

    @classmethod
    def tearDownClass(cls):
        print('Independent troop-reset oracle coverage: %d accepted semantic cases; %d atomic rejection cases; %d killed production mutations' %
              (cls.oracle_cases,cls.rejection_cases,cls.mutation_cases))


if __name__=='__main__':
    unittest.main()
