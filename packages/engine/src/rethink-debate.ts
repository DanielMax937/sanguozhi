/**
 * Independent six-combat-kind session with optional precombat Rethink actions.
 * Normal difficulty, non-tutorial, generic identities, pinned modern reference only.
 * Rhetoric rules are modern-reference-only; NOT original/native/PK/Vanilla equivalence.
 * All six existing session modules remain unchanged. Rethink is NOT a seventh combat card.
 * Supplied-tape fills requiring the modern source's topic repair are rejected.
 */
type Frozen<T> = T extends object ? { readonly [K in keyof T]: Frozen<T[K]> } : T;
type Pair<T> = [T, T];
type Topic = 'story' | 'logic' | 'trend';
type Level = 'small' | 'medium' | 'large';
type TopicCard = { kind: 'topic'; topic: Topic; level: Level };
type ShoutCard = { kind: 'shout' };
type IgnoreCard = { kind: 'ignore' };
type ComposeCard = { kind: 'compose' };
type AgitateCard = { kind: 'agitate' };
type SophistryCard = { kind: 'sophistry' };
type Card = TopicCard | ShoutCard | IgnoreCard | ComposeCard | AgitateCard | SophistryCard;
type CardPosition = { token: string; tapeIndex: number };
type Occurrence = Card & CardPosition;
type TopicOccurrence = TopicCard & CardPosition;
type ShoutOccurrence = ShoutCard & CardPosition;
type SophistryOccurrence = SophistryCard & CardPosition;
const PROFILE = 'debate-topic-shout-ignore-compose-agitate-sophistry-rethink-reference-v1' as const;
const TAG = 'rethink-debate-session-v1' as const;
const MAX_ENTRIES = 4096, MAX_TAPE = 512, MAX_BYTES = 16 * 1024 * 1024;
const LEVELS = { small: { index: 0, damage: 10, stress: 10 }, medium: { index: 1, damage: 15, stress: 15 }, large: { index: 2, damage: 20, stress: 20 } } as const;
const POLICY = {
  id: 'rethink-debate-standalone-policy-v1', profile: PROFILE, tutorial: false, tutorialPolicy: 'non-tutorial-only',
  cards: { id: 'topic-shout-ignore-compose-agitate-and-sophistry-only-v1', kinds: ['topic', 'shout', 'ignore', 'compose', 'agitate', 'sophistry'], topics: ['story', 'logic', 'trend'], levels: ['small', 'medium', 'large'], topicPower: '1+levelIndex+10-if-current-topic', topicLevelCoefficients: [10, 15, 20], topicStressCoefficients: [10, 15, 20], drawStressEach: 15 },
  shout: { id: 'source-no-anger-shout-v1', power: 110, levelCoefficient: 15, topicCoefficient: 12, stressCoefficient: 15, availability: 'angerTimer-zero-only', additionalEffect: 'none' },
  ignore: { id: 'source-no-anger-ignore-v1', power: 120, stressDamage: 30, hpDamage: 0, damageJitter: false, availability: 'angerTimer-zero-only', additionalEffect: 'none', suppressOpponentAdditionalEffect: true, suppressionScope: 'loser-effect-including-compose-and-agitate', suppressSophistryTopicReroll: true },
  compose: { id: 'source-no-anger-compose-reflection-v1', power: 0, hpDamage: 0, damageJitter: false, availability: 'angerTimer-zero-only', target: 'opponent-unless-reflected-then-self', requestBasis: 'opponent-current-stress-regardless-of-reflection', requestedStress: '-max(trunc(opponent-current-stress/2),30)', minimumRequestedReduction: 30, reflection: 'opponent-played-sophistry', attack: 'never-wins-in-admitted-card-set', angerCounter: 'excluded' },
  agitate: { id: 'source-no-anger-agitate-reflection-v1', power: 0, hpDamage: 0, damageJitter: false, availability: 'angerTimer-zero-only', target: 'self-unless-reflected-then-opponent', requestedStress: 40, reflection: 'opponent-played-sophistry', attack: 'never-wins-in-admitted-card-set', angerCounter: 'excluded' },
  sophistry: { id: 'source-no-anger-sophistry-v1', power: 20, availability: 'angerTimer-zero-only', attack: 'reflect-loser-topic-only', damageCalculator: 'sophistry-winner-attack', coefficientCard: 'loser-topic-and-level', damageTopic: 'round-start', writer: 'loser-topic-card-reflected-true', writerGuard: 'calculated-hp-damage-positive', nonTopicAttack: 'no-hp-stress-or-jitter', additionalEffect: 'none' },
  identities: { id: 'generic-identity-debate-hooks-v1', realPersonMapping: false, allPersonHooks: 'identity-or-disabled', attackHook: 'identity', hpDamageHook: 'identity', difficulty: 'source-normal', items: false, personality: false },
  initialTopic: { id: 'provided-initial-topic-v1', generated: false },
  deal: { id: 'provided-ordered-card-tapes-with-topic-admissibility-v1', shuffle: false, nativeDistribution: false, token: 'participantId:tapeIndex', order: 'tape-order-stable-retained-hand', sourceDisplaySort: false, topicRequirement: 'at-least-one-topic-after-every-fill', topicRequirementPhases: ['genesis', 'rethink-replacement', 'nonterminal-refill'], topicRepair: 'unsupported-topic-repair', sourceTopicRepairDraw: 'excluded-RandInt9', deckRegeneration: 'excluded' },
  hand: { id: 'source-reserved-rethink-slot-precombat-action-v1', intelligenceThresholds: [70, 80, 90], sourceSlotCounts: [4, 5, 6, 7], playableCapacities: [3, 4, 5, 6], reservedRethinkSlots: 1, rethinkPlayable: false, reservedSlotRepresentation: 'capacity-metadata-only-no-physical-slot-removal' },
  round: { id: 'paired-choice-precombat-rethink-atomic-round-v1', action: 'ResolveRethinkDebateRound', choicesOrder: 'scenario-participant-order', precombatOrder: 'source-first-optional-rethink-then-final-selection-removal-then-other-optional-rethink-then-final-selection-removal', resolutionOrder: 'attack-then-winner-effect-then-loser-effect', orderedIdsMeaning: 'first-then-other-precombat-processing-order', interactivePhasePersistence: false, firstDamageBonus: false, damageCalculationDrawCount: 1, equalPowerAttackDrawCount: 0, ignoreAttackDrawCount: 0, sophistryNonTopicAttackDrawCount: 0, attackNoDrawReasons: ['equal-card-power', 'ignore-no-hp-damage', 'sophistry-opponent-not-topic'] },
  effects: { id: 'source-winner-then-loser-reflectable-effects-v1', timing: 'after-attack-before-hp-terminal', auditOrder: 'winner-then-loser-audit-slots', tie: 'no-invocations-and-empty-audit', ignore: 'winner-invoked-loser-suppressed', noAdditionalEffect: 'invoked-no-writer-request-zero', suppressedRequest: 'null-not-evaluated', nonWriterAuditTarget: 'null', nonWriterAuditReflection: 'null', composeRequestBasis: 'opponent-current-stress-before-write-not-writer-target', nonComposeRequestBasis: 'null', stressWriter: 'clamp-each-invoked-compose-or-agitate-write', effectTarget: 'compose-opponent-agitate-self-inverted-by-sophistry', changeRequestedStress: 'sum-of-evaluated-attack-and-effect-requests-by-target', stageActualDelta: 'after-minus-before' },
  topic: { id: 'source-non-tutorial-sophistry-topic-reroll-v1', damageTopic: 'round-start', nonterminalWinnerSets: ['firstId'], nonterminalTopicWinnerSets: ['currentTopic'], rhetoricWithoutRerollKeeps: ['currentTopic'], drawKeeps: ['firstId', 'currentTopic'], rerollCondition: 'nonterminal-valid-attacker-either-played-sophistry-opponent-not-ignore', losingSophistryAgainstShoutRerolls: true, sameTopicAllowed: true, drawRole: 'sophistry-topic-reroll', drawBound: 3, valueToTopic: ['story', 'logic', 'trend'], enumSource: 'pinned-modern-DebateEnum.cs-Topic', phase: 'after-hp-closing-anger-boundary-and-crumble-before-refill', terminalReroll: false },
  randomness: { id: 'provided-phased-debate-draws-no-topic-repair-v1', maxDrawsPerRound: 2, order: ['psychological-damage-jitter', 'sophistry-topic-reroll'], consumeAtPhase: true, missingWrongOrExtra: 'whole-round-atomic-rejection', rethinkDrawCount: 0, rethinkZeroDrawScope: 'admitted-provided-tape-without-deck-regeneration-or-topic-repair', externalRngConsumed: 0, nativePrng: false },
  arithmetic: { id: 'source-normal-integer-topic-shout-sophistry-damage-v1', attack: '100+trunc(40*(myINT-opponentINT)/(131-myINT))', hpDamage: 'trunc((attack+jitter)*10*levelCoef*topicCoef/1000)', division: 'toward-zero', intermediate: 'exact-bigint', matchingTopicCoefficient: 10, nonmatchingTopicCoefficient: 6, angerCoefficient: 10, jitterBound: 5, nativePrng: false },
  writer: { id: 'source-hp-minus100-to1000-stress0-to100-v1', hpMin: -100, hpMax: 1000, stressMin: 0, stressMax: 100 },
  anger: { id: 'reject-nonterminal-anger-trigger-v1', triggerStress: 100, evaluation: 'after-attack-and-additional-effects-and-hp-terminal-check-before-topic-reroll', rejection: 'whole-round-atomic', automaticCounterCards: 'excluded', cap99: false, reset: false, skip: false },
  closing: { id: 'session-result-only-closing-with-rethink-v1', defeatHp: 0, priority: ['precombat-rethink-and-selection', 'attack', 'additional-effects', 'hp-defeat', 'unsupported-anger-trigger', 'crumble', 'topic-and-first', 'next-turn-start-rethink-availability', 'refill'], terminalEffects: true, terminalRefill: false, terminalTopicChange: false, terminalTopicDraw: false, terminalFirstChange: false, terminalRethinkReset: false, campaignWrite: false },
  opening: { id: 'no-opening-instant-win-v1', initialHp: 1000, initialStress: 0, initialAngerTimer: 0 },
  rethink: { id: 'provided-tape-precombat-rethink-v1', action: 'ResolveRethinkDebateRound.rethinks', separateCommand: false, combatCard: false, maxRequestsPerRound: 2, duplicateRequests: 'duplicate-rethink-participant', requestOrder: 'input-order-immaterial', auditOrder: 'source-first-then-other-among-requested', auditSequence: 'compact-zero-based-audit-index', availabilityCheck: 'all-requested-participants-before-any-replacement', initiallyAvailable: true, availabilityAfterUse: false, availabilityGuardEvidence: 'modern-controlled-UI-only-not-native-unconditional-Rethink-guard', discard: 'entire-current-playable-hand', replacement: 'fill-playable-capacity-from-same-next-tape-cursor', finalSelection: 'replacement-token-for-requester-current-hand-token-otherwise', unchangedByAction: ['hp', 'stress', 'angerTimer', 'attack', 'currentTopic', 'firstId', 'crumbledLevel'], additionalEffect: 'none', crumbleStep: 250, crumbleMax: 3, reenable: 'nonterminal-crumble-level-change-at-folded-next-turn-start', ordinaryRoundReset: false, terminalReset: false, topicRepair: 'unsupported-topic-repair', angerPersonality: 'excluded', exposedAvailableAction: true },
  refill: { id: 'fill-next-round-from-tape-v1', fillOnlyVacancies: true, terminalRefill: false, insufficientTape: 'whole-round-atomic-rejection' },
  capacity: { id: 'bounded-session-reject-v1', maxEntries: MAX_ENTRIES, maxTapePerParticipant: MAX_TAPE, maxCanonicalUtf8Bytes: MAX_BYTES, maxInputNodes: 1_000_000, maxInputDepth: 32, exhaustion: 'rejection-not-game-draw' },
  persistence: { id: 'full-policy-genesis-recompute-v1', policyComparison: 'all-fields', genesisSnapshot: 'recompute', receipts: 'compare-all-fields', snapshot: 'compare-all-fields' },
} as const;
type Policy = typeof POLICY;
const EVIDENCE = {
  formulaEvidence: 'reverse-transcribed-cross-validated', formulaEvidenceScope: 'existing-E15-generic-ordinary-core-only',
  shoutEvidence: 'pinned-modern-translated-reference-only', shoutEvidenceScope: 'no-anger-generic-topic-and-shout-subset',
  ignoreEvidence: 'pinned-modern-translated-reference-only', ignoreEvidenceScope: 'no-anger-generic-topic-shout-and-ignore-subset',
  composeEvidence: 'pinned-modern-translated-reference-only', composeEvidenceScope: 'no-anger-generic-six-kind-subset-with-sophistry-reflection-no-anger-counter',
  agitateEvidence: 'pinned-modern-translated-reference-only', agitateEvidenceScope: 'no-anger-generic-six-kind-subset-with-sophistry-reflection-no-anger-counter',
  sophistryEvidence: 'pinned-modern-translated-reference-only', sophistryEvidenceScope: 'normal-non-tutorial-generic-six-kind-subset-no-anger-counter',
  rethinkEvidence: 'pinned-modern-translated-reference-only', rethinkEvidenceScope: 'normal-non-tutorial-generic-precombat-provided-tape-no-topic-repair-subset',
  stateMachineEvidence: 'pinned-modern-translated-reference', topicEnumEvidence: 'pinned-modern-DebateEnum.cs-Topic-Story0-Logic1-Trend2-Max3', dealPolicyEvidence: 'provided-sequence-engine-policy', sessionEvidence: 'bounded-modern-reference-subset',
  sourceIdentity: 'modern-CSharp-translation-not-native-or-Vanilla',
  sourceCommit: 'a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef', debateBlob: '0137498d10773cd4596d497083ccdf6a26b3a261', debatePhaseBlob: '6aa98f855a5d4d172cde7e8ffc18a141b8a7b587', debateEnumBlob: '5b46a8ac87613193eb9f4b99a25e489ba6f5e483',
  nativeEquivalent: false, stockOriginalVerified: false, pkEquivalent: false, vanillaEquivalent: false, completeDebate: false, originalUnresolvedGroups: 43,
  genericIdentity: 'engine-restricted-source-identity-hooks', difficulty: 'source-normal', tutorial: false, initialTopic: 'provided-engine-policy', pairedChoice: 'atomic-engine-policy', capacityAndPersistence: 'engine-policy',
  rhetoric: 'shout-ignore-compose-agitate-sophistry-combat-with-precombat-rethink-action', cardAvailability: 'source-no-anger-restricted', ignoreEffectSuppression: 'source-return-before-loser-effect-including-compose-and-agitate', composeEffectTarget: 'opponent-or-reflected-self-request-always-based-on-opponent-stress', agitateEffectTarget: 'self-or-reflected-opponent-plus40', sophistryAttack: 'winner-attack-with-loser-topic-card-reflected-to-loser-positive-damage-guard', sophistryTopic: 'non-tutorial-nonterminal-valid-attacker-with-sophistry-unless-opponent-ignore-even-when-losing-to-shout', additionalEffects: 'source-attacker-then-opponent-not-first-id', equalPowerEffects: 'source-invalid-attacker-return-no-effects', effectTiming: 'source-attack-then-effect-then-calc-winner', angerAndPersonality: 'unsupported-boundary', rethink: 'modern-clear-fill-mark-unavailable-and-rechoose-precombat-action', rethinkAvailability: 'modern-controlled-UI-guard-engine-admission-not-native-unconditional-Rethink-guard', rethinkReenable: 'modern-nonterminal-crumble-level-change-folded-next-TurnStart', rethinkSequence: 'atomic-engine-orchestration-source-first-rethink-selection-removal-then-other', rethinkPhysicalSlotRemoval: 'excluded-capacity-metadata-only', topicGuarantee: 'provided-tape-admissibility-after-every-fill-modern-source-RandInt9-repair-excluded', rethinkRandomness: 'zero-additional-supplied-draws-only-in-admitted-no-deck-regeneration-no-topic-repair-subset', realPersonExceptions: 'excluded', closingConsequences: 'excluded', nativeWholeChain: 'open',
} as const;
type Evidence = typeof EVIDENCE;
type Participant = { id: string; resolvedIntelligence: number; hp: 1000; stress: 0; angerTimer: 0; cardTape: Card[] };
type Scenario = { schemaVersion: 1; profile: typeof PROFILE; genericOnly: true; difficulty: 'source-normal'; policies: Policy; challengerId: string; initialTopic: Topic; participants: Pair<Participant> };
type ParticipantState = { id: string; resolvedIntelligence: number; attack: number; hp: number; stress: number; angerTimer: 0; sourceSlotCount: number; playableHandCapacity: number; reservedRethinkSlot: true; canRethink: boolean; crumbledLevel: number; hand: Occurrence[]; deckCursor: number };
type Outcome = { kind: 'hp-defeat'; winnerId: string; loserId: string };
type Snapshot = { schemaVersion: 1; profile: typeof PROFILE; revision: number; roundIndex: number; currentTopic: Topic; firstId: string; status: 'active' | 'finished'; outcome: Outcome | null; participants: Pair<ParticipantState> };
type RawDraw = { role: 'psychological-damage-jitter'; bound: 5; value: number } | { role: 'sophistry-topic-reroll'; bound: 3; value: number };
type Selection = { participantId: string; cardToken: string };
type Command = { type: 'ResolveRethinkDebateRound'; expectedRevision: number; expectedRoundIndex: number; expectedFirstId: string; rethinks: string[]; choices: Pair<Selection>; rawDraws: RawDraw[] };
/** Action-local audit; sequence is compact among requested participants, not a team index.
 * A later nonterminal crumble may restore availability in the round's final Change. */
