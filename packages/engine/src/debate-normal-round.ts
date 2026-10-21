/**
 * Internal shared normal/no-anger six-kind combat core. Not a public session API.
 * Extracted from Rethink without changing its public DTO, policy, evidence or saves.
 * Callers own safe input detachment, precombat actions, fill, trailing-draw checks,
 * persistence and budgets. Only the consumed combat prefix is read here.
 */
import type {
  RethinkDebatePolicyV1, RethinkDebatePlayV1, RethinkDebateDamageV1,
  RethinkDebateEffectV1, RethinkDebateReceiptV1, RethinkDebateOutcomeV1,
  RethinkDebateRawDrawV1, RethinkDebateCardV1,
} from './rethink-debate.ts';
type Mutable<T> = T extends object ? { -readonly [K in keyof T]: Mutable<T[K]> } : T;
type Pair<T> = [T, T];
type Topic = 'story' | 'logic' | 'trend';
type Card = Mutable<RethinkDebateCardV1>;
type TopicCard = Extract<Card, { kind: 'topic' }>;
type ShoutCard = Extract<Card, { kind: 'shout' }>;
type Play = Mutable<RethinkDebatePlayV1>;
type Damage = Mutable<RethinkDebateDamageV1>;
type Effect = Mutable<RethinkDebateEffectV1>;
type Receipt = Mutable<RethinkDebateReceiptV1>;
type Outcome = Mutable<RethinkDebateOutcomeV1>;
type TopicReroll = Receipt['topicReroll'];
type RawDraw = Mutable<RethinkDebateRawDrawV1>;
type CombatState = { id: string; hp: number; stress: number; crumbledLevel: number };
type CandidateDraw = { readonly role: string; readonly bound: number; readonly value: number };
const LEVELS = { small: { index: 0, damage: 10, stress: 10 }, medium: { index: 1, damage: 15, stress: 15 }, large: { index: 2, damage: 20, stress: 20 } } as const;
class Invalid extends Error { readonly reason: string; constructor(reason: string) { super(reason); this.reason = reason; } }
function fail(reason: string): never { throw new Invalid(reason); }
function clone<T>(value: T): T { return JSON.parse(JSON.stringify(value)) as T; }
function div(n: bigint, d: bigint): number { return Number(n / d); }
function clamp(n: number, low: number, high: number): number { return Math.max(low, Math.min(high, n)); }
/** Trusted internal DTOs only; input participants are copied before any writes. */
export function resolveNormalDebateRound<T extends CombatState>(
  s: { currentTopic: Topic; firstId: string }, inputParticipants: Pair<T>,
  plays: Pair<Play>, rawDraws: readonly CandidateDraw[], POLICY: Pick<RethinkDebatePolicyV1, 'cards' | 'shout' | 'ignore' | 'compose' | 'agitate' | 'arithmetic' | 'anger' | 'topic'>,
) {
  try {
  const participants = clone(inputParticipants), c = { rawDraws };
  const winner: 0 | 1 | null = plays[0].power === plays[1].power ? null : plays[0].power > plays[1].power ? 0 : 1;
  const ignoreWins = winner !== null && plays[winner].card.kind === 'ignore';
  const consumedDraws: RawDraw[] = [];
  function draw(role: RawDraw['role']): RawDraw {
    const next = c.rawDraws[consumedDraws.length];
    if (!next || next.role !== role || next.bound !== (role === 'psychological-damage-jitter' ? 5 : 3)) fail('draw-shape');
    if (!Number.isSafeInteger(next.value) || Object.is(next.value, -0) || next.value < 0 || next.value >= next.bound) fail('draw-range');
    const value = clone(next) as RawDraw; consumedDraws.push(value); return value;
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
  return { ok: true as const, participants, winner, requestedDamage, requestedAttackStress,
    requestedEffectStress, damage, afterAttackStress, effects, effectOrder, effectSkipReason,
    outcome, currentTopic, firstId, topicReroll, consumedDraws, attackDrawCount, attackNoDrawReason };
  } catch (error) {
    return { ok: false as const, reason: error instanceof Invalid ? error.reason : 'malformed-data' };
  }
}
