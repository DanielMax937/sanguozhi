/** Pure metadata proposal. The city owner alone commits gold/AP; never patch a historical snapshot. */
import { readInferredConfiscationLedger, createInferredConfiscationLedger, executeInferredConfiscation } from '../inferred-confiscation-ledger.ts';
import { createInferredTreasureLedger, executeInferredTreasureGrant } from '../inferred-treasure-ledger.ts';
import { createPersonnelLoyaltyState, executePersonnelLoyaltyCommand } from '../personnel-loyalty-lifecycle.ts';
import type { PersonnelLoyaltyScenarioV1 } from '../personnel-loyalty-lifecycle.ts';
import { projectInferredSalaryShortfallV2 } from '../inferred-salary-request.ts';

type DateV1 = { year: number; month: number; day: 1 | 11 | 21 };
type Frozen<T> = T extends object ? { readonly [K in keyof T]: Frozen<T[K]> } : T;
type NaturalOfficer = PersonnelLoyaltyScenarioV1['officers'][number];
type Facts = Omit<PersonnelLoyaltyScenarioV1, 'date' | 'advanceLimit' | 'rng' | 'officers' | 'city'> & {
  city: Pick<PersonnelLoyaltyScenarioV1['city'], 'id' | 'ownerForceId' | 'hasTokenPlatform'>;
  officers: readonly Omit<NaturalOfficer, 'trueLoyalty' | 'praisedThisTurn'>[];
};
export type SyntheticResourceContext = Readonly<{ cityId: string; forceId: string; officerIds: readonly string[];
  date: Readonly<DateV1>; actionPoints: number; gold: number }>;
export type SyntheticResourceAction = Readonly<{ kind: 'Grant'; itemId: string; officerId: string }>
  | Readonly<{ kind: 'Confiscate'; itemId: string }>
  | Readonly<{ kind: 'WorldTick' }>;
export type SyntheticResourceMetadata = Frozen<{ schema: 'synthetic-city-resource-metadata-v1'; cityId: string; forceId: string;
  lastDate: DateV1; officers: { id: string; loyalty: number; salary: number }[];
  items: { id: string; value: number; holder: string | null }[]; personnelFacts: Facts;
  rng: { state: number; drawCount: number } }>;
const fail = (reason: string) => Object.freeze({ ok: false as const, reason });
const uint = (v: unknown, max: number): v is number => typeof v === 'number' && Number.isSafeInteger(v) && !Object.is(v, -0) && v >= 0 && v <= max;
const record = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === 'object' && !Array.isArray(v);
const exact = (v: Record<string, unknown>, names: readonly string[]) => Object.keys(v).length === names.length && names.every(name => Object.hasOwn(v, name));
const id = (v: unknown): v is string => typeof v === 'string' && /^synthetic-[a-z0-9-]{1,48}$/.test(v);
function freeze<T>(value: T): Frozen<T> {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) { for (const child of Object.values(value)) freeze(child); Object.freeze(value); }
  return value as Frozen<T>;
}
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

