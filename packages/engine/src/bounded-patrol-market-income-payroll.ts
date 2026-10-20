/** Bounded Patrol, market construction, source money projection and full ordinary payroll share one clock and gold ledger.
 * Completion order, reserve and writers are provisional engine policies, not native full finance. */
import * as registry from './internal/bounded-patrol-market-income-payroll-data.ts';
import { canonicalBoundedMarketJson as canonical, decodeBoundedMarketJson, detachBoundedMarketData,
  fitBoundedMarketData, clone, same, freeze } from './internal/bounded-patrol-market-income-payroll-json.ts';
import { stop, caught } from './internal/bounded-patrol-market-income-payroll-errors.ts';
import { resolveMarketPayroll, deriveMarketReserve, settleMarketMonth, applyMarketPatrol } from './internal/bounded-patrol-market-income-payroll-adapter.ts';
import { calculateConstructionDevelopment, calculateConstructionWrite } from './internal/facility-construction-leaves.ts';
import { advanceConstructionWork, completeConstructionPhase } from './internal/facility-construction-phases.ts';
import type { FinancePayroll } from './internal/finance-money-payroll-types.ts';
import type { ConstructionCompletion } from './internal/facility-construction-types.ts';
import type { DeepReadonly, Thirty, Id, JobId, Digest, Blob, Marker, DateV1, Position, Clock, Progress, OfficerFacts, Lot, ExistingMarket, Unit, SourceBinding, SourceBindings, SourceBoundary, Scenario, ConstructionCatalog, OfficesCatalog, ConstructionPolicy, FinancePolicies, ReservePolicy, Policy, RateInput, RateEvidence, RateReceipt, ConstructionWritePolicyId, ConstructionWrite, OfficerRow, FacilityRow, Ledger, ConstructionReward, Completion, StartSnapshot, ConstructionFees, Work, Job, Current, Reserve, MoneySlot, MoneyTypeRows, MoneyInput, MoneyEvidence, MoneySlotReceipt, MoneyIntermediates, MoneyResult, MoneyKernelCall, MoneyKernelNotDue, GoldWrite, SalaryItem, Salary, MonthlyReceipt, StartCommand, AdvanceCommand, Command, Envelope, UnitCheck, StartReservations, StartDetail, ProgressAudit, TickDetail, CatalogDigests, ReceiptCommon, Receipt, State, Proposal, MoneyKernelReason, PatrolCommand, PatrolPolicy, PatrolWrite, PatrolReward, PatrolFees, PatrolInput, PatrolOutput, PatrolEvidence, PatrolKernelCall, PatrolCalculation, PatrolAudit, PatrolActorChange, PatrolDetail, PatrolReason, Stage, Reason, Failure, CreateOrLoadResult, InspectResult, ExecuteResult, PreviewResult, SaveEnvelope, SaveResult, ReplayOutcome, Trace, ReplayResult } from './internal/bounded-patrol-market-income-payroll-types.ts';

export type BoundedPatrolMarketIncomePayrollIdV1 = DeepReadonly<Id>;
export type BoundedPatrolMarketIncomePayrollJobIdV1 = DeepReadonly<JobId>;
export type BoundedPatrolMarketIncomePayrollDigestV1 = DeepReadonly<Digest>;
export type BoundedPatrolMarketIncomePayrollBlobV1 = DeepReadonly<Blob>;
export type BoundedPatrolMarketIncomePayrollMarkerV1 = DeepReadonly<Marker>;
export type BoundedPatrolMarketIncomePayrollDateV1 = DeepReadonly<DateV1>;
export type BoundedPatrolMarketIncomePayrollPositionV1 = DeepReadonly<Position>;
export type BoundedPatrolMarketIncomePayrollClockV1 = DeepReadonly<Clock>;
export type BoundedPatrolMarketIncomePayrollProgressV1 = DeepReadonly<Progress>;
export type BoundedPatrolMarketIncomePayrollOfficerFactsV1 = DeepReadonly<OfficerFacts>;
export type BoundedPatrolMarketIncomePayrollLotV1 = DeepReadonly<Lot>;
export type BoundedPatrolMarketIncomePayrollExistingMarketV1 = DeepReadonly<ExistingMarket>;
export type BoundedPatrolMarketIncomePayrollUnitV1 = DeepReadonly<Unit>;
export type BoundedPatrolMarketIncomePayrollSourceBindingV1 = DeepReadonly<SourceBinding>;
export type BoundedPatrolMarketIncomePayrollSourceBindingsV1 = DeepReadonly<SourceBindings>;
export type BoundedPatrolMarketIncomePayrollSourceBoundaryV1 = DeepReadonly<SourceBoundary>;
export type BoundedPatrolMarketIncomePayrollScenarioV1 = DeepReadonly<Scenario>;
export type BoundedPatrolMarketIncomePayrollConstructionCatalogV1 = DeepReadonly<ConstructionCatalog>;
export type BoundedPatrolMarketIncomePayrollOfficesCatalogV1 = DeepReadonly<OfficesCatalog>;
export type BoundedPatrolMarketIncomePayrollConstructionPolicyV1 = DeepReadonly<ConstructionPolicy>;
export type BoundedPatrolMarketIncomePayrollFinancePoliciesV1 = DeepReadonly<FinancePolicies>;
export type BoundedPatrolMarketIncomePayrollReservePolicyV1 = DeepReadonly<ReservePolicy>;
export type BoundedPatrolMarketIncomePayrollPolicyV1 = DeepReadonly<Policy>;
export type BoundedPatrolMarketIncomePayrollRateInputV1 = DeepReadonly<RateInput>;
export type BoundedPatrolMarketIncomePayrollRateEvidenceV1 = DeepReadonly<RateEvidence>;
export type BoundedPatrolMarketIncomePayrollRateReceiptV1 = DeepReadonly<RateReceipt>;
export type BoundedPatrolMarketIncomePayrollConstructionWritePolicyIdV1 = DeepReadonly<ConstructionWritePolicyId>;
export type BoundedPatrolMarketIncomePayrollConstructionWriteV1 = DeepReadonly<ConstructionWrite>;
export type BoundedPatrolMarketIncomePayrollOfficerRowV1 = DeepReadonly<OfficerRow>;
export type BoundedPatrolMarketIncomePayrollFacilityRowV1 = DeepReadonly<FacilityRow>;
export type BoundedPatrolMarketIncomePayrollLedgerV1 = DeepReadonly<Ledger>;
export type BoundedPatrolMarketIncomePayrollConstructionRewardV1 = DeepReadonly<ConstructionReward>;
export type BoundedPatrolMarketIncomePayrollCompletionV1 = DeepReadonly<Completion>;
export type BoundedPatrolMarketIncomePayrollStartSnapshotV1 = DeepReadonly<StartSnapshot>;
export type BoundedPatrolMarketIncomePayrollConstructionFeesV1 = DeepReadonly<ConstructionFees>;
export type BoundedPatrolMarketIncomePayrollWorkV1 = DeepReadonly<Work>;
export type BoundedPatrolMarketIncomePayrollJobV1 = DeepReadonly<Job>;
export type BoundedPatrolMarketIncomePayrollCurrentV1 = DeepReadonly<Current>;
export type BoundedPatrolMarketIncomePayrollReserveV1 = DeepReadonly<Reserve>;
export type BoundedPatrolMarketIncomePayrollMoneySlotV1 = DeepReadonly<MoneySlot>;
export type BoundedPatrolMarketIncomePayrollMoneyTypeRowsV1 = DeepReadonly<MoneyTypeRows>;
export type BoundedPatrolMarketIncomePayrollMoneyInputV1 = DeepReadonly<MoneyInput>;
export type BoundedPatrolMarketIncomePayrollMoneyEvidenceV1 = DeepReadonly<MoneyEvidence>;
export type BoundedPatrolMarketIncomePayrollMoneySlotReceiptV1 = DeepReadonly<MoneySlotReceipt>;
export type BoundedPatrolMarketIncomePayrollMoneyIntermediatesV1 = DeepReadonly<MoneyIntermediates>;
export type BoundedPatrolMarketIncomePayrollMoneyResultV1 = DeepReadonly<MoneyResult>;
export type BoundedPatrolMarketIncomePayrollMoneyKernelCallV1 = DeepReadonly<MoneyKernelCall>;
export type BoundedPatrolMarketIncomePayrollMoneyKernelNotDueV1 = DeepReadonly<MoneyKernelNotDue>;
export type BoundedPatrolMarketIncomePayrollGoldWriteV1 = DeepReadonly<GoldWrite>;
export type BoundedPatrolMarketIncomePayrollSalaryItemV1 = DeepReadonly<SalaryItem>;
export type BoundedPatrolMarketIncomePayrollSalaryV1 = DeepReadonly<Salary>;
export type BoundedPatrolMarketIncomePayrollMonthlyReceiptV1 = DeepReadonly<MonthlyReceipt>;
export type BoundedPatrolMarketIncomePayrollStartCommandV1 = DeepReadonly<StartCommand>;
export type BoundedPatrolMarketIncomePayrollAdvanceCommandV1 = DeepReadonly<AdvanceCommand>;
export type BoundedPatrolMarketIncomePayrollCommandV1 = DeepReadonly<Command>;
export type BoundedPatrolMarketIncomePayrollEnvelopeV1 = DeepReadonly<Envelope>;
export type BoundedPatrolMarketIncomePayrollUnitCheckV1 = DeepReadonly<UnitCheck>;
export type BoundedPatrolMarketIncomePayrollStartReservationsV1 = DeepReadonly<StartReservations>;
export type BoundedPatrolMarketIncomePayrollStartDetailV1 = DeepReadonly<StartDetail>;
export type BoundedPatrolMarketIncomePayrollProgressAuditV1 = DeepReadonly<ProgressAudit>;
export type BoundedPatrolMarketIncomePayrollTickDetailV1 = DeepReadonly<TickDetail>;
export type BoundedPatrolMarketIncomePayrollCatalogDigestsV1 = DeepReadonly<CatalogDigests>;
export type BoundedPatrolMarketIncomePayrollReceiptCommonV1 = DeepReadonly<ReceiptCommon>;
export type BoundedPatrolMarketIncomePayrollReceiptV1 = DeepReadonly<Receipt>;
export type BoundedPatrolMarketIncomePayrollStateV1 = DeepReadonly<State>;
export type BoundedPatrolMarketIncomePayrollProposalV1 = DeepReadonly<Proposal>;
export type BoundedPatrolMarketIncomePayrollMoneyKernelReasonV1 = DeepReadonly<MoneyKernelReason>;
export type BoundedPatrolMarketIncomePayrollStageV1 = DeepReadonly<Stage>;
export type BoundedPatrolMarketIncomePayrollReasonV1 = DeepReadonly<Reason>;
export type BoundedPatrolMarketIncomePayrollFailureV1 = DeepReadonly<Failure>;
export type BoundedPatrolMarketIncomePayrollCreateOrLoadResultV1 = DeepReadonly<CreateOrLoadResult>;
export type BoundedPatrolMarketIncomePayrollInspectResultV1 = DeepReadonly<InspectResult>;
export type BoundedPatrolMarketIncomePayrollExecuteResultV1 = DeepReadonly<ExecuteResult>;
export type BoundedPatrolMarketIncomePayrollPreviewResultV1 = DeepReadonly<PreviewResult>;
export type BoundedPatrolMarketIncomePayrollSaveEnvelopeV1 = DeepReadonly<SaveEnvelope>;
export type BoundedPatrolMarketIncomePayrollSaveResultV1 = DeepReadonly<SaveResult>;
export type BoundedPatrolMarketIncomePayrollReplayOutcomeV1 = DeepReadonly<ReplayOutcome>;
export type BoundedPatrolMarketIncomePayrollTraceV1 = DeepReadonly<Trace>;
export type BoundedPatrolMarketIncomePayrollReplayResultV1 = DeepReadonly<ReplayResult>;

