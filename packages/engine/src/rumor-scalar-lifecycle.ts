/** Independent two-city scalar policy. Never a substitute for the original world Rumor command. */
import policyData from '../../../data/catalogs/rumor-scalar-policy-v1.json' with { type: 'json' };

type Frozen<T> = T extends object ? { readonly [K in keyof T]: Frozen<T[K]> } : T;
const PROFILE = 'standalone-rumor-scalar-v1' as const;
const SCOPE = 'two-fixed-cities-ordinary-scalar-only' as const;
const TAG = 'rumor-scalar-state-v1' as const;
const TRACE_TAG = 'rumor-scalar-trace-v1' as const;
const MAX_BYTES = 8_388_608, MAX_SCENARIO_BYTES = 524_288, MAX_NODES = 262_144, MAX_DEPTH = 32, MAX_ARRAY = 1024;
const MAX_HISTORY = 1024, MAX_ATTEMPTS = 1024;
type DateV1 = { year: number; month: number; day: 1 | 11 | 21 };
type Policy = typeof policyData;
type AttackingForce = { id: string };
type TargetForce = { id: string; rulerId: string };
type OriginCity = { id: string; forceId: string; gold: number; actionPoints: number; hasStrategyOffice: boolean };
type Defense = { governorId: string; strategistId: string; governorIntelligence: number; rulerIntelligence: number; strategistIntelligence: number };
type TargetCity = { id: string; forceId: string; security: number; defense: Defense };
type Actor = { id: string; forceId: string; cityId: string; kind: 'ordinary-fixed-resident'; intelligence: number; usedThisTurn: boolean };
type Officer = { id: string; forceId: string; cityId: string; kind: 'ordinary-fixed-resident'; trueLoyalty: number; giriInternal: number };
type Directed = { from: string; to: string };
type Pair = [string, string];
type Relations = { likes: Directed[]; spouses: Pair[]; swornSiblings: Pair[] };
type Scenario = { schemaVersion: 1; profile: typeof PROFILE; scope: typeof SCOPE; date: DateV1; advanceLimit: number; attackingForce: AttackingForce; targetForce: TargetForce; relation: 'hostile'; originCity: OriginCity; targetCity: TargetCity; actors: Actor[]; targetOfficers: Officer[]; relations: Relations; rng: { kind: 'xorshift32-nonzero-rejection-v1'; seed: number }; policy: Policy };
type ActorState = { id: string; lastUsedTurn: number | null };
type OfficerState = { id: string; trueLoyalty: number };
type RngState = { state: number; drawCount: number };
type Snapshot = { revision: number; turn: number; advancedCount: number; date: DateV1; gold: number; actionPoints: number; security: number; actors: ActorState[]; targetOfficers: OfficerState[]; rng: RngState };
type Command = { type: 'AttemptRumorScalar'; actorId: string; targetCityId: string } | { type: 'AdvanceRumorTurn' };
type Envelope = { id: string; expectedRevision: number; command: Command };
type DrawLabel = 'success' | 'security-loss' | 'target-slot' | 'susceptibility' | 'loyalty-loss';
type Draw = { drawIndex: number; label: DrawLabel; targetId: string | null; bound: number; beforeState: number; afterState: number; accepted: boolean; value: number | null };
type ProtectionReason = 'likes-ruler' | 'spouse-of-ruler' | 'sworn-sibling-of-ruler';
type Protection = { officerId: string; reasons: ProtectionReason[] };
type LoyaltyWrite = { officerId: string; trueBefore: number; displayBefore: number; requestedLoss: number; actualLoss: number; trueAfter: number; displayAfter: number };
type SecurityWrite = { before: number; requestedLoss: number; actualLoss: number; after: number };
type SuccessCalculation = { actorIntelligence: number; defense: Defense; defenseAverage: number; hasStrategyOffice: boolean; facilityWeight: number; successWeight: number; resistanceWeight: number; threshold: number; denominator: number; roll: number; success: boolean };
type Selection = { status: 'not-reached' | 'empty-pool' | 'empty-slot' | 'resisted' | 'loyalty-loss-applied'; sortedCandidateIds: string[]; protected: Protection[]; slot: number | null; selectedOfficerId: string | null; giriInternal: number | null; susceptibilityThreshold: number | null; susceptibilityRoll: number | null; susceptible: boolean | null; loyalty: LoyaltyWrite | null };
const BOUNDARY = {
  sourceLevel: 'official-cost-and-direction-plus-explicit-synthetic-policy',
  originalCommandEquivalent: false, worldActionSupported: false,
  originalCaptureRisk: 'unresolved-not-modeled', travelAndMission: 'not-modeled',
  failureDiplomacy: 'not-modeled', xpMeritTp: 'not-modeled',
  ownershipAndDeparture: 'frozen-not-modeled', ownershipFrozen: true,
  banditAndWorldConsequences: 'not-modeled',
  successFormula: 'synthetic-weighted-odds-v1', originalSuccessProbabilityCertified: false,
  defenseRoles: 'fixed-distinct-three-role-facts', originalRoleSelectorsCertified: false,
  relationProtection: 'synthetic-absolute-protection-v1', susceptibility: 'synthetic-giri-thresholds-v1',
  effectSelection: 'synthetic-at-most-one-plus-empty-slot-v1', losses: 'synthetic-security1to6-loyalty1to12-v1',
  randomStream: 'standalone-nonzero-xorshift32-rejection-v1', nativeRandomStreamEquivalent: false,
  nativeWriterCertified: false, zeroLoyaltyChangesMembership: false,
  sourceSarOperandWidthConflict: 'unresolved-text-versus-bytes', stockOrCrossVersionCertified: false,
  original43GroupsReduced: false,
} as const;
const UNSUPPORTED = ['world-rumor-command', 'travel-or-mission', 'capture', 'failure-diplomacy', 'xp-merit-tp', 'ownership-changes', 'departure', 'bandit-consequences', 'force-extinction', 'ruler-succession', 'return', 'relocation', 'native-finalizers', 'prisoners', 'salary-consequences', 'treasures', 'natural-loyalty', 'cash-reward', 'recruitment', 'resource-refresh', 'world-clock', 'shared-service-accounts', 'native-saves'] as const;
type ActorQualification = { actorId: string; originCityId: string; ordinaryResident: true; eligibleBefore: true; lastUsedTurnBefore: number | null; lastUsedTurnAfter: number };
type Receipt = { schemaVersion: 1; profile: typeof PROFILE; scope: typeof SCOPE; commandId: string; envelope: Envelope; policy: Policy; sourceBoundary: typeof BOUNDARY; unsupported: string[]; revisionBefore: number; revisionAfter: number; turnBefore: number; turnAfter: number; dateBefore: DateV1; dateAfter: DateV1; targetCityId: string; actor: ActorQualification | null; outcome: 'probability-success' | 'probability-failure' | 'turn-advanced'; successCalculation: SuccessCalculation | null; selection: Selection | null; security: SecurityWrite; resources: { goldBefore: number; goldCost: number; goldAfter: number; actionPointsBefore: number; actionPointsCost: number; actionPointsAfter: number }; draws: Draw[]; writeSet: { before: Snapshot; after: Snapshot } };
type State = { tag: typeof TAG; schemaVersion: 1; profile: typeof PROFILE; scope: typeof SCOPE; policy: Policy; sourceBoundary: typeof BOUNDARY; genesis: { scenario: Scenario; snapshot: Snapshot }; snapshot: Snapshot; acceptedCommands: { envelope: Envelope; receipt: Receipt }[] };
type Failure = { ok: false; committed: false; reason: string; revision: number | null; turn: number | null; commandId: string | null; index: number | null };
type StateResult = { ok: true; state: State } | Failure;
type CommandResult = { ok: true; committed: boolean; duplicate: boolean; state: State; receipt: Receipt } | Failure;
type PreviewResult = { ok: true; committed: false; duplicate: boolean; receipt: Receipt; projectedSnapshot: Snapshot } | Failure;
type SaveResult = { ok: true; json: string } | Failure;
type Inspection = { ok: true; snapshot: Snapshot; actors: { id: string; usedThisTurn: boolean; hasAttemptBudget: boolean; eligible: boolean }[]; targetOfficers: { id: string; trueLoyalty: number; displayedLoyalty: number; protectionReasons: ProtectionReason[] }[]; sourceBoundary: typeof BOUNDARY; unsupported: string[] } | Failure;
type ExpectedOutcome = { ok: true; duplicate: boolean; receipt: Receipt } | Failure;
type Trace = { tag: typeof TRACE_TAG; scenario: Scenario; attempts: { envelope: Envelope; expectedOutcome: ExpectedOutcome | null }[]; expectedFinalSnapshot: Snapshot | null };
type ReplayResult = { ok: true; state: State; outcomes: ExpectedOutcome[] } | Failure;
export type RumorScalarScenarioV1 = Frozen<Scenario>;
export type RumorScalarStateV1 = Frozen<State>;
export type RumorScalarSnapshotV1 = Frozen<Snapshot>;
export type RumorScalarCommandV1 = Frozen<Command>;
export type RumorScalarEnvelopeV1 = Frozen<Envelope>;
export type RumorScalarPolicyV1 = Frozen<Policy>;
export type RumorScalarRelationsV1 = Frozen<Relations>;
export type RumorScalarDrawV1 = Frozen<Draw>;
export type RumorScalarSelectionV1 = Frozen<Selection>;
export type RumorScalarLoyaltyWriteV1 = Frozen<LoyaltyWrite>;
export type RumorScalarReceiptV1 = Frozen<Receipt>;
export type RumorScalarFailureV1 = Frozen<Failure>;
export type RumorScalarStateResultV1 = Frozen<StateResult>;
export type RumorScalarCommandResultV1 = Frozen<CommandResult>;
export type RumorScalarPreviewResultV1 = Frozen<PreviewResult>;
export type RumorScalarSaveResultV1 = Frozen<SaveResult>;
export type RumorScalarInspectionV1 = Frozen<Inspection>;
export type RumorScalarTraceV1 = Frozen<Trace>;
export type RumorScalarReplayResultV1 = Frozen<ReplayResult>;

