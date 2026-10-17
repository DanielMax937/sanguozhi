/** Independent city Search: discovery registries only; no native recruitment or item ownership. */
import policyData from '../../../data/catalogs/city-search-policy-v1.json' with { type: 'json' };
import { calculateSearchTalentBaseline } from './search-talent-baseline.ts';
import type { SearchTalentBaselineReceipt } from './search-talent-baseline.ts';
import { calculateTreasureRollArgument } from './treasure-roll-argument.ts';
import type { TreasureRollArgumentReceipt } from './treasure-roll-argument.ts';
import { calculateSearchGoldCallerProjection } from './search-gold-caller.ts';
import type { SearchGoldCallerReceipt } from './search-gold-caller.ts';

type Frozen<T> = T extends object ? { readonly [K in keyof T]: Frozen<T[K]> } : T;
const PROFILE = 'standalone-city-search-v1' as const;
const SCOPE = 'one-fixed-city-discovery-only' as const;
const TAG = 'city-search-state-v1' as const, TRACE_TAG = 'city-search-trace-v1' as const;
const MAX_BYTES = 16_777_216, MAX_NODES = 1_048_576, MAX_DEPTH = 24, MAX_ARRAY = 4096;
const MAX_HISTORY = 4096, MAX_ATTEMPTS = 4096;
type DateV1 = { year: number; month: number; day: 1 | 11 | 21 };
type Policy = typeof policyData;
type City = { id: string; kind: 'city'; forceId: string; corpsId: string; gold: number; goldCapacity: number; talentOfficeComplete: boolean; regionId: number };
type Corps = { id: string; forceId: string; actionPoints: number };
type Actor = { id: string; forceId: string; cityId: string; ordinary: boolean; available: boolean; politicsU8: number; charmU8: number; birthRegionI32: number; eyeSkillEaxU32: number; merit: number; politicsXp: number; actedTurn: number | null };
type Talent = { id: string; cityId: string; lifeStatus: 'living' | 'dead'; serviceStatus: 'free' | 'serving' | 'prisoner'; availableFromTurn: number; discovered: boolean };
type Treasure = { id: string; searchCityId: string; kind: 'ordinary' | 'imperial-seal' | 'bronze-pheasant'; holderRef: string | null; availableFromTurn: number; valueU8: number; discovered: boolean };
type Scenario = { schemaVersion: 1; profile: typeof PROFILE; scope: typeof SCOPE; date: DateV1; turn: number; advanceLimit: number; activeForceId: string; force: { id: string; techniquePoints: number }; city: City; corps: Corps; actors: Actor[]; talents: Talent[]; treasures: Treasure[]; rng: { kind: 'search-lcg32-multiply-high-v1'; seed: number }; policy: Policy };
type ActorState = { id: string; merit: number; politicsXp: number; actedTurn: number | null };
type Discovery = { id: string; origin: 'supplied-initial' | 'search'; commandId: string | null; turn: number | null; date: DateV1 | null; actorId: string | null };
type RngState = { state: number; drawCount: number };
type Snapshot = { revision: number; turn: number; advancedCount: number; date: DateV1; gold: number; actionPoints: number; techniquePoints: number; actors: ActorState[]; talentRegistry: Discovery[]; treasureRegistry: Discovery[]; rng: RngState };
type Command = { type: 'Search'; cityId: string; actorId: string } | { type: 'AdvanceSearchTurn' };
type Envelope = { id: string; expectedRevision: number; command: Command };
type Draw = { drawIndex: number; label: 'talent-selector' | 'talent-roll' | 'treasure-selector' | 'treasure-roll' | 'gold-roll'; bound: number; beforeState: number; afterState: number; value: number };
type Exclusion = { id: string; reasons: string[] };
type Pool = { rawCandidateIds: string[]; eligibleIds: string[]; excluded: Exclusion[] };
type TalentSelection = Pool & { selectedId: string | null; roll: number | null; kernel: SearchTalentBaselineReceipt };
type TreasureSelection = Pool & { reached: boolean; selectedId: string | null; roll: number | null; kernel: TreasureRollArgumentReceipt | null };
type Credit = { before: number; requested: number; actual: number; discarded: number; after: number };
type GoldWrite = { before: number; capacity: number; after: number; actualDelta: number; capacityDiscarded: number; belowMinimumDiscarded: number; kernel: SearchGoldCallerReceipt | null };
const BOUNDARY = {
  serviceEvidence: 'synthetic-replaceable-policy', kernelsEvidence: 'source-listing-reconstruction',
  rewardRequestsEvidence: 'selected-listing-call-sites-not-native-writers',
  talentNoHirePoliticsXpEvidence: 'guide-observation', talentNoHireMeritAndTpEvidence: 'synthetic-conservative-zero',
  originalCommandEquivalent: false, stockOrCrossVersionCertified: false, originalRandomStreamEquivalent: false,
  originalTalentFilterRecovered: false, originalTreasureFilterRecovered: false, originalTreasureProbabilityRecovered: false,
  sourceReturn205Preserved: true, stableGoldReadsArePolicy: true, nativeWriterCertified: false,
  ownershipFrozen: true, talentDiscoveryIsRecruitment: false, treasureDiscoveryGrantsOwnership: false,
  cityEvents: 'not-executed', adjacentSiteDiscovery: 'O13-B-not-implemented',
  original43GroupsReduced: false, original45SnapshotReduced: false,
} as const;
const UNSUPPORTED = ['recruitment', 'debate-handoff', 'native-treasure-ownership', 'native-personnel-transfer', 'capture', 'force-extinction', 'ruler-succession', 'native-mission-return-finalizers', 'city-events', 'adjacent-ruin-temple-discovery', 'travel-jobs', 'shared-service-ledgers', 'native-saves', 'global-end-turn'] as const;
type Receipt = { schemaVersion: 1; profile: typeof PROFILE; scope: typeof SCOPE; commandId: string; envelope: Envelope; policyId: string; sourceBoundary: typeof BOUNDARY; revisionBefore: number; revisionAfter: number; turnBefore: number; turnAfter: number; dateBefore: DateV1; dateAfter: DateV1; cityId: string; actorId: string | null; outcome: 'talent-found' | 'treasure-found' | 'gold-found' | 'nothing' | 'turn-advanced'; talent: TalentSelection | null; treasure: TreasureSelection | null; discovery: Discovery | null; gold: GoldWrite; resources: { goldCost: 0; actionPointsBefore: number; actionPointsCost: number; actionPointRecovery: Credit; actionPointsAfter: number }; rewards: { merit: Credit | null; politicsXp: Credit | null; techniquePoints: Credit }; actorBefore: ActorState | null; actorAfter: ActorState | null; rngBefore: RngState; rngAfter: RngState; draws: Draw[] };
type State = { tag: typeof TAG; schemaVersion: 1; profile: typeof PROFILE; scope: typeof SCOPE; policy: Policy; sourceBoundary: typeof BOUNDARY; genesis: { scenario: Scenario; snapshot: Snapshot }; snapshot: Snapshot; acceptedCommands: { envelope: Envelope; receipt: Receipt }[] };
type Failure = { ok: false; committed: false; reason: string; revision: number | null; turn: number | null; commandId: string | null; index: number | null };
type StateResult = { ok: true; state: State } | Failure;
type CommandResult = { ok: true; committed: boolean; duplicate: boolean; state: State; receipt: Receipt } | Failure;
type PreviewResult = { ok: true; committed: false; duplicate: boolean; receipt: Receipt; projectedSnapshot: Snapshot } | Failure;
type SaveResult = { ok: true; json: string } | Failure;
type ExpectedOutcome = { ok: true; duplicate: boolean; receipt: Receipt } | Failure;
type Trace = { tag: typeof TRACE_TAG; scenario: Scenario; attempts: { envelope: Envelope; expectedOutcome: ExpectedOutcome | null }[]; expectedFinalSnapshot: Snapshot | null };
type ReplayResult = { ok: true; state: State; outcomes: ExpectedOutcome[] } | Failure;
export type CitySearchScenarioV1 = Frozen<Scenario>;
export type CitySearchStateV1 = Frozen<State>;
export type CitySearchSnapshotV1 = Frozen<Snapshot>;
export type CitySearchCommandV1 = Frozen<Command>;
export type CitySearchEnvelopeV1 = Frozen<Envelope>;
export type CitySearchPolicyV1 = Frozen<Policy>;
export type CitySearchDiscoveryV1 = Frozen<Discovery>;
export type CitySearchDrawV1 = Frozen<Draw>;
export type CitySearchReceiptV1 = Frozen<Receipt>;
export type CitySearchFailureV1 = Frozen<Failure>;
export type CitySearchStateResultV1 = Frozen<StateResult>;
export type CitySearchCommandResultV1 = Frozen<CommandResult>;
export type CitySearchPreviewResultV1 = Frozen<PreviewResult>;
export type CitySearchSaveResultV1 = Frozen<SaveResult>;
export type CitySearchTraceV1 = Frozen<Trace>;
export type CitySearchReplayResultV1 = Frozen<ReplayResult>;

