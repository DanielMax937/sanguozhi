/** Read-only compatibility-format decoder, not a native map authenticity claim.
 * No filesystem/network access and no map/person/world effects.
 */
type Frozen<T> = T extends object ? { readonly [K in keyof T]: Frozen<T[K]> } : T;
export type ShexMapCellV1 = {
  index: number; x: number; y: number;
  terrain: number; areaId: number; lpB: number; trap: number; direction: number;
  interior: number; defence: number; thief: number; flood: number; fire: number; ruins: number;
};
export type ShexMapV1 = {
  profile: 'shex0008-modern-compatibility-v1'; header: 'SHEX0008';
  width: 200; height: 200; recordBytes: 11; sourceBytes: 440008;
  evidence: 'modern-compatibility-source'; nativeAuthenticity: 'not-established';
  cells: ShexMapCellV1[];
};
type Failure = { ok: false; reason: 'invalid-byte-array' | 'invalid-length' | 'invalid-header' | 'invalid-coordinate' };
export type ShexMapImportResultV1 = Frozen<{ ok: true; map: ShexMapV1 } | Failure>;
export type ShexMapCellResultV1 = Frozen<{ ok: true; profile: 'shex0008-modern-compatibility-v1'; cell: ShexMapCellV1 } | Failure>;
const PROFILE = 'shex0008-modern-compatibility-v1' as const;
const HEADER = [83, 72, 69, 88, 48, 48, 48, 56] as const;
const LENGTH = 440008;
class Invalid extends Error { constructor(readonly reason: Failure['reason']) { super(reason); } }
function reject(reason: Failure['reason']): never { throw new Invalid(reason); }
function freeze<T>(value: T): Frozen<T> {
  if (value !== null && typeof value === 'object') {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value as Frozen<T>;
}
/** Dense ordinary number array only. Accessors are rejected without invoking them.
 * Callers may explicitly turn their trusted binary buffer into an ordinary array.
 */
function bytes(input: unknown): number[] {
  if (!Array.isArray(input) || Object.getPrototypeOf(input) !== Array.prototype) reject('invalid-byte-array');
  const lengthDescriptor = Object.getOwnPropertyDescriptor(input, 'length');
  if (!lengthDescriptor || !('value' in lengthDescriptor) || lengthDescriptor.value !== LENGTH) reject('invalid-length');
  const descriptors = Object.getOwnPropertyDescriptors(input);
  const keys = Reflect.ownKeys(descriptors);
  if (keys.length !== LENGTH + 1 || keys.some(key => typeof key !== 'string'
    || !('value' in descriptors[key]!) || (key !== 'length' && !descriptors[key]!.enumerable))) reject('invalid-byte-array');
  const result: number[] = [];
  for (let i = 0; i < LENGTH; i++) {
    const descriptor = descriptors[String(i)];
    if (!descriptor || !('value' in descriptor)) reject('invalid-byte-array');
    const value: unknown = descriptor.value;
    if (typeof value !== 'number' || !Number.isInteger(value) || Object.is(value, -0) || value < 0 || value > 255) reject('invalid-byte-array');
    result.push(value);
  }
  if (HEADER.some((value, i) => result[i] !== value)) reject('invalid-header');
  return result;
}
function decode(data: number[], index: number): ShexMapCellV1 {
  const at = 8 + index * 11;
  return { index, x: Math.floor(index / 200), y: index % 200,
    terrain: data[at]!, areaId: data[at + 1]!, lpB: data[at + 2]!, trap: data[at + 3]!,
    direction: data[at + 4]!, interior: data[at + 5]!, defence: data[at + 6]!,
    thief: data[at + 7]!, flood: data[at + 8]!, fire: data[at + 9]!, ruins: data[at + 10]! };
}
function failure(error: unknown): Frozen<Failure> {
  if (!(error instanceof Invalid)) throw error;
  return freeze({ ok: false as const, reason: error.reason });
}
export function importShexMapV1(input: unknown): ShexMapImportResultV1 {
  try {
    const data = bytes(input), cells: ShexMapCellV1[] = [];
    for (let i = 0; i < 40000; i++) cells.push(decode(data, i));
    return freeze({ ok: true as const, map: { profile: PROFILE, header: 'SHEX0008' as const,
      width: 200 as const, height: 200 as const, recordBytes: 11 as const, sourceBytes: LENGTH,
      evidence: 'modern-compatibility-source' as const, nativeAuthenticity: 'not-established' as const, cells } });
  } catch (error) { return failure(error); }
}
/** Validate the entire supplied file, then inspect one cell; not a partial-file decoder. */
export function readShexMapCellV1(input: unknown, x: unknown, y: unknown): ShexMapCellResultV1 {
  const coordinate = (value: unknown): value is number => typeof value === 'number'
    && Number.isInteger(value) && !Object.is(value, -0) && value >= 0 && value < 200;
  if (!coordinate(x) || !coordinate(y)) return freeze({ ok: false as const, reason: 'invalid-coordinate' as const });
  try { return freeze({ ok: true as const, profile: PROFILE, cell: decode(bytes(input), x * 200 + y) }); }
  catch (error) { return failure(error); }
}
