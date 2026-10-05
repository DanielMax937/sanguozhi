"""Independent source oracle for the bounded event9 presentation decision.

The selection interpreter is copied from the independent predecessor oracle;
its old super().boundary call deliberately does not survive into this version.
The new decision is transcribed from S1/S2 004BA345..004BA432, 0047A690,
00480FD0/00480FF0 and00480FA0. Expected frames, pointers, argument scopes and
RNG observations never come from a production planner/projector/primitive.
Unknown virtual answers and full-frame changes are synthetic test inputs.
Neither these fixtures nor successful checks certify stock or full capture.
"""
import copy
import importlib
import itertools
import json
import random
import unittest
from contextlib import ExitStack
from unittest.mock import patch

import native_event9_presentation_profile as m
import native_event9_selection_profile as previous
from check_native_event9_selection_profile import fixture as selection_fixture, node
from check_native_live_position_profile import Oracle as PositionOracle, DIRECT, FALLBACK
from check_native_tail_distance_profile import ENTRIES
from check_officer_relocation_profile import TERRITORY_BASE
from check_empty_legion_profile import set_legion
from check_return_route_target_force_profile import map_cell
from check_recursive_officer_return_profile import row, refresh_people, digest

SOURCES = ('S1', 'S2')
PROFILE = 'source-idb-S1-S2-native-event9-presentation-v1'
FRAME = 'source-idb-S1-S2-native-event9-presentation-frame-v1'
DOMAIN = 'canonical-live-event9-presentation-v1'
VTABLE, FORCE_VTABLE = 0x0079CC18, 0x0079C0E8
I32_MIN, I32_MAX = -2147483648, 2147483647
INHERITED_ENTRIES = ENTRIES + ('troop-member',) + DIRECT + ('event9-selection',)


def fixture(entry='event9-presentation', source='S1', **kw):
    f = selection_fixture('event9-selection' if entry == 'event9-presentation' else entry,
                          source, **kw)
    f[1]['entry'] = entry
    f[1]['id'] = 'native-event9-presentation-1'
    for force in f[0]['frame']['forces']:
        force['vtableAddress'] = FORCE_VTABLE
    f[3].update(id='native-event9-presentation-observe-v1', frameProfile=FRAME,
                event9PresentationDomain=DOMAIN,
                event9EventMemoryDomain='immutable-command-event-v1')
    return f


def run(f):
    return m.project_native_event9_presentation(*f)


def pointer(storage, rid):
    return None if rid is None else dict(storage=storage, id=rid)


def set_force(w, fid=0, **changes):
    force = next((r for r in w['forces'] if r['id'] == fid), None)
    if force is None:
        force = copy.deepcopy(w['forces'][0])
        force['id'] = fid
        force['vtableAddress'] = FORCE_VTABLE
        w['forces'].append(force)
    force.update(changes)
    force['valid'] = 0 <= force['rulerId'] <= 1099
    return force


def target_fixture(source='S1', **kw):
    f = fixture(source=source, **kw)
    row(f[0]['frame'], 0, 'troops').update(rawOrder2C=1, rawTarget30=0)
    set_force(f[0]['frame'], playerIndex=0)
    return f


def effects(trace, helper):
    return [r for r in trace['observedEffects'] if r['helper'] == helper]


def presentations(trace):
    return effects(trace, '004BA411/event9-presentation')


def reactions(trace):
    return effects(trace, '004BA432/event9-reaction')


def selected_troops(trace):
    return [r['args']['troopPointer']['id'] for r in reactions(trace)]


def virtual_sites(trace):
    return [r['args']['site'] for r in effects(trace, '004BA1D0/unknown-virtual')]


