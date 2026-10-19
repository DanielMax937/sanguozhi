/** Dynamic current-market observations and complete payroll over the owner's actual gold target. */
import { compareFinanceOfficerIds, resolveFinancePayroll } from './finance-money-payroll-leaves.ts';
import { applyFinanceMoneyPhase, applyFinanceFullSalaryPhase } from './finance-money-payroll-phases.ts';
import type { FinanceMoneyFacts, FinancePayroll, FinanceMoneyFailureReason } from './finance-money-payroll-types.ts';
import type { Scenario, Current, Reserve, MonthlyReceipt, MoneyInput, MoneyResult, MoneySlot,
  MoneySlotReceipt, MoneyEvidence, MoneyKernelCall, GoldWrite, Salary, Thirty, Stage } from './bounded-market-income-payroll-types.ts';
import { OFFICES_CATALOG } from './bounded-market-income-payroll-data.ts';
import { stop } from './bounded-market-income-payroll-errors.ts';
import { clone, same, detachBoundedMarketData } from './bounded-market-income-payroll-json.ts';

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
  const raw = resolveFinancePayroll(ordered);
  // A phase return is inspected as safe data before reading its fields.
  const result = safe(raw, 'payroll');
  if (!raw.ok) {
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
function moneyFailure(reason: FinanceMoneyFailureReason): never {
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

export function settleMarketMonth(s: Scenario, candidate: Current, payroll: FinancePayroll): MonthlyReceipt {
  const monthStart = candidate.clock.date.day === 1, beforeMoney = clone(candidate), payrollBefore = clone(payroll);
  const facts = deriveMarketMoneyFacts(s, candidate);
  const moneyRaw = applyFinanceMoneyPhase({ ...facts, monthStart, taxationActive: false, wealthyActive: false, goldTarget: candidate.ledger });
  onlyGoldChanged(beforeMoney, candidate);
  const money = safe(moneyRaw, 'money');
  if (!moneyRaw.ok) {
    if (!same(money, { ok: false, reason: moneyRaw.reason })) stop('unsupported-kernel-return', 'money');
    moneyFailure(moneyRaw.reason);
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
  const beforeSalary = clone(candidate);
  const salaryRaw = applyFinanceFullSalaryPhase({ monthStart, payroll, goldTarget: candidate.ledger });
  onlyGoldChanged(beforeSalary, candidate);
  const salaryValue = safe(salaryRaw, 'payroll');
  if (!same(safe(payroll, 'payroll'), payrollBefore)) stop('unexpected-phase-effect', 'invariant');
  if (!salaryRaw.ok) {
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
    return { ...common, status: 'not-due', settlement: null, facilityIds: null,
      moneyKernel: { status: 'not-due', reason: 'nonmonthly-without-taxation' }, writes: [], salary };
  }
  const salaryWrite = readGoldWrite(p.write, beforeSalary.ledger.gold, beforeSalary.ledger.goldCapacity, payroll.sum, 'salary');
  onlyGoldChanged(beforeSalary, candidate, salaryWrite.after);
  if (!called || !incomeWrite || salary.status !== 'paid') stop('unsupported-kernel-return', 'payroll');
  const facilityIds = thirty(i => { const lotId = s.facilityLotSlots[i];
    return lotId === null ? null : candidate.ledger.facilities.find(f => f.lotId === lotId)?.id ?? null; });
  return { ...common, status: 'settled', settlement: { cityId: s.city.id, year: candidate.clock.date.year, month: candidate.clock.date.month },
    facilityIds, moneyKernel: called, writes: [incomeWrite, salaryWrite], salary };
}
