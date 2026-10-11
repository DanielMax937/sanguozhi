import source from '../../../docs/sources/production-time.json' with { type: 'json' };

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object') {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
}
export const PRODUCTION_TIME = deepFreeze(source);
export type ProductionTimeCapture = { readonly callAddress: string; readonly slotIndex?: number; readonly eax: number };
export type ProductionTimeInput = {
  readonly profile: 'production-time-observations-v1';
  readonly nativeEquipmentType: number;
  readonly captures: readonly ProductionTimeCapture[];
};
export type ProductionTimeRejectionReason = 'invalid-input' | 'unsupported-profile'
  | 'invalid-native-equipment-type' | 'invalid-captures' | 'capture-sequence-mismatch';
export type ProductionTimeRejection = { readonly supported: false; readonly reason: ProductionTimeRejectionReason; readonly evidence: typeof PRODUCTION_TIME.evidence };
export type ProductionTimeSlotReceipt = { readonly slotIndex: number; readonly validityEax: number; readonly intelligenceAl: number | null; readonly skillEax: number | null };
export type ProductionTimeCallDetail = { readonly callAddress: string; readonly target: string; readonly slotIndex: number | null; readonly queryId: number | null };
export type ProductionTimeReceipt = {
  readonly supported: true;
  readonly profile: 'production-time-observations-v1';
  readonly nativeEquipmentType: number;
  readonly reason: 'native-invalid-type-return-zero' | 'native-non-duration-type-return-zero' | 'captured-duration-projection';
  readonly returnedValue: number;
  readonly rawEaxU32: number;
  readonly scannedSlots: boolean;
  readonly skillQueryId: number | null;
  readonly slots: readonly ProductionTimeSlotReceipt[];
  readonly intelligenceSum: number | null;
  readonly intelligenceMax: number | null;
  readonly rawX: number | null;
  readonly clampedX: number | null;
  readonly q: number | null;
  readonly facilityApplied: boolean;
  readonly skillApplied: boolean;
  readonly beforeSkill: number | null;
  readonly trace: readonly ProductionTimeCapture[];
  readonly callDetails: readonly ProductionTimeCallDetail[];
  readonly evidence: typeof PRODUCTION_TIME.evidence;
};
export type ProductionTimeResult = ProductionTimeRejection | ProductionTimeReceipt;
const uint32 = (v: unknown): v is number => typeof v === 'number' && Number.isSafeInteger(v) && v >= 0 && v <= 0xffffffff;
const signed32 = (v: unknown): v is number => typeof v === 'number' && Number.isSafeInteger(v) && v >= -0x80000000 && v <= 0x7fffffff;
function closed(value: unknown, keys: readonly string[]): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object' || ![Object.prototype, null].includes(Object.getPrototypeOf(value))) return false;
  const own = Reflect.ownKeys(value), d = Object.getOwnPropertyDescriptors(value);
  return own.length === keys.length && own.every(k => typeof k === 'string' && keys.includes(k))
    && keys.every(k => d[k] && 'value' in d[k]!);
}
const reject = (reason: ProductionTimeRejectionReason): ProductionTimeRejection => Object.freeze({supported: false, reason, evidence: PRODUCTION_TIME.evidence});

/**
 * Pure caller projection under specified normal returns and local preservation.
 * This does not restore helper bodies, mutable person/array identities, repeated
 * native memory reads, ABI safety, actual day units or production scheduling.
 */
