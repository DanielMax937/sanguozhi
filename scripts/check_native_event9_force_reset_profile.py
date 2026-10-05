"""Independent raw-source oracle for the bounded saved-force reset.

Selection/presentation decisions inherit the predecessor's independent oracle.
The new 004BA432..442,004B5020,00481590/004815B0 execution and all expected
store frames/scopes are independently transcribed here from the fresh S1/S2
assembly. Expected values never call production planners, primitives, projectors
or frame validators. Full-frame effects and virtual results are synthetic inputs,
not executed-machine or stock-game evidence. No general setter API is introduced.
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

import native_event9_force_reset_profile as m
import native_event9_presentation_profile as previous
from check_native_event9_presentation_profile import (
    Oracle as PresentationOracle, fixture as presentation_fixture,
    INHERITED_ENTRIES as PRESENTATION_INHERITED, pointer, set_force, effects,
    presentations, virtual_sites, FORCE_VTABLE, VTABLE, I32_MIN, I32_MAX)
from check_native_event9_selection_profile import node
from check_native_live_position_profile import Oracle as PositionOracle, FALLBACK
from check_empty_legion_profile import set_legion
from check_recursive_officer_return_profile import row, digest

SOURCES = ('S1', 'S2')
PROFILE = 'source-idb-S1-S2-native-event9-force-reset-v1'
FRAME = 'source-idb-S1-S2-native-event9-force-reset-frame-v1'
DOMAIN = 'canonical-live-event9-force-reset-v1'
INHERITED_ENTRIES = PRESENTATION_INHERITED + ('event9-presentation',)
RESET_HELPERS = ('004BA43D/force-reset-call', '004B502E/force-reset-validity',
    '004815A2/raw94-store', '004815B4/raw98-store',
    '004BA442/force-reset-continuation')
REMAINDER = '004BA442/event9-reaction-remainder'
UNKNOWN = '004BA1D0/unknown-virtual'


def fixture(entry='event9-force-reset', source='S1', **kw):
    f = presentation_fixture('event9-presentation' if entry == 'event9-force-reset'
                             else entry, source, **kw)
    f[1].update(entry=entry, id='native-event9-force-reset-1')
    for force in f[0]['frame']['forces']:
        force.update(rawDword94=0x89ABCDEF, rawByte98=0xA5)
    f[3].update(id='native-event9-force-reset-observe-v1', frameProfile=FRAME,
                event9ForceResetDomain=DOMAIN)
    return f


def target_fixture(source='S1', **kw):
    f = fixture(source=source, **kw)
    row(f[0]['frame'], 0, 'troops').update(rawOrder2C=1, rawTarget30=0)
    set_force(f[0]['frame'], playerIndex=0)
    return f


def run(f):
    return m.project_native_event9_force_reset(*f)


def remainders(trace):
    return effects(trace, REMAINDER)


def selected_troops(trace):
    return [r['args']['troopPointer']['id'] for r in remainders(trace)]


def raw_pair(w, fid=0):
    force = row(w, fid, 'forces')
    return force['rawDword94'], force['rawByte98']


class Oracle(PresentationOracle):
    """Source order, independent raw writes, saved identities, and bindings."""
    def __init__(self, *args, **kw):
        super().__init__(*args, **kw)
        self.reset_steps = []

    def reset_step(self, helper, **details):
        self.reset_steps.append(dict(helper=helper, **copy.deepcopy(details),
            callStack=copy.deepcopy(self.stack), frame=copy.deepcopy(self.w)))

    def reset_storage(self, address):
        force = next((r for r in self.w['forces'] if r['id'] == address['id']), None)
        if force is None:
            raise ValueError('oracle reached unrepresented force storage')
        return force

    def presentation(self, arguments):
        # Same independent presentation transcript as the predecessor, except
        # its final opaque432..46C observation is replaced by reset +442..46C.
        saved_force = pointer('forces', arguments['raw44'])
        self.save(savedForcePointer=saved_force)
        enabled = self.player(arguments['troopPointer'], '004BA356')
        if not enabled:
            enabled = self.valid_pointer(saved_force, '004BA35E')
            if enabled:
                enabled = self.player(saved_force, '004BA372')
        self.gates.append((enabled, copy.deepcopy(saved_force)))
        bound = dict(copy.deepcopy(arguments), savedForcePointer=copy.deepcopy(saved_force))
        if enabled and arguments['event']['id'] == 9:
            if self.valid_pointer(arguments['targetPointer'], '004BA405'):
                PositionOracle.boundary(self, 'event9-presentation', 'effect',
                    '004BA411/event9-presentation', dict(bound, presentationArgs=dict(
                        messageId=8348, troopPointer=copy.deepcopy(arguments['troopPointer']),
                        targetPointer=copy.deepcopy(arguments['targetPointer']),
                        displayTroopPointer=copy.deepcopy(arguments['troopPointer']),
                        rawFlag=1, rawArgument=-1)))
        self.reset(bound)

    def reset(self, arguments):
        #432 reloads EDI(manager),436/438/43A push(0,-1,saved EBX).
        #004B5020 copies its first argument to ESI. Incoming ECX is not read.
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
                #481594's CMP -1 takes JE to4815A2; this caller cannot enter
                #the alternative signed0..46 branch. Store DWORD first, byte
                #second, resolving the saved ESI identity in current storage.
                self.reset_storage(address)['rawDword94'] = (1 << 32) - 1
                self.reset_step('004815A2/raw94-store', forcePointer=address,
                    byteOffset=148, byteWidth=4, value=4294967295,
                    signedArgument=-1, directStore=True)
                self.reset_storage(address)['rawByte98'] = 0
                self.reset_step('004815B4/raw98-store', forcePointer=address,
                    byteOffset=152, byteWidth=1, value=0, lowByteArgument=0,
                    directStore=True)
        #Both setter RET4s balance their own calls. Helper RET0C consumes the
        #three caller args. The helper scope has ended before remainder442.
        self.reset_step('004BA442/force-reset-continuation',
            savedForcePointer=address, managerIdentity=arguments['managerIdentity'],
            eventMemoryDomain='immutable-command-event-v1',
            parameterStackNetBytes=0, reactionRemainderObserved=True)
        PositionOracle.boundary(self, 'event9-reaction-remainder', 'effect',
                               REMAINDER, copy.deepcopy(arguments))

    def run(self):
        if self.f[1]['entry'] != 'event9-force-reset':
            return super().run()
        try:
            self.selection(self.f[1]['args'])
        finally:
            self.f[2]['records'] = copy.deepcopy(self.records)
        return self


def scalar_leaves(value, path=()):
    if isinstance(value, dict):
        for key, item in value.items():
            yield from scalar_leaves(item, path + (key,))
    elif isinstance(value, list):
        for i, item in enumerate(value):
            yield from scalar_leaves(item, path + (i,))
    else:
        yield path, value


def change_leaf(value, path, replacement):
    for key in path[:-1]:
        value = value[key]
    value[path[-1]] = replacement


def changed_scalar(value):
    if type(value) is bool:
        return not value
    if type(value) is int:
        return value + 1
    if value is None:
        return 1
    return value + '-misbound'


class NativeEvent9ForceResetTests(unittest.TestCase):
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
        self.assertEqual([s for s in trace['steps'] if s['helper'] in RESET_HELPERS], expected.reset_steps)
        self.assertEqual(selected_troops(trace), expected.selected)
        self.assertEqual([(s['currentNodeId'], s['savedNextNodeId'], s['troopPointer'])
            for s in trace['steps'] if s['helper'] == '004922C0/advance'], expected.selection_visits)
        self.assertEqual([(s['enabled'], s['savedForcePointer']) for s in trace['steps']
            if s['helper'] == '004BA37D/presentation-gate'], expected.gates)
        actual_force = []
        for s in trace['steps']:
            if s['helper'] == '00480FF0/event9-force-valid':
                actual_force.append(('valid', s['forcePointer'], s['rulerId'], s['passed'], s['site']))
            if s['helper'] == '00480FA0/event9-player':
                actual_force.append(('player', s['forcePointer'], s['playerIndex'], s['passed'], s['site']))
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
        if replay:
            self.assertEqual(trace, m.replay_native_event9_force_reset(json.loads(json.dumps(trace))))
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
        self.assertEqual(trace, m.replay_native_event9_force_reset(trace))
        type(self).rejection_cases += 1
        return trace

    def test_01_all_twenty_three_inherited_and_new_entries_both_sources(self):
        self.assertEqual(len(INHERITED_ENTRIES), 23)
        for source, entry in itertools.product(SOURCES, INHERITED_ENTRIES + ('event9-force-reset',)):
            with self.subTest(source=source, entry=entry):
                self.check_oracle(fixture(entry, source))

    def test_02_exact_order_width_intermediate_frames_and_call_scopes(self):
        for source, entry in itertools.product(SOURCES, ('event9-selection', 'event9-presentation', 'event9-force-reset')):
            trace = self.check_oracle(target_fixture(source, entry=entry))
            self.assertEqual([r['helper'] for r in trace['observedEffects']], ['004BA411/event9-presentation', REMAINDER])
            stores = [s for s in trace['steps'] if s['helper'] in RESET_HELPERS[2:4]]
            self.assertEqual([s['byteWidth'] for s in stores], [4, 1])
            self.assertEqual(raw_pair(stores[0]['frame']), (0xFFFFFFFF, 0xA5))
            self.assertEqual(raw_pair(stores[1]['frame']), (0xFFFFFFFF, 0))
            for store in stores:
                self.assertEqual(store['callStack'][-1], dict(helper='004B5020', locals=dict(
                    forcePointer=pointer('forces', 0), raw94Argument=-1, raw98Argument=0, site='004BA43D')))
            self.assertEqual(presentations(trace)[0]['args']['presentationArgs'], dict(
                messageId=8348, troopPointer=pointer('troops', 0), targetPointer=pointer('buildings', 0),
                displayTroopPointer=pointer('troops', 0), rawFlag=1, rawArgument=-1))
            self.assertEqual(raw_pair(presentations(trace)[0]['after']), (0x89ABCDEF, 0xA5))
            self.assertEqual(raw_pair(remainders(trace)[0]['before']), (0xFFFFFFFF, 0))

    def test_03_canonical_signed_ruler_edges_and_invalid_skip_both_stores(self):
        for source, ruler in itertools.product(SOURCES, (I32_MIN, -1, 0, 1, 1099, 1100, I32_MAX)):
            f = target_fixture(source); set_force(f[0]['frame'], rulerId=ruler)
            trace = self.check_oracle(f)
            valid = 0 <= ruler <= 1099
            self.assertEqual(raw_pair(trace['after']['frame']), (0xFFFFFFFF, 0) if valid else (0x89ABCDEF, 0xA5))
            self.assertEqual(len([s for s in trace['steps'] if s['helper'] == '004815A2/raw94-store']), int(valid))
            self.assertEqual(len(remainders(trace)), 1)

    def test_04_existing_raw_storage_accepts_uint32_and_uint8_extremes(self):
        for source, word, byte in itertools.product(SOURCES,
                (0, 1, 46, 47, 0x7FFFFFFF, 0x80000000, 0xFFFFFFFE, 0xFFFFFFFF), (0, 1, 127, 255)):
            f = fixture(source=source)
            set_force(f[0]['frame'], rawDword94=word, rawByte98=byte)
            trace = self.check_oracle(f, replay=False)
            self.assertEqual(raw_pair(trace['after']['frame']), (0xFFFFFFFF, 0))
        for source in SOURCES:
            f = fixture(source=source); set_force(f[0]['frame'], rulerId=-1,
                rawDword94=0xFFFFFFFF, rawByte98=255)
            self.assertEqual(raw_pair(self.check_oracle(f)['after']['frame']), (0xFFFFFFFF, 255))

    def test_05_raw44_boundaries_and_force46(self):
        for source, raw in itertools.product(SOURCES, (I32_MIN, -1, 0, 1, 46, 47, I32_MAX)):
            f = target_fixture(source)
            set_force(f[0]['frame'], 1); set_force(f[0]['frame'], 46)
            row(f[0]['frame'], 0, 'troops')['raw44'] = raw
            trace = self.check_oracle(f)
            self.assertEqual(len(remainders(trace)), int(0 <= raw <= 46))
            if 0 <= raw <= 46:
                self.assertEqual(raw_pair(trace['after']['frame'], raw), (0xFFFFFFFF, 0))

    def test_06_no_presentation_null_invalid_and_nonplayer_still_reset(self):
        for source, variant in itertools.product(SOURCES, ('null', 'invalid-target', 'nonplayer')):
            f = target_fixture(source)
            if variant == 'null': row(f[0]['frame'], 0, 'troops')['rawOrder2C'] = 0
            elif variant == 'invalid-target': row(f[0]['frame'], 0, 'buildings').update(kind=-1, valid=False)
            else: set_force(f[0]['frame'], playerIndex=-1)
            trace = self.check_oracle(f)
            self.assertEqual(presentations(trace), [])
            self.assertEqual(raw_pair(trace['after']['frame']), (0xFFFFFFFF, 0))

    def test_07_saved_force_survives_presentation_owner_and_raw44_changes(self):
        for source in SOURCES:
            f = target_fixture(source); w = f[0]['frame']
            set_force(w, 1, rawDword94=17, rawByte98=19)
            set_force(w, 46, rawDword94=23, rawByte98=29)
            row(w, 0, 'troops')['raw44'] = 1
            def effect(stage, after, context):
                if stage == 'event9-presentation':
                    row(after, 0, 'troops').update(raw44=46, rawTarget30=1)
                    set_legion(row(after, 0, 'legions'), forceId=46)
                    after['data']['nested']['value'] = 411
                    after['rngState'] = 0xF1234567
                    return 3
                return 0
            trace = self.check_oracle(f, effect=effect)
            self.assertEqual(raw_pair(trace['after']['frame'], 0), (0x89ABCDEF, 0xA5))
            self.assertEqual(raw_pair(trace['after']['frame'], 1), (0xFFFFFFFF, 0))
            self.assertEqual(raw_pair(trace['after']['frame'], 46), (23, 29))
            self.assertEqual(remainders(trace)[0]['args']['savedForcePointer'], pointer('forces', 1))
            self.assertEqual(remainders(trace)[0]['args']['targetPointer'], pointer('buildings', 0))

    def test_08_presentation_changes_canonical_ruler_before_reset_validity(self):
        for source, before, after_ruler in itertools.product(SOURCES, (-1, 0), (-1, 0, 1099, 1100)):
            f = target_fixture(source); set_force(f[0]['frame'], 1, rulerId=before)
            row(f[0]['frame'], 0, 'troops')['raw44'] = 1
            def effect(stage, after, context):
                if stage == 'event9-presentation':
                    set_force(after, 1, rulerId=after_ruler, rawDword94=555, rawByte98=222)
                return 0
            trace = self.check_oracle(f, effect=effect)
            self.assertEqual(raw_pair(trace['after']['frame'], 1), (0xFFFFFFFF, 0)
                if 0 <= after_ruler <= 1099 else (555, 222))

    def test_09_presentation_changes_force_vtable_then_observes_reset08(self):
        for source, answer in itertools.product(SOURCES, (True, False)):
            f = target_fixture(source)
            def effect(stage, after, context):
                if stage == 'event9-presentation':
                    set_force(after, vtableAddress=0xFFFFFFFF, rulerId=-1)
                if context['args'].get('site') == '004B5026':
                    after['rngState'] = 0xFEDCBA98
                    return dict(result=answer, count=7)
                return 0
            trace = self.check_oracle(f, effect=effect)
            self.assertEqual(virtual_sites(trace), ['004B5026'])
            self.assertEqual(raw_pair(trace['after']['frame']), (0xFFFFFFFF, 0) if answer else (0x89ABCDEF, 0xA5))
            record = effects(trace, UNKNOWN)[0]
            self.assertEqual(record['callStack'][-1], dict(helper='004B5020', locals=dict(
                forcePointer=pointer('forces', 0), raw94Argument=-1, raw98Argument=0, site='004BA43D')))
            self.assertEqual(record['args'], dict(pointer=pointer('forces', 0), virtualSlot=8, site='004B5026'))

    def test_10_unknown08_false_preserves_all_callback_mutations(self):
        for source, count in itertools.product(SOURCES, (0, 5, None)):
            f = target_fixture(source); set_force(f[0]['frame'], 1, vtableAddress=0)
            row(f[0]['frame'], 0, 'troops')['raw44'] = 1
            def effect(stage, after, context):
                if context['args'].get('site') == '004B5026':
                    set_force(after, 1, vtableAddress=FORCE_VTABLE, rulerId=0,
                              rawDword94=0x80000001, rawByte98=255)
                    row(after, 0, 'troops').update(raw44=47, leaderId=-1)
                    after[FALLBACK].update(positionX=-32768, positionY=32767)
                    after['data']['nested']['value'] = 5026
                    after['rngState'] = 0xABCDEF12
                    after['troopListHead'] = None
                    return dict(result=False, count=count)
                return 0
            trace = self.check_oracle(f, effect=effect)
            self.assertEqual(raw_pair(trace['after']['frame'], 1), (0x80000001, 255))
            self.assertEqual(remainders(trace)[0]['before'], effects(trace, UNKNOWN)[0]['after'])
            self.assertFalse(any(s['helper'] in RESET_HELPERS[2:4] for s in trace['steps']))

    def test_11_unknown08_true_never_revalidates_replacement_ruler_or_vtable(self):
        for source, vtable, ruler, count in itertools.product(SOURCES,
                (0, FORCE_VTABLE, 0xFFFFFFFF), (-1, 1100), (0, None)):
            f = target_fixture(source)
            set_force(f[0]['frame'], 1, vtableAddress=0, data={'note': 'original'})
            row(f[0]['frame'], 0, 'troops')['raw44'] = 1
            def effect(stage, after, context):
                if context['args'].get('site') == '004B5026':
                    original = row(after, 1, 'forces')
                    replacement = dict(copy.deepcopy(original), vtableAddress=vtable,
                        rulerId=ruler, valid=False, rawDword94=123, rawByte98=231,
                        data=dict(original['data'], note='replacement'))
                    after['forces'] = [replacement if r['id'] == 1 else copy.deepcopy(r) for r in after['forces']]
                    row(after, 0, 'troops')['raw44'] = 0
                    after['rngState'] = 0xFFFFFFFF
                    return dict(result=True, count=count)
                return 0
            trace = self.check_oracle(f, effect=effect, replay=False)
            self.assertEqual(virtual_sites(trace), ['004B5026'])
            self.assertEqual(raw_pair(trace['after']['frame'], 1), (0xFFFFFFFF, 0))
            self.assertEqual(row(trace['after']['frame'], 1, 'forces')['data']['note'], 'replacement')
            self.assertEqual(raw_pair(trace['after']['frame'], 0), (0x89ABCDEF, 0xA5))

    def test_12_missing_storage_and_removed_callback_rows_are_atomic_errors(self):
        for source in SOURCES:
            f = target_fixture(source); row(f[0]['frame'], 0, 'troops')['raw44'] = 46
            with self.assertRaisesRegex(ValueError, 'unrepresented force storage'):
                Oracle(f).run()
            self.assertEqual(len(f[2]['records']), 1)
            self.atomic_error(f)
            for answer in (True, False):
                g = target_fixture(source); set_force(g[0]['frame'], 1, vtableAddress=0)
                row(g[0]['frame'], 0, 'troops')['raw44'] = 1
                def effect(stage, after, context):
                    if context['args'].get('site') == '004B5026':
                        after['forces'] = [r for r in after['forces'] if r['id'] != 1]
                        return dict(result=answer, count=1)
                    return 0
                if answer:
                    with self.assertRaisesRegex(ValueError, 'unrepresented force storage'):
                        Oracle(g, effect=effect).run()
                else:
                    Oracle(g, effect=effect).run()
                self.atomic_error(g)

    def test_13_presentation_reset_remainder_rng_and_frame_order(self):
        for source, count in itertools.product(SOURCES, (0, 2, None)):
            f = target_fixture(source)
            def effect(stage, after, context):
                if stage == 'event9-presentation':
                    set_force(after, rawDword94=77, rawByte98=88)
                    after['rngState'] = 0x12345678
                    after['data']['nested']['value'] = 411
                    return 3
                if stage == 'event9-reaction-remainder':
                    self.assertEqual(raw_pair(after), (0xFFFFFFFF, 0))
                    self.assertEqual(after['rngState'], 0x12345678)
                    self.assertEqual(after['data']['nested']['value'], 411)
                    set_force(after, rawDword94=0xFFFFFFFF - 1, rawByte98=255)
                    after['rngState'] = 0x87654321
                    after['data']['nested']['value'] = 442
                    return count
                return 0
            trace = self.check_oracle(f, effect=effect)
            self.assertEqual(raw_pair(trace['after']['frame']), (0xFFFFFFFE, 255))
            self.assertEqual(trace['rng']['finalState'], 0x87654321)
            self.assertEqual(trace['rng']['observedCalls'], None if count is None else count + 3)
            self.assertEqual(trace['rng']['localCalls'], 0)

    def test_14_saved_cursor_survives_presentation_reset_and_remainder_mutations(self):
        for source, stage_to_mutate in itertools.product(SOURCES,
                ('event9-presentation', 'reset08', 'event9-reaction-remainder')):
            f = target_fixture(source); w = f[0]['frame']
            w['troopListNodes'] = [node(17, 29), node(29, 55), node(55)]
            set_force(w, 46)
            if stage_to_mutate == 'reset08': set_force(w, 1, vtableAddress=0); row(w, 0, 'troops')['raw44'] = 1
            def effect(stage, after, context):
                matching = stage == stage_to_mutate or (stage_to_mutate == 'reset08' and context['args'].get('site') == '004B5026')
                if matching and any(r['id'] == 17 for r in after['troopListNodes']):
                    after['troopListNodes'] = [node(29, None, 999), node(55)]
                    after['troopListHead'] = 55
                    row(after, 999, 'troops').update(raw44=46, rawOrder2C=1, rawTarget30=0)
                    row(after, 0, 'troops')['raw44'] = 47
                return 0
            trace = self.check_oracle(f, effect=effect)
            self.assertEqual(selected_troops(trace), [0, 999])
            self.assertEqual([s['currentNodeId'] for s in trace['steps'] if s['helper'] == '004922C0/advance'], [17, 29])
            self.assertEqual([r['args']['savedNextNodeId'] for r in remainders(trace)], [29, None])
            self.assertEqual(raw_pair(trace['after']['frame'], 46), (0xFFFFFFFF, 0))

    def test_15_saved_force_and_event_locals_remain_bound_across_revisits(self):
        for source in SOURCES:
            f = target_fixture(source); w = f[0]['frame']
            w['troopListNodes'] = [node(17, 17)]
            set_force(w, 46, rawDword94=44, rawByte98=55)
            def effect(stage, after, context):
                if stage == 'event9-reaction-remainder':
                    row(after, 17, 'troopListNodes')['nextNodeId'] = None
                    row(after, 0, 'troops')['raw44'] = 46
                return 0
            trace = self.check_oracle(f, effect=effect)
            self.assertEqual([r['args']['savedForcePointer'] for r in remainders(trace)], [pointer('forces', 0), pointer('forces', 46)])
            self.assertEqual([r['args']['savedNextNodeId'] for r in remainders(trace)], [17, None])
            self.assertEqual([r['args']['event'] for r in remainders(trace)], [f[1]['args'], f[1]['args']])

    def test_16_every_observation_argument_and_scope_leaf_is_exactly_bound(self):
        for source in SOURCES:
            f = target_fixture(source); set_force(f[0]['frame'], 1, vtableAddress=0)
            row(f[0]['frame'], 0, 'troops')['raw44'] = 1
            Oracle(f).run()
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

    def test_17_boundary_record_order_identity_and_entire_before_frame(self):
        for source in SOURCES:
            f = target_fixture(source); set_force(f[0]['frame'], 1, vtableAddress=0)
            row(f[0]['frame'], 0, 'troops')['raw44'] = 1
            Oracle(f).run()
            for index in range(3):
                for defect in ('index', 'source', 'kind', 'helper', 'missing', 'extra', 'reverse',
                    'before-rng', 'before-data', 'before-raw94', 'before-raw98', 'before-vtable',
                    'before-ruler', 'before-fallback', 'before-head', 'before-node', 'after-domain',
                    'missing-after', 'missing-before', 'unknown-field', 'rng-kind', 'rng-count'):
                    with self.subTest(source=source, record=index, defect=defect):
                        g = copy.deepcopy(f); rs = g[2]['records']; record = rs[index]
                        if defect == 'index': record['index'] += 1
                        elif defect == 'source': record['source'] = 'S2' if source == 'S1' else 'S1'
                        elif defect == 'kind': record['kind'] = 'query'
                        elif defect == 'helper': record['helper'] = '004BA432/event9-reaction'
                        elif defect == 'missing': del rs[index]
                        elif defect == 'extra': rs.append(copy.deepcopy(rs[-1])); rs[-1]['index'] += 1
                        elif defect == 'reverse': rs.reverse()
                        elif defect == 'before-rng': record['before']['rngState'] ^= 1
                        elif defect == 'before-data': record['before']['data']['nested']['value'] += 1
                        elif defect == 'before-raw94': row(record['before'], 1, 'forces')['rawDword94'] ^= 1
                        elif defect == 'before-raw98': row(record['before'], 1, 'forces')['rawByte98'] ^= 1
                        elif defect == 'before-vtable': row(record['before'], 1, 'forces')['vtableAddress'] ^= 1
                        elif defect == 'before-ruler': set_force(record['before'], 1, rulerId=-1)
                        elif defect == 'before-fallback': record['before'][FALLBACK]['positionX'] += 1
                        elif defect == 'before-head': record['before']['troopListHead'] = None
                        elif defect == 'before-node': record['before']['troopListNodes'][0]['nextNodeId'] = 29
                        elif defect == 'after-domain': record['after']['forces'].pop()
                        elif defect == 'missing-after': del record['after']
                        elif defect == 'missing-before': del record['before']
                        elif defect == 'unknown-field': record['ignored'] = 1
                        elif defect == 'rng-kind': record['rngConsumption']['kind'] = 'assumed'
                        elif defect == 'rng-count': record['rngConsumption']['calls'] = -1
                        self.atomic_error(g)

    def test_18_reset08_result_strict_boolean_and_no_virtual_setter_records(self):
        for source in SOURCES:
            f = target_fixture(source); set_force(f[0]['frame'], 1, vtableAddress=0)
            row(f[0]['frame'], 0, 'troops')['raw44'] = 1
            Oracle(f).run()
            for invalid in (0, 1, -1, 0xFFFFFFFF, None, 'true', [], {}):
                g = copy.deepcopy(f); g[2]['records'][1]['result'] = invalid; self.atomic_error(g)
            for slot in (0, 4, 0x40, 0x48, 0x94, 0x98):
                g = copy.deepcopy(f); g[2]['records'][1]['args']['virtualSlot'] = slot; self.atomic_error(g)
            for setter in ('00481590', '004815A2', '004815B0', '004815B4'):
                g = copy.deepcopy(f); g[2]['records'][1]['helper'] = setter; self.atomic_error(g)

    def test_19_new_raw_storage_strict_schema_initial_and_observed_frames(self):
        for source in SOURCES:
            f = target_fixture(source); Oracle(f).run()
            places = [('initial', None)] + [(key, i) for i in range(2) for key in ('before', 'after')]
            for key, bad_values in (('rawDword94', (-1, 1 << 32, True, False, 0.5, None, '0', [], {})),
                                    ('rawByte98', (-1, 256, True, False, 1.5, None, '0', [], {}))):
                for place, index in places:
                    for bad in bad_values:
                        g = copy.deepcopy(f)
                        world = g[0]['frame'] if place == 'initial' else g[2]['records'][index][place]
                        row(world, 0, 'forces')[key] = bad
                        self.atomic_error(g)
                    g = copy.deepcopy(f)
                    world = g[0]['frame'] if place == 'initial' else g[2]['records'][index][place]
                    del row(world, 0, 'forces')[key]; self.atomic_error(g)
            for place, index in places:
                g = copy.deepcopy(f)
                world = g[0]['frame'] if place == 'initial' else g[2]['records'][index][place]
                row(world, 0, 'forces')['inferredResetMeaning'] = True
                self.atomic_error(g)

    def test_20_policy_command_and_domain_are_strict_no_general_setters(self):
        for source in SOURCES:
            for key in ('event9ForceResetDomain', 'event9PresentationDomain', 'event9SelectionDomain',
                        'event9EventMemoryDomain', 'frameProfile'):
                for value in (None, '', 'unsupported', True):
                    f = fixture(source=source); f[3][key] = value; self.atomic_error(f)
                f = fixture(source=source); del f[3][key]; self.atomic_error(f)
            for where in (0, 1, 2, 3):
                f = fixture(source=source); f[where]['unrecognized'] = 1; self.atomic_error(f)
            for entry in ('force-setter', 'force-reset', '004B5020', '00481590', '004815B0'):
                f = fixture(source=source); f[1]['entry'] = entry; self.atomic_error(f)
            for field in ('raw94Argument', 'raw98Argument', 'forcePointer', 'managerIdentity'):
                f = fixture(source=source); f[1]['args'][field] = 0; self.atomic_error(f)
            for value in (None, {}, (), 'records'):
                f = fixture(source=source); f[2]['records'] = value; self.atomic_error(f)
            f = fixture(source=source); f[0]['frame']['mutableEventMemory'] = {'id': 9}; self.atomic_error(f)

    def test_21_missing_remainder_after_stores_rolls_back_everything(self):
        for source, unknown in itertools.product(SOURCES, (False, True)):
            f = target_fixture(source)
            if unknown:
                set_force(f[0]['frame'], 1, vtableAddress=0); row(f[0]['frame'], 0, 'troops')['raw44'] = 1
            def effect(stage, after, context):
                after['rngState'] = (after['rngState'] + 0x12345) & 0xFFFFFFFF
                after['data']['nested']['value'] += 100
                return 2
            Oracle(f, effect=effect).run()
            f[2]['records'].pop()
            self.atomic_error(f)
            # Passing a predecessor suffix is not an alternate replay route.
            f[2]['records'].append(copy.deepcopy(f[2]['records'][-1]))
            f[2]['records'][-1]['helper'] = '004BA432/event9-reaction'
            self.atomic_error(f)

    def test_22_unknown_policy_reject_is_atomic_at_each_new_boundary(self):
        for source in SOURCES:
            f = target_fixture(source); f[3]['unknownEffects'] = 'reject'
            self.atomic_defer(f, 'unresolved-effect:004BA411/event9-presentation')
            f = fixture(source=source); f[3]['unknownEffects'] = 'reject'
            trace = self.atomic_defer(f, 'unresolved-effect:' + REMAINDER)
            self.assertEqual(raw_pair(trace['observedEffects'][0]['before']), (0xFFFFFFFF, 0))
            f = fixture(source=source)
            set_force(f[0]['frame'], 1, vtableAddress=0)
            row(f[0]['frame'], 0, 'troops')['raw44'] = 1
            # Current force player short circuit avoids an earlier saved08.
            set_force(f[0]['frame'], playerIndex=0)
            f[3]['unknownEffects'] = 'reject'
            trace = self.atomic_defer(f, 'unresolved-effect:' + UNKNOWN)
            self.assertEqual(trace['observedEffects'][0]['args']['site'], '004B5026')

    def test_23_node_failure_and_native_guard_after_partial_reset_are_atomic(self):
        for source in SOURCES:
            f = target_fixture(source); f[0]['frame']['troopListNodes'] = [node(17, 29), node(29, 17, None)]
            f[3]['event9NodeLimit'] = 3
            with self.assertRaisesRegex(ValueError, 'oracle node guard reached'):
                Oracle(f).run()
            trace = self.atomic_defer(f, 'engine-guard-event9-node-budget')
            self.assertEqual(len(remainders(trace)), 2)
            g = target_fixture(source); g[0]['frame']['troopListNodes'] = [node(17, 29), node(29)]
            Oracle(g).run()
            g[2]['records'] = g[2]['records'][:2]
            g[2]['records'][-1]['after']['troopListNodes'] = [node(17)]
            self.atomic_error(g)
        f = target_fixture(); Oracle(f).run()
        #Only budget calibration uses the measured production call count;
        #none of the semantic expected frames or bindings do.
        limit = run(f)['nativeCalls']
        for value in (1, limit - 1):
            f[3]['engineGuard']['maxNativeCalls'] = value
            self.atomic_defer(f, 'engine-guard-native-call-budget')
        f[3]['engineGuard']['maxNativeCalls'] = limit
        self.assertTrue(run(f)['accepted'])

    def test_24_revision_idempotence_conflict_exhaustion_and_exact_replay(self):
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
        for field in ('after', 'steps', 'evidence', 'profileId', 'observedEffects', 'rng'):
            for rehash in (False, True):
                altered = copy.deepcopy(trace)
                if field == 'after': row(altered[field]['frame'], 0, 'forces')['rawDword94'] = 46
                elif field == 'steps': next(s for s in altered[field] if s['helper'] == '004815A2/raw94-store')['byteWidth'] = 1
                elif field == 'evidence': altered[field]['stockVerified'] = True
                elif field == 'observedEffects': altered[field][-1]['helper'] = '004BA432/event9-reaction'
                elif field == 'rng': altered[field]['observedCalls'] += 1
                else: altered[field] = 'wrong'
                if rehash: altered['traceHash'] = digest({k:v for k,v in altered.items() if k != 'traceHash'})
                with self.assertRaises(ValueError): m.replay_native_event9_force_reset(altered)
                type(self).rejection_cases += 1

    def test_25_all_predecessor_entry_apis_remain_unupgraded(self):
        for source, entry in itertools.product(SOURCES, INHERITED_ENTRIES):
            old = presentation_fixture(entry, source)
            expected = PresentationOracle(old).run()
            trace = previous.project_native_event9_presentation(*old)
            self.assertTrue(trace['accepted']); self.assertEqual(trace['after']['frame'], expected.w)
            self.assertEqual(trace, previous.replay_native_event9_presentation(trace))
            self.assertTrue(all('rawDword94' not in r and 'rawByte98' not in r for r in trace['after']['frame']['forces']))
            self.assertFalse(any(s['helper'] in RESET_HELPERS for s in trace['steps']))
            self.atomic_error(old)
            with self.assertRaises(ValueError): previous.project_native_event9_presentation(*fixture(entry, source))
            type(self).rejection_cases += 1
        from check_native_event9_selection_profile import fixture as old_fixture, Oracle as OldOracle
        import native_event9_selection_profile as old_module
        for source in SOURCES:
            old = old_fixture(source=source); OldOracle(old).run()
            trace = old_module.project_native_event9_selection(*old)
            self.assertEqual([r['helper'] for r in trace['observedEffects']], ['004BA345/event9-reaction-suffix'])
            self.assertEqual(trace, old_module.replay_native_event9_selection(trace))

    def test_26_oracle_runs_with_every_production_planner_and_primitive_poisoned(self):
        names = ('native_event9_force_reset_profile', 'native_event9_presentation_profile',
            'native_event9_selection_profile', 'native_live_position_profile',
            'native_troop_membership_profile', 'native_tail_distance_profile',
            'generic_facility_profile', 'live_zero_refund_profile', 'officer_relocation_profile',
            'base_ownership_events_profile', 'empty_legion_redistribution_profile',
            'return_route_target_force_profile', 'native_roster_sort_profile', 'recursive_officer_return_profile')
        primitive_names = ('native_event9_force_reset_primitives', 'native_event9_presentation_primitives',
            'native_event9_selection_primitives', 'native_live_position_primitives',
            'native_troop_membership_primitives', 'native_tail_distance_primitives')
        f = target_fixture(); set_force(f[0]['frame'], 1, vtableAddress=0)
        row(f[0]['frame'], 0, 'troops')['raw44'] = 1
        with ExitStack() as stack:
            for name in names:
                module = importlib.import_module(name)
                for attr in dir(module):
                    if attr.startswith(('project_', 'validate')) or attr == '_Planner':
                        stack.enter_context(patch.object(module, attr, side_effect=AssertionError('production oracle dependency')))
            for name in primitive_names:
                module = importlib.import_module(name)
                for cls in vars(module).values():
                    if not isinstance(cls, type) or cls.__module__ != name: continue
                    for attr, value in vars(cls).items():
                        if callable(value):
                            stack.enter_context(patch.object(cls, attr, side_effect=AssertionError('production primitive oracle dependency')))
            expected = Oracle(f).run()
        self.assertEqual(expected.selected, [0])
        self.assertEqual([r['helper'] for r in expected.records], ['004BA411/event9-presentation', UNKNOWN, REMAINDER])
        self.assertEqual(raw_pair(expected.w, 1), (0xFFFFFFFF, 0))

    def test_27_evidence_is_explicitly_bounded(self):
        trace = self.check_oracle(target_fixture()); evidence = trace['evidence']
        for key in ('sourceLocalOnly', 'event9SelectionPreludeNative', 'event9LiveNodeTraversal',
                    'event9SavedNextBeforeCallback', 'event9PresentationDecisionNative',
                    'event9PresentationCombinedObserved', 'event9ForceResetNative',
                    'event9ForceRaw94Dword', 'event9ForceRaw98Byte', 'event9ReactionRemainderObserved'):
            self.assertTrue(evidence[key])
        for key in ('stockVerified', 'vanillaVerified', 'event9ReactionSuffixObserved',
                    'event9GeneralForceSettersExposed', 'completeGameTransaction',
                    'canonicalCaptureContinuationExecuted', 'presentationSegmentsExecuted',
                    'rulerCaptureExecuted', 'event9TailExecuted', 'machineCodeExecuted',
                    'event9MutableEventMemorySupported', 'unknownForceDispatchOutsideEvent9Supported',
                    'callbacksAssumedNoninterfering', 'observationAuthenticityVerified', 'engineGuardIsOriginalRule'):
            self.assertFalse(evidence[key])
        self.assertEqual(evidence['event9ForceResetStart'], '004BA432')
        self.assertEqual(evidence['event9ForceResetEndExclusive'], '004BA442')
        self.assertEqual(evidence['event9ReactionStart'], '004BA442')
        self.assertEqual(evidence['event9EventMemoryDomain'], 'immutable-command-event-v1')
        self.assertFalse(trace['rng']['globalConsumptionVerified'])

    def test_28_recursive_event_and_base_ownership_composition(self):
        for source in SOURCES:
            f = fixture('event', source)
            f[1]['args'] = dict(id=9, subjectType='building', subjectId=0, argument=417)
            w = f[0]['frame']; row(w).update(missionId=0, homeBaseId=0)
            w.update(observerPresent=True, troopListNodes=[node(17), node(29, None, 999)])
            row(w, 999, 'troops').update(rawOrder2C=1, rawTarget30=0)
            set_force(w, playerIndex=0)
            def effect(stage, after, context):
                if stage == 'ownership-handler': after['troopListHead'] = 29
                elif stage == 'event9-presentation': after['troopListHead'] = None
                elif stage == 'event-observer':
                    self.assertEqual(raw_pair(after), (0xFFFFFFFF, 0))
                    after['troopListNodes'] = []
                return 0
            trace = self.check_oracle(f, effect=effect)
            self.assertEqual(selected_troops(trace), [999])
            self.assertEqual([r['helper'] for r in trace['observedEffects']], ['005BBE30', '004BA411/event9-presentation', REMAINDER, 'observer.virtual1B4'])
            self.assertEqual(remainders(trace)[0]['callStack'][0]['helper'], '004BBAA0')
            f = fixture('base-ownership', source); f[0]['frame']['activePersonIds'] = []
            f[1]['args']['requestedLegionId'] = -1
            self.assertEqual(selected_troops(self.check_oracle(f)), [0])

    def test_29_empty_non_event9_and_unsupported16_18_paths(self):
        for source, eid in itertools.product(SOURCES, (8, 9, 10, 14)):
            f = target_fixture(source); f[1]['args']['id'] = eid
            f[0]['frame']['troopListHead'] = None if eid == 9 else 0xFFFFFFFF
            trace = self.check_oracle(f)
            self.assertEqual(trace['observedEffects'], [])
            self.assertFalse(any(s['helper'] in RESET_HELPERS for s in trace['steps']))
        for source, eid in itertools.product(SOURCES, (16, 18)):
            f = target_fixture(source); f[1]['args']['id'] = eid; self.atomic_error(f)

    def test_30_unknown_force_outside_event9_remains_bounded(self):
        for source, entry in itertools.product(SOURCES, ('role-sort', 'capacity')):
            f = fixture(entry, source); set_force(f[0]['frame'], vtableAddress=0)
            self.atomic_defer(f, 'unsupported-noncanonical-force-outside-event9-presentation')
        for source, entry in itertools.product(SOURCES, ('position-pointer', 'force-legion', 'target-force')):
            f = fixture(entry, source); set_force(f[0]['frame'], vtableAddress=0)
            self.check_oracle(f)

    def test_31_seeded_mutable_force_and_live_node_sequences(self):
        rand = random.Random(0x4B5020)
        for index in range(64):
            f = target_fixture(SOURCES[index % 2]); w = f[0]['frame']
            ids = [901, 11, 700, 53]; rand.shuffle(ids)
            w['troopListHead'] = ids[0]
            w['troopListNodes'] = [node(nid, ids[i+1] if i+1 < len(ids) else None,
                rand.choice((0, 999, None))) for i, nid in enumerate(ids)]
            rand.shuffle(w['troopListNodes'])
            for fid in (0, 46):
                set_force(w, fid, rulerId=rand.choice((-1, 0, 1099, 1100)),
                    playerIndex=rand.choice((-1, 0, 7, 8)), vtableAddress=rand.choice((0, FORCE_VTABLE)),
                    rawDword94=rand.randrange(1 << 32), rawByte98=rand.randrange(256))
            for tid in (0, 999):
                row(w, tid, 'troops').update(raw44=rand.choice((-1, 0, 46, 47)),
                    rawOrder2C=rand.choice((0, 1, 4, 6)), rawTarget30=0,
                    vtableAddress=rand.choice((0, VTABLE)))
            def effect(stage, after, context):
                if stage == 'event9-unknown-virtual':
                    after['rngState'] = (after['rngState'] + 0x12345) & 0xFFFFFFFF
                    slot = context['args']['virtualSlot']
                    if slot == 64: return dict(result=-1, count=1)
                    if context['args']['site'] == '004B5026':
                        force = row(after, context['args']['pointer']['id'], 'forces')
                        set_force(after, force['id'], rulerId=-1, rawDword94=index + 1,
                                  rawByte98=index % 256, vtableAddress=0 if index % 2 else FORCE_VTABLE)
                    return dict(result=(context['index'] + index) % 3 != 0, count=None if index % 7 == 0 else 1)
                if stage == 'event9-presentation':
                    set_force(after, 46, playerIndex=7)
                    after[FALLBACK]['positionX'] += 1
                if stage == 'event9-reaction-remainder':
                    after['data']['nested']['value'] += 1
                    if index % 3 == 0 and context['args']['savedNextNodeId'] is not None:
                        row(after, context['args']['savedNextNodeId'], 'troopListNodes')['nextNodeId'] = None
                return 0
            self.check_oracle(f, effect=effect, replay=index % 8 == 0)

    def test_32_evolving_commits_reobserve_live_force_storage(self):
        f = target_fixture(); f[0]['frame']['troopListNodes'] = [node(17, 29), node(29, None, 999)]
        for turn in range(8):
            f[1].update(id='event9-force-reset-evolving-' + str(turn), expectedRevision=turn)
            def effect(stage, after, context):
                if stage == 'event9-reaction-remainder':
                    after[FALLBACK]['positionY'] += 1
                    after['troopListHead'] = 29 if turn % 2 == 0 else 17
                    set_force(after, playerIndex=7 if turn % 2 else -1,
                        vtableAddress=0 if turn % 2 else FORCE_VTABLE,
                        rawDword94=0x80000000 + turn, rawByte98=200 + turn)
                return 0
            trace = self.check_oracle(f, effect=effect)
            self.assertEqual(trace['after']['revision'], turn + 1)
            f[0] = copy.deepcopy(trace['after'])

    def test_33_fresh_source_reset_slice_and_setter_contract_both_sources(self):
        root = Path(__file__).resolve().parents[1] / 'docs/sources/native_event9_force_reset'
        expected = {
            '004BA1D0': [('004BA432', '8b 7c 24 20'), ('004BA436', '6a 00'),
                ('004BA438', '6a ff'), ('004BA43A', '53'), ('004BA43B', '8b cf'),
                ('004BA43D', 'e8 de ab ff ff'), ('004BA442', '6a ff')],
            '004B5020': [('004B5020', '56'), ('004B5021', '8b 74 24 08'),
                ('004B5025', '56'), ('004B5026', 'e8 05 56 fc ff'), ('004B502B', '83 c4 04'),
                ('004B502E', '85 c0'), ('004B5030', '74 18'), ('004B5032', '8b 44 24 0c'),
                ('004B5036', '50'), ('004B5037', '8b ce'), ('004B5039', 'e8 52 c5 fc ff'),
                ('004B503E', '8b 4c 24 10'), ('004B5042', '51'), ('004B5043', '8b ce'),
                ('004B5045', 'e8 66 c5 fc ff'), ('004B504A', '5e'), ('004B504B', 'c2 0c 00')],
            '00481590': [('00481590', '8b 44 24 04'), ('00481594', '83 f8 ff'),
                ('00481597', '74 09'), ('00481599', '85 c0'), ('0048159B', '7c 0b'),
                ('0048159D', '83 f8 2e'), ('004815A0', '7f 06'),
                ('004815A2', '89 81 94 00 00 00'), ('004815A8', 'c2 04 00')],
            '004815B0': [('004815B0', '8a 44 24 04'), ('004815B4', '88 81 98 00 00 00'),
                ('004815BA', 'c2 04 00')]}
        for source, (function, instructions) in itertools.product(SOURCES, expected.items()):
            lines = (root / (source + '-' + function + '.asm.txt')).read_text().splitlines()
            actual = {line[:8]: line[10:40].strip() for line in lines}
            for address, raw in instructions:
                self.assertEqual(actual[address], raw, (source, address))
            if function != '004BA1D0': self.assertEqual(len(lines), len(instructions))

    def test_34_semantic_mutations_are_killed_by_independent_expectations(self):
        import native_event9_force_reset_primitives as primitive
        cls = primitive.NativeEvent9ForceResetPrimitives
        original = textwrap.dedent(inspect.getsource(cls.event9_force_reset))
        word_start = original.index("            self.event9_force_row(force)['rawDword94']")
        byte_start = original.index("            self.event9_force_row(force)['rawByte98']")
        block_end = original.index('    #004B5020 RET')
        word_block, byte_block = original[word_start:byte_start], original[byte_start:block_end]
        variants = {
            'wrong-dword': original.replace("['rawDword94'] = 0xffffffff", "['rawDword94'] = 46"),
            'wrong-byte': original.replace("['rawByte98'] = 0", "['rawByte98'] = 255"),
            'word-width': original.replace('byteWidth=4', 'byteWidth=1'),
            'byte-width': original.replace('byteWidth=1', 'byteWidth=4'),
            'stores-reversed': original[:word_start] + byte_block + word_block + original[block_end:],
            'force-zero': original.replace("force = copy.deepcopy(args['savedForcePointer'])", "force = dict(storage='forces', id=0)"),
            'reload-raw44': original.replace("force = copy.deepcopy(args['savedForcePointer'])", "force = dict(storage='forces', id=self.slot('troops', args['troopPointer']['id'])['raw44'])"),
            'second-ruler-gate': original.replace('if passed:', "if passed and 0 <= self.event9_force_row(force)['rulerId'] <= 1099:"),
            'second-vtable-gate': original.replace('if passed:', "if passed and self.event9_force_row(force)['vtableAddress'] == 0x0079C0E8:"),
            'ignore-validity': original.replace('if passed:', 'if True:'),
            'skip-reset': original.replace('if passed:', 'if False:'),
            'old-remainder': original.replace(REMAINDER, '004BA432/event9-reaction'),
            'wrong-site': original.replace("'004B5026'", "'004BA35E'"),
            'manager-read': original.replace('incomingEcxRead=False', 'incomingEcxRead=True'),
            'unbalanced-stack': original.replace('parameterStackNetBytes=0', 'parameterStackNetBytes=12'),
            'cached-pre-callback-row': original.replace("passed = self.event9_valid(force, '004B5026')", "cached = self.event9_force_row(force)\n        passed = self.event9_valid(force, '004B5026')")
                .replace("self.event9_force_row(force)['rawDword94']", "cached['rawDword94']")
                .replace("self.event9_force_row(force)['rawByte98']", "cached['rawByte98']"),
        }
        for name, mutant in variants.items():
            self.assertNotEqual(mutant, original, name)
            for source in SOURCES:
                f = target_fixture(source); w = f[0]['frame']
                set_force(w, 1, vtableAddress=0); set_force(w, 46)
                row(w, 0, 'troops')['raw44'] = 1
                def effect(stage, after, context):
                    if stage == 'event9-presentation': row(after, 0, 'troops')['raw44'] = 46
                    if context['args'].get('site') == '004B5026':
                        set_force(after, 1, rulerId=-1, rawDword94=123, rawByte98=231)
                        return dict(result=name != 'ignore-validity', count=0)
                    return 0
                expected = Oracle(f, effect=effect).run()
                # A mutant is counted only after the same independently built
                # fixture succeeds against the unmodified implementation.
                self.assert_model(expected, run(f))
                namespace = {'copy': copy}
                exec(mutant, namespace)
                before = copy.deepcopy(f)
                with self.subTest(source=source, mutation=name), patch.object(cls, 'event9_force_reset', namespace['event9_force_reset']):
                    with self.assertRaises((AssertionError, ValueError, RecursionError)):
                        self.assert_model(expected, run(f))
                self.assertEqual(f, before)
                type(self).mutation_cases += 1

    @classmethod
    def tearDownClass(cls):
        print('Independent force-reset oracle coverage: %d accepted semantic cases; %d atomic rejection cases; %d killed production mutations' %
              (cls.oracle_cases, cls.rejection_cases, cls.mutation_cases))


if __name__ == '__main__':
    unittest.main()
