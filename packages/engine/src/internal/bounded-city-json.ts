/** New bounded-city boundary only. Legacy profiles keep their original limits. */
const MAX_UTF8_BYTES = 8 * 1024 * 1024;
const MAX_NODES = 250_000;
const MAX_DEPTH = 48;
const MAX_ARRAY = 4096;
const MAX_OBJECT_KEYS = 128;

type JsonFailure = 'invalid-json' | 'duplicate-json-key' | 'invalid-number' | 'budget-exceeded';
type DataFailure = 'invalid-data' | 'invalid-number' | 'invalid-array' | 'invalid-prototype' | 'budget-exceeded';
type Result<R extends string> = { ok: true; value: unknown } | { ok: false; reason: R };

// Match the existing Node builtin lookup without introducing ambient Node types.
// Missing intrinsic support fails closed for object inputs; it never silently
// downgrades the public data boundary to a potentially trap-running clone.
const runtime = globalThis as {
  process?: { getBuiltinModule?: (id: string) => { types: { isProxy(value: unknown): boolean } } };
};
const isProxy = typeof runtime.process?.getBuiltinModule === 'function'
  ? runtime.process.getBuiltinModule('node:util').types.isProxy : null;

function isHighSurrogate(code: number): boolean { return code >= 0xd800 && code <= 0xdbff; }
function isLowSurrogate(code: number): boolean { return code >= 0xdc00 && code <= 0xdfff; }

/** Actual UTF-8 byte length, with replacement encoding for lone JS surrogates. */
function textFitsUtf8(text: string): boolean {
  if (text.length > MAX_UTF8_BYTES) return false;
  let bytes = 0;
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code <= 0x7f) bytes++;
    else if (code <= 0x7ff) bytes += 2;
    else if (isHighSurrogate(code) && isLowSurrogate(text.charCodeAt(i + 1))) { bytes += 4; i++; }
    else bytes += 3;
    if (bytes > MAX_UTF8_BYTES) return false;
  }
  return true;
}

/** Count the actual canonical JSON representation before allocating it. */
function makeBudget(fail: () => never) {
  let bytes = 0, nodes = 0;
  function add(count: number): void {
    bytes += count;
    if (bytes > MAX_UTF8_BYTES) fail();
  }
  function node(depth: number): void {
    // Root is depth zero; keys are not nodes, but their encoded bytes are counted.
    if (++nodes > MAX_NODES || depth > MAX_DEPTH) fail();
  }
  function string(value: string): void {
    // The actual encoded length cannot be smaller than the UTF-16 code-unit length.
    if (value.length > MAX_UTF8_BYTES || value.length + 2 > MAX_UTF8_BYTES - bytes) fail();
    add(2);
    for (let i = 0; i < value.length; i++) {
      const code = value.charCodeAt(i);
      if (code === 0x22 || code === 0x5c || code === 8 || code === 9 || code === 10 || code === 12 || code === 13) add(2);
      else if (code < 0x20) add(6);
      else if (code <= 0x7f) add(1);
      else if (code <= 0x7ff) add(2);
      else if (isHighSurrogate(code) && isLowSurrogate(value.charCodeAt(i + 1))) { add(4); i++; }
      else if (isHighSurrogate(code) || isLowSurrogate(code)) add(6);
      else add(3);
    }
  }
  return { add, node, string };
}

/**
 * Strict document parser, also accepting a top-level JSON string for CLI paths.
 * Only bounded individual string tokens reach JSON.parse; objects are assembled
 * here, after decoded-key duplicate detection and before any overwrite could occur.
 * This produces candidate data, never a validated state or a trusted-state token.
 */
