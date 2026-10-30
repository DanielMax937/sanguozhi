/** Neutral city/transport food leaf extracted from food-supply-lifecycle ConsumeTurn.
 * No season, health, AP, money, troop-loss, calendar advance or persistent state call chain. */
type Frozen<T> = T extends object ? { readonly [K in keyof T]: Frozen<T[K]> } : T;
const fail = (reason: string) => Object.freeze({ ok: false as const, reason });
const uint = (v: unknown, max: number): v is number => typeof v === 'number' && Number.isSafeInteger(v) && !Object.is(v, -0) && v >= 0 && v <= max;
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
    if (typeof value === 'number') return uint(value, Number.MAX_SAFE_INTEGER) ? value : invalid();
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

type Account = { id: string; ownerId: string; troops: number; food: number; foodCapacity: number };
function account(value: unknown): Account | undefined {
  if (!record(value) || !exact(value, ['id', 'ownerId', 'troops', 'food', 'foodCapacity'])
    || !id(value.id) || !id(value.ownerId) || value.id === value.ownerId || !uint(value.troops, 1000000000)
    || value.troops === 0 || !uint(value.foodCapacity, 1000000000) || !uint(value.food, value.foodCapacity)) return undefined;
  return { id: value.id, ownerId: value.ownerId, troops: value.troops, food: value.food, foodCapacity: value.foodCapacity };
}
// Exact source-bits arithmetic copied from food-supply-lifecycle.ts:158-162, not a decimal approximation.
type Rational = readonly [bigint, bigint];
function rational(n: bigint, d = 1n): Rational { let a = n, b = d; while (b) { const r = a % b; a = b; b = r; } return [n / a, d / a]; }
function mul(a: Rational, b: Rational): Rational { return rational(a[0] * b[0], a[1] * b[1]); }
function bits(v: number): Rational { const significand = BigInt((v & 0x7fffff) | 0x800000), exponent = ((v >>> 23) & 255) - 150; return exponent >= 0 ? rational(significand << BigInt(exponent)) : rational(significand, 1n << BigInt(-exponent)); }
const SCALE = bits(0x3d4ccccd);
function consumption(a: Account, kind: 'city' | 'transport') {
  const base = { id: a.id, ownerId: a.ownerId, kind, foodBefore: a.food, foodAfter: a.food, debited: 0,
    exhaustedNow: false, foodAvailabilityAfter: a.food > 0 ? 'positive' as const : 'empty' as const };
  if (a.food === 0) return { ...base, normalRaw: null, combinedRaw: null, requestCost: null, shortfall: null, status: 'already-empty-skipped' as const };
  const normal = kind === 'transport' ? mul(rational(BigInt(a.troops)), SCALE) : rational(BigInt(a.troops), 40n);
  const truncated = normal[0] / normal[1];
  const requestCost = Number(truncated < 1n ? 1n : truncated);
  const debited = Math.min(a.food, requestCost), shortfall = requestCost - debited, after = a.food - debited;
  const raw = `${normal[0]}/${normal[1]}`;
  return { ...base, foodAfter: after, normalRaw: raw, combinedRaw: raw, requestCost, debited, shortfall,
    exhaustedNow: after === 0, foodAvailabilityAfter: after > 0 ? 'positive' as const : 'empty' as const,
    status: shortfall > 0 ? 'insufficient' as const : 'consumed' as const };
}
/** The outer owner supplies one current snapshot and calls this exactly once per accepted WorldTick.
 * This pure proposal does not authenticate history or make repeat calls idempotent. */
export function planSyntheticNeutralFoodTick(rawContext: unknown, rawConfig: unknown) {
  try {
    const c = detach(rawContext), config = detach(rawConfig);
    if (!record(c) || !exact(c, ['turn', 'date', 'city', 'transports']) || !uint(c.turn, 0x7fffffff)
      || !record(c.date) || !exact(c.date, ['year', 'month', 'day']) || !uint(c.date.year, 9999) || c.date.year < 1
      || !uint(c.date.month, 12) || c.date.month < 1 || ![1, 11, 21].includes(c.date.day as number)
      || !Array.isArray(c.transports) || c.transports.length > 8
      || !record(config) || !exact(config, ['profile']) || config.profile !== 'city-transport-neutral-food-v1') return fail('invalid-neutral-food-context');
    const city = account(c.city); if (!city) return fail('invalid-city-food-account');
    const seen = new Set([city.id, city.ownerId]), transports: Account[] = [];
    for (const raw of c.transports) {
      const t = account(raw);
      if (!t || seen.has(t.id) || t.ownerId !== city.ownerId || t.troops > 60000 || t.foodCapacity !== 500000) return fail('invalid-transport-food-account');
      seen.add(t.id); transports.push(t);
    }
    const consumptions = [consumption(city, 'city'), ...transports.map(t => consumption(t, 'transport'))]
      .sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
    const patches = consumptions.map(r => ({ id: r.id, foodBefore: r.foodBefore, foodAfter: r.foodAfter }));
    return freeze({ ok: true as const, foodPatches: patches,
      receipt: { profile: 'city-transport-neutral-food-v1' as const, turn: c.turn, date: { year: c.date.year, month: c.date.month, day: c.date.day as 1 | 11 | 21 },
        arithmetic: 'source-bits-exact-rational-v1' as const, consumptions,
        ledger: consumptions.filter(r => r.debited > 0).map(r => ({ resource: 'food' as const, from: r.id, to: 'food-consumed-sink' as const, amount: r.debited })),
        fireAndCoverage: 'not-modeled-not-a-no-fire-observation' as const, fieldFoodCovered: false as const,
        shortage: 'report-only-no-troop-loss-v1' as const, calendarAdvanced: false as const,
        apOrGoldWritten: false as const, troopsWritten: false as const } });
  } catch { return fail('invalid-neutral-food-data'); }
}
