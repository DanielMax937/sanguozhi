/** Opt-in two-fragment atomic dispatch; not a global world clock or identity mapper. */
import { readInferredPositiveHazardLedger, executeInferredPositiveHazard } from './inferred-positive-hazard-ledger.ts';
import { readInferredPositiveResourceLedger, executeInferredPositiveResource } from './inferred-positive-resource-ledger.ts';
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
    if (++nodes > 40000 || depth > 20) return invalid();
    if (value === null || typeof value === 'boolean') return value;
    if (typeof value === 'number') return uint(value, Number.MAX_SAFE_INTEGER) ? value : invalid();
    if (typeof value === 'string') { chars += value.length; return chars <= 400000 ? value : invalid(); }
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



type Command = Readonly<{ id: string; expectedRevision: number; hazardCommand: unknown; resourceCommand: unknown }>;
function commandFrom(value: unknown): Command | undefined {
  if (!record(value) || !keys(value, ['id', 'expectedRevision', 'hazardCommand', 'resourceCommand'])
    || !id(value.id) || !uint(value.expectedRevision, 127)
    || (value.hazardCommand === null && value.resourceCommand === null)
    || (value.hazardCommand !== null && !record(value.hazardCommand))
    || (value.resourceCommand !== null && !record(value.resourceCommand))) return undefined;
  return { id: value.id, expectedRevision: value.expectedRevision, hazardCommand: value.hazardCommand, resourceCommand: value.resourceCommand };
}
function replay(input: unknown) {
  if (!record(input) || !keys(input, ['schema', 'initialHazard', 'initialResources', 'commands'])
    || input.schema !== 'inferred-safe-composite-ledger-v1' || !Array.isArray(input.commands) || input.commands.length > 128) return fail('invalid-composite');
  const initialHazard = readInferredPositiveHazardLedger(input.initialHazard), initialResources = readInferredPositiveResourceLedger(input.initialResources);
  if (!initialHazard.ok) return fail(`initial-hazard:${initialHazard.reason}`);
  if (!initialResources.ok) return fail(`initial-resources:${initialResources.reason}`);
  let hazard = initialHazard, resources = initialResources;
  const commands: Command[] = [], receipts = [], seen = new Set<string>();
  for (const entry of input.commands) {
    const command = commandFrom(entry);
    if (!command || command.expectedRevision !== commands.length || seen.has(command.id)) return fail('invalid-composite-command-history');
    const proposedHazard = command.hazardCommand === null ? hazard : executeInferredPositiveHazard(hazard.state, command.hazardCommand);
    if (!proposedHazard.ok) return fail(`hazard-part:${proposedHazard.reason}`);
    const proposedResources = command.resourceCommand === null ? resources : executeInferredPositiveResource(resources.state, command.resourceCommand);
    if (!proposedResources.ok) return fail(`resource-part:${proposedResources.reason}`);
    // No old state is mutated by either service; publish both new fragments only after both succeeded.
    receipts.push({ commandId: command.id, hazardRevisionBefore: hazard.revision, hazardRevisionAfter: proposedHazard.revision,
      resourceRevisionBefore: resources.revision, resourceRevisionAfter: proposedResources.revision,
      hazardReceipt: command.hazardCommand === null ? null : proposedHazard.receipts[proposedHazard.receipts.length - 1]!,
      resourceReceipt: command.resourceCommand === null ? null : proposedResources.receipts[proposedResources.receipts.length - 1]! });
    hazard = proposedHazard; resources = proposedResources; commands.push(command); seen.add(command.id);
  }
  return frozen({ ok: true as const, state: { schema: 'inferred-safe-composite-ledger-v1' as const,
    initialHazard: initialHazard.state, initialResources: initialResources.state, commands },
    hazard, resources, receipts, revision: commands.length, globalClockAdvanced: false as const,
    crossFragmentIdentityEstablished: false as const, campaignWorldWritten: false as const });
}
export function readInferredSafeCompositeLedger(input: unknown) {
  try { return replay(detach(input)); } catch { return fail('invalid-data-input'); }
}
export function createInferredSafeCompositeLedger(initialHazard: unknown, initialResources: unknown) {
  return readInferredSafeCompositeLedger({ schema: 'inferred-safe-composite-ledger-v1', initialHazard, initialResources, commands: [] });
}
export function executeInferredSafeComposite(input: unknown, rawCommand: unknown) {
  const current = readInferredSafeCompositeLedger(input);
  if (!current.ok) return current;
  let clean: unknown;
  try { clean = detach(rawCommand); } catch { return fail('invalid-data-command'); }
  const command = commandFrom(clean);
  if (!command || command.expectedRevision !== current.revision || current.revision >= 128) return fail('invalid-command-or-capacity');
  return readInferredSafeCompositeLedger({ ...current.state, commands: [...current.state.commands, command] });
}
export function saveInferredSafeCompositeLedger(input: unknown) {
  const result = readInferredSafeCompositeLedger(input);
  if (!result.ok) return result;
  const json = JSON.stringify(result.state);
  return json.length <= 400000 ? Object.freeze({ ok: true as const, json }) : fail('save-too-large');
}
export function loadInferredSafeCompositeLedger(json: unknown) {
  if (typeof json !== 'string' || json.length > 400000) return fail('invalid-save');
  try { return readInferredSafeCompositeLedger(JSON.parse(json)); } catch { return fail('invalid-save'); }
}
