import source from '../../../docs/sources/city-food-income-projection.json' with { type: 'json' };

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object') {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
}
/** Stable resolved source-listing projection, not actual income posting. */
export const CITY_FOOD_INCOME_PROJECTION = deepFreeze(source);
export type CityFoodIncomeType = 32 | 49 | 52 | 53;
export type CityFoodIncomeSlot = null | {
  readonly facilityTypeWord: number;
  readonly constructionWord: number;
  /** Required only after a valid ordinary-farm type row was resolved. */
  readonly adjacentGranary?: boolean;
};
export type CityFoodIncomeTypeRow = {readonly valid: false} | {readonly valid: true; readonly foodYieldWord: number};
export type CityFoodIncomeProjectionInput = {
  readonly profile: 'city-food-income-stable-resolved-non-easy-u32-v1';
  readonly baseFoodWord: number;
  readonly slots: readonly CityFoodIncomeSlot[];
  readonly resolvedTypeRows: Readonly<Partial<Record<CityFoodIncomeType, CityFoodIncomeTypeRow>>>;
  /** Required only when a valid completed military farm consumes the troop read. */
  readonly cityTroopsWord?: number;
  readonly difficultyWord: number;
  /** Required only for difficultyWord == 2. */
  readonly cityPlayerPredicate?: boolean;
  /** Late U8 read at 0049E9C6; there is no upper clamp at 100. */
  readonly securityByte: number;
};
export type CityFoodIncomeProjectionRejectionReason = 'invalid-input' | 'unexpected-field' | 'unsupported-profile'
  | 'missing-type-row' | 'missing-adjacent-granary' | 'missing-city-troops' | 'unsupported-easy-branch';
type Evidence = typeof CITY_FOOD_INCOME_PROJECTION.evidence;
export type CityFoodIncomeProjectionRejection = {
  readonly supported: false;
  readonly reason: CityFoodIncomeProjectionRejectionReason;
  readonly evidence: Evidence;
};
export type CityFoodIncomeSlotReceipt = {
  readonly index: number;
  readonly facilityTypeWord: number | null;
  readonly effectiveType: number | null;
  readonly status: 'invalid-slot' | 'ignored-type' | 'unfinished' | 'invalid-type-row' | 'yield';
  readonly foodYieldWord: number | null;
  readonly granaryApplied: boolean;
  readonly effectiveTroops: number | null;
  readonly militaryProductRaw: number | null;
  readonly militaryProductU32: number | null;
  readonly contribution: number;
};
export type CityFoodIncomeProjectionReceipt = {
  readonly supported: true;
  readonly profile: CityFoodIncomeProjectionInput['profile'];
  readonly baseFoodWord: number;
  readonly difficultyWord: number;
  readonly securityByte: number;
  readonly slots: readonly CityFoodIncomeSlotReceipt[];
  readonly rawFood: number;
  readonly difficultyPercent: number;
  readonly effectiveSecurity: number;
  readonly difficultyAdjusted: number;
  readonly securityProductRaw: number;
  readonly securityProductU32: number;
  readonly securityProductSigned: number;
  readonly returnedIncomeSigned: number;
  readonly returnedIncomeU32: number;
  readonly evidence: Evidence;
};
export type CityFoodIncomeProjectionResult = CityFoodIncomeProjectionRejection | CityFoodIncomeProjectionReceipt;

const evidence = CITY_FOOD_INCOME_PROJECTION.evidence;
const reject = (reason: CityFoodIncomeProjectionRejectionReason): CityFoodIncomeProjectionRejection =>
  Object.freeze({supported: false, reason, evidence});
const uint = (value: unknown, maximum: number): value is number => typeof value === 'number'
  && Number.isSafeInteger(value) && value >= 0 && value <= maximum;
// Read ordinary data descriptors without invoking accessors. No input object is retained.
type Fields = Record<string, unknown>;
function fields(value: unknown, allowed: readonly string[], required: readonly string[]): Fields | CityFoodIncomeProjectionRejectionReason {
  if (value === null || typeof value !== 'object') return 'invalid-input';
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) return 'invalid-input';
  const keys = Reflect.ownKeys(value);
  if (keys.some(key => typeof key !== 'string' || !allowed.includes(key))) return 'unexpected-field';
  const ds = Object.getOwnPropertyDescriptors(value);
  if (required.some(key => !Object.hasOwn(ds, key)) || keys.some(key => !('value' in ds[key as string]!))) return 'invalid-input';
  return Object.fromEntries(keys.map(key => [key, ds[key as string]!.value]));
}
const typeKeys = ['32', '49', '52', '53'];
const own = (o: Fields, key: string) => Object.hasOwn(o, key);

