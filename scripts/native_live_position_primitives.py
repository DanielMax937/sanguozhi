"""Live00489610 pointer resolution, then one0047A950 packed-dword read.

Canonical helpers have no callbacks between pointer construction and read.
Unknown troop virtual dispatch is an explicit effect boundary and may replace
the complete frame. Returned identities re-resolve current storage, never a
cached coordinate value or stale row. Opaque memory requires its own observation.
"""
from __future__ import annotations
import copy
from capture_transaction_profile import exact_keys, integer
from native_troop_membership_primitives import CANONICAL_TROOP_VTABLE
from native_live_position_frame import FALLBACK_KEY, validate_position
from officer_relocation_tables import TERRITORY_BASE_TABLES

FALLBACK_ADDRESS = 0x06EE794C


def validate_pointer(pointer):
    if type(pointer) is not dict:
        raise ValueError('position pointer object required')
    storage = pointer.get('storage')
    if storage == 'unrepresented':
        exact_keys(pointer, {'storage', 'address'}, 'unrepresented position pointer')
        integer(pointer['address'], 'raw position pointer', 0, 0xffffffff)
    else:
        exact_keys(pointer, {'storage', 'id', 'byteOffset'}, 'represented position pointer')
        if storage == 'buildings':
            integer(pointer['id'], 'position building ID', 0, 16383)
            offset = 0x1e
        elif storage == 'troops':
            integer(pointer['id'], 'position troop ID', 0, 999)
            offset = 0x3c
        elif storage == FALLBACK_KEY:
            integer(pointer['id'], 'fallback address', FALLBACK_ADDRESS, FALLBACK_ADDRESS)
            offset = 0
        else:
            raise ValueError('unknown position storage')
        integer(pointer['byteOffset'], 'position field offset', offset, offset)


def pointer(storage, rid, offset):
    return dict(storage=storage, id=rid, byteOffset=offset)


class NativeLivePositionPrimitives:
    def position_pointer(self, pid):
        #00489610 itself does not require the actor's virtual validity.
        with self.scope('00489610', personId=pid):
            location = self.slot('persons', pid)['locationId']
            self.save(savedLocationId=location)
            bid = location if 0 <= location <= 86 else None
            self.save(savedBaseId=bid)
            self.step('00490D00/position', buildingId=bid, fieldsRead=False)
            passed = bid is not None and self.valid('buildings', bid)
            self.step('0047A630/position-base', buildingId=bid, passed=passed)
            if passed:
                result = pointer('buildings', bid, 0x1e)
                self.step('00487DC0', buildingId=bid, returnedPointer=result,
                          coordinateWordsRead=False)
                return result
            tid = location - 87 if 87 <= location <= 1086 else None
            self.save(savedTroopId=tid)
            self.step('00490E70/position', troopId=tid, fieldsRead=False)
            if tid is not None:
                row = self.slot('troops', tid)
                if row['vtableAddress'] != CANONICAL_TROOP_VTABLE:
                    # Remaining00489610 chain includes arbitrary validity and
                    # position methods: its possible writes are not ignored.
                    result = self.boundary('effect-query',
                        '00489610/unknown-troop-virtual', personId=pid,
                        savedLocationId=location, troopId=tid)
                    validate_pointer(result)
                    self.step('00489610/observed-pointer', returnedPointer=result)
                    return copy.deepcopy(result)
                passed = self.native_troop_valid(tid)
            else:
                passed = False
            self.step('0047A630/position-troop', troopId=tid, passed=passed)
            if passed:
                result = pointer('troops', tid, 0x3c)
                self.step('00496030', troopId=tid, returnedPointer=result,
                          coordinateWordsRead=False)
            else:
                result = pointer(FALLBACK_KEY, FALLBACK_ADDRESS, 0)
                self.step('00489683', returnedPointer=result,
                          coordinateWordsRead=False, fallbackDefaultAssumed=False)
            return result

    def read_position(self, address):
        validate_pointer(address)
        with self.scope('0047A956/position-read', savedPositionPointer=address):
            storage = address['storage']
            if storage == 'unrepresented':
                result = self.boundary('query', '0047A956/unrepresented-dword',
                                       positionPointer=address)
                validate_position(result)
                result = copy.deepcopy(result)
            else:
                current = (self.frame[FALLBACK_KEY] if storage == FALLBACK_KEY
                           else self.slot(storage, address['id']))
                # One native DWORD load captures both words before any other
                # read or modeled callback. Each field represents signed16.
                result = {k: current[k] for k in ('positionX', 'positionY')}
            packed = (result['positionX'] & 0xffff) | ((result['positionY'] & 0xffff) << 16)
            self.step('0047A956', positionPointer=address, packedDword=packed,
                      positionX=result['positionX'], positionY=result['positionY'],
                      singleDwordRead=True)
            return result

    def movement_origin(self, pid):
        with self.scope('004A6340', personId=pid):
            passed = self.valid('persons', pid)
            self.step('004A6340/valid', passed=passed)
            if not passed:
                return -1
            location = self.slot('persons', pid)['locationId']
            if 0 <= location <= 86:
                self.step('004A6340/base-origin', result=location,
                          buildingValidityRead=False)
                return location
            with self.scope('0047A950', personId=pid):
                address = self.position_pointer(pid)
                self.save(savedPositionPointer=address)
                position = self.read_position(address)
                x, y = position['positionX'], position['positionY']
                bounded = 0 <= x < 200 and 0 <= y < 200
                self.step('0047A950/coordinates', positionX=x, positionY=y, passed=bounded)
                if not bounded:
                    return -1
                linear = 200*x + y
                raw = self.slot('mapCells', linear)['rawTerritoryDword']
                territory = (raw >> 5) & 127
                signed = TERRITORY_BASE_TABLES[self.source][territory]
                base = signed if signed >= 0 else ((-signed + 2**31) % 2**32) - 2**31
                self.step('00483B00', mapIndex=linear, rawTerritoryDword=raw,
                          territoryIndex=territory, signedTableEntry=signed,
                          acceptNegative=1, result=base)
                result = base if 0 <= base <= 86 else -1
                self.step('0047A950/result', result=result)
                return result