export function decodeBoundedCityJson(text: string): Result<JsonFailure> {
  if (typeof text !== 'string') return { ok: false, reason: 'invalid-json' };
  if (!textFitsUtf8(text)) return { ok: false, reason: 'budget-exceeded' };
  let position = 0;
  let failure: JsonFailure = 'invalid-json';
  const abort = Symbol('bounded-city-json-rejection');
  function fail(reason: JsonFailure): never { failure = reason; throw abort; }
  const budget = makeBudget(() => fail('budget-exceeded'));
  function whitespace(): void {
    while (position < text.length) {
      const code = text.charCodeAt(position);
      if (code !== 0x20 && code !== 9 && code !== 10 && code !== 13) return;
      position++;
    }
  }
  function digit(code: number): boolean { return code >= 0x30 && code <= 0x39; }
  function hex(code: number): boolean {
    return digit(code) || (code >= 0x41 && code <= 0x46) || (code >= 0x61 && code <= 0x66);
  }
  function stringToken(): string {
    const start = position;
    if (text.charCodeAt(position++) !== 0x22) fail('invalid-json');
    while (position < text.length) {
      const code = text.charCodeAt(position++);
      if (code === 0x22) {
        // The whole text passed both length and UTF-8 gates before this slice.
        const value: unknown = JSON.parse(text.slice(start, position));
        if (typeof value !== 'string') fail('invalid-json');
        return value;
      }
      if (code < 0x20) fail('invalid-json');
      if (code !== 0x5c) continue;
      if (position >= text.length) fail('invalid-json');
      const escape = text.charCodeAt(position++);
      if (escape === 0x75) {
        for (let i = 0; i < 4; i++) if (!hex(text.charCodeAt(position++))) fail('invalid-json');
      } else if (escape !== 0x22 && escape !== 0x5c && escape !== 0x2f && escape !== 0x62
        && escape !== 0x66 && escape !== 0x6e && escape !== 0x72 && escape !== 0x74) fail('invalid-json');
    }
    return fail('invalid-json');
  }
  function numberToken(): number {
    const start = position;
    if (text.charCodeAt(position) === 0x2d) position++;
    if (text.charCodeAt(position) === 0x30) {
      position++;
      if (digit(text.charCodeAt(position))) fail('invalid-json');
    } else {
      const first = text.charCodeAt(position);
      if (first < 0x31 || first > 0x39 || !digit(first)) fail('invalid-json');
      while (digit(text.charCodeAt(position))) position++;
    }
    if (text.charCodeAt(position) === 0x2e) {
      position++;
      if (!digit(text.charCodeAt(position))) fail('invalid-json');
      while (digit(text.charCodeAt(position))) position++;
    }
    if (text.charCodeAt(position) === 0x65 || text.charCodeAt(position) === 0x45) {
      position++;
      if (text.charCodeAt(position) === 0x2b || text.charCodeAt(position) === 0x2d) position++;
      if (!digit(text.charCodeAt(position))) fail('invalid-json');
      while (digit(text.charCodeAt(position))) position++;
    }
    const value = Number(text.slice(start, position));
    if (!Number.isSafeInteger(value) || Object.is(value, -0)) fail('invalid-number');
    budget.add(String(value).length);
    return value;
  }
  function value(depth: number): unknown {
    budget.node(depth);
    whitespace();
    const code = text.charCodeAt(position);
    if (code === 0x22) { const result = stringToken(); budget.string(result); return result; }
    if (code === 0x2d || digit(code)) return numberToken();
    if (code === 0x7b) {
      position++;
      budget.add(2);
      const result = Object.create(null) as Record<string, unknown>;
      const seen = new Set<string>();
      whitespace();
      if (text.charCodeAt(position) === 0x7d) { position++; return result; }
      while (position < text.length) {
        const key = stringToken();
        if (seen.has(key)) fail('duplicate-json-key');
        if (seen.size >= MAX_OBJECT_KEYS) fail('budget-exceeded');
        if (seen.size > 0) budget.add(1);
        seen.add(key);
        budget.string(key);
        budget.add(1);
        whitespace();
        if (text.charCodeAt(position++) !== 0x3a) fail('invalid-json');
        result[key] = value(depth + 1);
        whitespace();
        const delimiter = text.charCodeAt(position++);
        if (delimiter === 0x7d) return result;
        if (delimiter !== 0x2c) fail('invalid-json');
        whitespace();
      }
      return fail('invalid-json');
    }
    if (code === 0x5b) {
      position++;
      budget.add(2);
      const result: unknown[] = [];
      whitespace();
      if (text.charCodeAt(position) === 0x5d) { position++; return result; }
      while (position < text.length) {
        if (result.length >= MAX_ARRAY) fail('budget-exceeded');
        if (result.length > 0) budget.add(1);
        result.push(value(depth + 1));
        whitespace();
        const delimiter = text.charCodeAt(position++);
        if (delimiter === 0x5d) return result;
        if (delimiter !== 0x2c) fail('invalid-json');
        whitespace();
      }
      return fail('invalid-json');
    }
    if (text.startsWith('null', position)) { position += 4; budget.add(4); return null; }
    if (text.startsWith('true', position)) { position += 4; budget.add(4); return true; }
    if (text.startsWith('false', position)) { position += 5; budget.add(5); return false; }
    return fail('invalid-json');
  }
  try {
    const result = value(0);
    whitespace();
    if (position !== text.length) fail('invalid-json');
    return { ok: true, value: result };
  } catch (error: unknown) {
    // Identity comparison only: never inspect arbitrary exception properties.
    return { ok: false, reason: error === abort ? failure : 'invalid-json' };
  }
}

