"""P0-65 independent S1/S2 empty-legion interpreter and adversarial checks.

Only assertions invoke the public projector. The expected interpreter extends
P0-64's independent oracle, with source-transcribed scalar stores, saved native
pointer IDs, copied roster occurrences, geography, and RNG. It never asks a
production planner to generate an expected frame or observation record.
"""
import copy
import itertools
import json
import random
import unittest
from unittest.mock import patch

import empty_legion_redistribution_profile as m
import return_route_target_force_profile as previous
from check_native_roster_sort_profile import NATIVE_STEPS
from check_return_route_target_force_profile import (
    Oracle as RouteOracle, fixture as route_fixture, building, person, row,
    refresh_people, map_cell, TERRITORY_TABLE, digest)

FRAME = 'source-idb-S1-S2-empty-legion-frame-v1'
DOMAIN = 'canonical-live-empty-legion-v1'


def set_legion(legion, **fields):
    """Test-only explicit little-endian +04/+08/+0C aliases."""
    raw = bytearray.fromhex(legion['rawScalarHex'])
    for name, value in fields.items():
        if name in ('forceId', 'number', 'leaderId'):
            offset = ('forceId', 'number', 'leaderId').index(name) * 4
            raw[offset:offset+4] = (value & 0xffffffff).to_bytes(4, 'little')
        legion[name] = value
    legion['rawScalarHex'] = raw.hex()
    legion['valid'] = 0 <= legion['forceId'] <= 46
    return legion


def legion(lid, **fields):
    result = dict(id=lid, valid=True, forceId=0, number=2, leaderId=-1,
                  rosterIds=[], data={}, rawScalarHex=bytes(range(44)).hex())
    result.update(fields)
    return set_legion(result, forceId=result['forceId'], number=result['number'],
                      leaderId=result['leaderId'])


def fixture(entry='merge-legion', source='S1', **kw):
    f = route_fixture(entry=entry if entry not in ('merge-legion', 'force-legion') else 'legion',
                      source=source, **kw)
    for l in f[0]['frame']['legions']:
        l['rawScalarHex'] = bytes(range(44)).hex()
        set_legion(l, forceId=l['forceId'], number=l['number'], leaderId=l['leaderId'])
    # Canonical city virtual+04/+08 reads type6, not generic base.valid.
    # All42 city slots exist; neutral cities have a raw legion of-1.
    w = f[0]['frame']
    cities = {c['id'] for c in w['cities']}
    bases = {b['id'] for b in w['buildings']}
    for cid in range(42):
        if cid not in cities: w['cities'].append(dict(id=cid, valid=True, data={}))
    # Port/gate subtype slots also have a fixed type getter. Missing generic
    # bases use invalid facility kinds while their subtype pointer stays valid.
    for bid in range(87):
        if bid not in bases:
            w['buildings'].append(building(bid, valid=False, kind=-1, subtypeValid=True, legionId=-1))
    if entry == 'merge-legion':
        f[0]['frame']['legions'].append(legion(1))
        f[1]['args'] = dict(sourceLegionId=0, destinationLegionId=1)
    elif entry == 'force-legion': f[1]['args'] = dict(forceId=0, ordinal=1)
    f[1].update(id='empty-1', entry=entry)
    f[3].update(id='empty-observe-v1', frameProfile=FRAME, emptyLegionDomain=DOMAIN)
    return f


def run(f):
    return m.project_empty_legion(*f)


