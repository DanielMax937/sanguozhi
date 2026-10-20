import { applyPatrolPhase } from './city-patrol-phase.ts';
import { emptyCalculation } from './city-domestic-leaves.ts';
import type { PatrolPhaseView } from './city-patrol-phase-types.ts';
import type { PatrolReason, PatrolCommand, PatrolWrite, PatrolKernelCall, PatrolInput, PatrolOutput, PatrolAudit, PatrolCalculation, PatrolFees, PatrolReward, PatrolEvidence, PatrolDetail, PatrolActorChange, OfficerRow, Progress } from './bounded-seasonal-patrol-market-types.ts';
/** Dynamic current-market observations and complete payroll over the owner's actual gold target. */
import { compareFinanceOfficerIds, resolveFinancePayroll } from './finance-money-payroll-leaves.ts';
import { applyFinanceMoneyPhase, applyFinanceFullSalaryPhase } from './finance-money-payroll-phases.ts';
import { applyFinanceSeasonalSecurityPhase } from './finance-seasonal-security-phases.ts';
import type { FinanceMoneyFacts, FinancePayroll } from './finance-money-payroll-types.ts';
import type { Scenario, Current, Reserve, MonthlyReceipt, MoneyInput, MoneyResult, MoneySlot,
  MoneySlotReceipt, MoneyEvidence, MoneyKernelCall, GoldWrite, Salary, Thirty, Stage,
  SeasonalSecurityDetail, SeasonalSecurityReceipt, SeasonalSecurityWrite, RngDrawReceipt } from './bounded-seasonal-patrol-market-types.ts';
import { OFFICES_CATALOG, PATROL_SOURCE_EVIDENCE } from './bounded-seasonal-patrol-market-data.ts';
import { stop } from './bounded-seasonal-patrol-market-errors.ts';
import { clone, same, detachBoundedMarketData } from './bounded-seasonal-patrol-market-json.ts';

function safe(value: unknown, stage: Stage): unknown {
  const result = detachBoundedMarketData(value);
  if (!result.ok) stop(result.reason === 'budget-exceeded' ? 'budget-exceeded' : 'unsupported-kernel-return', result.reason === 'budget-exceeded' ? 'budget' : stage);
  return result.value;
}
function object(value: unknown, keys: readonly string[], stage: Stage): Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) stop('unsupported-kernel-return', stage);
  const r = value as Record<string, unknown>;
  if (!same(Object.keys(r).sort(), [...keys].sort())) stop('unsupported-kernel-return', stage);
  return r;
}
/** Only call after safe data admission; never interrogate a raw phase result. */
function rejected(value: unknown): boolean {
  return value!==null && typeof value==='object' && !Array.isArray(value) && 'ok' in value && value.ok===false;
}
function literal<T extends string | number | boolean | null>(value: unknown, expected: T, stage: Stage): T {
  if (value !== expected || typeof value === 'number' && Object.is(value, -0)) stop('unsupported-kernel-return', stage);
  return expected;
}
function exactNumber(value: unknown, expected: number, stage: Stage): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || Object.is(value, -0) || value !== expected) stop('unsupported-kernel-return', stage);
  return value;
}
function list(value: unknown, length: number, stage: Stage): unknown[] {
  if (!Array.isArray(value) || value.length !== length) stop('unsupported-kernel-return', stage);
  return value;
}
function thirty<T>(read: (i: number) => T): Thirty<T> {
  return [read(0),read(1),read(2),read(3),read(4),read(5),read(6),read(7),read(8),read(9),
    read(10),read(11),read(12),read(13),read(14),read(15),read(16),read(17),read(18),read(19),
    read(20),read(21),read(22),read(23),read(24),read(25),read(26),read(27),read(28),read(29)];
}

export function resolveMarketPayroll(s: Scenario): FinancePayroll {
  const ordered = s.officers.map(o => ({ id: o.id, officeId: o.officeId })).sort(compareFinanceOfficerIds);
  const orderedBefore=clone(ordered);
  const raw = resolveFinancePayroll(ordered);
  // A phase return is inspected as safe data before reading its fields.
  const result = safe(raw, 'payroll');
  if (!same(safeEffect(ordered),orderedBefore)) stop('unexpected-phase-effect','invariant');
  if (rejected(result)) {
    if (!same(result, { ok: false, reason: 'unsupported-payroll-identity' })) stop('unsupported-kernel-return', 'payroll');
    stop('unsupported-payroll-identity', 'payroll');
  }
  const r = object(result, ['ok', 'payroll'], 'payroll'); literal(r.ok, true, 'payroll');
  const p = object(r.payroll, ['items', 'sum'], 'payroll');
  const items = list(p.items, ordered.length, 'payroll').map((value, i) => {
    const o = ordered[i]!;
    const row = OFFICES_CATALOG.offices.find(row => row.officeId === o.officeId);
    if (!row) stop('unsupported-payroll-identity', 'payroll', { officerId: o.id });
    const v = object(value, ['officerId', 'officeId', 'officeName', 'catalogSalary'], 'payroll');
    return { officerId: literal(v.officerId, o.id, 'payroll'), officeId: exactNumber(v.officeId, o.officeId, 'payroll'),
      officeName: literal(v.officeName, row.name, 'payroll'), catalogSalary: exactNumber(v.catalogSalary, row.monthlySalary, 'payroll') };
  });
  const sum = exactNumber(p.sum, items.reduce((n, row) => n + row.catalogSalary, 0), 'payroll');
  if (sum < 10 || sum > 480) stop('unsupported-payroll-identity', 'payroll');
  return { items, sum };
}

