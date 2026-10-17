/** Bounded independent city ledger. Source kernels do not authenticate native writers or ownership. */
import namedOffices from '../../../data/catalogs/named-offices-v1.json' with { type: 'json' };
import facilityData from '../../../data/catalogs/city-finance-facilities-v1.json' with { type: 'json' };
import policyData from '../../../data/catalogs/city-finance-policies-v1.json' with { type: 'json' };
import { calculateCityMoneyIncomeProjection } from './city-money-income-projection.ts';
import type { CityMoneyIncomeProjectionInput, CityMoneyIncomeSlot } from './city-money-income-projection.ts';
import { calculateCityFoodIncomeProjection } from './city-food-income-projection.ts';
import type { CityFoodIncomeProjectionInput, CityFoodIncomeSlot } from './city-food-income-projection.ts';
import { calculateMonthlyCityFoodBaseArgument } from './monthly-city-food-base-argument.ts';
import type { MonthlyCityFoodBaseArgumentInput } from './monthly-city-food-base-argument.ts';
import { calculateMonthlySpecialtyProduction } from './monthly-specialty-production.ts';
import type { MonthlySpecialtyProductionInput, MonthlySpecialtyProductionSlot, MonthlySpecialtyProductionSlots } from './monthly-specialty-production.ts';

type Frozen<T> = T extends object ? { readonly [K in keyof T]: Frozen<T[K]> } : T;
const PROFILE = 'standalone-city-finance-v1' as const;
const TAG = 'city-finance-state-v1' as const;
const TRACE_TAG = 'city-finance-trace-v1' as const;
const MAX_BYTES = 67_108_864, MAX_NODES = 4_000_000, MAX_DEPTH = 48, MAX_ARRAY = 1080;
const EQUIPMENT = [1, 2, 3, 4] as const;
const SKILLS = ['wealthy', 'rice-way', 'taxation', 'levy'] as const;
type Equipment = typeof EQUIPMENT[number];
type Skill = typeof SKILLS[number];
type DateV1 = { year: number; month: number; day: 1 | 11 | 21 };
type Resource = { quantity: number; capacity: number };
type Kind = 'market' | 'farm' | 'mint' | 'granary' | 'large-market' | 'fish-market' | 'black-market' | 'military-farm' | 'forge' | 'stable';
type Facility = { id: string; kind: Kind; level: number; complete: boolean; position: { q: number; r: number } };
type Officer = { id: string; forceId: string; cityId: string; role: 'ordinary-officer'; officeId: number; politics: number; charm: number; incomeSkills: Skill[] };
type City = { id: string; kind: 'city'; ownerForceId: string; gold: number; goldCapacity: number; food: number; foodCapacity: number; security: number; troops: number; inventory: Record<Equipment, Resource>; specialtyEquipmentTypes: Equipment[]; governorOfficerId: string | null };
type Harvest = { year: number; month: number; postMonthlyHarvest: boolean };
type Draw = { bound: 100 | 3; value: number };
type Policies = typeof policyData;
type Catalogs = { offices: typeof namedOffices; facilities: typeof facilityData };
type Scenario = {
  schemaVersion: 1; profile: typeof PROFILE; date: DateV1; turn: number; initialDateAlreadySettled: true; advanceLimit: number;
  activeForceId: string; difficulty: 'normal' | 'super'; controller: 'player' | 'ai'; city: City;
  baseProduction: { baseMoneyWord: number; baseFoodWord: number }; facilities: (Facility | null)[];
  completeResidentRoster: true; officers: Officer[]; prisonerCount: 0; hasAdministrativeReform: boolean;
  monthlyHarvestInputs: Harvest[]; rng: { kind: 'bounded-tape-v1'; draws: Draw[]; cursor: 0 }; policies: Policies; catalogs: Catalogs;
};
type Snapshot = { schemaVersion: 1; profile: typeof PROFILE; revision: number; advancedCount: number; date: DateV1; turn: number; city: City; officers: Officer[]; harvestCurrent: Harvest | null; rngCursor: number; lastSettledDate: DateV1 };
type Envelope = { id: string; expectedRevision: number; command: { type: 'AdvanceFinanceTurn' } };
type CatalogDigests = { offices: string; facilities: string };
type Write = { resource: 'gold' | 'food' | 'security' | 'equipment-1' | 'equipment-2' | 'equipment-3' | 'equipment-4'; reason: 'money-base' | 'wealthy-bonus' | 'food-base' | 'rice-way-bonus' | 'salary' | 'specialty' | 'seasonal-security'; before: number; requested: number; accepted: number; actualDelta: number; after: number; cap: number; discarded: number; writerPolicyId: string };
type KernelCall = { status: 'called'; api: string; profile: string; adapterObservationKind: 'derived-adapter-observations'; input: unknown; result: unknown } | { status: 'not-due'; reason: string };
type SalaryItem = { officerId: string; officeId: number; officeName: string; catalogSalary: number };
type SecurityReceipt = { status: 'not-due' | 'applied' | 'administrative-reform-skip'; governorId: string | null; charm: number | null; adminRoll: number | null; lossRoll: number | null; requestedLoss: number; actualLoss: number; before: number; after: number };
type SpecialtyReceipt = { equipmentType: Equipment; eligibility: 'not-due' | 'no-governor' | 'not-specialty' | 'no-completed-facilities' | 'production'; count: number | null; arithmeticProfile: 'comment-f32-rne-trunc-v1'; kernelQuantityRequest: number | null; kernel: KernelCall; write: Write | null };
const BOUNDARY = {
  sourceLevel: 'source-listing-kernels-with-provisional-service-policies', nativeExecution: false, stockVerified: false,
  adapterObservationKind: 'derived-adapter-observations', ownershipAndPayer: 'provisional-engine-rule', stableHelpers: 'provisional-engine-rule',
  schedulingAndWriters: 'provisional-engine-rule', specialtyArithmetic: 'comment-f32-rne-trunc-v1', nativeFullFinance: false,
} as const;
type Receipt = {
  schemaVersion: 1; profile: typeof PROFILE; commandId: string; revisionBefore: number; revisionAfter: number; dateBefore: DateV1; dateAfter: DateV1; turnBefore: number; turnAfter: number;
  settlementKey: string; duplicate: false; policies: Policies; policyDigest: string; catalogDigests: CatalogDigests; sourceBoundary: typeof BOUNDARY;
  ownerSnapshot: { activeForceId: string; ownerForceId: string }; payerCityId: string; payrollOfficerIds: string[];
  incomeEffects: Record<Skill, { active: boolean; holderIds: string[] }>; harvestInput: Harvest | { status: 'not-due' }; securityBeforeIncome: number;
  moneyKernel: KernelCall; foodKernel: KernelCall; monthlyFoodKernel: KernelCall; writes: Write[]; security: SecurityReceipt;
  salary: { status: 'paid' | 'not-due'; items: SalaryItem[]; sum: number; availableBeforeSalary: number | null; paid: number; shortfall: 0; payerPolicyId: string };
  specialty: SpecialtyReceipt[]; rngBefore: number; rngAfter: number; drawsConsumed: { index: number; bound: number; value: number; purpose: 'administrative-reform' | 'seasonal-loss' }[];
  events: { type: 'finance-turn-settled' | 'finance-month-settled' | 'finance-quarter-settled'; settlementKey: string }[];
};
type State = { tag: typeof TAG; schemaVersion: 1; profile: typeof PROFILE; scope: 'independent-fixed-owned-city'; policies: Policies; catalogs: Catalogs; policyDigest: string; catalogDigests: CatalogDigests; genesis: { scenario: Scenario; snapshot: Snapshot }; snapshot: Snapshot; acceptedCommands: { envelope: Envelope; receipt: Receipt }[] };
type Failure = { ok: false; committed: false; reason: string; index: number | null; proposal: { required: number; available: number; shortfall: number } | null };
type StateResult = { ok: true; state: State } | Failure;
type CommandResult = { ok: true; committed: boolean; duplicate: boolean; state: State; receipt: Receipt } | Failure;
type PreviewResult = { ok: true; committed: false; duplicate: boolean; receipt: Receipt; projectedSnapshot: Snapshot } | Failure;
type SaveResult = { ok: true; json: string } | Failure;
type ExpectedOutcome = { ok: true; duplicate: boolean; receipt: Receipt } | { ok: false; reason: string };
type Trace = { tag: typeof TRACE_TAG; scenario: Scenario; attempts: { envelope: Envelope; expectedOutcome: ExpectedOutcome | null }[]; expectedFinalSnapshot: Snapshot | null };
type ReplayResult = { ok: true; state: State; outcomes: ExpectedOutcome[] } | Failure;
export type CityFinanceScenarioV1 = Frozen<Scenario>;
export type CityFinanceStateV1 = Frozen<State>;
export type CityFinanceSnapshotV1 = Frozen<Snapshot>;
export type CityFinanceEnvelopeV1 = Frozen<Envelope>;
export type CityFinancePoliciesV1 = Frozen<Policies>;
export type CityFinanceCatalogsV1 = Frozen<Catalogs>;
export type CityFinanceReceiptV1 = Frozen<Receipt>;
export type CityFinanceWriteV1 = Frozen<Write>;
export type CityFinanceFailureV1 = Frozen<Failure>;
export type CityFinanceStateResultV1 = Frozen<StateResult>;
export type CityFinanceCommandResultV1 = Frozen<CommandResult>;
export type CityFinancePreviewResultV1 = Frozen<PreviewResult>;
export type CityFinanceSaveResultV1 = Frozen<SaveResult>;
export type CityFinanceTraceV1 = Frozen<Trace>;
export type CityFinanceReplayResultV1 = Frozen<ReplayResult>;

