/**
 * Non-tutorial TurnStart composition from the pinned modern C# translation.
 * This evaluates two supplied checkpoints against their existing finite decks.
 * It does not create a debate session or prove that a checkpoint is reachable.
 * CharacterFillCards is reused unchanged; no deck generation is implemented.
 */
import {
  evaluateDebateHandFill,
  DEBATE_HAND_FILL_POLICY_V1,
  DEBATE_HAND_FILL_EVIDENCE_V1,
  type DebateHandFillInputV1,
  type DebateHandFillHandV1,
  type DebateHandFillCardCodeV1,
  type DebateHandFillRawDrawV1,
  type DebateHandFillReceiptV1,
  type DebateHandFillFailureReasonV1,
} from './debate-hand-fill.ts';

type Frozen<T> = T extends object ? { readonly [K in keyof T]: Frozen<T[K]> } : T;
type TeamIndex = 0 | 1;
type Personality = 'timid' | 'calm' | 'bold' | 'reckless';
type CardCode = DebateHandFillCardCodeV1;
type PhysicalCard = -1 | 0 | CardCode;
type PhysicalHand = [PhysicalCard, PhysicalCard, PhysicalCard, PhysicalCard, PhysicalCard, PhysicalCard, PhysicalCard];
type RawDraw = DebateHandFillRawDrawV1;
const PROFILE = 'debate-turn-start-reference-v1' as const;
const DECK_SIZE = 18;
const PHYSICAL_HAND_SIZE = 7;
const MAX_INPUT_NODES = 2048;
const MAX_INPUT_DEPTH = 12;
const MAX_INPUT_ARRAY_LENGTH = 32;
const MAX_CANONICAL_BYTES = 32768;

