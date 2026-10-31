import { readSyntheticEnergyCaps, type SyntheticEnergyCaps } from './synthetic-energy-cap-context.ts';
/** Explicit inferred neutral per-visit fire entry; never a native caller claim. */
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
function project(input: unknown, energyCaps?: SyntheticEnergyCaps) {
  if (!record(input) || !keys(input, ['map', 'roster', 'fires', 'actorId', 'path', 'draws', 'eventsUsed', 'modifiers'])
    || !id(input.actorId) || !Array.isArray(input.fires) || input.fires.length > 16 || !Array.isArray(input.path)
    || input.path.length < 1 || input.path.length > 16 || !input.path.every(id) || !Array.isArray(input.draws)
    || input.draws.length > 16 || !uint(input.eventsUsed, 256) || !record(input.modifiers)
    || !keys(input.modifiers, ['fireGod', 'rattan', 'explosives', 'critical'])
    || Object.values(input.modifiers).some(value => value !== false)) return fail('invalid-or-nonneutral-fire-entry');
  const fires: { id: string; cellId: string; remainingTicks: number }[] = [];
  for (const f of input.fires) {
    if (!record(f) || !keys(f, ['id', 'cellId', 'remainingTicks']) || !id(f.id) || !id(f.cellId)
      || !uint(f.remainingTicks, 3) || f.remainingTicks === 0 || fires.some(x => x.id === f.id || x.cellId === f.cellId)) return fail('invalid-current-fires');
    fires.push({ id: f.id, cellId: f.cellId, remainingTicks: f.remainingTicks });
  }
  const c = context({ map: input.map, roster: input.roster, activeFireCellIds: fires.map(f => f.cellId) }, energyCaps);
  if (!c) return fail('invalid-roster-context');
  const actor = c.roster.find(u => u.id === input.actorId);
  if (!actor || actor.acted || actor.status !== 'normal') return fail('fire-entry-actor-unavailable');
  // This minimal leaf does not silently omit poison/plank exposure or select a mixed-hazard precedence.
  if ([actor.cellId, ...input.path].some(cellId => !c.map.cells.some(cell => cell.id === cellId && cell.terrainInfoU32 === 0))) return fail('mixed-terrain-fire-entry-not-supported');
  const exposures = input.path.map((cellId, pathIndex) => ({ pathIndex, cellId, fire: fires.find(f => f.cellId === cellId) })).filter(x => x.fire !== undefined);
  if (input.draws.length !== exposures.length || input.eventsUsed + exposures.length > 256) return fail('fire-entry-coverage-or-budget');
  let cellId = actor.cellId, troops = actor.troops, cursor = 0; const effects = [];
  for (let pathIndex = 0; pathIndex < input.path.length; pathIndex++) {
    const to = input.path[pathIndex]!, fromCell = c.map.cells.find(x => x.id === cellId)!, toCell = c.map.cells.find(x => x.id === to)!;
    if (!fromCell.adjacent.includes(to) || toCell.blocked || toCell.unsupportedContext || toCell.facilityPresent
      || c.roster.some(u => u.id !== actor.id && u.cellId === to)) return fail('illegal-fire-entry-path');
    const fire = fires.find(f => f.cellId === to), before = troops;
    if (fire) {
      const d = input.draws[cursor];
      if (!record(d) || !keys(d, ['pathIndex', 'cellId', 'fireId', 'draw']) || d.pathIndex !== pathIndex
        || d.cellId !== to || d.fireId !== fire.id || !uint(d.draw, 200)) return fail('fire-entry-draw-order');
      const damage = 300 + d.draw;
      if (damage >= troops) return fail('unsupported-terminal-fire-entry');
      troops -= damage; cursor++;
      effects.push({ pathIndex, from: cellId, to, fireId: fire.id, remainingTicks: fire.remainingTicks,
        draw: d.draw, requestedDamage: damage, troopsBefore: before, troopsAfter: troops });
    }
    cellId = to;
  }
  return frozen({ ok: true as const, patch: { id: actor.id, cellId, troops, energy: actor.energy, acted: true },
    effects, eventsUsed: input.eventsUsed + exposures.length, fireWrites: [] as never[], proposalOnly: true as const,
    policyId: 'inferred-neutral-fire-entry-per-visit-v1' as const, nativeCallerVerified: false as const });
}
export function projectNeutralFireEntry(input: unknown) { try { return project(detach(input)); } catch { return fail('invalid-data-input'); } }

export function projectNeutralFireEntryWithEnergyCaps(input: unknown, rawCaps: unknown) { try { const caps=readSyntheticEnergyCaps(detach(rawCaps)); return caps ? project(detach(input), caps) : fail('invalid-derived-energy-caps'); } catch { return fail('invalid-data-input'); } }
