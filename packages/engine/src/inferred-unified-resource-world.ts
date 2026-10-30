/** Fixed synthetic deployment owner and atomic city/travel/field xun coordinator. */
import { createInferredSharedWorldClock } from './inferred-shared-world-clock.ts';
import { createInferredUnifiedField, executeInferredUnifiedField } from './inferred-unified-field.ts';
import { createBoundedSyntheticResourceTimeline, executeBoundedSyntheticResourceTimeline } from './bounded-city-piece-clock.ts';
import { executeInferredTravelWorld } from './inferred-travel-world.ts';
const MAX_COMMANDS = 32, MAX_JSON = 2000000;
const fail = (reason: string) => Object.freeze({ ok: false as const, reason });
const uint = (v: unknown, max: number): v is number => typeof v === 'number' && Number.isSafeInteger(v) && !Object.is(v, -0) && v >= 0 && v <= max;
const record = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === 'object' && !Array.isArray(v);
const exact = (v: Record<string, unknown>, fields: readonly string[]) => Object.keys(v).length === fields.length && fields.every(k => Object.hasOwn(v, k));
const synthetic = (v: unknown): v is string => typeof v === 'string' && /^synthetic-[a-z0-9-]{1,48}$/.test(v);
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

type Command = { id: string; expectedRevision: number; action: Record<string, unknown> };
function commandFrom(v: unknown): Command | undefined {
  if (!record(v) || !exact(v, ['id', 'expectedRevision', 'action']) || !synthetic(v.id)
    || !uint(v.expectedRevision, MAX_COMMANDS - 1) || !record(v.action)) return undefined;
  const a = v.action;
  if (a.kind === 'WorldTick' && exact(a, ['kind', 'draws']) && Array.isArray(a.draws)) return { id: v.id, expectedRevision: v.expectedRevision, action: a };
  if (a.kind === 'Resource' && exact(a, ['kind', 'command']) && record(a.command) && ['Grant', 'Confiscate', 'Transfer'].includes(a.command.kind as string)) return { id: v.id, expectedRevision: v.expectedRevision, action: a };
  if (a.kind === 'City' && exact(a, ['kind', 'command']) && record(a.command)) return { id: v.id, expectedRevision: v.expectedRevision, action: a };
  if (a.kind === 'StartTravel' && exact(a, ['kind', 'travelerId', 'destination']) && typeof a.travelerId === 'string' && typeof a.destination === 'string') return { id: v.id, expectedRevision: v.expectedRevision, action: a };
  if (a.kind === 'Field' && exact(a, ['kind', 'command']) && record(a.command)
    && (a.command.kind === 'Cast' || a.command.kind === 'FireCast')) return { id: v.id, expectedRevision: v.expectedRevision, action: a };
  return undefined;
}
/** Closed city action whitelist, then the old service performs complete field/value checks. */
function cityActors(command: unknown): string[] | undefined {
  if (!record(command)) return undefined;
  if (command.type === 'StartPieceProduction') {
    if (!exact(command, ['type', 'cityId', 'officerIds', 'facilityId', 'equipmentType']) || !Array.isArray(command.officerIds) || !command.officerIds.every(synthetic)) return undefined;
    return command.officerIds as string[];
  }
  if (command.type !== 'ExecuteCityActions' || !exact(command, ['type', 'actions']) || !Array.isArray(command.actions)) return undefined;
  const ids: string[] = [];
  for (const a of command.actions) {
    if (!record(a)) return undefined;
    if (a.type === 'BuyFood' || a.type === 'SellFood') {
      if (!exact(a, ['type', 'cityId', 'officerId', 'foodAmount']) || !synthetic(a.officerId)) return undefined;
      ids.push(a.officerId);
    } else {
      const fields = a.type === 'Patrol' ? ['type', 'cityId', 'officerIds'] : a.type === 'Recruit' ? ['type', 'cityId', 'officerIds', 'facilityId']
        : a.type === 'Produce' ? ['type', 'cityId', 'officerIds', 'facilityId', 'equipmentType'] : null;
      if (!fields || !exact(a, fields) || !Array.isArray(a.officerIds) || !a.officerIds.every(synthetic)) return undefined;
      ids.push(...a.officerIds as string[]);
    }
  }
  return ids;
}
function replay(input: unknown) {
  if (!record(input) || !exact(input, ['schema', 'cityName', 'cityScenario', 'travelScenario', 'fieldCells', 'fieldInitial', 'troopsBudget', 'resourceConfig', 'transportInitial', 'commands'])
    || input.schema !== 'inferred-unified-resource-world-v1' || typeof input.cityName !== 'string'
    || !uint(input.troopsBudget, Number.MAX_SAFE_INTEGER) || !Array.isArray(input.commands) || input.commands.length > MAX_COMMANDS) return fail('invalid-resource-world');
  const sharedCreated = createInferredSharedWorldClock(input.cityName, input.cityScenario, input.travelScenario);
  if (!sharedCreated.ok) return fail(`city-travel-genesis:${sharedCreated.reason}`);
  const cityCreated = createBoundedSyntheticResourceTimeline(sharedCreated.state.cityScenario, input.resourceConfig, input.transportInitial);
  if (!cityCreated.ok) return fail(`resource-genesis:${cityCreated.reason}`);
  const fieldCreated = createInferredUnifiedField(input.fieldCells, input.fieldInitial);
  if (!fieldCreated.ok) return fail(`field-genesis:${fieldCreated.reason}`);
  const g = sharedCreated.city.genesis, deployed = new Set(fieldCreated.state.initial.map(a => a.id));
  for (const a of fieldCreated.state.initial) {
    const officer = g.officers.find(o => o.id === a.id);
    if (!officer || officer.intelligence !== a.intelligence || officer.initial.actedTurn !== null) return fail('invalid-fixed-deployment-source');
  }
  if (sharedCreated.travel.genesis.travelers.some(t => g.officers.some(o => t.id === `traveler-${o.id}`))) return fail('traveler-officer-alias-excluded');
  if (g.merchant.fieldUnits.length !== 0 || g.merchant.hostileForceIds.length !== 0) return fail('shadow-field-snapshots-excluded');
  const initialTransportTroops = cityCreated.transports.reduce((n, t) => n + t.stock.troops, 0);
  if (g.city.initial.troops + fieldCreated.state.initial.reduce((n, a) => n + a.troops, 0) + initialTransportTroops !== input.troopsBudget) return fail('initial-troops-allocation-mismatch');
  const cityEntityIds = [g.episodeId, g.activeForceId, g.corps.id, g.city.id, ...g.facilities.map(f => f.id), ...g.officers.map(o => o.id)];
  if (fieldCreated.state.cells.some(id => cityEntityIds.includes(id))) return fail('tactical-cell-city-entity-collision');
  const nonOfficerIds = [g.episodeId, g.activeForceId, g.corps.id, g.city.id, ...g.facilities.map(f => f.id), ...fieldCreated.state.cells];
  if (nonOfficerIds.some(id => deployed.has(id)) || cityCreated.transports.some(t => cityEntityIds.includes(t.id) || fieldCreated.state.cells.includes(t.id))) return fail('entity-kind-collision');
  let city = cityCreated, travel = sharedCreated.travel, field = fieldCreated;
  const commands: Command[] = [], seen = new Set<string>(), receipts: unknown[] = [];
  const root = () => ({ schema: 'inferred-unified-resource-world-v1' as const, cityName: input.cityName as string,
    cityScenario: g, travelScenario: sharedCreated.state.travelScenario,
    fieldCells: fieldCreated.state.cells, fieldInitial: fieldCreated.state.initial, troopsBudget: input.troopsBudget as number,
    resourceConfig: input.resourceConfig, transportInitial: input.transportInitial, commands: [...commands] });
  const fits = () => { detach(root()); return JSON.stringify({ state: root(), city, travel, field, receipts }).length <= MAX_JSON - 8192; };
  if (!fits()) return fail('world-output-budget');
  for (const raw of input.commands) {
    const c = commandFrom(raw);
    if (!c || c.expectedRevision !== commands.length || seen.has(c.id)) return fail('invalid-or-duplicate-world-command');
    const a = c.action, innerId = `synthetic-world-${commands.length}`;
    let nextCity = city, nextTravel = travel, nextField = field;
    if (a.kind === 'City') {
      const actors = cityActors(a.command);
      if (!actors || actors.some(id => deployed.has(id))) return fail('deployed-actor-cannot-spend-city-action');
    }
    if (a.kind === 'Resource' && record(a.command) && (a.command.kind === 'Grant' || a.command.kind === 'Confiscate')) {
      const resourceCommand = a.command;
      const recipientId = resourceCommand.kind === 'Grant' ? resourceCommand.officerId : city.metadata.items.find(item => item.id === resourceCommand.itemId)?.holder;
      if (typeof recipientId !== 'string' || deployed.has(recipientId)) return fail('deployed-or-unknown-treasure-recipient');
    }
    if (a.kind === 'City' || a.kind === 'Resource' || a.kind === 'WorldTick') {
      const result = executeBoundedSyntheticResourceTimeline(city.state, { id: innerId, expectedRevision: city.revision,
        action: a.kind === 'WorldTick' ? { kind: 'Tick' } : a.kind === 'Resource' ? a.command : a });
      if (!result.ok) return fail(`city-resource-step:${result.reason}`);
      nextCity = result;
    }
    if (a.kind === 'StartTravel' || a.kind === 'WorldTick') {
      const result = executeInferredTravelWorld(travel, { commandId: innerId, expectedRevision: travel.revision,
        action: a.kind === 'WorldTick' ? { kind: 'AdvanceTravelTurn' } : { kind: 'StartTravel', travelerId: a.travelerId, destination: a.destination } });
      if (!result.ok) return fail(`travel-step:${result.reason}`);
      if (result.duplicate) return fail('unexpected-travel-duplicate');
      nextTravel = result.state;
    }
    if (a.kind === 'Field' || a.kind === 'WorldTick') {
      const result = executeInferredUnifiedField(field.state, { id: innerId, expectedRevision: field.revision,
        action: a.kind === 'WorldTick' ? { kind: 'FieldTick', draws: a.draws } : a.command });
      if (!result.ok) return fail(`field-step:${result.reason}`);
      nextField = result;
    }
    const clock = nextCity.current.clock;
    if (clock.turn !== nextField.turn || clock.turn !== nextTravel.turn || clock.date.year !== nextTravel.date.year
      || clock.date.month !== nextTravel.date.month || clock.date.day !== nextTravel.date.day) return fail('world-clock-divergence');
    for (const officer of g.officers.filter(o => deployed.has(o.id))) {
      const p = nextCity.current.ledger.officers.find(o => o.id === officer.id);
      if (!p || p.reservationJobId !== null || p.actedTurn !== officer.initial.actedTurn || p.merit !== officer.initial.merit
        || Object.keys(officer.initial.xp).some(k => p.xp[k as keyof typeof p.xp] !== officer.initial.xp[k as keyof typeof officer.initial.xp])) return fail('deployed-city-progress-mutated');
    }
    const remaining = Math.max(0, ...nextCity.current.jobs.filter(j => j.status === 'active').map(j => j.remainingTurns));
    if (MAX_COMMANDS - commands.length - 1 < remaining || MAX_COMMANDS - nextField.revision < remaining || MAX_COMMANDS - nextCity.revision < remaining) return fail('reserve-shared-completion-slots');
    receipts.push({ commandId: c.id, turnBefore: city.current.clock.turn, turnAfter: clock.turn,
      dateBefore: city.current.clock.date, dateAfter: clock.date, cityRevisionBefore: city.revision, cityRevisionAfter: nextCity.revision,
      fieldRevisionBefore: field.revision, fieldRevisionAfter: nextField.revision });
    city = nextCity; travel = nextTravel; field = nextField; commands.push(c); seen.add(c.id);
    if (!fits()) return fail('world-output-budget');
  }
  return freeze({ ok: true as const, state: root(), city, travel, field, receipts, revision: commands.length, clock: city.current.clock,
    deployedActorIds: [...deployed], troopAllocation: { initialTotal: input.troopsBudget, city: city.current.ledger.troops,
      field: field.roster.reduce((n, a) => n + a.troops, 0), transports: city.transports.reduce((n, a) => n + a.stock.troops, 0) },
    identityPolicy: 'fixed-same-id-deployment-field-progress-owner-v1', resourcePolicy: 'single-city-ledger-and-loyalty-owner-v1',
    dynamicDeploymentSupported: false as const, realPeopleWritten: false as const, nativeCampaignEquivalent: false as const });
}
export function readInferredUnifiedResourceWorld(input: unknown) {
  try { return replay(detach(input)); } catch { return fail('invalid-world-data'); }
}
export function createInferredUnifiedResourceWorld(cityName: string, cityScenario: unknown, travelScenario: unknown, fieldCells: unknown, fieldInitial: unknown, troopsBudget: number, resourceConfig: unknown, transportInitial: unknown) {
  return readInferredUnifiedResourceWorld({ schema: 'inferred-unified-resource-world-v1', cityName, cityScenario, travelScenario, fieldCells, fieldInitial, troopsBudget, resourceConfig, transportInitial, commands: [] });
}
export function executeInferredUnifiedResourceWorld(input: unknown, rawCommand: unknown) {
  const current = readInferredUnifiedResourceWorld(input);
  if (!current.ok) return current;
  let command: Command | undefined;
  try { command = commandFrom(detach(rawCommand)); } catch { return fail('invalid-world-command'); }
  if (!command || command.expectedRevision !== current.revision || current.revision >= MAX_COMMANDS) return fail('invalid-command-or-capacity');
  return readInferredUnifiedResourceWorld({ ...current.state, commands: [...current.state.commands, command] });
}
export function saveInferredUnifiedResourceWorld(input: unknown) {
  const result = readInferredUnifiedResourceWorld(input);
  if (!result.ok) return result;
  const json = JSON.stringify(result.state);
  return json.length <= MAX_JSON ? Object.freeze({ ok: true as const, json }) : fail('world-save-budget');
}
export function loadInferredUnifiedResourceWorld(json: unknown) {
  if (typeof json !== 'string' || json.length > MAX_JSON) return fail('invalid-world-save');
  try { return readInferredUnifiedResourceWorld(JSON.parse(json)); } catch { return fail('invalid-world-save'); }
}

