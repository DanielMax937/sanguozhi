/** Private pure trade calculation. Public parsing, history, calendar and trust stay with the owner. */
import type { Catalog, DeepRO, Effect, Fraction, InstantContext, MerchantReason, MerchantReject, Position,
  MerchantResult, MerchantTradeAction, MerchantTradeAudit, MerchantTradeFrame, UnitCheck } from './city-merchant-types.ts';

type Value<T> = { ok: true; value: T } | MerchantReject;
function clone<T>(v: DeepRO<T>): T { return JSON.parse(JSON.stringify(v)) as T; }
function freeze<T>(v: T): DeepRO<T> { if (v !== null && typeof v === 'object' && !Object.isFrozen(v)) { for (const x of Object.values(v)) freeze(x); Object.freeze(v); } return v as DeepRO<T>; }
function reject(reason: MerchantReason): MerchantReject { return { ok: false, reason, blockingUnitId: null }; }
function politicsRange(p: number): MerchantReject | null {
  return typeof p !== 'number' || !Number.isSafeInteger(p) || Object.is(p, -0) || p < 20 || p > 100 ? reject('invalid-number') : null;
}
function fraction(n: bigint, d: bigint): Value<Fraction> {
  if (n < 0n || d <= 0n) return reject('invalid-rational');
  return { ok: true, value: { numerator: n.toString(), denominator: d.toString() } };
}
function politicsEffect(p: number, catalog: Catalog): Value<{ receipt: Effect; n: bigint; d: bigint }> {
  const invalid = politicsRange(p); if (invalid) return invalid;
  const exact = catalog.anchors.find(a => a.politics === p);
  const lower = exact ?? [...catalog.anchors].reverse().find(a => a.politics < p);
  const upper = exact ?? catalog.anchors.find(a => a.politics > p);
  if (!lower || !upper) return reject('unsupported-politics');
  const n = exact ? BigInt(exact.effectMillionths) : BigInt(lower.effectMillionths) * BigInt(upper.politics - p) + BigInt(upper.effectMillionths) * BigInt(p - lower.politics);
  const d = exact ? 1_000_000n : 1_000_000n * BigInt(upper.politics - lower.politics);
  const ratio = fraction(n, d); if (!ratio.ok) return ratio;
  return { ok: true, value: { n, d, receipt: { politics: p, lowerPolitics: lower.politics, upperPolitics: upper.politics, lowerEffectMillionths: lower.effectMillionths,
    upperEffectMillionths: upper.effectMillionths, fraction: ratio.value, interpolationPolicyId: catalog.version } } };
}
function unitChecks(before: MerchantTradeFrame): UnitCheck[] {
  return before.fieldUnits.map(u => { const dq = u.position.q - before.city.position.q, dr = u.position.r - before.city.position.r;
    const distance = Math.max(Math.abs(dq), Math.abs(dr), Math.abs(dq + dr)), hostile = before.hostileForceIds.includes(u.forceId);
    return { unitId: u.id, forceId: u.forceId, position: clone<Position>(u.position), hostile, distance, blocks: hostile && distance <= 2 }; });
}

