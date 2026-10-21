/**
 * Independent deterministic CalcAngering(canReflect) followed by one Anger().
 * Evidence is the pinned modern C# translation, not native/original/PK/Vanilla.
 * Timid only marks combo pending; ComboAttack and another anger pass never run.
 * No winner, phase, round, session, deck, person lookup, view, or RNG execution.
 */
type Frozen<T> = T extends object ? { readonly [K in keyof T]: Frozen<T[K]> } : T;
type Pair<T> = [T, T];
type Team = 0 | 1;
type MaybeTeam = -1 | Team;
type Personality = 'timid' | 'calm' | 'bold' | 'reckless';
type CardCode = -1 | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14;
type CounterCard = -1 | 13 | 14;
type Hand = [CardCode, CardCode, CardCode, CardCode, CardCode, CardCode, CardCode];
const PROFILE = 'debate-anger-entry-reference-v1' as const;
const MAX_INPUT_NODES = 2048;
const MAX_INPUT_DEPTH = 12;
const MAX_INPUT_ARRAY_LENGTH = 64;
const MAX_CANONICAL_BYTES = 32768;

const POLICY = {
  "id": "debate-anger-entry-single-pass-policy-v1",
  "profile": "debate-anger-entry-reference-v1",
  "checkpoint": {
    "characters": 2,
    "firstTeam": [0, 1],
    "personality": "caller-resolved-timid-calm-bold-or-reckless",
    "strength": { "minimum": 1, "maximum": 100, "source": "caller-resolved-CharacterGetStrength" },
    "hp": { "minimum": -100, "maximum": 1000 },
    "stress": { "minimum": 0, "maximum": 100 },
    "angerTimer": { "minimum": 0, "maximum": 4 },
    "admittedBounds": "explicit-engine-checkpoint-domain-not-universal-source-stat-limits",
    "hpTerminalGuard": false
  },
  "hand": {
    "physicalLength": 7,
    "minimumActiveCapacity": 4,
    "maximumActiveCapacity": 7,
    "cardMinimum": -1,
    "cardMaximum": 14,
    "empty": -1,
    "reservedRethinkCode": 0,
    "slotZero": "ordinary-physical-slot-not-normalized-or-replaced",
    "holesAndDuplicates": "preserved-until-a-source-removal",
    "inactivePhysicalSlots": "accepted-and-preserved-unless-removal-clears-all-seven",
    "lookup": "first-match-in-active-prefix-from-zero",
    "removal": "remove-selected-slot-clear-all-seven-compact-active-nonempty-survivors-stably",
    "inactiveOnRemoval": "discarded-not-compacted"
  },
  "selection": {
    "order": "firstTeam-then-opponent",
    "condition": "angerTimer-zero-and-stress-one-hundred",
    "passes": 1,
    "resetAngeringBeforeSelection": true,
    "noCandidate": "no-trigger-no-entry-and-no-state-change"
  },
  "counter": {
    "defendingTeam": "opponent-of-selected-team",
    "gate": "defending-team-angerTimer-zero",
    "priority": ["agitate-if-canReflect", "compose"],
    "agitateCode": 14,
    "composeCode": 13,
    "condition": "first-matching-active-physical-index-strictly-greater-than-zero",
    "slotZeroDuplicate": "first-match-zero-shadows-later-duplicates-of-that-card",
    "canReflectFalse": "skip-agitate-search-but-still-search-compose",
    "composeAfterAgitate": "not-searched-when-agitate-eligible",
    "removalTiming": "after-trigger-stress-before-entered-team-redirect-and-Anger"
  },
  "trigger": {
    "none": { "selectedRequestedStress": -100 },
    "compose": { "selectedRequestedStress": -50, "entry": "suppressed" },
    "agitate": {
      "firstWrite": "defending-team-minus-one-hundred",
      "secondWrite": "selected-team-minus-fifty",
      "entry": "redirect-to-defending-team-without-rechecking-threshold"
    },
    "writer": "clamp-each-stress-write-to-zero-through-one-hundred"
  },
  "entry": {
    "personality": "entered-team-resolved-personality-after-any-redirect",
    "timers": { "timid": 1, "calm": 4, "bold": 4, "reckless": 1 },
    "timerDecrement": false,
    "timid": "set-combo-active-set-attacker-entered-team-reset-counter-zero-only",
    "calm": "timer-only",
    "bold": "timer-only",
    "reckless": {
      "target": "opponent-of-entered-team",
      "requestedHpDamage": "200-plus-entered-team-strength",
      "requestedStressDamage": "truncate-requestedHpDamage-divided-by-fifteen",
      "arithmetic": "exact-safe-integer-with-toward-zero-division",
      "writeOrder": ["hp", "stress"],
      "hpClamp": [-100, 1000],
      "stressClamp": [0, 100],
      "stressBasis": "requested-hp-damage-not-actual-clamped-hp-loss",
      "ordinaryAttackOrDamageHooks": false,
      "stopsAtZeroHp": false
    }
  },
  "combo": {
    "input": "explicit-checkpoint",
    "active": "boolean",
    "attacker": [-1, 0, 1],
    "minimumCounter": 0,
    "maximumCounter": 7,
    "counterBound": "engine-admission-policy-not-a-source-clamp",
    "crossFieldConstraints": "none-bounded-existing-checkpoint-is-preserved",
    "preservation": "all-fields-unchanged-unless-entered-personality-is-timid",
    "pendingMeaning": "after-combo-active-flag-not-executed"
  },
  "audit": {
    "snapshots": "detached-before-and-after-characters-and-combo",
    "selection": "priority-order-and-eligibility-by-team",
    "counters": "only-actually-evaluated-lookups-in-short-circuit-order",
    "removal": "physical-slot-full-hands-survivor-mapping-and-nonempty-inactive-discard",
    "stress": "each-write-in-source-order-with-requested-and-actual-signed-deltas",
    "reckless": "requested-damage-hp-writer-and-stress-writer",
    "timer": "entered-team-transition-or-null",
    "combo": "before-after-timid-activation-and-pending-flag"
  },
  "safety": {
    "input": "closed-schema-detached-safe-JSON-data",
    "requiredRuntime": "trusted-node-util-types-isProxy-via-process-getBuiltinModule",
    "unavailableProxyDetector": "fail-closed-before-inspecting-input",
    "proxiesAccessorsAndExecutableValues": "rejected-without-invocation",
    "result": "recursively-frozen-and-detached-from-input",
    "failure": "atomic-no-partial-state-or-receipt"
  },
  "capacity": {
    "maxInputNodes": 2048,
    "maxInputDepth": 12,
    "maxInputArrayLength": 64,
    "maxCanonicalUtf8Bytes": 32768,
    "maxCounterSearches": 2,
    "maxStressTransitions": 3,
    "maxRemovedCards": 1
  },
  "boundary": {
    "kind": "single-anger-entry-kernel",
    "comboAttack": "excluded",
    "secondCalcAngering": "excluded",
    "winnerAndCrumble": "excluded",
    "phaseExecution": "excluded",
    "timerDecay": "excluded",
    "handRefillAndDeckRegeneration": "excluded",
    "personAndPersonalityResolution": "caller-supplied-not-evaluated",
    "rng": "none",
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
  "sourceBoundsLines": [42, 57],
  "sourceCharacterLines": [122, 150],
  "sourceComboFieldsLines": [212, 217],
  "sourceActiveCapacityLines": [343, 355],
  "sourceResolvedStrengthLines": [363, 367],
  "sourceResolvedPersonalityLines": [369, 375],
  "sourceSetAngerTimerLines": [377, 391],
  "sourceRemoveCardLines": [453, 466],
  "sourceFindCardLines": [468, 477],
  "sourceHpStressWritersLines": [512, 534],
  "sourceOpponentLines": [845, 851],
  "sourceAngerTriggerLines": [1300, 1325],
  "sourceAngerLines": [1328, 1354],
  "sourceExcludedComboAttackLines": [1356, 1377],
  "sourceCalcAngeringLines": [1483, 1517],
  "sourceCardEnumLines": [33, 61],
  "sourcePersonalityEnumLines": [116, 124],
  "angerEntryEvidence": "pinned-modern-translated-CalcAngering-then-one-Anger-only",
  "counterEvidence": "first-active-match-index-greater-than-zero-not-card-anywhere-after-zero",
  "physicalHandEvidence": "seven-backing-slots-with-active-maxCardCount-prefix",
  "comboEvidence": "carry-checkpoint-through-except-timid-sets-active-attacker-and-zero-counter",
  "recklessEvidence": "200-plus-entered-strength-and-requested-damage-divided-by-fifteen-no-attack-hook",
  "strengthTimerAndComboAdmissionBounds": "explicit-engine-policy-not-complete-source-state-reachability",
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

type Character = {
  personality: Personality;
  /** Resolved effective source strength, admitted here only in [1, 100]. */
  strength: number;
  hp: number;
  stress: number;
  angerTimer: number;
  maxCardCount: 4 | 5 | 6 | 7;
  /** All seven physical backing slots, not only the active prefix. */
  hand: Hand;
};
type Combo = { active: boolean; attacker: MaybeTeam; counter: number };
type Input = {
  schemaVersion: 1;
  profile: typeof PROFILE;
  policies: Policy;
  firstTeam: Team;
  canReflect: boolean;
  characters: Pair<Character>;
  combo: Combo;
};
type Snapshot = { characters: Pair<Character>; combo: Combo };
type CounterSearch = { card: 13 | 14; firstIndex: number; eligible: boolean };
type CounterAudit = {
  team: MaybeTeam;
  card: CounterCard;
  status: 'no-candidate' | 'opponent-already-angry' | 'no-eligible-counter' | 'agitate' | 'compose';
  /** Omitted searches were short-circuited, not evaluated as failures. */
  searches: CounterSearch[];
};
type Removal = {
  team: Team;
  card: 13 | 14;
  physicalSlot: number;
  maxCardCount: 4 | 5 | 6 | 7;
  beforeHand: Hand;
  afterHand: Hand;
  survivors: { card: CardCode; fromSlot: number; toSlot: number }[];
  /** Nonempty entries outside maxCardCount that source clearing discards. */
  discardedInactive: { card: CardCode; physicalSlot: number }[];
};
type StressTransition = {
  sequence: number;
  stage: 'anger-trigger' | 'reckless-entry';
  cause: 'agitate-opponent-reset' | 'agitate-selected-half-reset' | 'compose-selected-half-reset' | 'uncountered-selected-reset' | 'reckless-hit';
  team: Team;
  beforeStress: number;
  requestedStressDelta: number;
  afterStress: number;
  actualStressDelta: number;
};
type HpTransition = { beforeHp: number; requestedHpDelta: number; afterHp: number; actualHpDelta: number };
type Reckless = {
  attackerTeam: Team;
  targetTeam: Team;
  strength: number;
  requestedHpDamage: number;
  requestedStressDamage: number;
  hp: HpTransition;
  stress: StressTransition;
};
type TimerTransition = { team: Team; personality: Personality; beforeTimer: number; afterTimer: 1 | 4 };
type ComboTransition = { before: Combo; after: Combo; activatedByTimid: boolean; pending: boolean };
type Receipt = {
  schemaVersion: 1;
  profile: typeof PROFILE;
  policy: Policy;
  evidence: Evidence;
  firstTeam: Team;
  canReflect: boolean;
  before: Snapshot;
  after: Snapshot;
  selection: { order: Pair<Team>; eligibleByTeam: Pair<boolean> };
  selectedTeam: MaybeTeam;
  enteredTeam: MaybeTeam;
  calcAngeringResult: boolean;
  counter: CounterAudit;
  removal: Removal | null;
  stressTransitions: StressTransition[];
  reckless: Reckless | null;
  timerTransition: TimerTransition | null;
  comboTransition: ComboTransition;
  externalRngConsumed: 0;
};
type FailureReason =
  | 'unsupported-runtime'
  | 'input-limit'
  | 'malformed-data'
  | 'unknown-field'
  | 'unsupported-profile'
  | 'unsupported-policy'
  | 'invalid-first-team'
  | 'invalid-can-reflect'
  | 'invalid-characters'
  | 'invalid-character'
  | 'invalid-personality'
  | 'invalid-strength'
  | 'invalid-hp'
  | 'invalid-stress'
  | 'invalid-anger-timer'
  | 'invalid-hand-capacity'
  | 'invalid-hand'
  | 'invalid-combo';
type Failure = { ok: false; reason: FailureReason };
type Result = { ok: true; characters: Pair<Character>; combo: Combo; receipt: Receipt } | Failure;

export type DebateAngerEntryTeamV1 = Team;
export type DebateAngerEntryMaybeTeamV1 = MaybeTeam;
export type DebateAngerEntryPersonalityV1 = Personality;
export type DebateAngerEntryCardCodeV1 = CardCode;
export type DebateAngerEntryHandV1 = Frozen<Hand>;
export type DebateAngerEntryCharacterV1 = Frozen<Character>;
export type DebateAngerEntryComboV1 = Frozen<Combo>;
export type DebateAngerEntryInputV1 = Frozen<Input>;
export type DebateAngerEntrySnapshotV1 = Frozen<Snapshot>;
export type DebateAngerEntryCounterSearchV1 = Frozen<CounterSearch>;
export type DebateAngerEntryCounterAuditV1 = Frozen<CounterAudit>;
export type DebateAngerEntryRemovalV1 = Frozen<Removal>;
export type DebateAngerEntryStressTransitionV1 = Frozen<StressTransition>;
export type DebateAngerEntryHpTransitionV1 = Frozen<HpTransition>;
export type DebateAngerEntryRecklessV1 = Frozen<Reckless>;
export type DebateAngerEntryTimerTransitionV1 = Frozen<TimerTransition>;
export type DebateAngerEntryComboTransitionV1 = Frozen<ComboTransition>;
export type DebateAngerEntryReceiptV1 = Frozen<Receipt>;
export type DebateAngerEntryFailureReasonV1 = FailureReason;
export type DebateAngerEntryFailureV1 = Frozen<Failure>;
export type DebateAngerEntryResultV1 = Frozen<Result>;
export type DebateAngerEntryPolicyV1 = Frozen<Policy>;
export type DebateAngerEntryEvidenceV1 = Frozen<Evidence>;

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
 * Reject proxies before reflection. Read only data descriptors, never caller
 * getters; reject symbols, hidden/decorated fields, custom prototypes, holes,
 * cycles, unsafe integers, negative zero, and every non-JSON value. Repeated
 * acyclic object references are independently detached and budgeted each time.
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
/** detachment already rejected nonintegral and unsafe numeric representations. */
function integer(value: unknown, minimum: number, maximum: number, reason: FailureReason): number {
  if (typeof value !== 'number' || value < minimum || value > maximum) fail(reason);
  return value;
}
function parseCharacter(value: unknown): Character {
  const record = object(value, ['personality', 'strength', 'hp', 'stress', 'angerTimer', 'maxCardCount', 'hand'], 'invalid-character');
  if (record.personality !== 'timid' && record.personality !== 'calm' && record.personality !== 'bold' && record.personality !== 'reckless') fail('invalid-personality');
  const strength = integer(record.strength, 1, 100, 'invalid-strength');
  const hp = integer(record.hp, -100, 1000, 'invalid-hp');
  const stress = integer(record.stress, 0, 100, 'invalid-stress');
  const angerTimer = integer(record.angerTimer, 0, 4, 'invalid-anger-timer');
  const maxCardCount = integer(record.maxCardCount, 4, 7, 'invalid-hand-capacity') as Character['maxCardCount'];
  if (!Array.isArray(record.hand) || record.hand.length !== 7) fail('invalid-hand');
  const hand = record.hand.map(card => integer(card, -1, 14, 'invalid-hand') as CardCode) as Hand;
  return { personality: record.personality, strength, hp, stress, angerTimer, maxCardCount, hand };
}
function parseCombo(value: unknown): Combo {
  const record = object(value, ['active', 'attacker', 'counter'], 'invalid-combo');
  if (typeof record.active !== 'boolean') fail('invalid-combo');
  const attacker = integer(record.attacker, -1, 1, 'invalid-combo') as MaybeTeam;
  const counter = integer(record.counter, 0, 7, 'invalid-combo');
  return { active: record.active, attacker, counter };
}
function parseInput(value: unknown): Input {
  const record = object(value, ['schemaVersion', 'profile', 'policies', 'firstTeam', 'canReflect', 'characters', 'combo']);
  if (record.schemaVersion !== 1 || record.profile !== PROFILE) fail('unsupported-profile');
  if (canonical(record.policies) !== canonical(POLICY)) fail('unsupported-policy');
  const firstTeam = integer(record.firstTeam, 0, 1, 'invalid-first-team') as Team;
  if (typeof record.canReflect !== 'boolean') fail('invalid-can-reflect');
  if (!Array.isArray(record.characters) || record.characters.length !== 2) fail('invalid-characters');
  const characters: Pair<Character> = [parseCharacter(record.characters[0]), parseCharacter(record.characters[1])];
  return { schemaVersion: 1, profile: PROFILE, policies: POLICY, firstTeam, canReflect: record.canReflect, characters, combo: parseCombo(record.combo) };
}
function opponent(team: Team): Team { return team === 0 ? 1 : 0; }
function copyCharacter(character: Character): Character { return { ...character, hand: character.hand.slice() as Hand }; }
function copyCharacters(characters: Pair<Character>): Pair<Character> { return [copyCharacter(characters[0]), copyCharacter(characters[1])]; }
function copyCombo(combo: Combo): Combo { return { active: combo.active, attacker: combo.attacker, counter: combo.counter }; }
function copySnapshot(characters: Pair<Character>, combo: Combo): Snapshot { return { characters: copyCharacters(characters), combo: copyCombo(combo) }; }
function firstIndex(character: Character, card: 13 | 14): number {
  for (let slot = 0; slot < character.maxCardCount; slot++) {
    if (character.hand[slot] === card) return slot;
  }
  return -1;
}
function removeCounter(character: Character, team: Team, card: 13 | 14): Removal {
  // AngerTrigger repeats the active-prefix lookup after its stress writes.
  const physicalSlot = firstIndex(character, card);
  const beforeHand = character.hand.slice() as Hand;
  const afterHand: Hand = [-1, -1, -1, -1, -1, -1, -1];
  const survivors: Removal['survivors'] = [];
  const discardedInactive: Removal['discardedInactive'] = [];
  for (let fromSlot = 0; fromSlot < character.maxCardCount; fromSlot++) {
    const survivor = beforeHand[fromSlot]!;
    if (fromSlot !== physicalSlot && survivor !== -1) {
      const toSlot = survivors.length;
      afterHand[toSlot] = survivor;
      survivors.push({ card: survivor, fromSlot, toSlot });
    }
  }
  for (let slot = character.maxCardCount; slot < 7; slot++) {
    if (beforeHand[slot] !== -1) discardedInactive.push({ card: beforeHand[slot]!, physicalSlot: slot });
  }
  character.hand = afterHand;
  return { team, card, physicalSlot, maxCardCount: character.maxCardCount, beforeHand, afterHand: afterHand.slice() as Hand, survivors, discardedInactive };
}
function resolve(input: Input): Result {
  const before = copySnapshot(input.characters, input.combo);
  const characters = copyCharacters(input.characters);
  const combo = copyCombo(input.combo);
  const order: Pair<Team> = [input.firstTeam, opponent(input.firstTeam)];
  const eligibleByTeam: Pair<boolean> = [
    characters[0].angerTimer === 0 && characters[0].stress === 100,
    characters[1].angerTimer === 0 && characters[1].stress === 100,
  ];
  const selectedTeam: MaybeTeam = eligibleByTeam[order[0]] ? order[0] : eligibleByTeam[order[1]] ? order[1] : -1;
  let enteredTeam: MaybeTeam = selectedTeam;
  const counter: CounterAudit = { team: -1, card: -1, status: 'no-candidate', searches: [] };
  let removal: Removal | null = null;
  const stressTransitions: StressTransition[] = [];
  let reckless: Reckless | null = null;
  let timerTransition: TimerTransition | null = null;
  let activatedByTimid = false;

  function changeStress(team: Team, requestedStressDelta: number, stage: StressTransition['stage'], cause: StressTransition['cause']): StressTransition {
    const character = characters[team];
    const beforeStress = character.stress;
    character.stress = Math.max(0, Math.min(100, beforeStress + requestedStressDelta));
    const transition: StressTransition = {
      sequence: stressTransitions.length,
      stage,
      cause,
      team,
      beforeStress,
      requestedStressDelta,
      afterStress: character.stress,
      actualStressDelta: character.stress - beforeStress,
    };
    stressTransitions.push(transition);
    return transition;
  }

  if (selectedTeam !== -1) {
    const defendingTeam = opponent(selectedTeam);
    const defender = characters[defendingTeam];
    counter.team = defendingTeam;
    counter.status = defender.angerTimer > 0 ? 'opponent-already-angry' : 'no-eligible-counter';
    if (defender.angerTimer === 0) {
      if (input.canReflect) {
        const index = firstIndex(defender, 14);
        counter.searches.push({ card: 14, firstIndex: index, eligible: index > 0 });
        if (index > 0) { counter.card = 14; counter.status = 'agitate'; }
      }
      if (counter.card === -1) {
        const index = firstIndex(defender, 13);
        counter.searches.push({ card: 13, firstIndex: index, eligible: index > 0 });
        if (index > 0) { counter.card = 13; counter.status = 'compose'; }
      }
    }

    if (counter.card === 14) {
      changeStress(defendingTeam, -100, 'anger-trigger', 'agitate-opponent-reset');
      changeStress(selectedTeam, -50, 'anger-trigger', 'agitate-selected-half-reset');
    } else if (counter.card === 13) {
      changeStress(selectedTeam, -50, 'anger-trigger', 'compose-selected-half-reset');
    } else {
      changeStress(selectedTeam, -100, 'anger-trigger', 'uncountered-selected-reset');
    }
    if (counter.card !== -1) removal = removeCounter(defender, defendingTeam, counter.card);
    if (counter.card === 14) enteredTeam = defendingTeam;
    else if (counter.card === 13) enteredTeam = -1;
  }

  // Anger() follows exactly once if CalcAngering returned true. A redirected
  // team enters even with stress below 100; no second eligibility check occurs.
  if (enteredTeam !== -1) {
    const character = characters[enteredTeam];
    const beforeTimer = character.angerTimer;
    const afterTimer = POLICY.entry.timers[character.personality];
    character.angerTimer = afterTimer;
    timerTransition = { team: enteredTeam, personality: character.personality, beforeTimer, afterTimer };
    if (character.personality === 'timid') {
      combo.active = true;
      combo.attacker = enteredTeam;
      combo.counter = 0;
      activatedByTimid = true;
    } else if (character.personality === 'reckless') {
      const targetTeam = opponent(enteredTeam);
      const target = characters[targetTeam];
      const requestedHpDamage = 200 + character.strength;
      const requestedStressDamage = Math.trunc(requestedHpDamage / 15);
      const beforeHp = target.hp;
      target.hp = Math.max(-100, Math.min(1000, beforeHp - requestedHpDamage));
      const hp: HpTransition = { beforeHp, requestedHpDelta: -requestedHpDamage, afterHp: target.hp, actualHpDelta: target.hp - beforeHp };
      const stress = changeStress(targetTeam, requestedStressDamage, 'reckless-entry', 'reckless-hit');
      reckless = { attackerTeam: enteredTeam, targetTeam, strength: character.strength, requestedHpDamage, requestedStressDamage, hp, stress };
    }
  }

  const receipt: Receipt = {
    schemaVersion: 1,
    profile: PROFILE,
    policy: POLICY,
    evidence: EVIDENCE,
    firstTeam: input.firstTeam,
    canReflect: input.canReflect,
    before,
    after: copySnapshot(characters, combo),
    selection: { order, eligibleByTeam },
    selectedTeam,
    enteredTeam,
    calcAngeringResult: enteredTeam !== -1,
    counter,
    removal,
    stressTransitions,
    reckless,
    timerTransition,
    comboTransition: { before: copyCombo(input.combo), after: copyCombo(combo), activatedByTimid, pending: combo.active },
    externalRngConsumed: 0,
  };
  return { ok: true, characters, combo, receipt };
}

export const DEBATE_ANGER_ENTRY_POLICY_V1: DebateAngerEntryPolicyV1 = freeze(POLICY);
export const DEBATE_ANGER_ENTRY_EVIDENCE_V1: DebateAngerEntryEvidenceV1 = freeze(EVIDENCE);

/**
 * Pure all-or-nothing one-entry evaluation; the argument is a JSON-shaped value,
 * not serialized JSON text. All input is detached and parsed before resolution.
 * No success or failure mutates caller data or consumes RNG. Returns recursively
 * frozen detached state and a complete bounded receipt, or only a failure code.
 * Policy constants are the inspection surface; no session or command API exists.
 */
export function evaluateDebateAngerEntry(input: unknown): DebateAngerEntryResultV1 {
  try {
    return freeze(resolve(parseInput(detach(input))));
  } catch (error) {
    return freeze(failure(error));
  }
}
