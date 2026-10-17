/** Detached named-office allocation. Native qualification/caller/writer remain unresolved. */
import catalogData from '../../../data/catalogs/named-offices-v1.json' with { type: 'json' };

type Frozen<T> = T extends object ? { readonly [K in keyof T]: Frozen<T[K]> } : T;
type Mode = 'weighted-threshold' | 'role-affinity';
type Kind = 'top-civil' | 'civil' | 'military';
type Incumbents = 'fill-vacancies-v1' | 'rebuild-all-v1';
type Stats = { leadership: number; war: number; intelligence: number; politics: number };
type Officer = { personId: number; role: 'ordinary-officer' | 'ruler'; appointmentStatus: 'ready' | 'unavailable'; merit: number; trueLoyalty: number; selectorStats: Stats };
type Assignment = { officeId: number; personId: number };
type Title = { key: string; name: string; unlockedTier: number; referenceCitiesRequired: number; rulerCommand: number };
type Office = { officeId: number; sourceRowIndex: number; name: string; requiredTier: number; requiredMerit: number; command: number; bonusText: string | null; monthlySalary: number; kind: Kind };
type Catalog = { version: string; source: string; sourceSha256: string; rulerTitles: Title[]; offices: Office[]; unsupportedInternalEntry: 80 };
type Policies = { eligibility: 'detached-ready-merit-title-v1'; scheduler: 'stable-ascending-immediate-removal-v1'; stats: 'fixed-effective-stats-1-to-100-v1'; persistence: 'canonical-recompute-v1' };
type Scenario = { titleKey: string; officers: Officer[]; assignments: Assignment[] };
type State = Scenario & { schemaVersion: 1; profile: 'independent-office-assignment-v1'; scope: 'independent-named-office-assignment'; revision: number; catalogVersion: 'named-offices-v1'; catalogDigest: string; policyIds: Policies };
type Request = { mode: Mode; incumbentPolicy?: Incumbents };
type NormalizedRequest = { mode: Mode; incumbentPolicy: Incumbents };
type SelectorRequest = { officeId: number; mode: Mode; eligibilityPolicyId: Policies['eligibility']; incumbentPolicy: Incumbents; orderedCandidateIds: number[] };
type Rejection = 'not-ordinary-officer' | 'appointment-unavailable' | 'title-locked' | 'insufficient-merit' | 'already-appointed';
type CandidateResult = { personId: number; eligible: boolean; eligibilityRejections: Rejection[]; scoringStatus: 'not-evaluated' | 'rejected' | 'accepted'; scoringReason: 'true-loyalty-below-90' | 'top-civil-threshold' | 'military-threshold' | 'civil-threshold' | 'role-affinity-mismatch' | null; loyaltyBonus: number | null; score: number | null };
type Evidence = { selector: 'reverse-exact-source-listing'; classification: 'reverse-inferred-high'; meritCatalog: 'documented-table-supported-4000-ladder'; qualificationHelperBody: 'open'; eligibilityPolicy: 'provisional-engine-rule'; scheduler: 'provisional-caller-scheduler'; nativeWriter: 'open'; stockOriginalVerified: false };
type Selection = { officeId: number; kind: Kind; mode: Mode; winnerPersonId: number | null; score: number | null; candidateOrder: number[]; candidates: CandidateResult[]; eligibilityPolicyId: Policies['eligibility']; incumbentPolicy: Incumbents; evidence: Evidence };
type Changes = { added: Assignment[]; removed: Assignment[]; retained: Assignment[]; people: { personId: number; beforeOfficeId: number | null; afterOfficeId: number | null }[] };
type Plan = { schemaVersion: 1; profile: State['profile']; baseRevision: number; beforeStateFingerprint: string; catalogVersion: State['catalogVersion']; catalogDigest: string; policyIds: Policies; request: NormalizedRequest; candidateOrder: number[]; excludedIncumbents: number[]; officeOrder: number[]; selections: Selection[]; beforeAssignments: Assignment[]; afterAssignments: Assignment[]; changes: Changes; vacantOfficeIds: number[]; evidence: Evidence; rngDraws: 0 };
type Receipt = { status: 'applied' | 'no-change'; beforeRevision: number; afterRevision: number; planFingerprint: string; beforeStateFingerprint: string; afterStateFingerprint: string; request: NormalizedRequest; changes: Changes; vacantOfficeIds: number[]; selections: Selection[]; policyIds: Policies; evidence: Evidence; rngDraws: 0 };
type Failure = { ok: false; reason: string };
type StateResult = { ok: true; state: State } | Failure;
type ApplyResult = { ok: true; state: State; receipt: Receipt } | Failure;
type ReplayInput = { initialState: State; requests: Request[] };
type Archive = { tag: 'office-assignment-replay-v1'; catalogDigest: string; policyIds: Policies; initialState: State; requests: NormalizedRequest[]; receipts: Receipt[]; finalState: State };
type ReplayResult = { ok: true; state: State; archive: Archive } | { ok: false; reason: string; index: number };
export type OfficeAssignmentModeV1 = Mode;
export type OfficeAssignmentOfficerV1 = Frozen<Officer>;
export type OfficeAssignmentScenarioV1 = Frozen<Scenario>;
export type OfficeAssignmentStateV1 = Frozen<State>;
export type OfficeAssignmentRequestV1 = Frozen<Request>;
export type OfficeCandidateRequestV1 = Frozen<SelectorRequest>;
export type OfficeCandidateSelectionV1 = Frozen<Selection>;
export type OfficeAssignmentPlanV1 = Frozen<Plan>;
export type OfficeAssignmentReceiptV1 = Frozen<Receipt>;
export type OfficeAssignmentCatalogV1 = Frozen<Catalog>;
export type OfficeAssignmentPoliciesV1 = Frozen<Policies>;
export type OfficeAssignmentFailure = Frozen<Failure>;
export type OfficeAssignmentStateResultV1 = Frozen<StateResult>;
export type OfficeAssignmentApplyResultV1 = Frozen<ApplyResult>;
export type OfficeAssignmentReplayInputV1 = Frozen<ReplayInput>;
export type OfficeAssignmentReplayResultV1 = Frozen<ReplayResult>;
export type OfficeAssignmentArchiveV1 = Frozen<Archive>;

