/**
 * Provisional standalone city service using explicit, versioned service policies.
 * Reservations never read or write native personnel tasks. Scalar source evidence
 * does not certify native writers, scheduling, effective attributes or stock data.
 * Public contract and source boundaries: docs/rules/city-command-lifecycle.md.
 */
import { calculatePatrolSecurityGain } from './patrol-security-gain.ts';
import { calculateRecruitmentQuantityProjection } from './recruitment-quantity.ts';
import type { RecruitmentQuantityCapture, RecruitmentQuantityFactorBits } from './recruitment-quantity.ts';
import { calculateRecruitmentSecurityArgument } from './recruitment-security-argument.ts';
import { calculateProductionPrice } from './production-price.ts';
import { calculateProductionQuantity } from './production-quantity.ts';
import type { ProductionQuantitySlot } from './production-quantity.ts';
import { calculateProductionTimeProjection } from './production-time.ts';
import type { ProductionTimeCapture } from './production-time.ts';

type Frozen<T> = T extends object ? { readonly [K in keyof T]: Frozen<T[K]> } : T;
type Json = null | boolean | number | string | Json[] | { [key: string]: Json };
type Stat = 'leadership' | 'charm' | 'intelligence' | 'politics' | 'war';
type Equipment = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 10 | 11;
type FacilityKind = 'barracks' | 'forge' | 'stable' | 'workshop' | 'shipyard';
type DateV1 = { year: number; month: number; day: 1 | 11 | 21 };
type Policy = { id: string; version: 1; parameters: { [key: string]: string | number | boolean | string[] } };
type Policies = Record<'attributes' | 'facilityMultiplier' | 'writer' | 'morale' | 'time' | 'productionAp' | 'rewards' | 'zeroYield' | 'reservations' | 'turn' | 'apRecovery' | 'presentation', Policy>;
type Officer = { id: string; forceId: string; cityId: string; available: boolean; leadership: number; charm: number; intelligence: number; skillIds: number[]; xp: Record<Stat, number>; merit: number; actedTurn: number | null; reservationJobId: string | null };
type Facility = { id: string; cityId: string; kind: FacilityKind; level: 1 | 2 | 3; complete: boolean; usedTurn: number | null; reservationJobId: string | null };
type Inventory = Record<Equipment, { quantity: number; capacity: number; reserved: number }>;
type City = { id: string; kind: 'city'; gold: number; security: number; troops: number; troopCapacity: number; morale: number; moraleCap: number; patrolUsedTurn: number | null; drillGroundComplete: boolean; inventory: Inventory };
type Catalog = { id: string; version: 1; entries: Record<Equipment, { basePriceWord: number }> };
type Scenario = { profile: 'city-command-lifecycle-v1'; date: DateV1; turn: number; activeForceId: string; corps: { id: string; actionPoints: number }; city: Omit<City, 'inventory'> & { inventory: Record<Equipment, { quantity: number; capacity: number }> }; officers: Officer[]; facilities: Facility[]; catalog: Catalog; unlockedEquipmentTypes: Equipment[]; specialtyEquipmentTypes: Equipment[]; pressureActive: boolean; difficulty: 'normal' | 'super'; controller: 'player' | 'ai'; policies: Policies };
type Command = { type: 'Patrol'; cityId: string; officerIds: string[] } | { type: 'Recruit'; cityId: string; officerIds: string[]; facilityId: string } | { type: 'Produce'; cityId: string; officerIds: string[]; facilityId: string; equipmentType: Equipment } | { type: 'AdvanceCityTurn' };
type Envelope = { id: string; expectedRevision: number; command: Command };
type Write = { before: number; requested: number; returned: number; actualDelta: number; after: number; cap: number; discarded: number; policyId: string };
type Reward = { officerId: string; attribute: Stat; xp: Write; merit: Write };
type Fees = { gold: Write; actionPoints: Write; sourceApRequest: number; effectiveApCost: number };
type Calculation = {
  observationKind: 'derived-adapter-observations'; selectedOfficerIds: string[];
  securityKernelReturn: number | null; quantityKernelReturn: number | null; quantityPreCapacity: number | null;
  priceKernelReturn: number | null; timeKernelReturn: number | null; facilityApplied: boolean;
  earlyCharmSum: number | null; moraleSecuritySnapshot: number | null; newRecruitMorale: number | null;
  securityWrite: Write | null; troopWrite: Write | null; inventoryWrite: Write | null; moraleWrite: Write | null;
  kernels: { api: string; input: unknown; output: unknown }[];
};
type Completion = { jobId: string; turn: number; inventoryWrite: Write; rewards: Reward[] };
type Receipt = { commandId: string; revision: number; turn: number; taskKind: 'instant' | 'production-start' | 'turn-boundary'; calculation: Calculation; fees: Fees; rewards: Reward[]; newJobId: string | null; completions: Completion[]; apRecovery: Write | null; events: { type: string; subjectId: string }[]; sideEffectsNotModeled: string[]; rngDraws: 0 };
type StartSnapshot = { envelope: Envelope; turn: number; date: DateV1; officers: Officer[]; facility: Facility; catalog: Catalog; policies: Policies; citySecurity: number; drillGroundComplete: boolean; specialtyEquipmentTypes: Equipment[]; difficulty: 'normal' | 'super'; controller: 'player' | 'ai' };
type Job = { id: string; status: 'active' | 'completed'; cityId: string; facilityId: string; officerIds: string[]; equipmentType: Equipment; startTurn: number; remainingTurns: number; dueTurn: number; durationTurns: number; reservedQuantity: 1; startSnapshot: StartSnapshot; calculation: Calculation; fees: Fees; completedTurn: number | null; completion: Completion | null };
type Applied = { envelope: Envelope; envelopeDigest: string; committedRevision: number; receipt: Receipt };
type State = Omit<Scenario, 'city'> & { schemaVersion: 1; scope: 'standalone-city-command-lifecycle'; revision: number; city: City; initialScenario: Scenario; policyDigest: string; catalogDigest: string; productionJobs: Job[]; appliedCommands: Applied[] };
type Failure = { ok: false; reason: string };
type Outcome = { ok: true; state: State; receipt: Receipt; duplicate: boolean } | Failure;
export type CityScenarioV1 = Frozen<Scenario>;
export type CityStateV1 = Frozen<State>;
export type CityCommandV1 = Frozen<Command>;
export type CityCommandEnvelopeV1 = Frozen<Envelope>;
export type CityCommandPoliciesV1 = Frozen<Policies>;
export type CityCommandPolicyV1 = Frozen<Policy>;
export type CityCommandReceiptV1 = Frozen<Receipt>;
export type CityCommandWriteV1 = Frozen<Write>;
export type CityProductionJobV1 = Frozen<Job>;
export type CityCommandFailure = Frozen<Failure>;
export type CityCommandResultV1 = Frozen<Outcome>;
export type CityCommandPreviewV1 = Frozen<{ ok: true; receipt: Receipt; duplicate: boolean; baseRevision: number } | Failure>;
export type CityCommandSaveResultV1 = Frozen<{ ok: true; serialized: string } | Failure>;
type TraceStep = { envelope: Envelope; expected: { ok: true; duplicate: boolean; receipt: Receipt } | Failure | null };
type Trace = { tag: 'san11-city-command-trace-v1'; initialScenario: Scenario; steps: TraceStep[]; expectedFinalDigest: string | null };
export type CityCommandTraceV1 = Frozen<Trace>;
export type CityCommandReplayResultV1 = Frozen<{ ok: true; state: State; outcomes: ({ ok: true; duplicate: boolean; receipt: Receipt } | Failure)[] } | { ok: false; reason: string; index: number; state: State | null }>;

