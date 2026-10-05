"""004BA1D0 event9 selection through004BA345, with live saved-node traversal.

The reaction suffix remains an exact full-frame/RNG observation. Unknown virtual
calls are mutable effect queries. No callback may silently become false/pure;
all later reads resolve the current frame, while saved native locals survive.
"""
from __future__ import annotations
import copy
from capture_transaction_profile import boolean, integer
from native_troop_membership_primitives import CANONICAL_TROOP_VTABLE
from officer_relocation_tables import TERRITORY_BASE_TABLES


def ptr(storage, rid):
    return None if rid is None else dict(storage=storage, id=rid)


class NativeEvent9SelectionPrimitives:
    def boundary(self, kind, helper, **args):
        if kind == 'effect' and helper == '004BA1D0':
            return self.event9_selection(args['event'])
        return super().boundary(kind, helper, **args)

    def event9_unknown_virtual(self, address, slot, site):
        answer = self.boundary('effect-query', '004BA1D0/unknown-virtual',
                               pointer=copy.deepcopy(address), virtualSlot=slot,
                               site=site)
        if slot == 0x40:
            integer(answer, 'observed virtual force result', -2**31, 2**31-1)
        else:
            boolean(answer, 'observed virtual predicate result')
        return answer

    def event9_valid(self, address, site):
        if address is None:
            return False
        table, rid = address['storage'], address['id']
        row = self.slot(table, rid)
        if table != 'troops':
            return row['valid']
        if row['vtableAddress'] == CANONICAL_TROOP_VTABLE:
            return self.native_troop_valid(rid)
        return self.event9_unknown_virtual(address, 8, site)

    def event9_cast(self, address, site):
        if address is None:
            return None
        table, rid = address['storage'], address['id']
        row = self.slot(table, rid)  # The virtual type call dereferences storage.
        if table == 'troops' and row['vtableAddress'] != CANONICAL_TROOP_VTABLE:
            passed = self.event9_unknown_virtual(address, 0x2c, site)
        else:
            passed = table == 'buildings'
        self.step('00573470/event9-cast', pointer=address, passed=passed, site=site)
        return copy.deepcopy(address) if passed else None

    def event9_force(self, address, site):
        table, rid = address['storage'], address['id']
        if table == 'buildings':
            return self.target_force(rid, site)
        if table == 'persons':
            with self.scope('0047B2B0/event9-person', personId=rid, site=site):
                lid = self.slot('persons', rid)['rawLegionId']
                legion = self.slot('legions', lid)
                result = legion['forceId'] if legion is not None and legion['valid'] else -1
                self.step('0047B2B0/event9-result', legionId=lid, result=result)
                return result
        row = self.slot('troops', rid)
        if row['vtableAddress'] != CANONICAL_TROOP_VTABLE:
            return self.event9_unknown_virtual(address, 0x40, site)
        with self.scope('004955A0', troopId=rid, site=site):
            if not self.native_troop_valid(rid):
                return -1
            leader = self.slot('troops', rid)['leaderId']
            person = ptr('persons', leader) if 0 <= leader <= 1099 else None
            self.save(savedLeaderPointer=person)
            if not self.event9_valid(person, '004955BD'):
                return -1
            return self.event9_force(person, '004955CE')

    def event9_target(self, tid):
        with self.scope('00495CE0', troopId=tid):
            order = self.slot('troops', tid)['rawOrder2C']
            self.save(savedRawOrder2C=order)
            index = (order + 1) & 0xffffffff
            self.step('00495CE7/order', rawOrder2C=order, unsignedIndex=index)
            if index > 12 or order in (-1, 0, 11):
                return None
            site = ('00495D00' if order in (1, 3, 5, 10) else
                    '00495D98' if order == 6 else '00495D76' if order == 2 else
                    '00495D88' if order == 4 else '00495D57')
            if not self.event9_valid(ptr('troops', tid), site):
                return None
            target_type = 2 if order == 2 else 0
            if order in (1, 3, 5, 6, 10):
                target_type = self.slot('troops', tid)['rawTargetType34']
                self.step('00495CE0/target-type', rawTargetType34=target_type)
                if not 0 <= target_type <= 3:
                    return None
            if target_type == 2:
                #00495DEE loads the packed DWORD once. There are no x/y bounds
                # checks; only this model's represented allocation is guarded.
                pos = self.slot('troops', tid)['targetPosition38']
                x, y = pos['positionX'], pos['positionY']
                linear = 200*x + y
                self.save(savedTargetPosition38=dict(positionX=x, positionY=y))
                self.step('00495DEE/packed-position', positionX=x, positionY=y,
                          mapIndex=linear, singleDwordRead=True)
                if not 0 <= linear <= 39999:
                    self.defer('unsupported-event9-target-map-read-domain')
                raw = self.slot('mapCells', linear)['rawTerritoryDword']
                territory = (raw >> 5) & 127
                signed = TERRITORY_BASE_TABLES[self.source][territory]
                target = signed if signed >= 0 else -signed
                self.step('0047A5B0/event9', mapIndex=linear,
                          rawTerritoryDword=raw, territoryIndex=territory,
                          signedTableEntry=signed, acceptNegative=1, result=target)
                table, high = 'buildings', 16383
            else:
                target = self.slot('troops', tid)['rawTarget30']
                table, high = {0: ('buildings', 16383), 1: ('troops', 999),
                               3: ('persons', 1099)}[target_type]
            address = ptr(table, target) if 0 <= target <= high else None
            self.step('00495CE0/target-pointer', targetId=target,
                      targetPointer=address, fieldsRead=False)
            return address

    def event9_selection(self, event):
        with self.scope('004BA1D0', event=event, managerIdentity='entry-ecx'):
            if event['id'] != 9:
                self.step('004BA1D0', event=event, route='event-not9-no-op')
                return
            kind = {'building': 'buildings', 'person': 'persons', 'null': None}[event['subjectType']]
            subject = ptr(kind, event['subjectId']) if kind is not None else None
            subject = self.event9_cast(subject, '004BA278')
            cursor = self.frame['troopListHead']
            self.save(savedOldForceId=-1, savedNewForceId=-1,
                      savedSubjectPointer=subject, initialHeadNodeId=cursor)
            visit = 0
            while cursor is not None:
                if visit >= self.policy['event9NodeLimit']:
                    self.defer('engine-guard-event9-node-budget')
                with self.scope('004BA296/visit', visitIndex=visit, currentNodeId=cursor):
                    node = self.row('troopListNodes', cursor)
                    if node is None:
                        raise ValueError('missing observed troop list node ' + str(cursor))
                    if not node['readable'] or not node['writable']:
                        # Native failure returns list+1C WITHOUT advancing the
                        # cursor. That memory/platform path is unrepresented.
                        self.defer('unsupported-event9-list-node-probe')
                    next_cursor = node['nextNodeId']
                    troop = ptr('troops', node['troopId'])
                    self.save(savedNextNodeId=next_cursor, savedTroopPointer=troop)
                    self.step('004922C0/advance', currentNodeId=cursor,
                              savedNextNodeId=next_cursor, troopPointer=troop,
                              cursorWrittenBeforePayloadRead=True)
                    passed = self.event9_valid(troop, '004BA2A8')
                    self.step('0047A630/event9-troop', troopPointer=troop, passed=passed)
                    if passed:
                        tid = troop['id']
                        raw44 = self.slot('troops', tid)['raw44']
                        self.save(savedRaw44=raw44)
                        bounded = 0 <= raw44 <= 46
                        self.step('004BA2B8/raw44', troopId=tid, raw44=raw44, passed=bounded)
                        if bounded:
                            target = self.event9_target(tid)
                            target = self.event9_cast(target, '004BA2E3')
                            self.save(savedTargetPointer=target)
                            valid = self.event9_valid(target, '004BA2F1')
                            selected = not valid or target == subject
                            if not selected:
                                force = self.event9_force(target, '004BA307')
                                self.step('004BA30A/force', result=force, savedOldForceId=-1)
                                if force == -1:
                                    force = self.event9_force(troop, '004BA318')
                                    selected = force == -1
                                else:
                                    force = self.event9_force(target, '004BA323')
                                    self.step('004BA326/force', result=force, savedNewForceId=-1)
                                    if force == -1:
                                        force = self.event9_force(troop, '004BA338')
                                        selected = force == -1
                            self.step('004BA345/eligibility', troopPointer=troop,
                                      targetPointer=target, selected=selected)
                            if selected:
                                self.boundary('effect', '004BA345/event9-reaction-suffix',
                                    event=copy.deepcopy(event), troopPointer=troop,
                                    targetPointer=target, raw44=raw44,
                                    savedOldForceId=-1, savedNewForceId=-1,
                                    subjectPointer=subject, managerIdentity='entry-ecx',
                                    savedNextNodeId=next_cursor)
                    # Caller-stack cursor is outside mutable frame storage. It
                    # was saved before callbacks, not re-read from current.next.
                    self.step('004BA46C/saved-cursor', savedNextNodeId=next_cursor)
                    cursor = next_cursor
                visit += 1
