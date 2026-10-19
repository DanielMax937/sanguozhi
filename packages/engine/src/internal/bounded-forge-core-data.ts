/** Owned-data operations and the existing primitive readers; not a trust boundary. */
import { canonicalBoundedForgeJson } from './bounded-forge-development-production-json.ts';
import { stop } from './bounded-forge-core-errors.ts';
import type { DateV1, Digest, JobId, Reason } from './bounded-forge-development-production-types.ts';

export function clone<T>(value: T): T { return JSON.parse(canonicalBoundedForgeJson(value)) as T; }
export function same(a: unknown, b: unknown): boolean { return canonicalBoundedForgeJson(a) === canonicalBoundedForgeJson(b); }
type Hash = { update(text: string, encoding: 'utf8'): Hash; digest(encoding: 'hex'): string };
const runtime = globalThis as { process?: { getBuiltinModule?: (name: string) => { createHash(name: 'sha256'): Hash } } };
const crypto = runtime.process?.getBuiltinModule?.('node:crypto');
export function digest(value: unknown): Digest {
  if (!crypto) stop('invalid-data'); return crypto.createHash('sha256').update(canonicalBoundedForgeJson(value), 'utf8').digest('hex');
}
export function record(value: unknown, reason: Reason = 'invalid-fields'): Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) stop(reason); return value as Record<string, unknown>;
}
export function object(value: unknown, keys: readonly string[], reason: Reason = 'invalid-fields'): Record<string, unknown> {
  const result = record(value, reason), actual = Object.keys(result);
  if (actual.length !== keys.length || actual.some(k => !keys.includes(k)) || keys.some(k => !Object.hasOwn(result, k))) stop(reason);
  return result;
}
export function integer(value: unknown, max = Number.MAX_SAFE_INTEGER, min = 0, reason: Reason = 'invalid-number'): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || Object.is(value, -0) || value < min || value > max) stop(reason); return value;
}
export function literal<T extends string | number | boolean | null>(value: unknown, expected: T, reason: Reason = 'invalid-data'): T {
  if (value !== expected) stop(reason); return expected;
}
export function choice<T extends string | number>(value: unknown, options: readonly T[], reason: Reason = 'invalid-data'): T {
  if (!options.includes(value as T)) stop(reason); return value as T;
}
export function jobId(value: unknown): JobId { if (typeof value !== 'string' || (!/^job:[A-Za-z0-9][A-Za-z0-9_.:-]{0,63}$/.test(value) || /[^A-Za-z0-9_.:-]/.test(value))) stop('invalid-id'); return value; }
export function array(value: unknown, max: number, min = 0, reason: Reason = 'invalid-array'): unknown[] {
  if (!Array.isArray(value) || value.length < min || value.length > max) stop(reason); return value;
}
export function advanceDate(value: DateV1, count: number): DateV1 {
  const next = clone(value);
  for (let i = 0; i < count; i++) {
    if (next.day === 1) next.day = 11; else if (next.day === 11) next.day = 21;
    else { next.day = 1; if (next.month < 12) next.month++; else { next.month = 1; next.year++; } }
    if (next.year > 9999) stop('invalid-date');
  }
  return next;
}