function inspectData(value: unknown, detach: boolean): Result<DataFailure> {
  let failure: DataFailure = 'invalid-data';
  const abort = Symbol('bounded-city-data-rejection');
  function fail(reason: DataFailure): never { failure = reason; throw abort; }
  const budget = makeBudget(() => fail('budget-exceeded'));
  const active = new Set<object>();
  function visit(input: unknown, depth: number): unknown {
    budget.node(depth);
    if (input === null) { budget.add(4); return null; }
    if (typeof input === 'boolean') { budget.add(input ? 4 : 5); return input; }
    if (typeof input === 'string') { budget.string(input); return input; }
    if (typeof input === 'number') {
      if (!Number.isSafeInteger(input) || Object.is(input, -0)) fail('invalid-number');
      budget.add(String(input).length);
      return input;
    }
    if (typeof input !== 'object') return fail('invalid-data');
    // This intrinsic is deliberately before Array.isArray, prototype inspection,
    // own-key enumeration, or descriptor inspection, including for revoked proxies.
    if (isProxy === null || isProxy(input)) fail('invalid-data');
    if (active.has(input)) fail('invalid-data');
    const array = Array.isArray(input);
    const prototype: unknown = Object.getPrototypeOf(input);
    if (array ? prototype !== Array.prototype : prototype !== Object.prototype && prototype !== null) fail('invalid-prototype');
    active.add(input);
    try {
      if (array) {
        const lengthDescriptor = Object.getOwnPropertyDescriptor(input, 'length');
        if (!lengthDescriptor || !Object.hasOwn(lengthDescriptor, 'value')) fail('invalid-array');
        const length: unknown = lengthDescriptor.value;
        if (typeof length !== 'number' || !Number.isSafeInteger(length) || length < 0) fail('invalid-array');
        if (length > MAX_ARRAY) fail('budget-exceeded');
        const keys = Reflect.ownKeys(input);
        if (keys.length > MAX_ARRAY + 1) fail('budget-exceeded');
        if (keys.length !== length + 1 || keys.some(key => typeof key !== 'string')) fail('invalid-array');
        budget.add(2 + Math.max(0, length - 1));
        const result: unknown[] | null = detach ? [] : null;
        for (let i = 0; i < length; i++) {
          const descriptor = Object.getOwnPropertyDescriptor(input, String(i));
          if (!descriptor || !Object.hasOwn(descriptor, 'value') || descriptor.enumerable !== true) fail('invalid-array');
          const child = visit(descriptor.value, depth + 1);
          if (result !== null) result.push(child);
        }
        return result;
      }
      const keys = Reflect.ownKeys(input);
      if (keys.length > MAX_OBJECT_KEYS) fail('budget-exceeded');
      budget.add(2 + Math.max(0, keys.length - 1));
      const result = detach ? Object.create(null) as Record<string, unknown> : null;
      for (const key of keys) {
        if (typeof key !== 'string') fail('invalid-data');
        const descriptor = Object.getOwnPropertyDescriptor(input, key);
        if (!descriptor || !Object.hasOwn(descriptor, 'value') || descriptor.enumerable !== true) fail('invalid-data');
        budget.string(key);
        budget.add(1);
        const child = visit(descriptor.value, depth + 1);
        if (result !== null) result[key] = child;
      }
      return result;
    } finally { active.delete(input); }
  }
  try { return { ok: true, value: visit(value, 0) }; }
  catch (error: unknown) {
    return { ok: false, reason: error === abort ? failure : 'invalid-data' };
  }
}

/**
 * Descriptor-only snapshot of caller input. Never invokes caller getters, proxy
 * traps, coercion, toJSON, or iterators; never mutates or freezes caller objects.
 * Shared noncyclic aliases are copied separately and counted at every occurrence.
 */
export function detachBoundedCityData(value: unknown): Result<DataFailure> {
  return inspectData(value, true);
}

/** Full UTF-8/shape budgets, safely accepting arbitrary caller data. */
export function boundedCityJsonFits(value: unknown): boolean {
  return inspectData(value, false).ok;
}

/**
 * Canonicalization for OWNED, already validated bounded data only. This is not an
 * input boundary. Public wrappers must detach/validate before calling this helper.
 * Keys sort by JavaScript UTF-16 code units; arrays retain their original order.
 */
export function canonicalBoundedCityJson(value: unknown): string {
  if (value === null) return 'null';
  if (typeof value === 'string' || typeof value === 'boolean' || typeof value === 'number') return JSON.stringify(value);
  if (Array.isArray(value)) {
    const parts: string[] = [];
    for (let i = 0; i < value.length; i++) parts.push(canonicalBoundedCityJson(value[i]));
    return '[' + parts.join(',') + ']';
  }
  if (typeof value !== 'object') throw new TypeError('Expected owned bounded-city JSON data');
  const record = value as Record<string, unknown>;
  const parts: string[] = [];
  for (const key of Object.keys(record).sort()) parts.push(JSON.stringify(key) + ':' + canonicalBoundedCityJson(record[key]));
  return '{' + parts.join(',') + '}';
}
