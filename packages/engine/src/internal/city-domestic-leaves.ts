/** Pure service math shared by instant actions and the legacy piece owner. */
import { calculatePatrolSecurityGain } from '../patrol-security-gain.ts';
import { calculateRecruitmentQuantityProjection } from '../recruitment-quantity.ts';
import type { RecruitmentQuantityCapture, RecruitmentQuantityFactorBits } from '../recruitment-quantity.ts';
import { calculateRecruitmentSecurityArgument } from '../recruitment-security-argument.ts';
import { calculateProductionPrice } from '../production-price.ts';
import { calculateProductionQuantity } from '../production-quantity.ts';
import type { ProductionQuantitySlot } from '../production-quantity.ts';
import type { Calculation, DeepRO, DomesticInstantFrame, DomesticLeafResult, DomesticReason, DomesticReject, Facility, Officer, PieceEquipment, Policy, QuantityEquipment, RewardPlan, Stat, Write } from './city-service-types.ts';

export const NOT_MODELED = Object.freeze(['technique-points', 'native-stat-growth', 'native-writer-semantics', 'native-personnel-tasks', 'native-corps-effects', 'presentation-rng'] as const);
export const ACCUMULATE: DeepRO<Policy> = Object.freeze({ id: 'saturating-accumulator-v1', version: 1, parameters: Object.freeze({ overflow: 'clip', returned: 'actual-delta' }) });
export const DEBIT: DeepRO<Policy> = Object.freeze({ id: 'exact-affordable-debit-v1', version: 1, parameters: Object.freeze({ overflow: 'reject', returned: 'actual-delta' }) });
export const rejectDomestic = (reason: DomesticReason): DomesticReject => ({ ok: false, reason });
/** Internal plain data only; keep primitive values, including signed zero, intact. */
export function copyOwned<T>(v: DeepRO<T>): T {
  const clone = (value: unknown): unknown => Array.isArray(value) ? value.map(clone)
    : value !== null && typeof value === 'object' ? Object.fromEntries(Object.entries(value).map(([key, child]) => [key, clone(child)])) : value;
  return clone(v) as T;
}
function jsonCopy<T>(v: T): T { return JSON.parse(JSON.stringify(v)) as T; }
export function freezeOwned<T>(v: T): DeepRO<T> { if (v !== null && typeof v === 'object' && !Object.isFrozen(v)) { for (const x of Object.values(v)) freezeOwned(x); Object.freeze(v); } return v as DeepRO<T>; }

