"""004BA44C..45E live troop home getter and numeric building pointer.

00495520 calls the saved troop's current virtual08 directly. Unknown dispatch
retains a whole-frame/RNG effect query. The subsequent person is canonical in this
version. 00490D00 constructs a pointer without reading building storage/validity.
The complete reaction45E..46C remains one opaque effect or atomic rejection.
"""
from __future__ import annotations
import copy
from native_troop_membership_primitives import CANONICAL_TROOP_VTABLE
from native_event9_selection_primitives import ptr
from recursive_return_frame import person_predicates

CANONICAL_OBJECT_MANAGER = 0x07201958


class NativeEvent9HomeGetterPrimitives:
    def boundary(self, kind, helper, **args):
        if kind == 'effect' and helper == '004BA44C/event9-reaction-remainder':
            return self.event9_home_getter(args)
        return super().boundary(kind, helper, **args)

    def event9_troop_home(self, troop):
        with self.scope('00495520', troopPointer=troop, site='004BA44E'):
            #00495521 saves the caller's troop; 523 dereferences its live vtable.
            #There is no0047A630 null/probe wrapper before direct virtual08.
            current = self.slot('troops', troop['id'])
            self.step('00495525/direct-troop-validity-call', troopPointer=troop,
                      vtableAddress=current['vtableAddress'], virtualSlot=8,
                      wrapperCalled=False)
            if current['vtableAddress'] == CANONICAL_TROOP_VTABLE:
                passed = self.native_troop_valid(troop['id'])
            else:
                passed = self.event9_unknown_virtual(troop, 8, '00495525')
            self.step('00495528/troop-home-validity', troopPointer=troop,
                      passed=passed)
            if not passed:
                self.step('00495551/home-result', homeBaseId=-1,
                          returnedSentinel=True)
                return -1
            #The callback may replace all mutable storage. Re-read the leader
            #from the same saved troop, then retain the resolved person identity.
            leader = self.slot('troops', troop['id'])['leaderId']
            person = ptr('persons', leader) if 0 <= leader <= 1099 else None
            self.save(savedHomePersonPointer=person)
            self.step('00490B00/home-person-pointer', rawLeaderId=leader,
                      personPointer=person, managerIdentity=CANONICAL_OBJECT_MANAGER,
                      fieldsRead=False)
            valid = False
            if person is not None:
                valid = person_predicates(self.slot('persons', person['id']))[1]
            self.step('0047A630/home-person-validity', personPointer=person,
                      passed=valid, site='0049553D')
            if not valid:
                self.step('00495551/home-result', homeBaseId=-1,
                          returnedSentinel=True)
                return -1
            #00495549 reads the saved person's current DWORD. This frame version
            #has canonical person dispatch only, so no invented person callback.
            home = self.slot('persons', person['id'])['homeBaseId']
            self.step('00495549/home-result', personPointer=person,
                      homeBaseId=home, byteOffset=0x98, byteWidth=4,
                      signedStorage=True)
            return home

    def event9_home_getter(self, args):
        troop = copy.deepcopy(args['troopPointer'])
        self.step('004BA44E/home-getter-call', troopPointer=troop,
                  managerIdentity=args['managerIdentity'], callerEsiPreserved=True)
        home = self.event9_troop_home(troop)
        #004BA453 pushes the returned scalar;459 calls numeric00490D00. Only
        #signed0..16383 constructs a canonical pointer; absent/invalid building
        #storage is irrelevant until a later effect actually reaches that row.
        building = ptr('buildings', home) if 0 <= home <= 16383 else None
        self.step('00490D00/home-building-pointer', homeBaseId=home,
                  buildingPointer=building, managerIdentity=CANONICAL_OBJECT_MANAGER,
                  stride=0x38, storageOffset=0x89730, fieldsRead=False,
                  validityRead=False)
        self.step('004BA45E/home-getter-continuation', troopPointer=troop,
                  savedForcePointer=copy.deepcopy(args['savedForcePointer']),
                  managerIdentity=args['managerIdentity'], homeBaseId=home,
                  homeBuildingPointer=building,
                  eventMemoryDomain=self.policy['event9EventMemoryDomain'],
                  parameterStackNetBytes=0, reactionRemainderObserved=True)
        bound = dict(copy.deepcopy(args), homeBaseId=home,
                     homeBuildingPointer=copy.deepcopy(building),
                     homeResolverManagerIdentity=CANONICAL_OBJECT_MANAGER,
                     reactionCall=dict(helper='004AD220', site='004BA467',
                         incomingEcx=0x0799895C,
                         argumentOrder=[copy.deepcopy(troop), 4, copy.deepcopy(building)],
                         pushOrder=[copy.deepcopy(building), 4, copy.deepcopy(troop)]))
        self.boundary('effect', '004BA45E/event9-reaction-remainder', **bound)