# Independently extracted source bytes 0079B830..0079BF14. These literals are
# deliberately separate from production geographic constants.
DISTANCE = {
    'S1': bytes.fromhex(
        '0001020203030304050506040405060505060607080807080907080806070809090a0a09070809090a0b0100010102020203'
        '0404050303040504040505060707060708060707050607080809090806070808090a02010001020102030404050303040504'
        '040505060707060708060707050607080809090806070808090a020101000102010203030402020304030304040506060506'
        '0705060604050607070808070506070708090302020100020101020203010203040303040405060604050604050504050606'
        '0707080705060707080903020102020001030403040202030403030404050606050607050606040506070708080705060707'
        '0809030202010101000203020301010203020203030405050405060405050304050606070706040506060708040303020103'
        '0200010202020304030404050506070703040503040404050505060607060607070808090504040302040301000101020203'
        '0203030404050606020304020303030404040505060505060607070805040403020302020100010101020202020303040505'
        '0203040203030304040405050605040506060708060505040304030201010002020201030304030505060102030102020203'
        '0303040405040405050606070403030201020102020102000102030202030304050503040503040403040505060607060405'
        '0606070804030302020201030201020100010201010202030404030405030404020304050506060503040505060705040403'
        '0303020403020202010001010102020304040304050304040203040505060605030405050607060505040404030302020103'
        '0201000202030204040502030402030301020304040505040304050506070504040303030204030203020101020001010202'
        '0303040506040504020304050506060502030404050605040403030302040302030201010201000101020303040506040403'
        '0102030404050504020304040506060505040404030504030403020203010100020102020506070505040203040505060604'
        '0102030304050605050404040305040303030202020201020003020304050604040301020304040505040102030304050706'
        '0605050504060504050403030402020103000101060708060605030405060607070502030404050608070706060605070605'
        '0505040404030302020100010607080606050304050605070604010203030405080707060606050706050605040405030302'
        '0301010007080907070604050607060807050203040405060706060504050403020201030303020404050406060700010201'
        '0102030302020303040305050405050608070706050605040303020404040305050605070708010001020203040403030404'
        '0504060605060607090808070607060504040305050504060607060808090201000303040505040405050605070706070708'
        '0706060504050403020201030303020404050406060701020300010103020202030304030505040505060807070605060504'
        '0303020404040305040504060607010203010001030201010202030205040304040508070706050605040303020404040304'
        '0304030505060203040101000201010102020302040403040405060505040404030403030203020201020102010303040304'
        '0503030200010203030404030203040405060706060505050405040403040303020302030204040503040502020101000102'
        '0203030203040304040508070706060605050404030504040304030403050506020304020101020100010102020104030203'
        '0304090808070607060504040305050504050405040606070203040201010302010001010202050403040405090808070707'
        '0606050504060505040504050406050603040503020203020101000201010403020303040a09090807080706050504060606'
        '050605060507070803040503020204030201020001030605040505060a090908080807070606050706060506050605070607'
        '0405060403030403020201010002050403040405090808070707060605050406050504050404040504050304050302020302'
        '0102010302000302010202030706060505050406050404040303030202010102010205060705050402030405040605030001'
        '0202030408070706060605070605050504040403030202030203050607050404030403040305040201000101020309080807'
        '0707060706060506050505040403030403040405060403030403020302040301020100010102090808070707060807060606'
        '0505050404030304030405060705040404040304030504020201010001020a09090808080708070706070606060505040405'
        '040505060705040405040304030504020302010100010b0a0a09090908090808070807070706060505060506060708060505'
        '0605040504060503040302020100'
),
    'S2': bytes.fromhex(
        '0001010202030303040506040205060a06050606070707060707080405070809080409090607080809080100010202030303'
        '040506040205060a060506060707070607070804050708090804090906070808090801010001010202020304050301040509'
        '0504050506060605060607030406070807030808050607070807020201000102010102030402020304080403040405050504'
        '0505060303050607060207070405060607060202010100010102030304020203040804030404050506050605060204050607'
        '0602070704050606070703030202010001030403040201030407030203030404060607050601050405060602070603040505'
        '0708030302010101000203020301020203070302030304040505060405020404050605010606030405050607030302010203'
        '0200010203010302030703030404050504030404050302040506050206060405060606050404030203040301000102020402'
        '0306030405050606030203030404010405050403050605060707050405050403030302020100010104010205020304040505'
        '0303040203030203040403020405040506060405060605040404030302010002050201040203040405050202030102040103'
        '0303020303040405050603040404030202020101020102000301020602020303040404040503040203030405040105050304'
        '0505050602020102020102030404050300040508040304040505070607060702050506070703080704050606080805050403'
        '0303020202010201040001050102030304040404050304020302030404010504030405050506060605040404030303020102'
        '0501000501020303040403030402030302020304030204040304050504050a0a090808070707060504060805050004050606'
        '0707040403030206050302010206010306050405030406060504040303030302020204010104000102020303040405030302'
        '0301020304020503020304040506050504030302020304030302030202050100010102020505060404010402030405010604'
        '0102030306070606050404030304050404030403030602010001020206060705050205030405060207050203040407080606'
        '0504040303040504040304030306020101000101060607050502050304050602070502030404070807070605050404050605'
        '0504050404070302020100010707080606030604050607030804010203030809070706050504040506050504050404070302'
        '0201010007070806060306040506070308050203040408090707060506060504030302040704030404050606070700010201'
        '0206020403030205030406060506030306060504050605030203020406040304040506060707010001020306010504030205'
        '0305060706070302070706050607060403040305070504030506070708080201000202070204030201060204070605060201'
        '0707060505050404030201030603020303040505060601020200010502030202010402030505040502030808070606060505'
        '0403020407040302030405050606020302010005030201010105020205040304020304040303020102030403040202020306'
        '0201020203030606070505000503040506010705020304040708050504030405040201020103050302050304050506060201'
        '0202030500040404030404050506060704030707060505040404040303030502020301020303040404050403020304000102'
        '0303040203040304040508080706060505050504030406030302020304040505030403020104040100010204030104030203'
        '0304090908070706060605040305070404010304050506060303020201050402010001050202050403040203080807060606'
        '0505040302040704030204050606070702020101010603030201000501030605040501020404030202020102030203010301'
        '0206020102020303050506040501040304050500060502030404060709090807070706060504030508050401050607070808'
        '0303020202070404030201060004070605060203090908070706060606050405070404030304050504050405040302050502'
        '0102030504000302010204050606050404030304050404030403030602010202010206060705050205030405060207030001'
        '0202070807070605050404050605050405040405030203030203060706050403060403040503060201000101060708080706'
        '0605050607060505060505040403040403040506050403040603020304040501020100010506080807060605050607060605'
        '0605050504030404030406070605040407040304050406020201010006070909080707070606050403050805040305060707'
        '0808030302020207040403020106020407060506000108080706070807050405040608060504060708080909030201030308'
        '0305040302070305080706070100'
),
}


