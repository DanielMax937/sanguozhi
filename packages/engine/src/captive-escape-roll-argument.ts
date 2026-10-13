import source from '../../../docs/sources/captive-escape-roll-argument.json' with { type: 'json' };

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object') {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
}

/** Published-listing reconstruction only, not an escape decision or probability. */
export const CAPTIVE_ESCAPE_ROLL_ARGUMENT = deepFreeze(source);
export type CaptiveEscapeRollArgumentInput = {
  readonly profile: 'captive-escape-roll-argument-u8-v1';
  /** BL at 00582CE4, without asserting any earlier getter's ABI. */
  readonly savedBlU8: number;
  /** AL at 00582CE4. */
  readonly currentAlU8: number;
  /** The late byte read at 00582CF9, not the earlier qualification read. */
  readonly lateCaptiveMonthsU8: number;
};
export type CaptiveEscapeRollArgumentRejectionReason = 'invalid-input' | 'unexpected-field'
  | 'unsupported-profile' | 'invalid-saved-bl-u8' | 'invalid-current-al-u8'
  | 'invalid-late-captive-months-u8';
type Evidence = typeof CAPTIVE_ESCAPE_ROLL_ARGUMENT.evidence;
export type CaptiveEscapeRollArgumentRejection = {
  readonly supported: false;
  readonly reason: CaptiveEscapeRollArgumentRejectionReason;
  readonly evidence: Evidence;
};
export type CaptiveEscapeRollArgumentReceipt = CaptiveEscapeRollArgumentInput & {
  readonly supported: true;
  readonly selectedMaximumByte: number;
  readonly effectiveStat: number;
  readonly effectiveMonthFactor: number;
  readonly numerator: number;
  readonly rollArgument: number;
  readonly evidence: Evidence;
};
export type CaptiveEscapeRollArgumentResult = CaptiveEscapeRollArgumentRejection | CaptiveEscapeRollArgumentReceipt;

const evidence = CAPTIVE_ESCAPE_ROLL_ARGUMENT.evidence;
const reject = (reason: CaptiveEscapeRollArgumentRejectionReason): CaptiveEscapeRollArgumentRejection =>
  Object.freeze({supported: false, reason, evidence});
const u8 = (value: unknown): value is number => typeof value === 'number'
  && Number.isSafeInteger(value) && value >= 0 && value <= 255;

/**
 * Pure 00582CE4..<00582D31 argument arithmetic; no CALL, RNG, eligibility,
 * escape list, release, state write or scheduler. Late months 0/1 are valid
 * scalars here; their acceptance does not establish reachability past the
 * earlier month gate. Rejection is an engineering boundary, not a native path.
 */
export function calculateCaptiveEscapeRollArgument(input: CaptiveEscapeRollArgumentInput): CaptiveEscapeRollArgumentResult {
  if (input === null || typeof input !== 'object') return reject('invalid-input');
  const prototype = Object.getPrototypeOf(input);
  if (prototype !== Object.prototype && prototype !== null) return reject('invalid-input');
  const allowed = ['profile', 'savedBlU8', 'currentAlU8', 'lateCaptiveMonthsU8'];
  const keys = Reflect.ownKeys(input);
  if (keys.some(key => typeof key !== 'string' || !allowed.includes(key))) return reject('unexpected-field');
  const descriptors = Object.getOwnPropertyDescriptors(input);
  if (keys.length !== allowed.length || allowed.some(key => !descriptors[key] || !('value' in descriptors[key])))
    return reject('invalid-input');
  const profile = descriptors.profile!.value;
  if (profile !== 'captive-escape-roll-argument-u8-v1') return reject('unsupported-profile');
  const bl = descriptors.savedBlU8!.value;
  const al = descriptors.currentAlU8!.value;
  const months = descriptors.lateCaptiveMonthsU8!.value;
  if (!u8(bl)) return reject('invalid-saved-bl-u8');
  if (!u8(al)) return reject('invalid-current-al-u8');
  if (!u8(months)) return reject('invalid-late-captive-months-u8');
  const savedBlU8 = bl === 0 ? 0 : bl;
  const currentAlU8 = al === 0 ? 0 : al;
  const lateCaptiveMonthsU8 = months === 0 ? 0 : months;
  const selectedMaximumByte = Math.max(savedBlU8, currentAlU8);
  const effectiveStat = Math.max(30, selectedMaximumByte);
  const effectiveMonthFactor = Math.max(1, lateCaptiveMonthsU8 - 2);
  const numerator = effectiveMonthFactor * effectiveMonthFactor * effectiveStat;
  // n <= 16,322,295: both original IMULs are exact signed32; the listed
  // IMUL-high/SAR EDX,4/sign-correction equals floor(n/150) on this domain.
  // There is no local 100 cap. Maximum argument: 108815.
  const rollArgument = Math.max(1, Math.floor(numerator / 150));
  return Object.freeze({supported: true, profile, savedBlU8, currentAlU8, lateCaptiveMonthsU8,
    selectedMaximumByte, effectiveStat, effectiveMonthFactor, numerator, rollArgument, evidence});
}
