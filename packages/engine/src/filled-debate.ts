/**
 * Bounded current-deck session integrating the shipped CharacterFillCards kernel.
 * Generic identities, normal difficulty, no tutorial/anger/deck regeneration.
 * All seven old profiles keep their public contracts and saved histories.
 * Static implementation only: no execution or native equivalence is claimed.
 */
import { evaluateDebateHandFill, DEBATE_HAND_FILL_POLICY_V1 } from './debate-hand-fill.ts';
import type { DebateHandFillCardCodeV1, DebateHandFillReceiptV1 } from './debate-hand-fill.ts';
import { resolveNormalDebateRound } from './debate-normal-round.ts';
import type { RethinkDebateCardV1, RethinkDebatePlayV1, RethinkDebateDamageV1,
  RethinkDebateEffectV1, RethinkDebateReceiptV1, RethinkDebateOutcomeV1 } from './rethink-debate.ts';
type Frozen<T> = T extends object ? { readonly [K in keyof T]: Frozen<T[K]> } : T;
type Mutable<T> = T extends object ? { -readonly [K in keyof T]: Mutable<T[K]> } : T;
type Pair<T> = [T, T];
type Topic = 'story' | 'logic' | 'trend';
type CardCode = DebateHandFillCardCodeV1;
type Card = Mutable<RethinkDebateCardV1>;
type Occurrence = { cardCode: CardCode; token: string; tapeIndex: number };
type Play = Mutable<RethinkDebatePlayV1>;
type Damage = Mutable<RethinkDebateDamageV1>;
type Effect = Mutable<RethinkDebateEffectV1>;
type Outcome = Mutable<RethinkDebateOutcomeV1>;
type OldReceipt = Mutable<RethinkDebateReceiptV1>;
const PROFILE = 'debate-filled-current-deck-reference-v1' as const;
const TAG = 'filled-debate-session-v1' as const;
const MAX_ENTRIES = 64, MAX_ARRAY = 4096, MAX_BYTES = 16 * 1024 * 1024;
const POLICY = {
  "id": "filled-debate-current-deck-policy-v1",
  "profile": "debate-filled-current-deck-reference-v1",
  "tutorial": false,
  "difficulty": "source-normal",
  "combat": {
    "cards": {
      "id": "topic-shout-ignore-compose-agitate-and-sophistry-only-v1",
      "kinds": [
        "topic",
        "shout",
        "ignore",
        "compose",
        "agitate",
        "sophistry"
      ],
      "topics": [
        "story",
        "logic",
        "trend"
      ],
      "levels": [
        "small",
        "medium",
        "large"
      ],
      "topicPower": "1+levelIndex+10-if-current-topic",
      "topicLevelCoefficients": [
        10,
        15,
        20
      ],
      "topicStressCoefficients": [
        10,
        15,
        20
      ],
      "drawStressEach": 15
    },
    "shout": {
      "id": "source-no-anger-shout-v1",
      "power": 110,
      "levelCoefficient": 15,
      "topicCoefficient": 12,
      "stressCoefficient": 15,
      "availability": "angerTimer-zero-only",
      "additionalEffect": "none"
    },
    "ignore": {
      "id": "source-no-anger-ignore-v1",
      "power": 120,
      "stressDamage": 30,
      "hpDamage": 0,
      "damageJitter": false,
      "availability": "angerTimer-zero-only",
      "additionalEffect": "none",
      "suppressOpponentAdditionalEffect": true,
      "suppressionScope": "loser-effect-including-compose-and-agitate",
      "suppressSophistryTopicReroll": true
    },
    "compose": {
      "id": "source-no-anger-compose-reflection-v1",
      "power": 0,
      "hpDamage": 0,
      "damageJitter": false,
      "availability": "angerTimer-zero-only",
      "target": "opponent-unless-reflected-then-self",
      "requestBasis": "opponent-current-stress-regardless-of-reflection",
      "requestedStress": "-max(trunc(opponent-current-stress/2),30)",
      "minimumRequestedReduction": 30,
      "reflection": "opponent-played-sophistry",
      "attack": "never-wins-in-admitted-card-set",
      "angerCounter": "excluded"
    },
    "agitate": {
      "id": "source-no-anger-agitate-reflection-v1",
      "power": 0,
      "hpDamage": 0,
      "damageJitter": false,
      "availability": "angerTimer-zero-only",
      "target": "self-unless-reflected-then-opponent",
      "requestedStress": 40,
      "reflection": "opponent-played-sophistry",
      "attack": "never-wins-in-admitted-card-set",
      "angerCounter": "excluded"
    },
    "sophistry": {
      "id": "source-no-anger-sophistry-v1",
      "power": 20,
      "availability": "angerTimer-zero-only",
      "attack": "reflect-loser-topic-only",
      "damageCalculator": "sophistry-winner-attack",
      "coefficientCard": "loser-topic-and-level",
      "damageTopic": "round-start",
      "writer": "loser-topic-card-reflected-true",
      "writerGuard": "calculated-hp-damage-positive",
      "nonTopicAttack": "no-hp-stress-or-jitter",
      "additionalEffect": "none"
    },
    "effects": {
      "id": "source-winner-then-loser-reflectable-effects-v1",
      "timing": "after-attack-before-hp-terminal",
      "auditOrder": "winner-then-loser-audit-slots",
      "tie": "no-invocations-and-empty-audit",
      "ignore": "winner-invoked-loser-suppressed",
      "noAdditionalEffect": "invoked-no-writer-request-zero",
      "suppressedRequest": "null-not-evaluated",
      "nonWriterAuditTarget": "null",
      "nonWriterAuditReflection": "null",
      "composeRequestBasis": "opponent-current-stress-before-write-not-writer-target",
      "nonComposeRequestBasis": "null",
      "stressWriter": "clamp-each-invoked-compose-or-agitate-write",
      "effectTarget": "compose-opponent-agitate-self-inverted-by-sophistry",
      "changeRequestedStress": "sum-of-evaluated-attack-and-effect-requests-by-target",
      "stageActualDelta": "after-minus-before"
    },
    "topic": {
      "id": "source-non-tutorial-sophistry-topic-reroll-v1",
      "damageTopic": "round-start",
      "nonterminalWinnerSets": [
        "firstId"
      ],
      "nonterminalTopicWinnerSets": [
        "currentTopic"
      ],
      "rhetoricWithoutRerollKeeps": [
        "currentTopic"
      ],
      "drawKeeps": [
        "firstId",
        "currentTopic"
      ],
      "rerollCondition": "nonterminal-valid-attacker-either-played-sophistry-opponent-not-ignore",
      "losingSophistryAgainstShoutRerolls": true,
      "sameTopicAllowed": true,
      "drawRole": "sophistry-topic-reroll",
      "drawBound": 3,
      "valueToTopic": [
        "story",
        "logic",
        "trend"
      ],
      "enumSource": "pinned-modern-DebateEnum.cs-Topic",
      "phase": "after-hp-closing-anger-boundary-and-crumble-before-refill",
      "terminalReroll": false
    },
    "arithmetic": {
      "id": "source-normal-integer-topic-shout-sophistry-damage-v1",
      "attack": "100+trunc(40*(myINT-opponentINT)/(131-myINT))",
      "hpDamage": "trunc((attack+jitter)*10*levelCoef*topicCoef/1000)",
      "division": "toward-zero",
      "intermediate": "exact-bigint",
      "matchingTopicCoefficient": 10,
      "nonmatchingTopicCoefficient": 6,
      "angerCoefficient": 10,
      "jitterBound": 5,
      "nativePrng": false
    },
    "writer": {
      "id": "source-hp-minus100-to1000-stress0-to100-v1",
      "hpMin": -100,
      "hpMax": 1000,
      "stressMin": 0,
      "stressMax": 100
    },
    "anger": {
      "id": "reject-nonterminal-anger-trigger-v1",
      "triggerStress": 100,
      "evaluation": "after-attack-and-additional-effects-and-hp-terminal-check-before-topic-reroll",
      "rejection": "whole-round-atomic",
      "automaticCounterCards": "excluded",
      "cap99": false,
      "reset": false,
      "skip": false
    }
  },
  "identities": {
    "id": "generic-identity-debate-hooks-v1",
    "realPersonMapping": false,
    "allPersonHooks": "identity-or-disabled",
    "attackHook": "identity",
    "hpDamageHook": "identity",
    "difficulty": "source-normal",
    "items": false,
    "personality": false
  },
  "initialTopic": {
    "id": "provided-initial-topic-v1",
    "generated": false
  },
  "deal": {
    "id": "provided-current-deck18-source-fill-v1",
    "entriesPerParticipant": 18,
    "initialCursor": 0,
    "numericCards": [
      1,
      14
    ],
    "token": "participantId:tapeIndex",
    "repairPreservesToken": true,
    "shuffle": false,
    "nativeDistribution": false,
    "deckRegeneration": "unsupported-deck-regeneration",
    "kernel": "debate-hand-fill-reference-v1"
  },
  "hand": {
    "id": "source-numeric-sort-and-compacting-removal-v1",
    "intelligenceThresholds": [
      70,
      80,
      90
    ],
    "sourceSlotCounts": [
      4,
      5,
      6,
      7
    ],
    "playableCapacities": [
      3,
      4,
      5,
      6
    ],
    "reservedRethinkSlot": 0,
    "snapshotHand": "playable-occurrences-only-source-slot-index-plus-one",
    "selectionRemoval": "compact-retained-in-source-order-then-trailing-vacancies",
    "sort": "numeric-card-code-ascending",
    "equalCodeTie": "preSortSlot-engine-policy-not-native-identity",
    "repairTarget": "last-new-original-source-slot"
  },
  "round": {
    "id": "paired-choice-filled-precombat-atomic-round-v1",
    "action": "ResolveFilledDebateRound",
    "choicesOrder": "scenario-participant-order",
    "precombatOrder": "first-rethink-selection-then-other-rethink-selection",
    "resolutionOrder": "attack-winner-effect-loser-effect-hp-anger-crumble-topic-refill",
    "interactivePhasePersistence": false
  },
  "rethink": {
    "id": "current-deck-rethink-with-fill-repair-v1",
    "maxRequestsPerRound": 2,
    "initiallyAvailable": true,
    "availabilityAfterUse": false,
    "availabilityCheck": "all-requested-before-any-replacement",
    "discard": "entire-playable-hand",
    "auditOrder": "source-first-then-other-among-requested",
    "finalSelection": "replacement-token-for-requester-current-token-otherwise",
    "reenable": "nonterminal-crumble-level-change-at-folded-TurnStart",
    "ordinaryRoundReset": false,
    "terminalReset": false
  },
  "fill": {
    "id": "shipped-kernel-integrated-at-three-phases-v1",
    "phases": [
      "genesis",
      "rethink",
      "refill"
    ],
    "genesisOrder": "scenario-participant-order",
    "refillOrder": "scenario-participant-order",
    "kernelReceipt": "complete-unchanged-recomputed",
    "retainedIdentity": "beforeCards-by-preSortSlot",
    "newIdentity": "participantId-and-consumed-tapeIndex",
    "repairChanges": "card-face-only-no-extra-tape-consumption"
  },
  "randomness": {
    "id": "provided-participant-phased-draws-v1",
    "maxGenesisDraws": 2,
    "maxDrawsPerRound": 6,
    "countBound": "conservative-sum-of-phase-maxima",
    "order": [
      "first-rethink-repair",
      "other-rethink-repair",
      "psychological-damage-jitter",
      "sophistry-topic-reroll",
      "participant0-refill-repair",
      "participant1-refill-repair"
    ],
    "repairRole": "debate-fill-topic-repair",
    "repairBound": 9,
    "repairIdentity": [
      "participantId",
      "phase"
    ],
    "validation": "safe-syntax-first-semantics-at-consumption-phase",
    "extra": "whole-operation-atomic-rejection-after-last-reached-phase",
    "externalRngConsumed": 0,
    "nativePrng": false
  },
  "closing": {
    "id": "filled-session-hp-only-closing-v1",
    "terminalEffects": true,
    "terminalRefill": false,
    "terminalTopicChange": false,
    "terminalFirstChange": false,
    "terminalRethinkReset": false,
    "campaignWrite": false
  },
  "opening": {
    "initialHp": 1000,
    "initialStress": 0,
    "initialAngerTimer": 0,
    "instantWin": "excluded"
  },
  "capacity": {
    "id": "bounded-filled-session-reject-v1",
    "maxEntries": 64,
    "deckEntriesPerParticipant": 18,
    "maxCanonicalUtf8Bytes": 16777216,
    "maxInputNodes": 1000000,
    "maxInputDepth": 32,
    "maxInputArrayLength": 4096,
    "exhaustion": "rejection-not-game-draw"
  },
  "persistence": {
    "id": "full-filled-genesis-and-history-recompute-v1",
    "policyComparison": "all-fields",
    "genesis": "scenario-snapshot-fills-consumedDraws-recompute",
    "receipts": "compare-all-fields",
    "snapshot": "compare-all-fields",
    "legacyMigration": false
  }
} as const;
type Policy = typeof POLICY;
const EVIDENCE = {
  "sourceIdentity": "modern-CSharp-translation-not-native-or-Vanilla",
  "sourceCommit": "a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef",
  "debateBlob": "0137498d10773cd4596d497083ccdf6a26b3a261",
  "debatePhaseBlob": "6aa98f855a5d4d172cde7e8ffc18a141b8a7b587",
  "debateEnumBlob": "5b46a8ac87613193eb9f4b99a25e489ba6f5e483",
  "formulaEvidence": "existing-E15-generic-ordinary-core-only",
  "combatEvidence": "shared-PR110-normal-non-tutorial-generic-six-kind-core",
  "fillEvidence": "PR111-shipped-CharacterFillCards-kernel",
  "fillIntegration": "genesis-rethink-nonterminal-next-turn-fill",
  "removalEvidence": "Debate.cs-453-465-compact-retained-source-order",
  "initializationOrder": "Debate.cs-1549-1552-team0-then-team1",
  "rethinkOrder": "DebatePhase.cs-174-246-first-then-other",
  "refillOrder": "Debate.cs-1046-1079-team0-then-team1",
  "repairTokenIdentity": "engine-audit-policy-preserves-consumed-tape-token",
  "equalCardIdentityOrder": "engine-preSortSlot-policy-not-source-Array.Sort-identity",
  "rawDrawStream": "provided-in-source-phase-order-not-native-PRNG",
  "rethinkAvailability": "modern-controlled-UI-admission-not-native-unconditional-guard",
  "legacyProfiles": "all-seven-behavior-and-saves-unchanged-rethink-core-extraction-only",
  "nativeEquivalent": false,
  "stockOriginalVerified": false,
  "pkEquivalent": false,
  "vanillaEquivalent": false,
  "completeDebate": false,
  "originalUnresolvedGroups": 43,
  "originalHistoricalSnapshots": 45,
  "nativeWholeChain": "open",
  "deckRegeneration": "excluded",
  "initialTopicGeneration": "excluded",
  "angerPersonality": "excluded",
  "tutorial": "excluded",
  "realPersonsAndItems": "excluded",
  "closingConsequences": "excluded",
  "p078": "excluded"
} as const;
type Evidence = typeof EVIDENCE;
type FillPhase = 'genesis' | 'rethink' | 'refill';
type RepairDraw = { role: 'debate-fill-topic-repair'; bound: 9; value: number; participantId: string; phase: FillPhase };
type CombatDraw = { role: 'psychological-damage-jitter'; bound: 5; value: number } | { role: 'sophistry-topic-reroll'; bound: 3; value: number };
type RawDraw = RepairDraw | CombatDraw;
type Participant = { id: string; resolvedIntelligence: number; hp: 1000; stress: 0; angerTimer: 0; cardTape: CardCode[] };
type Scenario = { schemaVersion: 1; profile: typeof PROFILE; genericOnly: true; difficulty: 'source-normal'; policies: Policy; challengerId: string; initialTopic: Topic; participants: Pair<Participant>; genesisRawDraws: RawDraw[] };
type ParticipantState = { id: string; resolvedIntelligence: number; attack: number; hp: number; stress: number; angerTimer: 0; sourceSlotCount: number; playableHandCapacity: number; reservedRethinkSlot: true; canRethink: boolean; crumbledLevel: number; hand: Occurrence[]; deckCursor: number };
type Snapshot = { schemaVersion: 1; profile: typeof PROFILE; revision: number; roundIndex: number; currentTopic: Topic; firstId: string; status: 'active' | 'finished'; outcome: Outcome | null; participants: Pair<ParticipantState> };
type Selection = { participantId: string; cardToken: string };
type Command = { type: 'ResolveFilledDebateRound'; expectedRevision: number; expectedRoundIndex: number; expectedFirstId: string; rethinks: string[]; choices: Pair<Selection>; rawDraws: RawDraw[] };
/** Applied kernel.repair.drawIndex is local zero; drawIndex here locates the global supplied stream. */
type Fill = { sequence: number; phase: FillPhase; participantId: string; drawIndex: number | null; beforeCards: Occurrence[]; afterCards: Occurrence[]; drawnCards: Occurrence[]; kernel: DebateHandFillReceiptV1 };
type Rethink = { sequence: 0 | 1; participantId: string; discardedCards: Occurrence[]; replacementCards: Occurrence[]; beforeDeckCursor: number; afterDeckCursor: number; beforeCanRethink: true; afterCanRethink: false; fillSequence: number };
type StressStage = { beforeStress: number; requestedStress: number; afterStress: number; actualStressDelta: number };
type Change = { participantId: string; beforeHp: number; afterHp: number; requestedHpDamage: number; actualHpDelta: number; beforeStress: number; afterStress: number; requestedStress: number; actualStressDelta: number; attackStress: StressStage; effectStress: StressStage; beforeCanRethink: boolean; afterCanRethink: boolean; rethinkRefreshReason: 'crumble-level-changed' | 'no-crumble-change' | 'terminal-no-next-turn'; beforeCrumbledLevel: number; afterCrumbledLevel: number; consumedCard: Occurrence; refilledCards: Occurrence[]; beforeDeckCursor: number; afterDeckCursor: number };
type TopicReroll =
  { status: 'applied'; drawIndex: number; rawValue: number; beforeTopic: Topic; afterTopic: Topic; sophistryOwnerId: string; opponentId: string } |
  { status: 'skipped'; reason: 'terminal' | 'equal-card-power' | 'no-sophistry' | 'opponent-ignore' };