export function deriveMarketReserve(s: Scenario, current: Current, payroll: FinancePayroll): Reserve {
  const remainingAdvances = s.advanceLimit - current.clock.advancedCount;
  const dayOffset = current.clock.date.day === 1 ? 0 : current.clock.date.day === 11 ? 1 : 2;
  const monthStarts = Math.floor((dayOffset + remainingAdvances) / 3);
  const required = monthStarts * payroll.sum, gold = current.ledger.gold;
  return { monthlySalary: payroll.sum, remainingAdvances, monthStarts, required, gold, spendableGold: gold - required };
}

export function deriveMarketMoneyFacts(s: Scenario, current: Current): FinanceMoneyFacts {
  const facilities = s.facilityLotSlots.map(lotId => {
    if (lotId === null) return null;
    const f = current.ledger.facilities.find(f => f.lotId === lotId);
    if (!f) return null;
    const lot = s.lots.find(lot => lot.id === lotId);
    if (!lot) stop('invalid-facility-slots', 'money');
    return { kind: f.kind, level: f.targetLevel, complete: f.status === 'complete', position: clone(lot.position) };
  });
  return { facilities, baseMoneyWord: s.baseMoneyWord, difficulty: s.difficulty,
    controller: s.controller, securityBeforeIncome: current.ledger.security };
}
function moneyFailure(reason: unknown): never {
  switch (reason) {
    case 'unsupported-facility': case 'unsupported-kernel-return': case 'invalid-resource-boundary': stop(reason, 'money');
    case 'money-kernel:invalid-input': stop('money-kernel-rejected', 'money', { kernelReason: 'invalid-input' });
    case 'money-kernel:unexpected-field': stop('money-kernel-rejected', 'money', { kernelReason: 'unexpected-field' });
    case 'money-kernel:unsupported-profile': stop('money-kernel-rejected', 'money', { kernelReason: 'unsupported-profile' });
    case 'money-kernel:missing-type-row': stop('money-kernel-rejected', 'money', { kernelReason: 'missing-type-row' });
    case 'money-kernel:missing-adjacent-mint': stop('money-kernel-rejected', 'money', { kernelReason: 'missing-adjacent-mint' });
    case 'money-kernel:unsupported-arithmetic-domain': stop('money-kernel-rejected', 'money', { kernelReason: 'unsupported-arithmetic-domain' });
    default: stop('unsupported-kernel-return', 'money');
  }
}
function readMoneyInput(value: unknown, s: Scenario, current: Current): MoneyInput {
  const v = object(value, ['profile','baseMoneyWord','slots','resolvedTypeRows','difficultyWord','securityByte'], 'money');
  const rawSlots = list(v.slots, 30, 'money');
  const slots = thirty<MoneySlot>(i => {
    const lotId = s.facilityLotSlots[i];
    const f = lotId === null ? undefined : current.ledger.facilities.find(f => f.lotId === lotId);
    const raw = rawSlots[i];
    if (!f) return literal(raw, null, 'money');
    if (f.status === 'developing') {
      const slot = object(raw, ['facilityTypeWord','constructionWord'], 'money');
      return { facilityTypeWord: literal(slot.facilityTypeWord, 31, 'money'), constructionWord: literal(slot.constructionWord, 0, 'money') };
    }
    const slot = object(raw, ['facilityTypeWord','constructionWord','adjacentMint'], 'money');
    return { facilityTypeWord: literal(slot.facilityTypeWord, 31, 'money'), constructionWord: literal(slot.constructionWord, 1, 'money'), adjacentMint: literal(slot.adjacentMint, false, 'money') };
  });
  const rows = object(v.resolvedTypeRows, ['31','50','51','46','47','48'], 'money');
  function row<T extends number>(key: string, yieldValue: T): { valid: true; moneyYieldWord: T } {
    const r = object(rows[key], ['valid','moneyYieldWord'], 'money');
    return { valid: literal(r.valid, true, 'money'), moneyYieldWord: literal(r.moneyYieldWord, yieldValue, 'money') };
  }
  return { profile: literal(v.profile, 'city-money-income-stable-resolved-i32-safe-v1', 'money'),
    baseMoneyWord: exactNumber(v.baseMoneyWord, s.baseMoneyWord, 'money'), slots,
    resolvedTypeRows: { 31: row('31',100), 50: row('50',120), 51: row('51',150), 46: row('46',300), 47: row('47',200), 48: row('48',80) },
    difficultyWord: literal(v.difficultyWord, 1, 'money'), securityByte: exactNumber(v.securityByte, current.ledger.security, 'money') };
}
function readMoneyEvidence(value: unknown): MoneyEvidence {
  const expected: MoneyEvidence = { level: 'source-listing-reconstruction', profile: 'city-money-income-stable-resolved-i32-safe-v1',
    source: 'docs/sources/city-money-income-projection.json', originalRange: '0049E590 <= PC < 0049E745',
    fullCallerBytesVerified: true, entryGatesIntegrated: false, stableResolvedInputsRequired: true,
    stockOriginalVerified: false, originalExecutableExecuted: false, nativeHelpersReconstructed: false,
    abiVerified: false, realTraceReachabilityVerified: false, typeTableStockVerified: false,
    adjacencyHelperRecovered: false, rngRecovered: false, monthlySchedulerIntegrated: false,
    incomeWriterIntegrated: false, commandIntegrated: false, modBehaviorIncluded: false };
  const v = object(value, Object.keys(expected), 'money');
  // Each field is reconstructed from the actual returned evidence, with exact literals.
  return {
    level: literal(v.level, expected.level, 'money'), profile: literal(v.profile, expected.profile, 'money'),
    source: literal(v.source, expected.source, 'money'), originalRange: literal(v.originalRange, expected.originalRange, 'money'),
    fullCallerBytesVerified: literal(v.fullCallerBytesVerified, true, 'money'), entryGatesIntegrated: literal(v.entryGatesIntegrated, false, 'money'),
    stableResolvedInputsRequired: literal(v.stableResolvedInputsRequired, true, 'money'), stockOriginalVerified: literal(v.stockOriginalVerified, false, 'money'),
    originalExecutableExecuted: literal(v.originalExecutableExecuted, false, 'money'), nativeHelpersReconstructed: literal(v.nativeHelpersReconstructed, false, 'money'),
    abiVerified: literal(v.abiVerified, false, 'money'), realTraceReachabilityVerified: literal(v.realTraceReachabilityVerified, false, 'money'),
    typeTableStockVerified: literal(v.typeTableStockVerified, false, 'money'), adjacencyHelperRecovered: literal(v.adjacencyHelperRecovered, false, 'money'),
    rngRecovered: literal(v.rngRecovered, false, 'money'), monthlySchedulerIntegrated: literal(v.monthlySchedulerIntegrated, false, 'money'),
    incomeWriterIntegrated: literal(v.incomeWriterIntegrated, false, 'money'), commandIntegrated: literal(v.commandIntegrated, false, 'money'),
    modBehaviorIncluded: literal(v.modBehaviorIncluded, false, 'money') };
}
function readMoneyResult(value: unknown, input: MoneyInput): MoneyResult {
  const v = object(value, ['supported','profile','baseMoneyWord','difficultyWord','securityByte','slots','rawMoney','difficultyPercent','effectiveSecurity','intermediates','returnedIncome','evidence'], 'money');
  const rawSlots = list(v.slots, 30, 'money');
  const slots = thirty<MoneySlotReceipt>(i => {
    const source = input.slots[i];
    if (source === undefined) stop('unsupported-kernel-return', 'money');
    const v = object(rawSlots[i], ['index','facilityTypeWord','effectiveType','status','moneyYieldWord','mintApplied','contribution'], 'money');
    const complete = source !== null && source.constructionWord === 1;
    return { index: exactNumber(v.index, i, 'money'), facilityTypeWord: literal(v.facilityTypeWord, source === null ? null : 31, 'money'),
      effectiveType: literal(v.effectiveType, complete ? 31 : null, 'money'),
      status: literal(v.status, source === null ? 'invalid-slot' : complete ? 'yield' : 'unfinished', 'money'),
      moneyYieldWord: literal(v.moneyYieldWord, complete ? 100 : null, 'money'), mintApplied: literal(v.mintApplied, false, 'money'),
      contribution: literal(v.contribution, complete ? 100 : 0, 'money') };
  });
  const expectedRaw = input.baseMoneyWord + slots.reduce((n, slot) => n + slot.contribution, 0);
  const expectedSecurity = Math.max(50, input.securityByte);
  const rawMoney = exactNumber(v.rawMoney, expectedRaw, 'money');
  const effectiveSecurity = exactNumber(v.effectiveSecurity, expectedSecurity, 'money');
  const m = object(v.intermediates, ['scaledRaw','difficultyProduct','difficultyAdjusted','securityProduct','securityAdjusted'], 'money');
  const scaledRaw = exactNumber(m.scaledRaw, rawMoney * 100, 'money');
  const difficultyAdjusted = exactNumber(m.difficultyAdjusted, scaledRaw, 'money');
  const securityProduct = exactNumber(m.securityProduct, difficultyAdjusted * effectiveSecurity, 'money');
  const securityAdjusted = exactNumber(m.securityAdjusted, Math.floor(securityProduct / 100), 'money');
  return { supported: literal(v.supported, true, 'money'), profile: literal(v.profile, input.profile, 'money'),
    baseMoneyWord: exactNumber(v.baseMoneyWord, input.baseMoneyWord, 'money'), difficultyWord: literal(v.difficultyWord, 1, 'money'),
    securityByte: exactNumber(v.securityByte, input.securityByte, 'money'), slots, rawMoney,
    difficultyPercent: literal(v.difficultyPercent, 100, 'money'), effectiveSecurity,
    intermediates: { scaledRaw, difficultyProduct: literal(m.difficultyProduct, null, 'money'), difficultyAdjusted, securityProduct, securityAdjusted },
    returnedIncome: exactNumber(v.returnedIncome, Math.floor(securityAdjusted / 100), 'money'), evidence: readMoneyEvidence(v.evidence) };
}
function readGoldWrite(value: unknown, before: number, cap: number, requested: number, reason: 'money-base' | 'salary'): GoldWrite {
  const stage = reason === 'salary' ? 'payroll' : 'money';
  const v = object(value, ['resource','reason','before','requested','accepted','actualDelta','after','cap','discarded','writerPolicyId'], stage);
  const accepted = reason === 'salary' ? requested : Math.min(requested, cap - before);
  const delta = reason === 'salary' ? -accepted : accepted;
  return { resource: literal(v.resource, 'gold', stage), reason: literal(v.reason, reason, stage),
    before: exactNumber(v.before, before, stage), requested: exactNumber(v.requested, requested, stage),
    accepted: exactNumber(v.accepted, accepted, stage), actualDelta: exactNumber(v.actualDelta, delta, stage),
    after: exactNumber(v.after, before + delta, stage), cap: exactNumber(v.cap, cap, stage),
    discarded: exactNumber(v.discarded, requested - accepted, stage),
    writerPolicyId: literal(v.writerPolicyId, reason === 'salary' ? 'exact-affordable-salary-debit-v1' : 'saturating-positive-credit-v1', stage) };
}
function readSalary(value: unknown, payroll: FinancePayroll, due: boolean, available: number): Salary {
  const v = object(value, ['status','items','sum','availableBeforeSalary','paid','shortfall','payerPolicyId'], 'payroll');
  if (!same(v.items, payroll.items)) stop('unsupported-kernel-return', 'payroll');
  const common = { items: clone(payroll.items), sum: exactNumber(v.sum, payroll.sum, 'payroll'),
    shortfall: literal(v.shortfall, 0, 'payroll'), payerPolicyId: literal(v.payerPolicyId, 'complete-named-office-payroll-v1', 'payroll') };
  if (!due) return { ...common, status: literal(v.status, 'not-due', 'payroll'),
    availableBeforeSalary: literal(v.availableBeforeSalary, null, 'payroll'), paid: literal(v.paid, 0, 'payroll') };
  return { ...common, status: literal(v.status, 'paid', 'payroll'),
    availableBeforeSalary: exactNumber(v.availableBeforeSalary, available, 'payroll'), paid: exactNumber(v.paid, payroll.sum, 'payroll') };
}
function onlyGoldChanged(before: Current, candidate: Current, after?: number): void {
  const data = detachBoundedMarketData(candidate);
  if (!data.ok) stop('unexpected-phase-effect', 'invariant');
  // Safe descriptor admission precedes reading the actual target, even on a
  // rejected phase. Only its gold slot may differ; exact deltas are checked later.
  const expected = clone(before); expected.ledger.gold = after ?? candidate.ledger.gold;
  if (!same(data.value, expected)) stop('unexpected-phase-effect', 'invariant');
}

