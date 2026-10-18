/** Bounded standalone simulation. Static-authored; not a native disaster scheduler. */
import rawPolicyData from '../../../data/catalogs/city-season-policy-v1.json' with { type: 'json' };
import rawCatalogData from '../../../data/catalogs/city-season-food-facilities-v1.json' with { type: 'json' };
import rawSourceData from '../../../docs/sources/city-season-lifecycle.json' with { type: 'json' };
import { calculateCityFoodIncomeProjection } from './city-food-income-projection.ts';
import type { CityFoodIncomeProjectionInput, CityFoodIncomeProjectionReceipt } from './city-food-income-projection.ts';
import { calculateMonthlyCityFoodBaseArgument } from './monthly-city-food-base-argument.ts';
import type { MonthlyCityFoodBaseArgumentInput, MonthlyCityFoodBaseArgumentReceipt } from './monthly-city-food-base-argument.ts';

type Frozen<T> = T extends object ? { readonly [K in keyof T]: Frozen<T[K]> } : T;
// Own copies: other JSON importers cannot later alter this module's registered contract.
const policyData = freeze(clone(rawPolicyData));
const catalogData = freeze(clone(rawCatalogData));
const sourceData = freeze(clone(rawSourceData));
export const CITY_SEASON_POLICY_V1 = policyData;
export const CITY_SEASON_FOOD_CATALOG_V1 = catalogData;
export const CITY_SEASON_SOURCES_V1 = sourceData;
const PROFILE = 'single-city-season-simulation-v1' as const;
const TAG = 'san11-city-season-state-v1' as const, SAVE_TAG = 'san11-city-season-save-v1' as const;
const MAX_BYTES = 16_777_216, MAX_NODES = 250_000, MAX_DEPTH = 32, MAX_ARRAY = 4096;
const MAX_HISTORY = 256, MAX_WORDS = 4096;
const KINDS = ['plague', 'locust', 'harvest'] as const;
type Kind = typeof KINDS[number];
type DateValue = { year: number; month: number; day: 1 };
type Current = Record<Kind, { remainingMonths: number }>;
type ScheduledValue = { activationYear: number; activationMonth: number; durationMonths: number };
type Scheduled = Record<Kind, ScheduledValue | null>;
type Facility = { id: string; kind: 'farm' | 'granary' | 'military-farm'; level: 1 | 3; complete: true; position: { q: number; r: number } };
type Officer = { id: string; forceId: string; cityId: string; role: 'ordinary-officer'; residency: 'present'; health: number; seasonSkills: ('fengshui' | 'prayer')[] };
type City = { id: string; ownerForceId: string; food: number; foodCapacity: number; troops: number; security: number; techniquePoints: number };
type Scenario = { schemaVersion: 1; profile: typeof PROFILE; date: DateValue; initialMonthAlreadySettled: true; monthLimit: number; ownershipFrozen: true; completeResidentRoster: true; unsupportedIncomeSkillsAbsent: true; activeForceId: string; difficulty: 'normal' | 'super'; controller: 'player' | 'ai'; city: City; baseFoodWord: number; officers: Officer[]; facilities: (Facility | null)[]; current: Current; scheduled: Scheduled; seed: number; policy: typeof policyData; catalog: typeof catalogData; sources: typeof sourceData };
type Envelope = { id: string; expectedRevision: number; command: { type: 'AdvanceSeasonMonth' } };
type Snapshot = { revision: number; advancedMonths: number; date: DateValue; city: City; officers: Officer[]; facilities: (Facility | null)[]; current: Current; scheduled: Scheduled; rng: { word: number; cursor: number } };
type Write = { path: string; cause: string; before: number; requested: number; after: number; actualDelta: number; discarded: number; policyId: string };
type RawWord = { seedBefore: number; seedAfter: number; cursorBefore: number; cursorAfter: number; raw: number; sample: number; limit: number; rejected: boolean };
type Draw = { label: string; bound: number; words: RawWord[]; value: number; cursorBefore: number; cursorAfter: number; seedBefore: number; seedAfter: number; policyId: string };
type Migration = { kind: Kind; currentBefore: number; currentAfter: number; pendingBefore: ScheduledValue | null; pendingAfter: null; outcome: 'no-pending' | 'activated' | 'prevented-fengshui'; policyId: string };
type Generation = { kind: Kind; threshold: number; denominator: number; outcome: 'active-or-pending' | 'prevented-fengshui' | 'not-selected' | 'scheduled'; pending: ScheduledValue | null; policyId: string };
type Removal = { slot: number; removedFacility: Facility; occupancy: Write; techniquePoints: Write };
type Income = { status: 'not-due'; policyId: string } | { status: 'due'; observationKind: 'derived-adapter-observations'; policyId: string; cityFood: { request: CityFoodIncomeProjectionInput; receipt: CityFoodIncomeProjectionReceipt }; harvest: { request: MonthlyCityFoodBaseArgumentInput; receipt: MonthlyCityFoodBaseArgumentReceipt }; posting: Write };
const BOUNDARY = { nativeEquivalent: false, strictlyUnbiased: false, independentDrawsCertified: false, closedNonProxyDTO: true, fullFinanceLifecycle: false, incomeSkillsAbsent: true, original43GroupsReduced: false, original45SnapshotsReduced: false, originalProbabilityEvidenceClosed: false, originalWriterEvidenceClosed: false, crossServiceIntegrationComplete: false, replayAuthenticatesProvenance: false } as const;
type Receipt = { envelope: Envelope; policyId: string; revisionBefore: number; revisionAfter: number; dateBefore: DateValue; dateAfter: DateValue; skills: { fengshuiHolders: string[]; prayerHolders: string[] }; migrations: Migration[]; writes: Write[]; removedFacilities: Removal[]; income: Income; generations: Generation[]; draws: Draw[]; snapshotAfter: Snapshot; sourceBoundary: typeof BOUNDARY };
type State = { tag: typeof TAG; schemaVersion: 1; profile: typeof PROFILE; genesis: Scenario; snapshot: Snapshot; acceptedCommands: { envelope: Envelope; receipt: Receipt }[]; sourceBoundary: typeof BOUNDARY };
type Failure = { ok: false; committed: false; reason: string; commandId: string | null; effects: [] };
type StateResult = { ok: true; state: State } | Failure;
type Result = { ok: true; committed: boolean; duplicate: boolean; state: State; receipt: Receipt } | Failure;
type Preview = { ok: true; committed: false; duplicate: boolean; projectedState: State; receipt: Receipt } | Failure;
type SaveResult = { ok: true; serialized: string } | Failure;
type Expected = { ok: true; duplicate: boolean; receipt: Receipt } | Failure;
type Trace = { tag: 'san11-city-season-trace-v1'; scenario: Scenario; attempts: { envelope: Envelope; expected: Expected | null }[]; expectedFinalState: State | null };
type ReplayResult = { ok: true; state: State; attempts: { envelope: Envelope; result: Expected }[] } | Failure;
export type CitySeasonScenarioV1 = Frozen<Scenario>;
export type CitySeasonStateV1 = Frozen<State>;
export type CitySeasonEnvelopeV1 = Frozen<Envelope>;
export type CitySeasonSnapshotV1 = Frozen<Snapshot>;
export type CitySeasonReceiptV1 = Frozen<Receipt>;
export type CitySeasonResultV1 = Frozen<Result>;
export type CitySeasonFailureV1 = Frozen<Failure>;
export type CitySeasonPreviewV1 = Frozen<Preview>;
export type CitySeasonSaveResultV1 = Frozen<SaveResult>;
export type CitySeasonTraceV1 = Frozen<Trace>;
export type CitySeasonReplayResultV1 = Frozen<ReplayResult>;

