"""Independent source interpreter for the native troop-membership closure.

Expected frames, answers and records are built by this test-only transcription
of S1/S2 004891C0, 00496040, 00495390 and 00495340, extending the independent
native-tail-distance oracle. Production planners/primitives/projectors never
construct expectations. Unknown-vtable answers and callback mutations below are
explicit synthetic observations, not native behavior or snapshot defaults.
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

import native_troop_membership_profile as m
import native_tail_distance_profile as previous
from check_native_tail_distance_profile import (
    Oracle as TailOracle, fixture as tail_fixture, ENTRIES, MISSIONS, geography)
from check_recursive_officer_return_profile import row, refresh_people, digest
from check_native_roster_sort_profile import person

DOMAIN = 'canonical-native-troop-membership-v1'
FRAME = 'source-idb-S1-S2-native-troop-membership-frame-v1'
PROFILE = 'source-idb-S1-S2-native-troop-membership-v1'
SOURCES = ('S1', 'S2')
VTABLE = 0x0079CC18
I32_MIN, I32_MAX = -2147483648, 2147483647


def troop(tid=0, leader=7, deputies=(-1, -1), vtable=VTABLE):
    return dict(id=tid, vtableAddress=vtable, leaderId=leader,
                deputyIds=list(deputies))


def fixture(entry='troop-member', source='S1', location=87, **kw):
    f = tail_fixture('cancel-mission' if entry == 'troop-member' else entry,
                     source, **kw)
    f[0]['frame']['troops'] = [troop(0), troop(999)]
    f[1]['id'] = 'native-troop-membership-1'
    f[3].update(id='native-troop-membership-observe-v1', frameProfile=FRAME,
                troopMembershipDomain=DOMAIN)
    if entry == 'troop-member':
        f[1].update(entry=entry, args=dict(personId=7))
        row(f[0]['frame'])['locationId'] = location
    return f


def run(f):
    return m.project_native_troop_membership(*f)


class Oracle(TailOracle):
    """Literal signed source branches with no production validation helpers."""
    def __init__(self, *args, unknown_member=False, **kw):
        super().__init__(*args, **kw)
        self.unknown_member = unknown_member
        self.membership_calls = []
        self.membership_reads = []

    def boundary(self, stage, kind, helper, args, result=None):
        if helper == '004891C0':
            return self.troop_member(args['personId'])
        return super().boundary(stage, kind, helper, args, result)

    def get_troop(self, tid):
        if not 0 <= tid < 1000: return None
        value = next((t for t in self.w['troops'] if t['id'] == tid), None)
        if value is None: raise ValueError('oracle missing troop slot ' + str(tid))
        return value

    def troop_member(self, pid):
        # This function does NOT first test actor validity. Native ECX is a
        # readable canonical actor pointer, even when its status is invalid.
        with self.inside('004891C0', personId=pid):
            location = self.get('persons', pid)['locationId']
            if not 87 <= location <= 1086:
                result = False
            else:
                tid = location - 87
                self.save(savedTroopId=tid)
                t = self.get_troop(tid)
                self.membership_reads.append(('troop', tid))
                if t['vtableAddress'] != VTABLE:
                    # Unknown virtual dispatch remains an exact-call read-only
                    # observation. No troop validity is guessed from this row.
                    result = super().boundary('unknown-troop-vtable', 'query',
                        '004891C0', dict(personId=pid, locationId=location),
                        self.unknown_member)
                else:
                    leader_id = t['leaderId']
                    self.membership_reads.append(('leader', leader_id))
                    leader = self.get('persons', leader_id)
                    # 00496040 obtains leader through 00490B00 then calls
                    # 0047A630 -> canonical type10 person virtual+08.
                    valid = leader is not None and (leader['rawDword17C'] != 0
                        or leader['status'] in (0, 1, 2, 3, 4, 5, 7))
                    if valid:
                        for slot in range(2):
                            deputy = t['deputyIds'][slot]
                            self.membership_reads.append(('valid-deputy', slot, deputy))
                            if deputy >= 1100:
                                valid = False
                                break
                    # 00491310 canonical pointer conversion is identity. The
                    # actor's status/raw bits are not read here or by contains.
                    result = False
                    if valid and 0 <= pid <= 1099:
                        self.membership_reads.append(('contains-leader', leader_id))
                        result = leader_id == pid
                        if not result:
                            for slot in range(2):
                                deputy = t['deputyIds'][slot]
                                self.membership_reads.append(('contains-deputy', slot, deputy))
                                if deputy == pid:
                                    result = True
                                    break
            self.membership_calls.append((pid, location, result))
            return result

    def run(self):
        if self.f[1]['entry'] != 'troop-member': return super().run()
        self.native_result = self.troop_member(self.f[1]['args']['personId'])
        self.f[2]['records'] = copy.deepcopy(self.records)
        return self


class NativeTroopMembershipTests(unittest.TestCase):
    maxDiff = 10000

    def check_oracle(self, f, replay=True, **kw):
        expected = Oracle(f, **kw).run()
        before = copy.deepcopy(f)
        t = run(f)
        self.assertTrue(t['accepted'], t['reason'])
        self.assertEqual(t['profileId'], PROFILE)
        self.assertEqual(t['frameProfileId'], FRAME)
        self.assertEqual(t['after']['frame'], expected.w)
        self.assertEqual(t['events'], expected.events)
        self.assertEqual(t['nativeResult'], expected.native_result)
        self.assertEqual(t['returnCalls'], expected.return_calls)
        self.assertEqual(t['observedEffects'], [r for r in expected.records if r['kind'] != 'query'])
        self.assertEqual(t['queries'], [r for r in expected.records if r['kind'] == 'query'])
        self.assertEqual(t['rng']['localCalls'], expected.local_rng)
        actual_reads = []
        for step in t['steps']:
            helper = step['helper']
            if helper == '00490E70': actual_reads.append(('troop', step['troopId']))
            elif helper == '00490B00/troop-leader': actual_reads.append(('leader', step['rawLeaderId']))
            elif helper == '00496040/deputy-upper-bound':
                actual_reads.append(('valid-deputy', step['deputyIndex'], step['rawDeputyId']))
            elif helper == '00495390/leader': actual_reads.append(('contains-leader', step['rawLeaderId']))
            elif helper == '00495340/deputy':
                actual_reads.append(('contains-deputy', step['deputyIndex'], step['rawDeputyId']))
        self.assertEqual(actual_reads, expected.membership_reads)
        self.assertEqual(t['after']['revision'], f[0]['revision'] + 1)
        self.assertEqual(len(t['after']['appliedCommands']), len(f[0]['appliedCommands']) + 1)
        self.assertEqual(f, before)
        if replay: self.assertEqual(t, m.replay_native_troop_membership(json.loads(json.dumps(t))))
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
        self.assertEqual(t, m.replay_native_troop_membership(t))
        return t

    def test_01_both_sources_all_seventeen_inherited_entries(self):
        for source, entry in itertools.product(SOURCES, ENTRIES):
            with self.subTest(source=source, entry=entry):
                t = self.check_oracle(fixture(entry, source))
                for key in ('stockVerified', 'vanillaVerified', 'machineCodeExecuted',
                    'callbacksAssumedNoninterfering', 'engineGuardIsOriginalRule',
                    'completeGameTransaction', 'allCancellationHandlersExecuted',
                    'rulerCaptureExecuted', 'presentationSegmentsExecuted',
                    'nonBasePositionNative'):
                    self.assertFalse(t['evidence'][key])
                self.assertFalse(t['rng']['globalConsumptionVerified'])
                self.assertTrue(t['evidence']['troopMembershipNative'])
                self.assertTrue(t['evidence']['nativeTailDistanceProjection'])

    def test_02_location_signed_boundaries_and_exact_endpoints(self):
        for source, location in itertools.product(SOURCES,
                (I32_MIN, -1, 0, 86, 87, 88, 1085, 1086, 1087, I32_MAX)):
            with self.subTest(source=source, location=location):
                f = fixture(source=source, location=location)
                w = f[0]['frame']
                w['troops'] = [troop(location-87)] if 87 <= location <= 1086 else []
                t = self.check_oracle(f)
                self.assertIs(t['nativeResult'], 87 <= location <= 1086)
                self.assertEqual(t['queries'], [])
                self.assertEqual(t['observedEffects'], [])
                self.assertEqual(t['after']['frame'], w)

    def test_03_leader_first_deputy_second_deputy_and_no_match(self):
        for source, leader, deputies in itertools.product(SOURCES,
                (7, 9), ((-1, -1), (7, -1), (-1, 7), (7, 7))):
            f = fixture(source=source)
            row(f[0]['frame'], 0, 'troops').update(leaderId=leader, deputyIds=list(deputies))
            t = self.check_oracle(f)
            self.assertIs(t['nativeResult'], leader == 7 or 7 in deputies)
            self.assertEqual(t['queries'], [])

    def test_04_all_person_status_and_raw_validity_branches(self):
        statuses = (I32_MIN, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 99, I32_MAX)
        for source, status, raw in itertools.product(SOURCES, statuses, (0, 1, 0xffffffff)):
            f = fixture(source=source)
            row(f[0]['frame']).update(status=status, rawDword17C=raw)
            refresh_people(f[0]['frame'])
            t = self.check_oracle(f, replay=status in (6, 8, 9))
            self.assertIs(t['nativeResult'], raw != 0 or status in (0, 1, 2, 3, 4, 5, 7))

    def test_05_invalid_actor_can_be_deputy_of_valid_leader(self):
        for source, status, deputy_slot in itertools.product(SOURCES,
                (I32_MIN, -1, 6, 8, 9, I32_MAX), (0, 1)):
            f = fixture(source=source)
            w = f[0]['frame']
            row(w).update(status=status, rawDword17C=0)
            refresh_people(w)
            troop_row = row(w, 0, 'troops')
            troop_row.update(leaderId=9, deputyIds=[-1, -1])
            troop_row['deputyIds'][deputy_slot] = 7
            t = self.check_oracle(f, replay=False)
            self.assertFalse(row(t['after']['frame'])['valid'])
            self.assertIs(t['nativeResult'], True)

    def test_06_leader_invalid_null_missing_and_boundary_people(self):
        for source, leader in itertools.product(SOURCES, (I32_MIN, -1, 1100, I32_MAX)):
            f = fixture(source=source)
            row(f[0]['frame'], 0, 'troops').update(leaderId=leader, deputyIds=[7, 7])
            self.assertIs(self.check_oracle(f)['nativeResult'], False)
        for source, status in itertools.product(SOURCES, (6, 8, 9)):
            f = fixture(source=source)
            row(f[0]['frame'], 0, 'troops').update(leaderId=9, deputyIds=[7, -1])
            row(f[0]['frame'], 9).update(status=status, rawDword17C=0)
            refresh_people(f[0]['frame'])
            self.assertIs(self.check_oracle(f)['nativeResult'], False)
        for source, leader in itertools.product(SOURCES, (0, 1099)):
            f = fixture(source=source)
            row(f[0]['frame'], 0, 'troops').update(leaderId=leader, deputyIds=[7, -1])
            self.atomic_error(f)
            f[0]['frame']['persons'].append(person(leader))
            self.assertIs(self.check_oracle(f)['nativeResult'], True)

    def test_07_deputy_signed_bounds_apply_before_membership(self):
        values = (I32_MIN, -1, 0, 1099, 1100, I32_MAX)
        for source, first, second in itertools.product(SOURCES, values, values):
            f = fixture(source=source)
            row(f[0]['frame'], 0, 'troops')['deputyIds'] = [first, second]
            t = self.check_oracle(f, replay=first in (I32_MIN, 1100))
            self.assertIs(t['nativeResult'], first < 1100 and second < 1100)
            # Neither 0 nor 1099 exists; valid deputy values are not getters.
            self.assertNotIn(0, [p['id'] for p in f[0]['frame']['persons']])
            self.assertNotIn(1099, [p['id'] for p in f[0]['frame']['persons']])

    def test_08_actor_ids_zero_and_1099_are_inclusive(self):
        for source, pid, slot in itertools.product(SOURCES, (0, 1099), ('leader', 0, 1)):
            f = fixture(source=source)
            w = f[0]['frame']; w['persons'].append(person(pid, locationId=87))
            f[1]['args']['personId'] = pid
            trow = row(w, 0, 'troops')
            if slot == 'leader': trow['leaderId'] = pid
            else: trow['deputyIds'][slot] = pid
            self.assertIs(self.check_oracle(f)['nativeResult'], True)

    def test_09_missing_reached_troops_raise_and_unreached_slots_do_not(self):
        for source, location in itertools.product(SOURCES, (87, 1086)):
            f = fixture(source=source, location=location); f[0]['frame']['troops'] = []
            self.atomic_error(f)
        for source, location in itertools.product(SOURCES, (86, 1087)):
            f = fixture(source=source, location=location); f[0]['frame']['troops'] = []
            self.assertIs(self.check_oracle(f)['nativeResult'], False)
        f = fixture(); f[1]['args']['personId'] = 1099
        self.atomic_error(f)

    def test_10_unknown_vtables_require_explicit_exact_call_observations(self):
        for source, vtable, answer in itertools.product(SOURCES,
                (0, VTABLE-4, VTABLE+4, 0xffffffff), (False, True)):
            f = fixture(source=source)
            row(f[0]['frame'], 0, 'troops').update(vtableAddress=vtable,
                leaderId=1099, deputyIds=[I32_MAX, I32_MAX])
            t = self.check_oracle(f, unknown_member=answer)
            self.assertIs(t['nativeResult'], answer)
            self.assertEqual(len(t['queries']), 1)
            self.assertEqual(t['queries'][0]['helper'], '004891C0')
            self.assertEqual(t['queries'][0]['args'], dict(personId=7, locationId=87))
            self.assertEqual(t['observedEffects'], [])
            self.assertEqual(t['after']['frame'], f[0]['frame'])
            f[2]['records'] = []; self.atomic_error(f)
        for source in SOURCES:
            f = fixture(source=source)
            row(f[0]['frame'], 0, 'troops')['vtableAddress'] = 0
            f[3]['unknownEffects'] = 'reject'
            self.atomic_error(f)
            self.assertIs(self.check_oracle(f, unknown_member=True)['nativeResult'], True)

    def test_11_query_false_is_not_missing_and_canonical_never_consumes_query(self):
        for source in SOURCES:
            f = fixture(source=source)
            row(f[0]['frame'], 0, 'troops')['vtableAddress'] = 0
            t = self.check_oracle(f, unknown_member=False)
            self.assertIs(t['nativeResult'], False)
            canonical = copy.deepcopy(f)
            row(canonical[0]['frame'], 0, 'troops')['vtableAddress'] = VTABLE
            self.atomic_error(canonical)
            f[2]['records'][0]['result'] = 0; self.atomic_error(f)

    def test_12_relocation_leader_deputies_nonmember_and_invalid_troop(self):
        for source, leader, deputies in itertools.product(SOURCES,
                (7, 9, -1), ((-1, -1), (7, -1), (-1, 7), (7, 1100))):
            f = fixture('relocate-officer', source)
            w = f[0]['frame']; row(w)['locationId'] = 87
            row(w, 0, 'troops').update(leaderId=leader, deputyIds=list(deputies))
            t = self.check_oracle(f, position=(-1, 0), replay=False)
            member = leader >= 0 and max(deputies) < 1100 and (leader == 7 or 7 in deputies)
            self.assertFalse(any(q['helper'] == '004891C0' for q in t['queries']))
            self.assertEqual(row(t['after']['frame'])['missionId'], -1 if member else 37)
            self.assertEqual(any(q['helper'] == '00489610/virtual+3C' for q in t['queries']), not member)

    def test_13_return_retains_location_only_for_actual_native_member(self):
        for source, leader, deputies in itertools.product(SOURCES,
                (7, 9, -1), ((-1, -1), (7, -1), (-1, 7), (7, 1100))):
            f = fixture('return', source)
            w = f[0]['frame']; row(w)['locationId'] = 87
            row(w, 0, 'troops').update(leaderId=leader, deputyIds=list(deputies))
            t = self.check_oracle(f, replay=False)
            member = leader >= 0 and max(deputies) < 1100 and (leader == 7 or 7 in deputies)
            self.assertEqual(row(t['after']['frame'])['locationId'], 87 if member else 0)
            self.assertFalse(any(q['helper'] == '004891C0' for q in t['queries']))

    def test_14_live_return_notice_mutates_troop_and_person_before_native_read(self):
        for source, mutation in itertools.product(SOURCES,
                ('add-member', 'remove-member', 'invalidate-leader', 'raw-rescue', 'move-troop')):
            f = fixture('return', source)
            w = f[0]['frame']; row(w).update(locationId=87, status=3)
            row(w, 0, 'forces')['playerIndex'] = 0
            f[1]['args']['showNotice'] = 1
            row(w, 0, 'troops').update(leaderId=9, deputyIds=[-1, -1])
            def effect(stage, after, context):
                if stage == 'return-notice':
                    trow = row(after, 0, 'troops')
                    if mutation == 'add-member': trow['deputyIds'][0] = 7
                    elif mutation == 'remove-member': trow['leaderId'] = 9
                    elif mutation == 'invalidate-leader':
                        trow['deputyIds'][1] = 7
                        row(after, 9).update(status=6, rawDword17C=0)
                    elif mutation == 'raw-rescue':
                        trow['deputyIds'][1] = 7
                        row(after, 9).update(status=6, rawDword17C=1)
                    else:
                        row(after)['locationId'] = 1086
                        row(after, 999, 'troops').update(leaderId=9, deputyIds=[7, -1])
                return 2 if stage == 'return-notice' else 0
            if mutation == 'remove-member': row(w, 0, 'troops')['leaderId'] = 7
            t = self.check_oracle(f, effect=effect)
            expected = 1086 if mutation == 'move-troop' else 87 if mutation in ('add-member', 'raw-rescue') else 0
            self.assertEqual(row(t['after']['frame'])['locationId'], expected)
            self.assertEqual(t['rng']['observedCalls'], 2)
            self.assertEqual(sum(r['helper'] == '004B93D0/004F55E0' for r in t['observedEffects']), 1)

    def test_15_live_unknown_vtable_fallback_binds_the_mutated_frame(self):
        for source, direction in itertools.product(SOURCES, ('native-to-unknown', 'unknown-to-native')):
            f = fixture('return', source)
            w = f[0]['frame']; row(w).update(locationId=87, status=3)
            row(w, 0, 'forces')['playerIndex'] = 0
            f[1]['args']['showNotice'] = 1
            if direction == 'unknown-to-native': row(w, 0, 'troops')['vtableAddress'] = 0
            def effect(stage, after, context):
                if stage == 'return-notice':
                    row(after, 0, 'troops')['vtableAddress'] = 0 if direction == 'native-to-unknown' else VTABLE
                return 0
            t = self.check_oracle(f, effect=effect, unknown_member=True)
            queries = [q for q in t['queries'] if q['helper'] == '004891C0']
            self.assertEqual(len(queries), int(direction == 'native-to-unknown'))
            self.assertEqual(row(t['after']['frame'])['locationId'], 87)
            if queries: self.assertEqual(row(queries[0]['before'], 0, 'troops')['vtableAddress'], 0)

    def test_16_observer_effects_preserve_troops_in_live_frames(self):
        for source in SOURCES:
            f = fixture('relocate-officer', source)
            w = f[0]['frame']; w['observerPresent'] = True
            row(w)['locationId'] = 87
            row(w, 0, 'troops').update(leaderId=9, deputyIds=[-1, -1])
            def effect(stage, after, context):
                if stage == 'acted-observer':
                    row(after, 0, 'troops').update(leaderId=7, deputyIds=[I32_MIN, 1099])
                    after['observerPresent'] = False
                return 0
            t = self.check_oracle(f, effect=effect, position=(-1, 0))
            self.assertEqual(row(t['after']['frame'], 0, 'troops')['deputyIds'], [I32_MIN, 1099])
            self.assertTrue(t['observedEffects'])
            for rec in t['observedEffects']:
                self.assertIn('troops', rec['before'])
                self.assertIn('troops', rec['after'])

    def test_17_event_cancellation_return_uses_live_native_membership(self):
        for source, member in itertools.product(SOURCES, (False, True)):
            f = fixture('event', source, mission=23, notify=False)
            w = f[0]['frame']; row(w).update(locationId=0, homeBaseId=0, status=3)
            w['observerPresent'] = True
            w['activePersonIds'] = [7, 7, 9]
            row(w, 0, 'buildings')['governorId'] = 9
            row(w, 9)['rawLegionId'] = -1
            row(w, 0, 'troops').update(leaderId=9, deputyIds=[-1, -1])
            def effect(stage, after, context):
                if stage == 'acted-observer':
                    # 005B8400 saved its same-home branch before this call.
                    # Native004BF6F0 then reads live troop/location state.
                    row(after)['locationId'] = 87
                    row(after, 0, 'troops')['deputyIds'][1] = 7 if member else -1
                    after['observerPresent'] = False
                return 0
            t = self.check_oracle(f, effect=effect)
            self.assertGreater(len(t['events']), 1)
            self.assertTrue(any(e['parentEventIndex'] == 0 for e in t['events'][1:]))
            self.assertEqual(t['returnCalls'], 1)
            self.assertEqual(row(t['after']['frame'])['locationId'], 87 if member else 0)
            self.assertFalse(any(q['helper'] == '004891C0' for q in t['queries']))
            self.assertTrue(any(s['helper'] == '00495390/leader' for s in t['steps']))

    def test_18_native_calls_budget_atomicity_and_exact_limit(self):
        for source in SOURCES:
            f = fixture(source=source); Oracle(f).run()
            budget = run(f)['nativeCalls']
            self.assertGreater(budget, 1)
            for limit in (1, budget-1):
                f[3]['engineGuard']['maxNativeCalls'] = limit
                self.atomic_defer(f, 'engine-guard-native-call-budget')
            f[3]['engineGuard']['maxNativeCalls'] = budget
            self.assertTrue(run(f)['accepted'])

    def test_19_query_record_source_args_frame_order_and_scope_tamper(self):
        for source in SOURCES:
            f = fixture(source=source)
            row(f[0]['frame'], 0, 'troops')['vtableAddress'] = 0
            Oracle(f, unknown_member=True).run()
            for defect in ('missing', 'extra', 'source', 'person', 'location',
                           'troop-before', 'stack-helper', 'stack-local', 'result-type'):
                g = copy.deepcopy(f); records = g[2]['records']; r = records[0]
                if defect == 'missing': records.clear()
                elif defect == 'extra': records.append(copy.deepcopy(r)); records[-1]['index'] = 1
                elif defect == 'source': r['source'] = 'S2' if source == 'S1' else 'S1'
                elif defect == 'person': r['args']['personId'] = 9
                elif defect == 'location': r['args']['locationId'] = 1086
                elif defect == 'troop-before': row(r['before'], 0, 'troops')['leaderId'] = 9
                elif defect == 'stack-helper': r['callStack'][-1]['helper'] = '00496040'
                elif defect == 'stack-local': r['callStack'][-1]['locals']['savedTroopId'] = 999
                else: r['result'] = 1
                with self.subTest(source=source, defect=defect): self.atomic_error(g)

    def test_20_effect_domain_cannot_add_remove_or_rename_troop_slots(self):
        for defect in ('add', 'remove', 'rename', 'extra-field'):
            f = fixture('return')
            w = f[0]['frame']; row(w).update(locationId=87, status=3)
            row(w, 0, 'forces')['playerIndex'] = 0
            f[1]['args']['showNotice'] = 1
            Oracle(f).run()
            after = f[2]['records'][0]['after']
            if defect == 'add': after['troops'].append(troop(1))
            elif defect == 'remove': after['troops'].pop()
            elif defect == 'rename': after['troops'][1]['id'] = 998
            else: after['troops'][0]['valid'] = True
            self.atomic_error(f)

    def test_21_strict_troop_schema_signed_integer_and_policy_domain(self):
        changes = (('id', -1), ('id', 1000), ('id', True),
                   ('vtableAddress', -1), ('vtableAddress', 2**32), ('vtableAddress', True),
                   ('leaderId', I32_MIN-1), ('leaderId', I32_MAX+1), ('leaderId', True),
                   ('deputyIds', []), ('deputyIds', [-1]), ('deputyIds', [-1, -1, -1]),
                   ('deputyIds', [False, -1]), ('deputyIds', [I32_MIN-1, -1]),
                   ('deputyIds', [-1, I32_MAX+1]))
        for key, value in changes:
            f = fixture(); row(f[0]['frame'], 0, 'troops')[key] = value; self.atomic_error(f)
        for field in ('id', 'vtableAddress', 'leaderId', 'deputyIds'):
            f = fixture(); del row(f[0]['frame'], 0, 'troops')[field]; self.atomic_error(f)
        f = fixture(); row(f[0]['frame'], 0, 'troops')['valid'] = True; self.atomic_error(f)
        f = fixture(); f[0]['frame']['troops'].append(troop(0)); self.atomic_error(f)
        f = fixture(); del f[0]['frame']['troops']; self.atomic_error(f)
        f = fixture(); f[0]['frame']['troops'] = {}; self.atomic_error(f)
        for key in ('troopMembershipDomain', 'tailDistanceDomain', 'facilityDomain',
                    'zeroRefundDomain', 'relocationDomain', 'frameProfile', 'nativePlatform'):
            f = fixture(); f[3][key] = 'wrong'; self.atomic_error(f)
            f = fixture(); del f[3][key]; self.atomic_error(f)
        for pid in (-1, 1100, True, I32_MIN, I32_MAX):
            f = fixture(); f[1]['args']['personId'] = pid; self.atomic_error(f)

    def test_22_diagnostic_person_cache_cannot_override_raw_validity(self):
        for cache in ('allocated', 'valid'):
            f = fixture(); row(f[0]['frame'])[cache] = False; self.atomic_error(f)
        f = fixture(); row(f[0]['frame']).update(status=6, rawDword17C=0)
        self.atomic_error(f)

    def test_23_trace_tamper_cannot_pass_after_rehash(self):
        t = self.check_oracle(fixture())
        for defect in ('result', 'troop', 'policy', 'profile', 'source', 'frame-profile'):
            g = copy.deepcopy(t)
            if defect == 'result': g['nativeResult'] = False
            elif defect == 'troop': row(g['after']['frame'], 0, 'troops')['leaderId'] = 9
            elif defect == 'policy': g['policy']['troopMembershipDomain'] = 'wrong'
            elif defect == 'profile': g['profileId'] = previous.PROFILE_ID
            elif defect == 'source': g['source'] = 'S2'
            else: g['frameProfileId'] = 'source-idb-S1-S2-base-ownership-frame-v1'
            for rehash in (False, True):
                if rehash: g['traceHash'] = digest({k: v for k, v in g.items() if k != 'traceHash'})
                with self.assertRaises(ValueError): m.replay_native_troop_membership(g)

    def test_24_revision_payload_idempotency_and_exhaustion(self):
        for source in SOURCES:
            f = fixture(source=source); t = self.check_oracle(f)
            g = copy.deepcopy(f); g[0] = copy.deepcopy(t['after'])
            result = run(g)
            self.assertTrue(result['replayed']); self.assertEqual(result['after'], g[0])
            g[3]['id'] += '-changed'; self.atomic_defer(g, 'replay-payload-conflict')
            f = fixture(source=source); f[1]['expectedRevision'] = 1
            self.atomic_defer(f, 'revision-conflict')
            f = fixture(source=source); f[0]['revision'] = I32_MAX
            f[1]['expectedRevision'] = I32_MAX; self.atomic_error(f)

    def test_25_legacy_api_preserves_query_semantics_and_old_frames(self):
        for source in SOURCES:
            old = tail_fixture('relocate-officer', source)
            row(old[0]['frame'])['locationId'] = 87
            TailOracle(old, troop=True).run()
            before = copy.deepcopy(old)
            t = previous.project_native_tail_distance(*old)
            self.assertTrue(t['accepted'])
            self.assertEqual([q['helper'] for q in t['queries']], ['004891C0'])
            self.assertNotIn('troops', t['after']['frame'])
            self.assertFalse(t['evidence']['troopMembershipNative'])
            self.assertEqual(t, previous.replay_native_tail_distance(t))
            self.assertEqual(old, before)
            f = fixture('relocate-officer', source)
            Oracle(f).run()
            with self.assertRaises(ValueError): previous.project_native_tail_distance(*f)
            with self.assertRaises(ValueError): m.project_native_troop_membership(*old)

    def test_26_oracle_never_invokes_production_planners_or_projectors(self):
        names = ('native_troop_membership_profile', 'native_tail_distance_profile',
                 'generic_facility_profile', 'live_zero_refund_profile',
                 'officer_relocation_profile', 'base_ownership_events_profile',
                 'empty_legion_redistribution_profile', 'return_route_target_force_profile',
                 'native_roster_sort_profile', 'recursive_officer_return_profile')
        for source in SOURCES:
            f = fixture(source=source)
            with ExitStack() as stack:
                for name in names:
                    module = importlib.import_module(name)
                    for attr in dir(module):
                        if attr.startswith('project_') or attr == '_Planner':
                            stack.enter_context(patch.object(module, attr,
                                side_effect=AssertionError('production called by oracle')))
                expected = Oracle(f).run()
            self.assertIs(expected.native_result, True)
            self.assertEqual(expected.records, [])
            self.check_oracle(f)

    def test_27_seeded_source_matrix_independent_results(self):
        rng = random.Random(0x4891C0)
        values = (I32_MIN, -1, 0, 7, 9, 1099, 1100, I32_MAX)
        for index in range(160):
            source = SOURCES[index % 2]
            f = fixture(source=source, location=rng.choice((86, 87, 1086, 1087)))
            w = f[0]['frame']; leader = rng.choice((7, 9, -1, 1100))
            deputies = [rng.choice(values), rng.choice(values)]
            for trow in w['troops']: trow.update(leaderId=leader, deputyIds=list(deputies))
            status = rng.choice((3, 5, 6, 7, 8, 9))
            raw = rng.choice((0, 1, 0xffffffff))
            row(w, 9).update(status=status, rawDword17C=raw); refresh_people(w)
            t = self.check_oracle(f, replay=index % 23 == 0)
            leader_valid = leader == 7 or (leader == 9 and (raw != 0 or status in (3, 5, 7)))
            answer = 87 <= row(w)['locationId'] <= 1086 and leader_valid and all(d < 1100 for d in deputies) and (leader == 7 or 7 in deputies)
            self.assertIs(t['nativeResult'], answer)

    def test_28_pinned_complete_source_bodies_and_canonical_vtable(self):
        root = Path(__file__).resolve().parents[1] / 'docs/sources/native_troop_membership'
        bodies = (
            (0x004891C0, 0x0048921F, '1d57cbaee05e849f951219305481215bd4daebe7c840f3ffb0e99730099c5f37'),
            (0x00496040, 0x00496095, '53b3259ab3c5ad65284858ebbb9f4964efe9f9326b7086ffcc88bac821e9ab55'),
            (0x00495390, 0x004953C4, 'd53b87f5995ef377db0aba6be78ef06be98475c7ca91218ef46db4c7012ca0f0'),
            (0x00495340, 0x00495382, 'a49821777993b52dbcdcc0ae4e7e60da729e39e5843a9a8847d67219080dbb17'),
            (0x00490E70, 0x00490E94, '69dce2910ef46501efb42c693e70432a5d30e9156664c3ae48fb55303d72a1be'),
            (0x00490B00, 0x00490B24, '2cb3b51ef504a63e94a8fde3c94d5f9f80fb72d88b0df61f41d2608da575736c'),
            (0x00491310, 0x0049135A, 'ff8455e17139f3794426e7601a069acbed1e81a61f2398b911e75cd0402849f1'),
            (0x0047A630, 0x0047A656, '39414d5052e472ece3b8b80f46b47178be3331aed847fafc4ebd4028aedebe1d'),
            (0x004883D0, 0x004883EB, 'c7dd95b24263a58b616df7adf489d1f07f502af3168d73d09da287ca65ca10c3'),
            (0x004883F0, 0x00488422, '1a09de9f631ef197445be47b0d0886b4b49e942d128bd27ed615a38f5290a088'),
            (0x00488430, 0x00488461, '7491f2b7b02c21e417945fbd0ee295ad3c5d2c24a99a159e443f306d0acb7f1f'),
            (0x00468E60, 0x00468E66, '5df10ed21e27c6f4dcad30a3050f43ccebae8ffa69612802165a96b9efeefddb'))
        critical = {0x004891CD:'7c4b', 0x004891D4:'7f44',
                    0x00496079:'81394c040000', 0x0049607F:'7d10',
                    0x00496091:'33c0', 0x00496094:'c3',
                    0x00495366:'3bce', 0x0049536E:'83f802',
                    0x00490E7F:'69c0f4000000', 0x00490B0F:'69c090010000'}
        for source, (start, end, expected_hash) in itertools.product(SOURCES, bodies):
            raw, cursor = bytearray(), start
            for line in (root / (source + '-' + format(start, '08X') + '.asm.txt')).read_text().splitlines():
                match = re.match(r'^([0-9A-Fa-f]{8})\s+((?:[0-9a-f]{2}\s+)+)(?=[a-z])', line)
                if not match: continue
                address = int(match.group(1), 16)
                self.assertEqual(address, cursor)
                data = bytes.fromhex(match.group(2)); raw.extend(data); cursor += len(data)
                if address in critical: self.assertEqual(data.hex(), critical[address])
            self.assertEqual(cursor, end)
            self.assertEqual(hashlib.sha256(raw).hexdigest(), expected_hash)
        for source in SOURCES:
            raw, cursor = bytearray(), VTABLE
            for line in (root / (source+'-0079CC18.data.txt')).read_text().splitlines():
                parts = line.split()
                self.assertEqual(int(parts[0], 16), cursor)
                value = bytes.fromhex(' '.join(parts[1:])); raw.extend(value); cursor += len(value)
            self.assertEqual(int.from_bytes(raw[8:12], 'little'), 0x00496040)
            self.assertEqual(int.from_bytes(raw[0x24:0x28], 'little'), 0x00468E60)
            self.assertEqual(int.from_bytes(raw[0x48:0x4c], 'little'), 0x0047A690)

    def test_29_frozen_predecessors_and_existing_frame_bytes(self):
        root = Path(__file__).resolve().parent
        frozen = {
            'native_tail_distance_profile.py': '7ef9ed70f29534b774ab35d299992b6396b01e44692acce6c2223a3ebe5f38f7',
            'native_tail_distance_primitives.py': '97d5f57057cade421ac1b83361914e6f7c44c4b3a25dfb5f1f33831821f285a0',
            'check_native_tail_distance_profile.py': '4c7ea04e7d0b46cf32ed7f23ed5af371fbda3bdb89be780f8adaacc3cfa8dfa2',
            'base_ownership_frame.py': 'd784d3c2f00c17b1788acad3a616a6f9121c86e8ad87cca8142a8f54ee8a6ac4',
            'officer_relocation_primitives.py': 'f0787cd4f58a47ed83806d851ab8c52fce08817354cee9255c9ad124cd47cc51',
            'recursive_officer_return_profile.py': '71730182c0c9725c60beaef9f8d74e717f9e281ca2266b7f2e5c9da9fd5707c8'}
        for name, expected in frozen.items():
            self.assertEqual(hashlib.sha256((root / name).read_bytes()).hexdigest(), expected)

    def test_30_committed_commands_reread_live_troops_after_each_notice(self):
        for source in SOURCES:
            f = fixture('return', source)
            row(f[0]['frame'], 0, 'forces')['playerIndex'] = 0
            f[1]['args']['showNotice'] = 1
            for turn in range(8):
                f[1].update(id='troop-live-'+str(turn), expectedRevision=turn)
                row(f[0]['frame']).update(status=3, rawDword17C=0)
                refresh_people(f[0]['frame'])
                def effect(stage, after, context):
                    if stage == 'return-notice':
                        row(after)['locationId'] = 87 if turn % 2 else 1086
                        for trow in after['troops']:
                            trow.update(leaderId=9, deputyIds=[7 if turn % 3 else -1, -1])
                    return 0
                t = self.check_oracle(f, effect=effect, replay=turn in (0, 7))
                expected_location = (87 if turn % 2 else 1086) if turn % 3 else 0
                self.assertEqual(row(t['after']['frame'])['locationId'], expected_location)
                self.assertEqual(t['after']['revision'], turn+1)
                f[0] = copy.deepcopy(t['after'])


    def test_31_nested_returns_reread_same_troop_after_each_observer(self):
        for source, second in itertools.product(SOURCES,
                ('native-member', 'native-no-match', 'unknown-member')):
            f = fixture('event', source, mission=23, notify=False)
            w = f[0]['frame']; row(w).update(locationId=0, homeBaseId=0, status=3)
            w['observerPresent'] = True
            w['activePersonIds'] = [7, 10, 7]
            row(w, 0, 'buildings')['governorId'] = 9
            row(w, 9)['rawLegionId'] = -1
            w['persons'].append(person(10, status=3, missionId=23,
                                      homeBaseId=0, locationId=0))
            row(w, 0, 'troops').update(leaderId=9, deputyIds=[-1, -1])
            def effect(stage, after, context):
                if stage == 'acted-observer':
                    pid = context['personId']
                    row(after, pid)['locationId'] = 87
                    trow = row(after, 0, 'troops')
                    trow['deputyIds'] = [pid, -1]
                    if pid == 10:
                        if second == 'native-no-match': trow['deputyIds'] = [-1, -1]
                        elif second == 'unknown-member': trow['vtableAddress'] = 0
                return 0
            t = self.check_oracle(f, effect=effect, unknown_member=True)
            self.assertEqual(t['returnCalls'], 2)
            entries = [s['personId'] for s in t['steps'] if s['helper'] == '004891C0/location']
            self.assertEqual(entries, [7, 10])
            self.assertEqual(row(t['after']['frame'])['locationId'], 87)
            self.assertEqual(row(t['after']['frame'], 10)['locationId'],
                             0 if second == 'native-no-match' else 87)
            self.assertTrue(any(e['parentEventIndex'] == 1 for e in t['events']))
            queries = [q for q in t['queries'] if q['helper'] == '004891C0']
            self.assertEqual(len(queries), int(second == 'unknown-member'))
            if queries:
                self.assertEqual(queries[0]['args']['personId'], 10)
                self.assertEqual(row(queries[0]['before'], 0, 'troops')['deputyIds'], [10, -1])
            f[3]['engineGuard']['maxEventDepth'] = 1
            self.atomic_defer(f, 'engine-guard-event-depth')



if __name__ == '__main__': unittest.main()
