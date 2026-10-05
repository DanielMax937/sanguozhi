"""Independent source oracle for the bounded event9 troop-selection prefix.

The expected frames and complete observation bindings are constructed by this
test-only transcription of S1/S2 004BA1D0 and 004922C0. No production planner,
primitive, projector or trace constructs expected values. Callback responses are
explicit synthetic evidence, not claims about native reactions or runtime data.
The unresolved 004BA345..004BA467 suffix includes virtual+48 and presentation.
"""
import copy
import importlib
import itertools
import json
import random
import unittest
from contextlib import ExitStack
from unittest.mock import patch

import native_event9_selection_profile as m
import native_live_position_profile as previous
from check_native_live_position_profile import (
    Oracle as PositionOracle, fixture as position_fixture, DIRECT, FALLBACK)
from check_native_tail_distance_profile import ENTRIES
from check_officer_relocation_profile import TERRITORY_BASE
from check_return_route_target_force_profile import map_cell
from check_recursive_officer_return_profile import row, refresh_people, digest


SOURCES = ('S1', 'S2')
PROFILE = 'source-idb-S1-S2-native-event9-selection-v1'
FRAME = 'source-idb-S1-S2-native-event9-selection-frame-v1'
DOMAIN = 'canonical-live-event9-selection-v1'
VTABLE = 0x0079CC18
I32_MIN, I32_MAX = -2147483648, 2147483647
NEW_TROOP_FIELDS = ('raw44', 'rawOrder2C', 'rawTarget30', 'rawTargetType34',
                    'targetPosition38')


def node(nid, next_id=None, troop_id=0, readable=True, writable=True):
    return dict(id=nid, nextNodeId=next_id, troopId=troop_id,
                readable=readable, writable=writable)


def selection_fields(troop, **changes):
    troop.update(raw44=0, rawOrder2C=0, rawTarget30=-1, rawTargetType34=0,
                 targetPosition38=dict(positionX=-11, positionY=23))
    troop.update(changes)
    return troop


def fixture(entry='event9-selection', source='S1', **kw):
    f = position_fixture('event' if entry == 'event9-selection' else entry,
                         source, **kw)
    w = f[0]['frame']
    for t in w['troops']:
        selection_fields(t)
    w.update(troopListHead=17, troopListNodes=[node(17)])
    f[1]['id'] = 'native-event9-selection-1'
    f[3].update(id='native-event9-selection-observe-v1', frameProfile=FRAME,
                event9SelectionDomain=DOMAIN, event9NodeLimit=1000)
    if entry == 'event9-selection':
        f[1].update(entry=entry, args=dict(id=9, subjectType='building',
                                         subjectId=0, argument=417))
    elif entry == 'movement-origin':
        map_cell(w, 2, 7, 0)
    return f


def run(f):
    return m.project_native_event9_selection(*f)


def pointer(storage, rid):
    return None if rid is None else dict(storage=storage, id=rid)


def suffixes(trace):
    return [r for r in trace['observedEffects']
            if r['helper'] == '004BA345/event9-reaction-suffix']


def selected_troops(trace):
    return [r['args']['troopPointer']['id'] for r in suffixes(trace)]


class Oracle(PositionOracle):
    """Literal source-ordered interpreter, with independently built bindings."""

    def __init__(self, *args, **kw):
        super().__init__(*args, **kw)
        self.selection_visits = []
        self.selected = []

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
        return super().boundary('event9-unknown-virtual', 'effect-query',
            '004BA1D0/unknown-virtual',
            dict(pointer=address, virtualSlot=slot, site=site),
            -1 if slot == 64 else True)

    def valid_pointer(self, address, site):
        if address is None:
            return False
        record = self.get(address['storage'], address['id'])
        if address['storage'] == 'troops':
            if record['vtableAddress'] != VTABLE:
                return self.virtual(address, 8, site)
            return self.canonical_troop_valid(address['id'])
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
                                super().boundary('event9-reaction-suffix', 'effect',
                                    '004BA345/event9-reaction-suffix', dict(
                                        event=copy.deepcopy(event), troopPointer=troop_address,
                                        targetPointer=target, raw44=raw,
                                        savedOldForceId=-1, savedNewForceId=-1,
                                        subjectPointer=subject, managerIdentity='entry-ecx',
                                        savedNextNodeId=saved_next))
                    cursor = saved_next
                visit += 1

    def run(self):
        if self.f[1]['entry'] != 'event9-selection':
            return super().run()
        try:
            self.selection(self.f[1]['args'])
        finally:
            self.f[2]['records'] = copy.deepcopy(self.records)
        return self


