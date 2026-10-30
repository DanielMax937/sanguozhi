import { planSyntheticTechniqueStart, advanceSyntheticTechnique, validateSyntheticTechniqueContext, type SyntheticTechniqueOwnerJob } from './internal/synthetic-technique-bridge.ts';
import { planSyntheticIncomeLeaves } from './internal/synthetic-safe-income-leaves.ts';
import { planSyntheticForgeStart, advanceSyntheticForge } from './internal/synthetic-forge-bridge.ts';
import type { SyntheticForgeJob } from './internal/synthetic-forge-bridge.ts';
import { planSyntheticNeutralFoodTick } from './internal/synthetic-neutral-food-leaf.ts';
import { planSyntheticTrainingBridge } from './internal/synthetic-training-bridge.ts';
import { projectSyntheticTreasureAttributes } from './internal/synthetic-treasure-attributes.ts';
import { RULESET as TRAINING_RULESET } from './rules.ts';
import { DEFAULT_ADAPTERS as TRAINING_ADAPTERS } from './engine.ts';
import { derivedWar as trainingDerivedWar } from './calculations.ts';
import { createInferredMobileField, executeInferredMobileField } from './inferred-mobile-field.ts';
import { projectInferredCommandAP } from './inferred-independent-planning.ts';
import { createInferredDynamicField, executeInferredDynamicField } from './inferred-dynamic-field.ts';
import { createSyntheticResourceMetadata, applySyntheticResourceBridge } from './internal/synthetic-city-resource-bridge.ts';
import { createSyntheticCityTransports, planSyntheticCityTransferBridge } from './internal/synthetic-city-transfer-bridge.ts';
/** Bounded single-city owner: one shared xun clock, ledger and type-5 workshop reservation.
 * Full genesis folding is the only trust boundary. No native scheduler or legacy public delegation. */
import policyData from '../../../data/policies/bounded-city-piece-clock-v1.json' with { type: 'json' };
import merchantCatalogData from '../../../data/catalogs/city-merchant-politics-v1.json' with { type: 'json' };
import { calculatePieceProduction } from './internal/city-piece-calculation.ts';
import { planPieceStartFees } from './internal/city-piece-start-reducer.ts';
import { planPieceCompletion } from './internal/city-piece-completion-reducer.ts';
import { ACCUMULATE, writeDomestic } from './internal/city-domestic-leaves.ts';
import type { PieceCalculation as LegacyPieceCalculation } from './internal/city-piece-types.ts';
import type { Fees, Write, Reward } from './internal/city-service-types.ts';
import { reduceDomesticInstant } from './internal/city-instant-reducer.ts';
import { reduceMerchantTrade } from './internal/city-merchant-trade-reducer.ts';
import { boundedCityJsonFits, canonicalBoundedCityJson, decodeBoundedCityJson, detachBoundedCityData } from './internal/bounded-city-json.ts';
import type { DomesticInstantFrame, DomesticInstantAudit, Stat, QuantityEquipment, DeepRO } from './internal/city-service-types.ts';
import type { MerchantTradeFrame, MerchantTradeAudit } from './internal/city-merchant-types.ts';
import type { PatrolSecurityGainInput, PatrolSecurityGainReceipt } from './patrol-security-gain.ts';
import type { RecruitmentQuantityFactorBits, RecruitmentQuantityReceipt } from './recruitment-quantity.ts';
import type { RecruitmentSecurityArgumentInput, RecruitmentSecurityArgumentReceipt } from './recruitment-security-argument.ts';
import type { ProductionPriceInput, ProductionPriceReceipt } from './production-price.ts';
import type { ProductionQuantityFactorBits, ProductionQuantityReceipt } from './production-quantity.ts';

type Equipment = QuantityEquipment | 5;
type ActionIndex = 0 | 1 | 2 | 3;
type Marker = number | null;
type DateV1 = { year: number; month: number; day: 1 | 11 | 21 };
type Position = { q: number; r: number };
type Progress = { xp: Record<Stat, number>; merit: number; actedTurn: Marker };
type OfficerFacts = { id: string; forceId: string; cityId: string; available: boolean; leadership: number; charm: number; intelligence: number; politics: number; skillIds: (79 | 80 | 81 | 82)[]; initial: Progress };
type FacilityFacts = { id: string; cityId: string; kind: 'barracks' | 'forge' | 'stable' | 'workshop'; level: 1 | 2 | 3; complete: boolean; initialUsedTurn: Marker };
type Clock = { date: DateV1; turn: number; advancedCount: number };
type Ledger = { gold: number; food: number; actionPoints: number; security: number; troops: number; morale: number; patrolUsedTurn: Marker; merchantUsedTurn: Marker;
  inventory: Record<Equipment, { quantity: number; reserved: number }>;
  officers: ({ id: string; reservationJobId: string | null } & Progress)[];
  facilities: { id: string; usedTurn: Marker; reservationJobId: string | null }[] };
type FixedDomesticPolicies = {
  attributes: { id: 'stable-effective-attributes-v1'; version: 1; parameters: { snapshot: 'command-start'; xpChangesEffectiveAbility: false } };
  facilityMultiplier: { id: 'guide-levels-f32-v1'; version: 1; parameters: { levelBits: ['3F800000', '3F99999A', '3FC00000'] } };
  writer: { id: 'clip-and-return-actual-v1'; version: 1; parameters: { overflow: 'clip'; returned: 'actual-delta' } };
  morale: { id: 'weighted-floor-presecurity-min20-v1'; version: 1; parameters: { rounding: 'floor'; security: 'before-write'; minimum: 20 } };
  productionAp: { id: 'production-request20-effective20-v1'; version: 1; parameters: { quantity: 20; piece: 20 } };
  rewards: { id: 'source-reward-compat-intelligence-v1'; version: 1; parameters: { patrol: 'leadership'; recruit: 'charm'; quantity: 'intelligence'; piece: 'intelligence'; instantXp: 2; instantMerit: 50; completionXp: 4; completionMerit: 100; cap: 1000000000 } };
  zeroYield: { id: 'pay-zero-yield-instant-v1'; version: 1; parameters: { zero: 'pay-and-reward' } };
  presentation: { id: 'no-presentation-rng-no-tp-v1'; version: 1; parameters: { rngDraws: 0; techniquePoints: 'not-modeled' } };
};
type FixedMerchantPolicies = {
  ownership: { id: 'merchant-fixed-owned-city-v1'; cityKind: 'city'; activeOwnerCorpsMustMatch: true; ownershipChanges: false };
  eligibility: { id: 'merchant-once-city-actor-turn-v1'; cityTradesPerTurn: 1; actorsPerTrade: 1; actorMustBeAvailable: true; actorMustMatchCityAndForce: true; actionPointsCost: 20; fixedGoldFee: 0; minFoodAmount: 1; maxFoodAmount: 1000000000 };
  hostility: { id: 'supplied-axial-distance-v1'; completeFieldUnitsRequired: true; hostileForceIdsExplicit: true; differentForceImpliesHostile: false; distance: 'max(abs(dq),abs(dr),abs(dq+dr))'; blockingDistanceInclusive: 2; coordinateMin: -1000000; coordinateMax: 1000000; nativeGeometryRecovered: false };
  pricing: { id: 'merchant-ui-rational-rounding-v1'; priceScale: 'ui-food-per-gold'; uiTradePrices: [3, 4, 5, 6, 7]; rawTradePriceAccepted: false; requestUnit: 'food';
    buyGold: 'ceil(Q*D/(uiPrice*N))'; sellGold: 'floor(Q*N*4/(uiPrice*D*5))'; buyFactor: { numerator: 1; denominator: 1 }; sellFactor: { numerator: 4; denominator: 5 };
    interpolation: 'exact-unreduced-rational-v1'; goldFraction: 'unreduced-nonnegative-decimal-strings-v1'; nativeRoundingRecovered: false };
  zeroSale: { id: 'reject-zero-value-sale-v1'; minimumGoldCredit: 1 };
  capacity: { id: 'merchant-full-fill-cap-reject-v1'; maxBalanceAndCapacity: 1000000000; partialFill: false; discarded: 0; failure: 'atomic-reject' };
  rewards: { id: 'merchant-politics-xp5-no-growth-v1'; politicsXpRequested: 5; politicsXpCap: 1000000000; automaticPoliticsGrowth: false; meritDelta: 0; techniquePointsDelta: 0; loyaltyDelta: 0; meritApplication: 'not-integrated-profile-zero'; nativeMeritRewardRecovered: false };
};
type MerchantCatalog = {
  version: 'merchant-politics-observed-linear-v1'; evidence: 'selected-approximate-observations-not-native-exact'; minPolitics: 20; maxPolitics: 100; anchorDenominator: 1000000;
  anchors: [
    { politics: 20; effectMillionths: 930240 }, { politics: 50; effectMillionths: 1000000 }, { politics: 51; effectMillionths: 1002516 },
    { politics: 60; effectMillionths: 1025650 }, { politics: 70; effectMillionths: 1052642 }, { politics: 80; effectMillionths: 1081090 },
    { politics: 90; effectMillionths: 1111122 }, { politics: 92; effectMillionths: 1117328 }, { politics: 97; effectMillionths: 1133154 },
    { politics: 98; effectMillionths: 1136374 }, { politics: 99; effectMillionths: 1139612 }, { politics: 100; effectMillionths: 1142868 }
  ];
  betweenAnchors: 'N=A_l*(h-p)+A_h*(p-l);D=1000000*(h-l)'; anchorFraction: 'N=A_p;D=1000000'; reduction: 'unreduced'; outsideRange: 'reject';
};
type Policy = {
  id: 'bounded-city-economy-piece-clock-v1'; version: 1;
  clock: 'root-xun-ap-then-piece-completion-v1'; ownership: 'fixed-supplied-city-corps-force-v1';
  ordering: 'caller-action-order-no-reordering-v1'; transaction: 'all-or-nothing-batch-v1';
  legalOrdering: 'facility-trade-piece-advance-order-v1'; legalPaging: 'stateless-contiguous-prefix-full-state-bound-v1';
  rewardScope: 'shared-xp-merit-partial-no-tp-v1'; pressureBinding: 'independent-supplied-domestic-helper-v1';
  domestic: FixedDomesticPolicies; merchant: FixedMerchantPolicies;
  pieceTime: { id: 'raw-turns-min1-v1'; version: 1; parameters: { nonpositive: 'minimum-one'; unit: 'service-turn' } };
  apRecovery: { id: 'fixed20-cap255-ap-recovery-v1'; version: 1; parameters: { increment: 20; cap: 255 } };
  reservation: 'root-bidirectional-piece-lock-v1'; externalFacts: 'fixed-for-entire-bounded-episode-v1';
  budgets: { acceptedCommands: 64; actionsPerCommand: 4; traceAttempts: 512; legalCandidates: 32; legalPageSize: 4; maxJobs: 12; maxAdvances: 12; maxOfficers: 8; maxFacilities: 8; maxFieldUnits: 16; maxHostileForces: 16; maxUtf8Bytes: 8388608; maxNodes: 250000; maxDepth: 48; maxArray: 4096; maxObjectKeys: 128 };
};
type Scenario = {
  schemaVersion: 1; profile: 'bounded-city-economy-piece-clock-v1'; episodeId: string;
  clock: { date: DateV1; turn: number }; advanceLimit: number; activeForceId: string;
  corps: { id: string; forceId: string; initialActionPoints: number };
  city: { id: string; kind: 'city'; ownerForceId: string; position: Position; goldCapacity: 1000000000; foodCapacity: number; troopCapacity: number; moraleCap: number;
    initial: { gold: number; food: number; security: number; troops: number; morale: number; patrolUsedTurn: Marker; merchantUsedTurn: Marker };
    inventory: Record<Equipment, { quantity: number; capacity: number }> };
  officers: OfficerFacts[]; facilities: FacilityFacts[];
  domestic: { pressureActive: boolean; difficulty: 'normal' | 'super'; controller: 'player' | 'ai'; unlockedEquipmentTypes: Equipment[]; specialtyEquipmentTypes: Equipment[] };
  merchant: { present: boolean; uiTradePrice: 3 | 4 | 5 | 6 | 7; hostileForceIds: string[]; completeFieldUnits: true; fieldUnits: { id: string; forceId: string; position: Position }[] };
  productionCatalog: { id: string; version: 1; entries: Record<Equipment, { basePriceWord: number }> };
  merchantCatalog: MerchantCatalog; policy: Policy;
};
type DomesticAction = { type: 'Patrol'; cityId: string; officerIds: string[] }
  | { type: 'Recruit'; cityId: string; officerIds: string[]; facilityId: string }
  | { type: 'Produce'; cityId: string; officerIds: string[]; facilityId: string; equipmentType: QuantityEquipment };
type TradeAction = { type: 'BuyFood' | 'SellFood'; cityId: string; officerId: string; foodAmount: number };
type Action = DomesticAction | TradeAction;
type StartCommand = { type: 'StartPieceProduction'; cityId: string; officerIds: string[]; facilityId: string; equipmentType: 5 };
type Command = { type: 'ExecuteCityActions'; actions: Action[] } | StartCommand | { type: 'AdvanceSharedCityTurn' };
type Envelope = { id: string; expectedRevision: number; command: Command };
type NoEvidence<T> = T extends object ? Omit<T, 'evidence'> : never;
type RecruitCapture =
  | { callAddress: '005C3619' | '005C3630' | '005C3643' | '005C364B'; eax: 1 }
  | { callAddress: '005C367B' | '005C36AA'; slotIndex: 0 | 1 | 2; eax: 0 | 1 }
  | { callAddress: '005C3689'; slotIndex: 0 | 1 | 2; eax: number }
  | { callAddress: '005C3725' | '005C3738'; eax: 0 | 1 }
  | { callAddress: '005C374E' | '005C3757' | '005C3764' | '005C376B'; eax: number };
type RecruitCapturedCall =
  | { callAddress: '005C3619' | '005C3630' | '005C364B'; target: '0047A630'; slotIndex: null; queryId: null }
  | { callAddress: '005C3643'; target: '004866F0'; slotIndex: null; queryId: null }
  | { callAddress: '005C367B'; target: '0047A630'; slotIndex: 0 | 1 | 2; queryId: null }
  | { callAddress: '005C3689'; target: '004890B0'; slotIndex: 0 | 1 | 2; queryId: null }
  | { callAddress: '005C36AA'; target: '004890F0'; slotIndex: 0 | 1 | 2; queryId: 79 }
  | { callAddress: '005C3725'; target: 'vtable+0x48'; slotIndex: null; queryId: null }
  | { callAddress: '005C3738'; target: '004B99B0'; slotIndex: null; queryId: null }
  | { callAddress: '005C374E' | '005C3764'; target: 'vtable+0x50'; slotIndex: null; queryId: null }
  | { callAddress: '005C3757' | '005C376B'; target: '00486BC0'; slotIndex: null; queryId: null };
type RecruitCallDetail = (RecruitCapturedCall & { kind: 'captured-eax'; eax: number; st0Bits: null })
  | { callAddress: '005C36C8'; target: '005C3550'; slotIndex: null; queryId: null; kind: 'captured-st0-f32'; eax: null; st0Bits: RecruitmentQuantityFactorBits }
  | { callAddress: '005C3710'; target: '00707A74'; slotIndex: null; queryId: null; kind: 'derived-converter-eax'; eax: number; st0Bits: null };
type PatrolKernelInput = Omit<PatrolSecurityGainInput, 'resolvedLeadershipSlots' | 'pressureHelperEax'> & { resolvedLeadershipSlots: number[]; pressureHelperEax: 0 | 1 };
type RecruitKernelInput = { profile: 'recruitment-quantity-observations-f32-v1'; captures: RecruitCapture[]; savedSecurityByte: number; resolvedFacilityFactorBits: RecruitmentQuantityFactorBits; difficultyWord: 0 | 2 };
type RecruitKernelOutput = Omit<NoEvidence<RecruitmentQuantityReceipt>, 'reason' | 'trace' | 'callDetails' | 'slots' | 'charismaSum' | 'validSlotCount' | 'skillParameter' | 'baseQuantity' | 'integerQuantity' | 'savedSecurityByte' | 'resolvedFacilityFactorBits' | 'difficultyWord' | 'convertedQuantity' | 'afterSuperU32' | 'pressureEax' | 'afterPressureU32' | 'firstTroopsEax' | 'firstCapacityEax' | 'firstSumU32' | 'cityVirtualEax'> & {
  reason: 'captured-quantity-projection'; trace: RecruitCapture[]; callDetails: RecruitCallDetail[];
  slots: { slotIndex: 0 | 1 | 2; validityEax: 0 | 1; charismaEax: number | null; charismaAl: number | null; skillEax: 0 | 1 | null }[];
  charismaSum: number; validSlotCount: number; skillParameter: 10 | 15; baseQuantity: number; integerQuantity: number;
  savedSecurityByte: number; resolvedFacilityFactorBits: RecruitmentQuantityFactorBits; difficultyWord: 0 | 2; convertedQuantity: number;
  cityVirtualEax: 0 | 1 | null; afterSuperU32: number; pressureEax: 0 | 1; afterPressureU32: number; firstTroopsEax: number; firstCapacityEax: number; firstSumU32: number;
};
type QuantitySlot = { intelligenceGetterEax: number; skillHelperEax: 0 | 1 } | null;
type QuantityKernelInput = { profile: 'production-quantity-resolved-f32-v1'; nativeEquipmentType: QuantityEquipment; slots: [QuantitySlot, QuantitySlot, QuantitySlot]; resolvedFacilityFactorBits: ProductionQuantityFactorBits } & ({ difficultyWord: 0 } | { difficultyWord: 2; cityVirtualEax: 0 | 1 });
type QuantityKernelOutput = Omit<NoEvidence<ProductionQuantityReceipt>, 'nativeEquipmentType' | 'skillQueryId' | 'difficultyWord' | 'cityVirtualEax'> & { nativeEquipmentType: QuantityEquipment; skillQueryId: 80 | 81; difficultyWord: 0 | 2; cityVirtualEax: 0 | 1 | null };
type KernelAudit =
  | { api: 'calculatePatrolSecurityGain'; input: PatrolKernelInput; output: NoEvidence<PatrolSecurityGainReceipt> }
  | { api: 'calculateRecruitmentQuantityProjection'; input: RecruitKernelInput; output: RecruitKernelOutput }
  | { api: 'calculateRecruitmentSecurityArgument'; input: RecruitmentSecurityArgumentInput; output: NoEvidence<RecruitmentSecurityArgumentReceipt> }
  | { api: 'calculateProductionPrice'; input: ProductionPriceInput; output: NoEvidence<ProductionPriceReceipt> }
  | { api: 'calculateProductionQuantity'; input: QuantityKernelInput; output: QuantityKernelOutput };
type DomesticAudit = Omit<DomesticInstantAudit, 'calculation'> & { calculation: Omit<DomesticInstantAudit['calculation'], 'kernels'> & { kernels: KernelAudit[] } };
type MerchantAudit = MerchantTradeAudit & { merchantMerit: 'not-modeled-preserve-existing' };
type Change =
  | { target: 'city'; field: 'gold' | 'food' | 'security' | 'troops' | 'morale'; before: number; after: number }
  | { target: 'city'; field: 'patrolUsedTurn' | 'merchantUsedTurn'; before: Marker; after: Marker }
  | { target: 'corps'; field: 'actionPoints'; before: number; after: number }
  | { target: 'equipment'; equipmentType: QuantityEquipment; before: number; after: number }
  | { target: 'officer'; officerId: string; field: Stat | 'merit'; before: number; after: number }
  | { target: 'officer'; officerId: string; field: 'actedTurn'; before: Marker; after: Marker }
  | { target: 'facility'; facilityId: string; field: 'usedTurn'; before: Marker; after: Marker };
type StepReceipt = { index: number; action: Action; ledgerDigestBefore: string; ledgerDigestAfter: string; changes: Change[]; audit: { kind: 'domestic'; detail: DomesticAudit } | { kind: 'merchant'; detail: MerchantAudit } };
type PieceTimeCapture =
  | { callAddress: '005C6CF8' | '005C6D25'; slotIndex: 0 | 1 | 2; eax: 0 | 1 }
  | { callAddress: '005C6D06'; slotIndex: 0 | 1 | 2; eax: number };
type PieceTimeCallDetail =
  | { callAddress: '005C6CF8'; target: '0047A630'; slotIndex: 0 | 1 | 2; queryId: null }
  | { callAddress: '005C6D06'; target: '00489090'; slotIndex: 0 | 1 | 2; queryId: null }
  | { callAddress: '005C6D25'; target: '004890F0'; slotIndex: 0 | 1 | 2; queryId: 82 };
type PieceTimeOutput = Omit<LegacyPieceCalculation['kernels'][2]['output'], 'nativeEquipmentType' | 'skillQueryId' | 'facilityApplied' | 'trace' | 'callDetails'> & {
  nativeEquipmentType: 5; skillQueryId: 82; facilityApplied: false; trace: PieceTimeCapture[]; callDetails: PieceTimeCallDetail[];
};
type PieceCalculation = Omit<LegacyPieceCalculation, 'facilityApplied' | 'kernels'> & { facilityApplied: false; kernels: [
  LegacyPieceCalculation['kernels'][0],
  { api: 'calculateProductionQuantity'; input: { profile: 'production-quantity-resolved-f32-v1'; nativeEquipmentType: 5 };
    output: { supported: true; profile: 'production-quantity-resolved-f32-v1'; nativeEquipmentType: 5; reason: 'single-item-return-one'; resolvedInputsObserved: false; returnedQuantity: 1 } },
  { api: 'calculateProductionTimeProjection'; input: { profile: 'production-time-observations-v1'; nativeEquipmentType: 5; captures: PieceTimeCapture[] }; output: PieceTimeOutput }
] };
type PieceStartSnapshot = { clock: { date: DateV1; turn: number }; activeForceId: string; corpsId: string; cityId: string;
  officers: { id: string; intelligence: number; hasSkill82: boolean }[];
  facility: { id: string; kind: 'workshop'; level: 1; complete: true }; basePriceWord: number; specialty: boolean; policyDigest: string; productionCatalogDigest: string };
type PieceCompletion = { jobId: string; turn: number; inventoryWrite: Write; rewards: (Omit<Reward, 'attribute'> & { attribute: 'intelligence' })[];
  inventoryReservedBefore: 1; inventoryReservedAfter: 0; officerIds: string[]; facilityId: string; actedTurnAfter: number };
type Job = { id: string; status: 'active' | 'completed'; cityId: string; equipmentType: 5; facilityId: string; officerIds: string[];
  startTurn: number; startDate: DateV1; durationTurns: number; dueTurn: number; dueDate: DateV1; remainingTurns: number; reservedQuantity: 1;
  startSnapshot: PieceStartSnapshot; calculation: PieceCalculation; fees: Fees; completedTurn: number | null; completion: PieceCompletion | null };
