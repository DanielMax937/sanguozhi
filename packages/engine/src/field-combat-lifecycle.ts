/** Fixed-episode positive-troop field ledger. No native world, death or reward writers. */
import policyData from '../../../data/catalogs/field-combat-policy-v1.json' with { type: 'json' };

type Frozen<T> = T extends object ? { readonly [K in keyof T]: Frozen<T[K]> } : T;
const PROFILE = 'o14-detached-positive-field-action-v1' as const;
const TAG = 'field-combat-state-v1' as const, TRACE_TAG = 'field-combat-trace-v1' as const;
const MAX_BYTES = 16_777_216, MAX_NODES = 1_048_576, MAX_DEPTH = 32, MAX_ARRAY = 4096;
const MAX_HISTORY = 64, MAX_ATTEMPTS = 4096;
type Policy = typeof policyData;
type Weapon = 'sword' | 'spear' | 'halberd' | 'crossbow' | 'cavalry';
type Status = 'normal' | 'confused' | 'false-report';
type Temperament = 'timid' | 'calm' | 'bold' | 'reckless';
type Action = 'normal-melee' | 'normal-arrow' | 'spiral-thrust' | 'halberd-sweep' | 'halberd-whirlwind' | 'disturb' | 'false-report-status';
type Cell = { id: string; q: number; r: number; terrain: 'plain' | 'grass' | 'sand' | 'forest' | 'wasteland' | 'wetland' | 'road'; height: number; blocked: boolean };
type Panel = { attack: number; defense: number };
type Member = { id: string; intelligence: number; sex: 'male' | 'female'; skills: string[]; relationshipToLeader: 'leader' | 'none' | 'like' | 'spouse' | 'sworn' | 'dislike' };
type UnitState = { id: string; cellId: string; troops: number; energy: number; acted: boolean; status: Status; remaining: number };
type Unit = UnitState & { side: string; weapon: Weapon; aptitude: 'C' | 'B' | 'A' | 'S'; energyCap: number; difficulty: 'normal' | 'super-player'; intelligence: number; charm: number; martial: number; temperament: Temperament; panels: { kind: 'resolved-state-panels-v1'; techAndStatusIncluded: true; normal: Panel; confused: Panel }; members: Member[]; techniques: number[] };
type TapeEntry = { stage: string; bound: 2 | 100; value: number };
type Scenario = { schemaVersion: 1; profile: typeof PROFILE; episodeId: string; round: number; context: { kind: 'detached-ground-only'; allMembersAndSkillsComplete: true; allTechniquesComplete: true; crossUnitRelations: []; unsupportedEntities: []; foodRaidMode?: 'external-positive-proposal-v1' }; map: { qMin: number; qMax: number; rMin: number; rMax: number; cells: Cell[] }; units: Unit[]; rng: { kind: 'stage-bounded-tape-v1'; tape: TapeEntry[] }; policy: Policy };
type Snapshot = { revision: number; episodeId: string; round: number; units: UnitState[]; rngCursor: number };
type Command = { commandId: string; expectedRevision: number; actorId: string; targetId: string; action: Action };
type SourceKey = 'field-damage' | 'tactic-table' | 'strategy-success' | 'strategy-critical' | 'response-fire' | 'skill-facts' | 'technique-facts' | 'o01-status' | 'field-policy';
type Step = { stage: string; sourceKey: SourceKey; evidenceGrade: 'empirical-high' | 'source-listing-reconstruction' | 'explicit-simulation-policy'; policyId: string; actorId: string; targetId: string; decision: boolean | null; reason: string; numbers: { name: string; value: number }[]; labels: { name: string; value: string }[] };
type Draw = { index: number; stage: string; bound: 2 | 100; value: number };
type NumericWrite = { before: number; requestedAfter: number; requestedDelta: number; actualDelta: number; after: number };
type Effect = { unitId: string; side: string; cellBefore: string; cellAfter: string; troops: NumericWrite; energy: NumericWrite; acted: { before: boolean; requestedAfter: boolean; after: boolean }; status: { before: Status; requestedKind: Status; after: Status; remaining: NumericWrite } };
type Coverage = { cellId: string; occupantId: string | null; side: string | null; disposition: 'primary' | 'secondary' | 'friendly-skipped' | 'empty' | 'outside-map'; order: number | null };
const BOUNDARY = { nativeEquivalent: false, stockVerified: false, originalRandomEquivalent: false, rewards: 'not-modeled', nativeActionPoints: 'not-modeled', lifecycle: 'fixed-episode-no-turn-reset', falseReport: 'status-only-no-retreat', original43GroupsReduced: false, original45SnapshotReduced: false, stateHashAuthenticatesProvenance: false } as const;
type FoodRaidRequest = {eventId:string;actorId:string;targetId:string;attackPanel:number;weapon:'spear';techniques:number[];action:'normal-melee'};
type Receipt = { schemaVersion: 1; profile: typeof PROFILE; policyId: string; policyHash: string; sourceBoundary: typeof BOUNDARY; command: Command; episodeId: string; round: number; revisionBefore: number; revisionAfter: number; stateHashBefore: string; stateHashAfter: string; actorSide: string; targetSide: string; actionStartCellId: string; activationCellId: string; range: number; coverage: Coverage[]; outcome: 'physical' | 'tactic-fallback' | 'strategy-succeeded' | 'strategy-failed'; steps: Step[]; draws: Draw[]; rngBefore: number; rngAfter: number; effects: Effect[]; foodRaidRequest?: FoodRaidRequest; requiresExternalFoodSettlement?: true };
type State = { tag: typeof TAG; schemaVersion: 1; profile: typeof PROFILE; policy: Policy; sourceBoundary: typeof BOUNDARY; genesis: { scenario: Scenario; snapshot: Snapshot }; snapshot: Snapshot; acceptedCommands: { command: Command; receipt: Receipt }[] };
type Failure = { ok: false; committed: false; reason: string; commandId: string | null; index: number | null; before: Snapshot | null; after: Snapshot | null; effects: [] };
type StateResult = { ok: true; state: State } | Failure;
type CommandResult = { ok: true; committed: boolean; duplicate: boolean; state: State; receipt: Receipt } | Failure;
type PreviewResult = { ok: true; committed: false; duplicate: boolean; receipt: Receipt; projectedSnapshot: Snapshot } | Failure;
type SaveResult = { ok: true; json: string } | Failure;
type ExpectedOutcome = { ok: true; duplicate: boolean; receipt: Receipt } | Failure;
type Trace = { tag: typeof TRACE_TAG; scenario: Scenario; attempts: { command: Command; expectedOutcome: ExpectedOutcome | null }[]; expectedFinalSnapshot: Snapshot | null };
type ReplayResult = { ok: true; state: State; outcomes: ExpectedOutcome[] } | Failure;
export type FieldCombatScenarioV1 = Frozen<Scenario>;
export type FieldCombatStateV1 = Frozen<State>;
export type FieldCombatSnapshotV1 = Frozen<Snapshot>;
export type FieldCombatCommandV1 = Frozen<Command>;
export type FieldCombatPolicyV1 = Frozen<Policy>;
export type FieldCombatReceiptV1 = Frozen<Receipt>;
export type FieldCombatFailureV1 = Frozen<Failure>;
export type FieldCombatStateResultV1 = Frozen<StateResult>;
export type FieldCombatCommandResultV1 = Frozen<CommandResult>;
export type FieldCombatPreviewResultV1 = Frozen<PreviewResult>;
export type FieldCombatSaveResultV1 = Frozen<SaveResult>;
export type FieldCombatTraceV1 = Frozen<Trace>;
export type FieldCombatReplayResultV1 = Frozen<ReplayResult>;

