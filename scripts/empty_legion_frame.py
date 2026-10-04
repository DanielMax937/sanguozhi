"""P0-65 canonical legion scalar storage, with explicit little-endian aliases.

Only +04..+2F is represented as raw bytes. The fixed source vtable and successful
list/allocator domain remain explicit; native pointers are not invented. Existing
frames are not upgraded implicitly, and callbacks must provide all new fields.
"""
from __future__ import annotations
import copy
import re
from capture_transaction_profile import exact_keys
import return_route_frame as previous

FRAME_PROFILE_ID = 'source-idb-S1-S2-empty-legion-frame-v1'
TABLES = {n:(keys | ({'rawScalarHex'} if n=='legions' else set()),hi)
          for n,(keys,hi) in previous.TABLES.items()}
FRAME_KEYS = previous.FRAME_KEYS
ALIASES = {'forceId':4,'number':8,'leaderId':12}


def route_snapshot(frame):
    out=copy.deepcopy(frame)
    for legion in out['legions']: legion.pop('rawScalarHex')
    return out


def scalar_value(legion,offset,width=4,signed=False):
    raw=bytes.fromhex(legion['rawScalarHex'])
    return int.from_bytes(raw[offset-4:offset-4+width],'little',signed=signed)


def store_scalar(legion,offset,width,value):
    raw=bytearray.fromhex(legion['rawScalarHex'])
    raw[offset-4:offset-4+width]=(value & ((1<<(width*8))-1)).to_bytes(width,'little')
    legion['rawScalarHex']=raw.hex()
    for field,address in ALIASES.items():
        legion[field]=scalar_value(legion,address,4,True)
    legion['valid']=0<=legion['forceId']<=46


def validate_frame(frame):
    exact_keys(frame,FRAME_KEYS,'empty legion frame')
    for name,(keys,_) in TABLES.items():
        if type(frame[name]) is not list: raise ValueError(name+' list')
        for record in frame[name]: exact_keys(record,keys,name)
    previous.validate_frame(route_snapshot(frame))
    # Fixed city vtable0079BF58: +04 forwards to+08, whose type check calls
    # +24=0047B110 (constant6). All42 canonical city subtype slots therefore
    # exist and are type-valid, regardless of their generic building validity
    # or raw legion ownership. Missing/false city rows cannot stand for neutral.
    if {city['id'] for city in frame['cities']}!=set(range(42)):
        raise ValueError('all42 canonical city subtype slots required')
    if any(not city['valid'] for city in frame['cities']):
        raise ValueError('canonical city subtype slots are type-valid')
    if not set(range(87)) <= {b['id'] for b in frame['buildings']}:
        raise ValueError('all87 canonical base storage slots required')
    for building in frame['buildings']:
        if building['id']<=86 and not building['subtypeValid']:
            raise ValueError('canonical city gate port subtypes are type-valid')
        if building['valid']!=(0<=building['kind']<=63):
            raise ValueError('building valid must match canonical kind range getter')
    for legion in frame['legions']:
        raw=legion['rawScalarHex']
        if type(raw) is not str or re.fullmatch('[0-9a-f]{88}',raw) is None:
            raise ValueError('legion scalar storage must be 44 lowercase hex bytes')
        for field,address in ALIASES.items():
            if legion[field]!=scalar_value(legion,address,4,True):
                raise ValueError('legion raw scalar alias mismatch:'+field)


def frame_domain(frame):
    return previous.frame_domain(frame)
