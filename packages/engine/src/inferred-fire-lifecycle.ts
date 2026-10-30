/** T06 opt-in synthetic fire lifetime and atomic standing-fire tick. Not a native scheduler. */
import { createInferredPositiveHazardLedger, executeInferredPositiveHazard } from './inferred-positive-hazard-ledger.ts';
import { DETACHED_HAZARD_POLICY } from './terrain-hazard-lifecycle.ts';
type Target = { id: string; cellId: string; value: number };
type Fire = { id: string; cellId: string; remainingTicks: number };
type Action = { kind: 'Ignite'; fireId: string; cellId: string; durationDraw: number; critical: boolean }
  | { kind: 'Extinguish'; fireId: string }
  | { kind: 'Move'; targetId: string; cellId: string }
  | { kind: 'Tick'; draws: { targetId: string; draw: number }[] };
type Command = { id: string; expectedRevision: number; action: Action };
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
function parseCommand(v: unknown): Command | undefined {
  if (!record(v) || !keys(v, ['id', 'expectedRevision', 'action']) || !id(v.id) || !uint(v.expectedRevision, 63) || !record(v.action)) return undefined;
  const a = v.action;
  let action: Action;
  if (a.kind === 'Ignite' && keys(a, ['kind', 'fireId', 'cellId', 'durationDraw', 'critical']) && id(a.fireId) && id(a.cellId) && uint(a.durationDraw, 99) && typeof a.critical === 'boolean') {
    action = { kind: 'Ignite', fireId: a.fireId, cellId: a.cellId, durationDraw: a.durationDraw, critical: a.critical };
  } else if (a.kind === 'Extinguish' && keys(a, ['kind', 'fireId']) && id(a.fireId)) {
    action = { kind: 'Extinguish', fireId: a.fireId };
  } else if (a.kind === 'Move' && keys(a, ['kind', 'targetId', 'cellId']) && id(a.targetId) && id(a.cellId)) {
    action = { kind: 'Move', targetId: a.targetId, cellId: a.cellId };
  } else if (a.kind === 'Tick' && keys(a, ['kind', 'draws']) && Array.isArray(a.draws) && a.draws.length <= 8) {
    const draws: { targetId: string; draw: number }[] = [];
    for (const d of a.draws) {
      if (!record(d) || !keys(d, ['targetId', 'draw']) || !id(d.targetId) || !uint(d.draw, 200)) return undefined;
      draws.push({ targetId: d.targetId, draw: d.draw });
    }
    action = { kind: 'Tick', draws };
  } else return undefined;
  return { id: v.id, expectedRevision: v.expectedRevision, action };
}
function replay(input: unknown) {
  if (!record(input) || !keys(input, ['schema', 'cells', 'initial', 'commands']) || input.schema !== 'inferred-fire-lifecycle-v1'
    || !Array.isArray(input.cells) || input.cells.length < 1 || input.cells.length > 16 || !input.cells.every(id)
    || new Set(input.cells).size !== input.cells.length || !Array.isArray(input.initial) || input.initial.length < 1 || input.initial.length > 8
    || !Array.isArray(input.commands) || input.commands.length > 64) return fail('invalid-lifecycle');
  const cells = input.cells as string[], initial: Target[] = [], targetIds = new Set<string>();
  for (const t of input.initial) {
    if (!record(t) || !keys(t, ['id', 'cellId', 'value']) || !id(t.id) || targetIds.has(t.id) || !id(t.cellId)
      || !cells.includes(t.cellId) || !uint(t.value, 1000000) || t.value === 0) return fail('invalid-synthetic-target');
    targetIds.add(t.id); initial.push({ id: t.id, cellId: t.cellId, value: t.value });
  }
  const created = createInferredPositiveHazardLedger(initial.map(t => ({ id: t.id, kind: 'troop', value: t.value })));
  if (!created.ok) return created;
  let hazard = created, tick = 0, fires: Fire[] = [];
  const positions = new Map(initial.map(t => [t.id, t.cellId]));
  const usedFires = new Set<string>(), usedCommands = new Set<string>(), commands: Command[] = [];
  const receipts: { commandId: string; tickBefore: number; tickAfter: number; damage: { targetId: string; fireId: string; before: number; after: number; damage: number }[]; extinguished: string[] }[] = [];
  for (const raw of input.commands) {
    const c = parseCommand(raw);
    if (!c || c.expectedRevision !== commands.length || usedCommands.has(c.id)) return fail('invalid-command-history');
    const a = c.action, tickBefore = tick;
    const damage: { targetId: string; fireId: string; before: number; after: number; damage: number }[] = [], extinguished: string[] = [];
    if (a.kind === 'Ignite') {
      if (!cells.includes(a.cellId) || usedFires.has(a.fireId) || fires.some(f => f.cellId === a.cellId)) return fail('invalid-or-occupied-fire-cell');
      const profile = DETACHED_HAZARD_POLICY.lifetimeBySource.strategy;
      let cumulative = 0, base = 0;
      for (const weight of profile.weights) { cumulative += weight.weight; if (a.durationDraw < cumulative) { base = weight.turns; break; } }
      if (base < 1) return fail('unsupported-duration-policy');
      const duration = base + (a.critical ? profile.criticalBonus : 0);
      fires = [...fires, { id: a.fireId, cellId: a.cellId, remainingTicks: duration }]; usedFires.add(a.fireId);
    } else if (a.kind === 'Extinguish') {
      if (!fires.some(f => f.id === a.fireId)) return fail('unknown-or-expired-fire');
      fires = fires.filter(f => f.id !== a.fireId); extinguished.push(a.fireId);
    } else if (a.kind === 'Move') {
      if (!targetIds.has(a.targetId) || !cells.includes(a.cellId) || positions.get(a.targetId) === a.cellId) return fail('invalid-move');
      positions.set(a.targetId, a.cellId);
    } else {
      // Genesis target order fixes assignment; there is no hidden RNG or caller-selected subset.
      const affected = initial.filter(t => fires.some(f => f.cellId === positions.get(t.id)));
      if (a.draws.length !== affected.length || affected.some((t, i) => a.draws[i]!.targetId !== t.id)) return fail('draws-must-cover-all-occupants-in-genesis-order');
      if (hazard.revision + affected.length > 256) return fail('inner-journal-capacity');
      let proposed = hazard;
      for (let i = 0; i < affected.length; i++) {
        const target = affected[i]!, fire = fires.find(f => f.cellId === positions.get(target.id))!;
        const before = proposed.balances.find(t => t.id === target.id)!.value;
        const next = executeInferredPositiveHazard(proposed.state, { id: `synthetic-fire-${commands.length}-${i}`, expectedRevision: proposed.revision,
          targetId: target.id, kind: 'standing-fire', draw: a.draws[i]!.draw, pathbreaker: false, eligibilityConfirmed: true });
        if (!next.ok) return fail(`atomic-tick-rejected:${next.reason}`);
        const after = next.balances.find(t => t.id === target.id)!.value;
        damage.push({ targetId: target.id, fireId: fire.id, before, after, damage: before - after }); proposed = next;
      }
      hazard = proposed;
      for (const f of fires) if (f.remainingTicks === 1) extinguished.push(f.id);
      fires = fires.filter(f => f.remainingTicks > 1).map(f => ({ ...f, remainingTicks: f.remainingTicks - 1 }));
      tick++;
    }
    commands.push(c); usedCommands.add(c.id); receipts.push({ commandId: c.id, tickBefore, tickAfter: tick, damage, extinguished });
  }
  const state = { schema: 'inferred-fire-lifecycle-v1' as const, cells, initial, commands };
  if (JSON.stringify(state).length > 100000) return fail('save-budget');
  return frozen({ ok: true as const, state, revision: commands.length, tick, fires, receipts,
    targets: hazard.balances.map(t => ({ id: t.id, cellId: positions.get(t.id)!, value: t.value })),
    hazardState: hazard.state, hazardRevision: hazard.revision,
    policyId: 'inferred-strategy-profile-no-spread-atomic-standing-fire-v1', nativeLifecycleVerified: false as const,
    campaignWorldWritten: false as const, realPeopleWritten: false as const, globalClockAdvanced: false as const });
}
export function readInferredFireLifecycle(input: unknown) {
  try { return replay(detach(input)); } catch { return fail('invalid-data-input'); }
}
export function createInferredFireLifecycle(cells: unknown, initial: unknown) {
  return readInferredFireLifecycle({ schema: 'inferred-fire-lifecycle-v1', cells, initial, commands: [] });
}
export function executeInferredFireLifecycle(input: unknown, rawCommand: unknown) {
  const current = readInferredFireLifecycle(input);
  if (!current.ok) return current;
  let command: Command | undefined;
  try { command = parseCommand(detach(rawCommand)); } catch { return fail('invalid-data-command'); }
  if (!command || command.expectedRevision !== current.revision) return fail('invalid-command-or-stale-revision');
  if (current.revision >= 64) return fail('outer-journal-capacity');
  if (current.state.commands.some(c => c.id === command.id)) return fail('duplicate-command');
  return readInferredFireLifecycle({ ...current.state, commands: [...current.state.commands, command] });
}
export function saveInferredFireLifecycle(input: unknown) {
  const result = readInferredFireLifecycle(input);
  return result.ok ? Object.freeze({ ok: true as const, json: JSON.stringify(result.state) }) : result;
}
export function loadInferredFireLifecycle(json: unknown) {
  if (typeof json !== 'string' || json.length > 100000) return fail('invalid-save');
  try { return readInferredFireLifecycle(JSON.parse(json)); } catch { return fail('invalid-save'); }
}
