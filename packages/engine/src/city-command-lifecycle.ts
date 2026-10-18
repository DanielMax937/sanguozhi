/**
 * Provisional standalone city service using explicit, versioned service policies.
 * Reservations never read or write native personnel tasks. Scalar source evidence
 * does not certify native writers, scheduling, effective attributes or stock data.
 * Public contract and source boundaries: docs/rules/city-command-lifecycle.md.
 */
import { ACCUMULATE, DEBIT, NOT_MODELED, copyOwned, emptyCalculation, writeDomestic } from './internal/city-domestic-leaves.ts';
import { reduceDomesticInstant } from './internal/city-instant-reducer.ts';
import { planPieceStart, planPieceStartFees } from './internal/city-piece-start-reducer.ts';
import { planPieceCompletion } from './internal/city-piece-completion-reducer.ts';
import type { DeepRO, DomesticInstantAction, DomesticInstantFrame, DomesticLeafResult } from './internal/city-service-types.ts';
import type { PieceStartAction, PieceStartFrame } from './internal/city-piece-types.ts';

type Frozen<T> = T extends object ? { readonly [K in keyof T]: Frozen<T[K]> } : T;
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
/** Typed leaf failures re-enter this owner's original Invalid/fail boundary. */
function unwrapDomestic<T>(result: DomesticLeafResult<T>): T { if (!result.ok) fail(result.reason); return result.value; }
function write(before: number, requested: number, cap: number, p: DeepRO<Policy>): Write { return unwrapDomestic(writeDomestic(before, requested, cap, p)); }
/** Value-shaped fee/completion results; start's distinct plan shell is handled explicitly. */
function unwrapPiece<T>(result: { readonly ok: true; readonly value: T } | { readonly ok: false; readonly reason: string }): T { if (!result.ok) fail(result.reason); return result.value; }
function pieceStartFrame(s: State): PieceStartFrame {
  // Only the old read set, preserving all records and their array order. This is
  // an owned primitive-preserving view, not a replacement for StartSnapshot JSON copies.
  return copyOwned<PieceStartFrame>({ activeForceId: s.activeForceId,
    city: { id: s.city.id, drillGroundComplete: s.city.drillGroundComplete,
      inventory: { 5: s.city.inventory[5], 6: s.city.inventory[6], 7: s.city.inventory[7], 8: s.city.inventory[8], 10: s.city.inventory[10], 11: s.city.inventory[11] } },
    officers: s.officers.map(o => ({ id: o.id, forceId: o.forceId, cityId: o.cityId, available: o.available, intelligence: o.intelligence, skillIds: o.skillIds, actedTurn: o.actedTurn, reservationJobId: o.reservationJobId })),
    facilities: s.facilities.map(f => ({ id: f.id, cityId: f.cityId, kind: f.kind, complete: f.complete, usedTurn: f.usedTurn, reservationJobId: f.reservationJobId })),
    unlockedEquipmentTypes: s.unlockedEquipmentTypes, specialtyEquipmentTypes: s.specialtyEquipmentTypes,
    productionPrices: { 5: s.catalog.entries[5], 6: s.catalog.entries[6], 7: s.catalog.entries[7], 8: s.catalog.entries[8], 10: s.catalog.entries[10], 11: s.catalog.entries[11] },
    policies: { time: s.policies.time, productionAp: s.policies.productionAp }, productionJobCount: s.productionJobs.length });
}
function isDomesticInstant(c: Exclude<Command, { type: 'AdvanceCityTurn' }>): c is DomesticInstantAction { return c.type !== 'Produce' || c.equipmentType <= 4; }
function instantFrame(s: State): DomesticInstantFrame {
  // Detached, exact read view; preserve the actual reservation fields and old wide actor/facility domain.
  return copy({ activeForceId: s.activeForceId, corps: { actionPoints: s.corps.actionPoints },
    city: { id: s.city.id, gold: s.city.gold, security: s.city.security, troops: s.city.troops, troopCapacity: s.city.troopCapacity, morale: s.city.morale, moraleCap: s.city.moraleCap, patrolUsedTurn: s.city.patrolUsedTurn,
      inventory: { 1: s.city.inventory[1], 2: s.city.inventory[2], 3: s.city.inventory[3], 4: s.city.inventory[4] } },
    officers: s.officers, facilities: s.facilities, pressureActive: s.pressureActive, difficulty: s.difficulty, controller: s.controller,
    unlockedEquipmentTypes: s.unlockedEquipmentTypes, specialtyEquipmentTypes: s.specialtyEquipmentTypes,
    productionPrices: { 1: s.catalog.entries[1], 2: s.catalog.entries[2], 3: s.catalog.entries[3], 4: s.catalog.entries[4] },
    policies: { attributes: s.policies.attributes, facilityMultiplier: s.policies.facilityMultiplier, writer: s.policies.writer, morale: s.policies.morale, productionAp: s.policies.productionAp, rewards: s.policies.rewards, zeroYield: s.policies.zeroYield, presentation: s.policies.presentation } });
}
function applyInstant(s: State, e: Envelope, c: DomesticInstantAction, receipt: Receipt): void {
  const result = reduceDomesticInstant({ commandId: e.id, turn: s.turn }, instantFrame(s), copy(c));
  if (!result.ok) fail(result.reason);
  const after = result.candidate, audit = result.audit;
  s.city.gold = after.city.gold; s.corps.actionPoints = after.corps.actionPoints;
  if (c.type === 'Patrol') { s.city.security = after.city.security; s.city.patrolUsedTurn = after.city.patrolUsedTurn; }
  else if (c.type === 'Recruit') { s.city.troops = after.city.troops; s.city.security = after.city.security; s.city.morale = after.city.morale; }
  else s.city.inventory[c.equipmentType].quantity = after.city.inventory[c.equipmentType].quantity;
  for (let i = 0; i < c.officerIds.length; i++) {
    const oid = c.officerIds[i]!, person = s.officers.find(o => o.id === oid)!, progress = after.officers.find(o => o.id === oid)!, attribute = audit.rewards[i]!.attribute;
    person.xp[attribute] = progress.xp[attribute]; person.merit = progress.merit; person.actedTurn = progress.actedTurn;
  }
  if (c.type !== 'Patrol') s.facilities.find(f => f.id === c.facilityId)!.usedTurn = after.facilities.find(f => f.id === c.facilityId)!.usedTurn;
  receipt.calculation = copyOwned<Calculation>(audit.calculation); receipt.fees = copyOwned<Fees>(audit.fees); receipt.rewards = copyOwned<Reward[]>(audit.rewards);
  receipt.events = copyOwned<Receipt['events']>(audit.events); receipt.sideEffectsNotModeled = [...audit.sideEffectsNotModeled]; receipt.rngDraws = audit.rngDraws;
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
    const people = job.officerIds.map(oid => s.officers.find(o => o.id === oid)!);
    const planned = unwrapPiece(planPieceCompletion({ turn: s.turn }, { stock,
      people: people.map(o => ({ id: o.id, xp: o.xp, merit: o.merit })), policies: { writer: s.policies.writer, rewards: s.policies.rewards } },
    { jobId: job.id, reservedQuantity: job.reservedQuantity }));
    for (let i = 0; i < people.length; i++) { const progress = planned.progress[i]!; people[i]!.xp[progress.attribute] = progress.xp; people[i]!.merit = progress.merit; }
    const completion = copyOwned<Completion>(planned.completion);
    stock.quantity = planned.stockAfter.quantity; stock.reserved = planned.stockAfter.reserved;
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
    else if (isDomesticInstant(c)) applyInstant(s, e, c, receipt);
    else {
      // Public validation and the preceding dispatch leave exactly types 5..8/10..11.
      const result = planPieceStart({ commandId: e.id, turn: s.turn }, pieceStartFrame(s), c as PieceStartAction);
      if (!result.ok) fail(result.reason);
      const plan = result.plan, people = plan.officerIds.map(oid => s.officers.find(o => o.id === oid)!), facility = s.facilities.find(f => f.id === plan.facilityId)!;
      const stock = s.city.inventory[plan.equipmentType], calculation = copyOwned<Calculation>(plan.calculation);
      receipt.calculation = calculation;
      const snapshot: StartSnapshot = { envelope: copy(e), turn: s.turn, date: copy(s.date), officers: copy(people), facility: copy(facility), catalog: copy(s.catalog), policies: copy(s.policies), citySecurity: s.city.security, drillGroundComplete: s.city.drillGroundComplete, specialtyEquipmentTypes: [...s.specialtyEquipmentTypes], difficulty: s.difficulty, controller: s.controller };
      const job: Job = { id: plan.jobId, status: 'active', cityId: plan.cityId, facilityId: plan.facilityId, officerIds: [...plan.officerIds], equipmentType: plan.equipmentType, startTurn: plan.startTurn, remainingTurns: plan.remainingTurns, dueTurn: plan.dueTurn, durationTurns: plan.durationTurns, reservedQuantity: plan.reservedQuantity, startSnapshot: snapshot, calculation, fees: receipt.fees, completedTurn: null, completion: null };
      s.productionJobs.push(job); stock.reserved += plan.quantityToReserve; facility.reservationJobId = plan.jobId; for (const o of people) o.reservationJobId = plan.jobId;
      receipt.taskKind = 'production-start'; receipt.newJobId = plan.jobId; receipt.events.push({ type: 'production-started', subjectId: plan.jobId });
      const charged = unwrapPiece(planPieceStartFees({ gold: s.city.gold, actionPoints: s.corps.actionPoints }, { goldCost: plan.goldCost, actionPointsCost: plan.actionPointsCost }));
      const fees = copyOwned<Fees>(charged.fees);
      s.city.gold = charged.goldAfter; s.corps.actionPoints = charged.actionPointsAfter; receipt.fees = fees;
      if (receipt.newJobId !== null) s.productionJobs.find(j => j.id === receipt.newJobId)!.fees = fees;
      for (const o of people) o.actedTurn = s.turn; facility.usedTurn = s.turn;
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
