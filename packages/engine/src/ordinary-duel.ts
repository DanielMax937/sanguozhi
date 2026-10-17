/** O09a: independent ordinary duel, pinned modern translation; NOT native equivalence. */
type Frozen<T> = T extends object ? { readonly [K in keyof T]: Frozen<T[K]> } : T;
type Stance = 'Attack' | 'Defense' | 'Spirit';
type Participant = { id: string; resolvedStrength: number; hp: number; spirit: number; stance: Stance };
type Pair<T> = [T, T];
const PROFILE = 'duel-ordinary-translated-reference-v1' as const;
const TAG = 'ordinary-duel-session-v1' as const;
const MAX_ENTRIES = 4096, MAX_BYTES = 16 * 1024 * 1024;
const STANCES = {
  Attack: { speed: 42, hit: 71, attack: 16, block: 12, attackSub: 3, spiritGain: 4 },
  Defense: { speed: 10, hit: 200, attack: 14, block: 90, attackSub: 2, spiritGain: 8 },
  Spirit: { speed: 15, hit: 125, attack: 14, block: 55, attackSub: 3, spiritGain: 10 },
} as const;
const POLICY = {
  id: 'ordinary-duel-standalone-policy-v1', profile: PROFILE,
  actions: { id: 'three-stance-ordinary-only-v1', stances: ['Attack', 'Defense', 'Spirit'], action: 'ResolveOrdinaryExchange', critical: false, counterattack: false },
  identities: { id: 'generic-identity-hooks-v1', allPersonHooks: 'identity-or-disabled', realPersonMapping: false },
  context: { id: 'source-normal-no-items-no-buffs-v1', difficulty: 'source-normal', items: false, buffs: false },
  stanceTiming: { id: 'simultaneous-stance-at-exchange-start-v1', freeStanceCommand: false },
  actor: { id: 'pinned-source-speed-share-actor-v1', reverse: false, fasterFirst: true, equalSpeedKeepsChallengerFirst: true },
  randomness: { id: 'bounded-percent-lt-v1', percentBound: 100, jitterBound: 10, comparison: 'strict-less-than', draws: 'three-if-hit-otherwise-four', nativePrng: false },
  arithmetic: { id: 'source-stepwise-integer-truncation-v1', ratio: 'duelScore-squared-share', division: 'toward-zero', intermediate: 'exact-bigint' },
  spirit: { id: 'source-pre-write-hp-spirit-v1', hpTiming: 'before-hp-writer', zeroBeforeMinimum: true, minimum: 3, receivingDefenseSpiritMinimum: 5 },
  writer: { id: 'source-hp100-spirit300-clamp-v1', hpMin: 0, hpMax: 100, spiritMin: 0, spiritMax: 300 },
  termination: { id: 'source-nondodge-blow-limit50-v1', blowLimit: 50, dodgeBlows: 0, hitBlockBlows: 1, priority: ['hp-defeat', 'blow-limit-draw'] },
  domains: { id: 'bounded-generic-participants-v1', participants: 2, strengthMin: 1, strengthMax: 100, initialHpMin: 1, idMaxAsciiCharacters: 64 },
  persistence: { id: 'full-policy-genesis-recompute-v1', receipts: 'compare-all-fields', snapshot: 'compare-all-fields' },
  capacity: { id: 'bounded-history-reject-v1', maxEntries: MAX_ENTRIES, maxCanonicalUtf8Bytes: MAX_BYTES, maxInputNodes: 1_000_000, maxInputDepth: 32, exhaustion: 'atomic-rejection' },
} as const;
type Policy = typeof POLICY;
const EVIDENCE = {
  evidenceLevel: 'translated-source-reference', nativeEquivalent: false, stockOriginalVerified: false,
  sourceCommit: 'a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef',
  duelBlob: 'd0e825097067c58c95c37e067d1c2a2688a74898', duelPhaseBlob: '9098e6541d84ac5b36ecafa6112beb082442c53f',
  formulas: 'translated-source-reference', actorSelection: 'translated-source-reference', hpSpiritWriter: 'translated-source-reference', terminationOrder: 'translated-source-reference',
  domains: 'provisional-engine-rule', ordinaryOnlyScheduling: 'provisional-engine-rule', genericIdentityProfile: 'provisional-engine-rule',
  stanceTiming: 'provisional-engine-rule', percentAdapter: 'provisional-engine-rule', capacityAndPersistence: 'provisional-engine-rule',
  originalUnresolvedGroups: 43, specialActions: 'excluded', personExceptions: 'excluded', nativeWholeChain: 'open',
} as const;
type Evidence = typeof EVIDENCE;
type Scenario = { schemaVersion: 1; profile: typeof PROFILE; genericOnly: true; difficulty: 'source-normal'; policies: Policy; participants: Pair<Participant> };
type Outcome = { kind: 'hp-defeat'; winnerId: string; loserId: string } | { kind: 'blow-limit-draw'; winnerId: null; loserId: null };
type Snapshot = Scenario & { revision: number; exchangeIndex: number; blowCount: number; status: 'active' | 'finished'; outcome: Outcome | null };
type DrawRole = 'actor-percent' | 'hit-jitter' | 'hit-percent' | 'dodge-percent';
type RawDraw = { role: DrawRole; bound: 10 | 100; value: number };
type Command = { type: 'ResolveOrdinaryExchange'; expectedRevision: number; expectedExchangeIndex: number; expectedBlowCount: number; stances: Pair<Stance>; rawDraws: RawDraw[] };
type Score = { participantId: string; strength: number; hi: number; lo: number; curve: number; decadeGap: number; x: number; c: number; y: number; z: number; d: number; duelScore: number; squaredScore: number; actionRatio: number };
type Gain = { participantId: string; receiving: boolean; preWriteHp: number; raw: number; minimum: number; afterMinimum: number; afterStance: number; afterReceiving: number; hpMultiplier: 'none' | '3/2' | '2'; requestedGain: number; actualGain: number };
type Receipt = {
  schemaVersion: 1; profile: typeof PROFILE; command: Command; policy: Policy; evidence: Evidence;
  beforeRevision: number; afterRevision: number; beforeExchangeIndex: number; afterExchangeIndex: number; beforeBlowCount: number; afterBlowCount: number;
  beforeParticipants: Pair<Participant>; exchangeParticipants: Pair<Participant>; afterParticipants: Pair<Participant>;
  scores: Pair<Score>; actor: { orderedIds: Pair<string>; orderedSpeeds: Pair<number>; speedShare: number; ratioAdjustment: number; unclampedThreshold: number; threshold: number; attackerId: string; defenderId: string };
  damage: { afterRatio: number; afterAttackSub: number; base: number; requestedHpDamage: number; actualHpLoss: number; counterattackHpDamage: 0 };
  hit: { afterBlock: number; afterRatio: number; jitter: number; threshold: number };
  dodge: { strengthDifference: number; truncatedThird: number; beforeClamp: number; afterClamp: number; defenseBonus: number; threshold: number } | null;
  result: 'Hit' | 'Dodge' | 'Block'; spirit: { attacker: Gain; defender: Gain };
  consumedDraws: RawDraw[]; drawCount: 3 | 4; outcome: Outcome | null;
};
type Entry = { command: Command; receipt: Receipt };
type Session = { tag: typeof TAG; policy: Policy; evidence: Evidence; genesis: Snapshot; snapshot: Snapshot; entries: Entry[] };
type Failure = { ok: false; reason: string; index: number | null };
type SessionResult = { ok: true; session: Session } | Failure;
type ExecuteResult = { ok: true; session: Session; receipt: Receipt } | Failure;
type PreviewResult = { ok: true; preview: { receipt: Receipt; projectedSnapshot: Snapshot; policy: Policy; evidence: Evidence; externalRngConsumed: 0 } } | Failure;
type SaveResult = { ok: true; json: string } | Failure;
type InspectionResult = { ok: true; inspection: { snapshot: Snapshot; policy: Policy; evidence: Evidence; entryCount: number; remainingEntryCapacity: number; canonicalUtf8Bytes: number } } | Failure;
export type OrdinaryDuelStanceV1 = Stance;
export type OrdinaryDuelParticipantV1 = Frozen<Participant>;
export type OrdinaryDuelScenarioV1 = Frozen<Scenario>;
export type OrdinaryDuelSnapshotV1 = Frozen<Snapshot>;
export type OrdinaryDuelCommandV1 = Frozen<Command>;
export type OrdinaryDuelRawDrawV1 = Frozen<RawDraw>;
export type OrdinaryDuelSessionV1 = Frozen<Session>;
export type OrdinaryDuelPolicyV1 = Frozen<Policy>;
export type OrdinaryDuelEvidenceV1 = Frozen<Evidence>;
export type OrdinaryDuelReceiptV1 = Frozen<Receipt>;
export type OrdinaryDuelFailureV1 = Frozen<Failure>;
export type OrdinaryDuelSessionResultV1 = Frozen<SessionResult>;
export type OrdinaryDuelExecuteResultV1 = Frozen<ExecuteResult>;
export type OrdinaryDuelPreviewResultV1 = Frozen<PreviewResult>;
export type OrdinaryDuelSaveResultV1 = Frozen<SaveResult>;
export type OrdinaryDuelInspectionResultV1 = Frozen<InspectionResult>;
export type OrdinaryDuelReplayResultV1 = Frozen<SessionResult>;

