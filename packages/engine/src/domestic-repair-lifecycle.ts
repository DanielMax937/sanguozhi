/** Independent completed-domestic repair from supplied facts; no native task integration. */
import policyData from '../../../data/catalogs/domestic-repair-policies-v1.json' with { type: 'json' };
import catalogData from '../../../data/catalogs/domestic-repair-catalog-v1.json' with { type: 'json' };

type Frozen<T> = T extends object ? { readonly [K in keyof T]: Frozen<T[K]> } : T;
const PROFILE = 'completed-domestic-auto-repair-v1' as const;
const TAG = 'domestic-repair-state-v1' as const;
const TRACE_TAG = 'domestic-repair-trace-v1' as const;
const MAX_BYTES = 67_108_864, MAX_NODES = 4_000_000, MAX_DEPTH = 48, MAX_ARRAY = 4096;
const MAX_HISTORY = 360, MAX_ATTEMPTS = 1080;
type DateV1 = { year: number; month: number; day: 1 | 11 | 21 };
type Position = { q: number; r: number };
type Kind = 'market' | 'farm' | 'barracks' | 'forge' | 'stable' | 'workshop' | 'shipyard' | 'mint' | 'granary';
type Level = 1 | 2 | 3;
/** Supplied repair eligibility flag, not proof of construction-service reachability. */
type Phase = 'complete' | 'building' | 'absorbing';
type City = { id: string; kind: 'city'; ownerForceId: string; position: Position };
type Governor = { id: string; politics: number };
type PrimitiveFacility = { id: string; cityId: string; kind: Kind; level: Level; phase: Phase; position: Position; currentHP: number; maxHP: number };
type Facility = PrimitiveFacility & { typeId: number };
type FieldUnit = { id: string; forceId: string; position: Position };
type TurnInput = { fieldUnits: FieldUnit[] };
type Policies = typeof policyData;
type Catalog = typeof catalogData;
type Scenario = { schemaVersion: 1; profile: typeof PROFILE; date: DateV1; turn: number; advanceLimit: number; city: City; governor: Governor | null; engineering: boolean; facilities: PrimitiveFacility[]; hostileForceIds: string[]; completeFieldUnits: true; turnInputs: TurnInput[]; policies: Policies; catalog: Catalog };
type Snapshot = { schemaVersion: 1; profile: typeof PROFILE; revision: number; advancedCount: number; date: DateV1; turn: number; facilities: Facility[]; fieldUnits: FieldUnit[] | null };
type Command = { type: 'AdvanceRepairTurn' };
type Envelope = { id: string; expectedRevision: number; command: Command };
type Write = { before: number; requestedDelta: number; actualDelta: number; after: number; cap: number; discarded: number; policyId: string };
type Pressure = { closestHostileUnitId: string | null; distance: number | null; blocked: boolean };
type Arithmetic = { politics: number; multipliedPolitics: number; halfFloor: number; clampedBase: number; engineering: boolean; numerator: number; denominator: number; numeratorProduct: number; requestedRecovery: number; policyId: string };
type Repair = { facilityId: string; kind: Kind; level: Level; typeId: number; position: Position; phase: Phase; status: 'repaired' | 'not-complete' | 'already-full' | 'hostile-nearby' | 'no-governor'; pressure: Pressure; arithmetic: Arithmetic | null; hp: Write };
type HpFull = { type: 'DomesticFacilityHpFull'; facilityId: string; turn: number; currentHP: number; maxHP: number; policyId: string };
const BOUNDARY = { sourceLevel: 'public-mixed-research-listing-with-explicit-service-policies', nativeExecution: false, stockVerified: false,
  formula: 'listed-domestic-uint8-governor9-integer-branch', enemyDistance: 'source-comment-derived-distance-policy',
  hpWriter: 'standalone-clamp-to-max-policy', maxHp: 'supplied-positive-signed16-fact', parentCityAndGovernor: 'supplied-fixed-resolved-facts',
  globalSchedulerRecovered: false, nativeCallbacksRecovered: false, constructionWorkIntegrated: false, productionOccupancyGate: false } as const;
type Receipt = { schemaVersion: 1; profile: typeof PROFILE; commandId: string; command: Command; revisionBefore: number; revisionAfter: number; dateBefore: DateV1; dateAfter: DateV1; turnBefore: number; turnAfter: number; policyDigest: string; catalogDigest: string; sourceBoundary: typeof BOUNDARY;
  city: City; governor: Governor | null; engineering: boolean; inputIndex: number; inputOrigin: 'fixed-external-scenario'; completeFieldUnits: true; input: TurnInput; repairs: Repair[]; events: HpFull[]; rngDraws: 0 };
