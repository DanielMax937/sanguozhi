"""Versioned live event9 list/target fields; no implicit defaults or upgrades.

Manager slot domains remain fixed. Heap node identities may be added, removed,
reused or relinked only through an explicit whole-frame boundary observation.
Validation does not prewalk the list, cache troop IDs, or forbid observed cycles.
"""
from __future__ import annotations
import copy
from capture_transaction_profile import exact_keys, integer, boolean
import native_live_position_frame as previous

FRAME_PROFILE_ID = 'source-idb-S1-S2-native-event9-selection-frame-v1'
EXTRA_TROOP_KEYS = {'raw44', 'rawOrder2C', 'rawTarget30', 'rawTargetType34', 'targetPosition38'}
TROOP_KEYS = previous.TROOP_KEYS | EXTRA_TROOP_KEYS
NODE_KEYS = {'id', 'nextNodeId', 'troopId', 'readable', 'writable'}
ADDED_KEYS = {'troopListHead', 'troopListNodes'}
FRAME_KEYS = previous.FRAME_KEYS | ADDED_KEYS


def position_snapshot(frame):
    """Detached validation view only; execution retains the complete frame."""
    out = {k: copy.deepcopy(v) for k, v in frame.items() if k not in ADDED_KEYS}
    for row in out['troops']:
        for key in EXTRA_TROOP_KEYS:
            row.pop(key)
    return out


def node_pointer(value):
    if value is not None:
        integer(value, 'non-null node identity', 1, 0xffffffff)


def validate_frame(frame):
    exact_keys(frame, FRAME_KEYS, 'event9 selection frame')
    if type(frame['troops']) is not list:
        raise ValueError('troops list required')
    for row in frame['troops']:
        exact_keys(row, TROOP_KEYS, 'event9 live troop')
        for key in ('raw44', 'rawOrder2C', 'rawTargetType34'):
            integer(row[key], key, -2**31, 2**31-1)
        integer(row['rawTarget30'], 'troop target signed16', -32768, 32767)
        previous.validate_position(row['targetPosition38'])
    previous.validate_frame(position_snapshot(frame))
    node_pointer(frame['troopListHead'])
    if type(frame['troopListNodes']) is not list:
        raise ValueError('live heap nodes required')
    seen = set()
    for node in frame['troopListNodes']:
        exact_keys(node, NODE_KEYS, 'troop list node')
        integer(node['id'], 'node identity', 1, 0xffffffff)
        if node['id'] in seen:
            raise ValueError('duplicate node identity')
        seen.add(node['id'])
        node_pointer(node['nextNodeId'])
        if node['troopId'] is not None:
            integer(node['troopId'], 'node canonical troop pointer', 0, 999)
        boolean(node['readable'], 'node12-byte read probe result')
        boolean(node['writable'], 'node12-byte write probe result')


def frame_domain(frame):
    # Heap allocation/liveness is observed mutable state, unlike fixed manager
    # slot identity. Missing reached nodes remain errors, never native invalidity.
    return previous.frame_domain(frame) | {'troopListHead': None, 'troopListNodes': None}
