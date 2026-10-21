/**
 * Independent deterministic DeckGenerate kernel, not DeckInit or a session.
 *
 * Evidence is the pinned modern C# translation only. Caller-supplied draws
 * replace source RandInt calls in order; no PRNG is implemented or consumed.
 * Both the final deck and the mutated active rhetoric order are returned.
 * DeckGenerate does not reset Deck.index: this API does not accept a cursor.
 * Native/original/PK/Vanilla equivalence and uniform shuffling are not claimed.
 */
type Frozen<T> = T extends object ? { readonly [K in keyof T]: Frozen<T[K]> } : T;
type TopicCardCode = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
type RhetoricCardCode = 10 | 11 | 12 | 13 | 14;
type CardCode = TopicCardCode | RhetoricCardCode;
type Deck = [
  CardCode, CardCode, CardCode, CardCode, CardCode, CardCode,
  CardCode, CardCode, CardCode, CardCode, CardCode, CardCode,
  CardCode, CardCode, CardCode, CardCode, CardCode, CardCode,
];
const PROFILE = 'debate-deck-generate-reference-v1' as const;
const DECK_SIZE = 18;
const SWAP_ITERATIONS = 2000;
const MAX_INPUT_NODES = 20000;
const MAX_INPUT_DEPTH = 12;
const MAX_INPUT_ARRAY_LENGTH = 4096;
const MAX_CANONICAL_BYTES = 393216;

const POLICY = {
  "id": "debate-deck-generate-supplied-draws-policy-v1",
  "profile": "debate-deck-generate-reference-v1",
  "cards": {
    "representation": "pinned-modern-enum-numeric-code",
    "topicTable": [4, 1, 7, 5, 2, 8, 6, 3, 9],
    "rhetoricFirst": 10,
    "rhetoricLast": 14,
    "rethinkExcluded": true
  },
  "rhetoric": {
    "input": "active-unique-ordered-subset",
    "minCount": 0,
    "maxCount": 5,
    "inactiveSourceSlots": "excluded",
    "initialOrder": "preserved-until-source-swaps",
    "mutatedOrder": "returned-for-subsequent-generation"
  },
  "topicFill": {
    "small": { "count": 8, "startSlot": 0, "tableOffset": 0, "role": "debate-deck-small-topic", "bound": 3 },
    "medium": { "count": 4, "startSlot": 8, "tableOffset": 3, "role": "debate-deck-medium-topic", "bound": 3 },
    "large": { "count": 2, "startSlot": 12, "tableOffset": 6, "role": "debate-deck-large-topic", "bound": 3 }
  },
  "rhetoricShuffle": {
    "condition": "count-nonzero",
    "iterations": 2000,
    "leftIndex": "iteration-modulo-rhetoric-count",
    "rightIndex": "supplied-raw-value",
    "role": "debate-deck-rhetoric-swap",
    "bound": "rhetoric-count",
    "boundOneDraws": 2000,
    "selfSwapsConsumeDraw": true
  },
  "tailFill": {
    "startSlot": 14,
    "count": 4,
    "rhetoric": "first-minimum-of-four-and-count-after-rhetoric-swaps",
    "fallback": "topic-table-at-supplied-raw-value",
    "role": "debate-deck-tail-fallback",
    "bound": 9,
    "fallbackDrawCount": "four-minus-minimum-of-four-and-rhetoric-count"
  },
  "tableShuffle": {
    "deckSize": 18,
    "iterations": 2000,
    "leftIndex": "iteration-modulo-eighteen",
    "rightIndex": "supplied-raw-value",
    "role": "debate-deck-table-swap",
    "bound": 18,
    "selfSwapsConsumeDraw": true,
    "algorithm": "fixed-count-modulo-left-pairwise-swaps-not-Fisher-Yates",
    "uniformDistributionClaim": false
  },
  "randomness": {
    "source": "caller-supplied-draws",
    "validation": "all-syntax-first-then-phase-role-bound-value",
    "order": ["small-topic", "medium-topic", "large-topic", "rhetoric-swaps-if-nonempty", "tail-fallbacks", "table-swaps"],
    "drawCountsByRhetoricCount": [2018, 4017, 4016, 4015, 4014, 4014],
    "missingExtraOrInvalid": "atomic-rejection",
    "externalRngConsumed": 0,
    "nativePrng": false
  },
  "audit": {
    "placements": "every-topic-and-tail-slot",
    "swaps": "every-iteration-in-phase-order-including-self-swaps",
    "swapFields": "iteration-drawIndex-leftIndex-rightIndex-leftBefore-rightBefore-leftAfter-rightAfter",
    "snapshots": "before-rhetoric-pre-table-shuffle-final-deck-and-rhetoric",
    "consumedDraws": "complete-source-order"
  },
  "capacity": {
    "maxInputNodes": 20000,
    "maxInputDepth": 12,
    "maxInputArrayLength": 4096,
    "maxCanonicalUtf8Bytes": 393216,
    "maxConsumedDraws": 4017,
    "maxSwapReceipts": 4000
  },
  "boundary": {
    "kind": "independent-deck-generate-kernel",
    "deckCursor": "not-accepted-read-written-or-reset",
    "deckInit": "excluded",
    "personsBooksAndEligibility": "excluded",
    "sessionIntegration": false,
    "persistence": false,
    "legacyProfilesChanged": false
  }
} as const;
type Policy = typeof POLICY;

