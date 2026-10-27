/**
 * Bounded post-anger route: unchanged public AngerPhase, then, only while its
 * winner remains -1, unchanged public TurnEnd -> TurnStart. This is a data
 * transaction, not a phase loop, normal attack, whole turn, or debate session.
 * The ordinary debate attacker is carried independently of combo.attacker.
 */
import {
  evaluateDebateAngerPhase,
  DEBATE_ANGER_PHASE_POLICY_V1,
  DEBATE_ANGER_PHASE_EVIDENCE_V1,
  type DebateAngerPhaseInputV1,
  type DebateAngerPhaseCharacterV1,
  type DebateAngerPhaseComboV1,
  type DebateAngerPhaseSnapshotV1,
  type DebateAngerPhaseTeamV1,
  type DebateAngerPhaseMaybeTeamV1,
  type DebateAngerPhasePersonalityV1,
  type DebateAngerPhaseHandV1,
  type DebateAngerPhaseCrumbleLevelV1,
  type DebateAngerPhasePassNumberV1,
  type DebateAngerPhaseRawDrawV1,
  type DebateAngerPhaseSuccessV1,
  type DebateAngerPhaseFailureV1,
} from './debate-anger-phase.ts';
import {
  evaluateDebateRoundTransition,
  DEBATE_ROUND_TRANSITION_POLICY_V1,
  DEBATE_ROUND_TRANSITION_EVIDENCE_V1,
  type DebateRoundTransitionAttackerV1,
  type DebateRoundTransitionCardCodeV1,
  type DebateRoundTransitionPhysicalCardV1,
  type DebateRoundTransitionRawDrawV1,
  type DebateRoundTransitionTopicRawDrawV1,
  type DebateRoundTransitionInputV1,
  type DebateRoundTransitionCharacterInputV1,
  type DebateRoundTransitionCharacterCheckpointV1,
  type DebateRoundTransitionTopicConsumedDrawV1,
  type DebateRoundTransitionFillConsumedDrawV1,
  type DebateRoundTransitionSuccessV1,
  type DebateRoundTransitionFailureV1,
} from './debate-round-transition.ts';

type Frozen<T> = T extends object ? { readonly [K in keyof T]: Frozen<T[K]> } : T;
type Mutable<T> = T extends object ? { -readonly [K in keyof T]: Mutable<T[K]> } : T;
type Pair<T> = [T, T];
type Team = DebateAngerPhaseTeamV1;
type MaybeTeam = DebateAngerPhaseMaybeTeamV1;
type Attacker = DebateRoundTransitionAttackerV1;
type PhysicalCard = DebateRoundTransitionPhysicalCardV1;
type CardCode = DebateRoundTransitionCardCodeV1;
type FillRawDraw = Mutable<DebateRoundTransitionRawDrawV1>;
type TopicRawDraw = Mutable<DebateRoundTransitionTopicRawDrawV1>;
type CrumbleLevel = DebateAngerPhaseCrumbleLevelV1;
type NextCheckpoint = 'terminal-pending-classification' | 'ready-for-play';
const PROFILE = 'debate-anger-transition-reference-v1' as const;
const DECK_SIZE = 18;
const MAX_INPUT_NODES = 16384;
const MAX_INPUT_DEPTH = 24;
const MAX_INPUT_ARRAY_LENGTH = 64;
const MAX_CANONICAL_BYTES = 131072;

/**
 * Static budget argument, not an execution or validation result:
 * the fixed complete anger/round source artifacts enclose their policies in
 * 13,293 / 23,713 bytes, with conservative JSON-node upper bounds 549 / 883
 * (colon + comma + opening-square-bracket counts + one; string punctuation
 * only overcounts). Input expands two anger policies and one round policy.
 * Wrapper policy plus fixed checkpoint/draw fields fit below another 2,048
 * nodes, so the complete admitted envelope is below 4,096 nodes, with ample
 * margin inside 16,384. Fixed policy text, quoted-key overhead, and bounded
 * checkpoint text fit below 100,000 canonical bytes, inside 131,072.
 * Wrapping adds at most three levels to the unchanged depth-16 dependencies;
 * no admitted array exceeds 64. Each dependency receives only its own original
 * policy and original-sized checkpoint, not this wrapper policy or receipts:
 * their unchanged 4,096-node / 65,536-byte input budgets are not multiplied.
 */
