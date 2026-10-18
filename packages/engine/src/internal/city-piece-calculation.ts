/** Pure piece adapter; observations retain the legacy three-kernel order. */
import { calculateProductionTimeProjection } from '../production-time.ts';
import { emptyCalculation, freezeOwned, productionPrice, productionQuantity, retainKernel } from './city-domestic-leaves.ts';
import type { DeepRO } from './city-service-types.ts';
import type { PieceCalculation, PieceCalculationAction, PieceCalculationFrame, PieceCalculationResult, PieceTimeCapture, PieceTimeInput } from './city-piece-types.ts';

/** Inputs already belong to the legacy owner's validated piece domain. */
export function calculatePieceProduction(frame: DeepRO<PieceCalculationFrame>, action: DeepRO<PieceCalculationAction>): DeepRO<PieceCalculationResult> {
  const calc = emptyCalculation(), t = action.equipmentType;
  calc.selectedOfficerIds = frame.people.map(o => o.id);
  const price = productionPrice(frame.basePriceWord, frame.specialty, calc); if (!price.ok) return price;
  const quantity = productionQuantity({ kind: 'piece', equipmentType: t }, calc); if (!quantity.ok) return quantity;
  const captures: PieceTimeCapture[] = [];
  for (const slotIndex of [0, 1, 2] as const) {
    const o = frame.people[slotIndex];
    captures.push({ callAddress: '005C6CF8', slotIndex, eax: o ? 1 : 0 });
    if (o) captures.push({ callAddress: '005C6D06', slotIndex, eax: o.intelligence }, { callAddress: '005C6D25', slotIndex, eax: o.skillIds.includes(t <= 8 ? 82 : 83) ? 1 : 0 });
  }
  if (t >= 10) {
    for (const callAddress of ['005C6D90', '005C6DAA', '005C6DB0', '005C6DCA', '005C6DD1'] as const) captures.push({ callAddress, eax: 1 });
    captures.push({ callAddress: '005C6DDE', eax: frame.drillGroundComplete ? 1 : 0 });
  }
  const timeInput: PieceTimeInput = { profile: 'production-time-observations-v1', nativeEquipmentType: t, captures };
  const time = retainKernel(calc, 'calculateProductionTimeProjection', timeInput, calculateProductionTimeProjection(timeInput)); if (!time.ok) return time;
  const raw = time.value.returnedValue; calc.timeKernelReturn = raw; calc.facilityApplied = time.value.facilityApplied;
  if (raw <= 0 && frame.timePolicy.parameters.nonpositive === 'reject') return { ok: false, reason: 'unsupported-nonpositive-production-time' };
  // This successful piece call retains price, one-piece quantity, then duration,
  // with only top-level evidence removed by the existing leaf. Narrow privately;
  // do not add a runtime gate or project away any retained audit fields.
  return freezeOwned<PieceCalculationResult>({ ok: true, value: {
    price: price.value, quantity: quantity.value as 1, duration: Math.max(1, raw), calculation: calc as PieceCalculation,
  } });
}
