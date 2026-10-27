/**
 * Bounded nonterminal, non-tutorial TurnEnd -> unchanged public TurnStart.
 * The supplied attacker is the source debate attacker, not combo.attacker.
 * This is an engineering checkpoint transaction, not a runnable phase engine.
 */
import {
  evaluateDebateTurnStart,
  DEBATE_TURN_START_POLICY_V1,
  DEBATE_TURN_START_EVIDENCE_V1,
  type DebateTurnStartInputV1,
  type DebateTurnStartPersonalityV1,
  type DebateTurnStartCardCodeV1,
  type DebateTurnStartPhysicalCardV1,
  type DebateTurnStartRawDrawV1,
  type DebateTurnStartCharacterInputV1,
  type DebateTurnStartCharacterCheckpointV1,
  type DebateTurnStartReceiptV1,
  type DebateTurnStartFailureReasonV1,
} from './debate-turn-start.ts';

type Frozen<T> = T extends object ? { readonly [K in keyof T]: Frozen<T[K]> } : T;
type TeamIndex = 0 | 1;
type Attacker = -1 | TeamIndex;
type Personality = DebateTurnStartPersonalityV1;
type CardCode = DebateTurnStartCardCodeV1;
type PhysicalCard = DebateTurnStartPhysicalCardV1;
type PhysicalHand = [PhysicalCard, PhysicalCard, PhysicalCard, PhysicalCard, PhysicalCard, PhysicalCard, PhysicalCard];
type RawDraw = DebateTurnStartRawDrawV1;
type CharacterInput = DebateTurnStartCharacterInputV1;
type CharacterCheckpoint = DebateTurnStartCharacterCheckpointV1;
type MutableCharacter = {
  personality: Personality;
  angerTimer: number;
  maxCardCount: number;
  hand: PhysicalHand;
  playedCard: PhysicalCard;
  canRethink: boolean;
  crumbled: boolean;
  cardTape: CardCode[];
  deckCursor: number;
};
type TopicRawDraw = { role: 'debate-turn-end-topic-reroll'; bound: 3; value: number };

const PROFILE = 'debate-round-transition-reference-v1' as const;
const DECK_SIZE = 18;
const PHYSICAL_HAND_SIZE = 7;
const MAX_INPUT_NODES = 4096;
const MAX_INPUT_DEPTH = 16;
const MAX_INPUT_ARRAY_LENGTH = 32;
const MAX_CANONICAL_BYTES = 65536;