type Current = { clock: Clock; ledger: Ledger; jobs: Job[] };
type StartDetail = { jobId: string; startSnapshot: PieceStartSnapshot; calculation: PieceCalculation; fees: Fees;
  reservations: { officerIds: string[]; facilityId: string; jobId: string; inventoryReservedBefore: 0; inventoryReservedAfter: 1 } };
type JobProgress = { jobId: string; remainingBefore: number; remainingAfter: number; statusAfter: 'active' | 'completed' };
type TickDetail = { apRecovery: Write; progress: JobProgress[]; completions: PieceCompletion[] };
type ReceiptCommon = { envelope: Envelope; revisionBefore: number; revisionAfter: number; policyDigest: string;
  catalogDigests: { production: string; merchant: string }; clockBefore: Clock; clockAfter: Clock; currentDigestBefore: string; currentDigestAfter: string;
  scope: 'bounded-shared-city-piece-clock'; rngDraws: 0; techniquePoints: 'not-modeled'; nativeIntegration: false };
type Receipt = ReceiptCommon & ({ kind: 'instant'; detail: { steps: StepReceipt[] } } | { kind: 'piece-start'; detail: StartDetail } | { kind: 'tick'; detail: TickDetail });
type State = { tag: 'san11-bounded-city-piece-clock-state-v1'; schemaVersion: 1; profile: 'bounded-city-economy-piece-clock-v1'; genesis: Scenario;
  revision: number; current: Current; acceptedCommands: { envelope: Envelope; receipt: Receipt }[] };
type ReasonCode =
  | 'invalid-data' | 'invalid-json' | 'duplicate-json-key' | 'invalid-fields' | 'invalid-number' | 'invalid-id' | 'invalid-date' | 'invalid-array' | 'invalid-prototype' | 'duplicate-entity-id'
  | 'unsupported-schema' | 'unsupported-profile' | 'unsupported-policy' | 'unsupported-catalog' | 'unsupported-command' | 'unsupported-city-kind' | 'unsupported-equipment' | 'unsupported-skill'
  | 'unsupported-politics' | 'unsupported-external-state' | 'owner-corps-mismatch' | 'officer-city-force-mismatch' | 'facility-not-present' | 'incomplete-field-unit-snapshot' | 'owner-marked-hostile'
  | 'invalid-marker' | 'invalid-officer-count' | 'invalid-action-count' | 'command-id-conflict' | 'stale-revision' | 'history-limit' | 'candidate-id-collision'
  | 'invalid-page-size' | 'invalid-cursor' | 'unsupported-cursor-version' | 'cursor-state-mismatch' | 'cursor-request-mismatch'
  | 'unknown-city' | 'unknown-officer' | 'unknown-facility' | 'officer-unavailable' | 'officer-already-acted' | 'patrol-already-used' | 'facility-incomplete' | 'wrong-facility-kind' | 'facility-used-this-turn' | 'equipment-locked'
  | 'insufficient-gold' | 'insufficient-action-points' | 'insufficient-food' | 'merchant-absent' | 'city-merchant-already-used' | 'hostile-within-two' | 'zero-value-sale' | 'gold-amount-out-of-range' | 'gold-capacity-exceeded' | 'food-capacity-exceeded' | 'kernel-rejected' | 'writer-cap-overflow' | 'zero-yield'
  | 'officer-reserved-by-job' | 'facility-reserved-by-job' | 'job-history-limit' | 'piece-capacity-unavailable' | 'completion-horizon-exceeded' | 'completion-history-slots' | 'advance-limit-reached' | 'completion-reservation-mismatch'
  | 'state-recomputation-mismatch' | 'history-recomputation-mismatch' | 'receipt-recomputation-mismatch' | 'duplicate-accepted-entry' | 'unexpected-reducer-effect' | 'invariant-mismatch' | 'budget-exceeded' | 'trace-outcome-mismatch' | 'trace-final-mismatch';
type Stage = 'input' | 'rebuild' | 'deduplication' | 'revision' | 'domain' | 'domestic' | 'merchant' | 'invariant' | 'budget' | 'comparison' | 'reservation' | 'piece' | 'tick';
type Failure = { ok: false; committed: false; stage: Stage; reason: ReasonCode; actionIndex: ActionIndex | null; blockingUnitId: string | null; officerId: string | null; facilityId: string | null; jobId: string | null };
type ExecuteResult = Failure | { ok: true; committed: boolean; duplicate: boolean; state: State; receipt: Receipt };
type PreviewResult = Failure | { ok: true; committed: false; duplicate: boolean; baseRevision: number; projectedCurrent: Current; receipt: Receipt };
type CreateOrLoadResult = Failure | { ok: true; state: State };
type InspectResult = Failure | { ok: true; revision: number; current: Current; remainingHistorySlots: number; remainingAdvances: number; reservedCompletionSlots: number; scope: 'bounded-shared-city-piece-clock' };
type SaveEnvelope = { tag: 'san11-bounded-city-piece-clock-save-v1'; state: State };
type SaveResult = Failure | { ok: true; serialized: string };
type LegalCursor = { version: 1; orderVersion: 'facility-trade-piece-advance-order-v1'; stateDigest: string; requestDigest: string; revision: number; nextIndex: number };
type LegalRequest = { requestId: string; expectedRevision: number; domesticOfficerIds: string[] | null; merchantRequests: { officerId: string; foodAmount: number }[]; cursor: LegalCursor | null; pageSize: 1 | 2 | 3 | 4 };
type LegalSuccess = { ok: true; baseRevision: number; stateDigest: string; requestDigest: string; totalCandidates: number; startIndex: number; endIndexExclusive: number; nextCursor: LegalCursor | null; completePage: true; enumerationComplete: boolean; globalCompleteness: false; candidates: { globalOrdinal: number; envelope: Envelope; result: PreviewResult }[]; notEnumerated: ['other-officer-selections', 'other-food-amounts', 'multi-action-batches'] };
type LegalResult = Failure | LegalSuccess;
type ReplayOutcome = { ok: true; duplicate: boolean; receipt: Receipt } | Failure;
type Trace = { tag: 'san11-bounded-city-piece-clock-trace-v1'; scenario: Scenario; attempts: { envelope: Envelope; expected: ReplayOutcome | null }[]; expectedFinalState: State | null };
type ReplayResult = { ok: true; state: State; outcomes: ReplayOutcome[] } | (Failure & { index: number | null; state: null });

export type BoundedCityPieceClockScenarioV1 = DeepRO<Scenario>;
export type BoundedCityPieceClockStateV1 = DeepRO<State>;
export type BoundedCityPieceClockPolicyV1 = DeepRO<Policy>;
export type BoundedCityPieceClockLedgerV1 = DeepRO<Ledger>;
export type BoundedCityPieceClockActionV1 = DeepRO<Action>;
export type BoundedCityPieceClockEnvelopeV1 = DeepRO<Envelope>;
export type BoundedCityPieceClockReceiptV1 = DeepRO<Receipt>;
export type BoundedCityPieceClockStepReceiptV1 = DeepRO<StepReceipt>;
export type BoundedCityPieceClockKernelAuditV1 = DeepRO<KernelAudit>;
export type BoundedCityPieceClockFailureV1 = DeepRO<Failure>;
export type BoundedCityPieceClockExecuteResultV1 = DeepRO<ExecuteResult>;
export type BoundedCityPieceClockPreviewResultV1 = DeepRO<PreviewResult>;
export type BoundedCityPieceClockCreateOrLoadResultV1 = DeepRO<CreateOrLoadResult>;
export type BoundedCityPieceClockInspectResultV1 = DeepRO<InspectResult>;
export type BoundedCityPieceClockSaveResultV1 = DeepRO<SaveResult>;
export type BoundedCityPieceClockSaveEnvelopeV1 = DeepRO<SaveEnvelope>;
export type BoundedCityPieceClockLegalRequestV1 = DeepRO<LegalRequest>;
export type BoundedCityPieceClockLegalCursorV1 = DeepRO<LegalCursor>;
export type BoundedCityPieceClockLegalResultV1 = DeepRO<LegalResult>;
export type BoundedCityPieceClockTraceV1 = DeepRO<Trace>;
export type BoundedCityPieceClockReplayOutcomeV1 = DeepRO<ReplayOutcome>;
export type BoundedCityPieceClockReplayResultV1 = DeepRO<ReplayResult>;

export type BoundedCityPieceClockClockV1 = DeepRO<Clock>;
export type BoundedCityPieceClockCurrentV1 = DeepRO<Current>;
export type BoundedCityPieceClockCommandV1 = DeepRO<Command>;
export type BoundedCityPieceClockPieceCalculationV1 = DeepRO<PieceCalculation>;
export type BoundedCityPieceClockPieceStartSnapshotV1 = DeepRO<PieceStartSnapshot>;
export type BoundedCityPieceClockPieceCompletionV1 = DeepRO<PieceCompletion>;
export type BoundedCityPieceClockJobV1 = DeepRO<Job>;
export type BoundedCityPieceClockStartDetailV1 = DeepRO<StartDetail>;
export type BoundedCityPieceClockJobProgressV1 = DeepRO<JobProgress>;
export type BoundedCityPieceClockTickDetailV1 = DeepRO<TickDetail>;

