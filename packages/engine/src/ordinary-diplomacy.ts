/** O08: detached PK-era empirical diplomacy; no native mission or person lifecycle. */
type Frozen<T> = T extends object ? { readonly [K in keyof T]: Frozen<T[K]> } : T;
type Difficulty = 'beginner' | 'advanced' | 'super';
type Resources = { gold: number; actionPoints: number };
type SourceCity = { id: number; forceId: number; diplomacyOfficeCompleted: boolean };
type Executor = { id: number; forceId: number; politics: number; affinity: number; hasDebater: boolean };
type Target = {
  ruler: { id: number; forceId: number; affinity: number };
  relationFacts: { swornSiblings: boolean; spouses: boolean; targetRulerLikesExecutor: boolean; targetRulerDislikesExecutor: boolean };
  specialGateFacts: { resolution: 'known' | 'unknown'; formerServiceConflict: boolean; rulerHatredConflict: boolean };
};
type Relation = { forceAId: number; forceBId: number; friendship: number; allied: boolean; ceasefireRemainingXun: number };
type Scenario = { xun: number; difficulty: Difficulty; resources: Resources; sourceCity: SourceCity; executor: Executor; targets: Target[]; relations: Relation[] };
type Snapshot = Scenario & { schemaVersion: 1; profile: 'ordinary-diplomacy-pk-empirical-v1'; revision: number };
type DiplomacyBase = { expectedRevision: number; sourceCityId: number; executorId: number; targetForceId: number };
type Command =
  | (DiplomacyBase & { type: 'AmicabilityGift' })
  | (DiplomacyBase & { type: 'OfferAlliance'; offeredGold: number })
  | (DiplomacyBase & { type: 'OfferCeasefire'; offeredGold: number; durationMonths: number })
  | { type: 'AdvanceDiplomacyXun'; expectedRevision: number; expectedXun: number };
type Fraction = { numerator: string; denominator: string };
type Classification = 'success' | 'ordinary-failure' | 'dangerous-failure';
type Formula = {
  classification: Classification; politics: number; affinityDistance: number; friendship: number;
  offeredGold: number; durationMonths: number | null; difficultyTenths: number;
  relationClass: 'preferred' | 'disliked' | 'ordinary'; relationC: Fraction;
  value: Fraction; successThreshold: Fraction | null; secondaryThreshold: Fraction | null;
  friendshipGainBeforeClamp: number; debateEligible: boolean;
};
type Costs = { requiredGold: number; requiredActionPoints: number };
type Settlement = { reservedGold: number; spentGold: number; refundedGold: number; netGoldCost: number; spentActionPoints: number };
type RelationChange = { before: Relation; after: Relation };
type Receipt = {
  schemaVersion: 1; profile: Snapshot['profile']; command: Command;
  beforeRevision: number; afterRevision: number; beforeXun: number; afterXun: number;
  beforeResources: Resources; afterResources: Resources; formula: Formula | null;
  costs: Costs; settlement: Settlement; relationChanges: RelationChange[];
  expiredPairs: { forceAId: number; forceBId: number }[];
  policy: Policy; evidence: Evidence; rewardsApplied: false; rngDraws: 0;
};
type Entry = { command: Command; receipt: Receipt };
type Session = {
  tag: 'ordinary-diplomacy-session-v1'; policy: Policy;
  genesis: Snapshot; snapshot: Snapshot; entries: Entry[];
};
type Failure = { ok: false; reason: string };
type Preview = { executable: boolean; rejectionReason: string | null; formula: Formula | null; costs: Costs; receipt: Receipt | null; projectedSnapshot: Snapshot | null; policy: Policy; evidence: Evidence; rngDraws: 0 };
type SessionResult = { ok: true; session: Session } | Failure;
type ExecuteResult = { ok: true; session: Session; receipt: Receipt } | Failure;
type PreviewResult = { ok: true; preview: Preview } | Failure;
type SaveResult = { ok: true; json: string } | Failure;
type ReplayResult = { ok: true; session: Session } | { ok: false; reason: string; index: number };

