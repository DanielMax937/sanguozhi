import source from '../../../docs/sources/production-quantity.json' with { type: 'json' };

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object') {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
}

/** Conditional resolved-input projection of the original listing, never a MOD. */
export const PRODUCTION_QUANTITY = deepFreeze(source);
export type ProductionQuantityFactorBits = '3F800000' | '3F99999A' | '3FC00000';
export type ProductionQuantitySlot = {
  readonly intelligenceGetterEax: number;
  readonly skillHelperEax: number;
} | null;
/** Runtime validation enforces signed32 branches and closed conditional fields. */
export type ProductionQuantityInput = {
  readonly profile: 'production-quantity-resolved-f32-v1';
  readonly nativeEquipmentType: number;
  readonly slots?: readonly [ProductionQuantitySlot, ProductionQuantitySlot, ProductionQuantitySlot];
  readonly resolvedFacilityFactorBits?: ProductionQuantityFactorBits;
  readonly difficultyWord?: number;
  readonly cityVirtualEax?: number;
};
export type ProductionQuantityRejectionReason = 'invalid-input' | 'unexpected-field'
  | 'unsupported-profile' | 'invalid-native-equipment-type' | 'invalid-slots'
  | 'invalid-slot' | 'no-valid-slot' | 'unsupported-facility-factor-bits'
  | 'invalid-difficulty-word' | 'invalid-city-virtual-eax';
type Evidence = typeof PRODUCTION_QUANTITY.evidence;
export type ProductionQuantityRejection = {
  readonly supported: false;
  readonly reason: ProductionQuantityRejectionReason;
  readonly evidence: Evidence;
};
export type ProductionQuantityEarlyReceipt = {
  readonly supported: true;
  readonly profile: 'production-quantity-resolved-f32-v1';
  readonly nativeEquipmentType: number;
  readonly reason: 'native-invalid-type-return-zero' | 'single-item-return-one';
  readonly resolvedInputsObserved: false;
  readonly returnedQuantity: number;
  readonly evidence: Evidence;
};
export type ProductionQuantitySlotReceipt = {
  readonly intelligenceGetterEax: number;
  readonly intelligenceAl: number;
  readonly skillHelperEax: number;
} | null;
export type ProductionQuantityReceipt = {
  readonly supported: true;
  readonly profile: 'production-quantity-resolved-f32-v1';
  readonly nativeEquipmentType: number;
  readonly reason: 'resolved-quantity';
  readonly resolvedInputsObserved: true;
  readonly slots: readonly ProductionQuantitySlotReceipt[];
  readonly validSlotCount: number;
  readonly intelligenceSum: number;
  readonly intelligenceMax: number;
  readonly skillQueryId: -1 | 80 | 81;
  readonly skillApplied: boolean;
  readonly baseQuantity: number;
  readonly skillAdjustedQuantity: number;
  readonly resolvedFacilityFactorBits: ProductionQuantityFactorBits;
  readonly convertedQuantity: number;
  readonly difficultyWord: number;
  readonly cityVirtualObserved: boolean;
  readonly cityVirtualEax: number | null;
  readonly superApplied: boolean;
  readonly returnedQuantity: number;
  readonly evidence: Evidence;
};
export type ProductionQuantityResult = ProductionQuantityRejection | ProductionQuantityEarlyReceipt | ProductionQuantityReceipt;

const evidence = PRODUCTION_QUANTITY.evidence;
const reject = (reason: ProductionQuantityRejectionReason): ProductionQuantityRejection =>
  Object.freeze({supported: false, reason, evidence});
const uint32 = (value: unknown): value is number => typeof value === 'number'
  && Number.isSafeInteger(value) && value >= 0 && value <= 0xffffffff;
const signed32 = (value: unknown): value is number => typeof value === 'number'
  && Number.isSafeInteger(value) && value >= -0x80000000 && value <= 0x7fffffff;
function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object'
    && [Object.prototype, null].includes(Object.getPrototypeOf(value));
}
function closed(value: Record<string, unknown>, allowed: readonly string[]): 'invalid-input' | 'unexpected-field' | null {
  const keys = Reflect.ownKeys(value);
  if (keys.some(key => typeof key !== 'string' || !allowed.includes(key))) return 'unexpected-field';
  const descriptors = Object.getOwnPropertyDescriptors(value);
  return keys.length !== allowed.length || allowed.some(key => !descriptors[key] || !('value' in descriptors[key]))
    ? 'invalid-input' : null;
}

/**
 * Callers supply observed getter/helper EAX and a supported binary32-valued ST0,
 * not levels or inferred stock constants. External functions, pointers, FPU
 * exceptions, command eligibility and actual capped inventory writes are absent.
 * All-invalid native sentinel arithmetic is deliberately outside this API domain.
 */
