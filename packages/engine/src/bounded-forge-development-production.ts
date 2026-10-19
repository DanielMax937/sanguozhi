/** A bounded, single-city forge lifecycle owner. All trust comes from full genesis folding.
 * Construction and ordinary production share one ledger and one clock; no legacy public owner is called. */
import { ROOT_POLICY, CONSTRUCTION_CATALOG } from './internal/bounded-forge-development-production-registry.ts';
import { boundedForgeJsonFits, canonicalBoundedForgeJson, decodeBoundedForgeJson, detachBoundedForgeData } from './internal/bounded-forge-development-production-json.ts';
import { calculateConstructionDevelopment } from './internal/facility-construction-leaves.ts';
import { rateReceipt, constructionWrite, produce, startSnapshot, startForge, advanceShared } from './internal/bounded-forge-core.ts';
import { stop, caught } from './internal/bounded-forge-core-errors.ts';
import { clone, same, digest, record, object, integer, literal, choice, jobId, array, advanceDate } from './internal/bounded-forge-core-data.ts';
import type { DeepReadonly, ConstructionPolicy, ConstructionCatalog, Id, JobId, Digest, Marker, Equipment, ProduceEquipment, DateV1, Position, Clock, Progress, OfficerFacts, Lot, ExistingForge, Unit, ProductionCatalog, Scenario, Policy, DomesticPolicies, RateInput, RateEvidence, RateReceipt, ConstructionWrite, ConstructionWritePolicyId, DomesticWrite, OfficerRow, FacilityRow, Ledger, ConstructionReward, Completion, StartSnapshot, ConstructionFees, Work, Job, Current, PriceInput, PriceOutput, QuantitySlot, QuantityInput, QuantityOutput, Kernels, ProductionCalculation, DomesticFees, DomesticReward, ProductionAudit, StartCommand, ProduceCommand, AdvanceCommand, Command, Envelope, UnitCheck, StartReservations, StartDetail, ProgressAudit, TickDetail, ReceiptCommon, Receipt, State, Stage, Reason, Failure, CreateOrLoadResult, InspectResult, ExecuteResult, PreviewResult, SaveEnvelope, SaveResult, ReplayOutcome, Trace, ReplayResult } from './internal/bounded-forge-development-production-types.ts';