const EVIDENCE = {
  "sourceIdentity": "modern-CSharp-translation-not-native-or-Vanilla",
  "sourceCommit": "a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef",
  "debatePath": "Project/Assets/Sango/Scripts/Game/Debate/Debate.cs",
  "debateBlob": "0137498d10773cd4596d497083ccdf6a26b3a261",
  "debateEnumPath": "Project/Assets/Sango/Scripts/Game/Debate/DebateEnum.cs",
  "debateEnumBlob": "5b46a8ac87613193eb9f4b99a25e489ba6f5e483",
  "sourceDeckTableSizeLine": 54,
  "sourceDeckClassLines": [103, 119],
  "sourceDeckGenerateLines": [306, 340],
  "sourceTopicTableLines": [308, 313],
  "sourceTopicFillLines": [314, 322],
  "sourceRhetoricSwapLines": [323, 328],
  "sourceTailFillLines": [329, 336],
  "sourceTableSwapLines": [337, 339],
  "sourceDeckInitBoundaryLines": [537, 551],
  "sourceCardEnumLines": [33, 61],
  "sourceRhetoricMaxLine": 113,
  "generationEvidence": "pinned-modern-translated-DeckGenerate-only",
  "rhetoricOrderEvidence": "source-mutates-active-rhetoric-array-before-tail-copy",
  "cursorEvidence": "DeckGenerate-does-not-read-write-or-reset-Deck.index",
  "eligibilityEvidence": "caller-supplied-active-unique-subset-not-DeckInit-or-person-book-behaviour-evaluation",
  "randomnessEvidence": "supplied-draws-follow-source-call-order-not-native-PRNG",
  "shuffleEvidence": "source-2000-modulo-left-pairwise-swaps-not-Fisher-Yates-or-uniformity-proof",
  "inputSafetyBudgetsAndAudit": "engine-policy",
  "nativeEquivalent": false,
  "stockOriginalVerified": false,
  "pkEquivalent": false,
  "vanillaEquivalent": false,
  "completeDebate": false,
  "originalUnresolvedGroups": 43,
  "originalHistoricalSnapshots": 45,
  "nativeWholeChain": "open",
  "p078": "excluded",
  "nativeDeckRegenerationIntegration": "excluded",
  "nativeRngStream": "excluded",
  "legacySessionIntegration": "excluded"
} as const;
type Evidence = typeof EVIDENCE;

type RawDraw =
  | { role: 'debate-deck-small-topic' | 'debate-deck-medium-topic' | 'debate-deck-large-topic'; bound: 3; value: number }
  | { role: 'debate-deck-rhetoric-swap'; bound: 1 | 2 | 3 | 4 | 5; value: number }
  | { role: 'debate-deck-tail-fallback'; bound: 9; value: number }
  | { role: 'debate-deck-table-swap'; bound: 18; value: number };