const PROFILE = 'ordinary-diplomacy-pk-empirical-v1' as const;
const MAX_COUNTER = 1_000_000_000, MAX_ENTRIES = 256, MAX_TEXT = 16 * 1024 * 1024;
const POLICY = {
  id: 'ordinary-diplomacy-standalone-policy-v1',
  profile: PROFILE,
  domains: { politicsMin: 0, politicsMax: 100, idMin: 0, idMax: 0x7fffffff, maxTargets: 32, maxPairs: 528, initialRevision: 0, maxTextCodeUnits: MAX_TEXT },
  formulas: { gift: '((20*c+max(P-D/2,0)+100)/10)*t', alliance: '(G/150+P-D/5+10*c)*t', ceasefire: '(G/400+P-D/5+c)*t', allianceSuccess: '2*(100-F)', allianceSecondary: '2*(80-F)', ceasefireSuccess: '80+months/2-F/4', ceasefireSecondary: '70+months/2-F/4', giftAllianceCTwice: { preferred: 3, disliked: -2, ordinary: 2 }, ceasefireC: { preferred: 20, disliked: -15, ordinary: 10 } },
  arithmetic: { id: 'rational-formula-final-floor-v1', comparison: 'strict-greater', giftRounding: 'final-floor', difficultyTenths: { beginner: 10, advanced: 8, super: 7 } },
  relationships: { id: 'preferred-before-disliked-v1', precedence: ['sworn-or-spouse-or-target-likes', 'target-dislikes', 'ordinary'], affinityRing: 150, affinityMin: 0, affinityMax: 149 },
  actionPoints: { id: 'diplomacy-ap20-office-half-v1', ordinary: 20, completedOffice: 10 },
  gift: { id: 'amicability-flat1000-office-half-v1', ordinaryGold: 1000, completedOfficeGold: 500 },
  offers: { id: 'offer-gold-no-office-discount-v1', officeDiscount: false, maxGold: MAX_COUNTER },
  refund: { id: 'immediate-refund-on-ordinary-failure-v1', requireFullReservation: true, ordinaryFailureRefund: 'full', ordinaryFailureApRefund: false },
  friendship: { id: 'friendship-clamp0-100-v1', min: 0, max: 100, allianceSuccessDelta: 10, ordinaryFailureDelta: -10, ceasefireSuccessDelta: 0 },
  ceasefire: { id: 'ceasefire-months-to-xun3-v1', formulaPeriodUnit: 'months', xunPerMonth: 3, minMonths: 1, maxMonths: 24, existingCeasefire: 'replace-on-success' },
  alliance: { id: 'alliance-indefinite-ceasefire-exclusive-v1', expires: false, successClearsCeasefire: true, rejectAllianceOrCeasefireWhenAllied: true },
  specialGate: { id: 'reject-unresolved-special-context-v1', rejectUnknown: true, rejectFormerServiceConflict: true, rejectRulerHatredConflict: true },
  dangerousFailure: { id: 'atomic-unsupported-dangerous-failure-v1', settlement: 'none' },
  advancement: { id: 'diplomacy-only-single-xun-v1', actionPointRecovery: 0, otherGameProgression: false },
  rewards: { id: 'defer-diplomacy-rewards-v1', applyTechniquePoints: false, applyMerit: false, applyPoliticsExperience: false },
  persistence: { id: 'full-policy-genesis-recompute-v1', maxEntries: MAX_ENTRIES, maxCounter: MAX_COUNTER },
} as const;
type Policy = typeof POLICY;
const EVIDENCE = {
  formulaProfile: 'pk-pc-formula-corpus', formula: 'empirical-high', exactBuild: 'open',
  stockOriginalVerified: false, nativeLifecycleIntegrated: false, compatibilityAssumption: false,
  feeConstants: 'documented-anchors-with-provisional-standalone-contract', officeDiscount: 'manual-and-reverse-support',
  relationshipPrecedence: 'provisional-engine-rule', rounding: 'provisional-engine-rule',
  allianceFriendshipGain: 'historical-formula-corpus', failureFriendshipLoss: 'provisional-engine-rule',
  ceasefireFriendshipDelta: 'provisional-engine-rule', friendshipDomain: 'provisional-engine-rule',
  refundTiming: 'provisional-engine-rule', periodUnitAndLimit: 'provisional-engine-rule',
  treatyTransitions: 'provisional-engine-rule', specialGateBody: 'open',
  rewards: 'not-applied-ceasefire-tp-35-versus-30-unresolved',
} as const;
type Evidence = typeof EVIDENCE;

