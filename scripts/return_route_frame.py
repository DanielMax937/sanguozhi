"""P0-64 route/ownership fields, explicit and versioned; no implicit migration.

The detached snapshot below is validation-only. No callback can strip or replace
these fields via an older frame. All native reads resolve the same live owner.
"""
from __future__ import annotations
import copy
from capture_transaction_profile import exact_keys, integer
from mission_event_listener_profile import _json
import native_sort_frame as previous

FRAME_PROFILE_ID = 'source-idb-S1-S2-return-route-frame-v1'
EXTRA = {'forces': {'rulerId'},
         'buildings': {'rawOwnerForceId','positionX','positionY'}}
ADDED = {'facilityInfos': ({'id','category','data'},63),
         'mapCells': ({'id','rawTerritoryDword','data'},39999)}
TABLES = {name:(keys | EXTRA.get(name,set()),high)
          for name,(keys,high) in previous.TABLES.items()} | ADDED
FRAME_KEYS = previous.FRAME_KEYS | set(ADDED)


def sort_snapshot(frame):
    """Detached diagnostic projection used solely to validate shared fields."""
    out={k:copy.deepcopy(v) for k,v in frame.items() if k not in ADDED}
    for name,extra in EXTRA.items():
        for row in out[name]:
            for key in extra: row.pop(key)
    return out


def validate_frame(frame):
    exact_keys(frame,FRAME_KEYS,'return-route frame')
    for name,(keys,hi) in TABLES.items():
        if type(frame[name]) is not list: raise ValueError(name+' list')
        for row in frame[name]: exact_keys(row,keys,name)
    previous.validate_frame(sort_snapshot(frame))
    for force in frame['forces']:
        integer(force['rulerId'],'force ruler raw+04',-2**31,2**31-1)
        if force['valid'] != (0<=force['rulerId']<=1099):
            raise ValueError('force valid must match canonical ruler range getter')
    for legion in frame['legions']:
        if legion['valid'] != (0<=legion['forceId']<=46):
            raise ValueError('legion valid must match canonical force range getter')
    for building in frame['buildings']:
        integer(building['rawOwnerForceId'],'building raw+0C',-2**31,2**31-1)
        for k in ('positionX','positionY'): integer(building[k],k,-32768,32767)
    for name,(keys,hi) in ADDED.items():
        seen=set()
        for row in frame[name]:
            integer(row['id'],name+' ID',0,hi)
            if row['id'] in seen: raise ValueError('duplicate '+name+' ID')
            seen.add(row['id'])
            if type(row['data']) is not dict: raise ValueError('row data object')
            _json(row['data'],'row data')
            if name=='facilityInfos': integer(row['category'],'facility raw+B4',-2**31,2**31-1)
            else: integer(row['rawTerritoryDword'],'map packed territory dword',0,0xffffffff)


def frame_domain(frame):
    def keys(value):
        return {k:keys(v) for k,v in value.items()} if type(value) is dict else None
    return (previous.frame_domain(frame) |
            {name:{r['id']:keys(r['data']) for r in frame[name]} for name in ADDED})