/** Syntax is detached first; the next source phase checks role, bound and value. */
type DrawCandidate = { role: string; bound: number; value: number };
type Input = {
  schemaVersion: 1;
  profile: typeof PROFILE;
  policies: Policy;
  /** Active entries only, in their current order, not sorted or reinitialized. */
  rhetoricCards: RhetoricCardCode[];
  rawDraws: RawDraw[];
};
type ParsedInput = Omit<Input, 'rawDraws'> & { rawDraws: DrawCandidate[] };
type Before = { rhetoricCards: RhetoricCardCode[] };
type After = { deck: Deck; rhetoricCards: RhetoricCardCode[] };
type TopicPlacement = {
  size: 'small' | 'medium' | 'large';
  slot: number;
  tableIndex: number;
  card: TopicCardCode;
  drawIndex: number;
};
type TailPlacement =
  | { source: 'rhetoric'; slot: number; rhetoricIndex: number; card: RhetoricCardCode }
  | { source: 'topic-fallback'; slot: number; tableIndex: number; card: TopicCardCode; drawIndex: number };
/**
 * Entries include no-op self-swaps. Both before-values are captured before
 * either assignment. drawIndex indexes the complete consumedDraws array.
 */
type Swap = {
  iteration: number;
  drawIndex: number;
  leftIndex: number;
  rightIndex: number;
  leftBefore: CardCode;
  rightBefore: CardCode;
  leftAfter: CardCode;
  rightAfter: CardCode;
};
type DrawCounts = {
  smallTopic: 8;
  mediumTopic: 4;
  largeTopic: 2;
  rhetoricSwap: 0 | 2000;
  tailFallback: number;
  tableSwap: 2000;
  total: number;
};
type Receipt = {
  schemaVersion: 1;
  profile: typeof PROFILE;
  policy: Policy;
  evidence: Evidence;
  before: Before;
  after: After;
  rhetoricCardCount: number;
  topicPlacements: TopicPlacement[];
  rhetoricSwaps: Swap[];
  tailPlacements: TailPlacement[];
  /** All 18 slots after generation and tail copy, before the table swaps. */
  preShuffleDeck: Deck;
  tableSwaps: Swap[];
  consumedDraws: RawDraw[];
  drawCounts: DrawCounts;
  cursorEffect: 'not-read-or-written';
};
type FailureReason =
  | 'unsupported-runtime'
  | 'input-limit'
  | 'malformed-data'
  | 'unknown-field'
  | 'unsupported-profile'
  | 'unsupported-policy'
  | 'invalid-rhetoric-cards'
  | 'missing-raw-draw'
  | 'unexpected-raw-draw'
  | 'invalid-raw-draw';
type Failure = { ok: false; reason: FailureReason };
type Result = { ok: true; deck: Deck; rhetoricCards: RhetoricCardCode[]; receipt: Receipt } | Failure;

export type DebateDeckGenerateCardCodeV1 = CardCode;
export type DebateDeckGenerateTopicCardCodeV1 = TopicCardCode;
export type DebateDeckGenerateRhetoricCardCodeV1 = RhetoricCardCode;
export type DebateDeckGenerateDeckV1 = Frozen<Deck>;
export type DebateDeckGenerateRawDrawV1 = Frozen<RawDraw>;
export type DebateDeckGenerateInputV1 = Frozen<Input>;
export type DebateDeckGenerateBeforeV1 = Frozen<Before>;
export type DebateDeckGenerateAfterV1 = Frozen<After>;
export type DebateDeckGenerateTopicPlacementV1 = Frozen<TopicPlacement>;
export type DebateDeckGenerateTailPlacementV1 = Frozen<TailPlacement>;
export type DebateDeckGenerateSwapV1 = Frozen<Swap>;
export type DebateDeckGenerateDrawCountsV1 = Frozen<DrawCounts>;
export type DebateDeckGenerateReceiptV1 = Frozen<Receipt>;
export type DebateDeckGenerateFailureReasonV1 = FailureReason;
export type DebateDeckGenerateFailureV1 = Frozen<Failure>;
export type DebateDeckGenerateResultV1 = Frozen<Result>;
export type DebateDeckGeneratePolicyV1 = Frozen<Policy>;
export type DebateDeckGenerateEvidenceV1 = Frozen<Evidence>;

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
/** Used only on detached input or trusted internal values. */
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
 * No caller property values are directly read. Reject proxies before reflection,
 * then reject accessors, custom prototypes, hidden/symbol fields, sparse or
 * decorated arrays, cycles, unsafe numbers, negative zero and executable data.
 * If trusted runtime proxy detection is unavailable, fail closed before input.
 */