const POLICY = {
  id: 'debate-round-transition-bounded-current-deck-policy-v1',
  profile: PROFILE,
  mode: {
    kind: 'bounded-current-deck-round-transition',
    isTutorial: false,
    winner: -1,
    teamCount: 2,
    timerOrder: [0, 1],
    sequence: [
      'decrement-team-zero-positive-anger-timer',
      'decrement-team-one-positive-anger-timer',
      'if-original-attacker-valid-set-first-team',
      'if-original-attacker-topic-card-set-topic',
      'if-original-attacker-valid-and-any-unopposed-sophistry-reroll-topic-once',
      'evaluate-unchanged-public-TurnStart-once',
    ],
    nextCheckpoint: 'ready-for-play',
    checkpointLabel: 'engineering-result-not-source-phase-state-or-phase-loop',
    terminalMarker: 'winner-minus-one-engineering-route-precondition-not-source-TurnEnd-guard',
  },
  checkpoint: {
    firstTeam: [0, 1],
    attacker: [-1, 0, 1],
    currentTopic: { minimum: -2147483648, maximum: 2147483647 },
    characters: 'exact-pair-of-existing-TurnStart-character-inputs-including-rawDraws',
    personality: 'caller-resolved-timid-calm-bold-or-reckless',
    angerTimer: { minimum: 0, maximum: 4 },
    maxCardCount: { minimum: 4, maximum: 7 },
    physicalHandLength: PHYSICAL_HAND_SIZE,
    physicalCardRange: [-1, 14],
    activePlayableSlots: 'one-through-maxCardCount-minus-one',
    activePlayableCards: 'minus-one-vacancy-or-one-through-fourteen-no-zero',
    slotZeroAndInactiveTail: 'minus-one-through-fourteen-with-unchanged-TurnStart-treatment',
    playedCardRange: [-1, 14],
    booleans: 'canRethink-and-crumbled-required',
    cardTapeLength: DECK_SIZE,
    cardTapeRange: [1, 14],
    deckCursor: { minimum: 0, maximum: DECK_SIZE },
    domain: 'explicit-engineering-domain-not-reachability-proof',
  },
  timers: {
    positive: 'subtract-one-on-each-team-before-any-first-or-topic-work',
    zero: 'preserve-zero',
    expiration: 'audit-only-one-to-zero-during-TurnEnd-not-later-Bold-reset',
    attacker: 'never-recompute-after-decrement',
  },
  firstAndTopic: {
    gate: 'original-attacker-zero-or-one',
    noAttacker: 'skip-entire-first-ordinary-topic-and-Sophistry-block',
    firstTeam: 'set-to-original-attacker',
    ordinaryTopic: 'attacker-played-card-one-through-nine-maps-groups-of-three-to-zero-through-two',
    sophistry: 'any-team-played-eleven-and-opponent-played-not-twelve',
    sophistryDraws: 'one-if-any-qualifies-even-if-both-qualify',
    ordering: 'ordinary-topic-update-then-Sophistry-overwrite-including-same-topic',
    playedCards: 'original-values-retained-until-TurnStart-resets-them',
    attackerIdentity: 'debate-attacker-not-combo-attacker',
  },
  turnStart: {
    implementation: 'unchanged-evaluateDebateTurnStart',
    calls: 1,
    policy: DEBATE_TURN_START_POLICY_V1,
    input: 'decremented-timers-still-original-playedCards-and-all-other-character-fields',
    validation: 'complete-safe-outer-parse-before-single-dependency-call-no-probe-call',
    failure: 'propagate-typed-reason-and-discard-entire-transition',
    receipt: 'preserve-full-unchanged-receipt-and-all-nested-draw-indices',
    algorithms: 'no-copied-fill-Bold-quota-or-deck-generation',
  },
  randomness: {
    topicRawDraws: 'zero-or-one',
    topicRole: 'debate-turn-end-topic-reroll',
    topicBound: 3,
    topicValues: [0, 2],
    fillRawDraws: 'existing-zero-or-one-per-team-TurnStart-input',
    parsing: 'both-complete-characters-and-all-topic-and-fill-draw-syntax-before-evaluation',
    demand: 'TurnEnd-topic-demand-before-TurnStart-team-zero-then-team-one-fill-demand',
    auditOrder: ['turn-end-topic', 'turn-start-team-zero-fill', 'turn-start-team-one-fill'],
    wrapperIndices: 'flatDrawIndex-with-separate-turnStartFlatDrawIndex-and-localDrawIndex',
    nestedIndices: 'unchanged',
    externalRngConsumed: 0,
    callerCallbacks: 'excluded',
  },
  safety: {
    input: 'closed-schema-detached-safe-JSON-data-with-exact-policy',
    requiredRuntime: 'trusted-node-util-types-isProxy-via-process-getBuiltinModule',
    unavailableProxyDetector: 'fail-closed-before-inspecting-input',
    proxiesAccessorsAndExecutableValues: 'rejected-without-invocation',
    output: 'recursively-frozen-and-detached-from-caller',
    failure: 'typed-code-only-no-partial-timers-first-topic-or-fill-state',
  },
  capacity: {
    maxInputNodes: MAX_INPUT_NODES,
    maxInputDepth: MAX_INPUT_DEPTH,
    maxInputArrayLength: MAX_INPUT_ARRAY_LENGTH,
    maxCanonicalUtf8Bytes: MAX_CANONICAL_BYTES,
    turnStartCalls: 1,
    nestedHandFillCalls: 2,
    maxTopicDraws: 1,
    maxFillRepairDraws: 2,
    maxTotalDraws: 3,
  },
  boundary: {
    kind: 'standalone-nonterminal-non-tutorial-round-transition',
    winnerAndHitPoints: 'not-calculated-or-reclassified',
    attackerCalculation: 'excluded',
    damageAndAngerAction: 'excluded',
    comboAttacker: 'not-input-not-substituted-for-debate-attacker',
    tutorialBranch: 'excluded',
    deckGenerate: 'excluded-current-eighteen-card-tape-only',
    sourceLogsViewAndEngineCallbacks: 'not-executed',
    phaseSchedulingAndFullSession: 'excluded',
    persistence: 'excluded',
    p078: 'excluded',
    legacyProfilesChanged: false,
  },
} as const;
type Policy = typeof POLICY;

