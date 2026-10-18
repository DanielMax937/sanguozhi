/** Independent supplied-arrival ruin/temple discovery. No native movement or ownership writes. */
import policyData from '../../../data/catalogs/adjacent-site-discovery-policy-v1.json' with { type: 'json' };

type Frozen<T> = T extends object ? { readonly [K in keyof T]: Frozen<T[K]> } : T;
const PROFILE = 'standalone-adjacent-site-discovery-v1' as const;
const SCOPE = 'one-fixed-force-frozen-arrival-events' as const;
const TAG = 'adjacent-site-discovery-state-v1' as const, TRACE_TAG = 'adjacent-site-discovery-trace-v1' as const;
const MAX_BYTES = 16_777_216, MAX_NODES = 1_048_576, MAX_DEPTH = 24, MAX_ARRAY = 4096;
const MAX_HISTORY = 4096, MAX_ATTEMPTS = 4096;
type DateV1 = { year: number; month: number; day: 1 | 11 | 21 };
type Position = { q: number; r: number };
type Policy = typeof policyData;
type Talents = { leadership: number; strength: number; intelligence: number; politics: number; charm: number };
type Aptitudes = { spear: number; halberd: number; crossbow: number; cavalry: number; siege: number; navy: number };
type RuinReward = { kind: 'talent'; field: keyof Talents } | { kind: 'aptitude'; field: keyof Aptitudes };
type Actor = { id: string; forceId: string; ordinary: true; merit: number; charmXp: number; talents: Talents; aptitudes: Aptitudes; skillRef: string | null };
type Unit = { id: string; forceId: string; memberIds: string[]; leaderId: string; resolvedCharmU8: number; troops: number; position: Position };
type InitialSource = { sourceId: string; templeOrdinal: number | null };
type Site = { id: string; kind: 'ruin' | 'temple'; position: Position; discovered: boolean; resolved: boolean; initialSource: InitialSource | null };
type Arrival = { arrivalId: string; unitId: string; from: Position; to: Position; date: DateV1 };
type GuideCatalog = { id: string; version: 1; namespace: 'supplied-guide-v1'; sourceIdentity: { kind: 'supplied-guide-reference' | 'synthetic-example'; reference: string }; skills: { id: string; name: string }[]; standardPool: string[]; highestPool: string[] };
type Scenario = { schemaVersion: 1; profile: typeof PROFILE; scope: typeof SCOPE; date: DateV1; activeForceId: string; actors: Actor[]; units: Unit[]; sites: Site[]; groundCells: Position[]; arrivals: Arrival[]; guideCatalog: GuideCatalog; rng: { kind: 'adjacent-lcg32-multiply-high-v1'; seed: number }; policy: Policy };
type ActorState = { id: string; charmXp: number; talents: Talents; aptitudes: Aptitudes; skillRef: string | null };
type Discovery = { siteId: string; kind: 'ruin' | 'temple'; origin: 'supplied-initial' | 'arrival'; sourceId: string | null; commandId: string | null; arrivalId: string | null; unitId: string | null; date: DateV1 | null; templeOrdinal: number | null };
type SiteState = { id: string; discovered: boolean; resolved: boolean; discovery: Discovery | null };
type PendingBase = { siteId: string; commandId: string; arrivalId: string; unitId: string; date: DateV1 };
type Pending = (PendingBase & { kind: 'ruin'; month: number; reward: RuinReward }) | (PendingBase & { kind: 'temple'; templeOrdinal: number; offerSkillIds: string[] });
type RngState = { state: number; drawCount: number };
type Snapshot = { revision: number; cursor: number; date: DateV1; actors: ActorState[]; units: { id: string; position: Position }[]; sites: SiteState[]; pending: Pending | null; rng: RngState };
type Command = { type: 'ProcessNextArrival' } | { type: 'ResolveRuin'; siteId: string; targetId: string } | { type: 'ResolveTemple'; siteId: string; targetId: string; skillId: string };
type Envelope = { id: string; expectedRevision: number; command: Command };
type Draw = { drawIndex: number; label: 'site-selector' | 'discovery-roll' | 'temple-offer'; bound: number; beforeState: number; afterState: number; value: number };
type Credit = { before: number; requested: number; actual: number; discarded: number; after: number };
type ArrivalEvaluation = { arrival: Arrival; observationBefore: Position; observationAfter: Position; eligibility: { leaderId: string; leaderMerit: number; resolvedCharmU8: number; troops: number; passed: boolean; reasons: string[] }; rawSiteIds: string[]; eligibleSiteIds: string[]; excluded: { id: string; distance: number; reasons: string[] }[]; selectedSiteId: string | null; roll: number | null };
type RuinWrite = { targetId: string; reward: RuinReward; value: Credit };
type TempleWrite = { targetId: string; beforeSkillRef: string | null; requestedSkillId: string; afterSkillRef: string; requestedReplacements: 1; actualReplacements: 0 | 1; discardedReplacements: 0 | 1; relearned: boolean };
const BOUNDARY = {
  serviceEvidence: 'synthetic-replaceable-policy', eligibilityAndMonthTableEvidence: 'guide-observation',
  guideCatalogIdentity: 'supplied-reference-not-authenticated-native-table', provisional: true,
  originalDiscoveryProbabilityRecovered: false, originalCoordinatesRecovered: false,
  originalSkillPoolsRecovered: false, originalWritersCertified: false, stockOrCrossVersionCertified: false,
  sourceArrivalProvesNativeMovement: false, originalRandomStreamEquivalent: false, strictlyUnbiased: false,
  ownershipFrozen: true, resolvedAbilitiesRecomputed: false, trainingXpAndAllowanceChanged: false,
  citySearchLedgerShared: false, oldCorpusExecutionEnabledChanged: false,
  original43GroupsReduced: false, original45SnapshotReduced: false,
} as const;
const UNSUPPORTED = ['native-movement', 'pathfinding', 'movement-points', 'terrain-cost', 'food-cost', 'native-site-placement', 'native-skill98-catalog', 'city-search', 'city-events', 'native-personnel-transfer', 'native-ownership', 'capture', 'force-extinction', 'ruler-succession', 'native-mission-return-finalizers', 'shared-service-ledgers', 'native-saves', 'global-end-turn'] as const;
type Receipt = { schemaVersion: 1; profile: typeof PROFILE; scope: typeof SCOPE; commandId: string; envelope: Envelope; policyId: string; sourceBoundary: typeof BOUNDARY; revisionBefore: number; revisionAfter: number; cursorBefore: number; cursorAfter: number; dateBefore: DateV1; dateAfter: DateV1; outcome: 'arrival-no-discovery' | 'ruin-discovered' | 'temple-discovered' | 'ruin-resolved' | 'temple-resolved'; arrival: ArrivalEvaluation | null; discovery: Discovery | null; pendingBefore: Pending | null; pendingAfter: Pending | null; rewards: { charmXp: { actorId: string; value: Credit }[]; ruin: RuinWrite | null; temple: TempleWrite | null }; eventLedger: { actionPointsDelta: 0; goldDelta: 0; techniquePointsDelta: 0; meritDelta: 0 }; rngBefore: RngState; rngAfter: RngState; draws: Draw[] };
type State = { tag: typeof TAG; schemaVersion: 1; profile: typeof PROFILE; scope: typeof SCOPE; policy: Policy; sourceBoundary: typeof BOUNDARY; genesis: { scenario: Scenario; snapshot: Snapshot }; snapshot: Snapshot; acceptedCommands: { envelope: Envelope; receipt: Receipt }[] };
type Failure = { ok: false; committed: false; reason: string; revision: number | null; cursor: number | null; commandId: string | null; index: number | null };
type StateResult = { ok: true; state: State } | Failure;
type CommandResult = { ok: true; committed: boolean; duplicate: boolean; state: State; receipt: Receipt } | Failure;
type PreviewResult = { ok: true; committed: false; duplicate: boolean; receipt: Receipt; projectedSnapshot: Snapshot } | Failure;
type SaveResult = { ok: true; json: string } | Failure;
type ExpectedOutcome = { ok: true; duplicate: boolean; receipt: Receipt } | Failure;
type Trace = { tag: typeof TRACE_TAG; scenario: Scenario; attempts: { envelope: Envelope; expectedOutcome: ExpectedOutcome | null }[]; expectedFinalSnapshot: Snapshot | null };
type ReplayResult = { ok: true; state: State; outcomes: ExpectedOutcome[] } | Failure;
export type AdjacentSiteDiscoveryScenarioV1 = Frozen<Scenario>;
export type AdjacentSiteDiscoveryStateV1 = Frozen<State>;
export type AdjacentSiteDiscoverySnapshotV1 = Frozen<Snapshot>;
export type AdjacentSiteDiscoveryCommandV1 = Frozen<Command>;
export type AdjacentSiteDiscoveryEnvelopeV1 = Frozen<Envelope>;
export type AdjacentSiteDiscoveryPolicyV1 = Frozen<Policy>;
export type AdjacentSiteDiscoveryGuideCatalogV1 = Frozen<GuideCatalog>;
export type AdjacentSiteDiscoveryRecordV1 = Frozen<Discovery>;
export type AdjacentSiteDiscoveryPendingV1 = Frozen<Pending>;
export type AdjacentSiteDiscoveryDrawV1 = Frozen<Draw>;
export type AdjacentSiteDiscoveryReceiptV1 = Frozen<Receipt>;
export type AdjacentSiteDiscoveryFailureV1 = Frozen<Failure>;
export type AdjacentSiteDiscoveryStateResultV1 = Frozen<StateResult>;
export type AdjacentSiteDiscoveryCommandResultV1 = Frozen<CommandResult>;
export type AdjacentSiteDiscoveryPreviewResultV1 = Frozen<PreviewResult>;
export type AdjacentSiteDiscoverySaveResultV1 = Frozen<SaveResult>;
export type AdjacentSiteDiscoveryTraceV1 = Frozen<Trace>;
export type AdjacentSiteDiscoveryReplayResultV1 = Frozen<ReplayResult>;

