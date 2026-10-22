/**
 * Bounded, atomic composition of the pinned modern reference AngerPhase.
 * Reuses the public anger-entry and fresh-pending timid-combo kernels without
 * reproducing their gameplay. There are at most two passes, not stabilization.
 * A first-pass winner skips both the second pass and CalcCrumbled. Otherwise
 * CalcCrumbled runs after the second whole combo and before the last winner
 * check. Critical classification, TurnEnd, views, sessions, and RNG are absent.
 * This reference composition is not native, original, PK, or Vanilla verified.
 */
import {
  DEBATE_ANGER_ENTRY_POLICY_V1,
  evaluateDebateAngerEntry,
} from './debate-anger-entry.ts';
import type {
  DebateAngerEntryTeamV1,
  DebateAngerEntryMaybeTeamV1,
  DebateAngerEntryPersonalityV1,
  DebateAngerEntryCardCodeV1,
  DebateAngerEntryHandV1,
  DebateAngerEntryCharacterV1,
  DebateAngerEntryComboV1,
  DebateAngerEntryReceiptV1,
  DebateAngerEntryFailureReasonV1,
} from './debate-anger-entry.ts';
import {
  DEBATE_TIMID_COMBO_POLICY_V1,
  evaluateDebateTimidCombo,
} from './debate-timid-combo.ts';
import type {
  DebateTimidComboRawDrawV1,
  DebateTimidComboReceiptV1,
  DebateTimidComboFailureReasonV1,
} from './debate-timid-combo.ts';

type Frozen<T> = T extends object ? { readonly [K in keyof T]: Frozen<T[K]> } : T;
type Mutable<T> = T extends object ? { -readonly [K in keyof T]: Mutable<T[K]> } : T;
type Pair<T> = [T, T];
type Team = DebateAngerEntryTeamV1;
type MaybeTeam = DebateAngerEntryMaybeTeamV1;
type Character = Mutable<DebateAngerEntryCharacterV1>;
type Combo = Mutable<DebateAngerEntryComboV1>;
type InactiveCombo = Combo & { active: false };
type RawDraw = Mutable<DebateTimidComboRawDrawV1>;
type CrumbleLevel = 0 | 1 | 2 | 3;
type PassNumber = 1 | 2;
type Outcome = 'terminal-pending-classification' | 'turn-end-pending';
const PROFILE = 'debate-anger-phase-reference-v1' as const;
const MAX_INPUT_NODES = 4096;
const MAX_INPUT_DEPTH = 16;
const MAX_INPUT_ARRAY_LENGTH = 64;
const MAX_CANONICAL_BYTES = 65536;

