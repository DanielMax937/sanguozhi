/** Opt-in synthetic transport/depot cargo ledger. Never an arrival/unit finalizer. */
type Stock = Readonly<{ troops: number; money: number; food: number; equipment: readonly number[] }>;
type Account = Readonly<{ id: string; ownerId: string; kind: 'transport' | 'depot'; morale: number;
  stock: Stock; capacity: Stock; equipmentCapacityPolicy: 'inferred-per-slot-input-v1' }>;
type Command = Readonly<{ id: string; expectedRevision: number; sourceId: string; targetId: string;
  amounts: Stock; eligibilityConfirmed: true }>;
type Ledger = Readonly<{ schema: 'inferred-capacity-transfer-ledger-v1'; initial: readonly Account[]; commands: readonly Command[] }>;
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




function stockFrom(input: unknown): Stock | undefined {
  if (!record(input) || !keys(input, ['troops', 'money', 'food', 'equipment'])
    || !uint(input.troops, 1000000000) || !uint(input.money, 1000000000) || !uint(input.food, 1000000000)
    || !Array.isArray(input.equipment) || input.equipment.length !== 12 || !input.equipment.every(value => uint(value, 1000000000))) return undefined;
  return { troops: input.troops, money: input.money, food: input.food, equipment: [...input.equipment] as number[] };
}
function within(stock: Stock, capacity: Stock) {
  return stock.troops <= capacity.troops && stock.money <= capacity.money && stock.food <= capacity.food
    && stock.equipment.every((amount, index) => amount <= capacity.equipment[index]!);
}
function accountFrom(input: unknown, moraleCap = 100): Account | undefined {
  if (!record(input) || !keys(input, ['id', 'ownerId', 'kind', 'morale', 'stock', 'capacity', 'equipmentCapacityPolicy'])
    || !id(input.id) || !id(input.ownerId) || (input.kind !== 'transport' && input.kind !== 'depot')
    || !uint(input.morale, moraleCap) || input.equipmentCapacityPolicy !== 'inferred-per-slot-input-v1') return undefined;
  const stock = stockFrom(input.stock), capacity = stockFrom(input.capacity);
  if (!stock || !capacity || stock.troops === 0 || !within(stock, capacity)) return undefined;
  if (input.kind === 'transport' && (capacity.troops !== 60000 || capacity.money !== 100000 || capacity.food !== 500000)) return undefined;
  return { id: input.id, ownerId: input.ownerId, kind: input.kind, morale: input.morale, stock, capacity,
    equipmentCapacityPolicy: 'inferred-per-slot-input-v1' };
}
function commandFrom(input: unknown): Command | undefined {
  if (!record(input) || !keys(input, ['id', 'expectedRevision', 'sourceId', 'targetId', 'amounts', 'eligibilityConfirmed'])
    || !id(input.id) || !uint(input.expectedRevision, 127) || !id(input.sourceId) || !id(input.targetId)
    || input.sourceId === input.targetId || input.eligibilityConfirmed !== true) return undefined;
  const amounts = stockFrom(input.amounts);
  if (!amounts || !(amounts.troops || amounts.money || amounts.food || amounts.equipment.some(value => value > 0))) return undefined;
  return { id: input.id, expectedRevision: input.expectedRevision, sourceId: input.sourceId, targetId: input.targetId,
    amounts, eligibilityConfirmed: true };
}
function apply(accounts: Account[], command: Command) {
  const sourceIndex = accounts.findIndex(account => account.id === command.sourceId);
  const targetIndex = accounts.findIndex(account => account.id === command.targetId);
  if (sourceIndex < 0 || targetIndex < 0) return fail('unknown-account');
  const source = accounts[sourceIndex]!, target = accounts[targetIndex]!, amount = command.amounts;
  if (source.ownerId !== target.ownerId || source.kind === target.kind) return fail('requires-same-owner-transport-depot-pair');
  if (!within(amount, source.stock)) return fail('insufficient-source-entire-transfer-rejected');
  if (amount.troops >= source.stock.troops) return fail('zero-troops-result-excluded');
  const sourceAfter: Stock = { troops: source.stock.troops - amount.troops, money: source.stock.money - amount.money,
    food: source.stock.food - amount.food, equipment: source.stock.equipment.map((value, i) => value - amount.equipment[i]!) };
  const targetAfter: Stock = { troops: target.stock.troops + amount.troops, money: target.stock.money + amount.money,
    food: target.stock.food + amount.food, equipment: target.stock.equipment.map((value, i) => value + amount.equipment[i]!) };
  if (!within(targetAfter, target.capacity)) return fail('insufficient-capacity-entire-transfer-rejected');
  const targetMorale = amount.troops === 0 ? target.morale : Number(
    (BigInt(target.stock.troops) * BigInt(target.morale) + BigInt(amount.troops) * BigInt(source.morale)) / BigInt(targetAfter.troops));
  // Commit both sides only after all fifteen resource coordinates passed. No entity deletion.
  accounts[sourceIndex] = { ...source, stock: sourceAfter };
  accounts[targetIndex] = { ...target, stock: targetAfter, morale: targetMorale };
  return frozen({ ok: true as const, sourceId: source.id, targetId: target.id, transferred: amount,
    sourceBefore: source.stock, sourceAfter, targetBefore: target.stock, targetAfter,
    sourceMoraleBefore: source.morale, sourceMoraleAfter: source.morale,
    targetMoraleBefore: target.morale, targetMoraleAfter: targetMorale, discarded: 0 });
}
function replay(input: unknown) {
  if (!record(input) || !keys(input, ['schema', 'initial', 'commands']) || input.schema !== 'inferred-capacity-transfer-ledger-v1'
    || !Array.isArray(input.initial) || input.initial.length < 2 || input.initial.length > 32
    || !Array.isArray(input.commands) || input.commands.length > 128) return fail('invalid-ledger');
  const initial: Account[] = [], names = new Set<string>();
  for (const raw of input.initial) {
    const account = accountFrom(raw);
    if (!account || names.has(account.id)) return fail('invalid-or-duplicate-account');
    names.add(account.id); initial.push(account);
  }
  const accounts = [...initial], commands: Command[] = [], receipts = [], commandIds = new Set<string>();
  for (const raw of input.commands) {
    const command = commandFrom(raw);
    if (!command || command.expectedRevision !== commands.length || commandIds.has(command.id)) return fail('invalid-command-history');
    const result = apply(accounts, command);
    if (!result.ok) return result;
    commands.push(command); commandIds.add(command.id); receipts.push({ commandId: command.id, ...result });
  }
  const state: Ledger = { schema: 'inferred-capacity-transfer-ledger-v1', initial, commands };
  return frozen({ ok: true as const, state, accounts, receipts, revision: commands.length,
    transferPolicy: 'full-request-or-reject-retain-both-accounts-v1' as const,
    moralePolicy: 'weighted-floor-compatibility-v1' as const,
    nativeEquipmentCapacitiesVerified: false as const, arrivalFinalizerApplied: false as const,
    campaignWorldWritten: false as const, personsModified: false as const });
}
export function readInferredCapacityTransfer(input: unknown) {
  try { return replay(detach(input)); } catch { return fail('invalid-data-input'); }
}
export function createInferredCapacityTransfer(initial: unknown) {
  return readInferredCapacityTransfer({ schema: 'inferred-capacity-transfer-ledger-v1', initial, commands: [] });
}
export function executeInferredCapacityTransfer(input: unknown, rawCommand: unknown) {
  const current = readInferredCapacityTransfer(input);
  if (!current.ok) return current;
  let clean: unknown;
  try { clean = detach(rawCommand); } catch { return fail('invalid-data-command'); }
  const command = commandFrom(clean);
  if (!command || command.expectedRevision !== current.revision || current.revision >= 128) return fail('invalid-command-or-capacity');
  if (current.state.commands.some(entry => entry.id === command.id)) return fail('duplicate-command');
  return readInferredCapacityTransfer({ ...current.state, commands: [...current.state.commands, command] });
}
export function saveInferredCapacityTransfer(input: unknown) {
  const result = readInferredCapacityTransfer(input);
  return result.ok ? Object.freeze({ ok: true as const, json: JSON.stringify(result.state) }) : result;
}
export function loadInferredCapacityTransfer(json: unknown) {
  if (typeof json !== 'string' || json.length > 100000) return fail('invalid-save');
  try { return readInferredCapacityTransfer(JSON.parse(json)); } catch { return fail('invalid-save'); }
}


