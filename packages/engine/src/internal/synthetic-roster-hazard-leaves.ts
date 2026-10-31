import { readSyntheticEnergyCaps, type SyntheticEnergyCaps } from './synthetic-energy-cap-context.ts';
/** Stateless positive roster projections; the enclosing world owns all history and commits. */
import { createHazardState, executeHazardCommand, DETACHED_HAZARD_POLICY } from '../terrain-hazard-lifecycle.ts';
import { createInferredMultiRockfall, executeInferredMultiRockfall } from '../inferred-multi-rockfall.ts';
const fail = (reason: string) => Object.freeze({ ok: false as const, reason });
const uint = (v: unknown, max: number): v is number => typeof v === 'number' && Number.isSafeInteger(v) && !Object.is(v, -0) && v >= 0 && v <= max;
const record = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === 'object' && !Array.isArray(v);
const keys = (v: Record<string, unknown>, expected: readonly string[]) => Object.keys(v).length === expected.length && expected.every(k => Object.hasOwn(v, k));
const id = (v: unknown): v is string => typeof v === 'string' && /^synthetic-[a-z0-9-]{1,48}$/.test(v);
function frozen<T>(value: T): Readonly<T> {
  if (value !== null && typeof value === 'object') { for (const item of Object.values(value)) frozen(item); Object.freeze(value); }
  return value;
}
const runtime = globalThis as { process?: { getBuiltinModule?: (id: string) => { types: { isProxy(v: unknown): boolean } } } };
const isProxy = typeof runtime.process?.getBuiltinModule === 'function' ? runtime.process.getBuiltinModule('node:util').types.isProxy : (() => false);
function detach(input: unknown): unknown {
  let nodes = 0, chars = 0; const active = new Set<object>();
  const invalid = (): never => { throw new Error('invalid-data'); };
  function visit(value: unknown, depth: number): unknown {
    if (++nodes > 10000 || depth > 12) return invalid();
    if (value === null || typeof value === 'boolean') return value;
    if (typeof value === 'number') return uint(value, Number.MAX_SAFE_INTEGER) ? value : invalid();
    if (typeof value === 'string') { chars += value.length; return chars <= 100000 ? value : invalid(); }
    if (typeof value !== 'object' || isProxy(value) || active.has(value)) return invalid();
    const array = Array.isArray(value), proto = Object.getPrototypeOf(value);
    if (proto !== (array ? Array.prototype : Object.prototype) && !(proto === null && !array)) return invalid();
    const descriptors = Object.getOwnPropertyDescriptors(value), names = Reflect.ownKeys(descriptors);
    if (names.some(name => typeof name !== 'string' || !Object.hasOwn(descriptors[name]!, 'value')
      || (!descriptors[name]!.enumerable && !(array && name === 'length')))) return invalid();
    active.add(value);
    try {
      if (array) {
        const length = descriptors.length!.value as number;
        if (!uint(length, 256) || names.length !== length + 1) return invalid();
        const result: unknown[] = [];
        for (let i = 0; i < length; i++) { const descriptor = descriptors[String(i)]; if (!descriptor) return invalid(); result.push(visit(descriptor.value, depth + 1)); }
        return result;
      }
      if (names.length > 16) return invalid();
      const result: Record<string, unknown> = {};
      for (const name of names as string[]) Object.defineProperty(result, name, { value: visit(descriptors[name]!.value, depth + 1), enumerable: true });
      return result;
    } finally { active.delete(value); }
  }
  return visit(input, 0);
}






