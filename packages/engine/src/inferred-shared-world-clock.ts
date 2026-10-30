/** Explicit synthetic city/travel clock. No original-person or global campaign writer. */
import citiesData from '../../../docs/sources/cities.json' with { type: 'json' };
import { createBoundedCityPieceClockV1, executeBoundedCityPieceClockV1 } from './bounded-city-piece-clock.ts';
import type { BoundedCityPieceClockScenarioV1, BoundedCityPieceClockEnvelopeV1, BoundedCityPieceClockReceiptV1 } from './bounded-city-piece-clock.ts';
import { createInferredTravelWorld, executeInferredTravelWorld } from './inferred-travel-world.ts';
import type { InferredTravelWorldResultV1 } from './inferred-travel-world.ts';

const MAX_COMMANDS = 64, MAX_JSON = 2000000;
const fail = (reason: string) => Object.freeze({ ok: false as const, reason });
const uint = (v: unknown, max: number): v is number => typeof v === 'number' && Number.isSafeInteger(v) && !Object.is(v, -0) && v >= 0 && v <= max;
const record = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === 'object' && !Array.isArray(v);
const exact = (v: Record<string, unknown>, fields: readonly string[]) => Object.keys(v).length === fields.length && fields.every(k => Object.hasOwn(v, k));
const synthetic = (v: unknown): v is string => typeof v === 'string' && /^synthetic-[a-z0-9-]{1,48}$/.test(v);
type Action = Readonly<{ kind: 'City'; command: BoundedCityPieceClockEnvelopeV1['command'] }>
  | Readonly<{ kind: 'StartTravel'; travelerId: string; destination: string }>
  | Readonly<{ kind: 'AdvanceWorldTurn' }>;
