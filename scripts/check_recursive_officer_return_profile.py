"""P0-62 independent recursive oracle, live mutation and transaction checks.

The oracle never imports or invokes a production planner, primitive, or projector.
Only the test runner invokes the public projector. Tail semantics reuse the
independent P0-61 oracle. Exact native scopes are observation-binding fixtures;
synthetic sort/route/effect answers make no native reachability or RNG claim.
"""
from contextlib import contextmanager
import copy
import hashlib
import itertools
import json
import random
import unittest
from unittest.mock import patch

import recursive_officer_return_profile as m
import recursive_return_frame as frames
from check_mission_event_composition_profile import Oracle as EventOracle
from check_mission_event_composition_profile import HANDLER, PRESENTATION, LIMIT, scope


def row(w, rid=7, table='persons'):
    return next(r for r in w[table] if r['id'] == rid)


def refresh_person(person):
    """Independent fixture/oracle cache derivation, never a production repair."""
    status, raw = person['status'], person['rawDword17C']
    person['allocated'] = raw != 0 or status in range(9)
    person['valid'] = person['allocated'] and (raw != 0 or status not in (6, 8))
    return person


def refresh_people(frame):
    for p in frame['persons']: refresh_person(p)


def person(pid, **changes):
    result = dict(id=pid, allocated=True, valid=True, status=3, homeBaseId=0,
                  locationId=0, rawLegionId=0, missionId=-1,
                  missionArgs=[0, 9, 3, 4, 5], missionDuration=99,
                  flags124=0x102, rawDword17C=0, officeId=10, leadershipByte=70,
                  strengthByte=60, rawWordAE=500, data={'note': 'keep'})
    result.update(changes)
    return refresh_person(result)


def building(bid, **changes):
    result = dict(id=bid, valid=True,
                  kind=0 if bid <= 41 else 1 if bid <= 51 else 2,
                  subtypeValid=bid <= 86, legionId=0, governorId=-1,
                  homeRosterIds=[], data={'note': 'keep'})
    result.update(changes)
    return result


def fixture(entry='event', source='S1', event=8, home=0, location=0):
    w = dict(persons=[person(7, homeBaseId=home, locationId=location,
                             missionId=23 if event == 8 else 24),
                      person(9, status=5, homeBaseId=1, locationId=1)],
             buildings=[building(0, homeRosterIds=[7]), building(1),
                        building(42), building(16383)],
             cities=[dict(id=i, valid=True, data={}) for i in (0, 1)],
             legions=[dict(id=0, valid=True, forceId=0, number=1,
                           leaderId=-1, rosterIds=[7], data={})],
             forces=[dict(id=0, valid=True, playerIndex=-1, raw44=9,
                          field128=1, advisorId=-1, data={})],
             activePersonIds=[7], executingPersonId=None, managerDirty=0,
             observerPresent=False, rngState=8, data={'nested': {'value': 1}})
    if entry == 'event':
        args = dict(id=event, subjectType='person' if event == 8 else 'building',
                    subjectId=9 if event == 8 else 42, argument=417)
        if event == 14: row(w)['missionArgs'][0] = 42
    elif entry == 'return':
        args = dict(personId=7, targetBuildingId=0, showNotice=0, noticeVariant=1)
    else:
        args = dict(targetId=0)
    return [dict(source=source, revision=0, appliedCommands=[], frame=w),
            dict(id='recursive-1', expectedRevision=0, entry=entry, args=args),
            dict(source=source, provenance='independent synthetic fixtures', records=[]),
            dict(id='recursive-observe-v1', ruleset='PC-PK1.1',
                 unknownEffects='observed-frame', frameProfile=frames.FRAME_PROFILE_ID,
                 registryDomain='initialized-unmodified-registry-v1',
                 listAssumption='readable-acyclic-successful-allocation-v1',
                 engineGuard=dict(maxEventDepth=32, maxNativeCalls=100000),
                 provenance='explicit bounded model, not native capture')]


def run(f):
    return m.project_recursive_officer_return(*f)


def helpers(t):
    return [s['helper'] for s in t['steps']]


def digest(v):
    return hashlib.sha256(json.dumps(v, sort_keys=True, separators=(',', ':'),
                                    ensure_ascii=False).encode()).hexdigest()