type Unit = { id: string; cellId: string; troops: number; energy: number; acted: boolean; status: 'normal' | 'confused' | 'false-report'; remaining: number };
type Cell = { id: string; terrainInfoU32: number; adjacent: string[]; blocked: boolean; unsupportedContext: boolean; facilityPresent: boolean };
type Context = { map: { id: string; cells: Cell[] }; roster: Unit[]; activeFireCellIds: string[] };
function context(v: Record<string, unknown>, energyCaps?: SyntheticEnergyCaps): Context | undefined {
  if (!record(v.map) || !keys(v.map, ['id', 'cells']) || !id(v.map.id) || !Array.isArray(v.map.cells) || v.map.cells.length < 1 || v.map.cells.length > 16
    || !Array.isArray(v.roster) || v.roster.length < 1 || v.roster.length > 8 || !Array.isArray(v.activeFireCellIds)
    || v.activeFireCellIds.length > 16 || !v.activeFireCellIds.every(id) || new Set(v.activeFireCellIds).size !== v.activeFireCellIds.length) return undefined;
  const cells: Cell[] = [], roster: Unit[] = [];
  for (const c of v.map.cells) {
    if (!record(c) || !keys(c, ['id', 'terrainInfoU32', 'adjacent', 'blocked', 'unsupportedContext', 'facilityPresent'])
      || !id(c.id) || cells.some(x => x.id === c.id) || !uint(c.terrainInfoU32, 0xffffffff)
      || !Array.isArray(c.adjacent) || c.adjacent.length > 16 || !c.adjacent.every(id) || new Set(c.adjacent).size !== c.adjacent.length
      || c.adjacent.includes(c.id) || typeof c.blocked !== 'boolean' || typeof c.unsupportedContext !== 'boolean' || typeof c.facilityPresent !== 'boolean') return undefined;
    cells.push({ id: c.id, terrainInfoU32: c.terrainInfoU32, adjacent: [...c.adjacent], blocked: c.blocked, unsupportedContext: c.unsupportedContext, facilityPresent: c.facilityPresent });
  }
  if (cells.some(c => c.adjacent.some(edge => !cells.some(x => x.id === edge))) || v.activeFireCellIds.some(f => !cells.some(c => c.id === f))) return undefined;
  for (const u of v.roster) {
    if (!record(u) || !keys(u, ['id', 'cellId', 'troops', 'energy', 'acted', 'status', 'remaining']) || !id(u.id) || !id(u.cellId)
      || roster.some(x => x.id === u.id || x.cellId === u.cellId) || !cells.some(c => c.id === u.cellId && !c.blocked && !c.unsupportedContext && !c.facilityPresent)
      || !uint(u.troops, 1000000) || u.troops === 0 || !uint(u.energy, energyCaps?.get(u.id as string) ?? 100) || typeof u.acted !== 'boolean'
      || !['normal', 'confused', 'false-report'].includes(u.status as string) || !uint(u.remaining, 3)
      || ((u.status === 'normal') !== (u.remaining === 0))) return undefined;
    roster.push({ id: u.id, cellId: u.cellId, troops: u.troops, energy: u.energy, acted: u.acted, status: u.status as Unit['status'], remaining: u.remaining });
  }
  if (energyCaps && (energyCaps.size !== roster.length || roster.some(u => !energyCaps.has(u.id)))) return undefined;
  return { map: { id: v.map.id, cells }, roster, activeFireCellIds: [...v.activeFireCellIds] };
}
function hazard(c: Context, u: Unit, traits: { traverse: boolean; antidote: boolean; difficultMarch: boolean }, draws: { bound: 100 | 200; value: number }[], turn = 0) {
  return createHazardState({ schema: 'san11-detached-hazard-state-v1', revision: 0, turn, phase: 'orders',
    map: { id: c.map.id, cells: [...c.map.cells].sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0).map(x => ({ id: x.id, terrainInfoU32: x.terrainInfoU32, adjacent: x.adjacent,
      blocked: x.blocked || x.facilityPresent, unsupportedContext: x.unsupportedContext })) }, unit: u,
    traits, defenseTier: 3, auras: [], fires: [], rng: { kind: 'bounded-tape-v1', draws, cursor: 0 }, policy: DETACHED_HAZARD_POLICY });
}
const noTraits = { traverse: false, antidote: false, difficultMarch: false };
function terrain(input: unknown, energyCaps?: SyntheticEnergyCaps) {
  if (!record(input) || !keys(input, ['map', 'roster', 'activeFireCellIds', 'actorId', 'traits', 'path', 'draws']) || !id(input.actorId)
    || !record(input.traits) || !keys(input.traits, ['traverse', 'antidote', 'difficultMarch'])
    || typeof input.traits.traverse !== 'boolean' || typeof input.traits.antidote !== 'boolean' || typeof input.traits.difficultMarch !== 'boolean'
    || !Array.isArray(input.path) || input.path.length < 1 || input.path.length > 16 || !input.path.every(id)
    || !Array.isArray(input.draws) || input.draws.length > 16 || !input.draws.every(d => uint(d, 199))) return fail('invalid-terrain-proposal');
  const c = context(input, energyCaps); if (!c) return fail('invalid-roster-context');
  const u = c.roster.find(x => x.id === input.actorId); if (!u || u.acted || u.status !== 'normal') return fail('terrain-actor-unavailable');
  const visited = [u.cellId, ...input.path];
  if (visited.some(cell => c.activeFireCellIds.includes(cell))) return fail('unsupported-fire-entry');
  if (input.path.some(cell => c.roster.some(other => other.id !== u.id && other.cellId === cell))) return fail('occupied-terrain-path');
  const initial = hazard(c, u, { traverse: input.traits.traverse, antidote: input.traits.antidote, difficultMarch: input.traits.difficultMarch },
    input.draws.map(value => ({ bound: 200 as const, value: value as number })));
  if (!initial.ok) return initial;
  const result = executeHazardCommand(initial.state, { type: 'enterCells', path: input.path, expectedRevision: 0 });
  if (!result.ok) return result;
  if (result.after.rng.cursor !== input.draws.length) return fail('extra-terrain-draws');
  return frozen({ ok: true as const, patch: { id: u.id, cellId: result.after.unit.cellId, troops: result.after.unit.troops, energy: result.after.unit.energy, acted: true },
    receipt: result, proposalOnly: true as const, nativeWorldVerified: false as const });
}
function rockfall(input: unknown, energyCaps?: SyntheticEnergyCaps) {
  if (!record(input) || !keys(input, ['map', 'roster', 'activeFireCellIds', 'footprint', 'traits', 'draws', 'eventsUsed'])
    || !Array.isArray(input.footprint) || input.footprint.length < 1 || input.footprint.length > 16 || !input.footprint.every(id)
    || new Set(input.footprint).size !== input.footprint.length || !Array.isArray(input.traits) || !Array.isArray(input.draws)
    || !uint(input.eventsUsed, 256)) return fail('invalid-rockfall-proposal');
  const c = context(input, energyCaps); if (!c) return fail('invalid-roster-context');
  if (input.footprint.some(cell => !c.map.cells.some(x => x.id === cell && !x.blocked && !x.unsupportedContext && !x.facilityPresent))) return fail('invalid-footprint');
  const traits = new Map<string, boolean>();
  for (const t of input.traits) {
    if (!record(t) || !keys(t, ['actorId', 'pathbreaker']) || !id(t.actorId) || traits.has(t.actorId)
      || !c.roster.some(u => u.id === t.actorId) || typeof t.pathbreaker !== 'boolean') return fail('invalid-rockfall-traits');
    traits.set(t.actorId, t.pathbreaker);
  }
  if (traits.size !== c.roster.length) return fail('incomplete-rockfall-traits');
  const targets = c.roster.filter(u => (input.footprint as string[]).includes(u.cellId)).sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  if (!targets.length || input.draws.length !== targets.length || input.eventsUsed + targets.length > 256) return fail('rockfall-coverage-or-budget');
  const hits = [];
  for (let i = 0; i < targets.length; i++) {
    const d = input.draws[i], u = targets[i]!;
    if (!record(d) || !keys(d, ['targetId', 'draw']) || d.targetId !== u.id || !uint(d.draw, 999)) return fail('rockfall-draw-order');
    hits.push({ targetId: u.id, draw: d.draw, pathbreaker: traits.get(u.id)!, eligibilityConfirmed: true });
  }
  const made = createInferredMultiRockfall(c.roster.map(u => ({ id: u.id, kind: 'troop', value: u.troops }))); if (!made.ok) return made;
  const result = executeInferredMultiRockfall(made.state, { id: 'synthetic-roster-rockfall', expectedRevision: 0, targets: hits }); if (!result.ok) return result;
  return frozen({ ok: true as const, patches: c.roster.map(u => ({ id: u.id, troops: result.balances.find(b => b.id === u.id)!.value })),
    eventsUsed: input.eventsUsed + targets.length, receipts: result.receipts, proposalOnly: true as const, nativeWorldVerified: false as const });
}
function retreat(input: unknown) {
  if (!record(input) || !keys(input, ['map', 'roster', 'activeFireCellIds', 'goals', 'turn']) || !Array.isArray(input.goals)
    || !uint(input.turn, 1000000)) return fail('invalid-retreat-proposal');
  const c = context(input); if (!c) return fail('invalid-roster-context');
  const goals = new Map<string, string>();
  for (const g of input.goals) {
    if (!record(g) || !keys(g, ['actorId', 'cellId']) || !id(g.actorId) || !id(g.cellId) || goals.has(g.actorId)
      || !c.roster.some(u => u.id === g.actorId) || !c.map.cells.some(x => x.id === g.cellId && x.terrainInfoU32 === 0 && !x.blocked && !x.unsupportedContext && !x.facilityPresent)) return fail('invalid-retreat-goal');
    goals.set(g.actorId, g.cellId);
  }
  if (goals.size !== c.roster.length || c.roster.some(u => c.activeFireCellIds.includes(u.cellId))) return fail('retreat-goal-coverage-or-active-fire');
  let proposed = c.roster.map(u => ({ ...u })); const receipts = [];
  // Stable ID serial occupancy is an explicit extension of the old single-unit BFS profile.
  for (const id of proposed.map(u => u.id).sort()) {
    const index = proposed.findIndex(u => u.id === id), before = proposed[index]!; let unit = { ...before }, route: string[] | null = null;
    if (unit.status === 'false-report' && !unit.acted) {
      if (c.map.cells.find(x => x.id === unit.cellId)!.terrainInfoU32 !== 0) return fail('retreat-nonplain-start');
      const queue = [[unit.cellId]], seen = new Set([unit.cellId]);
      for (let cursor = 0; cursor < queue.length; cursor++) {
        const path = queue[cursor]!, last = path[path.length - 1]!;
        if (last === goals.get(unit.id)) { route = path; break; }
        const cell = c.map.cells.find(x => x.id === last)!;
        for (const next of [...cell.adjacent].sort()) {
          const target = c.map.cells.find(x => x.id === next)!;
          if (seen.has(next) || target.terrainInfoU32 !== 0 || target.blocked || target.unsupportedContext || target.facilityPresent
            || c.activeFireCellIds.includes(next) || proposed.some(other => other.id !== unit.id && other.cellId === next)) continue;
          seen.add(next); queue.push([...path, next]);
        }
      }
      if (!route) return fail('retreat-unreachable');
      unit = { ...unit, cellId: route.length > 1 ? route[1]! : route[0]!, acted: true };
    }
    const initial = hazard(c, unit, noTraits, [], input.turn); if (!initial.ok) return initial;
    const counted = executeHazardCommand(initial.state, { type: 'resolveTurn', expectedRevision: 0 }); if (!counted.ok) return counted;
    const opened = executeHazardCommand(counted.after, { type: 'beginTurn', expectedRevision: counted.after.revision }); if (!opened.ok) return opened;
    proposed[index] = { ...opened.after.unit };
    receipts.push({ actorId: id, before, route, resolution: counted, opening: opened });
  }
  return frozen({ ok: true as const, roster: proposed, turn: input.turn + 1, receipts, proposalOnly: true as const,
    policyId: 'synthetic-neutral-id-ordered-safe-retreat-tick-v1' as const, nativeWorldVerified: false as const });
}
function applyFalseReport(input: unknown) {
  if (!record(input) || !keys(input, ['map', 'roster', 'activeFireCellIds', 'targetId', 'draw', 'critical']) || !id(input.targetId)
    || !uint(input.draw, 99) || typeof input.critical !== 'boolean') return fail('invalid-status-proposal');
  const c = context(input); if (!c) return fail('invalid-roster-context');
  const unit = c.roster.find(u => u.id === input.targetId);
  if (!unit || c.activeFireCellIds.includes(unit.cellId)) return fail('status-target-unavailable-or-fire');
  const made = hazard(c, unit, noTraits, [{ bound: 100, value: input.draw }]); if (!made.ok) return made;
  const result = executeHazardCommand(made.state, { type: 'applyStatus', kind: 'false-report', critical: input.critical, expectedRevision: 0 }); if (!result.ok) return result;
  return frozen({ ok: true as const, patch: { id: unit.id, status: result.after.unit.status, remaining: result.after.unit.remaining }, receipt: result,
    proposalOnly: true as const, nativeWorldVerified: false as const });
}
export function projectRosterTerrainEntry(input: unknown) { try { return terrain(detach(input)); } catch { return fail('invalid-data-input'); } }
export function projectRosterRockfall(input: unknown) { try { return rockfall(detach(input)); } catch { return fail('invalid-data-input'); } }
export function projectRosterRetreatTick(input: unknown) { try { return retreat(detach(input)); } catch { return fail('invalid-data-input'); } }
export function projectRosterFalseReportApply(input: unknown) { try { return applyFalseReport(detach(input)); } catch { return fail('invalid-data-input'); } }

export function projectRosterTerrainEntryWithEnergyCaps(input: unknown, rawCaps: unknown) { try { const caps=readSyntheticEnergyCaps(detach(rawCaps)); return caps ? terrain(detach(input), caps) : fail('invalid-derived-energy-caps'); } catch { return fail('invalid-data-input'); } }

export function projectRosterRockfallWithEnergyCaps(input: unknown, rawCaps: unknown) { try { const caps=readSyntheticEnergyCaps(detach(rawCaps)); return caps ? rockfall(detach(input), caps) : fail('invalid-derived-energy-caps'); } catch { return fail('invalid-data-input'); } }
