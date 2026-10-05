"""004BA345..004BA411/432 decision with live virtual dispatch and saved locals.

Presentation411..432 and reaction432..46C are separate full-frame/RNG effects.
The constructor's temporary pointer never escapes or becomes an invented value.
"""
from __future__ import annotations
import copy
from native_troop_membership_primitives import CANONICAL_TROOP_VTABLE
from native_event9_selection_primitives import ptr

CANONICAL_FORCE_VTABLE = 0x0079C0E8


class NativeEvent9PresentationPrimitives:
    def slot(self, name, rid):
        row = super().slot(name, rid)
        if (name == 'forces' and row is not None
                and row['vtableAddress'] != CANONICAL_FORCE_VTABLE
                and not getattr(self, '_event9_force_dispatch', False)):
            # Older primitives have a canonical-force contract. Extending
            # dispatch here must not silently broaden their supported domain.
            self.defer('unsupported-noncanonical-force-outside-event9-presentation')
        return row

    def boundary(self, kind, helper, **args):
        if kind == 'effect' and helper == '004BA345/event9-reaction-suffix':
            return self.event9_presentation(args)
        return super().boundary(kind, helper, **args)

    def event9_force_row(self, address):
        previous = getattr(self, '_event9_force_dispatch', False)
        self._event9_force_dispatch = True
        try:
            return self.slot('forces', address['id'])
        finally:
            self._event9_force_dispatch = previous

    def event9_valid(self, address, site):
        if address is None or address['storage'] != 'forces':
            return super().event9_valid(address, site)
        row = self.event9_force_row(address)
        if row['vtableAddress'] != CANONICAL_FORCE_VTABLE:
            return self.event9_unknown_virtual(address, 8, site)
        # Canonical00480FD0 type(1) is true, and00480FF0 then reads+04.
        ruler = row['rulerId']
        passed = 0 <= ruler <= 1099
        self.step('00480FF0/event9-force-valid', forcePointer=address,
                  rulerId=ruler, passed=passed, site=site)
        return passed

    def event9_player(self, address, site):
        if address['storage'] == 'forces':
            row = self.event9_force_row(address)
            if row['vtableAddress'] != CANONICAL_FORCE_VTABLE:
                return self.event9_unknown_virtual(address, 0x48, site)
            player = row['playerIndex']
            passed = 0 <= player <= 7
            self.step('00480FA0/event9-player', forcePointer=address,
                      playerIndex=player, passed=passed, site=site)
            return passed
        tid = address['id']
        row = self.slot('troops', tid)
        if row['vtableAddress'] != CANONICAL_TROOP_VTABLE:
            return self.event9_unknown_virtual(address, 0x48, site)
        with self.scope('0047A690', troopId=tid, site=site):
            fid = self.event9_force(address, '0047A693')
            current = ptr('forces', fid) if 0 <= fid <= 46 else None
            self.save(savedCurrentForcePointer=current)
            self.step('00490AA0/event9-current-force', forceId=fid,
                      forcePointer=current, fieldsRead=False)
            if not self.event9_valid(current, '0047A6BC'):
                return False
            # Re-read the current force vtable after an unknown08 callback.
            return self.event9_player(current, '0047A6CC')

    def event9_presentation(self, args):
        force = ptr('forces', args['raw44'])
        self.save(savedForcePointer=force)
        self.step('004BA34B/saved-force', capturedRaw44=args['raw44'],
                  forcePointer=force, fieldsRead=False)
        enabled = self.event9_player(args['troopPointer'], '004BA356')
        if not enabled:
            if self.event9_valid(force, '004BA35E'):
                enabled = self.event9_player(force, '004BA372')
        self.step('004BA37D/presentation-gate', enabled=enabled,
                  savedForcePointer=force)
        bound = dict(copy.deepcopy(args), savedForcePointer=copy.deepcopy(force))
        if enabled:
            # Native37D/384 rereads the original event argument. This version
            # preserves the command event and saved control-flow locals; constructor
            # writes to the temporary object stay inside the combined observation.
            event_id = args['event']['id']
            self.step('004BA384/event-word', eventId=event_id,
                      eventMemoryDomain=self.policy['event9EventMemoryDomain'])
            if event_id != 9:
                self.defer('unsupported-event9-presentation-event-word')
            if self.event9_valid(args['targetPointer'], '004BA405'):
                self.boundary('effect', '004BA411/event9-presentation',
                    **bound, presentationArgs=dict(messageId=0x209c,
                        troopPointer=copy.deepcopy(args['troopPointer']),
                        targetPointer=copy.deepcopy(args['targetPointer']),
                        displayTroopPointer=copy.deepcopy(args['troopPointer']),
                        rawFlag=1, rawArgument=-1))
        # Saved EBX/ESI and caller cursor remain identities across either effect.
        self.boundary('effect', '004BA432/event9-reaction', **bound)
