"""Independent source interpreter for00489610/0047A950 live positions.

Expected pointers, coordinate reads, frames and boundary records are built from
this test-only transcription, never production projectors/primitives/constants.
All callback/unknown-memory answers are synthetic observations, not claims about
native callback behavior, runtime map contents, or global initial values.
"""
import copy
import hashlib
import importlib
import itertools
import json
from pathlib import Path
import random
import unittest
from contextlib import ExitStack
from unittest.mock import patch

import native_live_position_profile as m
import native_troop_membership_profile as previous
from check_native_troop_membership_profile import Oracle as MembershipOracle, fixture as membership_fixture, troop
from check_native_tail_distance_profile import ENTRIES, MISSIONS, geography
from check_officer_relocation_profile import TERRITORY_BASE
from check_empty_legion_profile import DISTANCE
from check_return_route_target_force_profile import map_cell
from check_recursive_officer_return_profile import row, refresh_people, digest
from check_native_roster_sort_profile import person

SOURCES = ('S1', 'S2')
FRAME = 'source-idb-S1-S2-native-live-position-frame-v1'
PROFILE = 'source-idb-S1-S2-native-live-position-v1'
DOMAIN = 'canonical-native-live-position-v1'
FALLBACK = 'fallbackPosition06EE794C'
DIRECT = ('position-pointer', 'position', 'movement-origin')
I32_MIN, I32_MAX = -2147483648, 2147483647


def fixture(entry='position', source='S1', location=87, **kw):
    f = membership_fixture('troop-member' if entry in DIRECT else entry,
                           source, location=location, **kw)
    for t in f[0]['frame']['troops']:
        t.update(positionX=2, positionY=7)
    # Deliberately neither source's incidental fallback snapshot.
    f[0]['frame'][FALLBACK] = dict(positionX=-123, positionY=321)
    f[1]['id'] = 'native-live-position-1'
    f[3].update(id='native-live-position-observe-v1', frameProfile=FRAME,
                livePositionDomain=DOMAIN)
    if entry in DIRECT:
        f[1].update(entry=entry, args=dict(personId=7))
    return f


def run(f):
    return m.project_native_live_position(*f)


def ptr(storage, rid, offset):
    return dict(storage=storage, id=rid, byteOffset=offset)


