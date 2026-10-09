import source from '../../../docs/sources/patrol-security-gain.json' with { type: 'json' };

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object') {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
}

/** Original public listing only; the separately labelled MOD is excluded. */
export const PATROL_SECURITY_GAIN = deepFreeze(source);
export type PatrolSecurityGainInput = {
  readonly profile: 'patrol-security-gain-stable-v1';
  /** Stable resolved 00489070 AL: valid first slot required; absent/null tails are invalid slots. */
  readonly resolvedLeadershipSlots: readonly (number | null)[];
  /** Raw city+0x85 uint8. Values above 100 can produce a negative returned delta. */
  readonly publicOrderByte: number;
  /** Observed full uint32 EAX from 004B99B0, whose internal predicate remains open. */
  readonly pressureHelperEax: number;
};
export type PatrolSecurityGainRejectionReason = 'invalid-input' | 'unexpected-field'
  | 'unsupported-profile' | 'invalid-leadership-slots' | 'invalid-public-order-byte'
  | 'invalid-pressure-helper-eax';
type Evidence = typeof PATROL_SECURITY_GAIN.evidence;
export type PatrolSecurityGainRejection = {
  readonly supported: false;
  readonly reason: PatrolSecurityGainRejectionReason;
  readonly evidence: Evidence;
};
export type PatrolSecurityGainReceipt = {
  readonly supported: true;
  readonly profile: 'patrol-security-gain-stable-v1';
  readonly normalizedLeadershipSlots: readonly [number, number | null, number | null];
  readonly publicOrderByte: number;
  readonly pressureHelperEax: number;
  readonly sumLeadership: number;
  readonly baseGain: number;
  readonly afterPressure: number;
  readonly returnedDelta: number;
  readonly pressureApplied: boolean;
  /** The original JLE preserves the non-cap path on equality. */
  readonly capBranch: boolean;
  readonly evidence: Evidence;
};
export type PatrolSecurityGainResult = PatrolSecurityGainRejection | PatrolSecurityGainReceipt;

const evidence = PATROL_SECURITY_GAIN.evidence;
const limits = PATROL_SECURITY_GAIN.constants;
const reject = (reason: PatrolSecurityGainRejectionReason): PatrolSecurityGainRejection =>
  Object.freeze({supported: false, reason, evidence});
const record = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object'
  && [Object.prototype, null].includes(Object.getPrototypeOf(value));
const integer = (value: unknown, min: number, max: number): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value >= min && value <= max;

/**
 * Pure stable-input projection, after facility/first-person/city gates passed.
 * Engineering rejection is not the native early return. No pointer/getter/helper
 * implementation, command eligibility, writer, TP reward, costs or scheduling.
 */
export function calculatePatrolSecurityGain(input: PatrolSecurityGainInput): PatrolSecurityGainResult {
  if (!record(input)) return reject('invalid-input');
  if (Reflect.ownKeys(input).some(key => typeof key !== 'string'
      || !['profile', 'resolvedLeadershipSlots', 'publicOrderByte', 'pressureHelperEax'].includes(key))) return reject('unexpected-field');
  if (Object.values(Object.getOwnPropertyDescriptors(input)).some(descriptor => !('value' in descriptor))) return reject('invalid-input');
  if (input.profile !== PATROL_SECURITY_GAIN.profileId) return reject('unsupported-profile');
  const slots = input.resolvedLeadershipSlots;
  if (!Array.isArray(slots) || slots.length < 1 || slots.length > 3
      || Reflect.ownKeys(slots).length !== slots.length + 1) return reject('invalid-leadership-slots');
  for (let i = 0; i < slots.length; i++) {
    const descriptor = Object.getOwnPropertyDescriptor(slots, i);
    if (!descriptor || !('value' in descriptor)
        || !(i > 0 && descriptor.value === null) && !integer(descriptor.value, 0, 255)) return reject('invalid-leadership-slots');
  }
  if (!integer(input.publicOrderByte, 0, 255)) return reject('invalid-public-order-byte');
  if (!integer(input.pressureHelperEax, 0, 0xffffffff)) return reject('invalid-pressure-helper-eax');
  const normalizedLeadershipSlots = Object.freeze([slots[0] as number, slots[1] ?? null, slots[2] ?? null] as const);
  let sumLeadership = 0;
  for (const value of normalizedLeadershipSlots) if (value !== null) sumLeadership += value;
  // The proven nonnegative uint8 sum domain makes signed truncation equal floor.
  const baseGain = Math.floor(sumLeadership / limits.leadershipDivisor) + limits.baseOffset;
  const pressureApplied = input.pressureHelperEax !== 0;
  const afterPressure = pressureApplied ? Math.floor(baseGain / limits.pressureDivisor) : baseGain;
  const capBranch = input.publicOrderByte + afterPressure > limits.publicOrderCap;
  const returnedDelta = capBranch ? limits.publicOrderCap - input.publicOrderByte : afterPressure;
  return Object.freeze({supported: true, profile: input.profile, normalizedLeadershipSlots,
    publicOrderByte: input.publicOrderByte, pressureHelperEax: input.pressureHelperEax,
    sumLeadership, baseGain, afterPressure, returnedDelta, pressureApplied, capBranch, evidence});
}
