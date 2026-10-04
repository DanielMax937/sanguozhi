"""P0-61 independent live-frame oracle, call-stage binding and atomic replay checks.

The oracle below never invokes a production planner, primitive, or transaction.
Its control flow and literals are transcribed from rules 94/95. Synthetic effects
are explicitly supplied fixtures, not assertions about native reachability.
"""
import copy
import itertools
import json
import random
import unittest
from unittest.mock import patch

import mission_event_composition_profile as m
import mission_composition_frame as adapters
from check_mission_notification_tail_profile import fixture as tail_fixture


HANDLER = {23: '005B6D00', 24: '005CFB70'}
PRESENTATION = {23: '005B6DC4..005B6E35', 24: '005CFC28..005CFC99'}
LIMIT = {'persons': 1099, 'buildings': 16383, 'cities': 41,
         'forces': 46, 'legions': 46}


def row(w, pid=7, table='persons'):
    return next(r for r in w[table] if r['id'] == pid)


def fixture(event=8, source='S1', home=0, location=0):
    f = tail_fixture(source=source, home=home, location=location)
    # The old fixture shares some nested values between person rows. Real JSON
    # does not; detach these before testing independently mutable fixed slots.
    f[0]['frame'] = json.loads(json.dumps(f[0]['frame']))
    w = f[0]['frame']
    w['activePersonIds'] = [7]
    row(w)['missionId'] = 23 if event == 8 else 24
    row(w, 9)['missionId'] = -1
    row(w, 0, 'buildings')['kind'] = 2
    f[1] = dict(id='event-1', expectedRevision=0,
                event=dict(id=event, subjectType='person' if event == 8 else 'building',
                           subjectId=9 if event == 8 else 0, argument=417))
    f[3] = dict(id='compose-observed-v1', ruleset='PC-PK1.1',
                unknownEffects='observed-frame',
                frameProfile='source-idb-S1-S2-live-mission-frame-v1',
                registryDomain='initialized-unmodified-registry-v1',
                listAssumption='readable-acyclic-successful-copy-append-v1',
                provenance='explicit synthetic bounded composition fixture')
    return f


def run(f):
    return m.project_mission_event_composition(*f)


def helpers(trace):
    return [s['helper'] for s in trace['steps']]


def scope(helper, **locals):
    return dict(helper=helper, locals=copy.deepcopy(locals))


