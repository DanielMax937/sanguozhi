/** Original synthetic exercise layout. Not original San11 geographical data. */
import { GUIDE_REFERENCE_MOVEMENT_POLICY, moveOnSuppliedMap } from './supplied-map-movement.ts';
import type { SuppliedMovementCell, SuppliedMovementRequest } from './supplied-map-movement.ts';
import { createInferredCityCommandScenario } from './inferred-blueprints.ts';
import { createCityCommandState } from './city-command-lifecycle.ts';

type Frozen<T> = T extends object ? { readonly [K in keyof T]: Frozen<T[K]> } : T;
function freeze<T>(value: T): Frozen<T> {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value as Frozen<T>;
}
const key = (x: number, y: number): string => `g-${x}-${y}`;
/** Design choice: odd-q six-neighbor layout, not proof of native adjacency. */
function adjacent(x: number, y: number): string[] {
  const lower = x % 2 === 0 ? -1 : 0;
  return [[x, y - 1], [x, y + 1], [x - 1, y + lower], [x - 1, y + lower + 1],
    [x + 1, y + lower], [x + 1, y + lower + 1]]
    .filter(([a, b]) => a! >= 0 && a! < 200 && b! >= 0 && b! < 200)
    .map(([a, b]) => key(a!, b!));
}
/** Directly consumable by moveOnSuppliedMap; dimensions/terrain are synthetic. */
export function createInferredPracticeMovementRequest(): Frozen<SuppliedMovementRequest> {
  const cells: SuppliedMovementCell[] = [];
  for (let x = 0; x < 200; x++) for (let y = 0; y < 200; y++) {
    const rim = x === 0 || y === 0 || x === 199 || y === 199;
    const plaza = Math.abs(x - 100) <= 2 && Math.abs(y - 100) <= 2;
    // Artificial channels every forty columns; grass crossing every twenty rows.
    const river = x % 40 === 20 && y % 20 !== 10;
    const forest = (x * 31 + y * 17) % 7 === 0;
    const terrain = plaza || rim ? 0 : river ? 7 : forest ? 5 : 0;
    cells.push({ id: key(x, y), terrainInfoU32: terrain, flagsU32: 0, adjacent: adjacent(x, y),
      blocked: rim, occupied: false, unsupportedContext: false, facilityPresent: x === 100 && y === 100 });
  }
  return freeze({ version: 1 as const, map: { id: 'inferred-practice-200x200-odd-q-v1', cells },
    state: { unitId: 'synthetic-practice-marker', cellId: key(100, 100), budget: 64,
      landEquipmentId: 1, navalEquipmentId: 9, transport: false }, path: [],
    policy: GUIDE_REFERENCE_MOVEMENT_POLICY });
}

/** Actually initializes the existing city state AND validates the movement input.
 * The two services stay independent: this is not a shared world clock or save.
 */
export function createInferredPracticeScenario(cityName: string, startYear: number) {
  const blueprint = createInferredCityCommandScenario(cityName, startYear);
  if (!blueprint.ok) return freeze({ ok: false as const, reason: blueprint.reason });
  const cityState = createCityCommandState(blueprint.scenario);
  if ('ok' in cityState) return freeze({ ok: false as const, reason: `city-initialization:${cityState.reason}` });
  const movement = moveOnSuppliedMap(createInferredPracticeMovementRequest());
  if (!movement.ok) return freeze({ ok: false as const, reason: `movement-initialization:${movement.reason}` });
  return freeze({ ok: true as const, policyId: 'inferred-neutral-practice-scenario-v1' as const,
    evidence: 'explicit-original-design-inference' as const, historicalScenario: false as const,
    nativeMapRecovered: false as const, nativeScenarioRecovered: false as const,
    cityName, cityState, movementRequest: movement.request,
    consumers: { city: 'executeCityCommand', movement: 'moveOnSuppliedMap' } as const,
    clocksShared: false as const, resourcesShared: false as const, globalGameStateCreated: false as const,
    cityFoodModeled: false as const, nativePersonsOrUnitsCreated: false as const });
}
