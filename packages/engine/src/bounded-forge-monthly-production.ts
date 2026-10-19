/** Bounded forge construction, ordinary production and provisional monthly specialty share one ledger.
 * Trust comes only from the complete genesis fold; this owner does not integrate payroll or full finance. */
import { ROOT_POLICY, CONSTRUCTION_CATALOG } from './internal/bounded-forge-monthly-production-registry.ts';
import { canonicalBoundedForgeMonthlyJson, decodeBoundedForgeMonthlyJson } from './internal/bounded-forge-monthly-production-json.ts';
import { calculateConstructionDevelopment } from './internal/facility-construction-leaves.ts';
import { rateReceipt, constructionWrite, produce, startSnapshot, startForge, advanceShared } from './internal/bounded-forge-core.ts';
import { stop, caught } from './internal/bounded-forge-core-errors.ts';
import { clone, same, digest, record, object, integer, literal, choice, jobId, array, advanceDate, detach, budget } from './internal/bounded-forge-monthly-production-data.ts';
import type { ForgeCoreFacts } from './internal/bounded-forge-core-types.ts';
import { applyForgeMonthlySpecialty } from './internal/bounded-forge-monthly-production-adapter.ts';
import type { DeepReadonly, ConstructionPolicy, ConstructionCatalog, Id, JobId, Digest, Marker, Equipment, ProduceEquipment, DateV1, Position, Clock, Progress, OfficerFacts, Lot, ExistingForge, Unit, ProductionCatalog, Scenario, Policy, DomesticPolicies, RateInput, RateEvidence, RateReceipt, ConstructionWrite, ConstructionWritePolicyId, DomesticWrite, OfficerRow, FacilityRow, Ledger, ConstructionReward, Completion, StartSnapshot, ConstructionFees, Work, Job, Current, PriceInput, PriceOutput, QuantitySlot, QuantityInput, QuantityOutput, Kernels, ProductionCalculation, DomesticFees, DomesticReward, ProductionAudit, StartCommand, ProduceCommand, AdvanceCommand, Command, Envelope, UnitCheck, StartReservations, StartDetail, ProgressAudit, TickDetail, ReceiptCommon, Receipt, State, Stage, Reason, Failure, CreateOrLoadResult, InspectResult, ExecuteResult, PreviewResult, SaveEnvelope, SaveResult, ReplayOutcome, Trace, ReplayResult, Thirty, MonthlyFacts, MonthlyPolicy, MonthlySlots, MonthlyInput, MonthlyCapture, MonthlyArithmetic, MonthlyQuantityRequest, MonthlyEvidence, MonthlyKernelResult, MonthlyKernelCall, MonthlyWrite, MonthlyItem, MonthlyReceipt } from './internal/bounded-forge-monthly-production-types.ts';

export type BoundedForgeMonthlyProductionConstructionPolicyV1 = DeepReadonly<ConstructionPolicy>;
export type BoundedForgeMonthlyProductionConstructionCatalogV1 = DeepReadonly<ConstructionCatalog>;
export type BoundedForgeMonthlyProductionIdV1 = DeepReadonly<Id>;
export type BoundedForgeMonthlyProductionJobIdV1 = DeepReadonly<JobId>;
export type BoundedForgeMonthlyProductionDigestV1 = DeepReadonly<Digest>;
export type BoundedForgeMonthlyProductionMarkerV1 = DeepReadonly<Marker>;
export type BoundedForgeMonthlyProductionEquipmentV1 = DeepReadonly<Equipment>;
export type BoundedForgeMonthlyProductionProduceEquipmentV1 = DeepReadonly<ProduceEquipment>;
export type BoundedForgeMonthlyProductionDateV1 = DeepReadonly<DateV1>;
export type BoundedForgeMonthlyProductionPositionV1 = DeepReadonly<Position>;
export type BoundedForgeMonthlyProductionClockV1 = DeepReadonly<Clock>;
export type BoundedForgeMonthlyProductionProgressV1 = DeepReadonly<Progress>;
export type BoundedForgeMonthlyProductionOfficerFactsV1 = DeepReadonly<OfficerFacts>;
export type BoundedForgeMonthlyProductionLotV1 = DeepReadonly<Lot>;
export type BoundedForgeMonthlyProductionExistingForgeV1 = DeepReadonly<ExistingForge>;
export type BoundedForgeMonthlyProductionUnitV1 = DeepReadonly<Unit>;
export type BoundedForgeMonthlyProductionProductionCatalogV1 = DeepReadonly<ProductionCatalog>;
export type BoundedForgeMonthlyProductionScenarioV1 = DeepReadonly<Scenario>;
export type BoundedForgeMonthlyProductionPolicyV1 = DeepReadonly<Policy>;
export type BoundedForgeMonthlyProductionDomesticPoliciesV1 = DeepReadonly<DomesticPolicies>;
export type BoundedForgeMonthlyProductionRateInputV1 = DeepReadonly<RateInput>;
export type BoundedForgeMonthlyProductionRateEvidenceV1 = DeepReadonly<RateEvidence>;
export type BoundedForgeMonthlyProductionRateReceiptV1 = DeepReadonly<RateReceipt>;
export type BoundedForgeMonthlyProductionConstructionWriteV1 = DeepReadonly<ConstructionWrite>;
export type BoundedForgeMonthlyProductionConstructionWritePolicyIdV1 = DeepReadonly<ConstructionWritePolicyId>;
export type BoundedForgeMonthlyProductionDomesticWriteV1 = DeepReadonly<DomesticWrite>;
export type BoundedForgeMonthlyProductionOfficerRowV1 = DeepReadonly<OfficerRow>;
export type BoundedForgeMonthlyProductionFacilityRowV1 = DeepReadonly<FacilityRow>;
export type BoundedForgeMonthlyProductionLedgerV1 = DeepReadonly<Ledger>;
export type BoundedForgeMonthlyProductionConstructionRewardV1 = DeepReadonly<ConstructionReward>;
export type BoundedForgeMonthlyProductionCompletionV1 = DeepReadonly<Completion>;
export type BoundedForgeMonthlyProductionStartSnapshotV1 = DeepReadonly<StartSnapshot>;
export type BoundedForgeMonthlyProductionConstructionFeesV1 = DeepReadonly<ConstructionFees>;
export type BoundedForgeMonthlyProductionWorkV1 = DeepReadonly<Work>;
export type BoundedForgeMonthlyProductionJobV1 = DeepReadonly<Job>;
export type BoundedForgeMonthlyProductionCurrentV1 = DeepReadonly<Current>;
export type BoundedForgeMonthlyProductionPriceInputV1 = DeepReadonly<PriceInput>;
export type BoundedForgeMonthlyProductionPriceOutputV1 = DeepReadonly<PriceOutput>;
export type BoundedForgeMonthlyProductionQuantitySlotV1 = DeepReadonly<QuantitySlot>;
export type BoundedForgeMonthlyProductionQuantityInputV1 = DeepReadonly<QuantityInput>;
export type BoundedForgeMonthlyProductionQuantityOutputV1 = DeepReadonly<QuantityOutput>;
export type BoundedForgeMonthlyProductionKernelsV1 = DeepReadonly<Kernels>;
export type BoundedForgeMonthlyProductionProductionCalculationV1 = DeepReadonly<ProductionCalculation>;
export type BoundedForgeMonthlyProductionDomesticFeesV1 = DeepReadonly<DomesticFees>;
export type BoundedForgeMonthlyProductionDomesticRewardV1 = DeepReadonly<DomesticReward>;
export type BoundedForgeMonthlyProductionProductionAuditV1 = DeepReadonly<ProductionAudit>;
export type BoundedForgeMonthlyProductionStartCommandV1 = DeepReadonly<StartCommand>;
export type BoundedForgeMonthlyProductionProduceCommandV1 = DeepReadonly<ProduceCommand>;
export type BoundedForgeMonthlyProductionAdvanceCommandV1 = DeepReadonly<AdvanceCommand>;
export type BoundedForgeMonthlyProductionCommandV1 = DeepReadonly<Command>;
export type BoundedForgeMonthlyProductionEnvelopeV1 = DeepReadonly<Envelope>;
export type BoundedForgeMonthlyProductionUnitCheckV1 = DeepReadonly<UnitCheck>;
export type BoundedForgeMonthlyProductionStartReservationsV1 = DeepReadonly<StartReservations>;
export type BoundedForgeMonthlyProductionStartDetailV1 = DeepReadonly<StartDetail>;
export type BoundedForgeMonthlyProductionProgressAuditV1 = DeepReadonly<ProgressAudit>;
export type BoundedForgeMonthlyProductionTickDetailV1 = DeepReadonly<TickDetail>;
export type BoundedForgeMonthlyProductionReceiptCommonV1 = DeepReadonly<ReceiptCommon>;
export type BoundedForgeMonthlyProductionReceiptV1 = DeepReadonly<Receipt>;
export type BoundedForgeMonthlyProductionStateV1 = DeepReadonly<State>;
export type BoundedForgeMonthlyProductionStageV1 = DeepReadonly<Stage>;
export type BoundedForgeMonthlyProductionReasonV1 = DeepReadonly<Reason>;
export type BoundedForgeMonthlyProductionFailureV1 = DeepReadonly<Failure>;
export type BoundedForgeMonthlyProductionCreateOrLoadResultV1 = DeepReadonly<CreateOrLoadResult>;
export type BoundedForgeMonthlyProductionInspectResultV1 = DeepReadonly<InspectResult>;
export type BoundedForgeMonthlyProductionExecuteResultV1 = DeepReadonly<ExecuteResult>;
export type BoundedForgeMonthlyProductionPreviewResultV1 = DeepReadonly<PreviewResult>;
export type BoundedForgeMonthlyProductionSaveEnvelopeV1 = DeepReadonly<SaveEnvelope>;
export type BoundedForgeMonthlyProductionSaveResultV1 = DeepReadonly<SaveResult>;
export type BoundedForgeMonthlyProductionReplayOutcomeV1 = DeepReadonly<ReplayOutcome>;
export type BoundedForgeMonthlyProductionTraceV1 = DeepReadonly<Trace>;
export type BoundedForgeMonthlyProductionReplayResultV1 = DeepReadonly<ReplayResult>;