/**
 * Pure local return-value calculation after the city/owner entry gates passed.
 * Fixed 30-slot observations and one stable resolved type table are prerequisites,
 * not reconstructed pointer validators, lookup helpers or spatial adjacency.
 * Military products retain their low 32 bits before unsigned division. The final
 * product is interpreted signed32 and divided toward zero; negative returns are
 * supported. Easy x87/helper behavior is deliberately unsupported. No writes/RNG.
 */
export function calculateCityFoodIncomeProjection(input: CityFoodIncomeProjectionInput): CityFoodIncomeProjectionResult {
  const top = fields(input, ['profile', 'baseFoodWord', 'slots', 'resolvedTypeRows', 'cityTroopsWord', 'difficultyWord', 'cityPlayerPredicate', 'securityByte'],
    ['profile', 'baseFoodWord', 'slots', 'resolvedTypeRows', 'difficultyWord', 'securityByte']);
  if (typeof top === 'string') return reject(top);
  if (top.profile !== 'city-food-income-stable-resolved-non-easy-u32-v1') return reject('unsupported-profile');
  if (!uint(top.baseFoodWord, 65535) || !uint(top.difficultyWord, 0xFFFFFFFF) || !uint(top.securityByte, 255)) return reject('invalid-input');
  if (top.difficultyWord === 2) {
    if (typeof top.cityPlayerPredicate !== 'boolean') return reject('invalid-input');
  } else if (own(top, 'cityPlayerPredicate')) return reject('unexpected-field');
  const rows = fields(top.resolvedTypeRows, typeKeys, []);
  if (typeof rows === 'string') return reject(rows);
  const parsedRows: Record<string, {valid: boolean; foodYieldWord?: number}> = {};
  for (const [key, value] of Object.entries(rows)) {
    const row = fields(value, ['valid', 'foodYieldWord'], ['valid']);
    if (typeof row === 'string') return reject(row);
    if (typeof row.valid !== 'boolean') return reject('invalid-input');
    if (row.valid) {
      if (!uint(row.foodYieldWord, 65535)) return reject('invalid-input');
      parsedRows[key] = {valid: true, foodYieldWord: row.foodYieldWord === 0 ? 0 : row.foodYieldWord};
    } else {
      if (own(row, 'foodYieldWord')) return reject('unexpected-field');
      parsedRows[key] = {valid: false};
    }
  }
  const slots = top.slots;
  if (!Array.isArray(slots) || Object.getPrototypeOf(slots) !== Array.prototype || slots.length !== 30) return reject('invalid-input');
  const slotKeys = Reflect.ownKeys(slots);
  const allowedSlotKeys = ['length', ...Array.from({length: 30}, (_, i) => String(i))];
  if (slotKeys.some(key => typeof key !== 'string' || !allowedSlotKeys.includes(key))) return reject('unexpected-field');
  const slotDescriptors = Object.getOwnPropertyDescriptors(slots);
  if (slotKeys.length !== 31 || allowedSlotKeys.some(key => !slotDescriptors[key] || !('value' in slotDescriptors[key]!))) return reject('invalid-input');
  let troopsConsumed = false;
  let rawFood = top.baseFoodWord === 0 ? 0 : top.baseFoodWord;
  const receipts: CityFoodIncomeSlotReceipt[] = [];
  for (let index = 0; index < 30; index++) {
    const value = slotDescriptors[String(index)]!.value;
    if (value === null) {
      receipts.push({index, facilityTypeWord: null, effectiveType: null, status: 'invalid-slot', foodYieldWord: null, granaryApplied: false, effectiveTroops: null, militaryProductRaw: null, militaryProductU32: null, contribution: 0});
      continue;
    }
    const slot = fields(value, ['facilityTypeWord', 'constructionWord', 'adjacentGranary'], ['facilityTypeWord', 'constructionWord']);
    if (typeof slot === 'string') return reject(slot);
    if (!uint(slot.facilityTypeWord, 0xFFFFFFFF) || !uint(slot.constructionWord, 0xFFFFFFFF)) return reject('invalid-input');
    const facilityTypeWord = slot.facilityTypeWord === 0 ? 0 : slot.facilityTypeWord;
    let effectiveType: number | null = facilityTypeWord;
    let status: CityFoodIncomeSlotReceipt['status'] = 'yield';
    if (!typeKeys.includes(String(facilityTypeWord))) { effectiveType = null; status = 'ignored-type'; }
    else if (slot.constructionWord === 0) {
      if (facilityTypeWord === 52) effectiveType = 32;
      else if (facilityTypeWord === 53) effectiveType = 52;
      else { effectiveType = null; status = 'unfinished'; }
    }
    let foodYieldWord: number | null = null;
    let granaryApplied = false;
    let effectiveTroops: number | null = null;
    let militaryProductRaw: number | null = null;
    let militaryProductU32: number | null = null;
    let contribution = 0;
    if (effectiveType !== null) {
      const row = parsedRows[String(effectiveType)];
      if (!row) return reject('missing-type-row');
      if (!row.valid) status = 'invalid-type-row';
      else {
        foodYieldWord = row.foodYieldWord!;
        if (effectiveType === 32 || effectiveType === 52 || effectiveType === 53) {
          if (!own(slot, 'adjacentGranary')) return reject('missing-adjacent-granary');
          if (typeof slot.adjacentGranary !== 'boolean') return reject('invalid-input');
          granaryApplied = slot.adjacentGranary;
        } else if (own(slot, 'adjacentGranary')) return reject('unexpected-field');
        if (effectiveType === 49) {
          troopsConsumed = true;
          if (!own(top, 'cityTroopsWord')) return reject('missing-city-troops');
          if (!uint(top.cityTroopsWord, 0xFFFFFFFF)) return reject('invalid-input');
          effectiveTroops = Math.max(15000, top.cityTroopsWord);
          const product = BigInt(effectiveTroops) * BigInt(foodYieldWord);
          militaryProductRaw = Number(product);
          militaryProductU32 = Number(BigInt.asUintN(32, product));
          contribution = Math.floor(militaryProductU32 / 15000);
        } else contribution = granaryApplied ? Math.floor(3 * foodYieldWord / 2) : foodYieldWord;
      }
    }
    if (status !== 'yield' && own(slot, 'adjacentGranary')) return reject('unexpected-field');
    rawFood += contribution;
    receipts.push({index, facilityTypeWord, effectiveType, status, foodYieldWord, granaryApplied, effectiveTroops, militaryProductRaw, militaryProductU32, contribution});
  }
  if (!troopsConsumed && own(top, 'cityTroopsWord')) return reject('unexpected-field');
  // Even a zero raw value cannot authenticate the unlisted Easy conversion helper.
  if (top.difficultyWord === 0) return reject('unsupported-easy-branch');
  const difficultyPercent = top.difficultyWord === 2 ? (top.cityPlayerPredicate ? 75 : 125) : 100;
  const difficultyAdjusted = Math.floor(rawFood * difficultyPercent / 100);
  const effectiveSecurity = Math.max(50, top.securityByte);
  const product = BigInt(difficultyAdjusted) * BigInt(effectiveSecurity);
  const securityProductRaw = Number(product);
  const securityProductU32 = Number(BigInt.asUintN(32, product));
  const securityProductSigned = Number(BigInt.asIntN(32, product));
  // BigInt division truncates toward zero and does not create negative zero.
  const returnedIncomeSigned = Number(BigInt(securityProductSigned) / 100n);
  const returnedIncomeU32 = Number(BigInt.asUintN(32, BigInt(returnedIncomeSigned)));
  return deepFreeze({supported: true, profile: top.profile, baseFoodWord: top.baseFoodWord === 0 ? 0 : top.baseFoodWord,
    difficultyWord: top.difficultyWord, securityByte: top.securityByte === 0 ? 0 : top.securityByte,
    slots: receipts, rawFood, difficultyPercent, difficultyAdjusted, effectiveSecurity,
    securityProductRaw, securityProductU32, securityProductSigned, returnedIncomeSigned, returnedIncomeU32, evidence});
}
