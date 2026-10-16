/** Detached formation calculations. No runtime unit, personnel change or inventory debit. */
type Frozen<T> = T extends object ? { readonly [K in keyof T]: Frozen<T[K]> } : T;
type AttrKey = 'leadership' | 'war' | 'intelligence' | 'politics' | 'charisma';
type AptitudeKey = 'spear' | 'halberd' | 'crossbow' | 'cavalry' | 'siege' | 'navy';
type Attr = Record<AttrKey, number>;
type Aptitude = Record<AptitudeKey, 0 | 1 | 2 | 3>;
type Edge = { from: string; to: string };
type Relations = { spousePairs: [string, string][]; swornPairs: [string, string][]; bloodPairs: [string, string][]; likes: Edge[]; hates: Edge[] };
type Member = { id: string; basic: Attr; actual: Attr; aptitude: Aptitude; commandClassId: string };
type Context = { members: Member[]; attributeBasis: 'basic' | 'actual'; relations: Relations; unitType: 'battle' | 'transport'; status: 'normal' | 'confused' | 'false-report'; panelEquipmentId: number; techniqueIds: number[] };
type EquipmentRow = { id: number; name: string; baseAttack: number; baseDefense: number; baseMobility: number; aptitudeKey: AptitudeKey | null };
type CommandRow = { classId: string; capacity: number };
type CargoRow = { equipmentId: number; kind: 'implicit' | 'quantity' | 'piece'; cap: number };
type Profile = {
  id: string; version: 1; equipmentTable: { id: string; rows: EquipmentRow[] }; commandCapacityTable: { id: string; rows: CommandRow[] };
  relationPolicy: { id: string; loveDirection: 'deputy-to-main' | 'either-direction'; declaredFamilyPairs: 'undirected'; priority: ['spouse', 'sworn', 'love', 'blood', 'ordinary'] };
  panelPrecision: { id: string; mode: 'rational-exact' | 'stage-grid-trunc'; gridDenominator: number | null };
  capacityPolicy: { id: string; pieceAndQuantityCaps: CargoRow[]; cargoAggregation: 'independent-per-equipment' };
  evidenceLabel: 'documented-reference-plus-named-policies' | 'synthetic-fixture';
};
type CapabilityRequest = { schemaVersion: 1; scope: 'detached-unit-capabilities'; context: Context; profile: Profile };
type FormationRequest = { schemaVersion: 1; scope: 'detached-unit-formation'; unitId: string; context: Context; loadout: { landEquipmentId: number; navalEquipmentId: number }; requested: { troops: number; gold: number; food: number; cargo: number[] }; available: { troops: number; gold: number; food: number; equipment: number[] }; profile: Profile };
type Rational = { numerator: string; denominator: string };
type DeputyTerm = { positiveDiff: number; bonus: number; candidate: number };
type Deputy = { deputyId: string; relation: 'spouse' | 'sworn' | 'love' | 'blood' | 'ordinary'; divisor: 1 | 2 | 3 | 4; leadership: DeputyTerm; war: DeputyTerm };
type Stage = { operation: 'multiply' | 'add'; operand: Rational; result: Rational };
type PanelKeys = 'attack' | 'defense' | 'construction';
type Calculation = {
  selectedAttributes: { memberId: string; values: Attr }[];
  relationships: { hateOverride: boolean; hateEdges: Edge[]; deputies: Deputy[] };
  attributes: Attr; attributeSources: Record<AttrKey, string[]>; aptitudes: Aptitude; aptitudeSources: Record<AptitudeKey, string[]>;
  equipmentRow: EquipmentRow; elite: { techniqueId: 3 | 7 | 11 | 15 | null; applied: boolean; baseIncrement: 0 | 10 };
  aptitude: { rank: 0 | 1 | 2 | 3 | null; multiplier: Rational };
  multipliers: { attackType: Rational; defenseConstructionType: Rational; status: Rational };
  stages: Record<PanelKeys, Stage[]>; raw: Record<PanelKeys, Rational>; minimumApplied: Record<PanelKeys, boolean>; panels: Record<PanelKeys, number>;
};
type Evidence = { stockOriginalVerified: false; original43Closed: false; nativeTransactions: false; table: 'documented-crosschecked' | 'caller-supplied-fixture'; relations: 'mixed-pc-opcode-and-documented-reference-with-named-direction-policy'; finalConversion: 'toward-zero'; intermediatePrecisionProfile: string };
type Limits = { troops: number; gold: number; food: number; cargo: number[] };
type Shortfall = { resource: 'troops' | 'gold' | 'food' | `equipment:${number}`; reason: 'below-minimum' | 'exceeds-capacity' | 'exceeds-equipment-limit'; requested: number; limit: number };
type Specification = {
  schemaVersion: 1; scope: 'detached-unit-specification'; unitId: string; type: 'battle' | 'transport'; status: Context['status'];
  members: { id: string; role: 'main' | 'deputy-1' | 'deputy-2' }[]; attributes: Attr; aptitudes: Aptitude; panels: Record<PanelKeys, number>;
  loadout: { landEquipmentId: number; navalEquipmentId: number; panelEquipmentId: number }; baseMobility: { land: number; naval: number };
  resources: { troops: number; gold: number; food: number }; cargo: number[]; requiredEquipment: number[]; capacity: Limits;
  profileId: string; profileFingerprint: string; evidence: { stockOriginalVerified: false; original43Closed: false; nativeTransactions: false };
};
type CapabilityReceipt = { schemaVersion: 1; kind: 'unit-capabilities'; request: CapabilityRequest; profileFingerprint: string; calculation: Calculation; evidence: Evidence; rngDraws: 0 };
type FormationReceipt = { schemaVersion: 1; kind: 'unit-formation'; request: FormationRequest; profileFingerprint: string; calculation: Calculation; capacityTrace: { commandRow: CommandRow | null; cargoRows: CargoRow[]; intrinsic: Limits; available: FormationRequest['available'] }; limits: Limits; requiredEquipment: number[]; shortfalls: Shortfall[]; canForm: boolean; unitspec: Specification | null; evidence: Evidence; sourceMutation: false; rngDraws: 0 };
export type UnitFormationProfile = Frozen<Profile>;
export type UnitCapabilityRequest = Frozen<CapabilityRequest>;
export type UnitFormationRequest = Frozen<FormationRequest>;
export type UnitCapabilityCalculation = Frozen<Calculation>;
export type UnitCapabilityReceipt = Frozen<CapabilityReceipt>;
export type UnitFormationReceipt = Frozen<FormationReceipt>;
export type UnitSpecification = Frozen<Specification>;
export type UnitFormationFailure = { readonly ok: false; readonly reason: 'invalid-input' | 'unsupported-profile' | 'unsupported-schema'; readonly receipt: null };
export type UnitCapabilityResult = Frozen<{ ok: true; receipt: CapabilityReceipt }> | UnitFormationFailure;
export type UnitFormationResult = Frozen<{ ok: true; canForm: boolean; receipt: FormationReceipt }> | UnitFormationFailure;
export type UnitFormationSaveResult = Frozen<{ ok: true; serialized: string } | { ok: false; reason: 'invalid-record' | 'record-mismatch' }>;
export type UnitFormationReplayResult = Frozen<{ ok: true; verified: true; result: UnitCapabilityResult | UnitFormationResult } | { ok: false; reason: 'invalid-record' | 'unsupported-schema' | 'record-mismatch' }>;
const ATTRS: AttrKey[] = ['leadership', 'war', 'intelligence', 'politics', 'charisma'];
const APTITUDES: AptitudeKey[] = ['spear', 'halberd', 'crossbow', 'cavalry', 'siege', 'navy'];
const EQUIPMENT_APTITUDES: (AptitudeKey | null)[] = [null, 'spear', 'halberd', 'crossbow', 'cavalry', 'siege', 'siege', 'siege', 'siege', 'navy', 'navy', 'navy'];
const MAX_BYTES = 1024 * 1024, MAX_ITEMS = 4096, MAX_QUANTITY = 4294967295;
const runtime = globalThis as { process?: { getBuiltinModule?: (id: string) => { types: { isProxy(value: unknown): boolean } } } };
const isProxy = typeof runtime.process?.getBuiltinModule === 'function' ? runtime.process.getBuiltinModule('node:util').types.isProxy : (() => false);
class Invalid extends Error { readonly reason: UnitFormationFailure['reason']; constructor(reason: UnitFormationFailure['reason']) { super(reason); this.reason = reason; } }
function fail(reason: UnitFormationFailure['reason'] = 'invalid-input'): never { throw new Invalid(reason); }
function freeze<T>(v: T): Frozen<T> { if (v !== null && typeof v === 'object') { for (const x of Object.values(v)) freeze(x); Object.freeze(v); } return v as Frozen<T>; }
function canonical(v: unknown): string { if (v === null || typeof v !== 'object') return JSON.stringify(v); if (Array.isArray(v)) return '[' + v.map(canonical).join(',') + ']'; const o = v as Record<string, unknown>; return '{' + Object.keys(o).sort().map(k => JSON.stringify(k) + ':' + canonical(o[k])).join(',') + '}'; }
function equal(a: unknown, b: unknown): boolean { return canonical(a) === canonical(b); }
function byteLength(s: string): number { let n = 0; for (const c of s) { const p = c.codePointAt(0)!; n += p < 128 ? 1 : p < 2048 ? 2 : p < 65536 ? 3 : 4; } return n; }
/** Reject host behavior before schema reads. Node proxies are rejected without invoking traps. */
function detach(value: unknown): unknown {
  let used = 0; const active = new Set<object>();
  const spend = (n: number): void => { used += n; if (used > MAX_BYTES) fail(); };
  function visit(v: unknown, depth: number): unknown {
    if (depth > 64) fail();
    if (v === null || typeof v === 'boolean' || typeof v === 'string') { if (typeof v === 'string' && v.length > MAX_BYTES) fail(); spend(byteLength(JSON.stringify(v))); return v; }
    if (typeof v === 'number') { if (!Number.isSafeInteger(v) || Object.is(v, -0)) fail(); spend(String(v).length); return v; }
    if (typeof v !== 'object' || isProxy(v) || active.has(v)) fail();
    const a = Array.isArray(v), proto = Object.getPrototypeOf(v);
    if (proto !== (a ? Array.prototype : Object.prototype) && !(proto === null && !a)) fail();
    active.add(v);
    try {
      const ds = Object.getOwnPropertyDescriptors(v), keys = Reflect.ownKeys(ds);
      if (keys.some(k => typeof k !== 'string' || !Object.hasOwn(ds[k]!, 'value') || (!ds[k]!.enumerable && !(a && k === 'length')))) fail();
      spend(2);
      if (a) { const n = ds.length!.value as number; if (n > MAX_ITEMS || keys.length !== n + 1) fail(); const out: unknown[] = []; for (let i = 0; i < n; i++) { const d = ds[String(i)]; if (!d) fail(); if (i) spend(1); out.push(visit(d.value, depth + 1)); } return out; }
      const out: Record<string, unknown> = {}; let i = 0;
      for (const k of keys as string[]) { spend(byteLength(JSON.stringify(k)) + 1 + (i++ ? 1 : 0)); Object.defineProperty(out, k, { value: visit(ds[k]!.value, depth + 1), enumerable: true, writable: true, configurable: true }); } return out;
    } finally { active.delete(v); }
  }
  return visit(value, 0);
}
function record(v: unknown, keys: readonly string[]): Record<string, unknown> { if (!v || typeof v !== 'object' || Array.isArray(v)) fail(); const o = v as Record<string, unknown>; if (Object.keys(o).length !== keys.length || keys.some(k => !Object.hasOwn(o, k))) fail(); return o; }
function uint(v: unknown, max = MAX_QUANTITY, min = 0): number { if (typeof v !== 'number' || !Number.isInteger(v) || Object.is(v, -0) || v < min || v > max) fail(); return v; }
function id(v: unknown): string { if (typeof v !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(v)) fail(); return v; }
function array(v: unknown, max = MAX_ITEMS): unknown[] { if (!Array.isArray(v) || v.length > max) fail(); return v; }
function oneOf<T extends string>(v: unknown, values: readonly T[]): T { if (!values.includes(v as T)) fail(); return v as T; }
function cmp(a: string, b: string): number { return a < b ? -1 : a > b ? 1 : 0; }
function cargoKind(n: number): CargoRow['kind'] { return n === 0 || n === 9 ? 'implicit' : n <= 4 ? 'quantity' : 'piece'; }