type State = { tag: typeof TAG; schemaVersion: 1; profile: typeof PROFILE; scope: 'independent-fixed-owned-city'; policies: Policies; catalog: Catalog; policyDigest: string; catalogDigest: string; genesis: { scenario: Scenario; snapshot: Snapshot }; snapshot: Snapshot; acceptedCommands: { envelope: Envelope; receipt: Receipt }[] };
type Failure = { ok: false; committed: false; reason: string; index: number | null };
type StateResult = { ok: true; state: State } | Failure;
type CommandResult = { ok: true; committed: boolean; duplicate: boolean; state: State; receipt: Receipt } | Failure;
type PreviewResult = { ok: true; committed: false; duplicate: boolean; receipt: Receipt; projectedSnapshot: Snapshot } | Failure;
type SaveResult = { ok: true; json: string } | Failure;
type ExpectedOutcome = { ok: true; duplicate: boolean; receipt: Receipt } | { ok: false; reason: string };
type Trace = { tag: typeof TRACE_TAG; scenario: Scenario; attempts: { envelope: Envelope; expectedOutcome: ExpectedOutcome | null }[]; expectedFinalSnapshot: Snapshot | null };
type ReplayResult = { ok: true; state: State; outcomes: ExpectedOutcome[] } | Failure;
export type DomesticRepairScenarioV1 = Frozen<Scenario>;
export type DomesticRepairStateV1 = Frozen<State>;
export type DomesticRepairSnapshotV1 = Frozen<Snapshot>;
export type DomesticRepairCommandV1 = Frozen<Command>;
export type DomesticRepairEnvelopeV1 = Frozen<Envelope>;
export type DomesticRepairPoliciesV1 = Frozen<Policies>;
export type DomesticRepairCatalogV1 = Frozen<Catalog>;
export type DomesticRepairFacilityV1 = Frozen<Facility>;
export type DomesticRepairWriteV1 = Frozen<Write>;
export type DomesticRepairArithmeticV1 = Frozen<Arithmetic>;
export type DomesticRepairPressureV1 = Frozen<Pressure>;
export type DomesticRepairRepairV1 = Frozen<Repair>;
export type DomesticRepairHpFullV1 = Frozen<HpFull>;
export type DomesticRepairReceiptV1 = Frozen<Receipt>;
export type DomesticRepairFailureV1 = Frozen<Failure>;
export type DomesticRepairStateResultV1 = Frozen<StateResult>;
export type DomesticRepairCommandResultV1 = Frozen<CommandResult>;
export type DomesticRepairPreviewResultV1 = Frozen<PreviewResult>;
export type DomesticRepairSaveResultV1 = Frozen<SaveResult>;
export type DomesticRepairTraceV1 = Frozen<Trace>;
export type DomesticRepairReplayResultV1 = Frozen<ReplayResult>;

