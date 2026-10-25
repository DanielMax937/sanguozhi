/**
 * Bounded ordinary Attack -> Effect -> CalcWinner from an already-resolved
 * attacker checkpoint. Modern generic reference only, not a whole turn/session.
 * The caller retains hands/decks/quota/crumble/combo metadata for anger routing.
 */
import {
  evaluateDebateHpDamage,
  DEBATE_HP_DAMAGE_POLICY_V1,
  DEBATE_HP_DAMAGE_EVIDENCE_V1,
  type DebateHpDamageSuccessV1,
  type DebateHpDamageFailureV1,
  type DebateHpDamagePersonalityV1,
} from './debate-hp-damage.ts';

type Frozen<T> = T extends object ? { readonly [K in keyof T]: Frozen<T[K]> } : T;
type Team = 0 | 1;
type MaybeTeam = -1 | Team;
type Pair<T> = [T, T];
type Personality = DebateHpDamagePersonalityV1;
type Topic = 0 | 1 | 2;
const PROFILE = 'debate-attack-effect-reference-v1' as const;
const MAX_INPUT_NODES = 4096;
const MAX_INPUT_DEPTH = 16;
const MAX_INPUT_ARRAY_LENGTH = 32;
const MAX_CANONICAL_BYTES = 65536;
const POLICY = {
  id: 'debate-attack-effect-bounded-generic-policy-v1', profile: PROFILE,
  order: ['Attack', 'Effect-attacker-then-opponent-unless-Ignore', 'CalcWinner'],
  checkpoint: {
    genericOnly: true, isTutorial: false, winner: -1,
    firstTeam: [0, 1], attacker: [-1, 0, 1], currentTopic: [0, 1, 2],
    playedCard: [1, 14], hp: [1, 1000], stress: [0, 100],
    angerTimer: [0, 4], resolvedAttack: [70, 227],
    personality: ['timid', 'calm', 'bold', 'reckless'],
    attackerProvenance: 'caller-resolved-not-recomputed-or-authenticated',
    topicNarrowing: 'reject-outside-zero-through-two-even-though-PR125-admits-signed32',
    admission: 'engineering-checkpoint-not-source-reachability-proof',
  },
  hpKernel: DEBATE_HP_DAMAGE_POLICY_V1,
  attack: {
    tie: 'both-stress-plus-fifteen-no-hp-call-no-effects',
    ignore: 'opponent-stress-plus-thirty-no-hp-call',
    sophistry: 'only-opponent-ordinary-card-hp-call-using-sophistry-actor-attributes-then-reflect-to-opponent-if-positive',
    shout: 'hp-call-and-opponent-hp-stress-write',
    default: 'hp-call-even-zero-level-card-then-opponent-hp-stress-write',
    stressOrdinaryLevels: [10, 15, 20], stressShout: 15,
  },
  effect: {
    compose: 'minus-max-truncated-current-opponent-stress-divided-by-two-or-thirty-reflect-to-self-against-sophistry',
    agitate: 'self-plus-forty-reflect-to-opponent-against-sophistry',
    ignoreSuppressesOpponent: true, afterLethalAttack: true,
    rethink: 'excluded-final-card-zero-not-admitted',
  },
  writes: { hpClamp: [-100, 1000], stressClamp: [0, 100], stressTimerGate: false },
  winner: 'firstTeam-wins-if-opponent-hp-nonpositive-else-opponent-wins-if-firstTeam-hp-nonpositive-else-minus-one',
  routing: { nonterminal: 'ready-for-anger', terminal: 'terminal-pending-classification' },
  randomness: { role: 'debate-hp-damage-jitter', bound: 5, value: [0, 4], count: 'exactly-one-if-hp-kernel-called-otherwise-zero', externalRngConsumed: 0 },
  safety: { closedSchema: true, detachedFrozen: true, proxyDetectorRequired: true, completeParseBeforeDomain: true, noPartialFailureState: true },
  budget: { nodes: MAX_INPUT_NODES, depth: MAX_INPUT_DEPTH, arrayLength: MAX_INPUT_ARRAY_LENGTH, canonicalBytes: MAX_CANONICAL_BYTES },
  boundary: {
    angerAndCrumbleAndRoundTransition: 'not-executed', criticalClosingRewards: 'excluded',
    handsDecksQuotaCombo: 'caller-retains-not-accepted-or-mutated',
    attackerSelectionAvailabilityAndPlay: 'not-repeated', personHooks: 'identity-only-not-verified',
    nativeEquivalent: false, completeDebate: false, oldNineSessionsChanged: false, p078: 'excluded',
  },
} as const;
type Policy = typeof POLICY;
const EVIDENCE = {
  sourceIdentity: 'modern-CSharp-translation-not-native-PK-or-Vanilla',
  repository: 'https://github.com/tankyc/sango_infinity',
  sourceCommit: 'a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef',
  debatePath: 'Project/Assets/Sango/Scripts/Game/Debate/Debate.cs',
  debateBlob: '0137498d10773cd4596d497083ccdf6a26b3a261',
  debateSha256: '622789ca8b8b6799a321526dcfb513d6622adf5b5d54025175c2a7795ef7da28',
  debatePhasePath: 'Project/Assets/Sango/Scripts/Game/Debate/DebatePhase.cs',
  debatePhaseBlob: '6aa98f855a5d4d172cde7e8ffc18a141b8a7b587',
  debatePhaseSha256: '5b47f7b6a89d6123a23e7c14f22168e59c9edd549e98d9bc0258d8a55bb9cbf3',
  attackLines: [1423, 1456], effectLines: [1458, 1480], effectOrderLines: [1568, 1579],
  damagePhaseLines: [394, 417], writesLines: [512, 534], stressLines: [1199, 1210],
  attackActionsLines: [1216, 1297], winnerLines: [1380, 1395],
  hpKernel: DEBATE_HP_DAMAGE_EVIDENCE_V1,
  nativeEquivalent: false, pkEquivalent: false, vanillaEquivalent: false,
  nativeGapTopics: 43, historicalSnapshots: 45, p078: 'excluded',
} as const;
type Evidence = typeof EVIDENCE;
type RawDraw = { role: 'debate-hp-damage-jitter'; bound: 5; value: number };
type Character = { personality: Personality; angerTimer: number; hp: number; stress: number; resolvedAttack: number; playedCard: number };
type Input = {
  schemaVersion: 1; profile: typeof PROFILE; policies: Policy;
  genericOnly: true; isTutorial: false; winner: -1;
  firstTeam: Team; attacker: MaybeTeam; currentTopic: Topic;
  characters: Pair<Character>; rawDraws: RawDraw[];
};
type State = {
  genericOnly: true; isTutorial: false; winner: MaybeTeam;
  firstTeam: Team; attacker: MaybeTeam; currentTopic: Topic; characters: Pair<Character>;
};
type Write = {
  index: number; stage: 'attack' | 'effect'; kind: 'draw' | 'ignore' | 'topic' | 'shout' | 'compose' | 'agitate';
  actor: MaybeTeam; target: Team; reflected: boolean;
  requestedHpDelta: number; requestedStressDelta: number;
  hpBefore: number; hpAfter: number; stressBefore: number; stressAfter: number;
};
type EffectVisit = { team: Team; card: number; kind: 'none' | 'compose' | 'agitate' };
type Receipt = {
  sequence: ['Attack', 'Effect', 'CalcWinner'];
  attackBranch: 'draw' | 'ignore' | 'sophistry-ordinary' | 'sophistry-no-ordinary' | 'shout' | 'default-topic';
  hpDamage: DebateHpDamageSuccessV1 | null;
  writes: Write[]; effects: EffectVisit[];
  opponentEffectSuppressed: boolean; effectsSkippedForDraw: boolean;
  afterAttack: Pair<Character>; afterEffects: Pair<Character>;
  consumedDraws: 0 | 1; externalRngConsumed: 0;
  winnerCheck: { firstTeam: Team; opponentTeam: Team; firstHp: number; opponentHp: number; winner: MaybeTeam };
};
type Success = { ok: true; schemaVersion: 1; profile: typeof PROFILE; policy: Policy; evidence: Evidence; state: State; nextCheckpoint: 'ready-for-anger' | 'terminal-pending-classification'; receipt: Receipt };
type FailureReason = 'unsupported-runtime' | 'input-limit' | 'malformed-data' | 'unknown-field' | 'unsupported-profile' | 'unsupported-policy' | 'invalid-checkpoint' | 'invalid-character' | 'invalid-current-topic' | 'invalid-raw-draws' | 'invalid-draw' | 'invalid-draw-role' | 'invalid-draw-bound' | 'invalid-draw-value' | 'draw-count-mismatch' | 'hp-damage-failed';
type Failure = { ok: false; reason: FailureReason; dependencyFailure?: DebateHpDamageFailureV1 };
type Result = Success | Failure;
export type DebateAttackEffectCharacterV1 = Frozen<Character>;
export type DebateAttackEffectInputV1 = Frozen<Input>;
export type DebateAttackEffectStateV1 = Frozen<State>;
export type DebateAttackEffectWriteV1 = Frozen<Write>;
export type DebateAttackEffectReceiptV1 = Frozen<Receipt>;
export type DebateAttackEffectSuccessV1 = Frozen<Success>;
export type DebateAttackEffectFailureV1 = Frozen<Failure>;
export type DebateAttackEffectFailureReasonV1 = FailureReason;
export type DebateAttackEffectResultV1 = Frozen<Result>;
export type DebateAttackEffectPolicyV1 = Frozen<Policy>;
export type DebateAttackEffectEvidenceV1 = Frozen<Evidence>;

