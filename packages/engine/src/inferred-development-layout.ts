/** Original opt-in three-city exercise lots, never original San11 coordinates. */
import citiesData from '../../../docs/sources/cities.json' with { type: 'json' };
import example from '../../../data/scenarios/facility-construction-example-v1.json' with { type: 'json' };
import { createFacilityConstructionState } from './facility-construction-lifecycle.ts';
import { createInferredPracticeMovementRequest } from './inferred-practice-map.ts';
import { moveOnSuppliedMap } from './supplied-map-movement.ts';

type Frozen<T> = T extends object ? { readonly [K in keyof T]: Frozen<T[K]> } : T;
function freeze<T>(value: T): Frozen<T> {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value as Frozen<T>;
}
const fail = (reason: string) => freeze({ ok: false as const, reason });

/** Initializes the existing construction service with synthetic lots AND validates
 * the corresponding movement map. There is no shared clock or command dispatcher.
 */
export function createInferredDevelopmentScenario(cityName: string, startYear: number) {
  if (typeof cityName !== 'string' || !['北海', '建業', '會稽'].includes(cityName)
    || typeof startYear !== 'number' || !Number.isSafeInteger(startYear) || Object.is(startYear, -0)
    || startYear < 1 || startYear > 9998) return fail('invalid-city-or-start-year');
  const source = citiesData.cities.find(city => city.name === cityName);
  if (!source || !Number.isSafeInteger(source.developmentLots) || source.developmentLots < 1 || source.developmentLots > 30) return fail('unsupported-lot-catalog');
  const cityId = 'synthetic-development-city', forceId = 'synthetic-development-force';
  const cityKey = cityName === '北海' ? 'beihai' : cityName === '建業' ? 'jianye' : 'kuaiji';
  // Design choice only: three columns, consecutive rows, one connected axial patch.
  // Native developmentPatches remains null; the source catalog is never modified.
  const mapping = Array.from({ length: source.developmentLots }, (_, index) => {
    const q = 1 + index % 3, r = Math.floor(index / 3);
    const x = 100 + q, y = 100 + r + Math.floor(q / 2);
    return { lotId: `synthetic-lot-${index + 1}`, position: { q, r }, cellId: `g-${x}-${y}`, x, y };
  });
  const scenario = JSON.parse(JSON.stringify(example.scenario)) as typeof example.scenario;
  scenario.date = { year: startYear, month: 1, day: 1 };
  scenario.turn = 0;
  scenario.advanceLimit = 36;
  scenario.activeForceId = forceId;
  scenario.force = { id: forceId, techniquePoints: 0 };
  scenario.corps = { id: 'synthetic-development-corps', forceId, actionPoints: 200 };
  scenario.city = { id: cityId, kind: 'city', ownerForceId: forceId, position: { q: 0, r: 0 }, gold: 5000, goldCapacity: 100000 };
  scenario.officers = [{ id: 'synthetic-development-actor', forceId, cityId, available: true,
    politics: 70, politicsXp: 0, merit: 0, actedTurn: null }];
  scenario.lots = mapping.map(lot => ({ id: lot.lotId, cityId, position: { ...lot.position } }));
  scenario.facilities = [];
  scenario.hostileForceIds = [];
  scenario.completeFieldUnits = true;
  scenario.fieldUnits = [];
  scenario.turnInputs = Array.from({ length: 36 }, () => ({ fieldUnits: [] }));
  // Existing policy/catalog are kept verbatim, not expanded into a new build mode.
  const construction = createFacilityConstructionState(scenario);
  if (!construction.ok) return fail(`construction-initialization:${construction.reason}`);
  const practice = createInferredPracticeMovementRequest(), lotCells = new Set(mapping.map(lot => lot.cellId));
  const cells = practice.map.cells.map(cell => lotCells.has(cell.id)
    ? { ...cell, terrainInfoU32: 0, flagsU32: 0, blocked: false, occupied: false, unsupportedContext: false, facilityPresent: false }
    : cell);
  if (cells.filter(cell => lotCells.has(cell.id)).length !== mapping.length) return fail('lot-map-cell-mismatch');
  const movement = moveOnSuppliedMap({ ...practice, map: { id: `inferred-development-${cityKey}-odd-q-v1`, cells } });
  if (!movement.ok) return fail(`movement-initialization:${movement.reason}`);
  return freeze({ ok: true as const, policyId: 'inferred-three-city-development-layout-v1' as const,
    evidence: 'explicit-original-layout-inference' as const, cityName, lotCount: source.developmentLots,
    nativeDevelopmentPatches: source.developmentPatches, inferredComponentCount: 1,
    mapping, constructionState: construction.state, movementRequest: movement.request,
    consumers: { construction: 'executeFacilityConstructionCommand', movement: 'moveOnSuppliedMap' } as const,
    coordinateTransform: 'x=100+q;y=100+r+floor(q/2)' as const,
    nativeCoordinatesRecovered: false as const, nativeScenarioRecovered: false as const,
    sharedClock: false as const, sharedResources: false as const, automaticMapFacilitySync: false as const,
    originalPersonsModified: false as const, loadingExecutesConstructionCommands: false as const });
}
