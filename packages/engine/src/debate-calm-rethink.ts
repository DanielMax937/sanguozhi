/**
 * Standalone post-fill Calm rethink bonus from the pinned modern C# source.
 * The supplied hand is the already-filled, already-sorted active checkpoint.
 * The optional boolean is a caller-supplied RandBool(40) call result, not a draw.
 * No clearing, refill, RNG implementation, person lookup, or session integration.
 */
type Frozen<T> = T extends object ? { readonly [K in keyof T]: Frozen<T[K]> } : T;
type Personality = 'timid' | 'calm' | 'bold' | 'reckless';
type Card = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14;
type BonusCard = 3 | 6 | 9;
const PROFILE = 'debate-calm-rethink-reference-v1' as const;
const RESULT_ROLE = 'debate-calm-rethink-rand-bool' as const;
const BONUS_CARDS = [3, 6, 9] as const;
const MAX_INPUT_NODES = 1024;
const MAX_INPUT_DEPTH = 10;
const MAX_INPUT_ARRAY_LENGTH = 32;
const MAX_CANONICAL_BYTES = 16384;

const POLICY = {
  "id": "debate-calm-rethink-policy-v1",
  "profile": "debate-calm-rethink-reference-v1",
  "checkpoint": {
    "kind": "post-fill-already-numerically-sorted-active-hand",
    "personality": "caller-resolved-timid-calm-bold-or-reckless",
    "angerTimer": { "minimum": 0, "maximum": 4 },
    "currentTopic": { "minimum": -2147483648, "maximum": 2147483647 },
    "activeHandLength": { "minimum": 4, "maximum": 7 },
    "firstSlot": 0,
    "remainingCardRange": [1, 14],
    "minimumOrdinaryCards": 1,
    "ordinaryCardRange": [1, 9],
    "bounds": "explicit-engine-checkpoint-domain-not-universal-source-reachability"
  },
  "bonus": {
    "gate": "positive-anger-timer-and-calm-personality",
    "rawResultRole": "debate-calm-rethink-rand-bool",
    "percentArgument": 40,
    "rawResultMeaning": "explicit-boolean-call-result-not-integer-RNG-draw",
    "requiredResultCount": "one-iff-gate-true-even-when-topic-out-of-range-otherwise-zero",
    "replacementGate": "required-boolean-result-true-and-topic-zero-through-two",
    "topicCards": [3, 6, 9],
    "physicalSourceSlot": 1,
    "sameFaceOverwrite": "applied-even-when-before-equals-after",
    "integerRngMappingOrProbabilityProof": "not-provided"
  },
  "sorting": {
    "when": "always-after-optional-physical-slot-overwrite",
    "order": "numeric-card-code-ascending",
    "sourceIndices": "final-position-to-pre-final-sort-physical-slot",
    "equalCardTieBreak": "source-slot-ascending-engine-policy",
    "nativeEqualCardIdentityGuarantee": false
  },
  "safety": {
    "input": "closed-schema-detached-safe-JSON-data-with-exact-policy",
    "requiredRuntime": "trusted-node-util-types-isProxy-via-process-getBuiltinModule",
    "unavailableProxyDetector": "fail-closed-before-inspecting-input",
    "proxiesAccessorsAndExecutableValues": "rejected-without-invocation",
    "result": "recursively-frozen-and-detached-from-input",
    "failure": "typed-code-only-no-partial-audit"
  },
  "capacity": {
    "maxInputNodes": 1024,
    "maxInputDepth": 10,
    "maxInputArrayLength": 32,
    "maxCanonicalUtf8Bytes": 16384,
    "maxBooleanResults": 1,
    "maxLocalSlotOverwrites": 1,
    "finalSorts": 1,
    "externalRandomDraws": 0
  },
  "boundary": {
    "kind": "standalone-post-fill-calm-rethink-bonus",
    "personalityResolution": "caller-supplied-not-evaluated",
    "handClearingRefillAndDeckGeneration": "excluded",
    "rng": "no-implementation-no-external-consumption-no-bound-100-mapping",
    "canRethink": "not-read-not-changed",
    "turnEnd": "excluded",
    "sessionIntegration": false,
    "persistence": false,
    "legacyProfilesChanged": false
  }
} as const;
type Policy = typeof POLICY;

