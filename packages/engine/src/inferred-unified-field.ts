/** One authoritative synthetic roster, transactional projections into existing kernels. */
import { createInferredFireLifecycle, executeInferredFireLifecycle } from './inferred-fire-lifecycle.ts';
import { createInferredStrategyEffects, executeInferredStrategyEffects } from './inferred-strategy-effects.ts';
import { decideInferredStrategyHit } from './inferred-combat-requests.ts';
type Strategy = 'fire' | 'ambush' | 'discord' | 'sorcery';
type Actor = Readonly<{ id: string; cellId: string; troops: number; intelligence: number; energy: number; strategies: readonly Strategy[];
  available: boolean; immune: boolean; guaranteed: boolean; beautyBonus: boolean; confusedTurns: number }>;
type Unit = { id: string; cellId: string; troops: number; energy: number; acted: boolean; confusedTurns: number };
type Fire = Readonly<{ id: string; cellId: string; remainingTicks: number }>;
type Action = Readonly<{ kind: 'FieldTick'; draws: readonly { targetId: string; draw: number }[] }>
  | Readonly<{ kind: 'Cast'; casterId: string; strategy: Exclude<Strategy, 'fire'>; targets: readonly string[]; roll: number }>
  | Readonly<{ kind: 'FireCast'; casterId: string; cellId: string; fireId: string; roll: number; durationDraw: number }>;