class Invalid extends Error {
  readonly reason: string; readonly index: number | null;
  constructor(reason: string, index: number | null = null) { super(reason); this.reason = reason; this.index = index; }
}
function fail(reason: string, index: number | null = null): never { throw new Invalid(reason, index); }
function failure(e: unknown, snapshot: Pick<Snapshot, 'revision' | 'turn'> | null = null, commandId: string | null = null): Failure {
  return { ok: false, committed: false, reason: e instanceof Invalid ? e.reason : 'invalid-input', revision: snapshot?.revision ?? null, turn: snapshot?.turn ?? null, commandId, index: e instanceof Invalid ? e.index : null };
}
function freeze<T>(v: T): Frozen<T> { if (v !== null && typeof v === 'object' && !Object.isFrozen(v)) { for (const x of Object.values(v)) freeze(x); Object.freeze(v); } return v as Frozen<T>; }
function clone<T>(v: T): T { return JSON.parse(JSON.stringify(v)) as T; }
function canonical(v: unknown): string { if (v === null || typeof v !== 'object') return JSON.stringify(v); if (Array.isArray(v)) return '[' + v.map(canonical).join(',') + ']'; const r = v as Record<string, unknown>; return '{' + Object.keys(r).sort().map(k => JSON.stringify(k) + ':' + canonical(r[k])).join(',') + '}'; }
function same(a: unknown, b: unknown): boolean { return canonical(a) === canonical(b); }
function utf8Bytes(s: string): number { let n = 0; for (const c of s) { const p = c.codePointAt(0)!; n += p < 128 ? 1 : p < 2048 ? 2 : p < 65536 ? 3 : 4; } return n; }
/** Finite copy for non-Proxy JSON DTOs in an unpolluted runtime. Reflection can invoke
 * Proxy traps; hostile Proxies and runtime pollution are unsupported, not universally
 * detectable here. Own getters/setters are rejected without reading their values. */