const PROFILE = 'bounded-city-economy-piece-clock-v1' as const;
const STATE_TAG = 'san11-bounded-city-piece-clock-state-v1' as const;
const SAVE_TAG = 'san11-bounded-city-piece-clock-save-v1' as const;
const TRACE_TAG = 'san11-bounded-city-piece-clock-trace-v1' as const;
const ORDER = 'facility-trade-piece-advance-order-v1' as const;
const EQUIPMENT: Equipment[] = [1, 2, 3, 4, 5];
const QUANTITY: QuantityEquipment[] = [1, 2, 3, 4];
const STATS: Stat[] = ['leadership', 'charm', 'intelligence', 'politics', 'war'];
const MAX = 1_000_000_000;
const errors = new WeakMap<object, Failure>();
function failure(reason: ReasonCode, stage: Stage = 'input', actionIndex: number | null = null, blockingUnitId: string | null = null,
  officerId: string | null = null, facilityId: string | null = null, jobId: string | null = null): Failure {
  return { ok: false, committed: false, stage, reason, actionIndex: actionIndex as ActionIndex | null,
    blockingUnitId: reason === 'hostile-within-two' ? blockingUnitId : null,
    officerId: reason === 'officer-reserved-by-job' ? officerId : null,
    facilityId: reason === 'facility-reserved-by-job' ? facilityId : null,
    jobId: reason === 'officer-reserved-by-job' || reason === 'facility-reserved-by-job' ? jobId : null };
}
function stop(reason: ReasonCode, stage: Stage = 'input', actionIndex: number | null = null, blockingUnitId: string | null = null,
  officerId: string | null = null, facilityId: string | null = null, jobId: string | null = null): never {
  const signal = {}; errors.set(signal, failure(reason, stage, actionIndex, blockingUnitId, officerId, facilityId, jobId)); throw signal;
}
function caught(e: unknown): Failure { return e !== null && typeof e === 'object' ? errors.get(e) ?? failure('invalid-data') : failure('invalid-data'); }
function freeze<T>(value: T): DeepRO<T> {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) { for (const item of Object.values(value)) freeze(item); Object.freeze(value); }
  return value as DeepRO<T>;
}
function clone<T>(value: T): T { return JSON.parse(canonicalBoundedCityJson(value)) as T; }
function same(a: unknown, b: unknown): boolean { return canonicalBoundedCityJson(a) === canonicalBoundedCityJson(b); }
type Hash = { update(text: string, encoding: 'utf8'): Hash; digest(encoding: 'hex'): string };
const nodeRuntime = globalThis as { process?: { getBuiltinModule?: (name: string) => { createHash(name: 'sha256'): Hash } } };
const nodeCrypto = nodeRuntime.process?.getBuiltinModule?.('node:crypto');
function digest(value: unknown): string { if (!nodeCrypto) stop('invalid-data'); return nodeCrypto.createHash('sha256').update(canonicalBoundedCityJson(value), 'utf8').digest('hex'); }
function detach(value: unknown): unknown {
  const result = detachBoundedCityData(value); if (!result.ok) stop(result.reason, result.reason === 'budget-exceeded' ? 'budget' : 'input'); return result.value;
}
function budget(value: unknown): void { if (!boundedCityJsonFits(value)) stop('budget-exceeded', 'budget'); }
function object(value: unknown, keys: readonly string[], reason: ReasonCode = 'invalid-fields'): Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) stop(reason);
  const record = value as Record<string, unknown>, actual = Object.keys(record);
  if (actual.length !== keys.length || actual.some(k => !keys.includes(k)) || keys.some(k => !Object.hasOwn(record, k))) stop(reason);
  return record;
}
function integer(value: unknown, max = Number.MAX_SAFE_INTEGER, min = 0, reason: ReasonCode = 'invalid-number'): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || Object.is(value, -0) || value < min || value > max) stop(reason); return value;
}
function literal<T extends string | number | boolean>(value: unknown, expected: T, reason: ReasonCode = 'invalid-data'): T { if (value !== expected) stop(reason); return expected; }
function choice<T extends string | number>(value: unknown, options: readonly T[], reason: ReasonCode = 'invalid-data'): T { if (!options.includes(value as T)) stop(reason); return value as T; }
function id(value: unknown, max = 64, reason: ReasonCode = 'invalid-id'): string { if (typeof value !== 'string' || value.length > max || !/^[A-Za-z0-9][A-Za-z0-9_.:-]*$/.test(value)) stop(reason); return value; }
function boolean(value: unknown): boolean { if (typeof value !== 'boolean') stop('invalid-data'); return value; }
function array(value: unknown, max: number, min = 0, reason: ReasonCode = 'invalid-array'): unknown[] { if (!Array.isArray(value) || value.length < min || value.length > max) stop(reason); return value; }
function unique(values: readonly unknown[], reason: ReasonCode = 'duplicate-entity-id'): void { if (new Set(values).size !== values.length) stop(reason); }
function marker(value: unknown, turn: number): void { if (value !== null) integer(value, turn, 0, 'invalid-marker'); }
function position(value: unknown): void { const p = object(value, ['q', 'r']); integer(p.q, 1_000_000, -1_000_000); integer(p.r, 1_000_000, -1_000_000); }
function progress(value: unknown, turn: number, hasId: boolean): void {
  const p = object(value, hasId ? ['id', 'xp', 'merit', 'actedTurn', 'reservationJobId'] : ['xp', 'merit', 'actedTurn']); if (hasId) { id(p.id); if (p.reservationJobId !== null) jobId(p.reservationJobId); }
  const xp = object(p.xp, STATS); for (const stat of STATS) integer(xp[stat], MAX); integer(p.merit, MAX); marker(p.actedTurn, turn);
}
function jobId(value: unknown): string {
  if (typeof value !== 'string' || !/^job:[A-Za-z0-9][A-Za-z0-9_.:-]{0,63}$/.test(value)) stop('invalid-id'); return value;
}
function date(value: unknown): DateV1 {
  const d = object(value, ['year', 'month', 'day'], 'invalid-date'); integer(d.year, 9999, 1, 'invalid-date'); integer(d.month, 12, 1, 'invalid-date'); choice(d.day, [1, 11, 21], 'invalid-date'); return d as unknown as DateV1;
}
function advanceDate(value: DateV1, count: number): DateV1 {
  let next = clone(value);
  for (let i = 0; i < count; i++) {
    if (next.day === 1) next.day = 11;
    else if (next.day === 11) next.day = 21;
    else { next.day = 1; if (next.month < 12) next.month++; else { next.month = 1; next.year++; } }
    if (next.year > 9999) stop('invalid-date');
  }
  return next;
}
/** Private copies; neither imported JSON nor any caller object is frozen by this module. */
export const BOUNDED_CITY_PIECE_CLOCK_POLICY: BoundedCityPieceClockPolicyV1 = freeze(clone(policyData) as unknown as Policy);
const MERCHANT_CATALOG = freeze(clone(merchantCatalogData));
function scenario(value: unknown): Scenario {
  const s = object(value, ['schemaVersion', 'profile', 'episodeId', 'clock', 'advanceLimit', 'activeForceId', 'corps', 'city', 'officers', 'facilities', 'domestic', 'merchant', 'productionCatalog', 'merchantCatalog', 'policy'], 'unsupported-external-state');
  literal(s.schemaVersion, 1, 'unsupported-schema'); literal(s.profile, PROFILE, 'unsupported-profile'); id(s.episodeId); const force = id(s.activeForceId);
  const clock = object(s.clock, ['date', 'turn']), date = object(clock.date, ['year', 'month', 'day'], 'invalid-date');
  integer(date.year, 9999, 1, 'invalid-date'); integer(date.month, 12, 1, 'invalid-date'); choice(date.day, [1, 11, 21], 'invalid-date'); const turn = integer(clock.turn); const advanceLimit = integer(s.advanceLimit, 12, 1); integer(turn + advanceLimit); advanceDate(date as unknown as DateV1, advanceLimit);
  const corps = object(s.corps, ['id', 'forceId', 'initialActionPoints']); id(corps.id); id(corps.forceId); integer(corps.initialActionPoints, 255);
  const city = object(s.city, ['id', 'kind', 'ownerForceId', 'position', 'goldCapacity', 'foodCapacity', 'troopCapacity', 'moraleCap', 'initial', 'inventory']);
  const cityId = id(city.id); literal(city.kind, 'city', 'unsupported-city-kind'); id(city.ownerForceId); position(city.position); literal(city.goldCapacity, MAX);
  integer(city.foodCapacity, MAX); integer(city.troopCapacity, 1_000_000); integer(city.moraleCap, 255, 20);
  if (city.ownerForceId !== force || corps.forceId !== force) stop('owner-corps-mismatch');
  const initial = object(city.initial, ['gold', 'food', 'security', 'troops', 'morale', 'patrolUsedTurn', 'merchantUsedTurn']);
  integer(initial.gold, MAX); integer(initial.food, city.foodCapacity as number); integer(initial.security, 100); integer(initial.troops, city.troopCapacity as number); integer(initial.morale, city.moraleCap as number);
  marker(initial.patrolUsedTurn, turn); marker(initial.merchantUsedTurn, turn);
  const inventory = object(city.inventory, ['1', '2', '3', '4', '5']);
  for (const equipment of EQUIPMENT) { const stock = object(inventory[equipment], ['quantity', 'capacity']); integer(stock.capacity, 1_000_000); integer(stock.quantity, stock.capacity as number); }
  const officers = array(s.officers, 8, 1, 'invalid-officer-count');
  const officerIds = officers.map(value => {
    const o = object(value, ['id', 'forceId', 'cityId', 'available', 'leadership', 'charm', 'intelligence', 'politics', 'skillIds', 'initial']);
    const oid = id(o.id); id(o.forceId); id(o.cityId); if (o.forceId !== force || o.cityId !== cityId) stop('officer-city-force-mismatch'); boolean(o.available);
    for (const attr of ['leadership', 'charm', 'intelligence']) integer(o[attr], 255); integer(o.politics, 100, 20, 'unsupported-politics');
    const skills = array(o.skillIds, 4); for (const skill of skills) choice(skill, [79, 80, 81, 82], 'unsupported-skill'); unique(skills); progress(o.initial, turn, false); return oid;
  }); unique(officerIds);
  let workshops = 0;
  const facilities = array(s.facilities, 8, 1).map(value => {
    const f = object(value, ['id', 'cityId', 'kind', 'level', 'complete', 'initialUsedTurn']); const fid = id(f.id); id(f.cityId); if (f.cityId !== cityId) stop('facility-not-present');
    choice(f.kind, ['barracks', 'forge', 'stable', 'workshop'], 'invalid-data'); choice(f.level, [1, 2, 3]); boolean(f.complete); marker(f.initialUsedTurn, turn);
    if (f.kind === 'workshop') { workshops++; literal(f.level, 1); literal(f.complete, true); } return fid;
  }); unique(facilities); if (workshops !== 1) stop('invalid-data');
  const domestic = object(s.domestic, ['pressureActive', 'difficulty', 'controller', 'unlockedEquipmentTypes', 'specialtyEquipmentTypes']); boolean(domestic.pressureActive); choice(domestic.difficulty, ['normal', 'super']); choice(domestic.controller, ['player', 'ai']);
  for (const key of ['unlockedEquipmentTypes', 'specialtyEquipmentTypes']) { const types = array(domestic[key], 5); for (const t of types) choice(t, EQUIPMENT, 'unsupported-equipment'); unique(types); }
  const merchant = object(s.merchant, ['present', 'uiTradePrice', 'hostileForceIds', 'completeFieldUnits', 'fieldUnits']); boolean(merchant.present); choice(merchant.uiTradePrice, [3, 4, 5, 6, 7]);
  literal(merchant.completeFieldUnits, true, 'incomplete-field-unit-snapshot'); const hostile = array(merchant.hostileForceIds, 16).map(v => id(v)); unique(hostile); if (hostile.includes(force)) stop('owner-marked-hostile');
  unique(array(merchant.fieldUnits, 16).map(value => { const u = object(value, ['id', 'forceId', 'position']); id(u.forceId); position(u.position); return id(u.id); }));
  const catalog = object(s.productionCatalog, ['id', 'version', 'entries'], 'unsupported-catalog'); id(catalog.id); literal(catalog.version, 1, 'unsupported-catalog'); const entries = object(catalog.entries, ['1', '2', '3', '4', '5'], 'unsupported-catalog');
  for (const equipment of EQUIPMENT) integer(object(entries[equipment], ['basePriceWord'], 'unsupported-catalog').basePriceWord, 65535);
  if (!same(s.merchantCatalog, MERCHANT_CATALOG)) stop('unsupported-catalog'); if (!same(s.policy, BOUNDED_CITY_PIECE_CLOCK_POLICY)) stop('unsupported-policy');
  return s as unknown as Scenario;
}
function initialState(genesis: Scenario): State {
  const c = genesis.city, initial = c.initial;
  const stock = (t: Equipment) => ({ quantity: c.inventory[t].quantity, reserved: 0 });
  const ledger: Ledger = { ...clone(initial), actionPoints: genesis.corps.initialActionPoints,
    inventory: { 1: stock(1), 2: stock(2), 3: stock(3), 4: stock(4), 5: stock(5) },
    officers: genesis.officers.map(o => ({ id: o.id, ...clone(o.initial), reservationJobId: null })),
    facilities: genesis.facilities.map(f => ({ id: f.id, usedTurn: f.initialUsedTurn, reservationJobId: null })) };
  const current: Current = { clock: { ...clone(genesis.clock), advancedCount: 0 }, ledger, jobs: [] };
  return { tag: STATE_TAG, schemaVersion: 1, profile: PROFILE, genesis, revision: 0, current, acceptedCommands: [] };
}
function ledgerInvariant(s: Scenario, clock: Clock, value: unknown): asserts value is Ledger {
  const l = object(value, ['gold', 'food', 'actionPoints', 'security', 'troops', 'morale', 'patrolUsedTurn', 'merchantUsedTurn', 'inventory', 'officers', 'facilities']);
  integer(l.gold, MAX); integer(l.food, s.city.foodCapacity); integer(l.actionPoints, 255); integer(l.security, 100); integer(l.troops, s.city.troopCapacity); integer(l.morale, s.city.moraleCap); marker(l.patrolUsedTurn, clock.turn); marker(l.merchantUsedTurn, clock.turn);
  const inventory = object(l.inventory, ['1', '2', '3', '4', '5']);
  for (const t of EQUIPMENT) { const stock = object(inventory[t], ['quantity', 'reserved']); integer(stock.quantity, s.city.inventory[t].capacity); integer(stock.reserved, t === 5 ? 1 : 0); if ((stock.quantity as number) + (stock.reserved as number) > s.city.inventory[t].capacity) stop('invariant-mismatch', 'invariant'); }
  const people = array(l.officers, s.officers.length, s.officers.length), facilities = array(l.facilities, s.facilities.length, s.facilities.length);
  people.forEach((o, i) => { progress(o, clock.turn, true); if ((o as { id: string }).id !== s.officers[i]!.id) stop('invariant-mismatch', 'invariant'); });
  facilities.forEach((value, i) => { const f = object(value, ['id', 'usedTurn', 'reservationJobId']); if (f.id !== s.facilities[i]!.id) stop('invariant-mismatch', 'invariant'); marker(f.usedTurn, clock.turn); if (f.reservationJobId !== null) jobId(f.reservationJobId); });
}
/** The outer command remains an opaque safe object until duplicate/stale/history gates. */
function envelope(value: unknown): Envelope {
  const e = object(value, ['id', 'expectedRevision', 'command']); id(e.id); integer(e.expectedRevision);
  if (e.command === null || typeof e.command !== 'object' || Array.isArray(e.command)) stop('invalid-fields');
  return e as unknown as Envelope;
}
function validateCommand(e: Envelope): void {
  const c = e.command;
  if (c.type === 'AdvanceSharedCityTurn') { object(c, ['type']); return; }
  if (c.type === 'StartPieceProduction') {
    const a = object(c, ['type', 'cityId', 'officerIds', 'facilityId', 'equipmentType']); id(a.cityId); id(a.facilityId); literal(a.equipmentType, 5, 'unsupported-equipment');
    unique(array(a.officerIds, 3, 1, 'invalid-officer-count').map(v => id(v)), 'invalid-officer-count'); return;
  }
  if (c.type !== 'ExecuteCityActions') stop('unsupported-command', 'domain');
  const command = object(c, ['type', 'actions']); const actions = array(command.actions, 4, 1, 'invalid-action-count');
  // Validate the complete batch before evaluating any candidate step.
  actions.forEach((value, index) => {
    try {
      if (value === null || typeof value !== 'object' || Array.isArray(value)) stop('invalid-fields');
      const type = (value as { type?: unknown }).type;
      if (type === 'BuyFood' || type === 'SellFood') { const a = object(value, ['type', 'cityId', 'officerId', 'foodAmount']); id(a.cityId); id(a.officerId); integer(a.foodAmount, MAX, 1); }
      else {
        const keys = type === 'Patrol' ? ['type', 'cityId', 'officerIds'] : type === 'Recruit' ? ['type', 'cityId', 'officerIds', 'facilityId'] : type === 'Produce' ? ['type', 'cityId', 'officerIds', 'facilityId', 'equipmentType'] : null;
        if (!keys) stop('unsupported-command'); const a = object(value, keys); id(a.cityId); unique(array(a.officerIds, 3, 1, 'invalid-officer-count').map(v => id(v)), 'invalid-officer-count');
        if (type !== 'Patrol') id(a.facilityId); if (type === 'Produce') choice(a.equipmentType, QUANTITY, 'unsupported-equipment');
      }
    } catch (error) { const f = caught(error); stop(f.reason, 'domain', index); }
  });
}
/** One ordered actor loop: an earlier actor's acted failure precedes a later lock. */
function rootGuard(s: Scenario, clock: Clock, l: Ledger, action: Action | StartCommand, index: number | null): void {
  if (action.cityId !== s.city.id) stop('unknown-city', 'domain', index);
  const ids = 'officerIds' in action ? action.officerIds : [action.officerId];
  for (const oid of ids) {
    const i = s.officers.findIndex(o => o.id === oid); if (i < 0) stop('unknown-officer', 'domain', index);
    const facts = s.officers[i]!, row = l.officers[i]!;
    if (facts.cityId !== s.city.id || facts.forceId !== s.activeForceId) stop('officer-city-force-mismatch', 'domain', index);
    if (!facts.available) stop('officer-unavailable', 'domain', index);
    if (row.reservationJobId !== null) stop('officer-reserved-by-job', 'reservation', index, null, oid, null, row.reservationJobId);
    if (row.actedTurn === clock.turn) stop('officer-already-acted', 'domain', index);
  }
  if ('facilityId' in action) {
    const i = s.facilities.findIndex(f => f.id === action.facilityId); if (i < 0) stop('unknown-facility', 'domain', index);
    const facts = s.facilities[i]!, row = l.facilities[i]!;
    if (facts.cityId !== s.city.id) stop('facility-not-present', 'domain', index);
    if (!facts.complete) stop('facility-incomplete', 'domain', index);
    const kind = action.type === 'Recruit' ? 'barracks' : action.type === 'StartPieceProduction' ? 'workshop' : action.equipmentType === 4 ? 'stable' : 'forge';
    if (facts.kind !== kind) stop('wrong-facility-kind', 'domain', index);
    if (row.reservationJobId !== null) stop('facility-reserved-by-job', 'reservation', index, null, null, facts.id, row.reservationJobId);
    if (row.usedTurn === clock.turn) stop('facility-used-this-turn', 'domain', index);
  }
}
function domesticFrame(s: Scenario, l: Ledger): DomesticInstantFrame {
  return { activeForceId: s.activeForceId, corps: { actionPoints: l.actionPoints },
    city: { id: s.city.id, gold: l.gold, security: l.security, troops: l.troops, troopCapacity: s.city.troopCapacity, morale: l.morale, moraleCap: s.city.moraleCap, patrolUsedTurn: l.patrolUsedTurn,
      inventory: { 1: { quantity: l.inventory[1].quantity, capacity: s.city.inventory[1].capacity, reserved: l.inventory[1].reserved }, 2: { quantity: l.inventory[2].quantity, capacity: s.city.inventory[2].capacity, reserved: l.inventory[2].reserved }, 3: { quantity: l.inventory[3].quantity, capacity: s.city.inventory[3].capacity, reserved: l.inventory[3].reserved }, 4: { quantity: l.inventory[4].quantity, capacity: s.city.inventory[4].capacity, reserved: l.inventory[4].reserved } } },
    officers: s.officers.map((o, i) => ({ id: o.id, forceId: o.forceId, cityId: o.cityId, available: o.available, leadership: o.leadership, charm: o.charm, intelligence: o.intelligence, skillIds: [...o.skillIds], xp: clone(l.officers[i]!.xp), merit: l.officers[i]!.merit, actedTurn: l.officers[i]!.actedTurn, reservationJobId: l.officers[i]!.reservationJobId })),
    facilities: s.facilities.map((f, i) => ({ id: f.id, cityId: f.cityId, kind: f.kind, level: f.level, complete: f.complete, usedTurn: l.facilities[i]!.usedTurn, reservationJobId: l.facilities[i]!.reservationJobId })),
    pressureActive: s.domestic.pressureActive, difficulty: s.domestic.difficulty, controller: s.domestic.controller,
    unlockedEquipmentTypes: [...s.domestic.unlockedEquipmentTypes], specialtyEquipmentTypes: [...s.domestic.specialtyEquipmentTypes], productionPrices: { 1: clone(s.productionCatalog.entries[1]), 2: clone(s.productionCatalog.entries[2]), 3: clone(s.productionCatalog.entries[3]), 4: clone(s.productionCatalog.entries[4]) }, policies: clone(s.policy.domestic) };
}
function merchantFrame(s: Scenario, l: Ledger): MerchantTradeFrame {
  return { activeForceId: s.activeForceId, hostileForceIds: [...s.merchant.hostileForceIds], corps: { id: s.corps.id, forceId: s.corps.forceId, actionPoints: l.actionPoints },
    city: { id: s.city.id, kind: 'city', ownerForceId: s.city.ownerForceId, position: clone(s.city.position), gold: l.gold, goldCapacity: MAX, food: l.food, foodCapacity: s.city.foodCapacity, merchantPresent: s.merchant.present, uiTradePrice: s.merchant.uiTradePrice, merchantUsedTurn: l.merchantUsedTurn },
    officers: s.officers.map((o, i) => ({ id: o.id, forceId: o.forceId, cityId: o.cityId, available: o.available, politics: o.politics, politicsXp: l.officers[i]!.xp.politics, actedTurn: l.officers[i]!.actedTurn })),
    completeFieldUnits: true, fieldUnits: clone(s.merchant.fieldUnits), policies: clone(s.policy.merchant), catalog: clone(s.merchantCatalog) };
}
function reducerReason(reason: string): ReasonCode {
  const aliases: Record<string, ReasonCode> = { 'insufficient-ap': 'insufficient-action-points', 'officer-not-member': 'officer-city-force-mismatch', 'officer-not-present': 'officer-city-force-mismatch', 'city-mismatch': 'unknown-city', 'officer-not-found': 'unknown-officer' };
  const mapped = Object.hasOwn(aliases, reason) ? aliases[reason] : undefined; if (mapped) return mapped;
  const supported: ReasonCode[] = ['unknown-city', 'patrol-already-used', 'unknown-officer', 'officer-unavailable', 'officer-already-acted', 'unknown-facility', 'facility-not-present', 'facility-incomplete', 'wrong-facility-kind', 'facility-used-this-turn', 'equipment-locked', 'kernel-rejected', 'writer-cap-overflow', 'zero-yield', 'insufficient-gold', 'unsupported-city-kind', 'owner-corps-mismatch', 'merchant-absent', 'city-merchant-already-used', 'officer-city-force-mismatch', 'invalid-number', 'unsupported-politics', 'insufficient-action-points', 'zero-value-sale', 'gold-amount-out-of-range', 'food-capacity-exceeded', 'insufficient-food', 'gold-capacity-exceeded', 'hostile-within-two'];
  return supported.includes(reason as ReasonCode) ? reason as ReasonCode : 'unexpected-reducer-effect';
}
function signed(value: unknown): void { integer(value, Number.MAX_SAFE_INTEGER, -Number.MAX_SAFE_INTEGER); }
function bit(value: unknown): void { choice(value, [0, 1]); }
function factor(value: unknown): void { choice(value, ['3F800000', '3F99999A', '3FC00000']); }
function nullable(value: unknown, visit: (x: unknown) => void): void { if (value !== null) visit(value); }
function writeAudit(value: unknown): void {
  const w = object(value, ['before', 'requested', 'returned', 'actualDelta', 'after', 'cap', 'discarded', 'policyId']);
  integer(w.before, MAX); integer(w.after, MAX); integer(w.cap, MAX); for (const k of ['requested', 'returned', 'actualDelta', 'discarded']) signed(w[k]); id(w.policyId);
}
/** Narrow only the new root's reachable audits; the old kernel and legacy DTOs stay unchanged. */
function kernelAudit(value: unknown): void {
  const k = object(value, ['api', 'input', 'output']);
  if (k.api === 'calculatePatrolSecurityGain') {
    const i = object(k.input, ['profile', 'resolvedLeadershipSlots', 'publicOrderByte', 'pressureHelperEax']); literal(i.profile, 'patrol-security-gain-stable-v1'); array(i.resolvedLeadershipSlots, 3, 1).forEach(x => integer(x, 255)); integer(i.publicOrderByte, 100); bit(i.pressureHelperEax);
    const o = object(k.output, ['supported', 'profile', 'normalizedLeadershipSlots', 'publicOrderByte', 'pressureHelperEax', 'sumLeadership', 'baseGain', 'afterPressure', 'returnedDelta', 'pressureApplied', 'capBranch']); literal(o.supported, true); literal(o.profile, i.profile as string);
    const slots = array(o.normalizedLeadershipSlots, 3, 3); integer(slots[0], 255); slots.slice(1).forEach(v => nullable(v, x => integer(x, 255)));
    integer(o.publicOrderByte, 100); bit(o.pressureHelperEax); integer(o.sumLeadership, 765); for (const f of ['baseGain', 'afterPressure', 'returnedDelta']) integer(o[f]); boolean(o.pressureApplied); boolean(o.capBranch);
  } else if (k.api === 'calculateRecruitmentSecurityArgument') {
    const i = object(k.input, ['profile', 'savedCharmSum', 'savedTroopReturnU32']); literal(i.profile, 'recruitment-security-argument-v1'); integer(i.savedCharmSum, 765); integer(i.savedTroopReturnU32, 0xffffffff);
    const o = object(k.output, ['profile', 'savedCharmSum', 'savedTroopReturnU32', 'supported', 'signedTroopReturn', 'divisor', 'quotientSigned', 'remainderSigned', 'securityDeltaSigned', 'securityDeltaU32']);
    literal(o.supported, true); literal(o.profile, i.profile as string); integer(o.savedCharmSum, 765); integer(o.savedTroopReturnU32, 0xffffffff); integer(o.signedTroopReturn, 0x7fffffff, -0x80000000); integer(o.divisor, 865, 100); for (const f of ['quotientSigned', 'remainderSigned', 'securityDeltaSigned']) signed(o[f]); integer(o.securityDeltaU32, 0xffffffff);
  } else if (k.api === 'calculateProductionPrice') {
    const i = object(k.input, ['profile', 'savedBasePriceWord', 'specialtyHelperEax']); literal(i.profile, 'production-price-resolved-v1'); integer(i.savedBasePriceWord, 65535); bit(i.specialtyHelperEax);
    const o = object(k.output, ['supported', 'profile', 'savedBasePriceWord', 'specialtyHelperEax', 'specialtyResultAl', 'discountApplied', 'returnedPrice']); literal(o.supported, true); literal(o.profile, i.profile as string); integer(o.savedBasePriceWord, 65535); bit(o.specialtyHelperEax); bit(o.specialtyResultAl); boolean(o.discountApplied); integer(o.returnedPrice, 65535);
  } else if (k.api === 'calculateProductionQuantity') {
    if (k.input === null || typeof k.input !== 'object' || Array.isArray(k.input)) stop('invalid-fields'); const raw = k.input as Record<string, unknown>;
    const i = object(raw, raw.difficultyWord === 2 ? ['profile', 'nativeEquipmentType', 'slots', 'resolvedFacilityFactorBits', 'difficultyWord', 'cityVirtualEax'] : ['profile', 'nativeEquipmentType', 'slots', 'resolvedFacilityFactorBits', 'difficultyWord']);
    literal(i.profile, 'production-quantity-resolved-f32-v1'); choice(i.nativeEquipmentType, QUANTITY); factor(i.resolvedFacilityFactorBits); choice(i.difficultyWord, [0, 2]); if (i.difficultyWord === 2) bit(i.cityVirtualEax);
    const slots = array(i.slots, 3, 3); let present = 0; for (const slot of slots) if (slot !== null) { const s = object(slot, ['intelligenceGetterEax', 'skillHelperEax']); integer(s.intelligenceGetterEax, 255); bit(s.skillHelperEax); present++; } if (!present) stop('invalid-data');
    const o = object(k.output, ['supported', 'profile', 'nativeEquipmentType', 'reason', 'resolvedInputsObserved', 'slots', 'validSlotCount', 'intelligenceSum', 'intelligenceMax', 'skillQueryId', 'skillApplied', 'baseQuantity', 'skillAdjustedQuantity', 'resolvedFacilityFactorBits', 'convertedQuantity', 'difficultyWord', 'cityVirtualObserved', 'cityVirtualEax', 'superApplied', 'returnedQuantity']);
    literal(o.supported, true); literal(o.profile, i.profile as string); choice(o.nativeEquipmentType, QUANTITY); literal(o.reason, 'resolved-quantity'); literal(o.resolvedInputsObserved, true); integer(o.validSlotCount, 3, 1); integer(o.intelligenceSum, 765); integer(o.intelligenceMax, 255); choice(o.skillQueryId, [80, 81]);
    array(o.slots, 3, 3).forEach(slot => { if (slot !== null) { const s = object(slot, ['intelligenceGetterEax', 'intelligenceAl', 'skillHelperEax']); integer(s.intelligenceGetterEax, 255); integer(s.intelligenceAl, 255); bit(s.skillHelperEax); } });
    for (const f of ['baseQuantity', 'skillAdjustedQuantity', 'convertedQuantity', 'returnedQuantity']) integer(o[f], 0x7fffffff); factor(o.resolvedFacilityFactorBits); choice(o.difficultyWord, [0, 2]); for (const f of ['skillApplied', 'cityVirtualObserved', 'superApplied']) boolean(o[f]);
    if (i.difficultyWord === 0) { if (o.cityVirtualEax !== null) stop('invalid-data'); literal(o.cityVirtualObserved, false); } else { bit(o.cityVirtualEax); literal(o.cityVirtualObserved, true); }
  } else if (k.api === 'calculateRecruitmentQuantityProjection') {
    const i = object(k.input, ['profile', 'captures', 'savedSecurityByte', 'resolvedFacilityFactorBits', 'difficultyWord']); literal(i.profile, 'recruitment-quantity-observations-f32-v1'); integer(i.savedSecurityByte, 100); factor(i.resolvedFacilityFactorBits); choice(i.difficultyWord, [0, 2]);
    const captures = array(i.captures, 19, 1), parsed: Record<string, unknown>[] = []; let cursor = 0;
    const consume = (address: string, slot: number | null, kind: 'one' | 'bit' | 'attribute' | 'troops'): void => {
      const c = object(captures[cursor++], slot === null ? ['callAddress', 'eax'] : ['callAddress', 'slotIndex', 'eax']); literal(c.callAddress, address); if (slot !== null) literal(c.slotIndex, slot);
      if (kind === 'one') literal(c.eax, 1); else if (kind === 'bit') bit(c.eax); else integer(c.eax, kind === 'attribute' ? 255 : 1_000_000); parsed.push(c);
    };
    for (const address of ['005C3619', '005C3630', '005C3643', '005C364B']) consume(address, null, 'one');
    for (let slot = 0; slot < 3; slot++) { consume('005C367B', slot, 'bit'); if (parsed[parsed.length - 1]!.eax === 1) { consume('005C3689', slot, 'attribute'); consume('005C36AA', slot, 'bit'); } }
    const factorIndex = parsed.length; if (i.difficultyWord === 2) consume('005C3725', null, 'bit'); consume('005C3738', null, 'bit'); consume('005C374E', null, 'troops'); consume('005C3757', null, 'troops');
    const o = object(k.output, ['supported', 'profile', 'reason', 'returnedValue', 'rawEaxU32', 'slots', 'charismaSum', 'validSlotCount', 'skillParameter', 'baseQuantity', 'integerQuantity', 'savedSecurityByte', 'resolvedFacilityFactorBits', 'difficultyWord', 'convertedQuantity', 'cityVirtualEax', 'superApplied', 'afterSuperU32', 'pressureEax', 'pressureApplied', 'afterPressureU32', 'firstTroopsEax', 'firstCapacityEax', 'firstSumU32', 'capacityFallbackApplied', 'secondTroopsEax', 'secondCapacityEax', 'trace', 'callDetails']);
    literal(o.supported, true); literal(o.profile, i.profile as string); literal(o.reason, 'captured-quantity-projection'); boolean(o.capacityFallbackApplied);
    if (o.capacityFallbackApplied) { consume('005C3764', null, 'troops'); consume('005C376B', null, 'troops'); integer(o.secondTroopsEax, 1_000_000); integer(o.secondCapacityEax, 1_000_000); }
    else if (o.secondTroopsEax !== null || o.secondCapacityEax !== null) stop('invalid-data');
    if (cursor !== captures.length || !same(o.trace, captures)) stop('invalid-data');
    integer(o.returnedValue, 0x7fffffff, -0x80000000); integer(o.convertedQuantity, 0x7fffffff, -0x80000000);
    for (const f of ['rawEaxU32', 'afterSuperU32', 'afterPressureU32', 'firstSumU32']) integer(o[f], 0xffffffff);
    for (const f of ['firstTroopsEax', 'firstCapacityEax']) integer(o[f], 1_000_000);
    integer(o.charismaSum, 765); integer(o.validSlotCount, 3, 1); choice(o.skillParameter, [10, 15]); integer(o.baseQuantity); integer(o.integerQuantity); integer(o.savedSecurityByte, 100); factor(o.resolvedFacilityFactorBits); choice(o.difficultyWord, [0, 2]); bit(o.pressureEax); for (const f of ['superApplied', 'pressureApplied']) boolean(o[f]);
    if (i.difficultyWord === 0) { if (o.cityVirtualEax !== null) stop('invalid-data'); } else bit(o.cityVirtualEax);
    array(o.slots, 3, 3).forEach((slot, index) => { const s = object(slot, ['slotIndex', 'validityEax', 'charismaEax', 'charismaAl', 'skillEax']); literal(s.slotIndex, index); bit(s.validityEax); if (s.validityEax === 0) { if (s.charismaEax !== null || s.charismaAl !== null || s.skillEax !== null) stop('invalid-data'); } else { integer(s.charismaEax, 255); integer(s.charismaAl, 255); bit(s.skillEax); } });
    const targets: Record<string, string> = { '005C3619': '0047A630', '005C3630': '0047A630', '005C3643': '004866F0', '005C364B': '0047A630', '005C367B': '0047A630', '005C3689': '004890B0', '005C36AA': '004890F0', '005C3725': 'vtable+0x48', '005C3738': '004B99B0', '005C374E': 'vtable+0x50', '005C3757': '00486BC0', '005C3764': 'vtable+0x50', '005C376B': '00486BC0' };
    const expected = parsed.map(c => ({ callAddress: c.callAddress, target: targets[c.callAddress as string], slotIndex: c.slotIndex ?? null, queryId: c.callAddress === '005C36AA' ? 79 : null, kind: 'captured-eax', eax: c.eax, st0Bits: null } as Record<string, unknown>));
    expected.splice(factorIndex, 0, { callAddress: '005C36C8', target: '005C3550', slotIndex: null, queryId: null, kind: 'captured-st0-f32', eax: null, st0Bits: i.resolvedFacilityFactorBits }, { callAddress: '005C3710', target: '00707A74', slotIndex: null, queryId: null, kind: 'derived-converter-eax', eax: o.convertedQuantity, st0Bits: null });
    if (!same(o.callDetails, expected)) stop('invalid-data');
  } else stop('invalid-data');
}
function domesticAudit(value: unknown, action: DomesticAction, commandId: string): DomesticAudit {
  const a = object(value, ['calculation', 'fees', 'rewards', 'events', 'sideEffectsNotModeled', 'rngDraws']); literal(a.rngDraws, 0);
  if (!same(a.events, [{ type: 'command-committed', subjectId: commandId }]) || !same(a.sideEffectsNotModeled, ['technique-points', 'native-stat-growth', 'native-writer-semantics', 'native-personnel-tasks', 'native-corps-effects', 'presentation-rng'])) stop('invalid-data');
  const fees = object(a.fees, ['gold', 'actionPoints', 'sourceApRequest', 'effectiveApCost']); writeAudit(fees.gold); writeAudit(fees.actionPoints); literal(fees.sourceApRequest, 20); literal(fees.effectiveApCost, 20);
  const attribute = action.type === 'Patrol' ? 'leadership' : action.type === 'Recruit' ? 'charm' : 'intelligence';
  array(a.rewards, 3, 1).forEach((value, i) => { const r = object(value, ['officerId', 'attribute', 'xp', 'merit']); literal(r.officerId, action.officerIds[i]!); literal(r.attribute, attribute); writeAudit(r.xp); writeAudit(r.merit); });
  if ((a.rewards as unknown[]).length !== action.officerIds.length) stop('invalid-data');
  const c = object(a.calculation, ['observationKind', 'selectedOfficerIds', 'securityKernelReturn', 'quantityKernelReturn', 'quantityPreCapacity', 'priceKernelReturn', 'timeKernelReturn', 'facilityApplied', 'earlyCharmSum', 'moraleSecuritySnapshot', 'newRecruitMorale', 'securityWrite', 'troopWrite', 'inventoryWrite', 'moraleWrite', 'kernels']);
  literal(c.observationKind, 'derived-adapter-observations'); if (!same(c.selectedOfficerIds, action.officerIds) || c.timeKernelReturn !== null) stop('invalid-data'); literal(c.facilityApplied, false);
  for (const f of ['securityKernelReturn', 'quantityKernelReturn', 'quantityPreCapacity', 'priceKernelReturn', 'earlyCharmSum', 'moraleSecuritySnapshot', 'newRecruitMorale']) nullable(c[f], signed);
  for (const f of ['securityWrite', 'troopWrite', 'inventoryWrite', 'moraleWrite']) nullable(c[f], writeAudit);
  const nulls = action.type === 'Patrol' ? ['quantityKernelReturn', 'quantityPreCapacity', 'priceKernelReturn', 'earlyCharmSum', 'moraleSecuritySnapshot', 'newRecruitMorale', 'troopWrite', 'inventoryWrite', 'moraleWrite'] : action.type === 'Recruit' ? ['securityKernelReturn', 'priceKernelReturn', 'inventoryWrite'] : ['securityKernelReturn', 'earlyCharmSum', 'moraleSecuritySnapshot', 'newRecruitMorale', 'securityWrite', 'troopWrite', 'moraleWrite'];
  if (nulls.some(f => c[f] !== null)) stop('invalid-data');
  const expected = action.type === 'Patrol' ? ['calculatePatrolSecurityGain'] : action.type === 'Recruit' ? ['calculateRecruitmentQuantityProjection', 'calculateRecruitmentSecurityArgument'] : ['calculateProductionPrice', 'calculateProductionQuantity'];
  const kernels = array(c.kernels, expected.length, expected.length); kernels.forEach((k, i) => { kernelAudit(k); if ((k as { api: string }).api !== expected[i]) stop('invalid-data'); });
  return a as unknown as DomesticAudit;
}
function fractionAudit(value: unknown): void {
  const f = object(value, ['numerator', 'denominator']);
  if (typeof f.numerator !== 'string' || !/^(0|[1-9][0-9]*)$/.test(f.numerator) || typeof f.denominator !== 'string' || !/^[1-9][0-9]*$/.test(f.denominator)) stop('invalid-data');
}
function merchantAudit(value: unknown, s: Scenario, clock: Clock, action: TradeAction): MerchantAudit {
  const a = object(value, ['ownerSnapshot', 'actionPoints', 'fixedGoldFee', 'meritDelta', 'techniquePointsDelta', 'loyaltyDelta', 'rngDraws', 'trade']);
  if (!same(a.ownerSnapshot, { activeForceId: s.activeForceId, ownerForceId: s.city.ownerForceId, corpsId: s.corps.id, corpsForceId: s.corps.forceId })) stop('invalid-data');
  const ap = object(a.actionPoints, ['before', 'requestedDelta', 'actualDelta', 'after', 'cap', 'policyId']); integer(ap.before, 255); integer(ap.after, 255); literal(ap.requestedDelta, -20); literal(ap.actualDelta, -20); literal(ap.cap, 255); literal(ap.policyId, s.policy.merchant.eligibility.id);
  for (const f of ['fixedGoldFee', 'meritDelta', 'techniquePointsDelta', 'loyaltyDelta', 'rngDraws']) literal(a[f], 0);
  const t = object(a.trade, ['officerId', 'direction', 'priceScale', 'uiTradePrice', 'foodRequested', 'foodTransferred', 'politicsEffect', 'sellFactor', 'exactGold', 'rounding', 'divisionRemainder', 'roundingDifference', 'settledGold', 'eligibility', 'merchantUsedTurnAfter', 'actorActedTurnAfter', 'writes', 'merchantCounterparty', 'politicsXp']);
  literal(t.officerId, action.officerId); literal(t.direction, action.type === 'BuyFood' ? 'buy' : 'sell'); literal(t.priceScale, 'ui-food-per-gold'); literal(t.uiTradePrice, s.merchant.uiTradePrice); literal(t.foodRequested, action.foodAmount); literal(t.foodTransferred, action.foodAmount);
  const effect = object(t.politicsEffect, ['politics', 'lowerPolitics', 'upperPolitics', 'lowerEffectMillionths', 'upperEffectMillionths', 'fraction', 'interpolationPolicyId']); for (const f of ['politics', 'lowerPolitics', 'upperPolitics']) integer(effect[f], 100, 20); for (const f of ['lowerEffectMillionths', 'upperEffectMillionths']) integer(effect[f], MAX); fractionAudit(effect.fraction); literal(effect.interpolationPolicyId, s.merchantCatalog.version);
  for (const f of ['sellFactor', 'exactGold', 'roundingDifference']) fractionAudit(t[f]); literal(t.rounding, action.type === 'BuyFood' ? 'ceil' : 'floor'); if (typeof t.divisionRemainder !== 'string' || !/^(0|[1-9][0-9]*)$/.test(t.divisionRemainder)) stop('invalid-data'); integer(t.settledGold, MAX, 1);
  const eligibility = object(t.eligibility, ['merchantPresent', 'cityUsedBefore', 'actorActedBefore', 'actorAvailable', 'completeSuppliedFieldUnits', 'unitChecks']); for (const f of ['merchantPresent', 'actorAvailable', 'completeSuppliedFieldUnits']) literal(eligibility[f], true); marker(eligibility.cityUsedBefore, clock.turn); marker(eligibility.actorActedBefore, clock.turn);
  array(eligibility.unitChecks, s.merchant.fieldUnits.length, s.merchant.fieldUnits.length).forEach((value, i) => { const u = object(value, ['unitId', 'forceId', 'position', 'hostile', 'distance', 'blocks']), fact = s.merchant.fieldUnits[i]!; literal(u.unitId, fact.id); literal(u.forceId, fact.forceId); if (!same(u.position, fact.position)) stop('invalid-data'); boolean(u.hostile); integer(u.distance, 4_000_000); literal(u.blocks, false); });
  literal(t.merchantUsedTurnAfter, clock.turn); literal(t.actorActedTurnAfter, clock.turn);
  array(t.writes, 2, 2).forEach((value, i) => { const w = object(value, ['resource', 'before', 'requested', 'actualDelta', 'after', 'cap', 'discarded', 'policyId']); literal(w.resource, i === 0 ? 'gold' : 'food'); integer(w.before, MAX); integer(w.requested, MAX); signed(w.actualDelta); integer(w.after, MAX); literal(w.cap, i === 0 ? MAX : s.city.foodCapacity); literal(w.discarded, 0); literal(w.policyId, s.policy.merchant.capacity.id); });
  const counterparty = object(t.merchantCounterparty, ['goldDelta', 'foodDelta', 'balanceMode']); signed(counterparty.goldDelta); signed(counterparty.foodDelta); literal(counterparty.balanceMode, 'external-untracked');
  const xp = object(t.politicsXp, ['before', 'requested', 'actualDelta', 'after', 'cap', 'discarded', 'politicsBefore', 'politicsAfter']); integer(xp.before, MAX); literal(xp.requested, 5); integer(xp.actualDelta, 5); integer(xp.after, MAX); literal(xp.cap, MAX); integer(xp.discarded, 5); integer(xp.politicsBefore, 100, 20); literal(xp.politicsAfter, xp.politicsBefore as number);
  return { ...a, merchantMerit: 'not-modeled-preserve-existing' } as unknown as MerchantAudit;
}
function changes(before: Ledger, after: Ledger): Change[] {
  const result: Change[] = [];
  for (const field of ['gold', 'food', 'security', 'troops', 'morale'] as const) if (before[field] !== after[field]) result.push({ target: 'city', field, before: before[field], after: after[field] });
  for (const field of ['patrolUsedTurn', 'merchantUsedTurn'] as const) if (before[field] !== after[field]) result.push({ target: 'city', field, before: before[field], after: after[field] });
  if (before.actionPoints !== after.actionPoints) result.push({ target: 'corps', field: 'actionPoints', before: before.actionPoints, after: after.actionPoints });
  for (const t of QUANTITY) if (before.inventory[t].quantity !== after.inventory[t].quantity) result.push({ target: 'equipment', equipmentType: t, before: before.inventory[t].quantity, after: after.inventory[t].quantity });
  before.officers.forEach((o, index) => { const n = after.officers[index]!;
    for (const field of STATS) if (o.xp[field] !== n.xp[field]) result.push({ target: 'officer', officerId: o.id, field, before: o.xp[field], after: n.xp[field] });
    if (o.merit !== n.merit) result.push({ target: 'officer', officerId: o.id, field: 'merit', before: o.merit, after: n.merit });
    if (o.actedTurn !== n.actedTurn) result.push({ target: 'officer', officerId: o.id, field: 'actedTurn', before: o.actedTurn, after: n.actedTurn });
  });
  before.facilities.forEach((f, index) => { const n = after.facilities[index]!; if (f.usedTurn !== n.usedTurn) result.push({ target: 'facility', facilityId: f.id, field: 'usedTurn', before: f.usedTurn, after: n.usedTurn }); });
  return result;
}
function isTradeAction(action: Action): action is TradeAction { return action.type === 'BuyFood' || action.type === 'SellFood'; }
function reduceStep(s: Scenario, clock: Clock, before: Ledger, action: Action, commandId: string, index: number): { ledger: Ledger; receipt: StepReceipt } {
  ledgerInvariant(s, clock, before); rootGuard(s, clock, before, action, index); const next = clone(before); let audit: StepReceipt['audit'];
  const context = { commandId, turn: clock.turn };
  if (isTradeAction(action)) {
    const frame = merchantFrame(s, before), result = reduceMerchantTrade(context, frame, action);
    if (!result.ok) stop(reducerReason(result.reason), 'merchant', index, result.blockingUnitId);
    try {
      const candidate = result.candidate; next.gold = candidate.city.gold; next.food = candidate.city.food; next.actionPoints = candidate.corps.actionPoints; next.merchantUsedTurn = candidate.city.merchantUsedTurn;
      const actor = s.officers.findIndex(o => o.id === action.officerId); if (actor < 0) stop('unexpected-reducer-effect');
      next.officers[actor]!.xp.politics = candidate.officers[actor]!.politicsXp; next.officers[actor]!.actedTurn = candidate.officers[actor]!.actedTurn;
      ledgerInvariant(s, clock, next);
      // Reproject only the whitelist. Full equality rejects changed facts, identity,
      // unrelated actors, order, caps, or any unrecognized candidate property.
      if (!same(candidate, merchantFrame(s, next))) stop('unexpected-reducer-effect');
      audit = { kind: 'merchant', detail: merchantAudit(result.audit, s, clock, action) };
    } catch (_) { stop('unexpected-reducer-effect', 'invariant', index); }
  } else {
    const frame = domesticFrame(s, before), result = reduceDomesticInstant(context, frame, action);
    if (!result.ok) stop(reducerReason(result.reason), 'domestic', index);
    try {
      const candidate = result.candidate; next.gold = candidate.city.gold; next.actionPoints = candidate.corps.actionPoints;
      const stat: Stat = action.type === 'Patrol' ? 'leadership' : action.type === 'Recruit' ? 'charm' : 'intelligence';
      if (action.type === 'Patrol') { next.security = candidate.city.security; next.patrolUsedTurn = candidate.city.patrolUsedTurn; }
      else { const facility = s.facilities.findIndex(f => f.id === action.facilityId); if (facility < 0) stop('unexpected-reducer-effect'); next.facilities[facility]!.usedTurn = candidate.facilities[facility]!.usedTurn;
        if (action.type === 'Recruit') { next.troops = candidate.city.troops; next.security = candidate.city.security; next.morale = candidate.city.morale; }
        else next.inventory[action.equipmentType].quantity = candidate.city.inventory[action.equipmentType].quantity;
      }
      for (const oid of action.officerIds) { const actor = s.officers.findIndex(o => o.id === oid); if (actor < 0) stop('unexpected-reducer-effect'); const source = candidate.officers[actor]!; next.officers[actor]!.xp[stat] = source.xp[stat]; next.officers[actor]!.merit = source.merit; next.officers[actor]!.actedTurn = source.actedTurn; }
      ledgerInvariant(s, clock, next); if (!same(candidate, domesticFrame(s, next))) stop('unexpected-reducer-effect');
      audit = { kind: 'domestic', detail: domesticAudit(result.audit, action, commandId) };
    } catch (_) { stop('unexpected-reducer-effect', 'invariant', index); }
  }
  return { ledger: next, receipt: { index, action: clone(action), ledgerDigestBefore: digest(before), ledgerDigestAfter: digest(next), changes: changes(before, next), audit } };
}
/** The root retains the complete three-kernel audit, including the quantity-one call. */
function pieceCalculation(value: unknown, s: Scenario, officerIds: string[]): PieceCalculation {
  const c = object(value, ['observationKind', 'selectedOfficerIds', 'securityKernelReturn', 'quantityKernelReturn', 'quantityPreCapacity', 'priceKernelReturn', 'timeKernelReturn', 'facilityApplied', 'earlyCharmSum', 'moraleSecuritySnapshot', 'newRecruitMorale', 'securityWrite', 'troopWrite', 'inventoryWrite', 'moraleWrite', 'kernels']);
  literal(c.observationKind, 'derived-adapter-observations'); if (!same(c.selectedOfficerIds, officerIds)) stop('unexpected-reducer-effect', 'invariant');
  for (const key of ['securityKernelReturn', 'earlyCharmSum', 'moraleSecuritySnapshot', 'newRecruitMorale', 'securityWrite', 'troopWrite', 'inventoryWrite', 'moraleWrite']) if (c[key] !== null) stop('unexpected-reducer-effect', 'invariant');
  literal(c.quantityKernelReturn, 1); literal(c.quantityPreCapacity, 1); literal(c.facilityApplied, false); integer(c.priceKernelReturn, 65535); integer(c.timeKernelReturn, 9, -24);
  const kernels = array(c.kernels, 3, 3); kernelAudit(kernels[0]);
  const price = object(kernels[0], ['api', 'input', 'output']); literal(price.api, 'calculateProductionPrice');
  const priceInput = price.input as Record<string, unknown>, priceOutput = price.output as Record<string, unknown>;
  literal(priceInput.savedBasePriceWord, s.productionCatalog.entries[5].basePriceWord); literal(priceInput.specialtyHelperEax, s.domestic.specialtyEquipmentTypes.includes(5) ? 1 : 0); literal(priceOutput.returnedPrice, c.priceKernelReturn as number);
  const quantity = object(kernels[1], ['api', 'input', 'output']); literal(quantity.api, 'calculateProductionQuantity');
  const qi = object(quantity.input, ['profile', 'nativeEquipmentType']); literal(qi.profile, 'production-quantity-resolved-f32-v1'); literal(qi.nativeEquipmentType, 5);
  const qo = object(quantity.output, ['supported', 'profile', 'nativeEquipmentType', 'reason', 'resolvedInputsObserved', 'returnedQuantity']);
  literal(qo.supported, true); literal(qo.profile, 'production-quantity-resolved-f32-v1'); literal(qo.nativeEquipmentType, 5); literal(qo.reason, 'single-item-return-one'); literal(qo.resolvedInputsObserved, false); literal(qo.returnedQuantity, 1);
  const time = object(kernels[2], ['api', 'input', 'output']); literal(time.api, 'calculateProductionTimeProjection');
  const ti = object(time.input, ['profile', 'nativeEquipmentType', 'captures']); literal(ti.profile, 'production-time-observations-v1'); literal(ti.nativeEquipmentType, 5);
  const captures: PieceTimeCapture[] = [], slots: PieceTimeOutput['slots'][number][] = [], calls: PieceTimeCallDetail[] = [];
  for (const slotIndex of [0, 1, 2] as const) {
    const officer = officerIds[slotIndex] === undefined ? undefined : s.officers.find(o => o.id === officerIds[slotIndex]);
    captures.push({ callAddress: '005C6CF8', slotIndex, eax: officer ? 1 : 0 }); calls.push({ callAddress: '005C6CF8', target: '0047A630', slotIndex, queryId: null });
    if (officer) {
      const skill = officer.skillIds.includes(82) ? 1 : 0;
      captures.push({ callAddress: '005C6D06', slotIndex, eax: officer.intelligence }, { callAddress: '005C6D25', slotIndex, eax: skill });
      calls.push({ callAddress: '005C6D06', target: '00489090', slotIndex, queryId: null }, { callAddress: '005C6D25', target: '004890F0', slotIndex, queryId: 82 });
      slots.push({ slotIndex, validityEax: 1, intelligenceAl: officer.intelligence, skillEax: skill });
    } else slots.push({ slotIndex, validityEax: 0, intelligenceAl: null, skillEax: null });
  }
  if (!same(ti.captures, captures)) stop('unexpected-reducer-effect', 'invariant');
  const o = object(time.output, ['supported', 'profile', 'nativeEquipmentType', 'reason', 'returnedValue', 'rawEaxU32', 'scannedSlots', 'skillQueryId', 'slots', 'intelligenceSum', 'intelligenceMax', 'rawX', 'clampedX', 'q', 'facilityApplied', 'skillApplied', 'beforeSkill', 'trace', 'callDetails']);
  literal(o.supported, true); literal(o.profile, 'production-time-observations-v1'); literal(o.nativeEquipmentType, 5); literal(o.reason, 'captured-duration-projection'); literal(o.scannedSlots, true); literal(o.skillQueryId, 82); literal(o.facilityApplied, false); boolean(o.skillApplied);
  literal(o.returnedValue, c.timeKernelReturn as number); integer(o.rawEaxU32, 0xffffffff); integer(o.intelligenceSum, 765); integer(o.intelligenceMax, 255); integer(o.rawX, 820, -200); integer(o.clampedX, 820, 24); integer(o.q, 34, 1); integer(o.beforeSkill, 9, -24);
  if (!same(o.slots, slots) || !same(o.trace, captures) || !same(o.callDetails, calls)) stop('unexpected-reducer-effect', 'invariant');
  return c as unknown as PieceCalculation;
}
function calculatePiece(s: Scenario, officerIds: string[]): { price: number; duration: number; calculation: PieceCalculation } {
  const people = officerIds.map(oid => { const o = s.officers.find(o => o.id === oid); if (!o) stop('invariant-mismatch', 'invariant'); return { id: o.id, intelligence: o.intelligence, skillIds: [...o.skillIds] }; });
  const result = calculatePieceProduction({ people, basePriceWord: s.productionCatalog.entries[5].basePriceWord,
    specialty: s.domestic.specialtyEquipmentTypes.includes(5), drillGroundComplete: false, timePolicy: s.policy.pieceTime }, { equipmentType: 5 });
  if (!result.ok) stop(reducerReason(result.reason), 'piece');
  const value = result.value, calculation = pieceCalculation(value.calculation, s, officerIds);
  literal(value.quantity, 1); literal(value.price, calculation.priceKernelReturn); literal(value.duration, Math.max(1, calculation.timeKernelReturn)); integer(value.duration, 9, 1);
  return { price: value.price, duration: value.duration, calculation: clone(calculation) };
}
function startSnapshot(s: Scenario, clock: { date: DateV1; turn: number }, officerIds: string[], facilityId: string): PieceStartSnapshot {
  return { clock: { date: clone(clock.date), turn: clock.turn }, activeForceId: s.activeForceId, corpsId: s.corps.id, cityId: s.city.id,
    officers: officerIds.map(oid => { const o = s.officers.find(o => o.id === oid); if (!o) stop('invariant-mismatch', 'invariant'); return { id: oid, intelligence: o.intelligence, hasSkill82: o.skillIds.includes(82) }; }),
    facility: { id: facilityId, kind: 'workshop', level: 1, complete: true }, basePriceWord: s.productionCatalog.entries[5].basePriceWord,
    specialty: s.domestic.specialtyEquipmentTypes.includes(5), policyDigest: digest(s.policy), productionCatalogDigest: digest(s.productionCatalog) };
}
function feesAudit(value: unknown): Fees {
  const f = object(value, ['gold', 'actionPoints', 'sourceApRequest', 'effectiveApCost']); writeAudit(f.gold); writeAudit(f.actionPoints); literal(f.sourceApRequest, 20); literal(f.effectiveApCost, 20); return f as unknown as Fees;
}
function completionAudit(value: unknown, s: Scenario, job: Job): PieceCompletion {
  const c = object(value, ['jobId', 'turn', 'inventoryWrite', 'rewards', 'inventoryReservedBefore', 'inventoryReservedAfter', 'officerIds', 'facilityId', 'actedTurnAfter']);
  literal(c.jobId, job.id); literal(c.turn, job.dueTurn); literal(c.inventoryReservedBefore, 1); literal(c.inventoryReservedAfter, 0); literal(c.facilityId, job.facilityId); literal(c.actedTurnAfter, job.dueTurn);
  if (!same(c.officerIds, job.officerIds)) stop('invariant-mismatch', 'invariant'); writeAudit(c.inventoryWrite);
  const write = c.inventoryWrite as Write; literal(write.requested, 1); literal(write.actualDelta, 1); literal(write.cap, s.city.inventory[5].capacity);
  const expectedWrite = writeDomestic(write.before, 1, s.city.inventory[5].capacity, s.policy.domestic.writer);
  if (!expectedWrite.ok || !same(write, expectedWrite.value)) stop('invariant-mismatch', 'invariant');
  array(c.rewards, job.officerIds.length, job.officerIds.length).forEach((value, i) => {
    const r = object(value, ['officerId', 'attribute', 'xp', 'merit']); literal(r.officerId, job.officerIds[i]!); literal(r.attribute, 'intelligence'); writeAudit(r.xp); writeAudit(r.merit);
    for (const [field, requested] of [['xp', 4], ['merit', 100]] as const) {
      const actual = r[field] as Write, expected = writeDomestic(actual.before, requested, MAX, ACCUMULATE);
      if (!expected.ok || !same(actual, expected.value)) stop('invariant-mismatch', 'invariant');
    }
  });
  return c as unknown as PieceCompletion;
}
type SyntheticForgeExtension = { facilityId:string; complete:boolean; activeJobId:string|null; officerIds:readonly string[] };
function effectiveSyntheticScenario(s:Scenario,extension?:SyntheticForgeExtension):Scenario {
  return extension ? {...s,facilities:s.facilities.map(f=>f.id===extension.facilityId?{...f,complete:extension.complete}:f)} : s;
}
type SyntheticResearchExtension={maxAdvances:21;activeJobId:string|null;officerIds:readonly string[]};
function currentInvariant(s: Scenario, c: Current, extension?:SyntheticForgeExtension,research?:SyntheticResearchExtension): void {
  object(c, ['clock', 'ledger', 'jobs']); const clock = object(c.clock, ['date', 'turn', 'advancedCount']); date(clock.date);
  integer(clock.advancedCount, research?.maxAdvances??s.advanceLimit); integer(clock.turn);
  if (clock.turn !== s.clock.turn + c.clock.advancedCount || !same(clock.date, advanceDate(s.clock.date, c.clock.advancedCount))) stop('invariant-mismatch', 'invariant');
  ledgerInvariant(s, c.clock, c.ledger); array(c.jobs, 12); unique(c.jobs.map(j => j.id)); let active: Job | null = null;
  for (const job of c.jobs) {
    object(job, ['id', 'status', 'cityId', 'equipmentType', 'facilityId', 'officerIds', 'startTurn', 'startDate', 'durationTurns', 'dueTurn', 'dueDate', 'remainingTurns', 'reservedQuantity', 'startSnapshot', 'calculation', 'fees', 'completedTurn', 'completion']);
    jobId(job.id); choice(job.status, ['active', 'completed']); literal(job.cityId, s.city.id); literal(job.equipmentType, 5); literal(job.reservedQuantity, 1);
    unique(array(job.officerIds, 3, 1, 'invalid-officer-count').map(v => id(v)), 'invalid-officer-count');
    if (job.officerIds.some(oid => !s.officers.some(o => o.id === oid))) stop('invariant-mismatch', 'invariant');
    const workshop = s.facilities.find(f => f.kind === 'workshop'); if (!workshop || job.facilityId !== workshop.id) stop('invariant-mismatch', 'invariant');
    integer(job.startTurn, c.clock.turn, s.clock.turn); integer(job.durationTurns, 9, 1); integer(job.dueTurn, s.clock.turn + (research?.maxAdvances??s.advanceLimit)); integer(job.remainingTurns, 9); date(job.startDate); date(job.dueDate);
    if (job.dueTurn !== job.startTurn + job.durationTurns || !same(job.startDate, advanceDate(s.clock.date, job.startTurn - s.clock.turn)) || !same(job.dueDate, advanceDate(job.startDate, job.durationTurns))) stop('invariant-mismatch', 'invariant');
    const calculated = calculatePiece(s, job.officerIds);
    if (job.durationTurns !== calculated.duration || !same(job.calculation, calculated.calculation) || !same(job.startSnapshot, startSnapshot(s, { turn: job.startTurn, date: job.startDate }, job.officerIds, job.facilityId))) stop('invariant-mismatch', 'invariant');
    const fees = feesAudit(job.fees), expectedFees = planPieceStartFees({ gold: fees.gold.before, actionPoints: fees.actionPoints.before }, { goldCost: calculated.price, actionPointsCost: 20 });
    if (!expectedFees.ok || !same(fees, expectedFees.value.fees)) stop('invariant-mismatch', 'invariant');
    if (job.status === 'active') {
      if (active !== null || job.remainingTurns !== job.dueTurn - c.clock.turn || job.remainingTurns < 1 || job.completedTurn !== null || job.completion !== null) stop('invariant-mismatch', 'invariant'); active = job;
    } else {
      if (job.remainingTurns !== 0 || job.completedTurn !== job.dueTurn || job.dueTurn > c.clock.turn || job.completion === null) stop('invariant-mismatch', 'invariant'); completionAudit(job.completion, s, job);
    }
  }
  // Both directions: every active participant is locked, and no other row may hold a lock.
  if(extension){
    const source=s.facilities.find(f=>f.id===extension.facilityId);
    if(!source||source.kind!=='forge'||source.level!==1||source.complete||typeof extension.complete!=='boolean')stop('invariant-mismatch');
    unique(extension.officerIds);if(extension.officerIds.some(id=>!s.officers.some(o=>o.id===id)))stop('invariant-mismatch');
    if(extension.activeJobId!==null){jobId(extension.activeJobId);if(c.jobs.some(job=>job.id===extension.activeJobId))stop('invariant-mismatch');if(extension.complete||extension.officerIds.length<1||extension.officerIds.length>3)stop('invariant-mismatch');}
    else if(extension.officerIds.length)stop('invariant-mismatch');
  }
  if(research){
    literal(research.maxAdvances,21);unique(research.officerIds);
    if(research.officerIds.some(id=>!s.officers.some(o=>o.id===id)))stop('invariant-mismatch');
    if(research.activeJobId!==null){jobId(research.activeJobId);if(c.jobs.some(j=>j.id===research.activeJobId)||extension?.activeJobId===research.activeJobId||research.officerIds.length<1||research.officerIds.length>3)stop('invariant-mismatch');}
    else if(research.officerIds.length)stop('invariant-mismatch');
  }
  for (const row of c.ledger.officers) {
    const production=active!==null&&active.officerIds.includes(row.id)?active.id:null;
    const external=extension?.activeJobId&&extension.officerIds.includes(row.id)?extension.activeJobId:null;
    const study=research?.activeJobId&&research.officerIds.includes(row.id)?research.activeJobId:null;
    const locks=[production,external,study].filter(v=>v!==null);if(locks.length>1||row.reservationJobId!==(locks[0]??null))stop('invariant-mismatch','invariant');
  }
  for (const row of c.ledger.facilities) {
    const production=active!==null&&active.facilityId===row.id?active.id:null;
    const external=extension?.activeJobId&&extension.facilityId===row.id?extension.activeJobId:null;
    if((production!==null&&external!==null)||row.reservationJobId!==(production??external))stop('invariant-mismatch','invariant');
  }
  if (c.ledger.inventory[5].reserved !== (active === null ? 0 : 1)) stop('invariant-mismatch', 'invariant');
}
function reservedCompletionSlots(c: Current): number { return c.jobs.find(j => j.status === 'active')?.remainingTurns ?? 0; }
function rootInvariant(s: State, extension?:SyntheticForgeExtension,research?:SyntheticResearchExtension): void {
  integer(s.revision, 64); if (s.revision !== s.acceptedCommands.length) stop('invariant-mismatch', 'invariant'); currentInvariant(s.genesis, s.current, extension,research);
  const starts = s.acceptedCommands.filter(a => a.envelope.command.type === 'StartPieceProduction');
  if (starts.length !== s.current.jobs.length) stop('invariant-mismatch', 'invariant');
  starts.forEach((entry, i) => {
    const job = s.current.jobs[i]!, command = entry.envelope.command, receipt = entry.receipt;
    if (command.type !== 'StartPieceProduction' || receipt.kind !== 'piece-start' || job.id !== 'job:' + entry.envelope.id || job.facilityId !== command.facilityId || !same(job.officerIds, command.officerIds)
      || job.startTurn !== receipt.clockBefore.turn || !same(job.startDate, receipt.clockBefore.date) || receipt.detail.jobId !== job.id
      || !same(job.startSnapshot, receipt.detail.startSnapshot) || !same(job.calculation, receipt.detail.calculation) || !same(job.fees, receipt.detail.fees)) stop('invariant-mismatch', 'invariant');
    const completions = s.acceptedCommands.flatMap(e => e.receipt.kind === 'tick' ? e.receipt.detail.completions.filter(c => c.jobId === job.id) : []);
    if (job.status === 'active' ? completions.length !== 0 : completions.length !== 1 || !same(job.completion, completions[0])) stop('invariant-mismatch', 'invariant');
  });
  const advances = s.acceptedCommands.filter(a => a.envelope.command.type === 'AdvanceSharedCityTurn').length;
  const paidSteps = s.acceptedCommands.reduce((n, a) => n + (a.envelope.command.type === 'ExecuteCityActions' ? a.envelope.command.actions.length : a.envelope.command.type === 'StartPieceProduction' ? 1 : 0), 0);
  if (advances !== s.current.clock.advancedCount || paidSteps > 24 || 20 * paidSteps > s.genesis.corps.initialActionPoints + 20 * advances) stop('invariant-mismatch', 'invariant');
  if (64 - s.revision < reservedCompletionSlots(s.current)) stop('completion-history-slots', 'invariant');
}
function startPiece(s: State, current: Current, e: Envelope, command: StartCommand,research?:SyntheticResearchExtension): StartDetail {
  const g = s.genesis, l = current.ledger, clock = current.clock;
  rootGuard(g, clock, l, command, null);
  if (!g.domestic.unlockedEquipmentTypes.includes(5)) stop('equipment-locked', 'piece');
  const calculated = calculatePiece(g, command.officerIds);
  if (current.jobs.length >= 12) stop('job-history-limit', 'piece');
  const stock = l.inventory[5]; if (stock.quantity + stock.reserved + 1 > g.city.inventory[5].capacity) stop('piece-capacity-unavailable', 'piece');
  const dueTurn = clock.turn + calculated.duration;
  if (!Number.isSafeInteger(dueTurn) || dueTurn > g.clock.turn + (research?.maxAdvances??g.advanceLimit)) stop('completion-horizon-exceeded', 'piece');
  const dueDate = advanceDate(clock.date, calculated.duration);
  if (64 - (s.revision + 1) < calculated.duration) stop('completion-history-slots', 'piece');
  const snapshot = startSnapshot(g, clock, command.officerIds, command.facilityId), jid = 'job:' + e.id;
  // Snapshot precedes the single fee planner. No legacy placeholder or six-slot frame.
  const planned = planPieceStartFees({ gold: l.gold, actionPoints: l.actionPoints }, { goldCost: calculated.price, actionPointsCost: 20 });
  if (!planned.ok) stop(reducerReason(planned.reason), 'piece');
  const fees = clone(feesAudit(planned.value.fees));
  if (planned.value.goldAfter !== fees.gold.after || planned.value.actionPointsAfter !== fees.actionPoints.after || fees.gold.before !== l.gold || fees.actionPoints.before !== l.actionPoints) stop('unexpected-reducer-effect', 'invariant');
  l.gold = planned.value.goldAfter; l.actionPoints = planned.value.actionPointsAfter; stock.reserved = 1;
  for (const oid of command.officerIds) { const row = l.officers.find(o => o.id === oid)!; row.reservationJobId = jid; row.actedTurn = clock.turn; }
  const facility = l.facilities.find(f => f.id === command.facilityId)!; facility.reservationJobId = jid; facility.usedTurn = clock.turn;
  const job: Job = { id: jid, status: 'active', cityId: g.city.id, equipmentType: 5, facilityId: command.facilityId, officerIds: [...command.officerIds],
    startTurn: clock.turn, startDate: clone(clock.date), durationTurns: calculated.duration, dueTurn, dueDate, remainingTurns: calculated.duration, reservedQuantity: 1,
    startSnapshot: clone(snapshot), calculation: clone(calculated.calculation), fees: clone(fees), completedTurn: null, completion: null };
  current.jobs.push(job);
  return { jobId: jid, startSnapshot: snapshot, calculation: calculated.calculation, fees,
    reservations: { officerIds: [...command.officerIds], facilityId: command.facilityId, jobId: jid, inventoryReservedBefore: 0, inventoryReservedAfter: 1 } };
}
function advanceShared(s: State, current: Current, extension?:SyntheticForgeExtension,research?:SyntheticResearchExtension): TickDetail {
  const g = s.genesis;
  if (current.clock.advancedCount >= (research?.maxAdvances??g.advanceLimit)) stop('advance-limit-reached', 'tick');
  currentInvariant(g, current, extension,research);
  current.clock = { date: advanceDate(current.clock.date, 1), turn: current.clock.turn + 1, advancedCount: current.clock.advancedCount + 1 };
  const l = current.ledger, recovered = writeDomestic(l.actionPoints, 20, 255, ACCUMULATE);
  if (!recovered.ok) stop(reducerReason(recovered.reason), 'tick');
  const apRecovery: Write = { ...recovered.value, policyId: g.policy.apRecovery.id }; l.actionPoints = apRecovery.after;
  const progress: JobProgress[] = [], completions: PieceCompletion[] = [];
  for (const job of current.jobs) if (job.status === 'active') {
    const remainingBefore = job.remainingTurns; job.remainingTurns--;
    if (job.remainingTurns === 0) {
      const stock = l.inventory[5], people = job.officerIds.map(oid => { const row = l.officers.find(o => o.id === oid); if (!row || row.reservationJobId !== job.id) stop('completion-reservation-mismatch', 'tick'); return { id: row.id, xp: clone(row.xp), merit: row.merit }; });
      const facility = l.facilities.find(f => f.id === job.facilityId);
      if (!facility || facility.reservationJobId !== job.id || stock.reserved !== 1) stop('completion-reservation-mismatch', 'tick');
      const planned = planPieceCompletion({ turn: current.clock.turn }, { stock: { ...stock, capacity: g.city.inventory[5].capacity }, people,
        policies: { writer: g.policy.domestic.writer, rewards: g.policy.domestic.rewards } }, { jobId: job.id, reservedQuantity: 1 });
      if (!planned.ok) stop(planned.reason === 'completion-reservation-mismatch' ? planned.reason : reducerReason(planned.reason), 'tick');
      const result = planned.value;
      const completion = completionAudit({ ...clone(result.completion), inventoryReservedBefore: 1, inventoryReservedAfter: 0,
        officerIds: [...job.officerIds], facilityId: job.facilityId, actedTurnAfter: current.clock.turn }, g, job);
      if (completion.inventoryWrite.before !== stock.quantity || !same(result.stockAfter, { quantity: completion.inventoryWrite.after, reserved: 0 }) || result.progress.length !== job.officerIds.length) stop('unexpected-reducer-effect', 'invariant');
      result.progress.forEach((p, i) => { const reward = completion.rewards[i]!, person = people[i]!; if (reward.xp.before !== person.xp.intelligence || reward.merit.before !== person.merit || !same(p, { officerId: reward.officerId, attribute: 'intelligence', xp: reward.xp.after, merit: reward.merit.after })) stop('unexpected-reducer-effect', 'invariant'); });
      stock.quantity = result.stockAfter.quantity; stock.reserved = result.stockAfter.reserved;
      for (const reward of completion.rewards) { const row = l.officers.find(o => o.id === reward.officerId)!; row.xp.intelligence = reward.xp.after; row.merit = reward.merit.after; row.reservationJobId = null; row.actedTurn = current.clock.turn; }
      facility.reservationJobId = null; job.status = 'completed'; job.completedTurn = current.clock.turn; job.completion = clone(completion); completions.push(clone(completion));
    }
    progress.push({ jobId: job.id, remainingBefore, remainingAfter: job.remainingTurns, statusAfter: job.status });
  }
  return { apRecovery, progress, completions };
}
function inspected(s: State): Exclude<InspectResult, Failure> { return { ok: true, revision: s.revision, current: s.current, remainingHistorySlots: 64 - s.revision, remainingAdvances: s.genesis.advanceLimit - s.current.clock.advancedCount, reservedCompletionSlots: reservedCompletionSlots(s.current), scope: 'bounded-shared-city-piece-clock' }; }
function serialized(s: State): string { const save: SaveEnvelope = { tag: SAVE_TAG, state: s }; return canonicalBoundedCityJson(save); }
function previewed(result: Exclude<ExecuteResult, Failure>, baseRevision: number): Exclude<PreviewResult, Failure> {
  return { ok: true, committed: false, duplicate: result.duplicate, baseRevision, projectedCurrent: result.state.current, receipt: result.receipt };
}
/** Pure, nonrecursive packaging. Every history prefix and every retained old receipt must fit. */
function fitRoot(s: State, latest?: Receipt): void {
  budget(s); budget({ ok: true, state: s }); budget(inspected(s)); budget({ tag: SAVE_TAG, state: s }); budget({ ok: true, serialized: serialized(s) });
  if (latest) {
    const committed: Exclude<ExecuteResult, Failure> = { ok: true, committed: true, duplicate: false, state: s, receipt: latest };
    budget(committed); budget(previewed(committed, latest.revisionBefore));
  }
  for (const accepted of s.acceptedCommands) {
    const duplicate: Exclude<ExecuteResult, Failure> = { ok: true, committed: false, duplicate: true, state: s, receipt: accepted.receipt };
    budget(duplicate); budget(previewed(duplicate, s.revision));
  }
}
/** Only private, fully reconstructed roots reach this fold; no public trusted token exists. */
function transitionValidatedRoot(s: State, e: Envelope, extension?:SyntheticForgeExtension,research?:SyntheticResearchExtension): Exclude<ExecuteResult, Failure> {
  const old = s.acceptedCommands.find(entry => entry.envelope.id === e.id);
  if (old) {
    if (!same(old.envelope, e)) stop('command-id-conflict', 'deduplication');
    fitRoot(s); return { ok: true, committed: false, duplicate: true, state: s, receipt: old.receipt };
  }
  if (e.expectedRevision !== s.revision) stop('stale-revision', 'revision');
  if (s.revision >= 64) stop('history-limit', 'budget');
  try { validateCommand(e); } catch (error) { const f = caught(error); stop(f.reason, 'domain', f.actionIndex); }
  const current = clone(s.current); let branch: Pick<Extract<Receipt, { kind: 'instant' }>, 'kind' | 'detail'> | Pick<Extract<Receipt, { kind: 'piece-start' }>, 'kind' | 'detail'> | Pick<Extract<Receipt, { kind: 'tick' }>, 'kind' | 'detail'>;
  if (e.command.type === 'ExecuteCityActions') {
    const steps: StepReceipt[] = [];
    for (let index = 0; index < e.command.actions.length; index++) {
      const step = reduceStep(effectiveSyntheticScenario(s.genesis,extension), current.clock, current.ledger, e.command.actions[index]!, e.id, index); current.ledger = step.ledger; steps.push(step.receipt);
    }
    branch = { kind: 'instant', detail: { steps } };
  } else if (e.command.type === 'StartPieceProduction') branch = { kind: 'piece-start', detail: startPiece(s, current, e, e.command,research) };
  else branch = { kind: 'tick', detail: advanceShared(s, current, extension,research) };
  currentInvariant(s.genesis, current, extension,research);
  if (64 - (s.revision + 1) < reservedCompletionSlots(current)) stop('completion-history-slots', 'invariant');
  const common: ReceiptCommon = { envelope: clone(e), revisionBefore: s.revision, revisionAfter: s.revision + 1,
    policyDigest: digest(s.genesis.policy), catalogDigests: { production: digest(s.genesis.productionCatalog), merchant: digest(s.genesis.merchantCatalog) },
    clockBefore: clone(s.current.clock), clockAfter: clone(current.clock), currentDigestBefore: digest(s.current), currentDigestAfter: digest(current),
    scope: 'bounded-shared-city-piece-clock', rngDraws: 0, techniquePoints: 'not-modeled', nativeIntegration: false };
  const receipt: Receipt = { ...common, ...branch };
  const next: State = { tag: STATE_TAG, schemaVersion: 1, profile: PROFILE, genesis: s.genesis, revision: s.revision + 1, current, acceptedCommands: [...s.acceptedCommands, { envelope: clone(e), receipt }] };
  rootInvariant(next, extension,research); fitRoot(next, receipt); return { ok: true, committed: true, duplicate: false, state: next, receipt };
}
/** Full genesis fold, not execute(public)->rebuild recursion and never digest-only trust. */
function rebuildRoot(value: unknown): State {
  try {
    const raw = object(value, ['tag', 'schemaVersion', 'profile', 'genesis', 'revision', 'current', 'acceptedCommands']); literal(raw.tag, STATE_TAG, 'unsupported-schema'); literal(raw.schemaVersion, 1, 'unsupported-schema'); literal(raw.profile, PROFILE, 'unsupported-profile');
    const genesis = scenario(raw.genesis), revision = integer(raw.revision, 64), entries = array(raw.acceptedCommands, 64);
    if (revision !== entries.length) stop('history-recomputation-mismatch', 'rebuild');
    let state = initialState(genesis); rootInvariant(state); fitRoot(state); const ids = new Set<string>();
    for (const value of entries) {
      const entry = object(value, ['envelope', 'receipt']), e = envelope(entry.envelope);
      if (ids.has(e.id)) stop('duplicate-accepted-entry', 'rebuild'); ids.add(e.id);
      let result: Exclude<ExecuteResult, Failure>;
      try { result = transitionValidatedRoot(state, e); } catch (error) { const f = caught(error); if (f.stage === 'budget') throw error; stop('history-recomputation-mismatch', 'rebuild', f.actionIndex); }
      if (result.duplicate) stop('duplicate-accepted-entry', 'rebuild');
      // Exact comparison is the closed receipt schema: no additional/omitted field,
      // wrong union branch, reordered audit, or fabricated signed/U32 value can pass.
      if (!same(entry.receipt, result.receipt)) stop('receipt-recomputation-mismatch', 'rebuild');
      state = result.state;
    }
    if (!same(raw, state)) stop('state-recomputation-mismatch', 'rebuild'); return state;
  } catch (e) {
    const f = caught(e); if (f.stage === 'budget') throw e; stop(f.reason, 'rebuild', f.actionIndex, f.blockingUnitId, f.officerId, f.facilityId, f.jobId);
  }
}

