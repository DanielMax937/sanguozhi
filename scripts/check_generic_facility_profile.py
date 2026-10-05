"""Independent source interpreter and adversarial generic-facility checks.

The bounded 004B40C0 entry is transcribed from the pinned S1/S2 instructions.
Earlier test-only interpreters supply already verified native ownership,
relocation, cancellation and recursive return. No production projector,
primitive, planner or trace constructs expected frames or observations.
Callback answers below are explicit synthetic fixtures, not gameplay evidence.
"""
import ast
import copy
import hashlib
import importlib
import itertools
import json
from pathlib import Path
import random
import re
import unittest
from contextlib import ExitStack
from unittest.mock import patch

import generic_facility_profile as m
import live_zero_refund_profile as previous
from check_live_zero_refund_profile import Oracle as ZeroOracle, fixture as zero_fixture
from check_live_zero_refund_profile import HANDLER, PRESENTATION
from check_base_ownership_profile import building, add_force
from check_empty_legion_profile import legion, set_legion
from check_recursive_officer_return_profile import row, refresh_people, digest
from check_native_roster_sort_profile import person

DOMAIN = 'canonical-generic-facility-v1'
CONTINUATION = '004B415D..004B4988'
MANAGER = 'entry-gameplay-manager'
SOURCES = ('S1', 'S2')
I32_MIN, I32_MAX = -2147483648, 2147483647


def fixture(entry='ruler-transfer', source='S1', bid=87, requested=0, native=0, **kw):
    f = zero_fixture('target-force' if entry == 'ruler-transfer' else entry, source, **kw)
    f[1]['id'] = 'generic-facility-1'
    f[3].update(id='generic-facility-observe-v1', facilityDomain=DOMAIN)
    if entry == 'ruler-transfer':
        f[1].update(entry=entry, args=dict(buildingId=bid, requestedLegionId=requested,
                                        nativeArgument=native))
        f[0]['frame']['activePersonIds'] = []
        if 87 <= bid <= 16383:
            existing = next((b for b in f[0]['frame']['buildings'] if b['id'] == bid), None)
            values = building(bid, kind=3, valid=True, subtypeValid=False,
                              rawOwnerForceId=-1)
            if existing is None: f[0]['frame']['buildings'].append(values)
            else: existing.update(values)
            row(f[0]['frame'], 3, 'facilityInfos')['category'] = 1
    return f


def run(f):
    return m.project_generic_facility(*f)


class Oracle(ZeroOracle):
    """004B40FB..4158 and shared EAX-preserving epilogue, canonical addresses."""
    def __init__(self, *args, **kw):
        super().__init__(*args, **kw)
        self.facility_calls = []

    def boundary(self, stage, kind, helper, args, result=None):
        if helper == '004B40C0': return self.ruler_transfer(**args)
        return super().boundary(stage, kind, helper, args, result)

    def ruler_transfer(self, buildingId, requestedLegionId, nativeArgument):
        bid, requested = buildingId, requestedLegionId
        self.facility_calls.append((bid, requested, nativeArgument))
        with self.inside('004B40C0', buildingId=bid, requestedLegionId=requested,
                         nativeArgument=nativeArgument, managerIdentity=MANAGER):
            # 0047A630 returns exactly0 on null or failed virtual validity.
            if not self.valid('buildings', bid): return 0
            # +44 is read before pointer conversion/range split. 00490AD0
            # constructs an address but never reads or validates that slot.
            old = self.base_legion(bid)
            saved = old if 0 <= old <= 46 else None
            self.save(entryOldRawLegionId=old, savedOldLegionId=saved, entryBuildingId=bid)
            if 87 <= bid <= 16383:
                # 004912C0 is pointer arithmetic and class identity, not a
                # legion validity read. The canonical-null result is -1.
                converted = -1 if requested is None else requested
                self.base_ownership(bid, converted)
                return 1  # 004B4153 discards any 004AD550 result.
            return super().boundary('canonical-continuation', 'effect-query', CONTINUATION,
                dict(buildingId=bid, requestedLegionId=requested,
                     nativeArgument=nativeArgument, managerIdentity=MANAGER,
                     entryBuildingId=bid, savedOldLegionId=saved), 1)

    def run(self):
        if self.f[1]['entry'] != 'ruler-transfer': return super().run()
        self.native_result = self.ruler_transfer(**self.f[1]['args'])
        self.f[2]['records'] = copy.deepcopy(self.records)
        return self


