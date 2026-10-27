/**
 * Bounded checked paired selection through ordinary DamagePhaseBegin data.
 * Reuses the pinned availability, Rethink action and attacker evaluators without
 * modifying them. The availability guard and finite plans are engineering
 * admission rules, not claims that the raw source PlayPhase enforces them.
 * No Attack, damage, turn lifecycle, native session, AI or UI is executed.
 */
import {
  evaluateDebateCardAvailability,
  DEBATE_CARD_AVAILABILITY_POLICY_V1,
  DEBATE_CARD_AVAILABILITY_EVIDENCE_V1,
  type DebateCardAvailabilitySuccessV1,
  type DebateCardAvailabilityFailureReasonV1,
} from './debate-card-availability.ts';
import {
  evaluateDebateRethinkAction,
  DEBATE_RETHINK_ACTION_POLICY_V1,
  DEBATE_RETHINK_ACTION_EVIDENCE_V1,
  type DebateRethinkActionPersonalityV1,
  type DebateRethinkActionInputV1,
  type DebateRethinkActionCardCodeV1,
  type DebateRethinkActionRawDrawV1,
  type DebateRethinkActionRawResultV1,
  type DebateRethinkActionRandomEventV1,
  type DebateRethinkActionSuccessV1,
  type DebateRethinkActionFailureReasonV1,
} from './debate-rethink-action.ts';
import {
  evaluateDebateAttackerSelection,
  DEBATE_ATTACKER_SELECTION_POLICY_V1,
  DEBATE_ATTACKER_SELECTION_EVIDENCE_V1,
  type DebateAttackerSelectionAttackerV1,
  type DebateAttackerSelectionSuccessV1,
  type DebateAttackerSelectionFailureReasonV1,
} from './debate-attacker-selection.ts';

type Frozen<T> = T extends object ? { readonly [K in keyof T]: Frozen<T[K]> } : T;
type Pair<T> = [T, T];
type Team = 0 | 1;
type Attacker = DebateAttackerSelectionAttackerV1;
type Personality = DebateRethinkActionPersonalityV1;
type CardCode = DebateRethinkActionCardCodeV1;
type SourceCard = 0 | CardCode;
type PhysicalCard = -1 | SourceCard;
type PhysicalHand = [PhysicalCard, PhysicalCard, PhysicalCard, PhysicalCard, PhysicalCard, PhysicalCard, PhysicalCard];
type RawDraw = DebateRethinkActionRawDrawV1;
type RawResult = DebateRethinkActionRawResultV1;
const PROFILE = 'debate-checked-play-reference-v1' as const;
const DECK_SIZE = 18;
const PHYSICAL_HAND_SIZE = 7;
const MAX_INPUT_NODES = 4096;
const MAX_INPUT_DEPTH = 16;
const MAX_INPUT_ARRAY_LENGTH = 32;
const MAX_CANONICAL_BYTES = 65536;