class Oracle(PositionOracle):
    """Literal source-ordered interpreter, with independently built bindings."""

    def __init__(self, *args, **kw):
        super().__init__(*args, **kw)
        self.selection_visits = []
        self.selected = []
        self.gates = []
        self.force_checks = []
        self.validations = []

    def boundary(self, stage, kind, helper, args, result=None):
        if helper == '004BA1D0':
            return self.selection(args['event'])
        return super().boundary(stage, kind, helper, args, result)

    def canonical_troop_valid(self, tid):
        t = self.get_troop(tid)
        leader = self.get('persons', t['leaderId'])
        return (leader is not None and (leader['rawDword17C'] != 0
                or leader['status'] in (0, 1, 2, 3, 4, 5, 7))
                and t['deputyIds'][0] < 1100 and t['deputyIds'][1] < 1100)

    def virtual(self, address, slot, site):
        return PositionOracle.boundary(self, 'event9-unknown-virtual', 'effect-query',
            '004BA1D0/unknown-virtual',
            dict(pointer=address, virtualSlot=slot, site=site),
            -1 if slot == 64 else True)

    def valid_pointer(self, address, site):
        self.validations.append((copy.deepcopy(address), site))
        if address is None:
            return False
        record = self.get(address['storage'], address['id'])
        if address['storage'] == 'troops':
            if record['vtableAddress'] != VTABLE:
                return self.virtual(address, 8, site)
            return self.canonical_troop_valid(address['id'])
        if address['storage'] == 'forces':
            if record['vtableAddress'] != FORCE_VTABLE:
                return self.virtual(address, 8, site)
            value = record['rulerId']
            answer = 0 <= value <= 1099
            self.force_checks.append(('valid', copy.deepcopy(address), value, answer, site))
            return answer
        return record['valid']

    def cast_building(self, address, site):
        if address is None:
            return None
        record = self.get(address['storage'], address['id'])
        if address['storage'] == 'troops' and record['vtableAddress'] != VTABLE:
            matched = self.virtual(address, 44, site)
        else:
            matched = address['storage'] == 'buildings'
        return copy.deepcopy(address) if matched else None

    def target(self, tid):
        with self.inside('00495CE0', troopId=tid):
            order = self.get_troop(tid)['rawOrder2C']
            self.save(savedRawOrder2C=order)
            # Independent decoding of00495E3C and00495E24. The INC/CMP/JA
            # domain is unsigned, including the original dword wraparound.
            selectors = (0, 0, 1, 2, 1, 3, 1, 4, 5, 5, 5, 1, 0)
            index = (order + 1) % (1 << 32)
            branch = selectors[index] if index < len(selectors) else 0
            if branch == 0:
                return None
            sites = {1:'00495D00', 2:'00495D76', 3:'00495D88',
                     4:'00495D98', 5:'00495D57'}
            if not self.valid_pointer(pointer('troops', tid), sites[branch]):
                return None
            kind = self.get_troop(tid)['rawTargetType34'] if branch in (1, 4) else 2 if branch == 2 else 0
            if kind not in (0, 1, 2, 3):
                return None
            if kind == 2:
                pos = copy.deepcopy(self.get_troop(tid)['targetPosition38'])
                self.save(savedTargetPosition38=pos)
                index = pos['positionX'] * 200 + pos['positionY']
                if not 0 <= index <= 39999:
                    raise ValueError('oracle target map allocation escape')
                bits = self.get('mapCells', index)['rawTerritoryDword']
                target = abs(TERRITORY_BASE[(bits >> 5) & 127])
                kind = 0
            else:
                target = self.get_troop(tid)['rawTarget30']
            storage, upper = {0:('buildings',16383), 1:('troops',999),
                              3:('persons',1099)}[kind]
            return pointer(storage, target) if 0 <= target <= upper else None

    def force_pointer(self, address, site):
        storage, rid = address['storage'], address['id']
        if storage == 'buildings':
            return self.target_force(rid, site)
        if storage == 'persons':
            with self.inside('0047B2B0/event9-person', personId=rid, site=site):
                legion = self.get('legions', self.get('persons', rid)['rawLegionId'])
                return legion['forceId'] if legion is not None and legion['valid'] else -1
        if self.get_troop(rid)['vtableAddress'] != VTABLE:
            return self.virtual(address, 64, site)
        with self.inside('004955A0', troopId=rid, site=site):
            if not self.canonical_troop_valid(rid):
                return -1
            pid = self.get_troop(rid)['leaderId']
            person_address = pointer('persons', pid) if 0 <= pid <= 1099 else None
            self.save(savedLeaderPointer=person_address)
            if not self.valid_pointer(person_address, '004955BD'):
                return -1
            return self.force_pointer(person_address, '004955CE')

    def player(self, address, site):
        record = self.get(address['storage'], address['id'])
        if address['storage'] == 'forces':
            if record['vtableAddress'] != FORCE_VTABLE:
                return self.virtual(address, 72, site)
            value = record['playerIndex']
            answer = 0 <= value <= 7
            self.force_checks.append(('player', copy.deepcopy(address), value, answer, site))
            return answer
        if record['vtableAddress'] != VTABLE:
            return self.virtual(address, 72, site)
        #0047A690 gets current force through virtual40, retains ESI, tests
        #virtual08, then reloads that identity's vtable for the tail virtual48.
        with self.inside('0047A690', troopId=address['id'], site=site):
            force_id = self.force_pointer(address, '0047A693')
            force = pointer('forces', force_id) if 0 <= force_id <= 46 else None
            self.save(savedCurrentForcePointer=force)
            if not self.valid_pointer(force, '0047A6BC'):
                return False
            return self.player(force, '0047A6CC')

    def presentation(self, arguments):
        #00490AA0 forms EBX from the captured raw44; it does not load its row.
        saved_force = pointer('forces', arguments['raw44'])
        self.save(savedForcePointer=saved_force)
        enabled = self.player(arguments['troopPointer'], '004BA356')
        if not enabled:
            enabled = self.valid_pointer(saved_force, '004BA35E')
            if enabled:
                enabled = self.player(saved_force, '004BA372')
        self.gates.append((enabled, copy.deepcopy(saved_force)))
        bound = dict(copy.deepcopy(arguments), savedForcePointer=copy.deepcopy(saved_force))
        #37D/384 rereads the event word. This bounded contract explicitly
        #keeps the command event and saved control-flow locals immutable across
        #effect callbacks; temporary-object writes are inside presentation.
        if enabled and arguments['event']['id'] == 9:
            if self.valid_pointer(arguments['targetPointer'], '004BA405'):
                PositionOracle.boundary(self, 'event9-presentation', 'effect',
                    '004BA411/event9-presentation', dict(bound, presentationArgs=dict(
                        messageId=8348, troopPointer=copy.deepcopy(arguments['troopPointer']),
                        targetPointer=copy.deepcopy(arguments['targetPointer']),
                        displayTroopPointer=copy.deepcopy(arguments['troopPointer']),
                        rawFlag=1, rawArgument=-1)))
        PositionOracle.boundary(self, 'event9-reaction', 'effect',
            '004BA432/event9-reaction', bound)

    def selection(self, event):
        with self.inside('004BA1D0', event=event, managerIdentity='entry-ecx'):
            if event['id'] != 9:
                return
            subject = None if event['subjectType'] == 'null' else pointer(
                {'person':'persons', 'building':'buildings'}[event['subjectType']],
                event['subjectId'])
            subject = self.cast_building(subject, '004BA278')
            cursor = self.w['troopListHead']
            self.save(savedOldForceId=-1, savedNewForceId=-1,
                      savedSubjectPointer=subject, initialHeadNodeId=cursor)
            visit = 0
            while cursor is not None:
                if visit >= self.f[3]['event9NodeLimit']:
                    raise ValueError('oracle node guard reached')
                with self.inside('004BA296/visit', visitIndex=visit, currentNodeId=cursor):
                    current = next(n for n in self.w['troopListNodes'] if n['id'] == cursor)
                    if not current['readable'] or not current['writable']:
                        raise ValueError('oracle unreadable node')
                    #0049230A/C writes caller's cursor before004BA2A5 reads
                    #the payload; this saved identity survives every callback.
                    saved_next = current['nextNodeId']
                    troop_address = pointer('troops', current['troopId'])
                    self.save(savedNextNodeId=saved_next, savedTroopPointer=troop_address)
                    self.selection_visits.append((cursor, saved_next, copy.deepcopy(troop_address)))
                    if self.valid_pointer(troop_address, '004BA2A8'):
                        tid = troop_address['id']
                        raw = self.get_troop(tid)['raw44']
                        self.save(savedRaw44=raw)
                        if 0 <= raw <= 46:
                            target = self.cast_building(self.target(tid), '004BA2E3')
                            self.save(savedTargetPointer=target)
                            selected = (not self.valid_pointer(target, '004BA2F1')
                                        or target == subject)
                            if not selected:
                                first = self.force_pointer(target, '004BA307')
                                if first == -1:
                                    selected = self.force_pointer(troop_address, '004BA318') == -1
                                else:
                                    second = self.force_pointer(target, '004BA323')
                                    if second == -1:
                                        selected = self.force_pointer(troop_address, '004BA338') == -1
                            if selected:
                                self.selected.append(tid)
                                self.presentation(dict(
                                        event=copy.deepcopy(event), troopPointer=troop_address,
                                        targetPointer=target, raw44=raw,
                                        savedOldForceId=-1, savedNewForceId=-1,
                                        subjectPointer=subject, managerIdentity='entry-ecx',
                                        savedNextNodeId=saved_next))
                    cursor = saved_next
                visit += 1

    def run(self):
        if self.f[1]['entry'] not in ('event9-selection', 'event9-presentation'):
            return super().run()
        try:
            self.selection(self.f[1]['args'])
        finally:
            self.f[2]['records'] = copy.deepcopy(self.records)
        return self


