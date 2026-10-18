/** One domestic council episode. Compatibility policy; not a native council reconstruction. */
import policyData from '../../../data/catalogs/single-council-policy-v1.json' with { type: 'json' };
import sourceData from '../../../docs/sources/single-council-lifecycle.json' with { type: 'json' };
import { createCityCommandState, previewCityCommand, executeCityCommand, saveCityCommandState } from './city-command-lifecycle.ts';
import type { CityScenarioV1, CityStateV1, CityCommandEnvelopeV1, CityCommandReceiptV1, CityCommandPreviewV1, CityCommandSaveResultV1 } from './city-command-lifecycle.ts';

type Frozen<T> = T extends object ? { readonly [K in keyof T]: Frozen<T[K]> } : T;
const PROFILE = 'single-council-domestic-v1' as const;
const TAG = 'san11-single-council-state-v1' as const, SAVE_TAG = 'san11-single-council-save-v1' as const;
const MAX_BYTES = 16_777_216, MAX_NODES = 250_000, MAX_DEPTH = 32, MAX_ARRAY = 4096;
const MAX_HISTORY = 256, MAX_WORDS = 4096;
type Policy = typeof policyData;
type Source = typeof sourceData;
type Relation = { officerId: string; role: 'lord' | 'subordinate' };
type Scenario = { schemaVersion: 1; profile: typeof PROFILE; episodeId: string; childScenario: CityScenarioV1; context: { completeCityRoster: true; membershipFrozen: true; cityId: string; forceId: string; corpsId: string; lordOfficerId: string; roster: Relation[] }; initialTechniquePoints: number; seed: number; policy: Policy; sources: Source };
type DomesticCommand = { type: 'Patrol'; cityId: string; officerIds: string[] } | { type: 'Recruit'; cityId: string; officerIds: string[]; facilityId: string } | { type: 'Produce'; cityId: string; officerIds: string[]; facilityId: string; equipmentType: 1 | 2 | 3 | 4 };
type Decision = { kind: 'accept-one'; speechId: string } | { kind: 'accept-subset'; speechIds: string[] } | { kind: 'accept-all' } | { kind: 'reject-all' } | { kind: 'abort' };
type Command = { type: 'OpenCouncil'; participantIds: string[] } | { type: 'DecidePolicy'; decision: Decision } | { type: 'DecideConcrete'; decision: Decision } | { type: 'CompleteCouncil' } | { type: 'AbortCouncil' };
type Envelope = { id: string; expectedRevision: number; command: Command };
type Speech = { id: string; officerId: string; kind: 'new-proposal'; proposalId: string; proposal: 'domestic' | DomesticCommand } | { id: string; officerId: string; kind: 'agree'; proposalId: string; proposerId: string } | { id: string; officerId: string; kind: 'abort'; reason: 'no-legal-speech' };
type Phase = 'unopened' | 'policy' | 'concrete' | 'ready' | 'completed' | 'aborted';
type Snapshot = { revision: number; phase: Phase; participantIds: string[]; policySpeeches: Speech[]; concreteSpeeches: Speech[]; domesticAccepted: boolean; selectedProposalIds: string[]; rng: { word: number; cursor: number }; councilCompletionTechniquePoints: number };
type RawWord = { raw: number; sample: number; limit: number; rejected: boolean };
type Draw = { label: string; bound: number; words: RawWord[]; value: number; cursorBefore: number; cursorAfter: number; seedBefore: number; seedAfter: number; policyId: string };
type CandidateAudit = { officerId: string; candidates: { command: DomesticCommand; preview: CityCommandPreviewV1 }[]; selectedCandidateIndex: number | null; speechId: string };
type Write = { before: number; requested: number; after: number; actualDelta: number; discarded: number; policyId: string };
type ChildExecution = { proposalId: string; envelope: CityCommandEnvelopeV1; receipt: CityCommandReceiptV1; ordinaryProposalTp: 'not-modeled' };
const BOUNDARY = { nativeEquivalent: false, ordinaryProposalTp: 'not-modeled', tpScope: 'council-completion-only', globalForceTechniquePoints: 'not-exported', selectionDoesNotGuaranteeJointLegality: true, original43GroupsReduced: false, original45SnapshotsReduced: false, replayAuthenticatesProvenance: false } as const;
type Receipt = { envelope: Envelope; policyId: string; phaseBefore: Phase; phaseAfter: Phase; revisionBefore: number; revisionAfter: number; snapshotAfter: Snapshot; candidateAudits: CandidateAudit[]; draws: Draw[]; childExecutions: ChildExecution[]; councilOwnFees: { gold: Write; actionPoints: Write }; completionTechniquePoints: Write; sourceBoundary: typeof BOUNDARY };
type State = { tag: typeof TAG; schemaVersion: 1; profile: typeof PROFILE; genesis: Scenario; snapshot: Snapshot; childState: CityStateV1; acceptedCommands: { envelope: Envelope; receipt: Receipt }[]; sourceBoundary: typeof BOUNDARY };
type Failure = { ok: false; committed: false; reason: string; commandId: string | null; proposalId: string | null; childReason: string | null; effects: [] };
type StateResult = { ok: true; state: State } | Failure;
type Result = { ok: true; committed: boolean; duplicate: boolean; state: State; receipt: Receipt } | Failure;
type Preview = { ok: true; committed: false; duplicate: boolean; projectedState: State; receipt: Receipt } | Failure;
type SaveResult = { ok: true; serialized: string } | Failure;
type Expected = { ok: true; duplicate: boolean; receipt: Receipt } | Failure;
type Trace = { tag: 'san11-single-council-trace-v1'; scenario: Scenario; attempts: { envelope: Envelope; expected: Expected | null }[]; expectedFinalState: State | null };
type QueryResult = { ok: true; snapshot: Snapshot; childState: CityStateV1; sourceBoundary: typeof BOUNDARY } | Failure;
type ReplayResult = { ok: true; state: State; outcomes: Expected[] } | { ok: false; reason: string; index: number; state: State | null };
export type SingleCouncilScenarioV1 = Frozen<Scenario>;
export type SingleCouncilStateV1 = Frozen<State>;
export type SingleCouncilEnvelopeV1 = Frozen<Envelope>;
export type SingleCouncilReceiptV1 = Frozen<Receipt>;
export type SingleCouncilSnapshotV1 = Frozen<Snapshot>;
export type SingleCouncilPolicyV1 = Frozen<Policy>;
export type SingleCouncilFailureV1 = Frozen<Failure>;
export type SingleCouncilResultV1 = Frozen<Result>;
export type SingleCouncilPreviewV1 = Frozen<Preview>;
export type SingleCouncilSaveResultV1 = Frozen<SaveResult>;
export type SingleCouncilTraceV1 = Frozen<Trace>;
export type SingleCouncilStateResultV1 = Frozen<StateResult>;
export type SingleCouncilQueryResultV1 = Frozen<QueryResult>;
export type SingleCouncilReplayResultV1 = Frozen<ReplayResult>;