function dateFrom(value: unknown): DateV1 | undefined {
  if (!record(value) || !exact(value, ['year', 'month', 'day']) || !uint(value.year, 9999) || value.year < 1
    || !uint(value.month, 12) || value.month < 1 || (value.day !== 1 && value.day !== 11 && value.day !== 21)) return undefined;
  return { year: value.year, month: value.month, day: value.day };
}
function equalDate(a: Readonly<DateV1>, b: Readonly<DateV1>) { return a.year === b.year && a.month === b.month && a.day === b.day; }
function nextDate(a: Readonly<DateV1>): DateV1 {
  return a.day === 1 ? { ...a, day: 11 } : a.day === 11 ? { ...a, day: 21 }
    : a.month === 12 ? { year: a.year + 1, month: 1, day: 1 } : { year: a.year, month: a.month + 1, day: 1 };
}
function contextFrom(input: unknown): SyntheticResourceContext | undefined {
  if (!record(input) || !exact(input, ['cityId', 'forceId', 'officerIds', 'date', 'actionPoints', 'gold'])
    || !id(input.cityId) || !id(input.forceId) || !Array.isArray(input.officerIds) || input.officerIds.length < 1
    || input.officerIds.length > 64 || !input.officerIds.every(id) || new Set(input.officerIds).size !== input.officerIds.length
    || !uint(input.actionPoints, 1000000) || !uint(input.gold, 1000000000)) return undefined;
  const date = dateFrom(input.date); if (!date) return undefined;
  return { cityId: input.cityId, forceId: input.forceId, officerIds: [...input.officerIds], date, actionPoints: input.actionPoints, gold: input.gold };
}
function splitFacts(s: PersonnelLoyaltyScenarioV1): Facts {
  const { date: _date, advanceLimit: _limit, rng: _rng, city, officers, ...rest } = s;
  return { ...rest, city: { id: city.id, ownerForceId: city.ownerForceId, hasTokenPlatform: city.hasTokenPlatform },
    officers: officers.map(({ trueLoyalty: _loyalty, praisedThisTurn: _praised, ...officer }) => officer) };
}
function rosterMatches(ids: readonly string[], officers: readonly { id: string }[]) {
  return ids.length === officers.length && ids.every(name => officers.some(officer => officer.id === name));
}
/** config exactly {initialConfiscation,personnelScenario,salaries:[{officerId,salary}]}. */
export function createSyntheticResourceMetadata(rawConfig: unknown, rawContext: unknown) {
  try {
    const config = detach(rawConfig), context = contextFrom(detach(rawContext));
    if (!context || !record(config) || !exact(config, ['initialConfiscation', 'personnelScenario', 'salaries']) || !Array.isArray(config.salaries)) return fail('invalid-resource-config');
    const treasury = readInferredConfiscationLedger(config.initialConfiscation), natural = createPersonnelLoyaltyState(config.personnelScenario);
    if (!treasury.ok) return fail(`initial-treasury:${treasury.reason}`);
    if (!natural.ok) return fail(`initial-natural:${natural.reason}`);
    const s = natural.state.genesis.scenario;
    if (s.city.id !== context.cityId || s.force.id !== context.forceId || !id(s.ruler.id)
      || !equalDate(s.date, context.date) || s.city.gold !== 0 || s.city.actionPoints !== context.actionPoints
      || treasury.actionPoints !== context.actionPoints || !rosterMatches(context.officerIds, treasury.officers)
      || !rosterMatches(context.officerIds, s.officers) || s.officers.some(officer => officer.praisedThisTurn)
      || treasury.items.some(item => !id(item.id))) return fail('resource-owner-binding-mismatch');
    const salaries = new Map<string, number>();
    for (const row of config.salaries) {
      if (!record(row) || !exact(row, ['officerId', 'salary']) || !id(row.officerId) || !context.officerIds.includes(row.officerId)
        || !uint(row.salary, 1000000) || salaries.has(row.officerId)) return fail('invalid-salary-roster');
      salaries.set(row.officerId, row.salary);
    }
    if (salaries.size !== context.officerIds.length) return fail('incomplete-salary-roster');
    for (const officer of treasury.officers) {
      if (!id(officer.id) || officer.loyalty === 0 || s.officers.find(row => row.id === officer.id)!.trueLoyalty !== officer.loyalty) return fail('initial-loyalty-mismatch');
    }
    return freeze({ ok: true as const, metadata: { schema: 'synthetic-city-resource-metadata-v1' as const,
      cityId: context.cityId, forceId: context.forceId, lastDate: { ...context.date },
      officers: treasury.officers.map(officer => ({ ...officer, salary: salaries.get(officer.id)! })),
      items: treasury.items.map(item => ({ ...item })), personnelFacts: splitFacts(s),
      rng: { state: natural.state.snapshot.rng.state, drawCount: 0 } } });
  } catch { return fail('invalid-resource-config-data'); }
}
function metadataFrom(input: unknown, context: SyntheticResourceContext) {
  if (!record(input) || !exact(input, ['schema', 'cityId', 'forceId', 'lastDate', 'officers', 'items', 'personnelFacts', 'rng'])
    || input.schema !== 'synthetic-city-resource-metadata-v1' || input.cityId !== context.cityId || input.forceId !== context.forceId
    || !Array.isArray(input.officers) || !Array.isArray(input.items)
    || !record(input.rng) || !exact(input.rng, ['state', 'drawCount']) || !uint(input.rng.state, 0xffffffff) || input.rng.state === 0
    || !uint(input.rng.drawCount, 1000000) || !record(input.personnelFacts)) return fail('invalid-resource-metadata');
  const date = dateFrom(input.lastDate); if (!date) return fail('invalid-resource-date');
  const officers: { id: string; loyalty: number; salary: number }[] = [];
  for (const row of input.officers) {
    if (!record(row) || !exact(row, ['id', 'loyalty', 'salary']) || !id(row.id) || !uint(row.loyalty, 255) || row.loyalty === 0 || !uint(row.salary, 1000000)) return fail('invalid-current-loyalty');
    officers.push({ id: row.id, loyalty: row.loyalty, salary: row.salary });
  }
  if (!rosterMatches(context.officerIds, officers)) return fail('current-roster-mismatch');
  const treasury = createInferredTreasureLedger(context.actionPoints, officers.map(({ id, loyalty }) => ({ id, loyalty })), input.items);
  if (!treasury.ok) return fail(`current-treasury:${treasury.reason}`);
  if (treasury.items.some(item => !id(item.id))) return fail('non-synthetic-item');
  const facts = input.personnelFacts;
  if (!exact(facts, ['schemaVersion', 'profile', 'initialDateAlreadySettled', 'force', 'city', 'ruler', 'officers', 'relations', 'policies'])
    || !record(facts.city) || !exact(facts.city, ['id', 'ownerForceId', 'hasTokenPlatform']) || !Array.isArray(facts.officers)) return fail('invalid-personnel-facts');
  const naturalOfficers = [];
  for (const fact of facts.officers) {
    if (!record(fact) || !exact(fact, ['id', 'forceId', 'cityId', 'kind', 'affinityByte', 'giriInternal', 'ambitionInternal', 'skills']) || !id(fact.id)) return fail('invalid-personnel-fact');
    const current = officers.find(officer => officer.id === fact.id); if (!current) return fail('natural-roster-mismatch');
    naturalOfficers.push({ ...fact, trueLoyalty: current.loyalty, praisedThisTurn: false });
  }
  // Validate fixed facts at a safe one-turn date; lastDate itself was separately validated.
  // This does not advance time or draw RNG and permits non-tick actions at 9999-12-21.
  const natural = createPersonnelLoyaltyState({ ...facts, date: { year: 1, month: 1, day: 1 }, advanceLimit: 1,
    city: { ...facts.city, gold: 0, actionPoints: context.actionPoints }, officers: naturalOfficers,
    rng: { kind: 'xorshift32-nonzero-mod35-v1', seed: input.rng.state } });
  if (!natural.ok) return fail(`metadata-natural:${natural.reason}`);
  const s = natural.state.genesis.scenario;
  if (s.city.id !== context.cityId || s.force.id !== context.forceId || !id(s.ruler.id) || !rosterMatches(context.officerIds, s.officers)) return fail('metadata-owner-mismatch');
  return freeze({ ok: true as const, metadata: { schema: 'synthetic-city-resource-metadata-v1' as const, cityId: context.cityId, forceId: context.forceId,
    lastDate: date, officers, items: treasury.items, personnelFacts: splitFacts(s), rng: { state: input.rng.state, drawCount: input.rng.drawCount } } });
}
/** Context is the owner's current (post-city-tick for WorldTick) balances. No history or jobs are rebased. */
export function applySyntheticResourceBridge(rawMetadata: unknown, rawContext: unknown, rawAction: unknown) {
  try {
    const context = contextFrom(detach(rawContext)), action = detach(rawAction);
    if (!context || !record(action) || !['Grant', 'Confiscate', 'WorldTick'].includes(action.kind as string)) return fail('invalid-resource-action');
    const valid = metadataFrom(detach(rawMetadata), context); if (!valid.ok) return valid;
    const old = valid.metadata;
    const tick = action.kind === 'WorldTick';
    if (!equalDate(context.date, tick ? nextDate(old.lastDate) : old.lastDate)) return fail('resource-date-mismatch');
    let officers = old.officers.map(officer => ({ ...officer })), items = old.items.map(item => ({ ...item }));
    let gold = context.gold, actionPoints = context.actionPoints, rng = { ...old.rng };
    let detail: unknown;
    if (tick) {
      if (!exact(action, ['kind'])) return fail('invalid-world-tick');
      const salaryWrites = [], salaryDue = officers.reduce((sum, officer) => sum + officer.salary, 0), goldBeforeSalary = gold;
      if (context.date.day === 1) {
        const total = projectInferredSalaryShortfallV2(salaryDue, gold, 0); if (!total.ok) return total;
        for (const officer of officers) {
          const plan = projectInferredSalaryShortfallV2(salaryDue, goldBeforeSalary, officer.salary); if (!plan.ok) return plan;
          if (officer.loyalty <= plan.loyaltyLossRequest) return fail('salary-zero-loyalty-excluded');
          salaryWrites.push({ officerId: officer.id, before: officer.loyalty, after: officer.loyalty - plan.loyaltyLossRequest, plan });
          officer.loyalty -= plan.loyaltyLossRequest;
        }
        gold = total.remainingGoldRequest;
      }
      const facts = old.personnelFacts;
      const natural = createPersonnelLoyaltyState({ ...facts, date: old.lastDate, advanceLimit: 1,
        city: { ...facts.city, gold: 0, actionPoints },
        officers: facts.officers.map(fact => ({ ...fact, trueLoyalty: officers.find(officer => officer.id === fact.id)!.loyalty, praisedThisTurn: false })),
        rng: { kind: 'xorshift32-nonzero-mod35-v1', seed: rng.state } });
      if (!natural.ok) return fail(`tick-natural:${natural.reason}`);
      const advanced = executePersonnelLoyaltyCommand(natural.state, { id: 'synthetic-resource-step', expectedRevision: 0, command: { type: 'AdvancePersonnelTurn' } });
      if (!advanced.ok) return fail(`tick-advance:${advanced.reason}`);
      if (!equalDate(advanced.state.snapshot.date, context.date) || advanced.state.snapshot.actionPoints !== actionPoints || advanced.state.snapshot.gold !== 0) return fail('unexpected-natural-write');
      if (advanced.state.snapshot.officers.some(officer => officer.trueLoyalty === 0)) return fail('natural-zero-loyalty-excluded');
      officers = officers.map(officer => ({ ...officer, loyalty: advanced.state.snapshot.officers.find(row => row.id === officer.id)!.trueLoyalty }));
      rng = { state: advanced.state.snapshot.rng.state, drawCount: old.rng.drawCount + advanced.receipt.draws.length };
      if (!uint(rng.drawCount, 1000000)) return fail('resource-rng-limit');
      detail = { ordering: 'inferred-monthly-salary-before-natural-quarter-v1', salaryDue: context.date.day === 1 ? salaryDue : 0,
        goldBeforeSalary, goldAfterSalary: gold, salaryWrites, natural: advanced.receipt,
        globalDraws: advanced.receipt.draws.map(draw => ({ ...draw, drawIndex: old.rng.drawCount + draw.drawIndex })) };
    } else {
      const grant = action.kind === 'Grant';
      if (!exact(action, grant ? ['kind', 'itemId', 'officerId'] : ['kind', 'itemId'])
        || !id(action.itemId) || (grant && !id(action.officerId))) return fail('invalid-item-action');
      const treasury = createInferredTreasureLedger(actionPoints, officers.map(({ id, loyalty }) => ({ id, loyalty })), items);
      if (!treasury.ok) return fail(`item-current:${treasury.reason}`);
      if (grant) {
        const result = executeInferredTreasureGrant(treasury.state, { id: 'synthetic-resource-step', expectedRevision: 0, itemId: action.itemId, officerId: action.officerId, eligibilityConfirmed: true });
        if (!result.ok) return fail(`grant:${result.reason}`);
        officers = officers.map(officer => ({ ...officer, loyalty: result.officers.find(row => row.id === officer.id)!.loyalty }));
        items = result.items.map(item => ({ ...item })); actionPoints = result.actionPoints; detail = result.receipts[0]!;
      } else {
        const initial = createInferredConfiscationLedger(treasury.state); if (!initial.ok) return initial;
        const result = executeInferredConfiscation(initial.state, { id: 'synthetic-resource-step', expectedRevision: 0, itemId: action.itemId, eligibilityConfirmed: true });
        if (!result.ok) return fail(`confiscate:${result.reason}`);
        officers = officers.map(officer => ({ ...officer, loyalty: result.officers.find(row => row.id === officer.id)!.loyalty }));
        items = result.items.map(item => ({ ...item })); actionPoints = result.actionPoints; detail = result.receipts[0]!;
      }
    }
    return freeze({ ok: true as const, metadata: { ...old, lastDate: { ...context.date }, officers, items, rng },
      ledgerPatch: { gold, actionPoints }, receipt: { id: 'synthetic-resource-step', kind: action.kind, dateBefore: old.lastDate, dateAfter: context.date,
        goldBefore: context.gold, goldAfter: gold, apBefore: context.actionPoints, apAfter: actionPoints, detail } });
  } catch { return fail('invalid-resource-bridge-data'); }
}
