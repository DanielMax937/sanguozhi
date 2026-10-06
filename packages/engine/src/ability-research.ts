import data from '../../../docs/sources/pk-ability-research/catalog.json' with { type: 'json' };

/** Application IDs are stable semantic keys, never native scenario record IDs. */
export type AbilityResearchCategory = 'stat' | 'aptitude' | 'skill';
export type AbilityResearchPrerequisites = { readonly allOf: readonly string[] };
export type AbilityResearchBaseNode = {
  readonly id: string;
  readonly name: string;
  readonly sourceLabel: string;
  readonly version: 'pk';
  readonly months: 3 | 4 | 5 | 6;
  readonly costGold: 300;
  readonly costAP: 20;
  readonly trainingCategory: AbilityResearchCategory;
  readonly useLimit: 1 | 3 | 5;
  readonly prerequisites: AbilityResearchPrerequisites;
  readonly imageCenter: readonly [number, number];
  readonly evidence: readonly string[];
};
export type AbilityResearchHiddenAlternative = Omit<AbilityResearchBaseNode, 'imageCenter' | 'months' | 'useLimit' | 'trainingCategory'> & {
  readonly tableColumn: 1 | 2 | 3 | 4 | 5;
  readonly skillKey: string;
  readonly trainingCategory: 'skill';
  /** Explicit guide values; conflicts retain contradictory historical sources. */
  readonly months: 3 | 6;
  readonly useLimit: 3 | 5;
  readonly conflicts?: readonly string[];
};
export type AbilityResearchHiddenSlot = {
  readonly id: string;
  readonly sourceLabel: string;
  readonly tableRow: string;
  readonly rule15Position: number;
  readonly zolTablePosition: number;
  /** Schematic slot label; each alternative stores its own source-backed months. */
  readonly imageMonths: 3 | 6;
  readonly imageCenter: readonly [number, number];
  readonly imageIncoming: readonly string[];
  readonly alternatives: readonly AbilityResearchHiddenAlternative[];
};
type DeepReadonly<T> = T extends object ? { readonly [P in keyof T]: DeepReadonly<T[P]> } : T;
export type AbilityResearchCatalog = Omit<DeepReadonly<typeof data>, 'baseNodes' | 'hiddenSlots'> & {
  readonly baseNodes: readonly AbilityResearchBaseNode[];
  readonly hiddenSlots: readonly AbilityResearchHiddenSlot[];
};
function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object') {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
}
/** Static guide data only. Does not add commands, scheduling or RNG to the engine. */
export const PK_ABILITY_RESEARCH = deepFreeze(data) as unknown as AbilityResearchCatalog;