class Invalid extends Error {
  readonly reason: string; readonly index: number | null;
  constructor(reason: string, index: number | null = null) { super(reason); this.reason = reason; this.index = index; }
}
function fail(reason: string, index: number | null = null): never { throw new Invalid(reason, index); }
function failure(e: unknown, snapshot: Snapshot | null = null, commandId: string | null = null): Failure {
  return { ok: false, committed: false, reason: e instanceof Invalid ? e.reason : 'invalid-input', revision: snapshot?.revision ?? null, turn: snapshot?.turn ?? null, commandId, index: e instanceof Invalid ? e.index : null };
}
function freeze<T>(v: T): Frozen<T> { if (v !== null && typeof v === 'object' && !Object.isFrozen(v)) { for (const x of Object.values(v)) freeze(x); Object.freeze(v); } return v as Frozen<T>; }
function clone<T>(v: T): T { return JSON.parse(JSON.stringify(v)) as T; }
function canonical(v: unknown): string { if (v === null || typeof v !== 'object') return JSON.stringify(v); if (Array.isArray(v)) return '[' + v.map(canonical).join(',') + ']'; const r = v as Record<string, unknown>; return '{' + Object.keys(r).sort().map(k => JSON.stringify(k) + ':' + canonical(r[k])).join(',') + '}'; }
function same(a: unknown, b: unknown): boolean { return canonical(a) === canonical(b); }
function utf8Bytes(s: string): number { let n = 0; for (const c of s) { const p = c.codePointAt(0)!; n += p < 128 ? 1 : p < 2048 ? 2 : p < 65536 ? 3 : 4; } return n; }
/** Finite descriptor-only JSON copy. Domain parsers and recomputation enforce integer fields. */
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
    if (keys.some(k => typeof k !== 'string' || !Object.hasOwn(ds[k]!, 'value') || (!ds[k]!.enumerable && !(arr && k === 'length')))) fail('invalid-data');
    active.add(x);
    try {
      if (arr) {
        const n = ds.length!.value as number;
        if (!Number.isSafeInteger(n) || n < 0 || n > MAX_ARRAY) fail('serialization-budget');
        if (keys.length !== n + 1) fail('invalid-array');
        const out: unknown[] = [];
        for (let i = 0; i < n; i++) { const d = ds[String(i)]; if (!d) fail('invalid-array'); out.push(visit(d.value, depth + 1)); }
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
export const RUMOR_SCALAR_POLICY_REGISTRY_V1 = freeze([clone(POLICY)]);
export const RUMOR_SCALAR_DEFAULT_POLICY_V1 = freeze(POLICY);
export const RUMOR_SCALAR_EVIDENCE_V1 = freeze(BOUNDARY);
export const RUMOR_SCALAR_UNSUPPORTED_V1 = freeze(UNSUPPORTED);
const order = (a: string, b: string): number => a < b ? -1 : a > b ? 1 : 0;
function unique<T>(items: T[]): void { if (new Set(items).size !== items.length) fail('inconsistent-scenario'); }
function relationGraph(v: unknown, rulerId: string, targetIds: Set<string>): Relations {
  const r = object(v, ['likes', 'spouses', 'swornSiblings']);
  const edge = (a: string, b: string): void => {
    if (a === b || !((a === rulerId && targetIds.has(b)) || (b === rulerId && targetIds.has(a)))) fail('inconsistent-scenario');
  };
  const likes = list(r.likes, 256).map(x => { const d = object(x, ['from', 'to']); const from = id(d.from), to = id(d.to); edge(from, to); return { from, to }; });
  unique(likes.map(canonical)); likes.sort((a, b) => order(a.from, b.from) || order(a.to, b.to));
  const pairs = (v: unknown): Pair[] => {
    const rows = list(v, 128).map((x): Pair => { const p = list(x, 2); if (p.length !== 2) fail('inconsistent-scenario'); const a = id(p[0]), b = id(p[1]); edge(a, b); return order(a, b) < 0 ? [a, b] : [b, a]; });
    unique(rows.map(canonical)); return rows.sort((a, b) => order(a[0], b[0]) || order(a[1], b[1]));
  };
  const spouses = pairs(r.spouses), swornSiblings = pairs(r.swornSiblings); unique(spouses.flat());
  return { likes, spouses, swornSiblings };
}
function scenario(v: unknown): Scenario {
  if (utf8Bytes(canonical(v)) > MAX_SCENARIO_BYTES) fail('serialization-budget');
  const r = object(v, ['schemaVersion', 'profile', 'scope', 'date', 'advanceLimit', 'attackingForce', 'targetForce', 'relation', 'originCity', 'targetCity', 'actors', 'targetOfficers', 'relations', 'rng', 'policy']);
  if (r.schemaVersion !== 1 || r.profile !== PROFILE || r.scope !== SCOPE) fail('unsupported-profile');
  if (!same(r.policy, POLICY)) fail('policy-mismatch');
  if (r.relation !== 'hostile') fail('inconsistent-scenario');
  const d = date(r.date), advanceLimit = uint(r.advanceLimit, 360, 1);
  let horizon = d; for (let i = 0; i < advanceLimit; i++) horizon = nextDate(horizon);
  const af = object(r.attackingForce, ['id']), tf = object(r.targetForce, ['id', 'rulerId']);
  const attackingForce: AttackingForce = { id: id(af.id) }, targetForce: TargetForce = { id: id(tf.id), rulerId: id(tf.rulerId) };
  if (attackingForce.id === targetForce.id) fail('inconsistent-scenario');
  const oc = object(r.originCity, ['id', 'forceId', 'gold', 'actionPoints', 'hasStrategyOffice']);
  const originCity: OriginCity = { id: id(oc.id), forceId: id(oc.forceId), gold: uint(oc.gold, 1_000_000_000), actionPoints: uint(oc.actionPoints, 1_000_000_000), hasStrategyOffice: bool(oc.hasStrategyOffice) };
  const tc = object(r.targetCity, ['id', 'forceId', 'security', 'defense']);
  const def = object(tc.defense, ['governorId', 'strategistId', 'governorIntelligence', 'rulerIntelligence', 'strategistIntelligence']);
  const defense: Defense = { governorId: id(def.governorId), strategistId: id(def.strategistId), governorIntelligence: uint(def.governorIntelligence, 100), rulerIntelligence: uint(def.rulerIntelligence, 100), strategistIntelligence: uint(def.strategistIntelligence, 100) };
  const targetCity: TargetCity = { id: id(tc.id), forceId: id(tc.forceId), security: uint(tc.security, 100), defense };
  if (originCity.id === targetCity.id || originCity.forceId !== attackingForce.id || targetCity.forceId !== targetForce.id) fail('inconsistent-scenario');
  const actors: Actor[] = list(r.actors, 32).map(x => {
    const a = object(x, ['id', 'forceId', 'cityId', 'kind', 'intelligence', 'usedThisTurn']);
    if (a.kind !== 'ordinary-fixed-resident') fail('unsupported-personnel-scope');
    const actor: Actor = { id: id(a.id), forceId: id(a.forceId), cityId: id(a.cityId), kind: 'ordinary-fixed-resident', intelligence: uint(a.intelligence, 100), usedThisTurn: bool(a.usedThisTurn) };
    if (actor.forceId !== attackingForce.id || actor.cityId !== originCity.id) fail('inconsistent-scenario'); return actor;
  });
  if (actors.length === 0) fail('inconsistent-scenario'); actors.sort((a, b) => order(a.id, b.id));
  const targetOfficers: Officer[] = list(r.targetOfficers, 128).map(x => {
    const o = object(x, ['id', 'forceId', 'cityId', 'kind', 'trueLoyalty', 'giriInternal']);
    if (o.kind !== 'ordinary-fixed-resident') fail('unsupported-personnel-scope');
    const officer: Officer = { id: id(o.id), forceId: id(o.forceId), cityId: id(o.cityId), kind: 'ordinary-fixed-resident', trueLoyalty: uint(o.trueLoyalty, 255), giriInternal: uint(o.giriInternal, 4) };
    if (officer.forceId !== targetForce.id || officer.cityId !== targetCity.id) fail('inconsistent-scenario'); return officer;
  });
  targetOfficers.sort((a, b) => order(a.id, b.id));
  unique([targetForce.rulerId, defense.governorId, defense.strategistId, ...actors.map(a => a.id), ...targetOfficers.map(o => o.id)]);
  const relations = relationGraph(r.relations, targetForce.rulerId, new Set(targetOfficers.map(o => o.id)));
  const rng = object(r.rng, ['kind', 'seed']); if (rng.kind !== POLICY.rng.kind) fail('policy-mismatch');
  return { schemaVersion: 1, profile: PROFILE, scope: SCOPE, date: d, advanceLimit, attackingForce, targetForce, relation: 'hostile', originCity, targetCity, actors, targetOfficers, relations, rng: { kind: 'xorshift32-nonzero-rejection-v1', seed: uint(rng.seed, 4_294_967_295, 1) }, policy: clone(POLICY) };
}
function envelope(v: unknown): Envelope {
  const r = object(v, ['id', 'expectedRevision', 'command']);
  const commandId = id(r.id), expectedRevision = uint(r.expectedRevision, MAX_HISTORY);
  if (r.command === null || typeof r.command !== 'object' || Array.isArray(r.command)) fail('invalid-input');
  const kind = (r.command as Record<string, unknown>).type; let command: Command;
  if (kind === 'AttemptRumorScalar') { const c = object(r.command, ['type', 'actorId', 'targetCityId']); command = { type: 'AttemptRumorScalar', actorId: id(c.actorId), targetCityId: id(c.targetCityId) }; }
  else if (kind === 'AdvanceRumorTurn') { object(r.command, ['type']); command = { type: 'AdvanceRumorTurn' }; }
  else fail('unsupported-world-rumor-command');
  return { id: commandId, expectedRevision, command };
}
function initialState(s: Scenario): State {
  const snapshot: Snapshot = { revision: 0, turn: 0, advancedCount: 0, date: clone(s.date), gold: s.originCity.gold, actionPoints: s.originCity.actionPoints, security: s.targetCity.security, actors: s.actors.map(a => ({ id: a.id, lastUsedTurn: a.usedThisTurn ? 0 : null })), targetOfficers: s.targetOfficers.map(o => ({ id: o.id, trueLoyalty: o.trueLoyalty })), rng: { state: s.rng.seed, drawCount: 0 } };
  return { tag: TAG, schemaVersion: 1, profile: PROFILE, scope: SCOPE, policy: clone(s.policy), sourceBoundary: clone(BOUNDARY), genesis: { scenario: clone(s), snapshot: clone(snapshot) }, snapshot, acceptedCommands: [] };
}
/** Nonzero-domain rejection sampling. Neither this stream nor consumption order models stock RNG. */
function nextBounded(rng: RngState, bound: number, label: DrawLabel, targetId: string | null, draws: Draw[]): number {
  const domain = POLICY.rng.nonzeroDomainSize, limit = domain - (domain % bound);
  for (let i = 0; i < POLICY.rng.maxRawPerBoundedDraw; i++) {
    const beforeState = rng.state; let x = beforeState;
    x = (x ^ (x << 13)) >>> 0; x = (x ^ (x >>> 17)) >>> 0; x = (x ^ (x << 5)) >>> 0;
    const u = x - 1, accepted = u < limit, value = accepted ? u % bound : null;
    rng.state = x; rng.drawCount++;
    draws.push({ drawIndex: rng.drawCount, label, targetId, bound, beforeState, afterState: x, accepted, value });
    if (value !== null) return value;
  }
  return fail('rng-draw-budget');
}
function protectionReasons(s: Scenario, officerId: string): ProtectionReason[] {
  const lord = s.targetForce.rulerId, graph = s.relations, reasons: ProtectionReason[] = [];
  const pairHas = (pairs: Pair[]) => pairs.some(p => p.includes(lord) && p.includes(officerId));
  if (graph.likes.some(e => e.from === officerId && e.to === lord)) reasons.push('likes-ruler');
  if (pairHas(graph.spouses)) reasons.push('spouse-of-ruler');
  if (pairHas(graph.swornSiblings)) reasons.push('sworn-sibling-of-ruler');
  return reasons;
}
function initialSelection(s: Scenario): Selection {
  const sortedCandidateIds: string[] = [], protectedOfficers: Protection[] = [];
  for (const o of s.targetOfficers) {
    const reasons = protectionReasons(s, o.id);
    if (reasons.length) protectedOfficers.push({ officerId: o.id, reasons }); else sortedCandidateIds.push(o.id);
  }
  return { status: 'not-reached', sortedCandidateIds, protected: protectedOfficers, slot: null, selectedOfficerId: null, giriInternal: null, susceptibilityThreshold: null, susceptibilityRoll: null, susceptible: null, loyalty: null };
}
function resolve(s: Scenario, before: Snapshot, env: Envelope): { snapshot: Snapshot; receipt: Receipt } {
  const after = clone(before), draws: Draw[] = [];
  let goldCost = 0, apCost = 0, actor: ActorQualification | null = null, successCalculation: SuccessCalculation | null = null, selection: Selection | null = null;
  let outcome: Receipt['outcome'] = 'turn-advanced';
  const security: SecurityWrite = { before: before.security, requestedLoss: 0, actualLoss: 0, after: before.security };
  if (env.command.type === 'AttemptRumorScalar') {
    if (env.command.targetCityId !== s.targetCity.id) fail('wrong-target-city');
    const actorId = env.command.actorId, facts = s.actors.find(a => a.id === actorId), current = after.actors.find(a => a.id === actorId);
    if (!facts || !current) fail('unknown-actor');
    if (current.lastUsedTurn === before.turn) fail('actor-already-used');
    goldCost = s.policy.costs.gold; apCost = s.policy.costs.actionPoints;
    if (before.gold < goldCost) fail('insufficient-gold'); if (before.actionPoints < apCost) fail('insufficient-ap');
    actor = { actorId, originCityId: s.originCity.id, ordinaryResident: true, eligibleBefore: true, lastUsedTurnBefore: current.lastUsedTurn, lastUsedTurnAfter: before.turn };
    selection = initialSelection(s);
    const def = s.targetCity.defense, p = s.policy.success;
    const defenseAverage = Math.floor((def.governorIntelligence + def.rulerIntelligence + def.strategistIntelligence) / 3);
    const facilityWeight = s.originCity.hasStrategyOffice ? p.facilityWeights.withStrategyOffice : p.facilityWeights.withoutStrategyOffice;
    const successWeight = (facts.intelligence + p.intelligenceOffset) * facilityWeight, resistanceWeight = (defenseAverage + p.intelligenceOffset) * p.defenseWeight;
    const threshold = Math.floor(p.rollDenominator * successWeight / (successWeight + resistanceWeight));
    const roll = nextBounded(after.rng, p.rollDenominator, 'success', s.targetCity.id, draws), success = roll < threshold;
    successCalculation = { actorIntelligence: facts.intelligence, defense: clone(def), defenseAverage, hasStrategyOffice: s.originCity.hasStrategyOffice, facilityWeight, successWeight, resistanceWeight, threshold, denominator: p.rollDenominator, roll, success };
    outcome = success ? 'probability-success' : 'probability-failure';
    if (success) {
      // Saturated security and zero/over-100 loyalty follow exactly the same random path.
      security.requestedLoss = s.policy.loss.securityMinimum + nextBounded(after.rng, s.policy.loss.securityBound, 'security-loss', s.targetCity.id, draws);
      security.after = Math.max(0, security.before - security.requestedLoss); security.actualLoss = security.before - security.after; after.security = security.after;
      const count = selection.sortedCandidateIds.length;
      if (count === 0) selection.status = 'empty-pool';
      else {
        const slot = nextBounded(after.rng, count + s.policy.selection.emptySlots, 'target-slot', null, draws); selection.slot = slot;
        if (slot === count) selection.status = 'empty-slot';
        else {
          const selectedId = selection.sortedCandidateIds[slot]!, targetFacts = s.targetOfficers.find(o => o.id === selectedId)!, target = after.targetOfficers.find(o => o.id === selectedId)!;
          selection.selectedOfficerId = selectedId; selection.giriInternal = targetFacts.giriInternal;
          selection.susceptibilityThreshold = s.policy.susceptibility.acceptanceThresholdsByGiri[targetFacts.giriInternal]!;
          selection.susceptibilityRoll = nextBounded(after.rng, s.policy.susceptibility.rollDenominator, 'susceptibility', selectedId, draws);
          selection.susceptible = selection.susceptibilityRoll < selection.susceptibilityThreshold;
          if (!selection.susceptible) selection.status = 'resisted';
          else {
            const requestedLoss = s.policy.loss.loyaltyMinimum + nextBounded(after.rng, s.policy.loss.loyaltyBound, 'loyalty-loss', selectedId, draws);
            const trueBefore = target.trueLoyalty, trueAfter = Math.max(0, trueBefore - requestedLoss);
            selection.loyalty = { officerId: selectedId, trueBefore, displayBefore: Math.min(100, trueBefore), requestedLoss, actualLoss: trueBefore - trueAfter, trueAfter, displayAfter: Math.min(100, trueAfter) };
            selection.status = 'loyalty-loss-applied'; target.trueLoyalty = trueAfter;
          }
        }
      }
    }
    // An ordinary probability failure is an accepted, paid attempt with an actor-use record.
    after.gold -= goldCost; after.actionPoints -= apCost; current.lastUsedTurn = before.turn;
  } else {
    if (before.advancedCount >= s.advanceLimit) fail('advance-limit');
    after.date = nextDate(before.date); after.turn++; after.advancedCount++;
  }
  after.revision++;
  const receipt: Receipt = { schemaVersion: 1, profile: PROFILE, scope: SCOPE, commandId: env.id, envelope: clone(env), policy: clone(s.policy), sourceBoundary: clone(BOUNDARY), unsupported: [...UNSUPPORTED], revisionBefore: before.revision, revisionAfter: after.revision, turnBefore: before.turn, turnAfter: after.turn, dateBefore: clone(before.date), dateAfter: clone(after.date), targetCityId: s.targetCity.id, actor, outcome, successCalculation, selection, security, resources: { goldBefore: before.gold, goldCost, goldAfter: after.gold, actionPointsBefore: before.actionPoints, actionPointsCost: apCost, actionPointsAfter: after.actionPoints }, draws, writeSet: { before: clone(before), after: clone(after) } };
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
/** Creation freezes only the supplied ordinary two-city scalar subscenario. */
export function createRumorScalarStateV1(input: unknown): RumorScalarStateResultV1 {
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
export function executeRumorScalarV1(input: unknown, rawCommand: unknown): RumorScalarCommandResultV1 { return freeze(commandResult(input, rawCommand)); }
/** Identical command/save budget gate, followed by the complete preview-output budget gate. */
export function previewRumorScalarV1(input: unknown, rawCommand: unknown): RumorScalarPreviewResultV1 {
  const result = commandResult(input, rawCommand); if (!result.ok) return freeze(result);
  try { const preview: PreviewResult = { ok: true, committed: false, duplicate: result.duplicate, receipt: result.receipt, projectedSnapshot: result.state.snapshot }; budget(preview); return freeze(preview); }
  catch (e) { return freeze(failure(e, result.duplicate ? result.state.snapshot : result.receipt.writeSet.before, result.receipt.commandId)); }
}
export function inspectRumorScalarV1(input: unknown): RumorScalarInspectionV1 {
  try {
    const state = reconstruct(detach(input)), s = state.genesis.scenario, snapshot = state.snapshot;
    const hasAttemptBudget = snapshot.gold >= s.policy.costs.gold && snapshot.actionPoints >= s.policy.costs.actionPoints;
    const result: Inspection = { ok: true, snapshot, actors: snapshot.actors.map(a => ({ id: a.id, usedThisTurn: a.lastUsedTurn === snapshot.turn, hasAttemptBudget, eligible: a.lastUsedTurn !== snapshot.turn && hasAttemptBudget && state.acceptedCommands.length < MAX_HISTORY })), targetOfficers: snapshot.targetOfficers.map(o => ({ id: o.id, trueLoyalty: o.trueLoyalty, displayedLoyalty: Math.min(100, o.trueLoyalty), protectionReasons: protectionReasons(s, o.id) })), sourceBoundary: clone(BOUNDARY), unsupported: [...UNSUPPORTED] };
    budget(result); return freeze(result);
  } catch (e) { return freeze(failure(e)); }
}
export function saveRumorScalarV1(input: unknown): RumorScalarSaveResultV1 {
  try { return freeze(budgetSave(reconstruct(detach(input)))); } catch (e) { return freeze(failure(e)); }
}
export function loadRumorScalarV1(json: unknown): RumorScalarStateResultV1 {
  try { const state = reconstruct(parseJson(json)); const result: StateResult = { ok: true, state }; budget(result); budgetSave(state); return freeze(result); } catch (e) { return freeze(failure(e)); }
}
/** Expected outcomes assert the full derived results; they cannot provide success, rolls or losses. */
export function replayRumorScalarV1(input: unknown): RumorScalarReplayResultV1 {
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