export type BoundedForgeMonthlyProductionMonthlyFactsV1 = DeepReadonly<MonthlyFacts>;
export type BoundedForgeMonthlyProductionMonthlyPolicyV1 = DeepReadonly<MonthlyPolicy>;
export type BoundedForgeMonthlyProductionMonthlySlotsV1 = DeepReadonly<MonthlySlots>;
export type BoundedForgeMonthlyProductionMonthlyInputV1 = DeepReadonly<MonthlyInput>;
export type BoundedForgeMonthlyProductionMonthlyCaptureV1 = DeepReadonly<MonthlyCapture>;
export type BoundedForgeMonthlyProductionMonthlyArithmeticV1 = DeepReadonly<MonthlyArithmetic>;
export type BoundedForgeMonthlyProductionMonthlyQuantityRequestV1 = DeepReadonly<MonthlyQuantityRequest>;
export type BoundedForgeMonthlyProductionMonthlyEvidenceV1 = DeepReadonly<MonthlyEvidence>;
export type BoundedForgeMonthlyProductionMonthlyKernelResultV1 = DeepReadonly<MonthlyKernelResult>;
export type BoundedForgeMonthlyProductionMonthlyKernelCallV1 = DeepReadonly<MonthlyKernelCall>;
export type BoundedForgeMonthlyProductionMonthlyWriteV1 = DeepReadonly<MonthlyWrite>;
export type BoundedForgeMonthlyProductionMonthlyItemV1 = DeepReadonly<MonthlyItem>;
export type BoundedForgeMonthlyProductionMonthlyReceiptV1 = DeepReadonly<MonthlyReceipt>;

