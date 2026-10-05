"""Independent S1/S2 native zero-refund-tail distance interpreter and checks.

Expected frames and callback records come from test-only source transcriptions.
The geography bytes are separately transcribed test fixtures; no production
planner, primitive, projector, trace, or constants constructs expectations.
The 005B8400 model retains this API's conservative readable getter-slot domain.
Callback mutations and RNG answers are explicit synthetic fixtures, not proof
that arbitrary game callbacks have these behaviors.
"""
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

import native_tail_distance_profile as m
import generic_facility_profile as previous
from check_generic_facility_profile import Oracle as GenericOracle, fixture as generic_fixture
from check_live_zero_refund_profile import HANDLER as ZERO_HANDLER, PRESENTATION as ZERO_PRESENTATION
from check_mission_event_composition_profile import HANDLER as SPECIAL_HANDLER
from check_mission_event_composition_profile import PRESENTATION as SPECIAL_PRESENTATION
from check_empty_legion_profile import DISTANCE
from check_return_route_target_force_profile import TERRITORY_TABLE, map_cell
from check_base_ownership_profile import building
from check_recursive_officer_return_profile import row, refresh_people, digest

DOMAIN = 'canonical-native-tail-distance-v1'
SOURCES = ('S1', 'S2')
MISSIONS = (9, 10, 12, 22, 23, 24)
HANDLER = dict(ZERO_HANDLER)
HANDLER.update(SPECIAL_HANDLER)
PRESENTATION = dict(ZERO_PRESENTATION)
PRESENTATION.update(SPECIAL_PRESENTATION)
ENTRIES = ('ruler-transfer', 'cancel-mission', 'event', 'relocate-officer',
    'prepare-movement', 'base-ownership', 'return', 'legion', 'governor',
    'capacity', 'role-sort', 'roster-sort', 'route', 'at-home', 'target-force',
    'force-legion', 'merge-legion')
I32_MIN, I32_MAX = -2147483648, 2147483647


def fixture(entry='cancel-mission', source='S1', mission=9, notify=False, **kw):
    f = generic_fixture(entry, source, mission=mission, notify=notify, **kw)
    f[1]['id'] = 'native-tail-distance-1'
    f[3].update(id='native-tail-distance-observe-v1', tailDistanceDomain=DOMAIN)
    if entry == 'event' and mission in (23, 24):
        f[1]['args'] = dict(id=8 if mission == 23 else 14,
            subjectType='person' if mission == 23 else 'building',
            subjectId=9 if mission == 23 else 42, argument=417)
        if mission == 24: row(f[0]['frame'])['missionArgs'][0] = 42
    return f


def run(f):
    return m.project_native_tail_distance(*f)


def geography(w, current=0, home=1, current_code=0, home_code=1):
    """Give distinct, deliberately non-square map addresses to both endpoints."""
    row(w, current, 'buildings').update(positionX=2, positionY=7)
    row(w, home, 'buildings').update(positionX=11, positionY=3)
    map_cell(w, 2, 7, 0xABCD0000 | (current_code << 5) | 31)
    map_cell(w, 11, 3, 0xDCBA0000 | (home_code << 5) | 7)


class Oracle(GenericOracle):
    """0049E4D0 and 005B8400, independently read from pinned S1/S2 asm."""
    def __init__(self, *args, **kw):
        super().__init__(*args, **kw)
        self.tail_distances = []

    def distance_native(self, current, home):
        # Both calls execute even when the first territory is -1. The second
        # source pointer is not replaced by the first, and table reads are
        # row-major current*42+home, not an absolute subtraction or rounding.
        with self.inside('0049E4D0', originBuildingId=current, targetBuildingId=home):
            first = self.territory(current)
            self.save(savedOriginTerritoryId=first)
            second = self.territory(home)
            result = DISTANCE[self.source][first*42+second] if 0 <= first <= 41 and 0 <= second <= 41 else -1
        self.tail_distances.append((current, home, first, second, result))
        return result

    def return_zero(self):
        p = self.actor()
        current = p['locationId'] if 0 <= p['locationId'] <= 86 else -1
        home = p['homeBaseId']
        with self.inside('005B8400', personId=self.pid, refund=0,
                         normalizedLocationId=current, savedHomeId=home):
            if current != home:
                # These conservative inherited getter obligations are not
                # new validity gates or a claim that pointer arithmetic reads.
                self.get('buildings', current)
                self.get('buildings', home)
                distance = self.distance_native(current, home if 0 <= home <= 16383 else -1)
                # EDI lives in the caller after the helper scope has returned.
                self.save(savedDistance=distance)
                if self.actor()['valid']:
                    self.actor()['missionId'] = 37
                    self.actor()['missionArgs'] = [0] * 5
                    self.acted(False)
                    if self.actor()['valid'] and self.pid not in self.w['activePersonIds']:
                        self.w['activePersonIds'].append(self.pid)
                if self.actor()['valid']:
                    self.actor()['missionDuration'] = distance & 255
            else:
                if self.actor()['allocated']:
                    self.actor()['missionId'] = -1
                    self.actor()['missionArgs'] = [0] * 5
                if self.actor()['valid']:
                    self.actor()['missionDuration'] = 0
                self.acted(True)
                if self.actor()['status'] != 5:
                    self.get('buildings', home)
                    self.boundary('full-return', 'effect', '004BF6F0', dict(
                        personId=self.pid, targetBuildingId=home,
                        showNotice=0, noticeVariant=1))


