/** Atomic opt-in batches over the existing positive single-target hazard ledger. */
import { createInferredPositiveHazardLedger, executeInferredPositiveHazard } from './inferred-positive-hazard-ledger.ts';
type Target = Readonly<{ id: string; kind: 'troop' | 'building'; value: number }>;
type Hit = Readonly<{ targetId: string; draw: number; pathbreaker: boolean; eligibilityConfirmed: true }>;
type Batch = Readonly<{ id: string; expectedRevision: number; targets: readonly Hit[] }>;
type State = Readonly<{ schema: 'inferred-multi-rockfall-ledger-v1'; initial: readonly Target[]; commands: readonly Batch[] }>;
type Frozen<T> = T extends object ? { readonly [K in keyof T]: Frozen<T[K]> } : T;
const fail = (reason: string) => Object.freeze({ ok: false as const, reason });
const uint = (v: unknown, max: number): v is number => typeof v === 'number' && Number.isSafeInteger(v) && !Object.is(v, -0) && v >= 0 && v <= max;
const record = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === 'object' && !Array.isArray(v);
const keys = (v: Record<string, unknown>, expected: readonly string[]) => Object.keys(v).length === expected.length && expected.every(k => Object.hasOwn(v, k));
const id = (v: unknown): v is string => typeof v === 'string' && /^synthetic-[a-z0-9-]{1,48}$/.test(v);
function frozen<T>(value: T): Frozen<T> {
  if (value !== null && typeof value === 'object') { for (const child of Object.values(value)) frozen(child); Object.freeze(value); }
  return value as Frozen<T>;
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




function batchFrom(input: unknown): Batch | undefined {
  if (!record(input) || !keys(input, ['id', 'expectedRevision', 'targets']) || !id(input.id) || !uint(input.expectedRevision, 63)
    || !Array.isArray(input.targets) || input.targets.length < 1 || input.targets.length > 16) return undefined;
  const targets: Hit[] = [];
  let previous = '';
  for (const target of input.targets) {
    if (!record(target) || !keys(target, ['targetId', 'draw', 'pathbreaker', 'eligibilityConfirmed'])
      || !id(target.targetId) || target.targetId <= previous || !uint(target.draw, 999)
      || typeof target.pathbreaker !== 'boolean' || target.eligibilityConfirmed !== true) return undefined;
    targets.push({ targetId: target.targetId, draw: target.draw, pathbreaker: target.pathbreaker, eligibilityConfirmed: true });
    previous = target.targetId;
  }
  return { id: input.id, expectedRevision: input.expectedRevision, targets };
}
function replay(input: unknown) {
  if (!record(input) || !keys(input, ['schema', 'initial', 'commands']) || input.schema !== 'inferred-multi-rockfall-ledger-v1'
    || !Array.isArray(input.commands) || input.commands.length > 64) return fail('invalid-outer-ledger');
  const initialized = createInferredPositiveHazardLedger(input.initial);
  if (!initialized.ok) return initialized;
  let inner = initialized;
  const commands: Batch[] = [], receipts = [], commandIds = new Set<string>();
  for (const raw of input.commands) {
    const batch = batchFrom(raw);
    if (!batch || batch.expectedRevision !== commands.length || commandIds.has(batch.id)) return fail('invalid-or-duplicate-batch');
    if (inner.revision + batch.targets.length > 256) return fail('inner-journal-capacity-entire-batch-rejected');
    const revisionBefore = inner.revision;
    for (let index = 0; index < batch.targets.length; index++) {
      const hit = batch.targets[index]!;
      const result = executeInferredPositiveHazard(inner.state, {
        id: `synthetic-rockfall-${commands.length}-${index}`, expectedRevision: inner.revision,
        kind: 'rockfall', targetId: hit.targetId, draw: hit.draw, pathbreaker: hit.pathbreaker, eligibilityConfirmed: true,
      });
      // Intermediate candidates remain local. Any rejected target rejects the complete outer transaction.
      if (!result.ok) return fail(`batch-target-${index}:${result.reason}`);
      inner = result;
    }
    receipts.push({ batchId: batch.id, outerRevisionBefore: commands.length, outerRevisionAfter: commands.length + 1,
      innerRevisionBefore: revisionBefore, innerRevisionAfter: inner.revision,
      targets: batch.targets, effects: inner.receipts.slice(revisionBefore) });
    commands.push(batch); commandIds.add(batch.id);
  }
  const state: State = { schema: 'inferred-multi-rockfall-ledger-v1', initial: initialized.state.initial, commands };
  return frozen({ ok: true as const, state, revision: commands.length, innerState: inner.state, balances: inner.balances, receipts,
    orderPolicy: 'explicit-draws-target-id-ascending-v1' as const,
    campaignWorldWritten: false as const, nativeCallerOrderVerified: false as const,
    forcedDisplacementApplied: false as const, terminalResultsSupported: false as const });
}
export function readInferredMultiRockfall(input: unknown) {
  try { return replay(detach(input)); } catch { return fail('invalid-data-input'); }
}
export function createInferredMultiRockfall(initial: unknown) {
  return readInferredMultiRockfall({ schema: 'inferred-multi-rockfall-ledger-v1', initial, commands: [] });
}
export function executeInferredMultiRockfall(input: unknown, rawBatch: unknown) {
  const current = readInferredMultiRockfall(input);
  if (!current.ok) return current;
  let clean: unknown;
  try { clean = detach(rawBatch); } catch { return fail('invalid-data-batch'); }
  const batch = batchFrom(clean);
  if (!batch || batch.expectedRevision !== current.revision || current.revision >= 64) return fail('invalid-batch-or-stale-revision');
  if (current.state.commands.some(entry => entry.id === batch.id)) return fail('duplicate-batch');
  return readInferredMultiRockfall({ ...current.state, commands: [...current.state.commands, batch] });
}
export function saveInferredMultiRockfall(input: unknown) {
  const result = readInferredMultiRockfall(input);
  return result.ok ? Object.freeze({ ok: true as const, json: JSON.stringify(result.state) }) : result;
}
export function loadInferredMultiRockfall(json: unknown) {
  if (typeof json !== 'string' || json.length > 100000) return fail('invalid-save');
  try { return readInferredMultiRockfall(JSON.parse(json)); } catch { return fail('invalid-save'); }
}
