/** Explicit abstract substitutes for missing original maps/scenarios/event execution.
 * These are data/plans, not native scenarios or executable campaign state.
 */
import exampleCity from '../../../data/scenarios/city-command-example-v1.json' with { type: 'json' };
import { CITY_COMMAND_DEFAULT_POLICIES } from './city-command-lifecycle.ts';
import type { CityScenarioV1 } from './city-command-lifecycle.ts';
import citiesData from '../../../docs/sources/cities.json' with { type: 'json' };
import { listSourceEventObservationsV1 } from './source-event-query.ts';

type Frozen<T> = T extends object ? { readonly [K in keyof T]: Frozen<T[K]> } : T;
function freeze<T>(v: T): Frozen<T> {
  if (v !== null && typeof v === 'object' && !Object.isFrozen(v)) {
    for (const child of Object.values(v)) freeze(child);
    Object.freeze(v);
  }
  return v as Frozen<T>;
}
const invalid = (reason: string) => Object.freeze({ ok: false as const, reason });
const integer = (n: unknown, min: number, max: number): n is number => typeof n === 'number' && Number.isSafeInteger(n) && !Object.is(n, -0) && n >= min && n <= max;

export function createInferredSandboxBlueprint(startYear: number) {
  if (!integer(startYear, 1, 9999)) return invalid('invalid-start-year');
  const cities = citiesData.cities.map(city => ({
    name: city.name, owner: null, governor: null, officers: [] as string[],
    stocks: { gold: 5000, food: 20000, troops: 10000 },
    // These are independent design values, never source income fields repurposed as stock.
    developmentLots: city.developmentLots, facilities: [] as string[],
    neighbors: [...city.neighbors].sort(), nativeCoordinates: null, terrain: null,
  })).sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
  return freeze({ ok: true as const, policyId: 'inferred-neutral-42-city-blueprint-v1',
    evidence: 'explicit-design-inference' as const, historicalScenario: false as const,
    worldLoadingEnabled: false as const, startDate: { year: startYear, month: 1, day: 1 },
    mapKind: 'documented-city-adjacency-abstraction' as const, nativeHexGridRecovered: false as const,
    forces: [] as string[], cities, sharedClockEstablished: false as const,
    playableGameState: false as const });
}

/** Direct input contract for createCityCommandState, not an automatic state load. */
export function createInferredCityCommandScenario(cityName: string, startYear: number) {
  if (typeof cityName !== 'string' || !integer(startYear, 1, 9999)) return invalid('invalid-input');
  const source = citiesData.cities.find(c => c.name === cityName);
  if (!source) return invalid('unknown-city');
  // Copy only static catalog/inventory structure; no historical ownership is inferred.
  const scenario = JSON.parse(JSON.stringify(exampleCity)) as typeof exampleCity;
  scenario.date = { year: startYear, month: 1, day: 1 };
  scenario.turn = 0;
  scenario.city.gold = 5000;
  scenario.city.security = 80;
  scenario.city.troops = 10000;
  scenario.city.troopCapacity = source.maxSoldiers;
  scenario.city.morale = 80;
  scenario.city.patrolUsedTurn = null;
  scenario.corps.actionPoints = 200;
  scenario.officers = scenario.officers.slice(0, 1);
  const officer = scenario.officers[0]!;
  officer.leadership = 70; officer.charm = 70; officer.intelligence = 70;
  officer.actedTurn = null; officer.reservationJobId = null;
  scenario.facilities = ['barracks', 'forge'].map(kind => scenario.facilities.find(f => f.kind === kind)!);
  for (const facility of scenario.facilities) { facility.level = 1; facility.complete = true; facility.usedTurn = null; facility.reservationJobId = null; }
  scenario.unlockedEquipmentTypes = [1, 2, 3, 4];
  scenario.policies = JSON.parse(JSON.stringify(CITY_COMMAND_DEFAULT_POLICIES)) as typeof scenario.policies;
  return freeze({ ok: true as const, policyId: 'inferred-city-command-neutral-start-v1', evidence: 'explicit-design-inference' as const,
    historicalScenario: false as const, worldLoadingEnabled: false as const, cityName,
    consumer: 'createCityCommandState' as const, scenario: scenario as unknown as CityScenarioV1,
    omittedFoodStock: 20000, foodModeledByConsumer: false as const,
    syntheticIdentitiesOnly: true as const });
}

/** Plan a source-inspired narrative notice; never assert the original event occurs.
 * Unknown original clauses remain unknown in source-event-query; no registry is mutated.
 */
export function planInferredNarrativeNotice(sourcePath: string, observationId: string, year: number, month: number,
  alreadyNoticed: boolean, knownConditionsConfirmed: boolean, versionCompatibleConfirmed: boolean) {
  if (typeof sourcePath !== 'string' || sourcePath.length > 512 || typeof observationId !== 'string' || observationId.length > 256
    || !integer(year, 1, 9999) || !integer(month, 1, 12)
    || ![alreadyNoticed, knownConditionsConfirmed, versionCompatibleConfirmed].every(x => typeof x === 'boolean')) return invalid('invalid-input');
  const listed = listSourceEventObservationsV1();
  if (!listed.ok) return invalid('source-catalog-unavailable');
  const matches = listed.observations.filter(o => o.observationRef.sourcePath === sourcePath && o.observationRef.observationId === observationId);
  if (matches.length !== 1) return invalid('unknown-or-ambiguous-source-observation');
  const observation = matches[0]!;
  const key = `${sourcePath}\u0000${observationId}`;
  let hash = 2166136261;
  for (let i = 0; i < key.length; i++) hash = Math.imul(hash ^ key.charCodeAt(i), 16777619) >>> 0;
  const scheduledMonth = hash % 12 + 1;
  const shouldPresent = !alreadyNoticed && knownConditionsConfirmed && versionCompatibleConfirmed && month === scheduledMonth;
  return freeze({ ok: true as const, policyId: 'inferred-source-narrative-calendar-v1',
    evidence: 'explicit-design-inference' as const, sourceRef: observation.observationRef,
    sourceTitle: observation.title, sourceURL: observation.sourceURL,
    scheduledDate: { year, month: scheduledMonth, day: 1 },
    knownConditionsConfirmed, versionCompatibleConfirmed, alreadyNoticed, shouldPresent,
    notice: shouldPresent ? { kind: 'source-inspired-notice' as const, title: observation.title,
      text: '推断叙事提示；原游戏事件条件、发生时间及效果未在此执行。' } : null,
    originalConditionsReconstructed: false as const, originalEventOccurrence: 'not-evaluated' as const,
    originalEffectsApplied: false as const, executionEnabled: false as const,
    resourceChanges: [] as never[], personnelChanges: [] as never[], worldChanges: [] as never[] });
}