class Invalid extends Error { constructor(readonly reason: string) { super(reason); } }
function fail(reason: string): never { throw new Invalid(reason); }
function failure(e: unknown, commandId: string | null = null): Failure { return { ok: false, committed: false, reason: e instanceof Invalid ? e.reason : 'invalid-input', commandId, effects: [] }; }
function clone<T>(v: T): T { return JSON.parse(JSON.stringify(v)) as T; }
function freeze<T>(v: T): Frozen<T> { if (v !== null && typeof v === 'object' && !Object.isFrozen(v)) { for (const x of Object.values(v)) freeze(x); Object.freeze(v); } return v as Frozen<T>; }
function canonical(v: unknown): string { if (v === null || typeof v !== 'object') { const text = JSON.stringify(v); if (text === undefined) fail('invalid-data'); return text; } if (Array.isArray(v)) return '[' + v.map(canonical).join(',') + ']'; const r = v as Record<string, unknown>; return '{' + Object.keys(r).sort().map(k => JSON.stringify(k) + ':' + canonical(r[k])).join(',') + '}'; }
function same(a: unknown, b: unknown): boolean { return canonical(a) === canonical(b); }
function utf8Bytes(s: string): number { let n = 0; for (const c of s) { const p = c.codePointAt(0)!; n += p < 128 ? 1 : p < 2048 ? 2 : p < 65536 ? 3 : 4; } return n; }
/** Closed non-Proxy JSON DTOs in an unpolluted realm, not a sandbox for Proxy traps. */
function detach(v: unknown): unknown {
  let nodes = 0, bytes = 0; const active = new Set<object>();
  function visit(x: unknown, depth: number): unknown {
    if (++nodes > MAX_NODES || depth > MAX_DEPTH) fail('serialization-budget');
    if (x === null || typeof x === 'boolean') return x;
    if (typeof x === 'number') { if (!Number.isFinite(x) || !Number.isSafeInteger(x) || Object.is(x, -0)) fail('invalid-number'); return x; }
    if (typeof x === 'string') { bytes += utf8Bytes(x); if (bytes > MAX_BYTES) fail('serialization-budget'); return x; }
    if (typeof x !== 'object' || active.has(x)) fail('invalid-data');
    const array = Array.isArray(x), proto = Object.getPrototypeOf(x);
    if (proto !== (array ? Array.prototype : Object.prototype) && !(proto === null && !array)) fail('invalid-prototype');
    const keys = Reflect.ownKeys(x); if (keys.length > (array ? MAX_ARRAY + 1 : 256)) fail('serialization-budget');
    const ds = Object.getOwnPropertyDescriptors(x); Object.setPrototypeOf(ds, null);
    if (keys.some(k => typeof k !== 'string' || !Object.hasOwn(ds[k]!, 'value') || (!ds[k]!.enumerable && !(array && k === 'length')))) fail('invalid-data');
    active.add(x);
    try {
      if (array) { const n = ds.length!.value as number; if (!Number.isSafeInteger(n) || n < 0 || n > MAX_ARRAY || keys.length !== n + 1) fail('invalid-array'); const out: unknown[] = []; for (let i = 0; i < n; i++) { if (!Object.hasOwn(ds, String(i))) fail('invalid-array'); out.push(visit(ds[String(i)]!.value, depth + 1)); } return out; }
      const out: Record<string, unknown> = {}; for (const k of keys as string[]) { bytes += utf8Bytes(k); if (bytes > MAX_BYTES) fail('serialization-budget'); Object.defineProperty(out, k, { value: visit(ds[k]!.value, depth + 1), enumerable: true, writable: true, configurable: true }); } return out;
    } finally { active.delete(x); }
  }
  const out = visit(v, 0); if (utf8Bytes(canonical(out)) > MAX_BYTES) fail('serialization-budget'); return out;
}
function budget(v: unknown): void { detach(v); }
function object(v: unknown, keys: readonly string[]): Record<string, unknown> { if (v === null || typeof v !== 'object' || Array.isArray(v)) fail('invalid-object'); const r = v as Record<string, unknown>; if (keys.some(k => !Object.hasOwn(r, k)) || Object.keys(r).some(k => !keys.includes(k))) fail('invalid-fields'); return r; }
function integer(v: unknown, min = 0, max = Number.MAX_SAFE_INTEGER): number { if (typeof v !== 'number' || !Number.isSafeInteger(v) || Object.is(v, -0) || v < min || v > max) fail('invalid-integer'); return v; }
function id(v: unknown): string { if (typeof v !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9_.:-]{0,63}$/.test(v)) fail('invalid-id'); return v; }
function list(v: unknown, max: number): unknown[] { if (!Array.isArray(v) || v.length > max) fail('invalid-array'); return v; }
function unique<T>(xs: T[]): void { if (new Set(xs).size !== xs.length) fail('duplicate-id'); }
const compare = (a: string, b: string): number => a < b ? -1 : a > b ? 1 : 0;
/** Duplicate decoded keys are rejected before JSON overwrite, including escaped aliases. */
function parseJson(text: unknown): unknown {
  if (typeof text !== 'string') fail('invalid-json'); if (utf8Bytes(text) > MAX_BYTES) fail('serialization-budget'); let p = 0, nodes = 0;
  const ws = () => { while (p < text.length && /[\x20\t\r\n]/.test(text[p]!)) p++; };
  function str(): string { const start = p++; let escape = false; while (p < text.length) { const c = text[p++]!; if (!escape && c === '"') return JSON.parse(text.slice(start, p)) as string; if (!escape && c === '\\') escape = true; else escape = false; } return fail('invalid-json'); }
  function value(depth: number): unknown {
    if (++nodes > MAX_NODES || depth > MAX_DEPTH) fail('serialization-budget'); ws(); const c = text[p]; if (c === '"') return str();
    if (c === '{') { p++; ws(); const r: Record<string, unknown> = {}, keys = new Set<string>(); if (text[p] === '}') { p++; return r; } while (true) { ws(); if (text[p] !== '"') fail('invalid-json'); const k = str(); if (keys.has(k)) fail('duplicate-json-key'); keys.add(k); if (keys.size > 256) fail('serialization-budget'); ws(); if (text[p++] !== ':') fail('invalid-json'); Object.defineProperty(r, k, { value: value(depth + 1), enumerable: true, writable: true, configurable: true }); ws(); const end = text[p++]; if (end === '}') return r; if (end !== ',') fail('invalid-json'); } }
    if (c === '[') { p++; ws(); const a: unknown[] = []; if (text[p] === ']') { p++; return a; } while (true) { if (a.length >= MAX_ARRAY) fail('serialization-budget'); a.push(value(depth + 1)); ws(); const end = text[p++]; if (end === ']') return a; if (end !== ',') fail('invalid-json'); } }
    for (const [token, result] of [['true', true], ['false', false], ['null', null]] as const) if (text.startsWith(token, p)) { p += token.length; return result; }
    const token = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/.exec(text.slice(p))?.[0]; if (!token) fail('invalid-json'); p += token.length; const n = Number(token); if (!Number.isSafeInteger(n) || Object.is(n, -0)) fail('invalid-number'); return n;
  }
  const result = value(0); ws(); if (p !== text.length) fail('invalid-json'); return detach(result);
}
function date(v: unknown): DateValue { const r = object(v, ['year', 'month', 'day']); integer(r.year, 1, 9999); integer(r.month, 1, 12); if (r.day !== 1) fail('month-start-required'); return r as unknown as DateValue; }
function nextMonth(d: DateValue): DateValue { const year = d.year + (d.month === 12 ? 1 : 0), month = d.month === 12 ? 1 : d.month + 1; if (year > 9999) fail('calendar-overflow'); return { year, month, day: 1 }; }
function scenario(v: unknown): Scenario {
  const r = object(v, ['schemaVersion','profile','date','initialMonthAlreadySettled','monthLimit','ownershipFrozen','completeResidentRoster','unsupportedIncomeSkillsAbsent','activeForceId','difficulty','controller','city','baseFoodWord','officers','facilities','current','scheduled','seed','policy','catalog','sources']);
  if (r.schemaVersion !== 1 || r.profile !== PROFILE) fail('unsupported-profile');
  if (r.initialMonthAlreadySettled !== true || r.ownershipFrozen !== true || r.completeResidentRoster !== true || r.unsupportedIncomeSkillsAbsent !== true) fail('incomplete-or-unsupported-context');
  date(r.date); integer(r.monthLimit, 1, 36); id(r.activeForceId); integer(r.baseFoodWord, 0, 65535); integer(r.seed, 1, 4294967295);
  if (r.difficulty !== 'normal' && r.difficulty !== 'super') fail('unsupported-difficulty'); if (r.controller !== 'player' && r.controller !== 'ai') fail('invalid-controller');
  if (!same(r.policy, policyData)) fail('unsupported-policy'); if (!same(r.catalog, catalogData)) fail('unsupported-catalog'); if (!same(r.sources, sourceData)) fail('unsupported-source-binding');
  const c = object(r.city, ['id','ownerForceId','food','foodCapacity','troops','security','techniquePoints']); id(c.id); id(c.ownerForceId); if (c.ownerForceId !== r.activeForceId) fail('owner-mismatch'); integer(c.foodCapacity, 1, 1_000_000_000); integer(c.food, 1, c.foodCapacity as number); integer(c.troops, 1, 150000); integer(c.security, 0, 100); integer(c.techniquePoints, 0, 10000);
  const officers = list(r.officers, 80).map(x => { const o = object(x, ['id','forceId','cityId','role','residency','health','seasonSkills']); id(o.id); if (o.forceId !== c.ownerForceId || o.cityId !== c.id || o.role !== 'ordinary-officer' || o.residency !== 'present') fail('unsupported-officer'); integer(o.health, 0, 3); const skills = list(o.seasonSkills, 2); unique(skills); if (skills.some(s => s !== 'fengshui' && s !== 'prayer')) fail('unsupported-skill'); return o as unknown as Officer; }); unique(officers.map(o => o.id));
  const fs = list(r.facilities, 30); if (fs.length !== 30) fail('thirty-slots-required');
  const facilities = fs.filter(x => x !== null).map(x => { const f = object(x, ['id','kind','level','complete','position']); id(f.id); if (f.complete !== true || !catalogData.rows.some(row => row.kind === f.kind && row.level === f.level)) fail('unsupported-facility'); const p = object(f.position, ['q','r']); integer(p.q, -1_000_000, 1_000_000); integer(p.r, -1_000_000, 1_000_000); return f as unknown as Facility; }); unique(facilities.map(f => f.id)); unique(facilities.map(f => `${f.position.q}:${f.position.r}`));
  const current = object(r.current, KINDS), scheduled = object(r.scheduled, KINDS), next = nextMonth(r.date as DateValue);
  for (const k of KINDS) { const cur = object(current[k], ['remainingMonths']); integer(cur.remainingMonths, 0, 3); const pending = scheduled[k]; if (pending !== null) { const p = object(pending, ['activationYear','activationMonth','durationMonths']); if (p.activationYear !== next.year || p.activationMonth !== next.month || cur.remainingMonths !== 0) fail('invalid-initial-pending'); integer(p.durationMonths, 1, policyData.durationMonths[k].maximum); } }
  // Validate the entire finite horizon and the one-month scheduled lookahead at creation.
  let end = r.date as DateValue; for (let i = 0; i < (r.monthLimit as number) + 1; i++) end = nextMonth(end);
  return r as unknown as Scenario;
}
function envelope(v: unknown): Envelope { const r = object(v, ['id','expectedRevision','command']); id(r.id); integer(r.expectedRevision); const c = object(r.command, ['type']); if (c.type !== 'AdvanceSeasonMonth') fail('unsupported-command'); return r as unknown as Envelope; }
function initial(g: Scenario): State { return { tag: TAG, schemaVersion: 1, profile: PROFILE, genesis: clone(g), snapshot: { revision: 0, advancedMonths: 0, date: clone(g.date), city: clone(g.city), officers: clone(g.officers), facilities: clone(g.facilities), current: clone(g.current), scheduled: clone(g.scheduled), rng: { word: g.seed, cursor: 0 } }, acceptedCommands: [], sourceBoundary: BOUNDARY }; }
function write(path: string, cause: string, before: number, requested: number, after: number): Write { integer(before, -Number.MAX_SAFE_INTEGER); integer(requested, -Number.MAX_SAFE_INTEGER); integer(after, -Number.MAX_SAFE_INTEGER); const actualDelta = after - before; integer(actualDelta, -Number.MAX_SAFE_INTEGER); const discarded = Math.abs(requested - actualDelta); integer(discarded); return { path, cause, before, requested, after, actualDelta, discarded, policyId: policyData.writer.id }; }
function saveRecord(s: State): SaveResult { budget(s); const record = { tag: SAVE_TAG, state: s }; budget(record); const result = { ok: true as const, serialized: canonical(record) }; budget(result); return result; }
function fitState(s: State): void {
  saveRecord(s); budget({ ok: true, state: s });
  // Commit must leave every historical idempotent execute AND preview returnable.
  for (const a of s.acceptedCommands) { budget({ ok: true, committed: false, duplicate: true, state: s, receipt: a.receipt }); budget({ ok: true, committed: false, duplicate: true, projectedState: s, receipt: a.receipt }); }
}
function draw(s: Snapshot, bound: number, label: string): Draw {
  integer(bound, 1, 1_000_000); const before = clone(s.rng), words: RawWord[] = [], limit = Math.floor(4294967295 / bound) * bound; integer(limit, 1, 4294967295);
  while (true) {
    if (s.rng.cursor >= MAX_WORDS) fail('rng-budget'); const seedBefore = s.rng.word, cursorBefore = s.rng.cursor; let x = seedBefore;
    x = (x ^ (x << 13)) >>> 0; x = (x ^ (x >>> 17)) >>> 0; x = (x ^ (x << 5)) >>> 0;
    integer(x, 1, 4294967295); s.rng.word = x; s.rng.cursor++; const sample = x - 1; integer(sample, 0, 4294967294); const rejected = sample >= limit;
    words.push({ seedBefore, seedAfter: x, cursorBefore, cursorAfter: s.rng.cursor, raw: x, sample, limit, rejected });
    if (!rejected) { const value = sample % bound; integer(value, 0, bound - 1); return { label, bound, words, value, cursorBefore: before.cursor, cursorAfter: s.rng.cursor, seedBefore: before.word, seedAfter: s.rng.word, policyId: policyData.rng.id }; }
  }
}
function income(g: Scenario, s: Snapshot): Income {
  if (!policyData.timing.seasonMonths.includes(s.date.month)) return { status: 'not-due', policyId: policyData.foodAdapter.id };
  const granaries = s.facilities.filter((f): f is Facility => f !== null && f.kind === 'granary');
  const slots = s.facilities.map(f => {
    if (f === null) return null;
    const row = catalogData.rows.find(r => r.kind === f.kind && r.level === f.level); if (!row) return fail('unsupported-facility');
    const base = { facilityTypeWord: row.typeWord, constructionWord: 1 };
    if (f.kind !== 'farm') return base;
    const adjacentGranary = granaries.some(a => { const dq = a.position.q - f.position.q, dr = a.position.r - f.position.r; return Math.max(Math.abs(dq), Math.abs(dr), Math.abs(dq + dr)) === 1; });
    return { ...base, adjacentGranary };
  });
  const request: CityFoodIncomeProjectionInput = { profile: 'city-food-income-stable-resolved-non-easy-u32-v1', baseFoodWord: g.baseFoodWord, slots, resolvedTypeRows: { 32: { valid: true, foodYieldWord: 1500 }, 49: { valid: true, foodYieldWord: 1500 }, 53: { valid: true, foodYieldWord: 2250 } }, difficultyWord: g.difficulty === 'normal' ? 1 : 2, securityByte: s.city.security, ...(s.facilities.some(f => f?.kind === 'military-farm') ? { cityTroopsWord: s.city.troops } : {}), ...(g.difficulty === 'super' ? { cityPlayerPredicate: g.controller === 'player' } : {}) };
  const receipt = calculateCityFoodIncomeProjection(request); if (!receipt.supported) fail('city-food-kernel-rejected:' + receipt.reason);
  integer(receipt.returnedIncomeSigned, 0, 644418);
  if (receipt.returnedIncomeSigned !== receipt.returnedIncomeU32 || receipt.securityProductRaw !== receipt.securityProductSigned || receipt.securityProductRaw !== receipt.securityProductU32 || receipt.slots.some(slot => slot.militaryProductRaw !== slot.militaryProductU32)) fail('city-food-kernel-inconsistent');
  const harvestRequest: MonthlyCityFoodBaseArgumentInput = { profile: 'monthly-city-food-base-argument-u32-v1', entryFoodEdiU32: receipt.returnedIncomeU32, harvestPredicateEaxU32: s.current.harvest.remainingMonths > 0 ? 1 : 0, lateLevyFlagDwordU32: 0 };
  const harvestReceipt = calculateMonthlyCityFoodBaseArgument(harvestRequest); if (!harvestReceipt.supported) fail('harvest-kernel-rejected:' + harvestReceipt.reason);
  const amount = integer(harvestReceipt.pushedArgumentSigned, 0, 966627);
  if (amount !== harvestReceipt.pushedArgumentU32 || amount !== harvestReceipt.postHarvestSigned || amount !== harvestReceipt.postHarvestU32 || harvestReceipt.levyApplied || harvestReceipt.harvestApplied !== (s.current.harvest.remainingMonths > 0) || (harvestReceipt.harvestTriple !== null && (harvestReceipt.harvestTriple.unwrappedU64 !== harvestReceipt.harvestTriple.lowU32 || harvestReceipt.harvestTriple.lowU32 !== harvestReceipt.harvestTriple.signed))) fail('harvest-kernel-inconsistent');
  const before = s.city.food, after = Math.min(s.city.foodCapacity, before + amount), posting = write('city.food', 'quarterly-food-income', before, amount, after); s.city.food = after;
  return { status: 'due', observationKind: 'derived-adapter-observations', policyId: policyData.foodAdapter.id, cityFood: { request, receipt }, harvest: { request: harvestRequest, receipt: harvestReceipt }, posting };
}
function step(s: State, e: Envelope): { state: State; receipt: Receipt; duplicate: boolean } {
  const old = s.acceptedCommands.find(a => a.envelope.id === e.id);
  if (old) { if (!same(old.envelope, e)) fail('command-id-conflict'); return { state: s, receipt: old.receipt, duplicate: true }; }
  if (e.expectedRevision !== s.snapshot.revision) fail('revision-conflict');
  if (s.acceptedCommands.length >= MAX_HISTORY) fail('history-budget'); if (s.snapshot.advancedMonths >= s.genesis.monthLimit) fail('month-limit');
  const candidate = clone(s), x = candidate.snapshot, before = s.snapshot, draws: Draw[] = [], writes: Write[] = [], removedFacilities: Removal[] = [], migrations: Migration[] = [], generations: Generation[] = [];
  const skills = { fengshuiHolders: x.officers.filter(o => o.seasonSkills.includes('fengshui')).map(o => o.id).sort(compare), prayerHolders: x.officers.filter(o => o.seasonSkills.includes('prayer')).map(o => o.id).sort(compare) };
  const fengshui = skills.fengshuiHolders.length > 0, prayer = skills.prayerHolders.length > 0;
  const roll = (bound: number, label: string): number => { const d = draw(x, bound, label); draws.push(d); return d.value; };
  x.date = nextMonth(x.date);
  for (const k of KINDS) {
    const oldRemaining = x.current[k].remainingMonths, remaining = Math.max(0, oldRemaining - 1), pending = x.scheduled[k];
    writes.push(write(`current.${k}.remainingMonths`, 'monthly-decay', oldRemaining, oldRemaining > 0 ? -1 : 0, remaining)); x.current[k].remainingMonths = remaining;
    let outcome: Migration['outcome'] = 'no-pending';
    if (pending !== null) { if (pending.activationYear !== x.date.year || pending.activationMonth !== x.date.month || remaining !== 0) fail('invalid-pending-state'); if (fengshui && k !== 'harvest') outcome = 'prevented-fengshui'; else { outcome = 'activated'; writes.push(write(`current.${k}.remainingMonths`, 'scheduled-activation', remaining, pending.durationMonths, pending.durationMonths)); x.current[k].remainingMonths = pending.durationMonths; } }
    x.scheduled[k] = null; migrations.push({ kind: k, currentBefore: oldRemaining, currentAfter: x.current[k].remainingMonths, pendingBefore: clone(pending), pendingAfter: null, outcome, policyId: policyData.timing.id });
  }
  if (x.current.plague.remainingMonths > 0) {
    const p = policyData.plague, rate = p.troopLossBasisPoints.minimum + roll(p.troopLossBasisPoints.maximum - p.troopLossBasisPoints.minimum + 1, 'plague:troop-loss-rate');
    const loss = Math.floor(x.city.troops * rate / p.troopLossBasisPoints.denominator), after = x.city.troops - loss; if (after <= 0) fail('unsupported-terminal-effect');
    writes.push(write('city.troops', 'plague', x.city.troops, loss === 0 ? 0 : -loss, after)); x.city.troops = after;
    for (const o of [...x.officers].sort((a, b) => compare(a.id, b.id))) {
      const worsen = roll(p.healthDrawBound, `plague:health:${o.id}`) < p.healthWorsenThreshold ? p.healthIncrement : 0, afterHealth = o.health + worsen;
      if (afterHealth > 3) fail('unsupported-terminal-effect'); writes.push(write(`officers.${o.id}.health`, 'plague', o.health, worsen, afterHealth)); o.health = afterHealth;
    }
  }
  if (x.current.locust.remainingMonths > 0) {
    const p = policyData.locust, rate = p.foodLossBasisPoints.minimum + roll(p.foodLossBasisPoints.maximum - p.foodLossBasisPoints.minimum + 1, 'locust:food-loss-rate');
    const loss = Math.floor(x.city.food * rate / p.foodLossBasisPoints.denominator), after = x.city.food - loss; if (after <= 0) fail('unsupported-terminal-effect');
    writes.push(write('city.food', 'locust', x.city.food, loss === 0 ? 0 : -loss, after)); x.city.food = after;
    const farms = x.facilities.map((f, slot) => ({ f, slot })).filter((a): a is { f: Facility; slot: number } => a.f !== null && a.f.kind === 'farm' && a.f.level === 1).sort((a, b) => compare(a.f.id, b.f.id));
    for (const { f, slot } of farms) if (roll(p.farmRemovalDrawBound, `locust:farm:${f.id}`) === p.farmRemovalSelectedValue) {
      if (x.city.techniquePoints < p.techniquePointsPerFarm) fail('insufficient-technique-points');
      const tp = write('city.techniquePoints', `remove-farm:${f.id}`, x.city.techniquePoints, -p.techniquePointsPerFarm, x.city.techniquePoints - p.techniquePointsPerFarm), occupancy = write(`facilities.${slot}.occupied`, 'locust-farm-removal', 1, -1, 0);
      x.city.techniquePoints = tp.after; x.facilities[slot] = null; writes.push(tp, occupancy); removedFacilities.push({ slot, removedFacility: clone(f), occupancy, techniquePoints: tp });
    }
  }
  const foodIncome = income(candidate.genesis, x); if (foodIncome.status === 'due') writes.push(foodIncome.posting);
  const next = nextMonth(x.date);
  for (const k of KINDS) {
    const threshold = k === 'harvest' && prayer ? policyData.occurrence.harvestWithPrayer : policyData.occurrence[k], denominator = policyData.occurrence.denominator;
    let outcome: Generation['outcome'];
    if (x.current[k].remainingMonths > 0 || x.scheduled[k] !== null) outcome = 'active-or-pending';
    else if (fengshui && k !== 'harvest') outcome = 'prevented-fengshui';
    else if (roll(denominator, `generate:${k}:occurrence`) >= threshold) outcome = 'not-selected';
    else { const d = policyData.durationMonths[k], durationMonths = d.minimum + roll(d.maximum - d.minimum + 1, `generate:${k}:duration`); x.scheduled[k] = { activationYear: next.year, activationMonth: next.month, durationMonths }; outcome = 'scheduled'; }
    generations.push({ kind: k, threshold, denominator, outcome, pending: clone(x.scheduled[k]), policyId: policyData.id });
  }
  integer(x.city.troops, 1, 150000); integer(x.city.food, 1, x.city.foodCapacity); integer(x.city.techniquePoints, 0, 10000); for (const o of x.officers) integer(o.health, 0, 3);
  for (const k of KINDS) { integer(x.current[k].remainingMonths, 0, 3); if (x.current[k].remainingMonths > 0 && x.scheduled[k] !== null) fail('overlapping-event-state'); }
  x.revision++; x.advancedMonths++;
  const receipt: Receipt = { envelope: clone(e), policyId: policyData.id, revisionBefore: before.revision, revisionAfter: x.revision, dateBefore: clone(before.date), dateAfter: clone(x.date), skills, migrations, writes, removedFacilities, income: foodIncome, generations, draws, snapshotAfter: clone(x), sourceBoundary: BOUNDARY };
  candidate.acceptedCommands.push({ envelope: clone(e), receipt }); fitState(candidate);
  budget({ ok: true, committed: true, duplicate: false, state: candidate, receipt }); budget({ ok: true, committed: false, duplicate: false, projectedState: candidate, receipt });
  return { state: candidate, receipt, duplicate: false };
}
/** Reconstruct every receipt and snapshot from immutable genesis, never caller final fields. */
function rebuild(v: unknown): State {
  const r = object(v, ['tag','schemaVersion','profile','genesis','snapshot','acceptedCommands','sourceBoundary']);
  if (r.tag !== TAG || r.schemaVersion !== 1 || r.profile !== PROFILE || !same(r.sourceBoundary, BOUNDARY)) fail('invalid-state');
  let s = initial(scenario(r.genesis)); fitState(s);
  for (const entry of list(r.acceptedCommands, MAX_HISTORY)) {
    const a = object(entry, ['envelope','receipt']), e = envelope(a.envelope), result = step(s, e);
    if (result.duplicate || !same(a.receipt, result.receipt)) fail('receipt-replay-mismatch'); s = result.state;
  }
  if (!same(r.snapshot, s.snapshot)) fail('snapshot-replay-mismatch'); if (!same(r, s)) fail('state-replay-mismatch'); fitState(s); return s;
}
export function createCitySeasonState(input: CitySeasonScenarioV1): Frozen<StateResult> {
  try { const s = initial(scenario(detach(input))); fitState(s); const out = { ok: true as const, state: s }; budget(out); return freeze(out); } catch (e) { return freeze(failure(e)); }
}
export function executeCitySeasonCommand(input: CitySeasonStateV1, command: CitySeasonEnvelopeV1): CitySeasonResultV1 {
  let commandId: string | null = null;
  try { const s = rebuild(detach(input)), e = envelope(detach(command)); commandId = e.id; const r = step(s, e), out = { ok: true as const, committed: !r.duplicate, duplicate: r.duplicate, state: r.state, receipt: r.receipt }; budget(out); return freeze(out); } catch (e) { return freeze(failure(e, commandId)); }
}
export function previewCitySeasonCommand(input: CitySeasonStateV1, command: CitySeasonEnvelopeV1): CitySeasonPreviewV1 {
  let commandId: string | null = null;
  try { const s = rebuild(detach(input)), e = envelope(detach(command)); commandId = e.id; const r = step(s, e), out = { ok: true as const, committed: false as const, duplicate: r.duplicate, projectedState: r.state, receipt: r.receipt }; budget(out); return freeze(out); } catch (e) { return freeze(failure(e, commandId)); }
}
export function saveCitySeasonState(input: CitySeasonStateV1): CitySeasonSaveResultV1 {
  try { return freeze(saveRecord(rebuild(detach(input)))); } catch (e) { return freeze(failure(e)); }
}
export function loadCitySeasonState(serialized: string): Frozen<StateResult> {
  try { const r = object(parseJson(serialized), ['tag','state']); if (r.tag !== SAVE_TAG) fail('invalid-save'); const s = rebuild(r.state), out = { ok: true as const, state: s }; budget(out); return freeze(out); } catch (e) { return freeze(failure(e)); }
}
export function replayCitySeasonTrace(input: CitySeasonTraceV1): CitySeasonReplayResultV1 {
  try {
    const r = object(detach(input), ['tag','scenario','attempts','expectedFinalState']); if (r.tag !== 'san11-city-season-trace-v1') fail('invalid-trace');
    let s = initial(scenario(r.scenario)); fitState(s); const attempts: { envelope: Envelope; result: Expected }[] = [];
    for (const attempt of list(r.attempts, 256)) {
      const a = object(attempt, ['envelope','expected']), e = envelope(a.envelope); let result: Expected;
      try { const next = step(s, e); s = next.state; result = { ok: true, duplicate: next.duplicate, receipt: next.receipt }; } catch (err) { result = failure(err, e.id); }
      if (a.expected !== null && !same(a.expected, result)) fail('trace-expectation-mismatch'); attempts.push({ envelope: clone(e), result });
      budget({ ok: true, state: s, attempts });
    }
    if (r.expectedFinalState !== null && !same(r.expectedFinalState, s)) fail('trace-final-state-mismatch'); fitState(s); const out = { ok: true as const, state: s, attempts }; budget(out); return freeze(out);
  } catch (e) { return freeze(failure(e)); }
}
