"""P0-58 stable role scalar projection: source gates, ordering and independent oracles.

The oracle uses pairwise source comparator decisions and a separate transition
interpreter. It does not call the production planner, ranking, or predicates.
Observed capacities intentionally are stage-bound returns, not a reimplementation
of the different S1/S2 capacity calculators or their unexecuted query hooks.
"""
import copy
import hashlib
import itertools
import json
import random
import unittest
from unittest.mock import patch
import legion_role_reconciliation_profile as m


def person(pid=7, **kw):
    p = dict(id=pid, allocated=True, valid=True, status=3, homeBaseId=0,
             locationId=0, rawLegionId=1, officeId=10, leadershipByte=70,
             strengthByte=60, rawWordAE=500, flags124=0x80000301,
             missionId=37, missionArgs=[500, -11, 22, 33, 44], missionDuration=9)
    p.update(kw)
    return p


def building(bid=0, **kw):
    b = dict(id=bid, valid=True, subtypeValid=bid <= 86,
             legionId=1 if bid <= 86 else -1, governorId=-1, homeRosterIds=[])
    b.update(kw)
    return b


def fixture(source='S1', entry='legion'):
    state = dict(source=source, revision=0, appliedCommands=[], rngState=0x12345678,
                 persons=[person()], buildings=[building(homeRosterIds=[7])],
                 legions=[dict(id=1, valid=True, forceId=0, leaderId=-1)],
                 forces=[dict(id=0, valid=True, advisorId=1099)])
    command = dict(id='roles-1', expectedRevision=0, entry=entry,
                   targetId=1 if entry == 'legion' else 0, refreshFlag=0)
    observations = dict(source=source, provenance='synthetic source-bound observed helper returns',
                        capacities=[], routedMissions=[dict(personId=7, hasRoute=False)])
    policy = dict(id='record-stable-roles-v1', ruleset='PC-PK1.1', unknownEffects='record-only',
                  provenance='bounded scalar projection', callbackAssumption='noninterference-v1',
                  pointerDomain='complete-sparse-canonical-arrays-v1',
                  listAssumption='successful-temporary-lists-v1')
    return [state, command, observations, policy]


def run(f):
    return m.project_legion_roles(*f)


def row(state, table, rid):
    return next(r for r in state[table] if r['id'] == rid)


def events(t):
    return [e for e in t['unknownEffects'] if 'eventId' in e]


def writes(t, table=None, field=None, rid=None):
    return [s for s in t['steps'] if 'table' in s and
            (table is None or s['table'] == table) and
            (field is None or s['field'] == field) and (rid is None or s['id'] == rid)]


def add_person(f, p, roster=0, route=False):
    f[0]['persons'].append(p)
    f[2]['routedMissions'].append(dict(personId=p['id'], hasRoute=route))
    if roster is not None:
        row(f[0], 'buildings', roster)['homeRosterIds'].append(p['id'])
    return p


def capacities(f, stage, values):
    f[2]['capacities'].extend(dict(stage=stage, personId=pid, value=value) for pid, value in values.items())


def digest(value):
    return hashlib.sha256(json.dumps(value, sort_keys=True, separators=(',', ':'), ensure_ascii=False).encode()).hexdigest()


def oracle(f):
    """Independent scalar interpreter; production functions are never used here."""
    state, command, observed, _ = copy.deepcopy(f)
    original = copy.deepcopy(state)
    persons = {p['id']: p for p in state['persons']}
    bases = {b['id']: b for b in state['buildings']}
    corps = {l['id']: l for l in state['legions']}
    forces = {a['id']: a for a in state['forces']}
    routes = {o['personId']: o['hasRoute'] for o in observed['routedMissions']}
    caps = {(o['stage'], o['personId']): o['value'] % 65536 for o in observed['capacities']}
    emitted, passes, ranked = [], [], []

    def exists(r):
        return bool(r is not None and r['valid'])

    def subtype(b):
        return b is not None and b['id'] in range(87) and b['subtypeValid']

    def governor_id(b):
        return b['governorId'] if subtype(b) else -1

    def legion_id(b):
        return b['legionId'] if subtype(b) else -1

    def home(p):
        normalized = p['homeBaseId'] if p['homeBaseId'] in range(87) else -1
        if p['locationId'] != normalized or routes[p['id']]:
            return False
        b = bases.get(p['homeBaseId'])
        return exists(b) and legion_id(b) == p['rawLegionId']

    def before(a, b, stage, is_leader):
        # Pairwise decisions follow the branch order, rather than a sort key.
        if is_leader and (a['status'] == 0) != (b['status'] == 0):
            return a['status'] == 0
        ac, bc = caps[stage, a['id']], caps[stage, b['id']]
        if ac != bc:
            return ac > bc
        if is_leader and a['officeId'] != b['officeId']:
            return a['officeId'] < b['officeId']
        if a['leadershipByte'] != b['leadershipByte']:
            return a['leadershipByte'] > b['leadershipByte']
        if not is_leader:
            if a['strengthByte'] != b['strengthByte']:
                return a['strengthByte'] > b['strengthByte']
            if a['rawWordAE'] != b['rawWordAE']:
                return a['rawWordAE'] > b['rawWordAE']
        return a['id'] < b['id']

    def order(candidates, stage, leader):
        if len(candidates) < 2:
            return candidates[:]
        if any(not p['valid'] for p in candidates):
            raise RuntimeError('unsupported-invalid-ranking-candidate')
        ordered = []
        for p in candidates:
            i = 0
            while i < len(ordered) and not before(p, ordered[i], stage, leader):
                i += 1
            ordered.insert(i, p)
        return ordered

    def event(eid, kind, rid):
        emitted.append((eid, kind, rid, copy.deepcopy(state)))

    def assign(b, selected):
        if not exists(b) or (selected is not None and not exists(selected)):
            return
        old = persons.get(governor_id(b))
        new = selected['id'] if selected is not None else -1
        if exists(old) and old['id'] != new:
            event(8, 'person', old['id'])
        if subtype(b):
            b['governorId'] = new

    def govern(bid):
        b = bases.get(bid)
        if not exists(b):
            return
        candidates = []
        for pid in b['homeRosterIds'] if subtype(b) else []:
            p = persons.get(pid)
            if p is not None and p['allocated'] and p['status'] in (0, 1, 2, 3):
                if p['rawLegionId'] == legion_id(b) and home(p):
                    candidates.append(p)
        selected = None
        for p in candidates:
            if p['status'] <= 1:
                selected = p
        if selected is None and candidates:
            selected = order(candidates, 'governor:' + str(bid), False)[0]
        passes.append((bid, [p['id'] for p in candidates], selected['id'] if selected else -1))
        old = persons.get(governor_id(b))
        if exists(old) and old['status'] == 2:
            oldhome = bases.get(old['homeBaseId'])
            if old['homeBaseId'] == bid or (exists(oldhome) and governor_id(oldhome) != old['id']):
                old['status'] = 3
        if exists(selected):
            if selected['status'] not in (0, 1):
                selected['status'] = 2
            assign(b, selected)
        else:
            assign(b, None)
            event(14, 'building', bid)

    reason = 'roles'
    try:
        if command['entry'] == 'governor':
            if not exists(bases.get(command['targetId'])):
                reason = 'invalid-building-no-op'
            elif command['refreshFlag']:
                raise RuntimeError('unsupported-governor-refresh')
            else:
                govern(command['targetId'])
        else:
            lid = command['targetId']
            legion = corps.get(lid)
            if not exists(legion):
                reason = 'invalid-legion-no-op'
            elif legion['forceId'] not in range(42):
                reason = 'non-normal-force-no-op'
            else:
                fid = legion['forceId']
                members = [p for p in persons.values() if p['allocated'] and p['status'] in (0, 1, 2, 3)
                           and exists(corps.get(p['rawLegionId'])) and corps[p['rawLegionId']]['forceId'] == fid]
                cities = [b for b in bases.values() if b['id'] in range(42) and subtype(b)]
                owned = [b for b in cities if exists(corps.get(b['legionId'])) and corps[b['legionId']]['forceId'] == fid]
                if not exists(forces.get(fid)) or not members or not owned:
                    raise RuntimeError('unsupported-force-extinction')
                candidates = [p for p in persons.values() if p['valid'] and p['rawLegionId'] == lid]
                if not candidates or not any(b['legionId'] == lid for b in cities):
                    raise RuntimeError('unsupported-empty-legion-redistribution')
                selected_order = order(candidates, 'leader', True)
                ranked = [p['id'] for p in selected_order]
                selected = selected_order[0]
                old = persons.get(legion['leaderId'])
                if exists(old) and old['status'] == 1:
                    b = bases.get(old['homeBaseId'])
                    if old['homeBaseId'] != selected['homeBaseId'] and home(old) and exists(b) and governor_id(b) == old['id']:
                        old['status'] = 2
                    else:
                        if exists(b) and governor_id(b) == old['id']:
                            assign(b, None)
                        old['status'] = 3
                if selected['status'] != 0:
                    selected['status'] = 1
                    if home(selected):
                        b = bases.get(selected['homeBaseId'])
                        oldgov = persons.get(governor_id(b))
                        if exists(oldgov) and oldgov['status'] == 2 and oldgov['id'] != selected['id']:
                            oldgov['status'] = 3
                        assign(b, selected)
                legion['leaderId'] = selected['id']
                for bid in range(87):
                    if subtype(bases.get(bid)) and legion_id(bases[bid]) == lid:
                        govern(bid)
    except RuntimeError as exc:
        return str(exc), original, [], [], []
    state['revision'] += 1
    state['appliedCommands'].append(dict(id=command['id'], sha256=digest(command)))
    return reason, state, emitted, passes, ranked


