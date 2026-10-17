/** Fixed-city ordinary loyalty. Source-shaped natural rules plus an explicitly synthetic cash policy. */
import policyData from '../../../data/catalogs/personnel-loyalty-policies-v1.json' with { type: 'json' };
import { calculateAffinityDistance } from './affinity-distance.ts';
import type { AffinityDistanceReceipt } from './affinity-distance.ts';

type Frozen<T> = T extends object ? { readonly [K in keyof T]: Frozen<T[K]> } : T;
const PROFILE = 'standalone-personnel-loyalty-v1' as const;
const TAG = 'personnel-loyalty-state-v1' as const;
const TRACE_TAG = 'personnel-loyalty-trace-v1' as const;
const MAX_BYTES = 8_388_608, MAX_SCENARIO_BYTES = 524_288, MAX_NODES = 262_144, MAX_DEPTH = 32, MAX_ARRAY = 8192;
const MAX_HISTORY = 4096, MAX_ATTEMPTS = 4096;
type DateV1 = { year: number; month: number; day: 1 | 11 | 21 };
type Skill = 'benevolent-governance';
type Policies = typeof policyData;
type Force = { id: string; rulerId: string; hasHumanHeartControl: boolean };
type City = { id: string; ownerForceId: string; hasTokenPlatform: boolean; gold: number; actionPoints: number };
type Ruler = { id: string; forceId: string; affinityByte: number; giriInternal: number; ambitionInternal: number; charisma: number; skills: Skill[] };
type Officer = { id: string; forceId: string; cityId: string; kind: 'ordinary-fixed-resident'; trueLoyalty: number; affinityByte: number; giriInternal: number; ambitionInternal: number; skills: Skill[]; praisedThisTurn: boolean };
type Directed = { from: string; to: string };
type Pair = [string, string];
type ParentChild = { parent: string; child: string };
type Relations = { likes: Directed[]; dislikes: Directed[]; spouses: Pair[]; swornSiblings: Pair[]; parentChild: ParentChild[] };
type Scenario = { schemaVersion: 1; profile: typeof PROFILE; date: DateV1; initialDateAlreadySettled: true; advanceLimit: number; force: Force; city: City; ruler: Ruler; officers: Officer[]; relations: Relations; rng: { kind: 'xorshift32-nonzero-mod35-v1'; seed: number }; policies: Policies };
type OfficerState = { id: string; trueLoyalty: number; lastPraisedTurn: number | null };
type RngState = { state: number; drawCount: number };
type Snapshot = { revision: number; turn: number; advancedCount: number; date: DateV1; gold: number; actionPoints: number; officers: OfficerState[]; rng: RngState };
type Command = { type: 'CashReward'; targetOfficerIds: string[] } | { type: 'AdvancePersonnelTurn' };
type Envelope = { id: string; expectedRevision: number; command: Command };
type DrawLabel = 'cash-gain' | 'human-heart-control' | 'natural-loss-first' | 'natural-loss-second-lord' | 'natural-loss-second-ordinary';
type Draw = { drawIndex: number; label: DrawLabel; targetId: string; bound: 3 | 5; beforeState: number; afterState: number; value: number };
type CandidateReason = 'benevolence-exempt' | 'relation-exempt' | 'affinity-above-25' | 'low-giri-high-ambition' | 'dislikes-ruler' | 'not-candidate';
type Candidate = { policyId: string; reason: CandidateReason; eligible: boolean; benevolenceHolderIds: string[]; relationExemption: 'likes-ruler' | 'spouse' | 'sworn-sibling' | 'parent-child' | null; affinity: AffinityDistanceReceipt | null; traitBranch: { giriInternal: number; ambitionInternal: number; matched: boolean } | null; syntheticDislikeEax: 0 | 1 | null };
type Write = { trueBefore: number; displayBefore: number; requestedGain: number; actualGain: number; requestedLoss: number; actualLoss: number; trueAfter: number; displayAfter: number; policyId: string };
type OfficerReceipt = { officerId: string; qualification: 'cash-eligible' | 'natural-quarter-entry'; candidate: Candidate | null; status: 'cash-rewarded' | 'exempt' | 'not-candidate' | 'human-heart-protected' | 'natural-loss-applied'; loyalty: Write; lastPraisedTurnBefore: number | null; lastPraisedTurnAfter: number | null; controlRoll: number | null; cashGain: { policyId: string; roll: number; minimumGain: number; gain: number } | null; naturalLoss: { firstRoll: number; tokenAddition: number; lordAddition: number; secondRoll: number; lordBranch: boolean; requestedLoss: number } | null };
const BOUNDARY = {
  sourceLevel: 'public-caller-shape-and-explicit-standalone-software-policies',
  naturalCallerStockCertified: false, affinityCallerSameSourceCertified: false,
  tokenPlatformAdditionBasis: 'selected-listing-modification-marked-0058E759', tokenPlatformStockCertified: false,
  relationSemantics: 'explicit-local-relation-graph-v1', relationNativeHelpersCertified: false,
  cashGain: 'synthetic-cash-uniform5to9-v1', cashSamplesArePkDistribution: false,
  cashUsesRulerCharisma: false, cashUsesTargetGiri: false,
  cashFidelityDivergence: 'Original qualitative charm/loyalty-trait effects are not modeled by this synthetic gain policy',
  randomStream: 'session-local-shared-by-cash-and-natural-only', nativeRandomStreamEquivalent: false,
  nativeWriterCertified: false, nativePersonnelMutation: false, zeroLoyaltyChangesMembership: false,
  original43GroupsReduced: false,
} as const;
const UNSUPPORTED = ['native-capture', 'ownership-changes', 'force-extinction', 'ruler-succession', 'return', 'mission', 'relocation', 'native-finalizers', 'recruitment-membership-commit', 'prisoners', 'salary-consequences', 'salary-or-account-synchronization', 'rumors', 'treasures', 'death-or-illness', 'office-assignment', 'units', 'ports-or-gates', 'multi-city', 'global-turn-scheduling', 'native-saves'] as const;
type Receipt = { schemaVersion: 1; profile: typeof PROFILE; commandId: string; envelope: Envelope; policies: Policies; policyDigest: string; sourceBoundary: typeof BOUNDARY; unsupported: string[]; revisionBefore: number; revisionAfter: number; turnBefore: number; turnAfter: number; dateBefore: DateV1; dateAfter: DateV1; quarterEntry: boolean; sortedTargetIds: string[]; officers: OfficerReceipt[]; resources: { goldBefore: number; goldCost: number; goldAfter: number; actionPointsBefore: number; actionPointsCost: number; actionPointsAfter: number }; draws: Draw[]; writeSet: { before: Snapshot; after: Snapshot } };
type State = { tag: typeof TAG; schemaVersion: 1; profile: typeof PROFILE; policies: Policies; policyDigest: string; genesis: { scenario: Scenario; snapshot: Snapshot }; snapshot: Snapshot; acceptedCommands: { envelope: Envelope; receipt: Receipt }[] };
type Failure = { ok: false; committed: false; reason: string; revision: number | null; turn: number | null; commandId: string | null; index: number | null };
type StateResult = { ok: true; state: State } | Failure;
type CommandResult = { ok: true; committed: boolean; duplicate: boolean; state: State; receipt: Receipt } | Failure;
type PreviewResult = { ok: true; committed: false; duplicate: boolean; receipt: Receipt; projectedSnapshot: Snapshot } | Failure;
type SaveResult = { ok: true; json: string } | Failure;
type Inspection = { ok: true; snapshot: Snapshot; officers: { id: string; trueLoyalty: number; displayedLoyalty: number; praisedThisTurn: boolean; cashEligible: boolean }[]; sourceBoundary: typeof BOUNDARY; unsupported: string[] } | Failure;
type ExpectedOutcome = { ok: true; duplicate: boolean; receipt: Receipt } | Failure;
type Trace = { tag: typeof TRACE_TAG; scenario: Scenario; attempts: { envelope: Envelope; expectedOutcome: ExpectedOutcome | null }[]; expectedFinalSnapshot: Snapshot | null };
type ReplayResult = { ok: true; state: State; outcomes: ExpectedOutcome[] } | Failure;
export type PersonnelLoyaltyScenarioV1 = Frozen<Scenario>;
export type PersonnelLoyaltyStateV1 = Frozen<State>;
export type PersonnelLoyaltySnapshotV1 = Frozen<Snapshot>;
export type PersonnelLoyaltyCommandV1 = Frozen<Command>;
export type PersonnelLoyaltyEnvelopeV1 = Frozen<Envelope>;
export type PersonnelLoyaltyPoliciesV1 = Frozen<Policies>;
export type PersonnelLoyaltyRelationsV1 = Frozen<Relations>;
export type PersonnelLoyaltyDrawV1 = Frozen<Draw>;
export type PersonnelLoyaltyCandidateV1 = Frozen<Candidate>;
export type PersonnelLoyaltyWriteV1 = Frozen<Write>;
export type PersonnelLoyaltyOfficerReceiptV1 = Frozen<OfficerReceipt>;
export type PersonnelLoyaltyReceiptV1 = Frozen<Receipt>;
export type PersonnelLoyaltyFailureV1 = Frozen<Failure>;
export type PersonnelLoyaltyStateResultV1 = Frozen<StateResult>;
export type PersonnelLoyaltyCommandResultV1 = Frozen<CommandResult>;
export type PersonnelLoyaltyPreviewResultV1 = Frozen<PreviewResult>;
export type PersonnelLoyaltySaveResultV1 = Frozen<SaveResult>;
export type PersonnelLoyaltyInspectionV1 = Frozen<Inspection>;
export type PersonnelLoyaltyTraceV1 = Frozen<Trace>;
export type PersonnelLoyaltyReplayResultV1 = Frozen<ReplayResult>;

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
function choice<T extends string>(v: unknown, values: readonly T[], reason: string): T { if (!values.includes(v as T)) fail(reason); return v as T; }
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

