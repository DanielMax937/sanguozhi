/** Read-only live-holder attribute projection. No balance, loyalty, XP or base-stat writer. */
import treasureCatalog from '../../../../docs/sources/treasures.json' with { type: 'json' };
type Frozen<T> = T extends object ? { readonly [K in keyof T]: Frozen<T[K]> } : T;
const STATS = ['leadership', 'war', 'intelligence', 'politics', 'charisma'] as const;
type Stat = typeof STATS[number];
type Stats = Record<Stat, number>;
const fail = (reason: string) => Object.freeze({ ok: false as const, reason });
const uint = (v: unknown, max: number): v is number => typeof v === 'number' && Number.isSafeInteger(v) && !Object.is(v, -0) && v >= 0 && v <= max;
const record = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === 'object' && !Array.isArray(v);
const exact = (v: Record<string, unknown>, names: readonly string[]) => Object.keys(v).length === names.length && names.every(name => Object.hasOwn(v, name));
const id = (v: unknown): v is string => typeof v === 'string' && /^synthetic-[a-z0-9-]{1,48}$/.test(v);
function freeze<T>(value: T): Frozen<T> {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) { for (const child of Object.values(value)) freeze(child); Object.freeze(value); }
  return value as Frozen<T>;
}
const zero = (): Stats => ({ leadership: 0, war: 0, intelligence: 0, politics: 0, charisma: 0 });
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

/** items: metadata.items live rows; officers: owner-derived {id,leadership,war,intelligence,politics,charm};
 * config: {equipment:[{itemId,sourceIndex,inferredBonuses}]}. The caller binds both live inputs to its replay.
 * No standalone snapshot authority is created. WAR must include the owner's current Train progression.
 */
export function projectSyntheticTreasureAttributes(rawItems: unknown, rawOfficers: unknown, rawConfig: unknown) {
  try {
    const itemData = detach(rawItems), officerData = detach(rawOfficers), config = detach(rawConfig);
    if (!Array.isArray(itemData) || itemData.length < 1 || itemData.length > 64
      || !Array.isArray(officerData) || officerData.length < 1 || officerData.length > 64
      || !record(config) || !exact(config, ['equipment']) || !Array.isArray(config.equipment)
      || config.equipment.length !== itemData.length) return fail('invalid-attribute-input');
    const bases = new Map<string, Stats>();
    for (const officer of officerData) {
      if (!record(officer) || !exact(officer, ['id', 'leadership', 'war', 'intelligence', 'politics', 'charm'])
        || !id(officer.id) || bases.has(officer.id)
        || !['leadership', 'war', 'intelligence', 'politics', 'charm'].every(k => uint(officer[k], 255))) return fail('invalid-current-officer-attributes');
      bases.set(officer.id, { leadership: officer.leadership as number, war: officer.war as number,
        intelligence: officer.intelligence as number, politics: officer.politics as number, charisma: officer.charm as number });
    }
    const items = new Map<string, { id: string; value: number; holder: string | null }>();
    for (const item of itemData) {
      if (!record(item) || !exact(item, ['id', 'value', 'holder']) || !id(item.id) || items.has(item.id) || bases.has(item.id)
        || !uint(item.value, 255) || (item.holder !== null && (!id(item.holder) || !bases.has(item.holder)))) return fail('invalid-live-item');
      items.set(item.id, { id: item.id, value: item.value, holder: item.holder as string | null });
    }
    const bindings = new Map<string, { sourceIndex: number | null; inferredBonuses: Stats }>();
    for (const binding of config.equipment) {
      if (!record(binding) || !exact(binding, ['itemId', 'sourceIndex', 'inferredBonuses']) || !id(binding.itemId)
        || bindings.has(binding.itemId) || !items.has(binding.itemId) || !record(binding.inferredBonuses)
        || !exact(binding.inferredBonuses, STATS) || !STATS.every(stat => uint((binding.inferredBonuses as Record<string, unknown>)[stat], 100))
        || (binding.sourceIndex !== null && !uint(binding.sourceIndex, treasureCatalog.treasures.length - 1))) return fail('invalid-equipment-binding');
      const sourceIndex = binding.sourceIndex as number | null;
      if (sourceIndex !== null && treasureCatalog.treasures[sourceIndex]!.value !== items.get(binding.itemId)!.value) return fail('source-item-value-mismatch');
      const bonuses = zero(); for (const stat of STATS) bonuses[stat] = binding.inferredBonuses[stat] as number;
      bindings.set(binding.itemId, { sourceIndex, inferredBonuses: bonuses });
    }
    const compare = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0;
    const sortedItems = [...items.values()].sort((a, b) => compare(a.id, b.id));
    const projections = [...bases].sort(([a], [b]) => compare(a, b)).map(([officerId, base]) => {
      const bonuses = zero();
      const sourceEffects = sortedItems.filter(item => item.holder === officerId).map(item => {
        const binding = bindings.get(item.id)!;
        for (const stat of STATS) bonuses[stat] = Math.max(bonuses[stat], binding.inferredBonuses[stat]);
        const row = binding.sourceIndex === null ? null : treasureCatalog.treasures[binding.sourceIndex]!;
        return { itemId: item.id, sourceIndex: binding.sourceIndex, sourceName: row?.name ?? null,
          documentedEffect: row?.effect ?? null, effectExecuted: false as const };
      });
      const effective = zero(); for (const stat of STATS) effective[stat] = Math.min(255, base[stat] + bonuses[stat]);
      return { officerId, base, inferredBonuses: bonuses, effective, sourceEffects };
    });
    return freeze({ ok: true as const, projections, equipmentPolicy: 'explicit-max-per-stat-cap255-view-v1' as const,
      inputPolicy: 'live-owner-base0to255-bonus0to100-v1' as const,
      loyaltyOrBalancesWritten: false as const, baseStatsWritten: false as const, nativeEquivalent: false as const });
  } catch { return fail('invalid-attribute-data'); }
}
