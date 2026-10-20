/** Private projections over an owner's detached mutable candidate. */
import type { DomesticInstantAction, DomesticInstantAudit, DomesticLeafResult, DomesticPolicies, Officer } from './city-service-types.ts';

export type PatrolPhaseOfficer = Pick<Officer,
  'id' | 'forceId' | 'cityId' | 'available' | 'leadership' |
  'xp' | 'merit' | 'actedTurn' | 'reservationJobId'>;
export type PatrolPhaseView = {
  activeForceId: string;
  corps: { actionPoints: number };
  city: { id: string; gold: number; security: number; patrolUsedTurn: number | null };
  officers: PatrolPhaseOfficer[];
  pressureActive: boolean;
  policies: Pick<DomesticPolicies, 'writer' | 'rewards' | 'zeroYield'>;
};
export type PatrolPhaseAction = Extract<DomesticInstantAction, { type: 'Patrol' }>;
export type PatrolPhaseResult = DomesticLeafResult<DomesticInstantAudit>;