const POLICY = {
  id: 'debate-checked-play-bounded-paired-selection-policy-v1',
  profile: PROFILE,
  mode: {
    kind: 'bounded-checked-paired-selection-through-ordinary-DamagePhaseBegin-data',
    sequence: [
      'parse-complete-both-characters-both-plans-and-all-random-payloads',
      'finish-firstTeam-plan-before-opponent-plan',
      'resolve-current-active-owned-nonempty-physical-slot',
      'evaluate-unchanged-availability-and-require-available',
      'write-played-card-then-remove-and-stably-compact-active-survivors',
      'for-rethink-evaluate-unchanged-action-then-reset-and-reselect',
      'after-both-final-cards-evaluate-unchanged-ordinary-attacker-selection',
      'return-ready-for-attack-engineering-checkpoint-without-Attack',
    ],
    isTutorial: false,
    winner: -1,
    sourceLoopBound: 'source-PlayPhase-itself-is-not-bounded-by-this-policy',
  },
  checkpoint: {
    characters: 2,
    teams: [0, 1],
    firstTeam: 'caller-supplied-zero-or-one-not-calculated',
    personality: 'caller-resolved-timid-calm-bold-or-reckless',
    angerTimer: { minimum: 0, maximum: 4 },
    maxCardCount: { minimum: 4, maximum: 7 },
    physicalHandLength: PHYSICAL_HAND_SIZE,
    initialReservedSlot: { slot: 0, card: 0 },
    initialActiveOtherSlots: 'full-one-through-fourteen-in-original-physical-order',
    initialSortingRequired: false,
    initialInactiveTail: 'minus-one-through-fourteen-admitted-but-discarded-on-removal',
    initialPlayedCard: -1,
    canRethink: 'required-boolean-per-character',
    currentTopic: { minimum: -2147483648, maximum: 2147483647 },
    cardTapeLength: DECK_SIZE,
    cardTapeRange: [1, 14],
    deckCursor: { minimum: 0, maximum: DECK_SIZE },
    bounds: 'engineering-ready-to-select-admission-not-source-reachability-proof',
  },
  plans: {
    representation: 'two-plan-array-indexed-by-team-not-processing-order',
    selectionsPerActor: { minimum: 1, maximum: 2 },
    selection: 'current-physical-cardIndex-and-explicit-rawDraws-and-rawResults-arrays',
    cardIndex: { minimum: 0, maximum: 6 },
    ownership: 'index-must-be-in-current-active-prefix-and-contain-non-minus-one-card',
    finalSelection: 'one-through-fourteen-and-last-entry-with-empty-random-payloads',
    rethinkSelection: 'zero-then-action-reset-and-required-next-selection',
    maxAcceptedRethinksPerActor: 1,
    repeatedRethink: 'rejected-by-unchanged-availability-after-quota-false',
    syntaxBeforeDomainWork: true,
  },
  availability: {
    implementation: 'unchanged-evaluateDebateCardAvailability',
    policy: DEBATE_CARD_AVAILABILITY_POLICY_V1,
    characters: 'current-pair-personality-timer-and-canRethink',
    rejection: 'selected-card-unavailable',
    guardOrigin: 'explicit-engineering-policy-not-a-source-PlayPhase-or-PlayCard-check',
    result: 'full-unchanged-success-retained-per-accepted-selection',
  },
  removal: {
    sequence: [
      'write-selected-card-to-playedCard',
      'write-selected-physical-slot-minus-one',
      'clear-all-seven-backing-slots-to-minus-one',
      'copy-nonempty-active-survivors-in-ascending-original-slot-order',
    ],
    inactiveTail: 'cleared-even-when-nonempty-never-compacted-or-preserved',
    numericSort: false,
    zeroRestoration: 'none-at-removal-rethink-action-fill-later-restores-zero',
    provenance: 'per-removal-sourceIndex-to-destinationIndex-no-global-card-occurrence-identity',
  },
  rethink: {
    implementation: 'unchanged-evaluateDebateRethinkAction',
    policy: DEBATE_RETHINK_ACTION_POLICY_V1,
    input: 'actual-post-removal-character-with-playedCard-zero',
    retained: 'full-unchanged-success-including-receipt-clear-fill-calm-events-and-provenance',
    reset: 'after-action-success-write-playedCard-minus-one-before-next-selection',
    quota: 'false-from-action-not-reset-by-this-transaction',
    exhaustion: 'unsupported-deck-regeneration-with-whole-transaction-failure',
  },
  attacker: {
    implementation: 'unchanged-evaluateDebateAttackerSelection',
    policy: DEBATE_ATTACKER_SELECTION_POLICY_V1,
    input: 'both-final-played-cards-current-pair-personality-timer-and-currentTopic',
    assignment: 'returned-in-ready-for-attack-checkpoint',
    equalPower: -1,
    tutorialOverride: 'excluded-isTutorial-must-be-false',
    result: 'full-unchanged-success-retained',
  },
  randomness: {
    repairRawDraws: 'zero-or-one-per-selection-role-debate-fill-topic-repair-bound-nine-integer-zero-through-eight',
    calmRawResults: 'zero-or-one-per-selection-role-debate-calm-rethink-rand-bool-percent-forty-boolean',
    parsing: 'all-payload-syntax-and-domain-before-any-selection-work-no-dependency-probes',
    rethinkSemantics: 'unchanged-action-fill-then-calm-required-and-unused-payload-rules',
    ordinaryUnusedDraw: 'unexpected-raw-draw',
    ordinaryUnusedResult: 'raw-result-count-mismatch',
    eventOrder: 'first-actor-before-opponent-repair-before-calm-within-each-rethink',
    indices: 'outer-eventIndex-team-selectionIndex-plus-original-actionEventIndex-and-localIndex',
    noBound100Conversion: true,
    externalRngConsumed: 0,
  },
  safety: {
    input: 'closed-schema-detached-safe-JSON-data-with-exact-full-nested-policy',
    requiredRuntime: 'trusted-node-util-types-isProxy-via-process-getBuiltinModule',
    unavailableProxyDetector: 'fail-closed-before-inspecting-input',
    proxiesAccessorsAndExecutableValues: 'rejected-without-invocation',
    output: 'recursively-frozen-and-detached-from-caller',
    failure: 'typed-code-only-no-first-actor-state-or-partial-receipts',
    dependencyFailure: 'reason-propagated-without-partial-dependency-output',
  },
  capacity: {
    maxInputNodes: MAX_INPUT_NODES,
    maxInputDepth: MAX_INPUT_DEPTH,
    maxInputArrayLength: MAX_INPUT_ARRAY_LENGTH,
    maxCanonicalUtf8Bytes: MAX_CANONICAL_BYTES,
    maxSelections: 4,
    maxAvailabilityCalls: 4,
    maxRethinkCalls: 2,
    maxHandFillCalls: 2,
    maxCalmRethinkCalls: 2,
    attackerSelectionCalls: 1,
    maxRepairDraws: 2,
    maxBooleanResults: 2,
    maxRandomEvents: 4,
  },
  boundary: {
    kind: 'standalone-bounded-checked-paired-selection-data-transaction',
    completePlayPhase: false,
    sourceReachability: 'not-proved',
    personalityResolution: 'caller-supplied-no-person-lookup-or-fallback',
    attackDamageHpStressAndWinnerResolution: 'excluded',
    timersTurnStartTurnEndAndCallbacks: 'excluded',
    aiUiViewAndLogging: 'excluded',
    tutorialSimulation: 'excluded',
    deckGenerate: 'excluded-not-duplicated',
    globalCardOccurrenceIdentity: 'not-claimed',
    fullSessionAndPersistence: 'excluded',
    oldNineCardProfile: 'excluded',
    p078: 'excluded',
    legacyProfilesChanged: false,
  },
} as const;
type Policy = typeof POLICY;

