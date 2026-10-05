"""Independent source interpreter and adversarial officer-relocation tests.

Expected frames and observation records are built only by the test-only oracle.
It extends the independently transcribed ownership interpreter; production
planners, primitives and projectors are never used to manufacture expectations.
Synthetic callback answers are explicit fixtures, not native gameplay evidence.
"""
import copy
import itertools
import json
import random
import unittest
from unittest.mock import patch

import officer_relocation_profile as m
import base_ownership_events_profile as previous
from check_base_ownership_profile import Oracle as OwnershipOracle, fixture as ownership_fixture
from check_base_ownership_profile import building, add_force
from check_empty_legion_profile import DISTANCE, legion, set_legion
from check_return_route_target_force_profile import map_cell
from check_recursive_officer_return_profile import row, refresh_people, digest
from check_native_roster_sort_profile import person

FRAME = 'source-idb-S1-S2-base-ownership-frame-v1'
DOMAIN = 'canonical-officer-relocation-v1'
# Test-only independent transcription of initialized registry virtual+0C slots.
CANCEL_HANDLER = (
    '005BBE30','00441880','005C6AA0','00441880','00441880','005D7FC0',
    '00441880','00441880','00441880','005CB050','005D5DD0','00441880',
    '005C4E70','00441880','00441880','005BA560','005BA5F0','005BA680',
    '005BA710','005BA7A0','005BA830','005BA8C0','005BEDA0','005B6D00',
    '005CFB70','00441880','00441880','00441880','00441880','00441880',
    '00441880','00441880','00441880','00441880','00441880','00441880',
    '00441880',None,'005D69D0','00441880','00441880','005D9C60',
    '005D9C60','005D9C60')
# Independent signed-dword transcription of 0079C358..0079C558, both sources.
TERRITORY_BASE = tuple(range(87)) + (
    -1,-8,-21,-24,-39,-41,5,4,3,0,1,2,0,0,1,2,1,3,3,4,5,5,5,6,7,7,
    13,14,15,1,10,11,12,10,13,31,31,31,31,31,31)


def fixture(entry='relocate-officer', source='S1', **kw):
    new = entry in ('relocate-officer','prepare-movement','cancel-mission')
    f = ownership_fixture('target-force' if new else entry, source, **kw)
    f[1]['id'] = 'relocation-1'
    f[3].update(id='relocation-observe-v1', relocationDomain=DOMAIN)
    if new:
        f[1].update(entry=entry, args=dict(personId=7))
        if entry != 'cancel-mission': f[1]['args']['targetBuildingId'] = 1
        row(f[0]['frame']).update(missionId=-1, rawLegionId=-1)
        f[0]['frame']['activePersonIds'] = []
    return f


def run(f):
    return m.project_officer_relocation(*f)


