/** Standalone synthetic ordinary decision policy. Never mutates personnel or game state. */
type Frozen<T> = T extends object ? {readonly [K in keyof T]: Frozen<T[K]>} : T;
function freeze<T>(v: T): Frozen<T> { if (v !== null && typeof v === 'object') { for (const x of Object.values(v)) freeze(x); Object.freeze(v); } return v as Frozen<T>; }
export type OrdinaryRecruitmentRejection = 'invalid-input' | 'unexpected-field' | 'unsupported-profile' | 'unsupported-scope' | 'out-of-domain' | 'inconsistent-snapshot' | 'unsupported-service-prohibition';
class Invalid extends Error { readonly reason: OrdinaryRecruitmentRejection; constructor(reason: OrdinaryRecruitmentRejection) { super(reason); this.reason = reason; } }
function fail(reason: OrdinaryRecruitmentRejection = 'invalid-input'): never { throw new Invalid(reason); }
/** Inspect descriptors before reading values; proxies are outside the plain-data contract. */
function detach(v: unknown, active = new Set<object>()): unknown {
  if (v === null || typeof v === 'string' || typeof v === 'boolean') return v;
  if (typeof v === 'number') return Number.isFinite(v) ? (v === 0 ? 0 : v) : fail();
  if (typeof v !== 'object' || active.has(v)) return fail();
  active.add(v);
  try {
    const a = Array.isArray(v), proto = Object.getPrototypeOf(v);
    if (proto !== (a ? Array.prototype : Object.prototype) && !(proto === null && !a)) fail();
    const ds = Object.getOwnPropertyDescriptors(v), keys = Reflect.ownKeys(ds);
    if (keys.some(k => typeof k !== 'string' || !('value' in ds[k]!) || (!ds[k]!.enumerable && !(a && k === 'length')))) fail();
    if (a) {
      const n = ds.length!.value as number;
      if (keys.length !== n + 1) fail();
      const out: unknown[] = [];
      for (let i = 0; i < n; i++) { const d = ds[String(i)]; if (!d) fail(); out.push(detach(d.value, active)); }
      return out;
    }
    const out: Record<string, unknown> = {};
    for (const k of keys as string[]) Object.defineProperty(out, k, {value: detach(ds[k]!.value, active), enumerable: true, writable: true, configurable: true});
    return out;
  } finally { active.delete(v); }
}
function record(v: unknown, fields: readonly string[]): Record<string, unknown> {
  if (!v || typeof v !== 'object' || Array.isArray(v)) fail();
  const r = v as Record<string, unknown>;
  if (Object.keys(r).some(k => !fields.includes(k))) fail('unexpected-field');
  if (fields.some(k => !Object.hasOwn(r, k))) fail();
  return r;
}
function uint(v: unknown, max = 65535): number { if (typeof v !== 'number' || !Number.isInteger(v) || v < 0 || v > max) fail('out-of-domain'); return v; }
function nullableId(v: unknown): number | null { return v === null ? null : uint(v); }
export type OrdinaryRecruitmentRelation = {readonly personId: number; readonly forceId: number | null};
export type OrdinaryRecruitmentInput = {
  readonly profile: 'ordinary-recruitment-provisional-v1'; readonly scope: 'ordinary-decision-only'; readonly dateKey: number;
  readonly target: {readonly id: number; readonly status: 'officer' | 'wild'; readonly forceId: number | null; readonly currentRulerId: number | null; readonly forceControlledCityCount: number; readonly loyalty: number; readonly giriInternal: number; readonly affinity: number; readonly spouse: OrdinaryRecruitmentRelation | null; readonly swornSiblingIds: readonly number[]; readonly swornSenior: OrdinaryRecruitmentRelation | null; readonly likesIds: readonly number[]; readonly dislikesIds: readonly number[]; readonly forbiddenLordId: number | null; readonly forbiddenMonths: number};
  readonly executor: {readonly id: number; readonly forceId: number; readonly charisma: number; readonly affinity: number};
  readonly ruler: {readonly id: number; readonly forceId: number; readonly affinity: number};
};
export const ORDINARY_RECRUITMENT_POLICY = freeze({
  profile: 'ordinary-recruitment-provisional-v1' as const, scope: 'ordinary-decision-only' as const,
  policyIds: {gates: 'empirical-nine-gates-internal-giri-v1', rate: 'documented-hiring-fallback-rational-v1', roll: 'fnv1a32-seven-u32le-mod100-v1'},
  evidence: {outerShape: 'source-backed-ordinary-mode-zero-strict-compare', gateOrder: 'empirical-high-not-native-body', gateInterpretation: 'new-policy-nonrequesting-spouse-internal-giri-raw-loyalty', rate: 'provisional-exact-rational-fallback-not-native-or-modern-SIRE', roll: 'new-synthetic-FNV-replacement-not-005BA4C0', stockOriginalVerified: false as const, originalExecutableExecuted: false as const, nativePersonnelMutation: false as const, original43Closed: false as const}
});
export type OrdinaryRecruitmentGate = 'G1' | 'G2' | 'G3' | 'G4' | 'G5' | 'G6' | 'G7' | 'G8' | 'G9';
export type OrdinaryRecruitmentRateDetails = {readonly effectiveLoyalty: number; readonly loyaltyRoomNumerator: number; readonly rulerTargetDistance: number; readonly charisma: number; readonly numerator: number; readonly denominator: 18000; readonly rate: number};
export type OrdinaryRecruitmentRollDetails = {readonly words: readonly [number, number, number, number, number, number, 0]; readonly hashU32: number; readonly roll: number};
type Common = {supported: true; profile: OrdinaryRecruitmentInput['profile']; scope: OrdinaryRecruitmentInput['scope']; policyIds: typeof ORDINARY_RECRUITMENT_POLICY.policyIds; observations: OrdinaryRecruitmentInput; gateTrace: {id: OrdinaryRecruitmentGate; matched: boolean}[]; evidence: typeof ORDINARY_RECRUITMENT_POLICY.evidence};
export type OrdinaryRecruitmentResult = Frozen<
  | {supported: false; reason: OrdinaryRecruitmentRejection}
  | (Common & {path: 'forced-success'; reason: OrdinaryRecruitmentGate; success: true; rateDetails: null; rollDetails: null})
  | (Common & {path: 'forced-failure'; reason: OrdinaryRecruitmentGate; success: false; rateDetails: null; rollDetails: null})
  | (Common & {path: 'continuous'; reason: 'roll-below-rate' | 'roll-not-below-rate'; success: boolean; rateDetails: OrdinaryRecruitmentRateDetails; rollDetails: OrdinaryRecruitmentRollDetails})
