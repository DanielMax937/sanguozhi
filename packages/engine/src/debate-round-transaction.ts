/** One bounded supplied ready-hand round; no session loop or Closing effects. */
import { evaluateDebateCheckedPlay, DEBATE_CHECKED_PLAY_POLICY_V1, DEBATE_CHECKED_PLAY_EVIDENCE_V1,
  type DebateCheckedPlayPlanV1, type DebateCheckedPlaySuccessV1, type DebateCheckedPlayFailureV1,
  type DebateCheckedPlayRandomEventV1 } from './debate-checked-play.ts';
import { evaluateDebateAttackEffect, DEBATE_ATTACK_EFFECT_POLICY_V1, DEBATE_ATTACK_EFFECT_EVIDENCE_V1,
  type DebateAttackEffectSuccessV1, type DebateAttackEffectFailureV1 } from './debate-attack-effect.ts';
import { evaluateDebateAngerTransition, DEBATE_ANGER_TRANSITION_POLICY_V1, DEBATE_ANGER_TRANSITION_EVIDENCE_V1,
  type DebateAngerTransitionStateV1, type DebateAngerTransitionCharacterV1, type DebateAngerTransitionComboV1,
  type DebateAngerTransitionSuccessV1, type DebateAngerTransitionFailureV1,
  type DebateAngerTransitionConsumedDrawV1 } from './debate-anger-transition.ts';
import { DEBATE_ANGER_PHASE_POLICY_V1 } from './debate-anger-phase.ts';
import { evaluateDebateTerminalClassification, DEBATE_TERMINAL_CLASSIFICATION_POLICY_V1, DEBATE_TERMINAL_CLASSIFICATION_EVIDENCE_V1,
  type DebateTerminalClassificationSuccessV1, type DebateTerminalClassificationFailureV1 } from './debate-terminal-classification.ts';