const POLICY = {
  id: 'debate-anger-transition-bounded-current-deck-policy-v1',
  profile: PROFILE,
  composition: {
    anger: 'one-unchanged-public-evaluateDebateAngerPhase-call',
    angerPolicy: DEBATE_ANGER_PHASE_POLICY_V1,
    transition: 'one-unchanged-public-evaluateDebateRoundTransition-call-only-if-anger-winner-minus-one',
    transitionPolicy: DEBATE_ROUND_TRANSITION_POLICY_V1,
    order: ['complete-anger-phase', 'inspect-actual-winner', 'conditional-round-transition'],
    nestedResults: 'preserve-complete-dependency-successes-including-all-policies-evidence-and-receipts',
    noValidationProbes: true,
    noCopiedGameplay: true,
  },
  input: {
    envelope: 'schemaVersion-profile-policies-anger-transition',
    anger: 'complete-unchanged-public-anger-input-with-its-complete-exact-policy',
    transition: 'isTutorial-attacker-currentTopic-two-team-metadata-topicRawDraws',
    teamMetadata: 'playedCard-canRethink-current18-cardTape-deckCursor-rawDraws',
    singleSource: 'hp-stress-strength-personality-timer-capacity-hand-combo-firstTeam-winner-and-crumble-come-only-from-anger',
    parseOrder: 'detach-entire-envelope-then-parse-all-transition-syntax-and-canonical-initial-hands-before-actual-anger-call',
    nestedValidation: 'anger-public-call-validates-its-full-closed-schema-before-its-own-gameplay',
  },
  admission: {
    kind: 'explicit-engineering-intersection-not-universal-source-reachability',
    genericOnly: true,
    isTutorial: false,
    initialWinner: -1,
    initialHp: { minimum: 1, maximum: 1000 },
    initialCombo: 'inactive-under-unchanged-anger-policy',
    initialHand: {
      physicalLength: 7,
      maxCardCount: { minimum: 4, maximum: 7 },
      slotZero: 0,
      activeOtherSlots: 'minus-one-vacancy-or-one-through-fourteen-no-zero',
      inactiveTail: 'minus-one-through-fourteen',
      preservation: 'existing-anger-removals-shift-only-active-prefix-and-write-minus-one-never-introduce-active-zero',
    },
    playedCard: { minimum: -1, maximum: 14 },
    cardTape: { length: DECK_SIZE, minimum: 1, maximum: 14 },
    deckCursor: { minimum: 0, maximum: DECK_SIZE },
    attacker: [-1, 0, 1],
    currentTopic: { minimum: -2147483648, maximum: 2147483647 },
    flags: 'canRethink-required-boolean-in-metadata-crumbled-owned-by-anger',
    widerActionOutputs: 'not-accepted-arbitrarily-no-PR120-or-other-wider-output-admission-claim',
    otherAngerBounds: 'unchanged-complete-anger-policy',
  },
  routing: {
    source: 'AngerPhase-case-three-or-eight-winner-before-TurnEndPhase-then-TurnStart',
    terminal: 'anger-winner-not-minus-one',
    terminalResult: 'terminal-pending-classification',
    terminalTransitionCalls: 0,
    terminalDraws: 'all-topic-and-both-fill-draw-arrays-must-be-empty',
    terminalMetadata: 'preserve-firstTeam-attacker-currentTopic-playedCards-quota-cardTapes-and-cursors',
    nonterminal: 'anger-winner-minus-one',
    nonterminalResult: 'ready-for-play',
    firstPassTerminal: 'anger-dependency-skips-second-pass-and-crumble',
    secondPassTerminal: 'anger-dependency-finishes-crumble-before-winner',
    classification: 'do-not-call-CanCritical-Critical-or-Closing',
  },
  mapping: {
    afterAnger: 'overlay-mutated-hp-stress-timer-hand-combo-crumble-levels-and-flags-over-carried-metadata',
    roundInput: 'post-anger-personality-timer-capacity-hand-crumble-plus-original-playedCards-quota-cardTapes-cursors-and-draws',
    ordinaryAttacker: 'original-transition-attacker-never-combo-attacker-never-recomputed-after-timer-decay',
    topic: 'original-currentTopic-until-round-transition-applies-source-rules',
    afterRound: 'overlay-timer-hand-playedCard-canRethink-crumbled-cardTape-deckCursor-firstTeam-currentTopic',
    preservedAfterRound: 'hp-stress-strength-personality-capacity-combo-crumble-levels-attacker-and-winner',
    rawDraws: 'evaluation-input-only-not-persistent-character-state',
  },
  randomness: {
    supplied: 'anger-two-pass-draws-plus-transition-topic-and-two-fill-arrays',
    syntax: 'all-transition-draw-syntax-validated-before-anger-even-on-terminal-route',
    demand: 'unchanged-anger-then-unchanged-round-dependencies-except-terminal-unused-transition-rejection',
    order: ['anger-pass-one', 'anger-pass-two-if-executed', 'turn-end-topic', 'turn-start-team-zero-fill', 'turn-start-team-one-fill'],
    globalIndex: 'flatDrawIndex-zero-based-contiguous-across-executed-stages',
    angerIndices: 'preserve-angerGlobalIndex-pass-passDrawIndex-and-combo-attacker-teamIndex',
    transitionIndices: 'preserve-roundTransitionFlatDrawIndex-teamIndex-localDrawIndex-and-turnStartFlatDrawIndex-where-present',
    nestedIndices: 'never-rewrite-dependency-results',
    maximumAngerDraws: 8,
    maximumTopicDraws: 1,
    maximumFillDraws: 2,
    maximumTotalDraws: 11,
    maximumMeaning: 'conservative-sum-of-dependency-bounds-not-simultaneous-attainability-claim',
    externalRngConsumed: 0,
    implementation: 'none-no-native-stream-claim',
  },
  safety: {
    input: 'closed-schema-detached-safe-JSON-data-with-complete-exact-policies',
    requiredRuntime: 'trusted-node-util-types-isProxy-via-process-getBuiltinModule',
    unavailableProxyDetector: 'fail-closed-before-inspecting-input',
    proxiesAccessorsAndExecutableValues: 'rejected-without-invocation',
    output: 'recursively-frozen-detached-from-caller',
    failure: 'typed-wrapper-validation-or-tagged-complete-dependency-failure-no-partial-state-or-receipt',
    dependencyFailure: 'retain-anger-pass-and-kernelReason-and-all-other-existing-failure-fields',
  },
  capacity: {
    maxInputNodes: MAX_INPUT_NODES,
    maxInputDepth: MAX_INPUT_DEPTH,
    maxInputArrayLength: MAX_INPUT_ARRAY_LENGTH,
    maxCanonicalUtf8Bytes: MAX_CANONICAL_BYTES,
    angerCalls: 1,
    roundTransitionCalls: 1,
    nestedEntryCalls: 2,
    nestedComboCalls: 2,
    nestedTurnStartCalls: 1,
    nestedHandFillCalls: 2,
    maxConsumedDraws: 11,
    policyCopiesInInput: 'one-anger-and-one-round-in-wrapper-policy-plus-one-anger-in-nested-input',
    budgetProof: 'three-fixed-dependency-policies-plus-bounded-wrapper-policy-and-checkpoints-no-state-or-policy-amplification-in-dependency-inputs',
    dependencyBudgets: 'unchanged-anger4096-depth16-array64-bytes65536-round4096-depth16-array32-bytes65536',
    output: 'bounded-full-receipts-not-subject-to-input-budget-and-not-a-valid-next-input-envelope',
  },
  boundary: {
    kind: 'bounded-post-anger-to-ready-or-terminal-pending-classification-reference-transaction',
    ordinaryNormalAttack: 'excluded',
    winnerClassification: 'excluded',
    deckRegeneration: 'excluded-current-eighteen-card-tapes-only',
    exhaustedCurrentTape: 'unchanged-round-failure-when-refill-needs-regeneration',
    tutorial: 'excluded',
    oldNineCardProfile: 'excluded',
    p078: 'excluded',
    personAndAttackResolution: 'caller-supplied-not-derived',
    sourcePhaseSchedulingViewLogsAndCallbacks: 'not-executed',
    fullTurnFullSessionCampaignAndPersistence: 'excluded',
    legacyProfilesChanged: false,
  },
} as const;
type Policy = typeof POLICY;

