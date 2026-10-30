/** One authoritative synthetic roster, transactional projections into existing kernels. */
import { createInferredFireLifecycle, executeInferredFireLifecycle } from './inferred-fire-lifecycle.ts';
import { createInferredStrategyEffects, executeInferredStrategyEffects } from './inferred-strategy-effects.ts';
import { moveOnSuppliedMap, GUIDE_REFERENCE_MOVEMENT_POLICY } from './supplied-map-movement.ts';
import { decideInferredStrategyHit } from './inferred-combat-requests.ts';
type Strategy = 'fire' | 'ambush' | 'discord' | 'sorcery';
type Template = Readonly<{ id: string; entryCellId: string; intelligence: number; strategies: readonly Strategy[];
  available: boolean; immune: boolean; guaranteed: boolean; beautyBonus: boolean }>;
type Unit = { id: string; cellId: string; troops: number; energy: number; acted: boolean; confusedTurns: number; movementBudget: number };
type Role = ({ role: 'deployed' } & Unit) | { role: 'resident'; id: string; acted: boolean };
type Fire = Readonly<{ id: string; cellId: string; remainingTicks: number }>;
type MovementCell = Readonly<{ id: string; terrainInfoU32: number; adjacent: readonly string[]; blocked: boolean; unsupportedContext: boolean; facilityPresent: boolean }>;
type MovementMap = Readonly<{ id: string; cells: readonly MovementCell[] }>;
type MovementProfile = Readonly<{ actorId: string; landEquipmentId: number; navalEquipmentId: number; turnBudget: number }>;
type Action = Readonly<{ kind: 'FieldTick'; draws: readonly { targetId: string; draw: number }[] }>
  | Readonly<{ kind: 'Move'; actorId: string; path: readonly string[] }>
  | Readonly<{ kind: 'Deploy'; actorId: string; troops: number; energy: number }>
  | Readonly<{ kind: 'Return'; actorId: string }>
  | Readonly<{ kind: 'Cast'; casterId: string; strategy: Exclude<Strategy, 'fire'>; targets: readonly string[]; roll: number }>
  | Readonly<{ kind: 'FireCast'; casterId: string; cellId: string; fireId: string; roll: number; durationDraw: number }>;
type Command = Readonly<{ id: string; expectedRevision: number; action: Action }>;
type State = Readonly<{ schema: 'inferred-mobile-field-v3'; cells: readonly string[]; templates: readonly Template[]; movementMap: MovementMap; movementProfiles: readonly MovementProfile[]; commands: readonly Command[] }>;
const COST = Object.freeze({ fire: 10, ambush: 10, discord: 20, sorcery: 30 });
const fail = (reason: string) => Object.freeze({ ok: false as const, reason });
const uint = (v: unknown, max: number): v is number => typeof v === 'number' && Number.isSafeInteger(v) && !Object.is(v, -0) && v >= 0 && v <= max;
const record = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === 'object' && !Array.isArray(v);
const keys = (v: Record<string, unknown>, expected: readonly string[]) => Object.keys(v).length === expected.length && expected.every(k => Object.hasOwn(v, k));
const id = (v: unknown): v is string => typeof v === 'string' && /^synthetic-[a-z0-9-]{1,48}$/.test(v);
const strategy = (v: unknown): v is Strategy => v === 'fire' || v === 'ambush' || v === 'discord' || v === 'sorcery';
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






