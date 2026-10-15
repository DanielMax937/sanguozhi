/** Finite detached terrain/status/empty-cell-fire lifecycle; no native world writers. */
type Frozen<T> = T extends object ? { readonly [K in keyof T]: Frozen<T[K]> } : T;
type Mutable<T> = T extends object ? { -readonly [K in keyof T]: Mutable<T[K]> } : T;
// Optional Node intrinsic rejects proxies before reflection; browsers accept plain data only.
const runtime = globalThis as { process?: { getBuiltinModule?: (id: string) => { types: { isProxy(value: unknown): boolean } } } };
const isProxy = typeof runtime.process?.getBuiltinModule === 'function'
  ? runtime.process.getBuiltinModule('node:util').types.isProxy : (() => false);
const MAX_BYTES = 1048576, MAX_ITEMS = 4096, U32 = 0xffffffff;
class Invalid extends Error { readonly reason: 'invalid-input' | 'unsupported-fire-damage'; constructor(reason: 'invalid-input' | 'unsupported-fire-damage' = 'invalid-input') { super(reason); this.reason = reason; } }
function invalid(): never { throw new Invalid(); }
function freeze<T>(v: T): Frozen<T> { if (v !== null && typeof v === 'object') { for (const x of Object.values(v)) freeze(x); Object.freeze(v); } return v as Frozen<T>; }
function bytes(s: string): number { let n = 0; for (const c of s) { const p = c.codePointAt(0)!; n += p < 128 ? 1 : p < 2048 ? 2 : p < 65536 ? 3 : 4; } return n; }
/** Exact JSON-size accounting and bounded depth before accessing schema fields. */
function detach(value: unknown): unknown {
  let used = 0; const active = new Set<object>();
  const spend = (n: number): void => { used += n; if (used > MAX_BYTES) invalid(); };
  function visit(v: unknown, depth: number): unknown {
    if (depth > 64) invalid();
    if (v === null || typeof v === 'boolean' || typeof v === 'string') { if (typeof v === 'string' && v.length > MAX_BYTES) invalid(); spend(bytes(JSON.stringify(v))); return v; }
    if (typeof v === 'number') { if (!Number.isFinite(v) || Object.is(v, -0)) invalid(); spend(String(v).length); return v; }
    if (typeof v !== 'object' || isProxy(v) || active.has(v)) invalid();
    const a = Array.isArray(v), proto = Object.getPrototypeOf(v);
    if (proto !== (a ? Array.prototype : Object.prototype) && !(proto === null && !a)) invalid();
    active.add(v);
    try {
      const ds = Object.getOwnPropertyDescriptors(v), keys = Reflect.ownKeys(ds);
      if (keys.some(k => typeof k !== 'string' || !('value' in ds[k]!) || (!ds[k]!.enumerable && !(a && k === 'length')))) invalid();
      spend(2);
      if (a) {
        const n = ds.length!.value as number; if (n > MAX_ITEMS || keys.length !== n + 1) invalid(); const out: unknown[] = [];
        for (let i = 0; i < n; i++) { const d = ds[String(i)]; if (!d) invalid(); if (i) spend(1); out.push(visit(d.value, depth + 1)); } return out;
      }
      const out: Record<string, unknown> = {}; let i = 0;
      for (const k of keys as string[]) { spend(bytes(JSON.stringify(k)) + 1 + (i++ ? 1 : 0)); Object.defineProperty(out, k, { value: visit(ds[k]!.value, depth + 1), enumerable: true, writable: true, configurable: true }); }
      return out;
    } finally { active.delete(v); }
  }
  return visit(value, 0);
}
function record(v: unknown, fields: readonly string[]): Record<string, unknown> { if (!v || typeof v !== 'object' || Array.isArray(v)) invalid(); const r = v as Record<string, unknown>; if (Object.keys(r).length !== fields.length || fields.some(k => !Object.hasOwn(r, k))) invalid(); return r; }
function uint(v: unknown, max = U32, min = 0): number { if (typeof v !== 'number' || !Number.isInteger(v) || v < min || v > max) invalid(); return v; }
function id(v: unknown): string { if (typeof v !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(v)) invalid(); return v; }
function bool(v: unknown): void { if (typeof v !== 'boolean') invalid(); }
function arr(v: unknown, max = MAX_ITEMS): unknown[] { if (!Array.isArray(v) || v.length > max) invalid(); return v; }
function oneOf<T extends string | number | boolean>(v: unknown, values: readonly T[]): T { if (!values.includes(v as T)) invalid(); return v as T; }
function canonical(v: unknown): string { if (v === null || typeof v !== 'object') return JSON.stringify(v); if (Array.isArray(v)) return '[' + v.map(canonical).join(',') + ']'; const r = v as Record<string, unknown>; return '{' + Object.keys(r).sort().map(k => JSON.stringify(k) + ':' + canonical(r[k])).join(',') + '}'; }
function equal(a: unknown, b: unknown): boolean { return canonical(a) === canonical(b); }
function clone<T>(v: T): Mutable<T> { return JSON.parse(JSON.stringify(v)) as Mutable<T>; }
const SOURCES = ['strategy', 'fire-arrow', 'fire-trap', 'lightning', 'scripted-event'] as const;
export type HazardFireSource = typeof SOURCES[number];
export type HazardStatus = 'normal' | 'confused' | 'false-report';
export type HazardWeightedFireProfile = { readonly kind: 'weighted'; readonly weights: readonly { readonly turns: number; readonly weight: number }[]; readonly drawBound: 100; readonly criticalBonus: 1 };
export type HazardFixedFireProfile = { readonly kind: 'fixed'; readonly turns: number; readonly criticalBonus: 1 };
export type HazardFireProfile = HazardWeightedFireProfile | HazardFixedFireProfile;
export type HazardPolicy = {
  readonly id: string; readonly version: 1; readonly terrain: 'pk11-entry-100-200-v1'; readonly statusInitial: { readonly mode: 'ordinary-threshold-plus-one-v1'; readonly threshold: number };
  readonly statusRefresh: 'max-v1'; readonly recovery: 'pk-qualified-any-step-v1'; readonly statusBehavior: 'confused-consume-action-false-report-reject-v1';
  readonly lifetimeBySource: Readonly<Record<Exclude<HazardFireSource, 'scripted-event'>, HazardWeightedFireProfile>> & { readonly 'scripted-event': HazardFixedFireProfile }; readonly reignition: 'max-remaining-latest-source-v1'; readonly phase: 'ignite-before-end-resolution-v1';
  readonly naturalSpread: false; readonly fatalTerrain: 'reject-all-v1'; readonly fireExposure: 'empty-only-reject-v1';
};
function weighted(): HazardWeightedFireProfile { return { kind: 'weighted', weights: [{ turns: 1, weight: 70 }, { turns: 2, weight: 30 }], drawBound: 100, criticalBonus: 1 }; }
export const DETACHED_HAZARD_POLICY: Frozen<HazardPolicy> = freeze({ id: 'o01-detached-pk-reference-policy-v1', version: 1, terrain: 'pk11-entry-100-200-v1', statusInitial: { mode: 'ordinary-threshold-plus-one-v1', threshold: 70 }, statusRefresh: 'max-v1', recovery: 'pk-qualified-any-step-v1', statusBehavior: 'confused-consume-action-false-report-reject-v1', lifetimeBySource: { strategy: weighted(), 'fire-arrow': weighted(), 'fire-trap': weighted(), lightning: weighted(), 'scripted-event': { kind: 'fixed', turns: 2, criticalBonus: 1 } }, reignition: 'max-remaining-latest-source-v1', phase: 'ignite-before-end-resolution-v1', naturalSpread: false, fatalTerrain: 'reject-all-v1', fireExposure: 'empty-only-reject-v1' });
export type HazardCell = { readonly id: string; readonly terrainInfoU32: number; readonly adjacent: readonly string[]; readonly blocked: boolean; readonly unsupportedContext: boolean };
export type HazardFire = { readonly cellId: string; readonly source: HazardFireSource; readonly remaining: number };
export type HazardState = {
  readonly schema: 'san11-detached-hazard-state-v1'; readonly revision: number; readonly turn: number; readonly phase: 'orders' | 'resolved'; readonly map: { readonly id: string; readonly cells: readonly HazardCell[] };
  readonly unit: { readonly id: string; readonly cellId: string; readonly troops: number; readonly energy: number; readonly acted: boolean; readonly status: HazardStatus; readonly remaining: number };
  readonly traits: { readonly traverse: boolean; readonly antidote: boolean; readonly difficultMarch: boolean }; readonly defenseTier: 3 | 4 | 5;
  readonly auras: readonly { readonly id: string; readonly facilityTier: 3 | 4 | 5; readonly eligible: boolean; readonly coveredCells: readonly string[] }[]; readonly fires: readonly HazardFire[];
  readonly rng: { readonly kind: 'bounded-tape-v1'; readonly draws: readonly { readonly bound: 2 | 100 | 200; readonly value: number }[]; readonly cursor: number }; readonly policy: HazardPolicy;
};
export type HazardCommand = { readonly expectedRevision: number } & ({ readonly type: 'enterCells'; readonly path: readonly string[] } | { readonly type: 'applyStatus'; readonly kind: 'confused' | 'false-report'; readonly critical: boolean } | { readonly type: 'calm'; readonly critical: boolean } | { readonly type: 'igniteCell'; readonly cellId: string; readonly source: HazardFireSource; readonly critical: boolean } | { readonly type: 'resolveTurn' | 'beginTurn' });
type StatusValue = { readonly kind: HazardStatus; readonly remaining: number };
export type HazardEffect =
  | { readonly type: 'entry'; readonly index: number; readonly from: string; readonly to: string; readonly terrain: number; readonly immune: boolean; readonly drawIndex: number | null; readonly requestedDamage: number; readonly actualDamage: number; readonly troopsBefore: number; readonly troopsAfter: number; readonly energyBefore: number; readonly energyAfter: number }
  | { readonly type: 'statusApplied'; readonly old: StatusValue; readonly new: StatusValue; readonly rolledBase: number; readonly criticalBonus: number; readonly drawIndex: number }
  | { readonly type: 'actionConsumed'; readonly status: 'confused'; readonly actedBefore: false; readonly actedAfter: true }
  | { readonly type: 'statusCounted'; readonly auraIds: readonly string[]; readonly step: number; readonly before: number; readonly after: number }
  | { readonly type: 'statusCleared'; readonly old: StatusValue; readonly cause: 'calm' | 'countdown' }
  | { readonly type: 'calmed'; readonly old: StatusValue; readonly new: StatusValue; readonly changed: boolean }
  | { readonly type: 'fireIgnited' | 'fireRefreshed'; readonly cellId: string; readonly old: HazardFire | null; readonly new: HazardFire; readonly rolledBase: number; readonly criticalBonus: number; readonly drawIndex: number | null }
  | { readonly type: 'fireCounted'; readonly cellId: string; readonly source: HazardFireSource; readonly before: number; readonly after: number }
  | { readonly type: 'fireExtinguished'; readonly cellId: string; readonly source: HazardFireSource }
  | { readonly type: 'turnOpened'; readonly before: number; readonly after: number; readonly actedBefore: boolean; readonly actedAfter: false };
