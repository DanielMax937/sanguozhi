"""004891C0 canonical live troop membership with explicit unknown-vtable fallback.

Getters construct canonical pointer identities before later field reads. A
missing in-range observed row is insufficient evidence, not native invalidity.
No callback occurs inside the pinned canonical helper/validity chain; lookups
still resolve this owner's live frame after any enclosing mutable callback.
"""
from __future__ import annotations
from capture_transaction_profile import boolean
from recursive_return_frame import person_predicates

CANONICAL_TROOP_VTABLE = 0x0079CC18


class NativeTroopMembershipPrimitives:
    def boundary(self, kind, helper, **args):
        if kind == 'query' and helper == '004891C0':
            return self.troop_member(args['personId'])
        return super().boundary(kind, helper, **args)

    def slot(self, name, rid):
        if name != 'troops':
            return super().slot(name, rid)
        if not 0 <= rid <= 999:
            return None
        row = self.row(name, rid)
        if row is None:
            raise ValueError('missing observed troops slot ' + str(rid))
        return row

    def native_troop_valid(self, tid):
        with self.scope('00496040', troopId=tid):
            # Canonical0079CC18+24=00468E60 returns11. An unknown vtable
            # never enters this path; no arbitrary virtual dispatch is invented.
            self.step('00468E60', troopId=tid, virtualSlot=0x24, nativeType=11)
            leader = self.slot('troops', tid)['leaderId']
            pointer = leader if 0 <= leader <= 1099 else None
            self.save(savedLeaderPersonId=pointer)
            self.step('00490B00/troop-leader', rawLeaderId=leader,
                      personId=pointer, fieldsRead=False)
            #00490B00 itself constructs a pointer only.0047A630 dereferences
            # it through canonical person+08; null is invalid without a read.
            passed = False
            if pointer is not None:
                person = self.slot('persons', pointer)
                passed = person_predicates(person)[1]
            self.step('0047A630/troop-leader', personId=pointer, passed=passed)
            if not passed:
                return False
            for index in range(2):
                value = self.slot('troops', tid)['deputyIds'][index]
                passed = value < 1100  # Signed JGE; all negative sentinels pass.
                self.step('00496040/deputy-upper-bound', troopId=tid,
                          deputyIndex=index, rawDeputyId=value, passed=passed,
                          deputyPersonRead=False)
                if not passed:
                    return False
            return True

    def troop_member(self, pid):
        with self.scope('004891C0', personId=pid):
            location = self.slot('persons', pid)['locationId']
            bounded = 87 <= location <= 1086
            self.step('004891C0/location', personId=pid, locationId=location, passed=bounded)
            if not bounded:
                return False
            tid = location - 87
            self.save(savedTroopId=tid)
            self.step('00490E70', troopId=tid, fieldsRead=False)
            troop = self.slot('troops', tid)
            if troop['vtableAddress'] != CANONICAL_TROOP_VTABLE:
                # Keep the whole unresolved helper as an explicitly bound
                # read-only query. Do not infer false, type or member fields.
                result = super().boundary('query', '004891C0', personId=pid,
                                          locationId=location)
                boolean(result, 'observed noncanonical troop membership')
                return result
            passed = self.native_troop_valid(tid)
            self.step('0047A630/troop', troopId=tid, passed=passed)
            if not passed:
                return False
            # Canonical aligned manager person pointer, under the inherited
            # successful equal-thread-probe domain, maps back to the same ID.
            self.step('00491310', personId=pid, canonicalPointer=True, result=pid)
            leader = self.slot('troops', tid)['leaderId']
            member = leader == pid
            self.step('00495390/leader', troopId=tid, personId=pid,
                      rawLeaderId=leader, matched=member)
            if member:
                return True
            for index in range(2):
                deputy = self.slot('troops', tid)['deputyIds'][index]
                member = deputy == pid
                self.step('00495340/deputy', troopId=tid, personId=pid,
                          deputyIndex=index, rawDeputyId=deputy, matched=member)
                if member:
                    return True
            return False
