"""Bounded 004B40C0 entry and generic-building early return.

Only canonical fixed-array pointer identities and successful normal platform
execution are represented. The same entry manager is symbolic, not an invented
address. Canonical capture continues at an explicit mutable observation. Neither
this primitive nor its caller upgrades that observation into native execution.
"""
from __future__ import annotations
from capture_transaction_profile import integer

I32_MIN, I32_MAX = -2**31, 2**31-1
MANAGER_IDENTITY = 'entry-gameplay-manager'
CONTINUATION = '004B415D..004B4988'


class GenericFacilityPrimitives:
    def boundary(self, kind, helper, **args):
        if kind == 'effect-query' and helper == '004B40C0':
            return self.ruler_transfer(**args)
        return super().boundary(kind, helper, **args)

    def ruler_transfer(self, buildingId, requestedLegionId, nativeArgument):
        bid, requested = buildingId, requestedLegionId
        with self.scope('004B40C0', buildingId=bid,
                        requestedLegionId=requested, nativeArgument=nativeArgument,
                        managerIdentity=MANAGER_IDENTITY):
            # 0047A630 returns canonical 0/1. No prior game-state write occurs;
            # successful stack probing/cookie validation are domain constraints.
            passed = self.valid('buildings', bid)
            self.step('004B40FB/valid', buildingId=bid, passed=passed)
            if not passed:
                self.step('004B4988/normal-epilogue', returnValue=0,
                          stackBytes=0x192c, argumentBytes=12)
                return 0

            raw_old = self.base_legion(bid)
            old = raw_old if 0 <= raw_old <= 46 else None
            # 00490AD0 constructs a pointer; no field or validity read at the
            # referenced legion. The raw value below is diagnostic provenance,
            # not a native retained scalar. Only the pointer is saved at ESP+10.
            self.save(entryOldRawLegionId=raw_old, savedOldLegionId=old,
                      entryBuildingId=bid)
            self.step('004B4118/00490AD0', rawLegionId=raw_old,
                      pointerLegionId=old, targetFieldsRead=False,
                      targetValidityChecked=False)
            # Fixed, aligned array identity. Arbitrary pointers (including
            # misaligned pointers that native quotient arithmetic may accept)
            # are deliberately outside this version's represented domain.
            self.step('004B4127/00491770', buildingId=bid, result=bid,
                      genericBranch=87 <= bid <= 16383)
            if 87 <= bid <= 16383:
                converted = -1 if requested is None else requested
                self.step('004B4145/004912C0', pointerLegionId=requested,
                          result=converted, targetFieldsRead=False,
                          targetValidityChecked=False)
                self.base_ownership(bid, converted)
                # 004AD550's early exits/callback changes do not alter the
                # explicit MOV EAX,1 at004B4153 in this caller.
                result = 1
                self.step('004B4153', returnValue=result)
            else:
                # Exactly before PUSH EDI at004B415D. Requested pointer and
                # original arg3 are untouched; old pointer and manager survive.
                # Result is observed EAX at common epilogue entry: the only
                # normal exits are requested-pointer invalid0 or completed1.
                result = self.boundary('effect-query', CONTINUATION,
                    buildingId=bid, requestedLegionId=requested,
                    nativeArgument=nativeArgument, managerIdentity=MANAGER_IDENTITY,
                    entryBuildingId=bid, savedOldLegionId=old)
                integer(result, 'canonical continuation normal EAX', 0, 1)
            self.step('004B4988/normal-epilogue', returnValue=result,
                      stackBytes=0x192c, argumentBytes=12)
            return result

    def relocate_officer(self, personId, targetBuildingId):
        # Version-local copy of the frozen relocation coordinator. The only
        # behavioral delta here is the source-backed pointer getter below;
        # prior projectors and their established replay behavior are unchanged.
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
                    # 00490AD0 is fixed-array pointer construction. This new
                    # version removes only the predecessor's conservative row
                    # pre-read; later native field reads still require a slot.
                    legion = raw_legion if 0 <= raw_legion <= 46 else None
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
