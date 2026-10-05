"""004BA442..44C saved-troop reset with a single direct DWORD store.

The caller passes -1; complete setter evidence does not expose a general setter
API. Presentation411..432 remains combined and reaction44C..46C remains opaque.
"""
from __future__ import annotations
import copy


class NativeEvent9TroopResetPrimitives:
    def boundary(self, kind, helper, **args):
        if kind == 'effect' and helper == '004BA442/event9-reaction-remainder':
            return self.event9_troop_reset(args)
        return super().boundary(kind, helper, **args)

    def event9_troop_reset(self, args):
        # ESI is the saved troop identity. Earlier EBX still identifies the
        # force captured BEFORE presentation, independent of current raw44.
        troop = copy.deepcopy(args['troopPointer'])
        force = copy.deepcopy(args['savedForcePointer'])
        self.step('004BA447/troop-reset-call', troopPointer=troop,
                  savedForcePointer=force, managerIdentity=args['managerIdentity'],
                  raw44Argument=-1, incomingEcxRead=False)
        with self.scope('004AD2B0', troopPointer=troop, raw44Argument=-1,
                        site='004BA447'):
            passed = self.event9_valid(troop, '004AD2B6')
            self.step('004AD2BE/troop-reset-validity', troopPointer=troop,
                      passed=passed)
            if passed:
                #004AD2C7 restores saved ESI to ECX after the validity callback.
                # There is no second gate or virtual setter call. Re-resolve
                # current storage of that pointer after complete frame changes.
                self.slot('troops', troop['id'])['raw44'] = -1
                self.step('00495A32/raw44-store', troopPointer=troop,
                          byteOffset=0x44, byteWidth=4, value=-1,
                          unsignedBits=0xffffffff, signedArgument=-1,
                          directStore=True)
        # Setter RET4 and helper RET8 consume their own argument groups. The
        # original manager, saved force and caller locals remain unchanged.
        self.step('004BA44C/troop-reset-continuation',
                  savedTroopPointer=troop, savedForcePointer=force,
                  managerIdentity=args['managerIdentity'],
                  eventMemoryDomain=self.policy['event9EventMemoryDomain'],
                  parameterStackNetBytes=0, reactionRemainderObserved=True)
        self.boundary('effect', '004BA44C/event9-reaction-remainder', **args)