type Receipt = {
  schemaVersion: 1; profile: typeof PROFILE; command: Command; policy: Policy; evidence: Evidence;
  beforeRevision: number; afterRevision: number; beforeRoundIndex: number; afterRoundIndex: number; beforeFirstId: string; afterFirstId: string; beforeTopic: Topic; afterTopic: Topic;
  orderedIds: Pair<string>; rethinks: Rethink[]; fills: Fill[]; plays: Pair<Play>; result: 'winner' | 'draw'; roundWinnerId: string | null;
  damage: Damage | null; effects: Effect[]; effectOrder: OldReceipt['effectOrder']; effectSkipReason: OldReceipt['effectSkipReason'];
  changes: Pair<Change>; consumedDraws: RawDraw[]; attackDrawCount: 0 | 1; attackNoDrawReason: OldReceipt['attackNoDrawReason']; topicDrawCount: 0 | 1; fillDrawCount: number; drawCount: number; topicReroll: TopicReroll;
  terminal: boolean; crumbleEvaluated: boolean; refillApplied: boolean; outcome: Outcome | null;
};
type Entry = { command: Command; receipt: Receipt };
type Genesis = { scenario: Scenario; snapshot: Snapshot; fills: Fill[]; consumedDraws: RawDraw[] };
type Session = { tag: typeof TAG; policy: Policy; evidence: Evidence; genesis: Genesis; snapshot: Snapshot; entries: Entry[] };
type Failure = { ok: false; reason: string; index: number | null };
type SessionResult = { ok: true; session: Session } | Failure;
type ExecuteResult = { ok: true; session: Session; receipt: Receipt } | Failure;
type PreviewResult = { ok: true; preview: { receipt: Receipt; projectedSnapshot: Snapshot; policy: Policy; evidence: Evidence; externalRngConsumed: 0 } } | Failure;
type SaveResult = { ok: true; json: string } | Failure;
type InspectionResult = { ok: true; inspection: { snapshot: Snapshot; policy: Policy; evidence: Evidence; entryCount: number; remainingEntryCapacity: number; canonicalUtf8Bytes: number } } | Failure;
export type FilledDebateTopicV1 = Topic;
export type FilledDebateCardCodeV1 = CardCode;
export type FilledDebateCardOccurrenceV1 = Frozen<Occurrence>;
export type FilledDebateParticipantV1 = Frozen<Participant>;
export type FilledDebateParticipantStateV1 = Frozen<ParticipantState>;
export type FilledDebateScenarioV1 = Frozen<Scenario>;
export type FilledDebateSnapshotV1 = Frozen<Snapshot>;
export type FilledDebateCommandV1 = Frozen<Command>;
export type FilledDebateFillPhaseV1 = FillPhase;
export type FilledDebateRepairDrawV1 = Frozen<RepairDraw>;
export type FilledDebateRawDrawV1 = Frozen<RawDraw>;
export type FilledDebateSelectionV1 = Frozen<Selection>;
export type FilledDebateFillV1 = Frozen<Fill>;
export type FilledDebateRethinkV1 = Frozen<Rethink>;
export type FilledDebatePlayV1 = Frozen<Play>;
export type FilledDebateStressStageV1 = Frozen<StressStage>;
export type FilledDebateEffectV1 = Frozen<Effect>;
export type FilledDebateChangeV1 = Frozen<Change>;
export type FilledDebateDamageV1 = Frozen<Damage>;
export type FilledDebateTopicRerollV1 = Frozen<TopicReroll>;
export type FilledDebateOutcomeV1 = Frozen<Outcome>;
export type FilledDebateEntryV1 = Frozen<Entry>;
export type FilledDebateGenesisV1 = Frozen<Genesis>;
export type FilledDebateSessionV1 = Frozen<Session>;
export type FilledDebatePolicyV1 = Frozen<Policy>;
export type FilledDebateEvidenceV1 = Frozen<Evidence>;
export type FilledDebateReceiptV1 = Frozen<Receipt>;
export type FilledDebateFailureV1 = Frozen<Failure>;
export type FilledDebateSessionResultV1 = Frozen<SessionResult>;
export type FilledDebateExecuteResultV1 = Frozen<ExecuteResult>;
export type FilledDebatePreviewResultV1 = Frozen<PreviewResult>;
export type FilledDebateSaveResultV1 = Frozen<SaveResult>;
export type FilledDebateInspectionResultV1 = Frozen<InspectionResult>;
export type FilledDebateReplayResultV1 = Frozen<SessionResult>;