const EVIDENCE = {
  sourceIdentity: 'modern-CSharp-translation-not-native-original-PK-or-Vanilla',
  repository: 'https://github.com/tankyc/sango_infinity',
  sourceCommit: 'a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef',
  debatePath: 'Project/Assets/Sango/Scripts/Game/Debate/Debate.cs',
  debateBlob: '0137498d10773cd4596d497083ccdf6a26b3a261',
  debateSha256: '622789ca8b8b6799a321526dcfb513d6622adf5b5d54025175c2a7795ef7da28',
  phasePath: 'Project/Assets/Sango/Scripts/Game/Debate/DebatePhase.cs',
  phaseBlob: '6aa98f855a5d4d172cde7e8ffc18a141b8a7b587',
  phaseSha256: '5b47f7b6a89d6123a23e7c14f22168e59c9edd549e98d9bc0258d8a55bb9cbf3',
  sourceAngerPhaseLines: [333, 390],
  sourceWinnerLines: [1379, 1396],
  sourceExcludedCriticalLines: [1398, 1406],
  sourceTurnEndPhaseLines: [262, 274],
  sourceTurnStartPhaseLines: [163, 168],
  sourceTurnEndLines: [1083, 1126],
  sourceTurnStartLines: [1046, 1079],
  route: 'actual-anger-winner-branches-before-TurnEnd-only-nonterminal-proceeds-to-TurnStart',
  attacker: 'source-ordinary-debate-attacker-distinct-from-comboAttacker',
  anger: DEBATE_ANGER_PHASE_EVIDENCE_V1,
  transition: DEBATE_ROUND_TRANSITION_EVIDENCE_V1,
  implementationBase: 'main-20cdd4ef',
  admissionSafetyBudgetsSchemaAndAuditNames: 'explicit-engineering-policy-not-complete-source-reachability',
  canonicalHandIntersection: 'slot-zero-canonical-and-no-active-zero-before-anger-then-existing-active-prefix-removals-preserve-round-admission',
  compression: 'phase-ticks-compressed-to-bounded-data-transaction-no-phase-engine',
  nativeEquivalent: false,
  stockOriginalVerified: false,
  pkEquivalent: false,
  vanillaEquivalent: false,
  completeDebate: false,
  nativeWholeChain: 'open',
  nativeDeckRegeneration: 'excluded',
  nativeRngStream: 'excluded',
  legacySessionIntegration: 'excluded',
  p078: 'excluded',
} as const;
type Evidence = typeof EVIDENCE;