const EVIDENCE = {
  "sourceIdentity": "modern-CSharp-translation-not-native-or-Vanilla",
  "repository": "https://github.com/tankyc/sango_infinity",
  "sourceCommit": "a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef",
  "debatePath": "Project/Assets/Sango/Scripts/Game/Debate/Debate.cs",
  "debateBlob": "0137498d10773cd4596d497083ccdf6a26b3a261",
  "debateSha256": "622789ca8b8b6799a321526dcfb513d6622adf5b5d54025175c2a7795ef7da28",
  "debateEnumPath": "Project/Assets/Sango/Scripts/Game/Debate/DebateEnum.cs",
  "debateEnumBlob": "5b46a8ac87613193eb9f4b99a25e489ba6f5e483",
  "sourceRethinkLines": [491, 509],
  "excludedClearingAndRefillLines": [493, 495],
  "sourceBonusLines": [496, 507],
  "sourceFinalSortLine": 509,
  "sourceSortHelperLines": [407, 409],
  "sourceCardEnumLines": [33, 61],
  "sourceBehavior": "positive-timer-then-calm-then-RandBool-40-then-topic-range-then-slot-one-overwrite-then-sort",
  "personalityBoundary": "CharacterGetPersonality-result-supplied-by-caller-no-person-fallback-run",
  "randomBoundary": "caller-supplied-boolean-result-only-not-bound-100-draw-or-probability-proof",
  "sortBoundary": "source-numeric-order-equal-code-audit-identity-is-engine-policy-only",
  "boundsSafetyBudgetsAuditAndReasonNames": "engine-policy",
  "nativeEquivalent": false,
  "stockOriginalVerified": false,
  "pkEquivalent": false,
  "vanillaEquivalent": false,
  "completeDebate": false,
  "p078": "excluded",
  "nativeWholeChain": "open",
  "nativeDeckRegenerationIntegration": "excluded",
  "nativeRngStream": "excluded",
  "legacySessionIntegration": "excluded"
} as const;
type Evidence = typeof EVIDENCE;

type RawResult = {
  role: typeof RESULT_ROLE;
  /** The source call argument, not a bound for a supplied numeric RNG draw. */
  percent: 40;
  value: boolean;
};
type Input = {
  schemaVersion: 1;
  profile: typeof PROFILE;
  policies: Policy;
  personality: Personality;
  angerTimer: number;
  /** Signed 32-bit integer; values outside 0..2 are valid no-replacement topics. */
  currentTopic: number;
  /** Already-filled active physical slots in numeric order, before the bonus. */
  hand: Card[];
  /** Exactly one iff timer > 0 and calm, regardless of the current topic. */
  rawResults: RawResult[];
};
type GateReason = 'timer-zero' | 'personality-not-calm' | 'positive-timer-calm';
type Gate = {
  personality: Personality;
  angerTimer: number;
  eligible: boolean;
  reason: GateReason;
};
type ConsumedResult = RawResult & { index: 0 };
type Replacement = {
  /** The physical slot in the supplied already-sorted checkpoint. */
  sourceSlot: 1;
  before: Card;
  after: BonusCard;
  /** False does not negate the source assignment: a same-face overwrite applies. */
  changed: boolean;
};
type SortAudit = {
  /** After any optional overwrite, immediately before the unconditional sort. */
  before: Card[];
  after: Card[];
  /** At each final position, the corresponding pre-final-sort physical slot. */
  sourceIndices: number[];
  /** Engine-only tie policy, not a native Array.Sort identity guarantee. */
  equalCardTieBreak: 'source-slot-ascending-engine-policy';
};
type Audit = {
  /** Unmodified original checkpoint, before any bonus overwrite. */
  inputHand: Card[];
  gate: Gate;
  rawResultsConsumed: 0 | 1;
  booleanResult: ConsumedResult | null;
  replacement: Replacement | null;
  sort: SortAudit;
  externalRngConsumed: 0;
};
type Reason =
  | 'timer-zero'
  | 'personality-not-calm'
  | 'boolean-result-false'
  | 'topic-out-of-range'
  | 'replacement-applied';
