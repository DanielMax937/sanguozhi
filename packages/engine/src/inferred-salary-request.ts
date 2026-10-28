/** Independent per-officer salary request, not payroll execution or loyalty writing. */
export function projectInferredSalaryShortfall(salaryDue: number, allocatedGold: number) {
  const integer = (v: unknown): v is number => typeof v === 'number' && Number.isSafeInteger(v) && !Object.is(v, -0) && v >= 0;
  if (!integer(salaryDue) || !integer(allocatedGold)) return Object.freeze({ ok: false as const, reason: 'invalid-input' });
  const paidRequest = Math.min(salaryDue, allocatedGold), unpaid = salaryDue - paidRequest;
  const loyaltyLossRequest = salaryDue === 0 ? 0 : Number((5n * BigInt(unpaid) + BigInt(salaryDue) - 1n) / BigInt(salaryDue));
  return Object.freeze({ ok: true as const, policyId: 'inferred-proportional-unpaid-loyalty-request-v1',
    evidence: 'explicit-design-inference' as const, worldEffectsApplied: false as const,
    salaryDue, allocatedGold, paidRequest, unpaid, unspentAllocation: allocatedGold - paidRequest,
    loyaltyLossRequest, nativePartialPaymentEstablished: false as const,
    loyaltyFloorOrAllegianceChangeApplied: false as const });
}
