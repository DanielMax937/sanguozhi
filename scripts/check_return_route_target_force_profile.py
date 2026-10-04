"""P0-64 independent native route/ownership oracle and transaction tests.

The interpreter extends the independent P0-63 oracle, not its production planner.
Route selector sets, output writes, raw-category precedence and coordinate rules
are reconstructed from S1/S2 byte evidence. Mutable effect records are synthetic
fixtures at the remaining real outer callbacks, never invented route callbacks.
"""
import copy
import itertools
import json
import random
import unittest
from unittest.mock import patch

import return_route_target_force_profile as m
from check_native_roster_sort_profile import (
    Oracle as SortOracle, fixture as sort_fixture, person, NATIVE_STEPS)
from check_recursive_officer_return_profile import row, refresh_people, digest, building as old_building

FRAME = 'source-idb-S1-S2-return-route-frame-v1'
ROUTE_DOMAIN = 'canonical-unaliased-route-output-v1'
# These are explicit independently read dispatch sets, rather than runtime data.
ARG0_MISSIONS = {9, 10, 23, 24}
ARG1_MISSIONS = {12}
RULER_MISSIONS = set(range(15, 23))


# Independently transcribed raw 0079C2B0..0079C330 bytes. MOVZX preserves255.
_COMMON_TAIL = (1,8,21,24,39,41,0,0,0,255,255,255,255,0,0,255,255,1,0,255,
                255,255,255,0,0,0,0,1,0,1,0,0,0,255,255,0,0,0,0,255,255)
TERRITORY_TABLE = {
    'S1': tuple(range(42)) + (5,15,17,17,17,36,37,37,39,39,0,4,5,6,7,7,8,8,10,
          11,12,15,15,17,17,18,22,22,23,24,25,26,26,26,26,27,28,29,30,30,30,
          31,32,32,35) + _COMMON_TAIL,
    'S2': tuple(range(42)) + (19,5,17,12,17,36,37,2,2,33,15,3,31,21,26,7,7,29,
          28,11,33,18,40,17,31,37,22,31,23,15,7,32,29,0,39,27,39,4,5,13,30,
          31,7,10,35) + _COMMON_TAIL,
}


def building(bid, **changes):
    result = dict(old_building(bid), rawOwnerForceId=-1, positionX=0, positionY=0)
    result.update(changes)
    return result


def fixture(entry='route', source='S1', **kw):
    f = sort_fixture(entry=entry if entry in (
        'event', 'return', 'legion', 'governor', 'capacity', 'role-sort', 'roster-sort') else 'governor',
        source=source, **kw)
    w = f[0]['frame']
    for b in w['buildings']:
        b.update(rawOwnerForceId=-1, positionX=0, positionY=0)
    for force in w['forces']: force['rulerId'] = 9
    w['facilityInfos'] = [dict(id=i, category=0, data={}) for i in (0, 1, 2, 3, 24, 63)]
    w['mapCells'] = [dict(id=0, rawTerritoryDword=0, data={})]
    if entry == 'route': args = dict(personId=7, targetOutput=True, territoryOutput=True)
    elif entry == 'at-home': args = dict(personId=7)
    elif entry == 'target-force': args = dict(buildingId=0)
    else: args = f[1]['args']
    f[1].update(id='route-1', entry=entry, args=args)
    f[3].update(id='route-observe-v1', frameProfile=FRAME, routeDomain=ROUTE_DOMAIN)
    return f


def run(f):
    return m.project_return_route_target_force(*f)


def refresh_force(force):
    force['valid'] = 0 <= force['rulerId'] <= 1099


def add_city(w, cid, **changes):
    if not any(b['id'] == cid for b in w['buildings']): w['buildings'].append(building(cid, **changes))
    if not any(c['id'] == cid for c in w['cities']):
        w['cities'].append(dict(id=cid, valid=changes.get('subtypeValid', True), data={}))


def map_cell(w, x, y, value):
    index = x * 200 + y
    found = next((c for c in w['mapCells'] if c['id'] == index), None)
    if found: found['rawTerritoryDword'] = value
    else: w['mapCells'].append(dict(id=index, rawTerritoryDword=value, data={}))


class OracleMapReadError(RuntimeError):
    """Unchecked native ownership coordinate escapes the bounded map domain."""