const MAX_OFFICERS = 4096, MAX_REQUESTS = 256, MAX_JSON = 64 * 1024 * 1024;
const STATE_KEYS = ['schemaVersion', 'profile', 'scope', 'revision', 'catalogVersion', 'catalogDigest', 'policyIds', 'titleKey', 'officers', 'assignments'];
class Invalid extends Error { readonly reason: string; constructor(reason: string) { super(reason); this.reason = reason; } }
function fail(reason: string): never { throw new Invalid(reason); }
function failure(e: unknown): Failure { return { ok: false, reason: e instanceof Invalid ? e.reason : 'invalid-input' }; }
function freeze<T>(v: T): Frozen<T> { if (v !== null && typeof v === 'object' && !Object.isFrozen(v)) { for (const x of Object.values(v)) freeze(x); Object.freeze(v); } return v as Frozen<T>; }
function clone<T>(v: T): T { return JSON.parse(JSON.stringify(v)) as T; }
function canonical(v: unknown): string { if (v === null || typeof v !== 'object') return JSON.stringify(v); if (Array.isArray(v)) return '[' + v.map(canonical).join(',') + ']'; const r = v as Record<string, unknown>; return '{' + Object.keys(r).sort().map(k => JSON.stringify(k) + ':' + canonical(r[k])).join(',') + '}'; }
function same(a: unknown, b: unknown): boolean { return canonical(a) === canonical(b); }
function bounded<T>(v: T): T { detach(v); if (canonical(v).length > MAX_JSON) fail('output-too-large'); return v; }
const runtime = globalThis as { process?: { getBuiltinModule?: (id: string) => { types: { isProxy(v: unknown): boolean } } } };
const isProxy = typeof runtime.process?.getBuiltinModule === 'function' ? runtime.process.getBuiltinModule('node:util').types.isProxy : (() => false);
/** Copy JSON data without invoking accessors. No undefined, sparse arrays, cycles, or foreign prototypes. */
function detach(v: unknown): unknown {
  let count = 0, size = 0; const active = new Set<object>();
  function visit(x: unknown, depth: number): unknown {
    if (++count > 10_000_000 || depth > 64) fail('input-too-large');
    if (x === null || typeof x === 'boolean') return x;
    if (typeof x === 'string') { size += x.length; if (size > MAX_JSON) fail('input-too-large'); return x; }
    if (typeof x === 'number') { if (!Number.isSafeInteger(x) || Object.is(x, -0)) fail('invalid-number'); return x; }
    if (typeof x !== 'object' || isProxy(x) || active.has(x)) fail('invalid-data');
    const array = Array.isArray(x), proto = Object.getPrototypeOf(x);
    if (proto !== (array ? Array.prototype : Object.prototype) && !(proto === null && !array)) fail('invalid-data');
    const ds = Object.getOwnPropertyDescriptors(x), keys = Reflect.ownKeys(ds);
    if (keys.some(k => typeof k !== 'string' || !Object.hasOwn(ds[k]!, 'value') || (!ds[k]!.enumerable && !(array && k === 'length')))) fail('invalid-data');
    active.add(x);
    try {
      if (array) { const n = ds.length!.value as number; if (n > MAX_OFFICERS || keys.length !== n + 1) fail('invalid-array'); const a: unknown[] = []; for (let i = 0; i < n; i++) { const d = ds[String(i)]; if (!d) fail('invalid-array'); a.push(visit(d.value, depth + 1)); } return a; }
      const r: Record<string, unknown> = {}; for (const k of keys as string[]) Object.defineProperty(r, k, { value: visit(ds[k]!.value, depth + 1), enumerable: true, configurable: true, writable: true }); return r;
    } finally { active.delete(x); }
  }
  return visit(v, 0);
}
function obj(v: unknown, required: readonly string[], optional: readonly string[] = []): Record<string, unknown> { if (v === null || typeof v !== 'object' || Array.isArray(v)) fail('invalid-object'); const r = v as Record<string, unknown>; if (required.some(k => !Object.hasOwn(r, k)) || Object.keys(r).some(k => !required.includes(k) && !optional.includes(k))) fail('invalid-fields'); return r; }
function uint(v: unknown, max = Number.MAX_SAFE_INTEGER, min = 0): number { if (typeof v !== 'number' || !Number.isSafeInteger(v) || Object.is(v, -0) || v < min || v > max) fail('invalid-number'); return v; }
function list(v: unknown, max: number): unknown[] { if (!Array.isArray(v) || v.length > max) fail('invalid-array'); return v; }
function choice<T extends string>(v: unknown, values: readonly T[], reason: string): T { if (!values.includes(v as T)) fail(reason); return v as T; }

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


