import source from '../../../docs/sources/monthly-specialty-production.json' with {type: 'json'};
type DeepReadonly<T> = T extends object ? {readonly [K in keyof T]: DeepReadonly<T[K]>} : T;
function freeze<T>(value: T): DeepReadonly<T> {
  if (value !== null && typeof value === 'object') {
    Object.freeze(value);
    for (const child of Object.values(value)) freeze(child);
  }
  return value as DeepReadonly<T>;
}
/** Offline source identities and explicit arithmetic assumptions, not runtime authentication. */
export const MONTHLY_SPECIALTY_PRODUCTION = freeze(source);
export type MonthlySpecialtyProductionSlot =
  | {readonly validityEaxU32: 0; readonly correspondingCompletedEaxU32?: never}
  | {readonly validityEaxU32: number; readonly correspondingCompletedEaxU32: number};
export type MonthlySpecialtyProductionSlots = readonly [
  MonthlySpecialtyProductionSlot, MonthlySpecialtyProductionSlot, MonthlySpecialtyProductionSlot, MonthlySpecialtyProductionSlot, MonthlySpecialtyProductionSlot,
  MonthlySpecialtyProductionSlot, MonthlySpecialtyProductionSlot, MonthlySpecialtyProductionSlot, MonthlySpecialtyProductionSlot, MonthlySpecialtyProductionSlot,
  MonthlySpecialtyProductionSlot, MonthlySpecialtyProductionSlot, MonthlySpecialtyProductionSlot, MonthlySpecialtyProductionSlot, MonthlySpecialtyProductionSlot,
  MonthlySpecialtyProductionSlot, MonthlySpecialtyProductionSlot, MonthlySpecialtyProductionSlot, MonthlySpecialtyProductionSlot, MonthlySpecialtyProductionSlot,
  MonthlySpecialtyProductionSlot, MonthlySpecialtyProductionSlot, MonthlySpecialtyProductionSlot, MonthlySpecialtyProductionSlot, MonthlySpecialtyProductionSlot,
  MonthlySpecialtyProductionSlot, MonthlySpecialtyProductionSlot, MonthlySpecialtyProductionSlot, MonthlySpecialtyProductionSlot, MonthlySpecialtyProductionSlot
];
type Common = {
  readonly profile: 'monthly-specialty-production-observed-v1';
  readonly arithmeticProfile: 'comment-f32-rne-trunc-v1';
  /** Captured outer ESI loop member; no equipment or city lookup is performed. */
  readonly equipmentType: 1 | 2 | 3 | 4;
  readonly specialtyEaxU32: number;
};
/** Dependent numeric stage conditions are enforced at runtime as well as in JSON schema. */
export type MonthlySpecialtyProductionInput = Common & (
  | {readonly slots?: never; readonly governorPoliticsEaxU32?: never}
  | {readonly slots: MonthlySpecialtyProductionSlots; readonly governorPoliticsEaxU32?: never}
  | {readonly slots: MonthlySpecialtyProductionSlots; readonly governorPoliticsEaxU32: number}
);
export type MonthlySpecialtyProductionRejectionReason = 'invalid-input' | 'unexpected-field' | 'unsupported-profile' | 'stage-mismatch';
type CapturedWord = {readonly eaxU32: number; readonly consumedValue: number};
export type MonthlySpecialtyProductionCapturedReturn = CapturedWord & (
  | {readonly kind: 'specialty'; readonly callAddress: '00590A7E'; readonly target: '0047B3A0'; readonly consumedWidthBits: 8; readonly slotIndex: null}
  | {readonly kind: 'validity'; readonly callAddress: '00590AB3'; readonly target: '0047A630'; readonly consumedWidthBits: 32; readonly slotIndex: number}
  | {readonly kind: 'corresponding-completed'; readonly callAddress: '00590AC6'; readonly target: '0049CFB0'; readonly consumedWidthBits: 32; readonly slotIndex: number}
  | {readonly kind: 'governor-politics'; readonly callAddress: '00590B4E'; readonly target: '004890A0'; readonly consumedWidthBits: 8; readonly slotIndex: null}
);
export type MonthlySpecialtyProductionArithmetic = {
  readonly factorTier: 'one' | 'two-to-three' | 'four-to-seven' | 'eight-to-thirty';
  readonly factorBitsU32: number;
  readonly factorValue: number;
  readonly politicsAL: number;
  readonly politicsTerm: number;
  readonly scaledValue: number;
  readonly convertedSigned32: number;
  readonly capApplied: boolean;
};
export type MonthlySpecialtyProductionQuantityRequest = {
  readonly pushAddress: '00590B82'; readonly continuationAddress: '00590B83';
  readonly quantityU32: number; readonly quantitySigned32: number;
};
type Evidence = typeof MONTHLY_SPECIALTY_PRODUCTION.evidence;
type ReceiptBase = {
  readonly supported: true;
  readonly profile: Common['profile']; readonly arithmeticProfile: Common['arithmeticProfile'];
  readonly equipmentType: Common['equipmentType'];
  readonly observations: MonthlySpecialtyProductionInput;
  /** Captured returns only; mapper and converter are documented separately. */
  readonly capturedReturns: readonly MonthlySpecialtyProductionCapturedReturn[];
  readonly evidence: Evidence;
};
export type MonthlySpecialtyProductionReceipt = ReceiptBase & (
  | {readonly path: 'not-specialty'; readonly completedFacilityCount: null; readonly arithmetic: null; readonly quantityRequest: null}
  | {readonly path: 'no-completed-facilities'; readonly completedFacilityCount: 0; readonly arithmetic: null; readonly quantityRequest: null}
  | {readonly path: 'production'; readonly completedFacilityCount: number; readonly arithmetic: MonthlySpecialtyProductionArithmetic; readonly quantityRequest: MonthlySpecialtyProductionQuantityRequest}
);
export type MonthlySpecialtyProductionRejection = {readonly supported: false; readonly reason: MonthlySpecialtyProductionRejectionReason; readonly evidence: Evidence};
export type MonthlySpecialtyProductionResult = MonthlySpecialtyProductionReceipt | MonthlySpecialtyProductionRejection;
const evidence = MONTHLY_SPECIALTY_PRODUCTION.evidence;
class Invalid extends Error {readonly reason: MonthlySpecialtyProductionRejectionReason; constructor(reason: MonthlySpecialtyProductionRejectionReason) {super(reason); this.reason = reason;}}
function record(value: unknown, allowed: readonly string[], required: readonly string[]): Record<string, unknown> {
  if (value === null || typeof value !== 'object' || ![Object.prototype, null].includes(Object.getPrototypeOf(value))) throw new Invalid('invalid-input');
  const descriptors = Object.getOwnPropertyDescriptors(value);
  if (Reflect.ownKeys(value).some(key => typeof key !== 'string' || !allowed.includes(key))) throw new Invalid('unexpected-field');
  if (required.some(key => !Object.hasOwn(descriptors, key))) throw new Invalid('invalid-input');
  for (const descriptor of Object.values(descriptors)) if (!Object.hasOwn(descriptor, 'value') || !descriptor.enumerable) throw new Invalid('invalid-input');
  return Object.fromEntries(Object.entries(descriptors).map(([key, descriptor]) => [key, descriptor.value]));
}
function u32(value: unknown): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0 || value > 0xFFFFFFFF) throw new Invalid('invalid-input');
  return value === 0 ? 0 : value;
}
function array30(value: unknown): unknown[] {
  if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype) throw new Invalid('invalid-input');
  const d: Record<string, PropertyDescriptor> = Object.getOwnPropertyDescriptors(value);
  if (d.length?.value !== 30) throw new Invalid('invalid-input');
  const arrayLike = {__proto__: null, length: 30};
  const names = Array.from(arrayLike, (_, i) => String(i));
  if (Reflect.ownKeys(value).some(key => typeof key !== 'string' || (key !== 'length' && !names.includes(key)))) throw new Invalid('unexpected-field');
  return names.map(key => {if (!Object.hasOwn(d, key)) throw new Invalid('invalid-input'); const entry = d[key]; if (!entry || !Object.hasOwn(entry, 'value') || !entry.enumerable) throw new Invalid('invalid-input'); return entry.value;});
}
function fromBits(bits: number): number {const view = new DataView(new ArrayBuffer(4)); view.setUint32(0, bits, true); return view.getFloat32(0, true);}
function toBits(value: number): number {const view = new DataView(new ArrayBuffer(4)); view.setFloat32(0, value, true); return view.getUint32(0, true);}
/** Pure per-equipment captured-observation projection. No native calls, memory reads or state writes. */
export function calculateMonthlySpecialtyProduction(input: MonthlySpecialtyProductionInput): MonthlySpecialtyProductionResult {
  try {
    const raw = record(input, ['profile', 'arithmeticProfile', 'equipmentType', 'specialtyEaxU32', 'slots', 'governorPoliticsEaxU32'], ['profile', 'arithmeticProfile', 'equipmentType', 'specialtyEaxU32']);
    if (raw.profile !== 'monthly-specialty-production-observed-v1' || raw.arithmeticProfile !== 'comment-f32-rne-trunc-v1') throw new Invalid('unsupported-profile');
    const equipmentType = u32(raw.equipmentType);
    if (equipmentType < 1 || equipmentType > 4) throw new Invalid('invalid-input');
    const specialty = u32(raw.specialtyEaxU32);
    const capturedReturns: MonthlySpecialtyProductionCapturedReturn[] = [];
    const capture = (kind: MonthlySpecialtyProductionCapturedReturn['kind'], callAddress: MonthlySpecialtyProductionCapturedReturn['callAddress'], target: MonthlySpecialtyProductionCapturedReturn['target'], eaxU32: number, consumedWidthBits: 8 | 32, slotIndex: number | null = null): void => {
      Object.defineProperty(capturedReturns, capturedReturns.length, {value: {kind, callAddress, target, slotIndex, eaxU32, consumedWidthBits, consumedValue: consumedWidthBits === 8 ? eaxU32 & 255 : eaxU32} as MonthlySpecialtyProductionCapturedReturn, writable: true, enumerable: true, configurable: true});
    };
    capture('specialty', '00590A7E', '0047B3A0', specialty, 8);
    const observations: Record<string, unknown> = {profile: raw.profile, arithmeticProfile: raw.arithmeticProfile, equipmentType, specialtyEaxU32: specialty};
    let count: number | null = null;
    let arithmetic: MonthlySpecialtyProductionArithmetic | null = null;
    let quantityRequest: MonthlySpecialtyProductionQuantityRequest | null = null;
    let path: MonthlySpecialtyProductionReceipt['path'] = 'not-specialty';
    if ((specialty & 255) === 0) {
      if (Object.hasOwn(raw, 'slots') || Object.hasOwn(raw, 'governorPoliticsEaxU32')) throw new Invalid('stage-mismatch');
    } else {
      if (!Object.hasOwn(raw, 'slots')) throw new Invalid('stage-mismatch');
      count = 0;
      const slots = array30(raw.slots).map((value, i) => {
        const slot = record(value, ['validityEaxU32', 'correspondingCompletedEaxU32'], ['validityEaxU32']);
        const validity = u32(slot.validityEaxU32);
        capture('validity', '00590AB3', '0047A630', validity, 32, i);
        if (validity === 0) {
          if (Object.hasOwn(slot, 'correspondingCompletedEaxU32')) throw new Invalid('stage-mismatch');
          return {validityEaxU32: validity};
        }
        if (!Object.hasOwn(slot, 'correspondingCompletedEaxU32')) throw new Invalid('stage-mismatch');
        const completion = u32(slot.correspondingCompletedEaxU32);
        capture('corresponding-completed', '00590AC6', '0049CFB0', completion, 32, i);
        if (completion !== 0) count!++;
        return {validityEaxU32: validity, correspondingCompletedEaxU32: completion};
      });
      observations.slots = slots;
      path = 'no-completed-facilities';
      if (count === 0) {
        if (Object.hasOwn(raw, 'governorPoliticsEaxU32')) throw new Invalid('stage-mismatch');
      } else {
        if (!Object.hasOwn(raw, 'governorPoliticsEaxU32')) throw new Invalid('stage-mismatch');
        const politics = u32(raw.governorPoliticsEaxU32);
        observations.governorPoliticsEaxU32 = politics;
        capture('governor-politics', '00590B4E', '004890A0', politics, 8);
        const constants = MONTHLY_SPECIALTY_PRODUCTION.arithmeticProfile.constants;
        const c = (key: keyof typeof constants): number => fromBits(constants[key].bitsU32);
        let factorTier: MonthlySpecialtyProductionArithmetic['factorTier'];
        let factorBeforeStore: number;
        if (count === 1) {factorTier = 'one'; factorBeforeStore = 1;}
        else if (count <= 3) {factorTier = 'two-to-three'; factorBeforeStore = (count - 1) * c('half') + c('one');}
        else if (count <= 7) {factorTier = 'four-to-seven'; factorBeforeStore = (count - 3) * c('quarter') + c('two');}
        else {factorTier = 'eight-to-thirty'; factorBeforeStore = (count - 7) * c('tenth') + c('three');}
        // Exactly one binary32 store. All other bounded dyadic operations are exact in binary64.
        const factorBitsU32 = toBits(factorBeforeStore);
        const factorValue = fromBits(factorBitsU32);
        const politicsAL = politics & 255;
        const politicsTerm = (politicsAL >>> 1) + 60;
        const scaledValue = politicsTerm * factorValue * c('three');
        // Explicit profile assumption: unknown00707A74 truncates toward zero.
        const convertedSigned32 = Math.trunc(scaledValue);
        const capApplied = convertedSigned32 > 1500;
        const quantity = capApplied ? 1500 : convertedSigned32;
        arithmetic = {factorTier, factorBitsU32, factorValue, politicsAL, politicsTerm, scaledValue, convertedSigned32, capApplied};
        quantityRequest = {pushAddress: '00590B82', continuationAddress: '00590B83', quantityU32: quantity, quantitySigned32: quantity};
        path = 'production';
      }
    }
    const common: ReceiptBase = {supported: true, profile: raw.profile, arithmeticProfile: raw.arithmeticProfile, equipmentType: equipmentType as Common['equipmentType'], observations: observations as MonthlySpecialtyProductionInput, capturedReturns, evidence};
    if (path === 'not-specialty') return freeze({...common, path, completedFacilityCount: null, arithmetic: null, quantityRequest: null});
    if (path === 'no-completed-facilities') return freeze({...common, path, completedFacilityCount: 0, arithmetic: null, quantityRequest: null});
    if (count === null || arithmetic === null || quantityRequest === null) throw new Error('internal production stage invariant');
    return freeze({...common, path, completedFacilityCount: count, arithmetic, quantityRequest});
  } catch (error) {
    if (error instanceof Invalid) return freeze({supported: false, reason: error.reason, evidence});
    throw error;
  }
}