class Invalid extends Error { readonly reason: string; readonly index: number | null; constructor(reason: string, index: number | null = null) { super(reason); this.reason = reason; this.index = index; } }
function fail(reason: string, index: number | null = null): never { throw new Invalid(reason, index); }
function failure(e: unknown): Failure { return { ok: false, reason: e instanceof Invalid ? e.reason : 'malformed-data', index: e instanceof Invalid ? e.index : null }; }
function freeze<T>(v: T): Frozen<T> { if (v !== null && typeof v === 'object' && !Object.isFrozen(v)) { for (const x of Object.values(v)) freeze(x); Object.freeze(v); } return v as Frozen<T>; }
function clone<T>(v: T): T { return JSON.parse(JSON.stringify(v)) as T; }
function canonical(v: unknown): string { if (v === null || typeof v !== 'object') return JSON.stringify(v); if (Array.isArray(v)) return '[' + v.map(canonical).join(',') + ']'; const r = v as Record<string, unknown>; return '{' + Object.keys(r).sort().map(k => JSON.stringify(k) + ':' + canonical(r[k])).join(',') + '}'; }
function utf8Bytes(s: string): number { let n = 0; for (const c of s) { const cp = c.codePointAt(0)!; n += cp <= 0x7f ? 1 : cp <= 0x7ff ? 2 : cp <= 0xffff ? 3 : 4; } return n; }
function budget(v: unknown): number {
  // Internal values have already been detached/generated. Match detach's structural budget too.
  let nodes = 0;
  function visit(x: unknown, depth: number): void {
    if (++nodes > POLICY.capacity.maxInputNodes || depth > POLICY.capacity.maxInputDepth) fail('history-limit');
    if (x !== null && typeof x === 'object') {
      if (Array.isArray(x) && x.length > MAX_ARRAY) fail('history-limit');
      for (const child of Object.values(x)) visit(child, depth + 1);
    }
  }
  visit(v, 0); const n = utf8Bytes(canonical(v)); if (n > MAX_BYTES) fail('history-limit'); return n;
}
function same(a: unknown, b: unknown): boolean { return canonical(a) === canonical(b); }
const runtime = globalThis as { process?: { getBuiltinModule?: (id: string) => { types: { isProxy(v: unknown): boolean } } } };
const proxyDetector = typeof runtime.process?.getBuiltinModule === 'function' ? runtime.process.getBuiltinModule('node:util').types.isProxy : null;
/** No getters, proxy traps, toJSON hooks or custom iterators are invoked on caller objects. */
type InputBudget = { count: number; bytes: number };
function detach(value: unknown, indexedRootArray = false, shared: InputBudget = { count: 0, bytes: 0 }, initialDepth = 0): unknown {
  if (!proxyDetector) fail('unsupported-runtime');
  const active = new Set<object>();
  function visit(v: unknown, depth: number, indexedArray = false): unknown {
    if (++shared.count > POLICY.capacity.maxInputNodes || depth > POLICY.capacity.maxInputDepth) fail('history-limit');
    if (v === null || typeof v === 'boolean') return v;
    if (typeof v === 'string') { shared.bytes += utf8Bytes(v); if (shared.bytes > MAX_BYTES) fail('history-limit'); return v; }
    if (typeof v === 'number') { if (!Number.isSafeInteger(v) || Object.is(v, -0)) fail('malformed-data'); return v; }
    if (typeof v !== 'object' || proxyDetector!(v) || active.has(v)) fail('malformed-data');
    const isArray = Array.isArray(v), proto = Object.getPrototypeOf(v);
    if (proto !== (isArray ? Array.prototype : Object.prototype) && !(proto === null && !isArray)) fail('malformed-data');
    const descriptors = Object.getOwnPropertyDescriptors(v as object), keys = Reflect.ownKeys(descriptors);
    if (keys.some(k => typeof k !== 'string' || !Object.hasOwn(descriptors[k]!, 'value') || (!descriptors[k]!.enumerable && !(isArray && k === 'length')))) fail('malformed-data');
    active.add(v);
    try {
      if (isArray) {
        const n = descriptors.length!.value as number;
        if (n > MAX_ARRAY) fail('history-limit');
        if (keys.length !== n + 1) fail('malformed-data');
        const a: unknown[] = [];
        for (let i = 0; i < n; i++) {
          try { const d = descriptors[String(i)]; if (!d) fail('malformed-data'); a.push(visit(d.value, depth + 1)); }
          catch (e) { if (indexedArray) fail(failure(e).reason, i); throw e; }
        }
        return a;
      }
      const r: Record<string, unknown> = {};
      for (const k of keys as string[]) { shared.bytes += utf8Bytes(k); if (shared.bytes > MAX_BYTES) fail('history-limit'); Object.defineProperty(r, k, { value: visit(descriptors[k]!.value, depth + 1, depth === initialDepth && k === 'entries'), enumerable: true, configurable: true, writable: true }); }
      return r;
    } finally { active.delete(v); }
  }
  const result = visit(value, initialDepth, indexedRootArray); budget(result); return result;
}
function object(v: unknown, keys: readonly string[]): Record<string, unknown> {
  if (v === null || typeof v !== 'object' || Array.isArray(v)) fail('malformed-data');
  const r = v as Record<string, unknown>, unknown = Object.keys(r).filter(k => !keys.includes(k));
  if (unknown.some(k => ['personId', 'person', 'personHooks', 'characterId'].includes(k))) fail('unsupported-person');
  if (unknown.some(k => ['items', 'item', 'equipment', 'weapon', 'sword'].includes(k))) fail('unsupported-item');
  if (unknown.length) fail('unknown-field');
  if (keys.some(k => !Object.hasOwn(r, k))) fail('malformed-data'); return r;
}
function integer(v: unknown, max: number, min = 0, reason = 'malformed-data'): number { if (typeof v !== 'number' || !Number.isSafeInteger(v) || Object.is(v, -0) || v < min || v > max) fail(reason); return v; }
function choice<T extends string>(v: unknown, choices: readonly T[], reason: string): T { if (!choices.includes(v as T)) fail(reason); return v as T; }
function array(v: unknown, max: number): unknown[] { if (!Array.isArray(v)) fail('malformed-data'); if (v.length > max) fail('history-limit'); return v; }
function pair<T>(v: unknown, parse: (v: unknown) => T): Pair<T> { if (!Array.isArray(v) || v.length !== 2) fail('malformed-data'); return [parse(v[0]), parse(v[1])]; }
function id(v: unknown): string { if (typeof v !== 'string' || !/^[A-Za-z][A-Za-z0-9_-]{0,63}$/.test(v)) fail('unsupported-person'); return v; }
function topic(v: unknown): Topic { return choice(v, ['story', 'logic', 'trend'], 'unsupported-card'); }
function cardCode(value: unknown): CardCode { return integer(value, 14, 1, 'unsupported-card-code') as CardCode; }
function participant(value: unknown): Participant {
  const r = object(value, ['id', 'resolvedIntelligence', 'hp', 'stress', 'angerTimer', 'cardTape']);
  if (r.hp !== 1000 || r.stress !== 0 || r.angerTimer !== 0) fail('unsupported-initial-state');
  if (!Array.isArray(r.cardTape) || r.cardTape.length !== 18) fail('invalid-card-tape');
  return { id: id(r.id), resolvedIntelligence: integer(r.resolvedIntelligence, 100, 1), hp: 1000, stress: 0, angerTimer: 0, cardTape: r.cardTape.map(cardCode) };
}
/** Only syntax here. Role, bound, value, participant and phase are checked when consumed. */
function rawDraw(value: unknown): RawDraw {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) fail('malformed-data');
  const repair = (value as Record<string, unknown>).role === 'debate-fill-topic-repair';
  const r = object(value, repair ? ['role', 'bound', 'value', 'participantId', 'phase'] : ['role', 'bound', 'value']);
  if (typeof r.role !== 'string' || typeof r.bound !== 'number' || typeof r.value !== 'number') fail('malformed-data');
  if (repair) {
    if (typeof r.participantId !== 'string' || typeof r.phase !== 'string') fail('malformed-data');
    return { role: r.role, bound: r.bound, value: r.value, participantId: r.participantId, phase: r.phase } as RepairDraw;
  }
  return { role: r.role, bound: r.bound, value: r.value } as CombatDraw;
}
function parseScenario(value: unknown): Scenario {
  const r = object(value, ['schemaVersion', 'profile', 'genericOnly', 'difficulty', 'policies', 'challengerId', 'initialTopic', 'participants', 'genesisRawDraws']);
  if (r.schemaVersion !== 1 || r.profile !== PROFILE || r.difficulty !== 'source-normal') fail('unsupported-profile');
  if (r.genericOnly !== true) fail('unsupported-person');
  if (!same(r.policies, POLICY)) fail('unsupported-policy');
  const participants = pair(r.participants, participant), challengerId = id(r.challengerId);
  if (participants[0].id === participants[1].id) fail('duplicate-participant');
  if (!participants.some(p => p.id === challengerId)) fail('invalid-challenger');
  if (!Array.isArray(r.genesisRawDraws) || r.genesisRawDraws.length > POLICY.randomness.maxGenesisDraws) fail('draw-shape');
  return { schemaVersion: 1, profile: PROFILE, genericOnly: true, difficulty: 'source-normal', policies: clone(POLICY), challengerId, initialTopic: topic(r.initialTopic), participants, genesisRawDraws: r.genesisRawDraws.map(rawDraw) };
}
function parseCommand(value: unknown): Command {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) fail('malformed-data');
  if ((value as Record<string, unknown>).type !== 'ResolveFilledDebateRound') fail('unsupported-action');
  const r = object(value, ['type', 'expectedRevision', 'expectedRoundIndex', 'expectedFirstId', 'rethinks', 'choices', 'rawDraws']);
  if (!Array.isArray(r.rethinks) || r.rethinks.length > POLICY.rethink.maxRequestsPerRound) fail('malformed-data');
  const rethinks = r.rethinks.map(id);
  if (new Set(rethinks).size !== rethinks.length) fail('duplicate-rethink-participant');
  const choices = pair(r.choices, value => {
    const selection = object(value, ['participantId', 'cardToken']);
    if (typeof selection.cardToken !== 'string' || !/^[A-Za-z][A-Za-z0-9_-]{0,63}:(0|[1-9][0-9]?)$/.test(selection.cardToken)) fail('invalid-token');
    return { participantId: id(selection.participantId), cardToken: selection.cardToken };
  });
  if (choices[0].cardToken === choices[1].cardToken) fail('duplicate-token');
  if (choices[0].participantId === choices[1].participantId) fail('duplicate-participant');
  if (!Array.isArray(r.rawDraws) || r.rawDraws.length > POLICY.randomness.maxDrawsPerRound) fail('draw-shape');
  return { type: 'ResolveFilledDebateRound', expectedRevision: integer(r.expectedRevision, MAX_ENTRIES), expectedRoundIndex: integer(r.expectedRoundIndex, MAX_ENTRIES), expectedFirstId: id(r.expectedFirstId), rethinks, choices, rawDraws: r.rawDraws.map(rawDraw) };
}
function div(n: bigint, d: bigint): number { return Number(n / d); }
function handCapacity(intelligence: number): number { return intelligence < 70 ? 3 : intelligence < 80 ? 4 : intelligence < 90 ? 5 : 6; }
/** Numeric source enum is the sole card face; semantic combat objects are derived. */
function decode(code: CardCode): Card {
  if (code <= 9) {
    const topics = ['story', 'logic', 'trend'] as const, levels = ['small', 'medium', 'large'] as const;
    return { kind: 'topic', topic: topics[Math.floor((code - 1) / 3)]!, level: levels[(code - 1) % 3]! };
  }
  switch (code) {
    case 10: return { kind: 'shout' };
    case 11: return { kind: 'sophistry' };
    case 12: return { kind: 'ignore' };
    case 13: return { kind: 'compose' };
    case 14: return { kind: 'agitate' };
    default: return fail('unsupported-card-code');
  }
}
type DrawCursor = { supplied: RawDraw[]; consumed: RawDraw[] };
/**
 * The kernel alone decides whether repair is needed. Its pure empty-draw probe
 * cannot consume external state; only missing-raw-draw permits a singleton retry.
 * Source removal compacts survivors, so current occurrences occupy slots 1..n
 * and all remaining vacancies are trailing. Numeric sorting comes from the kernel.
 */
