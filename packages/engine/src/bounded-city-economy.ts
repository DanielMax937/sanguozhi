/** Fixed-xun, single-city domestic/merchant composition. No world scheduler or native ownership. */
import policyData from '../../../data/policies/bounded-city-economy-v1.json' with { type: 'json' };
import merchantCatalogData from '../../../data/catalogs/city-merchant-politics-v1.json' with { type: 'json' };
import { reduceDomesticInstant } from './internal/city-instant-reducer.ts';
import { reduceMerchantTrade } from './internal/city-merchant-trade-reducer.ts';
import { boundedCityJsonFits, canonicalBoundedCityJson, decodeBoundedCityJson, detachBoundedCityData } from './internal/bounded-city-json.ts';
import type { DomesticInstantFrame, DomesticInstantAudit, DomesticPolicies, Stat, QuantityEquipment, DeepRO } from './internal/city-service-types.ts';
import type { MerchantTradeFrame, MerchantTradeAudit, MerchantCommonPolicies, Catalog } from './internal/city-merchant-types.ts';
import type { PatrolSecurityGainInput, PatrolSecurityGainReceipt } from './patrol-security-gain.ts';
import type { RecruitmentQuantityFactorBits, RecruitmentQuantityReceipt } from './recruitment-quantity.ts';
import type { RecruitmentSecurityArgumentInput, RecruitmentSecurityArgumentReceipt } from './recruitment-security-argument.ts';
import type { ProductionPriceInput, ProductionPriceReceipt } from './production-price.ts';
import type { ProductionQuantityFactorBits, ProductionQuantityReceipt } from './production-quantity.ts';

type Equipment = QuantityEquipment;
type Marker = number | null;
type DateV1 = { year: number; month: number; day: 1 | 11 | 21 };
type Position = { q: number; r: number };
type Progress = { xp: Record<Stat, number>; merit: number; actedTurn: Marker };
type OfficerFacts = { id: string; forceId: string; cityId: string; available: boolean; leadership: number; charm: number; intelligence: number; politics: number; skillIds: (79 | 80 | 81)[]; initial: Progress };
type FacilityFacts = { id: string; cityId: string; kind: 'barracks' | 'forge' | 'stable'; level: 1 | 2 | 3; complete: boolean; initialUsedTurn: Marker };
type Ledger = { gold: number; food: number; actionPoints: number; security: number; troops: number; morale: number; patrolUsedTurn: Marker; merchantUsedTurn: Marker; inventory: Record<Equipment, number>; officers: ({ id: string } & Progress)[]; facilities: { id: string; usedTurn: Marker }[] };
type Policy = {
  id: 'bounded-city-domestic-merchant-v1'; version: 1;
  clock: 'fixed-genesis-xun-v1'; ownership: 'fixed-supplied-city-corps-force-v1';
  ordering: 'caller-action-order-no-reordering-v1'; transaction: 'all-or-nothing-batch-v1';
  legalOrdering: 'genesis-facility-and-request-order-v1'; legalPaging: 'stateless-contiguous-prefix-full-state-bound-v1';
  rewardScope: 'shared-xp-merit-partial-no-tp-v1'; pressureBinding: 'independent-supplied-domestic-helper-v1';
  domestic: DomesticPolicies; merchant: MerchantCommonPolicies;
  budgets: { acceptedCommands: 128; actionsPerCommand: 8; traceAttempts: 512; legalCandidates: 128; legalPageSize: 4; maxUtf8Bytes: 8388608; maxNodes: 250000; maxDepth: 48; maxArray: 4096; maxObjectKeys: 128 };
};
type Scenario = {
  schemaVersion: 1; profile: 'bounded-city-domestic-merchant-v1'; episodeId: string;
  clock: { date: DateV1; turn: number }; activeForceId: string;
  corps: { id: string; forceId: string; initialActionPoints: number };
  city: { id: string; kind: 'city'; ownerForceId: string; position: Position; goldCapacity: 1000000000; foodCapacity: number; troopCapacity: number; moraleCap: number;
    initial: { gold: number; food: number; security: number; troops: number; morale: number; patrolUsedTurn: Marker; merchantUsedTurn: Marker };
    inventory: Record<Equipment, { quantity: number; capacity: number }> };
  officers: OfficerFacts[]; facilities: FacilityFacts[];
  domestic: { pressureActive: boolean; difficulty: 'normal' | 'super'; controller: 'player' | 'ai'; unlockedEquipmentTypes: Equipment[]; specialtyEquipmentTypes: Equipment[] };
  merchant: { present: boolean; uiTradePrice: 3 | 4 | 5 | 6 | 7; hostileForceIds: string[]; completeFieldUnits: true; fieldUnits: { id: string; forceId: string; position: Position }[] };
  productionCatalog: { id: string; version: 1; entries: Record<Equipment, { basePriceWord: number }> };
  merchantCatalog: Catalog; policy: Policy;
};
type DomesticAction = { type: 'Patrol'; cityId: string; officerIds: string[] }
  | { type: 'Recruit'; cityId: string; officerIds: string[]; facilityId: string }
  | { type: 'Produce'; cityId: string; officerIds: string[]; facilityId: string; equipmentType: Equipment };
