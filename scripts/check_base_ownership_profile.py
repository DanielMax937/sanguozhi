"""P0-66 independent source interpreter and adversarial transaction checks.

Expected states and complete observations come from the test-only EmptyOracle
interpreter, extended with separately transcribed 004AD550 ownership stores,
word-width durability arithmetic and event9/10 predicates. No production planner,
primitive, projector, or trace is used to construct an expected result.
"""
import copy
import itertools
import json
import random
import unittest
from unittest.mock import patch

import base_ownership_events_profile as m
import empty_legion_redistribution_profile as previous
from check_empty_legion_profile import (
    Oracle as EmptyOracle, fixture as empty_fixture, empty_fixture as empty_dispatch_fixture,
    legion, set_legion, transfer_effect)
from check_return_route_target_force_profile import building as old_building
from check_recursive_officer_return_profile import row, refresh_people, digest
from check_native_roster_sort_profile import person

FRAME = 'source-idb-S1-S2-base-ownership-frame-v1'
DOMAIN = 'canonical-base-ownership-v1'
# Independent transcription of the initialized handler registry, used only for
# the newly exposed mutable tails. Mission23/24 still execute the old oracle.
HANDLER = {0:'005BBE30', 2:'005C6AA0', 5:'005D7FC0', 9:'005CB050',
           10:'005D5DD0', 21:'005BA8C0', 38:'005D69D0',
           41:'005D9C60', 42:'005D9C60', 43:'005D9C60'}


def building(bid, **changes):
    result = dict(old_building(bid), durabilityWord=1000,
                  subtypeMaxDurabilityWord=1000)
    result.update(changes)
    return result


def upgrade(f):
    """Explicit test fixture construction, not a production frame migration."""
    for b in f[0]['frame']['buildings']:
        b.update(durabilityWord=1000, subtypeMaxDurabilityWord=1000)
    for c in f[0]['frame']['cities']: c['rawFlagsA4'] = 0xFEDCBAFF
    f[1]['id'] = 'base-ownership-1'
    f[3].update(id='base-ownership-observe-v1', frameProfile=FRAME,
                baseOwnershipDomain=DOMAIN)
    return f


def fixture(entry='base-ownership', source='S1', **kw):
    f = upgrade(empty_fixture('target-force' if entry == 'base-ownership' else entry,
                              source, **kw))
    if entry == 'base-ownership':
        f[1].update(entry=entry, args=dict(buildingId=0, requestedLegionId=1))
        f[0]['frame']['legions'].append(legion(1))
    return f


def run(f):
    return m.project_base_ownership(*f)


