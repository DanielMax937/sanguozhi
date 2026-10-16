/** Independent PK guide-profile lifecycle. No native IDs, callbacks, or original-game equivalence. */
import catalogData from '../../../docs/sources/pk-ability-research/catalog.json' with { type: 'json' };
import { qualifyPkStatTraining, completePkStatTraining } from './pk-stat-training.ts';
import type { PkStatTrainingCompletion, PkStatTrainingInput } from './pk-stat-training.ts';

type Frozen<T> = T extends object ? { readonly [K in keyof T]: Frozen<T[K]> } : T;
type Stat = 'leadership' | 'war' | 'intelligence' | 'politics' | 'charisma';
type Aptitude = 'spear' | 'halberd' | 'crossbow' | 'cavalry' | 'siege' | 'navy';
type Grade = 'C' | 'B' | 'A' | 'S';
type Category = 'stat' | 'aptitude' | 'skill';
type DateV1 = { year: number; month: number; day: 1 | 11 | 21 };
type Policy = { id: string; version: 1; parameters: Record<string, string | number | boolean | (number | string)[]> };
type Policies = Record<'catalog' | 'hidden' | 'researchFees' | 'researchActor' | 'researchCapacity' | 'researchClock' | 'cultivationFees' | 'cultivationClock' | 'cultivationCapacity' | 'qualification' | 'uses' | 'stats' | 'aptitude' | 'skill' | 'completion' | 'apRecovery' | 'persistence' | 'presentation', Policy>;
type PrimitiveOfficer = { id: string; forceId: string; baseId: string; available: boolean; actedTurn: number | null; stats: Record<Stat, { talent: number; xp: number }>; aptitudes: Record<Aptitude, Grade>; skillKey: string | null };
type Officer = PrimitiveOfficer & { reservationJobId: string | null };
type Scenario = { profile: 'standalone-pk-ability-guide-compat-v1'; date: DateV1; turn: number; scope: { forceId: string; baseId: string; corpsId: string; baseKind: 'city' | 'gate' | 'port' }; resources: { gold: number; actionPoints: number; techniquePoints: number }; hiddenSelections: { slotId: string; candidateId: string }[]; officers: PrimitiveOfficer[]; policies: Policies };
type Target = { category: 'stat'; attribute: Stat; target: 70 | 80 | 95 } | { category: 'aptitude'; aptitude: Aptitude; target: 'B' | 'A' } | { category: 'skill'; skillKey: string };
type Node = { id: string; name: string; months: number; costGold: number; costAP: number; trainingCategory: Category; useLimit: number; prerequisites: { allOf: string[] }; evidence: string[]; target: Target };
type Catalog = typeof catalogData;
type Command = { type: 'StartAbilityResearch'; baseId: string; nodeId: string } | { type: 'StartOfficerCultivation'; baseId: string; nodeId: string; officerId: string } | { type: 'AdvanceAbilityTurn' };
type Envelope = { id: string; expectedRevision: number; command: Command };
type Write = { before: number; requestedDelta: number; actualDelta: number; after: number; cap: number; discarded: number; policyId: string };
type Fees = { gold: Write; actionPoints: Write; techniquePoints: Write };
type Timing = { durationTurns: number; dueTurn: number; dueDate: DateV1; policyId: string };
type UseCount = { limit: number; spent: number; reserved: number; available: number };
type UseWrite = { nodeId: string; before: UseCount; after: UseCount; policyId: string };
type Effect = { category: 'stat'; attribute: Stat; result: Extract<PkStatTrainingCompletion, { supported: true }> } | { category: 'aptitude'; aptitude: Aptitude; before: Grade; after: 'B' | 'A'; policyId: string } | { category: 'skill'; before: string | null; after: string; policyId: string };
type Qualification = { eligible: true; detail: unknown; anticipatedEffect: Effect } | { eligible: false; reason: string };
type Snapshot = { turn: number; date: DateV1; scope: Scenario['scope']; resources: Scenario['resources']; node: Node; catalogDigest: string; policies: Policies; officer: Officer | null; qualification: unknown; anticipatedEffect: Effect | null };
type Completion = { jobId: string; kind: 'research' | 'cultivation'; nodeId: string; catalogCandidateId: string; category: Category; turn: number; date: DateV1; unlockedBefore: string[] | null; unlockedAfter: string[] | null; officerId: string | null; effect: Effect | null; uses: UseWrite | null; releasedReservation: string | null; actedTurn: number | null; sourceLevel: 'documented-guide'; lifecycleLevel: 'provisional-engine-rule'; policyId: string };
type Job = { id: string; kind: 'research' | 'cultivation'; status: 'active' | 'completed'; nodeId: string; category: Category; officerId: string | null; startTurn: number; startDate: DateV1; durationTurns: number; remainingTurns: number; dueTurn: number; dueDate: DateV1; startSnapshot: Snapshot; fees: Fees; completedTurn: number | null; completion: Completion | null };
type Receipt = { commandId: string; revision: number; turn: number; date: DateV1; kind: 'research-start' | 'cultivation-start' | 'turn-boundary'; newJobId: string | null; timing: Timing | null; fees: Fees | null; uses: UseWrite | null; boundary: { beforeTurn: number; afterTurn: number; beforeDate: DateV1; afterDate: DateV1; progress: { jobId: string; remainingBefore: number; remainingAfter: number }[] } | null; completions: Completion[]; apRecovery: Write | null; rngDraws: 0 };
type Applied = { envelope: Envelope; envelopeDigest: string; committedRevision: number; receipt: Receipt };
type State = Omit<Scenario, 'officers'> & { officers: Officer[]; schemaVersion: 1; service: 'standalone-pk-ability-lifecycle'; revision: number; initialScenario: Scenario; catalog: Catalog; catalogDigest: string; policyDigest: string; completedNodeIds: string[]; usesSpent: Record<string, number>; researchJobs: Job[]; cultivationJobs: Job[]; appliedCommands: Applied[] };
type Failure = { ok: false; reason: string };
type Outcome = { ok: true; state: State; receipt: Receipt; duplicate: boolean } | Failure;
type Observed = { ok: true; duplicate: boolean; receipt: Receipt } | Failure;
type Trace = { tag: 'san11-pk-ability-trace-v1'; catalog: Catalog; catalogDigest: string; initialScenario: Scenario; steps: { envelope: Envelope; expected: Observed | null }[]; expectedFinalState: State | null; expectedFinalDigest: string | null };
export type PkAbilityScenarioV1 = Frozen<Scenario>;
export type PkAbilityStateV1 = Frozen<State>;
export type PkAbilityCommandV1 = Frozen<Command>;
export type PkAbilityEnvelopeV1 = Frozen<Envelope>;
export type PkAbilityPoliciesV1 = Frozen<Policies>;
export type PkAbilityPolicyV1 = Frozen<Policy>;
export type PkAbilityCatalogV1 = Frozen<Catalog>;
export type PkAbilityJobV1 = Frozen<Job>;
export type PkAbilityReceiptV1 = Frozen<Receipt>;
export type PkAbilityEffectV1 = Frozen<Effect>;
export type PkAbilityWriteV1 = Frozen<Write>;
export type PkAbilityFailure = Frozen<Failure>;
export type PkAbilityResultV1 = Frozen<Outcome>;
export type PkAbilityPreviewV1 = Frozen<{ ok: true; receipt: Receipt; duplicate: boolean; baseRevision: number } | Failure>;
export type PkAbilitySaveResultV1 = Frozen<{ ok: true; serialized: string } | Failure>;
export type PkAbilityTraceV1 = Frozen<Trace>;
export type PkAbilityReplayResultV1 = Frozen<{ ok: true; state: State; outcomes: Observed[] } | { ok: false; reason: string; index: number; state: State | null }>;
const STATS: Stat[] = ['leadership', 'war', 'intelligence', 'politics', 'charisma'];
const APTITUDES: Aptitude[] = ['spear', 'halberd', 'crossbow', 'cavalry', 'siege', 'navy'];
const CATEGORIES: Category[] = ['stat', 'aptitude', 'skill'];
const MAX_RECORDS = 4096, MAX_VALUE = 1_000_000_000, MAX_JSON_CODE_UNITS = 64 * 1024 * 1024;
const SCENARIO_KEYS = ['profile', 'date', 'turn', 'scope', 'resources', 'hiddenSelections', 'officers', 'policies'];
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
    if (typeof x === 'string') { size += x.length; if (size > MAX_JSON_CODE_UNITS) fail(); return x; }
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