const EVIDENCE = {
  sourceIdentity: 'modern-CSharp-translation-not-native-or-Vanilla',
  repository: 'https://github.com/tankyc/sango_infinity',
  sourceCommit: 'a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef',
  debatePath: 'Project/Assets/Sango/Scripts/Game/Debate/Debate.cs',
  debateBlob: '0137498d10773cd4596d497083ccdf6a26b3a261',
  debateSha256: '622789ca8b8b6799a321526dcfb513d6622adf5b5d54025175c2a7795ef7da28',
  debatePhasePath: 'Project/Assets/Sango/Scripts/Game/Debate/DebatePhase.cs',
  debatePhaseBlob: '6aa98f855a5d4d172cde7e8ffc18a141b8a7b587',
  debateEnumPath: 'Project/Assets/Sango/Scripts/Game/Debate/DebateEnum.cs',
  debateEnumBlob: '5b46a8ac87613193eb9f4b99a25e489ba6f5e483',
  sourceTurnEndLines: [1083, 1126],
  sourceTimerDecrementLines: [394, 398],
  sourceGetCardTopicLines: [854, 872],
  sourceTurnEndPhaseLines: [261, 274],
  sourceTurnStartPhaseLines: [163, 168],
  sourceBehavior: 'both-timers-before-original-attacker-first-ordinary-topic-single-Sophistry-reroll',
  composition: 'source-phase-order-TurnEnd-then-TurnStart-without-executing-phase-engine',
  turnStart: DEBATE_TURN_START_EVIDENCE_V1,
  terminalMarker: 'winner-minus-one-is-engineering-route-precondition-not-source-TurnEnd-guard',
  attackerIdentity: 'source-debate-attacker-distinct-from-combo-attacker',
  domainBoundsSafetyBudgetsAuditAndReasonNames: 'engineering-policy-not-native-reachability-proof',
  nativeEquivalent: false,
  stockOriginalVerified: false,
  pkEquivalent: false,
  vanillaEquivalent: false,
  completeDebate: false,
  p078: 'excluded',
  nativeWholeChain: 'open',
  nativeDeckRegeneration: 'excluded',
  nativeRngStream: 'excluded',
  legacySessionIntegration: 'excluded',
} as const;
type Evidence = typeof EVIDENCE;

type Input = {
  schemaVersion: 1;
  profile: typeof PROFILE;
  policies: Policy;
  isTutorial: false;
  /** Engineering admission marker; not a condition in source TurnEnd. */
  winner: -1;
  firstTeam: TeamIndex;
  /** Already-resolved debate attacker, never combo.attacker. */
  attacker: Attacker;
  currentTopic: number;
  characters: [CharacterInput, CharacterInput];
  topicRawDraws: TopicRawDraw[];
};
type State = {
  isTutorial: false;
  winner: -1;
  firstTeam: TeamIndex;
  attacker: Attacker;
  currentTopic: number;
  characters: [CharacterCheckpoint, CharacterCheckpoint];
};
type TimerAudit = {
  teamIndex: TeamIndex;
  before: number;
  after: number;
  decrementApplied: boolean;
  expired: boolean;
};
type FirstTeamAudit = {
  attacker: Attacker;
  eligible: boolean;
  before: TeamIndex;
  after: TeamIndex;
  reason: 'attacker-minus-one' | 'attacker-selected';
};
type OrdinaryTopicAudit = {
  eligible: boolean;
  attackerCard: PhysicalCard | null;
  before: number;
  after: number;
  applied: boolean;
  reason: 'attacker-minus-one' | 'attacker-card-not-topic' | 'attacker-topic-card';
};
type SophistryTeamCheck = {
  teamIndex: TeamIndex;
  playedCard: PhysicalCard;
  opponentPlayedCard: PhysicalCard;
  isSophistry: boolean;
  blockedByIgnore: boolean;
  qualifies: boolean;
};
type SophistryAudit = {
  eligible: boolean;
  /** Null when the source attacker gate skipped the complete scan. */
  checks: [SophistryTeamCheck, SophistryTeamCheck] | null;
  qualifyingTeams: TeamIndex[];
  before: number;
  after: number;
  rerollApplied: boolean;
  reason: 'attacker-minus-one' | 'no-unopposed-sophistry' | 'single-topic-reroll';
  providedRawDraws: TopicRawDraw[];
  consumedDraws: TopicRawDraw[];
  drawCount: 0 | 1;
};
type TopicConsumedDraw = {
  flatDrawIndex: number;
  stage: 'turn-end-topic';
  teamIndex: null;
  localDrawIndex: 0;
  draw: TopicRawDraw;
};
type FillConsumedDraw = {
  flatDrawIndex: number;
  stage: 'turn-start-fill';
  teamIndex: TeamIndex;
  /** Original flat index in the unchanged TurnStart receipt. */
  turnStartFlatDrawIndex: number;
  /** Original local index in that team's unchanged fill receipt. */
  localDrawIndex: 0;
  draw: RawDraw;
};
type ConsumedDraw = TopicConsumedDraw | FillConsumedDraw;
type Receipt = {
  schemaVersion: 1;
  profile: typeof PROFILE;
  policy: Policy;
  evidence: Evidence;
  before: State;
  afterTurnEnd: State;
  after: State;
  timerOrder: [0, 1];
  timers: [TimerAudit, TimerAudit];
  firstTeam: FirstTeamAudit;
  ordinaryTopic: OrdinaryTopicAudit;
  sophistry: SophistryAudit;
  /** Complete, unmodified receipt from the one public TurnStart call. */
  turnStart: DebateTurnStartReceiptV1;
  turnStartDrawOffset: 0 | 1;
  consumedDraws: ConsumedDraw[];
  drawCount: 0 | 1 | 2 | 3;
  externalRngConsumed: 0;
};
type Success = {
  ok: true;
  schemaVersion: 1;
  profile: typeof PROFILE;
  policy: Policy;
  evidence: Evidence;
  state: State;
  characters: [CharacterCheckpoint, CharacterCheckpoint];
  /** Engineering label, not a source phase assignment or runnable session. */
  nextCheckpoint: 'ready-for-play';
  receipt: Receipt;
};
type FailureReason = DebateTurnStartFailureReasonV1
  | 'unsupported-terminal-checkpoint'
  | 'invalid-first-team'
  | 'invalid-attacker'
  | 'invalid-current-topic'
  | 'invalid-topic-raw-draws'
  | 'invalid-topic-raw-draw'
  | 'missing-topic-raw-draw'
  | 'unexpected-topic-raw-draw';
