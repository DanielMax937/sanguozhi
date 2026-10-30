/** Explicit synthetic confiscation continuation; never real-person allegiance. */
import { readInferredTreasureLedger } from './inferred-treasure-ledger.ts';
import { projectInferredCommandAP } from './inferred-independent-planning.ts';
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



type Command = Readonly<{ id: string; expectedRevision: number; itemId: string; eligibilityConfirmed: true }>;
function commandFrom(value: unknown): Command | undefined {
  if (!record(value) || !keys(value, ['id', 'expectedRevision', 'itemId', 'eligibilityConfirmed'])
    || !id(value.id) || !id(value.itemId) || !uint(value.expectedRevision, 63) || value.eligibilityConfirmed !== true) return undefined;
  return { id: value.id, expectedRevision: value.expectedRevision, itemId: value.itemId, eligibilityConfirmed: true };
}
function replay(value: unknown) {
  if (!record(value) || !keys(value, ['schema', 'initialTreasury', 'commands']) || value.schema !== 'inferred-confiscation-continuation-v1'
    || !Array.isArray(value.commands) || value.commands.length > 64) return fail('invalid-continuation');
  const initial = readInferredTreasureLedger(value.initialTreasury);
  if (!initial.ok) return initial;
  const cost = projectInferredCommandAP('confiscateTreasure', false);
  if (!cost.ok) return cost;
  let actionPoints = initial.actionPoints;
  const officers = initial.officers.map(officer => ({ ...officer })), items = initial.items.map(item => ({ ...item }));
  const commands: Command[] = [], receipts = [], seen = new Set<string>();
  for (const entry of value.commands) {
    const command = commandFrom(entry);
    if (!command || command.expectedRevision !== commands.length || seen.has(command.id)) return fail('invalid-command-history');
    const itemIndex = items.findIndex(item => item.id === command.itemId);
    if (itemIndex < 0) return fail('unknown-item');
    const item = items[itemIndex]!;
    if (item.holder === null) return fail('item-already-in-treasury');
    const officerIndex = officers.findIndex(officer => officer.id === item.holder), officer = officers[officerIndex];
    if (!officer) return fail('unknown-holder');
    if (actionPoints < cost.requestedAP) return fail('insufficient-synthetic-ap');
    // New named engineering inference: confiscation loses item value, not a native reverse of grant.
    const loss = item.value;
    if (officer.loyalty <= loss) return fail('zero-loyalty-or-allegiance-result-excluded');
    receipts.push({ commandId: command.id, itemId: item.id, holderBefore: officer.id, holderAfter: null,
      loyaltyBefore: officer.loyalty, loyaltyAfter: officer.loyalty - loss, inferredLoss: loss,
      apBefore: actionPoints, apAfter: actionPoints - cost.requestedAP });
    items[itemIndex] = { ...item, holder: null };
    officers[officerIndex] = { ...officer, loyalty: officer.loyalty - loss };
    actionPoints -= cost.requestedAP; commands.push(command); seen.add(command.id);
  }
  return frozen({ ok: true as const, state: { schema: 'inferred-confiscation-continuation-v1' as const, initialTreasury: initial.state, commands },
    items, officers, actionPoints, revision: commands.length, receipts, originalTreasuryModified: false as const,
    nativeConfiscationPenaltyVerified: false as const, realPersonAllegianceChanged: false as const });
}
export function readInferredConfiscationLedger(input: unknown) {
  try { return replay(detach(input)); } catch { return fail('invalid-data-input'); }
}
export function createInferredConfiscationLedger(initialTreasury: unknown) {
  return readInferredConfiscationLedger({ schema: 'inferred-confiscation-continuation-v1', initialTreasury, commands: [] });
}
export function executeInferredConfiscation(input: unknown, rawCommand: unknown) {
  const current = readInferredConfiscationLedger(input);
  if (!current.ok) return current;
  let clean: unknown;
  try { clean = detach(rawCommand); } catch { return fail('invalid-data-command'); }
  const command = commandFrom(clean);
  if (!command || command.expectedRevision !== current.revision || current.revision >= 64) return fail('invalid-command-or-capacity');
  return readInferredConfiscationLedger({ ...current.state, commands: [...current.state.commands, command] });
}
export function saveInferredConfiscationLedger(input: unknown) {
  const result = readInferredConfiscationLedger(input);
  return result.ok ? Object.freeze({ ok: true as const, json: JSON.stringify(result.state) }) : result;
}
export function loadInferredConfiscationLedger(json: unknown) {
  if (typeof json !== 'string' || json.length > 100000) return fail('invalid-save');
  try { return readInferredConfiscationLedger(JSON.parse(json)); } catch { return fail('invalid-save'); }
}
