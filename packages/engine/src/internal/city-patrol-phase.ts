/** Private single Patrol phase; failure requires discarding the entire candidate. */
import { DEBIT, NOT_MODELED, patrolSecurityGain, planRewards, rejectDomestic, writeDomestic } from './city-domestic-leaves.ts';
import type { Calculation, DeepRO, Fees, InstantContext } from './city-service-types.ts';
import type { PatrolPhaseAction, PatrolPhaseOfficer, PatrolPhaseResult, PatrolPhaseView } from './city-patrol-phase-types.ts';

/** The owner supplies validated detached data and a fresh emptyCalculation result. */
export function applyPatrolPhase(context: DeepRO<InstantContext>, view: PatrolPhaseView, action: DeepRO<PatrolPhaseAction>, calculation: Calculation): PatrolPhaseResult {
  if (action.cityId !== view.city.id) return rejectDomestic('unknown-city');
  if (view.city.patrolUsedTurn === context.turn) return rejectDomestic('patrol-already-used');
  const people: PatrolPhaseOfficer[] = [];
  for (const oid of action.officerIds) {
    const o = view.officers.find(x => x.id === oid); if (!o) return rejectDomestic('unknown-officer');
    if (o.forceId !== view.activeForceId) return rejectDomestic('officer-not-member'); if (o.cityId !== view.city.id) return rejectDomestic('officer-not-present');
    if (!o.available) return rejectDomestic('officer-unavailable'); if (o.reservationJobId !== null) return rejectDomestic('officer-production-reserved'); if (o.actedTurn === context.turn) return rejectDomestic('officer-already-acted'); people.push(o);
  }
  calculation.selectedOfficerIds = [...action.officerIds];
  const result = patrolSecurityGain(people, view.city.security, view.pressureActive, calculation); if (!result.ok) return result;
  const written = writeDomestic(view.city.security, result.value, 100, view.policies.writer); if (!written.ok) return written; const w = written.value;
  calculation.securityWrite = w; view.city.security = w.after; const yieldActual = w.actualDelta;
  view.city.patrolUsedTurn = context.turn;
  const reward = planRewards(people, 'patrol', view.policies.rewards); if (!reward.ok) return reward;
  const plan = reward.value;
  for (let i = 0; i < people.length; i++) { const progress = plan.progress[i]!; people[i]!.xp[progress.attribute] = progress.xp; people[i]!.merit = progress.merit; }
  const rewards = plan.rewards;
  if (yieldActual === 0 && view.policies.zeroYield.parameters.zero === 'reject') return rejectDomestic('zero-yield');
  const gold = 100, ap = 20;
  if (view.city.gold < gold) return rejectDomestic('insufficient-gold'); if (view.corps.actionPoints < ap) return rejectDomestic('insufficient-ap');
  const goldFee = writeDomestic(view.city.gold, -gold || 0, 1_000_000_000, DEBIT); if (!goldFee.ok) return goldFee;
  const apFee = writeDomestic(view.corps.actionPoints, -ap, 255, DEBIT); if (!apFee.ok) return apFee;
  const fees: Fees = { gold: goldFee.value, actionPoints: apFee.value, sourceApRequest: 20, effectiveApCost: ap };
  view.city.gold = fees.gold.after; view.corps.actionPoints = fees.actionPoints.after;
  for (const o of people) o.actedTurn = context.turn;
  return { ok: true, value: { calculation, fees, rewards, events: [{ type: 'command-committed', subjectId: context.commandId }], sideEffectsNotModeled: [...NOT_MODELED], rngDraws: 0 } };
}
