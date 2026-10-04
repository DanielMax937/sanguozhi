"""P0-63 independent executable source oracle and adversarial transaction tests.

Expected frames, callback records and native read/comparison order are generated
by a test-only interpreter. It extends P0-62's independent recursive oracle; it
never calls a production planner, sort primitive, capacity helper or projector.
Only assertions invoke the public API. Identity/count-zero callback replies are
explicit synthetic fixtures, not production defaults or native RNG evidence.

Source: S1/S2 0047CD50, 0047B910, 004AA200, 004A69E0, 004A6B70,
004CEF90, 004CF160, 0049D420, 0049D540 and S2 0090E8D8/0090D1A8.
"""
import copy
import itertools
import json
import random
import unittest
from unittest.mock import patch

import native_roster_sort_profile as m
from check_recursive_officer_return_profile import (
    Oracle as RecursiveOracle, fixture as recursive_fixture, person as old_person,
    row, refresh_people, digest)

FRAME = 'source-idb-S1-S2-native-sort-frame-v1'
SORT_DOMAIN = 'canonical-person-rosters-1-0-0-0-v1'


def person(pid, **fields):
    return dict(old_person(pid, **fields), rawDword54=fields.get('rawDword54', pid))


def fixture(entry='role-sort', source='S1', leader=True, candidates=None, **kw):
    base_entry = entry if entry in ('event', 'return', 'legion', 'governor') else 'governor'
    f = recursive_fixture(entry=base_entry, source=source, **kw)
    w = f[0]['frame']
    for p in w['persons']: p['rawDword54'] = p['id']
    w['persons'].append(person(403, status=9, rawLegionId=-1))
    for force in w['forces']:
        force.update(raw40=0, titleId=3, techniqueBits=[0, 0])
    w['titles'] = [dict(id=i, valid=True, capacityWord=14000-i*1000, data={}) for i in range(10)]
    w['offices'] = [dict(id=i, valid=True, capacityWord=10000-i*50, data={})
                    for i in (0, 10, 20, 44, 80)]
    if entry == 'role-sort':
        args = dict(candidateIds=[9, 7] if candidates is None else candidates, leader=leader)
    elif entry == 'roster-sort': args = dict(table='buildings', targetId=0)
    elif entry == 'capacity': args = dict(personId=7)
    else: args = f[1]['args']
    f[1].update(id='native-1', entry=entry, args=args)
    f[3].update(id='native-observe-v1', frameProfile=FRAME, sortDomain=SORT_DOMAIN,
                nativePlatform='unmodified-successful-probes-allocator-locks-v1')
    f[3]['engineGuard']['maxSortDepth'] = 128
    return f


def run(f):
    return m.project_native_roster_sort(*f)


# Deliberately explicit trace vocabulary, independent of production imports.
NATIVE_STEPS = {
    '0047CD50/count', '0047CD50/return', '0047CD50/first-filter',
    '0047CD50/cache-key', '004C9610/allocated', '004C90E0/allocated',
    '004C8720/allocated', '00491310', '004A6960/left-allocated',
    '004A6960/right-allocated', 'person.virtual28', '004A6960/result',
    '0047BE50/clear-original', '0047CD50/second-filter', '0047CF0C/append',
    '004AA200/count-shortcut', '004AA200/first-filter',
    '004AA200/clear-original', '004AA200/second-filter', '004AA305/append',
    '004AA200/native-result', '004CEF90/left-valid', '004CEF90/right-valid',
    '004CF160/left-valid', '004CF160/right-valid', '00488C00',
    '004CEF90/office', '00489070', '00489080', '004CF160/status',
    '004CF160/rawAE', '004CF160/status-gate', '004CEF90/result', '004CF160/result',
    '0049D420/table-read', '0049D420/person-valid', '0049D4AA',
    '0049D4C1', '0049D4C4', '0049D540/person-valid', '004811E0',
    '0049D540/result',
}


class OracleArrayReadError(RuntimeError):
    """Native scan escaped the allocated array; no Python negative indexing."""