class Oracle(RouteOracle):
    def __init__(self, *args, shared_reads=(0, 0, 0), **kwargs):
        super().__init__(*args, **kwargs)
        self.shared_reads = list(shared_reads)
        self.local_rng = 0
        self.merges = []
        self.raw_writes = []

    def set_legion_field(self, lid, **fields):
        set_legion(self.get('legions', lid), **fields)

    def force_legion(self, fid, ordinal):
        with self.inside('00481240', forceId=fid, ordinal=ordinal):
            if ordinal < 1 or ordinal > 8: return -1
            for l in sorted(self.w['legions'], key=lambda r: r['id']):
                if l['valid'] and l['forceId'] == fid and l['number'] == ordinal:
                    return l['id']
            return -1

    def reset_legion(self, lid):
        """0047E470 store sequence, including +2C BYTE and preserved +2D..2F."""
        l = self.get('legions', lid)
        raw = bytearray.fromhex(l['rawScalarHex'])
        def store(address, width, value):
            offset = address-4
            before = raw[offset:offset+width].hex()
            raw[offset:offset+width] = (value & ((1 << (8*width))-1)).to_bytes(width, 'little')
            self.raw_writes.append((lid, address, width, before, raw[offset:offset+width].hex()))
        for offset in (8, 0x24, 0x28): store(offset, 4, 0)
        store(0x2c, 1, 0)
        for offset in (4, 0xc, 0x10, 0x14, 0x18, 0x1c, 0x20): store(offset, 4, -1)
        for bit in range(12):
            mask = int.from_bytes(raw[0x24:0x28], 'little')
            if bit == 11:
                store(0x20, 4, -1)
                mask &= ~(1 << bit)
            else: mask |= 1 << bit
            store(0x28, 4, mask)
        l.update(rawScalarHex=raw.hex(), forceId=-1, number=0, leaderId=-1,
                 valid=False, rosterIds=[])

    def copy_roster(self, ids):
        # 0049F820 -> 0047C1B0 copies nodes verbatim, including duplicates and
        # unallocated persons; 004A32F0 subsequently checks live allocation.
        return list(ids)

    def merge_legion(self, source, destination):
        self.merges.append((source, destination))
        with self.inside('004BD3B0', sourceLegionId=source,
                         destinationLegionId=destination):
            saved_leader = self.get('legions', source)['leaderId']
            old = self.get('persons', saved_leader)
            self.save(savedSourceLeaderId=saved_leader if old is not None else None)
            if old is not None and old['valid']:
                if old['status'] <= 1:
                    home = old['homeBaseId']
                    saved_home = home if self.get('buildings', home) is not None else None
                    self.save(savedSourceLeaderHomeId=saved_home)
                    at_home = self.at_home(saved_leader, 'merge-old-leader')
                    keep = at_home and saved_home is not None and self.valid('buildings', saved_home) and self.governor_id(saved_home) == saved_leader
                    self.set_status(saved_leader, 2 if keep else 3)
                if self.valid('legions', source): self.set_legion_field(source, leaderId=-1)
                self.governor(self.get('persons', saved_leader)['homeBaseId'])
            if destination is not None:
                copied = self.copy_roster(self.get('legions', source)['rosterIds'])
                self.save(copiedSourceRosterIds=copied)
                with self.inside('004A33B0', requestedLegionId=destination, candidateIds=copied):
                    twice = self.copy_roster(copied)
                    for pid in twice: self.legion_setter(pid, destination)
                # Mutable callbacks can change later base ownership and every
                # read below resolves the saved ID against the current frame.
                for b in sorted(self.w['buildings'], key=lambda r: r['id']):
                    bid = b['id']
                    if self.valid('buildings', bid) and self.canonical(bid) and self.base_legion(bid) == source:
                        self.boundary('merge-building', 'effect', '004AD550', dict(
                            buildingId=bid, requestedLegionId=destination))
                leader = self.get('persons', self.get('legions', destination)['leaderId'])
                target = leader['homeBaseId'] if leader is not None and leader['valid'] else -1
                saved_target = target if self.get('buildings', target) is not None else None
                self.save(savedDestinationHomeId=saved_target)
                if saved_target is not None and self.valid('buildings', saved_target):
                    for copied_index, pid in enumerate(copied):
                        p = self.get('persons', pid)
                        if not p['valid']: continue
                        home = p['homeBaseId']
                        if self.valid('buildings', home) and self.base_legion(home) != self.get('persons', pid)['rawLegionId']:
                            self.boundary('merge-relocate', 'effect', '004A8270', dict(
                                personId=pid, targetBuildingId=saved_target, copiedIndex=copied_index))
            self.reset_legion(source)

    def nonempty(self, lid):
        city = any(c['valid'] and self.get('buildings', c['id'])['legionId'] == lid for c in self.w['cities'])
        return city and any(p['valid'] and p['rawLegionId'] == lid for p in self.w['persons'])

    def survives(self, fid):
        people = any(self.valid('forces', fid) and p['allocated'] and self.force_id(p['id']) == fid and 0 <= p['status'] <= 3 for p in self.w['persons'])
        cities = any(c['valid'] and self.subtype_force(c['id']) == fid for c in self.w['cities'])
        return people and cities

    def nearest(self, anchor, candidates):
        with self.inside('0049F1D0', originBuildingId=anchor, candidateCityIds=candidates):
            return self.nearest_body(anchor, candidates)

    def nearest_body(self, anchor, candidates):
        best, ties = 2**31-1, []
        for cid in candidates:
            a, b = self.territory(anchor), self.territory(cid)
            distance = DISTANCE[self.source][a*42+b] if 0 <= a <= 41 and 0 <= b <= 41 else -1
            if distance < best: best, ties = distance, [cid]
            elif distance == best: ties.append(cid)
        index = 0
        if len(ties) >= 2:
            seed = self.w['rngState']
            if self.source == 'S2':
                cells = self.boundary('shared-user-data', 'query', '008EB010/shared-user-data',
                    dict(addresses=['7FFE0320', '7FFE0008', '7FFE0014']), self.shared_reads)
                seed = (seed + (sum(cells) & 65535)) & 0xffffffff
            self.w['rngState'] = (seed * 0x6c078965 + 12345) & 0xffffffff
            self.local_rng += 1
            index = (self.w['rngState'] >> 16) % len(ties)
        return ties[index] if ties else None

    def empty_legion(self, lid, fid):
        with self.inside('004BE2A0/empty', legionId=lid, savedForceId=fid):
            return self.empty_body(lid, fid)

    def empty_body(self, lid, fid):
        if self.get('legions', lid)['number'] != 1:
            target = self.force_legion(fid, 1)
            self.merge_legion(lid, target if target >= 0 else None)
            return
        force = self.get('forces', self.get('legions', lid)['forceId'])
        if force is not None and force['valid']:
            ruler = self.get('persons', force['rulerId'])
            home = ruler['homeBaseId'] if ruler is not None and ruler['valid'] else -1
            anchor = home if self.get('buildings', home) is not None else None
            self.save(savedOriginBuildingId=anchor)
            if anchor is not None and self.valid('buildings', anchor):
                candidates = [c['id'] for c in sorted(self.w['cities'], key=lambda r:r['id'])
                              if c['valid'] and self.subtype_force(c['id']) == force['id']]
                candidates = [c for c in candidates if self.get('buildings', c)['legionId'] != lid]
                while candidates:
                    nearest = self.nearest(anchor, candidates)
                    source = self.get('buildings', nearest)['legionId']
                    self.merge_legion(source, lid)
                    if self.nonempty(lid): break
                    candidates = [c for c in candidates if self.get('buildings', c)['legionId'] != source]
        if self.nonempty(lid): return
        for ordinal in range(2, 9):
            self.force_legion(fid, ordinal)  # EAX deliberately discarded at004BE46A.
            l = self.get('legions', ordinal)
            if l is not None and l['valid']: self.merge_legion(ordinal, lid)

    def legion(self, lid):
        self.role_calls.append(('legion', lid))
        with self.inside('004BE2A0', legionId=lid):
            if not self.valid('legions', lid): return
            fid = self.get('legions', lid)['forceId']
            if not 0 <= fid <= 41: return
            if not self.survives(fid): raise RuntimeError('unsupported-force-extinction')
            if not self.nonempty(lid):
                self.empty_legion(lid, fid)
                return
            self.stable_legion(lid, fid)

    def stable_legion(self, lid, fid):
        old = self.get('legions', lid)['leaderId']
        old = old if self.get('persons', old) is not None else None
        copied = sorted(p['id'] for p in self.w['persons'] if p['valid'] and p['rawLegionId'] == lid)
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
                if self.valid('legions', lid): self.set_legion_field(lid, leaderId=selected)
                for bid in sorted(b['id'] for b in self.w['buildings'] if b['id'] <= 86):
                    if self.canonical(bid) and self.base_legion(bid) == lid: self.governor(bid)

    def run(self):
        entry, args = self.f[1]['entry'], self.f[1]['args']
        if entry == 'merge-legion':
            source, destination = args['sourceLegionId'], args['destinationLegionId']
            source_row = self.get('legions', source)
            destination_row = self.get('legions', destination)
            if source_row is None: raise RuntimeError('unsupported-null-merge-source')
            self.merge_legion(source, destination if destination_row is not None else None)
        elif entry == 'force-legion':
            self.native_result = self.force_legion(args['forceId'], args['ordinal'])
        else: return super().run()
        self.f[2]['records'] = copy.deepcopy(self.records)
        return self


