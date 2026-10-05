"""Explicit force raw+94 DWORD and raw+98 byte storage for the reset version.

Unsigned bit-pattern storage preserves every possible preexisting DWORD. The
general setter's accepted input range does not restrict existing memory. No
capture, surrender, alliance or other game meaning is inferred from these names.
"""
from __future__ import annotations
import copy
from capture_transaction_profile import exact_keys, integer
import native_event9_presentation_frame as previous

FRAME_PROFILE_ID = 'source-idb-S1-S2-native-event9-force-reset-frame-v1'
FRAME_KEYS = previous.FRAME_KEYS
FORCE_KEYS = previous.FORCE_KEYS | {'rawDword94', 'rawByte98'}


def presentation_snapshot(frame):
    """Detached predecessor validation view; execution retains the raw fields."""
    out = copy.deepcopy(frame)
    for row in out['forces']:
        row.pop('rawDword94')
        row.pop('rawByte98')
    return out


def validate_frame(frame):
    exact_keys(frame, FRAME_KEYS, 'event9 force reset frame')
    if type(frame['forces']) is not list:
        raise ValueError('forces list required')
    for row in frame['forces']:
        exact_keys(row, FORCE_KEYS, 'event9 force reset raw storage')
        integer(row['rawDword94'], 'force raw DWORD94', 0, 0xffffffff)
        integer(row['rawByte98'], 'force raw byte98', 0, 0xff)
    previous.validate_frame(presentation_snapshot(frame))


def frame_domain(frame):
    return previous.frame_domain(frame)