/** Validate the narrow phase result and every mutation against fixed policy/tape facts.
 * The public owner independently audits the same facts without invoking this phase. */
function settleSeasonalSecurity(s: Scenario, candidate: Current): SeasonalSecurityDetail {
  const before = clone(candidate), governorFacts = s.officers.find(o=>o.id===s.governorOfficerId);
  const governor = governorFacts ? {id:governorFacts.id,charm:governorFacts.charm} : null;
  const governorBefore = clone(governor);
  const quarterStart = candidate.clock.date.day===1 && [1,4,7,10].includes(candidate.clock.date.month);
  const drawsConsumed: RngDrawReceipt[] = [];
  function plannedDraw(bound: 100|3, purpose: RngDrawReceipt['purpose']): number {
    const index=before.rng.cursor+drawsConsumed.length, row=s.rng.draws[index];
    if (!row) stop('rng-tape-exhausted','seasonal-security',{index});
    if (row.bound!==bound) stop('rng-bound-mismatch','seasonal-security',{index});
    drawsConsumed.push({index,bound,value:row.value,purpose});
    return row.value;
  }
  const security: SeasonalSecurityReceipt = {status:'not-due',governorId:s.governorOfficerId,charm:null,
    adminRoll:null,lossRoll:null,requestedLoss:0,actualLoss:0,before:before.ledger.security,after:before.ledger.security};
  let write: SeasonalSecurityWrite|null = null;
  if (quarterStart) {
    security.charm=governor?.charm ?? 0;
    security.adminRoll=s.hasAdministrativeReform ? plannedDraw(100,'administrative-reform') : null;
    if (security.adminRoll!==null && security.adminRoll<50) security.status='administrative-reform-skip';
    else {
      security.status='applied'; security.lossRoll=plannedDraw(3,'seasonal-loss');
      security.requestedLoss=Math.min(5,Math.floor(Math.max(1,90-security.charm)/10)+security.lossRoll);
      security.actualLoss=Math.min(security.before,security.requestedLoss);
      security.after=security.before-security.actualLoss;
      write={resource:'security',reason:'seasonal-security',before:security.before,requested:security.requestedLoss,
        accepted:security.actualLoss,actualDelta:security.actualLoss===0?0:-security.actualLoss,after:security.after,
        cap:100,discarded:security.requestedLoss-security.actualLoss,writerPolicyId:'seasonal-security-bounded-tape-v1'};
    }
  }
  let called = 0;
  const raw = applyFinanceSeasonalSecurityPhase({
    quarterStart,governor,hasAdministrativeReform:s.hasAdministrativeReform,securityTarget:candidate.ledger,
    writerPolicyId:s.policy.seasonalSecurity.writer,
    draw(bound,purpose) {
      const row=drawsConsumed[called];
      if (!row || row.bound!==bound || row.purpose!==purpose || candidate.rng.cursor!==row.index)
        stop('unsupported-kernel-return','seasonal-security');
      candidate.rng.drawsConsumed.push(clone(row)); candidate.rng.cursor++; called++;
      return row.value;
    }
  });
  const returned=safe(raw,'seasonal-security');
  if (!same(returned,{security,write}) || called!==drawsConsumed.length) stop('unsupported-kernel-return','seasonal-security');
  const expected=clone(before);
  expected.ledger.security=security.after; expected.rng.cursor+=drawsConsumed.length;
  expected.rng.drawsConsumed.push(...clone(drawsConsumed));
  if (!same(safe(candidate,'seasonal-security'),expected) || !same(safe(governor,'seasonal-security'),governorBefore))
    stop('unexpected-phase-effect','invariant');
  return {security,write,rngBefore:before.rng.cursor,rngAfter:expected.rng.cursor,drawsConsumed};
}