export type BoundedPatrolMarketIncomePayrollPatrolCommandV1 = DeepReadonly<PatrolCommand>;
export type BoundedPatrolMarketIncomePayrollPatrolPolicyV1 = DeepReadonly<PatrolPolicy>;
export type BoundedPatrolMarketIncomePayrollPatrolWriteV1 = DeepReadonly<PatrolWrite>;
export type BoundedPatrolMarketIncomePayrollPatrolRewardV1 = DeepReadonly<PatrolReward>;
export type BoundedPatrolMarketIncomePayrollPatrolFeesV1 = DeepReadonly<PatrolFees>;
export type BoundedPatrolMarketIncomePayrollPatrolInputV1 = DeepReadonly<PatrolInput>;
export type BoundedPatrolMarketIncomePayrollPatrolOutputV1 = DeepReadonly<PatrolOutput>;
export type BoundedPatrolMarketIncomePayrollPatrolEvidenceV1 = DeepReadonly<PatrolEvidence>;
export type BoundedPatrolMarketIncomePayrollPatrolKernelCallV1 = DeepReadonly<PatrolKernelCall>;
export type BoundedPatrolMarketIncomePayrollPatrolCalculationV1 = DeepReadonly<PatrolCalculation>;
export type BoundedPatrolMarketIncomePayrollPatrolAuditV1 = DeepReadonly<PatrolAudit>;
export type BoundedPatrolMarketIncomePayrollPatrolActorChangeV1 = DeepReadonly<PatrolActorChange>;
export type BoundedPatrolMarketIncomePayrollPatrolDetailV1 = DeepReadonly<PatrolDetail>;
export type BoundedPatrolMarketIncomePayrollPatrolReasonV1 = DeepReadonly<PatrolReason>;