class Invalid extends Error { readonly reason: string; readonly index: number | null; constructor(reason: string, index: number | null = null) { super(reason); this.reason = reason; this.index = index; } }
function fail(reason: string, index: number | null = null): never { throw new Invalid(reason, index); }
function failure(e: unknown, before: Snapshot | null = null, commandId: string | null = null): Failure { return { ok: false, committed: false, reason: e instanceof Invalid ? e.reason : 'invalid-input', commandId, index: e instanceof Invalid ? e.index : null, before: clone(before), after: clone(before), effects: [] }; }
function freeze<T>(v: T): Frozen<T> { if (v !== null && typeof v === 'object' && !Object.isFrozen(v)) { for (const x of Object.values(v)) freeze(x); Object.freeze(v); } return v as Frozen<T>; }
function clone<T>(v: T): T { return JSON.parse(JSON.stringify(v)) as T; }
function canonical(v: unknown): string { if (v === null || typeof v !== 'object') return JSON.stringify(v); if (Array.isArray(v)) return '[' + v.map(canonical).join(',') + ']'; const r = v as Record<string, unknown>; return '{' + Object.keys(r).sort().map(k => JSON.stringify(k) + ':' + canonical(r[k])).join(',') + '}'; }
function same(a: unknown, b: unknown): boolean { return canonical(a) === canonical(b); }
function utf8Bytes(s: string): number { let n = 0; for (const c of s) { const p = c.codePointAt(0)!; n += p < 128 ? 1 : p < 2048 ? 2 : p < 65536 ? 3 : 4; } return n; }
/** Non-authenticating content label only. Full data, never hash alone, is compared on replay. */
function contentHash(v: unknown): string { let h = 14695981039346656037n; const s = canonical(v); for (let i = 0; i < s.length; i++) { h ^= BigInt(s.charCodeAt(i)); h = BigInt.asUintN(64, h * 1099511628211n); } return 'fnv1a64-utf16:' + h.toString(16).padStart(16, '0'); }
/** Non-Proxy plain JSON DTO contract in an unpolluted runtime. Reflection may invoke Proxy traps.
 * Own accessors, symbols, cycles, sparse/extra-property arrays and exotic prototypes are rejected. */