class Invalid extends Error {
  readonly reason: string; readonly index: number | null; readonly proposal: Failure['proposal'];
  constructor(reason: string, index: number | null = null, proposal: Failure['proposal'] = null) { super(reason); this.reason = reason; this.index = index; this.proposal = proposal; }
}
function fail(reason: string, index: number | null = null, proposal: Failure['proposal'] = null): never { throw new Invalid(reason, index, proposal); }
function failure(e: unknown): Failure { return { ok: false, committed: false, reason: e instanceof Invalid ? e.reason : 'invalid-data', index: e instanceof Invalid ? e.index : null, proposal: e instanceof Invalid ? e.proposal : null }; }
function freeze<T>(v: T): Frozen<T> { if (v !== null && typeof v === 'object' && !Object.isFrozen(v)) { for (const x of Object.values(v)) freeze(x); Object.freeze(v); } return v as Frozen<T>; }
function clone<T>(v: T): T { return JSON.parse(JSON.stringify(v)) as T; }
function canonical(v: unknown): string { if (v === null || typeof v !== 'object') return JSON.stringify(v); if (Array.isArray(v)) return '[' + v.map(canonical).join(',') + ']'; const r = v as Record<string, unknown>; return '{' + Object.keys(r).sort().map(k => JSON.stringify(k) + ':' + canonical(r[k])).join(',') + '}'; }
function same(a: unknown, b: unknown): boolean { return canonical(a) === canonical(b); }
function utf8Bytes(s: string): number { let n = 0; for (const c of s) { const p = c.codePointAt(0)!; n += p < 128 ? 1 : p < 2048 ? 2 : p < 65536 ? 3 : 4; } return n; }
/** Finite JSON data only. Fractional derived kernel receipts are retained losslessly as JSON numbers. */
function detach(v: unknown): unknown {
  let nodes = 0, bytes = 0; const active = new Set<object>();
  function visit(x: unknown, depth: number): unknown {
    if (++nodes > MAX_NODES || depth > MAX_DEPTH) fail('budget-exceeded');
    if (x === null || typeof x === 'boolean') return x;
    if (typeof x === 'number') { if (!Number.isFinite(x) || Object.is(x, -0)) fail('invalid-number'); return x; }
    if (typeof x === 'string') { if (x.length > MAX_BYTES) fail('budget-exceeded'); bytes += utf8Bytes(x); if (bytes > MAX_BYTES) fail('budget-exceeded'); return x; }
    if (typeof x !== 'object' || active.has(x)) fail('invalid-data');
    const arr = Array.isArray(x), proto = Object.getPrototypeOf(x);
    if (proto !== (arr ? Array.prototype : Object.prototype) && !(proto === null && !arr)) fail('invalid-prototype');
    const keys = Reflect.ownKeys(x);
    if (keys.length > (arr ? MAX_ARRAY + 1 : 128)) fail('budget-exceeded');
    const ds = Object.getOwnPropertyDescriptors(x);
    if (keys.some(k => typeof k !== 'string' || !Object.hasOwn(ds[k]!, 'value') || (!ds[k]!.enumerable && !(arr && k === 'length')))) fail('invalid-data');
    active.add(x);
    try {
      if (arr) {
        const n = ds.length!.value as number;
        if (!Number.isSafeInteger(n) || n < 0 || n > MAX_ARRAY) fail('budget-exceeded');
        if (keys.length !== n + 1) fail('invalid-array');
        const out: unknown[] = [];
        for (let i = 0; i < n; i++) { const d = ds[String(i)]; if (!d) fail('invalid-array'); out.push(visit(d.value, depth + 1)); }
        return out;
      }
      const out: Record<string, unknown> = {};
      for (const k of keys as string[]) { bytes += utf8Bytes(k); if (bytes > MAX_BYTES) fail('budget-exceeded'); Object.defineProperty(out, k, { value: visit(ds[k]!.value, depth + 1), enumerable: true, writable: true, configurable: true }); }
      return out;
    } finally { active.delete(x); }
  }
  const out = visit(v, 0); if (utf8Bytes(canonical(out)) > MAX_BYTES) fail('budget-exceeded'); return out;
}
function budget(v: unknown): void { detach(v); }
function object(v: unknown, keys: readonly string[]): Record<string, unknown> { if (v === null || typeof v !== 'object' || Array.isArray(v)) fail('invalid-object'); const r = v as Record<string, unknown>; if (keys.some(k => !Object.hasOwn(r, k)) || Object.keys(r).some(k => !keys.includes(k))) fail('invalid-fields'); return r; }
function uint(v: unknown, max = Number.MAX_SAFE_INTEGER, min = 0): number { if (typeof v !== 'number' || !Number.isSafeInteger(v) || Object.is(v, -0) || v < min || v > max) fail('invalid-number'); return v; }
function bool(v: unknown): boolean { if (typeof v !== 'boolean') fail('invalid-boolean'); return v; }
function list(v: unknown, max: number): unknown[] { if (!Array.isArray(v) || v.length > max) fail('invalid-array'); return v; }
function choice<T extends string>(v: unknown, values: readonly T[], reason: string): T { if (!values.includes(v as T)) fail(reason); return v as T; }
function id(v: unknown): string { if (typeof v !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9_.:-]{0,63}$/.test(v)) fail('invalid-id'); return v; }
function date(v: unknown): DateV1 { const r = object(v, ['year', 'month', 'day']); const day = uint(r.day, 21, 1); if (day !== 1 && day !== 11 && day !== 21) fail('invalid-date'); return { year: uint(r.year, 9999, 1), month: uint(r.month, 12, 1), day }; }
function nextDate(d: DateV1): DateV1 { if (d.day === 1) return { ...d, day: 11 }; if (d.day === 11) return { ...d, day: 21 }; if (d.month < 12) return { year: d.year, month: d.month + 1, day: 1 }; if (d.year === 9999) fail('calendar-overflow'); return { year: d.year + 1, month: 1, day: 1 }; }
/** Bounded JSON parser rejects duplicate decoded object keys before they can be overwritten. */
function parseJson(text: unknown): unknown {
  if (typeof text !== 'string') fail('invalid-json');
  if (text.length > MAX_BYTES || utf8Bytes(text) > MAX_BYTES) fail('budget-exceeded');
  let p = 0, nodes = 0;
  const ws = () => { while (p < text.length && /[\x20\t\r\n]/.test(text[p]!)) p++; };
  function str(): string {
    const start = p++; let escaped = false;
    while (p < text.length) { const c = text[p++]!; if (!escaped && c === '"') return JSON.parse(text.slice(start, p)) as string; if (!escaped && c === '\\') escaped = true; else escaped = false; }
    return fail('invalid-json');
  }
  function value(depth: number): unknown {
    if (++nodes > MAX_NODES || depth > MAX_DEPTH) fail('budget-exceeded'); ws(); const c = text[p];
    if (c === '"') return str();
    if (c === '{') {
      p++; ws(); const r: Record<string, unknown> = {}; const keys = new Set<string>();
      if (text[p] === '}') { p++; return r; }
      while (true) { ws(); if (text[p] !== '"') fail('invalid-json'); const k = str(); if (keys.has(k)) fail('duplicate-json-key'); keys.add(k); if (keys.size > 128) fail('budget-exceeded'); ws(); if (text[p++] !== ':') fail('invalid-json'); Object.defineProperty(r, k, { value: value(depth + 1), enumerable: true, writable: true, configurable: true }); ws(); const end = text[p++]; if (end === '}') return r; if (end !== ',') fail('invalid-json'); }
    }
    if (c === '[') { p++; ws(); const r: unknown[] = []; if (text[p] === ']') { p++; return r; } while (true) { if (r.length >= MAX_ARRAY) fail('budget-exceeded'); r.push(value(depth + 1)); ws(); const end = text[p++]; if (end === ']') return r; if (end !== ',') fail('invalid-json'); } }
    for (const [token, result] of [['true', true], ['false', false], ['null', null]] as const) if (text.startsWith(token, p)) { p += token.length; return result; }
    const token = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/.exec(text.slice(p))?.[0]; if (!token) fail('invalid-json'); p += token.length; const n = Number(token); if (!Number.isFinite(n) || Object.is(n, -0)) fail('invalid-number'); return n;
  }
  const result = value(0); ws(); if (p !== text.length) fail('invalid-json'); return detach(result);
}