/** All accumulators are service writers, not recovered native writer implementations. */
export function writeDomestic(before: number, requested: number, cap: number, p: DeepRO<Policy>): DomesticLeafResult<Write> {
  const raw = before + requested;
  if (p.parameters.overflow === 'reject' && requested !== 0 && (raw < 0 || raw > cap)) return rejectDomestic('writer-cap-overflow');
  const after = Math.max(0, Math.min(cap, raw)), actualDelta = after - before;
  const returned = p.parameters.returned === 'requested' ? requested : actualDelta;
  return { ok: true, value: { before, requested, returned, actualDelta, after, cap, discarded: requested - actualDelta, policyId: p.id } };
}
export function emptyCalculation(): Calculation { return { observationKind: 'derived-adapter-observations', selectedOfficerIds: [], securityKernelReturn: null, quantityKernelReturn: null, quantityPreCapacity: null, priceKernelReturn: null, timeKernelReturn: null, facilityApplied: false, earlyCharmSum: null, moraleSecuritySnapshot: null, newRecruitMorale: null, securityWrite: null, troopWrite: null, inventoryWrite: null, moraleWrite: null, kernels: [] }; }
export function retainKernel<T extends { supported: boolean }>(calculation: Calculation, api: string, input: unknown, output: T): DomesticLeafResult<T & { supported: true }> {
  if (!output.supported) return rejectDomestic('kernel-rejected');
  const retained = Object.fromEntries(Object.entries(output).filter(([k]) => k !== 'evidence'));
  calculation.kernels.push({ api, input: jsonCopy(input), output: jsonCopy(retained) });
  return { ok: true, value: output as T & { supported: true } };
}
export function facilityFactor(f: DeepRO<Pick<Facility, 'level'>>, p: DeepRO<Policy>): RecruitmentQuantityFactorBits { return (p.parameters.levelBits as readonly string[])[f.level - 1] as RecruitmentQuantityFactorBits; }
export function patrolSecurityGain(people: DeepRO<Pick<Officer, 'leadership'>[]>, security: number, pressureActive: boolean, calc: Calculation): DomesticLeafResult<number> {
  const input = { profile: 'patrol-security-gain-stable-v1' as const, resolvedLeadershipSlots: people.map(o => o.leadership), publicOrderByte: security, pressureHelperEax: pressureActive ? 1 : 0 };
  const result = retainKernel(calc, 'calculatePatrolSecurityGain', input, calculatePatrolSecurityGain(input)); if (!result.ok) return result;
  calc.securityKernelReturn = result.value.returnedDelta;
  return { ok: true, value: result.value.returnedDelta };
}
export function recruitmentSecurityArgument(earlyCharmSum: number, troopReturned: number, calc: Calculation): DomesticLeafResult<number> {
  const input = { profile: 'recruitment-security-argument-v1' as const, savedCharmSum: earlyCharmSum, savedTroopReturnU32: troopReturned >>> 0 };
  const result = retainKernel(calc, 'calculateRecruitmentSecurityArgument', input, calculateRecruitmentSecurityArgument(input)); if (!result.ok) return result;
  return { ok: true, value: result.value.securityDeltaSigned };
}
type RecruitView = Pick<DomesticInstantFrame, 'difficulty' | 'controller' | 'pressureActive'> & { city: Pick<DomesticInstantFrame['city'], 'security' | 'troops' | 'troopCapacity'> };
export function recruitQuantity(s: DeepRO<RecruitView>, people: DeepRO<Officer[]>, factor: RecruitmentQuantityFactorBits, calc: Calculation): DomesticLeafResult<number> {
  const captures: RecruitmentQuantityCapture[] = ['005C3619', '005C3630', '005C3643', '005C364B'].map(callAddress => ({ callAddress, eax: 1 }));
  for (let i = 0; i < 3; i++) { const o = people[i]; captures.push({ callAddress: '005C367B', slotIndex: i, eax: o ? 1 : 0 }); if (o) captures.push({ callAddress: '005C3689', slotIndex: i, eax: o.charm }, { callAddress: '005C36AA', slotIndex: i, eax: o.skillIds.includes(79) ? 1 : 0 }); }
  const difficultyWord = s.difficulty === 'super' ? 2 : 0;
  if (difficultyWord === 2) captures.push({ callAddress: '005C3725', eax: s.controller === 'player' ? 1 : 0 });
  captures.push({ callAddress: '005C3738', eax: s.pressureActive ? 1 : 0 });
  // The probe only selects the existing observation branch; it is not retained.
  const probeInput = { profile: 'recruitment-quantity-observations-f32-v1' as const, captures: [...captures, { callAddress: '005C374E', eax: 0 }, { callAddress: '005C3757', eax: 1_000_000 }], savedSecurityByte: s.city.security, resolvedFacilityFactorBits: factor, difficultyWord };
  const probe = calculateRecruitmentQuantityProjection(probeInput); if (!probe.supported) return rejectDomestic('kernel-rejected');
  captures.push({ callAddress: '005C374E', eax: s.city.troops }, { callAddress: '005C3757', eax: s.city.troopCapacity });
  if (s.city.troops + probe.returnedValue > s.city.troopCapacity) captures.push({ callAddress: '005C3764', eax: s.city.troops }, { callAddress: '005C376B', eax: s.city.troopCapacity });
  const input = { ...probeInput, captures };
  const result = retainKernel(calc, 'calculateRecruitmentQuantityProjection', input, calculateRecruitmentQuantityProjection(input)); if (!result.ok) return result;
  calc.quantityPreCapacity = result.value.afterPressureU32; calc.quantityKernelReturn = result.value.returnedValue;
  return { ok: true, value: result.value.returnedValue };
}
export function productionPrice(basePriceWord: number, specialty: boolean, calc: Calculation): DomesticLeafResult<number> {
  const input = { profile: 'production-price-resolved-v1' as const, savedBasePriceWord: basePriceWord, specialtyHelperEax: specialty ? 1 : 0 };
  const result = retainKernel(calc, 'calculateProductionPrice', input, calculateProductionPrice(input)); if (!result.ok) return result;
  calc.priceKernelReturn = result.value.returnedPrice;
  return { ok: true, value: result.value.returnedPrice };
}
export type ProductionQuantityView = { kind: 'piece'; equipmentType: PieceEquipment } | {
  kind: 'quantity'; equipmentType: QuantityEquipment; people: DeepRO<Officer[]>; factor: RecruitmentQuantityFactorBits; difficulty: 'normal' | 'super'; controller: 'player' | 'ai'
};
export function productionQuantity(view: ProductionQuantityView, calc: Calculation): DomesticLeafResult<number> {
  // A piece input never fabricates quantity slots or a facility multiplier.
  const input = view.kind === 'piece' ? { profile: 'production-quantity-resolved-f32-v1' as const, nativeEquipmentType: view.equipmentType } : quantityInput(view);
  const result = retainKernel(calc, 'calculateProductionQuantity', input, calculateProductionQuantity(input)); if (!result.ok) return result;
  calc.quantityKernelReturn = result.value.returnedQuantity; calc.quantityPreCapacity = result.value.returnedQuantity;
  return { ok: true, value: result.value.returnedQuantity };
}
function quantityInput(view: Extract<ProductionQuantityView, { kind: 'quantity' }>) {
  const difficultyWord = view.difficulty === 'super' ? 2 : 0, t = view.equipmentType;
  const slots = [0, 1, 2].map(i => { const o = view.people[i]; return o ? { intelligenceGetterEax: o.intelligence, skillHelperEax: o.skillIds.includes(t === 4 ? 81 : 80) ? 1 : 0 } : null; }) as [ProductionQuantitySlot, ProductionQuantitySlot, ProductionQuantitySlot];
  return { profile: 'production-quantity-resolved-f32-v1' as const, nativeEquipmentType: t, slots, resolvedFacilityFactorBits: view.factor, difficultyWord, ...(difficultyWord === 2 ? { cityVirtualEax: view.controller === 'player' ? 1 : 0 } : {}) };
}
export function planRewards(people: DeepRO<Pick<Officer, 'id' | 'xp' | 'merit'>[]>, kind: 'patrol' | 'recruit' | 'quantity' | 'piece', p: DeepRO<Policy>): DomesticLeafResult<RewardPlan> {
  const attribute = p.parameters[kind] as Stat;
  const xpRequested = p.parameters[kind === 'piece' ? 'completionXp' : 'instantXp'] as number;
  const meritRequested = p.parameters[kind === 'piece' ? 'completionMerit' : 'instantMerit'] as number;
  const value: RewardPlan = { progress: [], rewards: [] };
  for (const o of people) {
    const xp = writeDomestic(o.xp[attribute], xpRequested, p.parameters.cap as number, ACCUMULATE); if (!xp.ok) return xp;
    const merit = writeDomestic(o.merit, meritRequested, p.parameters.cap as number, ACCUMULATE); if (!merit.ok) return merit;
    value.progress.push({ officerId: o.id, attribute, xp: xp.value.after, merit: merit.value.after });
    value.rewards.push({ officerId: o.id, attribute, xp: xp.value, merit: merit.value });
  }
  return { ok: true, value };
}
