/** Consume inferred priority plans in the EXISTING detached supply account ledger.
 * No native-unit lifecycle, personnel, clock, reward or Closing effects.
 */
import { executeFoodSupply, loadFoodSupply, saveFoodSupply } from './food-supply-lifecycle.ts';
import type { FoodSupplySession, FoodSupplyReceipt } from './food-supply-lifecycle.ts';
import { planInferredAutomaticSupply } from './inferred-independent-planning.ts';

type Frozen<T> = T extends object ? { readonly [K in keyof T]: Frozen<T[K]> } : T;
type Request = { batchId: string; expectedRevision: number; sourceId: string;
  targets: { id: string; foodTurnsRemaining: number; adjacent: true }[] };
type Failure = { ok: false; reason: string; session: FoodSupplySession | null; receipts: [] };
type Success = { ok: true; policyId: 'inferred-priority-existing-ledger-batch-v1'; request: Request;
  session: FoodSupplySession; receipts: FoodSupplyReceipt[]; skippedTargetIds: string[];
  nativeWorldEffectsApplied: false; existingDetachedLedgerUpdated: true };
export type InferredAutomaticSupplyBatchV1 = Frozen<Request>;
export type InferredAutomaticSupplyResultV1 = Frozen<Success | Failure>;
class Invalid extends Error {}
function fail(reason = 'invalid-request'): never { throw new Invalid(reason); }
function freeze<T>(value: T): Frozen<T> {
  if (value !== null && typeof value === 'object') {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value as Frozen<T>;
}
function detach(value: unknown, depth = 0, active = new Set<object>()): unknown {
  if (depth > 8) fail();
  if (value === null || typeof value === 'boolean') return value;
  if (typeof value === 'string') { if (value.length > 128) fail(); return value; }
  if (typeof value === 'number') return Number.isSafeInteger(value) && !Object.is(value, -0) ? value : fail();
  if (typeof value !== 'object' || active.has(value)) fail();
  const array = Array.isArray(value), proto = Object.getPrototypeOf(value);
  if (proto !== (array ? Array.prototype : Object.prototype) && !(proto === null && !array)) fail();
  const descriptors = Object.getOwnPropertyDescriptors(value), keys = Reflect.ownKeys(descriptors);
  if (keys.length > 65 || keys.some(key => typeof key !== 'string' || !('value' in descriptors[key]!)
    || (!descriptors[key]!.enumerable && !(array && key === 'length')))) fail();
  active.add(value);
  try {
    if (array) {
      const length = descriptors.length!.value as number;
      if (length > 64 || keys.length !== length + 1) fail();
      const result: unknown[] = [];
      for (let i = 0; i < length; i++) { const item = descriptors[String(i)]; if (!item) fail(); result.push(detach(item.value, depth + 1, active)); }
      return result;
    }
    const result: Record<string, unknown> = {};
    for (const key of keys as string[]) Object.defineProperty(result, key,
      { value: detach(descriptors[key]!.value, depth + 1, active), enumerable: true, writable: true, configurable: true });
    return result;
  } finally { active.delete(value); }
}
function record(value: unknown, fields: string[]): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail();
  const result = value as Record<string, unknown>;
  if (Object.keys(result).length !== fields.length || fields.some(key => !Object.hasOwn(result, key))) fail();
  return result;
}
function id(value: unknown, max = 128): string {
  if (typeof value !== 'string' || value.length > max || value === 'food-consumed-sink' || !/^[A-Za-z0-9][A-Za-z0-9._:-]*$/.test(value)) fail();
  return value;
}
function integer(value: unknown, maximum: number): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0 || value > maximum) fail();
  return value;
}
function request(input: unknown): Request {
  const value = record(detach(input), ['batchId', 'expectedRevision', 'sourceId', 'targets']);
  if (!Array.isArray(value.targets) || value.targets.length < 1 || value.targets.length > 64) fail();
  const seen = new Set<string>(), sourceId = id(value.sourceId);
  const targets = value.targets.map(item => {
    const target = record(item, ['id', 'foodTurnsRemaining', 'adjacent']);
    const key = id(target.id); if (key === sourceId || seen.has(key) || target.adjacent !== true) fail('invalid-target-or-adjacency');
    seen.add(key); return { id: key, foodTurnsRemaining: integer(target.foodTurnsRemaining, 360), adjacent: true as const };
  });
  return { batchId: id(value.batchId, 96), expectedRevision: integer(value.expectedRevision, 0x7fffffff), sourceId, targets };
}
/** All-or-nothing result: intermediate immutable sessions are never returned on failure.
 * Native adjacency and food horizons are explicit supplied facts, not inferred here.
 */
