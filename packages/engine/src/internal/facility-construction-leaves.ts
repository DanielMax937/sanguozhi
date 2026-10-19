import { calculateDomesticConstructionRate } from '../domestic-construction-rate.ts';
import type { ConstructionDevelopmentInput, ConstructionDevelopmentResult, ConstructionWriteResult } from './facility-construction-types.ts';

/** Exact debit and saturating credit arithmetic; the owner maps rejection to its error. */
export function calculateConstructionWrite(before: number, delta: number, cap: number, policyId: string): ConstructionWriteResult {
  if (delta < 0 && before < -delta) return { ok: false, reason: 'insufficient-balance' };
  const actualDelta = delta < 0 ? delta : Math.min(delta, cap - before);
  return { ok: true, write: { before, requestedDelta: delta, actualDelta, after: before + actualDelta, cap, discarded: delta - actualDelta, policyId } };
}

/** Work and duration only; catalog lookup, due date and receipt cloning stay with the owner. */
export function calculateConstructionDevelopment(input: ConstructionDevelopmentInput): ConstructionDevelopmentResult {
  const required = input.required, initial = input.initialWork.mode === 'quarter-floor' ? Math.floor(required / input.initialWork.divisor) : 0;
  const rate = calculateDomesticConstructionRate({ profile: 'domestic-construction-rate-stable-v1', politics: input.politics, facilityDurability: required });
  if (!rate.supported) return { ok: false, reason: 'unsupported-construction-rate' };
  if (rate.rate <= 0) return { ok: false, reason: 'nonpositive-construction-rate' };
  const durationTurns = Math.ceil((required - initial) / rate.rate);
  return { ok: true, required, initial, rate, durationTurns };
}
