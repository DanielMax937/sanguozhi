/** Package-internal data contracts. No registry, owner, trusted state or public entrypoint. */
export type DeepRO<T> = T extends object ? { readonly [K in keyof T]: DeepRO<T[K]> } : T;
export type InstantContext = { commandId: string; turn: number };
export type Stat = 'leadership' | 'charm' | 'intelligence' | 'politics' | 'war';
export type Equipment = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 10 | 11;
export type FacilityKind = 'barracks' | 'forge' | 'stable' | 'workshop' | 'shipyard';
export type Policy = { id: string; version: 1; parameters: { [key: string]: string | number | boolean | string[] } };
export type Officer = { id: string; forceId: string; cityId: string; available: boolean; leadership: number; charm: number; intelligence: number; skillIds: number[]; xp: Record<Stat, number>; merit: number; actedTurn: number | null; reservationJobId: string | null };
export type Facility = { id: string; cityId: string; kind: FacilityKind; level: 1 | 2 | 3; complete: boolean; usedTurn: number | null; reservationJobId: string | null };
export type Write = { before: number; requested: number; returned: number; actualDelta: number; after: number; cap: number; discarded: number; policyId: string };
export type Reward = { officerId: string; attribute: Stat; xp: Write; merit: Write };
export type Fees = { gold: Write; actionPoints: Write; sourceApRequest: number; effectiveApCost: number };
export type Calculation = {
  observationKind: 'derived-adapter-observations'; selectedOfficerIds: string[];
  securityKernelReturn: number | null; quantityKernelReturn: number | null; quantityPreCapacity: number | null;
  priceKernelReturn: number | null; timeKernelReturn: number | null; facilityApplied: boolean;
  earlyCharmSum: number | null; moraleSecuritySnapshot: number | null; newRecruitMorale: number | null;
  securityWrite: Write | null; troopWrite: Write | null; inventoryWrite: Write | null; moraleWrite: Write | null;
  kernels: { api: string; input: unknown; output: unknown }[];
};
export type QuantityEquipment = 1 | 2 | 3 | 4;
export type PieceEquipment = 5 | 6 | 7 | 8 | 10 | 11;
export type DomesticPolicies = Record<'attributes' | 'facilityMultiplier' | 'writer' | 'morale' | 'productionAp' | 'rewards' | 'zeroYield' | 'presentation', Policy>;
export type DomesticInstantFrame = {
  activeForceId: string; corps: { actionPoints: number };
  city: { id: string; gold: number; security: number; troops: number; troopCapacity: number; morale: number; moraleCap: number; patrolUsedTurn: number | null;
    inventory: Record<QuantityEquipment, { quantity: number; capacity: number; reserved: number }> };
  officers: Officer[]; facilities: Facility[];
  pressureActive: boolean; difficulty: 'normal' | 'super'; controller: 'player' | 'ai';
  unlockedEquipmentTypes: Equipment[]; specialtyEquipmentTypes: Equipment[];
  productionPrices: Record<QuantityEquipment, { basePriceWord: number }>; policies: DomesticPolicies;
};
export type DomesticInstantAction =
  | { type: 'Patrol'; cityId: string; officerIds: string[] }
  | { type: 'Recruit'; cityId: string; officerIds: string[]; facilityId: string }
  | { type: 'Produce'; cityId: string; officerIds: string[]; facilityId: string; equipmentType: QuantityEquipment };
export type DomesticInstantAudit = { calculation: Calculation; fees: Fees; rewards: Reward[]; events: { type: string; subjectId: string }[]; sideEffectsNotModeled: string[]; rngDraws: 0 };
export type DomesticReason = 'unknown-city' | 'patrol-already-used' | 'unknown-officer' | 'officer-not-member' | 'officer-not-present' | 'officer-unavailable' | 'officer-production-reserved' | 'officer-already-acted'
  | 'unknown-facility' | 'facility-not-present' | 'facility-incomplete' | 'wrong-facility-kind' | 'facility-production-reserved' | 'facility-used-this-turn' | 'equipment-locked'
  | 'kernel-rejected' | 'writer-cap-overflow' | 'zero-yield' | 'insufficient-gold' | 'insufficient-ap';
export type DomesticReject = { ok: false; reason: DomesticReason };
export type DomesticLeafResult<T> = { ok: true; value: T } | DomesticReject;
export type DomesticResult = { ok: true; candidate: DomesticInstantFrame; audit: DomesticInstantAudit } | DomesticReject;
export type RewardProgress = { officerId: string; attribute: Stat; xp: number; merit: number };
export type RewardPlan = { progress: RewardProgress[]; rewards: Reward[] };