type TradeAction = { type: 'BuyFood' | 'SellFood'; cityId: string; officerId: string; foodAmount: number };
type Action = DomesticAction | TradeAction;
type Envelope = { id: string; expectedRevision: number; command: { type: 'ExecuteCityActions'; actions: Action[] } };
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
type QuantityKernelInput = { profile: 'production-quantity-resolved-f32-v1'; nativeEquipmentType: Equipment; slots: [QuantitySlot, QuantitySlot, QuantitySlot]; resolvedFacilityFactorBits: ProductionQuantityFactorBits } & ({ difficultyWord: 0 } | { difficultyWord: 2; cityVirtualEax: 0 | 1 });
type QuantityKernelOutput = Omit<NoEvidence<ProductionQuantityReceipt>, 'nativeEquipmentType' | 'skillQueryId' | 'difficultyWord' | 'cityVirtualEax'> & { nativeEquipmentType: Equipment; skillQueryId: 80 | 81; difficultyWord: 0 | 2; cityVirtualEax: 0 | 1 | null };
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
  | { target: 'equipment'; equipmentType: Equipment; before: number; after: number }
  | { target: 'officer'; officerId: string; field: Stat | 'merit'; before: number; after: number }
  | { target: 'officer'; officerId: string; field: 'actedTurn'; before: Marker; after: Marker }
  | { target: 'facility'; facilityId: string; field: 'usedTurn'; before: Marker; after: Marker };
type StepReceipt = { index: number; action: Action; ledgerDigestBefore: string; ledgerDigestAfter: string; changes: Change[]; audit: { kind: 'domestic'; detail: DomesticAudit } | { kind: 'merchant'; detail: MerchantAudit } };
type Receipt = { envelope: Envelope; revisionBefore: number; revisionAfter: number; policyDigest: string; catalogDigests: { production: string; merchant: string }; clock: Scenario['clock']; steps: StepReceipt[]; ledgerDigestBefore: string; ledgerDigestAfter: string; scope: 'bounded-shared-city-episode'; rngDraws: 0; techniquePoints: 'not-modeled'; nativeIntegration: false };
type State = { tag: 'san11-bounded-city-economy-state-v1'; schemaVersion: 1; profile: 'bounded-city-domestic-merchant-v1'; genesis: Scenario; revision: number; ledger: Ledger; acceptedCommands: { envelope: Envelope; receipt: Receipt }[] };
type ReasonCode =
  | 'invalid-data' | 'invalid-json' | 'duplicate-json-key' | 'invalid-fields' | 'invalid-number' | 'invalid-id' | 'invalid-date' | 'invalid-array' | 'invalid-prototype' | 'duplicate-entity-id'
  | 'unsupported-schema' | 'unsupported-profile' | 'unsupported-policy' | 'unsupported-catalog' | 'unsupported-command' | 'unsupported-city-kind' | 'unsupported-equipment' | 'unsupported-skill'
  | 'unsupported-politics' | 'unsupported-external-state' | 'owner-corps-mismatch' | 'officer-city-force-mismatch' | 'facility-not-present' | 'incomplete-field-unit-snapshot' | 'owner-marked-hostile'
  | 'invalid-marker' | 'invalid-officer-count' | 'invalid-action-count' | 'command-id-conflict' | 'stale-revision' | 'history-limit' | 'candidate-id-collision'
  | 'invalid-page-size' | 'invalid-cursor' | 'unsupported-cursor-version' | 'cursor-state-mismatch' | 'cursor-request-mismatch'
  | 'unknown-city' | 'unknown-officer' | 'unknown-facility' | 'officer-unavailable' | 'officer-already-acted' | 'patrol-already-used' | 'facility-incomplete' | 'wrong-facility-kind' | 'facility-used-this-turn' | 'equipment-locked'
  | 'insufficient-gold' | 'insufficient-action-points' | 'insufficient-food' | 'merchant-absent' | 'city-merchant-already-used' | 'hostile-within-two' | 'zero-value-sale' | 'gold-amount-out-of-range' | 'gold-capacity-exceeded' | 'food-capacity-exceeded' | 'kernel-rejected' | 'writer-cap-overflow' | 'zero-yield'
  | 'state-recomputation-mismatch' | 'history-recomputation-mismatch' | 'receipt-recomputation-mismatch' | 'duplicate-accepted-entry' | 'unexpected-reducer-effect' | 'invariant-mismatch' | 'budget-exceeded' | 'trace-outcome-mismatch' | 'trace-final-mismatch';
type Stage = 'input' | 'rebuild' | 'deduplication' | 'revision' | 'domain' | 'domestic' | 'merchant' | 'invariant' | 'budget' | 'comparison';
type Failure = { ok: false; committed: false; stage: Stage; reason: ReasonCode; actionIndex: number | null; blockingUnitId: string | null };
type ExecuteResult = Failure | { ok: true; committed: boolean; duplicate: boolean; state: State; receipt: Receipt };
type PreviewResult = Failure | { ok: true; committed: false; duplicate: boolean; baseRevision: number; projectedLedger: Ledger; receipt: Receipt };
type CreateOrLoadResult = Failure | { ok: true; state: State };
type InspectResult = Failure | { ok: true; revision: number; clock: Scenario['clock']; ledger: Ledger; remainingHistorySlots: number; scope: 'bounded-shared-city-episode' };
type SaveResult = Failure | { ok: true; serialized: string };
type LegalCursor = { version: 1; orderVersion: 'genesis-facility-and-request-order-v1'; stateDigest: string; requestDigest: string; revision: number; nextIndex: number };
type LegalRequest = { requestId: string; expectedRevision: number; domesticOfficerIds: string[] | null; merchantRequests: { officerId: string; foodAmount: number }[]; cursor: LegalCursor | null; pageSize: 1 | 2 | 3 | 4 };
type LegalSuccess = { ok: true; baseRevision: number; stateDigest: string; requestDigest: string; totalCandidates: number; startIndex: number; endIndexExclusive: number; nextCursor: LegalCursor | null; completePage: true; enumerationComplete: boolean; globalCompleteness: false; candidates: { globalOrdinal: number; envelope: Envelope; result: PreviewResult }[]; notEnumerated: ['other-officer-selections', 'other-food-amounts', 'multi-action-batches'] };
type LegalResult = Failure | LegalSuccess;
type ReplayOutcome = { ok: true; duplicate: boolean; receipt: Receipt } | Failure;
type Trace = { tag: 'san11-bounded-city-economy-trace-v1'; scenario: Scenario; attempts: { envelope: Envelope; expected: ReplayOutcome | null }[]; expectedFinalState: State | null };
type ReplayResult = { ok: true; state: State; outcomes: ReplayOutcome[] } | (Failure & { index: number | null; state: null });