export type OrdinaryDiplomacyScenarioV1 = Frozen<Scenario>;
export type OrdinaryDiplomacySnapshotV1 = Frozen<Snapshot>;
export type OrdinaryDiplomacyCommandV1 = Frozen<Command>;
export type OrdinaryDiplomacySessionV1 = Frozen<Session>;
export type OrdinaryDiplomacyPolicyV1 = Frozen<Policy>;
export type OrdinaryDiplomacyEvidenceV1 = Frozen<Evidence>;
export type OrdinaryDiplomacyFormulaV1 = Frozen<Formula>;
export type OrdinaryDiplomacyReceiptV1 = Frozen<Receipt>;
export type OrdinaryDiplomacyPreviewV1 = Frozen<Preview>;
export type OrdinaryDiplomacyFailure = Frozen<Failure>;
export type OrdinaryDiplomacySessionResultV1 = Frozen<SessionResult>;
export type OrdinaryDiplomacyExecuteResultV1 = Frozen<ExecuteResult>;
export type OrdinaryDiplomacyPreviewResultV1 = Frozen<PreviewResult>;
export type OrdinaryDiplomacySaveResultV1 = Frozen<SaveResult>;
export type OrdinaryDiplomacyReplayResultV1 = Frozen<ReplayResult>;

class Invalid extends Error { readonly reason: string; constructor(reason: string) { super(reason); this.reason = reason; } }
function fail(reason: string): never { throw new Invalid(reason); }
function failure(e: unknown): Failure { return { ok: false, reason: e instanceof Invalid ? e.reason : 'invalid-input' }; }
function freeze<T>(v: T): Frozen<T> { if (v !== null && typeof v === 'object' && !Object.isFrozen(v)) { for (const x of Object.values(v)) freeze(x); Object.freeze(v); } return v as Frozen<T>; }
function clone<T>(v: T): T { return JSON.parse(JSON.stringify(v)) as T; }
function canonical(v: unknown): string { if (v === null || typeof v !== 'object') return JSON.stringify(v); if (Array.isArray(v)) return '[' + v.map(canonical).join(',') + ']'; const r = v as Record<string, unknown>; return '{' + Object.keys(r).sort().map(k => JSON.stringify(k) + ':' + canonical(r[k])).join(',') + '}'; }
function same(a: unknown, b: unknown): boolean { return canonical(a) === canonical(b); }
const runtime = globalThis as { process?: { getBuiltinModule?: (id: string) => { types: { isProxy(v: unknown): boolean } } } };
const isProxy = typeof runtime.process?.getBuiltinModule === 'function' ? runtime.process.getBuiltinModule('node:util').types.isProxy : (() => false);
/** Reject accessors, cycles, exotic prototypes, hidden/symbol fields and sparse arrays. */
function detach(value: unknown): unknown {
  let count = 0, size = 0; const active = new Set<object>();
  function visit(v: unknown, depth: number): unknown {
    if (++count > 1_000_000 || depth > 32) fail('input-too-large');
    if (v === null || typeof v === 'boolean') return v;
    if (typeof v === 'string') { size += v.length; if (size > MAX_TEXT) fail('input-too-large'); return v; }
    if (typeof v === 'number') { if (!Number.isSafeInteger(v) || Object.is(v, -0)) fail('invalid-number'); return v; }
    if (typeof v !== 'object' || isProxy(v) || active.has(v)) fail('invalid-data');
    const array = Array.isArray(v), proto = Object.getPrototypeOf(v);
    if (proto !== (array ? Array.prototype : Object.prototype) && !(proto === null && !array)) fail('invalid-data');
    const ds = Object.getOwnPropertyDescriptors(v), keys = Reflect.ownKeys(ds);
    if (keys.some(k => typeof k !== 'string' || !Object.hasOwn(ds[k]!, 'value') || (!ds[k]!.enumerable && !(array && k === 'length')))) fail('invalid-data');
    active.add(v);
    try {
      if (array) { const n = ds.length!.value as number; if (n > 4096 || keys.length !== n + 1) fail('invalid-array'); const a: unknown[] = []; for (let i = 0; i < n; i++) { const d = ds[String(i)]; if (!d) fail('invalid-array'); a.push(visit(d.value, depth + 1)); } return a; }
      const r: Record<string, unknown> = {}; for (const k of keys as string[]) { size += k.length; if (size > MAX_TEXT) fail('input-too-large'); Object.defineProperty(r, k, { value: visit(ds[k]!.value, depth + 1), enumerable: true, configurable: true, writable: true }); } return r;
    } finally { active.delete(v); }
  }
  return visit(value, 0);
}
function object(v: unknown, keys: readonly string[]): Record<string, unknown> { if (v === null || typeof v !== 'object' || Array.isArray(v)) fail('invalid-object'); const r = v as Record<string, unknown>; if (Object.keys(r).length !== keys.length || keys.some(k => !Object.hasOwn(r, k))) fail('invalid-fields'); return r; }
function uint(v: unknown, max = MAX_COUNTER, min = 0): number { if (typeof v !== 'number' || !Number.isSafeInteger(v) || Object.is(v, -0) || v < min || v > max) fail('invalid-number'); return v; }
function bool(v: unknown): boolean { if (typeof v !== 'boolean') fail('invalid-boolean'); return v; }
function choice<T extends string>(v: unknown, choices: readonly T[], reason: string): T { if (!choices.includes(v as T)) fail(reason); return v as T; }
function array(v: unknown, max: number): unknown[] { if (!Array.isArray(v) || v.length > max) fail('invalid-array'); return v; }
function id(v: unknown): number { return uint(v, 0x7fffffff); }
function parseResources(v: unknown): Resources { const r = object(v, ['gold', 'actionPoints']); return { gold: uint(r.gold), actionPoints: uint(r.actionPoints) }; }
function pairKey(a: number, b: number): string { return Math.min(a, b) + ':' + Math.max(a, b); }
function parseScenario(v: unknown): Scenario {
  const r = object(v, ['xun', 'difficulty', 'resources', 'sourceCity', 'executor', 'targets', 'relations']);
  const city = object(r.sourceCity, ['id', 'forceId', 'diplomacyOfficeCompleted']);
  const sourceCity: SourceCity = { id: id(city.id), forceId: id(city.forceId), diplomacyOfficeCompleted: bool(city.diplomacyOfficeCompleted) };
  const e = object(r.executor, ['id', 'forceId', 'politics', 'affinity', 'hasDebater']);
  const executor: Executor = { id: id(e.id), forceId: id(e.forceId), politics: uint(e.politics, 100), affinity: uint(e.affinity, 149), hasDebater: bool(e.hasDebater) };
  if (sourceCity.forceId !== executor.forceId) fail('executor-force-mismatch');
  const forces = new Set([sourceCity.forceId]), people = new Set([executor.id]);
  const targets = array(r.targets, 32).map(v => {
    const t = object(v, ['ruler', 'relationFacts', 'specialGateFacts']);
    const p = object(t.ruler, ['id', 'forceId', 'affinity']);
    const ruler = { id: id(p.id), forceId: id(p.forceId), affinity: uint(p.affinity, 149) };
    if (forces.has(ruler.forceId) || people.has(ruler.id)) fail('duplicate-or-source-target'); forces.add(ruler.forceId); people.add(ruler.id);
    const f = object(t.relationFacts, ['swornSiblings', 'spouses', 'targetRulerLikesExecutor', 'targetRulerDislikesExecutor']);
    const relationFacts = { swornSiblings: bool(f.swornSiblings), spouses: bool(f.spouses), targetRulerLikesExecutor: bool(f.targetRulerLikesExecutor), targetRulerDislikesExecutor: bool(f.targetRulerDislikesExecutor) };
    const s = object(t.specialGateFacts, ['resolution', 'formerServiceConflict', 'rulerHatredConflict']);
    const specialGateFacts = { resolution: choice(s.resolution, ['known', 'unknown'], 'invalid-special-gate-resolution'), formerServiceConflict: bool(s.formerServiceConflict), rulerHatredConflict: bool(s.rulerHatredConflict) };
    return { ruler, relationFacts, specialGateFacts };
  }).sort((a, b) => a.ruler.forceId - b.ruler.forceId);
  const pairs = new Set<string>();
  const relations = array(r.relations, 528).map(v => {
    const row = object(v, ['forceAId', 'forceBId', 'friendship', 'allied', 'ceasefireRemainingXun']);
    const a = id(row.forceAId), b = id(row.forceBId), key = pairKey(a, b);
    if (a === b || !forces.has(a) || !forces.has(b)) fail('invalid-force-pair');
    if (pairs.has(key)) fail('duplicate-force-pair'); pairs.add(key);
    const relation = { forceAId: Math.min(a, b), forceBId: Math.max(a, b), friendship: uint(row.friendship, 100), allied: bool(row.allied), ceasefireRemainingXun: uint(row.ceasefireRemainingXun, 72) };
    if (relation.allied && relation.ceasefireRemainingXun !== 0) fail('conflicting-treaties'); return relation;
  }).sort((a, b) => a.forceAId - b.forceAId || a.forceBId - b.forceBId);
  if (targets.some(t => !pairs.has(pairKey(sourceCity.forceId, t.ruler.forceId)))) fail('missing-source-target-relation');
  return { xun: uint(r.xun), difficulty: choice(r.difficulty, ['beginner', 'advanced', 'super'], 'unsupported-difficulty'), resources: parseResources(r.resources), sourceCity, executor, targets, relations };
}
function parseSnapshot(v: unknown): Snapshot {
  const r = object(v, ['schemaVersion', 'profile', 'revision', 'xun', 'difficulty', 'resources', 'sourceCity', 'executor', 'targets', 'relations']);
  if (r.schemaVersion !== 1 || r.profile !== PROFILE) fail('unsupported-profile');
  const s = parseScenario({ xun: r.xun, difficulty: r.difficulty, resources: r.resources, sourceCity: r.sourceCity, executor: r.executor, targets: r.targets, relations: r.relations });
  if (!same(s.targets, r.targets) || !same(s.relations, r.relations)) fail('noncanonical-snapshot');
  return { ...s, schemaVersion: 1, profile: PROFILE, revision: uint(r.revision) };
}
function parseCommand(v: unknown): Command {
  if (v === null || typeof v !== 'object' || Array.isArray(v)) fail('invalid-command');
  const type = (v as Record<string, unknown>).type;
  if (type === 'AdvanceDiplomacyXun') { const r = object(v, ['type', 'expectedRevision', 'expectedXun']); return { type, expectedRevision: uint(r.expectedRevision), expectedXun: uint(r.expectedXun) }; }
  const kind = choice(type, ['AmicabilityGift', 'OfferAlliance', 'OfferCeasefire'], 'unsupported-command');
  const keys = ['type', 'expectedRevision', 'sourceCityId', 'executorId', 'targetForceId'];
  if (kind !== 'AmicabilityGift') keys.push('offeredGold'); if (kind === 'OfferCeasefire') keys.push('durationMonths');
  const r = object(v, keys), base = { expectedRevision: uint(r.expectedRevision), sourceCityId: id(r.sourceCityId), executorId: id(r.executorId), targetForceId: id(r.targetForceId) };
  if (kind === 'AmicabilityGift') return { type: kind, ...base };
  const offeredGold = uint(r.offeredGold);
  return kind === 'OfferAlliance' ? { type: kind, ...base, offeredGold } : { type: kind, ...base, offeredGold, durationMonths: uint(r.durationMonths, 24, 1) };
}

