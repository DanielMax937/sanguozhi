import source from '../../../docs/sources/recruitment-quantity.json' with { type: 'json' };

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object') {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
}

/** Frozen source-listing evidence, not a stock/helper or command implementation. */
export const RECRUITMENT_QUANTITY = deepFreeze(source);
export type RecruitmentQuantityFactorBits = '3F800000' | '3F99999A' | '3FC00000';
export type RecruitmentQuantityCapture = {
  readonly callAddress: string;
  readonly slotIndex?: number;
  readonly eax: number;
};
/** Later fields are required exactly when all three entry validations succeed. */
export type RecruitmentQuantityInput = {
  readonly profile: 'recruitment-quantity-observations-f32-v1';
  readonly captures: readonly RecruitmentQuantityCapture[];
  readonly savedSecurityByte?: number;
  readonly resolvedFacilityFactorBits?: RecruitmentQuantityFactorBits;
  readonly difficultyWord?: number;
};
export type RecruitmentQuantityRejectionReason = 'invalid-input' | 'unexpected-field'
  | 'unsupported-profile' | 'invalid-captures' | 'capture-sequence-mismatch'
  | 'invalid-saved-security-byte' | 'unsupported-facility-factor-bits' | 'invalid-difficulty-word';
export type RecruitmentQuantityRejection = {
  readonly supported: false;
  readonly reason: RecruitmentQuantityRejectionReason;
  readonly evidence: typeof RECRUITMENT_QUANTITY.evidence;
};
export type RecruitmentQuantitySlotReceipt = {
  readonly slotIndex: number;
  readonly validityEax: number;
  readonly charismaEax: number | null;
  readonly charismaAl: number | null;
  readonly skillEax: number | null;
};
type CallSite = {
  readonly callAddress: string;
  readonly target: string;
  readonly slotIndex: number | null;
  readonly queryId: number | null;
};
export type RecruitmentQuantityCallDetail = CallSite & ({
  readonly kind: 'captured-eax' | 'derived-converter-eax';
  readonly eax: number;
  readonly st0Bits: null;
} | {
  readonly kind: 'captured-st0-f32';
  readonly eax: null;
  readonly st0Bits: RecruitmentQuantityFactorBits;
});
export type RecruitmentQuantityReceipt = {
  readonly supported: true;
  readonly profile: 'recruitment-quantity-observations-f32-v1';
  readonly reason: 'facility-invalid' | 'first-slot-invalid' | 'city-invalid' | 'captured-quantity-projection';
  readonly returnedValue: number;
  readonly rawEaxU32: number;
  readonly slots: readonly RecruitmentQuantitySlotReceipt[];
  readonly charismaSum: number | null;
  readonly validSlotCount: number | null;
  readonly skillParameter: 10 | 15 | null;
  readonly baseQuantity: number | null;
  readonly integerQuantity: number | null;
  readonly savedSecurityByte: number | null;
  readonly resolvedFacilityFactorBits: RecruitmentQuantityFactorBits | null;
  readonly difficultyWord: number | null;
  readonly convertedQuantity: number | null;
  readonly cityVirtualEax: number | null;
  readonly superApplied: boolean;
  readonly afterSuperU32: number | null;
  readonly pressureEax: number | null;
  readonly pressureApplied: boolean;
  readonly afterPressureU32: number | null;
  readonly firstTroopsEax: number | null;
  readonly firstCapacityEax: number | null;
  readonly firstSumU32: number | null;
  readonly capacityFallbackApplied: boolean;
  readonly secondTroopsEax: number | null;
  readonly secondCapacityEax: number | null;
  readonly trace: readonly RecruitmentQuantityCapture[];
  readonly callDetails: readonly RecruitmentQuantityCallDetail[];
  readonly evidence: typeof RECRUITMENT_QUANTITY.evidence;
};
export type RecruitmentQuantityResult = RecruitmentQuantityRejection | RecruitmentQuantityReceipt;

const profile = 'recruitment-quantity-observations-f32-v1';
const evidence = RECRUITMENT_QUANTITY.evidence;
const reject = (reason: RecruitmentQuantityRejectionReason): RecruitmentQuantityRejection =>
  Object.freeze({supported: false, reason, evidence});
const uint32 = (value: unknown): value is number => typeof value === 'number'
  && Number.isSafeInteger(value) && value >= 0 && value <= 0xffffffff;
function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object'
    && [Object.prototype, null].includes(Object.getPrototypeOf(value));
}
function closed(value: Record<string, unknown>, keys: readonly string[]): 'invalid-input' | 'unexpected-field' | null {
  const own = Reflect.ownKeys(value);
  if (own.some(key => typeof key !== 'string' || !keys.includes(key))) return 'unexpected-field';
  const descriptors = Object.getOwnPropertyDescriptors(value);
  return own.length !== keys.length || keys.some(key => !descriptors[key] || !('value' in descriptors[key]))
    ? 'invalid-input' : null;
}
const loopSites = new Set(['005C367B', '005C3689', '005C36AA']);

