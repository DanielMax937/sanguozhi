/** Explicit engineering inferences: requests/data only, never native/world writes.
 * See docs/rules/inferred-rule-requests-v1.md. No old service policy is changed.
 */
import citiesData from '../../../docs/sources/cities.json' with { type: 'json' };
import { PK_ABILITY_RESEARCH } from './ability-research.ts';

const EVIDENCE = 'explicit-inference-not-native' as const;
const NO_WRITE = false as const;
function integer(v: unknown, maximum: number): v is number {
  return typeof v === 'number' && Number.isSafeInteger(v) && !Object.is(v, -0) && v >= 0 && v <= maximum;
}
function freeze<T>(v: T): Readonly<T> {
  if (v !== null && typeof v === 'object') {
    for (const item of Object.values(v)) freeze(item);
    Object.freeze(v);
  }
  return v;
}
const failure = (reason: string) => Object.freeze({ ok: false as const, reason });

/** Each requested hungry boundary retains floor(76*n/100); no casualty is applied. */
export function projectInferredStarvation(troops: number, wholeHungryTurns: number) {
  if (!integer(troops, Number.MAX_SAFE_INTEGER) || !integer(wholeHungryTurns, 360)) return failure('invalid-input');
  let remaining = troops;
  const steps: { turn: number; before: number; projectedRemaining: number; requestedLoss: number }[] = [];
  for (let turn = 1; turn <= wholeHungryTurns; turn++) {
    const before = remaining;
    remaining = Number(BigInt(before) * 76n / 100n);
    steps.push({ turn, before, projectedRemaining: remaining, requestedLoss: before - remaining });
  }
  return freeze({ ok: true as const, policyId: 'inferred-legacy-76-percent-retention-v1', evidence: EVIDENCE,
    worldWriteEnabled: NO_WRITE, initialTroops: troops, wholeHungryTurns, requestedLoss: troops - remaining,
    projectedRemaining: remaining, terminalHandlingRequired: troops > 0 && remaining === 0, steps });
}

/** Choose five distinct guide slots and one alternative each. New synthetic PRNG. */
export function selectInferredHiddenResearch(seed: number) {
  if (!integer(seed, 0xffffffff)) return failure('invalid-seed');
  const slots = [...PK_ABILITY_RESEARCH.hiddenSlots].sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  if (slots.length !== 10 || slots.some(s => s.alternatives.length !== 5)) return failure('unsupported-catalog');
  let word = seed;
  const draws: { bound: number; word: number; index: number }[] = [];
  function draw(bound: number): number {
    word = (Math.imul(word, 1664525) + 1013904223) >>> 0;
    const index = Math.floor(word * bound / 4294967296);
    draws.push({ bound, word, index }); return index;
  }
  const hiddenSelections: { slotId: string; candidateId: string }[] = [];
  for (let i = 0; i < 5; i++) {
    const slot = slots.splice(draw(slots.length), 1)[0]!;
    const alternatives = [...slot.alternatives].sort((a, b) => a.tableColumn - b.tableColumn);
    hiddenSelections.push({ slotId: slot.id, candidateId: alternatives[draw(5)]!.id });
  }
  hiddenSelections.sort((a, b) => a.slotId < b.slotId ? -1 : a.slotId > b.slotId ? 1 : 0);
  return freeze({ ok: true as const, policyId: 'inferred-hidden-five-of-ten-lcg-v1', evidence: EVIDENCE,
    worldWriteEnabled: NO_WRITE, seed, finalWord: word, strictlyUniform: false as const, nativeRng: false as const,
    hiddenSelections, draws });
}

/** Abstract component only. Same component never asserts hex adjacency. */
export function inferCityDevelopmentPartition(cityName: string) {
  if (typeof cityName !== 'string' || !['北海', '建業', '會稽'].includes(cityName)) return failure('unsupported-city');
  const city = citiesData.cities.find(c => c.name === cityName);
  if (!city || !integer(city.developmentLots, 100)) return failure('unsupported-catalog');
  return freeze({ ok: true as const, policyId: 'inferred-one-abstract-development-component-v1', evidence: EVIDENCE,
    worldWriteEnabled: NO_WRITE, cityName, totalLots: city.developmentLots, componentSizes: [city.developmentLots],
    confidence: cityName === '會稽' ? 'low-design-choice' as const : 'qualitative-guide-inference' as const,
    adjacencyEstablished: false as const, nativeCoordinatesEstablished: false as const });
}

/** Shortest route on the documented city graph, ten synthetic days per edge.
 * No terrain, ownership, eligibility, return task, or person relocation is inferred.
 */
export function projectInferredOfficerTravel(fromCity: string, toCity: string) {
  if (typeof fromCity !== 'string' || typeof toCity !== 'string') return failure('invalid-city');
  const cities = new Map(citiesData.cities.map(c => [c.name, c]));
  if (!cities.has(fromCity) || !cities.has(toCity)) return failure('unknown-city');
  const queue: string[][] = [[fromCity]], visited = new Set([fromCity]);
  for (let cursor = 0; cursor < queue.length; cursor++) {
    const route = queue[cursor]!, last = route[route.length - 1]!;
    if (last === toCity) return freeze({ ok: true as const, policyId: 'inferred-city-graph-ten-days-per-edge-v1',
      evidence: EVIDENCE, worldWriteEnabled: NO_WRITE, route, edges: route.length - 1,
      requestedTravelDays: (route.length - 1) * 10, eligibilityEstablished: false as const, nativeDistanceEstablished: false as const });
    for (const neighbor of [...cities.get(last)!.neighbors].sort()) {
      if (!cities.has(neighbor)) return failure('invalid-catalog-neighbor');
      if (!visited.has(neighbor)) { visited.add(neighbor); queue.push([...route, neighbor]); }
    }
  }
  return failure('unreachable-in-supplied-city-graph');
}
