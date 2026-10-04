"""P0-62 explicit expanded frame; older schemas and traces are unchanged."""
from __future__ import annotations
import copy
from capture_transaction_profile import exact_keys, integer, boolean
import mission_notification_tail_profile as legacy

FRAME_PROFILE_ID = 'source-idb-S1-S2-recursive-return-frame-v1'
EXTRA = {
    'persons': {'officeId','leadershipByte','strengthByte','rawWordAE','rawDword17C'},
    'buildings': {'subtypeValid','legionId','governorId','homeRosterIds'},
    'legions': {'leaderId','rosterIds'},
    'forces': {'field128','advisorId'},
    'cities': set(),
}
TABLES = {n:(keys | EXTRA[n],high) for n,(keys,high) in legacy.TABLES.items()}


def tail_snapshot(frame):
    """Lossy diagnostic view, never a mutable state or automatic migration."""
    result = copy.deepcopy(frame)
    for name,(keys,_) in legacy.TABLES.items():
        result[name] = [{k:copy.deepcopy(r[k]) for k in keys} for r in frame[name]]
    return result


def person_predicates(person):
    """Canonical type10 virtual+04/+08 from raw +17C and signed status.

    These booleans are derived reads, never independent native storage fields.
    The raw dword's meaning is deliberately unspecified; only zero is tested.
    """
    nonzero = person['rawDword17C'] != 0
    allocated = nonzero or 0 <= person['status'] <= 8
    valid = allocated and (nonzero or person['status'] not in (6, 8))
    return allocated, valid


def refresh_person_predicates(person):
    person['allocated'], person['valid'] = person_predicates(person)


def validate_frame(frame):
    exact_keys(frame,legacy.FRAME_KEYS,'recursive frame')
    for name,(keys,high) in TABLES.items():
        if type(frame[name]) is not list: raise ValueError(name+' list')
        for r in frame[name]: exact_keys(r,keys,name)
    legacy.validate_frame(tail_snapshot(frame))
    people = {p['id'] for p in frame['persons']}
    cities = {r['id']:r for r in frame['cities']}
    buildings = {r['id']:r for r in frame['buildings']}
    for bid,b in buildings.items():
        if bid<=41 and (bid not in cities or b['subtypeValid']!=cities[bid]['valid']):
            raise ValueError('city/subtype validity alias mismatch')
    if any(cid not in buildings for cid in cities): raise ValueError('city building slot required')
    for p in frame['persons']:
        integer(p['rawDword17C'],'rawDword17C',0,0xffffffff)
        if (p['allocated'],p['valid']) != person_predicates(p):
            raise ValueError('person allocated/valid must match canonical raw/status getters')
        integer(p['officeId'],'office ID',legacy.I32_MIN,legacy.I32_MAX)
        for k in ('leadershipByte','strengthByte'): integer(p[k],k,0,255)
        integer(p['rawWordAE'],'rawWordAE',0,65535)
    for b in frame['buildings']:
        boolean(b['subtypeValid'],'subtype valid')
        for k in ('legionId','governorId'): integer(b[k],k,legacy.I32_MIN,legacy.I32_MAX)
    for l in frame['legions']: integer(l['leaderId'],'leader ID',legacy.I32_MIN,legacy.I32_MAX)
    for f in frame['forces']:
        for k in ('field128','advisorId'): integer(f[k],k,legacy.I32_MIN,legacy.I32_MAX)
    for name,key in (('buildings','homeRosterIds'),('legions','rosterIds')):
        for r in frame[name]:
            if type(r[key]) is not list: raise ValueError('ordered roster required')
            for pid in r[key]:
                integer(pid,'roster pointer',0,1099)
                if pid not in people: raise ValueError('unreadable roster pointer')


def frame_domain(frame):
    return legacy._domain(frame)