type Rethink = { sequence: 0 | 1; participantId: string; discardedCards: Occurrence[]; replacementCards: Occurrence[]; beforeDeckCursor: number; afterDeckCursor: number; beforeCanRethink: true; afterCanRethink: false };
type Play = { participantId: string; card: Occurrence; attack: number; power: number; matchesCurrentTopic: boolean };
type StressStage = { beforeStress: number; requestedStress: number; afterStress: number; actualStressDelta: number };
/** Suppressed effects are not invoked; no-writer slots claim no target or reflection.
 * Compose's request basis is always the opponent, independently of its actual writer target. */
type Effect = { sequence: 0 | 1; actorId: string; opponentId: string } & (
  { status: 'applied'; invoked: true; cardKind: 'compose'; targetId: string; reflected: boolean; requestBasisId: string; requestBasisStress: number; requestedStress: number; beforeStress: number; afterStress: number; actualStressDelta: number } |
  { status: 'applied'; invoked: true; cardKind: 'agitate'; targetId: string; reflected: boolean; requestBasisId: null; requestBasisStress: null; requestedStress: 40; beforeStress: number; afterStress: number; actualStressDelta: number } |
  { status: 'no-additional-effect'; invoked: true; cardKind: 'topic' | 'shout' | 'ignore' | 'sophistry'; targetId: null; reflected: null; requestBasisId: null; requestBasisStress: null; requestedStress: 0; beforeStress: null; afterStress: null; actualStressDelta: 0 } |
  { status: 'suppressed-by-ignore'; invoked: false; cardKind: Card['kind']; targetId: null; reflected: null; requestBasisId: null; requestBasisStress: null; requestedStress: null; beforeStress: null; afterStress: null; actualStressDelta: 0 }
);
/** requestedStress is the sum of evaluated attack/effect requests for this target,
 * not the clamped net delta. Reflected effects are summed under their actual writer target. */