export function createBoundedCityPieceClockV1(input: BoundedCityPieceClockScenarioV1): BoundedCityPieceClockCreateOrLoadResultV1 {
  try { const state = initialState(scenario(detach(input))); rootInvariant(state); fitRoot(state); return freeze({ ok: true, state } as const); } catch (e) { return freeze(caught(e)); }
}
export function inspectBoundedCityPieceClockV1(input: BoundedCityPieceClockStateV1): BoundedCityPieceClockInspectResultV1 {
  try { const state = rebuildRoot(detach(input)); return freeze(inspected(state)); } catch (e) { return freeze(caught(e)); }
}
export function executeBoundedCityPieceClockV1(input: BoundedCityPieceClockStateV1, command: BoundedCityPieceClockEnvelopeV1): BoundedCityPieceClockExecuteResultV1 {
  try { const stateData = detach(input), commandData = detach(command); const state = rebuildRoot(stateData); return freeze(transitionValidatedRoot(state, envelope(commandData))); } catch (e) { return freeze(caught(e)); }
}
export function previewBoundedCityPieceClockV1(input: BoundedCityPieceClockStateV1, command: BoundedCityPieceClockEnvelopeV1): BoundedCityPieceClockPreviewResultV1 {
  try { const stateData = detach(input), commandData = detach(command); const state = rebuildRoot(stateData); return freeze(previewed(transitionValidatedRoot(state, envelope(commandData)), state.revision)); } catch (e) { return freeze(caught(e)); }
}
export function saveBoundedCityPieceClockV1(input: BoundedCityPieceClockStateV1): BoundedCityPieceClockSaveResultV1 {
  try { const state = rebuildRoot(detach(input)); const result = { ok: true, serialized: serialized(state) } as const; budget(result); return freeze(result); } catch (e) { return freeze(caught(e)); }
}
export function loadBoundedCityPieceClockV1(input: string): BoundedCityPieceClockCreateOrLoadResultV1 {
  try {
    const decoded = decodeBoundedCityJson(input); if (!decoded.ok) stop(decoded.reason, decoded.reason === 'budget-exceeded' ? 'budget' : 'input');
    const save = object(decoded.value, ['tag', 'state']); literal(save.tag, SAVE_TAG, 'unsupported-schema'); const state = rebuildRoot(save.state); const result = { ok: true, state } as const; budget(result); return freeze(result);
  } catch (e) { return freeze(caught(e)); }
}
function legalRequest(value: unknown, revision: number): LegalRequest {
  const r = object(value, ['requestId', 'expectedRevision', 'domesticOfficerIds', 'merchantRequests', 'cursor', 'pageSize']); id(r.requestId, 32); integer(r.expectedRevision);
  if (r.domesticOfficerIds !== null) unique(array(r.domesticOfficerIds, 3, 1, 'invalid-officer-count').map(v => id(v)), 'invalid-officer-count');
  const requests = array(r.merchantRequests, 4).map(value => { const p = object(value, ['officerId', 'foodAmount']); id(p.officerId); integer(p.foodAmount, MAX, 1); return canonicalBoundedCityJson(p); }); unique(requests, 'invalid-array');
  if (r.cursor !== null) {
    if (r.cursor === null || typeof r.cursor !== 'object' || Array.isArray(r.cursor)) stop('invalid-cursor');
    const c = r.cursor as Record<string, unknown>;
    if (!Object.hasOwn(c, 'version') || !Object.hasOwn(c, 'orderVersion')) stop('invalid-cursor');
    if (c.version !== 1 || c.orderVersion !== ORDER) stop('unsupported-cursor-version');
    object(c, ['version', 'orderVersion', 'stateDigest', 'requestDigest', 'revision', 'nextIndex'], 'invalid-cursor');
    for (const f of ['stateDigest', 'requestDigest']) if (typeof c[f] !== 'string' || !/^[a-f0-9]{64}$/.test(c[f] as string)) stop('invalid-cursor');
    integer(c.revision, 64, 0, 'invalid-cursor'); integer(c.nextIndex, 31, 0, 'invalid-cursor');
  }
  if (r.expectedRevision !== revision) stop('stale-revision', 'revision');
  choice(r.pageSize, [1, 2, 3, 4], 'invalid-page-size'); return r as unknown as LegalRequest;
}
function candidateCommands(s: Scenario, r: LegalRequest): Command[] {
  const commands: Command[] = [], cityId = s.city.id;
  const instant = (action: Action): void => { commands.push({ type: 'ExecuteCityActions', actions: [action] }); };
  if (r.domesticOfficerIds !== null) {
    const officerIds = r.domesticOfficerIds;
    instant({ type: 'Patrol', cityId, officerIds: [...officerIds] });
    for (const f of s.facilities) {
      if (f.kind === 'barracks') instant({ type: 'Recruit', cityId, officerIds: [...officerIds], facilityId: f.id });
      else if (f.kind === 'forge') for (const equipmentType of [1, 2, 3] as const) instant({ type: 'Produce', cityId, officerIds: [...officerIds], facilityId: f.id, equipmentType });
      else if (f.kind === 'stable') instant({ type: 'Produce', cityId, officerIds: [...officerIds], facilityId: f.id, equipmentType: 4 });
    }
  }
  for (const request of r.merchantRequests) for (const type of ['BuyFood', 'SellFood'] as const) instant({ type, cityId, officerId: request.officerId, foodAmount: request.foodAmount });
  if (r.domesticOfficerIds !== null) {
    const workshop = s.facilities.find(f => f.kind === 'workshop'); if (!workshop) stop('invariant-mismatch', 'invariant');
    commands.push({ type: 'StartPieceProduction', cityId, officerIds: [...r.domesticOfficerIds], facilityId: workshop.id, equipmentType: 5 });
  }
  commands.push({ type: 'AdvanceSharedCityTurn' });
  if (commands.length > 32) stop('budget-exceeded', 'budget'); return commands;
}
export function listBoundedCityPieceActionsV1(input: BoundedCityPieceClockStateV1, request: BoundedCityPieceClockLegalRequestV1): BoundedCityPieceClockLegalResultV1 {
  try {
    const stateData = detach(input), requestData = detach(request), state = rebuildRoot(stateData), r = legalRequest(requestData, state.revision);
    const stateDigest = digest(state), requestDigest = digest({ requestId: r.requestId, expectedRevision: r.expectedRevision, domesticOfficerIds: r.domesticOfficerIds, merchantRequests: r.merchantRequests });
    const commands = candidateCommands(state.genesis, r), total = commands.length;
    if (r.cursor !== null) {
      if (r.cursor.nextIndex >= total) stop('invalid-cursor');
      if (r.cursor.revision !== state.revision || r.cursor.stateDigest !== stateDigest) stop('cursor-state-mismatch');
      if (r.cursor.requestDigest !== requestDigest) stop('cursor-request-mismatch');
    }
    const envelopes: Envelope[] = commands.map((command, ordinal) => ({ id: `legal:${r.requestId}:${ordinal}`, expectedRevision: state.revision, command }));
    const existing = new Set(state.acceptedCommands.map(e => e.envelope.id));
    // Scan all IDs before evaluating even the first page, including later ordinals.
    if (envelopes.some(e => existing.has(e.id))) stop('candidate-id-collision', 'deduplication');
    const start = r.cursor?.nextIndex ?? 0;
    const page = (items: LegalSuccess['candidates']): LegalSuccess => {
      const end = start + items.length;
      return { ok: true, baseRevision: state.revision, stateDigest, requestDigest, totalCandidates: total, startIndex: start, endIndexExclusive: end,
        nextCursor: end === total ? null : { version: 1, orderVersion: ORDER, stateDigest, requestDigest, revision: state.revision, nextIndex: end },
        completePage: true, enumerationComplete: end === total, globalCompleteness: false, candidates: items,
        notEnumerated: ['other-officer-selections', 'other-food-amounts', 'multi-action-batches'] };
    };
    const items: LegalSuccess['candidates'] = []; let acceptedPage: LegalSuccess | null = null;
    for (let ordinal = start; ordinal < Math.min(total, start + r.pageSize); ordinal++) {
      const e = envelopes[ordinal]!; let result: PreviewResult;
      try { result = previewed(transitionValidatedRoot(state, e), state.revision); } catch (error) { result = caught(error); }
      const trial = page([...items, { globalOrdinal: ordinal, envelope: e, result }]);
      // Measure the real wrapper, including its actual terminal/null cursor.
      if (!boundedCityJsonFits(trial)) { if (acceptedPage === null) stop('budget-exceeded', 'budget'); return freeze(acceptedPage); }
      items.push({ globalOrdinal: ordinal, envelope: e, result }); acceptedPage = trial;
    }
    if (acceptedPage === null) stop('budget-exceeded', 'budget'); return freeze(acceptedPage);
  } catch (e) { return freeze(caught(e)); }
}
export function replayBoundedCityPieceClockV1(input: BoundedCityPieceClockTraceV1): BoundedCityPieceClockReplayResultV1 {
  let index: number | null = null;
  try {
    const trace = object(detach(input), ['tag', 'scenario', 'attempts', 'expectedFinalState']); literal(trace.tag, TRACE_TAG, 'unsupported-schema');
    const genesis = scenario(trace.scenario), attempts = array(trace.attempts, 512);
    // Outer shapes are checked before any attempt. Expected data never drives effects.
    for (const value of attempts) object(value, ['envelope', 'expected']);
    let state = initialState(genesis); rootInvariant(state); fitRoot(state); const outcomes: ReplayOutcome[] = [];
    for (let i = 0; i < attempts.length; i++) {
      index = i; const attempt = attempts[i] as { envelope: unknown; expected: unknown }; let outcome: ReplayOutcome;
      try { const result = transitionValidatedRoot(state, envelope(attempt.envelope)); state = result.state; outcome = { ok: true, duplicate: result.duplicate, receipt: result.receipt }; }
      catch (error) { outcome = caught(error); }
      if (attempt.expected !== null && !same(attempt.expected, outcome)) stop('trace-outcome-mismatch', 'comparison');
      outcomes.push(outcome);
      // Stop growing an output that can no longer fit. This is a total-output
      // failure (index null), never an attempt rejection or a partial-state result.
      try { budget({ ok: true, state, outcomes }); } catch (error) { index = null; throw error; }
    }
    index = null;
    if (trace.expectedFinalState !== null && !same(trace.expectedFinalState, state)) stop('trace-final-mismatch', 'comparison');
    const result = { ok: true, state, outcomes } as const; budget(result); return freeze(result);
  } catch (e) { return freeze({ ...caught(e), index, state: null } as const); }
}


