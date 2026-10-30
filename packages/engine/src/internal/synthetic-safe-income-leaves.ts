/** Safe income-only proposal. Never import the whole finance/season lifecycle or salary/health writers. */
import { applyFinanceMoneyPhase } from './finance-money-payroll-phases.ts';
import type { FinanceMoneyFacilityFact } from './finance-money-payroll-types.ts';
import facilityData from '../../../../data/catalogs/city-finance-facilities-v1.json' with { type: 'json' };
import { calculateCityFoodIncomeProjection } from '../city-food-income-projection.ts';
import type { CityFoodIncomeProjectionInput, CityFoodIncomeSlot } from '../city-food-income-projection.ts';
import { calculateMonthlyCityFoodBaseArgument } from '../monthly-city-food-base-argument.ts';
type Frozen<T> = T extends object ? { readonly [K in keyof T]: Frozen<T[K]> } : T;
const fail = (reason: string) => Object.freeze({ ok: false as const, reason });
const uint = (v: unknown, max: number): v is number => typeof v === 'number' && Number.isSafeInteger(v) && !Object.is(v, -0) && v >= 0 && v <= max;
const signed = (v: unknown, max: number): v is number => typeof v === 'number' && Number.isSafeInteger(v) && !Object.is(v, -0) && Math.abs(v) <= max;
const record = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === 'object' && !Array.isArray(v);
const exact = (v: Record<string, unknown>, names: readonly string[]) => Object.keys(v).length === names.length && names.every(name => Object.hasOwn(v, name));
const id = (v: unknown): v is string => typeof v === 'string' && /^synthetic-[a-z0-9-]{1,48}$/.test(v);
function freeze<T>(value: T): Frozen<T> {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) { for (const child of Object.values(value)) freeze(child); Object.freeze(value); }
  return value as Frozen<T>;
}
const runtime = globalThis as { process?: { getBuiltinModule?: (id: string) => { types: { isProxy(v: unknown): boolean } } } };
const isProxy = typeof runtime.process?.getBuiltinModule === 'function' ? runtime.process.getBuiltinModule('node:util').types.isProxy : (() => false);
function detach(input: unknown): unknown {
  let nodes = 0, chars = 0; const active = new Set<object>();
  const invalid = (): never => { throw new Error('invalid-data'); };
  function visit(value: unknown, depth: number): unknown {
    if (++nodes > 100000 || depth > 32) return invalid();
    if (value === null || typeof value === 'boolean') return value;
    if (typeof value === 'number') return Number.isSafeInteger(value) && !Object.is(value, -0) ? value : invalid();
    if (typeof value === 'string') { chars += value.length; return chars <= 2000000 ? value : invalid(); }
    if (typeof value !== 'object' || isProxy(value) || active.has(value)) return invalid();
    const array = Array.isArray(value), proto = Object.getPrototypeOf(value);
    if (proto !== (array ? Array.prototype : Object.prototype) && !(proto === null && !array)) return invalid();
    const descriptors = Object.getOwnPropertyDescriptors(value), names = Reflect.ownKeys(descriptors);
    if (names.some(name => typeof name !== 'string' || !Object.hasOwn(descriptors[name]!, 'value')
      || (!descriptors[name]!.enumerable && !(array && name === 'length')))) return invalid();
    active.add(value);
    try {
      if (array) {
        const length = descriptors.length!.value as number;
        if (!uint(length, 512) || names.length !== length + 1) return invalid();
        const result: unknown[] = [];
        for (let i = 0; i < length; i++) { const descriptor = descriptors[String(i)]; if (!descriptor) return invalid(); result.push(visit(descriptor.value, depth + 1)); }
        return result;
      }
      if (names.length > 128) return invalid();
      const result: Record<string, unknown> = {};
      for (const name of names as string[]) Object.defineProperty(result, name, { value: visit(descriptors[name]!.value, depth + 1), enumerable: true });
      return result;
    } finally { active.delete(value); }
  }
  return visit(input, 0);
}