type Frozen<T> = T extends object ? { readonly [K in keyof T]: Frozen<T[K]> } : T;
type Mutable<T> = T extends object ? { -readonly [K in keyof T]: Mutable<T[K]> } : T;
type Pair<T> = [T, T];
type Team = 0 | 1;
type Character = Mutable<DebateAngerTransitionCharacterV1> & { resolvedAttack: number };
type InitialCharacter = Omit<Character, 'playedCard'> & { playedCard: -1 };
type Combo = Mutable<DebateAngerTransitionComboV1>;
type Plan = Mutable<DebateCheckedPlayPlanV1>;
type HpDraw = { role: 'debate-hp-damage-jitter'; bound: 5; value: number };
type AngerDraw = { role: 'debate-timid-combo-jitter'; bound: 5; value: number };
type FillDraw = { role: 'debate-fill-topic-repair'; bound: 9; value: number };
type TopicDraw = { role: 'debate-turn-end-topic-reroll'; bound: 3; value: number };
type Terminal = { criticalDisabled: boolean; initialCritical: -1; initialWinType: 0; choice: 0 | 1 | null };
const PROFILE = 'debate-round-transaction-reference-v1' as const;
const MAX_INPUT_NODES = 32768;
const MAX_INPUT_DEPTH = 48;
const MAX_INPUT_ARRAY_LENGTH = 64;
const MAX_CANONICAL_BYTES = 262144;
const POLICY = {
  id: 'debate-round-transaction-bounded-policy-v1', profile: PROFILE,
  components: { play: DEBATE_CHECKED_PLAY_POLICY_V1, attack: DEBATE_ATTACK_EFFECT_POLICY_V1,
    angerTransition: DEBATE_ANGER_TRANSITION_POLICY_V1, terminal: DEBATE_TERMINAL_CLASSIFICATION_POLICY_V1 },
  checkpoint: { genericOnly: true, isTutorial: false, winner: -1, hp: [1, 1000], topic: [0, 2],
    handSlots: 7, capacity: [4, 7], slotZero: 0, otherActiveSlots: [1, 14], currentDeckSize: 18,
    initialPlayedCard: -1, comboActive: false, initialCritical: -1, initialWinType: 0,
    provenance: 'caller-supplied-attributes-and-choices-not-native-reachability-proof' },
  sequence: ['checked-play', 'Attack-Effect-CalcWinner', 'if-alive-anger-transition', 'if-terminal-classification'],
  mappings: { hpStress: 'Attack-output-authoritative-before-Anger', handDeckQuota: 'Play-output-authoritative-before-Anger',
    ordinaryAttacker: 'Play-attacker-not-combo-attacker', playedCard: 'Play-final-card-until-TurnStart-clears',
    stateAfterAnger: 'entire-anger-transition-state-plus-carried-resolvedAttack',
    terminal: 'classify-only-preserve-all-other-state-stop-before-Closing' },
  unused: { attackTerminal: 'both-anger-and-topic-and-fill-arrays-empty', angerTerminal: 'unchanged-dependency-rejects-unused-draws',
    nonterminalChoice: 'null-required', ineligibleTerminalChoice: 'null-required' },
  output: { atomic: true, completeNestedReceipts: true, noPartialFailureState: true, detachedFrozen: true,
    next: ['ready-for-play', 'closing-pending'], persistence: false },
  randomness: { externalRngConsumed: 0, maximumEvents: 16,
    order: ['play-rethink-in-actor-order', 'ordinary-hp', 'anger-combo', 'turn-end-topic', 'team-zero-fill', 'team-one-fill'],
    budgetMeaning: 'conservative-component-sum-not-simultaneous-attainability' },
  budget: { nodes: MAX_INPUT_NODES, depth: MAX_INPUT_DEPTH, arrayLength: MAX_INPUT_ARRAY_LENGTH, canonicalBytes: MAX_CANONICAL_BYTES },
  boundary: { oldNineSessionsChanged: false, existingKernelsChanged: false, nativeEquivalent: false,
    ClosingRewardsInjuryWorldWritesAndP078: 'excluded', regenerationGlobalRngPersonHooksUiAiAndSession: 'excluded' },
} as const;
type Policy = typeof POLICY;
const EVIDENCE = {
  sourceIdentity: 'modern-CSharp-reference-plus-explicit-engineering-composition-not-native-PK-or-Vanilla',
  repository: 'https://github.com/tankyc/sango_infinity', sourceCommit: 'a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef',
  phasePath: 'Project/Assets/Sango/Scripts/Game/Debate/DebatePhase.cs', phaseBlob: '6aa98f855a5d4d172cde7e8ffc18a141b8a7b587',
  damageOrderLines: [397, 420],
  play: DEBATE_CHECKED_PLAY_EVIDENCE_V1, attack: DEBATE_ATTACK_EFFECT_EVIDENCE_V1,
  angerTransition: DEBATE_ANGER_TRANSITION_EVIDENCE_V1, terminal: DEBATE_TERMINAL_CLASSIFICATION_EVIDENCE_V1,
  nativeEquivalent: false, nativeGapTopics: 43, historicalSnapshots: 45, p078: 'excluded',
} as const;
type Evidence = typeof EVIDENCE;
type Input = {
  schemaVersion: 1; profile: typeof PROFILE; policies: Policy;
  genericOnly: true; isTutorial: false; winner: -1; firstTeam: Team; currentTopic: number;
  characters: Pair<InitialCharacter>; combo: Combo & { active: false }; crumbledLevels: Pair<0 | 1 | 2 | 3>;
  plans: Pair<Plan>; attackRawDraws: HpDraw[]; angerPassDraws: Pair<AngerDraw[]>;
  topicRawDraws: TopicDraw[]; fillRawDraws: Pair<FillDraw[]>; terminal: Terminal;
};
type State = Omit<Mutable<DebateAngerTransitionStateV1>, 'characters'> & {
  characters: Pair<Character>; critical: -1 | 0 | 1; winType: 0 | 1 | 2;
};
type Event =
  | { index: number; stage: 'play'; localIndex: number; event: DebateCheckedPlayRandomEventV1 }
  | { index: number; stage: 'attack'; localIndex: 0; draw: HpDraw }
  | { index: number; stage: 'anger-transition'; localIndex: number; event: DebateAngerTransitionConsumedDrawV1 };
