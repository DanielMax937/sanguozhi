"""Versioned live force vtables for the bounded event9 presentation decision.

The inherited force.valid remains a canonical diagnostic, never the result of
an unknown virtual08. Event arguments and saved control-flow locals have an
explicit immutable protocol; temporary-message writes remain inside the combined
presentation observation. This is not a native memory-immutability claim.
"""
from __future__ import annotations
import copy
from capture_transaction_profile import exact_keys, integer
import native_event9_selection_frame as previous
from base_ownership_frame import TABLES as FORCE_TABLES

FRAME_PROFILE_ID = 'source-idb-S1-S2-native-event9-presentation-frame-v1'
FRAME_KEYS = previous.FRAME_KEYS
FORCE_KEYS = FORCE_TABLES['forces'][0] | {'vtableAddress'}


def selection_snapshot(frame):
    """Detached validation view only; execution retains all mutable fields."""
    out = copy.deepcopy(frame)
    for row in out['forces']:
        row.pop('vtableAddress')
    return out


def validate_frame(frame):
    exact_keys(frame, FRAME_KEYS, 'event9 presentation frame')
    if type(frame['forces']) is not list:
        raise ValueError('forces list required')
    for row in frame['forces']:
        exact_keys(row, FORCE_KEYS, 'event9 live force')
        integer(row['vtableAddress'], 'force raw vtable address', 0, 0xffffffff)
    previous.validate_frame(selection_snapshot(frame))


def frame_domain(frame):
    return previous.frame_domain(frame)
