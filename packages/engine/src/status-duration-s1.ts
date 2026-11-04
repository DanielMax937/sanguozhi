import { detachBoundedCityData } from './internal/bounded-city-json.ts';

/** Fixed MOD-associated archive projection, not authenticated stock-game rules. */
export const SAME_ABNORMAL_DURATION_S1_PROFILE = 'same-abnormal-duration-s1-resolved-v1' as const;
const evidence = Object.freeze({
  sourceCommit: '66e167e40c3440929ec016f3872aefc3486434c1',
  archiveGitBlob: 'a6689f01a228d272c66abb376bcfa0044ff767ef',
  classification: 'mod-associated-idb-source-profile' as const,
  stockVerified: false as const, nativeExecution: false as const,
  crossStatusVerified: false as const,
});
type SharedInput = Readonly<{
  profile: typeof SAME_ABNORMAL_DURATION_S1_PROFILE;
  /** Both the existing and requested status: 1 confused, 2 false report. */
  sameStatus: 1 | 2;
  /** Resolved existing byte, restricted to the documented 0..5 projection. */
  currentRemaining: number;
}>;
export type SameAbnormalDurationS1Input = SharedInput & (
  | Readonly<{ critical: true }>
  | Readonly<{ critical: false; durationRngResult: 0 | 1 }>
);
export type SameAbnormalDurationS1Reason = 'invalid-data' | 'invalid-shape'
  | 'unsupported-profile' | 'invalid-status' | 'invalid-remaining'
  | 'invalid-critical' | 'invalid-duration-rng-result';
const reject = (reason: SameAbnormalDurationS1Reason) => Object.freeze({ supported: false as const, reason, evidence });
const integer = (v: unknown, lo: number, hi: number): v is number =>
  typeof v === 'number' && Number.isSafeInteger(v) && !Object.is(v, -0) && v >= lo && v <= hi;

/** Successful application, same abnormal status only. Never writes state or draws RNG. */
export function projectSameAbnormalDurationS1(input: unknown) {
  const detached = detachBoundedCityData(input);
  if (!detached.ok) return reject('invalid-data');
  const v = detached.value;
  if (v === null || typeof v !== 'object' || Array.isArray(v)) return reject('invalid-shape');
  const row = v as Record<string, unknown>;
  if (typeof row.critical !== 'boolean') return reject('invalid-critical');
  const keys = row.critical
    ? ['profile', 'sameStatus', 'currentRemaining', 'critical']
    : ['profile', 'sameStatus', 'currentRemaining', 'critical', 'durationRngResult'];
  if (Object.keys(row).length !== keys.length || keys.some(k => !Object.hasOwn(row, k))) return reject('invalid-shape');
  if (row.profile !== SAME_ABNORMAL_DURATION_S1_PROFILE) return reject('unsupported-profile');
  if (row.sameStatus !== 1 && row.sameStatus !== 2) return reject('invalid-status');
  if (!integer(row.currentRemaining, 0, 5)) return reject('invalid-remaining');
  let increment: number;
  let durationRngResult: number | null;
  if (row.critical) { increment = 3; durationRngResult = null; }
  else {
    if (!integer(row.durationRngResult, 0, 1)) return reject('invalid-duration-rng-result');
    durationRngResult = row.durationRngResult;
    increment = durationRngResult + 1;
  }
  const requestedRemaining = row.currentRemaining + increment;
  const newRemaining = Math.min(5, requestedRemaining);
  return Object.freeze({
    supported: true as const, profile: SAME_ABNORMAL_DURATION_S1_PROFILE,
    sameStatus: row.sameStatus, currentRemaining: row.currentRemaining,
    critical: row.critical, durationRngResult, increment, newRemaining,
    appliedIncrement: newRemaining - row.currentRemaining,
    clamped: newRemaining !== requestedRemaining,
    durationRngInputUsed: !row.critical,
    rngDrawn: false as const, stateWritten: false as const, evidence,
  });
}
