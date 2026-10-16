/**
 * Independent, provisional technique research. Only this service's resources and
 * reservations change. Timing, completion order and reward allocation are named
 * compatibility policies, not recovered native execution. See the detailed rule page.
 */
import catalogData from '../../../docs/sources/technique-research-lifecycle-catalog.json' with { type: 'json' };

type Frozen<T> = T extends object ? { readonly [K in keyof T]: Frozen<T[K]> } : T;
type Stat = 'leadership' | 'war' | 'intelligence' | 'politics';
type DateV1 = { year: number; month: number; day: 1 | 11 | 21 };
type Policy = { id: string; version: 1; parameters: Record<string, string | number | boolean | number[]> };
type Policies = Record<'participants' | 'eligibility' | 'parallelism' | 'fees' | 'attributes' | 'time' | 'talentOffice' | 'merit' | 'allocation' | 'experience' | 'writer' | 'turn' | 'apRecovery' | 'presentation', Policy>;
type PrimitiveOfficer = { id: string; forceId: string; cityId: string; available: boolean; effectiveAttributes: Record<Stat, number>; skillKeys: 'guidance'[]; xp: Record<Stat, number>; merit: number; actedTurn: number | null };
type Officer = PrimitiveOfficer & { reservationJobId: string | null };
type Scenario = {
  profile: 'standalone-technique-research-pk11-compat-v1'; date: DateV1; turn: number;
  force: { id: string; techniquePoints: number; completedTechniqueIds: number[] };
  corps: { id: string; actionPoints: number };
  city: { id: string; gold: number; talentOffice: 'none' | 'building' | 'complete'; enemyWithinTwoCells: boolean };
  officers: PrimitiveOfficer[]; difficulty: 'beginner' | 'advanced' | 'super'; policies: Policies;
};
type CatalogRow = { id: number; branchId: number; branchKey: string; branchName: string; level: number; name: string; relatedAbility: Stat; techniquePointCost: number; goldCost: number; pkOnly: boolean; prerequisiteId: number | null; timeFamily: 'military-training' | 'invention-defense-fire-domestic'; originalTechniqueRowEvidence: string };
type Catalog = { id: string; version: 1; entries: CatalogRow[] };
type Command = { type: 'StartTechniqueResearch'; cityId: string; techniqueId: number; officerIds: string[] } | { type: 'AdvanceResearchTurn' };
type Envelope = { id: string; expectedRevision: number; command: Command };
type Write = { before: number; requested: number; actualDelta: number; after: number; cap: number; discarded: number; policyId: string };
type Credit = Write & { credited: number };
type Fees = { gold: Write; actionPoints: Write; techniquePoints: Write; guidanceParticipantIds: string[]; discountApplied: boolean };
type Timing = { relatedAbility: Stat; relatedAbilitySum: number; difficulty: Scenario['difficulty']; abilityDependentTimingModeled: false; difficultyDependentTimingModeled: false; timeFamily: CatalogRow['timeFamily']; baseTurns: number; talentOfficeApplied: boolean; talentOfficeReduction: number; durationTurns: number; dueTurn: number; dueDate: DateV1; policyId: string; evidence: 'compatibility-guide-fallback' };
type Reward = { officerId: string; attribute: Stat; xp: Credit; merit: Credit; xpPolicyId: string; meritPolicyId: string; allocationPolicyId: string };
type Completion = { jobId: string; techniqueId: number; turn: number; date: DateV1; unlockedBefore: number[]; unlockedAfter: number[]; rewards: Reward[]; releasedOfficerIds: string[]; actedTurn: number; turnPolicyId: string };
type Snapshot = { turn: number; date: DateV1; city: Scenario['city']; difficulty: Scenario['difficulty']; officers: Officer[]; catalogRow: CatalogRow; policies: Policies };
type Job = { id: string; status: 'active' | 'completed'; techniqueId: number; cityId: string; officerIds: string[]; startTurn: number; durationTurns: number; remainingTurns: number; dueTurn: number; startSnapshot: Snapshot; timing: Timing; fees: Fees; completedTurn: number | null; completion: Completion | null };
type Receipt = { commandId: string; revision: number; turn: number; date: DateV1; kind: 'research-start' | 'turn-boundary'; newJobId: string | null; timing: Timing | null; fees: Fees | null; boundary: { beforeTurn: number; afterTurn: number; beforeDate: DateV1; afterDate: DateV1; jobId: string | null; remainingBefore: number | null; remainingAfter: number | null } | null; completions: Completion[]; apRecovery: Write | null; rngDraws: 0; sideEffectsNotModeled: string[] };
type Applied = { envelope: Envelope; envelopeDigest: string; committedRevision: number; receipt: Receipt };
type State = Omit<Scenario, 'officers'> & { officers: Officer[]; schemaVersion: 1; scope: 'standalone-technique-research-lifecycle'; revision: number; initialScenario: Scenario; catalog: Catalog; catalogDigest: string; policyDigest: string; researchJobs: Job[]; appliedCommands: Applied[] };
type Failure = { ok: false; reason: string };
type Outcome = { ok: true; state: State; receipt: Receipt; duplicate: boolean } | Failure;
type Trace = { tag: 'san11-technique-research-trace-v1'; catalog: Catalog; catalogDigest: string; initialScenario: Scenario; steps: { envelope: Envelope; expected: { ok: true; duplicate: boolean; receipt: Receipt } | Failure | null }[]; expectedFinalDigest: string | null };
export type TechniqueResearchScenarioV1 = Frozen<Scenario>;
export type TechniqueResearchStateV1 = Frozen<State>;
export type TechniqueResearchCommandV1 = Frozen<Command>;
export type TechniqueResearchEnvelopeV1 = Frozen<Envelope>;
export type TechniqueResearchPoliciesV1 = Frozen<Policies>;
export type TechniqueResearchPolicyV1 = Frozen<Policy>;
export type TechniqueResearchCatalogV1 = Frozen<Catalog>;
export type TechniqueResearchJobV1 = Frozen<Job>;
export type TechniqueResearchReceiptV1 = Frozen<Receipt>;
export type TechniqueResearchWriteV1 = Frozen<Write>;
export type TechniqueResearchFailure = Frozen<Failure>;
export type TechniqueResearchResultV1 = Frozen<Outcome>;
export type TechniqueResearchPreviewV1 = Frozen<{ ok: true; receipt: Receipt; duplicate: boolean; baseRevision: number } | Failure>;
export type TechniqueResearchSaveResultV1 = Frozen<{ ok: true; serialized: string } | Failure>;
export type TechniqueResearchTraceV1 = Frozen<Trace>;
export type TechniqueResearchReplayResultV1 = Frozen<{ ok: true; state: State; outcomes: ({ ok: true; duplicate: boolean; receipt: Receipt } | Failure)[] } | { ok: false; reason: string; index: number; state: State | null }>;