/** Only metadata absent from the anger checkpoint; no competing hand or HP. */
type TransitionCharacter = {
  playedCard: PhysicalCard;
  canRethink: boolean;
  cardTape: CardCode[];
  deckCursor: number;
  rawDraws: FillRawDraw[];
};
type TransitionContext = {
  isTutorial: false;
  /** Already-resolved ordinary attacker, independent of combo.attacker. */
  attacker: Attacker;
  currentTopic: number;
  characters: Pair<TransitionCharacter>;
  topicRawDraws: TopicRawDraw[];
};
type Input = {
  schemaVersion: 1;
  profile: typeof PROFILE;
  policies: Policy;
  anger: DebateAngerPhaseInputV1;
  transition: TransitionContext;
};
/** The unchanged anger evaluator validates this unknown payload exactly once. */
type ParsedInput = { anger: unknown; transition: TransitionContext };
type Character = Mutable<DebateAngerPhaseCharacterV1> & {
  playedCard: PhysicalCard;
  canRethink: boolean;
  crumbled: boolean;
  cardTape: CardCode[];
  deckCursor: number;
};
type State = {
  genericOnly: true;
  isTutorial: false;
  firstTeam: Team;
  attacker: Attacker;
  currentTopic: number;
  winner: MaybeTeam;
  characters: Pair<Character>;
  combo: Mutable<DebateAngerPhaseComboV1>;
  crumbledLevels: Pair<CrumbleLevel>;
};
type AngerConsumedDraw = {
  flatDrawIndex: number;
  stage: 'anger-combo';
  teamIndex: Team;
  angerGlobalIndex: number;
  pass: DebateAngerPhasePassNumberV1;
  passDrawIndex: number;
  draw: DebateAngerPhaseRawDrawV1;
};
type TopicConsumedDraw = Mutable<DebateRoundTransitionTopicConsumedDrawV1> & {
  roundTransitionFlatDrawIndex: number;
};
type FillConsumedDraw = Mutable<DebateRoundTransitionFillConsumedDrawV1> & {
  roundTransitionFlatDrawIndex: number;
};
type ConsumedDraw = AngerConsumedDraw | TopicConsumedDraw | FillConsumedDraw;
type Receipt = {
  schemaVersion: 1;
  profile: typeof PROFILE;
  policy: Policy;
  evidence: Evidence;
  before: State;
  afterAnger: State;
  after: State;
  /** Complete success, not a projection or reconstructed receipt. */
  anger: DebateAngerPhaseSuccessV1;
  /** Null means no round-transition evaluator was called. */
  transition: DebateRoundTransitionSuccessV1 | null;
  /** Null on terminal route; otherwise the number of preceding anger draws. */
  transitionDrawOffset: number | null;
  consumedDraws: ConsumedDraw[];
  drawCount: number;
  nextCheckpoint: NextCheckpoint;
  externalRngConsumed: 0;
};
type Success = {
  ok: true;
  schemaVersion: 1;
  profile: typeof PROFILE;
  policy: Policy;
  evidence: Evidence;
  state: State;
  nextCheckpoint: NextCheckpoint;
  receipt: Receipt;
};
type ValidationFailureReason =
  | 'unsupported-runtime'
  | 'input-limit'
  | 'malformed-data'
  | 'unknown-field'
  | 'unsupported-profile'
  | 'unsupported-policy'
  | 'unsupported-tutorial'
  | 'invalid-transition'
  | 'invalid-transition-characters'
  | 'invalid-transition-character'
  | 'invalid-attacker'
  | 'invalid-current-topic'
  | 'invalid-played-card'
  | 'invalid-can-rethink'
  | 'invalid-card-tape'
  | 'unsupported-card-code'
  | 'invalid-deck-cursor'
  | 'invalid-fill-raw-draws'
  | 'invalid-fill-raw-draw'
  | 'invalid-topic-raw-draws'
  | 'invalid-topic-raw-draw'
  | 'invalid-anger-input'
  | 'invalid-anger-characters'
  | 'invalid-initial-hand-capacity'
  | 'invalid-initial-hand'
  | 'unused-transition-draws';
