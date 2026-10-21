/**
 * Independent generic CalcHpDamage arithmetic from the pinned modern C# source.
 * Personality and attack are caller-resolved facts; no person or attacker lookup.
 * genericOnly limits the post-formula hook to identity, not a verified character.
 * Exactly one supplied jitter is consumed, including for zero-level coefficients.
 * No HP/stress/state writes, card legality, RNG implementation, or session bridge.
 */
type Frozen<T> = T extends object ? { readonly [K in keyof T]: Frozen<T[K]> } : T;
type Personality = 'timid' | 'calm' | 'bold' | 'reckless';
type Topic = 0 | 1 | 2;
type CardTopic = -1 | Topic;
type CardLevel = -1 | 0 | 1 | 2;
const PROFILE = 'debate-hp-damage-reference-v1' as const;
const MAX_INPUT_NODES = 1024;
const MAX_INPUT_DEPTH = 10;
const MAX_INPUT_ARRAY_LENGTH = 32;
const MAX_CANONICAL_BYTES = 16384;

const POLICY = {
  "id": "debate-hp-damage-policy-v1",
  "profile": "debate-hp-damage-reference-v1",
  "checkpoint": {
    "genericOnly": true,
    "personality": "caller-resolved-timid-calm-bold-or-reckless",
    "angerTimer": { "minimum": 0, "maximum": 4 },
    "resolvedAttack": { "minimum": 70, "maximum": 227 },
    "currentTopic": { "minimum": 0, "maximum": 2 },
    "card": { "minimum": -1, "maximum": 14 },
    "bounds": "explicit-engine-checkpoint-domain-not-universal-source-reachability"
  },
  "cards": {
    "none": -1,
    "rethink": 0,
    "story": [1, 2, 3],
    "logic": [4, 5, 6],
    "trend": [7, 8, 9],
    "shout": 10,
    "sophistry": 11,
    "ignore": 12,
    "compose": 13,
    "agitate": 14,
    "topicCodes": [0, 1, 2],
    "ordinaryLevelCodes": [0, 1, 2],
    "otherCardTopicAndLevel": -1
  },
  "coefficients": {
    "topicDefault": 6,
    "positiveTimerTimidOrBold": 10,
    "positiveTimerCalmOrReckless": 6,
    "zeroTimerShout": 12,
    "zeroTimerMatchingOrdinaryTopic": 10,
    "positiveTimerSkipsShoutAndMatchingTopicBranches": true,
    "shoutLevel": 15,
    "ordinaryLevels": [10, 15, 20],
    "otherCardLevel": 0,
    "angerDefault": 10,
    "positiveTimerCalmAnger": 15
  },
  "arithmetic": {
    "order": ["attack-plus-jitter", "multiply-anger", "multiply-level", "multiply-topic", "divide-1000"],
    "division": "truncate-toward-zero-once-after-all-multiplications",
    "intermediate": "exact-safe-integer-within-accepted-domain",
    "divisor": 1000,
    "minimumRequestedHpDamage": 0,
    "maximumRequestedHpDamage": 462,
    "maximumNumerator": 462000,
    "sourceComment693": "not-used-as-a-bound-for-this-domain",
    "modifyHpDamage": "identity-only-not-invoked"
  },
  "draw": {
    "role": "debate-hp-damage-jitter",
    "bound": 5,
    "minimum": 0,
    "maximum": 4,
    "count": 1,
    "zeroLevelStillConsumes": true,
    "origin": "caller-provided-not-generated"
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
    "evaluations": 1,
    "providedRandomDraws": 1,
    "externalRandomDraws": 0,
    "stateWrites": 0
  },
  "boundary": {
    "kind": "single-generic-requested-hp-damage-calculation",
    "personalityResolution": "caller-supplied-not-evaluated",
    "attackDerivation": "caller-supplied-not-evaluated",
    "genericOnly": "identity-hook-contract-not-actual-person-verification",
    "personSpecificModifyHpDamage": "excluded",
    "teamPersonHpAndState": "not-required-not-read-not-written",
    "availabilityOwnershipWinnerAndCalcAttacker": "not-checked-not-applied",
    "stressDamageAndHpClamping": "excluded",
    "rng": "no-implementation-no-external-consumption",
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
  "sourceCardTopicLines": [853, 873],
  "sourceCardLevelLines": [875, 893],
  "sourceHpDamageLines": [1145, 1196],
  "sourceTopicCoefficientLines": [1148, 1165],
  "sourceLevelCoefficientLines": [1167, 1180],
  "sourceAngerCoefficientLines": [1182, 1184],
  "sourceArithmeticLines": [1186, 1190],
  "sourcePersonHookLines": [1192, 1195],
  "sourceBehavior": "topic-then-level-then-anger-then-one-jitter-and-integer-formula-before-person-hook",
  "personalityBoundary": "CharacterGetPersonality-result-supplied-by-caller-no-person-fallback-run",
  "attackBoundary": "character-attack-supplied-by-caller-no-attack-derivation-run",
  "hookBoundary": "genericOnly-requires-identity-result-no-actual-person-verification-or-hook-invocation",
  "boundsSafetyBudgetsAuditAndReasonNames": "engine-policy",
  "sourceComment693": "comment-preserved-as-evidence-not-an-accepted-domain-bound",
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

type RawDraw = { role: 'debate-hp-damage-jitter'; bound: 5; value: number };
type Input = {
  schemaVersion: 1;
  profile: typeof PROFILE;
  policies: Policy;
  /** Restricts the modeled post-formula hook; does not prove a real person's hook. */
  genericOnly: true;
  personality: Personality;
  angerTimer: number;
  resolvedAttack: number;
  currentTopic: Topic;
  card: number;
  rawDraws: [RawDraw];
};
type TopicReason =
  | 'positive-timer-timid-or-bold'
  | 'positive-timer-calm-or-reckless-default'
  | 'zero-timer-shout'
  | 'zero-timer-matching-topic'
  | 'zero-timer-default';
type LevelReason =
  | 'shout-fixed-level'
  | 'ordinary-level-zero'
  | 'ordinary-level-one'
  | 'ordinary-level-two'
  | 'non-damaging-card-zero-level';
type AngerReason = 'positive-timer-calm' | 'default';
type Arithmetic = {
  resolvedAttack: number;
  jitter: number;
  attackWithJitter: number;
  angerCoef: 10 | 15;
  afterAnger: number;
  levelCoef: 0 | 10 | 15 | 20;
  afterLevel: number;
  topicCoef: 6 | 10 | 12;
  numerator: number;
  divisor: 1000;
  truncatedDamage: number;
};
type DrawAudit = RawDraw & { index: 0 };
type Audit = {
  topicReason: TopicReason;
  levelReason: LevelReason;
  angerReason: AngerReason;
  /** True only for the zero-timer, non-Shout source branch. */
  cardTopicCompared: boolean;
  /** False for Shout's fixed level coefficient. */
  cardLevelLookupUsed: boolean;
  draws: [DrawAudit];
  consumedDraws: 1;
  externalRngConsumed: 0;
  stateWrites: 0;
  modifyHpDamage: 'identity-only-not-invoked';
};
type Success = {
  ok: true;
  schemaVersion: 1;
  profile: typeof PROFILE;
  policy: Policy;
  evidence: Evidence;
  genericOnly: true;
  personality: Personality;
  angerTimer: number;
  resolvedAttack: number;
  currentTopic: Topic;
  card: number;
  /** Diagnostic helper result, not a claim that its source branch was reached. */
  cardTopic: CardTopic;
  /** Diagnostic helper result; Shout has helper level -1 but coefficient 15. */
  cardLevel: CardLevel;
  requestedHpDamage: number;
  arithmetic: Arithmetic;
  audit: Audit;
};
type FailureReason =
  | 'unsupported-runtime'
  | 'input-limit'
  | 'malformed-data'
  | 'unknown-field'
  | 'unsupported-profile'
  | 'unsupported-policy'
  | 'invalid-generic-only'
  | 'invalid-personality'
  | 'invalid-anger-timer'
  | 'invalid-resolved-attack'
  | 'invalid-current-topic'
  | 'invalid-card'
  | 'invalid-raw-draws'
  | 'invalid-draw'
  | 'invalid-draw-role'
  | 'invalid-draw-bound'
  | 'invalid-draw-value';
type Failure = { ok: false; reason: FailureReason };
type Result = Success | Failure;

export type DebateHpDamagePersonalityV1 = Personality;
export type DebateHpDamageTopicV1 = Topic;
export type DebateHpDamageCardTopicV1 = CardTopic;
export type DebateHpDamageCardLevelV1 = CardLevel;
export type DebateHpDamageRawDrawV1 = Frozen<RawDraw>;
export type DebateHpDamageInputV1 = Frozen<Input>;
export type DebateHpDamageTopicReasonV1 = TopicReason;
export type DebateHpDamageLevelReasonV1 = LevelReason;
export type DebateHpDamageAngerReasonV1 = AngerReason;
export type DebateHpDamageArithmeticV1 = Frozen<Arithmetic>;
export type DebateHpDamageDrawAuditV1 = Frozen<DrawAudit>;
export type DebateHpDamageAuditV1 = Frozen<Audit>;
export type DebateHpDamageSuccessV1 = Frozen<Success>;
export type DebateHpDamageFailureReasonV1 = FailureReason;
export type DebateHpDamageFailureV1 = Frozen<Failure>;
export type DebateHpDamageResultV1 = Frozen<Result>;
export type DebateHpDamagePolicyV1 = Frozen<Policy>;
export type DebateHpDamageEvidenceV1 = Frozen<Evidence>;

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
function parseDraw(value: unknown): RawDraw {
  const record = object(value, ['role', 'bound', 'value'], 'invalid-draw');
  if (record.role !== 'debate-hp-damage-jitter') fail('invalid-draw-role');
  if (record.bound !== 5) fail('invalid-draw-bound');
  const drawValue = integer(record.value, 0, 4, 'invalid-draw-value');
  return { role: 'debate-hp-damage-jitter', bound: 5, value: drawValue };
}
function parseInput(value: unknown): Input {
  const record = object(value, ['schemaVersion', 'profile', 'policies', 'genericOnly', 'personality', 'angerTimer', 'resolvedAttack', 'currentTopic', 'card', 'rawDraws']);
  if (record.schemaVersion !== 1 || record.profile !== PROFILE) fail('unsupported-profile');
  if (canonical(record.policies) !== canonical(POLICY)) fail('unsupported-policy');
  if (record.genericOnly !== true) fail('invalid-generic-only');
  if (record.personality !== 'timid' && record.personality !== 'calm' && record.personality !== 'bold' && record.personality !== 'reckless') fail('invalid-personality');
  const angerTimer = integer(record.angerTimer, 0, 4, 'invalid-anger-timer');
  const resolvedAttack = integer(record.resolvedAttack, 70, 227, 'invalid-resolved-attack');
  const currentTopic = integer(record.currentTopic, 0, 2, 'invalid-current-topic') as Topic;
  const card = integer(record.card, -1, 14, 'invalid-card');
  if (!Array.isArray(record.rawDraws) || record.rawDraws.length !== 1) fail('invalid-raw-draws');
  const rawDraws: [RawDraw] = [parseDraw(record.rawDraws[0])];
  return { schemaVersion: 1, profile: PROFILE, policies: POLICY, genericOnly: true, personality: record.personality, angerTimer, resolvedAttack, currentTopic, card, rawDraws };
}
/** Helper-equivalent classification only; source branch reachability is audited separately. */
function cardTopicOf(card: number): CardTopic {
  if (card >= 1 && card <= 3) return 0;
  if (card >= 4 && card <= 6) return 1;
  if (card >= 7 && card <= 9) return 2;
  return -1;
}
function cardLevelOf(card: number): CardLevel {
  if (card < 1 || card > 9) return -1;
  return ((card - 1) % 3) as 0 | 1 | 2;
}

function resolve(input: Input): Success {
  const cardTopic = cardTopicOf(input.card);
  const cardLevel = cardLevelOf(input.card);
  const shout = input.card === 10;
  let topicCoef: 6 | 10 | 12 = 6;
  let topicReason: TopicReason;
  let cardTopicCompared = false;
  if (input.angerTimer > 0) {
    if (input.personality === 'timid' || input.personality === 'bold') {
      topicCoef = 10;
      topicReason = 'positive-timer-timid-or-bold';
    } else {
      // Source's outer else is not reached, even for matching cards or Shout.
      topicReason = 'positive-timer-calm-or-reckless-default';
    }
  } else if (shout) {
    topicCoef = 12;
    topicReason = 'zero-timer-shout';
  } else {
    cardTopicCompared = true;
    if (cardTopic === input.currentTopic) {
      topicCoef = 10;
      topicReason = 'zero-timer-matching-topic';
    } else {
      topicReason = 'zero-timer-default';
    }
  }

  let levelCoef: 0 | 10 | 15 | 20;
  let levelReason: LevelReason;
  if (shout) {
    levelCoef = 15;
    levelReason = 'shout-fixed-level';
  } else if (cardLevel === 0) {
    levelCoef = 10;
    levelReason = 'ordinary-level-zero';
  } else if (cardLevel === 1) {
    levelCoef = 15;
    levelReason = 'ordinary-level-one';
  } else if (cardLevel === 2) {
    levelCoef = 20;
    levelReason = 'ordinary-level-two';
  } else {
    levelCoef = 0;
    levelReason = 'non-damaging-card-zero-level';
  }

  const angryCalm = input.angerTimer > 0 && input.personality === 'calm';
  const angerCoef: 10 | 15 = angryCalm ? 15 : 10;
  const angerReason: AngerReason = angryCalm ? 'positive-timer-calm' : 'default';
  // Consumption is unconditional after coefficient resolution, even levelCoef=0.
  const draw = input.rawDraws[0];
  const attackWithJitter = input.resolvedAttack + draw.value;
  const afterAnger = attackWithJitter * angerCoef;
  const afterLevel = afterAnger * levelCoef;
  const numerator = afterLevel * topicCoef;
  const requestedHpDamage = Math.trunc(numerator / 1000);
  return {
    ok: true,
    schemaVersion: 1,
    profile: PROFILE,
    policy: POLICY,
    evidence: EVIDENCE,
    genericOnly: true,
    personality: input.personality,
    angerTimer: input.angerTimer,
    resolvedAttack: input.resolvedAttack,
    currentTopic: input.currentTopic,
    card: input.card,
    cardTopic,
    cardLevel,
    requestedHpDamage,
    arithmetic: {
      resolvedAttack: input.resolvedAttack,
      jitter: draw.value,
      attackWithJitter,
      angerCoef,
      afterAnger,
      levelCoef,
      afterLevel,
      topicCoef,
      numerator,
      divisor: 1000,
      truncatedDamage: requestedHpDamage,
    },
    audit: {
      topicReason,
      levelReason,
      angerReason,
      cardTopicCompared,
      cardLevelLookupUsed: !shout,
      draws: [{ index: 0, role: draw.role, bound: draw.bound, value: draw.value }],
      consumedDraws: 1,
      externalRngConsumed: 0,
      stateWrites: 0,
      modifyHpDamage: 'identity-only-not-invoked',
    },
  };
}

export const DEBATE_HP_DAMAGE_POLICY_V1: DebateHpDamagePolicyV1 = freeze(POLICY);
export const DEBATE_HP_DAMAGE_EVIDENCE_V1: DebateHpDamageEvidenceV1 = freeze(EVIDENCE);

/**
 * Evaluate one bounded, generic requested-HP-damage checkpoint, not an action.
 * Accepts a JSON-shaped value, not serialized JSON. All input is safely copied
 * and parsed before source-ordered coefficient/arithmetic evaluation. No input
 * is mutated or frozen. Draw consumption means one caller-provided value only.
 * Returns a frozen detached success audit, or only a typed frozen failure code.
 * No caller code, RNG, real-person hook, HP writer, or gameplay is invoked.
 */
export function evaluateDebateHpDamage(input: unknown): DebateHpDamageResultV1 {
  try {
    return freeze(resolve(parseInput(detach(input))));
  } catch (error) {
    return freeze(failure(error));
  }
}
