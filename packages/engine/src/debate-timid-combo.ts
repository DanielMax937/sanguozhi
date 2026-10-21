/**
 * Independent, bounded completion of one freshly pending Timid ComboAttack.
 * Evidence is the pinned modern C# translation, not native/original/PK/Vanilla.
 * Damage is admitted only with an explicit generic identity-hook assertion.
 * No anger-entry evaluator, person lookup, winner, phase, deck, view, or RNG runs.
 */
type Frozen<T> = T extends object ? { readonly [K in keyof T]: Frozen<T[K]> } : T;
type Pair<T> = [T, T];
type Team = 0 | 1;
type Personality = 'timid' | 'calm' | 'bold' | 'reckless';
type CardCode = -1 | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14;
type TopicCard = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
type Hand = [CardCode, CardCode, CardCode, CardCode, CardCode, CardCode, CardCode];
type Origins = [number | null, number | null, number | null, number | null, number | null, number | null, number | null];
const PROFILE = 'debate-timid-combo-reference-v1' as const;
const MAX_INPUT_NODES = 2048;
const MAX_INPUT_DEPTH = 12;
const MAX_INPUT_ARRAY_LENGTH = 64;
const MAX_CANONICAL_BYTES = 32768;

const POLICY = {
  "id": "debate-timid-combo-fresh-pending-policy-v1",
  "profile": "debate-timid-combo-reference-v1",
  "checkpoint": {
    "characters": 2,
    "personality": "caller-resolved-timid-calm-bold-or-reckless",
    "strength": { "minimum": 1, "maximum": 100, "source": "caller-resolved-CharacterGetStrength-preserved-not-used" },
    "hp": { "minimum": -100, "maximum": 1000 },
    "stress": { "minimum": 0, "maximum": 100 },
    "angerTimer": { "minimum": 0, "maximum": 4 },
    "admittedBounds": "explicit-engine-checkpoint-domain-not-universal-source-stat-limits",
    "attackerPersonality": "timid",
    "attackerAngerTimer": 1,
    "hpTerminalGuard": false
  },
  "combo": {
    "input": "fresh-pending-checkpoint-only",
    "active": true,
    "attacker": [0, 1],
    "counter": 0,
    "afterEachHit": "increment-counter-after-current-slot-removal",
    "afterScan": "set-active-false-even-with-zero-hits",
    "attackerPreserved": true,
    "timerPreserved": true,
    "angerEntryEvaluated": false
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
    "removal": "remove-current-slot-clear-all-seven-compact-active-nonempty-survivors-stably",
    "inactiveOnRemoval": "discarded-not-compacted"
  },
  "scan": {
    "startPhysicalSlot": 0,
    "stopBefore": "attacker-maxCardCount",
    "cardRead": "current-mutated-physical-slot-not-an-original-hand-snapshot",
    "topicCardMinimum": 1,
    "topicCardMaximum": 9,
    "nonTopicCard": "skip-without-draw-damage-removal-or-counter-increment",
    "nextPhysicalSlot": "increment-by-one-even-after-removal-compaction",
    "shiftedCardAtRemovedSlot": "not-revisited",
    "zeroHpBreak": false
  },
  "damage": {
    "resolvedAttack": { "minimum": 70, "maximum": 227, "source": "caller-supplied-not-derived-or-verified" },
    "jitter": { "role": "debate-timid-combo-jitter", "bound": 5, "minimum": 0, "maximum": 4 },
    "topicCoef": 10,
    "angerCoef": 10,
    "cardLevels": { "levelZero": [1, 4, 7], "levelOne": [2, 5, 8], "levelTwo": [3, 6, 9] },
    "levelCoefficients": [10, 15, 20],
    "multiplyOrder": ["resolvedAttack-plus-jitter", "angerCoef", "levelCoef", "topicCoef"],
    "divisor": 1000,
    "arithmetic": "exact-safe-integer-with-toward-zero-division",
    "genericOnly": true,
    "damageHook": "caller-asserted-generic-identity-no-person-pair-or-card-override-evaluated",
    "requestedStressDamage": "truncate-requestedHpDamage-divided-by-fifteen",
    "stressBasis": "requested-hp-damage-not-actual-clamped-hp-loss",
    "writeOrder": ["hp", "stress", "remove-current-slot", "increment-combo-counter"],
    "hpClamp": [-100, 1000],
    "stressClamp": [0, 100],
    "stopsAtZeroHp": false
  },
  "draws": {
    "input": "caller-supplied-labeled-raw-draws-only",
    "parse": "validate-entire-transcript-before-attacker-cross-field-check-and-resolution",
    "consumption": "exactly-one-draw-per-actual-topic-hit-in-scan-order",
    "missing": "atomic-failure",
    "extra": "atomic-failure-after-resolution-on-detached-state",
    "malformedEvenIfUnused": "atomic-failure-before-resolution",
    "rngImplementation": "none",
    "nativeStreamClaim": false
  },
  "audit": {
    "snapshots": "detached-before-and-after-characters-and-combo",
    "scan": "every-active-physical-slot-including-skips-with-current-card-and-original-slot",
    "hits": "draw-index-coefficients-requested-damage-ordered-writes-removal-counter-before-after",
    "removal": "full-hands-survivor-mapping-original-slot-provenance-and-inactive-discard",
    "draws": "complete-consumed-transcript-and-supplied-count",
    "writerSequence": "zero-based-hp-then-stress-across-all-hits",
    "combo": "before-after-completed-and-hit-count"
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
    "maxScannedSlots": 7,
    "maxHits": 4,
    "maxConsumedDraws": 4,
    "maxHpTransitions": 4,
    "maxStressTransitions": 4,
    "maxRemovedCards": 4,
    "hitBound": "ceil-active-capacity-divided-by-two-from-forward-scan-with-stable-compaction"
  },
  "boundary": {
    "kind": "single-fresh-pending-timid-combo-kernel",
    "angerEntry": "excluded",
    "secondCalcAngering": "excluded",
    "winnerAndCrumble": "excluded",
    "phaseExecution": "excluded",
    "timerDecay": "excluded",
    "handRefillAndDeckRegeneration": "excluded",
    "personAndPersonalityResolution": "caller-supplied-not-evaluated",
    "attackDerivation": "caller-supplied-not-evaluated",
    "characterSpecificDamageHook": "excluded-generic-identity-only",
    "rng": "no-implementation-no-external-consumption",
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
  "sourceResolvedPersonalityLines": [369, 375],
  "sourceSetAngerTimerLines": [377, 391],
  "sourceRemoveCardLines": [453, 466],
  "sourceHpStressWritersLines": [512, 534],
  "sourceOpponentLines": [845, 851],
  "sourceCardLevelLines": [875, 893],
  "sourceHpDamageLines": [1145, 1196],
  "sourceDamageHookLines": [1192, 1196],
  "sourceExcludedAngerEntryLines": [1328, 1354],
  "sourceComboAttackLines": [1356, 1377],
  "sourceCardEnumLines": [33, 61],
  "sourcePersonalityEnumLines": [116, 124],
  "comboEvidence": "pinned-modern-translated-ComboAttack-with-increasing-current-physical-slot",
  "compactionEvidence": "each-hit-removes-current-slot-clears-seven-and-compacts-active-nonempty-survivors",
  "damageEvidence": "angry-timid-topicCoef-ten-angerCoef-ten-topic-level-coefficient-and-one-bound-five-draw",
  "hookEvidence": "CalcHpDamage-invokes-ModifyHpDamage-after-formula-generic-identity-is-explicit-caller-assertion",
  "stressEvidence": "requested-post-identity-hook-hp-damage-divided-by-fifteen-not-clamped-hp-loss",
  "terminalEvidence": "no-hp-stop-in-loop-combo-cleared-after-entire-scan",
  "freshPendingAndAttackAdmission": "explicit-engine-policy-not-universal-source-state-reachability",
  "hitBound": "derived-from-bounded-forward-scan-and-source-stable-compaction-not-a-source-counter-clamp",
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
  /** Preserved PR115-shaped effective strength; never used to derive attack. */
  strength: number;
  hp: number;
  stress: number;
  angerTimer: number;
  maxCardCount: 4 | 5 | 6 | 7;
  /** All seven physical backing slots, not only the active prefix. */
  hand: Hand;
};
type Combo = { active: boolean; attacker: Team; counter: number };
type PendingCombo = { active: true; attacker: Team; counter: 0 };
type RawDraw = { role: 'debate-timid-combo-jitter'; bound: 5; value: number };
type Input = {
  schemaVersion: 1;
  profile: typeof PROFILE;
  policies: Policy;
  genericOnly: true;
  characters: Pair<Character>;
  combo: PendingCombo;
  resolvedAttack: number;
  rawDraws: RawDraw[];
};
type Snapshot = { characters: Pair<Character>; combo: Combo };
type Scan = {
  sequence: number;
  physicalSlot: number;
  card: CardCode;
  /** Input physical slot of this card, or null for an empty current slot. */
  originalSlot: number | null;
  outcome: 'topic-hit' | 'skip-non-topic';
  hitIndex: number | null;
};
type Removal = {
  team: Team;
  card: TopicCard;
  physicalSlot: number;
  originalSlot: number;
  maxCardCount: 4 | 5 | 6 | 7;
  beforeHand: Hand;
  afterHand: Hand;
  survivors: { card: CardCode; fromSlot: number; toSlot: number; originalSlot: number }[];
  /** Nonempty inactive backing entries cleared by this source removal. */
  discardedInactive: { card: CardCode; physicalSlot: number; originalSlot: number }[];
};
type HpTransition = {
  sequence: number;
  team: Team;
  beforeHp: number;
  requestedHpDelta: number;
  afterHp: number;
  actualHpDelta: number;
};
type StressTransition = {
  sequence: number;
  team: Team;
  beforeStress: number;
  requestedStressDelta: number;
  afterStress: number;
  actualStressDelta: number;
};
type Hit = {
  sequence: number;
  attackerTeam: Team;
  targetTeam: Team;
  physicalSlot: number;
  originalSlot: number;
  card: TopicCard;
  cardLevel: 0 | 1 | 2;
  drawIndex: number;
  draw: RawDraw;
  arithmetic: {
    resolvedAttack: number;
    jitter: number;
    baseAttack: number;
    angerCoef: 10;
    levelCoef: 10 | 15 | 20;
    topicCoef: 10;
    numerator: number;
    divisor: 1000;
    preHookHpDamage: number;
    hook: 'generic-identity';
  };
  requestedHpDamage: number;
  requestedStressDamage: number;
  hp: HpTransition;
  stress: StressTransition;
  removal: Removal;
  counterBefore: number;
  counterAfter: number;
};
type ComboTransition = { before: Combo; after: Combo; completed: true; hitCount: number };
type Receipt = {
  schemaVersion: 1;
  profile: typeof PROFILE;
  policy: Policy;
  evidence: Evidence;
  genericOnly: true;
  resolvedAttack: number;
  attackerTeam: Team;
  targetTeam: Team;
  before: Snapshot;
  after: Snapshot;
  scans: Scan[];
  hits: Hit[];
  comboTransition: ComboTransition;
  consumedDraws: RawDraw[];
  suppliedRawDrawCount: number;
  externalRngConsumed: 0;
};
type FailureReason =
  | 'unsupported-runtime'
  | 'input-limit'
  | 'malformed-data'
  | 'unknown-field'
  | 'unsupported-profile'
  | 'unsupported-policy'
  | 'invalid-generic-only'
  | 'invalid-characters'
  | 'invalid-character'
  | 'invalid-personality'
  | 'invalid-strength'
  | 'invalid-hp'
  | 'invalid-stress'
  | 'invalid-anger-timer'
  | 'invalid-hand-capacity'
  | 'invalid-hand'
  | 'invalid-combo'
  | 'invalid-resolved-attack'
  | 'invalid-raw-draws'
  | 'invalid-raw-draw'
  | 'invalid-attacker-checkpoint'
  | 'missing-raw-draw'
  | 'extra-raw-draws';
type Failure = { ok: false; reason: FailureReason };
type Result = { ok: true; characters: Pair<Character>; combo: Combo; receipt: Receipt } | Failure;

export type DebateTimidComboTeamV1 = Team;
export type DebateTimidComboPersonalityV1 = Personality;
export type DebateTimidComboCardCodeV1 = CardCode;
export type DebateTimidComboHandV1 = Frozen<Hand>;
export type DebateTimidComboCharacterV1 = Frozen<Character>;
export type DebateTimidComboComboV1 = Frozen<Combo>;
export type DebateTimidComboPendingComboV1 = Frozen<PendingCombo>;
export type DebateTimidComboRawDrawV1 = Frozen<RawDraw>;
export type DebateTimidComboInputV1 = Frozen<Input>;
export type DebateTimidComboSnapshotV1 = Frozen<Snapshot>;
export type DebateTimidComboScanV1 = Frozen<Scan>;
export type DebateTimidComboRemovalV1 = Frozen<Removal>;
export type DebateTimidComboHpTransitionV1 = Frozen<HpTransition>;
export type DebateTimidComboStressTransitionV1 = Frozen<StressTransition>;
export type DebateTimidComboHitV1 = Frozen<Hit>;
export type DebateTimidComboComboTransitionV1 = Frozen<ComboTransition>;
export type DebateTimidComboReceiptV1 = Frozen<Receipt>;
export type DebateTimidComboFailureReasonV1 = FailureReason;
export type DebateTimidComboFailureV1 = Frozen<Failure>;
export type DebateTimidComboResultV1 = Frozen<Result>;
export type DebateTimidComboPolicyV1 = Frozen<Policy>;
export type DebateTimidComboEvidenceV1 = Frozen<Evidence>;

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
/** Detachment already rejected nonintegral and unsafe numeric representations. */
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
function parseCombo(value: unknown): PendingCombo {
  const record = object(value, ['active', 'attacker', 'counter'], 'invalid-combo');
  if (record.active !== true || record.counter !== 0) fail('invalid-combo');
  const attacker = integer(record.attacker, 0, 1, 'invalid-combo') as Team;
  return { active: true, attacker, counter: 0 };
}
function parseRawDraw(value: unknown): RawDraw {
  const record = object(value, ['role', 'bound', 'value'], 'invalid-raw-draw');
  if (record.role !== 'debate-timid-combo-jitter' || record.bound !== 5) fail('invalid-raw-draw');
  return { role: 'debate-timid-combo-jitter', bound: 5, value: integer(record.value, 0, 4, 'invalid-raw-draw') };
}
function parseInput(value: unknown): Input {
  const record = object(value, ['schemaVersion', 'profile', 'policies', 'genericOnly', 'characters', 'combo', 'resolvedAttack', 'rawDraws']);
  if (record.schemaVersion !== 1 || record.profile !== PROFILE) fail('unsupported-profile');
  if (canonical(record.policies) !== canonical(POLICY)) fail('unsupported-policy');
  if (record.genericOnly !== true) fail('invalid-generic-only');
  if (!Array.isArray(record.characters) || record.characters.length !== 2) fail('invalid-characters');
  const characters: Pair<Character> = [parseCharacter(record.characters[0]), parseCharacter(record.characters[1])];
  const combo = parseCombo(record.combo);
  const resolvedAttack = integer(record.resolvedAttack, 70, 227, 'invalid-resolved-attack');
  if (!Array.isArray(record.rawDraws)) fail('invalid-raw-draws');
  // Parse the whole transcript, including entries the scan might not consume.
  const rawDraws = record.rawDraws.map(parseRawDraw);
  return { schemaVersion: 1, profile: PROFILE, policies: POLICY, genericOnly: true, characters, combo, resolvedAttack, rawDraws };
}
function opponent(team: Team): Team { return team === 0 ? 1 : 0; }
function copyCharacter(character: Character): Character { return { ...character, hand: character.hand.slice() as Hand }; }
function copyCharacters(characters: Pair<Character>): Pair<Character> { return [copyCharacter(characters[0]), copyCharacter(characters[1])]; }
function copyCombo(combo: Combo): Combo { return { active: combo.active, attacker: combo.attacker, counter: combo.counter }; }
function copySnapshot(characters: Pair<Character>, combo: Combo): Snapshot { return { characters: copyCharacters(characters), combo: copyCombo(combo) }; }
function copyDraw(draw: RawDraw): RawDraw { return { role: draw.role, bound: draw.bound, value: draw.value }; }
function isTopicCard(card: CardCode): card is TopicCard { return card >= 1 && card <= 9; }

function removeTopic(character: Character, team: Team, physicalSlot: number, card: TopicCard, origins: Origins): Removal {
  const beforeHand = character.hand.slice() as Hand;
  const originalSlot = origins[physicalSlot]!;
  const afterHand: Hand = [-1, -1, -1, -1, -1, -1, -1];
  const afterOrigins: Origins = [null, null, null, null, null, null, null];
  const survivors: Removal['survivors'] = [];
  const discardedInactive: Removal['discardedInactive'] = [];
  for (let fromSlot = 0; fromSlot < character.maxCardCount; fromSlot++) {
    const survivor = beforeHand[fromSlot]!;
    if (fromSlot !== physicalSlot && survivor !== -1) {
      const toSlot = survivors.length;
      const survivorOrigin = origins[fromSlot]!;
      afterHand[toSlot] = survivor;
      afterOrigins[toSlot] = survivorOrigin;
      survivors.push({ card: survivor, fromSlot, toSlot, originalSlot: survivorOrigin });
    }
  }
  for (let slot = character.maxCardCount; slot < 7; slot++) {
    if (beforeHand[slot] !== -1) discardedInactive.push({ card: beforeHand[slot]!, physicalSlot: slot, originalSlot: origins[slot]! });
  }
  character.hand = afterHand;
  for (let slot = 0; slot < 7; slot++) origins[slot] = afterOrigins[slot]!;
  return { team, card, physicalSlot, originalSlot, maxCardCount: character.maxCardCount, beforeHand, afterHand: afterHand.slice() as Hand, survivors, discardedInactive };
}

function resolve(input: Input): Result {
  // This cross-field admission happens only after all transcript syntax passed.
  const attackerTeam = input.combo.attacker;
  if (input.characters[attackerTeam].personality !== 'timid' || input.characters[attackerTeam].angerTimer !== 1) fail('invalid-attacker-checkpoint');
  const targetTeam = opponent(attackerTeam);
  const before = copySnapshot(input.characters, input.combo);
  const characters = copyCharacters(input.characters);
  const combo = copyCombo(input.combo);
  const attacker = characters[attackerTeam];
  const target = characters[targetTeam];
  const origins = attacker.hand.map((card, slot) => card === -1 ? null : slot) as Origins;
  const scans: Scan[] = [];
  const hits: Hit[] = [];
  const consumedDraws: RawDraw[] = [];

  // Do not enumerate a snapshot, re-visit a compacted slot, or stop at zero HP.
  // At hit k the slot is at least k-1 and, after prior compaction, at most C-k.
  // Thus 2k <= C+1, giving at most ceil(C/2) hits, hence four for C <= seven.
  for (let physicalSlot = 0; physicalSlot < attacker.maxCardCount; physicalSlot++) {
    const card = attacker.hand[physicalSlot]!;
    const originalSlot = origins[physicalSlot]!;
    if (!isTopicCard(card)) {
      scans.push({ sequence: scans.length, physicalSlot, card, originalSlot, outcome: 'skip-non-topic', hitIndex: null });
      continue;
    }
    const sequence = hits.length;
    scans.push({ sequence: scans.length, physicalSlot, card, originalSlot, outcome: 'topic-hit', hitIndex: sequence });
    const drawIndex = consumedDraws.length;
    const draw = input.rawDraws[drawIndex];
    if (!draw) fail('missing-raw-draw');
    consumedDraws.push(copyDraw(draw));
    const cardLevel = ((card - 1) % 3) as 0 | 1 | 2;
    const levelCoef = POLICY.damage.levelCoefficients[cardLevel];
    const baseAttack = input.resolvedAttack + draw.value;
    const numerator = baseAttack * 10 * levelCoef * 10;
    const preHookHpDamage = Math.trunc(numerator / 1000);
    // This profile asserts the generic identity case instead of running a hook.
    const requestedHpDamage = preHookHpDamage;
    const requestedStressDamage = Math.trunc(requestedHpDamage / 15);
    const counterBefore = combo.counter;

    const beforeHp = target.hp;
    target.hp = Math.max(-100, Math.min(1000, beforeHp - requestedHpDamage));
    const hp: HpTransition = {
      sequence: sequence * 2,
      team: targetTeam,
      beforeHp,
      requestedHpDelta: -requestedHpDamage,
      afterHp: target.hp,
      actualHpDelta: target.hp - beforeHp,
    };
    const beforeStress = target.stress;
    target.stress = Math.max(0, Math.min(100, beforeStress + requestedStressDamage));
    const stress: StressTransition = {
      sequence: sequence * 2 + 1,
      team: targetTeam,
      beforeStress,
      requestedStressDelta: requestedStressDamage,
      afterStress: target.stress,
      actualStressDelta: target.stress - beforeStress,
    };
    const removal = removeTopic(attacker, attackerTeam, physicalSlot, card, origins);
    combo.counter++;
    hits.push({
      sequence,
      attackerTeam,
      targetTeam,
      physicalSlot,
      originalSlot,
      card,
      cardLevel,
      drawIndex,
      draw: copyDraw(draw),
      arithmetic: { resolvedAttack: input.resolvedAttack, jitter: draw.value, baseAttack, angerCoef: 10, levelCoef, topicCoef: 10, numerator, divisor: 1000, preHookHpDamage, hook: 'generic-identity' },
      requestedHpDamage,
      requestedStressDamage,
      hp,
      stress,
      removal,
      counterBefore,
      counterAfter: combo.counter,
    });
  }
  combo.active = false;
  // All writes above are detached. An extra draw returns no state or receipt.
  if (consumedDraws.length !== input.rawDraws.length) fail('extra-raw-draws');
  const receipt: Receipt = {
    schemaVersion: 1,
    profile: PROFILE,
    policy: POLICY,
    evidence: EVIDENCE,
    genericOnly: true,
    resolvedAttack: input.resolvedAttack,
    attackerTeam,
    targetTeam,
    before,
    after: copySnapshot(characters, combo),
    scans,
    hits,
    comboTransition: { before: copyCombo(input.combo), after: copyCombo(combo), completed: true, hitCount: hits.length },
    consumedDraws,
    suppliedRawDrawCount: input.rawDraws.length,
    externalRngConsumed: 0,
  };
  return { ok: true, characters, combo, receipt };
}

export const DEBATE_TIMID_COMBO_POLICY_V1: DebateTimidComboPolicyV1 = freeze(POLICY);
export const DEBATE_TIMID_COMBO_EVIDENCE_V1: DebateTimidComboEvidenceV1 = freeze(EVIDENCE);

/**
 * Pure all-or-nothing completion of one supplied fresh pending combo checkpoint.
 * The argument is a JSON-shaped value, not serialized JSON text. All input and
 * all raw-draw syntax are detached and parsed before cross-field resolution.
 * Success exhausts exactly the supplied draws and returns frozen detached state
 * and a bounded receipt. Failure returns only its code, never a partial receipt.
 * Caller data is never changed, no external RNG runs, and no session API exists.
 */
export function evaluateDebateTimidCombo(input: unknown): DebateTimidComboResultV1 {
  try {
    return freeze(resolve(parseInput(detach(input))));
  } catch (error) {
    return freeze(failure(error));
  }
}