type Failure = { ok: false; reason: FailureReason };
type Result = Success | Failure;

export type DebateRoundTransitionTeamIndexV1 = TeamIndex;
export type DebateRoundTransitionAttackerV1 = Attacker;
export type DebateRoundTransitionPersonalityV1 = Personality;
export type DebateRoundTransitionCardCodeV1 = CardCode;
export type DebateRoundTransitionPhysicalCardV1 = PhysicalCard;
export type DebateRoundTransitionPhysicalHandV1 = Frozen<PhysicalHand>;
export type DebateRoundTransitionRawDrawV1 = RawDraw;
export type DebateRoundTransitionTopicRawDrawV1 = Frozen<TopicRawDraw>;
export type DebateRoundTransitionCharacterCheckpointV1 = CharacterCheckpoint;
export type DebateRoundTransitionCharacterInputV1 = CharacterInput;
export type DebateRoundTransitionInputV1 = Frozen<Input>;
export type DebateRoundTransitionStateV1 = Frozen<State>;
export type DebateRoundTransitionTimerAuditV1 = Frozen<TimerAudit>;
export type DebateRoundTransitionFirstTeamAuditV1 = Frozen<FirstTeamAudit>;
export type DebateRoundTransitionOrdinaryTopicAuditV1 = Frozen<OrdinaryTopicAudit>;
export type DebateRoundTransitionSophistryTeamCheckV1 = Frozen<SophistryTeamCheck>;
export type DebateRoundTransitionSophistryAuditV1 = Frozen<SophistryAudit>;
export type DebateRoundTransitionTopicConsumedDrawV1 = Frozen<TopicConsumedDraw>;
export type DebateRoundTransitionFillConsumedDrawV1 = Frozen<FillConsumedDraw>;
export type DebateRoundTransitionConsumedDrawV1 = Frozen<ConsumedDraw>;
export type DebateRoundTransitionReceiptV1 = Frozen<Receipt>;
export type DebateRoundTransitionSuccessV1 = Frozen<Success>;
export type DebateRoundTransitionFailureReasonV1 = FailureReason;
export type DebateRoundTransitionFailureV1 = Frozen<Failure>;
export type DebateRoundTransitionResultV1 = Frozen<Result>;
export type DebateRoundTransitionPolicyV1 = Frozen<Policy>;
export type DebateRoundTransitionEvidenceV1 = Frozen<Evidence>;

/** @internal Trusted metadata-free TurnStart dependency, never public input. */
export type DebateRoundTransitionTurnReceiptInternal = Pick<DebateTurnStartReceiptV1, 'consumedDraws'>;
export type DebateRoundTransitionTurnInternal<R extends DebateRoundTransitionTurnReceiptInternal> =
  (input: DebateTurnStartInputV1) => {
    characters: readonly [CharacterCheckpoint, CharacterCheckpoint]; receipt: R;
  };
export type DebateRoundTransitionBodyInternal<R extends DebateRoundTransitionTurnReceiptInternal> =
  Omit<Success, 'schemaVersion' | 'profile' | 'policy' | 'evidence' | 'receipt'> & {
    receipt: Omit<Receipt, 'schemaVersion' | 'profile' | 'policy' | 'evidence' | 'turnStart'> & { turnStart: R };
  };