class Oracle(SortOracle):
    def get(self, table, rid):
        if table not in ('facilityInfos', 'mapCells'): return super().get(table, rid)
        if not 0 <= rid <= (63 if table == 'facilityInfos' else 39999): return None
        record = next((r for r in self.w[table] if r['id'] == rid), None)
        if record is None: raise ValueError('oracle missing ' + table + ' slot ' + str(rid))
        return record

    def territory_at(self, x, y, checked):
        if checked and not (0 <= x < 200 and 0 <= y < 200): return -1
        index = x * 200 + y
        if not 0 <= index < 40000: raise OracleMapReadError(index)
        code = (self.get('mapCells', index)['rawTerritoryDword'] >> 5) & 127
        return TERRITORY_TABLE[self.source][code]

    def territory(self, bid):
        b = self.get('buildings', bid)
        if b is None or not b['valid']: return -1
        return self.territory_at(b['positionX'], b['positionY'], True)

    def route(self, pid, target_output, territory_output, stage):
        with self.inside('005BA320', personId=pid, targetOutput=target_output,
                         territoryOutput=territory_output, stage=stage):
            p = self.get('persons', pid)
            mission = p['missionId']
            target = None
            if mission in ARG0_MISSIONS: target = p['missionArgs'][0]
            elif mission in ARG1_MISSIONS: target = p['missionArgs'][1]
            elif mission in RULER_MISSIONS:
                fid = p['missionArgs'][0]
                if 0 <= fid <= 46:
                    # Deliberately no force-valid gate. This raw read precedes
                    # the canonical person getter and person-valid predicate.
                    force = self.get('forces', fid)
                    ruler = self.get('persons', force['rulerId'])
                    if ruler is not None and ruler['valid']: target = ruler['homeBaseId']
            elif mission == 37: target = p['homeBaseId']
            accepted = target is not None and 0 <= target <= 16383
            return dict(routed=accepted, targetWritten=accepted and target_output,
                        targetId=target if accepted and target_output else None,
                        territoryWritten=accepted and territory_output,
                        territoryId=self.territory(target) if accepted and territory_output else None)

    def at_home(self, pid, stage):
        with self.inside('00489730', personId=pid, stage=stage):
            p = self.get('persons', pid)
            home = p['homeBaseId'] if 0 <= p['homeBaseId'] <= 86 else -1
            location = p['locationId']
            if home != location: return False
            with self.inside('004896C0', personId=pid,
                             comparedHomeId=home, comparedLocationId=location):
                if self.route(pid, False, False, stage)['routed']: return False
            p = self.get('persons', pid)
            return self.valid('buildings', p['homeBaseId']) and self.base_legion(p['homeBaseId']) == p['rawLegionId']

    def subtype_force(self, bid):
        lid = self.get('buildings', bid)['legionId']
        legion = self.get('legions', lid)
        return legion['forceId'] if legion is not None and legion['valid'] else -1

    def target_force(self, bid, stage):
        with self.inside('00487EB0', buildingId=bid, stage=stage):
            b = self.get('buildings', bid)
            kind = b['kind']
            info = self.get('facilityInfos', kind)
            category = info['category'] if info is not None else -1
            if category in (1, 2) or (category == 3 and kind != 24): return b['rawOwnerForceId']
            if category == 4:
                city = self.territory_at(b['positionX'], b['positionY'], False)
                if self.valid('cities', city): return self.subtype_force(city)
            if self.subtype(bid): return self.subtype_force(bid)
            return -1

    def run(self):
        entry, args = self.f[1]['entry'], self.f[1]['args']
        if entry == 'route':
            self.native_result = self.route(args['personId'], args['targetOutput'], args['territoryOutput'], 'direct')
        elif entry == 'at-home': self.native_result = self.at_home(args['personId'], 'direct')
        elif entry == 'target-force': self.native_result = self.target_force(args['buildingId'], 'direct')
        else: return super().run()
        self.f[2]['records'] = copy.deepcopy(self.records)
        return self


