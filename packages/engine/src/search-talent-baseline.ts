import source from '../../../docs/sources/search-talent-baseline.json' with { type: 'json' };

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object') {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
}
/** Published-listing reconstruction only, not stock-executable certification. */
export const SEARCH_TALENT_BASELINE = deepFreeze(source);
export type SearchTalentBaselineInput = {
  readonly profile: 'search-talent-resolved-v1';
  readonly filteredCandidateCount: number;
  readonly politicsAL: number;
  readonly eyeSkillEax: number;
  readonly cityRegion: number;
  readonly officerBirthRegion: number;
};
export type SearchTalentBaselineRejectionReason = 'invalid-input' | 'unexpected-field' | 'unsupported-profile'
  | 'invalid-filtered-candidate-count' | 'invalid-politics-al' | 'invalid-eye-skill-eax'
  | 'invalid-city-region' | 'invalid-officer-birth-region';
type Evidence = typeof SEARCH_TALENT_BASELINE.evidence;
export type SearchTalentBaselineRejection = {
  readonly supported: false;
  readonly reason: SearchTalentBaselineRejectionReason;
  readonly evidence: Evidence;
};
export type SearchTalentBaselineReceipt = SearchTalentBaselineInput & {
  readonly supported: true;
  readonly branch: 'no-candidates' | 'eye-skill' | 'arithmetic';
  readonly cappedCandidateCount: number | null;
  readonly regionFactor: 10 | 11 | null;
  readonly numerator: number | null;
  readonly returnedEax: number;
  readonly evidence: Evidence;
};
export type SearchTalentBaselineResult = SearchTalentBaselineRejection | SearchTalentBaselineReceipt;
const evidence = SEARCH_TALENT_BASELINE.evidence;
const reject = (reason: SearchTalentBaselineRejectionReason): SearchTalentBaselineRejection =>
  Object.freeze({supported: false, reason, evidence});
const integer = (value: unknown, low: number, high: number): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value >= low && value <= high;

/**
 * Already-resolved stable observations only: count is AFTER the unknown filter.
 * Region fields are compared as signed32 values without assigning region IDs.
 * Input rejection is an engineering boundary, never a native invalid-pointer result.
 * The returned numerical baseline is not a final probability or random outcome.
 */
export function calculateSearchTalentBaseline(input: SearchTalentBaselineInput): SearchTalentBaselineResult {
  if (input === null || typeof input !== 'object') return reject('invalid-input');
  const prototype = Object.getPrototypeOf(input);
  if (prototype !== Object.prototype && prototype !== null) return reject('invalid-input');
  const allowed = ['profile', 'filteredCandidateCount', 'politicsAL', 'eyeSkillEax', 'cityRegion', 'officerBirthRegion'];
  const keys = Reflect.ownKeys(input);
  if (keys.some(key => typeof key !== 'string' || !allowed.includes(key))) return reject('unexpected-field');
  const descriptors = Object.getOwnPropertyDescriptors(input);
  if (keys.length !== allowed.length || allowed.some(key => !descriptors[key] || !('value' in descriptors[key])))
    return reject('invalid-input');
  const profile = descriptors.profile!.value;
  if (profile !== 'search-talent-resolved-v1') return reject('unsupported-profile');
  const count = descriptors.filteredCandidateCount!.value;
  const politics = descriptors.politicsAL!.value;
  const eye = descriptors.eyeSkillEax!.value;
  const city = descriptors.cityRegion!.value;
  const birth = descriptors.officerBirthRegion!.value;
  if (!integer(count, 0, 2147483647)) return reject('invalid-filtered-candidate-count');
  if (!integer(politics, 0, 255)) return reject('invalid-politics-al');
  if (!integer(eye, 0, 4294967295)) return reject('invalid-eye-skill-eax');
  if (!integer(city, -2147483648, 2147483647)) return reject('invalid-city-region');
  if (!integer(birth, -2147483648, 2147483647)) return reject('invalid-officer-birth-region');
  const filteredCandidateCount = count === 0 ? 0 : count;
  const politicsAL = politics === 0 ? 0 : politics;
  const eyeSkillEax = eye === 0 ? 0 : eye;
  const cityRegion = city === 0 ? 0 : city;
  const officerBirthRegion = birth === 0 ? 0 : birth;
  const resolved = {profile, filteredCandidateCount, politicsAL, eyeSkillEax, cityRegion, officerBirthRegion};
  // Ordering matters: the listing exits before querying eye skill when count is zero.
  if (filteredCandidateCount === 0) return Object.freeze({supported: true, ...resolved,
    branch: 'no-candidates', cappedCandidateCount: null, regionFactor: null, numerator: null, returnedEax: 0, evidence});
  // TEST EAX consumes all 32 bits, not just AL (256 is nonzero).
  if (eyeSkillEax !== 0) return Object.freeze({supported: true, ...resolved,
    branch: 'eye-skill', cappedCandidateCount: null, regionFactor: null, numerator: null, returnedEax: 100, evidence});
  const cappedCandidateCount = Math.min(filteredCandidateCount, 5);
  const regionFactor = cityRegion === officerBirthRegion ? 11 : 10;
  const numerator = (3 * cappedCandidateCount + 7) * politicsAL * regionFactor;
  const returnedEax = Math.floor(numerator / 300);
  return Object.freeze({supported: true, ...resolved, branch: 'arithmetic', cappedCandidateCount,
    regionFactor, numerator, returnedEax, evidence});
}
