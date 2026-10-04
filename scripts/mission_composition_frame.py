"""Versioned shared live-frame adapters for composed native-call projections.

These adapters invoke semantic primitives, never old transaction APIs/traces.
There is one frame owner. Every lookup resolves its CURRENT frame, including
after a mutable boundary replaces it. Legacy modules remain unchanged.
"""
from __future__ import annotations
import copy
import mission_event_listener_profile as listener_v1
import mission_notification_tail_profile as tail_v1

FRAME_PROFILE_ID = 'source-idb-S1-S2-live-mission-frame-v1'
TABLES = tail_v1.TABLES
validate_frame = tail_v1.validate_frame
frame_domain = tail_v1._domain


class SharedFrameAdapter:
    """Canonical slot reads; missing in-range slots are insufficient evidence."""
    def row(self, name, rid):
        return next((r for r in self.frame[name] if r['id'] == rid), None)

    def table(self, name):
        return {r['id']: r for r in self.frame[name]}

    def slot(self, name, rid):
        if not 0 <= rid <= TABLES[name][1]:
            return None
        row = self.row(name, rid)
        if row is None:
            raise ValueError('missing observed ' + name + ' slot ' + str(rid))
        return row

    def valid(self, name, rid):
        row = self.slot(name, rid)
        return row is not None and row['valid']

    def person(self):
        return self.slot('persons', self.pid)


class ListenerPrimitiveAdapter:
    # Predicate invokes no callbacks. Its reads and steps resolve this owner's
    # live frame rather than the old listener's smaller observation schema.
    predicate = listener_v1._Planner.predicate


class TailPrimitiveAdapter:
    # No old _Planner is instantiated, and no old revision/trace is committed.
    # These primitives call this owner's slot/step/boundary and may replace its
    # single frame. Native scalar locals inside return_zero/handler survive it.
    actor_force = tail_v1._Planner.actor_force
    notification = tail_v1._Planner.notification
    acted = tail_v1._Planner.acted
    active = tail_v1._Planner.active
    duration = tail_v1._Planner.duration
    return_zero_primitive = tail_v1._Planner.return_zero
    handler_primitive = tail_v1._Planner.handler


def listener_snapshot(frame):
    """Explicit read-only legacy-schema projection; never used as mutable state.

    Extra tail fields are intentionally absent. This is a diagnostic adapter,
    not a migration or a lossless replacement for the shared frame.
    """
    validate_frame(frame)
    result = {k: copy.deepcopy(frame[k]) for k in listener_v1.FRAME_KEYS}
    result['persons'] = [
        {k: copy.deepcopy(p[k]) for k in listener_v1.PERSON_KEYS}
        for p in frame['persons']
    ]
    listener_v1.validate_frame(result)
    return result


def tail_snapshot(frame):
    """Detached full shared-schema snapshot for diagnostic legacy validation."""
    validate_frame(frame)
    return copy.deepcopy(frame)
