/** Bounded supplied terminal checkpoint -> CanCritical -> explicit choice -> winType.
 * Stops before Closing. Modern reference only; no native equivalence claim.
 */
type Frozen<T> = T extends object ? { readonly [K in keyof T]: Frozen<T[K]> } : T;
type Team = 0 | 1;
type Choice = 0 | 1;
type WinType = 0 | 1 | 2;
const PROFILE = 'debate-terminal-classification-reference-v1' as const;
const MAX_INPUT_NODES = 512;
const MAX_INPUT_DEPTH = 12;
const MAX_INPUT_ARRAY_LENGTH = 16;
const MAX_CANONICAL_BYTES = 16384;
const POLICY = {
  id: 'debate-terminal-classification-bounded-policy-v1', profile: PROFILE,
  checkpoint: { genericOnly: true, isTutorial: false, winner: [0, 1], hp: [-100, 1000], losingHpMaximum: 0, initialCritical: -1, initialWinType: 0,
    provenance: 'caller-resolved-winner-and-clamped-hp-not-authenticated-or-recomputed' },
  eligibility: 'resolved-winner-and-not-criticalDisabled-and-losing-hp-at-most-minus-one-hundred',
  choice: { eligible: 'explicit-zero-PushOn-or-one-HaveMercy-required', ineligible: 'null-required', defaultAiChoice: false },
  mapping: { noChoice: 0, PushOn: 1, HaveMercy: 2 },
  normalPolicy: 'explicit-initial-Normal-preserved-when-ineligible',
  output: 'closing-pending-not-Closing-executed',
  randomness: { supplied: 0, externalRngConsumed: 0 },
  safety: { closedSchema: true, detachedFrozen: true, proxyDetectorRequired: true, noPartialFailureState: true },
  budget: { nodes: MAX_INPUT_NODES, depth: MAX_INPUT_DEPTH, arrayLength: MAX_INPUT_ARRAY_LENGTH, canonicalBytes: MAX_CANONICAL_BYTES },
  boundary: { completeDebate: false, nativeEquivalent: false, oldNineSessionsChanged: false,
    closingRewardsInjuryPersonFactionAndP078: 'excluded', sourceUiAiPhaseSchedulerAndLogs: 'not-executed' },
} as const;
type Policy = typeof POLICY;
const EVIDENCE = {
  sourceIdentity: 'modern-CSharp-translation-not-native-PK-or-Vanilla',
  repository: 'https://github.com/tankyc/sango_infinity',
  sourceCommit: 'a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef',
  debateBlob: '0137498d10773cd4596d497083ccdf6a26b3a261',
  phaseBlob: '6aa98f855a5d4d172cde7e8ffc18a141b8a7b587',
  enumBlob: '5b46a8ac87613193eb9f4b99a25e489ba6f5e483',
  canCriticalLines: [1399, 1405], calcWinTypeLines: [1409, 1419], initializationLines: [1540, 1542],
  phaseLines: [278, 300], enumLines: [80, 93],
  nativeEquivalent: false, pkEquivalent: false, vanillaEquivalent: false,
  nativeGapTopics: 43, historicalSnapshots: 45, p078: 'excluded',
} as const;
type Evidence = typeof EVIDENCE;
type Input = {
  schemaVersion: 1; profile: typeof PROFILE; policies: Policy;
  genericOnly: true; isTutorial: false; winner: Team; hp: [number, number];
  criticalDisabled: boolean; initialCritical: -1; initialWinType: 0; choice: Choice | null;
};
type State = { genericOnly: true; isTutorial: false; winner: Team; hp: [number, number]; criticalDisabled: boolean; critical: -1 | Choice; winType: WinType };
type Receipt = {
  winner: Team; loser: Team; losingHp: number; criticalDisabled: boolean; canCritical: boolean;
  choice: Choice | null; initialCritical: -1; finalCritical: -1 | Choice;
  initialWinType: 0; finalWinType: WinType; classification: 'Normal' | 'PushOn' | 'HaveMercy';
  calcWinTypeApplied: boolean; externalRngConsumed: 0; closingExecuted: false;
};
type Success = { ok: true; schemaVersion: 1; profile: typeof PROFILE; policy: Policy; evidence: Evidence; state: State; receipt: Receipt; nextCheckpoint: 'closing-pending' };
type FailureReason = 'unsupported-runtime' | 'input-limit' | 'malformed-data' | 'unknown-field' | 'unsupported-profile' | 'unsupported-policy' | 'invalid-checkpoint' | 'invalid-choice' | 'choice-required' | 'choice-forbidden';
type Failure = { ok: false; reason: FailureReason };
type Result = Success | Failure;
export type DebateTerminalClassificationInputV1 = Frozen<Input>;
export type DebateTerminalClassificationStateV1 = Frozen<State>;
export type DebateTerminalClassificationReceiptV1 = Frozen<Receipt>;
export type DebateTerminalClassificationSuccessV1 = Frozen<Success>;
export type DebateTerminalClassificationFailureV1 = Frozen<Failure>;
export type DebateTerminalClassificationFailureReasonV1 = FailureReason;
export type DebateTerminalClassificationResultV1 = Frozen<Result>;
export type DebateTerminalClassificationPolicyV1 = Frozen<Policy>;
export type DebateTerminalClassificationEvidenceV1 = Frozen<Evidence>;
class Invalid extends Error {
  readonly reason: FailureReason;
  constructor(reason: FailureReason) { super(reason); this.reason = reason; }
}
function fail(reason: FailureReason): never { throw new Invalid(reason); }
function failure(error: unknown): Failure {
  return { ok: false, reason: error instanceof Invalid ? error.reason : 'malformed-data' };
}
function freeze<T>(value: T): Frozen<T> {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value as Frozen<T>;
}
/** Called only for detached JSON data or trusted internal constants. */
function canonical(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  const record = value as Record<string, unknown>;
  return '{' + Object.keys(record).sort().map(key => JSON.stringify(key) + ':' + canonical(record[key])).join(',') + '}';
}
function utf8Bytes(value: string): number {
  let bytes = 0;
  for (const character of value) {
    const codePoint = character.codePointAt(0)!;
    bytes += codePoint <= 0x7f ? 1 : codePoint <= 0x7ff ? 2 : codePoint <= 0xffff ? 3 : 4;
  }
  return bytes;
}
function getProxyDetector(): ((value: unknown) => boolean) | null {
  try {
    const runtime = globalThis as {
      process?: { getBuiltinModule?: (id: string) => { types?: { isProxy?: (value: unknown) => boolean } } };
    };
    if (typeof runtime.process?.getBuiltinModule !== 'function') return null;
    const detector = runtime.process.getBuiltinModule('node:util').types?.isProxy;
    return typeof detector === 'function' ? detector : null;
  } catch {
    return null;
  }
}
const proxyDetector = getProxyDetector();