/** Provisional explicit order: completion (owner), money, seasonal security, salary. */
export function settleMarketMonth(s: Scenario, candidate: Current, payroll: FinancePayroll):
  {monthly:MonthlyReceipt;seasonalSecurity:SeasonalSecurityDetail} {
  const monthStart = candidate.clock.date.day === 1, beforeMoney = clone(candidate), payrollBefore = clone(payroll);
  const facts = deriveMarketMoneyFacts(s, candidate);
  const moneyRaw = applyFinanceMoneyPhase({ ...facts, monthStart, taxationActive: false, wealthyActive: false, goldTarget: candidate.ledger });
  onlyGoldChanged(beforeMoney, candidate);
  const money = safe(moneyRaw, 'money');
  if (rejected(money)) {
    const failure=object(money,['ok','reason'],'money');
    moneyFailure(failure.reason);
  }
  const m = object(money, ['ok','kernel','writes'], 'money'); literal(m.ok, true, 'money');
  let called: MoneyKernelCall | null = null, incomeWrite: GoldWrite | null = null;
  if (!monthStart) {
    if (!same(m.kernel, { status: 'not-due', reason: 'nonmonthly-without-taxation' }) || !same(m.writes, [])) stop('unsupported-kernel-return', 'money');
    onlyGoldChanged(beforeMoney, candidate, beforeMoney.ledger.gold);
  } else {
    const k = object(m.kernel, ['status','api','profile','adapterObservationKind','input','result'], 'money');
    const input = readMoneyInput(k.input, s, beforeMoney), result = readMoneyResult(k.result, input);
    called = { status: literal(k.status, 'called', 'money'), api: literal(k.api, 'calculateCityMoneyIncomeProjection', 'money'),
      profile: literal(k.profile, input.profile, 'money'), adapterObservationKind: literal(k.adapterObservationKind, 'derived-adapter-observations', 'money'), input, result };
    incomeWrite = readGoldWrite(list(m.writes, 1, 'money')[0], beforeMoney.ledger.gold, beforeMoney.ledger.goldCapacity, result.returnedIncome, 'money-base');
    onlyGoldChanged(beforeMoney, candidate, incomeWrite.after);
  }
  const seasonalSecurity = settleSeasonalSecurity(s,candidate);
  const beforeSalary = clone(candidate);
  const salaryRaw = applyFinanceFullSalaryPhase({ monthStart, payroll, goldTarget: candidate.ledger });
  onlyGoldChanged(beforeSalary, candidate);
  const salaryValue = safe(salaryRaw, 'payroll');
  if (!same(safe(payroll, 'payroll'), payrollBefore)) stop('unexpected-phase-effect', 'invariant');
  if (rejected(salaryValue)) {
    const available = beforeSalary.ledger.gold;
    const proposal = { required: payroll.sum, available, shortfall: payroll.sum - available };
    if (proposal.shortfall <= 0 || !same(salaryValue, { ok: false, reason: 'unsupported-salary-shortfall', proposal })) stop('unsupported-kernel-return', 'payroll');
    stop('unsupported-salary-shortfall', 'payroll', { proposal });
  }
  const p = object(salaryValue, ['ok','salary','write'], 'payroll'); literal(p.ok, true, 'payroll');
  const salary = readSalary(p.salary, payroll, monthStart, beforeSalary.ledger.gold);
  const common = { securityBeforeIncome: beforeMoney.ledger.security, payerCityId: s.city.id,
    payrollOfficerIds: payroll.items.map(item => item.officerId), incomeEffects: { taxation: false, wealthy: false } as const };
  if (!monthStart) {
    literal(p.write, null, 'payroll'); onlyGoldChanged(beforeSalary, candidate, beforeSalary.ledger.gold);
    if (salary.status !== 'not-due') stop('unsupported-kernel-return', 'payroll');
    return { monthly:{ ...common, status: 'not-due', settlement: null, facilityIds: null,
      moneyKernel: { status: 'not-due', reason: 'nonmonthly-without-taxation' }, writes: [], salary },seasonalSecurity };
  }
  const salaryWrite = readGoldWrite(p.write, beforeSalary.ledger.gold, beforeSalary.ledger.goldCapacity, payroll.sum, 'salary');
  onlyGoldChanged(beforeSalary, candidate, salaryWrite.after);
  if (!called || !incomeWrite || salary.status !== 'paid') stop('unsupported-kernel-return', 'payroll');
  const facilityIds = thirty(i => { const lotId = s.facilityLotSlots[i];
    return lotId === null ? null : candidate.ledger.facilities.find(f => f.lotId === lotId)?.id ?? null; });
  return { monthly:{ ...common, status: 'settled', settlement: { cityId: s.city.id, year: candidate.clock.date.year, month: candidate.clock.date.month },
    facilityIds, moneyKernel: called, writes: [incomeWrite, salaryWrite], salary },seasonalSecurity };
}