type ValidationFailure = { ok: false; reason: ValidationFailureReason };
type DependencyFailure =
  | { ok: false; reason: 'anger-phase-failure'; dependencyFailure: DebateAngerPhaseFailureV1 }
  | { ok: false; reason: 'round-transition-failure'; dependencyFailure: DebateRoundTransitionFailureV1 };
type FailureReason = ValidationFailureReason | DependencyFailure['reason'];
type Failure = ValidationFailure | DependencyFailure;
type Result = Success | Failure;

export type DebateAngerTransitionTeamV1 = Team;
export type DebateAngerTransitionMaybeTeamV1 = MaybeTeam;
export type DebateAngerTransitionAttackerV1 = Attacker;
export type DebateAngerTransitionPersonalityV1 = DebateAngerPhasePersonalityV1;
export type DebateAngerTransitionCardCodeV1 = CardCode;
export type DebateAngerTransitionPhysicalCardV1 = PhysicalCard;
export type DebateAngerTransitionHandV1 = DebateAngerPhaseHandV1;
export type DebateAngerTransitionComboV1 = DebateAngerPhaseComboV1;
export type DebateAngerTransitionCrumbleLevelV1 = CrumbleLevel;
export type DebateAngerTransitionAngerRawDrawV1 = DebateAngerPhaseRawDrawV1;
export type DebateAngerTransitionFillRawDrawV1 = Frozen<FillRawDraw>;
export type DebateAngerTransitionTopicRawDrawV1 = Frozen<TopicRawDraw>;
export type DebateAngerTransitionNextCheckpointV1 = NextCheckpoint;
export type DebateAngerTransitionTransitionCharacterV1 = Frozen<TransitionCharacter>;
export type DebateAngerTransitionTransitionContextV1 = Frozen<TransitionContext>;
export type DebateAngerTransitionInputV1 = Frozen<Input>;
export type DebateAngerTransitionCharacterV1 = Frozen<Character>;
export type DebateAngerTransitionStateV1 = Frozen<State>;
export type DebateAngerTransitionAngerConsumedDrawV1 = Frozen<AngerConsumedDraw>;
export type DebateAngerTransitionTopicConsumedDrawV1 = Frozen<TopicConsumedDraw>;
export type DebateAngerTransitionFillConsumedDrawV1 = Frozen<FillConsumedDraw>;
export type DebateAngerTransitionConsumedDrawV1 = Frozen<ConsumedDraw>;
export type DebateAngerTransitionReceiptV1 = Frozen<Receipt>;
export type DebateAngerTransitionSuccessV1 = Frozen<Success>;
export type DebateAngerTransitionValidationFailureReasonV1 = ValidationFailureReason;
export type DebateAngerTransitionValidationFailureV1 = Frozen<ValidationFailure>;
export type DebateAngerTransitionDependencyFailureV1 = Frozen<DependencyFailure>;
export type DebateAngerTransitionFailureReasonV1 = FailureReason;
export type DebateAngerTransitionFailureV1 = Frozen<Failure>;
export type DebateAngerTransitionResultV1 = Frozen<Result>;
export type DebateAngerTransitionPolicyV1 = Frozen<Policy>;
export type DebateAngerTransitionEvidenceV1 = Frozen<Evidence>;

/** @internal Trusted dependency body, not a user callback or a v1 receipt. */
export type DebateAngerTransitionRoundSuccessInternal = Pick<DebateRoundTransitionSuccessV1, 'state' | 'characters'> & {
  receipt: Pick<DebateRoundTransitionSuccessV1['receipt'], 'consumedDraws'>;
};
export type DebateAngerTransitionRoundInternal<R extends DebateAngerTransitionRoundSuccessInternal> =
  (input: DebateRoundTransitionInputV1) => R;
export type DebateAngerTransitionBodyInternal<R extends DebateAngerTransitionRoundSuccessInternal> =
  Omit<Success, 'schemaVersion' | 'profile' | 'policy' | 'evidence' | 'receipt'> & {
    receipt: Omit<Receipt, 'schemaVersion' | 'profile' | 'policy' | 'evidence' | 'transition'> & { transition: R | null };
  };

