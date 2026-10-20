/**
 * Independent deterministic CharacterFillCards kernel, not a debate session.
 *
 * Evidence is the pinned modern C# translation only. A caller provides one
 * complete current 18-card deck, its cursor, original playable source slots,
 * and (only when needed) the topic-repair draw. DeckGenerate, native RNG,
 * session integration and native/original/PK/Vanilla equivalence are excluded.
 * Existing debate session profiles and their topic-repair rejection stay intact.
 */
type Frozen<T> = T extends object ? { readonly [K in keyof T]: Frozen<T[K]> } : T;
type CardCode = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14;
type TopicCardCode = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
type SourceCardCode = 0 | CardCode;
type Hand = [0, ...CardCode[]];
const PROFILE = 'debate-hand-fill-reference-v1' as const;
const DECK_SIZE = 18;
const MAX_INPUT_NODES = 1024;
const MAX_INPUT_DEPTH = 12;
const MAX_INPUT_ARRAY_LENGTH = 32;
const MAX_CANONICAL_BYTES = 16 * 1024;

const POLICY = {
  id: 'debate-hand-fill-current-deck-policy-v1',
  profile: PROFILE,
  cards: {
    representation: 'pinned-modern-enum-numeric-code',
    rethink: 0,
    topicFirst: 1,
    topicLast: 9,
    rhetoricFirst: 10,
    rhetoricLast: 14,
    playableMin: 1,
    playableMax: 14,
  },
  slots: {
    input: 'playable-only-original-source-order',
    vacancy: null,
    sourceSlotOffset: 1,
    playableCounts: [3, 4, 5, 6],
    reservedSlot: 0,
    reservedCard: 0,
    reservedHandling: 'restore-before-fill',
  },
  deck: {
    id: 'provided-current-deck-18-v1',
    sourceDeckTableSize: DECK_SIZE,
    providedEntries: DECK_SIZE,
    fillOrder: 'ascending-vacant-original-source-slot',
    consume: 'advance-one-per-filled-slot',
    exhaustion: 'unsupported-deck-regeneration',
    regeneration: 'excluded',
    nativeDistribution: false,
  },
  repair: {
    condition: 'post-fill-topic-count-zero-and-new-slot-exists',
    target: 'last-new-original-source-slot',
    drawRole: 'debate-fill-topic-repair',
    drawBound: 9,
    cardMapping: '1+raw-value',
    noNewSlot: 'skip-even-with-no-topic',
  },
  sort: {
    key: 'numeric-card-code-ascending',
    scope: 'all-source-slots-including-reserved-zero',
    equalCodeAuditTie: 'preSortSlot-ascending-engine-policy',
    nativeEqualCodeIdentityOrder: false,
  },
  randomness: {
    source: 'caller-supplied-draws',
    validation: 'syntax-before-fill-semantic-at-repair',
    count: 'one-only-if-repair-applies',
    extra: 'atomic-rejection',
    externalRngConsumed: 0,
    nativePrng: false,
  },
  capacity: {
    maxInputNodes: MAX_INPUT_NODES,
    maxInputDepth: MAX_INPUT_DEPTH,
    maxInputArrayLength: MAX_INPUT_ARRAY_LENGTH,
    maxCanonicalUtf8Bytes: MAX_CANONICAL_BYTES,
  },
  boundary: {
    kind: 'independent-character-fill-kernel',
    sessionIntegration: false,
    persistence: false,
    legacyProfilesChanged: false,
  },
} as const;
type Policy = typeof POLICY;