/**
 * Reject proxies before reflection; read only data descriptors, not getters.
 * Reject symbols, hidden/decorated fields, nonplain prototypes, sparse arrays,
 * cycles, nonintegral/unsafe numbers, negative zero, and non-JSON values.
 * Repeated acyclic references are independently copied and budgeted each time.
 */
function detach(value: unknown): unknown {
  if (!proxyDetector) fail('unsupported-runtime');
  let nodes = 0, bytes = 0;
  const active = new Set<object>();
  function visit(current: unknown, depth: number): unknown {
    if (++nodes > MAX_INPUT_NODES || depth > MAX_INPUT_DEPTH) fail('input-limit');
    if (current === null || typeof current === 'boolean') return current;
    if (typeof current === 'string') {
      if (current.length > MAX_CANONICAL_BYTES) fail('input-limit');
      bytes += utf8Bytes(current);
      if (bytes > MAX_CANONICAL_BYTES) fail('input-limit');
      return current;
    }
    if (typeof current === 'number') {
      if (!Number.isSafeInteger(current) || Object.is(current, -0)) fail('malformed-data');
      return current;
    }
    if (typeof current !== 'object' || proxyDetector!(current) || active.has(current)) fail('malformed-data');
    const isArray = Array.isArray(current);
    const prototype = Object.getPrototypeOf(current);
    if (prototype !== (isArray ? Array.prototype : Object.prototype) && !(prototype === null && !isArray)) fail('malformed-data');
    const keys = Reflect.ownKeys(current);
    if (keys.length > MAX_INPUT_NODES) fail('input-limit');
    const descriptors = Object.getOwnPropertyDescriptors(current);
    for (const key of keys) {
      if (typeof key !== 'string') fail('malformed-data');
      const descriptor = descriptors[key]!;
      if (!Object.hasOwn(descriptor, 'value') || (!descriptor.enumerable && !(isArray && key === 'length'))) fail('malformed-data');
      if (key.length > MAX_CANONICAL_BYTES) fail('input-limit');
      bytes += utf8Bytes(key);
      if (bytes > MAX_CANONICAL_BYTES) fail('input-limit');
    }
    active.add(current);
    try {
      if (isArray) {
        const length = descriptors.length!.value as number;
        if (length > MAX_INPUT_ARRAY_LENGTH) fail('input-limit');
        if (keys.length !== length + 1) fail('malformed-data');
        const detached: unknown[] = [];
        for (let index = 0; index < length; index++) {
          const descriptor = descriptors[String(index)];
          if (!descriptor) fail('malformed-data');
          detached.push(visit(descriptor.value, depth + 1));
        }
        return detached;
      }
      const detached: Record<string, unknown> = {};
      for (const key of keys as string[]) {
        Object.defineProperty(detached, key, {
          value: visit(descriptors[key]!.value, depth + 1),
          enumerable: true,
          configurable: true,
          writable: true,
        });
      }
      return detached;
    } finally {
      active.delete(current);
    }
  }
  const result = visit(value, 0);
  if (utf8Bytes(canonical(result)) > MAX_CANONICAL_BYTES) fail('input-limit');
  return result;
}
function object(value: unknown, keys: readonly string[], reason: FailureReason = 'malformed-data'): Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) fail(reason);
  const record = value as Record<string, unknown>;
  if (Object.keys(record).some(key => !keys.includes(key))) fail('unknown-field');
  if (keys.some(key => !Object.hasOwn(record, key))) fail('malformed-data');
  return record;
}
/** Detachment has already rejected all nonintegral or unsafe numeric values. */
function integer(value: unknown, minimum: number, maximum: number, reason: FailureReason): number {
  if (typeof value !== 'number' || value < minimum || value > maximum) fail(reason);
  return value;
}
function parseInput(value: unknown): Input {
  const r = object(value, ['schemaVersion', 'profile', 'policies', 'genericOnly', 'isTutorial', 'winner', 'hp', 'criticalDisabled', 'initialCritical', 'initialWinType', 'choice']);
  if (r.schemaVersion !== 1 || r.profile !== PROFILE) fail('unsupported-profile');
  if (canonical(r.policies) !== canonical(POLICY)) fail('unsupported-policy');
  if (r.genericOnly !== true || r.isTutorial !== false || r.initialCritical !== -1 || r.initialWinType !== 0 || typeof r.criticalDisabled !== 'boolean') fail('invalid-checkpoint');
  const winner = integer(r.winner, 0, 1, 'invalid-checkpoint') as Team;
  if (!Array.isArray(r.hp) || r.hp.length !== 2) fail('invalid-checkpoint');
  const hp: [number, number] = [integer(r.hp[0], -100, 1000, 'invalid-checkpoint'), integer(r.hp[1], -100, 1000, 'invalid-checkpoint')];
  const loser: Team = winner === 0 ? 1 : 0;
  if (hp[loser] > 0) fail('invalid-checkpoint');
  if (r.choice !== null && r.choice !== 0 && r.choice !== 1) fail('invalid-choice');
  const canCritical = !r.criticalDisabled && hp[loser] <= -100;
  if (canCritical && r.choice === null) fail('choice-required');
  if (!canCritical && r.choice !== null) fail('choice-forbidden');
  return { schemaVersion: 1, profile: PROFILE, policies: POLICY, genericOnly: true, isTutorial: false,
    winner, hp, criticalDisabled: r.criticalDisabled, initialCritical: -1, initialWinType: 0, choice: r.choice };
}
function resolve(input: Input): Success {
  const loser: Team = input.winner === 0 ? 1 : 0;
  const canCritical = !input.criticalDisabled && input.hp[loser] <= -100;
  // Choice and winType are distinct source enums. Never reuse raw choice as winType.
  const critical: -1 | Choice = input.choice === null ? -1 : input.choice;
  const winType: WinType = input.choice === null ? 0 : input.choice === 0 ? 1 : 2;
  const classification = input.choice === null ? 'Normal' : input.choice === 0 ? 'PushOn' : 'HaveMercy';
  return {
    ok: true, schemaVersion: 1, profile: PROFILE, policy: POLICY, evidence: EVIDENCE,
    state: { genericOnly: true, isTutorial: false, winner: input.winner, hp: [input.hp[0], input.hp[1]], criticalDisabled: input.criticalDisabled, critical, winType },
    receipt: { winner: input.winner, loser, losingHp: input.hp[loser], criticalDisabled: input.criticalDisabled,
      canCritical, choice: input.choice, initialCritical: -1, finalCritical: critical,
      initialWinType: 0, finalWinType: winType, classification, calcWinTypeApplied: canCritical,
      externalRngConsumed: 0, closingExecuted: false },
    nextCheckpoint: 'closing-pending',
  };
}
export const DEBATE_TERMINAL_CLASSIFICATION_POLICY_V1: DebateTerminalClassificationPolicyV1 = freeze(POLICY);
export const DEBATE_TERMINAL_CLASSIFICATION_EVIDENCE_V1: DebateTerminalClassificationEvidenceV1 = freeze(EVIDENCE);
/** Complete detached validation precedes classification; failure has no partial state. */
export function evaluateDebateTerminalClassification(input: unknown): DebateTerminalClassificationResultV1 {
  try { return freeze(resolve(parseInput(detach(input)))); }
  catch (error) { return freeze(failure(error)); }
}