/** Explicit synthetic resource-owner timeline. Old public commands and old saves stay unchanged.
 * Only this full outer replay may carry bridge writes between private city transitions. */
export function readBoundedSyntheticResourceTimeline(input: unknown) {
  try {
    const raw = object(detach(input), ['schema', 'cityScenario', 'resourceConfig', 'transportInitial', 'commands']);
    literal(raw.schema, 'bounded-synthetic-resource-timeline-v1');
    const g = scenario(raw.cityScenario);
    const synthetic = (v: string) => /^synthetic-[a-z0-9-]{1,48}$/.test(v);
    if (![g.episodeId, g.activeForceId, g.corps.id, g.corps.forceId, g.city.id, g.city.ownerForceId,
      ...g.officers.flatMap(o => [o.id, o.forceId, o.cityId]), ...g.facilities.flatMap(f => [f.id, f.cityId]),
      ...g.merchant.hostileForceIds, ...g.merchant.fieldUnits.flatMap(u => [u.id, u.forceId])].every(synthetic)) stop('invalid-data');
    let city = initialState(g);
    const context = () => ({ cityId: g.city.id, forceId: g.activeForceId, officerIds: g.officers.map(o => o.id),
      date: city.current.clock.date, actionPoints: city.current.ledger.actionPoints, gold: city.current.ledger.gold });
    const transferContext = () => ({ cityId: g.city.id, forceId: g.activeForceId, gold: city.current.ledger.gold,
      food: city.current.ledger.food, troops: city.current.ledger.troops, morale: city.current.ledger.morale,
      goldCapacity: g.city.goldCapacity, foodCapacity: g.city.foodCapacity, troopCapacity: g.city.troopCapacity,
      inventory: Object.fromEntries(([1, 2, 3, 4, 5] as const).map(e => [e, { quantity: city.current.ledger.inventory[e].quantity,
        reserved: city.current.ledger.inventory[e].reserved, capacity: g.city.inventory[e].capacity }])) });
    const metaCreated = createSyntheticResourceMetadata(raw.resourceConfig, context());
    if (!metaCreated.ok) return metaCreated;
    let metadata = metaCreated.metadata;
    const cargoCreated = createSyntheticCityTransports(raw.transportInitial, transferContext());
    if (!cargoCreated.ok) return cargoCreated;
    let transports = cargoCreated.transports;
    if (transports.some(t => [g.episodeId, g.activeForceId, g.corps.id, g.city.id, ...g.officers.map(o => o.id), ...g.facilities.map(f => f.id)].includes(t.id))) stop('duplicate-entity-id');
    if (metadata.items.some(item => [g.episodeId, g.activeForceId, g.corps.id, g.city.id, ...g.officers.map(o => o.id), ...g.facilities.map(f => f.id), ...transports.map(t => t.id)].includes(item.id))) stop('duplicate-entity-id');
    const commands: { id: string; expectedRevision: number; action: Record<string, unknown> }[] = [], receipts: unknown[] = [], ids = new Set<string>();
    const root = () => ({ schema: 'bounded-synthetic-resource-timeline-v1' as const, cityScenario: g,
      resourceConfig: raw.resourceConfig, transportInitial: raw.transportInitial, commands: [...commands] });
    const fit = () => { budget(root()); budget({ state: root(), current: city.current, metadata, transports, receipts }); };
    fit();
    for (const entry of array(raw.commands, 32)) {
      const c = object(entry, ['id', 'expectedRevision', 'action']), commandId = id(c.id);
      if (!synthetic(commandId) || integer(c.expectedRevision, 31) !== commands.length || ids.has(commandId)) stop('invalid-data');
      if (c.action === null || typeof c.action !== 'object' || Array.isArray(c.action)) stop('invalid-data');
      const a = c.action as Record<string, unknown>;
      let detail: unknown;
      if (a.kind === 'City' || a.kind === 'Tick') {
        if (a.kind === 'City') {
          object(a, ['kind', 'command']);
          if (a.command === null || typeof a.command !== 'object' || Array.isArray(a.command)) stop('invalid-data');
          const cc = a.command as Record<string, unknown>;
          if (cc.type !== 'ExecuteCityActions' && cc.type !== 'StartPieceProduction') stop('unsupported-command');
        } else object(a, ['kind']);
        const e = envelope({ id: `synthetic-resource-city-${commands.length}`, expectedRevision: city.revision,
          command: a.kind === 'Tick' ? { type: 'AdvanceSharedCityTurn' } : a.command });
        const transitioned = transitionValidatedRoot(city, e);
        if (transitioned.duplicate) stop('duplicate-accepted-entry');
        city = transitioned.state;
        detail = transitioned.receipt;
        if (a.kind === 'Tick') {
          const settled = applySyntheticResourceBridge(metadata, context(), { kind: 'WorldTick' });
          if (!settled.ok) return settled;
          city.current.ledger.gold = settled.ledgerPatch.gold;
          city.current.ledger.actionPoints = settled.ledgerPatch.actionPoints;
          metadata = settled.metadata;
          detail = { city: transitioned.receipt, monthlyAndNatural: settled.receipt };
        }
      } else if (a.kind === 'Grant' || a.kind === 'Confiscate') {
        const recipientId = a.kind === 'Grant' ? a.officerId : metadata.items.find(item => item.id === a.itemId)?.holder;
        const facts = g.officers.find(o => o.id === recipientId), actor = city.current.ledger.officers.find(o => o.id === recipientId);
        if (!facts || !facts.available || !actor || actor.reservationJobId !== null || actor.actedTurn === city.current.clock.turn) stop('officer-unavailable');
        const changed = applySyntheticResourceBridge(metadata, context(), a);
        if (!changed.ok) return changed;
        city.current.ledger.gold = changed.ledgerPatch.gold;
        city.current.ledger.actionPoints = changed.ledgerPatch.actionPoints;
        metadata = changed.metadata; detail = changed.receipt;
      } else if (a.kind === 'Transfer') {
        const moved = planSyntheticCityTransferBridge(transferContext(), transports, a);
        if (!moved.ok) return moved;
        const p = moved.cityPatch;
        city.current.ledger.gold = p.gold; city.current.ledger.food = p.food;
        city.current.ledger.troops = p.troops; city.current.ledger.morale = p.morale;
        for (const e of [1, 2, 3, 4, 5] as const) city.current.ledger.inventory[e].quantity = p.inventory[e].quantity;
        transports = moved.transports; detail = moved.receipt;
      } else stop('unsupported-command');
      currentInvariant(g, city.current);
      // Existing private history and jobs are retained intact; outer history proves bridge writes.
      if (32 - commands.length - 1 < reservedCompletionSlots(city.current)) stop('completion-history-slots');
      commands.push({ id: commandId, expectedRevision: commands.length, action: clone(a) }); ids.add(commandId);
      receipts.push({ commandId, clock: clone(city.current.clock), detail }); fit();
    }
    // No legacy State/tag is exposed: it is not a default save with a patched balance.
    const result = { ok: true as const, state: root(), genesis: g, current: city.current, metadata, transports,
      receipts, revision: commands.length, scope: 'synthetic-resource-owner-timeline-v1' as const };
    budget(result); return freeze(result);
  } catch (error) { return freeze(caught(error)); }
}
export function createBoundedSyntheticResourceTimeline(cityScenario: unknown, resourceConfig: unknown, transportInitial: unknown) {
  return readBoundedSyntheticResourceTimeline({ schema: 'bounded-synthetic-resource-timeline-v1', cityScenario, resourceConfig, transportInitial, commands: [] });
}
export function executeBoundedSyntheticResourceTimeline(input: unknown, command: unknown) {
  const current = readBoundedSyntheticResourceTimeline(input);
  if (!current.ok) return current;
  try {
    const c = object(detach(command), ['id', 'expectedRevision', 'action']);
    if (c.expectedRevision !== current.revision || current.revision >= 32) stop('stale-revision');
    return readBoundedSyntheticResourceTimeline({ ...current.state, commands: [...current.state.commands, c] });
  } catch (error) { return freeze(caught(error)); }
}