const EVIDENCE = {
  sourceIdentity: 'modern-CSharp-translation-not-native-or-Vanilla',
  sourceCommit: 'a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef',
  debatePath: 'Project/Assets/Sango/Scripts/Game/Debate/Debate.cs',
  debateBlob: '0137498d10773cd4596d497083ccdf6a26b3a261',
  debateEnumPath: 'Project/Assets/Sango/Scripts/Game/Debate/DebateEnum.cs',
  debateEnumBlob: '5b46a8ac87613193eb9f4b99a25e489ba6f5e483',
  sourceDeckTableSizeLine: 54,
  sourceSortLines: [406, 409],
  sourceFillLines: [412, 438],
  sourceCardEnumLines: [33, 61],
  fillEvidence: 'pinned-modern-translated-reference-only',
  deckEvidence: 'caller-provided-current-deck-engine-boundary',
  topicRepairEvidence: 'source-TopicFirst-plus-RandInt9-last-new-slot-only',
  sortEvidence: 'source-Array.Sort-numeric-codes-including-reserved-zero',
  equalCodeAuditEvidence: 'engine-preSortSlot-tie-policy-not-native-identity-order',
  inputSafetyAndBudgets: 'engine-policy',
  nativeEquivalent: false,
  stockOriginalVerified: false,
  pkEquivalent: false,
  vanillaEquivalent: false,
  completeDebate: false,
  originalUnresolvedGroups: 43,
  originalHistoricalSnapshots: 45,
  nativeWholeChain: 'open',
  p078: 'excluded',
  nativeDeckRegeneration: 'excluded',
  nativeRngStream: 'excluded',
  legacySessionIntegration: 'excluded',
} as const;
type Evidence = typeof EVIDENCE;

type RawDraw = { role: 'debate-fill-topic-repair'; bound: 9; value: number };
/** Candidate semantics are checked at the repair phase, not during syntax parsing. */
type DrawCandidate = { role: string; bound: number; value: number };
type Input = {
  schemaVersion: 1;
  profile: typeof PROFILE;
  policies: Policy;
  playableSlots: (CardCode | null)[];
  cardTape: CardCode[];
  deckCursor: number;
  rawDraws: RawDraw[];
};
type ParsedInput = Omit<Input, 'rawDraws'> & { rawDraws: DrawCandidate[] };
type Before = { playableSlots: (CardCode | null)[]; deckCursor: number };
type After = { hand: Hand; deckCursor: number };
/** preSortSlot is the original source-model slot, not the zero-based input index. */
type FilledCard = { preSortSlot: number; tapeIndex: number; card: CardCode };
type Repair =
  | {
      status: 'applied';
      preSortSlot: number;
      beforeCard: CardCode;
      afterCard: TopicCardCode;
      drawIndex: 0;
      rawValue: number;
    }
  | { status: 'skipped'; reason: 'topic-present' | 'no-new-slot' };
/**
 * originalCard is the code before repair. For a tape origin, tapeIndex survives
 * replacement and still identifies the consumed original card. Equal-code order
 * is an engine audit convention, not a claim about Array.Sort object identity.
 */
type SortedProvenance = {
  sortedIndex: number;
  preSortSlot: number;
  origin: 'reserved-rethink' | 'retained' | 'tape';
  tapeIndex: number | null;
  originalCard: SourceCardCode;
  card: SourceCardCode;
  topicRepairApplied: boolean;
};
type SlotProvenance = Omit<SortedProvenance, 'sortedIndex'>;
type Receipt = {
  schemaVersion: 1;
  profile: typeof PROFILE;
  policy: Policy;
  evidence: Evidence;
  before: Before;
  after: After;
  reservedSlot: { preSortSlot: 0; card: 0 };
  filled: FilledCard[];
  /** Original source-slot order after filling but before optional repair. */
  postFillHand: Hand;
  /** Original source-slot order after optional repair but before sorting. */
  preSortHand: Hand;
  topicCardCountAfterFill: number;
  lastNewSlot: number | null;
  repair: Repair;
  consumedDraws: RawDraw[];
  drawCount: 0 | 1;
  sortedProvenance: SortedProvenance[];
};
type FailureReason =
  | 'unsupported-runtime'
  | 'input-limit'
  | 'malformed-data'
  | 'unknown-field'
  | 'unsupported-profile'
  | 'unsupported-policy'
  | 'invalid-playable-slots'
  | 'unsupported-card-code'
  | 'invalid-card-tape'
  | 'invalid-deck-cursor'
  | 'unsupported-deck-regeneration'
  | 'missing-raw-draw'
  | 'unexpected-raw-draw'
  | 'invalid-raw-draw';
type Failure = { ok: false; reason: FailureReason };
type Result = { ok: true; hand: Hand; deckCursor: number; receipt: Receipt } | Failure;