class Invalid extends Error {
  readonly reason: FailureReason;
  readonly dependencyFailure: DebateHpDamageFailureV1 | undefined;
  constructor(reason: FailureReason, dependencyFailure?: DebateHpDamageFailureV1) {
    super(reason);
    this.reason = reason;
    this.dependencyFailure = dependencyFailure;
  }
}
function fail(reason: FailureReason): never { throw new Invalid(reason); }
function failure(error: unknown): Failure {
  if (!(error instanceof Invalid)) return { ok: false, reason: 'malformed-data' };
  return error.dependencyFailure ? { ok: false, reason: error.reason, dependencyFailure: error.dependencyFailure } : { ok: false, reason: error.reason };
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
function parseCharacter(value: unknown): Character {
  const r = object(value, ['personality', 'angerTimer', 'hp', 'stress', 'resolvedAttack', 'playedCard'], 'invalid-character');
  if (r.personality !== 'timid' && r.personality !== 'calm' && r.personality !== 'bold' && r.personality !== 'reckless') fail('invalid-character');
  return {
    personality: r.personality,
    angerTimer: integer(r.angerTimer, 0, 4, 'invalid-character'),
    hp: integer(r.hp, 1, 1000, 'invalid-character'),
    stress: integer(r.stress, 0, 100, 'invalid-character'),
    resolvedAttack: integer(r.resolvedAttack, 70, 227, 'invalid-character'),
    playedCard: integer(r.playedCard, 1, 14, 'invalid-character'),
  };
}
function parseInput(value: unknown): Input {
  const r = object(value, ['schemaVersion', 'profile', 'policies', 'genericOnly', 'isTutorial', 'winner', 'firstTeam', 'attacker', 'currentTopic', 'characters', 'rawDraws']);
  if (r.schemaVersion !== 1 || r.profile !== PROFILE) fail('unsupported-profile');
  if (canonical(r.policies) !== canonical(POLICY)) fail('unsupported-policy');
  if (r.genericOnly !== true || r.isTutorial !== false || r.winner !== -1) fail('invalid-checkpoint');
  const firstTeam = integer(r.firstTeam, 0, 1, 'invalid-checkpoint') as Team;
  const attacker = integer(r.attacker, -1, 1, 'invalid-checkpoint') as MaybeTeam;
  const currentTopic = integer(r.currentTopic, 0, 2, 'invalid-current-topic') as Topic;
  if (!Array.isArray(r.characters) || r.characters.length !== 2) fail('invalid-character');
  const characters: Pair<Character> = [parseCharacter(r.characters[0]), parseCharacter(r.characters[1])];
  if (!Array.isArray(r.rawDraws) || r.rawDraws.length > 1) fail('invalid-raw-draws');
  const rawDraws = r.rawDraws.map(parseDraw);
  return { schemaVersion: 1, profile: PROFILE, policies: POLICY, genericOnly: true, isTutorial: false, winner: -1, firstTeam, attacker, currentTopic, characters, rawDraws };
}
const other = (team: Team): Team => team === 0 ? 1 : 0;
const ordinary = (card: number): boolean => card >= 1 && card <= 9;
function stressDamage(card: number): number { return card === 10 ? 15 : ordinary(card) ? [10, 15, 20][(card - 1) % 3]! : 0; }
function snapshot(characters: Pair<Character>): Pair<Character> { return [{ ...characters[0] }, { ...characters[1] }]; }
function resolve(input: Input): Success {
  const characters = snapshot(input.characters);
  const writes: Write[] = [];
  const effects: EffectVisit[] = [];
  let hpDamage: DebateHpDamageSuccessV1 | null = null;
  const actor = input.attacker;
  const card = actor === -1 ? null : characters[actor].playedCard;
  const opponent = actor === -1 ? null : other(actor);
  const opponentCard = opponent === null ? null : characters[opponent].playedCard;
  const needsHp = actor !== -1 && card !== 12 && (card !== 11 || ordinary(opponentCard!));
  // Reject missing/unused supplied randomness before any domain writes/calls.
  if (input.rawDraws.length !== (needsHp ? 1 : 0)) fail('draw-count-mismatch');
  if (needsHp) {
    const attacking = characters[actor as Team];
    const result = evaluateDebateHpDamage({
      schemaVersion: 1, profile: 'debate-hp-damage-reference-v1', policies: DEBATE_HP_DAMAGE_POLICY_V1,
      genericOnly: true, personality: attacking.personality, angerTimer: attacking.angerTimer,
      resolvedAttack: attacking.resolvedAttack, currentTopic: input.currentTopic,
      card: card === 11 ? opponentCard : card, rawDraws: input.rawDraws,
    });
    if (!result.ok) throw new Invalid('hp-damage-failed', result);
    hpDamage = result;
  }
  function write(stage: Write['stage'], kind: Write['kind'], source: MaybeTeam, target: Team, reflected: boolean, hpDelta: number, stressDelta: number): void {
    const c = characters[target];
    const hpBefore = c.hp, stressBefore = c.stress;
    c.hp = Math.min(1000, Math.max(-100, c.hp + hpDelta));
    c.stress = Math.min(100, Math.max(0, c.stress + stressDelta));
    writes.push({ index: writes.length, stage, kind, actor: source, target, reflected, requestedHpDelta: hpDelta, requestedStressDelta: stressDelta, hpBefore, hpAfter: c.hp, stressBefore, stressAfter: c.stress });
  }
  let attackBranch: Receipt['attackBranch'];
  if (actor === -1) {
    attackBranch = 'draw';
    write('attack', 'draw', -1, 0, false, 0, 15);
    write('attack', 'draw', -1, 1, false, 0, 15);
  } else if (card === 12) {
    attackBranch = 'ignore';
    write('attack', 'ignore', actor, opponent!, false, 0, 30);
  } else if (card === 11) {
    attackBranch = needsHp ? 'sophistry-ordinary' : 'sophistry-no-ordinary';
    if (hpDamage && hpDamage.requestedHpDamage > 0) {
      // Source TopicCard(opponentTeam, opponentCard, ..., true): the original
      // card owner is both displayed source and actual reflected target.
      write('attack', 'topic', opponent!, opponent!, true, -hpDamage.requestedHpDamage, stressDamage(opponentCard!));
    }
  } else {
    attackBranch = card === 10 ? 'shout' : 'default-topic';
    write('attack', card === 10 ? 'shout' : 'topic', actor, opponent!, false, hpDamage!.requestedHpDamage === 0 ? 0 : -hpDamage!.requestedHpDamage, stressDamage(card!));
  }
  const afterAttack = snapshot(characters);
  function effect(team: Team): void {
    const c = characters[team].playedCard, enemy = other(team);
    const reflected = characters[enemy].playedCard === 11;
    const kind = c === 13 ? 'compose' : c === 14 ? 'agitate' : 'none';
    effects.push({ team, card: c, kind });
    if (c === 13) {
      // Magnitude uses current opponent stress even when destination is self.
      const delta = -Math.max(Math.trunc(characters[enemy].stress / 2), 30);
      write('effect', 'compose', team, reflected ? team : enemy, reflected, 0, delta);
    } else if (c === 14) {
      write('effect', 'agitate', team, reflected ? enemy : team, reflected, 0, 40);
    }
  }
  if (actor !== -1) {
    effect(actor);
    if (card !== 12) effect(opponent!);
  }
  const afterEffects = snapshot(characters);
  const first = input.firstTeam, second = other(first);
  const winner: MaybeTeam = characters[second].hp <= 0 ? first : characters[first].hp <= 0 ? second : -1;
  return {
    ok: true, schemaVersion: 1, profile: PROFILE, policy: POLICY, evidence: EVIDENCE,
    state: { genericOnly: true, isTutorial: false, winner, firstTeam: first, attacker: actor, currentTopic: input.currentTopic, characters },
    nextCheckpoint: winner === -1 ? 'ready-for-anger' : 'terminal-pending-classification',
    receipt: {
      sequence: ['Attack', 'Effect', 'CalcWinner'], attackBranch, hpDamage, writes, effects,
      opponentEffectSuppressed: actor !== -1 && card === 12, effectsSkippedForDraw: actor === -1,
      afterAttack, afterEffects, consumedDraws: needsHp ? 1 : 0, externalRngConsumed: 0,
      winnerCheck: { firstTeam: first, opponentTeam: second, firstHp: characters[first].hp, opponentHp: characters[second].hp, winner },
    },
  };
}
export const DEBATE_ATTACK_EFFECT_POLICY_V1: DebateAttackEffectPolicyV1 = freeze(POLICY);
export const DEBATE_ATTACK_EFFECT_EVIDENCE_V1: DebateAttackEffectEvidenceV1 = freeze(EVIDENCE);
/** One detached transaction. Failure exposes neither partial state nor receipt. */
export function evaluateDebateAttackEffect(input: unknown): DebateAttackEffectResultV1 {
  try { return freeze(resolve(parseInput(detach(input)))); }
  catch (error) { return freeze(failure(error)); }
}