/** Explicit synthetic resource-owner timeline. Old public commands and old saves stay unchanged.
 * Only this full outer replay may carry bridge writes between private city transitions. */
export function readBoundedSyntheticDynamicTimeline(input: unknown) {
  try {
    const raw = object(detach(input), ['schema', 'cityScenario', 'resourceConfig', 'transportInitial', 'fieldCells', 'fieldTemplates', 'commands']);
    literal(raw.schema, 'bounded-synthetic-dynamic-timeline-v2');
    const g = scenario(raw.cityScenario);
    const synthetic = (v: string) => /^synthetic-[a-z0-9-]{1,48}$/.test(v);
    if (![g.episodeId, g.activeForceId, g.corps.id, g.corps.forceId, g.city.id, g.city.ownerForceId,
      ...g.officers.flatMap(o => [o.id, o.forceId, o.cityId]), ...g.facilities.flatMap(f => [f.id, f.cityId]),
      ...g.merchant.hostileForceIds, ...g.merchant.fieldUnits.flatMap(u => [u.id, u.forceId])].every(synthetic)) stop('invalid-data');
    let city = initialState(g);
    if (g.clock.turn !== 0 || g.merchant.fieldUnits.length || g.merchant.hostileForceIds.length) stop('invalid-data');
    const fieldCreated = createInferredDynamicField(raw.fieldCells, raw.fieldTemplates);
    if (!fieldCreated.ok) return fieldCreated;
    let field = fieldCreated;
    const nonOfficerIds = [g.episodeId, g.activeForceId, g.corps.id, g.city.id, ...g.facilities.map(f => f.id)];
    if (g.officers.some(officer => nonOfficerIds.includes(officer.id))) stop('duplicate-entity-id');
    for (const template of field.state.templates) {
      const officer = g.officers.find(o => o.id === template.id);
      if (!officer || officer.intelligence !== template.intelligence || officer.available !== template.available) stop('invalid-data');
    }
    const deployed = (actorId: unknown) => field.roster.some(o => o.id === actorId && o.role === 'deployed');
    const context = () => ({ cityId: g.city.id, forceId: g.activeForceId, officerIds: g.officers.map(o => o.id),
      date: city.current.clock.date, actionPoints: city.current.ledger.actionPoints, gold: city.current.ledger.gold });
    const transferContext = () => ({ cityId: g.city.id, forceId: g.activeForceId, gold: city.current.ledger.gold,
      food: city.current.ledger.food, troops: city.current.ledger.troops, morale: city.current.ledger.morale,
      goldCapacity: g.city.goldCapacity, foodCapacity: g.city.foodCapacity, troopCapacity: g.city.troopCapacity,
      inventory: Object.fromEntries(([1, 2, 3, 4, 5] as const).map(e => [e, { quantity: city.current.ledger.inventory[e].quantity,
        reserved: city.current.ledger.inventory[e].reserved, capacity: g.city.inventory[e].capacity }])) });
    const metaCreated = createSyntheticResourceMetadata(raw.resourceConfig, context());
    if (!metaCreated.ok) return metaCreated;
    let metadata = metaCreated.metadata;
    const cargoCreated = createSyntheticCityTransports(raw.transportInitial, transferContext());
    if (!cargoCreated.ok) return cargoCreated;
    let transports = cargoCreated.transports;
    if (transports.some(t => [g.episodeId, g.activeForceId, g.corps.id, g.city.id, ...g.officers.map(o => o.id), ...g.facilities.map(f => f.id)].includes(t.id))) stop('duplicate-entity-id');
    if (metadata.items.some(item => [g.episodeId, g.activeForceId, g.corps.id, g.city.id, ...g.officers.map(o => o.id), ...g.facilities.map(f => f.id), ...transports.map(t => t.id)].includes(item.id))) stop('duplicate-entity-id');
    if (field.state.cells.some(cell => [g.episodeId,g.activeForceId,g.corps.id,g.city.id,...g.officers.map(o=>o.id),...g.facilities.map(f=>f.id),...transports.map(t=>t.id),...metadata.items.map(i=>i.id)].includes(cell))) stop('duplicate-entity-id');
    const commands: { id: string; expectedRevision: number; action: Record<string, unknown> }[] = [], receipts: unknown[] = [], ids = new Set<string>();
    const root = () => ({ schema: 'bounded-synthetic-dynamic-timeline-v2' as const, cityScenario: g,
      resourceConfig: raw.resourceConfig, transportInitial: raw.transportInitial, fieldCells: fieldCreated.state.cells, fieldTemplates: fieldCreated.state.templates, commands: [...commands] });
    const fit = () => { budget(root()); budget({ state: root(), current: city.current, metadata, transports, field, receipts }); };
    fit();
    for (const entry of array(raw.commands, 32)) {
      const c = object(entry, ['id', 'expectedRevision', 'action']), commandId = id(c.id);
      if (!synthetic(commandId) || integer(c.expectedRevision, 31) !== commands.length || ids.has(commandId)) stop('invalid-data');
      if (c.action === null || typeof c.action !== 'object' || Array.isArray(c.action)) stop('invalid-data');
      const a = c.action as Record<string, unknown>;
      let detail: unknown;
      if (a.kind === 'City' || a.kind === 'Tick') {
        if (a.kind === 'City') {
          object(a, ['kind', 'command']);
          if (a.command === null || typeof a.command !== 'object' || Array.isArray(a.command)) stop('invalid-data');
          const cc = a.command as Record<string, unknown>;
          if (cc.type !== 'ExecuteCityActions' && cc.type !== 'StartPieceProduction') stop('unsupported-command');
          const cityCommand = envelope({ id: 'synthetic-validate-city', expectedRevision: city.revision, command: cc }).command;
          const actors = cityCommand.type === 'StartPieceProduction' ? cityCommand.officerIds : cityCommand.type === 'ExecuteCityActions'
            ? cityCommand.actions.flatMap(action => action.type === 'BuyFood' || action.type === 'SellFood' ? [action.officerId] : action.officerIds) : [];
          if (actors.some(deployed)) stop('officer-unavailable');
        } else object(a, ['kind', 'draws']);
        const e = envelope({ id: `synthetic-resource-city-${commands.length}`, expectedRevision: city.revision,
          command: a.kind === 'Tick' ? { type: 'AdvanceSharedCityTurn' } : a.command });
        const transitioned = transitionValidatedRoot(city, e);
        if (transitioned.duplicate) stop('duplicate-accepted-entry');
        city = transitioned.state;
        detail = transitioned.receipt;
        if (a.kind === 'Tick') {
          const settled = applySyntheticResourceBridge(metadata, context(), { kind: 'WorldTick' });
          if (!settled.ok) return settled;
          city.current.ledger.gold = settled.ledgerPatch.gold;
          city.current.ledger.actionPoints = settled.ledgerPatch.actionPoints;
          metadata = settled.metadata;
          const advancedField = executeInferredDynamicField(field.state, { id: `synthetic-dynamic-${commands.length}`, expectedRevision: field.revision, action: { kind: 'FieldTick', draws: a.draws } });
          if (!advancedField.ok) return advancedField;
          field = advancedField;
          detail = { city: transitioned.receipt, monthlyAndNatural: settled.receipt };
        }
      } else if (a.kind === 'Grant' || a.kind === 'Confiscate') {
        const recipientId = a.kind === 'Grant' ? a.officerId : metadata.items.find(item => item.id === a.itemId)?.holder;
        const facts = g.officers.find(o => o.id === recipientId), actor = city.current.ledger.officers.find(o => o.id === recipientId);
        if (deployed(recipientId) || !facts || !facts.available || !actor || actor.reservationJobId !== null || actor.actedTurn === city.current.clock.turn) stop('officer-unavailable');
        const changed = applySyntheticResourceBridge(metadata, context(), a);
        if (!changed.ok) return changed;
        city.current.ledger.gold = changed.ledgerPatch.gold;
        city.current.ledger.actionPoints = changed.ledgerPatch.actionPoints;
        metadata = changed.metadata; detail = changed.receipt;
      } else if (a.kind === 'Deploy' || a.kind === 'Return') {
        object(a, a.kind === 'Deploy' ? ['kind','actorId','troops'] : ['kind','actorId']);
        const actorId = id(a.actorId), officer = city.current.ledger.officers.find(o => o.id === actorId), facts = g.officers.find(o => o.id === actorId);
        const role = field.roster.find(o => o.id === actorId), template = field.state.templates.find(o => o.id === actorId);
        if (!officer || !facts || !facts.available || !role || !template || officer.reservationJobId !== null || officer.actedTurn === city.current.clock.turn) stop('officer-unavailable');
        const beforeTroops = city.current.ledger.troops, beforeMorale = city.current.ledger.morale;
        const apBefore = city.current.ledger.actionPoints;
        let apCost = 0, apPlan: unknown = null;
        let quantity: number, nextTroops: number, nextMorale = beforeMorale;
        if (a.kind === 'Deploy') {
          const planned = projectInferredCommandAP('deploy', false);
          if (!planned.ok) return planned;
          if (apBefore < planned.requestedAP) stop('insufficient-action-points');
          apCost = planned.requestedAP; apPlan = planned;
          quantity = integer(a.troops, 60000, 1);
          if (role.role !== 'resident' || beforeTroops <= quantity || beforeMorale > 100
            || field.fires.some(f => f.cellId === template.entryCellId)
            || field.roster.some(o => o.role === 'deployed' && o.cellId === template.entryCellId)) stop('invalid-data');
          nextTroops = beforeTroops - quantity;
        } else {
          if (role.role !== 'deployed' || role.acted || role.confusedTurns !== 0 || role.cellId !== template.entryCellId) stop('officer-unavailable');
          quantity = role.troops; nextTroops = beforeTroops + quantity;
          if (!Number.isSafeInteger(nextTroops) || nextTroops > g.city.troopCapacity) stop('invalid-data');
          nextMorale = Number((BigInt(beforeTroops) * BigInt(beforeMorale) + BigInt(quantity) * BigInt(role.energy)) / BigInt(nextTroops));
        }
        const changedField = executeInferredDynamicField(field.state, { id: `synthetic-dynamic-${commands.length}`, expectedRevision: field.revision,
          action: a.kind === 'Deploy' ? {kind:'Deploy',actorId,troops:quantity,energy:beforeMorale} : {kind:'Return',actorId} });
        if (!changedField.ok) return changedField;
        field = changedField; city.current.ledger.actionPoints = apBefore - apCost; city.current.ledger.troops = nextTroops; city.current.ledger.morale = nextMorale; officer.actedTurn = city.current.clock.turn;
        detail = {kind:a.kind,actorId,quantity,apBefore,apAfter:city.current.ledger.actionPoints,apCost,apPlan,officePolicy:'no-military-office-profile-v2',cityTroopsBefore:beforeTroops,cityTroopsAfter:nextTroops,cityMoraleBefore:beforeMorale,cityMoraleAfter:nextMorale,field:field.receipts[field.receipts.length-1],policy:'inferred-fixed-entry-weighted-floor-deployment-v2'};
      } else if (a.kind === 'Field') {
        object(a,['kind','command']);
        if (a.command === null || typeof a.command !== 'object' || Array.isArray(a.command)) stop('invalid-data');
        const command = a.command as Record<string,unknown>;
        if (command.kind !== 'Cast' && command.kind !== 'FireCast') stop('unsupported-command');
        const changedField = executeInferredDynamicField(field.state,{id:`synthetic-dynamic-${commands.length}`,expectedRevision:field.revision,action:command});
        if (!changedField.ok) return changedField;
        field = changedField; detail = field.receipts[field.receipts.length-1];
      } else if (a.kind === 'Transfer') {
        const moved = planSyntheticCityTransferBridge(transferContext(), transports, a);
        if (!moved.ok) return moved;
        const p = moved.cityPatch;
        city.current.ledger.gold = p.gold; city.current.ledger.food = p.food;
        city.current.ledger.troops = p.troops; city.current.ledger.morale = p.morale;
        for (const e of [1, 2, 3, 4, 5] as const) city.current.ledger.inventory[e].quantity = p.inventory[e].quantity;
        transports = moved.transports; detail = moved.receipt;
      } else stop('unsupported-command');
      currentInvariant(g, city.current);
      if (city.current.clock.turn !== field.turn) stop('invariant-mismatch');
      if (32 - field.revision < reservedCompletionSlots(city.current)) stop('completion-history-slots');
      // Existing private history and jobs are retained intact; outer history proves bridge writes.
      if (32 - commands.length - 1 < reservedCompletionSlots(city.current)) stop('completion-history-slots');
      commands.push({ id: commandId, expectedRevision: commands.length, action: clone(a) }); ids.add(commandId);
      receipts.push({ commandId, clock: clone(city.current.clock), detail }); fit();
    }
    // No legacy State/tag is exposed: it is not a default save with a patched balance.
    const result = { ok: true as const, state: root(), genesis: g, current: city.current, metadata, transports, field,
      receipts, revision: commands.length, scope: 'synthetic-dynamic-resource-owner-timeline-v2' as const };
    budget(result); return freeze(result);
  } catch (error) { return freeze(caught(error)); }
}
export function createBoundedSyntheticDynamicTimeline(cityScenario: unknown, resourceConfig: unknown, transportInitial: unknown, fieldCells: unknown, fieldTemplates: unknown) {
  return readBoundedSyntheticDynamicTimeline({ schema: 'bounded-synthetic-dynamic-timeline-v2', cityScenario, resourceConfig, transportInitial, fieldCells, fieldTemplates, commands: [] });
}
export function executeBoundedSyntheticDynamicTimeline(input: unknown, command: unknown) {
  const current = readBoundedSyntheticDynamicTimeline(input);
  if (!current.ok) return current;
  try {
    const c = object(detach(command), ['id', 'expectedRevision', 'action']);
    if (c.expectedRevision !== current.revision || current.revision >= 32) stop('stale-revision');
    return readBoundedSyntheticDynamicTimeline({ ...current.state, commands: [...current.state.commands, c] });
  } catch (error) { return freeze(caught(error)); }
}

