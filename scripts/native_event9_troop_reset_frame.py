"""Versioned saved-troop reset frame with the predecessor's exact raw storage.

Troop raw44 already represents every signed32 bit pattern. The event9 direct
DWORD write of0xFFFFFFFF is therefore -1, not the unsigned force rawDword94
representation. No aliases, default conversion, or new game meaning are added.
"""
from __future__ import annotations
import native_event9_force_reset_frame as previous
from native_event9_selection_frame import TROOP_KEYS

FRAME_PROFILE_ID = 'source-idb-S1-S2-native-event9-troop-reset-frame-v1'
FRAME_KEYS = previous.FRAME_KEYS
FORCE_KEYS = previous.FORCE_KEYS


def validate_frame(frame):
    previous.validate_frame(frame)


def frame_domain(frame):
    return previous.frame_domain(frame)
