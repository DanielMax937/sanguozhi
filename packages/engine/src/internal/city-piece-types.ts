/** Package-private piece plans. No owner state, clock, validator or trusted token. */
import type { DomesticReason, DomesticReject, Equipment, Facility, Fees, Officer, PieceEquipment, Policy, Reward, RewardProgress, Write } from './city-service-types.ts';

type Bit = 0 | 1;
type Slot = 0 | 1 | 2;
type Stock = { quantity: number; capacity: number; reserved: number };
type PriceInput = { profile: 'production-price-resolved-v1'; savedBasePriceWord: number; specialtyHelperEax: Bit };
type PriceOutput = {
  supported: true; profile: 'production-price-resolved-v1'; savedBasePriceWord: number;
  specialtyHelperEax: Bit; specialtyResultAl: Bit; discountApplied: boolean; returnedPrice: number;
};
type PieceQuantityInput = { profile: 'production-quantity-resolved-f32-v1'; nativeEquipmentType: PieceEquipment };
type PieceQuantityOutput = {
  supported: true; profile: 'production-quantity-resolved-f32-v1'; nativeEquipmentType: PieceEquipment;
  reason: 'single-item-return-one'; resolvedInputsObserved: false; returnedQuantity: 1;
};
export type PieceTimeCapture =
  | { callAddress: '005C6CF8'; slotIndex: Slot; eax: Bit }
  | { callAddress: '005C6D06'; slotIndex: Slot; eax: number }
  | { callAddress: '005C6D25'; slotIndex: Slot; eax: Bit }
  | { callAddress: '005C6D90' | '005C6DAA' | '005C6DB0' | '005C6DCA' | '005C6DD1'; eax: 1 }
  | { callAddress: '005C6DDE'; eax: Bit };
export type PieceTimeInput = {
  profile: 'production-time-observations-v1'; nativeEquipmentType: PieceEquipment; captures: PieceTimeCapture[];
};
type TimeSlot =
  | { slotIndex: Slot; validityEax: 0; intelligenceAl: null; skillEax: null }
  | { slotIndex: Slot; validityEax: 1; intelligenceAl: number; skillEax: Bit };
type TimeCallDetail =
  | { callAddress: '005C6CF8'; target: '0047A630'; slotIndex: Slot; queryId: null }
  | { callAddress: '005C6D06'; target: '00489090'; slotIndex: Slot; queryId: null }
  | { callAddress: '005C6D25'; target: '004890F0'; slotIndex: Slot; queryId: 82 | 83 }
  | { callAddress: '005C6D90' | '005C6DB0'; target: '0047A630'; slotIndex: null; queryId: null }
  | { callAddress: '005C6DAA' | '005C6DCA'; target: '00490D00'; slotIndex: null; queryId: null }
  | { callAddress: '005C6DD1'; target: '004866F0'; slotIndex: null; queryId: null }
  | { callAddress: '005C6DDE'; target: '0049DAB0'; slotIndex: null; queryId: 45 };
type TimeOutput = {
  supported: true; profile: 'production-time-observations-v1'; nativeEquipmentType: PieceEquipment;
  reason: 'captured-duration-projection'; returnedValue: number; rawEaxU32: number; scannedSlots: true;
  skillQueryId: 82 | 83; slots: [TimeSlot, TimeSlot, TimeSlot]; intelligenceSum: number; intelligenceMax: number;
  rawX: number; clampedX: number; q: number; facilityApplied: boolean; skillApplied: boolean; beforeSkill: number;
  trace: PieceTimeCapture[]; callDetails: TimeCallDetail[];
};
type PieceKernels = [
  { api: 'calculateProductionPrice'; input: PriceInput; output: PriceOutput },
  { api: 'calculateProductionQuantity'; input: PieceQuantityInput; output: PieceQuantityOutput },
  { api: 'calculateProductionTimeProjection'; input: PieceTimeInput; output: TimeOutput },
];
export type PieceCalculation = {
  observationKind: 'derived-adapter-observations'; selectedOfficerIds: string[];
  securityKernelReturn: null; quantityKernelReturn: 1; quantityPreCapacity: 1;
  priceKernelReturn: number; timeKernelReturn: number; facilityApplied: boolean;
  earlyCharmSum: null; moraleSecuritySnapshot: null; newRecruitMorale: null;
  securityWrite: null; troopWrite: null; inventoryWrite: null; moraleWrite: null; kernels: PieceKernels;
};
export type PieceCalculationFrame = {
  people: { id: string; intelligence: number; skillIds: number[] }[];
  basePriceWord: number; specialty: boolean; drillGroundComplete: boolean; timePolicy: Policy;
};
export type PieceCalculationAction = { equipmentType: PieceEquipment };
export type PieceCalculationResult =
  | { ok: true; value: { price: number; quantity: 1; duration: number; calculation: PieceCalculation } }
  | DomesticReject
  | { ok: false; reason: 'unsupported-nonpositive-production-time' };

export type PieceStartContext = { commandId: string; turn: number };
export type PieceStartOfficer = Pick<Officer, 'id' | 'forceId' | 'cityId' | 'available' | 'intelligence' | 'skillIds' | 'actedTurn' | 'reservationJobId'>;
export type PieceStartFacility = Pick<Facility, 'id' | 'cityId' | 'kind' | 'complete' | 'usedTurn' | 'reservationJobId'>;
export type PieceStartFrame = {
  activeForceId: string;
  city: { id: string; drillGroundComplete: boolean; inventory: Record<PieceEquipment, Stock> };
  officers: PieceStartOfficer[]; facilities: PieceStartFacility[];
  unlockedEquipmentTypes: Equipment[]; specialtyEquipmentTypes: Equipment[];
  productionPrices: Record<PieceEquipment, { basePriceWord: number }>;
  policies: { time: Policy; productionAp: Policy }; productionJobCount: number;
};
export type PieceStartAction = { type: 'Produce'; cityId: string; officerIds: string[]; facilityId: string; equipmentType: PieceEquipment };
export type PieceStartPlan = {
  jobId: string; cityId: string; facilityId: string; officerIds: string[]; equipmentType: PieceEquipment;
  startTurn: number; remainingTurns: number; dueTurn: number; durationTurns: number;
  reservedQuantity: 1; quantityToReserve: 1; goldCost: number; actionPointsCost: number; calculation: PieceCalculation;
};
export type PieceStartReason = DomesticReason | 'unsupported-nonpositive-production-time'
  | 'production-history-full' | 'piece-capacity-unavailable' | 'invalid-state';
export type PieceStartResult = { ok: true; plan: PieceStartPlan } | { ok: false; reason: PieceStartReason };
export type PieceStartFeeFrame = { gold: number; actionPoints: number };
export type PieceStartFeeAction = { goldCost: number; actionPointsCost: number };
export type PieceStartFeeResult =
  | { ok: true; value: { goldAfter: number; actionPointsAfter: number; fees: Fees } }
  | DomesticReject;

type Completion = { jobId: string; turn: number; inventoryWrite: Write; rewards: Reward[] };
export type PieceCompletionContext = { turn: number };
export type PieceCompletionFrame = {
  stock: Stock; people: Pick<Officer, 'id' | 'xp' | 'merit'>[]; policies: { writer: Policy; rewards: Policy };
};
export type PieceCompletionAction = { jobId: string; reservedQuantity: 1 };
export type PieceCompletionResult =
  | { ok: true; value: { stockAfter: { quantity: number; reserved: number }; progress: RewardProgress[]; completion: Completion } }
  | DomesticReject
  | { ok: false; reason: 'completion-reservation-mismatch' };