class Invalid extends Error {
  readonly failure: Failure;
  constructor(failure: Failure) { super(failure.reason); this.failure = failure; }
}
function abort(failure: Failure): never { throw new Invalid(failure); }
function fail(reason: ValidationFailureReason): never { return abort({ ok: false, reason }); }
function failure(error: unknown): Failure {
  return error instanceof Invalid ? error.failure : { ok: false, reason: 'malformed-data' };
}
function freeze<T>(value: T): Frozen<T> {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value as Frozen<T>;
}
/** Only detached JSON data or trusted internal constants reach this helper. */
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
 * Read data descriptors only. Reject proxies before reflection, accessors,
 * symbols, hidden/decorated fields, nonplain prototypes, sparse arrays, cycles,
 * nonintegral/unsafe numbers, negative zero, and executable/non-JSON values.
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
function object(value: unknown, keys: readonly string[], reason: ValidationFailureReason = 'malformed-data'): Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) fail(reason);
  const record = value as Record<string, unknown>;
  if (Object.keys(record).some(key => !keys.includes(key))) fail('unknown-field');
  if (keys.some(key => !Object.hasOwn(record, key))) fail('malformed-data');
  return record;
}
/** Detachment has already rejected nonintegral, unsafe, and negative-zero values. */
function integer(value: unknown, minimum: number, maximum: number, reason: ValidationFailureReason): number {
  if (typeof value !== 'number' || value < minimum || value > maximum) fail(reason);
  return value;
}
function parseFillRawDraw(value: unknown): FillRawDraw {
  const record = object(value, ['role', 'bound', 'value'], 'invalid-fill-raw-draw');
  if (record.role !== 'debate-fill-topic-repair' || record.bound !== 9) fail('invalid-fill-raw-draw');
  return { role: 'debate-fill-topic-repair', bound: 9, value: integer(record.value, 0, 8, 'invalid-fill-raw-draw') };
}
function parseTopicRawDraw(value: unknown): TopicRawDraw {
  const record = object(value, ['role', 'bound', 'value'], 'invalid-topic-raw-draw');
  if (record.role !== 'debate-turn-end-topic-reroll' || record.bound !== 3) fail('invalid-topic-raw-draw');
  return { role: 'debate-turn-end-topic-reroll', bound: 3, value: integer(record.value, 0, 2, 'invalid-topic-raw-draw') };
}
function parseTransitionCharacter(value: unknown): TransitionCharacter {
  const record = object(value, ['playedCard', 'canRethink', 'cardTape', 'deckCursor', 'rawDraws'], 'invalid-transition-character');
  const playedCard = integer(record.playedCard, -1, 14, 'invalid-played-card') as PhysicalCard;
  if (typeof record.canRethink !== 'boolean') fail('invalid-can-rethink');
  if (!Array.isArray(record.cardTape) || record.cardTape.length !== DECK_SIZE) fail('invalid-card-tape');
  const cardTape = record.cardTape.map(card => integer(card, 1, 14, 'unsupported-card-code') as CardCode);
  const deckCursor = integer(record.deckCursor, 0, DECK_SIZE, 'invalid-deck-cursor');
  if (!Array.isArray(record.rawDraws) || record.rawDraws.length > 1) fail('invalid-fill-raw-draws');
  const rawDraws = record.rawDraws.map(parseFillRawDraw);
  return { playedCard, canRethink: record.canRethink, cardTape, deckCursor, rawDraws };
}
function parseTransition(value: unknown): TransitionContext {
  const record = object(value, ['isTutorial', 'attacker', 'currentTopic', 'characters', 'topicRawDraws'], 'invalid-transition');
  if (record.isTutorial !== false) fail('unsupported-tutorial');
  const attacker = integer(record.attacker, -1, 1, 'invalid-attacker') as Attacker;
  const currentTopic = integer(record.currentTopic, -2147483648, 2147483647, 'invalid-current-topic');
  if (!Array.isArray(record.characters) || record.characters.length !== 2) fail('invalid-transition-characters');
  const characters: Pair<TransitionCharacter> = [parseTransitionCharacter(record.characters[0]), parseTransitionCharacter(record.characters[1])];
  if (!Array.isArray(record.topicRawDraws) || record.topicRawDraws.length > 1) fail('invalid-topic-raw-draws');
  const topicRawDraws = record.topicRawDraws.map(parseTopicRawDraw);
  return { isTutorial: false, attacker, currentTopic, characters, topicRawDraws };
}
/**
 * Narrow only the hand intersection needed for this composition. All remaining
 * anger schema, exact policy, HP, combo, and draw checks are owned by its one
 * actual public evaluation, never by a speculative evaluator/validation call.
 */
