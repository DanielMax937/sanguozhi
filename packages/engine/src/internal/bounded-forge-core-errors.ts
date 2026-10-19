/** One private error identity shared by the forge owner and its core. */
import type { Failure, Reason, Stage } from './bounded-forge-development-production-types.ts';

const errors = new WeakMap<object, Failure>();
type Context = Partial<Pick<Failure, 'blockingUnitId' | 'officerId' | 'facilityId' | 'jobId'>>;
function failure(reason: Reason, stage: Stage = 'input', context: Context = {}): Failure {
  return { ok: false, committed: false, stage, reason, blockingUnitId: context.blockingUnitId ?? null,
    officerId: context.officerId ?? null, facilityId: context.facilityId ?? null, jobId: context.jobId ?? null };
}
export function stop(reason: Reason, stage: Stage = 'input', context: Context = {}): never {
  const token = {}; errors.set(token, failure(reason, stage, context)); throw token;
}
export function caught(error: unknown): Failure {
  return error !== null && typeof error === 'object' ? errors.get(error) ?? failure('invalid-data') : failure('invalid-data');
}
