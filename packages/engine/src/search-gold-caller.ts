import source from '../../../docs/sources/search-gold-caller.json' with { type: 'json' };

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object') {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
}
/** Published listing only: no native helper, reward writer or stock certification. */
export const SEARCH_GOLD_CALLER = deepFreeze(source);
export type SearchGoldSecondRead = { readonly gold: number; readonly capacity: number };
export type SearchGoldCallerInput = {
  readonly profile: 'search-gold-caller-resolved-v1';
  readonly rngEax: number;
  readonly firstGold: number;
  readonly firstCapacity: number;
  readonly secondRead?: SearchGoldSecondRead;
};
export type SearchGoldCallerRejectionReason = 'invalid-input' | 'unexpected-field'
  | 'unsupported-profile' | 'invalid-u32' | 'second-read-required'
  | 'unexpected-second-read' | 'invalid-second-read';
type Evidence = typeof SEARCH_GOLD_CALLER.evidence;
export type SearchGoldCallerRejection = {
  readonly supported: false; readonly reason: SearchGoldCallerRejectionReason; readonly evidence: Evidence;
};
export type SearchGoldCallObservation = {
  readonly callAddress: string; readonly target: string; readonly value: number;
};
export type SearchGoldCallerReceipt = SearchGoldCallerInput & {
  readonly supported: true;
  readonly rngLow16: number; readonly proposedAmount: number; readonly firstSumU32: number;
  readonly capacityExceeded: boolean; readonly amountU32: number; readonly amountSigned: number;
  readonly outcome: 'nothing' | 'gold-handler';
  readonly branchTrace: { readonly rollCapTaken: boolean; readonly capacitySufficientTaken: boolean; readonly nothingTaken: boolean };
  readonly reads: readonly SearchGoldCallObservation[];
  readonly exitAddress: '005D5BF8' | '005D5C02';
  readonly handlerTarget: '005D3F80' | '005D4160';
  readonly goldHandlerArgument: number | null;
  readonly evidence: Evidence;
};
export type SearchGoldCallerResult = SearchGoldCallerRejection | SearchGoldCallerReceipt;
const evidence = SEARCH_GOLD_CALLER.evidence;
const reject = (reason: SearchGoldCallerRejectionReason): SearchGoldCallerRejection => Object.freeze({supported: false, reason, evidence});
const uint32 = (v: unknown): v is number => typeof v === 'number' && Number.isSafeInteger(v) && v >= 0 && v <= 0xffffffff;
const signed32 = (v: number): number => v >= 0x80000000 ? v - 0x100000000 : v;
const normalized = (v: number): number => v === 0 ? 0 : v;
function ownData(value: unknown, required: readonly string[], optional: readonly string[] = []): PropertyDescriptorMap | null {
  if (value === null || typeof value !== 'object') return null;
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) return null;
  const keys = Reflect.ownKeys(value);
  if (keys.some(k => typeof k !== 'string' || ![...required, ...optional].includes(k))) return null;
  const descriptors = Object.getOwnPropertyDescriptors(value);
  // Descriptor maps otherwise inherit Object.prototype: polluted names must never
  // supply missing observations or trigger inherited getters.
  Object.setPrototypeOf(descriptors, null);
  if (required.some(k => !descriptors[k]) || keys.some(k => !Object.hasOwn(descriptors[k as string]!, 'value'))) return null;
  return descriptors;
}
/**
 * Project already captured EAX observations through the caller's 32-bit arithmetic.
 * Four getter sites are distinct. A second pair is required exactly on the clipping
 * path; its values may differ from the first. No helper or handler is executed.
 * Captured-u32 inputs do not assert native reachability or actual reward amounts.
 */
export function calculateSearchGoldCallerProjection(input: SearchGoldCallerInput): SearchGoldCallerResult {
  if (input === null || typeof input !== 'object') return reject('invalid-input');
  const prototype = Object.getPrototypeOf(input);
  if (prototype !== Object.prototype && prototype !== null) return reject('invalid-input');
  const allowed = ['profile', 'rngEax', 'firstGold', 'firstCapacity', 'secondRead'];
  if (Reflect.ownKeys(input).some(k => typeof k !== 'string' || !allowed.includes(k))) return reject('unexpected-field');
  const d = ownData(input, ['profile', 'rngEax', 'firstGold', 'firstCapacity'], ['secondRead']);
  if (!d) return reject('invalid-input');
  const profile = d.profile!.value;
  if (profile !== 'search-gold-caller-resolved-v1') return reject('unsupported-profile');
  if (![d.rngEax!.value, d.firstGold!.value, d.firstCapacity!.value].every(uint32)) return reject('invalid-u32');
  const rngEax = normalized(d.rngEax!.value as number);
  const firstGold = normalized(d.firstGold!.value as number);
  const firstCapacity = normalized(d.firstCapacity!.value as number);
  const rngLow16 = rngEax & 0xffff;
  const proposedAmount = Math.min(rngLow16, 80);
  const firstSumU32 = (firstGold + proposedAmount) >>> 0;
  const capacityExceeded = signed32(firstCapacity) < signed32(firstSumU32);
  if (capacityExceeded && !d.secondRead) return reject('second-read-required');
  if (!capacityExceeded && d.secondRead) return reject('unexpected-second-read');
  const reads: SearchGoldCallObservation[] = [
    {callAddress: '005D5BBE', target: '00486C80', value: firstGold},
    {callAddress: '005D5BCB', target: '00486D30', value: firstCapacity},
  ];
  let secondRead: SearchGoldSecondRead | undefined;
  let amountU32 = proposedAmount;
  if (capacityExceeded) {
    const s = ownData(d.secondRead!.value, ['gold', 'capacity']);
    if (!s || !uint32(s.gold!.value) || !uint32(s.capacity!.value)) return reject('invalid-second-read');
    secondRead = Object.freeze({gold: normalized(s.gold!.value), capacity: normalized(s.capacity!.value)});
    reads.push({callAddress: '005D5BDA', target: '00486C80', value: secondRead.gold},
      {callAddress: '005D5BE3', target: '00486D30', value: secondRead.capacity});
    amountU32 = (secondRead.capacity - secondRead.gold) >>> 0;
  }
  const amountSigned = signed32(amountU32);
  const nothingTaken = amountSigned < 30;
  const branchTrace = Object.freeze({rollCapTaken: rngLow16 > 80, capacitySufficientTaken: !capacityExceeded, nothingTaken});
  return deepFreeze({supported: true, profile, rngEax, firstGold, firstCapacity,
    ...(secondRead === undefined ? {} : {secondRead}), rngLow16, proposedAmount, firstSumU32,
    capacityExceeded, amountU32, amountSigned, outcome: nothingTaken ? 'nothing' : 'gold-handler',
    branchTrace, reads, exitAddress: nothingTaken ? '005D5C02' : '005D5BF8',
    handlerTarget: nothingTaken ? '005D4160' : '005D3F80', goldHandlerArgument: nothingTaken ? null : amountU32, evidence});
}