class Invalid extends Error {
  readonly reason: FailureReason;
  constructor(reason: FailureReason) { super(reason); this.reason = reason; }
}
function fail(reason: FailureReason): never { throw new Invalid(reason); }
function failure(error: unknown): Failure {
  return { ok: false, reason: error instanceof Invalid ? error.reason : 'malformed-data' };
}
function freeze<T>(value: T): Frozen<T> {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value as Frozen<T>;
}
/** Only detached JSON data or trusted constants reach this helper. */
function canonical(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  const record = value as Record<string, unknown>;
  return '{' + Object.keys(record).sort().map(key => JSON.stringify(key) + ':' + canonical(record[key])).join(',') + '}';
}
function utf8Bytes(value: string): number {
  let bytes = 0;
  for (const character of value) {
    const point = character.codePointAt(0)!;
    bytes += point <= 0x7f ? 1 : point <= 0x7ff ? 2 : point <= 0xffff ? 3 : 4;
  }
  return bytes;
}
function getProxyDetector(): ((value: unknown) => boolean) | null {
  try {
    const runtime = globalThis as {
      process?: { getBuiltinModule?: (id: string) => { types?: { isProxy?: (value: unknown) => boolean } } };
    };
    if (typeof runtime.process?.getBuiltinModule !== 'function') return null;
    const detector = runtime.process.getBuiltinModule('node:util').types?.isProxy;
    return typeof detector === 'function' ? detector : null;
  } catch {
    return null;
  }
}
const proxyDetector = getProxyDetector();

/**
 * Inspect descriptors only after rejecting proxies. No caller property getter
 * or executable value is invoked. All acyclic shared values are copied again.
 */