/** Internal owner-only projection context. Not a standalone campaign credential/save. */
export type SyntheticTransferEnergyContext = Readonly<{ ownerId: string; techniqueIds: readonly number[] }>;
function ownerAccounts(initial: unknown, context: unknown) {
  if (!record(context) || !keys(context, ['ownerId', 'techniqueIds']) || !id(context.ownerId)
    || !Array.isArray(context.techniqueIds)
    || context.techniqueIds.length > 36 || !context.techniqueIds.every(v => uint(v, 35))
    || new Set(context.techniqueIds).size !== context.techniqueIds.length
    || !Array.isArray(initial) || initial.length < 2 || initial.length > 32) return fail('invalid-owner-energy-context');
  const moraleCap = context.techniqueIds.includes(16) ? 120 : 100;
  const accounts: Account[] = [];
  for (const raw of initial) {
    const row = accountFrom(raw, moraleCap);
    if (!row || row.ownerId !== context.ownerId || accounts.some(a => a.id === row.id)) return fail('invalid-owner-energy-account');
    accounts.push(row);
  }
  return {ok: true as const, accounts, moraleCap};
}
/** Genesis validation only; no fictitious transfer, no 120-domain independent ledger. */
export function validateOwnerCapacityAccounts120(initial: unknown, context: unknown) {
  try {
    const input = detach([initial, context]) as unknown[];
    const current = ownerAccounts(input[0], input[1]);
    return current.ok ? frozen({ok: true as const, accounts: current.accounts, moraleCap: current.moraleCap}) : current;
  } catch { return fail('invalid-owner-energy-data'); }
}
/** One finite all-or-nothing transfer derived from current owner accounts. Outer root owns history. */
export function planOwnerCapacityTransfer120(initial: unknown, rawCommand: unknown, context: unknown) {
  try {
    const input = detach([initial, rawCommand, context]) as unknown[];
    const current = ownerAccounts(input[0], input[2]);
    if (!current.ok) return current;
    const command = commandFrom(input[1]);
    if (!command || command.expectedRevision !== 0) return fail('invalid-owner-transfer-command');
    const result = apply(current.accounts, command);
    if (!result.ok) return result;
    return frozen({ok: true as const, accounts: current.accounts,
      receipt: {commandId: command.id, ...result}, moraleCap: current.moraleCap,
      energyPolicy: 'owner-technique16-cap100-or120-v1' as const});
  } catch { return fail('invalid-owner-energy-data'); }
}
