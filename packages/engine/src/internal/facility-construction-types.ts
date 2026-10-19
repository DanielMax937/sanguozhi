import type { DomesticConstructionRateReceipt } from '../domestic-construction-rate.ts';

export type ConstructionKind =
  'market' | 'farm' | 'barracks' | 'forge' | 'stable' |
  'workshop' | 'shipyard' | 'mint' | 'granary';
export type ConstructionLevel = 1 | 2 | 3;
export type ConstructionFacilityStatus = 'complete' | 'developing' | 'absorbing';

export type ConstructionWrite = {
  before: number;
  requestedDelta: number;
  actualDelta: number;
  after: number;
  cap: number;
  discarded: number;
  policyId: string;
};
export type ConstructionWriteResult =
  { ok: true; write: ConstructionWrite } |
  { ok: false; reason: 'insufficient-balance' };

export type ConstructionDevelopmentInput = {
  readonly required: number;
  readonly politics: readonly number[];
  readonly initialWork: {
    readonly mode: string;
    readonly divisor: number;
  };
};
export type ConstructionDevelopmentResult =
  {
    ok: true;
    required: number;
    initial: number;
    rate: DomesticConstructionRateReceipt;
    durationTurns: number;
  } |
  {
    ok: false;
    reason: 'unsupported-construction-rate' | 'nonpositive-construction-rate';
  };

export type ConstructionWork = {
  initial: number;
  current: number;
  required: number;
  perAdvance: number;
  rate: DomesticConstructionRateReceipt;
};
export type ConstructionProgressTarget = {
  readonly id: string;
  remainingTurns: number;
  work: ConstructionWork | null;
};
export type ConstructionProgress = {
  jobId: string;
  remainingBefore: number;
  remainingAfter: number;
  workBefore: number | null;
  workAfter: number | null;
};

export type ConstructionReward = {
  officerId: string;
  politicsXp: ConstructionWrite;
  merit: ConstructionWrite;
  politicsBefore: number;
  politicsAfter: number;
};
export type ConstructionCompletion = {
  jobId: string;
  facilityId: string;
  typeId: number;
  level: ConstructionLevel;
  effectiveLevel: ConstructionLevel;
  techniquePoints: ConstructionWrite;
  rewards: ConstructionReward[];
  releasedOfficerIds: string[];
  policyId: string;
};

// These are views of the owner's detached candidate objects, not copies.
export type ConstructionCompletionJob = {
  readonly id: string;
  readonly kind: 'development' | 'absorption';
  readonly facilityKind: ConstructionKind;
  readonly targetLevel: ConstructionLevel;
  readonly officerIds: readonly string[];
  completedTurn: number | null;
};
export type ConstructionCompletionFacility = {
  readonly id: string;
  readonly typeId: number;
  status: ConstructionFacilityStatus;
  effectiveLevel: 0 | ConstructionLevel;
  jobId: string | null;
};
export type ConstructionCompletionForce = {
  techniquePoints: number;
};
export type ConstructionCompletionOfficer = {
  readonly politics: number;
  politicsXp: number;
  merit: number;
  reservationJobId: string | null;
  actedTurn: number | null;
};
export type ConstructionCompletionPolicies = {
  readonly writer: {
    readonly id: string;
    readonly techniquePointCap: number;
    readonly rewardCap: number;
  };
  readonly rewards: {
    readonly id: string;
    readonly ordinaryDevelopmentPoliticsXp: number;
    readonly supportDevelopmentPoliticsXp: number;
    readonly absorptionPoliticsXp: number;
    readonly mintDevelopmentMerit: number;
    readonly otherMerit: number;
  };
  readonly completionActors: { readonly actedOnCompletion: boolean };
  readonly scheduler: { readonly id: string };
};
export type ConstructionCompletionInput = {
  readonly job: ConstructionCompletionJob;
  readonly facility: ConstructionCompletionFacility;
  readonly force: ConstructionCompletionForce;
  readonly currentTurn: number;
  readonly requestedTechniquePoints: number;
  readonly policies: ConstructionCompletionPolicies;
};

// Private, synchronous code dependencies. Never part of save/trace/public input.
export type ConstructionCompletionServices = {
  readonly write: (
    before: number, delta: number, cap: number, policyId: string
  ) => ConstructionWrite;
  readonly requireReservedOfficer: (
    officerId: string
  ) => ConstructionCompletionOfficer;
};