function detach(v: unknown): unknown {
  let nodes = 0, bytes = 0; const active = new Set<object>();
  function visit(x: unknown, depth: number): unknown {
    if (++nodes > MAX_NODES || depth > MAX_DEPTH) fail('serialization-budget');
    if (x === null || typeof x === 'boolean') return x;
    if (typeof x === 'number') { if (!Number.isSafeInteger(x) || Object.is(x, -0)) fail('invalid-number'); return x; }
    if (typeof x === 'string') { if (x.length > MAX_BYTES) fail('serialization-budget'); bytes += utf8Bytes(x); if (bytes > MAX_BYTES) fail('serialization-budget'); return x; }
    if (typeof x !== 'object' || active.has(x)) fail('invalid-data');
    const arr = Array.isArray(x), proto = Object.getPrototypeOf(x);
    if (proto !== (arr ? Array.prototype : Object.prototype) && !(proto === null && !arr)) fail('invalid-prototype');
    const keys = Reflect.ownKeys(x);
    if (keys.length > (arr ? MAX_ARRAY + 1 : 128)) fail('serialization-budget');
    const ds = Object.getOwnPropertyDescriptors(x);
    Object.setPrototypeOf(ds, null);
    if (keys.some(k => typeof k !== 'string' || !Object.hasOwn(ds[k]!, 'value') || (!ds[k]!.enumerable && !(arr && k === 'length')))) fail('invalid-data');
    active.add(x);
    try {
      if (arr) {
        const n = ds.length!.value as number;
        if (!Number.isSafeInteger(n) || n < 0 || n > MAX_ARRAY) fail('serialization-budget');
        if (keys.length !== n + 1) fail('invalid-array');
        const out: unknown[] = [];
        for (let i = 0; i < n; i++) { const d = ds[String(i)]; if (!Object.hasOwn(ds, String(i)) || !d) fail('invalid-array'); out.push(visit(d.value, depth + 1)); }
        return out;
      }
      const out: Record<string, unknown> = {};
      for (const k of keys as string[]) { bytes += utf8Bytes(k); if (bytes > MAX_BYTES) fail('serialization-budget'); Object.defineProperty(out, k, { value: visit(ds[k]!.value, depth + 1), enumerable: true, writable: true, configurable: true }); }
      return out;
    } finally { active.delete(x); }
  }
  const out = visit(v, 0); if (utf8Bytes(canonical(out)) > MAX_BYTES) fail('serialization-budget'); return out;
}
function budget(v: unknown): void { detach(v); }
function object(v: unknown, keys: readonly string[]): Record<string, unknown> { if (v === null || typeof v !== 'object' || Array.isArray(v)) fail('invalid-object'); const r = v as Record<string, unknown>; if (keys.some(k => !Object.hasOwn(r, k)) || Object.keys(r).some(k => !keys.includes(k))) fail('invalid-fields'); return r; }
function uint(v: unknown, max = Number.MAX_SAFE_INTEGER, min = 0): number { if (typeof v !== 'number' || !Number.isSafeInteger(v) || Object.is(v, -0) || v < min || v > max) fail('invalid-number'); return v; }
function bool(v: unknown): boolean { if (typeof v !== 'boolean') fail('invalid-boolean'); return v; }
function list(v: unknown, max: number): unknown[] { if (!Array.isArray(v) || v.length > max) fail('invalid-array'); return v; }
function id(v: unknown): string { if (typeof v !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9_.:-]{0,63}$/.test(v)) fail('invalid-id'); return v; }
function date(v: unknown): DateV1 { const r = object(v, ['year', 'month', 'day']); const day = uint(r.day, 21, 1); if (day !== 1 && day !== 11 && day !== 21) fail('invalid-date'); return { year: uint(r.year, 9999, 1), month: uint(r.month, 12, 1), day }; }
function nextDate(d: DateV1): DateV1 { if (d.day === 1) return { ...d, day: 11 }; if (d.day === 11) return { ...d, day: 21 }; if (d.month < 12) return { year: d.year, month: d.month + 1, day: 1 }; if (d.year === 9999) fail('calendar-limit'); return { year: d.year + 1, month: 1, day: 1 }; }
/** Bounded JSON parser rejects duplicate decoded object keys before they can be overwritten. */
function parseJson(text: unknown): unknown {
  if (typeof text !== 'string') fail('invalid-json');
  if (text.length > MAX_BYTES || utf8Bytes(text) > MAX_BYTES) fail('serialization-budget');
  let p = 0, nodes = 0;
  const ws = () => { while (p < text.length && /[\x20\t\r\n]/.test(text[p]!)) p++; };
  function str(): string {
    const start = p++; let escaped = false;
    while (p < text.length) { const c = text[p++]!; if (!escaped && c === '"') return JSON.parse(text.slice(start, p)) as string; if (!escaped && c === '\\') escaped = true; else escaped = false; }
    return fail('invalid-json');
  }
  function value(depth: number): unknown {
    if (++nodes > MAX_NODES || depth > MAX_DEPTH) fail('serialization-budget'); ws(); const c = text[p];
    if (c === '"') return str();
    if (c === '{') {
      p++; ws(); const r: Record<string, unknown> = {}; const keys = new Set<string>();
      if (text[p] === '}') { p++; return r; }
      while (true) { ws(); if (text[p] !== '"') fail('invalid-json'); const k = str(); if (keys.has(k)) fail('duplicate-json-key'); keys.add(k); if (keys.size > 128) fail('serialization-budget'); ws(); if (text[p++] !== ':') fail('invalid-json'); Object.defineProperty(r, k, { value: value(depth + 1), enumerable: true, writable: true, configurable: true }); ws(); const end = text[p++]; if (end === '}') return r; if (end !== ',') fail('invalid-json'); }
    }
    if (c === '[') { p++; ws(); const r: unknown[] = []; if (text[p] === ']') { p++; return r; } while (true) { if (r.length >= MAX_ARRAY) fail('serialization-budget'); r.push(value(depth + 1)); ws(); const end = text[p++]; if (end === ']') return r; if (end !== ',') fail('invalid-json'); } }
    for (const [token, result] of [['true', true], ['false', false], ['null', null]] as const) if (text.startsWith(token, p)) { p += token.length; return result; }
    const token = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/.exec(text.slice(p))?.[0]; if (!token) fail('invalid-json'); p += token.length; const n = Number(token); if (!Number.isSafeInteger(n) || Object.is(n, -0)) fail('invalid-number'); return n;
  }
  const result = value(0); ws(); if (p !== text.length) fail('invalid-json'); return detach(result);
}