export type BoundedForgeDevelopmentProductionConstructionPolicyV1 = DeepReadonly<ConstructionPolicy>;
export type BoundedForgeDevelopmentProductionConstructionCatalogV1 = DeepReadonly<ConstructionCatalog>;
export type BoundedForgeDevelopmentProductionIdV1 = DeepReadonly<Id>;
export type BoundedForgeDevelopmentProductionJobIdV1 = DeepReadonly<JobId>;
export type BoundedForgeDevelopmentProductionDigestV1 = DeepReadonly<Digest>;
export type BoundedForgeDevelopmentProductionMarkerV1 = DeepReadonly<Marker>;
export type BoundedForgeDevelopmentProductionEquipmentV1 = DeepReadonly<Equipment>;
export type BoundedForgeDevelopmentProductionProduceEquipmentV1 = DeepReadonly<ProduceEquipment>;
export type BoundedForgeDevelopmentProductionDateV1 = DeepReadonly<DateV1>;
export type BoundedForgeDevelopmentProductionPositionV1 = DeepReadonly<Position>;
export type BoundedForgeDevelopmentProductionClockV1 = DeepReadonly<Clock>;
export type BoundedForgeDevelopmentProductionProgressV1 = DeepReadonly<Progress>;
export type BoundedForgeDevelopmentProductionOfficerFactsV1 = DeepReadonly<OfficerFacts>;
export type BoundedForgeDevelopmentProductionLotV1 = DeepReadonly<Lot>;
export type BoundedForgeDevelopmentProductionExistingForgeV1 = DeepReadonly<ExistingForge>;
export type BoundedForgeDevelopmentProductionUnitV1 = DeepReadonly<Unit>;
export type BoundedForgeDevelopmentProductionProductionCatalogV1 = DeepReadonly<ProductionCatalog>;
export type BoundedForgeDevelopmentProductionScenarioV1 = DeepReadonly<Scenario>;
export type BoundedForgeDevelopmentProductionPolicyV1 = DeepReadonly<Policy>;
export type BoundedForgeDevelopmentProductionDomesticPoliciesV1 = DeepReadonly<DomesticPolicies>;
export type BoundedForgeDevelopmentProductionRateInputV1 = DeepReadonly<RateInput>;
export type BoundedForgeDevelopmentProductionRateEvidenceV1 = DeepReadonly<RateEvidence>;
export type BoundedForgeDevelopmentProductionRateReceiptV1 = DeepReadonly<RateReceipt>;
export type BoundedForgeDevelopmentProductionConstructionWriteV1 = DeepReadonly<ConstructionWrite>;
export type BoundedForgeDevelopmentProductionConstructionWritePolicyIdV1 = DeepReadonly<ConstructionWritePolicyId>;
export type BoundedForgeDevelopmentProductionDomesticWriteV1 = DeepReadonly<DomesticWrite>;
export type BoundedForgeDevelopmentProductionOfficerRowV1 = DeepReadonly<OfficerRow>;
export type BoundedForgeDevelopmentProductionFacilityRowV1 = DeepReadonly<FacilityRow>;
export type BoundedForgeDevelopmentProductionLedgerV1 = DeepReadonly<Ledger>;
export type BoundedForgeDevelopmentProductionConstructionRewardV1 = DeepReadonly<ConstructionReward>;
export type BoundedForgeDevelopmentProductionCompletionV1 = DeepReadonly<Completion>;
export type BoundedForgeDevelopmentProductionStartSnapshotV1 = DeepReadonly<StartSnapshot>;
export type BoundedForgeDevelopmentProductionConstructionFeesV1 = DeepReadonly<ConstructionFees>;
export type BoundedForgeDevelopmentProductionWorkV1 = DeepReadonly<Work>;
export type BoundedForgeDevelopmentProductionJobV1 = DeepReadonly<Job>;
export type BoundedForgeDevelopmentProductionCurrentV1 = DeepReadonly<Current>;
export type BoundedForgeDevelopmentProductionPriceInputV1 = DeepReadonly<PriceInput>;
export type BoundedForgeDevelopmentProductionPriceOutputV1 = DeepReadonly<PriceOutput>;
export type BoundedForgeDevelopmentProductionQuantitySlotV1 = DeepReadonly<QuantitySlot>;
export type BoundedForgeDevelopmentProductionQuantityInputV1 = DeepReadonly<QuantityInput>;
export type BoundedForgeDevelopmentProductionQuantityOutputV1 = DeepReadonly<QuantityOutput>;
export type BoundedForgeDevelopmentProductionKernelsV1 = DeepReadonly<Kernels>;
export type BoundedForgeDevelopmentProductionProductionCalculationV1 = DeepReadonly<ProductionCalculation>;
export type BoundedForgeDevelopmentProductionDomesticFeesV1 = DeepReadonly<DomesticFees>;
export type BoundedForgeDevelopmentProductionDomesticRewardV1 = DeepReadonly<DomesticReward>;
export type BoundedForgeDevelopmentProductionProductionAuditV1 = DeepReadonly<ProductionAudit>;
export type BoundedForgeDevelopmentProductionStartCommandV1 = DeepReadonly<StartCommand>;
export type BoundedForgeDevelopmentProductionProduceCommandV1 = DeepReadonly<ProduceCommand>;
export type BoundedForgeDevelopmentProductionAdvanceCommandV1 = DeepReadonly<AdvanceCommand>;
export type BoundedForgeDevelopmentProductionCommandV1 = DeepReadonly<Command>;
export type BoundedForgeDevelopmentProductionEnvelopeV1 = DeepReadonly<Envelope>;
export type BoundedForgeDevelopmentProductionUnitCheckV1 = DeepReadonly<UnitCheck>;
export type BoundedForgeDevelopmentProductionStartReservationsV1 = DeepReadonly<StartReservations>;
export type BoundedForgeDevelopmentProductionStartDetailV1 = DeepReadonly<StartDetail>;
export type BoundedForgeDevelopmentProductionProgressAuditV1 = DeepReadonly<ProgressAudit>;
export type BoundedForgeDevelopmentProductionTickDetailV1 = DeepReadonly<TickDetail>;
export type BoundedForgeDevelopmentProductionReceiptCommonV1 = DeepReadonly<ReceiptCommon>;
export type BoundedForgeDevelopmentProductionReceiptV1 = DeepReadonly<Receipt>;
export type BoundedForgeDevelopmentProductionStateV1 = DeepReadonly<State>;
export type BoundedForgeDevelopmentProductionStageV1 = DeepReadonly<Stage>;
export type BoundedForgeDevelopmentProductionReasonV1 = DeepReadonly<Reason>;
export type BoundedForgeDevelopmentProductionFailureV1 = DeepReadonly<Failure>;
export type BoundedForgeDevelopmentProductionCreateOrLoadResultV1 = DeepReadonly<CreateOrLoadResult>;
export type BoundedForgeDevelopmentProductionInspectResultV1 = DeepReadonly<InspectResult>;
export type BoundedForgeDevelopmentProductionExecuteResultV1 = DeepReadonly<ExecuteResult>;
export type BoundedForgeDevelopmentProductionPreviewResultV1 = DeepReadonly<PreviewResult>;
export type BoundedForgeDevelopmentProductionSaveEnvelopeV1 = DeepReadonly<SaveEnvelope>;
export type BoundedForgeDevelopmentProductionSaveResultV1 = DeepReadonly<SaveResult>;
export type BoundedForgeDevelopmentProductionReplayOutcomeV1 = DeepReadonly<ReplayOutcome>;
export type BoundedForgeDevelopmentProductionTraceV1 = DeepReadonly<Trace>;
export type BoundedForgeDevelopmentProductionReplayResultV1 = DeepReadonly<ReplayResult>;