export function calculateProductionTimeProjection(input: ProductionTimeInput): ProductionTimeResult {
  if (!closed(input, ['profile', 'nativeEquipmentType', 'captures'])) return reject('invalid-input');
  if (input.profile !== 'production-time-observations-v1') return reject('unsupported-profile');
  const type = input.nativeEquipmentType;
  if (!signed32(type)) return reject('invalid-native-equipment-type');
  const raw = input.captures;
  if (!Array.isArray(raw) || Object.getPrototypeOf(raw) !== Array.prototype) return reject('invalid-captures');
  const descriptors = Object.getOwnPropertyDescriptors(raw);
  if (raw.length > 15 || Reflect.ownKeys(raw).length !== raw.length + 1) return reject('invalid-captures');
  const captures: ProductionTimeCapture[] = [];
  for (let i = 0; i < raw.length; i++) {
    const descriptor = descriptors[String(i)];
    if (!descriptor || !('value' in descriptor)) return reject('invalid-captures');
    const capture: unknown = descriptor.value;
    if (capture === null || typeof capture !== 'object') return reject('invalid-captures');
    const hasSlot = Object.hasOwn(capture, 'slotIndex');
    if (!closed(capture, hasSlot ? ['callAddress', 'slotIndex', 'eax'] : ['callAddress', 'eax'])) return reject('invalid-captures');
    if (typeof capture.callAddress !== 'string' || !/^[0-9A-F]{8}$/.test(capture.callAddress) || !uint32(capture.eax)
      || (hasSlot && (!Number.isInteger(capture.slotIndex) || (capture.slotIndex as number) < 0 || (capture.slotIndex as number) > 2))) return reject('invalid-captures');
    captures.push(hasSlot ? {callAddress: capture.callAddress, slotIndex: capture.slotIndex as number, eax: capture.eax}
      : {callAddress: capture.callAddress, eax: capture.eax});
  }
  const trace: ProductionTimeCapture[] = [], callDetails: ProductionTimeCallDetail[] = [], slots: ProductionTimeSlotReceipt[] = [];
  let cursor = 0, mismatch = false;
  function observe(callAddress: string, target: string, slotIndex?: number, queryId: number | null = null): number {
    const capture = captures[cursor++];
    if (!capture || capture.callAddress !== callAddress || capture.slotIndex !== slotIndex) { mismatch = true; return 0; }
    trace.push(capture);
    callDetails.push({callAddress, target, slotIndex: slotIndex ?? null, queryId});
    return capture.eax;
  }
  const invalid = type < 0 || type > 11, early = invalid || type < 5;
  const scannedSlots = !early && type !== 9;
  const skillQueryId = scannedSlots ? (type <= 8 ? 0x52 : 0x53) : null;
  let sum = 0, maximum = 0, skillApplied = false, facilityApplied = false;
  if (scannedSlots) {
    for (let slotIndex = 0; slotIndex < 3; slotIndex++) {
      const validityEax = observe('005C6CF8', '0047A630', slotIndex);
      let intelligenceAl: number | null = null, skillEax: number | null = null;
      if (validityEax !== 0) {
        intelligenceAl = observe('005C6D06', '00489090', slotIndex) & 0xff;
        sum += intelligenceAl;
        maximum = Math.max(maximum, intelligenceAl);
        skillEax = observe('005C6D25', '004890F0', slotIndex, skillQueryId);
        if (skillEax !== 0) skillApplied = true;
      }
      slots.push({slotIndex, validityEax, intelligenceAl, skillEax});
    }
  }
  const rawX = early ? null : maximum + sum - 200;
  const clampedX = rawX === null ? null : Math.max(24, rawX);
  const q = clampedX === null ? null : Math.trunc(clampedX / 24);
  let duration = q === null ? 0 : 10 - q;
  if (!early && type >= 9) {
    const revalidated = observe('005C6D90', '0047A630');
    if (revalidated !== 0) {
      observe('005C6DAA', '00490D00');
      const facilityValid = observe('005C6DB0', '0047A630');
      if (facilityValid !== 0) {
        observe('005C6DCA', '00490D00');
        observe('005C6DD1', '004866F0');
        facilityApplied = observe('005C6DDE', '0049DAB0', undefined, 0x2d) !== 0;
        if (facilityApplied) duration = Math.max(2, 8 - q!);
      }
    }
  }
  if (mismatch || cursor !== captures.length) return reject('capture-sequence-mismatch');
  const beforeSkill = early ? null : duration;
  // CDQ / SUB EAX,EDX / SAR EAX,1 is truncation toward zero, not floor.
  const returnedValue = skillApplied ? (Math.trunc(duration / 2) || 0) : duration;
  return deepFreeze({supported: true, profile: 'production-time-observations-v1', nativeEquipmentType: type,
    reason: invalid ? 'native-invalid-type-return-zero' : early ? 'native-non-duration-type-return-zero' : 'captured-duration-projection',
    returnedValue, rawEaxU32: returnedValue >>> 0, scannedSlots, skillQueryId, slots,
    intelligenceSum: early ? null : sum, intelligenceMax: early ? null : maximum,
    rawX, clampedX, q, facilityApplied, skillApplied, beforeSkill, trace, callDetails, evidence: PRODUCTION_TIME.evidence});
}