class NativeEvent9SelectionTests(unittest.TestCase):
    maxDiff = 12000

    def check_oracle(self, f, replay=True, **kw):
        expected = Oracle(f, **kw).run()
        before = copy.deepcopy(f)
        trace = run(f)
        self.assertTrue(trace['accepted'], trace['reason'])
        self.assertEqual(trace['profileId'], PROFILE)
        self.assertEqual(trace['frameProfileId'], FRAME)
        self.assertEqual(trace['after']['frame'], expected.w)
        self.assertEqual(trace['nativeResult'], expected.native_result)
        self.assertEqual(trace['events'], expected.events)
        self.assertEqual(trace['returnCalls'], expected.return_calls)
        self.assertEqual(trace['observedEffects'],
                         [r for r in expected.records if r['kind'] != 'query'])
        self.assertEqual(trace['queries'],
                         [r for r in expected.records if r['kind'] == 'query'])
        self.assertEqual(trace['rng']['localCalls'], expected.local_rng)
        self.assertEqual(selected_troops(trace), expected.selected)
        self.assertEqual([(s['currentNodeId'], s['savedNextNodeId'], s['troopPointer'])
                          for s in trace['steps'] if s['helper'] == '004922C0/advance'],
                         expected.selection_visits)
        self.assertEqual(trace['after']['revision'], f[0]['revision'] + 1)
        self.assertEqual(f, before)
        if replay:
            self.assertEqual(trace, m.replay_native_event9_selection(
                json.loads(json.dumps(trace))))
        return trace

    def atomic_error(self, f):
        before = copy.deepcopy(f)
        with self.assertRaises(ValueError):
            run(f)
        self.assertEqual(f, before)

    def atomic_defer(self, f, reason):
        before = copy.deepcopy(f)
        trace = run(f)
        self.assertFalse(trace['accepted'])
        self.assertEqual(trace['reason'], reason)
        self.assertEqual(trace['after'], f[0])
        self.assertEqual(trace['events'], [])
        self.assertEqual(trace['steps'], [])
        self.assertEqual(trace['queries'], [])
        self.assertEqual(f, before)
        self.assertEqual(trace, m.replay_native_event9_selection(trace))
        return trace

    def test_01_all_inherited_entries_both_sources(self):
        for source, entry in itertools.product(SOURCES,
                ENTRIES + ('troop-member',) + DIRECT):
            with self.subTest(source=source, entry=entry):
                self.check_oracle(fixture(entry, source))

    def test_02_empty_list_and_non_event9_tail_noops(self):
        for source, event_id in itertools.product(SOURCES, (8, 9, 10, 14)):
            f = fixture(source=source)
            f[1]['args']['id'] = event_id
            f[0]['frame']['troopListHead'] = None
            trace = self.check_oracle(f)
            self.assertEqual(trace['observedEffects'], [])
            self.assertEqual(trace['events'], [])
            if event_id != 9:
                # Unreadable head is not dereferenced on this dispatch route.
                f[0]['frame']['troopListHead'] = 0xffffffff
                self.check_oracle(f)

    def test_03_duplicate_troops_and_non_numeric_node_order(self):
        for source in SOURCES:
            f = fixture(source=source)
            f[0]['frame'].update(troopListHead=90, troopListNodes=[
                node(4, 63, 0), node(63, None, 999), node(90, 4, 0)])
            trace = self.check_oracle(f)
            self.assertEqual(selected_troops(trace), [0, 0, 999])
            self.assertEqual([r['callStack'][-1]['locals']['currentNodeId']
                              for r in suffixes(trace)], [90, 4, 63])

    def test_04_null_troop_and_invalid_leader_short_circuit(self):
        for source, leader in itertools.product(SOURCES,
                (I32_MIN, -1, 1100, I32_MAX, 7, 9)):
            f = fixture(source=source)
            w = f[0]['frame']
            w['troopListNodes'] = [node(17, 18, None), node(18)]
            row(w, 0, 'troops').update(leaderId=leader, raw44=I32_MAX)
            if leader in (7, 9):
                row(w, leader).update(status=6, rawDword17C=0)
                refresh_people(w)
            trace = self.check_oracle(f)
            self.assertEqual(suffixes(trace), [])

    def test_05_signed_deputy_bounds_and_raw_person_validity(self):
        for source, deputies in itertools.product(SOURCES,
                ((I32_MIN, -1), (1099, 0), (1100, -1), (-1, 1100))):
            f = fixture(source=source)
            row(f[0]['frame'], 0, 'troops')['deputyIds'] = list(deputies)
            trace = self.check_oracle(f)
            self.assertEqual(bool(suffixes(trace)), all(x < 1100 for x in deputies))
        for source, status, raw in itertools.product(SOURCES,
                (-1, 0, 3, 5, 6, 7, 8, 9, I32_MAX), (0, 1)):
            f = fixture(source=source)
            row(f[0]['frame']).update(status=status, rawDword17C=raw)
            refresh_people(f[0]['frame'])
            trace = self.check_oracle(f, replay=False)
            self.assertEqual(bool(suffixes(trace)),
                raw != 0 or status in (0, 1, 2, 3, 4, 5, 7))

    def test_06_raw44_is_signed_range_gate_not_force_validity(self):
        for source, raw in itertools.product(SOURCES,
                (I32_MIN, -1, 0, 1, 46, 47, I32_MAX)):
            f = fixture(source=source)
            row(f[0]['frame'], 0, 'troops')['raw44'] = raw
            trace = self.check_oracle(f)
            self.assertEqual(bool(suffixes(trace)), 0 <= raw <= 46)
            if suffixes(trace):
                self.assertEqual(suffixes(trace)[0]['args']['raw44'], raw)
        # Passing raw44=46 does not require a force46 manager row yet: its
        # getter belongs to the unresolved suffix starting at004BA345.
        self.assertNotIn(46, [r['id'] for r in f[0]['frame']['forces']])

    def test_07_head_replacement_does_not_restart_scan(self):
        for source in SOURCES:
            f = fixture(source=source)
            w = f[0]['frame']
            w['troopListNodes'] = [node(17, 29), node(29, None, 999), node(55)]
            def effect(stage, after, context):
                if stage == 'event9-reaction-suffix':
                    after['troopListHead'] = 55
                    row(after, 17, 'troopListNodes')['nextNodeId'] = 55
                return 0
            trace = self.check_oracle(f, effect=effect)
            self.assertEqual(selected_troops(trace), [0, 999])

    def test_08_current_node_removed_and_saved_node_replaced(self):
        for source in SOURCES:
            f = fixture(source=source)
            w = f[0]['frame']
            w['troopListNodes'] = [node(17, 29), node(29, None, 0), node(55, None, 0)]
            def effect(stage, after, context):
                if stage == 'event9-reaction-suffix' and context['index'] == 0:
                    after['troopListNodes'] = [node(29, 55, 999), node(55)]
                    after['troopListHead'] = 55
                return 0
            trace = self.check_oracle(f, effect=effect)
            self.assertEqual(selected_troops(trace), [0, 999, 0])
            self.assertNotIn(17, [n['id'] for n in trace['after']['frame']['troopListNodes']])

    def test_09_current_node_next_change_cannot_skip_saved_cursor(self):
        for source in SOURCES:
            f = fixture(source=source)
            w = f[0]['frame']
            w['troopListNodes'] = [node(17, 29), node(29, 55, 999), node(55)]
            def effect(stage, after, context):
                if stage == 'event9-reaction-suffix' and context['index'] == 0:
                    row(after, 17, 'troopListNodes')['nextNodeId'] = None
                    row(after, 29, 'troopListNodes')['nextNodeId'] = None
                return 0
            trace = self.check_oracle(f, effect=effect)
            self.assertEqual(selected_troops(trace), [0, 999])

    def test_10_callback_mutates_complete_frame_and_rng(self):
        for source in SOURCES:
            f = fixture(source=source)
            def effect(stage, after, context):
                if stage == 'event9-reaction-suffix':
                    after['rngState'] = 0x12345678
                    after[FALLBACK]['positionY'] = -88
                    row(after, 999, 'troops')['raw44'] = 46
                    after['data']['nested']['value'] = 7
                    return 4
                return 0
            trace = self.check_oracle(f, effect=effect)
            self.assertEqual(trace['rng']['observedCalls'], 4)
            self.assertEqual(trace['rng']['finalState'], 0x12345678)
            self.assertEqual(trace['rng']['localCalls'], 0)
            self.assertEqual(trace['after']['frame'][FALLBACK]['positionY'], -88)

    def test_11_cyclic_nodes_guard_is_explicit_and_atomic(self):
        for source in SOURCES:
            f = fixture(source=source)
            f[0]['frame']['troopListNodes'] = [node(17, 17, None)]
            f[3]['event9NodeLimit'] = 3
            self.atomic_defer(f, 'engine-guard-event9-node-budget')

    def test_12_unreadable_node_defers_missing_node_errors(self):
        for source in SOURCES:
            for permission in ('readable', 'writable'):
                f = fixture(source=source)
                row(f[0]['frame'], 17, 'troopListNodes')[permission] = False
                self.atomic_defer(f, 'unsupported-event9-list-node-probe')
            f[0]['frame']['troopListNodes'] = []
            self.atomic_error(f)

    def test_13_schema_rejects_missing_and_wrong_width_fields(self):
        for key in NEW_TROOP_FIELDS:
            f = fixture()
            del row(f[0]['frame'], 0, 'troops')[key]
            self.atomic_error(f)
        for key in ('troopListHead', 'troopListNodes'):
            f = fixture()
            del f[0]['frame'][key]
            self.atomic_error(f)
        for key, values in (
                ('raw44', (I32_MIN-1, I32_MAX+1, True, None)),
                ('rawOrder2C', (I32_MIN-1, I32_MAX+1, True, 0.1)),
                ('rawTargetType34', (I32_MIN-1, I32_MAX+1, True, None)),
                ('rawTarget30', (-32769, 32768, True, 0.1))):
            for value in values:
                f = fixture()
                row(f[0]['frame'], 0, 'troops')[key] = value
                self.atomic_error(f)
        for key, value in itertools.product(('positionX', 'positionY'),
                                            (-32769, 32768, True, None)):
            f = fixture()
            row(f[0]['frame'], 0, 'troops')['targetPosition38'][key] = value
            self.atomic_error(f)
        for value in (0, -1, 0x100000000, True, 1.5):
            f = fixture(); f[0]['frame']['troopListHead'] = value
            self.atomic_error(f)
        for key, value in (('id', 0), ('nextNodeId', 0), ('troopId', -1),
                           ('troopId', 1000), ('readable', 1)):
            f = fixture()
            row(f[0]['frame'], 17, 'troopListNodes')[key] = value
            self.atomic_error(f)
        f = fixture()
        f[0]['frame']['troopListNodes'].append(node(17))
        self.atomic_error(f)
        for key in ('event9SelectionDomain', 'event9NodeLimit', 'frameProfile'):
            f = fixture(); del f[3][key]; self.atomic_error(f)
        for value in (0, 100001, True, None):
            f = fixture(); f[3]['event9NodeLimit'] = value; self.atomic_error(f)

    def test_14_revision_replay_conflict_exhaustion_and_tamper(self):
        f = fixture(); trace = self.check_oracle(f)
        g = copy.deepcopy(f); g[0] = copy.deepcopy(trace['after'])
        repeated = run(g)
        self.assertTrue(repeated['replayed'])
        self.assertEqual(repeated['after'], g[0])
        g[3]['id'] += '-changed'
        self.atomic_defer(g, 'replay-payload-conflict')
        f[1]['expectedRevision'] += 1
        self.atomic_defer(f, 'revision-conflict')
        f[0]['revision'] = I32_MAX
        f[1]['expectedRevision'] = I32_MAX
        self.atomic_error(f)
        for field in ('after', 'evidence', 'profileId', 'nativeResult'):
            g = copy.deepcopy(trace)
            if field == 'after': g[field]['frame']['troopListHead'] = None
            elif field == 'evidence': g[field]['event9TailExecuted'] = True
            else: g[field] = 'wrong'
            for rehash in (False, True):
                if rehash:
                    g['traceHash'] = digest({k:v for k,v in g.items() if k != 'traceHash'})
                with self.assertRaises(ValueError):
                    m.replay_native_event9_selection(g)

    def test_15_full_boundary_bindings_reject_stale_or_unused_data(self):
        f = fixture(); Oracle(f).run()
        for defect in ('missing', 'extra', 'source', 'kind', 'helper', 'raw44',
                       'next', 'subject', 'scope', 'before-node', 'before-troop',
                       'before-fallback', 'bad-after-domain'):
            g = copy.deepcopy(f)
            rs = g[2]['records']; r = rs[0]
            if defect == 'missing': rs.clear()
            elif defect == 'extra': rs.append(copy.deepcopy(r)); rs[-1]['index'] += 1
            elif defect == 'source': r['source'] = 'S2'
            elif defect == 'kind': r['kind'] = 'query'
            elif defect == 'helper': r['helper'] = '004BA1D0'
            elif defect == 'raw44': r['args']['raw44'] += 1
            elif defect == 'next': r['args']['savedNextNodeId'] = 29
            elif defect == 'subject': r['args']['subjectPointer'] = None
            elif defect == 'scope': r['callStack'][-1]['locals']['visitIndex'] += 1
            elif defect == 'before-node': r['before']['troopListHead'] = None
            elif defect == 'before-troop': row(r['before'], 0, 'troops')['rawOrder2C'] = 1
            elif defect == 'before-fallback': r['before'][FALLBACK]['positionX'] += 1
            elif defect == 'bad-after-domain': r['after']['troops'].pop()
            self.atomic_error(g)

    def test_16_legacy_api_keeps_whole_event9_observation(self):
        for source in SOURCES:
            old = position_fixture('event', source)
            old[1]['args'] = dict(id=9, subjectType='building', subjectId=0, argument=417)
            old[0]['frame']['activePersonIds'] = []
            PositionOracle(old).run()
            trace = previous.project_native_live_position(*old)
            self.assertEqual([r['helper'] for r in trace['observedEffects']], ['004BA1D0'])
            self.assertNotIn('troopListNodes', trace['after']['frame'])
            self.assertFalse(trace['evidence']['event9TailExecuted'])
            self.assertEqual(trace, previous.replay_native_live_position(trace))
            with self.assertRaises(ValueError): run(old)
            with self.assertRaises(ValueError): previous.project_native_live_position(*fixture())

    def test_17_oracle_never_calls_production_planner_or_primitives(self):
        names = ('native_event9_selection_profile', 'native_live_position_profile',
            'native_troop_membership_profile', 'native_tail_distance_profile',
            'generic_facility_profile', 'live_zero_refund_profile',
            'officer_relocation_profile', 'base_ownership_events_profile',
            'empty_legion_redistribution_profile', 'return_route_target_force_profile',
            'native_roster_sort_profile', 'recursive_officer_return_profile')
        f = fixture()
        with ExitStack() as stack:
            for name in names:
                mod = importlib.import_module(name)
                for attr in dir(mod):
                    if attr.startswith('project_') or attr == '_Planner':
                        stack.enter_context(patch.object(mod, attr,
                            side_effect=AssertionError('production called by oracle')))
            expected = Oracle(f).run()
        self.assertEqual(expected.selected, [0])

    def test_18_claims_remain_bounded_to_selection_prefix(self):
        trace = self.check_oracle(fixture())
        for key in ('event9SelectionPreludeNative', 'event9LiveNodeTraversal',
                    'event9SavedNextBeforeCallback', 'event9ReactionSuffixObserved'):
            self.assertTrue(trace['evidence'][key])
        for key in ('event9TailExecuted', 'presentationSegmentsExecuted',
                    'completeGameTransaction', 'stockVerified', 'vanillaVerified',
                    'callbacksAssumedNoninterfering', 'machineCodeExecuted',
                    'engineGuardIsOriginalRule'):
            self.assertFalse(trace['evidence'][key])
        self.assertFalse(trace['rng']['globalConsumptionVerified'])
        self.assertFalse(any(s['helper'] == '004BA356/virtual48'
                             for s in trace['steps']))

    def test_19_source_order_table_and_unsigned_order_bounds(self):
        for source, order in itertools.product(SOURCES,
                (I32_MIN, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, I32_MAX)):
            f = fixture(source=source)
            t = row(f[0]['frame'], 0, 'troops')
            t.update(rawOrder2C=order, rawTarget30=1, rawTargetType34=0,
                     targetPosition38=dict(positionX=2, positionY=7))
            map_cell(f[0]['frame'], 2, 7, 1 << 5)
            trace = self.check_oracle(f, replay=order in (-1, 2, 6))
            self.assertEqual(selected_troops(trace), [] if 1 <= order <= 10 else [0])

    def test_20_typed_targets_null_and_canonical_casts(self):
        for source, kind in itertools.product(SOURCES,
                (I32_MIN, -1, 0, 1, 2, 3, 4, I32_MAX)):
            f = fixture(source=source)
            target_id = 7 if kind == 3 else 0
            row(f[0]['frame'], 0, 'troops').update(rawOrder2C=6,
                rawTargetType34=kind, rawTarget30=target_id,
                targetPosition38=dict(positionX=2, positionY=7))
            map_cell(f[0]['frame'], 2, 7, 0)
            trace = self.check_oracle(f)
            self.assertEqual(selected_troops(trace), [0])
            self.assertEqual(suffixes(trace)[0]['args']['targetPointer'],
                pointer('buildings', 0) if kind in (0, 2) else None)

    def test_21_signed_target_endpoints_and_invalid_building(self):
        for source, target in itertools.product(SOURCES,
                (-32768, -1, 0, 86, 16383, 16384, 32767)):
            f = fixture(source=source)
            row(f[0]['frame'], 0, 'troops').update(rawOrder2C=4, rawTarget30=target)
            if 0 <= target <= 16383:
                f[1]['args']['subjectId'] = target
            trace = self.check_oracle(f)
            self.assertEqual(selected_troops(trace), [0])
            self.assertEqual(suffixes(trace)[0]['args']['targetPointer'],
                pointer('buildings', target) if 0 <= target <= 16383 else None)
        for kind in (-1, 64, I32_MAX):
            f = fixture()
            row(f[0]['frame'], 0, 'troops').update(rawOrder2C=1, rawTarget30=1)
            row(f[0]['frame'], 1, 'buildings').update(kind=kind, valid=False)
            self.assertEqual(selected_troops(self.check_oracle(f)), [0])

    def test_22_unequal_target_force_minus_one_and_live_leader_force(self):
        for source, target_lid, actor_lid in itertools.product(SOURCES, (0, -1), (0, -1)):
            f = fixture(source=source)
            w = f[0]['frame']
            row(w, 0, 'troops').update(rawOrder2C=1, rawTarget30=1, raw44=46)
            row(w, 1, 'buildings')['legionId'] = target_lid
            row(w, 7)['rawLegionId'] = actor_lid
            trace = self.check_oracle(f)
            self.assertEqual(selected_troops(trace), [0] if target_lid == actor_lid == -1 else [])
            force_steps = [s['helper'] for s in trace['steps']
                           if s['helper'] in ('004BA30A/force', '004BA326/force')]
            self.assertEqual(force_steps, ['004BA30A/force'] if target_lid == -1
                             else ['004BA30A/force', '004BA326/force'])

    def test_23_subject_cast_is_type_only_and_saved_identity(self):
        for source, subject_type in itertools.product(SOURCES, ('null', 'person', 'building')):
            f = fixture(source=source)
            f[1]['args'].update(subjectType=subject_type,
                subjectId=None if subject_type == 'null' else 7 if subject_type == 'person' else 0)
            row(f[0]['frame'], 0, 'troops').update(rawOrder2C=1, rawTarget30=0)
            trace = self.check_oracle(f)
            self.assertEqual(selected_troops(trace), [0] if subject_type == 'building' else [])
        f = fixture()
        row(f[0]['frame'], 0, 'buildings').update(kind=-1, valid=False)
        trace = self.check_oracle(f)
        self.assertEqual(suffixes(trace)[0]['args']['subjectPointer'], pointer('buildings', 0))

    def test_24_target_position_signed_linear_address_and_negative_table(self):
        for source, x, y, code in itertools.product(SOURCES,
                (0, 1), (-1, 7, 200), (0, 90)):
            f = fixture(source=source)
            row(f[0]['frame'], 0, 'troops').update(rawOrder2C=2,
                targetPosition38=dict(positionX=x, positionY=y))
            index = x * 200 + y
            if index < 0:
                self.atomic_defer(f, 'unsupported-event9-target-map-read-domain')
                continue
            map_cell(f[0]['frame'], x, y, 0xABCD0000 | (code << 5) | 31)
            target = abs(TERRITORY_BASE[code])
            f[1]['args']['subjectId'] = target
            trace = self.check_oracle(f, replay=False)
            self.assertEqual(suffixes(trace)[0]['args']['targetPointer'], pointer('buildings', target))
            loaded = next(s for s in trace['steps'] if s['helper'] == '00495DEE/packed-position')
            self.assertEqual(loaded['mapIndex'], index)
            self.assertTrue(loaded['singleDwordRead'])
        f = fixture()
        row(f[0]['frame'], 0, 'troops').update(rawOrder2C=2,
            targetPosition38=dict(positionX=200, positionY=0))
        self.atomic_defer(f, 'unsupported-event9-target-map-read-domain')

    def test_25_unknown_initial_validity_replaces_live_row(self):
        for source in SOURCES:
            f = fixture(source=source)
            row(f[0]['frame'], 0, 'troops')['vtableAddress'] = 0
            def effect(stage, after, context):
                if stage == 'event9-unknown-virtual':
                    self.assertEqual(context['args']['site'], '004BA2A8')
                    row(after, 0, 'troops').update(vtableAddress=VTABLE, raw44=46,
                        rawOrder2C=1, rawTargetType34=0, rawTarget30=0)
                    return dict(result=True, count=0)
                return 0
            trace = self.check_oracle(f, effect=effect)
            self.assertEqual(selected_troops(trace), [0])
            self.assertEqual(suffixes(trace)[0]['args']['raw44'], 46)
            self.assertEqual(suffixes(trace)[0]['args']['targetPointer'], pointer('buildings', 0))

    def test_26_saved_order_and_raw44_survive_late_validity_mutation(self):
        for source in SOURCES:
            f = fixture(source=source)
            row(f[0]['frame'], 0, 'troops').update(vtableAddress=0,
                rawOrder2C=1, rawTargetType34=0, rawTarget30=1)
            def effect(stage, after, context):
                if stage == 'event9-unknown-virtual' and context['args']['site'] == '00495D00':
                    row(after, 0, 'troops').update(vtableAddress=VTABLE, rawOrder2C=0,
                        raw44=47, rawTargetType34=0, rawTarget30=0)
                return 0
            trace = self.check_oracle(f, effect=effect)
            self.assertEqual(selected_troops(trace), [0])
            self.assertEqual(suffixes(trace)[0]['args']['raw44'], 0)
            self.assertEqual(suffixes(trace)[0]['args']['targetPointer'], pointer('buildings', 0))
            self.assertEqual(row(trace['after']['frame'], 0, 'troops')['rawOrder2C'], 0)

    def test_27_unknown_target_force_second_read_and_actor_force(self):
        for source in SOURCES:
            f = fixture(source=source)
            w = f[0]['frame']
            row(w, 0, 'troops').update(rawOrder2C=1, rawTargetType34=1, rawTarget30=999)
            row(w, 999, 'troops')['vtableAddress'] = 0
            row(w, 7)['rawLegionId'] = -1
            def effect(stage, after, context):
                if stage == 'event9-unknown-virtual':
                    site = context['args']['site']
                    if site == '004BA307':
                        row(after, 0, 'troops').update(raw44=I32_MIN,
                            rawTarget30=0, rawTargetType34=0)
                        return dict(result=12, count=1)
                    if site == '004BA323':
                        return dict(result=-1, count=2)
                return 0
            trace = self.check_oracle(f, effect=effect)
            self.assertEqual(selected_troops(trace), [0])
            calls = [r['args']['site'] for r in trace['observedEffects']
                     if r['helper'] == '004BA1D0/unknown-virtual']
            self.assertEqual(calls, ['004BA2E3', '004BA2F1', '004BA307', '004BA323'])
            self.assertEqual(suffixes(trace)[0]['args']['raw44'], 0)
            self.assertEqual(suffixes(trace)[0]['args']['targetPointer'], pointer('troops', 999))
            self.assertEqual(trace['rng']['observedCalls'], 3)

    def test_28_unknown_target_cast_stays_saved_after_vtable_replacement(self):
        for source in SOURCES:
            f = fixture(source=source)
            w = f[0]['frame']
            row(w, 0, 'troops').update(rawOrder2C=1, rawTargetType34=1, rawTarget30=999)
            row(w, 999, 'troops').update(vtableAddress=0, leaderId=9)
            row(w, 7)['rawLegionId'] = -1
            row(w, 9)['rawLegionId'] = -1
            def effect(stage, after, context):
                if stage == 'event9-unknown-virtual' and context['args']['site'] == '004BA2F1':
                    row(after, 999, 'troops')['vtableAddress'] = VTABLE
                return 0
            trace = self.check_oracle(f, effect=effect)
            self.assertEqual(selected_troops(trace), [0])
            self.assertEqual(suffixes(trace)[0]['args']['targetPointer'], pointer('troops', 999))
            self.assertEqual([r['args']['site'] for r in trace['observedEffects']
                              if r['helper'] == '004BA1D0/unknown-virtual'],
                             ['004BA2E3', '004BA2F1'])

    def test_29_unknown_results_missing_record_and_strict_boolean(self):
        for result in (0, 1, None, 'true', -1):
            f = fixture()
            row(f[0]['frame'], 0, 'troops')['vtableAddress'] = 0
            Oracle(f).run()
            f[2]['records'][0]['result'] = result
            self.atomic_error(f)
        f = fixture()
        row(f[0]['frame'], 0, 'troops')['vtableAddress'] = 0
        self.atomic_error(f)
        def effect(stage, after, context):
            return dict(result=False, count=0) if stage == 'event9-unknown-virtual' else 0
        trace = self.check_oracle(f, effect=effect)
        self.assertEqual(selected_troops(trace), [])
        for value in (I32_MIN-1, I32_MAX+1, True, None, 1.5):
            f = fixture()
            row(f[0]['frame'], 0, 'troops').update(rawOrder2C=1,
                rawTargetType34=1, rawTarget30=999)
            row(f[0]['frame'], 999, 'troops')['vtableAddress'] = 0
            Oracle(f).run()
            force = next(r for r in f[2]['records'] if r['args'].get('virtualSlot') == 64)
            force['result'] = value
            self.atomic_error(f)

    def test_30_event9_listeners_precede_head_capture_observer_follows(self):
        for source in SOURCES:
            f = fixture('event', source)
            w = f[0]['frame']
            f[1]['args'] = dict(id=9, subjectType='building', subjectId=0, argument=417)
            row(w).update(missionId=0, homeBaseId=0)
            w.update(observerPresent=True, troopListNodes=[node(17), node(29, None, 999)])
            def effect(stage, after, context):
                if stage == 'ownership-handler': after['troopListHead'] = 29
                elif stage == 'event9-reaction-suffix': after['troopListHead'] = None
                elif stage == 'event-observer': after['troopListNodes'] = []
                return 0
            trace = self.check_oracle(f, effect=effect)
            self.assertEqual(selected_troops(trace), [999])
            self.assertEqual([r['helper'] for r in trace['observedEffects']],
                ['005BBE30', '004BA345/event9-reaction-suffix', 'observer.virtual1B4'])
            self.assertEqual(trace['events'][0]['event']['id'], 9)
            self.assertEqual(suffixes(trace)[0]['callStack'][0]['helper'], '004BBAA0')

    def test_31_event10_noop_and_base_ownership_event9_composition(self):
        for source in SOURCES:
            f = fixture('event', source)
            f[1]['args'] = dict(id=10, subjectType='building', subjectId=0, argument=417)
            f[0]['frame'].update(troopListHead=0xffffffff, activePersonIds=[], observerPresent=True)
            trace = self.check_oracle(f)
            self.assertEqual([r['helper'] for r in trace['observedEffects']], ['observer.virtual1B4'])
            f = fixture('base-ownership', source)
            f[0]['frame']['activePersonIds'] = []
            f[1]['args']['requestedLegionId'] = -1
            trace = self.check_oracle(f)
            self.assertEqual([e['event']['id'] for e in trace['events']], [9])
            self.assertEqual(selected_troops(trace), [0])
            self.assertEqual(suffixes(trace)[0]['callStack'][0]['helper'], '004AD550')

    def test_32_failed_target_revalidation_still_selects_null_target(self):
        for source in SOURCES:
            f = fixture(source=source)
            row(f[0]['frame'], 0, 'troops').update(vtableAddress=0, rawOrder2C=1,
                rawTargetType34=0, rawTarget30=1)
            def effect(stage, after, context):
                if stage == 'event9-unknown-virtual' and context['args']['site'] == '00495D00':
                    row(after, 0, 'troops').update(vtableAddress=VTABLE,
                        leaderId=-1, rawOrder2C=0, raw44=I32_MAX)
                    return dict(result=False, count=0)
                return 0
            trace = self.check_oracle(f, effect=effect)
            self.assertEqual(selected_troops(trace), [0])
            suffix = suffixes(trace)[0]
            self.assertIsNone(suffix['args']['targetPointer'])
            self.assertEqual(suffix['args']['raw44'], 0)
            self.assertEqual(row(suffix['before'], 0, 'troops')['leaderId'], -1)

    def test_33_observed_cycle_can_terminate_after_saved_self_revisit(self):
        for source in SOURCES:
            f = fixture(source=source)
            f[0]['frame']['troopListNodes'] = [node(17, 17)]
            def effect(stage, after, context):
                if stage == 'event9-reaction-suffix':
                    row(after, 17, 'troopListNodes')['nextNodeId'] = None
                return 0
            trace = self.check_oracle(f, effect=effect)
            self.assertEqual(selected_troops(trace), [0, 0])
            self.assertEqual([r['args']['savedNextNodeId'] for r in suffixes(trace)], [17, None])

    def test_34_actor_unknown_force_suffix_uses_saved_target_and_next(self):
        for source in SOURCES:
            f = fixture(source=source)
            w = f[0]['frame']
            row(w, 0, 'troops').update(vtableAddress=0, rawOrder2C=1, rawTarget30=1)
            row(w, 1, 'buildings')['legionId'] = -1
            def effect(stage, after, context):
                if stage == 'event9-unknown-virtual' and context['args']['site'] == '004BA318':
                    row(after, 0, 'troops').update(raw44=47, rawTarget30=0,
                        rawTargetType34=3, leaderId=-1)
                    after['troopListNodes'] = []
                    after['troopListHead'] = 99
                    return dict(result=-1, count=None)
                return 0
            trace = self.check_oracle(f, effect=effect)
            self.assertEqual(selected_troops(trace), [0])
            self.assertEqual(suffixes(trace)[0]['args']['targetPointer'], pointer('buildings', 1))
            self.assertEqual(suffixes(trace)[0]['args']['raw44'], 0)
            self.assertIsNone(suffixes(trace)[0]['args']['savedNextNodeId'])
            self.assertFalse(trace['rng']['allCountsKnown'])
            self.assertIsNone(trace['rng']['observedCalls'])

    def test_35_partial_effects_roll_back_on_node_budget(self):
        for source in SOURCES:
            f = fixture(source=source)
            f[0]['frame']['troopListNodes'] = [node(17, 29), node(29, 17, None)]
            f[3]['event9NodeLimit'] = 3
            def effect(stage, after, context):
                after[FALLBACK]['positionX'] += 1
                return 0
            with self.assertRaisesRegex(ValueError, 'oracle node guard reached'):
                Oracle(f, effect=effect).run()
            trace = self.atomic_defer(f, 'engine-guard-event9-node-budget')
            self.assertEqual(len(suffixes(trace)), 2)
            self.assertEqual(trace['after']['frame'][FALLBACK], f[0]['frame'][FALLBACK])

    def test_36_missing_saved_next_after_callback_fails_atomically(self):
        for source in SOURCES:
            f = fixture(source=source)
            f[0]['frame']['troopListNodes'] = [node(17, 29), node(29)]
            Oracle(f).run()
            f[2]['records'] = f[2]['records'][:1]
            f[2]['records'][0]['after']['troopListNodes'] = [node(17)]
            self.atomic_error(f)

    def test_37_native_budget_exact_limit_and_reject_policy(self):
        f = fixture(); Oracle(f).run()
        budget = run(f)['nativeCalls']
        for limit in (1, budget-1):
            f[3]['engineGuard']['maxNativeCalls'] = limit
            self.atomic_defer(f, 'engine-guard-native-call-budget')
        f[3]['engineGuard']['maxNativeCalls'] = budget
        self.assertTrue(run(f)['accepted'])
        f = fixture(); f[3]['unknownEffects'] = 'reject'
        trace = self.atomic_defer(f, 'unresolved-effect:004BA345/event9-reaction-suffix')
        self.assertTrue(trace['observedEffects'][0]['deferred'])

    def test_38_seeded_mutable_lists_preserve_occurrences_and_live_fields(self):
        rand = random.Random(0x4BA285)
        for index in range(32):
            f = fixture(source=SOURCES[index % 2])
            w = f[0]['frame']
            ids = [901, 11, 700, 53]
            rand.shuffle(ids)
            w['troopListHead'] = ids[0]
            w['troopListNodes'] = [node(nid, ids[i+1] if i+1 < len(ids) else None,
                rand.choice((0, 999, None))) for i,nid in enumerate(ids)]
            rand.shuffle(w['troopListNodes'])
            for tid in (0, 999):
                row(w, tid, 'troops').update(leaderId=rand.choice((7, 9, -1)),
                    deputyIds=[rand.choice((-1, 1099, 1100)), -1],
                    raw44=rand.choice((-1, 0, 46, 47)),
                    rawOrder2C=rand.choice((0, 1, 4, 6)),
                    rawTarget30=rand.choice((-1, 0, 1)), rawTargetType34=0)
            def effect(stage, after, context):
                if stage == 'event9-reaction-suffix':
                    row(after, 999, 'troops').update(leaderId=7,
                        deputyIds=[-1,-1], raw44=46, rawTarget30=0)
                    after[FALLBACK]['positionX'] += 1
                    if index % 3 == 0 and context['args']['savedNextNodeId'] is not None:
                        next_id = context['args']['savedNextNodeId']
                        row(after, next_id, 'troopListNodes')['nextNodeId'] = None
                return 0
            self.check_oracle(f, effect=effect, replay=index % 8 == 0)

    def test_39_evolving_commits_reobserve_live_list_and_troops(self):
        f = fixture()
        f[0]['frame']['troopListNodes'] = [node(17, 29), node(29, None, 999)]
        for turn in range(6):
            f[1].update(id='event9-evolving-' + str(turn), expectedRevision=turn)
            def effect(stage, after, context):
                if stage == 'event9-reaction-suffix':
                    after[FALLBACK]['positionY'] += 1
                    after['troopListHead'] = 29 if turn % 2 == 0 else 17
                    row(after, 999, 'troops').update(raw44=46,
                        rawOrder2C=turn % 2, rawTarget30=0)
                return 0
            trace = self.check_oracle(f, effect=effect)
            self.assertEqual(trace['after']['revision'], turn+1)
            self.assertEqual(len(trace['after']['appliedCommands']), turn+1)
            f[0] = copy.deepcopy(trace['after'])


if __name__ == '__main__':
    unittest.main()