/** SHA-256 of canonical UTF-8 JSON; no dependency on a platform crypto registry. */
function digest(profile: unknown): string {
  const s = canonical(profile), bytes: number[] = [];
  for (const c of s) { const p = c.codePointAt(0)!; if (p < 128) bytes.push(p); else if (p < 2048) bytes.push(192 | (p >> 6), 128 | (p & 63)); else if (p < 65536) bytes.push(224 | (p >> 12), 128 | ((p >> 6) & 63), 128 | (p & 63)); else bytes.push(240 | (p >> 18), 128 | ((p >> 12) & 63), 128 | ((p >> 6) & 63), 128 | (p & 63)); }
  const length = bytes.length * 8; bytes.push(128); while (bytes.length % 64 !== 56) bytes.push(0); for (let i = 7; i >= 0; i--) bytes.push(Number((BigInt(length) >> BigInt(8 * i)) & 255n));
  const k = [0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
  const h = [0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19], rotate = (v: number, n: number) => (v >>> n) | (v << (32 - n));
  for (let offset = 0; offset < bytes.length; offset += 64) {
    const w: number[] = []; for (let i = 0; i < 16; i++) { const j = offset + i * 4; w.push(((bytes[j]! << 24) | (bytes[j + 1]! << 16) | (bytes[j + 2]! << 8) | bytes[j + 3]!) >>> 0); }
    for (let i = 16; i < 64; i++) { const a = w[i - 15]!, b = w[i - 2]!; w.push((w[i - 16]! + (rotate(a,7) ^ rotate(a,18) ^ (a >>> 3)) + w[i - 7]! + (rotate(b,17) ^ rotate(b,19) ^ (b >>> 10))) >>> 0); }
    let [a,b,c,d,e,f,g,z] = h as [number,number,number,number,number,number,number,number];
    for (let i = 0; i < 64; i++) { const t1 = (z + (rotate(e,6) ^ rotate(e,11) ^ rotate(e,25)) + ((e & f) ^ (~e & g)) + k[i]! + w[i]!) >>> 0; const t2 = ((rotate(a,2) ^ rotate(a,13) ^ rotate(a,22)) + ((a & b) ^ (a & c) ^ (b & c))) >>> 0; z=g;g=f;f=e;e=(d+t1)>>>0;d=c;c=b;b=a;a=(t1+t2)>>>0; }
    [a,b,c,d,e,f,g,z].forEach((v,i) => { h[i] = (h[i]! + v) >>> 0; });
  }
  return h.map(x => x.toString(16).padStart(8, '0')).join('');
}
const POLICIES = clone(policyData);
const CATALOGS: Catalogs = { offices: clone(namedOffices), facilities: clone(facilityData) };
const POLICY_DIGEST = digest(POLICIES);
const CATALOG_DIGESTS: CatalogDigests = { offices: digest(CATALOGS.offices), facilities: digest(CATALOGS.facilities) };
export const CITY_FINANCE_POLICIES_V1 = freeze(POLICIES);
export const CITY_FINANCE_CATALOGS_V1 = freeze(CATALOGS);
export const CITY_FINANCE_POLICY_DIGEST_V1 = POLICY_DIGEST;
export const CITY_FINANCE_CATALOG_DIGESTS_V1 = freeze(CATALOG_DIGESTS);
export const CITY_FINANCE_EVIDENCE_V1 = freeze(BOUNDARY);
function resource(v: unknown): Resource { const r = object(v, ['quantity', 'capacity']); const capacity = uint(r.capacity, 1_000_000); return { quantity: uint(r.quantity, capacity), capacity }; }
function city(v: unknown): City {
  const r = object(v, ['id', 'kind', 'ownerForceId', 'gold', 'goldCapacity', 'food', 'foodCapacity', 'security', 'troops', 'inventory', 'specialtyEquipmentTypes', 'governorOfficerId']);
  if (r.kind !== 'city') fail('unsupported-city-kind');
  const goldCapacity = uint(r.goldCapacity, 1_000_000_000), foodCapacity = uint(r.foodCapacity, 1_000_000_000);
  const inventory = object(r.inventory, ['1', '2', '3', '4']);
  const specialtyEquipmentTypes = list(r.specialtyEquipmentTypes, 4).map(v => uint(v, 4, 1) as Equipment);
  if (new Set(specialtyEquipmentTypes).size !== specialtyEquipmentTypes.length) fail('duplicate-specialty');
  return { id: id(r.id), kind: 'city', ownerForceId: id(r.ownerForceId), gold: uint(r.gold, goldCapacity), goldCapacity, food: uint(r.food, foodCapacity), foodCapacity,
    security: uint(r.security, 100), troops: uint(r.troops, 150_000), inventory: { 1: resource(inventory['1']), 2: resource(inventory['2']), 3: resource(inventory['3']), 4: resource(inventory['4']) }, specialtyEquipmentTypes,
    governorOfficerId: r.governorOfficerId === null ? null : id(r.governorOfficerId) };
}
function facility(v: unknown): Facility | null {
  if (v === null) return null;
  const r = object(v, ['id', 'kind', 'level', 'complete', 'position']);
  const kind = choice(r.kind, ['market', 'farm', 'mint', 'granary', 'large-market', 'fish-market', 'black-market', 'military-farm', 'forge', 'stable'], 'unsupported-facility');
  const level = uint(r.level, ['market', 'farm', 'forge', 'stable'].includes(kind) ? 3 : 1, 1), p = object(r.position, ['q', 'r']);
  return { id: id(r.id), kind, level, complete: bool(r.complete), position: { q: uint(p.q, 1_000_000, -1_000_000), r: uint(p.r, 1_000_000, -1_000_000) } };
}
function officer(v: unknown): Officer {
  const r = object(v, ['id', 'forceId', 'cityId', 'role', 'officeId', 'politics', 'charm', 'incomeSkills']);
  if (r.role !== 'ordinary-officer' || r.officeId === null || r.officeId === 80) fail('unsupported-payroll-identity');
  const officeId = uint(r.officeId, 79); if (!CATALOGS.offices.offices.some(o => o.officeId === officeId)) fail('unsupported-payroll-identity');
  const incomeSkills = list(r.incomeSkills, 4).map(v => choice(v, SKILLS, 'unsupported-income-skill'));
  if (new Set(incomeSkills).size !== incomeSkills.length) fail('duplicate-skill');
  return { id: id(r.id), forceId: id(r.forceId), cityId: id(r.cityId), role: 'ordinary-officer', officeId, politics: uint(r.politics, 100), charm: uint(r.charm, 100), incomeSkills };
}
function scenario(v: unknown): Scenario {
  const r = object(v, ['schemaVersion', 'profile', 'date', 'turn', 'initialDateAlreadySettled', 'advanceLimit', 'activeForceId', 'difficulty', 'controller', 'city', 'baseProduction', 'facilities', 'completeResidentRoster', 'officers', 'prisonerCount', 'hasAdministrativeReform', 'monthlyHarvestInputs', 'rng', 'policies', 'catalogs']);
  if (r.schemaVersion !== 1 || r.profile !== PROFILE) fail('unsupported-schema-profile');
  if (r.initialDateAlreadySettled !== true) fail('unsettled-initial-date');
  const initialDate = date(r.date), advanceLimit = uint(r.advanceLimit, 360, 1), turn = uint(r.turn, Number.MAX_SAFE_INTEGER - advanceLimit);
  // Entire requested calendar horizon is checked before any income kernel or history replay.
  let end = initialDate; const months: { year: number; month: number }[] = [];
  for (let i = 0; i < advanceLimit; i++) { end = nextDate(end); if (end.day === 1) months.push({ year: end.year, month: end.month }); }
  const parsedCity = city(r.city), activeForceId = id(r.activeForceId);
  if (parsedCity.ownerForceId !== activeForceId) fail('owner-mismatch');
  const difficulty = choice(r.difficulty, ['normal', 'super'], 'unsupported-difficulty'), controller = choice(r.controller, ['player', 'ai'], 'unsupported-controller');
  if (r.prisonerCount !== 0) fail('unsupported-prisoners');
  if (r.completeResidentRoster !== true) fail('incomplete-payroll-roster');
  const officers = list(r.officers, 80).map(officer);
  if (new Set(officers.map(o => o.id)).size !== officers.length) fail('duplicate-officer');
  if (new Set(officers.map(o => o.officeId)).size !== officers.length) fail('duplicate-office');
  if (officers.some(o => o.forceId !== activeForceId || o.cityId !== parsedCity.id)) fail('payer-roster-mismatch');
  if (parsedCity.governorOfficerId !== null && !officers.some(o => o.id === parsedCity.governorOfficerId)) fail('unknown-governor');
  const base = object(r.baseProduction, ['baseMoneyWord', 'baseFoodWord']);
  const baseProduction = { baseMoneyWord: uint(base.baseMoneyWord, 65535), baseFoodWord: uint(base.baseFoodWord, 65535) };
  const facilities = list(r.facilities, 30).map(facility); if (facilities.length !== 30) fail('invalid-facility-slots');
  const occupied = facilities.filter((f): f is Facility => f !== null);
  if (new Set(occupied.map(f => f.id)).size !== occupied.length) fail('duplicate-facility-id');
  if (new Set(occupied.map(f => `${f.position.q},${f.position.r}`)).size !== occupied.length) fail('duplicate-facility-position');
  const monthlyHarvestInputs = list(r.monthlyHarvestInputs, 120).map(v => { const h = object(v, ['year', 'month', 'postMonthlyHarvest']); return { year: uint(h.year, 9999, 1), month: uint(h.month, 12, 1), postMonthlyHarvest: bool(h.postMonthlyHarvest) }; });
  if (monthlyHarvestInputs.length !== months.length || months.some((m, i) => m.year !== monthlyHarvestInputs[i]!.year || m.month !== monthlyHarvestInputs[i]!.month)) fail('incomplete-harvest-horizon');
  const rng = object(r.rng, ['kind', 'draws', 'cursor']);
  if (rng.kind !== 'bounded-tape-v1' || rng.cursor !== 0) fail('invalid-rng');
  const draws = list(rng.draws, 720).map((v): Draw => { const d = object(v, ['bound', 'value']); if (d.bound !== 100 && d.bound !== 3) fail('invalid-rng-bound'); return { bound: d.bound, value: uint(d.value, d.bound - 1) }; });
  if (!same(r.policies, POLICIES)) fail('policy-mismatch');
  if (!same(r.catalogs, CATALOGS)) fail('catalog-mismatch');
  return { schemaVersion: 1, profile: PROFILE, date: initialDate, turn, initialDateAlreadySettled: true, advanceLimit, activeForceId, difficulty, controller, city: parsedCity, baseProduction,
    facilities, completeResidentRoster: true, officers, prisonerCount: 0, hasAdministrativeReform: bool(r.hasAdministrativeReform), monthlyHarvestInputs,
    rng: { kind: 'bounded-tape-v1', draws, cursor: 0 }, policies: clone(POLICIES), catalogs: clone(CATALOGS) };
}
function envelope(v: unknown): Envelope {
  const r = object(v, ['id', 'expectedRevision', 'command']), c = object(r.command, ['type']);
  if (c.type !== 'AdvanceFinanceTurn') fail('unsupported-command');
  return { id: id(r.id), expectedRevision: uint(r.expectedRevision, 360), command: { type: 'AdvanceFinanceTurn' } };
}
function initialState(s: Scenario): State {
  const snapshot: Snapshot = { schemaVersion: 1, profile: PROFILE, revision: 0, advancedCount: 0, date: clone(s.date), turn: s.turn, city: clone(s.city), officers: clone(s.officers), harvestCurrent: null, rngCursor: 0, lastSettledDate: clone(s.date) };
  return { tag: TAG, schemaVersion: 1, profile: PROFILE, scope: 'independent-fixed-owned-city', policies: clone(POLICIES), catalogs: clone(CATALOGS), policyDigest: POLICY_DIGEST, catalogDigests: clone(CATALOG_DIGESTS),
    genesis: { scenario: s, snapshot: clone(snapshot) }, snapshot, acceptedCommands: [] };
}
function adjacent(f: Facility, kind: 'mint' | 'granary', s: Scenario): boolean { return s.facilities.some(other => { if (other === null || !other.complete || other.kind !== kind) return false; const dq = f.position.q - other.position.q, dr = f.position.r - other.position.r; return Math.max(Math.abs(dq), Math.abs(dr), Math.abs(dq + dr)) === 1; }); }
function typeWord(f: Facility): number { const row = CATALOGS.facilities.rows.find(r => r.kind === f.kind && r.level === f.level); if (!row) fail('unsupported-facility'); return row.typeWord; }
function moneyInput(s: Scenario, security: number): CityMoneyIncomeProjectionInput {
  const slots: CityMoneyIncomeSlot[] = s.facilities.map(f => f === null ? null : { facilityTypeWord: typeWord(f), constructionWord: f.complete ? 1 : 0,
    ...(f.kind === 'market' && (f.complete || f.level > 1) ? { adjacentMint: adjacent(f, 'mint', s) } : {}) });
  return { profile: 'city-money-income-stable-resolved-i32-safe-v1', baseMoneyWord: s.baseProduction.baseMoneyWord, slots,
    resolvedTypeRows: { 31: { valid: true, moneyYieldWord: 100 }, 50: { valid: true, moneyYieldWord: 120 }, 51: { valid: true, moneyYieldWord: 150 }, 46: { valid: true, moneyYieldWord: 300 }, 47: { valid: true, moneyYieldWord: 200 }, 48: { valid: true, moneyYieldWord: 80 } },
    difficultyWord: s.difficulty === 'normal' ? 1 : 2, ...(s.difficulty === 'super' ? { cityPlayerPredicate: s.controller === 'player' } : {}), securityByte: security };
}
function foodInput(s: Scenario, security: number): CityFoodIncomeProjectionInput {
  const slots: CityFoodIncomeSlot[] = s.facilities.map(f => f === null ? null : { facilityTypeWord: typeWord(f), constructionWord: f.complete ? 1 : 0,
    ...(f.kind === 'farm' && (f.complete || f.level > 1) ? { adjacentGranary: adjacent(f, 'granary', s) } : {}) });
  return { profile: 'city-food-income-stable-resolved-non-easy-u32-v1', baseFoodWord: s.baseProduction.baseFoodWord, slots,
    resolvedTypeRows: { 32: { valid: true, foodYieldWord: 1500 }, 52: { valid: true, foodYieldWord: 1800 }, 53: { valid: true, foodYieldWord: 2250 }, 49: { valid: true, foodYieldWord: 1500 } },
    ...(s.facilities.some(f => f !== null && f.kind === 'military-farm' && f.complete) ? { cityTroopsWord: s.city.troops } : {}),
    difficultyWord: s.difficulty === 'normal' ? 1 : 2, ...(s.difficulty === 'super' ? { cityPlayerPredicate: s.controller === 'player' } : {}), securityByte: security };
}
function called(api: string, input: { profile: string }, result: unknown): KernelCall { return { status: 'called', api, profile: input.profile, adapterObservationKind: 'derived-adapter-observations', input, result }; }
function notDue(reason: string): KernelCall { return { status: 'not-due', reason }; }
function positiveRequest(n: number): number { if (!Number.isSafeInteger(n) || n < 0 || Object.is(n, -0)) fail('unsupported-kernel-return'); return n; }
function credit(resource: Write['resource'], reason: Write['reason'], before: number, cap: number, requested: number): Write {
  positiveRequest(requested); const accepted = Math.min(requested, cap - before);
  if (!Number.isSafeInteger(accepted) || accepted < 0) fail('invalid-resource-boundary');
  return { resource, reason, before, requested, accepted, actualDelta: accepted, after: before + accepted, cap, discarded: requested - accepted, writerPolicyId: POLICIES.credit.id };
}
function resolve(s: Scenario, before: Snapshot, command: Envelope): { snapshot: Snapshot; receipt: Receipt } {
  if (before.advancedCount >= s.advanceLimit) fail('advance-limit');
  if (before.turn >= Number.MAX_SAFE_INTEGER) fail('turn-overflow');
  const after = clone(before), newDate = nextDate(before.date), monthly = newDate.day === 1, quarterly = monthly && [1, 4, 7, 10].includes(newDate.month);
  const ordered = [...before.officers].sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  const effects = Object.fromEntries(SKILLS.map(skill => { const holderIds = ordered.filter(o => o.incomeSkills.includes(skill)).map(o => o.id); return [skill, { active: holderIds.length > 0, holderIds }]; })) as Receipt['incomeEffects'];
  const payroll = ordered.map((o): SalaryItem => { const row = CATALOGS.offices.offices.find(r => r.officeId === o.officeId); if (!row) fail('unsupported-payroll-identity'); return { officerId: o.id, officeId: o.officeId, officeName: row.name, catalogSalary: row.monthlySalary }; });
  const salarySum = payroll.reduce((sum, p) => sum + p.catalogSalary, 0);
  const governor = ordered.find(o => o.id === before.city.governorOfficerId) ?? null;
  const harvest = monthly ? s.monthlyHarvestInputs.find(h => h.year === newDate.year && h.month === newDate.month) : null;
  if (monthly && !harvest) fail('missing-harvest-input');
  const settlementKey = `${s.city.id}:${newDate.year}-${String(newDate.month).padStart(2, '0')}-${String(newDate.day).padStart(2, '0')}`;
  const receipt: Receipt = {
    schemaVersion: 1, profile: PROFILE, commandId: command.id, revisionBefore: before.revision, revisionAfter: before.revision + 1, dateBefore: clone(before.date), dateAfter: clone(newDate), turnBefore: before.turn, turnAfter: before.turn + 1,
    settlementKey, duplicate: false, policies: clone(POLICIES), policyDigest: POLICY_DIGEST, catalogDigests: clone(CATALOG_DIGESTS), sourceBoundary: clone(BOUNDARY),
    ownerSnapshot: { activeForceId: s.activeForceId, ownerForceId: before.city.ownerForceId }, payerCityId: before.city.id, payrollOfficerIds: payroll.map(p => p.officerId),
    incomeEffects: effects, harvestInput: harvest ? clone(harvest) : { status: 'not-due' }, securityBeforeIncome: before.city.security,
    moneyKernel: notDue('nonmonthly-without-taxation'), foodKernel: notDue(monthly ? 'nonquarter-without-levy' : 'not-month-start'), monthlyFoodKernel: notDue(monthly ? 'nonquarter-without-levy' : 'not-month-start'), writes: [],
    security: { status: 'not-due', governorId: before.city.governorOfficerId, charm: null, adminRoll: null, lossRoll: null, requestedLoss: 0, actualLoss: 0, before: before.city.security, after: before.city.security },
    salary: { status: 'not-due', items: payroll, sum: salarySum, availableBeforeSalary: null, paid: 0, shortfall: 0, payerPolicyId: POLICIES.payroll.id },
    specialty: [], rngBefore: before.rngCursor, rngAfter: before.rngCursor, drawsConsumed: [], events: [] };
  function addCredit(resource: 'gold' | 'food', reason: Write['reason'], amount: number): Write {
    const row = credit(resource, reason, after.city[resource], resource === 'gold' ? after.city.goldCapacity : after.city.foodCapacity, amount);
    after.city[resource] = row.after; receipt.writes.push(row); return row;
  }
  function draw(bound: 100 | 3, purpose: 'administrative-reform' | 'seasonal-loss'): number {
    const d = s.rng.draws[after.rngCursor]; if (!d) fail('rng-exhausted'); if (d.bound !== bound) fail('rng-bound-mismatch');
    receipt.drawsConsumed.push({ index: after.rngCursor, bound, value: d.value, purpose }); after.rngCursor++; return d.value;
  }
  if (harvest) after.harvestCurrent = clone(harvest);
  if (monthly || effects.taxation.active) {
    const input = moneyInput(s, before.city.security), result = calculateCityMoneyIncomeProjection(input);
    if (!result.supported) fail(`money-kernel:${result.reason}`);
    const m = positiveRequest(result.returnedIncome), h = effects.taxation.active ? Math.floor(m / 2) : m;
    receipt.moneyKernel = called('calculateCityMoneyIncomeProjection', input, result); addCredit('gold', 'money-base', h);
    if (monthly && effects.wealthy.active) addCredit('gold', 'wealthy-bonus', Math.floor(h / 2));
  }
  if (monthly && (quarterly || effects.levy.active)) {
    const input = foodInput(s, before.city.security), result = calculateCityFoodIncomeProjection(input);
    if (!result.supported) fail(`food-kernel:${result.reason}`);
    const f = positiveRequest(result.returnedIncomeSigned);
    if (f !== result.returnedIncomeU32 || result.securityProductSigned !== result.securityProductRaw || result.securityProductU32 !== result.securityProductRaw) fail('unsupported-kernel-return');
    receipt.foodKernel = called('calculateCityFoodIncomeProjection', input, result);
    const monthlyInput: MonthlyCityFoodBaseArgumentInput = { profile: 'monthly-city-food-base-argument-u32-v1', entryFoodEdiU32: f, harvestPredicateEaxU32: harvest!.postMonthlyHarvest ? 1 : 0, lateLevyFlagDwordU32: effects.levy.active ? 1 : 0 };
    const monthlyResult = calculateMonthlyCityFoodBaseArgument(monthlyInput); if (!monthlyResult.supported) fail(`monthly-food-kernel:${monthlyResult.reason}`);
    const j = positiveRequest(monthlyResult.pushedArgumentSigned); if (j !== monthlyResult.pushedArgumentU32) fail('unsupported-kernel-return');
    receipt.monthlyFoodKernel = called('calculateMonthlyCityFoodBaseArgument', monthlyInput, monthlyResult); addCredit('food', 'food-base', j);
    if (quarterly && effects['rice-way'].active) addCredit('food', 'rice-way-bonus', Math.floor(j / 2));
  }
  if (quarterly) {
    const charm = governor?.charm ?? 0, adminRoll = s.hasAdministrativeReform ? draw(100, 'administrative-reform') : null;
    receipt.security.charm = charm; receipt.security.adminRoll = adminRoll;
    if (adminRoll !== null && adminRoll < 50) receipt.security.status = 'administrative-reform-skip';
    else {
      const roll = draw(3, 'seasonal-loss'), loss = Math.min(5, Math.floor(Math.max(1, 90 - charm) / 10) + roll), actual = Math.min(before.city.security, loss);
      after.city.security -= actual;
      receipt.security = { status: 'applied', governorId: governor?.id ?? null, charm, adminRoll, lossRoll: roll, requestedLoss: loss, actualLoss: actual, before: before.city.security, after: after.city.security };
      receipt.writes.push({ resource: 'security', reason: 'seasonal-security', before: before.city.security, requested: loss, accepted: actual, actualDelta: actual === 0 ? 0 : -actual, after: after.city.security, cap: 100, discarded: loss - actual, writerPolicyId: POLICIES.security.id });
    }
  }
  if (monthly) {
    const available = after.city.gold;
    if (salarySum > available) fail('unsupported-salary-shortfall', null, { required: salarySum, available, shortfall: salarySum - available });
    after.city.gold -= salarySum;
    receipt.salary = { status: 'paid', items: payroll, sum: salarySum, availableBeforeSalary: available, paid: salarySum, shortfall: 0, payerPolicyId: POLICIES.payroll.id };
    receipt.writes.push({ resource: 'gold', reason: 'salary', before: available, requested: salarySum, accepted: salarySum, actualDelta: salarySum === 0 ? 0 : -salarySum, after: after.city.gold, cap: after.city.goldCapacity, discarded: 0, writerPolicyId: POLICIES.debit.id });
  }
  for (const equipmentType of EQUIPMENT) {
    const item: SpecialtyReceipt = { equipmentType, eligibility: !monthly ? 'not-due' : !governor ? 'no-governor' : 'not-specialty', count: null, arithmeticProfile: 'comment-f32-rne-trunc-v1', kernelQuantityRequest: null, kernel: notDue(!monthly ? 'not-month-start' : 'no-governor'), write: null };
    if (monthly && governor) {
      const specialty = before.city.specialtyEquipmentTypes.includes(equipmentType);
      const common = { profile: 'monthly-specialty-production-observed-v1' as const, arithmeticProfile: 'comment-f32-rne-trunc-v1' as const, equipmentType, specialtyEaxU32: specialty ? 1 : 0 };
      let input: MonthlySpecialtyProductionInput = common;
      if (specialty) {
        const kind = equipmentType === 4 ? 'stable' : 'forge';
        const slots: MonthlySpecialtyProductionSlot[] = s.facilities.map((f): MonthlySpecialtyProductionSlot => f === null ? { validityEaxU32: 0 } : { validityEaxU32: 1, correspondingCompletedEaxU32: f.kind === kind && f.complete ? 1 : 0 });
        const count = s.facilities.filter(f => f !== null && f.kind === kind && f.complete).length;
        const fixedSlots = slots as unknown as MonthlySpecialtyProductionSlots;
        input = count > 0 ? { ...common, slots: fixedSlots, governorPoliticsEaxU32: governor.politics } : { ...common, slots: fixedSlots };
      }
      const result = calculateMonthlySpecialtyProduction(input); if (!result.supported) fail(`specialty-kernel:${result.reason}`);
      item.eligibility = result.path; item.count = result.completedFacilityCount; item.kernel = called('calculateMonthlySpecialtyProduction', input, result);
      if (result.quantityRequest) {
        const requested = positiveRequest(result.quantityRequest.quantitySigned32); if (requested !== result.quantityRequest.quantityU32 || requested > 1500) fail('unsupported-kernel-return');
        const stock = after.city.inventory[equipmentType], row = credit(`equipment-${equipmentType}`, 'specialty', stock.quantity, stock.capacity, requested);
        stock.quantity = row.after; receipt.writes.push(row); item.kernelQuantityRequest = requested; item.write = row;
      }
    }
    receipt.specialty.push(item);
  }
  after.date = newDate; after.lastSettledDate = clone(newDate); after.turn++; after.revision++; after.advancedCount++;
  receipt.rngAfter = after.rngCursor;
  receipt.events.push({ type: 'finance-turn-settled', settlementKey });
  if (monthly) receipt.events.push({ type: 'finance-month-settled', settlementKey });
  if (quarterly) receipt.events.push({ type: 'finance-quarter-settled', settlementKey });
  return { snapshot: after, receipt };
}
function append(s: State, command: Envelope): { state: State; receipt: Receipt; duplicate: boolean } {
  const old = s.acceptedCommands.find(entry => entry.envelope.id === command.id);
  if (old) { if (!same(old.envelope, command)) fail('command-id-conflict'); return { state: s, receipt: old.receipt, duplicate: true }; }
  if (command.expectedRevision !== s.snapshot.revision) fail('revision-conflict');
  if (s.acceptedCommands.length >= 360) fail('history-limit');
  const next = resolve(s.genesis.scenario, s.snapshot, command);
  return { state: { ...s, snapshot: next.snapshot, acceptedCommands: [...s.acceptedCommands, { envelope: command, receipt: next.receipt }] }, receipt: next.receipt, duplicate: false };
}
function reconstruct(v: unknown): State {
  const r = object(v, ['tag', 'schemaVersion', 'profile', 'scope', 'policies', 'catalogs', 'policyDigest', 'catalogDigests', 'genesis', 'snapshot', 'acceptedCommands']);
  if (r.tag !== TAG || r.schemaVersion !== 1 || r.profile !== PROFILE || r.scope !== 'independent-fixed-owned-city') fail('unsupported-state-schema');
  if (!same(r.policies, POLICIES) || r.policyDigest !== POLICY_DIGEST) fail('policy-mismatch');
  if (!same(r.catalogs, CATALOGS) || !same(r.catalogDigests, CATALOG_DIGESTS)) fail('catalog-mismatch');
  const genesis = object(r.genesis, ['scenario', 'snapshot']);
  let s = initialState(scenario(genesis.scenario)); budget(s);
  if (!same(genesis.snapshot, s.snapshot)) fail('genesis-snapshot-mismatch');
  const entries = list(r.acceptedCommands, s.genesis.scenario.advanceLimit);
  for (let i = 0; i < entries.length; i++) {
    try {
      const entry = object(entries[i], ['envelope', 'receipt']), next = append(s, envelope(entry.envelope));
      if (next.duplicate) fail('duplicate-accepted-entry');
      // Keep persistence reconstruction subject to the complete execute-output budget.
      const execution: CommandResult = { ok: true, committed: true, duplicate: false, state: next.state, receipt: next.receipt };
      budget(execution);
      if (!same(entry.receipt, next.receipt)) fail('receipt-mismatch');
      s = next.state;
    } catch (e) { const f = failure(e); fail(f.reason, i, f.proposal); }
  }
  if (!same(r.snapshot, s.snapshot)) fail('snapshot-mismatch');
  budget(s); return s;
}
/** Creation never settles the initial date; every future month primitive must already be present. */
export function createCityFinanceState(input: unknown): CityFinanceStateResultV1 {
  try { const state = initialState(scenario(detach(input))); budget(state); return freeze({ ok: true, state } as StateResult); } catch (e) { return freeze(failure(e)); }
}
function commandResult(input: unknown, rawCommand: unknown): CommandResult {
  // Both calls use the same reconstruction, staging and full execute-output budget.
  const s = reconstruct(detach(input)), command = envelope(detach(rawCommand)), next = append(s, command);
  const result: CommandResult = { ok: true, committed: !next.duplicate, duplicate: next.duplicate, state: next.state, receipt: next.receipt };
  budget(result); return result;
}
/** Pure detached preview, including affordability, RNG and output-capacity refusal. */
export function previewCityFinanceCommand(input: unknown, rawCommand: unknown): CityFinancePreviewResultV1 {
  try {
    const result = commandResult(input, rawCommand);
    if (!result.ok) return freeze(result);
    return freeze({ ok: true, committed: false, duplicate: result.duplicate, receipt: result.receipt, projectedSnapshot: result.state.snapshot } as PreviewResult);
  } catch (e) { return freeze(failure(e)); }
}
/** Functional update: caller-owned state is never mutated, on success or failure. */
export function executeCityFinanceCommand(input: unknown, rawCommand: unknown): CityFinanceCommandResultV1 {
  try { return freeze(commandResult(input, rawCommand)); } catch (e) { return freeze(failure(e)); }
}
export function saveCityFinanceState(input: unknown): CityFinanceSaveResultV1 {
  try { const state = reconstruct(detach(input)); budget(state); return freeze({ ok: true, json: canonical(state) } as SaveResult); } catch (e) { return freeze(failure(e)); }
}
export function loadCityFinanceState(json: unknown): CityFinanceStateResultV1 {
  try { const state = reconstruct(parseJson(json)); return freeze({ ok: true, state } as StateResult); } catch (e) { return freeze(failure(e)); }
}
/** Failure attempts and duplicates can be checked, but never drive the reducer. */
export function replayCityFinanceCommands(input: unknown): CityFinanceReplayResultV1 {
  try {
    const r = object(detach(input), ['tag', 'scenario', 'attempts', 'expectedFinalSnapshot']);
    if (r.tag !== TRACE_TAG) fail('unsupported-trace-schema');
    let state = initialState(scenario(r.scenario)); budget(state);
    const attempts = list(r.attempts, 1080), outcomes: ExpectedOutcome[] = [];
    for (let i = 0; i < attempts.length; i++) {
      try {
        const a = object(attempts[i], ['envelope', 'expectedOutcome']);
        let outcome: ExpectedOutcome, candidate = state;
        try {
          const next = append(state, envelope(a.envelope));
          const execution: CommandResult = { ok: true, committed: !next.duplicate, duplicate: next.duplicate, state: next.state, receipt: next.receipt };
          budget(execution); candidate = next.state; outcome = { ok: true, duplicate: next.duplicate, receipt: next.receipt };
        } catch (e) { outcome = { ok: false, reason: failure(e).reason }; }
        if (a.expectedOutcome !== null && !same(a.expectedOutcome, outcome)) fail('trace-outcome-mismatch');
        state = candidate; outcomes.push(outcome);
      } catch (e) { const f = failure(e); fail(f.reason, i, f.proposal); }
    }
    if (r.expectedFinalSnapshot !== null && !same(r.expectedFinalSnapshot, state.snapshot)) fail('trace-snapshot-mismatch');
    const result: ReplayResult = { ok: true, state, outcomes }; budget(result); return freeze(result);
  } catch (e) { return freeze(failure(e)); }
}
