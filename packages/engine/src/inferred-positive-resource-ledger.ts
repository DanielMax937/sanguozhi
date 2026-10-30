/** Explicit synthetic food-raid/gate-port repair accounting, not a combat finalizer. */
import { projectInferredFoodRaid, projectInferredGatePortRepair } from './inferred-combat-requests.ts';
type Account = Readonly<{ id: string; kind: 'food' | 'gate-port-durability'; value: number; capacity: number }>;
type Raid = Readonly<{ kind: 'food-raid'; id: string; expectedRevision: number; sourceId: string; targetId: string;
  attackPanel: number; ownTroops: number; draw: number; eligibilityConfirmed: true }>;
type Repair = Readonly<{ kind: 'gate-port-repair'; id: string; expectedRevision: number; targetId: string;
  politics: number; governorPresent: boolean; eligibilityConfirmed: true }>;
type Command = Raid | Repair;
type State = Readonly<{ schema: 'inferred-positive-resource-ledger-v1'; initial: readonly Account[]; commands: readonly Command[] }>;
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



function commandFrom(value: unknown): Command | undefined {
  if (!record(value) || !id(value.id) || !uint(value.expectedRevision, 255) || !id(value.targetId) || value.eligibilityConfirmed !== true) return undefined;
  if (value.kind === 'food-raid' && keys(value, ['kind', 'id', 'expectedRevision', 'sourceId', 'targetId', 'attackPanel', 'ownTroops', 'draw', 'eligibilityConfirmed'])
    && id(value.sourceId) && value.sourceId !== value.targetId && uint(value.attackPanel, 1000000) && uint(value.ownTroops, 1000000)
    && value.ownTroops > 0 && uint(value.draw, 10)) return { kind: 'food-raid', id: value.id, expectedRevision: value.expectedRevision,
      sourceId: value.sourceId, targetId: value.targetId, attackPanel: value.attackPanel, ownTroops: value.ownTroops, draw: value.draw, eligibilityConfirmed: true };
  if (value.kind === 'gate-port-repair' && keys(value, ['kind', 'id', 'expectedRevision', 'targetId', 'politics', 'governorPresent', 'eligibilityConfirmed'])
    && uint(value.politics, 100) && typeof value.governorPresent === 'boolean') return { kind: 'gate-port-repair', id: value.id,
      expectedRevision: value.expectedRevision, targetId: value.targetId, politics: value.politics, governorPresent: value.governorPresent, eligibilityConfirmed: true };
  return undefined;
}
function apply(accounts: Account[], command: Command) {
  const targetIndex = accounts.findIndex(account => account.id === command.targetId);
  if (targetIndex < 0) return fail('unknown-synthetic-target');
  const target = accounts[targetIndex]!;
  if (command.kind === 'food-raid') {
    const sourceIndex = accounts.findIndex(account => account.id === command.sourceId);
    if (sourceIndex < 0 || target.kind !== 'food' || accounts[sourceIndex]!.kind !== 'food') return fail('invalid-food-accounts');
    const source = accounts[sourceIndex]!;
    const request = projectInferredFoodRaid(command.attackPanel, command.ownTroops, source.value, target.value, target.capacity, command.draw, true);
    if (!request.ok) return request;
    const amount = request.proposedTransfer;
    if (amount <= 0 || source.value - amount <= 0) return fail('zero-transfer-or-empty-source-excluded');
    accounts[sourceIndex] = { ...source, value: source.value - amount };
    accounts[targetIndex] = { ...target, value: target.value + amount };
    return Object.freeze({ ok: true as const, kind: command.kind, sourceBefore: source.value, sourceAfter: source.value - amount,
      targetBefore: target.value, targetAfter: target.value + amount, amount });
  }
  if (target.kind !== 'gate-port-durability') return fail('not-an-existing-gate-port');
  const request = projectInferredGatePortRepair(command.politics, command.governorPresent);
  if (!request.ok) return request;
  const amount = Math.min(request.requestedRepair, target.capacity - target.value);
  if (amount <= 0) return fail('no-positive-repair');
  accounts[targetIndex] = { ...target, value: target.value + amount };
  return Object.freeze({ ok: true as const, kind: command.kind, targetBefore: target.value, targetAfter: target.value + amount, amount });
}
function replay(input: unknown) {
  if (!record(input) || !keys(input, ['schema', 'initial', 'commands']) || input.schema !== 'inferred-positive-resource-ledger-v1'
    || !Array.isArray(input.initial) || input.initial.length < 1 || input.initial.length > 64
    || !Array.isArray(input.commands) || input.commands.length > 256) return fail('invalid-ledger');
  const initial: Account[] = [], names = new Set<string>();
  for (const account of input.initial) {
    if (!record(account) || !keys(account, ['id', 'kind', 'value', 'capacity']) || !id(account.id) || names.has(account.id)
      || (account.kind !== 'food' && account.kind !== 'gate-port-durability') || !uint(account.capacity, 1000000)
      || !uint(account.value, account.capacity) || account.value === 0) return fail('invalid-positive-account');
    names.add(account.id); initial.push({ id: account.id, kind: account.kind, value: account.value, capacity: account.capacity });
  }
  const accounts = initial.map(account => ({ ...account })), commands: Command[] = [], receipts = [], commandIds = new Set<string>();
  for (const entry of input.commands) {
    const command = commandFrom(entry);
    if (!command || command.expectedRevision !== commands.length || commandIds.has(command.id)) return fail('invalid-command-history');
    const result = apply(accounts, command);
    if (!result.ok) return result;
    receipts.push({ commandId: command.id, targetId: command.targetId, ...(command.kind === 'food-raid' ? { sourceId: command.sourceId } : {}), ...result });
    commands.push(command); commandIds.add(command.id);
  }
  const state: State = { schema: 'inferred-positive-resource-ledger-v1', initial, commands };
  return frozen({ ok: true as const, state, accounts, receipts, revision: commands.length, campaignWorldWritten: false as const,
    nativeRuleVerified: false as const, damCompletionSupported: false as const });
}
export function readInferredPositiveResourceLedger(input: unknown) {
  try { return replay(detach(input)); } catch { return fail('invalid-data-input'); }
}
export function createInferredPositiveResourceLedger(initial: unknown) {
  return readInferredPositiveResourceLedger({ schema: 'inferred-positive-resource-ledger-v1', initial, commands: [] });
}
export function executeInferredPositiveResource(input: unknown, rawCommand: unknown) {
  const current = readInferredPositiveResourceLedger(input);
  if (!current.ok) return current;
  let detached: unknown;
  try { detached = detach(rawCommand); } catch { return fail('invalid-data-command'); }
  const command = commandFrom(detached);
  if (!command || command.expectedRevision !== current.revision || current.revision >= 256) return fail('invalid-command-or-capacity');
  if (current.state.commands.some(entry => entry.id === command.id)) return fail('duplicate-command');
  return readInferredPositiveResourceLedger({ ...current.state, commands: [...current.state.commands, command] });
}
export function saveInferredPositiveResourceLedger(input: unknown) {
  const validated = readInferredPositiveResourceLedger(input);
  return validated.ok ? Object.freeze({ ok: true as const, json: JSON.stringify(validated.state) }) : validated;
}
export function loadInferredPositiveResourceLedger(json: unknown) {
  if (typeof json !== 'string' || json.length > 100000) return fail('invalid-save');
  try { return readInferredPositiveResourceLedger(JSON.parse(json)); } catch { return fail('invalid-save'); }
}
