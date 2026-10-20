/**
 * Independent ordinary-topic + Shout + Ignore session, pinned modern translated reference.
 * Rhetoric rules are modern-reference-only; NOT native/Vanilla equivalence or whole debate.
 * The existing ordinary-only and Shout modules and their evidence scopes remain unchanged.
 */
type Frozen<T> = T extends object ? { readonly [K in keyof T]: Frozen<T[K]> } : T;
type Pair<T> = [T, T];
type Topic = 'story' | 'logic' | 'trend';
type Level = 'small' | 'medium' | 'large';
type TopicCard = { kind: 'topic'; topic: Topic; level: Level };
type ShoutCard = { kind: 'shout' };
type IgnoreCard = { kind: 'ignore' };
type Card = TopicCard | ShoutCard | IgnoreCard;
type Occurrence = Card & { token: string; tapeIndex: number };
const PROFILE = 'debate-topic-shout-ignore-reference-v1' as const;
const TAG = 'ignore-debate-session-v1' as const;
const MAX_ENTRIES = 4096, MAX_TAPE = 512, MAX_BYTES = 16 * 1024 * 1024;
const LEVELS = { small: { index: 0, damage: 10, stress: 10 }, medium: { index: 1, damage: 15, stress: 15 }, large: { index: 2, damage: 20, stress: 20 } } as const;
const POLICY = {
  id: 'ignore-debate-standalone-policy-v1', profile: PROFILE,
  cards: { id: 'topic-shout-and-ignore-only-v1', kinds: ['topic', 'shout', 'ignore'], topics: ['story', 'logic', 'trend'], levels: ['small', 'medium', 'large'], topicPower: '1+levelIndex+10-if-current-topic', topicLevelCoefficients: [10, 15, 20], topicStressCoefficients: [10, 15, 20], drawStressEach: 15 },
  shout: { id: 'source-no-anger-shout-v1', power: 110, levelCoefficient: 15, topicCoefficient: 12, stressCoefficient: 15, availability: 'angerTimer-zero-only', additionalEffect: 'none' },
  ignore: { id: 'source-no-anger-ignore-v1', power: 120, stressDamage: 30, hpDamage: 0, damageJitter: false, availability: 'angerTimer-zero-only', additionalEffect: 'none', suppressOpponentAdditionalEffect: true, suppressionScope: 'vacuous-for-admitted-cards' },
  identities: { id: 'generic-identity-debate-hooks-v1', realPersonMapping: false, allPersonHooks: 'identity-or-disabled', attackHook: 'identity', hpDamageHook: 'identity', difficulty: 'source-normal', items: false, personality: false },
  initialTopic: { id: 'provided-initial-topic-v1', generated: false },
  deal: { id: 'provided-ordered-card-tapes-v1', shuffle: false, nativeDistribution: false, token: 'participantId:tapeIndex', order: 'tape-order-stable-retained-hand', sourceDisplaySort: false },
  hand: { id: 'source-reserved-rethink-slot-v1', intelligenceThresholds: [70, 80, 90], sourceSlotCounts: [4, 5, 6, 7], playableCapacities: [3, 4, 5, 6], reservedRethinkSlots: 1, rethinkPlayable: false },
  round: { id: 'paired-choice-atomic-round-v1', action: 'ResolveIgnoreDebateRound', choicesOrder: 'scenario-participant-order', resolutionOrder: 'first-then-other-recorded-only', firstDamageBonus: false, hpDamageWinnerDrawCount: 1, equalPowerDrawCount: 0, ignoreWinnerDrawCount: 0, noDrawReasons: ['equal-card-power', 'ignore-no-hp-damage'] },
  topic: { id: 'source-topic-shout-or-ignore-winner-follow-v1', damageTopic: 'round-start', nonterminalTopicWinnerSets: ['firstId', 'currentTopic'], nonterminalShoutWinnerSets: ['firstId'], nonterminalShoutKeeps: ['currentTopic'], nonterminalIgnoreWinnerSets: ['firstId'], nonterminalIgnoreKeeps: ['currentTopic'], drawKeeps: ['firstId', 'currentTopic'] },
  arithmetic: { id: 'source-normal-integer-topic-shout-damage-v1', attack: '100+trunc(40*(myINT-opponentINT)/(131-myINT))', hpDamage: 'trunc((attack+jitter)*10*levelCoef*topicCoef/1000)', division: 'toward-zero', intermediate: 'exact-bigint', matchingTopicCoefficient: 10, nonmatchingTopicCoefficient: 6, angerCoefficient: 10, jitterBound: 5, nativePrng: false },
  writer: { id: 'source-hp-minus100-to1000-stress0-to100-v1', hpMin: -100, hpMax: 1000, stressMin: 0, stressMax: 100 },
  anger: { id: 'reject-nonterminal-anger-trigger-v1', triggerStress: 100, rejection: 'whole-round-atomic', cap99: false, reset: false, skip: false },
  closing: { id: 'session-result-only-closing-v1', defeatHp: 0, priority: ['hp-defeat', 'unsupported-anger-trigger', 'crumble', 'topic-and-first', 'refill'], terminalRefill: false, terminalTopicChange: false, terminalFirstChange: false, campaignWrite: false },
  opening: { id: 'no-opening-instant-win-v1', initialHp: 1000, initialStress: 0, initialAngerTimer: 0 },
  rethink: { id: 'no-rethink-v1', crumbleStep: 250, crumbleMax: 3, exposedAvailableAction: false },
  refill: { id: 'fill-next-round-from-tape-v1', fillOnlyVacancies: true, terminalRefill: false, insufficientTape: 'whole-round-atomic-rejection' },
  capacity: { id: 'bounded-session-reject-v1', maxEntries: MAX_ENTRIES, maxTapePerParticipant: MAX_TAPE, maxCanonicalUtf8Bytes: MAX_BYTES, maxInputNodes: 1_000_000, maxInputDepth: 32, exhaustion: 'rejection-not-game-draw' },
  persistence: { id: 'full-policy-genesis-recompute-v1', policyComparison: 'all-fields', genesisSnapshot: 'recompute', receipts: 'compare-all-fields', snapshot: 'compare-all-fields' },
} as const;
type Policy = typeof POLICY;
const EVIDENCE = {
  formulaEvidence: 'reverse-transcribed-cross-validated', formulaEvidenceScope: 'existing-E15-generic-ordinary-core-only',
  shoutEvidence: 'pinned-modern-translated-reference-only', shoutEvidenceScope: 'no-anger-generic-topic-and-shout-subset',
  ignoreEvidence: 'pinned-modern-translated-reference-only', ignoreEvidenceScope: 'no-anger-generic-topic-shout-and-ignore-subset',
  stateMachineEvidence: 'pinned-modern-translated-reference', dealPolicyEvidence: 'provided-sequence-engine-policy', sessionEvidence: 'bounded-modern-reference-subset',
  sourceIdentity: 'modern-CSharp-translation-not-native-or-Vanilla',
  sourceCommit: 'a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef', debateBlob: '0137498d10773cd4596d497083ccdf6a26b3a261', debatePhaseBlob: '6aa98f855a5d4d172cde7e8ffc18a141b8a7b587',
  nativeEquivalent: false, stockOriginalVerified: false, completeDebate: false, originalUnresolvedGroups: 43,
  genericIdentity: 'engine-restricted-source-identity-hooks', initialTopic: 'provided-engine-policy', pairedChoice: 'atomic-engine-policy', capacityAndPersistence: 'engine-policy',
  rhetoric: 'shout-and-ignore-only-other-rhetoric-excluded', cardAvailability: 'source-no-anger-restricted', ignoreEffectSuppression: 'source-return-before-opponent-effect-vacuous-for-admitted-cards', angerAndPersonality: 'unsupported-boundary', rethink: 'excluded', realPersonExceptions: 'excluded', closingConsequences: 'excluded', nativeWholeChain: 'open',
} as const;
type Evidence = typeof EVIDENCE;
type Participant = { id: string; resolvedIntelligence: number; hp: 1000; stress: 0; angerTimer: 0; cardTape: Card[] };
type Scenario = { schemaVersion: 1; profile: typeof PROFILE; genericOnly: true; difficulty: 'source-normal'; policies: Policy; challengerId: string; initialTopic: Topic; participants: Pair<Participant> };
type ParticipantState = { id: string; resolvedIntelligence: number; attack: number; hp: number; stress: number; angerTimer: 0; sourceSlotCount: number; playableHandCapacity: number; reservedRethinkSlot: true; crumbledLevel: number; hand: Occurrence[]; deckCursor: number };
type Outcome = { kind: 'hp-defeat'; winnerId: string; loserId: string };
type Snapshot = { schemaVersion: 1; profile: typeof PROFILE; revision: number; roundIndex: number; currentTopic: Topic; firstId: string; status: 'active' | 'finished'; outcome: Outcome | null; participants: Pair<ParticipantState> };
type RawDraw = { role: 'psychological-damage-jitter'; bound: 5; value: number };
type Selection = { participantId: string; cardToken: string };
type Command = { type: 'ResolveIgnoreDebateRound'; expectedRevision: number; expectedRoundIndex: number; expectedFirstId: string; choices: Pair<Selection>; rawDraws: RawDraw[] };
type Play = { participantId: string; card: Occurrence; attack: number; power: number; matchesCurrentTopic: boolean };
type Change = { participantId: string; beforeHp: number; afterHp: number; requestedHpDamage: number; actualHpDelta: number; beforeStress: number; afterStress: number; requestedStress: number; actualStressDelta: number; beforeCrumbledLevel: number; afterCrumbledLevel: number; consumedCard: Occurrence; refilledCards: Occurrence[]; beforeDeckCursor: number; afterDeckCursor: number };
type Damage = { sourceId: string; targetId: string; attack: number; jitter: number; angerCoefficient: 10; levelCoefficient: number; topicCoefficient: number; requestedHpDamage: number };
type Receipt = {
  schemaVersion: 1; profile: typeof PROFILE; command: Command; policy: Policy; evidence: Evidence;
  beforeRevision: number; afterRevision: number; beforeRoundIndex: number; afterRoundIndex: number; beforeFirstId: string; afterFirstId: string; beforeTopic: Topic; afterTopic: Topic;
  orderedIds: Pair<string>; plays: Pair<Play>; result: 'winner' | 'draw'; roundWinnerId: string | null;
  damage: Damage | null;
  changes: Pair<Change>; consumedDraws: RawDraw[]; drawCount: 0 | 1; noDrawReason: 'equal-card-power' | 'ignore-no-hp-damage' | null;
  terminal: boolean; crumbleEvaluated: boolean; refillApplied: boolean; outcome: Outcome | null;
};
type Entry = { command: Command; receipt: Receipt };
type Genesis = { scenario: Scenario; snapshot: Snapshot };
type Session = { tag: typeof TAG; policy: Policy; evidence: Evidence; genesis: Genesis; snapshot: Snapshot; entries: Entry[] };
type Failure = { ok: false; reason: string; index: number | null };
type SessionResult = { ok: true; session: Session } | Failure;
type ExecuteResult = { ok: true; session: Session; receipt: Receipt } | Failure;
type PreviewResult = { ok: true; preview: { receipt: Receipt; projectedSnapshot: Snapshot; policy: Policy; evidence: Evidence; externalRngConsumed: 0 } } | Failure;
type SaveResult = { ok: true; json: string } | Failure;
type InspectionResult = { ok: true; inspection: { snapshot: Snapshot; policy: Policy; evidence: Evidence; entryCount: number; remainingEntryCapacity: number; canonicalUtf8Bytes: number } } | Failure;
export type IgnoreDebateTopicV1 = Topic;
export type IgnoreDebateLevelV1 = Level;
export type IgnoreDebateTopicCardV1 = Frozen<TopicCard>;
export type IgnoreDebateShoutCardV1 = Frozen<ShoutCard>;
export type IgnoreDebateIgnoreCardV1 = Frozen<IgnoreCard>;
export type IgnoreDebateCardV1 = Frozen<Card>;
export type IgnoreDebateCardOccurrenceV1 = Frozen<Occurrence>;
export type IgnoreDebateParticipantV1 = Frozen<Participant>;
export type IgnoreDebateParticipantStateV1 = Frozen<ParticipantState>;
export type IgnoreDebateScenarioV1 = Frozen<Scenario>;
export type IgnoreDebateSnapshotV1 = Frozen<Snapshot>;
export type IgnoreDebateCommandV1 = Frozen<Command>;
export type IgnoreDebateRawDrawV1 = Frozen<RawDraw>;
export type IgnoreDebateSelectionV1 = Frozen<Selection>;
export type IgnoreDebatePlayV1 = Frozen<Play>;
export type IgnoreDebateChangeV1 = Frozen<Change>;
export type IgnoreDebateDamageV1 = Frozen<Damage>;
export type IgnoreDebateOutcomeV1 = Frozen<Outcome>;
export type IgnoreDebateEntryV1 = Frozen<Entry>;
export type IgnoreDebateGenesisV1 = Frozen<Genesis>;
export type IgnoreDebateSessionV1 = Frozen<Session>;
export type IgnoreDebatePolicyV1 = Frozen<Policy>;
export type IgnoreDebateEvidenceV1 = Frozen<Evidence>;
export type IgnoreDebateReceiptV1 = Frozen<Receipt>;
export type IgnoreDebateFailureV1 = Frozen<Failure>;
export type IgnoreDebateSessionResultV1 = Frozen<SessionResult>;
export type IgnoreDebateExecuteResultV1 = Frozen<ExecuteResult>;
export type IgnoreDebatePreviewResultV1 = Frozen<PreviewResult>;
export type IgnoreDebateSaveResultV1 = Frozen<SaveResult>;
export type IgnoreDebateInspectionResultV1 = Frozen<InspectionResult>;
export type IgnoreDebateReplayResultV1 = Frozen<SessionResult>;

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
function id(v: unknown): string { if (typeof v !== 'string' || !/^[A-Za-z][A-Za-z0-9_-]{0,63}$/.test(v)) fail('unsupported-person'); return v; }
function topic(v: unknown): Topic { return choice(v, ['story', 'logic', 'trend'], 'unsupported-card'); }
function card(v: unknown): Card {
  if (v === null || typeof v !== 'object' || Array.isArray(v)) fail('malformed-data');
  const kind = choice((v as Record<string, unknown>).kind, ['topic', 'shout', 'ignore'], 'unsupported-card');
  if (kind === 'shout') { object(v, ['kind']); return { kind }; }
  if (kind === 'ignore') { object(v, ['kind']); return { kind }; }
  const r = object(v, ['kind', 'topic', 'level']);
  return { kind, topic: topic(r.topic), level: choice(r.level, ['small', 'medium', 'large'], 'unsupported-card') };
}
function participant(v: unknown): Participant {
  const r = object(v, ['id', 'resolvedIntelligence', 'hp', 'stress', 'angerTimer', 'cardTape']);
  if (r.hp !== 1000 || r.stress !== 0 || r.angerTimer !== 0) fail('unsupported-initial-state');
  return { id: id(r.id), resolvedIntelligence: integer(r.resolvedIntelligence, 100, 1), hp: 1000, stress: 0, angerTimer: 0, cardTape: array(r.cardTape, MAX_TAPE).map(card) };
}
function parseScenario(v: unknown): Scenario {
  const r = object(v, ['schemaVersion', 'profile', 'genericOnly', 'difficulty', 'policies', 'challengerId', 'initialTopic', 'participants']);
  if (r.schemaVersion !== 1 || r.profile !== PROFILE || r.difficulty !== 'source-normal') fail('unsupported-profile');
  if (r.genericOnly !== true) fail('unsupported-person');
  if (!same(r.policies, POLICY)) fail('unsupported-policy');
  const participants = pair(r.participants, participant), challengerId = id(r.challengerId);
  if (participants[0].id === participants[1].id) fail('duplicate-participant');
  if (!participants.some(p => p.id === challengerId)) fail('invalid-challenger');
  return { schemaVersion: 1, profile: PROFILE, genericOnly: true, difficulty: 'source-normal', policies: clone(POLICY), challengerId, initialTopic: topic(r.initialTopic), participants };
}
function parseCommand(v: unknown): Command {
  if (v === null || typeof v !== 'object' || Array.isArray(v)) fail('malformed-data');
  if ((v as Record<string, unknown>).type !== 'ResolveIgnoreDebateRound') fail('unsupported-action');
  const r = object(v, ['type', 'expectedRevision', 'expectedRoundIndex', 'expectedFirstId', 'choices', 'rawDraws']);
  const choices = pair(r.choices, value => { const s = object(value, ['participantId', 'cardToken']); if (typeof s.cardToken !== 'string' || !/^[A-Za-z][A-Za-z0-9_-]{0,63}:(0|[1-9][0-9]{0,2})$/.test(s.cardToken)) fail('invalid-token'); return { participantId: id(s.participantId), cardToken: s.cardToken }; });
  if (choices[0].cardToken === choices[1].cardToken) fail('duplicate-token');
  if (choices[0].participantId === choices[1].participantId) fail('duplicate-participant');
  if (!Array.isArray(r.rawDraws) || r.rawDraws.length > 1) fail('draw-shape');
  const rawDraws = r.rawDraws.map((v): RawDraw => { const d = object(v, ['role', 'bound', 'value']); if (d.role !== 'psychological-damage-jitter' || d.bound !== 5) fail('draw-shape'); return { role: 'psychological-damage-jitter', bound: 5, value: integer(d.value, 4, 0, 'draw-range') }; });
  return { type: 'ResolveIgnoreDebateRound', expectedRevision: integer(r.expectedRevision, MAX_ENTRIES), expectedRoundIndex: integer(r.expectedRoundIndex, MAX_ENTRIES), expectedFirstId: id(r.expectedFirstId), choices, rawDraws };
}
function div(n: bigint, d: bigint): number { return Number(n / d); }
function clamp(n: number, low: number, high: number): number { return Math.max(low, Math.min(high, n)); }
function handCapacity(intelligence: number): number { return intelligence < 70 ? 3 : intelligence < 80 ? 4 : intelligence < 90 ? 5 : 6; }
function refill(p: ParticipantState, source: Participant): Occurrence[] {
  const needed = p.playableHandCapacity - p.hand.length;
  if (source.cardTape.length - p.deckCursor < needed) fail('deck-exhausted');
  const drawn: Occurrence[] = [];
  for (let i = 0; i < needed; i++) { const tapeIndex = p.deckCursor++, next: Occurrence = { ...source.cardTape[tapeIndex]!, token: `${p.id}:${tapeIndex}`, tapeIndex }; p.hand.push(next); drawn.push(clone(next)); }
  return drawn;
}
function initialParticipant(p: Participant, other: Participant): ParticipantState {
  const playableHandCapacity = handCapacity(p.resolvedIntelligence);
  const state: ParticipantState = { id: p.id, resolvedIntelligence: p.resolvedIntelligence, attack: 100 + div(40n * BigInt(p.resolvedIntelligence - other.resolvedIntelligence), BigInt(131 - p.resolvedIntelligence)), hp: 1000, stress: 0, angerTimer: 0, playableHandCapacity, sourceSlotCount: playableHandCapacity + 1, reservedRethinkSlot: true, crumbledLevel: 0, hand: [], deckCursor: 0 };
  refill(state, p); return state;
}
function initialSession(scenario: Scenario): Session {
  const snapshot: Snapshot = { schemaVersion: 1, profile: PROFILE, revision: 0, roundIndex: 0, currentTopic: scenario.initialTopic, firstId: scenario.challengerId, status: 'active', outcome: null, participants: [initialParticipant(scenario.participants[0], scenario.participants[1]), initialParticipant(scenario.participants[1], scenario.participants[0])] };
  return { tag: TAG, policy: clone(POLICY), evidence: clone(EVIDENCE), genesis: { scenario: clone(scenario), snapshot: clone(snapshot) }, snapshot, entries: [] };
}
/** Pure, all-or-nothing topic/Shout/Ignore round. HP closing MUST precede anger and refill. */
function resolve(s: Snapshot, scenario: Scenario, c: Command): { snapshot: Snapshot; receipt: Receipt } {
  if (s.status === 'finished') fail('session-finished');
  if (c.expectedRevision !== s.revision) fail('stale-revision');
  if (c.expectedRoundIndex !== s.roundIndex) fail('stale-round');
  if (c.expectedFirstId !== s.firstId) fail('stale-first');
  function select(i: 0 | 1): Play {
    const p = s.participants[i], selected = c.choices[i];
    if (selected.participantId !== p.id) fail('invalid-choice-order');
    const selectedCard = p.hand.find(card => card.token === selected.cardToken);
    if (!selectedCard) fail('not-in-hand');
    // Source availability's personality-dependent guards require angerTimer > 0,
    // unreachable in this genesis-recomputed profile. Shout and Ignore have no topic.
    const matchesCurrentTopic = selectedCard.kind === 'topic' && selectedCard.topic === s.currentTopic;
    const power = selectedCard.kind === 'ignore' ? POLICY.ignore.power : selectedCard.kind === 'shout' ? POLICY.shout.power : 1 + LEVELS[selectedCard.level].index + (matchesCurrentTopic ? 10 : 0);
    return { participantId: p.id, card: clone(selectedCard), attack: p.attack, power, matchesCurrentTopic };
  }
  const plays: Pair<Play> = [select(0), select(1)];
  const winner: 0 | 1 | null = plays[0].power === plays[1].power ? null : plays[0].power > plays[1].power ? 0 : 1;
  const ignoreWins = winner !== null && plays[winner].card.kind === 'ignore';
  const drawCount: 0 | 1 = winner === null || ignoreWins ? 0 : 1;
  const noDrawReason: Receipt['noDrawReason'] = winner === null ? 'equal-card-power' : ignoreWins ? 'ignore-no-hp-damage' : null;
  if (c.rawDraws.length !== drawCount) fail('draw-shape');
  const participants = clone(s.participants);
  const requestedDamage: Pair<number> = [0, 0], requestedStress: Pair<number> = [0, 0];
  let damage: Receipt['damage'] = null;
  // This includes same-card Shout/Ignore ties: no HP damage, no jitter, +15 stress each.
  if (winner === null) { requestedStress[0] = 15; requestedStress[1] = 15; }
  else {
    const loser = winner === 0 ? 1 : 0, play = plays[winner];
    if (play.card.kind === 'ignore') {
      // Source Attack calls Ignore(team, 30), not CalcHpDamage: no HP or jitter.
      // Aggregate Effect suppresses the opponent effect. All admitted cards have none.
      requestedStress[loser] = POLICY.ignore.stressDamage;
    } else {
      const jitter = c.rawDraws[0]!.value;
      const levelCoefficient = play.card.kind === 'shout' ? POLICY.shout.levelCoefficient : LEVELS[play.card.level].damage;
      const topicCoefficient = play.card.kind === 'shout' ? POLICY.shout.topicCoefficient : play.matchesCurrentTopic ? 10 : 6;
      const requestedHpDamage = div(BigInt(play.attack + jitter) * 10n * BigInt(levelCoefficient) * BigInt(topicCoefficient), 1000n);
      requestedDamage[loser] = requestedHpDamage;
      requestedStress[loser] = play.card.kind === 'shout' ? POLICY.shout.stressCoefficient : LEVELS[play.card.level].stress;
      // Source Attack applies Shout once; Effect has no Shout branch.
      damage = { sourceId: play.participantId, targetId: participants[loser].id, attack: play.attack, jitter, angerCoefficient: 10, levelCoefficient, topicCoefficient, requestedHpDamage };
    }
  }
  for (const i of [0, 1] as const) {
    participants[i].hand = participants[i].hand.filter(card => card.token !== plays[i].card.token);
    participants[i].hp = clamp(participants[i].hp - requestedDamage[i], -100, 1000);
    participants[i].stress = clamp(participants[i].stress + requestedStress[i], 0, 100);
  }
  let outcome: Outcome | null = null;
  if (winner !== null) { const loser = winner === 0 ? 1 : 0; if (participants[loser].hp <= 0) outcome = { kind: 'hp-defeat', winnerId: participants[winner].id, loserId: participants[loser].id }; }
  const refilled: Pair<Occurrence[]> = [[], []];
  let currentTopic = s.currentTopic, firstId = s.firstId;
  if (outcome === null) {
    if (participants.some(p => p.stress >= 100)) fail('unsupported-anger-trigger');
    for (const p of participants) p.crumbledLevel = clamp(div(BigInt(1000 - p.hp), 250n), 0, 3);
    if (winner !== null) {
      firstId = participants[winner].id;
      const winningCard = plays[winner].card;
      if (winningCard.kind === 'topic') currentTopic = winningCard.topic;
    }
    refilled[0] = refill(participants[0], scenario.participants[0]); refilled[1] = refill(participants[1], scenario.participants[1]);
  }
  const snapshot: Snapshot = { schemaVersion: 1, profile: PROFILE, revision: s.revision + 1, roundIndex: s.roundIndex + 1, currentTopic, firstId, status: outcome === null ? 'active' : 'finished', outcome, participants };
  function change(i: 0 | 1): Change { const before = s.participants[i], after = participants[i]; return { participantId: before.id, beforeHp: before.hp, afterHp: after.hp, requestedHpDamage: requestedDamage[i], actualHpDelta: after.hp - before.hp, beforeStress: before.stress, afterStress: after.stress, requestedStress: requestedStress[i], actualStressDelta: after.stress - before.stress, beforeCrumbledLevel: before.crumbledLevel, afterCrumbledLevel: after.crumbledLevel, consumedCard: clone(plays[i].card), refilledCards: refilled[i], beforeDeckCursor: before.deckCursor, afterDeckCursor: after.deckCursor }; }
  const otherId = s.participants[0].id === s.firstId ? s.participants[1].id : s.participants[0].id;
  const receipt: Receipt = {
    schemaVersion: 1, profile: PROFILE, command: clone(c), policy: clone(POLICY), evidence: clone(EVIDENCE),
    beforeRevision: s.revision, afterRevision: snapshot.revision, beforeRoundIndex: s.roundIndex, afterRoundIndex: snapshot.roundIndex, beforeFirstId: s.firstId, afterFirstId: firstId, beforeTopic: s.currentTopic, afterTopic: currentTopic,
    orderedIds: [s.firstId, otherId], plays, result: winner === null ? 'draw' : 'winner', roundWinnerId: winner === null ? null : participants[winner].id, damage,
    changes: [change(0), change(1)], consumedDraws: clone(c.rawDraws), drawCount, noDrawReason,
    terminal: outcome !== null, crumbleEvaluated: outcome === null, refillApplied: outcome === null, outcome: clone(outcome),
  };
  return { snapshot, receipt };
}
/** Preview, execute and replay all budget this identical complete proposed envelope. */
function append(s: Session, command: Command): { session: Session; receipt: Receipt } {
  if (s.entries.length >= MAX_ENTRIES) fail('history-limit');
  const next = resolve(s.snapshot, s.genesis.scenario, command);
  const session: Session = { tag: TAG, policy: clone(POLICY), evidence: clone(EVIDENCE), genesis: s.genesis, snapshot: next.snapshot, entries: [...s.entries, { command: clone(command), receipt: next.receipt }] };
  budget(session); return { session, receipt: next.receipt };
}
function parseSession(v: unknown): Session {
  const r = object(v, ['tag', 'policy', 'evidence', 'genesis', 'snapshot', 'entries']);
  if (r.tag !== TAG) fail('unsupported-profile');
  if (!same(r.policy, POLICY)) fail('unsupported-policy'); if (!same(r.evidence, EVIDENCE)) fail('evidence-mismatch');
  const genesis = object(r.genesis, ['scenario', 'snapshot']);
  let session = initialSession(parseScenario(genesis.scenario));
  if (!same(genesis.snapshot, session.snapshot)) fail('invalid-genesis');
  const entries = array(r.entries, MAX_ENTRIES);
  for (let index = 0; index < entries.length; index++) {
    try { const entry = object(entries[index], ['command', 'receipt']), next = append(session, parseCommand(entry.command)); if (!same(entry.receipt, next.receipt)) fail('receipt-mismatch'); session = next.session; }
    catch (e) { fail(failure(e).reason, index); }
  }
  if (!same(session.snapshot, r.snapshot)) fail('snapshot-mismatch'); budget(session); return session;
}
export const IGNORE_DEBATE_POLICY_V1: IgnoreDebatePolicyV1 = freeze(POLICY);
export const IGNORE_DEBATE_EVIDENCE_V1: IgnoreDebateEvidenceV1 = freeze(EVIDENCE);
export function createIgnoreDebate(input: unknown): IgnoreDebateSessionResultV1 {
  try { const session = initialSession(parseScenario(detach(input))); budget(session); return freeze({ ok: true, session } as SessionResult); } catch (e) { return freeze(failure(e)); }
}
export function inspectIgnoreDebate(input: unknown): IgnoreDebateInspectionResultV1 {
  try { const s = parseSession(detach(input)); return freeze({ ok: true, inspection: { snapshot: s.snapshot, policy: s.policy, evidence: s.evidence, entryCount: s.entries.length, remainingEntryCapacity: MAX_ENTRIES - s.entries.length, canonicalUtf8Bytes: budget(s) } } as InspectionResult); } catch (e) { return freeze(failure(e)); }
}
export function previewIgnoreDebateRound(input: unknown, command: unknown): IgnoreDebatePreviewResultV1 {
  try { const s = parseSession(detach(input)), c = parseCommand(detach(command)), next = append(s, c); return freeze({ ok: true, preview: { receipt: next.receipt, projectedSnapshot: next.session.snapshot, policy: clone(POLICY), evidence: clone(EVIDENCE), externalRngConsumed: 0 } } as PreviewResult); } catch (e) { return freeze(failure(e)); }
}
export function executeIgnoreDebateRound(input: unknown, command: unknown): IgnoreDebateExecuteResultV1 {
  try { const s = parseSession(detach(input)), c = parseCommand(detach(command)), next = append(s, c); return freeze({ ok: true, ...next } as ExecuteResult); } catch (e) { return freeze(failure(e)); }
}
export function saveIgnoreDebate(input: unknown): IgnoreDebateSaveResultV1 {
  try { const s = parseSession(detach(input)); budget(s); return freeze({ ok: true, json: canonical(s) } as SaveResult); } catch (e) { return freeze(failure(e)); }
}
export function loadIgnoreDebate(json: unknown): IgnoreDebateSessionResultV1 {
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
export function replayIgnoreDebate(initialScenario: unknown, commands: unknown): IgnoreDebateReplayResultV1 {
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
