/** Detached resource accounts only. This module never creates, moves or finalizes native units. */
type Frozen<T> = T extends object ? { readonly [K in keyof T]: Frozen<T[K]> } : T;
type Mutable<T> = T extends object ? { -readonly [K in keyof T]: Mutable<T[K]> } : T;
const MAX = 0x7fffffff, MAX_ITEMS = 4096, MAX_BYTES = 16 * 1024 * 1024;
const runtime = globalThis as { process?: { getBuiltinModule?: (id: string) => { types: { isProxy(value: unknown): boolean } } } };
const isProxy = typeof runtime.process?.getBuiltinModule === 'function'
  ? runtime.process.getBuiltinModule('node:util').types.isProxy : (() => false);
export type FoodSupplyFailureReason = 'invalid-input' | 'unsupported-profile' | 'unsupported-schema' | 'unsupported-command' | 'invalid-json' | 'duplicate-command' | 'stale-revision' | 'invalid-turn' | 'out-of-range' | 'ineligible-transfer' | 'profile-mismatch' | 'replay-mismatch';
class Rejected extends Error { readonly reason: FoodSupplyFailureReason; constructor(reason: FoodSupplyFailureReason) { super(reason); this.reason = reason; } }
function reject(reason: FoodSupplyFailureReason = 'invalid-input'): never { throw new Rejected(reason); }
function freeze<T>(v: T): Frozen<T> { if (v !== null && typeof v === 'object') { for (const x of Object.values(v)) freeze(x); Object.freeze(v); } return v as Frozen<T>; }
function canonical(v: unknown): string {
  if (v === null || typeof v !== 'object') return JSON.stringify(v);
  if (Array.isArray(v)) return '[' + v.map(canonical).join(',') + ']';
  const r = v as Record<string, unknown>; return '{' + Object.keys(r).sort().map(k => JSON.stringify(k) + ':' + canonical(r[k])).join(',') + '}';
}
function equal(a: unknown, b: unknown): boolean { return canonical(a) === canonical(b); }
function clone<T>(v: T): Mutable<T> { return JSON.parse(JSON.stringify(v)) as Mutable<T>; }
function bytes(s: string): number { let n = 0; for (const c of s) { const p = c.codePointAt(0)!; n += p < 128 ? 1 : p < 2048 ? 2 : p < 65536 ? 3 : 4; } return n; }
/** Reject host behavior before reading any schema field. Never invoke getters or proxy traps on Node. */
function detach(value: unknown): unknown {
  let used = 0; const active = new Set<object>();
  const spend = (n: number): void => { used += n; if (used > MAX_BYTES) reject(); };
  function visit(v: unknown, depth: number): unknown {
    if (depth > 64) reject();
    if (v === null || typeof v === 'boolean' || typeof v === 'string') { if (typeof v === 'string' && v.length > MAX_BYTES) reject(); spend(bytes(JSON.stringify(v))); return v; }
    if (typeof v === 'number') { if (!Number.isSafeInteger(v) || Object.is(v, -0)) reject(); spend(String(v).length); return v; }
    if (typeof v !== 'object' || isProxy(v) || active.has(v)) reject();
    const a = Array.isArray(v), proto = Object.getPrototypeOf(v);
    if (proto !== (a ? Array.prototype : Object.prototype) && !(proto === null && !a)) reject();
    active.add(v);
    try {
      const ds = Object.getOwnPropertyDescriptors(v), keys = Reflect.ownKeys(ds);
      if (keys.some(k => typeof k !== 'string' || !('value' in ds[k]!) || (!ds[k]!.enumerable && !(a && k === 'length')))) reject();
      spend(2);
      if (a) {
        const n = ds.length!.value as number; if (n > MAX_ITEMS || keys.length !== n + 1) reject(); const out: unknown[] = [];
        for (let i = 0; i < n; i++) { const d = ds[String(i)]; if (!d) reject(); if (i) spend(1); out.push(visit(d.value, depth + 1)); } return out;
      }
      const out: Record<string, unknown> = {}; let i = 0;
      for (const k of keys as string[]) { spend(bytes(JSON.stringify(k)) + 1 + (i++ ? 1 : 0)); Object.defineProperty(out, k, { value: visit(ds[k]!.value, depth + 1), enumerable: true, writable: true, configurable: true }); } return out;
    } finally { active.delete(v); }
  }
  return visit(value, 0);
}
function record(v: unknown, keys: readonly string[]): Record<string, unknown> { if (!v || typeof v !== 'object' || Array.isArray(v)) reject(); const r = v as Record<string, unknown>; if (Object.keys(r).length !== keys.length || keys.some(k => !Object.hasOwn(r, k))) reject(); return r; }
function uint(v: unknown, max = MAX): number { if (typeof v !== 'number' || !Number.isInteger(v) || Object.is(v, -0) || v < 0 || v > max) reject(); return v; }
function id(v: unknown): string { if (typeof v !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(v)) reject(); return v; }
function bool(v: unknown): void { if (typeof v !== 'boolean') reject(); }
function arr(v: unknown, max = MAX_ITEMS): unknown[] { if (!Array.isArray(v) || v.length > max) reject(); return v; }
function oneOf<T extends string>(v: unknown, values: readonly T[]): T { if (!values.includes(v as T)) reject(); return v as T; }
function cmp(a: string, b: string): number { return a < b ? -1 : a > b ? 1 : 0; }