function detach(value: unknown): unknown {
  if (!proxyDetector) fail('unsupported-runtime');
  let nodes = 0, bytes = 0;
  const active = new Set<object>();
  function visit(current: unknown, depth: number): unknown {
    if (++nodes > MAX_INPUT_NODES || depth > MAX_INPUT_DEPTH) fail('input-limit');
    if (current === null || typeof current === 'boolean') return current;
    if (typeof current === 'string') {
      if (current.length > MAX_CANONICAL_BYTES) fail('input-limit');
      bytes += utf8Bytes(current);
      if (bytes > MAX_CANONICAL_BYTES) fail('input-limit');
      return current;
    }
    if (typeof current === 'number') {
      if (!Number.isSafeInteger(current) || Object.is(current, -0)) fail('malformed-data');
      return current;
    }
    if (typeof current !== 'object' || proxyDetector!(current) || active.has(current)) fail('malformed-data');
    const isArray = Array.isArray(current);
    const prototype = Object.getPrototypeOf(current);
    if (prototype !== (isArray ? Array.prototype : Object.prototype) && !(prototype === null && !isArray)) fail('malformed-data');
    const keys = Reflect.ownKeys(current);
    if (keys.length > MAX_INPUT_NODES) fail('input-limit');
    const descriptors = Object.getOwnPropertyDescriptors(current);
    for (const key of keys) {
      if (typeof key !== 'string') fail('malformed-data');
      const descriptor = descriptors[key]!;
      if (!Object.hasOwn(descriptor, 'value') || (!descriptor.enumerable && !(isArray && key === 'length'))) fail('malformed-data');
      if (key.length > MAX_CANONICAL_BYTES) fail('input-limit');
      bytes += utf8Bytes(key);
      if (bytes > MAX_CANONICAL_BYTES) fail('input-limit');
    }
    active.add(current);
    try {
      if (isArray) {
        const length = descriptors.length!.value as number;
        if (length > MAX_INPUT_ARRAY_LENGTH) fail('input-limit');
        if (keys.length !== length + 1) fail('malformed-data');
        const detached: unknown[] = [];
        for (let index = 0; index < length; index++) {
          const descriptor = descriptors[String(index)];
          if (!descriptor) fail('malformed-data');
          detached.push(visit(descriptor.value, depth + 1));
        }
        return detached;
      }
      const detached: Record<string, unknown> = {};
      for (const key of keys as string[]) {
        Object.defineProperty(detached, key, {
          value: visit(descriptors[key]!.value, depth + 1),
          enumerable: true, configurable: true, writable: true,
        });
      }
      return detached;
    } finally {
      active.delete(current);
    }
  }
  const result = visit(value, 0);
  if (utf8Bytes(canonical(result)) > MAX_CANONICAL_BYTES) fail('input-limit');
  return result;
}
function object(value: unknown, keys: readonly string[], reason: FailureReason = 'malformed-data'): Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) fail(reason);
  const record = value as Record<string, unknown>;
  if (Object.keys(record).some(key => !keys.includes(key))) fail('unknown-field');
  if (keys.some(key => !Object.hasOwn(record, key))) fail('malformed-data');
  return record;
}
/** All nonintegral and unsafe numbers have already failed detachment. */
function integer(value: unknown, minimum: number, maximum: number, reason: FailureReason): number {
  if (typeof value !== 'number' || value < minimum || value > maximum) fail(reason);
  return value;
}
function parseHand(value: unknown, maxCardCount: number): PhysicalHand {
  if (!Array.isArray(value) || value.length !== PHYSICAL_HAND_SIZE) fail('invalid-hand');
  return value.map((entry, slot) => {
    const card = integer(entry, -1, 14, 'invalid-hand') as PhysicalCard;
    if (slot > 0 && slot < maxCardCount && card === 0) fail('invalid-hand');
    return card;
  }) as PhysicalHand;
}
function parseFillRawDraw(value: unknown): RawDraw {
  const record = object(value, ['role', 'bound', 'value'], 'invalid-raw-draw');
  if (record.role !== 'debate-fill-topic-repair' || record.bound !== 9) fail('invalid-raw-draw');
  return { role: 'debate-fill-topic-repair', bound: 9, value: integer(record.value, 0, 8, 'invalid-raw-draw') };
}
function parseTopicRawDraw(value: unknown): TopicRawDraw {
  const record = object(value, ['role', 'bound', 'value'], 'invalid-topic-raw-draw');
  if (record.role !== 'debate-turn-end-topic-reroll' || record.bound !== 3) fail('invalid-topic-raw-draw');
  return { role: 'debate-turn-end-topic-reroll', bound: 3, value: integer(record.value, 0, 2, 'invalid-topic-raw-draw') };
}
/** Boundary parsing duplicates no TurnStart evaluation algorithm. */
function parseCharacter(value: unknown): CharacterInput {
  const record = object(value, [
    'personality', 'angerTimer', 'maxCardCount', 'hand', 'playedCard',
    'canRethink', 'crumbled', 'cardTape', 'deckCursor', 'rawDraws',
  ], 'invalid-characters');
  if (record.personality !== 'timid' && record.personality !== 'calm' && record.personality !== 'bold' && record.personality !== 'reckless') fail('invalid-personality');
  const angerTimer = integer(record.angerTimer, 0, 4, 'invalid-anger-timer');
  const maxCardCount = integer(record.maxCardCount, 4, 7, 'invalid-max-card-count');
  const hand = parseHand(record.hand, maxCardCount);
  const playedCard = integer(record.playedCard, -1, 14, 'invalid-played-card') as PhysicalCard;
  if (typeof record.canRethink !== 'boolean') fail('invalid-can-rethink');
  if (typeof record.crumbled !== 'boolean') fail('invalid-crumbled');
  if (!Array.isArray(record.cardTape) || record.cardTape.length !== DECK_SIZE) fail('invalid-card-tape');
  const cardTape = record.cardTape.map(card => integer(card, 1, 14, 'unsupported-card-code') as CardCode);
  const deckCursor = integer(record.deckCursor, 0, DECK_SIZE, 'invalid-deck-cursor');
  if (!Array.isArray(record.rawDraws) || record.rawDraws.length > 1) fail('invalid-raw-draws');
  const rawDraws = record.rawDraws.map(parseFillRawDraw);
  return {
    personality: record.personality, angerTimer, maxCardCount, hand, playedCard,
    canRethink: record.canRethink, crumbled: record.crumbled, cardTape, deckCursor, rawDraws,
  };
}
function parseInput(value: unknown): Input {
  const record = object(value, [
    'schemaVersion', 'profile', 'policies', 'isTutorial', 'winner',
    'firstTeam', 'attacker', 'currentTopic', 'characters', 'topicRawDraws',
  ]);
  if (record.schemaVersion !== 1 || record.profile !== PROFILE) fail('unsupported-profile');
  if (canonical(record.policies) !== canonical(POLICY)) fail('unsupported-policy');
  if (record.isTutorial !== false) fail('unsupported-tutorial');
  if (record.winner !== -1) fail('unsupported-terminal-checkpoint');
  const firstTeam = integer(record.firstTeam, 0, 1, 'invalid-first-team') as TeamIndex;
  const attacker = integer(record.attacker, -1, 1, 'invalid-attacker') as Attacker;
  const currentTopic = integer(record.currentTopic, -2147483648, 2147483647, 'invalid-current-topic');
  if (!Array.isArray(record.characters) || record.characters.length !== 2) fail('invalid-characters');
  // Complete both teams and every supplied draw's syntax before demand checks.
  const characters: [CharacterInput, CharacterInput] = [
    parseCharacter(record.characters[0]), parseCharacter(record.characters[1]),
  ];
  if (!Array.isArray(record.topicRawDraws) || record.topicRawDraws.length > 1) fail('invalid-topic-raw-draws');
  const topicRawDraws = record.topicRawDraws.map(parseTopicRawDraw);
  return {
    schemaVersion: 1, profile: PROFILE, policies: POLICY, isTutorial: false,
    winner: -1, firstTeam, attacker, currentTopic, characters, topicRawDraws,
  };
}
/** Raw draws are evaluation inputs, not persistent character state. */
function copyCharacter(character: CharacterCheckpoint): MutableCharacter {
  return {
    personality: character.personality,
    angerTimer: character.angerTimer,
    maxCardCount: character.maxCardCount,
    hand: [...character.hand],
    playedCard: character.playedCard,
    canRethink: character.canRethink,
    crumbled: character.crumbled,
    cardTape: character.cardTape.slice(),
    deckCursor: character.deckCursor,
  };
}
function snapshot(
  input: Input,
  firstTeam: TeamIndex,
  currentTopic: number,
  characters: readonly [CharacterCheckpoint, CharacterCheckpoint],
): State {
  return {
    isTutorial: false, winner: -1, firstTeam, attacker: input.attacker, currentTopic,
    characters: [copyCharacter(characters[0]), copyCharacter(characters[1])],
  };
}
function decrementTimer(character: MutableCharacter, teamIndex: TeamIndex): TimerAudit {
  const before = character.angerTimer;
  const decrementApplied = before > 0;
  if (decrementApplied) character.angerTimer--;
  return { teamIndex, before, after: character.angerTimer, decrementApplied, expired: decrementApplied && character.angerTimer === 0 };
}
function checkSophistry(characters: [MutableCharacter, MutableCharacter], teamIndex: TeamIndex): SophistryTeamCheck {
  const playedCard = characters[teamIndex].playedCard;
  const opponentPlayedCard = characters[teamIndex === 0 ? 1 : 0].playedCard;
  const isSophistry = playedCard === 11;
  const blockedByIgnore = isSophistry && opponentPlayedCard === 12;
  return { teamIndex, playedCard, opponentPlayedCard, isSophistry, blockedByIgnore, qualifies: isSophistry && !blockedByIgnore };
}
function resolveBody<R extends DebateRoundTransitionTurnReceiptInternal>(input: Input, runTurnStart: DebateRoundTransitionTurnInternal<R>): DebateRoundTransitionBodyInternal<R> {
  const before = snapshot(input, input.firstTeam, input.currentTopic, input.characters);
  const characters: [MutableCharacter, MutableCharacter] = [
    copyCharacter(input.characters[0]), copyCharacter(input.characters[1]),
  ];
  // Both source timer calls precede first/topic work and all TurnStart work.
  const timers: [TimerAudit, TimerAudit] = [decrementTimer(characters[0], 0), decrementTimer(characters[1], 1)];
  const eligible = input.attacker !== -1;
  let firstTeam = input.firstTeam;
  let currentTopic = input.currentTopic;
  const firstTeamAudit: FirstTeamAudit = {
    attacker: input.attacker, eligible, before: firstTeam, after: firstTeam,
    reason: eligible ? 'attacker-selected' : 'attacker-minus-one',
  };
  const ordinaryTopic: OrdinaryTopicAudit = {
    eligible, attackerCard: null, before: currentTopic, after: currentTopic,
    applied: false, reason: eligible ? 'attacker-card-not-topic' : 'attacker-minus-one',
  };
  let checks: [SophistryTeamCheck, SophistryTeamCheck] | null = null;
  const qualifyingTeams: TeamIndex[] = [];
  if (input.attacker !== -1) {
    // Preserve this already-resolved attacker even if its timer just expired.
    firstTeam = input.attacker;
    firstTeamAudit.after = firstTeam;
    const card = characters[input.attacker].playedCard;
    ordinaryTopic.attackerCard = card;
    if (card >= 1 && card <= 9) {
      currentTopic = Math.floor((card - 1) / 3);
      ordinaryTopic.applied = true;
      ordinaryTopic.reason = 'attacker-topic-card';
    }
    ordinaryTopic.after = currentTopic;
    checks = [checkSophistry(characters, 0), checkSophistry(characters, 1)];
    for (const check of checks) if (check.qualifies) qualifyingTeams.push(check.teamIndex);
  }
  const topicBeforeReroll = currentTopic;
  const rerollApplied = qualifyingTeams.length > 0;
  const topicConsumedDraws: TopicRawDraw[] = [];
  // Demand semantics follow source order, after ALL syntax/domain parsing.
  if (rerollApplied) {
    if (input.topicRawDraws.length === 0) fail('missing-topic-raw-draw');
    const draw = input.topicRawDraws[0]!;
    currentTopic = draw.value; // SetTopic occurs even when the topic is equal.
    topicConsumedDraws.push(draw);
  } else if (input.topicRawDraws.length !== 0) {
    fail('unexpected-topic-raw-draw');
  }
  const sophistry: SophistryAudit = {
    eligible, checks, qualifyingTeams, before: topicBeforeReroll, after: currentTopic,
    rerollApplied,
    reason: !eligible ? 'attacker-minus-one' : rerollApplied ? 'single-topic-reroll' : 'no-unopposed-sophistry',
    providedRawDraws: input.topicRawDraws.slice(),
    consumedDraws: topicConsumedDraws,
    drawCount: topicConsumedDraws.length as 0 | 1,
  };
  const afterTurnEnd = snapshot(input, firstTeam, currentTopic, characters);
  // Exactly one trusted dependency call, with decremented timers and original
  // playedCards. The v1 adapter still uses the original public evaluator.
  const turnStart = runTurnStart({
    schemaVersion: 1,
    profile: 'debate-turn-start-reference-v1',
    policies: DEBATE_TURN_START_POLICY_V1,
    isTutorial: false,
    characters: [
      { ...characters[0], rawDraws: input.characters[0].rawDraws },
      { ...characters[1], rawDraws: input.characters[1].rawDraws },
    ],
  });
  const after = snapshot(input, firstTeam, currentTopic, turnStart.characters);
  const consumedDraws: ConsumedDraw[] = [];
  for (const draw of topicConsumedDraws) {
    consumedDraws.push({ flatDrawIndex: consumedDraws.length, stage: 'turn-end-topic', teamIndex: null, localDrawIndex: 0, draw });
  }
  const turnStartDrawOffset = consumedDraws.length as 0 | 1;
  for (const entry of turnStart.receipt.consumedDraws) {
    consumedDraws.push({
      flatDrawIndex: consumedDraws.length,
      stage: 'turn-start-fill',
      teamIndex: entry.teamIndex,
      turnStartFlatDrawIndex: entry.flatDrawIndex,
      localDrawIndex: entry.localDrawIndex,
      draw: entry.draw,
    });
  }
  return {
    ok: true,
    state: after, characters: after.characters, nextCheckpoint: 'ready-for-play',
    receipt: {
      before, afterTurnEnd, after, timerOrder: [0, 1], timers,
      firstTeam: firstTeamAudit, ordinaryTopic, sophistry,
      turnStart: turnStart.receipt, turnStartDrawOffset, consumedDraws,
      drawCount: consumedDraws.length as 0 | 1 | 2 | 3,
      externalRngConsumed: 0,
    },
  };
}