const CATALOG = catalogData as Catalog;
const POLICIES: Policies = { eligibility: 'detached-ready-merit-title-v1', scheduler: 'stable-ascending-immediate-removal-v1', stats: 'fixed-effective-stats-1-to-100-v1', persistence: 'canonical-recompute-v1' };
const EVIDENCE: Evidence = { selector: 'reverse-exact-source-listing', classification: 'reverse-inferred-high', meritCatalog: 'documented-table-supported-4000-ladder', qualificationHelperBody: 'open', eligibilityPolicy: 'provisional-engine-rule', scheduler: 'provisional-caller-scheduler', nativeWriter: 'open', stockOriginalVerified: false };
export const OFFICE_ASSIGNMENT_CATALOG_V1: OfficeAssignmentCatalogV1 = freeze(CATALOG);
export const OFFICE_ASSIGNMENT_CATALOG_DIGEST_V1 = digest(CATALOG);
export const OFFICE_ASSIGNMENT_POLICIES_V1: OfficeAssignmentPoliciesV1 = freeze(POLICIES);
export const OFFICE_ASSIGNMENT_EVIDENCE_V1 = freeze(EVIDENCE);
function title(key: unknown): Title { const t = CATALOG.rulerTitles.find(x => x.key === key); if (!t) fail('invalid-title-key'); return t; }
function office(id: unknown): Office { if (id === 80) fail('unsupported-internal-entry-80'); if (typeof id !== 'number' || !Number.isInteger(id) || Object.is(id, -0) || id < 0 || id > 79) fail('invalid-office-id'); return CATALOG.offices[id]!; }
function officer(v: unknown): Officer {
  const p = obj(v, ['personId', 'role', 'appointmentStatus', 'merit', 'trueLoyalty', 'selectorStats']);
  const s = obj(p.selectorStats, ['leadership', 'war', 'intelligence', 'politics']);
  return { personId: uint(p.personId), role: choice(p.role, ['ordinary-officer', 'ruler'], 'invalid-role'), appointmentStatus: choice(p.appointmentStatus, ['ready', 'unavailable'], 'invalid-appointment-status'), merit: uint(p.merit, 60000), trueLoyalty: uint(p.trueLoyalty, 255), selectorStats: { leadership: uint(s.leadership, 100, 1), war: uint(s.war, 100, 1), intelligence: uint(s.intelligence, 100, 1), politics: uint(s.politics, 100, 1) } };
}
function scenario(v: unknown): Scenario {
  const r = obj(v, ['titleKey', 'officers', 'assignments']); const t = title(r.titleKey);
  const officers = list(r.officers, MAX_OFFICERS).map(officer), ids = new Set<number>();
  for (const p of officers) { if (ids.has(p.personId)) fail('duplicate-person-id'); ids.add(p.personId); }
  const occupied = new Set<number>(), appointed = new Set<number>();
  const assignments = list(r.assignments, 80).map(a => { const row = obj(a, ['officeId', 'personId']), officeId = office(row.officeId).officeId, personId = uint(row.personId); if (!ids.has(personId)) fail('unknown-assignee'); if (occupied.has(officeId)) fail('duplicate-office-assignment'); if (appointed.has(personId)) fail('duplicate-person-assignment'); if (officers.find(p => p.personId === personId)!.role !== 'ordinary-officer') fail('ruler-cannot-hold-named-office'); occupied.add(officeId); appointed.add(personId); return { officeId, personId }; });
  return { titleKey: t.key, officers, assignments };
}
function state(v: unknown): State {
  const r = obj(v, STATE_KEYS);
  if (r.schemaVersion !== 1 || r.profile !== 'independent-office-assignment-v1' || r.scope !== 'independent-named-office-assignment') fail('unsupported-state-schema');
  if (r.catalogVersion !== 'named-offices-v1' || r.catalogDigest !== OFFICE_ASSIGNMENT_CATALOG_DIGEST_V1) fail('catalog-mismatch');
  if (!same(r.policyIds, POLICIES)) fail('policy-mismatch');
  const s = scenario({ titleKey: r.titleKey, officers: r.officers, assignments: r.assignments });
  if (s.assignments.some((a, i) => i > 0 && s.assignments[i - 1]!.officeId >= a.officeId)) fail('noncanonical-assignment-order');
  return { ...s, schemaVersion: 1, profile: 'independent-office-assignment-v1', scope: 'independent-named-office-assignment', revision: uint(r.revision), catalogVersion: 'named-offices-v1', catalogDigest: OFFICE_ASSIGNMENT_CATALOG_DIGEST_V1, policyIds: clone(POLICIES) };
}
function request(v: unknown): NormalizedRequest { const r = obj(v, ['mode'], ['incumbentPolicy']); return { mode: choice(r.mode, ['weighted-threshold', 'role-affinity'], 'invalid-scoring-mode'), incumbentPolicy: Object.hasOwn(r, 'incumbentPolicy') ? choice(r.incumbentPolicy, ['fill-vacancies-v1', 'rebuild-all-v1'], 'invalid-incumbent-policy') : 'fill-vacancies-v1' }; }
function selectorRequest(v: unknown, s: State): SelectorRequest {
  const r = obj(v, ['officeId', 'mode', 'eligibilityPolicyId', 'incumbentPolicy', 'orderedCandidateIds']);
  if (r.eligibilityPolicyId !== POLICIES.eligibility) fail('invalid-eligibility-policy');
  const officeId = office(r.officeId).officeId, req = request({ mode: r.mode, incumbentPolicy: r.incumbentPolicy });
  const ids = list(r.orderedCandidateIds, MAX_OFFICERS).map(x => uint(x));
  if (new Set(ids).size !== ids.length) fail('duplicate-candidate-id');
  const known = new Set(s.officers.map(p => p.personId)); if (ids.some(id => !known.has(id))) fail('unknown-candidate-id');
  if (req.incumbentPolicy === 'fill-vacancies-v1' && s.assignments.some(a => a.officeId === officeId)) fail('office-not-vacant');
  return { officeId, ...req, eligibilityPolicyId: POLICIES.eligibility, orderedCandidateIds: ids };
}
function select(s: State, r: SelectorRequest): Selection {
  const o = office(r.officeId), t = title(s.titleKey), appointed = new Set(s.assignments.map(a => a.personId)), people = new Map(s.officers.map(p => [p.personId, p]));
  const candidates: CandidateResult[] = []; let winnerPersonId: number | null = null, best: number | null = null;
  for (const personId of r.orderedCandidateIds) {
    const p = people.get(personId)!, rejected: Rejection[] = [];
    if (p.role !== 'ordinary-officer') rejected.push('not-ordinary-officer');
    if (p.appointmentStatus !== 'ready') rejected.push('appointment-unavailable');
    if (o.requiredTier > t.unlockedTier) rejected.push('title-locked');
    if (p.merit < o.requiredMerit) rejected.push('insufficient-merit');
    if (r.incumbentPolicy === 'fill-vacancies-v1' && appointed.has(personId)) rejected.push('already-appointed');
    const row: CandidateResult = { personId, eligible: rejected.length === 0, eligibilityRejections: rejected, scoringStatus: 'not-evaluated', scoringReason: null, loyaltyBonus: null, score: null };
    candidates.push(row); if (!row.eligible) continue;
    row.scoringStatus = 'rejected';
    if (p.trueLoyalty < 90) { row.scoringReason = 'true-loyalty-below-90'; continue; }
    const { leadership: L, war: W, intelligence: I, politics: P } = p.selectorStats, martial = Math.max(L, W), civil = Math.max(I, P);
    if (r.mode === 'weighted-threshold') {
      row.loyaltyBonus = 9 * Math.min(p.trueLoyalty - 90, 10);
      if (o.kind === 'top-civil') { if (L + I < 150) row.scoringReason = 'top-civil-threshold'; else row.score = L + I + row.loyaltyBonus; }
      else if (o.kind === 'military') { if (martial < 60) row.scoringReason = 'military-threshold'; else row.score = L + W + row.loyaltyBonus; }
      else { if (civil < 70) row.scoringReason = 'civil-threshold'; else row.score = civil + row.loyaltyBonus; }
    } else {
      row.loyaltyBonus = 0;
      if (o.kind === 'military' ? martial >= civil : civil > martial) row.score = o.kind === 'military' ? martial : civil;
      else row.scoringReason = 'role-affinity-mismatch';
    }
    if (row.score !== null) { row.scoringStatus = 'accepted'; if (best === null || row.score > best) { best = row.score; winnerPersonId = personId; } }
  }
  return { officeId: o.officeId, kind: o.kind, mode: r.mode, winnerPersonId, score: best, candidateOrder: [...r.orderedCandidateIds], candidates, eligibilityPolicyId: r.eligibilityPolicyId, incumbentPolicy: r.incumbentPolicy, evidence: clone(EVIDENCE) };
}
function changes(before: Assignment[], after: Assignment[]): Changes {
  const equal = (a: Assignment, b: Assignment) => a.officeId === b.officeId && a.personId === b.personId;
  const people = [...new Set([...before, ...after].map(a => a.personId))].sort((a, b) => a - b).map(personId => ({ personId, beforeOfficeId: before.find(a => a.personId === personId)?.officeId ?? null, afterOfficeId: after.find(a => a.personId === personId)?.officeId ?? null })).filter(p => p.beforeOfficeId !== p.afterOfficeId);
  return { added: after.filter(a => !before.some(b => equal(a, b))).map(clone), removed: before.filter(a => !after.some(b => equal(a, b))).map(clone), retained: before.filter(a => after.some(b => equal(a, b))).map(clone), people };
}
function plan(s: State, r: NormalizedRequest): Plan {
  const opened = CATALOG.offices.filter(o => o.requiredTier <= title(s.titleKey).unlockedTier).map(o => o.officeId);
  if (r.incumbentPolicy === 'fill-vacancies-v1' && s.assignments.some(a => !opened.includes(a.officeId))) fail('locked-incumbent-requires-rebuild');
  const before = clone(s.assignments), after = r.incumbentPolicy === 'fill-vacancies-v1' ? clone(before) : [];
  const excludedIncumbents = r.incumbentPolicy === 'fill-vacancies-v1' ? before.map(a => a.personId).sort((a, b) => a - b) : [];
  const candidateOrder = s.officers.map(p => p.personId).filter(id => !excludedIncumbents.includes(id)).sort((a, b) => a - b);
  let pool = [...candidateOrder]; const officeOrder = opened.filter(id => !after.some(a => a.officeId === id)), selections: Selection[] = [];
  for (const officeId of officeOrder) {
    const result = select(s, { officeId, mode: r.mode, eligibilityPolicyId: POLICIES.eligibility, incumbentPolicy: r.incumbentPolicy, orderedCandidateIds: pool }); selections.push(result);
    if (result.winnerPersonId !== null) { after.push({ officeId, personId: result.winnerPersonId }); pool = pool.filter(id => id !== result.winnerPersonId); }
  }
  after.sort((a, b) => a.officeId - b.officeId);
  return { schemaVersion: 1, profile: s.profile, baseRevision: s.revision, beforeStateFingerprint: digest(s), catalogVersion: s.catalogVersion, catalogDigest: s.catalogDigest, policyIds: clone(POLICIES), request: clone(r), candidateOrder, excludedIncumbents, officeOrder, selections, beforeAssignments: before, afterAssignments: after, changes: changes(before, after), vacantOfficeIds: opened.filter(id => !after.some(a => a.officeId === id)), evidence: clone(EVIDENCE), rngDraws: 0 };
}
function commit(s: State, p: Plan): { state: State; receipt: Receipt } {
  const changed = p.changes.added.length > 0 || p.changes.removed.length > 0;
  if (changed && s.revision === Number.MAX_SAFE_INTEGER) fail('revision-overflow');
  const next = clone(s); if (changed) { next.assignments = clone(p.afterAssignments); next.revision++; }
  return { state: next, receipt: { status: changed ? 'applied' : 'no-change', beforeRevision: s.revision, afterRevision: next.revision, planFingerprint: digest(p), beforeStateFingerprint: digest(s), afterStateFingerprint: digest(next), request: clone(p.request), changes: clone(p.changes), vacantOfficeIds: [...p.vacantOfficeIds], selections: clone(p.selections), policyIds: clone(POLICIES), evidence: clone(EVIDENCE), rngDraws: 0 } };
}

