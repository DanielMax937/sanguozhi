/** Private derived bridge: finite city patch from one validated inventory transfer. */
import { createInferredCapacityTransfer, executeInferredCapacityTransfer, validateOwnerCapacityAccounts120, planOwnerCapacityTransfer120 } from '../inferred-capacity-transfer.ts';
import { detachBoundedCityData } from './bounded-city-json.ts';
export type { SyntheticTransferEnergyContext } from '../inferred-capacity-transfer.ts';

type Equipment = 1 | 2 | 3 | 4 | 5;
type Stock = Readonly<{ troops: number; money: number; food: number; equipment: readonly number[] }>;
export type SyntheticCityTransferContext = Readonly<{
  cityId: string; forceId: string; gold: number; food: number; troops: number; morale: number;
  goldCapacity: number; foodCapacity: number; troopCapacity: number;
  inventory: Readonly<Record<Equipment, Readonly<{ quantity: number; reserved: number; capacity: number }>>>;
}>;
export type SyntheticTransportBridgeAccount = Readonly<{
  id: string; ownerId: string; kind: 'transport'; morale: number; stock: Stock; capacity: Stock;
  equipmentCapacityPolicy: 'inferred-per-slot-input-v1';
}>;
export type SyntheticCityTransferAction = Readonly<{
  kind: 'Transfer'; transportId: string; direction: 'to-city' | 'from-city'; amounts: Stock;
}>;
type Frozen<T> = T extends object ? { readonly [K in keyof T]: Frozen<T[K]> } : T;
const fail = (reason: string) => Object.freeze({ ok: false as const, reason });
const uint = (v: unknown, max = 1000000000): v is number => typeof v === 'number' && Number.isSafeInteger(v) && !Object.is(v, -0) && v >= 0 && v <= max;
const record = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === 'object' && !Array.isArray(v);
const exact = (v: Record<string, unknown>, fields: readonly string[]) => Object.keys(v).length === fields.length && fields.every(k => Object.hasOwn(v, k));
const synthetic = (v: unknown): v is string => typeof v === 'string' && /^synthetic-[a-z0-9-]{1,48}$/.test(v);
const EQUIPMENT = [1, 2, 3, 4, 5] as const;
function freeze<T>(value: T): Frozen<T> {
  if (value !== null && typeof value === 'object') { for (const child of Object.values(value)) freeze(child); Object.freeze(value); }
  return value as Frozen<T>;
}
function stockFrom(value: unknown): Stock | undefined {
  if (!record(value) || !exact(value, ['troops', 'money', 'food', 'equipment']) || !uint(value.troops)
    || !uint(value.money) || !uint(value.food) || !Array.isArray(value.equipment) || value.equipment.length !== 12
    || !value.equipment.every(v => uint(v)) || value.equipment.slice(5).some(v => v !== 0)) return undefined;
  return { troops: value.troops, money: value.money, food: value.food, equipment: [...value.equipment] as number[] };
}
function contextFrom(cityRaw: unknown, transportsRaw: unknown, ownerEnergy?: unknown) {
  let cap = 100;
  if (ownerEnergy !== undefined) {
    if (!record(ownerEnergy) || !exact(ownerEnergy, ['ownerId', 'techniqueIds']) || !synthetic(ownerEnergy.ownerId)
      || !Array.isArray(ownerEnergy.techniqueIds) || ownerEnergy.techniqueIds.length > 36
      || !ownerEnergy.techniqueIds.every(v => uint(v, 35)) || new Set(ownerEnergy.techniqueIds).size !== ownerEnergy.techniqueIds.length
      || !record(cityRaw) || cityRaw.forceId !== ownerEnergy.ownerId) return fail('invalid-owner-energy-context');
    cap = ownerEnergy.techniqueIds.includes(16) ? 120 : 100;
  }
  if (!record(cityRaw) || !exact(cityRaw, ['cityId', 'forceId', 'gold', 'food', 'troops', 'morale', 'goldCapacity', 'foodCapacity', 'troopCapacity', 'inventory'])
    || !synthetic(cityRaw.cityId) || !synthetic(cityRaw.forceId) || cityRaw.cityId === cityRaw.forceId
    || !uint(cityRaw.goldCapacity) || !uint(cityRaw.foodCapacity) || !uint(cityRaw.troopCapacity)
    || !uint(cityRaw.gold, cityRaw.goldCapacity) || !uint(cityRaw.food, cityRaw.foodCapacity)
    || !uint(cityRaw.troops, cityRaw.troopCapacity) || cityRaw.troops === 0 || !uint(cityRaw.morale, cap)
    || !record(cityRaw.inventory) || !exact(cityRaw.inventory, ['1', '2', '3', '4', '5'])) return fail('invalid-city-transfer-context');
  const stockEquipment: number[] = [], capacityEquipment: number[] = [], reserved: number[] = [];
  for (const type of EQUIPMENT) {
    const entry = cityRaw.inventory[type];
    if (!record(entry) || !exact(entry, ['quantity', 'reserved', 'capacity']) || !uint(entry.capacity)
      || !uint(entry.quantity, entry.capacity) || !uint(entry.reserved, type === 5 ? 1 : 0)
      || entry.quantity + entry.reserved > entry.capacity) return fail('invalid-city-inventory-reservation');
    stockEquipment.push(entry.quantity); capacityEquipment.push(entry.capacity - entry.reserved); reserved.push(entry.reserved);
  }
  // Local bridge slots 0..4 represent bounded-city equipment 1..5, NOT native equipment IDs 0..4.
  stockEquipment.push(0, 0, 0, 0, 0, 0, 0); capacityEquipment.push(0, 0, 0, 0, 0, 0, 0);
  const cityAccount = { id: cityRaw.cityId, ownerId: cityRaw.forceId, kind: 'depot' as const, morale: cityRaw.morale,
    stock: { troops: cityRaw.troops, money: cityRaw.gold, food: cityRaw.food, equipment: stockEquipment },
    capacity: { troops: cityRaw.troopCapacity, money: cityRaw.goldCapacity, food: cityRaw.foodCapacity, equipment: capacityEquipment },
    equipmentCapacityPolicy: 'inferred-per-slot-input-v1' as const };
  if (!Array.isArray(transportsRaw) || transportsRaw.length > 8) return fail('invalid-transports');
  const transports: SyntheticTransportBridgeAccount[] = [];
  for (const row of transportsRaw) {
    if (!record(row) || !exact(row, ['id', 'ownerId', 'kind', 'morale', 'stock', 'capacity', 'equipmentCapacityPolicy'])
      || !synthetic(row.id) || row.id === cityRaw.cityId || row.id === cityRaw.forceId || row.ownerId !== cityRaw.forceId
      || row.kind !== 'transport' || !uint(row.morale, cap) || row.equipmentCapacityPolicy !== 'inferred-per-slot-input-v1') return fail('invalid-transport-binding');
    const stock = stockFrom(row.stock), capacity = stockFrom(row.capacity);
    if (!stock || !capacity) return fail('unsupported-transport-equipment-slots');
    transports.push({ id: row.id, ownerId: cityRaw.forceId, kind: 'transport', morale: row.morale, stock, capacity,
      equipmentCapacityPolicy: 'inferred-per-slot-input-v1' });
  }
  if (transports.length > 0) {
    const verified = ownerEnergy === undefined ? createInferredCapacityTransfer([cityAccount, ...transports])
      : validateOwnerCapacityAccounts120([cityAccount, ...transports], ownerEnergy);
    if (!verified.ok) return fail(`transfer-genesis:${verified.reason}`);
  }
  return { ok: true as const, cityAccount, transports, reserved };
}
function plan(cityRaw: unknown, transportsRaw: unknown, actionRaw: unknown, ownerEnergy?: unknown) {
  const context = contextFrom(cityRaw, transportsRaw, ownerEnergy);
  if (!context.ok) return context;
  const { cityAccount, transports, reserved } = context;
  if (!record(actionRaw) || !exact(actionRaw, ['kind', 'transportId', 'direction', 'amounts']) || actionRaw.kind !== 'Transfer'
    || !synthetic(actionRaw.transportId) || !transports.some(t => t.id === actionRaw.transportId)
    || (actionRaw.direction !== 'to-city' && actionRaw.direction !== 'from-city')) return fail('invalid-transfer-action');
  const amounts = stockFrom(actionRaw.amounts);
  if (!amounts) return fail('invalid-or-unsupported-transfer-amounts');
  // Existing transfer constructor validates every balance, known transport cap, unique identity and positive troop account.
  const command = { id: 'synthetic-city-transfer-bridge', expectedRevision: 0,
    sourceId: actionRaw.direction === 'to-city' ? actionRaw.transportId : cityAccount.id,
    targetId: actionRaw.direction === 'to-city' ? cityAccount.id : actionRaw.transportId,
    amounts, eligibilityConfirmed: true };
  const transferred = (() => {
    if (ownerEnergy !== undefined) {
      const result = planOwnerCapacityTransfer120([cityAccount, ...transports], command, ownerEnergy);
      return result.ok ? {ok: true as const, accounts: result.accounts, receipts: [result.receipt]} : result;
    }
    const created = createInferredCapacityTransfer([cityAccount, ...transports]);
    if (!created.ok) return fail(`transfer-context:${created.reason}`);
    return executeInferredCapacityTransfer(created.state, command);
  })();
  if (!transferred.ok) return fail(`transfer:${transferred.reason}`);
  const city = transferred.accounts.find(account => account.id === cityAccount.id)!;
  const item = (type: Equipment) => ({ quantity: city.stock.equipment[type - 1]!, reserved: reserved[type - 1]! });
  return freeze({ ok: true as const,
    cityPatch: { gold: city.stock.money, food: city.stock.food, troops: city.stock.troops, morale: city.morale,
      inventory: { 1: item(1), 2: item(2), 3: item(3), 4: item(4), 5: item(5) } },
    transports: transferred.accounts.filter(account => account.kind === 'transport').map(account => ({ ...account, kind: 'transport' as const })),
    receipt: transferred.receipts[0]!, mappingPolicy: 'bounded-types1to5-local-slots0to4-v1' as const });
}
/** Derived helper only: caller owns journal, current-ledger binding, identity exclusions and atomic commit. */
export function planSyntheticCityTransferBridge(rawCity: unknown, rawTransports: unknown, rawAction: unknown) {
  try {
    const detached = detachBoundedCityData([rawCity, rawTransports, rawAction]);
    if (!detached.ok || !Array.isArray(detached.value)) return fail('invalid-bridge-data');
    return plan(detached.value[0], detached.value[1], detached.value[2]);
  } catch { return fail('invalid-bridge-data'); }
}