export type DebateHandFillCardCodeV1 = CardCode;
export type DebateHandFillTopicCardCodeV1 = TopicCardCode;
export type DebateHandFillSourceCardCodeV1 = SourceCardCode;
export type DebateHandFillHandV1 = Frozen<Hand>;
export type DebateHandFillRawDrawV1 = Frozen<RawDraw>;
export type DebateHandFillInputV1 = Frozen<Input>;
export type DebateHandFillBeforeV1 = Frozen<Before>;
export type DebateHandFillAfterV1 = Frozen<After>;
export type DebateHandFillFilledCardV1 = Frozen<FilledCard>;
export type DebateHandFillRepairV1 = Frozen<Repair>;
export type DebateHandFillSortedProvenanceV1 = Frozen<SortedProvenance>;
export type DebateHandFillReceiptV1 = Frozen<Receipt>;
export type DebateHandFillFailureReasonV1 = FailureReason;
export type DebateHandFillFailureV1 = Frozen<Failure>;
export type DebateHandFillResultV1 = Frozen<Result>;
export type DebateHandFillPolicyV1 = Frozen<Policy>;
export type DebateHandFillEvidenceV1 = Frozen<Evidence>;

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
/** Used only after strict detachment, or on trusted internal constants. */
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
const runtime = globalThis as {
  process?: { getBuiltinModule?: (id: string) => { types: { isProxy(value: unknown): boolean } } };
};
const proxyDetector = typeof runtime.process?.getBuiltinModule === 'function'
  ? runtime.process.getBuiltinModule('node:util').types.isProxy
  : null;