class StableRoles(unittest.TestCase):
    def assert_atomic(self, f, reason):
        before = copy.deepcopy(f)
        t = run(f)
        self.assertEqual(f, before)
        self.assertFalse(t['accepted'])
        self.assertEqual(t['reason'], reason)
        self.assertEqual(t['after'], f[0])
        self.assertEqual(t['steps'], [])
        return t

    def test_minimal_sources_scalar_contract_and_immutable_inputs(self):
        for source, entry in itertools.product(('S1', 'S2'), ('legion', 'governor')):
            f = fixture(source, entry); before = copy.deepcopy(f); t = run(f)
            self.assertTrue(t['accepted']); self.assertEqual(f, before)
            self.assertEqual(row(t['after'], 'persons', 7)['status'], 1 if entry == 'legion' else 2)
            self.assertEqual(row(t['after'], 'buildings', 0)['governorId'], 7)
            self.assertEqual(t['after']['forces'], f[0]['forces'])
            for old in f[0]['persons']:
                for key, value in old.items():
                    if key != 'status': self.assertEqual(row(t['after'], 'persons', old['id'])[key], value)
            self.assertEqual(t['rng'], dict(kind='zero-local-calls', initialState=0x12345678,
                finalState=0x12345678, calls=[], consumed=0, unexecutedCallbacksCovered=False))
            self.assertEqual(t, m.replay_legion_roles(json.loads(json.dumps(t))))
            for flag in ('stockVerified', 'vanillaVerified', 'callbacksExecuted', 'fullReturnExecuted',
                         'completeGameTransaction', 'advisorReconciled', 'capacityCalculatorExecuted',
                         'routeResolverExecuted', 'temporaryListMachineCodeExecuted'):
                self.assertFalse(t['evidence'][flag])
            self.assertTrue(t['evidence']['sourceLocalOnly']); self.assertTrue(t['evidence']['stableRoleScalarsOnly'])

    def test_legion_leader_comparator_every_tie_break_and_irrelevant_fields(self):
        cases = [({'status': 0}, {'status': 1}, 1, 65535, 7),
                 ({}, {}, 101, 100, 7),
                 ({'officeId': -2**31}, {'officeId': 2**31-1}, 100, 100, 7),
                 ({'leadershipByte': 255}, {'leadershipByte': 0}, 100, 100, 7),
                 ({'strengthByte': 0, 'rawWordAE': 0}, {'strengthByte': 255, 'rawWordAE': 65535}, 100, 100, 7),
                 ({'status': 7}, {'status': 1}, 101, 100, 7)]
        for a, b, ca, cb, expected in cases:
            for source in ('S1', 'S2'):
                f = fixture(source); f[0]['persons'][0].update(a)
                add_person(f, person(8, **b)); capacities(f, 'leader', {7: ca, 8: cb})
                t = run(f); self.assertEqual(t['plan']['selectedLeaderId'], expected)
                self.assertEqual(t['plan']['leaderCandidates'], [7, 8])
                # Input array order is not the canonical pointer order.
                f[0]['persons'].reverse(); self.assertEqual(run(f)['plan']['leaderCandidates'], [7, 8])

    def test_governor_comparator_ignores_office_and_status2_vs3(self):
        cases = [({'status': 3}, {'status': 2}, 101, 100),
                 ({'leadershipByte': 255}, {'leadershipByte': 254}, 100, 100),
                 ({'strengthByte': 255}, {'strengthByte': 254}, 100, 100),
                 ({'rawWordAE': 65535}, {'rawWordAE': 65534}, 100, 100),
                 ({'officeId': 2**31-1}, {'officeId': -2**31}, 100, 100)]
        for a, b, ca, cb in cases:
            f = fixture(entry='governor'); f[0]['persons'][0].update(a)
            add_person(f, person(8, **b)); capacities(f, 'governor:0', {7: ca, 8: cb})
            f[0]['buildings'][0]['homeRosterIds'] = [8, 7]
            self.assertEqual(run(f)['plan']['governorPasses'][0]['selectedId'], 7)

    def test_rank_capacity_is_unsigned_low_word_for_both_entries(self):
        for entry, ca, cb in itertools.product(('legion', 'governor'), (-1, -65536, 65536, 65537, 2**31-1, -2**31), (0, 65535)):
            f = fixture(entry=entry); add_person(f, person(8))
            stage = 'leader' if entry == 'legion' else 'governor:0'
            capacities(f, stage, {7: ca, 8: cb}); t = run(f)
            winner = 7 if ca % 65536 >= cb % 65536 else 8
            actual = t['plan']['selectedLeaderId'] if entry == 'legion' else t['plan']['governorPasses'][0]['selectedId']
            self.assertEqual(actual, winner)
            ledger = next(e for e in t['unknownEffects'] if e['helper'] == '0048A4F0')
            self.assertEqual(ledger['stage'], stage)
            self.assertEqual(ledger['inputs'], [dict(personId=7, returnedDword=ca, capacity16=ca % 65536),
                                                dict(personId=8, returnedDword=cb, capacity16=cb % 65536)])

    def test_status_shortcut_is_last_roster_node_not_ranked_or_first(self):
        for order in itertools.permutations([7, 8, 9]):
            f = fixture(entry='governor'); f[0]['persons'][0]['status'] = 0
            add_person(f, person(8, status=1)); add_person(f, person(9, status=3))
            f[0]['buildings'][0]['homeRosterIds'] = list(order)
            t = run(f); selected = [pid for pid in order if pid != 9][-1]
            self.assertEqual(t['plan']['governorPasses'][0]['selectedId'], selected)
            self.assertEqual(t['plan']['governorPasses'][0]['selection'], 'last-status-le1')
            self.assertNotIn('0048A4F0', [e['helper'] for e in t['unknownEffects']])
        f[0]['buildings'][0]['homeRosterIds'] = [7, 8, 7]
        self.assertEqual(run(f)['plan']['governorPasses'][0]['candidateIds'], [7, 8, 7])
        self.assertEqual(run(f)['plan']['governorPasses'][0]['selectedId'], 7)

    def test_leader_ranking_has_no_status_home_route_or_force_filter(self):
        for status in (-2**31, -1, 0, 1, 2, 3, 4, 5, 7, 8, 2**31-1):
            f = fixture(); f[0]['persons'][0].update(status=status, homeBaseId=16383, locationId=1086)
            f[0]['buildings'][0]['homeRosterIds'] = []
            # An allocated but invalid force member supports survival; it is not a leader candidate.
            add_person(f, person(99, valid=False, status=3), roster=None)
            f[2]['routedMissions'] = []
            t = run(f); self.assertTrue(t['accepted']); self.assertEqual(t['plan']['leaderCandidates'], [7])
            self.assertEqual(row(t['after'], 'persons', 7)['status'], 0 if status == 0 else 1)
            self.assertEqual(row(t['after'], 'persons', 99)['status'], 3)

    def test_allocated_force_members_and_valid_corps_candidates_are_different(self):
        f = fixture(); f[0]['persons'][0].update(status=5, locationId=99)
        add_person(f, person(8, valid=False, status=3), roster=None)
        f[0]['buildings'][0]['homeRosterIds'] = []
        t = run(f); gate = next(s for s in t['steps'] if s['helper'] == '004BBDB0')
        self.assertEqual(gate['allocatedStatusMask15Persons'], [8]); self.assertEqual(t['plan']['leaderCandidates'], [7])
        f[0]['persons'][1]['allocated'] = False
        self.assert_atomic(f, 'unsupported-force-extinction')
        f = fixture(); f[0]['persons'][0]['valid'] = False
        self.assert_atomic(f, 'unsupported-empty-legion-redistribution')

    def test_force_predicate_needs_force_valid_and_valid_raw_legion(self):
        for change in ('missing-force', 'invalid-force', 'invalid-support-corps', 'foreign-force'):
            f = fixture(); f[0]['persons'][0]['status'] = 5
            f[0]['legions'].append(dict(id=2, valid=True, forceId=0, leaderId=-1))
            add_person(f, person(8, rawLegionId=2), roster=None)
            if change == 'missing-force': f[0]['forces'] = []
            elif change == 'invalid-force': f[0]['forces'][0]['valid'] = False
            elif change == 'invalid-support-corps': f[0]['legions'][1]['valid'] = False
            else: f[0]['legions'][1]['forceId'] = 1
            self.assert_atomic(f, 'unsupported-force-extinction')

    def test_force_range_42_through46_is_noop_before_survival(self):
        for fid in range(42, 47):
            f = fixture(); f[0]['legions'][0]['forceId'] = fid
            f[0].update(persons=[], buildings=[], forces=[]); f[2]['routedMissions'] = []
            t = run(f); self.assertTrue(t['accepted']); self.assertEqual(t['reason'], 'non-normal-force-no-op')
            self.assertEqual(t['unknownEffects'], [])

    def test_city_subtype_validity_is_independent_of_building_validity(self):
        f = fixture(); f[0]['buildings'][0]['valid'] = False
        t = run(f); self.assertTrue(t['accepted']); self.assertEqual(t['plan']['selectedLeaderId'], 7)
        self.assertEqual(row(t['after'], 'buildings', 0)['governorId'], -1)
        self.assertEqual(t['plan']['governorPasses'], [])
        f[0]['buildings'][0]['subtypeValid'] = False
        self.assert_atomic(f, 'unsupported-force-extinction')

    def test_city_support_is_only0_to41_not_ports_or_gates(self):
        for bid in (0, 41, 42, 51, 52, 86):
            f = fixture(); f[0]['buildings'] = [building(bid)]
            f[0]['persons'][0].update(homeBaseId=bid, locationId=999)
            t = run(f)
            self.assertEqual(t['accepted'], bid <= 41)
            if bid > 41: self.assertEqual(t['reason'], 'unsupported-force-extinction')

    def test_force_city_does_not_suffice_for_empty_target_corps(self):
        f = fixture(); f[0]['legions'].append(dict(id=2, valid=True, forceId=0, leaderId=-1))
        f[0]['buildings'][0]['legionId'] = 2
        self.assert_atomic(f, 'unsupported-empty-legion-redistribution')
        f = fixture(); f[0]['persons'][0]['rawLegionId'] = 2
        f[0]['legions'].append(dict(id=2, valid=True, forceId=0, leaderId=-1))
        self.assert_atomic(f, 'unsupported-empty-legion-redistribution')

    def test_direct_governor_has_no_force_or_valid_corps_gate(self):
        for raw in (-1, 0, 46, 999):
            f = fixture(entry='governor'); f[0].update(forces=[], legions=[])
            f[0]['persons'][0]['rawLegionId'] = raw; f[0]['buildings'][0]['legionId'] = raw
            t = run(f); self.assertTrue(t['accepted']); self.assertEqual(row(t['after'], 'buildings', 0)['governorId'], 7)

    def test_roster_filter_requires_allocated_status0_to3_not_valid(self):
        for status, allocated in itertools.product((-2**31, -1, 0, 1, 2, 3, 4, 5, 7, 8, 2**31-1), (False, True)):
            f = fixture(entry='governor'); f[0]['persons'][0].update(status=status, allocated=allocated, valid=False)
            t = run(f); expected = [7] if allocated and 0 <= status <= 3 else []
            self.assertEqual(t['plan']['governorPasses'][0]['candidateIds'], expected)
            self.assertEqual(row(t['after'], 'buildings', 0)['governorId'], -1)
            self.assertEqual([e['eventId'] for e in events(t)], [14])

    def test_invalid_rank_candidates_are_unsupported_but_shortcut_and_singleton_are_defined(self):
        f = fixture(entry='governor'); add_person(f, person(8, valid=False))
        self.assert_atomic(f, 'unsupported-invalid-ranking-candidate')
        f[0]['persons'][1]['status'] = 1
        t = run(f); self.assertTrue(t['accepted']); self.assertEqual(t['plan']['governorPasses'][0]['selectedId'], 8)
        self.assertEqual(row(t['after'], 'buildings', 0)['governorId'], -1)
        self.assertEqual([e['eventId'] for e in events(t)], [14])

    def test_existing_roster_has_no_home_equals_current_base_requirement(self):
        f = fixture(entry='governor'); f[0]['persons'][0].update(homeBaseId=42, locationId=42)
        f[0]['buildings'].append(building(42))
        t = run(f); self.assertEqual(row(t['after'], 'buildings', 0)['governorId'], 7)
        self.assertEqual(row(t['after'], 'persons', 7)['homeBaseId'], 42)
        self.assertEqual(row(t['after'], 'buildings', 42)['governorId'], -1)

    def test_route_observation_is_needed_only_after_location_match_and_raw_legion_filter(self):
        for location, raw in ((99, 1), (0, 2)):
            f = fixture(entry='governor'); f[0]['persons'][0].update(locationId=location, rawLegionId=raw)
            f[2]['routedMissions'] = []; t = run(f)
            self.assertEqual(t['plan']['governorPasses'][0]['candidateIds'], [])
        f = fixture(entry='governor'); f[2]['routedMissions'] = []
        with self.assertRaisesRegex(ValueError, 'routed-mission'): run(f)
        f[2]['routedMissions'] = [dict(personId=7, hasRoute=True)]
        t = run(f); self.assertEqual(t['plan']['governorPasses'][0]['candidateIds'], [])

    def test_route_resolution_is_observed_not_inferred_from_mission_id(self):
        for mission, has_route in itertools.product((-2**31, -1, 0, 1, 37, 43, 2**31-1), (False, True)):
            f = fixture(entry='governor'); f[0]['persons'][0]['missionId'] = mission
            f[2]['routedMissions'][0]['hasRoute'] = has_route
            t = run(f); self.assertEqual(row(t['after'], 'buildings', 0)['governorId'], -1 if has_route else 7)
            effect = next(e for e in t['unknownEffects'] if e['helper'] == '005BA320')
            self.assertEqual(effect['hasRoute'], has_route); self.assertEqual(effect['snapshot'], f[0])

    def test_at_home_needs_building_valid_and_matching_subtype_legion(self):
        for change in ('missing', 'invalid', 'other-legion', 'invalid-subtype'):
            f = fixture(entry='governor'); f[0]['persons'][0].update(homeBaseId=42, locationId=42)
            if change != 'missing': f[0]['buildings'].append(building(42))
            if change == 'invalid': f[0]['buildings'][1]['valid'] = False
            elif change == 'other-legion': f[0]['buildings'][1]['legionId'] = 2
            elif change == 'invalid-subtype': f[0]['buildings'][1]['subtypeValid'] = False
            self.assertEqual(run(f)['plan']['governorPasses'][0]['candidateIds'], [])

    def test_noncanonical_home_normalizes_to_minus_one_before_route_query(self):
        for home in (-2**31, -1, 87, 16383, 16384, 2**31-1):
            f = fixture(entry='governor'); f[0]['persons'][0].update(homeBaseId=home, locationId=home, rawLegionId=-1)
            f[0]['buildings'][0]['legionId'] = -1
            if home >= 87 and home <= 16383: f[0]['buildings'].append(building(home))
            if home != -1: f[2]['routedMissions'] = []
            t = run(f); self.assertEqual(t['plan']['governorPasses'][0]['candidateIds'], [])
        # Generic valid building can satisfy the final raw -1 comparison when location is normalized -1.
        f = fixture(entry='governor'); f[0]['persons'][0].update(homeBaseId=87, locationId=-1, rawLegionId=-1)
        f[0]['buildings'][0]['legionId'] = -1; f[0]['buildings'].append(building(87))
        self.assertEqual(run(f)['plan']['governorPasses'][0]['candidateIds'], [7])

    def test_same_leader_is_still_cleared_demoted_repromoted_and_restored(self):
        f = fixture(); f[0]['persons'][0]['status'] = 1
        f[0]['legions'][0]['leaderId'] = 7; f[0]['buildings'][0]['governorId'] = 7
        t = run(f)
        self.assertEqual([(s['oldValue'], s['value']) for s in writes(t, 'persons', 'status', 7)], [(1, 3), (3, 1)])
        self.assertEqual([s['value'] for s in writes(t, 'buildings', 'governorId', 0)], [-1, 7, 7])
        self.assertEqual([(e['eventId'], e['subjectId']) for e in events(t)], [(8, 7)])
        e = events(t)[0]; self.assertEqual(row(e['snapshot'], 'persons', 7)['status'], 1)
        self.assertEqual(row(e['snapshot'], 'buildings', 0)['governorId'], 7)
        self.assertEqual(row(t['after'], 'legions', 1)['leaderId'], 7)

    def test_same_leader_away_is_cleared_before_status3_then1(self):
        f = fixture(); f[0]['persons'][0].update(status=1, locationId=88)
        f[0]['legions'][0]['leaderId'] = 7; f[0]['buildings'][0]['governorId'] = 7
        f[2]['routedMissions'] = []; t = run(f)
        self.assertEqual([s['value'] for s in writes(t, 'persons', 'status')], [3, 1])
        self.assertEqual(row(t['after'], 'buildings', 0)['governorId'], -1)
        self.assertEqual([e['eventId'] for e in events(t)], [8, 14])

    def test_old_leader_different_home_can_remain_governor(self):
        for at_home, holds_office in itertools.product((False, True), repeat=2):
            f = fixture(); f[0]['persons'][0].update(status=1, locationId=0 if at_home else 99)
            f[0]['legions'][0]['leaderId'] = 7
            f[0]['buildings'][0].update(governorId=7 if holds_office else -1, homeRosterIds=[])
            f[0]['buildings'].append(building(42, homeRosterIds=[8]))
            add_person(f, person(8, homeBaseId=42, locationId=42), roster=None)
            capacities(f, 'leader', {7: 10, 8: 20}); t = run(f)
            first = writes(t, 'persons', 'status', 7)[0]['value']
            self.assertEqual(first, 2 if at_home and holds_office else 3)

    def test_new_leader_demotes_replaced_status2_governor_before_event(self):
        f = fixture(); add_person(f, person(8, status=2), roster=None)
        f[0]['buildings'][0]['governorId'] = 8
        capacities(f, 'leader', {7: 200, 8: 100}); t = run(f)
        e = events(t)[0]; self.assertEqual((e['eventId'], e['subjectId']), (8, 8))
        self.assertEqual(row(e['snapshot'], 'persons', 7)['status'], 1)
        self.assertEqual(row(e['snapshot'], 'persons', 8)['status'], 3)
        self.assertEqual(row(e['snapshot'], 'buildings', 0)['governorId'], 8)
        self.assertEqual(row(e['snapshot'], 'legions', 1)['leaderId'], -1)

    def test_ruler_skips_new_status_and_immediate_home_assignment(self):
        f = fixture(); f[0]['persons'][0]['status'] = 0
        f[0]['buildings'][0]['homeRosterIds'] = []; f[2]['routedMissions'] = []
        t = run(f); self.assertEqual(writes(t, 'persons', 'status'), [])
        self.assertEqual(row(t['after'], 'persons', 7)['status'], 0)
        self.assertNotIn('005BA320', [e['helper'] for e in t['unknownEffects']])

    def test_governor_reselection_still_has_status2_to3_to2(self):
        f = fixture(entry='governor'); f[0]['persons'][0]['status'] = 2
        f[0]['buildings'][0]['governorId'] = 7; t = run(f)
        self.assertEqual([(s['oldValue'], s['value']) for s in writes(t, 'persons', 'status')], [(2, 3), (3, 2)])
        self.assertEqual(events(t), [])

    def test_old_governor_different_home_status2_preservation_matrix(self):
        for valid, governor, present in itertools.product((False, True), (7, -1, 8), (False, True)):
            f = fixture(entry='governor'); f[0]['persons'][0].update(status=2, homeBaseId=42, locationId=99)
            f[0]['buildings'][0].update(governorId=7, homeRosterIds=[])
            if present: f[0]['buildings'].append(building(42, valid=valid, governorId=governor))
            t = run(f); expected = 3 if present and valid and governor != 7 else 2
            self.assertEqual(row(t['after'], 'persons', 7)['status'], expected)
            self.assertEqual([e['eventId'] for e in events(t)], [8, 14])

    def test_event8_precedes_governor_write_and_event14_follows_clear(self):
        f = fixture(entry='governor'); f[0]['persons'][0]['status'] = 2
        f[0]['buildings'][0].update(governorId=7, homeRosterIds=[])
        t = run(f); e8, e14 = events(t)
        self.assertEqual((e8['eventId'], e14['eventId']), (8, 14))
        self.assertEqual(row(e8['snapshot'], 'buildings', 0)['governorId'], 7)
        self.assertEqual(row(e14['snapshot'], 'buildings', 0)['governorId'], -1)
        self.assertEqual(row(e8['snapshot'], 'persons', 7)['status'], 3)
        self.assertEqual(row(e14['snapshot'], 'persons', 7)['status'], 3)
        write_index = next(i for i, s in enumerate(t['steps']) if s.get('field') == 'governorId')
        self.assertLess(e8['beforeStepIndex'], write_index); self.assertLess(write_index, e14['beforeStepIndex'])
        for e in events(t):
            self.assertEqual(e['dispatchOrder'], ['004A8110', '004BA1D0', '004EC870/optional virtual+1B4'])
            self.assertEqual(e['argument'], 0)
            self.assertEqual(t['steps'][e['beforeStepIndex']]['eventId'], e['eventId'])
            self.assertEqual(e['snapshot']['revision'], 0); self.assertEqual(e['snapshot']['appliedCommands'], [])

    def test_missing_invalid_or_unchanged_old_governor_has_no_event8(self):
        for old, valid in ((-1, True), (1099, True), (7, False), (7, True)):
            f = fixture(entry='governor'); f[0]['buildings'][0]['governorId'] = old
            if old == 7 and not valid: f[0]['persons'][0]['valid'] = False
            self.assertNotIn(8, [e['eventId'] for e in events(run(f))])

    def test_governor_passes_are_canonical0_to86_in_id_order_after_leader_write(self):
        f = fixture(); f[0]['persons'][0].update(status=0, locationId=99)
        f[0]['buildings'] = [building(i) for i in (86, 87, 52, 51, 42, 41, 0)]
        t = run(f)
        self.assertEqual([p['buildingId'] for p in t['plan']['governorPasses']], [0, 41, 42, 51, 52, 86])
        leader_index = next(i for i, s in enumerate(t['steps']) if s.get('field') == 'leaderId')
        self.assertTrue(all(i > leader_index for i, s in enumerate(t['steps']) if s['helper'] == '004BCA30/entry'))
        for e in events(t): self.assertEqual(row(e['snapshot'], 'legions', 1)['leaderId'], 7)

    def test_subtype_setter_city_and_port_gate_split_and_generic_noop(self):
        for bid in (0, 41, 42, 51, 52, 86, 87, 16383):
            f = fixture(entry='governor'); f[1]['targetId'] = bid
            f[0]['buildings'] = [building(bid, homeRosterIds=[7] if bid <= 86 else [])]
            f[0]['persons'][0].update(homeBaseId=bid, locationId=bid)
            t = run(f)
            if bid <= 86:
                helper = '00487780/0047B4B0' if bid <= 41 else '00487780/0048D9A0'
                self.assertEqual(writes(t, 'buildings', 'governorId')[0]['helper'], helper)
            else:
                self.assertEqual(writes(t, 'buildings'), []); self.assertEqual([e['eventId'] for e in events(t)], [14])

    def test_sparse_omissions_mean_absent_slots_not_missing_observations(self):
        f = fixture(entry='governor'); f[0]['buildings'][0]['homeRosterIds'] = [0, 7, 1099]
        t = run(f); self.assertEqual(t['plan']['governorPasses'][0]['candidateIds'], [7])
        for entry, target in (('legion', -1), ('legion', 46), ('governor', -1), ('governor', 16383)):
            f = fixture(entry=entry); f[1]['targetId'] = target; f[2]['routedMissions'] = []
            t = run(f); self.assertTrue(t['accepted']); self.assertEqual(t['unknownEffects'], [])
            self.assertEqual(t['reason'], 'invalid-legion-no-op' if entry == 'legion' else 'invalid-building-no-op')

    def test_refresh_unsupported_only_after_valid_direct_building_gate(self):
        for flag in (-2**31, -1, 1, 2**31-1):
            f = fixture(entry='governor'); f[1]['refreshFlag'] = flag
            self.assert_atomic(f, 'unsupported-governor-refresh')
            f[0]['buildings'][0]['valid'] = False
            self.assertEqual(run(f)['reason'], 'invalid-building-no-op')
            f = fixture(); f[1]['refreshFlag'] = flag
            self.assertTrue(run(f)['accepted'])  # Legion's own base loop always passes zero.

    def test_stage_capacities_cannot_be_reused_for_another_base_or_leader(self):
        f = fixture(); f[0]['persons'][0].update(status=0, locationId=99)
        f[0]['buildings'][0]['homeRosterIds'] = []
        f[0]['buildings'].append(building(42, homeRosterIds=[8, 9]))
        add_person(f, person(8, homeBaseId=42, locationId=42), roster=None)
        add_person(f, person(9, homeBaseId=42, locationId=42), roster=None)
        capacities(f, 'leader', {7: -1, 8: 100, 9: 1})
        capacities(f, 'governor:42', {8: 1, 9: 100})
        t = run(f); self.assertEqual(t['plan']['selectedLeaderId'], 7)
        self.assertEqual(row(t['after'], 'buildings', 42)['governorId'], 9)
        effects = [e for e in t['unknownEffects'] if e['helper'] == '0048A4F0']
        self.assertEqual([e['stage'] for e in effects], ['leader', 'governor:42'])
        self.assertEqual(row(effects[0]['snapshot'], 'legions', 1)['leaderId'], -1)
        self.assertEqual(row(effects[1]['snapshot'], 'legions', 1)['leaderId'], 7)
        f[2]['capacities'] = [r for r in f[2]['capacities'] if r['stage'] == 'leader']
        before = copy.deepcopy(f)
        with patch.object(m, '_apply', side_effect=AssertionError('must finish preflight first')):
            with self.assertRaisesRegex(ValueError, 'governor:42'): run(f)
        self.assertEqual(f, before)

    def test_rank_len2_requires_all_capacity_observations_even_ruler(self):
        f = fixture(); f[0]['persons'][0]['status'] = 0; add_person(f, person(8))
        capacities(f, 'leader', {7: 0})
        with self.assertRaisesRegex(ValueError, 'leader person 8'): run(f)
        f = fixture(); f[2]['capacities'] = []
        self.assertTrue(run(f)['accepted'])
        f = fixture(entry='governor'); f[2]['capacities'] = []
        self.assertTrue(run(f)['accepted'])

    def test_preflight_missing_route_after_planned_demotions_is_atomic(self):
        f = fixture(); f[0]['persons'][0]['status'] = 1
        f[0]['legions'][0]['leaderId'] = 7; f[0]['buildings'][0]['governorId'] = 7
        f[2]['routedMissions'] = []; before = copy.deepcopy(f)
        with patch.object(m, '_apply', side_effect=AssertionError('must not apply partial plan')):
            with self.assertRaisesRegex(ValueError, 'routed-mission'): run(f)
        self.assertEqual(f, before)

    def test_strict_unknown_reject_includes_observed_helpers_without_events(self):
        for entry in ('legion', 'governor'):
            f = fixture(entry=entry); f[3]['unknownEffects'] = 'reject'
            t = self.assert_atomic(f, 'unknown-effects-rejected')
            self.assertEqual(events(t), []); self.assertTrue(t['unknownEffects'])
            self.assertEqual(t, m.replay_legion_roles(t))
        f = fixture(); f[0]['persons'][0].update(status=0, locationId=99)
        f[0]['buildings'][0]['valid'] = False; f[2]['routedMissions'] = []
        f[3]['unknownEffects'] = 'reject'; self.assertTrue(run(f)['accepted'])

    def test_command_replay_revision_conflict_and_deterministic_json(self):
        f = fixture(); t = run(f)
        again = m.project_legion_roles(t['after'], *f[1:])
        self.assertTrue(again['accepted']); self.assertTrue(again['replayed']); self.assertEqual(again['reason'], 'replay')
        self.assertEqual(again['after'], t['after']); self.assertEqual(again['steps'], [])
        changed = copy.deepcopy(f); changed[0] = t['after']; changed[1]['refreshFlag'] = 1
        self.assert_atomic(changed, 'replay-payload-conflict')
        changed[1]['id'] = 'roles-2'; self.assert_atomic(changed, 'revision-conflict')
        changed[1]['expectedRevision'] = 1; self.assertTrue(run(changed)['accepted'])
        self.assertEqual(run(json.loads(json.dumps(f))), t)
        # Replay short-circuits reached-helper observations but never structural validation.
        changed = copy.deepcopy(f); changed[0] = t['after']; changed[2].update(capacities=[], routedMissions=[])
        self.assertTrue(run(changed)['replayed'])
        changed[2]['source'] = 'S2'
        with self.assertRaises(ValueError): run(changed)

    def test_trace_tampering_with_and_without_recomputed_hash_is_rejected(self):
        f = fixture(); f[0]['persons'][0]['status'] = 1
        f[0]['buildings'][0]['governorId'] = 7; f[0]['legions'][0]['leaderId'] = 7
        t = run(f)
        mutations = [lambda q: q['after']['persons'][0].update(status=5),
                     lambda q: q['after']['forces'][0].update(advisorId=7),
                     lambda q: q.update(reason='fabricated'), lambda q: q['steps'].reverse(),
                     lambda q: q['unknownEffects'].clear(),
                     lambda q: q['unknownEffects'][0]['snapshot']['persons'][0].update(status=0),
                     lambda q: q['evidence'].update(stockVerified=True),
                     lambda q: q['rng'].update(consumed=1), lambda q: q['plan'].update(selectedLeaderId=8)]
        for mutate in mutations:
            bad = copy.deepcopy(t); mutate(bad)
            with self.assertRaises(ValueError): m.replay_legion_roles(bad)
            bad.pop('traceHash'); bad['traceHash'] = digest(bad)
            with self.assertRaises(ValueError): m.replay_legion_roles(bad)
        for invalid in (None, [], {}, {'traceHash': '0'*64}):
            with self.assertRaises(ValueError): m.replay_legion_roles(invalid)

    def test_schema_rejects_invalid_ranges_types_assumptions_and_duplicates_atomically(self):
        changes = [lambda f: f[0].update(source='S3'), lambda f: f[0].update(revision=True),
            lambda f: f[0].update(rngState=-1), lambda f: f[0].update(extra=1),
            lambda f: f[0]['persons'][0].update(id=1100), lambda f: f[0]['persons'][0].update(valid=1),
            lambda f: f[0]['persons'][0].update(allocated=False), lambda f: f[0]['persons'][0].update(status=2**31),
            lambda f: f[0]['persons'][0].update(officeId=-2**31-1), lambda f: f[0]['persons'][0].update(leadershipByte=256),
            lambda f: f[0]['persons'][0].update(strengthByte=-1), lambda f: f[0]['persons'][0].update(rawWordAE=65536),
            lambda f: f[0]['persons'][0].update(flags124=2**32), lambda f: f[0]['persons'][0].update(missionArgs=[0]*4),
            lambda f: f[0]['persons'][0].update(missionDuration=256), lambda f: f[0]['buildings'][0].update(id=16384),
            lambda f: f[0]['buildings'][0].update(subtypeValid=None), lambda f: f[0]['buildings'][0].update(homeRosterIds=[1100]),
            lambda f: f[0]['buildings'].append(building(87, legionId=1)),
            lambda f: f[0]['buildings'].append(building(87, subtypeValid=True)),
            lambda f: f[0]['legions'][0].update(id=47), lambda f: f[0]['legions'][0].update(forceId=-1),
            lambda f: f[0]['forces'][0].update(id=47), lambda f: f[0]['forces'][0].update(advisorId=2**31),
            lambda f: f[1].update(entry='all'), lambda f: f[1].update(targetId=47), lambda f: f[1].update(refreshFlag=True),
            lambda f: f[2].update(source='S2'), lambda f: f[2].update(provenance=''),
            lambda f: f[2]['routedMissions'][0].update(hasRoute=0),
            lambda f: f[2]['capacities'].append(dict(stage='governor:01', personId=7, value=1)),
            lambda f: f[2]['capacities'].append(dict(stage='governor:16384', personId=7, value=1)),
            lambda f: f[2]['capacities'].append(dict(stage='leader', personId=7, value=2**31)),
            lambda f: f[3].update(callbackAssumption='execute'), lambda f: f[3].update(pointerDomain='array-slots-v1'),
            lambda f: f[3].update(listAssumption='maybe-success'), lambda f: f[3].update(ruleset='vanilla'),
            lambda f: f[3].update(unknownEffects='ignore'),
            lambda f: f[0]['appliedCommands'].append(dict(id='x', sha256='x'*64))]
        for name in ('persons', 'buildings', 'legions', 'forces'):
            changes.append(lambda f, name=name: f[0][name].append(copy.deepcopy(f[0][name][0])))
            changes.append(lambda f, name=name: f[0].update({name: ()}))
        changes.extend([lambda f: f[2]['routedMissions'].append(copy.deepcopy(f[2]['routedMissions'][0])),
                        lambda f: capacities(f, 'leader', {7: 1}) or capacities(f, 'leader', {7: 2})])
        for index, change in enumerate(changes):
            with self.subTest(case=index):
                f = fixture(); change(f); before = copy.deepcopy(f)
                with self.assertRaises(ValueError): run(f)
                self.assertEqual(f, before)

    def test_late_unsupported_governor_rank_discards_entire_legion_plan(self):
        f = fixture(); f[0]['persons'][0].update(status=0, locationId=99)
        f[0]['buildings'][0]['homeRosterIds'] = []
        f[0]['buildings'].append(building(42, homeRosterIds=[8, 9]))
        add_person(f, person(8, homeBaseId=42, locationId=42), roster=None)
        add_person(f, person(9, valid=False, homeBaseId=42, locationId=42), roster=None)
        capacities(f, 'leader', {7: 0, 8: 65535})
        # Leader write and city0 event14 were planned before city42 reaches
        # a mixed-validity sort. None may escape the preflight transaction.
        with patch.object(m, '_apply', side_effect=AssertionError('unsupported must not apply')):
            t = self.assert_atomic(f, 'unsupported-invalid-ranking-candidate')
        self.assertEqual(t['unknownEffects'], [])
        self.assertEqual(t['plan'], {'route': 'unsupported-invalid-ranking-candidate'})

    def test_canonical_person_legion_force_endpoint_slots(self):
        for lid, fid in itertools.product((0, 46), (0, 41)):
            f = fixture(); f[1]['targetId'] = lid
            f[0]['persons'] = [person(1099, rawLegionId=lid, homeBaseId=41, locationId=41),
                               person(0, rawLegionId=lid, homeBaseId=41, locationId=41)]
            f[0]['buildings'] = [building(41, legionId=lid, homeRosterIds=[0, 1099])]
            f[0]['legions'] = [dict(id=lid, valid=True, forceId=fid, leaderId=-1)]
            f[0]['forces'] = [dict(id=fid, valid=True, advisorId=0)]
            f[2]['routedMissions'] = [dict(personId=i, hasRoute=False) for i in (0, 1099)]
            capacities(f, 'leader', {0: 0, 1099: -1}); t = run(f)
            self.assertEqual(t['plan']['leaderCandidates'], [1099, 0])
            self.assertEqual(row(t['after'], 'legions', lid)['leaderId'], 1099)
            self.assertEqual(row(t['after'], 'buildings', 41)['governorId'], 1099)
            self.assertEqual(row(t['after'], 'forces', fid)['advisorId'], 0)

    def test_old_leader_pointer_has_no_extra_raw_legion_gate_and_only_status1_is_demoted(self):
        for status in (-1, 0, 1, 2, 3, 4, 5, 7, 8):
            f = fixture(); f[0]['persons'][0].update(status=status, rawLegionId=2, homeBaseId=42, locationId=42)
            f[0]['legions'][0]['leaderId'] = 7
            f[0]['legions'].append(dict(id=2, valid=True, forceId=0, leaderId=-1))
            f[0]['buildings'][0]['homeRosterIds'] = [8]
            f[0]['buildings'].append(building(42, legionId=2, governorId=7))
            add_person(f, person(8), roster=None); t = run(f)
            self.assertEqual(t['plan']['selectedLeaderId'], 8)
            self.assertEqual(row(t['after'], 'persons', 7)['status'], 2 if status == 1 else status)
            self.assertEqual(row(t['after'], 'buildings', 42)['governorId'], 7)
            self.assertEqual(row(t['after'], 'persons', 7)['rawLegionId'], 2)

    def test_duplicate_valid_roster_nodes_are_not_deduplicated_before_ranking(self):
        f = fixture(entry='governor'); f[0]['persons'][0]['status'] = 2
        f[0]['buildings'][0].update(governorId=7, homeRosterIds=[7, 7])
        with self.assertRaisesRegex(ValueError, 'governor:0'): run(f)
        capacities(f, 'governor:0', {7: 65536}); t = run(f)
        self.assertEqual(t['plan']['governorPasses'][0]['candidateIds'], [7, 7])
        ledger = next(e for e in t['unknownEffects'] if e['helper'] == '0048A4F0')
        self.assertEqual(ledger['inputs'], [dict(personId=7, returnedDword=65536, capacity16=0)] * 2)
        self.assertEqual([s['value'] for s in writes(t, 'persons', 'status')], [3, 2])
        self.assertEqual(events(t), [])

    def test_revision_exhaustion_and_ruleset_labels(self):
        f = fixture(); f[0]['revision'] = f[1]['expectedRevision'] = 2**31-1
        with self.assertRaisesRegex(ValueError, 'revision exhausted'): run(f)
        f = fixture(); f[3]['ruleset'] = 'PC-Vanilla-assumed'
        t = run(f); self.assertEqual(t['evidence']['runtimeStatus'], 'compatibility-assumption')
        self.assertFalse(t['evidence']['vanillaVerified'])

    def test_earlier_projection_and_replay_contracts_remain_separate(self):
        import mission_cancellation_profile as v1
        import mission_cancellation_v2_profile as v2
        import return_mission_lifecycle_profile as lifecycle
        import officer_return_finalizer_profile as finalizer
        from check_mission_cancellation_profile import fixture as cancellation_fixture
        from check_mission_cancellation_v2_profile import fixture as cancellation_v2_fixture
        from check_return_mission_lifecycle_profile import fixture as lifecycle_fixture
        from check_officer_return_finalizer_profile import fixture as finalizer_fixture
        for source in ('S1', 'S2'):
            fixtures = [(v1.project_cancellation, v1.replay_cancellation, cancellation_fixture(9, source)),
                        (v2.project_cancellation, v2.replay_cancellation, cancellation_v2_fixture(9, source)),
                        (lifecycle.project_return_mission, lifecycle.replay_return_mission, lifecycle_fixture(source, 'complete')),
                        (finalizer.project_officer_return, finalizer.replay_officer_return, finalizer_fixture(source))]
            for project, replay, f in fixtures:
                before = copy.deepcopy(f); t = project(*f)
                self.assertEqual(f, before); self.assertEqual(replay(t), t)
                self.assertNotEqual(t['profileId'], m.PROFILE_ID)
                with self.assertRaises(ValueError): m.replay_legion_roles(t)
                with self.assertRaises(ValueError): project(*fixture(source))
            old = finalizer.project_officer_return(*finalizer_fixture(source))
            self.assertEqual(old['after']['persons'][0]['status'], 2)
            self.assertEqual([e['helper'] for e in old['unknownEffects']].count('004BE2A0'), 1)
            self.assertIn('004BCA30', [e['helper'] for e in old['unknownEffects']])
            self.assertFalse(old['evidence']['completeGameTransaction'])

    def test_seeded_independent_full_transition_oracle_512_cases(self):
        rng = random.Random(58058)
        seen = set(); changed = 0; emitted = 0
        for case in range(512):
            entry = 'legion' if case % 2 else 'governor'; f = fixture('S1' if case % 4 < 2 else 'S2', entry)
            f[0]['persons'] = []; f[2]['routedMissions'] = []
            f[0]['buildings'] = [building(i, valid=rng.random() > .12, subtypeValid=rng.random() > .1,
                                         legionId=rng.choice([1, 1, 1, 2, -1])) for i in (0, 1, 41, 42, 52, 86)]
            f[0]['legions'].append(dict(id=2, valid=True, forceId=0, leaderId=-1))
            n = rng.randrange(2, 10)
            for pid in range(7, 7+n):
                home = rng.choice([0, 1, 41, 42, 52, 86, -1, 87])
                allocated = rng.random() > .08
                p = person(pid, allocated=allocated, valid=allocated and rng.random() > .12,
                    status=rng.choice([-1, 0, 1, 2, 3, 3, 4, 5, 7, 8]), homeBaseId=home,
                    locationId=home if rng.random() > .22 else 1086, rawLegionId=rng.choice([1, 1, 1, 2, -1]),
                    officeId=rng.choice([-2**31, -1, 0, 10, 2**31-1]), leadershipByte=rng.choice([0, 60, 60, 255]),
                    strengthByte=rng.choice([0, 60, 60, 255]), rawWordAE=rng.choice([0, 500, 500, 65535]),
                    flags124=rng.randrange(2**32), missionId=rng.randrange(-1, 44),
                    missionArgs=[rng.randrange(-1000, 1000) for _ in range(5)], missionDuration=rng.randrange(256))
                add_person(f, p, roster=None, route=rng.random() < .08)
            ids = [p['id'] for p in f[0]['persons']]
            for b in f[0]['buildings']:
                b['homeRosterIds'] = [pid for pid in ids if rng.random() > .35]
                rng.shuffle(b['homeRosterIds'])
                if b['homeRosterIds'] and rng.random() < .2: b['homeRosterIds'].append(b['homeRosterIds'][0])
                b['governorId'] = rng.choice(ids + [-1, 1099])
            f[0]['legions'][0]['leaderId'] = rng.choice(ids + [-1, 1099])
            if entry == 'legion' and case % 3:
                # Guarantee survival independently of leader eligibility or governor rosters.
                f[0]['buildings'][0].update(subtypeValid=True, legionId=1)
                add_person(f, person(1000, valid=False, rawLegionId=2), roster=None)
            if entry == 'governor':
                f[1]['targetId'] = rng.choice([0, 1, 41, 42, 52, 86])
                # Deliberately cover multi-operand governor ranking as well as
                # unconstrained random lists; invalid operands must defer.
                if case % 8 == 0:
                    bid = f[1]['targetId']
                    row(f[0], 'buildings', bid).update(valid=True, subtypeValid=True,
                                                     legionId=1, homeRosterIds=ids[:2])
                    for pid in ids[:2]:
                        row(f[0], 'persons', pid).update(allocated=True, valid=True,
                            status=rng.choice([2, 3]), homeBaseId=bid, locationId=bid, rawLegionId=1)
                        next(o for o in f[2]['routedMissions'] if o['personId'] == pid)['hasRoute'] = False
                    if case % 16 == 0:
                        row(f[0], 'persons', ids[0])['valid'] = False
            for stage in ['leader'] + ['governor:' + str(i) for i in (0, 1, 41, 42, 52, 86)]:
                capacities(f, stage, {pid: rng.choice([-2**31, -1, 0, 500, 500, 65535, 65536, 2**31-1])
                                      for pid in [p['id'] for p in f[0]['persons']]})
            rng.shuffle(f[0]['persons']); rng.shuffle(f[0]['buildings'])
            expected_reason, expected_state, expected_events, expected_passes, expected_rank = oracle(f)
            before = copy.deepcopy(f); t = run(f); seen.add(t['reason'])
            self.assertEqual(f, before, case); self.assertEqual(t['reason'], expected_reason, case)
            self.assertEqual(t['after'], expected_state, case)
            actual_events = [(e['eventId'], e['subjectType'], e['subjectId'], e['snapshot']) for e in events(t)]
            self.assertEqual(actual_events, expected_events, case)
            if t['accepted']:
                self.assertEqual([(p['buildingId'], p['candidateIds'], p['selectedId']) for p in t['plan']['governorPasses']], expected_passes, case)
                self.assertEqual(t['plan']['leaderCandidates'], expected_rank, case)
                changed += sum(a['status'] != row(t['after'], 'persons', a['id'])['status'] for a in f[0]['persons'])
                emitted += len(events(t))
            else:
                self.assertEqual(t['steps'], []); self.assertEqual(t['unknownEffects'], [])
            self.assertEqual(m.replay_legion_roles(json.loads(json.dumps(t))), t, case)
        self.assertTrue({'roles', 'unsupported-force-extinction', 'unsupported-empty-legion-redistribution',
                         'unsupported-invalid-ranking-candidate'} <= seen, seen)
        self.assertGreater(changed, 100); self.assertGreater(emitted, 100)


if __name__ == '__main__':
    unittest.main()