/**
 * Pure numerical/control-flow projection under specified normal returns and
 * local preservation. Inputs are observations, not live objects or callbacks.
 * The dead merit-word reads are intentionally omitted: this is not a complete
 * native memory-read trace. Helper bodies, stock constants, FPU exceptions,
 * pointer identity, ABI safety, real trace reachability and command writes are
 * not restored. Difficulty denotes the word observed after conversion; security
 * denotes the byte already saved before the ST0-supplying call.
 */
export function calculateRecruitmentQuantityProjection(input: RecruitmentQuantityInput): RecruitmentQuantityResult {
  if (!record(input)) return reject('invalid-input');
  const descriptors = Object.getOwnPropertyDescriptors(input);
  if (!descriptors.profile || !('value' in descriptors.profile)
      || !descriptors.captures || !('value' in descriptors.captures)) return reject('invalid-input');
  if (descriptors.profile.value !== profile) return reject('unsupported-profile');
  const raw = descriptors.captures.value;
  if (!Array.isArray(raw) || Object.getPrototypeOf(raw) !== Array.prototype) return reject('invalid-captures');
  const captureDescriptors = Object.getOwnPropertyDescriptors(raw);
  if (raw.length > 19 || Reflect.ownKeys(raw).length !== raw.length + 1) return reject('invalid-captures');
  const captures: RecruitmentQuantityCapture[] = [];
  for (let i = 0; i < raw.length; i++) {
    const descriptor = captureDescriptors[String(i)];
    if (!descriptor || !('value' in descriptor) || !record(descriptor.value)) return reject('invalid-captures');
    const capture = descriptor.value;
    const values = Object.getOwnPropertyDescriptors(capture);
    if (!values.callAddress || !('value' in values.callAddress)) return reject('invalid-captures');
    const callAddress = values.callAddress.value;
    if (typeof callAddress !== 'string' || !/^[0-9A-F]{8}$/.test(callAddress)) return reject('invalid-captures');
    const hasSlot = loopSites.has(callAddress);
    if (closed(capture, hasSlot ? ['callAddress', 'slotIndex', 'eax'] : ['callAddress', 'eax'])) return reject('invalid-captures');
    const eax = values.eax!.value;
    if (!uint32(eax)) return reject('invalid-captures');
    if (hasSlot) {
      const slotIndex = values.slotIndex!.value;
      if (typeof slotIndex !== 'number' || !Number.isInteger(slotIndex) || slotIndex < 0 || slotIndex > 2) return reject('invalid-captures');
      captures.push({callAddress, slotIndex, eax});
    } else captures.push({callAddress, eax});
  }

  const trace: RecruitmentQuantityCapture[] = [], callDetails: RecruitmentQuantityCallDetail[] = [];
  const slots: RecruitmentQuantitySlotReceipt[] = [];
  let cursor = 0, mismatch = false;
  function observe(callAddress: string, target: string, slotIndex?: number, queryId: number | null = null): number {
    const capture = captures[cursor++];
    if (!capture || capture.callAddress !== callAddress || capture.slotIndex !== slotIndex) { mismatch = true; return 0; }
    trace.push(capture);
    callDetails.push({callAddress, target, slotIndex: slotIndex ?? null, queryId, kind: 'captured-eax', eax: capture.eax, st0Bits: null});
    return capture.eax;
  }
  function early(reason: 'facility-invalid' | 'first-slot-invalid' | 'city-invalid'): RecruitmentQuantityResult {
    if (mismatch || cursor !== captures.length) return reject('capture-sequence-mismatch');
    const shape = closed(input, ['profile', 'captures']);
    if (shape) return reject(shape);
    return deepFreeze({supported: true, profile, reason, returnedValue: 0, rawEaxU32: 0, slots,
      charismaSum: null, validSlotCount: null, skillParameter: null, baseQuantity: null, integerQuantity: null,
      savedSecurityByte: null, resolvedFacilityFactorBits: null, difficultyWord: null, convertedQuantity: null,
      cityVirtualEax: null, superApplied: false, afterSuperU32: null, pressureEax: null, pressureApplied: false,
      afterPressureU32: null, firstTroopsEax: null, firstCapacityEax: null, firstSumU32: null,
      capacityFallbackApplied: false, secondTroopsEax: null, secondCapacityEax: null, trace, callDetails, evidence});
  }
  if (observe('005C3619', '0047A630') === 0) return early('facility-invalid');
  if (observe('005C3630', '0047A630') === 0) return early('first-slot-invalid');
  observe('005C3643', '004866F0'); // Opaque resolver word, independent of the following validation.
  if (observe('005C364B', '0047A630') === 0) return early('city-invalid');
  if (mismatch) return reject('capture-sequence-mismatch');
  const shape = closed(input, ['profile', 'captures', 'savedSecurityByte', 'resolvedFacilityFactorBits', 'difficultyWord']);
  if (shape) return reject(shape);
  const savedSecurityByte = descriptors.savedSecurityByte!.value;
  if (!uint32(savedSecurityByte) || savedSecurityByte > 0xff) return reject('invalid-saved-security-byte');
  const resolvedFacilityFactorBits = descriptors.resolvedFacilityFactorBits!.value;
  let factor: number;
  if (resolvedFacilityFactorBits === '3F800000') factor = 1;
  else if (resolvedFacilityFactorBits === '3F99999A') factor = 5033165 / 4194304;
  else if (resolvedFacilityFactorBits === '3FC00000') factor = 3 / 2;
  else return reject('unsupported-facility-factor-bits');
  const difficultyWord = descriptors.difficultyWord!.value;
  if (!uint32(difficultyWord)) return reject('invalid-difficulty-word');

  let charismaSum = 0, validSlotCount = 0, skillParameter: 10 | 15 = 10;
  for (let slotIndex = 0; slotIndex < 3; slotIndex++) {
    const validityEax = observe('005C367B', '0047A630', slotIndex);
    let charismaEax: number | null = null, charismaAl: number | null = null, skillEax: number | null = null;
    if (validityEax !== 0) {
      validSlotCount++;
      charismaEax = observe('005C3689', '004890B0', slotIndex);
      charismaAl = charismaEax & 0xff;
      charismaSum += charismaAl;
      skillEax = observe('005C36AA', '004890F0', slotIndex, 0x4f);
      if (skillEax !== 0) skillParameter = 15;
    }
    slots.push({slotIndex, validityEax, charismaEax, charismaAl, skillEax});
  }
  callDetails.push({callAddress: '005C36C8', target: '005C3550', slotIndex: null, queryId: null,
    kind: 'captured-st0-f32', eax: null, st0Bits: resolvedFacilityFactorBits});
  // These nonnegative bounded integers agree with both signed magic divisions.
  const baseQuantity = 1000 + Math.floor((savedSecurityByte + 20) * charismaSum / 20);
  const integerQuantity = Math.floor(baseQuantity * skillParameter / 10);
  // This finite binary64 product is exact. Recruitment-specific independent
  // rational checks establish the same final truncation for x87 PC24/53/64 and
  // every rounding direction; their rounded products need not themselves match.
  const convertedQuantity = Math.trunc(integerQuantity * factor);
  callDetails.push({callAddress: '005C3710', target: '00707A74', slotIndex: null, queryId: null,
    kind: 'derived-converter-eax', eax: convertedQuantity, st0Bits: null});
  const cityVirtualEax = difficultyWord === 2 ? observe('005C3725', 'vtable+0x48') : null;
  const superApplied = difficultyWord === 2 && cityVirtualEax === 0;
  const afterSuperU32 = (superApplied ? convertedQuantity + convertedQuantity : convertedQuantity) >>> 0;
  const pressureEax = observe('005C3738', '004B99B0');
  const pressureApplied = pressureEax !== 0;
  // CDQ / SUB EAX,EDX / SAR EAX,1: signed halving toward zero.
  const afterPressureU32 = pressureApplied ? Math.trunc((afterSuperU32 | 0) / 2) >>> 0 : afterSuperU32;
  const firstTroopsEax = observe('005C374E', 'vtable+0x50');
  const firstSumU32 = (firstTroopsEax + afterPressureU32) >>> 0;
  const firstCapacityEax = observe('005C3757', '00486BC0');
  const capacityFallbackApplied = (firstCapacityEax | 0) < (firstSumU32 | 0);
  let secondTroopsEax: number | null = null, secondCapacityEax: number | null = null;
  let rawEaxU32 = afterPressureU32;
  if (capacityFallbackApplied) {
    secondTroopsEax = observe('005C3764', 'vtable+0x50');
    secondCapacityEax = observe('005C376B', '00486BC0');
    rawEaxU32 = (secondCapacityEax - secondTroopsEax) >>> 0;
  }
  if (mismatch || cursor !== captures.length) return reject('capture-sequence-mismatch');
  return deepFreeze({supported: true, profile, reason: 'captured-quantity-projection', returnedValue: rawEaxU32 | 0,
    rawEaxU32, slots, charismaSum, validSlotCount, skillParameter, baseQuantity, integerQuantity,
    savedSecurityByte, resolvedFacilityFactorBits, difficultyWord, convertedQuantity, cityVirtualEax,
    superApplied, afterSuperU32, pressureEax, pressureApplied, afterPressureU32, firstTroopsEax,
    firstCapacityEax, firstSumU32, capacityFallbackApplied, secondTroopsEax, secondCapacityEax,
    trace, callDetails, evidence});
}
