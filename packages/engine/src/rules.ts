import data from '../../../docs/sources/pk-training-runtime.json' with { type: 'json' };
import type { RuleEvidence, RuleUse, Ruleset } from './types.ts';

function freeze<T>(value: T): T {
  if (value !== null && typeof value === 'object') {
    Object.freeze(value);
    for (const child of Object.values(value)) freeze(child);
  }
  return value;
}
export const RULES = freeze(data.rules);
export type RuleId = keyof typeof RULES;
export const RULESET: Ruleset = freeze({
  id: 'pk-training-slice-v1', rulesetVersion: 'pk', patchVersion: '1.1', fixProfile: 'original',
  gateProfile: 'conservative-training-v1', apProfile: 'single-first-corps-c9-v1',
  turnProfile: 'training-only-turn-v1', progressionProfile: 'reject-stat-growth-v1',
  presentationProfile: 'omit-training-presentation-v1',
});
export const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
export function evidence(id: RuleId, detail: string): RuleUse {
  return { evidence: clone(RULES[id]) as RuleEvidence, detail };
}
export function resolveRuleset(version: string): { ok: true; ruleset: Ruleset } | { ok: false; reason: string; evidence: RuleUse[] } {
  if (version === 'pk') return { ok: true, ruleset: clone(RULESET) };
  return { ok: false, reason: `Unsupported ruleset: ${version}. Only PC-PK1.1 is implemented.`,
    evidence: [evidence('engine.version', 'No PK fallback or feature inheritance for Vanilla/console builds.')] };
}
export function canonical(value: unknown): string {
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  if (value !== null && typeof value === 'object') {
    return '{' + Object.keys(value).sort().map(k => JSON.stringify(k) + ':' + canonical((value as Record<string, unknown>)[k])).join(',') + '}';
  }
  return JSON.stringify(value);
}
