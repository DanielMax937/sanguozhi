/** Pure adapters for the fixed finance money and complete named-office payroll policies. */
import namedOffices from '../../../../data/catalogs/named-offices-v1.json' with { type: 'json' };
import facilityData from '../../../../data/catalogs/city-finance-facilities-v1.json' with { type: 'json' };
import policyData from '../../../../data/catalogs/city-finance-policies-v1.json' with { type: 'json' };
import type { CityMoneyIncomeSlot } from '../city-money-income-projection.ts';
import type {
  FinanceMoneyFacts, FinanceMoneyInputResult, FinanceOfficerIdFact,
  FinancePayrollOfficerFact, FinancePayrollResult, FinanceSalaryItem,
  FinanceMoneyRequestResult, FinanceMoneyCreditReason, FinanceMoneyCreditResult,
} from './finance-money-payroll-types.ts';

export function deriveFinanceMoneyInput(facts: FinanceMoneyFacts): FinanceMoneyInputResult {
  const slots: CityMoneyIncomeSlot[] = [];
  for (const f of facts.facilities) {
    if (f === null) { slots.push(null); continue; }
    const row = facilityData.rows.find(r => r.kind === f.kind && r.level === f.level);
    if (!row) return { ok: false, reason: 'unsupported-facility' };
    slots.push({ facilityTypeWord: row.typeWord, constructionWord: f.complete ? 1 : 0,
      ...(f.kind === 'market' && (f.complete || f.level > 1) ? { adjacentMint: facts.facilities.some(other => {
        if (other === null || !other.complete || other.kind !== 'mint') return false;
        const dq = f.position.q - other.position.q, dr = f.position.r - other.position.r;
        return Math.max(Math.abs(dq), Math.abs(dr), Math.abs(dq + dr)) === 1;
      }) } : {}) });
  }
  return { ok: true, input: {
    profile: 'city-money-income-stable-resolved-i32-safe-v1', baseMoneyWord: facts.baseMoneyWord, slots,
    resolvedTypeRows: { 31: { valid: true, moneyYieldWord: 100 }, 50: { valid: true, moneyYieldWord: 120 }, 51: { valid: true, moneyYieldWord: 150 }, 46: { valid: true, moneyYieldWord: 300 }, 47: { valid: true, moneyYieldWord: 200 }, 48: { valid: true, moneyYieldWord: 80 } },
    difficultyWord: facts.difficulty === 'normal' ? 1 : 2, ...(facts.difficulty === 'super' ? { cityPlayerPredicate: facts.controller === 'player' } : {}), securityByte: facts.securityBeforeIncome,
  } };
}

export function compareFinanceOfficerIds(a: FinanceOfficerIdFact, b: FinanceOfficerIdFact): -1 | 0 | 1 {
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

export function resolveFinancePayroll(ordered: readonly FinancePayrollOfficerFact[]): FinancePayrollResult {
  const items: FinanceSalaryItem[] = [];
  for (const o of ordered) {
    const row = namedOffices.offices.find(r => r.officeId === o.officeId);
    if (!row) return { ok: false, reason: 'unsupported-payroll-identity' };
    items.push({ officerId: o.id, officeId: o.officeId, officeName: row.name, catalogSalary: row.monthlySalary });
  }
  return { ok: true, payroll: { items, sum: items.reduce((sum, p) => sum + p.catalogSalary, 0) } };
}

export function readFinanceMoneyRequest(amount: number): FinanceMoneyRequestResult {
  if (!Number.isSafeInteger(amount) || amount < 0 || Object.is(amount, -0)) return { ok: false, reason: 'unsupported-kernel-return' };
  return { ok: true, requested: amount };
}

export function creditFinanceMoney(reason: FinanceMoneyCreditReason, before: number, capacity: number, requested: number): FinanceMoneyCreditResult {
  const request = readFinanceMoneyRequest(requested);
  if (!request.ok) return request;
  const accepted = Math.min(requested, capacity - before);
  if (!Number.isSafeInteger(accepted) || accepted < 0) return { ok: false, reason: 'invalid-resource-boundary' };
  return { ok: true, write: { resource: 'gold', reason, before, requested, accepted, actualDelta: accepted, after: before + accepted, cap: capacity, discarded: requested - accepted, writerPolicyId: policyData.credit.id } };
}
