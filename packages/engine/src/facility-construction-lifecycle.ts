/** Bounded independent facility development and absorption; no native task or combat integration. */
import policyData from '../../../data/catalogs/facility-construction-policies-v1.json' with { type: 'json' };
import catalogData from '../../../data/catalogs/facility-construction-catalog-v1.json' with { type: 'json' };
import { calculateDomesticConstructionRate } from './domestic-construction-rate.ts';
import { calculateCityMoneyIncomeProjection } from './city-money-income-projection.ts';
import type { CityMoneyIncomeProjectionInput, CityMoneyIncomeProjectionReceipt, CityMoneyIncomeSlot } from './city-money-income-projection.ts';
import { calculateCityFoodIncomeProjection } from './city-food-income-projection.ts';
import type { CityFoodIncomeProjectionInput, CityFoodIncomeProjectionReceipt, CityFoodIncomeSlot } from './city-food-income-projection.ts';
import type { DomesticConstructionRateReceipt } from './domestic-construction-rate.ts';

type Frozen<T> = T extends object ? { readonly [K in keyof T]: Frozen<T[K]> } : T;
const PROFILE = 'standalone-facility-construction-v1' as const;
const TAG = 'facility-construction-state-v1' as const;
const TRACE_TAG = 'facility-construction-trace-v1' as const;
const MAX_BYTES = 67_108_864, MAX_NODES = 4_000_000, MAX_DEPTH = 48, MAX_ARRAY = 4096;
const MAX_JOBS = 512, MAX_HISTORY = 872, MAX_ATTEMPTS = 2616;
type DateV1 = { year: number; month: number; day: 1 | 11 | 21 };
type Position = { q: number; r: number };
type Kind = 'market' | 'farm' | 'barracks' | 'forge' | 'stable' | 'workshop' | 'shipyard' | 'mint' | 'granary';
type Level = 1 | 2 | 3;
type Corps = { id: string; forceId: string; actionPoints: number };
type City = { id: string; kind: 'city'; ownerForceId: string; position: Position; gold: number; goldCapacity: number };
type Force = { id: string; techniquePoints: number };
type PrimitiveOfficer = { id: string; forceId: string; cityId: string; available: boolean; politics: number; politicsXp: number; merit: number; actedTurn: number | null };
type Officer = PrimitiveOfficer & { reservationJobId: string | null };
type Lot = { id: string; cityId: string; position: Position };
type PrimitiveFacility = { id: string; lotId: string; kind: Kind; level: Level };
type Facility = PrimitiveFacility & { typeId: number; status: 'complete' | 'developing' | 'absorbing'; effectiveLevel: 0 | Level; jobId: string | null };
type FieldUnit = { id: string; forceId: string; position: Position };
type TurnInput = { fieldUnits: FieldUnit[] };
type Policies = typeof policyData.common & { apRecovery: typeof policyData.apRecoveryPolicies[number]; initialWork: typeof policyData.initialWorkPolicies[number]; rewards: typeof policyData.rewardPolicies[number]; completionActors: typeof policyData.completionActorPolicies[number] };
type Economy = { baseMoneyWord: number; baseFoodWord: number; securityByte: number; difficulty: 'normal' | 'super'; controller: 'player' | 'ai' };
type Catalog = typeof catalogData;
type Scenario = { schemaVersion: 1; profile: typeof PROFILE; date: DateV1; turn: number; advanceLimit: number; activeForceId: string; force: Force; corps: Corps; city: City; economy: Economy; officers: PrimitiveOfficer[]; lots: Lot[]; facilities: PrimitiveFacility[]; hostileForceIds: string[]; completeFieldUnits: true; fieldUnits: FieldUnit[]; turnInputs: TurnInput[]; policies: Policies; catalog: Catalog };
type Work = { initial: number; current: number; required: number; perAdvance: number; rate: DomesticConstructionRateReceipt };
type Job = { id: string; kind: 'development' | 'absorption'; facilityId: string; facilityKind: Kind; fromLevel: 0 | Level; targetLevel: Level; officerIds: string[]; politics: number[]; startTurn: number; dueTurn: number; dueDate: DateV1; durationTurns: number; remainingTurns: number; work: Work | null; completedTurn: number | null };
type Snapshot = { schemaVersion: 1; profile: typeof PROFILE; revision: number; advancedCount: number; date: DateV1; turn: number; force: Force; corps: Corps; city: City; officers: Officer[]; facilities: Facility[]; jobs: Job[]; usedFacilityIds: string[]; completeFieldUnits: true; fieldUnits: FieldUnit[] };
type Command = { type: 'StartDevelopment'; cityId: string; lotId: string; facilityId: string; facilityKind: Kind; officerIds: string[] }
  | { type: 'StartAbsorption'; cityId: string; receiverId: string; donorId: string; officerId: string }
  | { type: 'AdvanceFacilityTurn' };
type Envelope = { id: string; expectedRevision: number; command: Command };
type Write = { before: number; requestedDelta: number; actualDelta: number; after: number; cap: number; discarded: number; policyId: string };
type UnitCheck = { unitId: string; forceId: string; position: Position; hostile: boolean; distance: number; blocks: boolean };
type Reward = { officerId: string; politicsXp: Write; merit: Write; politicsBefore: number; politicsAfter: number };
type Completion = { jobId: string; facilityId: string; typeId: number; level: Level; effectiveLevel: Level; techniquePoints: Write; rewards: Reward[]; releasedOfficerIds: string[]; policyId: string };
const BOUNDARY = { sourceLevel: 'official-guide-and-public-rate-listing-with-provisional-service', nativeExecution: false, stockVerified: false,
  constructionRate: 'stable-resolved-public-listing-only', constructionWriterAndSchedule: 'provisional-engine-rule', absorptionTimingAndTp: 'empirical-guide',
  levelDurability: 'community-guide-reference-not-stock-table', combatHpModeled: false, nativeTasksModeled: false, repairModeled: false } as const;
type Receipt = { schemaVersion: 1; profile: typeof PROFILE; commandId: string; command: Command; revisionBefore: number; revisionAfter: number; dateBefore: DateV1; dateAfter: DateV1; turnBefore: number; turnAfter: number; policyDigest: string; catalogDigest: string; sourceBoundary: typeof BOUNDARY;
  ownerSnapshot: { activeForceId: string; ownerForceId: string; corpsId: string; corpsForceId: string }; cityId: string; actionPoints: Write; gold: Write; rngDraws: 0;
  start: { job: Job; createdFacility: Facility | null; receiverBefore: Facility | null; receiverAfter: Facility | null; removedDonor: Facility | null; unitChecks: UnitCheck[] } | null;
  advance: { inputIndex: number; origin: 'fixed-external-scenario'; input: TurnInput; progress: { jobId: string; remainingBefore: number; remainingAfter: number; workBefore: number | null; workAfter: number | null }[]; completions: Completion[] } | null };
