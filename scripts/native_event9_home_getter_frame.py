"""Versioned home getter using the inherited exact raw storage domain.

Person homeBaseId is the signed DWORD at person+98, already represented by the
source-pinned relocation frame. It is not force+98 and receives no new range gate.
"""
from __future__ import annotations
import native_event9_troop_reset_frame as previous

FRAME_PROFILE_ID = 'source-idb-S1-S2-native-event9-home-getter-frame-v1'
FRAME_KEYS = previous.FRAME_KEYS
FORCE_KEYS = previous.FORCE_KEYS


def validate_frame(frame):
    previous.validate_frame(frame)


def frame_domain(frame):
    return previous.frame_domain(frame)