class Oracle(MembershipOracle):
    def __init__(self, *args, unknown_pointer=None, opaque_position=(8, 3), **kw):
        super().__init__(*args, **kw)
        self.unknown_pointer = unknown_pointer
        self.opaque_position = opaque_position
        self.position_reads = []
        self.position_pointers = []

    def get(self, name, rid):
        if name == 'troops':
            return self.get_troop(rid)
        return super().get(name, rid)

    def native_pointer(self, pid):
        with self.inside('00489610', personId=pid):
            location = self.get('persons', pid)['locationId']
            bid = location if 0 <= location <= 86 else None
            self.save(savedLocationId=location, savedBaseId=bid)
            if bid is not None and 0 <= self.get('buildings', bid)['kind'] < 64:
                value = ptr('buildings', bid, 30)
            else:
                tid = location-87 if 87 <= location <= 1086 else None
                self.save(savedTroopId=tid)
                t = self.get_troop(tid) if tid is not None else None
                if t is not None and t['vtableAddress'] != 0x0079CC18:
                    value = super().boundary('unknown-position-dispatch', 'effect-query',
                        '00489610/unknown-troop-virtual',
                        dict(personId=pid, savedLocationId=location, troopId=tid),
                        self.unknown_pointer)
                else:
                    valid = False
                    if t is not None:
                        lead = t['leaderId']
                        p = self.get('persons', lead)
                        valid = p is not None and (p['rawDword17C'] != 0
                            or p['status'] in (0, 1, 2, 3, 4, 5, 7))
                        if valid:
                            valid = t['deputyIds'][0] < 1100 and t['deputyIds'][1] < 1100
                    value = ptr('troops', tid, 60) if valid else ptr(FALLBACK, 0x06EE794C, 0)
            self.position_pointers.append(copy.deepcopy(value))
            return copy.deepcopy(value)

    def native_read(self, address):
        with self.inside('0047A956/position-read', savedPositionPointer=address):
            if address['storage'] == 'unrepresented':
                x, y = self.opaque_position
                answer = super().boundary('unrepresented-position-memory', 'query',
                    '0047A956/unrepresented-dword', dict(positionPointer=address),
                    dict(positionX=x, positionY=y))
            else:
                source = self.w[FALLBACK] if address['storage'] == FALLBACK else self.get(address['storage'], address['id'])
                answer = dict(positionX=source['positionX'], positionY=source['positionY'])
            self.position_reads.append((copy.deepcopy(address), answer['positionX'], answer['positionY']))
            return answer

    def origin(self, pid):
        with self.inside('004A6340', personId=pid):
            if not self.valid('persons', pid):
                return -1
            loc = self.get('persons', pid)['locationId']
            if 0 <= loc < 87:
                return loc
            with self.inside('0047A950', personId=pid):
                address = self.native_pointer(pid)
                self.save(savedPositionPointer=address)
                answer = self.native_read(address)
                x, y = answer['positionX'], answer['positionY']
                if not (0 <= x <= 199 and 0 <= y <= 199):
                    return -1
                value = self.get('mapCells', x*200+y)['rawTerritoryDword']
                result = abs(TERRITORY_BASE[(value >> 5) & 127])
                return result if 0 <= result < 87 else -1

    def run(self):
        entry = self.f[1]['entry']
        if entry not in DIRECT:
            return super().run()
        pid = self.f[1]['args']['personId']
        if entry == 'movement-origin':
            self.native_result = self.origin(pid)
        else:
            address = self.native_pointer(pid)
            self.native_result = address if entry == 'position-pointer' else self.native_read(address)
        self.f[2]['records'] = copy.deepcopy(self.records)
        return self