class Oracle(EmptyOracle):
    def __init__(self, *args, **kw):
        super().__init__(*args, **kw)
        self.flag_writes, self.max_reads, self.durability_writes = [], [], []

    def boundary(self, stage, kind, helper, args, result=None):
        if helper == '004AD550':
            return self.base_ownership(**args)
        return super().boundary(stage, kind, helper, args, result)

    def maximum(self, bid, stage):
        b = self.get('buildings', bid)
        maximum = b['subtypeMaxDurabilityWord']
        force = self.get('forces', self.subtype_force(bid))
        tech = 26 if self.source == 'S1' else 36
        if force is not None and force['valid']:
            learned = (force['techniqueBits'][tech // 32] >> (tech % 32)) & 1
            maximum += 3000 * learned
        maximum &= 65535
        if self.source == 'S2': maximum = min(24000, maximum)
        self.max_reads.append((bid, stage, maximum))
        return maximum

    def base_ownership(self, buildingId, requestedLegionId):
        bid, lid = buildingId, requestedLegionId
        with self.inside('004AD550', buildingId=bid, requestedLegionId=lid):
            if not self.valid('buildings', bid): return
            if lid != -1 and not 0 <= lid <= 46: return
            old_legion = self.base_legion(bid)
            self.save(savedOldLegionId=old_legion)
            old_force = self.target_force(bid, 'base-ownership-before')
            self.save(savedOldForceId=old_force)
            l = self.get('legions', lid)
            force = l['forceId'] if l is not None and l['valid'] else -1
            self.save(savedRequestedForceId=force)
            if l is not None and l['valid'] and not 0 <= force <= 46: return
            b = self.get('buildings', bid)
            info = self.get('facilityInfos', b['kind'])
            category = -1 if info is None else info['category']
            if category == 1 or (b['kind'] != 24 and category == 3) or category == 2:
                b['rawOwnerForceId'] = force
            if self.subtype(bid):
                b['legionId'] = lid
                current = b['durabilityWord'] if b['valid'] else 0
                cap = self.maximum(bid, 'legion-compare')
                if current > cap:  # 16-bit unsigned JBE, not a signed compare.
                    requested = self.maximum(bid, 'legion-clamp-request')
                    cap = self.maximum(bid, 'generic-durability-clamp')
                    signed_request = requested if requested < 32768 else requested - 65536
                    signed_cap = cap if cap < 32768 else cap - 65536
                    value = 0 if signed_request <= 0 else cap if signed_cap <= signed_request else requested
                    b['durabilityWord'] = value
                    self.durability_writes.append((bid, requested, cap, value))
            current_force = self.target_force(bid, 'base-ownership-after')
            if old_force != current_force:
                city_id = bid if 0 <= bid <= 41 else None
                self.save(savedResetCityId=city_id)
                if city_id is not None and self.valid('cities', city_id):
                    for bit in (0, 1, 4):
                        city = self.get('cities', city_id)
                        old = city['rawFlagsA4']
                        city['rawFlagsA4'] = old & ~(1 << bit)
                        self.flag_writes.append((city_id, 0xA4, 4, bit, old, city['rawFlagsA4']))
                self.emit(dict(id=9, subjectType='building', subjectId=bid, argument=0))
            elif old_legion != self.base_legion(bid):
                self.emit(dict(id=10, subjectType='building', subjectId=bid, argument=0))

    def qualifies(self, mission):
        if self.event['id'] in (8, 14): return super().qualifies(mission)
        a, e = self.actor(), self.event
        if mission == 21:
            # Context constructors only form pointers. The validity method is
            # the first actual read, short-circuiting actor, force, arg1, arg3.
            if not a['valid'] or a['missionId'] != 21: return False
            if not self.valid('forces', a['missionArgs'][0]): return False
            if not self.valid('buildings', a['missionArgs'][1]): return False
            if not self.valid('buildings', a['missionArgs'][3]): return False
            return (e['id'] == 9 and e['subjectType'] == 'building' and
                    e['subjectId'] in (a['missionArgs'][1], a['missionArgs'][3]))
        if mission not in (0, 2, 5, 9, 10, 23, 24, 38, 41, 42, 43):
            return False
        if not a['valid']: return False
        if e['id'] != 9 or e['subjectType'] != 'building': return False
        subject = self.get('buildings', e['subjectId'])
        if subject is None or not subject['valid']: return False
        if mission in (0, 38): return subject['id'] == a['homeBaseId']
        if mission in (2, 5, 9, 10, 23, 24): return subject['id'] == a['missionArgs'][0]
        return subject['id'] == a['missionArgs'][1]

    def handler(self, mission):
        if mission in (23, 24) or self.event['id'] in (8, 14):
            return super().handler(mission)
        with self.inside(HANDLER[mission], personId=self.pid, capturedMissionId=mission):
            return self.boundary('ownership-handler', 'effect-query', HANDLER[mission],
                dict(personId=self.pid, capturedMissionId=mission,
                     event=copy.deepcopy(self.event)), 1)

    def emit(self, event):
        if event['id'] in (8, 14): return super().emit(event)
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
                if event['id'] == 9:
                    self.boundary('ownership-event-tail', 'effect', '004BA1D0',
                                  dict(event=copy.deepcopy(event)))
                if self.w['observerPresent']:
                    self.boundary('event-observer', 'effect', 'observer.virtual1B4',
                                  dict(nativeArgs=[0, 0, 0, 0], caller='004BBAA0'))
        finally:
            self.event_stack.pop()
            self.event, self.pid, self.visit = old

    def run(self):
        if self.f[1]['entry'] != 'base-ownership': return super().run()
        self.base_ownership(**self.f[1]['args'])
        self.f[2]['records'] = copy.deepcopy(self.records)
        return self


class BaseOwnershipTests(unittest.TestCase):
    maxDiff = 5000

    def check_oracle(self, f, replay=True, **kw):
        expected = Oracle(f, **kw).run()
        original = copy.deepcopy(f)
        result = run(f)
        self.assertTrue(result['accepted'], result['reason'])
        self.assertEqual(result['after']['frame'], expected.w)
        self.assertEqual(result['events'], expected.events)
        self.assertEqual(result['nativeResult'], expected.native_result)
        self.assertEqual(result['returnCalls'], expected.return_calls)
        self.assertEqual(result['observedEffects'], [r for r in expected.records if r['kind'] != 'query'])
        self.assertEqual(result['queries'], [r for r in expected.records if r['kind'] == 'query'])
        self.assertEqual(result['rng']['localCalls'], expected.local_rng)
        flags = [s for s in result['steps'] if s['helper'] == '00472520/store']
        self.assertEqual([(s['cityId'], s['offset'], s['width'], s['bit'], s['oldDword'], s['value'])
                          for s in flags], expected.flag_writes)
        max_helper = '008EA050/cap' if f[0]['source'] == 'S2' else '0047A822/low16'
        reads = [s for s in result['steps'] if s['helper'] == max_helper]
        self.assertEqual([(s['callStack'][-1]['locals']['buildingId'],
                           s['callStack'][-1]['locals']['stage'], s['result'])
                          for s in reads], expected.max_reads)
        stores = [s for s in result['steps'] if s['helper'] == '00487E20/store']
        self.assertEqual([(s['buildingId'], s['requestedWord'], s['maximumWord'], s['value'])
                          for s in stores], expected.durability_writes)
        self.assertEqual(result['after']['revision'], f[0]['revision'] + 1)
        self.assertEqual(len(result['after']['appliedCommands']), len(f[0]['appliedCommands']) + 1)
        self.assertEqual(f, original)
        if replay: self.assertEqual(result, m.replay_base_ownership(json.loads(json.dumps(result))))
        return result

    def atomic_error(self, f):
        before = copy.deepcopy(f)
        with self.assertRaises(ValueError): run(f)
        self.assertEqual(f, before)

    def atomic_defer(self, f, reason):
        before = copy.deepcopy(f)
        t = run(f)
        self.assertFalse(t['accepted'])
        self.assertEqual(t['reason'], reason)
        self.assertEqual(t['after'], f[0])
        self.assertEqual(t['steps'], [])
        self.assertEqual(t['events'], [])
        self.assertEqual(f, before)
        self.assertEqual(t, m.replay_base_ownership(t))
        return t

    def test_01_all_entries_both_sources_and_evidence(self):
        entries = ('base-ownership', 'event', 'return', 'legion', 'governor',
                   'capacity', 'role-sort', 'roster-sort', 'route', 'at-home',
                   'target-force', 'force-legion', 'merge-legion')
        for source, entry in itertools.product(('S1', 'S2'), entries):
            with self.subTest(source=source, entry=entry):
                t = self.check_oracle(fixture(entry, source), effect=transfer_effect)
                for key in ('callbacksAssumedNoninterfering', 'stockVerified',
                            'vanillaVerified', 'machineCodeExecuted',
                            'engineGuardIsOriginalRule'):
                    self.assertFalse(t['evidence'][key])
                self.assertFalse(t['rng']['globalConsumptionVerified'])

    def test_02_force_change_legion_change_and_identical_owner(self):
        for source, requested, force in itertools.product(
                ('S1', 'S2'), (-1, 0, 1), (0, 1)):
            f = fixture(source=source); w = f[0]['frame']
            w['activePersonIds'] = []
            f[1]['args']['requestedLegionId'] = requested
            add_force(w, 1)
            set_legion(row(w, 1, 'legions'), forceId=force)
            t = self.check_oracle(f)
            expected = [] if requested == 0 else [10] if requested == 1 and force == 0 else [9]
            self.assertEqual([e['event']['id'] for e in t['events']], expected)
            self.assertEqual(row(t['after']['frame'], 0, 'buildings')['legionId'], requested)
            self.assertEqual(row(t['after']['frame'], 0, 'cities')['rawFlagsA4'],
                             0xFEDCBAEC if expected == [9] else 0xFEDCBAFF)
            self.assertEqual([r['helper'] for r in t['observedEffects']],
                             ['004BA1D0'] if expected == [9] else [])

    def test_03_validity_requested_range_and_missing_slot_order(self):
        for source, request in itertools.product(('S1', 'S2'),
                (-2147483648, -2, 47, 2147483647)):
            f = fixture(source=source); f[1]['args']['requestedLegionId'] = request
            t = self.check_oracle(f)
            self.assertEqual(t['after']['frame'], f[0]['frame'])
            self.assertFalse(any(s['helper'] == '004AD58C/virtual44' for s in t['steps']))
        for bid in (-2147483648, -1, 16384, 2147483647):
            f = fixture(); f[1]['args']['buildingId'] = bid
            self.assertEqual(self.check_oracle(f)['after']['frame'], f[0]['frame'])
        f = fixture(); row(f[0]['frame'], 0, 'buildings').update(valid=False, kind=-1)
        f[0]['frame']['legions'] = [row(f[0]['frame'], 0, 'legions')]
        self.assertEqual(self.check_oracle(f)['after']['frame'], f[0]['frame'])
        f = fixture(); f[1]['args']['requestedLegionId'] = 46
        self.atomic_error(f)  # A canonical pointer requires a readable slot.
        f = fixture(); f[0]['frame']['legions'].append(legion(46, forceId=-1))
        f[1]['args']['requestedLegionId'] = 46
        t = self.check_oracle(f)
        self.assertEqual(row(t['after']['frame'], 0, 'buildings')['legionId'], 46)
        self.assertEqual(t['events'][0]['event']['id'], 9)

    def test_04_facility_category_precedence_and_kind24_exception(self):
        for source, kind, category in itertools.product(('S1', 'S2'), (3, 24), (0, 1, 2, 3, 4)):
            f = fixture(source=source); w = f[0]['frame']
            f[1]['args']['buildingId'] = 16383
            row(w, 16383, 'buildings').update(kind=kind, rawOwnerForceId=5)
            row(w, kind, 'facilityInfos')['category'] = category
            t = self.check_oracle(f)
            direct = category in (1, 2) or (category == 3 and kind != 24)
            after = row(t['after']['frame'], 16383, 'buildings')
            self.assertEqual(after['rawOwnerForceId'], 0 if direct else 5)
            self.assertEqual(after['legionId'], 0)
            self.assertEqual([e['event']['id'] for e in t['events']], [9] if direct else [])
            reads = [s['helper'] for s in t['steps'] if s['helper'] in
                     ('00487B4A', '00487B6F', '00487B9F')]
            per_call = ['00487B4A']
            if category != 1:
                if kind != 24: per_call.append('00487B6F')
                if kind == 24 or category != 3: per_call.append('00487B9F')
            self.assertEqual(reads,per_call * 3)

    def test_05_city_reset_generic_id_and_mismatched_subtypes(self):
        for source in ('S1', 'S2'):
            f = fixture(source=source); w = f[0]['frame']
            row(w, 0, 'buildings').update(kind=3, rawOwnerForceId=4)
            row(w, 3, 'facilityInfos')['category'] = 1
            t = self.check_oracle(f)
            self.assertEqual(row(t['after']['frame'], 0, 'buildings')['legionId'], 0)
            writes = [s for s in t['steps'] if s['helper'] == '00472520/store']
            self.assertEqual([s['bit'] for s in writes], [0, 1, 4])
            self.assertEqual([s['value'] for s in writes], [0xFEDCBAFE, 0xFEDCBAFC, 0xFEDCBAEC])
            f = fixture(source=source); w = f[0]['frame']
            row(w, 0, 'buildings').update(kind=1, durabilityWord=65535)
            self.assertEqual(self.check_oracle(f)['after']['frame'], w)
            f = fixture(source=source); w = f[0]['frame']
            row(w, 0, 'buildings').update(kind=3, rawOwnerForceId=4, subtypeValid=False)
            row(w, 0, 'cities')['valid'] = False
            row(w, 3, 'facilityInfos')['category'] = 1
            self.atomic_error(f)  # Fixed canonical city slots are type-valid.

    def test_06_durability_unsigned_compare_signed_clamp_and_source_cap(self):
        cases = ((1000,1000), (1001,1000), (65535,0), (65535,32767),
                 (65535,32768), (65535,65534), (65535,65535),
                 (24001,24000), (30000,25000), (1,65535))
        for source, bid, (current, maximum) in itertools.product(('S1', 'S2'), (0, 42, 52), cases):
            f = fixture(source=source); w = f[0]['frame']
            f[1]['args']['buildingId'] = bid
            b = row(w, bid, 'buildings')
            b.update(valid=True, kind=0 if bid == 0 else 1 if bid == 42 else 2,
                     durabilityWord=current, subtypeMaxDurabilityWord=maximum)
            t = self.check_oracle(f, replay=False)
            cap = min(maximum, 24000) if source == 'S2' else maximum
            expected = current if current <= cap else cap if 0 < cap < 32768 else 0
            self.assertEqual(row(t['after']['frame'], bid, 'buildings')['durabilityWord'], expected)
            reads = [s for s in t['steps'] if s['helper'] == '0047A822/low16']
            self.assertEqual(len(reads), 3 if current > cap else 1)
            writes = [s for s in t['steps'] if s['helper'] == '00487E20/store']
            self.assertTrue(all(s['width'] == 2 and s['offset'] == 0x10 for s in writes))

    def test_07_technique_source_selection_wrapping_and_new_owner(self):
        for source, tech, intrinsic in itertools.product(('S1', 'S2'), (26, 36), (1000, 23000, 64000, 65535)):
            f = fixture(source=source); w = f[0]['frame']
            add_force(w, 1)
            set_legion(row(w, 1, 'legions'), forceId=1)
            row(w, 1, 'forces')['techniqueBits'][tech // 32] = 1 << (tech % 32)
            row(w, 0, 'buildings').update(durabilityWord=65535, subtypeMaxDurabilityWord=intrinsic)
            t = self.check_oracle(f, replay=False)
            cap = (intrinsic + (3000 if tech == (26 if source == 'S1' else 36) else 0)) & 65535
            if source == 'S2': cap = min(cap,24000)
            expected = 65535 if cap == 65535 else cap if cap < 32768 else 0
            self.assertEqual(row(t['after']['frame'], 0, 'buildings')['durabilityWord'], expected)
            tech_reads = [s for s in t['steps'] if s['helper'] == '004811E0' and 'techniqueId' in s]
            self.assertTrue(all(s['forceId'] == 1 for s in tech_reads))
        f = fixture(); w = f[0]['frame']; add_force(w, 1, valid=False)
        set_legion(row(w, 1, 'legions'), forceId=1)
        row(w, 1, 'forces')['techniqueBits'] = [0xffffffff, 0xffffffff]
        row(w, 0, 'buildings').update(durabilityWord=9000, subtypeMaxDurabilityWord=1000)
        self.assertEqual(row(self.check_oracle(f)['after']['frame'], 0, 'buildings')['durabilityWord'], 1000)

    def test_08_event_predicate_matrix_and_direct_legacy_tails(self):
        selected = {0, 2, 5, 9, 10, 21, 23, 24, 38, 41, 42, 43}
        for source, event, mission in itertools.product(('S1', 'S2'), (9, 10), range(44)):
            f = event_fixture(mission, event, source)
            t = self.check_oracle(f, replay=False)
            v = t['events'][0]['visits'][0]
            if mission == 37: self.assertEqual(v['route'], 'mission37-skip')
            else: self.assertEqual(v['dispatcherReturn'], int(event == 9 and mission in selected))
            if event == 10: self.assertEqual(t['observedEffects'], [])
            elif mission in (23, 24):
                self.assertEqual(row(t['after']['frame'])['missionId'], -1)
                self.assertFalse(any(r['helper'] in ('005B6D00','005CFB70') for r in t['observedEffects']))
            elif mission in selected:
                self.assertEqual(t['observedEffects'][0]['kind'], 'effect-query')
                self.assertEqual(t['observedEffects'][0]['helper'], HANDLER[mission])

    def test_09_typed_subject_listener_validity_and_matching_field(self):
        for mission, subject in itertools.product((0,2,5,9,10,23,24,38,41,42,43), ('null','person','mismatch','invalid','listener-invalid')):
            f = event_fixture(mission); w = f[0]['frame']
            if subject == 'null': f[1]['args'].update(subjectType='null',subjectId=None)
            elif subject == 'person': f[1]['args'].update(subjectType='person',subjectId=7)
            elif subject == 'mismatch': f[1]['args']['subjectId'] = 42
            elif subject == 'invalid': row(w,0,'buildings').update(valid=False,kind=-1)
            else: row(w).update(status=6); refresh_people(w)
            t = self.check_oracle(f, replay=False)
            self.assertEqual(t['events'][0]['visits'][0]['dispatcherReturn'], 0)
        for mission in (0,38):
            f = event_fixture(mission); row(f[0]['frame'])['missionArgs'][0] = 42
            self.assertEqual(self.check_oracle(f)['events'][0]['visits'][0]['dispatcherReturn'], 1)
        for mission in (41,42,43):
            f = event_fixture(mission); row(f[0]['frame'])['missionArgs'][0] = 42
            self.assertEqual(self.check_oracle(f)['events'][0]['visits'][0]['dispatcherReturn'], 1)

    def test_10_context21_force_argument_validity_and_pointer_identity(self):
        for event, invalid in itertools.product((9,10), ('force','first','second','actor')):
            f = event_fixture(21,event); w = f[0]['frame']
            if invalid == 'force': row(w)['missionArgs'][0] = -1
            elif invalid == 'first': row(w,0,'buildings').update(valid=False,kind=-1)
            elif invalid == 'second': row(w,1,'buildings').update(valid=False,kind=-1)
            else: row(w).update(status=6); refresh_people(w)
            t = self.check_oracle(f)
            self.assertEqual(t['events'][0]['visits'][0]['dispatcherReturn'], 0)
        f = event_fixture(21); w = f[0]['frame']
        row(w)['rawLegionId'] = -1  # Context force is arg0, not actor allegiance.
        f[1]['args']['subjectId'] = 1
        self.assertEqual(self.check_oracle(f)['events'][0]['visits'][0]['dispatcherReturn'], 1)
        f = event_fixture(21); f[0]['frame']['buildings'] = [b for b in f[0]['frame']['buildings'] if b['id'] != 16383]
        f[1]['args']['subjectId'] = 16383
        self.assertEqual(self.check_oracle(f)['events'][0]['visits'][0]['dispatcherReturn'], 0)
        f = event_fixture(21,10); row(f[0]['frame'])['missionArgs'][3] = 999
        self.atomic_error(f)  # Context validity occurs before event10 switch.
        f = event_fixture(20,10); row(f[0]['frame'])['missionArgs'] = [46,1000,0,1001,0]
        self.check_oracle(f)  # Constructor forms pointers without dereferencing.

    def test_11_live_copied_roster_mutations_handler_return_and_tail_order(self):
        for source in ('S1','S2'):
            f = event_fixture(0, source=source); w = f[0]['frame']
            w['activePersonIds'] = [7,7,9,403]
            row(w,9).update(missionId=0,homeBaseId=0)
            row(w,403).update(status=3,missionId=0,homeBaseId=0)
            refresh_people(w)
            def effect(stage,v,c):
                if stage == 'ownership-handler':
                    if c['visitIndex'] == 0:
                        v['activePersonIds'] = [9]
                        row(v)['missionId'] = 38
                        v['executingPersonId'] = 9
                        row(v,403)['missionId'] = 43
                        row(v,403)['missionArgs'][1] = 0
                    v['rngState'] = (v['rngState'] + 7) & 0xffffffff
                    return dict(count=2,result=-2147483648+c['visitIndex'])
                if stage == 'ownership-event-tail':
                    v['observerPresent'] = True
                    v['data']['nested']['value'] = 900
                    return 3
                if stage == 'event-observer':
                    v['data']['nested']['value'] += 1
                return 0
            t = self.check_oracle(f,effect=effect)
            visits = t['events'][0]['visits']
            self.assertEqual(t['events'][0]['copiedActivePersonIds'],[7,7,9,403])
            self.assertEqual([v['missionId'] for v in visits],[0,38,None,43])
            self.assertEqual(visits[2]['route'],'executing-person-skip')
            self.assertEqual([v['handlerReturn'] for v in visits],[-2147483648,-2147483647,None,-2147483645])
            self.assertEqual([r['helper'] for r in t['observedEffects']],
                             ['005BBE30','005D69D0','005D9C60','004BA1D0','observer.virtual1B4'])
            self.assertEqual(t['rng']['observedCalls'],9)
            self.assertEqual(t['after']['frame']['data']['nested']['value'],901)

    def test_12_event_tail_full_mutability_observer_freshness_and_saved_owners(self):
        f = fixture(); w = f[0]['frame']; add_force(w,1)
        set_legion(row(w,1,'legions'),forceId=1)
        w['observerPresent'] = True
        row(w)['missionId'] = -1
        def effect(stage,v,c):
            if stage == 'ownership-event-tail':
                row(v,0,'buildings')['legionId'] = 0
                row(v,0,'cities')['rawFlagsA4'] = 0xFFFFFFFF
                v['observerPresent'] = False
                v['managerDirty'] = 12
                v['rngState'] = 0xFFFFFFFF
                return None
            raise AssertionError('unexpected boundary '+stage)
        t = self.check_oracle(f,effect=effect)
        self.assertEqual([r['helper'] for r in t['observedEffects']],['004BA1D0'])
        self.assertEqual(row(t['after']['frame'],0,'cities')['rawFlagsA4'],0xFFFFFFFF)
        self.assertEqual([e['event']['id'] for e in t['events']],[9])
        saved = t['observedEffects'][0]['callStack'][0]['locals']
        self.assertEqual(saved,dict(buildingId=0,requestedLegionId=1,savedOldLegionId=0,
                                   savedOldForceId=0,savedRequestedForceId=1,savedResetCityId=0))
        self.assertIsNone(t['rng']['observedCalls'])
        self.assertFalse(t['rng']['allCountsKnown'])
        self.assertEqual(t['rng']['finalState'],0xFFFFFFFF)

    def test_13_merge_live_forward_scan_uses_native_ownership(self):
        for source in ('S1','S2'):
            f = fixture('merge-legion',source); w = f[0]['frame']
            w['activePersonIds'] = []; w['observerPresent'] = True
            row(w,1,'buildings')['legionId'] = 1
            row(w,42,'buildings')['legionId'] = 1
            def effect(stage,v,c):
                if stage == 'event-observer' and c['event']['id'] == 10:
                    bid = c['event']['subjectId']
                    if bid == 0: row(v,1,'buildings')['legionId'] = 0
                    if bid == 1: row(v,42,'buildings')['legionId'] = 0
                return transfer_effect(stage,v,c)
            t = self.check_oracle(f,effect=effect)
            self.assertEqual([e['event']['subjectId'] for e in t['events']],[0,1,42])
            self.assertTrue(all(e['event']['id'] == 10 for e in t['events']))
            self.assertFalse(any(r['helper'] == '004AD550' for r in t['observedEffects']))
            self.assertFalse(row(t['after']['frame'],0,'legions')['valid'])
            self.assertEqual([row(t['after']['frame'],i,'buildings')['legionId'] for i in (0,1,42)],[1,1,1])

    def test_14_empty_legion_merge_and_force_change_listeners_integrate(self):
        for source in ('S1','S2'):
            f = upgrade(empty_dispatch_fixture(source,primary=False))
            t = self.check_oracle(f)
            self.assertFalse(row(t['after']['frame'],0,'legions')['valid'])
            self.assertFalse(any(r['helper'] == '004AD550' for r in t['observedEffects']))
            f = fixture('merge-legion',source); w = f[0]['frame']
            add_force(w,1); set_legion(row(w,1,'legions'),forceId=1)
            row(w).update(status=5,missionId=0,homeBaseId=0)
            refresh_people(w)
            t = self.check_oracle(f)
            self.assertEqual([e['event']['id'] for e in t['events']],[9,9,9])
            self.assertEqual(sum(r['helper'] == '004BA1D0' for r in t['observedEffects']),3)
            self.assertEqual(sum(r['helper'] == '005BBE30' for r in t['observedEffects']),1)

    def test_15_strict_observation_binding_and_atomicity(self):
        f = event_fixture(0); f[0]['frame']['observerPresent'] = True
        Oracle(f).run()
        mutations = (
            lambda x:x[2]['records'].clear(),
            lambda x:x[2]['records'].pop(),
            lambda x:x[2]['records'].append(copy.deepcopy(x[2]['records'][-1])),
            lambda x:x[2]['records'][0].update(source='S2'),
            lambda x:x[2]['records'][0].update(kind='effect'),
            lambda x:x[2]['records'][0].update(helper='005D69D0'),
            lambda x:x[2]['records'][0].update(index=1),
            lambda x:x[2]['records'][0]['args'].update(personId=9),
            lambda x:x[2]['records'][0]['args'].update(capturedMissionId=38),
            lambda x:x[2]['records'][0]['args']['event'].update(argument=9),
            lambda x:x[2]['records'][0]['callStack'][0]['locals']['event'].update(subjectId=1),
            lambda x:x[2]['records'][0]['callStack'][-1]['locals'].update(personId=9),
            lambda x:x[2]['records'][0]['before'].update(managerDirty=11),
            lambda x:x[2]['records'][0]['after']['cities'][0].pop('rawFlagsA4'),
            lambda x:x[2]['records'][0]['after']['buildings'][0].pop('durabilityWord'),
            lambda x:x[2]['records'][0]['after']['buildings'][0].update(subtypeMaxDurabilityWord=65536),
            lambda x:x[2]['records'][0]['after']['data'].update(extra=1),
            lambda x:x[2]['records'][0]['after']['legions'][0].update(forceId=2),
            lambda x:x[2]['records'][1]['before'].update(observerPresent=False),
        )
        for i,mutate in enumerate(mutations):
            with self.subTest(mutation=i):
                case = copy.deepcopy(f); mutate(case); self.atomic_error(case)
        case = copy.deepcopy(f); case[3]['unknownEffects'] = 'reject'
        self.atomic_defer(case,'unresolved-effect:005BBE30')
        f = event_fixture(-1); f[3]['unknownEffects'] = 'reject'
        self.atomic_defer(f,'unresolved-effect:004BA1D0')
        f = event_fixture(-1,10); f[0]['frame']['observerPresent'] = True
        f[3]['unknownEffects'] = 'reject'
        self.atomic_defer(f,'unresolved-effect:observer.virtual1B4')

    def test_16_mutable_query_requires_signed32_exact_type(self):
        f = event_fixture(0); Oracle(f).run()
        for value in (None, True, False, '1', 1.0, [], {}, -2147483649,2147483648):
            case = copy.deepcopy(f); case[2]['records'][0]['result'] = value
            self.atomic_error(case)
        for value in (-2147483648,-1,0,1,2147483647):
            f = event_fixture(0)
            t = self.check_oracle(f,effect=lambda stage,w,c:
                dict(result=value,count=0) if stage == 'ownership-handler' else 0)
            visit = t['events'][0]['visits'][0]
            self.assertEqual(visit['dispatcherReturn'],1)
            self.assertEqual(visit['handlerReturn'],value)

    def test_17_schema_source_ranges_and_version_separation(self):
        mutations = (
            lambda x:x[3].pop('baseOwnershipDomain'),
            lambda x:x[3].update(baseOwnershipDomain='wrong'),
            lambda x:x[3].update(frameProfile='source-idb-S1-S2-empty-legion-frame-v1'),
            lambda x:x[0].update(source='S3'),
            lambda x:x[2].update(source='S2'),
            lambda x:x[0]['frame']['cities'][0].update(rawFlagsA4=-1),
            lambda x:x[0]['frame']['cities'][0].update(rawFlagsA4=4294967296),
            lambda x:x[0]['frame']['cities'][0].update(rawFlagsA4=True),
            lambda x:x[0]['frame']['buildings'][0].update(durabilityWord=-1),
            lambda x:x[0]['frame']['buildings'][0].update(durabilityWord=65536),
            lambda x:x[0]['frame']['buildings'][0].update(subtypeMaxDurabilityWord=True),
            lambda x:x[1]['args'].update(buildingId=True),
            lambda x:x[1]['args'].update(buildingId=2147483648),
            lambda x:x[1]['args'].update(requestedLegionId=-2147483649),
            lambda x:x[1]['args'].update(requestedLegionId=True),
            lambda x:x[1]['args'].update(unused=0),
        )
        for i,mutate in enumerate(mutations):
            with self.subTest(mutation=i):
                f = fixture(); mutate(f); self.atomic_error(f)
        for event in (7,11,12,13,15,True):
            f = event_fixture(); f[1]['args']['id'] = event; self.atomic_error(f)
        for subject in (dict(subjectType='null',subjectId=0),
                        dict(subjectType='building',subjectId=-1),
                        dict(subjectType='person',subjectId=1100),
                        dict(subjectType='force',subjectId=0)):
            f = event_fixture(); f[1]['args'].update(subject); self.atomic_error(f)
        f = empty_fixture('force-legion'); EmptyOracle(f).run()
        old = previous.project_empty_legion(*f)
        self.assertTrue(old['accepted'])
        self.assertEqual(old,previous.replay_empty_legion(old))
        self.assertNotIn('rawFlagsA4',old['after']['frame']['cities'][0])
        self.atomic_error(f)
        with self.assertRaises(ValueError): previous.project_empty_legion(*fixture())
        # Calling inherited public projectors must never become an oracle shortcut.
        with patch.object(previous,'project_empty_legion',side_effect=AssertionError('old projector used')):
            self.check_oracle(fixture())

    def test_18_replay_conflict_revision_and_resigned_trace_tampering(self):
        f = event_fixture(0); Oracle(f).run(); t = run(f)
        again = [t['after'],f[1],f[2],f[3]]
        r = run(again)
        self.assertTrue(r['replayed']); self.assertEqual(r['reason'],'replay')
        self.assertEqual(r['after'],t['after'])
        changed = copy.deepcopy(again); changed[1]['args']['argument'] += 1
        self.assertEqual(run(changed)['reason'],'replay-payload-conflict')
        f = fixture(); f[1]['expectedRevision'] = 1
        self.atomic_defer(f,'revision-conflict')
        for key in ('after','steps','events','observedEffects','queries','rng'):
            changed = copy.deepcopy(t)
            if key == 'queries': changed[key] = [dict(forged=True)]
            else: changed[key] = {} if isinstance(changed[key],dict) else []
            changed['traceHash'] = digest({k:v for k,v in changed.items() if k != 'traceHash'})
            with self.assertRaises(ValueError): m.replay_base_ownership(changed)
        f = fixture(); f[3]['engineGuard']['maxNativeCalls'] = 1
        self.atomic_defer(f,'engine-guard-native-call-budget')

    def test_19_seeded_width_owner_and_category_cases(self):
        rng = random.Random(0xAD550)
        for index in range(48):
            source = ('S1','S2')[index%2]
            f = fixture(source=source); w = f[0]['frame']
            bid = rng.choice((0,1,42,52,16383))
            f[1]['args'].update(buildingId=bid,requestedLegionId=rng.choice((-1,0,1)))
            b = row(w,bid,'buildings')
            b.update(valid=True,kind=rng.choice((0,1,2,3,24,63)),
                     rawOwnerForceId=rng.choice((-1,0,1)),durabilityWord=rng.randrange(65536),
                     subtypeMaxDurabilityWord=rng.randrange(65536))
            row(w,b['kind'],'facilityInfos')['category'] = rng.randrange(5)
            set_legion(row(w,1,'legions'),forceId=rng.choice((-1,0)))
            row(w,0,'forces')['techniqueBits'] = [rng.getrandbits(32),rng.getrandbits(32)]
            w['activePersonIds'] = []
            self.check_oracle(f,replay=False)


    def test_20_event10_argument_prep_and_context_validation_order(self):
        orders = {0:[0],2:[0,1],5:[0,1],9:[0],10:[0],12:[0],
                  15:[0,1],16:[0,1],17:[0],18:[0,1,2],19:[0,1],
                  20:[0,1,2,3],21:[0,1,2,3,4],22:[0,1],23:[0,1],
                  24:[0],38:[0],41:[1,0],42:[1,0],43:[1,0]}
        for mission,order in orders.items():
            f = event_fixture(mission,10)
            t = self.check_oracle(f,replay=False)
            self.assertEqual([s['index'] for s in t['steps'] if s['helper'] == '004897B0'],order)
            self.assertEqual(t['observedEffects'],[])
        f = event_fixture(21,10)
        t = self.check_oracle(f)
        valid = [s for s in t['steps'] if s['helper'] == '00572760/valid']
        self.assertEqual([(s['table'],s['pointerId']) for s in valid],
                         [('persons',7),('forces',0),('buildings',0),('buildings',1)])
        f = event_fixture(21,10); w = f[0]['frame']
        row(w)['missionArgs'] = [-1,999,0,998,0]
        t = self.check_oracle(f)
        valid = [s['table'] for s in t['steps'] if s['helper'] == '00572760/valid']
        self.assertEqual(valid,['persons','forces'])
        f = event_fixture(21,10); w = f[0]['frame']
        row(w).update(status=6,missionArgs=[46,999,0,998,0]); refresh_people(w)
        t = self.check_oracle(f)
        self.assertFalse(any(s['helper'] == '004897B0' for s in t['steps']))
        self.assertEqual([s['result'] for s in t['steps'] if s['helper'] == '005BC560/result'],[0,0,0,0])

    def test_21_base_stores_rollback_on_late_missing_stale_or_rejected_tail(self):
        f = fixture(); w = f[0]['frame']; w['activePersonIds'] = []
        add_force(w,1); set_legion(row(w,1,'legions'),forceId=1)
        row(w,0,'buildings').update(durabilityWord=5000,subtypeMaxDurabilityWord=1000)
        Oracle(f).run()
        self.assertEqual(len(f[2]['records']),1)
        before_tail = f[2]['records'][0]['before']
        self.assertEqual(row(before_tail,0,'buildings')['legionId'],1)
        self.assertEqual(row(before_tail,0,'buildings')['durabilityWord'],1000)
        self.assertEqual(row(before_tail,0,'cities')['rawFlagsA4'],0xFEDCBAEC)
        for field,value in (('legionId',0),('durabilityWord',5000)):
            case = copy.deepcopy(f)
            row(case[2]['records'][0]['before'],0,'buildings')[field] = value
            self.atomic_error(case)
        case = copy.deepcopy(f); case[2]['records'].clear(); self.atomic_error(case)
        case = copy.deepcopy(f); case[3]['unknownEffects'] = 'reject'
        self.atomic_defer(case,'unresolved-effect:004BA1D0')
        case = copy.deepcopy(f); case[3]['engineGuard']['maxEventDepth'] = 1
        self.check_oracle(case)

    def test_22_legacy_handler_gate_and_recursive_event8_from_event9(self):
        for source,mission in itertools.product(('S1','S2'),(23,24)):
            f = event_fixture(mission,source=source)
            row(f[0]['frame'])['status'] = 3
            row(f[0]['frame'],0,'buildings')['governorId'] = 9
            refresh_people(f[0]['frame'])
            t = self.check_oracle(f)
            self.assertEqual(t['events'][0]['visits'][0]['handlerReturn'],1)
            self.assertEqual(t['returnCalls'],1)
            self.assertTrue(any(e['event']['id'] == 8 for e in t['events'][1:]))
            self.assertTrue(all(e['parentEventIndex'] == 0 for e in t['events'][1:]))
            self.assertEqual(t['observedEffects'][-1]['helper'],'004BA1D0')
            f = event_fixture(mission,source=source)
            row(f[0]['frame'])['locationId'] = -1
            t = self.check_oracle(f)
            self.assertEqual(t['events'][0]['visits'][0]['dispatcherReturn'],1)
            self.assertEqual(t['events'][0]['visits'][0]['handlerReturn'],0)
        f = event_fixture(23); w = f[0]['frame']
        row(w)['missionArgs'][0] = 42; f[1]['args']['subjectId'] = 42
        t = self.check_oracle(f)
        self.assertEqual(t['events'][0]['visits'][0]['dispatcherReturn'],1)
        self.assertEqual(t['events'][0]['visits'][0]['handlerReturn'],0)

    def test_23_same_force_event10_callback_does_not_recheck_event_choice(self):
        f = fixture(); w = f[0]['frame']; w['activePersonIds'] = []
        w['observerPresent'] = True; add_force(w,1)
        def effect(stage,v,c):
            self.assertEqual(stage,'event-observer')
            self.assertEqual(c['event']['id'],10)
            set_legion(row(v,1,'legions'),forceId=1)
            row(v,0,'cities')['rawFlagsA4'] = 0xFFFFFFFF
            return 0
        t = self.check_oracle(f,effect=effect)
        self.assertEqual([e['event']['id'] for e in t['events']],[10])
        self.assertEqual(row(t['after']['frame'],0,'cities')['rawFlagsA4'],0xFFFFFFFF)
        self.assertFalse(any(s['helper'] == '00472520/store' for s in t['steps']))


def add_force(w, fid, valid=True):
    result = copy.deepcopy(row(w,0,'forces'))
    result.update(id=fid,valid=valid,rulerId=9 if valid else -1)
    w['forces'].append(result)
    return result


def event_fixture(mission=0, event=9, source='S1'):
    f = fixture('event',source,event=event)
    f[1]['args'].update(id=event,subjectType='building',subjectId=0,argument=417)
    row(f[0]['frame']).update(status=5,missionId=mission,homeBaseId=0,locationId=0,
                             missionArgs=[0,0,3,1,5])
    refresh_people(f[0]['frame'])
    return f


if __name__ == '__main__': unittest.main()