function fillParticipant(p: ParticipantState, source: Participant, phase: FillPhase, draws: DrawCursor, fills: Fill[]): Fill {
  const beforeCards = clone(p.hand);
  const playableSlots: (CardCode | null)[] = p.hand.map(card => card.cardCode);
  while (playableSlots.length < p.playableHandCapacity) playableSlots.push(null);
  const input = { schemaVersion: 1, profile: 'debate-hand-fill-reference-v1', policies: DEBATE_HAND_FILL_POLICY_V1, playableSlots, cardTape: source.cardTape, deckCursor: p.deckCursor, rawDraws: [] as { role: 'debate-fill-topic-repair'; bound: 9; value: number }[] };
  let evaluated = evaluateDebateHandFill(input), drawIndex: number | null = null;
  if (!evaluated.ok && evaluated.reason === 'missing-raw-draw') {
    const next = draws.supplied[draws.consumed.length];
    if (!next) fail('missing-raw-draw');
    if (next.role !== 'debate-fill-topic-repair' || next.participantId !== p.id || next.phase !== phase) fail('draw-shape');
    evaluated = evaluateDebateHandFill({ ...input, rawDraws: [{ role: next.role, bound: next.bound, value: next.value }] });
    if (!evaluated.ok) fail(evaluated.reason);
    drawIndex = draws.consumed.length;
    draws.consumed.push(clone(next));
  }
  if (!evaluated.ok) fail(evaluated.reason);
  const kernel = evaluated.receipt;
  const afterCards: Occurrence[] = [];
  const byOriginalSlot = new Map<number, Occurrence>();
  for (const provenance of kernel.sortedProvenance) {
    if (provenance.origin === 'reserved-rethink') continue;
    let occurrence: Occurrence;
    if (provenance.origin === 'retained') {
      const retained = beforeCards[provenance.preSortSlot - 1];
      if (!retained || retained.cardCode !== provenance.card) fail('invalid-fill-provenance');
      occurrence = clone(retained);
    } else {
      if (provenance.tapeIndex === null || provenance.card === 0) fail('invalid-fill-provenance');
      // Repair changes the face, never the identity of the consumed deck occurrence.
      occurrence = { cardCode: provenance.card, token: `${p.id}:${provenance.tapeIndex}`, tapeIndex: provenance.tapeIndex };
    }
    afterCards.push(occurrence); byOriginalSlot.set(provenance.preSortSlot, occurrence);
  }
  const drawnCards = kernel.filled.map(filled => {
    const occurrence = byOriginalSlot.get(filled.preSortSlot);
    if (!occurrence) fail('invalid-fill-provenance');
    return clone(occurrence);
  });
  p.hand = afterCards; p.deckCursor = evaluated.deckCursor;
  const audit: Fill = { sequence: fills.length, phase, participantId: p.id, drawIndex, beforeCards, afterCards: clone(afterCards), drawnCards, kernel };
  fills.push(audit); return audit;
}
function initialParticipant(p: Participant, other: Participant): ParticipantState {
  const playableHandCapacity = handCapacity(p.resolvedIntelligence);
  return { id: p.id, resolvedIntelligence: p.resolvedIntelligence, attack: 100 + div(40n * BigInt(p.resolvedIntelligence - other.resolvedIntelligence), BigInt(131 - p.resolvedIntelligence)), hp: 1000, stress: 0, angerTimer: 0, sourceSlotCount: playableHandCapacity + 1, playableHandCapacity, reservedRethinkSlot: true, canRethink: true, crumbledLevel: 0, hand: [], deckCursor: 0 };
}
function initialSession(scenario: Scenario): Session {
  const participants: Pair<ParticipantState> = [initialParticipant(scenario.participants[0], scenario.participants[1]), initialParticipant(scenario.participants[1], scenario.participants[0])];
  const draws: DrawCursor = { supplied: scenario.genesisRawDraws, consumed: [] }, fills: Fill[] = [];
  for (const i of [0, 1] as const) fillParticipant(participants[i], scenario.participants[i], 'genesis', draws, fills);
  if (draws.consumed.length !== draws.supplied.length) fail('unexpected-raw-draw');
  const snapshot: Snapshot = { schemaVersion: 1, profile: PROFILE, revision: 0, roundIndex: 0, currentTopic: scenario.initialTopic, firstId: scenario.challengerId, status: 'active', outcome: null, participants };
  return { tag: TAG, policy: clone(POLICY), evidence: clone(EVIDENCE), genesis: { scenario: clone(scenario), snapshot: clone(snapshot), fills, consumedDraws: draws.consumed }, snapshot, entries: [] };
}
/** Pure atomic round; rejected later phases never commit earlier fill/repair effects. */
function resolve(s: Snapshot, scenario: Scenario, c: Command): { snapshot: Snapshot; receipt: Receipt } {
  if (s.status === 'finished') fail('session-finished');
  if (c.expectedRevision !== s.revision) fail('stale-revision');
  if (c.expectedRoundIndex !== s.roundIndex) fail('stale-round');
  if (c.expectedFirstId !== s.firstId) fail('stale-first');
  let participants = clone(s.participants);
  const rethinks: Rethink[] = [], fills: Fill[] = [];
  const draws: DrawCursor = { supplied: c.rawDraws, consumed: [] };
  for (const participantId of c.rethinks) {
    const participant = participants.find(p => p.id === participantId);
    if (!participant) fail('invalid-rethink-participant');
    if (!participant.canRethink) fail('rethink-unavailable');
  }
  for (const i of [0, 1] as const) if (c.choices[i].participantId !== participants[i].id) fail('invalid-choice-order');
  const selectedCards: Pair<Occurrence | null> = [null, null];
  function select(i: 0 | 1): Play {
    const p = participants[i], selected = c.choices[i];
    if (c.rethinks.includes(p.id)) {
      const discardedCards = clone(p.hand), beforeDeckCursor = p.deckCursor;
      p.hand = [];
      const fill = fillParticipant(p, scenario.participants[i], 'rethink', draws, fills);
      p.canRethink = false;
      const sequence: 0 | 1 = rethinks.length === 0 ? 0 : 1;
      rethinks.push({ sequence, participantId: p.id, discardedCards, replacementCards: clone(p.hand), beforeDeckCursor, afterDeckCursor: p.deckCursor, beforeCanRethink: true, afterCanRethink: false, fillSequence: fill.sequence });
    }
    const occurrence = p.hand.find(card => card.token === selected.cardToken);
    if (!occurrence) fail('not-in-hand');
    selectedCards[i] = clone(occurrence);
    const selectedCard = { ...decode(occurrence.cardCode), token: occurrence.token, tapeIndex: occurrence.tapeIndex };
    const matchesCurrentTopic = selectedCard.kind === 'topic' && selectedCard.topic === s.currentTopic;
    const power = selectedCard.kind === 'ignore' ? POLICY.combat.ignore.power : selectedCard.kind === 'shout' ? POLICY.combat.shout.power : selectedCard.kind === 'sophistry' ? POLICY.combat.sophistry.power : selectedCard.kind === 'compose' ? POLICY.combat.compose.power : selectedCard.kind === 'agitate' ? POLICY.combat.agitate.power : 1 + (selectedCard.level === 'small' ? 0 : selectedCard.level === 'medium' ? 1 : 2) + (matchesCurrentTopic ? 10 : 0);
    // Debate.cs CharacterRemoveCard compacts survivors; do not leave an interior hole.
    p.hand = p.hand.filter(card => card.token !== occurrence.token);
    return { participantId: p.id, card: selectedCard, attack: p.attack, power, matchesCurrentTopic };
  }
  const firstIndex: 0 | 1 = s.firstId === participants[0].id ? 0 : 1, otherIndex = firstIndex === 0 ? 1 : 0;
  const firstPlay = select(firstIndex), otherPlay = select(otherIndex);
  const plays: Pair<Play> = firstIndex === 0 ? [firstPlay, otherPlay] : [otherPlay, firstPlay];
  const combatDrawOffset = draws.consumed.length;
  const combat = resolveNormalDebateRound(s, participants, plays, c.rawDraws.slice(combatDrawOffset), POLICY.combat);
  if (!combat.ok) fail(combat.reason);
  participants = combat.participants;
  draws.consumed.push(...combat.consumedDraws);
  const { winner, requestedDamage, requestedAttackStress, requestedEffectStress, damage,
    afterAttackStress, effects, effectOrder, effectSkipReason, outcome, currentTopic, firstId,
    attackDrawCount, attackNoDrawReason } = combat;
  const topicReroll: TopicReroll = combat.topicReroll.status === 'applied'
    ? { ...combat.topicReroll, drawIndex: combatDrawOffset + combat.topicReroll.drawIndex }
    : combat.topicReroll;
  const refilled: Pair<Occurrence[]> = [[], []];
  if (outcome === null) {
    // Source TurnStart performs team 0 then team 1, independently of firstId.
    for (const i of [0, 1] as const) {
      if (participants[i].crumbledLevel !== s.participants[i].crumbledLevel) participants[i].canRethink = true;
      refilled[i] = fillParticipant(participants[i], scenario.participants[i], 'refill', draws, fills).drawnCards;
    }
  }
  // Only reached phases may consume. Terminal rounds still keep earlier rethink repairs.
  if (draws.consumed.length !== draws.supplied.length) fail('unexpected-raw-draw');
  const snapshot: Snapshot = { schemaVersion: 1, profile: PROFILE, revision: s.revision + 1, roundIndex: s.roundIndex + 1, currentTopic, firstId, status: outcome === null ? 'active' : 'finished', outcome, participants };
  function change(i: 0 | 1): Change {
    const before = s.participants[i], after = participants[i], consumedCard = selectedCards[i];
    if (!consumedCard) fail('not-in-hand');
    const attackStress: StressStage = { beforeStress: before.stress, requestedStress: requestedAttackStress[i], afterStress: afterAttackStress[i], actualStressDelta: afterAttackStress[i] - before.stress };
    const effectStress: StressStage = { beforeStress: afterAttackStress[i], requestedStress: requestedEffectStress[i], afterStress: after.stress, actualStressDelta: after.stress - afterAttackStress[i] };
    const rethinkRefreshReason: Change['rethinkRefreshReason'] = outcome !== null ? 'terminal-no-next-turn' : before.crumbledLevel !== after.crumbledLevel ? 'crumble-level-changed' : 'no-crumble-change';
    return { participantId: before.id, beforeHp: before.hp, afterHp: after.hp, requestedHpDamage: requestedDamage[i], actualHpDelta: after.hp - before.hp, beforeStress: before.stress, afterStress: after.stress, requestedStress: attackStress.requestedStress + effectStress.requestedStress, actualStressDelta: after.stress - before.stress, attackStress, effectStress, beforeCanRethink: before.canRethink, afterCanRethink: after.canRethink, rethinkRefreshReason, beforeCrumbledLevel: before.crumbledLevel, afterCrumbledLevel: after.crumbledLevel, consumedCard, refilledCards: refilled[i], beforeDeckCursor: before.deckCursor, afterDeckCursor: after.deckCursor };
  }
  const otherId = s.participants[0].id === s.firstId ? s.participants[1].id : s.participants[0].id;
  const topicDrawCount: 0 | 1 = topicReroll.status === 'applied' ? 1 : 0;
  const receipt: Receipt = {
    schemaVersion: 1, profile: PROFILE, command: clone(c), policy: clone(POLICY), evidence: clone(EVIDENCE),
    beforeRevision: s.revision, afterRevision: snapshot.revision, beforeRoundIndex: s.roundIndex, afterRoundIndex: snapshot.roundIndex, beforeFirstId: s.firstId, afterFirstId: firstId, beforeTopic: s.currentTopic, afterTopic: currentTopic,
    orderedIds: [s.firstId, otherId], rethinks, fills, plays, result: winner === null ? 'draw' : 'winner', roundWinnerId: winner === null ? null : participants[winner].id,
    damage, effects, effectOrder, effectSkipReason, changes: [change(0), change(1)], consumedDraws: draws.consumed, attackDrawCount, attackNoDrawReason, topicDrawCount,
    fillDrawCount: fills.filter(fill => fill.drawIndex !== null).length, drawCount: draws.consumed.length, topicReroll,
    terminal: outcome !== null, crumbleEvaluated: outcome === null, refillApplied: outcome === null, outcome: clone(outcome),
  };
  return { snapshot, receipt };
}
/** Preview, execute and replay all budget this identical complete proposed envelope. */
function append(s: Session, command: Command): { session: Session; receipt: Receipt } {
  if (s.entries.length >= MAX_ENTRIES) fail('history-limit');
  const next = resolve(s.snapshot, s.genesis.scenario, command);
  const session: Session = { tag: TAG, policy: clone(POLICY), evidence: clone(EVIDENCE), genesis: s.genesis, snapshot: next.snapshot, entries: [...s.entries, { command: clone(command), receipt: next.receipt }] };
  budget(session); return { session, receipt: next.receipt };
}
function parseSession(v: unknown): Session {
  const r = object(v, ['tag', 'policy', 'evidence', 'genesis', 'snapshot', 'entries']);
  if (r.tag !== TAG) fail('unsupported-profile');
  if (!same(r.policy, POLICY)) fail('unsupported-policy'); if (!same(r.evidence, EVIDENCE)) fail('evidence-mismatch');
  const genesis = object(r.genesis, ['scenario', 'snapshot', 'fills', 'consumedDraws']);
  let session = initialSession(parseScenario(genesis.scenario));
  if (!same(genesis, session.genesis)) fail('invalid-genesis');
  const entries = array(r.entries, MAX_ENTRIES);
  for (let index = 0; index < entries.length; index++) {
    try { const entry = object(entries[index], ['command', 'receipt']), next = append(session, parseCommand(entry.command)); if (!same(entry.receipt, next.receipt)) fail('receipt-mismatch'); session = next.session; }
    catch (e) { fail(failure(e).reason, index); }
  }
  if (!same(session.snapshot, r.snapshot)) fail('snapshot-mismatch'); budget(session); return session;
}
export const FILLED_DEBATE_POLICY_V1: FilledDebatePolicyV1 = freeze(POLICY);
export const FILLED_DEBATE_EVIDENCE_V1: FilledDebateEvidenceV1 = freeze(EVIDENCE);
export function createFilledDebate(input: unknown): FilledDebateSessionResultV1 {
  try { const session = initialSession(parseScenario(detach(input))); budget(session); return freeze({ ok: true, session } as SessionResult); } catch (e) { return freeze(failure(e)); }
}
export function inspectFilledDebate(input: unknown): FilledDebateInspectionResultV1 {
  try { const s = parseSession(detach(input)); return freeze({ ok: true, inspection: { snapshot: s.snapshot, policy: s.policy, evidence: s.evidence, entryCount: s.entries.length, remainingEntryCapacity: MAX_ENTRIES - s.entries.length, canonicalUtf8Bytes: budget(s) } } as InspectionResult); } catch (e) { return freeze(failure(e)); }
}
export function previewFilledDebateRound(input: unknown, command: unknown): FilledDebatePreviewResultV1 {
  try { const s = parseSession(detach(input)), c = parseCommand(detach(command)), next = append(s, c); return freeze({ ok: true, preview: { receipt: next.receipt, projectedSnapshot: next.session.snapshot, policy: clone(POLICY), evidence: clone(EVIDENCE), externalRngConsumed: 0 } } as PreviewResult); } catch (e) { return freeze(failure(e)); }
}
export function executeFilledDebateRound(input: unknown, command: unknown): FilledDebateExecuteResultV1 {
  try { const s = parseSession(detach(input)), c = parseCommand(detach(command)), next = append(s, c); return freeze({ ok: true, ...next } as ExecuteResult); } catch (e) { return freeze(failure(e)); }
}
export function saveFilledDebate(input: unknown): FilledDebateSaveResultV1 {
  try { const s = parseSession(detach(input)); budget(s); return freeze({ ok: true, json: canonical(s) } as SaveResult); } catch (e) { return freeze(failure(e)); }
}
export function loadFilledDebate(json: unknown): FilledDebateSessionResultV1 {
  try { if (typeof json !== 'string') fail('malformed-data'); if (utf8Bytes(json) > MAX_BYTES) fail('history-limit'); return freeze({ ok: true, session: parseSession(detach(JSON.parse(json))) } as SessionResult); } catch (e) { return freeze(failure(e)); }
}
/** Safely inspect only the outer list; each element is detached at its own replay index. */
function commandList(v: unknown): { length: number; descriptors: Record<string, PropertyDescriptor> } {
  if (!proxyDetector) fail('unsupported-runtime');
  if (v === null || typeof v !== 'object' || proxyDetector(v) || !Array.isArray(v) || Object.getPrototypeOf(v) !== Array.prototype) fail('malformed-data');
  const descriptors = Object.getOwnPropertyDescriptors(v as object), keys = Reflect.ownKeys(descriptors), length = descriptors.length!.value as number;
  if (length > MAX_ENTRIES) fail('history-limit');
  if (keys.some(k => typeof k !== 'string' || (k !== 'length' && !/^(0|[1-9][0-9]*)$/.test(k)))) fail('malformed-data');
  if (keys.length !== length + 1) fail('malformed-data');
  return { length, descriptors };
}
/** Replay reports the first failed command index; -1 denotes scenario/outer-list failure. */
export function replayFilledDebate(initialScenario: unknown, commands: unknown): FilledDebateReplayResultV1 {
  let index = -1;
  try {
    let session = initialSession(parseScenario(detach(initialScenario))); budget(session);
    const requests = commandList(commands), inputBudget: InputBudget = { count: 1, bytes: 0 }; let commandBytes = 2;
    for (index = 0; index < requests.length; index++) {
      const descriptor = requests.descriptors[String(index)];
      if (!descriptor || !Object.hasOwn(descriptor, 'value') || !descriptor.enumerable) fail('malformed-data');
      const detached = detach(descriptor.value, false, inputBudget, 1);
      commandBytes += utf8Bytes(canonical(detached)) + (index === 0 ? 0 : 1);
      if (commandBytes > MAX_BYTES) fail('history-limit');
      session = append(session, parseCommand(detached)).session;
    }
    return freeze({ ok: true, session } as SessionResult);
  } catch (e) { return freeze({ ...failure(e), index }); }
}
