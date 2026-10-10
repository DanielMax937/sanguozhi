import source from '../../../docs/sources/treasure-roll-argument.json' with { type: 'json' };

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object') {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
}

/** Published-listing reconstruction only, not stock-executable certification. */
export const TREASURE_ROLL_ARGUMENT = deepFreeze(source);
export type TreasureRollArgumentInput = {
  readonly profile: 'treasure-roll-resolved-v1';
  readonly treasureValueU8: number;
};
export type TreasureRollArgumentRejectionReason = 'invalid-input' | 'unexpected-field'
  | 'unsupported-profile' | 'invalid-treasure-value-u8';
type Evidence = typeof TREASURE_ROLL_ARGUMENT.evidence;
export type TreasureRollArgumentRejection = {
  readonly supported: false;
  readonly reason: TreasureRollArgumentRejectionReason;
  readonly evidence: Evidence;
};
export type TreasureRollArgumentReceipt = TreasureRollArgumentInput & {
  readonly supported: true;
  readonly numerator: number;
  readonly quotient: number;
  readonly rollArgument: number;
  readonly branch: 'minimum-clamp' | 'quotient';
  readonly evidence: Evidence;
};
export type TreasureRollArgumentResult = TreasureRollArgumentRejection | TreasureRollArgumentReceipt;

const evidence = TREASURE_ROLL_ARGUMENT.evidence;
const reject = (reason: TreasureRollArgumentRejectionReason): TreasureRollArgumentRejection =>
  Object.freeze({supported: false, reason, evidence});
const uint8 = (value: unknown): value is number => typeof value === 'number'
  && Number.isSafeInteger(value) && value >= 0 && value <= 255;

/**
 * One already-selected candidate's stable, resolved value byte only. Candidate
 * selection, native helpers, ownership writes and random draws are not modeled.
 * The result is a roll-call argument, never a final probability or RNG outcome.
 * Input rejection is an engineering boundary, not a native invalid-pointer path.
 */
export function calculateTreasureRollArgument(input: TreasureRollArgumentInput): TreasureRollArgumentResult {
  if (input === null || typeof input !== 'object') return reject('invalid-input');
  const prototype = Object.getPrototypeOf(input);
  if (prototype !== Object.prototype && prototype !== null) return reject('invalid-input');
  const allowed = ['profile', 'treasureValueU8'];
  const keys = Reflect.ownKeys(input);
  if (keys.some(key => typeof key !== 'string' || !allowed.includes(key))) return reject('unexpected-field');
  const descriptors = Object.getOwnPropertyDescriptors(input);
  if (keys.length !== allowed.length || allowed.some(key => !descriptors[key] || !('value' in descriptors[key])))
    return reject('invalid-input');
  const profile = descriptors.profile!.value;
  if (profile !== 'treasure-roll-resolved-v1') return reject('unsupported-profile');
  const value = descriptors.treasureValueU8!.value;
  if (!uint8(value)) return reject('invalid-treasure-value-u8');
  const treasureValueU8 = value === 0 ? 0 : value;
  const numerator = 61 - treasureValueU8;
  // Signed division truncates toward zero. Negative numerators must not use floor.
  const truncated = Math.trunc(numerator / 20);
  const quotient = truncated === 0 ? 0 : truncated;
  const rollArgument = Math.max(1, quotient);
  const branch = quotient < 1 ? 'minimum-clamp' : 'quotient';
  return Object.freeze({supported: true, profile, treasureValueU8, numerator, quotient,
    rollArgument, branch, evidence});
}
