/** Named synthetic effects, never original strategy/casualty finalizers. */
import { decideInferredStrategyHit, decideInferredStrategyHitEffective255 } from './inferred-combat-requests.ts';
type Unit = Readonly<{ id: string; troops: number; confusedTurns: number; acted: boolean }>;
type Cast = Readonly<{ kind: 'cast'; id: string; expectedRevision: number; strategy: 'ambush' | 'discord' | 'sorcery';
  targets: readonly string[]; intelligence: number; targetIntelligence: number; roll: number;
  immune: boolean; guaranteed: boolean; beautyBonus: boolean; eligibilityConfirmed: true }>;
type Simple = Readonly<{ kind: 'advance'; id: string; expectedRevision: number }>
  | Readonly<{ kind: 'act'; id: string; expectedRevision: number; targetId: string }>;
type Command = Cast | Simple;
type State = Readonly<{ schema: 'inferred-synthetic-strategy-effects-v1'; initial: readonly Unit[]; commands: readonly Command[]; intelligenceProfile?:'same-formula-intelligence255-v1' }>;
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




function commandFrom(v: unknown, maxIntelligence:100|255=100): Command | undefined {
  if (!record(v) || !id(v.id) || !uint(v.expectedRevision, 255)) return undefined;
  if (v.kind === 'advance' && keys(v, ['kind', 'id', 'expectedRevision'])) return { kind: v.kind, id: v.id, expectedRevision: v.expectedRevision };
  if (v.kind === 'act' && keys(v, ['kind', 'id', 'expectedRevision', 'targetId']) && id(v.targetId)) return { kind: v.kind, id: v.id, expectedRevision: v.expectedRevision, targetId: v.targetId };
  if (v.kind !== 'cast' || !keys(v, ['kind', 'id', 'expectedRevision', 'strategy', 'targets', 'intelligence', 'targetIntelligence', 'roll', 'immune', 'guaranteed', 'beautyBonus', 'eligibilityConfirmed'])
    || (v.strategy !== 'ambush' && v.strategy !== 'discord' && v.strategy !== 'sorcery') || !Array.isArray(v.targets)
    || v.targets.length < 1 || v.targets.length > 3 || !v.targets.every(id) || new Set(v.targets).size !== v.targets.length
    || (v.strategy === 'ambush' && v.targets.length !== 1) || (v.strategy === 'discord' && v.targets.length !== 2)
    || !uint(v.intelligence, maxIntelligence) || !uint(v.targetIntelligence, maxIntelligence) || !uint(v.roll, 99)
    || typeof v.immune !== 'boolean' || typeof v.guaranteed !== 'boolean' || typeof v.beautyBonus !== 'boolean' || v.eligibilityConfirmed !== true) return undefined;
  return { kind: 'cast', id: v.id, expectedRevision: v.expectedRevision, strategy: v.strategy, targets: [...v.targets], intelligence: v.intelligence,
    targetIntelligence: v.targetIntelligence, roll: v.roll, immune: v.immune, guaranteed: v.guaranteed, beautyBonus: v.beautyBonus, eligibilityConfirmed: true };
}
function apply(units: Unit[], command: Command, extendedIntelligence=false) {
  if (command.kind === 'advance') {
    for (let i = 0; i < units.length; i++) units[i] = { ...units[i]!, confusedTurns: Math.max(0, units[i]!.confusedTurns - 1), acted: false };
    return { ok: true as const, kind: command.kind };
  }
  if (command.kind === 'act') {
    const index = units.findIndex(unit => unit.id === command.targetId), unit = units[index];
    if (!unit || unit.acted || unit.confusedTurns > 0) return fail('unit-not-eligible-to-act');
    units[index] = { ...unit, acted: true }; return { ok: true as const, kind: command.kind };
  }
  const selected = command.targets.map(target => units.findIndex(unit => unit.id === target));
  if (selected.some(index => index < 0)) return fail('unknown-synthetic-target');
  const decision = (extendedIntelligence?decideInferredStrategyHitEffective255:decideInferredStrategyHit)(command.strategy, command.intelligence, command.targetIntelligence, command.roll, true,
    command.immune, command.guaranteed, command.beautyBonus);
  if (!decision.ok) return decision;
  if (!decision.hit) return { ok: true as const, kind: command.kind, decision, effect: 'miss' as const };
  const damage = command.strategy === 'ambush' ? 300 : command.strategy === 'discord' ? 150 : 0;
  if (selected.some(index => units[index]!.troops <= damage)) return fail('zero-or-terminal-result-excluded');
  for (const index of selected) {
    const unit = units[index]!;
    units[index] = { ...unit, troops: unit.troops - damage, confusedTurns: command.strategy === 'sorcery' ? 1 : unit.confusedTurns };
  }
  return { ok: true as const, kind: command.kind, decision, effect: command.strategy, damagePerTarget: damage };
}
function replay(input: unknown) {
  const hasProfile=record(input)&&Object.hasOwn(input,'intelligenceProfile');
  if(hasProfile&&record(input)&&input.intelligenceProfile!=='same-formula-intelligence255-v1')return fail('invalid-intelligence-profile');
  if (!record(input) || !keys(input, ['schema', 'initial', 'commands',...(hasProfile?['intelligenceProfile']:[])]) || input.schema !== 'inferred-synthetic-strategy-effects-v1'
    || !Array.isArray(input.initial) || input.initial.length < 1 || input.initial.length > 64
    || !Array.isArray(input.commands) || input.commands.length > 256) return fail('invalid-ledger');
  const initial: Unit[] = [], names = new Set<string>();
  for (const unit of input.initial) {
    if (!record(unit) || !keys(unit, ['id', 'troops', 'confusedTurns', 'acted']) || !id(unit.id) || names.has(unit.id)
      || !uint(unit.troops, 1000000) || unit.troops === 0 || !uint(unit.confusedTurns, 1) || typeof unit.acted !== 'boolean') return fail('invalid-synthetic-unit');
    names.add(unit.id); initial.push({ id: unit.id, troops: unit.troops, confusedTurns: unit.confusedTurns, acted: unit.acted });
  }
  const units = initial.map(unit => ({ ...unit })), commands: Command[] = [], receipts = [], commandIds = new Set<string>();
  let turn = 0;
  for (const raw of input.commands) {
    const command = commandFrom(raw,hasProfile?255:100);
    if (!command || command.expectedRevision !== commands.length || commandIds.has(command.id)) return fail('invalid-command-history');
    const before = units.map(unit => ({ ...unit }));
    const result = apply(units, command,hasProfile);
    if (!result.ok) return result;
    if (command.kind === 'advance') turn++;
    receipts.push({ commandId: command.id, turn, before, after: units.map(unit => ({ ...unit })), result });
    commands.push(command); commandIds.add(command.id);
  }
  const state: State = { schema: 'inferred-synthetic-strategy-effects-v1', initial, commands, ...(hasProfile?{intelligenceProfile:'same-formula-intelligence255-v1' as const}:{}) };
  return frozen({ ok: true as const, state, units, receipts, turn, revision: commands.length, campaignWorldWritten: false as const,
    nativeEffectsVerified: false as const, casterCostsApplied: false as const });
}
export function readInferredStrategyEffects(input: unknown) { try { return replay(detach(input)); } catch { return fail('invalid-data-input'); } }
export function createInferredStrategyEffects(initial: unknown, intelligenceProfile?:'same-formula-intelligence255-v1') { return readInferredStrategyEffects({ schema: 'inferred-synthetic-strategy-effects-v1', initial, commands: [], ...(intelligenceProfile===undefined?{}:{intelligenceProfile}) }); }
export function executeInferredStrategyEffects(input: unknown, rawCommand: unknown) {
  const current = readInferredStrategyEffects(input); if (!current.ok) return current;
  let detached: unknown; try { detached = detach(rawCommand); } catch { return fail('invalid-data-command'); }
  const command = commandFrom(detached,current.state.intelligenceProfile?255:100);
  if (!command || command.expectedRevision !== current.revision || current.revision >= 256) return fail('invalid-command-or-capacity');
  if (current.state.commands.some(entry => entry.id === command.id)) return fail('duplicate-command');
  return readInferredStrategyEffects({ ...current.state, commands: [...current.state.commands, command] });
}
export function saveInferredStrategyEffects(input: unknown) {
  const validated = readInferredStrategyEffects(input); if (!validated.ok) return validated;
  const json = JSON.stringify(validated.state);
  return json.length <= 1000000 ? Object.freeze({ ok: true as const, json }) : fail('save-size-limit');
}
export function loadInferredStrategyEffects(json: unknown) {
  if (typeof json !== 'string' || json.length > 1000000) return fail('invalid-save');
  try { return readInferredStrategyEffects(JSON.parse(json)); } catch { return fail('invalid-save'); }
}