type Receipt = {
  before: State; afterPlay: State; afterAttack: State; after: State;
  play: DebateCheckedPlaySuccessV1; attack: DebateAttackEffectSuccessV1;
  angerTransition: DebateAngerTransitionSuccessV1 | null; terminal: DebateTerminalClassificationSuccessV1 | null;
  terminalAfter: 'attack' | 'anger' | null; events: Event[]; eventCount: number; externalRngConsumed: 0;
};
type Success = { ok: true; schemaVersion: 1; profile: typeof PROFILE; policy: Policy; evidence: Evidence;
  state: State; nextCheckpoint: 'ready-for-play' | 'closing-pending'; receipt: Receipt };
type ValidationReason = 'unsupported-runtime' | 'input-limit' | 'malformed-data' | 'unknown-field' | 'unsupported-profile' | 'unsupported-policy'
  | 'invalid-checkpoint' | 'invalid-character' | 'invalid-plans' | 'invalid-draws' | 'invalid-combo' | 'invalid-terminal' | 'unused-after-attack-draws' | 'unused-terminal-choice';
type DependencyFailure =
  | { ok: false; reason: 'play-failure'; dependencyFailure: DebateCheckedPlayFailureV1 }
  | { ok: false; reason: 'attack-failure'; dependencyFailure: DebateAttackEffectFailureV1 }
  | { ok: false; reason: 'anger-transition-failure'; dependencyFailure: DebateAngerTransitionFailureV1 }
  | { ok: false; reason: 'terminal-failure'; dependencyFailure: DebateTerminalClassificationFailureV1 };
