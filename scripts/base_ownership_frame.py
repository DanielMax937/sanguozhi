"""P0-66 explicitly versioned city flag storage, with legacy frames unchanged.

The generic building and canonical city subtype remain distinct objects. A4 is
stored as an unsigned dword only to preserve all unmodified bits around dword
writes; no unproven meaning is assigned to its other bits.
"""
from __future__ import annotations
import copy
from capture_transaction_profile import exact_keys, integer
import empty_legion_frame as previous

FRAME_PROFILE_ID = 'source-idb-S1-S2-base-ownership-frame-v1'
TABLES = {name:(keys | ({'rawFlagsA4'} if name=='cities' else {'durabilityWord','subtypeMaxDurabilityWord'} if name=='buildings' else set()), high)
          for name,(keys,high) in previous.TABLES.items()}
FRAME_KEYS = previous.FRAME_KEYS


def empty_snapshot(frame):
    out=copy.deepcopy(frame)
    for city in out['cities']: city.pop('rawFlagsA4')
    for building in out['buildings']:
        building.pop('durabilityWord');building.pop('subtypeMaxDurabilityWord')
    return out


def validate_frame(frame):
    exact_keys(frame,FRAME_KEYS,'base ownership frame')
    for name,(keys,_) in TABLES.items():
        if type(frame[name]) is not list: raise ValueError(name+' list')
        for record in frame[name]: exact_keys(record,keys,name)
    previous.validate_frame(empty_snapshot(frame))
    for city in frame['cities']:
        integer(city['rawFlagsA4'],'city rawFlagsA4',0,0xffffffff)
    for building in frame['buildings']:
        for k in ('durabilityWord','subtypeMaxDurabilityWord'):
            integer(building[k],k,0,65535)


def frame_domain(frame):
    return previous.frame_domain(frame)