const policy = (id: string, parameters: Policy['parameters']): Policy => ({ id, version: 1, parameters });
const REGISTRY: Record<keyof Policies, Policy[]> = {
  catalog: [policy('selected-guide-catalog-v1', { catalogId: 'pk-ability-research-guide-v1', canonicalSha256: '8f9480d1a032f94d1b0d934e477fd8c40d08a360f5ac9e7875a3fe6ef5abb0e9', preserveConflicts: 6 })],
  hidden: [policy('explicit-five-fixed-v1', { slots: 10, candidatesPerSlot: 5, selectedSlots: 5, candidatesPerSelectedSlot: 1, rngDraws: 0, mutable: false })],
  researchFees: [policy('guide-300g-20ap-zero-tp-v1', { gold: 300, actionPoints: 20, techniquePoints: 0, debitAt: 'start' })],
  researchActor: [policy('no-officer-assignment-v1', { officerCount: 0, xp: 0, merit: 0 })],
  researchCapacity: [policy('one-active-research-per-scope-v1', { maximum: 1, mayOverlapCultivation: true })],
  researchClock: [policy('guide-months-times-three-boundaries-v1', { boundariesPerMonth: 3, allowedMonths: [3, 4, 5, 6], tickAtStart: false })],
  cultivationFees: [policy('guide20ap-no-other-debit-v1', { gold: 0, actionPoints: 20, techniquePoints: 0, debitAt: 'start', zeroOtherDebitIsProvisional: true })],
  cultivationClock: [policy('fixed-three-boundaries-v1', { durationTurns: 3, tickAtStart: false, provisional: true })],
  cultivationCapacity: [policy('one-active-per-category-distinct-person-v1', { perCategory: 1, total: 3, samePersonAcrossCategories: false, scope: 'whole-independent-force-scope' })],
  qualification: [policy('supplied-same-scope-available-unacted-unreserved-v1', { sameForce: true, sameBase: true, available: true, actedThisTurnBlocks: true, reservedBlocks: true })],
  uses: [policy('reserve-at-start-spend-at-completion-v1', { reserveAt: 'start', spendAt: 'completion', sharedAcrossOfficers: true })],
  stats: [policy('s1-ordinary-no-age-guide-targets-v1', { core: 's1-pk-stat-training-v1', low: 70, medium: 80, high: 95, externalMidJobWrites: false })],
  aptitude: [policy('adjacent-c-to-b-b-to-a-v1', { forB: 'C', forA: 'B', mayTrainS: false, rawNativeEncoding: false })],
  skill: [policy('guide-key-single-skill-replacement-v1', { equalTargetBlocks: true, replacement: true, stacking: false, nativeIdMapping: false })],
  completion: [policy('research-then-stat-aptitude-skill-atomic-v1', { order: ['research', 'stat', 'aptitude', 'skill'], officerActedAt: 'completion-turn', atomic: true })],
  apRecovery: [policy('fixed20-cap255-v1', { increment: 20, cap: 255 }), policy('no-ap-recovery-v1', { increment: 0, cap: 255 })],
  persistence: [policy('strict-reexecute-from-genesis-v1', { maxCommands: MAX_RECORDS, reserveMaximumActiveRemaining: true, compareFullStateAndReceipts: true })],
  presentation: [policy('no-rng-no-native-callback-v1', { rngDraws: 0, callbacks: false })],
};
freeze(REGISTRY);
const CATALOG = freeze(catalogData);
const CATALOG_DIGEST = '8f9480d1a032f94d1b0d934e477fd8c40d08a360f5ac9e7875a3fe6ef5abb0e9';
export const PK_ABILITY_LIFECYCLE_CATALOG_V1: PkAbilityCatalogV1 = CATALOG;
export const PK_ABILITY_LIFECYCLE_CATALOG_DIGEST_V1 = CATALOG_DIGEST;
export const PK_ABILITY_POLICY_REGISTRY_V1 = REGISTRY as Frozen<typeof REGISTRY>;
export const PK_ABILITY_DEFAULT_POLICIES_V1: PkAbilityPoliciesV1 = freeze(Object.fromEntries(Object.entries(REGISTRY).map(([k, v]) => [k, copy(v[0]!)])) as Policies);
const BASE_TARGETS: Record<string, Target> = {
  "aptitude.spear.a": {
    "category": "aptitude",
    "aptitude": "spear",
    "target": "A"
  },
  "aptitude.crossbow.a": {
    "category": "aptitude",
    "aptitude": "crossbow",
    "target": "A"
  },
  "stat.war.medium": {
    "category": "stat",
    "attribute": "war",
    "target": 80
  },
  "aptitude.halberd.a": {
    "category": "aptitude",
    "aptitude": "halberd",
    "target": "A"
  },
  "aptitude.navy.a": {
    "category": "aptitude",
    "aptitude": "navy",
    "target": "A"
  },
  "skill.support": {
    "category": "skill",
    "skillKey": "support"
  },
  "skill.overlord": {
    "category": "skill",
    "skillKey": "overlord"
  },
  "skill.chain-attack": {
    "category": "skill",
    "skillKey": "chain-attack"
  },
  "aptitude.spear.b": {
    "category": "aptitude",
    "aptitude": "spear",
    "target": "B"
  },
  "aptitude.navy.b": {
    "category": "aptitude",
    "aptitude": "navy",
    "target": "B"
  },
  "aptitude.halberd.b": {
    "category": "aptitude",
    "aptitude": "halberd",
    "target": "B"
  },
  "skill.diamond": {
    "category": "skill",
    "skillKey": "diamond"
  },
  "stat.leadership.medium": {
    "category": "stat",
    "attribute": "leadership",
    "target": 80
  },
  "stat.leadership.high": {
    "category": "stat",
    "attribute": "leadership",
    "target": 95
  },
  "stat.war.high": {
    "category": "stat",
    "attribute": "war",
    "target": 95
  },
  "aptitude.crossbow.b": {
    "category": "aptitude",
    "aptitude": "crossbow",
    "target": "B"
  },
  "stat.war.low": {
    "category": "stat",
    "attribute": "war",
    "target": 70
  },
  "stat.leadership.low": {
    "category": "stat",
    "attribute": "leadership",
    "target": 70
  },
  "skill.indomitable": {
    "category": "skill",
    "skillKey": "indomitable"
  },
  "skill.fame": {
    "category": "skill",
    "skillKey": "fame"
  },
  "skill.capture": {
    "category": "skill",
    "skillKey": "capture"
  },
  "aptitude.cavalry.a": {
    "category": "aptitude",
    "aptitude": "cavalry",
    "target": "A"
  },
  "skill.range": {
    "category": "skill",
    "skillKey": "range"
  },
  "aptitude.cavalry.b": {
    "category": "aptitude",
    "aptitude": "cavalry",
    "target": "B"
  },
  "aptitude.siege.b": {
    "category": "aptitude",
    "aptitude": "siege",
    "target": "B"
  },
  "skill.iron-wall": {
    "category": "skill",
    "skillKey": "iron-wall"
  },
  "skill.efficient-official": {
    "category": "skill",
    "skillKey": "efficient-official"
  },
  "skill.debater": {
    "category": "skill",
    "skillKey": "debater"
  },
  "aptitude.siege.a": {
    "category": "aptitude",
    "aptitude": "siege",
    "target": "A"
  },
  "skill.sweep": {
    "category": "skill",
    "skillKey": "sweep"
  },
  "skill.ambush": {
    "category": "skill",
    "skillKey": "ambush"
  },
  "stat.intelligence.low": {
    "category": "stat",
    "attribute": "intelligence",
    "target": 70
  },
  "stat.politics.low": {
    "category": "stat",
    "attribute": "politics",
    "target": 70
  },
  "skill.fortification": {
    "category": "skill",
    "skillKey": "fortification"
  },
  "skill.breeding": {
    "category": "skill",
    "skillKey": "breeding"
  },
  "stat.politics.high": {
    "category": "stat",
    "attribute": "politics",
    "target": 95
  },
  "stat.intelligence.high": {
    "category": "stat",
    "attribute": "intelligence",
    "target": 95
  },
  "stat.intelligence.medium": {
    "category": "stat",
    "attribute": "intelligence",
    "target": 80
  },
  "stat.charisma.low": {
    "category": "stat",
    "attribute": "charisma",
    "target": 70
  },
  "stat.charisma.high": {
    "category": "stat",
    "attribute": "charisma",
    "target": 95
  },
  "skill.transport": {
    "category": "skill",
    "skillKey": "transport"
  },
  "skill.invention": {
    "category": "skill",
    "skillKey": "invention"
  },
  "skill.deep-plan": {
    "category": "skill",
    "skillKey": "deep-plan"
  },
  "skill.clear-mirror": {
    "category": "skill",
    "skillKey": "clear-mirror"
  },
  "skill.intimidation": {
    "category": "skill",
    "skillKey": "intimidation"
  },
  "stat.charisma.medium": {
    "category": "stat",
    "attribute": "charisma",
    "target": 80
  },
  "stat.politics.medium": {
    "category": "stat",
    "attribute": "politics",
    "target": 80
  },
  "skill.shipbuilding": {
    "category": "skill",
    "skillKey": "shipbuilding"
  }
};
freeze(BASE_TARGETS);
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
  if (digest(CATALOG) !== CATALOG_DIGEST) fail('unsupported-catalog');
  const s = obj(v, SCENARIO_KEYS, 'invalid-state');
  if (s.profile !== 'standalone-pk-ability-guide-compat-v1') fail('unsupported-profile');
  const turn = uint(s.turn), d = obj(s.date, ['year', 'month', 'day'], 'invalid-state');
  uint(d.year, 9999, 1); uint(d.month, 12, 1); if (![1, 11, 21].includes(d.day as number)) fail('invalid-state');
  const scope = obj(s.scope, ['forceId', 'baseId', 'corpsId', 'baseKind'], 'invalid-state');
  id(scope.forceId); id(scope.baseId); id(scope.corpsId); choice(scope.baseKind, ['city', 'gate', 'port']);
  const resources = obj(s.resources, ['gold', 'actionPoints', 'techniquePoints'], 'invalid-state');
  uint(resources.gold, MAX_VALUE); uint(resources.actionPoints, 255); uint(resources.techniquePoints, 10000);
  const selections = arr(s.hiddenSelections, 5); if (selections.length !== 5) fail('invalid-hidden-selection-count');
  for (const item of selections) {
    const selection = obj(item, ['slotId', 'candidateId'], 'invalid-hidden-selection'); id(selection.slotId); id(selection.candidateId);
    const slot = CATALOG.hiddenSlots.find(x => x.id === selection.slotId);
    if (!slot || !slot.alternatives.some(x => x.id === selection.candidateId)) fail('invalid-hidden-selection');
  }
  unique(selections.map(x => (x as Scenario['hiddenSelections'][number]).slotId), 'duplicate-hidden-slot');
  unique(selections.map(x => (x as Scenario['hiddenSelections'][number]).candidateId), 'duplicate-hidden-candidate');
  const people = arr(s.officers, 256);
  for (const item of people) {
    const o = obj(item, ['id', 'forceId', 'baseId', 'available', 'actedTurn', 'stats', 'aptitudes', 'skillKey'], 'invalid-state');
    id(o.id); id(o.forceId); id(o.baseId); bool(o.available); marker(o.actedTurn, turn);
    if (o.skillKey !== null) id(o.skillKey);
    const stats = obj(o.stats, STATS, 'invalid-state'), aptitudes = obj(o.aptitudes, APTITUDES, 'invalid-state');
    for (const stat of STATS) { const n = obj(stats[stat], ['talent', 'xp'], 'invalid-state'); uint(n.talent, 100); uint(n.xp, 3000); }
    for (const aptitude of APTITUDES) choice(aptitudes[aptitude], ['C', 'B', 'A', 'S']);
  }
  unique(people.map(x => (x as PrimitiveOfficer).id), 'duplicate-officer'); validatePolicies(s.policies);
  const result = copy(s as unknown as Scenario); result.hiddenSelections.sort((a, b) => a.slotId < b.slotId ? -1 : a.slotId > b.slotId ? 1 : 0); return result;
}
function nodes(s: Pick<Scenario, 'hiddenSelections'>): Node[] {
  const base: Node[] = CATALOG.baseNodes.map(n => ({ id: n.id, name: n.name, months: n.months, costGold: n.costGold, costAP: n.costAP, trainingCategory: n.trainingCategory as Category, useLimit: n.useLimit, prerequisites: { allOf: [...n.prerequisites.allOf] }, evidence: [...n.evidence], target: copy(BASE_TARGETS[n.id]!) }));
  const hidden: Node[] = s.hiddenSelections.map(selection => {
    const n = CATALOG.hiddenSlots.find(x => x.id === selection.slotId)!.alternatives.find(x => x.id === selection.candidateId)!;
    return { id: n.id, name: n.name, months: n.months, costGold: n.costGold, costAP: n.costAP, trainingCategory: 'skill', useLimit: n.useLimit, prerequisites: { allOf: [...n.prerequisites.allOf] }, evidence: [...n.evidence], target: { category: 'skill', skillKey: n.skillKey } };
  });
  return [...base, ...hidden].sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
}
function validateEnvelope(v: unknown): Envelope {
  const e = obj(v, ['id', 'expectedRevision', 'command']); id(e.id); uint(e.expectedRevision);
  if (!e.command || typeof e.command !== 'object' || Array.isArray(e.command)) fail();
  const type = (e.command as Record<string, unknown>).type;
  if (type !== 'StartAbilityResearch' && type !== 'StartOfficerCultivation' && type !== 'AdvanceAbilityTurn') fail('unsupported-command');
  const c = obj(e.command, type === 'AdvanceAbilityTurn' ? ['type'] : type === 'StartAbilityResearch' ? ['type', 'baseId', 'nodeId'] : ['type', 'baseId', 'nodeId', 'officerId']);
  if (type !== 'AdvanceAbilityTurn') { id(c.baseId); id(c.nodeId); }
  if (type === 'StartOfficerCultivation') id(c.officerId);
  return e as unknown as Envelope;
}
const trusted = new WeakSet<object>();
function freezeState(state: State): PkAbilityStateV1 { const result = freeze(state); trusted.add(result); return result; }
function initialState(s: Scenario): State {
  return { ...copy(s), officers: s.officers.map(o => ({ ...copy(o), reservationJobId: null })), schemaVersion: 1, service: 'standalone-pk-ability-lifecycle', revision: 0,
    initialScenario: copy(s), catalog: copy(CATALOG) as Catalog, catalogDigest: CATALOG_DIGEST, policyDigest: digest(s.policies), completedNodeIds: [],
    usesSpent: Object.fromEntries(nodes(s).map(n => [n.id, 0])), researchJobs: [], cultivationJobs: [], appliedCommands: [] };
}
function nextDate(d: DateV1): DateV1 {
  if (d.day === 1) return { ...d, day: 11 }; if (d.day === 11) return { ...d, day: 21 };
  if (d.month < 12) return { year: d.year, month: d.month + 1, day: 1 };
  if (d.year === 9999) fail('calendar-overflow'); return { year: d.year + 1, month: 1, day: 1 };
}
function activeJobs(s: State): Job[] {
  return [...s.researchJobs.filter(j => j.status === 'active'), ...CATEGORIES.flatMap(category => s.cultivationJobs.filter(j => j.status === 'active' && j.category === category))];
}
function timing(s: State, durationTurns: number, policyId: string): Timing {
  if (!Number.isSafeInteger(s.turn + durationTurns)) fail('turn-overflow');
  let dueDate = copy(s.date); for (let i = 0; i < durationTurns; i++) dueDate = nextDate(dueDate);
  // Every Start, including a short cultivation, must preserve the longest existing job's tail.
  const maximumRemaining = Math.max(durationTurns, ...activeJobs(s).map(j => j.remainingTurns));
  if (s.appliedCommands.length + 1 + maximumRemaining > MAX_RECORDS) fail('completion-history-capacity-unavailable');
  if (!Number.isSafeInteger(s.revision + 1 + maximumRemaining)) fail('revision-overflow');
  return { durationTurns, dueTurn: s.turn + durationTurns, dueDate, policyId };
}
function debit(before: number, cost: number, cap: number, policyId: string): Write { return { before, requestedDelta: -cost || 0, actualDelta: -cost || 0, after: before - cost, cap, discarded: 0, policyId }; }
function credit(before: number, requested: number, cap: number, policyId: string): Write { const actualDelta = Math.min(requested, cap - before); return { before, requestedDelta: requested, actualDelta, after: before + actualDelta, cap, discarded: requested - actualDelta, policyId }; }
function fees(s: State, p: Policy): Fees {
  const gold = p.parameters.gold as number, actionPoints = p.parameters.actionPoints as number, techniquePoints = p.parameters.techniquePoints as number;
  if (s.resources.gold < gold) fail('insufficient-gold'); if (s.resources.actionPoints < actionPoints) fail('insufficient-ap'); if (s.resources.techniquePoints < techniquePoints) fail('insufficient-technique-points');
  return { gold: debit(s.resources.gold, gold, MAX_VALUE, p.id), actionPoints: debit(s.resources.actionPoints, actionPoints, 255, p.id), techniquePoints: debit(s.resources.techniquePoints, techniquePoints, 10000, p.id) };
}
function applyFees(s: State, f: Fees): void { s.resources.gold = f.gold.after; s.resources.actionPoints = f.actionPoints.after; s.resources.techniquePoints = f.techniquePoints.after; }
function useCount(s: State, n: Node): UseCount {
  const spent = s.usesSpent[n.id]!, reserved = s.cultivationJobs.filter(j => j.nodeId === n.id && j.status === 'active').length;
  const available = n.useLimit - spent - reserved; if (!Number.isSafeInteger(spent) || spent < 0 || available < 0) fail('use-account-mismatch');
  return { limit: n.useLimit, spent, reserved, available };
}
function statInput(o: Officer, target: Extract<Target, { category: 'stat' }>): PkStatTrainingInput {
  return { profile: 's1-pk-stat-training-v1', attribute: target.attribute, xp: o.stats[target.attribute].xp, target: target.target, growth: { kind: 'ordinary-no-age', talent: o.stats[target.attribute].talent } };
}
function effect(o: Officer, target: Target, policies: Policies): Effect {
  if (target.category === 'stat') {
    const result = completePkStatTraining(statInput(o, target)); if (!result.supported) fail(result.reason);
    if (result.growthAfter === null || result.actualGrowth === null) fail('unsupported-growth-domain');
    return { category: 'stat', attribute: target.attribute, result };
  }
  if (target.category === 'aptitude') return { category: 'aptitude', aptitude: target.aptitude, before: o.aptitudes[target.aptitude], after: target.target, policyId: policies.aptitude.id };
  return { category: 'skill', before: o.skillKey, after: target.skillKey, policyId: policies.skill.id };
}
function qualification(o: Officer, target: Target, policies: Policies): Qualification {
  if (target.category === 'stat') {
    const detail = qualifyPkStatTraining(statInput(o, target));
    if (!detail.supported || !detail.eligible) return { eligible: false, reason: detail.reason };
    return { eligible: true, detail, anticipatedEffect: effect(o, target, policies) };
  }
  if (target.category === 'aptitude') {
    const before = o.aptitudes[target.aptitude], required = target.target === 'B' ? 'C' : 'B';
    if (before !== required) return { eligible: false, reason: 'aptitude-not-adjacent' };
    return { eligible: true, detail: { before, required, target: target.target, policyId: policies.aptitude.id }, anticipatedEffect: effect(o, target, policies) };
  }
  if (o.skillKey === target.skillKey) return { eligible: false, reason: 'skill-already-known' };
  return { eligible: true, detail: { before: o.skillKey, target: target.skillKey, policyId: policies.skill.id }, anticipatedEffect: effect(o, target, policies) };
}
function officerBlock(s: State, o: Officer): string | null {
  if (o.forceId !== s.scope.forceId) return 'officer-wrong-force'; if (o.baseId !== s.scope.baseId) return 'officer-not-present';
  if (!o.available) return 'officer-unavailable'; if (o.actedTurn === s.turn) return 'officer-acted-this-turn'; if (o.reservationJobId !== null) return 'officer-reserved'; return null;
}
function fork(s: State): State {
  return { ...s, date: copy(s.date), resources: copy(s.resources), officers: copy(s.officers), completedNodeIds: [...s.completedNodeIds], usesSpent: { ...s.usesSpent }, researchJobs: s.researchJobs.map(j => ({ ...j })), cultivationJobs: s.cultivationJobs.map(j => ({ ...j })), appliedCommands: [...s.appliedCommands] };
}
function makeJob(s: State, e: Envelope, n: Node, t: Timing, f: Fees, officer: Officer | null, q: Qualification | null): Job {
  const kind = officer ? 'cultivation' : 'research';
  return { id: kind + ':' + e.id, kind, status: 'active', nodeId: n.id, category: n.trainingCategory, officerId: officer?.id ?? null, startTurn: s.turn, startDate: copy(s.date), durationTurns: t.durationTurns, remainingTurns: t.durationTurns, dueTurn: t.dueTurn, dueDate: copy(t.dueDate),
    startSnapshot: { turn: s.turn, date: copy(s.date), scope: copy(s.scope), resources: copy(s.resources), node: copy(n), catalogDigest: s.catalogDigest, policies: copy(s.policies), officer: officer ? copy(officer) : null, qualification: q ? copy(q) : null, anticipatedEffect: q?.eligible ? copy(q.anticipatedEffect) : null }, fees: f, completedTurn: null, completion: null };
}
function complete(s: State, job: Job): Completion {
  if (job.remainingTurns !== 0 || job.dueTurn !== s.turn || !same(job.dueDate, s.date)) fail('completion-time-mismatch');
  const n = nodes(s).find(x => x.id === job.nodeId);
  if (!n || !same(n, job.startSnapshot.node) || !same(s.policies, job.startSnapshot.policies) || job.startSnapshot.catalogDigest !== s.catalogDigest) fail('completion-snapshot-mismatch');
  const result: Completion = { jobId: job.id, kind: job.kind, nodeId: n.id, catalogCandidateId: n.id, category: n.trainingCategory, turn: s.turn, date: copy(s.date), unlockedBefore: null, unlockedAfter: null, officerId: job.officerId, effect: null, uses: null, releasedReservation: null, actedTurn: null, sourceLevel: 'documented-guide', lifecycleLevel: 'provisional-engine-rule', policyId: s.policies.completion.id };
  if (job.kind === 'research') {
    if (s.completedNodeIds.includes(n.id) || n.prerequisites.allOf.some(p => !s.completedNodeIds.includes(p))) fail('completion-unlock-mismatch');
    result.unlockedBefore = [...s.completedNodeIds]; s.completedNodeIds.push(n.id); s.completedNodeIds.sort(); result.unlockedAfter = [...s.completedNodeIds];
  } else {
    const o = s.officers.find(x => x.id === job.officerId), initial = job.startSnapshot.officer;
    if (!o || !initial || o.reservationJobId !== job.id || initial.id !== o.id || !s.completedNodeIds.includes(n.id)) fail('reservation-mismatch');
    if (!same(o.stats, initial.stats) || !same(o.aptitudes, initial.aptitudes) || o.skillKey !== initial.skillKey) fail('reserved-officer-changed');
    // Already-started completion calls the numeric completion kernel, never its start predicate.
    const applied = effect(o, n.target, job.startSnapshot.policies);
    if (!same(applied, job.startSnapshot.anticipatedEffect)) fail('reserved-effect-mismatch');
    const before = useCount(s, n); if (before.reserved !== 1 || before.spent >= before.limit) fail('use-account-mismatch');
    if (applied.category === 'stat') o.stats[applied.attribute].xp = applied.result.xpAfter;
    else if (applied.category === 'aptitude') o.aptitudes[applied.aptitude] = applied.after;
    else o.skillKey = applied.after;
    s.usesSpent[n.id] = before.spent + 1; job.status = 'completed';
    result.effect = applied; result.uses = { nodeId: n.id, before, after: useCount(s, n), policyId: s.policies.uses.id };
    o.reservationJobId = null; o.actedTurn = s.turn; result.releasedReservation = job.id; result.actedTurn = s.turn;
  }
  job.status = 'completed'; job.completedTurn = s.turn; job.completion = result; return result;
}
function transition(before: State, e: Envelope): Outcome {
  try {
    const previous = before.appliedCommands.find(a => a.envelope.id === e.id);
    if (previous) { if (!same(previous.envelope, e)) fail('command-id-conflict'); return { ok: true, state: before, receipt: previous.receipt, duplicate: true }; }
    if (e.expectedRevision !== before.revision) fail('revision-conflict');
    if (before.appliedCommands.length >= MAX_RECORDS) fail('command-history-full');
    if (!Number.isSafeInteger(before.revision + 1)) fail('revision-overflow');
    const s = fork(before), c = e.command;
    const receipt: Receipt = { commandId: e.id, revision: s.revision + 1, turn: s.turn, date: copy(s.date), kind: c.type === 'StartAbilityResearch' ? 'research-start' : c.type === 'StartOfficerCultivation' ? 'cultivation-start' : 'turn-boundary', newJobId: null, timing: null, fees: null, uses: null, boundary: null, completions: [], apRecovery: null, rngDraws: 0 };
    if (c.type !== 'AdvanceAbilityTurn') {
      if (c.baseId !== s.scope.baseId) fail('unknown-base');
      const available = nodes(s), n = available.find(x => x.id === c.nodeId); if (!n) fail('inactive-or-unknown-node');
      let job: Job;
      if (c.type === 'StartAbilityResearch') {
        if (s.completedNodeIds.includes(n.id)) fail('node-already-researched');
        if (s.researchJobs.some(j => j.status === 'active')) fail('research-already-active');
        if (n.prerequisites.allOf.some(p => !s.completedNodeIds.includes(p))) fail('missing-prerequisite');
        if (s.researchJobs.length >= available.length) fail('research-history-full');
        const t = timing(s, n.months * 3, s.policies.researchClock.id), f = fees(s, s.policies.researchFees);
        job = makeJob(s, e, n, t, f, null, null); s.researchJobs.push(job); applyFees(s, f); receipt.timing = t; receipt.fees = f;
      } else {
        if (!s.completedNodeIds.includes(n.id)) fail('node-not-researched');
        if (s.cultivationJobs.some(j => j.status === 'active' && j.category === n.trainingCategory)) fail('cultivation-category-active');
        const o = s.officers.find(x => x.id === c.officerId); if (!o) fail('unknown-officer');
        const blocked = officerBlock(s, o); if (blocked) fail(blocked);
        const usesBefore = useCount(s, n); if (usesBefore.available < 1) fail('node-uses-exhausted');
        const q = qualification(o, n.target, s.policies); if (!q.eligible) fail(q.reason);
        if (s.cultivationJobs.length >= available.reduce((sum, row) => sum + row.useLimit, 0)) fail('cultivation-history-full');
        const t = timing(s, 3, s.policies.cultivationClock.id), f = fees(s, s.policies.cultivationFees);
        job = makeJob(s, e, n, t, f, o, q); s.cultivationJobs.push(job); applyFees(s, f); o.reservationJobId = job.id; o.actedTurn = s.turn;
        receipt.timing = t; receipt.fees = f; receipt.uses = { nodeId: n.id, before: usesBefore, after: useCount(s, n), policyId: s.policies.uses.id };
      }
      receipt.newJobId = job.id;
    } else {
      if (!Number.isSafeInteger(s.turn + 1)) fail('turn-overflow');
      const date = nextDate(s.date), active = activeJobs(s);
      receipt.boundary = { beforeTurn: s.turn, afterTurn: s.turn + 1, beforeDate: copy(s.date), afterDate: copy(date), progress: active.map(j => ({ jobId: j.id, remainingBefore: j.remainingTurns, remainingAfter: j.remainingTurns - 1 })) };
      s.turn++; s.date = date; receipt.turn = s.turn; receipt.date = copy(date);
      receipt.apRecovery = credit(s.resources.actionPoints, s.policies.apRecovery.parameters.increment as number, 255, s.policies.apRecovery.id); s.resources.actionPoints = receipt.apRecovery.after;
      for (const job of active) { job.remainingTurns--; if (job.remainingTurns === 0) receipt.completions.push(complete(s, job)); }
    }
    s.revision++; s.appliedCommands.push({ envelope: copy(e), envelopeDigest: digest(e), committedRevision: s.revision, receipt });
    return { ok: true, state: s, receipt, duplicate: false };
  } catch (e) { return error(e); }
}
/** Rebuild every receipt, snapshot, effect, reservation and policy from complete genesis. */
function validateState(value: unknown): State {
  if (value !== null && typeof value === 'object' && trusted.has(value)) return value as State;
  const r = obj(detach(value), [...SCENARIO_KEYS, 'schemaVersion', 'service', 'revision', 'initialScenario', 'catalog', 'catalogDigest', 'policyDigest', 'completedNodeIds', 'usesSpent', 'researchJobs', 'cultivationJobs', 'appliedCommands'], 'invalid-state');
  if (r.schemaVersion !== 1 || r.service !== 'standalone-pk-ability-lifecycle') fail('unsupported-schema');
  if (!same(r.catalog, CATALOG) || r.catalogDigest !== CATALOG_DIGEST) fail('unsupported-catalog');
  let rebuilt = initialState(validateScenario(r.initialScenario));
  for (const item of arr(r.appliedCommands, MAX_RECORDS)) {
    const a = obj(item, ['envelope', 'envelopeDigest', 'committedRevision', 'receipt'], 'invalid-state');
    const result = transition(rebuilt, validateEnvelope(a.envelope)); if (!result.ok || result.duplicate) fail('state-history-mismatch'); rebuilt = result.state;
    if (!same(a, rebuilt.appliedCommands.at(-1))) fail('state-history-mismatch');
  }
  if (!same(r, rebuilt)) fail('state-recomputation-mismatch'); return rebuilt;
}
export function createPkAbilityLifecycle(input: PkAbilityScenarioV1): PkAbilityStateV1 | PkAbilityFailure {
  try { return freezeState(initialState(validateScenario(detach(input)))); } catch (e) { return freeze(error(e)); }
}
export function previewPkAbilityCommand(state: PkAbilityStateV1, envelope: PkAbilityEnvelopeV1): PkAbilityPreviewV1 {
  try { const s = validateState(state), result = transition(s, validateEnvelope(detach(envelope))); if (!result.ok) return freeze(result); return freeze({ ok: true, receipt: result.receipt, duplicate: result.duplicate, baseRevision: s.revision }); } catch (e) { return freeze(error(e)); }
}
export function executePkAbilityCommand(state: PkAbilityStateV1, envelope: PkAbilityEnvelopeV1): PkAbilityResultV1 {
  try { const result = transition(validateState(state), validateEnvelope(detach(envelope))); if (!result.ok) return freeze(result); freezeState(result.state); return freeze(result); } catch (e) { return freeze(error(e)); }
}
export function savePkAbilityLifecycle(state: PkAbilityStateV1): PkAbilitySaveResultV1 {
  try { const serialized = canonical({ tag: 'san11-pk-ability-save-v1', state: validateState(state) }); if (serialized.length > MAX_JSON_CODE_UNITS) fail('save-too-large'); return freeze({ ok: true, serialized }); } catch (e) { return freeze(error(e, 'invalid-state')); }
}

