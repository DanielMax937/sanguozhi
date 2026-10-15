/** Captured AL cost arithmetic plus an explicitly synthetic, finite-map reducer. */
type Frozen<T> = T extends object ? {readonly [K in keyof T]: Frozen<T[K]>} : T;
function freeze<T>(v: T): Frozen<T> { if (v && typeof v === 'object') { for (const x of Object.values(v)) freeze(x); Object.freeze(v); } return v as Frozen<T>; }
class Invalid extends Error {}
const fail = (): never => { throw new Invalid('invalid-input'); };
/** Detach only strict JSON data. Descriptors are inspected before any property read. */
function detach(v: unknown, active = new Set<object>()): unknown {
  if (v === null || typeof v === 'string' || typeof v === 'boolean') return v;
  if (typeof v === 'number') return Number.isFinite(v) && !Object.is(v, -0) ? v : fail();
  if (typeof v !== 'object' || active.has(v)) return fail();
  active.add(v);
  try {
    const a = Array.isArray(v);
    if (Object.getPrototypeOf(v) !== (a ? Array.prototype : Object.prototype) && !(Object.getPrototypeOf(v) === null && !a)) return fail();
    const ds = Object.getOwnPropertyDescriptors(v);
    const keys = Reflect.ownKeys(ds);
    if (keys.some(k => typeof k !== 'string' || !('value' in ds[k]!) || (!ds[k]!.enumerable && !(a && k === 'length')))) return fail();
    if (a) {
      const n = ds.length!.value as number;
      if (keys.length !== n + 1) return fail();
      const out: unknown[] = [];
      for (let i = 0; i < n; i++) { const d = ds[String(i)]; if (!d) return fail(); out.push(detach(d.value, active)); }
      return out;
    }
    const out: Record<string, unknown> = {};
    for (const k of keys as string[]) Object.defineProperty(out, k, {value: detach(ds[k]!.value, active), enumerable: true, writable: true, configurable: true});
    return out;
  } finally { active.delete(v); }
}
function record(v: unknown, fields: readonly string[]): Record<string, unknown> {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return fail();
  const r = v as Record<string, unknown>;
  if (Object.keys(r).length !== fields.length || fields.some(k => !Object.hasOwn(r, k))) return fail();
  return r;
}
function uint(v: unknown, max = 0xffffffff): number { if (typeof v !== 'number' || !Number.isInteger(v) || v < 0 || v > max) return fail(); return v; }
function id(v: unknown): string { if (typeof v !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(v)) return fail(); return v; }
function bool(v: unknown): boolean { if (typeof v !== 'boolean') return fail(); return v; }
function array(v: unknown): unknown[] { if (!Array.isArray(v)) return fail(); return v; }
function literal(v: unknown, s: string): void { if (v !== s) fail(); }
export type TerrainCostInput = {readonly profile: 'captured-terrain-al-v1'; readonly terrainInfoU32: number; readonly flagsU32: number; readonly resolvedEquipmentId: number; readonly row: {readonly equipmentId: number; readonly bytes: readonly number[]}};
export type TerrainCostReceipt = {readonly profile: 'captured-terrain-al-v1'; readonly terrainId: number; readonly helper: 'land' | 'naval'; readonly equipmentId: number; readonly tableIndex: number; readonly baseByte: number; readonly fireApplied: boolean; readonly costAL: number};
function cost(input: unknown): TerrainCostReceipt {
  const r = record(input, ['profile', 'terrainInfoU32', 'flagsU32', 'resolvedEquipmentId', 'row']);
  literal(r.profile, 'captured-terrain-al-v1');
  const terrainId = uint(r.terrainInfoU32) & 31, flags = uint(r.flagsU32), equipmentId = uint(r.resolvedEquipmentId, 0xffff);
  const row = record(r.row, ['equipmentId', 'bytes']);
  if (uint(row.equipmentId, 0xffff) !== equipmentId) fail();
  const bytes = array(row.bytes); if (bytes.length !== 32) fail(); bytes.forEach(b => uint(b, 255));
  const baseByte = bytes[terrainId] as number, fireApplied = (flags & 0x03800000) !== 0;
  return {profile: 'captured-terrain-al-v1', terrainId, helper: terrainId === 7 || terrainId === 8 ? 'naval' : 'land', equipmentId, tableIndex: equipmentId * 32 + terrainId, baseByte, fireApplied, costAL: fireApplied ? (baseByte * 4) & 255 : baseByte};
}
export function projectSuppliedTerrainCost(input: unknown): Frozen<{ok: true; receipt: TerrainCostReceipt} | {ok: false; reason: 'invalid-input'}> {
  try { return freeze({ok: true as const, receipt: cost(detach(input))}); } catch (e) { if (!(e instanceof Invalid)) throw e; return freeze({ok: false as const, reason: 'invalid-input' as const}); }
}
export type SuppliedMovementCell = {readonly id: string; readonly terrainInfoU32: number; readonly flagsU32: number; readonly adjacent: readonly string[]; readonly blocked: boolean; readonly occupied: boolean; readonly unsupportedContext: boolean; readonly facilityPresent: boolean};
export type SuppliedMovementState = {readonly unitId: string; readonly cellId: string; readonly budget: number; readonly landEquipmentId: number; readonly navalEquipmentId: number; readonly transport: boolean};
export type SuppliedMovementPolicy = {readonly id: string; readonly version: 1; readonly cost: 'captured-terrain-al-v1'; readonly adjacency: 'supplied-directed-v1'; readonly helper: 'supplied-equipment-transport-comment-v1'; readonly hazards: 'reject-unsupported-v1'; readonly effects: 'movement-cost-only-v1'; readonly rows: readonly {readonly equipmentId: number; readonly costs: readonly (number | null)[]}[]};
export type SuppliedMovementRequest = {readonly version: 1; readonly map: {readonly id: string; readonly cells: readonly SuppliedMovementCell[]}; readonly state: SuppliedMovementState; readonly path: readonly string[]; readonly policy: SuppliedMovementPolicy};
export type SuppliedMovementStep = {readonly index: number; readonly from: string; readonly to: string; readonly budgetBefore: number; readonly budgetAfter: number; readonly facilityPresent: boolean; readonly cost: TerrainCostReceipt};
export type SuppliedMovementFailure = 'missing-cell' | 'nonadjacent' | 'blocked' | 'occupied' | 'unsupported-context' | 'unknown-cost' | 'insufficient-budget';
export type SuppliedMovementResult = Frozen<
  | {ok: false; reason: 'invalid-input'}
  | {ok: false; reason: SuppliedMovementFailure; failedStep: number | null; request: SuppliedMovementRequest; state: SuppliedMovementState; steps: []; spent: 0}
  | {ok: true; request: SuppliedMovementRequest; state: SuppliedMovementState; steps: SuppliedMovementStep[]; spent: number}