class Invalid extends Error { readonly reason: string; readonly index: number | null; constructor(reason: string, index: number | null = null) { super(reason); this.reason = reason; this.index = index; } }
function fail(reason: string, index: number | null = null): never { throw new Invalid(reason, index); }
function failure(e: unknown): Failure { return { ok: false, reason: e instanceof Invalid ? e.reason : 'malformed-data', index: e instanceof Invalid ? e.index : null }; }
function freeze<T>(v: T): Frozen<T> { if (v !== null && typeof v === 'object' && !Object.isFrozen(v)) { for (const x of Object.values(v)) freeze(x); Object.freeze(v); } return v as Frozen<T>; }
function clone<T>(v: T): T { return JSON.parse(JSON.stringify(v)) as T; }
function canonical(v: unknown): string { if (v === null || typeof v !== 'object') return JSON.stringify(v); if (Array.isArray(v)) return '[' + v.map(canonical).join(',') + ']'; const r = v as Record<string, unknown>; return '{' + Object.keys(r).sort().map(k => JSON.stringify(k) + ':' + canonical(r[k])).join(',') + '}'; }
function utf8Bytes(s: string): number { let n = 0; for (const c of s) { const cp = c.codePointAt(0)!; n += cp <= 0x7f ? 1 : cp <= 0x7ff ? 2 : cp <= 0xffff ? 3 : 4; } return n; }
function budget(v: unknown): number {
  // Internal values have already been detached/generated. Match detach's structural budget too.
  let nodes = 0;
  function visit(x: unknown, depth: number): void {
    if (++nodes > POLICY.capacity.maxInputNodes || depth > POLICY.capacity.maxInputDepth) fail('history-limit');
    if (x !== null && typeof x === 'object') {
      if (Array.isArray(x) && x.length > MAX_ENTRIES) fail('history-limit');
      for (const child of Object.values(x)) visit(child, depth + 1);
    }
  }
  visit(v, 0); const n = utf8Bytes(canonical(v)); if (n > MAX_BYTES) fail('history-limit'); return n;
}
function same(a: unknown, b: unknown): boolean { return canonical(a) === canonical(b); }
const runtime = globalThis as { process?: { getBuiltinModule?: (id: string) => { types: { isProxy(v: unknown): boolean } } } };
const proxyDetector = typeof runtime.process?.getBuiltinModule === 'function' ? runtime.process.getBuiltinModule('node:util').types.isProxy : null;
/** No getters, proxy traps, toJSON hooks or custom iterators are invoked on caller objects. */
type InputBudget = { count: number; bytes: number };
function detach(value: unknown, indexedRootArray = false, shared: InputBudget = { count: 0, bytes: 0 }, initialDepth = 0): unknown {
  if (!proxyDetector) fail('unsupported-runtime');
  const active = new Set<object>();
  function visit(v: unknown, depth: number, indexedArray = false): unknown {
    if (++shared.count > POLICY.capacity.maxInputNodes || depth > POLICY.capacity.maxInputDepth) fail('history-limit');
    if (v === null || typeof v === 'boolean') return v;
    if (typeof v === 'string') { shared.bytes += utf8Bytes(v); if (shared.bytes > MAX_BYTES) fail('history-limit'); return v; }
    if (typeof v === 'number') { if (!Number.isSafeInteger(v) || Object.is(v, -0)) fail('malformed-data'); return v; }
    if (typeof v !== 'object' || proxyDetector!(v) || active.has(v)) fail('malformed-data');
    const isArray = Array.isArray(v), proto = Object.getPrototypeOf(v);
    if (proto !== (isArray ? Array.prototype : Object.prototype) && !(proto === null && !isArray)) fail('malformed-data');
    const descriptors = Object.getOwnPropertyDescriptors(v as object), keys = Reflect.ownKeys(descriptors);
    if (keys.some(k => typeof k !== 'string' || !Object.hasOwn(descriptors[k]!, 'value') || (!descriptors[k]!.enumerable && !(isArray && k === 'length')))) fail('malformed-data');
    active.add(v);
    try {
      if (isArray) {
        const n = descriptors.length!.value as number;
        if (n > MAX_ENTRIES) fail('history-limit');
        if (keys.length !== n + 1) fail('malformed-data');
        const a: unknown[] = [];
        for (let i = 0; i < n; i++) {
          try { const d = descriptors[String(i)]; if (!d) fail('malformed-data'); a.push(visit(d.value, depth + 1)); }
          catch (e) { if (indexedArray) fail(failure(e).reason, i); throw e; }
        }
        return a;
      }
      const r: Record<string, unknown> = {};
      for (const k of keys as string[]) { shared.bytes += utf8Bytes(k); if (shared.bytes > MAX_BYTES) fail('history-limit'); Object.defineProperty(r, k, { value: visit(descriptors[k]!.value, depth + 1, depth === initialDepth && k === 'entries'), enumerable: true, configurable: true, writable: true }); }
      return r;
    } finally { active.delete(v); }
  }
  const result = visit(value, initialDepth, indexedRootArray); budget(result); return result;
}
function object(v: unknown, keys: readonly string[]): Record<string, unknown> {
  if (v === null || typeof v !== 'object' || Array.isArray(v)) fail('malformed-data');
  const r = v as Record<string, unknown>, unknown = Object.keys(r).filter(k => !keys.includes(k));
  if (unknown.some(k => ['personId', 'person', 'personHooks', 'characterId'].includes(k))) fail('unsupported-person');
  if (unknown.some(k => ['items', 'item', 'equipment', 'weapon', 'sword'].includes(k))) fail('unsupported-item');
  if (unknown.length) fail('unknown-field');
  if (keys.some(k => !Object.hasOwn(r, k))) fail('malformed-data'); return r;
}
function integer(v: unknown, max: number, min = 0, reason = 'malformed-data'): number { if (typeof v !== 'number' || !Number.isSafeInteger(v) || Object.is(v, -0) || v < min || v > max) fail(reason); return v; }
function choice<T extends string>(v: unknown, choices: readonly T[], reason: string): T { if (!choices.includes(v as T)) fail(reason); return v as T; }
function array(v: unknown, max: number): unknown[] { if (!Array.isArray(v)) fail('malformed-data'); if (v.length > max) fail('history-limit'); return v; }
function pair<T>(v: unknown, parse: (v: unknown) => T): Pair<T> { if (!Array.isArray(v) || v.length !== 2) fail('malformed-data'); return [parse(v[0]), parse(v[1])]; }
function stance(v: unknown): Stance { return choice(v, ['Attack', 'Defense', 'Spirit'], 'unsupported-action'); }
function participant(v: unknown, initial: boolean): Participant {
  const r = object(v, ['id', 'resolvedStrength', 'hp', 'spirit', 'stance']);
  if (typeof r.id !== 'string' || !/^[A-Za-z][A-Za-z0-9_-]{0,63}$/.test(r.id)) fail('unsupported-person');
  return { id: r.id, resolvedStrength: integer(r.resolvedStrength, 100, 1), hp: integer(r.hp, 100, initial ? 1 : 0), spirit: integer(r.spirit, 300), stance: stance(r.stance) };
}
const SCENARIO_KEYS = ['schemaVersion', 'profile', 'genericOnly', 'difficulty', 'policies', 'participants'] as const;
function parseScenario(v: unknown, initial = true): Scenario {
  const r = object(v, SCENARIO_KEYS);
  if (r.schemaVersion !== 1 || r.profile !== PROFILE) fail('unsupported-profile');
  if (r.genericOnly !== true) fail('unsupported-person');
  if (r.difficulty !== 'source-normal') fail('unsupported-profile');
  if (!same(r.policies, POLICY)) fail('unsupported-policy');
  const participants = pair(r.participants, x => participant(x, initial));
  if (participants[0].id === participants[1].id) fail('malformed-data');
  return { schemaVersion: 1, profile: PROFILE, genericOnly: true, difficulty: 'source-normal', policies: clone(POLICY), participants };
}
function parseOutcome(v: unknown): Outcome | null {
  if (v === null) return null;
  const r = object(v, ['kind', 'winnerId', 'loserId']);
  if (r.kind === 'blow-limit-draw' && r.winnerId === null && r.loserId === null) return { kind: r.kind, winnerId: null, loserId: null };
  if (r.kind === 'hp-defeat' && typeof r.winnerId === 'string' && typeof r.loserId === 'string') return { kind: r.kind, winnerId: r.winnerId, loserId: r.loserId };
  return fail('malformed-data');
}
function parseSnapshot(v: unknown): Snapshot {
  const r = object(v, [...SCENARIO_KEYS, 'revision', 'exchangeIndex', 'blowCount', 'status', 'outcome']);
  const s = parseScenario({ schemaVersion: r.schemaVersion, profile: r.profile, genericOnly: r.genericOnly, difficulty: r.difficulty, policies: r.policies, participants: r.participants }, false);
  return { ...s, revision: integer(r.revision, MAX_ENTRIES), exchangeIndex: integer(r.exchangeIndex, MAX_ENTRIES), blowCount: integer(r.blowCount, 50), status: choice(r.status, ['active', 'finished'], 'malformed-data'), outcome: parseOutcome(r.outcome) };
}
function parseCommand(v: unknown): Command {
  if (v === null || typeof v !== 'object' || Array.isArray(v)) fail('malformed-data');
  if ((v as Record<string, unknown>).type !== 'ResolveOrdinaryExchange') fail('unsupported-action');
  const r = object(v, ['type', 'expectedRevision', 'expectedExchangeIndex', 'expectedBlowCount', 'stances', 'rawDraws']);
  if (!Array.isArray(r.rawDraws) || r.rawDraws.length < 3 || r.rawDraws.length > 4) fail('draw-shape');
  const roles: DrawRole[] = ['actor-percent', 'hit-jitter', 'hit-percent', 'dodge-percent'];
  const rawDraws = r.rawDraws.map((v, i): RawDraw => {
    const d = object(v, ['role', 'bound', 'value']), role = roles[i]!, bound = i === 1 ? 10 : 100;
    if (d.role !== role || d.bound !== bound) fail('draw-shape');
    return { role, bound, value: integer(d.value, bound - 1, 0, 'draw-range') };
  });
  return { type: 'ResolveOrdinaryExchange', expectedRevision: integer(r.expectedRevision, MAX_ENTRIES), expectedExchangeIndex: integer(r.expectedExchangeIndex, MAX_ENTRIES), expectedBlowCount: integer(r.expectedBlowCount, 50), stances: pair(r.stances, stance), rawDraws };
}
/** Every division uses bigint (including negative dodge/actor adjustments), never a fused float. */
function div(n: bigint, d: bigint): number { return Number(n / d); }
function clamp(n: number, low: number, high: number): number { return Math.max(low, Math.min(high, n)); }
function score(self: Participant, other: Participant): Score {
  const hi = Math.max(self.resolvedStrength, other.resolvedStrength), lo = Math.min(self.resolvedStrength, other.resolvedStrength);
  const shifted = BigInt(Math.max(hi - 5, 0)), curve = div(shifted * shifted, 1500n);
  const decadeGap = Math.max(div(BigInt(hi), 10n) - div(BigInt(lo), 10n), 1), x = self.resolvedStrength - lo;
  const c = Math.max(x + decadeGap - curve - 1, 0) * decadeGap, y = Math.min(x, curve), z = y + decadeGap - curve;
  const d = y * (curve - y) + div(BigInt(y) * BigInt(y + 1), 2n) + div(BigInt(Math.max(z, 0)) * BigInt(Math.max(z - 1, 0)), 2n);
  const duelScore = 180 + c + d, squaredScore = Number(BigInt(duelScore) ** 2n);
  return { participantId: self.id, strength: self.resolvedStrength, hi, lo, curve, decadeGap, x, c, y, z, d, duelScore, squaredScore, actionRatio: 0 };
}
function ratio(a: Score, b: Score): number {
  const aa = BigInt(a.squaredScore), bb = BigInt(b.squaredScore), sum = aa + bb;
  return aa >= bb ? Math.min(div(aa * 100n, sum), 99) : 100 - Math.min(div(bb * 100n, sum), 99);
}
function gain(p: Participant, raw: number, receiving: boolean): Gain {
  const minimum = receiving && p.stance !== 'Attack' ? 5 : 3;
  const base: Gain = { participantId: p.id, receiving, preWriteHp: p.hp, raw, minimum, afterMinimum: 0, afterStance: 0, afterReceiving: 0, hpMultiplier: 'none', requestedGain: 0, actualGain: 0 };
  if (raw <= 0) return base;
  base.afterMinimum = Math.max(raw, minimum);
  base.afterStance = div(BigInt(base.afterMinimum) * BigInt(STANCES[p.stance].spiritGain), 7n);
  base.afterReceiving = receiving ? div(BigInt(base.afterStance) * 5n, 4n) : base.afterStance;
  base.hpMultiplier = p.hp < 30 ? '2' : p.hp < 50 ? '3/2' : 'none';
  base.requestedGain = Math.max(p.hp < 30 ? base.afterReceiving * 2 : p.hp < 50 ? div(BigInt(base.afterReceiving) * 3n, 2n) : base.afterReceiving, 1);
  base.actualGain = clamp(p.spirit + base.requestedGain, 0, 300) - p.spirit; return base;
}
/** One pure resolver: no RNG object, random seed, callback, global draw or external game write. */
function resolve(s: Snapshot, c: Command): { snapshot: Snapshot; receipt: Receipt } {
  if (s.status === 'finished') fail('session-finished');
  if (c.expectedRevision !== s.revision) fail('stale-revision');
  if (c.expectedExchangeIndex !== s.exchangeIndex) fail('stale-exchange');
  if (c.expectedBlowCount !== s.blowCount) fail('stale-blow');
  const beforeParticipants = clone(s.participants), participants = clone(s.participants);
  participants[0].stance = c.stances[0]; participants[1].stance = c.stances[1];
  const scores: Pair<Score> = [score(participants[0], participants[1]), score(participants[1], participants[0])];
  scores[0].actionRatio = ratio(scores[0], scores[1]); scores[1].actionRatio = ratio(scores[1], scores[0]);
  const first: 0 | 1 = STANCES[participants[0].stance].speed < STANCES[participants[1].stance].speed ? 1 : 0, second = first === 0 ? 1 : 0;
  const aSpeed = STANCES[participants[first].stance].speed, bSpeed = STANCES[participants[second].stance].speed;
  const speedShare = div(BigInt(aSpeed) * 100n, BigInt(aSpeed + bSpeed));
  const ratioAdjustment = div(BigInt(scores[first].actionRatio - 50), 2n), unclampedThreshold = speedShare + ratioAdjustment, threshold = clamp(unclampedThreshold, 1, 99);
  const attackerIndex = c.rawDraws[0]!.value < threshold ? first : second, defenderIndex = attackerIndex === 0 ? 1 : 0;
  const attacker = participants[attackerIndex], defender = participants[defenderIndex], attackCoef = STANCES[attacker.stance], defenseCoef = STANCES[defender.stance];
  const actionRatio = scores[attackerIndex].actionRatio;
  const afterRatio = div(BigInt(attackCoef.attack) * BigInt(actionRatio), 50n), afterAttackSub = div(BigInt(afterRatio) * BigInt(attackCoef.attackSub) * 7n, 27n), n = Math.max(afterAttackSub, 3);
  const hitAfterBlock = div(BigInt(attackCoef.hit) * BigInt(100 - defenseCoef.block), 80n), hitAfterRatio = div(BigInt(hitAfterBlock) * BigInt(actionRatio), 50n);
  const jitter = c.rawDraws[1]!.value, pHit = clamp(hitAfterRatio + jitter, 10, 99);
  let result: Receipt['result'], dodge: Receipt['dodge'] = null;
  if (c.rawDraws[2]!.value < pHit) { if (c.rawDraws.length !== 3) fail('draw-shape'); result = 'Hit'; }
  else {
    if (c.rawDraws.length !== 4) fail('draw-shape');
    const strengthDifference = defender.resolvedStrength - attacker.resolvedStrength, truncatedThird = div(BigInt(strengthDifference), 3n), beforeClamp = 10 + truncatedThird, afterClamp = clamp(beforeClamp, 5, 30), defenseBonus = defender.stance === 'Defense' ? 25 : 0;
    dodge = { strengthDifference, truncatedThird, beforeClamp, afterClamp, defenseBonus, threshold: afterClamp + defenseBonus };
    result = c.rawDraws[3]!.value < dodge.threshold ? 'Dodge' : 'Block';
  }
  let requestedHpDamage = n, attackerRaw = n, defenderRaw = n;
  if (result === 'Block') { requestedHpDamage = defender.stance === 'Defense' ? Math.max(div(BigInt(n) * 3n, 10n), 1) : div(BigInt(n), 2n); attackerRaw = div(BigInt(n) * 3n, 4n); defenderRaw = Math.max(div(BigInt(n), 2n), 1); }
  if (result === 'Dodge') { requestedHpDamage = 0; attackerRaw = 0; defenderRaw = defender.stance === 'Defense' ? n : defender.stance === 'Spirit' ? Math.max(div(BigInt(n), 2n), 1) : 0; }
  // Calculate BOTH requested gains from pre-write HP, before even the lethal HP writer.
  const attackerGain = gain(attacker, attackerRaw, false), defenderGain = gain(defender, defenderRaw, true);
  const afterParticipants = clone(participants), afterAttacker = afterParticipants[attackerIndex], afterDefender = afterParticipants[defenderIndex];
  afterDefender.hp = clamp(defender.hp - requestedHpDamage, 0, 100);
  afterAttacker.spirit = clamp(attacker.spirit + attackerGain.requestedGain, 0, 300);
  afterDefender.spirit = clamp(defender.spirit + defenderGain.requestedGain, 0, 300);
  const blowCount = s.blowCount + (result === 'Dodge' ? 0 : 1);
  const outcome: Outcome | null = afterDefender.hp === 0 ? { kind: 'hp-defeat', winnerId: attacker.id, loserId: defender.id } : blowCount >= 50 ? { kind: 'blow-limit-draw', winnerId: null, loserId: null } : null;
  const snapshot: Snapshot = { ...clone(s), participants: afterParticipants, revision: s.revision + 1, exchangeIndex: s.exchangeIndex + 1, blowCount, status: outcome ? 'finished' : 'active', outcome };
  const receipt: Receipt = {
    schemaVersion: 1, profile: PROFILE, command: clone(c), policy: clone(POLICY), evidence: clone(EVIDENCE),
    beforeRevision: s.revision, afterRevision: snapshot.revision, beforeExchangeIndex: s.exchangeIndex, afterExchangeIndex: snapshot.exchangeIndex, beforeBlowCount: s.blowCount, afterBlowCount: blowCount,
    beforeParticipants, exchangeParticipants: participants, afterParticipants: clone(afterParticipants), scores,
    actor: { orderedIds: [participants[first].id, participants[second].id], orderedSpeeds: [aSpeed, bSpeed], speedShare, ratioAdjustment, unclampedThreshold, threshold, attackerId: attacker.id, defenderId: defender.id },
    damage: { afterRatio, afterAttackSub, base: n, requestedHpDamage, actualHpLoss: defender.hp - afterDefender.hp, counterattackHpDamage: 0 },
    hit: { afterBlock: hitAfterBlock, afterRatio: hitAfterRatio, jitter, threshold: pHit }, dodge, result,
    spirit: { attacker: attackerGain, defender: defenderGain }, consumedDraws: clone(c.rawDraws), drawCount: result === 'Hit' ? 3 : 4, outcome: clone(outcome),
  };
  return { snapshot, receipt };
}
function initialSession(scenario: Scenario): Session {
  const genesis: Snapshot = { ...clone(scenario), revision: 0, exchangeIndex: 0, blowCount: 0, status: 'active', outcome: null };
  return { tag: TAG, policy: clone(POLICY), evidence: clone(EVIDENCE), genesis, snapshot: clone(genesis), entries: [] };
}
/** The proposed COMPLETE envelope is budgeted identically by preview, execute and replay. */
function append(s: Session, command: Command): { session: Session; receipt: Receipt } {
  if (s.entries.length >= MAX_ENTRIES) fail('history-limit');
  const next = resolve(s.snapshot, command);
  const session: Session = { tag: TAG, policy: clone(POLICY), evidence: clone(EVIDENCE), genesis: s.genesis, snapshot: next.snapshot, entries: [...s.entries, { command: clone(command), receipt: next.receipt }] };
  budget(session); return { session, receipt: next.receipt };
}
function parseSession(v: unknown): Session {
  const r = object(v, ['tag', 'policy', 'evidence', 'genesis', 'snapshot', 'entries']);
  if (r.tag !== TAG) fail('unsupported-profile');
  if (!same(r.policy, POLICY)) fail('unsupported-policy'); if (!same(r.evidence, EVIDENCE)) fail('evidence-mismatch');
  const genesis = parseSnapshot(r.genesis);
  if (genesis.revision !== 0 || genesis.exchangeIndex !== 0 || genesis.blowCount !== 0 || genesis.status !== 'active' || genesis.outcome !== null || genesis.participants.some(p => p.hp === 0)) fail('invalid-genesis');
  let session: Session = { tag: TAG, policy: clone(POLICY), evidence: clone(EVIDENCE), genesis, snapshot: clone(genesis), entries: [] };
  const entries = array(r.entries, MAX_ENTRIES);
  for (let index = 0; index < entries.length; index++) {
    try { const entry = object(entries[index], ['command', 'receipt']), command = parseCommand(entry.command), next = append(session, command); if (!same(entry.receipt, next.receipt)) fail('receipt-mismatch'); session = next.session; }
    catch (e) { fail(failure(e).reason, index); }
  }
  const expected = parseSnapshot(r.snapshot); if (!same(session.snapshot, expected)) fail('snapshot-mismatch'); budget(session); return session;
}
export const ORDINARY_DUEL_POLICY_V1: OrdinaryDuelPolicyV1 = freeze(POLICY);
export const ORDINARY_DUEL_EVIDENCE_V1: OrdinaryDuelEvidenceV1 = freeze(EVIDENCE);
export function createOrdinaryDuel(input: unknown): OrdinaryDuelSessionResultV1 {
  try { const session = initialSession(parseScenario(detach(input))); budget(session); return freeze({ ok: true, session } as SessionResult); } catch (e) { return freeze(failure(e)); }
}
export function inspectOrdinaryDuel(input: unknown): OrdinaryDuelInspectionResultV1 {
  try { const s = parseSession(detach(input)); return freeze({ ok: true, inspection: { snapshot: s.snapshot, policy: s.policy, evidence: s.evidence, entryCount: s.entries.length, remainingEntryCapacity: MAX_ENTRIES - s.entries.length, canonicalUtf8Bytes: budget(s) } } as InspectionResult); } catch (e) { return freeze(failure(e)); }
}
export function previewOrdinaryDuelExchange(input: unknown, command: unknown): OrdinaryDuelPreviewResultV1 {
  try { const s = parseSession(detach(input)), c = parseCommand(detach(command)), next = append(s, c); return freeze({ ok: true, preview: { receipt: next.receipt, projectedSnapshot: next.session.snapshot, policy: clone(POLICY), evidence: clone(EVIDENCE), externalRngConsumed: 0 } } as PreviewResult); } catch (e) { return freeze(failure(e)); }
}
export function executeOrdinaryDuelExchange(input: unknown, command: unknown): OrdinaryDuelExecuteResultV1 {
  try { const s = parseSession(detach(input)), c = parseCommand(detach(command)), next = append(s, c); return freeze({ ok: true, ...next } as ExecuteResult); } catch (e) { return freeze(failure(e)); }
}
export function saveOrdinaryDuel(input: unknown): OrdinaryDuelSaveResultV1 {
  try { const s = parseSession(detach(input)); budget(s); return freeze({ ok: true, json: canonical(s) } as SaveResult); } catch (e) { return freeze(failure(e)); }
}
export function loadOrdinaryDuel(json: unknown): OrdinaryDuelSessionResultV1 {
  try { if (typeof json !== 'string') fail('malformed-data'); if (utf8Bytes(json) > MAX_BYTES) fail('history-limit'); return freeze({ ok: true, session: parseSession(detach(JSON.parse(json))) } as SessionResult); } catch (e) { return freeze(failure(e)); }
}
/** Safely inspect only the outer list; each element is detached at its own replay index. */
function commandList(v: unknown): { length: number; descriptors: Record<string, PropertyDescriptor> } {
  if (!proxyDetector) fail('unsupported-runtime');
  if (v === null || typeof v !== 'object' || proxyDetector(v) || !Array.isArray(v) || Object.getPrototypeOf(v) !== Array.prototype) fail('malformed-data');
  const descriptors = Object.getOwnPropertyDescriptors(v as object), keys = Reflect.ownKeys(descriptors), length = descriptors.length!.value as number;
  if (length > MAX_ENTRIES) fail('history-limit');
  if (keys.some(k => typeof k !== 'string' || (k !== 'length' && !/^(0|[1-9][0-9]*)$/.test(k)))) fail('malformed-data');
  if (keys.length !== length + 1) fail('malformed-data');
  return { length, descriptors };
}
/** Replay reports the first failed command index; -1 denotes scenario/outer-list failure. */
export function replayOrdinaryDuel(initialScenario: unknown, commands: unknown): OrdinaryDuelReplayResultV1 {
  let index = -1;
  try {
    let session = initialSession(parseScenario(detach(initialScenario))); budget(session);
    const requests = commandList(commands), inputBudget: InputBudget = { count: 1, bytes: 0 }; let commandBytes = 2;
    for (index = 0; index < requests.length; index++) {
      const descriptor = requests.descriptors[String(index)];
      if (!descriptor || !Object.hasOwn(descriptor, 'value') || !descriptor.enumerable) fail('malformed-data');
      const detached = detach(descriptor.value, false, inputBudget, 1);
      commandBytes += utf8Bytes(canonical(detached)) + (index === 0 ? 0 : 1);
      if (commandBytes > MAX_BYTES) fail('history-limit');
      session = append(session, parseCommand(detached)).session;
    }
    return freeze({ ok: true, session } as SessionResult);
  } catch (e) { return freeze({ ...failure(e), index }); }
}