class Invalid extends Error {
  readonly reason: string; readonly index: number | null;
  constructor(reason: string, index: number | null = null) { super(reason); this.reason = reason; this.index = index; }
}
function fail(reason: string, index: number | null = null): never { throw new Invalid(reason, index); }
function failure(e: unknown, snapshot: Pick<Snapshot, 'revision' | 'cursor'> | null = null, commandId: string | null = null): Failure {
  return { ok: false, committed: false, reason: e instanceof Invalid ? e.reason : 'invalid-input', revision: snapshot?.revision ?? null, cursor: snapshot?.cursor ?? null, commandId, index: e instanceof Invalid ? e.index : null };
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
export const ADJACENT_SITE_DISCOVERY_POLICY_REGISTRY_V1 = freeze([clone(POLICY)]);
export const ADJACENT_SITE_DISCOVERY_DEFAULT_POLICY_V1 = freeze(POLICY);
export const ADJACENT_SITE_DISCOVERY_EVIDENCE_V1 = freeze(BOUNDARY);
export const ADJACENT_SITE_DISCOVERY_UNSUPPORTED_V1 = freeze(UNSUPPORTED);
const order = (a: string, b: string): number => a < b ? -1 : a > b ? 1 : 0;
const MONTH_REWARDS: readonly RuinReward[] = [
  { kind: 'aptitude', field: 'cavalry' }, { kind: 'talent', field: 'leadership' },
  { kind: 'aptitude', field: 'crossbow' }, { kind: 'talent', field: 'strength' },
  { kind: 'aptitude', field: 'siege' }, { kind: 'talent', field: 'charm' },
  { kind: 'aptitude', field: 'navy' }, { kind: 'talent', field: 'intelligence' },
  { kind: 'aptitude', field: 'spear' }, { kind: 'talent', field: 'politics' },
  { kind: 'aptitude', field: 'halberd' }, { kind: 'talent', field: 'charm' },
];
function unique<T>(items: T[]): void { if (new Set(items).size !== items.length) fail('duplicate-id'); }
function oneOf<T extends string>(v: unknown, allowed: readonly T[]): T { if (typeof v !== 'string' || !allowed.includes(v as T)) fail('invalid-enum'); return v as T; }
function textValue(v: unknown, max: number): string { if (typeof v !== 'string' || v.length < 1 || v.length > max || !v.trim()) fail('invalid-text'); return v; }
function skillId(v: unknown): string { const result = id(v); if (!/^guide:[A-Za-z0-9][A-Za-z0-9_.:-]*$/.test(result)) fail('unsupported-skill-namespace'); return result; }
function position(v: unknown): Position { const r = object(v, ['q', 'r']); return { q: uint(r.q, POLICY.geometry.coordinateMagnitude, -POLICY.geometry.coordinateMagnitude), r: uint(r.r, POLICY.geometry.coordinateMagnitude, -POLICY.geometry.coordinateMagnitude) }; }
function positionKey(p: Position): string { return p.q + ',' + p.r; }
function distance(a: Position, b: Position): number { const dq = a.q - b.q, dr = a.r - b.r; return Math.max(Math.abs(dq), Math.abs(dr), Math.abs(dq + dr)); }
function dateIndex(d: DateV1): number { return (d.year - 1) * 36 + (d.month - 1) * 3 + (d.day - 1) / 10; }
function talents(v: unknown): Talents { const r = object(v, ['leadership', 'strength', 'intelligence', 'politics', 'charm']); return { leadership: uint(r.leadership, 255), strength: uint(r.strength, 255), intelligence: uint(r.intelligence, 255), politics: uint(r.politics, 255), charm: uint(r.charm, 255) }; }
function aptitudes(v: unknown): Aptitudes { const r = object(v, ['spear', 'halberd', 'crossbow', 'cavalry', 'siege', 'navy']); return { spear: uint(r.spear, 3), halberd: uint(r.halberd, 3), crossbow: uint(r.crossbow, 3), cavalry: uint(r.cavalry, 3), siege: uint(r.siege, 3), navy: uint(r.navy, 3) }; }
function guideCatalog(v: unknown): GuideCatalog {
  const r = object(v, ['id', 'version', 'namespace', 'sourceIdentity', 'skills', 'standardPool', 'highestPool']);
  if (r.version !== 1 || r.namespace !== 'supplied-guide-v1') fail('unsupported-guide-catalog');
  const source = object(r.sourceIdentity, ['kind', 'reference']);
  const sourceIdentity: GuideCatalog['sourceIdentity'] = { kind: oneOf(source.kind, ['supplied-guide-reference', 'synthetic-example'] as const), reference: textValue(source.reference, 2048) };
  const skills = list(r.skills, POLICY.limits.skills).map(x => { const s = object(x, ['id', 'name']); return { id: skillId(s.id), name: textValue(s.name, 128) }; });
  const standardPool = list(r.standardPool, POLICY.limits.skills).map(skillId), highestPool = list(r.highestPool, POLICY.limits.skills).map(skillId);
  unique(skills.map(s => s.id)); unique([...standardPool, ...highestPool]);
  if (!standardPool.length || !highestPool.length || standardPool.length + highestPool.length > POLICY.limits.skills) fail('invalid-skill-pools');
  const known = new Set(skills.map(s => s.id));
  if ([...standardPool, ...highestPool].some(s => !known.has(s))) fail('unknown-skill');
  skills.sort((a, b) => order(a.id, b.id)); standardPool.sort(order); highestPool.sort(order);
  return { id: id(r.id), version: 1, namespace: 'supplied-guide-v1', sourceIdentity, skills, standardPool, highestPool };
}
function scenario(v: unknown): Scenario {
  const r = object(v, ['schemaVersion', 'profile', 'scope', 'date', 'activeForceId', 'actors', 'units', 'sites', 'groundCells', 'arrivals', 'guideCatalog', 'rng', 'policy']);
  if (r.schemaVersion !== 1 || r.profile !== PROFILE || r.scope !== SCOPE) fail('unsupported-profile');
  if (!same(r.policy, POLICY)) fail('policy-mismatch');
  const d = date(r.date), activeForceId = id(r.activeForceId), catalog = guideCatalog(r.guideCatalog);
  const knownSkills = new Set(catalog.skills.map(s => s.id));
  const actors: Actor[] = list(r.actors, POLICY.limits.actors).map(x => {
    const a = object(x, ['id', 'forceId', 'ordinary', 'merit', 'charmXp', 'talents', 'aptitudes', 'skillRef']);
    if (a.ordinary !== true) fail('unsupported-actor');
    const actor: Actor = { id: id(a.id), forceId: id(a.forceId), ordinary: true, merit: uint(a.merit, POLICY.rewards.meritMaximum), charmXp: uint(a.charmXp, POLICY.rewards.charmXpCap), talents: talents(a.talents), aptitudes: aptitudes(a.aptitudes), skillRef: a.skillRef === null ? null : skillId(a.skillRef) };
    if (actor.forceId !== activeForceId || (actor.skillRef !== null && !knownSkills.has(actor.skillRef))) fail('inconsistent-actor');
    return actor;
  });
  unique(actors.map(a => a.id)); const actorIds = new Set(actors.map(a => a.id));
  const units: Unit[] = list(r.units, POLICY.limits.units).map(x => {
    const u = object(x, ['id', 'forceId', 'memberIds', 'leaderId', 'resolvedCharmU8', 'troops', 'position']);
    const memberIds = list(u.memberIds, POLICY.limits.membersPerUnit).map(id); unique(memberIds); memberIds.sort(order);
    const unit: Unit = { id: id(u.id), forceId: id(u.forceId), memberIds, leaderId: id(u.leaderId), resolvedCharmU8: uint(u.resolvedCharmU8, 255), troops: uint(u.troops, POLICY.eligibility.troopsMaximum, POLICY.eligibility.troopsMinimum), position: position(u.position) };
    if (!memberIds.length || unit.forceId !== activeForceId || !memberIds.includes(unit.leaderId) || memberIds.some(a => !actorIds.has(a))) fail('inconsistent-unit');
    return unit;
  });
  if (!units.length) fail('invalid-unit-count'); unique(units.map(u => u.id)); unique(units.flatMap(u => u.memberIds));
  const sites: Site[] = list(r.sites, POLICY.limits.sites).map(x => {
    const s = object(x, ['id', 'kind', 'position', 'discovered', 'resolved', 'initialSource']);
    let initialSource: InitialSource | null = null;
    if (s.initialSource !== null) { const source = object(s.initialSource, ['sourceId', 'templeOrdinal']); initialSource = { sourceId: id(source.sourceId), templeOrdinal: source.templeOrdinal === null ? null : uint(source.templeOrdinal, POLICY.limits.sites, 1) }; }
    const site: Site = { id: id(s.id), kind: oneOf(s.kind, ['ruin', 'temple'] as const), position: position(s.position), discovered: bool(s.discovered), resolved: bool(s.resolved), initialSource };
    if (site.discovered !== site.resolved || site.discovered !== (initialSource !== null)) fail('invalid-initial-site-state');
    if (initialSource !== null && ((site.kind === 'temple') !== (initialSource.templeOrdinal !== null))) fail('invalid-initial-site-source');
    return site;
  });
  unique(sites.map(s => s.id)); unique(sites.map(s => positionKey(s.position)));
  unique(sites.flatMap(s => s.initialSource === null ? [] : [s.initialSource.sourceId]));
  const initialTempleOrdinals = sites.filter(s => s.kind === 'temple' && s.discovered).map(s => s.initialSource!.templeOrdinal!).sort((a, b) => a - b);
  if (initialTempleOrdinals.some((n, i) => n !== i + 1)) fail('invalid-initial-temple-order');
  const groundCells = list(r.groundCells, POLICY.limits.groundCells).map(position);
  unique(groundCells.map(positionKey)); const ground = new Set(groundCells.map(positionKey));
  if (units.some(u => !ground.has(positionKey(u.position))) || sites.some(s => ground.has(positionKey(s.position)))) fail('invalid-ground-placement');
  const arrivals: Arrival[] = list(r.arrivals, POLICY.limits.arrivals).map(x => {
    const a = object(x, ['arrivalId', 'unitId', 'from', 'to', 'date']);
    return { arrivalId: id(a.arrivalId), unitId: id(a.unitId), from: position(a.from), to: position(a.to), date: date(a.date) };
  });
  unique(arrivals.map(a => a.arrivalId));
  const positions = new Map(units.map(u => [u.id, u.position])); const unitDates = new Map<string, number>(); let lastDate = dateIndex(d);
  for (const a of arrivals) {
    const previous = positions.get(a.unitId), time = dateIndex(a.date);
    if (!previous || !same(previous, a.from) || !ground.has(positionKey(a.from)) || !ground.has(positionKey(a.to)) || distance(a.from, a.to) !== 1) fail('invalid-arrival-path');
    if (time < lastDate || time <= (unitDates.get(a.unitId) ?? -1)) fail('invalid-arrival-date');
    positions.set(a.unitId, a.to); unitDates.set(a.unitId, time); lastDate = time;
  }
  actors.sort((a, b) => order(a.id, b.id)); units.sort((a, b) => order(a.id, b.id)); sites.sort((a, b) => order(a.id, b.id)); groundCells.sort((a, b) => a.q - b.q || a.r - b.r);
  const rng = object(r.rng, ['kind', 'seed']); if (rng.kind !== POLICY.rng.kind) fail('policy-mismatch');
  return { schemaVersion: 1, profile: PROFILE, scope: SCOPE, date: d, activeForceId, actors, units, sites, groundCells, arrivals, guideCatalog: catalog, rng: { kind: 'adjacent-lcg32-multiply-high-v1', seed: uint(rng.seed, 4_294_967_295) }, policy: clone(POLICY) };
}
function envelope(v: unknown): Envelope {
  const r = object(v, ['id', 'expectedRevision', 'command']);
  const commandId = id(r.id), expectedRevision = uint(r.expectedRevision, MAX_HISTORY);
  if (r.command === null || typeof r.command !== 'object' || Array.isArray(r.command)) fail('invalid-input');
  const kind = (r.command as Record<string, unknown>).type; let command: Command;
  if (kind === 'ProcessNextArrival') { object(r.command, ['type']); command = { type: 'ProcessNextArrival' }; }
  else if (kind === 'ResolveRuin') { const c = object(r.command, ['type', 'siteId', 'targetId']); command = { type: 'ResolveRuin', siteId: id(c.siteId), targetId: id(c.targetId) }; }
  else if (kind === 'ResolveTemple') { const c = object(r.command, ['type', 'siteId', 'targetId', 'skillId']); command = { type: 'ResolveTemple', siteId: id(c.siteId), targetId: id(c.targetId), skillId: skillId(c.skillId) }; }
  else fail('unsupported-command');
  return { id: commandId, expectedRevision, command };
}
function initialState(s: Scenario): State {
  const sites: SiteState[] = s.sites.map((site): SiteState => ({ id: site.id, discovered: site.discovered, resolved: site.resolved, discovery: site.initialSource === null ? null : { siteId: site.id, kind: site.kind, origin: 'supplied-initial', sourceId: site.initialSource.sourceId, commandId: null, arrivalId: null, unitId: null, date: null, templeOrdinal: site.initialSource.templeOrdinal } }));
  const snapshot: Snapshot = { revision: 0, cursor: 0, date: clone(s.date), actors: s.actors.map(a => ({ id: a.id, charmXp: a.charmXp, talents: clone(a.talents), aptitudes: clone(a.aptitudes), skillRef: a.skillRef })), units: s.units.map(u => ({ id: u.id, position: clone(u.position) })), sites, pending: null, rng: { state: s.rng.seed, drawCount: 0 } };
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
function credit(before: number, requested: number, cap: number): Credit { const actual = Math.min(requested, cap - before); return { before, requested, actual, discarded: requested - actual, after: before + actual }; }
function resolve(s: Scenario, before: Snapshot, env: Envelope): { snapshot: Snapshot; receipt: Receipt } {
  const after = clone(before), draws: Draw[] = [], c = env.command;
  let outcome: Receipt['outcome'] = 'arrival-no-discovery', arrival: ArrivalEvaluation | null = null, discovery: Discovery | null = null;
  const rewards: Receipt['rewards'] = { charmXp: [], ruin: null, temple: null };
  if (c.type === 'ProcessNextArrival') {
    if (before.pending !== null) fail('pending-reward');
    const fact = s.arrivals[before.cursor]; if (!fact) fail('arrival-limit');
    const unit = s.units.find(u => u.id === fact.unitId)!, observed = after.units.find(u => u.id === fact.unitId)!;
    if (!same(observed.position, fact.from) || distance(fact.from, fact.to) !== 1 || dateIndex(fact.date) < dateIndex(before.date)) fail('arrival-state-inconsistency');
    const leader = s.actors.find(a => a.id === unit.leaderId)!;
    const reasons: string[] = [];
    if (leader.merit < s.policy.eligibility.leaderMeritMinimum) reasons.push('leader-merit-below-minimum');
    if (unit.resolvedCharmU8 < s.policy.eligibility.resolvedUnitCharmMinimum) reasons.push('unit-charm-below-minimum');
    if (unit.troops < s.policy.eligibility.troopsMinimum) reasons.push('no-troops');
    arrival = { arrival: clone(fact), observationBefore: clone(observed.position), observationAfter: clone(fact.to), eligibility: { leaderId: unit.leaderId, leaderMerit: leader.merit, resolvedCharmU8: unit.resolvedCharmU8, troops: unit.troops, passed: reasons.length === 0, reasons }, rawSiteIds: s.sites.map(site => site.id), eligibleSiteIds: [], excluded: [], selectedSiteId: null, roll: null };
    for (const site of s.sites) {
      const current = before.sites.find(x => x.id === site.id)!, d = distance(fact.to, site.position), excluded: string[] = [];
      if (current.discovered) excluded.push('already-discovered');
      if (d !== s.policy.geometry.requiredDistance) excluded.push('not-adjacent');
      if (reasons.length) excluded.push('unit-ineligible');
      if (excluded.length) arrival.excluded.push({ id: site.id, distance: d, reasons: excluded }); else arrival.eligibleSiteIds.push(site.id);
    }
    observed.position = clone(fact.to); after.cursor++; after.date = clone(fact.date);
    const n = arrival.eligibleSiteIds.length;
    if (n > 0) {
      const chosen = n === 1 ? 0 : draw(after.rng, n, 'site-selector', draws);
      arrival.selectedSiteId = arrival.eligibleSiteIds[chosen]!;
      arrival.roll = draw(after.rng, s.policy.selection.rollBound, 'discovery-roll', draws);
      if (arrival.roll < s.policy.selection.successBelow) {
        const site = s.sites.find(x => x.id === arrival!.selectedSiteId)!, stateSite = after.sites.find(x => x.id === site.id)!;
        const templeOrdinal = site.kind === 'temple' ? before.sites.filter(x => x.discovery?.kind === 'temple').length + 1 : null;
        discovery = { siteId: site.id, kind: site.kind, origin: 'arrival', sourceId: null, commandId: env.id, arrivalId: fact.arrivalId, unitId: unit.id, date: clone(fact.date), templeOrdinal };
        stateSite.discovered = true; stateSite.discovery = discovery;
        for (const actorId of unit.memberIds) {
          const actor = after.actors.find(a => a.id === actorId)!;
          const value = credit(actor.charmXp, s.policy.rewards.discoveryCharmXpPerMember, s.policy.rewards.charmXpCap);
          actor.charmXp = value.after; rewards.charmXp.push({ actorId, value });
        }
        const common: PendingBase = { siteId: site.id, commandId: env.id, arrivalId: fact.arrivalId, unitId: unit.id, date: clone(fact.date) };
        if (site.kind === 'ruin') {
          outcome = 'ruin-discovered'; after.pending = { ...common, kind: 'ruin', month: fact.date.month, reward: clone(MONTH_REWARDS[fact.date.month - 1]!) };
        } else {
          const pool = [...s.guideCatalog.standardPool, ...(templeOrdinal! >= s.policy.temple.highestPoolFromOrdinal ? s.guideCatalog.highestPool : [])].sort(order), offerSkillIds: string[] = [];
          while (pool.length && offerSkillIds.length < s.policy.temple.maximumOffers) {
            const selected = pool.length === 1 ? 0 : draw(after.rng, pool.length, 'temple-offer', draws);
            offerSkillIds.push(pool.splice(selected, 1)[0]!);
          }
          outcome = 'temple-discovered'; after.pending = { ...common, kind: 'temple', templeOrdinal: templeOrdinal!, offerSkillIds };
        }
      }
    }
  } else {
    const pending = before.pending;
    if (pending === null) fail('no-pending-reward');
    if (pending.siteId !== c.siteId || (pending.kind === 'ruin' ? c.type !== 'ResolveRuin' : c.type !== 'ResolveTemple')) fail('pending-reward-mismatch');
    const target = after.actors.find(a => a.id === c.targetId); if (!target) fail('unknown-target');
    const site = after.sites.find(x => x.id === pending.siteId)!;
    if (!site.discovered || site.resolved) fail('site-state-inconsistency');
    if (pending.kind === 'ruin' && c.type === 'ResolveRuin') {
      const reward = pending.reward; let value: Credit;
      if (reward.kind === 'talent') { value = credit(target.talents[reward.field], s.policy.ruin.requestedIncrement, s.policy.ruin.talentCap); target.talents[reward.field] = value.after; }
      else { value = credit(target.aptitudes[reward.field], s.policy.ruin.requestedIncrement, s.policy.ruin.aptitudeCap); target.aptitudes[reward.field] = value.after; }
      rewards.ruin = { targetId: target.id, reward: clone(reward), value }; outcome = 'ruin-resolved';
    } else if (pending.kind === 'temple' && c.type === 'ResolveTemple') {
      if (!pending.offerSkillIds.includes(c.skillId)) fail('skill-not-offered');
      const relearned = target.skillRef === c.skillId;
      rewards.temple = { targetId: target.id, beforeSkillRef: target.skillRef, requestedSkillId: c.skillId, afterSkillRef: c.skillId, requestedReplacements: 1, actualReplacements: relearned ? 0 : 1, discardedReplacements: relearned ? 1 : 0, relearned };
      target.skillRef = c.skillId; outcome = 'temple-resolved';
    } else fail('pending-reward-mismatch');
    site.resolved = true; after.pending = null;
  }
  if (draws.length > s.policy.rng.maxDrawsPerArrival) fail('rng-draw-budget');
  after.revision++;
  const receipt: Receipt = { schemaVersion: 1, profile: PROFILE, scope: SCOPE, commandId: env.id, envelope: clone(env), policyId: s.policy.id, sourceBoundary: clone(BOUNDARY), revisionBefore: before.revision, revisionAfter: after.revision, cursorBefore: before.cursor, cursorAfter: after.cursor, dateBefore: clone(before.date), dateAfter: clone(after.date), outcome, arrival, discovery: clone(discovery), pendingBefore: clone(before.pending), pendingAfter: clone(after.pending), rewards, eventLedger: { actionPointsDelta: 0, goldDelta: 0, techniquePointsDelta: 0, meritDelta: 0 }, rngBefore: clone(before.rng), rngAfter: clone(after.rng), draws };
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
/** Reserve all old-ID results before accepting a later command, including a smaller resolution.
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
/** Creation validates and freezes the entire supplied arrival sequence, roster, sites and guide catalog. */
export function createAdjacentSiteDiscoveryStateV1(input: unknown): AdjacentSiteDiscoveryStateResultV1 {
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
export function executeAdjacentSiteDiscoveryV1(input: unknown, rawCommand: unknown): AdjacentSiteDiscoveryCommandResultV1 { return freeze(commandResult(input, rawCommand)); }
/** Identical command/save budget gate, followed by the complete preview-output budget gate. */
export function previewAdjacentSiteDiscoveryV1(input: unknown, rawCommand: unknown): AdjacentSiteDiscoveryPreviewResultV1 {
  const result = commandResult(input, rawCommand); if (!result.ok) return freeze(result);
  try { const preview: PreviewResult = { ok: true, committed: false, duplicate: result.duplicate, receipt: result.receipt, projectedSnapshot: result.state.snapshot }; budget(preview); return freeze(preview); }
  catch (e) { return freeze(failure(e, result.duplicate ? result.state.snapshot : { revision: result.receipt.revisionBefore, cursor: result.receipt.cursorBefore }, result.receipt.commandId)); }
}
export function saveAdjacentSiteDiscoveryV1(input: unknown): AdjacentSiteDiscoverySaveResultV1 {
  try { return freeze(budgetSave(reconstruct(detach(input)))); } catch (e) { return freeze(failure(e)); }
}
export function loadAdjacentSiteDiscoveryV1(json: unknown): AdjacentSiteDiscoveryStateResultV1 {
  try { const state = reconstruct(parseJson(json)); const result: StateResult = { ok: true, state }; budget(result); budgetSave(state); return freeze(result); } catch (e) { return freeze(failure(e)); }
}
/** Expected outcomes assert the full derived results; they cannot provide success, rolls or rewards. */
export function replayAdjacentSiteDiscoveryV1(input: unknown): AdjacentSiteDiscoveryReplayResultV1 {
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
