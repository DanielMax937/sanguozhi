/**
 * Complete bounded Rethink data action from the pinned modern C# translation.
 * Clears one actor's active prefix, reuses unchanged current-deck fill and Calm
 * bonus kernels, overlays the result, then writes canRethink = false.
 * This is not PlayPhase, deck generation, a native implementation, or a session.
 */
import {
  evaluateDebateHandFill,
  DEBATE_HAND_FILL_POLICY_V1,
  DEBATE_HAND_FILL_EVIDENCE_V1,
  type DebateHandFillCardCodeV1,
  type DebateHandFillInputV1,
  type DebateHandFillHandV1,
  type DebateHandFillRawDrawV1,
  type DebateHandFillReceiptV1,
  type DebateHandFillRepairV1,
  type DebateHandFillSortedProvenanceV1,
  type DebateHandFillFailureReasonV1,
} from './debate-hand-fill.ts';
import {
  evaluateDebateCalmRethink,
  DEBATE_CALM_RETHINK_POLICY_V1,
  DEBATE_CALM_RETHINK_EVIDENCE_V1,
  type DebateCalmRethinkPersonalityV1,
  type DebateCalmRethinkRawResultV1,
  type DebateCalmRethinkConsumedResultV1,
  type DebateCalmRethinkReplacementV1,
  type DebateCalmRethinkSuccessV1,
  type DebateCalmRethinkFailureReasonV1,
} from './debate-calm-rethink.ts';

type Frozen<T> = T extends object ? { readonly [K in keyof T]: Frozen<T[K]> } : T;
type Personality = DebateCalmRethinkPersonalityV1;
type CardCode = DebateHandFillCardCodeV1;
type SourceCard = 0 | CardCode;
type PhysicalCard = -1 | SourceCard;
type PhysicalHand = [PhysicalCard, PhysicalCard, PhysicalCard, PhysicalCard, PhysicalCard, PhysicalCard, PhysicalCard];
type RawDraw = DebateHandFillRawDrawV1;
type RawResult = DebateCalmRethinkRawResultV1;
type AppliedRepair = Extract<DebateHandFillRepairV1, { status: 'applied' }>;
const PROFILE = 'debate-rethink-action-reference-v1' as const;
const DECK_SIZE = 18;
const PHYSICAL_HAND_SIZE = 7;
const MAX_INPUT_NODES = 2048;
const MAX_INPUT_DEPTH = 12;
const MAX_INPUT_ARRAY_LENGTH = 32;
const MAX_CANONICAL_BYTES = 32768;