type Failure = { ok: false; reason: ValidationReason } | DependencyFailure;
type Result = Success | Failure;
export type DebateRoundTransactionInputV1 = Frozen<Input>;
export type DebateRoundTransactionCharacterV1 = Frozen<Character>;
export type DebateRoundTransactionStateV1 = Frozen<State>;
export type DebateRoundTransactionEventV1 = Frozen<Event>;
export type DebateRoundTransactionReceiptV1 = Frozen<Receipt>;
export type DebateRoundTransactionSuccessV1 = Frozen<Success>;
export type DebateRoundTransactionFailureV1 = Frozen<Failure>;
export type DebateRoundTransactionResultV1 = Frozen<Result>;
export type DebateRoundTransactionPolicyV1 = Frozen<Policy>;
export type DebateRoundTransactionEvidenceV1 = Frozen<Evidence>;
class Invalid extends Error {
  readonly result: Failure;
  constructor(result: Failure) { super(result.reason); this.result = result; }
}
function fail(reason: ValidationReason): never { throw new Invalid({ ok: false, reason }); }
function abort(result: DependencyFailure): never { throw new Invalid(result); }
function failure(error: unknown): Failure { return error instanceof Invalid ? error.result : { ok: false, reason: 'malformed-data' }; }
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
function object(value: unknown, keys: readonly string[], reason: ValidationReason = 'malformed-data'): Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) fail(reason);
  const record = value as Record<string, unknown>;
  if (Object.keys(record).some(key => !keys.includes(key))) fail('unknown-field');
  if (keys.some(key => !Object.hasOwn(record, key))) fail('malformed-data');
  return record;
}
/** Detachment has already rejected all nonintegral or unsafe numeric values. */
function integer(value: unknown, minimum: number, maximum: number, reason: ValidationReason): number {
  if (typeof value !== 'number' || value < minimum || value > maximum) fail(reason);
  return value;
}
function array(value: unknown, minimum: number, maximum: number, reason: ValidationReason): unknown[] {
  if (!Array.isArray(value) || value.length < minimum || value.length > maximum) fail(reason);
  return value;
}
function boolean(value: unknown, reason: ValidationReason): boolean {
  if (typeof value !== 'boolean') fail(reason);
  return value;
}
function draw<R extends string, B extends number>(value: unknown, role: R, bound: B): { role: R; bound: B; value: number } {
  const r = object(value, ['role', 'bound', 'value'], 'invalid-draws');
  if (r.role !== role || r.bound !== bound) fail('invalid-draws');
  return { role, bound, value: integer(r.value, 0, bound - 1, 'invalid-draws') };
}
function parseCharacter(value: unknown): InitialCharacter {
  const c = object(value, ['personality', 'strength', 'hp', 'stress', 'angerTimer', 'maxCardCount', 'hand', 'playedCard', 'canRethink', 'crumbled', 'cardTape', 'deckCursor', 'resolvedAttack'], 'invalid-character');
  if (c.personality !== 'timid' && c.personality !== 'calm' && c.personality !== 'bold' && c.personality !== 'reckless') fail('invalid-character');
  if (c.playedCard !== -1) fail('invalid-character');
  const capacity = integer(c.maxCardCount, 4, 7, 'invalid-character') as Character['maxCardCount'];
  const hand = array(c.hand, 7, 7, 'invalid-character').map(v => integer(v, -1, 14, 'invalid-character')) as Character['hand'];
  if (hand[0] !== 0) fail('invalid-character');
  for (let i = 1; i < capacity; i++) if (hand[i]! < 1) fail('invalid-character');
  const cardTape = array(c.cardTape, 18, 18, 'invalid-character').map(v => integer(v, 1, 14, 'invalid-character')) as Character['cardTape'];
  return { personality: c.personality, strength: integer(c.strength, 1, 100, 'invalid-character'), hp: integer(c.hp, 1, 1000, 'invalid-character'),
    stress: integer(c.stress, 0, 100, 'invalid-character'), angerTimer: integer(c.angerTimer, 0, 4, 'invalid-character'),
    maxCardCount: capacity, hand, playedCard: -1, canRethink: boolean(c.canRethink, 'invalid-character'), crumbled: boolean(c.crumbled, 'invalid-character'),
    cardTape, deckCursor: integer(c.deckCursor, 0, 18, 'invalid-character'), resolvedAttack: integer(c.resolvedAttack, 70, 227, 'invalid-character') };
}
function parsePlan(value: unknown): Plan {
  const p = object(value, ['selections'], 'invalid-plans');
  return { selections: array(p.selections, 1, 2, 'invalid-plans').map(value => {
    const s = object(value, ['cardIndex', 'rawDraws', 'rawResults'], 'invalid-plans');
    return { cardIndex: integer(s.cardIndex, 0, 6, 'invalid-plans'),
      rawDraws: array(s.rawDraws, 0, 1, 'invalid-draws').map(v => draw(v, 'debate-fill-topic-repair', 9)),
      rawResults: array(s.rawResults, 0, 1, 'invalid-draws').map(value => {
        const b = object(value, ['role', 'percent', 'value'], 'invalid-draws');
        if (b.role !== 'debate-calm-rethink-rand-bool' || b.percent !== 40) fail('invalid-draws');
        return { role: 'debate-calm-rethink-rand-bool' as const, percent: 40 as const, value: boolean(b.value, 'invalid-draws') };
      }) };
  }) };
}
function parseInput(value: unknown): Input {
  const r = object(value, ['schemaVersion', 'profile', 'policies', 'genericOnly', 'isTutorial', 'winner', 'firstTeam', 'currentTopic', 'characters', 'combo', 'crumbledLevels', 'plans', 'attackRawDraws', 'angerPassDraws', 'topicRawDraws', 'fillRawDraws', 'terminal']);
  if (r.schemaVersion !== 1 || r.profile !== PROFILE) fail('unsupported-profile');
  if (canonical(r.policies) !== canonical(POLICY)) fail('unsupported-policy');
  if (r.genericOnly !== true || r.isTutorial !== false || r.winner !== -1) fail('invalid-checkpoint');
  const firstTeam = integer(r.firstTeam, 0, 1, 'invalid-checkpoint') as Team;
  const currentTopic = integer(r.currentTopic, 0, 2, 'invalid-checkpoint');
  const cs = array(r.characters, 2, 2, 'invalid-character');
  const characters: Pair<InitialCharacter> = [parseCharacter(cs[0]), parseCharacter(cs[1])];
  const co = object(r.combo, ['active', 'attacker', 'counter'], 'invalid-combo');
  if (co.active !== false) fail('invalid-combo');
  const combo: Combo & { active: false } = { active: false, attacker: integer(co.attacker, -1, 1, 'invalid-combo') as Combo['attacker'], counter: integer(co.counter, 0, 7, 'invalid-combo') };
  const levels = array(r.crumbledLevels, 2, 2, 'invalid-checkpoint');
  const crumbledLevels: Input['crumbledLevels'] = [integer(levels[0], 0, 3, 'invalid-checkpoint') as 0 | 1 | 2 | 3, integer(levels[1], 0, 3, 'invalid-checkpoint') as 0 | 1 | 2 | 3];
  const ps = array(r.plans, 2, 2, 'invalid-plans');
  const plans: Pair<Plan> = [parsePlan(ps[0]), parsePlan(ps[1])];
  const attackRawDraws = array(r.attackRawDraws, 0, 1, 'invalid-draws').map(v => draw(v, 'debate-hp-damage-jitter', 5));
  const aps = array(r.angerPassDraws, 2, 2, 'invalid-draws');
  const angerPassDraws: Pair<AngerDraw[]> = [array(aps[0], 0, 4, 'invalid-draws').map(v => draw(v, 'debate-timid-combo-jitter', 5)), array(aps[1], 0, 4, 'invalid-draws').map(v => draw(v, 'debate-timid-combo-jitter', 5))];
  const topicRawDraws = array(r.topicRawDraws, 0, 1, 'invalid-draws').map(v => draw(v, 'debate-turn-end-topic-reroll', 3));
  const fs = array(r.fillRawDraws, 2, 2, 'invalid-draws');
  const fillRawDraws: Pair<FillDraw[]> = [array(fs[0], 0, 1, 'invalid-draws').map(v => draw(v, 'debate-fill-topic-repair', 9)), array(fs[1], 0, 1, 'invalid-draws').map(v => draw(v, 'debate-fill-topic-repair', 9))];
  const t = object(r.terminal, ['criticalDisabled', 'initialCritical', 'initialWinType', 'choice'], 'invalid-terminal');
  if (t.initialCritical !== -1 || t.initialWinType !== 0 || (t.choice !== null && t.choice !== 0 && t.choice !== 1)) fail('invalid-terminal');
  const terminal: Terminal = { criticalDisabled: boolean(t.criticalDisabled, 'invalid-terminal'), initialCritical: -1, initialWinType: 0, choice: t.choice };
  return { schemaVersion: 1, profile: PROFILE, policies: POLICY, genericOnly: true, isTutorial: false, winner: -1,
    firstTeam, currentTopic, characters, combo, crumbledLevels, plans, attackRawDraws, angerPassDraws, topicRawDraws, fillRawDraws, terminal };
}
function copyCharacter(c: Character): Character { return { ...c, hand: [...c.hand], cardTape: c.cardTape.slice() }; }
function copyState(s: State): State { return { ...s, characters: [copyCharacter(s.characters[0]), copyCharacter(s.characters[1])], combo: { ...s.combo }, crumbledLevels: [...s.crumbledLevels] }; }
function playCharacter(c: InitialCharacter) {
  return { personality: c.personality, angerTimer: c.angerTimer, maxCardCount: c.maxCardCount, hand: c.hand,
    playedCard: -1 as const, canRethink: c.canRethink, cardTape: c.cardTape, deckCursor: c.deckCursor };
}
type InternalPlay = Pick<DebateCheckedPlaySuccessV1, 'attacker' | 'checkpoint'> & {
  receipt: Pick<DebateCheckedPlaySuccessV1['receipt'], 'randomEvents'>;
};
type InternalAngerTransition = Pick<DebateAngerTransitionSuccessV1, 'state'> & {
  receipt: Pick<DebateAngerTransitionSuccessV1['receipt'], 'consumedDraws'>;
};
export type DebateRoundTransactionBodyInternal<P extends InternalPlay, A extends InternalAngerTransition> = {
  ok: true; state: State; nextCheckpoint: 'ready-for-play' | 'closing-pending';
  receipt: Omit<Receipt, 'play' | 'angerTransition'> & { play: P; angerTransition: A | null };
};
/** Safe original v1-shaped admission; no domain work. Not a public profile. */
export function parseDebateRoundTransactionInternal(input: unknown): Input {
  return parseInput(detach(input));
}
/** Returns null for foreign errors so enclosing trusted composition can preserve them. */
export function debateRoundTransactionFailureInternal(error: unknown): Failure | null {
  return error instanceof Invalid ? error.result : null;
}
/** Trusted engine dependencies only; never supplied from public JSON input. */
export function resolveDebateRoundTransactionInternal<P extends InternalPlay, A extends InternalAngerTransition>(
  input: Input,
  dependencies: { play: (value: unknown) => P; angerTransition: (value: unknown) => A },
): DebateRoundTransactionBodyInternal<P, A> {
  const before: State = { genericOnly: true, isTutorial: false, winner: -1, firstTeam: input.firstTeam, attacker: -1,
    currentTopic: input.currentTopic, characters: [copyCharacter(input.characters[0]), copyCharacter(input.characters[1])], combo: { ...input.combo },
    crumbledLevels: [...input.crumbledLevels], critical: -1, winType: 0 };
  const play = dependencies.play({ schemaVersion: 1, profile: 'debate-checked-play-reference-v1', policies: DEBATE_CHECKED_PLAY_POLICY_V1,
    isTutorial: false, winner: -1, firstTeam: input.firstTeam, currentTopic: input.currentTopic,
    characters: [playCharacter(input.characters[0]), playCharacter(input.characters[1])], plans: input.plans });
  const afterPlay = copyState(before);
  afterPlay.attacker = play.attacker;
  for (const team of [0, 1] as const) {
    const c = play.checkpoint.characters[team];
    afterPlay.characters[team] = { ...afterPlay.characters[team], ...c, maxCardCount: afterPlay.characters[team].maxCardCount, hand: [...c.hand], cardTape: c.cardTape.slice() };
  }
  const attack = evaluateDebateAttackEffect({ schemaVersion: 1, profile: 'debate-attack-effect-reference-v1', policies: DEBATE_ATTACK_EFFECT_POLICY_V1,
    genericOnly: true, isTutorial: false, winner: -1, firstTeam: input.firstTeam, attacker: play.attacker, currentTopic: input.currentTopic,
    characters: afterPlay.characters.map(c => ({ personality: c.personality, angerTimer: c.angerTimer, hp: c.hp, stress: c.stress, resolvedAttack: c.resolvedAttack, playedCard: c.playedCard })), rawDraws: input.attackRawDraws });
  if (!attack.ok) abort({ ok: false, reason: 'attack-failure', dependencyFailure: attack });
  const afterAttack = copyState(afterPlay);
  afterAttack.winner = attack.state.winner;
  for (const team of [0, 1] as const) {
    afterAttack.characters[team].hp = attack.state.characters[team].hp;
    afterAttack.characters[team].stress = attack.state.characters[team].stress;
  }
  let after = copyState(afterAttack);
  let angerTransition: A | null = null;
  let terminal: DebateTerminalClassificationSuccessV1 | null = null;
  let terminalAfter: Receipt['terminalAfter'] = after.winner !== -1 ? 'attack' : null;
  if (after.winner !== -1) {
    if (input.angerPassDraws.some(a => a.length !== 0) || input.topicRawDraws.length !== 0 || input.fillRawDraws.some(a => a.length !== 0)) fail('unused-after-attack-draws');
  } else {
    const result = dependencies.angerTransition({ schemaVersion: 1, profile: 'debate-anger-transition-reference-v1', policies: DEBATE_ANGER_TRANSITION_POLICY_V1,
      anger: { schemaVersion: 1, profile: 'debate-anger-phase-reference-v1', policies: DEBATE_ANGER_PHASE_POLICY_V1,
        genericOnly: true, winner: -1, firstTeam: after.firstTeam,
        characters: after.characters.map(c => ({ personality: c.personality, strength: c.strength, hp: c.hp, stress: c.stress, angerTimer: c.angerTimer, maxCardCount: c.maxCardCount, hand: c.hand })),
        combo: after.combo, crumbledLevels: after.crumbledLevels, crumbled: after.characters.map(c => c.crumbled),
        resolvedAttacks: after.characters.map(c => c.resolvedAttack), passDraws: input.angerPassDraws },
      transition: { isTutorial: false, attacker: play.attacker, currentTopic: input.currentTopic,
        characters: after.characters.map((c, i) => ({ playedCard: c.playedCard, canRethink: c.canRethink, cardTape: c.cardTape, deckCursor: c.deckCursor, rawDraws: input.fillRawDraws[i] })), topicRawDraws: input.topicRawDraws } });
    angerTransition = result;
    after = { ...result.state, characters: [
      { ...result.state.characters[0], hand: [...result.state.characters[0].hand], cardTape: result.state.characters[0].cardTape.slice(), resolvedAttack: input.characters[0].resolvedAttack },
      { ...result.state.characters[1], hand: [...result.state.characters[1].hand], cardTape: result.state.characters[1].cardTape.slice(), resolvedAttack: input.characters[1].resolvedAttack },
    ], combo: { ...result.state.combo }, crumbledLevels: [...result.state.crumbledLevels], critical: -1, winType: 0 };
    if (after.winner !== -1) terminalAfter = 'anger';
  }
  if (after.winner !== -1) {
    const result = evaluateDebateTerminalClassification({ schemaVersion: 1, profile: 'debate-terminal-classification-reference-v1', policies: DEBATE_TERMINAL_CLASSIFICATION_POLICY_V1,
      genericOnly: true, isTutorial: false, winner: after.winner, hp: [after.characters[0].hp, after.characters[1].hp], ...input.terminal });
    if (!result.ok) abort({ ok: false, reason: 'terminal-failure', dependencyFailure: result });
    terminal = result;
    after.critical = result.state.critical;
    after.winType = result.state.winType;
  } else if (input.terminal.choice !== null) fail('unused-terminal-choice');
  const events: Event[] = [];
  for (const event of play.receipt.randomEvents) events.push({ index: events.length, stage: 'play', localIndex: event.eventIndex, event });
  if (attack.receipt.consumedDraws === 1) events.push({ index: events.length, stage: 'attack', localIndex: 0, draw: { ...input.attackRawDraws[0]! } });
  if (angerTransition) for (const event of angerTransition.receipt.consumedDraws) events.push({ index: events.length, stage: 'anger-transition', localIndex: event.flatDrawIndex, event });
  return { ok: true, state: copyState(after),
    nextCheckpoint: terminal === null ? 'ready-for-play' : 'closing-pending',
    receipt: { before, afterPlay, afterAttack, after: copyState(after), play, attack, angerTransition, terminal, terminalAfter, events, eventCount: events.length, externalRngConsumed: 0 } };
}
function resolve(input: Input): Success {
  const body = resolveDebateRoundTransactionInternal(input, {
    play: value => {
      const result = evaluateDebateCheckedPlay(value);
      if (!result.ok) abort({ ok: false, reason: 'play-failure', dependencyFailure: result });
      return result;
    },
    angerTransition: value => {
      const result = evaluateDebateAngerTransition(value);
      if (!result.ok) abort({ ok: false, reason: 'anger-transition-failure', dependencyFailure: result });
      return result;
    },
  });
  return { ok: true, schemaVersion: 1, profile: PROFILE, policy: POLICY, evidence: EVIDENCE,
    state: body.state, nextCheckpoint: body.nextCheckpoint, receipt: body.receipt };
}
export const DEBATE_ROUND_TRANSACTION_POLICY_V1: DebateRoundTransactionPolicyV1 = freeze(POLICY);
export const DEBATE_ROUND_TRANSACTION_EVIDENCE_V1: DebateRoundTransactionEvidenceV1 = freeze(EVIDENCE);
/** No intermediate success escapes a failed transaction. No source or candidate execution is implied by this API's existence. */
export function evaluateDebateRoundTransaction(input: unknown): DebateRoundTransactionResultV1 {
  try { return freeze(resolve(parseInput(detach(input)))); }
  catch (error) { return freeze(failure(error)); }
}
