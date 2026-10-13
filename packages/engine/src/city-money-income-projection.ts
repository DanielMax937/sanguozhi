import source from '../../../docs/sources/city-money-income-projection.json' with { type: 'json' };

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object') {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
}
/** Stable resolved source-listing projection, not actual income posting. */
export const CITY_MONEY_INCOME_PROJECTION = deepFreeze(source);
export type CityMoneyIncomeType = 31 | 46 | 47 | 48 | 50 | 51;
export type CityMoneyIncomeSlot = null | {
  readonly facilityTypeWord: number;
  readonly constructionWord: number;
  /** Required only after a valid ordinary-market type row was resolved. */
  readonly adjacentMint?: boolean;
};
export type CityMoneyIncomeTypeRow = {readonly valid: false} | {readonly valid: true; readonly moneyYieldWord: number};
export type CityMoneyIncomeProjectionInput = {
  readonly profile: 'city-money-income-stable-resolved-i32-safe-v1';
  readonly baseMoneyWord: number;
  readonly slots: readonly CityMoneyIncomeSlot[];
  readonly resolvedTypeRows: Readonly<Partial<Record<CityMoneyIncomeType, CityMoneyIncomeTypeRow>>>;
  readonly difficultyWord: number;
  /** Required only for difficultyWord == 2. */
  readonly cityPlayerPredicate?: boolean;
  /** Late U8 read at 0049E6FE; there is no upper clamp at 100. */
  readonly securityByte: number;
};
export type CityMoneyIncomeProjectionRejectionReason = 'invalid-input' | 'unexpected-field' | 'unsupported-profile'
  | 'missing-type-row' | 'missing-adjacent-mint' | 'unsupported-arithmetic-domain';
type Evidence = typeof CITY_MONEY_INCOME_PROJECTION.evidence;
export type CityMoneyIncomeProjectionRejection = {
  readonly supported: false;
  readonly reason: CityMoneyIncomeProjectionRejectionReason;
  readonly evidence: Evidence;
};
export type CityMoneyIncomeSlotReceipt = {
  readonly index: number;
  readonly facilityTypeWord: number | null;
  readonly effectiveType: number | null;
  readonly status: 'invalid-slot' | 'ignored-type' | 'unfinished' | 'invalid-type-row' | 'yield';
  readonly moneyYieldWord: number | null;
  readonly mintApplied: boolean;
  readonly contribution: number;
};
export type CityMoneyIncomeProjectionReceipt = {
  readonly supported: true;
  readonly profile: CityMoneyIncomeProjectionInput['profile'];
  readonly baseMoneyWord: number;
  readonly difficultyWord: number;
  readonly securityByte: number;
  readonly slots: readonly CityMoneyIncomeSlotReceipt[];
  readonly rawMoney: number;
  readonly difficultyPercent: number;
  readonly effectiveSecurity: number;
  readonly intermediates: {
    readonly scaledRaw: number;
    readonly difficultyProduct: number | null;
    readonly difficultyAdjusted: number;
    readonly securityProduct: number;
    readonly securityAdjusted: number;
  };
  readonly returnedIncome: number;
  readonly evidence: Evidence;
};
export type CityMoneyIncomeProjectionResult = CityMoneyIncomeProjectionRejection | CityMoneyIncomeProjectionReceipt;

const evidence = CITY_MONEY_INCOME_PROJECTION.evidence;
const reject = (reason: CityMoneyIncomeProjectionRejectionReason): CityMoneyIncomeProjectionRejection =>
  Object.freeze({supported: false, reason, evidence});
const uint = (value: unknown, maximum: number): value is number => typeof value === 'number'
  && Number.isSafeInteger(value) && value >= 0 && value <= maximum;
// Read ordinary data descriptors without invoking accessors. No input object is retained.
type Fields = Record<string, unknown>;
function fields(value: unknown, allowed: readonly string[], required: readonly string[]): Fields | CityMoneyIncomeProjectionRejectionReason {
  if (value === null || typeof value !== 'object') return 'invalid-input';
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) return 'invalid-input';
  const keys = Reflect.ownKeys(value);
  if (keys.some(key => typeof key !== 'string' || !allowed.includes(key))) return 'unexpected-field';
  const ds = Object.getOwnPropertyDescriptors(value);
  if (required.some(key => !Object.hasOwn(ds, key)) || keys.some(key => !('value' in ds[key as string]!))) return 'invalid-input';
  return Object.fromEntries(keys.map(key => [key, ds[key as string]!.value]));
}
const typeKeys = ['31', '46', '47', '48', '50', '51'];
const own = (o: Fields, key: string) => Object.hasOwn(o, key);

/**
 * Pure local return-value calculation after the city/owner entry gates passed.
 * Fixed 30-slot observations and one stable resolved type table are prerequisites,
 * not reconstructed pointer validators, lookup helpers or spatial adjacency.
 * Rejects every original signed32 multiplication overflow instead of returning
 * an unbounded formula's value. No state write, RNG or monthly scheduler.
 */