const POLICY = {
  id: 'debate-rethink-action-bounded-current-deck-policy-v1',
  profile: PROFILE,
  mode: {
    kind: 'complete-bounded-rethink-data-action',
    actorCount: 1,
    sequence: [
      'clear-every-active-slot-to-minus-one',
      'evaluate-unchanged-current-deck-hand-fill-with-all-playable-slots-null',
      'evaluate-unchanged-calm-rethink-on-fill-hand',
      'overlay-final-active-hand-and-filled-deck-cursor',
      'write-canRethink-false',
    ],
    tutorialFlag: 'not-admitted-source-method-has-no-tutorial-gate',
    opponentAndTeam: 'not-required-for-one-actor-data-action',
    viewAndLogging: 'excluded',
  },
  checkpoint: {
    personality: 'caller-resolved-timid-calm-bold-or-reckless',
    angerTimer: { minimum: 0, maximum: 4 },
    maxCardCount: { minimum: 4, maximum: 7 },
    physicalHandLength: PHYSICAL_HAND_SIZE,
    originalPhysicalCardRange: [-1, 14],
    originalActiveZero: 'admitted-all-active-slots-are-cleared',
    activePrefix: 'zero-through-maxCardCount-minus-one',
    inactiveTail: 'maxCardCount-through-six-preserved-without-fill-overwrite-or-sort',
    playedCard: 0,
    playedCardMeaning: 'engineering-post-selection-pre-reset-checkpoint',
    canRethink: 'required-boolean-true-or-false-no-availability-guard',
    currentTopic: { minimum: -2147483648, maximum: 2147483647 },
    cardTapeLength: DECK_SIZE,
    cardTapeRange: [1, 14],
    deckCursor: { minimum: 0, maximum: DECK_SIZE },
    bounds: 'explicit-engineering-checkpoint-domain-not-universal-source-reachability',
  },
  clearing: {
    assignment: 'minus-one-to-every-active-physical-slot-including-zero',
    oldCardsRetainedInActiveHand: 0,
    discardAudit: 'every-original-non-minus-one-active-slot-including-zero',
    inactiveTail: 'never-cleared',
  },
  fill: {
    implementation: 'unchanged-evaluateDebateHandFill',
    policy: DEBATE_HAND_FILL_POLICY_V1,
    playableSlots: 'exactly-maxCardCount-minus-one-null-slots',
    cardsRequired: 'maxCardCount-minus-one-on-every-call-even-originally-full-hand',
    exhaustion: 'unsupported-deck-regeneration-with-no-partial-state-or-receipt',
    ordinaryCardGuarantee: 'all-playable-slots-new-so-no-topic-always-repairs-last-new-slot',
    receipt: 'full-unchanged-receipt-with-local-drawIndex-zero',
  },
  calm: {
    implementation: 'unchanged-evaluateDebateCalmRethink',
    policy: DEBATE_CALM_RETHINK_POLICY_V1,
    hand: 'exact-filled-and-sorted-active-fill-hand',
    result: 'full-unchanged-success-with-local-boolean-index-zero',
    ordinaryPrecondition: 'guaranteed-by-fresh-fill-or-its-topic-repair',
    topicRange: 'does-not-gate-required-positive-timer-calm-boolean-result',
    equalFaceOverwrite: 'applied-even-when-card-value-is-unchanged',
  },
  writes: {
    canRethink: 'unconditional-false-after-successful-fill-calm-and-active-overlay',
    quotaAvailabilityCheck: 'none',
    playedCard: 'preserve-zero-caller-resets-in-next-play-phase-step',
    personalityAngerTimerCapacityTopicAndTape: 'preserved',
  },
  randomness: {
    repairRawDraws: 'zero-or-one-role-debate-fill-topic-repair-bound-nine-value-zero-through-eight',
    calmRawResults: 'zero-or-one-role-debate-calm-rethink-rand-bool-percent-forty-boolean',
    parsing: 'complete-checkpoint-and-both-payload-syntax-and-domain-before-any-work',
    requiredAndUnusedSemantics: 'delegated-unchanged-to-fill-then-calm',
    orderedEvents: 'optional-repair-integer-draw-before-optional-calm-boolean-result',
    indices: 'outer-heterogeneous-eventIndex-plus-unchanged-localIndex-zero',
    noBound100Conversion: true,
    externalRngConsumed: 0,
    callerCallbacks: 'excluded',
  },
  provenance: {
    composition: 'final-index-to-calm-sort-sourceIndices-to-fill-sortedProvenance',
    originalCardAndTapeIndex: 'preserve-fill-origin-before-either-overwrite',
    topicRepairHistory: 'preserve-applied-repair-for-that-original-source-slot',
    calmOverwriteHistory: 'mark-source-slot-one-assignment-even-equal-face',
    equalCodeIdentity: 'explicit-engine-policy-not-native-Array.Sort-identity',
    inactiveTail: 'excluded-from-active-provenance-preserved-in-complete-state',
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
    handFillCalls: 1,
    calmRethinkCalls: 1,
    maxClearedSlots: 7,
    maxFilledSlots: 6,
    maxRepairDraws: 1,
    maxBooleanResults: 1,
    maxRandomEvents: 2,
  },
  boundary: {
    kind: 'standalone-one-actor-complete-bounded-rethink-data-action',
    personalityResolution: 'caller-supplied-no-person-lookup-or-fallback',
    playPhaseSelectionAiAndReset: 'excluded',
    tutorialSimulation: 'excluded',
    deckGenerate: 'excluded-not-duplicated',
    turnStartTurnEndAndTimerDecrement: 'excluded',
    fullSessionAndPersistence: 'excluded',
    oldNineCardProfile: 'excluded',
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
  sourceCharacterRethinkLines: [491, 509],
  sourceClearLines: [493, 494],
  sourceFillCallLine: 495,
  sourceCalmBonusLines: [496, 507],
  sourceFinalSortLine: 509,
  sourceRethinkActionLines: [1254, 1260],
  sourceQuotaWriteLine: 1260,
  debatePhasePath: 'Project/Assets/Sango/Scripts/Game/Debate/DebatePhase.cs',
  sourceFirstActorRethinkAndLaterResetLines: [199, 209],
  sourceSecondActorRethinkAndLaterResetLines: [235, 245],
  sourceBehavior: 'clear-active-prefix-fill-calm-bonus-sort-then-quota-false-with-later-caller-played-card-reset',
  handFill: DEBATE_HAND_FILL_EVIDENCE_V1,
  calmRethink: DEBATE_CALM_RETHINK_EVIDENCE_V1,
  personalityBoundary: 'caller-supplied-CharacterGetPersonality-result',
  quotaBoundary: 'Rethink-has-no-canRethink-availability-guard',
  tutorialBoundary: 'Rethink-and-CharacterRethink-have-no-tutorial-gate',
  postSelectionPlayedCardDomain: 'engineering-boundary-not-source-reachability-proof',
  provenanceIdentity: 'composed-component-engine-tie-policies-not-native-identity-order',
  boundsSafetyBudgetsAuditAndReasonNames: 'engine-policy',
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

/** One actor only; unrelated character/session fields are not admitted. */
type CharacterCheckpoint = {
  personality: Personality;
  angerTimer: number;
  maxCardCount: number;
  /** Every original slot admits -1..14; even active zeros will be cleared. */
  hand: PhysicalHand;
  /** This action does not perform the later PlayPhase reset. */
  playedCard: 0;
  /** False is allowed: the source action does not check availability. */
  canRethink: boolean;
  cardTape: CardCode[];
  deckCursor: number;
};
type Input = {
  schemaVersion: 1;
  profile: typeof PROFILE;
  policies: Policy;
  currentTopic: number;
  character: CharacterCheckpoint;
  rawDraws: RawDraw[];
  rawResults: RawResult[];
};
type State = { currentTopic: number; character: CharacterCheckpoint };
type ClearedSlot = { slot: number; before: PhysicalCard; after: -1 };
/** Engine audit convention: zero is included, vacancies are not. */
type DiscardedCard = { slot: number; card: SourceCard };
type ClearAudit = {
  activeSlotCount: number;
  slots: ClearedSlot[];
  discardedCards: DiscardedCard[];
  /** The complete physical backing hand, before the reserved zero is restored. */
  handAfterClear: PhysicalHand;
  inactiveTailPreserved: true;
};
type QuotaWrite = {
  before: boolean;
  after: false;
  applied: true;
  changed: boolean;
  afterPhase: 'character-rethink';
};
type PlayedCardAudit = {
  before: 0;
  after: 0;
  resetPerformed: false;
  resetBoundary: 'caller-next-play-phase-step';
};
/** Separate outer ordering never rewrites either component's local index. */
type RandomEvent =
  | {
      eventIndex: number;
      phase: 'fill-topic-repair';
      kind: 'integer-draw';
      localIndex: 0;
      draw: RawDraw;
    }
  | {
      eventIndex: number;
      phase: 'calm-rethink-bonus';
      kind: 'boolean-result';
      localIndex: 0;
      result: DebateCalmRethinkConsumedResultV1;
    };
/**
 * Active final position -> Calm pre-sort physical slot -> fill provenance.
 * Original tape identity survives repair and Calm overwrite, even equal-face.
 * These identities follow explicit engine tie policies, not native guarantees.
 */
type FinalProvenance = {
  finalIndex: number;
  fillSortedIndex: number;
  preSortSlot: number;
  origin: DebateHandFillSortedProvenanceV1['origin'];
  tapeIndex: number | null;
  originalCard: SourceCard;
  fillCard: SourceCard;
  card: SourceCard;
  topicRepairApplied: boolean;
  topicRepair: AppliedRepair | null;
  calmOverwriteApplied: boolean;
  calmOverwrite: DebateCalmRethinkReplacementV1 | null;
};
type Receipt = {
  schemaVersion: 1;
  profile: typeof PROFILE;
  policy: Policy;
  evidence: Evidence;
  before: State;
  after: State;
  clear: ClearAudit;
  /** The original unchanged component receipt, including its local drawIndex. */
  fill: DebateHandFillReceiptV1;
  /** The entire unchanged component success, including policy/evidence/audit. */
  calm: DebateCalmRethinkSuccessV1;
  quotaWrite: QuotaWrite;
  playedCard: PlayedCardAudit;
  providedRawDraws: RawDraw[];
  providedRawResults: RawResult[];
  randomEvents: RandomEvent[];
  randomEventCount: 0 | 1 | 2;
  finalProvenance: FinalProvenance[];
  externalRngConsumed: 0;
};
type Success = {
  ok: true;
  schemaVersion: 1;
  profile: typeof PROFILE;
  policy: Policy;
  evidence: Evidence;
  currentTopic: number;
  character: CharacterCheckpoint;
  receipt: Receipt;
};
type FailureReason = DebateHandFillFailureReasonV1 | DebateCalmRethinkFailureReasonV1
  | 'invalid-character'
  | 'invalid-max-card-count'
  | 'invalid-played-card'
  | 'invalid-can-rethink'
  | 'invalid-raw-draws';
type Failure = { ok: false; reason: FailureReason };
type Result = Success | Failure;

export type DebateRethinkActionPersonalityV1 = Personality;
export type DebateRethinkActionCardCodeV1 = CardCode;
export type DebateRethinkActionSourceCardV1 = SourceCard;
export type DebateRethinkActionPhysicalCardV1 = PhysicalCard;
export type DebateRethinkActionPhysicalHandV1 = Frozen<PhysicalHand>;
export type DebateRethinkActionRawDrawV1 = RawDraw;
export type DebateRethinkActionRawResultV1 = RawResult;
export type DebateRethinkActionCharacterCheckpointV1 = Frozen<CharacterCheckpoint>;
export type DebateRethinkActionInputV1 = Frozen<Input>;
export type DebateRethinkActionStateV1 = Frozen<State>;
export type DebateRethinkActionClearedSlotV1 = Frozen<ClearedSlot>;
export type DebateRethinkActionDiscardedCardV1 = Frozen<DiscardedCard>;
export type DebateRethinkActionClearAuditV1 = Frozen<ClearAudit>;
export type DebateRethinkActionQuotaWriteV1 = Frozen<QuotaWrite>;
export type DebateRethinkActionPlayedCardAuditV1 = Frozen<PlayedCardAudit>;
export type DebateRethinkActionRandomEventV1 = Frozen<RandomEvent>;
export type DebateRethinkActionAppliedRepairV1 = AppliedRepair;
export type DebateRethinkActionFinalProvenanceV1 = Frozen<FinalProvenance>;
export type DebateRethinkActionReceiptV1 = Frozen<Receipt>;
export type DebateRethinkActionSuccessV1 = Frozen<Success>;
export type DebateRethinkActionFailureReasonV1 = FailureReason;
export type DebateRethinkActionFailureV1 = Frozen<Failure>;
export type DebateRethinkActionResultV1 = Frozen<Result>;
export type DebateRethinkActionPolicyV1 = Frozen<Policy>;
export type DebateRethinkActionEvidenceV1 = Frozen<Evidence>;

/** @internal Trusted composition contracts; never accepted as public input. */
export type DebateRethinkFillAuditInternal = Pick<DebateHandFillReceiptV1,
  'consumedDraws' | 'sortedProvenance' | 'repair'>;
export type DebateRethinkFillInternal<F extends DebateRethinkFillAuditInternal> = {
  hand: DebateHandFillHandV1;
  deckCursor: number;
  cardTape: readonly CardCode[];
  receipt: F;
};
export type DebateRethinkBodyInternal<F extends DebateRethinkFillAuditInternal> = {
  ok: true;
  currentTopic: number;
  character: CharacterCheckpoint;
  receipt: Omit<Receipt, 'schemaVersion' | 'profile' | 'policy' | 'evidence' | 'fill'> & { fill: F };
};

class Invalid extends Error {
  readonly reason: FailureReason;
  constructor(reason: FailureReason) { super(reason); this.reason = reason; }
}
/** @internal Recognizes only this kernel's own typed failures, not callback errors. */
export function getDebateRethinkActionFailureInternal(error: unknown): DebateRethinkActionFailureV1 | null {
  return error instanceof Invalid ? { ok: false, reason: error.reason } : null;
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
function parseHand(value: unknown): PhysicalHand {
  if (!Array.isArray(value) || value.length !== PHYSICAL_HAND_SIZE) fail('invalid-hand');
  // Unlike TurnStart, active zero is valid: ALL active slots will be discarded.
  return value.map(card => integer(card, -1, 14, 'invalid-hand') as PhysicalCard) as PhysicalHand;
}
function parseCharacter(value: unknown): CharacterCheckpoint {
  const record = object(value, [
    'personality', 'angerTimer', 'maxCardCount', 'hand', 'playedCard',
    'canRethink', 'cardTape', 'deckCursor',
  ], 'invalid-character');
  if (record.personality !== 'timid' && record.personality !== 'calm' && record.personality !== 'bold' && record.personality !== 'reckless') fail('invalid-personality');
  const angerTimer = integer(record.angerTimer, 0, 4, 'invalid-anger-timer');
  const maxCardCount = integer(record.maxCardCount, 4, 7, 'invalid-max-card-count');
  const hand = parseHand(record.hand);
  if (record.playedCard !== 0) fail('invalid-played-card');
  if (typeof record.canRethink !== 'boolean') fail('invalid-can-rethink');
  if (!Array.isArray(record.cardTape) || record.cardTape.length !== DECK_SIZE) fail('invalid-card-tape');
  const cardTape = record.cardTape.map(card => integer(card, 1, 14, 'unsupported-card-code') as CardCode);
  const deckCursor = integer(record.deckCursor, 0, DECK_SIZE, 'invalid-deck-cursor');
  return {
    personality: record.personality, angerTimer, maxCardCount, hand, playedCard: 0,
    canRethink: record.canRethink, cardTape, deckCursor,
  };
}
function parseRawDraw(value: unknown): RawDraw {
  const record = object(value, ['role', 'bound', 'value'], 'invalid-raw-draw');
  if (record.role !== 'debate-fill-topic-repair' || record.bound !== 9) fail('invalid-raw-draw');
  const rawValue = integer(record.value, 0, 8, 'invalid-raw-draw');
  return { role: 'debate-fill-topic-repair', bound: 9, value: rawValue };
}
function parseRawResult(value: unknown): RawResult {
  const record = object(value, ['role', 'percent', 'value'], 'invalid-raw-result');
  if (record.role !== 'debate-calm-rethink-rand-bool' || record.percent !== 40 || typeof record.value !== 'boolean') fail('invalid-raw-result');
  return { role: 'debate-calm-rethink-rand-bool', percent: 40, value: record.value };
}
function parseInput(value: unknown): Input {
  const record = object(value, ['schemaVersion', 'profile', 'policies', 'currentTopic', 'character', 'rawDraws', 'rawResults']);
  if (record.schemaVersion !== 1 || record.profile !== PROFILE) fail('unsupported-profile');
  if (canonical(record.policies) !== canonical(POLICY)) fail('unsupported-policy');
  const currentTopic = integer(record.currentTopic, -2147483648, 2147483647, 'invalid-current-topic');
  const character = parseCharacter(record.character);
  if (!Array.isArray(record.rawDraws) || record.rawDraws.length > 1) fail('invalid-raw-draws');
  const rawDraws = record.rawDraws.map(parseRawDraw);
  if (!Array.isArray(record.rawResults) || record.rawResults.length > 1) fail('invalid-raw-results');
  const rawResults = record.rawResults.map(parseRawResult);
  // Do not decide whether either payload is required here. The existing kernels
  // apply those semantics in source phase order, after both payloads are parsed.
  return { schemaVersion: 1, profile: PROFILE, policies: POLICY, currentTopic, character, rawDraws, rawResults };
}
function copyCharacter(character: CharacterCheckpoint): CharacterCheckpoint {
  return {
    personality: character.personality,
    angerTimer: character.angerTimer,
    maxCardCount: character.maxCardCount,
    hand: [...character.hand],
    playedCard: character.playedCard,
    canRethink: character.canRethink,
    cardTape: character.cardTape.slice(),
    deckCursor: character.deckCursor,
  };
}
function composeProvenance(fill: DebateRethinkFillAuditInternal, calm: DebateCalmRethinkSuccessV1): FinalProvenance[] {
  return calm.audit.sort.sourceIndices.map((fillSortedIndex, finalIndex) => {
    const origin = fill.sortedProvenance[fillSortedIndex]!;
    const topicRepair = fill.repair.status === 'applied' && fill.repair.preSortSlot === origin.preSortSlot
      ? fill.repair : null;
    const calmOverwrite = calm.audit.replacement !== null && calm.audit.replacement.sourceSlot === fillSortedIndex
      ? calm.audit.replacement : null;
    return {
      finalIndex,
      fillSortedIndex,
      preSortSlot: origin.preSortSlot,
      origin: origin.origin,
      tapeIndex: origin.tapeIndex,
      originalCard: origin.originalCard,
      fillCard: origin.card,
      card: calm.hand[finalIndex]!,
      topicRepairApplied: origin.topicRepairApplied,
      topicRepair,
      calmOverwriteApplied: calmOverwrite !== null,
      calmOverwrite,
    };
  });
}
/** @internal Caller supplies only a trusted engine closure; input has been parsed. */
export function resolveDebateRethinkActionInternal<F extends DebateRethinkFillAuditInternal>(
  input: Input,
  fillHand: (input: DebateHandFillInputV1) => DebateRethinkFillInternal<F>,
): DebateRethinkBodyInternal<F> {
  const before: State = { currentTopic: input.currentTopic, character: copyCharacter(input.character) };
  const after: State = { currentTopic: input.currentTopic, character: copyCharacter(input.character) };
  const character = after.character;
  const slots: ClearedSlot[] = [];
  const discardedCards: DiscardedCard[] = [];

  // Source 493-494: slot zero is cleared too, before fill restores the zero card.
  for (let slot = 0; slot < character.maxCardCount; slot++) {
    const card = character.hand[slot]!;
    slots.push({ slot, before: card, after: -1 });
    if (card !== -1) discardedCards.push({ slot, card });
    character.hand[slot] = -1;
  }
  const clear: ClearAudit = {
    activeSlotCount: character.maxCardCount,
    slots,
    discardedCards,
    handAfterClear: [...character.hand],
    inactiveTailPreserved: true,
  };

  // Every call consumes cap-1 cards, regardless of the original hand contents.
  const fill = fillHand({
    schemaVersion: 1,
    profile: 'debate-hand-fill-reference-v1',
    policies: DEBATE_HAND_FILL_POLICY_V1,
    playableSlots: Array.from({ length: character.maxCardCount - 1 }, () => null),
    cardTape: character.cardTape,
    deckCursor: character.deckCursor,
    rawDraws: input.rawDraws,
  });

  // Fresh fill has at least one ordinary card, naturally or by last-new repair.
  // Pass its actual sorted active hand, not an old hand or a reconstructed one.
  const calm = evaluateDebateCalmRethink({
    schemaVersion: 1,
    profile: 'debate-calm-rethink-reference-v1',
    policies: DEBATE_CALM_RETHINK_POLICY_V1,
    personality: character.personality,
    angerTimer: character.angerTimer,
    currentTopic: input.currentTopic,
    hand: fill.hand,
    rawResults: input.rawResults,
  });
  if (!calm.ok) fail(calm.reason);

  // Both component stages have succeeded. Only now overlay the final active
  // prefix, preserve the backing tail, and perform the source quota assignment.
  for (let slot = 0; slot < character.maxCardCount; slot++) character.hand[slot] = calm.hand[slot]!;
  character.deckCursor = fill.deckCursor;
  character.cardTape = fill.cardTape.slice();
  character.canRethink = false;
  // playedCard remains zero; the later caller PlayPhase step owns its reset.

  const randomEvents: RandomEvent[] = [];
  for (const draw of fill.receipt.consumedDraws) {
    randomEvents.push({ eventIndex: randomEvents.length, phase: 'fill-topic-repair', kind: 'integer-draw', localIndex: 0, draw });
  }
  if (calm.audit.booleanResult !== null) {
    randomEvents.push({
      eventIndex: randomEvents.length, phase: 'calm-rethink-bonus', kind: 'boolean-result',
      localIndex: 0, result: calm.audit.booleanResult,
    });
  }

  return {
    ok: true,
    currentTopic: after.currentTopic,
    character,
    receipt: {
      before,
      after,
      clear,
      fill: fill.receipt,
      calm,
      quotaWrite: {
        before: before.character.canRethink, after: false, applied: true,
        changed: before.character.canRethink, afterPhase: 'character-rethink',
      },
      playedCard: { before: 0, after: 0, resetPerformed: false, resetBoundary: 'caller-next-play-phase-step' },
      providedRawDraws: input.rawDraws.slice(),
      providedRawResults: input.rawResults.slice(),
      randomEvents,
      randomEventCount: randomEvents.length as 0 | 1 | 2,
      finalProvenance: composeProvenance(fill.receipt, calm),
      externalRngConsumed: 0,
    },
  };
}

/** @internal Safe original-shape admission, not a callback-bearing public API. */
export function parseDebateRethinkActionInternal(input: unknown): Input {
  return parseInput(detach(input));
}
function resolve(input: Input): Success {
  const body = resolveDebateRethinkActionInternal(input, fillInput => {
    const fill = evaluateDebateHandFill(fillInput);
    if (!fill.ok) fail(fill.reason);
    return { hand: fill.hand, deckCursor: fill.deckCursor, cardTape: fillInput.cardTape, receipt: fill.receipt };
  });
  return {
    ok: true, schemaVersion: 1, profile: PROFILE, policy: POLICY, evidence: EVIDENCE,
    currentTopic: body.currentTopic, character: body.character,
    receipt: { schemaVersion: 1, profile: PROFILE, policy: POLICY, evidence: EVIDENCE, ...body.receipt },
  };
}

export const DEBATE_RETHINK_ACTION_POLICY_V1: DebateRethinkActionPolicyV1 = freeze(POLICY);
export const DEBATE_RETHINK_ACTION_EVIDENCE_V1: DebateRethinkActionEvidenceV1 = freeze(EVIDENCE);

/**
 * Pure, atomic one-actor bounded Rethink action, not a selection/PlayPhase loop.
 * Safely detaches and parses the entire checkpoint and both random payloads
 * before clearing anything. Delegates current-deck fill and Calm unchanged.
 * A failure returns only its frozen typed reason, never intermediate state or
 * either component's partial receipt. Caller input is never mutated or frozen.
 * No external RNG, caller callback, deck regeneration, timer decrement, tutorial
 * simulation, view/log side effect, persistent write, or legacy profile is run.
 */
export function evaluateDebateRethinkAction(input: unknown): DebateRethinkActionResultV1 {
  try {
    return freeze(resolve(parseInput(detach(input))));
  } catch (error) {
    return freeze(failure(error));
  }
}
