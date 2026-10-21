/**
 * Independent pure CalcAttacker result from the pinned modern C# translation.
 * Personality is caller-resolved; supplied cards are not checked for legality.
 * Positive-timer Bold assigns power 100, even when this lowers Ignore or Shout.
 * The source attacker field assignment is returned, never applied to state.
 * No availability, ownership, HP, turn, person lookup, RNG, or session bridge.
 * This is not native, PK, Vanilla, or a complete debate implementation.
 */
type Frozen<T> = T extends object ? { readonly [K in keyof T]: Frozen<T[K]> } : T;
type Pair<T> = [T, T];
type Team = 0 | 1;
type Attacker = -1 | Team;
type Personality = 'timid' | 'calm' | 'bold' | 'reckless';
type Topic = 0 | 1 | 2;
type CardTopic = -1 | Topic;
type CardLevel = -1 | 0 | 1 | 2;
const PROFILE = 'debate-attacker-selection-reference-v1' as const;
const MAX_INPUT_NODES = 1024;
const MAX_INPUT_DEPTH = 10;
const MAX_INPUT_ARRAY_LENGTH = 32;
const MAX_CANONICAL_BYTES = 16384;

const POLICY = {
  "id": "debate-attacker-selection-policy-v1",
  "profile": "debate-attacker-selection-reference-v1",
  "checkpoint": {
    "characters": 2,
    "teams": [0, 1],
    "personality": "caller-resolved-timid-calm-bold-or-reckless",
    "angerTimer": { "minimum": 0, "maximum": 4 },
    "currentTopic": { "minimum": -2147483648, "maximum": 2147483647 },
    "playedCards": { "length": 2, "minimum": -2147483648, "maximum": 2147483647 },
    "bounds": "explicit-engine-checkpoint-domain-not-universal-source-reachability"
  },
  "cards": {
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
  "basePower": {
    "ignore": 120,
    "shout": 110,
    "sophistry": 20,
    "topic": "one-plus-zero-based-level-plus-valid-matching-topic-bonus",
    "matchingTopicBonus": 10,
    "invalidCurrentTopic": "accepted-with-no-topic-bonus",
    "otherCards": 0,
    "outOfRangeCard": "accepted-with-zero-base-power"
  },
  "override": {
    "condition": "positive-timer-and-bold-only",
    "assignedPower": 100,
    "operation": "unconditional-assignment-not-maximum-or-addition",
    "appliesToEverySigned32Card": true,
    "canLowerIgnoreAndShout": true
  },
  "selection": {
    "order": ["team-0-base-power", "team-1-base-power", "team-0-bold-override", "team-1-bold-override", "strict-power-comparison"],
    "comparison": "strict-greater-than",
    "team0Greater": 0,
    "team1Greater": 1,
    "equal": -1
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
    "basePowerCalculations": 2,
    "overrideChecks": 2,
    "randomDraws": 0,
    "stateWrites": 0
  },
  "boundary": {
    "kind": "two-team-pure-attacker-selection-query",
    "personalityResolution": "caller-supplied-not-evaluated",
    "availabilityOwnershipHpAndTurnLegality": "not-checked-not-applied",
    "sourceAttackerAssignment": "returned-not-written-to-state",
    "winnerAndDamage": "not-evaluated",
    "rng": "no-implementation-no-external-consumption",
    "sessionIntegration": false,
    "persistence": false,
    "legacyProfilesChanged": false
  }
} as const;
type Policy = typeof POLICY;

const EVIDENCE = {
  "sourceIdentity": "modern-CSharp-translation-not-native-or-PK-or-Vanilla",
  "repository": "https://github.com/tankyc/sango_infinity",
  "sourceCommit": "a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef",
  "debatePath": "Project/Assets/Sango/Scripts/Game/Debate/Debate.cs",
  "debateBlob": "0137498d10773cd4596d497083ccdf6a26b3a261",
  "debateSha256": "622789ca8b8b6799a321526dcfb513d6622adf5b5d54025175c2a7795ef7da28",
  "debateEnumPath": "Project/Assets/Sango/Scripts/Game/Debate/DebateEnum.cs",
  "debateEnumBlob": "5b46a8ac87613193eb9f4b99a25e489ba6f5e483",
  "sourceResolvedPersonalityLines": [369, 375],
  "sourceCardTopicLines": [853, 873],
  "sourceCardLevelLines": [875, 893],
  "sourceCardPowerLines": [906, 929],
  "sourceAttackerSelectionLines": [1128, 1142],
  "sourceCardEnumLines": [33, 61],
  "sourcePersonalityEnumLines": [116, 124],
  "sourceBehavior": "both-base-powers-then-unconditional-positive-timer-bold-overrides-then-strict-comparison",
  "personalityBoundary": "CharacterGetPersonality-result-supplied-by-caller-no-person-fallback-run",
  "stateBoundary": "source-attacker-field-assignment-returned-as-data-not-applied",
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

type Character = { personality: Personality; angerTimer: number };
type Input = {
  schemaVersion: 1;
  profile: typeof PROFILE;
  policies: Policy;
  /** Signed 32-bit integer; only 0..2 can grant the matching-topic bonus. */
  currentTopic: number;
  characters: Pair<Character>;
  /** Signed 32-bit integers; all codes outside 1..12 have zero base power. */
  playedCards: Pair<number>;
};
type CardClass = 'out-of-range' | 'rethink' | 'topic' | 'shout' | 'sophistry' | 'ignore' | 'compose' | 'agitate';
type BaseReason =
  | 'ignore-fixed'
  | 'shout-fixed'
  | 'sophistry-fixed'
  | 'topic-match'
  | 'topic-unmatched'
  | 'topic-invalid-current'
  | 'other-card-zero';
type BaseCalculation = {
  cardClass: CardClass;
  reason: BaseReason;
  /** Diagnostic helper values; -1 for every non-topic card. */
  cardTopic: CardTopic;
  cardLevel: CardLevel;
  /** Base power is fixedPower + levelPower + topicBonus. */
  fixedPower: 0 | 20 | 110 | 120;
  levelPower: 0 | 1 | 2 | 3;
  topicBonus: 0 | 10;
  /** True only for an ordinary card and a valid matching currentTopic. */
  topicMatched: boolean;
};
type OverrideReason = 'timer-zero' | 'personality-not-bold' | 'positive-timer-bold';
type OverrideAudit = {
  applied: boolean;
  reason: OverrideReason;
  assignedPower: 100 | null;
};
type TeamAudit = {
  team: Team;
  card: number;
  personality: Personality;
  angerTimer: number;
  baseCalculation: BaseCalculation;
  basePower: number;
  override: OverrideAudit;
  finalPower: number;
};
type ComparisonRelation = 'team-0-greater' | 'team-1-greater' | 'equal';
type Comparison = {
  rule: 'strict-greater-than';
  team0Power: number;
  team1Power: number;
  relation: ComparisonRelation;
  attacker: Attacker;
};
type Audit = {
  currentTopicValid: boolean;
  teams: Pair<TeamAudit>;
  comparison: Comparison;
  externalRngConsumed: 0;
  stateWrites: 0;
};
type Success = {
  ok: true;
  schemaVersion: 1;
  profile: typeof PROFILE;
  policy: Policy;
  evidence: Evidence;
  currentTopic: number;
  playedCards: Pair<number>;
  basePowers: Pair<number>;
  finalPowers: Pair<number>;
  attacker: Attacker;
  audit: Audit;
};
type FailureReason =
  | 'unsupported-runtime'
  | 'input-limit'
  | 'malformed-data'
  | 'unknown-field'
  | 'unsupported-profile'
  | 'unsupported-policy'
  | 'invalid-current-topic'
  | 'invalid-characters'
  | 'invalid-character'
  | 'invalid-personality'
  | 'invalid-anger-timer'
  | 'invalid-played-cards'
  | 'invalid-card';
type Failure = { ok: false; reason: FailureReason };
type Result = Success | Failure;

export type DebateAttackerSelectionTeamV1 = Team;
export type DebateAttackerSelectionAttackerV1 = Attacker;
export type DebateAttackerSelectionPersonalityV1 = Personality;
export type DebateAttackerSelectionTopicV1 = Topic;
export type DebateAttackerSelectionCardTopicV1 = CardTopic;
export type DebateAttackerSelectionCardLevelV1 = CardLevel;
export type DebateAttackerSelectionCharacterV1 = Frozen<Character>;
export type DebateAttackerSelectionInputV1 = Frozen<Input>;
export type DebateAttackerSelectionCardClassV1 = CardClass;
export type DebateAttackerSelectionBaseReasonV1 = BaseReason;
export type DebateAttackerSelectionBaseCalculationV1 = Frozen<BaseCalculation>;
export type DebateAttackerSelectionOverrideReasonV1 = OverrideReason;
export type DebateAttackerSelectionOverrideAuditV1 = Frozen<OverrideAudit>;
export type DebateAttackerSelectionTeamAuditV1 = Frozen<TeamAudit>;
export type DebateAttackerSelectionComparisonRelationV1 = ComparisonRelation;
export type DebateAttackerSelectionComparisonV1 = Frozen<Comparison>;
export type DebateAttackerSelectionAuditV1 = Frozen<Audit>;
export type DebateAttackerSelectionSuccessV1 = Frozen<Success>;
export type DebateAttackerSelectionFailureReasonV1 = FailureReason;
export type DebateAttackerSelectionFailureV1 = Frozen<Failure>;
export type DebateAttackerSelectionResultV1 = Frozen<Result>;
export type DebateAttackerSelectionPolicyV1 = Frozen<Policy>;
export type DebateAttackerSelectionEvidenceV1 = Frozen<Evidence>;

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
function parseCharacter(value: unknown): Character {
  const record = object(value, ['personality', 'angerTimer'], 'invalid-character');
  if (record.personality !== 'timid' && record.personality !== 'calm' && record.personality !== 'bold' && record.personality !== 'reckless') fail('invalid-personality');
  const angerTimer = integer(record.angerTimer, 0, 4, 'invalid-anger-timer');
  return { personality: record.personality, angerTimer };
}
function parseInput(value: unknown): Input {
  const record = object(value, ['schemaVersion', 'profile', 'policies', 'currentTopic', 'characters', 'playedCards']);
  if (record.schemaVersion !== 1 || record.profile !== PROFILE) fail('unsupported-profile');
  if (canonical(record.policies) !== canonical(POLICY)) fail('unsupported-policy');
  const currentTopic = integer(record.currentTopic, -2147483648, 2147483647, 'invalid-current-topic');
  if (!Array.isArray(record.characters) || record.characters.length !== 2) fail('invalid-characters');
  const characters: Pair<Character> = [parseCharacter(record.characters[0]), parseCharacter(record.characters[1])];
  if (!Array.isArray(record.playedCards) || record.playedCards.length !== 2) fail('invalid-played-cards');
  const playedCards: Pair<number> = [
    integer(record.playedCards[0], -2147483648, 2147483647, 'invalid-card'),
    integer(record.playedCards[1], -2147483648, 2147483647, 'invalid-card'),
  ];
  return { schemaVersion: 1, profile: PROFILE, policies: POLICY, currentTopic, characters, playedCards };
}
function classify(card: number): CardClass {
  if (card < 0 || card > 14) return 'out-of-range';
  if (card === 0) return 'rethink';
  if (card <= 9) return 'topic';
  if (card === 10) return 'shout';
  if (card === 11) return 'sophistry';
  if (card === 12) return 'ignore';
  return card === 13 ? 'compose' : 'agitate';
}
function calculateBase(currentTopic: number, currentTopicValid: boolean, card: number): BaseCalculation {
  const cardClass = classify(card);
  const base: BaseCalculation = {
    cardClass,
    reason: 'other-card-zero',
    cardTopic: -1,
    cardLevel: -1,
    fixedPower: 0,
    levelPower: 0,
    topicBonus: 0,
    topicMatched: false,
  };
  // Preserve GetCardPower's Ignore, Shout, Sophistry branch precedence.
  if (card === 12) return { ...base, reason: 'ignore-fixed', fixedPower: 120 };
  if (card === 10) return { ...base, reason: 'shout-fixed', fixedPower: 110 };
  if (card === 11) return { ...base, reason: 'sophistry-fixed', fixedPower: 20 };
  if (cardClass !== 'topic') return base;
  const cardTopic = Math.floor((card - 1) / 3) as Topic;
  const cardLevel = ((card - 1) % 3) as 0 | 1 | 2;
  const topicMatched = currentTopicValid && cardTopic === currentTopic;
  return {
    cardClass,
    reason: !currentTopicValid ? 'topic-invalid-current' : topicMatched ? 'topic-match' : 'topic-unmatched',
    cardTopic,
    cardLevel,
    fixedPower: 0,
    levelPower: (1 + cardLevel) as 1 | 2 | 3,
    topicBonus: topicMatched ? 10 : 0,
    topicMatched,
  };
}
function auditTeam(team: Team, character: Character, card: number, baseCalculation: BaseCalculation): TeamAudit {
  const basePower = baseCalculation.fixedPower + baseCalculation.levelPower + baseCalculation.topicBonus;
  let reason: OverrideReason;
  if (character.angerTimer === 0) reason = 'timer-zero';
  else if (character.personality !== 'bold') reason = 'personality-not-bold';
  else reason = 'positive-timer-bold';
  const applied = reason === 'positive-timer-bold';
  return {
    team,
    card,
    personality: character.personality,
    angerTimer: character.angerTimer,
    baseCalculation,
    basePower,
    override: { applied, reason, assignedPower: applied ? 100 : null },
    // The source assignment can lower 120/110 and can raise an invalid card's 0.
    finalPower: applied ? 100 : basePower,
  };
}
function resolve(input: Input): Success {
  const currentTopicValid = input.currentTopic >= 0 && input.currentTopic <= 2;
  const bases: Pair<BaseCalculation> = [
    calculateBase(input.currentTopic, currentTopicValid, input.playedCards[0]),
    calculateBase(input.currentTopic, currentTopicValid, input.playedCards[1]),
  ];
  // Both base calculations precede either override, matching CalcAttacker.
  const teams: Pair<TeamAudit> = [
    auditTeam(0, input.characters[0], input.playedCards[0], bases[0]),
    auditTeam(1, input.characters[1], input.playedCards[1], bases[1]),
  ];
  const basePowers: Pair<number> = [teams[0].basePower, teams[1].basePower];
  const finalPowers: Pair<number> = [teams[0].finalPower, teams[1].finalPower];
  let attacker: Attacker = -1;
  let relation: ComparisonRelation = 'equal';
  if (finalPowers[0] > finalPowers[1]) {
    attacker = 0;
    relation = 'team-0-greater';
  } else if (finalPowers[1] > finalPowers[0]) {
    attacker = 1;
    relation = 'team-1-greater';
  }
  return {
    ok: true,
    schemaVersion: 1,
    profile: PROFILE,
    policy: POLICY,
    evidence: EVIDENCE,
    currentTopic: input.currentTopic,
    playedCards: [input.playedCards[0], input.playedCards[1]],
    basePowers,
    finalPowers,
    attacker,
    audit: {
      currentTopicValid,
      teams,
      comparison: { rule: 'strict-greater-than', team0Power: finalPowers[0], team1Power: finalPowers[1], relation, attacker },
      externalRngConsumed: 0,
      stateWrites: 0,
    },
  };
}

export const DEBATE_ATTACKER_SELECTION_POLICY_V1: DebateAttackerSelectionPolicyV1 = freeze(POLICY);
export const DEBATE_ATTACKER_SELECTION_EVIDENCE_V1: DebateAttackerSelectionEvidenceV1 = freeze(EVIDENCE);

/**
 * Calculate an attacker from two supplied checkpoints without applying a turn.
 * Accepts JSON-shaped data, not serialized JSON. All input is safely copied and
 * parsed before source-ordered evaluation; no input is mutated or frozen.
 * Returns a frozen detached success audit, or only a typed frozen failure code.
 * Signed 32-bit non-topic values and unknown card codes remain valid queries.
 * No caller code, RNG, person resolution, or gameplay operation is invoked.
 */
export function evaluateDebateAttackerSelection(input: unknown): DebateAttackerSelectionResultV1 {
  try {
    return freeze(resolve(parseInput(detach(input))));
  } catch (error) {
    return freeze(failure(error));
  }
}