/** Documented equipment plus named, replaceable policies; not clean-stock certification. */
export const UNIT_FORMATION_REFERENCE_PROFILE: UnitFormationProfile = freeze<Profile>({
  "id": "o03-detached-reference-v1",
  "version": 1,
  "equipmentTable": {
    "id": "documented-equipment-12-v1",
    "rows": [
      {
        "id": 0,
        "name": "剑",
        "baseAttack": 60,
        "baseDefense": 60,
        "baseMobility": 20,
        "aptitudeKey": null
      },
      {
        "id": 1,
        "name": "枪",
        "baseAttack": 95,
        "baseDefense": 95,
        "baseMobility": 22,
        "aptitudeKey": "spear"
      },
      {
        "id": 2,
        "name": "戟",
        "baseAttack": 90,
        "baseDefense": 105,
        "baseMobility": 22,
        "aptitudeKey": "halberd"
      },
      {
        "id": 3,
        "name": "弩",
        "baseAttack": 85,
        "baseDefense": 90,
        "baseMobility": 22,
        "aptitudeKey": "crossbow"
      },
      {
        "id": 4,
        "name": "马",
        "baseAttack": 105,
        "baseDefense": 90,
        "baseMobility": 28,
        "aptitudeKey": "cavalry"
      },
      {
        "id": 5,
        "name": "冲车",
        "baseAttack": 90,
        "baseDefense": 85,
        "baseMobility": 18,
        "aptitudeKey": "siege"
      },
      {
        "id": 6,
        "name": "井栏",
        "baseAttack": 90,
        "baseDefense": 85,
        "baseMobility": 18,
        "aptitudeKey": "siege"
      },
      {
        "id": 7,
        "name": "投石",
        "baseAttack": 95,
        "baseDefense": 85,
        "baseMobility": 18,
        "aptitudeKey": "siege"
      },
      {
        "id": 8,
        "name": "木兽",
        "baseAttack": 100,
        "baseDefense": 85,
        "baseMobility": 18,
        "aptitudeKey": "siege"
      },
      {
        "id": 9,
        "name": "走舸",
        "baseAttack": 75,
        "baseDefense": 75,
        "baseMobility": 16,
        "aptitudeKey": "navy"
      },
      {
        "id": 10,
        "name": "楼船",
        "baseAttack": 90,
        "baseDefense": 85,
        "baseMobility": 20,
        "aptitudeKey": "navy"
      },
      {
        "id": 11,
        "name": "斗舰",
        "baseAttack": 100,
        "baseDefense": 95,
        "baseMobility": 20,
        "aptitudeKey": "navy"
      }
    ]
  },
  "commandCapacityTable": {
    "id": "supplied-command-classes-v1",
    "rows": [
      {
        "classId": "junior",
        "capacity": 5000
      },
      {
        "classId": "standard",
        "capacity": 10000
      },
      {
        "classId": "senior",
        "capacity": 15000
      }
    ]
  },
  "relationPolicy": {
    "id": "declared-pairs-deputy-like-v1",
    "loveDirection": "deputy-to-main",
    "declaredFamilyPairs": "undirected",
    "priority": [
      "spouse",
      "sworn",
      "love",
      "blood",
      "ordinary"
    ]
  },
  "panelPrecision": {
    "id": "exact-rational-panel-v1",
    "mode": "rational-exact",
    "gridDenominator": null
  },
  "capacityPolicy": {
    "id": "detached-piece-cargo-cap-100-v1",
    "pieceAndQuantityCaps": [
      {
        "equipmentId": 0,
        "kind": "implicit",
        "cap": 0
      },
      {
        "equipmentId": 1,
        "kind": "quantity",
        "cap": 100000
      },
      {
        "equipmentId": 2,
        "kind": "quantity",
        "cap": 100000
      },
      {
        "equipmentId": 3,
        "kind": "quantity",
        "cap": 100000
      },
      {
        "equipmentId": 4,
        "kind": "quantity",
        "cap": 100000
      },
      {
        "equipmentId": 5,
        "kind": "piece",
        "cap": 100
      },
      {
        "equipmentId": 6,
        "kind": "piece",
        "cap": 100
      },
      {
        "equipmentId": 7,
        "kind": "piece",
        "cap": 100
      },
      {
        "equipmentId": 8,
        "kind": "piece",
        "cap": 100
      },
      {
        "equipmentId": 9,
        "kind": "implicit",
        "cap": 0
      },
      {
        "equipmentId": 10,
        "kind": "piece",
        "cap": 100
      },
      {
        "equipmentId": 11,
        "kind": "piece",
        "cap": 100
      }
    ],
    "cargoAggregation": "independent-per-equipment"
  },
  "evidenceLabel": "documented-reference-plus-named-policies"
});
function validateProfile(v: unknown): Profile {
  const p = record(v, ['id', 'version', 'equipmentTable', 'commandCapacityTable', 'relationPolicy', 'panelPrecision', 'capacityPolicy', 'evidenceLabel']); id(p.id);
  if (p.version !== 1) fail('unsupported-profile');
  const table = record(p.equipmentTable, ['id', 'rows']); id(table.id); const rows = array(table.rows, 12), seen = new Set<number>(); if (rows.length !== 12) fail();
  for (const x of rows) { const r = record(x, ['id', 'name', 'baseAttack', 'baseDefense', 'baseMobility', 'aptitudeKey']), n = uint(r.id, 11); if (seen.has(n)) fail(); seen.add(n); if (typeof r.name !== 'string' || !r.name.length || r.aptitudeKey !== EQUIPMENT_APTITUDES[n]) fail(); for (const k of ['baseAttack', 'baseDefense', 'baseMobility']) uint(r[k], 255, 1); }
  const commands = record(p.commandCapacityTable, ['id', 'rows']); id(commands.id); const classes = new Set<string>(); if (!array(commands.rows).length) fail();
  for (const x of array(commands.rows)) { const r = record(x, ['classId', 'capacity']), key = id(r.classId); if (classes.has(key)) fail(); classes.add(key); uint(r.capacity, 65535); }
  const rel = record(p.relationPolicy, ['id', 'loveDirection', 'declaredFamilyPairs', 'priority']); id(rel.id);
  if (!['deputy-to-main', 'either-direction'].includes(rel.loveDirection as string) || rel.declaredFamilyPairs !== 'undirected' || !equal(rel.priority, ['spouse', 'sworn', 'love', 'blood', 'ordinary'])) fail('unsupported-profile');
  const precision = record(p.panelPrecision, ['id', 'mode', 'gridDenominator']); id(precision.id);
  if (precision.mode === 'rational-exact') { if (precision.gridDenominator !== null) fail('unsupported-profile'); }
  else if (precision.mode === 'stage-grid-trunc') { if (typeof precision.gridDenominator !== 'number' || !Number.isInteger(precision.gridDenominator) || precision.gridDenominator < 1 || precision.gridDenominator > 1000000) fail('unsupported-profile'); }
  else fail('unsupported-profile');
  const caps = record(p.capacityPolicy, ['id', 'pieceAndQuantityCaps', 'cargoAggregation']); id(caps.id); if (caps.cargoAggregation !== 'independent-per-equipment') fail('unsupported-profile');
  const cr = array(caps.pieceAndQuantityCaps, 12), used = new Set<number>(); if (cr.length !== 12) fail();
  for (const x of cr) { const r = record(x, ['equipmentId', 'kind', 'cap']), n = uint(r.equipmentId, 11); if (used.has(n) || r.kind !== cargoKind(n)) fail(); used.add(n); uint(r.cap); if (cargoKind(n) === 'implicit' && r.cap !== 0) fail(); }
  if (!['documented-reference-plus-named-policies', 'synthetic-fixture'].includes(p.evidenceLabel as string)) fail('unsupported-profile');
  if (p.id === UNIT_FORMATION_REFERENCE_PROFILE.id && !equal(p, UNIT_FORMATION_REFERENCE_PROFILE)) fail('unsupported-profile');
  if (p.evidenceLabel === 'documented-reference-plus-named-policies' && !equal({ ...p, id: UNIT_FORMATION_REFERENCE_PROFILE.id }, UNIT_FORMATION_REFERENCE_PROFILE)) fail('unsupported-profile');
  return p as unknown as Profile;
}
function validateContext(v: unknown, profile: Profile): Context {
  const c = record(v, ['members', 'attributeBasis', 'relations', 'unitType', 'status', 'panelEquipmentId', 'techniqueIds']);
  const members = array(c.members, 3), ids = new Set<string>(); if (!members.length) fail();
  for (const x of members) {
    const m = record(x, ['id', 'basic', 'actual', 'aptitude', 'commandClassId']), key = id(m.id); if (ids.has(key)) fail(); ids.add(key);
    for (const mode of ['basic', 'actual']) { const a = record(m[mode], ATTRS); for (const k of ATTRS) uint(a[k], 100, 1); }
    const apt = record(m.aptitude, APTITUDES); for (const k of APTITUDES) uint(apt[k], 3);
    const cls = id(m.commandClassId); if (!profile.commandCapacityTable.rows.some(r => r.classId === cls)) fail();
  }
  oneOf(c.attributeBasis, ['basic', 'actual']); oneOf(c.unitType, ['battle', 'transport']); oneOf(c.status, ['normal', 'confused', 'false-report']); uint(c.panelEquipmentId, 11);
  const techs = array(c.techniqueIds, 36).map(x => uint(x, 35)); if (new Set(techs).size !== techs.length) fail(); c.techniqueIds = techs.sort((a, b) => a - b);
  const r = record(c.relations, ['spousePairs', 'swornPairs', 'bloodPairs', 'likes', 'hates']);
  for (const k of ['spousePairs', 'swornPairs', 'bloodPairs']) {
    const seen = new Set<string>(), pairs = array(r[k], 3);
    for (const pair of pairs) { const a = array(pair, 2); if (a.length !== 2) fail(); const x = id(a[0]), y = id(a[1]); if (!ids.has(x) || !ids.has(y) || cmp(x, y) >= 0 || seen.has(canonical(a))) fail(); seen.add(canonical(a)); }
    (pairs as [string, string][]).sort((a, b) => cmp(a[0], b[0]) || cmp(a[1], b[1]));
  }
  for (const k of ['likes', 'hates']) {
    const edges = array(r[k], 6), seen = new Set<string>();
    for (const x of edges) { const e = record(x, ['from', 'to']), from = id(e.from), to = id(e.to); if (!ids.has(from) || !ids.has(to) || from === to || seen.has(canonical(e))) fail(); seen.add(canonical(e)); }
    (edges as Edge[]).sort((a, b) => cmp(a.from, b.from) || cmp(a.to, b.to));
  }
  return c as unknown as Context;
}
function inventory(v: unknown): number[] { const a = array(v, 12).map(x => uint(x)); if (a.length !== 12 || a[0] !== 0 || a[9] !== 0) fail(); return a; }
function validate(v: unknown, scope: CapabilityRequest['scope']): CapabilityRequest;
function validate(v: unknown, scope: FormationRequest['scope']): FormationRequest;
function validate(v: unknown, scope: CapabilityRequest['scope'] | FormationRequest['scope']): CapabilityRequest | FormationRequest {
  const fields = ['schemaVersion', 'scope', 'context', 'profile', ...(scope === 'detached-unit-formation' ? ['unitId', 'loadout', 'requested', 'available'] : [])];
  const r = record(v, fields); if (r.schemaVersion !== 1 || r.scope !== scope) fail('unsupported-schema');
  const profile = validateProfile(r.profile), context = validateContext(r.context, profile); r.profile = profile; r.context = context;
  if (scope === 'detached-unit-formation') {
    id(r.unitId); const loadout = record(r.loadout, ['landEquipmentId', 'navalEquipmentId']), land = uint(loadout.landEquipmentId, 8), naval = uint(loadout.navalEquipmentId, 11, 9);
    if (context.unitType === 'transport' && (land !== 0 || naval !== 9)) fail();
    if (context.panelEquipmentId !== land && context.panelEquipmentId !== naval) fail();
    const requested = record(r.requested, ['troops', 'gold', 'food', 'cargo']), available = record(r.available, ['troops', 'gold', 'food', 'equipment']);
    for (const k of ['troops', 'gold', 'food']) { uint(requested[k]); uint(available[k]); }
    requested.cargo = inventory(requested.cargo); available.equipment = inventory(available.equipment);
    if (context.unitType === 'battle' && (requested.cargo as number[]).some(x => x !== 0)) fail();
  }
  return r as unknown as CapabilityRequest | FormationRequest;
}
/** SHA-256 of canonical UTF-8 JSON; no dependency on a platform crypto registry. */
function fingerprint(profile: Profile): string {
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
type Fraction = readonly [bigint, bigint];
function fraction(n: bigint, d = 1n): Fraction { let a = n < 0n ? -n : n, b = d; while (b) { const r = a % b; a = b; b = r; } return [n / a, d / a]; }
function multiply(a: Fraction, b: Fraction): Fraction { return fraction(a[0] * b[0], a[1] * b[1]); }
function add(a: Fraction, b: Fraction): Fraction { return fraction(a[0] * b[1] + b[0] * a[1], a[1] * b[1]); }
function rational(a: Fraction): Rational { return { numerator: String(a[0]), denominator: String(a[1]) }; }
function calculate(context: Context, profile: Profile): Calculation {
  const selectedAttributes = context.members.map(m => ({ memberId: m.id, values: m[context.attributeBasis] })), main = selectedAttributes[0]!;
  const hateEdges = context.relations.hates, hateOverride = hateEdges.length > 0, deputies: Deputy[] = [];
  if (!hateOverride) for (const sub of selectedAttributes.slice(1)) {
    const pair = [main.memberId, sub.memberId].sort(), r = context.relations;
    const hasPair = (pairs: [string,string][]) => pairs.some(p => p[0] === pair[0] && p[1] === pair[1]);
    const love = r.likes.some(e => e.from === sub.memberId && e.to === main.memberId) || (profile.relationPolicy.loveDirection === 'either-direction' && r.likes.some(e => e.from === main.memberId && e.to === sub.memberId));
    const relation: Deputy['relation'] = hasPair(r.spousePairs) ? 'spouse' : hasPair(r.swornPairs) ? 'sworn' : love ? 'love' : hasPair(r.bloodPairs) ? 'blood' : 'ordinary';
    const divisor = relation === 'spouse' || relation === 'sworn' ? 1 : relation === 'love' ? 2 : relation === 'blood' ? 3 : 4;
    const term = (key: 'leadership' | 'war'): DeputyTerm => { const positiveDiff = Math.max(sub.values[key] - main.values[key], 0), bonus = Math.floor(positiveDiff / divisor); return { positiveDiff, bonus, candidate: main.values[key] + bonus }; };
    deputies.push({ deputyId: sub.memberId, relation, divisor, leadership: term('leadership'), war: term('war') });
  }
  const attributes = {} as Attr, attributeSources = {} as Record<AttrKey, string[]>;
  for (const k of ATTRS) {
    const candidates = hateOverride ? [{ id: main.memberId, value: main.values[k] }] : k === 'leadership' || k === 'war' ? [{ id: main.memberId, value: main.values[k] }, ...deputies.map(d => ({ id: d.deputyId, value: d[k].candidate }))] : selectedAttributes.map(m => ({ id: m.memberId, value: m.values[k] }));
    attributes[k] = Math.max(...candidates.map(c => c.value)); attributeSources[k] = candidates.filter(c => c.value === attributes[k]).map(c => c.id).sort();
  }
  const aptitudes = {} as Aptitude, aptitudeSources = {} as Record<AptitudeKey, string[]>;
  for (const k of APTITUDES) { aptitudes[k] = Math.max(...context.members.map(m => m.aptitude[k])) as 0 | 1 | 2 | 3; aptitudeSources[k] = context.members.filter(m => m.aptitude[k] === aptitudes[k]).map(m => m.id).sort(); }
  const equipmentRow = profile.equipmentTable.rows.find(r => r.id === context.panelEquipmentId)!;
  const techniqueId = ([null, 3, 7, 11, 15] as const)[equipmentRow.id] ?? null;
  const applied = techniqueId !== null && context.techniqueIds.includes(techniqueId), baseIncrement = applied ? 10 : 0;
  const rank = equipmentRow.id === 0 || (context.unitType === 'transport' && equipmentRow.id === 9) ? null : aptitudes[equipmentRow.aptitudeKey!];
  const q = rank === null ? fraction(3n,5n) : fraction(BigInt(7 + rank),10n), ta = context.unitType === 'battle' ? fraction(1n) : fraction(2n,5n), td = context.unitType === 'battle' ? fraction(1n) : fraction(1n,3n), m = context.status === 'confused' ? fraction(4n,5n) : fraction(1n);
  const stages: Calculation['stages'] = { attack: [], defense: [], construction: [] };
  const stage = (key: PanelKeys, start: Fraction, operation: Stage['operation'], operand: Fraction): Fraction => {
    let result = operation === 'multiply' ? multiply(start, operand) : add(start, operand);
    if (profile.panelPrecision.mode === 'stage-grid-trunc') { const grid = BigInt(profile.panelPrecision.gridDenominator!); result = fraction((result[0] * grid) / result[1], grid); }
    stages[key].push({ operation, operand: rational(operand), result: rational(result) }); return result;
  };
  const product = (key: PanelKeys, n: number, factors: Fraction[]): Fraction => factors.reduce((r, x) => stage(key, r, 'multiply', x), fraction(BigInt(n)));
  const attack = product('attack', attributes.war, [fraction(BigInt(equipmentRow.baseAttack + baseIncrement)), q, fraction(1n,100n), ta, m]);
  const defense = product('defense', attributes.leadership, [fraction(BigInt(equipmentRow.baseDefense + baseIncrement)), q, fraction(1n,100n), td, m]);
  let construction = stage('construction', fraction(BigInt(attributes.politics)), 'multiply', fraction(2n,3n));
  construction = stage('construction', construction, 'add', fraction(50n)); construction = stage('construction', construction, 'multiply', td); construction = stage('construction', construction, 'multiply', m);
  const values = { attack, defense, construction }, raw = {} as Calculation['raw'], minimumApplied = {} as Calculation['minimumApplied'], panels = {} as Calculation['panels'];
  for (const key of ['attack', 'defense', 'construction'] as const) { const v = values[key]; raw[key] = rational(v); minimumApplied[key] = v[0] < v[1]; panels[key] = Number((v[0] < v[1] ? v[1] : v[0]) / v[1]); }
  return { selectedAttributes, relationships: { hateOverride, hateEdges, deputies }, attributes, attributeSources, aptitudes, aptitudeSources, equipmentRow, elite: { techniqueId, applied, baseIncrement }, aptitude: { rank, multiplier: rational(q) }, multipliers: { attackType: rational(ta), defenseConstructionType: rational(td), status: rational(m) }, stages, raw, minimumApplied, panels };
}
function evidence(profile: Profile): Evidence {
  const rows = [...profile.equipmentTable.rows].sort((a,b) => a.id - b.id);
  return { stockOriginalVerified: false, original43Closed: false, nativeTransactions: false, table: equal(rows, UNIT_FORMATION_REFERENCE_PROFILE.equipmentTable.rows) ? 'documented-crosschecked' : 'caller-supplied-fixture', relations: 'mixed-pc-opcode-and-documented-reference-with-named-direction-policy', finalConversion: 'toward-zero', intermediatePrecisionProfile: profile.panelPrecision.id };
}
function failure(e: unknown): UnitFormationFailure { let reason: UnitFormationFailure['reason'] = 'invalid-input'; try { if (!isProxy(e) && e instanceof Invalid) reason = e.reason; } catch { /* Retain fixed rejection for hostile thrown objects. */ } return freeze({ ok: false, reason, receipt: null }); }
/** Full member facts and complete profile in; detached, immutable calculation receipt out. */
export function calculateUnitCapabilities(input: unknown): UnitCapabilityResult {
  try { const request = validate(detach(input), 'detached-unit-capabilities'); return freeze({ ok: true, receipt: { schemaVersion: 1, kind: 'unit-capabilities', request, profileFingerprint: fingerprint(request.profile), calculation: calculate(request.context, request.profile), evidence: evidence(request.profile), rngDraws: 0 } }); } catch (e) { return failure(e); }
}
/** Inventory feasibility only. Capacity is intrinsic; limits include this source's inventory. */
export function previewUnitFormation(input: unknown): UnitFormationResult {
  try {
    const request = validate(detach(input), 'detached-unit-formation'), { context, profile, loadout, requested, available } = request;
    const calculation = calculate(context, profile), hash = fingerprint(profile), transport = context.unitType === 'transport';
    const commandRow = transport ? null : profile.commandCapacityTable.rows.find(r => r.classId === context.members[0]!.commandClassId)!;
    const cargoRows = [...profile.capacityPolicy.pieceAndQuantityCaps].sort((a,b) => a.equipmentId - b.equipmentId);
    const intrinsic: Limits = { troops: transport ? 60000 : commandRow!.capacity, gold: transport ? 100000 : 10000, food: transport ? 500000 : 50000, cargo: cargoRows.map(r => transport ? r.cap : 0) };
    const requiredEquipment = Array<number>(12).fill(0), limits: Limits = { troops: Math.min(intrinsic.troops, available.troops), gold: Math.min(intrinsic.gold, available.gold), food: Math.min(intrinsic.food, available.food), cargo: intrinsic.cargo.map((v,i) => Math.min(v, available.equipment[i]!)) };
    if (transport) for (let i = 0; i < 12; i++) requiredEquipment[i] = requested.cargo[i]!;
    else {
      const land = loadout.landEquipmentId, naval = loadout.navalEquipmentId;
      if (land >= 1 && land <= 4) { requiredEquipment[land] = requested.troops; limits.troops = Math.min(limits.troops, available.equipment[land]!); }
      else if (land >= 5) requiredEquipment[land] = 1;
      if (naval >= 10) requiredEquipment[naval] = 1;
    }
    const shortfalls: Shortfall[] = [];
    if (requested.troops < 1) shortfalls.push({ resource: 'troops', reason: 'below-minimum', requested: requested.troops, limit: 1 });
    for (const key of ['troops', 'gold', 'food'] as const) if (requested[key] > limits[key]) shortfalls.push({ resource: key, reason: 'exceeds-capacity', requested: requested[key], limit: limits[key] });
    for (let i = 0; i < 12; i++) { const limit = transport ? limits.cargo[i]! : available.equipment[i]!; if (requiredEquipment[i]! > limit) shortfalls.push({ resource: `equipment:${i}`, reason: 'exceeds-equipment-limit', requested: requiredEquipment[i]!, limit }); }
    const canForm = shortfalls.length === 0;
    const unitspec: Specification | null = canForm ? {
      schemaVersion: 1, scope: 'detached-unit-specification', unitId: request.unitId, type: context.unitType, status: context.status,
      members: context.members.map((m,i) => ({ id: m.id, role: (['main', 'deputy-1', 'deputy-2'] as const)[i]! })), attributes: calculation.attributes, aptitudes: calculation.aptitudes, panels: calculation.panels,
      loadout: { ...loadout, panelEquipmentId: context.panelEquipmentId }, baseMobility: { land: profile.equipmentTable.rows.find(r => r.id === loadout.landEquipmentId)!.baseMobility, naval: profile.equipmentTable.rows.find(r => r.id === loadout.navalEquipmentId)!.baseMobility },
      resources: { troops: requested.troops, gold: requested.gold, food: requested.food }, cargo: requested.cargo, requiredEquipment, capacity: intrinsic, profileId: profile.id, profileFingerprint: hash, evidence: { stockOriginalVerified: false, original43Closed: false, nativeTransactions: false }
    } : null;
    return freeze({ ok: true, canForm, receipt: { schemaVersion: 1, kind: 'unit-formation', request, profileFingerprint: hash, calculation, capacityTrace: { commandRow, cargoRows, intrinsic, available }, limits, requiredEquipment, shortfalls, canForm, unitspec, evidence: evidence(profile), sourceMutation: false, rngDraws: 0 } });
  } catch (e) { return failure(e); }
}
function recalculate(request: unknown): UnitCapabilityResult | UnitFormationResult { if (!request || typeof request !== 'object' || Array.isArray(request)) fail(); return (request as Record<string, unknown>).scope === 'detached-unit-capabilities' ? calculateUnitCapabilities(request) : previewUnitFormation(request); }
/** Recomputes the request before accepting a complete result for serialization. */
export function saveUnitFormationReceipt(result: unknown): UnitFormationSaveResult {
  try {
    const supplied = detach(result); if (!supplied || typeof supplied !== 'object' || Array.isArray(supplied)) return freeze({ ok: false, reason: 'invalid-record' });
    const r = supplied as Record<string, unknown>; if (r.ok !== true || !r.receipt || typeof r.receipt !== 'object' || Array.isArray(r.receipt)) return freeze({ ok: false, reason: 'invalid-record' });
    const request = (r.receipt as Record<string, unknown>).request, fresh = recalculate(request);
    if (!fresh.ok || !equal(supplied, fresh)) return freeze({ ok: false, reason: 'record-mismatch' });
    const serialized = canonical({ schemaVersion: 1, kind: 'o03-calculation-record', request: fresh.receipt.request, result: fresh });
    if (byteLength(serialized) > MAX_BYTES) return freeze({ ok: false, reason: 'invalid-record' });
    return freeze({ ok: true, serialized });
  } catch { return freeze({ ok: false, reason: 'invalid-record' }); }
}
/** Duplicate property names are rejected before JSON.parse can discard a field. */
function parseRecord(s: string): unknown {
  let i = 0;
  const ws = () => { while (i < s.length && /[ \t\r\n]/.test(s[i]!)) i++; };
  function string(): string { const start = i++; while (i < s.length) { const c = s[i++]!; if (c === '"') return JSON.parse(s.slice(start,i)) as string; if (c === '\\') i++; } fail(); }
  function value(depth: number): void {
    ws(); if (depth > 64) fail(); const c = s[i];
    if (c === '{') { i++; ws(); const keys = new Set<string>(); if (s[i] === '}') { i++; return; } while (true) { ws(); if (s[i] !== '"') fail(); const k = string(); if (keys.has(k)) fail(); keys.add(k); ws(); if (s[i++] !== ':') fail(); value(depth + 1); ws(); const end = s[i++]; if (end === '}') return; if (end !== ',') fail(); } }
    if (c === '[') { i++; ws(); let n = 0; if (s[i] === ']') { i++; return; } while (true) { if (++n > MAX_ITEMS) fail(); value(depth + 1); ws(); const end = s[i++]; if (end === ']') return; if (end !== ',') fail(); } }
    if (c === '"') { string(); return; }
    const match = /^(?:true|false|null|-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?)/.exec(s.slice(i)); if (!match) fail(); i += match[0].length;
  }
  value(0); ws(); if (i !== s.length) fail(); return detach(JSON.parse(s));
}
/** Same-version recomputation of every derived field; never trusts a checksum or stored answer. */
export function replayUnitFormationReceipt(serialized: unknown): UnitFormationReplayResult {
  try {
    if (typeof serialized !== 'string' || serialized.length > MAX_BYTES || byteLength(serialized) > MAX_BYTES) return freeze({ ok: false, reason: 'invalid-record' });
    const decoded = parseRecord(serialized);
    if (!decoded || typeof decoded !== 'object' || Array.isArray(decoded)) return freeze({ ok: false, reason: 'invalid-record' });
    const r = decoded as Record<string, unknown>; if (r.schemaVersion !== 1 || r.kind !== 'o03-calculation-record') return freeze({ ok: false, reason: 'unsupported-schema' });
    record(r, ['schemaVersion', 'kind', 'request', 'result']); const fresh = recalculate(r.request);
    if (!fresh.ok || !equal(r.request, fresh.receipt.request) || !equal(r.result, fresh)) return freeze({ ok: false, reason: 'record-mismatch' });
    return freeze({ ok: true, verified: true, result: fresh });
  } catch { return freeze({ ok: false, reason: 'invalid-record' }); }
}
