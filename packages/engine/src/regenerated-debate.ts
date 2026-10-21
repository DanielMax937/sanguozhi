/**
 * Bounded synthetic-checkpoint session with source-ordered deck regeneration.
 * Generic identities, normal difficulty, no tutorial/anger/DeckInit/native PRNG.
 * All eight old profiles keep their public contracts and saved histories.
 * Fill crosses generations before a single shared repair and numeric sort.
 * Static implementation only: no execution or native equivalence is claimed.
 */
import { completeDebateHandFill } from './debate-hand-fill-completion.ts';
import type { DebateFillCompletionResult } from './debate-hand-fill-completion.ts';
import type { DebateHandFillCardCodeV1 } from './debate-hand-fill.ts';
import { evaluateDebateDeckGenerate, DEBATE_DECK_GENERATE_POLICY_V1 } from './debate-deck-generate.ts';
import type { DebateDeckGenerateRhetoricCardCodeV1, DebateDeckGenerateRawDrawV1, DebateDeckGenerateReceiptV1 } from './debate-deck-generate.ts';
import { resolveNormalDebateRound } from './debate-normal-round.ts';
import type { RethinkDebateCardV1, RethinkDebatePlayV1, RethinkDebateDamageV1,
  RethinkDebateEffectV1, RethinkDebateReceiptV1, RethinkDebateOutcomeV1 } from './rethink-debate.ts';