export type HazardFailureReason = 'stale-revision' | 'revision-overflow' | 'turn-overflow' | 'out-of-phase' | 'empty-path' | 'unit-unavailable' | 'missing-cell' | 'nonadjacent' | 'blocked' | 'unsupported-context' | 'unsupported-fire-damage' | 'unsupported-lethal-damage' | 'unsupported-status-replacement' | 'unsupported-retreat' | 'unsupported-calm-area' | 'rng-exhausted' | 'rng-bound-mismatch';
type ReceiptCommon = { before: HazardState; after: HazardState; command: HazardCommand; policySnapshot: HazardPolicy; rngBefore: number; rngAfter: number; revisionBefore: number; revisionAfter: number };
export type HazardSuccessReceipt = Frozen<ReceiptCommon & { ok: true; effects: HazardEffect[] }>;
export type HazardFailureReceipt = Frozen<ReceiptCommon & { ok: false; reason: HazardFailureReason; failedIndex: number | null; effects: [] }>;
export type HazardInputFailure = Frozen<{ ok: false; reason: 'invalid-input' | 'unsupported-fire-damage' }>;
export type HazardCommandResult = HazardSuccessReceipt | HazardFailureReceipt | HazardInputFailure;
export type HazardStateResult = Frozen<{ ok: true; state: HazardState }> | HazardInputFailure;
export type HazardTrace = { readonly schema: 'san11-detached-hazard-trace-v1'; readonly initial: HazardState; readonly policySnapshot: HazardPolicy; readonly commands: readonly HazardCommand[]; readonly receipts: readonly HazardSuccessReceipt[]; readonly finalState: HazardState };
export type HazardReplayResult = Frozen<{ ok: true; state: HazardState; receipts: HazardSuccessReceipt[] } | { ok: false; reason: 'replay-mismatch'; failedIndex: number | null }> | HazardInputFailure;
function policy(v: unknown): HazardPolicy {
  const p = record(v, ['id', 'version', 'terrain', 'statusInitial', 'statusRefresh', 'recovery', 'statusBehavior', 'lifetimeBySource', 'reignition', 'phase', 'naturalSpread', 'fatalTerrain', 'fireExposure']); id(p.id); oneOf(p.version, [1]);
  for (const k of ['terrain', 'statusRefresh', 'recovery', 'statusBehavior', 'reignition', 'phase', 'naturalSpread', 'fatalTerrain', 'fireExposure'] as const) if (p[k] !== DETACHED_HAZARD_POLICY[k]) invalid();
  const s = record(p.statusInitial, ['mode', 'threshold']); oneOf(s.mode, ['ordinary-threshold-plus-one-v1']); uint(s.threshold, 99, 1);
  const profiles = record(p.lifetimeBySource, SOURCES);
  for (const source of SOURCES) {
    const f = record(profiles[source], source === 'scripted-event' ? ['kind', 'turns', 'criticalBonus'] : ['kind', 'weights', 'drawBound', 'criticalBonus']); oneOf(f.criticalBonus, [1]);
    if (source === 'scripted-event') { oneOf(f.kind, ['fixed']); uint(f.turns, 254, 1); }
    else { oneOf(f.kind, ['weighted']); oneOf(f.drawBound, [100]); const ws = arr(f.weights, 100); if (!ws.length) invalid(); let last = 0, total = 0;
      for (const value of ws) { const w = record(value, ['turns', 'weight']), t = uint(w.turns, 254, 1); if (t <= last) invalid(); last = t; total += uint(w.weight, 100, 1); } if (total !== 100) invalid(); }
  }
  if (p.id === DETACHED_HAZARD_POLICY.id && !equal(p, DETACHED_HAZARD_POLICY)) invalid(); return p as unknown as HazardPolicy;
}
function uniqueIds(v: unknown, allowed?: Set<string>): string[] { const list = arr(v, 256).map(id); if (new Set(list).size !== list.length || (allowed && list.some(x => !allowed.has(x)))) invalid(); return list; }
function state(v: unknown): HazardState {
  const r = record(v, ['schema', 'revision', 'turn', 'phase', 'map', 'unit', 'traits', 'defenseTier', 'auras', 'fires', 'rng', 'policy']); oneOf(r.schema, ['san11-detached-hazard-state-v1']); uint(r.revision); uint(r.turn); oneOf(r.phase, ['orders', 'resolved']);
  const m = record(r.map, ['id', 'cells']); id(m.id); const cells = arr(m.cells, 256); if (!cells.length) invalid(); const ids = new Set<string>(); let previous = '';
  for (const value of cells) { const c = record(value, ['id', 'terrainInfoU32', 'adjacent', 'blocked', 'unsupportedContext']), key = id(c.id); if (key <= previous) invalid(); previous = key; ids.add(key); uint(c.terrainInfoU32); bool(c.blocked); bool(c.unsupportedContext); uniqueIds(c.adjacent); }
  for (const value of cells) uniqueIds((value as HazardCell).adjacent, ids);
  const u = record(r.unit, ['id', 'cellId', 'troops', 'energy', 'acted', 'status', 'remaining']); id(u.id); id(u.cellId); if (!ids.has(u.cellId as string)) invalid(); uint(u.troops, 1000000, 1); uint(u.energy, 255); bool(u.acted); oneOf(u.status, ['normal', 'confused', 'false-report']); uint(u.remaining, 255); if ((u.status === 'normal') !== (u.remaining === 0)) invalid();
  const current = (cells as unknown as HazardCell[]).find(c => c.id === u.cellId)!; if (current.blocked || current.unsupportedContext) invalid();
  const t = record(r.traits, ['traverse', 'antidote', 'difficultMarch']); Object.values(t).forEach(bool); oneOf(r.defenseTier, [3, 4, 5]); const auraIds = new Set<string>();
  for (const value of arr(r.auras, 256)) { const a = record(value, ['id', 'facilityTier', 'eligible', 'coveredCells']), key = id(a.id); if (auraIds.has(key)) invalid(); auraIds.add(key); oneOf(a.facilityTier, [3, 4, 5]); bool(a.eligible); uniqueIds(a.coveredCells, ids); }
  previous = ''; let occupiedFire = false;
  for (const value of arr(r.fires, 256)) { const f = record(value, ['cellId', 'source', 'remaining']), key = id(f.cellId); if (!ids.has(key) || key <= previous) invalid(); previous = key; oneOf(f.source, SOURCES); uint(f.remaining, 255, 1); if (key === u.cellId) occupiedFire = true; const cell = (cells as unknown as HazardCell[]).find(c => c.id === key)!; if (cell.blocked || cell.unsupportedContext) invalid(); }
  const g = record(r.rng, ['kind', 'draws', 'cursor']); oneOf(g.kind, ['bounded-tape-v1']); const draws = arr(g.draws); uint(g.cursor, draws.length);
  for (const value of draws) { const d = record(value, ['bound', 'value']); const bound = oneOf(d.bound, [2, 100, 200]); uint(d.value, bound - 1); }
  policy(r.policy); if (occupiedFire) throw new Invalid('unsupported-fire-damage'); return r as unknown as HazardState;
}
function command(v: unknown): HazardCommand {
  const c = v as Record<string, unknown>; if (!c || typeof c !== 'object' || Array.isArray(c)) invalid(); const type = oneOf(c.type, ['enterCells', 'applyStatus', 'calm', 'igniteCell', 'resolveTurn', 'beginTurn']);
  const fields = type === 'enterCells' ? ['path'] : type === 'applyStatus' ? ['kind', 'critical'] : type === 'calm' ? ['critical'] : type === 'igniteCell' ? ['cellId', 'source', 'critical'] : [];
  record(c, ['type', 'expectedRevision', ...fields]); uint(c.expectedRevision); if (type === 'enterCells') arr(c.path).forEach(id); if (type === 'applyStatus') oneOf(c.kind, ['confused', 'false-report']); if (type === 'applyStatus' || type === 'calm' || type === 'igniteCell') bool(c.critical); if (type === 'igniteCell') { id(c.cellId); oneOf(c.source, SOURCES); } return c as unknown as HazardCommand;
}
function inputFailure(e: unknown): HazardInputFailure {
  let reason: 'invalid-input' | 'unsupported-fire-damage' = 'invalid-input';
  try { if (!isProxy(e) && e instanceof Invalid) reason = e.reason; } catch { /* An unsupported host object must not escape the boundary. */ }
  return freeze({ ok: false as const, reason });
}
/** Validate a complete supplied snapshot; freeze only returned data. */
export function createHazardState(input: unknown): HazardStateResult { try { return freeze({ ok: true as const, state: state(detach(input)) }); } catch (e) { return inputFailure(e); } }
class Rejected extends Error { readonly reason: HazardFailureReason; readonly index: number | null; constructor(reason: HazardFailureReason, index: number | null = null) { super(reason); this.reason = reason; this.index = index; } }
function reduce(before: HazardState, cmd: HazardCommand): HazardSuccessReceipt | HazardFailureReceipt {
  const after = clone(before), effects: HazardEffect[] = []; let index: number | null = null;
  const reject = (reason: HazardFailureReason): never => { throw new Rejected(reason, index); };
  const draw = (bound: 100 | 200): { value: number; index: number } => { const i = after.rng.cursor, d = after.rng.draws[i]; if (!d) reject('rng-exhausted'); if (d!.bound !== bound) reject('rng-bound-mismatch'); after.rng.cursor++; return { value: d!.value, index: i }; };
  const statusValue = (): StatusValue => ({ kind: after.unit.status, remaining: after.unit.remaining });
  try {
    if (cmd.expectedRevision !== before.revision) reject('stale-revision'); if (before.revision === U32) reject('revision-overflow'); if (before.phase !== (cmd.type === 'beginTurn' ? 'resolved' : 'orders')) reject('out-of-phase');
    const u = after.unit, p = after.policy;
    if (cmd.type === 'enterCells') {
      if (!cmd.path.length) reject('empty-path'); if (u.status !== 'normal' || u.acted) reject('unit-unavailable'); const cells = new Map(after.map.cells.map(c => [c.id, c]));
      for (let i = 0; i < cmd.path.length; i++) {
        index = i; const to = cmd.path[i]!, cell = cells.get(to); if (!cell) reject('missing-cell'); if (!cells.get(u.cellId)!.adjacent.includes(to)) reject('nonadjacent');
        if (cell!.blocked) reject('blocked'); if (cell!.unsupportedContext) reject('unsupported-context'); if (after.fires.some(f => f.cellId === to)) reject('unsupported-fire-damage');
        const terrain = cell!.terrainInfoU32 & 31;
        const immune = (terrain === 11 && (after.traits.traverse || after.traits.difficultMarch)) || (terrain === 4 && after.traits.antidote);
        let requestedDamage = 0, drawIndex: number | null = null;
        if (!immune && (terrain === 11 || terrain === 4)) { const d = draw(200); drawIndex = d.index; requestedDamage = (terrain === 11 ? 100 : 200) + d.value; }
        if (requestedDamage >= u.troops) reject('unsupported-lethal-damage');
        const troopsBefore = u.troops, energyBefore = u.energy, from = u.cellId; u.troops -= requestedDamage; u.cellId = to;
        effects.push({ type: 'entry', index: i, from, to, terrain, immune, drawIndex, requestedDamage, actualDamage: requestedDamage, troopsBefore, troopsAfter: u.troops, energyBefore, energyAfter: u.energy });
      }
    } else if (cmd.type === 'applyStatus') {
      if (u.status !== 'normal' && u.status !== cmd.kind) reject('unsupported-status-replacement');
      const d = draw(100), old = statusValue(), rolledBase = d.value < p.statusInitial.threshold ? 1 : 2, criticalBonus = cmd.critical ? 1 : 0;
      u.status = cmd.kind; u.remaining = Math.max(u.remaining, rolledBase + criticalBonus);
      effects.push({ type: 'statusApplied', old, new: statusValue(), rolledBase, criticalBonus, drawIndex: d.index });
    } else if (cmd.type === 'calm') {
      if (cmd.critical) reject('unsupported-calm-area'); const old = statusValue(); u.status = 'normal'; u.remaining = 0;
      effects.push({ type: 'calmed', old, new: statusValue(), changed: old.kind !== 'normal' }); if (old.kind !== 'normal') effects.push({ type: 'statusCleared', old, cause: 'calm' });
    } else if (cmd.type === 'igniteCell') {
      const cell = after.map.cells.find(c => c.id === cmd.cellId); if (!cell) reject('missing-cell'); if (cell!.blocked) reject('blocked'); if (cell!.unsupportedContext) reject('unsupported-context'); if (u.cellId === cmd.cellId) reject('unsupported-fire-damage');
      const profile = p.lifetimeBySource[cmd.source]; let rolledBase = 0, drawIndex: number | null = null;
      if (profile.kind === 'fixed') rolledBase = profile.turns;
      else { const d = draw(profile.drawBound); drawIndex = d.index; let cumulative = 0; for (const w of profile.weights) { cumulative += w.weight; if (d.value < cumulative) { rolledBase = w.turns; break; } } }
      const old = clone(after.fires.find(f => f.cellId === cmd.cellId) ?? null), criticalBonus = cmd.critical ? profile.criticalBonus : 0;
      const next: HazardFire = { cellId: cmd.cellId, source: cmd.source, remaining: Math.max(old?.remaining ?? 0, rolledBase + criticalBonus) };
      after.fires = [...after.fires.filter(f => f.cellId !== cmd.cellId), clone(next)].sort((a, b) => a.cellId < b.cellId ? -1 : a.cellId > b.cellId ? 1 : 0);
      effects.push({ type: old ? 'fireRefreshed' : 'fireIgnited', cellId: cmd.cellId, old, new: next, rolledBase, criticalBonus, drawIndex });
    } else if (cmd.type === 'resolveTurn') {
      if (u.status === 'false-report' && !u.acted) reject('unsupported-retreat');
      if (u.status === 'confused' && !u.acted) { u.acted = true; effects.push({ type: 'actionConsumed', status: 'confused', actedBefore: false, actedAfter: true }); }
      if (u.status !== 'normal') {
        const old = statusValue(), auraIds = after.auras.filter(a => a.eligible && a.facilityTier === after.defenseTier && a.coveredCells.includes(u.cellId)).map(a => a.id).sort();
        const step = auraIds.length ? 2 : 1; u.remaining = Math.max(0, u.remaining - step);
        effects.push({ type: 'statusCounted', auraIds, step, before: old.remaining, after: u.remaining });
        if (u.remaining === 0) { u.status = 'normal'; effects.push({ type: 'statusCleared', old, cause: 'countdown' }); }
      }
      for (const f of after.fires) { const previous = f.remaining; f.remaining--; effects.push({ type: 'fireCounted', cellId: f.cellId, source: f.source, before: previous, after: f.remaining }); if (f.remaining === 0) effects.push({ type: 'fireExtinguished', cellId: f.cellId, source: f.source }); }
      after.fires = after.fires.filter(f => f.remaining > 0); after.phase = 'resolved';
    } else {
      if (after.turn === U32) reject('turn-overflow'); const previous = after.turn, actedBefore = u.acted; after.turn++; u.acted = false; after.phase = 'orders'; effects.push({ type: 'turnOpened', before: previous, after: after.turn, actedBefore, actedAfter: false });
    }
    after.revision++;
    return freeze({ ok: true as const, before, after, command: cmd, policySnapshot: clone(before.policy), rngBefore: before.rng.cursor, rngAfter: after.rng.cursor, effects, revisionBefore: before.revision, revisionAfter: after.revision });
  } catch (e) {
    if (!(e instanceof Rejected)) throw e;
    return freeze({ ok: false as const, reason: e.reason, failedIndex: e.index, before, after: clone(before), command: cmd, policySnapshot: clone(before.policy), effects: [] as [], rngBefore: before.rng.cursor, rngAfter: before.rng.cursor, revisionBefore: before.revision, revisionAfter: before.revision });
  }
}
/** Pure transaction: callers adopt `after` only on success. Failures have no committed effects. */
export function executeHazardCommand(input: unknown, intent: unknown): HazardCommandResult { try { const pair = detach([input, intent]) as unknown[]; return reduce(state(pair[0]), command(pair[1])); } catch (e) { return inputFailure(e); } }
/** Exactly the same reducer and boundary checks as execution; no global commit exists. */
export function previewHazardCommand(input: unknown, intent: unknown): HazardCommandResult { return executeHazardCommand(input, intent); }
export function saveHazardState(input: unknown): Frozen<{ ok: true; json: string }> | HazardInputFailure { try { const s = state(detach(input)); return freeze({ ok: true as const, json: canonical(s) }); } catch (e) { return inputFailure(e); } }
export function loadHazardState(input: unknown): HazardStateResult {
  try { if (typeof input !== 'string' || input.length > MAX_BYTES || bytes(input) > MAX_BYTES) invalid(); let parsed: unknown; try { parsed = JSON.parse(input); } catch { invalid(); } return freeze({ ok: true as const, state: state(detach(parsed)) }); } catch (e) { return inputFailure(e); }
}
/** Receipts are comparisons, never instructions. Policy identity and full payload remain fixed. */
export function replayHazardTrace(input: unknown): HazardReplayResult {
  try {
    const t = record(detach(input), ['schema', 'initial', 'policySnapshot', 'commands', 'receipts', 'finalState']); oneOf(t.schema, ['san11-detached-hazard-trace-v1']);
    const initial = state(t.initial), snapshot = policy(t.policySnapshot), commands = arr(t.commands).map(command), expected = arr(t.receipts), finalState = state(t.finalState);
    const mismatch = (failedIndex: number | null): HazardReplayResult => freeze({ ok: false as const, reason: 'replay-mismatch' as const, failedIndex });
    if (expected.length !== commands.length || !equal(snapshot, initial.policy) || !equal(snapshot, finalState.policy)) return mismatch(null);
    let current = initial; const receipts: HazardSuccessReceipt[] = [];
    for (let i = 0; i < commands.length; i++) { const result = reduce(current, commands[i]!); if (!result.ok || !equal(result, expected[i])) return mismatch(i); receipts.push(result); current = result.after; }
    if (!equal(current, finalState)) return mismatch(null); return freeze({ ok: true as const, state: current, receipts });
  } catch (e) { return inputFailure(e); }
}