>;
function relation(v: unknown): OrdinaryRecruitmentRelation | null {
  if (v === null) return null;
  const r = record(v, ['personId', 'forceId']); return {personId: uint(r.personId), forceId: nullableId(r.forceId)};
}
function ids(v: unknown, max: number): number[] {
  if (!Array.isArray(v) || v.length > max) fail('out-of-domain');
  const a = v.map(x => uint(x)); if (new Set(a).size !== a.length) fail('inconsistent-snapshot'); return a.sort((a,b) => a-b);
}
function validate(input: unknown): OrdinaryRecruitmentInput {
  const r = record(input, ['profile','scope','dateKey','target','executor','ruler']);
  if (r.profile !== ORDINARY_RECRUITMENT_POLICY.profile) fail('unsupported-profile');
  if (r.scope !== ORDINARY_RECRUITMENT_POLICY.scope) fail('unsupported-scope');
  const t = record(r.target, ['id','status','forceId','currentRulerId','forceControlledCityCount','loyalty','giriInternal','affinity','spouse','swornSiblingIds','swornSenior','likesIds','dislikesIds','forbiddenLordId','forbiddenMonths']);
  const e = record(r.executor, ['id','forceId','charisma','affinity']), l = record(r.ruler, ['id','forceId','affinity']);
  if (t.status !== 'officer' && t.status !== 'wild') fail('out-of-domain');
  const q: OrdinaryRecruitmentInput = {profile: ORDINARY_RECRUITMENT_POLICY.profile, scope: ORDINARY_RECRUITMENT_POLICY.scope, dateKey: uint(r.dateKey,2147483647),
    target: {id: uint(t.id), status: t.status, forceId: nullableId(t.forceId), currentRulerId: nullableId(t.currentRulerId), forceControlledCityCount: uint(t.forceControlledCityCount,42), loyalty: uint(t.loyalty,255), giriInternal: uint(t.giriInternal,4), affinity: uint(t.affinity,149), spouse: relation(t.spouse), swornSiblingIds: ids(t.swornSiblingIds,2), swornSenior: relation(t.swornSenior), likesIds: ids(t.likesIds,5), dislikesIds: ids(t.dislikesIds,5), forbiddenLordId: nullableId(t.forbiddenLordId), forbiddenMonths: uint(t.forbiddenMonths,255)},
    executor: {id: uint(e.id), forceId: uint(e.forceId), charisma: uint(e.charisma,100), affinity: uint(e.affinity,149)}, ruler: {id: uint(l.id), forceId: uint(l.forceId), affinity: uint(l.affinity,149)}};
  const {target: a, executor: b, ruler: c} = q;
  const inconsistent = () => fail('inconsistent-snapshot');
  if (a.id === b.id || a.id === c.id || b.forceId !== c.forceId || (b.id === c.id && b.affinity !== c.affinity)) inconsistent();
  if (a.status === 'officer') { if (a.forceId === null || a.currentRulerId === null || a.forceId === b.forceId || [a.id,b.id,c.id].includes(a.currentRulerId)) inconsistent(); }
  else if (a.forceId !== null || a.currentRulerId !== null || a.forceControlledCityCount !== 0) inconsistent();
  if (a.spouse?.personId === a.id || [...a.swornSiblingIds,...a.likesIds,...a.dislikesIds].includes(a.id)) inconsistent();
  if (a.swornSiblingIds.length === 0 ? a.swornSenior !== null : a.swornSenior === null || ![a.id,...a.swornSiblingIds].includes(a.swornSenior.personId)) inconsistent();
  // Null is a known unaffiliated force, not missing evidence.
  const forces = new Map<number, number | null>();
  for (const [person, force] of [[a.id,a.forceId],[b.id,b.forceId],[c.id,c.forceId],...(a.currentRulerId === null ? [] : [[a.currentRulerId,a.forceId]]),...(a.spouse ? [[a.spouse.personId,a.spouse.forceId]] : []),...(a.swornSenior ? [[a.swornSenior.personId,a.swornSenior.forceId]] : [])] as [number,number|null][]) {
    if (forces.has(person) && forces.get(person) !== force) inconsistent(); forces.set(person,force);
  }
  if ((a.forbiddenMonths === 0) !== (a.forbiddenLordId === null)) inconsistent();
  if (a.forbiddenMonths > 0) fail('unsupported-service-prohibition');
  return q;
}
function distance(a: number, b: number): number { const d = Math.abs(a-b); return Math.min(d,150-d); }
/** All facts are validated before any gate. There is no commit or personnel effect. */
export function decideOrdinaryRecruitment(input: unknown): OrdinaryRecruitmentResult {
  let q: OrdinaryRecruitmentInput;
  try { q = validate(detach(input)); } catch (e) {
    let reason: OrdinaryRecruitmentRejection = 'invalid-input';
    // Even inspecting a thrown proxy can throw; never let an untrusted exception escape.
    try { if (e instanceof Invalid) reason = e.reason; } catch { /* retain invalid-input */ }
    return freeze({supported: false as const, reason});
  }
  const {target: t, executor: e, ruler: r} = q;
  const gateTrace: Common['gateTrace'] = [];
  const common: Common = {supported: true, profile: q.profile, scope: q.scope, policyIds: ORDINARY_RECRUITMENT_POLICY.policyIds, observations: q, gateTrace, evidence: ORDINARY_RECRUITMENT_POLICY.evidence};
  const gates: [OrdinaryRecruitmentGate, () => boolean, boolean][] = [
    ['G1', () => t.spouse !== null && t.spouse.forceId !== null && t.spouse.forceId !== e.forceId && t.forceControlledCityCount > 0, false],
    ['G2', () => t.spouse !== null && (t.spouse.personId === e.id || t.spouse.personId === r.id), true],
    ['G3', () => t.dislikesIds.includes(e.id) || t.dislikesIds.includes(r.id), false],
    ['G4', () => t.swornSiblingIds.includes(e.id) || t.swornSiblingIds.includes(r.id), true],
    ['G5', () => t.loyalty + t.giriInternal > 96, false],
    ['G6', () => t.swornSenior !== null && t.swornSenior.forceId === e.forceId, true],
    ['G7', () => t.spouse !== null && t.spouse.forceId === e.forceId, true],
    ['G8', () => t.currentRulerId !== null && t.likesIds.includes(t.currentRulerId), false],
    ['G9', () => t.likesIds.includes(e.id) && t.likesIds.includes(r.id), true]
  ];
  for (const [id, predicate, success] of gates) {
    const matched = predicate(); gateTrace.push({id, matched});
    if (matched) return success ? freeze({...common, path: 'forced-success' as const, reason: id, success: true as const, rateDetails: null, rollDetails: null}) : freeze({...common, path: 'forced-failure' as const, reason: id, success: false as const, rateDetails: null, rollDetails: null});
  }
  // dateKey remains in the input context; this named fallback does not use it for rate.
  const effectiveLoyalty = t.forceId !== null ? t.loyalty : 60;
  const loyaltyRoomNumerator = Math.min(60,Math.max(0,96-effectiveLoyalty-t.giriInternal));
  const rulerTargetDistance = distance(t.affinity,r.affinity), charisma = e.charisma;
  const numerator = loyaltyRoomNumerator * (150-rulerTargetDistance) * (150+charisma);
  const rate = Math.min(95,Math.floor(numerator/18000));
  const words: [number,number,number,number,number,number,0] = [q.dateKey,t.id,e.id,t.loyalty,e.charisma,distance(t.affinity,e.affinity),0];
  let hashU32 = 2166136261;
  for (const word of words) for (let shift = 0; shift < 32; shift += 8) hashU32 = Math.imul(hashU32 ^ ((word >>> shift) & 255),16777619) >>> 0;
  const roll = hashU32 % 100, success = roll < rate;
  return freeze({...common, path: 'continuous' as const, reason: success ? 'roll-below-rate' as const : 'roll-not-below-rate' as const, success, rateDetails: {effectiveLoyalty,loyaltyRoomNumerator,rulerTargetDistance,charisma,numerator,denominator: 18000 as const,rate}, rollDetails: {words,hashU32,roll}});
}