type Change = { participantId: string; beforeHp: number; afterHp: number; requestedHpDamage: number; actualHpDelta: number; beforeStress: number; afterStress: number; requestedStress: number; actualStressDelta: number; attackStress: StressStage; effectStress: StressStage; beforeCanRethink: boolean; afterCanRethink: boolean; rethinkRefreshReason: 'crumble-level-changed' | 'no-crumble-change' | 'terminal-no-next-turn'; beforeCrumbledLevel: number; afterCrumbledLevel: number; consumedCard: Occurrence; refilledCards: Occurrence[]; beforeDeckCursor: number; afterDeckCursor: number };
/** sourceId identifies the attack calculator, cardOwnerId the coefficient-card owner.
 * For reflected damage the latter is also the writer target; sourceCard is Sophistry. */
type Damage = { sourceId: string; cardOwnerId: string; targetId: string; attack: number; jitter: number; angerCoefficient: 10; levelCoefficient: number; topicCoefficient: number; roundStartTopic: Topic; requestedHpDamage: number; requestedStress: number } & (
  { kind: 'topic'; sourceCard: TopicOccurrence; card: TopicOccurrence; reflected: false; writer: 'topic-card'; positiveHpGuard: false; writerApplied: true } |
  { kind: 'shout'; sourceCard: ShoutOccurrence; card: ShoutOccurrence; reflected: false; writer: 'shout'; positiveHpGuard: false; writerApplied: true } |
  { kind: 'reflected-topic'; sourceCard: SophistryOccurrence; card: TopicOccurrence; reflected: true; writer: 'topic-card'; positiveHpGuard: true; writerApplied: boolean }
);
type TopicReroll =
  { status: 'applied'; drawIndex: 0 | 1; rawValue: number; beforeTopic: Topic; afterTopic: Topic; sophistryOwnerId: string; opponentId: string } |
  { status: 'skipped'; reason: 'terminal' | 'equal-card-power' | 'no-sophistry' | 'opponent-ignore' };