def transfer_effect(stage, w, c):
    """Explicit synthetic ordinary building transfer/relocation fixture."""
    if stage == 'merge-building':
        row(w, c['args']['buildingId'], 'buildings')['legionId'] = c['args']['requestedLegionId']
    if stage == 'merge-relocate':
        row(w, c['args']['personId'])['homeBaseId'] = c['args']['targetBuildingId']
    return 0


def empty_fixture(source='S1', primary=False):
    f = fixture('legion', source)
    w = f[0]['frame']
    w['activePersonIds'] = []
    # Empty source0, surviving force through secondary9/city1/person9.
    w['legions'].append(legion(9, number=2, leaderId=9, rosterIds=[9]))
    set_legion(row(w, 0, 'legions'), number=1 if primary else 2)
    row(w, 9).update(status=3, rawLegionId=9)
    row(w, 1, 'buildings').update(legionId=9, homeRosterIds=[9], governorId=9)
    row(w).update(rawLegionId=9, status=5, missionId=-1)
    row(w, 0, 'buildings').update(legionId=9, homeRosterIds=[])
    if not primary: set_legion(row(w, 9, 'legions'), number=1)
    for lid in range(2, 9): w['legions'].append(legion(lid, forceId=-1, number=0))
    refresh_people(w)
    return f


