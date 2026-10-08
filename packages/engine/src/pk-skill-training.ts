import source from '../../../docs/sources/pk-skill-training-s1.json' with { type: 'json' };

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object') {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
}

/** S1 MOD-associated bytes; neither stock equivalence nor complete command eligibility. */
export const PK_SKILL_TRAINING_S1 = deepFreeze(source);
/** Caller has already entered category 2. These are raw native signed DWORDs, not guide IDs. */
export type PkSkillTrainingInput = {
  readonly profile: 's1-pk-skill-training-v1';
  readonly person: { readonly rawE8: number };
  readonly trainingRecord: { readonly raw58: number };
};
export type PkSkillTrainingRejectionReason = 'invalid-input' | 'unexpected-field' | 'unsupported-profile'
  | 'invalid-person' | 'invalid-training-record' | 'invalid-person-raw-e8' | 'invalid-record-raw-58';
type Evidence = typeof PK_SKILL_TRAINING_S1.evidence;
export type PkSkillTrainingRejection = {
  readonly supported: false;
  readonly reason: PkSkillTrainingRejectionReason;
  readonly evidence: Evidence;
};
export type PkSkillTrainingEligibility = PkSkillTrainingRejection | {
  readonly supported: true;
  readonly profile: 's1-pk-skill-training-v1';
  readonly personRawE8: number;
  readonly trainingRecordRaw58: number;
  readonly helperMatchesSkill: boolean;
  /** Only the already-selected category-2 scalar branch result. */
  readonly eligible: boolean;
  readonly reason: 'eligible' | 'already-has-target-skill';
  readonly evidence: Evidence;
};

const evidence = PK_SKILL_TRAINING_S1.evidence;
const limits = PK_SKILL_TRAINING_S1.constants;
const reject = (reason: PkSkillTrainingRejectionReason): PkSkillTrainingRejection => Object.freeze({supported: false, reason, evidence});
const record = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value);
const signed32 = (value: unknown): value is number => typeof value === 'number' && Number.isInteger(value)
  && value >= -2147483648 && value <= 2147483647;
const extraKeys = (value: object, keys: readonly string[]): boolean => Object.keys(value).some(key => !keys.includes(key));

/** Pure projection of 0049DD0A..1D and S1 004890F0, after category selection and pointer gates. */
export function qualifyPkSkillTraining(input: PkSkillTrainingInput): PkSkillTrainingEligibility {
  // These are engineering input-shape checks, not native command gates.
  if (!record(input)) return reject('invalid-input');
  if (extraKeys(input, ['profile', 'person', 'trainingRecord'])) return reject('unexpected-field');
  if (input.profile !== PK_SKILL_TRAINING_S1.profileId) return reject('unsupported-profile');
  if (!record(input.person)) return reject('invalid-person');
  if (!record(input.trainingRecord)) return reject('invalid-training-record');
  if (extraKeys(input.person, ['rawE8']) || extraKeys(input.trainingRecord, ['raw58'])) return reject('unexpected-field');
  if (!signed32(input.person.rawE8)) return reject('invalid-person-raw-e8');
  if (!signed32(input.trainingRecord.raw58)) return reject('invalid-record-raw-58');
  const personRawE8 = input.person.rawE8;
  const trainingRecordRaw58 = input.trainingRecord.raw58;
  const helperMatchesSkill = trainingRecordRaw58 >= limits.targetMin && trainingRecordRaw58 <= limits.targetMax
    && personRawE8 === trainingRecordRaw58;
  // Out-of-range targets make the helper return zero, so the caller returns one even when equal.
  const eligible = !helperMatchesSkill;
  return Object.freeze({supported: true, profile: input.profile, personRawE8, trainingRecordRaw58,
    helperMatchesSkill, eligible, reason: eligible ? 'eligible' : 'already-has-target-skill', evidence});
}