function admitCanonicalInitialHands(value: unknown): void {
  const record = object(value, [
    'schemaVersion', 'profile', 'policies', 'genericOnly', 'firstTeam', 'winner',
    'characters', 'combo', 'crumbledLevels', 'crumbled', 'resolvedAttacks', 'passDraws',
  ], 'invalid-anger-input');
  if (!Array.isArray(record.characters) || record.characters.length !== 2) fail('invalid-anger-characters');
  for (const value of record.characters) {
    const character = object(value, ['personality', 'strength', 'hp', 'stress', 'angerTimer', 'maxCardCount', 'hand'], 'invalid-anger-characters');
    const capacity = integer(character.maxCardCount, 4, 7, 'invalid-initial-hand-capacity');
    if (!Array.isArray(character.hand) || character.hand.length !== 7) fail('invalid-initial-hand');
    for (let slot = 0; slot < 7; slot++) {
      const card = integer(character.hand[slot], -1, 14, 'invalid-initial-hand');
      if ((slot === 0 && card !== 0) || (slot > 0 && slot < capacity && card === 0)) fail('invalid-initial-hand');
    }
  }
}
function parseInput(value: unknown): ParsedInput {
  const record = object(value, ['schemaVersion', 'profile', 'policies', 'anger', 'transition']);
  if (record.schemaVersion !== 1 || record.profile !== PROFILE) fail('unsupported-profile');
  if (canonical(record.policies) !== canonical(POLICY)) fail('unsupported-policy');
  // Complete both metadata records and every transition draw before invoking
  // any domain evaluator, including when the later anger route is terminal.
  const transition = parseTransition(record.transition);
  admitCanonicalInitialHands(record.anger);
  return { anger: record.anger, transition };
}
function joinCharacter(character: DebateAngerPhaseCharacterV1, crumbled: boolean, metadata: TransitionCharacter): Character {
  return {
    ...character,
    hand: [...character.hand],
    playedCard: metadata.playedCard,
    canRethink: metadata.canRethink,
    crumbled,
    cardTape: metadata.cardTape.slice(),
    deckCursor: metadata.deckCursor,
  };
}
function joinState(snapshot: DebateAngerPhaseSnapshotV1, firstTeam: Team, transition: TransitionContext): State {
  return {
    genericOnly: true, isTutorial: false, firstTeam,
    attacker: transition.attacker, currentTopic: transition.currentTopic,
    winner: snapshot.winner,
    characters: [
      joinCharacter(snapshot.characters[0], snapshot.crumbled[0], transition.characters[0]),
      joinCharacter(snapshot.characters[1], snapshot.crumbled[1], transition.characters[1]),
    ],
    combo: { ...snapshot.combo },
    crumbledLevels: [...snapshot.crumbledLevels],
  };
}
function copyCharacter(character: Character): Character {
  return { ...character, hand: [...character.hand], cardTape: character.cardTape.slice() };
}
function copyState(state: State): State {
  return {
    ...state,
    characters: [copyCharacter(state.characters[0]), copyCharacter(state.characters[1])],
    combo: { ...state.combo },
    crumbledLevels: [...state.crumbledLevels],
  };
}
function roundCharacter(character: Character, metadata: TransitionCharacter): DebateRoundTransitionCharacterInputV1 {
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
    rawDraws: metadata.rawDraws,
  };
}
/** Only round-owned fields are overlaid; no HP, stress, or combo reconstruction. */
function overlayRoundCharacter(before: Character, after: DebateRoundTransitionCharacterCheckpointV1): Character {
  return {
    ...before,
    angerTimer: after.angerTimer,
    hand: [...after.hand],
    playedCard: after.playedCard,
    canRethink: after.canRethink,
    crumbled: after.crumbled,
    cardTape: after.cardTape.slice(),
    deckCursor: after.deckCursor,
  };
}
function resolveBody<R extends DebateAngerTransitionRoundSuccessInternal>(input: ParsedInput, runRound: DebateAngerTransitionRoundInternal<R>): DebateAngerTransitionBodyInternal<R> {
  const anger = evaluateDebateAngerPhase(input.anger);
  if (!anger.ok) abort({ ok: false, reason: 'anger-phase-failure', dependencyFailure: anger });
  const before = joinState(anger.receipt.before, anger.receipt.firstTeam, input.transition);
  const afterAnger = joinState(anger, anger.receipt.firstTeam, input.transition);
  const consumedDraws: ConsumedDraw[] = [];
  for (const pass of anger.receipt.passes) {
    if (pass.comboReceipt === null) continue;
    for (const use of pass.drawAudit.consumed) {
      consumedDraws.push({
        flatDrawIndex: consumedDraws.length,
        stage: 'anger-combo',
        teamIndex: pass.comboReceipt.attackerTeam,
        angerGlobalIndex: use.globalIndex,
        pass: use.pass,
        passDrawIndex: use.passDrawIndex,
        draw: use.draw,
      });
    }
  }
  let after = copyState(afterAnger);
  let transition: R | null = null;
  let transitionDrawOffset: number | null = null;
  let nextCheckpoint: NextCheckpoint;
  // Source winner route is tested before any TurnEnd work. Never send a
  // terminal checkpoint through a nonterminal transition as a validation probe.
  if (anger.winner !== -1) {
    if (input.transition.topicRawDraws.length !== 0 || input.transition.characters[0].rawDraws.length !== 0 || input.transition.characters[1].rawDraws.length !== 0) {
      fail('unused-transition-draws');
    }
    nextCheckpoint = 'terminal-pending-classification';
  } else {
    const result = runRound({
      schemaVersion: 1,
      profile: 'debate-round-transition-reference-v1',
      policies: DEBATE_ROUND_TRANSITION_POLICY_V1,
      isTutorial: false,
      winner: -1,
      firstTeam: afterAnger.firstTeam,
      attacker: input.transition.attacker,
      currentTopic: input.transition.currentTopic,
      characters: [
        roundCharacter(afterAnger.characters[0], input.transition.characters[0]),
        roundCharacter(afterAnger.characters[1], input.transition.characters[1]),
      ],
      topicRawDraws: input.transition.topicRawDraws,
    });
    transition = result;
    transitionDrawOffset = consumedDraws.length;
    for (const use of result.receipt.consumedDraws) {
      consumedDraws.push({
        ...use,
        flatDrawIndex: consumedDraws.length,
        roundTransitionFlatDrawIndex: use.flatDrawIndex,
      });
    }
    after = {
      ...copyState(afterAnger),
      firstTeam: result.state.firstTeam,
      currentTopic: result.state.currentTopic,
      characters: [
        overlayRoundCharacter(afterAnger.characters[0], result.characters[0]),
        overlayRoundCharacter(afterAnger.characters[1], result.characters[1]),
      ],
    };
    nextCheckpoint = 'ready-for-play';
  }
  return {
    ok: true,
    state: copyState(after), nextCheckpoint,
    receipt: {
      before, afterAnger, after, anger, transition, transitionDrawOffset,
      consumedDraws, drawCount: consumedDraws.length, nextCheckpoint,
      externalRngConsumed: 0,
    },
  };
}