class Oracle(EventOracle):
    """Independent live interpreter with recursively stacked event/actor locals.

    The effect callback returns an observed count, or {'count': n, 'result': x}
    for a mutable query. Default identity/count-zero responses below are explicit
    test fixtures and are never installed as production observation defaults.
    """
    def __init__(self, f, effect=None, distance=3, query267=False, troop=False):
        self.troop = troop
        self.f, self.w = f, copy.deepcopy(f[0]['frame'])
        self.source, self.effect = f[0]['source'], effect
        self.distance, self.query267 = distance, query267
        self.records, self.events, self.event_stack, self.stack = [], [], [], []
        self.pid = self.visit = self.event = None
        self.return_calls = 0
        self.role_calls = []

    @contextmanager
    def inside(self, helper, **locals):
        self.stack.append(scope(helper, **locals))
        try: yield
        finally: self.stack.pop()

    @contextmanager
    def acting(self, pid):
        saved = self.pid
        self.pid = pid
        try: yield
        finally: self.pid = saved

    def set_status(self, pid, status):
        p = self.get('persons', pid)
        p['status'] = status
        refresh_person(p)

    def valid(self, name, rid):
        r = self.get(name, rid)
        return bool(r is not None and r['valid'])

    def boundary(self, stage, kind, helper, args, result=None):
        if helper == '004BF6F0':
            self.return_native(**args)
            return
        r = dict(index=len(self.records), source=self.source, kind=kind,
                 helper=helper, args=copy.deepcopy(args),
                 callStack=copy.deepcopy(self.stack), before=copy.deepcopy(self.w),
                 provenance='independent synthetic ' + stage + ' fixture')
        if kind != 'query':
            after = copy.deepcopy(self.w)
            c = dict(personId=self.pid, visitIndex=self.visit,
                     index=len(self.records), args=copy.deepcopy(args),
                     event=copy.deepcopy(self.event), eventDepth=len(self.event_stack),
                     callStack=copy.deepcopy(self.stack))
            answer = 0 if self.effect is None else self.effect(stage, after, c)
            # Effects below edit raw source fields explicitly. The fixture
            # builder supplies consistent diagnostic caches before observation.
            refresh_people(after)
            if isinstance(answer, dict):
                result = answer.get('result', result)
                count = answer.get('count', 0)
            else: count = answer
            r.update(after=copy.deepcopy(after), rngConsumption=dict(
                kind='unknown' if count is None else 'observed-count', calls=count))
            self.w = after
        if kind in ('query', 'effect-query'): r['result'] = copy.deepcopy(result)
        self.records.append(r)
        return result

    def emit(self, event):
        old = self.event, self.pid, self.visit
        parent = self.event_stack[-1]['eventIndex'] if self.event_stack else None
        context = dict(eventIndex=len(self.events), parentEventIndex=parent,
                       event=copy.deepcopy(event), copiedActivePersonIds=[], visits=[])
        self.events.append(context)
        self.event_stack.append(context)
        self.event = event
        try:
            with self.inside('004BBAA0', event=event):
                copied = list(self.w['activePersonIds'])
                context['copiedActivePersonIds'] = copied
                with self.inside('004A8110', copiedActivePersonIds=copied):
                    for visit, pid in enumerate(copied):
                        self.visit = visit
                        v = dict(visitIndex=visit, personId=pid, missionId=None,
                                 dispatcherReturn=None, handlerReturn=None)
                        context['visits'].append(v)
                        if pid == self.w['executingPersonId']:
                            v['route'] = 'executing-person-skip'
                            continue
                        mission = self.get('persons', pid)['missionId']
                        v['missionId'] = mission
                        if not 0 <= mission <= 43:
                            v['route'] = 'mission-range-skip'
                        elif mission == 37:
                            v.update(route='mission37-skip', dispatcherReturn=0)
                        else:
                            with self.acting(pid), self.inside('005B9D30',
                                    visitIndex=visit, personId=pid, capturedMissionId=mission):
                                if self.qualifies(mission):
                                    result = self.handler(mission)
                                    v.update(route='handler-called', dispatcherReturn=1,
                                             handlerReturn=result)
                                else: v.update(route='predicate-false', dispatcherReturn=0)
                if self.w['observerPresent']:
                    self.boundary('event-observer', 'effect', 'observer.virtual1B4',
                                  dict(nativeArgs=[0, 0, 0, 0], caller='004BBAA0'))
        finally:
            self.event_stack.pop()
            self.event, self.pid, self.visit = old

    def canonical(self, bid):
        b = self.get('buildings', bid)
        return bool(b and ((b['kind'] == 0 and 0 <= bid <= 41) or
                          (b['kind'] == 1 and 42 <= bid <= 51) or
                          (b['kind'] == 2 and 52 <= bid <= 86)))

    def subtype(self, bid):
        return self.canonical(bid) and self.get('buildings', bid)['subtypeValid']

    def base_legion(self, bid):
        return self.get('buildings', bid)['legionId'] if self.subtype(bid) else -1

    def governor_id(self, bid):
        return self.get('buildings', bid)['governorId'] if self.subtype(bid) else -1

    def force_id(self, pid):
        p = self.get('persons', pid)
        legion = self.get('legions', p['rawLegionId'])
        return legion['forceId'] if legion and legion['valid'] else -1

    def append_sort(self, table, rid, key, pid):
        self.get(table, rid)[key].append(pid)
        with self.inside('0047CD50', table=table, rosterId=rid,
                         rosterField=key, arguments=[1, 0, 0, 0]):
            if len(self.get(table, rid)[key]) >= 2:
                self.boundary('roster-sort', 'effect', '0047CD50', dict(
                    table=table, rosterId=rid, rosterField=key, arguments=[1, 0, 0, 0]))

    def home_setter(self, pid, bid):
        with self.inside('004A31E0', personId=pid, requestedHomeId=bid):
            if not self.get('persons', pid)['allocated']: return
            self.get('buildings', bid)
            old = self.get('persons', pid)['homeBaseId']
            if self.subtype(old):
                seq = self.get('buildings', old)['homeRosterIds']
                if pid in seq: seq.remove(pid)
            self.get('persons', pid)['homeBaseId'] = bid
            if self.subtype(bid): self.append_sort('buildings', bid, 'homeRosterIds', pid)

    def legion_setter(self, pid, lid):
        with self.inside('004A32F0', personId=pid, requestedLegionId=lid):
            p = self.get('persons', pid)
            if not p['allocated']: return
            if self.valid('legions', p['rawLegionId']):
                seq = self.get('legions', p['rawLegionId'])['rosterIds']
                if pid in seq: seq.remove(pid)
            if lid == -1 or 0 <= lid <= 46:
                self.get('persons', pid)['rawLegionId'] = lid
                if lid >= 0: self.get('persons', pid)['flags124'] |= 1 << 9
            if self.valid('legions', lid): self.append_sort('legions', lid, 'rosterIds', pid)

    def target_force(self, bid, stage):
        value = self.base_legion(bid)
        l = self.get('legions', value)
        return self.boundary('target-force:' + stage, 'effect-query',
                             '00487EB0/virtual+40', dict(buildingId=bid, stage=stage),
                             l['forceId'] if l and l['valid'] else -1)

    def return_native(self, personId, targetBuildingId, showNotice, noticeVariant):
        pid, bid = personId, targetBuildingId
        with self.acting(pid), self.inside('004BF6F0', personId=pid,
                targetBuildingId=bid, showNotice=showNotice, noticeVariant=noticeVariant):
            self.return_calls += 1
            if not self.valid('persons', pid) or not self.valid('buildings', bid): return
            p = self.actor()
            old_status, old_home, old_legion = p['status'], p['homeBaseId'], p['rawLegionId']
            if self.get('buildings', old_home) is None: old_home = -1
            if self.get('legions', old_legion) is None: old_legion = -1
            self.stack[-1]['locals'].update(savedTargetId=bid, savedOldStatus=old_status,
                                           savedOldHomeId=old_home, savedOldLegionId=old_legion)
            self.get('persons', self.governor_id(bid))
            if showNotice:
                force = self.force()
                legion = self.get('legions', self.actor()['rawLegionId'])
                eligible = force and force['valid'] and 0 <= force['playerIndex'] <= 7 and legion and legion['valid'] and legion['number'] == 1
                if eligible and self.actor()['status'] != 5:
                    self.boundary('return-notice', 'effect', '004B93D0/004F55E0', dict(
                        personId=pid, targetBuildingId=bid, noticeVariant=noticeVariant,
                        messageId=0x175d, displayArgs=[bid, 1, -1]))
            saved_force = self.force_id(pid)
            self.get('forces', saved_force)
            self.stack[-1]['locals']['savedOldForceId'] = saved_force
            if self.actor()['status'] == 0:
                compare = self.force_id(pid)
                self.stack[-1]['locals']['savedRulerCompareForceId'] = compare
                target_force = self.target_force(bid, 'ruler')
                if compare == target_force and self.valid('forces', saved_force) and self.get('forces', saved_force)['field128'] == 0:
                    raise RuntimeError('unsupported-ruler-ownership')
            self.home_setter(pid, bid)
            location = self.actor()['locationId']
            troop = False
            if 87 <= location <= 1086:
                troop = self.boundary('troop', 'query', '004891C0',
                                     dict(personId=pid, locationId=location), self.troop)
            if not troop:
                normalized = bid if self.canonical(bid) else -1
                with self.inside('004A0CB0', personId=pid, requestedLocationId=normalized):
                    if self.actor()['allocated']:
                        self.actor()['locationId'] = normalized
                        if self.w['observerPresent']:
                            self.boundary('location-observer', 'effect', 'observer.virtual1B4',
                                          dict(nativeArgs=[0, 0, 0, 0], caller='004B9480'))
            if not 0 <= self.force_id(pid) <= 46: return
            compare = self.force_id(pid)
            self.stack[-1]['locals']['savedAffiliationCompareForceId'] = compare
            if compare != self.target_force(bid, 'affiliation'): return
            self.legion_setter(pid, self.base_legion(bid))
            new = self.base_legion(bid)
            if self.get('legions', new) is None: new = -1
            self.stack[-1]['locals']['savedNewLegionId'] = new
            if old_status <= 1 and self.valid('legions', old_legion) and old_legion != new:
                self.legion(old_legion)
            self.legion(new)
            if self.valid('buildings', old_home) and self.base_legion(bid) != self.base_legion(old_home):
                self.governor(old_home)

    def at_home(self, pid, stage):
        with self.inside('00489730', personId=pid, stage=stage):
            p = self.get('persons', pid)
            home = p['homeBaseId'] if 0 <= p['homeBaseId'] <= 86 else -1
            location = p['locationId']
            if home != location: return False
            with self.inside('004896C0', personId=pid,
                             comparedHomeId=home, comparedLocationId=location):
                route = self.boundary('route:' + stage, 'effect-query', '005BA320',
                                     dict(personId=pid, arg1=0, arg2=0, stage=stage), False)
            if route: return False
            p = self.get('persons', pid)
            return self.valid('buildings', p['homeBaseId']) and self.base_legion(p['homeBaseId']) == p['rawLegionId']

    def rank(self, candidates, stage, leader):
        if len(candidates) < 2: return list(candidates)
        if any(not self.valid('persons', pid) for pid in candidates):
            raise RuntimeError('unsupported-invalid-ranking-candidate')
        comparator, flag = ('004CEF90', 1) if leader else ('004CF160', 0)
        with self.inside('004AA200', stage=stage, comparator=comparator,
                         sortFlag=flag, candidateIds=candidates):
            return self.boundary('rank:' + stage, 'effect-query', '004AA200', dict(
                stage=stage, comparator=comparator, sortFlag=flag,
                candidateIds=candidates, extra0=0, extra1=0), list(candidates))

    def assign_governor(self, bid, selected):
        with self.inside('004B3A20', buildingId=bid, requestedPersonId=selected):
            if not self.valid('buildings', bid) or (selected is not None and not self.valid('persons', selected)): return
            old = self.governor_id(bid)
            if self.valid('persons', old) and old != selected:
                self.emit(dict(id=8, subjectType='person', subjectId=old, argument=0))
            self.governor_id(bid)
            if self.subtype(bid): self.get('buildings', bid)['governorId'] = -1 if selected is None else selected

    def governor(self, bid):
        self.role_calls.append(('governor', bid))
        with self.inside('004BCA30', buildingId=bid, refreshFlag=0):
            if not self.valid('buildings', bid): return
            roster = list(self.get('buildings', bid)['homeRosterIds']) if self.subtype(bid) else []
            collected = [pid for pid in roster if self.get('persons', pid)['allocated'] and 0 <= self.get('persons', pid)['status'] <= 3]
            legion = self.base_legion(bid)
            candidates = []
            with self.inside('004BC870', buildingId=bid, savedLegionId=legion, candidateIds=collected):
                for pid in collected:
                    p = self.get('persons', pid)
                    if p['allocated'] and p['rawLegionId'] == legion and self.at_home(pid, 'governor:' + str(bid)):
                        candidates.append(pid)
            shortcut = [pid for pid in candidates if self.get('persons', pid)['status'] <= 1]
            selected = shortcut[-1] if shortcut else None
            if candidates and selected is None:
                with self.inside('004B2090', buildingId=bid, candidateIds=candidates):
                    ranked = self.rank(candidates, 'governor:' + str(bid), False)
                    selected = ranked[0] if ranked else None
            old = self.governor_id(bid)
            if self.valid('persons', old) and self.get('persons', old)['status'] == 2:
                home = self.get('persons', old)['homeBaseId']
                if home == bid or (self.valid('buildings', home) and self.governor_id(home) != old):
                    self.set_status(old, 3)
            if selected is not None and self.valid('persons', selected):
                if self.get('persons', selected)['status'] not in (0, 1): self.set_status(selected, 2)
                self.assign_governor(bid, selected)
            else:
                self.assign_governor(bid, None)
                self.emit(dict(id=14, subjectType='building', subjectId=bid, argument=0))

    def legion(self, lid):
        self.role_calls.append(('legion', lid))
        with self.inside('004BE2A0', legionId=lid):
            if not self.valid('legions', lid): return
            fid = self.get('legions', lid)['forceId']
            if not 0 <= fid <= 41: return
            people = [p for p in self.w['persons'] if self.valid('forces', fid) and p['allocated'] and self.force_id(p['id']) == fid and 0 <= self.get('persons', p['id'])['status'] <= 3]
            cities = [c for c in self.w['cities'] if c['valid']]
            force_cities = [c for c in cities if self.valid('legions', self.get('buildings', c['id'])['legionId']) and self.get('legions', self.get('buildings', c['id'])['legionId'])['forceId'] == fid]
            if not people or not force_cities: raise RuntimeError('unsupported-force-extinction')
            members = [p['id'] for p in self.w['persons'] if p['valid'] and p['rawLegionId'] == lid]
            if not members or not any(self.get('buildings', c['id'])['legionId'] == lid for c in cities):
                raise RuntimeError('unsupported-empty-legion-redistribution')
            old = self.get('legions', lid)['leaderId']
            old = old if self.get('persons', old) is not None else None
            copied = sorted(members)
            with self.inside('004BE2A0/stable', legionId=lid, forceId=fid,
                             oldLeaderId=old, candidateIds=copied):
                ranked = self.rank(copied, 'leader', True)
                if not ranked: raise RuntimeError('unsupported-empty-leader-after-sort')
                selected = ranked[0]
                with self.inside('004BE2A0/roles', legionId=lid,
                                 oldLeaderId=old, selectedLeaderId=selected):
                    if old is not None and self.valid('persons', old) and self.get('persons', old)['status'] == 1:
                        home = self.get('persons', old)['homeBaseId']
                        home = home if self.get('buildings', home) is not None else None
                        differ = self.get('persons', old)['homeBaseId'] != self.get('persons', selected)['homeBaseId']
                        with self.inside('004BE2A0/old-leader', oldLeaderId=old,
                                         savedHomeId=home, homesDiffer=differ):
                            keep = differ and self.at_home(old, 'old-leader') and home is not None and self.valid('buildings', home) and self.governor_id(home) == old
                            if keep: self.set_status(old, 2)
                            else:
                                if home is not None and self.valid('buildings', home) and self.governor_id(home) == old:
                                    self.assign_governor(home, None)
                                self.set_status(old, 3)
                    if self.get('persons', selected)['status'] != 0:
                        self.set_status(selected, 1)
                        if self.at_home(selected, 'new-leader'):
                            home = self.get('persons', selected)['homeBaseId']
                            if self.valid('buildings', home):
                                old_gov = self.governor_id(home)
                                if self.valid('persons', old_gov) and self.get('persons', old_gov)['status'] == 2 and old_gov != selected:
                                    self.set_status(old_gov, 3)
                                self.assign_governor(home, selected)
                    if self.valid('legions', lid): self.get('legions', lid)['leaderId'] = selected
                    for bid in sorted(b['id'] for b in self.w['buildings'] if b['id'] <= 86):
                        if self.canonical(bid) and self.base_legion(bid) == lid: self.governor(bid)

    def run(self):
        entry, args = self.f[1]['entry'], self.f[1]['args']
        if entry == 'event': self.emit(args)
        elif entry == 'return': self.return_native(**args)
        elif entry == 'legion': self.legion(args['targetId'])
        else: self.governor(args['targetId'])
        self.f[2]['records'] = copy.deepcopy(self.records)
        return self


