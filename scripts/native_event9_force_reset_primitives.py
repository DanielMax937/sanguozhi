"""004BA432..442 and004B5020 saved-force reset, with two direct stores.

The caller supplies(-1,0). The complete setter bodies are source checked, but
this API does not expose a generalized setter entry. Presentation remains one
opaque411..432 effect; reaction442..46C remains a separate opaque effect.
"""
from __future__ import annotations
import copy


class NativeEvent9ForceResetPrimitives:
    def boundary(self, kind, helper, **args):
        if kind == 'effect' and helper == '004BA432/event9-reaction':
            return self.event9_force_reset(args)
        return super().boundary(kind, helper, **args)

    def event9_force_reset(self, args):
        # EBX came from the earlier raw44 and survives presentation replacement.
        #004BA432 reloads the original manager into EDI and43B copies it to ECX.
        #004B5020 never reads that incoming ECX. Its first argument is the saved force identity.
        force = copy.deepcopy(args['savedForcePointer'])
        self.step('004BA43D/force-reset-call', forcePointer=force,
                  managerIdentity=args['managerIdentity'], raw94Argument=-1,
                  raw98Argument=0, incomingEcxRead=False)
        with self.scope('004B5020', forcePointer=force, raw94Argument=-1,
                        raw98Argument=0, site='004BA43D'):
            passed = self.event9_valid(force, '004B5026')
            self.step('004B502E/force-reset-validity', forcePointer=force,
                      passed=passed)
            if passed:
                # Each direct store resolves current storage of the same saved
                #pointer. There is no second validation or vtable dispatch even
                #if unknown08 replaced the whole frame, ruler or force vtable.
                self.event9_force_row(force)['rawDword94'] = 0xffffffff
                self.step('004815A2/raw94-store', forcePointer=force,
                          byteOffset=0x94, byteWidth=4, value=0xffffffff,
                          signedArgument=-1, directStore=True)
                self.event9_force_row(force)['rawByte98'] = 0
                self.step('004815B4/raw98-store', forcePointer=force,
                          byteOffset=0x98, byteWidth=1, value=0,
                          lowByteArgument=0, directStore=True)
        #004B5020 RET0x0C consumes its three arguments; each direct setter's
        #RET4 consumes its own argument. The original caller locals survive.
        self.step('004BA442/force-reset-continuation',
                  savedForcePointer=force, managerIdentity=args['managerIdentity'],
                  eventMemoryDomain=self.policy['event9EventMemoryDomain'],
                  parameterStackNetBytes=0, reactionRemainderObserved=True)
        self.boundary('effect', '004BA442/event9-reaction-remainder', **args)
