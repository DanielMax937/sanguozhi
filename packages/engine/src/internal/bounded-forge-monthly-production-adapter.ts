/** Clock-free monthly adapter. The sole durable writer is the verified 1..3 quantity allowlist. */
import { applyMonthlySpecialtyEquipmentPhase } from './monthly-specialty-phases.ts';
import { stop, caught } from './bounded-forge-core-errors.ts';
import { clone, same, detach, record, object, literal, integer, choice } from './bounded-forge-monthly-production-data.ts';
import type {
  Scenario, Current, Id, Thirty, Equipment, ProduceEquipment, DeepReadonly,
  MonthlySlots, MonthlyInput, MonthlyCapture, MonthlyEvidence, MonthlyArithmetic,
  MonthlyQuantityRequest, MonthlyKernelResult, MonthlyWrite, MonthlyItem, MonthlyReceipt,
} from './bounded-forge-monthly-production-types.ts';

function deriveFacilities(s: Scenario, c: Current): {
  facilityIds: Thirty<Id | null>;
  facilities: readonly ({ readonly kind: 'forge'; readonly complete: boolean } | null)[];
} {
  const facilities: ({ readonly kind: 'forge'; readonly complete: boolean } | null)[] = [];
  const seen = new Set<Id>();
  function slot(index: number): Id | null {
    const lotId = s.monthlySpecialty.facilityLotSlots[index];
    if (lotId === null) { facilities.push(null); return null; }
    if (lotId === undefined || seen.has(lotId) || !s.lots.some(lot => lot.id === lotId)) stop('invariant-mismatch');
    seen.add(lotId);
    const occupants = c.ledger.facilities.filter(f => f.lotId === lotId);
    if (occupants.length > 1) stop('invariant-mismatch');
    const facility = occupants[0];
    if (facility === undefined) { facilities.push(null); return null; }
    if (facility.kind !== 'forge' || (facility.status !== 'complete' && facility.status !== 'developing')) stop('invariant-mismatch');
    facilities.push({ kind: 'forge', complete: facility.status === 'complete' });
    return facility.id;
  }
  const facilityIds: Thirty<Id | null> = [
    slot(0), slot(1), slot(2), slot(3), slot(4), slot(5), slot(6), slot(7), slot(8), slot(9),
    slot(10), slot(11), slot(12), slot(13), slot(14), slot(15), slot(16), slot(17), slot(18), slot(19),
    slot(20), slot(21), slot(22), slot(23), slot(24), slot(25), slot(26), slot(27), slot(28), slot(29),
  ];
  if (seen.size !== s.lots.length || facilities.filter(f => f !== null).length > 2) stop('invariant-mismatch');
  return { facilityIds, facilities };
}
function governorAtBoundary(s: Scenario, c: Current): { officerId: Id; politics: number } | null {
  const officerId = s.monthlySpecialty.governorOfficerId;
  if (officerId === null) return null;
  const initial = s.officers.find(o => o.id === officerId), current = c.ledger.officers.find(o => o.id === officerId);
  if (!initial || !current || current.politics !== initial.politics || !Number.isSafeInteger(current.politics)
    || Object.is(current.politics, -0) || current.politics < 0 || current.politics > 100) stop('invariant-mismatch', 'tick', { officerId });
  return { officerId, politics: current.politics };
}
function expectedMonthlyItem(
  equipmentType: ProduceEquipment,
  facilities: readonly ({ readonly kind: 'forge'; readonly complete: boolean } | null)[],
  governor: { officerId: Id; politics: number } | null,
  specialtyEquipmentTypes: readonly Equipment[], before: number, capacity: number,
): MonthlyItem {
  const arithmeticProfile = 'comment-f32-rne-trunc-v1', profile = 'monthly-specialty-production-observed-v1';
  if (governor === null) return {
    equipmentType, arithmeticProfile, eligibility: 'no-governor', count: null, kernelQuantityRequest: null,
    kernel: { status: 'not-due', reason: 'no-governor' }, write: null,
  };
  const evidence: MonthlyEvidence = {
    level: 'source-listing-control-flow-with-provisional-arithmetic',
    controlFlow: 'source-listing-reconstruction', arithmetic: 'documented-replaceable-assumptions',
    profile, arithmeticProfile, source: 'docs/sources/monthly-specialty-production.json', projectTarget: 'PC-PK1.1', sourceEditionClaim: 'PK',
    exactSourceVersionVerified: false, runtimeSourceRehashPerformed: false, nativeExecutableExecuted: false,
    nativeHelpersReconstructed: false, converterBodyKnown: false, memoryConstantBytesRecovered: false,
    stockOriginalVerified: false, vanillaVerified: false, abiVerified: false, fullCallerExecuted: false,
    stateWriterIntegrated: false, ownerForceIntegrated: false, schedulerIntegrated: false, rngIntegrated: false,
  };
  if (!specialtyEquipmentTypes.includes(equipmentType)) {
    const input: MonthlyInput = { profile, arithmeticProfile, equipmentType, specialtyEaxU32: 0 };
    const capturedReturns: MonthlyCapture[] = [{ kind: 'specialty', callAddress: '00590A7E', target: '0047B3A0', slotIndex: null, eaxU32: 0, consumedWidthBits: 8, consumedValue: 0 }];
    const result: MonthlyKernelResult = { supported: true, profile, arithmeticProfile, equipmentType, observations: clone(input), capturedReturns, evidence, path: 'not-specialty', completedFacilityCount: null, arithmetic: null, quantityRequest: null };
    return { equipmentType, arithmeticProfile, eligibility: 'not-specialty', count: null, kernelQuantityRequest: null,
      kernel: { status: 'called', api: 'calculateMonthlySpecialtyProduction', profile, adapterObservationKind: 'derived-adapter-observations', input, result }, write: null };
  }
  if (facilities.length !== 30) stop('invariant-mismatch');
  const capturedReturns: MonthlyCapture[] = [{ kind: 'specialty', callAddress: '00590A7E', target: '0047B3A0', slotIndex: null, eaxU32: 1, consumedWidthBits: 8, consumedValue: 1 }];
  let completed = 0;
  function slot(index: number): MonthlySlots[number] {
    const facility = facilities[index]; if (facility === undefined) stop('invariant-mismatch');
    const validity = facility === null ? 0 : 1;
    capturedReturns.push({ kind: 'validity', callAddress: '00590AB3', target: '0047A630', slotIndex: index, eaxU32: validity, consumedWidthBits: 32, consumedValue: validity });
    if (facility === null) return { validityEaxU32: 0 };
    const complete = facility.complete ? 1 : 0;
    capturedReturns.push({ kind: 'corresponding-completed', callAddress: '00590AC6', target: '0049CFB0', slotIndex: index, eaxU32: complete, consumedWidthBits: 32, consumedValue: complete });
    completed += complete;
    return { validityEaxU32: 1, correspondingCompletedEaxU32: complete };
  }
  const slots: MonthlySlots = [
    slot(0), slot(1), slot(2), slot(3), slot(4), slot(5), slot(6), slot(7), slot(8), slot(9),
    slot(10), slot(11), slot(12), slot(13), slot(14), slot(15), slot(16), slot(17), slot(18), slot(19),
    slot(20), slot(21), slot(22), slot(23), slot(24), slot(25), slot(26), slot(27), slot(28), slot(29),
  ];
  if (completed === 0) {
    const input: MonthlyInput = { profile, arithmeticProfile, equipmentType, specialtyEaxU32: 1, slots };
    const result: MonthlyKernelResult = { supported: true, profile, arithmeticProfile, equipmentType, observations: clone(input), capturedReturns, evidence, path: 'no-completed-facilities', completedFacilityCount: 0, arithmetic: null, quantityRequest: null };
    return { equipmentType, arithmeticProfile, eligibility: 'no-completed-facilities', count: 0, kernelQuantityRequest: null,
      kernel: { status: 'called', api: 'calculateMonthlySpecialtyProduction', profile, adapterObservationKind: 'derived-adapter-observations', input, result }, write: null };
  }
  if (completed !== 1 && completed !== 2) stop('invariant-mismatch');
  const count = completed, politics = integer(governor.politics, 100), politicsTerm = Math.floor(politics / 2) + 60;
  const factorValue = count === 1 ? 1 : 1.5, scaledValue = politicsTerm * factorValue * 3, requested = Math.trunc(scaledValue);
  const input: MonthlyInput = { profile, arithmeticProfile, equipmentType, specialtyEaxU32: 1, slots, governorPoliticsEaxU32: politics };
  capturedReturns.push({ kind: 'governor-politics', callAddress: '00590B4E', target: '004890A0', slotIndex: null, eaxU32: politics, consumedWidthBits: 8, consumedValue: politics });
  const arithmetic: MonthlyArithmetic = { factorTier: count === 1 ? 'one' : 'two-to-three', factorBitsU32: count === 1 ? 1065353216 : 1069547520, factorValue, politicsAL: politics, politicsTerm, scaledValue, convertedSigned32: requested, capApplied: false };
  const quantityRequest: MonthlyQuantityRequest = { pushAddress: '00590B82', continuationAddress: '00590B83', quantityU32: requested, quantitySigned32: requested };
  const result: MonthlyKernelResult = { supported: true, profile, arithmeticProfile, equipmentType, observations: clone(input), capturedReturns, evidence, path: 'production', completedFacilityCount: count, arithmetic, quantityRequest };
  integer(capacity, 1_000_000); integer(before, capacity);
  const accepted = Math.min(requested, capacity - before);
  const write: MonthlyWrite = { resource: `equipment-${equipmentType}`, reason: 'specialty', before, requested, accepted, actualDelta: accepted, after: before + accepted, cap: capacity, discarded: requested - accepted, writerPolicyId: 'saturating-positive-credit-v1' };
  return { equipmentType, arithmeticProfile, eligibility: 'production', count, kernelQuantityRequest: requested,
    kernel: { status: 'called', api: 'calculateMonthlySpecialtyProduction', profile, adapterObservationKind: 'derived-adapter-observations', input, result }, write };
}
function readMonthlyItem(value: unknown, expected: MonthlyItem): MonthlyItem {
  const actual = detach(value);
  if (!same(actual, expected)) stop('unexpected-reducer-effect');
  return clone(expected);
}