const EQUIPMENT: Equipment[] = [1, 2, 3, 4, 5, 6, 7, 8, 10, 11];
const STATS: Stat[] = ['leadership', 'charm', 'intelligence', 'politics', 'war'];
const MAX_RECORDS = 4096, MAX_VALUE = 1_000_000_000, MAX_BYTES = 64 * 1024 * 1024;
const NOT_MODELED = ['technique-points', 'native-stat-growth', 'native-writer-semantics', 'native-personnel-tasks', 'native-corps-effects', 'presentation-rng'];
class Invalid extends Error { readonly reason: string; constructor(reason = 'invalid-input') { super(reason); this.reason = reason; } }
function fail(reason = 'invalid-input'): never { throw new Invalid(reason); }
function freeze<T>(v: T): Frozen<T> { if (v !== null && typeof v === 'object' && !Object.isFrozen(v)) { for (const x of Object.values(v)) freeze(x); Object.freeze(v); } return v as Frozen<T>; }
const runtime = globalThis as { process?: { getBuiltinModule?: (id: string) => { types: { isProxy(v: unknown): boolean } } } };
const isProxy = typeof runtime.process?.getBuiltinModule === 'function' ? runtime.process.getBuiltinModule('node:util').types.isProxy : (() => false);
function error(e: unknown, fallback = 'invalid-input'): Failure { return { ok: false, reason: !isProxy(e) && e instanceof Invalid ? e.reason : fallback }; }
function canonical(v: unknown): string { if (v === null || typeof v !== 'object') return JSON.stringify(v); if (Array.isArray(v)) return '[' + v.map(canonical).join(',') + ']'; const r = v as Record<string, unknown>; return '{' + Object.keys(r).sort().map(k => JSON.stringify(k) + ':' + canonical(r[k])).join(',') + '}'; }
function same(a: unknown, b: unknown): boolean { return canonical(a) === canonical(b); }
function copy<T>(v: T): T { return JSON.parse(JSON.stringify(v)) as T; }
/** Data-only snapshot before any schema read, including nested getters. */
function detach(v: unknown): unknown {
  let nodes = 0, size = 0; const active = new Set<object>();
  function visit(x: unknown, depth: number): unknown {
    if (++nodes > 2_000_000 || depth > 64) fail();
    if (x === null || typeof x === 'boolean') return x;
    if (typeof x === 'string') { size += x.length; if (size > MAX_BYTES) fail(); return x; }
    if (typeof x === 'number') { if (!Number.isSafeInteger(x) || Object.is(x, -0)) fail(); return x; }
    if (typeof x !== 'object' || isProxy(x) || active.has(x)) fail();
    const arr = Array.isArray(x), proto = Object.getPrototypeOf(x);
    if (proto !== (arr ? Array.prototype : Object.prototype) && !(proto === null && !arr)) fail();
    const ds = Object.getOwnPropertyDescriptors(x), keys = Reflect.ownKeys(ds);
    if (keys.some(k => typeof k !== 'string' || !Object.hasOwn(ds[k]!, 'value') || (!ds[k]!.enumerable && !(arr && k === 'length')))) fail();
    active.add(x);
    try {
      if (arr) { const n = ds.length!.value as number; if (n > MAX_RECORDS || keys.length !== n + 1) fail(); const result: unknown[] = []; for (let i = 0; i < n; i++) { const d = ds[String(i)]; if (!d) fail(); result.push(visit(d.value, depth + 1)); } return result; }
      const result: Record<string, unknown> = {};
      for (const k of keys as string[]) Object.defineProperty(result, k, { value: visit(ds[k]!.value, depth + 1), enumerable: true, configurable: true, writable: true });
      return result;
    } finally { active.delete(x); }
  }
  return visit(v, 0);
}
function obj(v: unknown, keys: readonly string[], reason = 'invalid-input'): Record<string, unknown> { if (!v || typeof v !== 'object' || Array.isArray(v)) fail(reason); const r = v as Record<string, unknown>; if (Object.keys(r).some(k => !keys.includes(k))) fail(reason === 'invalid-input' ? 'unexpected-field' : reason); if (keys.some(k => !Object.hasOwn(r, k))) fail(reason); return r; }
function uint(v: unknown, max = Number.MAX_SAFE_INTEGER, min = 0): number { if (typeof v !== 'number' || !Number.isSafeInteger(v) || Object.is(v, -0) || v < min || v > max) fail('invalid-state'); return v; }
function id(v: unknown): string { if (typeof v !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(v)) fail(); return v; }
function bool(v: unknown): boolean { if (typeof v !== 'boolean') fail('invalid-state'); return v; }
function choice<T extends string>(v: unknown, values: readonly T[]): T { if (!values.includes(v as T)) fail('invalid-state'); return v as T; }
function arr(v: unknown, max: number): unknown[] { if (!Array.isArray(v) || v.length > max) fail('invalid-state'); return v; }
function marker(v: unknown, turn: number): void { if (v !== null) uint(v, turn); }
function unique<T>(a: T[], reason: string): void { if (new Set(a).size !== a.length) fail(reason); }
function stringCompare(a: string, b: string): number { return a < b ? -1 : a > b ? 1 : 0; }