class NativeEvent9PresentationTests(unittest.TestCase):
    maxDiff = 12000
    oracle_cases = 0
    rejection_cases = 0

    def check_oracle(self, f, replay=True, **kw):
        expected = Oracle(f, **kw).run()
        before = copy.deepcopy(f)
        trace = run(f)
        type(self).oracle_cases += 1
        self.assertTrue(trace['accepted'], trace['reason'])
        self.assertEqual(trace['profileId'], PROFILE)
        self.assertEqual(trace['frameProfileId'], FRAME)
        self.assertEqual(trace['after']['frame'], expected.w)
        self.assertEqual(trace['nativeResult'], expected.native_result)
        self.assertEqual(trace['events'], expected.events)
        self.assertEqual(trace['returnCalls'], expected.return_calls)
        self.assertEqual(trace['observedEffects'], [r for r in expected.records if r['kind'] != 'query'])
        self.assertEqual(trace['queries'], [r for r in expected.records if r['kind'] == 'query'])
        self.assertEqual(trace['rng']['localCalls'], expected.local_rng)
        self.assertEqual(trace['rng']['finalState'], expected.w['rngState'])
        counts = [r['rngConsumption'] for r in expected.records if r['kind'] != 'query']
        known = all(c['kind'] == 'observed-count' for c in counts)
        self.assertEqual(trace['rng']['allCountsKnown'], known)
        self.assertEqual(trace['rng']['observedCalls'], sum(c['calls'] for c in counts) if known else None)
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
        self.assertEqual(len([s for s in trace['steps'] if s['helper'] == '004BA384/event-word']),
                         sum(enabled for enabled, _ in expected.gates))
        for r in presentations(trace) + reactions(trace):
            self.assertEqual(r['callStack'][-1]['helper'], '004BA296/visit')
            self.assertEqual(r['callStack'][-1]['locals']['savedForcePointer'], r['args']['savedForcePointer'])
            self.assertEqual(r['args']['savedForcePointer'], pointer('forces', r['args']['raw44']))
        self.assertEqual(trace['after']['revision'], f[0]['revision'] + 1)
        self.assertEqual(len(trace['after']['appliedCommands']), len(f[0]['appliedCommands']) + 1)
        self.assertEqual(f, before)
        if replay:
            self.assertEqual(trace, m.replay_native_event9_presentation(json.loads(json.dumps(trace))))
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
        type(self).rejection_cases += 1
        self.assertFalse(trace['accepted'])
        self.assertEqual(trace['reason'], reason)
        self.assertEqual(trace['after'], f[0])
        self.assertEqual(trace['events'], [])
        self.assertEqual(trace['steps'], [])
        self.assertEqual(trace['queries'], [])
        self.assertEqual(f, before)
        self.assertEqual(trace, m.replay_native_event9_presentation(trace))
        return trace

    def test_01_all_twenty_two_inherited_and_new_entries_both_sources(self):
        self.assertEqual(len(INHERITED_ENTRIES), 22)
        for source, entry in itertools.product(SOURCES, INHERITED_ENTRIES + ('event9-presentation',)):
            with self.subTest(source=source, entry=entry):
                self.check_oracle(fixture(entry, source))

    def test_02_presentation_arguments_order_scope_and_alias(self):
        for source, entry in itertools.product(SOURCES, ('event9-selection', 'event9-presentation')):
            f = target_fixture(source, entry=entry)
            trace = self.check_oracle(f)
            self.assertEqual([r['helper'] for r in trace['observedEffects']],
                             ['004BA411/event9-presentation', '004BA432/event9-reaction'])
            self.assertEqual(presentations(trace)[0]['args']['presentationArgs'], dict(
                messageId=8348, troopPointer=pointer('troops', 0), targetPointer=pointer('buildings', 0),
                displayTroopPointer=pointer('troops', 0), rawFlag=1, rawArgument=-1))
            self.assertEqual(reactions(trace)[0]['before'], presentations(trace)[0]['after'])

    def test_03_signed_player_boundaries_current_and_saved(self):
        for source, player, current in itertools.product(SOURCES,
                (I32_MIN, -1, 0, 1, 7, 8, I32_MAX), (True, False)):
            f = target_fixture(source)
            w = f[0]['frame']
            set_force(w, 1, playerIndex=-1)
            row(w, 0, 'troops')['raw44'] = 1
            if current:
                set_force(w, 0, playerIndex=player)
            else:
                set_force(w, 0, playerIndex=-1)
                set_force(w, 1, playerIndex=player)
            trace = self.check_oracle(f)
            self.assertEqual(bool(presentations(trace)), 0 <= player <= 7)
            sites = [s['site'] for s in trace['steps'] if s['helper'] == '00480FA0/event9-player']
            self.assertEqual(sites, ['0047A6CC'] if current and 0 <= player <= 7
                             else ['0047A6CC', '004BA372'])

    def test_04_signed_ruler_boundaries_current_and_saved(self):
        for source, ruler, current in itertools.product(SOURCES,
                (I32_MIN, -1, 0, 1099, 1100, I32_MAX), (True, False)):
            f = target_fixture(source)
            w = f[0]['frame']
            row(w, 0, 'troops')['raw44'] = 1
            set_force(w, 1, rulerId=-1, playerIndex=0)
            set_force(w, 0, playerIndex=-1)
            set_force(w, 0 if current else 1, rulerId=ruler, playerIndex=0)
            trace = self.check_oracle(f)
            self.assertEqual(bool(presentations(trace)), 0 <= ruler <= 1099)
            self.assertEqual(len(reactions(trace)), 1)

    def test_05_current_force_and_saved_raw44_are_distinct_identities(self):
        for source, current_player, saved_player in itertools.product(SOURCES, (-1, 0), (-1, 7)):
            f = target_fixture(source)
            w = f[0]['frame']
            row(w, 0, 'troops')['raw44'] = 46
            set_force(w, 0, playerIndex=current_player)
            set_force(w, 46, playerIndex=saved_player)
            trace = self.check_oracle(f)
            self.assertEqual(bool(presentations(trace)), current_player >= 0 or saved_player >= 0)
            self.assertEqual(reactions(trace)[0]['args']['savedForcePointer'], pointer('forces', 46))

    def test_06_saved_force_getter_is_identity_without_storage_read(self):
        for source in SOURCES:
            f = target_fixture(source)
            row(f[0]['frame'], 0, 'troops')['raw44'] = 46
            self.assertNotIn(46, [r['id'] for r in f[0]['frame']['forces']])
            trace = self.check_oracle(f)
            self.assertEqual(reactions(trace)[0]['args']['savedForcePointer'], pointer('forces', 46))
            self.assertFalse(any(s.get('site') in ('004BA35E', '004BA372') for s in trace['steps']))
            f[2]['records'] = []
            set_force(f[0]['frame'], playerIndex=-1)
            self.atomic_error(f)

    def test_07_raw44_signed_range_and_force46_endpoint(self):
        for source, raw in itertools.product(SOURCES, (I32_MIN, -1, 0, 1, 46, 47, I32_MAX)):
            f = target_fixture(source)
            row(f[0]['frame'], 0, 'troops')['raw44'] = raw
            trace = self.check_oracle(f)
            self.assertEqual(len(reactions(trace)), int(0 <= raw <= 46))

    def test_08_current_force_lookup_signed_boundaries_and_null_fallback(self):
        for source, fid in itertools.product(SOURCES, (I32_MIN, -1, 0, 1, 46, 47, I32_MAX)):
            f = target_fixture(source)
            w = f[0]['frame']
            # Canonical person40 returns -1 for invalid legions. The
            # inherited frame requires valid legion force IDs in0..46.
            set_legion(row(w, 0, 'legions'), forceId=fid)
            if 0 <= fid <= 46:
                set_force(w, fid, playerIndex=-1)
            set_force(w, 0, playerIndex=7)
            trace = self.check_oracle(f)
            self.assertTrue(presentations(trace))
            current = next(s for s in trace['steps'] if s['helper'] == '00490AA0/event9-current-force')
            self.assertEqual(current['forcePointer'], pointer('forces', fid) if 0 <= fid <= 46 else None)

    def test_09_no_gate_no_target_validation_and_always_reaction(self):
        for source in SOURCES:
            f = target_fixture(source)
            w = f[0]['frame']
            row(w, 0, 'troops').update(rawTargetType34=1, rawTarget30=999)
            row(w, 999, 'troops')['vtableAddress'] = 0
            row(w, 7)['rawLegionId'] = -1
            set_force(w, playerIndex=-1)
            trace = self.check_oracle(f)
            self.assertEqual(virtual_sites(trace), ['004BA2E3', '004BA2F1', '004BA307'])
            self.assertEqual(len(reactions(trace)), 1)
            self.assertEqual(presentations(trace), [])

    def test_10_null_and_initially_invalid_target_still_react(self):
        for source, target in itertools.product(SOURCES, ('null', 'invalid')):
            f = target_fixture(source)
            if target == 'null':
                row(f[0]['frame'], 0, 'troops')['rawOrder2C'] = 0
            else:
                row(f[0]['frame'], 0, 'buildings').update(kind=-1, valid=False)
            trace = self.check_oracle(f)
            self.assertEqual(presentations(trace), [])
            self.assertEqual(len(reactions(trace)), 1)

    def test_11_unknown_troop48_true_short_circuits_unrepresented_saved_force(self):
        for source in SOURCES:
            f = target_fixture(source)
            row(f[0]['frame'], 0, 'troops').update(vtableAddress=0, raw44=46)
            trace = self.check_oracle(f)
            self.assertEqual(virtual_sites(trace), ['004BA2A8', '00495D00', '004BA356'])
            self.assertTrue(presentations(trace))
            self.assertEqual(reactions(trace)[0]['args']['savedForcePointer'], pointer('forces', 46))

    def test_12_unknown_troop48_false_observes_live_saved_force(self):
        for source in SOURCES:
            f = target_fixture(source)
            row(f[0]['frame'], 0, 'troops')['vtableAddress'] = 0
            def effect(stage, after, context):
                if context['args'].get('site') == '004BA356':
                    set_force(after, playerIndex=-1)
                    after['rngState'] = 1234
                    return dict(result=False, count=2)
                return 0
            trace = self.check_oracle(f, effect=effect)
            self.assertEqual(presentations(trace), [])
            self.assertEqual(trace['rng']['finalState'], 1234)
            self.assertEqual(trace['rng']['observedCalls'], 2)

    def test_13_unknown_current_force08_true_reloads_changed_vtable(self):
        for source in SOURCES:
            f = target_fixture(source)
            set_force(f[0]['frame'], vtableAddress=0, rulerId=-1, playerIndex=-1)
            def effect(stage, after, context):
                if context['args'].get('site') == '0047A6BC':
                    # True08 is observed despite diagnostic valid=False. The
                    # following canonical48 reads playerIndex without validity.
                    set_force(after, vtableAddress=FORCE_VTABLE, playerIndex=7)
                    after['rngState'] = 0xFEDCBA98
                    return dict(result=True, count=3)
                return 0
            trace = self.check_oracle(f, effect=effect)
            self.assertTrue(presentations(trace))
            self.assertEqual(virtual_sites(trace), ['0047A6BC'])
            self.assertFalse(row(trace['after']['frame'], 0, 'forces')['valid'])
            self.assertEqual(trace['rng']['finalState'], 0xFEDCBA98)

    def test_14_unknown_current_force08_false_ignores_diagnostic_true(self):
        for source in SOURCES:
            f = target_fixture(source)
            set_force(f[0]['frame'], vtableAddress=0)
            set_force(f[0]['frame'], 1, rulerId=-1, playerIndex=0)
            row(f[0]['frame'], 0, 'troops')['raw44'] = 1
            def effect(stage, after, context):
                return dict(result=False, count=0) if context['args'].get('site') == '0047A6BC' else 0
            trace = self.check_oracle(f, effect=effect)
            self.assertEqual(virtual_sites(trace), ['0047A6BC'])
            self.assertEqual(presentations(trace), [])

    def test_15_unknown_current_force48_and_saved_fallback_are_live(self):
        for source, result in itertools.product(SOURCES, (True, False)):
            f = target_fixture(source)
            set_force(f[0]['frame'], vtableAddress=0)
            set_force(f[0]['frame'], 1, playerIndex=-1)
            row(f[0]['frame'], 0, 'troops')['raw44'] = 1
            def effect(stage, after, context):
                if context['args'].get('site') == '0047A6CC':
                    set_force(after, 1, playerIndex=7)
                    return dict(result=result, count=1)
                return 0
            trace = self.check_oracle(f, effect=effect)
            self.assertTrue(presentations(trace))
            self.assertEqual(virtual_sites(trace), ['0047A6BC', '0047A6CC'])
            self.assertEqual(any(s.get('site') == '004BA372' for s in trace['steps']), not result)

    def test_16_unknown_saved_force08_changes_vtable_and_skips_valid_cache(self):
        for source in SOURCES:
            f = target_fixture(source)
            set_force(f[0]['frame'], 0, playerIndex=-1)
            set_force(f[0]['frame'], 1, rulerId=-1, playerIndex=-1, vtableAddress=0)
            row(f[0]['frame'], 0, 'troops')['raw44'] = 1
            def effect(stage, after, context):
                if context['args'].get('site') == '004BA35E':
                    set_force(after, 1, vtableAddress=FORCE_VTABLE, playerIndex=0)
                    return dict(result=True, count=0)
                return 0
            trace = self.check_oracle(f, effect=effect)
            self.assertEqual(virtual_sites(trace), ['004BA35E'])
            self.assertTrue(presentations(trace))
            self.assertFalse(row(trace['after']['frame'], 1, 'forces')['valid'])

    def test_17_unknown_saved_force08_false_skips48(self):
        for source in SOURCES:
            f = target_fixture(source)
            set_force(f[0]['frame'], playerIndex=-1)
            set_force(f[0]['frame'], 1, vtableAddress=0, playerIndex=0)
            row(f[0]['frame'], 0, 'troops')['raw44'] = 1
            def effect(stage, after, context):
                return dict(result=False, count=0) if context['args'].get('site') == '004BA35E' else 0
            trace = self.check_oracle(f, effect=effect)
            self.assertEqual(virtual_sites(trace), ['004BA35E'])
            self.assertFalse(presentations(trace))

    def test_18_unknown_saved_force48_boolean_and_full_frame_rng_replacement(self):
        for source, answer, count in itertools.product(SOURCES, (True, False), (0, 4, None)):
            f = target_fixture(source)
            set_force(f[0]['frame'], playerIndex=-1)
            set_force(f[0]['frame'], 1, vtableAddress=0)
            row(f[0]['frame'], 0, 'troops')['raw44'] = 1
            def effect(stage, after, context):
                if context['args'].get('site') == '004BA372':
                    after['data']['nested']['value'] = 345
                    after[FALLBACK]['positionX'] = -32768
                    after['rngState'] = 0xABCDEF12
                    row(after, 0, 'troops')['raw44'] = 46
                    return dict(result=answer, count=count)
                return 0
            trace = self.check_oracle(f, effect=effect)
            self.assertEqual(virtual_sites(trace), ['004BA35E', '004BA372'])
            self.assertEqual(bool(presentations(trace)), answer)
            self.assertEqual(trace['after']['frame']['data']['nested']['value'], 345)
            self.assertEqual(reactions(trace)[0]['args']['raw44'], 1)
            self.assertEqual(reactions(trace)[0]['args']['savedForcePointer'], pointer('forces', 1))

    def test_19_saved_current_force_survives_legion_and_raw44_retarget(self):
        for source in SOURCES:
            f = target_fixture(source)
            set_force(f[0]['frame'], vtableAddress=0)
            set_force(f[0]['frame'], 1, playerIndex=-1)
            def effect(stage, after, context):
                if context['args'].get('site') == '0047A6BC':
                    set_legion(row(after, 0, 'legions'), forceId=1)
                    row(after, 0, 'troops')['raw44'] = 1
                    set_force(after, 0, vtableAddress=FORCE_VTABLE, playerIndex=7)
                return 0
            trace = self.check_oracle(f, effect=effect)
            checks = [s for s in trace['steps'] if s['helper'] == '00480FA0/event9-player']
            self.assertEqual(checks[0]['forcePointer'], pointer('forces', 0))
            self.assertEqual(reactions(trace)[0]['args']['savedForcePointer'], pointer('forces', 0))
            self.assertTrue(presentations(trace))

    def test_20_gate_callback_invalidates_saved_target(self):
        for source in SOURCES:
            f = target_fixture(source)
            set_force(f[0]['frame'], vtableAddress=0)
            def effect(stage, after, context):
                if context['args'].get('site') == '0047A6CC':
                    row(after, 0, 'buildings').update(kind=-1, valid=False)
                return 0
            trace = self.check_oracle(f, effect=effect)
            self.assertEqual(presentations(trace), [])
            self.assertEqual(len(reactions(trace)), 1)

    def test_21_gate_callback_revives_saved_target_and_changes_troop_target(self):
        for source in SOURCES:
            f = target_fixture(source)
            row(f[0]['frame'], 0, 'buildings').update(kind=-1, valid=False)
            set_force(f[0]['frame'], vtableAddress=0)
            def effect(stage, after, context):
                if context['args'].get('site') == '0047A6CC':
                    row(after, 0, 'buildings').update(kind=0, valid=True)
                    row(after, 0, 'troops').update(rawTarget30=1, raw44=46)
                return 0
            trace = self.check_oracle(f, effect=effect)
            self.assertEqual(presentations(trace)[0]['args']['targetPointer'], pointer('buildings', 0))
            self.assertEqual(presentations(trace)[0]['args']['raw44'], 0)

    def test_22_unknown_target_revalidation_and_reaction_order(self):
        for source, target_valid in itertools.product(SOURCES, (True, False)):
            f = target_fixture(source)
            w = f[0]['frame']
            row(w, 0, 'troops').update(rawTargetType34=1, rawTarget30=999)
            row(w, 999, 'troops')['vtableAddress'] = 0
            row(w, 7)['rawLegionId'] = -1
            def effect(stage, after, context):
                if context['args'].get('site') == '004BA405':
                    row(after, 999, 'troops')['vtableAddress'] = VTABLE
                    after['rngState'] = 72
                    return dict(result=target_valid, count=2)
                return 0
            trace = self.check_oracle(f, effect=effect)
            self.assertEqual(virtual_sites(trace), ['004BA2E3', '004BA2F1', '004BA307', '004BA405'])
            self.assertEqual(bool(presentations(trace)), target_valid)
            self.assertEqual(reactions(trace)[0]['before']['rngState'], 72)

    def test_23_both_observed_segments_replace_frame_and_rng_in_order(self):
        for source in SOURCES:
            f = target_fixture(source)
            def effect(stage, after, context):
                if stage == 'event9-presentation':
                    after['rngState'] = 0x12345678
                    after['data']['nested']['value'] = 411
                    after[FALLBACK]['positionY'] = -88
                    row(after, 0, 'troops').update(raw44=46, leaderId=-1)
                    set_force(after, rulerId=-1, vtableAddress=0)
                    row(after, 0, 'buildings').update(kind=-1, valid=False)
                    return 3
                if stage == 'event9-reaction':
                    self.assertEqual(after['data']['nested']['value'], 411)
                    after['rngState'] = 0x87654321
                    after['data']['nested']['value'] = 432
                    return 5
                return 0
            trace = self.check_oracle(f, effect=effect)
            self.assertEqual(trace['rng']['observedCalls'], 8)
            self.assertEqual(trace['rng']['finalState'], 0x87654321)
            self.assertEqual(reactions(trace)[0]['args']['savedForcePointer'], pointer('forces', 0))
            self.assertEqual(reactions(trace)[0]['args']['targetPointer'], pointer('buildings', 0))

    def test_24_presentation_removes_current_node_but_saved_cursor_survives(self):
        for source in SOURCES:
            f = target_fixture(source)
            w = f[0]['frame']
            w['troopListNodes'] = [node(17, 29), node(29, None, 0), node(55)]
            def effect(stage, after, context):
                if stage == 'event9-presentation' and context['args']['savedNextNodeId'] == 29:
                    after['troopListNodes'] = [node(29, 55, 999), node(55)]
                    after['troopListHead'] = 55
                    row(after, 0, 'troops')['raw44'] = 47
                return 0
            trace = self.check_oracle(f, effect=effect)
            self.assertEqual(selected_troops(trace), [0, 999])
            visits = [s['currentNodeId'] for s in trace['steps'] if s['helper'] == '004922C0/advance']
            self.assertEqual(visits, [17, 29, 55])
            self.assertNotIn(17, [n['id'] for n in trace['after']['frame']['troopListNodes']])

    def test_25_reaction_relinks_saved_next_with_live_payload_and_order(self):
        for source in SOURCES:
            f = target_fixture(source)
            f[0]['frame']['troopListNodes'] = [node(17, 29), node(29, 55), node(55)]
            def effect(stage, after, context):
                if stage == 'event9-reaction' and context['args']['savedNextNodeId'] == 29:
                    row(after, 17, 'troopListNodes')['nextNodeId'] = None
                    row(after, 29, 'troopListNodes').update(troopId=999, nextNodeId=None)
                    row(after, 999, 'troops').update(raw44=46, rawOrder2C=1, rawTarget30=0)
                    after['troopListHead'] = 55
                return 0
            trace = self.check_oracle(f, effect=effect)
            self.assertEqual(selected_troops(trace), [0, 999])
            self.assertEqual([r['args']['savedNextNodeId'] for r in reactions(trace)], [29, None])

    def test_26_unknown48_mutates_list_before_both_saved_boundaries(self):
        for source in SOURCES:
            f = target_fixture(source)
            row(f[0]['frame'], 0, 'troops')['vtableAddress'] = 0
            f[0]['frame']['troopListNodes'] = [node(17, 29), node(29, None, 999)]
            def effect(stage, after, context):
                if context['args'].get('site') == '004BA356':
                    after['troopListNodes'] = [node(29, None, 999)]
                    after['troopListHead'] = 29
                    row(after, 0, 'troops').update(raw44=47, rawTarget30=1)
                return 0
            trace = self.check_oracle(f, effect=effect)
            self.assertEqual(selected_troops(trace), [0, 999])
            first = presentations(trace)[0]
            self.assertEqual(first['args']['savedNextNodeId'], 29)
            self.assertEqual(first['args']['troopPointer'], pointer('troops', 0))
            self.assertEqual(first['args']['targetPointer'], pointer('buildings', 0))
            self.assertEqual(first['args']['savedForcePointer'], pointer('forces', 0))

    def test_27_observed_self_cycle_terminates_after_saved_revisit(self):
        for source in SOURCES:
            f = target_fixture(source)
            f[0]['frame']['troopListNodes'] = [node(17, 17)]
            def effect(stage, after, context):
                if stage == 'event9-presentation':
                    row(after, 17, 'troopListNodes')['nextNodeId'] = None
                return 0
            trace = self.check_oracle(f, effect=effect)
            self.assertEqual(selected_troops(trace), [0, 0])
            self.assertEqual([r['args']['savedNextNodeId'] for r in reactions(trace)], [17, None])

    def test_28_all_boundary_bindings_missing_stale_wrong_or_extra_reject(self):
        for source, target_record in itertools.product(SOURCES, (0, 1)):
            f = target_fixture(source)
            Oracle(f).run()
            defects = ('missing', 'extra', 'index', 'source', 'kind', 'helper',
                'raw44', 'next', 'subject', 'force', 'target', 'troop', 'event',
                'manager', 'oldForce', 'newForce', 'scope', 'local-force',
                'before-rng', 'before-vtable', 'before-player', 'before-node',
                'before-fallback', 'after-domain', 'missing-after', 'rng-kind', 'rng-count')
            for defect in defects:
                with self.subTest(source=source, record=target_record, defect=defect):
                    g = copy.deepcopy(f); rs = g[2]['records']; r = rs[target_record]
                    if defect == 'missing': del rs[target_record]
                    elif defect == 'extra': rs.append(copy.deepcopy(rs[-1])); rs[-1]['index'] += 1
                    elif defect == 'index': r['index'] += 1
                    elif defect == 'source': r['source'] = 'S2' if source == 'S1' else 'S1'
                    elif defect == 'kind': r['kind'] = 'query'
                    elif defect == 'helper': r['helper'] = '004BA345/event9-reaction-suffix'
                    elif defect == 'raw44': r['args']['raw44'] += 1
                    elif defect == 'next': r['args']['savedNextNodeId'] = 29
                    elif defect == 'subject': r['args']['subjectPointer'] = None
                    elif defect == 'force': r['args']['savedForcePointer']['id'] = 46
                    elif defect == 'target': r['args']['targetPointer'] = None
                    elif defect == 'troop': r['args']['troopPointer']['id'] = 999
                    elif defect == 'event': r['args']['event']['argument'] += 1
                    elif defect == 'manager': r['args']['managerIdentity'] = 'different'
                    elif defect == 'oldForce': r['args']['savedOldForceId'] = 0
                    elif defect == 'newForce': r['args']['savedNewForceId'] = 0
                    elif defect == 'scope': r['callStack'][-1]['locals']['visitIndex'] += 1
                    elif defect == 'local-force': r['callStack'][-1]['locals']['savedForcePointer']['id'] = 46
                    elif defect == 'before-rng': r['before']['rngState'] ^= 1
                    elif defect == 'before-vtable': row(r['before'], 0, 'forces')['vtableAddress'] = 0
                    elif defect == 'before-player': row(r['before'], 0, 'forces')['playerIndex'] = 7
                    elif defect == 'before-node': r['before']['troopListHead'] = None
                    elif defect == 'before-fallback': r['before'][FALLBACK]['positionX'] += 1
                    elif defect == 'after-domain': r['after']['forces'].clear()
                    elif defect == 'missing-after': del r['after']
                    elif defect == 'rng-kind': r['rngConsumption']['kind'] = 'assumed'
                    elif defect == 'rng-count': r['rngConsumption']['calls'] = -1
                    self.atomic_error(g)
        f = target_fixture(); Oracle(f).run()
        for key in ('messageId', 'troopPointer', 'targetPointer', 'displayTroopPointer', 'rawFlag', 'rawArgument'):
            g = copy.deepcopy(f)
            del g[2]['records'][0]['args']['presentationArgs'][key]
            self.atomic_error(g)
        for key in ('messageId', 'rawFlag', 'rawArgument'):
            g = copy.deepcopy(f); g[2]['records'][0]['args']['presentationArgs'][key] += 1
            self.atomic_error(g)

    def test_29_unknown_virtual_records_are_strictly_bound_and_boolean(self):
        for source, site in itertools.product(SOURCES, ('0047A6BC', '0047A6CC', '004BA35E', '004BA372', '004BA356')):
            f = target_fixture(source)
            if site in ('004BA35E', '004BA372'):
                set_force(f[0]['frame'], playerIndex=-1)
                set_force(f[0]['frame'], 1, vtableAddress=0)
                row(f[0]['frame'], 0, 'troops')['raw44'] = 1
            elif site == '004BA356':
                row(f[0]['frame'], 0, 'troops')['vtableAddress'] = 0
            else:
                set_force(f[0]['frame'], vtableAddress=0)
            Oracle(f).run()
            index = next(i for i, r in enumerate(f[2]['records']) if r['args'].get('site') == site)
            for invalid in (0, 1, -1, None, 'true', [], {}):
                g = copy.deepcopy(f); g[2]['records'][index]['result'] = invalid
                self.atomic_error(g)
            for defect in ('slot', 'site', 'pointer', 'scope', 'before', 'missing'):
                g = copy.deepcopy(f); r = g[2]['records'][index]
                if defect == 'slot': r['args']['virtualSlot'] = 64
                elif defect == 'site': r['args']['site'] = '004BA405'
                elif defect == 'pointer': r['args']['pointer'] = None
                elif defect == 'scope': r['callStack'][-1]['locals']['changed'] = True
                elif defect == 'before': row(r['before'], 0, 'forces')['vtableAddress'] ^= 1
                elif defect == 'missing': del g[2]['records'][index]
                self.atomic_error(g)

    def test_30_schema_force_vtable_and_explicit_event_memory_domain(self):
        for source in SOURCES:
            for bad in (-1, 0x100000000, True, 1.5, None):
                f = fixture(source=source)
                row(f[0]['frame'], 0, 'forces')['vtableAddress'] = bad
                self.atomic_error(f)
            for key in ('event9PresentationDomain', 'event9EventMemoryDomain', 'frameProfile'):
                f = fixture(source=source); del f[3][key]; self.atomic_error(f)
                f = fixture(source=source); f[3][key] = 'unsupported'; self.atomic_error(f)
            f = fixture(source=source); del row(f[0]['frame'], 0, 'forces')['vtableAddress']; self.atomic_error(f)
            f = fixture(source=source); row(f[0]['frame'], 0, 'forces')['valid'] = False; self.atomic_error(f)
            f = fixture(source=source); f[0]['frame']['mutableEventMemory'] = {'id': 9}; self.atomic_error(f)
            f = target_fixture(source); Oracle(f).run()
            for field in ('before', 'after'):
                g = copy.deepcopy(f)
                del row(g[2]['records'][0][field], 0, 'forces')['vtableAddress']
                self.atomic_error(g)

    def test_31_unknown_force_outside_gate_rejected_and_unreached_allowed(self):
        for source, entry in itertools.product(SOURCES, ('role-sort', 'capacity')):
            f = fixture(entry, source)
            set_force(f[0]['frame'], vtableAddress=0)
            self.atomic_defer(f, 'unsupported-noncanonical-force-outside-event9-presentation')
        for source, entry in itertools.product(SOURCES, ('position-pointer', 'force-legion', 'target-force')):
            # These paths never load the force row, even if they use its ID.
            f = fixture(entry, source)
            set_force(f[0]['frame'], vtableAddress=0)
            self.check_oracle(f)
        for source in SOURCES:
            f = target_fixture(source)
            set_force(f[0]['frame'], 1, vtableAddress=0)
            row(f[0]['frame'], 0, 'troops')['raw44'] = 1
            trace = self.check_oracle(f)
            self.assertEqual(virtual_sites(trace), [])

    def test_32_rollback_after_presentation_before_missing_reaction(self):
        for source in SOURCES:
            f = target_fixture(source)
            def effect(stage, after, context):
                after['rngState'] = 0x87654321
                after['data']['nested']['value'] = 99
                return 3
            Oracle(f, effect=effect).run()
            f[2]['records'].pop()
            self.atomic_error(f)
            f[3]['unknownEffects'] = 'reject'
            trace = self.atomic_defer(f, 'unresolved-effect:004BA411/event9-presentation')
            self.assertTrue(trace['observedEffects'][0]['deferred'])

    def test_33_partial_effects_roll_back_at_saved_node_failure_and_guard(self):
        for source in SOURCES:
            f = target_fixture(source)
            f[0]['frame']['troopListNodes'] = [node(17, 29), node(29, 17, None)]
            f[3]['event9NodeLimit'] = 3
            def effect(stage, after, context):
                after[FALLBACK]['positionY'] += 1
                after['rngState'] += 1
                return 1
            with self.assertRaisesRegex(ValueError, 'oracle node guard reached'):
                Oracle(f, effect=effect).run()
            trace = self.atomic_defer(f, 'engine-guard-event9-node-budget')
            self.assertEqual(len(reactions(trace)), 2)
            self.assertEqual(len(presentations(trace)), 2)
            f = target_fixture(source)
            f[0]['frame']['troopListNodes'] = [node(17, 29), node(29)]
            Oracle(f).run()
            f[2]['records'] = f[2]['records'][:2]
            f[2]['records'][-1]['after']['troopListNodes'] = [node(17)]
            self.atomic_error(f)

    def test_34_native_and_node_budget_exact_limit_and_unknown_reject(self):
        f = target_fixture(); Oracle(f).run()
        # The trace count is used only to exercise the configurable guard's
        # exact acceptance boundary, never to generate semantic expectations.
        budget = run(f)['nativeCalls']
        for limit in (1, budget - 1):
            f[3]['engineGuard']['maxNativeCalls'] = limit
            self.atomic_defer(f, 'engine-guard-native-call-budget')
        f[3]['engineGuard']['maxNativeCalls'] = budget
        self.assertTrue(run(f)['accepted'])
        f = fixture(); f[3]['unknownEffects'] = 'reject'
        self.atomic_defer(f, 'unresolved-effect:004BA432/event9-reaction')
        f = target_fixture(); set_force(f[0]['frame'], vtableAddress=0)
        f[3]['unknownEffects'] = 'reject'
        self.atomic_defer(f, 'unresolved-effect:004BA1D0/unknown-virtual')
        f = target_fixture(); f[3]['event9NodeLimit'] = 1
        self.check_oracle(f)

    def test_35_revision_replay_conflict_exhaustion_and_tamper(self):
        f = target_fixture(); trace = self.check_oracle(f)
        g = copy.deepcopy(f); g[0] = copy.deepcopy(trace['after'])
        repeated = run(g)
        self.assertTrue(repeated['replayed'])
        self.assertEqual(repeated['after'], g[0])
        g[3]['id'] += '-changed'
        self.atomic_defer(g, 'replay-payload-conflict')
        f[1]['expectedRevision'] += 1
        self.atomic_defer(f, 'revision-conflict')
        f[0]['revision'] = I32_MAX; f[1]['expectedRevision'] = I32_MAX
        self.atomic_error(f)
        for field in ('after', 'evidence', 'profileId', 'nativeResult', 'observedEffects'):
            for rehash in (False, True):
                t = copy.deepcopy(trace)
                if field == 'after': row(t[field]['frame'], 0, 'forces')['vtableAddress'] = 0
                elif field == 'evidence': t[field]['stockVerified'] = True
                elif field == 'observedEffects': t[field][0]['args']['presentationArgs']['rawFlag'] = 0
                else: t[field] = 'wrong'
                if rehash: t['traceHash'] = digest({k:v for k,v in t.items() if k != 'traceHash'})
                with self.assertRaises(ValueError): m.replay_native_event9_presentation(t)

    def test_36_prior_profile_is_unchanged_and_not_implicitly_upgraded(self):
        from check_native_event9_selection_profile import Oracle as OldOracle
        for source in SOURCES:
            old = selection_fixture(source=source)
            row(old[0]['frame'], 0, 'troops').update(rawOrder2C=1, rawTarget30=0)
            row(old[0]['frame'], 0, 'forces')['playerIndex'] = 0
            OldOracle(old).run()
            trace = previous.project_native_event9_selection(*old)
            self.assertEqual([r['helper'] for r in trace['observedEffects']], ['004BA345/event9-reaction-suffix'])
            self.assertNotIn('vtableAddress', row(trace['after']['frame'], 0, 'forces'))
            self.assertEqual(trace, previous.replay_native_event9_selection(trace))
            with self.assertRaises(ValueError): run(old)
            with self.assertRaises(ValueError): previous.project_native_event9_selection(*fixture())

    def test_37_oracle_calls_no_production_planner_projector_or_primitives(self):
        names = ('native_event9_presentation_profile', 'native_event9_selection_profile',
            'native_live_position_profile', 'native_troop_membership_profile',
            'native_tail_distance_profile', 'generic_facility_profile', 'live_zero_refund_profile',
            'officer_relocation_profile', 'base_ownership_events_profile',
            'empty_legion_redistribution_profile', 'return_route_target_force_profile',
            'native_roster_sort_profile', 'recursive_officer_return_profile')
        f = target_fixture(); set_force(f[0]['frame'], vtableAddress=0)
        with ExitStack() as stack:
            for name in names:
                module = importlib.import_module(name)
                for attr in dir(module):
                    if attr.startswith('project_') or attr == '_Planner':
                        stack.enter_context(patch.object(module, attr,
                            side_effect=AssertionError('production called by oracle')))
            for module_name, class_name in (
                    ('native_event9_presentation_primitives', 'NativeEvent9PresentationPrimitives'),
                    ('native_event9_selection_primitives', 'NativeEvent9SelectionPrimitives')):
                cls = getattr(importlib.import_module(module_name), class_name)
                for attr, value in vars(cls).items():
                    if callable(value):
                        stack.enter_context(patch.object(cls, attr,
                            side_effect=AssertionError('production primitive called by oracle')))
            expected = Oracle(f).run()
        self.assertEqual(expected.selected, [0])
        self.assertEqual([r['helper'] for r in expected.records][-2:],
                         ['004BA411/event9-presentation', '004BA432/event9-reaction'])

    def test_38_evidence_is_explicitly_bounded_and_honest(self):
        trace = self.check_oracle(target_fixture())
        for key in ('event9SelectionPreludeNative', 'event9LiveNodeTraversal',
                    'event9SavedNextBeforeCallback', 'event9ReactionSuffixObserved',
                    'event9PresentationDecisionNative', 'event9PresentationCombinedObserved'):
            self.assertTrue(trace['evidence'][key])
        for key in ('event9TailExecuted', 'presentationSegmentsExecuted', 'completeGameTransaction',
                    'stockVerified', 'vanillaVerified', 'callbacksAssumedNoninterfering',
                    'machineCodeExecuted', 'engineGuardIsOriginalRule',
                    'event9MutableEventMemorySupported', 'unknownForceDispatchOutsidePresentationSupported'):
            self.assertFalse(trace['evidence'][key])
        self.assertFalse(trace['rng']['globalConsumptionVerified'])
        self.assertEqual(trace['evidence']['event9EventMemoryDomain'], 'immutable-command-event-v1')
        self.assertEqual(trace['evidence']['event9ReactionStart'], '004BA432')
        self.assertEqual(trace['evidence']['canonicalForceVtable'], FORCE_VTABLE)

    def test_39_event9_composition_listener_before_head_observer_after_reaction(self):
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
                elif stage == 'event-observer': after['troopListNodes'] = []
                return 0
            trace = self.check_oracle(f, effect=effect)
            self.assertEqual(selected_troops(trace), [999])
            self.assertEqual([r['helper'] for r in trace['observedEffects']],
                ['005BBE30', '004BA411/event9-presentation', '004BA432/event9-reaction', 'observer.virtual1B4'])
            self.assertEqual(presentations(trace)[0]['callStack'][0]['helper'], '004BBAA0')

    def test_40_empty_non_event9_and_base_ownership_paths(self):
        for source, event_id in itertools.product(SOURCES, (8, 9, 10, 14)):
            f = target_fixture(source)
            f[1]['args']['id'] = event_id
            f[0]['frame']['troopListHead'] = None if event_id == 9 else 0xFFFFFFFF
            self.assertEqual(self.check_oracle(f)['observedEffects'], [])
        # Native16/18 arms exist, but they are outside this inherited public
        # event domain and are not silently accepted as an event9 no-op.
        for source, event_id in itertools.product(SOURCES, (16, 18)):
            f = target_fixture(source); f[1]['args']['id'] = event_id
            self.atomic_error(f)
        for source in SOURCES:
            f = fixture('base-ownership', source)
            f[0]['frame']['activePersonIds'] = []
            f[1]['args']['requestedLegionId'] = -1
            self.assertEqual(selected_troops(self.check_oracle(f)), [0])

    def test_41_seeded_mutable_force_and_node_sequences(self):
        rand = random.Random(0x4BA411)
        for index in range(48):
            f = target_fixture(SOURCES[index % 2]); w = f[0]['frame']
            ids = [901, 11, 700, 53]; rand.shuffle(ids)
            w['troopListHead'] = ids[0]
            w['troopListNodes'] = [node(nid, ids[i+1] if i+1 < len(ids) else None,
                rand.choice((0, 999, None))) for i, nid in enumerate(ids)]
            rand.shuffle(w['troopListNodes'])
            set_force(w, 46, rulerId=rand.choice((-1, 0, 1099, 1100)),
                      playerIndex=rand.choice((-1, 0, 7, 8)), vtableAddress=rand.choice((0, FORCE_VTABLE)))
            set_force(w, playerIndex=rand.choice((-1, 0, 7, 8)), vtableAddress=rand.choice((0, FORCE_VTABLE)))
            for tid in (0, 999):
                row(w, tid, 'troops').update(raw44=rand.choice((-1, 0, 46, 47)),
                    rawOrder2C=rand.choice((0, 1, 4, 6)), rawTarget30=0,
                    vtableAddress=rand.choice((0, VTABLE)))
            def effect(stage, after, context):
                if stage == 'event9-unknown-virtual':
                    after['rngState'] = (after['rngState'] + 0x12345) & 0xFFFFFFFF
                    if context['args']['virtualSlot'] == 64:
                        return dict(result=-1, count=1)
                    return dict(result=(context['index'] + index) % 3 != 0, count=1)
                if stage == 'event9-presentation':
                    set_force(after, 46, playerIndex=7)
                    after[FALLBACK]['positionX'] += 1
                if stage == 'event9-reaction':
                    set_force(after, playerIndex=0)
                    if index % 3 == 0 and context['args']['savedNextNodeId'] is not None:
                        row(after, context['args']['savedNextNodeId'], 'troopListNodes')['nextNodeId'] = None
                return 0
            self.check_oracle(f, effect=effect, replay=index % 8 == 0)

    def test_42_evolving_commits_reobserve_force_vtable_and_live_list(self):
        f = target_fixture()
        f[0]['frame']['troopListNodes'] = [node(17, 29), node(29, None, 999)]
        for turn in range(6):
            f[1].update(id='event9-presentation-evolving-' + str(turn), expectedRevision=turn)
            def effect(stage, after, context):
                if stage == 'event9-reaction':
                    after[FALLBACK]['positionY'] += 1
                    after['troopListHead'] = 29 if turn % 2 == 0 else 17
                    set_force(after, playerIndex=7 if turn % 2 else -1,
                              vtableAddress=0 if turn % 2 else FORCE_VTABLE)
                return 0
            trace = self.check_oracle(f, effect=effect)
            self.assertEqual(trace['after']['revision'], turn + 1)
            f[0] = copy.deepcopy(trace['after'])

    @classmethod
    def tearDownClass(cls):
        print('Independent oracle coverage: %d accepted semantic cases; %d atomic rejection cases' %
              (cls.oracle_cases, cls.rejection_cases))


if __name__ == '__main__':
    unittest.main()