type Frozen<T> = T extends object ? { readonly [K in keyof T]: Frozen<T[K]> } : T;
type Mutable<T> = T extends object ? { -readonly [K in keyof T]: Mutable<T[K]> } : T;
type Pair<T> = [T, T];
type Topic = 'story' | 'logic' | 'trend';
type CardCode = DebateHandFillCardCodeV1;
type RhetoricCardCode = DebateDeckGenerateRhetoricCardCodeV1;
type Card = Mutable<RethinkDebateCardV1>;
type Occurrence = { cardCode: CardCode; token: string; tapeIndex: number; deckGeneration: number };
type Play = Mutable<RethinkDebatePlayV1>;
type Damage = Mutable<RethinkDebateDamageV1>;
type Effect = Mutable<RethinkDebateEffectV1>;
type Outcome = Mutable<RethinkDebateOutcomeV1>;
type OldReceipt = Mutable<RethinkDebateReceiptV1>;
const PROFILE = 'debate-regenerated-deck-reference-v1' as const;
const TAG = 'regenerated-debate-session-v1' as const;
const MAX_ENTRIES = 16, MAX_ARRAY = 8192, MAX_BYTES = 32 * 1024 * 1024;
const POLICY = {
  "id": "regenerated-debate-deck-policy-v1",
  "profile": "debate-regenerated-deck-reference-v1",
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
    "id": "supplied-synthetic-checkpoint-with-source-regeneration-v1",
    "entriesPerParticipant": 18,
    "initialCursor": "caller-supplied-integer-zero-through-eighteen",
    "initialGeneration": 0,
    "initialGenerationMeaning": "synthetic-checkpoint-not-DeckInit-or-prior-history-authenticity",
    "numericCards": [
      1,
      14
    ],
    "rhetoricCards": "active-ordered-unique-subset-of-ten-through-fourteen",
    "rhetoricCount": [
      0,
      5
    ],
    "token": "participantId:deckGeneration:tapeIndex",
    "repairPreservesToken": true,
    "nativeDistribution": false,
    "deckRegeneration": "on-next-vacancy-only-when-current-cursor-eighteen",
    "generationKernel": "debate-deck-generate-reference-v1",
    "cursorReset": "after-successful-generation-before-consuming-new-card",
    "generationIncrement": "exactly-once-per-successful-regeneration",
    "mutatedRhetoricPool": "complete-order-persists-including-unused-fifth-entry"
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
    "id": "paired-choice-regenerated-precombat-atomic-round-v1",
    "action": "ResolveRegeneratedDebateRound",
    "choicesOrder": "scenario-participant-order",
    "precombatOrder": "first-rethink-selection-then-other-rethink-selection",
    "resolutionOrder": "attack-winner-effect-loser-effect-hp-anger-crumble-topic-refill",
    "interactivePhasePersistence": false
  },
  "rethink": {
    "id": "current-or-regenerated-deck-rethink-with-single-fill-repair-v1",
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
    "id": "source-regeneration-fill-then-single-shared-completion-v1",
    "phases": [
      "genesis",
      "rethink",
      "refill"
    ],
    "genesisOrder": "scenario-participant-order",
    "refillOrder": "scenario-participant-order",
    "completion": "shared-completeDebateHandFill-after-all-vacancies-not-per-deck-segment",
    "generationReceipt": "complete-unchanged-DeckGenerate-receipt-with-global-half-open-draw-range",
    "fillReceipt": "actual-mixed-generation-slots-not-projected-current-deck-kernel-receipt",
    "retainedIdentity": "beforeCards-by-preSortSlot",
    "newIdentity": "participantId-deckGeneration-consumed-tapeIndex",
    "repairChanges": "card-face-only-no-extra-deck-consumption",
    "repairTiming": "after-all-generation-and-slot-consumption-before-one-numeric-sort",
    "maxRegenerationsPerGenesis": 2,
    "maxRegenerationsPerRound": 2
  },
  "randomness": {
    "id": "provided-participant-phased-generation-and-repair-draws-v1",
    "maxGenesisDraws": 8036,
    "maxDrawsPerRound": 8040,
    "countBound": "two-times-4017-generation-plus-two-genesis-or-four-round-repairs-plus-two-round-combat",
    "order": [
      "first-rethink-generation-then-repair",
      "other-rethink-generation-then-repair",
      "psychological-damage-jitter",
      "sophistry-topic-reroll",
      "participant0-refill-generation-then-repair",
      "participant1-refill-generation-then-repair"
    ],
    "generationIdentity": [
      "participantId",
      "phase",
      "generation"
    ],
    "generationOrdinal": "resulting-deckGeneration",
    "generationPrimitiveSlice": "exact-required-length-role-bound-value-only-delegated-to-unchanged-kernel",
    "generatorDrawCountsByRhetoricCount": [
      2018,
      4017,
      4016,
      4015,
      4014,
      4014
    ],
    "repairRole": "debate-fill-topic-repair",
    "repairBound": 9,
    "repairIdentity": [
      "participantId",
      "phase"
    ],
    "validation": "safe-syntax-first-exact-provenance-and-primitive-semantics-at-consumption-phase",
    "extra": "whole-operation-atomic-rejection-after-last-reached-phase",
    "externalRngConsumed": 0,
    "nativePrng": false
  },
  "closing": {
    "id": "regenerated-session-hp-only-closing-v1",
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
    "id": "bounded-regenerated-session-reject-v1",
    "maxEntries": 16,
    "deckEntriesPerParticipant": 18,
    "maxCanonicalUtf8Bytes": 33554432,
    "maxInputNodes": 2000000,
    "maxInputDepth": 32,
    "maxInputArrayLength": 8192,
    "exhaustion": "rejection-not-game-draw",
    "envelope": "complete-proposed-session-at-create-preview-execute-replay",
    "entryCount": "upper-bound-earlier-byte-or-node-rejection-allowed"
  },
  "persistence": {
    "id": "full-regenerated-genesis-and-history-recompute-v1",
    "policyComparison": "all-fields",
    "genesis": "scenario-full-generation-fill-and-draw-audit-recompute",
    "receipts": "compare-all-fields-including-full-generator-audit",
    "snapshot": "compare-all-fields-including-current-decks-generations-and-rhetoric",
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
  "combatEvidence": "unchanged-shared-normal-non-tutorial-generic-six-kind-core",
  "fillEvidence": "pinned-modern-CharacterFillCards-and-shared-single-completion-helper",
  "fillIntegration": "genesis-rethink-nonterminal-next-turn-fill-with-on-demand-regeneration",
  "removalEvidence": "Debate.cs-453-465-compact-retained-source-order",
  "initializationOrder": "Debate.cs-1549-1552-team0-then-team1",
  "rethinkOrder": "DebatePhase.cs-174-246-first-then-other",
  "refillOrder": "Debate.cs-1046-1079-team0-then-team1",
  "repairTokenIdentity": "engine-audit-policy-preserves-generation-and-consumed-tape-index",
  "equalCardIdentityOrder": "engine-preSortSlot-policy-not-source-Array.Sort-identity",
  "rawDrawStream": "provided-in-source-phase-order-not-native-PRNG",
  "rethinkAvailability": "modern-controlled-UI-admission-not-native-unconditional-guard",
  "legacyProfiles": "all-eight-behavior-public-contracts-and-saves-unchanged",
  "nativeEquivalent": false,
  "stockOriginalVerified": false,
  "pkEquivalent": false,
  "vanillaEquivalent": false,
  "completeDebate": false,
  "originalUnresolvedGroups": 43,
  "originalHistoricalSnapshots": 45,
  "nativeWholeChain": "open",
  "deckRegeneration": "bounded-modern-source-session-integration-not-native-proof",
  "initialTopicGeneration": "excluded",
  "angerPersonality": "excluded",
  "tutorial": "excluded",
  "realPersonsAndItems": "excluded",
  "closingConsequences": "excluded",
  "p078": "excluded",
  "generationEvidence": "unchanged-shipped-DeckGenerate-kernel",
  "sourceDeckGenerateLines": [
    306,
    340
  ],
  "sourceCharacterFillCardsLines": [
    412,
    439
  ],
  "sourceRegenerationBoundaryLines": [
    421,
    426
  ],
  "checkpointOrigin": "caller-supplied-synthetic-generation-zero-not-DeckInit-or-prior-history-authenticity",
  "rhetoricPool": "caller-supplied-active-ordered-unique-subset-not-person-book-eligibility",
  "generationOrdinal": "engine-occurrence-identity-not-source-native-field"
} as const;
type Evidence = typeof EVIDENCE;
type FillPhase = 'genesis' | 'rethink' | 'refill';
type RepairDraw = { role: 'debate-fill-topic-repair'; bound: 9; value: number; participantId: string; phase: FillPhase };
type GenerationDraw = Mutable<DebateDeckGenerateRawDrawV1> & { participantId: string; phase: FillPhase; generation: number };
type CombatDraw = { role: 'psychological-damage-jitter'; bound: 5; value: number } | { role: 'sophistry-topic-reroll'; bound: 3; value: number };
type RawDraw = GenerationDraw | RepairDraw | CombatDraw;
type Participant = { id: string; resolvedIntelligence: number; hp: 1000; stress: 0; angerTimer: 0; cardTape: CardCode[]; initialDeckCursor: number; rhetoricCards: RhetoricCardCode[] };
type Scenario = { schemaVersion: 1; profile: typeof PROFILE; genericOnly: true; difficulty: 'source-normal'; policies: Policy; challengerId: string; initialTopic: Topic; participants: Pair<Participant>; genesisRawDraws: RawDraw[] };
type DeckCheckpoint = { deck: CardCode[]; deckCursor: number; deckGeneration: number; rhetoricCards: RhetoricCardCode[] };
type ParticipantState = DeckCheckpoint & { id: string; resolvedIntelligence: number; attack: number; hp: number; stress: number; angerTimer: 0; sourceSlotCount: number; playableHandCapacity: number; reservedRethinkSlot: true; canRethink: boolean; crumbledLevel: number; hand: Occurrence[] };
type Snapshot = { schemaVersion: 1; profile: typeof PROFILE; revision: number; roundIndex: number; currentTopic: Topic; firstId: string; status: 'active' | 'finished'; outcome: Outcome | null; participants: Pair<ParticipantState> };
type Selection = { participantId: string; cardToken: string };
type Command = { type: 'ResolveRegeneratedDebateRound'; expectedRevision: number; expectedRoundIndex: number; expectedFirstId: string; rethinks: string[]; choices: Pair<Selection>; rawDraws: RawDraw[] };
/** Complete source slots, carrying engine occurrence identity through one repair/sort. */
type FillSlot = {
  preSortSlot: number; origin: 'reserved-rethink' | 'retained' | 'deck';
  token: string | null; deckGeneration: number | null; tapeIndex: number | null;
  originalCard: 0 | CardCode; card: 0 | CardCode; topicRepairApplied: boolean;
};
type Completion = DebateFillCompletionResult<FillSlot>;
/** Local kernel indices are unchanged; this wrapper locates their global half-open range. */
type Generation = {
  sequence: number; participantId: string; phase: FillPhase; generation: number;
  before: DeckCheckpoint; after: DeckCheckpoint;
  drawStartIndex: number; drawEndIndexExclusive: number;
  kernel: DebateDeckGenerateReceiptV1;
};
/** completion.repair.drawIndex is local zero; repairDrawIndex is in the supplied stream. */
type Fill = {
  sequence: number; phase: FillPhase; participantId: string;
  beforeCards: Occurrence[]; afterCards: Occurrence[]; drawnCards: Occurrence[];
  beforeDeck: DeckCheckpoint; afterDeck: DeckCheckpoint; generations: Generation[];
  completion: Completion; drawStartIndex: number; drawEndIndexExclusive: number;
  repairDrawIndex: number | null; generationDrawCount: number; repairDrawCount: 0 | 1;
};
type Rethink = { sequence: 0 | 1; participantId: string; discardedCards: Occurrence[]; replacementCards: Occurrence[]; beforeDeck: DeckCheckpoint; afterDeck: DeckCheckpoint; beforeCanRethink: true; afterCanRethink: false; fillSequence: number };
type StressStage = { beforeStress: number; requestedStress: number; afterStress: number; actualStressDelta: number };
type Change = { participantId: string; beforeHp: number; afterHp: number; requestedHpDamage: number; actualHpDelta: number; beforeStress: number; afterStress: number; requestedStress: number; actualStressDelta: number; attackStress: StressStage; effectStress: StressStage; beforeCanRethink: boolean; afterCanRethink: boolean; rethinkRefreshReason: 'crumble-level-changed' | 'no-crumble-change' | 'terminal-no-next-turn'; beforeCrumbledLevel: number; afterCrumbledLevel: number; consumedCard: Occurrence; refilledCards: Occurrence[]; beforeDeck: DeckCheckpoint; afterDeck: DeckCheckpoint };
type TopicReroll =
  { status: 'applied'; drawIndex: number; rawValue: number; beforeTopic: Topic; afterTopic: Topic; sophistryOwnerId: string; opponentId: string } |
  { status: 'skipped'; reason: 'terminal' | 'equal-card-power' | 'no-sophistry' | 'opponent-ignore' };