const POLICY = clone(policyData);
export const CITY_SEARCH_POLICY_REGISTRY_V1 = freeze([clone(POLICY)]);
export const CITY_SEARCH_DEFAULT_POLICY_V1 = freeze(POLICY);
export const CITY_SEARCH_EVIDENCE_V1 = freeze(BOUNDARY);
export const CITY_SEARCH_UNSUPPORTED_V1 = freeze(UNSUPPORTED);
const order = (a: string, b: string): number => a < b ? -1 : a > b ? 1 : 0;
function unique<T>(items: T[]): void { if (new Set(items).size !== items.length) fail('duplicate-id'); }
function oneOf<T extends string>(v: unknown, allowed: readonly T[]): T {
  if (typeof v !== 'string' || !allowed.includes(v as T)) fail('invalid-enum'); return v as T;
}
function scenario(v: unknown): Scenario {
  const r = object(v, ['schemaVersion', 'profile', 'scope', 'date', 'turn', 'advanceLimit', 'activeForceId', 'force', 'city', 'corps', 'actors', 'talents', 'treasures', 'rng', 'policy']);
  if (r.schemaVersion !== 1 || r.profile !== PROFILE || r.scope !== SCOPE) fail('unsupported-profile');
  if (!same(r.policy, POLICY)) fail('policy-mismatch');
  const d = date(r.date), advanceLimit = uint(r.advanceLimit, POLICY.limits.advances, 1);
  const turn = uint(r.turn, Number.MAX_SAFE_INTEGER - advanceLimit), horizonEnd = turn + advanceLimit;
  let horizon = d; for (let i = 0; i < advanceLimit; i++) horizon = nextDate(horizon);
  const activeForceId = id(r.activeForceId), f = object(r.force, ['id', 'techniquePoints']);
  const force = { id: id(f.id), techniquePoints: uint(f.techniquePoints, POLICY.rewards.techniquePointCap) };
  const c = object(r.city, ['id', 'kind', 'forceId', 'corpsId', 'gold', 'goldCapacity', 'talentOfficeComplete', 'regionId']);
  if (c.kind !== 'city') fail('unsupported-city-kind');
  const city: City = { id: id(c.id), kind: 'city', forceId: id(c.forceId), corpsId: id(c.corpsId), gold: uint(c.gold, POLICY.gold.maximumCapacity), goldCapacity: uint(c.goldCapacity, POLICY.gold.maximumCapacity), talentOfficeComplete: bool(c.talentOfficeComplete), regionId: uint(c.regionId, 2_147_483_647, -2_147_483_648) };
  const co = object(r.corps, ['id', 'forceId', 'actionPoints']);
  const corps: Corps = { id: id(co.id), forceId: id(co.forceId), actionPoints: uint(co.actionPoints, POLICY.time.actionPointCap) };
  if (force.id !== activeForceId || city.forceId !== activeForceId || corps.forceId !== activeForceId || city.corpsId !== corps.id || city.gold > city.goldCapacity) fail('inconsistent-scenario');
  const actors: Actor[] = list(r.actors, POLICY.limits.actors).map(x => {
    const a = object(x, ['id', 'forceId', 'cityId', 'ordinary', 'available', 'politicsU8', 'charmU8', 'birthRegionI32', 'eyeSkillEaxU32', 'merit', 'politicsXp', 'actedTurn']);
    return { id: id(a.id), forceId: id(a.forceId), cityId: id(a.cityId), ordinary: bool(a.ordinary), available: bool(a.available), politicsU8: uint(a.politicsU8, 255), charmU8: uint(a.charmU8, 255), birthRegionI32: uint(a.birthRegionI32, 2_147_483_647, -2_147_483_648), eyeSkillEaxU32: uint(a.eyeSkillEaxU32, 4_294_967_295), merit: uint(a.merit, POLICY.rewards.meritCap), politicsXp: uint(a.politicsXp, POLICY.rewards.politicsXpCap), actedTurn: a.actedTurn === null ? null : uint(a.actedTurn, turn) };
  });
  const talents: Talent[] = list(r.talents, POLICY.limits.talents).map(x => {
    const t = object(x, ['id', 'cityId', 'lifeStatus', 'serviceStatus', 'availableFromTurn', 'discovered']);
    return { id: id(t.id), cityId: id(t.cityId), lifeStatus: oneOf(t.lifeStatus, ['living', 'dead'] as const), serviceStatus: oneOf(t.serviceStatus, ['free', 'serving', 'prisoner'] as const), availableFromTurn: uint(t.availableFromTurn, horizonEnd), discovered: bool(t.discovered) };
  });
  const treasures: Treasure[] = list(r.treasures, POLICY.limits.treasures).map(x => {
    const t = object(x, ['id', 'searchCityId', 'kind', 'holderRef', 'availableFromTurn', 'valueU8', 'discovered']);
    return { id: id(t.id), searchCityId: id(t.searchCityId), kind: oneOf(t.kind, ['ordinary', 'imperial-seal', 'bronze-pheasant'] as const), holderRef: t.holderRef === null ? null : id(t.holderRef), availableFromTurn: uint(t.availableFromTurn, horizonEnd), valueU8: uint(t.valueU8, 255), discovered: bool(t.discovered) };
  });
  unique([...actors.map(a => a.id), ...talents.map(t => t.id)]); unique(treasures.map(t => t.id));
  actors.sort((a, b) => order(a.id, b.id)); talents.sort((a, b) => order(a.id, b.id)); treasures.sort((a, b) => order(a.id, b.id));
  const rng = object(r.rng, ['kind', 'seed']); if (rng.kind !== POLICY.rng.kind) fail('policy-mismatch');
  return { schemaVersion: 1, profile: PROFILE, scope: SCOPE, date: d, turn, advanceLimit, activeForceId, force, city, corps, actors, talents, treasures, rng: { kind: 'search-lcg32-multiply-high-v1', seed: uint(rng.seed, 4_294_967_295) }, policy: clone(POLICY) };
}
function envelope(v: unknown): Envelope {
  const r = object(v, ['id', 'expectedRevision', 'command']);
  const commandId = id(r.id), expectedRevision = uint(r.expectedRevision, MAX_HISTORY);
  if (r.command === null || typeof r.command !== 'object' || Array.isArray(r.command)) fail('invalid-input');
  const kind = (r.command as Record<string, unknown>).type; let command: Command;
  if (kind === 'Search') { const c = object(r.command, ['type', 'cityId', 'actorId']); command = { type: 'Search', cityId: id(c.cityId), actorId: id(c.actorId) }; }
  else if (kind === 'AdvanceSearchTurn') { object(r.command, ['type']); command = { type: 'AdvanceSearchTurn' }; }
  else fail('unsupported-command');
  return { id: commandId, expectedRevision, command };
}
function initialState(s: Scenario): State {
  const initialDiscovery = (t: { id: string }): Discovery => ({ id: t.id, origin: 'supplied-initial', commandId: null, turn: null, date: null, actorId: null });
  const snapshot: Snapshot = { revision: 0, turn: s.turn, advancedCount: 0, date: clone(s.date), gold: s.city.gold, actionPoints: s.corps.actionPoints, techniquePoints: s.force.techniquePoints, actors: s.actors.map(a => ({ id: a.id, merit: a.merit, politicsXp: a.politicsXp, actedTurn: a.actedTurn })), talentRegistry: s.talents.filter(t => t.discovered).map(initialDiscovery), treasureRegistry: s.treasures.filter(t => t.discovered).map(initialDiscovery), rng: { state: s.rng.seed, drawCount: 0 } };
  return { tag: TAG, schemaVersion: 1, profile: PROFILE, scope: SCOPE, policy: clone(s.policy), sourceBoundary: clone(BOUNDARY), genesis: { scenario: clone(s), snapshot: clone(snapshot) }, snapshot, acceptedCommands: [] };
}
/** Exact new LCG and multiply-high mapping; not original RNG or exactly unbiased selection. */
function draw(rng: RngState, bound: number, label: Draw['label'], draws: Draw[]): number {
  const beforeState = rng.state;
  const next = (BigInt(POLICY.rng.multiplier) * BigInt(beforeState) + BigInt(POLICY.rng.increment)) % BigInt(POLICY.rng.modulus);
  const value = Number(next * BigInt(bound) / BigInt(POLICY.rng.modulus));
  rng.state = Number(next); rng.drawCount++;
  draws.push({ drawIndex: rng.drawCount, label, bound, beforeState, afterState: rng.state, value }); return value;
}
function pools(s: Scenario, snap: Snapshot): { talent: Pool; treasure: Pool } {
  const knownTalents = new Set(snap.talentRegistry.map(t => t.id)), knownTreasures = new Set(snap.treasureRegistry.map(t => t.id));
  const talent: Pool = { rawCandidateIds: s.talents.map(t => t.id), eligibleIds: [], excluded: [] };
  for (const t of s.talents) {
    const reasons: string[] = [];
    if (t.lifeStatus !== 'living') reasons.push('not-living');
    if (t.serviceStatus !== 'free') reasons.push('not-free');
    if (t.cityId !== s.city.id) reasons.push('other-city');
    if (t.availableFromTurn > snap.turn) reasons.push('not-yet-available');
    if (knownTalents.has(t.id)) reasons.push('already-discovered');
    if (reasons.length) talent.excluded.push({ id: t.id, reasons }); else talent.eligibleIds.push(t.id);
  }
  const treasure: Pool = { rawCandidateIds: s.treasures.map(t => t.id), eligibleIds: [], excluded: [] };
  for (const t of s.treasures) {
    const reasons: string[] = [];
    if (t.kind !== 'ordinary') reasons.push('special-kind');
    if (t.holderRef !== null) reasons.push('already-held');
    if (t.searchCityId !== s.city.id) reasons.push('other-city');
    if (t.availableFromTurn > snap.turn) reasons.push('not-yet-available');
    if (knownTreasures.has(t.id)) reasons.push('already-discovered');
    if (reasons.length) treasure.excluded.push({ id: t.id, reasons }); else treasure.eligibleIds.push(t.id);
  }
  return { talent, treasure };
}
function credit(before: number, requested: number, cap: number): Credit {
  const actual = Math.min(requested, cap - before); return { before, requested, actual, discarded: requested - actual, after: before + actual };
}
function resolve(s: Scenario, before: Snapshot, env: Envelope): { snapshot: Snapshot; receipt: Receipt } {
  const after = clone(before), draws: Draw[] = [];
  let outcome: Receipt['outcome'] = 'turn-advanced', actorId: string | null = null, actorBefore: ActorState | null = null, actorAfter: ActorState | null = null;
  let talent: TalentSelection | null = null, treasure: TreasureSelection | null = null, discovery: Discovery | null = null, apCost = 0;
  let apRecovery = credit(before.actionPoints, 0, s.policy.time.actionPointCap);
  const gold: GoldWrite = { before: before.gold, capacity: s.city.goldCapacity, after: before.gold, actualDelta: 0, capacityDiscarded: 0, belowMinimumDiscarded: 0, kernel: null };
  const rewards: Receipt['rewards'] = { merit: null, politicsXp: null, techniquePoints: credit(before.techniquePoints, 0, s.policy.rewards.techniquePointCap) };
  if (env.command.type === 'Search') {
    if (env.command.cityId !== s.city.id) fail('wrong-city');
    actorId = env.command.actorId;
    const facts = s.actors.find(a => a.id === actorId), current = after.actors.find(a => a.id === actorId);
    if (!facts || !current) fail('unknown-actor');
    if (!facts.ordinary || !facts.available || facts.forceId !== s.activeForceId || facts.cityId !== s.city.id) fail('ineligible-actor');
    if (current.actedTurn === before.turn) fail('actor-already-acted');
    apCost = s.city.talentOfficeComplete ? s.policy.costs.withTalentOfficeActionPoints : s.policy.costs.actionPoints;
    if (before.actionPoints < apCost) fail('insufficient-ap');
    actorBefore = clone(current);
    const eligible = pools(s, before);
    const talentKernel = calculateSearchTalentBaseline({ profile: 'search-talent-resolved-v1', filteredCandidateCount: eligible.talent.eligibleIds.length, politicsAL: facts.politicsU8, eyeSkillEax: facts.eyeSkillEaxU32, cityRegion: s.city.regionId, officerBirthRegion: facts.birthRegionI32 });
    if (!talentKernel.supported) fail('talent-kernel-inconsistency');
    talent = { ...eligible.talent, selectedId: null, roll: null, kernel: talentKernel };
    treasure = { ...eligible.treasure, reached: false, selectedId: null, roll: null, kernel: null };
    outcome = 'nothing';
    if (talentKernel.returnedEax > 0) {
      const n = talent.eligibleIds.length;
      const selected = n === 1 ? 0 : draw(after.rng, n, 'talent-selector', draws);
      talent.selectedId = talent.eligibleIds[selected]!;
      talent.roll = draw(after.rng, s.policy.selection.talentRollBound, 'talent-roll', draws);
      if (talent.roll < talentKernel.returnedEax) {
        outcome = 'talent-found';
        discovery = { id: talent.selectedId, origin: 'search', commandId: env.id, turn: before.turn, date: clone(before.date), actorId };
        after.talentRegistry.push(discovery); after.talentRegistry.sort((a, b) => order(a.id, b.id));
      }
    }
    if (outcome !== 'talent-found') {
      treasure.reached = true;
      const n = treasure.eligibleIds.length;
      if (n > 0) {
        const selected = n === 1 ? 0 : draw(after.rng, n, 'treasure-selector', draws);
        treasure.selectedId = treasure.eligibleIds[selected]!;
        const item = s.treasures.find(t => t.id === treasure!.selectedId)!;
        const treasureKernel = calculateTreasureRollArgument({ profile: 'treasure-roll-resolved-v1', treasureValueU8: item.valueU8 });
        if (!treasureKernel.supported) fail('treasure-kernel-inconsistency');
        treasure.kernel = treasureKernel;
        treasure.roll = draw(after.rng, s.policy.selection.treasureRollBound, 'treasure-roll', draws);
        if (treasure.roll < treasureKernel.rollArgument) {
          outcome = 'treasure-found';
          discovery = { id: treasure.selectedId, origin: 'search', commandId: env.id, turn: before.turn, date: clone(before.date), actorId };
          after.treasureRegistry.push(discovery); after.treasureRegistry.sort((a, b) => order(a.id, b.id));
        }
      }
    }
    if (outcome === 'nothing') {
      const rngEax = draw(after.rng, facts.charmU8 + 1, 'gold-roll', draws);
      const needsSecondRead = before.gold + Math.min(rngEax & 0xffff, 80) > s.city.goldCapacity;
      const goldKernel = calculateSearchGoldCallerProjection({ profile: 'search-gold-caller-resolved-v1', rngEax, firstGold: before.gold, firstCapacity: s.city.goldCapacity, ...(needsSecondRead ? { secondRead: { gold: before.gold, capacity: s.city.goldCapacity } } : {}) });
      if (!goldKernel.supported) fail('gold-kernel-inconsistency');
      gold.kernel = goldKernel; gold.capacityDiscarded = goldKernel.proposedAmount - goldKernel.amountSigned;
      if (goldKernel.outcome === 'gold-handler') {
        const amount = goldKernel.amountSigned;
        if (amount < s.policy.gold.minimumCredit || amount > s.policy.gold.maximumCredit || amount > s.city.goldCapacity - before.gold) fail('gold-kernel-inconsistency');
        gold.actualDelta = amount; after.gold += amount; gold.after = after.gold; outcome = 'gold-found';
      } else {
        if (goldKernel.amountSigned < 0 || goldKernel.amountSigned >= s.policy.gold.minimumCredit) fail('gold-kernel-inconsistency');
        gold.belowMinimumDiscarded = goldKernel.amountSigned;
      }
    }
    const requested = outcome === 'talent-found' ? s.policy.rewards.talent : outcome === 'treasure-found' ? s.policy.rewards.treasure : outcome === 'gold-found' ? s.policy.rewards.gold : s.policy.rewards.nothing;
    rewards.merit = credit(current.merit, requested.merit, s.policy.rewards.meritCap);
    rewards.politicsXp = credit(current.politicsXp, requested.politicsXp, s.policy.rewards.politicsXpCap);
    rewards.techniquePoints = credit(before.techniquePoints, requested.techniquePoints, s.policy.rewards.techniquePointCap);
    current.merit = rewards.merit.after; current.politicsXp = rewards.politicsXp.after; current.actedTurn = before.turn;
    after.techniquePoints = rewards.techniquePoints.after; after.actionPoints -= apCost; actorAfter = clone(current);
    // Recovery has no effect on Search; its before/after is the post-cost balance.
    apRecovery = credit(after.actionPoints, 0, s.policy.time.actionPointCap);
  } else {
    if (before.advancedCount >= s.advanceLimit) fail('advance-limit');
    after.date = nextDate(before.date); after.turn++; after.advancedCount++;
    apRecovery = credit(before.actionPoints, s.policy.time.actionPointRecovery, s.policy.time.actionPointCap);
    after.actionPoints = apRecovery.after;
  }
  if (draws.length > s.policy.rng.maxDrawsPerSearch) fail('rng-draw-budget');
  after.revision++;
  const receipt: Receipt = { schemaVersion: 1, profile: PROFILE, scope: SCOPE, commandId: env.id, envelope: clone(env), policyId: s.policy.id, sourceBoundary: clone(BOUNDARY), revisionBefore: before.revision, revisionAfter: after.revision, turnBefore: before.turn, turnAfter: after.turn, dateBefore: clone(before.date), dateAfter: clone(after.date), cityId: s.city.id, actorId, outcome, talent, treasure, discovery, gold, resources: { goldCost: 0, actionPointsBefore: before.actionPoints, actionPointsCost: apCost, actionPointRecovery: apRecovery, actionPointsAfter: after.actionPoints }, rewards, actorBefore, actorAfter, rngBefore: clone(before.rng), rngAfter: clone(after.rng), draws };
  return { snapshot: after, receipt };
}
function append(s: State, command: Envelope): { state: State; receipt: Receipt; duplicate: boolean } {
  const old = s.acceptedCommands.find(entry => entry.envelope.id === command.id);
  if (old) { if (!same(old.envelope, command)) fail('duplicate-command-id-conflict'); return { state: s, receipt: old.receipt, duplicate: true }; }
  if (command.expectedRevision !== s.snapshot.revision) fail('stale-revision');
  if (s.acceptedCommands.length >= MAX_HISTORY) fail('history-limit');
  const next = resolve(s.genesis.scenario, s.snapshot, command);
  return { state: { ...s, snapshot: next.snapshot, acceptedCommands: [...s.acceptedCommands, { envelope: clone(command), receipt: next.receipt }] }, receipt: next.receipt, duplicate: false };
}
function budgetSave(state: State): SaveResult {
  // Both structured state and the escaped canonical JSON inside SaveResult are bounded.
  budget(state); const result: SaveResult = { ok: true, json: canonical(state) }; budget(result); return result;
}
type ReceiptSize = { canonicalBytes: number; rawStringBytes: number; nodes: number; depth: number };
/** Only called on already-budgeted, internally derived receipts, never unchecked input. */
function receiptSize(receipt: Receipt): ReceiptSize {
  let nodes = 0, rawStringBytes = 0, depth = 0;
  function visit(v: unknown, level: number): void {
    nodes++; depth = Math.max(depth, level);
    if (typeof v === 'string') { rawStringBytes += utf8Bytes(v); return; }
    if (v === null || typeof v !== 'object') return;
    if (!Array.isArray(v)) for (const key of Object.keys(v)) rawStringBytes += utf8Bytes(key);
    for (const value of Object.values(v)) visit(value, level + 1);
  }
  visit(receipt, 0);
  return { canonicalBytes: utf8Bytes(canonical(receipt)), rawStringBytes, nodes, depth };
}
/** Reserve all old-ID results before accepting a later command, including a smaller advance.
 * Each dimension is additive over the fixed current-state wrapper (depth uses max), so its
 * own extremal receipt suffices. Object/array shape limits already hold within that state.
 * Choosing the largest byte receipt alone would not reserve the largest node/depth result.
 */