/** Internal body over the unchanged v1-shaped safe admission. */
export function resolveDebateRoundTransitionInternal<R extends DebateRoundTransitionTurnReceiptInternal>(
  input: unknown, runTurnStart: DebateRoundTransitionTurnInternal<R>,
): DebateRoundTransitionBodyInternal<R> {
  return resolveBody(parseInput(detach(input)), runTurnStart);
}
export function debateRoundTransitionFailureInternal(error: unknown): DebateRoundTransitionFailureV1 | null {
  return error instanceof Invalid ? freeze(failure(error)) : null;
}
function resolve(input: Input): Success {
  const body = resolveBody(input, (turnInput) => {
    const result = evaluateDebateTurnStart(turnInput);
    if (!result.ok) fail(result.reason);
    return result;
  });
  return {
    ok: true, schemaVersion: 1, profile: PROFILE, policy: POLICY, evidence: EVIDENCE,
    state: body.state, characters: body.characters, nextCheckpoint: body.nextCheckpoint,
    receipt: { schemaVersion: 1, profile: PROFILE, policy: POLICY, evidence: EVIDENCE, ...body.receipt },
  };
}

export const DEBATE_ROUND_TRANSITION_POLICY_V1: DebateRoundTransitionPolicyV1 = freeze(POLICY);
export const DEBATE_ROUND_TRANSITION_EVIDENCE_V1: DebateRoundTransitionEvidenceV1 = freeze(EVIDENCE);

/**
 * Pure, atomic bounded TurnEnd -> TurnStart transaction. Fully detaches and
 * parses both character inputs and every draw before source-ordered demand.
 * A failed dependency returns only its typed reason, not partial TurnEnd or
 * fill state. No external RNG, timer-based attacker recalculation, winner/HP
 * classification, tutorial, deck regeneration, or source phase loop is run.
 */
export function evaluateDebateRoundTransition(input: unknown): DebateRoundTransitionResultV1 {
  try {
    return freeze(resolve(parseInput(detach(input))));
  } catch (error) {
    return freeze(failure(error));
  }
}