/** The caller supplies an already-owned title and detached officers, never native ownership. */
export function createOfficeAssignmentState(input: unknown): OfficeAssignmentStateResultV1 {
  try { const s = scenario(detach(input)); s.assignments.sort((a, b) => a.officeId - b.officeId); return freeze({ ok: true, state: { ...s, schemaVersion: 1, profile: 'independent-office-assignment-v1', scope: 'independent-named-office-assignment', revision: 0, catalogVersion: 'named-offices-v1', catalogDigest: OFFICE_ASSIGNMENT_CATALOG_DIGEST_V1, policyIds: clone(POLICIES) } }); } catch (e) { return freeze(failure(e)); }
}
/** Preserve explicit caller order, including first-wins ties. This function never sorts candidates. */
export function selectOfficeCandidate(stateInput: unknown, requestInput: unknown): Frozen<{ ok: true; selection: Selection } | Failure> {
  try { const s = state(detach(stateInput)), r = selectorRequest(detach(requestInput), s); return freeze({ ok: true, selection: select(s, r) }); } catch (e) { return freeze(failure(e)); }
}
export function planOfficeAssignments(stateInput: unknown, requestInput: unknown): Frozen<{ ok: true; plan: Plan } | Failure> {
  try { return freeze({ ok: true, plan: bounded(plan(state(detach(stateInput)), request(detach(requestInput)))) }); } catch (e) { return freeze(failure(e)); }
}
/** Recompute every winner, score and delta; never accept supplied afterAssignments as authority. */
export function applyOfficeAssignmentPlan(stateInput: unknown, planInput: unknown): OfficeAssignmentApplyResultV1 {
  try {
    const s = state(detach(stateInput)), supplied = detach(planInput), p = obj(supplied, ['schemaVersion', 'profile', 'baseRevision', 'beforeStateFingerprint', 'catalogVersion', 'catalogDigest', 'policyIds', 'request', 'candidateOrder', 'excludedIncumbents', 'officeOrder', 'selections', 'beforeAssignments', 'afterAssignments', 'changes', 'vacantOfficeIds', 'evidence', 'rngDraws']);
    if (p.baseRevision !== s.revision || p.beforeStateFingerprint !== digest(s)) fail('stale-plan');
    const expected = plan(s, request(p.request)); if (!same(supplied, expected)) fail('plan-mismatch');
    return freeze({ ok: true, ...commit(s, expected) });
  } catch (e) { return freeze(failure(e)); }
}
/** Query the only assignment relation; null is detached unassigned, never internal entry 80. */
export function inspectOfficeAssignment(stateInput: unknown, personIdInput: unknown): Frozen<{ ok: true; personId: number; officeId: number | null; office: Office | null; rulerTitle: Title | null } | Failure> {
  try { const s = state(detach(stateInput)), personId = uint(personIdInput), p = s.officers.find(x => x.personId === personId); if (!p) fail('unknown-person-id'); const id = s.assignments.find(a => a.personId === personId)?.officeId ?? null; return freeze({ ok: true, personId, officeId: id, office: id === null ? null : clone(office(id)), rulerTitle: p.role === 'ruler' ? clone(title(s.titleKey)) : null }); } catch (e) { return freeze(failure(e)); }
}
/** A standalone snapshot is importable state, not an authenticated history claim. */
export function serializeOfficeAssignmentState(stateInput: unknown): Frozen<{ ok: true; serialized: string } | Failure> {
  try { const serialized = canonical({ tag: 'office-assignment-state-v1', state: state(detach(stateInput)) }); if (serialized.length > MAX_JSON) fail('input-too-large'); return freeze({ ok: true, serialized }); } catch (e) { return freeze(failure(e)); }
}
function parse(input: unknown): unknown { if (typeof input !== 'string' || input.length > MAX_JSON) fail('invalid-serialized-input'); return detach(JSON.parse(input)); }
export function deserializeOfficeAssignmentState(serialized: unknown): OfficeAssignmentStateResultV1 {
  try { const r = obj(parse(serialized), ['tag', 'state']); if (r.tag !== 'office-assignment-state-v1') fail('unsupported-save-format'); return freeze({ ok: true, state: state(r.state) }); } catch (e) { return freeze(failure(e)); }
}
function replay(input: unknown): { state: State; archive: Archive } {
  const r = obj(input, ['initialState', 'requests']), initial = state(r.initialState); let current = clone(initial);
  const requests = list(r.requests, MAX_REQUESTS).map(request), receipts: Receipt[] = []; let archiveSize = canonical(initial).length;
  for (let i = 0; i < requests.length; i++) { try { const result = commit(current, plan(current, requests[i]!)); archiveSize += canonical(result.receipt).length; if (archiveSize > MAX_JSON) fail('archive-too-large'); current = result.state; receipts.push(result.receipt); } catch (e) { throw new ReplayInvalid(failure(e).reason, i); } }
  const archive: Archive = { tag: 'office-assignment-replay-v1', catalogDigest: OFFICE_ASSIGNMENT_CATALOG_DIGEST_V1, policyIds: clone(POLICIES), initialState: initial, requests, receipts, finalState: clone(current) };
  return { state: current, archive: bounded(archive) };
}
class ReplayInvalid extends Invalid { readonly index: number; constructor(reason: string, index: number) { super(reason); this.index = index; } }
export function replayOfficeAssignments(input: unknown): OfficeAssignmentReplayResultV1 {
  try { return freeze({ ok: true, ...replay(detach(input)) }); } catch (e) { return freeze({ ...failure(e), index: e instanceof ReplayInvalid ? e.index : -1 }); }
}
/** Save by recomputing requests from the initial state, including every receipt and final state. */
export function saveOfficeAssignmentReplay(input: unknown): Frozen<{ ok: true; serialized: string } | Failure> {
  try { const serialized = canonical(replay(detach(input)).archive); if (serialized.length > MAX_JSON) fail('input-too-large'); return freeze({ ok: true, serialized }); } catch (e) { return freeze(failure(e)); }
}
/** No answer-only restore: re-run selection and commit, then compare the complete saved archive. */
export function loadOfficeAssignmentReplay(serialized: unknown): OfficeAssignmentReplayResultV1 {
  try { const raw = parse(serialized), a = obj(raw, ['tag', 'catalogDigest', 'policyIds', 'initialState', 'requests', 'receipts', 'finalState']); if (a.tag !== 'office-assignment-replay-v1') fail('unsupported-save-format'); if (a.catalogDigest !== OFFICE_ASSIGNMENT_CATALOG_DIGEST_V1 || !same(a.policyIds, POLICIES)) fail('archive-profile-mismatch'); const result = replay({ initialState: a.initialState, requests: a.requests }); if (!same(raw, result.archive)) fail('archive-replay-mismatch'); return freeze({ ok: true, ...result }); } catch (e) { return freeze({ ...failure(e), index: e instanceof ReplayInvalid ? e.index : -1 }); }
}
