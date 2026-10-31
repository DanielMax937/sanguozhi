/** Named design inferences, never native outcomes or campaign/world mutations. */
const evidence = 'explicit-design-inference' as const;
const worldEffectsApplied = false as const;
const fail = (reason: string) => Object.freeze({ ok: false as const, reason });
const uint = (v: unknown, max: number): v is number => typeof v === 'number' && Number.isSafeInteger(v) && !Object.is(v, -0) && v >= 0 && v <= max;
const boolean = (v: unknown): v is boolean => typeof v === 'boolean';

function strategyHit(kind: 'fire' | 'ambush' | 'discord' | 'sorcery', intelligence: number, targetIntelligence: number, roll100: number, eligibilityConfirmed: boolean, immune: boolean, guaranteed: boolean, beautyBonus: boolean, maxIntelligence:100|255) {
  if (!['fire', 'ambush', 'discord', 'sorcery'].includes(kind) || !uint(intelligence, maxIntelligence) || !uint(targetIntelligence, maxIntelligence) || !uint(roll100, 99)
    || ![eligibilityConfirmed, immune, guaranteed, beautyBonus].every(boolean)) return fail('invalid-input');
  if (!eligibilityConfirmed) return fail('eligibility-not-established');
  const base = kind === 'fire' ? 70 : kind === 'ambush' ? 60 : kind === 'discord' ? 40 : 30;
  const beforeSkill = Math.min(95, Math.max(5, base + Math.floor((intelligence - targetIntelligence) / 2)));
  const ordinaryRate = Math.min(95, beforeSkill * (beautyBonus && kind !== 'sorcery' ? 2 : 1));
  const rate = immune ? 0 : guaranteed ? 100 : ordinaryRate;
  return Object.freeze({ ok: true as const, policyId: maxIntelligence===100?'inferred-strategy-intelligence-linear-v1':'inferred-strategy-intelligence-linear255-v1', evidence, worldEffectsApplied,
    kind, base, beforeSkill, ordinaryRate, rate, roll100, hit: roll100 < rate,
    resolvedBranch: immune ? 'immunity' as const : guaranteed ? 'guaranteed' as const : 'ordinary-roll' as const });
}
export function decideInferredStrategyHit(kind: 'fire' | 'ambush' | 'discord' | 'sorcery', intelligence: number, targetIntelligence: number, roll100: number, eligibilityConfirmed: boolean, immune: boolean, guaranteed: boolean, beautyBonus: boolean) { return strategyHit(kind,intelligence,targetIntelligence,roll100,eligibilityConfirmed,immune,guaranteed,beautyBonus,100); }
export function decideInferredStrategyHitEffective255(kind: 'fire' | 'ambush' | 'discord' | 'sorcery', intelligence: number, targetIntelligence: number, roll100: number, eligibilityConfirmed: boolean, immune: boolean, guaranteed: boolean, beautyBonus: boolean) { return strategyHit(kind,intelligence,targetIntelligence,roll100,eligibilityConfirmed,immune,guaranteed,beautyBonus,255); }

export function projectInferredStandingFire(draw201: number, ordinaryNoModifiers: boolean) {
  if (!uint(draw201, 200) || !boolean(ordinaryNoModifiers)) return fail('invalid-input');
  if (!ordinaryNoModifiers) return fail('unsupported-fire-modifiers');
  return Object.freeze({ ok: true as const, policyId: 'inferred-ordinary-standing-fire-v1', evidence, worldEffectsApplied,
    draw201, requestedDamage: 300 + draw201, criticalApplied: false as const });
}

export function projectInferredRockfall(target: 'troop' | 'building', draw: number, pathbreaker: boolean) {
  if (!['troop', 'building'].includes(target) || !boolean(pathbreaker) || !uint(draw, target === 'troop' ? 499 : 999)) return fail('invalid-input');
  if (target === 'building' && pathbreaker) return fail('building-pathbreaker-not-supported');
  const rawDamage = (target === 'troop' ? 1500 : 800) + draw;
  return Object.freeze({ ok: true as const, policyId: 'inferred-dedicated-rockfall-no-common50-v1', evidence, worldEffectsApplied,
    target, draw, rawDamage, pathbreaker, requestedDamage: pathbreaker ? Math.floor(rawDamage / 10) : rawDamage,
    commonBase50Participation: 'assumed-not-added' as const });
}