class EmptyLegionTests(unittest.TestCase):
    maxDiff = 5000

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
        self.assertEqual(result['rng']['localCalls'], expected.local_rng)
        self.assertEqual([s for s in result['steps'] if s['helper'] in NATIVE_STEPS
                          and not (s['helper'] == '00491310' and 'personId' not in s)], expected.audit)
        self.assertEqual(result['after']['revision'], f[0]['revision'] + 1)
        self.assertEqual(len(result['after']['appliedCommands']), len(f[0]['appliedCommands']) + 1)
        writes = [s for s in result['steps'] if s['helper'] in
                  ('0047E470/store', '0047E280/target-clear', '0047E280/flag-store')]
        self.assertEqual([(s['legionId'], s['offset'], s['width'],
                           s['oldRawScalarHex'][(s['offset']-4)*2:(s['offset']-4+s['width'])*2],
                           s['rawScalarHex'][(s['offset']-4)*2:(s['offset']-4+s['width'])*2])
                          for s in writes], expected.raw_writes)
        self.assertEqual(f, original)
        if replay: self.assertEqual(result, m.replay_empty_legion(json.loads(json.dumps(result))))
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
        self.assertEqual(t, m.replay_empty_legion(t))
        return t

    def test_01_all_entry_points_and_sources(self):
        for source, entry in itertools.product(('S1', 'S2'), (
                'event','return','legion','governor','capacity','role-sort',
                'roster-sort','route','at-home','target-force','force-legion','merge-legion')):
            with self.subTest(source=source, entry=entry):
                t = self.check_oracle(fixture(entry, source), effect=transfer_effect)
                for key in ('globalConsumptionVerified',): self.assertFalse(t['rng'][key])
                for key in ('callbacksAssumedNoninterfering','stockVerified','vanillaVerified',
                            'machineCodeExecuted','engineGuardIsOriginalRule'):
                    self.assertFalse(t['evidence'][key])

    def test_02_force_ordinal_first_global_id_and_bounds(self):
        for source, ordinal in itertools.product(('S1','S2'), (-2147483648,0,1,2,8,9,2147483647)):
            f=fixture('force-legion',source); w=f[0]['frame']
            w['legions'] += [legion(12,number=2),legion(5,number=2),legion(3,forceId=-1,number=2)]
            f[1]['args']['ordinal']=ordinal
            t=self.check_oracle(f)
            self.assertEqual(t['nativeResult'],0 if ordinal==1 else 5 if ordinal==2 else -1)
        f=fixture('force-legion');f[1]['args']['forceId']=-1
        self.assertEqual(self.check_oracle(f)['nativeResult'],-1)
        f=fixture('force-legion');f[1]['args']['forceId']=2
        self.assertEqual(self.check_oracle(f)['nativeResult'],-1)

    def test_03_reset_exact_width_order_padding_and_null_destination(self):
        for source in ('S1','S2'):
            f=fixture(source=source);f[1]['args']['destinationLegionId']=-1
            w=f[0]['frame'];before=bytes.fromhex(row(w,0,'legions')['rawScalarHex'])
            t=self.check_oracle(f)
            after=row(t['after']['frame'],0,'legions')
            raw=bytes.fromhex(after['rawScalarHex'])
            self.assertEqual(raw[-3:],before[-3:])
            self.assertEqual(raw[40],0)
            self.assertEqual(int.from_bytes(raw[36:40],'little'),0x7ff)
            self.assertEqual(after['rosterIds'],[])
            self.assertFalse(after['valid'])
            self.assertEqual(row(t['after']['frame'])['rawLegionId'],0)
            self.assertEqual(t['observedEffects'],[])

    def test_04_secondary_merge_no_stable_tail(self):
        for source in ('S1','S2'):
            f=empty_fixture(source)
            t=self.check_oracle(f,effect=transfer_effect)
            self.assertFalse(row(t['after']['frame'],0,'legions')['valid'])
            self.assertTrue(row(t['after']['frame'],9,'legions')['valid'])
            self.assertFalse(any(s['helper']=='004BE2A0/select' for s in t['steps']))
            scopes=[s['callStack'] for s in t['steps'] if s['helper']=='0047E470/store']
            self.assertTrue(all(any(x['helper']=='004BE2A0/empty' for x in scope) for scope in scopes))

    def test_05_primary_nearest_transfers_other_into_primary(self):
        for source in ('S1','S2'):
            f=empty_fixture(source,primary=True)
            t=self.check_oracle(f,effect=transfer_effect)
            self.assertTrue(row(t['after']['frame'],0,'legions')['valid'])
            self.assertFalse(row(t['after']['frame'],9,'legions')['valid'])
            self.assertEqual(row(t['after']['frame'],9)['rawLegionId'],0)
            self.assertFalse(any(s['helper']=='004BE2A0/select' for s in t['steps']))

    def test_06_primary_fallback_uses_global_ids_and_keeps_looping(self):
        f=empty_fixture(primary=True); w=f[0]['frame']
        # Ruler's out-of-range home bypasses nearest, forcing native fallback.
        row(w,9)['homeBaseId']=-1
        w['buildings']=[b for b in w['buildings'] if b['id']!=42]+[building(42,legionId=2)]
        row(w,2,'legions').update(rosterIds=[7])
        set_legion(row(w,2,'legions'),forceId=4,number=8)
        row(w)['rawLegionId']=2
        set_legion(row(w,3,'legions'),forceId=5,number=7)
        t=self.check_oracle(f,effect=transfer_effect)
        discarded=[s for s in t['steps'] if s['helper']=='004BE460/discarded-lookup']
        self.assertEqual([s['ordinal'] for s in discarded],list(range(2,9)))
        self.assertEqual(discarded[0]['lookupResult'],9)
        reset=[s['legionId'] for s in t['steps'] if s['helper']=='0047E470/store' and s['offset']==8]
        self.assertEqual(reset,[2,3])
        self.assertTrue(row(t['after']['frame'],9,'legions')['valid'])
        self.assertFalse(row(t['after']['frame'],2,'legions')['valid'])

    def test_07_verbatim_double_roster_copy_and_saved_destination_home(self):
        f=fixture();w=f[0]['frame'];w['activePersonIds']=[]
        row(w,0,'legions')['rosterIds']=[7,7,403]
        set_legion(row(w,1,'legions'),leaderId=9)
        row(w,9)['rawLegionId']=1
        row(w,1,'buildings')['legionId']=1
        row(w,42,'buildings')['legionId']=-1
        def effect(stage,v,c):
            if stage=='merge-building':
                row(v,0,'legions')['rosterIds']=[9]
                row(v,403).update(status=3,rawLegionId=1,homeBaseId=0)
                v['data']['nested']['value']=333
            elif stage=='merge-relocate':
                set_legion(row(v,1,'legions'),leaderId=7)
                row(v,9)['homeBaseId']=0
                row(v,1,'buildings').update(valid=False,kind=-1)
            return 2
        t=self.check_oracle(f,effect=effect)
        copies=[s['candidateIds'] for s in t['steps'] if s['helper'] in ('0049F820/merge-copy','0049F820/batch-copy')]
        self.assertEqual(copies,[[7,7,403],[7,7,403]])
        calls=[r for r in t['observedEffects'] if r['helper']=='004A8270']
        self.assertEqual([r['args'] for r in calls],[dict(personId=pid,targetBuildingId=1,copiedIndex=i) for i,pid in enumerate((7,7,403))])
        self.assertEqual(t['after']['frame']['data']['nested']['value'],333)
        self.assertFalse(row(calls[1]['before'],1,'buildings')['valid'])
        self.assertEqual(row(t['after']['frame'],0,'legions')['rosterIds'],[])
        self.assertEqual(row(t['after']['frame'],403)['rawLegionId'],1)

    def test_08_full_frame_transfer_live_forward_scan_and_invalid_destination(self):
        f=fixture();w=f[0]['frame'];w['activePersonIds']=[]
        set_legion(row(w,1,'legions'),leaderId=9)
        row(w,9)['rawLegionId']=1
        row(w,1,'buildings')['legionId']=1
        row(w,42,'buildings')['legionId']=1
        def effect(stage,v,c):
            if stage=='merge-building':
                bid=c['args']['buildingId']
                if bid==0:
                    row(v,1,'buildings')['legionId']=0
                    set_legion(row(v,1,'legions'),forceId=-1,number=-2147483648)
                elif bid==1: row(v,42,'buildings')['legionId']=0
                row(v,bid,'buildings')['legionId']=1
                v['managerDirty']=bid
                v['rngState']=(v['rngState']+1)&0xffffffff
            return None
        t=self.check_oracle(f,effect=effect)
        calls=[r['args']['buildingId'] for r in t['observedEffects'] if r['helper']=='004AD550']
        self.assertEqual(calls,[0,1,42])
        self.assertFalse(row(t['after']['frame'],1,'legions')['valid'])
        self.assertIsNone(t['rng']['observedCalls'])
        self.assertFalse(t['rng']['allCountsKnown'])
        self.assertEqual(t['after']['frame']['rngState'],11)

    def test_09_geography_source_separation_invalid_territory_and_rng(self):
        # Two candidate cities are tied at source1's code42->5, whereas source2
        # maps that territory code to19. A third far candidate exercises min.
        outcomes=[]
        for source in ('S1','S2'):
            f=empty_fixture(source,primary=True);w=f[0]['frame']
            row(w,0,'buildings').update(positionX=0,positionY=0)
            row(w,1,'buildings').update(positionX=0,positionY=1)
            map_cell(w,0,0,42<<5);map_cell(w,0,1,1<<5)
            row(w,9)['homeBaseId']=0
            t=self.check_oracle(f,effect=transfer_effect,shared_reads=(0xffffffff,2,65535))
            distances=[s['result'] for s in t['steps'] if s['helper']=='0047B480']
            outcomes.append(distances)
            self.assertEqual(distances,[DISTANCE[source][TERRITORY_TABLE[source][42]*42+TERRITORY_TABLE[source][42]],DISTANCE[source][TERRITORY_TABLE[source][42]*42+1]])
        self.assertNotEqual(outcomes[0],outcomes[1])
        for source,entropy,state in itertools.product(('S1','S2'),((0,0,0),(0xffffffff,2,65535)),(8,0xffffffff)):
            f=empty_fixture(source,primary=True);f[0]['frame']['rngState']=state
            t=self.check_oracle(f,effect=transfer_effect,shared_reads=entropy)
            seed=state if source=='S1' else (state+(sum(entropy)&65535))&0xffffffff
            self.assertEqual(t['rng']['finalState'],(seed*0x6c078965+12345)&0xffffffff)
            self.assertEqual(t['rng']['localCalls'],1)
            self.assertEqual(len(t['queries']),int(source=='S2'))
        f=empty_fixture('S2',primary=True)
        row(f[0]['frame'],0,'buildings').update(positionX=-1)
        t=self.check_oracle(f,effect=transfer_effect)
        distances=[s['result'] for s in t['steps'] if s['helper']=='0047B480']
        self.assertIn(-1,distances)
        self.assertEqual(t['rng']['localCalls'],0)

    def test_10_observation_binding_atomicity_missing_extra_and_replay_tamper(self):
        f=fixture();Oracle(f,effect=transfer_effect).run()
        for mutate in (
            lambda f:f[2]['records'].clear(),
            lambda f:f[2]['records'].append(copy.deepcopy(f[2]['records'][-1])),
            lambda f:f[2]['records'][0]['args'].update(requestedLegionId=0),
            lambda f:f[2]['records'][0]['callStack'][0]['locals'].update(sourceLegionId=1),
            lambda f:f[2]['records'][0]['before'].update(managerDirty=44),
            lambda f:f[2]['records'][0]['after']['legions'][0].pop('rawScalarHex'),
            lambda f:f[2]['records'][0]['after']['legions'][0].update(number=99),
            lambda f:f[2]['records'][0]['after']['data'].update(newKey='bad-domain'),
        ):
            case=copy.deepcopy(f);mutate(case);self.atomic_error(case)
        case=copy.deepcopy(f);case[3]['unknownEffects']='reject'
        self.atomic_defer(case,'unresolved-effect:004AD550')
        t=run(f)
        for key in ('after','steps','rng','observedEffects'):
            value=copy.deepcopy(t)
            value[key]={} if isinstance(value[key],dict) else []
            value['traceHash']=digest({k:v for k,v in value.items() if k!='traceHash'})
            with self.assertRaises(ValueError):m.replay_empty_legion(value)

    def test_11_s2_rng_query_binding_and_value_validation(self):
        f=empty_fixture('S2',primary=True);Oracle(f,effect=transfer_effect,shared_reads=(10,20,30)).run()
        query=next(i for i,r in enumerate(f[2]['records']) if r['helper']=='008EB010/shared-user-data')
        for bad in (None,[],[0,0],[0,0,0,0],[True,0,0],[-1,0,0],[2**32,0,0],['0',0,0]):
            case=copy.deepcopy(f);case[2]['records'][query]['result']=bad;self.atomic_error(case)
        for mutate in (
            lambda f:f[2]['records'][query]['args']['addresses'].reverse(),
            lambda f:f[2]['records'][query]['before'].update(rngState=9),
            lambda f:f[2]['records'].pop(query),
        ):
            case=copy.deepcopy(f);mutate(case);self.atomic_error(case)
        # S1 never consumes the explicit S2 shared-page observation.
        f1=copy.deepcopy(f);f1[0]['source']=f1[2]['source']='S1'
        for r in f1[2]['records']:r['source']='S1'
        self.atomic_error(f1)

    def test_12_schema_alias_and_transaction_boundaries(self):
        for mutate in (
            lambda f:f[0]['frame']['legions'][0].update(forceId=3),
            lambda f:f[0]['frame']['legions'][0].update(leaderId=9),
            lambda f:f[0]['frame']['legions'][0].update(rawScalarHex='00'*43),
            lambda f:f[0]['frame']['legions'][0].update(rawScalarHex='FF'*44),
            lambda f:f[3].update(frameProfile='source-idb-S1-S2-return-route-frame-v1'),
            lambda f:f[3].pop('emptyLegionDomain'),
            lambda f:f[1]['args'].update(destinationLegionId=True),
        ):
            f=fixture();mutate(f);self.atomic_error(f)
        f=fixture();f[1]['args']['sourceLegionId']=-1
        self.atomic_defer(f,'unsupported-null-merge-source')
        f=fixture();f[1]['args']['sourceLegionId']=46;self.atomic_error(f)
        f=fixture();f[1]['expectedRevision']=1;self.atomic_defer(f,'revision-conflict')
        f=fixture();Oracle(f,effect=transfer_effect).run();t=run(f)
        again=[t['after'],f[1],f[2],f[3]]
        self.assertEqual(run(again)['reason'],'replay')
        changed=copy.deepcopy(again);changed[1]['args']['sourceLegionId']=1
        self.assertEqual(run(changed)['reason'],'replay-payload-conflict')
        f=fixture();f[3]['engineGuard']['maxNativeCalls']=1
        self.atomic_defer(f,'engine-guard-native-call-budget')

    def test_13_old_api_is_unchanged_and_no_implicit_upgrade(self):
        f=route_fixture('legion');RouteOracle(f).run()
        result=previous.project_return_route_target_force(*f)
        self.assertTrue(result['accepted'])
        self.assertEqual(result,previous.replay_return_route_target_force(result))
        self.assertNotIn('rawScalarHex',result['after']['frame']['legions'][0])
        self.atomic_error(f)
        f=fixture('legion');Oracle(f).run()
        with self.assertRaises(ValueError):previous.project_return_route_target_force(*f)
        # Expected values must stay independent of all legacy public projectors.
        with patch.object(previous,'project_return_route_target_force',side_effect=AssertionError('legacy projector called')):
            self.check_oracle(fixture('legion'))


    def test_14_source_leader_saved_across_recursive_observer_live_roster_afterward(self):
        for source in ('S1','S2'):
            f=fixture(source=source);w=f[0]['frame'];w['activePersonIds']=[];w['observerPresent']=True
            set_legion(row(w,0,'legions'),leaderId=7)
            set_legion(row(w,1,'legions'),leaderId=9)
            row(w).update(status=1,missionId=-1)
            row(w,9)['rawLegionId']=1
            row(w,0,'buildings').update(governorId=7,homeRosterIds=[])
            row(w,1,'buildings')['legionId']=1
            row(w,42,'buildings')['legionId']=-1
            refresh_people(w)
            def effect(stage,v,c):
                if stage=='event-observer' and c['event']['id']==8:
                    row(v)['homeBaseId']=1
                    set_legion(row(v,0,'legions'),forceId=-1,leaderId=9,number=7)
                    row(v,0,'legions')['rosterIds']=[403]
                    row(v,403).update(status=3,rawLegionId=0,homeBaseId=0)
                return transfer_effect(stage,v,c)
            t=self.check_oracle(f,effect=effect)
            observe=next(r for r in t['observedEffects'] if r['helper']=='observer.virtual1B4')
            self.assertEqual(observe['callStack'][0]['locals']['savedSourceLeaderId'],7)
            self.assertEqual(observe['callStack'][0]['locals']['savedSourceLeaderHomeId'],0)
            self.assertEqual(row(observe['before'],0,'legions')['leaderId'],-1)
            copied=next(s for s in t['steps'] if s['helper']=='0049F820/merge-copy')
            self.assertEqual(copied['candidateIds'],[403])
            self.assertEqual(row(t['after']['frame'])['homeBaseId'],1)
            self.assertEqual(row(t['after']['frame'],9)['status'],5)
            self.assertEqual(row(t['after']['frame'],403)['rawLegionId'],1)
            self.assertFalse(row(t['after']['frame'],0,'legions')['valid'])

    def test_15_primary_saved_candidates_live_filter_and_repeat_nearest(self):
        for source in ('S1','S2'):
            f=empty_fixture(source,primary=True)
            def effect(stage,v,c):
                if stage=='merge-building':
                    if c['args']['buildingId']==0:
                        row(v,1,'buildings')['legionId']=2
                        set_legion(row(v,2,'legions'),forceId=4,number=3)
                        row(v,2,'legions')['rosterIds']=[403]
                        row(v,403).update(status=3,rawLegionId=2,homeBaseId=1)
                        # Original ruler/anchor pointer survives this home edit.
                        row(v,9)['homeBaseId']=-1
                    elif c['args']['buildingId']==1:
                        row(v,1,'buildings')['legionId']=0
                return 0
            t=self.check_oracle(f,effect=effect)
            resets=[s['legionId'] for s in t['steps'] if s['helper']=='0047E470/store' and s['offset']==8]
            self.assertEqual(resets,[9,2])
            nearest=[s for s in t['steps'] if s['helper']=='0049F1D0/result']
            self.assertEqual(len(nearest),2)
            self.assertEqual(nearest[1]['callStack'][-1]['locals']['originBuildingId'],1)
            self.assertEqual(row(t['after']['frame'],403)['rawLegionId'],0)
            self.assertFalse(any(s['helper']=='004BE460/discarded-lookup' for s in t['steps']))

    def test_16_single_candidate_no_rng_or_s2_external_query(self):
        for source in ('S1','S2'):
            f=empty_fixture(source,primary=True);w=f[0]['frame']
            # City0 belongs to primary but it has no valid member, so it is
            # excluded from candidate selection while the primary is empty.
            row(w,0,'buildings')['legionId']=0
            t=self.check_oracle(f,effect=transfer_effect)
            self.assertEqual(t['rng']['localCalls'],0)
            self.assertEqual(t['rng']['initialState'],t['rng']['finalState'])
            self.assertEqual(t['queries'],[])
            rng=next(s for s in t['steps'] if s['helper']=='00472150')
            self.assertEqual((rng['bound'],rng['stateAdvances']),(1,0))

    def test_17_extinction_scope_gates_and_partial_failure_are_atomic(self):
        f=empty_fixture();w=f[0]['frame']
        row(w,9).update(status=5);refresh_people(w)
        self.atomic_defer(f,'unsupported-force-extinction')
        for fid in (-1,42,46):
            f=fixture('legion');set_legion(row(f[0]['frame'],0,'legions'),forceId=fid)
            t=self.check_oracle(f)
            self.assertEqual(t['after']['frame'],f[0]['frame'])
        # Final relocation boundary is missing after earlier merge side effects
        # were already tentatively observed. No partial state can escape.
        f=fixture();w=f[0]['frame']
        set_legion(row(w,1,'legions'),leaderId=9)
        row(w,9)['rawLegionId']=1;row(w,1,'buildings')['legionId']=1
        Oracle(f).run()
        self.assertTrue(any(r['helper']=='004A8270' for r in f[2]['records']))
        f[2]['records'].pop();self.atomic_error(f)

    def test_18_deterministic_independent_merge_fuzz(self):
        rng=random.Random(0x65)
        for index in range(64):
            source=('S1','S2')[index%2]
            f=fixture(source=source);w=f[0]['frame'];w['activePersonIds']=[]
            ids=[7,9,403]
            for pid in ids:
                row(w,pid).update(status=rng.choice((3,5,6,8,9)),
                    rawDword17C=rng.choice((0,0,17)),rawLegionId=rng.choice((0,1,-1)),
                    homeBaseId=rng.choice((0,1,-1)),missionId=-1)
            refresh_people(w)
            for lid in (0,1):
                l=row(w,lid,'legions')
                raw=bytes(rng.randrange(256) for _ in range(44)).hex()
                l['rawScalarHex']=raw
                set_legion(l,forceId=0,number=rng.choice((0,1,2,8,9)),leaderId=-1)
                l['rosterIds']=[rng.choice(ids) for _ in range(rng.randrange(5))]
            for b in w['buildings']:
                b.update(legionId=rng.choice((-1,0,1)),homeRosterIds=[])
            f[1]['args']['destinationLegionId']=rng.choice((-1,0,1))
            with self.subTest(source=source,index=index):
                self.check_oracle(f,replay=False,effect=transfer_effect)


    def test_19_invalid_readable_destination_self_merge_and_null_extremes(self):
        for source,destination in itertools.product(('S1','S2'),(-2147483648,-1,0,1,47,2147483647)):
            f=fixture(source=source);w=f[0]['frame'];w['activePersonIds']=[]
            f[1]['args']['destinationLegionId']=destination
            # A readable but invalid legion remains a nonnull native pointer.
            set_legion(row(w,1,'legions'),forceId=-1,leaderId=9)
            row(w,9)['rawLegionId']=1
            row(w,1,'buildings')['legionId']=1
            row(w,42,'buildings')['legionId']=-1
            t=self.check_oracle(f,effect=transfer_effect)
            self.assertFalse(row(t['after']['frame'],0,'legions')['valid'])
            self.assertEqual(row(t['after']['frame'],0,'legions')['rosterIds'],[])
            if destination==1:
                self.assertEqual(row(t['after']['frame'])['rawLegionId'],1)
                self.assertEqual(row(t['after']['frame'],1,'legions')['rosterIds'],[])
                self.assertTrue(any(r['helper']=='004AD550' for r in t['observedEffects']))
            elif destination==0:
                self.assertEqual(row(t['after']['frame'])['rawLegionId'],0)
                self.assertTrue(any(r['helper']=='004AD550' for r in t['observedEffects']))
            else:
                self.assertEqual(row(t['after']['frame'])['rawLegionId'],0)
                self.assertEqual(t['observedEffects'],[])

    def test_20_canonical_city_domain_and_alias_observations(self):
        f=fixture();Oracle(f,effect=transfer_effect).run()
        for mutate in (
            lambda f:row(f[0]['frame'],40,'cities').update(valid=False),
            lambda f:(row(f[0]['frame'],40,'cities').update(valid=False),
                      row(f[0]['frame'],40,'buildings').update(subtypeValid=False)),
            lambda f:(f[0]['frame']['cities'].remove(row(f[0]['frame'],40,'cities')),
                      f[0]['frame']['buildings'].remove(row(f[0]['frame'],40,'buildings'))),
            lambda f:f[0]['frame']['cities'].pop(),
            lambda f:row(f[0]['frame'],40,'buildings').update(subtypeValid=False),
            lambda f:row(f[0]['frame'],42,'buildings').update(subtypeValid=False),
            lambda f:row(f[0]['frame'],52,'buildings').update(subtypeValid=False),
            lambda f:row(f[0]['frame'],86,'buildings').update(subtypeValid=False),
            lambda f:f[0]['frame']['buildings'].remove(row(f[0]['frame'],86,'buildings')),
            lambda f:f[0]['frame']['buildings'].remove(row(f[0]['frame'],40,'buildings')),
            lambda f:row(f[2]['records'][0]['after'],40,'cities').update(valid=False),
            lambda f:(row(f[2]['records'][0]['after'],40,'cities').update(valid=False),
                      row(f[2]['records'][0]['after'],40,'buildings').update(subtypeValid=False)),
            lambda f:row(f[2]['records'][0]['after'],40,'buildings').update(subtypeValid=False),
            lambda f:row(f[2]['records'][0]['after'],42,'buildings').update(subtypeValid=False),
            lambda f:row(f[2]['records'][0]['after'],52,'buildings').update(subtypeValid=False),
            lambda f:row(f[2]['records'][0]['after'],86,'buildings').update(subtypeValid=False),
            lambda f:row(f[0]['frame'],0,'legions').update(rawScalarHex='gg'*44),
            lambda f:row(f[0]['frame'],0,'legions').update(rawScalarHex='00 '*44),
            lambda f:row(f[0]['frame'],0,'legions').update(rawScalarHex=bytes(44)),
            lambda f:row(f[0]['frame'],0,'legions').update(number=True),
            lambda f:row(f[0]['frame'],0,'buildings').update(valid=False),
            lambda f:row(f[0]['frame'],40,'buildings').update(valid=True),
            lambda f:row(f[2]['records'][0]['after'],0,'buildings').update(valid=False),
            lambda f:row(f[2]['records'][0]['after'],40,'buildings').update(valid=True),
            lambda f:row(f[2]['records'][0]['after'],0,'legions').update(forceId=2147483647),
        ):
            case=copy.deepcopy(f);mutate(case);self.atomic_error(case)
        for fid in range(42,47):
            f=fixture('legion');set_legion(row(f[0]['frame'],0,'legions'),forceId=fid)
            t=self.check_oracle(f)
            self.assertEqual(t['after']['frame'],f[0]['frame'])
            self.assertEqual(t['observedEffects'],[])

    def test_21_engine_guard_after_consumed_boundary_rolls_back_everything(self):
        f=fixture();Oracle(f,effect=transfer_effect).run()
        successful=run(f)
        final_native_calls=successful['nativeCalls']
        self.assertGreater(final_native_calls,1)
        f[3]['engineGuard']['maxNativeCalls']=final_native_calls-1
        rejected=self.atomic_defer(f,'engine-guard-native-call-budget')
        self.assertTrue(rejected['observedEffects'])
        self.assertTrue(any(r['after']!=r['before'] for r in rejected['observedEffects']))
        self.assertEqual(rejected['after']['frame'],f[0]['frame'])
        self.assertEqual(rejected['nativeCalls'],0)
        self.assertEqual(rejected['returnCalls'],0)
        self.assertEqual(rejected['after']['appliedCommands'],[])


if __name__ == '__main__': unittest.main()