type State = { tag: typeof TAG; schemaVersion: 1; profile: typeof PROFILE; scope: 'independent-fixed-owned-city'; policies: Policies; catalog: Catalog; policyDigest: string; catalogDigest: string; genesis: { scenario: Scenario; snapshot: Snapshot }; snapshot: Snapshot; acceptedCommands: { envelope: Envelope; receipt: Receipt }[] };
type Failure = { ok: false; committed: false; reason: string; index: number | null; blockingUnitId: string | null };
type StateResult = { ok: true; state: State } | Failure;
type CommandResult = { ok: true; committed: boolean; duplicate: boolean; state: State; receipt: Receipt } | Failure;
type PreviewResult = { ok: true; committed: false; duplicate: boolean; receipt: Receipt; projectedSnapshot: Snapshot } | Failure;
type SaveResult = { ok: true; json: string } | Failure;
type ExpectedOutcome = { ok: true; duplicate: boolean; receipt: Receipt } | { ok: false; reason: string; blockingUnitId: string | null };
type Trace = { tag: typeof TRACE_TAG; scenario: Scenario; attempts: { envelope: Envelope; expectedOutcome: ExpectedOutcome | null }[]; expectedFinalSnapshot: Snapshot | null };
type ReplayResult = { ok: true; state: State; outcomes: ExpectedOutcome[] } | Failure;
export type FacilityConstructionScenarioV1 = Frozen<Scenario>;
export type FacilityConstructionStateV1 = Frozen<State>;
export type FacilityConstructionSnapshotV1 = Frozen<Snapshot>;
export type FacilityConstructionCommandV1 = Frozen<Command>;
export type FacilityConstructionEnvelopeV1 = Frozen<Envelope>;
export type FacilityConstructionPoliciesV1 = Frozen<Policies>;
export type FacilityConstructionCatalogV1 = Frozen<Catalog>;
export type FacilityConstructionFacilityV1 = Frozen<Facility>;
export type FacilityConstructionJobV1 = Frozen<Job>;
export type FacilityConstructionReceiptV1 = Frozen<Receipt>;
export type FacilityConstructionWriteV1 = Frozen<Write>;
export type FacilityConstructionFailureV1 = Frozen<Failure>;
export type FacilityConstructionStateResultV1 = Frozen<StateResult>;
export type FacilityConstructionCommandResultV1 = Frozen<CommandResult>;
export type FacilityConstructionPreviewResultV1 = Frozen<PreviewResult>;
export type FacilityConstructionSaveResultV1 = Frozen<SaveResult>;
export type FacilityConstructionTraceV1 = Frozen<Trace>;
export type FacilityConstructionReplayResultV1 = Frozen<ReplayResult>;

