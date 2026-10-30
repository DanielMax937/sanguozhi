/** Opt-in synthetic damage ledger. Never a native or campaign finalizer. */
import { projectInferredStarvation } from './inferred-rule-requests.ts';
import { projectInferredStandingFire, projectInferredRockfall } from './inferred-combat-requests.ts';

type Target = Readonly<{ id: string; kind: 'troop' | 'building'; value: number }>;
type DamageCommand = Readonly<{ id: string; expectedRevision: number; targetId: string;
  kind: 'standing-fire' | 'rockfall' | 'starvation'; draw: number; pathbreaker: boolean; eligibilityConfirmed: true }>;
type Ledger = Readonly<{ schema: 'inferred-positive-hazard-ledger-v1'; initial: readonly Target[]; commands: readonly DamageCommand[] }>;
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
function parseCommand(value: unknown): DamageCommand | undefined {
  if (!record(value) || !keys(value, ['id', 'expectedRevision', 'targetId', 'kind', 'draw', 'pathbreaker', 'eligibilityConfirmed'])
    || !id(value.id) || !id(value.targetId) || !uint(value.expectedRevision, 255) || !uint(value.draw, 999)
    || (value.kind !== 'standing-fire' && value.kind !== 'rockfall' && value.kind !== 'starvation') || typeof value.pathbreaker !== 'boolean'
    || value.eligibilityConfirmed !== true) return undefined;
  return { id: value.id, expectedRevision: value.expectedRevision, targetId: value.targetId, kind: value.kind,
    draw: value.draw, pathbreaker: value.pathbreaker, eligibilityConfirmed: true };
}
function apply(balances: Target[], command: DamageCommand) {
  const index = balances.findIndex(target => target.id === command.targetId);
  if (index < 0) return fail('unknown-synthetic-target');
  const target = balances[index]!;
  if (command.kind === 'standing-fire' && (target.kind !== 'troop' || command.pathbreaker)) return fail('unsupported-fire-target-or-modifier');
  if (command.kind === 'starvation') {
    if (target.kind !== 'troop' || command.pathbreaker || command.draw < 1 || command.draw > 360) return fail('unsupported-starvation-request');
    const request = projectInferredStarvation(target.value, command.draw);
    if (!request.ok) return request;
    if (request.projectedRemaining === 0) return fail('zero-or-terminal-result-excluded');
    balances[index] = { ...target, value: request.projectedRemaining };
    return Object.freeze({ ok: true as const, before: target.value, after: request.projectedRemaining, damage: request.requestedLoss });
  }
  const request = command.kind === 'standing-fire'
    ? projectInferredStandingFire(command.draw, true)
    : projectInferredRockfall(target.kind, command.draw, command.pathbreaker);
  if (!request.ok) return request;
  if (request.requestedDamage >= target.value) return fail('zero-or-terminal-result-excluded');
  balances[index] = { ...target, value: target.value - request.requestedDamage };
  return Object.freeze({ ok: true as const, before: target.value, after: balances[index]!.value, damage: request.requestedDamage });
}

/** Full journal replay; snapshots cannot inject extra balance, ownership or people fields. */
function replay(input: unknown) {
  if (!record(input) || !keys(input, ['schema', 'initial', 'commands']) || input.schema !== 'inferred-positive-hazard-ledger-v1'
    || !Array.isArray(input.initial) || input.initial.length < 1 || input.initial.length > 64
    || !Array.isArray(input.commands) || input.commands.length > 256) return fail('invalid-ledger');
  const initial: Target[] = [], seen = new Set<string>();
  for (const target of input.initial) {
    if (!record(target) || !keys(target, ['id', 'kind', 'value']) || !id(target.id) || seen.has(target.id)
      || (target.kind !== 'troop' && target.kind !== 'building') || !uint(target.value, 1000000) || target.value === 0) return fail('invalid-initial-target');
    seen.add(target.id); initial.push({ id: target.id, kind: target.kind, value: target.value });
  }
  const balances = initial.map(target => ({ ...target })), commands: DamageCommand[] = [], receipts = [], commandIds = new Set<string>();
  for (const entry of input.commands) {
    const command = parseCommand(entry);
    if (!command || command.expectedRevision !== commands.length || commandIds.has(command.id)) return fail('invalid-command-history');
    const result = apply(balances, command);
    if (!result.ok) return result;
    commands.push(command); commandIds.add(command.id); receipts.push({ commandId: command.id, targetId: command.targetId, ...result });
  }
  const state: Ledger = { schema: 'inferred-positive-hazard-ledger-v1', initial, commands };
  return frozen({ ok: true as const, state, balances, receipts, revision: commands.length,
    nativeRulesVerified: false as const, campaignWorldWritten: false as const, terminalResultsSupported: false as const });
}
export function readInferredPositiveHazardLedger(input: unknown) {
  try { return replay(detach(input)); } catch { return fail('invalid-data-input'); }
}
export function createInferredPositiveHazardLedger(initial: unknown) {
  return readInferredPositiveHazardLedger({ schema: 'inferred-positive-hazard-ledger-v1', initial, commands: [] });
}
export function executeInferredPositiveHazard(input: unknown, rawCommand: unknown) {
  const current = readInferredPositiveHazardLedger(input);
  if (!current.ok) return current;
  let cleanCommand: unknown;
  try { cleanCommand = detach(rawCommand); } catch { return fail('invalid-data-command'); }
  const command = parseCommand(cleanCommand);
  if (!command || command.expectedRevision !== current.revision) return fail('invalid-command-or-stale-revision');
  if (current.revision >= 256) return fail('journal-capacity-reached');
  if (current.state.commands.some(entry => entry.id === command.id)) return fail('duplicate-command');
  return readInferredPositiveHazardLedger({ ...current.state, commands: [...current.state.commands, command] });
}
export function saveInferredPositiveHazardLedger(input: unknown) {
  const validated = readInferredPositiveHazardLedger(input);
  return validated.ok ? Object.freeze({ ok: true as const, json: JSON.stringify(validated.state) }) : validated;
}
export function loadInferredPositiveHazardLedger(json: unknown) {
  if (typeof json !== 'string' || json.length > 100000) return fail('invalid-save');
  try { return readInferredPositiveHazardLedger(JSON.parse(json)); } catch { return fail('invalid-save'); }
}
