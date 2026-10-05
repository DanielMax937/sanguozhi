"""Live cancellation bodies9/10/12/22 within the versioned shared frame.

Each presentation is a deliberately bounded whole-segment mutable observation.
Saved native identities/scalars survive that replacement; the zero-refund tail
then re-reads the actor in the current frame. No old transaction is invoked.
"""
from __future__ import annotations

HANDLER_MISSIONS = {
    '005CB050': 9, '005D5DD0': 10, '005C4E70': 12, '005BEDA0': 22,
}
PRESENTATION = {
    9: ('005CB0E2..005CB15E', 0x13a5),
    10: ('005D5E62..005D5EDE', 0x207e),
    12: ('005C4EF4..005C4F65', 0x13e9),
    22: ('005BEE58..005BEEC9', 0x1595),
}


class LiveZeroRefundPrimitives:
    def boundary(self, kind, helper, **args):
        # The inherited cancellation/event coordinators already captured the
        # mission and established its actor/scope. Replace only these four
        # whole-handler calls. This consumes no observation or extra revision.
        if kind == 'effect-query' and helper in HANDLER_MISSIONS:
            mission = HANDLER_MISSIONS[helper]
            if args['personId'] != self.pid or args['capturedMissionId'] != mission:
                raise ValueError('zero-refund handler context mismatch')
            return self.handler_primitive(mission)
        return super().boundary(kind, helper, **args)

    def handler_primitive(self, mission):
        if mission not in PRESENTATION:
            return super().handler_primitive(mission)
        passed = self.person()['valid']
        self.step('handler/actor-valid', mission=mission, passed=passed)
        if not passed: return 0

        location = self.person()['locationId']
        current = location if 0 <= location <= 86 else -1
        passed = self.valid('buildings', current)
        self.step('handler/current-valid', buildingId=current, passed=passed)
        if not passed: return 0

        target = self.person()['missionArgs'][0]
        name = 'persons' if mission == 12 else 'forces' if mission == 22 else 'buildings'
        if mission == 22:
            passed = self.valid('forces', target)
            self.step('handler/target-valid', targetType=name, targetId=target, passed=passed)
        else:
            maximum = 1099 if mission == 12 else 16383
            passed = 0 <= target <= maximum
            self.step('004897B0/range', argumentIndex=0, value=target,
                      minimum=0, maximum=maximum, passed=passed,
                      targetValidityChecked=False)
        if not passed: return 0

        saved = dict(currentBuildingId=current, targetType=name, targetId=target)
        if mission in (9, 10):
            # 005CB0D0 / 005D5E50: force-valid is evaluated, but its EAX
            # result is discarded before the fresh005B81D0 notification gate.
            force = self.actor_force()
            self.step('handler/discarded-force-valid',
                      forceId=force['id'] if force is not None else None,
                      passed=bool(force and force['valid']), resultDiscarded=True)
        elif mission == 12:
            # 00490B00 is fixed-array address construction, not a field read.
            # Even an unrepresented target row is allowed here: every target
            # dereference remains inside the full presentation observation.
            self.step('00490B00', personId=target, resultPointerId=target,
                      validityChecked=False, targetFieldsRead=False)
        else:
            force = self.actor_force()
            valid = bool(force and force['valid'])
            self.step('handler/actor-force-valid',
                      forceId=force['id'] if force is not None else None, passed=valid)
            saved.update(savedActorForceId=force['id'] if force is not None else None,
                         savedForce44=force['raw44'] if valid else -1)
        self.step('handler/saved-pointers', **saved)

        if self.notification():
            segment, message = PRESENTATION[mission]
            #9/10 include the target-building getter in this segment. There is
            # no target validity gate or pre-notification target-slot read.
            #9/10/12's late0047A770 reads remain inside the segment; only22
            # passes the pre-notification saved force+44 scalar.
            self.boundary('effect', segment, personId=self.pid, **saved, messageId=message)
        self.return_zero()
        self.step('handler/return', mission=mission, returnValue=1)
        return 1
