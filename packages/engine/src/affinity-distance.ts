import source from '../../../docs/sources/affinity-distance.json' with { type: 'json' };

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object') {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
}

/** A tutorial-mnemonic projection, not original-executable or caller evidence. */
export const AFFINITY_DISTANCE = deepFreeze(source);
export type AffinityDistanceInput = {
  readonly profile: 'affinity-distance-tutorial-u8-v1';
  readonly sourceAffinityByte: number;
  readonly targetAffinityByte: number;
};
export type AffinityDistanceRejectionReason = 'invalid-input' | 'unexpected-field'
  | 'unsupported-profile' | 'invalid-source-affinity-byte' | 'invalid-target-affinity-byte';
type Evidence = typeof AFFINITY_DISTANCE.evidence;
export type AffinityDistanceRejection = {
  readonly supported: false;
  readonly reason: AffinityDistanceRejectionReason;
  readonly evidence: Evidence;
};
export type AffinityDistanceReceipt = {
  readonly supported: true;
  readonly profile: 'affinity-distance-tutorial-u8-v1';
  readonly sourceAffinityByte: number;
  readonly targetAffinityByte: number;
  readonly absoluteDifference: number;
  readonly complement: number;
  readonly signedComparisonBranch: 'keep-d' | 'use-complement';
  readonly returnedSigned32: number;
  readonly returnedEax: number;
  readonly returnedAl: number;
  readonly evidence: Evidence;
};
export type AffinityDistanceResult = AffinityDistanceRejection | AffinityDistanceReceipt;

const evidence = AFFINITY_DISTANCE.evidence;
const reject = (reason: AffinityDistanceRejectionReason): AffinityDistanceRejection =>
  Object.freeze({supported: false, reason, evidence});
const uint8 = (value: unknown): value is number => typeof value === 'number'
  && Number.isSafeInteger(value) && value >= 0 && value <= 255;

/**
 * Only two already-resolved unsigned bytes enter this pure function. ID lookup,
 * native pointer validation, caller semantics and invalid-native return paths
 * are deliberately not modeled as this API's input rejection. In particular,
 * the tutorial's signed comparison can return negative values outside 0..149.
 */
export function calculateAffinityDistance(input: AffinityDistanceInput): AffinityDistanceResult {
  if (input === null || typeof input !== 'object') return reject('invalid-input');
  const prototype = Object.getPrototypeOf(input);
  if (prototype !== Object.prototype && prototype !== null) return reject('invalid-input');
  const allowed = ['profile', 'sourceAffinityByte', 'targetAffinityByte'];
  const keys = Reflect.ownKeys(input);
  if (keys.some(key => typeof key !== 'string' || !allowed.includes(key))) return reject('unexpected-field');
  const descriptors = Object.getOwnPropertyDescriptors(input);
  if (keys.length !== allowed.length || allowed.some(key => !descriptors[key] || !('value' in descriptors[key])))
    return reject('invalid-input');
  const profile = descriptors.profile!.value;
  if (profile !== 'affinity-distance-tutorial-u8-v1') return reject('unsupported-profile');
  const sourceRaw = descriptors.sourceAffinityByte!.value;
  const targetRaw = descriptors.targetAffinityByte!.value;
  if (!uint8(sourceRaw)) return reject('invalid-source-affinity-byte');
  if (!uint8(targetRaw)) return reject('invalid-target-affinity-byte');
  // Normalize JavaScript -0 to the sole unsigned-byte zero representation.
  const sourceAffinityByte = sourceRaw === 0 ? 0 : sourceRaw;
  const targetAffinityByte = targetRaw === 0 ? 0 : targetRaw;
  const absoluteDifference = Math.abs(sourceAffinityByte - targetAffinityByte);
  const complement = 150 - absoluteDifference;
  const signedComparisonBranch = absoluteDifference < complement ? 'keep-d' : 'use-complement';
  const returnedSigned32 = signedComparisonBranch === 'keep-d' ? absoluteDifference : complement;
  const returnedEax = returnedSigned32 >>> 0;
  const returnedAl = returnedEax & 255;
  return Object.freeze({supported: true, profile, sourceAffinityByte, targetAffinityByte,
    absoluteDifference, complement, signedComparisonBranch, returnedSigned32, returnedEax, returnedAl, evidence});
}