const policy = (id: string, parameters: Policy['parameters']): Policy => ({ id, version: 1, parameters });
const REGISTRY: Record<keyof Policies, Policy[]> = {
  attributes: [policy('stable-effective-attributes-v1', { snapshot: 'command-start', xpChangesEffectiveAbility: false })],
  facilityMultiplier: [policy('guide-levels-f32-v1', { levelBits: ['3F800000', '3F99999A', '3FC00000'] }), policy('flat-one-f32-v1', { levelBits: ['3F800000', '3F800000', '3F800000'] })],
  writer: [policy('clip-and-return-actual-v1', { overflow: 'clip', returned: 'actual-delta' }), policy('reject-cap-overflow-v1', { overflow: 'reject', returned: 'actual-delta' }), policy('clip-and-return-request-v1', { overflow: 'clip', returned: 'requested' })],
  morale: [policy('weighted-floor-presecurity-min20-v1', { rounding: 'floor', security: 'before-write', minimum: 20 }), policy('weighted-ceil-presecurity-min20-v1', { rounding: 'ceil', security: 'before-write', minimum: 20 })],
  time: [policy('raw-turns-min1-v1', { nonpositive: 'minimum-one', unit: 'service-turn' }), policy('positive-raw-turns-v1', { nonpositive: 'reject', unit: 'service-turn' })],
  productionAp: [policy('production-request20-effective20-v1', { quantity: 20, piece: 20 }), policy('experimental-production-ap-v1', { quantity: 25, piece: 30 })],
  rewards: [policy('source-reward-compat-intelligence-v1', { patrol: 'leadership', recruit: 'charm', quantity: 'intelligence', piece: 'intelligence', instantXp: 2, instantMerit: 50, completionXp: 4, completionMerit: 100, cap: MAX_VALUE }), policy('listed-byte-quantity-politics-v1', { patrol: 'leadership', recruit: 'charm', quantity: 'politics', piece: 'intelligence', instantXp: 2, instantMerit: 50, completionXp: 4, completionMerit: 100, cap: MAX_VALUE })],
  zeroYield: [policy('pay-zero-yield-instant-v1', { zero: 'pay-and-reward' }), policy('reject-zero-yield-instant-v1', { zero: 'reject' })],
  reservations: [policy('reserve-piece-capacity-and-participants-v1', { quantity: 1, facility: true, participants: 'all-selected' })],
  turn: [policy('one-boundary-tick-complete-v1', { boundaries: 1, order: 'job-id-lexicographic', completionActors: 'acted-new-turn', completionFacility: 'available' })],
  apRecovery: [policy('fixed20-cap255-ap-recovery-v1', { increment: 20, cap: 255 }), policy('fixed0-cap255-ap-recovery-v1', { increment: 0, cap: 255 }), policy('fixed40-cap255-ap-recovery-v1', { increment: 40, cap: 255 })],
  presentation: [policy('no-presentation-rng-no-tp-v1', { rngDraws: 0, techniquePoints: 'not-modeled' })],
};
freeze(REGISTRY);
/** Complete accepted snapshots; an ID alone never selects hidden current parameters. */
export const CITY_COMMAND_POLICY_REGISTRY = REGISTRY as Frozen<typeof REGISTRY>;
/** Example default snapshot; callers still supply every policy in their scenario. */
export const CITY_COMMAND_DEFAULT_POLICIES: CityCommandPoliciesV1 = freeze(Object.fromEntries(Object.entries(REGISTRY).map(([k, v]) => [k, copy(v[0]!)])) as Policies);
function validatePolicies(v: unknown): Policies {
  const p = obj(v, Object.keys(REGISTRY), 'unsupported-policy');
  for (const name of Object.keys(REGISTRY) as (keyof Policies)[]) {
    const q = obj(p[name], ['id', 'version', 'parameters'], 'unsupported-policy');
    const registered = REGISTRY[name].find(r => r.id === q.id);
    if (!registered || !same(q, registered)) fail('unsupported-policy');
  }
  return p as unknown as Policies;
}
function validateScenario(v: unknown): Scenario {
  const s = obj(v, ['profile', 'date', 'turn', 'activeForceId', 'corps', 'city', 'officers', 'facilities', 'catalog', 'unlockedEquipmentTypes', 'specialtyEquipmentTypes', 'pressureActive', 'difficulty', 'controller', 'policies'], 'invalid-state');
  if (s.profile !== 'city-command-lifecycle-v1') fail('unsupported-profile');
  const turn = uint(s.turn); id(s.activeForceId);
  const d = obj(s.date, ['year', 'month', 'day'], 'invalid-state'); uint(d.year, 9999, 1); uint(d.month, 12, 1); if (![1, 11, 21].includes(d.day as number)) fail('invalid-state');
  const corps = obj(s.corps, ['id', 'actionPoints'], 'invalid-state'); id(corps.id); uint(corps.actionPoints, 255);
  const c = obj(s.city, ['id', 'kind', 'gold', 'security', 'troops', 'troopCapacity', 'morale', 'moraleCap', 'patrolUsedTurn', 'drillGroundComplete', 'inventory'], 'invalid-state'); id(c.id); if (c.kind !== 'city') fail('invalid-state');
  uint(c.gold, MAX_VALUE); uint(c.security, 100); uint(c.troops, uint(c.troopCapacity, 1_000_000)); uint(c.morale, uint(c.moraleCap, 255, 20)); marker(c.patrolUsedTurn, turn); bool(c.drillGroundComplete);
  const inventory = obj(c.inventory, EQUIPMENT.map(String), 'invalid-state');
  for (const t of EQUIPMENT) { const r = obj(inventory[t], ['quantity', 'capacity'], 'invalid-state'); uint(r.quantity, uint(r.capacity, 1_000_000)); }
  const officers = arr(s.officers, 256);
  for (const item of officers) {
    const o = obj(item, ['id', 'forceId', 'cityId', 'available', 'leadership', 'charm', 'intelligence', 'skillIds', 'xp', 'merit', 'actedTurn', 'reservationJobId'], 'invalid-state'); id(o.id); id(o.forceId); id(o.cityId); bool(o.available); uint(o.leadership, 255); uint(o.charm, 255); uint(o.intelligence, 255);
    const skills = arr(o.skillIds, 256).map(x => uint(x, 255)); unique(skills, 'duplicate-skill');
    const xp = obj(o.xp, STATS, 'invalid-state'); for (const stat of STATS) uint(xp[stat], MAX_VALUE); uint(o.merit, MAX_VALUE); marker(o.actedTurn, turn); if (o.reservationJobId !== null) fail('invalid-state');
  }
  unique(officers.map(x => (x as Officer).id), 'duplicate-officer');
  const facilities = arr(s.facilities, 30);
  for (const item of facilities) { const f = obj(item, ['id', 'cityId', 'kind', 'level', 'complete', 'usedTurn', 'reservationJobId'], 'invalid-state'); id(f.id); id(f.cityId); choice(f.kind, ['barracks', 'forge', 'stable', 'workshop', 'shipyard']); uint(f.level, 3, 1); bool(f.complete); marker(f.usedTurn, turn); if (f.reservationJobId !== null) fail('invalid-state'); }
  unique(facilities.map(x => (x as Facility).id), 'duplicate-facility');
  const catalog = obj(s.catalog, ['id', 'version', 'entries'], 'invalid-state'); id(catalog.id); if (catalog.version !== 1) fail('unsupported-catalog'); const entries = obj(catalog.entries, EQUIPMENT.map(String), 'invalid-state');
  for (const t of EQUIPMENT) uint(obj(entries[t], ['basePriceWord'], 'invalid-state').basePriceWord, 65535);
  for (const key of ['unlockedEquipmentTypes', 'specialtyEquipmentTypes']) { const types = arr(s[key], 10); if (types.some(x => !EQUIPMENT.includes(x as Equipment))) fail('unsupported-equipment'); unique(types, 'duplicate-equipment'); }
  bool(s.pressureActive); choice(s.difficulty, ['normal', 'super']); choice(s.controller, ['player', 'ai']); validatePolicies(s.policies);
  return s as unknown as Scenario;
}
function validateEnvelope(v: unknown): Envelope {
  const e = obj(v, ['id', 'expectedRevision', 'command']); id(e.id); uint(e.expectedRevision);
  if (!e.command || typeof e.command !== 'object' || Array.isArray(e.command)) fail();
  const type = (e.command as Record<string, unknown>).type;
  if (!['Patrol', 'Recruit', 'Produce', 'AdvanceCityTurn'].includes(type as string)) fail('unsupported-command');
  const keys = type === 'AdvanceCityTurn' ? ['type'] : type === 'Patrol' ? ['type', 'cityId', 'officerIds'] : type === 'Recruit' ? ['type', 'cityId', 'officerIds', 'facilityId'] : ['type', 'cityId', 'officerIds', 'facilityId', 'equipmentType'];
  const c = obj(e.command, keys);
  if (type !== 'AdvanceCityTurn') {
    id(c.cityId); if (!Array.isArray(c.officerIds) || c.officerIds.length < 1 || c.officerIds.length > 3) fail('invalid-officer-count');
    c.officerIds.forEach(id); unique(c.officerIds, 'duplicate-officer');
    if (type !== 'Patrol') id(c.facilityId);
    if (type === 'Produce' && !EQUIPMENT.includes(c.equipmentType as Equipment)) fail('unsupported-equipment');
  }
  return e as unknown as Envelope;
}

