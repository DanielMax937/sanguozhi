"""P0-63 explicit capacity inputs; no automatic upgrade of earlier frames."""
from __future__ import annotations
import copy
from capture_transaction_profile import exact_keys, integer, boolean
from mission_event_listener_profile import _json
import recursive_return_frame as previous

FRAME_PROFILE_ID = 'source-idb-S1-S2-native-sort-frame-v1'
EXTRA = {'persons': {'rawDword54'},
         'forces': {'raw40','titleId','techniqueBits'}}
ADDED = {'titles': ({'id','valid','capacityWord','data'},9),
         'offices': ({'id','valid','capacityWord','data'},80)}
TABLES = {name:(keys | EXTRA.get(name,set()),high)
          for name,(keys,high) in previous.TABLES.items()} | ADDED
FRAME_KEYS = previous.legacy.FRAME_KEYS | set(ADDED)


def recursive_snapshot(frame):
    """Detached diagnostic projection used solely to validate shared fields."""
    out={k:copy.deepcopy(v) for k,v in frame.items() if k not in ADDED}
    for name,extra in EXTRA.items():
        for row in out[name]:
            for key in extra: row.pop(key)
    return out


def validate_frame(frame):
    exact_keys(frame,FRAME_KEYS,'native sort frame')
    for name,(keys,hi) in TABLES.items():
        if type(frame[name]) is not list: raise ValueError(name+' list')
        for row in frame[name]: exact_keys(row,keys,name)
    previous.validate_frame(recursive_snapshot(frame))
    for person in frame['persons']:
        integer(person['rawDword54'],'person raw+54',0,0xffffffff)
    for force in frame['forces']:
        for key in ('raw40','titleId'): integer(force[key],key,-2**31,2**31-1)
        # Two raw dwords permit exact source-specific bit addressing, including
        # the S2 36..63 extension; JSON integers stay below the safe limit.
        bits=force['techniqueBits']
        if type(bits) is not list or len(bits)!=2: raise ValueError('two technique dwords')
        for value in bits: integer(value,'technique dword',0,0xffffffff)
    for name,(keys,hi) in ADDED.items():
        seen=set()
        for row in frame[name]:
            integer(row['id'],name+' ID',0,hi);boolean(row['valid'],name+' validity')
            if not row['valid']: raise ValueError('canonical '+name+' slots are type-valid')
            integer(row['capacityWord'],name+' capacity word',0,65535)
            if row['id'] in seen: raise ValueError('duplicate '+name+' ID')
            seen.add(row['id'])
            if type(row['data']) is not dict: raise ValueError('row data object')
            _json(row['data'],'row data')


def frame_domain(frame):
    def keys(value):
        return {k:keys(v) for k,v in value.items()} if type(value) is dict else None
    return (previous.frame_domain(frame) |
            {name:{r['id']:keys(r['data']) for r in frame[name]} for name in ADDED})