export type BoundedCityEconomyScenarioV1 = DeepRO<Scenario>;
export type BoundedCityEconomyStateV1 = DeepRO<State>;
export type BoundedCityEconomyPolicyV1 = DeepRO<Policy>;
export type BoundedCityEconomyLedgerV1 = DeepRO<Ledger>;
export type BoundedCityEconomyActionV1 = DeepRO<Action>;
export type BoundedCityEconomyEnvelopeV1 = DeepRO<Envelope>;
export type BoundedCityEconomyReceiptV1 = DeepRO<Receipt>;
export type BoundedCityEconomyStepReceiptV1 = DeepRO<StepReceipt>;
export type BoundedCityEconomyKernelAuditV1 = DeepRO<KernelAudit>;
export type BoundedCityEconomyFailureV1 = DeepRO<Failure>;
export type BoundedCityEconomyExecuteResultV1 = DeepRO<ExecuteResult>;
export type BoundedCityEconomyPreviewResultV1 = DeepRO<PreviewResult>;
export type BoundedCityEconomyCreateOrLoadResultV1 = DeepRO<CreateOrLoadResult>;
export type BoundedCityEconomyInspectResultV1 = DeepRO<InspectResult>;
export type BoundedCityEconomySaveResultV1 = DeepRO<SaveResult>;
export type BoundedCityEconomyLegalRequestV1 = DeepRO<LegalRequest>;
export type BoundedCityEconomyLegalCursorV1 = DeepRO<LegalCursor>;
export type BoundedCityEconomyLegalResultV1 = DeepRO<LegalResult>;
export type BoundedCityEconomyTraceV1 = DeepRO<Trace>;
export type BoundedCityEconomyReplayOutcomeV1 = DeepRO<ReplayOutcome>;
export type BoundedCityEconomyReplayResultV1 = DeepRO<ReplayResult>;