class Invalid extends Error {
  readonly reason: string; readonly index: number | null; readonly blockingUnitId: string | null;
  constructor(reason: string, index: number | null = null, blockingUnitId: string | null = null) { super(reason); this.reason = reason; this.index = index; this.blockingUnitId = blockingUnitId; }
}
function fail(reason: string, index: number | null = null, blockingUnitId: string | null = null): never { throw new Invalid(reason, index, blockingUnitId); }
function failure(e: unknown): Failure { return { ok: false, committed: false, reason: e instanceof Invalid ? e.reason : 'invalid-data', index: e instanceof Invalid ? e.index : null, blockingUnitId: e instanceof Invalid ? e.blockingUnitId : null }; }
function freeze<T>(v: T): Frozen<T> { if (v !== null && typeof v === 'object' && !Object.isFrozen(v)) { for (const x of Object.values(v)) freeze(x); Object.freeze(v); } return v as Frozen<T>; }
function clone<T>(v: T): T { return JSON.parse(JSON.stringify(v)) as T; }
function canonical(v: unknown): string { if (v === null || typeof v !== 'object') return JSON.stringify(v); if (Array.isArray(v)) return '[' + v.map(canonical).join(',') + ']'; const r = v as Record<string, unknown>; return '{' + Object.keys(r).sort().map(k => JSON.stringify(k) + ':' + canonical(r[k])).join(',') + '}'; }
function same(a: unknown, b: unknown): boolean { return canonical(a) === canonical(b); }
function utf8Bytes(s: string): number { let n = 0; for (const c of s) { const p = c.codePointAt(0)!; n += p < 128 ? 1 : p < 2048 ? 2 : p < 65536 ? 3 : 4; } return n; }
/** Finite descriptor-only JSON copy. Domain parsers and recomputation enforce integer fields. */
function detach(v: unknown): unknown {
  let nodes = 0, bytes = 0; const active = new Set<object>();
  function visit(x: unknown, depth: number): unknown {
    if (++nodes > MAX_NODES || depth > MAX_DEPTH) fail('budget-exceeded');
    if (x === null || typeof x === 'boolean') return x;
    if (typeof x === 'number') { if (!Number.isFinite(x) || Object.is(x, -0)) fail('invalid-number'); return x; }
    if (typeof x === 'string') { if (x.length > MAX_BYTES) fail('budget-exceeded'); bytes += utf8Bytes(x); if (bytes > MAX_BYTES) fail('budget-exceeded'); return x; }
    if (typeof x !== 'object' || active.has(x)) fail('invalid-data');
    const arr = Array.isArray(x), proto = Object.getPrototypeOf(x);
    if (proto !== (arr ? Array.prototype : Object.prototype) && !(proto === null && !arr)) fail('invalid-prototype');
    const keys = Reflect.ownKeys(x);
    if (keys.length > (arr ? MAX_ARRAY + 1 : 128)) fail('budget-exceeded');
    const ds = Object.getOwnPropertyDescriptors(x);
    if (keys.some(k => typeof k !== 'string' || !Object.hasOwn(ds[k]!, 'value') || (!ds[k]!.enumerable && !(arr && k === 'length')))) fail('invalid-data');
    active.add(x);
    try {
      if (arr) {
        const n = ds.length!.value as number;
        if (!Number.isSafeInteger(n) || n < 0 || n > MAX_ARRAY) fail('budget-exceeded');
        if (keys.length !== n + 1) fail('invalid-array');
        const out: unknown[] = [];
        for (let i = 0; i < n; i++) { const d = ds[String(i)]; if (!d) fail('invalid-array'); out.push(visit(d.value, depth + 1)); }
        return out;
      }
      const out: Record<string, unknown> = {};
      for (const k of keys as string[]) { bytes += utf8Bytes(k); if (bytes > MAX_BYTES) fail('budget-exceeded'); Object.defineProperty(out, k, { value: visit(ds[k]!.value, depth + 1), enumerable: true, writable: true, configurable: true }); }
      return out;
    } finally { active.delete(x); }
  }
  const out = visit(v, 0); if (utf8Bytes(canonical(out)) > MAX_BYTES) fail('budget-exceeded'); return out;
}
function budget(v: unknown): void { detach(v); }
function object(v: unknown, keys: readonly string[]): Record<string, unknown> { if (v === null || typeof v !== 'object' || Array.isArray(v)) fail('invalid-object'); const r = v as Record<string, unknown>; if (keys.some(k => !Object.hasOwn(r, k)) || Object.keys(r).some(k => !keys.includes(k))) fail('invalid-fields'); return r; }
function uint(v: unknown, max = Number.MAX_SAFE_INTEGER, min = 0): number { if (typeof v !== 'number' || !Number.isSafeInteger(v) || Object.is(v, -0) || v < min || v > max) fail('invalid-number'); return v; }
function bool(v: unknown): boolean { if (typeof v !== 'boolean') fail('invalid-boolean'); return v; }
function list(v: unknown, max: number): unknown[] { if (!Array.isArray(v) || v.length > max) fail('invalid-array'); return v; }
function choice<T extends string>(v: unknown, values: readonly T[], reason: string): T { if (!values.includes(v as T)) fail(reason); return v as T; }
function id(v: unknown): string { if (typeof v !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9_.:-]{0,63}$/.test(v)) fail('invalid-id'); return v; }
function date(v: unknown): DateV1 { const r = object(v, ['year', 'month', 'day']); const day = uint(r.day, 21, 1); if (day !== 1 && day !== 11 && day !== 21) fail('invalid-date'); return { year: uint(r.year, 9999, 1), month: uint(r.month, 12, 1), day }; }
function nextDate(d: DateV1): DateV1 { if (d.day === 1) return { ...d, day: 11 }; if (d.day === 11) return { ...d, day: 21 }; if (d.month < 12) return { year: d.year, month: d.month + 1, day: 1 }; if (d.year === 9999) fail('calendar-overflow'); return { year: d.year + 1, month: 1, day: 1 }; }
/** Bounded JSON parser rejects duplicate decoded object keys before they can be overwritten. */
function parseJson(text: unknown): unknown {
  if (typeof text !== 'string') fail('invalid-json');
  if (text.length > MAX_BYTES || utf8Bytes(text) > MAX_BYTES) fail('budget-exceeded');
  let p = 0, nodes = 0;
  const ws = () => { while (p < text.length && /[\x20\t\r\n]/.test(text[p]!)) p++; };
  function str(): string {
    const start = p++; let escaped = false;
    while (p < text.length) { const c = text[p++]!; if (!escaped && c === '"') return JSON.parse(text.slice(start, p)) as string; if (!escaped && c === '\\') escaped = true; else escaped = false; }
    return fail('invalid-json');
  }
  function value(depth: number): unknown {
    if (++nodes > MAX_NODES || depth > MAX_DEPTH) fail('budget-exceeded'); ws(); const c = text[p];
    if (c === '"') return str();
    if (c === '{') {
      p++; ws(); const r: Record<string, unknown> = {}; const keys = new Set<string>();
      if (text[p] === '}') { p++; return r; }
      while (true) { ws(); if (text[p] !== '"') fail('invalid-json'); const k = str(); if (keys.has(k)) fail('duplicate-json-key'); keys.add(k); if (keys.size > 128) fail('budget-exceeded'); ws(); if (text[p++] !== ':') fail('invalid-json'); Object.defineProperty(r, k, { value: value(depth + 1), enumerable: true, writable: true, configurable: true }); ws(); const end = text[p++]; if (end === '}') return r; if (end !== ',') fail('invalid-json'); }
    }
    if (c === '[') { p++; ws(); const r: unknown[] = []; if (text[p] === ']') { p++; return r; } while (true) { if (r.length >= MAX_ARRAY) fail('budget-exceeded'); r.push(value(depth + 1)); ws(); const end = text[p++]; if (end === ']') return r; if (end !== ',') fail('invalid-json'); } }
    for (const [token, result] of [['true', true], ['false', false], ['null', null]] as const) if (text.startsWith(token, p)) { p += token.length; return result; }
    const token = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/.exec(text.slice(p))?.[0]; if (!token) fail('invalid-json'); p += token.length; const n = Number(token); if (!Number.isFinite(n) || Object.is(n, -0)) fail('invalid-number'); return n;
  }
  const result = value(0); ws(); if (p !== text.length) fail('invalid-json'); return detach(result);
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
const KINDS: Kind[] = ['market', 'farm', 'barracks', 'forge', 'stable', 'workshop', 'shipyard', 'mint', 'granary'];
const REGISTRY = { apRecovery: clone(policyData.apRecoveryPolicies), initialWork: clone(policyData.initialWorkPolicies), rewards: clone(policyData.rewardPolicies), completionActors: clone(policyData.completionActorPolicies) };
const DEFAULT_POLICIES: Policies = { ...clone(policyData.common), apRecovery: clone(REGISTRY.apRecovery[0]!), initialWork: clone(REGISTRY.initialWork[0]!), rewards: clone(REGISTRY.rewards[0]!), completionActors: clone(REGISTRY.completionActors[0]!) };
function policies(v: unknown): Policies {
  const r = object(v, [...Object.keys(policyData.common), ...Object.keys(REGISTRY)]);
  for (const [key, value] of Object.entries(policyData.common)) if (!same(r[key], value)) fail('policy-mismatch');
  for (const key of Object.keys(REGISTRY) as (keyof typeof REGISTRY)[]) if (!REGISTRY[key].some(p => same(r[key], p))) fail('policy-mismatch');
  return clone(r as unknown as Policies);
}
const CATALOG = clone(catalogData), CATALOG_DIGEST = digest(CATALOG);
export const FACILITY_CONSTRUCTION_POLICY_REGISTRY_V1 = freeze(REGISTRY);
export const FACILITY_CONSTRUCTION_DEFAULT_POLICIES_V1 = freeze(DEFAULT_POLICIES);
export const FACILITY_CONSTRUCTION_CATALOG_V1 = freeze(CATALOG);
export const FACILITY_CONSTRUCTION_CATALOG_DIGEST_V1 = CATALOG_DIGEST;
export const FACILITY_CONSTRUCTION_EVIDENCE_V1 = freeze(BOUNDARY);
function position(v: unknown): Position { const r = object(v, ['q', 'r']); return { q: uint(r.q, 1_000_000, -1_000_000), r: uint(r.r, 1_000_000, -1_000_000) }; }
function distance(a: Position, b: Position): number { const q = a.q - b.q, r = a.r - b.r; return Math.max(Math.abs(q), Math.abs(r), Math.abs(q + r)); }
function unique<T>(items: T[], reason: string): void { if (new Set(items).size !== items.length) fail(reason); }
function level(v: unknown): Level { if (v !== 1 && v !== 2 && v !== 3) fail('invalid-level'); return v; }
function row(kind: Kind) { const result = CATALOG.entries.find(e => e.kind === kind); if (!result) fail('unsupported-facility'); return result; }
function levelRow(kind: Kind, n: Level) { const result = row(kind).levels.find(e => e.level === n); if (!result) fail('unsupported-facility-level'); return result; }
function units(v: unknown): FieldUnit[] {
  const result = list(v, 128).map(x => { const r = object(x, ['id', 'forceId', 'position']); return { id: id(r.id), forceId: id(r.forceId), position: position(r.position) }; });
  unique(result.map(x => x.id), 'duplicate-field-unit'); return result;
}
function turnInput(v: unknown): TurnInput { const r = object(v, ['fieldUnits']); return { fieldUnits: units(r.fieldUnits) }; }
function scenario(v: unknown): Scenario {
  const r = object(v, ['schemaVersion', 'profile', 'date', 'turn', 'advanceLimit', 'activeForceId', 'force', 'corps', 'city', 'economy', 'officers', 'lots', 'facilities', 'hostileForceIds', 'completeFieldUnits', 'fieldUnits', 'turnInputs', 'policies', 'catalog']);
  if (r.schemaVersion !== 1 || r.profile !== PROFILE) fail('unsupported-scenario-schema');
  const initialDate = date(r.date), turn = uint(r.turn), advanceLimit = uint(r.advanceLimit, 360, 1), activeForceId = id(r.activeForceId);
  if (!Number.isSafeInteger(turn + advanceLimit)) fail('turn-overflow');
  let lastDate = initialDate; for (let i = 0; i < advanceLimit; i++) lastDate = nextDate(lastDate);
  const f = object(r.force, ['id', 'techniquePoints']); const force = { id: id(f.id), techniquePoints: uint(f.techniquePoints, 10000) };
  const c = object(r.corps, ['id', 'forceId', 'actionPoints']); const corps = { id: id(c.id), forceId: id(c.forceId), actionPoints: uint(c.actionPoints, 255) };
  const t = object(r.city, ['id', 'kind', 'ownerForceId', 'position', 'gold', 'goldCapacity']);
  if (t.kind !== 'city') fail('unsupported-city-kind');
  const goldCapacity = uint(t.goldCapacity, 1_000_000_000);
  const city: City = { id: id(t.id), kind: 'city', ownerForceId: id(t.ownerForceId), position: position(t.position), gold: uint(t.gold, goldCapacity), goldCapacity };
  if (force.id !== activeForceId || corps.forceId !== activeForceId || city.ownerForceId !== activeForceId) fail('owner-corps-mismatch');
  const e = object(r.economy, ['baseMoneyWord', 'baseFoodWord', 'securityByte', 'difficulty', 'controller']);
  const economy: Economy = { baseMoneyWord: uint(e.baseMoneyWord, 65535), baseFoodWord: uint(e.baseFoodWord, 65535), securityByte: uint(e.securityByte, 255), difficulty: choice(e.difficulty, ['normal', 'super'], 'unsupported-difficulty'), controller: choice(e.controller, ['player', 'ai'], 'unsupported-controller') };
  const officers = list(r.officers, 128).map(x => {
    const o = object(x, ['id', 'forceId', 'cityId', 'available', 'politics', 'politicsXp', 'merit', 'actedTurn']);
    return { id: id(o.id), forceId: id(o.forceId), cityId: id(o.cityId), available: bool(o.available), politics: uint(o.politics, 255), politicsXp: uint(o.politicsXp, 1_000_000_000), merit: uint(o.merit, 1_000_000_000), actedTurn: o.actedTurn === null ? null : uint(o.actedTurn, turn) };
  });
  unique(officers.map(o => o.id), 'duplicate-officer');
  const lots = list(r.lots, 30).map(x => { const l = object(x, ['id', 'cityId', 'position']); const cityId = id(l.cityId); if (cityId !== city.id) fail('lot-city-mismatch'); const p = position(l.position); if (distance(p, city.position) === 0) fail('lot-at-city'); return { id: id(l.id), cityId, position: p }; });
  unique(lots.map(x => x.id), 'duplicate-lot'); unique(lots.map(x => canonical(x.position)), 'duplicate-lot-position');
  const facilities = list(r.facilities, 30).map(x => {
    const t = object(x, ['id', 'lotId', 'kind', 'level']); const kind = choice(t.kind, KINDS, 'unsupported-facility'), n = level(t.level), lotId = id(t.lotId);
    levelRow(kind, n); if (!lots.some(l => l.id === lotId)) fail('unknown-lot'); return { id: id(t.id), lotId, kind, level: n };
  });
  unique(facilities.map(x => x.id), 'duplicate-facility'); unique(facilities.map(x => x.lotId), 'occupied-lot');
  const hostileForceIds = list(r.hostileForceIds, 128).map(id); unique(hostileForceIds, 'duplicate-hostile-force');
  if (hostileForceIds.includes(activeForceId)) fail('own-force-hostile');
  if (r.completeFieldUnits !== true) fail('incomplete-field-unit-snapshot');
  const fieldUnits = units(r.fieldUnits), turnInputs = list(r.turnInputs, 360).map(turnInput);
  if (turnInputs.length !== advanceLimit) fail('incomplete-turn-input-horizon');
  const parsedPolicies = policies(r.policies);
  if (!same(r.catalog, CATALOG)) fail('catalog-mismatch');
  return { schemaVersion: 1, profile: PROFILE, date: initialDate, turn, advanceLimit, activeForceId, force, corps, city, economy, officers, lots, facilities, hostileForceIds, completeFieldUnits: true, fieldUnits, turnInputs, policies: parsedPolicies, catalog: clone(CATALOG) };
}
function envelope(v: unknown): Envelope {
  const r = object(v, ['id', 'expectedRevision', 'command']);
  if (r.command === null || typeof r.command !== 'object' || Array.isArray(r.command)) fail('invalid-command');
  const kind = (r.command as Record<string, unknown>).type; let command: Command;
  if (kind === 'AdvanceFacilityTurn') { object(r.command, ['type']); command = { type: kind }; }
  else if (kind === 'StartDevelopment') {
    const c = object(r.command, ['type', 'cityId', 'lotId', 'facilityId', 'facilityKind', 'officerIds']); const officerIds = list(c.officerIds, 3).map(id);
    if (!officerIds.length) fail('invalid-officer-count'); unique(officerIds, 'duplicate-officer');
    command = { type: kind, cityId: id(c.cityId), lotId: id(c.lotId), facilityId: id(c.facilityId), facilityKind: choice(c.facilityKind, KINDS, 'unsupported-facility'), officerIds };
  } else if (kind === 'StartAbsorption') {
    const c = object(r.command, ['type', 'cityId', 'receiverId', 'donorId', 'officerId']);
    command = { type: kind, cityId: id(c.cityId), receiverId: id(c.receiverId), donorId: id(c.donorId), officerId: id(c.officerId) };
  } else return fail('unsupported-command');
  return { id: id(r.id), expectedRevision: uint(r.expectedRevision, MAX_HISTORY), command };
}
function initialState(s: Scenario): State {
  const snapshot: Snapshot = { schemaVersion: 1, profile: PROFILE, revision: 0, advancedCount: 0, date: clone(s.date), turn: s.turn, force: clone(s.force), corps: clone(s.corps), city: clone(s.city),
    officers: s.officers.map(o => ({ ...clone(o), reservationJobId: null })), facilities: s.facilities.map(f => ({ ...clone(f), typeId: levelRow(f.kind, f.level).typeId, status: 'complete', effectiveLevel: f.level, jobId: null })),
    jobs: [], usedFacilityIds: s.facilities.map(f => f.id), completeFieldUnits: true, fieldUnits: clone(s.fieldUnits) };
  return { tag: TAG, schemaVersion: 1, profile: PROFILE, scope: 'independent-fixed-owned-city', policies: clone(s.policies), catalog: clone(CATALOG), policyDigest: digest(s.policies), catalogDigest: CATALOG_DIGEST,
    genesis: { scenario: s, snapshot: clone(snapshot) }, snapshot, acceptedCommands: [] };
}
function write(before: number, delta: number, cap: number, policyId: string): Write {
  if (delta < 0 && before < -delta) fail('insufficient-balance');
  const actualDelta = delta < 0 ? delta : Math.min(delta, cap - before);
  return { before, requestedDelta: delta, actualDelta, after: before + actualDelta, cap, discarded: delta - actualDelta, policyId };
}
function unitChecks(s: Scenario, before: Snapshot): UnitCheck[] {
  return before.fieldUnits.map(u => { const d = distance(u.position, before.city.position), hostile = s.hostileForceIds.includes(u.forceId);
    return { unitId: u.id, forceId: u.forceId, position: clone(u.position), hostile, distance: d, blocks: hostile && d <= 2 }; });
}
function actors(s: Scenario, before: Snapshot, ids: string[]): Officer[] {
  return ids.map(officerId => {
    const o = before.officers.find(x => x.id === officerId); if (!o) fail('officer-not-found');
    if (o.cityId !== before.city.id || o.forceId !== s.activeForceId) fail('officer-city-force-mismatch');
    if (!o.available) fail('officer-unavailable'); if (o.reservationJobId !== null) fail('officer-busy');
    if (o.actedTurn === before.turn) fail('officer-already-acted'); return o;
  });
}
function due(s: Scenario, before: Snapshot, duration: number): DateV1 {
  if (duration < 1 || !Number.isSafeInteger(duration)) fail('invalid-duration');
  if (before.advancedCount + duration > s.advanceLimit) fail('completion-outside-horizon');
  let result = before.date; for (let i = 0; i < duration; i++) result = nextDate(result); return clone(result);
}
function complete(s: Scenario, after: Snapshot, job: Job): Completion {
  const p = s.policies, facility = after.facilities.find(f => f.id === job.facilityId);
  if (!facility || facility.jobId !== job.id || facility.status === 'complete') fail('facility-reservation-mismatch');
  if (job.remainingTurns !== 0 || after.turn !== job.dueTurn || !same(after.date, job.dueDate)) fail('completion-timing-mismatch');
  if (job.work !== null && job.work.current !== job.work.required) fail('incomplete-work');
  const requestedTp = job.kind === 'development' ? row(job.facilityKind).completionTechniquePoints : p.absorption.completionTechniquePoints;
  const techniquePoints = write(after.force.techniquePoints, requestedTp, p.writer.techniquePointCap, p.writer.id); after.force.techniquePoints = techniquePoints.after;
  const rewards: Reward[] = job.officerIds.map(officerId => {
    const o = after.officers.find(x => x.id === officerId); if (!o || o.reservationJobId !== job.id) fail('officer-reservation-mismatch');
    const xp = job.kind === 'absorption' ? p.rewards.absorptionPoliticsXp : (job.facilityKind === 'mint' || job.facilityKind === 'granary' ? p.rewards.supportDevelopmentPoliticsXp : p.rewards.ordinaryDevelopmentPoliticsXp);
    const requestedMerit = job.kind === 'development' && job.facilityKind === 'mint' ? p.rewards.mintDevelopmentMerit : p.rewards.otherMerit;
    const politicsXp = write(o.politicsXp, xp, p.writer.rewardCap, p.rewards.id);
    const merit = write(o.merit, requestedMerit, p.writer.rewardCap, p.rewards.id);
    o.politicsXp = politicsXp.after; o.merit = merit.after; o.reservationJobId = null; o.actedTurn = p.completionActors.actedOnCompletion ? after.turn : null;
    return { officerId, politicsXp, merit, politicsBefore: o.politics, politicsAfter: o.politics };
  });
  facility.status = 'complete'; facility.effectiveLevel = job.targetLevel; facility.jobId = null; job.completedTurn = after.turn;
  return { jobId: job.id, facilityId: facility.id, typeId: facility.typeId, level: job.targetLevel, effectiveLevel: job.targetLevel, techniquePoints, rewards, releasedOfficerIds: [...job.officerIds], policyId: p.scheduler.id };
}
function resolve(s: Scenario, before: Snapshot, env: Envelope): { snapshot: Snapshot; receipt: Receipt } {
  const after = clone(before), p = s.policies;
  const receipt: Receipt = { schemaVersion: 1, profile: PROFILE, commandId: env.id, command: clone(env.command), revisionBefore: before.revision, revisionAfter: before.revision + 1,
    dateBefore: clone(before.date), dateAfter: clone(before.date), turnBefore: before.turn, turnAfter: before.turn, policyDigest: digest(p), catalogDigest: CATALOG_DIGEST, sourceBoundary: clone(BOUNDARY),
    ownerSnapshot: { activeForceId: s.activeForceId, ownerForceId: before.city.ownerForceId, corpsId: before.corps.id, corpsForceId: before.corps.forceId }, cityId: before.city.id,
    actionPoints: write(before.corps.actionPoints, 0, 255, p.writer.id), gold: write(before.city.gold, 0, before.city.goldCapacity, p.writer.id), rngDraws: 0, start: null, advance: null };
  if (env.command.type === 'AdvanceFacilityTurn') {
    if (before.advancedCount >= s.advanceLimit) fail('advance-limit');
    if (before.turn >= Number.MAX_SAFE_INTEGER) fail('turn-overflow');
    const input = s.turnInputs[before.advancedCount]; if (!input) fail('missing-turn-input');
    after.date = nextDate(before.date); after.turn++; after.advancedCount++; after.fieldUnits = clone(input.fieldUnits);
    receipt.actionPoints = write(before.corps.actionPoints, p.apRecovery.perAdvance, p.apRecovery.cap, p.apRecovery.id); after.corps.actionPoints = receipt.actionPoints.after;
    const progress: NonNullable<Receipt['advance']>['progress'] = [], completions: Completion[] = [];
    for (const job of [...after.jobs].sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0)) {
      if (job.completedTurn !== null) continue;
      const remainingBefore = job.remainingTurns, workBefore = job.work?.current ?? null; job.remainingTurns--;
      if (job.work !== null) job.work.current = Math.min(job.work.required, job.work.current + job.work.perAdvance);
      progress.push({ jobId: job.id, remainingBefore, remainingAfter: job.remainingTurns, workBefore, workAfter: job.work?.current ?? null });
      if (job.remainingTurns === 0) completions.push(complete(s, after, job));
    }
    receipt.advance = { inputIndex: before.advancedCount, origin: 'fixed-external-scenario', input: clone(input), progress, completions };
  } else {
    const c = env.command;
    if (c.cityId !== before.city.id) fail('city-mismatch');
    if (before.city.ownerForceId !== s.activeForceId || before.corps.forceId !== s.activeForceId || before.force.id !== s.activeForceId) fail('owner-corps-mismatch');
    if (before.jobs.length >= MAX_JOBS) fail('job-history-limit');
    const checks = unitChecks(s, before), blocking = checks.find(u => u.blocks); if (blocking) fail('hostile-within-two', null, blocking.unitId);
    const ids = c.type === 'StartDevelopment' ? c.officerIds : [c.officerId], people = actors(s, before, ids);
    const apCost = c.type === 'StartDevelopment' ? p.development.actionPoints : p.absorption.actionPoints;
    const goldCost = c.type === 'StartDevelopment' ? row(c.facilityKind).goldCost : p.absorption.goldCost;
    if (before.corps.actionPoints < apCost) fail('insufficient-action-points'); if (before.city.gold < goldCost) fail('insufficient-gold');
    let job: Job, createdFacility: Facility | null = null, receiverBefore: Facility | null = null, receiverAfter: Facility | null = null, removedDonor: Facility | null = null;
    if (c.type === 'StartDevelopment') {
      const lot = s.lots.find(l => l.id === c.lotId); if (!lot) fail('unknown-lot');
      if (before.facilities.some(f => f.lotId === lot.id)) fail('occupied-lot');
      if (before.usedFacilityIds.includes(c.facilityId)) fail('facility-id-reused');
      const reference = levelRow(c.facilityKind, 1), required = reference.maxDurability, initial = p.initialWork.mode === 'quarter-floor' ? Math.floor(required / p.initialWork.divisor) : 0;
      const rate = calculateDomesticConstructionRate({ profile: 'domestic-construction-rate-stable-v1', politics: people.map(o => o.politics), facilityDurability: required });
      if (!rate.supported) fail('unsupported-construction-rate'); if (rate.rate <= 0) fail('nonpositive-construction-rate');
      const durationTurns = Math.ceil((required - initial) / rate.rate), dueDate = due(s, before, durationTurns);
      job = { id: env.id, kind: 'development', facilityId: c.facilityId, facilityKind: c.facilityKind, fromLevel: 0, targetLevel: 1, officerIds: [...ids], politics: people.map(o => o.politics),
        startTurn: before.turn, dueTurn: before.turn + durationTurns, dueDate, durationTurns, remainingTurns: durationTurns,
        work: { initial, current: initial, required, perAdvance: rate.rate, rate: clone(rate) }, completedTurn: null };
      createdFacility = { id: c.facilityId, lotId: lot.id, kind: c.facilityKind, level: 1, typeId: reference.typeId, status: 'developing', effectiveLevel: 0, jobId: job.id };
      after.facilities.push(clone(createdFacility)); after.usedFacilityIds.push(c.facilityId);
    } else {
      if (c.receiverId === c.donorId) fail('same-absorption-facility');
      const receiver = before.facilities.find(f => f.id === c.receiverId), donor = before.facilities.find(f => f.id === c.donorId);
      if (!receiver || !donor) fail('facility-not-found');
      if (!row(receiver.kind).absorbable || receiver.kind !== donor.kind) fail('incompatible-absorption-kind');
      if (receiver.status !== 'complete' || donor.status !== 'complete' || receiver.jobId !== null || donor.jobId !== null) fail('facility-busy');
      if (donor.level !== 1 || receiver.level === 3) fail('incompatible-absorption-level');
      const receiverLot = s.lots.find(l => l.id === receiver.lotId)!, donorLot = s.lots.find(l => l.id === donor.lotId)!;
      if (distance(receiverLot.position, donorLot.position) !== 1) fail('facilities-not-adjacent');
      const targetLevel = (receiver.level + 1) as Level, reference = levelRow(receiver.kind, targetLevel);
      const durationTurns = people[0]!.politics >= p.absorption.fastPoliticsThreshold ? p.absorption.fastTurns : p.absorption.slowTurns, dueDate = due(s, before, durationTurns);
      job = { id: env.id, kind: 'absorption', facilityId: receiver.id, facilityKind: receiver.kind, fromLevel: receiver.level, targetLevel, officerIds: [...ids], politics: people.map(o => o.politics),
        startTurn: before.turn, dueTurn: before.turn + durationTurns, dueDate, durationTurns, remainingTurns: durationTurns, work: null, completedTurn: null };
      receiverBefore = clone(receiver); removedDonor = clone(donor);
      receiverAfter = { ...clone(receiver), level: targetLevel, typeId: reference.typeId, status: 'absorbing', effectiveLevel: receiver.level, jobId: job.id };
      after.facilities = after.facilities.filter(f => f.id !== donor.id).map(f => f.id === receiver.id ? clone(receiverAfter!) : f);
    }
    receipt.actionPoints = write(before.corps.actionPoints, -apCost, 255, p.writer.id); after.corps.actionPoints = receipt.actionPoints.after;
    receipt.gold = write(before.city.gold, -goldCost, before.city.goldCapacity, p.writer.id); after.city.gold = receipt.gold.after;
    for (const officerId of ids) { const o = after.officers.find(x => x.id === officerId)!; o.reservationJobId = job.id; o.actedTurn = before.turn; }
    after.jobs.push(clone(job)); receipt.start = { job: clone(job), createdFacility, receiverBefore, receiverAfter, removedDonor, unitChecks: checks };
  }
  after.revision++; receipt.dateAfter = clone(after.date); receipt.turnAfter = after.turn;
  return { snapshot: after, receipt };
}
function append(s: State, command: Envelope): { state: State; receipt: Receipt; duplicate: boolean } {
  const old = s.acceptedCommands.find(entry => entry.envelope.id === command.id);
  if (old) { if (!same(old.envelope, command)) fail('command-id-conflict'); return { state: s, receipt: old.receipt, duplicate: true }; }
  if (command.expectedRevision !== s.snapshot.revision) fail('revision-conflict');
  if (s.acceptedCommands.length >= MAX_HISTORY) fail('history-limit');
  const next = resolve(s.genesis.scenario, s.snapshot, command);
  return { state: { ...s, snapshot: next.snapshot, acceptedCommands: [...s.acceptedCommands, { envelope: command, receipt: next.receipt }] }, receipt: next.receipt, duplicate: false };
}
function reconstruct(v: unknown): State {
  const r = object(v, ['tag', 'schemaVersion', 'profile', 'scope', 'policies', 'catalog', 'policyDigest', 'catalogDigest', 'genesis', 'snapshot', 'acceptedCommands']);
  if (r.tag !== TAG || r.schemaVersion !== 1 || r.profile !== PROFILE || r.scope !== 'independent-fixed-owned-city') fail('unsupported-state-schema');
  const genesis = object(r.genesis, ['scenario', 'snapshot']);
  let s = initialState(scenario(genesis.scenario)); budget({ ok: true, state: s });
  if (!same(r.policies, s.policies) || r.policyDigest !== s.policyDigest) fail('policy-mismatch');
  if (!same(r.catalog, CATALOG) || r.catalogDigest !== CATALOG_DIGEST) fail('catalog-mismatch');
  if (!same(genesis.snapshot, s.snapshot)) fail('genesis-snapshot-mismatch');
  const entries = list(r.acceptedCommands, MAX_HISTORY);
  for (let i = 0; i < entries.length; i++) {
    try {
      const entry = object(entries[i], ['envelope', 'receipt']), next = append(s, envelope(entry.envelope));
      if (next.duplicate) fail('duplicate-accepted-entry');
      // A stored accepted step must also fit the output budget of the original execute call.
      const execution: CommandResult = { ok: true, committed: true, duplicate: false, state: next.state, receipt: next.receipt };
      budget(execution);
      if (!same(entry.receipt, next.receipt)) fail('receipt-mismatch');
      s = next.state;
    } catch (e) { const f = failure(e); fail(f.reason, i, f.blockingUnitId); }
  }
  if (!same(r.snapshot, s.snapshot)) fail('snapshot-mismatch');
  budget(s); return s;
}
/** Creation checks the full external horizon but performs no construction or advance. */
export function createFacilityConstructionState(input: unknown): FacilityConstructionStateResultV1 {
  try { const state = initialState(scenario(detach(input))); const result: StateResult = { ok: true, state }; budget(result); return freeze(result); } catch (e) { return freeze(failure(e)); }
}
function commandResult(input: unknown, rawCommand: unknown): CommandResult {
  const s = reconstruct(detach(input)), command = envelope(detach(rawCommand)), next = append(s, command);
  const result: CommandResult = { ok: true, committed: !next.duplicate, duplicate: next.duplicate, state: next.state, receipt: next.receipt };
  budget(result); return result;
}
/** Pure preview shares the complete execute-output budget and reconstruction path. */
export function previewFacilityConstructionCommand(input: unknown, rawCommand: unknown): FacilityConstructionPreviewResultV1 {
  try { const result = commandResult(input, rawCommand); if (!result.ok) return freeze(result);
    return freeze({ ok: true, committed: false, duplicate: result.duplicate, receipt: result.receipt, projectedSnapshot: result.state.snapshot } as PreviewResult);
  } catch (e) { return freeze(failure(e)); }
}
/** Functional update; no caller-owned state, supplied input, or quote is trusted or mutated. */
export function executeFacilityConstructionCommand(input: unknown, rawCommand: unknown): FacilityConstructionCommandResultV1 {
  try { return freeze(commandResult(input, rawCommand)); } catch (e) { return freeze(failure(e)); }
}
export function saveFacilityConstructionState(input: unknown): FacilityConstructionSaveResultV1 {
  try { const state = reconstruct(detach(input)); const result: SaveResult = { ok: true, json: canonical(state) }; budget(result); return freeze(result); } catch (e) { return freeze(failure(e)); }
}
export function loadFacilityConstructionState(json: unknown): FacilityConstructionStateResultV1 {
  try { const state = reconstruct(parseJson(json)); const result: StateResult = { ok: true, state }; budget(result); return freeze(result); } catch (e) { return freeze(failure(e)); }
}
/** Expected receipts are assertions only; rejected attempts never enter accepted history. */
export function replayFacilityConstructionTrace(input: unknown): FacilityConstructionReplayResultV1 {
  try {
    const r = object(detach(input), ['tag', 'scenario', 'attempts', 'expectedFinalSnapshot']);
    if (r.tag !== TRACE_TAG) fail('unsupported-trace-schema');
    let state = initialState(scenario(r.scenario)); budget({ ok: true, state });
    const attempts = list(r.attempts, MAX_ATTEMPTS), outcomes: ExpectedOutcome[] = [];
    for (let i = 0; i < attempts.length; i++) {
      try {
        const a = object(attempts[i], ['envelope', 'expectedOutcome']);
        let outcome: ExpectedOutcome, candidate = state;
        try {
          const next = append(state, envelope(a.envelope));
          const execution: CommandResult = { ok: true, committed: !next.duplicate, duplicate: next.duplicate, state: next.state, receipt: next.receipt };
          budget(execution); candidate = next.state; outcome = { ok: true, duplicate: next.duplicate, receipt: next.receipt };
        } catch (e) { const f = failure(e); outcome = { ok: false, reason: f.reason, blockingUnitId: f.blockingUnitId }; }
        if (a.expectedOutcome !== null && !same(a.expectedOutcome, outcome)) fail('trace-outcome-mismatch');
        state = candidate; outcomes.push(outcome);
      } catch (e) { const f = failure(e); fail(f.reason, i, f.blockingUnitId); }
    }
    if (r.expectedFinalSnapshot !== null && !same(r.expectedFinalSnapshot, state.snapshot)) fail('trace-snapshot-mismatch');
    const result: ReplayResult = { ok: true, state, outcomes }; budget(result); return freeze(result);
  } catch (e) { return freeze(failure(e)); }
}
function effects(state: State) {
  const s = state.genesis.scenario, snapshot = state.snapshot, e = s.economy;
  const located = s.lots.map(lot => ({ lot, facility: snapshot.facilities.find(f => f.lotId === lot.id) ?? null }));
  const adjacent = (lot: Lot, kind: 'mint' | 'granary') => located.some(x => x.facility?.kind === kind && x.facility.status === 'complete' && distance(lot.position, x.lot.position) === 1);
  const moneySlots: CityMoneyIncomeSlot[] = located.map(({ lot, facility: f }) => f === null ? null : { facilityTypeWord: f.typeId, constructionWord: f.status === 'complete' ? 1 : 0,
    ...(f.kind === 'market' && f.effectiveLevel > 0 ? { adjacentMint: adjacent(lot, 'mint') } : {}) });
  const foodSlots: CityFoodIncomeSlot[] = located.map(({ lot, facility: f }) => f === null ? null : { facilityTypeWord: f.typeId, constructionWord: f.status === 'complete' ? 1 : 0,
    ...(f.kind === 'farm' && f.effectiveLevel > 0 ? { adjacentGranary: adjacent(lot, 'granary') } : {}) });
  while (moneySlots.length < 30) moneySlots.push(null); while (foodSlots.length < 30) foodSlots.push(null);
  const context = { difficultyWord: e.difficulty === 'super' ? 2 : 1, ...(e.difficulty === 'super' ? { cityPlayerPredicate: e.controller === 'player' } : {}), securityByte: e.securityByte };
  const moneyInput: CityMoneyIncomeProjectionInput = { profile: 'city-money-income-stable-resolved-i32-safe-v1', baseMoneyWord: e.baseMoneyWord, slots: moneySlots,
    resolvedTypeRows: { 31: { valid: true, moneyYieldWord: CATALOG.incomeRows.market[0]! }, 50: { valid: true, moneyYieldWord: CATALOG.incomeRows.market[1]! }, 51: { valid: true, moneyYieldWord: CATALOG.incomeRows.market[2]! } }, ...context };
  const foodInput: CityFoodIncomeProjectionInput = { profile: 'city-food-income-stable-resolved-non-easy-u32-v1', baseFoodWord: e.baseFoodWord, slots: foodSlots,
    resolvedTypeRows: { 32: { valid: true, foodYieldWord: CATALOG.incomeRows.farm[0]! }, 52: { valid: true, foodYieldWord: CATALOG.incomeRows.farm[1]! }, 53: { valid: true, foodYieldWord: CATALOG.incomeRows.farm[2]! } }, ...context };
  const moneyResult = calculateCityMoneyIncomeProjection(moneyInput), foodResult = calculateCityFoodIncomeProjection(foodInput);
  if (!moneyResult.supported || !foodResult.supported) fail('unsupported-effects-projection');
  const facilities = located.flatMap(({ lot, facility: f }) => {
    if (f === null) return [];
    const job = f.jobId === null ? null : snapshot.jobs.find(j => j.id === f.jobId)!;
    return [{ facilityId: f.id, lotId: lot.id, kind: f.kind, phase: f.status, targetLevel: f.level, typeId: f.typeId,
      documentedMaxDurability: levelRow(f.kind, f.level).maxDurability, effectiveLevel: f.effectiveLevel, effectActive: f.effectiveLevel > 0,
      constructionLocked: f.jobId !== null, jobId: f.jobId, remainingTurns: job?.remainingTurns ?? 0,
      remainingWork: job?.work ? job.work.required - job.work.current : null, combatHpModeled: false as const }];
  });
  const productionSlots = facilities.filter(f => f.effectActive && ['barracks', 'forge', 'stable', 'workshop', 'shipyard'].includes(f.kind)).map(f => ({ facilityId: f.facilityId, kind: f.kind, effectiveLevel: f.effectiveLevel, slots: 1 as const }));
  return { revision: snapshot.revision, turn: snapshot.turn, date: clone(snapshot.date), policyDigest: state.policyDigest, catalogDigest: state.catalogDigest,
    facilities, productionSlots, lotSlotOrder: [...s.lots.map(l => l.id), ...Array<string | null>(30 - s.lots.length).fill(null)],
    money: { input: moneyInput, result: moneyResult as CityMoneyIncomeProjectionReceipt }, food: { input: foodInput, result: foodResult as CityFoodIncomeProjectionReceipt },
    incomePosted: false as const, externalProductionJobsIntegrated: false as const };
}
export type FacilityConstructionEffectsResultV1 = Frozen<{ ok: true; effects: ReturnType<typeof effects> } | Failure>;
/** Recomputed effective facilities and existing income-kernel projections; no income is posted. */
export function projectFacilityEffects(input: unknown): FacilityConstructionEffectsResultV1 {
  try { const state = reconstruct(detach(input)); const result = { ok: true as const, effects: effects(state) }; budget(result); return freeze(result); }
  catch (e) { return freeze(failure(e)); }
}