class RecursiveTests(unittest.TestCase):
    def check_oracle(self, f, **kw):
        expected = Oracle(f, **kw).run()
        before = copy.deepcopy(f)
        t = run(f)
        self.assertTrue(t['accepted'], t['reason'])
        self.assertEqual(t['after']['frame'], expected.w)
        self.assertEqual(t['events'], expected.events)
        self.assertEqual(t['returnCalls'], expected.return_calls)
        self.assertEqual(t['observedEffects'], [r for r in expected.records if r['kind'] != 'query'])
        self.assertEqual(t['queries'], [r for r in expected.records if r['kind'] == 'query'])
        self.assertEqual(t['after']['revision'], f[0]['revision'] + 1)
        self.assertEqual(len(t['after']['appliedCommands']), len(f[0]['appliedCommands']) + 1)
        self.assertEqual(f, before)
        self.assertEqual(t, m.replay_recursive_officer_return(json.loads(json.dumps(t))))
        return t

    def atomic_error(self, f):
        original = copy.deepcopy(f)
        with self.assertRaises(ValueError): run(f)
        self.assertEqual(f, original)

    def atomic_defer(self, f, reason):
        original = copy.deepcopy(f)
        t = run(f)
        self.assertFalse(t['accepted'])
        self.assertEqual(t['reason'], reason)
        self.assertEqual(t['after'], f[0])
        self.assertEqual(t['steps'], [])
        self.assertEqual(t['events'], [])
        self.assertEqual(f, original)
        self.assertEqual(t, m.replay_recursive_officer_return(t))
        return t

    def test_01_recursive_native_all_entries_sources(self):
        for entry, source in itertools.product(('event', 'return', 'legion', 'governor'), ('S1', 'S2')):
            with self.subTest(entry=entry, source=source):
                t = self.check_oracle(fixture(entry=entry, source=source))
                self.assertNotIn('004BF6F0', [r['helper'] for r in t['observedEffects']])
                self.assertEqual(t['evidence']['engineGuardIsOriginalRule'], False)

    def test_02_listener_registry_exhaustive_away(self):
        for event, source, mission in itertools.product((8, 14), ('S1', 'S2'), range(-1, 45)):
            f = fixture(event=event, source=source, home=1)
            row(f[0]['frame'])['missionId'] = mission
            t = self.check_oracle(f)
            self.assertEqual(t['events'][0]['visits'][0]['route'] == 'handler-called', mission == (23 if event == 8 else 24))

    def test_03_nested_return_has_single_transaction(self):
        f = fixture()
        w = f[0]['frame']
        w['activePersonIds'] = [7, 7, 9]
        row(w, 0, 'buildings')['governorId'] = 9
        t = self.check_oracle(f)
        self.assertGreater(len(t['events']), 1)
        self.assertEqual(t['returnCalls'], 1)
        self.assertEqual(t['after']['revision'], 1)
        self.assertEqual(len(t['after']['appliedCommands']), 1)
        self.assertEqual(t['events'][0]['copiedActivePersonIds'], [7, 7, 9])
        self.assertEqual(t['events'][0]['visits'][1]['route'], 'mission-range-skip')
        self.assertTrue(all(e['parentEventIndex'] == 0 for e in t['events'][1:]))


    def test_04_real_nested_governor_events_restore_parent_context(self):
        for source in ('S1', 'S2'):
            f = fixture(entry='governor', source=source)
            w = f[0]['frame']
            row(w, 0, 'buildings')['governorId'] = 9
            row(w, 9).update(status=2, rawLegionId=-1)
            w['persons'].append(person(10, status=5, missionId=23, rawLegionId=-1))
            w['activePersonIds'] = [7, 10, 7]
            def effect(stage, v, c):
                if stage == 'route:new-leader': v['activePersonIds'] = [7, 7]
                return 0
            t = self.check_oracle(f, effect=effect)
            self.assertGreaterEqual(len(t['events']), 2)
            outer, inner = t['events'][:2]
            self.assertEqual(outer['event']['id'], 8)
            self.assertEqual(inner['parentEventIndex'], outer['eventIndex'])
            self.assertEqual(outer['copiedActivePersonIds'], [7, 10, 7])
            self.assertEqual(inner['copiedActivePersonIds'], [7, 7])
            self.assertEqual(outer['visits'][1]['handlerReturn'], 1)
            self.assertEqual(inner['visits'][0]['route'], 'mission-range-skip')
            self.assertEqual(row(t['after']['frame'], 10)['missionId'], -1)
            self.assertEqual(row(t['after']['frame'], 0, 'buildings')['governorId'], 7)
            self.assertEqual(t['returnCalls'], 1)
            self.assertEqual(t['after']['revision'], 1)
            self.assertEqual(t['after']['frame']['activePersonIds'], [7, 7])

    def test_05_s2_mutable_query267_changes_native_return_entry(self):
        for answer, initial_status in itertools.product((False, True), (3, 5)):
            f = fixture(source='S2')
            row(f[0]['frame'])['status'] = initial_status
            def effect(stage, v, c):
                if stage == 'query267':
                    row(v).update(status=6, rawDword17C=0, flags124=0)
                    v.update(managerDirty=0, observerPresent=True, rngState=72)
                return 3
            t = self.check_oracle(f, effect=effect, query267=answer)
            self.assertEqual(row(t['after']['frame'])['flags124'], 0 if answer else 1)
            self.assertEqual(t['after']['frame']['managerDirty'], 0 if answer else 1)
            self.assertEqual(t['returnCalls'], 1)
            self.assertFalse(row(t['after']['frame'])['valid'])
            self.assertEqual(t['observedEffects'][0]['helper'], '004890F0')
            self.assertEqual(t['observedEffects'][0]['before']['persons'][0]['missionId'], -1)
            self.assertEqual(t['rng']['observedCalls'], 6 if answer else 9)
        f = fixture(source='S1')
        row(f[0]['frame'])['status'] = 5
        t = self.check_oracle(f)
        self.assertNotIn('004890F0', helpers(t))

    def test_06_presentation_saved_handler_live_tail_and_return_saved_home(self):
        f = fixture()
        w = f[0]['frame']; w['forces'][0]['playerIndex'] = 0
        def effect(stage, v, c):
            if stage == 'presentation':
                row(v).update(homeBaseId=1, locationId=1, missionId=42)
                row(v, 0, 'forces')['raw44'] = 456
                v['data']['nested']['value'] = 81
            return 2
        t = self.check_oracle(f, effect=effect)
        presentation = t['observedEffects'][0]
        self.assertEqual(presentation['args']['savedForce44'], 9)
        targets = [s for s in t['steps'] if s['helper'] == '004A31E0/allocated']
        self.assertEqual(targets[0]['callStack'][-1]['locals']['requestedHomeId'], 1)
        self.assertEqual(row(t['after']['frame'])['homeBaseId'], 1)
        self.assertEqual(t['after']['frame']['data']['nested']['value'], 81)
        # The acted observer changes home after the tail saved it; native return
        # must still receive old home 0, then read live person fields itself.
        f = fixture(); f[0]['frame']['observerPresent'] = True
        def changed_home(stage, v, c):
            if stage == 'acted-observer': row(v)['homeBaseId'] = 1
            return 0
        t = self.check_oracle(f, effect=changed_home)
        returns = [s for s in t['steps'] if s['helper'] == '0047A630/actor']
        self.assertEqual(returns[0]['callStack'][-1]['locals']['targetBuildingId'], 0)
        self.assertEqual(row(t['after']['frame'])['homeBaseId'], 0)

    def test_07_roster_first_remove_append_sort_full_mutable_boundary(self):
        f = fixture(entry='return')
        w = f[0]['frame']; row(w, 0, 'buildings')['homeRosterIds'] = [9, 7, 7, 9]
        row(w, 0, 'legions')['rosterIds'] = [7, 9, 7]
        def effect(stage, v, c):
            if stage == 'roster-sort':
                a = c['args']; seq = row(v, a['rosterId'], a['table'])[a['rosterField']]
                seq.reverse(); v['rngState'] += 1
            return 1
        t = self.check_oracle(f, effect=effect)
        sorts = [r for r in t['observedEffects'] if r['helper'] == '0047CD50']
        self.assertEqual(sorts[0]['before']['buildings'][0]['homeRosterIds'], [9, 7, 9, 7])
        self.assertEqual(sorts[1]['before']['legions'][0]['rosterIds'], [9, 7, 7])
        self.assertEqual(row(t['after']['frame'], 0, 'buildings')['homeRosterIds'], [7, 9, 7, 9])
        self.assertEqual(row(t['after']['frame'], 0, 'legions')['rosterIds'], [7, 7, 9])
        self.assertEqual(t['rng']['finalState'], 10)

    def test_08_at_home_cached_location_live_home_after_route(self):
        f = fixture(entry='governor'); f[0]['frame']['activePersonIds'] = []
        def effect(stage, v, c):
            if stage == 'route:governor:0': row(v).update(homeBaseId=1, locationId=999)
            return 0
        t = self.check_oracle(f, effect=effect)
        self.assertEqual(row(t['after']['frame'], 0, 'buildings')['governorId'], 7)
        self.assertEqual(row(t['after']['frame'])['locationId'], 999)
        self.assertEqual(row(t['after']['frame'])['status'], 2)

    def test_09_governor_saved_legion_and_live_postfilter_shortcut(self):
        for shortcut in (False, True):
            f = fixture(entry='governor'); w = f[0]['frame']; w['activePersonIds'] = []
            row(w).update(homeBaseId=1, locationId=1)
            row(w, 9).update(status=3, homeBaseId=1, locationId=1)
            row(w, 0, 'buildings')['homeRosterIds'] = [7, 9]
            def effect(stage, v, c):
                if stage == 'route:governor:0':
                    row(v, 0, 'buildings')['legionId'] = 46
                    if shortcut and c['args']['personId'] == 9:
                        row(v)['status'] = 0; row(v, 9)['status'] = 1
                if stage == 'rank:governor:0': return {'result': [9, 7], 'count': 0}
                return 0
            t = self.check_oracle(f, effect=effect)
            self.assertEqual(row(t['after']['frame'], 0, 'buildings')['governorId'], 9)
            routes = [r for r in t['observedEffects'] if r['helper'] == '005BA320']
            self.assertEqual(len(routes), 2)
            self.assertEqual(routes[1]['callStack'][1]['locals']['savedLegionId'], 0)
            self.assertEqual(any(r['helper'] == '004AA200' for r in t['observedEffects']), not shortcut)

    def test_10_duplicate_candidate_kept_then_rechecked_allocation(self):
        f = fixture(entry='governor'); w = f[0]['frame']; w['activePersonIds'] = []
        row(w, 0, 'buildings')['homeRosterIds'] = [7, 7]
        def effect(stage, v, c):
            if stage == 'route:governor:0': row(v).update(status=9, rawDword17C=0)
            return 0
        t = self.check_oracle(f, effect=effect)
        self.assertEqual(sum(r['helper'] == '005BA320' for r in t['observedEffects']), 1)
        self.assertEqual([e['event']['id'] for e in t['events']], [14])
        self.assertEqual(row(t['after']['frame'], 0, 'buildings')['governorId'], -1)

    def test_11_governor_event_prewrite_and_live_subtype_only_gate(self):
        for case in ('invalid-person', 'invalid-building-observation-only', 'invalid-kind', 'invalid-subtype'):
            f = fixture(entry='governor'); w = f[0]['frame']
            w.update(activePersonIds=[], observerPresent=True)
            row(w, 0, 'buildings')['governorId'] = 9
            row(w, 9)['status'] = 2
            def effect(stage, v, c):
                if stage == 'event-observer':
                    if case == 'invalid-person': row(v).update(status=6, rawDword17C=0)
                    elif case == 'invalid-building-observation-only':
                        # Explicit observed-getter-domain fixture; canonical
                        # reachability is not claimed for valid=False/kind=0.
                        row(v, 0, 'buildings')['valid'] = False
                    elif case == 'invalid-kind': row(v, 0, 'buildings').update(valid=False, kind=64)
                    else:
                        row(v, 0, 'buildings')['subtypeValid'] = False
                        row(v, 0, 'cities')['valid'] = False
                return 0
            t = self.check_oracle(f, effect=effect)
            observer = [r for r in t['observedEffects'] if r['args'].get('caller') == '004BBAA0'][0]
            self.assertEqual(row(observer['before'], 0, 'buildings')['governorId'], 9)
            self.assertEqual(row(t['after']['frame'], 0, 'buildings')['governorId'], 9 if case in ('invalid-subtype', 'invalid-kind') else 7)

    def test_12_event14_unconditional_after_recursive_event8_mutation(self):
        f = fixture(entry='governor'); w = f[0]['frame']
        w.update(activePersonIds=[], observerPresent=True)
        row(w, 0, 'buildings').update(governorId=9, homeRosterIds=[])
        def effect(stage, v, c):
            if stage == 'event-observer': row(v, 0, 'buildings').update(valid=False, kind=64)
            return 0
        t = self.check_oracle(f, effect=effect)
        self.assertEqual([e['event']['id'] for e in t['events']], [8, 14])
        self.assertEqual(row(t['after']['frame'], 0, 'buildings')['governorId'], 9)

    def test_13_old_leader_saved_before_sort_and_selected_live_ruler(self):
        f = fixture(entry='legion'); w = f[0]['frame']; w['activePersonIds'] = []
        row(w).update(status=1, locationId=999)
        row(w, 9).update(status=3, locationId=999)
        w['persons'].append(person(10, status=1, locationId=999))
        row(w, 0, 'legions')['leaderId'] = 7
        def effect(stage, v, c):
            if stage == 'rank:leader':
                row(v, 0, 'legions')['leaderId'] = 10
                row(v, 9)['status'] = 0
                return {'result': [9, 7, 10], 'count': 0}
            return 0
        t = self.check_oracle(f, effect=effect)
        self.assertEqual(row(t['after']['frame'])['status'], 3)
        self.assertEqual(row(t['after']['frame'], 9)['status'], 0)
        self.assertEqual(row(t['after']['frame'], 10)['status'], 1)
        self.assertEqual(row(t['after']['frame'], 0, 'legions')['leaderId'], 9)

    def test_14_saved_old_home_across_route_callback(self):
        f = fixture(entry='legion'); w = f[0]['frame']; w['activePersonIds'] = []
        row(w).update(status=1)
        row(w, 9).update(status=3, homeBaseId=42, locationId=999)
        row(w, 0, 'legions')['leaderId'] = 7
        row(w, 0, 'buildings').update(governorId=7, homeRosterIds=[])
        def effect(stage, v, c):
            if stage == 'rank:leader': return {'result': [9, 7], 'count': 0}
            if stage == 'route:old-leader': row(v).update(homeBaseId=1, locationId=333)
            return 0
        t = self.check_oracle(f, effect=effect)
        statuses = [s for s in t['steps'] if s['helper'] == '004898F0' and s['id'] == 7]
        self.assertEqual(statuses[0]['value'], 2)
        route = next(r for r in t['observedEffects'] if r['args'].get('stage') == 'old-leader')
        self.assertEqual(route['callStack'][-3]['locals']['savedHomeId'], 0)
        self.assertEqual(row(t['after']['frame'])['homeBaseId'], 1)

    def test_15_selected_pointer_no_validity_gate_legion_revalidation(self):
        for invalidate_legion in (False, True):
            f = fixture(entry='legion'); w = f[0]['frame']
            w.update(activePersonIds=[], observerPresent=True)
            row(w, 0, 'buildings')['governorId'] = 9
            row(w, 9).update(status=2)
            def effect(stage, v, c):
                if stage == 'rank:leader':
                    row(v).update(status=6, rawDword17C=0, locationId=999)
                    return {'result': [7, 9], 'count': 0}
                if stage == 'event-observer' and invalidate_legion:
                    row(v, 0, 'legions').update(valid=False, forceId=-1)
                return 0
            t = self.check_oracle(f, effect=effect)
            self.assertEqual(row(t['after']['frame'])['status'], 1)
            # Status promotion revalidates the saved candidate. Its away
            # location skips new-governor assignment; a later empty-governor
            # event can still invalidate the legion after its leader write.
            self.assertTrue(row(t['after']['frame'])['valid'])
            self.assertEqual(row(t['after']['frame'], 0, 'legions')['leaderId'], 7)
        f = fixture(entry='legion'); w = f[0]['frame']
        w.update(activePersonIds=[], observerPresent=True)
        row(w, 0, 'buildings')['governorId'] = 9
        row(w, 9).update(status=2)
        def invalidates(stage, v, c):
            if stage == 'event-observer': row(v, 0, 'legions').update(valid=False, forceId=-1)
            return 0
        t = self.check_oracle(f, effect=invalidates)
        self.assertEqual(row(t['after']['frame'], 0, 'legions')['leaderId'], -1)
        self.assertIn('004A0940/no-op', helpers(t))

    def test_16_target_force_callback_and_saved_comparison(self):
        f = fixture(entry='return'); w = f[0]['frame']
        w['legions'].append(dict(copy.deepcopy(w['legions'][0]), id=1, forceId=1))
        w['forces'].append(dict(copy.deepcopy(w['forces'][0]), id=1))
        def effect(stage, v, c):
            if stage == 'target-force:affiliation':
                row(v)['rawLegionId'] = 1
                return {'result': 0, 'count': 0}
            return 0
        t = self.check_oracle(f, effect=effect)
        self.assertEqual(row(t['after']['frame'])['rawLegionId'], 0)
        self.assertEqual(row(t['after']['frame'], 0, 'legions')['leaderId'], 7)
        target = next(r for r in t['observedEffects'] if r['helper'] == '00487EB0/virtual+40')
        self.assertEqual(target['callStack'][-1]['locals']['savedAffiliationCompareForceId'], 0)

    def test_17_city_alias_validity_separate_from_building_and_schema(self):
        f = fixture(entry='legion'); w = f[0]['frame']; w['activePersonIds'] = []
        row(w).update(status=0, locationId=999)
        row(w, 0, 'buildings').update(valid=False, kind=64)
        t = self.check_oracle(f)
        self.assertEqual(row(t['after']['frame'], 0, 'legions')['leaderId'], 7)
        for table, field in (('buildings', 'subtypeValid'), ('cities', 'valid')):
            f = fixture(); row(f[0]['frame'], 0, table)[field] = False
            self.atomic_error(f)
        f = fixture(); f[0]['frame']['cities'] = [f[0]['frame']['cities'][0]]
        self.atomic_error(f)
        f = fixture(); f[0]['frame']['cities'].append(dict(id=2, valid=False, data={}))
        self.atomic_error(f)

    def test_18_sparse_scans_allowed_reached_slots_missing_fail(self):
        f = fixture(entry='legion'); w = f[0]['frame']; w['activePersonIds'] = []
        self.assertEqual(self.check_oracle(f)['after']['frame']['persons'][0]['status'], 1)
        for problem in ('old-governor', 'raw-legion', 'force', 'home', 'active-person'):
            f = fixture(entry='return'); w = f[0]['frame']
            if problem == 'old-governor': row(w, 0, 'buildings')['governorId'] = 1099
            elif problem == 'raw-legion': row(w)['rawLegionId'] = 46
            elif problem == 'force': row(w, 0, 'legions')['forceId'] = 46
            elif problem == 'home': row(w)['homeBaseId'] = 86
            else:
                f[1].update(entry='event', args=dict(id=8, subjectType='person', subjectId=9, argument=0))
                w['activePersonIds'] = [1099]
            self.atomic_error(f)

    def test_19_force_extinction_empty_legion_and_ruler_defer_atomically(self):
        f = fixture(entry='legion'); row(f[0]['frame'])['status'] = 5
        self.atomic_defer(f, 'unsupported-force-extinction')
        f = fixture(entry='legion'); w = f[0]['frame']
        w['legions'].append(dict(copy.deepcopy(w['legions'][0]), id=1))
        for b in w['buildings']: b['legionId'] = 1
        self.atomic_defer(f, 'unsupported-empty-legion-redistribution')
        f = fixture(entry='return'); w = f[0]['frame']
        row(w)['status'] = 0; row(w, 0, 'forces')['field128'] = 0
        oracle = Oracle(f)
        with self.assertRaisesRegex(RuntimeError, 'unsupported-ruler-ownership'): oracle.run()
        f[2]['records'] = oracle.records
        self.atomic_defer(f, 'unsupported-ruler-ownership')
        # Native return writes home/location/legion before role failure; none commit.
        f = fixture(entry='return', home=1, location=1); w = f[0]['frame']
        row(w)['status'] = 5
        oracle = Oracle(f)
        with self.assertRaisesRegex(RuntimeError, 'unsupported-force-extinction'): oracle.run()
        f[2]['records'] = oracle.records
        self.atomic_defer(f, 'unsupported-force-extinction')

    def test_20_engine_guards_and_reject_effect_are_atomic(self):
        f = fixture(entry='governor'); w = f[0]['frame']
        row(w, 0, 'buildings')['governorId'] = 9
        row(w, 9).update(status=2, rawLegionId=-1)
        Oracle(f).run()
        f[3]['engineGuard']['maxEventDepth'] = 1
        t = self.atomic_defer(f, 'engine-guard-event-depth')
        self.assertFalse(t['evidence']['engineGuardIsOriginalRule'])
        f = fixture(); Oracle(f).run(); f[3]['engineGuard']['maxNativeCalls'] = 3
        self.atomic_defer(f, 'engine-guard-native-call-budget')
        f = fixture(); f[3]['unknownEffects'] = 'reject'
        t = self.atomic_defer(f, 'unresolved-effect:00487EB0/virtual+40')
        self.assertTrue(t['observedEffects'][-1]['deferred'])
        f = fixture(); row(f[0]['frame'])['status'] = 5
        f[3]['unknownEffects'] = 'reject'
        self.assertTrue(self.check_oracle(f)['accepted'])

    def test_21_exact_boundary_binding_missing_unused_stale_reordered(self):
        for problem in ('missing', 'unused', 'source', 'record-source', 'helper', 'kind', 'args', 'before', 'stack', 'stack-local', 'index', 'reorder'):
            f = fixture(); f[0]['frame']['observerPresent'] = True
            Oracle(f).run(); rs = f[2]['records']; r = rs[-1]
            if problem == 'missing': rs.pop()
            elif problem == 'unused': rs.append(dict(copy.deepcopy(r), index=len(rs)))
            elif problem == 'source': f[2]['source'] = 'S2'
            elif problem == 'record-source': r['source'] = 'S2'
            elif problem == 'helper': r['helper'] = '004BF6F0'
            elif problem == 'kind': r['kind'] = 'query'
            elif problem == 'args': r['args']['caller'] = '004B9480'
            elif problem == 'before': r['before']['rngState'] += 1
            elif problem == 'stack': r['callStack'] = copy.deepcopy(rs[0]['callStack'])
            elif problem == 'stack-local': r['callStack'][0]['locals']['event']['argument'] += 1
            elif problem == 'index': r['index'] = 0
            else:
                rs[0], rs[1] = rs[1], rs[0]
                rs[0]['index'], rs[1]['index'] = 0, 1
            with self.subTest(problem=problem): self.atomic_error(f)

    def test_22_strict_schema_domains_and_observation_results(self):
        for problem in ('command-extra', 'bad-entry', 'args-extra', 'bool-person', 'bool-revision', 'policy-extra', 'old-frame', 'guard-zero', 'guard-bool', 'guard-extra', 'float-data', 'extra-person', 'bad-roster', 'bool-byte', 'overflow-word', 'extra-observation', 'empty-stack', 'bad-rng', 'domain-slot', 'domain-data', 'alias-after'):
            f = fixture(entry='return'); Oracle(f).run()
            if problem == 'command-extra': f[1]['personId'] = 7
            elif problem == 'bad-entry': f[1]['entry'] = 'handler'
            elif problem == 'args-extra': f[1]['args']['refund'] = 0
            elif problem == 'bool-person': f[1]['args']['personId'] = True
            elif problem == 'bool-revision': f[0]['revision'] = True
            elif problem == 'policy-extra': f[3]['callbackAssumption'] = 'noninterference-v1'
            elif problem == 'old-frame': f[0]['frame'] = frames.tail_snapshot(f[0]['frame'])
            elif problem == 'guard-zero': f[3]['engineGuard']['maxEventDepth'] = 0
            elif problem == 'guard-bool': f[3]['engineGuard']['maxNativeCalls'] = True
            elif problem == 'guard-extra': f[3]['engineGuard']['originalNativeDepth'] = 32
            elif problem == 'float-data': f[0]['frame']['data']['nested']['value'] = 0.5
            elif problem == 'extra-person': row(f[0]['frame'])['unknown'] = 1
            elif problem == 'bad-roster': row(f[0]['frame'], 0, 'buildings')['homeRosterIds'] = [1099]
            elif problem == 'bool-byte': row(f[0]['frame'])['leadershipByte'] = True
            elif problem == 'overflow-word': row(f[0]['frame'])['rawWordAE'] = 65536
            elif problem == 'extra-observation': f[2]['records'][0]['extra'] = 0
            elif problem == 'empty-stack': f[2]['records'][0]['callStack'] = []
            elif problem == 'bad-rng': f[2]['records'][0]['rngConsumption'] = dict(kind='unknown', calls=0)
            elif problem == 'domain-slot': f[2]['records'][0]['after']['persons'].append(person(10))
            elif problem == 'domain-data': f[2]['records'][0]['after']['data']['new'] = 4
            else: row(f[2]['records'][0]['after'], 0, 'cities')['valid'] = False
            with self.subTest(problem=problem): self.atomic_error(f)
        for helper, bads in [('005BA320', [0, 1, None, 'false']), ('004AA200', [[1099], [7, 7, 9], [True], 7]), ('00487EB0/virtual+40', [True, None, 2**31])]:
            for bad in bads:
                f = fixture(); Oracle(f).run()
                record = next(r for r in f[2]['records'] if r['helper'] == helper)
                record['result'] = bad
                with self.subTest(helper=helper, bad=bad): self.atomic_error(f)

    def test_23_replay_hash_conflict_revision_and_output_isolation(self):
        f = fixture(); t = self.check_oracle(f)
        replay = copy.deepcopy(f); replay[0] = copy.deepcopy(t['after'])
        r = run(replay)
        self.assertTrue(r['accepted']); self.assertTrue(r['replayed'])
        self.assertEqual(r['after'], t['after']); self.assertEqual(r['steps'], [])
        replay[1]['args']['argument'] += 1
        r = run(replay); self.assertEqual(r['reason'], 'replay-payload-conflict')
        f[1]['expectedRevision'] = 1
        self.assertEqual(run(f)['reason'], 'revision-conflict')
        f = fixture(); f[0]['revision'] = f[1]['expectedRevision'] = 2**31 - 1
        self.atomic_error(f)
        for change in ('hash', 'frame', 'evidence', 'extra'):
            bad = copy.deepcopy(t)
            if change == 'hash': bad['traceHash'] = '0' * 64
            elif change == 'frame': row(bad['after']['frame'])['status'] = 5
            elif change == 'evidence': bad['evidence']['machineCodeExecuted'] = True
            else: bad['extra'] = 1
            if change != 'hash':
                bad.pop('traceHash'); bad['traceHash'] = digest(bad)
            with self.assertRaises(ValueError): m.replay_recursive_officer_return(bad)
        untouched = copy.deepcopy(t)
        row(t['after']['frame'])['data']['note'] = 'changed'
        self.assertEqual(row(t['before']['frame'])['data']['note'], 'keep')
        self.assertEqual(row(t['observations']['records'][0]['before'])['data']['note'], 'keep')
        self.assertEqual(row(untouched['after']['frame'])['data']['note'], 'keep')

    def test_24_rng_unknown_and_assumption_evidence_not_native_claims(self):
        f = fixture(); f[3]['ruleset'] = 'PC-Vanilla-assumed'
        def effect(stage, v, c):
            v['rngState'] = (v['rngState'] + 73) & 0xffffffff
            return None if c['index'] == 0 else 2
        t = self.check_oracle(f, effect=effect)
        self.assertFalse(t['rng']['allCountsKnown']); self.assertIsNone(t['rng']['observedCalls'])
        self.assertEqual(t['rng']['localCalls'], 0)
        self.assertFalse(t['rng']['globalConsumptionVerified'])
        self.assertEqual(t['evidence']['runtimeStatus'], 'compatibility-assumption')
        for key in ('machineCodeExecuted', 'stockVerified', 'vanillaVerified', 'observationAuthenticityVerified', 'completeGameTransaction', 'callbacksAssumedNoninterfering'):
            self.assertFalse(t['evidence'][key])

    def test_25_legacy_transactions_never_instantiated_or_called(self):
        from contextlib import ExitStack
        import importlib
        modules = ['mission_event_composition_profile', 'mission_event_listener_profile',
                   'mission_notification_tail_profile', 'officer_return_finalizer_profile',
                   'legion_role_reconciliation_profile', 'return_mission_lifecycle_profile']
        f = fixture(); Oracle(f).run()
        with ExitStack() as stack:
            for name in modules:
                module = importlib.import_module(name)
                for attr in dir(module):
                    if attr.startswith('project_'):
                        stack.enter_context(patch.object(module, attr, side_effect=AssertionError('old transaction invoked')))
                if hasattr(module, '_Planner'):
                    stack.enter_context(patch.object(module._Planner, '__init__', side_effect=AssertionError('old planner instantiated')))
            self.assertTrue(run(f)['accepted'])

    def test_26_seeded_evolving_recursive_oracle(self):
        rng = random.Random(620061)
        for source in ('S1', 'S2'):
            f = fixture(entry='governor', source=source)
            w = f[0]['frame']; w['activePersonIds'] = [7, 7, 9]
            row(w, 0, 'buildings')['governorId'] = 9
            row(w, 9).update(status=2, rawLegionId=-1)
            for turn in range(128):
                if turn:
                    f[0] = copy.deepcopy(previous['after'])
                    w = f[0]['frame']
                # Evolve the committed model; every synthetic fixture mutation is
                # explicit between commands, while each command commits once.
                row(w).update(valid=True, allocated=True, status=rng.choice([0, 1, 2, 3]),
                              missionId=rng.choice([-1, 23, 24, 37]), homeBaseId=0,
                              locationId=rng.choice([0, 0, 1]), rawLegionId=0,
                              missionArgs=[0, 9, 3, 4, 5])
                row(w, 9).update(valid=True, allocated=True, rawLegionId=-1, status=5, missionId=-1)
                row(w, 0, 'buildings').update(governorId=rng.choice([-1, 7, 9]),
                                             homeRosterIds=rng.choice([[7], [7, 7]]))
                row(w, 0, 'legions').update(valid=True, leaderId=rng.choice([-1, 7]), rosterIds=[7])
                w['activePersonIds'] = rng.choice([[7], [7, 7], [9, 7, 9]])
                w['observerPresent'] = bool(rng.randrange(2))
                entry = rng.choice(['event', 'governor', 'legion', 'return'])
                f[1] = dict(id='stress-' + str(turn), expectedRevision=f[0]['revision'], entry=entry,
                    args=dict(id=8, subjectType='person', subjectId=9, argument=turn) if entry == 'event' else
                    dict(personId=7, targetBuildingId=0, showNotice=0, noticeVariant=1) if entry == 'return' else dict(targetId=0))
                def effect(stage, v, c):
                    # Every callback visibly evolves extension data and RNG.
                    v['data']['nested']['value'] += 1
                    v['rngState'] = (v['rngState'] + 1) & 0xffffffff
                    return 1
                with self.subTest(source=source, turn=turn, entry=entry):
                    previous = self.check_oracle(f, effect=effect, query267=bool(turn % 2))
                    self.assertEqual(previous['after']['revision'], turn + 1)


    def controller_fixture(self):
        f = fixture(entry='return'); w = f[0]['frame']
        w['activePersonIds'] = []
        w['persons'] = [person(7), person(9, homeBaseId=1, locationId=1, rawLegionId=1)]
        w['buildings'] = [building(i, legionId=i, homeRosterIds=[7] if i == 0 else [9] if i == 1 else []) for i in range(3)]
        w['cities'] = [dict(id=i, valid=True, data={}) for i in range(3)]
        w['legions'] = [dict(id=i, valid=True, forceId=42, number=1, leaderId=-1,
                             rosterIds=[7] if i == 0 else [9] if i == 1 else [], data={}) for i in range(4)]
        w['forces'] = [dict(id=i, valid=True, playerIndex=-1, raw44=9, field128=1, advisorId=-1, data={}) for i in (0, 42, 43)]
        f[1]['args']['targetBuildingId'] = 1
        return f

    def test_27_notice_saved_old_home_live_home_setter(self):
        f = self.controller_fixture(); w = f[0]['frame']
        f[1]['args']['showNotice'] = 1
        row(w, 42, 'forces')['playerIndex'] = 0
        row(w)['status'] = 1
        row(w, 2, 'buildings')['homeRosterIds'] = [7, 9]
        def effect(stage, v, c):
            if stage == 'return-notice': row(v).update(homeBaseId=2, rawLegionId=2, status=3)
            return 0
        t = self.check_oracle(f, effect=effect)
        self.assertEqual(row(t['after']['frame'], 0, 'buildings')['homeRosterIds'], [7])
        self.assertEqual(row(t['after']['frame'], 2, 'buildings')['homeRosterIds'], [9])
        self.assertEqual(row(t['after']['frame'], 1, 'buildings')['homeRosterIds'], [9, 7])
        self.assertEqual([s['buildingId'] for s in t['steps'] if s['helper'] == '004BCA30/entry'], [0])
        self.assertEqual([s['legionId'] for s in t['steps'] if s['helper'] == '004BE2A0/entry'], [0, 1])
        notice = next(r for r in t['observedEffects'] if r['helper'] == '004B93D0/004F55E0')
        self.assertEqual(notice['callStack'][-1]['locals']['savedOldHomeId'], 0)
        self.assertEqual(notice['callStack'][-1]['locals']['savedOldStatus'], 1)

    def test_28_home_sort_allocated_gates_troop_and_live_status(self):
        for allocated, troop in itertools.product((False, True), (False, True)):
            f = self.controller_fixture()
            def effect(stage, v, c):
                if stage == 'roster-sort' and c['args']['table'] == 'buildings':
                    row(v).update(homeBaseId=2, locationId=87, rawDword17C=0, status=6 if allocated else 9)
                return 0
            t = self.check_oracle(f, effect=effect, troop=troop)
            p = row(t['after']['frame'])
            self.assertEqual(p['homeBaseId'], 2)
            self.assertEqual(p['locationId'], 1 if allocated and not troop else 87)
            self.assertEqual(p['rawLegionId'], 1 if allocated else 0)
            self.assertEqual(p['status'], 6 if allocated else 9)
            self.assertEqual(p['allocated'], allocated)
            self.assertFalse(p['valid'])
            self.assertEqual(bool(p['flags124'] & 512), allocated)
            self.assertEqual(len(t['queries']), 1)
            self.assertEqual(t['queries'][0]['helper'], '004891C0')
            self.assertEqual([s['legionId'] for s in t['steps'] if s['helper'] == '004BE2A0/entry'], [1])

    def test_29_new_legion_saved_after_sort_across_real_old_role(self):
        f = self.controller_fixture(); w = f[0]['frame']
        row(w)['status'] = 1
        row(w, 9).update(status=0, homeBaseId=0, locationId=0, rawLegionId=0)
        row(w, 0, 'buildings')['homeRosterIds'] = [7, 9]
        row(w, 1, 'buildings')['homeRosterIds'] = []
        row(w, 0, 'legions').update(forceId=0, rosterIds=[7, 9])
        row(w, 1, 'legions').update(forceId=0, rosterIds=[9])
        def effect(stage, v, c):
            if stage == 'roster-sort' and c['args']['table'] == 'legions':
                row(v, 1, 'buildings')['legionId'] = 2
            if stage == 'route:governor:0': row(v, 1, 'buildings')['legionId'] = 3
            return 0
        t = self.check_oracle(f, effect=effect)
        entries = [s['legionId'] for s in t['steps'] if s['helper'] == '004BE2A0/entry']
        self.assertEqual(entries, [0, 2])
        self.assertEqual(row(t['after']['frame'])['rawLegionId'], 1)
        self.assertEqual(row(t['after']['frame'], 1, 'buildings')['legionId'], 3)
        self.assertEqual(sum(r['args'].get('stage') == 'governor:0' for r in t['observedEffects']), 2)

    def test_30_ruler_saved_force_pointer_and_live_field_after_query(self):
        for mutate_saved_field in (False, True):
            f = self.controller_fixture(); w = f[0]['frame']
            row(w)['status'] = 0
            row(w, 42, 'forces')['field128'] = 0
            row(w, 2, 'legions')['forceId'] = 43
            def effect(stage, v, c):
                if stage == 'target-force:ruler':
                    row(v).update(rawLegionId=2, status=3)
                    if mutate_saved_field: row(v, 42, 'forces')['field128'] = 1
                    row(v, 43, 'forces')['field128'] = 0
                    return {'result': 42, 'count': 0}
                if stage == 'target-force:affiliation': return {'result': 43, 'count': 0}
                return 0
            if mutate_saved_field:
                t = self.check_oracle(f, effect=effect)
                self.assertEqual(row(t['after']['frame'])['rawLegionId'], 1)
            else:
                oracle = Oracle(f, effect=effect)
                with self.assertRaisesRegex(RuntimeError, 'unsupported-ruler-ownership'): oracle.run()
                f[2]['records'] = oracle.records
                self.atomic_defer(f, 'unsupported-ruler-ownership')

    def test_31_location_observer_mutation_no_new_actor_or_status_gate(self):
        for allocated in (False, True):
            f = self.controller_fixture(); f[0]['frame']['observerPresent'] = True
            def effect(stage, v, c):
                if stage == 'location-observer':
                    row(v).update(rawDword17C=0, status=6 if allocated else 9)
                return 0
            t = self.check_oracle(f, effect=effect)
            self.assertEqual(row(t['after']['frame'])['rawLegionId'], 1 if allocated else 0)
            self.assertEqual(row(t['after']['frame'])['status'], 6 if allocated else 9)
            self.assertEqual(row(t['after']['frame'])['allocated'], allocated)
            self.assertFalse(row(t['after']['frame'])['valid'])
            self.assertIn('00487EB0/virtual+40', [r['helper'] for r in t['observedEffects']])
            self.assertEqual([s['legionId'] for s in t['steps'] if s['helper'] == '004BE2A0/entry'], [1])

    def test_32_full_recursive_loop_hits_explicit_maximum_depth(self):
        f = fixture(); w = f[0]['frame']
        row(w, 0, 'buildings')['governorId'] = 9
        row(w, 9).update(rawLegionId=-1)
        f[3]['engineGuard']['maxEventDepth'] = 32
        class BoundedOracle(Oracle):
            def emit(self, event):
                if len(self.event_stack) >= 32:
                    raise RuntimeError('independent depth fixture complete')
                return super().emit(event)
        def repeat_mission(stage, v, c):
            if stage == 'route:new-leader':
                row(v).update(missionId=23, missionArgs=[0, 9, 3, 4, 5])
            return 0
        oracle = BoundedOracle(f, effect=repeat_mission)
        with self.assertRaisesRegex(RuntimeError, 'independent depth fixture complete'): oracle.run()
        f[2]['records'] = oracle.records
        self.assertEqual(len(oracle.events), 32)
        self.assertEqual(oracle.return_calls, 32)
        t = self.atomic_defer(f, 'engine-guard-event-depth')
        self.assertFalse(t['evidence']['engineGuardIsOriginalRule'])
        self.assertEqual(t['after']['revision'], 0)


    def test_33_raw_person_predicate_boundary_truth_table(self):
        statuses = [-2**31, -1] + list(range(10)) + [2**31 - 1]
        raws = [0, 1, 0x7fffffff, 0x80000000, 0xffffffff]
        for source, status, raw in itertools.product(('S1', 'S2'), statuses, raws):
            f = fixture(source=source)
            p = row(f[0]['frame'])
            p.update(status=status, rawDword17C=raw, missionId=-1)
            refresh_person(p)
            # Expected booleans are an explicit three-way source truth table,
            # independent of the fixture helper and production predicate code.
            if raw:
                expected = (True, True)
            elif status in (6, 8):
                expected = (True, False)
            elif status in (0, 1, 2, 3, 4, 5, 7):
                expected = (True, True)
            else:
                expected = (False, False)
            with self.subTest(source=source, status=status, raw=raw):
                t = self.check_oracle(f)
                after = row(t['after']['frame'])
                self.assertEqual((after['allocated'], after['valid']), expected)
                self.assertEqual(after['status'], status)
                self.assertEqual(after['rawDword17C'], raw)

    def test_34_status_promotion_refreshes_nested_event_predicate(self):
        for source, status, raw in itertools.product(('S1', 'S2'),
                (6, 8, 9, -1, -2**31, 2**31 - 1), (0, 0xffffffff)):
            f = fixture(entry='legion', source=source, event=14)
            w = f[0]['frame']; w['activePersonIds'] = [7]
            row(w).update(missionId=24, missionArgs=[42, 9, 3, 4, 5])
            row(w, 9).update(status=3, locationId=999)
            def effect(stage, v, c):
                if stage == 'rank:leader':
                    row(v).update(status=status, rawDword17C=raw, locationId=999)
                    return {'result': [7, 9], 'count': 0}
                return 0
            with self.subTest(source=source, status=status, raw=raw):
                t = self.check_oracle(f, effect=effect)
                p = row(t['after']['frame'])
                self.assertEqual((p['status'], p['allocated'], p['valid']), (1, True, True))
                self.assertEqual(p['rawDword17C'], raw)
                gate_event = next(e for e in t['events'] if e['event']['id'] == 14 and e['event']['subjectId'] == 42)
                self.assertEqual(gate_event['visits'][0]['route'], 'handler-called')
                self.assertEqual(gate_event['visits'][0]['dispatcherReturn'], 1)
                self.assertEqual(gate_event['visits'][0]['handlerReturn'], 0)
                self.assertEqual([r['helper'] for r in t['observedEffects']], ['004AA200'])
                write = next(s for s in t['steps'] if s['helper'] == '004898F0' and s['id'] == 7)
                self.assertEqual((row(write['frame'])['allocated'], row(write['frame'])['valid']), (True, True))
                after_sort = t['observedEffects'][0]['after']['persons'][0]
                self.assertEqual(after_sort['allocated'], bool(raw or 0 <= status <= 8))
                self.assertEqual(after_sort['valid'], bool(raw))

    def test_35_stale_predicate_caches_rejected_at_every_input_boundary(self):
        for where, cache in itertools.product(('input', 'before', 'after'), ('allocated', 'valid')):
            f = fixture(entry='legion'); Oracle(f).run()
            if where == 'input': p = row(f[0]['frame'])
            else: p = row(f[2]['records'][0][where])
            p[cache] = not p[cache]
            with self.subTest(where=where, cache=cache): self.atomic_error(f)
        # Changing the native field alone is also rejected. The caller must
        # supply exact booleans; validation must never silently normalize them.
        for where, field, value in itertools.product(('input', 'before', 'after'),
                ('status', 'rawDword17C'), (6, 9)):
            f = fixture(entry='legion'); Oracle(f).run()
            p = row(f[0]['frame']) if where == 'input' else row(f[2]['records'][0][where])
            if field == 'status':
                p['status'] = value
            else:
                p.update(status=6, rawDword17C=value, allocated=True, valid=False)
            with self.subTest(where=where, field=field, value=value): self.atomic_error(f)

    def test_36_raw_field_required_uint32_and_status_bounds(self):
        for bad in (None, True, False, -1, 2**32, 1.0, '0'):
            f = fixture(); row(f[0]['frame'])['rawDword17C'] = bad
            with self.subTest(raw=bad): self.atomic_error(f)
        f = fixture(); del row(f[0]['frame'])['rawDword17C']; self.atomic_error(f)
        for bad in (-2**31 - 1, 2**31, True, None, '6'):
            f = fixture(); row(f[0]['frame'])['status'] = bad
            with self.subTest(status=bad): self.atomic_error(f)

    def test_37_mixed_event_types_restore_outer_actor_and_copied_visits(self):
        # Independent review regression: event14(actor7) -> event8(actor10),
        # then resume the outer copied list and event14 observer context.
        for source in ('S1', 'S2'):
            f = fixture(event=14, source=source); w = f[0]['frame']
            w['activePersonIds'] = [7, 10]; w['observerPresent'] = True
            row(w, 0, 'buildings')['governorId'] = 9
            w['persons'].append(person(10, status=5, rawLegionId=-1,
                missionId=23, missionArgs=[0, 9, 0, 0, 0]))
            t = self.check_oracle(f)
            self.assertEqual([(e['event']['id'], e['parentEventIndex'])
                              for e in t['events']][:2], [(14, None), (8, 0)])
            self.assertTrue(all(e['parentEventIndex'] == 0 for e in t['events'][1:]))
            inner_visit, outer_visit = t['events'][1]['visits'][1], t['events'][0]['visits'][1]
            self.assertEqual((inner_visit['personId'], inner_visit['route']), (10, 'handler-called'))
            self.assertEqual((outer_visit['personId'], outer_visit['route']), (10, 'mission-range-skip'))
            self.assertEqual([row(t['after']['frame'], pid)['missionId'] for pid in (7, 10)], [-1, -1])
            final_stack = t['observedEffects'][-1]['callStack']
            self.assertEqual(len(final_stack), 1)
            self.assertEqual(final_stack[0]['locals']['event']['id'], 14)
            for record in t['observations']['records']:
                wrappers = [entry for entry in record['callStack'] if entry['helper'] == '004BBAA0']
                self.assertEqual(wrappers[0]['locals']['event']['id'], 14)
            bad = copy.deepcopy(f)
            record = next(r for r in bad[2]['records'] if
                sum(entry['helper'] == '004BBAA0' for entry in r['callStack']) == 2)
            record['callStack'][0]['locals']['event']['id'] = 8
            self.atomic_error(bad)


if __name__ == '__main__':
    unittest.main()