/** Genesis validation, including an empty transport roster; never fabricates a transfer. */
export function createSyntheticCityTransports(rawTransports: unknown, rawCity: unknown) {
  try {
    const detached = detachBoundedCityData([rawCity, rawTransports]);
    if (!detached.ok || !Array.isArray(detached.value)) return fail('invalid-bridge-data');
    const context = contextFrom(detached.value[0], detached.value[1]);
    return context.ok ? freeze({ ok: true as const, transports: context.transports }) : context;
  } catch { return fail('invalid-bridge-data'); }
}


/** Opt-in 120 compatibility, qualified only by current replay-owner technique facts. */
export function planSyntheticCityTransferBridge120(rawCity: unknown, rawTransports: unknown, rawAction: unknown, rawOwnerEnergy: unknown) {
  try {
    const detached = detachBoundedCityData([rawCity, rawTransports, rawAction, rawOwnerEnergy]);
    if (!detached.ok || !Array.isArray(detached.value) || detached.value[3] === undefined) return fail('invalid-bridge-data');
    return plan(detached.value[0], detached.value[1], detached.value[2], detached.value[3]);
  } catch { return fail('invalid-bridge-data'); }
}
/** Empty transport roster remains legal; owner/cap validation is still mandatory. */
export function createSyntheticCityTransports120(rawTransports: unknown, rawCity: unknown, rawOwnerEnergy: unknown) {
  try {
    const detached = detachBoundedCityData([rawCity, rawTransports, rawOwnerEnergy]);
    if (!detached.ok || !Array.isArray(detached.value) || detached.value[2] === undefined) return fail('invalid-bridge-data');
    const context = contextFrom(detached.value[0], detached.value[1], detached.value[2]);
    return context.ok ? freeze({ok: true as const, transports: context.transports}) : context;
  } catch { return fail('invalid-bridge-data'); }
}