type Receipt = {
  schemaVersion: 1; profile: typeof PROFILE; command: Command; policy: Policy; evidence: Evidence;
  beforeRevision: number; afterRevision: number; beforeRoundIndex: number; afterRoundIndex: number; beforeFirstId: string; afterFirstId: string; beforeTopic: Topic; afterTopic: Topic;
  orderedIds: Pair<string>; rethinks: Rethink[]; fills: Fill[]; plays: Pair<Play>; result: 'winner' | 'draw'; roundWinnerId: string | null;
  damage: Damage | null; effects: Effect[]; effectOrder: OldReceipt['effectOrder']; effectSkipReason: OldReceipt['effectSkipReason'];
  changes: Pair<Change>; consumedDraws: RawDraw[]; attackDrawCount: 0 | 1; attackNoDrawReason: OldReceipt['attackNoDrawReason']; topicDrawCount: 0 | 1; generationDrawCount: number; repairDrawCount: number; fillDrawCount: number; drawCount: number; topicReroll: TopicReroll;
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
export type RegeneratedDebateTopicV1 = Topic;
export type RegeneratedDebateCardCodeV1 = CardCode;
export type RegeneratedDebateRhetoricCardCodeV1 = RhetoricCardCode;
export type RegeneratedDebateCardOccurrenceV1 = Frozen<Occurrence>;
export type RegeneratedDebateDeckCheckpointV1 = Frozen<DeckCheckpoint>;
export type RegeneratedDebateParticipantV1 = Frozen<Participant>;
export type RegeneratedDebateParticipantStateV1 = Frozen<ParticipantState>;
export type RegeneratedDebateScenarioV1 = Frozen<Scenario>;
export type RegeneratedDebateSnapshotV1 = Frozen<Snapshot>;
export type RegeneratedDebateCommandV1 = Frozen<Command>;
export type RegeneratedDebateFillPhaseV1 = FillPhase;
export type RegeneratedDebateRepairDrawV1 = Frozen<RepairDraw>;
export type RegeneratedDebateGenerationDrawV1 = Frozen<GenerationDraw>;
export type RegeneratedDebateCombatDrawV1 = Frozen<CombatDraw>;
export type RegeneratedDebateRawDrawV1 = Frozen<RawDraw>;
export type RegeneratedDebateSelectionV1 = Frozen<Selection>;
export type RegeneratedDebateFillV1 = Frozen<Fill>;
export type RegeneratedDebateFillSlotV1 = Frozen<FillSlot>;
export type RegeneratedDebateFillCompletionV1 = Frozen<Completion>;
export type RegeneratedDebateGenerationV1 = Frozen<Generation>;
export type RegeneratedDebateRethinkV1 = Frozen<Rethink>;
export type RegeneratedDebatePlayV1 = Frozen<Play>;
export type RegeneratedDebateStressStageV1 = Frozen<StressStage>;
export type RegeneratedDebateEffectV1 = Frozen<Effect>;
export type RegeneratedDebateChangeV1 = Frozen<Change>;
export type RegeneratedDebateDamageV1 = Frozen<Damage>;
export type RegeneratedDebateTopicRerollV1 = Frozen<TopicReroll>;
export type RegeneratedDebateOutcomeV1 = Frozen<Outcome>;
export type RegeneratedDebateEntryV1 = Frozen<Entry>;
export type RegeneratedDebateGenesisV1 = Frozen<Genesis>;
export type RegeneratedDebateSessionV1 = Frozen<Session>;
export type RegeneratedDebatePolicyV1 = Frozen<Policy>;
export type RegeneratedDebateEvidenceV1 = Frozen<Evidence>;
export type RegeneratedDebateReceiptV1 = Frozen<Receipt>;
export type RegeneratedDebateFailureV1 = Frozen<Failure>;
export type RegeneratedDebateSessionResultV1 = Frozen<SessionResult>;
export type RegeneratedDebateExecuteResultV1 = Frozen<ExecuteResult>;
export type RegeneratedDebatePreviewResultV1 = Frozen<PreviewResult>;
export type RegeneratedDebateSaveResultV1 = Frozen<SaveResult>;
export type RegeneratedDebateInspectionResultV1 = Frozen<InspectionResult>;
export type RegeneratedDebateReplayResultV1 = Frozen<SessionResult>;

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
function getProxyDetector(): ((value: unknown) => boolean) | null {
  try {
    const runtime = globalThis as { process?: { getBuiltinModule?: (id: string) => { types?: { isProxy?: (value: unknown) => boolean } } } };
    if (typeof runtime.process?.getBuiltinModule !== 'function') return null;
    const detector = runtime.process.getBuiltinModule('node:util').types?.isProxy;
    return typeof detector === 'function' ? detector : null;
  } catch { return null; }
}
const proxyDetector = getProxyDetector();
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
    const keys = Reflect.ownKeys(v);
    if (keys.length > POLICY.capacity.maxInputNodes) fail('history-limit');
    const descriptors = Object.getOwnPropertyDescriptors(v as object);
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
  const r = object(value, ['id', 'resolvedIntelligence', 'hp', 'stress', 'angerTimer', 'cardTape', 'initialDeckCursor', 'rhetoricCards']);
  if (r.hp !== 1000 || r.stress !== 0 || r.angerTimer !== 0) fail('unsupported-initial-state');
  if (!Array.isArray(r.cardTape) || r.cardTape.length !== 18) fail('invalid-card-tape');
  if (!Array.isArray(r.rhetoricCards) || r.rhetoricCards.length > 5) fail('invalid-rhetoric-cards');
  const rhetoricCards = r.rhetoricCards.map(value => integer(value, 14, 10, 'invalid-rhetoric-cards') as RhetoricCardCode);
  if (new Set(rhetoricCards).size !== rhetoricCards.length) fail('invalid-rhetoric-cards');
  return { id: id(r.id), resolvedIntelligence: integer(r.resolvedIntelligence, 100, 1), hp: 1000, stress: 0, angerTimer: 0, cardTape: r.cardTape.map(cardCode), initialDeckCursor: integer(r.initialDeckCursor, 18, 0, 'invalid-deck-cursor'), rhetoricCards };
}
/** Only syntax here. Exact role, bound, value and provenance are checked when consumed. */
function rawDraw(value: unknown): RawDraw {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) fail('malformed-data');
  const role = (value as Record<string, unknown>).role;
  const repair = role === 'debate-fill-topic-repair';
  const generation = typeof role === 'string' && role.startsWith('debate-deck-');
  const r = object(value, generation ? ['role', 'bound', 'value', 'participantId', 'phase', 'generation'] : repair ? ['role', 'bound', 'value', 'participantId', 'phase'] : ['role', 'bound', 'value']);
  if (typeof r.role !== 'string' || typeof r.bound !== 'number' || typeof r.value !== 'number') fail('malformed-data');
  if (generation || repair) {
    if (typeof r.participantId !== 'string' || typeof r.phase !== 'string') fail('malformed-data');
    if (generation) {
      if (typeof r.generation !== 'number') fail('malformed-data');
      return { role: r.role, bound: r.bound, value: r.value, participantId: r.participantId, phase: r.phase, generation: r.generation } as GenerationDraw;
    }
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
  if ((value as Record<string, unknown>).type !== 'ResolveRegeneratedDebateRound') fail('unsupported-action');
  const r = object(value, ['type', 'expectedRevision', 'expectedRoundIndex', 'expectedFirstId', 'rethinks', 'choices', 'rawDraws']);
  if (!Array.isArray(r.rethinks) || r.rethinks.length > POLICY.rethink.maxRequestsPerRound) fail('malformed-data');
  const rethinks = r.rethinks.map(id);
  if (new Set(rethinks).size !== rethinks.length) fail('duplicate-rethink-participant');
  const choices = pair(r.choices, value => {
    const selection = object(value, ['participantId', 'cardToken']);
    if (typeof selection.cardToken !== 'string') fail('invalid-token');
    const token = /^[A-Za-z][A-Za-z0-9_-]{0,63}:(0|[1-9][0-9]*):(0|[1-9]|1[0-7])$/.exec(selection.cardToken);
    if (!token) fail('invalid-token');
    integer(Number(token[1]), MAX_ENTRIES + 1, 0, 'invalid-token');
    return { participantId: id(selection.participantId), cardToken: selection.cardToken };
  });
  if (choices[0].cardToken === choices[1].cardToken) fail('duplicate-token');
  if (choices[0].participantId === choices[1].participantId) fail('duplicate-participant');
  if (!Array.isArray(r.rawDraws) || r.rawDraws.length > POLICY.randomness.maxDrawsPerRound) fail('draw-shape');
  return { type: 'ResolveRegeneratedDebateRound', expectedRevision: integer(r.expectedRevision, MAX_ENTRIES), expectedRoundIndex: integer(r.expectedRoundIndex, MAX_ENTRIES), expectedFirstId: id(r.expectedFirstId), rethinks, choices, rawDraws: r.rawDraws.map(rawDraw) };
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
function deckCheckpoint(p: DeckCheckpoint): DeckCheckpoint {
  return { deck: p.deck.slice(), deckCursor: p.deckCursor, deckGeneration: p.deckGeneration, rhetoricCards: p.rhetoricCards.slice() };
}
/**
 * The whole primitive generator slice is delegated, not copied or reimplemented.
 * Wrapper provenance belongs to this session and is stripped only after matching
 * the actual participant, reached phase and resulting generation ordinal.
 * The generator receipt's local indices remain unchanged inside its global range.
 */
function regenerate(p: ParticipantState, phase: FillPhase, draws: DrawCursor, sequence: number): Generation {
  if (p.deckCursor !== 18) fail('invalid-deck-cursor');
  const before = deckCheckpoint(p), generation = p.deckGeneration + 1;
  const drawStartIndex = draws.consumed.length;
  const required = DEBATE_DECK_GENERATE_POLICY_V1.randomness.drawCountsByRhetoricCount[p.rhetoricCards.length];
  if (required === undefined) fail('invalid-rhetoric-cards');
  const supplied = draws.supplied.slice(drawStartIndex, drawStartIndex + required);
  if (supplied.length !== required) fail('missing-raw-draw');
  const primitiveDraws: Mutable<DebateDeckGenerateRawDrawV1>[] = [];
  for (const next of supplied) {
    if (!('generation' in next) || next.participantId !== p.id || next.phase !== phase || next.generation !== generation) fail('draw-shape');
    primitiveDraws.push({ role: next.role, bound: next.bound, value: next.value } as Mutable<DebateDeckGenerateRawDrawV1>);
  }
  const evaluated = evaluateDebateDeckGenerate({
    schemaVersion: 1, profile: 'debate-deck-generate-reference-v1',
    policies: DEBATE_DECK_GENERATE_POLICY_V1,
    rhetoricCards: p.rhetoricCards.slice(), rawDraws: primitiveDraws,
  });
  if (!evaluated.ok) fail(evaluated.reason);
  // DeckGenerate itself has no cursor. CharacterFillCards owns this one reset.
  p.deck = [...evaluated.deck]; p.rhetoricCards = [...evaluated.rhetoricCards];
  p.deckCursor = 0; p.deckGeneration = generation;
  draws.consumed.push(...supplied.map(draw => clone(draw)));
  return {
    sequence, participantId: p.id, phase, generation, before, after: deckCheckpoint(p),
    drawStartIndex, drawEndIndexExclusive: draws.consumed.length, kernel: evaluated.receipt,
  };
}
/**
 * Source removal compacts survivors into slots 1..n. Consume every trailing
 * vacancy, regenerating only when that vacancy reaches cursor18. Do not repair
 * or sort either side of a deck boundary separately. The shared completion sees
 * the entire mixed-generation hand exactly once and preserves slot metadata.
 */
function fillParticipant(p: ParticipantState, phase: FillPhase, draws: DrawCursor, fills: Fill[]): Fill {
  const beforeCards = clone(p.hand), beforeDeck = deckCheckpoint(p);
  const drawStartIndex = draws.consumed.length, generations: Generation[] = [];
  const slots: FillSlot[] = [{
    preSortSlot: 0, origin: 'reserved-rethink', token: null, deckGeneration: null, tapeIndex: null,
    originalCard: 0, card: 0, topicRepairApplied: false,
  }];
  let lastNewSlot: number | null = null;
  for (let index = 0; index < p.playableHandCapacity; index++) {
    const preSortSlot = index + 1, retained = beforeCards[index];
    if (retained) {
      slots.push({ preSortSlot, origin: 'retained', token: retained.token, deckGeneration: retained.deckGeneration,
        tapeIndex: retained.tapeIndex, originalCard: retained.cardCode, card: retained.cardCode, topicRepairApplied: false });
      continue;
    }
    if (p.deckCursor === 18) generations.push(regenerate(p, phase, draws, generations.length));
    const tapeIndex = p.deckCursor, card = p.deck[tapeIndex];
    if (card === undefined || p.deckCursor < 0 || p.deckCursor >= 18) fail('invalid-deck-cursor');
    const token = `${p.id}:${p.deckGeneration}:${tapeIndex}`;
    slots.push({ preSortSlot, origin: 'deck', token, deckGeneration: p.deckGeneration,
      tapeIndex, originalCard: card, card, topicRepairApplied: false });
    p.deckCursor++; lastNewSlot = preSortSlot;
  }
  let repairDrawIndex: number | null = null;
  const completion = completeDebateHandFill(slots, lastNewSlot, {
    consumeRepairDraw: () => {
      const next = draws.supplied[draws.consumed.length];
      if (!next) fail('missing-raw-draw');
      if (next.role !== 'debate-fill-topic-repair' || next.participantId !== p.id || next.phase !== phase) fail('draw-shape');
      if (next.bound !== 9 || !Number.isSafeInteger(next.value) || Object.is(next.value, -0) || next.value < 0 || next.value > 8) fail('invalid-raw-draw');
      repairDrawIndex = draws.consumed.length;
      draws.consumed.push(clone(next));
      return { role: 'debate-fill-topic-repair', bound: 9, value: next.value };
    },
    // Remaining supplied draws can belong to later participants or combat phases.
    skipRepair: () => {},
  });
  const afterCards: Occurrence[] = [], byOriginalSlot = new Map<number, Occurrence>();
  for (const provenance of completion.sortedProvenance) {
    if (provenance.origin === 'reserved-rethink') continue;
    if (provenance.card === 0 || provenance.token === null || provenance.tapeIndex === null || provenance.deckGeneration === null) fail('invalid-fill-provenance');
    const occurrence: Occurrence = { cardCode: provenance.card, token: provenance.token, tapeIndex: provenance.tapeIndex, deckGeneration: provenance.deckGeneration };
    if (provenance.origin === 'retained' && !same(occurrence, beforeCards[provenance.preSortSlot - 1])) fail('invalid-fill-provenance');
    afterCards.push(occurrence); byOriginalSlot.set(provenance.preSortSlot, occurrence);
  }
  const drawnCards: Occurrence[] = [];
  for (const slot of slots) {
    if (slot.origin !== 'deck') continue;
    const occurrence = byOriginalSlot.get(slot.preSortSlot);
    if (!occurrence) fail('invalid-fill-provenance');
    drawnCards.push(clone(occurrence));
  }
  p.hand = afterCards;
  const generationDrawCount = generations.reduce((sum, generation) => sum + generation.kernel.drawCounts.total, 0);
  const audit: Fill = {
    sequence: fills.length, phase, participantId: p.id, beforeCards, afterCards: clone(afterCards), drawnCards,
    beforeDeck, afterDeck: deckCheckpoint(p), generations, completion,
    drawStartIndex, drawEndIndexExclusive: draws.consumed.length, repairDrawIndex,
    generationDrawCount, repairDrawCount: completion.drawCount,
  };
  fills.push(audit); return audit;
}
function initialParticipant(p: Participant, other: Participant): ParticipantState {
  const playableHandCapacity = handCapacity(p.resolvedIntelligence);
  return { id: p.id, resolvedIntelligence: p.resolvedIntelligence, attack: 100 + div(40n * BigInt(p.resolvedIntelligence - other.resolvedIntelligence), BigInt(131 - p.resolvedIntelligence)), hp: 1000, stress: 0, angerTimer: 0, sourceSlotCount: playableHandCapacity + 1, playableHandCapacity, reservedRethinkSlot: true, canRethink: true, crumbledLevel: 0, hand: [], deck: p.cardTape.slice(), deckCursor: p.initialDeckCursor, deckGeneration: 0, rhetoricCards: p.rhetoricCards.slice() };
}
function initialSession(scenario: Scenario): Session {
  const participants: Pair<ParticipantState> = [initialParticipant(scenario.participants[0], scenario.participants[1]), initialParticipant(scenario.participants[1], scenario.participants[0])];
  const draws: DrawCursor = { supplied: scenario.genesisRawDraws, consumed: [] }, fills: Fill[] = [];
  for (const i of [0, 1] as const) fillParticipant(participants[i], 'genesis', draws, fills);
  if (draws.consumed.length !== draws.supplied.length) fail('unexpected-raw-draw');
  const snapshot: Snapshot = { schemaVersion: 1, profile: PROFILE, revision: 0, roundIndex: 0, currentTopic: scenario.initialTopic, firstId: scenario.challengerId, status: 'active', outcome: null, participants };
  return { tag: TAG, policy: clone(POLICY), evidence: clone(EVIDENCE), genesis: { scenario: clone(scenario), snapshot: clone(snapshot), fills, consumedDraws: draws.consumed }, snapshot, entries: [] };
}
/** Pure atomic round; rejected later phases never commit earlier fill/repair effects. */
function resolve(s: Snapshot, c: Command): { snapshot: Snapshot; receipt: Receipt } {
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
      const discardedCards = clone(p.hand), beforeDeck = deckCheckpoint(p);
      p.hand = [];
      const fill = fillParticipant(p, 'rethink', draws, fills);
      p.canRethink = false;
      const sequence: 0 | 1 = rethinks.length === 0 ? 0 : 1;
      rethinks.push({ sequence, participantId: p.id, discardedCards, replacementCards: clone(p.hand), beforeDeck, afterDeck: deckCheckpoint(p), beforeCanRethink: true, afterCanRethink: false, fillSequence: fill.sequence });
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
      refilled[i] = fillParticipant(participants[i], 'refill', draws, fills).drawnCards;
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
    return { participantId: before.id, beforeHp: before.hp, afterHp: after.hp, requestedHpDamage: requestedDamage[i], actualHpDelta: after.hp - before.hp, beforeStress: before.stress, afterStress: after.stress, requestedStress: attackStress.requestedStress + effectStress.requestedStress, actualStressDelta: after.stress - before.stress, attackStress, effectStress, beforeCanRethink: before.canRethink, afterCanRethink: after.canRethink, rethinkRefreshReason, beforeCrumbledLevel: before.crumbledLevel, afterCrumbledLevel: after.crumbledLevel, consumedCard, refilledCards: refilled[i], beforeDeck: deckCheckpoint(before), afterDeck: deckCheckpoint(after) };
  }
  const otherId = s.participants[0].id === s.firstId ? s.participants[1].id : s.participants[0].id;
  const topicDrawCount: 0 | 1 = topicReroll.status === 'applied' ? 1 : 0;
  const generationDrawCount = fills.reduce((sum, fill) => sum + fill.generationDrawCount, 0);
  const repairDrawCount = fills.reduce((sum, fill) => sum + fill.repairDrawCount, 0);
  const receipt: Receipt = {
    schemaVersion: 1, profile: PROFILE, command: clone(c), policy: clone(POLICY), evidence: clone(EVIDENCE),
    beforeRevision: s.revision, afterRevision: snapshot.revision, beforeRoundIndex: s.roundIndex, afterRoundIndex: snapshot.roundIndex, beforeFirstId: s.firstId, afterFirstId: firstId, beforeTopic: s.currentTopic, afterTopic: currentTopic,
    orderedIds: [s.firstId, otherId], rethinks, fills, plays, result: winner === null ? 'draw' : 'winner', roundWinnerId: winner === null ? null : participants[winner].id,
    damage, effects, effectOrder, effectSkipReason, changes: [change(0), change(1)], consumedDraws: draws.consumed, attackDrawCount, attackNoDrawReason, topicDrawCount,
    generationDrawCount, repairDrawCount, fillDrawCount: generationDrawCount + repairDrawCount, drawCount: draws.consumed.length, topicReroll,
    terminal: outcome !== null, crumbleEvaluated: outcome === null, refillApplied: outcome === null, outcome: clone(outcome),
  };
  return { snapshot, receipt };
}
/** Preview, execute and replay all budget this identical complete proposed envelope. */
function append(s: Session, command: Command): { session: Session; receipt: Receipt } {
  if (s.entries.length >= MAX_ENTRIES) fail('history-limit');
  const next = resolve(s.snapshot, command);
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
export const REGENERATED_DEBATE_POLICY_V1: RegeneratedDebatePolicyV1 = freeze(POLICY);
export const REGENERATED_DEBATE_EVIDENCE_V1: RegeneratedDebateEvidenceV1 = freeze(EVIDENCE);
export function createRegeneratedDebate(input: unknown): RegeneratedDebateSessionResultV1 {
  try { const session = initialSession(parseScenario(detach(input))); budget(session); return freeze({ ok: true, session } as SessionResult); } catch (e) { return freeze(failure(e)); }
}
export function inspectRegeneratedDebate(input: unknown): RegeneratedDebateInspectionResultV1 {
  try { const s = parseSession(detach(input)); return freeze({ ok: true, inspection: { snapshot: s.snapshot, policy: s.policy, evidence: s.evidence, entryCount: s.entries.length, remainingEntryCapacity: MAX_ENTRIES - s.entries.length, canonicalUtf8Bytes: budget(s) } } as InspectionResult); } catch (e) { return freeze(failure(e)); }
}
export function previewRegeneratedDebateRound(input: unknown, command: unknown): RegeneratedDebatePreviewResultV1 {
  try { const s = parseSession(detach(input)), c = parseCommand(detach(command)), next = append(s, c); return freeze({ ok: true, preview: { receipt: next.receipt, projectedSnapshot: next.session.snapshot, policy: clone(POLICY), evidence: clone(EVIDENCE), externalRngConsumed: 0 } } as PreviewResult); } catch (e) { return freeze(failure(e)); }
}
export function executeRegeneratedDebateRound(input: unknown, command: unknown): RegeneratedDebateExecuteResultV1 {
  try { const s = parseSession(detach(input)), c = parseCommand(detach(command)), next = append(s, c); return freeze({ ok: true, ...next } as ExecuteResult); } catch (e) { return freeze(failure(e)); }
}
export function saveRegeneratedDebate(input: unknown): RegeneratedDebateSaveResultV1 {
  try { const s = parseSession(detach(input)); budget(s); return freeze({ ok: true, json: canonical(s) } as SaveResult); } catch (e) { return freeze(failure(e)); }
}
export function loadRegeneratedDebate(json: unknown): RegeneratedDebateSessionResultV1 {
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
export function replayRegeneratedDebate(initialScenario: unknown, commands: unknown): RegeneratedDebateReplayResultV1 {
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