type Receipt = {
  schemaVersion: 1; profile: typeof PROFILE; command: Command; policy: Policy; evidence: Evidence;
  beforeRevision: number; afterRevision: number; beforeRoundIndex: number; afterRoundIndex: number; beforeFirstId: string; afterFirstId: string; beforeTopic: Topic; afterTopic: Topic;
  orderedIds: Pair<string>; rethinks: Rethink[]; plays: Pair<Play>; result: 'winner' | 'draw'; roundWinnerId: string | null;
  damage: Damage | null;
  effects: Effect[]; effectOrder: 'winner-then-loser-audit-slots' | 'none-equal-card-power'; effectSkipReason: 'equal-card-power' | 'ignore-suppresses-loser-effect' | null;
  changes: Pair<Change>; consumedDraws: RawDraw[]; attackDrawCount: 0 | 1; attackNoDrawReason: 'equal-card-power' | 'ignore-no-hp-damage' | 'sophistry-opponent-not-topic' | null; topicDrawCount: 0 | 1; drawCount: 0 | 1 | 2; topicReroll: TopicReroll;
  terminal: boolean; crumbleEvaluated: boolean; refillApplied: boolean; outcome: Outcome | null;
};
type Entry = { command: Command; receipt: Receipt };
type Genesis = { scenario: Scenario; snapshot: Snapshot };
type Session = { tag: typeof TAG; policy: Policy; evidence: Evidence; genesis: Genesis; snapshot: Snapshot; entries: Entry[] };
type Failure = { ok: false; reason: string; index: number | null };
type SessionResult = { ok: true; session: Session } | Failure;
type ExecuteResult = { ok: true; session: Session; receipt: Receipt } | Failure;
type PreviewResult = { ok: true; preview: { receipt: Receipt; projectedSnapshot: Snapshot; policy: Policy; evidence: Evidence; externalRngConsumed: 0 } } | Failure;
type SaveResult = { ok: true; json: string } | Failure;
type InspectionResult = { ok: true; inspection: { snapshot: Snapshot; policy: Policy; evidence: Evidence; entryCount: number; remainingEntryCapacity: number; canonicalUtf8Bytes: number } } | Failure;
export type RethinkDebateTopicV1 = Topic;
export type RethinkDebateLevelV1 = Level;
export type RethinkDebateTopicCardV1 = Frozen<TopicCard>;
export type RethinkDebateShoutCardV1 = Frozen<ShoutCard>;
export type RethinkDebateIgnoreCardV1 = Frozen<IgnoreCard>;
export type RethinkDebateComposeCardV1 = Frozen<ComposeCard>;
export type RethinkDebateAgitateCardV1 = Frozen<AgitateCard>;
export type RethinkDebateSophistryCardV1 = Frozen<SophistryCard>;
export type RethinkDebateCardV1 = Frozen<Card>;
export type RethinkDebateCardOccurrenceV1 = Frozen<Occurrence>;
export type RethinkDebateParticipantV1 = Frozen<Participant>;
export type RethinkDebateParticipantStateV1 = Frozen<ParticipantState>;
export type RethinkDebateScenarioV1 = Frozen<Scenario>;
export type RethinkDebateSnapshotV1 = Frozen<Snapshot>;
export type RethinkDebateCommandV1 = Frozen<Command>;
export type RethinkDebateRawDrawV1 = Frozen<RawDraw>;
export type RethinkDebateSelectionV1 = Frozen<Selection>;
export type RethinkDebateRethinkV1 = Frozen<Rethink>;
export type RethinkDebatePlayV1 = Frozen<Play>;
export type RethinkDebateStressStageV1 = Frozen<StressStage>;
export type RethinkDebateEffectV1 = Frozen<Effect>;
export type RethinkDebateChangeV1 = Frozen<Change>;
export type RethinkDebateDamageV1 = Frozen<Damage>;
export type RethinkDebateTopicRerollV1 = Frozen<TopicReroll>;
export type RethinkDebateOutcomeV1 = Frozen<Outcome>;
export type RethinkDebateEntryV1 = Frozen<Entry>;
export type RethinkDebateGenesisV1 = Frozen<Genesis>;
export type RethinkDebateSessionV1 = Frozen<Session>;
export type RethinkDebatePolicyV1 = Frozen<Policy>;
export type RethinkDebateEvidenceV1 = Frozen<Evidence>;
export type RethinkDebateReceiptV1 = Frozen<Receipt>;
export type RethinkDebateFailureV1 = Frozen<Failure>;
export type RethinkDebateSessionResultV1 = Frozen<SessionResult>;
export type RethinkDebateExecuteResultV1 = Frozen<ExecuteResult>;
export type RethinkDebatePreviewResultV1 = Frozen<PreviewResult>;
export type RethinkDebateSaveResultV1 = Frozen<SaveResult>;
export type RethinkDebateInspectionResultV1 = Frozen<InspectionResult>;
export type RethinkDebateReplayResultV1 = Frozen<SessionResult>;

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
      if (Array.isArray(x) && x.length > MAX_ENTRIES) fail('history-limit');
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
        if (n > MAX_ENTRIES) fail('history-limit');
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
function card(v: unknown): Card {
  if (v === null || typeof v !== 'object' || Array.isArray(v)) fail('malformed-data');
  const kind = choice((v as Record<string, unknown>).kind, ['topic', 'shout', 'ignore', 'compose', 'agitate', 'sophistry'], 'unsupported-card');
  if (kind === 'shout') { object(v, ['kind']); return { kind }; }
  if (kind === 'ignore') { object(v, ['kind']); return { kind }; }
  if (kind === 'compose') { object(v, ['kind']); return { kind }; }
  if (kind === 'agitate') { object(v, ['kind']); return { kind }; }
  if (kind === 'sophistry') { object(v, ['kind']); return { kind }; }
  const r = object(v, ['kind', 'topic', 'level']);
  return { kind, topic: topic(r.topic), level: choice(r.level, ['small', 'medium', 'large'], 'unsupported-card') };
}
function participant(v: unknown): Participant {
  const r = object(v, ['id', 'resolvedIntelligence', 'hp', 'stress', 'angerTimer', 'cardTape']);
  if (r.hp !== 1000 || r.stress !== 0 || r.angerTimer !== 0) fail('unsupported-initial-state');
  return { id: id(r.id), resolvedIntelligence: integer(r.resolvedIntelligence, 100, 1), hp: 1000, stress: 0, angerTimer: 0, cardTape: array(r.cardTape, MAX_TAPE).map(card) };
}
function parseScenario(v: unknown): Scenario {
  const r = object(v, ['schemaVersion', 'profile', 'genericOnly', 'difficulty', 'policies', 'challengerId', 'initialTopic', 'participants']);
  if (r.schemaVersion !== 1 || r.profile !== PROFILE || r.difficulty !== 'source-normal') fail('unsupported-profile');
  if (r.genericOnly !== true) fail('unsupported-person');
  if (!same(r.policies, POLICY)) fail('unsupported-policy');
  const participants = pair(r.participants, participant), challengerId = id(r.challengerId);
  if (participants[0].id === participants[1].id) fail('duplicate-participant');
  if (!participants.some(p => p.id === challengerId)) fail('invalid-challenger');
  return { schemaVersion: 1, profile: PROFILE, genericOnly: true, difficulty: 'source-normal', policies: clone(POLICY), challengerId, initialTopic: topic(r.initialTopic), participants };
}
function parseCommand(v: unknown): Command {
  if (v === null || typeof v !== 'object' || Array.isArray(v)) fail('malformed-data');
  if ((v as Record<string, unknown>).type !== 'ResolveRethinkDebateRound') fail('unsupported-action');
  const r = object(v, ['type', 'expectedRevision', 'expectedRoundIndex', 'expectedFirstId', 'rethinks', 'choices', 'rawDraws']);
  if (!Array.isArray(r.rethinks) || r.rethinks.length > POLICY.rethink.maxRequestsPerRound) fail('malformed-data');
  const rethinks = r.rethinks.map(id);
  if (new Set(rethinks).size !== rethinks.length) fail('duplicate-rethink-participant');
  const choices = pair(r.choices, value => { const s = object(value, ['participantId', 'cardToken']); if (typeof s.cardToken !== 'string' || !/^[A-Za-z][A-Za-z0-9_-]{0,63}:(0|[1-9][0-9]{0,2})$/.test(s.cardToken)) fail('invalid-token'); return { participantId: id(s.participantId), cardToken: s.cardToken }; });
  if (choices[0].cardToken === choices[1].cardToken) fail('duplicate-token');
  if (choices[0].participantId === choices[1].participantId) fail('duplicate-participant');
  if (!Array.isArray(r.rawDraws) || r.rawDraws.length > POLICY.randomness.maxDrawsPerRound) fail('draw-shape');
  const rawDraws = r.rawDraws.map((v): RawDraw => {
    const d = object(v, ['role', 'bound', 'value']);
    if (d.role === 'psychological-damage-jitter' && d.bound === 5) return { role: d.role, bound: 5, value: integer(d.value, 4, 0, 'draw-range') };
    if (d.role === 'sophistry-topic-reroll' && d.bound === 3) return { role: d.role, bound: 3, value: integer(d.value, 2, 0, 'draw-range') };
    return fail('draw-shape');
  });
  return { type: 'ResolveRethinkDebateRound', expectedRevision: integer(r.expectedRevision, MAX_ENTRIES), expectedRoundIndex: integer(r.expectedRoundIndex, MAX_ENTRIES), expectedFirstId: id(r.expectedFirstId), rethinks, choices, rawDraws };
}
function div(n: bigint, d: bigint): number { return Number(n / d); }
function clamp(n: number, low: number, high: number): number { return Math.max(low, Math.min(high, n)); }
function handCapacity(intelligence: number): number { return intelligence < 70 ? 3 : intelligence < 80 ? 4 : intelligence < 90 ? 5 : 6; }
function refill(p: ParticipantState, source: Participant): Occurrence[] {
  const needed = p.playableHandCapacity - p.hand.length;
  if (source.cardTape.length - p.deckCursor < needed) fail('deck-exhausted');
  const drawn: Occurrence[] = [];
  for (let i = 0; i < needed; i++) { const tapeIndex = p.deckCursor++, next: Occurrence = { ...source.cardTape[tapeIndex]!, token: `${p.id}:${tapeIndex}`, tapeIndex }; p.hand.push(next); drawn.push(clone(next)); }
  // Modern-reference CharacterFillCards repairs a topic-less fill using RandInt(9).
  // This supplied-tape profile admits only fills that never need that branch.
  // The same boundary applies at genesis, Rethink replacement and next-turn refill.
  if (!p.hand.some(card => card.kind === 'topic')) fail('unsupported-topic-repair');
  return drawn;
}
function initialParticipant(p: Participant, other: Participant): ParticipantState {
  const playableHandCapacity = handCapacity(p.resolvedIntelligence);
  const state: ParticipantState = { id: p.id, resolvedIntelligence: p.resolvedIntelligence, attack: 100 + div(40n * BigInt(p.resolvedIntelligence - other.resolvedIntelligence), BigInt(131 - p.resolvedIntelligence)), hp: 1000, stress: 0, angerTimer: 0, playableHandCapacity, sourceSlotCount: playableHandCapacity + 1, reservedRethinkSlot: true, canRethink: true, crumbledLevel: 0, hand: [], deckCursor: 0 };
  refill(state, p); return state;
}
function initialSession(scenario: Scenario): Session {
  const snapshot: Snapshot = { schemaVersion: 1, profile: PROFILE, revision: 0, roundIndex: 0, currentTopic: scenario.initialTopic, firstId: scenario.challengerId, status: 'active', outcome: null, participants: [initialParticipant(scenario.participants[0], scenario.participants[1]), initialParticipant(scenario.participants[1], scenario.participants[0])] };
  return { tag: TAG, policy: clone(POLICY), evidence: clone(EVIDENCE), genesis: { scenario: clone(scenario), snapshot: clone(snapshot) }, snapshot, entries: [] };
}
/** Pure, all-or-nothing round; each supplied draw is consumed only at its source phase. */
function resolve(s: Snapshot, scenario: Scenario, c: Command): { snapshot: Snapshot; receipt: Receipt } {
  if (s.status === 'finished') fail('session-finished');
  if (c.expectedRevision !== s.revision) fail('stale-revision');
  if (c.expectedRoundIndex !== s.roundIndex) fail('stale-round');
  if (c.expectedFirstId !== s.firstId) fail('stale-first');
  const participants = clone(s.participants);
  const rethinks: Rethink[] = [];
  // Preflight every requested availability before any participant's replacement.
  // This is an engine admission guard, not a claim that native Rethink guards itself.
  for (const participantId of c.rethinks) {
    const participant = participants.find(p => p.id === participantId);
    if (!participant) fail('invalid-rethink-participant');
    if (!participant.canRethink) fail('rethink-unavailable');
  }
  for (const i of [0, 1] as const) if (c.choices[i].participantId !== participants[i].id) fail('invalid-choice-order');
  function select(i: 0 | 1): Play {
    const p = participants[i], selected = c.choices[i];
    if (c.rethinks.includes(p.id)) {
      const discardedCards = clone(p.hand), beforeDeckCursor = p.deckCursor;
      p.hand = [];
      const replacementCards = refill(p, scenario.participants[i]);
      p.canRethink = false;
      const sequence: 0 | 1 = rethinks.length === 0 ? 0 : 1;
      rethinks.push({ sequence, participantId: p.id, discardedCards, replacementCards, beforeDeckCursor, afterDeckCursor: p.deckCursor, beforeCanRethink: true, afterCanRethink: false });
    }
    const selectedCard = p.hand.find(card => card.token === selected.cardToken);
    if (!selectedCard) fail('not-in-hand');
    // Personality-dependent availability requires angerTimer > 0, which this profile never admits.
    const matchesCurrentTopic = selectedCard.kind === 'topic' && selectedCard.topic === s.currentTopic;
    const power = selectedCard.kind === 'ignore' ? POLICY.ignore.power : selectedCard.kind === 'shout' ? POLICY.shout.power : selectedCard.kind === 'sophistry' ? POLICY.sophistry.power : selectedCard.kind === 'compose' ? POLICY.compose.power : selectedCard.kind === 'agitate' ? POLICY.agitate.power : 1 + LEVELS[selectedCard.level].index + (matchesCurrentTopic ? 10 : 0);
    p.hand = p.hand.filter(card => card.token !== selectedCard.token);
    return { participantId: p.id, card: clone(selectedCard), attack: p.attack, power, matchesCurrentTopic };
  }
  // Fold the source Play rechoose loop into one atomic command, preserving source order:
  // first participant's optional Rethink then final selection/removal, then the other.
  // Receipt plays and changes remain in scenario order, independent of firstId.
  const firstIndex: 0 | 1 = s.firstId === participants[0].id ? 0 : 1, otherIndex = firstIndex === 0 ? 1 : 0;
  const firstPlay = select(firstIndex), otherPlay = select(otherIndex);
  const plays: Pair<Play> = firstIndex === 0 ? [firstPlay, otherPlay] : [otherPlay, firstPlay];
  const winner: 0 | 1 | null = plays[0].power === plays[1].power ? null : plays[0].power > plays[1].power ? 0 : 1;
  const ignoreWins = winner !== null && plays[winner].card.kind === 'ignore';
  const consumedDraws: RawDraw[] = [];
  function draw(role: RawDraw['role']): RawDraw {
    const next = c.rawDraws[consumedDraws.length];
    if (!next || next.role !== role) fail('draw-shape');
    consumedDraws.push(clone(next)); return next;
  }
  const requestedDamage: Pair<number> = [0, 0], requestedAttackStress: Pair<number> = [0, 0], requestedEffectStress: Pair<number> = [0, 0];
  let damage: Damage | null = null;
  let attackNoDrawReason: Receipt['attackNoDrawReason'] = null;
  function calculate(play: Play, coefficientCard: TopicCard | ShoutCard, jitter: number) {
    const levelCoefficient = coefficientCard.kind === 'shout' ? POLICY.shout.levelCoefficient : LEVELS[coefficientCard.level].damage;
    const topicCoefficient = coefficientCard.kind === 'shout' ? POLICY.shout.topicCoefficient : coefficientCard.topic === s.currentTopic ? POLICY.arithmetic.matchingTopicCoefficient : POLICY.arithmetic.nonmatchingTopicCoefficient;
    const requestedHpDamage = div(BigInt(play.attack + jitter) * 10n * BigInt(levelCoefficient) * BigInt(topicCoefficient), 1000n);
    const requestedStress = coefficientCard.kind === 'shout' ? POLICY.shout.stressCoefficient : LEVELS[coefficientCard.level].stress;
    return { attack: play.attack, jitter, angerCoefficient: 10 as const, levelCoefficient, topicCoefficient, roundStartTopic: s.currentTopic, requestedHpDamage, requestedStress };
  }
  if (winner === null) {
    // All equal-power pairings, including Sophistry/Sophistry: +15 each, no effects or draws.
    attackNoDrawReason = 'equal-card-power';
    requestedAttackStress[0] = POLICY.cards.drawStressEach; requestedAttackStress[1] = POLICY.cards.drawStressEach;
  } else {
    const loser = winner === 0 ? 1 : 0, play = plays[winner], loserPlay = plays[loser];
    if (play.card.kind === 'ignore') {
      attackNoDrawReason = 'ignore-no-hp-damage';
      requestedAttackStress[loser] = POLICY.ignore.stressDamage;
    } else if (play.card.kind === 'sophistry') {
      if (loserPlay.card.kind === 'topic') {
        // CalcHpDamage uses the Sophistry winner's attack but the LOSER'S topic/level.
        // TopicCard(loser, loserCard, ..., true) then writes back onto that loser.
        const calculated = calculate(play, loserPlay.card, draw('psychological-damage-jitter').value);
        damage = { ...calculated, kind: 'reflected-topic', sourceId: play.participantId, cardOwnerId: loserPlay.participantId, targetId: loserPlay.participantId, sourceCard: clone(play.card), card: clone(loserPlay.card), reflected: true, writer: 'topic-card', positiveHpGuard: true, writerApplied: calculated.requestedHpDamage > 0 };
        if (damage.writerApplied) {
          requestedDamage[loser] = calculated.requestedHpDamage;
          requestedAttackStress[loser] = calculated.requestedStress;
        }
      } else {
        // Sophistry beats Compose/Agitate, but the source Attack has no writer or jitter.
        attackNoDrawReason = 'sophistry-opponent-not-topic';
      }
    } else if (play.card.kind === 'shout') {
      const calculated = calculate(play, play.card, draw('psychological-damage-jitter').value);
      damage = { ...calculated, kind: 'shout', sourceId: play.participantId, cardOwnerId: play.participantId, targetId: loserPlay.participantId, sourceCard: clone(play.card), card: clone(play.card), reflected: false, writer: 'shout', positiveHpGuard: false, writerApplied: true };
      requestedDamage[loser] = calculated.requestedHpDamage;
      requestedAttackStress[loser] = calculated.requestedStress;
    } else if (play.card.kind === 'topic') {
      const calculated = calculate(play, play.card, draw('psychological-damage-jitter').value);
      damage = { ...calculated, kind: 'topic', sourceId: play.participantId, cardOwnerId: play.participantId, targetId: loserPlay.participantId, sourceCard: clone(play.card), card: clone(play.card), reflected: false, writer: 'topic-card', positiveHpGuard: false, writerApplied: true };
      requestedDamage[loser] = calculated.requestedHpDamage;
      requestedAttackStress[loser] = calculated.requestedStress;
    } else {
      // The two zero-power cards cannot be valid attackers in this six-kind profile.
      fail('unsupported-card');
    }
  }
  const attackDrawCount: 0 | 1 = consumedDraws.length === 0 ? 0 : 1;
  for (const i of [0, 1] as const) {
    participants[i].hp = clamp(participants[i].hp - requestedDamage[i], -100, 1000);
    participants[i].stress = clamp(participants[i].stress + requestedAttackStress[i], 0, 100);
  }
  const afterAttackStress: Pair<number> = [participants[0].stress, participants[1].stress];
  const effects: Effect[] = [];
  const effectOrder: Receipt['effectOrder'] = winner === null ? 'none-equal-card-power' : 'winner-then-loser-audit-slots';
  const effectSkipReason: Receipt['effectSkipReason'] = winner === null ? 'equal-card-power' : ignoreWins ? 'ignore-suppresses-loser-effect' : null;
  function effect(actor: 0 | 1, sequence: 0 | 1, suppressed: boolean): void {
    const opponent = actor === 0 ? 1 : 0, cardKind = plays[actor].card.kind;
    const audit = { sequence, actorId: participants[actor].id, opponentId: participants[opponent].id };
    const noWriter = { targetId: null, reflected: null, requestBasisId: null, requestBasisStress: null, beforeStress: null, afterStress: null, actualStressDelta: 0 as const };
    if (suppressed) {
      // Effect was never invoked: do not evaluate reflection, basis or a hypothetical target.
      effects.push({ ...audit, ...noWriter, cardKind, status: 'suppressed-by-ignore', invoked: false, requestedStress: null });
      return;
    }
    if (cardKind !== 'compose' && cardKind !== 'agitate') {
      effects.push({ ...audit, ...noWriter, cardKind, status: 'no-additional-effect', invoked: true, requestedStress: 0 });
      return;
    }
    const reflected = plays[opponent].card.kind === 'sophistry';
    const target = cardKind === 'compose' ? (reflected ? actor : opponent) : (reflected ? opponent : actor);
    const beforeStress = participants[target].stress;
    if (cardKind === 'compose') {
      // Reflection changes only the writer target, NEVER the opponent-based request magnitude.
      const requestBasisId = participants[opponent].id, requestBasisStress = participants[opponent].stress;
      const requestedStress = -Math.max(div(BigInt(requestBasisStress), 2n), POLICY.compose.minimumRequestedReduction);
      const afterStress = clamp(beforeStress + requestedStress, 0, 100);
      participants[target].stress = afterStress; requestedEffectStress[target] += requestedStress;
      effects.push({ ...audit, cardKind, status: 'applied', invoked: true, targetId: participants[target].id, reflected, requestBasisId, requestBasisStress, requestedStress, beforeStress, afterStress, actualStressDelta: afterStress - beforeStress });
    } else {
      const requestedStress = POLICY.agitate.requestedStress, afterStress = clamp(beforeStress + requestedStress, 0, 100);
      participants[target].stress = afterStress; requestedEffectStress[target] += requestedStress;
      effects.push({ ...audit, cardKind, status: 'applied', invoked: true, targetId: participants[target].id, reflected, requestBasisId: null, requestBasisStress: null, requestedStress, beforeStress, afterStress, actualStressDelta: afterStress - beforeStress });
    }
  }
  // Effect() uses the valid attacker, not firstId. A tie returns before either invocation.
  // No HP/alive guard: even a defeated loser's Compose or Agitate precedes CalcWinner.
  if (winner !== null) {
    const loser = winner === 0 ? 1 : 0;
    effect(winner, 0, false); effect(loser, 1, ignoreWins);
  }
  let outcome: Outcome | null = null;
  if (winner !== null) {
    const loser = winner === 0 ? 1 : 0;
    if (participants[loser].hp <= 0) outcome = { kind: 'hp-defeat', winnerId: participants[winner].id, loserId: participants[loser].id };
  }
  const refilled: Pair<Occurrence[]> = [[], []];
  let currentTopic = s.currentTopic, firstId = s.firstId;
  let topicReroll: TopicReroll = { status: 'skipped', reason: 'terminal' };
  if (outcome === null) {
    // This rejection deliberately precedes any demand for a TurnEnd topic draw.
    if (participants.some(p => p.stress >= POLICY.anger.triggerStress)) fail('unsupported-anger-trigger');
    for (const p of participants) p.crumbledLevel = clamp(div(BigInt(1000 - p.hp), 250n), 0, 3);
    if (winner === null) {
      topicReroll = { status: 'skipped', reason: 'equal-card-power' };
    } else {
      firstId = participants[winner].id;
      const winningCard = plays[winner].card;
      if (winningCard.kind === 'topic') currentTopic = winningCard.topic;
      const sophistryOwner: 0 | 1 | null = plays[0].card.kind === 'sophistry' ? 0 : plays[1].card.kind === 'sophistry' ? 1 : null;
      if (sophistryOwner === null) {
        topicReroll = { status: 'skipped', reason: 'no-sophistry' };
      } else {
        const opponent = sophistryOwner === 0 ? 1 : 0;
        if (plays[opponent].card.kind === 'ignore') {
          topicReroll = { status: 'skipped', reason: 'opponent-ignore' };
        } else {
          // Non-tutorial TurnEnd: even Sophistry LOSING to Shout consumes this draw.
          // A same-topic result is still a consumed reroll, not a skipped operation.
          const drawIndex: 0 | 1 = consumedDraws.length === 0 ? 0 : 1;
          const rawValue = draw('sophistry-topic-reroll').value, beforeTopic = currentTopic;
          currentTopic = POLICY.topic.valueToTopic[rawValue]!;
          topicReroll = { status: 'applied', drawIndex, rawValue, beforeTopic, afterTopic: currentTopic, sophistryOwnerId: participants[sophistryOwner].id, opponentId: participants[opponent].id };
        }
      }
    }
  }
  // Terminal rounds never consume a topic draw. Reject any supplied trailing draw as extra.
  if (consumedDraws.length !== c.rawDraws.length) fail('draw-shape');
  if (outcome === null) {
    // TurnStart refreshes only the participants whose crumble level changed.
    // An action used in this round is still recorded unavailable immediately after use.
    for (const i of [0, 1] as const) if (participants[i].crumbledLevel !== s.participants[i].crumbledLevel) participants[i].canRethink = true;
    refilled[0] = refill(participants[0], scenario.participants[0]); refilled[1] = refill(participants[1], scenario.participants[1]);
  }
  const snapshot: Snapshot = { schemaVersion: 1, profile: PROFILE, revision: s.revision + 1, roundIndex: s.roundIndex + 1, currentTopic, firstId, status: outcome === null ? 'active' : 'finished', outcome, participants };
  function change(i: 0 | 1): Change {
    const before = s.participants[i], after = participants[i];
    const attackStress: StressStage = { beforeStress: before.stress, requestedStress: requestedAttackStress[i], afterStress: afterAttackStress[i], actualStressDelta: afterAttackStress[i] - before.stress };
    const effectStress: StressStage = { beforeStress: afterAttackStress[i], requestedStress: requestedEffectStress[i], afterStress: after.stress, actualStressDelta: after.stress - afterAttackStress[i] };
    const rethinkRefreshReason: Change['rethinkRefreshReason'] = outcome !== null ? 'terminal-no-next-turn' : before.crumbledLevel !== after.crumbledLevel ? 'crumble-level-changed' : 'no-crumble-change';
    return { participantId: before.id, beforeHp: before.hp, afterHp: after.hp, requestedHpDamage: requestedDamage[i], actualHpDelta: after.hp - before.hp, beforeStress: before.stress, afterStress: after.stress, requestedStress: attackStress.requestedStress + effectStress.requestedStress, actualStressDelta: after.stress - before.stress, attackStress, effectStress, beforeCanRethink: before.canRethink, afterCanRethink: after.canRethink, rethinkRefreshReason, beforeCrumbledLevel: before.crumbledLevel, afterCrumbledLevel: after.crumbledLevel, consumedCard: clone(plays[i].card), refilledCards: refilled[i], beforeDeckCursor: before.deckCursor, afterDeckCursor: after.deckCursor };
  }
  const otherId = s.participants[0].id === s.firstId ? s.participants[1].id : s.participants[0].id;
  const topicDrawCount: 0 | 1 = topicReroll.status === 'applied' ? 1 : 0;
  const drawCount: 0 | 1 | 2 = attackDrawCount === 1 ? (topicDrawCount === 1 ? 2 : 1) : topicDrawCount;
  const receipt: Receipt = {
    schemaVersion: 1, profile: PROFILE, command: clone(c), policy: clone(POLICY), evidence: clone(EVIDENCE),
    beforeRevision: s.revision, afterRevision: snapshot.revision, beforeRoundIndex: s.roundIndex, afterRoundIndex: snapshot.roundIndex, beforeFirstId: s.firstId, afterFirstId: firstId, beforeTopic: s.currentTopic, afterTopic: currentTopic,
    orderedIds: [s.firstId, otherId], rethinks, plays, result: winner === null ? 'draw' : 'winner', roundWinnerId: winner === null ? null : participants[winner].id, damage, effects, effectOrder, effectSkipReason,
    changes: [change(0), change(1)], consumedDraws, attackDrawCount, attackNoDrawReason, topicDrawCount, drawCount, topicReroll,
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
  const genesis = object(r.genesis, ['scenario', 'snapshot']);
  let session = initialSession(parseScenario(genesis.scenario));
  if (!same(genesis.snapshot, session.snapshot)) fail('invalid-genesis');
  const entries = array(r.entries, MAX_ENTRIES);
  for (let index = 0; index < entries.length; index++) {
    try { const entry = object(entries[index], ['command', 'receipt']), next = append(session, parseCommand(entry.command)); if (!same(entry.receipt, next.receipt)) fail('receipt-mismatch'); session = next.session; }
    catch (e) { fail(failure(e).reason, index); }
  }
  if (!same(session.snapshot, r.snapshot)) fail('snapshot-mismatch'); budget(session); return session;
}
export const RETHINK_DEBATE_POLICY_V1: RethinkDebatePolicyV1 = freeze(POLICY);
export const RETHINK_DEBATE_EVIDENCE_V1: RethinkDebateEvidenceV1 = freeze(EVIDENCE);
export function createRethinkDebate(input: unknown): RethinkDebateSessionResultV1 {
  try { const session = initialSession(parseScenario(detach(input))); budget(session); return freeze({ ok: true, session } as SessionResult); } catch (e) { return freeze(failure(e)); }
}
export function inspectRethinkDebate(input: unknown): RethinkDebateInspectionResultV1 {
  try { const s = parseSession(detach(input)); return freeze({ ok: true, inspection: { snapshot: s.snapshot, policy: s.policy, evidence: s.evidence, entryCount: s.entries.length, remainingEntryCapacity: MAX_ENTRIES - s.entries.length, canonicalUtf8Bytes: budget(s) } } as InspectionResult); } catch (e) { return freeze(failure(e)); }
}
export function previewRethinkDebateRound(input: unknown, command: unknown): RethinkDebatePreviewResultV1 {
  try { const s = parseSession(detach(input)), c = parseCommand(detach(command)), next = append(s, c); return freeze({ ok: true, preview: { receipt: next.receipt, projectedSnapshot: next.session.snapshot, policy: clone(POLICY), evidence: clone(EVIDENCE), externalRngConsumed: 0 } } as PreviewResult); } catch (e) { return freeze(failure(e)); }
}
export function executeRethinkDebateRound(input: unknown, command: unknown): RethinkDebateExecuteResultV1 {
  try { const s = parseSession(detach(input)), c = parseCommand(detach(command)), next = append(s, c); return freeze({ ok: true, ...next } as ExecuteResult); } catch (e) { return freeze(failure(e)); }
}
export function saveRethinkDebate(input: unknown): RethinkDebateSaveResultV1 {
  try { const s = parseSession(detach(input)); budget(s); return freeze({ ok: true, json: canonical(s) } as SaveResult); } catch (e) { return freeze(failure(e)); }
}
export function loadRethinkDebate(json: unknown): RethinkDebateSessionResultV1 {
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
export function replayRethinkDebate(initialScenario: unknown, commands: unknown): RethinkDebateReplayResultV1 {
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
