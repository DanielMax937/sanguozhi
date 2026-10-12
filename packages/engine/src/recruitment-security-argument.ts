import source from '../../../docs/sources/recruitment-security-argument.json' with { type: 'json' };

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object') {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
}

/** Published-listing reconstruction only; no writer, ABI or stock certification. */
export const RECRUITMENT_SECURITY_ARGUMENT = deepFreeze(source);
export type RecruitmentSecurityArgumentInput = {
  readonly profile: 'recruitment-security-argument-v1';
  readonly savedCharmSum: number;
  readonly savedTroopReturnU32: number;
};
export type RecruitmentSecurityArgumentRejectionReason = 'invalid-input' | 'unexpected-field'
  | 'unsupported-profile' | 'invalid-saved-charm-sum' | 'invalid-saved-troop-return-u32';
type Evidence = typeof RECRUITMENT_SECURITY_ARGUMENT.evidence;
export type RecruitmentSecurityArgumentRejection = {
  readonly supported: false;
  readonly reason: RecruitmentSecurityArgumentRejectionReason;
  readonly evidence: Evidence;
};
export type RecruitmentSecurityArgumentReceipt = RecruitmentSecurityArgumentInput & {
  readonly supported: true;
  readonly signedTroopReturn: number;
  readonly divisor: number;
  readonly quotientSigned: number;
  readonly remainderSigned: number;
  readonly securityDeltaSigned: number;
  readonly securityDeltaU32: number;
  readonly evidence: Evidence;
};
export type RecruitmentSecurityArgumentResult = RecruitmentSecurityArgumentRejection | RecruitmentSecurityArgumentReceipt;

const evidence = RECRUITMENT_SECURITY_ARGUMENT.evidence;
const reject = (reason: RecruitmentSecurityArgumentRejectionReason): RecruitmentSecurityArgumentRejection =>
  Object.freeze({supported: false, reason, evidence});
const integer = (value: unknown, maximum: number): value is number => typeof value === 'number'
  && Number.isSafeInteger(value) && value >= 0 && value <= maximum;

/**
 * Exactly two already-observed leaf-entry scalars. savedCharmSum is the earlier
 * execution scan, not the later quantity scan; savedTroopReturnU32 is ESI, whose
 * most recent explicit caller definition saves the troop writer's EAX. This API
 * does not prove intervening ABI preservation or actual writes. It produces a
 * requested security delta, never actual security loss or final city security.
 * Rejection is an engineering boundary, not a reconstructed native error path.
 */
export function calculateRecruitmentSecurityArgument(input: RecruitmentSecurityArgumentInput): RecruitmentSecurityArgumentResult {
  if (input === null || typeof input !== 'object') return reject('invalid-input');
  const prototype = Object.getPrototypeOf(input);
  if (prototype !== Object.prototype && prototype !== null) return reject('invalid-input');
  const allowed = ['profile', 'savedCharmSum', 'savedTroopReturnU32'];
  const keys = Reflect.ownKeys(input);
  if (keys.some(key => typeof key !== 'string' || !allowed.includes(key))) return reject('unexpected-field');
  const descriptors = Object.getOwnPropertyDescriptors(input);
  if (keys.length !== allowed.length || allowed.some(key => !descriptors[key] || !('value' in descriptors[key])))
    return reject('invalid-input');
  const profile = descriptors.profile!.value;
  if (profile !== 'recruitment-security-argument-v1') return reject('unsupported-profile');
  const charm = descriptors.savedCharmSum!.value;
  const troops = descriptors.savedTroopReturnU32!.value;
  if (!integer(charm, 765)) return reject('invalid-saved-charm-sum');
  if (!integer(troops, 0xffffffff)) return reject('invalid-saved-troop-return-u32');
  const savedCharmSum = charm === 0 ? 0 : charm;
  const savedTroopReturnU32 = troops === 0 ? 0 : troops;
  const signedTroopReturn = Number(BigInt.asIntN(32, BigInt(savedTroopReturnU32)));
  const divisor = savedCharmSum + 100;
  // BigInt division matches signed IDIV's truncation toward zero, without floats.
  // D=100..865 ensures no division trap or quotient/NEG overflow in this domain.
  const quotient = BigInt(signedTroopReturn) / BigInt(divisor);
  const quotientSigned = Number(quotient);
  const remainderSigned = Number(BigInt(signedTroopReturn) - quotient * BigInt(divisor));
  const securityDeltaSigned = Number(-quotient);
  const securityDeltaU32 = Number(BigInt.asUintN(32, -quotient));
  return Object.freeze({supported: true, profile, savedCharmSum, savedTroopReturnU32,
    signedTroopReturn, divisor, quotientSigned, remainderSigned, securityDeltaSigned,
    securityDeltaU32, evidence});
}
