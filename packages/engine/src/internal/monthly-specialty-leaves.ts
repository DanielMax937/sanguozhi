import policyData from '../../../../data/catalogs/city-finance-policies-v1.json' with { type: 'json' };
import type {
  MonthlySpecialtyProductionInput,
  MonthlySpecialtyProductionSlot,
  MonthlySpecialtyProductionSlots,
  MonthlySpecialtyProductionQuantityRequest,
} from '../monthly-specialty-production.ts';
import type {
  SpecialtyEquipment,
  SpecialtyFacilityFact,
  SpecialtyFacilityFacts,
  SpecialtyResolvedFacts,
  SpecialtyQuantityResult,
  SpecialtyCreditResult,
} from './monthly-specialty-types.ts';

function specialtySlot(
  facility: SpecialtyFacilityFact | null,
  matchingKind: 'forge' | 'stable',
): MonthlySpecialtyProductionSlot {
  return facility === null
    ? { validityEaxU32: 0 }
    : { validityEaxU32: 1, correspondingCompletedEaxU32: facility.kind === matchingKind && facility.complete ? 1 : 0 };
}

function specialtySlots(
  facilities: SpecialtyFacilityFacts,
  matchingKind: 'forge' | 'stable',
): MonthlySpecialtyProductionSlots {
  // The owner has already validated exactly 30 dense slots; preserve every index.
  return [
    specialtySlot(facilities[0]!, matchingKind),
    specialtySlot(facilities[1]!, matchingKind),
    specialtySlot(facilities[2]!, matchingKind),
    specialtySlot(facilities[3]!, matchingKind),
    specialtySlot(facilities[4]!, matchingKind),
    specialtySlot(facilities[5]!, matchingKind),
    specialtySlot(facilities[6]!, matchingKind),
    specialtySlot(facilities[7]!, matchingKind),
    specialtySlot(facilities[8]!, matchingKind),
    specialtySlot(facilities[9]!, matchingKind),
    specialtySlot(facilities[10]!, matchingKind),
    specialtySlot(facilities[11]!, matchingKind),
    specialtySlot(facilities[12]!, matchingKind),
    specialtySlot(facilities[13]!, matchingKind),
    specialtySlot(facilities[14]!, matchingKind),
    specialtySlot(facilities[15]!, matchingKind),
    specialtySlot(facilities[16]!, matchingKind),
    specialtySlot(facilities[17]!, matchingKind),
    specialtySlot(facilities[18]!, matchingKind),
    specialtySlot(facilities[19]!, matchingKind),
    specialtySlot(facilities[20]!, matchingKind),
    specialtySlot(facilities[21]!, matchingKind),
    specialtySlot(facilities[22]!, matchingKind),
    specialtySlot(facilities[23]!, matchingKind),
    specialtySlot(facilities[24]!, matchingKind),
    specialtySlot(facilities[25]!, matchingKind),
    specialtySlot(facilities[26]!, matchingKind),
    specialtySlot(facilities[27]!, matchingKind),
    specialtySlot(facilities[28]!, matchingKind),
    specialtySlot(facilities[29]!, matchingKind),
  ];
}

export function deriveMonthlySpecialtyInput(
  equipmentType: SpecialtyEquipment,
  facts: SpecialtyResolvedFacts,
): MonthlySpecialtyProductionInput {
  const specialty = facts.specialtyEquipmentTypes.includes(equipmentType);
  const common = { profile: 'monthly-specialty-production-observed-v1' as const, arithmeticProfile: 'comment-f32-rne-trunc-v1' as const, equipmentType, specialtyEaxU32: specialty ? 1 : 0 };
  if (!specialty) return common;
  const matchingKind = equipmentType === 4 ? 'stable' : 'forge';
  const slots = specialtySlots(facts.facilities, matchingKind);
  const count = facts.facilities.filter(f => f !== null && f.kind === matchingKind && f.complete).length;
  return count > 0 ? { ...common, slots, governorPoliticsEaxU32: facts.governor.politics } : { ...common, slots };
}

export function readMonthlySpecialtyQuantityRequest(
  quantityRequest: MonthlySpecialtyProductionQuantityRequest,
): SpecialtyQuantityResult {
  const requested = quantityRequest.quantitySigned32;
  if (!Number.isSafeInteger(requested) || requested < 0 || Object.is(requested, -0)) return { ok: false, reason: 'unsupported-kernel-return' };
  if (requested !== quantityRequest.quantityU32 || requested > 1500) return { ok: false, reason: 'unsupported-kernel-return' };
  return { ok: true, requested };
}

export function creditMonthlySpecialtyEquipment(
  equipmentType: SpecialtyEquipment,
  before: number,
  capacity: number,
  requested: number,
): SpecialtyCreditResult {
  if (!Number.isSafeInteger(requested) || requested < 0 || Object.is(requested, -0)) return { ok: false, reason: 'unsupported-kernel-return' };
  const accepted = Math.min(requested, capacity - before);
  if (!Number.isSafeInteger(accepted) || accepted < 0) return { ok: false, reason: 'invalid-resource-boundary' };
  return {
    ok: true,
    write: { resource: `equipment-${equipmentType}`, reason: 'specialty', before, requested, accepted, actualDelta: accepted, after: before + accepted, cap: capacity, discarded: requested - accepted, writerPolicyId: policyData.credit.id },
  };
}