/** A transient narrow view, never a second owner, clock or wallet. */
function patrolView(s: Scenario, current: Current): PatrolPhaseView {
  return {activeForceId:s.activeForceId,corps:{actionPoints:current.ledger.actionPoints},
    city:{id:s.city.id,gold:current.ledger.gold,security:current.ledger.security,patrolUsedTurn:current.ledger.patrolUsedTurn},
    officers:current.ledger.officers.map(row=>{
      const facts=s.officers.find(o=>o.id===row.id);
      if (!facts) stop('invariant-mismatch','invariant');
      return {id:row.id,forceId:facts.forceId,cityId:facts.cityId,available:facts.available,leadership:row.leadership,
        xp:{leadership:row.leadershipXp,charm:row.charmXp,intelligence:row.intelligenceXp,politics:row.politicsXp,war:row.warXp},
        merit:row.merit,actedTurn:row.actedTurn,reservationJobId:row.reservationJobId};
    }),pressureActive:s.pressureActive,
    policies:{writer:clone(s.policy.patrol.writer),rewards:clone(s.policy.patrol.rewards),zeroYield:clone(s.policy.patrol.zeroYield)}};
}
function patrolReason(value: unknown): PatrolReason {
  switch (value) {
    case 'unknown-city': case 'patrol-already-used': case 'unknown-officer': case 'officer-not-member':
    case 'officer-not-present': case 'officer-unavailable': case 'officer-production-reserved': case 'officer-already-acted':
    case 'kernel-rejected': case 'writer-cap-overflow': case 'zero-yield': case 'insufficient-gold': case 'insufficient-ap': return value;
    default: return stop('unsupported-kernel-return','patrol');
  }
}
function patrolNumber(value: unknown, maximum: number): number {
  if (typeof value!=='number' || !Number.isSafeInteger(value) || Object.is(value,-0) || value<0 || value>maximum)
    stop('unexpected-phase-effect','invariant');
  return value;
}
function patrolProgress(row: OfficerRow): Progress {
  return {leadershipXp:row.leadershipXp,charmXp:row.charmXp,intelligenceXp:row.intelligenceXp,
    politicsXp:row.politicsXp,warXp:row.warXp,merit:row.merit,actedTurn:row.actedTurn};
}
function safeEffect(value: unknown): unknown {
  const data=detachBoundedMarketData(value);
  if (!data.ok) stop(data.reason==='budget-exceeded'?'budget-exceeded':'unexpected-phase-effect',data.reason==='budget-exceeded'?'budget':'invariant');
  return data.value;
}
function effectObject(value: unknown, keys: readonly string[]): Record<string,unknown> {
  if (value===null || typeof value!=='object' || Array.isArray(value)) stop('unexpected-phase-effect','invariant');
  const r=value as Record<string,unknown>;
  if (!same(Object.keys(r).sort(),[...keys].sort())) stop('unexpected-phase-effect','invariant');
  return r;
}
function effectList(value: unknown, length: number): unknown[] {
  if (!Array.isArray(value) || value.length!==length) stop('unexpected-phase-effect','invariant');
  return value;
}
/** Permit only the phase's documented staging writes, including before a rejection.
 * All other fields, every unselected officer, policy and reservation stay exact. */
