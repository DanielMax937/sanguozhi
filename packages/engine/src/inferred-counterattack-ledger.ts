/** Positive synthetic counterattack continuation; no ordinary battle/ownership finalizer. */
import { readInferredPositiveHazardLedger } from './inferred-positive-hazard-ledger.ts';
import { projectInferredGovernorCounterattack } from './inferred-combat-requests.ts';
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
    if (++nodes > 20000 || depth > 12) return invalid();
    if (value === null || typeof value === 'boolean') return value;
    if (typeof value === 'number') return uint(value, Number.MAX_SAFE_INTEGER) ? value : invalid();
    if (typeof value === 'string') { chars += value.length; return chars <= 200000 ? value : invalid(); }
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



type Command = Readonly<{ id: string; expectedRevision: number; targetId: string; baseDamage: number; governorWar: number; eligibilityConfirmed: true }>;
function commandFrom(value: unknown): Command | undefined {
  if (!record(value) || !keys(value, ['id', 'expectedRevision', 'targetId', 'baseDamage', 'governorWar', 'eligibilityConfirmed'])
    || !id(value.id) || !id(value.targetId) || !uint(value.expectedRevision, 255) || !uint(value.baseDamage, 1000000)
    || value.baseDamage === 0 || !uint(value.governorWar, 100) || value.eligibilityConfirmed !== true) return undefined;
  return { id: value.id, expectedRevision: value.expectedRevision, targetId: value.targetId,
    baseDamage: value.baseDamage, governorWar: value.governorWar, eligibilityConfirmed: true };
}
function replay(input: unknown) {
  if (!record(input) || !keys(input, ['schema', 'initialHazard', 'commands']) || input.schema !== 'inferred-counterattack-continuation-v1'
    || !Array.isArray(input.commands) || input.commands.length > 256) return fail('invalid-continuation');
  const initial = readInferredPositiveHazardLedger(input.initialHazard);
  if (!initial.ok) return initial;
  const balances = initial.balances.map(target => ({ ...target })), commands: Command[] = [], receipts = [], seen = new Set<string>();
  for (const entry of input.commands) {
    const command = commandFrom(entry);
    if (!command || command.expectedRevision !== commands.length || seen.has(command.id)) return fail('invalid-command-history');
    const index = balances.findIndex(target => target.id === command.targetId), target = balances[index];
    if (!target || target.kind !== 'troop') return fail('unknown-positive-synthetic-troop');
    const request = projectInferredGovernorCounterattack(command.baseDamage, command.governorWar);
    if (!request.ok) return request;
    if (request.requestedDamage >= target.value) return fail('zero-or-terminal-result-excluded');
    const after = target.value - request.requestedDamage;
    receipts.push({ commandId: command.id, targetId: target.id, before: target.value, after,
      requestedDamage: request.requestedDamage, governorWar: command.governorWar, baseDamage: command.baseDamage });
    balances[index] = { ...target, value: after }; commands.push(command); seen.add(command.id);
  }
  return frozen({ ok: true as const, state: { schema: 'inferred-counterattack-continuation-v1' as const, initialHazard: initial.state, commands },
    balances, receipts, revision: commands.length, originalHazardModified: false as const, nativeRuleVerified: false as const,
    battleFinalizerApplied: false as const, realPersonsModified: false as const });
}
export function readInferredCounterattackLedger(input: unknown) {
  try { return replay(detach(input)); } catch { return fail('invalid-data-input'); }
}
export function createInferredCounterattackLedger(initialHazard: unknown) {
  return readInferredCounterattackLedger({ schema: 'inferred-counterattack-continuation-v1', initialHazard, commands: [] });
}
export function executeInferredCounterattack(input: unknown, rawCommand: unknown) {
  const current = readInferredCounterattackLedger(input);
  if (!current.ok) return current;
  let clean: unknown;
  try { clean = detach(rawCommand); } catch { return fail('invalid-data-command'); }
  const command = commandFrom(clean);
  if (!command || command.expectedRevision !== current.revision || current.revision >= 256) return fail('invalid-command-or-capacity');
  return readInferredCounterattackLedger({ ...current.state, commands: [...current.state.commands, command] });
}
export function saveInferredCounterattackLedger(input: unknown) {
  const result = readInferredCounterattackLedger(input);
  return result.ok ? Object.freeze({ ok: true as const, json: JSON.stringify(result.state) }) : result;
}
export function loadInferredCounterattackLedger(json: unknown) {
  if (typeof json !== 'string' || json.length > 200000) return fail('invalid-save');
  try { return readInferredCounterattackLedger(JSON.parse(json)); } catch { return fail('invalid-save'); }
}