class Oracle(OwnershipOracle):
    def __init__(self, *args, position=(0, 0), **kw):
        super().__init__(*args, **kw)
        self.position = position
        self.relocations, self.preparations, self.cancellations = [], [], []

    def boundary(self, stage, kind, helper, args, result=None):
        if helper == '004A8270':
            with self.inside('004BD3B0/relocation-call', copiedIndex=args['copiedIndex'],
                             savedDestinationHomeId=args['targetBuildingId']):
                return self.relocate(args['personId'], args['targetBuildingId'])
        return super().boundary(stage, kind, helper, args, result)

    def cancel(self, pid):
        with self.acting(pid), self.inside('004A57B0', personId=pid):
            p = self.get('persons', pid)
            if not p['allocated']: return 0
            if not 0 <= p['missionId'] <= 43: return p['missionId']
            mission = self.get('persons', pid)['missionId']
            with self.inside('005B9B40', personId=pid, capturedMissionId=mission,
                             cancelEventWords=[-1, 0, 0]):
                if mission == 37: return 0
                helper = CANCEL_HANDLER[mission]
                if helper == '00441880': return 0
                if mission in (23, 24):
                    result = self.handler(mission)
                else:
                    with self.inside(helper, personId=pid, capturedMissionId=mission):
                        result = self.boundary('cancellation-handler', 'effect-query', helper,
                            dict(personId=pid, capturedMissionId=mission,
                                 cancelEventWords=[-1, 0, 0]), 1)
                self.cancellations.append((pid, mission, result))
                return result

    def origin(self, pid):
        with self.inside('004A6340', personId=pid):
            if not self.valid('persons', pid): return -1
            location = self.get('persons', pid)['locationId']
            if 0 <= location <= 86: return location
            with self.inside('0047A950', personId=pid):
                position = self.position(self) if callable(self.position) else self.position
                point = self.boundary('position', 'query', '00489610/virtual+3C',
                                     dict(personId=pid, rawLocationId=location),
                                     dict(positionX=position[0], positionY=position[1]))
                x, y = point['positionX'], point['positionY']
                if not (0 <= x < 200 and 0 <= y < 200): return -1
                code = (self.get('mapCells', 200*x+y)['rawTerritoryDword'] >> 5) & 127
                origin = abs(TERRITORY_BASE[code])
                return origin if 0 <= origin <= 86 else -1

    def movement(self, pid, bid):
        self.preparations.append((pid, bid))
        with self.acting(pid), self.inside('004A7990', personId=pid,
                targetBuildingId=bid, thirdArgument=-1, fourthArgument=0):
            if not self.valid('persons', pid) or not self.valid('buildings', bid): return -1
            origin = self.origin(pid)
            distance = 1
            if 0 <= origin <= 16383:
                a, b = self.territory(origin), self.territory(bid)
                distance = DISTANCE[self.source][a*42+b] if 0 <= a <= 41 and 0 <= b <= 41 else -1
            self.save(savedOriginId=origin, savedDistance=distance)
            self.acted(False)
            self.actor()['missionDuration'] = distance & 255
            force = self.force_id(pid)
            self.save(savedPersonForceId=force)
            if 0 <= force <= 46:
                location = self.actor()['locationId']
                current = location if 0 <= location <= 86 else -1
                saved_current = None
                if self.valid('buildings', current) and self.target_force(current, 'movement-current') == force:
                    saved_current = current
                    self.save(savedCurrentBuildingId=saved_current)
                    self.governor(current)
                else: self.save(savedCurrentBuildingId=None)
                home = self.actor()['homeBaseId']
                self.save(savedRefreshHomeId=home if 0 <= home <= 16383 else None)
                if self.valid('buildings', home) and home != saved_current:
                    self.governor(home)
            return origin if 0 <= origin <= 86 else -1

    def relocate(self, pid, bid):
        self.relocations.append((pid, bid))
        with self.acting(pid), self.inside('004A8270', personId=pid, targetBuildingId=bid):
            if not self.valid('persons', pid) or not self.valid('buildings', bid): return
            first_home = self.actor()['homeBaseId']
            old = first_home if 0 <= first_home <= 16383 else None
            second_home = self.actor()['homeBaseId']
            self.save(savedOldRawHomeId=first_home, savedOldHomeId=old,
                      comparedHomeId=second_home)
            if second_home != bid:
                if self.actor()['status'] == 2 and first_home != bid:
                    with self.inside('004A5AF0', personId=pid, requestedStatus=3):
                        if self.actor()['allocated']: self.set_status(pid, 3)
                    if old is not None and self.valid('buildings', old) and self.governor_id(old) == pid:
                        self.assign_governor(old, None)
                if self.actor()['status'] == 0:
                    raw_legion = self.actor()['rawLegionId']
                    requested = raw_legion if 0 <= raw_legion <= 46 else None
                    self.save(savedRequestedLegionId=requested)
                    self.boundary('ruler-transfer', 'effect-query', '004B40C0',
                        dict(buildingId=bid, requestedLegionId=requested, nativeArgument=0), 1)
                else: self.legion_setter(pid, self.base_legion(bid))
                self.home_setter(pid, bid)
            location = self.actor()['locationId']
            if 87 <= location <= 1086:
                if self.boundary('troop', 'query', '004891C0',
                                 dict(personId=pid, locationId=location), self.troop): return
            normalized = location if 0 <= location <= 86 else -1
            home = self.actor()['homeBaseId']
            self.save(savedPostTransferHomeId=home, savedNormalizedLocationId=normalized)
            if normalized != home:
                if self.actor()['valid']:
                    self.cancel(pid)
                    self.actor()['missionId'] = 37
                    self.actor()['missionArgs'] = [0] * 5
                    self.acted(False)
                    if self.actor()['valid'] and pid not in self.w['activePersonIds']:
                        self.w['activePersonIds'].append(pid)
                self.movement(pid, bid)
            else:
                if self.actor()['allocated']:
                    self.actor()['missionId'] = -1
                    self.actor()['missionArgs'] = [0] * 5
                if self.actor()['valid']: self.actor()['missionDuration'] = 0
                self.acted(True)
                if self.actor()['status'] != 5:
                    self.return_native(pid, home if 0 <= home <= 16383 else -1, 0, 1)

    def run(self):
        entry, a = self.f[1]['entry'], self.f[1]['args']
        if entry == 'relocate-officer': self.relocate(a['personId'], a['targetBuildingId'])
        elif entry == 'prepare-movement': self.native_result = self.movement(a['personId'], a['targetBuildingId'])
        elif entry == 'cancel-mission': self.native_result = self.cancel(a['personId'])
        else: return super().run()
        self.f[2]['records'] = copy.deepcopy(self.records)
        return self