export function calculateCityMoneyIncomeProjection(input: CityMoneyIncomeProjectionInput): CityMoneyIncomeProjectionResult {
  const top = fields(input, ['profile', 'baseMoneyWord', 'slots', 'resolvedTypeRows', 'difficultyWord', 'cityPlayerPredicate', 'securityByte'],
    ['profile', 'baseMoneyWord', 'slots', 'resolvedTypeRows', 'difficultyWord', 'securityByte']);
  if (typeof top === 'string') return reject(top);
  if (top.profile !== 'city-money-income-stable-resolved-i32-safe-v1') return reject('unsupported-profile');
  if (!uint(top.baseMoneyWord, 65535) || !uint(top.difficultyWord, 0xFFFFFFFF) || !uint(top.securityByte, 255)) return reject('invalid-input');
  if (top.difficultyWord === 2) {
    if (typeof top.cityPlayerPredicate !== 'boolean') return reject('invalid-input');
  } else if (own(top, 'cityPlayerPredicate')) return reject('unexpected-field');
  const rows = fields(top.resolvedTypeRows, typeKeys, []);
  if (typeof rows === 'string') return reject(rows);
  const parsedRows: Record<string, {valid: boolean; moneyYieldWord?: number}> = {};
  for (const [key, value] of Object.entries(rows)) {
    const row = fields(value, ['valid', 'moneyYieldWord'], ['valid']);
    if (typeof row === 'string') return reject(row);
    if (typeof row.valid !== 'boolean') return reject('invalid-input');
    if (row.valid) {
      if (!uint(row.moneyYieldWord, 65535)) return reject('invalid-input');
      parsedRows[key] = {valid: true, moneyYieldWord: row.moneyYieldWord === 0 ? 0 : row.moneyYieldWord};
    } else {
      if (own(row, 'moneyYieldWord')) return reject('unexpected-field');
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
  let rawMoney = top.baseMoneyWord === 0 ? 0 : top.baseMoneyWord;
  const receipts: CityMoneyIncomeSlotReceipt[] = [];
  for (let index = 0; index < 30; index++) {
    const value = slotDescriptors[String(index)]!.value;
    if (value === null) {
      receipts.push({index, facilityTypeWord: null, effectiveType: null, status: 'invalid-slot', moneyYieldWord: null, mintApplied: false, contribution: 0});
      continue;
    }
    const slot = fields(value, ['facilityTypeWord', 'constructionWord', 'adjacentMint'], ['facilityTypeWord', 'constructionWord']);
    if (typeof slot === 'string') return reject(slot);
    if (!uint(slot.facilityTypeWord, 0xFFFFFFFF) || !uint(slot.constructionWord, 0xFFFFFFFF)) return reject('invalid-input');
    const facilityTypeWord = slot.facilityTypeWord === 0 ? 0 : slot.facilityTypeWord;
    let effectiveType: number | null = facilityTypeWord;
    let status: CityMoneyIncomeSlotReceipt['status'] = 'yield';
    if (!typeKeys.includes(String(facilityTypeWord))) { effectiveType = null; status = 'ignored-type'; }
    else if (slot.constructionWord === 0) {
      if (facilityTypeWord === 50) effectiveType = 31;
      else if (facilityTypeWord === 51) effectiveType = 50;
      else { effectiveType = null; status = 'unfinished'; }
    }
    let moneyYieldWord: number | null = null;
    let mintApplied = false;
    let contribution = 0;
    if (effectiveType !== null) {
      const row = parsedRows[String(effectiveType)];
      if (!row) return reject('missing-type-row');
      if (!row.valid) status = 'invalid-type-row';
      else {
        moneyYieldWord = row.moneyYieldWord!;
        if (effectiveType === 31 || effectiveType === 50 || effectiveType === 51) {
          if (!own(slot, 'adjacentMint')) return reject('missing-adjacent-mint');
          if (typeof slot.adjacentMint !== 'boolean') return reject('invalid-input');
          mintApplied = slot.adjacentMint;
        } else if (own(slot, 'adjacentMint')) return reject('unexpected-field');
        contribution = mintApplied ? Math.floor(3 * moneyYieldWord / 2) : moneyYieldWord;
      }
    }
    if (status !== 'yield' && own(slot, 'adjacentMint')) return reject('unexpected-field');
    rawMoney += contribution;
    receipts.push({index, facilityTypeWord, effectiveType, status, moneyYieldWord, mintApplied, contribution});
  }
  // Each yield <= 65535, each mint contribution <= 98302, raw <= 3014595.
  // JS exact integer arithmetic covers all products considered before refusal.
  const difficultyPercent = top.difficultyWord === 0 ? 125 : top.difficultyWord === 2 ? (top.cityPlayerPredicate ? 75 : 125) : 100;
  const effectiveSecurity = Math.max(50, top.securityByte);
  const scaledRaw = rawMoney * 100;
  if (scaledRaw > 0x7FFFFFFF) return reject('unsupported-arithmetic-domain');
  const difficultyProduct = top.difficultyWord === 0 || top.difficultyWord === 2 ? scaledRaw * difficultyPercent : null;
  if (difficultyProduct !== null && difficultyProduct > 0x7FFFFFFF) return reject('unsupported-arithmetic-domain');
  const difficultyAdjusted = difficultyProduct === null ? scaledRaw : Math.floor(difficultyProduct / 100);
  const securityProduct = difficultyAdjusted * effectiveSecurity;
  if (securityProduct > 0x7FFFFFFF) return reject('unsupported-arithmetic-domain');
  const securityAdjusted = Math.floor(securityProduct / 100);
  const returnedIncome = Math.floor(securityAdjusted / 100);
  return deepFreeze({supported: true, profile: top.profile, baseMoneyWord: top.baseMoneyWord === 0 ? 0 : top.baseMoneyWord,
    difficultyWord: top.difficultyWord === 0 ? 0 : top.difficultyWord, securityByte: top.securityByte === 0 ? 0 : top.securityByte,
    slots: receipts, rawMoney, difficultyPercent, effectiveSecurity,
    intermediates: {scaledRaw, difficultyProduct, difficultyAdjusted, securityProduct, securityAdjusted}, returnedIncome, evidence});
}