export function executeInferredAutomaticSupply(inputSession: unknown, inputRequest: unknown): InferredAutomaticSupplyResultV1 {
  let original: FoodSupplySession | null = null;
  try {
    // Reuse the consumer's strict validation/replay boundary, not a forged snapshot.
    const saved = saveFoodSupply(inputSession); if (!saved.ok) fail(`invalid-session:${saved.reason}`);
    const restored = loadFoodSupply(saved.json); if (!restored.ok) fail(`invalid-session:${restored.reason}`);
    original = restored.session;
    const batch = request(inputRequest), state = original.currentState;
    // Length-prefix makes batch IDs containing ':' unambiguous and non-overlapping.
    const prefix = `auto-supply:${batch.batchId.length}:${batch.batchId}:`;
    if (original.entries.some(entry => entry.command.commandId.startsWith(prefix))) fail('duplicate-batch');
    if (batch.expectedRevision !== state.revision) fail('stale-revision');
    const source = state.accounts.find(account => account.id === batch.sourceId);
    if (!source || source.classification !== 'transport') fail('ineligible-source');
    const targets = batch.targets.map(item => {
      const target = state.accounts.find(account => account.id === item.id);
      if (!target || target.classification !== 'combat' || target.ownerId !== source.ownerId || target.equipmentId === null) fail('ineligible-target');
      const equipmentId = target.equipmentId;
      const troopRoom = target.capacity.troops - target.troops;
      const equipmentRoom = equipmentId >= 1 && equipmentId <= 4 ? target.capacity.equipment[equipmentId]! - target.equipment[equipmentId]! : troopRoom;
      return { id: target.id, foodTurnsRemaining: item.foodTurnsRemaining,
        troopsDeficit: Math.min(troopRoom, equipmentRoom), moneyDeficit: target.capacity.money - target.money,
        foodDeficit: target.capacity.food - target.food, equipmentId, eligibleSameOwnerAdjacentCombat: true as const };
    });
    const plan = planInferredAutomaticSupply({ id: source.id, troops: source.troops, money: source.money,
      food: source.food, equipment: source.equipment }, targets);
    if (!plan.ok) fail('planning-rejected');
    let next = original;
    const receipts: FoodSupplyReceipt[] = [], skippedTargetIds: string[] = [];
    for (let index = 0; index < plan.plans.length; index++) {
      const step = plan.plans[index]!;
      if (step.requested.troops === 0 && step.requested.money === 0 && step.requested.food === 0) { skippedTargetIds.push(step.targetId); continue; }
      const result = executeFoodSupply(next, { type: 'ManualSupply', commandId: prefix + index,
        expectedRevision: next.currentState.revision, sourceId: step.sourceId, targetId: step.targetId,
        relation: step.relation, requested: step.requested });
      if (!result.ok) fail(`consumer-rejected:${result.reason}`);
      const receipt = result.receipt;
      if (receipt.type !== 'ManualSupply' || receipt.accepted.troops !== step.requested.troops
        || receipt.accepted.money !== step.requested.money || receipt.accepted.food !== step.requested.food) fail('consumer-plan-mismatch');
      next = result.session; receipts.push(receipt);
    }
    if (receipts.length === 0) fail('no-transfer');
    return freeze({ ok: true as const, policyId: 'inferred-priority-existing-ledger-batch-v1' as const,
      request: batch, session: next, receipts, skippedTargetIds,
      nativeWorldEffectsApplied: false as const, existingDetachedLedgerUpdated: true as const });
  } catch (error) {
    if (!(error instanceof Invalid)) throw error;
    return freeze({ ok: false as const, reason: error.message, session: original, receipts: [] as [] });
  }
}