/** Duplicate JSON keys, including escaped aliases, are rejected rather than silently discarded. */
function parseData(s: string): unknown {
  if (s.length > MAX_JSON_CODE_UNITS) fail('save-too-large'); let i = 0;
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
export function loadPkAbilityLifecycle(serialized: string): PkAbilityStateV1 | PkAbilityFailure {
  try { if (typeof serialized !== 'string') fail('invalid-json'); const r = obj(detach(parseData(serialized)), ['tag', 'state'], 'invalid-save'); if (r.tag !== 'san11-pk-ability-save-v1') fail('unsupported-schema'); return freezeState(validateState(r.state)); }
  catch (e) { return freeze(error(e, 'invalid-json')); }
}
/** Optional expected outcomes/state are comparison-only and never supply transition answers. */
export function replayPkAbilityLifecycle(trace: PkAbilityTraceV1): PkAbilityReplayResultV1 {
  let state: State | null = null, index = -1;
  try {
    const r = obj(detach(trace), ['tag', 'catalog', 'catalogDigest', 'initialScenario', 'steps', 'expectedFinalState', 'expectedFinalDigest'], 'invalid-trace');
    if (r.tag !== 'san11-pk-ability-trace-v1') fail('unsupported-schema');
    if (!same(r.catalog, CATALOG) || r.catalogDigest !== CATALOG_DIGEST) fail('unsupported-catalog');
    const steps = arr(r.steps, MAX_RECORDS); if (r.expectedFinalDigest !== null && (typeof r.expectedFinalDigest !== 'string' || !/^[0-9a-f]{64}$/.test(r.expectedFinalDigest))) fail('invalid-trace');
    state = initialState(validateScenario(r.initialScenario)); const outcomes: Observed[] = [];
    for (index = 0; index < steps.length; index++) {
      const step = obj(steps[index], ['envelope', 'expected'], 'invalid-trace'); let result: Outcome;
      try { result = transition(state, validateEnvelope(step.envelope)); } catch (e) { result = error(e); }
      const observed: Observed = result.ok ? { ok: true, duplicate: result.duplicate, receipt: result.receipt } : result;
      if (step.expected !== null && !same(step.expected, observed)) fail('replay-outcome-mismatch');
      outcomes.push(observed); if (result.ok) state = result.state;
    }
    if (r.expectedFinalState !== null && !same(r.expectedFinalState, state)) fail('replay-final-state-mismatch');
    if (r.expectedFinalDigest !== null && digest(state) !== r.expectedFinalDigest) fail('replay-final-digest-mismatch');
    freezeState(state); return freeze({ ok: true, state, outcomes });
  } catch (e) { if (state) freezeState(state); return freeze({ ok: false, reason: error(e, 'invalid-trace').reason, index, state }); }
}
type Inspection = { ok: true; revision: number; turn: number; date: DateV1; resources: Scenario['resources']; completedNodeIds: string[]; hiddenSelections: Scenario['hiddenSelections']; activeResearch: Job | null; activeCultivation: Record<Category, Job | null>; remainingHistorySlots: number; reservedCompletionBoundaries: number; research: { node: Node; missingPrerequisites: string[]; uses: UseCount; canStart: boolean; reason: string | null; timing: Timing | null }[]; officers: { officer: Officer; commonBlock: string | null; visibleStats: Record<Stat, number>; cultivation: { nodeId: string; category: Category; canStart: boolean; reason: string | null }[] }[] };
export type PkAbilityInspectionV1 = Frozen<Inspection | Failure>;
export function inspectPkAbilityLifecycle(state: PkAbilityStateV1): PkAbilityInspectionV1 {
  try {
    const s = validateState(state), available = nodes(s), activeResearch = s.researchJobs.find(j => j.status === 'active') ?? null;
    const activeCultivation = Object.fromEntries(CATEGORIES.map(c => [c, s.cultivationJobs.find(j => j.status === 'active' && j.category === c) ?? null])) as Record<Category, Job | null>;
    const commonStart = (): string | null => s.appliedCommands.length >= MAX_RECORDS ? 'command-history-full' : !Number.isSafeInteger(s.revision + 1) ? 'revision-overflow' : null;
    const research = available.map(n => {
      const missingPrerequisites = n.prerequisites.allOf.filter(p => !s.completedNodeIds.includes(p)); let reason = commonStart(), t: Timing | null = null;
      if (!reason) reason = s.completedNodeIds.includes(n.id) ? 'node-already-researched' : activeResearch ? 'research-already-active' : missingPrerequisites.length ? 'missing-prerequisite' : null;
      if (!reason) { try { t = timing(s, n.months * 3, s.policies.researchClock.id); fees(s, s.policies.researchFees); } catch (e) { reason = error(e).reason; } }
      return { node: copy(n), missingPrerequisites, uses: useCount(s, n), canStart: reason === null, reason, timing: t };
    });
    const officers = s.officers.map(o => {
      const commonBlock = officerBlock(s, o);
      const cultivation = available.map(n => {
        let reason = commonStart();
        if (!reason) reason = !s.completedNodeIds.includes(n.id) ? 'node-not-researched' : activeCultivation[n.trainingCategory] ? 'cultivation-category-active' : commonBlock;
        if (!reason && useCount(s, n).available < 1) reason = 'node-uses-exhausted';
        if (!reason) { const q = qualification(o, n.target, s.policies); if (!q.eligible) reason = q.reason; }
        if (!reason) { try { timing(s, 3, s.policies.cultivationClock.id); fees(s, s.policies.cultivationFees); } catch (e) { reason = error(e).reason; } }
        return { nodeId: n.id, category: n.trainingCategory, canStart: reason === null, reason };
      });
      return { officer: copy(o), commonBlock, visibleStats: Object.fromEntries(STATS.map(a => [a, Math.max(1, Math.min(100, o.stats[a].talent + Math.floor(o.stats[a].xp / 100)))])) as Record<Stat, number>, cultivation };
    });
    return freeze({ ok: true, revision: s.revision, turn: s.turn, date: copy(s.date), resources: copy(s.resources), completedNodeIds: [...s.completedNodeIds], hiddenSelections: copy(s.hiddenSelections), activeResearch: activeResearch ? copy(activeResearch) : null, activeCultivation: copy(activeCultivation), remainingHistorySlots: MAX_RECORDS - s.appliedCommands.length, reservedCompletionBoundaries: Math.max(0, ...activeJobs(s).map(j => j.remainingTurns)), research, officers });
  } catch (e) { return freeze(error(e)); }
}