export function calculateProductionQuantity(input: ProductionQuantityInput): ProductionQuantityResult {
  if (!record(input)) return reject('invalid-input');
  const descriptors = Object.getOwnPropertyDescriptors(input);
  if (!descriptors.profile || !('value' in descriptors.profile)
      || !descriptors.nativeEquipmentType || !('value' in descriptors.nativeEquipmentType)) return reject('invalid-input');
  const profile = descriptors.profile.value;
  const nativeEquipmentType = descriptors.nativeEquipmentType.value;
  if (profile !== PRODUCTION_QUANTITY.profileId) return reject('unsupported-profile');
  if (!signed32(nativeEquipmentType)) return reject('invalid-native-equipment-type');
  if (nativeEquipmentType < 0 || nativeEquipmentType > 11 || nativeEquipmentType >= 5) {
    const shape = closed(input, ['profile', 'nativeEquipmentType']);
    if (shape) return reject(shape);
    const invalid = nativeEquipmentType < 0 || nativeEquipmentType > 11;
    return Object.freeze({supported: true, profile, nativeEquipmentType,
      reason: invalid ? 'native-invalid-type-return-zero' : 'single-item-return-one',
      resolvedInputsObserved: false, returnedQuantity: invalid ? 0 : 1, evidence});
  }
  if (!descriptors.difficultyWord || !('value' in descriptors.difficultyWord)) return reject('invalid-input');
  const difficultyWord = descriptors.difficultyWord.value;
  if (!uint32(difficultyWord)) return reject('invalid-difficulty-word');
  const allowed = ['profile', 'nativeEquipmentType', 'slots', 'resolvedFacilityFactorBits', 'difficultyWord'];
  if (difficultyWord === 2) allowed.push('cityVirtualEax');
  const shape = closed(input, allowed);
  if (shape) return reject(shape);
  const slots = descriptors.slots!.value;
  if (!Array.isArray(slots) || Object.getPrototypeOf(slots) !== Array.prototype) return reject('invalid-slots');
  const slotDescriptors = Object.getOwnPropertyDescriptors(slots);
  if (Reflect.ownKeys(slots).length !== 4 || slots.length !== 3
      || ['0', '1', '2'].some(key => !slotDescriptors[key] || !('value' in slotDescriptors[key]))) return reject('invalid-slots');
  const snapshot: ProductionQuantitySlotReceipt[] = [];
  let validSlotCount = 0, intelligenceSum = 0, intelligenceMax = 0, skillApplied = false;
  for (const key of ['0', '1', '2']) {
    const slot = slotDescriptors[key]!.value;
    if (slot === null) { snapshot.push(null); continue; }
    if (!record(slot) || closed(slot, ['intelligenceGetterEax', 'skillHelperEax'])) return reject('invalid-slot');
    const values = Object.getOwnPropertyDescriptors(slot);
    const intelligenceGetterEax = values.intelligenceGetterEax!.value;
    const skillHelperEax = values.skillHelperEax!.value;
    if (!uint32(intelligenceGetterEax) || !uint32(skillHelperEax)) return reject('invalid-slot');
    const intelligenceAl = intelligenceGetterEax & 0xff;
    snapshot.push(Object.freeze({intelligenceGetterEax, intelligenceAl, skillHelperEax}));
    validSlotCount++;
    intelligenceSum += intelligenceAl;
    intelligenceMax = Math.max(intelligenceMax, intelligenceAl);
    if (skillHelperEax !== 0) skillApplied = true;
  }
  if (validSlotCount === 0) return reject('no-valid-slot');
  const resolvedFacilityFactorBits = descriptors.resolvedFacilityFactorBits!.value;
  let factor: number;
  if (resolvedFacilityFactorBits === '3F800000') factor = 1;
  else if (resolvedFacilityFactorBits === '3F99999A') factor = 5033165 / 4194304;
  else if (resolvedFacilityFactorBits === '3FC00000') factor = 3 / 2;
  else return reject('unsupported-facility-factor-bits');
  const cityVirtualObserved = difficultyWord === 2;
  let cityVirtualEax: number | null = null;
  if (cityVirtualObserved) {
    const rawCityVirtualEax = descriptors.cityVirtualEax!.value;
    if (!uint32(rawCityVirtualEax)) return reject('invalid-city-virtual-eax');
    cityVirtualEax = rawCityVirtualEax;
  }
  const skillQueryId = nativeEquipmentType === 0 ? -1 : nativeEquipmentType === 4 ? 81 : 80;
  const baseQuantity = (intelligenceMax + intelligenceSum + 200) * 5;
  const skillAdjustedQuantity = skillApplied ? baseQuantity * 2 : baseQuantity;
  // On this finite supported domain double multiplication is exact. Independent
  // rational verification proves identical truncation for x87 PC24/53/64 and all
  // four rounding directions under normal return (not exceptional FPU state).
  const convertedQuantity = Math.trunc(skillAdjustedQuantity * factor);
  const superApplied = cityVirtualObserved && cityVirtualEax === 0;
  const returnedQuantity = superApplied ? convertedQuantity * 2 : convertedQuantity;
  return Object.freeze({supported: true, profile, nativeEquipmentType, reason: 'resolved-quantity',
    resolvedInputsObserved: true, slots: Object.freeze(snapshot), validSlotCount, intelligenceSum,
    intelligenceMax, skillQueryId, skillApplied, baseQuantity, skillAdjustedQuantity,
    resolvedFacilityFactorBits, convertedQuantity, difficultyWord, cityVirtualObserved,
    cityVirtualEax, superApplied, returnedQuantity, evidence});
}