const PROFILE = 'bounded-forge-development-production-v1';
const STATE_TAG = 'san11-bounded-forge-development-production-state-v1';
const SAVE_TAG = 'san11-bounded-forge-development-production-save-v1';
const TRACE_TAG = 'san11-bounded-forge-development-production-trace-v1';
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
function detach(value: unknown): unknown {
  const result = detachBoundedForgeData(value); if (!result.ok) stop(result.reason, result.reason === 'budget-exceeded' ? 'budget' : 'input'); return result.value;
}
function budget(value: unknown): void { if (!boundedForgeJsonFits(value)) stop('budget-exceeded', 'budget'); }
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
export const BOUNDED_FORGE_DEVELOPMENT_PRODUCTION_POLICY: BoundedForgeDevelopmentProductionPolicyV1 = freeze(clone(ROOT_POLICY));
function scenario(value: unknown): Scenario {
  const s = object(value, ['schemaVersion', 'profile', 'episodeId', 'clock', 'advanceLimit', 'activeForceId', 'force', 'corps', 'city', 'officers', 'lots', 'facilities', 'domestic', 'constructionEnvironment', 'productionCatalog', 'constructionCatalog', 'policy']);
  literal(s.schemaVersion, 1, 'unsupported-schema'); literal(s.profile, PROFILE, 'unsupported-profile'); id(s.episodeId);
  const clock = object(s.clock, ['date', 'turn']), initialDate = date(clock.date), turn = integer(clock.turn);
  const limit = integer(s.advanceLimit, 12, 1); integer(turn + limit); advanceDate(initialDate, limit);
  const forceId = id(s.activeForceId), force = object(s.force, ['id', 'initialTechniquePoints']); id(force.id); integer(force.initialTechniquePoints, 10000);
  const corps = object(s.corps, ['id', 'forceId', 'initialActionPoints']); id(corps.id); id(corps.forceId); integer(corps.initialActionPoints, 255);
  const city = object(s.city, ['id', 'kind', 'ownerForceId', 'position', 'goldCapacity', 'troopCapacity', 'moraleCap', 'initial', 'inventory']);
  const cityId = id(city.id); literal(city.kind, 'city', 'unsupported-city-kind'); id(city.ownerForceId); const center = position(city.position);
  literal(city.goldCapacity, MAX, 'invalid-number'); const troopCap = integer(city.troopCapacity, 1_000_000), moraleCap = integer(city.moraleCap, 255, 20);
  const initial = object(city.initial, ['gold', 'security', 'troops', 'morale', 'patrolUsedTurn']); integer(initial.gold, MAX); integer(initial.security, 100); integer(initial.troops, troopCap); integer(initial.morale, moraleCap); marker(initial.patrolUsedTurn, turn);
  const inventory = object(city.inventory, ['1', '2', '3', '4']);
  for (const type of EQUIPMENT) { const slot = object(inventory[type], ['quantity', 'capacity']); integer(slot.quantity, 1_000_000); const cap = integer(slot.capacity, 1_000_000); integer(slot.quantity, cap); }
  if (force.id !== forceId || corps.forceId !== forceId || city.ownerForceId !== forceId) stop('owner-corps-mismatch');
  const officers = array(s.officers, 8, 1).map(value => {
    const o = object(value, ['id', 'forceId', 'cityId', 'available', 'leadership', 'charm', 'intelligence', 'politics', 'skillIds', 'initial']);
    id(o.id); id(o.forceId); id(o.cityId); boolean(o.available);
    for (const stat of ['leadership', 'charm', 'intelligence', 'politics']) integer(o[stat], 255);
    const skills = array(o.skillIds, 3).map(v => choice(v, [79, 80, 81], 'unsupported-skill')); unique(skills); progress(o.initial, turn);
    if (o.forceId !== forceId || o.cityId !== cityId) stop('officer-city-force-mismatch'); return o;
  }); unique(officers.map(o => o.id));
  const lots = array(s.lots, 2, 1).map(value => {
    const lot = object(value, ['id', 'cityId', 'position']); id(lot.id); id(lot.cityId); position(lot.position); return lot;
  }); unique(lots.map(lot => lot.id));
  const facilities = array(s.facilities, 1).map(value => {
    const f = object(value, ['id', 'lotId', 'cityId', 'kind', 'level', 'complete', 'initialUsedTurn']);
    id(f.id); id(f.lotId); id(f.cityId); literal(f.kind, 'forge', 'wrong-facility-kind'); literal(f.level, 1, 'unsupported-external-state'); literal(f.complete, true, 'unsupported-external-state'); marker(f.initialUsedTurn, turn); return f;
  }); unique(facilities.map(f => f.id));
  if (lots.length !== facilities.length + 1) stop('invalid-lot-layout');
  unique(lots.map(lot => canonicalBoundedForgeJson(lot.position)), 'invalid-lot-layout');
  for (const lot of lots) if (lot.cityId !== cityId || same(lot.position, center)) stop('invalid-lot-layout');
  unique(facilities.map(f => f.lotId), 'invalid-lot-layout');
  for (const f of facilities) if (f.cityId !== cityId || !lots.some(lot => lot.id === f.lotId)) stop('invalid-lot-layout');
  const domestic = object(s.domestic, ['pressureActive', 'difficulty', 'controller', 'unlockedEquipmentTypes', 'specialtyEquipmentTypes']); boolean(domestic.pressureActive); choice(domestic.difficulty, ['normal', 'super']); choice(domestic.controller, ['player', 'ai']);
  for (const key of ['unlockedEquipmentTypes', 'specialtyEquipmentTypes']) { const values = array(domestic[key], 4).map(v => choice(v, EQUIPMENT, 'unsupported-equipment')); unique(values); }
  const environment = object(s.constructionEnvironment, ['completeFieldUnits', 'hostileForceIds', 'fieldUnits']); literal(environment.completeFieldUnits, true, 'incomplete-field-unit-snapshot');
  const hostiles = array(environment.hostileForceIds, 16).map(id); unique(hostiles); if (hostiles.includes(forceId)) stop('owner-marked-hostile');
  const units = array(environment.fieldUnits, 16).map(value => { const unit = object(value, ['id', 'forceId', 'position']); id(unit.id); id(unit.forceId); position(unit.position); return unit; }); unique(units.map(u => u.id));
  const catalog = object(s.productionCatalog, ['id', 'version', 'entries']); id(catalog.id); literal(catalog.version, 1, 'unsupported-catalog'); const entries = object(catalog.entries, ['1', '2', '3', '4']);
  for (const type of EQUIPMENT) { const entry = object(entries[type], ['basePriceWord']); integer(entry.basePriceWord, 65535); }
  if (!same(s.constructionCatalog, CONSTRUCTION_CATALOG)) stop('unsupported-catalog');
  if (!same(s.policy, ROOT_POLICY)) stop('unsupported-policy');
  // Every field above was checked on detached data, including the complete registry values.
  return s as unknown as Scenario;
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
    const result = calculateConstructionDevelopment({ required: 800, politics: job.politics, initialWork: s.policy.construction.initialWork });
    if (!result.ok || result.initial !== 200 || result.required !== 800 || result.durationTurns !== job.durationTurns || !same(rateReceipt(result.rate, job.politics), job.work.rate) || job.work.perAdvance !== result.rate.rate) stop('invariant-mismatch');
    if (!same(job.rateInput, { profile: 'domestic-construction-rate-stable-v1', politics: job.politics, facilityDurability: 800 })) stop('invariant-mismatch');
    const lot = s.lots.find(lot => lot.id === job.lotId), facility = l.facilities[s.facilities.length];
    if (!lot || !facility || facility.id !== job.facilityId || facility.lotId !== job.lotId) stop('invariant-mismatch');
    const snapshot = startSnapshot(s, { date: job.startDate, turn: job.startTurn, advancedCount: job.startTurn - s.clock.turn }, lot, people);
    if (!same(job.startSnapshot, snapshot)) stop('invariant-mismatch'); object(job.fees, ['actionPoints', 'gold']);
    const ap = constructionWrite(job.fees.actionPoints), gold = constructionWrite(job.fees.gold);
    if (ap.requestedDelta !== -20 || ap.cap !== 255 || ap.policyId !== s.policy.construction.writer.id || gold.requestedDelta !== -300 || gold.cap !== MAX || gold.policyId !== s.policy.construction.writer.id) stop('invariant-mismatch');
    if (job.completedTurn === null) {
      literal(job.completion, null); if (job.remainingTurns < 1 || job.work.current >= 800 || c.clock.turn >= job.dueTurn || job.remainingTurns !== job.dueTurn - c.clock.turn ||
        job.work.current !== Math.min(800, 200 + (c.clock.turn - job.startTurn) * job.work.perAdvance) || facility.status !== 'developing' || facility.jobId !== job.id) stop('invariant-mismatch');
    } else {
      if (job.completedTurn !== job.dueTurn || job.completedTurn > c.clock.turn || job.remainingTurns !== 0 || job.work.current !== 800 || job.completion === null || facility.status !== 'complete' || facility.jobId !== null) stop('invariant-mismatch');
      const completion = job.completion;
      object(completion, ['jobId', 'facilityId', 'typeId', 'level', 'effectiveLevel', 'techniquePoints', 'rewards', 'releasedOfficerIds', 'policyId']);
      if (completion.jobId !== job.id || completion.facilityId !== job.facilityId || completion.typeId !== 34 || completion.level !== 1 || completion.effectiveLevel !== 1 || completion.policyId !== 'next-boundary-capped-work-v1' || !same(completion.releasedOfficerIds, job.officerIds)) stop('invariant-mismatch');
      const tp = constructionWrite(completion.techniquePoints); if (tp.requestedDelta !== 30 || tp.cap !== 10000 || tp.policyId !== s.policy.construction.writer.id) stop('invariant-mismatch');
      array(completion.rewards, people.length, people.length);
      for (let i = 0; i < people.length; i++) {
        const reward = completion.rewards[i]!, person = people[i]!; object(reward, ['officerId', 'politicsXp', 'merit', 'politicsBefore', 'politicsAfter']);
        if (reward.officerId !== person.id || reward.politicsBefore !== person.politics || reward.politicsAfter !== person.politics) stop('invariant-mismatch');
        const xp = constructionWrite(reward.politicsXp), merit = constructionWrite(reward.merit);
        if (xp.requestedDelta !== 3 || xp.cap !== MAX || xp.policyId !== s.policy.construction.rewards.id || merit.requestedDelta !== 100 || merit.cap !== MAX || merit.policyId !== s.policy.construction.rewards.id) stop('invariant-mismatch');
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
}
function rootInvariant(state: State): void {
  const s = state.genesis, c = state.current;
  if (state.revision !== state.acceptedCommands.length) stop('invariant-mismatch'); currentInvariant(s, c);
  if (64 - state.revision < reservedCompletionSlots(c)) stop('completion-history-slots');
  let starts = 0, productions = 0, advances = 0, completed = 0, expectedTp = s.force.initialTechniquePoints, expectedGold = s.city.initial.gold, expectedAp = s.corps.initialActionPoints;
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
    } else {
      advances++; if (receipt.detail.apRecovery.before !== expectedAp) stop('invariant-mismatch'); expectedAp = receipt.detail.apRecovery.after;
      for (const completion of receipt.detail.completions) {
        completed++; if (!job || !same(completion, job.completion) || completion.techniquePoints.before !== expectedTp) stop('invariant-mismatch'); expectedTp = completion.techniquePoints.after;
      }
    }
  }
  if (starts !== c.jobs.length || starts > 1 || advances !== c.clock.advancedCount || productions + starts > 24 || advances > 12 || state.revision > 36 ||
    completed !== (job && job.completedTurn !== null ? 1 : 0) || c.ledger.force.techniquePoints !== expectedTp || c.ledger.gold !== expectedGold || c.ledger.actionPoints !== expectedAp) stop('invariant-mismatch');
}
function inspected(state: State): Exclude<InspectResult, Failure> {
  return { ok: true, revision: state.revision, current: state.current, remainingHistorySlots: 64 - state.revision,
    remainingAdvances: state.genesis.advanceLimit - state.current.clock.advancedCount, reservedCompletionSlots: reservedCompletionSlots(state.current), scope: 'bounded-shared-forge-development-production' };
}
function serialized(state: State): string { const save: SaveEnvelope = { tag: SAVE_TAG, state }; return canonicalBoundedForgeJson(save); }
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
  // A completed state must still fit with the largest immutable old Start receipt, not only its latest tick.
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
  if (parsed.type === 'StartForgeDevelopment') branch = { kind: 'forge-start', detail: atStage('construction', () => startForge({ genesis: state.genesis, revision: state.revision }, current, e, parsed)) };
  else if (parsed.type === 'Produce') branch = { kind: 'production', detail: atStage('domestic', () => produce(state.genesis, current, parsed, e.id)) };
  else branch = { kind: 'tick', detail: atStage('tick', () => advanceShared(state.genesis, current)) };
  atStage('invariant', () => currentInvariant(state.genesis, current));
  if (64 - (state.revision + 1) < reservedCompletionSlots(current)) stop('completion-history-slots', 'invariant');
  const s = state.genesis;
  const common: ReceiptCommon = { envelope: clone(e), revisionBefore: state.revision, revisionAfter: state.revision + 1,
    policyDigest: digest(s.policy), catalogDigests: { production: digest(s.productionCatalog), construction: digest(s.constructionCatalog) },
    clockBefore: clone(state.current.clock), clockAfter: clone(current.clock), currentDigestBefore: digest(state.current), currentDigestAfter: digest(current),
    ownerSnapshot: { activeForceId: s.activeForceId, ownerForceId: s.city.ownerForceId, corpsId: s.corps.id, corpsForceId: s.corps.forceId },
    scope: 'bounded-shared-forge-development-production', rngDraws: 0, techniquePointScope: 'genesis-plus-construction-completion-only', ordinaryTechniquePoints: 'not-modeled', nativeIntegration: false };
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