const POLICY = {
  "id": "debate-anger-phase-bounded-two-pass-policy-v1",
  "profile": "debate-anger-phase-reference-v1",
  "dependencies": {
    "entryProfile": "debate-anger-entry-reference-v1",
    "entryPolicyId": "debate-anger-entry-single-pass-policy-v1",
    "comboProfile": "debate-timid-combo-reference-v1",
    "comboPolicyId": "debate-timid-combo-fresh-pending-policy-v1",
    "composition": "invoke-existing-public-evaluators-with-their-complete-exported-policies",
    "nestedReceipts": "preserve-full-existing-entry-and-combo-receipts"
  },
  "checkpoint": {
    "characters": 2,
    "firstTeam": [0, 1],
    "winner": -1,
    "initialHp": { "minimum": 1, "maximum": 1000 },
    "intermediateHp": { "minimum": -100, "maximum": 1000 },
    "characterFields": "anger-entry-character-fields-personality-strength-hp-stress-angerTimer-maxCardCount-hand",
    "personality": "caller-resolved-timid-calm-bold-or-reckless",
    "strength": { "minimum": 1, "maximum": 100 },
    "stress": { "minimum": 0, "maximum": 100 },
    "angerTimer": { "minimum": 0, "maximum": 4 },
    "activeHandCapacity": { "minimum": 4, "maximum": 7 },
    "physicalHandLength": 7,
    "cardCode": { "minimum": -1, "maximum": 14 },
    "combo": { "active": false, "attacker": [-1, 0, 1], "minimumCounter": 0, "maximumCounter": 7 },
    "inactiveComboFields": "preserved-unless-timid-entry-resets-attacker-and-counter",
    "crumbledLevels": { "length": 2, "minimum": 0, "maximum": 3 },
    "crumbled": "two-boolean-latched-flags-not-normalized-at-entry",
    "resolvedAttacks": { "length": 2, "index": "team", "minimum": 70, "maximum": 227 },
    "genericOnly": true,
    "admittedBounds": "engine-admission-policy-not-universal-source-reachability"
  },
  "ordering": {
    "firstPass": ["entry-canReflect-true", "whole-pending-combo-if-active", "winner-check"],
    "firstTerminal": "return-before-second-pass-and-before-crumble",
    "secondPass": ["entry-canReflect-false", "whole-pending-combo-if-active", "crumble", "winner-check"],
    "maximumPasses": 2,
    "noCandidate": "still-check-winner-and-continue-source-sequence",
    "comboZeroHpBreak": false,
    "thirdPass": false,
    "stabilizationLoop": false
  },
  "winner": {
    "initialWinner": -1,
    "order": "opponent-of-firstTeam-then-firstTeam-with-short-circuit",
    "threshold": "hp-less-than-or-equal-to-zero",
    "opponentTerminal": "firstTeam-wins",
    "firstTerminalOnly": "opponent-wins",
    "simultaneousTerminal": "firstTeam-wins",
    "classification": "not-evaluated"
  },
  "crumble": {
    "when": "only-after-second-whole-combo-and-before-second-winner-check",
    "teamOrder": [0, 1],
    "formula": "clamp-truncate-toward-zero-of-1000-minus-hp-divided-by-250-to-zero-through-three",
    "changedLevel": "write-computed-level-and-set-flag-true-including-downward-change",
    "sameLevel": "preserve-existing-flag",
    "result": "after-flag-zero-or-after-flag-one",
    "firstTerminal": "not-evaluated-null-receipt-preserve-input-levels-and-flags"
  },
  "draws": {
    "input": "two-pass-keyed-arrays-of-caller-supplied-labeled-raw-draws",
    "role": "debate-timid-combo-jitter",
    "bound": 5,
    "minimum": 0,
    "maximum": 4,
    "maximumPerPass": 4,
    "validation": "detach-and-validate-both-arrays-before-any-gameplay",
    "consumption": "delegate-exact-consumption-to-each-whole-combo-kernel",
    "noCombo": "require-empty-corresponding-pass-array",
    "unusedSecondPass": "require-empty-second-array-on-first-pass-terminal",
    "offsets": "zero-based-global-consumed-index-plus-pass-and-local-draw-index",
    "missingOrExtra": "whole-composition-atomic-failure",
    "rngImplementation": "none",
    "nativeStreamClaim": false
  },
  "audit": {
    "snapshots": "detached-initial-final-and-each-executed-pass-before-after",
    "passes": "one-or-two-completed-passes-with-full-entry-and-optional-combo-receipts",
    "winnerChecks": "evaluated-hp-tests-in-short-circuit-order",
    "crumble": "before-after-levels-flags-and-per-team-computation-or-null",
    "draws": "pass-offsets-and-flat-consumed-transcript-with-original-pass-local-indices"
  },
  "safety": {
    "input": "closed-schema-detached-safe-JSON-data-with-exact-policy",
    "requiredRuntime": "trusted-node-util-types-isProxy-via-process-getBuiltinModule",
    "unavailableProxyDetector": "fail-closed-before-inspecting-input",
    "proxiesAccessorsAndExecutableValues": "rejected-without-invocation",
    "result": "recursively-frozen-and-detached-from-input",
    "failure": "typed-validation-or-pass-qualified-kernel-code-no-partial-state-or-receipt"
  },
  "capacity": {
    "maxInputNodes": 4096,
    "maxInputDepth": 16,
    "maxInputArrayLength": 64,
    "maxCanonicalUtf8Bytes": 65536,
    "maxEntryCalls": 2,
    "maxComboCalls": 2,
    "maxWinnerChecks": 2,
    "maxCrumbleCalls": 1,
    "maxConsumedDraws": 8
  },
  "boundary": {
    "kind": "bounded-two-pass-modern-reference-anger-phase-composition",
    "terminalOutcome": "terminal-pending-classification",
    "nonterminalOutcome": "turn-end-pending",
    "canCriticalAndCriticalClosing": "excluded",
    "turnEndAndTimerDecay": "excluded",
    "phaseObjectDeltaStepAndView": "excluded",
    "handRefillAndDeckRegeneration": "excluded",
    "personResolutionAndAttackDerivation": "caller-supplied-not-evaluated",
    "characterSpecificDamageHook": "excluded-generic-identity-assertion-only",
    "rng": "no-implementation-no-external-consumption",
    "campaign": false,
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
  "phasePath": "Project/Assets/Sango/Scripts/Game/Debate/DebatePhase.cs",
  "phaseBlob": "6aa98f855a5d4d172cde7e8ffc18a141b8a7b587",
  "phaseSha256": "5b47f7b6a89d6123a23e7c14f22168e59c9edd549e98d9bc0258d8a55bb9cbf3",
  "sourceAngerPhaseLines": [333, 390],
  "sourceAngerTriggerLines": [1300, 1325],
  "sourceAngerLines": [1328, 1354],
  "sourceComboAttackLines": [1356, 1377],
  "sourceWinnerLines": [1379, 1396],
  "sourceExcludedCriticalLines": [1398, 1406],
  "sourceCalcAngeringLines": [1483, 1517],
  "sourceCrumbleLines": [1520, 1531],
  "entryDependency": "debate-anger-entry-reference-v1",
  "comboDependency": "debate-timid-combo-reference-v1",
  "phaseEvidence": "first-reflecting-entry-whole-combo-winner-then-second-nonreflecting-entry-whole-combo-crumble-winner",
  "winnerEvidence": "opponent-hp-tested-first-so-simultaneous-terminal-prefers-firstTeam",
  "crumbleEvidence": "truncate-and-clamp-level-difference-latches-flag-in-either-direction-unchanged-level-preserves-flag",
  "compressionBoundary": "source-step-ticks-compressed-no-view-or-external-phase-execution",
  "initialCheckpointAndGenericAdmission": "explicit-engine-policy-not-complete-source-state-reachability",
  "inputSafetyBudgetsAuditAndReasonNames": "engine-policy",
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

type Input = {
  schemaVersion: 1;
  profile: typeof PROFILE;
  policies: Policy;
  genericOnly: true;
  firstTeam: Team;
  winner: -1;
  /** Initial HP must be positive; kernels may produce nonpositive HP. */
  characters: Pair<Character>;
  combo: InactiveCombo;
  crumbledLevels: Pair<CrumbleLevel>;
  crumbled: Pair<boolean>;
  /** Team-indexed effective attack, caller supplied rather than derived. */
  resolvedAttacks: Pair<number>;
  /** Pass-indexed, not attacker-indexed; each array admits at most four draws. */
  passDraws: Pair<RawDraw[]>;
};
type Snapshot = {
  characters: Pair<Character>;
  combo: Combo;
  winner: MaybeTeam;
  crumbledLevels: Pair<CrumbleLevel>;
  crumbled: Pair<boolean>;
};
type WinnerTest = { team: Team; hp: number; terminal: boolean };
type WinnerReason = 'opponent-hp-nonpositive' | 'first-hp-nonpositive' | 'no-terminal-hp';
type WinnerCheck = {
  pass: PassNumber;
  firstTeam: Team;
  order: Pair<Team>;
  /** Both HP values in team order; tests below record only evaluated branches. */
  hp: Pair<number>;
  beforeWinner: -1;
  afterWinner: MaybeTeam;
  tests: WinnerTest[];
  reason: WinnerReason;
  terminal: boolean;
};
type CrumbleTeam = {
  team: Team;
  hp: number;
  unboundedLevel: number;
  computedLevel: CrumbleLevel;
  previousLevel: CrumbleLevel;
  changed: boolean;
  previousFlag: boolean;
  afterFlag: boolean;
};
type CrumbleResult = {
  beforeLevels: Pair<CrumbleLevel>;
  beforeFlags: Pair<boolean>;
  afterLevels: Pair<CrumbleLevel>;
  afterFlags: Pair<boolean>;
  teams: Pair<CrumbleTeam>;
  anyCrumbled: boolean;
};
type DrawUse = { globalIndex: number; pass: PassNumber; passDrawIndex: number; draw: RawDraw };
type PassDrawAudit = {
  pass: PassNumber;
  globalStartIndex: number;
  globalEndIndexExclusive: number;
  suppliedCount: number;
  consumedCount: number;
  consumed: DrawUse[];
};
type DrawAudit = {
  suppliedCounts: Pair<number>;
  executedPasses: PassNumber;
  consumedCount: number;
  consumed: DrawUse[];
};
type Pass = {
  pass: PassNumber;
  canReflect: boolean;
  before: Snapshot;
  entryReceipt: DebateAngerEntryReceiptV1;
  comboReceipt: DebateTimidComboReceiptV1 | null;
  drawAudit: PassDrawAudit;
  winnerCheck: WinnerCheck;
  after: Snapshot;
};
type Receipt = {
  schemaVersion: 1;
  profile: typeof PROFILE;
  policy: Policy;
  evidence: Evidence;
  genericOnly: true;
  firstTeam: Team;
  resolvedAttacks: Pair<number>;
  before: Snapshot;
  after: Snapshot;
  passes: Pass[];
  winnerChecks: WinnerCheck[];
  /** Not invoked when the first winner check is terminal. */
  crumbleResult: CrumbleResult | null;
  drawAudit: DrawAudit;
  outcome: Outcome;
  externalRngConsumed: 0;
};
type Success = Snapshot & { ok: true; outcome: Outcome; receipt: Receipt };
type ValidationFailureReason =
  | 'unsupported-runtime'
  | 'input-limit'
  | 'malformed-data'
  | 'unknown-field'
  | 'unsupported-profile'
  | 'unsupported-policy'
  | 'invalid-generic-only'
  | 'invalid-first-team'
  | 'invalid-winner'
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
  | 'invalid-crumbled-levels'
  | 'invalid-crumbled'
  | 'invalid-resolved-attacks'
  | 'invalid-resolved-attack'
  | 'invalid-pass-draws'
  | 'invalid-raw-draw'
  | 'draws-without-combo'
  | 'unused-second-pass-draws';
type FailureReason = ValidationFailureReason | 'entry-kernel-failure' | 'combo-kernel-failure';
type ValidationFailure = { ok: false; reason: ValidationFailureReason };
type KernelFailure =
  | { ok: false; reason: 'entry-kernel-failure'; pass: PassNumber; kernelReason: DebateAngerEntryFailureReasonV1 }
  | { ok: false; reason: 'combo-kernel-failure'; pass: PassNumber; kernelReason: DebateTimidComboFailureReasonV1 };
type Failure = ValidationFailure | KernelFailure;
type Result = Success | Failure;

export type DebateAngerPhaseTeamV1 = Team;
export type DebateAngerPhaseMaybeTeamV1 = MaybeTeam;
export type DebateAngerPhasePersonalityV1 = DebateAngerEntryPersonalityV1;
export type DebateAngerPhaseCardCodeV1 = DebateAngerEntryCardCodeV1;
export type DebateAngerPhaseHandV1 = DebateAngerEntryHandV1;
export type DebateAngerPhaseCharacterV1 = DebateAngerEntryCharacterV1;
export type DebateAngerPhaseComboV1 = DebateAngerEntryComboV1;
export type DebateAngerPhaseInactiveComboV1 = Frozen<InactiveCombo>;
export type DebateAngerPhaseRawDrawV1 = DebateTimidComboRawDrawV1;
export type DebateAngerPhaseCrumbleLevelV1 = CrumbleLevel;
export type DebateAngerPhasePassNumberV1 = PassNumber;
export type DebateAngerPhaseOutcomeV1 = Outcome;
export type DebateAngerPhaseInputV1 = Frozen<Input>;
export type DebateAngerPhaseSnapshotV1 = Frozen<Snapshot>;
export type DebateAngerPhaseWinnerTestV1 = Frozen<WinnerTest>;
export type DebateAngerPhaseWinnerReasonV1 = WinnerReason;
export type DebateAngerPhaseWinnerCheckV1 = Frozen<WinnerCheck>;
export type DebateAngerPhaseCrumbleTeamV1 = Frozen<CrumbleTeam>;
export type DebateAngerPhaseCrumbleResultV1 = Frozen<CrumbleResult>;
export type DebateAngerPhaseDrawUseV1 = Frozen<DrawUse>;
export type DebateAngerPhasePassDrawAuditV1 = Frozen<PassDrawAudit>;
export type DebateAngerPhaseDrawAuditV1 = Frozen<DrawAudit>;
export type DebateAngerPhasePassV1 = Frozen<Pass>;
export type DebateAngerPhaseReceiptV1 = Frozen<Receipt>;
export type DebateAngerPhaseSuccessV1 = Frozen<Success>;
export type DebateAngerPhaseValidationFailureReasonV1 = ValidationFailureReason;
export type DebateAngerPhaseFailureReasonV1 = FailureReason;
export type DebateAngerPhaseValidationFailureV1 = Frozen<ValidationFailure>;
export type DebateAngerPhaseKernelFailureV1 = Frozen<KernelFailure>;
export type DebateAngerPhaseFailureV1 = Frozen<Failure>;
export type DebateAngerPhaseResultV1 = Frozen<Result>;
export type DebateAngerPhasePolicyV1 = Frozen<Policy>;
export type DebateAngerPhaseEvidenceV1 = Frozen<Evidence>;

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
function object(value: unknown, keys: readonly string[], reason: ValidationFailureReason = 'malformed-data'): Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) fail(reason);
  const record = value as Record<string, unknown>;
  if (Object.keys(record).some(key => !keys.includes(key))) fail('unknown-field');
  if (keys.some(key => !Object.hasOwn(record, key))) fail('malformed-data');
  return record;
}
/** Detachment has already rejected all nonintegral or unsafe numeric values. */
function integer(value: unknown, minimum: number, maximum: number, reason: ValidationFailureReason): number {
  if (typeof value !== 'number' || value < minimum || value > maximum) fail(reason);
  return value;
}
function parseCharacter(value: unknown): Character {
  const record = object(value, ['personality', 'strength', 'hp', 'stress', 'angerTimer', 'maxCardCount', 'hand'], 'invalid-character');
  if (record.personality !== 'timid' && record.personality !== 'calm' && record.personality !== 'bold' && record.personality !== 'reckless') fail('invalid-personality');
  const strength = integer(record.strength, 1, 100, 'invalid-strength');
  const hp = integer(record.hp, 1, 1000, 'invalid-hp');
  const stress = integer(record.stress, 0, 100, 'invalid-stress');
  const angerTimer = integer(record.angerTimer, 0, 4, 'invalid-anger-timer');
  const maxCardCount = integer(record.maxCardCount, 4, 7, 'invalid-hand-capacity') as Character['maxCardCount'];
  if (!Array.isArray(record.hand) || record.hand.length !== 7) fail('invalid-hand');
  const hand = record.hand.map(card => integer(card, -1, 14, 'invalid-hand') as DebateAngerEntryCardCodeV1) as Character['hand'];
  return { personality: record.personality, strength, hp, stress, angerTimer, maxCardCount, hand };
}
function parseCombo(value: unknown): InactiveCombo {
  const record = object(value, ['active', 'attacker', 'counter'], 'invalid-combo');
  if (record.active !== false) fail('invalid-combo');
  const attacker = integer(record.attacker, -1, 1, 'invalid-combo') as MaybeTeam;
  const counter = integer(record.counter, 0, 7, 'invalid-combo');
  return { active: false, attacker, counter };
}
function parseRawDraw(value: unknown): RawDraw {
  const record = object(value, ['role', 'bound', 'value'], 'invalid-raw-draw');
  if (record.role !== 'debate-timid-combo-jitter' || record.bound !== 5) fail('invalid-raw-draw');
  return { role: 'debate-timid-combo-jitter', bound: 5, value: integer(record.value, 0, 4, 'invalid-raw-draw') };
}
function parsePassDraws(value: unknown): RawDraw[] {
  if (!Array.isArray(value) || value.length > 4) fail('invalid-pass-draws');
  return value.map(parseRawDraw);
}
function parseInput(value: unknown): Input {
  const record = object(value, [
    'schemaVersion', 'profile', 'policies', 'genericOnly', 'firstTeam', 'winner',
    'characters', 'combo', 'crumbledLevels', 'crumbled', 'resolvedAttacks', 'passDraws',
  ]);
  if (record.schemaVersion !== 1 || record.profile !== PROFILE) fail('unsupported-profile');
  if (canonical(record.policies) !== canonical(POLICY)) fail('unsupported-policy');
  if (record.genericOnly !== true) fail('invalid-generic-only');
  const firstTeam = integer(record.firstTeam, 0, 1, 'invalid-first-team') as Team;
  if (record.winner !== -1) fail('invalid-winner');
  if (!Array.isArray(record.characters) || record.characters.length !== 2) fail('invalid-characters');
  const characters: Pair<Character> = [parseCharacter(record.characters[0]), parseCharacter(record.characters[1])];
  const combo = parseCombo(record.combo);
  if (!Array.isArray(record.crumbledLevels) || record.crumbledLevels.length !== 2) fail('invalid-crumbled-levels');
  const crumbledLevels: Pair<CrumbleLevel> = [
    integer(record.crumbledLevels[0], 0, 3, 'invalid-crumbled-levels') as CrumbleLevel,
    integer(record.crumbledLevels[1], 0, 3, 'invalid-crumbled-levels') as CrumbleLevel,
  ];
  if (!Array.isArray(record.crumbled) || record.crumbled.length !== 2 || typeof record.crumbled[0] !== 'boolean' || typeof record.crumbled[1] !== 'boolean') fail('invalid-crumbled');
  const crumbled: Pair<boolean> = [record.crumbled[0], record.crumbled[1]];
  if (!Array.isArray(record.resolvedAttacks) || record.resolvedAttacks.length !== 2) fail('invalid-resolved-attacks');
  const resolvedAttacks: Pair<number> = [
    integer(record.resolvedAttacks[0], 70, 227, 'invalid-resolved-attack'),
    integer(record.resolvedAttacks[1], 70, 227, 'invalid-resolved-attack'),
  ];
  if (!Array.isArray(record.passDraws) || record.passDraws.length !== 2) fail('invalid-pass-draws');
  // Both pass arrays are completely validated before either kernel is called.
  const passDraws: Pair<RawDraw[]> = [parsePassDraws(record.passDraws[0]), parsePassDraws(record.passDraws[1])];
  return { schemaVersion: 1, profile: PROFILE, policies: POLICY, genericOnly: true, firstTeam, winner: -1, characters, combo, crumbledLevels, crumbled, resolvedAttacks, passDraws };
}
function opponent(team: Team): Team { return team === 0 ? 1 : 0; }
function copyCharacter(character: DebateAngerEntryCharacterV1): Character {
  return { ...character, hand: character.hand.slice() as Character['hand'] };
}
function copyCharacters(characters: readonly [DebateAngerEntryCharacterV1, DebateAngerEntryCharacterV1]): Pair<Character> {
  return [copyCharacter(characters[0]), copyCharacter(characters[1])];
}
function copyCombo(combo: DebateAngerEntryComboV1): Combo {
  return { active: combo.active, attacker: combo.attacker, counter: combo.counter };
}
function copySnapshot(state: Snapshot): Snapshot {
  return {
    characters: copyCharacters(state.characters),
    combo: copyCombo(state.combo),
    winner: state.winner,
    crumbledLevels: [state.crumbledLevels[0], state.crumbledLevels[1]],
    crumbled: [state.crumbled[0], state.crumbled[1]],
  };
}
function copyDraw(draw: DebateTimidComboRawDrawV1): RawDraw { return { role: draw.role, bound: draw.bound, value: draw.value }; }
function copyDrawUse(use: DrawUse): DrawUse {
  return { globalIndex: use.globalIndex, pass: use.pass, passDrawIndex: use.passDrawIndex, draw: copyDraw(use.draw) };
}