type Rational = { n: bigint; d: bigint };
function fraction(n: bigint, d = 1n): Rational { return { n, d }; }
function visible(r: Rational): Fraction { return { numerator: r.n.toString(), denominator: r.d.toString() }; }
function greater(a: Rational, b: Rational): boolean { return a.n * b.d > b.n * a.d; }
function formula(s: Snapshot, c: Exclude<Command, { type: 'AdvanceDiplomacyXun' }>, t: Target, r: Relation): Formula {
  const p = s.executor.politics, absolute = Math.abs(s.executor.affinity - t.ruler.affinity), distance = Math.min(absolute, 150 - absolute);
  const f = t.relationFacts, preferred = f.swornSiblings || f.spouses || f.targetRulerLikesExecutor;
  const relationClass = preferred ? 'preferred' : f.targetRulerDislikesExecutor ? 'disliked' : 'ordinary';
  const cTwice = preferred ? 3 : f.targetRulerDislikesExecutor ? -2 : 2;
  const ceasefireC = preferred ? 20 : f.targetRulerDislikesExecutor ? -15 : 10;
  const d = POLICY.arithmetic.difficultyTenths[s.difficulty], gold = c.type === 'AmicabilityGift' ? 0 : c.offeredGold;
  const common: Pick<Formula, 'politics' | 'affinityDistance' | 'friendship' | 'offeredGold' | 'durationMonths' | 'difficultyTenths' | 'relationClass'> = { politics: p, affinityDistance: distance, friendship: r.friendship, offeredGold: gold, durationMonths: c.type === 'OfferCeasefire' ? c.durationMonths : null, difficultyTenths: d, relationClass };
  if (c.type === 'AmicabilityGift') {
    const value = fraction(BigInt(d) * BigInt(20 * cTwice + Math.max(2 * p - distance, 0) + 200), 200n);
    return { ...common, relationC: visible(fraction(BigInt(cTwice), 2n)), classification: 'success', value: visible(value), successThreshold: null, secondaryThreshold: null, friendshipGainBeforeClamp: Number(value.n / value.d), debateEligible: false };
  }
  const value = c.type === 'OfferAlliance'
    ? fraction(BigInt(d) * (BigInt(gold) + BigInt(150 * p - 30 * distance + 750 * cTwice)), 1500n)
    : fraction(BigInt(d) * (BigInt(gold) + BigInt(400 * p - 80 * distance + 400 * ceasefireC)), 4000n);
  const success = c.type === 'OfferAlliance' ? fraction(BigInt(2 * (100 - r.friendship))) : fraction(BigInt(320 + 2 * c.durationMonths - r.friendship), 4n);
  const secondary = c.type === 'OfferAlliance' ? fraction(BigInt(2 * (80 - r.friendship))) : fraction(BigInt(280 + 2 * c.durationMonths - r.friendship), 4n);
  const classification = greater(value, success) ? 'success' : s.executor.hasDebater || greater(value, secondary) ? 'ordinary-failure' : 'dangerous-failure';
  return { ...common, relationC: visible(c.type === 'OfferAlliance' ? fraction(BigInt(cTwice), 2n) : fraction(BigInt(ceasefireC))), classification, value: visible(value), successThreshold: visible(success), secondaryThreshold: visible(secondary), friendshipGainBeforeClamp: 0, debateEligible: classification !== 'success' && s.executor.hasDebater };
}
function unsupportedPreview(reason: string, decision: Formula | null, costs: Costs): Preview {
  return { executable: false, rejectionReason: reason, formula: decision, costs, receipt: null, projectedSnapshot: null, policy: clone(POLICY), evidence: clone(EVIDENCE), rngDraws: 0 };
}
/** One pure calculation path is used by preview, execution and replay. */
function plan(s: Snapshot, c: Command): Preview {
  if (c.expectedRevision !== s.revision) fail('stale-revision');
  if (s.revision === MAX_COUNTER) fail('revision-overflow');
  const next = clone(s), changes: RelationChange[] = [], expiredPairs: Receipt['expiredPairs'] = [];
  let decision: Formula | null = null;
  let costs: Costs = { requiredGold: 0, requiredActionPoints: 0 };
  let settlement: Settlement = { reservedGold: 0, spentGold: 0, refundedGold: 0, netGoldCost: 0, spentActionPoints: 0 };
  if (c.type === 'AdvanceDiplomacyXun') {
    if (c.expectedXun !== s.xun) fail('stale-xun'); if (s.xun === MAX_COUNTER) fail('xun-overflow'); next.xun++;
    next.relations = s.relations.map(before => {
      if (before.ceasefireRemainingXun === 0) return clone(before);
      const after = { ...before, ceasefireRemainingXun: before.ceasefireRemainingXun - 1 }; changes.push({ before: clone(before), after: clone(after) });
      if (after.ceasefireRemainingXun === 0) expiredPairs.push({ forceAId: after.forceAId, forceBId: after.forceBId }); return after;
    });
  } else {
    if (c.sourceCityId !== s.sourceCity.id) fail('source-city-mismatch'); if (c.executorId !== s.executor.id) fail('executor-mismatch');
    const target = s.targets.find(t => t.ruler.forceId === c.targetForceId); if (!target) fail('unknown-target-force');
    const gate = target.specialGateFacts;
    if (gate.resolution !== 'known' || gate.formerServiceConflict || gate.rulerHatredConflict) return unsupportedPreview('unsupported-special-gate', null, costs);
    const key = pairKey(s.sourceCity.forceId, c.targetForceId), index = s.relations.findIndex(r => pairKey(r.forceAId, r.forceBId) === key);
    const before = s.relations[index]!;
    const office = s.sourceCity.diplomacyOfficeCompleted;
    costs = { requiredGold: c.type === 'AmicabilityGift' ? (office ? POLICY.gift.completedOfficeGold : POLICY.gift.ordinaryGold) : c.offeredGold, requiredActionPoints: office ? POLICY.actionPoints.completedOffice : POLICY.actionPoints.ordinary };
    decision = formula(s, c, target, before);
    if (s.resources.gold < costs.requiredGold) return unsupportedPreview('insufficient-gold', decision, costs);
    if (s.resources.actionPoints < costs.requiredActionPoints) return unsupportedPreview('insufficient-action-points', decision, costs);
    if (c.type !== 'AmicabilityGift' && before.allied) return unsupportedPreview('already-allied', decision, costs);
    if (decision.classification === 'dangerous-failure') return unsupportedPreview('unsupported-dangerous-failure', decision, costs);
    const failed = decision.classification === 'ordinary-failure';
    const refund = failed ? costs.requiredGold : 0, netGoldCost = costs.requiredGold - refund;
    settlement = { reservedGold: costs.requiredGold, spentGold: netGoldCost, refundedGold: refund, netGoldCost, spentActionPoints: costs.requiredActionPoints };
    next.resources = { gold: s.resources.gold - netGoldCost, actionPoints: s.resources.actionPoints - costs.requiredActionPoints };
    const delta = failed ? POLICY.friendship.ordinaryFailureDelta : c.type === 'AmicabilityGift' ? decision.friendshipGainBeforeClamp : c.type === 'OfferAlliance' ? POLICY.friendship.allianceSuccessDelta : POLICY.friendship.ceasefireSuccessDelta;
    const after = { ...before, friendship: Math.max(POLICY.friendship.min, Math.min(POLICY.friendship.max, before.friendship + delta)) };
    if (!failed && c.type === 'OfferAlliance') { after.allied = true; after.ceasefireRemainingXun = 0; }
    if (!failed && c.type === 'OfferCeasefire') after.ceasefireRemainingXun = c.durationMonths * POLICY.ceasefire.xunPerMonth;
    next.relations[index] = after; if (!same(before, after)) changes.push({ before: clone(before), after: clone(after) });
  }
  next.revision++;
  const receipt: Receipt = { schemaVersion: 1, profile: PROFILE, command: clone(c), beforeRevision: s.revision, afterRevision: next.revision, beforeXun: s.xun, afterXun: next.xun, beforeResources: clone(s.resources), afterResources: clone(next.resources), formula: decision, costs, settlement, relationChanges: changes, expiredPairs, policy: clone(POLICY), evidence: clone(EVIDENCE), rewardsApplied: false, rngDraws: 0 };
  return { executable: true, rejectionReason: null, formula: decision, costs, receipt, projectedSnapshot: next, policy: clone(POLICY), evidence: clone(EVIDENCE), rngDraws: 0 };
}
function materialize(s: Session, command: Command, p: Preview): { session: Session; receipt: Receipt } {
  if (s.entries.length === MAX_ENTRIES) fail('history-limit');
  if (!p.executable || !p.receipt || !p.projectedSnapshot) fail(p.rejectionReason ?? 'unsupported-command');
  const session: Session = { tag: 'ordinary-diplomacy-session-v1', policy: clone(POLICY), genesis: clone(s.genesis), snapshot: p.projectedSnapshot, entries: [...clone(s.entries), { command: clone(command), receipt: p.receipt }] };
  if (canonical(session).length > MAX_TEXT) fail('output-too-large'); return { session, receipt: p.receipt };
}
function append(s: Session, command: Command): { session: Session; receipt: Receipt } {
  if (s.entries.length === MAX_ENTRIES) fail('history-limit');
  return materialize(s, command, plan(s.snapshot, command));
}
/** Recompute every accepted command, every full receipt and the final snapshot. */
function parseSession(v: unknown): Session {
  const r = object(v, ['tag', 'policy', 'genesis', 'snapshot', 'entries']);
  if (r.tag !== 'ordinary-diplomacy-session-v1') fail('unsupported-session-schema'); if (!same(r.policy, POLICY)) fail('policy-mismatch');
  const genesis = parseSnapshot(r.genesis); if (genesis.revision !== 0) fail('invalid-genesis-revision');
  let result: Session = { tag: 'ordinary-diplomacy-session-v1', policy: clone(POLICY), genesis, snapshot: clone(genesis), entries: [] };
  for (const value of array(r.entries, MAX_ENTRIES)) {
    const entry = object(value, ['command', 'receipt']), command = parseCommand(entry.command), next = append(result, command);
    if (!same(entry.receipt, next.receipt)) fail('receipt-mismatch'); result = next.session;
  }
  const expected = parseSnapshot(r.snapshot); if (!same(result.snapshot, expected)) fail('snapshot-mismatch'); return result;
}
export const ORDINARY_DIPLOMACY_POLICY_V1: OrdinaryDiplomacyPolicyV1 = freeze(POLICY);
export const ORDINARY_DIPLOMACY_EVIDENCE_V1: OrdinaryDiplomacyEvidenceV1 = freeze(EVIDENCE);