class RouteTests(unittest.TestCase):
    maxDiff = 4000

    def check_oracle(self, f, replay=True, **kw):
        expected = Oracle(f, **kw).run()
        original = copy.deepcopy(f)
        result = run(f)
        self.assertTrue(result['accepted'], result['reason'])
        self.assertEqual(result['after']['frame'], expected.w)
        self.assertEqual(result['nativeResult'], expected.native_result)
        self.assertEqual(result['events'], expected.events)
        self.assertEqual(result['returnCalls'], expected.return_calls)
        self.assertEqual(result['observedEffects'], [r for r in expected.records if r['kind'] != 'query'])
        self.assertEqual(result['queries'], [r for r in expected.records if r['kind'] == 'query'])
        self.assertEqual([s for s in result['steps'] if s['helper'] in NATIVE_STEPS
                          and not (s['helper'] == '00491310' and 'personId' not in s)], expected.audit)
        self.assertEqual(result['after']['revision'], f[0]['revision'] + 1)
        self.assertEqual(len(result['after']['appliedCommands']), len(f[0]['appliedCommands']) + 1)
        self.assertEqual(f, original)
        if replay: self.assertEqual(result, m.replay_return_route_target_force(json.loads(json.dumps(result))))
        return result

    def atomic_error(self, f):
        before = copy.deepcopy(f)
        with self.assertRaises(ValueError): run(f)
        self.assertEqual(f, before)

    def atomic_defer(self, f, reason):
        before = copy.deepcopy(f)
        result = run(f)
        self.assertFalse(result['accepted'])
        self.assertEqual(result['reason'], reason)
        self.assertEqual(result['after'], f[0])
        self.assertEqual(result['steps'], [])
        self.assertEqual(result['events'], [])
        self.assertEqual(f, before)
        self.assertEqual(result, m.replay_return_route_target_force(result))
        return result

    def test_01_all_entry_points_source_and_roundtrip(self):
        for source, entry in itertools.product(('S1', 'S2'), (
                'route', 'at-home', 'target-force', 'return', 'event', 'legion',
                'governor', 'capacity', 'roster-sort', 'role-sort')):
            with self.subTest(source=source, entry=entry):
                t = self.check_oracle(fixture(entry, source))
                self.assertNotIn('005BA320', [r['helper'] for r in t['observedEffects']])
                self.assertNotIn('00487EB0/virtual+40', [r['helper'] for r in t['observedEffects']])
                self.assertEqual(t['rng']['localCalls'], 0)
                for key in ('globalConsumptionVerified',): self.assertFalse(t['rng'][key])
                for key in ('callbacksAssumedNoninterfering', 'stockVerified', 'vanillaVerified',
                            'machineCodeExecuted', 'engineGuardIsOriginalRule'):
                    self.assertFalse(t['evidence'][key])

    def test_02_dispatch_exhaustive_missions_and_optional_outputs(self):
        for source, mission, target, territory in itertools.product(
                ('S1', 'S2'), range(-2, 46), (False, True), (False, True)):
            f = fixture(source=source)
            f[1]['args'].update(targetOutput=target, territoryOutput=territory)
            w = f[0]['frame']; row(w).update(missionId=mission, missionArgs=[42, 1, -8, 3, 0], homeBaseId=0)
            row(w, 9)['homeBaseId'] = 1
            # Force route uses arg0=42, distinctly from direct target 42.
            w['forces'].append(dict(copy.deepcopy(w['forces'][0]), id=42))
            t = self.check_oracle(f, replay=False)
            expected_target = 42 if mission in ARG0_MISSIONS else 1 if mission in ARG1_MISSIONS | RULER_MISSIONS else 0 if mission == 37 else None
            self.assertEqual(t['nativeResult']['routed'], expected_target is not None)
            self.assertEqual(t['nativeResult']['targetId'], expected_target if target else None)
            self.assertEqual(t['observedEffects'], [])

    def test_03_numeric_target_limits_no_allocation_gate(self):
        for source, mission, target, output in itertools.product(
                ('S1', 'S2'), (9, 12, 37), (-2**31, -1, 0, 86, 87, 16383, 16384, 2**31-1), (False, True)):
            f = fixture(source=source)
            w = f[0]['frame']; p = row(w)
            p.update(missionId=mission, homeBaseId=target, status=9, rawDword17C=0)
            p['missionArgs'][:2] = [target, target]
            refresh_people(w)
            f[1]['args'].update(targetOutput=output, territoryOutput=False)
            t = self.check_oracle(f, replay=False)
            self.assertEqual(t['nativeResult']['routed'], 0 <= target <= 16383)
            self.assertFalse(t['nativeResult']['territoryWritten'])

    def test_04_force_ruler_person_predicate_and_raw_home(self):
        for source, mission, status, raw in itertools.product(
                ('S1', 'S2'), range(15, 23), range(-1, 11), (0, 0xffffffff)):
            f = fixture(source=source)
            w = f[0]['frame']; row(w).update(missionId=mission)
            row(w, 9).update(status=status, rawDword17C=raw, homeBaseId=16383)
            refresh_people(w)
            f[1]['args']['territoryOutput'] = False
            t = self.check_oracle(f, replay=False)
            expected = bool(raw or status in (0, 1, 2, 3, 4, 5, 7))
            self.assertEqual(t['nativeResult']['routed'], expected)
            self.assertEqual(t['nativeResult']['targetId'], 16383 if expected else None)

    def test_05_force_ruler_range_shortcuts_and_missing_slots(self):
        for fid in (-2**31, -1, 47, 2**31-1):
            f = fixture(); row(f[0]['frame']).update(missionId=15, missionArgs=[fid, 0, 0, 0, 0])
            f[0]['frame']['forces'] = []
            self.assertFalse(self.check_oracle(f)['nativeResult']['routed'])
        for ruler in (-2**31, -1, 1100, 2**31-1):
            f = fixture(); w = f[0]['frame']; row(w)['missionId'] = 15
            row(w, 0, 'forces').update(rulerId=ruler, valid=False)
            self.assertFalse(self.check_oracle(f)['nativeResult']['routed'])
        for table in ('forces', 'persons'):
            f = fixture(); w = f[0]['frame']; row(w)['missionId'] = 15
            if table == 'forces': w[table] = []
            else: w[table] = [p for p in w[table] if p['id'] != 9]
            self.atomic_error(f)
        f = fixture(); row(f[0]['frame'], 0, 'forces')['valid'] = False
        self.atomic_error(f)

    def test_06_output_false_does_not_read_unrequested_target(self):
        for target, territory in itertools.product((False, True), (False, True)):
            f = fixture(); w = f[0]['frame']; row(w).update(missionId=9, missionArgs=[8123, 0, 0, 0, 0])
            f[1]['args'].update(targetOutput=target, territoryOutput=territory)
            if territory: self.atomic_error(f)
            else:
                t = self.check_oracle(f)
                self.assertTrue(t['nativeResult']['routed'])
                self.assertEqual(t['nativeResult']['targetId'], 8123 if target else None)
        f = fixture(); w = f[0]['frame']; row(w)['missionId'] = -1
        w['buildings'] = []; w['cities'] = []; w['mapCells'] = []
        self.assertFalse(self.check_oracle(f)['nativeResult']['routed'])

    def test_07_route_territory_building_valid_and_coordinate_gates(self):
        for source, valid, x, y in itertools.product(('S1', 'S2'), (False, True), (-32768, -1, 0, 199, 200, 32767), (0, 199)):
            f = fixture(source=source); w = f[0]['frame']
            row(w)['missionId'] = 37
            row(w, 0, 'buildings').update(valid=valid, positionX=x, positionY=y)
            if valid and 0 <= x < 200: map_cell(w, x, y, 0)
            else: w['mapCells'] = []
            t = self.check_oracle(f, replay=False)
            self.assertTrue(t['nativeResult']['routed'])
            self.assertEqual(t['nativeResult']['territoryId'], TERRITORY_TABLE[source][0] if valid and 0 <= x < 200 else -1)
        for y in (-32768, -1, 200, 32767):
            f = fixture(); row(f[0]['frame'])['missionId'] = 37
            row(f[0]['frame'], 0, 'buildings')['positionY'] = y
            f[0]['frame']['mapCells'] = []
            self.assertEqual(self.check_oracle(f)['nativeResult']['territoryId'], -1)

    def test_08_all_territory_codes_mask_raw_dword(self):
        for source, code in itertools.product(('S1', 'S2'), range(128)):
            f = fixture(source=source); w = f[0]['frame']; row(w)['missionId'] = 37
            row(w, 0, 'mapCells')['rawTerritoryDword'] = 0xfffff01f | (code << 5)
            t = self.check_oracle(f, replay=False)
            self.assertEqual(t['nativeResult']['territoryId'], TERRITORY_TABLE[source][code])

    def test_09_at_home_route_blocks_same_location(self):
        for source, mission, home, location in itertools.product(
                ('S1', 'S2'), (-1, 9, 12, 15, 23, 24, 37, 43), (0, 1, 42, -1, 16383), (0, 1, 42, -1)):
            f = fixture('at-home', source); w = f[0]['frame']
            row(w).update(missionId=mission, homeBaseId=home, locationId=location)
            t = self.check_oracle(f, replay=False)
            self.assertEqual(t['nativeResult'], home == location and home in (0, 1, 42) and mission in (-1, 43))
        # 004896C0 normalizes numerically; kind only matters in later legion getter.
        f = fixture('at-home'); w = f[0]['frame']; row(w)['missionId'] = -1
        row(w, 0, 'buildings').update(kind=3); row(w)['rawLegionId'] = -1
        self.assertTrue(self.check_oracle(f)['nativeResult'])

    def test_10_target_force_category_priority_raw_value(self):
        for source, kind, category, raw in itertools.product(
                ('S1', 'S2'), (0, 3, 24, 63), (-1, 0, 1, 2, 3, 5), (-2**31, -1, 42, 46, 47, 2**31-1)):
            f = fixture('target-force', source); w = f[0]['frame']
            row(w, 0, 'buildings').update(kind=kind, rawOwnerForceId=raw, valid=False)
            row(w, kind, 'facilityInfos')['category'] = category
            t = self.check_oracle(f, replay=False)
            direct = category in (1, 2) or category == 3 and kind != 24
            self.assertEqual(t['nativeResult'], raw if direct else 0 if kind == 0 else -1)
        # kind24/category3 specifically falls through; category1/2 still wins.
        for category, expected in ((1, 99), (2, 99), (3, -1)):
            f = fixture('target-force'); w = f[0]['frame']
            row(w, 0, 'buildings').update(kind=24, rawOwnerForceId=99)
            row(w, 24, 'facilityInfos')['category'] = category
            self.assertEqual(self.check_oracle(f)['nativeResult'], expected)

    def test_11_target_force_canonical_subtypes_and_legion_gates(self):
        for source, bid, kind, subtype, legion_valid in itertools.product(
                ('S1', 'S2'), (0, 42, 52, 86, 16383), (0, 1, 2, -1, 64), (False, True), (False, True)):
            f = fixture('target-force', source); w = f[0]['frame']
            b = next((b for b in w['buildings'] if b['id'] == bid), None)
            if b is None: w['buildings'].append(building(bid)); b = w['buildings'][-1]
            b.update(kind=kind, subtypeValid=subtype)
            if bid == 0: row(w, 0, 'cities')['valid'] = subtype
            row(w, 0, 'legions').update(valid=legion_valid, forceId=0 if legion_valid else -1)
            f[1]['args']['buildingId'] = bid
            t = self.check_oracle(f, replay=False)
            canonical = kind == 0 and bid <= 41 or kind == 1 and 42 <= bid <= 51 or kind == 2 and 52 <= bid <= 86
            self.assertEqual(t['nativeResult'], 0 if canonical and subtype and legion_valid else -1)
        for lid in (-2**31, -1, 47, 2**31-1):
            f = fixture('target-force'); row(f[0]['frame'], 0, 'buildings')['legionId'] = lid
            self.assertEqual(self.check_oracle(f)['nativeResult'], -1)
        for fid in (42, 46):
            f = fixture('target-force'); row(f[0]['frame'], 0, 'legions')['forceId'] = fid
            f[0]['frame']['forces'] = []
            self.assertEqual(self.check_oracle(f)['nativeResult'], fid)
    def test_12_territorial_owner_does_not_revalidate_generic_city(self):
        for source, code in itertools.product(('S1', 'S2'), (0, 42, 86, 96)):
            f = fixture('target-force', source); w = f[0]['frame']
            f[1]['args']['buildingId'] = 16383
            row(w, 16383, 'buildings').update(kind=3)
            row(w, 3, 'facilityInfos')['category'] = 4
            row(w, 0, 'mapCells')['rawTerritoryDword'] = code << 5
            city = TERRITORY_TABLE[source][code]
            if city <= 41:
                add_city(w, city)
                row(w, city, 'buildings').update(valid=False, kind=3)
                # The CITY object is valid even when its generic building is
                # invalid or has a mismatched kind. Raw CITY legion still wins.
            t = self.check_oracle(f)
            self.assertEqual(t['nativeResult'], 0 if city <= 41 else -1)
        f = fixture('target-force'); w = f[0]['frame']
        row(w, 0, 'facilityInfos')['category'] = 4
        row(w, 0, 'buildings')['rawOwnerForceId'] = 37
        self.assertEqual(self.check_oracle(f)['nativeResult'], 0)

    def test_13_territorial_city_invalid_falls_through_subtype(self):
        for source, bid, subtype, code in itertools.product(
                ('S1', 'S2'), (0, 42, 16383), (False, True), (1, 96)):
            f = fixture('target-force', source); w = f[0]['frame']
            f[1]['args']['buildingId'] = bid
            b = row(w, bid, 'buildings'); b['subtypeValid'] = subtype
            if bid == 0: row(w, 0, 'cities')['valid'] = subtype
            row(w, b['kind'], 'facilityInfos')['category'] = 4
            row(w, 1, 'cities')['valid'] = row(w, 1, 'buildings')['subtypeValid'] = False
            row(w, 0, 'mapCells')['rawTerritoryDword'] = code << 5
            t = self.check_oracle(f, replay=False)
            self.assertEqual(t['nativeResult'], 0 if bid <= 86 and subtype else -1)

    def test_14_unchecked_ownership_coordinates_have_bounded_linear_domain(self):
        for source, x, y in itertools.product(('S1', 'S2'), (-1, 0, 199, 200), (-1, 0, 200, 201)):
            f = fixture('target-force', source); w = f[0]['frame']
            row(w, 0, 'buildings').update(positionX=x, positionY=y)
            row(w, 0, 'facilityInfos')['category'] = 4
            index = x * 200 + y
            if 0 <= index < 40000:
                map_cell(w, x, y, 0)
                self.assertEqual(self.check_oracle(f)['nativeResult'], 0)
            else:
                with self.assertRaises(OracleMapReadError): Oracle(f).run()
                self.atomic_defer(f, 'unsupported-native-map-read-domain')
        # Early raw-owner precedence never touches an unsafe map position.
        f = fixture('target-force'); w = f[0]['frame']
        row(w, 0, 'buildings').update(positionX=-32768, positionY=-32768, rawOwnerForceId=8)
        row(w, 0, 'facilityInfos')['category'] = 1
        w['mapCells'] = []
        self.assertEqual(self.check_oracle(f)['nativeResult'], 8)

    def test_15_unknown_slots_are_errors_not_silent_negative_results(self):
        for table in ('facilityInfos', 'mapCells', 'cities', 'legions'):
            f = fixture('target-force'); w = f[0]['frame']
            if table in ('mapCells', 'cities'): row(w, 0, 'facilityInfos')['category'] = 4
            if table == 'cities':
                row(w, 0, 'mapCells')['rawTerritoryDword'] = 5 << 5
            else: w[table] = []
            self.atomic_error(f)
        f = fixture('target-force'); w = f[0]['frame']
        row(w, 0, 'buildings')['kind'] = 64; w['facilityInfos'] = []
        self.assertEqual(self.check_oracle(f)['nativeResult'], -1)

    def test_16_golden_route_read_store_order_and_no_force_valid_gate(self):
        for source in ('S1', 'S2'):
            f = fixture(source=source); w = f[0]['frame']; row(w)['missionId'] = 15
            t = self.check_oracle(f)
            self.assertEqual([s['helper'] for s in t['steps']], [
                '005BA320/mission', '004897B0', '005BA35A/force-range',
                '005BA36E', '005BA37F/ruler-valid', '005BA38B',
                '005BA399/target-range', '005BA3B0', '0049E450/valid',
                '00487DC0', '0049E450/coordinates', '0049E450/map-address',
                '004839F0', '005BA3D0', '005BA320/return'])
            target_write = next(s for s in t['steps'] if s['helper'] == '005BA3B0')
            self.assertEqual(target_write['callStack'][-1]['locals'], dict(
                personId=7, targetOutput=True, territoryOutput=True, stage='direct',
                capturedMissionId=15, savedTargetForceId=0, savedTargetRulerId=9,
                savedRouteTargetId=1))
            row(w, 0, 'forces').update(rulerId=-1, valid=False)
            t = self.check_oracle(f)
            read = next(s for s in t['steps'] if s['helper'] == '005BA36E')
            self.assertFalse(read['forceValidityRead'])
            self.assertIn('005BA37F/ruler-valid', [s['helper'] for s in t['steps']])
            self.assertNotIn('005BA38B', [s['helper'] for s in t['steps']])
            self.assertNotIn('005BA399/target-range', [s['helper'] for s in t['steps']])
            # Native default/range/ruler failures jump directly to005BA3A4.
            # They never execute the shared target-range instruction at399.
            for mission in (-1, 11, 38):
                early = fixture(source=source); row(early[0]['frame'])['missionId'] = mission
                trace = self.check_oracle(early)
                self.assertEqual([s['helper'] for s in trace['steps']],
                                 ['005BA320/mission', '005BA320/return'])
            for force in (-1, 47):
                early = fixture(source=source); p = row(early[0]['frame'])
                p.update(missionId=15, missionArgs=[force, 0, 0, 0, 0])
                trace = self.check_oracle(early)
                self.assertEqual([s['helper'] for s in trace['steps']], [
                    '005BA320/mission', '004897B0', '005BA35A/force-range',
                    '005BA320/return'])
            for status in (6, 8):
                early = fixture(source=source); frame = early[0]['frame']
                row(frame)['missionId'] = 15; row(frame, 9)['status'] = status
                refresh_people(frame)
                trace = self.check_oracle(early)
                self.assertEqual([s['helper'] for s in trace['steps']], [
                    '005BA320/mission', '004897B0', '005BA35A/force-range',
                    '005BA36E', '005BA37F/ruler-valid', '005BA320/return'])
            # A fetched but numerically invalid target DOES reach399, regardless
            # of whether it came from arg0, arg1, raw home or ruler raw home.
            for mission, target in itertools.product((9, 12, 15, 37), (-1, 16384)):
                numeric = fixture(source=source); frame = numeric[0]['frame']
                p = row(frame); p.update(missionId=mission, homeBaseId=target)
                p['missionArgs'][:2] = [0 if mission == 15 else target, target]
                row(frame, 9)['homeBaseId'] = target
                trace = self.check_oracle(numeric)
                reached = [s for s in trace['steps'] if s['helper'] == '005BA399/target-range']
                self.assertEqual(len(reached), 1)
                self.assertEqual(reached[0]['targetId'], target)
                self.assertFalse(reached[0]['passed'])
                self.assertFalse(trace['nativeResult']['routed'])
                self.assertEqual([s['helper'] for s in trace['steps']][-2:],
                                 ['005BA399/target-range', '005BA320/return'])

    def test_17_golden_category_repeated_reads_and_kind24_exception(self):
        for kind, category, expected in (
                (3, 1, ['00487B4A']),
                (3, 3, ['00487B4A', '00487B6F']),
                (3, 2, ['00487B4A', '00487B6F', '00487B9F']),
                (3, 0, ['00487B4A', '00487B6F', '00487B9F', '00487EDB']),
                (24, 3, ['00487B4A', '00487B9F', '00487EDB']),
                (24, 2, ['00487B4A', '00487B9F'])):
            f = fixture('target-force'); w = f[0]['frame']
            row(w, 0, 'buildings')['kind'] = kind
            row(w, kind, 'facilityInfos')['category'] = category
            t = self.check_oracle(f)
            actual = [s['helper'] for s in t['steps'] if 'category' in s]
            self.assertEqual(actual, expected)
        for kind in (-2**31, -1, 64, 2**31-1):
            f = fixture('target-force'); w = f[0]['frame']
            row(w, 0, 'buildings')['kind'] = kind
            w['facilityInfos'] = []
            t = self.check_oracle(f)
            self.assertEqual([s['helper'] for s in t['steps']], [
                '00487B4A/kind-range', '00487B6F/kind-range',
                '00487B9F/kind-range', '00487EDB/kind-range',
                '00487F42/subtype'])
            self.assertTrue(all('category' not in s for s in t['steps']))
            self.assertTrue(all(not s['passed'] for s in t['steps'][:-1]))
            self.assertEqual(t['nativeResult'], -1)

    def test_18_native_ruler_target_read_repeats_after_location_observer(self):
        for source in ('S1', 'S2'):
            f = fixture('return', source); w = f[0]['frame']
            row(w).update(status=0)
            w['observerPresent'] = True
            def effect(stage, v, c):
                if stage == 'location-observer':
                    row(v, 0, 'buildings').update(kind=3, rawOwnerForceId=1)
                    row(v, 3, 'facilityInfos')['category'] = 1
                    row(v).update(homeBaseId=1, locationId=1)
                    v['rngState'] += 7
                return 2
            t = self.check_oracle(f, effect=effect)
            calls = [s for s in t['steps'] if s['helper'] in ('0047B2B0/result', '00487EBD')]
            self.assertEqual([s['forceId'] for s in calls], [0, 1])
            self.assertEqual([s['callStack'][1]['locals']['stage'] for s in calls], ['ruler', 'affiliation'])
            self.assertEqual(row(t['after']['frame'])['homeBaseId'], 1)
            self.assertEqual(t['observedEffects'][0]['callStack'][0]['locals']['savedTargetId'], 0)
            self.assertEqual(t['rng']['observedCalls'], 2)

    def test_19_saved_return_target_survives_notice_then_live_target_owner(self):
        for source in ('S1', 'S2'):
            f = fixture('return', source); w = f[0]['frame']
            row(w, 0, 'forces')['playerIndex'] = 0
            f[1]['args']['showNotice'] = 1
            def effect(stage, v, c):
                if stage == 'return-notice':
                    row(v).update(homeBaseId=1, locationId=1)
                    row(v, 0, 'buildings').update(kind=3, rawOwnerForceId=1)
                    row(v, 3, 'facilityInfos')['category'] = 1
                return 0
            t = self.check_oracle(f, effect=effect)
            self.assertEqual(row(t['after']['frame'])['homeBaseId'], 0)
            self.assertEqual(row(t['after']['frame'])['locationId'], -1)
            self.assertEqual(t['observedEffects'][0]['args']['targetBuildingId'], 0)
            force_read = next(s for s in t['steps'] if s['helper'] == '00487EBD')
            self.assertEqual(force_read['buildingId'], 0)
            self.assertEqual(force_read['forceId'], 1)

    def test_20_s2_sort_hook_changes_later_native_route(self):
        for mission, target in ((37, 0), (9, 0), (9, -1), (15, 0), (-1, 0)):
            f = fixture('legion', 'S2'); w = f[0]['frame']; w['activePersonIds'] = []
            row(w, 9).update(status=3, homeBaseId=0, locationId=0)
            def effect(stage, v, c):
                if stage == 'capacity-query278' and c['args']['personId'] == 9:
                    row(v).update(missionId=mission, missionArgs=[target, 0, 0, 0, 0])
                return dict(result=0, count=1)
            t = self.check_oracle(f, effect=effect)
            routed = mission in (37, 15) or mission == 9 and target >= 0
            self.assertEqual(row(t['after']['frame'], 0, 'legions')['leaderId'], 7)
            self.assertEqual(row(t['after']['frame'], 0, 'buildings')['governorId'], -1 if routed else 7)
            reads = [s for s in t['steps'] if s['helper'] == '005BA320/mission' and s['personId'] == 7]
            self.assertTrue(reads)
            self.assertTrue(all(s['missionId'] == mission for s in reads))
            self.assertTrue(any('004BE2A0' in [c['helper'] for c in r['callStack']]
                                for r in t['observedEffects']))

    def test_21_event_observer_mutations_reach_later_governor_route(self):
        f = fixture('legion'); w = f[0]['frame']
        w['activePersonIds'] = []; w['observerPresent'] = True
        row(w, 0, 'buildings')['governorId'] = 9
        row(w, 9).update(status=2, homeBaseId=1, locationId=1)
        row(w, 1, 'buildings')['homeRosterIds'] = [9]
        def effect(stage, v, c):
            if stage == 'event-observer' and c['event']['id'] == 8:
                row(v, 9).update(missionId=37)
                row(v, 1, 'buildings')['rawOwnerForceId'] = 42
            return 0
        t = self.check_oracle(f, effect=effect)
        self.assertIn(8, [e['event']['id'] for e in t['events']])
        self.assertIn(14, [e['event']['id'] for e in t['events']])
        reads = [s for s in t['steps'] if s['helper'] == '005BA320/mission' and s['personId'] == 9]
        self.assertTrue(any(s['missionId'] == 37 for s in reads))
        self.assertEqual(row(t['after']['frame'], 1, 'buildings')['governorId'], -1)

    def test_22_recursive_event_returns_native_boundaries_close(self):
        for source in ('S1', 'S2'):
            f = fixture('event', source); w = f[0]['frame']
            w['activePersonIds'] = [7, 7, 9]
            row(w, 0, 'buildings')['governorId'] = 9
            t = self.check_oracle(f)
            self.assertGreater(len(t['events']), 1)
            self.assertEqual(t['returnCalls'], 1)
            self.assertEqual(t['after']['revision'], 1)
            self.assertEqual(t['events'][0]['copiedActivePersonIds'], [7, 7, 9])
            self.assertEqual(t['events'][0]['visits'][1]['route'], 'mission-range-skip')
            self.assertTrue(all(e['parentEventIndex'] == 0 for e in t['events'][1:]))
            self.assertEqual(row(t['after']['frame'])['missionId'], -1)
            self.assertNotIn('005BA320', [r['helper'] for r in t['observedEffects']])
            self.assertNotIn('00487EB0/virtual+40', [r['helper'] for r in t['observedEffects']])
    def test_23_exact_late_stack_and_before_after_binding(self):
        f = fixture('return', 'S2'); w = f[0]['frame']; w['observerPresent'] = True
        def effect(stage, v, c):
            if stage == 'location-observer':
                row(v).update(missionId=9, missionArgs=[-1, 1, 3, 4, 5])
            if stage == 'capacity-query278': row(v, 9)['homeBaseId'] = 0
            v['rngState'] += 1
            return dict(result=0, count=1)
        t = self.check_oracle(f, effect=effect)
        records = f[2]['records']
        deep = next(i for i, r in enumerate(records) if r['helper'] == '004890F0')
        self.assertGreater(deep, 0)
        stack = records[deep]['callStack']
        self.assertEqual(stack[0]['locals']['savedTargetId'], 0)
        self.assertIn('004BE2A0', [s['helper'] for s in stack])
        self.assertEqual(records[deep]['before']['persons'][0]['missionArgs'][0], -1)
        mutations = [
            lambda f: f[2]['records'].pop(),
            lambda f: f[2]['records'].append(copy.deepcopy(f[2]['records'][-1])),
            lambda f: f[2]['records'][deep]['callStack'][0]['locals'].update(savedTargetId=1),
            lambda f: f[2]['records'][deep]['callStack'][-1]['locals'].update(savedForceId=1),
            lambda f: f[2]['records'][deep]['before']['persons'][0]['missionArgs'].__setitem__(0, 0),
            lambda f: f[2]['records'][deep]['args'].update(personId=403),
            lambda f: f[2]['records'][deep].update(result=True),
            lambda f: f[2]['records'][deep].update(source='S1'),
            lambda f: f[2]['records'][deep]['after']['mapCells'].pop(),
            lambda f: f[2]['records'][deep]['after']['facilityInfos'][0]['data'].update(new=1),
            lambda f: f[2]['records'][deep]['after']['forces'][0].update(rulerId=-1),
            lambda f: f[2]['records'][deep]['rngConsumption'].update(calls=-1),
        ]
        for mutation in mutations:
            with self.subTest(mutation=mutation):
                bad = copy.deepcopy(f); mutation(bad); self.atomic_error(bad)
        bad = copy.deepcopy(f)
        bad[2]['records'][0], bad[2]['records'][-1] = bad[2]['records'][-1], bad[2]['records'][0]
        for i, r in enumerate(bad[2]['records']): r['index'] = i
        self.atomic_error(bad)
        self.assertEqual(t['rng']['observedCalls'], len(records))

    def test_24_strict_frame_domains_derived_predicates_and_no_upgrade(self):
        changes = [
            lambda f: f[0]['frame']['forces'][0].pop('rulerId'),
            lambda f: f[0]['frame']['forces'][0].update(rulerId=True),
            lambda f: f[0]['frame']['forces'][0].update(rulerId=-1),
            lambda f: f[0]['frame']['legions'][0].update(valid=False),
            lambda f: f[0]['frame']['persons'][0].update(status=6),
            lambda f: f[0]['frame']['persons'][0].update(rawDword17C=2**32),
            lambda f: f[0]['frame']['buildings'][0].pop('rawOwnerForceId'),
            lambda f: f[0]['frame']['buildings'][0].update(rawOwnerForceId=2**31),
            lambda f: f[0]['frame']['buildings'][0].update(positionX=-32769),
            lambda f: f[0]['frame']['buildings'][0].update(positionY=32768),
            lambda f: f[0]['frame']['facilityInfos'][0].update(category=2**31),
            lambda f: f[0]['frame']['facilityInfos'][0].update(id=64),
            lambda f: f[0]['frame']['facilityInfos'].append(copy.deepcopy(f[0]['frame']['facilityInfos'][0])),
            lambda f: f[0]['frame']['mapCells'][0].update(id=40000),
            lambda f: f[0]['frame']['mapCells'][0].update(rawTerritoryDword=-1),
            lambda f: f[0]['frame']['mapCells'][0].update(rawTerritoryDword=2**32),
            lambda f: f[0]['frame']['mapCells'][0].update(extra=True),
            lambda f: f[0]['frame'].pop('facilityInfos'),
            lambda f: f[0]['frame']['offices'][0].update(valid=False),
            lambda f: f[0]['frame']['titles'][0].update(valid=False),
            lambda f: f[3].update(frameProfile='source-idb-S1-S2-native-sort-frame-v1'),
            lambda f: f[3].pop('routeDomain'),
            lambda f: f[3].update(routeDomain='aliased-pointer-writes'),
            lambda f: f[3].update(nativePlatform='arbitrary-runtime-hooks'),
            lambda f: f[3].update(sortDomain='arbitrary-rosters'),
            lambda f: f[1]['args'].update(targetOutput=1),
            lambda f: f[1]['args'].update(territoryOutput=None),
        ]
        for change in changes:
            f = fixture(); change(f); self.atomic_error(f)
        self.atomic_error(sort_fixture())
        import native_roster_sort_profile as previous
        with self.assertRaises(ValueError): previous.project_native_roster_sort(*fixture('return'))

    def test_25_removed_boundary_cannot_be_forged_back_in(self):
        for helper in ('005BA320', '00487EB0/virtual+40'):
            f = fixture('at-home' if helper == '005BA320' else 'target-force')
            w = f[0]['frame']; row(w)['missionId'] = -1
            f[2]['records'] = [dict(index=0, source='S1', kind='effect-query', helper=helper,
                args=dict(personId=7), callStack=[dict(helper=helper, locals={})],
                before=copy.deepcopy(w), after=copy.deepcopy(w), result=False,
                rngConsumption=dict(kind='observed-count', calls=0), provenance='forged old boundary')]
            self.atomic_error(f)
        # Reject mode still permits complete local helpers with no callbacks.
        for entry in ('route', 'at-home', 'target-force'):
            f = fixture(entry); f[3]['unknownEffects'] = 'reject'
            self.check_oracle(f)
        f = fixture('return'); f[0]['frame']['observerPresent'] = True
        Oracle(f).run(); f[3]['unknownEffects'] = 'reject'
        self.atomic_defer(f, 'unresolved-effect:observer.virtual1B4')

    def test_26_engine_and_open_branch_rejections_are_atomic(self):
        f = fixture(); f[3]['engineGuard']['maxNativeCalls'] = 1
        self.atomic_defer(f, 'engine-guard-native-call-budget')
        f = fixture('role-sort', leader=False, candidates=[7, 9, 7, 9])
        f[3]['engineGuard']['maxSortDepth'] = 1
        self.atomic_defer(f, 'engine-guard-sort-depth')
        f = fixture('event'); row(f[0]['frame'], 0, 'buildings')['governorId'] = 9
        Oracle(f).run(); f[3]['engineGuard']['maxEventDepth'] = 1
        self.atomic_defer(f, 'engine-guard-event-depth')
        f = fixture('return'); w = f[0]['frame']; row(w)['status'] = 0
        row(w, 0, 'forces')['field128'] = 0
        self.atomic_defer(f, 'unsupported-ruler-ownership')
        f = fixture('legion'); row(f[0]['frame'], 0, 'forces').update(rulerId=-1, valid=False)
        self.atomic_defer(f, 'unsupported-force-extinction')
        f = fixture('legion'); w = f[0]['frame']
        w['legions'].append(dict(copy.deepcopy(w['legions'][0]), id=1))
        row(w, 0, 'buildings')['legionId'] = row(w, 1, 'buildings')['legionId'] = 1
        self.atomic_defer(f, 'unsupported-empty-legion-redistribution')

    def test_27_replay_idempotence_conflict_and_trace_tamper(self):
        f = fixture(); t = self.check_oracle(f)
        again = copy.deepcopy(f); again[0] = copy.deepcopy(t['after'])
        r = run(again)
        self.assertTrue(r['accepted']); self.assertTrue(r['replayed'])
        self.assertEqual(r['after'], t['after']); self.assertEqual(r['steps'], [])
        again[1]['args']['targetOutput'] = False
        self.atomic_defer(again, 'replay-payload-conflict')
        f = fixture(); f[1]['expectedRevision'] = 1
        self.atomic_defer(f, 'revision-conflict')
        f = fixture(); f[0]['revision'] = f[1]['expectedRevision'] = 2**31-1
        self.atomic_error(f)
        for rehash, field in itertools.product((False, True), ('result', 'frame', 'order', 'rng', 'evidence')):
            changed = copy.deepcopy(t)
            if field == 'result': changed['nativeResult']['routed'] = False
            elif field == 'frame': changed['after']['frame']['buildings'][0]['rawOwnerForceId'] += 1
            elif field == 'order': changed['steps'].reverse()
            elif field == 'rng': changed['rng']['observedCalls'] += 1
            else: changed['evidence']['stockVerified'] = True
            if rehash:
                changed.pop('traceHash'); changed['traceHash'] = digest(changed)
            with self.assertRaises(ValueError): m.replay_return_route_target_force(changed)

    def test_28_independent_oracle_and_old_api_contracts_remain(self):
        import return_route_primitives as primitives
        import native_roster_sort_profile as previous
        import native_sort_primitives as sorts
        from check_native_roster_sort_profile import Oracle as OldOracle
        f = fixture('return', 'S2'); f[0]['frame']['observerPresent'] = True
        with patch.object(m, '_Planner', side_effect=AssertionError('production planner used')), \
             patch.object(primitives.ReturnRoutePrimitives, 'route', side_effect=AssertionError('production route used')), \
             patch.object(primitives.ReturnRoutePrimitives, 'target_force', side_effect=AssertionError('production force used')), \
             patch.object(sorts.NativeSortPrimitives, 'capacity', side_effect=AssertionError('production capacity used')):
            Oracle(f).run()
        self.assertTrue(run(f)['accepted'])
        old = sort_fixture('return')
        OldOracle(old).run()
        trace = previous.project_native_roster_sort(*old)
        self.assertTrue(trace['accepted'])
        self.assertIn('00487EB0/virtual+40', [r['helper'] for r in trace['observedEffects']])
        self.assertIn('005BA320', [r['helper'] for r in trace['observedEffects']])
        self.assertEqual(trace, previous.replay_native_roster_sort(trace))

    def test_29_golden_territorial_failure_then_canonical_fallback_order(self):
        f = fixture('target-force'); w = f[0]['frame']
        row(w, 0, 'facilityInfos')['category'] = 4
        row(w, 0, 'mapCells')['rawTerritoryDword'] = 1 << 5
        row(w, 1, 'cities')['valid'] = row(w, 1, 'buildings')['subtypeValid'] = False
        t = self.check_oracle(f)
        self.assertEqual([s['helper'] for s in t['steps']], [
            '00487B4A', '00487B6F', '00487B9F', '00487EDB', '00487DC0',
            '00487EB0/map-address', '004839F0', '00487F2A/city-valid',
            '00487F42/subtype', '0047C320', '0047A630/legion', '0047B2B0/result'])
        fallback = next(s for s in t['steps'] if s['helper'] == '00487F42/subtype')
        self.assertEqual(fallback['callStack'][-1], dict(helper='00487EB0', locals=dict(buildingId=0, stage='direct')))
        self.assertEqual(t['nativeResult'], 0)
        # An invalid output target exits before position or map reads.
        f = fixture(); w = f[0]['frame']; row(w)['missionId'] = 37
        row(w, 0, 'buildings')['valid'] = False
        w['mapCells'] = []
        t = self.check_oracle(f)
        self.assertEqual([s['helper'] for s in t['steps']], [
            '005BA320/mission', '005BA393', '005BA399/target-range',
            '005BA3B0', '0049E450/valid', '005BA3D0', '005BA320/return'])

    def test_30_seeded_live_composition_with_independent_observations(self):
        for seed in range(96):
            rng = random.Random(64000 + seed)
            source = 'S1' if (seed // 4) % 2 == 0 else 'S2'
            entry = ('return', 'event', 'legion', 'governor')[seed % 4]
            f = fixture(entry, source); w = f[0]['frame']
            w['observerPresent'] = True
            w['forces'].append(dict(copy.deepcopy(w['forces'][0]), id=1))
            if entry != 'event': w['activePersonIds'] = []
            row(w, 9).update(status=3, homeBaseId=0, locationId=0)
            row(w, 0, 'buildings')['homeRosterIds'] = [7, 9]
            choices = [(rng.choice((-1, 9, 12, 15, 23, 24, 37, 43)), rng.choice((-1, 0, 1)),
                        rng.choice((0, 1)), rng.choice((0, 1))) for _ in range(128)]
            def effect(stage, v, c):
                mission, target, home, location = choices[c['index'] % len(choices)]
                # The event handler has already reset its mission before real
                # observer hooks. Keep it reset to bound this random scenario.
                row(v).update(missionId=-1 if entry == 'event' else mission,
                              missionArgs=[target, home, 3, 4, 5],
                              homeBaseId=home, locationId=location)
                row(v, 9)['homeBaseId'] = home
                row(v, 0, 'buildings')['rawOwnerForceId'] = target
                v['rngState'] = (v['rngState'] + c['index'] + 1) % 2**32
                return dict(result=False if stage == 'query267' else 0, count=None if seed % 7 == 0 else 1)
            with self.subTest(seed=seed, entry=entry, source=source):
                t = self.check_oracle(f, effect=effect, replay=False)
                self.assertEqual(t['rng']['observedCalls'], None if seed % 7 == 0 and t['observedEffects'] else len(t['observedEffects']))
                self.assertFalse(t['rng']['globalConsumptionVerified'])


if __name__ == '__main__':
    unittest.main()