/** Accept only views already detached and validated by a legacy owner; do not widen that public boundary. */
export function reduceMerchantTrade(context: DeepRO<InstantContext>, frame: DeepRO<MerchantTradeFrame>, action: DeepRO<MerchantTradeAction>): DeepRO<MerchantResult> {
  const ownedContext = clone<InstantContext>(context), before = clone<MerchantTradeFrame>(frame), c = clone<MerchantTradeAction>(action);
  const after = clone<MerchantTradeFrame>(before), p = before.policies, turn = ownedContext.turn;
  if (c.cityId !== before.city.id) return freeze(reject('city-mismatch'));
  if (before.city.kind !== 'city') return freeze(reject('unsupported-city-kind'));
  if (before.city.ownerForceId !== before.activeForceId || before.corps.forceId !== before.activeForceId) return freeze(reject('owner-corps-mismatch'));
  if (!before.city.merchantPresent) return freeze(reject('merchant-absent'));
  if (before.city.merchantUsedTurn === turn) return freeze(reject('city-merchant-already-used'));
  const actorIndex = before.officers.findIndex(o => o.id === c.officerId), actor = before.officers[actorIndex];
  if (!actor) return freeze(reject('officer-not-found'));
  if (actor.cityId !== before.city.id || actor.forceId !== before.activeForceId) return freeze(reject('officer-city-force-mismatch'));
  if (!actor.available) return freeze(reject('officer-unavailable'));
  if (actor.actedTurn === turn) return freeze(reject('officer-already-acted'));
  const invalidPolitics = politicsRange(actor.politics); if (invalidPolitics) return freeze(invalidPolitics);
  const checks = unitChecks(before), blocking = checks.find(u => u.blocks);
  if (blocking) return freeze({ ok: false, reason: 'hostile-within-two', blockingUnitId: blocking.unitId } as MerchantReject);
  if (before.corps.actionPoints < 20) return freeze(reject('insufficient-action-points'));
  const effectResult = politicsEffect(actor.politics, before.catalog); if (!effectResult.ok) return freeze(effectResult);
  const effect = effectResult.value, q = BigInt(c.foodAmount), ui = BigInt(before.city.uiTradePrice), buy = c.type === 'BuyFood';
  const n = buy ? q * effect.d : q * effect.n * 4n, d = buy ? ui * effect.n : ui * effect.d * 5n;
  const settled = buy ? (n + d - 1n) / d : n / d;
  if (!buy && settled === 0n) return freeze(reject('zero-value-sale'));
  if (settled < 0n || settled > 1_000_000_000n) return freeze(reject('gold-amount-out-of-range'));
  const gold = Number(settled);
  if (buy && before.city.gold < gold) return freeze(reject('insufficient-gold'));
  if (buy && before.city.food + c.foodAmount > before.city.foodCapacity) return freeze(reject('food-capacity-exceeded'));
  if (!buy && before.city.food < c.foodAmount) return freeze(reject('insufficient-food'));
  if (!buy && before.city.gold + gold > before.city.goldCapacity) return freeze(reject('gold-capacity-exceeded'));
  const goldDelta = buy ? -gold : gold, foodDelta = buy ? c.foodAmount : -c.foodAmount;
  after.city.gold += goldDelta; after.city.food += foodDelta; after.corps.actionPoints -= 20; after.city.merchantUsedTurn = turn;
  const changedActor = after.officers[actorIndex]!; changedActor.actedTurn = turn; changedActor.politicsXp = Math.min(1_000_000_000, actor.politicsXp + 5);
  const xpDelta = changedActor.politicsXp - actor.politicsXp;
  const actionPoints: MerchantTradeAudit['actionPoints'] = { before: before.corps.actionPoints, requestedDelta: -20, actualDelta: -20, after: after.corps.actionPoints, cap: 255, policyId: p.eligibility.id };
  // Keep fraction calls in their legacy receipt-expression order, after candidate writes and XP.
  const sellFactor = buy ? fraction(1n, 1n) : fraction(4n, 5n); if (!sellFactor.ok) return freeze(sellFactor);
  const exactGold = fraction(n, d); if (!exactGold.ok) return freeze(exactGold);
  const divisionRemainder = (n % d).toString();
  const roundingDifference = fraction(buy ? settled * d - n : n - settled * d, d); if (!roundingDifference.ok) return freeze(roundingDifference);
  const audit: MerchantTradeAudit = {
    ownerSnapshot: { activeForceId: before.activeForceId, ownerForceId: before.city.ownerForceId, corpsId: before.corps.id, corpsForceId: before.corps.forceId },
    actionPoints, fixedGoldFee: 0, meritDelta: 0, techniquePointsDelta: 0, loyaltyDelta: 0, rngDraws: 0,
    trade: { officerId: actor.id, direction: buy ? 'buy' : 'sell', priceScale: 'ui-food-per-gold', uiTradePrice: before.city.uiTradePrice,
      foodRequested: c.foodAmount, foodTransferred: c.foodAmount, politicsEffect: effect.receipt, sellFactor: sellFactor.value, exactGold: exactGold.value,
      rounding: buy ? 'ceil' : 'floor', divisionRemainder, roundingDifference: roundingDifference.value, settledGold: gold,
      eligibility: { merchantPresent: true, cityUsedBefore: before.city.merchantUsedTurn, actorActedBefore: actor.actedTurn, actorAvailable: true, completeSuppliedFieldUnits: true, unitChecks: checks },
      merchantUsedTurnAfter: turn, actorActedTurnAfter: turn,
      writes: [{ resource: 'gold', before: before.city.gold, requested: gold, actualDelta: goldDelta, after: after.city.gold, cap: before.city.goldCapacity, discarded: 0, policyId: p.capacity.id },
        { resource: 'food', before: before.city.food, requested: c.foodAmount, actualDelta: foodDelta, after: after.city.food, cap: before.city.foodCapacity, discarded: 0, policyId: p.capacity.id }],
      merchantCounterparty: { goldDelta: -goldDelta, foodDelta: -foodDelta, balanceMode: 'external-untracked' },
      politicsXp: { before: actor.politicsXp, requested: 5, actualDelta: xpDelta, after: changedActor.politicsXp, cap: 1000000000, discarded: 5 - xpDelta, politicsBefore: actor.politics, politicsAfter: changedActor.politics } }
  };
  return freeze({ ok: true, candidate: after, audit } as MerchantResult);
}