function detach(value: unknown): unknown {
  if (!proxyDetector) fail('unsupported-runtime');
  let nodes = 0, bytes = 0;
  const active = new Set<object>();
  function visit(current: unknown, depth: number): unknown {
    if (++nodes > MAX_INPUT_NODES || depth > MAX_INPUT_DEPTH) fail('input-limit');
    if (current === null || typeof current === 'boolean') return current;
    if (typeof current === 'string') {
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
function object(value: unknown, keys: readonly string[]): Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) fail('malformed-data');
  const record = value as Record<string, unknown>;
  if (Object.keys(record).some(key => !keys.includes(key))) fail('unknown-field');
  if (keys.some(key => !Object.hasOwn(record, key))) fail('malformed-data');
  return record;
}
function drawSyntax(value: unknown): DrawCandidate {
  const record = object(value, ['role', 'bound', 'value']);
  if (typeof record.role !== 'string' || typeof record.bound !== 'number' || typeof record.value !== 'number') fail('malformed-data');
  return { role: record.role, bound: record.bound, value: record.value };
}
function parseInput(value: unknown): ParsedInput {
  const record = object(value, ['schemaVersion', 'profile', 'policies', 'rhetoricCards', 'rawDraws']);
  if (record.schemaVersion !== 1 || record.profile !== PROFILE) fail('unsupported-profile');
  if (canonical(record.policies) !== canonical(POLICY)) fail('unsupported-policy');
  if (!Array.isArray(record.rhetoricCards) || record.rhetoricCards.length > 5) fail('invalid-rhetoric-cards');
  const rhetoricCards: RhetoricCardCode[] = [];
  const seen = new Set<number>();
  for (const value of record.rhetoricCards) {
    if (typeof value !== 'number' || value < 10 || value > 14 || seen.has(value)) fail('invalid-rhetoric-cards');
    seen.add(value);
    rhetoricCards.push(value as RhetoricCardCode);
  }
  if (!Array.isArray(record.rawDraws)) fail('malformed-data');
  return {
    schemaVersion: 1,
    profile: PROFILE,
    policies: POLICY,
    rhetoricCards,
    rawDraws: record.rawDraws.map(drawSyntax),
  };
}
/** Generic only over card codes; snapshots both endpoints before a self-swap. */
function swap<C extends CardCode>(cards: C[], iteration: number, drawIndex: number, rightIndex: number): Swap {
  const leftIndex = iteration % cards.length;
  const leftBefore = cards[leftIndex]!;
  const rightBefore = cards[rightIndex]!;
  cards[leftIndex] = rightBefore;
  cards[rightIndex] = leftBefore;
  return {
    iteration,
    drawIndex,
    leftIndex,
    rightIndex,
    leftBefore,
    rightBefore,
    leftAfter: cards[leftIndex]!,
    rightAfter: cards[rightIndex]!,
  };
}
function resolve(input: ParsedInput): Result {
  const rhetoricCards = input.rhetoricCards.slice();
  const rhetoricCardCount = rhetoricCards.length;
  const deck: CardCode[] = [];
  const topicPlacements: TopicPlacement[] = [];
  const rhetoricSwaps: Swap[] = [];
  const tailPlacements: TailPlacement[] = [];
  const tableSwaps: Swap[] = [];
  const consumedDraws: RawDraw[] = [];

  function takeDraw(role: RawDraw['role'], bound: number): { draw: RawDraw; drawIndex: number } {
    const drawIndex = consumedDraws.length;
    if (drawIndex >= input.rawDraws.length) fail('missing-raw-draw');
    const candidate = input.rawDraws[drawIndex]!;
    if (candidate.role !== role || candidate.bound !== bound || candidate.value < 0 || candidate.value >= bound) fail('invalid-raw-draw');
    // Every caller supplies a fixed known role/bound pairing from the policy.
    const draw = { role, bound, value: candidate.value } as RawDraw;
    consumedDraws.push(draw);
    return { draw, drawIndex };
  }

  function fillTopics(size: TopicPlacement['size'], phase: Policy['topicFill'][TopicPlacement['size']]): void {
    for (let index = 0; index < phase.count; index++) {
      const { draw, drawIndex } = takeDraw(phase.role, phase.bound);
      const slot = phase.startSlot + index;
      const tableIndex = phase.tableOffset + draw.value;
      const card = POLICY.cards.topicTable[tableIndex]!;
      deck[slot] = card;
      topicPlacements.push({ size, slot, tableIndex, card, drawIndex });
    }
  }
  fillTopics('small', POLICY.topicFill.small);
  fillTopics('medium', POLICY.topicFill.medium);
  fillTopics('large', POLICY.topicFill.large);

  // A singleton still performs all 2000 source draws; n=0 performs none.
  if (rhetoricCardCount !== 0) {
    for (let iteration = 0; iteration < SWAP_ITERATIONS; iteration++) {
      const { draw, drawIndex } = takeDraw('debate-deck-rhetoric-swap', rhetoricCardCount);
      rhetoricSwaps.push(swap(rhetoricCards, iteration, drawIndex, draw.value));
    }
  }

  for (let index = 0; index < 4; index++) {
    const slot = 14 + index;
    if (index < rhetoricCardCount) {
      const card = rhetoricCards[index]!;
      deck[slot] = card;
      tailPlacements.push({ source: 'rhetoric', slot, rhetoricIndex: index, card });
    } else {
      const { draw, drawIndex } = takeDraw('debate-deck-tail-fallback', 9);
      const tableIndex = draw.value;
      const card = POLICY.cards.topicTable[tableIndex]!;
      deck[slot] = card;
      tailPlacements.push({ source: 'topic-fallback', slot, tableIndex, card, drawIndex });
    }
  }
  // At this point the source has assigned all 18 slots exactly once.
  const preShuffleDeck = deck.slice() as Deck;
  for (let iteration = 0; iteration < SWAP_ITERATIONS; iteration++) {
    const { draw, drawIndex } = takeDraw('debate-deck-table-swap', DECK_SIZE);
    tableSwaps.push(swap(deck, iteration, drawIndex, draw.value));
  }
  if (consumedDraws.length !== input.rawDraws.length) fail('unexpected-raw-draw');

  const finalDeck = deck as Deck;
  const receipt: Receipt = {
    schemaVersion: 1,
    profile: PROFILE,
    policy: POLICY,
    evidence: EVIDENCE,
    before: { rhetoricCards: input.rhetoricCards.slice() },
    after: { deck: finalDeck.slice() as Deck, rhetoricCards: rhetoricCards.slice() },
    rhetoricCardCount,
    topicPlacements,
    rhetoricSwaps,
    tailPlacements,
    preShuffleDeck,
    tableSwaps,
    consumedDraws,
    drawCounts: {
      smallTopic: 8,
      mediumTopic: 4,
      largeTopic: 2,
      rhetoricSwap: rhetoricCardCount === 0 ? 0 : SWAP_ITERATIONS,
      tailFallback: 4 - Math.min(4, rhetoricCardCount),
      tableSwap: SWAP_ITERATIONS,
      total: consumedDraws.length,
    },
    cursorEffect: 'not-read-or-written',
  };
  return { ok: true, deck: finalDeck, rhetoricCards, receipt };
}

export const DEBATE_DECK_GENERATE_POLICY_V1: DebateDeckGeneratePolicyV1 = freeze(POLICY);
export const DEBATE_DECK_GENERATE_EVIDENCE_V1: DebateDeckGenerateEvidenceV1 = freeze(EVIDENCE);

/**
 * Pure all-or-nothing evaluation with a full bounded audit, including no-ops.
 * Neither success nor failure mutates caller data or consumes external RNG.
 * A failure exposes no deck, mutated rhetoric order, partial receipt or draws.
 * All returned values are recursively frozen. DeckInit, cursor management,
 * source person/book eligibility and every debate session remain out of scope.
 */
export function evaluateDebateDeckGenerate(input: unknown): DebateDeckGenerateResultV1 {
  try {
    return freeze(resolve(parseInput(detach(input))));
  } catch (error) {
    return freeze(failure(error));
  }
}
