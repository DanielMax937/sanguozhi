import { calculateMonthlySpecialtyProduction } from '../monthly-specialty-production.ts';
import {
  deriveMonthlySpecialtyInput,
  readMonthlySpecialtyQuantityRequest,
  creditMonthlySpecialtyEquipment,
} from './monthly-specialty-leaves.ts';
import type {
  MonthlySpecialtyEquipmentPhaseInput,
  MonthlySpecialtyEquipmentPhaseResult,
} from './monthly-specialty-types.ts';

/** One equipment member of the owner's detached candidate; no clock or transaction ownership. */
export function applyMonthlySpecialtyEquipmentPhase(
  input: MonthlySpecialtyEquipmentPhaseInput,
): MonthlySpecialtyEquipmentPhaseResult {
  const equipmentType = input.equipmentType;
  if (!input.monthStart) return {
    ok: true,
    receipt: {
      equipmentType,
      eligibility: 'not-due',
      count: null,
      arithmeticProfile: 'comment-f32-rne-trunc-v1',
      kernelQuantityRequest: null,
      kernel: { status: 'not-due', reason: 'not-month-start' },
      write: null,
    },
  };
  if (input.governor === null) return {
    ok: true,
    receipt: {
      equipmentType,
      eligibility: 'no-governor',
      count: null,
      arithmeticProfile: 'comment-f32-rne-trunc-v1',
      kernelQuantityRequest: null,
      kernel: { status: 'not-due', reason: 'no-governor' },
      write: null,
    },
  };
  const kernelInput = deriveMonthlySpecialtyInput(equipmentType, {
    facilities: input.facilities,
    governor: input.governor,
    specialtyEquipmentTypes: input.specialtyEquipmentTypes,
  });
  const result = calculateMonthlySpecialtyProduction(kernelInput);
  if (!result.supported) return { ok: false, reason: `specialty-kernel:${result.reason}` };
  if (result.path === 'not-specialty') return {
    ok: true,
    receipt: {
      equipmentType,
      eligibility: result.path,
      count: result.completedFacilityCount,
      arithmeticProfile: 'comment-f32-rne-trunc-v1',
      kernelQuantityRequest: null,
      kernel: { status: 'called', api: 'calculateMonthlySpecialtyProduction', profile: kernelInput.profile, adapterObservationKind: 'derived-adapter-observations', input: kernelInput, result },
      write: null,
    },
  };
  if (result.path === 'no-completed-facilities') return {
    ok: true,
    receipt: {
      equipmentType,
      eligibility: result.path,
      count: result.completedFacilityCount,
      arithmeticProfile: 'comment-f32-rne-trunc-v1',
      kernelQuantityRequest: null,
      kernel: { status: 'called', api: 'calculateMonthlySpecialtyProduction', profile: kernelInput.profile, adapterObservationKind: 'derived-adapter-observations', input: kernelInput, result },
      write: null,
    },
  };
  const quantity = readMonthlySpecialtyQuantityRequest(result.quantityRequest);
  if (!quantity.ok) return quantity;
  const stock = input.stock;
  const credit = creditMonthlySpecialtyEquipment(equipmentType, stock.quantity, stock.capacity, quantity.requested);
  if (!credit.ok) return credit;
  const write = credit.write;
  stock.quantity = write.after;
  return {
    ok: true,
    receipt: {
      equipmentType,
      eligibility: result.path,
      count: result.completedFacilityCount,
      arithmeticProfile: 'comment-f32-rne-trunc-v1',
      kernelQuantityRequest: quantity.requested,
      kernel: { status: 'called', api: 'calculateMonthlySpecialtyProduction', profile: kernelInput.profile, adapterObservationKind: 'derived-adapter-observations', input: kernelInput, result },
      write,
    },
  };
}