function admittedPatrolView(before: PatrolPhaseView, raw: unknown, command: PatrolCommand, turn: number): void {
  const v=effectObject(raw,['activeForceId','corps','city','officers','pressureActive','policies']);
  const city=effectObject(v.city,['id','gold','security','patrolUsedTurn']);
  const corps=effectObject(v.corps,['actionPoints']);
  const rows=effectList(v.officers,before.officers.length), expected=clone(before);
  expected.city.gold=patrolNumber(city.gold,1_000_000_000);
  expected.city.security=patrolNumber(city.security,100);
  if (city.patrolUsedTurn!==before.city.patrolUsedTurn && city.patrolUsedTurn!==turn) stop('unexpected-phase-effect','invariant');
  expected.city.patrolUsedTurn=city.patrolUsedTurn===null ? null : patrolNumber(city.patrolUsedTurn,turn);
  expected.corps.actionPoints=patrolNumber(corps.actionPoints,255);
  for (let i=0;i<rows.length;i++) {
    const original=before.officers[i]!, target=expected.officers[i]!;
    if (!command.officerIds.includes(original.id)) continue;
    const o=effectObject(rows[i],['id','forceId','cityId','available','leadership','xp','merit','actedTurn','reservationJobId']);
    const xp=effectObject(o.xp,['leadership','charm','intelligence','politics','war']);
    target.xp.leadership=patrolNumber(xp.leadership,1_000_000_000);
    target.merit=patrolNumber(o.merit,1_000_000_000);
    if (o.actedTurn!==original.actedTurn && o.actedTurn!==turn) stop('unexpected-phase-effect','invariant');
    target.actedTurn=o.actedTurn===null ? null : patrolNumber(o.actedTurn,turn);
  }
  if (!same(raw,expected)) stop('unexpected-phase-effect','invariant');
}
function readPatrolWrite(value: unknown, before: number, requested: number, cap: number, policyId: PatrolWrite['policyId']): PatrolWrite {
  const r=object(value,['before','requested','returned','actualDelta','after','cap','discarded','policyId'],'patrol');
  const actualDelta=requested<0 ? requested : Math.min(requested,cap-before);
  return {before:exactNumber(r.before,before,'patrol'),requested:exactNumber(r.requested,requested,'patrol'),
    returned:exactNumber(r.returned,actualDelta,'patrol'),actualDelta:exactNumber(r.actualDelta,actualDelta,'patrol'),
    after:exactNumber(r.after,before+actualDelta,'patrol'),cap:exactNumber(r.cap,cap,'patrol'),
    discarded:exactNumber(r.discarded,requested-actualDelta,'patrol'),policyId:literal(r.policyId,policyId,'patrol')};
}
function readPatrolCall(value: unknown, s: Scenario, before: Current, selected: OfficerRow[]): PatrolKernelCall {
  const k=object(value,['api','input','output'],'patrol');
  const i=object(k.input,['profile','resolvedLeadershipSlots','publicOrderByte','pressureHelperEax'],'patrol');
  const slots=list(i.resolvedLeadershipSlots,selected.length,'patrol').map((value,n)=>exactNumber(value,selected[n]!.leadership,'patrol'));
  const input: PatrolInput={profile:literal(i.profile,'patrol-security-gain-stable-v1','patrol'),resolvedLeadershipSlots:slots,
    publicOrderByte:exactNumber(i.publicOrderByte,before.ledger.security,'patrol'),pressureHelperEax:literal(i.pressureHelperEax,s.pressureActive?1:0,'patrol')};
  const o=object(k.output,['supported','profile','normalizedLeadershipSlots','publicOrderByte','pressureHelperEax','sumLeadership','baseGain','afterPressure','returnedDelta','pressureApplied','capBranch'],'patrol');
  const normalized=list(o.normalizedLeadershipSlots,3,'patrol'), first=slots[0];
  if (first===undefined) stop('unsupported-kernel-return','patrol');
  const normalizedLeadershipSlots: PatrolOutput['normalizedLeadershipSlots']=[exactNumber(normalized[0],first,'patrol'),
    slots[1]===undefined?literal(normalized[1],null,'patrol'):exactNumber(normalized[1],slots[1],'patrol'),
    slots[2]===undefined?literal(normalized[2],null,'patrol'):exactNumber(normalized[2],slots[2],'patrol')];
  // These equations validate the actual old-kernel result; they never replace its call.
  const sum=slots.reduce((a,b)=>a+b,0), gain=Math.floor(sum/28)+2;
  const pressured=s.pressureActive?Math.floor(gain/2):gain, capped=before.ledger.security+pressured>100;
  const output: PatrolOutput={supported:literal(o.supported,true,'patrol'),profile:literal(o.profile,input.profile,'patrol'),normalizedLeadershipSlots,
    publicOrderByte:exactNumber(o.publicOrderByte,input.publicOrderByte,'patrol'),pressureHelperEax:literal(o.pressureHelperEax,input.pressureHelperEax,'patrol'),
    sumLeadership:exactNumber(o.sumLeadership,sum,'patrol'),baseGain:exactNumber(o.baseGain,gain,'patrol'),afterPressure:exactNumber(o.afterPressure,pressured,'patrol'),
    returnedDelta:exactNumber(o.returnedDelta,capped?100-before.ledger.security:pressured,'patrol'),pressureApplied:literal(o.pressureApplied,s.pressureActive,'patrol'),capBranch:literal(o.capBranch,capped,'patrol')};
  return {api:literal(k.api,'calculatePatrolSecurityGain','patrol'),input,output};
}
function readPatrolAudit(value: unknown, s: Scenario, before: Current, command: PatrolCommand, commandId: string): PatrolAudit {
  const a=object(value,['calculation','fees','rewards','events','sideEffectsNotModeled','rngDraws'],'patrol');
  const selected=command.officerIds.map(id=>{
    const row=before.ledger.officers.find(o=>o.id===id);
    if (!row || row.reservationJobId!==null) stop('unsupported-kernel-return','patrol');
    return row;
  });
  const c=object(a.calculation,['observationKind','selectedOfficerIds','securityKernelReturn','quantityKernelReturn','quantityPreCapacity','priceKernelReturn','timeKernelReturn','facilityApplied','earlyCharmSum','moraleSecuritySnapshot','newRecruitMorale','securityWrite','troopWrite','inventoryWrite','moraleWrite','kernels'],'patrol');
  const selectedOfficerIds=list(c.selectedOfficerIds,selected.length,'patrol').map((v,n)=>literal(v,selected[n]!.id,'patrol'));
  const kernel=readPatrolCall(list(c.kernels,1,'patrol')[0],s,before,selected);
  const calculation: PatrolCalculation={observationKind:literal(c.observationKind,'derived-adapter-observations','patrol'),selectedOfficerIds,
    securityKernelReturn:exactNumber(c.securityKernelReturn,kernel.output.returnedDelta,'patrol'),quantityKernelReturn:literal(c.quantityKernelReturn,null,'patrol'),
    quantityPreCapacity:literal(c.quantityPreCapacity,null,'patrol'),priceKernelReturn:literal(c.priceKernelReturn,null,'patrol'),timeKernelReturn:literal(c.timeKernelReturn,null,'patrol'),
    facilityApplied:literal(c.facilityApplied,false,'patrol'),earlyCharmSum:literal(c.earlyCharmSum,null,'patrol'),moraleSecuritySnapshot:literal(c.moraleSecuritySnapshot,null,'patrol'),
    newRecruitMorale:literal(c.newRecruitMorale,null,'patrol'),securityWrite:readPatrolWrite(c.securityWrite,before.ledger.security,kernel.output.returnedDelta,100,'clip-and-return-actual-v1'),
    troopWrite:literal(c.troopWrite,null,'patrol'),inventoryWrite:literal(c.inventoryWrite,null,'patrol'),moraleWrite:literal(c.moraleWrite,null,'patrol'),kernels:[kernel]};
  const f=object(a.fees,['gold','actionPoints','sourceApRequest','effectiveApCost'],'patrol');
  const fees: PatrolFees={gold:readPatrolWrite(f.gold,before.ledger.gold,-100,1_000_000_000,'exact-affordable-debit-v1'),
    actionPoints:readPatrolWrite(f.actionPoints,before.ledger.actionPoints,-20,255,'exact-affordable-debit-v1'),
    sourceApRequest:literal(f.sourceApRequest,20,'patrol'),effectiveApCost:literal(f.effectiveApCost,20,'patrol')};
  if (fees.gold.after<0 || fees.actionPoints.after<0) stop('unsupported-kernel-return','patrol');
  const rewards: PatrolReward[]=list(a.rewards,selected.length,'patrol').map((value,n)=>{
    const o=selected[n]!, r=object(value,['officerId','attribute','xp','merit'],'patrol');
    return {officerId:literal(r.officerId,o.id,'patrol'),attribute:literal(r.attribute,'leadership','patrol'),
      xp:readPatrolWrite(r.xp,o.leadershipXp,2,1_000_000_000,'saturating-accumulator-v1'),merit:readPatrolWrite(r.merit,o.merit,50,1_000_000_000,'saturating-accumulator-v1')};
  });
  const event=object(list(a.events,1,'patrol')[0],['type','subjectId'],'patrol');
  const effects: PatrolAudit['sideEffectsNotModeled']=['technique-points','native-stat-growth','native-writer-semantics','native-personnel-tasks','native-corps-effects','presentation-rng'];
  if (!same(a.sideEffectsNotModeled,effects)) stop('unsupported-kernel-return','patrol');
  return {calculation,fees,rewards,events:[{type:literal(event.type,'command-committed','patrol'),subjectId:literal(event.subjectId,commandId,'patrol')}],
    sideEffectsNotModeled:effects,rngDraws:literal(a.rngDraws,0,'patrol')};
}
function patrolEvidence(): PatrolEvidence {
  const evidence: PatrolEvidence={entryGates:['005CBA18','005CBA30','005CBA4C'],gateFailureReturn:['005CBAD6..005CBADB'],slotsAndStableLeadership:['005CBA60..005CBA81'],
    leadershipDivisionAndOffset:['005CBA87..005CBA9E'],pressureHelperAndFullEaxTest:['005CBAA2..005CBAAB'],pressureHalving:['005CBAAD..005CBAB4'],
    publicOrderByteAndStrictUpperClip:['005CBABA..005CBACE'],selectAndReturn:['005CBAD0..005CBAD5'],excludedMod:['005CBA83..005CBA97 in separate 修改 section']};
  if (!same(PATROL_SOURCE_EVIDENCE,evidence)) stop('unsupported-source','patrol');
  return evidence;
}
export function applyMarketPatrol(s: Scenario, candidate: Current, command: PatrolCommand, commandId: string): PatrolDetail {
  const before=clone(candidate), sourceBefore=clone(s), view=patrolView(s,candidate), viewBefore=clone(view);
  const action=clone(command), context={commandId,turn:candidate.clock.turn}, calculation=emptyCalculation(), empty=clone(calculation);
  const raw=applyPatrolPhase(context,view,action,calculation);
  // Admit all potentially mutated data before inspecting it or comparing it.
  const result=safe(raw,'patrol'), viewData=safeEffect(view), calculationData=safeEffect(calculation);
  if (!same(safeEffect(candidate),before) || !same(safeEffect(s),sourceBefore)
    || !same(safeEffect(action),command) || !same(safeEffect(context),{commandId,turn:before.clock.turn})) stop('unexpected-phase-effect','invariant');
  admittedPatrolView(viewBefore,viewData,command,before.clock.turn);
  const c=effectObject(calculationData,Object.keys(empty));
  const allowedCalculation={...empty,selectedOfficerIds:c.selectedOfficerIds,securityKernelReturn:c.securityKernelReturn,securityWrite:c.securityWrite,kernels:c.kernels};
  if (!same(calculationData,allowedCalculation)) stop('unexpected-phase-effect','invariant');
  const outer=object(result, rejected(result) ? ['ok','reason'] : ['ok','value'],'patrol');
  if (outer.ok===false) stop('patrol-phase-rejected','patrol',{patrolReason:patrolReason(outer.reason)});
  literal(outer.ok,true,'patrol');
  if (command.cityId!==s.city.id || before.ledger.patrolUsedTurn===before.clock.turn) stop('unsupported-kernel-return','patrol');
  for (const id of command.officerIds) {
    const facts=s.officers.find(o=>o.id===id), row=before.ledger.officers.find(o=>o.id===id);
    if (!facts || !row || facts.forceId!==s.activeForceId || facts.cityId!==s.city.id || !facts.available
      || row.reservationJobId!==null || row.actedTurn===before.clock.turn) stop('unsupported-kernel-return','patrol');
  }
  const audit=readPatrolAudit(outer.value,s,before,command,commandId), expected=clone(before);
  if (!same(calculationData,audit.calculation)) stop('unexpected-phase-effect','invariant');
  expected.ledger.gold=audit.fees.gold.after; expected.ledger.actionPoints=audit.fees.actionPoints.after;
  expected.ledger.security=audit.calculation.securityWrite.after; expected.ledger.patrolUsedTurn=before.clock.turn;
  const actors: PatrolActorChange[]=audit.rewards.map(reward=>{
    const original=before.ledger.officers.find(o=>o.id===reward.officerId), row=expected.ledger.officers.find(o=>o.id===reward.officerId);
    if (!original || !row || original.reservationJobId!==null) stop('unsupported-kernel-return','patrol');
    const prior=patrolProgress(original); row.leadershipXp=reward.xp.after; row.merit=reward.merit.after; row.actedTurn=before.clock.turn;
    return {officerId:row.id,before:prior,after:patrolProgress(row),reservationBefore:null,reservationAfter:null};
  });
  if (!same(viewData,patrolView(s,expected))) stop('unexpected-phase-effect','invariant');
  // Project only checked phase mutations into the one candidate ledger.
  candidate.ledger.gold=view.city.gold; candidate.ledger.actionPoints=view.corps.actionPoints;
  candidate.ledger.security=view.city.security; candidate.ledger.patrolUsedTurn=view.city.patrolUsedTurn;
  for (const actor of actors) {
    const row=candidate.ledger.officers.find(o=>o.id===actor.officerId), actual=view.officers.find(o=>o.id===actor.officerId);
    if (!row || !actual) stop('unexpected-phase-effect','invariant');
    row.leadershipXp=actual.xp.leadership; row.merit=actual.merit; row.actedTurn=actual.actedTurn;
  }
  if (!same(safeEffect(candidate),expected)) stop('unexpected-phase-effect','invariant');
  return {audit,sourceEvidence:patrolEvidence(),evidenceProjection:'fixed-source-evidence-not-phase-output-v1',
    patrolUsedBefore:before.ledger.patrolUsedTurn,patrolUsedAfter:before.clock.turn,actors};
}