const PROFILE = 'bounded-city-domestic-merchant-v1' as const;
const STATE_TAG = 'san11-bounded-city-economy-state-v1' as const;
const SAVE_TAG = 'san11-bounded-city-economy-save-v1' as const;
const TRACE_TAG = 'san11-bounded-city-economy-trace-v1' as const;
const ORDER = 'genesis-facility-and-request-order-v1' as const;
const EQUIPMENT: Equipment[] = [1, 2, 3, 4];
const STATS: Stat[] = ['leadership', 'charm', 'intelligence', 'politics', 'war'];
const MAX = 1_000_000_000;
const errors = new WeakMap<object, Failure>();
function failure(reason: ReasonCode, stage: Stage = 'input', actionIndex: number | null = null, blockingUnitId: string | null = null): Failure {
  return { ok: false, committed: false, stage, reason, actionIndex, blockingUnitId: reason === 'hostile-within-two' ? blockingUnitId : null };
}
function stop(reason: ReasonCode, stage: Stage = 'input', actionIndex: number | null = null, blockingUnitId: string | null = null): never {
  const signal = {}; errors.set(signal, failure(reason, stage, actionIndex, blockingUnitId)); throw signal;
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
  const p = object(value, hasId ? ['id', 'xp', 'merit', 'actedTurn'] : ['xp', 'merit', 'actedTurn']); if (hasId) id(p.id);
  const xp = object(p.xp, STATS); for (const stat of STATS) integer(xp[stat], MAX); integer(p.merit, MAX); marker(p.actedTurn, turn);
}
/** Private copies; neither imported JSON nor any caller object is frozen by this module. */
export const BOUNDED_CITY_ECONOMY_POLICY: BoundedCityEconomyPolicyV1 = freeze(clone(policyData) as unknown as Policy);
const MERCHANT_CATALOG = freeze(clone(merchantCatalogData));
function scenario(value: unknown): Scenario {
  const s = object(value, ['schemaVersion', 'profile', 'episodeId', 'clock', 'activeForceId', 'corps', 'city', 'officers', 'facilities', 'domestic', 'merchant', 'productionCatalog', 'merchantCatalog', 'policy'], 'unsupported-external-state');
  literal(s.schemaVersion, 1, 'unsupported-schema'); literal(s.profile, PROFILE, 'unsupported-profile'); id(s.episodeId); const force = id(s.activeForceId);
  const clock = object(s.clock, ['date', 'turn']), date = object(clock.date, ['year', 'month', 'day'], 'invalid-date');
  integer(date.year, 9999, 1, 'invalid-date'); integer(date.month, 12, 1, 'invalid-date'); choice(date.day, [1, 11, 21], 'invalid-date'); const turn = integer(clock.turn);
  const corps = object(s.corps, ['id', 'forceId', 'initialActionPoints']); id(corps.id); id(corps.forceId); integer(corps.initialActionPoints, 255);
  const city = object(s.city, ['id', 'kind', 'ownerForceId', 'position', 'goldCapacity', 'foodCapacity', 'troopCapacity', 'moraleCap', 'initial', 'inventory']);
  const cityId = id(city.id); literal(city.kind, 'city', 'unsupported-city-kind'); id(city.ownerForceId); position(city.position); literal(city.goldCapacity, MAX);
  integer(city.foodCapacity, MAX); integer(city.troopCapacity, 1_000_000); integer(city.moraleCap, 255, 20);
  if (city.ownerForceId !== force || corps.forceId !== force) stop('owner-corps-mismatch');
  const initial = object(city.initial, ['gold', 'food', 'security', 'troops', 'morale', 'patrolUsedTurn', 'merchantUsedTurn']);
  integer(initial.gold, MAX); integer(initial.food, city.foodCapacity as number); integer(initial.security, 100); integer(initial.troops, city.troopCapacity as number); integer(initial.morale, city.moraleCap as number);
  marker(initial.patrolUsedTurn, turn); marker(initial.merchantUsedTurn, turn);
  const inventory = object(city.inventory, ['1', '2', '3', '4']);
  for (const equipment of EQUIPMENT) { const stock = object(inventory[equipment], ['quantity', 'capacity']); integer(stock.capacity, 1_000_000); integer(stock.quantity, stock.capacity as number); }
  const officers = array(s.officers, 256, 1, 'invalid-officer-count');
  const officerIds = officers.map(value => {
    const o = object(value, ['id', 'forceId', 'cityId', 'available', 'leadership', 'charm', 'intelligence', 'politics', 'skillIds', 'initial']);
    const oid = id(o.id); id(o.forceId); id(o.cityId); if (o.forceId !== force || o.cityId !== cityId) stop('officer-city-force-mismatch'); boolean(o.available);
    for (const attr of ['leadership', 'charm', 'intelligence']) integer(o[attr], 255); integer(o.politics, 100, 20, 'unsupported-politics');
    const skills = array(o.skillIds, 3); for (const skill of skills) choice(skill, [79, 80, 81], 'unsupported-skill'); unique(skills); progress(o.initial, turn, false); return oid;
  }); unique(officerIds);
  const facilities = array(s.facilities, 30).map(value => {
    const f = object(value, ['id', 'cityId', 'kind', 'level', 'complete', 'initialUsedTurn']); const fid = id(f.id); id(f.cityId); if (f.cityId !== cityId) stop('facility-not-present');
    choice(f.kind, ['barracks', 'forge', 'stable'], 'invalid-data'); choice(f.level, [1, 2, 3]); boolean(f.complete); marker(f.initialUsedTurn, turn); return fid;
  }); unique(facilities);
  const domestic = object(s.domestic, ['pressureActive', 'difficulty', 'controller', 'unlockedEquipmentTypes', 'specialtyEquipmentTypes']); boolean(domestic.pressureActive); choice(domestic.difficulty, ['normal', 'super']); choice(domestic.controller, ['player', 'ai']);
  for (const key of ['unlockedEquipmentTypes', 'specialtyEquipmentTypes']) { const types = array(domestic[key], 4); for (const t of types) choice(t, EQUIPMENT, 'unsupported-equipment'); unique(types); }
  const merchant = object(s.merchant, ['present', 'uiTradePrice', 'hostileForceIds', 'completeFieldUnits', 'fieldUnits']); boolean(merchant.present); choice(merchant.uiTradePrice, [3, 4, 5, 6, 7]);
  literal(merchant.completeFieldUnits, true, 'incomplete-field-unit-snapshot'); const hostile = array(merchant.hostileForceIds, 256).map(v => id(v)); unique(hostile); if (hostile.includes(force)) stop('owner-marked-hostile');
  unique(array(merchant.fieldUnits, 4096).map(value => { const u = object(value, ['id', 'forceId', 'position']); id(u.forceId); position(u.position); return id(u.id); }));
  const catalog = object(s.productionCatalog, ['id', 'version', 'entries'], 'unsupported-catalog'); id(catalog.id); literal(catalog.version, 1, 'unsupported-catalog'); const entries = object(catalog.entries, ['1', '2', '3', '4'], 'unsupported-catalog');
  for (const equipment of EQUIPMENT) integer(object(entries[equipment], ['basePriceWord'], 'unsupported-catalog').basePriceWord, 65535);
  if (!same(s.merchantCatalog, MERCHANT_CATALOG)) stop('unsupported-catalog'); if (!same(s.policy, BOUNDED_CITY_ECONOMY_POLICY)) stop('unsupported-policy');
  return s as unknown as Scenario;
}
function initialState(genesis: Scenario): State {
  const c = genesis.city, initial = c.initial;
  const ledger: Ledger = { ...clone(initial), actionPoints: genesis.corps.initialActionPoints,
    inventory: { 1: c.inventory[1].quantity, 2: c.inventory[2].quantity, 3: c.inventory[3].quantity, 4: c.inventory[4].quantity },
    officers: genesis.officers.map(o => ({ id: o.id, ...clone(o.initial) })), facilities: genesis.facilities.map(f => ({ id: f.id, usedTurn: f.initialUsedTurn })) };
  return { tag: STATE_TAG, schemaVersion: 1, profile: PROFILE, genesis, revision: 0, ledger, acceptedCommands: [] };
}
function ledgerInvariant(s: Scenario, value: unknown): asserts value is Ledger {
  const l = object(value, ['gold', 'food', 'actionPoints', 'security', 'troops', 'morale', 'patrolUsedTurn', 'merchantUsedTurn', 'inventory', 'officers', 'facilities']);
  integer(l.gold, MAX); integer(l.food, s.city.foodCapacity); integer(l.actionPoints, 255); integer(l.security, 100); integer(l.troops, s.city.troopCapacity); integer(l.morale, s.city.moraleCap); marker(l.patrolUsedTurn, s.clock.turn); marker(l.merchantUsedTurn, s.clock.turn);
  const inventory = object(l.inventory, ['1', '2', '3', '4']); for (const t of EQUIPMENT) integer(inventory[t], s.city.inventory[t].capacity);
  const people = array(l.officers, s.officers.length, s.officers.length), facilities = array(l.facilities, s.facilities.length, s.facilities.length);
  people.forEach((o, i) => { progress(o, s.clock.turn, true); if ((o as { id: string }).id !== s.officers[i]!.id) stop('invariant-mismatch', 'invariant'); });
  facilities.forEach((value, i) => { const f = object(value, ['id', 'usedTurn']); if (f.id !== s.facilities[i]!.id) stop('invariant-mismatch', 'invariant'); marker(f.usedTurn, s.clock.turn); });
}
function envelope(value: unknown): Envelope {
  const e = object(value, ['id', 'expectedRevision', 'command']); id(e.id); integer(e.expectedRevision); const command = object(e.command, ['type', 'actions']); literal(command.type, 'ExecuteCityActions', 'unsupported-command');
  array(command.actions, 4096); return e as unknown as Envelope;
}
function validateActions(e: Envelope): void {
  if (e.command.actions.length < 1 || e.command.actions.length > 8) stop('invalid-action-count', 'domain');
  e.command.actions.forEach((value, index) => {
    try {
      if (value === null || typeof value !== 'object' || Array.isArray(value)) stop('invalid-fields');
      const type = (value as { type?: unknown }).type;
      if (type === 'BuyFood' || type === 'SellFood') { const a = object(value, ['type', 'cityId', 'officerId', 'foodAmount']); id(a.cityId); id(a.officerId); integer(a.foodAmount, MAX, 1); }
      else {
        const keys = type === 'Patrol' ? ['type', 'cityId', 'officerIds'] : type === 'Recruit' ? ['type', 'cityId', 'officerIds', 'facilityId'] : type === 'Produce' ? ['type', 'cityId', 'officerIds', 'facilityId', 'equipmentType'] : null;
        if (!keys) stop('unsupported-command'); const a = object(value, keys); id(a.cityId); const people = array(a.officerIds, 3, 1, 'invalid-officer-count').map(v => id(v)); unique(people, 'invalid-officer-count');
        if (type !== 'Patrol') id(a.facilityId); if (type === 'Produce') choice(a.equipmentType, EQUIPMENT, 'unsupported-equipment');
      }
    } catch (error) { const f = caught(error); stop(f.reason, 'domain', index); }
  });
}
function domesticFrame(s: Scenario, l: Ledger): DomesticInstantFrame {
  return { activeForceId: s.activeForceId, corps: { actionPoints: l.actionPoints },
    city: { id: s.city.id, gold: l.gold, security: l.security, troops: l.troops, troopCapacity: s.city.troopCapacity, morale: l.morale, moraleCap: s.city.moraleCap, patrolUsedTurn: l.patrolUsedTurn,
      inventory: { 1: { quantity: l.inventory[1], capacity: s.city.inventory[1].capacity, reserved: 0 }, 2: { quantity: l.inventory[2], capacity: s.city.inventory[2].capacity, reserved: 0 }, 3: { quantity: l.inventory[3], capacity: s.city.inventory[3].capacity, reserved: 0 }, 4: { quantity: l.inventory[4], capacity: s.city.inventory[4].capacity, reserved: 0 } } },
    officers: s.officers.map((o, i) => ({ id: o.id, forceId: o.forceId, cityId: o.cityId, available: o.available, leadership: o.leadership, charm: o.charm, intelligence: o.intelligence, skillIds: [...o.skillIds], xp: clone(l.officers[i]!.xp), merit: l.officers[i]!.merit, actedTurn: l.officers[i]!.actedTurn, reservationJobId: null })),
    facilities: s.facilities.map((f, i) => ({ id: f.id, cityId: f.cityId, kind: f.kind, level: f.level, complete: f.complete, usedTurn: l.facilities[i]!.usedTurn, reservationJobId: null })),
    pressureActive: s.domestic.pressureActive, difficulty: s.domestic.difficulty, controller: s.domestic.controller,
    unlockedEquipmentTypes: [...s.domestic.unlockedEquipmentTypes], specialtyEquipmentTypes: [...s.domestic.specialtyEquipmentTypes], productionPrices: clone(s.productionCatalog.entries), policies: clone(s.policy.domestic) };
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
    literal(i.profile, 'production-quantity-resolved-f32-v1'); choice(i.nativeEquipmentType, EQUIPMENT); factor(i.resolvedFacilityFactorBits); choice(i.difficultyWord, [0, 2]); if (i.difficultyWord === 2) bit(i.cityVirtualEax);
    const slots = array(i.slots, 3, 3); let present = 0; for (const slot of slots) if (slot !== null) { const s = object(slot, ['intelligenceGetterEax', 'skillHelperEax']); integer(s.intelligenceGetterEax, 255); bit(s.skillHelperEax); present++; } if (!present) stop('invalid-data');
    const o = object(k.output, ['supported', 'profile', 'nativeEquipmentType', 'reason', 'resolvedInputsObserved', 'slots', 'validSlotCount', 'intelligenceSum', 'intelligenceMax', 'skillQueryId', 'skillApplied', 'baseQuantity', 'skillAdjustedQuantity', 'resolvedFacilityFactorBits', 'convertedQuantity', 'difficultyWord', 'cityVirtualObserved', 'cityVirtualEax', 'superApplied', 'returnedQuantity']);
    literal(o.supported, true); literal(o.profile, i.profile as string); choice(o.nativeEquipmentType, EQUIPMENT); literal(o.reason, 'resolved-quantity'); literal(o.resolvedInputsObserved, true); integer(o.validSlotCount, 3, 1); integer(o.intelligenceSum, 765); integer(o.intelligenceMax, 255); choice(o.skillQueryId, [80, 81]);
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
function merchantAudit(value: unknown, s: Scenario, action: TradeAction): MerchantAudit {
  const a = object(value, ['ownerSnapshot', 'actionPoints', 'fixedGoldFee', 'meritDelta', 'techniquePointsDelta', 'loyaltyDelta', 'rngDraws', 'trade']);
  if (!same(a.ownerSnapshot, { activeForceId: s.activeForceId, ownerForceId: s.city.ownerForceId, corpsId: s.corps.id, corpsForceId: s.corps.forceId })) stop('invalid-data');
  const ap = object(a.actionPoints, ['before', 'requestedDelta', 'actualDelta', 'after', 'cap', 'policyId']); integer(ap.before, 255); integer(ap.after, 255); literal(ap.requestedDelta, -20); literal(ap.actualDelta, -20); literal(ap.cap, 255); literal(ap.policyId, s.policy.merchant.eligibility.id);
  for (const f of ['fixedGoldFee', 'meritDelta', 'techniquePointsDelta', 'loyaltyDelta', 'rngDraws']) literal(a[f], 0);
  const t = object(a.trade, ['officerId', 'direction', 'priceScale', 'uiTradePrice', 'foodRequested', 'foodTransferred', 'politicsEffect', 'sellFactor', 'exactGold', 'rounding', 'divisionRemainder', 'roundingDifference', 'settledGold', 'eligibility', 'merchantUsedTurnAfter', 'actorActedTurnAfter', 'writes', 'merchantCounterparty', 'politicsXp']);
  literal(t.officerId, action.officerId); literal(t.direction, action.type === 'BuyFood' ? 'buy' : 'sell'); literal(t.priceScale, 'ui-food-per-gold'); literal(t.uiTradePrice, s.merchant.uiTradePrice); literal(t.foodRequested, action.foodAmount); literal(t.foodTransferred, action.foodAmount);
  const effect = object(t.politicsEffect, ['politics', 'lowerPolitics', 'upperPolitics', 'lowerEffectMillionths', 'upperEffectMillionths', 'fraction', 'interpolationPolicyId']); for (const f of ['politics', 'lowerPolitics', 'upperPolitics']) integer(effect[f], 100, 20); for (const f of ['lowerEffectMillionths', 'upperEffectMillionths']) integer(effect[f], MAX); fractionAudit(effect.fraction); literal(effect.interpolationPolicyId, s.merchantCatalog.version);
  for (const f of ['sellFactor', 'exactGold', 'roundingDifference']) fractionAudit(t[f]); literal(t.rounding, action.type === 'BuyFood' ? 'ceil' : 'floor'); if (typeof t.divisionRemainder !== 'string' || !/^(0|[1-9][0-9]*)$/.test(t.divisionRemainder)) stop('invalid-data'); integer(t.settledGold, MAX, 1);
  const eligibility = object(t.eligibility, ['merchantPresent', 'cityUsedBefore', 'actorActedBefore', 'actorAvailable', 'completeSuppliedFieldUnits', 'unitChecks']); for (const f of ['merchantPresent', 'actorAvailable', 'completeSuppliedFieldUnits']) literal(eligibility[f], true); marker(eligibility.cityUsedBefore, s.clock.turn); marker(eligibility.actorActedBefore, s.clock.turn);
  array(eligibility.unitChecks, s.merchant.fieldUnits.length, s.merchant.fieldUnits.length).forEach((value, i) => { const u = object(value, ['unitId', 'forceId', 'position', 'hostile', 'distance', 'blocks']), fact = s.merchant.fieldUnits[i]!; literal(u.unitId, fact.id); literal(u.forceId, fact.forceId); if (!same(u.position, fact.position)) stop('invalid-data'); boolean(u.hostile); integer(u.distance, 4_000_000); literal(u.blocks, false); });
  literal(t.merchantUsedTurnAfter, s.clock.turn); literal(t.actorActedTurnAfter, s.clock.turn);
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
  for (const t of EQUIPMENT) if (before.inventory[t] !== after.inventory[t]) result.push({ target: 'equipment', equipmentType: t, before: before.inventory[t], after: after.inventory[t] });
  before.officers.forEach((o, index) => { const n = after.officers[index]!;
    for (const field of STATS) if (o.xp[field] !== n.xp[field]) result.push({ target: 'officer', officerId: o.id, field, before: o.xp[field], after: n.xp[field] });
    if (o.merit !== n.merit) result.push({ target: 'officer', officerId: o.id, field: 'merit', before: o.merit, after: n.merit });
    if (o.actedTurn !== n.actedTurn) result.push({ target: 'officer', officerId: o.id, field: 'actedTurn', before: o.actedTurn, after: n.actedTurn });
  });
  before.facilities.forEach((f, index) => { const n = after.facilities[index]!; if (f.usedTurn !== n.usedTurn) result.push({ target: 'facility', facilityId: f.id, field: 'usedTurn', before: f.usedTurn, after: n.usedTurn }); });
  return result;
}
function isTradeAction(action: Action): action is TradeAction { return action.type === 'BuyFood' || action.type === 'SellFood'; }
function reduceStep(s: Scenario, before: Ledger, action: Action, commandId: string, index: number): { ledger: Ledger; receipt: StepReceipt } {
  ledgerInvariant(s, before); const next = clone(before); let audit: StepReceipt['audit'];
  const context = { commandId, turn: s.clock.turn };
  if (isTradeAction(action)) {
    const frame = merchantFrame(s, before), result = reduceMerchantTrade(context, frame, action);
    if (!result.ok) stop(reducerReason(result.reason), 'merchant', index, result.blockingUnitId);
    try {
      const candidate = result.candidate; next.gold = candidate.city.gold; next.food = candidate.city.food; next.actionPoints = candidate.corps.actionPoints; next.merchantUsedTurn = candidate.city.merchantUsedTurn;
      const actor = s.officers.findIndex(o => o.id === action.officerId); if (actor < 0) stop('unexpected-reducer-effect');
      next.officers[actor]!.xp.politics = candidate.officers[actor]!.politicsXp; next.officers[actor]!.actedTurn = candidate.officers[actor]!.actedTurn;
      ledgerInvariant(s, next);
      // Reproject only the whitelist. Full equality rejects changed facts, identity,
      // unrelated actors, order, caps, or any unrecognized candidate property.
      if (!same(candidate, merchantFrame(s, next))) stop('unexpected-reducer-effect');
      audit = { kind: 'merchant', detail: merchantAudit(result.audit, s, action) };
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
        else next.inventory[action.equipmentType] = candidate.city.inventory[action.equipmentType].quantity;
      }
      for (const oid of action.officerIds) { const actor = s.officers.findIndex(o => o.id === oid); if (actor < 0) stop('unexpected-reducer-effect'); const source = candidate.officers[actor]!; next.officers[actor]!.xp[stat] = source.xp[stat]; next.officers[actor]!.merit = source.merit; next.officers[actor]!.actedTurn = source.actedTurn; }
      ledgerInvariant(s, next); if (!same(candidate, domesticFrame(s, next))) stop('unexpected-reducer-effect');
      audit = { kind: 'domestic', detail: domesticAudit(result.audit, action, commandId) };
    } catch (_) { stop('unexpected-reducer-effect', 'invariant', index); }
  }
  return { ledger: next, receipt: { index, action: clone(action), ledgerDigestBefore: digest(before), ledgerDigestAfter: digest(next), changes: changes(before, next), audit } };
}
function inspected(s: State): Exclude<InspectResult, Failure> { return { ok: true, revision: s.revision, clock: s.genesis.clock, ledger: s.ledger, remainingHistorySlots: 128 - s.revision, scope: 'bounded-shared-city-episode' }; }
function serialized(s: State): string { return canonicalBoundedCityJson({ tag: SAVE_TAG, state: s }); }
function previewed(result: Exclude<ExecuteResult, Failure>, baseRevision: number): Exclude<PreviewResult, Failure> {
  return { ok: true, committed: false, duplicate: result.duplicate, baseRevision, projectedLedger: result.state.ledger, receipt: result.receipt };
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
function transitionValidatedRoot(s: State, e: Envelope): Exclude<ExecuteResult, Failure> {
  const old = s.acceptedCommands.find(entry => entry.envelope.id === e.id);
  if (old) {
    if (!same(old.envelope, e)) stop('command-id-conflict', 'deduplication');
    fitRoot(s); return { ok: true, committed: false, duplicate: true, state: s, receipt: old.receipt };
  }
  if (e.expectedRevision !== s.revision) stop('stale-revision', 'revision');
  if (s.revision >= 128) stop('history-limit', 'budget');
  validateActions(e);
  let ledger = clone(s.ledger); const steps: StepReceipt[] = [];
  for (let index = 0; index < e.command.actions.length; index++) { const step = reduceStep(s.genesis, ledger, e.command.actions[index]!, e.id, index); ledger = step.ledger; steps.push(step.receipt); }
  ledgerInvariant(s.genesis, ledger);
  const receipt: Receipt = { envelope: clone(e), revisionBefore: s.revision, revisionAfter: s.revision + 1,
    policyDigest: digest(s.genesis.policy), catalogDigests: { production: digest(s.genesis.productionCatalog), merchant: digest(s.genesis.merchantCatalog) }, clock: clone(s.genesis.clock), steps,
    ledgerDigestBefore: digest(s.ledger), ledgerDigestAfter: digest(ledger), scope: 'bounded-shared-city-episode', rngDraws: 0, techniquePoints: 'not-modeled', nativeIntegration: false };
  const next: State = { tag: STATE_TAG, schemaVersion: 1, profile: PROFILE, genesis: s.genesis, revision: s.revision + 1, ledger, acceptedCommands: [...s.acceptedCommands, { envelope: clone(e), receipt }] };
  fitRoot(next, receipt); return { ok: true, committed: true, duplicate: false, state: next, receipt };
}
/** Full genesis fold, not execute(public)->rebuild recursion and never digest-only trust. */
function rebuildRoot(value: unknown): State {
  try {
    const raw = object(value, ['tag', 'schemaVersion', 'profile', 'genesis', 'revision', 'ledger', 'acceptedCommands']); literal(raw.tag, STATE_TAG, 'unsupported-schema'); literal(raw.schemaVersion, 1, 'unsupported-schema'); literal(raw.profile, PROFILE, 'unsupported-profile');
    const genesis = scenario(raw.genesis), revision = integer(raw.revision, 128), entries = array(raw.acceptedCommands, 128); ledgerInvariant(genesis, raw.ledger);
    if (revision !== entries.length) stop('history-recomputation-mismatch', 'rebuild');
    let state = initialState(genesis); fitRoot(state); const ids = new Set<string>();
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
    const f = caught(e); if (f.stage === 'budget') throw e; stop(f.reason, 'rebuild', f.actionIndex, f.blockingUnitId);
  }
}

export function createBoundedCityEconomyV1(input: BoundedCityEconomyScenarioV1): BoundedCityEconomyCreateOrLoadResultV1 {
  try { const state = initialState(scenario(detach(input))); fitRoot(state); return freeze({ ok: true, state } as const); } catch (e) { return freeze(caught(e)); }
}
export function inspectBoundedCityEconomyV1(input: BoundedCityEconomyStateV1): BoundedCityEconomyInspectResultV1 {
  try { const state = rebuildRoot(detach(input)); return freeze(inspected(state)); } catch (e) { return freeze(caught(e)); }
}
export function executeBoundedCityEconomyV1(input: BoundedCityEconomyStateV1, command: BoundedCityEconomyEnvelopeV1): BoundedCityEconomyExecuteResultV1 {
  try { const stateData = detach(input), commandData = detach(command); const state = rebuildRoot(stateData); return freeze(transitionValidatedRoot(state, envelope(commandData))); } catch (e) { return freeze(caught(e)); }
}
export function previewBoundedCityEconomyV1(input: BoundedCityEconomyStateV1, command: BoundedCityEconomyEnvelopeV1): BoundedCityEconomyPreviewResultV1 {
  try { const stateData = detach(input), commandData = detach(command); const state = rebuildRoot(stateData); return freeze(previewed(transitionValidatedRoot(state, envelope(commandData)), state.revision)); } catch (e) { return freeze(caught(e)); }
}
export function saveBoundedCityEconomyV1(input: BoundedCityEconomyStateV1): BoundedCityEconomySaveResultV1 {
  try { const state = rebuildRoot(detach(input)); const result = { ok: true, serialized: serialized(state) } as const; budget(result); return freeze(result); } catch (e) { return freeze(caught(e)); }
}
export function loadBoundedCityEconomyV1(input: string): BoundedCityEconomyCreateOrLoadResultV1 {
  try {
    const decoded = decodeBoundedCityJson(input); if (!decoded.ok) stop(decoded.reason, decoded.reason === 'budget-exceeded' ? 'budget' : 'input');
    const save = object(decoded.value, ['tag', 'state']); literal(save.tag, SAVE_TAG, 'unsupported-schema'); const state = rebuildRoot(save.state); const result = { ok: true, state } as const; budget(result); return freeze(result);
  } catch (e) { return freeze(caught(e)); }
}
function legalRequest(value: unknown, revision: number): LegalRequest {
  const r = object(value, ['requestId', 'expectedRevision', 'domesticOfficerIds', 'merchantRequests', 'cursor', 'pageSize']); id(r.requestId, 32); integer(r.expectedRevision);
  if (r.domesticOfficerIds !== null) unique(array(r.domesticOfficerIds, 3, 1, 'invalid-officer-count').map(v => id(v)), 'invalid-officer-count');
  const requests = array(r.merchantRequests, 16).map(value => { const p = object(value, ['officerId', 'foodAmount']); id(p.officerId); integer(p.foodAmount, MAX, 1); return canonicalBoundedCityJson(p); }); unique(requests, 'invalid-array');
  if (r.expectedRevision !== revision) stop('stale-revision', 'revision');
  if (r.cursor !== null) {
    if (r.cursor === null || typeof r.cursor !== 'object' || Array.isArray(r.cursor)) stop('invalid-cursor');
    const c = r.cursor as Record<string, unknown>;
    if (!Object.hasOwn(c, 'version') || !Object.hasOwn(c, 'orderVersion')) stop('invalid-cursor');
    if (c.version !== 1 || c.orderVersion !== ORDER) stop('unsupported-cursor-version');
    object(c, ['version', 'orderVersion', 'stateDigest', 'requestDigest', 'revision', 'nextIndex'], 'invalid-cursor');
    for (const f of ['stateDigest', 'requestDigest']) if (typeof c[f] !== 'string' || !/^[a-f0-9]{64}$/.test(c[f] as string)) stop('invalid-cursor');
    integer(c.revision, 128, 0, 'invalid-cursor'); integer(c.nextIndex, 127, 0, 'invalid-cursor');
  }
  choice(r.pageSize, [1, 2, 3, 4], 'invalid-page-size'); return r as unknown as LegalRequest;
}
function candidateActions(s: Scenario, r: LegalRequest): Action[] {
  const actions: Action[] = [], cityId = s.city.id;
  if (r.domesticOfficerIds !== null) {
    const officerIds = r.domesticOfficerIds;
    actions.push({ type: 'Patrol', cityId, officerIds: [...officerIds] });
    for (const f of s.facilities) {
      if (f.kind === 'barracks') actions.push({ type: 'Recruit', cityId, officerIds: [...officerIds], facilityId: f.id });
      else for (const equipmentType of f.kind === 'forge' ? [1, 2, 3] as const : [4] as const) actions.push({ type: 'Produce', cityId, officerIds: [...officerIds], facilityId: f.id, equipmentType });
    }
  }
  for (const request of r.merchantRequests) for (const type of ['BuyFood', 'SellFood'] as const) actions.push({ type, cityId, officerId: request.officerId, foodAmount: request.foodAmount });
  if (actions.length > 128) stop('budget-exceeded', 'budget'); return actions;
}
export function listBoundedCityActionsV1(input: BoundedCityEconomyStateV1, request: BoundedCityEconomyLegalRequestV1): BoundedCityEconomyLegalResultV1 {
  try {
    const stateData = detach(input), requestData = detach(request), state = rebuildRoot(stateData), r = legalRequest(requestData, state.revision);
    const stateDigest = digest(state), requestDigest = digest({ requestId: r.requestId, expectedRevision: r.expectedRevision, domesticOfficerIds: r.domesticOfficerIds, merchantRequests: r.merchantRequests });
    const actions = candidateActions(state.genesis, r), total = actions.length;
    if (r.cursor !== null) {
      if (r.cursor.nextIndex >= total) stop('invalid-cursor');
      if (r.cursor.revision !== state.revision || r.cursor.stateDigest !== stateDigest) stop('cursor-state-mismatch');
      if (r.cursor.requestDigest !== requestDigest) stop('cursor-request-mismatch');
    }
    const envelopes: Envelope[] = actions.map((action, ordinal) => ({ id: `legal:${r.requestId}:${ordinal}`, expectedRevision: state.revision, command: { type: 'ExecuteCityActions', actions: [action] } }));
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
    if (total === 0) { const empty = page([]); budget(empty); return freeze(empty); }
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
export function replayBoundedCityEconomyV1(input: BoundedCityEconomyTraceV1): BoundedCityEconomyReplayResultV1 {
  let index: number | null = null;
  try {
    const trace = object(detach(input), ['tag', 'scenario', 'attempts', 'expectedFinalState']); literal(trace.tag, TRACE_TAG, 'unsupported-schema');
    const genesis = scenario(trace.scenario), attempts = array(trace.attempts, 512);
    // Outer shapes are checked before any attempt. Expected data never drives effects.
    for (const value of attempts) object(value, ['envelope', 'expected']);
    let state = initialState(genesis); fitRoot(state); const outcomes: ReplayOutcome[] = [];
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