const POLICIES = clone(policyData), POLICY_DIGEST = digest(POLICIES);
export const PERSONNEL_LOYALTY_POLICY_REGISTRY_V1 = freeze([clone(POLICIES)]);
export const PERSONNEL_LOYALTY_DEFAULT_POLICIES_V1 = freeze(POLICIES);
export const PERSONNEL_LOYALTY_POLICY_DIGEST_V1 = POLICY_DIGEST;
export const PERSONNEL_LOYALTY_EVIDENCE_V1 = freeze(BOUNDARY);
export const PERSONNEL_LOYALTY_UNSUPPORTED_V1 = freeze(UNSUPPORTED);
const order = (a: string, b: string): number => a < b ? -1 : a > b ? 1 : 0;
function unique<T>(items: T[], reason: string): void { if (new Set(items).size !== items.length) fail(reason); }
function skills(v: unknown): Skill[] { return list(v, 1).map(x => choice(x, ['benevolent-governance'], 'unsupported-personnel-scope')); }
function relationGraph(v: unknown, people: Set<string>): Relations {
  const r = object(v, ['likes', 'dislikes', 'spouses', 'swornSiblings', 'parentChild']);
  const member = (x: unknown): string => { const value = id(x); if (!people.has(value)) fail('inconsistent-scenario'); return value; };
  const directed = (raw: unknown): Directed[] => {
    const rows = list(raw, 6480).map(x => { const d = object(x, ['from', 'to']); const from = member(d.from), to = member(d.to); if (from === to) fail('inconsistent-scenario'); return { from, to }; });
    unique(rows.map(x => canonical(x)), 'inconsistent-scenario'); return rows.sort((a, b) => order(a.from, b.from) || order(a.to, b.to));
  };
  const pairs = (raw: unknown): Pair[] => {
    const rows: Pair[] = list(raw, 3240).map((x): Pair => { const p = list(x, 2); if (p.length !== 2) fail('inconsistent-scenario'); const a = member(p[0]), b = member(p[1]); if (a === b) fail('inconsistent-scenario'); return order(a, b) < 0 ? [a, b] : [b, a]; });
    unique(rows.map(canonical), 'inconsistent-scenario'); return rows.sort((a, b) => order(a[0], b[0]) || order(a[1], b[1]));
  };
  const likes = directed(r.likes), dislikes = directed(r.dislikes), spouses = pairs(r.spouses), swornSiblings = pairs(r.swornSiblings);
  unique(spouses.flat(), 'inconsistent-scenario');
  const parentChild = list(r.parentChild, 162).map(x => { const p = object(x, ['parent', 'child']); const parent = member(p.parent), child = member(p.child); if (parent === child) fail('inconsistent-scenario'); return { parent, child }; });
  unique(parentChild.map(canonical), 'inconsistent-scenario');
  for (const person of people) if (parentChild.filter(x => x.child === person).length > 2) fail('inconsistent-scenario');
  const visited = new Set<string>(), active = new Set<string>();
  function walk(person: string): void { if (active.has(person)) fail('inconsistent-scenario'); if (visited.has(person)) return; active.add(person); for (const edge of parentChild) if (edge.parent === person) walk(edge.child); active.delete(person); visited.add(person); }
  for (const person of people) walk(person);
  parentChild.sort((a, b) => order(a.parent, b.parent) || order(a.child, b.child));
  return { likes, dislikes, spouses, swornSiblings, parentChild };
}
function scenario(v: unknown): Scenario {
  if (utf8Bytes(canonical(v)) > MAX_SCENARIO_BYTES) fail('serialization-budget');
  const r = object(v, ['schemaVersion', 'profile', 'date', 'initialDateAlreadySettled', 'advanceLimit', 'force', 'city', 'ruler', 'officers', 'relations', 'rng', 'policies']);
  if (r.schemaVersion !== 1 || r.profile !== PROFILE) fail('unsupported-profile');
  if (r.initialDateAlreadySettled !== true) fail('inconsistent-scenario');
  if (!same(r.policies, POLICIES)) fail('policy-mismatch');
  const d = date(r.date), advanceLimit = uint(r.advanceLimit, 360, 1);
  let horizon = d; for (let i = 0; i < advanceLimit; i++) horizon = nextDate(horizon);
  const f = object(r.force, ['id', 'rulerId', 'hasHumanHeartControl']);
  const force: Force = { id: id(f.id), rulerId: id(f.rulerId), hasHumanHeartControl: bool(f.hasHumanHeartControl) };
  const c = object(r.city, ['id', 'ownerForceId', 'hasTokenPlatform', 'gold', 'actionPoints']);
  const city: City = { id: id(c.id), ownerForceId: id(c.ownerForceId), hasTokenPlatform: bool(c.hasTokenPlatform), gold: uint(c.gold, 1_000_000_000), actionPoints: uint(c.actionPoints, 1_000_000_000) };
  const lord = object(r.ruler, ['id', 'forceId', 'affinityByte', 'giriInternal', 'ambitionInternal', 'charisma', 'skills']);
  const ruler: Ruler = { id: id(lord.id), forceId: id(lord.forceId), affinityByte: uint(lord.affinityByte, 255), giriInternal: uint(lord.giriInternal, 4), ambitionInternal: uint(lord.ambitionInternal, 4), charisma: uint(lord.charisma, 100), skills: skills(lord.skills) };
  if (city.ownerForceId !== force.id || ruler.forceId !== force.id || ruler.id !== force.rulerId) fail('inconsistent-scenario');
  const officers: Officer[] = list(r.officers, 80).map(x => {
    const o = object(x, ['id', 'forceId', 'cityId', 'kind', 'trueLoyalty', 'affinityByte', 'giriInternal', 'ambitionInternal', 'skills', 'praisedThisTurn']);
    if (o.kind !== 'ordinary-fixed-resident') fail('unsupported-personnel-scope');
    const officer: Officer = { id: id(o.id), forceId: id(o.forceId), cityId: id(o.cityId), kind: 'ordinary-fixed-resident', trueLoyalty: uint(o.trueLoyalty, 255), affinityByte: uint(o.affinityByte, 255), giriInternal: uint(o.giriInternal, 4), ambitionInternal: uint(o.ambitionInternal, 4), skills: skills(o.skills), praisedThisTurn: bool(o.praisedThisTurn) };
    if (officer.forceId !== force.id || officer.cityId !== city.id || officer.id === ruler.id) fail('inconsistent-scenario'); return officer;
  });
  unique(officers.map(o => o.id), 'inconsistent-scenario'); officers.sort((a, b) => order(a.id, b.id));
  const relations = relationGraph(r.relations, new Set([ruler.id, ...officers.map(o => o.id)]));
  const rng = object(r.rng, ['kind', 'seed']); if (rng.kind !== 'xorshift32-nonzero-mod35-v1') fail('policy-mismatch');
  return { schemaVersion: 1, profile: PROFILE, date: d, initialDateAlreadySettled: true, advanceLimit, force, city, ruler, officers, relations, rng: { kind: 'xorshift32-nonzero-mod35-v1', seed: uint(rng.seed, 4_294_967_295, 1) }, policies: clone(r.policies as Policies) };
}
function envelope(v: unknown): Envelope {
  const r = object(v, ['id', 'expectedRevision', 'command']);
  const commandId = id(r.id), expectedRevision = uint(r.expectedRevision, MAX_HISTORY);
  if (r.command === null || typeof r.command !== 'object' || Array.isArray(r.command)) fail('invalid-input');
  const kind = (r.command as Record<string, unknown>).type;
  let command: Command;
  if (kind === 'CashReward') {
    const c = object(r.command, ['type', 'targetOfficerIds']); const targets = list(c.targetOfficerIds, 80).map(id);
    if (targets.length === 0) fail('empty-targets'); unique(targets, 'duplicate-target'); targets.sort(order);
    command = { type: 'CashReward', targetOfficerIds: targets };
  } else if (kind === 'AdvancePersonnelTurn') { object(r.command, ['type']); command = { type: 'AdvancePersonnelTurn' }; }
  else fail('unsupported-command');
  return { id: commandId, expectedRevision, command };
}
function initialState(s: Scenario): State {
  const snapshot: Snapshot = { revision: 0, turn: 0, advancedCount: 0, date: clone(s.date), gold: s.city.gold, actionPoints: s.city.actionPoints, officers: s.officers.map(o => ({ id: o.id, trueLoyalty: o.trueLoyalty, lastPraisedTurn: o.praisedThisTurn ? 0 : null })), rng: { state: s.rng.seed, drawCount: 0 } };
  return { tag: TAG, schemaVersion: 1, profile: PROFILE, policies: clone(s.policies), policyDigest: POLICY_DIGEST, genesis: { scenario: clone(s), snapshot: clone(snapshot) }, snapshot, acceptedCommands: [] };
}
/** New nonzero xorshift cycle, not the original game's RNG or global stream. */
function nextBounded(rng: RngState, bound: 3 | 5, label: DrawLabel, targetId: string, draws: Draw[]): number {
  const beforeState = rng.state; let x = beforeState;
  x = (x ^ (x << 13)) >>> 0; x = (x ^ (x >>> 17)) >>> 0; x = (x ^ (x << 5)) >>> 0;
  const value = (x - 1) % bound; rng.state = x; rng.drawCount++;
  draws.push({ drawIndex: rng.drawCount, label, targetId, bound, beforeState, afterState: x, value }); return value;
}
function candidate(s: Scenario, o: Officer, holders: string[]): Candidate {
  const result: Candidate = { policyId: s.policies.selection.id, reason: 'not-candidate', eligible: false, benevolenceHolderIds: [...holders], relationExemption: null, affinity: null, traitBranch: null, syntheticDislikeEax: null };
  if (holders.length > 0) { result.reason = 'benevolence-exempt'; return result; }
  const lord = s.ruler.id, graph = s.relations;
  const pairHas = (rows: Pair[]) => rows.some(p => p.includes(o.id) && p.includes(lord));
  result.relationExemption = graph.likes.some(e => e.from === o.id && e.to === lord) ? 'likes-ruler' : pairHas(graph.spouses) ? 'spouse' : pairHas(graph.swornSiblings) ? 'sworn-sibling' : graph.parentChild.some(e => (e.parent === o.id && e.child === lord) || (e.child === o.id && e.parent === lord)) ? 'parent-child' : null;
  if (result.relationExemption !== null) { result.reason = 'relation-exempt'; return result; }
  const affinity = calculateAffinityDistance({ profile: 'affinity-distance-tutorial-u8-v1', sourceAffinityByte: o.affinityByte, targetAffinityByte: s.ruler.affinityByte });
  if (!affinity.supported) fail('affinity-policy-rejected'); result.affinity = affinity;
  if (affinity.returnedAl > 25) { result.reason = 'affinity-above-25'; result.eligible = true; return result; }
  const matched = o.giriInternal <= 1 && o.ambitionInternal >= 3;
  result.traitBranch = { giriInternal: o.giriInternal, ambitionInternal: o.ambitionInternal, matched };
  if (matched) { result.reason = 'low-giri-high-ambition'; result.eligible = true; return result; }
  result.syntheticDislikeEax = graph.dislikes.some(e => e.from === o.id && e.to === lord) ? 1 : 0;
  if (result.syntheticDislikeEax !== 0) { result.reason = 'dislikes-ruler'; result.eligible = true; }
  return result;
}
function write(before: number, gain: number, loss: number): Write {
  const after = Math.min(255, Math.max(0, before + gain - loss));
  return { trueBefore: before, displayBefore: Math.min(100, before), requestedGain: gain, actualGain: Math.max(0, after - before), requestedLoss: loss, actualLoss: Math.max(0, before - after), trueAfter: after, displayAfter: Math.min(100, after), policyId: POLICIES.writer.id };
}
function officerReceipt(o: OfficerState, qualification: OfficerReceipt['qualification']): OfficerReceipt {
  return { officerId: o.id, qualification, candidate: null, status: 'not-candidate', loyalty: write(o.trueLoyalty, 0, 0), lastPraisedTurnBefore: o.lastPraisedTurn, lastPraisedTurnAfter: o.lastPraisedTurn, controlRoll: null, cashGain: null, naturalLoss: null };
}
function resolve(s: Scenario, before: Snapshot, env: Envelope): { snapshot: Snapshot; receipt: Receipt } {
  const after = clone(before), draws: Draw[] = [], rows: OfficerReceipt[] = []; let goldCost = 0, apCost = 0, quarterEntry = false;
  const sortedTargetIds: string[] = [];
  if (env.command.type === 'CashReward') {
    const targets = env.command.targetOfficerIds.map(targetId => {
      const o = after.officers.find(x => x.id === targetId); if (!o) fail('unknown-officer');
      if (o.lastPraisedTurn === before.turn) fail('already-praised-this-turn');
      if (Math.min(100, o.trueLoyalty) >= 100) fail('display-loyalty-at-cap'); return o;
    });
    goldCost = 100 * targets.length; apCost = 5 * targets.length;
    if (before.gold < goldCost) fail('insufficient-gold'); if (before.actionPoints < apCost) fail('insufficient-ap');
    for (const o of targets) {
      sortedTargetIds.push(o.id); const row = officerReceipt(o, 'cash-eligible');
      const roll = nextBounded(after.rng, 5, 'cash-gain', o.id, draws), gain = 5 + roll;
      row.status = 'cash-rewarded'; row.cashGain = { policyId: s.policies.cashReward.id, roll, minimumGain: 5, gain }; row.loyalty = write(o.trueLoyalty, gain, 0);
      o.trueLoyalty = row.loyalty.trueAfter; o.lastPraisedTurn = after.turn; row.lastPraisedTurnAfter = o.lastPraisedTurn; rows.push(row);
    }
    after.gold -= goldCost; after.actionPoints -= apCost;
  } else {
    if (before.advancedCount >= s.advanceLimit) fail('advance-limit');
    after.date = nextDate(before.date); after.turn++; after.advancedCount++;
    quarterEntry = after.date.day === 1 && [1, 4, 7, 10].includes(after.date.month);
    if (quarterEntry) {
      const holders = [s.ruler, ...s.officers].filter(o => o.skills.includes('benevolent-governance')).map(o => o.id).sort(order);
      for (const o of after.officers) {
        sortedTargetIds.push(o.id); const facts = s.officers.find(x => x.id === o.id)!;
        const row = officerReceipt(o, 'natural-quarter-entry'), selection = candidate(s, facts, holders); row.candidate = selection;
        if (!selection.eligible) row.status = selection.reason === 'not-candidate' ? 'not-candidate' : 'exempt';
        else {
          if (s.force.hasHumanHeartControl) row.controlRoll = nextBounded(after.rng, 3, 'human-heart-control', o.id, draws);
          if (row.controlRoll !== null && row.controlRoll >= 1) row.status = 'human-heart-protected';
          else {
            // Zero and over-display-cap true loyalty still consume the complete selected path.
            const firstRoll = nextBounded(after.rng, 3, 'natural-loss-first', o.id, draws);
            const tokenAddition = s.city.hasTokenPlatform ? 2 : 0, lordBranch = s.ruler.giriInternal === 0 && s.ruler.ambitionInternal === 4;
            const lordAddition = lordBranch ? Math.floor((4 - facts.giriInternal) / 2) : 0;
            const secondRoll = nextBounded(after.rng, 3, lordBranch ? 'natural-loss-second-lord' : 'natural-loss-second-ordinary', o.id, draws);
            const requestedLoss = firstRoll + tokenAddition + lordAddition + secondRoll;
            row.status = 'natural-loss-applied'; row.naturalLoss = { firstRoll, tokenAddition, lordAddition, secondRoll, lordBranch, requestedLoss }; row.loyalty = write(o.trueLoyalty, 0, requestedLoss); o.trueLoyalty = row.loyalty.trueAfter;
          }
        }
        rows.push(row);
      }
    }
  }
  after.revision++;
  const receipt: Receipt = { schemaVersion: 1, profile: PROFILE, commandId: env.id, envelope: clone(env), policies: clone(s.policies), policyDigest: POLICY_DIGEST, sourceBoundary: clone(BOUNDARY), unsupported: [...UNSUPPORTED], revisionBefore: before.revision, revisionAfter: after.revision, turnBefore: before.turn, turnAfter: after.turn, dateBefore: clone(before.date), dateAfter: clone(after.date), quarterEntry, sortedTargetIds, officers: rows, resources: { goldBefore: before.gold, goldCost, goldAfter: after.gold, actionPointsBefore: before.actionPoints, actionPointsCost: apCost, actionPointsAfter: after.actionPoints }, draws, writeSet: { before: clone(before), after: clone(after) } };
  return { snapshot: after, receipt };
}
function append(s: State, command: Envelope): { state: State; receipt: Receipt; duplicate: boolean } {
  const old = s.acceptedCommands.find(entry => entry.envelope.id === command.id);
  if (old) { if (!same(old.envelope, command)) fail('duplicate-command-id-conflict'); return { state: s, receipt: old.receipt, duplicate: true }; }
  if (command.expectedRevision !== s.snapshot.revision) fail('stale-revision');
  if (s.acceptedCommands.length >= MAX_HISTORY) fail('history-limit');
  const next = resolve(s.genesis.scenario, s.snapshot, command);
  return { state: { ...s, snapshot: next.snapshot, acceptedCommands: [...s.acceptedCommands, { envelope: command, receipt: next.receipt }] }, receipt: next.receipt, duplicate: false };
}
function executeDetached(s: State, env: Envelope): Exclude<CommandResult, Failure> {
  const next = append(s, env); const result: Exclude<CommandResult, Failure> = { ok: true, committed: !next.duplicate, duplicate: next.duplicate, state: next.state, receipt: next.receipt };
  // The whole output includes genesis, full policies/history, current receipt and final snapshot.
  budget(result); budgetSave(next.state); return result;
}
function budgetSave(state: State): SaveResult { const result: SaveResult = { ok: true, json: canonical(state) }; budget(result); return result; }
function reconstruct(v: unknown): State {
  const r = object(v, ['tag', 'schemaVersion', 'profile', 'policies', 'policyDigest', 'genesis', 'snapshot', 'acceptedCommands']);
  if (r.tag !== TAG || r.schemaVersion !== 1 || r.profile !== PROFILE) fail('unsupported-profile');
  if (!same(r.policies, POLICIES) || r.policyDigest !== POLICY_DIGEST) fail('policy-mismatch');
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
  if (!same(r.snapshot, s.snapshot)) fail('snapshot-mismatch'); budget(s); return s;
}
/** Supplied initial date is already settled; creation never backfills a quarterly loss. */
export function createPersonnelLoyaltyState(input: unknown): PersonnelLoyaltyStateResultV1 {
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
export function executePersonnelLoyaltyCommand(input: unknown, rawCommand: unknown): PersonnelLoyaltyCommandResultV1 { return freeze(commandResult(input, rawCommand)); }
/** Runs the identical detached calculation and output-budget gate, without reserving the ID. */
export function previewPersonnelLoyaltyCommand(input: unknown, rawCommand: unknown): PersonnelLoyaltyPreviewResultV1 {
  const result = commandResult(input, rawCommand); if (!result.ok) return freeze(result);
  try { const preview: PreviewResult = { ok: true, committed: false, duplicate: result.duplicate, receipt: result.receipt, projectedSnapshot: result.state.snapshot }; budget(preview); return freeze(preview); }
  catch (e) { return freeze(failure(e, result.duplicate ? result.state.snapshot : result.receipt.writeSet.before, result.receipt.commandId)); }
}
export function inspectPersonnelLoyalty(input: unknown): PersonnelLoyaltyInspectionV1 {
  try { const state = reconstruct(detach(input)); const result: Inspection = { ok: true, snapshot: state.snapshot, officers: state.snapshot.officers.map(o => ({ id: o.id, trueLoyalty: o.trueLoyalty, displayedLoyalty: Math.min(100, o.trueLoyalty), praisedThisTurn: o.lastPraisedTurn === state.snapshot.turn, cashEligible: o.trueLoyalty < 100 && o.lastPraisedTurn !== state.snapshot.turn })), sourceBoundary: clone(BOUNDARY), unsupported: [...UNSUPPORTED] }; budget(result); return freeze(result); } catch (e) { return freeze(failure(e)); }
}
export function savePersonnelLoyaltyState(input: unknown): PersonnelLoyaltySaveResultV1 {
  try { const state = reconstruct(detach(input)); budget(state); return freeze(budgetSave(state)); } catch (e) { return freeze(failure(e)); }
}
export function loadPersonnelLoyaltyState(json: unknown): PersonnelLoyaltyStateResultV1 {
  try { const state = reconstruct(parseJson(json)); const result: StateResult = { ok: true, state }; budget(result); return freeze(result); } catch (e) { return freeze(failure(e)); }
}
/** Expected values only assert outcomes. They never supply rolls, gains, eligibility or state. */
export function replayPersonnelLoyaltyCommands(input: unknown): PersonnelLoyaltyReplayResultV1 {
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
    const result: ReplayResult = { ok: true, state, outcomes }; budget(result); return freeze(result);
  } catch (e) { return freeze(failure(e)); }
}