type Facility = FinanceMoneyFacilityFact & { readonly id: string };
function facilitiesFrom(raw: unknown): (Facility | null)[] | undefined {
  if (!Array.isArray(raw) || raw.length !== 30) return undefined;
  const ids = new Set<string>(), positions = new Set<string>(), out: (Facility | null)[] = [];
  for (const row of raw) {
    if (row === null) { out.push(null); continue; }
    if (!record(row) || !exact(row, ['id', 'kind', 'level', 'complete', 'position']) || !id(row.id) || ids.has(row.id)
      || typeof row.complete !== 'boolean' || !record(row.position) || !exact(row.position, ['q', 'r'])
      || !signed(row.position.q, 1000000) || !signed(row.position.r, 1000000)
      || !facilityData.rows.some(f => f.kind === row.kind && f.level === row.level)) return undefined;
    const position = `${row.position.q},${row.position.r}`; if (positions.has(position)) return undefined;
    ids.add(row.id); positions.add(position);
    out.push({ id: row.id, kind: row.kind as Facility['kind'], level: row.level as number, complete: row.complete,
      position: { q: row.position.q, r: row.position.r } });
  }
  return out;
}
function foodInput(facilities: readonly (Facility | null)[], baseFoodWord: number, troops: number, security: number,
  difficulty: 'normal' | 'super', controller: 'player' | 'ai'): CityFoodIncomeProjectionInput {
  const slots: CityFoodIncomeSlot[] = facilities.map(f => f === null ? null : {
    facilityTypeWord: facilityData.rows.find(row => row.kind === f.kind && row.level === f.level)!.typeWord,
    constructionWord: f.complete ? 1 : 0,
    ...(f.kind === 'farm' && (f.complete || f.level > 1) ? { adjacentGranary: facilities.some(other => {
      if (other === null || !other.complete || other.kind !== 'granary') return false;
      const dq = f.position.q - other.position.q, dr = f.position.r - other.position.r;
      return Math.max(Math.abs(dq), Math.abs(dr), Math.abs(dq + dr)) === 1;
    }) } : {}) });
  return { profile: 'city-food-income-stable-resolved-non-easy-u32-v1', baseFoodWord, slots,
    resolvedTypeRows: { 32: { valid: true, foodYieldWord: 1500 }, 52: { valid: true, foodYieldWord: 1800 },
      53: { valid: true, foodYieldWord: 2250 }, 49: { valid: true, foodYieldWord: 1500 } },
    ...(facilities.some(f => f !== null && f.kind === 'military-farm' && f.complete) ? { cityTroopsWord: troops } : {}),
    difficultyWord: difficulty === 'normal' ? 1 : 2, ...(difficulty === 'super' ? { cityPlayerPredicate: controller === 'player' } : {}), securityByte: security };
}
function foodCredit(reason: 'food-base' | 'rice-way-bonus', before: number, capacity: number, requested: number) {
  const accepted = Math.min(requested, capacity - before);
  return { resource: 'food' as const, reason, before, requested, accepted, actualDelta: accepted, after: before + accepted,
    cap: capacity, discarded: requested - accepted, writerPolicyId: 'saturating-positive-credit-v1' as const };
}
/** Date is the new accepted tick's date; the caller owns exactly-once settlement and live facility binding. */
export function planSyntheticIncomeLeaves(rawContext: unknown, rawConfig: unknown) {
  try {
    const c = detach(rawContext), config = detach(rawConfig);
    if (!record(c) || !exact(c, ['cityId', 'ownerId', 'turn', 'date', 'gold', 'food', 'goldCapacity', 'foodCapacity', 'security', 'troops', 'facilities'])
      || !id(c.cityId) || !id(c.ownerId) || c.cityId === c.ownerId || !uint(c.turn, 0x7fffffff)
      || !record(c.date) || !exact(c.date, ['year', 'month', 'day']) || !uint(c.date.year, 9999) || c.date.year < 1
      || !uint(c.date.month, 12) || c.date.month < 1 || ![1, 11, 21].includes(c.date.day as number)
      || !uint(c.goldCapacity, 1000000000) || !uint(c.foodCapacity, 1000000000)
      || !uint(c.gold, c.goldCapacity) || !uint(c.food, c.foodCapacity) || !uint(c.security, 100)
      || !uint(c.troops, 150000) || c.troops === 0) return fail('invalid-income-context');
    const facilities = facilitiesFrom(c.facilities);
    if (!facilities || facilities.some(f => f !== null && (f.id === c.cityId || f.id === c.ownerId))) return fail('invalid-current-income-facilities');
    if (!record(config) || !exact(config, ['profile', 'baseMoneyWord', 'baseFoodWord', 'difficulty', 'controller', 'incomeSkills', 'harvestInputs'])
      || config.profile !== 'synthetic-income-only-leaves-v1' || !uint(config.baseMoneyWord, 65535) || !uint(config.baseFoodWord, 65535)
      || (config.difficulty !== 'normal' && config.difficulty !== 'super') || (config.controller !== 'player' && config.controller !== 'ai')
      || !record(config.incomeSkills) || !exact(config.incomeSkills, ['taxation', 'wealthy', 'levy', 'riceWay'])
      || !Object.values(config.incomeSkills).every(v => typeof v === 'boolean') || !Array.isArray(config.harvestInputs) || config.harvestInputs.length > 120) return fail('invalid-income-config');
    const harvests = new Map<string, boolean>();
    for (const row of config.harvestInputs) {
      if (!record(row) || !exact(row, ['year', 'month', 'postMonthlyHarvest']) || !uint(row.year, 9999) || row.year < 1
        || !uint(row.month, 12) || row.month < 1 || typeof row.postMonthlyHarvest !== 'boolean') return fail('invalid-harvest-input');
      const key = `${row.year}-${row.month}`; if (harvests.has(key)) return fail('duplicate-harvest-month'); harvests.set(key, row.postMonthlyHarvest);
    }
    const monthly = c.date.day === 1, quarterly = monthly && [1, 4, 7, 10].includes(c.date.month);
    const harvest = harvests.get(`${c.date.year}-${c.date.month}`);
    if (monthly && harvest === undefined) return fail('missing-bound-harvest-month');
    const flags = config.incomeSkills, goldTarget = { gold: c.gold, goldCapacity: c.goldCapacity };
    const money = applyFinanceMoneyPhase({ facilities, baseMoneyWord: config.baseMoneyWord, difficulty: config.difficulty,
      controller: config.controller, securityBeforeIncome: c.security, monthStart: monthly,
      taxationActive: flags.taxation as boolean, wealthyActive: flags.wealthy as boolean, goldTarget });
    if (!money.ok) return fail(`income-money:${money.reason}`);
    let food = c.food, foodKernel: unknown = { status: 'not-due' }, monthlyKernel: unknown = { status: 'not-due' };
    const foodWrites: ReturnType<typeof foodCredit>[] = [];
    if (monthly && (quarterly || flags.levy)) {
      const input = foodInput(facilities, config.baseFoodWord, c.troops, c.security, config.difficulty, config.controller);
      const result = calculateCityFoodIncomeProjection(input);
      if (!result.supported) return fail(`income-food:${result.reason}`);
      const f = result.returnedIncomeSigned;
      if (!uint(f, 0x7fffffff) || f !== result.returnedIncomeU32 || result.securityProductSigned !== result.securityProductRaw
        || result.securityProductU32 !== result.securityProductRaw) return fail('unsupported-food-kernel-return');
      foodKernel = { status: 'called', input, result };
      const monthlyInput = { profile: 'monthly-city-food-base-argument-u32-v1' as const, entryFoodEdiU32: f,
        harvestPredicateEaxU32: harvest ? 1 : 0, lateLevyFlagDwordU32: flags.levy ? 1 : 0 };
      const monthlyResult = calculateMonthlyCityFoodBaseArgument(monthlyInput);
      if (!monthlyResult.supported) return fail(`monthly-food:${monthlyResult.reason}`);
      const amount = monthlyResult.pushedArgumentSigned;
      if (!uint(amount, 0x7fffffff) || amount !== monthlyResult.pushedArgumentU32) return fail('unsupported-monthly-food-return');
      monthlyKernel = { status: 'called', input: monthlyInput, result: monthlyResult };
      const credit = foodCredit('food-base', food, c.foodCapacity, amount); food = credit.after; foodWrites.push(credit);
      if (quarterly && flags.riceWay) { const bonus = foodCredit('rice-way-bonus', food, c.foodCapacity, Math.floor(amount / 2)); food = bonus.after; foodWrites.push(bonus); }
    }
    return freeze({ ok: true as const, cityPatch: { goldBefore: c.gold, goldAfter: goldTarget.gold, foodBefore: c.food, foodAfter: food },
      receipt: { cityId: c.cityId, ownerId: c.ownerId, turn: c.turn, date: { ...c.date }, monthly, quarterly,
        profile: 'synthetic-income-only-leaves-v1' as const, incomeSkills: { ...flags }, harvest: monthly ? harvest! : null,
        moneyKernel: money.kernel, foodKernel, monthlyKernel, moneyWrites: money.writes, foodWrites,
        salaryApplied: false as const, apRecovered: false as const, securityWritten: false as const,
        healthOrSeasonPipelineCalled: false as const, nativeEquivalent: false as const } });
  } catch { return fail('invalid-income-data'); }
}