function detach(v: unknown): unknown {
  let nodes = 0, bytes = 0; const active = new Set<object>();
  function visit(x: unknown, depth: number): unknown {
    if (++nodes > MAX_NODES || depth > MAX_DEPTH) fail('serialization-budget');
    if (x === null || typeof x === 'boolean') return x;
    if (typeof x === 'number') { if (!Number.isFinite(x) || Math.abs(x) > Number.MAX_SAFE_INTEGER || Object.is(x, -0)) fail('invalid-number'); return x; }
    if (typeof x === 'string') { if (x.length > MAX_BYTES) fail('serialization-budget'); bytes += utf8Bytes(x); if (bytes > MAX_BYTES) fail('serialization-budget'); return x; }
    if (typeof x !== 'object' || active.has(x)) fail('invalid-data');
    const arr = Array.isArray(x), proto = Object.getPrototypeOf(x); if (proto !== (arr ? Array.prototype : Object.prototype) && !(proto === null && !arr)) fail('invalid-prototype');
    const keys = Reflect.ownKeys(x); if (keys.length > (arr ? MAX_ARRAY + 1 : 128)) fail('serialization-budget');
    const ds = Object.getOwnPropertyDescriptors(x); Object.setPrototypeOf(ds, null);
    if (keys.some(k => typeof k !== 'string' || !Object.hasOwn(ds[k]!, 'value') || (!ds[k]!.enumerable && !(arr && k === 'length')))) fail('invalid-data');
    active.add(x);
    try {
      if (arr) { const n = ds.length!.value as number; if (!Number.isSafeInteger(n) || n < 0 || n > MAX_ARRAY || keys.length !== n + 1) fail('invalid-array'); const out: unknown[] = []; for (let i = 0; i < n; i++) { const d = ds[String(i)]; if (!Object.hasOwn(ds, String(i)) || !d) fail('invalid-array'); out.push(visit(d.value, depth + 1)); } return out; }
      const out: Record<string, unknown> = {}; for (const k of keys as string[]) { bytes += utf8Bytes(k); if (bytes > MAX_BYTES) fail('serialization-budget'); Object.defineProperty(out, k, { value: visit(ds[k]!.value, depth + 1), enumerable: true, writable: true, configurable: true }); } return out;
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
function oneOf<T extends string>(v: unknown, allowed: readonly T[]): T { if (typeof v !== 'string' || !allowed.includes(v as T)) fail('invalid-enum'); return v as T; }
function unique<T>(xs: T[]): void { if (new Set(xs).size !== xs.length) fail('duplicate-id'); }
const order = (a: string, b: string): number => a < b ? -1 : a > b ? 1 : 0;
/** Bounded JSON text reader rejects duplicate decoded keys before overwrite. */
function parseJson(text: unknown): unknown {
  if (typeof text !== 'string') fail('invalid-json'); if (text.length > MAX_BYTES || utf8Bytes(text) > MAX_BYTES) fail('serialization-budget'); let p = 0, nodes = 0;
  const ws = () => { while (p < text.length && /[\x20\t\r\n]/.test(text[p]!)) p++; };
  function str(): string { const start = p++; let escaped = false; while (p < text.length) { const c = text[p++]!; if (!escaped && c === '"') return JSON.parse(text.slice(start, p)) as string; if (!escaped && c === '\\') escaped = true; else escaped = false; } return fail('invalid-json'); }
  function value(depth: number): unknown {
    if (++nodes > MAX_NODES || depth > MAX_DEPTH) fail('serialization-budget'); ws(); const c = text[p]; if (c === '"') return str();
    if (c === '{') { p++; ws(); const r: Record<string, unknown> = {}, keys = new Set<string>(); if (text[p] === '}') { p++; return r; } while (true) { ws(); if (text[p] !== '"') fail('invalid-json'); const k = str(); if (keys.has(k)) fail('duplicate-json-key'); keys.add(k); if (keys.size > 128) fail('serialization-budget'); ws(); if (text[p++] !== ':') fail('invalid-json'); Object.defineProperty(r, k, { value: value(depth + 1), enumerable: true, writable: true, configurable: true }); ws(); const end = text[p++]; if (end === '}') return r; if (end !== ',') fail('invalid-json'); } }
    if (c === '[') { p++; ws(); const r: unknown[] = []; if (text[p] === ']') { p++; return r; } while (true) { if (r.length >= MAX_ARRAY) fail('serialization-budget'); r.push(value(depth + 1)); ws(); const end = text[p++]; if (end === ']') return r; if (end !== ',') fail('invalid-json'); } }
    for (const [token, result] of [['true', true], ['false', false], ['null', null]] as const) if (text.startsWith(token, p)) { p += token.length; return result; }
    const token = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/.exec(text.slice(p))?.[0]; if (!token) fail('invalid-json'); p += token.length; const n = Number(token); if (!Number.isFinite(n) || Math.abs(n) > Number.MAX_SAFE_INTEGER || Object.is(n, -0)) fail('invalid-number'); return n;
  }
  const result = value(0); ws(); if (p !== text.length) fail('invalid-json'); return detach(result);
}
const POLICY = clone(policyData);
export const FIELD_COMBAT_POLICY_REGISTRY_V1 = freeze([clone(POLICY)]);
export const FIELD_COMBAT_DEFAULT_POLICY_V1 = freeze(POLICY);
export const FIELD_COMBAT_EVIDENCE_V1 = freeze(BOUNDARY);
const ACTIONS: readonly Action[] = ['normal-melee', 'normal-arrow', 'spiral-thrust', 'halberd-sweep', 'halberd-whirlwind', 'disturb', 'false-report-status'];
const KNOWN_SKILLS = new Set([...POLICY.supportedSkills, ...POLICY.unsupportedPhysicalSkills, ...POLICY.unsupportedStrategySkills]);
function skill(v: unknown): string { if (typeof v !== 'string') fail('invalid-skill'); const aliases = POLICY.aliases as Record<string, string>; const s = Object.hasOwn(aliases, v) ? aliases[v]! : v; if (!KNOWN_SKILLS.has(s)) fail('unsupported-skill'); return s; }
function panel(v: unknown): Panel { const r = object(v, ['attack', 'defense']); return { attack: uint(r.attack, 255), defense: uint(r.defense, 255) }; }
function unitState(v: Record<string, unknown>): UnitState { const status = oneOf(v.status, ['normal', 'confused', 'false-report'] as const), remaining = uint(v.remaining, 255); if ((status === 'normal') !== (remaining === 0)) fail('inconsistent-status'); return { id: id(v.id), cellId: id(v.cellId), troops: uint(v.troops, 1_000_000, 1), energy: uint(v.energy, 120), acted: bool(v.acted), status, remaining }; }
function scenario(v: unknown): Scenario {
  const s = object(v, ['schemaVersion', 'profile', 'episodeId', 'round', 'context', 'map', 'units', 'rng', 'policy']); if (s.schemaVersion !== 1 || s.profile !== PROFILE) fail('unsupported-profile'); if (!same(s.policy, POLICY)) fail('policy-mismatch');
  const rawContext=s.context as Record<string,unknown>;
  const hasFoodRaidMode=rawContext!==null&&typeof rawContext==='object'&&Object.hasOwn(rawContext,'foodRaidMode');
  const context = object(s.context, ['kind', 'allMembersAndSkillsComplete', 'allTechniquesComplete', 'crossUnitRelations', 'unsupportedEntities',...(hasFoodRaidMode?['foodRaidMode']:[])]);
  if(hasFoodRaidMode&&context.foodRaidMode!=='external-positive-proposal-v1')fail('unsupported-food-raid-mode');
  if (context.kind !== 'detached-ground-only' || context.allMembersAndSkillsComplete !== true || context.allTechniquesComplete !== true || list(context.crossUnitRelations, 0).length || list(context.unsupportedEntities, 0).length) fail('unsupported-context');
  const m = object(s.map, ['qMin', 'qMax', 'rMin', 'rMax', 'cells']); const qMin = uint(m.qMin, 255, -255), qMax = uint(m.qMax, 255, qMin), rMin = uint(m.rMin, 255, -255), rMax = uint(m.rMax, 255, rMin);
  const area = (qMax - qMin + 1) * (rMax - rMin + 1); if (area > 256) fail('map-limit');
  const cells: Cell[] = list(m.cells, 256).map(v => { const c = object(v, ['id', 'q', 'r', 'terrain', 'height', 'blocked']); return { id: id(c.id), q: uint(c.q, qMax, qMin), r: uint(c.r, rMax, rMin), terrain: oneOf(c.terrain, ['plain', 'grass', 'sand', 'forest', 'wasteland', 'wetland', 'road'] as const), height: uint(c.height, 255), blocked: bool(c.blocked) }; });
  if (cells.length !== area) fail('incomplete-map'); unique(cells.map(c => c.id)); unique(cells.map(c => c.q + ':' + c.r)); cells.sort((a, b) => order(a.id, b.id));
  const units: Unit[] = list(s.units, 64).map(v => {
    const u = object(v, ['id', 'cellId', 'troops', 'energy', 'acted', 'status', 'remaining', 'side', 'weapon', 'aptitude', 'energyCap', 'difficulty', 'intelligence', 'charm', 'martial', 'temperament', 'panels', 'members', 'techniques']);
    const p = object(u.panels, ['kind', 'techAndStatusIncluded', 'normal', 'confused']); if (p.kind !== 'resolved-state-panels-v1' || p.techAndStatusIncluded !== true) fail('unsupported-panels');
    const members: Member[] = list(u.members, 3).map(v => { const t = object(v, ['id', 'intelligence', 'sex', 'skills', 'relationshipToLeader']); return { id: id(t.id), intelligence: uint(t.intelligence, 100), sex: oneOf(t.sex, ['male', 'female'] as const), skills: [...new Set(list(t.skills, 64).map(skill))].sort(order), relationshipToLeader: oneOf(t.relationshipToLeader, ['leader', 'none', 'like', 'spouse', 'sworn', 'dislike'] as const) }; });
    if (!members.length || members.filter(t => t.relationshipToLeader === 'leader').length !== 1) fail('invalid-members'); unique(members.map(t => t.id)); members.sort((a, b) => order(a.id, b.id));
    const techniques = list(u.techniques, 36).map(v => uint(v, 35)); unique(techniques); techniques.sort((a, b) => a - b);
    for (const t of techniques) for (let prerequisite = t - t % 4; prerequisite < t; prerequisite++) if (!techniques.includes(prerequisite)) fail('incomplete-technique-chain');
    const energyCap = uint(u.energyCap, 120, 100); if (energyCap !== (techniques.includes(16) ? 120 : 100)) fail('energy-cap-mismatch');
    const state = unitState(u); if (state.energy > energyCap) fail('invalid-energy');
    return { ...state, side: id(u.side), weapon: oneOf(u.weapon, ['sword', 'spear', 'halberd', 'crossbow', 'cavalry'] as const), aptitude: oneOf(u.aptitude, ['C', 'B', 'A', 'S'] as const), energyCap, difficulty: oneOf(u.difficulty, ['normal', 'super-player'] as const), intelligence: uint(u.intelligence, 100), charm: uint(u.charm, 255), martial: uint(u.martial, 255), temperament: oneOf(u.temperament, ['timid', 'calm', 'bold', 'reckless'] as const), panels: { kind: 'resolved-state-panels-v1', techAndStatusIncluded: true, normal: panel(p.normal), confused: panel(p.confused) }, members, techniques };
  });
  if (!units.length) fail('empty-units'); unique(units.map(u => u.id)); unique(units.map(u => u.cellId)); unique(units.flatMap(u => u.members.map(t => t.id))); units.sort((a, b) => order(a.id, b.id));
  for (const u of units) { const cell = cells.find(c => c.id === u.cellId); if (!cell || cell.blocked) fail('unsupported-unit-position'); for (const other of units) if (other.side === u.side && !same(other.techniques, u.techniques)) fail('inconsistent-side-techniques'); }
  const r = object(s.rng, ['kind', 'tape']); if (r.kind !== 'stage-bounded-tape-v1') fail('unsupported-rng');
  const tape: TapeEntry[] = list(r.tape, 4096).map(v => { const d = object(v, ['stage', 'bound', 'value']); if (d.bound !== 2 && d.bound !== 100) fail('rng-bound'); return { stage: id(d.stage), bound: d.bound, value: uint(d.value, d.bound - 1) }; });
  return { schemaVersion: 1, profile: PROFILE, episodeId: id(s.episodeId), round: uint(s.round, 1_000_000), context: { kind: 'detached-ground-only', allMembersAndSkillsComplete: true, allTechniquesComplete: true, crossUnitRelations: [], unsupportedEntities: [],...(hasFoodRaidMode?{foodRaidMode:'external-positive-proposal-v1' as const}:{}) }, map: { qMin, qMax, rMin, rMax, cells }, units, rng: { kind: 'stage-bounded-tape-v1', tape }, policy: clone(POLICY) };
}
function command(v: unknown): Command { const r = object(v, ['commandId', 'expectedRevision', 'actorId', 'targetId', 'action']); return { commandId: id(r.commandId), expectedRevision: uint(r.expectedRevision, MAX_HISTORY), actorId: id(r.actorId), targetId: id(r.targetId), action: oneOf(r.action, ACTIONS) }; }
function initialState(s: Scenario): State { const snapshot: Snapshot = { revision: 0, episodeId: s.episodeId, round: s.round, units: s.units.map(u => ({ id: u.id, cellId: u.cellId, troops: u.troops, energy: u.energy, acted: u.acted, status: u.status, remaining: u.remaining })), rngCursor: 0 }; return { tag: TAG, schemaVersion: 1, profile: PROFILE, policy: clone(POLICY), sourceBoundary: clone(BOUNDARY), genesis: { scenario: clone(s), snapshot: clone(snapshot) }, snapshot, acceptedCommands: [] }; }

const DIRECTIONS = [[1, 0], [0, 1], [-1, 1], [-1, 0], [0, -1], [1, -1]] as const;
function distance(a: Cell, b: Cell): number { const q = a.q - b.q, r = a.r - b.r; return Math.max(Math.abs(q), Math.abs(r), Math.abs(q + r)); }
function has(u: Unit, name: string): boolean { return u.members.some(m => m.skills.includes(name)); }
function holder(u: Unit, name: string): number { const members = u.members.filter(m => m.skills.includes(name)); return members.length ? Math.max(...members.map(m => m.intelligence)) : -1; }
function usedPanel(u: Unit): Panel { return u.status === 'confused' ? u.panels.confused : u.panels.normal; }
function panelName(u: Unit): string { return u.status === 'confused' ? 'confused' : 'normal'; }
function strategyAction(action: Action): boolean { return action === 'disturb' || action === 'false-report-status'; }
function tacticAction(action: Action): boolean { return action === 'spiral-thrust' || action === 'halberd-sweep' || action === 'halberd-whirlwind'; }
function finite(n: number): number { if (!Number.isFinite(n) || Math.abs(n) > Number.MAX_SAFE_INTEGER) fail('arithmetic-domain'); return n === 0 ? 0 : n; }
function boundedRate(n: number): number { return Math.max(0, Math.min(100, Math.floor(finite(n)))); }
function numericWrite(before: number, after: number, requestedAfter = after): NumericWrite { return { before, requestedAfter, requestedDelta: requestedAfter - before, actualDelta: after - before, after }; }
function resolve(s: Scenario, before: Snapshot, cmd: Command): { snapshot: Snapshot; receipt: Receipt } {
  const snapshot = clone(before), steps: Step[] = [], draws: Draw[] = [], coverage: Coverage[] = [];
  const unit = (id: string): Unit => { const facts = s.units.find(u => u.id === id), now = snapshot.units.find(u => u.id === id); if (!facts || !now) fail('unknown-unit'); return { ...facts, ...now }; };
  const startUnit = (id: string): Unit => { const facts = s.units.find(u => u.id === id), now = before.units.find(u => u.id === id); if (!facts || !now) fail('unknown-unit'); return { ...facts, ...now }; };
  const mutable = (id: string): UnitState => snapshot.units.find(u => u.id === id)!;
  const cell = (id: string): Cell => s.map.cells.find(c => c.id === id)!;
  const actor = startUnit(cmd.actorId), target = startUnit(cmd.targetId), from = cell(actor.cellId), to = cell(target.cellId), range = distance(from, to);
  const strategy = strategyAction(cmd.action), tactic = tacticAction(cmd.action);
  const step = (stage: string, sourceKey: SourceKey, policyId: string, a: Unit, b: Unit, reason: string, decision: boolean | null = null, numbers: Record<string, number> = {}, labels: Record<string, string> = {}): void => {
    const evidenceGrade = sourceKey === 'field-damage' && stage.startsWith('reaction.') ? 'explicit-simulation-policy' : sourceKey === 'strategy-critical' ? 'source-listing-reconstruction' : sourceKey === 'field-damage' || sourceKey === 'tactic-table' || sourceKey === 'strategy-success' ? 'empirical-high' : 'explicit-simulation-policy';
    steps.push({ stage, sourceKey, evidenceGrade, policyId, actorId: a.id, targetId: b.id, decision, reason, numbers: Object.entries(numbers).map(([name, value]) => ({ name, value: finite(value) })), labels: Object.entries(labels).map(([name, value]) => ({ name, value })) });
  };
  const draw = (stage: string, bound: 2 | 100): number => { const index = snapshot.rngCursor, d = s.rng.tape[index]; if (!d) fail('rng-exhausted'); if (d.stage !== stage) fail('rng-stage-mismatch'); if (d.bound !== bound) fail('rng-bound-mismatch'); snapshot.rngCursor++; draws.push({ index, stage, bound, value: d.value }); return d.value; };
  const roll = (stage: string, rate: number, a: Unit, b: Unit, sourceKey: SourceKey, policyId: string, reason: string, facts: Record<string, number> = {}, labels: Record<string, string> = {}): boolean => { const p = boundedRate(rate), value = p === 0 || p === 100 ? null : draw(stage, 100), yes = p === 100 || (value !== null && value < p); step(stage, sourceKey, policyId, a, b, reason, yes, { ...facts, rawRate: rate, rate: p, ...(value === null ? {} : { roll: value }) }, { ...labels, rng: value === null ? 'deterministic-rate-no-draw' : 'draw100' }); return yes; };
  const rayClear = (a: Cell, b: Cell): boolean => { const n = distance(a, b); return !s.map.cells.some(c => c.blocked && c.id !== a.id && c.id !== b.id && distance(a, c) + distance(c, b) === n); };
  const arrowLegal = (a: Unit, b: Unit): boolean => { const n = distance(cell(a.cellId), cell(b.cellId)); return a.weapon === 'crossbow' && n >= 2 && n <= (a.techniques.includes(10) ? 3 : 2) && (cell(b.cellId).terrain !== 'forest' || has(a, '射手')) && rayClear(cell(a.cellId), cell(b.cellId)); };
  if (actor.id === target.id || actor.side === target.side) fail('not-enemy-target');
  if (actor.status !== 'normal' || actor.acted) fail('actor-unavailable');
  if (cmd.action === 'normal-arrow') { if (!arrowLegal(actor, target)) fail('illegal-arrow-target'); }
  else if (strategy) { if (range < 1 || range > (has(actor, '鬼谋') ? 3 : 2) || !rayClear(from, to)) fail('illegal-strategy-target'); }
  else if (range !== 1) fail('nonadjacent-target');
  if (cmd.action === 'spiral-thrust' && (actor.weapon !== 'spear' || !['A', 'S'].includes(actor.aptitude) || to.terrain === 'sand')) fail('illegal-tactic');
  if (cmd.action === 'halberd-sweep' && (actor.weapon !== 'halberd' || !['A', 'S'].includes(actor.aptitude))) fail('illegal-tactic');
  if (cmd.action === 'halberd-whirlwind' && (actor.weapon !== 'halberd' || actor.aptitude !== 'S')) fail('illegal-tactic');
  const cost = strategy ? (has(actor, '百出') ? 1 : 15) : cmd.action === 'halberd-whirlwind' ? 30 : tactic ? 20 : 0;
  if (actor.energy < cost) fail('insufficient-energy');
  // Freeze the complete geometric coverage before any RNG. A later miss selects only primary.
  const targetIds = [target.id];
  if (cmd.action === 'halberd-sweep' || cmd.action === 'halberd-whirlwind') {
    const direction = DIRECTIONS.findIndex(([q, r]) => from.q + q === to.q && from.r + r === to.r);
    if (direction < 0) fail('invalid-geometry');
    const directions = cmd.action === 'halberd-sweep' ? [direction, (direction + 5) % 6, (direction + 1) % 6] : [direction, ...[0, 1, 2, 3, 4, 5].filter(d => d !== direction)];
    for (const d of directions) {
      const [q, r] = DIRECTIONS[d]!, c = s.map.cells.find(c => c.q === from.q + q && c.r === from.r + r), occupant = c ? s.units.find(u => u.cellId === c.id) : undefined;
      if (occupant && occupant.side !== actor.side && occupant.id !== target.id) targetIds.push(occupant.id);
      coverage.push({ cellId: c?.id ?? 'outside:' + (from.q + q) + ':' + (from.r + r), occupantId: occupant?.id ?? null, side: occupant?.side ?? null, disposition: !c ? 'outside-map' : !occupant ? 'empty' : occupant.side === actor.side ? 'friendly-skipped' : occupant.id === target.id ? 'primary' : 'secondary', order: null });
    }
    const rest = targetIds.splice(1).sort((a, b) => order(startUnit(a).cellId, startUnit(b).cellId)); targetIds.push(...rest);
    for (const item of coverage) if (item.occupantId !== null && targetIds.includes(item.occupantId)) item.order = targetIds.indexOf(item.occupantId);
    coverage.sort((a, b) => (a.order ?? 100) - (b.order ?? 100) || order(a.cellId, b.cellId));
  } else coverage.push({ cellId: target.cellId, occupantId: target.id, side: target.side, disposition: 'primary', order: 0 });
  const participants = [actor, ...targetIds.map(startUnit)];
  const excludedSkills = strategy ? POLICY.unsupportedStrategySkills : POLICY.unsupportedPhysicalSkills;
  for (const participant of participants) if (participant.members.some(m => m.skills.some(k => excludedSkills.includes(k)))) fail('unsupported-skill-context');
  if (!strategy && s.units.some(u => has(u, '辅佐'))) fail('unsupported-cross-unit-support');
  const deferredFoodRaid = !strategy && actor.weapon === 'spear' && actor.techniques.includes(1);
  if(deferredFoodRaid && !(s.context.foodRaidMode==='external-positive-proposal-v1' && cmd.action==='normal-melee' && actor.techniques.includes(0))) fail('unsupported-food-raid');
  if (strategy && actor.intelligence === 0 && target.intelligence === 0) fail('strategy-zero-denominator');
  // Structural unsupported status replacements are rejected before a possibly lucky miss.
  const requestedStatus: Status = cmd.action === 'false-report-status' ? 'false-report' : 'confused';
  if ((strategy || cmd.action === 'spiral-thrust') && target.status !== 'normal' && target.status !== requestedStatus) fail('unsupported-status-replacement');
  step('legality', 'field-policy', POLICY.map, actor, target, 'complete-preflight-before-rng', true, { range, energyCost: cost, sourceHeight: from.height, targetHeight: to.height }, { sourceTerrain: from.terrain, targetTerrain: to.terrain, heightRule: POLICY.height, actionStartCellId: actor.cellId, activationCellId: actor.cellId });
  mutable(actor.id).energy -= cost; mutable(actor.id).acted = true;
  const touched = new Set<string>([actor.id]), requestedCounts = new Map<string, number>(), requestedKinds = new Map<string, Status>();
  const applyStatus = (b: Unit, kind: Exclude<Status, 'normal'>, duration: number, stageName: string): void => {
    if (duration === 0) { step(stageName, 'o01-status', POLICY.status, actor, b, 'zero-duration-no-effective-status', false, { rolledDuration: 0, remainingBefore: b.remaining, remainingAfter: b.remaining, actualDelta: 0 }); return; }
    const u = mutable(b.id); if (u.status !== 'normal' && u.status !== kind) fail('unsupported-status-replacement');
    const oldStatus = u.status, old = u.remaining; u.status = kind; u.remaining = Math.max(old, duration); touched.add(u.id); requestedCounts.set(u.id, duration); requestedKinds.set(u.id, kind);
    step(stageName, 'o01-status', POLICY.status, actor, b, 'explicit-adapter-max-refresh', true, { rolledDuration: duration, remainingBefore: old, requestedDelta: duration - old, remainingAfter: u.remaining, actualDelta: u.remaining - old }, { statusBefore: oldStatus, statusAfter: kind, movement: 'none', nativeMission: 'not-modeled' });
  };
  const physicalCritical = (a: Unit, b: Unit, isTactic: boolean, stageName: string): boolean => {
    const martialBase = a.martial <= 60 ? 0 : a.martial < 80 ? 1 : 2, aptitudeBonus = { C: 0, B: 1, A: 2, S: 3 }[a.aptitude];
    const relationshipBonus = a.members.reduce((n, m) => n + ({ leader: 0, none: 0, like: 2, spouse: 4, sworn: 4, dislike: -5 }[m.relationshipToLeader]), 0);
    const guaranteed = isTactic && (has(a, '霸王') || has(a, '斗神') || (a.weapon === 'spear' && has(a, '枪神')) || (a.weapon === 'halberd' && has(a, '戟神')));
    const raw = guaranteed ? 100 : martialBase + aptitudeBonus + relationshipBonus;
    return roll(stageName, raw, a, b, isTactic ? 'tactic-table' : 'field-policy', isTactic ? 'tactic-critical-05-v1' : POLICY.normalCritical, guaranteed ? 'matching-unconditional-tactic-skill' : 'natural-rate', { martialBase, aptitudeBonus, relationshipBonus }, { skillStacking: 'one-critical-only' });
  };
  const physical = (a: Unit, b: Unit, isTactic: boolean, coefficient: number, reaction: boolean, arrow: boolean, index: number, scaleNumerator: number, scaleDenominator: number): void => {
    const prefix = reaction ? 'reaction' : 'attack.' + index, ordinary = !isTactic;
    touched.add(b.id);
    const shield = ordinary && b.weapon === 'halberd' && (b.techniques.includes(6) || (b.techniques.includes(5) && a.weapon === 'crossbow'));
    if (shield && roll(prefix + '.shield', POLICY.shieldRate, a, b, 'technique-facts', POLICY.shield, b.techniques.includes(6) ? 'large-shield-overrides-arrow-shield' : 'arrow-shield', {}, { sourceWeapon: a.weapon, shieldSourcePolicy: POLICY.shieldSource })) { step(prefix + '.damage', 'field-policy', POLICY.shield, a, b, 'blocked-zero-loss-critical-and-damage-skipped', false, { damage: 0 }, { response: 'primary-may-still-respond' }); return; }
    if (!shield) step(prefix + '.shield', 'technique-facts', POLICY.shield, a, b, 'inapplicable-no-draw', false);
    const critical = physicalCritical(a, b, isTactic, prefix + '.critical');
    const ap = usedPanel(a), dp = usedPanel(b), n = a.troops, m = b.troops, aa = ap.attack, dd = dp.defense;
    const nHundred = Math.floor(n * 0.01), mHundred = Math.floor(m * 0.01), u = (nHundred + 300) * (aa + 50) ** 2 * 0.01, v = (mHundred + 300) * (dd + 50) ** 2 * 0.01;
    const ratioInput = u * 100 / (u + v) - 50, ratio = Math.trunc(ratioInput) + 50;
    const coefficientTerm = Math.sqrt(coefficient * 64), defenseFloor = Math.max(40, dd), panelAdvantage = Math.max(0, Math.floor((aa ** 2 - defenseFloor ** 2) / 300)), troopAdvantage = Math.max(0, Math.floor((n - m) / 2000));
    const base = coefficientTerm + panelAdvantage + troopAdvantage + 50, troopRoot = Math.min(Math.sqrt(Math.floor(n / 4)), 40), fixedTroops = Math.floor(n / 200);
    let matchup = 1; if (isTactic && a.weapon === 'spear') matchup = b.weapon === 'cavalry' ? 1.15 : b.weapon === 'halberd' ? 0.85 : 1; if (isTactic && a.weapon === 'halberd') matchup = b.weapon === 'spear' ? 1.15 : b.weapon === 'cavalry' ? 0.85 : 1;
    const trainingId = { sword: -1, spear: 0, halberd: 4, crossbow: 8, cavalry: 12 }[a.weapon], eliteId = trainingId < 0 ? -1 : trainingId + 3;
    const tech = eliteId >= 0 && a.techniques.includes(eliteId) ? 1.15 : trainingId >= 0 && a.techniques.includes(trainingId) ? 1.10 : 1;
    const difficulty = a.difficulty === 'super-player' ? 0.75 : 1, criticalMultiplier = critical ? 1.15 : 1;
    const beforeModifiers = base * 10 * ratio * troopRoot * 0.000476190455 * POLICY.drum + fixedTroops;
    const modified = finite(beforeModifiers * criticalMultiplier * matchup * tech * difficulty), coreDamage = Math.floor(modified), damage = Math.floor(coreDamage * scaleNumerator / scaleDenominator);
    finite(damage); if (!Number.isSafeInteger(damage) || damage < 0) fail('arithmetic-domain');
    step(prefix + '.damage', 'field-damage', POLICY.arithmetic, a, b, reaction ? 'post-hit-reverse-core-then-reaction-scale' : 'action-start-snapshot-core', true, { attack: aa, defense: dd, attackerTroops: n, defenderTroops: m, coefficient, nHundred, mHundred, u, v, ratioInput, ratio, coefficientTerm, defenseFloor, panelAdvantage, troopAdvantage, base, troopRoot, fixedTroops, drum: POLICY.drum, beforeModifiers, criticalMultiplier, matchup, tech, difficulty, modified, coreDamage, trainingId, eliteId, reactionScaleNumerator: scaleNumerator, reactionScaleDenominator: scaleDenominator, damage }, { attackerPanel: panelName(a), defenderPanel: panelName(b), panelLayers: 'supplied-tech-and-status-already-included', damageTech: tech === 1.15 ? 'elite-overrides-training' : tech === 1.1 ? 'training' : 'none', difficultyOwner: a.id, damageRole: reaction ? arrow ? 'response-fire' : 'counterattack' : 'active', matchupMeaning: 'weapon-advantage-not-counterattack', reactionPolicy: POLICY.reaction, criticalSource: isTactic ? 'tactic-table' : POLICY.normalCritical, matchupSource: '05-combat-weapon-matchup', techSource: 'technique-facts', difficultySource: '05-combat-difficulty', drumSource: 'fixed-no-facilities' });
    if (reaction) step('reaction.scale', 'field-policy', POLICY.reaction, a, b, 'explicit-simulation-scale-after-complete-core-floor', true, { coreDamage, numerator: scaleNumerator, denominator: scaleDenominator, damage });
    const receiving = mutable(b.id); if (damage >= receiving.troops) fail('unsupported-terminal-effect'); receiving.troops -= damage;
    if (isTactic && cmd.action === 'spiral-thrust') {
      let duration = 0;
      if (critical) duration = 1 + draw(prefix + '.spiral-count', 2);
      else if (roll(prefix + '.spiral-gate', POLICY.spiralNoncriticalGate, a, b, 'tactic-table', 'spiral-two-stage-duration-v1', 'noncritical-entry-gate')) duration = draw(prefix + '.spiral-count', 2);
      applyStatus(b, 'confused', duration, prefix + '.status');
    }
  };
  let outcome: Receipt['outcome'] = 'physical';
  if (strategy) {
    let hit = false;
    const immunities = has(target, '洞察') ? '洞察' : holder(target, '看破') > actor.intelligence ? '看破' : has(target, '明镜') ? '明镜' : cmd.action === 'false-report-status' && has(target, '规律') ? '规律' : cmd.action === 'disturb' && has(target, '沉着') ? '沉着' : null;
    const conditional = cmd.action === 'false-report-status' ? '言毒' : '机略';
    const guaranteed = holder(actor, conditional) > target.intelligence ? conditional : holder(actor, '虚实') > target.intelligence ? '虚实' : null;
    if (immunities !== null) hit = roll('strategy.hit', 0, actor, target, 'skill-facts', POLICY.skillHolder, 'immunity-before-guarantee', { defenderSkillHolder: holder(target, immunities), actorIntelligence: actor.intelligence }, { winningSkill: immunities });
    else if (guaranteed !== null) hit = roll('strategy.hit', 100, actor, target, 'skill-facts', POLICY.skillHolder, 'conditional-guarantee', { actorSkillHolder: holder(actor, guaranteed), targetIntelligence: target.intelligence }, { winningSkill: guaranteed });
    else {
      const a = actor.intelligence, b = target.intelligence, abnormal = target.status === 'normal' ? 0 : 10, penalty = b > a ? (b - a) / 6 : 0;
      const personality = cmd.action === 'false-report-status' ? { timid: 3, calm: 1, bold: 0, reckless: -2 }[target.temperament] : { timid: -2, calm: 0, bold: 1, reckless: 3 }[target.temperament];
      const attribute = cmd.action === 'false-report-status' ? actor.charm : usedPanel(target).defense, divisor = cmd.action === 'false-report-status' ? 55 : 45;
      const denominator = a * a + b * b, v1 = a * 0.3 - b * 0.2 + attribute * 0.05 + personality + 70 + abnormal;
      const fraction = a * a * (100 - b * 0.9) * 100 / denominator / divisor;
      const v2 = fraction - (100 - a) * 0.1 + attribute * 0.05 + personality - penalty + abnormal;
      const raw = Math.min(v1, v2), beauty = has(actor, '倾国') && target.members.every(m => m.sex === 'male') ? 2 : 1;
      hit = roll('strategy.hit', raw * beauty, actor, target, 'strategy-success', POLICY.probability, 'ordinary-formula-then-beauty-floor-clip', { actorIntelligence: a, targetIntelligence: b, abnormal, penalty, personality, attribute, denominator, divisor, fraction, v1, v2, rawBeforeBeauty: raw, beautyMultiplier: beauty }, { personalityOwner: target.id, defensePanel: panelName(target) });
    }
    outcome = hit ? 'strategy-succeeded' : 'strategy-failed';
    if (hit) {
      const personality = cmd.action === 'false-report-status' ? { timid: 10, calm: 5, bold: 0, reckless: -5 }[actor.temperament] : { timid: -5, calm: 0, bold: 5, reckless: 10 }[actor.temperament];
      const halfTarget = Math.floor(target.intelligence / 2), q = actor.intelligence + personality - halfTarget, ordinary = Math.max(3, Math.trunc(q / 10));
      const clever = holder(actor, '妙计'), secret = holder(actor, '秘计'), certain = has(actor, '深谋') || clever > target.intelligence || (secret >= 0 && secret < target.intelligence);
      const critical = roll('strategy.critical', certain ? 100 : ordinary, actor, target, 'strategy-critical', POLICY.skillHolder, certain ? 'skill-guaranteed-critical-after-hit' : 'listing-minimum-three-truncation', { actorIntelligence: actor.intelligence, targetIntelligence: target.intelligence, halfTarget, personality, q, ordinaryRate: ordinary, cleverHolder: clever, secretHolder: secret }, { personalityOwner: actor.id, absentSkillSentinel: '-1', shensuan: 'unsupported-composite-skill' });
      const durationRoll = draw('strategy.duration', 100), base = durationRoll < POLICY.statusBaseOneThreshold ? 1 : 2, duration = base + (critical ? 1 : 0);
      step('strategy.duration', 'o01-status', POLICY.status, actor, target, 'ordinary-policy-70-30-plus-critical', true, { roll: durationRoll, rolledBase: base, criticalBonus: critical ? 1 : 0, duration });
      applyStatus(target, cmd.action === 'disturb' ? 'confused' : 'false-report', duration, 'strategy.status');
    }
    step('reaction.eligibility', 'field-policy', POLICY.reactionEligibility, target, actor, 'no-response-to-supported-strategy', false);
  } else {
    let tacticHit = false;
    if (tactic) { const rate = target.status !== 'normal' ? 100 : cmd.action === 'halberd-whirlwind' ? 75 : actor.aptitude === 'S' ? 80 : 75; tacticHit = roll('tactic.hit', rate, actor, target, 'tactic-table', POLICY.coverage, target.status !== 'normal' ? 'abnormal-primary-guarantee' : 'wiki-final-aptitude-table-no-extra-bonus'); if (!tacticHit) outcome = 'tactic-fallback'; }
    else step('ordinary.hit', 'field-policy', 'ordinary-guaranteed-hit-v1', actor, target, 'ordinary-hit-before-shield', true, { rate: 100 }, { rng: 'deterministic-rate-no-draw' });
    const activeTargets = tacticHit ? targetIds : [target.id], coefficient = tacticHit ? cmd.action === 'halberd-whirlwind' ? 33 : 30 : cmd.action === 'normal-arrow' ? 0 : 10;
    for (let i = 0; i < activeTargets.length; i++) physical(actor, startUnit(activeTargets[i]!), tacticHit, coefficient, false, cmd.action === 'normal-arrow', i, 1, 1);
    const responder = unit(target.id), receiving = unit(actor.id);
    const forestRaid = actor.weapon === 'spear' && actor.techniques.includes(2) && from.terrain === 'forest';
    const responseArrow = cmd.action === 'normal-arrow';
    const eligible = responder.status === 'normal' && !forestRaid && (responseArrow ? responder.techniques.includes(9) && arrowLegal(responder, receiving) : range === 1);
    const reason = responder.status !== 'normal' ? 'abnormal-primary-cannot-respond' : forestRaid ? 'spear-forest-raid-no-response' : eligible ? responseArrow ? 'legal-single-response-fire' : 'legal-single-melee-counterattack' : 'no-legal-response-fire';
    step('reaction.eligibility', 'response-fire', POLICY.reactionEligibility, responder, receiving, reason, eligible, { range, maximumResponses: 1 }, { responderActionBudget: 'unchanged', primaryOnly: 'true', sample: 'after-all-active-damage-and-status' });
    if (eligible) {
      const avoided = has(actor, '急袭') ? roll('reaction.avoid', POLICY.raidAvoidanceRate, actor, responder, 'skill-facts', 'raid-whole-reaction-avoidance-v1', 'land-raid-full-reaction-avoidance') : false;
      if (!has(actor, '急袭')) step('reaction.avoid', 'skill-facts', 'raid-whole-reaction-avoidance-v1', actor, responder, 'absent-skill-no-draw', false);
      if (!avoided) physical(responder, receiving, false, responseArrow ? 0 : 10, true, responseArrow, 0, tacticHit ? POLICY.reactionScale.successfulTacticNumerator : POLICY.reactionScale.ordinaryNumerator, tacticHit ? POLICY.reactionScale.successfulTacticDenominator : POLICY.reactionScale.ordinaryDenominator);
    }
  }
  for (const u of snapshot.units) if (u.troops <= 0) fail('unsupported-terminal-effect');
  snapshot.revision++;
  const effects: Effect[] = [...touched].sort(order).map(id => { const old = before.units.find(u => u.id === id)!, now = mutable(id), facts = s.units.find(u => u.id === id)!; return { unitId: id, side: facts.side, cellBefore: old.cellId, cellAfter: now.cellId, troops: numericWrite(old.troops, now.troops), energy: numericWrite(old.energy, now.energy), acted: { before: old.acted, requestedAfter: now.acted, after: now.acted }, status: { before: old.status, requestedKind: requestedKinds.get(id) ?? now.status, after: now.status, remaining: numericWrite(old.remaining, now.remaining, requestedCounts.get(id) ?? now.remaining) } }; });
  // This is only a typed obligation. No food snapshot is accepted or written in the combat kernel.
  const foodRaidRequest:FoodRaidRequest|undefined=deferredFoodRaid && mutable(target.id).troops < target.troops?{eventId:cmd.commandId,actorId:actor.id,targetId:target.id,
    attackPanel:usedPanel(actor).attack,weapon:'spear',techniques:[...actor.techniques],action:'normal-melee'}:undefined;
  const receipt: Receipt = { schemaVersion: 1, profile: PROFILE, policyId: POLICY.id, policyHash: contentHash(POLICY), sourceBoundary: clone(BOUNDARY), command: clone(cmd), episodeId: s.episodeId, round: s.round, revisionBefore: before.revision, revisionAfter: snapshot.revision, stateHashBefore: contentHash(before), stateHashAfter: contentHash(snapshot), actorSide: actor.side, targetSide: target.side, actionStartCellId: actor.cellId, activationCellId: actor.cellId, range, coverage, outcome, steps, draws, rngBefore: before.rngCursor, rngAfter: snapshot.rngCursor, effects, ...(foodRaidRequest?{foodRaidRequest,requiresExternalFoodSettlement:true as const}:{}) };
  return { snapshot, receipt };
}

function append(s: State, cmd: Command): { state: State; receipt: Receipt; duplicate: boolean } {
  const old = s.acceptedCommands.find(entry => entry.command.commandId === cmd.commandId);
  if (old) { if (!same(old.command, cmd)) fail('duplicate-command-id-conflict'); return { state: s, receipt: old.receipt, duplicate: true }; }
  if (cmd.expectedRevision !== s.snapshot.revision) fail('stale-revision'); if (s.acceptedCommands.length >= MAX_HISTORY) fail('history-limit');
  const next = resolve(s.genesis.scenario, s.snapshot, cmd);
  return { state: { ...s, snapshot: next.snapshot, acceptedCommands: [...s.acceptedCommands, { command: clone(cmd), receipt: next.receipt }] }, receipt: next.receipt, duplicate: false };
}
function budgetSave(state: State): Exclude<SaveResult, Failure> { budget(state); const result = { ok: true as const, json: canonical(state) }; budget(result); return result; }
/** Reserve each historical retry's complete wrapper, not merely the newest/largest-looking receipt.
 * History is at most 64 because this fixed episode has at most 64 actors and no acted reset. */
function budgetAllRetries(state: State): void { for (const entry of state.acceptedCommands) { budget({ ok: true, committed: false, duplicate: true, state, receipt: entry.receipt }); budget({ ok: true, committed: false, duplicate: true, receipt: entry.receipt, projectedSnapshot: state.snapshot }); } }
function executeDetached(s: State, cmd: Command): Exclude<CommandResult, Failure> {
  const next = append(s, cmd), result = { ok: true as const, committed: !next.duplicate, duplicate: next.duplicate, state: next.state, receipt: next.receipt };
  budget(result); budgetSave(next.state); budgetAllRetries(next.state);
  budget({ ok: true, committed: false, duplicate: next.duplicate, receipt: next.receipt, projectedSnapshot: next.state.snapshot });
  return result;
}
function reconstruct(v: unknown): State {
  const r = object(v, ['tag', 'schemaVersion', 'profile', 'policy', 'sourceBoundary', 'genesis', 'snapshot', 'acceptedCommands']);
  if (r.tag !== TAG || r.schemaVersion !== 1 || r.profile !== PROFILE) fail('unsupported-profile'); if (!same(r.policy, POLICY)) fail('policy-mismatch'); if (!same(r.sourceBoundary, BOUNDARY)) fail('source-boundary-mismatch');
  const genesis = object(r.genesis, ['scenario', 'snapshot']); let s = initialState(scenario(genesis.scenario)); budget({ ok: true, state: s }); budgetSave(s);
  if (!same(genesis.scenario, s.genesis.scenario)) fail('noncanonical-genesis'); if (!same(genesis.snapshot, s.snapshot)) fail('genesis-snapshot-mismatch');
  for (const [i, value] of list(r.acceptedCommands, MAX_HISTORY).entries()) {
    try { const entry = object(value, ['command', 'receipt']), cmd = command(entry.command); if (!same(entry.command, cmd)) fail('noncanonical-command'); const next = executeDetached(s, cmd); if (next.duplicate) fail('duplicate-accepted-entry'); if (!same(entry.receipt, next.receipt)) fail('receipt-mismatch'); s = next.state; }
    catch (e) { const f = failure(e); fail(f.reason, i); }
  }
  if (!same(r.snapshot, s.snapshot)) fail('snapshot-mismatch'); budget(s); budgetSave(s); budgetAllRetries(s); return s;
}
/** Freeze only detached output. Callers supply facts and a registered complete policy, never outcomes. */
export function createFieldCombatStateV1(input: unknown): FieldCombatStateResultV1 { try { const state = initialState(scenario(detach(input))), result: StateResult = { ok: true, state }; budget(result); budgetSave(state); return freeze(result); } catch (e) { return freeze(failure(e)); } }
function safeCommandId(v: unknown): string | null { try { if (v === null || typeof v !== 'object') return null; const d = Object.getOwnPropertyDescriptor(v, 'commandId'); return d && Object.hasOwn(d, 'value') && typeof d.value === 'string' && /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,63}$/.test(d.value) ? d.value : null; } catch { return null; } }
function commandResult(input: unknown, rawCommand: unknown): CommandResult {
  let state: State | null = null; const commandId = safeCommandId(rawCommand);
  try { state = reconstruct(detach(input)); const cmd = command(detach(rawCommand)); return executeDetached(state, cmd); }
  catch (e) { return failure(e, state?.snapshot ?? null, commandId); }
}
/** Pure transaction. A caller adopts the returned state only when ok; rejection has equal snapshots. */
export function executeFieldCombatV1(input: unknown, rawCommand: unknown): FieldCombatCommandResultV1 { return freeze(commandResult(input, rawCommand)); }
/** Same reducer, complete result/save/retry gates and draw ordering as execute; no external RNG. */
export function previewFieldCombatV1(input: unknown, rawCommand: unknown): FieldCombatPreviewResultV1 {
  const result = commandResult(input, rawCommand); if (!result.ok) return freeze(result);
  return freeze({ ok: true as const, committed: false as const, duplicate: result.duplicate, receipt: result.receipt, projectedSnapshot: result.state.snapshot });
}
export function saveFieldCombatV1(input: unknown): FieldCombatSaveResultV1 { try { return freeze(budgetSave(reconstruct(detach(input)))); } catch (e) { return freeze(failure(e)); } }
export function loadFieldCombatV1(json: unknown): FieldCombatStateResultV1 { try { const state = reconstruct(parseJson(json)), result: StateResult = { ok: true, state }; budget(result); budgetSave(state); return freeze(result); } catch (e) { return freeze(failure(e)); } }
/** Reconstruct every accepted command and every full receipt; expected outcomes are assertions only. */
export function replayFieldCombatV1(input: unknown): FieldCombatReplayResultV1 {
  try {
    const r = object(detach(input), ['tag', 'scenario', 'attempts', 'expectedFinalSnapshot']); if (r.tag !== TRACE_TAG) fail('unsupported-profile');
    let state = initialState(scenario(r.scenario)); budget({ ok: true, state }); budgetSave(state); const outcomes: ExpectedOutcome[] = [];
    for (const [i, value] of list(r.attempts, MAX_ATTEMPTS).entries()) {
      try {
        const attempt = object(value, ['command', 'expectedOutcome']); let outcome: ExpectedOutcome, nextState = state;
        try { const result = executeDetached(state, command(attempt.command)); nextState = result.state; outcome = { ok: true, duplicate: result.duplicate, receipt: result.receipt }; }
        catch (e) { outcome = failure(e, state.snapshot, safeCommandId(attempt.command)); }
        if (attempt.expectedOutcome !== null && !same(attempt.expectedOutcome, outcome)) fail('trace-outcome-mismatch'); state = nextState; outcomes.push(outcome);
      } catch (e) { const f = failure(e); fail(f.reason, i); }
    }
    if (r.expectedFinalSnapshot !== null && !same(r.expectedFinalSnapshot, state.snapshot)) fail('trace-snapshot-mismatch');
    const result: ReplayResult = { ok: true, state, outcomes }; budget(result); budgetSave(state); budgetAllRetries(state); return freeze(result);
  } catch (e) { return freeze(failure(e)); }
}

