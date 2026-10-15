import source from '../../../docs/sources/monthly-city-food-base-argument.json' with {type: 'json'};
function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object') {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
}
/** Source-listing reconstruction only; no native helper, writer, or scheduler. */
export const MONTHLY_CITY_FOOD_BASE_ARGUMENT = deepFreeze(source);
export type MonthlyCityFoodBaseArgumentInput = {
  readonly profile: 'monthly-city-food-base-argument-u32-v1';
  /** CURRENT EDI at005905E0; not assumed preserved from the city callee. */
  readonly entryFoodEdiU32: number;
  /** Full EAX at005905E0; any nonzero DWORD selects harvest. */
  readonly harvestPredicateEaxU32: number;
  /** Separate LATE DWORD [ESP+1B8] observation at005905EE, never the early gate. */
  readonly lateLevyFlagDwordU32: number;
};
export type MonthlyCityFoodBaseArgumentRejectionReason = 'invalid-input' | 'unexpected-field' | 'unsupported-profile';
type Evidence = typeof MONTHLY_CITY_FOOD_BASE_ARGUMENT.evidence;
export type MonthlyCityFoodHarvestTriple = {
  readonly unwrappedU64: number;
  readonly lowU32: number;
  readonly signed: number;
};
export type MonthlyCityFoodBaseArgumentRejection = {
  readonly supported: false;
  readonly reason: MonthlyCityFoodBaseArgumentRejectionReason;
  readonly evidence: Evidence;
};
export type MonthlyCityFoodBaseArgumentReceipt = {
  readonly supported: true;
  readonly profile: MonthlyCityFoodBaseArgumentInput['profile'];
  readonly entryFoodEdiU32: number;
  readonly entryFoodEdiSigned: number;
  readonly harvestPredicateEaxU32: number;
  readonly lateLevyFlagDwordU32: number;
  readonly harvestApplied: boolean;
  readonly levyApplied: boolean;
  readonly harvestTriple: MonthlyCityFoodHarvestTriple | null;
  readonly postHarvestU32: number;
  readonly postHarvestSigned: number;
  readonly lateLevyRead: {readonly address: '005905EE'; readonly widthBits: 32; readonly count: 1};
  readonly executedAddresses: readonly string[];
  readonly instructionCount: number;
  readonly pushAddress: '00590602';
  readonly continuationAddress: '00590603';
  readonly pushedArgumentU32: number;
  readonly pushedArgumentSigned: number;
  readonly evidence: Evidence;
};
export type MonthlyCityFoodBaseArgumentResult = MonthlyCityFoodBaseArgumentRejection | MonthlyCityFoodBaseArgumentReceipt;
const evidence = MONTHLY_CITY_FOOD_BASE_ARGUMENT.evidence;
const reject = (reason: MonthlyCityFoodBaseArgumentRejectionReason): MonthlyCityFoodBaseArgumentRejection => Object.freeze({supported: false, reason, evidence});
const u32 = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 && value <= 0xFFFFFFFF;
const signed = (value: number): number => Number(BigInt.asIntN(32, BigInt(value)));
const unsigned = (value: number): number => Number(BigInt.asUintN(32, BigInt(value)));
/** Pure captured-observation argument projection; never writes a real stack or city. */
export function calculateMonthlyCityFoodBaseArgument(input: MonthlyCityFoodBaseArgumentInput): MonthlyCityFoodBaseArgumentResult {
  if (input === null || typeof input !== 'object') return reject('invalid-input');
  const prototype = Object.getPrototypeOf(input);
  if (prototype !== Object.prototype && prototype !== null) return reject('invalid-input');
  const required = ['profile', 'entryFoodEdiU32', 'harvestPredicateEaxU32', 'lateLevyFlagDwordU32'];
  const keys = Reflect.ownKeys(input);
  if (keys.some(key => typeof key !== 'string' || !required.includes(key))) return reject('unexpected-field');
  const descriptors = Object.getOwnPropertyDescriptors(input);
  if (required.some(key => !Object.hasOwn(descriptors, key) || !('value' in descriptors[key]!) || descriptors[key]!.enumerable !== true)) return reject('invalid-input');
  const values = Object.fromEntries(required.map(key => [key, descriptors[key]!.value]));
  if (values.profile !== 'monthly-city-food-base-argument-u32-v1') return reject('unsupported-profile');
  if (!u32(values.entryFoodEdiU32) || !u32(values.harvestPredicateEaxU32) || !u32(values.lateLevyFlagDwordU32)) return reject('invalid-input');
  const entryFoodEdiU32 = values.entryFoodEdiU32 === 0 ? 0 : values.entryFoodEdiU32;
  const harvestPredicateEaxU32 = values.harvestPredicateEaxU32 === 0 ? 0 : values.harvestPredicateEaxU32;
  const lateLevyFlagDwordU32 = values.lateLevyFlagDwordU32 === 0 ? 0 : values.lateLevyFlagDwordU32;
  const entryFoodEdiSigned = signed(entryFoodEdiU32);
  const harvestApplied = harvestPredicateEaxU32 !== 0;
  const levyApplied = lateLevyFlagDwordU32 !== 0;
  const executedAddresses = ['005905E0', '005905E2'];
  let harvestTriple: MonthlyCityFoodHarvestTriple | null = null;
  let postHarvestU32 = entryFoodEdiU32;
  if (harvestApplied) {
    const unwrappedU64 = entryFoodEdiU32 * 3;
    const lowU32 = unsigned(unwrappedU64);
    harvestTriple = {unwrappedU64, lowU32, signed: signed(lowU32)};
    // LEA wraps before CDQ/SUB/SAR's signed toward-zero half.
    postHarvestU32 = unsigned(Number(BigInt(harvestTriple.signed) / 2n));
    executedAddresses.push('005905E4', '005905E7', '005905E8', '005905EA', '005905EC');
  }
  const postHarvestSigned = signed(postHarvestU32);
  executedAddresses.push('005905EE', '005905F5', '005905F7');
  // The late DWORD read is mandatory on both harvest paths, including zero food.
  const lateLevyRead = {address: '005905EE' as const, widthBits: 32 as const, count: 1 as const};
  const pushedArgumentSigned = levyApplied ? Number(BigInt(postHarvestSigned) / 2n) : postHarvestSigned;
  const pushedArgumentU32 = unsigned(pushedArgumentSigned);
  if (levyApplied) executedAddresses.push('005905F9', '005905FB', '005905FC', '005905FE', '00590600');
  executedAddresses.push('00590602');
  return deepFreeze({supported: true, profile: values.profile, entryFoodEdiU32, entryFoodEdiSigned,
    harvestPredicateEaxU32, lateLevyFlagDwordU32, harvestApplied, levyApplied, harvestTriple,
    postHarvestU32, postHarvestSigned, lateLevyRead, executedAddresses, instructionCount: executedAddresses.length,
    pushAddress: '00590602', continuationAddress: '00590603', pushedArgumentU32, pushedArgumentSigned, evidence});
}