const PROFILE = 'bounded-forge-monthly-production-v1';
const STATE_TAG = 'san11-bounded-forge-monthly-production-state-v1';
const SAVE_TAG = 'san11-bounded-forge-monthly-production-save-v1';
const TRACE_TAG = 'san11-bounded-forge-monthly-production-trace-v1';
const MAX = 1_000_000_000;
const EQUIPMENT = [1, 2, 3, 4] as const;
const XP = ['leadershipXp', 'charmXp', 'intelligenceXp', 'politicsXp', 'warXp'] as const;
function atStage<T>(stage: Stage, operation: () => T): T {
  try { return operation(); } catch (error) { const f = caught(error); stop(f.reason, f.stage === 'budget' ? 'budget' : stage, f); }
}
function freeze<T>(value: T): DeepReadonly<T> {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const item of Object.values(value)) freeze(item); Object.freeze(value);
  }
  return value as DeepReadonly<T>;
}
function id(value: unknown): Id { if (typeof value !== 'string' || (!/^[A-Za-z0-9][A-Za-z0-9_.:-]{0,63}$/.test(value) || /[^A-Za-z0-9_.:-]/.test(value))) stop('invalid-id'); return value; }
function boolean(value: unknown): boolean { if (typeof value !== 'boolean') stop('invalid-data'); return value; }
function unique(values: readonly unknown[], reason: Reason = 'duplicate-entity-id'): void { if (new Set(values).size !== values.length) stop(reason); }
function marker(value: unknown, turn: number): Marker { return value === null ? null : integer(value, turn, 0, 'invalid-marker'); }
function position(value: unknown): Position {
  const p = object(value, ['q', 'r']); return { q: integer(p.q, 1_000_000, -1_000_000), r: integer(p.r, 1_000_000, -1_000_000) };
}
function date(value: unknown): DateV1 {
  const d = object(value, ['year', 'month', 'day'], 'invalid-date'); return { year: integer(d.year, 9999, 1, 'invalid-date'), month: integer(d.month, 12, 1, 'invalid-date'), day: choice(d.day, [1, 11, 21] as const, 'invalid-date') };
}
function progress(value: unknown, turn: number): Progress {
  const p = object(value, [...XP, 'merit', 'actedTurn']);
  return { leadershipXp: integer(p.leadershipXp, MAX), charmXp: integer(p.charmXp, MAX), intelligenceXp: integer(p.intelligenceXp, MAX),
    politicsXp: integer(p.politicsXp, MAX), warXp: integer(p.warXp, MAX), merit: integer(p.merit, MAX), actedTurn: marker(p.actedTurn, turn) };
}
/** Freeze only an owned copy of the source literals, never an imported or caller object. */
export const BOUNDED_FORGE_MONTHLY_PRODUCTION_POLICY: BoundedForgeMonthlyProductionPolicyV1 = freeze(clone(ROOT_POLICY));
function scenario(value: unknown): Scenario {
  const s = object(value, ['schemaVersion', 'profile', 'episodeId', 'clock', 'advanceLimit', 'activeForceId', 'force', 'corps', 'city', 'officers', 'lots', 'facilities', 'domestic', 'constructionEnvironment', 'productionCatalog', 'constructionCatalog', 'policy', 'monthlySpecialty']);
  const schemaVersion = literal(s.schemaVersion, 1, 'unsupported-schema'), profile = literal(s.profile, PROFILE, 'unsupported-profile'), episodeId = id(s.episodeId);
  const clock = object(s.clock, ['date', 'turn']), initialDate = date(clock.date), turn = integer(clock.turn);
  const advanceLimit = integer(s.advanceLimit, 12, 1); integer(turn + advanceLimit); advanceDate(initialDate, advanceLimit);
  const activeForceId = id(s.activeForceId), rawForce = object(s.force, ['id', 'initialTechniquePoints']);
  const force = { id: id(rawForce.id), initialTechniquePoints: integer(rawForce.initialTechniquePoints, 10000) };
  const rawCorps = object(s.corps, ['id', 'forceId', 'initialActionPoints']);
  const corps = { id: id(rawCorps.id), forceId: id(rawCorps.forceId), initialActionPoints: integer(rawCorps.initialActionPoints, 255) };
  const rawCity = object(s.city, ['id', 'kind', 'ownerForceId', 'position', 'goldCapacity', 'troopCapacity', 'moraleCap', 'initial', 'inventory']);
  const cityId = id(rawCity.id), kind = literal(rawCity.kind, 'city', 'unsupported-city-kind'), ownerForceId = id(rawCity.ownerForceId), center = position(rawCity.position);
  const goldCapacity = literal(rawCity.goldCapacity, MAX, 'invalid-number'), troopCapacity = integer(rawCity.troopCapacity, 1_000_000), moraleCap = integer(rawCity.moraleCap, 255, 20);
  const rawInitial = object(rawCity.initial, ['gold', 'security', 'troops', 'morale', 'patrolUsedTurn']);
  const initial = { gold: integer(rawInitial.gold, MAX), security: integer(rawInitial.security, 100), troops: integer(rawInitial.troops, troopCapacity), morale: integer(rawInitial.morale, moraleCap), patrolUsedTurn: marker(rawInitial.patrolUsedTurn, turn) };
  const rawInventory = object(rawCity.inventory, ['1', '2', '3', '4']);
  function inventorySlot(equipmentType: Equipment): { quantity: number; capacity: number } {
    const slot = object(rawInventory[equipmentType], ['quantity', 'capacity']);
    integer(slot.quantity, 1_000_000); const capacity = integer(slot.capacity, 1_000_000);
    return { quantity: integer(slot.quantity, capacity), capacity };
  }
  const inventory = { 1: inventorySlot(1), 2: inventorySlot(2), 3: inventorySlot(3), 4: inventorySlot(4) };
  const city: Scenario['city'] = { id: cityId, kind, ownerForceId, position: center, goldCapacity, troopCapacity, moraleCap, initial, inventory };
  if (force.id !== activeForceId || corps.forceId !== activeForceId || ownerForceId !== activeForceId) stop('owner-corps-mismatch');
  const officers: OfficerFacts[] = array(s.officers, 8, 1).map(value => {
    const o = object(value, ['id', 'forceId', 'cityId', 'available', 'leadership', 'charm', 'intelligence', 'politics', 'skillIds', 'initial']);
    const officerId = id(o.id), forceId = id(o.forceId), officerCityId = id(o.cityId), available = boolean(o.available);
    const leadership = integer(o.leadership, 255), charm = integer(o.charm, 255), intelligence = integer(o.intelligence, 255), politics = integer(o.politics, 255);
    const skillIds = array(o.skillIds, 3).map(v => choice(v, [79, 80, 81] as const, 'unsupported-skill')); unique(skillIds);
    const officerInitial = progress(o.initial, turn);
    if (forceId !== activeForceId || officerCityId !== cityId) stop('officer-city-force-mismatch');
    return { id: officerId, forceId, cityId: officerCityId, available, leadership, charm, intelligence, politics, skillIds, initial: officerInitial };
  }); unique(officers.map(o => o.id));
  const lots: Lot[] = array(s.lots, 2, 1).map(value => {
    const lot = object(value, ['id', 'cityId', 'position']); return { id: id(lot.id), cityId: id(lot.cityId), position: position(lot.position) };
  }); unique(lots.map(lot => lot.id));
  const facilities: ExistingForge[] = array(s.facilities, 1).map(value => {
    const f = object(value, ['id', 'lotId', 'cityId', 'kind', 'level', 'complete', 'initialUsedTurn']);
    return { id: id(f.id), lotId: id(f.lotId), cityId: id(f.cityId), kind: literal(f.kind, 'forge', 'wrong-facility-kind'), level: literal(f.level, 1, 'unsupported-external-state'), complete: literal(f.complete, true, 'unsupported-external-state'), initialUsedTurn: marker(f.initialUsedTurn, turn) };
  }); unique(facilities.map(f => f.id));
  if (lots.length !== facilities.length + 1) stop('invalid-lot-layout');
  unique(lots.map(lot => canonicalBoundedForgeMonthlyJson(lot.position)), 'invalid-lot-layout');
  for (const lot of lots) if (lot.cityId !== cityId || same(lot.position, center)) stop('invalid-lot-layout');
  unique(facilities.map(f => f.lotId), 'invalid-lot-layout');
  for (const f of facilities) if (f.cityId !== cityId || !lots.some(lot => lot.id === f.lotId)) stop('invalid-lot-layout');
  const rawDomestic = object(s.domestic, ['pressureActive', 'difficulty', 'controller', 'unlockedEquipmentTypes', 'specialtyEquipmentTypes']);
  const pressureActive = boolean(rawDomestic.pressureActive), difficulty = choice(rawDomestic.difficulty, ['normal', 'super'] as const), controller = choice(rawDomestic.controller, ['player', 'ai'] as const);
  const unlockedEquipmentTypes = array(rawDomestic.unlockedEquipmentTypes, 4).map(v => choice(v, EQUIPMENT, 'unsupported-equipment')); unique(unlockedEquipmentTypes);
  const specialtyEquipmentTypes = array(rawDomestic.specialtyEquipmentTypes, 4).map(v => choice(v, EQUIPMENT, 'unsupported-equipment')); unique(specialtyEquipmentTypes);
  const domestic: Scenario['domestic'] = { pressureActive, difficulty, controller, unlockedEquipmentTypes, specialtyEquipmentTypes };
  const environment = object(s.constructionEnvironment, ['completeFieldUnits', 'hostileForceIds', 'fieldUnits']);
  const completeFieldUnits = literal(environment.completeFieldUnits, true, 'incomplete-field-unit-snapshot');
  const hostileForceIds = array(environment.hostileForceIds, 16).map(id); unique(hostileForceIds); if (hostileForceIds.includes(activeForceId)) stop('owner-marked-hostile');
  const fieldUnits: Unit[] = array(environment.fieldUnits, 16).map(value => {
    const unit = object(value, ['id', 'forceId', 'position']); return { id: id(unit.id), forceId: id(unit.forceId), position: position(unit.position) };
  }); unique(fieldUnits.map(u => u.id));
  const constructionEnvironment = { completeFieldUnits, hostileForceIds, fieldUnits };
  const catalog = object(s.productionCatalog, ['id', 'version', 'entries']), catalogId = id(catalog.id), catalogVersion = literal(catalog.version, 1, 'unsupported-catalog');
  const entries = object(catalog.entries, ['1', '2', '3', '4']);
  function priceEntry(equipmentType: Equipment): { basePriceWord: number } {
    const entry = object(entries[equipmentType], ['basePriceWord']); return { basePriceWord: integer(entry.basePriceWord, 65535) };
  }
  const productionCatalog: ProductionCatalog = { id: catalogId, version: catalogVersion, entries: { 1: priceEntry(1), 2: priceEntry(2), 3: priceEntry(3), 4: priceEntry(4) } };
  if (!same(s.constructionCatalog, CONSTRUCTION_CATALOG)) stop('unsupported-catalog');
  if (!same(s.policy, ROOT_POLICY)) stop('unsupported-policy');
  // These assertions remove readonly from newly cloned exact source constants, never from unknown input.
  const constructionCatalog = clone(CONSTRUCTION_CATALOG) as ConstructionCatalog, policy = clone(ROOT_POLICY) as Policy;
  const monthly = object(s.monthlySpecialty, ['governorOfficerId', 'facilityLotSlots']);
  const governorOfficerId = monthly.governorOfficerId === null ? null : id(monthly.governorOfficerId);
  if (governorOfficerId !== null) {
    const governor = officers.find(o => o.id === governorOfficerId);
    if (!governor) stop('unknown-officer', 'input', { officerId: governorOfficerId });
    if (governor.cityId !== cityId || governor.forceId !== activeForceId) stop('officer-city-force-mismatch', 'input', { officerId: governorOfficerId });
    if (governor.politics > 100) stop('invalid-number', 'input', { officerId: governorOfficerId });
  }
  const slots = array(monthly.facilityLotSlots, 30, 30), seen = new Set<Id>();
  function lotSlot(index: number): Id | null {
    const raw = slots[index]; if (raw === null) return null;
    const lotId = id(raw); if (!lots.some(lot => lot.id === lotId)) stop('unknown-lot');
    return lotId;
  }
  const facilityLotSlots: Thirty<Id | null> = [
    lotSlot(0), lotSlot(1), lotSlot(2), lotSlot(3), lotSlot(4), lotSlot(5), lotSlot(6), lotSlot(7), lotSlot(8), lotSlot(9),
    lotSlot(10), lotSlot(11), lotSlot(12), lotSlot(13), lotSlot(14), lotSlot(15), lotSlot(16), lotSlot(17), lotSlot(18), lotSlot(19),
    lotSlot(20), lotSlot(21), lotSlot(22), lotSlot(23), lotSlot(24), lotSlot(25), lotSlot(26), lotSlot(27), lotSlot(28), lotSlot(29),
  ];
  for (const lotId of facilityLotSlots) {
    if (lotId === null) continue;
    if (seen.has(lotId)) stop('invalid-lot-layout'); seen.add(lotId);
  }
  if (lots.some(lot => !seen.has(lot.id))) stop('invalid-lot-layout');
  return { schemaVersion, profile, episodeId, clock: { date: initialDate, turn }, advanceLimit, activeForceId, force, corps, city, officers, lots, facilities, domestic, constructionEnvironment, productionCatalog, constructionCatalog, policy, monthlySpecialty: { governorOfficerId, facilityLotSlots } };
}
function coreFacts(s: Scenario): ForgeCoreFacts {
  return {
    advanceLimit: s.advanceLimit, activeForceId: s.activeForceId, force: s.force, corps: s.corps,
    city: s.city, officers: s.officers, lots: s.lots, domestic: s.domestic,
    constructionEnvironment: s.constructionEnvironment,
    productionCatalog: s.productionCatalog, constructionCatalog: s.constructionCatalog,
    policy: s.policy.base,
  };
}
function initialState(s: Scenario): State {
  const inventory: Ledger['inventory'] = { 1: { quantity: s.city.inventory[1].quantity, reserved: 0 }, 2: { quantity: s.city.inventory[2].quantity, reserved: 0 }, 3: { quantity: s.city.inventory[3].quantity, reserved: 0 }, 4: { quantity: s.city.inventory[4].quantity, reserved: 0 } };
  return { tag: STATE_TAG, schemaVersion: 1, profile: PROFILE, genesis: s, revision: 0,
    current: { clock: { date: clone(s.clock.date), turn: s.clock.turn, advancedCount: 0 }, jobs: [], ledger: {
      ...clone(s.city.initial), actionPoints: s.corps.initialActionPoints, force: { techniquePoints: s.force.initialTechniquePoints }, inventory,
      officers: s.officers.map(o => ({ id: o.id, politics: o.politics, ...clone(o.initial), reservationJobId: null })),
      facilities: s.facilities.map(f => ({ id: f.id, lotId: f.lotId, cityId: f.cityId, kind: 'forge', targetLevel: 1, typeId: 34, status: 'complete', effectiveLevel: 1, jobId: null, usedTurn: f.initialUsedTurn })) } } , acceptedCommands: [] };
}
type OuterEnvelope = { id: Id; expectedRevision: number; command: Record<string, unknown> };
function envelope(value: unknown): OuterEnvelope {
  const e = object(value, ['id', 'expectedRevision', 'command']); return { id: id(e.id), expectedRevision: integer(e.expectedRevision), command: record(e.command) };
}
function officerIds(value: unknown): Id[] { const ids = array(value, 3, 1, 'invalid-officer-count').map(id); unique(ids); return ids; }
function command(value: Record<string, unknown>): Command {
  if (value.type === 'StartForgeDevelopment') {
    const c = object(value, ['type', 'cityId', 'lotId', 'facilityId', 'officerIds']);
    return { type: 'StartForgeDevelopment', cityId: id(c.cityId), lotId: id(c.lotId), facilityId: id(c.facilityId), officerIds: officerIds(c.officerIds) };
  }
  if (value.type === 'Produce') {
    const c = object(value, ['type', 'cityId', 'facilityId', 'officerIds', 'equipmentType']);
    return { type: 'Produce', cityId: id(c.cityId), facilityId: id(c.facilityId), officerIds: officerIds(c.officerIds), equipmentType: choice(c.equipmentType, [1, 2, 3] as const, 'unsupported-equipment') };
  }
  if (value.type === 'AdvanceSharedFacilityTurn') { object(value, ['type']); return { type: 'AdvanceSharedFacilityTurn' }; }
  return stop('unsupported-command');
}
function reservedCompletionSlots(c: Current): number { const job = c.jobs[0]; return job && job.completedTurn === null ? job.remainingTurns : 0; }
function currentInvariant(s: Scenario, c: Current): void {
  object(c, ['clock', 'ledger', 'jobs']); object(c.clock, ['date', 'turn', 'advancedCount']); date(c.clock.date); integer(c.clock.turn); integer(c.clock.advancedCount, s.advanceLimit);
  if (c.clock.turn !== s.clock.turn + c.clock.advancedCount || !same(c.clock.date, advanceDate(s.clock.date, c.clock.advancedCount))) stop('invariant-mismatch');
  const l = c.ledger; object(l, ['gold', 'actionPoints', 'security', 'troops', 'morale', 'patrolUsedTurn', 'force', 'inventory', 'officers', 'facilities']);
  integer(l.gold, MAX); integer(l.actionPoints, 255); object(l.force, ['techniquePoints']); integer(l.force.techniquePoints, 10000);
  for (const field of ['security', 'troops', 'morale', 'patrolUsedTurn'] as const) if (l[field] !== s.city.initial[field]) stop('invariant-mismatch');
  object(l.inventory, ['1', '2', '3', '4']);
  for (const type of EQUIPMENT) { object(l.inventory[type], ['quantity', 'reserved']); integer(l.inventory[type].quantity, s.city.inventory[type].capacity); literal(l.inventory[type].reserved, 0); }
  if (!same(l.inventory[4], { quantity: s.city.inventory[4].quantity, reserved: 0 })) stop('invariant-mismatch');
  array(l.officers, s.officers.length, s.officers.length);
  for (let i = 0; i < l.officers.length; i++) {
    const o = l.officers[i]!, initial = s.officers[i]!;
    object(o, ['id', 'politics', ...XP, 'merit', 'actedTurn', 'reservationJobId']); id(o.id); integer(o.politics, 255);
    if (o.id !== initial.id || o.politics !== initial.politics) stop('invariant-mismatch');
    for (const xp of XP) integer(o[xp], MAX); integer(o.merit, MAX); marker(o.actedTurn, c.clock.turn); if (o.reservationJobId !== null) jobId(o.reservationJobId);
    for (const xp of ['leadershipXp', 'charmXp', 'warXp'] as const) if (o[xp] !== initial.initial[xp]) stop('invariant-mismatch');
  }
  array(c.jobs, 1); array(l.facilities, 2); if (l.facilities.length !== s.facilities.length + c.jobs.length) stop('invariant-mismatch');
  unique(l.facilities.map(f => f.id)); unique(l.facilities.map(f => f.lotId));
  for (let i = 0; i < l.facilities.length; i++) {
    const f = l.facilities[i]!; object(f, ['id', 'lotId', 'cityId', 'kind', 'targetLevel', 'typeId', 'status', 'effectiveLevel', 'jobId', 'usedTurn']);
    id(f.id); id(f.lotId); literal(f.cityId, s.city.id); literal(f.kind, 'forge'); literal(f.targetLevel, 1); literal(f.typeId, 34); marker(f.usedTurn, c.clock.turn);
    if (!s.lots.some(lot => lot.id === f.lotId)) stop('invariant-mismatch');
    if (f.status === 'complete') { literal(f.effectiveLevel, 1); literal(f.jobId, null); }
    else { literal(f.status, 'developing'); literal(f.effectiveLevel, 0); jobId(f.jobId); literal(f.usedTurn, null); }
    const initial = s.facilities[i];
    if (initial && (f.id !== initial.id || f.lotId !== initial.lotId || f.status !== 'complete' || f.jobId !== null || f.effectiveLevel !== 1)) stop('invariant-mismatch');
  }
  const job = c.jobs[0];
  if (job) {
    object(job, ['id', 'kind', 'facilityKind', 'cityId', 'lotId', 'facilityId', 'fromLevel', 'targetLevel', 'officerIds', 'politics', 'startTurn', 'startDate', 'dueTurn', 'dueDate', 'durationTurns', 'remainingTurns', 'work', 'startSnapshot', 'rateInput', 'fees', 'completedTurn', 'completion']);
    jobId(job.id); literal(job.kind, 'development'); literal(job.facilityKind, 'forge'); literal(job.cityId, s.city.id); id(job.lotId); id(job.facilityId); literal(job.fromLevel, 0); literal(job.targetLevel, 1);
    officerIds(job.officerIds); const people = job.officerIds.map(oid => { const o = l.officers.find(o => o.id === oid); if (!o) stop('invariant-mismatch'); return o; });
    if (!same(job.politics, people.map(o => o.politics))) stop('invariant-mismatch');
    integer(job.startTurn, c.clock.turn, s.clock.turn); date(job.startDate); integer(job.dueTurn); date(job.dueDate); integer(job.durationTurns, 10, 1); integer(job.remainingTurns, 10);
    if (job.dueTurn !== job.startTurn + job.durationTurns || job.dueTurn > s.clock.turn + s.advanceLimit || !same(job.startDate, advanceDate(s.clock.date, job.startTurn - s.clock.turn)) || !same(job.dueDate, advanceDate(job.startDate, job.durationTurns))) stop('invariant-mismatch');
    object(job.work, ['initial', 'current', 'required', 'perAdvance', 'rate']); literal(job.work.initial, 200); literal(job.work.required, 800); integer(job.work.current, 800, 200); integer(job.work.perAdvance, 637, 66);
    const result = calculateConstructionDevelopment({ required: 800, politics: job.politics, initialWork: s.policy.base.construction.initialWork });
    if (!result.ok || result.initial !== 200 || result.required !== 800 || result.durationTurns !== job.durationTurns || !same(rateReceipt(result.rate, job.politics), job.work.rate) || job.work.perAdvance !== result.rate.rate) stop('invariant-mismatch');
    if (!same(job.rateInput, { profile: 'domestic-construction-rate-stable-v1', politics: job.politics, facilityDurability: 800 })) stop('invariant-mismatch');
    const lot = s.lots.find(lot => lot.id === job.lotId), facility = l.facilities[s.facilities.length];
    if (!lot || !facility || facility.id !== job.facilityId || facility.lotId !== job.lotId) stop('invariant-mismatch');
    const snapshot = startSnapshot(coreFacts(s), { date: job.startDate, turn: job.startTurn, advancedCount: job.startTurn - s.clock.turn }, lot, people);
    if (!same(job.startSnapshot, snapshot)) stop('invariant-mismatch'); object(job.fees, ['actionPoints', 'gold']);
    const ap = constructionWrite(job.fees.actionPoints), gold = constructionWrite(job.fees.gold);
    if (ap.requestedDelta !== -20 || ap.cap !== 255 || ap.policyId !== s.policy.base.construction.writer.id || gold.requestedDelta !== -300 || gold.cap !== MAX || gold.policyId !== s.policy.base.construction.writer.id) stop('invariant-mismatch');
    if (job.completedTurn === null) {
      literal(job.completion, null); if (job.remainingTurns < 1 || job.work.current >= 800 || c.clock.turn >= job.dueTurn || job.remainingTurns !== job.dueTurn - c.clock.turn ||
        job.work.current !== Math.min(800, 200 + (c.clock.turn - job.startTurn) * job.work.perAdvance) || facility.status !== 'developing' || facility.jobId !== job.id) stop('invariant-mismatch');
    } else {
      if (job.completedTurn !== job.dueTurn || job.completedTurn > c.clock.turn || job.remainingTurns !== 0 || job.work.current !== 800 || job.completion === null || facility.status !== 'complete' || facility.jobId !== null) stop('invariant-mismatch');
      const completion = job.completion;
      object(completion, ['jobId', 'facilityId', 'typeId', 'level', 'effectiveLevel', 'techniquePoints', 'rewards', 'releasedOfficerIds', 'policyId']);
      if (completion.jobId !== job.id || completion.facilityId !== job.facilityId || completion.typeId !== 34 || completion.level !== 1 || completion.effectiveLevel !== 1 || completion.policyId !== 'next-boundary-capped-work-v1' || !same(completion.releasedOfficerIds, job.officerIds)) stop('invariant-mismatch');
      const tp = constructionWrite(completion.techniquePoints); if (tp.requestedDelta !== 30 || tp.cap !== 10000 || tp.policyId !== s.policy.base.construction.writer.id) stop('invariant-mismatch');
      array(completion.rewards, people.length, people.length);
      for (let i = 0; i < people.length; i++) {
        const reward = completion.rewards[i]!, person = people[i]!; object(reward, ['officerId', 'politicsXp', 'merit', 'politicsBefore', 'politicsAfter']);
        if (reward.officerId !== person.id || reward.politicsBefore !== person.politics || reward.politicsAfter !== person.politics) stop('invariant-mismatch');
        const xp = constructionWrite(reward.politicsXp), merit = constructionWrite(reward.merit);
        if (xp.requestedDelta !== 3 || xp.cap !== MAX || xp.policyId !== s.policy.base.construction.rewards.id || merit.requestedDelta !== 100 || merit.cap !== MAX || merit.policyId !== s.policy.base.construction.rewards.id) stop('invariant-mismatch');
      }
    }
  }
  for (const o of l.officers) {
    const expected = job && job.completedTurn === null && job.officerIds.includes(o.id) ? job.id : null;
    if (o.reservationJobId !== expected) stop('invariant-mismatch');
  }
  for (const f of l.facilities) {
    const expected = job && job.completedTurn === null && job.facilityId === f.id ? job.id : null;
    if (f.jobId !== expected) stop('invariant-mismatch');
  }
  const governorId = s.monthlySpecialty.governorOfficerId;
  if (governorId !== null) {
    const initial = s.officers.find(o => o.id === governorId), governor = l.officers.find(o => o.id === governorId);
    if (!initial || !governor || governor.politics !== initial.politics || !Number.isSafeInteger(governor.politics)
      || Object.is(governor.politics, -0) || governor.politics < 0 || governor.politics > 100) stop('invariant-mismatch', 'invariant', { officerId: governorId });
  }
  object(s.monthlySpecialty, ['governorOfficerId', 'facilityLotSlots'], 'invariant-mismatch');
  const mapped = new Set<Id>();
  array(s.monthlySpecialty.facilityLotSlots, 30, 30, 'invariant-mismatch');
  for (const lotId of s.monthlySpecialty.facilityLotSlots) {
    if (lotId === null) continue;
    if (!s.lots.some(lot => lot.id === lotId) || mapped.has(lotId)) stop('invariant-mismatch');
    mapped.add(lotId);
  }
  if (mapped.size !== s.lots.length) stop('invariant-mismatch');
}

