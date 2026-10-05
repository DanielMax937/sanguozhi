"""Source-local relocation and fixed (-1, 0) movement preparation.

One live frame; pointer identities and native scalar locals survive callbacks.
Ruler capture, wider cancellation bodies, troop membership and non-base position
reads remain exact-call observations. No guessed callback or coordinate defaults.
"""
from __future__ import annotations
from capture_transaction_profile import exact_keys, integer, boolean
from mission_cancellation_v2_profile import HANDLERS
from return_mission_lifecycle_profile import city_distance
from officer_relocation_tables import TERRITORY_BASE_TABLES

I32_MIN, I32_MAX = -2**31, 2**31-1


class OfficerRelocationPrimitives:
    def boundary(self, kind, helper, **args):
        if helper == '004A8270':
            # The copied roster index belongs to the enclosing merge caller,
            # not to 004A8270's native arguments. Preserve it in a saved scope.
            with self.scope('004BD3B0/relocation-call', copiedIndex=args['copiedIndex'],
                            savedDestinationHomeId=args['targetBuildingId']):
                return self.relocate_officer(args['personId'], args['targetBuildingId'])
        return super().boundary(kind, helper, **args)

    def cancel_mission(self, pid):
        """004A57B0 -> 005B9B40, without any event predicate dispatch."""
        with self.actor(pid), self.scope('004A57B0', personId=pid):
            p = self.person()
            self.step('004A57B0/allocated', personId=pid, passed=p['allocated'])
            if not p['allocated']: return 0
            mission = p['missionId']
            self.step('004A57B0/mission-range', missionId=mission, passed=0 <= mission <= 43)
            # The wrapper exits with the just-loaded mission in EAX.
            if not 0 <= mission <= 43: return mission
            # Dispatcher captures the live mission independently; no callback
            # intervenes, but the captured command is retained through its body.
            captured = self.person()['missionId']
            words = [-1, 0, 0]
            with self.scope('005B9B40', personId=pid, capturedMissionId=captured,
                            cancelEventWords=words):
                if captured == 37:
                    self.step('005B9B40/return', returnValue=0, mission37Skip=True)
                    return 0
                handler = HANDLERS[captured]
                self.step('005B9B40/registry', capturedMissionId=captured, handler=handler,
                          cancelEventWords=words, predicateChecked=False)
                with self.scope(handler, personId=pid, capturedMissionId=captured):
                    if handler == '00441880':
                        result = 0
                        self.step('00441880', returnValue=0, emptyStub=True)
                    elif captured in (23, 24):
                        result = self.handler_primitive(captured)
                    else:
                        result = self.boundary('effect-query', handler, personId=pid,
                                               capturedMissionId=captured, cancelEventWords=words)
                        integer(result, 'cancel handler signed result', I32_MIN, I32_MAX)
                self.step('005B9B40/return', returnValue=result, handlerReturnIgnoredByRelocation=True)
                return result

    def _relocation_troop_member(self, pid):
        location = self.slot('persons', pid)['locationId']
        result = False
        if 87 <= location <= 1086:
            result = self.boundary('query', '004891C0', personId=pid, locationId=location)
            boolean(result, 'actual troop membership')
        self.step('004891C0/result', personId=pid, locationId=location, actualTroopMember=result)
        return result

    def movement_origin(self, pid):
        """004A6340 + 0047A950, leaving virtual3C as a read-only boundary."""
        with self.scope('004A6340', personId=pid):
            passed = self.valid('persons', pid)
            self.step('004A6340/valid', passed=passed)
            if not passed: return -1
            location = self.slot('persons', pid)['locationId']
            if 0 <= location <= 86:
                self.step('004A6340/base-origin', result=location, buildingValidityRead=False)
                return location
            with self.scope('0047A950', personId=pid):
                position = self.boundary('query', '00489610/virtual+3C',
                                         personId=pid, rawLocationId=location)
                exact_keys(position, {'positionX', 'positionY'}, 'person position observation')
                for key in position: integer(position[key], key, -32768, 32767)
                x, y = position['positionX'], position['positionY']
                bounded = 0 <= x < 200 and 0 <= y < 200
                self.step('0047A950/coordinates', positionX=x, positionY=y, passed=bounded)
                if not bounded: return -1
                linear = 200*x + y
                raw = self.slot('mapCells', linear)['rawTerritoryDword']
                territory = (raw >> 5) & 127
                signed = TERRITORY_BASE_TABLES[self.source][territory]
                # Signed x86 NEG; overflow remains negative for INT_MIN.
                base = signed if signed >= 0 else ((-signed + 2**31) % 2**32) - 2**31
                self.step('00483B00', mapIndex=linear, rawTerritoryDword=raw,
                          territoryIndex=territory, signedTableEntry=signed,
                          acceptNegative=1, result=base)
                result = base if 0 <= base <= 86 else -1
                self.step('0047A950/result', result=result)
                return result

    def movement_distance(self, origin, target):
        with self.scope('0049E4D0', originBuildingId=origin, targetBuildingId=target):
            first = self.territory(origin)
            self.save(savedOriginTerritoryId=first)
            second = self.territory(target)
            result = city_distance(self.source, first, second) if 0 <= first <= 41 and 0 <= second <= 41 else -1
            self.step('0047B480', originCityId=first, targetCityId=second, result=result)
            return result

    def prepare_movement(self, personId, targetBuildingId):
        """Only 004A7990(person, destination, -1, 0), not the fourth!=0 path."""
        pid, target = personId, targetBuildingId
        with self.actor(pid), self.scope('004A7990', personId=pid, targetBuildingId=target,
                                        thirdArgument=-1, fourthArgument=0):
            valid = self.valid('persons', pid)
            self.step('004A7990/person-valid', passed=valid)
            if not valid: return -1
            valid = self.valid('buildings', target)
            self.step('004A7990/target-valid', passed=valid)
            if not valid: return -1
            origin = self.movement_origin(pid)
            self.save(savedOriginId=origin)
            distance = 1
            if 0 <= origin <= 16383:
                self.slot('buildings', origin)
                distance = self.movement_distance(origin, target)
            self.save(savedDistance=distance)
            self.acted(wrapper=False)
            # Direct0048A8B0, not the validity-gated004A5660 wrapper.
            self.person()['missionDuration'] = distance & 255
            self.step('0048A8B0', value=distance & 255, rawInput=distance, validityRechecked=False)
            force = self.force_of(pid)
            self.save(savedPersonForceId=force)
            self.step('004A7A75/force-range', forceId=force, passed=0 <= force <= 46,
                      forceObjectValidityRead=False)
            if 0 <= force <= 46:
                location = self.person()['locationId']
                current = location if 0 <= location <= 86 else -1
                self.slot('buildings', current)
                saved_current = None
                if self.valid('buildings', current):
                    if self.target_force(current, 'movement-current') == force:
                        saved_current = current
                        self.save(savedCurrentBuildingId=saved_current)
                        self.governor(current)
                self.save(savedCurrentBuildingId=saved_current)
                home = self.person()['homeBaseId']
                home_pointer = self._role_building_pointer(home)
                self.save(savedRefreshHomeId=home_pointer)
                if self._role_valid_pointer('buildings', home_pointer) and home_pointer != saved_current:
                    self.governor(home_pointer)
            result = origin if 0 <= origin <= 86 else -1
            self.step('004A7990/return', returnValue=result, actualLocationWritten=False)
            return result

    def relocate_officer(self, personId, targetBuildingId):
        pid, target = personId, targetBuildingId
        with self.actor(pid), self.scope('004A8270', personId=pid, targetBuildingId=target):
            valid = self.valid('persons', pid)
            self.step('004A8270/person-valid', passed=valid)
            if not valid: return
            valid = self.valid('buildings', target)
            self.step('004A8270/target-valid', passed=valid)
            if not valid: return
            old_raw = self.person()['homeBaseId']
            old_home = self._role_building_pointer(old_raw)
            compared_home = self.person()['homeBaseId']
            self.save(savedOldRawHomeId=old_raw, savedOldHomeId=old_home,
                      comparedHomeId=compared_home)
            self.step('00491770', buildingId=target, result=target, caller='004A82C5')
            if compared_home != target:
                # 82DB and82EA jump over the governor clear, not just demotion.
                if self.person()['status'] == 2 and old_raw != target:
                    with self.scope('004A5AF0', personId=pid, requestedStatus=3):
                        allocated = self.person()['allocated']
                        self.step('004A5AF0/allocated', passed=allocated)
                        if allocated: self._role_status(pid, 3)
                    if self._role_valid_pointer('buildings', old_home):
                        governor = self.governor_id(old_home)
                        self.step('00486890/relocation-old', buildingId=old_home,
                                  governorId=governor, comparedPersonId=pid)
                        if governor == pid: self.set_governor(old_home, None)
                ruler = self.person()['status'] == 0
                self.step('00488C00', status=self.person()['status'], result=ruler)
                if ruler:
                    raw_legion = self.person()['rawLegionId']
                    legion = raw_legion if self.slot('legions', raw_legion) is not None else None
                    self.save(savedRequestedLegionId=legion)
                    result = self.boundary('effect-query', '004B40C0', buildingId=target,
                                           requestedLegionId=legion, nativeArgument=0)
                    integer(result, 'ruler transfer signed result', I32_MIN, I32_MAX)
                    self.step('004B40C0/return-ignored', returnValue=result)
                else:
                    requested = self.base_legion(target)
                    self.set_legion(pid, requested)
                self.step('00491770', buildingId=target, result=target, caller='004A836D')
                self.set_home(pid, target)
            if self._relocation_troop_member(pid): return
            location = self.person()['locationId']
            normalized = location if 0 <= location <= 86 else -1
            home = self.person()['homeBaseId']
            self.save(savedPostTransferHomeId=home, savedNormalizedLocationId=normalized)
            if normalized != home:
                valid = self.person()['valid']
                self.step('004A83A7/valid', passed=valid)
                if valid:
                    self.cancel_mission(pid)
                    # No allocation/validity recheck after a cancellation effect.
                    self.person()['missionId'] = 37
                    self.person()['missionArgs'] = [0]*5
                    self.step('00489BD0', missionId=37, missionArgs=[0]*5)
                    self.acted(wrapper=False)
                    self.active()
                result = self.prepare_movement(pid, target)
                self.step('004A83EA/return-ignored', returnValue=result)
                return
            allocated = self.person()['allocated']
            self.step('004A5780/allocated', passed=allocated)
            if allocated:
                self.person()['missionId'] = -1
                self.person()['missionArgs'] = [0]*5
                self.step('00489BD0', missionId=-1, missionArgs=[0]*5)
            self.duration(0)
            self.acted(wrapper=True)
            status = self.person()['status']
            self.step('00488C70', status=status, result=status == 5)
            if status != 5:
                target_home = home if self.slot('buildings', home) is not None else -1
                self.officer_return(pid, target_home, 0, 1)
