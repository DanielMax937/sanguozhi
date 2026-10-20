/** Private, single-action reduction over an owner-supplied detached view. */
import { ACCUMULATE, DEBIT, NOT_MODELED, copyOwned, emptyCalculation, facilityFactor, freezeOwned, planRewards, productionPrice, productionQuantity, recruitQuantity, recruitmentSecurityArgument, rejectDomestic, writeDomestic } from './city-domestic-leaves.ts';
import type { DeepRO, DomesticInstantAction, DomesticInstantFrame, DomesticResult, Facility, FacilityKind, Fees, InstantContext, Officer, Reward, RewardPlan } from './city-service-types.ts';
import { applyPatrolPhase } from './city-patrol-phase.ts';

function applyRewardPlan(people: Officer[], plan: RewardPlan): Reward[] {
  for (let i = 0; i < people.length; i++) { const progress = plan.progress[i]!; people[i]!.xp[progress.attribute] = progress.xp; people[i]!.merit = progress.merit; }
  return plan.rewards;
}

/** This is not an input validator, trusted-state factory or package entrypoint. */
export function reduceDomesticInstant(context: DeepRO<InstantContext>, frame: DeepRO<DomesticInstantFrame>, action: DeepRO<DomesticInstantAction>): DeepRO<DomesticResult> {
  const s = copyOwned<DomesticInstantFrame>(frame), c = copyOwned<DomesticInstantAction>(action), ctx = copyOwned<InstantContext>(context), calc = emptyCalculation();
  if (c.type === 'Patrol') {
    const result = applyPatrolPhase(ctx, s, c, calc); if (!result.ok) return result;
    return freezeOwned<DomesticResult>({ ok: true, candidate: s, audit: result.value });
  }
  if (c.cityId !== s.city.id) return rejectDomestic('unknown-city');
  const people: Officer[] = [];
  for (const oid of c.officerIds) {
    const o = s.officers.find(x => x.id === oid); if (!o) return rejectDomestic('unknown-officer');
    if (o.forceId !== s.activeForceId) return rejectDomestic('officer-not-member'); if (o.cityId !== s.city.id) return rejectDomestic('officer-not-present');
    if (!o.available) return rejectDomestic('officer-unavailable'); if (o.reservationJobId !== null) return rejectDomestic('officer-production-reserved'); if (o.actedTurn === ctx.turn) return rejectDomestic('officer-already-acted'); people.push(o);
  }
  calc.selectedOfficerIds = [...c.officerIds];
  let facility: Facility | null = null;
  {
    facility = s.facilities.find(f => f.id === c.facilityId) ?? null; if (!facility) return rejectDomestic('unknown-facility');
    if (facility.cityId !== s.city.id) return rejectDomestic('facility-not-present'); if (!facility.complete) return rejectDomestic('facility-incomplete');
    const kind: FacilityKind = c.type === 'Recruit' ? 'barracks' : c.equipmentType <= 3 ? 'forge' : 'stable';
    if (facility.kind !== kind) return rejectDomestic('wrong-facility-kind'); if (facility.reservationJobId !== null) return rejectDomestic('facility-production-reserved'); if (facility.usedTurn === ctx.turn) return rejectDomestic('facility-used-this-turn');
  }
  let gold = 300, ap = 20, yieldActual = 0;
  let rewards: Reward[];
  if (c.type === 'Recruit') {
    const earlyCharmSum = people.reduce((sum, o) => sum + o.charm, 0), oldSecurity = s.city.security, oldTroops = s.city.troops, oldMorale = s.city.morale;
    calc.earlyCharmSum = earlyCharmSum; calc.moraleSecuritySnapshot = oldSecurity;
    const quantity = recruitQuantity(s, people, facilityFactor(facility!, s.policies.facilityMultiplier), calc); if (!quantity.ok) return quantity;
    const troop = writeDomestic(oldTroops, quantity.value, s.city.troopCapacity, s.policies.writer); if (!troop.ok) return troop; const troopWrite = troop.value; calc.troopWrite = troopWrite;
    const result = recruitmentSecurityArgument(earlyCharmSum, troopWrite.returned, calc); if (!result.ok) return result;
    const security = writeDomestic(oldSecurity, result.value, 100, s.policies.writer); if (!security.ok) return security; const securityWrite = security.value; calc.securityWrite = securityWrite;
    const newMorale = Math.floor(oldSecurity / 2), a = troopWrite.actualDelta; calc.newRecruitMorale = newMorale;
    const total = oldTroops + a, raw = total > 0 ? (oldTroops * oldMorale + a * newMorale) / total : oldMorale;
    const rounded = s.policies.morale.parameters.rounding === 'ceil' ? Math.ceil(raw) : Math.floor(raw);
    const morale = Math.min(s.city.moraleCap, Math.max(s.policies.morale.parameters.minimum as number, rounded));
    const moraleResult = writeDomestic(oldMorale, morale - oldMorale, s.city.moraleCap, ACCUMULATE); if (!moraleResult.ok) return moraleResult; calc.moraleWrite = moraleResult.value; calc.moraleWrite.policyId = s.policies.morale.id;
    s.city.troops = troopWrite.after; s.city.security = securityWrite.after; s.city.morale = morale; yieldActual = a;
    const reward = planRewards(people, 'recruit', s.policies.rewards); if (!reward.ok) return reward; rewards = applyRewardPlan(people, reward.value);
  } else {
    if (!s.unlockedEquipmentTypes.includes(c.equipmentType)) return rejectDomestic('equipment-locked');
    const t = c.equipmentType;
    const price = productionPrice(s.productionPrices[t].basePriceWord, s.specialtyEquipmentTypes.includes(t), calc); if (!price.ok) return price;
    const quantity = productionQuantity({ kind: 'quantity', equipmentType: t, people, factor: facilityFactor(facility!, s.policies.facilityMultiplier), difficulty: s.difficulty, controller: s.controller }, calc); if (!quantity.ok) return quantity;
    gold = price.value; ap = s.policies.productionAp.parameters.quantity as number;
    const stock = s.city.inventory[t];
    const written = writeDomestic(stock.quantity, quantity.value, stock.capacity - stock.reserved, s.policies.writer); if (!written.ok) return written; const w = written.value;
    calc.inventoryWrite = w; stock.quantity = w.after; yieldActual = w.actualDelta;
    const reward = planRewards(people, 'quantity', s.policies.rewards); if (!reward.ok) return reward; rewards = applyRewardPlan(people, reward.value);
  }
  if (yieldActual === 0 && s.policies.zeroYield.parameters.zero === 'reject') return rejectDomestic('zero-yield');
  if (s.city.gold < gold) return rejectDomestic('insufficient-gold'); if (s.corps.actionPoints < ap) return rejectDomestic('insufficient-ap');
  const goldFee = writeDomestic(s.city.gold, -gold || 0, 1_000_000_000, DEBIT); if (!goldFee.ok) return goldFee;
  const apFee = writeDomestic(s.corps.actionPoints, -ap, 255, DEBIT); if (!apFee.ok) return apFee;
  const fees: Fees = { gold: goldFee.value, actionPoints: apFee.value, sourceApRequest: 20, effectiveApCost: ap };
  s.city.gold = fees.gold.after; s.corps.actionPoints = fees.actionPoints.after;
  for (const o of people) o.actedTurn = ctx.turn; if (facility) facility.usedTurn = ctx.turn;
  return freezeOwned<DomesticResult>({ ok: true, candidate: s, audit: { calculation: calc, fees, rewards, events: [{ type: 'command-committed', subjectId: ctx.commandId }], sideEffectsNotModeled: [...NOT_MODELED], rngDraws: 0 } });
}