class Invalid extends Error {
  readonly reason: string; readonly proposalId: string | null; readonly childReason: string | null;
  constructor(reason: string, proposalId: string | null = null, childReason: string | null = null) {
    super(reason); this.reason = reason; this.proposalId = proposalId; this.childReason = childReason;
  }
}
function fail(reason: string, proposalId: string | null = null, childReason: string | null = null): never { throw new Invalid(reason, proposalId, childReason); }
function failure(e: unknown, commandId: string | null = null): Failure { return { ok: false, committed: false, reason: e instanceof Invalid ? e.reason : 'invalid-input', commandId, proposalId: e instanceof Invalid ? e.proposalId : null, childReason: e instanceof Invalid ? e.childReason : null, effects: [] }; }
function clone<T>(v: T): T { return JSON.parse(JSON.stringify(v)) as T; }
function freeze<T>(v: T): Frozen<T> { if (v !== null && typeof v === 'object' && !Object.isFrozen(v)) { for (const x of Object.values(v)) freeze(x); Object.freeze(v); } return v as Frozen<T>; }
/** Private detached registry snapshots: later ordinary JSON-module importers cannot mutate them. */
const POLICY: SingleCouncilPolicyV1 = freeze(clone(policyData));
const SOURCES: Frozen<Source> = freeze(clone(sourceData));
function canonical(v: unknown): string { if (v === null || typeof v !== 'object') return JSON.stringify(v); if (Array.isArray(v)) return '[' + v.map(canonical).join(',') + ']'; const r = v as Record<string, unknown>; return '{' + Object.keys(r).sort().map(k => JSON.stringify(k) + ':' + canonical(r[k])).join(',') + '}'; }
function same(a: unknown, b: unknown): boolean { return canonical(a) === canonical(b); }
function utf8Bytes(s: string): number { let n = 0; for (const c of s) { const p = c.codePointAt(0)!; n += p < 128 ? 1 : p < 2048 ? 2 : p < 65536 ? 3 : 4; } return n; }
/** Non-Proxy plain DTO contract in an unpolluted realm. Proxy reflection is outside this contract.
 * Numbers are safe integers throughout; child receipts are retained exactly and replayed. */