type Command = Readonly<{ id: string; expectedRevision: number; action: Action }>;
function freeze<T>(value: T): Readonly<T> {
  if (value !== null && typeof value === 'object') { for (const child of Object.values(value)) freeze(child); Object.freeze(value); }
  return value;
}
const runtime = globalThis as { process?: { getBuiltinModule?: (id: string) => { types: { isProxy(v: unknown): boolean } } } };
const isProxy = typeof runtime.process?.getBuiltinModule === 'function' ? runtime.process.getBuiltinModule('node:util').types.isProxy : (() => false);
function detach(input: unknown): unknown {
  let nodes = 0, chars = 0; const active = new Set<object>();
  const invalid = (): never => { throw new Error('invalid-data'); };
  function visit(value: unknown, depth: number): unknown {
    if (++nodes > 200000 || depth > 64) return invalid();
    if (value === null || typeof value === 'boolean') return value;
    if (typeof value === 'number') return Number.isSafeInteger(value) && !Object.is(value, -0) ? value : invalid();
    if (typeof value === 'string') { chars += value.length; return chars <= MAX_JSON ? value : invalid(); }
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
        if (!uint(length, 10000) || names.length !== length + 1) return invalid();
        const out: unknown[] = [];
        for (let i = 0; i < length; i++) { const descriptor = descriptors[String(i)]; if (!descriptor) return invalid(); out.push(visit(descriptor.value, depth + 1)); }
        return out;
      }
      if (names.length > 128) return invalid();
      const out: Record<string, unknown> = {};
      for (const name of names as string[]) Object.defineProperty(out, name, { value: visit(descriptors[name]!.value, depth + 1), enumerable: true });
      return out;
    } finally { active.delete(value); }
  }
  return visit(input, 0);
}
function commandFrom(value: unknown): Command | undefined {
  if (!record(value) || !exact(value, ['id', 'expectedRevision', 'action']) || !synthetic(value.id)
    || !uint(value.expectedRevision, MAX_COMMANDS - 1) || !record(value.action)) return undefined;
  const action = value.action;
  if (action.kind === 'AdvanceWorldTurn' && exact(action, ['kind'])) return { id: value.id, expectedRevision: value.expectedRevision, action: { kind: 'AdvanceWorldTurn' } };
  if (action.kind === 'StartTravel' && exact(action, ['kind', 'travelerId', 'destination'])
    && typeof action.travelerId === 'string' && /^traveler-synthetic-[a-z0-9-]{1,40}$/.test(action.travelerId)
    && typeof action.destination === 'string') return { id: value.id, expectedRevision: value.expectedRevision,
      action: { kind: 'StartTravel', travelerId: action.travelerId, destination: action.destination } };
  if (action.kind === 'City' && exact(action, ['kind', 'command']) && record(action.command)
    && (action.command.type === 'ExecuteCityActions' || action.command.type === 'StartPieceProduction')) {
    // The existing city service performs the complete command schema/eligibility validation.
    return { id: value.id, expectedRevision: value.expectedRevision,
      action: { kind: 'City', command: action.command as unknown as BoundedCityPieceClockEnvelopeV1['command'] } };
  }
  return undefined;
}
function sameDate(a: { year: number; month: number; day: number }, b: { year: number; month: number; day: number }) {
  return a.year === b.year && a.month === b.month && a.day === b.day;
}
function replay(input: unknown) {
  if (!record(input) || !exact(input, ['schema', 'cityName', 'cityScenario', 'travelScenario', 'commands'])
    || input.schema !== 'inferred-shared-city-travel-clock-v1' || typeof input.cityName !== 'string'
    || !citiesData.cities.some(city => city.name === input.cityName) || !Array.isArray(input.commands)
    || input.commands.length > MAX_COMMANDS) return fail('invalid-world-envelope');
  const cityInitial = createBoundedCityPieceClockV1(input.cityScenario as BoundedCityPieceClockScenarioV1);
  if (!cityInitial.ok) return fail(`city-genesis:${cityInitial.reason}`);
  const travelInitial = createInferredTravelWorld(input.travelScenario);
  if (!travelInitial.ok) return fail(`travel-genesis:${travelInitial.reason}`);
  const g = cityInitial.state.genesis, tg = travelInitial.state.genesis;
  if (g.clock.turn !== 0 || g.clock.date.month !== 1 || g.clock.date.day !== 1 || g.clock.date.year !== tg.startYear)
    return fail('initial-clocks-must-be-same-year-start');
  const domainIds = [g.episodeId, g.activeForceId, g.corps.id, g.corps.forceId, g.city.id, g.city.ownerForceId,
    ...g.officers.flatMap(officer => [officer.id, officer.forceId, officer.cityId]),
    ...g.facilities.flatMap(facility => [facility.id, facility.cityId]), ...g.merchant.hostileForceIds,
    ...g.merchant.fieldUnits.flatMap(unit => [unit.id, unit.forceId])];
  if (!domainIds.every(synthetic) || !tg.travelers.every(traveler => /^traveler-synthetic-[a-z0-9-]{1,40}$/.test(traveler.id)))
    return fail('synthetic-identities-required');
  // cityName is an explicit binding of this one exercise city to the documented graph.
  // Travelers are a separate entity namespace, never projected onto city officers.
  let city = cityInitial.state, travel = travelInitial.state;
  const commands: Command[] = [], receipts = [], seen = new Set<string>();
  const root = () => ({ schema: 'inferred-shared-city-travel-clock-v1' as const, cityName: input.cityName as string,
    cityScenario: g, travelScenario: tg, commands: [...commands] });
  const fits = () => JSON.stringify({ state: root(), city, travel, receipts }).length <= MAX_JSON - 4096;
  if (!fits()) return fail('world-output-budget');
  for (const entry of input.commands) {
    const command = commandFrom(entry);
    if (!command || command.expectedRevision !== commands.length || seen.has(command.id)) return fail('invalid-or-duplicate-world-command');
    const action = command.action, innerId = `world-${commands.length}`;
    let proposedCity = city, proposedTravel = travel;
    let cityReceipt: BoundedCityPieceClockReceiptV1 | null = null;
    let travelReceipt: Extract<InferredTravelWorldResultV1, { ok: true }>['receipt'] | null = null;
    if (action.kind === 'City' || action.kind === 'AdvanceWorldTurn') {
      const result = executeBoundedCityPieceClockV1(city, { id: innerId, expectedRevision: city.revision,
        command: action.kind === 'City' ? action.command : { type: 'AdvanceSharedCityTurn' } });
      if (!result.ok) return fail(`city-part:${result.reason}`);
      if (result.duplicate) return fail('unexpected-city-duplicate');
      proposedCity = result.state; cityReceipt = result.receipt;
    }
    if (action.kind === 'StartTravel' || action.kind === 'AdvanceWorldTurn') {
      const result = executeInferredTravelWorld(travel, { commandId: innerId, expectedRevision: travel.revision,
        action: action.kind === 'StartTravel' ? { kind: 'StartTravel', travelerId: action.travelerId, destination: action.destination }
          : { kind: 'AdvanceTravelTurn' } });
      if (!result.ok) return fail(`travel-part:${result.reason}`);
      if (result.duplicate) return fail('unexpected-travel-duplicate');
      proposedTravel = result.state; travelReceipt = result.receipt;
    }
    if (proposedCity.current.clock.turn !== proposedTravel.turn || !sameDate(proposedCity.current.clock.date, proposedTravel.date))
      return fail('shared-clock-divergence');
    const completionTurns = Math.max(0, ...proposedCity.current.jobs.filter(job => job.status === 'active').map(job => job.remainingTurns));
    if (MAX_COMMANDS - commands.length - 1 < completionTurns) return fail('reserve-world-completion-slots');
    receipts.push({ commandId: command.id, dateBefore: city.current.clock.date, dateAfter: proposedCity.current.clock.date,
      turnBefore: city.current.clock.turn, turnAfter: proposedCity.current.clock.turn, cityReceipt, travelReceipt });
    city = proposedCity; travel = proposedTravel; commands.push(command); seen.add(command.id);
    if (!fits()) return fail('world-output-budget');
  }
  return freeze({ ok: true as const, state: root(), city, travel, receipts, revision: commands.length,
    clock: city.current.clock, cityBinding: { cityId: g.city.id, graphCityName: input.cityName },
    sharedClockEstablished: true as const, travelerOfficerIdentityShared: false as const,
    sharedFieldResourceLedger: false as const, originalCampaignWritten: false as const, nativeSchedulerVerified: false as const });
}
export function readInferredSharedWorldClock(input: unknown) {
  try { return replay(detach(input)); } catch { return fail('invalid-world-data'); }
}
export function createInferredSharedWorldClock(cityName: string, cityScenario: unknown, travelScenario: unknown) {
  return readInferredSharedWorldClock({ schema: 'inferred-shared-city-travel-clock-v1', cityName, cityScenario, travelScenario, commands: [] });
}
export function executeInferredSharedWorldClock(input: unknown, rawCommand: unknown) {
  const current = readInferredSharedWorldClock(input);
  if (!current.ok) return current;
  let clean: unknown;
  try { clean = detach(rawCommand); } catch { return fail('invalid-world-command'); }
  const command = commandFrom(clean);
  if (!command || command.expectedRevision !== current.revision || current.revision >= MAX_COMMANDS) return fail('invalid-command-or-capacity');
  return readInferredSharedWorldClock({ ...current.state, commands: [...current.state.commands, command] });
}
export function saveInferredSharedWorldClock(input: unknown) {
  const result = readInferredSharedWorldClock(input);
  if (!result.ok) return result;
  const json = JSON.stringify(result.state);
  return json.length <= MAX_JSON ? Object.freeze({ ok: true as const, json }) : fail('world-save-budget');
}
export function loadInferredSharedWorldClock(json: unknown) {
  if (typeof json !== 'string' || json.length > MAX_JSON) return fail('invalid-world-save');
  try { return readInferredSharedWorldClock(JSON.parse(json)); } catch { return fail('invalid-world-save'); }
}
