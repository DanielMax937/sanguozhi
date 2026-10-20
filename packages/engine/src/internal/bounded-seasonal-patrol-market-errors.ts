/** One private identity brand for every rejection in this owner. Never inspect a thrown object. */
import type { Failure, Reason, Stage } from './bounded-seasonal-patrol-market-types.ts';
import { fitBoundedMarketData, freeze } from './bounded-seasonal-patrol-market-json.ts';
type Context = Partial<Pick<Failure, 'blockingUnitId' | 'officerId' | 'facilityId' | 'jobId' | 'proposal' | 'kernelReason' | 'patrolReason' | 'index'>>;
const failures = new WeakMap<object, Failure>();
function failure(reason: Reason, stage: Stage, context: Context = {}): Failure {
  const value: Failure = { ok: false, committed: false, stage, reason,
    blockingUnitId: context.blockingUnitId ?? null, officerId: context.officerId ?? null,
    facilityId: context.facilityId ?? null, jobId: context.jobId ?? null,
    proposal: (reason !== 'salary-reserve-shortfall' && reason !== 'unsupported-salary-shortfall') || context.proposal === undefined || context.proposal === null ? null : {
      required: context.proposal.required, available: context.proposal.available, shortfall: context.proposal.shortfall },
    kernelReason: reason === 'money-kernel-rejected' ? context.kernelReason ?? null : null, patrolReason: reason === 'patrol-phase-rejected' ? context.patrolReason ?? null : null, index: context.index ?? null };
  const fit = fitBoundedMarketData(value);
  // This fixed fallback is 13 nodes, depth 1 and short literals. It also handles
  // absent Node proxy support without ever reflecting on caller-owned objects.
  if (!fit.ok) return Object.freeze({ ok: false, committed: false,
    stage: fit.reason === 'budget-exceeded' ? 'budget' : 'input', reason: fit.reason,
    blockingUnitId: null, officerId: null, facilityId: null, jobId: null,
    proposal: null, kernelReason: null, patrolReason: null, index: null });
  freeze(value);
  return value;
}
export function stop(reason: Reason, stage: Stage = 'input', context: Context = {}): never {
  const token = Object.freeze({});
  failures.set(token, failure(reason, stage, context));
  throw token;
}
const unknownFailure = failure('invalid-data', 'input');
export function caught(error: unknown): Failure {
  if (error !== null && typeof error === 'object') {
    const known = failures.get(error);
    if (known !== undefined) return known;
  }
  return unknownFailure;
}