function detach(v: unknown): unknown {
  let nodes = 0, bytes = 0; const active = new Set<object>();
  function visit(x: unknown, depth: number): unknown {
    if (++nodes > MAX_NODES || depth > MAX_DEPTH) fail('serialization-budget');
    if (x === null || typeof x === 'boolean') return x;
    if (typeof x === 'number') { if (!Number.isSafeInteger(x) || Object.is(x, -0)) fail('invalid-number'); return x; }
    if (typeof x === 'string') { bytes += utf8Bytes(x); if (bytes > MAX_BYTES) fail('serialization-budget'); return x; }
    if (typeof x !== 'object' || active.has(x)) fail('invalid-data');
    const array = Array.isArray(x), proto = Object.getPrototypeOf(x);
    if (proto !== (array ? Array.prototype : Object.prototype) && !(proto === null && !array)) fail('invalid-prototype');
    const keys = Reflect.ownKeys(x); if (keys.length > (array ? MAX_ARRAY + 1 : 256)) fail('serialization-budget');
    const ds = Object.getOwnPropertyDescriptors(x); Object.setPrototypeOf(ds, null);
    if (keys.some(k => typeof k !== 'string' || !Object.hasOwn(ds[k]!, 'value') || (!ds[k]!.enumerable && !(array && k === 'length')))) fail('invalid-data');
    active.add(x);
    try {
      if (array) { const n = ds.length!.value as number; if (!Number.isSafeInteger(n) || n < 0 || n > MAX_ARRAY || keys.length !== n + 1) fail('invalid-array'); const a: unknown[] = []; for (let i = 0; i < n; i++) { if (!Object.hasOwn(ds, String(i))) fail('invalid-array'); a.push(visit(ds[String(i)]!.value, depth + 1)); } return a; }
      const out: Record<string, unknown> = {}; for (const k of keys as string[]) { bytes += utf8Bytes(k); if (bytes > MAX_BYTES) fail('serialization-budget'); Object.defineProperty(out, k, { value: visit(ds[k]!.value, depth + 1), enumerable: true, writable: true, configurable: true }); } return out;
    } finally { active.delete(x); }
  }
  const out = visit(v, 0); if (utf8Bytes(canonical(out)) > MAX_BYTES) fail('serialization-budget'); return out;
}
function budget(v: unknown): void { detach(v); }
function object(v: unknown, keys: readonly string[]): Record<string, unknown> { if (v === null || typeof v !== 'object' || Array.isArray(v)) fail('invalid-object'); const r = v as Record<string, unknown>; if (keys.some(k => !Object.hasOwn(r, k)) || Object.keys(r).some(k => !keys.includes(k))) fail('invalid-fields'); return r; }
function uint(v: unknown, max = Number.MAX_SAFE_INTEGER, min = 0): number { if (typeof v !== 'number' || !Number.isSafeInteger(v) || Object.is(v, -0) || v < min || v > max) fail('invalid-integer'); return v; }
function id(v: unknown): string { if (typeof v !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9_.:-]{0,63}$/.test(v)) fail('invalid-id'); return v; }
function list(v: unknown, max: number): unknown[] { if (!Array.isArray(v) || v.length > max) fail('invalid-array'); return v; }
function unique<T>(xs: T[]): void { if (new Set(xs).size !== xs.length) fail('duplicate-id'); }
const compare = (a: string, b: string): number => a < b ? -1 : a > b ? 1 : 0;
/** Text boundary rejects duplicate decoded keys, including escaped aliases, before overwrite. */
function parseJson(text: unknown): unknown {
  if (typeof text !== 'string') fail('invalid-json'); if (utf8Bytes(text) > MAX_BYTES) fail('serialization-budget'); let p = 0, nodes = 0;
  const ws = () => { while (p < text.length && /[\x20\t\r\n]/.test(text[p]!)) p++; };
  function str(): string { const start = p++; let escape = false; while (p < text.length) { const c = text[p++]!; if (!escape && c === '"') return JSON.parse(text.slice(start, p)) as string; if (!escape && c === '\\') escape = true; else escape = false; } return fail('invalid-json'); }
  function value(depth: number): unknown {
    if (++nodes > MAX_NODES || depth > MAX_DEPTH) fail('serialization-budget'); ws(); const c = text[p]; if (c === '"') return str();
    if (c === '{') { p++; ws(); const r: Record<string, unknown> = {}, keys = new Set<string>(); if (text[p] === '}') { p++; return r; } while (true) { ws(); if (text[p] !== '"') fail('invalid-json'); const k = str(); if (keys.has(k)) fail('duplicate-json-key'); keys.add(k); if (keys.size > 256) fail('serialization-budget'); ws(); if (text[p++] !== ':') fail('invalid-json'); Object.defineProperty(r, k, { value: value(depth + 1), enumerable: true, writable: true, configurable: true }); ws(); const end = text[p++]; if (end === '}') return r; if (end !== ',') fail('invalid-json'); } }
    if (c === '[') { p++; ws(); const a: unknown[] = []; if (text[p] === ']') { p++; return a; } while (true) { if (a.length >= MAX_ARRAY) fail('serialization-budget'); a.push(value(depth + 1)); ws(); const end = text[p++]; if (end === ']') return a; if (end !== ',') fail('invalid-json'); } }
    for (const [token, result] of [['true', true], ['false', false], ['null', null]] as const) if (text.startsWith(token, p)) { p += token.length; return result; }
    const token = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/.exec(text.slice(p))?.[0]; if (!token) fail('invalid-json'); p += token.length; const n = Number(token); if (!Number.isSafeInteger(n) || Object.is(n, -0)) fail('invalid-number'); return n;
  }
  const result = value(0); ws(); if (p !== text.length) fail('invalid-json'); return detach(result);
}
function scenario(v: unknown): { scenario: Scenario; child: CityStateV1 } {
  const r = object(v, ['schemaVersion', 'profile', 'episodeId', 'childScenario', 'context', 'initialTechniquePoints', 'seed', 'policy', 'sources']);
  if (r.schemaVersion !== 1 || r.profile !== PROFILE) fail('unsupported-profile'); id(r.episodeId); uint(r.initialTechniquePoints, 10000); uint(r.seed, 0xffffffff, 1);
  if (!same(r.policy, POLICY)) fail('unsupported-policy'); if (!same(r.sources, SOURCES)) fail('unsupported-source-binding');
  const child = createCityCommandState(r.childScenario as CityScenarioV1); if ('ok' in child) fail('invalid-child-scenario', null, child.reason);
  const c = object(r.context, ['completeCityRoster', 'membershipFrozen', 'cityId', 'forceId', 'corpsId', 'lordOfficerId', 'roster']);
  if (c.completeCityRoster !== true || c.membershipFrozen !== true) fail('incomplete-context');
  // These are supplied wrapper relations, not invented fields on a child city/corps/officer.
  if (c.cityId !== child.city.id || c.forceId !== child.activeForceId || c.corpsId !== child.corps.id) fail('context-child-mismatch');
  const lord = id(c.lordOfficerId), roster = list(c.roster, 256).map(x => { const q = object(x, ['officerId', 'role']); id(q.officerId); if (q.role !== 'lord' && q.role !== 'subordinate') fail('invalid-role'); return q as unknown as Relation; });
  unique(roster.map(x => x.officerId)); if (roster.length !== child.officers.length || roster.length < 2) fail('incomplete-roster');
  if (roster.filter(x => x.role === 'lord').length !== 1 || !roster.some(x => x.officerId === lord && x.role === 'lord')) fail('lord-role-mismatch');
  for (const o of child.officers) { if (o.forceId !== child.activeForceId || o.cityId !== child.city.id || !roster.some(x => x.officerId === o.id)) fail('roster-child-mismatch'); }
  if (child.facilities.some(f => f.cityId !== child.city.id)) fail('facility-not-in-fixed-city');
  return { scenario: r as unknown as Scenario, child };
}
function decision(v: unknown): Decision {
  if (v === null || typeof v !== 'object' || Array.isArray(v)) fail('invalid-decision'); const kind = (v as Record<string, unknown>).kind;
  if (kind === 'accept-one') { const r = object(v, ['kind', 'speechId']); id(r.speechId); return r as unknown as Decision; }
  if (kind === 'accept-subset') { const r = object(v, ['kind', 'speechIds']), ids = list(r.speechIds, 6).map(id); if (!ids.length) fail('empty-subset'); unique(ids); return r as unknown as Decision; }
  if (kind === 'accept-all' || kind === 'reject-all' || kind === 'abort') return object(v, ['kind']) as unknown as Decision;
  return fail('invalid-decision');
}
function envelope(v: unknown): Envelope {
  const r = object(v, ['id', 'expectedRevision', 'command']); id(r.id); uint(r.expectedRevision);
  if (r.command === null || typeof r.command !== 'object' || Array.isArray(r.command)) fail('invalid-command'); const type = (r.command as Record<string, unknown>).type;
  if (type === 'OpenCouncil') { const c = object(r.command, ['type', 'participantIds']), ids = list(c.participantIds, 6).map(id); if (!ids.length) fail('no-participants'); unique(ids); }
  else if (type === 'DecidePolicy' || type === 'DecideConcrete') decision(object(r.command, ['type', 'decision']).decision);
  else if (type === 'CompleteCouncil' || type === 'AbortCouncil') object(r.command, ['type']);
  else fail('unsupported-command');
  return r as unknown as Envelope;
}
function initial(s: Scenario, child: CityStateV1): State { return { tag: TAG, schemaVersion: 1, profile: PROFILE, genesis: clone(s), snapshot: { revision: 0, phase: 'unopened', participantIds: [], policySpeeches: [], concreteSpeeches: [], domesticAccepted: false, selectedProposalIds: [], rng: { word: s.seed, cursor: 0 }, councilCompletionTechniquePoints: s.initialTechniquePoints }, childState: child, acceptedCommands: [], sourceBoundary: BOUNDARY }; }
function childSave(s: State): CityCommandSaveResultV1 { const result = saveCityCommandState(s.childState); if (!result.ok) fail('child-save-rejected', null, result.reason); budget(result); return result; }
/** Budget the whole retained history, child evidence, raw save, escaped SaveResult and outputs.
 * No command may commit merely because its unescaped state happens to fit. */
