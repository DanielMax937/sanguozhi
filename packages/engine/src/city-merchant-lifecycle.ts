/** Independent supplied-city merchant service; observed pricing and explicit provisional writers. */
import policyData from '../../../data/catalogs/city-merchant-policies-v1.json' with { type: 'json' };
import catalogData from '../../../data/catalogs/city-merchant-politics-v1.json' with { type: 'json' };
import type { Position, UiPrice, Corps, City, Officer, FieldUnit, Policies, Catalog, Write, TradeDetail,
  MerchantTradeFrame, MerchantTradeAudit } from './internal/city-merchant-types.ts';
import { reduceMerchantTrade } from './internal/city-merchant-trade-reducer.ts';

type Frozen<T> = T extends object ? { readonly [K in keyof T]: Frozen<T[K]> } : T;
const PROFILE = 'standalone-city-merchant-v1' as const;
const TAG = 'city-merchant-state-v1' as const;
const TRACE_TAG = 'city-merchant-trace-v1' as const;
const MAX_BYTES = 67_108_864, MAX_NODES = 4_000_000, MAX_DEPTH = 48, MAX_ARRAY = 4096;
type DateV1 = { year: number; month: number; day: 1 | 11 | 21 };
type TurnInput = { merchantPresent: boolean; uiTradePrice: UiPrice; fieldUnits: FieldUnit[] };
type Scenario = { schemaVersion: 1; profile: typeof PROFILE; date: DateV1; turn: number; advanceLimit: number; activeForceId: string; corps: Corps; city: City; officers: Officer[]; hostileForceIds: string[]; completeFieldUnits: true; fieldUnits: FieldUnit[]; turnInputs: TurnInput[]; policies: Policies; catalog: Catalog };
type Snapshot = { schemaVersion: 1; profile: typeof PROFILE; revision: number; advancedCount: number; date: DateV1; turn: number; corps: Corps; city: City; officers: Officer[]; completeFieldUnits: true; fieldUnits: FieldUnit[] };
type TradeCommand = { type: 'BuyFood' | 'SellFood'; cityId: string; officerId: string; foodAmount: number };
type Command = TradeCommand | { type: 'AdvanceMerchantTurn' };
type Envelope = { id: string; expectedRevision: number; command: Command };
const BOUNDARY = { sourceLevel: 'official-command-and-empirical-lookup-with-provisional-service', nativeExecution: false, stockVerified: false,
  pricingEvidence: 'approximate-observed-anchors-selected-as-exact-service-constants', roundingAndWriter: 'provisional-engine-rule', suppliedGeometryAndHostility: 'provisional-engine-rule',
  schedulerAndAp: 'provisional-engine-rule', nativeFullFinance: false } as const;
