/** A synthetic, city-graph travel world. Never a native person/mission writer.
 * Source adjacency and inferred timing are separate; see the corresponding rule page.
 */
import citiesData from '../../../docs/sources/cities.json' with { type: 'json' };
import { projectInferredOfficerTravel } from './inferred-rule-requests.ts';

type Frozen<T> = T extends object ? { readonly [K in keyof T]: Frozen<T[K]> } : T;
type DateValue = { year: number; month: number; day: 1 | 11 | 21 };
type Genesis = { version: 1; startYear: number; travelers: { id: string; city: string }[] };
type Action = { kind: 'StartTravel'; travelerId: string; destination: string } | { kind: 'AdvanceTravelTurn' };
type Envelope = { commandId: string; expectedRevision: number; action: Action };
type Traveler = { id: string; city: string; journey: { route: string[]; completedEdges: number } | null };
type Write = { travelerId: string; fromCity: string; toCity: string; arrived: boolean };
type Receipt = { commandId: string; revision: number; turn: number; date: DateValue; action: Action; writes: Write[] };
type State = { version: 1; policyId: 'inferred-neutral-city-travel-world-v1'; genesis: Genesis;
  revision: number; turn: number; date: DateValue; travelers: Traveler[]; commands: Envelope[]; receipts: Receipt[] };
