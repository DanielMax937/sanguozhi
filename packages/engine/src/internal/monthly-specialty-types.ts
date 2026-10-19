import type {
  MonthlySpecialtyProductionInput,
  MonthlySpecialtyProductionReceipt,
  MonthlySpecialtyProductionRejectionReason,
} from '../monthly-specialty-production.ts';

export type SpecialtyEquipment = 1 | 2 | 3 | 4;

export type SpecialtyFacilityKind =
  | 'market' | 'farm' | 'mint' | 'granary'
  | 'large-market' | 'fish-market' | 'black-market'
  | 'military-farm' | 'forge' | 'stable';

export type SpecialtyFacilityFact = {
  readonly kind: SpecialtyFacilityKind;
  readonly complete: boolean;
};

export type SpecialtyGovernorFact = {
  readonly politics: number;
};

// Exactly 30 dense explicit owner slots is an owner-validated precondition.
// The array type preserves direct structural compatibility with old Scenario.
export type SpecialtyFacilityFacts =
  readonly (SpecialtyFacilityFact | null)[];

export type SpecialtyResolvedFacts = {
  readonly facilities: SpecialtyFacilityFacts;
  readonly governor: SpecialtyGovernorFact;
  readonly specialtyEquipmentTypes: readonly SpecialtyEquipment[];
};

// The only mutable field granted to the phase is quantity.
export type SpecialtyStockTarget = {
  quantity: number;
  readonly capacity: number;
};

export type MonthlySpecialtyEquipmentPhaseInput = {
  readonly equipmentType: SpecialtyEquipment;
  readonly monthStart: boolean;
  readonly facilities: SpecialtyFacilityFacts;
  readonly governor: SpecialtyGovernorFact | null;
  readonly specialtyEquipmentTypes: readonly SpecialtyEquipment[];
  readonly stock: SpecialtyStockTarget;
};

export type SpecialtyWrite = {
  readonly resource: 'equipment-1' | 'equipment-2' | 'equipment-3' | 'equipment-4';
  readonly reason: 'specialty';
  readonly before: number;
  readonly requested: number;
  readonly accepted: number;
  readonly actualDelta: number;
  readonly after: number;
  readonly cap: number;
  readonly discarded: number;
  // Same string-valued field as old Write; value comes from unchanged catalog.
  readonly writerPolicyId: string;
};

export type SpecialtyCalledKernel<
  R extends MonthlySpecialtyProductionReceipt = MonthlySpecialtyProductionReceipt
> = {
  readonly status: 'called';
  readonly api: 'calculateMonthlySpecialtyProduction';
  readonly profile: 'monthly-specialty-production-observed-v1';
  readonly adapterObservationKind: 'derived-adapter-observations';
  readonly input: MonthlySpecialtyProductionInput;
  readonly result: R;
};

type SpecialtyReceiptBase = {
  readonly equipmentType: SpecialtyEquipment;
  readonly arithmeticProfile: 'comment-f32-rne-trunc-v1';
};

export type MonthlySpecialtyEquipmentReceipt = SpecialtyReceiptBase & (
  | {
      readonly eligibility: 'not-due';
      readonly count: null;
      readonly kernelQuantityRequest: null;
      readonly kernel: { readonly status: 'not-due'; readonly reason: 'not-month-start' };
      readonly write: null;
    }
  | {
      readonly eligibility: 'no-governor';
      readonly count: null;
      readonly kernelQuantityRequest: null;
      readonly kernel: { readonly status: 'not-due'; readonly reason: 'no-governor' };
      readonly write: null;
    }
  | {
      readonly eligibility: 'not-specialty';
      readonly count: null;
      readonly kernelQuantityRequest: null;
      readonly kernel: SpecialtyCalledKernel<Extract<
        MonthlySpecialtyProductionReceipt, { readonly path: 'not-specialty' }
      >>;
      readonly write: null;
    }
  | {
      readonly eligibility: 'no-completed-facilities';
      readonly count: 0;
      readonly kernelQuantityRequest: null;
      readonly kernel: SpecialtyCalledKernel<Extract<
        MonthlySpecialtyProductionReceipt, { readonly path: 'no-completed-facilities' }
      >>;
      readonly write: null;
    }
  | {
      readonly eligibility: 'production';
      readonly count: number;
      readonly kernelQuantityRequest: number;
      readonly kernel: SpecialtyCalledKernel<Extract<
        MonthlySpecialtyProductionReceipt, { readonly path: 'production' }
      >>;
      readonly write: SpecialtyWrite;
    }
);

export type SpecialtyFailureReason =
  | `specialty-kernel:${MonthlySpecialtyProductionRejectionReason}`
  | 'unsupported-kernel-return'
  | 'invalid-resource-boundary';

export type SpecialtyFailure = {
  readonly ok: false;
  readonly reason: SpecialtyFailureReason;
};

export type SpecialtyQuantityResult =
  | { readonly ok: true; readonly requested: number }
  | { readonly ok: false; readonly reason: 'unsupported-kernel-return' };

export type SpecialtyCreditResult =
  | { readonly ok: true; readonly write: SpecialtyWrite }
  | { readonly ok: false; readonly reason: 'unsupported-kernel-return' | 'invalid-resource-boundary' };

export type MonthlySpecialtyEquipmentPhaseResult =
  | { readonly ok: true; readonly receipt: MonthlySpecialtyEquipmentReceipt }
  | SpecialtyFailure;