function rootInvariant(state: State): void {
  const s = state.genesis, c = state.current;
  if (state.revision !== state.acceptedCommands.length) stop('invariant-mismatch'); currentInvariant(s, c);
  if (64 - state.revision < reservedCompletionSlots(c)) stop('completion-history-slots');
  let starts = 0, productions = 0, advances = 0, completed = 0, expectedTp = s.force.initialTechniquePoints, expectedGold = s.city.initial.gold, expectedAp = s.corps.initialActionPoints;
  const expectedStocks = { 1: s.city.inventory[1].quantity, 2: s.city.inventory[2].quantity, 3: s.city.inventory[3].quantity, 4: s.city.inventory[4].quantity };
  const settlements = new Set<string>();
  const job = c.jobs[0];
  for (let i = 0; i < state.acceptedCommands.length; i++) {
    const entry = state.acceptedCommands[i]!, receipt = entry.receipt;
    if (receipt.revisionBefore !== i || receipt.revisionAfter !== i + 1 || entry.envelope.expectedRevision !== i || !same(entry.envelope, receipt.envelope)) stop('invariant-mismatch');
    if (receipt.kind === 'forge-start') {
      starts++; if (!job || job.id !== 'job:' + entry.envelope.id || receipt.detail.job.completedTurn !== null || receipt.detail.job.completion !== null || !same(receipt.detail.job.fees, job.fees)) stop('invariant-mismatch');
      if (receipt.detail.job.fees.actionPoints.before !== expectedAp || receipt.detail.job.fees.gold.before !== expectedGold) stop('invariant-mismatch');
      expectedAp = receipt.detail.job.fees.actionPoints.after; expectedGold = receipt.detail.job.fees.gold.after;
    } else if (receipt.kind === 'production') {
      productions++; if (receipt.detail.audit.fees.actionPoints.before !== expectedAp || receipt.detail.audit.fees.gold.before !== expectedGold) stop('invariant-mismatch');
      expectedAp = receipt.detail.audit.fees.actionPoints.after; expectedGold = receipt.detail.audit.fees.gold.after;
      const action = entry.envelope.command;
      if (action.type !== 'Produce') stop('invariant-mismatch');
      const equipmentType = action.equipmentType, write = receipt.detail.audit.calculation.inventoryWrite;
      const cap = s.city.inventory[equipmentType].capacity;
      integer(write.requested, 24400, 1000, 'invariant-mismatch');
      const accepted = Math.min(write.requested, cap - expectedStocks[equipmentType]);
      if (write.before !== expectedStocks[equipmentType] || write.cap !== cap || write.after !== write.before + accepted
        || write.returned !== accepted || write.actualDelta !== accepted || write.discarded !== write.requested - accepted
        || write.policyId !== 'clip-and-return-actual-v1') stop('invariant-mismatch');
      expectedStocks[equipmentType] = write.after;

    } else {
      advances++; if (receipt.detail.apRecovery.before !== expectedAp) stop('invariant-mismatch'); expectedAp = receipt.detail.apRecovery.after;
      for (const completion of receipt.detail.completions) {
        completed++; if (!job || !same(completion, job.completion) || completion.techniquePoints.before !== expectedTp) stop('invariant-mismatch'); expectedTp = completion.techniquePoints.after;
      }
      const monthly = receipt.detail.monthlySpecialty;
      object(monthly, ['status', 'settlement', 'governor', 'facilityIds', 'items'], 'invariant-mismatch');
      array(monthly.items, 3, 3, 'invariant-mismatch');
      if (receipt.clockAfter.date.day !== 1) {
        if (monthly.status !== 'not-due' || monthly.settlement !== null || monthly.governor !== null || monthly.facilityIds !== null) stop('invariant-mismatch');
      } else {
        const settlement = { cityId: s.city.id, year: receipt.clockAfter.date.year, month: receipt.clockAfter.date.month };
        if (!same(monthly.settlement, settlement)) stop('invariant-mismatch');
        const key = settlement.cityId + '/' + settlement.year + '/' + settlement.month;
        if (settlements.has(key)) stop('invariant-mismatch'); settlements.add(key);
        array(monthly.facilityIds, 30, 30, 'invariant-mismatch');
        const governorId = s.monthlySpecialty.governorOfficerId;
        if (governorId === null) {
          if (monthly.status !== 'no-governor' || monthly.governor !== null) stop('invariant-mismatch');
        } else {
          const governor = s.officers.find(o => o.id === governorId);
          if (!governor || monthly.status !== 'settled' || !same(monthly.governor, { officerId: governorId, politics: governor.politics })) stop('invariant-mismatch');
        }
      }
      for (const equipmentType of [1, 2, 3] as const) {
        const item = monthly.items[equipmentType - 1]; if (!item) stop('invariant-mismatch');
        object(item, ['equipmentType', 'arithmeticProfile', 'eligibility', 'count', 'kernelQuantityRequest', 'kernel', 'write'], 'invariant-mismatch');
        if (item.equipmentType !== equipmentType || item.arithmeticProfile !== 'comment-f32-rne-trunc-v1') stop('invariant-mismatch');
        if (monthly.status === 'not-due' || monthly.status === 'no-governor') {
          const eligibility = monthly.status;
          if (!same(item, { equipmentType, arithmeticProfile: 'comment-f32-rne-trunc-v1', eligibility, count: null, kernelQuantityRequest: null,
            kernel: { status: 'not-due', reason: eligibility === 'not-due' ? 'not-month-start' : 'no-governor' }, write: null })) stop('invariant-mismatch');
          continue;
        }
        if (item.eligibility === 'not-due' || item.eligibility === 'no-governor' || item.kernel.status !== 'called') stop('invariant-mismatch');
        if (item.kernel.result.path !== item.eligibility || !same(item.kernel.input, item.kernel.result.observations)) stop('invariant-mismatch');
        if (item.eligibility !== 'production') {
          if (item.write !== null || item.kernelQuantityRequest !== null || item.count !== (item.eligibility === 'not-specialty' ? null : 0)) stop('invariant-mismatch');
          continue;
        }
        if (item.kernel.result.path !== 'production' || item.count !== item.kernel.result.completedFacilityCount
          || item.kernelQuantityRequest !== item.kernel.result.quantityRequest.quantitySigned32
          || item.kernelQuantityRequest !== item.kernel.result.quantityRequest.quantityU32) stop('invariant-mismatch');
        const write = item.write, cap = s.city.inventory[equipmentType].capacity;
        object(write, ['resource', 'reason', 'before', 'requested', 'accepted', 'actualDelta', 'after', 'cap', 'discarded', 'writerPolicyId'], 'invariant-mismatch');
        integer(write.before, cap, 0, 'invariant-mismatch'); integer(write.requested, 495, 180, 'invariant-mismatch');
        integer(write.accepted, 495, 0, 'invariant-mismatch'); integer(write.actualDelta, 495, 0, 'invariant-mismatch');
        integer(write.after, cap, 0, 'invariant-mismatch'); integer(write.cap, 1_000_000, 0, 'invariant-mismatch'); integer(write.discarded, 495, 0, 'invariant-mismatch');
        const accepted = Math.min(write.requested, cap - expectedStocks[equipmentType]);
        if (write.resource !== `equipment-${equipmentType}` || write.reason !== 'specialty' || write.writerPolicyId !== 'saturating-positive-credit-v1'
          || write.before !== expectedStocks[equipmentType] || write.cap !== cap || write.requested !== item.kernelQuantityRequest
          || write.accepted !== accepted || write.actualDelta !== accepted || write.after !== write.before + accepted || write.discarded !== write.requested - accepted) stop('invariant-mismatch');
        expectedStocks[equipmentType] = write.after;
      }

    }
  }
  for (const equipmentType of EQUIPMENT) {
    if (c.ledger.inventory[equipmentType].quantity !== expectedStocks[equipmentType] || c.ledger.inventory[equipmentType].reserved !== 0) stop('invariant-mismatch');
  }
  if (settlements.size > 4) stop('invariant-mismatch');
  if (starts !== c.jobs.length || starts > 1 || advances !== c.clock.advancedCount || productions + starts > 24 || advances > 12 || state.revision > 36 ||
    completed !== (job && job.completedTurn !== null ? 1 : 0) || c.ledger.force.techniquePoints !== expectedTp || c.ledger.gold !== expectedGold || c.ledger.actionPoints !== expectedAp) stop('invariant-mismatch');
}
function inspected(state: State): Exclude<InspectResult, Failure> {
  return { ok: true, revision: state.revision, current: state.current, remainingHistorySlots: 64 - state.revision,
    remainingAdvances: state.genesis.advanceLimit - state.current.clock.advancedCount, reservedCompletionSlots: reservedCompletionSlots(state.current), scope: 'bounded-shared-forge-monthly-production' };
}
function serialized(state: State): string { const save: SaveEnvelope = { tag: SAVE_TAG, state }; return canonicalBoundedForgeMonthlyJson(save); }
function previewed(result: Exclude<ExecuteResult, Failure>, baseRevision: number): Exclude<PreviewResult, Failure> {
  return { ok: true, committed: false, duplicate: result.duplicate, baseRevision, projectedCurrent: result.state.current, receipt: result.receipt };
}
/** Every package is independent; aliases are counted per occurrence by the safe budget walker. */
function fitRoot(state: State, latest?: Receipt): void {
  budget(state); budget({ ok: true, state }); budget(inspected(state)); budget({ tag: SAVE_TAG, state }); budget({ ok: true, serialized: serialized(state) });
  if (latest) {
    const result: Exclude<ExecuteResult, Failure> = { ok: true, committed: true, duplicate: false, state, receipt: latest };
    budget(result); budget(previewed(result, latest.revisionBefore));
  }
  // Every old receipt, including a full month-start receipt, must fit with the latest state.
  for (const entry of state.acceptedCommands) {
    const duplicate: Exclude<ExecuteResult, Failure> = { ok: true, committed: false, duplicate: true, state, receipt: entry.receipt };
    budget(duplicate); budget(previewed(duplicate, state.revision));
  }
}
function transition(state: State, outer: OuterEnvelope): Exclude<ExecuteResult, Failure> {
  const old = state.acceptedCommands.find(entry => entry.envelope.id === outer.id);
  if (old) {
    if (!same(old.envelope, outer)) stop('command-id-conflict', 'deduplication');
    fitRoot(state); return { ok: true, committed: false, duplicate: true, state, receipt: old.receipt };
  }
  if (outer.expectedRevision !== state.revision) stop('stale-revision', 'revision');
  if (state.revision >= 64) stop('history-limit', 'revision');
  const parsed = atStage('domain', () => command(outer.command)), e: Envelope = { id: outer.id, expectedRevision: outer.expectedRevision, command: parsed };
  const current = clone(state.current);
  let branch: { kind: 'forge-start'; detail: StartDetail } | { kind: 'production'; detail: { audit: ProductionAudit } } | { kind: 'tick'; detail: TickDetail };
  if (parsed.type === 'StartForgeDevelopment') branch = { kind: 'forge-start', detail: atStage('construction', () => startForge({ genesis: coreFacts(state.genesis), revision: state.revision }, current, e, parsed)) };
  else if (parsed.type === 'Produce') branch = { kind: 'production', detail: atStage('domestic', () => produce(coreFacts(state.genesis), current, parsed, e.id)) };
  else branch = { kind: 'tick', detail: atStage('tick', () => {
    const core = advanceShared(coreFacts(state.genesis), current);
    const monthlySpecialty = applyForgeMonthlySpecialty(state.genesis, current);
    return { apRecovery: core.apRecovery, progress: core.progress, completions: core.completions, monthlySpecialty };
  }) };
  atStage('invariant', () => currentInvariant(state.genesis, current));
  if (64 - (state.revision + 1) < reservedCompletionSlots(current)) stop('completion-history-slots', 'invariant');
  const s = state.genesis;
  const common: ReceiptCommon = { envelope: clone(e), revisionBefore: state.revision, revisionAfter: state.revision + 1,
    policyDigest: digest(s.policy), catalogDigests: { production: digest(s.productionCatalog), construction: digest(s.constructionCatalog) },
    clockBefore: clone(state.current.clock), clockAfter: clone(current.clock), currentDigestBefore: digest(state.current), currentDigestAfter: digest(current),
    ownerSnapshot: { activeForceId: s.activeForceId, ownerForceId: s.city.ownerForceId, corpsId: s.corps.id, corpsForceId: s.corps.forceId },
    scope: 'bounded-shared-forge-monthly-production', rngDraws: 0, techniquePointScope: 'genesis-plus-construction-completion-only', ordinaryTechniquePoints: 'not-modeled', nativeIntegration: false };
  const receipt: Receipt = { ...common, ...branch };
  const next: State = { tag: STATE_TAG, schemaVersion: 1, profile: PROFILE, genesis: s, revision: state.revision + 1, current,
    acceptedCommands: [...state.acceptedCommands, { envelope: clone(e), receipt }] };
  atStage('invariant', () => rootInvariant(next)); fitRoot(next, receipt); return { ok: true, committed: true, duplicate: false, state: next, receipt };
}
/** Only this full, private fold creates a trusted root; no public token or mutable cache exists. */
function rebuild(value: unknown): State {
  return atStage('rebuild', () => {
    const raw = object(value, ['tag', 'schemaVersion', 'profile', 'genesis', 'revision', 'current', 'acceptedCommands']);
    literal(raw.tag, STATE_TAG, 'unsupported-schema'); literal(raw.schemaVersion, 1, 'unsupported-schema'); literal(raw.profile, PROFILE, 'unsupported-profile');
    const genesis = scenario(raw.genesis), revision = integer(raw.revision, 64), entries = array(raw.acceptedCommands, 64);
    if (revision !== entries.length) stop('history-recomputation-mismatch');
    let state = initialState(genesis); rootInvariant(state); fitRoot(state); const ids = new Set<Id>();
    for (const value of entries) {
      const entry = object(value, ['envelope', 'receipt']), e = envelope(entry.envelope);
      if (ids.has(e.id)) stop('duplicate-accepted-entry'); ids.add(e.id);
      let result: Exclude<ExecuteResult, Failure>;
      try { result = transition(state, e); } catch (error) { const f = caught(error); if (f.stage === 'budget') throw error; stop('history-recomputation-mismatch', 'rebuild', f); }
      if (result.duplicate) stop('duplicate-accepted-entry');
      if (!same(entry.receipt, result.receipt)) stop('receipt-recomputation-mismatch'); state = result.state;
    }
    if (!same(raw, state)) stop('state-recomputation-mismatch'); return state;
  });
}