const POLICY = {
  id: 'debate-turn-start-bounded-current-deck-policy-v1',
  profile: PROFILE,
  mode: {
    kind: 'bounded-current-deck',
    isTutorial: false,
    tutorialHandling: 'explicit-false-required-true-rejected-not-skipped-fill',
    teamCount: 2,
    teamOrder: [0, 1],
    sequence: [
      'reset-played-card',
      'grant-rethink-if-crumbled',
      'grant-rethink-if-positive-timer-calm',
      'evaluate-unchanged-current-deck-hand-fill',
      'reset-positive-bold-timer-if-final-active-topic-count-zero',
      'clear-crumbled',
    ],
    ordering: 'entire-team-zero-sequence-before-entire-team-one-sequence',
  },
  checkpoint: {
    personality: 'caller-resolved-timid-calm-bold-or-reckless',
    angerTimer: { minimum: 0, maximum: 4 },
    maxCardCount: { minimum: 4, maximum: 7 },
    physicalHandLength: PHYSICAL_HAND_SIZE,
    physicalCardRange: [-1, 14],
    activePlayableSlots: 'one-through-maxCardCount-minus-one',
    activePlayableCards: 'minus-one-vacancy-or-one-through-fourteen-no-zero',
    slotZeroInput: 'any-minus-one-through-fourteen-restored-to-zero-by-fill',
    inactiveTail: 'any-minus-one-through-fourteen-preserved-without-fill-or-sort',
    playedCardRange: [-1, 14],
    booleans: 'canRethink-and-crumbled-required',
    cardTapeLength: DECK_SIZE,
    cardTapeRange: [1, 14],
    deckCursor: { minimum: 0, maximum: DECK_SIZE },
    domain: 'explicit-engineering-checkpoint-domain',
    reachability: 'not-a-proof-of-universal-or-source-reachable-state',
  },
  rethinkQuota: {
    operation: 'set-true-if-crumbled-or-positive-timer-calm-otherwise-preserve',
    falseAssignment: 'never',
    calmBonusAndRandomness: 'not-part-of-TurnStart',
  },
  fill: {
    implementation: 'unchanged-evaluateDebateHandFill',
    policy: DEBATE_HAND_FILL_POLICY_V1,
    mapping: 'active-minus-one-to-null-only',
    output: 'sorted-active-prefix-over-original-seven-slot-backing-tail',
    currentDeckOnly: true,
    cursorAtEighteen: 'accepted-with-no-vacancies-otherwise-unsupported-deck-regeneration',
    failure: 'propagate-typed-reason-and-discard-whole-two-team-result',
    nestedReceipt: 'preserve-unchanged-including-local-drawIndex-zero',
  },
  bold: {
    gate: 'positive-anger-timer-and-bold-personality',
    countSource: 'final-post-repair-active-prefix',
    countSlots: 'zero-through-maxCardCount-minus-one',
    topicCardRange: [1, 9],
    zeroCount: 'reset-anger-timer-to-zero',
    nonzeroCount: 'preserve-anger-timer',
    preRepairCount: 'never-use-nested-topicCardCountAfterFill-for-Bold',
  },
  randomness: {
    rawDrawsPerTeam: 'zero-or-one-existing-hand-fill-repair-draw',
    role: 'debate-fill-topic-repair',
    bound: 9,
    values: [0, 8],
    parsing: 'both-complete-checkpoints-and-draw-syntax-and-domain-before-evaluation',
    requiredOrUnusedDraw: 'unchanged-kernel-repair-phase-validation',
    flatAudit: 'team-order-with-separate-flatDrawIndex-and-localDrawIndex',
    externalRngConsumed: 0,
    callerCallbacks: 'excluded',
  },
  safety: {
    input: 'closed-schema-detached-safe-JSON-data-with-exact-policy',
    requiredRuntime: 'trusted-node-util-types-isProxy-via-process-getBuiltinModule',
    unavailableProxyDetector: 'fail-closed-before-inspecting-input',
    proxiesAccessorsAndExecutableValues: 'rejected-without-invocation',
    output: 'recursively-frozen-and-detached-from-caller',
    failure: 'typed-code-only-no-state-or-partial-receipt',
  },
  capacity: {
    maxInputNodes: MAX_INPUT_NODES,
    maxInputDepth: MAX_INPUT_DEPTH,
    maxInputArrayLength: MAX_INPUT_ARRAY_LENGTH,
    maxCanonicalUtf8Bytes: MAX_CANONICAL_BYTES,
    handFillCalls: 2,
    maxRepairDraws: 2,
    maxFilledSlots: 12,
  },
  boundary: {
    kind: 'standalone-two-team-non-tutorial-turn-start-composition',
    personalityResolution: 'caller-supplied-no-person-lookup-or-fallback',
    tutorialBranch: 'excluded',
    deckGenerate: 'excluded-not-duplicated',
    turnEndAndTimerDecrement: 'excluded',
    attackAndRethinkAction: 'excluded',
    fullSessionAndPersistence: 'excluded',
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
  debateEnumPath: 'Project/Assets/Sango/Scripts/Game/Debate/DebateEnum.cs',
  debateEnumBlob: '5b46a8ac87613193eb9f4b99a25e489ba6f5e483',
  sourceTurnStartLines: [1046, 1079],
  sourceTimerResetLines: [401, 404],
  sourceSortLines: [406, 409],
  sourceFillLines: [412, 438],
  sourceCardEnumLines: [33, 61],
  sourceBehavior: 'team-local-reset-quota-fill-final-Bold-scan-clear-before-next-team',
  handFill: DEBATE_HAND_FILL_EVIDENCE_V1,
  personalityBoundary: 'caller-supplied-CharacterGetPersonality-result',
  domainBoundsSafetyBudgetsAuditAndReasonNames: 'engine-policy-not-source-reachability-proof',
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

/** All seven physical slots are retained, including the inactive backing tail. */
type CharacterCheckpoint = {
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
type CharacterInput = CharacterCheckpoint & { rawDraws: RawDraw[] };
type Input = {
  schemaVersion: 1;
  profile: typeof PROFILE;
  policies: Policy;
  /** The only admitted branch. This is not a tutorial implementation. */
  isTutorial: false;
  characters: [CharacterInput, CharacterInput];
};
type State = { isTutorial: false; characters: [CharacterCheckpoint, CharacterCheckpoint] };
type RethinkQuotaReason = 'crumbled-and-positive-calm' | 'crumbled' | 'positive-calm' | 'preserved';
type RethinkQuota = {
  before: boolean;
  after: boolean;
  crumbledApplied: boolean;
  calmApplied: boolean;
  reason: RethinkQuotaReason;
};
type BoldReason = 'timer-zero' | 'personality-not-bold' | 'topic-cards-remain' | 'no-topic-cards-reset';
type BoldAudit = {
  eligible: boolean;
  /** Null means the source Bold gate did not perform its topic scan. */
  topicCardCount: number | null;
  countSource: 'final-post-repair-active-prefix';
  angerTimerBefore: number;
  angerTimerAfter: number;
  resetApplied: boolean;
  reason: BoldReason;
};
type TeamReceipt = {
  teamIndex: TeamIndex;
  before: CharacterCheckpoint;
  after: CharacterCheckpoint;
  playedCardReset: { before: PhysicalCard; after: -1 };
  rethinkQuota: RethinkQuota;
  /** Unmodified receipt from the unchanged current-deck fill kernel. */
  fill: DebateHandFillReceiptV1;
  bold: BoldAudit;
  crumbledClear: { before: boolean; after: false };
  providedRawDraws: RawDraw[];
  consumedDraws: RawDraw[];
  drawCount: 0 | 1;
};
/** Flat indices never overwrite a nested fill receipt's local drawIndex. */
type ConsumedDraw = {
  flatDrawIndex: number;
  teamIndex: TeamIndex;
  localDrawIndex: 0;
  draw: RawDraw;
};
type Receipt = {
  schemaVersion: 1;
  profile: typeof PROFILE;
  policy: Policy;
  evidence: Evidence;
  before: State;
  after: State;
  teamOrder: [0, 1];
  teams: [TeamReceipt, TeamReceipt];
  consumedDraws: ConsumedDraw[];
  drawCount: 0 | 1 | 2;
  externalRngConsumed: 0;
};
type Success = {
  ok: true;
  schemaVersion: 1;
  profile: typeof PROFILE;
  policy: Policy;
  evidence: Evidence;
  characters: [CharacterCheckpoint, CharacterCheckpoint];
  receipt: Receipt;
};
type FailureReason = DebateHandFillFailureReasonV1
  | 'unsupported-tutorial'
  | 'invalid-characters'
  | 'invalid-personality'
  | 'invalid-anger-timer'
  | 'invalid-max-card-count'
  | 'invalid-hand'
  | 'invalid-played-card'
  | 'invalid-can-rethink'
  | 'invalid-crumbled'
  | 'invalid-raw-draws';
type Failure = { ok: false; reason: FailureReason };
type Result = Success | Failure;

export type DebateTurnStartTeamIndexV1 = TeamIndex;
export type DebateTurnStartPersonalityV1 = Personality;
export type DebateTurnStartCardCodeV1 = CardCode;
export type DebateTurnStartPhysicalCardV1 = PhysicalCard;
export type DebateTurnStartPhysicalHandV1 = Frozen<PhysicalHand>;
export type DebateTurnStartRawDrawV1 = RawDraw;
export type DebateTurnStartCharacterCheckpointV1 = Frozen<CharacterCheckpoint>;
export type DebateTurnStartCharacterInputV1 = Frozen<CharacterInput>;
export type DebateTurnStartInputV1 = Frozen<Input>;
export type DebateTurnStartStateV1 = Frozen<State>;
export type DebateTurnStartRethinkQuotaReasonV1 = RethinkQuotaReason;
export type DebateTurnStartRethinkQuotaV1 = Frozen<RethinkQuota>;
export type DebateTurnStartBoldReasonV1 = BoldReason;
export type DebateTurnStartBoldAuditV1 = Frozen<BoldAudit>;
export type DebateTurnStartTeamReceiptV1 = Frozen<TeamReceipt>;
export type DebateTurnStartConsumedDrawV1 = Frozen<ConsumedDraw>;
export type DebateTurnStartReceiptV1 = Frozen<Receipt>;
export type DebateTurnStartSuccessV1 = Frozen<Success>;
export type DebateTurnStartFailureReasonV1 = FailureReason;
export type DebateTurnStartFailureV1 = Frozen<Failure>;
export type DebateTurnStartResultV1 = Frozen<Result>;
export type DebateTurnStartPolicyV1 = Frozen<Policy>;
export type DebateTurnStartEvidenceV1 = Frozen<Evidence>;

/** @internal Trusted engine composition only; never accepted from public input. */
export type DebateTurnStartFillReceiptInternal = Pick<DebateHandFillReceiptV1, 'consumedDraws' | 'drawCount'>;
export type DebateTurnStartFillInternal<F extends DebateTurnStartFillReceiptInternal> =
  (input: DebateHandFillInputV1, team: TeamIndex) => {
    hand: DebateHandFillHandV1; deckCursor: number; cardTape: readonly CardCode[]; receipt: F;
  };
export type DebateTurnStartTeamReceiptInternal<F extends DebateTurnStartFillReceiptInternal> = Omit<TeamReceipt, 'fill'> & { fill: F };
export type DebateTurnStartBodyInternal<F extends DebateTurnStartFillReceiptInternal> = {
  ok: true; characters: [CharacterCheckpoint, CharacterCheckpoint];
  receipt: Omit<Receipt, 'schemaVersion' | 'profile' | 'policy' | 'evidence' | 'teams'> & {
    teams: [DebateTurnStartTeamReceiptInternal<F>, DebateTurnStartTeamReceiptInternal<F>];
  };
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
/** Called only for detached JSON data or trusted internal constants. */
function canonical(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  const record = value as Record<string, unknown>;
  return '{' + Object.keys(record).sort().map(key => JSON.stringify(key) + ':' + canonical(record[key])).join(',') + '}';
}
function utf8Bytes(value: string): number {
  let bytes = 0;
  for (const character of value) {
    const codePoint = character.codePointAt(0)!;
    bytes += codePoint <= 0x7f ? 1 : codePoint <= 0x7ff ? 2 : codePoint <= 0xffff ? 3 : 4;
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
 * Reject proxies before reflection; read only data descriptors, not getters.
 * Reject symbols, hidden/decorated fields, nonplain prototypes, sparse arrays,
 * cycles, nonintegral/unsafe numbers, negative zero, and non-JSON values.
 * Repeated acyclic references are independently copied and budgeted each time.
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
          enumerable: true,
          configurable: true,
          writable: true,
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
/** Detachment has already rejected all nonintegral or unsafe numeric values. */
function integer(value: unknown, minimum: number, maximum: number, reason: FailureReason): number {
  if (typeof value !== 'number' || value < minimum || value > maximum) fail(reason);
  return value;
}
function parseHand(value: unknown, maxCardCount: number): PhysicalHand {
  if (!Array.isArray(value) || value.length !== PHYSICAL_HAND_SIZE) fail('invalid-hand');
  const hand = value.map((entry, slot) => {
    const card = integer(entry, -1, 14, 'invalid-hand') as PhysicalCard;
    if (slot > 0 && slot < maxCardCount && card === 0) fail('invalid-hand');
    return card;
  });
  return hand as PhysicalHand;
}
function parseRawDraw(value: unknown): RawDraw {
  const record = object(value, ['role', 'bound', 'value'], 'invalid-raw-draw');
  if (record.role !== 'debate-fill-topic-repair' || record.bound !== 9) fail('invalid-raw-draw');
  const rawValue = integer(record.value, 0, 8, 'invalid-raw-draw');
  return { role: 'debate-fill-topic-repair', bound: 9, value: rawValue };
}
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
  const rawDraws = record.rawDraws.map(parseRawDraw);
  return {
    personality: record.personality, angerTimer, maxCardCount, hand, playedCard,
    canRethink: record.canRethink, crumbled: record.crumbled, cardTape, deckCursor, rawDraws,
  };
}
function parseInput(value: unknown): Input {
  const record = object(value, ['schemaVersion', 'profile', 'policies', 'isTutorial', 'characters']);
  if (record.schemaVersion !== 1 || record.profile !== PROFILE) fail('unsupported-profile');
  if (canonical(record.policies) !== canonical(POLICY)) fail('unsupported-policy');
  if (record.isTutorial !== false) fail('unsupported-tutorial');
  if (!Array.isArray(record.characters) || record.characters.length !== 2) fail('invalid-characters');
  // Both complete checkpoints and every draw domain parse before either fill.
  const characters: [CharacterInput, CharacterInput] = [
    parseCharacter(record.characters[0]), parseCharacter(record.characters[1]),
  ];
  return { schemaVersion: 1, profile: PROFILE, policies: POLICY, isTutorial: false, characters };
}
/** Excludes draw requests: these are inputs to evaluation, not character state. */
function copyCharacter(character: CharacterCheckpoint): CharacterCheckpoint {
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
function resolveTeam<F extends DebateTurnStartFillReceiptInternal>(input: CharacterInput, teamIndex: TeamIndex, fillCards: DebateTurnStartFillInternal<F>): DebateTurnStartTeamReceiptInternal<F> {
  const before = copyCharacter(input);
  const after = copyCharacter(input);

  // Source 1050: reset this team's played card, not both teams in a pre-pass.
  after.playedCard = -1;

  const crumbledApplied = before.crumbled;
  if (crumbledApplied) after.canRethink = true;
  const calmApplied = after.angerTimer > 0 && after.personality === 'calm';
  if (calmApplied) after.canRethink = true;
  const rethinkReason: RethinkQuotaReason = crumbledApplied
    ? (calmApplied ? 'crumbled-and-positive-calm' : 'crumbled')
    : (calmApplied ? 'positive-calm' : 'preserved');

  const fill = fillCards({
    schemaVersion: 1,
    profile: 'debate-hand-fill-reference-v1',
    policies: DEBATE_HAND_FILL_POLICY_V1,
    playableSlots: after.hand.slice(1, after.maxCardCount).map(card => {
      // parseHand already excludes active zero; preserve that typed invariant.
      if (card === 0) fail('invalid-hand');
      return card === -1 ? null : card;
    }),
    cardTape: after.cardTape,
    deckCursor: after.deckCursor,
    rawDraws: input.rawDraws,
  }, teamIndex);
  // Overlay only the active prefix. Never sort, erase, or refill the old tail.
  for (let slot = 0; slot < after.maxCardCount; slot++) after.hand[slot] = fill.hand[slot]!;
  after.deckCursor = fill.deckCursor;
  after.cardTape = fill.cardTape.slice();

  const angerTimerBefore = after.angerTimer;
  const eligible = angerTimerBefore > 0 && after.personality === 'bold';
  let topicCardCount: number | null = null;
  let resetApplied = false;
  let boldReason: BoldReason;
  if (angerTimerBefore === 0) {
    boldReason = 'timer-zero';
  } else if (!eligible) {
    boldReason = 'personality-not-bold';
  } else {
    topicCardCount = 0;
    // This is FINAL post-repair data. The fill receipt's similarly named count
    // precedes repair and must not drive this source branch.
    for (let slot = 0; slot < after.maxCardCount; slot++) {
      const card = after.hand[slot]!;
      if (card >= 1 && card <= 9) topicCardCount++;
    }
    if (topicCardCount === 0) {
      after.angerTimer = 0;
      resetApplied = true;
      boldReason = 'no-topic-cards-reset';
    } else {
      boldReason = 'topic-cards-remain';
    }
  }

  after.crumbled = false;
  return {
    teamIndex,
    before,
    after,
    playedCardReset: { before: before.playedCard, after: -1 },
    rethinkQuota: { before: before.canRethink, after: after.canRethink, crumbledApplied, calmApplied, reason: rethinkReason },
    fill: fill.receipt,
    bold: {
      eligible, topicCardCount, countSource: 'final-post-repair-active-prefix',
      angerTimerBefore, angerTimerAfter: after.angerTimer, resetApplied, reason: boldReason,
    },
    crumbledClear: { before: before.crumbled, after: false },
    providedRawDraws: input.rawDraws.slice(),
    consumedDraws: fill.receipt.consumedDraws.slice(),
    drawCount: fill.receipt.drawCount,
  };
}
function resolveBody<F extends DebateTurnStartFillReceiptInternal>(input: Input, fillCards: DebateTurnStartFillInternal<F>): DebateTurnStartBodyInternal<F> {
  // A team failure throws before this function can publish state or receipts.
  // Each call completes ALL phases before the next team starts evaluating.
  const teamZero = resolveTeam(input.characters[0], 0, fillCards);
  const teamOne = resolveTeam(input.characters[1], 1, fillCards);
  const teams: [DebateTurnStartTeamReceiptInternal<F>, DebateTurnStartTeamReceiptInternal<F>] = [teamZero, teamOne];
  const consumedDraws: ConsumedDraw[] = [];
  for (const team of teams) {
    for (const draw of team.consumedDraws) {
      consumedDraws.push({ flatDrawIndex: consumedDraws.length, teamIndex: team.teamIndex, localDrawIndex: 0, draw });
    }
  }
  const before: State = { isTutorial: false, characters: [teamZero.before, teamOne.before] };
  const after: State = { isTutorial: false, characters: [teamZero.after, teamOne.after] };
  return {
    ok: true,
    characters: after.characters,
    receipt: {
      before, after, teamOrder: [0, 1], teams, consumedDraws,
      drawCount: consumedDraws.length as 0 | 1 | 2,
      externalRngConsumed: 0,
    },
  };
}

/** Metadata-free internal body; admission remains the original safe parser. */
export function resolveDebateTurnStartInternal<F extends DebateTurnStartFillReceiptInternal>(
  input: unknown, fillCards: DebateTurnStartFillInternal<F>,
): DebateTurnStartBodyInternal<F> {
  return resolveBody(parseInput(detach(input)), fillCards);
}
/** Recognize only this module's own validation errors, not callback failures. */
export function debateTurnStartFailureInternal(error: unknown): DebateTurnStartFailureV1 | null {
  return error instanceof Invalid ? freeze(failure(error)) : null;
}
function resolve(input: Input): Success {
  const body = resolveBody(input, (fillInput) => {
    const result = evaluateDebateHandFill(fillInput);
    if (!result.ok) fail(result.reason);
    return { ...result, cardTape: fillInput.cardTape };
  });
  return {
    ok: true, schemaVersion: 1, profile: PROFILE, policy: POLICY, evidence: EVIDENCE,
    characters: body.characters,
    receipt: { schemaVersion: 1, profile: PROFILE, policy: POLICY, evidence: EVIDENCE, ...body.receipt },
  };
}

export const DEBATE_TURN_START_POLICY_V1: DebateTurnStartPolicyV1 = freeze(POLICY);
export const DEBATE_TURN_START_EVIDENCE_V1: DebateTurnStartEvidenceV1 = freeze(EVIDENCE);

/**
 * Pure, atomic non-tutorial TurnStart on two bounded caller-supplied checkpoints.
 * Safely detaches and parses all input before source-ordered team evaluation.
 * Reuses the current-deck hand-fill kernel with its existing DTOs and policies.
 * A failure returns only its frozen typed reason, never a partial team state.
 * No caller callback, external RNG, deck regeneration, timer decrement, attack,
 * full session, person lookup, native equivalence, or persistent write is run.
 */
export function evaluateDebateTurnStart(input: unknown): DebateTurnStartResultV1 {
  try {
    return freeze(resolve(parseInput(detach(input))));
  } catch (error) {
    return freeze(failure(error));
  }
}
