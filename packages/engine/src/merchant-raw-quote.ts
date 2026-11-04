import { detachBoundedCityData } from './internal/bounded-city-json.ts';

/** Fixed public IDB source profile, not authenticated clean-stock or UI pricing. */
export const MERCHANT_RAW_QUOTE_PROFILE = 'merchant-raw-quote-s1-resolved-v1' as const;
const evidence = Object.freeze({
  sourceCommit: '66e167e40c3440929ec016f3872aefc3486434c1',
  archiveGitBlob: 'a6689f01a228d272c66abb376bcfa0044ff767ef',
  classification: 'mod-associated-idb-source-profile' as const,
  stockVerified: false as const, uiScaleVerified: false as const, nativeExecution: false as const,
});
export type MerchantRawQuoteInput = Readonly<{
  profile: typeof MERCHANT_RAW_QUOTE_PROFILE;
  /** Already resolved low AL byte; neither a character lookup nor UI-clamped politics. */
  politicsByte: number;
  /** Raw city +0x7C byte, not the existing service's UI 3..7 price. */
  rawTradePriceByte: number;
  /** Positive buy, negative sell. INT_MIN is deliberately outside this projection. */
  signedFoodQuantity: number;
}>;
export type MerchantRawQuoteReason = 'invalid-data' | 'invalid-shape' | 'unsupported-profile'
  | 'invalid-politics-byte' | 'invalid-price-byte' | 'zero-price-outside-domain' | 'invalid-food-quantity';
const reject = (reason: MerchantRawQuoteReason) => Object.freeze({ supported: false as const, reason, evidence });
const integer = (v: unknown, lo: number, hi: number): v is number =>
  typeof v === 'number' && Number.isSafeInteger(v) && !Object.is(v, -0) && v >= lo && v <= hi;

/** No state writes, eligibility checks, pointer dereferences or legacy protocol changes. */
export function calculateMerchantRawQuote(input: unknown) {
  const detached = detachBoundedCityData(input);
  if (!detached.ok) return reject('invalid-data');
  const v = detached.value;
  if (v === null || typeof v !== 'object' || Array.isArray(v)) return reject('invalid-shape');
  const row = v as Record<string, unknown>;
  const keys = ['profile', 'politicsByte', 'rawTradePriceByte', 'signedFoodQuantity'];
  if (Object.keys(row).length !== keys.length || keys.some(k => !Object.hasOwn(row, k))) return reject('invalid-shape');
  if (row.profile !== MERCHANT_RAW_QUOTE_PROFILE) return reject('unsupported-profile');
  if (!integer(row.politicsByte, 0, 255)) return reject('invalid-politics-byte');
  if (!integer(row.rawTradePriceByte, 0, 255)) return reject('invalid-price-byte');
  if (row.rawTradePriceByte === 0) return reject('zero-price-outside-domain');
  if (!integer(row.signedFoodQuantity, -2147483647, 2147483647)) return reject('invalid-food-quantity');
  const politicsByte = row.politicsByte, rawTradePriceByte = row.rawTradePriceByte;
  const signedFoodQuantity = row.signedFoodQuantity;
  const direction = signedFoodQuantity > 0 ? 'buy' as const : signedFoodQuantity < 0 ? 'sell' as const : 'zero' as const;
  const magnitude = BigInt(Math.abs(signedFoodQuantity));
  const factor = BigInt(450 - politicsByte), price = BigInt(rawTradePriceByte);
  // Within the supported int32/byte domain all products fit signed 64 bits.
  // Thus the observed low-64 multiplication is exact without wrapped intermediates.
  const numerator = direction === 'buy' ? magnitude * factor * 10n : direction === 'sell' ? magnitude * -3200n : 0n;
  const denominator = direction === 'buy' ? price * 400n : direction === 'sell' ? factor * price : 1n;
  const quotient = numerator / denominator; // signed integer division truncates toward zero
  const clipped = quotient < -2147483648n ? -2147483648n : quotient > 2147483647n ? 2147483647n : quotient;
  return Object.freeze({ supported: true as const, profile: MERCHANT_RAW_QUOTE_PROFILE,
    politicsByte, rawTradePriceByte, signedFoodQuantity, direction,
    numerator: numerator.toString(), denominator: denominator.toString(),
    quotientBeforeInt32Clamp: quotient.toString(), signedRemainder: (numerator % denominator).toString(),
    returnedSignedQuote: Number(clipped), clamped: clipped !== quotient,
    rounding: 'toward-zero' as const, zeroQuantityEarlyReturn: direction === 'zero',
    helpersUsed: direction === 'zero' ? false : true,
    stateWritten: false as const, evidence });
}