export function createBoundedForgeMonthlyProductionV1(input: BoundedForgeMonthlyProductionScenarioV1): BoundedForgeMonthlyProductionCreateOrLoadResultV1 {
  try { const state = initialState(scenario(detach(input))); rootInvariant(state); fitRoot(state); return freeze({ ok: true, state } as const); } catch (error) { return freeze(caught(error)); }
}
export function inspectBoundedForgeMonthlyProductionV1(input: BoundedForgeMonthlyProductionStateV1): BoundedForgeMonthlyProductionInspectResultV1 {
  try { const state = rebuild(detach(input)); return freeze(inspected(state)); } catch (error) { return freeze(caught(error)); }
}
export function previewBoundedForgeMonthlyProductionV1(input: BoundedForgeMonthlyProductionStateV1, inputEnvelope: BoundedForgeMonthlyProductionEnvelopeV1): BoundedForgeMonthlyProductionPreviewResultV1 {
  try { const stateData = detach(input), envelopeData = detach(inputEnvelope), state = rebuild(stateData); return freeze(previewed(transition(state, envelope(envelopeData)), state.revision)); } catch (error) { return freeze(caught(error)); }
}
export function executeBoundedForgeMonthlyProductionV1(input: BoundedForgeMonthlyProductionStateV1, inputEnvelope: BoundedForgeMonthlyProductionEnvelopeV1): BoundedForgeMonthlyProductionExecuteResultV1 {
  try { const stateData = detach(input), envelopeData = detach(inputEnvelope), state = rebuild(stateData); return freeze(transition(state, envelope(envelopeData))); } catch (error) { return freeze(caught(error)); }
}
export function saveBoundedForgeMonthlyProductionV1(input: BoundedForgeMonthlyProductionStateV1): BoundedForgeMonthlyProductionSaveResultV1 {
  try { const state = rebuild(detach(input)), result = { ok: true, serialized: serialized(state) } as const; budget(result); return freeze(result); } catch (error) { return freeze(caught(error)); }
}
export function loadBoundedForgeMonthlyProductionV1(input: string): BoundedForgeMonthlyProductionCreateOrLoadResultV1 {
  try {
    const decoded = decodeBoundedForgeMonthlyJson(input); if (!decoded.ok) stop(decoded.reason, decoded.reason === 'budget-exceeded' ? 'budget' : 'input');
    const save = object(decoded.value, ['tag', 'state']); literal(save.tag, SAVE_TAG, 'unsupported-schema'); const state = rebuild(save.state), result = { ok: true, state } as const; budget(result); return freeze(result);
  } catch (error) { return freeze(caught(error)); }
}
export function replayBoundedForgeMonthlyProductionV1(input: BoundedForgeMonthlyProductionTraceV1): BoundedForgeMonthlyProductionReplayResultV1 {
  let index: number | null = null;
  try {
    const trace = object(detach(input), ['tag', 'scenario', 'attempts', 'expectedFinalState']); literal(trace.tag, TRACE_TAG, 'unsupported-schema');
    const genesis = scenario(trace.scenario), attempts = array(trace.attempts, 128);
    for (const value of attempts) object(value, ['envelope', 'expected']);
    let state = initialState(genesis); rootInvariant(state); fitRoot(state); const outcomes: ReplayOutcome[] = [];
    for (let i = 0; i < attempts.length; i++) {
      index = i; const attempt = attempts[i] as { envelope: unknown; expected: unknown }; let outcome: ReplayOutcome;
      try { const result = transition(state, envelope(attempt.envelope)); state = result.state; outcome = { ok: true, duplicate: result.duplicate, receipt: result.receipt }; }
      catch (error) { outcome = caught(error); }
      if (attempt.expected !== null && !same(attempt.expected, outcome)) stop('trace-outcome-mismatch', 'comparison'); outcomes.push(outcome);
      try { budget({ ok: true, state, outcomes }); } catch (error) { index = null; throw error; }
    }
    index = null; if (trace.expectedFinalState !== null && !same(trace.expectedFinalState, state)) stop('trace-final-mismatch', 'comparison');
    const result = { ok: true, state, outcomes } as const; budget(result); return freeze(result);
  } catch (error) { const f = caught(error); return freeze({ ...f, index: f.stage === 'budget' ? null : index, state: null } as const); }
}