function commandFrom(v: unknown): Command | undefined {
  if (!record(v) || !keys(v, ['id', 'expectedRevision', 'action']) || !id(v.id) || !uint(v.expectedRevision, 31) || !record(v.action)) return undefined;
  const a = v.action; let action: Action;
  if (a.kind === 'FieldTick' && keys(a, ['kind', 'draws']) && Array.isArray(a.draws) && a.draws.length <= 8) {
    const draws: { targetId: string; draw: number }[] = [];
    for (const d of a.draws) { if (!record(d) || !keys(d, ['targetId', 'draw']) || !id(d.targetId) || !uint(d.draw, 200)) return undefined; draws.push({ targetId: d.targetId, draw: d.draw }); }
    action = { kind: a.kind, draws };
  } else if (a.kind === 'Cast' && keys(a, ['kind', 'casterId', 'strategy', 'targets', 'roll']) && id(a.casterId)
    && strategy(a.strategy) && a.strategy !== 'fire' && Array.isArray(a.targets) && a.targets.length > 0 && a.targets.length <= 3
    && a.targets.every(id) && new Set(a.targets).size === a.targets.length && !a.targets.includes(a.casterId) && uint(a.roll, 99)
    && (a.strategy !== 'ambush' || a.targets.length === 1) && (a.strategy !== 'discord' || a.targets.length === 2)) {
    action = { kind: a.kind, casterId: a.casterId, strategy: a.strategy, targets: [...a.targets], roll: a.roll };
  } else if (a.kind === 'FireCast' && keys(a, ['kind', 'casterId', 'cellId', 'fireId', 'roll', 'durationDraw'])
    && id(a.casterId) && id(a.cellId) && id(a.fireId) && uint(a.roll, 99) && uint(a.durationDraw, 99)) {
    action = { kind: a.kind, casterId: a.casterId, cellId: a.cellId, fireId: a.fireId, roll: a.roll, durationDraw: a.durationDraw };
  } else if (a.kind === 'Move' && keys(a, ['kind', 'actorId', 'path']) && id(a.actorId)
    && Array.isArray(a.path) && a.path.length > 0 && a.path.length <= 16 && a.path.every(id)) {
    action = { kind: a.kind, actorId: a.actorId, path: [...a.path] };
  } else if (a.kind === 'Deploy' && keys(a, ['kind', 'actorId', 'troops', 'energy']) && id(a.actorId)
    && uint(a.troops, 1000000) && a.troops > 0 && uint(a.energy, 100)) {
    action = { kind: a.kind, actorId: a.actorId, troops: a.troops, energy: a.energy };
  } else if (a.kind === 'Return' && keys(a, ['kind', 'actorId']) && id(a.actorId)) {
    action = { kind: a.kind, actorId: a.actorId };
  } else return undefined;
  return { id: v.id, expectedRevision: v.expectedRevision, action };
}
/** Transient projections contain no independent history accepted from callers. */
function fireProjection(cells: readonly string[], roster: readonly Unit[], fires: readonly Fire[]) {
  const created = createInferredFireLifecycle(cells, roster.map(u => ({ id: u.id, cellId: u.cellId, value: u.troops })));
  if (!created.ok) return created;
  let session = created;
  for (let i = 0; i < fires.length; i++) {
    const f = fires[i]!;
    if (!uint(f.remainingTicks, 3) || f.remainingTicks === 0) return fail('unsupported-fire-projection-duration');
    const seeded = executeInferredFireLifecycle(session.state, { id: `synthetic-seed-${i}`, expectedRevision: session.revision,
      action: { kind: 'Ignite', fireId: f.id, cellId: f.cellId, durationDraw: f.remainingTicks === 1 ? 0 : 99, critical: f.remainingTicks === 3 } });
    if (!seeded.ok) return seeded;
    if (seeded.fires.find(fire => fire.id === f.id)?.remainingTicks !== f.remainingTicks) return fail('fire-duration-policy-not-projectable');
    session = seeded;
  }
  return session;
}
function effectProjection(roster: readonly Unit[]) {
  return createInferredStrategyEffects(roster.map(u => ({ id: u.id, troops: u.troops, acted: u.acted, confusedTurns: u.confusedTurns })));
}
/** Proposal replay only: city inventory/actor eligibility is a mandatory outer-world check. */
function replay(input: unknown) {
  if (!record(input) || !keys(input, ['schema', 'cells', 'templates', 'movementMap', 'movementProfiles', 'commands']) || input.schema !== 'inferred-mobile-field-v3'
    || !Array.isArray(input.cells) || input.cells.length < 1 || input.cells.length > 16 || !input.cells.every(id) || new Set(input.cells).size !== input.cells.length
    || !Array.isArray(input.templates) || input.templates.length < 1 || input.templates.length > 8 || !Array.isArray(input.commands) || input.commands.length > 32) return fail('invalid-field');
  const cells: string[] = [...input.cells], templates: Template[] = [], ids = new Set<string>();
  for (const a of input.templates) {
    if (!record(a) || !keys(a, ['id', 'entryCellId', 'intelligence', 'strategies', 'available', 'immune', 'guaranteed', 'beautyBonus'])
      || !id(a.id) || ids.has(a.id) || !id(a.entryCellId) || !cells.includes(a.entryCellId) || !uint(a.intelligence, 100)
      || !Array.isArray(a.strategies) || a.strategies.length > 4 || !a.strategies.every(strategy) || new Set(a.strategies).size !== a.strategies.length
      || typeof a.available !== 'boolean' || typeof a.immune !== 'boolean' || typeof a.guaranteed !== 'boolean' || typeof a.beautyBonus !== 'boolean') return fail('invalid-field-template');
    ids.add(a.id); templates.push({ id: a.id, entryCellId: a.entryCellId, intelligence: a.intelligence, strategies: [...a.strategies],
      available: a.available, immune: a.immune, guaranteed: a.guaranteed, beautyBonus: a.beautyBonus });
  }
  // A supplied finite map, not a native map: no mutable occupancy or fire flags accepted.
  if (!record(input.movementMap) || !keys(input.movementMap, ['id', 'cells']) || !id(input.movementMap.id)
    || !Array.isArray(input.movementMap.cells) || input.movementMap.cells.length !== cells.length
    || !Array.isArray(input.movementProfiles) || input.movementProfiles.length !== templates.length) return fail('invalid-movement-genesis');
  const mapCells: MovementCell[] = [], movementProfiles: MovementProfile[] = [];
  for (let i = 0; i < cells.length; i++) {
    const c = input.movementMap.cells[i];
    if (!record(c) || !keys(c, ['id', 'terrainInfoU32', 'adjacent', 'blocked', 'unsupportedContext', 'facilityPresent'])
      || c.id !== cells[i] || !uint(c.terrainInfoU32, 0xffffffff) || !Array.isArray(c.adjacent)
      || c.adjacent.length > 16 || !c.adjacent.every(v => id(v) && cells.includes(v)) || new Set(c.adjacent).size !== c.adjacent.length
      || c.adjacent.includes(c.id) || typeof c.blocked !== 'boolean' || typeof c.unsupportedContext !== 'boolean'
      || typeof c.facilityPresent !== 'boolean') return fail('invalid-movement-cell');
    mapCells.push({ id: c.id as string, terrainInfoU32: c.terrainInfoU32, adjacent: [...c.adjacent] as string[],
      blocked: c.blocked, unsupportedContext: c.unsupportedContext, facilityPresent: c.facilityPresent });
  }
  for (let i = 0; i < templates.length; i++) {
    const p = input.movementProfiles[i], t = templates[i]!, entry = mapCells.find(c => c.id === t.entryCellId)!;
    if (!record(p) || !keys(p, ['actorId', 'landEquipmentId', 'navalEquipmentId', 'turnBudget']) || p.actorId !== t.id
      || !uint(p.landEquipmentId, 8) || !uint(p.navalEquipmentId, 11) || p.navalEquipmentId < 9
      || !uint(p.turnBudget, 255) || p.turnBudget === 0 || entry.blocked || entry.unsupportedContext || entry.facilityPresent) return fail('invalid-movement-profile-or-entry');
    movementProfiles.push({ actorId: t.id, landEquipmentId: p.landEquipmentId, navalEquipmentId: p.navalEquipmentId, turnBudget: p.turnBudget });
  }
  const movementMap: MovementMap = { id: input.movementMap.id, cells: mapCells };
  // Residents have no troop or energy balance. Stable identities survive all role changes.
  let roles: Role[] = templates.map(a => ({ role: 'resident', id: a.id, acted: false }));
  let fires: Fire[] = [], turn = 0, fireDamageEvents = 0;
  const commands: Command[] = [], usedCommands = new Set<string>(), usedFires = new Set<string>(), receipts = [];
  for (const raw of input.commands) {
    const command = commandFrom(raw);
    if (!command || command.expectedRevision !== commands.length || usedCommands.has(command.id)) return fail('invalid-command-history');
    const a = command.action, before = roles.map(u => ({ ...u })), firesBefore = fires, turnBefore = turn;
    let roster: Unit[] = roles.filter((u): u is Role & Unit => u.role === 'deployed').map(u =>
      ({ id: u.id, cellId: u.cellId, troops: u.troops, energy: u.energy, acted: u.acted, confusedTurns: u.confusedTurns, movementBudget: u.movementBudget }));
    if (a.kind === 'Deploy' || a.kind === 'Return') {
      const index = templates.findIndex(t => t.id === a.actorId), config = templates[index], current = roles[index];
      if (!config || !current || current.acted) return fail('role-change-not-eligible');
      if (a.kind === 'Deploy') {
        if (current.role !== 'resident' || !config.available) return fail('actor-not-deployable');
        roles[index] = { role: 'deployed', id: current.id, cellId: config.entryCellId, troops: a.troops,
          energy: a.energy, acted: true, confusedTurns: 0, movementBudget: movementProfiles[index]!.turnBudget };
        receipts.push({ commandId: command.id, kind: a.kind, turn, actorId: current.id,
          transferProposal: { direction: 'city-to-field', troops: a.troops, morale: a.energy }, before, after: roles.map(u => ({ ...u })) });
      } else {
        if (current.role !== 'deployed' || current.confusedTurns !== 0 || current.cellId !== config.entryCellId) return fail('actor-not-returnable');
        roles[index] = { role: 'resident', id: current.id, acted: true };
        receipts.push({ commandId: command.id, kind: a.kind, turn, actorId: current.id,
          transferProposal: { direction: 'field-to-city', troops: current.troops, morale: current.energy }, before, after: roles.map(u => ({ ...u })) });
      }
    } else if (a.kind === 'Move') {
      const current = roster.find(u => u.id === a.actorId), profile = movementProfiles.find(p => p.actorId === a.actorId);
      if (!current || !profile || current.acted || current.confusedTurns !== 0) return fail('mover-not-eligible');
      const visited = [current.cellId, ...a.path];
      if (visited.some(cellId => { const cell = mapCells.find(c => c.id === cellId);
        return !cell || cell.facilityPresent || cell.unsupportedContext; })) return fail('movement-context-excluded');
      const moved = moveOnSuppliedMap({ version: 1, map: { id: movementMap.id, cells: mapCells.map(c => ({ ...c,
        flagsU32: fires.some(f => f.cellId === c.id) ? 0x00800000 : 0,
        occupied: roster.some(u => u.id !== current.id && u.cellId === c.id) })) },
        state: { unitId: current.id, cellId: current.cellId, budget: current.movementBudget,
          landEquipmentId: profile.landEquipmentId, navalEquipmentId: profile.navalEquipmentId, transport: false },
        path: a.path, policy: GUIDE_REFERENCE_MOVEMENT_POLICY });
      if (!moved.ok) return fail(`movement:${moved.reason}`);
      roles = roles.map(u => u.id === current.id ? { role: 'deployed', ...current, cellId: moved.state.cellId,
        movementBudget: moved.state.budget, acted: true } : u);
      receipts.push({ commandId: command.id, kind: a.kind, turn, before, after: roles.map(u => ({ ...u })),
        movementReceipt: moved, firesBefore, firesAfter: fires });
    } else if (a.kind === 'FieldTick') {
      if (roster.length === 0) {
        if (a.draws.length !== 0) return fail('empty-field-requires-empty-draws');
        // No fake target and no new duration draw: exact remaining-life transition only.
        fires = fires.filter(f => f.remainingTicks > 1).map(f => ({ ...f, remainingTicks: f.remainingTicks - 1 }));
      } else {
        const session = fireProjection(cells, roster, fires); if (!session.ok) return session;
        const affected = roster.filter(u => fires.some(f => f.cellId === u.cellId)).length;
        if (fireDamageEvents + affected > 256) return fail('cumulative-fire-damage-budget');
        const burned = executeInferredFireLifecycle(session.state, { id: 'synthetic-field-tick', expectedRevision: session.revision,
          action: { kind: 'Tick', draws: a.draws } });
        if (!burned.ok) return burned;
        const proposed = roster.map(u => ({ ...u, troops: burned.targets.find(t => t.id === u.id)!.value }));
        const effects = effectProjection(proposed); if (!effects.ok) return effects;
        const advanced = executeInferredStrategyEffects(effects.state, { kind: 'advance', id: 'synthetic-field-recovery', expectedRevision: 0 });
        if (!advanced.ok) return advanced;
        roster = proposed.map(u => { const v = advanced.units.find(t => t.id === u.id)!;
          return { ...u, troops: v.troops, acted: v.acted, confusedTurns: v.confusedTurns, movementBudget: movementProfiles.find(p => p.actorId === u.id)!.turnBudget }; });
        fires = burned.fires; fireDamageEvents += affected;
      }
      roles = roles.map(u => { if (u.role === 'resident') return { ...u, acted: false };
        return { role: 'deployed', ...roster.find(t => t.id === u.id)! }; });
      turn++;
      receipts.push({ commandId: command.id, kind: a.kind, turnBefore, turnAfter: turn, before, after: roles.map(u => ({ ...u })), firesBefore, firesAfter: fires });
    } else {
      const casterIndex = roster.findIndex(x => x.id === a.casterId), config = templates.find(t => t.id === a.casterId), caster = roster[casterIndex];
      const selectedStrategy = a.kind === 'FireCast' ? 'fire' : a.strategy;
      if (!config || !caster || !config.available || !config.strategies.includes(selectedStrategy) || caster.acted || caster.confusedTurns > 0) return fail('caster-not-eligible');
      const cost = COST[selectedStrategy]; if (caster.energy < cost) return fail('insufficient-energy');
      const targetIds = a.kind === 'FireCast' ? roster.filter(u => u.cellId === a.cellId).map(u => u.id) : a.targets;
      if (targetIds.some(target => !roster.some(u => u.id === target))) return fail('target-not-deployed');
      if (a.kind === 'FireCast' && (!cells.includes(a.cellId) || a.cellId === caster.cellId || usedFires.has(a.fireId) || fires.some(f => f.cellId === a.cellId))) return fail('invalid-fire-target-or-id');
      const targets = targetIds.map(target => templates.find(t => t.id === target)!);
      const targetIntelligence = targets.length ? Math.max(...targets.map(t => t.intelligence)) : 0, immune = targets.some(t => t.immune);
      let proposed = roster.map(u => ({ ...u })), proposedFires = fires;
      if (a.kind === 'FireCast') {
        const decision = decideInferredStrategyHit('fire', config.intelligence, targetIntelligence, a.roll, true, immune, config.guaranteed, config.beautyBonus);
        if (!decision.ok) return decision;
        if (decision.hit) {
          const session = fireProjection(cells, roster, fires); if (!session.ok) return session;
          const ignited = executeInferredFireLifecycle(session.state, { id: 'synthetic-field-ignite', expectedRevision: session.revision,
            action: { kind: 'Ignite', fireId: a.fireId, cellId: a.cellId, durationDraw: a.durationDraw, critical: false } });
          if (!ignited.ok) return ignited;
          proposedFires = ignited.fires;
        }
        proposed[casterIndex] = { ...caster, energy: caster.energy - cost, acted: true };
        roster = proposed; fires = proposedFires; if (decision.hit) usedFires.add(a.fireId);
        roles = roles.map(u => u.role === 'resident' ? u : ({ role: 'deployed', ...roster.find(t => t.id === u.id)! }));
        receipts.push({ commandId: command.id, kind: a.kind, turn, decision, cost, before, after: roles.map(u => ({ ...u })), firesBefore, firesAfter: fires });
      } else {
        const effects = effectProjection(roster); if (!effects.ok) return effects;
        const cast = executeInferredStrategyEffects(effects.state, { kind: 'cast', id: 'synthetic-field-cast', expectedRevision: 0, strategy: a.strategy,
          targets: a.targets, intelligence: config.intelligence, targetIntelligence, roll: a.roll, immune, guaranteed: config.guaranteed,
          beautyBonus: config.beautyBonus, eligibilityConfirmed: true });
        if (!cast.ok) return cast;
        const acted = executeInferredStrategyEffects(cast.state, { kind: 'act', id: 'synthetic-field-act', expectedRevision: cast.revision, targetId: caster.id });
        if (!acted.ok) return acted;
        proposed = roster.map(u => { const v = acted.units.find(t => t.id === u.id)!;
          return { ...u, troops: v.troops, acted: v.acted, confusedTurns: v.confusedTurns }; });
        proposed[casterIndex] = { ...proposed[casterIndex]!, energy: caster.energy - cost }; roster = proposed;
        roles = roles.map(u => u.role === 'resident' ? u : ({ role: 'deployed', ...roster.find(t => t.id === u.id)! }));
        receipts.push({ commandId: command.id, kind: a.kind, turn, cost, before, after: roles.map(u => ({ ...u })), firesBefore, firesAfter: fires, effectReceipt: cast.receipts[0] });
      }
    }
    commands.push(command); usedCommands.add(command.id);
  }
  const state: State = { schema: 'inferred-mobile-field-v3', cells, templates, movementMap, movementProfiles, commands };
  if (JSON.stringify(state).length > 100000) return fail('save-budget');
  return frozen({ ok: true as const, state, revision: commands.length, turn, roster: roles, fires, fireDamageEvents, receipts,
    policyId: 'inferred-mobile-field-proposal-v3' as const, proposalOnly: true as const,
    cityConservationVerified: false as const, campaignWorldWritten: false as const, nativeWorldVerified: false as const });
}
export function readInferredMobileField(input: unknown) { try { return replay(detach(input)); } catch { return fail('invalid-data-input'); } }
export function createInferredMobileField(cells: unknown, templates: unknown, movementMap: unknown, movementProfiles: unknown) { return readInferredMobileField({ schema: 'inferred-mobile-field-v3', cells, templates, movementMap, movementProfiles, commands: [] }); }
export function executeInferredMobileField(input: unknown, rawCommand: unknown) {
  const current = readInferredMobileField(input); if (!current.ok) return current;
  let clean: unknown; try { clean = detach(rawCommand); } catch { return fail('invalid-data-command'); }
  const command = commandFrom(clean);
  if (!command || command.expectedRevision !== current.revision || current.revision >= 32) return fail('invalid-command-or-capacity');
  if (current.state.commands.some(entry => entry.id === command.id)) return fail('duplicate-command');
  return readInferredMobileField({ ...current.state, commands: [...current.state.commands, command] });
}
export function saveInferredMobileField(input: unknown) { const result = readInferredMobileField(input); return result.ok ? Object.freeze({ ok: true as const, json: JSON.stringify(result.state) }) : result; }
export function loadInferredMobileField(json: unknown) { if (typeof json !== 'string' || json.length > 100000) return fail('invalid-save'); try { return readInferredMobileField(JSON.parse(json)); } catch { return fail('invalid-save'); } }