class NativeLivePositionTests(unittest.TestCase):
    maxDiff = 12000

    def check_oracle(self, f, replay=True, **kw):
        expected = Oracle(f, **kw).run()
        before = copy.deepcopy(f)
        t = run(f)
        self.assertTrue(t['accepted'], t['reason'])
        self.assertEqual(t['profileId'], PROFILE)
        self.assertEqual(t['frameProfileId'], FRAME)
        self.assertEqual(t['after']['frame'], expected.w)
        self.assertEqual(t['nativeResult'], expected.native_result)
        self.assertEqual(t['events'], expected.events)
        self.assertEqual(t['returnCalls'], expected.return_calls)
        self.assertEqual(t['observedEffects'], [r for r in expected.records if r['kind'] != 'query'])
        self.assertEqual(t['queries'], [r for r in expected.records if r['kind'] == 'query'])
        actual = [(s['positionPointer'], s['positionX'], s['positionY']) for s in t['steps'] if s['helper'] == '0047A956']
        self.assertEqual(actual, expected.position_reads)
        for s in t['steps']:
            if s['helper'] == '0047A956':
                self.assertEqual(s['packedDword'], (s['positionX'] & 65535) | ((s['positionY'] & 65535) << 16))
                self.assertTrue(s['singleDwordRead'])
        self.assertEqual(t['after']['revision'], f[0]['revision']+1)
        self.assertEqual(t['rng']['localCalls'], expected.local_rng)
        self.assertEqual(f, before)
        if replay:
            self.assertEqual(t, m.replay_native_live_position(json.loads(json.dumps(t))))
        return t

    def atomic_error(self, f):
        before = copy.deepcopy(f)
        with self.assertRaises(ValueError):
            run(f)
        self.assertEqual(f, before)

    def atomic_defer(self, f, reason):
        before = copy.deepcopy(f)
        t = run(f)
        self.assertFalse(t['accepted'])
        self.assertEqual(t['reason'], reason)
        self.assertEqual(t['after'], f[0])
        self.assertEqual(t['events'], [])
        self.assertEqual(t['steps'], [])
        self.assertEqual(f, before)
        self.assertEqual(t, m.replay_native_live_position(t))
        return t

    def test_01_all_eighteen_inherited_entries_both_sources(self):
        for source, entry in itertools.product(SOURCES, ENTRIES + ('troop-member',)):
            with self.subTest(source=source, entry=entry):
                self.check_oracle(fixture(entry, source))

    def test_02_location_boundaries_and_pointer_values(self):
        for source, location in itertools.product(SOURCES,
                (I32_MIN, -1, 0, 86, 87, 88, 1085, 1086, 1087, I32_MAX)):
            f = fixture('position-pointer', source, location)
            if 0 <= location <= 86:
                row(f[0]['frame'], location, 'buildings').update(kind=0, valid=True)
            if 87 <= location <= 1086:
                trow = troop(location-87); trow.update(positionX=3, positionY=-9)
                f[0]['frame']['troops'] = [trow]
            result = self.check_oracle(f)['nativeResult']
            expected = ptr('buildings', location, 30) if 0 <= location <= 86 else ptr('troops', location-87, 60) if 87 <= location <= 1086 else ptr(FALLBACK, 0x06EE794C, 0)
            self.assertEqual(result, expected)

    def test_03_base_validity_before_troop_and_fallback(self):
        for source, kind in itertools.product(SOURCES, (-1, 0, 63, 64, I32_MAX)):
            f = fixture('position', source, location=86)
            b = row(f[0]['frame'], 86, 'buildings')
            b.update(kind=kind, valid=0 <= kind <= 63, positionX=-32768, positionY=32767)
            t = self.check_oracle(f)
            expected = dict(positionX=-32768, positionY=32767) if b['valid'] else f[0]['frame'][FALLBACK]
            self.assertEqual(t['nativeResult'], expected)
            self.assertFalse(any(s['helper'] == '00490B00/troop-leader' for s in t['steps']))

    def test_04_actor_validity_not_tested_by_position_pointer(self):
        for source, status in itertools.product(SOURCES, (6, 8, 9, I32_MIN)):
            f = fixture(source=source, location=87)
            row(f[0]['frame']).update(status=status)
            row(f[0]['frame'], 0, 'troops')['leaderId'] = 9
            refresh_people(f[0]['frame'])
            self.assertEqual(self.check_oracle(f)['nativeResult'], dict(positionX=2, positionY=7))
            g = copy.deepcopy(f); g[1]['entry'] = 'movement-origin'; g[2]['records'] = []
            self.assertEqual(self.check_oracle(g)['nativeResult'], -1)

    def test_05_leader_and_deputy_validity_signed_branches(self):
        for source, leader, deputies in itertools.product(SOURCES, (-1, 7, 9, 1099, 1100, I32_MIN),
                ((-1, -1), (I32_MIN, 1099), (1100, -1), (-1, 1100))):
            f = fixture(source=source)
            row(f[0]['frame'], 0, 'troops').update(leaderId=leader, deputyIds=list(deputies))
            if leader == 1099:
                f[0]['frame']['persons'].append(person(1099))
            self.check_oracle(f, replay=False)

    def test_06_troop_position_needs_validity_not_membership(self):
        for source in SOURCES:
            f = fixture(source=source)
            row(f[0]['frame'], 0, 'troops').update(leaderId=9, deputyIds=[-1, -1])
            t = self.check_oracle(f)
            self.assertEqual(t['nativeResult'], dict(positionX=2, positionY=7))
            self.assertFalse(any(s['helper'].startswith('004953') for s in t['steps']))

    def test_07_signed16_limits_and_single_dword_packing(self):
        for source, x, y in itertools.product(SOURCES, (-32768, -1, 0, 199, 200, 32767), (-32768, -1, 0, 199, 200, 32767)):
            f = fixture(source=source)
            row(f[0]['frame'], 0, 'troops').update(positionX=x, positionY=y)
            self.assertEqual(self.check_oracle(f, replay=False)['nativeResult'], dict(positionX=x, positionY=y))

    def test_08_fallback_values_explicit_and_mutable(self):
        for source, point in itertools.product(SOURCES, ((0, 0), (-1, -1), (-32768, 32767), (11, 3))):
            f = fixture(source=source, location=-1)
            f[0]['frame'][FALLBACK] = dict(zip(('positionX', 'positionY'), point))
            self.assertEqual(self.check_oracle(f)['nativeResult'], f[0]['frame'][FALLBACK])
            del f[0]['frame'][FALLBACK]
            self.atomic_error(f)

    def test_09_origin_base_fast_path_does_not_read_position_or_validity(self):
        for source, location in itertools.product(SOURCES, (0, 86)):
            f = fixture('movement-origin', source, location)
            row(f[0]['frame'], location, 'buildings').update(kind=-1, valid=False)
            t = self.check_oracle(f)
            self.assertEqual(t['nativeResult'], location)
            self.assertFalse(any(s['helper'] == '0047A956' for s in t['steps']))

    def test_10_origin_coordinate_bounds_before_map_reads(self):
        for source, xy in itertools.product(SOURCES, ((-1, 0), (0, -1), (200, 0), (0, 200), (-32768, 32767))):
            f = fixture('movement-origin', source)
            row(f[0]['frame'], 0, 'troops').update(positionX=xy[0], positionY=xy[1])
            f[0]['frame']['mapCells'] = []
            self.assertEqual(self.check_oracle(f)['nativeResult'], -1)

    def test_11_all_128_territory_codes_xy_order_and_mask(self):
        for source, code in itertools.product(SOURCES, range(128)):
            f = fixture('movement-origin', source)
            map_cell(f[0]['frame'], 2, 7, 0xCDEF0000 | (code << 5) | 31)
            map_cell(f[0]['frame'], 7, 2, 0)
            t = self.check_oracle(f, replay=False)
            self.assertEqual(t['nativeResult'], abs(TERRITORY_BASE[code]))
            read = next(s for s in t['steps'] if s['helper'] == '00483B00')
            self.assertEqual(read['mapIndex'], 407)
            self.assertEqual(read['territoryIndex'], code)

    def test_12_missing_troop_leader_map_are_not_invalid_rows(self):
        for target in ('troop', 'leader', 'map'):
            f = fixture('movement-origin')
            if target == 'troop': f[0]['frame']['troops'] = []
            elif target == 'leader': row(f[0]['frame'], 0, 'troops')['leaderId'] = 1000
            else: f[0]['frame']['mapCells'] = []
            self.atomic_error(f)
        f = fixture(); row(f[0]['frame'], 0, 'troops')['leaderId'] = -1
        self.assertEqual(self.check_oracle(f)['nativeResult'], f[0]['frame'][FALLBACK])

    def test_13_pointer_only_never_reads_coordinates(self):
        for location in (0, 87, -1):
            f = fixture('position-pointer', location=location)
            t = self.check_oracle(f)
            self.assertFalse(any(s['helper'] == '0047A956' for s in t['steps']))
            self.assertTrue(all(s.get('coordinateWordsRead') is False for s in t['steps'] if 'coordinateWordsRead' in s))

    def test_14_unknown_dispatch_can_mutate_returned_storage_and_actor(self):
        for source, storage in itertools.product(SOURCES, ('troops', 'buildings', FALLBACK)):
            f = fixture(source=source)
            row(f[0]['frame'], 0, 'troops')['vtableAddress'] = 0
            pointer = ptr(storage, 999 if storage == 'troops' else 86 if storage == 'buildings' else 0x06EE794C, 60 if storage == 'troops' else 30 if storage == 'buildings' else 0)
            def effect(stage, after, context):
                if stage == 'unknown-position-dispatch':
                    value = after[FALLBACK] if storage == FALLBACK else row(after, pointer['id'], storage)
                    value.update(positionX=-301, positionY=299)
                    row(after)['locationId'] = 1087
                    row(after, 0, 'troops')['vtableAddress'] = 0x0079CC18
                    return dict(result=pointer, count=2)
                return 0
            t = self.check_oracle(f, effect=effect, unknown_pointer=pointer)
            self.assertEqual(t['nativeResult'], dict(positionX=-301, positionY=299))
            self.assertEqual(t['rng']['observedCalls'], 2)
            self.assertEqual(t['observedEffects'][0]['args']['savedLocationId'], 87)
            self.assertEqual(t['queries'], [])

    def test_15_unknown_pointer_then_separate_memory_read(self):
        for source, address in itertools.product(SOURCES, (0, 1, 0xDEADBEEF, 0xffffffff)):
            f = fixture(source=source)
            row(f[0]['frame'], 0, 'troops')['vtableAddress'] = 0xFEFEFEFE
            t = self.check_oracle(f, unknown_pointer=dict(storage='unrepresented', address=address), opaque_position=(-32768, 32767))
            self.assertEqual(t['nativeResult'], dict(positionX=-32768, positionY=32767))
            self.assertEqual(len(t['observedEffects']), 1)
            self.assertEqual(len(t['queries']), 1)
            self.assertEqual(t['queries'][0]['helper'], '0047A956/unrepresented-dword')

    def test_16_unknown_readonly_cannot_suppress_effect_authority(self):
        f = fixture(); row(f[0]['frame'], 0, 'troops')['vtableAddress'] = 0
        Oracle(f, unknown_pointer=ptr(FALLBACK, 0x06EE794C, 0)).run()
        f[3]['unknownEffects'] = 'reject'
        self.atomic_defer(f, 'unresolved-effect:00489610/unknown-troop-virtual')
        f[3]['unknownEffects'] = 'observed-frame'; f[2]['records'] = []
        self.atomic_error(f)

    def test_17_callback_before_native_read_changes_location_and_coordinates(self):
        for source, mode in itertools.product(SOURCES, ('troop', 'fallback', 'base')):
            f = fixture('relocate-officer', source)
            w = f[0]['frame']; row(w).update(locationId=87, homeBaseId=0)
            row(w, 0, 'troops').update(leaderId=9, deputyIds=[-1, -1])
            w['observerPresent'] = True
            def effect(stage, after, context):
                if stage == 'acted-observer':
                    after['observerPresent'] = False
                    if mode == 'troop':
                        row(after)['locationId'] = 1086
                        row(after, 999, 'troops').update(positionX=-201, positionY=100)
                    elif mode == 'fallback':
                        row(after)['locationId'] = 1087
                        after[FALLBACK].update(positionX=201, positionY=-100)
                    else: row(after)['locationId'] = 86
                return 0
            t = self.check_oracle(f, effect=effect)
            self.assertEqual(row(t['after']['frame'])['missionDuration'], 1 if mode != 'base' else 255)
            self.assertFalse(any(q['helper'] == '00489610/virtual+3C' for q in t['queries']))

    def test_18_unknown_mutation_saved_pointer_in_origin_scope(self):
        for source in SOURCES:
            f = fixture('movement-origin', source)
            w = f[0]['frame']; row(w, 0, 'troops')['vtableAddress'] = 0
            map_cell(w, 11, 3, 5 << 5)
            pointer = ptr(FALLBACK, 0x06EE794C, 0)
            def effect(stage, after, context):
                if stage == 'unknown-position-dispatch':
                    row(after)['locationId'] = 86
                    after[FALLBACK].update(positionX=11, positionY=3)
                return 0
            t = self.check_oracle(f, effect=effect, unknown_pointer=pointer)
            self.assertEqual(t['nativeResult'], 5)
            read = next(s for s in t['steps'] if s['helper'] == '0047A956')
            self.assertEqual(read['callStack'][-2]['locals']['savedPositionPointer'], pointer)
            self.assertEqual(row(read['frame'])['locationId'], 86)

    def test_19_source_specific_directed_movement_distances(self):
        for source in SOURCES:
            f = fixture('prepare-movement', source)
            w = f[0]['frame']; row(w)['locationId'] = 87
            row(w, 0, 'troops').update(positionX=2, positionY=7)
            geography(w, current_code=0, home_code=1)
            t = self.check_oracle(f)
            self.assertEqual(t['nativeResult'], 0)
            self.assertEqual(row(t['after']['frame'])['missionDuration'], DISTANCE[source][1])

    def test_20_live_event_and_return_keep_complete_new_frame(self):
        for source, mission in itertools.product(SOURCES, MISSIONS):
            f = fixture('event', source, mission=mission, notify=True)
            def effect(stage, after, context):
                after[FALLBACK]['positionX'] = (context['index'] % 200)-100
                row(after, 999, 'troops')['positionY'] = context['index']+9
                return 0
            t = self.check_oracle(f, effect=effect)
            for r in t['observedEffects']:
                self.assertIn(FALLBACK, r['before'])
                self.assertIn(FALLBACK, r['after'])
                self.assertIn('positionY', row(r['after'], 999, 'troops'))

    def test_21_schema_rejects_missing_defaults_and_bad_signed_words(self):
        for target, key, value in itertools.product(('troop', 'fallback'), ('positionX', 'positionY'), (-32769, 32768, True, 0.5, None)):
            f = fixture(); w = f[0]['frame']
            r = row(w, 0, 'troops') if target == 'troop' else w[FALLBACK]
            r[key] = value; self.atomic_error(f)
        for target, key in itertools.product(('troop', 'fallback'), ('positionX', 'positionY')):
            f = fixture(); w = f[0]['frame']; r = row(w, 0, 'troops') if target == 'troop' else w[FALLBACK]
            del r[key]; self.atomic_error(f)
        f = fixture(); f[0]['frame'][FALLBACK]['default'] = True; self.atomic_error(f)
        for key in ('livePositionDomain', 'frameProfile', 'troopMembershipDomain', 'nativePlatform'):
            f = fixture(); f[3][key] = 'wrong'; self.atomic_error(f)
            f = fixture(); del f[3][key]; self.atomic_error(f)

    def test_22_observations_bind_full_frame_scope_source_and_arguments(self):
        f = fixture(); row(f[0]['frame'], 0, 'troops')['vtableAddress'] = 0
        Oracle(f, unknown_pointer=ptr(FALLBACK, 0x06EE794C, 0)).run()
        for defect in ('missing', 'extra', 'fallback-before', 'troop-before', 'scope', 'saved-location', 'source', 'domain', 'result'):
            g = copy.deepcopy(f); rs = g[2]['records']; r = rs[0]
            if defect == 'missing': rs.clear()
            elif defect == 'extra': rs.append(copy.deepcopy(r)); rs[-1]['index'] = 1
            elif defect == 'fallback-before': r['before'][FALLBACK]['positionX'] += 1
            elif defect == 'troop-before': row(r['before'], 0, 'troops')['positionY'] += 1
            elif defect == 'scope': r['callStack'][-1]['locals']['savedTroopId'] = 999
            elif defect == 'saved-location': r['args']['savedLocationId'] = 1086
            elif defect == 'source': r['source'] = 'S2'
            elif defect == 'domain': r['after']['troops'].pop()
            else: r['result']['byteOffset'] = 60
            self.atomic_error(g)

    def test_23_pointer_result_schema_and_missing_memory_fail_atomically(self):
        bad = (None, {}, ptr('buildings', -1, 30), ptr('troops', 1000, 60), ptr('troops', 0, 30), ptr(FALLBACK, 0, 0), dict(storage='unrepresented', address=-1), dict(storage='unrepresented', address=True))
        for pointer in bad:
            f = fixture('position-pointer'); row(f[0]['frame'], 0, 'troops')['vtableAddress'] = 0
            Oracle(f, unknown_pointer=pointer).run(); self.atomic_error(f)
        f = fixture(); row(f[0]['frame'], 0, 'troops')['vtableAddress'] = 0
        Oracle(f, unknown_pointer=dict(storage='unrepresented', address=123)).run()
        f[2]['records'].pop(); self.atomic_error(f)
        f = fixture('position-pointer'); row(f[0]['frame'], 0, 'troops')['vtableAddress'] = 0
        self.check_oracle(f, unknown_pointer=ptr('troops', 998, 60))
        f[1]['entry'] = 'position'; self.atomic_error(f)

    def test_24_revision_replay_conflict_and_exhaustion(self):
        for source in SOURCES:
            f = fixture(source=source); t = self.check_oracle(f)
            g = copy.deepcopy(f); g[0] = copy.deepcopy(t['after'])
            replay = run(g); self.assertTrue(replay['replayed']); self.assertEqual(replay['after'], g[0])
            g[3]['id'] += 'changed'; self.atomic_defer(g, 'replay-payload-conflict')
            f[1]['expectedRevision'] += 1; self.atomic_defer(f, 'revision-conflict')
            f[0]['revision'] = I32_MAX; f[1]['expectedRevision'] = I32_MAX; self.atomic_error(f)

    def test_25_budget_guard_exact_limit_and_atomic_rollback(self):
        f = fixture(); Oracle(f).run(); budget = run(f)['nativeCalls']
        for limit in (1, budget-1):
            f[3]['engineGuard']['maxNativeCalls'] = limit
            self.atomic_defer(f, 'engine-guard-native-call-budget')
        f[3]['engineGuard']['maxNativeCalls'] = budget
        self.assertTrue(run(f)['accepted'])

    def test_26_trace_tamper_and_rehashed_tamper(self):
        t = self.check_oracle(fixture())
        for field in ('nativeResult', 'after', 'evidence', 'profileId', 'frameProfileId'):
            g = copy.deepcopy(t)
            if field == 'nativeResult': g[field]['positionX'] += 1
            elif field == 'after': g[field]['frame'][FALLBACK]['positionX'] += 1
            elif field == 'evidence': g[field]['fallbackSeededFromIdb'] = True
            else: g[field] = 'wrong'
            for rehash in (False, True):
                if rehash: g['traceHash'] = digest({k:v for k,v in g.items() if k != 'traceHash'})
                with self.assertRaises(ValueError): m.replay_native_live_position(g)

    def test_27_previous_api_retains_old_observation_and_frame_contract(self):
        for source in SOURCES:
            old = membership_fixture('prepare-movement', source)
            row(old[0]['frame'])['locationId'] = 87
            MembershipOracle(old, position=(-1, 0)).run()
            t = previous.project_native_troop_membership(*old)
            self.assertEqual([q['helper'] for q in t['queries']], ['00489610/virtual+3C'])
            self.assertNotIn(FALLBACK, t['after']['frame'])
            self.assertNotIn('positionX', row(t['after']['frame'], 0, 'troops'))
            self.assertFalse(t['evidence']['nonBasePositionNative'])
            self.assertEqual(t, previous.replay_native_troop_membership(t))
            with self.assertRaises(ValueError): m.project_native_live_position(*old)
            with self.assertRaises(ValueError): previous.project_native_troop_membership(*fixture())

    def test_28_oracle_does_not_call_production_planners_or_primitives(self):
        names = ('native_live_position_profile', 'native_troop_membership_profile', 'native_tail_distance_profile', 'generic_facility_profile', 'live_zero_refund_profile', 'officer_relocation_profile', 'base_ownership_events_profile', 'empty_legion_redistribution_profile', 'return_route_target_force_profile', 'native_roster_sort_profile', 'recursive_officer_return_profile')
        f = fixture('movement-origin'); map_cell(f[0]['frame'], 2, 7, 90 << 5)
        with ExitStack() as stack:
            for name in names:
                mod = importlib.import_module(name)
                for attr in dir(mod):
                    if attr.startswith('project_') or attr == '_Planner':
                        stack.enter_context(patch.object(mod, attr, side_effect=AssertionError('production called')))
            expected = Oracle(f).run()
        self.assertEqual(expected.native_result, 24)

    def test_29_seeded_random_live_positions_and_invalid_troops(self):
        rand = random.Random(0x489610)
        for index in range(80):
            source = SOURCES[index % 2]
            f = fixture(source=source, location=rand.choice((87, 1086, -1, 1087, 0, 86)))
            w = f[0]['frame']
            for r in w['troops']:
                r.update(leaderId=rand.choice((-1, 7, 9, 1100)), deputyIds=[rand.choice((-1, 1099, 1100)), -1], positionX=rand.randint(-32768, 32767), positionY=rand.randint(-32768, 32767))
            w[FALLBACK] = dict(positionX=rand.randint(-32768, 32767), positionY=rand.randint(-32768, 32767))
            self.check_oracle(f, replay=index % 20 == 0)

    def test_30_committed_commands_reread_callback_written_global(self):
        f = fixture()
        row(f[0]['frame'], 0, 'troops')['vtableAddress'] = 0
        for turn in range(6):
            f[1].update(id='position-loop-'+str(turn), expectedRevision=turn)
            def effect(stage, after, context):
                if stage == 'unknown-position-dispatch':
                    after[FALLBACK].update(positionX=turn-3, positionY=100+turn)
                return 0
            t = self.check_oracle(f, effect=effect, unknown_pointer=ptr(FALLBACK, 0x06EE794C, 0))
            self.assertEqual(t['nativeResult'], dict(positionX=turn-3, positionY=100+turn))
            f[0] = copy.deepcopy(t['after'])

    def test_31_honest_evidence_flags(self):
        t = self.check_oracle(fixture())
        for flag in ('nonBasePositionNative', 'nativePositionPointerDistinct', 'explicitMutableFallbackRequired', 'positionDwordReadAtomic', 'troopMembershipNative'):
            self.assertTrue(t['evidence'][flag])
        for flag in ('fallbackSeededFromIdb', 'completeGameTransaction', 'stockVerified', 'vanillaVerified', 'machineCodeExecuted', 'canonicalCaptureContinuationExecuted', 'event9TailExecuted', 'platformFaultsExecuted', 'callbacksAssumedNoninterfering'):
            self.assertFalse(t['evidence'][flag])


    def test_32_predecessor_apis_and_source_checks_byte_frozen(self):
        root = Path(__file__).resolve().parent
        frozen = {'native_troop_membership_frame.py': '3e0c9f4b7207c2f6b078e7a074b024f19675be85eaff3898da3b1e56888d6c5e', 'native_troop_membership_primitives.py': 'cc8be8d9d6d4d586824e8b71385822db98ddda9af1803fb34f362e9c7faf7a06', 'native_troop_membership_profile.py': 'b1b9e7e3b5a796468b235be0d7f621b54ac61137b245551702d1471de074ae5b', 'check_native_troop_membership_profile.py': '4ce8cf358e22250210b480f77218538ab0beec4757949463208851653b5944c9', 'check_native_troop_membership_source.py': '4a772f10d50229948683e9500efeaf18eb99e40c832fd62991073b08acd6567f', 'officer_relocation_primitives.py': 'f0787cd4f58a47ed83806d851ab8c52fce08817354cee9255c9ad124cd47cc51', 'officer_relocation_tables.py': 'be00dd195a64d5782e25fb17d89cb1784ed8f97b9c7245c80ce85fe49fc0872f'}
        for filename, expected in frozen.items():
            self.assertEqual(hashlib.sha256((root / filename).read_bytes()).hexdigest(), expected)


if __name__ == '__main__': unittest.main()
