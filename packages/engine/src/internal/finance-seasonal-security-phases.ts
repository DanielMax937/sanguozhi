/**
 * Internal seasonal-security phase for validated, privately owned candidates.
 * The caller owns scheduling, governor resolution, RNG cursor/receipts and commit.
 * This is the existing provisional finance policy, not a native scheduler or RNG.
 */
export type FinanceSeasonalSecurityDrawPurpose = 'administrative-reform' | 'seasonal-loss';
export type FinanceSeasonalSecurityReceipt = {
  status: 'not-due' | 'applied' | 'administrative-reform-skip';
  governorId: string | null;
  charm: number | null;
  adminRoll: number | null;
  lossRoll: number | null;
  requestedLoss: number;
  actualLoss: number;
  before: number;
  after: number;
};
export type FinanceSeasonalSecurityWrite = {
  resource: 'security';
  reason: 'seasonal-security';
  before: number;
  requested: number;
  accepted: number;
  actualDelta: number;
  after: number;
  cap: 100;
  discarded: number;
  writerPolicyId: string;
};
export type FinanceSeasonalSecurityPhaseInput = {
  quarterStart: boolean;
  governor: { readonly id: string; readonly charm: number } | null;
  hasAdministrativeReform: boolean;
  securityTarget: { security: number };
  writerPolicyId: string;
  draw: (bound: 100 | 3, purpose: FinanceSeasonalSecurityDrawPurpose) => number;
};
export type FinanceSeasonalSecurityPhaseResult = {
  security: FinanceSeasonalSecurityReceipt;
  write: FinanceSeasonalSecurityWrite | null;
};

/**
 * Requires security in 0..100, a resolved governor with charm in 0..100 (or null),
 * and a draw callback that returns a validated integer in 0..bound-1 or throws.
 * No public state, tape, cursor, calendar, receipt history or rollback lives here.
 * A throwing draw propagates unchanged; the caller discards its whole candidate.
 */
export function applyFinanceSeasonalSecurityPhase(input: FinanceSeasonalSecurityPhaseInput): FinanceSeasonalSecurityPhaseResult {
  const before = input.securityTarget.security;
  const security: FinanceSeasonalSecurityReceipt = {
    status: 'not-due', governorId: input.governor?.id ?? null, charm: null,
    adminRoll: null, lossRoll: null, requestedLoss: 0, actualLoss: 0, before, after: before,
  };
  if (!input.quarterStart) return { security, write: null };

  const charm = input.governor?.charm ?? 0;
  const adminRoll = input.hasAdministrativeReform ? input.draw(100, 'administrative-reform') : null;
  security.charm = charm;
  security.adminRoll = adminRoll;
  if (adminRoll !== null && adminRoll < 50) {
    security.status = 'administrative-reform-skip';
    return { security, write: null };
  }

  const roll = input.draw(3, 'seasonal-loss');
  const loss = Math.min(5, Math.floor(Math.max(1, 90 - charm) / 10) + roll);
  const actual = Math.min(before, loss);
  input.securityTarget.security -= actual;
  return {
    security: {
      status: 'applied', governorId: input.governor?.id ?? null, charm, adminRoll,
      lossRoll: roll, requestedLoss: loss, actualLoss: actual, before, after: input.securityTarget.security,
    },
    write: {
      resource: 'security', reason: 'seasonal-security', before, requested: loss, accepted: actual,
      actualDelta: actual === 0 ? 0 : -actual, after: input.securityTarget.security,
      cap: 100, discarded: loss - actual, writerPolicyId: input.writerPolicyId,
    },
  };
}
