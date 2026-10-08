import source from '../../../docs/sources/pk-stat-training-s1.json' with { type: 'json' };

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object') {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
}

/** S1 MOD-associated reconstruction, never a clean-stock or full-command claim. */
export const PK_STAT_TRAINING_S1 = deepFreeze(source);
export type PkStatTrainingAttribute = 'leadership' | 'war' | 'intelligence' | 'politics' | 'charisma';
export type PkStatTrainingGrowth =
  /** Caller supplies the current 0048A390 result; no post-write getter is guessed. */
  | { readonly kind: 'resolved-native-growth'; readonly value: number }
  /** Explicit ordinary-person, no age adjustment domain; excludes native IDs 700..799. */
  | { readonly kind: 'ordinary-no-age'; readonly talent: number };
export type PkStatTrainingInput = {
  readonly profile: 's1-pk-stat-training-v1';
  readonly attribute: PkStatTrainingAttribute;
  readonly xp: number;
  readonly target: number;
  readonly growth: PkStatTrainingGrowth;
};
export type PkStatTrainingRejectionReason = 'invalid-input' | 'unexpected-field' | 'unsupported-profile'
  | 'invalid-attribute' | 'invalid-xp' | 'invalid-target' | 'unsupported-growth-domain'
  | 'invalid-growth-value' | 'invalid-talent' | 'unsupported-negative-delta';
type Evidence = typeof PK_STAT_TRAINING_S1.evidence;
export type PkStatTrainingRejection = {
  readonly supported: false;
  readonly reason: PkStatTrainingRejectionReason;
  readonly evidence: Evidence;
};
type Snapshot = {
  readonly profile: 's1-pk-stat-training-v1';
  readonly attribute: PkStatTrainingAttribute;
  readonly growthDomain: PkStatTrainingGrowth['kind'];
  readonly xpBefore: number;
  readonly growthBefore: number;
  readonly target: number;
  readonly evidence: Evidence;
};
export type PkStatTrainingEligibility = PkStatTrainingRejection | (Snapshot & {
  readonly supported: true;
  readonly eligible: boolean;
  /** XP is tested first, matching the source's short-circuit order. */
  readonly reason: 'eligible' | 'xp-start-limit' | 'growth-target-reached';
});
export type PkStatTrainingCompletion = PkStatTrainingRejection | (Snapshot & {
  readonly supported: true;
  /** Requested points need not equal visible growth, due to XP/stat clamps. */
  readonly requestedPoints: number;
  readonly requestedXp: number;
  readonly creditedXp: number;
  readonly clippedXp: number;
  readonly xpAfter: number;
  /** Null for an opaque getter input: age/special-person behavior is not inferred. */
  readonly growthAfter: number | null;
  readonly actualGrowth: number | null;
});

const limits = PK_STAT_TRAINING_S1.constants;
const evidence = PK_STAT_TRAINING_S1.evidence;
const reject = (reason: PkStatTrainingRejectionReason): PkStatTrainingRejection => Object.freeze({supported: false, reason, evidence});
const record = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value);
const integer = (value: unknown, min: number, max: number): value is number => typeof value === 'number' && Number.isSafeInteger(value) && value >= min && value <= max;
const extraKeys = (value: object, keys: readonly string[]): boolean => Object.keys(value).some(key => !keys.includes(key));
const ordinaryGrowth = (talent: number, xp: number): number => Math.max(limits.growthMin, Math.min(limits.growthMax, talent + Math.floor(xp / limits.xpPerPoint)));

/** These are explicit safe numeric-domain checks, not recovered native command gates. */
function validate(input: PkStatTrainingInput): (Snapshot & { readonly supported: true }) | PkStatTrainingRejection {
  if (!record(input)) return reject('invalid-input');
  if (extraKeys(input, ['profile', 'attribute', 'xp', 'target', 'growth'])) return reject('unexpected-field');
  if (input.profile !== PK_STAT_TRAINING_S1.profileId) return reject('unsupported-profile');
  if (!PK_STAT_TRAINING_S1.attributes.includes(input.attribute)) return reject('invalid-attribute');
  if (!integer(input.xp, 0, limits.xpCap)) return reject('invalid-xp');
  if (!integer(input.target, limits.growthMin, limits.growthMax)) return reject('invalid-target');
  if (!record(input.growth)) return reject('unsupported-growth-domain');
  let growthBefore: number;
  if (input.growth.kind === 'resolved-native-growth') {
    if (extraKeys(input.growth, ['kind', 'value'])) return reject('unexpected-field');
    if (!integer(input.growth.value, limits.growthMin, limits.growthMax)) return reject('invalid-growth-value');
    growthBefore = input.growth.value;
  } else if (input.growth.kind === 'ordinary-no-age') {
    if (extraKeys(input.growth, ['kind', 'talent'])) return reject('unexpected-field');
    if (!integer(input.growth.talent, 0, limits.growthMax)) return reject('invalid-talent');
    growthBefore = ordinaryGrowth(input.growth.talent, input.xp);
  } else return reject('unsupported-growth-domain');
  return {supported: true, profile: input.profile, attribute: input.attribute, growthDomain: input.growth.kind,
    xpBefore: input.xp, growthBefore, target: input.target, evidence};
}

/** Only the stat branch's numeric start predicate, not complete research eligibility. */
export function qualifyPkStatTraining(input: PkStatTrainingInput): PkStatTrainingEligibility {
  const state = validate(input);
  if (!state.supported) return state;
  const reason = state.xpBefore >= limits.startXpExclusive ? 'xp-start-limit'
    : state.growthBefore >= state.target ? 'growth-target-reached' : 'eligible';
  return Object.freeze({...state, eligible: reason === 'eligible', reason});
}

/** Completion arithmetic for an already-started task. Deliberately does not re-run the start predicate. */
export function completePkStatTraining(input: PkStatTrainingInput): PkStatTrainingCompletion {
  const state = validate(input);
  if (!state.supported) return state;
  // Native has min(5, delta), not max(0, delta). Negative raw-word behavior is outside this profile.
  if (state.growthBefore > state.target) return reject('unsupported-negative-delta');
  const requestedPoints = Math.min(limits.pointsPerCompletion, state.target - state.growthBefore);
  const requestedXp = requestedPoints * limits.xpPerPoint;
  const xpAfter = Math.min(limits.xpCap, state.xpBefore + requestedXp);
  const creditedXp = xpAfter - state.xpBefore;
  const growthAfter = input.growth.kind === 'ordinary-no-age' ? ordinaryGrowth(input.growth.talent, xpAfter) : null;
  return Object.freeze({...state, requestedPoints, requestedXp, creditedXp, clippedXp: requestedXp - creditedXp, xpAfter,
    growthAfter, actualGrowth: growthAfter === null ? null : growthAfter - state.growthBefore});
}