export function createBoundedForgeDevelopmentProductionV1(input: BoundedForgeDevelopmentProductionScenarioV1): BoundedForgeDevelopmentProductionCreateOrLoadResultV1 {
  try { const state = initialState(scenario(detach(input))); rootInvariant(state); fitRoot(state); return freeze({ ok: true, state } as const); } catch (error) { return freeze(caught(error)); }
}
export function inspectBoundedForgeDevelopmentProductionV1(input: BoundedForgeDevelopmentProductionStateV1): BoundedForgeDevelopmentProductionInspectResultV1 {
  try { const state = rebuild(detach(input)); return freeze(inspected(state)); } catch (error) { return freeze(caught(error)); }
}
export function previewBoundedForgeDevelopmentProductionV1(input: BoundedForgeDevelopmentProductionStateV1, inputEnvelope: BoundedForgeDevelopmentProductionEnvelopeV1): BoundedForgeDevelopmentProductionPreviewResultV1 {
  try { const stateData = detach(input), envelopeData = detach(inputEnvelope), state = rebuild(stateData); return freeze(previewed(transition(state, envelope(envelopeData)), state.revision)); } catch (error) { return freeze(caught(error)); }
}
export function executeBoundedForgeDevelopmentProductionV1(input: BoundedForgeDevelopmentProductionStateV1, inputEnvelope: BoundedForgeDevelopmentProductionEnvelopeV1): BoundedForgeDevelopmentProductionExecuteResultV1 {
  try { const stateData = detach(input), envelopeData = detach(inputEnvelope), state = rebuild(stateData); return freeze(transition(state, envelope(envelopeData))); } catch (error) { return freeze(caught(error)); }
}
export function saveBoundedForgeDevelopmentProductionV1(input: BoundedForgeDevelopmentProductionStateV1): BoundedForgeDevelopmentProductionSaveResultV1 {
  try { const state = rebuild(detach(input)), result = { ok: true, serialized: serialized(state) } as const; budget(result); return freeze(result); } catch (error) { return freeze(caught(error)); }
}
export function loadBoundedForgeDevelopmentProductionV1(input: string): BoundedForgeDevelopmentProductionCreateOrLoadResultV1 {
  try {
    const decoded = decodeBoundedForgeJson(input); if (!decoded.ok) stop(decoded.reason, decoded.reason === 'budget-exceeded' ? 'budget' : 'input');
    const save = object(decoded.value, ['tag', 'state']); literal(save.tag, SAVE_TAG, 'unsupported-schema'); const state = rebuild(save.state), result = { ok: true, state } as const; budget(result); return freeze(result);
  } catch (error) { return freeze(caught(error)); }
}
export function replayBoundedForgeDevelopmentProductionV1(input: BoundedForgeDevelopmentProductionTraceV1): BoundedForgeDevelopmentProductionReplayResultV1 {
  let index: number | null = null;
  try {
    const trace = object(detach(input), ['tag', 'scenario', 'attempts', 'expectedFinalState']); literal(trace.tag, TRACE_TAG, 'unsupported-schema');
    const genesis = scenario(trace.scenario), attempts = array(trace.attempts, 512);
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
