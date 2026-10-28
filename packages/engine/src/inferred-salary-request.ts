/** Facility-wide all-or-nothing payment gate; per-officer loss is an explicit inference. */
export function projectInferredSalaryShortfallV2(facilitySalaryDue: number, remainingGold: number, officerSalaryDue: number) {
  const integer = (v: unknown): v is number => typeof v === 'number' && Number.isSafeInteger(v) && !Object.is(v, -0) && v >= 0;
  if (!integer(facilitySalaryDue) || !integer(remainingGold) || !integer(officerSalaryDue) || officerSalaryDue > facilitySalaryDue) return Object.freeze({ ok: false as const, reason: 'invalid-input' });
  const facilityCanPay = remainingGold >= facilitySalaryDue;
  const facilityPaidRequest = facilityCanPay ? facilitySalaryDue : 0;
  const officerPaidRequest = facilityCanPay ? officerSalaryDue : 0;
  return Object.freeze({ ok: true as const, policyId: 'inferred-all-or-nothing-salary-loss-request-v2',
    evidence: 'known-payment-gate-inferred-loss' as const, worldEffectsApplied: false as const,
    facilitySalaryDue, remainingGold, officerSalaryDue, facilityCanPay, facilityPaidRequest,
    remainingGoldRequest: remainingGold - facilityPaidRequest, officerPaidRequest,
    officerUnpaid: officerSalaryDue - officerPaidRequest,
    loyaltyLossRequest: !facilityCanPay && officerSalaryDue > 0 ? 5 : 0,
    partialPaymentAllowed: false as const, loyaltyFloorOrAllegianceChangeApplied: false as const });
}