class Oracle:
    """Independent interpreter and observation builder, including native locals.

    effect(stage, new_frame, context) mutates its private frame and optionally
    returns an observed RNG count (None means unknown). A missing callback is an
    explicit synthetic identity observation with count zero, never an API default.
    """
    def __init__(self, f, effect=None, distance=3, query267=False):
        self.f = f
        self.w = copy.deepcopy(f[0]['frame'])
        self.source = f[0]['source']
        self.event = copy.deepcopy(f[1]['event'])
        self.effect = effect
        self.distance = distance
        self.query267 = query267
        self.records = []
        self.visits = []
        self.copied = list(self.w['activePersonIds'])
        self.stack = [scope('004BBAA0', event=self.event),
                      scope('004A8110', copiedActivePersonIds=self.copied)]
        self.pid = None
        self.visit = None

    def get(self, name, rid):
        if not 0 <= rid <= LIMIT[name]:
            return None
        found = [r for r in self.w[name] if r['id'] == rid]
        if not found:
            raise ValueError('oracle missing ' + name + ' slot ' + str(rid))
        return found[0]

    def actor(self):
        return self.get('persons', self.pid)

    def boundary(self, stage, kind, helper, args, result=None):
        r = dict(index=len(self.records), source=self.source, kind=kind,
                 helper=helper, args=copy.deepcopy(args),
                 callStack=copy.deepcopy(self.stack), before=copy.deepcopy(self.w),
                 provenance='independent synthetic ' + stage + ' fixture')
        if kind in ('query', 'effect-query'):
            r['result'] = result
        if kind != 'query':
            after = copy.deepcopy(self.w)
            context = dict(personId=self.pid, visitIndex=self.visit,
                           index=len(self.records), args=copy.deepcopy(args))
            count = 0 if self.effect is None else self.effect(stage, after, context)
            r['after'] = copy.deepcopy(after)
            r['rngConsumption'] = dict(kind='unknown' if count is None else 'observed-count', calls=count)
            self.w = after
        self.records.append(r)
        return result

    def qualifies(self, mission):
        a = self.actor()
        if mission not in (23, 24) or not a['valid']:
            return False
        e = self.event
        if (mission, e['id']) not in ((23, 8), (24, 14)):
            return False
        name, kind = ('persons', 'person') if mission == 23 else ('buildings', 'building')
        if e['subjectType'] != kind:
            return False
        subject = self.get(name, e['subjectId'])
        if subject is None or not subject['valid']:
            return False
        if mission == 24 and subject['kind'] not in (1, 2):
            return False
        return subject['id'] == a['missionArgs'][1 if mission == 23 else 0]

    def force(self):
        legion = self.get('legions', self.actor()['rawLegionId'])
        return self.get('forces', legion['forceId'] if legion and legion['valid'] else -1)

    def notify(self):
        if not self.actor()['valid']:
            return False
        force = self.force()
        if not force or not force['valid'] or not 0 <= force['playerIndex'] <= 7:
            return False
        legion = self.get('legions', self.actor()['rawLegionId'])
        if not legion or not legion['valid']:
            return False
        force = self.get('forces', legion['forceId'])
        return bool(force and force['valid'] and 0 <= force['playerIndex'] <= 7 and legion['number'] == 1)

    def acted(self, wrapper):
        if wrapper:
            if not self.actor()['valid']:
                return
            if self.source == 'S2':
                answer = self.query267(self.visit) if callable(self.query267) else self.query267
                self.boundary('query267', 'effect-query', '004890F0',
                              dict(personId=self.pid, skillId=267), answer)
                if answer:
                    return
        self.actor()['flags124'] |= 1
        self.w['managerDirty'] = 1
        if self.w['observerPresent']:
            self.boundary('acted-observer', 'effect', 'observer.virtual1B4',
                          dict(nativeArgs=[0, 0, 0, 0], caller='004B9480'))

    def return_zero(self):
        a = self.actor()
        location = a['locationId'] if 0 <= a['locationId'] <= 86 else -1
        home = a['homeBaseId']
        self.stack.append(scope('005B8400', personId=self.pid, refund=0,
                                normalizedLocationId=location, savedHomeId=home))
        if location != home:
            self.get('buildings', location)
            self.get('buildings', home)
            distance = self.distance(self.visit) if callable(self.distance) else self.distance
            self.boundary('distance', 'query', '0049E4D0',
                          dict(currentBuildingId=location,
                               homeBuildingId=home if 0 <= home <= 16383 else -1), distance)
            self.stack[-1]['locals']['savedDistance'] = distance
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
                self.boundary('full-return', 'effect', '004BF6F0',
                              dict(personId=self.pid, targetBuildingId=home,
                                   showNotice=0, noticeVariant=1))
        self.stack.pop()

    def handler(self, mission):
        self.stack.append(scope(HANDLER[mission], personId=self.pid, capturedMissionId=mission))
        try:
            a = self.actor()
            if not a['valid']:
                return 0
            current = a['locationId'] if 0 <= a['locationId'] <= 86 else -1
            b = self.get('buildings', current)
            if b is None or not b['valid']:
                return 0
            target = a['missionArgs'][0]
            name = 'cities' if mission == 23 else 'buildings'
            if mission == 23 and not 0 <= target <= 41:
                target = -1
            t = self.get(name, target)
            if t is None or not t['valid']:
                return 0
            force = self.force()
            saved44 = force['raw44'] if force and force['valid'] else -1
            saved = dict(currentBuildingId=current, targetType=name,
                         targetId=target, savedForce44=saved44)
            self.stack[-1]['locals'].update(saved)
            if self.notify():
                self.boundary('presentation', 'effect', PRESENTATION[mission],
                              dict(personId=self.pid, **saved,
                                   messageId=0x15a6 if mission == 23 else 0x15b6))
            self.return_zero()
            return 1
        finally:
            self.stack.pop()

    def run(self):
        for i, pid in enumerate(self.copied):
            self.pid, self.visit = pid, i
            v = dict(visitIndex=i, personId=pid, missionId=None,
                     dispatcherReturn=None, handlerReturn=None)
            self.visits.append(v)
            if pid == self.w['executingPersonId']:
                v['route'] = 'executing-person-skip'
                continue
            mission = self.actor()['missionId']
            v['missionId'] = mission
            if not 0 <= mission <= 43:
                v['route'] = 'mission-range-skip'
            elif mission == 37:
                v.update(route='mission37-skip', dispatcherReturn=0)
            else:
                self.stack.append(scope('005B9D30', visitIndex=i, personId=pid,
                                        capturedMissionId=mission))
                if self.qualifies(mission):
                    value = self.handler(mission)
                    v.update(route='handler-called', dispatcherReturn=1, handlerReturn=value)
                else:
                    v.update(route='predicate-false', dispatcherReturn=0)
                self.stack.pop()
        self.pid = self.visit = None
        self.stack.pop()
        if self.w['observerPresent']:
            self.boundary('event-observer', 'effect', 'observer.virtual1B4',
                          dict(nativeArgs=[0, 0, 0, 0], caller='004BBAA0'))
        self.f[2]['records'] = copy.deepcopy(self.records)
        return self


