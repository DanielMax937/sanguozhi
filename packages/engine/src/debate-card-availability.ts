/**
 * Independent, bounded query of the pinned modern C# IsCardAvailable predicate.
 * Caller-resolved personality and canRethink are checkpoint facts, not derived.
 * Availability alone does not establish ownership, turn legality, or playability.
 * No state changes, random draws, person lookup, session integration, or gameplay.
 */
type Frozen<T> = T extends object ? { readonly [K in keyof T]: Frozen<T[K]> } : T;
type Pair<T> = [T, T];
type Team = 0 | 1;
type Personality = 'timid' | 'calm' | 'bold' | 'reckless';
const PROFILE = 'debate-card-availability-reference-v1' as const;
const MAX_INPUT_NODES = 1024;
const MAX_INPUT_DEPTH = 10;
const MAX_INPUT_ARRAY_LENGTH = 32;
const MAX_CANONICAL_BYTES = 16384;

const POLICY = {
  "id": "debate-card-availability-policy-v1",
  "profile": "debate-card-availability-reference-v1",
  "checkpoint": {
    "characters": 2,
    "teams": [0, 1],
    "personality": "caller-resolved-timid-calm-bold-or-reckless",
    "angerTimer": { "minimum": 0, "maximum": 4 },
    "canRethink": "caller-supplied-boolean-per-character",
    "card": { "minimum": -2147483648, "maximum": 2147483647 },
    "bounds": "explicit-engine-checkpoint-domain-not-universal-source-reachability"
  },
  "availability": {
    "angered": "positive-timer-and-calm-or-bold-only",
    "cardRange": [0, 14],
    "outOfRange": "successful-unavailable-query",
    "rethink": "reject-self-angry-bold-then-return-self-canRethink",
    "shoutSophistryIgnore": "reject-self-angry-bold-then-reject-opponent-angry-calm",
    "composeAgitate": "reject-self-angered-then-reject-opponent-angry-calm",
    "topic": "always-available-for-codes-one-through-nine",
    "rethinkOpponentSuppression": false,
    "shortCircuit": true
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
    "queries": 1,
    "maxChecks": 3,
    "randomDraws": 0,
    "stateWrites": 0
  },
  "boundary": {
    "kind": "single-team-single-card-availability-query",
    "personalityResolution": "caller-supplied-not-evaluated",
    "canRethinkDerivation": "caller-supplied-not-evaluated",
    "handOwnershipHpTurnCurrentTopicAndGameplay": "not-checked-not-applied",
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
  "debateEnumPath": "Project/Assets/Sango/Scripts/Game/Debate/DebateEnum.cs",
  "debateEnumBlob": "5b46a8ac87613193eb9f4b99a25e489ba6f5e483",
  "sourceResolvedPersonalityLines": [369, 375],
  "sourceAvailabilityLines": [934, 987],
  "sourceCardEnumLines": [33, 61],
  "sourcePersonalityEnumLines": [116, 124],
  "sourceBehavior": "two-restricted-anger-flags-then-range-then-ordered-card-branches",
  "personalityBoundary": "CharacterGetPersonality-result-supplied-by-caller-no-person-fallback-run",
  "canRethinkBoundary": "source-team-array-entry-supplied-with-matching-character",
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

type Character = {
  personality: Personality;
  angerTimer: number;
  /** Caller-supplied source canRethink[team], not inferred from cards or a phase. */
  canRethink: boolean;
};
type Input = {
  schemaVersion: 1;
  profile: typeof PROFILE;
  policies: Policy;
  team: Team;
  characters: Pair<Character>;
  /** Signed 32-bit integer; values outside 0..14 are valid unavailable queries. */
  card: number;
};
type AngerReason =
  | 'timer-zero'
  | 'personality-not-calm-or-bold'
  | 'positive-timer-calm'
  | 'positive-timer-bold';
type Eligibility = Character & { team: Team; angered: boolean; angerReason: AngerReason };
type CardClass = 'out-of-range' | 'rethink' | 'topic' | 'shout-sophistry-ignore' | 'compose-agitate';
type CheckRule =
  | 'card-in-range'
  | 'self-not-angry-bold'
  | 'self-not-angered'
  | 'opponent-not-angry-calm'
  | 'can-rethink'
  | 'topic-default';
type Check = { rule: CheckRule; passed: boolean };
type Audit = {
  self: Eligibility;
  opponent: Eligibility;
  cardClass: CardClass;
  /** Only actually reached checks, in source order; never more than three. */
  checks: Check[];
  decisiveCheck: CheckRule;
  externalRngConsumed: 0;
};
type AvailabilityReason =
  | 'card-out-of-range'
  | 'self-angry-bold'
  | 'rethink-disabled'
  | 'self-angered'
  | 'opponent-angry-calm'
  | 'rethink-enabled'
  | 'rhetoric-available'
  | 'topic-card-available';
type Success = {
  ok: true;
  schemaVersion: 1;
  profile: typeof PROFILE;
  policy: Policy;
  evidence: Evidence;
  team: Team;
  opponentTeam: Team;
  card: number;
  available: boolean;
  reason: AvailabilityReason;
  audit: Audit;
};
type FailureReason =
  | 'unsupported-runtime'
  | 'input-limit'
  | 'malformed-data'
  | 'unknown-field'
  | 'unsupported-profile'
  | 'unsupported-policy'
  | 'invalid-team'
  | 'invalid-characters'
  | 'invalid-character'
  | 'invalid-personality'
  | 'invalid-anger-timer'
  | 'invalid-can-rethink'
  | 'invalid-card';
type Failure = { ok: false; reason: FailureReason };
type Result = Success | Failure;

export type DebateCardAvailabilityTeamV1 = Team;
export type DebateCardAvailabilityPersonalityV1 = Personality;
export type DebateCardAvailabilityCharacterV1 = Frozen<Character>;
export type DebateCardAvailabilityInputV1 = Frozen<Input>;
export type DebateCardAvailabilityAngerReasonV1 = AngerReason;
export type DebateCardAvailabilityEligibilityV1 = Frozen<Eligibility>;
export type DebateCardAvailabilityCardClassV1 = CardClass;
export type DebateCardAvailabilityCheckRuleV1 = CheckRule;
export type DebateCardAvailabilityCheckV1 = Frozen<Check>;
export type DebateCardAvailabilityAuditV1 = Frozen<Audit>;
export type DebateCardAvailabilityAvailabilityReasonV1 = AvailabilityReason;
export type DebateCardAvailabilitySuccessV1 = Frozen<Success>;
export type DebateCardAvailabilityFailureReasonV1 = FailureReason;
export type DebateCardAvailabilityFailureV1 = Frozen<Failure>;
export type DebateCardAvailabilityResultV1 = Frozen<Result>;
export type DebateCardAvailabilityPolicyV1 = Frozen<Policy>;
export type DebateCardAvailabilityEvidenceV1 = Frozen<Evidence>;

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
  const record = object(value, ['personality', 'angerTimer', 'canRethink'], 'invalid-character');
  if (record.personality !== 'timid' && record.personality !== 'calm' && record.personality !== 'bold' && record.personality !== 'reckless') fail('invalid-personality');
  const angerTimer = integer(record.angerTimer, 0, 4, 'invalid-anger-timer');
  if (typeof record.canRethink !== 'boolean') fail('invalid-can-rethink');
  return { personality: record.personality, angerTimer, canRethink: record.canRethink };
}
function parseInput(value: unknown): Input {
  const record = object(value, ['schemaVersion', 'profile', 'policies', 'team', 'characters', 'card']);
  if (record.schemaVersion !== 1 || record.profile !== PROFILE) fail('unsupported-profile');
  if (canonical(record.policies) !== canonical(POLICY)) fail('unsupported-policy');
  const team = integer(record.team, 0, 1, 'invalid-team') as Team;
  if (!Array.isArray(record.characters) || record.characters.length !== 2) fail('invalid-characters');
  const characters: Pair<Character> = [parseCharacter(record.characters[0]), parseCharacter(record.characters[1])];
  const card = integer(record.card, -2147483648, 2147483647, 'invalid-card');
  return { schemaVersion: 1, profile: PROFILE, policies: POLICY, team, characters, card };
}
function eligibility(character: Character, team: Team): Eligibility {
  let angerReason: AngerReason;
  if (character.angerTimer === 0) angerReason = 'timer-zero';
  else if (character.personality === 'calm') angerReason = 'positive-timer-calm';
  else if (character.personality === 'bold') angerReason = 'positive-timer-bold';
  else angerReason = 'personality-not-calm-or-bold';
  const angered = character.angerTimer > 0 && (character.personality === 'calm' || character.personality === 'bold');
  return { team, personality: character.personality, angerTimer: character.angerTimer, canRethink: character.canRethink, angered, angerReason };
}
function classify(card: number): CardClass {
  if (card < 0 || card > 14) return 'out-of-range';
  if (card === 0) return 'rethink';
  if (card <= 9) return 'topic';
  if (card <= 12) return 'shout-sophistry-ignore';
  return 'compose-agitate';
}

function resolve(input: Input): Success {
  const opponentTeam: Team = input.team === 0 ? 1 : 0;
  const self = eligibility(input.characters[input.team], input.team);
  const opponent = eligibility(input.characters[opponentTeam], opponentTeam);
  const cardClass = classify(input.card);
  const checks: Check[] = [];
  function check(rule: CheckRule, passed: boolean): boolean {
    checks.push({ rule, passed });
    return passed;
  }
  function finish(available: boolean, reason: AvailabilityReason): Success {
    return {
      ok: true,
      schemaVersion: 1,
      profile: PROFILE,
      policy: POLICY,
      evidence: EVIDENCE,
      team: input.team,
      opponentTeam,
      card: input.card,
      available,
      reason,
      audit: { self, opponent, cardClass, checks, decisiveCheck: checks[checks.length - 1]!.rule, externalRngConsumed: 0 },
    };
  }
  // Source derives both restricted-anger flags before testing the card range.
  if (!check('card-in-range', cardClass !== 'out-of-range')) return finish(false, 'card-out-of-range');
  if (cardClass === 'rethink') {
    if (!check('self-not-angry-bold', !(self.angered && self.personality === 'bold'))) return finish(false, 'self-angry-bold');
    // Opposing angry calm does not suppress rethink in this source branch.
    if (!check('can-rethink', self.canRethink)) return finish(false, 'rethink-disabled');
    return finish(true, 'rethink-enabled');
  }
  if (cardClass === 'shout-sophistry-ignore') {
    if (!check('self-not-angry-bold', !(self.angered && self.personality === 'bold'))) return finish(false, 'self-angry-bold');
    if (!check('opponent-not-angry-calm', !(opponent.angered && opponent.personality === 'calm'))) return finish(false, 'opponent-angry-calm');
    return finish(true, 'rhetoric-available');
  }
  if (cardClass === 'compose-agitate') {
    if (!check('self-not-angered', !self.angered)) return finish(false, 'self-angered');
    if (!check('opponent-not-angry-calm', !(opponent.angered && opponent.personality === 'calm'))) return finish(false, 'opponent-angry-calm');
    return finish(true, 'rhetoric-available');
  }
  check('topic-default', true);
  return finish(true, 'topic-card-available');
}

export const DEBATE_CARD_AVAILABILITY_POLICY_V1: DebateCardAvailabilityPolicyV1 = freeze(POLICY);
export const DEBATE_CARD_AVAILABILITY_EVIDENCE_V1: DebateCardAvailabilityEvidenceV1 = freeze(EVIDENCE);

/**
 * Query one supplied team/card checkpoint, not a hand or an executable action.
 * Accepts a JSON-shaped value, not serialized JSON. All input is safely copied
 * and parsed before source-ordered evaluation. No input is mutated or frozen.
 * Returns a frozen detached success audit, or only a typed frozen failure code.
 * A signed 32-bit card outside 0..14 is valid and returns available:false.
 * No caller code, RNG, person resolution, or gameplay operation is invoked.
 */
export function evaluateDebateCardAvailability(input: unknown): DebateCardAvailabilityResultV1 {
  try {
    return freeze(resolve(parseInput(detach(input))));
  } catch (error) {
    return freeze(failure(error));
  }
}
