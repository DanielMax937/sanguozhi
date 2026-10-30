/** Opt-in caster/effect transaction; no native personnel or campaign finalizers. */
import { createInferredStrategyEffects, executeInferredStrategyEffects } from './inferred-strategy-effects.ts';
type Strategy = 'ambush' | 'discord' | 'sorcery';
type Actor = Readonly<{ id: string; troops: number; intelligence: number; energy: number; strategies: readonly Strategy[];
  available: boolean; immune: boolean; guaranteed: boolean; beautyBonus: boolean; confusedTurns: number }>;
type Cast = Readonly<{ kind: 'cast'; id: string; expectedRevision: number; casterId: string; strategy: Strategy; targets: readonly string[]; roll: number }>;
type Command = Cast | Readonly<{ kind: 'advance'; id: string; expectedRevision: number }>;
type State = Readonly<{ schema: 'inferred-strategy-caster-transaction-v1'; initial: readonly Actor[]; commands: readonly Command[] }>;
const COST = Object.freeze({ ambush: 10, discord: 20, sorcery: 30 });
const fail = (reason: string) => Object.freeze({ ok: false as const, reason });
const uint = (v: unknown, max: number): v is number => typeof v === 'number' && Number.isSafeInteger(v) && !Object.is(v, -0) && v >= 0 && v <= max;
const record = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === 'object' && !Array.isArray(v);
const keys = (v: Record<string, unknown>, expected: readonly string[]) => Object.keys(v).length === expected.length && expected.every(k => Object.hasOwn(v, k));
const id = (v: unknown): v is string => typeof v === 'string' && /^synthetic-[a-z0-9-]{1,48}$/.test(v);
const strategy = (v: unknown): v is Strategy => v === 'ambush' || v === 'discord' || v === 'sorcery';
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
  if (!record(v) || !id(v.id) || !uint(v.expectedRevision, 63)) return undefined;
  if (v.kind === 'advance' && keys(v, ['kind', 'id', 'expectedRevision'])) return { kind: 'advance', id: v.id, expectedRevision: v.expectedRevision };
  if (v.kind !== 'cast' || !keys(v, ['kind', 'id', 'expectedRevision', 'casterId', 'strategy', 'targets', 'roll'])
    || !id(v.casterId) || !strategy(v.strategy) || !Array.isArray(v.targets) || !v.targets.every(id)
    || v.targets.length < 1 || v.targets.length > 3 || new Set(v.targets).size !== v.targets.length
    || v.targets.includes(v.casterId) || !uint(v.roll, 99)
    || (v.strategy === 'ambush' && v.targets.length !== 1) || (v.strategy === 'discord' && v.targets.length !== 2)) return undefined;
  return { kind: 'cast', id: v.id, expectedRevision: v.expectedRevision, casterId: v.casterId, strategy: v.strategy, targets: [...v.targets], roll: v.roll };
}
function replay(input: unknown) {
  if (!record(input) || !keys(input, ['schema', 'initial', 'commands']) || input.schema !== 'inferred-strategy-caster-transaction-v1'
    || !Array.isArray(input.initial) || input.initial.length < 2 || input.initial.length > 32
    || !Array.isArray(input.commands) || input.commands.length > 64) return fail('invalid-transaction');
  const initial: Actor[] = [], names = new Set<string>();
  for (const actor of input.initial) {
    if (!record(actor) || !keys(actor, ['id', 'troops', 'intelligence', 'energy', 'strategies', 'available', 'immune', 'guaranteed', 'beautyBonus', 'confusedTurns'])
      || !id(actor.id) || names.has(actor.id) || !uint(actor.troops, 1000000) || actor.troops === 0 || !uint(actor.intelligence, 100)
      || !uint(actor.energy, 100) || !uint(actor.confusedTurns, 1) || !Array.isArray(actor.strategies) || actor.strategies.length > 3
      || !actor.strategies.every(strategy) || new Set(actor.strategies).size !== actor.strategies.length
      || typeof actor.available !== 'boolean' || typeof actor.immune !== 'boolean' || typeof actor.guaranteed !== 'boolean' || typeof actor.beautyBonus !== 'boolean') return fail('invalid-synthetic-actor');
    names.add(actor.id); initial.push({ id: actor.id, troops: actor.troops, intelligence: actor.intelligence, energy: actor.energy,
      strategies: [...actor.strategies], available: actor.available, immune: actor.immune, guaranteed: actor.guaranteed,
      beautyBonus: actor.beautyBonus, confusedTurns: actor.confusedTurns });
  }
  const created = createInferredStrategyEffects(initial.map(actor => ({ id: actor.id, troops: actor.troops, confusedTurns: actor.confusedTurns, acted: false })));
  if (!created.ok) return created;
  let effectState = created.state, units = created.units, turn = created.turn;
  const energy = initial.map(actor => actor.energy), commands: Command[] = [], commandIds = new Set<string>(), receipts = [];
  for (const raw of input.commands) {
    const command = commandFrom(raw);
    if (!command || command.expectedRevision !== commands.length || commandIds.has(command.id)) return fail('invalid-command-history');
    const sequence = commands.length;
    if (command.kind === 'advance') {
      const next = executeInferredStrategyEffects(effectState, { kind: 'advance', id: `synthetic-advance-${sequence}`, expectedRevision: effectState.commands.length });
      if (!next.ok) return next;
      receipts.push({ commandId: command.id, kind: command.kind, turnBefore: turn, turnAfter: next.turn, energyChanged: false });
      effectState = next.state; units = next.units; turn = next.turn;
    } else {
      const casterIndex = initial.findIndex(actor => actor.id === command.casterId), caster = initial[casterIndex];
      const casterUnit = units.find(unit => unit.id === command.casterId);
      if (!caster || !casterUnit || !caster.available || !caster.strategies.includes(command.strategy) || casterUnit.acted || casterUnit.confusedTurns > 0) return fail('caster-not-eligible');
      const targetIndices = command.targets.map(target => initial.findIndex(actor => actor.id === target));
      if (targetIndices.some(index => index < 0)) return fail('unknown-synthetic-target');
      const cost = COST[command.strategy], beforeEnergy = energy[casterIndex]!;
      if (beforeEnergy < cost) return fail('insufficient-energy');
      const targetIntelligence = Math.max(...targetIndices.map(index => initial[index]!.intelligence));
      const immune = targetIndices.some(index => initial[index]!.immune);
      const cast = executeInferredStrategyEffects(effectState, { kind: 'cast', id: `synthetic-cast-${sequence}`, expectedRevision: effectState.commands.length,
        strategy: command.strategy, targets: command.targets, intelligence: caster.intelligence, targetIntelligence, roll: command.roll,
        immune, guaranteed: caster.guaranteed, beautyBonus: caster.beautyBonus, eligibilityConfirmed: true });
      if (!cast.ok) return cast;
      const acted = executeInferredStrategyEffects(cast.state, { kind: 'act', id: `synthetic-acted-${sequence}`, expectedRevision: cast.revision, targetId: caster.id });
      if (!acted.ok) return acted;
      receipts.push({ commandId: command.id, kind: command.kind, casterId: caster.id, turn, cost, energyBefore: beforeEnergy,
        energyAfter: beforeEnergy - cost, targetIntelligence, immune, effectReceipt: cast.receipts[cast.receipts.length - 1], actionReceipt: acted.receipts[acted.receipts.length - 1] });
      energy[casterIndex] = beforeEnergy - cost; effectState = acted.state; units = acted.units; turn = acted.turn;
    }
    commands.push(command); commandIds.add(command.id);
  }
  const state: State = { schema: 'inferred-strategy-caster-transaction-v1', initial, commands };
  return frozen({ ok: true as const, state, units, energy: initial.map((actor, index) => ({ id: actor.id, energy: energy[index]! })),
    effectState, turn, revision: commands.length, receipts, policyId: 'inferred-caster-energy-and-group-target-v1' as const,
    campaignWorldWritten: false as const, nativeEligibilityVerified: false as const });
}
export function readInferredStrategyCasterTransaction(input: unknown) { try { return replay(detach(input)); } catch { return fail('invalid-data-input'); } }
export function createInferredStrategyCasterTransaction(initial: unknown) { return readInferredStrategyCasterTransaction({ schema: 'inferred-strategy-caster-transaction-v1', initial, commands: [] }); }
export function executeInferredStrategyCasterTransaction(input: unknown, rawCommand: unknown) {
  const current = readInferredStrategyCasterTransaction(input); if (!current.ok) return current;
  let clean: unknown; try { clean = detach(rawCommand); } catch { return fail('invalid-data-command'); }
  const command = commandFrom(clean);
  if (!command || command.expectedRevision !== current.revision || current.revision >= 64) return fail('invalid-command-or-capacity');
  if (current.state.commands.some(entry => entry.id === command.id)) return fail('duplicate-command');
  return readInferredStrategyCasterTransaction({ ...current.state, commands: [...current.state.commands, command] });
}
export function saveInferredStrategyCasterTransaction(input: unknown) {
  const validated = readInferredStrategyCasterTransaction(input); if (!validated.ok) return validated;
  const json = JSON.stringify(validated.state);
  return json.length <= 1000000 ? Object.freeze({ ok: true as const, json }) : fail('save-size-limit');
}
export function loadInferredStrategyCasterTransaction(json: unknown) {
  if (typeof json !== 'string' || json.length > 1000000) return fail('invalid-save');
  try { return readInferredStrategyCasterTransaction(JSON.parse(json)); } catch { return fail('invalid-save'); }
}