/** Explicit synthetic resource-owner timeline. Old public commands and old saves stay unchanged.
 * Only this full outer replay may carry bridge writes between private city transitions. */
export function readBoundedSyntheticMobileTimeline(input: unknown) {
  try {
    const detached = detach(input);
    const enabled = detached !== null && typeof detached === 'object' && !Array.isArray(detached) && Object.hasOwn(detached,'progressConfig');
    const forgeEnabled=detached!==null&&typeof detached==='object'&&!Array.isArray(detached)&&Object.hasOwn(detached,'forgeConfig');
    const foodEnabled=detached!==null&&typeof detached==='object'&&!Array.isArray(detached)&&Object.hasOwn(detached,'foodConfig');
    const researchEnabled=detached!==null&&typeof detached==='object'&&!Array.isArray(detached)&&Object.hasOwn(detached,'researchConfig');
    const incomeEnabled=detached!==null&&typeof detached==='object'&&!Array.isArray(detached)&&Object.hasOwn(detached,'incomeConfig');
    const raw = object(detached, ['schema', 'cityScenario', 'resourceConfig', 'transportInitial', 'fieldCells', 'fieldTemplates', 'movementMap', 'movementProfiles', 'commands', ...(enabled ? ['progressConfig'] : []),...(forgeEnabled?['forgeConfig']:[]),...(foodEnabled?['foodConfig']:[]),...(incomeEnabled?['incomeConfig']:[]),...(researchEnabled?['researchConfig']:[])]);
    literal(raw.schema, 'bounded-synthetic-mobile-timeline-v3');
    const g = scenario(raw.cityScenario);
    const synthetic = (v: string) => /^synthetic-[a-z0-9-]{1,48}$/.test(v);
    if (![g.episodeId, g.activeForceId, g.corps.id, g.corps.forceId, g.city.id, g.city.ownerForceId,
      ...g.officers.flatMap(o => [o.id, o.forceId, o.cityId]), ...g.facilities.flatMap(f => [f.id, f.cityId]),
      ...g.merchant.hostileForceIds, ...g.merchant.fieldUnits.flatMap(u => [u.id, u.forceId])].every(synthetic)) stop('invalid-data');
    let city = initialState(g);
    if (g.clock.turn !== 0 || g.merchant.fieldUnits.length || g.merchant.hostileForceIds.length) stop('invalid-data');
    const fieldCreated = createInferredMobileField(raw.fieldCells, raw.fieldTemplates, raw.movementMap, raw.movementProfiles);
    if (!fieldCreated.ok) return fieldCreated;
    let field = fieldCreated;
    const nonOfficerIds = [g.episodeId, g.activeForceId, g.corps.id, g.city.id, ...g.facilities.map(f => f.id)];
    if (g.officers.some(officer => nonOfficerIds.includes(officer.id))) stop('duplicate-entity-id');
    for (const template of field.state.templates) {
      const officer = g.officers.find(o => o.id === template.id);
      if (!officer || officer.intelligence !== template.intelligence || officer.available !== template.available) stop('invalid-data');
    }
    const deployed = (actorId: unknown) => field.roster.some(o => o.id === actorId && o.role === 'deployed');
    const context = () => ({ cityId: g.city.id, forceId: g.activeForceId, officerIds: g.officers.map(o => o.id),
      date: city.current.clock.date, actionPoints: city.current.ledger.actionPoints, gold: city.current.ledger.gold });
    const transferContext = () => ({ cityId: g.city.id, forceId: g.activeForceId, gold: city.current.ledger.gold,
      food: city.current.ledger.food, troops: city.current.ledger.troops, morale: city.current.ledger.morale,
      goldCapacity: g.city.goldCapacity, foodCapacity: g.city.foodCapacity, troopCapacity: g.city.troopCapacity,
      inventory: Object.fromEntries(([1, 2, 3, 4, 5] as const).map(e => [e, { quantity: city.current.ledger.inventory[e].quantity,
        reserved: city.current.ledger.inventory[e].reserved, capacity: g.city.inventory[e].capacity }])) });
    const metaCreated = createSyntheticResourceMetadata(raw.resourceConfig, context());
    if (!metaCreated.ok) return metaCreated;
    let metadata = metaCreated.metadata;
    const cargoCreated = createSyntheticCityTransports(raw.transportInitial, transferContext());
    if (!cargoCreated.ok) return cargoCreated;
    let transports = cargoCreated.transports;
    if (transports.some(t => [g.episodeId, g.activeForceId, g.corps.id, g.city.id, ...g.officers.map(o => o.id), ...g.facilities.map(f => f.id)].includes(t.id))) stop('duplicate-entity-id');
    if (metadata.items.some(item => [g.episodeId, g.activeForceId, g.corps.id, g.city.id, ...g.officers.map(o => o.id), ...g.facilities.map(f => f.id), ...transports.map(t => t.id)].includes(item.id))) stop('duplicate-entity-id');
    if (field.state.cells.some(cell => [g.episodeId,g.activeForceId,g.corps.id,g.city.id,...g.officers.map(o=>o.id),...g.facilities.map(f=>f.id),...transports.map(t=>t.id),...metadata.items.map(i=>i.id)].includes(cell))) stop('duplicate-entity-id');
    let progress: { techniquePoints: number; trainingUsedTurn: number | null; drillGround: 'none'|'building'|'complete'; officers: {id:string;warBase:number;warXp:number}[]; equipment: unknown } | null = null;
    if (enabled) {
      const config = object(raw.progressConfig,['policyId','techniquePoints','techniqueIds','drillGround','officers','equipment']);
      literal(config.policyId,'inferred-unified-training-progress-v1');
      if (array(config.techniqueIds,0).length !== 0 || g.officers.length > 32 || !g.officers.some(o=>o.id===metadata.personnelFacts.ruler.id)) stop('invalid-data');
      const rows = array(config.officers,32,1).map(row=>{const p=object(row,['id','warBase','warXp']);return {id:id(p.id),warBase:integer(p.warBase,100),warXp:integer(p.warXp,TRAINING_RULESET.progressionConfig.experienceCap)};});
      if(rows.length!==g.officers.length||rows.some((r,i)=>r.id!==g.officers[i]!.id))stop('invalid-data');
      progress={techniquePoints:integer(config.techniquePoints,10000),trainingUsedTurn:null,
        drillGround:choice(config.drillGround,['none','building','complete'] as const),officers:rows,equipment:config.equipment};
    }
    const effective = () => {
      if (!progress) return null;
      const projection=projectSyntheticTreasureAttributes(metadata.items,g.officers.map(o=>{const row=progress!.officers.find(p=>p.id===o.id)!;return {
        id:o.id,leadership:o.leadership,charm:o.charm,intelligence:o.intelligence,politics:o.politics,war:trainingDerivedWar(row.warBase,row.warXp,TRAINING_RULESET.progressionConfig)};}),{equipment:progress.equipment});
      if(!projection.ok)stop('invalid-data');
      return projection;
    };
    effective();
    let forge:{facilityId:string;complete:boolean;job:SyntheticForgeJob|null}|null=null;
    if(forgeEnabled){
      if(!progress)stop('invalid-data');
      const config=object(raw.forgeConfig,['profile','facilityId']);literal(config.profile,'single-forge-owner-v1');
      const facilityId=id(config.facilityId),facts=g.facilities.find(f=>f.id===facilityId);
      if(!facts||facts.kind!=='forge'||facts.level!==1||facts.complete)stop('invalid-data');
      forge={facilityId,complete:false,job:null};
    }
    let research:{talentOffice:'none'|'building'|'complete';difficulty:'beginner'|'advanced'|'super';policies:unknown;guidanceOfficerIds:string[];completedTechniqueIds:number[];job:SyntheticTechniqueOwnerJob|null}|null=null;
    if(researchEnabled){
      if(!progress)stop('invalid-data');
      const config=object(raw.researchConfig,['profile','maxAdvances','talentOffice','difficulty','policies','guidanceOfficerIds']);literal(config.profile,'unified-technique-horizon21-v1');literal(config.maxAdvances,21);
      integer(g.clock.turn+21);advanceDate(g.clock.date,21);
      const guidanceOfficerIds=array(config.guidanceOfficerIds,32).map(v=>id(v));unique(guidanceOfficerIds);if(guidanceOfficerIds.some(id=>!g.officers.some(o=>o.id===id)))stop('invalid-data');
      research={talentOffice:choice(config.talentOffice,['none','building','complete'] as const),difficulty:choice(config.difficulty,['beginner','advanced','super'] as const),policies:config.policies,guidanceOfficerIds,completedTechniqueIds:[],job:null};
    }
    const horizon=research?21:g.advanceLimit;
    const researchExtension=():SyntheticResearchExtension|undefined=>research?{maxAdvances:21,activeJobId:research.job?.source.status==='active'?research.job.source.id:null,officerIds:research.job?.source.status==='active'?research.job.source.officerIds:[]}:undefined;
    const extension=():SyntheticForgeExtension|undefined=>forge?{facilityId:forge.facilityId,complete:forge.complete,
      activeJobId:forge.job?.completedTurn===null?forge.job.id:null,officerIds:forge.job?.completedTurn===null?forge.job.officerIds:[]}:undefined;
    const remainingCompletion=()=>Math.max(reservedCompletionSlots(city.current),forge?.job?.completedTurn===null?forge.job.remainingTurns:0,research?.job?.source.status==='active'?research.job.source.remainingTurns:0);
    const foodContext=()=>({turn:city.current.clock.turn,date:city.current.clock.date,
      city:{id:g.city.id,ownerId:g.activeForceId,troops:city.current.ledger.troops,food:city.current.ledger.food,foodCapacity:g.city.foodCapacity},
      transports:transports.map(t=>({id:t.id,ownerId:t.ownerId,troops:t.stock.troops,food:t.stock.food,foodCapacity:t.capacity.food}))});
    if(foodEnabled){const probe=planSyntheticNeutralFoodTick(foodContext(),raw.foodConfig);if(!probe.ok)return probe;}
    type IncomeFacility={id:string;kind:string;level:number;complete:boolean};
    let income:{economicFacilities:IncomeFacility[];layout:({facilityId:string;position:{q:number;r:number}}|null)[];parameters:Record<string,unknown>}|null=null;
    if(incomeEnabled){
      const config=object(raw.incomeConfig,['profile','economicFacilities','layout','excludedBoundFacilityIds','parameters']);literal(config.profile,'unified-income-owner-v1');
      const existingIds=[g.episodeId,g.activeForceId,g.corps.id,g.city.id,...g.officers.map(o=>o.id),...g.facilities.map(f=>f.id),...field.state.cells,field.state.movementMap.id,...transports.map(t=>t.id),...metadata.items.map(i=>i.id),metadata.personnelFacts.ruler.id];
      const economicFacilities=array(config.economicFacilities,30).map(raw=>{const f=object(raw,['id','kind','level','complete']);
        const facilityId=id(f.id);if(!synthetic(facilityId)||existingIds.includes(facilityId))stop('duplicate-entity-id');
        return{id:facilityId,kind:choice(f.kind,['market','farm','mint','granary','large-market','fish-market','black-market','military-farm'] as const),level:integer(f.level,3,1),complete:boolean(f.complete)};});
      unique(economicFacilities.map(f=>f.id));
      const excluded=array(config.excludedBoundFacilityIds,4).map(v=>id(v)),expectedExcluded=g.facilities.filter(f=>f.kind==='barracks'||f.kind==='workshop').map(f=>f.id);
      unique(excluded);if(excluded.length!==expectedExcluded.length||excluded.some(id=>!expectedExcluded.includes(id)))stop('invalid-data');
      const allowed=[...g.facilities.filter(f=>f.kind==='forge'||f.kind==='stable').map(f=>f.id),...economicFacilities.map(f=>f.id)];
      const layout=array(config.layout,30,30).map(value=>{if(value===null)return null;const row=object(value,['facilityId','position']),p=object(row.position,['q','r']);
        const facilityId=id(row.facilityId);if(!allowed.includes(facilityId))stop('invalid-data');return{facilityId,position:{q:integer(p.q,1000000,-1000000),r:integer(p.r,1000000,-1000000)}};});
      const positioned=layout.filter((p):p is NonNullable<typeof p>=>p!==null);unique(positioned.map(p=>p.facilityId));unique(positioned.map(p=>`${p.position.q},${p.position.r}`));
      if(positioned.length!==allowed.length||allowed.some(id=>!positioned.some(p=>p.facilityId===id)))stop('invalid-data');
      const parameters=object(config.parameters,['profile','baseMoneyWord','baseFoodWord','difficulty','controller','incomeSkills','harvestInputs']);
      const harvestKeys=new Set(array(parameters.harvestInputs,120).map(row=>{const p=object(row,['year','month','postMonthlyHarvest']);return `${integer(p.year,9999,1)}-${integer(p.month,12,1)}`;}));
      for(let step=0;step<=horizon;step++){const d=advanceDate(g.clock.date,step);if(d.day===1&&!harvestKeys.has(`${d.year}-${d.month}`))stop('invalid-data');}
      income={economicFacilities,layout,parameters};
    }
    const incomeFacilities=()=>income!.layout.map(slot=>{if(slot===null)return null;
      const bound=effectiveSyntheticScenario(g,extension()).facilities.find(f=>f.id===slot.facilityId),fact=bound??income!.economicFacilities.find(f=>f.id===slot.facilityId)!;
      return{id:fact.id,kind:fact.kind,level:fact.level,complete:fact.complete,position:slot.position};});
    const incomeContext=()=>({cityId:g.city.id,ownerId:g.activeForceId,turn:city.current.clock.turn,date:city.current.clock.date,
      gold:city.current.ledger.gold,food:city.current.ledger.food,goldCapacity:g.city.goldCapacity,foodCapacity:g.city.foodCapacity,
      security:city.current.ledger.security,troops:city.current.ledger.troops,facilities:incomeFacilities()});
    if(income){const probe=planSyntheticIncomeLeaves(incomeContext(),income.parameters);if(!probe.ok)return probe;}
    const commands: { id: string; expectedRevision: number; action: Record<string, unknown> }[] = [], receipts: unknown[] = [], ids = new Set<string>();
    const forgeContext=()=>({cityId:g.city.id,forceId:g.activeForceId,turn:city.current.clock.turn,gold:city.current.ledger.gold,
      actionPoints:city.current.ledger.actionPoints,techniquePoints:progress!.techniquePoints,
      remainingTickCapacity:Math.min(horizon-city.current.clock.advancedCount,32-commands.length-1,32-field.revision),enemyWithinTwoCells:false,
      facility:{id:forge!.facilityId,kind:'forge' as const,level:1 as const,complete:forge!.complete,reservationJobId:city.current.ledger.facilities.find(f=>f.id===forge!.facilityId)!.reservationJobId},
      officers:g.officers.map(o=>{const p=city.current.ledger.officers.find(p=>p.id===o.id)!;return{id:o.id,forceId:o.forceId,cityId:o.cityId,available:o.available,
        role:deployed(o.id)?'deployed' as const:'resident' as const,politics:o.politics,politicsXp:p.xp.politics,merit:p.merit,actedTurn:p.actedTurn,reservationJobId:p.reservationJobId};})});
    const commitForge=(result:Exclude<ReturnType<typeof planSyntheticForgeStart>,{ok:false}>|Exclude<ReturnType<typeof advanceSyntheticForge>,{ok:false}>)=>{
      const patch=result.patch;forge!.job=clone(result.job);forge!.complete=patch.facility.complete;
      city.current.ledger.gold=patch.gold;city.current.ledger.actionPoints=patch.actionPoints;progress!.techniquePoints=patch.techniquePoints;
      city.current.ledger.facilities.find(f=>f.id===forge!.facilityId)!.reservationJobId=patch.facility.reservationJobId;
      for(const p of patch.officers){const actor=city.current.ledger.officers.find(o=>o.id===p.id)!;actor.xp.politics=p.politicsXp;actor.merit=p.merit;actor.actedTurn=p.actedTurn;actor.reservationJobId=p.reservationJobId;}
    };
    const techniqueContext=()=>({cityId:g.city.id,forceId:g.activeForceId,corpsId:g.corps.id,turn:city.current.clock.turn,date:city.current.clock.date,
      gold:city.current.ledger.gold,actionPoints:city.current.ledger.actionPoints,techniquePoints:progress!.techniquePoints,completedTechniqueIds:research!.completedTechniqueIds,
      remainingTickCapacity:Math.min(horizon-city.current.clock.advancedCount,32-commands.length-1,32-field.revision,64-city.revision),enemyWithinTwoCells:false,
      talentOffice:research!.talentOffice,difficulty:research!.difficulty,activeResearchJobId:researchExtension()!.activeJobId,policies:research!.policies,
      officers:g.officers.map(o=>{const current=city.current.ledger.officers.find(p=>p.id===o.id)!,war=progress!.officers.find(p=>p.id===o.id)!,stats=effective()!.projections.find(p=>p.officerId===o.id)!.effective;
        return{id:o.id,forceId:o.forceId,cityId:o.cityId,available:o.available,role:deployed(o.id)?'deployed':'resident',effectiveAttributes:{leadership:stats.leadership,war:stats.war,intelligence:stats.intelligence,politics:stats.politics},skillKeys:research!.guidanceOfficerIds.includes(o.id)?['guidance']:[],
          xp:{leadership:current.xp.leadership,war:war.warXp,intelligence:current.xp.intelligence,politics:current.xp.politics},merit:current.merit,actedTurn:current.actedTurn,reservationJobId:current.reservationJobId};})});
    if(research){const valid=validateSyntheticTechniqueContext(techniqueContext());if(!valid.ok)return valid;}
    const commitTechnique=(result:Exclude<ReturnType<typeof planSyntheticTechniqueStart>,{ok:false}>)=>{
      research!.job=clone(result.job);research!.completedTechniqueIds=[...result.patch.completedTechniqueIds];
      city.current.ledger.gold=result.patch.gold;city.current.ledger.actionPoints=result.patch.actionPoints;progress!.techniquePoints=result.patch.techniquePoints;
      for(const row of result.patch.officers){const current=city.current.ledger.officers.find(o=>o.id===row.id)!,war=progress!.officers.find(o=>o.id===row.id)!;
        current.xp.leadership=row.xp.leadership;current.xp.intelligence=row.xp.intelligence;current.xp.politics=row.xp.politics;war.warXp=integer(row.xp.war,TRAINING_RULESET.progressionConfig.experienceCap);
        current.merit=row.merit;current.actedTurn=row.actedTurn;current.reservationJobId=row.reservationJobId;}
    };
    const root = () => ({ schema: 'bounded-synthetic-mobile-timeline-v3' as const, cityScenario: g,
      resourceConfig: raw.resourceConfig, transportInitial: raw.transportInitial, fieldCells: fieldCreated.state.cells, fieldTemplates: fieldCreated.state.templates, movementMap: fieldCreated.state.movementMap, movementProfiles: fieldCreated.state.movementProfiles, ...(enabled ? {progressConfig:raw.progressConfig} : {}),...(forgeEnabled?{forgeConfig:raw.forgeConfig}:{}),...(foodEnabled?{foodConfig:raw.foodConfig}:{}),...(incomeEnabled?{incomeConfig:raw.incomeConfig}:{}),...(researchEnabled?{researchConfig:raw.researchConfig}:{}), commands: [...commands] });
    const fit = () => { budget(root()); budget({ state: root(), current: city.current, metadata, transports, field, receipts, ...(enabled ? {progress,effectiveAttributes:effective()} : {}),...(forgeEnabled?{forge,completionTicksRequired:remainingCompletion()}: {}),...(researchEnabled?{research,completionTicksRequired:remainingCompletion()}: {}) }); };
    fit();
    for (const entry of array(raw.commands, 32)) {
      const c = object(entry, ['id', 'expectedRevision', 'action']), commandId = id(c.id);
      if (!synthetic(commandId) || integer(c.expectedRevision, 31) !== commands.length || ids.has(commandId)) stop('invalid-data');
      if (c.action === null || typeof c.action !== 'object' || Array.isArray(c.action)) stop('invalid-data');
      const a = c.action as Record<string, unknown>;
      let detail: unknown;
      if (a.kind === 'City' || a.kind === 'Tick') {
        if (a.kind === 'City') {
          object(a, ['kind', 'command']);
          if (a.command === null || typeof a.command !== 'object' || Array.isArray(a.command)) stop('invalid-data');
          const cc = a.command as Record<string, unknown>;
          if (cc.type !== 'ExecuteCityActions' && cc.type !== 'StartPieceProduction') stop('unsupported-command');
          const cityCommand = envelope({ id: 'synthetic-validate-city', expectedRevision: city.revision, command: cc }).command;
          const actors = cityCommand.type === 'StartPieceProduction' ? cityCommand.officerIds : cityCommand.type === 'ExecuteCityActions'
            ? cityCommand.actions.flatMap(action => action.type === 'BuyFood' || action.type === 'SellFood' ? [action.officerId] : action.officerIds) : [];
          if (actors.some(deployed)) stop('officer-unavailable');
        } else object(a, ['kind', 'draws']);
        const e = envelope({ id: `synthetic-resource-city-${commands.length}`, expectedRevision: city.revision,
          command: a.kind === 'Tick' ? { type: 'AdvanceSharedCityTurn' } : a.command });
        const transitioned = transitionValidatedRoot(city, e, extension(),researchExtension());
        if (transitioned.duplicate) stop('duplicate-accepted-entry');
        city = transitioned.state;
        detail = transitioned.receipt;
        if (a.kind === 'Tick') {
          let forgeReceipt:unknown=null,foodReceipt:unknown=null,incomeReceipt:unknown=null,techniqueReceipt:unknown=null;
          if(forge?.job?.completedTurn===null){const advanced=advanceSyntheticForge(forgeContext(),forge.job);if(!advanced.ok)return advanced;commitForge(advanced);forgeReceipt=advanced.receipt;}
          if(research?.job?.source.status==='active'){const studied=advanceSyntheticTechnique(techniqueContext(),research.job);if(!studied.ok)return studied;commitTechnique(studied);techniqueReceipt=studied.receipt;}
          if(income){const earned=planSyntheticIncomeLeaves(incomeContext(),income.parameters);if(!earned.ok)return earned;
            if(earned.cityPatch.goldBefore!==city.current.ledger.gold||earned.cityPatch.foodBefore!==city.current.ledger.food)stop('invariant-mismatch');
            city.current.ledger.gold=earned.cityPatch.goldAfter;city.current.ledger.food=earned.cityPatch.foodAfter;incomeReceipt=earned.receipt;}
          const settled = applySyntheticResourceBridge(metadata, context(), { kind: 'WorldTick' });
          if (!settled.ok) return settled;
          city.current.ledger.gold = settled.ledgerPatch.gold;
          city.current.ledger.actionPoints = settled.ledgerPatch.actionPoints;
          metadata = settled.metadata;
          if(foodEnabled){const consumed=planSyntheticNeutralFoodTick(foodContext(),raw.foodConfig);if(!consumed.ok)return consumed;
            for(const patch of consumed.foodPatches){if(patch.id===g.city.id){if(city.current.ledger.food!==patch.foodBefore)stop('invariant-mismatch');city.current.ledger.food=patch.foodAfter;}
              else {const cargo=transports.find(t=>t.id===patch.id);if(!cargo||cargo.stock.food!==patch.foodBefore)stop('invariant-mismatch');transports=transports.map(t=>t.id===patch.id?{...t,stock:{...t.stock,food:patch.foodAfter}}:t);}}
            foodReceipt=consumed.receipt;}
          const advancedField = executeInferredMobileField(field.state, { id: `synthetic-dynamic-${commands.length}`, expectedRevision: field.revision, action: { kind: 'FieldTick', draws: a.draws } });
          if (!advancedField.ok) return advancedField;
          field = advancedField;
          detail = { city: transitioned.receipt, monthlyAndNatural: settled.receipt,...(forgeEnabled?{forge:forgeReceipt}:{}),...(foodEnabled?{food:foodReceipt}:{}),...(incomeEnabled?{income:incomeReceipt}:{}),...(researchEnabled?{technique:techniqueReceipt}:{}) };
        }
      } else if(a.kind==='StartTechnique'){
        if(!research||!progress)stop('invalid-data');object(a,['kind','techniqueId','officerIds']);
        const started=planSyntheticTechniqueStart(techniqueContext(),{jobId:`job:synthetic-technique-${commands.length}`,techniqueId:a.techniqueId,officerIds:a.officerIds});
        if(!started.ok)return started;
        if(started.job.source.startSnapshot.catalogRow.relatedAbility==='war'){
          const reward=-started.job.source.fees.techniquePoints.actualDelta/(started.job.source.startSnapshot.policies.experience.parameters.divisor as number);
          for(const id of started.job.source.officerIds){const row=progress.officers.find(o=>o.id===id)!;if(row.warXp+reward>TRAINING_RULESET.progressionConfig.experienceCap)stop('research-war-xp-domain');}
        }
        commitTechnique(started);detail=started.receipt;
      } else if (a.kind === 'Grant'  || a.kind === 'Confiscate') {
        const recipientId = a.kind === 'Grant' ? a.officerId : metadata.items.find(item => item.id === a.itemId)?.holder;
        const facts = g.officers.find(o => o.id === recipientId), actor = city.current.ledger.officers.find(o => o.id === recipientId);
        if (deployed(recipientId) || !facts || !facts.available || !actor || actor.reservationJobId !== null || actor.actedTurn === city.current.clock.turn) stop('officer-unavailable');
        const changed = applySyntheticResourceBridge(metadata, context(), a);
        if (!changed.ok) return changed;
        city.current.ledger.gold = changed.ledgerPatch.gold;
        city.current.ledger.actionPoints = changed.ledgerPatch.actionPoints;
        metadata = changed.metadata; detail = changed.receipt;
      } else if (a.kind === 'Deploy' || a.kind === 'Return') {
        object(a, a.kind === 'Deploy' ? ['kind','actorId','troops'] : ['kind','actorId']);
        const actorId = id(a.actorId), officer = city.current.ledger.officers.find(o => o.id === actorId), facts = g.officers.find(o => o.id === actorId);
        const role = field.roster.find(o => o.id === actorId), template = field.state.templates.find(o => o.id === actorId);
        if (!officer || !facts || !facts.available || !role || !template || officer.reservationJobId !== null || officer.actedTurn === city.current.clock.turn) stop('officer-unavailable');
        const beforeTroops = city.current.ledger.troops, beforeMorale = city.current.ledger.morale;
        const apBefore = city.current.ledger.actionPoints;
        let apCost = 0, apPlan: unknown = null;
        let quantity: number, nextTroops: number, nextMorale = beforeMorale;
        if (a.kind === 'Deploy') {
          const planned = projectInferredCommandAP('deploy', false);
          if (!planned.ok) return planned;
          if (apBefore < planned.requestedAP) stop('insufficient-action-points');
          apCost = planned.requestedAP; apPlan = planned;
          quantity = integer(a.troops, 60000, 1);
          if (role.role !== 'resident' || beforeTroops <= quantity || beforeMorale > 100
            || field.fires.some(f => f.cellId === template.entryCellId)
            || field.roster.some(o => o.role === 'deployed' && o.cellId === template.entryCellId)) stop('invalid-data');
          nextTroops = beforeTroops - quantity;
        } else {
          if (role.role !== 'deployed' || role.acted || role.confusedTurns !== 0 || role.cellId !== template.entryCellId) stop('officer-unavailable');
          quantity = role.troops; nextTroops = beforeTroops + quantity;
          if (!Number.isSafeInteger(nextTroops) || nextTroops > g.city.troopCapacity) stop('invalid-data');
          nextMorale = Number((BigInt(beforeTroops) * BigInt(beforeMorale) + BigInt(quantity) * BigInt(role.energy)) / BigInt(nextTroops));
        }
        const changedField = executeInferredMobileField(field.state, { id: `synthetic-dynamic-${commands.length}`, expectedRevision: field.revision,
          action: a.kind === 'Deploy' ? {kind:'Deploy',actorId,troops:quantity,energy:beforeMorale} : {kind:'Return',actorId} });
        if (!changedField.ok) return changedField;
        field = changedField; city.current.ledger.actionPoints = apBefore - apCost; city.current.ledger.troops = nextTroops; city.current.ledger.morale = nextMorale; officer.actedTurn = city.current.clock.turn;
        detail = {kind:a.kind,actorId,quantity,apBefore,apAfter:city.current.ledger.actionPoints,apCost,apPlan,officePolicy:'no-military-office-profile-v2',cityTroopsBefore:beforeTroops,cityTroopsAfter:nextTroops,cityMoraleBefore:beforeMorale,cityMoraleAfter:nextMorale,field:field.receipts[field.receipts.length-1],policy:'inferred-fixed-entry-weighted-floor-deployment-v2'};
      } else if(a.kind==='StartForge'){
        object(a,['kind','officerIds']);if(!forge||!progress||forge.job!==null)stop('unsupported-command');
        const planned=planSyntheticForgeStart(forgeContext(),{jobId:`job:synthetic-forge-${commands.length}`,officerIds:a.officerIds});
        if(!planned.ok)return planned;commitForge(planned);
        city.current.ledger.facilities.find(f=>f.id===forge!.facilityId)!.usedTurn=city.current.clock.turn;
        detail=planned.receipt;
      } else if (a.kind === 'Train') {
        object(a,['kind','officerIds']);
        if(!progress)stop('unsupported-command');
        const rulerId=metadata.personnelFacts.ruler.id;
        const gameState={schemaVersion:2 as const,scope:'synthetic-training-sandbox' as const,originProfile:'native-v2' as const,
          ruleset:clone(TRAINING_RULESET),date:clone(city.current.clock.date),turn:city.current.clock.turn,revision:commands.length,
          force:{id:g.activeForceId,rulerId,adviserId:null,techniqueIds:research?.completedTechniqueIds.includes(16)?[16]:[],techniquePoints:progress.techniquePoints},
          corps:{id:g.corps.id,forceId:g.activeForceId,isFirst:true as const,actionPoints:city.current.ledger.actionPoints},
          bases:[{id:g.city.id,name:g.city.id,kind:'city' as const,ownerForceId:g.activeForceId,corpsId:g.corps.id,parentCityId:null,
            troops:city.current.ledger.troops,morale:city.current.ledger.morale,gold:city.current.ledger.gold,
            trainingCompleted:progress.trainingUsedTurn===city.current.clock.turn,
            facilities:{drillGround:progress.drillGround,militaryOffice:'none' as const,completedTalismanPlatforms:0}}],
          officers:g.officers.map(o=>{const row=progress!.officers.find(p=>p.id===o.id)!, current=city.current.ledger.officers.find(p=>p.id===o.id)!;
            return {id:o.id,name:o.id,forceId:g.activeForceId,baseId:g.city.id,warBase:row.warBase,warXp:row.warXp,
              war:trainingDerivedWar(row.warBase,row.warXp,TRAINING_RULESET.progressionConfig),leadership:o.leadership,charisma:o.charm,intelligence:o.intelligence,
              merit:current.merit,acted:current.actedTurn===city.current.clock.turn,identity:o.id===rulerId?0:3,
              location:deployed(o.id)?'unit':'base',onMission:!o.available||current.reservationJobId!==null};}),
          rng:{algorithm:TRAINING_ADAPTERS.random.id,seed:1,draws:0}};
        const bindings={cityId:g.city.id,forceId:g.activeForceId,turn:city.current.clock.turn,trainingUsedTurn:progress.trainingUsedTurn,
          officers:city.current.ledger.officers.map(o=>({id:o.id,role:deployed(o.id)?'deployed':'resident',reservationJobId:o.reservationJobId,actedTurn:o.actedTurn}))};
        const trained=planSyntheticTrainingBridge(gameState,bindings,a);
        if(!trained.ok)return trained;
        city.current.ledger.morale=trained.patch.morale;city.current.ledger.actionPoints=trained.patch.actionPoints;
        progress.techniquePoints=trained.patch.techniquePoints;progress.trainingUsedTurn=trained.patch.trainingUsedTurn;
        for(const patch of trained.patch.officers){const row=progress.officers.find(o=>o.id===patch.id)!,actor=city.current.ledger.officers.find(o=>o.id===patch.id)!;
          row.warXp=patch.warXp;if(trainingDerivedWar(row.warBase,row.warXp,TRAINING_RULESET.progressionConfig)!==patch.war)stop('invariant-mismatch');
          actor.merit=patch.merit;actor.actedTurn=patch.actedTurn;}
        detail=trained.receipt;
      } else if (a.kind === 'Move') {
        object(a,['kind','actorId','path']);
        const movedField = executeInferredMobileField(field.state,{id:`synthetic-mobile-${commands.length}`,expectedRevision:field.revision,action:a});
        if (!movedField.ok) return movedField;
        field = movedField; detail = field.receipts[field.receipts.length-1];
      } else if (a.kind === 'Field') {
        object(a,['kind','command']);
        if (a.command === null || typeof a.command !== 'object' || Array.isArray(a.command)) stop('invalid-data');
        const command = a.command as Record<string,unknown>;
        if (command.kind !== 'Cast' && command.kind !== 'FireCast') stop('unsupported-command');
        const changedField = executeInferredMobileField(field.state,{id:`synthetic-dynamic-${commands.length}`,expectedRevision:field.revision,action:command});
        if (!changedField.ok) return changedField;
        field = changedField; detail = field.receipts[field.receipts.length-1];
      } else if (a.kind === 'Transfer') {
        const moved = planSyntheticCityTransferBridge(transferContext(), transports, a);
        if (!moved.ok) return moved;
        const p = moved.cityPatch;
        city.current.ledger.gold = p.gold; city.current.ledger.food = p.food;
        city.current.ledger.troops = p.troops; city.current.ledger.morale = p.morale;
        for (const e of [1, 2, 3, 4, 5] as const) city.current.ledger.inventory[e].quantity = p.inventory[e].quantity;
        transports = moved.transports; detail = moved.receipt;
      } else stop('unsupported-command');
      currentInvariant(g, city.current, extension(),researchExtension());
      if(incomeEnabled&&city.current.ledger.troops>150000)stop('invalid-data');
      if (city.current.clock.turn !== field.turn) stop('invariant-mismatch');
      if (64-city.revision<remainingCompletion())stop('completion-history-slots');
      if (32 - field.revision < remainingCompletion()) stop('completion-history-slots');
      // Existing private history and jobs are retained intact; outer history proves bridge writes.
      if (32 - commands.length - 1 < remainingCompletion()) stop('completion-history-slots');
      commands.push({ id: commandId, expectedRevision: commands.length, action: clone(a) }); ids.add(commandId);
      receipts.push({ commandId, clock: clone(city.current.clock), detail }); fit();
    }
    // No legacy State/tag is exposed: it is not a default save with a patched balance.
    const result = { ok: true as const, state: root(), genesis: g, current: city.current, metadata, transports, field,
      receipts, revision: commands.length, ...(enabled ? {progress,effectiveAttributes:effective()} : {}),...(forgeEnabled?{forge,completionTicksRequired:remainingCompletion(),effectiveFacilities:effectiveSyntheticScenario(g,extension()).facilities}:{}),...(incomeEnabled?{incomeFacilities:incomeFacilities()}:{}),...(researchEnabled?{research,completionTicksRequired:remainingCompletion(),maxAdvances:horizon}:{}), scope: 'synthetic-mobile-resource-owner-timeline-v3' as const };
    budget(result); return freeze(result);
  } catch (error) { return freeze(caught(error)); }
}
export function createBoundedSyntheticMobileTimeline(cityScenario: unknown, resourceConfig: unknown, transportInitial: unknown, fieldCells: unknown, fieldTemplates: unknown, movementMap: unknown, movementProfiles: unknown, progressConfig?: unknown,forgeConfig?:unknown,foodConfig?:unknown,incomeConfig?:unknown,researchConfig?:unknown) {
  return readBoundedSyntheticMobileTimeline({ schema: 'bounded-synthetic-mobile-timeline-v3', cityScenario, resourceConfig, transportInitial, fieldCells, fieldTemplates, movementMap, movementProfiles, ...(progressConfig === undefined ? {} : {progressConfig}),...(forgeConfig===undefined?{}:{forgeConfig}),...(foodConfig===undefined?{}:{foodConfig}),...(incomeConfig===undefined?{}:{incomeConfig}),...(researchConfig===undefined?{}:{researchConfig}), commands: [] });
}
export function executeBoundedSyntheticMobileTimeline(input: unknown, command: unknown) {
  const current = readBoundedSyntheticMobileTimeline(input);
  if (!current.ok) return current;
  try {
    const c = object(detach(command), ['id', 'expectedRevision', 'action']);
    if (c.expectedRevision !== current.revision || current.revision >= 32) stop('stale-revision');
    return readBoundedSyntheticMobileTimeline({ ...current.state, commands: [...current.state.commands, c] });
  } catch (error) { return freeze(caught(error)); }
}