function budgetAllRetries(state: State): void {
  const maxima: { key: keyof ReceiptSize; score: number; receipt: Receipt | null }[] = [
    { key: 'canonicalBytes', score: -1, receipt: null }, { key: 'rawStringBytes', score: -1, receipt: null },
    { key: 'nodes', score: -1, receipt: null }, { key: 'depth', score: -1, receipt: null },
  ];
  for (const entry of state.acceptedCommands) {
    const size = receiptSize(entry.receipt);
    for (const maximum of maxima) if (size[maximum.key] > maximum.score) { maximum.score = size[maximum.key]; maximum.receipt = entry.receipt; }
  }
  const receipts = new Set(maxima.map(m => m.receipt));
  for (const receipt of receipts) if (receipt !== null) budget({ ok: true, committed: false, duplicate: true, state, receipt });
}
function executeDetached(s: State, env: Envelope): Exclude<CommandResult, Failure> {
  const next = append(s, env); const result: Exclude<CommandResult, Failure> = { ok: true, committed: !next.duplicate, duplicate: next.duplicate, state: next.state, receipt: next.receipt };
  budget(result); budgetSave(next.state);
  if (!next.duplicate) budgetAllRetries(next.state);
  return result;
}
function reconstruct(v: unknown): State {
  const r = object(v, ['tag', 'schemaVersion', 'profile', 'scope', 'policy', 'sourceBoundary', 'genesis', 'snapshot', 'acceptedCommands']);
  if (r.tag !== TAG || r.schemaVersion !== 1 || r.profile !== PROFILE || r.scope !== SCOPE) fail('unsupported-profile');
  if (!same(r.policy, POLICY)) fail('policy-mismatch'); if (!same(r.sourceBoundary, BOUNDARY)) fail('source-boundary-mismatch');
  const genesis = object(r.genesis, ['scenario', 'snapshot']); let s = initialState(scenario(genesis.scenario)); budget({ ok: true, state: s }); budgetSave(s);
  if (!same(genesis.scenario, s.genesis.scenario)) fail('noncanonical-genesis');
  if (!same(genesis.snapshot, s.snapshot)) fail('genesis-snapshot-mismatch');
  const entries = list(r.acceptedCommands, MAX_HISTORY);
  for (let i = 0; i < entries.length; i++) {
    try {
      const entry = object(entries[i], ['envelope', 'receipt']), env = envelope(entry.envelope);
      if (!same(entry.envelope, env)) fail('noncanonical-envelope');
      const next = executeDetached(s, env); if (next.duplicate) fail('duplicate-accepted-entry');
      if (!same(entry.receipt, next.receipt)) fail('receipt-mismatch'); s = next.state;
    } catch (e) { const f = failure(e); fail(f.reason, i); }
  }
  if (!same(r.snapshot, s.snapshot)) fail('snapshot-mismatch'); budget(s); budgetSave(s); return s;
}
/** Creation freezes the complete supplied raw pools, stable facts and policy. */
export function createCitySearchStateV1(input: unknown): CitySearchStateResultV1 {
  try { const state = initialState(scenario(detach(input))); const result: StateResult = { ok: true, state }; budget(result); budgetSave(state); return freeze(result); } catch (e) { return freeze(failure(e)); }
}
function safeCommandId(v: unknown): string | null {
  try { if (v === null || typeof v !== 'object') return null; const d = Object.getOwnPropertyDescriptor(v, 'id'); return d && 'value' in d && typeof d.value === 'string' && /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,63}$/.test(d.value) ? d.value : null; } catch { return null; }
}
function commandResult(input: unknown, rawCommand: unknown): CommandResult {
  let state: State | null = null; const commandId = safeCommandId(rawCommand);
  try { state = reconstruct(detach(input)); const env = envelope(detach(rawCommand)); return executeDetached(state, env); }
  catch (e) { return failure(e, state?.snapshot ?? null, commandId); }
}
export function executeCitySearchV1(input: unknown, rawCommand: unknown): CitySearchCommandResultV1 { return freeze(commandResult(input, rawCommand)); }
/** Identical command/save budget gate, followed by the complete preview-output budget gate. */
export function previewCitySearchV1(input: unknown, rawCommand: unknown): CitySearchPreviewResultV1 {
  const result = commandResult(input, rawCommand); if (!result.ok) return freeze(result);
  try { const preview: PreviewResult = { ok: true, committed: false, duplicate: result.duplicate, receipt: result.receipt, projectedSnapshot: result.state.snapshot }; budget(preview); return freeze(preview); }
  catch (e) { return freeze(failure(e, result.duplicate ? result.state.snapshot : { revision: result.receipt.revisionBefore, turn: result.receipt.turnBefore }, result.receipt.commandId)); }
}
export function saveCitySearchV1(input: unknown): CitySearchSaveResultV1 {
  try { return freeze(budgetSave(reconstruct(detach(input)))); } catch (e) { return freeze(failure(e)); }
}
export function loadCitySearchV1(json: unknown): CitySearchStateResultV1 {
  try { const state = reconstruct(parseJson(json)); const result: StateResult = { ok: true, state }; budget(result); budgetSave(state); return freeze(result); } catch (e) { return freeze(failure(e)); }
}
/** Expected outcomes assert the full derived results; they cannot provide success, rolls or losses. */
export function replayCitySearchV1(input: unknown): CitySearchReplayResultV1 {
  try {
    const r = object(detach(input), ['tag', 'scenario', 'attempts', 'expectedFinalSnapshot']); if (r.tag !== TRACE_TAG) fail('unsupported-profile');
    let state = initialState(scenario(r.scenario)); budget({ ok: true, state }); budgetSave(state); const attempts = list(r.attempts, MAX_ATTEMPTS), outcomes: ExpectedOutcome[] = [];
    for (let i = 0; i < attempts.length; i++) {
      try {
        const a = object(attempts[i], ['envelope', 'expectedOutcome']); let outcome: ExpectedOutcome, nextState = state;
        try { const result = executeDetached(state, envelope(a.envelope)); nextState = result.state; outcome = { ok: true, duplicate: result.duplicate, receipt: result.receipt }; }
        catch (e) { outcome = failure(e, state.snapshot, safeCommandId(a.envelope)); }
        if (a.expectedOutcome !== null && !same(a.expectedOutcome, outcome)) fail('trace-outcome-mismatch');
        state = nextState; outcomes.push(outcome);
      } catch (e) { const f = failure(e); fail(f.reason, i); }
    }
    if (r.expectedFinalSnapshot !== null && !same(r.expectedFinalSnapshot, state.snapshot)) fail('trace-snapshot-mismatch');
    const result: ReplayResult = { ok: true, state, outcomes }; budget(result); budgetSave(state); return freeze(result);
  } catch (e) { return freeze(failure(e)); }
}