>;
function request(input: unknown): SuppliedMovementRequest {
  const r = record(input, ['version', 'map', 'state', 'path', 'policy']); if (r.version !== 1) fail();
  const m = record(r.map, ['id', 'cells']); id(m.id); const cells = array(m.cells); if (!cells.length) fail();
  const ids = new Set<string>();
  for (const value of cells) {
    const c = record(value, ['id', 'terrainInfoU32', 'flagsU32', 'adjacent', 'blocked', 'occupied', 'unsupportedContext', 'facilityPresent']);
    const key = id(c.id); if (ids.has(key)) fail(); ids.add(key); uint(c.terrainInfoU32); uint(c.flagsU32);
    for (const k of ['blocked', 'occupied', 'unsupportedContext', 'facilityPresent']) bool(c[k]);
    const edges = array(c.adjacent).map(id); if (new Set(edges).size !== edges.length) fail();
  }
  for (const value of cells) for (const edge of (value as SuppliedMovementCell).adjacent) if (!ids.has(edge)) fail();
  const s = record(r.state, ['unitId', 'cellId', 'budget', 'landEquipmentId', 'navalEquipmentId', 'transport']);
  id(s.unitId); id(s.cellId); if (!ids.has(s.cellId as string)) fail(); uint(s.budget); uint(s.landEquipmentId, 0xffff); uint(s.navalEquipmentId, 0xffff); bool(s.transport);
  array(r.path).forEach(id);
  const p = record(r.policy, ['id', 'version', 'cost', 'adjacency', 'helper', 'hazards', 'effects', 'rows']); id(p.id); if (p.version !== 1) fail();
  literal(p.cost, 'captured-terrain-al-v1'); literal(p.adjacency, 'supplied-directed-v1'); literal(p.helper, 'supplied-equipment-transport-comment-v1'); literal(p.hazards, 'reject-unsupported-v1'); literal(p.effects, 'movement-cost-only-v1');
  const equipment = new Set<number>();
  for (const value of array(p.rows)) { const row = record(value, ['equipmentId', 'costs']); const e = uint(row.equipmentId, 0xffff); if (equipment.has(e)) fail(); equipment.add(e); const cs = array(row.costs); if (cs.length !== 32) fail(); for (const c of cs) if (c !== null) uint(c, 255); }
  return r as unknown as SuppliedMovementRequest;
}
/** No global state, RNG, pathfinding, or native event writers. Replaying the request reproduces the entire result. */
export function moveOnSuppliedMap(input: unknown): SuppliedMovementResult {
  let r: SuppliedMovementRequest;
  try { r = request(detach(input)); } catch (e) { if (!(e instanceof Invalid)) throw e; return freeze({ok: false as const, reason: 'invalid-input' as const}); }
  const reject = (reason: SuppliedMovementFailure, failedStep: number | null): SuppliedMovementResult => freeze({ok: false as const, reason, failedStep, request: r, state: r.state, steps: [] as [], spent: 0 as const});
  const cells = new Map(r.map.cells.map(c => [c.id, c]));
  if (cells.get(r.state.cellId)!.unsupportedContext) return reject('unsupported-context', null);
  let position = r.state.cellId, budget = r.state.budget;
  const steps: SuppliedMovementStep[] = [];
  for (let index = 0; index < r.path.length; index++) {
    const to = r.path[index]!, cell = cells.get(to);
    if (!cell) return reject('missing-cell', index);
    if (!cells.get(position)!.adjacent.includes(to)) return reject('nonadjacent', index);
    if (cell.blocked) return reject('blocked', index);
    if (cell.occupied) return reject('occupied', index);
    if (cell.unsupportedContext) return reject('unsupported-context', index);
    const terrain = cell.terrainInfoU32 & 31, naval = terrain === 7 || terrain === 8;
    const equipmentId = r.state.transport ? (naval ? 9 : 0) : (naval ? r.state.navalEquipmentId : r.state.landEquipmentId);
    const row = r.policy.rows.find(row => row.equipmentId === equipmentId);
    if (!row || row.costs[terrain] === null) return reject('unknown-cost', index);
    // Null denotes an unavailable cell in the policy, not a native cost byte.
    const receipt = cost({profile: r.policy.cost, terrainInfoU32: cell.terrainInfoU32, flagsU32: cell.flagsU32, resolvedEquipmentId: equipmentId, row: {equipmentId, bytes: row.costs.map(c => c ?? 0)}});
    if (receipt.costAL > budget) return reject('insufficient-budget', index);
    const budgetBefore = budget; budget -= receipt.costAL;
    steps.push({index, from: position, to, budgetBefore, budgetAfter: budget, facilityPresent: cell.facilityPresent, cost: receipt}); position = to;
  }
  return freeze({ok: true as const, request: r, state: {...r.state, cellId: position, budget}, steps, spent: r.state.budget - budget});
}
/** Guide reference only: null means unavailable/unknown, never a claimed binary dump. */
function standardRows(): SuppliedMovementPolicy['rows'] {
  const sword = [5,5,5,8,12,6,null,null,null,6,4,6,4,5,null,null,4,4,4,6];
  const horse = [5,4,5,8,12,10,null,null,null,7,4,7,4,5,null,null,4,4,4,10];
  const siege = [6,5,6,8,12,8,null,null,null,7,4,6,4,5,null,null,4,4,4,10];
  return Array.from({length: 12}, (_, equipmentId) => {
    const base: (number | null)[] = equipmentId >= 9 ? Array(20).fill(null) : [...(equipmentId === 4 ? horse : equipmentId >= 5 ? siege : sword)];
    if (equipmentId >= 9) { base[7] = 4; base[8] = 4; }
    return {equipmentId, costs: [...base, ...Array(12).fill(null)]};
  });
}
export const GUIDE_REFERENCE_MOVEMENT_POLICY: Frozen<SuppliedMovementPolicy> = freeze({id: 'guide-standard-reference-v1', version: 1, cost: 'captured-terrain-al-v1', adjacency: 'supplied-directed-v1', helper: 'supplied-equipment-transport-comment-v1', hazards: 'reject-unsupported-v1', effects: 'movement-cost-only-v1', rows: standardRows()});
