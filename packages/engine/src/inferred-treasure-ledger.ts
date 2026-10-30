/** Synthetic treasury grants only; no real officer, confiscation or campaign mutation. */
import { projectInferredTreasureLoyalty } from './inferred-independent-planning.ts';
type Officer = Readonly<{ id: string; loyalty: number }>;
type Item = Readonly<{ id: string; value: number; holder: string | null }>;
type Command = Readonly<{ id: string; expectedRevision: number; itemId: string; officerId: string; eligibilityConfirmed: true }>;
type State = Readonly<{ schema: 'inferred-synthetic-treasure-ledger-v1'; initialAP: number;
  initialOfficers: readonly Officer[]; initialItems: readonly Item[]; commands: readonly Command[] }>;
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


function commandFrom(input: unknown): Command | undefined {
  if (!record(input) || !keys(input, ['id', 'expectedRevision', 'itemId', 'officerId', 'eligibilityConfirmed'])
    || !id(input.id) || !uint(input.expectedRevision, 63) || !id(input.itemId) || !id(input.officerId)
    || input.eligibilityConfirmed !== true) return undefined;
  return { id: input.id, expectedRevision: input.expectedRevision, itemId: input.itemId, officerId: input.officerId, eligibilityConfirmed: true };
}
function replay(input: unknown) {
  if (!record(input) || !keys(input, ['schema', 'initialAP', 'initialOfficers', 'initialItems', 'commands'])
    || input.schema !== 'inferred-synthetic-treasure-ledger-v1' || !uint(input.initialAP, 1000000)
    || !Array.isArray(input.initialOfficers) || input.initialOfficers.length < 1 || input.initialOfficers.length > 64
    || !Array.isArray(input.initialItems) || input.initialItems.length < 1 || input.initialItems.length > 64
    || !Array.isArray(input.commands) || input.commands.length > 64) return fail('invalid-ledger');
  const initialOfficers: Officer[] = [], names = new Set<string>();
  for (const officer of input.initialOfficers) {
    if (!record(officer) || !keys(officer, ['id', 'loyalty']) || !id(officer.id) || names.has(officer.id)
      || !uint(officer.loyalty, 255) || officer.loyalty === 0) return fail('invalid-synthetic-officer');
    names.add(officer.id); initialOfficers.push({ id: officer.id, loyalty: officer.loyalty });
  }
  const initialItems: Item[] = [], itemIds = new Set<string>();
  for (const item of input.initialItems) {
    if (!record(item) || !keys(item, ['id', 'value', 'holder']) || !id(item.id) || itemIds.has(item.id)
      || !uint(item.value, 255) || (item.holder !== null && (!id(item.holder) || !names.has(item.holder)))) return fail('invalid-synthetic-item');
    itemIds.add(item.id); initialItems.push({ id: item.id, value: item.value, holder: item.holder });
  }
  let actionPoints = input.initialAP;
  const officers = initialOfficers.map(officer => ({ ...officer })), items = initialItems.map(item => ({ ...item }));
  const commands: Command[] = [], receipts = [], commandIds = new Set<string>();
  for (const entry of input.commands) {
    const command = commandFrom(entry);
    if (!command || command.expectedRevision !== commands.length || commandIds.has(command.id)) return fail('invalid-command-history');
    const itemIndex = items.findIndex(item => item.id === command.itemId), officerIndex = officers.findIndex(officer => officer.id === command.officerId);
    if (itemIndex < 0 || officerIndex < 0) return fail('unknown-synthetic-item-or-officer');
    const item = items[itemIndex]!, officer = officers[officerIndex]!;
    if (item.holder !== null) return fail('item-not-in-treasury');
    const request = projectInferredTreasureLoyalty(officer.loyalty, item.value, true);
    if (!request.ok) return request;
    if (actionPoints < request.actionPointsRequest) return fail('insufficient-synthetic-ap');
    receipts.push({ commandId: command.id, itemId: item.id, officerId: officer.id, holderBefore: null, holderAfter: officer.id,
      apBefore: actionPoints, apAfter: actionPoints - request.actionPointsRequest, goldSpent: 0,
      loyaltyBefore: officer.loyalty, loyaltyAfter: request.projectedTrueLoyalty, appliedGain: request.appliedProjection,
      displayLoyaltyAfter: request.projectedDisplayLoyalty });
    // Exactly one item moves; loyalty and AP commit together, after all validations.
    items[itemIndex] = { ...item, holder: officer.id };
    officers[officerIndex] = { ...officer, loyalty: request.projectedTrueLoyalty };
    actionPoints -= request.actionPointsRequest; commands.push(command); commandIds.add(command.id);
  }
  const state: State = { schema: 'inferred-synthetic-treasure-ledger-v1', initialAP: input.initialAP, initialOfficers, initialItems, commands };
  return frozen({ ok: true as const, state, actionPoints, officers, items, receipts, revision: commands.length,
    campaignWorldWritten: false as const, realPersonAllegianceChanged: false as const, confiscationImplemented: false as const });
}
export function readInferredTreasureLedger(input: unknown) {
  try { return replay(detach(input)); } catch { return fail('invalid-data-input'); }
}
export function createInferredTreasureLedger(initialAP: unknown, initialOfficers: unknown, initialItems: unknown) {
  return readInferredTreasureLedger({ schema: 'inferred-synthetic-treasure-ledger-v1', initialAP, initialOfficers, initialItems, commands: [] });
}
export function executeInferredTreasureGrant(input: unknown, rawCommand: unknown) {
  const current = readInferredTreasureLedger(input);
  if (!current.ok) return current;
  let detached: unknown;
  try { detached = detach(rawCommand); } catch { return fail('invalid-data-command'); }
  const command = commandFrom(detached);
  if (!command || command.expectedRevision !== current.revision || current.revision >= 64) return fail('invalid-command-or-capacity');
  if (current.state.commands.some(entry => entry.id === command.id)) return fail('duplicate-command');
  return readInferredTreasureLedger({ ...current.state, commands: [...current.state.commands, command] });
}
export function saveInferredTreasureLedger(input: unknown) {
  const validated = readInferredTreasureLedger(input);
  return validated.ok ? Object.freeze({ ok: true as const, json: JSON.stringify(validated.state) }) : validated;
}
export function loadInferredTreasureLedger(json: unknown) {
  if (typeof json !== 'string' || json.length > 100000) return fail('invalid-save');
  try { return readInferredTreasureLedger(JSON.parse(json)); } catch { return fail('invalid-save'); }
}