class Oracle(RecursiveOracle):
    """Source interpreter with separate occurrence records and live pointer reads."""
    def __init__(self, *args, **kw):
        super().__init__(*args, **kw)
        self.native_result = None
        self.audit = []
        self.comparisons = []

    def get(self, name, rid):
        if name not in ('titles', 'offices'): return super().get(name, rid)
        if not 0 <= rid <= (9 if name == 'titles' else 80): return None
        return next(r for r in self.w[name] if r['id'] == rid)

    def ruler(self, pid):
        status = self.get('persons', pid)['status']
        self.note('00488C00', personId=pid, status=status, result=status == 0)
        return status == 0

    def note(self, helper, **details):
        self.audit.append(dict(helper=helper, **copy.deepcopy(details),
                               callStack=copy.deepcopy(self.stack), frame=copy.deepcopy(self.w)))

    def save(self, **values):
        self.stack[-1]['locals'].update(copy.deepcopy(values))

    def allocated(self, pid, helper):
        p = self.get('persons', pid)
        value = p['rawDword17C'] != 0 or p['status'] in range(9)
        self.note(helper, personId=pid, result=value)
        return value

    def valid_read(self, pid, helper):
        p = self.get('persons', pid)
        value = p is not None and (p['rawDword17C'] != 0 or p['status'] in (0, 1, 2, 3, 4, 5, 7))
        self.note(helper, personId=pid, result=value)
        return value

    def read(self, pid, field, helper):
        value = self.get('persons', pid)[field]
        self.note(helper, personId=pid, field=field, result=value)
        return value

    def canonical_id(self, pid):
        self.note('person.virtual28', personId=pid, result=pid)
        return pid

    def quick(self, items, lo, hi, comparator, roster=False):
        """Inclusive x86 ranges: recursion is left-only, right side reuses scope."""
        def load(index):
            if index < 0 or index >= len(items): raise OracleArrayReadError(index)
            return items[index]
        with self.inside('0047B910' if roster else '004A69E0', low=lo, high=hi):
            while hi > lo:
                if hi == lo + 1:
                    result = self.compare(load(lo), load(hi), comparator)
                    if result == 0: items[lo], items[hi] = load(hi), load(lo)
                    break
                pivot = load((lo + hi) // 2)
                a, b = lo, hi
                same = (lambda x: x['occurrence'] == pivot['occurrence']) if roster else (lambda x: x == pivot)
                while True:
                    while not same(load(a)):
                        if not self.compare(load(a), pivot, comparator): break
                        a += 1
                    while not same(load(b)):
                        if not self.compare(pivot, load(b), comparator): break
                        b -= 1
                    if a >= b: break
                    items[a], items[b] = load(b), load(a)
                    a, b = a + 1, b - 1
                if a - 1 > lo: self.quick(items, lo, a - 1, comparator, roster)
                lo = b + 1

    def merge(self, items, lo, hi, comparator):
        with self.inside('004A6B70', low=lo, high=hi):
            if hi <= lo: return
            middle = (lo + hi) // 2
            self.merge(items, lo, middle, comparator)
            self.merge(items, middle + 1, hi, comparator)
            saved = items[lo:middle + 1]
            left, right, dest = 0, middle + 1, lo
            while left < len(saved) and right <= hi:
                take_left = self.compare(saved[left], items[right], comparator)
                if take_left:
                    value = saved[left]
                    left += 1
                else:
                    value = items[right]
                    right += 1
                items[dest] = value
                dest += 1
            items[dest:dest + len(saved) - left] = saved[left:]

    def compare(self, left, right, helper):
        self.comparisons.append((helper, copy.deepcopy(left), copy.deepcopy(right)))
        with self.inside(helper, left=left, right=right, extra0=0, extra1=0):
            if helper == '004A6960': result = self.roster_comparison(left, right)
            elif helper == '004CEF90': result = self.leader_comparison(left, right)
            else: result = self.governor_comparison(left, right)
            self.note(helper + '/result', result=bool(result))
            return bool(result)

    def roster_comparison(self, left, right):
        a, b = left['personId'], right['personId']
        if not self.allocated(a, '004A6960/left-allocated'): return a < b
        if not self.allocated(b, '004A6960/right-allocated'): return a < b
        if left['key'] != right['key']: return left['key'] < right['key']
        saved = self.canonical_id(b)
        return self.canonical_id(a) < saved

    def sort_roster(self, table, rid, key):
        with self.inside('0047CD50', table=table, rosterId=rid,
                         rosterField=key, arguments=[1, 0, 0, 0]):
            ids = list(self.get(table, rid)[key])
            self.note('0047CD50/count', count=len(ids))
            if len(ids) < 2:
                self.note('0047CD50/return', returnValue=1, countBelowTwo=True)
                return 1
            self.save(copiedRosterIds=ids)
            cached = []
            for index, pid in enumerate(ids):
                with self.inside('0047CD50/key', occurrence=index, personId=pid):
                    if not self.allocated(pid, '0047CD50/first-filter'): continue
                    with self.inside('00488720', personId=pid, field=0, direction=1, extra=0):
                        key_value = 2**31-1
                        for label in ('004C9610', '004C90E0', '004C8720'):
                            if not self.allocated(pid, label + '/allocated'): break
                        else:
                            key_value = pid
                            self.note('00491310', personId=pid, result=pid)
                    entry = dict(occurrence=index, personId=pid, key=key_value)
                    cached.append(entry)
                    self.note('0047CD50/cache-key', entry=entry)
            with self.inside('0047C6A0', entryCount=len(cached), entries=cached):
                if len(cached) >= 2: self.quick(cached, 0, len(cached)-1, '004A6960', True)
            self.get(table, rid)[key] = []
            self.note('0047BE50/clear-original', table=table, rosterId=rid, rosterField=key)
            for entry in cached:
                pid = entry['personId']
                if self.allocated(pid, '0047CD50/second-filter'):
                    self.get(table, rid)[key].append(pid)
                    self.note('0047CF0C/append', table=table, rosterId=rid,
                              personId=pid, occurrence=entry['occurrence'])
            self.note('0047CD50/return', returnValue=1, sortedEntries=cached)
            return 1

    def append_sort(self, table, rid, key, pid):
        self.get(table, rid)[key].append(pid)
        self.sort_roster(table, rid, key)

    def rank(self, candidates, stage, leader):
        original = list(candidates)
        if len(original) <= 1:
            self.note('004AA200/count-shortcut', stage=stage,
                      candidateIds=original, sortFlag=int(leader))
            return original
        comparator = '004CEF90' if leader else '004CF160'
        with self.inside('004AA200', stage=stage, comparator=comparator,
                         sortFlag=int(leader), candidateIds=original):
            values = [p for p in original if self.allocated(p, '004AA200/first-filter')]
            self.save(copiedAllocatedIds=values)
            with self.inside('004A8F40' if leader else '004A8FF0', candidateIds=values,
                             comparator=comparator, extra0=0, extra1=0):
                if len(values) >= 2:
                    if leader: self.quick(values, 0, len(values)-1, comparator)
                    else: self.merge(values, 0, len(values)-1, comparator)
            self.note('004AA200/clear-original', candidateIds=original)
            output = []
            for occurrence, pid in enumerate(values):
                if self.allocated(pid, '004AA200/second-filter'):
                    output.append(pid)
                    self.note('004AA305/append', occurrence=occurrence, personId=pid)
            self.note('004AA200/native-result', stage=stage,
                      candidateIds=original, rankedIds=output)
            return output

    def leader_comparison(self, a, b):
        if not self.valid_read(a, '004CEF90/left-valid'): return a < b
        if not self.valid_read(b, '004CEF90/right-valid'): return a < b
        left_ruler = self.ruler(a)
        right_ruler = self.ruler(b)
        if left_ruler != right_ruler: return left_ruler
        saved = self.capacity(a) % 65536
        self.save(savedLeftCapacity=saved)
        current = self.capacity(b) % 65536
        if saved != current: return saved > current
        left = self.read(a, 'officeId', '004CEF90/office')
        right = self.read(b, 'officeId', '004CEF90/office')
        if left != right: return left < right
        left = self.read(a, 'leadershipByte', '00489070')
        right = self.read(b, 'leadershipByte', '00489070')
        return left > right if left != right else a < b

    def governor_comparison(self, a, b):
        if not self.valid_read(a, '004CF160/left-valid'): return a < b
        if not self.valid_read(b, '004CF160/right-valid'): return a < b
        if a == b: return False
        left = self.read(a, 'status', '004CF160/status')
        if left <= 1:
            right = self.read(b, 'status', '004CF160/status')
            if left != right: return left < right
        elif self.read(b, 'status', '004CF160/status-gate') <= 1:
            right = self.read(b, 'status', '004CF160/status')
            if left != right: return left < right
        saved = self.capacity(a) % 65536
        self.save(savedLeftCapacity=saved)
        current = self.capacity(b) % 65536
        if saved != current: return saved > current
        for field, helper in [('leadershipByte', '00489070'), ('strengthByte', '00489080')]:
            first = self.read(a, field, helper)
            second = self.read(b, field, helper)
            if first != second:
                return self.read(a, field, helper) > self.read(b, field, helper)
        first = self.read(a, 'rawWordAE', '004CF160/rawAE')
        second = self.read(b, 'rawWordAE', '004CF160/rawAE')
        if first != second: return first > second
        return self.canonical_id(a) < self.canonical_id(b)

    def table_capacity(self, table, rid):
        record = self.get(table, rid)
        if record is None or not record['valid']: return None
        self.note('0049D420/table-read', table=table, recordId=rid,
                  capacityWord=record['capacityWord'])
        return record['capacityWord']

    def hook(self, pid, query, caller):
        return self.boundary('capacity-query' + str(query), 'effect-query', '004890F0',
                             dict(personId=pid, queryId=query, caller=caller), 0)

    def base_capacity(self, pid):
        with self.inside('0049D420', personId=pid):
            if not self.valid_read(pid, '0049D420/person-valid'): return 0
            saved_force = self.force_id(pid)
            if not self.valid('forces', saved_force): return 0
            self.save(savedForceId=saved_force)
            if self.source == 'S2':
                with self.inside('0090E8D8', personId=pid, savedForceId=saved_force):
                    enabled = self.hook(pid, 377, '0090E8D8')
                    if enabled:
                        return (12000, 15000)[self.ruler(pid)]
            special = self.get('forces', saved_force)['raw40'] == 5
            ruler = self.ruler(pid)
            if ruler:
                title = self.get('forces', saved_force)['titleId']
                index = 0 if special else title if title in range(10) else 9
                found = self.table_capacity('titles', index)
                if found is not None: return found
            office = self.read(pid, 'officeId', '0049D4AA')
            if special:
                raw = self.read(pid, 'rawDword54', '0049D4C1')
                reference = self.read(403, 'rawDword54', '0049D4C4')
                if self.source == 'S1' and raw == reference:
                    found = self.table_capacity('titles', 0)
                    if found is not None: return found
                office = 20
            elif saved_force not in range(42): office = 44 if self.source == 'S1' else 0
            elif office not in range(81): office = 80
            found = self.table_capacity('offices', office)
            return 0 if found is None else found

    def capacity(self, pid):
        with self.inside('0048A4F0', personId=pid), self.inside('0049D540', personId=pid):
            total = self.base_capacity(pid)
            self.save(savedBaseCapacity=total)
            if not self.valid_read(pid, '0049D540/person-valid'): return total
            fid = self.force_id(pid)
            has_force = self.valid('forces', fid)
            self.save(savedBonusForceId=fid, bonusForceValid=has_force)
            if has_force:
                index = 18 if self.source == 'S1' else 3
                bits = self.get('forces', fid)['techniqueBits']
                learned = bool((bits[index // 32] >> (index % 32)) & 1)
                self.note('004811E0', forceId=fid, techniqueId=index, result=learned)
                if learned: total += 3000
            if self.source == 'S2':
                with self.inside('0090D1A8', personId=pid, savedCapacity=total):
                    bonus = self.hook(pid, 278, '0090D1A8')
                if bonus: total += 2000
            self.note('0049D540/result', personId=pid, result=total)
            return total

    def run(self):
        entry, args = self.f[1]['entry'], self.f[1]['args']
        if entry == 'roster-sort':
            table = args['table']
            if table == 'buildings':
                bid = args['targetId']; b = self.get('buildings', bid)
                canonical = b is not None and ((b['kind'] == 0 and 0 <= bid <= 41) or
                    (b['kind'] == 1 and 42 <= bid <= 51) or (b['kind'] == 2 and 52 <= bid <= 86))
                if not canonical or not b['subtypeValid']:
                    raise ValueError('oracle noncanonical building roster receiver')
            self.native_result = self.sort_roster(table, args['targetId'],
                                                  'homeRosterIds' if table == 'buildings' else 'rosterIds')
        elif entry == 'role-sort': self.native_result = self.rank(args['candidateIds'], 'direct', args['leader'])
        elif entry == 'capacity': self.native_result = self.capacity(args['personId'])
        else: super().run()
        self.f[2]['records'] = copy.deepcopy(self.records)
        return self


class NativeTests(unittest.TestCase):
    maxDiff = 4000

    def check_oracle(self, f, replay=True, allow_unsafe=False, **kw):
        expected = Oracle(f, **kw)
        try: expected.run()
        except OracleArrayReadError:
            if not allow_unsafe: raise
            f[2]['records'] = copy.deepcopy(expected.records)
            result = self.atomic_defer(f, 'unsupported-native-sort-array-read')
            self.assertEqual(result['observedEffects'], expected.records)
            return result
        original = copy.deepcopy(f)
        actual = run(f)
        self.assertTrue(actual['accepted'], actual['reason'])
        self.assertEqual(actual['after']['frame'], expected.w)
        self.assertEqual(actual['nativeResult'], expected.native_result)
        self.assertEqual(actual['events'], expected.events)
        self.assertEqual(actual['returnCalls'], expected.return_calls)
        self.assertEqual(actual['observedEffects'], [r for r in expected.records if r['kind'] != 'query'])
        self.assertEqual(actual['queries'], [r for r in expected.records if r['kind'] == 'query'])
        self.assertEqual([s for s in actual['steps'] if s['helper'] in NATIVE_STEPS
                          and not (s['helper'] == '00491310' and 'personId' not in s)], expected.audit)
        self.assertEqual(actual['after']['revision'], f[0]['revision'] + 1)
        self.assertEqual(len(actual['after']['appliedCommands']), len(f[0]['appliedCommands']) + 1)
        self.assertEqual(f, original)
        if replay: self.assertEqual(actual, m.replay_native_roster_sort(json.loads(json.dumps(actual))))
        return actual

    def atomic_error(self, f):
        original = copy.deepcopy(f)
        with self.assertRaises(ValueError): run(f)
        self.assertEqual(f, original)

    def atomic_defer(self, f, reason):
        original = copy.deepcopy(f)
        result = run(f)
        self.assertFalse(result['accepted'])
        self.assertEqual(result['reason'], reason)
        self.assertEqual(result['after'], f[0])
        self.assertEqual(result['steps'], [])
        self.assertEqual(result['events'], [])
        self.assertEqual(f, original)
        self.assertEqual(result, m.replay_native_roster_sort(result))
        return result

    def test_01_entries_sources_and_roundtrip(self):
        for entry, source in itertools.product(
                ('roster-sort', 'role-sort', 'capacity', 'event', 'return', 'legion', 'governor'), ('S1', 'S2')):
            with self.subTest(entry=entry, source=source):
                t = self.check_oracle(fixture(entry, source))
                self.assertEqual(t['rng']['localCalls'], 0)
                self.assertFalse(t['rng']['globalConsumptionVerified'])
                self.assertFalse(t['evidence']['machineCodeExecuted'])
                self.assertFalse(t['evidence']['engineGuardIsOriginalRule'])
                self.assertFalse(t['evidence']['callbacksAssumedNoninterfering'])
                self.assertNotIn('004AA200', [r['helper'] for r in t['observedEffects']])
                self.assertNotIn('0047CD50', [r['helper'] for r in t['observedEffects']])

    def test_02_roster_occurrences_allocation_and_shortcuts(self):
        for source, table, ids in itertools.product(('S1', 'S2'), ('buildings', 'legions'),
                                                   ([], [403], [9, 7], [7, 7], [9, 403, 7, 9, 7, 403])):
            f = fixture('roster-sort', source)
            f[1]['args']['table'] = table
            key = 'homeRosterIds' if table == 'buildings' else 'rosterIds'
            row(f[0]['frame'], 0, table)[key] = list(ids)
            t = self.check_oracle(f)
            self.assertEqual(row(t['after']['frame'], 0, table)[key],
                             list(ids) if len(ids) < 2 else sorted(p for p in ids if p != 403))
            keys = [s for s in t['steps'] if s['helper'] == '0047CD50/cache-key']
            self.assertEqual(len(keys), 0 if len(ids) < 2 else sum(p != 403 for p in ids))
        f = fixture('roster-sort')
        row(f[0]['frame'], 0, 'buildings')['homeRosterIds'] = [7, 7]
        t = self.check_oracle(f)
        result = next(s for s in t['steps'] if s['helper'] == '0047CD50/return')
        self.assertEqual([r['occurrence'] for r in result['sortedEntries']], [1, 0])
        ids = [s['personId'] for s in t['steps'] if s['helper'] == 'person.virtual28']
        self.assertEqual(ids, [7, 7])

    def test_03_role_shortcuts_invalid_allocated_and_pointer_duplicates(self):
        for leader, ids in itertools.product((False, True), ([], [403], [403, 403], [7, 7], [7, 7, 7], [9, 403, 7, 9])):
            f = fixture(source='S2', leader=leader, candidates=list(ids))
            t = self.check_oracle(f)
            calls = [r for r in t['observedEffects'] if r['helper'] == '004890F0']
            if ids == [7, 7]: self.assertEqual(len(calls), 4 if leader else 0)
            if ids == [7, 7, 7]: self.assertEqual(len(calls), 0)
            if len(ids) <= 1: self.assertEqual(t['nativeResult'], ids)
        for leader, status in itertools.product((False, True), (6, 8, 9, -1)):
            f = fixture(leader=leader, candidates=[9, 7])
            row(f[0]['frame'], 9)['status'] = status
            refresh_people(f[0]['frame'])
            t = self.check_oracle(f)
            self.assertEqual(t['nativeResult'], [7, 9] if status in (6, 8) else [7])

    def test_04_static_comparator_precedence_matrix(self):
        cases = [
            ({'status': 0}, {'leadershipByte': 255}),
            ({'status': 1}, {'status': 3, 'leadershipByte': 255}),
            ({'officeId': 0}, {'officeId': 10}),
            ({'officeId': 10}, {'officeId': 20}),
            ({'leadershipByte': 71}, {'leadershipByte': 70}),
            ({'strengthByte': 61}, {'strengthByte': 60}),
            ({'rawWordAE': 65535}, {'rawWordAE': 0}),
            ({}, {}),
        ]
        for leader, source, (left, right) in itertools.product((False, True), ('S1', 'S2'), cases):
            f = fixture(source=source, leader=leader, candidates=[9, 7])
            row(f[0]['frame'], 9).update(left)
            row(f[0]['frame'], 7).update(right)
            refresh_people(f[0]['frame'])
            self.check_oracle(f)

    def test_05_governor_unequal_ability_getters_are_repeated(self):
        for field, helper in [('leadershipByte', '00489070'), ('strengthByte', '00489080')]:
            f = fixture(leader=False, candidates=[9, 7])
            row(f[0]['frame'], 9).update(status=3, **{field: 99})
            t = self.check_oracle(f)
            reads = [s['personId'] for s in t['steps'] if s['helper'] == helper]
            self.assertEqual(reads, [9, 7, 9, 7])
            self.assertEqual(t['nativeResult'], [9, 7])

    def test_06_capacity_static_source_branches(self):
        for source, status, special, same54 in itertools.product(
                ('S1', 'S2'), (0, 3, 6), (False, True), (False, True)):
            f = fixture('capacity', source)
            w = f[0]['frame']
            row(w, 7).update(status=status, rawDword54=403 if same54 else 7)
            row(w, 0, 'forces')['raw40'] = 5 if special else 0
            refresh_people(w)
            self.check_oracle(f)
        for source, fid, office in itertools.product(('S1', 'S2'), (0, 42, 46), (-2, 0, 80, 81)):
            f = fixture('capacity', source)
            w = f[0]['frame']
            row(w, 0, 'forces')['id'] = fid
            row(w, 0, 'legions')['forceId'] = fid
            row(w)['officeId'] = office
            t = self.check_oracle(f)
            expected = office if office in range(81) else 80
            if fid >= 42: expected = 44 if source == 'S1' else 0
            self.assertEqual(t['nativeResult'], row(w, expected, 'offices')['capacityWord'])

    def test_07_capacity_hooks_nonzero_bonus_and_low16(self):
        for source, bit in itertools.product(('S1', 'S2'), (3, 18, 35, 63)):
            f = fixture('capacity', source)
            bits = row(f[0]['frame'], 0, 'forces')['techniqueBits']
            bits[bit//32] |= 1 << (bit%32)
            t = self.check_oracle(f)
            self.assertEqual(t['nativeResult'], 9500 + (3000 if bit == (18 if source == 'S1' else 3) else 0))
        for answer, ruler in itertools.product((0, 1, -1, -2**31, 2**31-1), (False, True)):
            f = fixture('capacity', 'S2')
            row(f[0]['frame'])['status'] = 0 if ruler else 3
            def effect(stage, w, c):
                return dict(result=answer, count=0)
            t = self.check_oracle(f, effect=effect)
            self.assertEqual(t['nativeResult'], (15000 if ruler else 12000)+2000 if answer else (11000 if ruler else 9500))
        for leader in (False, True):
            f = fixture(source='S2', leader=leader, candidates=[9, 7])
            w = f[0]['frame']
            row(w, 9).update(status=3, officeId=20)
            row(w, 10, 'offices')['capacityWord'] = 65535
            row(w, 20, 'offices')['capacityWord'] = 2000
            row(w, 0, 'forces')['techniqueBits'][0] = 1 << 3
            t = self.check_oracle(f)
            self.assertEqual(t['nativeResult'], [9, 7])

    def test_08_saved_force_and_live_bonus_force(self):
        f = fixture('capacity', 'S2')
        w = f[0]['frame']
        w['forces'].append(dict(copy.deepcopy(w['forces'][0]), id=1, techniqueBits=[1<<3, 0]))
        w['legions'].append(dict(copy.deepcopy(w['legions'][0]), id=1, forceId=1))
        def effect(stage, v, c):
            if stage == 'capacity-query377':
                row(v, 0, 'forces').update(valid=False, raw40=5)
                row(v).update(rawLegionId=1, officeId=80)
            if stage == 'capacity-query278':
                row(v, 20, 'offices')['capacityWord'] = 1
                row(v, 1, 'forces')['techniqueBits'][0] = 0
            v['rngState'] += 7
            return dict(result=0 if stage.endswith('377') else -1, count=2)
        t = self.check_oracle(f, effect=effect)
        self.assertEqual(t['nativeResult'], 14000)
        self.assertEqual(t['rng']['observedCalls'], 4)
        self.assertEqual(t['rng']['finalState'], 22)
        records = t['observedEffects']
        self.assertEqual(records[0]['callStack'][-1]['locals']['savedForceId'], 0)
        self.assertEqual(records[1]['callStack'][-1]['locals']['savedCapacity'], 12000)

    def test_09_left_capacity_saved_live_fields_after_right_callback(self):
        for leader, equal in itertools.product((False, True), (False, True)):
            f = fixture(source='S2', leader=leader, candidates=[9, 7])
            w = f[0]['frame']; row(w, 9).update(status=3, officeId=20)
            row(w, 20, 'offices')['capacityWord'] = 9500 if equal else 10000
            def effect(stage, v, c):
                if stage == 'capacity-query278' and c['args']['personId'] == 7:
                    row(v, 20, 'offices')['capacityWord'] = 0
                    row(v, 9).update(officeId=80, leadershipByte=1, strengthByte=1)
                    row(v, 7).update(officeId=0, leadershipByte=250, strengthByte=250)
                return dict(result=0, count=1)
            t = self.check_oracle(f, effect=effect)
            self.assertEqual(t['nativeResult'], [7, 9] if equal else [9, 7])
            right = next(r for r in t['observedEffects'] if r['args']['personId'] == 7)
            compare = next(s for s in right['callStack'] if s['helper'] in ('004CEF90', '004CF160'))
            self.assertEqual(compare['locals']['savedLeftCapacity'], 9500 if equal else 10000)

    def test_10_allocation_postfilter_copied_candidates_survive_mutation(self):
        for leader in (False, True):
            f = fixture(source='S2', leader=leader, candidates=[9, 7, 9])
            row(f[0]['frame'], 9)['status'] = 3
            def effect(stage, v, c):
                if stage == 'capacity-query278':
                    row(v, 9).update(status=9, rawDword17C=0)
                    row(v, 0, 'buildings')['homeRosterIds'] = [403]
                    row(v, 0, 'legions')['rosterIds'] = [403]
                    v['activePersonIds'] = [403]
                return dict(result=0, count=0)
            t = self.check_oracle(f, effect=effect)
            self.assertEqual(t['nativeResult'], [7])
            self.assertEqual(t['after']['frame']['activePersonIds'], [403])
            first = [s['personId'] for s in t['steps'] if s['helper'] == '004AA200/first-filter']
            self.assertEqual(first, [9, 7, 9])
            self.assertEqual(len([s for s in t['steps'] if s['helper'] == '004AA200/second-filter']), 3)

    def test_11_base_hook_changes_status_and_preserves_saved_base(self):
        for status in (0, 6, 9):
            f = fixture('capacity', 'S2')
            def effect(stage, v, c):
                if stage == 'capacity-query377': row(v)['status'] = status
                return dict(result=1, count=None)
            t = self.check_oracle(f, effect=effect)
            self.assertEqual(t['nativeResult'], 17000 if status == 0 else 12000)
            self.assertEqual(len(t['observedEffects']), 2 if status == 0 else 1)
            self.assertFalse(t['rng']['allCountsKnown'])
            self.assertIsNone(t['rng']['observedCalls'])

    def test_12_randomized_static_sort_and_capacity_oracle(self):
        rng = random.Random(0x630042)
        for index in range(100):
            source = ('S1', 'S2')[index % 2]
            leader = bool(index % 3)
            ids = [7, 9, 11, 12, 14, 403]
            candidates = [rng.choice(ids) for _ in range(rng.randrange(9))]
            f = fixture(source=source, leader=leader, candidates=candidates)
            w = f[0]['frame']
            w['persons'] = [person(pid, status=rng.choice([-1, 0, 1, 2, 3, 5, 6, 8, 9]),
                rawDword17C=rng.choice([0, 0, 1]), officeId=rng.choice([-1, 0, 10, 20, 44, 80, 81]),
                leadershipByte=rng.randrange(256), strengthByte=rng.randrange(256),
                rawWordAE=rng.randrange(65536), rawDword54=rng.choice([7, 403])) for pid in ids]
            row(w, 0, 'forces').update(raw40=rng.choice([0, 5]), titleId=rng.choice([-1, 0, 4, 9, 10]),
                                     techniqueBits=[rng.getrandbits(32), rng.getrandbits(32)])
            for table in ('offices', 'titles'):
                for r in w[table]:
                    r.update(capacityWord=rng.randrange(65536))
            with self.subTest(index=index): self.check_oracle(f, replay=False)

    def test_13_randomized_mutable_callback_oracle(self):
        rng = random.Random(630377278)
        for index in range(128):
            f = fixture(source='S2', leader=bool(index % 2), candidates=[9, 7, 9, 11, 7])
            w = f[0]['frame']; row(w, 9)['status'] = 3
            w['persons'].append(person(11, officeId=20))
            draws = [(rng.randrange(3), rng.randrange(256), rng.randrange(65536), rng.choice([0, 0, -1])) for _ in range(100)]
            def effect(stage, v, c):
                choice, ability, capacity, answer = draws[c['index']]
                pid = c['args']['personId']
                row(v, pid)['leadershipByte'] = ability
                row(v, pid)['strengthByte'] = 255-ability
                row(v, 10, 'offices')['capacityWord'] = capacity
                force = row(v, 0, 'forces')
                force['techniqueBits'][0] ^= 1 << 3
                if index % 3 == 0:
                    row(v, pid).update(status=(0, 3, 6, 8, 9)[ability % 5],
                                       rawDword17C=choice % 2)
                if index % 5 == 0:
                    force.update(valid=bool(choice), raw40=5 if ability % 2 else 0)
                    row(v, pid)['rawLegionId'] = -1 if ability % 4 == 0 else 0
                v['data']['nested']['value'] = choice
                v['rngState'] = (v['rngState'] * 1664525 + 1013904223) & 0xffffffff
                return dict(result=answer, count=choice)
            with self.subTest(index=index): self.check_oracle(f, replay=False, allow_unsafe=True, effect=effect)

    def test_14_nested_event_return_role_sort_single_transaction(self):
        for source in ('S1', 'S2'):
            f = fixture('event', source)
            w = f[0]['frame']; w['activePersonIds'] = [7, 7, 9]
            row(w, 9).update(status=3, officeId=20)
            row(w, 0, 'buildings').update(homeRosterIds=[9, 7, 7, 9], governorId=9)
            row(w, 0, 'legions')['rosterIds'] = [9, 7, 9, 7]
            t = self.check_oracle(f)
            self.assertEqual(t['returnCalls'], 1)
            self.assertGreater(len(t['events']), 1)
            self.assertEqual(t['after']['revision'], 1)
            self.assertEqual(t['events'][0]['visits'][1]['route'], 'mission-range-skip')
            self.assertIn('0047CD50/cache-key', [s['helper'] for s in t['steps']])
            self.assertIn('004AA200/native-result', [s['helper'] for s in t['steps']])
            if source == 'S2':
                r = next(r for r in t['observedEffects'] if r['args'].get('queryId') == 377)
                scopes = [s['helper'] for s in r['callStack']]
                self.assertIn('004BBAA0', scopes)
                self.assertIn('004BF6F0', scopes)
                self.assertIn('004BE2A0', scopes)

    def test_15_governor_caller_copies_survive_capacity_hooks(self):
        f = fixture('governor', 'S2')
        w = f[0]['frame']; w['activePersonIds'] = []
        row(w, 9).update(status=3, homeBaseId=0, locationId=0, officeId=0)
        row(w, 0, 'buildings')['homeRosterIds'] = [7, 9, 7]
        def effect(stage, v, c):
            if stage.startswith('capacity-query'):
                row(v, 0, 'buildings')['homeRosterIds'] = [403]
                v['activePersonIds'] = [403]
            return dict(result=0, count=0) if stage.startswith('capacity-query') else 0
        t = self.check_oracle(f, effect=effect)
        self.assertEqual(row(t['after']['frame'], 0, 'buildings')['governorId'], 9)
        self.assertEqual(row(t['after']['frame'], 0, 'buildings')['homeRosterIds'], [403])
        native = next(s for s in t['steps'] if s['helper'] == '004AA200/native-result')
        self.assertEqual(native['candidateIds'], [7, 9, 7])

    def test_16_observations_required_exact_binding_and_order(self):
        base = fixture(source='S2'); Oracle(base).run()
        self.assertTrue(base[2]['records'])
        mutations = [
            lambda f: f[2]['records'].pop(),
            lambda f: f[2]['records'].append(copy.deepcopy(f[2]['records'][-1])),
            lambda f: f[2]['records'][0]['args'].update(queryId=278),
            lambda f: f[2]['records'][0]['args'].update(personId=7),
            lambda f: f[2]['records'][0]['callStack'][-1]['locals'].update(savedForceId=1),
            lambda f: f[2]['records'][0]['before'].update(rngState=99),
            lambda f: f[2]['records'][0].update(source='S1'),
            lambda f: f[2]['records'][0].update(result=True),
            lambda f: f[2]['records'][0].update(result=2**31),
            lambda f: f[2]['records'][0]['after']['offices'].pop(),
            lambda f: f[2]['records'][0]['after']['forces'][0].update(extra=1),
            lambda f: f[2]['records'][0]['after']['data'].update(newKey=1),
            lambda f: f[2]['records'][0]['rngConsumption'].update(calls=-1),
        ]
        for mutation in mutations:
            f = copy.deepcopy(base); mutation(f)
            self.atomic_error(f)
        f = copy.deepcopy(base); f[2]['records'][0], f[2]['records'][1] = f[2]['records'][1], f[2]['records'][0]
        for i, r in enumerate(f[2]['records']): r['index'] = i
        self.atomic_error(f)
        f = fixture(source='S2'); self.atomic_error(f)
        f = copy.deepcopy(base); f[3]['unknownEffects'] = 'reject'
        self.atomic_defer(f, 'unresolved-effect:004890F0')

    def test_17_frame_domain_strictness_and_no_implicit_upgrade(self):
        mutations = [
            lambda f: f[0]['frame']['persons'][0].pop('rawDword54'),
            lambda f: f[0]['frame']['persons'][0].update(rawDword54=-1),
            lambda f: f[0]['frame']['persons'][0].update(rawDword54=2**32),
            lambda f: f[0]['frame']['persons'][0].update(status=9),
            lambda f: f[0]['frame']['forces'][0].update(techniqueBits=[0]),
            lambda f: f[0]['frame']['forces'][0].update(techniqueBits=[0, 2**32]),
            lambda f: f[0]['frame']['forces'][0].update(titleId=True),
            lambda f: f[0]['frame']['offices'][0].update(capacityWord=65536),
            lambda f: f[0]['frame']['offices'][0].update(valid=False),
            lambda f: f[0]['frame']['titles'][0].update(valid=False),
            lambda f: f[0]['frame']['titles'].append(copy.deepcopy(f[0]['frame']['titles'][0])),
            lambda f: f[0]['frame']['offices'][0].update(id=81),
            lambda f: f[3].update(frameProfile='source-idb-S1-S2-recursive-return-frame-v1'),
            lambda f: f[3].update(sortDomain='generic-sort'),
            lambda f: f[3].pop('nativePlatform'),
            lambda f: f[3].update(nativePlatform='arbitrary-runtime-hooks'),
            lambda f: f[3]['engineGuard'].pop('maxSortDepth'),
            lambda f: f[1]['args'].update(leader=1),
            lambda f: f[1]['args'].update(candidateIds=[100]),
        ]
        for mutation in mutations:
            f = fixture(); mutation(f); self.atomic_error(f)
        f = fixture('capacity'); f[0]['frame']['offices'] = []
        self.atomic_error(f)

    def test_18_engine_guards_are_atomic(self):
        f = fixture(leader=False, candidates=[7, 9, 7, 9])
        f[3]['engineGuard']['maxSortDepth'] = 1
        self.atomic_defer(f, 'engine-guard-sort-depth')
        f = fixture(); f[3]['engineGuard']['maxNativeCalls'] = 1
        self.atomic_defer(f, 'engine-guard-native-call-budget')
        f = fixture('event'); row(f[0]['frame'], 0, 'buildings')['governorId'] = 9
        f[3]['engineGuard']['maxEventDepth'] = 1
        Oracle(f).run()
        self.atomic_defer(f, 'engine-guard-event-depth')
        for depth in (0, 129, True):
            f = fixture(); f[3]['engineGuard']['maxSortDepth'] = depth
            self.atomic_error(f)
        # Tail iteration must not consume extra recursive sort depth.
        f = fixture(candidates=[9, 7]); f[3]['engineGuard']['maxSortDepth'] = 1
        self.check_oracle(f)

    def test_19_idempotence_revision_and_payload_conflict(self):
        f = fixture(source='S2'); t = self.check_oracle(f)
        again = copy.deepcopy(f); again[0] = t['after']
        replay = run(again)
        self.assertTrue(replay['accepted']); self.assertTrue(replay['replayed'])
        self.assertEqual(replay['after'], t['after']); self.assertEqual(replay['steps'], [])
        again[1]['args']['leader'] = False
        self.atomic_defer(again, 'replay-payload-conflict')
        f = fixture(); f[1]['expectedRevision'] = 7
        self.atomic_defer(f, 'revision-conflict')
        f = fixture(); f[0]['revision'] = f[1]['expectedRevision'] = 2**31-1
        self.atomic_error(f)

    def test_20_trace_tamper_and_rehash_are_detected(self):
        f = fixture(source='S2'); t = self.check_oracle(f)
        for rehash, field in itertools.product((False, True), ('result', 'frame', 'order', 'rng', 'evidence')):
            changed = copy.deepcopy(t)
            if field == 'result': changed['nativeResult'].reverse()
            elif field == 'frame': changed['after']['frame']['rngState'] += 1
            elif field == 'order': changed['steps'].reverse()
            elif field == 'rng': changed['rng']['observedCalls'] += 1
            else: changed['evidence']['stockVerified'] = True
            if rehash:
                changed.pop('traceHash'); changed['traceHash'] = digest(changed)
            with self.assertRaises(ValueError): m.replay_native_roster_sort(changed)

    def test_21_oracle_is_independent_and_old_api_retains_boundaries(self):
        import native_sort_primitives as production_primitives
        import recursive_officer_return_profile as previous
        from check_recursive_officer_return_profile import Oracle as OldOracle
        f = fixture(source='S2')
        with patch.object(m, '_Planner', side_effect=AssertionError('production planner used by oracle')), \
             patch.object(production_primitives, 'quicksort_native', side_effect=AssertionError('production quicksort used')), \
             patch.object(production_primitives, 'mergesort_native', side_effect=AssertionError('production mergesort used')), \
             patch.object(production_primitives.NativeSortPrimitives, 'capacity', side_effect=AssertionError('production capacity used')):
            Oracle(f).run()
        self.assertTrue(run(f)['accepted'])
        old = recursive_fixture('return')
        row(old[0]['frame'], 0, 'buildings')['homeRosterIds'] = [9, 7]
        OldOracle(old).run()
        trace = previous.project_recursive_officer_return(*old)
        self.assertTrue(trace['accepted'])
        self.assertIn('0047CD50', [r['helper'] for r in trace['observedEffects']])
        self.assertEqual(trace, previous.replay_recursive_officer_return(trace))
        with self.assertRaises(ValueError): previous.project_recursive_officer_return(*fixture('return'))
        with self.assertRaises(ValueError): m.project_native_roster_sort(*old)


    def test_22_golden_native_partition_and_merge_callback_order(self):
        golden = {
            True: [(12, 7), (7, 9), (7, 11), (12, 7), (12, 11), (11, 9)],
            False: [(12, 7), (11, 9), (7, 9), (12, 9), (12, 11)],
        }
        for leader in (False, True):
            f = fixture(source='S2', leader=leader, candidates=[12, 7, 11, 9])
            w = f[0]['frame']
            row(w, 9).update(status=3, homeBaseId=0, locationId=0)
            w['persons'].extend([person(11), person(12)])
            t = self.check_oracle(f)
            comparisons = [s for s in t['steps'] if s['helper'] == ('004CEF90/result' if leader else '004CF160/result')]
            pairs = [(s['callStack'][-1]['locals']['left'], s['callStack'][-1]['locals']['right']) for s in comparisons]
            self.assertEqual(pairs, golden[leader])
            expected_hooks = [(pid, query) for a, b in golden[leader] for pid in (a, b) for query in (377, 278)]
            self.assertEqual([(r['args']['personId'], r['args']['queryId']) for r in t['observedEffects']], expected_hooks)
            self.assertEqual(t['nativeResult'], [7, 9, 11, 12])
        f = fixture('roster-sort')
        row(f[0]['frame'], 0, 'buildings')['homeRosterIds'] = [7, 7, 7]
        t = self.check_oracle(f)
        pairs = [(s['callStack'][-1]['locals']['left']['occurrence'], s['callStack'][-1]['locals']['right']['occurrence'])
                 for s in t['steps'] if s['helper'] == '004A6960/result']
        self.assertEqual(pairs, [(0, 1), (1, 2)])
        end = next(s for s in t['steps'] if s['helper'] == '0047CD50/return')
        self.assertEqual([e['occurrence'] for e in end['sortedEntries']], [2, 1, 0])

    def test_23_invalid_force_bonus_hook_and_live_status_priority(self):
        for source in ('S1', 'S2'):
            f = fixture('capacity', source)
            row(f[0]['frame'], 0, 'forces')['valid'] = False
            def effect(stage, w, c): return dict(result=-1, count=0)
            t = self.check_oracle(f, effect=effect)
            self.assertEqual(t['nativeResult'], 2000 if source == 'S2' else 0)
            self.assertEqual([r['args']['queryId'] for r in t['observedEffects']], [278] if source == 'S2' else [])
        for leader in (False, True):
            f = fixture(source='S2', leader=leader, candidates=[9, 7])
            row(f[0]['frame'], 9)['status'] = 3
            def effect(stage, w, c):
                if stage == 'capacity-query278' and c['args']['personId'] == 7:
                    row(w, 9).update(status=0, officeId=80, leadershipByte=0)
                    row(w, 7).update(status=3, officeId=0, leadershipByte=255)
                return dict(result=0, count=0)
            t = self.check_oracle(f, effect=effect)
            # Comparator's ruler/status priority was already evaluated before
            # callbacks. The newly-ruler left loses on live tie-break fields.
            self.assertEqual(t['nativeResult'], [7, 9])

    def test_24_legion_saved_leader_and_promotion_revalidates_pointer(self):
        for invalid_status in (6, 8):
            f = fixture('legion', 'S2')
            w = f[0]['frame']; w['activePersonIds'] = []
            row(w, 0, 'legions')['leaderId'] = 9
            row(w, 9).update(status=1, locationId=999)
            row(w).update(status=3, locationId=999)
            def effect(stage, v, c):
                if stage == 'capacity-query278' and c['args']['personId'] == 9:
                    row(v).update(status=invalid_status, rawDword17C=0)
                    row(v, 0, 'legions')['leaderId'] = 403
                return dict(result=0, count=0) if stage.startswith('capacity-query') else 0
            t = self.check_oracle(f, effect=effect)
            self.assertEqual(row(t['after']['frame'], 0, 'legions')['leaderId'], 7)
            self.assertEqual(row(t['after']['frame'])['status'], 1)
            self.assertTrue(row(t['after']['frame'])['valid'])
            self.assertEqual(row(t['after']['frame'], 9)['status'], 3)
            self.assertIn(14, [event['event']['id'] for event in t['events']])


    def test_25_query377_reloads_live_status_title_office_values(self):
        for before_ruler, after_ruler in itertools.product((False, True), repeat=2):
            f = fixture('capacity', 'S2')
            row(f[0]['frame'])['status'] = 0 if before_ruler else 3
            def effect(stage, v, c):
                if stage == 'capacity-query377':
                    row(v).update(status=0 if after_ruler else 3, officeId=20)
                    row(v, 0, 'forces')['titleId'] = 9
                    row(v, 9, 'titles')['capacityWord'] = 12345
                    row(v, 20, 'offices')['capacityWord'] = 54321
                return dict(result=0, count=0)
            t = self.check_oracle(f, effect=effect)
            self.assertEqual(t['nativeResult'], 12345 if after_ruler else 54321)
            read = next(s for s in t['steps'] if s['helper'] == '0049D420/table-read')
            self.assertEqual((read['table'], read['recordId']), ('titles', 9) if after_ruler else ('offices', 20))

    def test_26_saved_left_low16_survives_right_mutation(self):
        for leader in (False, True):
            f = fixture(source='S2', leader=leader, candidates=[9, 7])
            w = f[0]['frame']
            row(w, 9).update(status=3, officeId=20)
            row(w, 20, 'offices')['capacityWord'] = 65535
            row(w, 10, 'offices')['capacityWord'] = 0
            row(w, 0, 'forces')['techniqueBits'][0] = 1 << 3
            def effect(stage, v, c):
                if stage == 'capacity-query377' and c['args']['personId'] == 7:
                    row(v, 20, 'offices')['capacityWord'] = 40000
                return dict(result=0, count=0)
            t = self.check_oracle(f, effect=effect)
            self.assertEqual(t['nativeResult'], [7, 9])
            comparison = next(s for s in t['steps'] if s['helper'] in ('004CEF90/result', '004CF160/result'))
            self.assertEqual(comparison['callStack'][-1]['locals']['savedLeftCapacity'], 2999)
            self.assertFalse(comparison['result'])



    def test_27_mutable_partition_escape_is_atomic_not_negative_indexing(self):
        f = fixture(source='S2', leader=True, candidates=[7, 9, 11, 12])
        w = f[0]['frame']
        row(w, 9).update(status=3)
        w['persons'].extend([person(11), person(12)])
        # Pivot9 first moves to index3. A reversed live relation then scans
        # rightward elements from index2 through index0 and attempts index-1.
        choices = [True, False, True, True, True, True]
        def effect(stage, v, c):
            compare_index, callback = divmod(c['index'], 4)
            if stage == 'capacity-query377':
                left = callback == 0
                high = left == choices[compare_index]
                row(v, 10, 'offices')['capacityWord'] = 10000 if high else 1000
            v['rngState'] += 1
            return dict(result=0, count=1)
        oracle = Oracle(f, effect=effect)
        with self.assertRaises(OracleArrayReadError) as error: oracle.run()
        self.assertEqual(error.exception.args, (-1,))
        self.assertEqual([(a, b) for helper, a, b in oracle.comparisons],
                         [(7, 9), (9, 12), (11, 9), (9, 11), (9, 12), (9, 7)])
        self.assertEqual(len(oracle.records), 24)
        self.assertEqual(oracle.w['rngState'], 32)
        f[2]['records'] = copy.deepcopy(oracle.records)
        t = self.atomic_defer(f, 'unsupported-native-sort-array-read')
        self.assertEqual(t['observedEffects'], oracle.records)
        self.assertEqual(t['after']['frame']['rngState'], 8)
        self.assertEqual(t['after']['revision'], 0)
        self.assertEqual(t['after']['appliedCommands'], [])
        self.assertIsNone(t['nativeResult'])



    def test_28_direct_roster_receiver_is_canonical_before_any_sort(self):
        for source in ('S1', 'S2'):
            for bid, kind in ((0, 0), (42, 1), (52, 2)):
                f = fixture('roster-sort', source); w = f[0]['frame']
                if bid == 52:
                    b = copy.deepcopy(row(w, 42, 'buildings')); b.update(id=52, kind=2)
                    w['buildings'].append(b)
                b = row(w, bid, 'buildings'); b['homeRosterIds'] = [9, 7, 9]
                f[1]['args']['targetId'] = bid
                t = self.check_oracle(f)
                self.assertEqual(row(t['after']['frame'], bid, 'buildings')['homeRosterIds'], [7, 9, 9])
            cases = ((0, 5, True), (42, 0, True), (16383, 0, True),
                     (0, 0, False), (42, 1, False))
            for (bid, kind, subtype), roster in itertools.product(cases, ([], [9], [9, 7])):
                f = fixture('roster-sort', source); w = f[0]['frame']
                b = row(w, bid, 'buildings')
                b.update(kind=kind, subtypeValid=subtype, homeRosterIds=list(roster))
                if bid <= 41: row(w, bid, 'cities')['valid'] = subtype
                f[1]['args']['targetId'] = bid
                with self.subTest(source=source, bid=bid, kind=kind, subtype=subtype, roster=roster):
                    with self.assertRaises(ValueError): Oracle(copy.deepcopy(f)).run()
                    t = self.atomic_defer(f, 'unsupported-noncanonical-building-roster')
                    self.assertEqual(t['nativeCalls'], 0)
                    self.assertIsNone(t['nativeResult'])
                    self.assertEqual(t['observedEffects'], [])


if __name__ == '__main__':
    unittest.main()