export function applyForgeMonthlySpecialty(s: Scenario, current: Current): MonthlyReceipt {
  function freeze<T>(value: T): DeepReadonly<T> {
    if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
      for (const child of Object.values(value)) freeze(child); Object.freeze(value);
    }
    return value as DeepReadonly<T>;
  }
  function notDue(equipmentType: ProduceEquipment): MonthlyItem {
    return { equipmentType, arithmeticProfile: 'comment-f32-rne-trunc-v1', eligibility: 'not-due', count: null,
      kernelQuantityRequest: null, kernel: { status: 'not-due', reason: 'not-month-start' }, write: null };
  }
  if (current.clock.date.day !== 1) return {
    status: 'not-due', settlement: null, governor: null, facilityIds: null, items: [notDue(1), notDue(2), notDue(3)],
  };
  const beforeMonthly = clone(current), expectedCurrent = clone(beforeMonthly);
  const derived = deriveFacilities(s, current), governor = governorAtBoundary(s, current);
  const facilities = freeze(clone(derived.facilities)), specialtyEquipmentTypes = freeze(clone(s.domestic.specialtyEquipmentTypes));
  const phaseGovernor = governor === null ? null : freeze({ politics: governor.politics });
  function settle(equipmentType: ProduceEquipment): MonthlyItem {
    const before = current.ledger.inventory[equipmentType].quantity, capacity = s.city.inventory[equipmentType].capacity;
    const stock = { quantity: before, capacity };
    const expected = expectedMonthlyItem(equipmentType, facilities, governor, specialtyEquipmentTypes, before, capacity);
    let response: unknown;
    try { response = applyMonthlySpecialtyEquipmentPhase({ equipmentType, monthStart: true, facilities, governor: phaseGovernor, specialtyEquipmentTypes, stock }); }
    catch (error) { const failure = caught(error); stop(failure.reason, failure.stage, failure); }
    const raw = record(detach(response), 'unexpected-reducer-effect');
    if (raw.ok === false) {
      object(raw, ['ok', 'reason'], 'unexpected-reducer-effect');
      const reason = choice(raw.reason, ['specialty-kernel:invalid-input', 'specialty-kernel:unexpected-field', 'specialty-kernel:unsupported-profile', 'specialty-kernel:stage-mismatch', 'unsupported-kernel-return', 'invalid-resource-boundary'] as const, 'unexpected-reducer-effect');
      switch (reason) {
        case 'specialty-kernel:invalid-input': stop('kernel-rejected');
        case 'specialty-kernel:unexpected-field': stop('kernel-rejected');
        case 'specialty-kernel:unsupported-profile': stop('kernel-rejected');
        case 'specialty-kernel:stage-mismatch': stop('kernel-rejected');
        case 'unsupported-kernel-return': stop('kernel-rejected');
        case 'invalid-resource-boundary': stop('writer-cap-overflow');
      }
    }
    object(raw, ['ok', 'receipt'], 'unexpected-reducer-effect'); literal(raw.ok, true, 'unexpected-reducer-effect');
    const receipt = readMonthlyItem(raw.receipt, expected);
    const target = object(detach(stock), ['quantity', 'capacity'], 'unexpected-reducer-effect');
    const actualCapacity = integer(target.capacity, 1_000_000, 0, 'unexpected-reducer-effect'), quantity = integer(target.quantity, capacity, 0, 'unexpected-reducer-effect');
    if (actualCapacity !== capacity || quantity !== (receipt.write === null ? before : receipt.write.after)) stop('unexpected-reducer-effect');
    current.ledger.inventory[equipmentType].quantity = quantity;
    expectedCurrent.ledger.inventory[equipmentType].quantity = quantity;
    return receipt;
  }
  const items: MonthlyReceipt['items'] = [settle(1), settle(2), settle(3)];
  if (!same(current, expectedCurrent)) stop('unexpected-reducer-effect');
  return { status: governor === null ? 'no-governor' : 'settled',
    settlement: { cityId: s.city.id, year: current.clock.date.year, month: current.clock.date.month },
    governor, facilityIds: derived.facilityIds, items };
}