class Invalid extends Error {
  readonly reason: string; readonly index: number | null;
  constructor(reason: string, index: number | null = null) { super(reason); this.reason = reason; this.index = index; }
}
function fail(reason: string, index: number | null = null): never { throw new Invalid(reason, index); }
function failure(e: unknown): Failure { return { ok: false, committed: false, reason: e instanceof Invalid ? e.reason : 'invalid-data', index: e instanceof Invalid ? e.index : null }; }
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
const POLICIES = clone(policyData), POLICY_DIGEST = digest(POLICIES);
const CATALOG = clone(catalogData), CATALOG_DIGEST = digest(CATALOG);
export const DOMESTIC_REPAIR_POLICY_REGISTRY_V1 = freeze([clone(POLICIES)]);
export const DOMESTIC_REPAIR_DEFAULT_POLICIES_V1 = freeze(POLICIES);
export const DOMESTIC_REPAIR_POLICY_DIGEST_V1 = POLICY_DIGEST;
export const DOMESTIC_REPAIR_CATALOG_V1 = freeze(CATALOG);
export const DOMESTIC_REPAIR_CATALOG_DIGEST_V1 = CATALOG_DIGEST;
export const DOMESTIC_REPAIR_EVIDENCE_V1 = freeze(BOUNDARY);
function position(v: unknown): Position { const r = object(v, ['q', 'r']); return { q: uint(r.q, 1_000_000, -1_000_000), r: uint(r.r, 1_000_000, -1_000_000) }; }
function distance(a: Position, b: Position): number { const q = a.q - b.q, r = a.r - b.r; return Math.max(Math.abs(q), Math.abs(r), Math.abs(q + r)); }
function unique<T>(items: T[], reason: string): void { if (new Set(items).size !== items.length) fail(reason); }
function level(v: unknown): Level { if (v !== 1 && v !== 2 && v !== 3) fail('invalid-level'); return v; }
function typeId(kind: Kind, n: Level): number { const row = CATALOG.entries.find(e => e.kind === kind)?.levels.find(e => e.level === n); if (!row) fail('unsupported-facility-level'); return row.typeId; }
function units(v: unknown): FieldUnit[] {
  const result = list(v, 128).map(x => { const r = object(x, ['id', 'forceId', 'position']); return { id: id(r.id), forceId: id(r.forceId), position: position(r.position) }; });
  unique(result.map(x => x.id), 'duplicate-field-unit'); return result;
}
function turnInput(v: unknown): TurnInput { const r = object(v, ['fieldUnits']); return { fieldUnits: units(r.fieldUnits) }; }
function scenario(v: unknown): Scenario {
  const r = object(v, ['schemaVersion', 'profile', 'date', 'turn', 'advanceLimit', 'city', 'governor', 'engineering', 'facilities', 'hostileForceIds', 'completeFieldUnits', 'turnInputs', 'policies', 'catalog']);
  if (r.schemaVersion !== 1 || r.profile !== PROFILE) fail('unsupported-scenario-schema');
  const initialDate = date(r.date), turn = uint(r.turn), advanceLimit = uint(r.advanceLimit, 360, 1);
  if (!Number.isSafeInteger(turn + advanceLimit)) fail('turn-overflow');
  let lastDate = initialDate; for (let i = 0; i < advanceLimit; i++) lastDate = nextDate(lastDate);
  const c = object(r.city, ['id', 'kind', 'ownerForceId', 'position']);
  if (c.kind !== 'city') fail('unsupported-city-kind');
  const city: City = { id: id(c.id), kind: 'city', ownerForceId: id(c.ownerForceId), position: position(c.position) };
  let governor: Governor | null = null;
  if (r.governor !== null) { const g = object(r.governor, ['id', 'politics']); governor = { id: id(g.id), politics: uint(g.politics, 255) }; }
  const engineering = bool(r.engineering);
  const facilities: PrimitiveFacility[] = list(r.facilities, 30).map(x => {
    const f = object(x, ['id', 'cityId', 'kind', 'level', 'phase', 'position', 'currentHP', 'maxHP']);
    const kind = choice(f.kind, KINDS, 'unsupported-facility'), n = level(f.level), cityId = id(f.cityId);
    typeId(kind, n); if (cityId !== city.id) fail('facility-city-mismatch');
    const maxHP = uint(f.maxHP, 32767, 1), at = position(f.position);
    if (distance(at, city.position) === 0) fail('facility-at-city');
    return { id: id(f.id), cityId, kind, level: n, phase: choice(f.phase, ['complete', 'building', 'absorbing'], 'unsupported-phase'), position: at, currentHP: uint(f.currentHP, maxHP, 1), maxHP };
  });
  unique(facilities.map(f => f.id), 'duplicate-facility'); unique(facilities.map(f => canonical(f.position)), 'duplicate-facility-position');
  const hostileForceIds = list(r.hostileForceIds, 128).map(id); unique(hostileForceIds, 'duplicate-hostile-force');
  if (hostileForceIds.includes(city.ownerForceId)) fail('own-force-hostile');
  if (r.completeFieldUnits !== true) fail('incomplete-field-unit-snapshot');
  const turnInputs = list(r.turnInputs, 360).map(turnInput);
  if (turnInputs.length !== advanceLimit) fail('incomplete-turn-input-horizon');
  if (!same(r.policies, POLICIES)) fail('policy-mismatch');
  if (!same(r.catalog, CATALOG)) fail('catalog-mismatch');
  return { schemaVersion: 1, profile: PROFILE, date: initialDate, turn, advanceLimit, city, governor, engineering, facilities, hostileForceIds, completeFieldUnits: true, turnInputs, policies: clone(POLICIES), catalog: clone(CATALOG) };
}
function envelope(v: unknown): Envelope {
  const r = object(v, ['id', 'expectedRevision', 'command']), c = object(r.command, ['type']);
  if (c.type !== 'AdvanceRepairTurn') fail('unsupported-command');
  return { id: id(r.id), expectedRevision: uint(r.expectedRevision, MAX_HISTORY), command: { type: 'AdvanceRepairTurn' } };
}
function initialState(s: Scenario): State {
  const snapshot: Snapshot = { schemaVersion: 1, profile: PROFILE, revision: 0, advancedCount: 0, date: clone(s.date), turn: s.turn,
    facilities: s.facilities.map(f => ({ ...clone(f), typeId: typeId(f.kind, f.level) })), fieldUnits: null };
  return { tag: TAG, schemaVersion: 1, profile: PROFILE, scope: 'independent-fixed-owned-city', policies: clone(POLICIES), catalog: clone(CATALOG), policyDigest: POLICY_DIGEST, catalogDigest: CATALOG_DIGEST,
    genesis: { scenario: clone(s), snapshot: clone(snapshot) }, snapshot, acceptedCommands: [] };
}
/** The source comment supplies the radius; this does not reconstruct native helper 004B99B0. */
function pressure(s: Scenario, facility: Facility, fieldUnits: FieldUnit[]): Pressure {
  let closest: FieldUnit | null = null, nearest: number | null = null;
  for (const u of fieldUnits) {
    if (!s.hostileForceIds.includes(u.forceId)) continue;
    const d = distance(facility.position, u.position);
    if (nearest === null || d < nearest || (d === nearest && closest !== null && u.id < closest.id)) { closest = u; nearest = d; }
  }
  return { closestHostileUnitId: closest?.id ?? null, distance: nearest, blocked: nearest !== null && nearest <= s.policies.hostility.facilityCenteredBlockingDistanceInclusive };
}
/** Nonnegative uint8 politics: all intermediate products are exact small integers. */
function recovery(s: Scenario, governor: Governor): Arithmetic {
  const p = s.policies.recovery, politics = governor.politics, multipliedPolitics = p.baseNumerator * politics;
  const halfFloor = Math.floor(multipliedPolitics / p.baseDenominator), clampedBase = Math.min(p.baseMax, Math.max(p.baseMin, halfFloor));
  const numerator = p.recoveryNumerator, denominator = s.engineering ? p.engineeringDenominator : p.ordinaryDenominator;
  const numeratorProduct = numerator * clampedBase, requestedRecovery = Math.floor(numeratorProduct / denominator);
  return { politics, multipliedPolitics, halfFloor, clampedBase, engineering: s.engineering, numerator, denominator, numeratorProduct, requestedRecovery, policyId: p.id };
}
function write(before: number, requestedDelta: number, cap: number): Write {
  const actualDelta = Math.min(requestedDelta, cap - before);
  return { before, requestedDelta, actualDelta, after: before + actualDelta, cap, discarded: requestedDelta - actualDelta, policyId: POLICIES.writer.id };
}
function resolve(s: Scenario, before: Snapshot, env: Envelope): { snapshot: Snapshot; receipt: Receipt } {
  if (before.advancedCount >= s.advanceLimit) fail('advance-limit');
  const input = s.turnInputs[before.advancedCount]; if (!input) fail('missing-turn-input');
  const after = clone(before); after.date = nextDate(before.date); after.turn++; after.advancedCount++; after.revision++;
  after.fieldUnits = clone(input.fieldUnits);
  const repairs: Repair[] = [], events: HpFull[] = [];
  for (const f of [...after.facilities].sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0)) {
    const nearby = pressure(s, f, input.fieldUnits);
    const status: Repair['status'] = f.phase !== 'complete' ? 'not-complete' : f.currentHP === f.maxHP ? 'already-full' : nearby.blocked ? 'hostile-nearby' : s.governor === null ? 'no-governor' : 'repaired';
    const arithmetic = status === 'repaired' && s.governor !== null ? recovery(s, s.governor) : null;
    const hp = write(f.currentHP, arithmetic?.requestedRecovery ?? 0, f.maxHP);
    f.currentHP = hp.after;
    repairs.push({ facilityId: f.id, kind: f.kind, level: f.level, typeId: f.typeId, position: clone(f.position), phase: f.phase, status, pressure: nearby, arithmetic, hp });
    if (hp.actualDelta > 0 && hp.after === hp.cap) events.push({ type: 'DomesticFacilityHpFull', facilityId: f.id, turn: after.turn, currentHP: hp.after, maxHP: hp.cap, policyId: s.policies.events.id });
  }
  const receipt: Receipt = { schemaVersion: 1, profile: PROFILE, commandId: env.id, command: clone(env.command), revisionBefore: before.revision, revisionAfter: after.revision,
    dateBefore: clone(before.date), dateAfter: clone(after.date), turnBefore: before.turn, turnAfter: after.turn, policyDigest: POLICY_DIGEST, catalogDigest: CATALOG_DIGEST, sourceBoundary: clone(BOUNDARY),
    city: clone(s.city), governor: clone(s.governor), engineering: s.engineering, inputIndex: before.advancedCount, inputOrigin: 'fixed-external-scenario', completeFieldUnits: true, input: clone(input), repairs, events, rngDraws: 0 };
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
  if (!same(r.policies, POLICIES) || r.policyDigest !== POLICY_DIGEST) fail('policy-mismatch');
  if (!same(r.catalog, CATALOG) || r.catalogDigest !== CATALOG_DIGEST) fail('catalog-mismatch');
  if (!same(genesis.snapshot, s.snapshot)) fail('genesis-snapshot-mismatch');
  const entries = list(r.acceptedCommands, MAX_HISTORY);
  for (let i = 0; i < entries.length; i++) {
    try {
      const entry = object(entries[i], ['envelope', 'receipt']), next = append(s, envelope(entry.envelope));
      if (next.duplicate) fail('duplicate-accepted-entry');
      // Persisted history cannot bypass the original execute result's complete budget.
      const execution: CommandResult = { ok: true, committed: true, duplicate: false, state: next.state, receipt: next.receipt };
      budget(execution);
      if (!same(entry.receipt, next.receipt)) fail('receipt-mismatch');
      s = next.state;
    } catch (e) { const f = failure(e); fail(f.reason, i); }
  }
  if (!same(r.snapshot, s.snapshot)) fail('snapshot-mismatch');
  budget(s); return s;
}
/** Validates the complete supplied horizon; creation performs no HP write. */
export function createDomesticRepairState(input: unknown): DomesticRepairStateResultV1 {
  try { const state = initialState(scenario(detach(input))); const result: StateResult = { ok: true, state }; budget(result); return freeze(result); } catch (e) { return freeze(failure(e)); }
}
function commandResult(input: unknown, rawCommand: unknown): CommandResult {
  const s = reconstruct(detach(input)), command = envelope(detach(rawCommand)), next = append(s, command);
  const result: CommandResult = { ok: true, committed: !next.duplicate, duplicate: next.duplicate, state: next.state, receipt: next.receipt };
  budget(result); return result;
}
/** Preview enforces the execute output budget before returning its own smaller result. */
export function previewDomesticRepairCommand(input: unknown, rawCommand: unknown): DomesticRepairPreviewResultV1 {
  try { const result = commandResult(input, rawCommand); if (!result.ok) return freeze(result);
    const preview: PreviewResult = { ok: true, committed: false, duplicate: result.duplicate, receipt: result.receipt, projectedSnapshot: result.state.snapshot };
    budget(preview); return freeze(preview);
  } catch (e) { return freeze(failure(e)); }
}
/** Pure functional state update; invalid input and failed result budgets commit nothing. */
export function executeDomesticRepairCommand(input: unknown, rawCommand: unknown): DomesticRepairCommandResultV1 {
  try { return freeze(commandResult(input, rawCommand)); } catch (e) { return freeze(failure(e)); }
}
export function saveDomesticRepairState(input: unknown): DomesticRepairSaveResultV1 {
  try { const state = reconstruct(detach(input)); const result: SaveResult = { ok: true, json: canonical(state) }; budget(result); return freeze(result); } catch (e) { return freeze(failure(e)); }
}
export function loadDomesticRepairState(json: unknown): DomesticRepairStateResultV1 {
  try { const state = reconstruct(parseJson(json)); const result: StateResult = { ok: true, state }; budget(result); return freeze(result); } catch (e) { return freeze(failure(e)); }
}
/** Optional expected values are assertions; the source of every result is the genesis facts. */
export function replayDomesticRepairTrace(input: unknown): DomesticRepairReplayResultV1 {
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
        } catch (e) { const f = failure(e); outcome = { ok: false, reason: f.reason }; }
        if (a.expectedOutcome !== null && !same(a.expectedOutcome, outcome)) fail('trace-outcome-mismatch');
        state = candidate; outcomes.push(outcome);
      } catch (e) { const f = failure(e); fail(f.reason, i); }
    }
    if (r.expectedFinalSnapshot !== null && !same(r.expectedFinalSnapshot, state.snapshot)) fail('trace-snapshot-mismatch');
    const result: ReplayResult = { ok: true, state, outcomes }; budget(result); return freeze(result);
  } catch (e) { return freeze(failure(e)); }
}
