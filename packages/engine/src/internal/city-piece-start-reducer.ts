/** Private start preparation and fee planning; the legacy owner commits both. */
import { DEBIT, copyOwned, freezeOwned, rejectDomestic, writeDomestic } from './city-domestic-leaves.ts';
import { calculatePieceProduction } from './city-piece-calculation.ts';
import type { DeepRO, Fees } from './city-service-types.ts';
import type { PieceCalculation, PieceStartAction, PieceStartContext, PieceStartFeeAction, PieceStartFeeFrame, PieceStartFeeResult, PieceStartFrame, PieceStartOfficer, PieceStartResult } from './city-piece-types.ts';

/** Preserve old eligibility and first-error order; this is not a public validator. */
export function planPieceStart(context: DeepRO<PieceStartContext>, frame: DeepRO<PieceStartFrame>, action: DeepRO<PieceStartAction>): DeepRO<PieceStartResult> {
  if (action.cityId !== frame.city.id) return rejectDomestic('unknown-city');
  const people: DeepRO<PieceStartOfficer>[] = [];
  for (const oid of action.officerIds) {
    const o = frame.officers.find(x => x.id === oid); if (!o) return rejectDomestic('unknown-officer');
    if (o.forceId !== frame.activeForceId) return rejectDomestic('officer-not-member'); if (o.cityId !== frame.city.id) return rejectDomestic('officer-not-present');
    if (!o.available) return rejectDomestic('officer-unavailable'); if (o.reservationJobId !== null) return rejectDomestic('officer-production-reserved'); if (o.actedTurn === context.turn) return rejectDomestic('officer-already-acted'); people.push(o);
  }
  const facility = frame.facilities.find(f => f.id === action.facilityId); if (!facility) return rejectDomestic('unknown-facility');
  if (facility.cityId !== frame.city.id) return rejectDomestic('facility-not-present'); if (!facility.complete) return rejectDomestic('facility-incomplete');
  const t = action.equipmentType, kind = t <= 8 ? 'workshop' : 'shipyard';
  if (facility.kind !== kind) return rejectDomestic('wrong-facility-kind'); if (facility.reservationJobId !== null) return rejectDomestic('facility-production-reserved'); if (facility.usedTurn === context.turn) return rejectDomestic('facility-used-this-turn');
  if (!frame.unlockedEquipmentTypes.includes(t)) return rejectDomestic('equipment-locked');
  const calculated = calculatePieceProduction({ people, basePriceWord: frame.productionPrices[t].basePriceWord,
    specialty: frame.specialtyEquipmentTypes.includes(t), drillGroundComplete: frame.city.drillGroundComplete, timePolicy: frame.policies.time }, { equipmentType: t });
  if (!calculated.ok) return calculated;
  const result = calculated.value, ap = frame.policies.productionAp.parameters.piece as number, stock = frame.city.inventory[t];
  if (frame.productionJobCount >= 4096) return { ok: false, reason: 'production-history-full' };
  if (stock.quantity + stock.reserved + result.quantity > stock.capacity) return { ok: false, reason: 'piece-capacity-unavailable' };
  const dueTurn = context.turn + result.duration;
  // Exactly the old uint(turn + duration) domain; no date/horizon reachability gate.
  if (typeof dueTurn !== 'number' || !Number.isSafeInteger(dueTurn) || Object.is(dueTurn, -0) || dueTurn < 0 || dueTurn > Number.MAX_SAFE_INTEGER) return { ok: false, reason: 'invalid-state' };
  return freezeOwned<PieceStartResult>({ ok: true, plan: {
    jobId: 'job:' + context.commandId, cityId: frame.city.id, facilityId: facility.id, officerIds: [...action.officerIds], equipmentType: t,
    startTurn: context.turn, remainingTurns: result.duration, dueTurn, durationTurns: result.duration, reservedQuantity: 1,
    quantityToReserve: result.quantity, goldCost: result.price, actionPointsCost: ap, calculation: copyOwned<PieceCalculation>(result.calculation),
  } });
}

/** Called only after the owner stages its original snapshot, job and reservations. */
export function planPieceStartFees(frame: DeepRO<PieceStartFeeFrame>, action: DeepRO<PieceStartFeeAction>): DeepRO<PieceStartFeeResult> {
  if (frame.gold < action.goldCost) return rejectDomestic('insufficient-gold'); if (frame.actionPoints < action.actionPointsCost) return rejectDomestic('insufficient-ap');
  const gold = writeDomestic(frame.gold, -action.goldCost || 0, 1_000_000_000, DEBIT); if (!gold.ok) return gold;
  const ap = writeDomestic(frame.actionPoints, -action.actionPointsCost, 255, DEBIT); if (!ap.ok) return ap;
  const fees: Fees = { gold: gold.value, actionPoints: ap.value, sourceApRequest: 20, effectiveApCost: action.actionPointsCost };
  return freezeOwned<PieceStartFeeResult>({ ok: true, value: { goldAfter: fees.gold.after, actionPointsAfter: fees.actionPoints.after, fees } });
}