class GenericFacilityTests(unittest.TestCase):
    maxDiff = 8000

    def check_oracle(self, f, replay=True, **kw):
        expected = Oracle(f, **kw).run()
        before = copy.deepcopy(f)
        t = run(f)
        self.assertTrue(t['accepted'], t['reason'])
        self.assertEqual(t['after']['frame'], expected.w)
        self.assertEqual(t['events'], expected.events)
        self.assertEqual(t['nativeResult'], expected.native_result)
        self.assertEqual(t['returnCalls'], expected.return_calls)
        self.assertEqual(t['observedEffects'], [r for r in expected.records if r['kind'] != 'query'])
        self.assertEqual(t['queries'], [r for r in expected.records if r['kind'] == 'query'])
        self.assertEqual(t['rng']['localCalls'], expected.local_rng)
        self.assertEqual(t['after']['revision'], f[0]['revision'] + 1)
        self.assertEqual(len(t['after']['appliedCommands']), len(f[0]['appliedCommands']) + 1)
        self.assertEqual(f, before)
        if replay: self.assertEqual(t, m.replay_generic_facility(json.loads(json.dumps(t))))
        return t

    def atomic_error(self, f):
        before = copy.deepcopy(f)
        with self.assertRaises(ValueError): run(f)
        self.assertEqual(f, before)

    def atomic_defer(self, f, reason=None):
        before = copy.deepcopy(f)
        t = run(f)
        self.assertFalse(t['accepted'])
        if reason is not None: self.assertEqual(t['reason'], reason)
        self.assertEqual(t['after'], f[0])
        self.assertEqual(t['steps'], [])
        self.assertEqual(t['events'], [])
        self.assertEqual(f, before)
        self.assertEqual(t, m.replay_generic_facility(t))
        return t

    def test_01_both_sources_all_entries_and_honest_evidence(self):
        entries = ('ruler-transfer', 'cancel-mission', 'event', 'relocate-officer',
            'prepare-movement', 'base-ownership', 'return', 'legion', 'governor',
            'capacity', 'role-sort', 'roster-sort', 'route', 'at-home',
            'target-force', 'force-legion', 'merge-legion')
        for source, entry in itertools.product(SOURCES, entries):
            with self.subTest(source=source, entry=entry):
                t = self.check_oracle(fixture(entry, source))
                self.assertEqual(t['profileId'], 'source-idb-S1-S2-generic-facility-v1')
                for key in ('stockVerified', 'vanillaVerified', 'machineCodeExecuted',
                            'callbacksAssumedNoninterfering', 'engineGuardIsOriginalRule',
                            'completeGameTransaction', 'allCancellationHandlersExecuted',
                            'rulerCaptureExecuted'):
                    self.assertFalse(t['evidence'][key])
                self.assertFalse(t['rng']['globalConsumptionVerified'])

    def test_02_generic_endpoints_ignore_native_scalar_and_return_one(self):
        for source, bid, native in itertools.product(SOURCES, (87, 16383),
                (I32_MIN, -1, 0, 1, 4, I32_MAX)):
            f = fixture(source=source, bid=bid, native=native)
            t = self.check_oracle(f, replay=native == 0)
            self.assertEqual(t['nativeResult'], 1)
            self.assertEqual(row(t['after']['frame'], bid, 'buildings')['rawOwnerForceId'], 0)
            self.assertEqual([e['event']['id'] for e in t['events']], [9])
            self.assertFalse(any(r['helper'] in ('004B40C0', CONTINUATION) for r in t['observedEffects']))
            self.assertEqual(t['after']['revision'], 1)
            self.assertEqual(len(t['after']['appliedCommands']), 1)

    def test_03_null_building_signed_range_and_invalid_slot_short_circuit(self):
        for source, bid in itertools.product(SOURCES, (I32_MIN, -1, 16384, I32_MAX)):
            f = fixture(source=source, bid=bid, requested=46)
            f[3]['unknownEffects'] = 'reject'
            t = self.check_oracle(f)
            self.assertEqual(t['nativeResult'], 0)
            self.assertEqual(t['after']['frame'], f[0]['frame'])
            self.assertEqual(t['observedEffects'], [])
        for source, bid in itertools.product(SOURCES, (0, 86, 87, 16383)):
            f = fixture(source=source, bid=bid, requested=46)
            row(f[0]['frame'], bid, 'buildings').update(valid=False, kind=-1)
            f[3]['unknownEffects'] = 'reject'
            t = self.check_oracle(f)
            self.assertEqual(t['nativeResult'], 0)
            self.assertEqual(t['after']['frame'], f[0]['frame'])

    def test_04_actual_readable_slot_boundaries(self):
        for source, table in itertools.product(SOURCES,
                ('buildings', 'legions', 'facilityInfos')):
            f = fixture(source=source)
            target = {'buildings': 87, 'legions': 0, 'facilityInfos': 3}[table]
            f[0]['frame'][table] = [r for r in f[0]['frame'][table] if r['id'] != target]
            self.atomic_error(f)
        for source in SOURCES:
            f = fixture(source=source, requested=46)
            self.atomic_error(f)  # Canonical requested pointer, missing slot at native validity read.
            f = fixture(source=source, bid=86, requested=46)
            row(f[0]['frame'], 86, 'buildings').update(valid=True, kind=2)
            self.assertEqual(self.check_oracle(f)['nativeResult'], 1)  # Continuation owns later read.
            f = fixture(source=source, bid=86)
            f[0]['frame']['buildings'] = [b for b in f[0]['frame']['buildings'] if b['id'] != 86]
            self.atomic_error(f)  # All canonical slots are a declared frame-domain obligation.

    def test_05_null_invalid_valid_requested_legion_pointer(self):
        for source, requested, force in itertools.product(SOURCES, (None, 0, 46),
                (I32_MIN, -1, 0, 46, 47, I32_MAX)):
            f = fixture(source=source, requested=requested)
            w = f[0]['frame']
            if requested is not None:
                if requested == 46: w['legions'].append(legion(46, forceId=force))
                else: set_legion(row(w, 0, 'legions'), forceId=force)
            t = self.check_oracle(f, replay=False)
            expected = force if requested is not None and 0 <= force <= 46 else -1
            self.assertEqual(t['nativeResult'], 1)
            self.assertEqual(row(t['after']['frame'], 87, 'buildings')['rawOwnerForceId'], expected)
            self.assertEqual([e['event']['id'] for e in t['events']], [9] if expected != -1 else [])

    def test_06_categories_generic_owner_fields_and_no_fabricated_subtype(self):
        for source, bid, kind, category in itertools.product(SOURCES, (87, 16383),
                (0, 1, 2, 3, 24, 63), (0, 1, 2, 3, 4)):
            f = fixture(source=source, bid=bid)
            w = f[0]['frame']; b = row(w, bid, 'buildings')
            b.update(kind=kind, legionId=46, rawOwnerForceId=23, durabilityWord=65535)
            row(w, kind, 'facilityInfos')['category'] = category
            t = self.check_oracle(f, replay=False)
            changed = category in (1, 2) or (category == 3 and kind != 24)
            out = row(t['after']['frame'], bid, 'buildings')
            self.assertEqual(out['rawOwnerForceId'], 0 if changed else 23)
            self.assertEqual(out['legionId'], 46)
            self.assertEqual(out['durabilityWord'], 65535)
            self.assertEqual([e['event']['id'] for e in t['events']], [9] if changed else [])
            self.assertEqual(t['nativeResult'], 1)

    def test_07_generic_unread_old_legion_raw_fields_do_not_make_event_ten(self):
        for source, old in itertools.product(SOURCES, (I32_MIN, -1, 0, 46, 47, I32_MAX)):
            f = fixture(source=source)
            b = row(f[0]['frame'], 87, 'buildings')
            b.update(legionId=old, rawOwnerForceId=0)
            t = self.check_oracle(f)
            self.assertEqual(t['events'], [])
            self.assertEqual(t['nativeResult'], 1)
            self.assertEqual(row(t['after']['frame'], 87, 'buildings')['legionId'], old)

    def test_08_canonical_split_is_exact_and_has_no_early_requested_validity_gate(self):
        for source, bid, requested in itertools.product(SOURCES,
                (0, 41, 42, 51, 52, 86), (None, 0, 46)):
            f = fixture(source=source, bid=bid, requested=requested, native=-987)
            row(f[0]['frame'], bid, 'buildings').update(valid=True,
                kind=0 if bid <= 41 else 1 if bid <= 51 else 2)
            t = self.check_oracle(f, replay=False)
            self.assertEqual(t['nativeResult'], 1)
            self.assertEqual(len(t['observedEffects']), 1)
            r = t['observedEffects'][0]
            self.assertEqual(r['helper'], CONTINUATION)
            self.assertEqual(r['args']['requestedLegionId'], requested)
            self.assertEqual(r['args']['nativeArgument'], -987)
            self.assertEqual(t['after']['frame'], f[0]['frame'])
            self.assertEqual(t['events'], [])

    def test_09_saved_old_legion_pointer_constructed_without_dereference(self):
        for source, raw in itertools.product(SOURCES, (I32_MIN, -1, 0, 1, 46, 47, I32_MAX)):
            f = fixture(source=source, bid=0, requested=46)
            row(f[0]['frame'], 0, 'buildings')['legionId'] = raw
            # No force/legion contents may be read by this prelude.
            f[0]['frame']['legions'] = []
            t = self.check_oracle(f)
            r = t['observedEffects'][0]
            self.assertEqual(r['args']['savedOldLegionId'], raw if 0 <= raw <= 46 else None)
            self.assertEqual(r['callStack'][-1]['locals']['savedOldLegionId'],
                             raw if 0 <= raw <= 46 else None)
        for source in SOURCES:
            f = fixture(source=source, bid=86)
            row(f[0]['frame'], 86, 'buildings').update(kind=3, valid=True, legionId=46)
            t = self.check_oracle(f)
            self.assertIsNone(t['observedEffects'][0]['args']['savedOldLegionId'])

    def test_10_continuation_saved_pointer_native_scalar_manager_and_mutable_frame(self):
        for source, result in itertools.product(SOURCES, (0, 1)):
            f = fixture(source=source, bid=0, requested=46, native=I32_MIN)
            row(f[0]['frame'], 0, 'buildings')['legionId'] = 1
            f[0]['frame']['legions'].append(legion(1, forceId=-1))
            f[0]['frame']['data']['saved-pointer-test'] = {'value': 0}
            def effect(stage, w, c):
                self.assertEqual(stage, 'canonical-continuation')
                self.assertEqual(c['args']['savedOldLegionId'], 1)
                self.assertEqual(c['args']['requestedLegionId'], 46)
                self.assertEqual(c['args']['nativeArgument'], I32_MIN)
                self.assertEqual(c['args']['managerIdentity'], MANAGER)
                row(w, 0, 'buildings').update(legionId=0, rawOwnerForceId=46)
                set_legion(row(w, 1, 'legions'), forceId=0, number=9)
                w['managerDirty'] = 123
                w['rngState'] = 9876
                w['data']['saved-pointer-test'] = {'value': result}
                return dict(count=3, result=result)
            t = self.check_oracle(f, effect=effect)
            self.assertEqual(t['nativeResult'], result)
            self.assertEqual(t['rng']['observedCalls'], 3)
            self.assertEqual(t['rng']['finalState'], 9876)
            self.assertEqual(t['after']['frame']['managerDirty'], 123)
            self.assertEqual(t['observedEffects'][0]['args']['savedOldLegionId'], 1)

    def test_11_continuation_observation_binding_and_native_zero_one_return_domain(self):
        for source in SOURCES:
            f = fixture(source=source, bid=0); Oracle(f).run()
            for defect in ('missing', 'unused', 'helper', 'kind', 'before', 'source',
                           'manager', 'native', 'saved', 'requested', 'entry', 'building',
                           'stack-manager', 'stack-native', 'stack-saved', 'stack-entry',
                           'stack-raw', 'stack-requested', 'index'):
                g = copy.deepcopy(f); records = g[2]['records']; r = records[0]
                if defect == 'missing': records.clear()
                elif defect == 'unused': records.append(copy.deepcopy(r)); records[-1]['index'] = 1
                elif defect == 'helper': r['helper'] = '004B40C0'
                elif defect == 'kind': r['kind'] = 'effect'; r.pop('result')
                elif defect == 'before': r['before']['managerDirty'] += 1
                elif defect == 'source': r['source'] = 'S2' if source == 'S1' else 'S1'
                elif defect == 'manager': r['args']['managerIdentity'] = 'other-manager'
                elif defect == 'native': r['args']['nativeArgument'] = 1
                elif defect == 'saved': r['args']['savedOldLegionId'] = 46
                elif defect == 'requested': r['args']['requestedLegionId'] = None
                elif defect == 'entry': r['args']['entryBuildingId'] = 1
                elif defect == 'building': r['args']['buildingId'] = 1
                elif defect.startswith('stack-'):
                    key = {'stack-manager': 'managerIdentity', 'stack-native': 'nativeArgument',
                           'stack-saved': 'savedOldLegionId', 'stack-entry': 'entryBuildingId',
                           'stack-raw': 'entryOldRawLegionId',
                           'stack-requested': 'requestedLegionId'}[defect]
                    r['callStack'][-1]['locals'][key] = 'bad'
                else: r['index'] = 1
                with self.subTest(source=source, defect=defect): self.atomic_error(g)
            for result in (True, False, None, I32_MIN-1, I32_MIN, -1, 2, I32_MAX, I32_MAX+1, '1', [], {}):
                g = copy.deepcopy(f); g[2]['records'][0]['result'] = result; self.atomic_error(g)

    def test_12_enclosing_ruler_generic_boundaries_and_raw_legion_normalization(self):
        for source, bid, raw in itertools.product(SOURCES, (87, 16383),
                (I32_MIN, -1, 0, 46, 47, I32_MAX)):
            f = fixture('relocate-officer', source); w = f[0]['frame']
            f[1]['args']['targetBuildingId'] = bid
            existing = next((b for b in w['buildings'] if b['id'] == bid), None)
            if existing is None: w['buildings'].append(building(bid, kind=3, subtypeValid=False))
            else: existing.update(kind=3, subtypeValid=False)
            row(w, 3, 'facilityInfos')['category'] = 1
            row(w).update(status=0, rawLegionId=raw, locationId=87)
            if raw == 46: w['legions'].append(legion(46, forceId=0))
            t = self.check_oracle(f, troop=True, replay=False)
            self.assertIsNone(t['nativeResult'])
            self.assertEqual(row(t['after']['frame'])['homeBaseId'], bid)
            self.assertEqual(row(t['after']['frame'])['rawLegionId'], raw)
            self.assertEqual(row(t['after']['frame'], bid, 'buildings')['rawOwnerForceId'],
                             0 if raw in (0, 46) else -1)
            self.assertFalse(any(r['helper'] in ('004B40C0', CONTINUATION) for r in t['observedEffects']))

    def test_13_generic_event_callbacks_mutate_enclosing_actor_and_target(self):
        for source in SOURCES:
            f = fixture('relocate-officer', source); w = f[0]['frame']
            w['buildings'].append(building(87, kind=3, subtypeValid=False))
            row(w, 3, 'facilityInfos')['category'] = 1
            f[1]['args']['targetBuildingId'] = 87
            row(w).update(status=0, rawLegionId=0, locationId=87)
            def effect(stage, v, c):
                if stage == 'ownership-event-tail':
                    row(v).update(homeBaseId=42, rawLegionId=-1, status=5)
                    row(v, 87, 'buildings').update(rawOwnerForceId=46, kind=-1, valid=False)
                    v['managerDirty'] = 7
                return 0
            t = self.check_oracle(f, effect=effect, troop=True)
            self.assertEqual(row(t['after']['frame'])['homeBaseId'], 87)
            self.assertEqual(row(t['after']['frame'])['rawLegionId'], -1)
            self.assertFalse(row(t['after']['frame'], 87, 'buildings')['valid'])
            self.assertIsNone(t['nativeResult'])
            self.assertEqual(t['after']['frame']['managerDirty'], 7)

    def test_14_invalidated_target_during_prior_event_stops_native_prelude(self):
        for source in SOURCES:
            f = fixture('relocate-officer', source); w = f[0]['frame']
            row(w).update(status=2, rawLegionId=0, locationId=87)
            row(w, 0, 'buildings')['governorId'] = 7
            w['observerPresent'] = True
            def effect(stage, v, c):
                if stage == 'event-observer' and c['event']['id'] == 8:
                    row(v).update(status=0, rawLegionId=46)
                    row(v, 1, 'buildings').update(valid=False, kind=-1)
                return 0
            t = self.check_oracle(f, effect=effect, troop=True)
            self.assertEqual(row(t['after']['frame'])['homeBaseId'], 1)
            self.assertFalse(any(r['helper'] in ('004B40C0', CONTINUATION) for r in t['observedEffects']))

    def test_15_generic_event_nine_runs_live_nine_ten_on_same_frame(self):
        for source, mission in itertools.product(SOURCES, (9, 10)):
            f = fixture(source=source); w = f[0]['frame']
            row(w).update(status=5, rawLegionId=0, homeBaseId=0, locationId=0,
                          missionId=mission, missionArgs=[87, 9, 3, 4, 5])
            row(w, 0, 'forces')['playerIndex'] = 0
            w['activePersonIds'] = [7, 7]
            def effect(stage, v, c):
                if stage == 'presentation':
                    self.assertEqual(row(v, 87, 'buildings')['rawOwnerForceId'], 0)
                    v['activePersonIds'] = []
                    row(v, 87, 'buildings')['rawOwnerForceId'] = 46
                return 2 if stage == 'presentation' else 0
            t = self.check_oracle(f, effect=effect)
            self.assertEqual(t['nativeResult'], 1)
            self.assertEqual(t['events'][0]['copiedActivePersonIds'], [7, 7])
            self.assertEqual([v['route'] for v in t['events'][0]['visits']],
                             ['handler-called', 'mission-range-skip'])
            self.assertEqual(row(t['after']['frame'])['missionId'], -1)
            self.assertEqual(row(t['after']['frame'], 87, 'buildings')['rawOwnerForceId'], 46)
            self.assertFalse(any(r['helper'] in HANDLER.values() for r in t['observedEffects']))
            notice = next(r for r in t['observedEffects'] if r['helper'] == PRESENTATION[mission])
            self.assertEqual([s['helper'] for s in notice['callStack'][:2]], ['004B40C0', '004AD550'])
            self.assertEqual(t['rng']['observedCalls'], 2)

    def test_16_nested_event_restores_stack_and_depth_guard_rolls_back(self):
        for source, mission in itertools.product(SOURCES, (9, 10)):
            f = fixture(source=source); w = f[0]['frame']
            row(w).update(homeBaseId=0, locationId=0, status=3, rawLegionId=0,
                          missionId=mission, missionArgs=[87, 9, 3, 4, 5])
            row(w, 0, 'forces')['playerIndex'] = 0
            row(w, 9).update(status=5, homeBaseId=1, locationId=1, rawLegionId=0,
                            missionId=23, missionArgs=[0, 9, 3, 4, 5])
            row(w, 0, 'buildings')['governorId'] = 9
            w['activePersonIds'] = [7, 9, 7]
            def effect(stage, v, c):
                if stage == 'presentation' and c['personId'] == 9:
                    self.assertEqual(c['event']['id'], 8)
                    self.assertEqual(c['eventDepth'], 2)
                    v['activePersonIds'] = [403]
                    row(v, 403)['missionId'] = 44
                elif stage == 'ownership-event-tail':
                    self.assertEqual(c['event']['id'], 9)
                    self.assertEqual(c['eventDepth'], 1)
                return 0
            t = self.check_oracle(f, effect=effect)
            self.assertEqual(t['nativeResult'], 1)
            nested = next(e for e in t['events'] if e['event']['id'] == 8)
            self.assertEqual(nested['parentEventIndex'], 0)
            self.assertEqual(nested['copiedActivePersonIds'], [7, 9, 7])
            tail = next(r for r in t['observedEffects'] if r['helper'] == '004BA1D0')
            self.assertEqual(tail['callStack'][0]['helper'], '004B40C0')
            self.assertEqual(tail['callStack'][1]['helper'], '004AD550')
            self.assertEqual(t['after']['frame']['activePersonIds'], [403])
            f[3]['engineGuard']['maxEventDepth'] = 1
            self.atomic_defer(f, 'engine-guard-event-depth')

    def test_17_atomic_observation_order_source_rng_alias_and_domain_rejection(self):
        for source in SOURCES:
            f = fixture(source=source); f[0]['frame']['observerPresent'] = True
            Oracle(f).run(); self.assertGreaterEqual(len(f[2]['records']), 2)
            for defect in ('missing', 'extra', 'reorder', 'source', 'before', 'args', 'stack',
                           'person-alias', 'legion-alias', 'building-alias', 'domain',
                           'negative-rng', 'bool-rng'):
                g = copy.deepcopy(f); records = g[2]['records']; r = records[0]
                if defect == 'missing': records.pop(0); [v.update(index=i) for i, v in enumerate(records)]
                elif defect == 'extra': records.append(copy.deepcopy(records[-1])); records[-1]['index'] = len(records)-1
                elif defect == 'reorder': records.reverse(); [v.update(index=i) for i, v in enumerate(records)]
                elif defect == 'source': r['source'] = 'S2' if source == 'S1' else 'S1'
                elif defect == 'before': r['before']['managerDirty'] += 1
                elif defect == 'args': r['args']['event']['subjectId'] = 0
                elif defect == 'stack': r['callStack'][0]['locals']['nativeArgument'] = 1
                elif defect == 'person-alias': row(r['after'])['valid'] = False
                elif defect == 'legion-alias': row(r['after'], 0, 'legions')['forceId'] = -1
                elif defect == 'building-alias': row(r['after'], 87, 'buildings')['valid'] = False
                elif defect == 'domain': r['after']['persons'].append(person(1000))
                elif defect == 'negative-rng': r['rngConsumption']['calls'] = -1
                else: r['rngConsumption']['calls'] = True
                with self.subTest(source=source, defect=defect): self.atomic_error(g)

    def test_18_rng_observed_unknown_counts_are_never_inferred(self):
        for source, bid, count in itertools.product(SOURCES, (0, 87), (None, 0, 17)):
            f = fixture(source=source, bid=bid)
            def effect(stage, w, c):
                w['rngState'] = 123456
                return count
            t = self.check_oracle(f, effect=effect)
            self.assertEqual(t['rng']['allCountsKnown'], count is not None)
            self.assertEqual(t['rng']['observedCalls'], count)
            self.assertEqual(t['rng']['localCalls'], 0)
            self.assertEqual(t['rng']['finalState'], 123456)

    def test_19_unknown_effect_reject_and_native_call_budget_atomicity(self):
        for source, bid in itertools.product(SOURCES, (0, 87, 16383)):
            f = fixture(source=source, bid=bid); f[3]['unknownEffects'] = 'reject'
            self.atomic_defer(f)
            f = fixture(source=source, bid=bid); Oracle(f).run()
            t = run(f); budget = t['nativeCalls']; self.assertGreaterEqual(budget, 1)
            if budget > 1:
                f[3]['engineGuard']['maxNativeCalls'] = 1; self.atomic_defer(f)
                f[3]['engineGuard']['maxNativeCalls'] = budget-1; self.atomic_defer(f)
            f[3]['engineGuard']['maxNativeCalls'] = budget; self.assertTrue(run(f)['accepted'])
        for source in SOURCES:
            f = fixture(source=source, requested=None)
            f[3]['unknownEffects'] = 'reject'
            self.assertTrue(self.check_oracle(f)['accepted'])  # No event, no observation required.

    def test_20_revision_idempotency_payload_and_tamper_replay(self):
        f = fixture(); t = self.check_oracle(f)
        for altered_hash in (False, True):
            g = copy.deepcopy(t); row(g['after']['frame'], 87, 'buildings')['rawOwnerForceId'] = 46
            if altered_hash: g['traceHash'] = digest({k: v for k, v in g.items() if k != 'traceHash'})
            with self.assertRaises(ValueError): m.replay_generic_facility(g)
        g = copy.deepcopy(f); g[0] = copy.deepcopy(t['after'])
        replay = run(g); self.assertTrue(replay['replayed']); self.assertEqual(replay['after'], g[0])
        g[1]['args']['nativeArgument'] = 1; self.atomic_defer(g, 'replay-payload-conflict')
        f = fixture(); f[1]['expectedRevision'] = 1; self.atomic_defer(f, 'revision-conflict')
        f = fixture(); f[0]['revision'] = I32_MAX; f[1]['expectedRevision'] = I32_MAX
        self.atomic_error(f)

    def test_21_strict_version_domain_and_argument_contracts(self):
        for key in ('facilityDomain', 'zeroRefundDomain', 'relocationDomain', 'frameProfile',
                    'registryDomain', 'nativePlatform'):
            f = fixture(); f[3][key] = 'wrong'; self.atomic_error(f)
            f = fixture(); del f[3][key]; self.atomic_error(f)
        for field, values in (
            ('buildingId', (None, True, I32_MIN-1, I32_MAX+1, '87')),
            ('requestedLegionId', (-1, 47, I32_MIN, I32_MAX, True, '0')),
            ('nativeArgument', (None, True, I32_MIN-1, I32_MAX+1, '0'))):
            for value in values:
                f = fixture(); f[1]['args'][field] = value; self.atomic_error(f)
        f = fixture(); f[1]['args']['managerIdentity'] = MANAGER; self.atomic_error(f)
        f = fixture(); f[1]['args']['extra'] = 0; self.atomic_error(f)
        f = fixture(); del f[1]['args']['nativeArgument']; self.atomic_error(f)

    def test_22_previous_api_replays_whole_ruler_call_unchanged(self):
        for source in SOURCES:
            old = zero_fixture('relocate-officer', source); w = old[0]['frame']
            row(w).update(status=0, rawLegionId=0, locationId=87)
            ZeroOracle(old, troop=True).run()
            before = copy.deepcopy(old)
            trace = previous.project_live_zero_refund(*old)
            self.assertTrue(trace['accepted'])
            self.assertTrue(any(r['helper'] == '004B40C0' for r in trace['observedEffects']))
            self.assertEqual(old, before)
            self.assertEqual(trace, previous.replay_live_zero_refund(json.loads(json.dumps(trace))))
            with self.assertRaises(ValueError): run(old)
            with self.assertRaises(ValueError): previous.project_live_zero_refund(*fixture(source=source))
            with self.assertRaises(ValueError): m.replay_generic_facility(trace)
            with self.assertRaises(ValueError): previous.replay_live_zero_refund(self.check_oracle(fixture(source=source)))

    def test_23_no_nested_legacy_projector_transactions(self):
        names = ('live_zero_refund_profile', 'officer_relocation_profile',
            'base_ownership_events_profile', 'empty_legion_redistribution_profile',
            'return_route_target_force_profile', 'native_roster_sort_profile',
            'recursive_officer_return_profile', 'mission_event_composition_profile',
            'mission_event_listener_profile', 'mission_notification_tail_profile',
            'officer_return_finalizer_profile', 'legion_role_reconciliation_profile',
            'return_mission_lifecycle_profile', 'mission_cancellation_profile',
            'mission_cancellation_v2_profile', 'group_mission_cancellation_profile',
            'special_mission_cancellation_profile', 'facility_mission_cancellation_profile')
        for source in SOURCES:
            f = fixture(source=source); Oracle(f).run()
            with ExitStack() as stack:
                for name in names:
                    mod = importlib.import_module(name)
                    for attr in dir(mod):
                        if attr.startswith('project_'):
                            stack.enter_context(patch.object(mod, attr,
                                side_effect=AssertionError('legacy transaction called')))
                t = run(f)
            self.assertTrue(t['accepted'])
            self.assertEqual(t['after']['revision'], 1)
            self.assertEqual(len(t['after']['appliedCommands']), 1)

    def test_24_seeded_independent_signed_pointer_category_matrix(self):
        rng = random.Random(0x4B40C0)
        for i in range(160):
            source = SOURCES[i % 2]
            bid = rng.choice((I32_MIN, -1, 0, 41, 42, 51, 52, 86, 87, 16383, 16384, I32_MAX))
            requested = rng.choice((None, 0, 46))
            f = fixture(source=source, bid=bid, requested=requested,
                        native=rng.choice((I32_MIN, -1, 0, 4, I32_MAX)))
            w = f[0]['frame']; w['legions'].append(legion(46, forceId=rng.choice((-1, 0, 46, 47))))
            if 0 <= bid <= 16383:
                b = row(w, bid, 'buildings'); kind = rng.choice((-1, 0, 1, 2, 3, 24, 63))
                b.update(kind=kind, valid=0 <= kind <= 63,
                         legionId=rng.choice((I32_MIN, -1, 0, 46, 47, I32_MAX)))
                if kind >= 0: row(w, kind, 'facilityInfos')['category'] = rng.randrange(5)
            self.check_oracle(f, replay=i % 19 == 0)

    def test_25_pinned_source_bytes_both_idbs_and_critical_branches(self):
        root = Path(__file__).resolve().parents[1] / 'docs/sources'
        regions = (
            ('officer-relocation', '004B40C0', 0x004B40C0, 0x004B49AD,
             '722fe6179b4d9396d1c8047e2dfafea57b11d7d035398638313ee0808e96e151'),
            ('empty-legion-redistribution', '004912C0', 0x004912C0, 0x00491308,
             '19360d0d0373c30434cb79322992b787627daf84282d61d0511499aab5ab73d8'),
            ('officer-relocation', '00490AD0', 0x00490AD0, 0x00490AF2,
             'd03849242416ef33815626c63a49db94f0d84740bbe3ae137b638ad756be3333'),
            ('officer-relocation', '00491770', 0x00491770, 0x004917BC,
             '57db6d0a75e755ba06d4cf80f7dd9e634d89cf02e272c4c7ad3ae053e213f41b'))
        for source, (folder, name, start, end, sha) in itertools.product(SOURCES, regions):
            lines = (root / folder / (source + '-' + name + '.asm.txt')).read_text().splitlines()
            raw = bytearray(); cursor = start; instructions = {}
            for line in lines:
                match = re.match(r'^([0-9A-Fa-f]{8})\s+((?:[0-9a-f]{2}\s+)+)(?=[a-z])', line)
                if not match: continue
                address = int(match.group(1), 16)
                self.assertEqual(address, cursor)
                chunk = bytes.fromhex(match.group(2)); raw.extend(chunk); cursor += len(chunk)
                instructions[address] = chunk
            self.assertEqual(cursor, end)
            self.assertEqual(hashlib.sha256(raw).hexdigest(), sha)
            if name == '004B40C0':
                for addr, opcode in {0x004B4103: '85c0', 0x004B412C: '83f857',
                        0x004B4131: '3dff3f0000', 0x004B4153: 'b801000000',
                        0x004B415D: '57', 0x004B49AA: 'c20c00'}.items():
                    self.assertEqual(instructions[addr].hex(), opcode)


    def test_26_enclosing_missing_legion_pointer_read_is_deferred_to_real_use(self):
        for source in SOURCES:
            f = fixture('relocate-officer', source)
            row(f[0]['frame']).update(status=0, rawLegionId=46, locationId=87)
            t = self.check_oracle(f, troop=True)
            continuation = next(r for r in t['observedEffects'] if r['helper'] == CONTINUATION)
            self.assertEqual(continuation['args']['requestedLegionId'], 46)
            self.assertEqual(row(t['after']['frame'])['homeBaseId'], 1)
            f = fixture('relocate-officer', source)
            row(f[0]['frame']).update(status=0, rawLegionId=46, locationId=87)
            f[0]['frame']['buildings'].append(building(87, kind=3, subtypeValid=False))
            row(f[0]['frame'], 3, 'facilityInfos')['category'] = 1
            f[1]['args']['targetBuildingId'] = 87
            self.atomic_error(f)

    def test_27_callback_can_replace_every_represented_table_and_manager_state(self):
        for source in SOURCES:
            f = fixture(source=source, bid=0, requested=46, native=4)
            for name in ('persons', 'buildings', 'cities', 'legions', 'forces',
                         'titles', 'offices', 'facilityInfos', 'mapCells'):
                f[0]['frame'][name][0]['data']['callback-marker'] = None
            f[0]['frame']['data']['full-frame'] = []
            def effect(stage, w, c):
                self.assertEqual(stage, 'canonical-continuation')
                row(w).update(status=5, rawLegionId=-1, missionId=44,
                              missionArgs=[I32_MIN, -1, 0, 46, I32_MAX])
                row(w, 0, 'buildings').update(kind=-1, valid=False, legionId=46,
                                            durabilityWord=65535, rawOwnerForceId=46)
                row(w, 0, 'cities')['rawFlagsA4'] = 0x12345678
                set_legion(row(w, 0, 'legions'), forceId=-1, leaderId=9, number=0)
                row(w, 0, 'forces').update(valid=False, rulerId=-1,
                    playerIndex=7, raw44=I32_MIN, field128=0, techniqueBits=[0xFFFFFFFF, 0xFFFFFFFF])
                row(w, 0, 'titles').update(capacityWord=12345)
                row(w, 0, 'offices').update(capacityWord=54321)
                row(w, 3, 'facilityInfos')['category'] = 4
                row(w, 0, 'mapCells')['rawTerritoryDword'] = 0xABCDEF01
                for name in ('persons', 'buildings', 'cities', 'legions', 'forces',
                             'titles', 'offices', 'facilityInfos', 'mapCells'):
                    w[name][0]['data']['callback-marker'] = name
                    w[name].reverse()
                w.update(activePersonIds=[9, 7, 9], executingPersonId=9,
                         observerPresent=True, managerDirty=987, rngState=0xDEADBEEF,
                         data={'nested': {'value': 42}, 'full-frame': ['callback', None, True, 9]})
                return dict(result=0, count=None)
            t = self.check_oracle(f, effect=effect)
            self.assertEqual(t['nativeResult'], 0)
            self.assertEqual(t['after']['frame']['activePersonIds'], [9, 7, 9])
            self.assertEqual(t['after']['frame']['managerDirty'], 987)
            self.assertFalse(t['rng']['allCountsKnown'])
            self.assertIsNone(t['rng']['observedCalls'])

    def test_28_new_coordinator_changes_only_source_proven_pointer_construction(self):
        # This compares isolation, not expected gameplay behavior: the oracle
        # above remains an independently transcribed interpreter.
        root = Path(__file__).resolve().parent
        functions = []
        for filename in ('officer_relocation_primitives.py', 'generic_facility_primitives.py'):
            module = ast.parse((root / filename).read_text())
            found = [n for n in ast.walk(module) if isinstance(n, ast.FunctionDef)
                     and n.name == 'relocate_officer']
            self.assertEqual(len(found), 1)
            function = found[0]
            changed = 0
            for node in ast.walk(function):
                if isinstance(node, ast.Assign) and any(isinstance(t, ast.Name)
                        and t.id == 'legion' for t in node.targets):
                    node.value = ast.Constant('source-proven-pointer-construction')
                    changed += 1
            self.assertEqual(changed, 1)
            functions.append(ast.dump(function, include_attributes=False))
        self.assertEqual(*functions)


if __name__ == '__main__': unittest.main()
