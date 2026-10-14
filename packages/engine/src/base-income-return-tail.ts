import source from '../../../docs/sources/base-income-return-tail.json' with {type: 'json'};

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object') {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
}
/** Listing reconstruction only: no caller gates, city calculation, or income posting. */
export const BASE_INCOME_RETURN_TAIL = deepFreeze(source);
export type BaseIncomeReturnTailInput = {
  readonly profile: 'base-income-return-tail-u32-v1';
  readonly resource: 'money' | 'food';
  /** Full raw EAX captured immediately after the city callee returns. */
  readonly cityCalculatorReturnU32: number;
  /** Separate later DWORD [ESI+08] observation; any nonzero raw value divides. */
  readonly lateFacilityTypeU32: number;
};
export type BaseIncomeReturnTailRejectionReason = 'invalid-input' | 'unexpected-field' | 'unsupported-profile' | 'unsupported-resource';
type Evidence = typeof BASE_INCOME_RETURN_TAIL.evidence;
export type BaseIncomeReturnTailDivision = {
  readonly multiplierU32: number;
  /** Exact signed 64-bit product as decimal; never a rounded JS number. */
  readonly productSignedDecimal: string;
  readonly productLowU32: number;
  readonly productHighSigned: number;
  readonly sarHighSigned: number;
  readonly correctionU32: number;
};
export type BaseIncomeReturnTailRejection = {
  readonly supported: false;
  readonly reason: BaseIncomeReturnTailRejectionReason;
  readonly evidence: Evidence;
};
export type BaseIncomeReturnTailReceipt = {
  readonly supported: true;
  readonly profile: BaseIncomeReturnTailInput['profile'];
  readonly resource: BaseIncomeReturnTailInput['resource'];
  readonly cityCalculatorReturnU32: number;
  readonly cityCalculatorReturnSigned: number;
  readonly lateFacilityTypeU32: number;
  readonly branch: 'copy' | 'signed-divide-by-five';
  readonly division: BaseIncomeReturnTailDivision | null;
  readonly returnedIncomeSigned: number;
  readonly returnedIncomeU32: number;
  readonly evidence: Evidence;
};
export type BaseIncomeReturnTailResult = BaseIncomeReturnTailRejection | BaseIncomeReturnTailReceipt;
const evidence = BASE_INCOME_RETURN_TAIL.evidence;
const reject = (reason: BaseIncomeReturnTailRejectionReason): BaseIncomeReturnTailRejection =>
  Object.freeze({supported: false, reason, evidence});
const u32 = (value: unknown): value is number => typeof value === 'number'
  && Number.isSafeInteger(value) && value >= 0 && value <= 0xFFFFFFFF;

/** Pure full-U32 capture projection. Nonzero raw types are not validated game enums. */
export function calculateBaseIncomeReturnTail(input: BaseIncomeReturnTailInput): BaseIncomeReturnTailResult {
  if (input === null || typeof input !== 'object') return reject('invalid-input');
  const prototype = Object.getPrototypeOf(input);
  if (prototype !== Object.prototype && prototype !== null) return reject('invalid-input');
  const required = ['profile', 'resource', 'cityCalculatorReturnU32', 'lateFacilityTypeU32'];
  const keys = Reflect.ownKeys(input);
  if (keys.some(key => typeof key !== 'string' || !required.includes(key))) return reject('unexpected-field');
  const descriptors = Object.getOwnPropertyDescriptors(input);
  if (required.some(key => !Object.hasOwn(descriptors, key) || !('value' in descriptors[key]!) || descriptors[key]!.enumerable !== true)) return reject('invalid-input');
  // Read only data descriptors: an accessor is rejected without invoking it.
  const values = Object.fromEntries(required.map(key => [key, descriptors[key]!.value]));
  if (values.profile !== 'base-income-return-tail-u32-v1') return reject('unsupported-profile');
  if (values.resource !== 'money' && values.resource !== 'food') return reject('unsupported-resource');
  if (!u32(values.cityCalculatorReturnU32) || !u32(values.lateFacilityTypeU32)) return reject('invalid-input');
  const cityCalculatorReturnU32 = values.cityCalculatorReturnU32 === 0 ? 0 : values.cityCalculatorReturnU32;
  const lateFacilityTypeU32 = values.lateFacilityTypeU32 === 0 ? 0 : values.lateFacilityTypeU32;
  const cityCalculatorReturnSigned = Number(BigInt.asIntN(32, BigInt(cityCalculatorReturnU32)));
  const divided = lateFacilityTypeU32 !== 0;
  let division: BaseIncomeReturnTailDivision | null = null;
  if (divided) {
    const product = BigInt(cityCalculatorReturnSigned) * 0x66666667n;
    const productHighSigned = Number(product >> 32n);
    const sarHighSigned = productHighSigned >> 1;
    division = {multiplierU32: 0x66666667, productSignedDecimal: product.toString(),
      productLowU32: Number(BigInt.asUintN(32, product)), productHighSigned, sarHighSigned,
      correctionU32: sarHighSigned >>> 31};
  }
  // BigInt signed division truncates toward zero and canonicalizes zero.
  const returnedIncomeSigned = divided ? Number(BigInt(cityCalculatorReturnSigned) / 5n) : cityCalculatorReturnSigned;
  const returnedIncomeU32 = Number(BigInt.asUintN(32, BigInt(returnedIncomeSigned)));
  return deepFreeze({supported: true, profile: values.profile, resource: values.resource,
    cityCalculatorReturnU32, cityCalculatorReturnSigned, lateFacilityTypeU32,
    branch: divided ? 'signed-divide-by-five' : 'copy', division,
    returnedIncomeSigned, returnedIncomeU32, evidence});
}
