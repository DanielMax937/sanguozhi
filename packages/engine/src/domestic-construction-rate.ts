import source from '../../../docs/sources/domestic-construction-rate.json' with { type: 'json' };

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object') {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
}

/** Public listing reconstruction, with starred MOD excluded; not stock certification. */
export const DOMESTIC_CONSTRUCTION_RATE = deepFreeze(source);
export type DomesticConstructionRateInput = {
  readonly profile: 'domestic-construction-rate-stable-v1';
  /** At most three resolved stable uint8 values; null or absent trailing slots are empty. */
  readonly politics: readonly (number | null)[];
  /** Stable resolved facility-type uint16 at +0xC2, not current construction durability. */
  readonly facilityDurability: number;
};
export type DomesticConstructionRateRejectionReason = 'invalid-input' | 'unexpected-field'
  | 'unsupported-profile' | 'invalid-politics' | 'invalid-facility-durability';
type Evidence = typeof DOMESTIC_CONSTRUCTION_RATE.evidence;
export type DomesticConstructionRateRejection = {
  readonly supported: false;
  readonly reason: DomesticConstructionRateRejectionReason;
  readonly evidence: Evidence;
};
export type DomesticConstructionRateReceipt = {
  readonly supported: true;
  readonly profile: 'domestic-construction-rate-stable-v1';
  readonly politics: readonly [number | null, number | null, number | null];
  readonly facilityDurability: number;
  readonly politicsSum: number;
  readonly maxPolitics: number;
  readonly halfPoliticsSum: number;
  readonly politicsRate: number;
  readonly durabilityQuarter: number;
  readonly durabilityRemainder: number;
  readonly durabilityMinimum: number;
  readonly rate: number;
  /** Equality takes the original JLE politics return. */
  readonly selectedBranch: 'politics' | 'durability-minimum';
  readonly evidence: Evidence;
};
export type DomesticConstructionRateResult = DomesticConstructionRateRejection | DomesticConstructionRateReceipt;

const evidence = DOMESTIC_CONSTRUCTION_RATE.evidence;
const limits = DOMESTIC_CONSTRUCTION_RATE.constants;
const reject = (reason: DomesticConstructionRateRejectionReason): DomesticConstructionRateRejection =>
  Object.freeze({supported: false, reason, evidence});
const record = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === 'object' && !Array.isArray(v);
const integer = (v: unknown, min: number, max: number): v is number =>
  typeof v === 'number' && Number.isSafeInteger(v) && v >= min && v <= max;

/** Pure rate only. No person lookup, command eligibility, duration, writer or scheduling. */
export function calculateDomesticConstructionRate(input: DomesticConstructionRateInput): DomesticConstructionRateResult {
  if (!record(input)) return reject('invalid-input');
  if (Object.keys(input).some(key => !['profile', 'politics', 'facilityDurability'].includes(key))) return reject('unexpected-field');
  if (input.profile !== DOMESTIC_CONSTRUCTION_RATE.profileId) return reject('unsupported-profile');
  if (!Array.isArray(input.politics) || input.politics.length > 3) return reject('invalid-politics');
  // Holes, undefined and named array properties are not explicit resolved slots.
  if (Object.keys(input.politics).length !== input.politics.length) return reject('invalid-politics');
  for (let i = 0; i < input.politics.length; i++) {
    if (!Object.hasOwn(input.politics, i) || (input.politics[i] !== null && !integer(input.politics[i], 0, 255))) return reject('invalid-politics');
  }
  if (!integer(input.facilityDurability, 0, 65535)) return reject('invalid-facility-durability');
  const politics = Object.freeze([input.politics[0] ?? null, input.politics[1] ?? null, input.politics[2] ?? null] as const);
  let politicsSum = 0;
  let maxPolitics = 0;
  for (const value of politics) {
    if (value === null) continue;
    politicsSum += value;
    maxPolitics = Math.max(maxPolitics, value);
  }
  // On the supported nonnegative domain, signed truncation toward zero equals floor.
  const halfPoliticsSum = Math.floor(politicsSum / limits.politicsDivisor);
  const politicsRate = maxPolitics + halfPoliticsSum;
  const durabilityQuarter = Math.floor(input.facilityDurability / limits.durabilityQuarterDivisor);
  const durabilityRemainder = input.facilityDurability - durabilityQuarter;
  const durabilityMinimum = Math.floor(durabilityRemainder / limits.durabilityRemainderDivisor);
  const selectedBranch = durabilityMinimum > politicsRate ? 'durability-minimum' : 'politics';
  const rate = Math.max(politicsRate, durabilityMinimum);
  return Object.freeze({supported: true, profile: input.profile, politics, facilityDurability: input.facilityDurability,
    politicsSum, maxPolitics, halfPoliticsSum, politicsRate, durabilityQuarter, durabilityRemainder,
    durabilityMinimum, rate, selectedBranch, evidence});
}