/**
 * Never reads a caller object's property values directly. Rejects proxies before
 * reflection, accessors, custom prototypes, symbol/hidden fields, sparse or
 * decorated arrays, cycles, unsafe numbers, negative zero and executable values.
 * Missing Node proxy detection fails closed before touching the input.
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
function cardCode(value: unknown): CardCode {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || Object.is(value, -0) || value < 1 || value > 14) fail('unsupported-card-code');
  return value as CardCode;
}
function drawSyntax(value: unknown): DrawCandidate {
  const record = object(value, ['role', 'bound', 'value']);
  if (typeof record.role !== 'string' || typeof record.bound !== 'number' || typeof record.value !== 'number') fail('malformed-data');
  return { role: record.role, bound: record.bound, value: record.value };
}
function parseInput(value: unknown): ParsedInput {
  const record = object(value, ['schemaVersion', 'profile', 'policies', 'playableSlots', 'cardTape', 'deckCursor', 'rawDraws']);
  if (record.schemaVersion !== 1 || record.profile !== PROFILE) fail('unsupported-profile');
  if (canonical(record.policies) !== canonical(POLICY)) fail('unsupported-policy');
  if (!Array.isArray(record.playableSlots) || record.playableSlots.length < 3 || record.playableSlots.length > 6) fail('invalid-playable-slots');
  const playableSlots = record.playableSlots.map(value => value === null ? null : cardCode(value));
  if (!Array.isArray(record.cardTape) || record.cardTape.length !== DECK_SIZE) fail('invalid-card-tape');
  // Validate the entire current deck, including entries before/after this fill.
  const cardTape = record.cardTape.map(cardCode);
  if (typeof record.deckCursor !== 'number' || record.deckCursor < 0 || record.deckCursor > DECK_SIZE) fail('invalid-deck-cursor');
  if (!Array.isArray(record.rawDraws)) fail('malformed-data');
  const rawDraws = record.rawDraws.map(drawSyntax);
  return {
    schemaVersion: 1,
    profile: PROFILE,
    policies: POLICY,
    playableSlots,
    cardTape,
    deckCursor: record.deckCursor,
    rawDraws,
  };
}
/** Only called at the repair phase, after successful current-deck filling. */
function repairDraw(draws: DrawCandidate[]): RawDraw {
  if (draws.length === 0) fail('missing-raw-draw');
  if (draws.length !== 1) fail('unexpected-raw-draw');
  const draw = draws[0]!;
  if (draw.role !== 'debate-fill-topic-repair' || draw.bound !== 9 || draw.value < 0 || draw.value > 8) fail('invalid-raw-draw');
  return { role: 'debate-fill-topic-repair', bound: 9, value: draw.value };
}
function resolve(input: ParsedInput): Result {
  let deckCursor = input.deckCursor;
  let lastNewSlot: number | null = null;
  const filled: FilledCard[] = [];
  const slots: SlotProvenance[] = [{
    preSortSlot: 0,
    origin: 'reserved-rethink',
    tapeIndex: null,
    originalCard: 0,
    card: 0,
    topicRepairApplied: false,
  }];

  // Slot zero is restored before any fill. Only null playable slots consume.
  for (let inputIndex = 0; inputIndex < input.playableSlots.length; inputIndex++) {
    const preSortSlot = inputIndex + 1;
    const retainedCard = input.playableSlots[inputIndex] as CardCode | null;
    if (retainedCard !== null) {
      slots.push({ preSortSlot, origin: 'retained', tapeIndex: null, originalCard: retainedCard, card: retainedCard, topicRepairApplied: false });
      continue;
    }
    if (deckCursor >= DECK_SIZE) fail('unsupported-deck-regeneration');
    const tapeIndex = deckCursor;
    const card = input.cardTape[tapeIndex]!;
    deckCursor++;
    slots.push({ preSortSlot, origin: 'tape', tapeIndex, originalCard: card, card, topicRepairApplied: false });
    filled.push({ preSortSlot, tapeIndex, card });
    lastNewSlot = preSortSlot;
  }

  const postFillHand = slots.map(slot => slot.card) as Hand;
  const topicCardCountAfterFill = slots.slice(1).filter(slot => slot.card >= 1 && slot.card <= 9).length;
  const consumedDraws: RawDraw[] = [];
  let repair: Repair;
  if (topicCardCountAfterFill === 0 && lastNewSlot !== null) {
    const draw = repairDraw(input.rawDraws);
    const target = slots[lastNewSlot]!;
    const beforeCard = target.card as CardCode;
    const afterCard = (1 + draw.value) as TopicCardCode;
    target.card = afterCard;
    target.topicRepairApplied = true;
    consumedDraws.push(draw);
    repair = { status: 'applied', preSortSlot: lastNewSlot, beforeCard, afterCard, drawIndex: 0, rawValue: draw.value };
  } else {
    // A full all-rhetoric hand has no new slot: source performs no repair.
    if (input.rawDraws.length !== 0) fail('unexpected-raw-draw');
    repair = { status: 'skipped', reason: topicCardCountAfterFill > 0 ? 'topic-present' : 'no-new-slot' };
  }

  const preSortHand = slots.map(slot => slot.card) as Hand;
  const sortedProvenance: SortedProvenance[] = slots
    .slice()
    .sort((left, right) => left.card - right.card || left.preSortSlot - right.preSortSlot)
    .map((slot, sortedIndex) => ({ sortedIndex, ...slot }));
  const hand = sortedProvenance.map(slot => slot.card) as Hand;
  const receipt: Receipt = {
    schemaVersion: 1,
    profile: PROFILE,
    policy: POLICY,
    evidence: EVIDENCE,
    before: { playableSlots: input.playableSlots.slice(), deckCursor: input.deckCursor },
    after: { hand: [...hand], deckCursor },
    reservedSlot: { preSortSlot: 0, card: 0 },
    filled,
    postFillHand,
    preSortHand,
    topicCardCountAfterFill,
    lastNewSlot,
    repair,
    consumedDraws,
    drawCount: repair.status === 'applied' ? 1 : 0,
    sortedProvenance,
  };
  return { ok: true, hand, deckCursor, receipt };
}

export const DEBATE_HAND_FILL_POLICY_V1: DebateHandFillPolicyV1 = freeze(POLICY);
export const DEBATE_HAND_FILL_EVIDENCE_V1: DebateHandFillEvidenceV1 = freeze(EVIDENCE);

/**
 * Pure all-or-nothing evaluation. Neither failure nor success mutates caller
 * data or consumes external RNG. All returned values are recursively frozen.
 * Source deck regeneration is a hard boundary, never wrapping or extending tape.
 */
export function evaluateDebateHandFill(input: unknown): DebateHandFillResultV1 {
  try {
    return freeze(resolve(parseInput(detach(input))));
  } catch (error) {
    return freeze(failure(error));
  }
}
