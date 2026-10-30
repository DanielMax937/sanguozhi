/** Fixed synthetic inventory -> existing ordinary loyalty turns + read-only equipment view. */
import treasureCatalog from '../../../docs/sources/treasures.json' with { type: 'json' };
import { readInferredConfiscationLedger } from './inferred-confiscation-ledger.ts';
import { createPersonnelLoyaltyState, executePersonnelLoyaltyCommand } from './personnel-loyalty-lifecycle.ts';
import type { PersonnelLoyaltyReceiptV1 } from './personnel-loyalty-lifecycle.ts';

const STATS = ['leadership', 'war', 'intelligence', 'politics', 'charisma'] as const;
type Stat = typeof STATS[number];
type Stats = Record<Stat, number>;
type Base = { officerId: string; stats: Stats };
type Equipment = { itemId: string; sourceIndex: number | null; inferredBonuses: Stats };
type Command = { id: string; expectedRevision: number; type: 'AdvanceTreasureTurn' };
type Frozen<T> = T extends object ? { readonly [K in keyof T]: Frozen<T[K]> } : T;
function freeze<T>(value: T): Frozen<T> {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const item of Object.values(value)) freeze(item);
    Object.freeze(value);
  }
  return value as Frozen<T>;
}
const fail = (reason: string) => freeze({ ok: false as const, reason });
const uint = (v: unknown, max: number): v is number => typeof v === 'number' && Number.isSafeInteger(v) && !Object.is(v, -0) && v >= 0 && v <= max;
const record = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === 'object' && !Array.isArray(v);
const keys = (v: Record<string, unknown>, names: readonly string[]) => Object.keys(v).length === names.length && names.every(name => Object.hasOwn(v, name));
const id = (v: unknown): v is string => typeof v === 'string' && /^synthetic-[a-z0-9-]{1,48}$/.test(v);
const runtime = globalThis as { process?: { getBuiltinModule?: (id: string) => { types: { isProxy(v: unknown): boolean } } } };
const isProxy = typeof runtime.process?.getBuiltinModule === 'function' ? runtime.process.getBuiltinModule('node:util').types.isProxy : (() => false);
function detach(input: unknown): unknown {
  let nodes = 0, chars = 0; const active = new Set<object>();
  const invalid = (): never => { throw new Error('invalid-data'); };
  function visit(value: unknown, depth: number): unknown {
    if (++nodes > 100000 || depth > 32) return invalid();
    if (value === null || typeof value === 'boolean') return value;
    if (typeof value === 'number') return uint(value, Number.MAX_SAFE_INTEGER) ? value : invalid();
    if (typeof value === 'string') { chars += value.length; return chars <= 2000000 ? value : invalid(); }
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
        if (!uint(length, 512) || names.length !== length + 1) return invalid();
        const result: unknown[] = [];
        for (let i = 0; i < length; i++) { const descriptor = descriptors[String(i)]; if (!descriptor) return invalid(); result.push(visit(descriptor.value, depth + 1)); }
        return result;
      }
      if (names.length > 128) return invalid();
      const result: Record<string, unknown> = {};
      for (const name of names as string[]) Object.defineProperty(result, name, { value: visit(descriptors[name]!.value, depth + 1), enumerable: true });
      return result;
    } finally { active.delete(value); }
  }
  return visit(input, 0);
}
function stats(input: unknown): Stats | undefined {
  if (!record(input) || !keys(input, STATS) || STATS.some(stat => !uint(input[stat], 100))) return undefined;
  return { leadership: input.leadership as number, war: input.war as number, intelligence: input.intelligence as number,
    politics: input.politics as number, charisma: input.charisma as number };
}
function commandFrom(value: unknown): Command | undefined {
  if (!record(value) || !keys(value, ['id', 'expectedRevision', 'type']) || !id(value.id)
    || !uint(value.expectedRevision, 127) || value.type !== 'AdvanceTreasureTurn') return undefined;
  return { id: value.id, expectedRevision: value.expectedRevision, type: value.type };
}
function replay(input: unknown) {
  if (!record(input) || !keys(input, ['schema', 'initialConfiscation', 'personnelScenario', 'baseStats', 'equipment', 'commands'])
    || input.schema !== 'inferred-treasure-turn-projection-v1' || !Array.isArray(input.baseStats)
    || !Array.isArray(input.equipment) || !Array.isArray(input.commands) || input.commands.length > 128) return fail('invalid-session');
  const treasury = readInferredConfiscationLedger(input.initialConfiscation);
  if (!treasury.ok) return fail(`treasury:${treasury.reason}`);
  const initial = createPersonnelLoyaltyState(input.personnelScenario);
  if (!initial.ok) return fail(`personnel:${initial.reason}`);
  const scenario = initial.state.genesis.scenario;
  if (![scenario.force.id, scenario.ruler.id, scenario.city.id].every(id)
    || scenario.city.gold !== 0 || scenario.city.actionPoints !== treasury.actionPoints
    || scenario.officers.length !== treasury.officers.length) return fail('synthetic-scope-or-roster-mismatch');
  for (const officer of scenario.officers) {
    const original = treasury.officers.find(row => row.id === officer.id);
    if (!id(officer.id) || !original || officer.trueLoyalty !== original.loyalty || officer.trueLoyalty === 0) return fail('initial-loyalty-binding-mismatch');
  }
  const baseStats: Base[] = [], baseIds = new Set<string>();
  for (const entry of input.baseStats) {
    if (!record(entry) || !keys(entry, ['officerId', 'stats']) || !id(entry.officerId) || baseIds.has(entry.officerId)
      || !treasury.officers.some(officer => officer.id === entry.officerId)) return fail('invalid-base-stats');
    const parsed = stats(entry.stats); if (!parsed) return fail('invalid-base-stats');
    baseIds.add(entry.officerId); baseStats.push({ officerId: entry.officerId, stats: parsed });
  }
  if (baseStats.length !== treasury.officers.length) return fail('incomplete-base-stats');
  const equipment: Equipment[] = [], itemIds = new Set<string>();
  for (const entry of input.equipment) {
    if (!record(entry) || !keys(entry, ['itemId', 'sourceIndex', 'inferredBonuses']) || !id(entry.itemId) || itemIds.has(entry.itemId)) return fail('invalid-equipment-binding');
    const item = treasury.items.find(row => row.id === entry.itemId), bonuses = stats(entry.inferredBonuses);
    if (!item || !bonuses || (entry.sourceIndex !== null && !uint(entry.sourceIndex, treasureCatalog.treasures.length - 1))) return fail('invalid-equipment-binding');
    if (entry.sourceIndex !== null && treasureCatalog.treasures[entry.sourceIndex]!.value !== item.value) return fail('source-item-value-mismatch');
    itemIds.add(entry.itemId); equipment.push({ itemId: entry.itemId, sourceIndex: entry.sourceIndex, inferredBonuses: bonuses });
  }
  if (equipment.length !== treasury.items.length) return fail('incomplete-equipment-bindings');
  let personnel = initial.state;
  const commands: Command[] = [], receipts: PersonnelLoyaltyReceiptV1[] = [], commandIds = new Set<string>();
  for (const entry of input.commands) {
    const command = commandFrom(entry);
    if (!command || command.expectedRevision !== commands.length || commandIds.has(command.id)) return fail('invalid-command-history');
    const advanced = executePersonnelLoyaltyCommand(personnel, { id: command.id, expectedRevision: personnel.snapshot.revision,
      command: { type: 'AdvancePersonnelTurn' } });
    if (!advanced.ok) return fail(`advance:${advanced.reason}`);
    if (advanced.state.snapshot.officers.some(officer => officer.trueLoyalty === 0)) return fail('zero-loyalty-result-excluded');
    personnel = advanced.state; receipts.push(advanced.receipt); commands.push(command); commandIds.add(command.id);
  }
  const projections = baseStats.map(base => {
    const held = treasury.items.filter(item => item.holder === base.officerId);
    const bonuses: Stats = { leadership: 0, war: 0, intelligence: 0, politics: 0, charisma: 0 };
    const sourceEffects = held.map(item => {
      const binding = equipment.find(row => row.itemId === item.id)!;
      for (const stat of STATS) bonuses[stat] = Math.max(bonuses[stat], binding.inferredBonuses[stat]);
      const row = binding.sourceIndex === null ? null : treasureCatalog.treasures[binding.sourceIndex]!;
      return { itemId: item.id, sourceIndex: binding.sourceIndex, sourceName: row?.name ?? null,
        documentedEffect: row?.effect ?? null, effectExecuted: false as const };
    });
    const effective: Stats = { ...base.stats };
    for (const stat of STATS) effective[stat] = Math.min(255, base.stats[stat] + bonuses[stat]);
    return { officerId: base.officerId, trueLoyalty: personnel.snapshot.officers.find(officer => officer.id === base.officerId)!.trueLoyalty,
      base: base.stats, inferredBonuses: bonuses, effective, sourceEffects };
  });
  return freeze({ ok: true as const, state: { schema: 'inferred-treasure-turn-projection-v1' as const,
    initialConfiscation: treasury.state, personnelScenario: scenario, baseStats, equipment, commands },
    revision: commands.length, date: personnel.snapshot.date, personnelState: personnel, receipts, projections,
    holdings: treasury.items, actionPoints: treasury.actionPoints,
    equipmentPolicy: 'explicit-max-per-stat-cap255-view-v1' as const,
    inventorySnapshotFixed: true as const, originalTreasuryModified: false as const,
    permanentAttributesModified: false as const, nativeBonusVerified: false as const, campaignWorldWritten: false as const });
}
export function readInferredTreasureTurnSession(input: unknown) {
  try { return replay(detach(input)); } catch { return fail('invalid-data-input'); }
}
export function createInferredTreasureTurnSession(initialConfiscation: unknown, personnelScenario: unknown, baseStats: unknown, equipment: unknown) {
  return readInferredTreasureTurnSession({ schema: 'inferred-treasure-turn-projection-v1', initialConfiscation, personnelScenario, baseStats, equipment, commands: [] });
}
export function advanceInferredTreasureTurn(input: unknown, rawCommand: unknown) {
  const current = readInferredTreasureTurnSession(input);
  if (!current.ok) return current;
  let clean: unknown; try { clean = detach(rawCommand); } catch { return fail('invalid-command-data'); }
  const command = commandFrom(clean);
  if (!command || command.expectedRevision !== current.revision || current.revision >= 128) return fail('invalid-command-or-capacity');
  return readInferredTreasureTurnSession({ ...current.state, commands: [...current.state.commands, command] });
}
export function saveInferredTreasureTurnSession(input: unknown) {
  const result = readInferredTreasureTurnSession(input);
  if (!result.ok) return result;
  const json = JSON.stringify(result.state);
  return json.length <= 2000000 ? freeze({ ok: true as const, json }) : fail('save-capacity');
}
export function loadInferredTreasureTurnSession(json: unknown) {
  if (typeof json !== 'string' || json.length > 2000000) return fail('invalid-save');
  try { return readInferredTreasureTurnSession(JSON.parse(json)); } catch { return fail('invalid-save'); }
}