type Success = {
  ok: true;
  schemaVersion: 1;
  profile: typeof PROFILE;
  policy: Policy;
  evidence: Evidence;
  hand: Card[];
  reason: Reason;
  audit: Audit;
};
type FailureReason =
  | 'unsupported-runtime'
  | 'input-limit'
  | 'malformed-data'
  | 'unknown-field'
  | 'unsupported-profile'
  | 'unsupported-policy'
  | 'invalid-personality'
  | 'invalid-anger-timer'
  | 'invalid-current-topic'
  | 'invalid-hand'
  | 'invalid-raw-results'
  | 'invalid-raw-result'
  | 'raw-result-count-mismatch';
type Failure = { ok: false; reason: FailureReason };
type Result = Success | Failure;

export type DebateCalmRethinkPersonalityV1 = Personality;
export type DebateCalmRethinkCardV1 = Card;
export type DebateCalmRethinkBonusCardV1 = BonusCard;
export type DebateCalmRethinkRawResultV1 = Frozen<RawResult>;
export type DebateCalmRethinkInputV1 = Frozen<Input>;
export type DebateCalmRethinkGateReasonV1 = GateReason;
export type DebateCalmRethinkGateV1 = Frozen<Gate>;
export type DebateCalmRethinkConsumedResultV1 = Frozen<ConsumedResult>;
export type DebateCalmRethinkReplacementV1 = Frozen<Replacement>;
export type DebateCalmRethinkSortAuditV1 = Frozen<SortAudit>;
export type DebateCalmRethinkAuditV1 = Frozen<Audit>;
export type DebateCalmRethinkReasonV1 = Reason;
export type DebateCalmRethinkSuccessV1 = Frozen<Success>;
export type DebateCalmRethinkFailureReasonV1 = FailureReason;
export type DebateCalmRethinkFailureV1 = Frozen<Failure>;
export type DebateCalmRethinkResultV1 = Frozen<Result>;
export type DebateCalmRethinkPolicyV1 = Frozen<Policy>;
export type DebateCalmRethinkEvidenceV1 = Frozen<Evidence>;

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
function parseHand(value: unknown): Card[] {
  if (!Array.isArray(value) || value.length < 4 || value.length > 7) fail('invalid-hand');
  const hand: Card[] = [];
  let ordinaryCards = 0;
  for (let index = 0; index < value.length; index++) {
    const card = integer(value[index], index === 0 ? 0 : 1, index === 0 ? 0 : 14, 'invalid-hand') as Card;
    if (index > 0 && card < hand[index - 1]!) fail('invalid-hand');
    if (card >= 1 && card <= 9) ordinaryCards++;
    hand.push(card);
  }
  if (ordinaryCards === 0) fail('invalid-hand');
  return hand;
}
function parseRawResult(value: unknown): RawResult {
  const record = object(value, ['role', 'percent', 'value'], 'invalid-raw-result');
  if (record.role !== RESULT_ROLE || record.percent !== 40 || typeof record.value !== 'boolean') fail('invalid-raw-result');
  return { role: RESULT_ROLE, percent: 40, value: record.value };
}
function parseInput(value: unknown): Input {
  const record = object(value, ['schemaVersion', 'profile', 'policies', 'personality', 'angerTimer', 'currentTopic', 'hand', 'rawResults']);
  if (record.schemaVersion !== 1 || record.profile !== PROFILE) fail('unsupported-profile');
  if (canonical(record.policies) !== canonical(POLICY)) fail('unsupported-policy');
  if (record.personality !== 'timid' && record.personality !== 'calm' && record.personality !== 'bold' && record.personality !== 'reckless') fail('invalid-personality');
  const angerTimer = integer(record.angerTimer, 0, 4, 'invalid-anger-timer');
  const currentTopic = integer(record.currentTopic, -2147483648, 2147483647, 'invalid-current-topic');
  const hand = parseHand(record.hand);
  if (!Array.isArray(record.rawResults) || record.rawResults.length > 1) fail('invalid-raw-results');
  const rawResults = record.rawResults.map(parseRawResult);
  const requiredResults = angerTimer > 0 && record.personality === 'calm' ? 1 : 0;
  if (rawResults.length !== requiredResults) fail('raw-result-count-mismatch');
  return { schemaVersion: 1, profile: PROFILE, policies: POLICY, personality: record.personality, angerTimer, currentTopic, hand, rawResults };
}
function gate(input: Input): Gate {
  const reason: GateReason = input.angerTimer === 0
    ? 'timer-zero'
    : input.personality === 'calm' ? 'positive-timer-calm' : 'personality-not-calm';
  return { personality: input.personality, angerTimer: input.angerTimer, eligible: reason === 'positive-timer-calm', reason };
}
function resolve(input: Input): Success {
  const bonusGate = gate(input);
  const beforeSort = input.hand.slice();
  let reason: Reason;
  let booleanResult: ConsumedResult | null = null;
  let replacement: Replacement | null = null;
  if (bonusGate.reason === 'timer-zero') {
    reason = 'timer-zero';
  } else if (bonusGate.reason === 'personality-not-calm') {
    reason = 'personality-not-calm';
  } else {
    // A valid topic is deliberately NOT a prerequisite for consuming this result.
    const supplied = input.rawResults[0]!;
    booleanResult = { index: 0, role: supplied.role, percent: supplied.percent, value: supplied.value };
    if (!supplied.value) {
      reason = 'boolean-result-false';
    } else if (input.currentTopic < 0 || input.currentTopic > 2) {
      reason = 'topic-out-of-range';
    } else {
      const before = beforeSort[1]!;
      const after = BONUS_CARDS[input.currentTopic]!;
      replacement = { sourceSlot: 1, before, after, changed: before !== after };
      beforeSort[1] = after;
      reason = 'replacement-applied';
    }
  }
  // The source always sorts. Equal-code physical identity is our audit policy.
  const sorted = beforeSort.map((card, sourceIndex) => ({ card, sourceIndex }));
  sorted.sort((left, right) => left.card - right.card || left.sourceIndex - right.sourceIndex);
  const hand = sorted.map(entry => entry.card);
  return {
    ok: true,
    schemaVersion: 1,
    profile: PROFILE,
    policy: POLICY,
    evidence: EVIDENCE,
    hand,
    reason,
    audit: {
      inputHand: input.hand.slice(),
      gate: bonusGate,
      rawResultsConsumed: booleanResult === null ? 0 : 1,
      booleanResult,
      replacement,
      sort: {
        before: beforeSort,
        after: hand.slice(),
        sourceIndices: sorted.map(entry => entry.sourceIndex),
        equalCardTieBreak: 'source-slot-ascending-engine-policy',
      },
      externalRngConsumed: 0,
    },
  };
}

export const DEBATE_CALM_RETHINK_POLICY_V1: DebateCalmRethinkPolicyV1 = freeze(POLICY);
export const DEBATE_CALM_RETHINK_EVIDENCE_V1: DebateCalmRethinkEvidenceV1 = freeze(EVIDENCE);

/**
 * Evaluate only the Calm bonus after an already-completed fill-and-sort stage.
 * Accepts a JSON-shaped value, not serialized JSON. All input is safely copied
 * and parsed before source-ordered evaluation. No input is mutated or frozen.
 * Returns a frozen detached success audit, or only a typed frozen failure code.
 * The raw boolean is a supplied call result, never mapped from a numeric draw.
 * No caller code, RNG, clearing, refill, canRethink change, or TurnEnd is invoked.
 */
export function evaluateDebateCalmRethink(input: unknown): DebateCalmRethinkResultV1 {
  try {
    return freeze(resolve(parseInput(detach(input))));
  } catch (error) {
    return freeze(failure(error));
  }
}
