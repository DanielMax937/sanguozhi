import source from '../../../docs/sources/production-price.json' with { type: 'json' };

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object') {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
}

/** The public original listing's resolved-input projection, never its separate MOD. */
export const PRODUCTION_PRICE = deepFreeze(source);
export type ProductionPriceInput = {
  readonly profile: 'production-price-resolved-v1';
  /** uint16 value captured once at 005C637A, before the three helper calls. */
  readonly savedBasePriceWord: number;
  /** Observed raw uint32 EAX from 0047B3A0. Only its low AL byte is tested. */
  readonly specialtyHelperEax: number;
};
export type ProductionPriceRejectionReason = 'invalid-input' | 'unexpected-field'
  | 'unsupported-profile' | 'invalid-base-price-word' | 'invalid-specialty-helper-eax';
type Evidence = typeof PRODUCTION_PRICE.evidence;
export type ProductionPriceRejection = {
  readonly supported: false;
  readonly reason: ProductionPriceRejectionReason;
  readonly evidence: Evidence;
};
export type ProductionPriceReceipt = {
  readonly supported: true;
  readonly profile: 'production-price-resolved-v1';
  readonly savedBasePriceWord: number;
  readonly specialtyHelperEax: number;
  readonly specialtyResultAl: number;
  readonly discountApplied: boolean;
  readonly returnedPrice: number;
  readonly evidence: Evidence;
};
export type ProductionPriceResult = ProductionPriceRejection | ProductionPriceReceipt;

const evidence = PRODUCTION_PRICE.evidence;
const limits = PRODUCTION_PRICE.constants;
const reject = (reason: ProductionPriceRejectionReason): ProductionPriceRejection =>
  Object.freeze({supported: false, reason, evidence});
const integer = (value: unknown, max: number): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 && value <= max;

/**
 * Both native pointer validators have already passed. This pure input snapshot
 * does not implement those gates, price-table resolution, ID/category/specialty
 * helpers, complete command eligibility, debit/stock writers or scheduling.
 * Unsupported engineering input is not a native early-return zero.
 */
export function calculateProductionPrice(input: ProductionPriceInput): ProductionPriceResult {
  if (input === null || typeof input !== 'object'
      || ![Object.prototype, null].includes(Object.getPrototypeOf(input))) return reject('invalid-input');
  const allowed = ['profile', 'savedBasePriceWord', 'specialtyHelperEax'];
  const keys = Reflect.ownKeys(input);
  if (keys.some(key => typeof key !== 'string' || !allowed.includes(key))) return reject('unexpected-field');
  const descriptors = Object.getOwnPropertyDescriptors(input);
  if (keys.length !== allowed.length || allowed.some(key => !descriptors[key] || !('value' in descriptors[key]))) return reject('invalid-input');
  const profile = descriptors.profile.value;
  const savedBasePriceWord = descriptors.savedBasePriceWord.value;
  const specialtyHelperEax = descriptors.specialtyHelperEax.value;
  if (profile !== PRODUCTION_PRICE.profileId) return reject('unsupported-profile');
  if (!integer(savedBasePriceWord, 0xffff)) return reject('invalid-base-price-word');
  if (!integer(specialtyHelperEax, 0xffffffff)) return reject('invalid-specialty-helper-eax');
  const specialtyResultAl = specialtyHelperEax & 0xff;
  const discountApplied = specialtyResultAl !== 0;
  // MOVZX's uint16 domain keeps the original signed multiply-high division
  // nonnegative and exact here, including legal zero and sub-unit discounts.
  const returnedPrice = discountApplied
    ? Math.floor(savedBasePriceWord * limits.discountNumerator / limits.discountDenominator)
    : savedBasePriceWord;
  return Object.freeze({supported: true, profile, savedBasePriceWord, specialtyHelperEax,
    specialtyResultAl, discountApplied, returnedPrice, evidence});
}