/** Caller admission and first-pass early return ensure the prior winner is -1. */
function checkWinner(state: Snapshot, firstTeam: Team, pass: PassNumber): WinnerCheck {
  const otherTeam = opponent(firstTeam);
  const order: Pair<Team> = [otherTeam, firstTeam];
  const hp: Pair<number> = [state.characters[0].hp, state.characters[1].hp];
  const tests: WinnerTest[] = [{ team: otherTeam, hp: hp[otherTeam], terminal: hp[otherTeam] <= 0 }];
  let reason: WinnerReason = 'no-terminal-hp';
  if (hp[otherTeam] <= 0) {
    state.winner = firstTeam;
    reason = 'opponent-hp-nonpositive';
  } else {
    tests.push({ team: firstTeam, hp: hp[firstTeam], terminal: hp[firstTeam] <= 0 });
    if (hp[firstTeam] <= 0) {
      state.winner = otherTeam;
      reason = 'first-hp-nonpositive';
    }
  }
  return { pass, firstTeam, order, hp, beforeWinner: -1, afterWinner: state.winner, tests, reason, terminal: state.winner !== -1 };
}
function calcCrumble(state: Snapshot): CrumbleResult {
  const beforeLevels: Pair<CrumbleLevel> = [state.crumbledLevels[0], state.crumbledLevels[1]];
  const beforeFlags: Pair<boolean> = [state.crumbled[0], state.crumbled[1]];
  function update(team: Team): CrumbleTeam {
    const hp = state.characters[team].hp;
    const unboundedLevel = Math.trunc((1000 - hp) / 250);
    const computedLevel = Math.max(0, Math.min(3, unboundedLevel)) as CrumbleLevel;
    const previousLevel = state.crumbledLevels[team];
    const previousFlag = state.crumbled[team];
    const changed = computedLevel !== previousLevel;
    if (changed) {
      state.crumbledLevels[team] = computedLevel;
      state.crumbled[team] = true;
    }
    return { team, hp, unboundedLevel, computedLevel, previousLevel, changed, previousFlag, afterFlag: state.crumbled[team] };
  }
  const teams: Pair<CrumbleTeam> = [update(0), update(1)];
  return {
    beforeLevels,
    beforeFlags,
    afterLevels: [state.crumbledLevels[0], state.crumbledLevels[1]],
    afterFlags: [state.crumbled[0], state.crumbled[1]],
    teams,
    anyCrumbled: state.crumbled[0] || state.crumbled[1],
  };
}