type ProfileCommon = {
  readonly arithmetic: 'source-bits-exact-rational-v1'; readonly coverage: 'supplied-single-selector-v1';
  readonly transfer: 'accepted-min-retain-v1'; readonly zeroTroops: 'retain-account-no-unit-lifecycle-v1'; readonly shortage: 'report-only-no-troop-loss-v1';
};
export type FoodSupplyProfile = ProfileCommon & (
  { readonly id: 'detached-food-supply-v1'; readonly morale: 'weighted-floor-v1' } |
  { readonly id: 'detached-food-supply-nearest-half-up-v1'; readonly morale: 'weighted-nearest-half-up-v1' }
);
const common: ProfileCommon = { arithmetic: 'source-bits-exact-rational-v1', coverage: 'supplied-single-selector-v1', transfer: 'accepted-min-retain-v1', zeroTroops: 'retain-account-no-unit-lifecycle-v1', shortage: 'report-only-no-troop-loss-v1' };
export const DETACHED_FOOD_SUPPLY_PROFILE: FoodSupplyProfile = freeze({ ...common, id: 'detached-food-supply-v1', morale: 'weighted-floor-v1' });
export const DETACHED_FOOD_SUPPLY_HALF_UP_PROFILE: FoodSupplyProfile = freeze({ ...common, id: 'detached-food-supply-nearest-half-up-v1', morale: 'weighted-nearest-half-up-v1' });
export type FoodSupplyAmounts = { readonly troops: number; readonly money: number; readonly food: number };
export type FoodSupplyAccount = FoodSupplyAmounts & {
  readonly kind: 'detached-resource-account'; readonly id: string; readonly ownerId: string; readonly classification: 'combat' | 'transport' | 'city' | 'port' | 'gate';
  readonly equipmentId: number | null; readonly morale: number; readonly equipment: readonly number[];
  readonly capacity: FoodSupplyAmounts & { readonly equipment: readonly number[] };
};
export type FoodSupplyState = { readonly schemaVersion: 1; readonly scope: 'detached-food-supply-accounts'; readonly profile: FoodSupplyProfile; readonly revision: number; readonly turn: number; readonly accounts: readonly FoodSupplyAccount[] };
export type FoodSupplyContext = {
  readonly accountId: string; readonly onFire: boolean; readonly politics: number | null; readonly hasTuntian: boolean;
  readonly coverage: { readonly candidates: readonly { readonly id: string; readonly type: 'camp' | 'fort' | 'fortress'; readonly ownerId: string }[]; readonly selectedId: string | null };
};
export type FoodSupplyCommand = { readonly commandId: string; readonly expectedRevision: number } & (
  { readonly type: 'ConsumeTurn'; readonly turn: number; readonly contexts: readonly FoodSupplyContext[] } |
  { readonly type: 'ManualSupply'; readonly sourceId: string; readonly targetId: string; readonly relation: { readonly kind: 'supplied-adjacent'; readonly sourceId: string; readonly targetId: string }; readonly requested: FoodSupplyAmounts }
);
export type FoodSupplyResource = 'troops' | 'money' | 'food' | `equipment:${number}`;
export type FoodSupplyLedgerRow = { readonly resource: FoodSupplyResource; readonly from: string; readonly to: string; readonly amount: number };
export type FoodSupplyConsumption = {
  readonly accountId: string; readonly foodBefore: number; readonly foodAfter: number; readonly normalRaw: string | null; readonly fireRaw: string | null; readonly combinedRaw: string | null;
  readonly requestCost: number | null; readonly debited: number; readonly shortfall: number | null; readonly status: 'already-empty-skipped' | 'tuntian-exempt' | 'consumed' | 'insufficient';
  readonly exhaustedNow: boolean; readonly foodAvailabilityAfter: 'positive' | 'empty'; readonly coverage: { readonly selectedId: string | null; readonly applied: 'none' | 'camp' | 'fort' | 'fortress' | 'ignored-for-transport' | 'not-applicable' };
};
type ReceiptCommon = { readonly commandId: string; readonly revisionBefore: number; readonly revisionAfter: number; readonly turnBefore: number; readonly turnAfter: number; readonly effectiveProfile: FoodSupplyProfile; readonly ledger: readonly FoodSupplyLedgerRow[] };
export type FoodSupplyReceipt = ReceiptCommon & (
  { readonly type: 'ConsumeTurn'; readonly consumptions: readonly FoodSupplyConsumption[] } |
  { readonly type: 'ManualSupply'; readonly sourceId: string; readonly targetId: string; readonly requested: FoodSupplyAmounts; readonly accepted: FoodSupplyAmounts; readonly unaccepted: FoodSupplyAmounts;
    readonly morale: { readonly before: number; readonly after: number; readonly numerator: string | null; readonly denominator: string | null; readonly roundingPolicy: FoodSupplyProfile['morale'] };
    readonly foodAvailabilityAfter: { readonly source: 'positive' | 'empty'; readonly target: 'positive' | 'empty' } }
);
export type FoodSupplyEntry = { readonly command: FoodSupplyCommand; readonly receipt: FoodSupplyReceipt };
export type FoodSupplySession = { readonly initialState: FoodSupplyState; readonly currentState: FoodSupplyState; readonly entries: readonly FoodSupplyEntry[] };
export type FoodSupplyFailure = { readonly ok: false; readonly reason: FoodSupplyFailureReason; readonly ledger: readonly []; readonly state: FoodSupplyState | null; readonly session: FoodSupplySession | null; readonly entries: readonly [] };
export type FoodSupplySessionResult = { readonly ok: true; readonly state: FoodSupplyState; readonly session: FoodSupplySession } | FoodSupplyFailure;
export type FoodSupplyPreviewResult = { readonly ok: true; readonly proposedState: FoodSupplyState; readonly receipt: FoodSupplyReceipt } | FoodSupplyFailure;
export type FoodSupplyExecuteResult = { readonly ok: true; readonly state: FoodSupplyState; readonly session: FoodSupplySession; readonly receipt: FoodSupplyReceipt } | FoodSupplyFailure;
export type FoodSupplySaveResult = { readonly ok: true; readonly json: string } | FoodSupplyFailure;
function failure(e: unknown, state: FoodSupplyState | null = null, session: FoodSupplySession | null = null): FoodSupplyFailure {
  let reason: FoodSupplyFailureReason = 'invalid-input';
  try { if (!isProxy(e) && e instanceof Rejected) reason = e.reason; } catch { /* A thrown hostile object must not escape. */ }
  return freeze({ ok: false, reason, ledger: [], state, session, entries: [] });
}
function profile(v: unknown): FoodSupplyProfile {
  if (!equal(v, DETACHED_FOOD_SUPPLY_PROFILE) && !equal(v, DETACHED_FOOD_SUPPLY_HALF_UP_PROFILE)) reject('unsupported-profile');
  return v as FoodSupplyProfile;
}
function stocks(v: unknown): void { const s = record(v, ['troops', 'money', 'food', 'equipment']); uint(s.troops); uint(s.money); uint(s.food); const e = arr(s.equipment, 12); if (e.length !== 12) reject(); e.forEach(x => uint(x)); }
function state(v: unknown): FoodSupplyState {
  const s = record(v, ['schemaVersion', 'scope', 'profile', 'revision', 'turn', 'accounts']);
  if (s.schemaVersion !== 1 || s.scope !== 'detached-food-supply-accounts') reject('unsupported-schema');
  profile(s.profile); uint(s.revision); uint(s.turn); const accounts = arr(s.accounts); if (!accounts.length) reject(); const ids = new Set<string>();
  for (const x of accounts) {
    const a = record(x, ['kind', 'id', 'ownerId', 'classification', 'equipmentId', 'troops', 'money', 'food', 'morale', 'equipment', 'capacity']);
    if (a.kind !== 'detached-resource-account') reject(); const key = id(a.id); if (key === 'food-consumed-sink' || ids.has(key)) reject(); ids.add(key); id(a.ownerId);
    const cls = oneOf(a.classification, ['combat', 'transport', 'city', 'port', 'gate']); uint(a.morale, 255);
    stocks({ troops: a.troops, money: a.money, food: a.food, equipment: a.equipment }); stocks(a.capacity);
    const account = a as unknown as FoodSupplyAccount;
    for (const k of ['troops', 'money', 'food'] as const) if (account[k] > account.capacity[k]) reject();
    for (let i = 0; i < 12; i++) if (account.equipment[i]! > account.capacity.equipment[i]!) reject();
    if (cls === 'combat') {
      const eq = uint(a.equipmentId, 11); if (account.capacity.troops > 60000 || account.capacity.money !== 10000 || account.capacity.food !== 50000) reject();
      if (eq >= 1 && eq <= 4 && (account.equipment[eq] !== account.troops || account.capacity.equipment[eq]! < account.capacity.troops)) reject();
    } else {
      if (a.equipmentId !== null) reject();
      if (cls === 'transport' && (account.capacity.troops !== 60000 || account.capacity.money !== 100000 || account.capacity.food !== 500000)) reject();
    }
  }
  (accounts as unknown as Mutable<FoodSupplyAccount>[]).sort((a, b) => cmp(a.id, b.id)); return s as unknown as FoodSupplyState;
}
function command(v: unknown, before: FoodSupplyState): FoodSupplyCommand {
  if (!v || typeof v !== 'object' || Array.isArray(v)) reject(); const c = v as Record<string, unknown>;
  if (c.type !== 'ConsumeTurn' && c.type !== 'ManualSupply') reject('unsupported-command');
  record(c, ['type', 'commandId', 'expectedRevision', ...(c.type === 'ConsumeTurn' ? ['turn', 'contexts'] : ['sourceId', 'targetId', 'relation', 'requested'])]); id(c.commandId); uint(c.expectedRevision);
  if (c.type === 'ConsumeTurn') {
    uint(c.turn); const contexts = arr(c.contexts); if (contexts.length !== before.accounts.length) reject(); const seen = new Set<string>(), accounts = new Map(before.accounts.map(a => [a.id, a]));
    for (const x of contexts) {
      const t = record(x, ['accountId', 'onFire', 'politics', 'hasTuntian', 'coverage']), key = id(t.accountId), a = accounts.get(key);
      if (!a || seen.has(key)) reject(); seen.add(key); bool(t.onFire); bool(t.hasTuntian);
      const field = a.classification === 'combat' || a.classification === 'transport'; if (t.politics !== null || field) uint(t.politics, 100);
      const coverage = record(t.coverage, ['candidates', 'selectedId']), candidates = arr(coverage.candidates); const ids = new Set<string>();
      for (const y of candidates) { const candidate = record(y, ['id', 'type', 'ownerId']); const candidateId = id(candidate.id); if (ids.has(candidateId)) reject(); ids.add(candidateId); oneOf(candidate.type, ['camp', 'fort', 'fortress']); if (id(candidate.ownerId) !== a.ownerId) reject(); }
      if (!field && candidates.length) reject();
      if (candidates.length ? !ids.has(id(coverage.selectedId)) : coverage.selectedId !== null) reject();
      (candidates as Mutable<FoodSupplyContext>['coverage']['candidates']).sort((a, b) => cmp(a.id, b.id));
    }
    (contexts as Mutable<FoodSupplyContext>[]).sort((a, b) => cmp(a.accountId, b.accountId));
  } else {
    id(c.sourceId); id(c.targetId); const rel = record(c.relation, ['kind', 'sourceId', 'targetId']); oneOf(rel.kind, ['supplied-adjacent']); id(rel.sourceId); id(rel.targetId);
    const requested = record(c.requested, ['troops', 'money', 'food']); Object.values(requested).forEach(x => uint(x));
  }
  return c as unknown as FoodSupplyCommand;
}

