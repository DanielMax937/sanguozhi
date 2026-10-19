/** Private compatibility contracts; validation remains with the finance owner. */
import type {
  CityMoneyIncomeProjectionInput,
  CityMoneyIncomeProjectionReceipt,
  CityMoneyIncomeProjectionRejectionReason,
} from '../city-money-income-projection.ts';

export type FinanceMoneyFacilityKind =
  | 'market' | 'farm' | 'mint' | 'granary'
  | 'large-market' | 'fish-market' | 'black-market'
  | 'military-farm' | 'forge' | 'stable';
export type FinanceMoneyFacilityFact = {
  readonly kind: FinanceMoneyFacilityKind;
  readonly level: number;
  readonly complete: boolean;
  readonly position: { readonly q: number; readonly r: number };
};
export type FinanceMoneyFacts = {
  readonly facilities: readonly (FinanceMoneyFacilityFact | null)[];
  readonly baseMoneyWord: number;
  readonly difficulty: 'normal' | 'super';
  readonly controller: 'player' | 'ai';
  readonly securityBeforeIncome: number;
};
export type FinanceGoldTarget = {
  gold: number;
  readonly goldCapacity: number;
};
export type FinanceMoneyPhaseInput = FinanceMoneyFacts & {
  readonly monthStart: boolean;
  readonly taxationActive: boolean;
  readonly wealthyActive: boolean;
  readonly goldTarget: FinanceGoldTarget;
};
export type FinanceMoneyInputResult =
  | { readonly ok: true; readonly input: CityMoneyIncomeProjectionInput }
  | { readonly ok: false; readonly reason: 'unsupported-facility' };
export type FinanceMoneyRequestResult =
  | { readonly ok: true; readonly requested: number }
  | { readonly ok: false; readonly reason: 'unsupported-kernel-return' };

export type FinanceMoneyCreditReason = 'money-base' | 'wealthy-bonus';
export type FinanceMoneyCreditWrite = {
  readonly resource: 'gold';
  readonly reason: FinanceMoneyCreditReason;
  readonly before: number;
  readonly requested: number;
  readonly accepted: number;
  readonly actualDelta: number;
  readonly after: number;
  readonly cap: number;
  readonly discarded: number;
  readonly writerPolicyId: string;
};
export type FinanceMoneyCreditResult =
  | { readonly ok: true; readonly write: FinanceMoneyCreditWrite }
  | { readonly ok: false; readonly reason:
        'unsupported-kernel-return' | 'invalid-resource-boundary' };
export type FinanceMoneyCalledKernel = {
  readonly status: 'called';
  readonly api: 'calculateCityMoneyIncomeProjection';
  readonly profile: 'city-money-income-stable-resolved-i32-safe-v1';
  readonly adapterObservationKind: 'derived-adapter-observations';
  readonly input: CityMoneyIncomeProjectionInput;
  readonly result: CityMoneyIncomeProjectionReceipt;
};
export type FinanceMoneyNotDueKernel = {
  readonly status: 'not-due';
  readonly reason: 'nonmonthly-without-taxation';
};
export type FinanceMoneyFailureReason =
  | 'unsupported-facility'
  | `money-kernel:${CityMoneyIncomeProjectionRejectionReason}`
  | 'unsupported-kernel-return'
  | 'invalid-resource-boundary';
export type FinanceMoneyPhaseResult =
  | {
      readonly ok: true;
      readonly kernel: FinanceMoneyNotDueKernel;
      readonly writes: [];
    }
  | {
      readonly ok: true;
      readonly kernel: FinanceMoneyCalledKernel;
      readonly writes: [FinanceMoneyCreditWrite]
        | [FinanceMoneyCreditWrite, FinanceMoneyCreditWrite];
    }
  | { readonly ok: false; readonly reason: FinanceMoneyFailureReason };

export type FinanceOfficerIdFact = { readonly id: string };
export type FinancePayrollOfficerFact = {
  readonly id: string;
  readonly officeId: number;
};
export type FinanceSalaryItem = {
  readonly officerId: string;
  readonly officeId: number;
  readonly officeName: string;
  readonly catalogSalary: number;
};
export type FinancePayroll = {
  readonly items: FinanceSalaryItem[];
  readonly sum: number;
};
export type FinancePayrollResult =
  | { readonly ok: true; readonly payroll: FinancePayroll }
  | { readonly ok: false; readonly reason: 'unsupported-payroll-identity' };
export type FinanceSalaryNotDue = {
  readonly status: 'not-due';
  readonly items: FinanceSalaryItem[];
  readonly sum: number;
  readonly availableBeforeSalary: null;
  readonly paid: 0;
  readonly shortfall: 0;
  readonly payerPolicyId: string;
};
export type FinanceSalaryPaid = {
  readonly status: 'paid';
  readonly items: FinanceSalaryItem[];
  readonly sum: number;
  readonly availableBeforeSalary: number;
  readonly paid: number;
  readonly shortfall: 0;
  readonly payerPolicyId: string;
};
export type FinanceSalaryWrite = {
  readonly resource: 'gold';
  readonly reason: 'salary';
  readonly before: number;
  readonly requested: number;
  readonly accepted: number;
  readonly actualDelta: number;
  readonly after: number;
  readonly cap: number;
  readonly discarded: 0;
  readonly writerPolicyId: string;
};
export type FinanceSalaryShortfallProposal = {
  readonly required: number;
  readonly available: number;
  readonly shortfall: number;
};
export type FinanceFullSalaryPhaseInput = {
  readonly monthStart: boolean;
  readonly payroll: FinancePayroll;
  readonly goldTarget: FinanceGoldTarget;
};
export type FinanceFullSalaryPhaseResult =
  | { readonly ok: true; readonly salary: FinanceSalaryNotDue;
      readonly write: null }
  | { readonly ok: true; readonly salary: FinanceSalaryPaid;
      readonly write: FinanceSalaryWrite }
  | { readonly ok: false; readonly reason: 'unsupported-salary-shortfall';
      readonly proposal: FinanceSalaryShortfallProposal };