class CompositionTests(unittest.TestCase):
    def check_oracle(self, f, **kw):
        oracle = Oracle(f, **kw).run()
        original = copy.deepcopy(f)
        trace = run(f)
        self.assertTrue(trace['accepted'])
        self.assertFalse(trace['replayed'])
        self.assertEqual(trace['after']['frame'], oracle.w)
        self.assertEqual(trace['visits'], oracle.visits)
        self.assertEqual(trace['copiedActivePersonIds'], oracle.copied)
        self.assertEqual(trace['observedEffects'], [r for r in oracle.records if r['kind'] != 'query'])
        self.assertEqual(trace['queries'], [r for r in oracle.records if r['kind'] == 'query'])
        self.assertEqual(trace['after']['revision'], f[0]['revision'] + 1)
        self.assertEqual(len(trace['after']['appliedCommands']), len(f[0]['appliedCommands']) + 1)
        self.assertEqual(f, original)
        self.assertEqual(trace, m.replay_mission_event_composition(json.loads(json.dumps(trace))))
        return trace

    def assert_atomic_error(self, f):
        before = copy.deepcopy(f)
        with self.assertRaises(ValueError):
            run(f)
        self.assertEqual(f, before)

    def test_01_both_events_sources_same_away(self):
        for event, source, home in itertools.product((8, 14), ('S1', 'S2'), (0, 1)):
            with self.subTest(event=event, source=source, home=home):
                t = self.check_oracle(fixture(event, source, home))
                self.assertEqual(t['visits'][0]['handlerReturn'], 1)
                self.assertEqual(row(t['after']['frame'])['missionId'], -1 if home == 0 else 37)
                self.assertEqual(helpers(t)[-4:], ['0047C100', '004BA1D0', '004EC870', '004BBAA0/return'])

    def test_02_all_registry_slots_event_match_and_range_skips(self):
        for event, mission in itertools.product((8, 14), range(-1, 45)):
            f = fixture(event)
            row(f[0]['frame'])['missionId'] = mission
            t = self.check_oracle(f)
            v = t['visits'][0]
            self.assertEqual(v['route'] == 'handler-called', mission == (23 if event == 8 else 24))
            self.assertNotIn('self-bypass', str(t['steps']))

    def test_03_predicate_wrong_type_null_invalid_and_kind(self):
        for event, case in itertools.product((8, 14), ('null', 'wrong', 'invalid', 'mismatch')):
            f = fixture(event)
            e = f[1]['event']
            if case == 'null': e.update(subjectType='null', subjectId=None)
            elif case == 'wrong': e.update(subjectType='building' if event == 8 else 'person', subjectId=0 if event == 8 else 9)
            elif case == 'invalid': row(f[0]['frame'], e['subjectId'], 'persons' if event == 8 else 'buildings')['valid'] = False
            else: row(f[0]['frame'])['missionArgs'][1 if event == 8 else 0] = 1
            t = self.check_oracle(f)
            self.assertEqual(t['visits'][0]['route'], 'predicate-false')
            if case == 'null': self.assertIn('null-subject-skip-type-query', helpers(t))
        for kind in (-1, 0, 1, 2, 3, 2**31 - 1):
            f = fixture(14)
            row(f[0]['frame'], 0, 'buildings')['kind'] = kind
            t = self.check_oracle(f)
            self.assertEqual(t['visits'][0]['dispatcherReturn'], int(kind in (1, 2)))

    def test_04_handler_gate_zero_dispatcher_one(self):
        for event, case in itertools.product((8, 14), ('location', 'current', 'target')):
            # For event14 current must differ from its valid predicate subject.
            f = fixture(event, home=1, location=1)
            a = row(f[0]['frame'])
            if case == 'location': a['locationId'] = 87
            elif case == 'current': row(f[0]['frame'], 1, 'buildings')['valid'] = False
            elif event == 8: a['missionArgs'][0] = 42
            else:
                # target validity is the same live subject gate for event14;
                # this case instead tests out-of-range current normalization.
                a['locationId'] = -1
            t = self.check_oracle(f)
            self.assertEqual(t['visits'][0]['dispatcherReturn'], 1)
            self.assertEqual(t['visits'][0]['handlerReturn'], 0)
            self.assertEqual(t['after']['frame'], f[0]['frame'])

    def test_05_city_target_and_wide_building_identity(self):
        f = fixture(8, home=1, location=1)
        row(f[0]['frame'], 0, 'buildings')['valid'] = False
        self.assertEqual(self.check_oracle(f)['visits'][0]['handlerReturn'], 1)
        f = fixture(14)
        row(f[0]['frame'], 16383, 'buildings')['kind'] = 1
        row(f[0]['frame'])['missionArgs'][0] = 16383
        f[1]['event']['subjectId'] = 16383
        self.assertEqual(self.check_oracle(f)['visits'][0]['handlerReturn'], 1)

    def test_06_repeated_nodes_observe_live_mission(self):
        for home in (0, 1):
            f = fixture(home=home)
            f[0]['frame']['activePersonIds'] = [9, 7, 7, 9]
            t = self.check_oracle(f)
            self.assertEqual(t['copiedActivePersonIds'], [9, 7, 7, 9])
            self.assertEqual(t['visits'][2]['route'], 'mission-range-skip' if home == 0 else 'mission37-skip')
            self.assertEqual(t['after']['frame']['activePersonIds'], [9, 7, 7, 9])

    def test_07_copied_nodes_live_mission_executing_and_new_nodes(self):
        f = fixture()
        w = f[0]['frame']
        w['activePersonIds'] = [7, 9, 7, 9]
        w['observerPresent'] = True
        w['persons'].append(dict(copy.deepcopy(row(w, 9)), id=10))
        def effect(stage, v, c):
            if stage == 'acted-observer':
                row(v, 9).update(missionId=23, missionArgs=[0, 9, 3, 4, 5])
                v.update(activePersonIds=[10, 9], executingPersonId=9)
            return 0
        t = self.check_oracle(f, effect=effect)
        self.assertEqual([v['route'] for v in t['visits']],
                         ['handler-called', 'executing-person-skip', 'mission-range-skip', 'executing-person-skip'])
        self.assertEqual(t['after']['frame']['activePersonIds'], [10, 9])
        self.assertNotIn(10, [v['personId'] for v in t['visits']])

    def test_08_duplicate_listener_can_run_again_with_distinct_stages(self):
        f = fixture()
        f[0]['frame'].update(activePersonIds=[7, 7], observerPresent=True)
        def effect(stage, w, c):
            if stage == 'acted-observer':
                row(w).update(missionId=23, missionArgs=[0, 9, 3, 4, 5])
                w['rngState'] += 1
            return 1
        t = self.check_oracle(f, effect=effect)
        self.assertEqual([v['handlerReturn'] for v in t['visits']], [1, 1])
        effects = t['observedEffects']
        self.assertEqual([r['callStack'][2]['locals']['visitIndex'] for r in effects[:2]], [0, 1])
        self.assertNotEqual(effects[0]['before'], effects[1]['before'])

    def test_09_presentation_saved_context_live_return_and_nested_data(self):
        for event in (8, 14):
            f = fixture(event)
            w = f[0]['frame']
            w['forces'][0]['playerIndex'] = 0
            w['data']['nested'] = {'value': 1, 'items': [{'before': 1}]}
            row(w)['data']['nested'] = {'value': 2}
            def effect(stage, v, c):
                if stage == 'presentation':
                    row(v).update(locationId=1, homeBaseId=0, missionId=42, missionArgs=[16383, 7, 0, 0, 0])
                    v['forces'][0]['raw44'] = 456
                    v['data']['nested'] = {'value': 8, 'items': [{'after': [1, 2]}]}
                    row(v)['data']['nested']['value'] = 99
                    v['rngState'] = 99
                return 2
            t = self.check_oracle(f, effect=effect, distance=255)
            presentation = t['observedEffects'][0]
            self.assertEqual(presentation['args'], dict(personId=7, currentBuildingId=0,
                targetType='cities' if event == 8 else 'buildings', targetId=0,
                savedForce44=9, messageId=0x15a6 if event == 8 else 0x15b6))
            distance = t['queries'][0]
            self.assertEqual(distance['args'], dict(currentBuildingId=1, homeBuildingId=0))
            self.assertEqual(distance['callStack'][3]['locals']['savedForce44'], 9)
            self.assertEqual(distance['callStack'][-1]['locals']['normalizedLocationId'], 1)
            self.assertEqual(row(t['after']['frame'])['missionDuration'], 255)
            self.assertEqual(t['after']['frame']['data']['nested']['items'], [{'after': [1, 2]}])

    def test_10_notification_domain_player_and_legion_number(self):
        for player, number in itertools.product((-1, 0, 7, 8), (0, 1, 2)):
            f = fixture()
            f[0]['frame']['forces'][0]['playerIndex'] = player
            f[0]['frame']['legions'][0]['number'] = number
            t = self.check_oracle(f)
            self.assertEqual(any(r['helper'] == PRESENTATION[23] for r in t['observedEffects']),
                             0 <= player <= 7 and number == 1)

    def test_11_away_order_observer_valid_append_and_low_byte(self):
        for invalidate, distance in itertools.product((False, True), (-1, 0, 255)):
            f = fixture(source='S2', home=1)
            f[0]['frame'].update(observerPresent=True, activePersonIds=[7, 9, 7])
            def effect(stage, w, c):
                if stage == 'acted-observer':
                    row(w).update(valid=not invalidate, missionId=41, missionDuration=121)
                    w['activePersonIds'] = [9, 9]
                return 0
            t = self.check_oracle(f, effect=effect, distance=distance)
            h = helpers(t)
            for first, second in zip(('00489BD0', '00489B40/00472520', '004A06A0/004829B0', 'observer.virtual1B4'),
                                     ('00489B40/00472520', '004A06A0/004829B0', 'observer.virtual1B4', '00482F80/valid')):
                self.assertLess(h.index(first), h.index(second))
            self.assertNotIn('004890F0', h)
            self.assertEqual(row(t['after']['frame'])['missionId'], 41)
            self.assertEqual(row(t['after']['frame'])['missionDuration'], 121 if invalidate else distance & 255)
            self.assertEqual(t['after']['frame']['activePersonIds'], [9, 9] if invalidate else [9, 9, 7])

    def test_12_same_reset_observer_saved_home_live_status(self):
        for initial_status, new_status in ((5, 2), (2, 5)):
            f = fixture()
            f[0]['frame']['observerPresent'] = True
            row(f[0]['frame'])['status'] = initial_status
            def effect(stage, w, c):
                if stage == 'acted-observer': row(w).update(status=new_status, homeBaseId=1)
                return 0
            t = self.check_oracle(f, effect=effect)
            h = helpers(t)
            self.assertLess(h.index('00489BD0'), h.index('0048A8B0'))
            self.assertLess(h.index('0048A8B0'), h.index('004A5600'))
            self.assertLess(h.index('observer.virtual1B4'), h.index('00488C70'))
            full = [r for r in t['observedEffects'] if r['helper'] == '004BF6F0']
            self.assertEqual(len(full), int(new_status != 5))
            if full: self.assertEqual(full[0]['args']['targetBuildingId'], 0)

    def test_13_mutable_s2_query_has_no_second_validity_gate(self):
        for answer in (False, True):
            f = fixture(source='S2')
            def effect(stage, w, c):
                if stage == 'query267':
                    row(w).update(valid=False, flags124=0, status=5)
                    w.update(observerPresent=True, managerDirty=0, rngState=72)
                elif stage == 'acted-observer':
                    w['rngState'] = 73
                return 3
            t = self.check_oracle(f, effect=effect, query267=answer)
            self.assertEqual(row(t['after']['frame'])['flags124'], 0 if answer else 1)
            self.assertEqual(t['after']['frame']['managerDirty'], 0 if answer else 1)
            self.assertEqual([r['args'].get('caller') for r in t['observedEffects']],
                             [None, '004BBAA0'] if answer else [None, '004B9480', '004BBAA0'])
            self.assertEqual(t['observedEffects'][0]['before']['persons'][0]['missionId'], -1)
            self.assertEqual(t['observedEffects'][0]['before']['persons'][0]['missionDuration'], 0)

    def test_14_post_event_observer_reads_fresh_presence(self):
        for initially_present, finally_present in itertools.product((False, True), repeat=2):
            f = fixture()
            w = f[0]['frame']
            w['forces'][0]['playerIndex'] = 0
            w['observerPresent'] = initially_present
            def effect(stage, v, c):
                if stage == 'presentation': v['observerPresent'] = finally_present
                if stage == 'event-observer': v.update(managerDirty=62, rngState=77, activePersonIds=[9])
                return 0
            t = self.check_oracle(f, effect=effect)
            post = [r for r in t['observedEffects'] if r['args'].get('caller') == '004BBAA0']
            self.assertEqual(len(post), int(finally_present))
            if post:
                self.assertEqual([s['helper'] for s in post[0]['callStack']], ['004BBAA0'])
                self.assertEqual(t['after']['frame']['managerDirty'], 62)
                self.assertEqual(t['after']['frame']['activePersonIds'], [9])
                h = helpers(t)
                self.assertLess(h.index('0047C100'), h.index('004BA1D0'))
                self.assertEqual(h[-3:], ['004EC870', 'observer.virtual1B4', '004BBAA0/return'])

    def test_15_full_return_can_enable_post_observer_and_change_later_listener(self):
        f = fixture()
        w = f[0]['frame']
        w['activePersonIds'] = [7, 9]
        row(w)['status'] = 2
        def effect(stage, v, c):
            if stage == 'full-return':
                v['observerPresent'] = True
                row(v, 9)['missionId'] = 37
            return 1
        t = self.check_oracle(f, effect=effect)
        self.assertEqual(t['visits'][1]['route'], 'mission37-skip')
        self.assertEqual([r['helper'] for r in t['observedEffects']], ['004BF6F0', 'observer.virtual1B4'])

    def test_16_presentation_invalidates_without_synthetic_return_entry_gate(self):
        for allocated in (False, True):
            f = fixture()
            f[0]['frame']['forces'][0]['playerIndex'] = 0
            def effect(stage, w, c):
                if stage == 'presentation': row(w).update(valid=False, allocated=allocated)
                return 0
            t = self.check_oracle(f, effect=effect)
            self.assertEqual(t['visits'][0]['handlerReturn'], 1)
            self.assertEqual(row(t['after']['frame'])['missionId'], -1 if allocated else 23)
            self.assertEqual(row(t['after']['frame'])['missionDuration'], 99)

    def test_17_in_range_missing_slots_are_evidence_errors(self):
        for missing in ('subject-person', 'subject-building', 'current', 'target-city', 'legion', 'force', 'home'):
            f = fixture(14 if missing == 'subject-building' else 8, home=1)
            w = f[0]['frame']
            if missing == 'subject-person': w['persons'] = [row(w)]
            elif missing == 'subject-building': w['buildings'] = [r for r in w['buildings'] if r['id'] != 0]
            elif missing == 'current': row(w)['locationId'] = 2
            elif missing == 'target-city': w['cities'] = []
            elif missing == 'legion': w['legions'] = []
            elif missing == 'force': w['forces'] = []
            else: w['buildings'] = [r for r in w['buildings'] if r['id'] != 1]
            with self.subTest(missing=missing): self.assert_atomic_error(f)

    def test_18_sentinels_short_circuit_and_executing_skip(self):
        for field in ('rawLegionId', 'locationId'):
            f = fixture()
            row(f[0]['frame'])[field] = -1
            if field == 'rawLegionId': f[0]['frame']['legions'] = []; f[0]['frame']['forces'] = []
            else: f[0]['frame']['buildings'] = []
            self.check_oracle(f)
        f = fixture()
        w = f[0]['frame']
        w.update(executingPersonId=7, buildings=[], cities=[], forces=[], legions=[])
        t = self.check_oracle(f)
        self.assertEqual(t['visits'][0]['route'], 'executing-person-skip')
        self.assertIsNone(t['visits'][0]['missionId'])

    def test_19_observation_missing_unused_stale_wrong_binding_atomic(self):
        for problem in ('missing', 'unused', 'stale', 'record-source', 'source', 'helper', 'args', 'stack', 'stack-visit', 'stack-locals', 'index'):
            f = fixture(home=1)
            f[0]['frame']['observerPresent'] = True
            Oracle(f).run()
            records = f[2]['records']
            if problem == 'missing': records.pop()
            elif problem == 'unused': records.append(dict(copy.deepcopy(records[-1]), index=len(records)))
            elif problem == 'stale': records[-1]['before']['rngState'] += 1
            elif problem == 'record-source': records[-1]['source'] = 'S2'
            elif problem == 'source': f[2]['source'] = 'S2'
            elif problem == 'helper': records[-1]['helper'] = '004BF6F0'
            elif problem == 'args': records[-1]['args']['caller'] = '004B9480'
            elif problem == 'stack': records[-1]['callStack'] = copy.deepcopy(records[0]['callStack'])
            elif problem == 'stack-visit': records[0]['callStack'][2]['locals']['visitIndex'] = 1
            elif problem == 'stack-locals': records[0]['callStack'][-1]['locals']['savedHomeId'] = 0
            else: records[-1]['index'] = 0
            with self.subTest(problem=problem): self.assert_atomic_error(f)

    def test_20_malformed_observations_rejected_without_input_mutation(self):
        for problem in ('extra', 'missing-key', 'kind', 'empty-stack', 'args-list', 'bool-index', 'bool-before', 'bad-rng', 'negative-rng', 'float', 'domain-key', 'domain-slot'):
            f = fixture()
            f[0]['frame']['observerPresent'] = True
            f[0]['frame']['data']['nested'] = {'a': 1}
            Oracle(f).run()
            r = f[2]['records'][-1]
            if problem == 'extra': r['extra'] = 1
            elif problem == 'missing-key': del r['provenance']
            elif problem == 'kind': r['kind'] = 'handler-tail'
            elif problem == 'empty-stack': r['callStack'] = []
            elif problem == 'args-list': r['args'] = []
            elif problem == 'bool-index': r['index'] = True
            elif problem == 'bool-before': r['before']['managerDirty'] = True
            elif problem == 'bad-rng': r['rngConsumption'] = dict(kind='unknown', calls=0)
            elif problem == 'negative-rng': r['rngConsumption']['calls'] = -1
            elif problem == 'float': r['after']['data']['nested']['a'] = 0.5
            elif problem == 'domain-key': del r['after']['data']['nested']['a']
            else: r['after']['cities'] = []
            with self.subTest(problem=problem): self.assert_atomic_error(f)

    def test_21_query_result_domains(self):
        for result in (-2, 256, True, '3', None):
            f = fixture(home=1)
            Oracle(f).run()
            f[2]['records'][0]['result'] = result
            self.assert_atomic_error(f)
        for result in (0, 1, None, 'false'):
            f = fixture(source='S2')
            Oracle(f).run()
            f[2]['records'][0]['result'] = result
            self.assert_atomic_error(f)

    def test_22_reject_after_prior_writes_rolls_back_and_no_commit(self):
        f = fixture()
        w = f[0]['frame']
        w['activePersonIds'] = [7, 9]
        row(w, 9).update(missionId=23, missionArgs=[0, 9, 3, 4, 5], status=2)
        f[3]['unknownEffects'] = 'reject'
        before = copy.deepcopy(f)
        t = run(f)
        self.assertFalse(t['accepted'])
        self.assertEqual(t['reason'], 'unresolved-effect:004BF6F0')
        self.assertEqual(t['after'], f[0])
        self.assertEqual(t['steps'], [])
        self.assertEqual(t['visits'], [])
        self.assertEqual(t['copiedActivePersonIds'], [])
        self.assertEqual(row(t['observedEffects'][0]['before'])['missionId'], -1)
        self.assertEqual(row(t['observedEffects'][0]['before'], 9)['missionId'], -1)
        self.assertTrue(t['observedEffects'][0]['deferred'])
        self.assertEqual(f, before)
        self.assertEqual(t, m.replay_mission_event_composition(t))

    def test_23_late_missing_post_observer_rolls_back_known_tail_and_effect(self):
        f = fixture(home=1)
        f[0]['frame']['observerPresent'] = True
        def effect(stage, w, c):
            w['rngState'] += 4
            return 1
        Oracle(f, effect=effect).run()
        self.assertEqual(f[2]['records'][-1]['args']['caller'], '004BBAA0')
        f[2]['records'].pop()
        self.assert_atomic_error(f)
        self.assertEqual(f[0]['revision'], 0)
        self.assertEqual(f[0]['appliedCommands'], [])
        self.assertEqual(row(f[0]['frame'])['missionId'], 23)

    def test_24_reject_accepts_only_paths_with_no_mutable_boundary(self):
        for source in ('S1', 'S2'):
            f = fixture(source=source, home=1)
            Oracle(f).run()
            f[3]['unknownEffects'] = 'reject'
            self.assertTrue(run(f)['accepted'])
        f = fixture()
        f[0]['frame'].update(activePersonIds=[], observerPresent=True)
        f[3]['unknownEffects'] = 'reject'
        t = run(f)
        self.assertFalse(t['accepted'])
        self.assertEqual(t['observedEffects'][0]['args']['caller'], '004BBAA0')
        self.assertEqual(t['after'], f[0])

    def test_25_idempotency_observations_policy_and_command_conflicts(self):
        f = fixture()
        f[0]['frame']['observerPresent'] = True
        t = self.check_oracle(f)
        replay = copy.deepcopy(f)
        replay[0] = copy.deepcopy(t['after'])
        r = run(replay)
        self.assertTrue(r['replayed'])
        self.assertEqual(r['after'], t['after'])
        self.assertEqual(r['steps'], [])
        for section in ('command', 'observations', 'policy', 'effect'):
            bad = copy.deepcopy(replay)
            if section == 'command': bad[1]['event']['argument'] += 1
            elif section == 'observations': bad[2]['provenance'] += ' changed'
            elif section == 'policy': bad[3]['provenance'] += ' changed'
            else: bad[2]['records'][-1]['after']['rngState'] += 1
            conflict = run(bad)
            self.assertFalse(conflict['accepted'])
            self.assertEqual(conflict['reason'], 'replay-payload-conflict')
            self.assertEqual(conflict['after'], bad[0])
        next_event = copy.deepcopy(f)
        next_event[0] = t['after']
        next_event[1].update(id='event-2', expectedRevision=1)
        self.assertTrue(self.check_oracle(next_event)['accepted'])

    def test_26_revision_conflicts_exhaustion_and_strict_command_shape(self):
        f = fixture()
        f[1]['expectedRevision'] = 1
        t = run(f)
        self.assertEqual(t['reason'], 'revision-conflict')
        self.assertEqual(t['after'], f[0])
        f = fixture()
        f[0]['revision'] = f[1]['expectedRevision'] = 2**31 - 1
        self.assert_atomic_error(f)
        for key, value in (('kind', 'handler23'), ('personId', 7), ('refund', 0)):
            f = fixture()
            f[1][key] = value
            self.assert_atomic_error(f)
        for value in (0, 9, 13, 15, True):
            f = fixture()
            f[1]['event']['id'] = value
            self.assert_atomic_error(f)

    def test_27_policy_profile_registry_and_list_assumptions_are_explicit(self):
        for key in ('frameProfile', 'registryDomain', 'listAssumption', 'unknownEffects'):
            f = fixture()
            f[3][key] = 'implicit'
            self.assert_atomic_error(f)
        f = fixture()
        f[3]['ruleset'] = 'PC-Vanilla-assumed'
        t = self.check_oracle(f)
        self.assertEqual(t['evidence']['runtimeStatus'], 'compatibility-assumption')
        for key in ('stockVerified', 'vanillaVerified', 'fullReturnExecuted', 'fullEventMachineCodeExecuted',
                    'completeGameTransaction', 'callbacksAssumedNoninterfering', 'observationAuthenticityVerified'):
            self.assertFalse(t['evidence'][key])
        self.assertTrue(t['evidence']['eventWrapperExecuted'])
        self.assertTrue(t['evidence']['knownHandlerTailsExecuted'])

    def test_28_rng_observed_counts_unknown_and_equal_state(self):
        for unknown in (False, True):
            f = fixture(source='S2')
            f[0]['frame']['observerPresent'] = True
            def effect(stage, w, c):
                return None if unknown and stage == 'query267' else 2
            t = self.check_oracle(f, effect=effect)
            self.assertEqual(t['rng']['initialState'], t['rng']['finalState'])
            self.assertEqual(t['rng']['observedCalls'], None if unknown else 6)
            self.assertEqual(t['rng']['allCountsKnown'], not unknown)
            self.assertEqual(t['rng']['localCalls'], 0)
            self.assertFalse(t['rng']['globalConsumptionVerified'])

    def test_29_snapshots_nested_values_have_no_aliases(self):
        f = fixture(home=1)
        f[0]['frame']['observerPresent'] = True
        f[0]['frame']['data']['nested'] = {'values': [1, {'n': 2}]}
        t = self.check_oracle(f)
        frozen = copy.deepcopy(t)
        t['after']['frame']['data']['nested']['values'][1]['n'] = 99
        self.assertEqual(t['before'], frozen['before'])
        self.assertEqual(t['steps'], frozen['steps'])
        t['steps'][0]['frame']['data']['nested']['values'].append(6)
        self.assertEqual(t['steps'][1], frozen['steps'][1])
        t['observedEffects'][0]['after']['data']['nested']['values'].append(5)
        self.assertEqual(t['observations'], frozen['observations'])
        self.assertEqual(f[0]['frame']['data']['nested']['values'], [1, {'n': 2}])
        t['steps'][0]['callStack'][0]['locals']['event']['argument'] = 0
        self.assertEqual(t['command'], frozen['command'])
        self.assertEqual(t['steps'][1]['callStack'], frozen['steps'][1]['callStack'])

    def test_30_resigned_output_forgery_is_recomputed_not_hash_trusted(self):
        f = fixture(home=1)
        f[0]['frame']['observerPresent'] = True
        t = self.check_oracle(f)
        for field in ('after', 'steps', 'visits', 'copied', 'effect', 'query', 'rng', 'evidence', 'reason', 'policy-output'):
            bad = copy.deepcopy(t)
            if field == 'after': bad['after']['frame']['rngState'] += 1
            elif field == 'steps': bad['steps'][0]['frame']['managerDirty'] = 1
            elif field == 'visits': bad['visits'][0]['handlerReturn'] = 0
            elif field == 'copied': bad['copiedActivePersonIds'].append(7)
            elif field == 'effect': bad['observedEffects'][0]['after']['rngState'] += 1
            elif field == 'query': bad['queries'][0]['result'] += 1
            elif field == 'rng': bad['rng']['observedCalls'] += 1
            elif field == 'evidence': bad['evidence']['stockVerified'] = True
            elif field == 'reason': bad['reason'] = 'full-native-event'
            else: bad['frameProfileId'] += '-forged'
            bad.pop('traceHash')
            bad['traceHash'] = m._digest(bad)
            with self.subTest(field=field), self.assertRaises(ValueError):
                m.replay_mission_event_composition(bad)

    def test_31_legacy_transaction_apis_never_called(self):
        import mission_event_listener_profile as listener
        import mission_notification_tail_profile as tail
        f = fixture(source='S2', home=1)
        f[0]['frame']['observerPresent'] = True
        with (patch.object(listener, 'project_mission_event', side_effect=AssertionError('legacy event transaction')),
              patch.object(listener, 'replay_mission_event', side_effect=AssertionError('legacy event replay')),
              patch.object(listener, '_Planner', side_effect=AssertionError('legacy event planner owner')),
              patch.object(tail, 'project_mission_notification_tail', side_effect=AssertionError('legacy tail transaction')),
              patch.object(tail, 'replay_mission_notification_tail', side_effect=AssertionError('legacy tail replay')),
              patch.object(tail, '_Planner', side_effect=AssertionError('legacy tail planner owner'))):
            self.check_oracle(f)

    def test_32_shared_frame_adapters_preserve_source_and_detach_projection(self):
        f = fixture()
        w = f[0]['frame']
        w['data']['nested'] = {'a': [1]}
        before = copy.deepcopy(w)
        full = adapters.tail_snapshot(w)
        old = adapters.listener_snapshot(w)
        self.assertEqual(full, w)
        self.assertNotIn('forces', old)
        self.assertNotIn('flags124', old['persons'][0])
        self.assertEqual(old['persons'][0]['missionArgs'], row(w)['missionArgs'])
        full['data']['nested']['a'].append(2)
        old['data']['nested']['a'].append(3)
        old['persons'][0]['missionArgs'][0] = 11
        self.assertEqual(w, before)
        class Owner(adapters.SharedFrameAdapter): pass
        owner = Owner()
        owner.frame, owner.pid = w, 7
        self.assertEqual(owner.person()['missionId'], 23)
        replacement = copy.deepcopy(w)
        row(replacement)['missionId'] = 37
        owner.frame = replacement
        self.assertEqual(owner.person()['missionId'], 37)
        self.assertIsNone(owner.slot('buildings', -1))
        with self.assertRaises(ValueError): owner.slot('buildings', 2)

    def test_33_768_seeded_independent_evolving_frames_and_json_replay(self):
        rng = random.Random(0x61C0)
        for i in range(768):
            event, source = rng.choice((8, 14)), rng.choice(('S1', 'S2'))
            f = fixture(event, source, rng.randrange(2))
            w = f[0]['frame']
            w['activePersonIds'] = rng.choice(([7], [7, 7], [9, 7, 9], [7, 9, 7, 9], []))[:]
            w['executingPersonId'] = rng.choice((None, None, 7, 9))
            w['observerPresent'] = rng.choice((False, True))
            w['managerDirty'] = rng.randrange(4)
            w['forces'][0]['playerIndex'] = rng.choice((-1, 0, 7, 8))
            w['legions'][0]['number'] = rng.choice((0, 1, 1, 2))
            row(w).update(status=rng.choice((2, 5)), flags124=rng.randrange(2**32),
                          missionDuration=rng.randrange(256))
            row(w, 9).update(missionId=rng.choice((-1, 23 if event == 8 else 24, 37, 42)),
                             homeBaseId=rng.randrange(2), status=rng.choice((2, 5)))
            w['data']['nested'] = {'mark': 0, 'items': []}
            if i % 11 == 0: row(w)['valid'] = False
            if i % 13 == 0: row(w)['locationId'] = 87
            if i % 17 == 0: f[1]['event'].update(subjectType='null', subjectId=None)
            flip_valid, query_answer = rng.choice((False, True)), rng.choice((False, True))
            list_mode, live_mode = rng.randrange(4), rng.randrange(5)
            count = None if i % 7 == 0 else i % 4
            def effect(stage, v, c):
                v['data']['nested']['mark'] += 1
                v['data']['nested']['items'].append({'stage': stage, 'visit': c['visitIndex']})
                v['rngState'] = (v['rngState'] + 17 + i) & 0xffffffff
                if stage == 'presentation':
                    a = row(v, c['personId'])
                    a['homeBaseId'] = i % 2
                    a['locationId'] = (i // 2) % 2
                    v['forces'][0]['raw44'] = i
                if stage in ('query267', 'acted-observer'):
                    a = row(v, c['personId'])
                    if flip_valid: a['valid'] = False
                    a['status'] = 2 if i % 3 == 0 else 5
                    if list_mode == 0: v['activePersonIds'] = []
                    elif list_mode == 1: v['activePersonIds'] = [9, 9]
                    elif list_mode == 2: v['activePersonIds'] = [7, 9, 7]
                    if live_mode == 0: v['executingPersonId'] = 9
                    elif live_mode == 1: v['executingPersonId'] = 7
                    elif live_mode == 2: row(v, 9)['missionId'] = 37
                    elif live_mode == 3:
                        row(v, 9).update(missionId=23 if event == 8 else 24, missionArgs=[0, 9, 0, 0, 0])
                    v['observerPresent'] = i % 5 != 0
                if stage == 'full-return': v['observerPresent'] = i % 2 == 0
                if stage == 'event-observer': v['managerDirty'] = i
                return count
            with self.subTest(seed=0x61C0, case=i):
                self.check_oracle(f, effect=effect, distance=rng.randrange(-1, 256), query267=query_answer)


    def test_34_empty_and_predicate_false_events_still_run_post_observer(self):
        for event, active in itertools.product((8, 14), ([], [7])):
            f = fixture(event)
            w = f[0]['frame']
            w.update(activePersonIds=active[:], observerPresent=True)
            row(w)['missionId'] = 1
            def effect(stage, v, c):
                self.assertEqual(stage, 'event-observer')
                v['activePersonIds'] = [7, 7]
                row(v)['missionId'] = 23 if event == 8 else 24
                return 1
            t = self.check_oracle(f, effect=effect)
            self.assertEqual(t['copiedActivePersonIds'], active)
            self.assertEqual(len(t['visits']), len(active))
            self.assertEqual(len(t['observedEffects']), 1)
            self.assertEqual(t['after']['frame']['activePersonIds'], [7, 7])

    def test_35_identical_boundary_frames_still_bind_copied_visit(self):
        f = fixture()
        w = f[0]['frame']
        w.update(activePersonIds=[7, 7], observerPresent=True, managerDirty=1)
        row(w).update(missionDuration=0, flags124=0x103)
        def effect(stage, v, c):
            if stage == 'acted-observer':
                row(v).update(missionId=23, missionArgs=[0, 9, 3, 4, 5])
            return 0
        self.check_oracle(f, effect=effect)
        first, second = f[2]['records'][:2]
        self.assertEqual(first['before'], second['before'])
        self.assertEqual(first['after'], second['after'])
        self.assertEqual(first['args'], second['args'])
        first['callStack'], second['callStack'] = second['callStack'], first['callStack']
        self.assert_atomic_error(f)

    def test_36_late_missing_slot_after_applied_presentation_is_atomic(self):
        f = fixture()
        f[0]['frame']['forces'][0]['playerIndex'] = 0
        def effect(stage, v, c):
            if stage == 'presentation':
                row(v)['homeBaseId'] = 2
                v['rngState'] = 777
            return 1
        oracle = Oracle(f, effect=effect)
        with self.assertRaisesRegex(ValueError, 'oracle missing buildings slot 2'):
            oracle.run()
        self.assertEqual(len(oracle.records), 1)
        f[2]['records'] = copy.deepcopy(oracle.records)
        self.assert_atomic_error(f)
        self.assertEqual(f[0]['frame']['rngState'], 8)
        self.assertEqual(row(f[0]['frame'])['homeBaseId'], 0)

    def test_37_return_uses_normalized_live_location_without_building_valid_gate(self):
        for home, location in ((1, 0), (-1, 87), (1, 87)):
            f = fixture()
            f[0]['frame']['forces'][0]['playerIndex'] = 0
            def effect(stage, v, c):
                if stage == 'presentation':
                    row(v).update(homeBaseId=home, locationId=location)
                    for b in v['buildings']: b['valid'] = False
                return 0
            t = self.check_oracle(f, effect=effect, distance=-1)
            self.assertEqual(row(t['after']['frame'])['missionId'], -1 if home == -1 else 37)
            self.assertEqual(row(t['after']['frame'])['missionDuration'], 0 if home == -1 else 255)
            if t['queries']:
                self.assertEqual(t['queries'][0]['args']['currentBuildingId'], -1 if location == 87 else 0)

    def test_38_acted_observer_can_remove_post_event_observer(self):
        f = fixture()
        f[0]['frame']['observerPresent'] = True
        def effect(stage, w, c):
            self.assertEqual(stage, 'acted-observer')
            w['observerPresent'] = False
            return 2
        t = self.check_oracle(f, effect=effect)
        self.assertEqual(len(t['observedEffects']), 1)
        self.assertEqual(t['steps'][-2]['helper'], '004EC870')
        self.assertFalse(t['steps'][-2]['observerPresent'])


if __name__ == '__main__':
    unittest.main()