type Rational = readonly [bigint, bigint];
function rational(n: bigint, d = 1n): Rational { let a = n, b = d; while (b) { const r = a % b; a = b; b = r; } return [n / a, d / a]; }
function mul(a: Rational, b: Rational): Rational { return rational(a[0] * b[0], a[1] * b[1]); }
function add(a: Rational, b: Rational): Rational { return rational(a[0] * b[1] + b[0] * a[1], a[1] * b[1]); }
function raw(a: Rational): string { return `${a[0]}/${a[1]}`; }
function bits(v: number): Rational { const significand = BigInt((v & 0x7fffff) | 0x800000), exponent = ((v >>> 23) & 255) - 150; return exponent >= 0 ? rational(significand << BigInt(exponent)) : rational(significand, 1n << BigInt(-exponent)); }
const SCALE = bits(0x3d4ccccd);
const MULTIPLIERS = { none: bits(0x40000000), camp: bits(0x3fd55555), fort: bits(0x3faaaaab), fortress: bits(0x3f800000) };
function asNumber(v: bigint): number { if (v < 0n || v > BigInt(MAX)) reject('out-of-range'); return Number(v); }
function availability(food: number): 'positive' | 'empty' { return food > 0 ? 'positive' : 'empty'; }
function consume(a: Mutable<FoodSupplyAccount>, context: FoodSupplyContext, ledger: FoodSupplyLedgerRow[]): FoodSupplyConsumption {
  const selected = context.coverage.candidates.find(x => x.id === context.coverage.selectedId);
  const coverage: FoodSupplyConsumption['coverage'] = { selectedId: context.coverage.selectedId, applied: a.classification === 'transport' ? 'ignored-for-transport' : a.classification === 'combat' ? selected?.type ?? 'none' : 'not-applicable' };
  const foodBefore = a.food;
  const base = { accountId: a.id, foodBefore, foodAfter: foodBefore, normalRaw: null, fireRaw: null, combinedRaw: null, debited: 0, exhaustedNow: false, foodAvailabilityAfter: availability(foodBefore), coverage };
  if (foodBefore === 0) return { ...base, requestCost: null, shortfall: null, status: 'already-empty-skipped' };
  if ((a.classification === 'port' || a.classification === 'gate') && context.hasTuntian) return { ...base, requestCost: 0, shortfall: 0, status: 'tuntian-exempt' };
  const normal = a.classification === 'combat' ? mul(mul(rational(BigInt(a.troops)), MULTIPLIERS[selected?.type ?? 'none']), SCALE)
    : a.classification === 'transport' ? mul(rational(BigInt(a.troops)), SCALE) : rational(BigInt(a.troops), 40n);
  const fire = context.onFire ? rational(BigInt(foodBefore) * (600n - 5n * BigInt(context.politics ?? 0)), 10000n) : rational(0n);
  const combined = add(normal, fire), truncated = combined[0] / combined[1];
  const requestCost = asNumber(a.troops > 0 && truncated < 1n ? 1n : truncated), debited = Math.min(foodBefore, requestCost), shortfall = requestCost - debited;
  a.food -= debited; if (debited > 0) ledger.push({ resource: 'food', from: a.id, to: 'food-consumed-sink', amount: debited });
  return { ...base, foodAfter: a.food, normalRaw: raw(normal), fireRaw: raw(fire), combinedRaw: raw(combined), requestCost, debited, shortfall,
    status: shortfall > 0 ? 'insufficient' : 'consumed', exhaustedNow: foodBefore > 0 && a.food === 0, foodAvailabilityAfter: availability(a.food) };
}
function resourceValue(a: FoodSupplyAccount, r: FoodSupplyResource): number { return r.startsWith('equipment:') ? a.equipment[Number(r.slice(10))]! : a[r as keyof FoodSupplyAmounts]; }
/** Check every account/resource delta, including inert equipment slots, before commit. */
function verifyLedger(before: FoodSupplyState, after: FoodSupplyState, receipt: FoodSupplyReceipt): void {
  state(after); const resources: FoodSupplyResource[] = ['food', 'money', 'troops', ...Array.from({ length: 12 }, (_, i) => `equipment:${i}` as const)];
  const deltas = new Map<string, Map<FoodSupplyResource, bigint>>(before.accounts.map(a => [a.id, new Map(resources.map(r => [r, 0n]))]));
  for (const row of receipt.ledger) {
    if (uint(row.amount) === 0 || !resources.includes(row.resource) || !deltas.has(row.from)) reject();
    const from = deltas.get(row.from)!; from.set(row.resource, from.get(row.resource)! - BigInt(row.amount));
    if (receipt.type === 'ConsumeTurn') { if (row.resource !== 'food' || row.to !== 'food-consumed-sink') reject(); }
    else { const to = deltas.get(row.to); if (!to || row.from !== receipt.sourceId || row.to !== receipt.targetId) reject(); to.set(row.resource, to.get(row.resource)! + BigInt(row.amount)); }
  }
  if (before.accounts.length !== after.accounts.length) reject();
  for (let i = 0; i < before.accounts.length; i++) {
    const a = before.accounts[i]!, b = after.accounts[i]!;
    for (const key of ['id', 'kind', 'ownerId', 'classification', 'equipmentId', 'capacity'] as const) if (!equal(a[key], b[key])) reject();
    if ((receipt.type === 'ConsumeTurn' || a.id !== receipt.targetId) && a.morale !== b.morale) reject();
    for (const r of resources) if (BigInt(resourceValue(b, r)) - BigInt(resourceValue(a, r)) !== deltas.get(a.id)!.get(r)) reject();
  }
}
function reduce(before: FoodSupplyState, cmd: FoodSupplyCommand, used: ReadonlySet<string>): { state: FoodSupplyState; receipt: FoodSupplyReceipt } {
  if (used.has(cmd.commandId)) reject('duplicate-command');
  if (cmd.expectedRevision !== before.revision) reject('stale-revision');
  if (before.revision === MAX) reject('out-of-range');
  const after = clone(before), ledger: FoodSupplyLedgerRow[] = [];
  const shared = { commandId: cmd.commandId, revisionBefore: before.revision, revisionAfter: before.revision + 1, turnBefore: before.turn, turnAfter: before.turn, effectiveProfile: before.profile, ledger };
  let receipt: FoodSupplyReceipt;
  if (cmd.type === 'ConsumeTurn') {
    if (before.turn === MAX) reject('out-of-range'); if (cmd.turn !== before.turn + 1) reject('invalid-turn');
    const consumptions = after.accounts.map((a, i) => consume(a, cmd.contexts[i]!, ledger)); after.turn = cmd.turn;
    receipt = { ...shared, type: 'ConsumeTurn', turnAfter: after.turn, consumptions };
  } else {
    const source = after.accounts.find(a => a.id === cmd.sourceId), target = after.accounts.find(a => a.id === cmd.targetId);
    if (!source || !target || source === target || source.classification !== 'transport' || target.classification !== 'combat' || source.ownerId !== target.ownerId || cmd.relation.sourceId !== source.id || cmd.relation.targetId !== target.id) reject('ineligible-transfer');
    const equipment = target.equipmentId!, matching = equipment >= 1 && equipment <= 4;
    const accepted: Mutable<FoodSupplyAmounts> = { troops: 0, money: 0, food: 0 }, unaccepted: Mutable<FoodSupplyAmounts> = { troops: 0, money: 0, food: 0 };
    for (const r of ['troops', 'money', 'food'] as const) { accepted[r] = Math.min(cmd.requested[r], target.capacity[r] - target[r], source[r]); }
    if (matching) accepted.troops = Math.min(accepted.troops, source.equipment[equipment]!);
    const moraleBefore = target.morale; let numerator: bigint | null = null, denominator: bigint | null = null;
    if (accepted.troops > 0) {
      numerator = BigInt(target.troops) * BigInt(target.morale) + BigInt(accepted.troops) * BigInt(source.morale); denominator = BigInt(target.troops) + BigInt(accepted.troops);
      target.morale = asNumber(before.profile.morale === 'weighted-floor-v1' ? numerator / denominator : (2n * numerator + denominator) / (2n * denominator));
    }
    for (const r of ['troops', 'money', 'food'] as const) {
      const amount = accepted[r]; unaccepted[r] = cmd.requested[r] - amount; source[r] -= amount; target[r] += amount;
      if (amount > 0) ledger.push({ resource: r, from: source.id, to: target.id, amount });
    }
    if (matching && accepted.troops > 0) {
      source.equipment[equipment]! -= accepted.troops; target.equipment[equipment]! += accepted.troops;
      ledger.push({ resource: `equipment:${equipment}`, from: source.id, to: target.id, amount: accepted.troops });
    }
    receipt = { ...shared, type: 'ManualSupply', sourceId: source.id, targetId: target.id, requested: cmd.requested, accepted, unaccepted,
      morale: { before: moraleBefore, after: target.morale, numerator: numerator === null ? null : String(numerator), denominator: denominator === null ? null : String(denominator), roundingPolicy: before.profile.morale },
      foodAvailabilityAfter: { source: availability(source.food), target: availability(target.food) } };
  }
  after.revision++; ledger.sort((a, b) => cmp(a.resource, b.resource) || cmp(a.from, b.from) || cmp(a.to, b.to)); verifyLedger(before, after, receipt);
  return { state: after, receipt };
}
function replay(initialState: FoodSupplyState, commands: readonly unknown[]): FoodSupplySession {
  let currentState = initialState; const entries: FoodSupplyEntry[] = [], used = new Set<string>();
  for (const value of commands) { const cmd = command(value, currentState), r = reduce(currentState, cmd, used); entries.push({ command: cmd, receipt: r.receipt }); used.add(cmd.commandId); currentState = r.state; }
  return { initialState, currentState, entries };
}
function session(v: unknown): FoodSupplySession {
  const s = record(v, ['initialState', 'currentState', 'entries']), initial = state(s.initialState), current = state(s.currentState), entries = arr(s.entries);
  if (!equal(initial.profile, current.profile)) reject('profile-mismatch');
  const commands = entries.map(x => record(x, ['command', 'receipt']).command), calculated = replay(initial, commands);
  if (!equal(calculated.currentState, current) || !equal(calculated.entries, entries)) reject('replay-mismatch'); return calculated;
}
function checkEnvelope(s: FoodSupplySession): void { detach({ schema: 'san11.detached-food-supply.save', version: 1, profile: s.initialState.profile, ...s }); }
function propose(s: FoodSupplySession, cmd: FoodSupplyCommand): { state: FoodSupplyState; receipt: FoodSupplyReceipt; session: FoodSupplySession } {
  const r = reduce(s.currentState, cmd, new Set(s.entries.map(e => e.command.commandId)));
  if (s.entries.length >= MAX_ITEMS) reject('out-of-range');
  const next = { initialState: s.initialState, currentState: r.state, entries: [...s.entries, { command: cmd, receipt: r.receipt }] };
  checkEnvelope(next); return { ...r, session: next };
}
/** Creates a new independent session with a fixed complete profile. */
export function createFoodSupplySession(input: unknown): FoodSupplySessionResult {
  try { const initialState = state(detach(input)), s = { initialState, currentState: clone(initialState), entries: [] }; checkEnvelope(s); return freeze({ ok: true, state: s.currentState, session: s }); } catch (e) { return failure(e); }
}
/** Validates the complete session and command; never appends an entry. */
export function previewFoodSupply(input: unknown, request: unknown): FoodSupplyPreviewResult {
  let s: FoodSupplySession | null = null;
  try { s = session(detach(input)); const cmd = command(detach(request), s.currentState), r = propose(s, cmd); return freeze({ ok: true, proposedState: r.state, receipt: r.receipt }); }
  catch (e) { return failure(e, s?.currentState ?? null, s); }
}
/** Recomputes from validated inputs; a preview is never an authorization or trusted result. */
export function executeFoodSupply(input: unknown, request: unknown): FoodSupplyExecuteResult {
  let s: FoodSupplySession | null = null;
  try {
    s = session(detach(input)); const cmd = command(detach(request), s.currentState), r = propose(s, cmd);
    return freeze({ ok: true, state: r.state, session: r.session, receipt: r.receipt });
  } catch (e) { return failure(e, s?.currentState ?? null, s); }
}
/** Entire replay is atomic. expectedProfile is mandatory and cannot reinterpret a trace. */
export function replayFoodSupply(initialInput: unknown, commandInputs: unknown, expectedProfile: unknown): FoodSupplySessionResult {
  let initial: FoodSupplyState | null = null;
  try {
    initial = state(detach(initialInput)); const expected = profile(detach(expectedProfile)); if (!equal(initial.profile, expected)) reject('profile-mismatch');
    const commands = arr(detach(commandInputs)), s = replay(initial, commands); checkEnvelope(s); return freeze({ ok: true, state: s.currentState, session: s });
  } catch (e) { return failure(e, initial); }
}
/** Canonical JSON with full commands/receipts and duplicate-command history. */
export function saveFoodSupply(input: unknown): FoodSupplySaveResult {
  try { const s = session(detach(input)), envelope = { schema: 'san11.detached-food-supply.save', version: 1, profile: s.initialState.profile, ...s }; const json = canonical(envelope); if (bytes(json) > MAX_BYTES) reject('out-of-range'); return freeze({ ok: true, json }); } catch (e) { return failure(e); }
}
/** Minimal bounded JSON parser preserving duplicate-key detection, including escaped spellings. */
function parse(input: unknown): unknown {
  if (typeof input !== 'string' || input.length > MAX_BYTES || bytes(input) > MAX_BYTES) reject('invalid-json'); const text = input; let i = 0;
  const bad = (): never => reject('invalid-json');
  const ws = (): void => { while (i < text.length && /[\x20\t\r\n]/.test(text[i]!)) i++; };
  function string(): string {
    const start = i++; while (i < text.length) { const c = text[i++]!; if (c === '"') { try { return JSON.parse(text.slice(start, i)) as string; } catch { bad(); } } if (c === '\\') i++; } return bad();
  }
  function value(depth: number): unknown {
    if (depth > 64) bad(); ws(); const c = text[i];
    if (c === '"') return string();
    if (c === '{') {
      i++; ws(); const out: Record<string, unknown> = {}, keys = new Set<string>(); if (text[i] === '}') { i++; return out; }
      while (true) { ws(); if (text[i] !== '"') bad(); const key = string(); if (keys.has(key)) bad(); keys.add(key); ws(); if (text[i++] !== ':') bad(); Object.defineProperty(out, key, { value: value(depth + 1), enumerable: true, writable: true, configurable: true }); ws(); const end = text[i++]; if (end === '}') return out; if (end !== ',') bad(); }
    }
    if (c === '[') {
      i++; ws(); const out: unknown[] = []; if (text[i] === ']') { i++; return out; }
      while (true) { if (out.length >= MAX_ITEMS) bad(); out.push(value(depth + 1)); ws(); const end = text[i++]; if (end === ']') return out; if (end !== ',') bad(); }
    }
    for (const [token, result] of [['true', true], ['false', false], ['null', null]] as const) if (text.startsWith(token, i)) { i += token.length; return result; }
    const match = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/.exec(text.slice(i)); if (!match) return bad(); i += match[0].length; return Number(match[0]);
  }
  const result = value(0); ws(); if (i !== text.length) bad(); return result;
}
/** Replays every command and compares every receipt and the final state; no cached result is trusted. */
export function loadFoodSupply(text: unknown): FoodSupplySessionResult {
  try {
    const parsed = detach(parse(text)); if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) reject('unsupported-schema'); const r = parsed as Record<string, unknown>;
    if (r.schema !== 'san11.detached-food-supply.save' || r.version !== 1) reject('unsupported-schema'); record(r, ['schema', 'version', 'profile', 'initialState', 'currentState', 'entries']);
    const expected = profile(r.profile), s = session({ initialState: r.initialState, currentState: r.currentState, entries: r.entries }); if (!equal(expected, s.initialState.profile)) reject('profile-mismatch'); return freeze({ ok: true, state: s.currentState, session: s });
  } catch (e) { return failure(e); }
}