/** SHA-256 of canonical UTF-8 JSON; no dependency on a platform crypto registry. */
function digest(profile: unknown): string {
  const s = canonical(profile), bytes: number[] = [];
  for (const c of s) { const p = c.codePointAt(0)!; if (p < 128) bytes.push(p); else if (p < 2048) bytes.push(192 | (p >> 6), 128 | (p & 63)); else if (p < 65536) bytes.push(224 | (p >> 12), 128 | ((p >> 6) & 63), 128 | (p & 63)); else bytes.push(240 | (p >> 18), 128 | ((p >> 12) & 63), 128 | ((p >> 6) & 63), 128 | (p & 63)); }
  const length = bytes.length * 8; bytes.push(128); while (bytes.length % 64 !== 56) bytes.push(0); for (let i = 7; i >= 0; i--) bytes.push(Number((BigInt(length) >> BigInt(8 * i)) & 255n));
  const k = [0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
  const h = [0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19], rotate = (v: number, n: number) => (v >>> n) | (v << (32 - n));
  for (let offset = 0; offset < bytes.length; offset += 64) {
    const w: number[] = []; for (let i = 0; i < 16; i++) { const j = offset + i * 4; w.push(((bytes[j]! << 24) | (bytes[j + 1]! << 16) | (bytes[j + 2]! << 8) | bytes[j + 3]!) >>> 0); }
    for (let i = 16; i < 64; i++) { const a = w[i - 15]!, b = w[i - 2]!; w.push((w[i - 16]! + (rotate(a,7) ^ rotate(a,18) ^ (a >>> 3)) + w[i - 7]! + (rotate(b,17) ^ rotate(b,19) ^ (b >>> 10))) >>> 0); }
    let [a,b,c,d,e,f,g,z] = h as [number,number,number,number,number,number,number,number];
    for (let i = 0; i < 64; i++) { const t1 = (z + (rotate(e,6) ^ rotate(e,11) ^ rotate(e,25)) + ((e & f) ^ (~e & g)) + k[i]! + w[i]!) >>> 0; const t2 = ((rotate(a,2) ^ rotate(a,13) ^ rotate(a,22)) + ((a & b) ^ (a & c) ^ (b & c))) >>> 0; z=g;g=f;f=e;e=(d+t1)>>>0;d=c;c=b;b=a;a=(t1+t2)>>>0; }
    [a,b,c,d,e,f,g,z].forEach((v,i) => { h[i] = (h[i]! + v) >>> 0; });
  }
  return h.map(x => x.toString(16).padStart(8, '0')).join('');
}

const trusted = new WeakSet<object>();
function freezeState(state: State): CityStateV1 { const result = freeze(state); trusted.add(result); return result; }
function initialState(s: Scenario): State {
  const city = copy(s.city) as City; for (const t of EQUIPMENT) city.inventory[t].reserved = 0;
  return { ...copy(s), schemaVersion: 1, scope: 'standalone-city-command-lifecycle', revision: 0, city,
    initialScenario: copy(s), policyDigest: digest(s.policies), catalogDigest: digest(s.catalog), productionJobs: [], appliedCommands: [] };
}
/** All accumulators are service writers, not recovered native writer implementations. */
function write(before: number, requested: number, cap: number, p: Policy): Write {
  const raw = before + requested;
  if (p.parameters.overflow === 'reject' && requested !== 0 && (raw < 0 || raw > cap)) fail('writer-cap-overflow');
  const after = Math.max(0, Math.min(cap, raw)), actualDelta = after - before;
  const returned = p.parameters.returned === 'requested' ? requested : actualDelta;
  return { before, requested, returned, actualDelta, after, cap, discarded: requested - actualDelta, policyId: p.id };
}
const ACCUMULATE = policy('saturating-accumulator-v1', { overflow: 'clip', returned: 'actual-delta' });
const DEBIT = policy('exact-affordable-debit-v1', { overflow: 'reject', returned: 'actual-delta' });
function emptyCalculation(): Calculation { return { observationKind: 'derived-adapter-observations', selectedOfficerIds: [], securityKernelReturn: null, quantityKernelReturn: null, quantityPreCapacity: null, priceKernelReturn: null, timeKernelReturn: null, facilityApplied: false, earlyCharmSum: null, moraleSecuritySnapshot: null, newRecruitMorale: null, securityWrite: null, troopWrite: null, inventoryWrite: null, moraleWrite: null, kernels: [] }; }
function kernel<T extends { supported: boolean }>(calculation: Calculation, api: string, input: unknown, output: T): T & { supported: true } {
  if (!output.supported) fail('kernel-rejected');
  const retained = Object.fromEntries(Object.entries(output).filter(([k]) => k !== 'evidence'));
  calculation.kernels.push({ api, input: copy(input) as Json, output: copy(retained) as Json });
  return output as T & { supported: true };
}
function factor(s: State, f: Facility): RecruitmentQuantityFactorBits { return (s.policies.facilityMultiplier.parameters.levelBits as string[])[f.level - 1] as RecruitmentQuantityFactorBits; }
function recruit(s: State, people: Officer[], facility: Facility, calc: Calculation): number {
  const captures: RecruitmentQuantityCapture[] = ['005C3619', '005C3630', '005C3643', '005C364B'].map(callAddress => ({ callAddress, eax: 1 }));
  for (let i = 0; i < 3; i++) { const o = people[i]; captures.push({ callAddress: '005C367B', slotIndex: i, eax: o ? 1 : 0 }); if (o) captures.push({ callAddress: '005C3689', slotIndex: i, eax: o.charm }, { callAddress: '005C36AA', slotIndex: i, eax: o.skillIds.includes(79) ? 1 : 0 }); }
  const difficultyWord = s.difficulty === 'super' ? 2 : 0;
  if (difficultyWord === 2) captures.push({ callAddress: '005C3725', eax: s.controller === 'player' ? 1 : 0 });
  captures.push({ callAddress: '005C3738', eax: s.pressureActive ? 1 : 0 });
  // Query the existing kernel in a stable nonbinding capacity first, solely to select its observation branch.
  const probeInput = { profile: 'recruitment-quantity-observations-f32-v1' as const, captures: [...captures, { callAddress: '005C374E', eax: 0 }, { callAddress: '005C3757', eax: 1_000_000 }], savedSecurityByte: s.city.security, resolvedFacilityFactorBits: factor(s, facility), difficultyWord };
  const probe = calculateRecruitmentQuantityProjection(probeInput); if (!probe.supported) fail('kernel-rejected');
  captures.push({ callAddress: '005C374E', eax: s.city.troops }, { callAddress: '005C3757', eax: s.city.troopCapacity });
  if (s.city.troops + probe.returnedValue > s.city.troopCapacity) captures.push({ callAddress: '005C3764', eax: s.city.troops }, { callAddress: '005C376B', eax: s.city.troopCapacity });
  const input = { ...probeInput, captures };
  const result = kernel(calc, 'calculateRecruitmentQuantityProjection', input, calculateRecruitmentQuantityProjection(input));
  calc.quantityPreCapacity = result.afterPressureU32; calc.quantityKernelReturn = result.returnedValue;
  return result.returnedValue;
}
function production(s: State, people: Officer[], facility: Facility, t: Equipment, calc: Calculation): { price: number; quantity: number; duration: number } {
  const priceInput = { profile: 'production-price-resolved-v1' as const, savedBasePriceWord: s.catalog.entries[t].basePriceWord, specialtyHelperEax: s.specialtyEquipmentTypes.includes(t) ? 1 : 0 };
  const price = kernel(calc, 'calculateProductionPrice', priceInput, calculateProductionPrice(priceInput)).returnedPrice;
  calc.priceKernelReturn = price;
  const difficultyWord = s.difficulty === 'super' ? 2 : 0;
  const slots = [0, 1, 2].map(i => { const o = people[i]; return o ? { intelligenceGetterEax: o.intelligence, skillHelperEax: o.skillIds.includes(t === 4 ? 81 : 80) ? 1 : 0 } : null; }) as [ProductionQuantitySlot, ProductionQuantitySlot, ProductionQuantitySlot];
  const quantityInput = t >= 5 ? { profile: 'production-quantity-resolved-f32-v1' as const, nativeEquipmentType: t } : { profile: 'production-quantity-resolved-f32-v1' as const, nativeEquipmentType: t, slots, resolvedFacilityFactorBits: factor(s, facility), difficultyWord, ...(difficultyWord === 2 ? { cityVirtualEax: s.controller === 'player' ? 1 : 0 } : {}) };
  const quantity = kernel(calc, 'calculateProductionQuantity', quantityInput, calculateProductionQuantity(quantityInput)).returnedQuantity;
  calc.quantityKernelReturn = quantity; calc.quantityPreCapacity = quantity;
  if (t <= 4) return { price, quantity, duration: 0 };
  const captures: ProductionTimeCapture[] = [];
  for (let i = 0; i < 3; i++) { const o = people[i]; captures.push({ callAddress: '005C6CF8', slotIndex: i, eax: o ? 1 : 0 }); if (o) captures.push({ callAddress: '005C6D06', slotIndex: i, eax: o.intelligence }, { callAddress: '005C6D25', slotIndex: i, eax: o.skillIds.includes(t <= 8 ? 82 : 83) ? 1 : 0 }); }
  if (t >= 10) captures.push(...['005C6D90', '005C6DAA', '005C6DB0', '005C6DCA', '005C6DD1'].map(callAddress => ({ callAddress, eax: 1 })), { callAddress: '005C6DDE', eax: s.city.drillGroundComplete ? 1 : 0 });
  const timeInput = { profile: 'production-time-observations-v1' as const, nativeEquipmentType: t, captures };
  const time = kernel(calc, 'calculateProductionTimeProjection', timeInput, calculateProductionTimeProjection(timeInput));
  const raw = time.returnedValue; calc.timeKernelReturn = raw; calc.facilityApplied = time.facilityApplied;
  if (raw <= 0 && s.policies.time.parameters.nonpositive === 'reject') fail('unsupported-nonpositive-production-time');
  return { price, quantity, duration: Math.max(1, raw) };
}
function reward(people: Officer[], kind: 'patrol' | 'recruit' | 'quantity' | 'piece', p: Policy): Reward[] {
  const attribute = p.parameters[kind] as Stat;
  const xpRequested = p.parameters[kind === 'piece' ? 'completionXp' : 'instantXp'] as number;
  const meritRequested = p.parameters[kind === 'piece' ? 'completionMerit' : 'instantMerit'] as number;
  return people.map(o => { const xp = write(o.xp[attribute], xpRequested, p.parameters.cap as number, ACCUMULATE), merit = write(o.merit, meritRequested, p.parameters.cap as number, ACCUMULATE); o.xp[attribute] = xp.after; o.merit = merit.after; return { officerId: o.id, attribute, xp, merit }; });
}
function nextDate(d: DateV1): DateV1 {
  if (d.day === 1) return { ...d, day: 11 }; if (d.day === 11) return { ...d, day: 21 };
  if (d.month < 12) return { year: d.year, month: d.month + 1, day: 1 };
  if (d.year === 9999) fail('calendar-overflow'); return { year: d.year + 1, month: 1, day: 1 };
}
function mutableFork(s: State): State { return { ...s, date: { ...s.date }, corps: { ...s.corps }, city: copy(s.city), officers: copy(s.officers), facilities: copy(s.facilities), productionJobs: s.productionJobs.map(j => ({ ...j })), appliedCommands: [...s.appliedCommands] }; }
function advance(s: State, receipt: Receipt): void {
  s.date = nextDate(s.date); s.turn = uint(s.turn + 1); receipt.turn = s.turn;
  const p = s.policies.apRecovery, recovery = write(s.corps.actionPoints, p.parameters.increment as number, p.parameters.cap as number, ACCUMULATE);
  recovery.policyId = p.id; s.corps.actionPoints = recovery.after; receipt.apRecovery = recovery;
  // Only service reservations are released. No personnel task fields exist here.
  for (const job of [...s.productionJobs].sort((a, b) => stringCompare(a.id, b.id))) {
    if (job.status !== 'active') continue;
    job.remainingTurns--;
    if (job.remainingTurns > 0) continue;
    const stock = s.city.inventory[job.equipmentType];
    const inventoryWrite = write(stock.quantity, job.reservedQuantity, stock.capacity, s.policies.writer);
    if (inventoryWrite.actualDelta !== job.reservedQuantity) fail('completion-reservation-mismatch');
    const people = job.officerIds.map(oid => s.officers.find(o => o.id === oid)!);
    const rewards = reward(people, 'piece', s.policies.rewards);
    const completion: Completion = { jobId: job.id, turn: s.turn, inventoryWrite, rewards };
    stock.quantity = inventoryWrite.after; stock.reserved -= job.reservedQuantity;
    for (const person of people) { person.reservationJobId = null; person.actedTurn = s.turn; }
    const facility = s.facilities.find(f => f.id === job.facilityId)!; facility.reservationJobId = null;
    job.status = 'completed'; job.completedTurn = s.turn; job.completion = completion;
    receipt.completions.push(completion); receipt.events.push({ type: 'production-completed', subjectId: job.id });
  }
  receipt.events.push({ type: 'turn-advanced', subjectId: s.city.id });
}
function transition(original: State, e: Envelope): Outcome {
  try {
    const applied = original.appliedCommands.find(a => a.envelope.id === e.id);
    if (applied) { if (!same(applied.envelope, e)) fail('command-id-conflict'); return { ok: true, state: original, receipt: applied.receipt, duplicate: true }; }
    if (e.expectedRevision !== original.revision) fail('stale-revision');
    if (original.appliedCommands.length >= MAX_RECORDS) fail('command-history-full');
    if (original.revision === Number.MAX_SAFE_INTEGER) fail('revision-overflow');
    const s = mutableFork(original), c = e.command, calc = emptyCalculation();
    const receipt: Receipt = { commandId: e.id, revision: original.revision + 1, turn: s.turn, taskKind: c.type === 'AdvanceCityTurn' ? 'turn-boundary' : 'instant', calculation: calc,
      fees: { gold: write(s.city.gold, 0, MAX_VALUE, DEBIT), actionPoints: write(s.corps.actionPoints, 0, 255, DEBIT), sourceApRequest: 0, effectiveApCost: 0 }, rewards: [], newJobId: null, completions: [], apRecovery: null, events: [], sideEffectsNotModeled: [...NOT_MODELED], rngDraws: 0 };
    if (c.type === 'AdvanceCityTurn') advance(s, receipt);
    else {
      if (c.cityId !== s.city.id) fail('unknown-city');
      if (c.type === 'Patrol' && s.city.patrolUsedTurn === s.turn) fail('patrol-already-used');
      const people = c.officerIds.map(oid => {
        const o = s.officers.find(x => x.id === oid); if (!o) fail('unknown-officer');
        if (o.forceId !== s.activeForceId) fail('officer-not-member'); if (o.cityId !== s.city.id) fail('officer-not-present');
        if (!o.available) fail('officer-unavailable'); if (o.reservationJobId !== null) fail('officer-production-reserved'); if (o.actedTurn === s.turn) fail('officer-already-acted'); return o;
      });
      calc.selectedOfficerIds = [...c.officerIds];
      let facility: Facility | null = null;
      if (c.type !== 'Patrol') {
        facility = s.facilities.find(f => f.id === c.facilityId) ?? null; if (!facility) fail('unknown-facility');
        if (facility.cityId !== s.city.id) fail('facility-not-present'); if (!facility.complete) fail('facility-incomplete');
        const kind: FacilityKind = c.type === 'Recruit' ? 'barracks' : c.equipmentType <= 3 ? 'forge' : c.equipmentType === 4 ? 'stable' : c.equipmentType <= 8 ? 'workshop' : 'shipyard';
        if (facility.kind !== kind) fail('wrong-facility-kind'); if (facility.reservationJobId !== null) fail('facility-production-reserved'); if (facility.usedTurn === s.turn) fail('facility-used-this-turn');
      }
      let gold = c.type === 'Patrol' ? 100 : 300, ap = 20, yieldActual = 0;
      if (c.type === 'Patrol') {
        const input = { profile: 'patrol-security-gain-stable-v1' as const, resolvedLeadershipSlots: people.map(o => o.leadership), publicOrderByte: s.city.security, pressureHelperEax: s.pressureActive ? 1 : 0 };
        const result = kernel(calc, 'calculatePatrolSecurityGain', input, calculatePatrolSecurityGain(input)); calc.securityKernelReturn = result.returnedDelta;
        const w = write(s.city.security, result.returnedDelta, 100, s.policies.writer); calc.securityWrite = w; s.city.security = w.after; yieldActual = w.actualDelta;
        s.city.patrolUsedTurn = s.turn; receipt.rewards = reward(people, 'patrol', s.policies.rewards);
      } else if (c.type === 'Recruit') {
        const earlyCharmSum = people.reduce((sum, o) => sum + o.charm, 0), oldSecurity = s.city.security, oldTroops = s.city.troops, oldMorale = s.city.morale;
        calc.earlyCharmSum = earlyCharmSum; calc.moraleSecuritySnapshot = oldSecurity;
        const quantity = recruit(s, people, facility!, calc), troopWrite = write(oldTroops, quantity, s.city.troopCapacity, s.policies.writer); calc.troopWrite = troopWrite;
        const input = { profile: 'recruitment-security-argument-v1' as const, savedCharmSum: earlyCharmSum, savedTroopReturnU32: troopWrite.returned >>> 0 };
        const result = kernel(calc, 'calculateRecruitmentSecurityArgument', input, calculateRecruitmentSecurityArgument(input));
        const securityWrite = write(oldSecurity, result.securityDeltaSigned, 100, s.policies.writer); calc.securityWrite = securityWrite;
        const newMorale = Math.floor(oldSecurity / 2), a = troopWrite.actualDelta; calc.newRecruitMorale = newMorale;
        const total = oldTroops + a, raw = total > 0 ? (oldTroops * oldMorale + a * newMorale) / total : oldMorale;
        const rounded = s.policies.morale.parameters.rounding === 'ceil' ? Math.ceil(raw) : Math.floor(raw);
        const morale = Math.min(s.city.moraleCap, Math.max(s.policies.morale.parameters.minimum as number, rounded));
        calc.moraleWrite = write(oldMorale, morale - oldMorale, s.city.moraleCap, ACCUMULATE); calc.moraleWrite.policyId = s.policies.morale.id;
        s.city.troops = troopWrite.after; s.city.security = securityWrite.after; s.city.morale = morale; yieldActual = a;
        receipt.rewards = reward(people, 'recruit', s.policies.rewards);
      } else {
        if (!s.unlockedEquipmentTypes.includes(c.equipmentType)) fail('equipment-locked');
        const t = c.equipmentType, result = production(s, people, facility!, t, calc); gold = result.price;
        ap = s.policies.productionAp.parameters[t <= 4 ? 'quantity' : 'piece'] as number;
        const stock = s.city.inventory[t];
        if (t <= 4) {
          const w = write(stock.quantity, result.quantity, stock.capacity - stock.reserved, s.policies.writer); calc.inventoryWrite = w; stock.quantity = w.after; yieldActual = w.actualDelta;
          receipt.rewards = reward(people, 'quantity', s.policies.rewards);
        } else {
          if (s.productionJobs.length >= MAX_RECORDS) fail('production-history-full');
          if (stock.quantity + stock.reserved + result.quantity > stock.capacity) fail('piece-capacity-unavailable');
          const duration = result.duration, dueTurn = uint(s.turn + duration), jobId = 'job:' + e.id;
          const snapshot: StartSnapshot = { envelope: copy(e), turn: s.turn, date: copy(s.date), officers: copy(people), facility: copy(facility!), catalog: copy(s.catalog), policies: copy(s.policies), citySecurity: s.city.security, drillGroundComplete: s.city.drillGroundComplete, specialtyEquipmentTypes: [...s.specialtyEquipmentTypes], difficulty: s.difficulty, controller: s.controller };
          const job: Job = { id: jobId, status: 'active', cityId: s.city.id, facilityId: facility!.id, officerIds: [...c.officerIds], equipmentType: t, startTurn: s.turn, remainingTurns: duration, dueTurn, durationTurns: duration, reservedQuantity: 1, startSnapshot: snapshot, calculation: calc, fees: receipt.fees, completedTurn: null, completion: null };
          s.productionJobs.push(job); stock.reserved += result.quantity; facility!.reservationJobId = jobId; for (const o of people) o.reservationJobId = jobId;
          receipt.taskKind = 'production-start'; receipt.newJobId = jobId; receipt.events.push({ type: 'production-started', subjectId: jobId });
        }
      }
      if (receipt.taskKind === 'instant' && yieldActual === 0 && s.policies.zeroYield.parameters.zero === 'reject') fail('zero-yield');
      if (s.city.gold < gold) fail('insufficient-gold'); if (s.corps.actionPoints < ap) fail('insufficient-ap');
      const fees: Fees = { gold: write(s.city.gold, -gold || 0, MAX_VALUE, DEBIT), actionPoints: write(s.corps.actionPoints, -ap, 255, DEBIT), sourceApRequest: 20, effectiveApCost: ap };
      s.city.gold = fees.gold.after; s.corps.actionPoints = fees.actionPoints.after; receipt.fees = fees;
      if (receipt.newJobId !== null) s.productionJobs.find(j => j.id === receipt.newJobId)!.fees = fees;
      for (const o of people) o.actedTurn = s.turn; if (facility) facility.usedTurn = s.turn;
      receipt.events.push({ type: 'command-committed', subjectId: e.id });
    }
    s.revision++;
    s.appliedCommands.push({ envelope: copy(e), envelopeDigest: digest(e), committedRevision: s.revision, receipt });
    return { ok: true, state: s, receipt, duplicate: false };
  } catch (e) { return error(e); }
}

const SCENARIO_KEYS = ['profile', 'date', 'turn', 'activeForceId', 'corps', 'city', 'officers', 'facilities', 'catalog', 'unlockedEquipmentTypes', 'specialtyEquipmentTypes', 'pressureActive', 'difficulty', 'controller', 'policies'];
/** Rebuild from primitive genesis and every accepted envelope. No stored derived field is authoritative. */
function validateState(value: unknown): State {
  if (value !== null && typeof value === 'object' && trusted.has(value)) return value as State;
  const raw = detach(value);
  const r = obj(raw, [...SCENARIO_KEYS, 'schemaVersion', 'scope', 'revision', 'initialScenario', 'policyDigest', 'catalogDigest', 'productionJobs', 'appliedCommands'], 'invalid-state');
  if (r.schemaVersion !== 1 || r.scope !== 'standalone-city-command-lifecycle') fail('unsupported-schema');
  const scenario = validateScenario(r.initialScenario), log = arr(r.appliedCommands, MAX_RECORDS);
  let rebuilt = initialState(scenario);
  for (const item of log) {
    const a = obj(item, ['envelope', 'envelopeDigest', 'committedRevision', 'receipt'], 'invalid-state');
    const envelope = validateEnvelope(a.envelope), result = transition(rebuilt, envelope);
    if (!result.ok || result.duplicate) fail('state-history-mismatch'); rebuilt = result.state;
    if (!same(a, rebuilt.appliedCommands.at(-1))) fail('state-history-mismatch');
  }
  if (!same(r, rebuilt)) fail('state-recomputation-mismatch');
  return rebuilt;
}
/** Validate complete primitive scenario data and return an immutable independent state. */
export function createCityCommandState(input: CityScenarioV1): CityStateV1 | CityCommandFailure {
  try { const s = validateScenario(detach(input)); return freezeState(initialState(s)); }
  catch (e) { return freeze(error(e)); }
}
/** Compute the same planned receipt as execution without committing state or reservations. */
export function previewCityCommand(state: CityStateV1, envelope: CityCommandEnvelopeV1): CityCommandPreviewV1 {
  try { const s = validateState(state), e = validateEnvelope(detach(envelope)), result = transition(s, e); if (!result.ok) return freeze(result); return freeze({ ok: true, receipt: result.receipt, duplicate: result.duplicate, baseRevision: s.revision }); }
  catch (e) { return freeze(error(e)); }
}
/** Atomically commit one envelope, or return its original receipt for an identical retry. */
export function executeCityCommand(state: CityStateV1, envelope: CityCommandEnvelopeV1): CityCommandResultV1 {
  try { const s = validateState(state), e = validateEnvelope(detach(envelope)), result = transition(s, e); if (!result.ok) return freeze(result); freezeState(result.state); return freeze(result); }
  catch (e) { return freeze(error(e)); }
}
/** Canonical independent save; does not serialize or extend the training engine save format. */
export function saveCityCommandState(state: CityStateV1): CityCommandSaveResultV1 {
  try { const s = validateState(state), serialized = canonical({ tag: 'san11-city-command-save-v1', state: s }); if (serialized.length > MAX_BYTES) fail('save-too-large'); return freeze({ ok: true, serialized }); }
  catch (e) { return freeze(error(e, 'invalid-state')); }
}
/** Duplicate JSON keys, including escaped aliases, are rejected rather than silently discarded. */
function parseData(s: string): unknown {
  if (s.length > MAX_BYTES) fail('save-too-large'); let i = 0;
  const ws = () => { while (i < s.length && /[ \t\r\n]/.test(s[i]!)) i++; };
  function string(): string { const start = i++; while (i < s.length) { const c = s[i++]!; if (c === '"') return JSON.parse(s.slice(start, i)) as string; if (c === '\\') i++; } fail('invalid-json'); }
  function value(depth: number): void {
    ws(); if (depth > 64) fail('invalid-json'); const c = s[i];
    if (c === '{') { i++; ws(); const keys = new Set<string>(); if (s[i] === '}') { i++; return; } while (true) { ws(); if (s[i] !== '"') fail('invalid-json'); const key = string(); if (keys.has(key)) fail('duplicate-json-key'); keys.add(key); ws(); if (s[i++] !== ':') fail('invalid-json'); value(depth + 1); ws(); const end = s[i++]; if (end === '}') return; if (end !== ',') fail('invalid-json'); } }
    if (c === '[') { i++; ws(); let count = 0; if (s[i] === ']') { i++; return; } while (true) { if (++count > MAX_RECORDS) fail('invalid-json'); value(depth + 1); ws(); const end = s[i++]; if (end === ']') return; if (end !== ',') fail('invalid-json'); } }
    if (c === '"') { string(); return; }
    const match = /^(?:true|false|null|-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?)/.exec(s.slice(i)); if (!match) fail('invalid-json'); i += match[0].length;
  }
  value(0); ws(); if (i !== s.length) fail('invalid-json'); return JSON.parse(s);
}
/** Recompute saved history from complete genesis data; no derived final answer is trusted. */
export function loadCityCommandState(serialized: string): CityStateV1 | CityCommandFailure {
  try { if (typeof serialized !== 'string') fail('invalid-json'); const record = obj(detach(parseData(serialized)), ['tag', 'state'], 'invalid-save'); if (record.tag !== 'san11-city-command-save-v1') fail('unsupported-schema'); return freezeState(validateState(record.state)); }
  catch (e) { return freeze(error(e, 'invalid-json')); }
}
/** Compare optional expected outcomes to recomputation; a mismatch retains the preceding state. */
export function replayCityCommands(trace: CityCommandTraceV1): CityCommandReplayResultV1 {
  let state: State | null = null, index = -1;
  try {
    const r = obj(detach(trace), ['tag', 'initialScenario', 'steps', 'expectedFinalDigest'], 'invalid-trace'); if (r.tag !== 'san11-city-command-trace-v1') fail('unsupported-schema');
    const steps = arr(r.steps, MAX_RECORDS); if (r.expectedFinalDigest !== null && (typeof r.expectedFinalDigest !== 'string' || !/^[0-9a-f]{64}$/.test(r.expectedFinalDigest))) fail('invalid-trace');
    state = initialState(validateScenario(r.initialScenario)); const outcomes: ({ ok: true; duplicate: boolean; receipt: Receipt } | Failure)[] = [];
    for (index = 0; index < steps.length; index++) {
      const step = obj(steps[index], ['envelope', 'expected'], 'invalid-trace');
      let result: Outcome; try { result = transition(state, validateEnvelope(step.envelope)); } catch (e) { result = error(e); }
      const observed = result.ok ? { ok: true as const, duplicate: result.duplicate, receipt: result.receipt } : result;
      if (step.expected !== null && !same(step.expected, observed)) fail('replay-outcome-mismatch');
      outcomes.push(observed); if (result.ok) state = result.state;
    }
    if (r.expectedFinalDigest !== null && digest(state) !== r.expectedFinalDigest) fail('replay-final-mismatch');
    freezeState(state); return freeze({ ok: true, state, outcomes });
  } catch (e) { if (state) freezeState(state); return freeze({ ok: false, reason: error(e, 'invalid-trace').reason, index, state }); }
}