export function projectInferredGovernorCounterattack(baseDamage: number, governorWar: number) {
  if (!uint(baseDamage, Number.MAX_SAFE_INTEGER) || !uint(governorWar, 100)) return fail('invalid-input');
  const numerator = 100 + Math.max(governorWar - 65, 0);
  const requested = BigInt(baseDamage) * BigInt(numerator) / 100n;
  if (requested > BigInt(Number.MAX_SAFE_INTEGER)) return fail('result-overflow');
  return Object.freeze({ ok: true as const, policyId: 'inferred-governor-war-above65-linear-v1', evidence, worldEffectsApplied,
    baseDamage, governorWar, numerator, denominator: 100, requestedDamage: Number(requested) });
}

/** Gate/port only; no dam inference, cap, actual repair, or governor resolution. */
export function projectInferredGatePortRepair(governorPolitics: number, governorPresent: boolean) {
  if (!uint(governorPolitics, 100) || !boolean(governorPresent)) return fail('invalid-input');
  const basis = Math.min(450, Math.max(150, Math.floor(9 * governorPolitics / 2)));
  return Object.freeze({ ok: true as const, policyId: 'inferred-gate-port-ordinary-repair-extrapolation-v1', evidence, worldEffectsApplied,
    governorPolitics, governorPresent, basis, requestedRepair: governorPresent ? Math.floor(3 * basis / 20) : 0 });
}

/** An explicitly synthetic initial scalar. Does not hire or change allegiance. */
export function projectInferredInitialLoyalty() {
  return Object.freeze({ ok: true as const, policyId: 'inferred-initial-loyalty-neutral80-v1', evidence, worldEffectsApplied,
    requestedLoyalty: 80, sourceEstimated: false as const, charismaOrAffinityModeled: false as const });
}

export function decideInferredRaidRequest(kind: 'bandit' | 'tribal', security: number, roll1000: number, eligibilityConfirmed: boolean) {
  if (!['bandit', 'tribal'].includes(kind) || !uint(security, 100) || !uint(roll1000, 999) || !boolean(eligibilityConfirmed)) return fail('invalid-input');
  if (!eligibilityConfirmed) return fail('eligibility-not-established');
  const threshold = security >= 80 ? 0 : kind === 'bandit' ? 100 - security : 10;
  const selected = roll1000 < threshold;
  return Object.freeze({ ok: true as const, policyId: 'inferred-monthly-small-raid-request-v1', evidence, worldEffectsApplied,
    kind, security, threshold, denominator: 1000, roll1000, selected, requestKind: 'new-threat-template-not-existing-base-refresh' as const,
    requestedTroops: selected ? 3000 : 0, requestedUnits: selected ? 1 : 0,
    equipmentResolved: false as const, spawnPositionResolved: false as const, nativeEligibilityEstablished: false as const });
}

/** Bounded transfer request only; integer tenths are an inferred RNG discretization. */
export function projectInferredFoodRaid(attackPanel: number, ownTroops: number, targetFood: number, ownFood: number, foodCapacity: number, draw11: number, eligibleActiveSpearAttack: boolean) {
  if (![attackPanel, ownTroops, targetFood, ownFood, foodCapacity].every(v => uint(v, Number.MAX_SAFE_INTEGER)) || !uint(draw11, 10) || ownFood > foodCapacity || !boolean(eligibleActiveSpearAttack)) return fail('invalid-input');
  if (!eligibleActiveSpearAttack) return fail('active-spear-technique-target-eligibility-not-established');
  const rolled = BigInt(attackPanel) * BigInt(10 + draw11) / 10n;
  const cap = BigInt(ownTroops) / 2n;
  const requested = rolled < cap ? rolled : cap;
  const transfer = [requested, BigInt(targetFood), BigInt(foodCapacity - ownFood)].reduce((a, b) => a < b ? a : b);
  return Object.freeze({ ok: true as const, policyId: 'inferred-food-raid-tenths-conservative-transfer-v1', evidence, worldEffectsApplied,
    draw11, multiplierNumerator: 10 + draw11, multiplierDenominator: 10, requestedFood: Number(requested),
    proposedTransfer: Number(transfer), untransferredRequest: Number(requested - transfer),
    targetDebitRequest: Number(transfer), receiverCreditRequest: Number(transfer), nativeFinalizerEstablished: false as const });
}

