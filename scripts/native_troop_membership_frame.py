"""Versioned live canonical troop slots; no validity cache or implicit upgrade.

Each row represents one readable F4-stride manager slot. Its canonical vtable
identifies the pinned native type/validity methods; unknown vtables retain an
explicit observation boundary. Coordinates and mutable fallback position are
not represented or silently initialized by this frame.
"""
from __future__ import annotations
import copy
from capture_transaction_profile import exact_keys, integer
import base_ownership_frame as previous

FRAME_PROFILE_ID = 'source-idb-S1-S2-native-troop-membership-frame-v1'
TROOP_KEYS = {'id', 'vtableAddress', 'leaderId', 'deputyIds'}
TABLES = previous.TABLES | {'troops': (TROOP_KEYS, 999)}
FRAME_KEYS = previous.FRAME_KEYS | {'troops'}


def tail_distance_snapshot(frame):
    """Detached validation-only view, never used as a mutable callback frame."""
    return {key: copy.deepcopy(value) for key, value in frame.items() if key != 'troops'}


def validate_frame(frame):
    exact_keys(frame, FRAME_KEYS, 'native troop membership frame')
    previous.validate_frame(tail_distance_snapshot(frame))
    if type(frame['troops']) is not list:
        raise ValueError('troops list required')
    seen = set()
    for row in frame['troops']:
        exact_keys(row, TROOP_KEYS, 'troop slot')
        integer(row['id'], 'troop slot ID', 0, 999)
        if row['id'] in seen:
            raise ValueError('duplicate troop slot ID')
        seen.add(row['id'])
        integer(row['vtableAddress'], 'troop raw vtable address', 0, 0xffffffff)
        integer(row['leaderId'], 'troop raw leader+0C', -2**31, 2**31-1)
        if type(row['deputyIds']) is not list or len(row['deputyIds']) != 2:
            raise ValueError('exactly two raw troop deputy fields required')
        for value in row['deputyIds']:
            integer(value, 'troop raw deputy+10/+14', -2**31, 2**31-1)


def frame_domain(frame):
    return previous.frame_domain(frame) | {'troops': {r['id']: None for r in frame['troops']}}