type Command = Readonly<{ id: string; expectedRevision: number; action: Action }>;
type State = Readonly<{ schema: 'inferred-unified-field-v1'; cells: readonly string[]; initial: readonly Actor[]; commands: readonly Command[] }>;
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
function replay(input: unknown) {
  if (!record(input) || !keys(input, ['schema', 'cells', 'initial', 'commands']) || input.schema !== 'inferred-unified-field-v1'
    || !Array.isArray(input.cells) || input.cells.length < 1 || input.cells.length > 16 || !input.cells.every(id) || new Set(input.cells).size !== input.cells.length
    || !Array.isArray(input.initial) || input.initial.length < 1 || input.initial.length > 8 || !Array.isArray(input.commands) || input.commands.length > 32) return fail('invalid-field');
  const cells: string[] = [...input.cells], initial: Actor[] = [], ids = new Set<string>();
  for (const a of input.initial) {
    if (!record(a) || !keys(a, ['id', 'cellId', 'troops', 'intelligence', 'energy', 'strategies', 'available', 'immune', 'guaranteed', 'beautyBonus', 'confusedTurns'])
      || !id(a.id) || ids.has(a.id) || !id(a.cellId) || !cells.includes(a.cellId) || !uint(a.troops, 1000000) || a.troops === 0
      || !uint(a.intelligence, 100) || !uint(a.energy, 100) || !uint(a.confusedTurns, 1) || !Array.isArray(a.strategies)
      || a.strategies.length > 4 || !a.strategies.every(strategy) || new Set(a.strategies).size !== a.strategies.length
      || typeof a.available !== 'boolean' || typeof a.immune !== 'boolean' || typeof a.guaranteed !== 'boolean' || typeof a.beautyBonus !== 'boolean') return fail('invalid-field-actor');
    ids.add(a.id); initial.push({ id: a.id, cellId: a.cellId, troops: a.troops, intelligence: a.intelligence, energy: a.energy, strategies: [...a.strategies],
      available: a.available, immune: a.immune, guaranteed: a.guaranteed, beautyBonus: a.beautyBonus, confusedTurns: a.confusedTurns });
  }
  let roster: Unit[] = initial.map(a => ({ id: a.id, cellId: a.cellId, troops: a.troops, energy: a.energy, acted: false, confusedTurns: a.confusedTurns }));
  let fires: Fire[] = [], turn = 0, fireDamageEvents = 0;
  const commands: Command[] = [], usedCommands = new Set<string>(), usedFires = new Set<string>(), receipts = [];
  for (const raw of input.commands) {
    const command = commandFrom(raw);
    if (!command || command.expectedRevision !== commands.length || usedCommands.has(command.id)) return fail('invalid-command-history');
    const a = command.action, before = roster.map(u => ({ ...u })), firesBefore = fires, turnBefore = turn;
    if (a.kind === 'FieldTick') {
      const session = fireProjection(cells, roster, fires); if (!session.ok) return session;
      const affected = roster.filter(u => fires.some(f => f.cellId === u.cellId)).length;
      if (fireDamageEvents + affected > 256) return fail('cumulative-fire-damage-budget');
      const burned = executeInferredFireLifecycle(session.state, { id: 'synthetic-field-tick', expectedRevision: session.revision, action: { kind: 'Tick', draws: a.draws } });
      if (!burned.ok) return burned;
      const proposed = roster.map(u => ({ ...u, troops: burned.targets.find(t => t.id === u.id)!.value }));
      const effects = effectProjection(proposed); if (!effects.ok) return effects;
      const advanced = executeInferredStrategyEffects(effects.state, { kind: 'advance', id: 'synthetic-field-recovery', expectedRevision: 0 });
      if (!advanced.ok) return advanced;
      roster = proposed.map(u => { const v = advanced.units.find(t => t.id === u.id)!; return { ...u, troops: v.troops, acted: v.acted, confusedTurns: v.confusedTurns }; });
      fires = burned.fires; fireDamageEvents += affected; turn++;
      receipts.push({ commandId: command.id, kind: a.kind, turnBefore, turnAfter: turn, before, after: roster.map(u => ({ ...u })),
        firesBefore, firesAfter: fires, fireReceipt: burned.receipts[burned.receipts.length - 1], recoveryReceipt: advanced.receipts[0] });
    } else {
      const casterIndex = initial.findIndex(x => x.id === a.casterId), config = initial[casterIndex], caster = roster[casterIndex];
      const selectedStrategy = a.kind === 'FireCast' ? 'fire' : a.strategy;
      if (!config || !caster || !config.available || !config.strategies.includes(selectedStrategy) || caster.acted || caster.confusedTurns > 0) return fail('caster-not-eligible');
      const cost = COST[selectedStrategy]; if (caster.energy < cost) return fail('insufficient-energy');
      const targetIds = a.kind === 'FireCast' ? roster.filter(u => u.cellId === a.cellId).map(u => u.id) : a.targets;
      if (a.kind === 'FireCast' && (!cells.includes(a.cellId) || a.cellId === caster.cellId || usedFires.has(a.fireId) || fires.some(f => f.cellId === a.cellId))) return fail('invalid-fire-target-or-id');
      const targets = targetIds.map(target => initial.find(t => t.id === target));
      if (targets.some(t => !t)) return fail('unknown-field-target');
      const targetIntelligence = targets.length ? Math.max(...targets.map(t => t!.intelligence)) : 0, immune = targets.some(t => t!.immune);
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
        receipts.push({ commandId: command.id, kind: a.kind, turn, decision, cost, before, after: roster.map(u => ({ ...u })), firesBefore, firesAfter: fires });
      } else {
        const effects = effectProjection(roster); if (!effects.ok) return effects;
        const cast = executeInferredStrategyEffects(effects.state, { kind: 'cast', id: 'synthetic-field-cast', expectedRevision: 0, strategy: a.strategy,
          targets: a.targets, intelligence: config.intelligence, targetIntelligence, roll: a.roll, immune, guaranteed: config.guaranteed, beautyBonus: config.beautyBonus, eligibilityConfirmed: true });
        if (!cast.ok) return cast;
        const acted = executeInferredStrategyEffects(cast.state, { kind: 'act', id: 'synthetic-field-act', expectedRevision: cast.revision, targetId: caster.id });
        if (!acted.ok) return acted;
        proposed = roster.map(u => { const v = acted.units.find(t => t.id === u.id)!; return { ...u, troops: v.troops, acted: v.acted, confusedTurns: v.confusedTurns }; });
        proposed[casterIndex] = { ...proposed[casterIndex]!, energy: caster.energy - cost }; roster = proposed;
        receipts.push({ commandId: command.id, kind: a.kind, turn, cost, before, after: roster.map(u => ({ ...u })), firesBefore, firesAfter: fires, effectReceipt: cast.receipts[0] });
      }
    }
    commands.push(command); usedCommands.add(command.id);
  }
  const state: State = { schema: 'inferred-unified-field-v1', cells, initial, commands };
  if (JSON.stringify(state).length > 100000) return fail('save-budget');
  return frozen({ ok: true as const, state, revision: commands.length, turn, roster, fires, fireDamageEvents, receipts,
    policyId: 'inferred-single-roster-field-caster-v1' as const, campaignWorldWritten: false as const, nativeWorldVerified: false as const });
}
export function readInferredUnifiedField(input: unknown) { try { return replay(detach(input)); } catch { return fail('invalid-data-input'); } }
export function createInferredUnifiedField(cells: unknown, initial: unknown) { return readInferredUnifiedField({ schema: 'inferred-unified-field-v1', cells, initial, commands: [] }); }
export function executeInferredUnifiedField(input: unknown, rawCommand: unknown) {
  const current = readInferredUnifiedField(input); if (!current.ok) return current;
  let clean: unknown; try { clean = detach(rawCommand); } catch { return fail('invalid-data-command'); }
  const command = commandFrom(clean);
  if (!command || command.expectedRevision !== current.revision || current.revision >= 32) return fail('invalid-command-or-capacity');
  if (current.state.commands.some(entry => entry.id === command.id)) return fail('duplicate-command');
  return readInferredUnifiedField({ ...current.state, commands: [...current.state.commands, command] });
}
export function saveInferredUnifiedField(input: unknown) { const result = readInferredUnifiedField(input); return result.ok ? Object.freeze({ ok: true as const, json: JSON.stringify(result.state) }) : result; }
export function loadInferredUnifiedField(json: unknown) { if (typeof json !== 'string' || json.length > 100000) return fail('invalid-save'); try { return readInferredUnifiedField(JSON.parse(json)); } catch { return fail('invalid-save'); } }
