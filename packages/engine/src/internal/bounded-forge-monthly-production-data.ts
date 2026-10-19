/** Owned-data operations and the existing primitive readers; not a trust boundary. */
import { canonicalBoundedForgeMonthlyJson, detachBoundedForgeMonthlyData, boundedForgeMonthlyJsonFits } from './bounded-forge-monthly-production-json.ts';
import { stop } from './bounded-forge-core-errors.ts';
import type { Digest } from './bounded-forge-monthly-production-types.ts';
export { record, object, integer, literal, choice, jobId, array, advanceDate } from './bounded-forge-core-data.ts';

export function clone<T>(value: T): T { return JSON.parse(canonicalBoundedForgeMonthlyJson(value)) as T; }
export function same(a: unknown, b: unknown): boolean { return canonicalBoundedForgeMonthlyJson(a) === canonicalBoundedForgeMonthlyJson(b); }
type Hash = { update(text: string, encoding: 'utf8'): Hash; digest(encoding: 'hex'): string };
const runtime = globalThis as { process?: { getBuiltinModule?: (name: string) => { createHash(name: 'sha256'): Hash } } };
const crypto = runtime.process?.getBuiltinModule?.('node:crypto');
export function digest(value: unknown): Digest {
  if (!crypto) stop('invalid-data'); return crypto.createHash('sha256').update(canonicalBoundedForgeMonthlyJson(value), 'utf8').digest('hex');
}
export function detach(value: unknown): unknown {
  const result = detachBoundedForgeMonthlyData(value);
  if (!result.ok) stop(result.reason, result.reason === 'budget-exceeded' ? 'budget' : 'input');
  return result.value;
}
export function budget(value: unknown): void {
  if (!boundedForgeMonthlyJsonFits(value)) stop('budget-exceeded', 'budget');
}