function saveRecord(s: State): SaveResult { budget(s); const childEvidence = childSave(s); const record = { tag: SAVE_TAG, state: s, childSave: childEvidence }; budget(record); const result = { ok: true as const, serialized: canonical(record) }; budget(result); return result; }
function fitState(s: State): void {
  saveRecord(s);
  // A later small receipt must not make an older, larger idempotent response unreturnable.
  for (const a of s.acceptedCommands) {
    budget({ ok: true, committed: false, duplicate: true, state: s, receipt: a.receipt });
    budget({ ok: true, committed: false, duplicate: true, projectedState: s, receipt: a.receipt });
  }
}
function draw(s: Snapshot, bound: number, label: string): Draw {
  uint(bound, 1_000_000, 1); const before = clone(s.rng), words: RawWord[] = [], limit = Math.floor(4294967295 / bound) * bound;
  while (true) {
    if (s.rng.cursor >= MAX_WORDS) fail('rng-budget'); let x = s.rng.word;
    x = (x ^ (x << 13)) >>> 0; x = (x ^ (x >>> 17)) >>> 0; x = (x ^ (x << 5)) >>> 0;
    s.rng.word = x; s.rng.cursor++; const sample = x - 1, rejected = sample >= limit; words.push({ raw: x, sample, limit, rejected });
    if (!rejected) return { label, bound, words, value: sample % bound, cursorBefore: before.cursor, cursorAfter: s.rng.cursor, seedBefore: before.word, seedAfter: s.rng.word, policyId: POLICY.rng.id };
  }
}
function candidateOrder(a: DomesticCommand, b: DomesticCommand): number { return compare(a.type, b.type) || compare('facilityId' in a ? a.facilityId : '', 'facilityId' in b ? b.facilityId : '') || (a.type === 'Produce' ? a.equipmentType : 0) - (b.type === 'Produce' ? b.equipmentType : 0); }
function candidates(child: CityStateV1, officerId: string): DomesticCommand[] {
  const base = { cityId: child.city.id, officerIds: [officerId] }, out: DomesticCommand[] = [{ type: 'Patrol', ...base }];
  for (const f of child.facilities) {
    if (f.kind === 'barracks') out.push({ type: 'Recruit', ...base, facilityId: f.id });
    for (const t of [1, 2, 3, 4] as const) if (child.unlockedEquipmentTypes.includes(t) && f.kind === (t === 4 ? 'stable' : 'forge')) out.push({ type: 'Produce', ...base, facilityId: f.id, equipmentType: t });
  }
  return out.sort(candidateOrder);
}
function key(c: DomesticCommand): string { return canonical([c.type, c.cityId, 'facilityId' in c ? c.facilityId : null, c.type === 'Produce' ? c.equipmentType : null]); }
function generate(s: State, audits: CandidateAudit[], draws: Draw[]): void {
  const prior = new Map<string, { proposalId: string; officerId: string }>();
  for (const [i, officerId] of s.snapshot.participantIds.entries()) {
    const speechId = `concrete:${i + 1}`;
    const entries = candidates(s.childState, officerId).map((command, j) => ({ command, preview: previewCityCommand(s.childState, { id: `council:${s.genesis.episodeId}:probe:${i + 1}:${j + 1}`, expectedRevision: s.childState.revision, command }) }));
    const legal = entries.map((entry, index) => ({ entry, index })).filter(x => x.entry.preview.ok);
    if (!legal.length) { s.snapshot.concreteSpeeches.push({ id: speechId, officerId, kind: 'abort', reason: 'no-legal-speech' }); audits.push({ officerId, candidates: entries, selectedCandidateIndex: null, speechId }); continue; }
    const d = draw(s.snapshot, legal.length, `concrete-choice:${i + 1}`); draws.push(d);
    const chosen = legal[d.value]!, command = chosen.entry.command, existing = prior.get(key(command));
    if (existing) s.snapshot.concreteSpeeches.push({ id: speechId, officerId, kind: 'agree', proposalId: existing.proposalId, proposerId: existing.officerId });
    else { const proposalId = `proposal:${i + 1}`; prior.set(key(command), { proposalId, officerId }); s.snapshot.concreteSpeeches.push({ id: speechId, officerId, kind: 'new-proposal', proposalId, proposal: command }); }
    audits.push({ officerId, candidates: entries, selectedCandidateIndex: chosen.index, speechId });
  }
}
function selected(speeches: Speech[], d: Decision): string[] {
  if (d.kind === 'abort' || d.kind === 'reject-all') return [];
  const ids = d.kind === 'accept-all' ? speeches.filter(s => s.kind !== 'abort').map(s => s.id) : d.kind === 'accept-one' ? [d.speechId] : d.speechIds;
  const wanted = new Set<string>();
  for (const sid of ids) { const speech = speeches.find(s => s.id === sid); if (!speech || speech.kind === 'abort') fail('unknown-or-abort-speech'); wanted.add(speech.proposalId); }
  // User selection order never changes execution order. Agree resolves to the first proposer.
  return speeches.filter((s): s is Extract<Speech, { kind: 'new-proposal' }> => s.kind === 'new-proposal' && wanted.has(s.proposalId)).map(s => s.proposalId);
}
function write(before: number, requested: number, cap: number, policyId: string): Write { const after = Math.min(cap, before + requested); return { before, requested, after, actualDelta: after - before, discarded: requested - (after - before), policyId }; }
function attempt(original: State, e: Envelope): Result {
  try {
    const old = original.acceptedCommands.find(a => a.envelope.id === e.id);
    if (old) { if (!same(old.envelope, e)) fail('command-id-conflict'); const result = { ok: true as const, committed: false, duplicate: true, state: original, receipt: old.receipt }; fitState(original); budget(result); return result; }
    if (e.expectedRevision !== original.snapshot.revision) fail('stale-revision');
    if (original.snapshot.phase === 'completed' || original.snapshot.phase === 'aborted') fail('terminal-episode');
    if (original.acceptedCommands.length >= MAX_HISTORY) fail('history-budget');
    const s: State = { ...original, snapshot: clone(original.snapshot), acceptedCommands: [...original.acceptedCommands] };
    const snap = s.snapshot, c = e.command, candidateAudits: CandidateAudit[] = [], draws: Draw[] = [], childExecutions: ChildExecution[] = [];
    let tpRequested = 0;
    if (c.type === 'AbortCouncil') { snap.phase = 'aborted'; snap.selectedProposalIds = []; }
    else if (c.type === 'OpenCouncil') {
      if (snap.phase !== 'unopened') fail('wrong-phase');
      const lord = s.genesis.context.lordOfficerId;
      for (const oid of [lord, ...c.participantIds]) { const o = s.childState.officers.find(p => p.id === oid); if (!o || o.forceId !== s.genesis.context.forceId || o.cityId !== s.genesis.context.cityId || !o.available || o.actedTurn === s.childState.turn || o.reservationJobId !== null) fail('ineligible-participant'); }
      if (c.participantIds.includes(lord) || c.participantIds.some(oid => !s.genesis.context.roster.some(r => r.officerId === oid && r.role === 'subordinate'))) fail('invalid-participant-role');
      snap.participantIds = [...c.participantIds]; snap.phase = 'policy';
      snap.policySpeeches = c.participantIds.map<Speech>((officerId, i) => i === 0 ? { id: `policy:${i + 1}`, officerId, kind: 'new-proposal', proposalId: 'domestic:1', proposal: 'domestic' } : { id: `policy:${i + 1}`, officerId, kind: 'agree', proposalId: 'domestic:1', proposerId: c.participantIds[0]! });
    } else if (c.type === 'DecidePolicy') {
      if (snap.phase !== 'policy') fail('wrong-phase');
      if (c.decision.kind === 'abort') snap.phase = 'aborted';
      else { snap.domesticAccepted = selected(snap.policySpeeches, c.decision).length > 0; if (snap.domesticAccepted) { generate(s, candidateAudits, draws); snap.phase = 'concrete'; } else snap.phase = 'ready'; }
    } else if (c.type === 'DecideConcrete') {
      if (!snap.domesticAccepted || (snap.phase !== 'concrete' && snap.phase !== 'ready')) fail('wrong-phase');
      snap.selectedProposalIds = selected(snap.concreteSpeeches, c.decision); snap.phase = c.decision.kind === 'abort' ? 'aborted' : 'ready';
    } else {
      if (snap.phase !== 'ready') fail('wrong-phase');
      // Every intermediate child lives only in this candidate. Failure returns no candidate state.
      let child = s.childState;
      for (const proposalId of snap.selectedProposalIds) {
        const speech = snap.concreteSpeeches.find(p => p.kind === 'new-proposal' && p.proposalId === proposalId);
        if (!speech || speech.kind !== 'new-proposal' || speech.proposal === 'domestic') fail('invalid-derived-proposal');
        const childEnvelope: CityCommandEnvelopeV1 = { id: `council:${s.genesis.episodeId}:${proposalId}`, expectedRevision: child.revision, command: speech.proposal };
        const result = executeCityCommand(child, childEnvelope); if (!result.ok) fail('child-command-rejected', proposalId, result.reason);
        if (result.duplicate || result.receipt.taskKind !== 'instant' || result.state.turn !== original.childState.turn || result.state.productionJobs.length !== 0) fail('unexpected-child-effect', proposalId);
        child = result.state; childExecutions.push({ proposalId, envelope: childEnvelope, receipt: result.receipt, ordinaryProposalTp: 'not-modeled' });
      }
      s.childState = child; tpRequested = 10; snap.phase = 'completed';
    }
    const tp = write(original.snapshot.councilCompletionTechniquePoints, tpRequested, 10000, POLICY.completion.id); snap.councilCompletionTechniquePoints = tp.after; snap.revision++;
    const receipt: Receipt = { envelope: clone(e), policyId: POLICY.id, phaseBefore: original.snapshot.phase, phaseAfter: snap.phase, revisionBefore: original.snapshot.revision, revisionAfter: snap.revision, snapshotAfter: clone(snap), candidateAudits, draws, childExecutions, councilOwnFees: { gold: write(original.childState.city.gold, 0, 1_000_000_000, 'council-own-no-fee-v1'), actionPoints: write(original.childState.corps.actionPoints, 0, 255, 'council-own-no-fee-v1') }, completionTechniquePoints: tp, sourceBoundary: BOUNDARY };
    s.acceptedCommands.push({ envelope: clone(e), receipt });
    fitState(s); const result = { ok: true as const, committed: true, duplicate: false, state: s, receipt }; budget(result);
    // Also budget preview's actual, differently named response before either API can succeed.
    budget({ ok: true, committed: false, duplicate: false, projectedState: s, receipt });
    return result;
  } catch (error) { return failure(error, e.id); }
}
function rebuild(v: unknown): State {
  const r = object(v, ['tag', 'schemaVersion', 'profile', 'genesis', 'snapshot', 'childState', 'acceptedCommands', 'sourceBoundary']);
  if (r.tag !== TAG || r.schemaVersion !== 1 || r.profile !== PROFILE || !same(r.sourceBoundary, BOUNDARY)) fail('unsupported-state');
  const start = scenario(r.genesis); let s = initial(start.scenario, start.child); fitState(s);
  for (const item of list(r.acceptedCommands, MAX_HISTORY)) { const a = object(item, ['envelope', 'receipt']), e = envelope(a.envelope), result = attempt(s, e); if (!result.ok || result.duplicate || !same(result.receipt, a.receipt)) fail('history-recomputation-mismatch'); s = result.state; }
  if (!same(r, s)) fail('state-recomputation-mismatch'); fitState(s); return s;
}
export const SINGLE_COUNCIL_POLICY_V1: SingleCouncilPolicyV1 = POLICY;
/** A fresh episode always starts from the complete ordinary-city primitive scenario. */
export function createSingleCouncilState(input: SingleCouncilScenarioV1): SingleCouncilStateResultV1 { try { const start = scenario(detach(input)), state = initial(start.scenario, start.child); fitState(state); const result = { ok: true as const, state }; budget(result); return freeze(result); } catch (e) { return freeze(failure(e)); } }
export function executeSingleCouncilCommand(state: SingleCouncilStateV1, input: SingleCouncilEnvelopeV1): SingleCouncilResultV1 { let commandId: string | null = null; try { const e = envelope(detach(input)); commandId = e.id; const s = rebuild(detach(state)); return freeze(attempt(s, e)); } catch (e) { return freeze(failure(e, commandId)); } }
/** Same transaction, including full save and output budgets; no child or RNG mutation escapes. */
export function previewSingleCouncilCommand(state: SingleCouncilStateV1, input: SingleCouncilEnvelopeV1): SingleCouncilPreviewV1 { let commandId: string | null = null; try { const e = envelope(detach(input)); commandId = e.id; const s = rebuild(detach(state)), result = attempt(s, e); if (!result.ok) return freeze(result); const output = { ok: true as const, committed: false as const, duplicate: result.duplicate, projectedState: result.state, receipt: result.receipt }; budget(output); return freeze(output); } catch (e) { return freeze(failure(e, commandId)); } }
export function saveSingleCouncilState(state: SingleCouncilStateV1): SingleCouncilSaveResultV1 { try { return freeze(saveRecord(rebuild(detach(state)))); } catch (e) { return freeze(failure(e)); } }
export function loadSingleCouncilState(serialized: string): SingleCouncilStateResultV1 { try { const r = object(parseJson(serialized), ['tag', 'state', 'childSave']); if (r.tag !== SAVE_TAG) fail('unsupported-save'); const state = rebuild(r.state); if (!same(r.childSave, childSave(state))) fail('child-save-recomputation-mismatch'); const saved = saveRecord(state); if (!saved.ok) return freeze(saved); const output = { ok: true as const, state }; budget(output); return freeze(output); } catch (e) { return freeze(failure(e)); } }
/** The child state is evidence of ordinary resource effects, never a global TP state. */
export function querySingleCouncilState(state: SingleCouncilStateV1): SingleCouncilQueryResultV1 { try { const s = rebuild(detach(state)); const result = { ok: true as const, snapshot: s.snapshot, childState: s.childState, sourceBoundary: BOUNDARY }; budget(result); return freeze(result); } catch (e) { return freeze(failure(e)); } }
/** Expected records compare only; never choose proposals or write resources. */
export function replaySingleCouncilCommands(input: SingleCouncilTraceV1): SingleCouncilReplayResultV1 {
  let state: State | null = null, index = -1;
  try {
    const r = object(detach(input), ['tag', 'scenario', 'attempts', 'expectedFinalState']); if (r.tag !== 'san11-single-council-trace-v1') fail('unsupported-trace');
    const start = scenario(r.scenario); state = initial(start.scenario, start.child); fitState(state); const outcomes: Expected[] = [];
    for (const item of list(r.attempts, MAX_ARRAY)) {
      index++; const a = object(item, ['envelope', 'expected']); let result: Result;
      try { result = attempt(state, envelope(a.envelope)); } catch (e) { result = failure(e); }
      const observed: Expected = result.ok ? { ok: true, duplicate: result.duplicate, receipt: result.receipt } : result;
      if (a.expected !== null && !same(a.expected, observed)) fail('trace-outcome-mismatch');
      const nextState: State = result.ok ? result.state : state;
      const nextOutcomes: Expected[] = [...outcomes, observed];
      budget({ ok: true, state: nextState, outcomes: nextOutcomes }); state = nextState; outcomes.push(observed);
    }
    if (r.expectedFinalState !== null && !same(r.expectedFinalState, state)) fail('trace-final-state-mismatch');
    return freeze({ ok: true as const, state, outcomes });
  } catch (e) { return freeze({ ok: false as const, reason: failure(e).reason, index, state }); }
}