class NativeTailDistanceTests(unittest.TestCase):
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
        self.assertFalse(any(r['helper'] == '0049E4D0' for r in t['queries'] + t['observedEffects']))
        actual = [(s['originCityId'], s['targetCityId'], s['result'])
                  for s in t['steps'] if s['helper'] == '0047B480'
                  and any(c['helper'] == '005B8400' for c in s['callStack'])]
        self.assertEqual(actual, [v[2:] for v in expected.tail_distances])
        tail_steps = [s for s in t['steps'] if s['helper'] == '0049E4D0']
        self.assertEqual(len(tail_steps), len(expected.tail_distances))
        for step, (current, home, _, _, distance) in zip(tail_steps, expected.tail_distances):
            self.assertIs(step['native'], True)
            self.assertEqual(step['result'], distance)
            self.assertEqual(step['currentBuildingId'], current)
            self.assertEqual(step['homeBuildingId'], home)
            self.assertEqual(step['callStack'][-1]['helper'], '005B8400')
            self.assertEqual(step['callStack'][-1]['locals']['savedDistance'], distance)
            self.assertNotIn('0049E4D0', [c['helper'] for c in step['callStack']])
        self.assertEqual(f, before)
        if replay: self.assertEqual(t, m.replay_native_tail_distance(json.loads(json.dumps(t))))
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
        self.assertEqual(t['queries'], [])
        self.assertEqual(f, before)
        self.assertEqual(t, m.replay_native_tail_distance(t))
        return t

    def test_01_both_sources_all_seventeen_entries_and_honest_evidence(self):
        for source, entry in itertools.product(SOURCES, ENTRIES):
            with self.subTest(source=source, entry=entry):
                t = self.check_oracle(fixture(entry, source))
                self.assertEqual(t['profileId'], 'source-idb-S1-S2-native-tail-distance-v1')
                for key in ('stockVerified', 'vanillaVerified', 'machineCodeExecuted',
                    'callbacksAssumedNoninterfering', 'engineGuardIsOriginalRule',
                    'completeGameTransaction', 'allCancellationHandlersExecuted',
                    'rulerCaptureExecuted', 'presentationSegmentsExecuted'):
                    self.assertFalse(t['evidence'][key])
                self.assertFalse(t['rng']['globalConsumptionVerified'])
                self.assertTrue(t['evidence']['nativeTailDistanceProjection'])
                self.assertTrue(t['evidence']['tailDistanceSavedInParentScope'])
                self.assertFalse(t['evidence']['tailDistanceQueryRequired'])

    def test_02_all_six_handlers_native_no_distance_query_and_no_callback(self):
        for source, mission, notify in itertools.product(SOURCES, MISSIONS, (False, True)):
            with self.subTest(source=source, mission=mission, notify=notify):
                f = fixture(source=source, mission=mission, notify=notify)
                geography(f[0]['frame'], current_code=0, home_code=41)
                t = self.check_oracle(f)
                self.assertEqual(t['nativeResult'], 1)
                self.assertEqual(row(t['after']['frame'])['missionDuration'], DISTANCE[source][41])
                self.assertEqual(row(t['after']['frame'])['missionId'], 37)
                self.assertEqual(row(t['after']['frame'])['missionArgs'], [0]*5)
                self.assertEqual(t['queries'], [])
                self.assertEqual(t['rng']['localCalls'], 0)
                self.assertEqual(len(t['observedEffects']), int(notify))
                if notify: self.assertEqual(t['observedEffects'][0]['helper'], PRESENTATION[mission])

    def test_03_every_directed_city_pair_and_source_specific_values(self):
        # Complete geography coverage without allocating thousands of full
        # traces: independent source table fixtures must retain all 1764 bytes.
        for source in SOURCES:
            self.assertEqual(len(DISTANCE[source]), 42*42)
            for a, b in itertools.product(range(42), repeat=2):
                self.assertEqual(DISTANCE[source][a*42+b], DISTANCE[source][b*42+a])
        # The actual artifacts are symmetric. Directed order is therefore
        # checked through native argument scopes, not invented asymmetric data.
        pairs = [(0, 41), (41, 0), (0, 12), (12, 0), (15, 41), (41, 15), (9, 9)]
        for source, (a, b) in itertools.product(SOURCES, pairs):
            f = fixture(source=source)
            geography(f[0]['frame'], current_code=a, home_code=b)
            t = self.check_oracle(f)
            s = next(s for s in t['steps'] if s['helper'] == '0047B480')
            self.assertEqual((s['originCityId'], s['targetCityId'], s['result']),
                             (a, b, DISTANCE[source][a*42+b]))
            helper = next(c for c in s['callStack'] if c['helper'] == '0049E4D0')
            self.assertEqual(helper['locals'], dict(originBuildingId=0, targetBuildingId=1,
                                                    savedOriginTerritoryId=a))
        self.assertNotEqual(DISTANCE['S1'][12], DISTANCE['S2'][12])

    def test_04_map_index_bitfield_and_all_territory_bytes(self):
        for source, code in itertools.product(SOURCES, range(128)):
            f = fixture(source=source)
            geography(f[0]['frame'], current_code=code, home_code=41)
            t = self.check_oracle(f, replay=code in (0, 41, 87, 127))
            a = TERRITORY_TABLE[source][code]
            expected = DISTANCE[source][a*42+41] if a <= 41 else -1
            self.assertEqual(row(t['after']['frame'])['missionDuration'], expected & 255)
            reads = [s for s in t['steps'] if s['helper'] == '004839F0']
            self.assertEqual([s['mapIndex'] for s in reads], [407, 2203])
            self.assertEqual([s['territoryIndex'] for s in reads], [code, 41])
        for source, code in itertools.product(SOURCES, (96, 97, 98, 99, 102, 103, 106, 108, 120, 126, 127)):
            f = fixture(source=source)
            geography(f[0]['frame'], current_code=0, home_code=code)
            t = self.check_oracle(f, replay=False)
            b = TERRITORY_TABLE[source][code]
            self.assertEqual(row(t['after']['frame'])['missionDuration'],
                             (DISTANCE[source][b] if b <= 41 else -1) & 255)

    def test_05_invalid_coordinates_are_signed_and_skip_only_their_map_read(self):
        points = ((-32768, 0), (-1, 0), (0, -32768), (0, -1),
                  (200, 0), (0, 200), (32767, 199), (199, 32767))
        for source, bid, point in itertools.product(SOURCES, (0, 1), points):
            f = fixture(source=source)
            w = f[0]['frame']; geography(w)
            row(w, bid, 'buildings').update(positionX=point[0], positionY=point[1])
            t = self.check_oracle(f, replay=False)
            self.assertEqual(row(t['after']['frame'])['missionDuration'], 255)
            reads = [s['mapIndex'] for s in t['steps'] if s['helper'] == '004839F0']
            self.assertEqual(reads, [2203] if bid == 0 else [407])
        for source, point in itertools.product(SOURCES, ((0, 0), (0, 199), (199, 0), (199, 199))):
            f = fixture(source=source); geography(f[0]['frame'])
            row(f[0]['frame'], 0, 'buildings').update(positionX=point[0], positionY=point[1])
            map_cell(f[0]['frame'], *point, 41 << 5)
            t = self.check_oracle(f)
            self.assertEqual(row(t['after']['frame'])['missionDuration'], DISTANCE[source][41*42+1])

    def test_06_null_out_of_range_home_and_invalid_rows_are_minus_one(self):
        for source, mission, home in itertools.product(SOURCES, MISSIONS,
                (I32_MIN, -1, 16384, I32_MAX)):
            f = fixture(source=source, mission=mission)
            row(f[0]['frame'])['homeBaseId'] = home
            t = self.check_oracle(f, replay=False)
            self.assertEqual(row(t['after']['frame'])['missionDuration'], 255)
            s = next(s for s in t['steps'] if s['helper'] == '0047B480')
            self.assertEqual(s['targetCityId'], -1)
        for source in SOURCES:
            f = fixture(source=source); geography(f[0]['frame'])
            row(f[0]['frame'], 1, 'buildings').update(kind=-1, valid=False)
            t = self.check_oracle(f)
            self.assertEqual(row(t['after']['frame'])['missionDuration'], 255)
            self.assertEqual(len([s for s in t['steps'] if s['helper'] == '004839F0']), 1)

    def test_07_missing_slots_remain_errors_and_invalid_slots_are_not_missing(self):
        for source, missing in itertools.product(SOURCES, ('home', 'home-map', 'current-map')):
            f = fixture(source=source); w = f[0]['frame']; geography(w)
            table, rid = ('buildings', 1) if missing == 'home' else ('mapCells', 2203 if missing == 'home-map' else 407)
            w[table] = [r for r in w[table] if r['id'] != rid]
            with self.subTest(source=source, missing=missing): self.atomic_error(f)
        for source in SOURCES:
            # Source0049E4D0 still calls the second helper after first=-1.
            f = fixture(source=source); w = f[0]['frame']; geography(w)
            row(w, 0, 'buildings')['positionX'] = -1
            w['mapCells'] = [r for r in w['mapCells'] if r['id'] != 2203]
            self.atomic_error(f)
            # Presentation can invalidate current. Inherited tail still
            # requires a declared home slot before native helper execution.
            f = fixture(source=source, notify=True); w = f[0]['frame']
            row(w)['homeBaseId'] = 777
            def invalid_current(stage, v, c):
                if stage == 'presentation': row(v, 0, 'buildings').update(kind=-1, valid=False)
                return 0
            oracle = Oracle(f, effect=invalid_current)
            with self.assertRaises(ValueError): oracle.run()
            f[2]['records'] = copy.deepcopy(oracle.records)
            self.atomic_error(f)
            # The inherited eager getter domain also applies to a new current
            # ID selected live by presentation, before native validity checks.
            f = fixture(source=source, notify=True); w = f[0]['frame']
            w['buildings'] = [b for b in w['buildings'] if b['id'] != 86]
            def missing_current(stage, v, c):
                if stage == 'presentation': row(v)['locationId'] = 86
                return 0
            oracle = Oracle(f, effect=missing_current)
            with self.assertRaises(ValueError): oracle.run()
            f[2]['records'] = copy.deepcopy(oracle.records)
            self.atomic_error(f)
            # A valid slot with bad coordinates suppresses that map read.
            f = fixture(source=source); w = f[0]['frame']; geography(w)
            row(w, 1, 'buildings')['positionY'] = -1
            w['mapCells'] = [r for r in w['mapCells'] if r['id'] != 2203]
            self.assertEqual(row(self.check_oracle(f)['after']['frame'])['missionDuration'], 255)

    def test_08_generic_home_ids_kinds_ignore_subtype_and_owner_categories(self):
        for source, bid, kind in itertools.product(SOURCES, (87, 16383), (0, 1, 2, 3, 24, 63)):
            f = fixture(source=source); w = f[0]['frame']
            if bid == 87: w['buildings'].append(building(bid))
            row(w, bid, 'buildings').update(kind=kind, valid=True, subtypeValid=False,
                                          rawOwnerForceId=46, legionId=I32_MAX)
            row(w)['homeBaseId'] = bid
            geography(w, home=bid, current_code=42, home_code=86)
            # Geography does not read category or ownership/subtype fields.
            w['facilityInfos'] = []
            t = self.check_oracle(f, replay=False)
            a, b = TERRITORY_TABLE[source][42], TERRITORY_TABLE[source][86]
            self.assertEqual(row(t['after']['frame'])['missionDuration'], DISTANCE[source][a*42+b])
            self.assertFalse(any(s['helper'] == '00487EB0' for s in t['steps']))

    def test_09_live_presentation_mutations_determine_both_distance_endpoints(self):
        for source, mission in itertools.product(SOURCES, MISSIONS):
            f = fixture(source=source, mission=mission, notify=True)
            w = f[0]['frame']; geography(w, current_code=0, home_code=1)
            row(w, 42, 'buildings').update(valid=True, kind=1)
            row(w, 16383, 'buildings').update(valid=True, kind=63)
            geography(w, current=42, home=16383, current_code=12, home_code=41)
            map_cell(w, 19, 17, 0)  # Callback may rewrite, not expand, the declared domain.
            def effect(stage, v, c):
                if stage == 'presentation':
                    self.assertEqual(c['args']['currentBuildingId'], 0)
                    row(v).update(locationId=42, homeBaseId=16383, missionId=44,
                                  missionArgs=[I32_MIN, 1, 2, 3, I32_MAX])
                    # Coordinates and map contents are live as well as IDs.
                    row(v, 42, 'buildings').update(positionX=19, positionY=17)
                    map_cell(v, 19, 17, 86 << 5)
                    v['rngState'] = 12345
                    return 4
                return 0
            t = self.check_oracle(f, effect=effect)
            a = TERRITORY_TABLE[source][86]
            self.assertEqual(row(t['after']['frame'])['missionDuration'], DISTANCE[source][a*42+41])
            self.assertEqual(t['rng']['observedCalls'], 4)
            self.assertEqual(t['rng']['finalState'], 12345)
            self.assertEqual(t['queries'], [])

    def test_10_post_distance_observer_preserves_saved_parent_scalar(self):
        for source, mission, status in itertools.product(SOURCES, MISSIONS, (3, 5, 6, 99)):
            f = fixture(source=source, mission=mission)
            w = f[0]['frame']; geography(w, current_code=0, home_code=41)
            w['observerPresent'] = True
            expected = DISTANCE[source][41]
            def effect(stage, v, c):
                if stage == 'acted-observer':
                    self.assertEqual(c['callStack'][-1]['helper'], '005B8400')
                    tail = c['callStack'][-1]['locals']
                    self.assertEqual(tail['savedDistance'], expected)
                    self.assertEqual(tail['savedHomeId'], 1)
                    self.assertEqual(tail['normalizedLocationId'], 0)
                    self.assertNotIn('0049E4D0', [s['helper'] for s in c['callStack']])
                    row(v).update(status=status, homeBaseId=16383, locationId=87,
                                  missionId=12, missionDuration=199, missionArgs=[9]*5)
                    row(v, 0, 'buildings').update(kind=-1, valid=False)
                    row(v, 1, 'buildings').update(positionX=-1)
                    v['activePersonIds'] = [7, 7]
                    v['observerPresent'] = False
                return 0
            t = self.check_oracle(f, effect=effect, replay=False)
            p = row(t['after']['frame'])
            self.assertEqual(p['missionDuration'], expected if p['valid'] else 199)
            self.assertEqual(p['missionId'], 12)
            self.assertEqual(p['missionArgs'], [9]*5)
            self.assertEqual(t['after']['frame']['activePersonIds'], [7, 7])

    def test_11_post_distance_invalid_actor_skips_duration_and_active_insert(self):
        for source in SOURCES:
            f = fixture(source=source); w = f[0]['frame']; w['activePersonIds'] = []
            geography(w, current_code=12, home_code=41); w['observerPresent'] = True
            def effect(stage, v, c):
                if stage == 'acted-observer':
                    row(v).update(status=6, rawDword17C=0, missionDuration=191)
                    v['observerPresent'] = False
                return None
            t = self.check_oracle(f, effect=effect)
            self.assertEqual(row(t['after']['frame'])['missionDuration'], 191)
            self.assertEqual(t['after']['frame']['activePersonIds'], [])
            self.assertFalse(t['rng']['allCountsKnown'])
            self.assertIsNone(t['rng']['observedCalls'])

    def test_12_invalid_and_null_current_only_after_presentation(self):
        for source, location in itertools.product(SOURCES, (I32_MIN, -1, 87, 1086, 16383, I32_MAX)):
            f = fixture(source=source, notify=True)
            def effect(stage, v, c):
                if stage == 'presentation': row(v)['locationId'] = location
                return 0
            t = self.check_oracle(f, effect=effect, replay=False)
            self.assertEqual(row(t['after']['frame'])['missionDuration'], 255)
            s = next(s for s in t['steps'] if s['helper'] == '0047B480')
            self.assertEqual(s['originCityId'], -1)
        for source in SOURCES:
            f = fixture(source=source, notify=True)
            def effect(stage, v, c):
                if stage == 'presentation': row(v, 0, 'buildings').update(kind=-1, valid=False)
                return 0
            t = self.check_oracle(f, effect=effect)
            self.assertEqual(row(t['after']['frame'])['missionDuration'], 255)

    def test_13_same_home_suppresses_distance_and_map_obligations(self):
        for source, mission, home, query267 in itertools.product(SOURCES, MISSIONS, (0, -1), (False, True)):
            f = fixture(source=source, mission=mission, notify=home == -1)
            row(f[0]['frame']).update(homeBaseId=home, status=5)
            f[0]['frame']['mapCells'] = []
            def effect(stage, v, c):
                if stage == 'presentation': row(v)['locationId'] = 87
                return 0
            t = self.check_oracle(f, effect=effect, query267=query267, replay=False)
            self.assertEqual(row(t['after']['frame'])['missionDuration'], 0)
            self.assertEqual(row(t['after']['frame'])['missionId'], -1)
            self.assertEqual(t['returnCalls'], 0)
            self.assertFalse(any(s['helper'] in ('0049E4D0', '0047B480', '0049E450/valid') for s in t['steps']))
            self.assertEqual(len([r for r in t['observedEffects'] if r['helper'] == '004890F0']), int(source == 'S2'))

    def test_14_real_event_routes_and_no_invented_predicates_for_twelve_twenty_two(self):
        for source, mission in itertools.product(SOURCES, MISSIONS):
            f = fixture('event', source, mission=mission)
            geography(f[0]['frame'], current_code=12, home_code=41)
            t = self.check_oracle(f)
            v = t['events'][0]['visits'][0]
            expected = mission in (9, 10, 23, 24)
            self.assertEqual(v['route'], 'handler-called' if expected else 'predicate-false')
            self.assertEqual(v['handlerReturn'], 1 if expected else None)
            distances = [s for s in t['steps'] if s['helper'] == '0047B480']
            self.assertEqual(len(distances), int(expected))

    def test_15_nested_event_return_distance_and_parent_restoration(self):
        for source, mission in itertools.product(SOURCES, (9, 10)):
            f = fixture('ruler-transfer', source, mission=mission)
            w = f[0]['frame']
            row(w).update(homeBaseId=0, locationId=0, status=3, rawLegionId=0,
                          missionId=mission, missionArgs=[87, 9, 3, 4, 5])
            row(w, 0, 'forces')['playerIndex'] = 0
            row(w, 9).update(status=5, homeBaseId=1, locationId=1, rawLegionId=0,
                            missionId=23, missionArgs=[0, 9, 3, 4, 5])
            row(w, 0, 'buildings')['governorId'] = 9
            geography(w, current_code=12, home_code=41)
            w['activePersonIds'] = [7, 9, 7]
            def effect(stage, v, c):
                if stage == 'presentation' and c['personId'] == 9:
                    self.assertEqual(c['eventDepth'], 2)
                    row(v, 9)['locationId'] = 0
                    v['observerPresent'] = True
                elif stage == 'acted-observer' and c['personId'] == 9:
                    self.assertEqual(c['callStack'][-1]['helper'], '005B8400')
                    self.assertEqual(c['callStack'][-1]['locals']['savedDistance'], DISTANCE[source][12*42+41])
                    v['observerPresent'] = False
                elif stage == 'ownership-event-tail':
                    self.assertEqual(c['eventDepth'], 1)
                    self.assertEqual(c['callStack'][0]['helper'], '004B40C0')
                    self.assertNotIn('0049E4D0', [s['helper'] for s in c['callStack']])
                return 0
            t = self.check_oracle(f, effect=effect)
            self.assertGreaterEqual(t['returnCalls'], 1)
            self.assertEqual(row(t['after']['frame'], 9)['missionDuration'], DISTANCE[source][12*42+41])
            self.assertTrue(any(e['parentEventIndex'] == 0 for e in t['events']))
            f[3]['engineGuard']['maxEventDepth'] = 1
            self.atomic_defer(f, 'engine-guard-event-depth')

    def test_16_reject_mode_accepts_native_distance_but_rejects_real_effects(self):
        for source, mission in itertools.product(SOURCES, MISSIONS):
            f = fixture(source=source, mission=mission); geography(f[0]['frame'])
            f[3]['unknownEffects'] = 'reject'
            t = self.check_oracle(f)
            self.assertEqual(t['observedEffects'], [])
            self.assertEqual(t['queries'], [])
            f = fixture(source=source, mission=mission, notify=True)
            f[3]['unknownEffects'] = 'reject'
            self.atomic_defer(f, 'unresolved-effect:' + PRESENTATION[mission])
            f = fixture(source=source, mission=mission)
            f[0]['frame']['observerPresent'] = True
            f[3]['unknownEffects'] = 'reject'
            self.atomic_defer(f, 'unresolved-effect:observer.virtual1B4')

    def test_17_native_call_budget_including_new_scopes_is_atomic(self):
        for source in SOURCES:
            f = fixture(source=source); geography(f[0]['frame']); Oracle(f).run()
            t = run(f); budget = t['nativeCalls']
            self.assertGreaterEqual(budget, 6)
            for limit in (1, budget-2, budget-1):
                f[3]['engineGuard']['maxNativeCalls'] = limit
                self.atomic_defer(f, 'engine-guard-native-call-budget')
            f[3]['engineGuard']['maxNativeCalls'] = budget
            self.assertTrue(run(f)['accepted'])

    def test_18_stale_legacy_query_is_unused_and_cannot_override_native_result(self):
        for source in SOURCES:
            old = generic_fixture('cancel-mission', source)
            GenericOracle(old, distance=222).run()
            self.assertEqual(old[2]['records'][0]['helper'], '0049E4D0')
            new = copy.deepcopy(old)
            new[3]['tailDistanceDomain'] = DOMAIN
            self.atomic_error(new)
            f = fixture(source=source); Oracle(f).run()
            f[2]['records'] = copy.deepcopy(old[2]['records'])
            self.atomic_error(f)
            f = fixture(source=source, notify=True); Oracle(f).run()
            legacy = copy.deepcopy(old[2]['records'][0]); legacy['index'] = len(f[2]['records'])
            f[2]['records'].append(legacy)
            self.atomic_error(f)

    def test_19_stale_observer_frame_saved_stack_source_order_and_rng_rejected(self):
        for source in SOURCES:
            f = fixture(source=source, notify=True)
            f[0]['frame']['observerPresent'] = True
            geography(f[0]['frame']); Oracle(f).run()
            self.assertEqual(len(f[2]['records']), 2)
            for defect in ('missing', 'extra', 'reorder', 'source', 'before', 'args',
                           'stack-distance', 'stack-home', 'stack-helper', 'bool-rng', 'negative-rng'):
                g = copy.deepcopy(f); records = g[2]['records']; r = records[-1]
                if defect == 'missing': records.pop()
                elif defect == 'extra': records.append(copy.deepcopy(r)); records[-1]['index'] = 2
                elif defect == 'reorder': records.reverse(); [v.update(index=i) for i, v in enumerate(records)]
                elif defect == 'source': r['source'] = 'S2' if source == 'S1' else 'S1'
                elif defect == 'before': row(r['before'])['missionDuration'] += 1
                elif defect == 'args': r['args']['caller'] = '004BBAA0'
                elif defect == 'stack-distance': r['callStack'][-1]['locals']['savedDistance'] = 222
                elif defect == 'stack-home': r['callStack'][-1]['locals']['savedHomeId'] = 42
                elif defect == 'stack-helper': r['callStack'][-1]['helper'] = '0049E4D0'
                elif defect == 'bool-rng': r['rngConsumption']['calls'] = True
                else: r['rngConsumption']['calls'] = -1
                with self.subTest(source=source, defect=defect): self.atomic_error(g)

    def test_20_strict_policy_version_domains_and_trace_tamper(self):
        for key in ('tailDistanceDomain', 'facilityDomain', 'zeroRefundDomain',
                    'relocationDomain', 'frameProfile', 'registryDomain', 'nativePlatform'):
            f = fixture(); f[3][key] = 'wrong'; self.atomic_error(f)
            f = fixture(); del f[3][key]; self.atomic_error(f)
        f = fixture(); t = self.check_oracle(f)
        for key in ('duration', 'distance', 'profile', 'policy', 'source'):
            g = copy.deepcopy(t)
            if key == 'duration': row(g['after']['frame'])['missionDuration'] = 222
            elif key == 'distance': next(s for s in g['steps'] if s['helper'] == '0047B480')['result'] = 222
            elif key == 'profile': g['profileId'] = previous.PROFILE_ID
            elif key == 'policy': g['policy']['tailDistanceDomain'] = 'wrong'
            else: g['source'] = 'S2'
            for rehash in (False, True):
                if rehash: g['traceHash'] = digest({k:v for k,v in g.items() if k != 'traceHash'})
                with self.assertRaises(ValueError): m.replay_native_tail_distance(g)

    def test_21_revision_and_idempotency_require_matching_full_payload(self):
        for source in SOURCES:
            f = fixture(source=source); t = self.check_oracle(f)
            g = copy.deepcopy(f); g[0] = copy.deepcopy(t['after'])
            replay = run(g)
            self.assertTrue(replay['replayed']); self.assertEqual(replay['after'], g[0])
            g[3]['id'] += '-changed'; self.atomic_defer(g, 'replay-payload-conflict')
            f = fixture(source=source); f[1]['expectedRevision'] = 1
            self.atomic_defer(f, 'revision-conflict')
            f = fixture(source=source); f[0]['revision'] = I32_MAX
            f[1]['expectedRevision'] = I32_MAX; self.atomic_error(f)

    def test_22_old_api_preserves_observed_distance_and_cannot_accept_new_policy(self):
        for source in SOURCES:
            old = generic_fixture('cancel-mission', source)
            GenericOracle(old, distance=222).run(); before = copy.deepcopy(old)
            t = previous.project_generic_facility(*old)
            self.assertTrue(t['accepted'])
            self.assertEqual(t['queries'][0]['helper'], '0049E4D0')
            self.assertEqual(row(t['after']['frame'])['missionDuration'], 222)
            self.assertEqual(old, before)
            self.assertEqual(t, previous.replay_generic_facility(json.loads(json.dumps(t))))
            with self.assertRaises(ValueError): run(old)
            new = fixture(source=source); nt = self.check_oracle(new)
            with self.assertRaises(ValueError): previous.project_generic_facility(*new)
            with self.assertRaises(ValueError): previous.replay_generic_facility(nt)
            with self.assertRaises(ValueError): m.replay_native_tail_distance(t)

    def test_23_native_composition_does_not_call_legacy_projector_transactions(self):
        names = ('generic_facility_profile', 'live_zero_refund_profile',
            'officer_relocation_profile', 'base_ownership_events_profile',
            'empty_legion_redistribution_profile', 'return_route_target_force_profile',
            'native_roster_sort_profile', 'recursive_officer_return_profile',
            'mission_event_composition_profile', 'mission_event_listener_profile',
            'mission_notification_tail_profile', 'officer_return_finalizer_profile',
            'legion_role_reconciliation_profile', 'return_mission_lifecycle_profile')
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

    def test_24_seeded_source_matrix_preserves_read_order_and_low_byte(self):
        rng = random.Random(0x5B8442)
        for i in range(144):
            source = SOURCES[i % 2]
            mission = rng.choice(MISSIONS)
            f = fixture(source=source, mission=mission)
            a, b = rng.randrange(128), rng.randrange(128)
            geography(f[0]['frame'], current_code=a, home_code=b)
            if i % 9 == 0: row(f[0]['frame'], 1, 'buildings')['positionX'] = -1
            if i % 13 == 0: row(f[0]['frame'], 0, 'buildings')['positionY'] = 200
            t = self.check_oracle(f, replay=i % 23 == 0)
            self.assertEqual(t['rng']['localCalls'], 0)
            self.assertEqual(t['queries'], [])
            self.assertEqual(t['nativeResult'], 1)

    def test_25_synthetic_asymmetry_proves_forwarding_and_row_major_index_only(self):
        # Deliberately NOT source evidence: the pinned source tables are
        # symmetric. This isolated synthetic table catches accidental argument
        # reversal or row/column indexing without mislabeling it as gameplay.
        raw = bytearray(42*42)
        raw[12*42+41], raw[41*42+12] = 17, 203
        for source, (a, b) in itertools.product(SOURCES, ((12, 41), (41, 12))):
            f = fixture(source=source)
            geography(f[0]['frame'], current_code=a, home_code=b)
            before = copy.deepcopy(f)
            with patch('return_mission_lifecycle_profile.source_data', return_value=bytes(raw)):
                t = run(f)
                self.assertTrue(t['accepted'])
                self.assertEqual(row(t['after']['frame'])['missionDuration'], raw[a*42+b])
                self.assertEqual(t['queries'], [])
                self.assertEqual(t, m.replay_native_tail_distance(t))
            self.assertEqual(f, before)

    def test_26_raw_home_comparison_precedes_null_pointer_normalization(self):
        for source, mission, home in itertools.product(SOURCES, MISSIONS, (-1, -2, I32_MIN)):
            f = fixture(source=source, mission=mission, notify=True)
            def effect(stage, v, c):
                if stage == 'presentation':
                    row(v).update(status=5, locationId=87, homeBaseId=home)
                return 0
            t = self.check_oracle(f, effect=effect, replay=False)
            p = row(t['after']['frame'])
            self.assertEqual((p['missionId'], p['missionDuration']),
                             (-1, 0) if home == -1 else (37, 255))
            distance = [s for s in t['steps'] if s['helper'] == '0049E4D0']
            self.assertEqual(len(distance), int(home != -1))
            if distance:
                self.assertEqual(distance[0]['currentBuildingId'], -1)
                self.assertEqual(distance[0]['homeBuildingId'], -1)

    def test_27_pinned_source_instructions_and_independent_geography_bytes(self):
        root = Path(__file__).resolve().parents[1] / 'docs/sources'
        bodies = (
            ('mission-notification-tail', 'selected', 0x005B8400, 0x005B84E2,
             '72e5086aa0b0a1dd846a1c805df826fd010ca8199f5880d1491e62e74369d6b0'),
            ('officer-relocation', '0049E4D0', 0x0049E4D0, 0x0049E4FB,
             'ceefad36fa02092bcedd902908fbb6309c9bea3d4d16898cb72edda05d683ac1'),
            ('officer-relocation', '0049E450', 0x0049E450, 0x0049E4C4,
             '13b358fb26d20b04b393bc594a40c2b4d4487ed96c26fd6059a9d9659a26d67d'),
            ('officer-relocation', '0047B480', 0x0047B480, 0x0047B4AA,
             'cc2baaaec3925264a81eefcf859bdf803023623ad5fbf37e4c9a94920a9c89d7'))
        critical = {0x005B8413: '7e03', 0x005B841E: '3bc7',
                    0x005B8442: 'e88960eeff', 0x005B844F: '8bf8',
                    0x005B846C: 'e8efd1eeff', 0x0049E4D9: 'e872ffffff',
                    0x0049E4E7: 'e864ffffff', 0x0049E4EE: 'e88dcffdff',
                    0x0049E475: '0fbfc0', 0x0049E478: 'c1f910',
                    0x0049E4A0: '03c1', 0x0049E4AC: 'c1ea05',
                    0x0049E4AF: '83e27f', 0x0047B49A: '6bc02a',
                    0x0047B49D: '0fb6840830b87900'}
        for source, (folder, name, start, end, sha) in itertools.product(SOURCES, bodies):
            raw, cursor = bytearray(), start
            text = (root / folder / (source + '-' + name + '.asm.txt')).read_text()
            for line in text.splitlines():
                match = re.match(r'^([0-9A-Fa-f]{8})\s+((?:[0-9a-f]{2}\s+)+)(?=[a-z])', line)
                if not match: continue
                address = int(match.group(1), 16)
                if not start <= address < end: continue
                self.assertEqual(address, cursor)
                data = bytes.fromhex(match.group(2)); raw.extend(data); cursor += len(data)
                if address in critical: self.assertEqual(data.hex(), critical[address])
            self.assertEqual(cursor, end)
            self.assertEqual(hashlib.sha256(raw).hexdigest(), sha)
        for source, name, start, expected in (
                (s, name, start, value) for s in SOURCES for name, start, value in (
                    ('0079B830', 0x0079B830, DISTANCE[s]),
                    ('0079C2B0', 0x0079C2B0, bytes(TERRITORY_TABLE[s])))):
            raw, cursor = bytearray(), start
            for line in (root / 'empty-legion-redistribution' / (source+'-'+name+'.asm.txt')).read_text().splitlines():
                parts = line.split()
                if not parts: continue
                self.assertEqual(int(parts[0], 16), cursor)
                data = bytes.fromhex(' '.join(parts[1:])); raw.extend(data); cursor += len(data)
            self.assertEqual(bytes(raw), expected)

    def test_28_frozen_generic_predecessor_and_shared_movement_primitives(self):
        root = Path(__file__).resolve().parent
        frozen = {
            'generic_facility_profile.py': '0a91f92d8dd1a23e6bd48a2f395239711d9a6dd83dbd27dd9dbf6b239c917b0d',
            'generic_facility_primitives.py': '7d06405e7c9cc795c8ec09a31799ca0fe051b0e2809e0687a134fca58c77f461',
            'officer_relocation_primitives.py': 'f0787cd4f58a47ed83806d851ab8c52fce08817354cee9255c9ad124cd47cc51',
            'check_generic_facility_profile.py': 'ee764ffcbf5922e70403677510931aaa5bb49ee03a23240875d53c4ba2a851ad',
        }
        for filename, expected in frozen.items():
            self.assertEqual(hashlib.sha256((root / filename).read_bytes()).hexdigest(), expected)

    def test_29_presentation_invalidates_actor_but_native_distance_still_executes(self):
        for source, mission, status in itertools.product(SOURCES, MISSIONS, (6, 99)):
            f = fixture(source=source, mission=mission, notify=True)
            geography(f[0]['frame'], current_code=41, home_code=12)
            def effect(stage, v, c):
                self.assertEqual(stage, 'presentation')
                row(v).update(status=status, rawDword17C=0, missionId=44,
                              missionDuration=177, missionArgs=[8]*5)
                v['activePersonIds'] = []
                v['observerPresent'] = True
                return 0
            t = self.check_oracle(f, effect=effect, replay=False)
            p = row(t['after']['frame'])
            self.assertFalse(p['valid'])
            self.assertEqual((p['missionId'], p['missionDuration'], p['missionArgs']), (44, 177, [8]*5))
            self.assertEqual(t['after']['frame']['activePersonIds'], [])
            self.assertEqual(t['nativeResult'], 1)
            self.assertEqual(len([s for s in t['steps'] if s['helper'] == '0049E4D0']), 1)
            self.assertEqual(len(t['observedEffects']), 1)


if __name__ == '__main__': unittest.main()
