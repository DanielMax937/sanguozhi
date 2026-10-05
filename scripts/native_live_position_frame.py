"""Versioned live signed16 coordinates and explicit mutable06EE794C storage.

No default or IDB snapshot value exists. Detached predecessor views validate
shared fields only; every execution/callback retains this complete live frame.
"""
from __future__ import annotations
import copy
from capture_transaction_profile import exact_keys, integer
import native_troop_membership_frame as previous

FRAME_PROFILE_ID = 'source-idb-S1-S2-native-live-position-frame-v1'
POSITION_KEYS = {'positionX', 'positionY'}
FALLBACK_KEY = 'fallbackPosition06EE794C'
TROOP_KEYS = previous.TROOP_KEYS | POSITION_KEYS
TABLES = previous.TABLES | {'troops': (TROOP_KEYS, 999)}
FRAME_KEYS = previous.FRAME_KEYS | {FALLBACK_KEY}


def membership_snapshot(frame):
    """Detached validation-only view, never a mutable callback frame."""
    out = {k: copy.deepcopy(v) for k, v in frame.items() if k != FALLBACK_KEY}
    for row in out['troops']:
        for key in POSITION_KEYS:
            row.pop(key)
    return out


def validate_position(value):
    exact_keys(value, POSITION_KEYS, 'explicit signed16 position')
    for key in POSITION_KEYS:
        integer(value[key], key, -32768, 32767)


def validate_frame(frame):
    exact_keys(frame, FRAME_KEYS, 'native live position frame')
    if type(frame['troops']) is not list:
        raise ValueError('troops list required')
    for row in frame['troops']:
        exact_keys(row, TROOP_KEYS, 'live positioned troop')
        validate_position({k: row[k] for k in POSITION_KEYS})
    validate_position(frame[FALLBACK_KEY])
    previous.validate_frame(membership_snapshot(frame))


def frame_domain(frame):
    return previous.frame_domain(frame) | {FALLBACK_KEY: None}
