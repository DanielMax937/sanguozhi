/** Opt-in safe synthetic false-report movement; no return/dissolution finalizer. */
import { createHazardState, executeHazardCommand } from './terrain-hazard-lifecycle.ts';
import type { HazardState } from './terrain-hazard-lifecycle.ts';
type Command = Readonly<{ kind: 'advance'; id: string; expectedRevision: number }>
  | Readonly<{ kind: 'applyFalseReport'; id: string; expectedRevision: number; critical: boolean }>;
type State = Readonly<{ schema: 'inferred-false-report-retreat-v1'; initial: HazardState; retreatCellId: string; commands: readonly Command[] }>;
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






function commandFrom(v: unknown): Command | undefined {
  if (!record(v) || !id(v.id) || !uint(v.expectedRevision, 63)) return undefined;
  if (v.kind === 'advance' && keys(v, ['kind', 'id', 'expectedRevision'])) return { kind: v.kind, id: v.id, expectedRevision: v.expectedRevision };
  if (v.kind === 'applyFalseReport' && keys(v, ['kind', 'id', 'expectedRevision', 'critical']) && typeof v.critical === 'boolean') return { kind: v.kind, id: v.id, expectedRevision: v.expectedRevision, critical: v.critical };
  return undefined;
}
function route(state: HazardState, destination: string): string[] | undefined {
  const cells = new Map(state.map.cells.map(cell => [cell.id, cell]));
  const queue: string[][] = [[state.unit.cellId]], seen = new Set([state.unit.cellId]);
  for (let i = 0; i < queue.length; i++) {
    const path = queue[i]!, last = path[path.length - 1]!;
    if (last === destination) return path;
    for (const next of [...cells.get(last)!.adjacent].sort()) {
      if (!cells.has(next)) return undefined;
      if (!seen.has(next)) { seen.add(next); queue.push([...path, next]); }
    }
  }
  return undefined;
}
function replay(input: unknown) {
  if (!record(input) || !keys(input, ['schema', 'initial', 'retreatCellId', 'commands']) || input.schema !== 'inferred-false-report-retreat-v1'
    || !id(input.retreatCellId) || !Array.isArray(input.commands) || input.commands.length > 64) return fail('invalid-retreat-ledger');
  const created = createHazardState(input.initial);
  if (!created.ok) return created;
  const initial = created.state;
  if (!id(initial.unit.id) || initial.revision !== 0 || initial.turn !== 0 || initial.phase !== 'orders' || initial.unit.acted
    || initial.unit.status !== 'normal' || initial.unit.remaining !== 0 || initial.rng.cursor !== 0 || initial.fires.length !== 0
    || initial.map.cells.length > 64 || initial.rng.draws.length > 256
    || initial.map.cells.some(cell => !id(cell.id) || cell.terrainInfoU32 !== 0 || cell.blocked || cell.unsupportedContext)
    || !initial.map.cells.some(cell => cell.id === input.retreatCellId) || !route(initial, input.retreatCellId)) return fail('unsupported-safe-initial-state');
  let current = initial;
  const commands: Command[] = [], receipts = [], ids = new Set<string>();
  for (const raw of input.commands) {
    const command = commandFrom(raw);
    if (!command || command.expectedRevision !== commands.length || ids.has(command.id)) return fail('invalid-command-history');
    const before = current;
    if (command.kind === 'applyFalseReport') {
      const result = executeHazardCommand(current, { type: 'applyStatus', kind: 'false-report', critical: command.critical, expectedRevision: current.revision });
      if (!result.ok) return result;
      current = result.after;
      receipts.push({ commandId: command.id, kind: command.kind, before, after: current, statusReceipt: result });
    } else {
      let movement: { from: string; to: string; route: string[]; actionConsumed: true; arrived: boolean } | null = null;
      if (current.unit.status === 'false-report' && !current.unit.acted) {
        const path = route(current, input.retreatCellId);
        if (!path) return fail('retreat-unreachable');
        const nextCell = path.length > 1 ? path[1]! : path[0]!;
        // This new profile owns the one-step movement/acted write; old enterCells
        // deliberately continues rejecting abnormal-unit movement everywhere else.
        const moved = createHazardState({ ...current, unit: { ...current.unit, cellId: nextCell, acted: true } });
        if (!moved.ok) return moved;
        movement = { from: current.unit.cellId, to: nextCell, route: path, actionConsumed: true, arrived: nextCell === input.retreatCellId };
        current = moved.state;
      }
      const resolved = executeHazardCommand(current, { type: 'resolveTurn', expectedRevision: current.revision });
      if (!resolved.ok) return resolved;
      const opened = executeHazardCommand(resolved.after, { type: 'beginTurn', expectedRevision: resolved.after.revision });
      if (!opened.ok) return opened;
      current = opened.after;
      receipts.push({ commandId: command.id, kind: command.kind, before, after: current, movement, resolutionReceipt: resolved, openingReceipt: opened });
    }
    commands.push(command); ids.add(command.id);
  }
  const state: State = { schema: 'inferred-false-report-retreat-v1', initial, retreatCellId: input.retreatCellId, commands };
  return frozen({ ok: true as const, state, hazardState: current, turn: current.turn, revision: commands.length, receipts,
    policyId: 'inferred-safe-bfs-one-step-false-report-v1' as const, arrived: current.unit.cellId === input.retreatCellId,
    unitRetained: true as const, campaignWorldWritten: false as const, nativeRetreatVerified: false as const });
}
export function readInferredFalseReportRetreat(input: unknown) { try { return replay(detach(input)); } catch { return fail('invalid-data-input'); } }
export function createInferredFalseReportRetreat(initial: unknown, retreatCellId: unknown) { return readInferredFalseReportRetreat({ schema: 'inferred-false-report-retreat-v1', initial, retreatCellId, commands: [] }); }
export function executeInferredFalseReportRetreat(input: unknown, rawCommand: unknown) {
  const current = readInferredFalseReportRetreat(input); if (!current.ok) return current;
  let clean: unknown; try { clean = detach(rawCommand); } catch { return fail('invalid-data-command'); }
  const command = commandFrom(clean);
  if (!command || command.expectedRevision !== current.revision || current.revision >= 64) return fail('invalid-command-or-capacity');
  if (current.state.commands.some(entry => entry.id === command.id)) return fail('duplicate-command');
  return readInferredFalseReportRetreat({ ...current.state, commands: [...current.state.commands, command] });
}
export function saveInferredFalseReportRetreat(input: unknown) {
  const validated = readInferredFalseReportRetreat(input); if (!validated.ok) return validated;
  const json = JSON.stringify(validated.state);
  return json.length <= 1000000 ? Object.freeze({ ok: true as const, json }) : fail('save-size-limit');
}
export function loadInferredFalseReportRetreat(json: unknown) {
  if (typeof json !== 'string' || json.length > 1000000) return fail('invalid-save');
  try { return readInferredFalseReportRetreat(JSON.parse(json)); } catch { return fail('invalid-save'); }
}