const STATS: Stat[] = ['leadership', 'war', 'intelligence', 'politics'];
const MAX_RECORDS = 4096, MAX_VALUE = 1_000_000_000, MAX_JSON_CODE_UNITS = 64 * 1024 * 1024;
const SCENARIO_KEYS = ['profile', 'date', 'turn', 'force', 'corps', 'city', 'officers', 'difficulty', 'policies'];
const NOT_MODELED = ['native-personnel-tasks', 'native-writers', 'native-scheduling', 'ability-difficulty-timing-matrix', 'native-stat-growth', 'map-range-resolution', 'technique-world-effects', 'shared-service-resources'];
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
  participants: [policy('one-to-three-distinct-v1', { minimum: 1, maximum: 3 })],
  eligibility: [policy('supplied-city-force-availability-v1', { enemyRadiusCells: 2, unavailableBlocks: true, actedThisTurnBlocks: true })],
  parallelism: [policy('single-active-force-project-v1', { maximumActive: 1 })],
  fees: [policy('catalog-exact-participating-guidance-v1', { actionPoints: 50, guidanceGoldDivisor: 2, guidanceStacks: false })],
  attributes: [policy('start-effective-attributes-snapshot-v1', { xpChangesEffectiveAbility: false })],
  time: [policy('guide-two-family-fallback-v1', { militaryTrainingTurns: [3, 4, 6, 9], otherTurns: [4, 5, 7, 10], abilityDependent: false, difficultyDependent: false })],
  talentOffice: [policy('complete-local-talent-office-minus2-min1-v1', { reduction: 2, minimum: 1 })],
  merit: [policy('current-wiki-merit-candidate-v1', { byLevel: [500, 1000, 2000, 3000], provisional: true }), policy('early-guide-merit-candidate-v1', { byLevel: [500, 1000, 1500, 2500], provisional: true })],
  allocation: [policy('each-selected-full-reward-v1', { recipients: 'all-selected-in-command-order', provisional: true })],
  experience: [policy('consumed-tp-div100-per-selected-v1', { divisor: 100, provisionalAllocation: true })],
  writer: [policy('exact-debits-saturating-rewards-v1', { rewardCap: MAX_VALUE, goldCap: MAX_VALUE, techniquePointCap: 10000, actionPointCap: 255 })],
  turn: [policy('one-boundary-auto-complete-v1', { boundaries: 1, completion: 'unlock-reward-release', completionActors: 'acted-new-turn', requireRepresentableDueDate: true, reserveCompletionHistoryCapacity: true, provisional: true })],
  apRecovery: [policy('no-ap-recovery-v1', { increment: 0, cap: 255 }), policy('fixed20-cap255-v1', { increment: 20, cap: 255 })],
  presentation: [policy('no-presentation-rng-v1', { rngDraws: 0 })],
};
freeze(REGISTRY);
const CATALOG = freeze(catalogData as Catalog);
export const TECHNIQUE_RESEARCH_CATALOG_V1: TechniqueResearchCatalogV1 = CATALOG;
export const TECHNIQUE_RESEARCH_POLICY_REGISTRY_V1 = REGISTRY as Frozen<typeof REGISTRY>;
export const TECHNIQUE_RESEARCH_DEFAULT_POLICIES_V1: TechniqueResearchPoliciesV1 = freeze(Object.fromEntries(Object.entries(REGISTRY).map(([k, v]) => [k, copy(v[0]!)])) as Policies);
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
  const s = obj(v, SCENARIO_KEYS, 'invalid-state');
  if (s.profile !== 'standalone-technique-research-pk11-compat-v1') fail('unsupported-profile');
  const turn = uint(s.turn), d = obj(s.date, ['year', 'month', 'day'], 'invalid-state');
  uint(d.year, 9999, 1); uint(d.month, 12, 1); if (![1, 11, 21].includes(d.day as number)) fail('invalid-state');
  const force = obj(s.force, ['id', 'techniquePoints', 'completedTechniqueIds'], 'invalid-state'); id(force.id); uint(force.techniquePoints, 10000);
  const complete = arr(force.completedTechniqueIds, 36).map(x => uint(x, 35)); unique(complete, 'duplicate-technique');
  for (const n of complete) { const prerequisite = CATALOG.entries[n]!.prerequisiteId; if (prerequisite !== null && !complete.includes(prerequisite)) fail('missing-initial-prerequisite'); }
  const corps = obj(s.corps, ['id', 'actionPoints'], 'invalid-state'); id(corps.id); uint(corps.actionPoints, 255);
  const city = obj(s.city, ['id', 'gold', 'talentOffice', 'enemyWithinTwoCells'], 'invalid-state'); id(city.id); uint(city.gold, MAX_VALUE); choice(city.talentOffice, ['none', 'building', 'complete']); bool(city.enemyWithinTwoCells);
  const people = arr(s.officers, 256);
  for (const item of people) {
    const o = obj(item, ['id', 'forceId', 'cityId', 'available', 'effectiveAttributes', 'skillKeys', 'xp', 'merit', 'actedTurn'], 'invalid-state');
    id(o.id); id(o.forceId); id(o.cityId); bool(o.available); marker(o.actedTurn, turn); uint(o.merit, MAX_VALUE);
    const attributes = obj(o.effectiveAttributes, STATS, 'invalid-state'), xp = obj(o.xp, STATS, 'invalid-state');
    for (const stat of STATS) { uint(attributes[stat], 255); uint(xp[stat], MAX_VALUE); }
    const skills = arr(o.skillKeys, 1); if (skills.some(k => k !== 'guidance')) fail('unsupported-skill'); unique(skills, 'duplicate-skill');
  }
  unique(people.map(x => (x as PrimitiveOfficer).id), 'duplicate-officer');
  choice(s.difficulty, ['beginner', 'advanced', 'super']); validatePolicies(s.policies);
  const result = copy(s as unknown as Scenario); result.force.completedTechniqueIds.sort((a, b) => a - b); return result;
}
function validateEnvelope(v: unknown): Envelope {
  const e = obj(v, ['id', 'expectedRevision', 'command']); id(e.id); uint(e.expectedRevision);
  if (!e.command || typeof e.command !== 'object' || Array.isArray(e.command)) fail();
  const type = (e.command as Record<string, unknown>).type;
  if (type !== 'StartTechniqueResearch' && type !== 'AdvanceResearchTurn') fail('unsupported-command');
  const c = obj(e.command, type === 'AdvanceResearchTurn' ? ['type'] : ['type', 'cityId', 'techniqueId', 'officerIds']);
  if (type === 'StartTechniqueResearch') {
    id(c.cityId); uint(c.techniqueId, 35);
    if (!Array.isArray(c.officerIds) || c.officerIds.length < 1 || c.officerIds.length > 3) fail('invalid-officer-count');
    c.officerIds.forEach(id); unique(c.officerIds, 'duplicate-officer');
  }
  return e as unknown as Envelope;
}
const trusted = new WeakSet<object>();
function freezeState(state: State): TechniqueResearchStateV1 { const result = freeze(state); trusted.add(result); return result; }
function initialState(s: Scenario): State {
  return { ...copy(s), officers: s.officers.map(o => ({ ...copy(o), reservationJobId: null })), schemaVersion: 1, scope: 'standalone-technique-research-lifecycle', revision: 0,
    initialScenario: copy(s), catalog: copy(CATALOG) as Catalog, catalogDigest: digest(CATALOG), policyDigest: digest(s.policies), researchJobs: [], appliedCommands: [] };
}
function nextDate(d: DateV1): DateV1 {
  if (d.day === 1) return { ...d, day: 11 }; if (d.day === 11) return { ...d, day: 21 };
  if (d.month < 12) return { year: d.year, month: d.month + 1, day: 1 };
  if (d.year === 9999) fail('calendar-overflow'); return { year: d.year + 1, month: 1, day: 1 };
}
function debit(before: number, cost: number, cap: number, policyId: string): Write { return { before, requested: -cost, actualDelta: -cost, after: before - cost, cap, discarded: 0, policyId }; }
function credit(before: number, requested: number, cap: number, policyId: string): Credit { const credited = Math.min(requested, cap - before); return { before, requested, actualDelta: credited, credited, after: before + credited, cap, discarded: requested - credited, policyId }; }
function timing(s: State, row: CatalogRow, people: Officer[]): Timing {
  const params = s.policies.time.parameters, turns = params[row.timeFamily === 'military-training' ? 'militaryTrainingTurns' : 'otherTurns'] as number[];
  const baseTurns = turns[row.level - 1]!, applied = s.city.talentOffice === 'complete';
  const durationTurns = Math.max(s.policies.talentOffice.parameters.minimum as number, baseTurns - (applied ? s.policies.talentOffice.parameters.reduction as number : 0));
  if (!Number.isSafeInteger(s.turn + durationTurns)) fail('turn-overflow');
  let dueDate = copy(s.date); for (let i = 0; i < durationTurns; i++) dueDate = nextDate(dueDate);
  return { relatedAbility: row.relatedAbility, relatedAbilitySum: people.reduce((n, o) => n + o.effectiveAttributes[row.relatedAbility], 0), difficulty: s.difficulty,
    abilityDependentTimingModeled: false, difficultyDependentTimingModeled: false, timeFamily: row.timeFamily, baseTurns, talentOfficeApplied: applied, talentOfficeReduction: baseTurns - durationTurns,
    durationTurns, dueTurn: s.turn + durationTurns, dueDate, policyId: s.policies.time.id, evidence: 'compatibility-guide-fallback' };
}
function fork(s: State): State { return { ...s, date: copy(s.date), force: copy(s.force), corps: copy(s.corps), city: copy(s.city), officers: copy(s.officers), researchJobs: s.researchJobs.map(j => ({ ...j })), appliedCommands: [...s.appliedCommands] }; }
function complete(s: State, job: Job): Completion {
  const people = job.officerIds.map(officerId => { const o = s.officers.find(x => x.id === officerId); if (!o || o.reservationJobId !== job.id) fail('reservation-mismatch'); return o; });
  if (s.force.completedTechniqueIds.includes(job.techniqueId)) fail('completion-already-unlocked');
  const before = [...s.force.completedTechniqueIds], row = job.startSnapshot.catalogRow, p = job.startSnapshot.policies;
  const xpRequest = -job.fees.techniquePoints.actualDelta / (p.experience.parameters.divisor as number), meritRequest = (p.merit.parameters.byLevel as number[])[row.level - 1]!;
  s.force.completedTechniqueIds.push(job.techniqueId); s.force.completedTechniqueIds.sort((a, b) => a - b);
  const rewards = people.map(o => {
    const xp = credit(o.xp[row.relatedAbility], xpRequest, p.writer.parameters.rewardCap as number, p.writer.id), merit = credit(o.merit, meritRequest, p.writer.parameters.rewardCap as number, p.writer.id);
    o.xp[row.relatedAbility] = xp.after; o.merit = merit.after;
    return { officerId: o.id, attribute: row.relatedAbility, xp, merit, xpPolicyId: p.experience.id, meritPolicyId: p.merit.id, allocationPolicyId: p.allocation.id };
  });
  for (const o of people) { o.reservationJobId = null; o.actedTurn = s.turn; }
  const result: Completion = { jobId: job.id, techniqueId: job.techniqueId, turn: s.turn, date: copy(s.date), unlockedBefore: before, unlockedAfter: [...s.force.completedTechniqueIds], rewards, releasedOfficerIds: people.map(o => o.id), actedTurn: s.turn, turnPolicyId: p.turn.id };
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
    const receipt: Receipt = { commandId: e.id, revision: s.revision + 1, turn: s.turn, date: copy(s.date), kind: c.type === 'StartTechniqueResearch' ? 'research-start' : 'turn-boundary', newJobId: null, timing: null, fees: null, boundary: null, completions: [], apRecovery: null, rngDraws: 0, sideEffectsNotModeled: [...NOT_MODELED] };
    if (c.type === 'StartTechniqueResearch') {
      if (c.cityId !== s.city.id) fail('unknown-city');
      const row = s.catalog.entries[c.techniqueId]!;
      if (s.force.completedTechniqueIds.includes(c.techniqueId)) fail('technique-already-completed');
      if (row.prerequisiteId !== null && !s.force.completedTechniqueIds.includes(row.prerequisiteId)) fail('missing-prerequisite');
      if (s.researchJobs.some(j => j.status === 'active')) fail('research-already-active');
      if (s.researchJobs.length >= 36) fail('research-history-full');
      const people = c.officerIds.map(officerId => {
        const o = s.officers.find(x => x.id === officerId); if (!o) fail('unknown-officer');
        if (o.forceId !== s.force.id) fail('officer-wrong-force'); if (o.cityId !== s.city.id) fail('officer-not-present');
        if (!o.available) fail('officer-unavailable'); if (o.reservationJobId !== null) fail('officer-research-reserved'); if (o.actedTurn === s.turn) fail('officer-acted-this-turn'); return o;
      });
      if (s.city.enemyWithinTwoCells) fail('enemy-within-two-cells');
      const guidance = people.filter(o => o.skillKeys.includes('guidance')).map(o => o.id), discount = guidance.length > 0;
      const gold = row.goldCost / (discount ? s.policies.fees.parameters.guidanceGoldDivisor as number : 1), ap = s.policies.fees.parameters.actionPoints as number, tp = row.techniquePointCost;
      const duration = timing(s, row, people);
      if (s.appliedCommands.length + 1 + duration.durationTurns > MAX_RECORDS) fail('completion-history-capacity-unavailable');
      if (s.city.gold < gold) fail('insufficient-gold'); if (s.corps.actionPoints < ap) fail('insufficient-ap'); if (s.force.techniquePoints < tp) fail('insufficient-technique-points');
      const fees: Fees = { gold: debit(s.city.gold, gold, MAX_VALUE, s.policies.writer.id), actionPoints: debit(s.corps.actionPoints, ap, 255, s.policies.writer.id), techniquePoints: debit(s.force.techniquePoints, tp, 10000, s.policies.writer.id), guidanceParticipantIds: guidance, discountApplied: discount };
      const jobId = 'research:' + e.id;
      const job: Job = { id: jobId, status: 'active', techniqueId: row.id, cityId: s.city.id, officerIds: [...c.officerIds], startTurn: s.turn, durationTurns: duration.durationTurns, remainingTurns: duration.durationTurns, dueTurn: duration.dueTurn,
        startSnapshot: { turn: s.turn, date: copy(s.date), city: copy(s.city), difficulty: s.difficulty, officers: copy(people), catalogRow: copy(row), policies: copy(s.policies) }, timing: duration, fees, completedTurn: null, completion: null };
      s.city.gold = fees.gold.after; s.corps.actionPoints = fees.actionPoints.after; s.force.techniquePoints = fees.techniquePoints.after;
      for (const o of people) { o.actedTurn = s.turn; o.reservationJobId = jobId; }
      s.researchJobs.push(job); receipt.newJobId = jobId; receipt.timing = duration; receipt.fees = fees;
    } else {
      if (!Number.isSafeInteger(s.turn + 1)) fail('turn-overflow');
      const date = nextDate(s.date), job = s.researchJobs.find(j => j.status === 'active');
      receipt.boundary = { beforeTurn: s.turn, afterTurn: s.turn + 1, beforeDate: copy(s.date), afterDate: copy(date), jobId: job?.id ?? null, remainingBefore: job?.remainingTurns ?? null, remainingAfter: job ? job.remainingTurns - 1 : null };
      s.turn++; s.date = date; receipt.turn = s.turn; receipt.date = copy(date);
      const recovery = credit(s.corps.actionPoints, s.policies.apRecovery.parameters.increment as number, 255, s.policies.apRecovery.id); s.corps.actionPoints = recovery.after; receipt.apRecovery = recovery;
      if (job) { job.remainingTurns--; if (job.remainingTurns === 0) receipt.completions.push(complete(s, job)); }
    }
    s.revision++; s.appliedCommands.push({ envelope: copy(e), envelopeDigest: digest(e), committedRevision: s.revision, receipt });
    return { ok: true, state: s, receipt, duplicate: false };
  } catch (e) { return error(e); }
}
/** Reconstruct every accepted command from genesis. Derived jobs and receipts are never authority. */
function validateState(value: unknown): State {
  if (value !== null && typeof value === 'object' && trusted.has(value)) return value as State;
  const r = obj(detach(value), [...SCENARIO_KEYS, 'schemaVersion', 'scope', 'revision', 'initialScenario', 'catalog', 'catalogDigest', 'policyDigest', 'researchJobs', 'appliedCommands'], 'invalid-state');
  if (r.schemaVersion !== 1 || r.scope !== 'standalone-technique-research-lifecycle') fail('unsupported-schema');
  if (!same(r.catalog, CATALOG) || r.catalogDigest !== digest(CATALOG)) fail('unsupported-catalog');
  let rebuilt = initialState(validateScenario(r.initialScenario));
  for (const item of arr(r.appliedCommands, MAX_RECORDS)) {
    const a = obj(item, ['envelope', 'envelopeDigest', 'committedRevision', 'receipt'], 'invalid-state'), result = transition(rebuilt, validateEnvelope(a.envelope));
    if (!result.ok || result.duplicate) fail('state-history-mismatch'); rebuilt = result.state;
    if (!same(a, rebuilt.appliedCommands.at(-1))) fail('state-history-mismatch');
  }
  if (!same(r, rebuilt)) fail('state-recomputation-mismatch'); return rebuilt;
}
export function createTechniqueResearchState(input: TechniqueResearchScenarioV1): TechniqueResearchStateV1 | TechniqueResearchFailure {
  try { return freezeState(initialState(validateScenario(detach(input)))); } catch (e) { return freeze(error(e)); }
}
export function previewTechniqueResearchCommand(state: TechniqueResearchStateV1, envelope: TechniqueResearchEnvelopeV1): TechniqueResearchPreviewV1 {
  try { const s = validateState(state), result = transition(s, validateEnvelope(detach(envelope))); if (!result.ok) return freeze(result); return freeze({ ok: true, receipt: result.receipt, duplicate: result.duplicate, baseRevision: s.revision }); } catch (e) { return freeze(error(e)); }
}
export function executeTechniqueResearchCommand(state: TechniqueResearchStateV1, envelope: TechniqueResearchEnvelopeV1): TechniqueResearchResultV1 {
  try { const result = transition(validateState(state), validateEnvelope(detach(envelope))); if (!result.ok) return freeze(result); freezeState(result.state); return freeze(result); } catch (e) { return freeze(error(e)); }
}
export function saveTechniqueResearchState(state: TechniqueResearchStateV1): TechniqueResearchSaveResultV1 {
  try { const serialized = canonical({ tag: 'san11-technique-research-save-v1', state: validateState(state) }); if (serialized.length > MAX_JSON_CODE_UNITS) fail('save-too-large'); return freeze({ ok: true, serialized }); } catch (e) { return freeze(error(e, 'invalid-state')); }
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
/** Recompute saved history from complete genesis data; no derived final answer is trusted. */
export function loadTechniqueResearchState(serialized: string): TechniqueResearchStateV1 | TechniqueResearchFailure {
  try { if (typeof serialized !== 'string') fail('invalid-json'); const record = obj(detach(parseData(serialized)), ['tag', 'state'], 'invalid-save'); if (record.tag !== 'san11-technique-research-save-v1') fail('unsupported-schema'); return freezeState(validateState(record.state)); }
  catch (e) { return freeze(error(e, 'invalid-json')); }
}
/** Compare optional expected outcomes to recomputation; a mismatch retains the preceding state. */
export function replayTechniqueResearch(trace: TechniqueResearchTraceV1): TechniqueResearchReplayResultV1 {
  let state: State | null = null, index = -1;
  try {
    const r = obj(detach(trace), ['tag', 'catalog', 'catalogDigest', 'initialScenario', 'steps', 'expectedFinalDigest'], 'invalid-trace'); if (r.tag !== 'san11-technique-research-trace-v1') fail('unsupported-schema');
    if (!same(r.catalog, CATALOG) || r.catalogDigest !== digest(CATALOG)) fail('unsupported-catalog');
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
