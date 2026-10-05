"""Replace only the live005B8400 distance observation with native read paths.

0049E4D0 calls the source-local territorial helper on current then home, keeping
its first scalar result, before the directed unsigned city-distance byte read.
The inherited canonical readable-slot and fixed-vtable domains still apply.
"""
from __future__ import annotations


class NativeTailDistancePrimitives:
    def boundary(self, kind, helper, **args):
        if kind == 'query' and helper == '0049E4D0':
            # Inputs are the tail's saved getter identities. The reused helper
            # resolves their live building/map fields and pops its own scope.
            distance = self.movement_distance(args['currentBuildingId'],
                                              args['homeBuildingId'])
            # EDI belongs to005B8400, not0049E4D0. Save only AFTER that helper's
            # scope ends so later callbacks bind to the correct parent locals.
            self.save(savedDistance=distance)
            self.step('0049E4D0', result=distance, native=True, **args)
            return distance
        return super().boundary(kind, helper, **args)
