/** Separate money and salary phases over the owner's actual detached candidate gold target. */
import { calculateCityMoneyIncomeProjection } from '../city-money-income-projection.ts';
import { deriveFinanceMoneyInput, readFinanceMoneyRequest, creditFinanceMoney } from './finance-money-payroll-leaves.ts';
import policyData from '../../../../data/catalogs/city-finance-policies-v1.json' with { type: 'json' };
import type {
  FinanceMoneyPhaseInput, FinanceMoneyPhaseResult, FinanceMoneyCalledKernel, FinanceMoneyCreditWrite,
  FinanceFullSalaryPhaseInput, FinanceFullSalaryPhaseResult, FinanceSalaryPaid, FinanceSalaryWrite,
} from './finance-money-payroll-types.ts';

export function applyFinanceMoneyPhase(input: FinanceMoneyPhaseInput): FinanceMoneyPhaseResult {
  if (!input.monthStart && !input.taxationActive) return { ok: true, kernel: { status: 'not-due', reason: 'nonmonthly-without-taxation' }, writes: [] };
  const derived = deriveFinanceMoneyInput(input);
  if (!derived.ok) return derived;
  const result = calculateCityMoneyIncomeProjection(derived.input);
  if (!result.supported) return { ok: false, reason: `money-kernel:${result.reason}` };
  const request = readFinanceMoneyRequest(result.returnedIncome);
  if (!request.ok) return request;
  const m = request.requested, h = input.taxationActive ? Math.floor(m / 2) : m;
  const kernel: FinanceMoneyCalledKernel = { status: 'called', api: 'calculateCityMoneyIncomeProjection', profile: derived.input.profile, adapterObservationKind: 'derived-adapter-observations', input: derived.input, result };
  const base = creditFinanceMoney('money-base', input.goldTarget.gold, input.goldTarget.goldCapacity, h);
  if (!base.ok) return base;
  input.goldTarget.gold = base.write.after;
  let writes: [FinanceMoneyCreditWrite] | [FinanceMoneyCreditWrite, FinanceMoneyCreditWrite] = [base.write];
  if (input.monthStart && input.wealthyActive) {
    const bonus = creditFinanceMoney('wealthy-bonus', input.goldTarget.gold, input.goldTarget.goldCapacity, Math.floor(h / 2));
    if (!bonus.ok) return bonus;
    input.goldTarget.gold = bonus.write.after;
    writes = [base.write, bonus.write];
  }
  return { ok: true, kernel, writes };
}

export function applyFinanceFullSalaryPhase(input: FinanceFullSalaryPhaseInput): FinanceFullSalaryPhaseResult {
  const payroll = input.payroll.items, salarySum = input.payroll.sum;
  if (!input.monthStart) return { ok: true, salary: { status: 'not-due', items: payroll, sum: salarySum, availableBeforeSalary: null, paid: 0, shortfall: 0, payerPolicyId: policyData.payroll.id }, write: null };
  const available = input.goldTarget.gold;
  if (salarySum > available) return { ok: false, reason: 'unsupported-salary-shortfall', proposal: { required: salarySum, available, shortfall: salarySum - available } };
  input.goldTarget.gold -= salarySum;
  const salary: FinanceSalaryPaid = { status: 'paid', items: payroll, sum: salarySum, availableBeforeSalary: available, paid: salarySum, shortfall: 0, payerPolicyId: policyData.payroll.id };
  const write: FinanceSalaryWrite = { resource: 'gold', reason: 'salary', before: available, requested: salarySum, accepted: salarySum, actualDelta: salarySum === 0 ? 0 : -salarySum, after: input.goldTarget.gold, cap: input.goldTarget.goldCapacity, discarded: 0, writerPolicyId: policyData.debit.id };
  return { ok: true, salary, write };
}
