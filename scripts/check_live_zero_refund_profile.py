"""Independent source interpreter and adversarial live zero-refund checks.

The four new bodies and their cancellation/predicate control are independently
transcribed from the pinned S1/S2 asm. Earlier test-only interpreters supply the
already verified live tail, recursive return and roster machinery. No production
primitive, planner or projector manufactures expected frames or observations.
All callback answers are explicit synthetic fixtures, not native evidence.
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

import live_zero_refund_profile as m
import officer_relocation_profile as previous
from check_officer_relocation_profile import (
    Oracle as RelocationOracle, fixture as relocation_fixture, CANCEL_HANDLER)
from check_base_ownership_profile import building, add_force
from check_empty_legion_profile import legion, set_legion
from check_recursive_officer_return_profile import row, refresh_people, digest
from check_native_roster_sort_profile import person

DOMAIN = 'canonical-live-zero-refund-v1'
MISSIONS = (9, 10, 12, 22)
# These are literals from each source interval, not production imports.
HANDLER = {9: '005CB050', 10: '005D5DD0', 12: '005C4E70', 22: '005BEDA0'}
PRESENTATION = {9: '005CB0E2..005CB15E', 10: '005D5E62..005D5EDE',
                12: '005C4EF4..005C4F65', 22: '005BEE58..005BEEC9'}
MESSAGE = {9: 0x13A5, 10: 0x207E, 12: 0x13E9, 22: 0x1595}
SOURCE_BODIES = {
    9: ('04', 0x005CB050, 0x005CB177,
        '63ef89f2b55faae9aea25c885ae229a65ed24487bca73410bbf9b3d37bbae6c9'),
    10: ('05', 0x005D5DD0, 0x005D5EF7,
         '918f1b3d84c37b10c36ebdd81f78499ee9158c3bbb535831b3b52a6805daf6f4'),
    12: ('04', 0x005C4E70, 0x005C4F7E,
         '70416a83c176fe2d8535e3f834fd5ceebdcce0c290ac808741beb5d3ba742261'),
    22: ('03', 0x005BEDA0, 0x005BEEE2,
         'b5f6702bc864e81bd071cf85e70e5782b29f7b0716acb96b9c13e055091c601e')}


def fixture(entry='cancel-mission', source='S1', mission=9, notify=False, **kw):
    f = relocation_fixture(entry, source, **kw)
    f[1]['id'] = 'live-zero-refund-1'
    f[3].update(id='live-zero-refund-observe-v1', zeroRefundDomain=DOMAIN)
    if entry in ('cancel-mission', 'event'):
        w = f[0]['frame']
        target = 0 if mission == 22 else 1
        row(w).update(status=3, rawLegionId=0, homeBaseId=1, locationId=0,
                      missionId=mission, missionArgs=[target, 9, 3, 4, 5])
        row(w, 0, 'forces')['playerIndex'] = 0 if notify else -1
        if entry == 'event':
            f[1]['args'] = dict(id=9, subjectType='building', subjectId=target, argument=417)
            w['activePersonIds'] = [7]
        refresh_people(w)
    return f


def run(f):
    return m.project_live_zero_refund(*f)


class Oracle(RelocationOracle):
    """The new bodies own no resource stores and never gate on target9/10/12 validity."""
    def __init__(self, *args, **kw):
        super().__init__(*args, **kw)
        self.zero_calls = []

    def cancel(self, pid):
        # Independent 004A57B0/005B9B40 transcription; cancellation has no
        # fabricated event and never consults a listener predicate.
        with self.acting(pid), self.inside('004A57B0', personId=pid):
            p = self.get('persons', pid)
            if not p['allocated']: return 0
            if not 0 <= p['missionId'] <= 43: return p['missionId']
            captured = self.get('persons', pid)['missionId']
            with self.inside('005B9B40', personId=pid, capturedMissionId=captured,
                             cancelEventWords=[-1, 0, 0]):
                if captured == 37: return 0
                helper = CANCEL_HANDLER[captured]
                if helper == '00441880': return 0
                if captured in MISSIONS + (23, 24):
                    value = self.handler(captured)
                else:
                    with self.inside(helper, personId=pid, capturedMissionId=captured):
                        value = self.boundary('cancellation-handler', 'effect-query', helper,
                            dict(personId=pid, capturedMissionId=captured,
                                 cancelEventWords=[-1, 0, 0]), 1)
                self.cancellations.append((pid, captured, value))
                return value

    def qualifies(self, mission):
        if mission not in MISSIONS: return super().qualifies(mission)
        # Supported real events reach9/10 only through event9's valid building
        # cast. Mission12/22 do not acquire invented event predicates.
        if mission not in (9, 10) or not self.actor()['valid']: return False
        if self.event['id'] != 9 or self.event['subjectType'] != 'building': return False
        subject = self.get('buildings', self.event['subjectId'])
        return bool(subject and subject['valid'] and
                    subject['id'] == self.actor()['missionArgs'][0])

    def handler(self, mission):
        if mission not in MISSIONS: return super().handler(mission)
        pid = self.pid
        with self.inside(HANDLER[mission], personId=pid, capturedMissionId=mission):
            self.zero_calls.append((pid, mission))
            a = self.actor()
            if not a['valid']: return 0
            current = a['locationId'] if 0 <= a['locationId'] <= 86 else -1
            if not self.valid('buildings', current): return 0
            target = self.actor()['missionArgs'][0]
            if mission in (9, 10):
                if not 0 <= target <= 16383: return 0
                # The force getter and validity read happen even though their
                # answer is discarded. Missing readable slots remain errors.
                force = self.force()
                bool(force and force['valid'])
                saved = dict(currentBuildingId=current, targetType='buildings', targetId=target)
            elif mission == 12:
                if not 0 <= target <= 1099: return 0
                # 00490B00 constructs an address, without reading its slot.
                saved = dict(currentBuildingId=current, targetType='persons', targetId=target)
            else:
                if not self.valid('forces', target): return 0
                force = self.force()
                saved = dict(currentBuildingId=current, targetType='forces', targetId=target,
                             savedActorForceId=force['id'] if force else None,
                             savedForce44=force['raw44'] if force and force['valid'] else -1)
            self.save(**saved)
            if self.notify():
                self.boundary('presentation', 'effect', PRESENTATION[mission],
                              dict(personId=pid, **saved, messageId=MESSAGE[mission]))
            # This pointer is the original actor, irrespective of writes to
            # mission/current/target fields inside the presentation boundary.
            self.return_zero()
            return 1


class LiveZeroRefundTests(unittest.TestCase):
    maxDiff = 7000

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
        if replay: self.assertEqual(t, m.replay_live_zero_refund(json.loads(json.dumps(t))))
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
        self.assertEqual(t, m.replay_live_zero_refund(t))
        return t

    def test_01_both_sources_all_entries_and_evidence(self):
        for source, entry in itertools.product(('S1', 'S2'), (
                'cancel-mission', 'event', 'relocate-officer', 'prepare-movement',
                'base-ownership', 'return', 'legion', 'governor', 'capacity',
                'role-sort', 'roster-sort', 'route', 'at-home', 'target-force',
                'force-legion', 'merge-legion')):
            with self.subTest(source=source, entry=entry):
                t = self.check_oracle(fixture(entry, source))
                self.assertEqual(t['profileId'], 'source-idb-S1-S2-live-zero-refund-v1')
                for key in ('stockVerified', 'vanillaVerified', 'machineCodeExecuted',
                            'callbacksAssumedNoninterfering', 'engineGuardIsOriginalRule',
                            'completeGameTransaction', 'allCancellationHandlersExecuted'):
                    self.assertFalse(t['evidence'][key])
                self.assertFalse(t['rng']['globalConsumptionVerified'])

    def test_02_four_handlers_notification_false_true_and_raw_returns(self):
        for source, mission, notify in itertools.product(('S1', 'S2'), MISSIONS, (False, True)):
            with self.subTest(source=source, mission=mission, notify=notify):
                f = fixture(source=source, mission=mission, notify=notify)
                t = self.check_oracle(f)
                self.assertEqual(t['nativeResult'], 1)
                notices = [r for r in t['observedEffects'] if r['helper'] in PRESENTATION.values()]
                self.assertEqual(len(notices), int(notify))
                self.assertFalse(any(r['helper'] in HANDLER.values() for r in t['observedEffects']))
                self.assertEqual(row(t['after']['frame'])['missionId'], 37)
                self.assertEqual(row(t['after']['frame'])['missionArgs'], [0] * 5)
                if notify:
                    self.assertEqual(notices[0]['args']['messageId'], MESSAGE[mission])
                    self.assertEqual(notices[0]['callStack'][-1]['helper'], HANDLER[mission])

    def test_03_actor_allocation_validity_short_circuit(self):
        for source, mission, status, raw in itertools.product(
                ('S1', 'S2'), MISSIONS, (-1, 0, 3, 5, 6, 8, 9, 99), (0, 1)):
            f = fixture(source=source, mission=mission)
            p = row(f[0]['frame']); p.update(status=status, rawDword17C=raw)
            refresh_people(f[0]['frame'])
            t = self.check_oracle(f, replay=False)
            self.assertEqual(t['nativeResult'], int(p['valid']))
            if not p['valid']:
                self.assertEqual(t['after']['frame'], f[0]['frame'])
                self.assertEqual(t['queries'], [])

    def test_04_current_location_normalization_and_validity_gates(self):
        for source, mission, location in itertools.product(
                ('S1', 'S2'), MISSIONS, (-2147483648, -1, 0, 1, 86, 87, 1086, 16383, 2147483647)):
            f = fixture(source=source, mission=mission)
            w = f[0]['frame']; row(w).update(locationId=location, status=5)
            t = self.check_oracle(f, replay=False)
            passed = location in (0, 1)
            self.assertEqual(t['nativeResult'], int(passed))
            if not passed: self.assertEqual(t['after']['frame'], w)
        for source, mission in itertools.product(('S1', 'S2'), MISSIONS):
            f = fixture(source=source, mission=mission)
            row(f[0]['frame'], 0, 'buildings').update(valid=False, kind=-1)
            row(f[0]['frame'])['missionArgs'][0] = 888  # absent, must not be touched
            self.assertEqual(self.check_oracle(f)['nativeResult'], 0)

    def test_05_argument_signed_boundaries_without_target_validity_gate(self):
        for source, mission, value in itertools.product(('S1', 'S2'), MISSIONS,
                (-2147483648, -1, 0, 1, 46, 47, 1099, 1100, 16383, 16384, 2147483647)):
            f = fixture(source=source, mission=mission); w = f[0]['frame']
            row(w)['missionArgs'][0] = value
            if mission == 22 and 0 <= value <= 46 and value != 0:
                add_force(w, value, valid=value == 46)
            expected = (value in (0, 46) if mission == 22 else
                        0 <= value <= (1099 if mission == 12 else 16383))
            with self.subTest(source=source, mission=mission, value=value):
                self.assertEqual(self.check_oracle(f, replay=False)['nativeResult'], int(expected))

    def test_06_invalid_and_absent_target_objects_are_not_validity_gates(self):
        for source, mission, notify, absent in itertools.product(
                ('S1', 'S2'), (9, 10, 12), (False, True), (False, True)):
            f = fixture(source=source, mission=mission, notify=notify); w = f[0]['frame']
            target = 1099 if mission == 12 else 16383
            row(w)['missionArgs'][0] = target
            table = 'persons' if mission == 12 else 'buildings'
            w[table] = [r for r in w[table] if r['id'] != target]
            if not absent:
                w[table].append(person(target, status=6) if mission == 12 else
                                building(target, valid=False, kind=-1))
            t = self.check_oracle(f)
            self.assertEqual(t['nativeResult'], 1)
            if notify:
                r = next(r for r in t['observedEffects'] if r['helper'] == PRESENTATION[mission])
                self.assertEqual(r['args']['targetId'], target)

    def test_07_notification_force_player_and_legion_gates(self):
        cases = ('force-invalid', 'player-negative', 'player-eight', 'legion-invalid',
                 'legion-number-two', 'player-zero', 'player-seven')
        for source, mission, case in itertools.product(('S1', 'S2'), MISSIONS, cases):
            f = fixture(source=source, mission=mission, notify=True); w = f[0]['frame']
            # Keep mission22's target distinct from the actor's force.
            if mission == 22: add_force(w, 1); row(w)['missionArgs'][0] = 1
            force, leg = row(w, 0, 'forces'), row(w, 0, 'legions')
            if case == 'force-invalid': force.update(valid=False, rulerId=-1)
            elif case == 'player-negative': force['playerIndex'] = -1
            elif case == 'player-eight': force['playerIndex'] = 8
            elif case == 'legion-invalid': set_legion(leg, forceId=-1)
            elif case == 'legion-number-two': set_legion(leg, number=2)
            elif case == 'player-seven': force['playerIndex'] = 7
            t = self.check_oracle(f, replay=False)
            notices = [r for r in t['observedEffects'] if r['helper'] in PRESENTATION.values()]
            self.assertEqual(len(notices), int(case in ('player-zero', 'player-seven')))
            self.assertEqual(t['nativeResult'], 1)

    def test_08_presentation_full_frame_mutation_tail_uses_live_values(self):
        for source, mission, status, same_home in itertools.product(
                ('S1', 'S2'), MISSIONS, (3, 5, 6, 99), (False, True)):
            f = fixture(source=source, mission=mission, notify=True)
            def effect(stage, w, c):
                if stage == 'presentation':
                    row(w).update(status=status, rawDword17C=0, homeBaseId=42,
                                  locationId=42 if same_home else 1, missionId=15,
                                  missionArgs=[43, 8, 7, 6, 5], rawLegionId=-1)
                    row(w, 0, 'buildings').update(valid=False, kind=-1)
                    row(w, 1, 'buildings').update(valid=False, kind=-1)
                    row(w, 0, 'forces').update(valid=False, rulerId=-1, raw44=123)
                    w['activePersonIds'] = [9, 7, 7]
                    w['rngState'] = 0x76543210
                    w['data']['nested']['value'] = 444
                    return dict(count=3)
                return 0
            t = self.check_oracle(f, effect=effect, replay=False)
            self.assertEqual(t['nativeResult'], 1)
            self.assertEqual(t['after']['frame']['rngState'], 0x76543210)
            self.assertEqual(t['rng']['observedCalls'], 3)
            self.assertEqual(t['after']['frame']['activePersonIds'], [9, 7, 7])
            presentation = next(r for r in t['observedEffects'] if r['helper'] == PRESENTATION[mission])
            self.assertEqual(presentation['args']['currentBuildingId'], 0)
            if mission == 22:
                self.assertEqual(presentation['args']['savedActorForceId'], 0)
                self.assertEqual(presentation['args']['savedForce44'], 9)
            scopes = [s['callStack'][-1]['locals'] for s in t['steps']
                      if s['callStack'] and s['callStack'][-1]['helper'] == '005B8400']
            self.assertTrue(any(s.get('savedHomeId') == 42 and
                                s.get('normalizedLocationId') == (42 if same_home else 1) for s in scopes))

    def test_09_saved_presentation_locals_survive_mutable_frame(self):
        for source, mission in itertools.product(('S1', 'S2'), MISSIONS):
            f = fixture(source=source, mission=mission, notify=True)
            def effect(stage, w, c):
                if stage == 'presentation':
                    row(w).update(status=5, homeBaseId=1, locationId=1,
                                  missionId=44, missionArgs=[0] * 5, rawLegionId=-1)
                    row(w, 0, 'forces')['raw44'] = -2147483648
                    row(w, 0, 'buildings').update(valid=False, kind=-1)
                    row(w, 1, 'buildings').update(valid=False, kind=-1)
                    w['observerPresent'] = True
                elif stage == 'acted-observer':
                    h = next(s['locals'] for s in c['callStack'] if s['helper'] == HANDLER[mission])
                    self.assertEqual(h['currentBuildingId'], 0)
                    self.assertEqual(h['targetId'], 0 if mission == 22 else 1)
                    if mission == 22: self.assertEqual(h['savedForce44'], 9)
                    w['observerPresent'] = False
                return 0
            t = self.check_oracle(f, effect=effect)
            self.assertEqual(t['nativeResult'], 1)
            self.assertEqual(t['returnCalls'], 0)
            self.assertEqual(row(t['after']['frame'])['missionId'], -1)

    def test_10_away_tail_saved_distance_and_live_active_nodes(self):
        for source, mission in itertools.product(('S1', 'S2'), MISSIONS):
            f = fixture(source=source, mission=mission, notify=True)
            def effect(stage, w, c):
                if stage == 'presentation': w['observerPresent'] = True
                elif stage == 'acted-observer':
                    row(w).update(homeBaseId=42, locationId=87, missionId=12, status=5)
                    w['activePersonIds'] = [7, 7]
                    w['observerPresent'] = False
                return 0
            t = self.check_oracle(f, effect=effect, distance=255)
            p = row(t['after']['frame'])
            self.assertEqual((p['missionId'], p['missionDuration'], p['locationId']), (12, 255, 87))
            self.assertEqual(t['after']['frame']['activePersonIds'], [7, 7])
            self.assertEqual(len(t['queries']), 1)
            self.assertEqual(t['queries'][0]['args'], dict(currentBuildingId=0, homeBuildingId=1))

    def test_11_same_home_query267_observer_saved_home_status5_gate(self):
        for source, mission, answer, stop in itertools.product(
                ('S1', 'S2'), MISSIONS, (False, True), (False, True)):
            f = fixture(source=source, mission=mission, notify=True)
            row(f[0]['frame'])['homeBaseId'] = 0
            def effect(stage, w, c):
                if stage == 'presentation': w['observerPresent'] = True
                elif stage in ('query267', 'acted-observer'):
                    row(w).update(homeBaseId=1, rawLegionId=-1, status=5 if stop else 3)
                    w['observerPresent'] = False
                return 0
            t = self.check_oracle(f, effect=effect, query267=answer, replay=False)
            self.assertEqual(t['returnCalls'], 0 if stop else 1)
            if not stop: self.assertEqual(row(t['after']['frame'])['homeBaseId'], 0)
            qs = [r for r in t['observedEffects'] if r['helper'] == '004890F0']
            self.assertEqual(len(qs), int(source == 'S2'))
            if qs: self.assertEqual(qs[0]['result'], answer)

    def test_12_real_event_paths_no_synthetic_event_for_cancel(self):
        for source, mission, entry in itertools.product(('S1', 'S2'), MISSIONS,
                                                       ('cancel-mission', 'event')):
            f = fixture(entry, source, mission=mission)
            t = self.check_oracle(f)
            if entry == 'cancel-mission':
                self.assertEqual(t['events'], [])
                self.assertFalse(any(s['helper'] == '005B9D30' for s in t['steps']))
            else:
                visits = t['events'][0]['visits']
                self.assertEqual(visits[0]['route'], 'handler-called' if mission in (9, 10) else 'predicate-false')
                self.assertEqual(visits[0]['handlerReturn'], 1 if mission in (9, 10) else None)
                self.assertTrue(any(r['helper'] == '004BA1D0' for r in t['observedEffects']))

    def test_13_event_predicate_valid_subject_matching_and_type(self):
        for source, mission, variant in itertools.product(('S1', 'S2'), (9, 10),
                ('matching', 'wrong-id', 'invalid-subject', 'person', 'null', 'event8', 'event10', 'event14')):
            f = fixture('event', source, mission=mission); w = f[0]['frame']; a = f[1]['args']
            if variant == 'wrong-id': a['subjectId'] = 0
            elif variant == 'invalid-subject': row(w, 1, 'buildings').update(valid=False, kind=-1)
            elif variant == 'person': a.update(subjectType='person', subjectId=9)
            elif variant == 'null': a.update(subjectType='null', subjectId=None)
            elif variant.startswith('event'): a['id'] = int(variant[5:])
            t = self.check_oracle(f, replay=False)
            self.assertEqual(t['events'][0]['visits'][0]['dispatcherReturn'], int(variant == 'matching'))

    def test_14_event_copied_nodes_and_live_mission_after_presentation(self):
        for source, mission in itertools.product(('S1', 'S2'), (9, 10)):
            f = fixture('event', source, mission=mission, notify=True); w = f[0]['frame']
            w['activePersonIds'] = [7, 7, 9, 403]
            row(w, 9).update(missionId=mission, missionArgs=[1, 0, 0, 0, 0],
                             status=5, homeBaseId=0, locationId=0, rawLegionId=0)
            def effect(stage, v, c):
                if stage == 'presentation':
                    v['activePersonIds'] = [403]
                    if c['personId'] == 7:
                        row(v).update(missionId=12, status=6)
                        row(v, 403).update(missionId=44)
                    else:
                        row(v, 9).update(status=5, homeBaseId=0, locationId=0)
                return 0
            t = self.check_oracle(f, effect=effect)
            self.assertEqual(t['events'][0]['copiedActivePersonIds'], [7, 7, 9, 403])
            visits = t['events'][0]['visits']
            self.assertEqual([v['route'] for v in visits],
                             ['handler-called', 'predicate-false', 'handler-called', 'mission-range-skip'])
            self.assertEqual(visits[1]['missionId'], 12)
            self.assertEqual(t['after']['frame']['activePersonIds'], [403])

    def test_15_missing_stale_unused_wrong_source_stack_args_and_alias(self):
        for source, mission in itertools.product(('S1', 'S2'), MISSIONS):
            f = fixture(source=source, mission=mission, notify=True); Oracle(f).run()
            for defect in ('missing', 'unused', 'stale', 'source', 'stack', 'args',
                           'kind', 'alias', 'legion-alias', 'rng', 'rng-bool', 'domain'):
                g = copy.deepcopy(f); records = g[2]['records']; r = records[0]
                if defect == 'missing': records.pop(0); [v.update(index=i) for i, v in enumerate(records)]
                elif defect == 'unused':
                    records.append(copy.deepcopy(records[-1])); records[-1]['index'] = len(records) - 1
                elif defect == 'stale': r['before']['managerDirty'] += 1
                elif defect == 'source': r['source'] = 'S2' if source == 'S1' else 'S1'
                elif defect == 'stack': r['callStack'][-1]['locals']['currentBuildingId'] = 1
                elif defect == 'args': r['args']['targetId'] += 1
                elif defect == 'kind': r.update(kind='effect-query', result=1)
                elif defect == 'alias': row(r['after'])['valid'] = False
                elif defect == 'legion-alias': row(r['after'], 0, 'legions')['forceId'] = -1
                elif defect == 'rng': r['rngConsumption']['calls'] = -1
                elif defect == 'rng-bool': r['rngConsumption']['calls'] = True
                elif defect == 'domain': r['after']['persons'].append(person(1000))
                with self.subTest(source=source, mission=mission, defect=defect): self.atomic_error(g)

    def test_16_unknown_rng_is_explicit_and_counts_are_not_inferred(self):
        for source, mission, count in itertools.product(('S1', 'S2'), MISSIONS, (None, 0, 17)):
            f = fixture(source=source, mission=mission, notify=True)
            def effect(stage, w, c):
                if stage == 'presentation':
                    w['rngState'] = 123456
                    return count
                return 0
            t = self.check_oracle(f, effect=effect)
            self.assertEqual(t['rng']['allCountsKnown'], count is not None)
            self.assertEqual(t['rng']['observedCalls'], count)
            self.assertEqual(t['rng']['localCalls'], 0)
            self.assertEqual(t['rng']['finalState'], 123456)

    def test_17_reject_and_native_budgets_roll_back_partial_work(self):
        for source, mission in itertools.product(('S1', 'S2'), MISSIONS):
            f = fixture(source=source, mission=mission, notify=True)
            f[3]['unknownEffects'] = 'reject'; self.atomic_defer(f)
            f = fixture(source=source, mission=mission, notify=True); Oracle(f).run()
            f[3]['engineGuard']['maxNativeCalls'] = 1; self.atomic_defer(f)
            f = fixture(source=source, mission=mission); Oracle(f).run()
            accepted = run(f); budget = accepted['nativeCalls']
            f[3]['engineGuard']['maxNativeCalls'] = budget - 1; self.atomic_defer(f)
            f[3]['engineGuard']['maxNativeCalls'] = budget
            self.assertTrue(run(f)['accepted'])

    def test_18_versioned_policy_and_old_api_replay_remain_separate(self):
        for key, value in (('zeroRefundDomain', 'wrong'), ('relocationDomain', 'wrong'),
                           ('frameProfile', 'wrong'), ('registryDomain', 'wrong')):
            f = fixture(); f[3][key] = value; self.atomic_error(f)
        f = fixture(); del f[3]['zeroRefundDomain']; self.atomic_error(f)
        f = fixture(); f[1]['args']['personId'] = True; self.atomic_error(f)
        f = fixture(); f[1]['args']['refund'] = 0; self.atomic_error(f)
        old = relocation_fixture('cancel-mission'); row(old[0]['frame'])['missionId'] = 9
        RelocationOracle(old).run(); oldcopy = copy.deepcopy(old)
        oldtrace = previous.project_officer_relocation(*old)
        self.assertEqual(old, oldcopy)
        self.assertEqual(oldtrace, previous.replay_officer_relocation(json.loads(json.dumps(oldtrace))))
        with self.assertRaises(ValueError): run(old)
        with self.assertRaises(ValueError): previous.project_officer_relocation(*fixture())
        with self.assertRaises(ValueError): m.replay_live_zero_refund(oldtrace)
        with self.assertRaises(ValueError): previous.replay_officer_relocation(self.check_oracle(fixture()))

    def test_19_replay_hash_payload_revision_and_exact_result(self):
        f = fixture(notify=True); t = self.check_oracle(f)
        for altered_hash in (False, True):
            g = copy.deepcopy(t); row(g['after']['frame'])['missionDuration'] ^= 1
            if altered_hash: g['traceHash'] = digest({k: v for k, v in g.items() if k != 'traceHash'})
            with self.assertRaises(ValueError): m.replay_live_zero_refund(g)
        g = copy.deepcopy(f); g[0] = copy.deepcopy(t['after'])
        replay = run(g); self.assertTrue(replay['replayed']); self.assertEqual(replay['after'], g[0])
        g[1]['args']['personId'] = 9; self.atomic_defer(g, 'replay-payload-conflict')
        f = fixture(); f[1]['expectedRevision'] = 1; self.atomic_defer(f, 'revision-conflict')
        f = fixture(); f[0]['revision'] = 2147483647; f[1]['expectedRevision'] = 2147483647
        self.atomic_error(f)

    def test_20_no_legacy_projector_transactions(self):
        modules = ('officer_relocation_profile', 'base_ownership_events_profile',
            'empty_legion_redistribution_profile', 'return_route_target_force_profile',
            'native_roster_sort_profile', 'recursive_officer_return_profile',
            'mission_event_composition_profile', 'mission_event_listener_profile',
            'mission_notification_tail_profile', 'officer_return_finalizer_profile',
            'legion_role_reconciliation_profile', 'return_mission_lifecycle_profile',
            'mission_cancellation_profile', 'mission_cancellation_v2_profile',
            'group_mission_cancellation_profile', 'special_mission_cancellation_profile',
            'facility_mission_cancellation_profile')
        for source, mission, entry in itertools.product(('S1', 'S2'), MISSIONS,
                                                       ('cancel-mission', 'event')):
            f = fixture(entry, source, mission=mission, notify=True); Oracle(f).run()
            with ExitStack() as stack:
                for name in modules:
                    mod = importlib.import_module(name)
                    for attr in dir(mod):
                        if attr.startswith('project_'):
                            stack.enter_context(patch.object(mod, attr, side_effect=AssertionError('legacy transaction called')))
                t = run(f)
            self.assertTrue(t['accepted'])
            self.assertEqual(t['after']['revision'], 1)
            self.assertEqual(len(t['after']['appliedCommands']), 1)

    def test_21_registry_noop_and_remaining_opaque_raw_return_values(self):
        for source, mission in itertools.product(('S1', 'S2'), range(-2, 46)):
            f = fixture(source=source, mission=mission)
            if mission in (23, 24): row(f[0]['frame'])['missionArgs'][0] = 0
            def effect(stage, w, c):
                return dict(result=-2147483648, count=0) if stage == 'cancellation-handler' else 0
            t = self.check_oracle(f, effect=effect, replay=False)
            if mission < 0 or mission > 43: self.assertEqual(t['nativeResult'], mission)
            elif mission == 37 or CANCEL_HANDLER[mission] == '00441880': self.assertEqual(t['nativeResult'], 0)
            elif mission not in MISSIONS + (23, 24): self.assertEqual(t['nativeResult'], -2147483648)

    def test_22_seeded_independent_matrix(self):
        rng = random.Random(0x5B8400)
        for i in range(128):
            source, mission = ('S1', 'S2')[i % 2], MISSIONS[(i // 2) % 4]
            f = fixture(source=source, mission=mission, notify=bool(i % 3)); w = f[0]['frame']
            row(w).update(status=rng.choice((3, 4, 5, 6, 8, 99)),
                          homeBaseId=rng.choice((0, 1, 42, -1)),
                          locationId=rng.choice((0, 1, 42, 86, 87, -1)),
                          rawLegionId=rng.choice((0, -1)))
            row(w)['missionArgs'][0] = rng.choice((0, 1, -1, 1099, 16383, 16384)) if mission != 22 else rng.choice((0, -1, 47))
            refresh_people(w)
            self.check_oracle(f, replay=i % 17 == 0)

    def test_23_both_source_body_bytes_match_independent_pins(self):
        root = Path(__file__).resolve().parents[1] / 'docs/sources/personnel-detachment-source-profile'
        for source, mission in itertools.product(('S1', 'S2'), MISSIONS):
            part, start, end, sha = SOURCE_BODIES[mission]
            lines = (root / (source + '-mission-code-' + part + '.asm.txt')).read_text().splitlines()
            raw = bytearray(); cursor = start
            for line in lines:
                match = re.match(r'^([0-9A-Fa-f]{8})\s+((?:[0-9a-f]{2} )*[0-9a-f]{2})(?:\s{2,})', line)
                if not match: continue
                address = int(match.group(1), 16)
                if start <= address < end:
                    self.assertEqual(address, cursor)
                    chunk = bytes.fromhex(match.group(2)); raw.extend(chunk); cursor += len(chunk)
            self.assertEqual(cursor, end)
            self.assertEqual(hashlib.sha256(raw).hexdigest(), sha)

    def test_24_native_return_nested_event_restores_actor_and_event_context(self):
        for source, mission in itertools.product(('S1', 'S2'), (9, 10)):
            f = fixture('event', source, mission=mission, notify=True); w = f[0]['frame']
            row(w).update(homeBaseId=0, locationId=0, status=3)
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
            nested = next(e for e in t['events'] if e['event']['id'] == 8)
            self.assertEqual(nested['parentEventIndex'], 0)
            self.assertEqual(nested['copiedActivePersonIds'], [7, 9, 7])
            self.assertEqual(nested['visits'][1]['handlerReturn'], 1)
            self.assertEqual(t['events'][0]['copiedActivePersonIds'], [7, 9, 7])
            self.assertEqual(t['events'][0]['visits'][0]['handlerReturn'], 1)
            self.assertEqual(t['events'][0]['visits'][1]['route'], 'mission-range-skip')
            returned = next(s for s in t['steps'] if s['helper'] == 'handler/return' and s['mission'] == mission)
            self.assertEqual(returned['callStack'][-1]['locals']['personId'], 7)
            self.assertEqual(returned['callStack'][0]['locals']['event']['id'], 9)
            self.assertEqual(t['after']['frame']['activePersonIds'], [403])
            # The same nested source path must defer atomically at depth1.
            f[3]['engineGuard']['maxEventDepth'] = 1
            self.atomic_defer(f, 'engine-guard-event-depth')

    def test_25_discarded_actor_force_reads_and_mission22_saved_scalar(self):
        for source, mission, kind in itertools.product(('S1', 'S2'), MISSIONS,
                                                       ('valid', 'invalid', 'null')):
            f = fixture(source=source, mission=mission); w = f[0]['frame']
            if mission == 22:
                add_force(w, 1); row(w)['missionArgs'][0] = 1
            if kind == 'invalid': row(w, 0, 'forces').update(valid=False, rulerId=-1)
            elif kind == 'null': row(w)['rawLegionId'] = -1
            t = self.check_oracle(f)
            steps = t['steps']; helpers = [s['helper'] for s in steps]
            gate_index = helpers.index('005B81D0/actor-valid')
            if mission in (9, 10):
                discarded = next(s for s in steps if s['helper'] == 'handler/discarded-force-valid')
                self.assertEqual(discarded['passed'], kind == 'valid')
                self.assertTrue(discarded['resultDiscarded'])
                self.assertLess(helpers.index('handler/discarded-force-valid'), gate_index)
                saved = next(s for s in steps if s['helper'] == 'handler/saved-pointers')
                self.assertNotIn('savedForce44', saved)
                self.assertNotIn('savedActorForceId', saved)
            elif mission == 12:
                self.assertNotIn('handler/discarded-force-valid', helpers)
                self.assertEqual(helpers[:gate_index].count('0047B2B0'), 0)
                pointer = next(s for s in steps if s['helper'] == '00490B00')
                self.assertFalse(pointer['validityChecked'])
                self.assertEqual(pointer['resultPointerId'], 1)
            else:
                saved = next(s for s in steps if s['helper'] == 'handler/saved-pointers')
                self.assertEqual(saved['savedActorForceId'], None if kind == 'null' else 0)
                self.assertEqual(saved['savedForce44'], 9 if kind == 'valid' else -1)
            self.assertEqual(t['nativeResult'], 1)

    def test_26_required_readable_slots_and_distance_result_domains(self):
        for source, mission, table in itertools.product(('S1', 'S2'), MISSIONS,
                                                       ('persons', 'buildings', 'legions', 'forces')):
            f = fixture(source=source, mission=mission); w = f[0]['frame']
            rid = 7 if table == 'persons' else 0
            w[table] = [r for r in w[table] if r['id'] != rid]
            self.atomic_error(f)
        for result in (None, True, -2, 256, '3', [3], dict(value=3)):
            f = fixture(); Oracle(f).run(); f[2]['records'][0]['result'] = result
            self.atomic_error(f)
        for result in (-1, 0, 255):
            self.assertEqual(row(self.check_oracle(fixture(), distance=result)['after']['frame'])['missionDuration'], result & 255)

    def test_27_relocation_cancel_body_mutation_preserves_enclosing_control(self):
        for source, mission in itertools.product(('S1', 'S2'), MISSIONS):
            f = fixture('relocate-officer', source); w = f[0]['frame']
            row(w).update(homeBaseId=1, locationId=0, rawLegionId=0,
                          missionId=mission, missionArgs=[0 if mission == 22 else 1, 0, 0, 0, 0])
            row(w, 0, 'forces')['playerIndex'] = 0
            def effect(stage, v, c):
                if stage == 'presentation':
                    row(v).update(status=6, rawDword17C=0, missionId=44,
                                  missionArgs=[9, 8, 7, 6, 5], homeBaseId=42, locationId=1)
                return 0
            t = self.check_oracle(f, effect=effect)
            self.assertEqual(row(t['after']['frame'])['missionId'], 37)
            self.assertEqual(row(t['after']['frame'])['missionArgs'], [0] * 5)
            self.assertEqual(row(t['after']['frame'])['missionDuration'], 99)
            self.assertEqual(t['after']['frame']['activePersonIds'], [])
            self.assertIsNone(t['nativeResult'])
            notice = next(r for r in t['observedEffects'] if r['helper'] == PRESENTATION[mission])
            self.assertEqual(notice['callStack'][0]['helper'], '004A8270')
            self.assertEqual(notice['callStack'][-2]['helper'], '005B9B40')

    def test_28_current_boundary86_and_generic_target16383_remain_distinct(self):
        for source, mission, notify in itertools.product(('S1', 'S2'), MISSIONS, (False, True)):
            f = fixture(source=source, mission=mission, notify=notify); w = f[0]['frame']
            row(w).update(locationId=86, homeBaseId=86, status=5)
            row(w, 86, 'buildings').update(valid=True, kind=2)
            if mission in (9, 10): row(w)['missionArgs'][0] = 16383
            elif mission == 12: row(w)['missionArgs'][0] = 1099
            else: add_force(w, 46); row(w)['missionArgs'][0] = 46
            t = self.check_oracle(f)
            self.assertEqual(t['nativeResult'], 1)
            self.assertEqual(t['returnCalls'], 0)
            self.assertEqual(row(t['after']['frame'])['missionId'], -1)


if __name__ == '__main__': unittest.main()