function resolve(input: Input): Success {
  const state = copySnapshot(input);
  const before = copySnapshot(state);
  const passes: Pass[] = [];
  const winnerChecks: WinnerCheck[] = [];
  const consumed: DrawUse[] = [];
  let crumbleResult: CrumbleResult | null = null;

  function executePass(pass: PassNumber): Pass {
    const passBefore = copySnapshot(state);
    const canReflect = pass === 1;
    const entry = evaluateDebateAngerEntry({
      schemaVersion: 1,
      profile: POLICY.dependencies.entryProfile,
      policies: DEBATE_ANGER_ENTRY_POLICY_V1,
      firstTeam: input.firstTeam,
      canReflect,
      characters: state.characters,
      combo: state.combo,
    });
    if (!entry.ok) abort({ ok: false, reason: 'entry-kernel-failure', pass, kernelReason: entry.reason });
    state.characters = copyCharacters(entry.characters);
    state.combo = copyCombo(entry.combo);

    const rawDraws = input.passDraws[pass - 1]!;
    const globalStartIndex = consumed.length;
    const passConsumed: DrawUse[] = [];
    let comboReceipt: DebateTimidComboReceiptV1 | null = null;
    if (state.combo.active) {
      const attacker = state.combo.attacker;
      // Inactive admission plus entry's timid activation establishes this;
      // nevertheless fail closed rather than indexing with a stale sentinel.
      if (attacker === -1) abort({ ok: false, reason: 'combo-kernel-failure', pass, kernelReason: 'invalid-combo' });
      const combo = evaluateDebateTimidCombo({
        schemaVersion: 1,
        profile: POLICY.dependencies.comboProfile,
        policies: DEBATE_TIMID_COMBO_POLICY_V1,
        genericOnly: true,
        characters: state.characters,
        combo: state.combo,
        resolvedAttack: input.resolvedAttacks[attacker],
        rawDraws,
      });
      if (!combo.ok) abort({ ok: false, reason: 'combo-kernel-failure', pass, kernelReason: combo.reason });
      state.characters = copyCharacters(combo.characters);
      state.combo = copyCombo(combo.combo);
      comboReceipt = combo.receipt;
      // The combo kernel owns all scan/compaction/damage and exact consumption.
      // Compose only its completed transcript; do not replay its hand scan.
      for (let passDrawIndex = 0; passDrawIndex < combo.receipt.consumedDraws.length; passDrawIndex++) {
        const use: DrawUse = { globalIndex: consumed.length, pass, passDrawIndex, draw: copyDraw(combo.receipt.consumedDraws[passDrawIndex]!) };
        consumed.push(use);
        passConsumed.push(copyDrawUse(use));
      }
    } else if (rawDraws.length !== 0) {
      fail('draws-without-combo');
    }

    // Source case 7 is absent from the first pass and precedes case 8's winner.
    if (pass === 2) crumbleResult = calcCrumble(state);
    const winnerCheck = checkWinner(state, input.firstTeam, pass);
    winnerChecks.push(winnerCheck);
    return {
      pass,
      canReflect,
      before: passBefore,
      entryReceipt: entry.receipt,
      comboReceipt,
      drawAudit: { pass, globalStartIndex, globalEndIndexExclusive: consumed.length, suppliedCount: rawDraws.length, consumedCount: passConsumed.length, consumed: passConsumed },
      winnerCheck,
      after: copySnapshot(state),
    };
  }

  passes.push(executePass(1));
  if (state.winner !== -1) {
    // Unused second-pass data must not be silently accepted. Any local work is
    // discarded if this fails; there is still no returned state or receipt.
    if (input.passDraws[1].length !== 0) fail('unused-second-pass-draws');
  } else {
    passes.push(executePass(2));
  }
  const outcome: Outcome = state.winner === -1 ? 'turn-end-pending' : 'terminal-pending-classification';
  const receipt: Receipt = {
    schemaVersion: 1,
    profile: PROFILE,
    policy: POLICY,
    evidence: EVIDENCE,
    genericOnly: true,
    firstTeam: input.firstTeam,
    resolvedAttacks: [input.resolvedAttacks[0], input.resolvedAttacks[1]],
    before,
    after: copySnapshot(state),
    passes,
    winnerChecks,
    crumbleResult,
    drawAudit: {
      suppliedCounts: [input.passDraws[0].length, input.passDraws[1].length],
      executedPasses: passes.length === 1 ? 1 : 2,
      consumedCount: consumed.length,
      consumed,
    },
    outcome,
    externalRngConsumed: 0,
  };
  return { ok: true, ...copySnapshot(state), outcome, receipt };
}

export const DEBATE_ANGER_PHASE_POLICY_V1: DebateAngerPhasePolicyV1 = freeze(POLICY);
export const DEBATE_ANGER_PHASE_EVIDENCE_V1: DebateAngerPhaseEvidenceV1 = freeze(EVIDENCE);

/**
 * Pure all-or-nothing bounded AngerPhase composition over a JSON-shaped value,
 * not serialized JSON text. Fully detaches and validates the entire checkpoint,
 * both resolved attacks, and both draw arrays before invoking either kernel.
 * Every success is detached and recursively frozen; every failure omits state
 * and receipts, including failures discovered after a detached earlier pass.
 * The returned outcome is a pending boundary, not a Critical/Closing/TurnEnd
 * action. No external RNG, native stream, campaign, or session API is involved.
 */
export function evaluateDebateAngerPhase(input: unknown): DebateAngerPhaseResultV1 {
  try {
    return freeze(resolve(parseInput(detach(input))));
  } catch (error) {
    return freeze(failure(error));
  }
}