const EVIDENCE = {
  sourceIdentity: 'modern-CSharp-translation-not-native-or-PK-or-Vanilla',
  repository: 'https://github.com/tankyc/sango_infinity',
  sourceCommit: 'a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef',
  debatePath: 'Project/Assets/Sango/Scripts/Game/Debate/Debate.cs',
  debateBlob: '0137498d10773cd4596d497083ccdf6a26b3a261',
  debateSha256: '622789ca8b8b6799a321526dcfb513d6622adf5b5d54025175c2a7795ef7da28',
  debatePhasePath: 'Project/Assets/Sango/Scripts/Game/Debate/DebatePhase.cs',
  sourceFirstActorSelectionRethinkResetLines: [174, 211],
  sourceOpponentSelectionRethinkResetLines: [216, 250],
  sourceDamagePhaseBeginLines: [255, 259],
  sourcePlayCardLines: [991, 1000],
  sourceRemoveCardLines: [454, 466],
  sourceResetPlayedCardLines: [1010, 1013],
  sourceCharacterRethinkLines: [491, 509],
  sourceRethinkActionLines: [1254, 1260],
  sourceAvailabilityLines: [934, 988],
  sourceAttackerSelectionLines: [1129, 1142],
  availability: DEBATE_CARD_AVAILABILITY_EVIDENCE_V1,
  rethinkAction: DEBATE_RETHINK_ACTION_EVIDENCE_V1,
  attackerSelection: DEBATE_ATTACKER_SELECTION_EVIDENCE_V1,
  sourceBehavior: 'first-actor-select-play-rethink-reset-reselect-then-opponent-then-ordinary-CalcAttacker',
  sourceRemoval: 'selected-slot-minus-one-all-seven-cleared-active-nonempty-survivors-stably-compacted',
  availabilityGuard: 'engineering-check-source-PlayPhase-and-PlayCard-do-not-enforce-IsCardAvailable',
  boundedPlans: 'engineering-one-final-selection-optionally-preceded-by-one-checked-rethink',
  readyCheckpoint: 'engineering-data-boundary-after-ordinary-CalcAttacker-not-complete-native-state',
  initialReadyHandAndWinnerAndTutorialAdmission: 'engineering-domain-not-source-reachability-proof',
  perRemovalProvenance: 'physical-slot-mapping-only-no-global-occurrence-identifiers',
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

type CharacterCheckpoint = {
  personality: Personality;
  angerTimer: number;
  maxCardCount: number;
  /** Seven backing slots: zero at slot 0, full active prefix, arbitrary tail. */
  hand: PhysicalHand;
  playedCard: -1;
  canRethink: boolean;
  cardTape: CardCode[];
  deckCursor: number;
};
type CharacterState = Omit<CharacterCheckpoint, 'playedCard'> & { playedCard: PhysicalCard };
type Selection = {
  /** Resolved against this actor's current hand, including any prior rethink. */
  cardIndex: number;
  rawDraws: RawDraw[];
  rawResults: RawResult[];
};
type Plan = { selections: Selection[] };
type Input = {
  schemaVersion: 1;
  profile: typeof PROFILE;
  policies: Policy;
  isTutorial: false;
  winner: -1;
  firstTeam: Team;
  currentTopic: number;
  characters: Pair<CharacterCheckpoint>;
  /** Array index is team, independently of firstTeam. */
  plans: Pair<Plan>;
};
type State = {
  isTutorial: false;
  winner: -1;
  firstTeam: Team;
  currentTopic: number;
  characters: Pair<CharacterState>;
};
type ReadyCheckpoint = State & {
  kind: 'ready-for-attack';
  sourceBoundary: 'after-DamagePhaseBegin-CalcAttacker-before-Attack';
  attacker: Attacker;
};
type PlayedCardWrite = { before: -1; after: SourceCard; beforeRemoval: true };
type DiscardedTailCard = { sourceIndex: number; card: SourceCard };
type Survivor = { sourceIndex: number; destinationIndex: number; card: SourceCard };
type RemovalAudit = {
  selectedIndex: number;
  selectedCard: SourceCard;
  activeSlotCount: number;
  handBefore: PhysicalHand;
  handAfterSelectedClear: PhysicalHand;
  handAfterBackingClear: PhysicalHand;
  handAfter: PhysicalHand;
  /** Only nonempty tail values, discarded even when their code is zero. */
  discardedTail: DiscardedTailCard[];
  survivors: Survivor[];
  allBackingSlotsCleared: true;
  numericSortPerformed: false;
};
type ResetAudit = { before: 0; after: -1; afterRethink: true; beforeReselection: true };
type SelectionAudit = {
  selectionOrder: number;
  actorOrder: Team;
  team: Team;
  selectionIndex: number;
  cardIndex: number;
  card: SourceCard;
  before: CharacterState;
  availability: DebateCardAvailabilitySuccessV1;
  playedCardWrite: PlayedCardWrite;
  removal: RemovalAudit;
  /** Full unchanged component result; its before is the post-removal state. */
  rethink: DebateRethinkActionSuccessV1 | null;
  reset: ResetAudit | null;
  after: CharacterState;
};
type EventContext = {
  eventIndex: number;
  team: Team;
  selectionIndex: number;
  /** Local event index from the unchanged rethink receipt, not global RNG. */
  actionEventIndex: number;
  localIndex: 0;
};
type RandomEvent = EventContext & (
  | { stage: 'fill-topic-repair'; kind: 'integer-draw'; draw: RawDraw }
  | {
      stage: 'calm-rethink-bonus';
      kind: 'boolean-result';
      result: Extract<DebateRethinkActionRandomEventV1, { kind: 'boolean-result' }>['result'];
    }
);
type Receipt = {
  schemaVersion: 1;
  profile: typeof PROFILE;
  policy: Policy;
  evidence: Evidence;
  before: State;
  after: ReadyCheckpoint;
  actorOrder: Pair<Team>;
  plans: Pair<Plan>;
  selections: SelectionAudit[];
  attackerSelection: DebateAttackerSelectionSuccessV1;
  randomEvents: RandomEvent[];
  selectionCount: 2 | 3 | 4;
  rethinkCount: 0 | 1 | 2;
  randomEventCount: 0 | 1 | 2 | 3 | 4;
  externalRngConsumed: 0;
};
type Success = {
  ok: true;
  schemaVersion: 1;
  profile: typeof PROFILE;
  policy: Policy;
  evidence: Evidence;
  attacker: Attacker;
  checkpoint: ReadyCheckpoint;
  receipt: Receipt;
};
type FailureReason = DebateCardAvailabilityFailureReasonV1
  | DebateRethinkActionFailureReasonV1
  | DebateAttackerSelectionFailureReasonV1
  | 'unsupported-tutorial'
  | 'invalid-winner'
  | 'invalid-first-team'
  | 'invalid-ready-hand'
  | 'invalid-plans'
  | 'invalid-plan'
  | 'invalid-selections'
  | 'invalid-selection'
  | 'invalid-card-index'
  | 'selected-index-not-active'
  | 'selected-card-empty'
  | 'selected-card-unavailable'
  | 'missing-final-selection'
  | 'unexpected-selection';
type Failure = { ok: false; reason: FailureReason };
type Result = Success | Failure;

export type DebateCheckedPlayTeamV1 = Team;
export type DebateCheckedPlayAttackerV1 = Attacker;
export type DebateCheckedPlayPersonalityV1 = Personality;
export type DebateCheckedPlayCardCodeV1 = CardCode;
export type DebateCheckedPlaySourceCardV1 = SourceCard;
export type DebateCheckedPlayPhysicalCardV1 = PhysicalCard;
export type DebateCheckedPlayPhysicalHandV1 = Frozen<PhysicalHand>;
export type DebateCheckedPlayRawDrawV1 = RawDraw;
export type DebateCheckedPlayRawResultV1 = RawResult;
export type DebateCheckedPlayCharacterCheckpointV1 = Frozen<CharacterCheckpoint>;
export type DebateCheckedPlayCharacterStateV1 = Frozen<CharacterState>;
export type DebateCheckedPlaySelectionV1 = Frozen<Selection>;
export type DebateCheckedPlayPlanV1 = Frozen<Plan>;
export type DebateCheckedPlayInputV1 = Frozen<Input>;
export type DebateCheckedPlayStateV1 = Frozen<State>;
export type DebateCheckedPlayReadyCheckpointV1 = Frozen<ReadyCheckpoint>;
export type DebateCheckedPlayPlayedCardWriteV1 = Frozen<PlayedCardWrite>;
export type DebateCheckedPlayDiscardedTailCardV1 = Frozen<DiscardedTailCard>;
export type DebateCheckedPlaySurvivorV1 = Frozen<Survivor>;
export type DebateCheckedPlayRemovalAuditV1 = Frozen<RemovalAudit>;
export type DebateCheckedPlayResetAuditV1 = Frozen<ResetAudit>;
export type DebateCheckedPlaySelectionAuditV1 = Frozen<SelectionAudit>;
export type DebateCheckedPlayRandomEventV1 = Frozen<RandomEvent>;
export type DebateCheckedPlayReceiptV1 = Frozen<Receipt>;
export type DebateCheckedPlaySuccessV1 = Frozen<Success>;
export type DebateCheckedPlayFailureReasonV1 = FailureReason;
export type DebateCheckedPlayFailureV1 = Frozen<Failure>;
export type DebateCheckedPlayResultV1 = Frozen<Result>;
export type DebateCheckedPlayPolicyV1 = Frozen<Policy>;
export type DebateCheckedPlayEvidenceV1 = Frozen<Evidence>;

/** @internal Trusted composition contracts; not public input or barrel exports. */
export type DebateCheckedPlayRethinkInternal = {
  character: DebateRethinkActionSuccessV1['character'];
  receipt: { randomEvents: DebateRethinkActionSuccessV1['receipt']['randomEvents'] };
};
export type DebateCheckedPlayBodyInternal<R extends DebateCheckedPlayRethinkInternal> = {
  ok: true;
  attacker: Attacker;
  checkpoint: ReadyCheckpoint;
  receipt: Omit<Receipt, 'schemaVersion' | 'profile' | 'policy' | 'evidence' | 'selections'> & {
    selections: (Omit<SelectionAudit, 'rethink'> & { rethink: R | null })[];
  };
};

class Invalid extends Error {
  readonly reason: FailureReason;
  constructor(reason: FailureReason) { super(reason); this.reason = reason; }
}
/** @internal Recognizes only this kernel's own typed failures, not callback errors. */
export function getDebateCheckedPlayFailureInternal(error: unknown): DebateCheckedPlayFailureV1 | null {
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
 * Reject proxies before reflection, read only data descriptors and never invoke
 * accessors. Reject cycles, nonplain prototypes, symbols, decorated/sparse
 * arrays, hidden fields, unsafe/nonintegral numbers, negative zero and all
 * executable/non-JSON values. Repeated acyclic references are copied separately.
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
/** Detachment already rejects nonintegral/unsafe numbers and negative zero. */
function integer(value: unknown, minimum: number, maximum: number, reason: FailureReason): number {
  if (typeof value !== 'number' || value < minimum || value > maximum) fail(reason);
  return value;
}
function parseCharacter(value: unknown): CharacterCheckpoint {
  const record = object(value, [
    'personality', 'angerTimer', 'maxCardCount', 'hand', 'playedCard',
    'canRethink', 'cardTape', 'deckCursor',
  ], 'invalid-character');
  if (record.personality !== 'timid' && record.personality !== 'calm' && record.personality !== 'bold' && record.personality !== 'reckless') fail('invalid-personality');
  const angerTimer = integer(record.angerTimer, 0, 4, 'invalid-anger-timer');
  const maxCardCount = integer(record.maxCardCount, 4, 7, 'invalid-max-card-count');
  if (!Array.isArray(record.hand) || record.hand.length !== PHYSICAL_HAND_SIZE) fail('invalid-hand');
  const hand = record.hand.map(card => integer(card, -1, 14, 'invalid-hand') as PhysicalCard) as PhysicalHand;
  if (hand[0] !== 0) fail('invalid-ready-hand');
  for (let slot = 1; slot < maxCardCount; slot++) if (hand[slot]! < 1) fail('invalid-ready-hand');
  // No numeric sort requirement: source removal preserves physical order.
  if (record.playedCard !== -1) fail('invalid-played-card');
  if (typeof record.canRethink !== 'boolean') fail('invalid-can-rethink');
  if (!Array.isArray(record.cardTape) || record.cardTape.length !== DECK_SIZE) fail('invalid-card-tape');
  const cardTape = record.cardTape.map(card => integer(card, 1, 14, 'unsupported-card-code') as CardCode);
  const deckCursor = integer(record.deckCursor, 0, DECK_SIZE, 'invalid-deck-cursor');
  return {
    personality: record.personality, angerTimer, maxCardCount, hand, playedCard: -1,
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
function parseSelection(value: unknown): Selection {
  const record = object(value, ['cardIndex', 'rawDraws', 'rawResults'], 'invalid-selection');
  const cardIndex = integer(record.cardIndex, 0, PHYSICAL_HAND_SIZE - 1, 'invalid-card-index');
  if (!Array.isArray(record.rawDraws) || record.rawDraws.length > 1) fail('invalid-raw-draws');
  const rawDraws = record.rawDraws.map(parseRawDraw);
  if (!Array.isArray(record.rawResults) || record.rawResults.length > 1) fail('invalid-raw-results');
  const rawResults = record.rawResults.map(parseRawResult);
  return { cardIndex, rawDraws, rawResults };
}
function parsePlan(value: unknown): Plan {
  const record = object(value, ['selections'], 'invalid-plan');
  if (!Array.isArray(record.selections) || record.selections.length < 1 || record.selections.length > 2) fail('invalid-selections');
  return { selections: record.selections.map(parseSelection) };
}
function parseInput(value: unknown): Input {
  const record = object(value, [
    'schemaVersion', 'profile', 'policies', 'isTutorial', 'winner', 'firstTeam',
    'currentTopic', 'characters', 'plans',
  ]);
  if (record.schemaVersion !== 1 || record.profile !== PROFILE) fail('unsupported-profile');
  if (canonical(record.policies) !== canonical(POLICY)) fail('unsupported-policy');
  if (record.isTutorial !== false) fail('unsupported-tutorial');
  if (record.winner !== -1) fail('invalid-winner');
  const firstTeam = integer(record.firstTeam, 0, 1, 'invalid-first-team') as Team;
  const currentTopic = integer(record.currentTopic, -2147483648, 2147483647, 'invalid-current-topic');
  if (!Array.isArray(record.characters) || record.characters.length !== 2) fail('invalid-characters');
  const characters: Pair<CharacterCheckpoint> = [parseCharacter(record.characters[0]), parseCharacter(record.characters[1])];
  if (!Array.isArray(record.plans) || record.plans.length !== 2) fail('invalid-plans');
  const plans: Pair<Plan> = [parsePlan(record.plans[0]), parsePlan(record.plans[1])];
  // All fields of both plans and all payloads are now parsed. No dependency was
  // called as a validation probe and no ownership/availability work has run.
  return { schemaVersion: 1, profile: PROFILE, policies: POLICY, isTutorial: false, winner: -1, firstTeam, currentTopic, characters, plans };
}
function copyCharacter(character: Frozen<CharacterState>): CharacterState {
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
function copyState(state: Frozen<State>): State {
  return {
    isTutorial: false,
    winner: -1,
    firstTeam: state.firstTeam,
    currentTopic: state.currentTopic,
    characters: [copyCharacter(state.characters[0]), copyCharacter(state.characters[1])],
  };
}
function removeCard(character: CharacterState, selectedIndex: number, selectedCard: SourceCard): RemovalAudit {
  const handBefore: PhysicalHand = [...character.hand];
  character.hand[selectedIndex] = -1;
  const handAfterSelectedClear: PhysicalHand = [...character.hand];
  const discardedTail: DiscardedTailCard[] = [];
  for (let sourceIndex = character.maxCardCount; sourceIndex < PHYSICAL_HAND_SIZE; sourceIndex++) {
    const card = handAfterSelectedClear[sourceIndex]!;
    if (card !== -1) discardedTail.push({ sourceIndex, card });
  }
  // Source clears the entire physical backing array, NOT just the active hand.
  character.hand = [-1, -1, -1, -1, -1, -1, -1];
  const handAfterBackingClear: PhysicalHand = [...character.hand];
  const survivors: Survivor[] = [];
  for (let sourceIndex = 0; sourceIndex < character.maxCardCount; sourceIndex++) {
    const card = handAfterSelectedClear[sourceIndex]!;
    if (card === -1) continue;
    const destinationIndex = survivors.length;
    character.hand[destinationIndex] = card;
    survivors.push({ sourceIndex, destinationIndex, card });
  }
  return {
    selectedIndex, selectedCard, activeSlotCount: character.maxCardCount,
    handBefore, handAfterSelectedClear, handAfterBackingClear,
    handAfter: [...character.hand], discardedTail, survivors,
    allBackingSlotsCleared: true, numericSortPerformed: false,
  };
}
function appendRandomEvents(events: RandomEvent[], rethink: DebateCheckedPlayRethinkInternal, team: Team, selectionIndex: number): void {
  for (const event of rethink.receipt.randomEvents) {
    const context: EventContext = {
      eventIndex: events.length, team, selectionIndex,
      actionEventIndex: event.eventIndex, localIndex: event.localIndex,
    };
    if (event.kind === 'integer-draw') {
      events.push({ ...context, stage: event.phase, kind: event.kind, draw: event.draw });
    } else {
      events.push({ ...context, stage: event.phase, kind: event.kind, result: event.result });
    }
  }
}
/** @internal Called with parsed data and engine-owned closures only. */
export function resolveDebateCheckedPlayInternal<R extends DebateCheckedPlayRethinkInternal>(
  input: Input,
  rethinkAction: (input: DebateRethinkActionInputV1, team: Team, selectionIndex: number) => R,
): DebateCheckedPlayBodyInternal<R> {
  const before = copyState(input);
  const state = copyState(input);
  const opponentTeam: Team = input.firstTeam === 0 ? 1 : 0;
  const actorOrder: Pair<Team> = [input.firstTeam, opponentTeam];
  const selections: (Omit<SelectionAudit, 'rethink'> & { rethink: R | null })[] = [];
  const randomEvents: RandomEvent[] = [];
  let rethinkCount = 0;

  for (let actorIndex = 0; actorIndex < actorOrder.length; actorIndex++) {
    const team = actorOrder[actorIndex]!;
    const plan = input.plans[team];
    for (let selectionIndex = 0; selectionIndex < plan.selections.length; selectionIndex++) {
      const selection = plan.selections[selectionIndex]!;
      let character = state.characters[team];
      const selectedIndex = selection.cardIndex;
      if (selectedIndex >= character.maxCardCount) fail('selected-index-not-active');
      const card = character.hand[selectedIndex]!;
      if (card === -1) fail('selected-card-empty');

      const availability = evaluateDebateCardAvailability({
        schemaVersion: 1,
        profile: 'debate-card-availability-reference-v1',
        policies: DEBATE_CARD_AVAILABILITY_POLICY_V1,
        team,
        characters: state.characters.map(actor => ({
          personality: actor.personality, angerTimer: actor.angerTimer, canRethink: actor.canRethink,
        })),
        card,
      });
      if (!availability.ok) fail(availability.reason);
      if (!availability.available) fail('selected-card-unavailable');

      const selectionBefore = copyCharacter(character);
      // Every admitted first selection starts at -1; rethink explicitly resets
      // to -1 before the only possible second selection. No normal reselect.
      const playedCardWrite: PlayedCardWrite = { before: -1, after: card, beforeRemoval: true };
      character.playedCard = card;
      const removal = removeCard(character, selectedIndex, card);
      let rethink: R | null = null;
      let reset: ResetAudit | null = null;

      if (card === 0) {
        const action = rethinkAction({
          schemaVersion: 1,
          profile: 'debate-rethink-action-reference-v1',
          policies: DEBATE_RETHINK_ACTION_POLICY_V1,
          currentTopic: state.currentTopic,
          character: { ...character, playedCard: 0 },
          rawDraws: selection.rawDraws,
          rawResults: selection.rawResults,
        }, team, selectionIndex);
        rethink = action;
        rethinkCount++;
        appendRandomEvents(randomEvents, action, team, selectionIndex);
        // Do not mutate or reinterpret the unchanged frozen action result.
        character = copyCharacter(action.character);
        state.characters[team] = character;
        reset = { before: 0, after: -1, afterRethink: true, beforeReselection: true };
        character.playedCard = -1;
        if (selectionIndex + 1 >= plan.selections.length) fail('missing-final-selection');
      } else {
        if (selectionIndex + 1 !== plan.selections.length) fail('unexpected-selection');
        if (selection.rawDraws.length !== 0) fail('unexpected-raw-draw');
        if (selection.rawResults.length !== 0) fail('raw-result-count-mismatch');
      }

      selections.push({
        selectionOrder: selections.length,
        actorOrder: actorIndex as Team,
        team, selectionIndex, cardIndex: selectedIndex, card,
        before: selectionBefore, availability, playedCardWrite, removal, rethink, reset,
        after: copyCharacter(character),
      });
      if (card !== 0) break;
    }
  }

  const attackerSelection = evaluateDebateAttackerSelection({
    schemaVersion: 1,
    profile: 'debate-attacker-selection-reference-v1',
    policies: DEBATE_ATTACKER_SELECTION_POLICY_V1,
    currentTopic: state.currentTopic,
    characters: state.characters.map(character => ({ personality: character.personality, angerTimer: character.angerTimer })),
    playedCards: [state.characters[0].playedCard, state.characters[1].playedCard],
  });
  if (!attackerSelection.ok) fail(attackerSelection.reason);
  const checkpoint: ReadyCheckpoint = {
    ...copyState(state),
    kind: 'ready-for-attack',
    sourceBoundary: 'after-DamagePhaseBegin-CalcAttacker-before-Attack',
    attacker: attackerSelection.attacker,
  };
  return {
    ok: true,
    attacker: attackerSelection.attacker,
    checkpoint,
    receipt: {
      before,
      after: checkpoint,
      actorOrder,
      plans: input.plans,
      selections,
      attackerSelection,
      randomEvents,
      selectionCount: selections.length as 2 | 3 | 4,
      rethinkCount: rethinkCount as 0 | 1 | 2,
      randomEventCount: randomEvents.length as 0 | 1 | 2 | 3 | 4,
      externalRngConsumed: 0,
    },
  };
}

/** @internal Safe original-shape admission, with unchanged v1 policy checking. */
export function parseDebateCheckedPlayInternal(input: unknown): Input {
  return parseInput(detach(input));
}
function resolve(input: Input): Success {
  const body = resolveDebateCheckedPlayInternal(input, actionInput => {
    const action = evaluateDebateRethinkAction(actionInput);
    if (!action.ok) fail(action.reason);
    return action;
  });
  return {
    ok: true, schemaVersion: 1, profile: PROFILE, policy: POLICY, evidence: EVIDENCE,
    attacker: body.attacker, checkpoint: body.checkpoint,
    receipt: { schemaVersion: 1, profile: PROFILE, policy: POLICY, evidence: EVIDENCE, ...body.receipt },
  };
}

export const DEBATE_CHECKED_PLAY_POLICY_V1: DebateCheckedPlayPolicyV1 = freeze(POLICY);
export const DEBATE_CHECKED_PLAY_EVIDENCE_V1: DebateCheckedPlayEvidenceV1 = freeze(EVIDENCE);

/**
 * Pure atomic checked transaction, not a resumable PlayPhase or debate session.
 * Safely detaches and parses both actors, both plans and every random payload
 * before any selection, availability query or dependent action. A failure has
 * only a frozen typed reason, never partial state, random events or receipts.
 * Every accepted selection uses the current physical index and availability.
 * Rethink preserves full unchanged component results, then resets playedCard.
 * The final checkpoint includes ordinary CalcAttacker but no Attack or damage.
 * No caller callback, external RNG, generation, tutorial, timer or persistence.
 */
export function evaluateDebateCheckedPlay(input: unknown): DebateCheckedPlayResultV1 {
  try {
    return freeze(resolve(parseInput(detach(input))));
  } catch (error) {
    return freeze(failure(error));
  }
}