class RelocationTests(unittest.TestCase):
    maxDiff = 6000

    def check_oracle(self, f, replay=True, **kw):
        expected = Oracle(f, **kw).run()
        original = copy.deepcopy(f)
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
        self.assertEqual(f, original)
        if replay: self.assertEqual(t, m.replay_officer_relocation(json.loads(json.dumps(t))))
        return t

    def atomic_error(self, f):
        original = copy.deepcopy(f)
        with self.assertRaises(ValueError): run(f)
        self.assertEqual(f, original)

    def atomic_defer(self, f, reason=None):
        original = copy.deepcopy(f)
        t = run(f)
        self.assertFalse(t['accepted'])
        if reason is not None: self.assertEqual(t['reason'], reason)
        self.assertEqual(t['after'], f[0])
        self.assertEqual(t['steps'], [])
        self.assertEqual(t['events'], [])
        self.assertEqual(f, original)
        self.assertEqual(t, m.replay_officer_relocation(t))
        return t

    def test_01_all_entries_both_sources(self):
        entries = ('relocate-officer','prepare-movement','cancel-mission','base-ownership',
                   'event','return','legion','governor','capacity','role-sort','roster-sort',
                   'route','at-home','target-force','force-legion','merge-legion')
        for source, entry in itertools.product(('S1','S2'), entries):
            with self.subTest(source=source, entry=entry):
                t = self.check_oracle(fixture(entry, source))
                self.assertEqual(t['profileId'], 'source-idb-S1-S2-officer-relocation-v1')
                for name in ('callbacksAssumedNoninterfering','stockVerified','vanillaVerified',
                             'machineCodeExecuted','engineGuardIsOriginalRule'):
                    self.assertFalse(t['evidence'][name])
                self.assertFalse(t['rng']['globalConsumptionVerified'])

    def test_02_invalid_entries_exit_without_reading_later_slots(self):
        for source, entry, which in itertools.product(('S1','S2'),
                ('relocate-officer','prepare-movement'), ('person','target')):
            f = fixture(entry, source); w = f[0]['frame']
            if which == 'person':
                row(w).update(status=6); refresh_people(w)
                f[1]['args']['targetBuildingId'] = 1000  # absent, never reached
            else: row(w,1,'buildings').update(valid=False, kind=-1)
            t = self.check_oracle(f)
            self.assertEqual(t['after']['frame'], w)
            self.assertEqual(t['observedEffects'], [])
            self.assertEqual(t['nativeResult'], -1 if entry == 'prepare-movement' else None)

    def test_03_same_raw_home_skips_legion_governor_and_home_writes(self):
        for source in ('S1','S2'):
            f = fixture(source=source); w = f[0]['frame']
            f[1]['args']['targetBuildingId'] = 0
            row(w).update(status=5, missionId=15, missionArgs=[9,8,7,6,5])
            row(w,0,'buildings').update(governorId=7, homeRosterIds=[7,7])
            t = self.check_oracle(f)
            p = row(t['after']['frame'])
            self.assertEqual((p['missionId'],p['missionArgs'],p['missionDuration']),(-1,[0]*5,0))
            self.assertEqual(row(t['after']['frame'],0,'buildings')['homeRosterIds'],[7,7])
            self.assertEqual(row(t['after']['frame'],0,'buildings')['governorId'],7)
            self.assertEqual(t['returnCalls'],0)
            self.assertFalse(any(r['helper'] in CANCEL_HANDLER for r in t['observedEffects']))

    def test_04_non_governor_status_does_not_clear_old_governor(self):
        for source, status in itertools.product(('S1','S2'), (0,1,3,4,5,7)):
            f = fixture(source=source); w = f[0]['frame']
            row(w).update(status=status, locationId=87)
            row(w,0,'buildings')['governorId'] = 7
            t = self.check_oracle(f, troop=True)
            self.assertEqual(row(t['after']['frame'],0,'buildings')['governorId'],7)
            self.assertFalse(any(e['event']['id']==8 for e in t['events']))

    def test_05_status2_clear_event_mutates_live_ruler_and_saved_destination(self):
        for source in ('S1','S2'):
            f = fixture(source=source); w = f[0]['frame']
            row(w).update(status=2, rawLegionId=0, locationId=87)
            row(w,0,'buildings')['governorId'] = 7
            w['observerPresent'] = True
            def effect(stage,v,c):
                if stage == 'event-observer' and c['event']['id'] == 8:
                    self.assertEqual(row(v)['status'],3)
                    self.assertEqual(row(v,0,'buildings')['governorId'],7)
                    row(v).update(status=0,homeBaseId=42,rawLegionId=-1)
                    row(v,1,'buildings').update(valid=False,kind=-1)
                if stage == 'ruler-transfer':
                    row(v).update(homeBaseId=0, rawLegionId=0)
                    return dict(count=2, result=-2147483648)
                return 0
            t = self.check_oracle(f, effect=effect, troop=True)
            self.assertEqual(row(t['after']['frame'])['homeBaseId'],1)
            self.assertEqual(row(t['after']['frame'],0,'buildings')['governorId'],-1)
            ruler = next(r for r in t['observedEffects'] if r['helper']=='004B40C0')
            self.assertEqual(ruler['args']['requestedLegionId'],None)
            self.assertFalse(row(ruler['before'],1,'buildings')['valid'])
            self.assertEqual(ruler['result'],-2147483648)

    def test_06_ruler_uses_person_legion_including_null_and_invalid(self):
        for source, lid in itertools.product(('S1','S2'), (-1,0,1,47)):
            f = fixture(source=source); w = f[0]['frame']
            w['legions'].append(legion(1,forceId=-1))
            row(w).update(status=0,rawLegionId=lid,locationId=87)
            def effect(stage,v,c):
                if stage=='ruler-transfer':
                    row(v).update(homeBaseId=42)
                    row(v,1,'buildings')['legionId'] = 1
                    return dict(count=None,result=1234)
                return 0
            t = self.check_oracle(f,effect=effect,troop=True)
            r = next(r for r in t['observedEffects'] if r['helper']=='004B40C0')
            self.assertEqual(r['args']['requestedLegionId'],lid if 0<=lid<=46 else None)
            self.assertEqual(row(t['after']['frame'])['homeBaseId'],1)
            self.assertIsNone(t['nativeResult'])

    def test_07_nonruler_same_legion_remove_first_append_sort(self):
        for source in ('S1','S2'):
            f = fixture(source=source); w = f[0]['frame']
            row(w).update(rawLegionId=0,locationId=87)
            row(w,0,'legions')['rosterIds'] = [7,7]
            row(w,0,'buildings')['homeRosterIds'] = [7,7]
            row(w,1,'buildings')['homeRosterIds'] = [9]
            t = self.check_oracle(f,troop=True)
            out = t['after']['frame']
            self.assertEqual(row(out,0,'legions')['rosterIds'].count(7),2)
            self.assertEqual(row(out,0,'buildings')['homeRosterIds'],[7])
            self.assertEqual(set(row(out,1,'buildings')['homeRosterIds']),{7,9})
            self.assertTrue(row(out)['flags124'] & (1<<9))

    def test_08_true_troop_member_exits_nonmember_continues(self):
        for source, member in itertools.product(('S1','S2'), (False,True)):
            f = fixture(source=source); w = f[0]['frame']
            row(w).update(homeBaseId=1,locationId=87)
            t = self.check_oracle(f,troop=member)
            q = [q for q in t['queries'] if q['helper']=='004891C0']
            self.assertEqual(len(q),1)
            self.assertEqual(row(t['after']['frame'])['missionId'],-1 if member else 37)
            self.assertEqual(row(t['after']['frame'])['locationId'],87)
            self.assertEqual(bool([q for q in t['queries'] if q['helper']=='00489610/virtual+3C']),not member)

    def test_09_cancel_callback_invalidation_still_raw_set37_and_first_acted(self):
        for source in ('S1','S2'):
            f = fixture(source=source); w = f[0]['frame']
            row(w).update(homeBaseId=1,missionId=15)
            w['observerPresent'] = True
            def effect(stage,v,c):
                if stage=='cancellation-handler':
                    row(v).update(status=99,rawDword17C=0,missionId=24,missionArgs=[1]*5)
                    return dict(count=3,result=-777)
                if stage=='acted-observer':
                    self.assertEqual(row(v)['missionId'],37)
                    self.assertEqual(row(v)['missionArgs'],[0]*5)
                    row(v)['missionId'] = 12
                return 0
            t = self.check_oracle(f,effect=effect)
            self.assertEqual(row(t['after']['frame'])['missionId'],12)
            self.assertEqual(row(t['after']['frame'])['missionDuration'],99)
            self.assertEqual(t['after']['frame']['activePersonIds'],[])
            self.assertEqual(sum(r['helper']=='observer.virtual1B4' for r in t['observedEffects']),1)

    def test_10_first_acted_live_active_list_and_second_acted_raw_duration(self):
        for source in ('S1','S2'):
            f = fixture(source=source); w = f[0]['frame']
            row(w).update(homeBaseId=1,missionId=-1)
            row(w,1,'buildings')['positionY'] = 1
            map_cell(w,0,1,5<<5)
            w['observerPresent'] = True
            def effect(stage,v,c):
                if stage=='acted-observer':
                    moving = any(s['helper']=='004A7990' for s in c['callStack'])
                    if not moving:
                        row(v).update(missionId=15,status=5,flags124=0)
                        v['activePersonIds'] = [7,7]
                    else:
                        row(v).update(status=6,locationId=42,homeBaseId=0,rawLegionId=-1)
                        row(v,1,'buildings')['positionY'] = -1
                return 0
            t = self.check_oracle(f,effect=effect)
            p = row(t['after']['frame'])
            self.assertEqual(p['missionId'],15)
            self.assertEqual(p['missionDuration'],DISTANCE[source][5])
            self.assertEqual(p['locationId'],42)
            self.assertEqual(t['after']['frame']['activePersonIds'],[7,7])
            self.assertEqual(len(t['observedEffects']),2)
            self.assertTrue(all(r['helper']=='observer.virtual1B4' for r in t['observedEffects']))
            self.assertFalse(any(r['helper']=='004890F0' for r in t['observedEffects']))

    def test_11_same_home_saved_home_survives_acted_query_and_status5_gate(self):
        for source, stop in itertools.product(('S1','S2'), (False,True)):
            f = fixture(source=source); w = f[0]['frame']
            f[1]['args']['targetBuildingId'] = 0
            row(w).update(missionId=15)
            w['observerPresent'] = True
            def effect(stage,v,c):
                if stage in ('query267','acted-observer') and not any(s['helper']=='004BF6F0' for s in c['callStack']):
                    row(v).update(homeBaseId=1,status=5 if stop else 3,rawLegionId=-1)
                    v['observerPresent'] = False
                return 0
            t = self.check_oracle(f,effect=effect)
            self.assertEqual(t['returnCalls'],0 if stop else 1)
            self.assertEqual(row(t['after']['frame'])['homeBaseId'],1 if stop else 0)
            self.assertFalse(any(r['helper'] in CANCEL_HANDLER for r in t['observedEffects']))

    def test_12_preparation_origin_default_invalid_territory_and_low_byte(self):
        for source, variant in itertools.product(('S1','S2'), ('invalid-origin','invalid-territory','invalid-base')):
            f = fixture('prepare-movement',source); w = f[0]['frame']
            position = (-1,0)
            if variant=='invalid-origin': row(w)['locationId'] = 1087
            elif variant=='invalid-territory': row(w,0,'buildings')['positionY'] = -1
            else: row(w,0,'buildings').update(valid=False,kind=-1)
            t = self.check_oracle(f,position=position)
            self.assertEqual(row(t['after']['frame'])['missionDuration'],1 if variant=='invalid-origin' else 255)
            self.assertEqual(t['nativeResult'],-1 if variant=='invalid-origin' else 0)
            self.assertEqual(row(t['after']['frame'])['locationId'],row(w)['locationId'])

    def test_13_nonbase_coordinates_signed_table_mask_and_bounds(self):
        for source, code in itertools.product(('S1','S2'), (0,42,86,87,88,89,90,91,92,93,127)):
            f = fixture('prepare-movement',source); w = f[0]['frame']
            row(w)['locationId'] = 87
            map_cell(w,3,4,0xFFF0001F | (code<<5))
            origin = abs(TERRITORY_BASE[code])
            t = self.check_oracle(f,position=(3,4))
            self.assertEqual(t['nativeResult'],origin)
            self.assertEqual(row(t['after']['frame'])['locationId'],87)
            self.assertEqual(len([q for q in t['queries'] if q['helper']=='00489610/virtual+3C']),1)
        for pos in ((-32768,0),(-1,0),(0,-1),(200,0),(0,200),(32767,32767)):
            f = fixture('prepare-movement'); row(f[0]['frame'])['locationId'] = -1
            t = self.check_oracle(f,position=pos)
            self.assertEqual(t['nativeResult'],-1)
            self.assertEqual(row(t['after']['frame'])['missionDuration'],1)

    def test_14_directed_source_specific_distance_saved_across_observer(self):
        for source, a, b in itertools.product(('S1','S2'), (0,1,42,50), (0,2,49)):
            f = fixture('prepare-movement',source); w = f[0]['frame']
            row(w,0,'buildings').update(positionX=1,positionY=1)
            row(w,1,'buildings').update(positionX=1,positionY=2)
            map_cell(w,1,1,a<<5); map_cell(w,1,2,b<<5)
            w['observerPresent'] = True
            def effect(stage,v,c):
                if stage=='acted-observer':
                    row(v).update(locationId=42,status=6)
                    map_cell(v,1,1,127<<5); map_cell(v,1,2,127<<5)
                return 0
            t = self.check_oracle(f,effect=effect,replay=False)
            self.assertEqual(t['nativeResult'],0)
            self.assertEqual(row(t['after']['frame'])['locationId'],42)
            self.assertEqual(row(t['after']['frame'])['missionDuration'],
                             DISTANCE[source][Oracle(f).territory(0)*42+Oracle(f).territory(1)])

    def test_15_cancel_registry_all_missions_no_event_predicates(self):
        for source, mission in itertools.product(('S1','S2'), range(-2,46)):
            f = fixture('cancel-mission',source); w = f[0]['frame']
            row(w).update(missionId=mission, missionArgs=[42,9,3,4,5])
            t = self.check_oracle(f,replay=False)
            broad = 0 <= mission <= 43 and CANCEL_HANDLER[mission] not in (None,'00441880','005B6D00','005CFB70')
            opaque=[r for r in t['observedEffects'] if r['helper'] in CANCEL_HANDLER]
            self.assertEqual(len(opaque),int(broad))
            if broad:
                r = t['observedEffects'][0]
                self.assertEqual(r['args']['capturedMissionId'],mission)
                self.assertEqual(r['args']['cancelEventWords'],[-1,0,0])
                self.assertEqual(r['kind'],'effect-query')
            elif mission not in (23,24):
                self.assertEqual(t['after']['frame'],w)
            self.assertFalse(any(s['helper']=='005B9D30' for s in t['steps']))

    def test_16_unallocated_cancel_exit_but_invalid_allocated_dispatches(self):
        for status, dispatch in ((99,False),(6,True),(8,True)):
            f = fixture('cancel-mission'); w = f[0]['frame']
            row(w).update(status=status,rawDword17C=0,missionId=15); refresh_people(w)
            t = self.check_oracle(f)
            self.assertEqual(len(t['observedEffects']),int(dispatch))

    def test_17_missing_stale_wrong_source_stack_and_unused_observations(self):
        f = fixture('prepare-movement'); w = f[0]['frame']
        row(w)['locationId'] = 87; w['observerPresent'] = True
        Oracle(f).run()
        for defect in ('missing','unused','stale','source','stack','args','kind','alias','rng'):
            g = copy.deepcopy(f); records = g[2]['records']
            if defect=='missing': records.pop()
            elif defect=='unused':
                records.append(copy.deepcopy(records[-1])); records[-1]['index'] = len(records)-1
            elif defect=='stale': records[0]['before']['managerDirty'] += 1
            elif defect=='source': records[0]['source'] = 'S2'
            elif defect=='stack': records[0]['callStack'][0]['locals']['targetBuildingId'] = 0
            elif defect=='args': records[0]['args']['rawLocationId'] = 88
            elif defect=='kind':
                records[0]['kind']='effect-query'; records[0]['after']=copy.deepcopy(records[0]['before'])
                records[0]['rngConsumption']=dict(kind='observed-count',calls=0)
            elif defect=='alias': row(records[-1]['after'])['valid'] = False
            else: records[-1]['rngConsumption']['calls'] = -1
            with self.subTest(defect=defect): self.atomic_error(g)

    def test_18_coordinate_result_domains_and_read_only_no_rng(self):
        for result in ((0,0),[0],[0,0,0],[True,0],{'positionX':32768,'positionY':0},{'positionX':-32769,'positionY':0},{'x':0,'y':0},None):
            f = fixture('prepare-movement'); row(f[0]['frame'])['locationId'] = 87
            Oracle(f).run(); f[2]['records'][0]['result'] = result
            self.atomic_error(f)
        f = fixture('prepare-movement'); row(f[0]['frame'])['locationId'] = 87
        t = self.check_oracle(f)
        self.assertEqual(t['rng']['localCalls'],0)
        self.assertEqual(t['rng']['finalState'],f[0]['frame']['rngState'])

    def test_19_reject_policy_and_engine_guard_roll_back_partial_work(self):
        for entry in ('relocate-officer','prepare-movement','cancel-mission'):
            f = fixture(entry); w = f[0]['frame']
            if entry=='cancel-mission': row(w)['missionId']=15
            else: w['observerPresent']=True
            f[3]['unknownEffects']='reject'
            self.atomic_defer(f)
        f = fixture(); f[3]['engineGuard']['maxNativeCalls']=1
        self.atomic_defer(f)
        f = fixture(); Oracle(f).run(); f[3]['engineGuard']['maxNativeCalls']=20
        self.atomic_defer(f)

    def test_20_schema_policy_previous_api_and_no_implicit_upgrade(self):
        for field, value in (('relocationDomain','wrong'),('frameProfile','wrong'),('registryDomain','wrong')):
            f = fixture(); f[3][field] = value; self.atomic_error(f)
        f = fixture(); del f[3]['relocationDomain']; self.atomic_error(f)
        for arg, value in (('personId',True),('targetBuildingId',True)):
            f = fixture(); f[1]['args'][arg]=value; self.atomic_error(f)
        f = fixture(); f[1]['args']['fourthArg']=1; self.atomic_error(f)
        old = ownership_fixture('target-force'); oldcopy=copy.deepcopy(old)
        previous.project_base_ownership(*old)
        self.assertEqual(old,oldcopy)
        with self.assertRaises(ValueError): m.project_officer_relocation(*old)
        with self.assertRaises(ValueError): previous.project_base_ownership(*fixture())

    def test_21_replay_tamper_revision_and_command_conflicts(self):
        f = fixture('prepare-movement'); t = self.check_oracle(f)
        g = copy.deepcopy(t); row(g['after']['frame'])['missionDuration'] ^= 1
        if 'sha256' in g: g['sha256'] = digest({k:v for k,v in g.items() if k!='sha256'})
        with self.assertRaises(ValueError): m.replay_officer_relocation(g)
        f = fixture(); f[1]['expectedRevision']=1; self.atomic_defer(f)
        f = fixture(); f[0]['revision']=2147483647; f[1]['expectedRevision']=2147483647
        self.atomic_error(f)

    def test_22_no_older_projector_transactions_are_called(self):
        from contextlib import ExitStack
        import importlib
        modules = ('base_ownership_events_profile','empty_legion_redistribution_profile',
                   'return_route_target_force_profile','native_roster_sort_profile',
                   'recursive_officer_return_profile','mission_event_composition_profile',
                   'mission_event_listener_profile','mission_notification_tail_profile',
                   'officer_return_finalizer_profile','legion_role_reconciliation_profile',
                   'return_mission_lifecycle_profile','mission_cancellation_profile',
                   'mission_cancellation_v2_profile','group_mission_cancellation_profile',
                   'special_mission_cancellation_profile','facility_mission_cancellation_profile')
        for entry, mission in (('relocate-officer',15),('cancel-mission',23)):
            f=fixture(entry); row(f[0]['frame'])['missionId']=mission; Oracle(f).run()
            with ExitStack() as stack:
                for name in modules:
                    module=importlib.import_module(name)
                    for attr in dir(module):
                        if attr.startswith('project_'):
                            stack.enter_context(patch.object(module,attr,side_effect=AssertionError('old transaction called')))
                t=run(f)
            self.assertTrue(t['accepted'])
            self.assertEqual(t['after']['revision'],1)
            self.assertEqual(len(t['after']['appliedCommands']),1)

    def test_23_seeded_independent_relocation_matrix(self):
        rng = random.Random(82707990)
        for i in range(120):
            source = ('S1','S2')[i%2]
            entry = ('relocate-officer','prepare-movement')[i%2]
            f = fixture(entry,source); w=f[0]['frame']
            row(w).update(homeBaseId=rng.choice((0,1,42,-1)),
                          locationId=rng.choice((0,1,42,86,87,1086,1087,-1)),
                          status=rng.choice((3,4,5,6)),
                          missionId=rng.choice((-1,1,15,37,43,44)))
            refresh_people(w)
            oracle = Oracle(f,position=(-1,0),troop=bool(i%3==0))
            try: oracle.run()
            except RuntimeError as error:
                f[2]['records'] = copy.deepcopy(oracle.records)
                self.atomic_defer(f,str(error))
                continue
            t = self.check_oracle(f,position=(-1,0),troop=bool(i%3==0),replay=i%11==0)
            # Return-finalizer is allowed to write location on the same-home path;
            # the movement helper itself never owns an actual-location store.
            movement_writes = [s for s in t['steps'] if s.get('field')=='locationId' and
                               any(c['helper']=='004A7990' for c in s.get('callStack',[]))]
            self.assertEqual(movement_writes,[])

    def test_24_current_governor_callback_live_home_force_and_saved_pointer(self):
        for source, changed_home in itertools.product(('S1','S2'), (0,42)):
            f = fixture('prepare-movement',source); w=f[0]['frame']
            row(w).update(rawLegionId=0,homeBaseId=1,missionId=-1)
            row(w,0,'buildings')['governorId']=9
            w['observerPresent']=True
            def effect(stage,v,c):
                if stage=='event-observer' and c['event']['id']==8:
                    row(v).update(homeBaseId=changed_home,locationId=1,rawLegionId=-1)
                    row(v,0,'buildings').update(valid=False,kind=-1)
                return 0
            t=self.check_oracle(f,effect=effect)
            scopes=[s['callStack'] for s in t['steps'] if s['helper']=='004BCA30/entry']
            refreshed=[next(c['locals']['buildingId'] for c in stack if c['helper']=='004BCA30') for stack in scopes]
            # A changed allegiance does not suppress the second home refresh;
            # current pointer0 is retained even after its event invalidates it.
            self.assertEqual(refreshed,[0] if changed_home==0 else [0,42])
            self.assertEqual(row(t['after']['frame'])['locationId'],1)
            if changed_home==42:
                last=t['observedEffects'][-1]['callStack'][0]['locals']
                self.assertEqual(last['savedPersonForceId'],0)
                self.assertEqual(last['savedCurrentBuildingId'],0)
                self.assertEqual(last['savedRefreshHomeId'],42)

    def test_25_home_refresh_has_no_same_force_or_force_object_validity_gate(self):
        for source in ('S1','S2'):
            f=fixture('prepare-movement',source); w=f[0]['frame']
            row(w).update(rawLegionId=0,homeBaseId=42)
            row(w,0,'forces')['valid']=False
            row(w,0,'forces')['rulerId']=-1
            row(w,0,'buildings')['legionId']=-1
            row(w,42,'buildings')['legionId']=-1
            t=self.check_oracle(f)
            refreshed=[s['callStack'][-1]['locals']['buildingId'] for s in t['steps'] if s['helper']=='004BCA30/entry']
            self.assertEqual(refreshed,[42])
            self.assertEqual([e['event']['subjectId'] for e in t['events']],[42])

    def test_26_nested_merge_retains_copied_nodes_and_saved_destination(self):
        for source in ('S1','S2'):
            f=fixture('merge-legion',source); w=f[0]['frame']
            row(w).update(status=0,missionId=-1,locationId=87)
            row(w,0,'legions')['rosterIds']=[7,7,403]
            set_legion(row(w,1,'legions'),leaderId=9)
            row(w,9)['rawLegionId']=1
            row(w,1,'buildings')['legionId']=1
            w.update(activePersonIds=[],observerPresent=True)
            def effect(stage,v,c):
                if stage=='event-observer' and c['event']['id']==10 and c['event']['subjectId']==0:
                    row(v,0,'buildings')['legionId']=0
                    row(v,403).update(status=3,rawLegionId=1,homeBaseId=0,locationId=87)
                if stage=='ruler-transfer':
                    row(v,0,'legions')['rosterIds']=[9]
                    row(v,9)['homeBaseId']=0
                    row(v,1,'buildings').update(valid=False,kind=-1)
                return 0
            t=self.check_oracle(f,effect=effect,troop=True)
            copies=[s['candidateIds'] for s in t['steps'] if s['helper'] in ('0049F820/merge-copy','0049F820/batch-copy')]
            self.assertEqual(copies,[[7,7,403],[7,7,403]])
            calls=[s for s in t['steps'] if s['helper']=='004A8270/target-valid']
            self.assertEqual([c['passed'] for c in calls],[True,False])
            wrappers=[next(x['locals'] for x in c['callStack'] if x['helper']=='004BD3B0/relocation-call') for c in calls]
            self.assertEqual(wrappers,[dict(copiedIndex=0,savedDestinationHomeId=1),dict(copiedIndex=2,savedDestinationHomeId=1)])
            self.assertEqual(row(t['after']['frame'],403)['homeBaseId'],0)
            self.assertEqual(t['after']['revision'],1)
            self.assertFalse(any(r['helper']=='004A8270' for r in t['observedEffects']))

    def test_27_away_fresh_valid_gate_after_ruler_callback(self):
        for source in ('S1','S2'):
            f=fixture(source=source); w=f[0]['frame']
            row(w).update(status=0,missionId=15,locationId=0)
            w['observerPresent']=True
            def effect(stage,v,c):
                if stage=='ruler-transfer': row(v).update(status=6)
                elif stage in ('cancellation-handler','acted-observer'): raise AssertionError(stage)
                return 0
            t=self.check_oracle(f,effect=effect)
            self.assertEqual(row(t['after']['frame'])['missionId'],15)
            self.assertEqual(row(t['after']['frame'])['missionDuration'],99)
            self.assertEqual([r['helper'] for r in t['observedEffects']],['004B40C0'])
            ignored=[s for s in t['steps'] if s['helper']=='004A83EA/return-ignored']
            self.assertEqual(ignored[0]['returnValue'],-1)

    def test_28_late_missing_slot_after_effect_rejects_atomically(self):
        f=fixture('prepare-movement'); w=f[0]['frame']; w['observerPresent']=True
        def effect(stage,v,c):
            if stage=='acted-observer': row(v)['rawLegionId']=46
            return 0
        oracle=Oracle(f,effect=effect)
        with self.assertRaises(ValueError): oracle.run()
        f[2]['records']=oracle.records
        self.atomic_error(f)
        f=fixture(); row(f[0]['frame'])['status']=0
        row(f[0]['frame'])['rawLegionId']=46
        self.atomic_error(f)

    def test_29_mutable_boundary_signed_results_and_full_alias_integrity(self):
        for entry, status, mission in (('relocate-officer',0,-1),('cancel-mission',3,15)):
            f=fixture(entry); row(f[0]['frame']).update(status=status,missionId=mission,locationId=87)
            Oracle(f,troop=True).run()
            for result in (True,None,2147483648,-2147483649,'1'):
                g=copy.deepcopy(f); g[2]['records'][0]['result']=result
                self.atomic_error(g)
            for bad_alias in ('legion','person'):
                g=copy.deepcopy(f); after=g[2]['records'][0]['after']
                if bad_alias=='legion': row(after,0,'legions')['forceId']=1
                else: row(after)['rawDword17C']=1; row(after)['valid']=False
                self.atomic_error(g)

    def test_30_native_cancel23_24_away_and_saved_handler_context(self):
        for source, mission, notified in itertools.product(('S1','S2'), (23,24), (False,True)):
            f=fixture('cancel-mission',source); w=f[0]['frame']
            row(w).update(missionId=mission,homeBaseId=1,missionArgs=[0,9,3,4,5],rawLegionId=0 if notified else -1)
            row(w,0,'forces')['playerIndex']=0 if notified else -1
            w['observerPresent']=True
            t=self.check_oracle(f,distance=-1)
            self.assertEqual(t['nativeResult'],1)
            self.assertEqual(row(t['after']['frame'])['missionId'],37)
            self.assertEqual(row(t['after']['frame'])['missionDuration'],255)
            self.assertFalse(any(r['helper']==CANCEL_HANDLER[mission] for r in t['observedEffects']))
            for r in t['queries']+t['observedEffects']:
                stack=r['callStack']
                self.assertEqual(stack[0]['helper'],'004A57B0')
                self.assertEqual(stack[1]['locals']['cancelEventWords'],[-1,0,0])
                self.assertEqual(stack[1]['locals']['capturedMissionId'],mission)


    def test_31_native_cancel23_24_same_home_notification_and_recursive_return(self):
        for source, mission, notified in itertools.product(('S1','S2'), (23,24), (False,True)):
            f=fixture('cancel-mission',source); w=f[0]['frame']
            row(w).update(missionId=mission,homeBaseId=0,missionArgs=[0,9,3,4,5],
                          rawLegionId=0 if notified else -1)
            row(w,0,'forces')['playerIndex']=0 if notified else -1
            t=self.check_oracle(f)
            self.assertEqual(t['nativeResult'],1)
            self.assertEqual(t['returnCalls'],1)
            self.assertEqual(row(t['after']['frame'])['missionId'],-1)
            self.assertEqual(row(t['after']['frame'])['missionDuration'],0)
            presentation={23:'005B6DC4..005B6E35',24:'005CFC28..005CFC99'}[mission]
            self.assertEqual(any(r['helper']==presentation for r in t['observedEffects']),notified)

    def test_32_second_entry_rechecks_target_after_first_direct_observer(self):
        for source in ('S1','S2'):
            f=fixture(source=source); w=f[0]['frame']
            row(w)['homeBaseId']=1; w['observerPresent']=True
            def effect(stage,v,c):
                if stage=='acted-observer': row(v,1,'buildings').update(valid=False,kind=-1)
                return 0
            t=self.check_oracle(f,effect=effect)
            self.assertEqual(row(t['after']['frame'])['missionId'],37)
            self.assertEqual(row(t['after']['frame'])['missionDuration'],99)
            self.assertEqual(len(t['observedEffects']),1)
            self.assertEqual(t['after']['frame']['activePersonIds'],[7])
            self.assertEqual(next(s['returnValue'] for s in t['steps'] if s['helper']=='004A83EA/return-ignored'),-1)



if __name__ == '__main__':
    unittest.main()