/** Internal core keeps the unchanged anger evaluator and terminal gating. */
export function resolveDebateAngerTransitionInternal<R extends DebateAngerTransitionRoundSuccessInternal>(
  input: unknown, runRound: DebateAngerTransitionRoundInternal<R>,
): DebateAngerTransitionBodyInternal<R> {
  return resolveBody(parseInput(detach(input)), runRound);
}
export function debateAngerTransitionFailureInternal(error: unknown): DebateAngerTransitionFailureV1 | null {
  return error instanceof Invalid ? freeze(failure(error)) : null;
}
function resolve(input: ParsedInput): Success {
  const body = resolveBody(input, (roundInput) => {
    const result = evaluateDebateRoundTransition(roundInput);
    if (!result.ok) abort({ ok: false, reason: 'round-transition-failure', dependencyFailure: result });
    return result;
  });
  return {
    ok: true, schemaVersion: 1, profile: PROFILE, policy: POLICY, evidence: EVIDENCE,
    state: body.state, nextCheckpoint: body.nextCheckpoint,
    receipt: { schemaVersion: 1, profile: PROFILE, policy: POLICY, evidence: EVIDENCE, ...body.receipt },
  };
}

export const DEBATE_ANGER_TRANSITION_POLICY_V1: DebateAngerTransitionPolicyV1 = freeze(POLICY);
export const DEBATE_ANGER_TRANSITION_EVIDENCE_V1: DebateAngerTransitionEvidenceV1 = freeze(EVIDENCE);

/**
 * Pure all-or-nothing post-anger transaction over JSON-shaped data, not JSON
 * text. No ordinary attack, critical classification, regeneration, tutorial,
 * old-nine-card/P078 dependency, external RNG, view, or phase-loop work occurs.
 * Terminal results retain carried metadata and never execute the transition.
 * Any failure returns only its typed failure, without a partial state/receipt.
 */
export function evaluateDebateAngerTransition(input: unknown): DebateAngerTransitionResultV1 {
  try {
    return freeze(resolve(parseInput(detach(input))));
  } catch (error) {
    return freeze(failure(error));
  }
}