const PROFILE = 'bounded-patrol-market-income-payroll-v1';
const STATE_TAG = 'san11-bounded-patrol-market-income-payroll-state-v1';
const SAVE_TAG = 'san11-bounded-patrol-market-income-payroll-save-v1';
const TRACE_TAG = 'san11-bounded-patrol-market-income-payroll-trace-v1';
const MAX = 1_000_000_000;
const XP = ['leadershipXp','charmXp','intelligenceXp','politicsXp','warXp'] as const;
const { ROOT_POLICY, CONSTRUCTION_CATALOG, OFFICES_CATALOG, SOURCE_BINDINGS, SOURCE_BOUNDARY } = registry;
type Hash = { update(text: string, encoding: 'utf8'): Hash; digest(encoding: 'hex'): string };
const runtime = globalThis as { process?: { getBuiltinModule?: (name: string) => { createHash(name: 'sha256'): Hash } } };
const crypto = runtime.process?.getBuiltinModule?.('node:crypto');
function digest(value: unknown): Digest {
  if (!crypto) stop('invalid-data');
  return crypto.createHash('sha256').update(canonical(value), 'utf8').digest('hex');
}
function detach(value: unknown): unknown {
  const result = detachBoundedMarketData(value);
  if (!result.ok) stop(result.reason, result.reason === 'budget-exceeded' ? 'budget' : 'input');
  return result.value;
}
function budget(value: unknown): void {
  const result = fitBoundedMarketData(value);
  if (!result.ok) stop(result.reason, result.reason === 'budget-exceeded' ? 'budget' : 'input');
}
function output<T>(value: T): DeepReadonly<T> { budget(value); return freeze(clone(value)); }
function record(value: unknown, reason: Reason = 'invalid-fields'): Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) stop(reason);
  return value as Record<string, unknown>;
}
function object(value: unknown, keys: readonly string[], reason: Reason = 'invalid-fields'): Record<string, unknown> {
  const r = record(value, reason);
  if (!same(Object.keys(r).sort(), [...keys].sort())) stop(reason);
  return r;
}
function integer(value: unknown, max = Number.MAX_SAFE_INTEGER, min = 0, reason: Reason = 'invalid-number'): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || Object.is(value, -0) || value < min || value > max) stop(reason);
  return value;
}
function literal<T extends string | number | boolean | null>(value: unknown, expected: T, reason: Reason = 'invalid-data'): T {
  if (value !== expected || typeof value === 'number' && Object.is(value, -0)) stop(reason);
  return expected;
}
function choice<T extends string | number>(value: unknown, choices: readonly T[], reason: Reason = 'invalid-data'): T {
  for (const item of choices) if (value === item && !Object.is(value, -0)) return item;
  return stop(reason);
}
function array(value: unknown, max: number, min = 0, reason: Reason = 'invalid-array'): unknown[] {
  if (!Array.isArray(value) || value.length < min || value.length > max) stop(reason);
  return value;
}
function id(value: unknown): Id {
  if (typeof value !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9_.:-]{0,63}$/.test(value) || /[^A-Za-z0-9_.:-]/.test(value)) stop('invalid-id');
  return value;
}
function boolean(value: unknown): boolean { if (typeof value !== 'boolean') stop('invalid-data'); return value; }
function unique(values: readonly unknown[], reason: Reason = 'duplicate-entity-id'): void { if (new Set(values).size !== values.length) stop(reason); }
function marker(value: unknown, turn: number): Marker { return value === null ? null : integer(value, turn, 0, 'invalid-marker'); }
function position(value: unknown): Position {
  const p = object(value, ['q','r']); return { q: integer(p.q,1_000_000,-1_000_000), r: integer(p.r,1_000_000,-1_000_000) };
}
function date(value: unknown): DateV1 {
  const d = object(value, ['year','month','day'], 'invalid-date');
  return { year: integer(d.year,9999,1,'invalid-date'), month: integer(d.month,12,1,'invalid-date'), day: choice(d.day,[1,11,21] as const,'invalid-date') };
}
function advanceDate(source: DateV1, count: number): DateV1 {
  let { year, month, day } = source;
  for (let i = 0; i < count; i++) {
    if (day === 1) day = 11;
    else if (day === 11) day = 21;
    else { day = 1; if (month === 12) { month = 1; if (year === 9999) stop('calendar-overflow'); year++; } else month++; }
  }
  return { year, month, day };
}
function progress(value: unknown, turn: number): Progress {
  const p = object(value, [...XP,'merit','actedTurn']);
  return { leadershipXp: integer(p.leadershipXp,MAX), charmXp: integer(p.charmXp,MAX), intelligenceXp: integer(p.intelligenceXp,MAX),
    politicsXp: integer(p.politicsXp,MAX), warXp: integer(p.warXp,MAX), merit: integer(p.merit,MAX), actedTurn: marker(p.actedTurn,turn) };
}
function thirty<T>(read: (i: number) => T): Thirty<T> {
  return [read(0),read(1),read(2),read(3),read(4),read(5),read(6),read(7),read(8),read(9),
    read(10),read(11),read(12),read(13),read(14),read(15),read(16),read(17),read(18),read(19),
    read(20),read(21),read(22),read(23),read(24),read(25),read(26),read(27),read(28),read(29)];
}
/** The exported policy is an owned recursively frozen copy, never an imported object's alias. */
export const BOUNDED_PATROL_MARKET_INCOME_PAYROLL_POLICY: BoundedPatrolMarketIncomePayrollPolicyV1 = freeze(clone(ROOT_POLICY));
function scenario(value: unknown): Scenario {
  const s = object(value, ['schemaVersion','profile','episodeId','clock','advanceLimit','activeForceId','force','corps','city','completeResidentRoster','prisonerCount','officers','lots','facilities','facilityLotSlots','baseMoneyWord','difficulty','controller','pressureActive','constructionEnvironment','constructionCatalog','officesCatalog','policy','sourceBindings']);
  const schemaVersion = literal(s.schemaVersion,1,'unsupported-schema'), profile = literal(s.profile,PROFILE,'unsupported-profile'), episodeId = id(s.episodeId);
  const rawClock = object(s.clock,['date','turn']), initialDate = date(rawClock.date), turn = integer(rawClock.turn);
  const advanceLimit = integer(s.advanceLimit,12,1);
  advanceDate(initialDate,advanceLimit);
  if (turn > Number.MAX_SAFE_INTEGER - advanceLimit) stop('turn-overflow');
  const activeForceId = id(s.activeForceId);
  const f = object(s.force,['id','initialTechniquePoints']);
  const force = { id:id(f.id), initialTechniquePoints:integer(f.initialTechniquePoints,10000) };
  const c = object(s.corps,['id','forceId','initialActionPoints']);
  const corps = { id:id(c.id), forceId:id(c.forceId), initialActionPoints:integer(c.initialActionPoints,255) };
  const v = object(s.city,['id','kind','ownerForceId','position','goldCapacity','initialGold','security','patrolUsedTurn']);
  const cityId = id(v.id), kind = literal(v.kind,'city','unsupported-city-kind'), ownerForceId = id(v.ownerForceId), center = position(v.position);
  const goldCapacity = integer(v.goldCapacity,MAX), initialGold = integer(v.initialGold,goldCapacity), security = integer(v.security,100), patrolUsedTurn = marker(v.patrolUsedTurn,turn);
  const city: Scenario['city'] = { id:cityId,kind,ownerForceId,position:center,goldCapacity,initialGold,security,patrolUsedTurn };
  if (force.id !== activeForceId || corps.forceId !== activeForceId || ownerForceId !== activeForceId) stop('owner-corps-mismatch');
  const completeResidentRoster = literal(s.completeResidentRoster,true,'incomplete-payroll-roster');
  const prisonerCount = literal(s.prisonerCount,0,'unsupported-prisoners');
  const officers: OfficerFacts[] = array(s.officers,8,1,'invalid-officer-count').map(value => {
    const o = object(value,['id','forceId','cityId','role','officeId','leadership','charm','war','intelligence','politics','available','incomeSkills','initial']);
    const officerId = id(o.id), forceId = id(o.forceId), officerCityId = id(o.cityId);
    const role = literal(o.role,'ordinary-officer','unsupported-payroll-identity'), officeId = integer(o.officeId,79,0,'unsupported-payroll-identity');
    const leadership = integer(o.leadership,100), charm = integer(o.charm,100), war = integer(o.war,100), intelligence = integer(o.intelligence,100);
    const politics = integer(o.politics,100), available = boolean(o.available);
    array(o.incomeSkills,0,0,'unsupported-income-skill'); const incomeSkills: [] = [];
    const initial = progress(o.initial,turn);
    if (forceId !== activeForceId || officerCityId !== cityId) stop('officer-city-force-mismatch','input',{officerId});
    return {id:officerId,forceId,cityId:officerCityId,role,officeId,leadership,charm,war,intelligence,politics,available,incomeSkills,initial};
  });
  unique(officers.map(o => o.id)); unique(officers.map(o => o.officeId),'duplicate-office');
  const lots: Lot[] = array(s.lots,2,1,'invalid-lot-layout').map(value => {
    const l = object(value,['id','cityId','position']); return {id:id(l.id),cityId:id(l.cityId),position:position(l.position)};
  }); unique(lots.map(l => l.id));
  const facilities: ExistingMarket[] = array(s.facilities,1).map(value => {
    const f = object(value,['id','lotId','cityId','kind','level','complete']);
    return {id:id(f.id),lotId:id(f.lotId),cityId:id(f.cityId),kind:literal(f.kind,'market','unsupported-facility'),
      level:literal(f.level,1,'unsupported-facility'),complete:literal(f.complete,true,'unsupported-facility')};
  }); unique(facilities.map(f => f.id));
  if (lots.length !== facilities.length + 1) stop('invalid-lot-layout');
  unique(lots.map(l => canonical(l.position)),'invalid-lot-layout');
  for (const lot of lots) if (lot.cityId !== cityId || same(lot.position,center)) stop('invalid-lot-layout');
  unique(facilities.map(f => f.lotId),'invalid-lot-layout');
  for (const facility of facilities) if (facility.cityId !== cityId || !lots.some(l => l.id === facility.lotId)) stop('invalid-lot-layout');
  const rawSlots = array(s.facilityLotSlots,30,30,'invalid-facility-slots');
  const facilityLotSlots = thirty(i => rawSlots[i] === null ? null : id(rawSlots[i]));
  const nonnullSlots = facilityLotSlots.filter((slot): slot is Id => slot !== null);
  unique(nonnullSlots,'invalid-facility-slots');
  if (nonnullSlots.length !== lots.length || nonnullSlots.some(slot => !lots.some(l => l.id === slot))) stop('invalid-facility-slots');
  const baseMoneyWord = integer(s.baseMoneyWord,65535), difficulty = literal(s.difficulty,'normal','unsupported-difficulty'), controller = choice(s.controller,['player','ai'] as const,'unsupported-controller');
  const pressureActive = boolean(s.pressureActive);
  const e = object(s.constructionEnvironment,['completeFieldUnits','hostileForceIds','fieldUnits']);
  const completeFieldUnits = literal(e.completeFieldUnits,true,'incomplete-field-unit-snapshot');
  const hostileForceIds = array(e.hostileForceIds,16).map(id); unique(hostileForceIds);
  if (hostileForceIds.includes(activeForceId)) stop('owner-marked-hostile');
  const fieldUnits: Unit[] = array(e.fieldUnits,16).map(value => {
    const u = object(value,['id','forceId','position']); return {id:id(u.id),forceId:id(u.forceId),position:position(u.position)};
  }); unique(fieldUnits.map(u => u.id));
  const constructionEnvironment = {completeFieldUnits,hostileForceIds,fieldUnits};
  if (!same(s.constructionCatalog,CONSTRUCTION_CATALOG) || !same(registry.IMPORTED_CONSTRUCTION_CATALOG,CONSTRUCTION_CATALOG)) stop('unsupported-catalog');
  if (!same(s.officesCatalog,OFFICES_CATALOG) || !same(registry.IMPORTED_OFFICES_CATALOG,OFFICES_CATALOG)) stop('unsupported-catalog');
  if (!same(s.policy,ROOT_POLICY) || !same(registry.IMPORTED_ROOT_POLICY,ROOT_POLICY)
    || !same(registry.IMPORTED_CONSTRUCTION_POLICY,ROOT_POLICY.construction) || !same(registry.IMPORTED_FINANCE_POLICIES,ROOT_POLICY.finance)
    || !same(registry.IMPORTED_PATROL_POLICIES,{writer:ROOT_POLICY.patrol.writer,rewards:ROOT_POLICY.patrol.rewards,zeroYield:ROOT_POLICY.patrol.zeroYield})) stop('unsupported-policy');
  if (!same(s.sourceBindings,SOURCE_BINDINGS)) stop('unsupported-source');
  return {schemaVersion,profile,episodeId,clock:{date:initialDate,turn},advanceLimit,activeForceId,force,corps,city,
    completeResidentRoster,prisonerCount,officers,lots,facilities,facilityLotSlots,baseMoneyWord,difficulty,controller,pressureActive,constructionEnvironment,
    constructionCatalog:clone(CONSTRUCTION_CATALOG),officesCatalog:clone(OFFICES_CATALOG),policy:clone(ROOT_POLICY),sourceBindings:clone(SOURCE_BINDINGS)};
}
function initialState(s: Scenario, payroll: FinancePayroll): State {
  const state: State = {tag:STATE_TAG,schemaVersion:1,profile:PROFILE,genesis:clone(s),revision:0,
    current:genesisCurrent(s),acceptedCommands:[]};
  requireReserve(deriveMarketReserve(s,state.current,payroll),state.current.ledger.gold,'input');
  invariants(state,payroll); fitRoot(state,payroll); return state;
}
function requireReserve(reserve: Reserve, available: number, stage: Stage): void {
  if (available < reserve.required) stop('salary-reserve-shortfall',stage,{proposal:{required:reserve.required,available,shortfall:reserve.required-available}});
}
/** Only branded domain failures are restaged; unknown exceptions keep invalid-data/input. */
function atStage<T>(stage: Stage, work: () => T): T {
  try { return work(); } catch (error: unknown) {
    const f = caught(error); if (f === caught(null)) throw error;
    stop(f.reason,f.stage === 'budget' ? 'budget' : stage === 'rebuild' || f.stage === 'input' ? stage : f.stage,f);
  }
}
function exact(value: unknown, expected: unknown, reason: Reason = 'unsupported-kernel-return'): void { if (!same(value,expected)) stop(reason); }
function rateReceipt(raw: unknown, politics: number[]): RateReceipt {
  const value = detach(raw), r = object(value,['supported','profile','politics','facilityDurability','politicsSum','maxPolitics','halfPoliticsSum','politicsRate','durabilityQuarter','durabilityRemainder','durabilityMinimum','rate','selectedBranch','evidence']);
  const inputPolitics: [number|null,number|null,number|null] = [politics[0] ?? null,politics[1] ?? null,politics[2] ?? null];
  exact(r.politics,inputPolitics,'unsupported-construction-rate');
  const politicsSum = politics.reduce((n,p) => n+p,0), maxPolitics = Math.max(...politics), halfPoliticsSum = Math.floor(politicsSum/2), politicsRate = maxPolitics+halfPoliticsSum;
  const evidence: RateEvidence = {slotsAndStablePolitics:['005BB1E0..005BB213'],politicsHalfAndAdd:['005BB23E..005BB247'],
    stableFacilityReads:['005BB223','005BB22A','005BB237','005BB249','005BB26C','005BB279','005BB27E'],
    durabilityMinimum:['005BB249..005BB266','005BB26C..005BB29E'],selectAndReturn:['005BB268..005BB2AA'],excludedMod:['*005BB263..*008A9DFD']};
  exact(r.evidence,evidence,'unsupported-construction-rate');
  const result: RateReceipt = {supported:literal(r.supported,true,'unsupported-construction-rate'),profile:literal(r.profile,'domestic-construction-rate-stable-v1','unsupported-construction-rate'),
    politics:clone(inputPolitics),facilityDurability:literal(r.facilityDurability,500,'unsupported-construction-rate'),
    politicsSum:integer(r.politicsSum,300),maxPolitics:integer(r.maxPolitics,100),halfPoliticsSum:integer(r.halfPoliticsSum,150),politicsRate:integer(r.politicsRate,250),
    durabilityQuarter:literal(r.durabilityQuarter,125,'unsupported-construction-rate'),durabilityRemainder:literal(r.durabilityRemainder,375,'unsupported-construction-rate'),
    durabilityMinimum:literal(r.durabilityMinimum,41,'unsupported-construction-rate'),rate:integer(r.rate,250,41,'unsupported-construction-rate'),
    selectedBranch:choice(r.selectedBranch,['politics','durability-minimum'] as const,'unsupported-construction-rate'),evidence:clone(evidence)};
  exact({politicsSum:result.politicsSum,maxPolitics:result.maxPolitics,halfPoliticsSum:result.halfPoliticsSum,politicsRate:result.politicsRate,rate:result.rate,selectedBranch:result.selectedBranch},
    {politicsSum,maxPolitics,halfPoliticsSum,politicsRate,rate:Math.max(41,politicsRate),selectedBranch:41>politicsRate?'durability-minimum':'politics'},'unsupported-construction-rate');
  return result;
}
function readConstructionWrite(value: unknown, before: number, delta: number, cap: number, policyId: ConstructionWritePolicyId): ConstructionWrite {
  const v = object(value,['before','requestedDelta','actualDelta','after','cap','discarded','policyId']);
  const actualDelta = delta < 0 ? delta : Math.min(delta,cap-before);
  const expected: ConstructionWrite = {before,requestedDelta:delta,actualDelta,after:before+actualDelta,cap,discarded:delta-actualDelta,policyId};
  exact(v,expected);
  return {before:integer(v.before,cap),requestedDelta:integer(v.requestedDelta,100,-200),actualDelta:integer(v.actualDelta,100,-200),
    after:integer(v.after,cap),cap:integer(v.cap,MAX),discarded:integer(v.discarded,100),policyId:literal(v.policyId,policyId)};
}
function constructionWrite(before: number, delta: number, cap: number, policyId: string): ConstructionWrite {
  const selected = choice(policyId,['facility-exact-debit-saturating-reward-v1','facility-community-rewards-v1','facility-ap20-cap255-v1'] as const,'unsupported-policy');
  const result = calculateConstructionWrite(before,delta,cap,selected), safe = detach(result);
  const returned=record(safe,'unsupported-kernel-return');
  if (returned.ok===false) { exact(safe,{ok:false,reason:'insufficient-balance'}); stop('insufficient-balance'); }
  const r = object(safe,['ok','write']); literal(r.ok,true);
  return readConstructionWrite(r.write,before,delta,cap,selected);
}
function marketRow(s: Scenario) {
  const row = s.constructionCatalog.entries.find(entry => entry.kind === 'market');
  if (!row) stop('unsupported-catalog');
  const level = row.levels.find(level => level.level === 1);
  if (!level || level.typeId !== 31 || level.maxDurability !== 500 || row.goldCost !== 200 || row.completionTechniquePoints !== 30) stop('unsupported-catalog');
  return {row,level};
}
function startMarket(s: Scenario, current: Current, command: StartCommand, envelopeId: Id, revision: number, payroll: FinancePayroll): StartDetail {
  if (command.cityId !== s.city.id) stop('unknown-city','construction');
  if (s.activeForceId !== s.force.id || s.city.ownerForceId !== s.activeForceId || s.corps.forceId !== s.activeForceId) stop('owner-corps-mismatch','construction');
  if (current.jobs.length >= 1) stop('job-history-limit','construction');
  const unitChecks: UnitCheck[] = s.constructionEnvironment.fieldUnits.map(u => {
    const dq = u.position.q-s.city.position.q, dr = u.position.r-s.city.position.r;
    const distance = Math.max(Math.abs(dq),Math.abs(dr),Math.abs(dq+dr)), hostile = s.constructionEnvironment.hostileForceIds.includes(u.forceId);
    return {unitId:u.id,forceId:u.forceId,position:clone(u.position),hostile,distance,blocks:hostile&&distance<=2};
  });
  const blocker = unitChecks.find(u => u.blocks); if (blocker) stop('hostile-within-two','construction',{blockingUnitId:blocker.unitId});
  const selected = command.officerIds.map(officerId => {
    const facts = s.officers.find(o => o.id === officerId), row = current.ledger.officers.find(o => o.id === officerId);
    if (!facts || !row) stop('unknown-officer','construction',{officerId});
    if (facts.cityId !== s.city.id || facts.forceId !== s.activeForceId) stop('officer-city-force-mismatch','construction',{officerId});
    if (!facts.available) stop('officer-unavailable','construction',{officerId});
    if (row.reservationJobId !== null) stop('officer-reserved-by-job','construction',{officerId});
    if (row.actedTurn === current.clock.turn) stop('officer-already-acted','construction',{officerId});
    return row;
  });
  if (current.ledger.actionPoints < 20) stop('insufficient-action-points','construction');
  if (current.ledger.gold < 200) stop('insufficient-gold','construction');
  requireReserve(deriveMarketReserve(s,current,payroll),current.ledger.gold-200,'construction');
  const lot = s.lots.find(l => l.id === command.lotId); if (!lot) stop('unknown-lot','construction');
  if (current.ledger.facilities.some(f => f.lotId === lot.id)) stop('occupied-lot','construction');
  if (current.ledger.facilities.some(f => f.id === command.facilityId) || current.jobs.some(j => j.facilityId === command.facilityId)) stop('facility-id-reused','construction',{facilityId:command.facilityId});
  const {level} = marketRow(s), politics = selected.map(o => o.politics);
  const development = calculateConstructionDevelopment({required:level.maxDurability,politics,initialWork:s.policy.construction.initialWork});
  const safe = detach(development);
  const developmentResult=record(safe,'unsupported-kernel-return');
  if (developmentResult.ok===false) {
    object(safe,['ok','reason'],'unsupported-kernel-return');
    const reason=choice(developmentResult.reason,['unsupported-construction-rate','nonpositive-construction-rate'] as const,'unsupported-kernel-return');
    stop(reason,'construction');
  }
  const calculated = object(safe,['ok','required','initial','rate','durationTurns']); literal(calculated.ok,true);
  literal(calculated.required,500,'unsupported-construction-rate'); literal(calculated.initial,125,'unsupported-construction-rate');
  const rate = rateReceipt(calculated.rate,politics);
  const durationTurns = integer(calculated.durationTurns,10,2,'invalid-duration');
  if (durationTurns !== Math.ceil(375/rate.rate)) stop('invalid-duration','construction');
  if (s.advanceLimit-current.clock.advancedCount < durationTurns) stop('completion-horizon-exceeded','construction');
  const dueDate = advanceDate(current.clock.date,durationTurns), dueTurn = current.clock.turn+durationTurns;
  if (!Number.isSafeInteger(dueTurn)) stop('turn-overflow','construction');
  if (25-(revision+1) < s.advanceLimit-current.clock.advancedCount || 25-(revision+1) < durationTurns) stop('completion-history-slots','construction');
  const fees: ConstructionFees = {actionPoints:constructionWrite(current.ledger.actionPoints,-20,255,s.policy.construction.writer.id),gold:constructionWrite(current.ledger.gold,-200,current.ledger.goldCapacity,s.policy.construction.writer.id)};
  current.ledger.actionPoints = fees.actionPoints.after; current.ledger.gold = fees.gold.after;
  const jobId = 'job:'+envelopeId;
  const job: Job = {id:jobId,kind:'development',facilityKind:'market',cityId:s.city.id,lotId:lot.id,facilityId:command.facilityId,
    fromLevel:0,targetLevel:1,officerIds:[...command.officerIds],politics:[...politics],startTurn:current.clock.turn,startDate:clone(current.clock.date),
    dueTurn,dueDate,durationTurns,remainingTurns:durationTurns,work:{initial:125,current:125,required:500,perAdvance:rate.rate,rate},
    startSnapshot:{clock:{date:clone(current.clock.date),turn:current.clock.turn},activeForceId:s.activeForceId,corpsId:s.corps.id,cityId:s.city.id,
      lot:clone(lot),officers:selected.map(o=>({id:o.id,politics:o.politics})),policyDigest:digest(s.policy),constructionCatalogDigest:digest(s.constructionCatalog)},
    rateInput:{profile:'domestic-construction-rate-stable-v1',politics:[...politics],facilityDurability:500},fees,completedTurn:null,completion:null};
  const createdFacility: FacilityRow = {id:command.facilityId,lotId:lot.id,cityId:s.city.id,kind:'market',targetLevel:1,typeId:31,status:'developing',effectiveLevel:0,jobId};
  current.jobs.push(job); current.ledger.facilities.push(createdFacility);
  const officers: StartReservations['officers'] = selected.map(o => {
    const actedBefore = o.actedTurn; o.reservationJobId = jobId; o.actedTurn = current.clock.turn;
    return {officerId:o.id,jobBefore:null,jobAfter:jobId,actedBefore,actedAfter:current.clock.turn};
  });
  return {job:clone(job),createdFacility:clone(createdFacility),unitChecks,
    reservations:{officers,facility:{facilityId:createdFacility.id,jobBefore:null,jobAfter:jobId},lot:{lotId:lot.id,occupantBefore:null,occupantAfter:createdFacility.id}}};
}
function readCompletion(raw: ConstructionCompletion, before: Current, job: Job, facility: FacilityRow, s: Scenario): Completion {
  const v = object(detach(raw),['jobId','facilityId','typeId','level','effectiveLevel','techniquePoints','rewards','releasedOfficerIds','policyId']);
  const p = s.policy.construction;
  const rewards: ConstructionReward[] = array(v.rewards,job.officerIds.length,job.officerIds.length).map((value,i) => {
    const officerId = job.officerIds[i]!, row = before.ledger.officers.find(o=>o.id===officerId);
    if (!row) stop('unknown-officer','reservation',{officerId});
    const r = object(value,['officerId','politicsXp','merit','politicsBefore','politicsAfter']);
    return {officerId:literal(r.officerId,officerId),politicsXp:readConstructionWrite(r.politicsXp,row.politicsXp,3,MAX,p.rewards.id),
      merit:readConstructionWrite(r.merit,row.merit,100,MAX,p.rewards.id),politicsBefore:literal(r.politicsBefore,row.politics),politicsAfter:literal(r.politicsAfter,row.politics)};
  });
  exact(v.releasedOfficerIds,job.officerIds);
  return {jobId:literal(v.jobId,job.id),facilityId:literal(v.facilityId,facility.id),typeId:literal(v.typeId,31),level:literal(v.level,1),effectiveLevel:literal(v.effectiveLevel,1),
    techniquePoints:readConstructionWrite(v.techniquePoints,before.ledger.force.techniquePoints,30,10000,p.writer.id),rewards,
    releasedOfficerIds:[...job.officerIds],policyId:literal(v.policyId,'next-boundary-capped-work-v1')};
}
function advanceMarket(s: Scenario, current: Current, payroll: FinancePayroll): TickDetail {
  if (current.clock.advancedCount >= s.advanceLimit) stop('advance-limit-reached','tick');
  current.clock.date = advanceDate(current.clock.date,1); current.clock.turn++; current.clock.advancedCount++;
  const apRecovery = constructionWrite(current.ledger.actionPoints,20,255,s.policy.construction.apRecovery.id);
  current.ledger.actionPoints = apRecovery.after;
  const progress: ProgressAudit[] = [], completions: Completion[] = [];
  const job = current.jobs.find(j=>j.completedTurn===null);
  if (job) {
    const beforeProgress = clone(current), beforeJob = clone(job);
    const result = advanceConstructionWork(job);
    const expectedProgress: ProgressAudit = {jobId:job.id,remainingBefore:beforeJob.remainingTurns,remainingAfter:beforeJob.remainingTurns-1,
      workBefore:beforeJob.work.current,workAfter:Math.min(500,beforeJob.work.current+beforeJob.work.perAdvance)};
    exact(detach(result),expectedProgress);
    const expected = clone(beforeProgress), expectedJob = expected.jobs[0]!;
    expectedJob.remainingTurns = expectedProgress.remainingAfter; expectedJob.work.current = expectedProgress.workAfter;
    if (!same(detach(current),expected)) stop('unexpected-phase-effect','invariant');
    progress.push(clone(expectedProgress));
    if (job.remainingTurns === 0) {
      const facility = current.ledger.facilities.find(f=>f.id===job.facilityId);
      if (!facility || facility.status !== 'developing' || facility.jobId !== job.id) stop('facility-reservation-mismatch','reservation',{facilityId:job.facilityId,jobId:job.id});
      if (current.clock.turn !== job.dueTurn || !same(current.clock.date,job.dueDate)) stop('completion-timing-mismatch','tick',{jobId:job.id});
      if (job.work.current !== 500) stop('incomplete-work','tick',{jobId:job.id});
      const {row} = marketRow(s), beforeCompletion = clone(current), p = s.policy.construction;
      const raw = completeConstructionPhase({job,facility,force:current.ledger.force,currentTurn:current.clock.turn,requestedTechniquePoints:row.completionTechniquePoints,
        policies:{writer:p.writer,rewards:p.rewards,completionActors:p.completionActors,scheduler:p.scheduler}}, {
        write:constructionWrite,
        requireReservedOfficer(officerId) {
          const officer = current.ledger.officers.find(o=>o.id===officerId);
          if (!officer || officer.reservationJobId !== job.id) stop('officer-reservation-mismatch','reservation',{officerId,jobId:job.id});
          return officer;
        }
      });
      const completion = readCompletion(raw,beforeCompletion,job,facility,s), expected = clone(beforeCompletion);
      expected.ledger.force.techniquePoints = completion.techniquePoints.after;
      for (const reward of completion.rewards) {
        const officer = expected.ledger.officers.find(o=>o.id===reward.officerId)!;
        officer.politicsXp = reward.politicsXp.after; officer.merit = reward.merit.after; officer.reservationJobId = null; officer.actedTurn = current.clock.turn;
      }
      const expectedFacility = expected.ledger.facilities.find(f=>f.id===job.facilityId)!;
      expectedFacility.status='complete'; expectedFacility.effectiveLevel=1; expectedFacility.jobId=null; expected.jobs[0]!.completedTurn=current.clock.turn;
      if (!same(detach(current),expected)) stop('unexpected-phase-effect','invariant');
      job.completion=clone(completion); completions.push(clone(completion));
    }
  }
  const monthly = settleMarketMonth(s,current,payroll);
  return {apRecovery,progress,completions,monthly};
}
function genesisCurrent(s: Scenario): Current {
  return {clock:{date:clone(s.clock.date),turn:s.clock.turn,advancedCount:0},ledger:{gold:s.city.initialGold,goldCapacity:s.city.goldCapacity,
    actionPoints:s.corps.initialActionPoints,security:s.city.security,patrolUsedTurn:s.city.patrolUsedTurn,force:{techniquePoints:s.force.initialTechniquePoints},
    officers:s.officers.map(o=>({...clone(o.initial),id:o.id,leadership:o.leadership,charm:o.charm,war:o.war,intelligence:o.intelligence,politics:o.politics,reservationJobId:null})),
    facilities:s.facilities.map(f=>({id:f.id,lotId:f.lotId,cityId:f.cityId,kind:'market',targetLevel:1,typeId:31,status:'complete',effectiveLevel:1,jobId:null}))},jobs:[]};
}
/** Audit every prefix from the sole genesis ledger. No summary or digest grants trust. */
function invariants(state: State, payroll: FinancePayroll): void {
  atStage('invariant',() => {
    const s = state.genesis, c = state.current, fail = () => stop('invariant-mismatch','invariant');
    if (state.revision !== state.acceptedCommands.length || state.revision > 25 || c.clock.advancedCount > s.advanceLimit) fail();
    if (c.clock.turn !== s.clock.turn+c.clock.advancedCount || !same(c.clock.date,advanceDate(s.clock.date,c.clock.advancedCount))) fail();
    if (c.ledger.goldCapacity !== s.city.goldCapacity || c.ledger.gold < 0 || c.ledger.gold > c.ledger.goldCapacity) fail();
    integer(c.ledger.security,100); marker(c.ledger.patrolUsedTurn,c.clock.turn);
    const expected = genesisCurrent(s), settled = new Set<string>(), ids = new Set<Id>();
    for (let i=0;i<state.acceptedCommands.length;i++) {
      const entry = state.acceptedCommands[i]!, r = entry.receipt, before = clone(expected);
      if (ids.has(entry.envelope.id)) fail(); ids.add(entry.envelope.id);
      if (!same(r.envelope,entry.envelope) || r.revisionBefore !== i || r.revisionAfter !== i+1 || entry.envelope.expectedRevision !== i) fail();
      if (!same(r.clockBefore,before.clock) || r.currentDigestBefore !== digest(before) || !same(r.reserveBefore,deriveMarketReserve(s,before,payroll))) fail();
      if (r.policyDigest !== digest(s.policy) || !same(r.catalogDigests,{construction:digest(s.constructionCatalog),offices:digest(s.officesCatalog)})
        || r.sourceDigest !== digest(s.sourceBindings) || !same(r.sourceBoundary,SOURCE_BOUNDARY)
        || !same(r.ownerSnapshot,{activeForceId:s.activeForceId,ownerForceId:s.city.ownerForceId,corpsId:s.corps.id,corpsForceId:s.corps.forceId})
        || r.scope !== 'bounded-shared-patrol-market-income-payroll' || r.rngDraws !== 0 || r.nativeIntegration !== false) fail();
      if (r.kind === 'market-start') {
        if (entry.envelope.command.type !== 'StartMarketDevelopment' || expected.jobs.length !== 0) fail();
        const d = r.detail, j = d.job;
        if (j.id !== 'job:'+entry.envelope.id || j.startTurn !== expected.clock.turn || !same(j.startDate,expected.clock.date)
          || j.completedTurn !== null || j.completion !== null || j.remainingTurns !== j.durationTurns || j.work.current !== 125
          || j.work.initial !== 125 || j.work.required !== 500 || j.work.perAdvance !== j.work.rate.rate
          || j.durationTurns !== Math.ceil(375/j.work.perAdvance) || j.durationTurns < 2 || j.durationTurns > 10
          || j.dueTurn !== j.startTurn+j.durationTurns || !same(j.dueDate,advanceDate(j.startDate,j.durationTurns))) fail();
        readConstructionWrite(j.fees.actionPoints,expected.ledger.actionPoints,-20,255,s.policy.construction.writer.id);
        readConstructionWrite(j.fees.gold,expected.ledger.gold,-200,expected.ledger.goldCapacity,s.policy.construction.writer.id);
        expected.ledger.actionPoints=j.fees.actionPoints.after; expected.ledger.gold=j.fees.gold.after;
        expected.jobs.push(clone(j)); expected.ledger.facilities.push(clone(d.createdFacility));
        for (const officerId of j.officerIds) {
          const o=expected.ledger.officers.find(o=>o.id===officerId); if (!o) return fail();
          o.reservationJobId=j.id; o.actedTurn=expected.clock.turn;
        }
      } else if (r.kind === 'patrol') {
        const command=entry.envelope.command;
        if (command.type !== 'Patrol' || expected.clock.advancedCount >= s.advanceLimit) return fail();
        const detail=applyMarketPatrol(s,expected,command,entry.envelope.id);
        if (!same(detail,r.detail)) fail();
      } else {
        if (entry.envelope.command.type !== 'AdvanceSharedMarketTurn') fail();
        expected.clock={date:advanceDate(expected.clock.date,1),turn:expected.clock.turn+1,advancedCount:expected.clock.advancedCount+1};
        readConstructionWrite(r.detail.apRecovery,expected.ledger.actionPoints,20,255,s.policy.construction.apRecovery.id);
        expected.ledger.actionPoints=r.detail.apRecovery.after;
        const active=expected.jobs.find(j=>j.completedTurn===null);
        if (r.detail.progress.length !== (active ? 1 : 0)) fail();
        if (active) {
          const p=r.detail.progress[0]!;
          if (!same(p,{jobId:active.id,remainingBefore:active.remainingTurns,remainingAfter:active.remainingTurns-1,workBefore:active.work.current,workAfter:Math.min(500,active.work.current+active.work.perAdvance)})) fail();
          active.remainingTurns=p.remainingAfter; active.work.current=p.workAfter;
        }
        const completeNow=active !== undefined && active.remainingTurns===0;
        if (r.detail.completions.length !== (completeNow ? 1 : 0)) fail();
        if (completeNow && active) {
          const completion=r.detail.completions[0]!, facility=expected.ledger.facilities.find(f=>f.id===active.facilityId);
          if (!facility || expected.clock.turn !== active.dueTurn || !same(expected.clock.date,active.dueDate) || active.work.current!==500) return fail();
          readConstructionWrite(completion.techniquePoints,expected.ledger.force.techniquePoints,30,10000,s.policy.construction.writer.id);
          expected.ledger.force.techniquePoints=completion.techniquePoints.after;
          if (!same(completion.releasedOfficerIds,active.officerIds) || completion.rewards.length!==active.officerIds.length) fail();
          for (let j=0;j<active.officerIds.length;j++) {
            const officerId=active.officerIds[j]!, reward=completion.rewards[j]!, o=expected.ledger.officers.find(o=>o.id===officerId);
            if (!o || o.reservationJobId!==active.id || reward.officerId!==officerId || reward.politicsBefore!==o.politics || reward.politicsAfter!==o.politics) return fail();
            readConstructionWrite(reward.politicsXp,o.politicsXp,3,MAX,s.policy.construction.rewards.id);
            readConstructionWrite(reward.merit,o.merit,100,MAX,s.policy.construction.rewards.id);
            o.politicsXp=reward.politicsXp.after; o.merit=reward.merit.after; o.reservationJobId=null; o.actedTurn=expected.clock.turn;
          }
          facility.status='complete'; facility.effectiveLevel=1; facility.jobId=null;
          active.completedTurn=expected.clock.turn; active.completion=clone(completion);
        }
        const monthly=r.detail.monthly;
        if (!same(monthly.salary.items,payroll.items) || monthly.salary.sum!==payroll.sum
          || !same(monthly.payrollOfficerIds,payroll.items.map(o=>o.officerId)) || monthly.payerCityId!==s.city.id
          || monthly.securityBeforeIncome!==expected.ledger.security || !same(monthly.incomeEffects,{taxation:false,wealthy:false})) fail();
        if (expected.clock.date.day!==1) {
          if (monthly.status!=='not-due' || monthly.writes.length!==0 || monthly.salary.status!=='not-due' || monthly.salary.paid!==0) fail();
        } else {
          if (monthly.status!=='settled') return fail();
          const key=expected.clock.date.year+':'+expected.clock.date.month;
          if (settled.has(key)) fail(); settled.add(key);
          if (!same(monthly.settlement,{cityId:s.city.id,year:expected.clock.date.year,month:expected.clock.date.month})) fail();
          const [income,salary]=monthly.writes, amount=monthly.moneyKernel.result.returnedIncome;
          const accepted=Math.min(amount,expected.ledger.goldCapacity-expected.ledger.gold);
          if (!same(income,{resource:'gold',reason:'money-base',before:expected.ledger.gold,requested:amount,accepted,actualDelta:accepted,
            after:expected.ledger.gold+accepted,cap:expected.ledger.goldCapacity,discarded:amount-accepted,writerPolicyId:'saturating-positive-credit-v1'})) fail();
          expected.ledger.gold=income.after;
          if (!same(salary,{resource:'gold',reason:'salary',before:expected.ledger.gold,requested:payroll.sum,accepted:payroll.sum,actualDelta:-payroll.sum,
            after:expected.ledger.gold-payroll.sum,cap:expected.ledger.goldCapacity,discarded:0,writerPolicyId:'exact-affordable-salary-debit-v1'})
            || monthly.salary.availableBeforeSalary!==expected.ledger.gold || monthly.salary.paid!==payroll.sum) fail();
          expected.ledger.gold=salary.after;
        }
      }
      const reserve=deriveMarketReserve(s,expected,payroll), active=expected.jobs.find(j=>j.completedTurn===null);
      if (!same(r.clockAfter,expected.clock) || r.currentDigestAfter!==digest(expected) || !same(r.reserveAfter,reserve)
        || reserve.spendableGold<0 || 25-(i+1)<s.advanceLimit-expected.clock.advancedCount || s.advanceLimit-expected.clock.advancedCount<(active?.remainingTurns ?? 0)) fail();
    }
    if (!same(c,expected)) fail();
    if (c.jobs.length>1 || c.ledger.facilities.length!==s.facilities.length+c.jobs.length) fail();
    unique(c.ledger.facilities.map(f=>f.id),'invariant-mismatch'); unique(c.ledger.facilities.map(f=>f.lotId),'invariant-mismatch');
    for (let i=0;i<c.ledger.officers.length;i++) {
      const o=c.ledger.officers[i]!, original=s.officers[i];
      if (!original || o.id!==original.id || o.leadership!==original.leadership || o.charm!==original.charm || o.war!==original.war || o.intelligence!==original.intelligence || o.politics!==original.politics) fail();
      for (const key of XP) { integer(o[key],MAX); if (key!=='politicsXp' && key!=='leadershipXp' && o[key]!==original!.initial[key]) fail(); }
      integer(o.merit,MAX); marker(o.actedTurn,c.clock.turn);
      const active=c.jobs.find(j=>j.completedTurn===null && j.officerIds.includes(o.id));
      if (o.reservationJobId!==(active?.id ?? null)) fail();
    }
    for (const job of c.jobs) {
      const f=c.ledger.facilities.find(f=>f.id===job.facilityId);
      if (!f || f.lotId!==job.lotId || f.cityId!==s.city.id || f.kind!=='market' || f.typeId!==31 || f.targetLevel!==1) fail();
      if (job.completedTurn===null) {
        const elapsed=c.clock.turn-job.startTurn;
        if (job.remainingTurns!==job.dueTurn-c.clock.turn || job.remainingTurns<=0 || job.work.current!==Math.min(500,125+elapsed*job.work.perAdvance)
          || job.work.current>=500 || job.completion!==null || f!.status!=='developing' || f!.effectiveLevel!==0 || f!.jobId!==job.id) fail();
      } else if (job.completedTurn!==job.dueTurn || job.remainingTurns!==0 || job.work.current!==500 || job.completion===null
        || f!.status!=='complete' || f!.effectiveLevel!==1 || f!.jobId!==null) fail();
    }
    const reserve=deriveMarketReserve(s,c,payroll); if (reserve.spendableGold<0) fail();
  });
}
function inspected(state: State, payroll: FinancePayroll): Exclude<InspectResult,Failure> {
  return {ok:true,revision:state.revision,current:state.current,reserve:deriveMarketReserve(state.genesis,state.current,payroll),
    remainingHistorySlots:25-state.revision,remainingAdvances:state.genesis.advanceLimit-state.current.clock.advancedCount,
    reservedCompletionSlots:state.current.jobs.find(j=>j.completedTurn===null)?.remainingTurns ?? 0,scope:'bounded-shared-patrol-market-income-payroll'};
}
/** Every wrapper is separately admitted, including every historical receipt at the latest prefix. */
function fitRoot(state: State, payroll: FinancePayroll): void {
  budget(state); budget({ok:true,state}); budget(inspected(state,payroll));
  const save: SaveEnvelope={tag:SAVE_TAG,state}; budget(save);
  budget({ok:true,serialized:canonical(save)});
  const last=state.acceptedCommands[state.acceptedCommands.length-1];
  if (last) {
    budget({ok:true,committed:true,duplicate:false,state,receipt:last.receipt});
    budget({ok:true,committed:false,duplicate:false,baseRevision:state.revision-1,projectedCurrent:state.current,receipt:last.receipt});
  }
  for (const entry of state.acceptedCommands) {
    budget({ok:true,committed:false,duplicate:true,state,receipt:entry.receipt});
    budget({ok:true,committed:false,duplicate:true,baseRevision:state.revision,projectedCurrent:state.current,receipt:entry.receipt});
  }
}
function envelopeOuter(value: unknown): {id:Id;expectedRevision:number;command:Record<string,unknown>} {
  const e=object(value,['id','expectedRevision','command']);
  return {id:id(e.id),expectedRevision:integer(e.expectedRevision),command:record(e.command)};
}
function parseCommand(value: Record<string,unknown>): Command {
  if (value.type==='StartMarketDevelopment') {
    const c=object(value,['type','cityId','lotId','facilityId','officerIds']);
    const cityId=id(c.cityId),lotId=id(c.lotId),facilityId=id(c.facilityId),officerIds=array(c.officerIds,3,1,'invalid-officer-count').map(id);
    unique(officerIds); return {type:'StartMarketDevelopment',cityId,lotId,facilityId,officerIds};
  }
  if (value.type==='Patrol') {
    const c=object(value,['type','cityId','officerIds']);
    const cityId=id(c.cityId),officerIds=array(c.officerIds,3,1,'invalid-officer-count').map(id);
    unique(officerIds); return {type:'Patrol',cityId,officerIds};
  }
  if (value.type==='AdvanceSharedMarketTurn') { object(value,['type']); return {type:'AdvanceSharedMarketTurn'}; }
  return stop('unsupported-command');
}
function applyOwned(base: State, value: unknown): {state:State;receipt:Receipt;duplicate:boolean} {
  const e=envelopeOuter(value), previous=base.acceptedCommands.find(entry=>entry.envelope.id===e.id);
  if (previous) {
    if (!same(previous.envelope,e)) stop('command-id-conflict','deduplication');
    return {state:base,receipt:clone(previous.receipt),duplicate:true};
  }
  if (e.expectedRevision!==base.revision) stop('stale-revision','revision');
  if (base.acceptedCommands.length>=25) stop('history-limit','domain');
  const command=parseCommand(e.command), envelope: Envelope={id:e.id,expectedRevision:e.expectedRevision,command};
  if (command.type !== 'AdvanceSharedMarketTurn' && base.current.clock.advancedCount >= base.genesis.advanceLimit)
    stop('episode-closed',command.type === 'Patrol' ? 'domain' : 'construction');
  const state=clone(base), s=state.genesis, before=clone(state.current), payroll=resolveMarketPayroll(s);
  const reserveBefore=deriveMarketReserve(s,before,payroll);
  const branch: Pick<Receipt,'kind'> & ({kind:'market-start';detail:StartDetail}|{kind:'tick';detail:TickDetail}|{kind:'patrol';detail:PatrolDetail}) = command.type==='StartMarketDevelopment'
    ? {kind:'market-start',detail:atStage('construction',()=>startMarket(s,state.current,command,e.id,base.revision,payroll))}
    : command.type==='Patrol' ? {kind:'patrol',detail:atStage('patrol',()=>{
      const detail=applyMarketPatrol(s,state.current,command,e.id);
      requireReserve(deriveMarketReserve(s,state.current,payroll),state.current.ledger.gold,'patrol');
      if (25-(base.revision+1)<s.advanceLimit-state.current.clock.advancedCount) stop('completion-history-slots','patrol');
      return detail;
    })} : {kind:'tick',detail:atStage('tick',()=>advanceMarket(s,state.current,payroll))};
  if (!same(s,base.genesis)) stop('unexpected-phase-effect','invariant');
  const common: ReceiptCommon={envelope:clone(envelope),revisionBefore:base.revision,revisionAfter:base.revision+1,
    policyDigest:digest(s.policy),catalogDigests:{construction:digest(s.constructionCatalog),offices:digest(s.officesCatalog)},sourceDigest:digest(s.sourceBindings),
    sourceBoundary:clone(SOURCE_BOUNDARY),clockBefore:clone(before.clock),clockAfter:clone(state.current.clock),
    currentDigestBefore:digest(before),currentDigestAfter:digest(state.current),
    ownerSnapshot:{activeForceId:s.activeForceId,ownerForceId:s.city.ownerForceId,corpsId:s.corps.id,corpsForceId:s.corps.forceId},
    reserveBefore,reserveAfter:deriveMarketReserve(s,state.current,payroll),scope:'bounded-shared-patrol-market-income-payroll',rngDraws:0,nativeIntegration:false};
  const receipt: Receipt={...common,...clone(branch)};
  state.revision++; state.acceptedCommands.push({envelope:clone(envelope),receipt:clone(receipt)});
  invariants(state,payroll); fitRoot(state,payroll);
  return {state,receipt,duplicate:false};
}
function rebuild(value: unknown): State {
  return atStage('rebuild',()=>{
    const raw=object(value,['tag','schemaVersion','profile','genesis','revision','current','acceptedCommands']);
    literal(raw.tag,STATE_TAG,'unsupported-schema'); literal(raw.schemaVersion,1,'unsupported-schema'); literal(raw.profile,PROFILE,'unsupported-profile');
    const s=scenario(raw.genesis), revision=integer(raw.revision,25), history=array(raw.acceptedCommands,25);
    if (revision!==history.length) stop('state-recomputation-mismatch','rebuild');
    let state=initialState(s,resolveMarketPayroll(s));
    const seen=new Set<Id>();
    for (let i=0;i<history.length;i++) {
      try {
        const entry=object(history[i],['envelope','receipt']), outer=envelopeOuter(entry.envelope);
        if (seen.has(outer.id)) stop('duplicate-accepted-entry','rebuild',{index:i});
        seen.add(outer.id);
        let next: {state:State;receipt:Receipt;duplicate:boolean};
        try { next=applyOwned(state,entry.envelope); }
        catch (error: unknown) {
          const f=caught(error); if (f===caught(null)) throw error;
          if (f.stage==='budget') stop(f.reason,'budget',{...f,index:i});
          if (f.stage==='input') stop(f.reason,'rebuild',{...f,index:i});
          stop('history-recomputation-mismatch','rebuild',{...f,index:i});
        }
        if (next.duplicate) stop('duplicate-accepted-entry','rebuild',{index:i});
        if (!same(entry.receipt,next.receipt)) stop('receipt-recomputation-mismatch','rebuild',{index:i});
        state=next.state;
      } catch (error: unknown) {
        const f=caught(error); if (f===caught(null)) throw error;
        stop(f.reason,f.stage==='budget'?'budget':'rebuild',{...f,index:i});
      }
    }
    if (!same(raw,state)) stop('state-recomputation-mismatch','rebuild');
    return state;
  });
}
function executeData(input: unknown, command: unknown): ExecuteResult {
  try {
    const safeState=detach(input), safeCommand=detach(command), base=rebuild(safeState);
    const result=applyOwned(base,safeCommand);
    const output: ExecuteResult={ok:true,committed:!result.duplicate,duplicate:result.duplicate,state:result.state,receipt:result.receipt};
    budget(output); return output;
  } catch (error: unknown) { return caught(error); }
}
export function createBoundedPatrolMarketIncomePayrollV1(input: unknown): BoundedPatrolMarketIncomePayrollCreateOrLoadResultV1 {
  try { const s=scenario(detach(input)); return output({ok:true as const,state:initialState(s,resolveMarketPayroll(s))}); }
  catch (error: unknown) { return caught(error); }
}
export function inspectBoundedPatrolMarketIncomePayrollV1(input: unknown): BoundedPatrolMarketIncomePayrollInspectResultV1 {
  try { const state=rebuild(detach(input)); return output(inspected(state,resolveMarketPayroll(state.genesis))); }
  catch (error: unknown) { return caught(error); }
}
export function executeBoundedPatrolMarketIncomePayrollV1(input: unknown, command: unknown): BoundedPatrolMarketIncomePayrollExecuteResultV1 {
  try { return output(executeData(input,command)); } catch (error: unknown) { return caught(error); }
}
export function previewBoundedPatrolMarketIncomePayrollV1(input: unknown, command: unknown): BoundedPatrolMarketIncomePayrollPreviewResultV1 {
  try {
    const safeState=detach(input),safeCommand=detach(command),base=rebuild(safeState), result=applyOwned(base,safeCommand);
    const preview: PreviewResult={ok:true,committed:false,duplicate:result.duplicate,baseRevision:base.revision,projectedCurrent:result.state.current,receipt:result.receipt};
    return output(preview);
  } catch (error: unknown) { return caught(error); }
}
export function saveBoundedPatrolMarketIncomePayrollV1(input: unknown): BoundedPatrolMarketIncomePayrollSaveResultV1 {
  try { const state=rebuild(detach(input)), envelope: SaveEnvelope={tag:SAVE_TAG,state}; budget(envelope); return output({ok:true as const,serialized:canonical(envelope)}); }
  catch (error: unknown) { return caught(error); }
}
export function loadBoundedPatrolMarketIncomePayrollV1(serialized: string): BoundedPatrolMarketIncomePayrollCreateOrLoadResultV1 {
  try {
    const decoded=decodeBoundedMarketJson(serialized); if (!decoded.ok) stop(decoded.reason,decoded.reason==='budget-exceeded'?'budget':'input');
    const save=object(decoded.value,['tag','state']); literal(save.tag,SAVE_TAG,'unsupported-schema');
    return output({ok:true as const,state:rebuild(save.state)});
  } catch (error: unknown) { return caught(error); }
}
export function replayBoundedPatrolMarketIncomePayrollV1(input: unknown): BoundedPatrolMarketIncomePayrollReplayResultV1 {
  try {
    const trace=object(detach(input),['tag','scenario','attempts','expectedFinalState']); literal(trace.tag,TRACE_TAG,'unsupported-schema');
    const s=scenario(trace.scenario);
    const attempts=array(trace.attempts,32).map(value=>object(value,['envelope','expected']));
    let state=initialState(s,resolveMarketPayroll(s)); const outcomes: ReplayOutcome[]=[];
    for (let i=0;i<attempts.length;i++) {
      const attempt=attempts[i]!, result=executeData(state,attempt.envelope);
      const outcome: ReplayOutcome=result.ok ? {ok:true,duplicate:result.duplicate,receipt:clone(result.receipt)} : result;
      if (attempt.expected!==null && !same(attempt.expected,outcome)) stop('trace-outcome-mismatch','comparison',{index:i});
      if (result.ok) state=result.state;
      outcomes.push(clone(outcome)); budget({ok:true,state,outcomes});
    }
    if (trace.expectedFinalState!==null && !same(trace.expectedFinalState,state)) stop('trace-final-mismatch','comparison');
    return output({ok:true as const,state,outcomes});
  } catch (error: unknown) {
    const failure: Failure & {state:null}={...caught(error),state:null};
    const fit=fitBoundedMarketData(failure);
    // An admitted replay failure envelope has at most 17 nodes. Missing structural
    // intrinsics must return a failure rather than throw from this catch path.
    return freeze(fit.ok ? failure : {...caught(null),state:null});
  }
}