export function createOrdinaryDiplomacy(input: unknown): OrdinaryDiplomacySessionResultV1 {
  try { const scenario = parseScenario(detach(input)); const genesis: Snapshot = { ...scenario, schemaVersion: 1, profile: PROFILE, revision: 0 }; return freeze({ ok: true, session: { tag: 'ordinary-diplomacy-session-v1', policy: clone(POLICY), genesis, snapshot: clone(genesis), entries: [] } } as SessionResult); } catch (e) { return freeze(failure(e)); }
}
export function previewOrdinaryDiplomacy(input: unknown, command: unknown): OrdinaryDiplomacyPreviewResultV1 {
  try { const s = parseSession(detach(input)), c = parseCommand(detach(command)); if (s.entries.length === MAX_ENTRIES) fail('history-limit'); const preview = plan(s.snapshot, c); if (preview.executable) materialize(s, c, preview); return freeze({ ok: true, preview } as PreviewResult); } catch (e) { return freeze(failure(e)); }
}
export function executeOrdinaryDiplomacy(input: unknown, command: unknown): OrdinaryDiplomacyExecuteResultV1 {
  try { const s = parseSession(detach(input)), c = parseCommand(detach(command)), result = append(s, c); return freeze({ ok: true, ...result } as ExecuteResult); } catch (e) { return freeze(failure(e)); }
}
export function saveOrdinaryDiplomacy(input: unknown): OrdinaryDiplomacySaveResultV1 {
  try { const json = canonical(parseSession(detach(input))); if (json.length > MAX_TEXT) fail('output-too-large'); return freeze({ ok: true, json }); } catch (e) { return freeze(failure(e)); }
}
export function loadOrdinaryDiplomacy(json: unknown): OrdinaryDiplomacySessionResultV1 {
  try { if (typeof json !== 'string' || json.length > MAX_TEXT) fail('invalid-save-text'); return freeze({ ok: true, session: parseSession(detach(JSON.parse(json))) } as SessionResult); } catch (e) { return freeze(failure(e)); }
}
/** Replay from a scenario (revision zero); failures report their command index, no partial result. */
export function replayOrdinaryDiplomacy(initialScenario: unknown, commands: unknown): OrdinaryDiplomacyReplayResultV1 {
  let index = -1;
  try {
    const scenario = parseScenario(detach(initialScenario)), requests = array(detach(commands), MAX_ENTRIES), genesis: Snapshot = { ...scenario, schemaVersion: 1, profile: PROFILE, revision: 0 };
    let session: Session = { tag: 'ordinary-diplomacy-session-v1', policy: clone(POLICY), genesis, snapshot: clone(genesis), entries: [] };
    for (index = 0; index < requests.length; index++) session = append(session, parseCommand(requests[index])).session;
    return freeze({ ok: true, session } as ReplayResult);
  } catch (e) { return freeze({ ...failure(e), index }); }
}