type Receipt = {
  schemaVersion: 1; profile: typeof PROFILE; commandId: string; command: Command; revisionBefore: number; revisionAfter: number;
  dateBefore: DateV1; dateAfter: DateV1; turnBefore: number; turnAfter: number; policyDigest: string; catalogDigest: string; sourceBoundary: typeof BOUNDARY;
  ownerSnapshot: { activeForceId: string; ownerForceId: string; corpsId: string; corpsForceId: string }; cityId: string;
  actionPoints: { before: number; requestedDelta: number; actualDelta: number; after: number; cap: 255; policyId: string };
  fixedGoldFee: 0; meritDelta: 0; techniquePointsDelta: 0; loyaltyDelta: 0; rngDraws: 0;
  trade: TradeDetail | null; advance: { inputIndex: number; origin: 'fixed-external-scenario'; input: TurnInput; apRecoveryPolicyId: string } | null;
};
type State = { tag: typeof TAG; schemaVersion: 1; profile: typeof PROFILE; scope: 'independent-fixed-owned-city'; policies: Policies; catalog: Catalog; policyDigest: string; catalogDigest: string; genesis: { scenario: Scenario; snapshot: Snapshot }; snapshot: Snapshot; acceptedCommands: { envelope: Envelope; receipt: Receipt }[] };
type Failure = { ok: false; committed: false; reason: string; index: number | null; blockingUnitId: string | null };
type StateResult = { ok: true; state: State } | Failure;
type CommandResult = { ok: true; committed: boolean; duplicate: boolean; state: State; receipt: Receipt } | Failure;
type PreviewResult = { ok: true; committed: false; duplicate: boolean; receipt: Receipt; projectedSnapshot: Snapshot } | Failure;
type SaveResult = { ok: true; json: string } | Failure;
type ExpectedOutcome = { ok: true; duplicate: boolean; receipt: Receipt } | { ok: false; reason: string; blockingUnitId: string | null };
type Trace = { tag: typeof TRACE_TAG; scenario: Scenario; attempts: { envelope: Envelope; expectedOutcome: ExpectedOutcome | null }[]; expectedFinalSnapshot: Snapshot | null };
type ReplayResult = { ok: true; state: State; outcomes: ExpectedOutcome[] } | Failure;
export type CityMerchantScenarioV1 = Frozen<Scenario>;
export type CityMerchantStateV1 = Frozen<State>;
export type CityMerchantSnapshotV1 = Frozen<Snapshot>;
export type CityMerchantCommandV1 = Frozen<Command>;
export type CityMerchantEnvelopeV1 = Frozen<Envelope>;
export type CityMerchantPoliciesV1 = Frozen<Policies>;
export type CityMerchantCatalogV1 = Frozen<Catalog>;
export type CityMerchantReceiptV1 = Frozen<Receipt>;
export type CityMerchantWriteV1 = Frozen<Write>;
export type CityMerchantFailureV1 = Frozen<Failure>;
export type CityMerchantStateResultV1 = Frozen<StateResult>;
export type CityMerchantCommandResultV1 = Frozen<CommandResult>;
export type CityMerchantPreviewResultV1 = Frozen<PreviewResult>;
export type CityMerchantSaveResultV1 = Frozen<SaveResult>;
export type CityMerchantTraceV1 = Frozen<Trace>;
export type CityMerchantReplayResultV1 = Frozen<ReplayResult>;

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
const REGISTRY: Policies[] = policyData.apRecoveryPolicies.map(apRecovery => ({ ...clone(policyData.common), apRecovery: clone(apRecovery) }));
const DEFAULT_POLICIES = REGISTRY.find(p => p.apRecovery.id === policyData.defaultApRecoveryId)!;
const CATALOG = clone(catalogData), CATALOG_DIGEST = digest(CATALOG);
export const CITY_MERCHANT_POLICY_REGISTRY_V1 = freeze(REGISTRY);
export const CITY_MERCHANT_DEFAULT_POLICIES_V1 = freeze(DEFAULT_POLICIES);
export const CITY_MERCHANT_CATALOG_V1 = freeze(CATALOG);
export const CITY_MERCHANT_CATALOG_DIGEST_V1 = CATALOG_DIGEST;
export const CITY_MERCHANT_EVIDENCE_V1 = freeze(BOUNDARY);
function position(v: unknown): Position { const r = object(v, ['q', 'r']); return { q: uint(r.q, 1_000_000, -1_000_000), r: uint(r.r, 1_000_000, -1_000_000) }; }
function price(v: unknown): UiPrice { if (v !== 3 && v !== 4 && v !== 5 && v !== 6 && v !== 7) fail('invalid-ui-trade-price'); return v; }
function marker(v: unknown, turn: number): number | null { return v === null ? null : uint(v, turn); }
function city(v: unknown, turn: number): City {
  const r = object(v, ['id', 'kind', 'ownerForceId', 'position', 'gold', 'goldCapacity', 'food', 'foodCapacity', 'merchantPresent', 'uiTradePrice', 'merchantUsedTurn']);
  if (r.kind !== 'city') fail('unsupported-city-kind');
  const goldCapacity = uint(r.goldCapacity, 1_000_000_000), foodCapacity = uint(r.foodCapacity, 1_000_000_000);
  return { id: id(r.id), kind: 'city', ownerForceId: id(r.ownerForceId), position: position(r.position), gold: uint(r.gold, goldCapacity), goldCapacity,
    food: uint(r.food, foodCapacity), foodCapacity, merchantPresent: bool(r.merchantPresent), uiTradePrice: price(r.uiTradePrice), merchantUsedTurn: marker(r.merchantUsedTurn, turn) };
}
function officer(v: unknown, turn: number): Officer {
  const r = object(v, ['id', 'forceId', 'cityId', 'available', 'politics', 'politicsXp', 'actedTurn']);
  return { id: id(r.id), forceId: id(r.forceId), cityId: id(r.cityId), available: bool(r.available), politics: uint(r.politics, 100, 20), politicsXp: uint(r.politicsXp, 1_000_000_000), actedTurn: marker(r.actedTurn, turn) };
}
function units(v: unknown): FieldUnit[] {
  const result = list(v, 4096).map((x): FieldUnit => { const r = object(x, ['id', 'forceId', 'position']); return { id: id(r.id), forceId: id(r.forceId), position: position(r.position) }; });
  if (new Set(result.map(u => u.id)).size !== result.length) fail('duplicate-field-unit'); return result;
}
function turnInput(v: unknown): TurnInput { const r = object(v, ['merchantPresent', 'uiTradePrice', 'fieldUnits']); return { merchantPresent: bool(r.merchantPresent), uiTradePrice: price(r.uiTradePrice), fieldUnits: units(r.fieldUnits) }; }
function scenario(v: unknown): Scenario {
  const r = object(v, ['schemaVersion', 'profile', 'date', 'turn', 'advanceLimit', 'activeForceId', 'corps', 'city', 'officers', 'hostileForceIds', 'completeFieldUnits', 'fieldUnits', 'turnInputs', 'policies', 'catalog']);
  if (r.schemaVersion !== 1 || r.profile !== PROFILE) fail('unsupported-schema-profile');
  const initialDate = date(r.date), advanceLimit = uint(r.advanceLimit, 360, 1), turn = uint(r.turn, Number.MAX_SAFE_INTEGER - advanceLimit);
  // Validate the entire horizon, rather than admitting a scenario that fails only after partial progress.
  let end = initialDate; for (let i = 0; i < advanceLimit; i++) end = nextDate(end);
  const activeForceId = id(r.activeForceId), parsedCity = city(r.city, turn), c = object(r.corps, ['id', 'forceId', 'actionPoints']);
  const corps: Corps = { id: id(c.id), forceId: id(c.forceId), actionPoints: uint(c.actionPoints, 255) };
  if (parsedCity.ownerForceId !== activeForceId || corps.forceId !== activeForceId) fail('owner-corps-mismatch');
  const officers = list(r.officers, 256).map(o => officer(o, turn));
  if (new Set(officers.map(o => o.id)).size !== officers.length) fail('duplicate-officer');
  const hostileForceIds = list(r.hostileForceIds, 256).map(id);
  if (new Set(hostileForceIds).size !== hostileForceIds.length) fail('duplicate-hostile-force');
  if (hostileForceIds.includes(activeForceId)) fail('owner-marked-hostile');
  if (r.completeFieldUnits !== true) fail('incomplete-field-unit-snapshot');
  const fieldUnits = units(r.fieldUnits), turnInputs = list(r.turnInputs, 360).map(turnInput);
  if (turnInputs.length !== advanceLimit) fail('incomplete-turn-input-horizon');
  const policies = REGISTRY.find(p => same(r.policies, p)); if (!policies) fail('policy-mismatch');
  if (!same(r.catalog, CATALOG)) fail('catalog-mismatch');
  return { schemaVersion: 1, profile: PROFILE, date: initialDate, turn, advanceLimit, activeForceId, corps, city: parsedCity, officers, hostileForceIds,
    completeFieldUnits: true, fieldUnits, turnInputs, policies: clone(policies), catalog: clone(CATALOG) };
}
function envelope(v: unknown): Envelope {
  const r = object(v, ['id', 'expectedRevision', 'command']);
  if (r.command === null || typeof r.command !== 'object' || Array.isArray(r.command)) fail('invalid-command');
  const kind = (r.command as Record<string, unknown>).type;
  let command: Command;
  if (kind === 'AdvanceMerchantTurn') { object(r.command, ['type']); command = { type: kind }; }
  else if (kind === 'BuyFood' || kind === 'SellFood') {
    const c = object(r.command, ['type', 'cityId', 'officerId', 'foodAmount']);
    command = { type: kind, cityId: id(c.cityId), officerId: id(c.officerId), foodAmount: uint(c.foodAmount, 1_000_000_000, 1) };
  } else return fail('unsupported-command');
  return { id: id(r.id), expectedRevision: uint(r.expectedRevision, 721), command };
}
function initialState(s: Scenario): State {
  const snapshot: Snapshot = { schemaVersion: 1, profile: PROFILE, revision: 0, advancedCount: 0, date: clone(s.date), turn: s.turn, corps: clone(s.corps), city: clone(s.city), officers: clone(s.officers), completeFieldUnits: true, fieldUnits: clone(s.fieldUnits) };
  return { tag: TAG, schemaVersion: 1, profile: PROFILE, scope: 'independent-fixed-owned-city', policies: clone(s.policies), catalog: clone(CATALOG), policyDigest: digest(s.policies), catalogDigest: CATALOG_DIGEST,
    genesis: { scenario: s, snapshot: clone(snapshot) }, snapshot, acceptedCommands: [] };
}
function resolve(s: Scenario, before: Snapshot, env: Envelope): { snapshot: Snapshot; receipt: Receipt } {
  const after = clone(before), p = s.policies;
  const receipt: Receipt = { schemaVersion: 1, profile: PROFILE, commandId: env.id, command: clone(env.command), revisionBefore: before.revision, revisionAfter: before.revision + 1,
    dateBefore: clone(before.date), dateAfter: clone(before.date), turnBefore: before.turn, turnAfter: before.turn, policyDigest: digest(p), catalogDigest: CATALOG_DIGEST, sourceBoundary: clone(BOUNDARY),
    ownerSnapshot: { activeForceId: s.activeForceId, ownerForceId: before.city.ownerForceId, corpsId: before.corps.id, corpsForceId: before.corps.forceId }, cityId: before.city.id,
    actionPoints: { before: before.corps.actionPoints, requestedDelta: 0, actualDelta: 0, after: before.corps.actionPoints, cap: 255, policyId: p.eligibility.id },
    fixedGoldFee: 0, meritDelta: 0, techniquePointsDelta: 0, loyaltyDelta: 0, rngDraws: 0, trade: null, advance: null };
  if (env.command.type === 'AdvanceMerchantTurn') {
    if (before.advancedCount >= s.advanceLimit) fail('advance-limit');
    if (before.turn >= Number.MAX_SAFE_INTEGER) fail('turn-overflow');
    const input = s.turnInputs[before.advancedCount]; if (!input) fail('missing-turn-input');
    after.date = nextDate(before.date); after.turn++; after.advancedCount++;
    after.city.merchantPresent = input.merchantPresent; after.city.uiTradePrice = input.uiTradePrice; after.fieldUnits = clone(input.fieldUnits);
    after.corps.actionPoints = Math.min(p.apRecovery.cap, before.corps.actionPoints + p.apRecovery.perAdvance);
    receipt.actionPoints = { before: before.corps.actionPoints, requestedDelta: p.apRecovery.perAdvance, actualDelta: after.corps.actionPoints - before.corps.actionPoints, after: after.corps.actionPoints, cap: 255, policyId: p.apRecovery.id };
    receipt.advance = { inputIndex: before.advancedCount, origin: 'fixed-external-scenario', input: clone(input), apRecoveryPolicyId: p.apRecovery.id };
  } else {
    const c = env.command;
    // Project only this trade's read set into an owner-owned plain-data view.
    const frame: MerchantTradeFrame = clone({ activeForceId: s.activeForceId, hostileForceIds: s.hostileForceIds,
      corps: before.corps, city: before.city, officers: before.officers,
      completeFieldUnits: before.completeFieldUnits, fieldUnits: before.fieldUnits,
      policies: { ownership: p.ownership, eligibility: p.eligibility, hostility: p.hostility, pricing: p.pricing,
        zeroSale: p.zeroSale, capacity: p.capacity, rewards: p.rewards }, catalog: CATALOG });
    const result = reduceMerchantTrade({ commandId: env.id, turn: before.turn }, frame, clone(c));
    if (!result.ok) fail(result.reason, null, result.blockingUnitId);
    const candidate = result.candidate, actorIndex = before.officers.findIndex(o => o.id === c.officerId);
    after.city.gold = candidate.city.gold; after.city.food = candidate.city.food;
    after.corps.actionPoints = candidate.corps.actionPoints; after.city.merchantUsedTurn = candidate.city.merchantUsedTurn;
    after.officers[actorIndex]!.actedTurn = candidate.officers[actorIndex]!.actedTurn;
    after.officers[actorIndex]!.politicsXp = candidate.officers[actorIndex]!.politicsXp;
    // Copy the owned audit structurally, preserving every number without a JSON round trip.
    const audit: MerchantTradeAudit = { ...result.audit,
      ownerSnapshot: { ...result.audit.ownerSnapshot }, actionPoints: { ...result.audit.actionPoints },
      trade: { ...result.audit.trade,
        politicsEffect: { ...result.audit.trade.politicsEffect, fraction: { ...result.audit.trade.politicsEffect.fraction } },
        sellFactor: { ...result.audit.trade.sellFactor }, exactGold: { ...result.audit.trade.exactGold },
        roundingDifference: { ...result.audit.trade.roundingDifference },
        eligibility: { ...result.audit.trade.eligibility,
          unitChecks: result.audit.trade.eligibility.unitChecks.map(check => ({ ...check, position: { ...check.position } })) },
        writes: result.audit.trade.writes.map(write => ({ ...write })),
        merchantCounterparty: { ...result.audit.trade.merchantCounterparty }, politicsXp: { ...result.audit.trade.politicsXp } } };
    receipt.ownerSnapshot = audit.ownerSnapshot; receipt.actionPoints = audit.actionPoints;
    receipt.fixedGoldFee = audit.fixedGoldFee; receipt.meritDelta = audit.meritDelta;
    receipt.techniquePointsDelta = audit.techniquePointsDelta; receipt.loyaltyDelta = audit.loyaltyDelta;
    receipt.rngDraws = audit.rngDraws; receipt.trade = audit.trade;
  }
  after.revision++; receipt.dateAfter = clone(after.date); receipt.turnAfter = after.turn;
  return { snapshot: after, receipt };
}
function append(s: State, command: Envelope): { state: State; receipt: Receipt; duplicate: boolean } {
  const old = s.acceptedCommands.find(entry => entry.envelope.id === command.id);
  if (old) { if (!same(old.envelope, command)) fail('command-id-conflict'); return { state: s, receipt: old.receipt, duplicate: true }; }
  if (command.expectedRevision !== s.snapshot.revision) fail('revision-conflict');
  if (s.acceptedCommands.length >= 2 * s.genesis.scenario.advanceLimit + 1) fail('history-limit');
  const next = resolve(s.genesis.scenario, s.snapshot, command);
  return { state: { ...s, snapshot: next.snapshot, acceptedCommands: [...s.acceptedCommands, { envelope: command, receipt: next.receipt }] }, receipt: next.receipt, duplicate: false };
}
function reconstruct(v: unknown): State {
  const r = object(v, ['tag', 'schemaVersion', 'profile', 'scope', 'policies', 'catalog', 'policyDigest', 'catalogDigest', 'genesis', 'snapshot', 'acceptedCommands']);
  if (r.tag !== TAG || r.schemaVersion !== 1 || r.profile !== PROFILE || r.scope !== 'independent-fixed-owned-city') fail('unsupported-state-schema');
  const genesis = object(r.genesis, ['scenario', 'snapshot']);
  let s = initialState(scenario(genesis.scenario)); budget(s);
  if (!same(r.policies, s.policies) || r.policyDigest !== s.policyDigest) fail('policy-mismatch');
  if (!same(r.catalog, CATALOG) || r.catalogDigest !== CATALOG_DIGEST) fail('catalog-mismatch');
  if (!same(genesis.snapshot, s.snapshot)) fail('genesis-snapshot-mismatch');
  const entries = list(r.acceptedCommands, 2 * s.genesis.scenario.advanceLimit + 1);
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
/** Creation checks the full external horizon but performs no trade or advance. */
export function createCityMerchantState(input: unknown): CityMerchantStateResultV1 {
  try { const state = initialState(scenario(detach(input))); budget(state); return freeze({ ok: true, state } as StateResult); } catch (e) { return freeze(failure(e)); }
}
function commandResult(input: unknown, rawCommand: unknown): CommandResult {
  const s = reconstruct(detach(input)), command = envelope(detach(rawCommand)), next = append(s, command);
  const result: CommandResult = { ok: true, committed: !next.duplicate, duplicate: next.duplicate, state: next.state, receipt: next.receipt };
  budget(result); return result;
}
/** Pure preview shares the complete execute-output budget and reconstruction path. */
export function previewCityMerchantCommand(input: unknown, rawCommand: unknown): CityMerchantPreviewResultV1 {
  try { const result = commandResult(input, rawCommand); if (!result.ok) return freeze(result);
    return freeze({ ok: true, committed: false, duplicate: result.duplicate, receipt: result.receipt, projectedSnapshot: result.state.snapshot } as PreviewResult);
  } catch (e) { return freeze(failure(e)); }
}
/** Functional update; no caller-owned state, supplied input, or quote is trusted or mutated. */
export function executeCityMerchantCommand(input: unknown, rawCommand: unknown): CityMerchantCommandResultV1 {
  try { return freeze(commandResult(input, rawCommand)); } catch (e) { return freeze(failure(e)); }
}
export function saveCityMerchantState(input: unknown): CityMerchantSaveResultV1 {
  try { const state = reconstruct(detach(input)); budget(state); return freeze({ ok: true, json: canonical(state) } as SaveResult); } catch (e) { return freeze(failure(e)); }
}
export function loadCityMerchantState(json: unknown): CityMerchantStateResultV1 {
  try { const state = reconstruct(parseJson(json)); return freeze({ ok: true, state } as StateResult); } catch (e) { return freeze(failure(e)); }
}
/** Expected receipts are assertions only; rejected attempts never enter accepted history. */
export function replayCityMerchantTrace(input: unknown): CityMerchantReplayResultV1 {
  try {
    const r = object(detach(input), ['tag', 'scenario', 'attempts', 'expectedFinalSnapshot']);
    if (r.tag !== TRACE_TAG) fail('unsupported-trace-schema');
    let state = initialState(scenario(r.scenario)); budget(state);
    const attempts = list(r.attempts, 2163), outcomes: ExpectedOutcome[] = [];
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