type Failure = { ok: false; reason: string };
type Success = { ok: true; state: State; duplicate: boolean; receipt: Receipt };
export type InferredTravelWorldStateV1 = Frozen<State>;
export type InferredTravelWorldScenarioV1 = Frozen<Genesis>;
export type InferredTravelWorldCommandV1 = Frozen<Envelope>;
export type InferredTravelWorldResultV1 = Frozen<Success | Failure>;
const POLICY = 'inferred-neutral-city-travel-world-v1' as const;
const MAX_COMMANDS = 1024;
class Invalid extends Error {}
function fail(reason = 'invalid-input'): never { throw new Invalid(reason); }
function freeze<T>(value: T): Frozen<T> {
  if (value !== null && typeof value === 'object') {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value as Frozen<T>;
}
/** Reject getters, cycles, holes, non-JSON values and inherited data before reads. */
function detach(value: unknown, depth = 0, active = new Set<object>()): unknown {
  if (depth > 32) fail();
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
  if (typeof value === 'number') return Number.isFinite(value) && !Object.is(value, -0) ? value : fail();
  if (typeof value !== 'object' || active.has(value)) fail();
  const array = Array.isArray(value), proto = Object.getPrototypeOf(value);
  if (proto !== (array ? Array.prototype : Object.prototype) && !(proto === null && !array)) fail();
  const descriptors = Object.getOwnPropertyDescriptors(value), keys = Reflect.ownKeys(descriptors);
  if (keys.some(key => typeof key !== 'string' || !('value' in descriptors[key]!)
    || (!descriptors[key]!.enumerable && !(array && key === 'length')))) fail();
  active.add(value);
  try {
    if (array) {
      const length = descriptors.length!.value as number;
      if (length > 10000 || keys.length !== length + 1) fail();
      const result: unknown[] = [];
      for (let i = 0; i < length; i++) {
        if (!descriptors[String(i)]) fail();
        result.push(detach(descriptors[String(i)]!.value, depth + 1, active));
      }
      return result;
    }
    const result: Record<string, unknown> = {};
    for (const key of keys as string[]) Object.defineProperty(result, key,
      { value: detach(descriptors[key]!.value, depth + 1, active), enumerable: true, writable: true, configurable: true });
    return result;
  } finally { active.delete(value); }
}
function record(value: unknown, fields: string[]): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail();
  const result = value as Record<string, unknown>;
  if (Object.keys(result).length !== fields.length || fields.some(key => !Object.hasOwn(result, key))) fail();
  return result;
}
function uint(value: unknown, maximum: number): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0 || value > maximum) fail();
  return value;
}
function id(value: unknown): string {
  if (typeof value !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,95}$/.test(value)) fail();
  return value;
}
function city(value: unknown): string {
  if (typeof value !== 'string' || !citiesData.cities.some(item => item.name === value)) fail('unknown-city');
  return value;
}
function genesis(input: unknown): Genesis {
  const value = record(input, ['version', 'startYear', 'travelers']);
  if (value.version !== 1 || !Array.isArray(value.travelers) || value.travelers.length < 1 || value.travelers.length > 32) fail();
  const startYear = uint(value.startYear, 9999); if (startYear < 1) fail();
  const seen = new Set<string>();
  const travelers = value.travelers.map(item => {
    const traveler = record(item, ['id', 'city']), key = id(traveler.id);
    if (!key.startsWith('traveler-') || seen.has(key)) fail('invalid-or-duplicate-synthetic-id');
    seen.add(key); return { id: key, city: city(traveler.city) };
  });
  travelers.sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  return { version: 1, startYear, travelers };
}
function envelope(input: unknown): Envelope {
  const value = record(input, ['commandId', 'expectedRevision', 'action']);
  if (!value.action || typeof value.action !== 'object' || Array.isArray(value.action)) fail();
  const kind = (value.action as Record<string, unknown>).kind;
  let action: Action;
  if (kind === 'AdvanceTravelTurn') {
    record(value.action, ['kind']); action = { kind };
  } else if (kind === 'StartTravel') {
    const detail = record(value.action, ['kind', 'travelerId', 'destination']);
    action = { kind, travelerId: id(detail.travelerId), destination: city(detail.destination) };
  } else fail('unsupported-action');
  return { commandId: id(value.commandId), expectedRevision: uint(value.expectedRevision, MAX_COMMANDS), action };
}
function date(startYear: number, turn: number): DateValue {
  const year = startYear + Math.floor(turn / 36);
  if (year > 9999) fail('date-overflow');
  return { year, month: Math.floor(turn % 36 / 3) + 1, day: (turn % 3 * 10 + 1) as 1 | 11 | 21 };
}
function initial(value: Genesis): State {
  return { version: 1, policyId: POLICY, genesis: value, revision: 0, turn: 0,
    date: date(value.startYear, 0), travelers: value.travelers.map(t => ({ ...t, journey: null })), commands: [], receipts: [] };
}
function canonical(value: unknown): string {
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  if (value !== null && typeof value === 'object') return '{' + Object.keys(value).sort().map(key =>
    JSON.stringify(key) + ':' + canonical((value as Record<string, unknown>)[key])).join(',') + '}';
  return JSON.stringify(value) ?? fail();
}
/** All mutations are to a detached/reconstructed local state, never caller objects. */
function apply(state: State, command: Envelope): { duplicate: boolean; receipt: Receipt } {
  const priorIndex = state.commands.findIndex(item => item.commandId === command.commandId);
  if (priorIndex >= 0) {
    if (canonical(state.commands[priorIndex]) !== canonical(command)) fail('command-id-conflict');
    return { duplicate: true, receipt: state.receipts[priorIndex]! };
  }
  if (command.expectedRevision !== state.revision) fail('stale-revision');
  if (state.commands.length >= MAX_COMMANDS) fail('history-limit');
  const writes: Write[] = [], action = command.action;
  if (action.kind === 'StartTravel') {
    const traveler = state.travelers.find(item => item.id === action.travelerId);
    if (!traveler) fail('unknown-traveler');
    if (traveler.journey) fail('already-traveling');
    if (traveler.city === action.destination) fail('already-at-destination');
    const plan = projectInferredOfficerTravel(traveler.city, action.destination);
    if (!plan.ok) fail(plan.reason);
    // The existing planner supplies the documented directed graph and stable BFS.
    // Its eligibilityEstablished=false is not promoted to native eligibility here.
    traveler.journey = { route: [...plan.route], completedEdges: 0 };
  } else {
    const nextDate = date(state.genesis.startYear, state.turn + 1);
    for (const traveler of state.travelers) {
      const journey = traveler.journey; if (!journey) continue;
      const fromCity = traveler.city;
      journey.completedEdges += 1;
      const toCity = journey.route[journey.completedEdges]!;
      traveler.city = toCity;
      const arrived = journey.completedEdges === journey.route.length - 1;
      if (arrived) traveler.journey = null;
      writes.push({ travelerId: traveler.id, fromCity, toCity, arrived });
    }
    state.turn += 1; state.date = nextDate;
  }
  state.revision += 1;
  const receipt: Receipt = { commandId: command.commandId, revision: state.revision,
    turn: state.turn, date: { ...state.date }, action, writes };
  state.commands.push(command); state.receipts.push(receipt);
  return { duplicate: false, receipt };
}
function rebuild(value: unknown): State {
  const recordValue = record(value, ['version', 'policyId', 'genesis', 'revision', 'turn', 'date', 'travelers', 'commands', 'receipts']);
  if (recordValue.version !== 1 || recordValue.policyId !== POLICY || !Array.isArray(recordValue.commands)
    || recordValue.commands.length > MAX_COMMANDS) fail('invalid-state');
  const result = initial(genesis(recordValue.genesis));
  for (const item of recordValue.commands) {
    if (apply(result, envelope(item)).duplicate) fail('duplicate-history-entry');
  }
  if (canonical(result) !== canonical(value)) fail('state-replay-mismatch');
  return result;
}
function caught(error: unknown): Frozen<Failure> {
  if (!(error instanceof Invalid)) throw error;
  return freeze({ ok: false as const, reason: error.message });
}
export function createInferredTravelWorld(input: unknown): Frozen<{ ok: true; state: State } | Failure> {
  try { return freeze({ ok: true as const, state: initial(genesis(detach(input))) }); }
  catch (error) { return caught(error); }
}
export function executeInferredTravelWorld(state: unknown, command: unknown): InferredTravelWorldResultV1 {
  try {
    const next = rebuild(detach(state)), outcome = apply(next, envelope(detach(command)));
    return freeze({ ok: true as const, state: next, ...outcome });
  } catch (error) { return caught(error); }
}
export function saveInferredTravelWorld(state: unknown): Frozen<{ ok: true; serialized: string } | Failure> {
  try { return freeze({ ok: true as const, serialized: JSON.stringify(rebuild(detach(state))) }); }
  catch (error) { return caught(error); }
}
export function loadInferredTravelWorld(serialized: unknown): Frozen<{ ok: true; state: State } | Failure> {
  if (typeof serialized !== 'string' || serialized.length > 16_000_000) return freeze({ ok: false as const, reason: 'invalid-save' });
  let parsed: unknown;
  try { parsed = JSON.parse(serialized); } catch { return freeze({ ok: false as const, reason: 'invalid-save-json' }); }
  try { return freeze({ ok: true as const, state: rebuild(detach(parsed)) }); }
  catch (error) { return caught(error); }
}
