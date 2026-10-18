/** Read-only source observations. No scheduler, event execution, world state or persistence. */
import registryData from '../../../data/catalogs/source-event-query-profile-v1.json' with { type: 'json' };
import genericWiki from '../../../data/generic-events/atwiki-88.json' with { type: 'json' };
import genericGamerSky from '../../../data/generic-events/gamersky-2009.json' with { type: 'json' };
import historicalWiki from '../../../data/scenario-events/atwiki-88.json' with { type: 'json' };
import historicalGamerSky from '../../../data/scenario-events/gamersky-2008.json' with { type: 'json' };
import ps2Wiki from '../../../data/ps2-scenario-events/atwiki-100.json' with { type: 'json' };

type Frozen<T> = T extends object ? { readonly [K in keyof T]: Frozen<T[K]> } : T;
type Json = null | boolean | number | string | Json[] | { [key: string]: Json };
type Raw = { [key: string]: Json };
type Truth = 'met' | 'not-met' | 'unknown';
type Family = 'generic-events' | 'scenario-events' | 'ps2-scenario-events';
type SymbolId = 'search-city' | 'searching-person' | 'yu-ji';
type Field = 'security' | 'gold' | 'current.plague' | 'current.locust';
type Literal = { type: 'integer'; value: number } | { type: 'boolean'; value: boolean } | { type: 'id'; value: string };
type Operator = 'eq' | 'ne' | 'lt' | 'lte' | 'gt' | 'gte' | 'in' | 'not-in';
type Atom = { kind: 'atom'; id: string; symbol: 'search-city'; entityKind: 'city'; field: Field; valueType: 'integer' | 'boolean'; operator: Operator; literals: Literal[]; certainty: 'source-stated'; semanticScope: string };
type Expression = Atom | { kind: 'all' | 'any'; id: string; certainty: 'source-stated'; semanticScope: string; groupingEvidence: string; children: Expression[] };
type Predicate = { id: string; observationId: string; sourcePath: string; sourceGitBlobSha: string; sourceJSONPointer: string; sourceClause: Raw; sourceClauseSha256: string; sourceClauseHashEncoding: string; certainty: 'source-stated'; semanticScope: string; clauseCoverage: 'complete' | 'partial'; uncoveredReasons: string[]; requiredBindings: SymbolId[]; expression: Expression };
type Source = { family: Family; path: string; gitBlobSha: string; sha256: string; bytes: number; commit: string; tree: string; datasetId: string; collection: 'observations' | 'events'; evidence: 'public-guide-transcription' };
type Registry = { schemaVersion: 1; id: 'source-event-query-v1'; executionEnabled: false; sourceIdentityPolicy: string; sources: Source[]; predicates: Predicate[]; operatorPolicy: Raw; limitations: string[] };
type Corpus = { datasetId: string; executionEnabled: false; observations?: Raw[]; events?: Raw[]; sourceURL?: string; snapshotSha256?: string; versionScope?: Raw };
type Ref = { family: Family; sourcePath: string; gitBlobSha: string; sha256: string; observationId: string };
type City = { id: string; security?: number; gold?: number; current?: { plague?: boolean; locust?: boolean } };
type Person = { id: string; cityId?: string };
type Binding = { symbol: SymbolId; entityKind: 'city' | 'person'; entityId: string };
type TargetVersion = { edition: 'PK' | 'Vanilla' | null; platform: 'PC' | 'PS2' | 'Wii' | null; patch: string | null };
type Input = { schemaVersion: 1; queryProfile: 'source-event-query-v1'; observationRef: Ref; targetVersion: TargetVersion; facts: { cities: City[]; persons: Person[] }; bindings: Binding[] };
type Reason = { code: string; sourceJSONPointer: string | null; factJSONPointer: string | null; detail: string };
type Evidence = { sourceRef: Ref; commit: string; tree: string; datasetId: string; evidence: 'public-guide-transcription'; sourceURL: string | null; sourceJSONPointer: string; sourceLocator: Json; snapshotSha256: string | null };
type Comparison = { predicateId: string; kind: 'atom' | 'all' | 'any'; comparisonStatus: Truth; semanticScope: string; factJSONPointers: string[]; bindingJSONPointers: string[]; actual: Literal | null; operator: Operator | null; literals: Literal[]; reasons: Reason[]; children: Comparison[] };
type NodeShape = 'generic-claim' | 'ps2-clause' | 'historical-fact' | 'historical-all' | 'historical-any' | 'historical-if' | 'historical-effect' | 'historical-branch' | 'historical-choice' | 'historical-option' | 'historical-prerequisite' | 'ps2-reference' | 'unresolved-date-wrapper' | 'source-note' | 'unrecognized-source-node';
type Clause = { nodeShape: NodeShape; evidence: Evidence; originalClause: Json; originalText: string | null; role: string; status: Truth; comparison: Comparison | null; reasons: Reason[] };
type Boundary = { executionEnabled: false; executionEligibility: 'disabled-source-corpus'; repeatability: 'unknown-repeatability'; eventOccurrence: 'not-evaluated'; effects: 'not-executed'; originalRuntimeEquivalent: false };
type Output = { ok: true; schemaVersion: 1; queryProfile: 'source-event-query-v1'; observationRef: Ref; resolution: 'resolved' | 'unknown'; documentedConditionsStatus: Truth; conditionCompleteness: string; resultCompleteness: string; versionResolution: { status: 'unknown' | 'conflict' | 'matched'; source: Json; target: TargetVersion; reasons: Reason[] }; onceOnly: Json; boundary: Boundary; evidence: Evidence | null; originalObservation: Raw | null; clauses: Clause[]; reasons: Reason[] };
type Failure = { ok: false; reason: string; inputJSONPointer: string | null; pointerStatus: 'provided' | 'omitted-too-long' | 'omitted-output-budget' };
type ProfileResult = { ok: true; profile: Registry } | Failure;
type ListResult = { ok: true; observations: Summary[] } | Failure;
type Result = Output | Failure;
type Summary = { observationRef: Ref; title: string; sourceURL: string | null; sourceJSONPointer: string; coverageKind: string; registeredPredicateIds: string[]; executionEnabled: false };
export type SourceEventQueryInputV1 = Frozen<Input>;
export type SourceEventQueryResultV1 = Frozen<Result>;
export type SourceEventQueryProfileV1 = Frozen<Registry>;
export type SourceEventQueryProfileResultV1 = Frozen<ProfileResult>;
export type SourceEventObservationListResultV1 = Frozen<ListResult>;
export type SourceEventObservationSummaryV1 = Frozen<Summary>;
export type SourceEventTruthV1 = Truth;

const PROFILE = 'source-event-query-v1' as const;
const MAX_BYTES = 1_048_576, MAX_NODES = 16_384, MAX_DEPTH = 24, MAX_ARRAY = 256;
const MAX_OUTPUT_BYTES = 4_194_304, MAX_OUTPUT_NODES = 65_536, MAX_OUTPUT_DEPTH = 48, MAX_FAILURE_POINTER_BYTES = 1024;
const BOUNDARY: Boundary = { executionEnabled: false, executionEligibility: 'disabled-source-corpus', repeatability: 'unknown-repeatability', eventOccurrence: 'not-evaluated', effects: 'not-executed', originalRuntimeEquivalent: false };
const REGISTRY: Registry = JSON.parse(JSON.stringify(registryData)) as Registry;
const CORPORA: Record<string, Corpus> = {
  'data/generic-events/atwiki-88.json': clone(genericWiki) as unknown as Corpus,
  'data/generic-events/gamersky-2009.json': clone(genericGamerSky) as unknown as Corpus,
  'data/scenario-events/atwiki-88.json': clone(historicalWiki) as unknown as Corpus,
  'data/scenario-events/gamersky-2008.json': clone(historicalGamerSky) as unknown as Corpus,
  'data/ps2-scenario-events/atwiki-100.json': clone(ps2Wiki) as unknown as Corpus,
};
function freeze<T>(v: T): Frozen<T> { if (v !== null && typeof v === 'object' && !Object.isFrozen(v)) { for (const x of Object.values(v)) freeze(x); Object.freeze(v); } return v as Frozen<T>; }
function clone<T>(v: T): T { return JSON.parse(JSON.stringify(v)) as T; }
function canonical(v: unknown): string { if (v === null || typeof v !== 'object') return JSON.stringify(v); if (Array.isArray(v)) return '[' + v.map(canonical).join(',') + ']'; const r = v as Record<string, unknown>; return '{' + Object.keys(r).sort().map(k => JSON.stringify(k) + ':' + canonical(r[k])).join(',') + '}'; }
function utf8Bytes(s: string): number { let n = 0; for (const c of s) { const p = c.codePointAt(0)!; n += p < 128 ? 1 : p < 2048 ? 2 : p < 65536 ? 3 : 4; } return n; }
function escapePointer(s: string): string { return s.replace(/~/g, '~0').replace(/\//g, '~1'); }
class Invalid extends Error {
  readonly reason: string; readonly inputJSONPointer: string;
  constructor(reason: string, inputJSONPointer: string) { super(reason); this.reason = reason; this.inputJSONPointer = inputJSONPointer; }
}
function fail(reason: string, path: string): never { throw new Invalid(reason, path); }
/** Only non-Proxy DTOs in an unpolluted runtime are supported. JavaScript reflection
 * cannot universally identify Proxies and may invoke their traps. Own accessors are
 * rejected without invoking them; this is not a hostile-object security sandbox. */
function detach(value: unknown): unknown {
  let nodes = 0, bytes = 0; const active = new Set<object>();
  function visit(x: unknown, path: string, depth: number): unknown {
    if (++nodes > MAX_NODES || depth > MAX_DEPTH) fail('input-budget', path);
    if (x === null || typeof x === 'boolean') return x;
    if (typeof x === 'number') { if (!Number.isSafeInteger(x) || Object.is(x, -0)) fail('invalid-number', path); return x; }
    if (typeof x === 'string') { if (x.length > MAX_BYTES) fail('input-budget', path); bytes += utf8Bytes(x); if (bytes > MAX_BYTES) fail('input-budget', path); return x; }
    if (typeof x !== 'object' || active.has(x)) fail('non-json-or-cycle', path);
    const array = Array.isArray(x), proto = Object.getPrototypeOf(x);
    if (proto !== (array ? Array.prototype : Object.prototype) && !(proto === null && !array)) fail('invalid-prototype', path);
    const keys = Reflect.ownKeys(x);
    if (keys.length > (array ? MAX_ARRAY + 1 : 32)) fail('input-budget', path);
    const ds = Object.getOwnPropertyDescriptors(x); Object.setPrototypeOf(ds, null);
    for (const key of keys) if (typeof key !== 'string' || !Object.hasOwn(ds[key]!, 'value') || (!ds[key]!.enumerable && !(array && key === 'length'))) fail('accessor-symbol-or-hidden-field', path);
    active.add(x);
    try {
      if (array) {
        const length = ds.length!.value as number;
        if (!Number.isSafeInteger(length) || length < 0 || length > MAX_ARRAY || keys.length !== length + 1) fail('invalid-array', path);
        const out: unknown[] = [];
        for (let i = 0; i < length; i++) { const d = ds[String(i)]; if (!Object.hasOwn(ds, String(i)) || !d) fail('sparse-or-custom-array', path); out.push(visit(d.value, `${path}/${i}`, depth + 1)); }
        return out;
      }
      const out: Record<string, unknown> = Object.create(null) as Record<string, unknown>;
      for (const key of keys as string[]) { bytes += utf8Bytes(key); if (bytes > MAX_BYTES) fail('input-budget', path); out[key] = visit(ds[key]!.value, `${path}/${escapePointer(key)}`, depth + 1); }
      return out;
    } finally { active.delete(x); }
  }
  const result = visit(value, '', 0); if (utf8Bytes(canonical(result)) > MAX_BYTES) fail('input-budget', ''); return result;
}
/** Complete response budget, independent of the input budget. Receives only owned DTOs. */
function responseBudget(value: unknown): void {
  let nodes = 0, bytes = 0;
  function visit(v: unknown, depth: number): void {
    if (++nodes > MAX_OUTPUT_NODES || depth > MAX_OUTPUT_DEPTH) fail('output-budget', '');
    if (typeof v === 'string') { bytes += utf8Bytes(v); if (bytes > MAX_OUTPUT_BYTES) fail('output-budget', ''); return; }
    if (v === null || typeof v !== 'object') return;
    if (Array.isArray(v)) { for (const child of v) visit(child, depth + 1); return; }
    for (const [key, child] of Object.entries(v)) { bytes += utf8Bytes(key); if (bytes > MAX_OUTPUT_BYTES) fail('output-budget', ''); visit(child, depth + 1); }
  }
  visit(value, 0);
  if (utf8Bytes(canonical(value)) > MAX_OUTPUT_BYTES) fail('output-budget', '');
}
/** Fixed small fallback. Never echoes an overlong failing path or arbitrary Error text. */
function smallFailure(error: unknown): Failure {
  if (error instanceof Invalid && error.reason === 'output-budget') return { ok: false, reason: 'output-budget', inputJSONPointer: null, pointerStatus: 'omitted-output-budget' };
  const pointer = error instanceof Invalid ? error.inputJSONPointer : '';
  const tooLong = pointer.length > MAX_FAILURE_POINTER_BYTES || utf8Bytes(pointer) > MAX_FAILURE_POINTER_BYTES;
  return { ok: false, reason: error instanceof Invalid ? error.reason : 'invalid-input', inputJSONPointer: tooLong ? null : pointer, pointerStatus: tooLong ? 'omitted-too-long' : 'provided' };
}
function respond<T>(work: () => T): Frozen<T | Failure> {
  try { const result = work(); responseBudget(result); return freeze(result); }
  catch (error) { return freeze(smallFailure(error)); }
}
function object(v: unknown, required: readonly string[], optional: readonly string[], path: string): Record<string, unknown> {
  if (v === null || typeof v !== 'object' || Array.isArray(v)) fail('invalid-object', path);
  const r = v as Record<string, unknown>;
  if (required.some(k => !Object.hasOwn(r, k)) || Object.keys(r).some(k => !required.includes(k) && !optional.includes(k))) fail('unexpected-or-missing-field', path);
  return r;
}
function text(v: unknown, path: string, max = 256): string { if (typeof v !== 'string' || v.length < 1 || v.length > max) fail('invalid-string', path); return v; }
function id(v: unknown, path: string): string { const s = text(v, path, 96); if (!/^[A-Za-z0-9]/.test(s) || /[^A-Za-z0-9_.:-]/.test(s)) fail('invalid-id', path); return s; }
function uint(v: unknown, path: string, max = Number.MAX_SAFE_INTEGER): number { if (typeof v !== 'number' || !Number.isSafeInteger(v) || Object.is(v, -0) || v < 0 || v > max) fail('invalid-number', path); return v; }
function bool(v: unknown, path: string): boolean { if (typeof v !== 'boolean') fail('invalid-boolean', path); return v; }
function list(v: unknown, path: string, max: number): unknown[] { if (!Array.isArray(v) || v.length > max) fail('invalid-array', path); return v; }
function choice<T extends string>(v: unknown, values: readonly T[], path: string): T { if (typeof v !== 'string' || !values.includes(v as T)) fail('invalid-enum', path); return v as T; }
function hash(v: unknown, size: number, path: string): string { const s = text(v, path); if (s.length !== size || /[^0-9a-f]/.test(s)) fail('invalid-hash', path); return s; }
function parseInput(value: unknown): Input {
  const r = object(detach(value), ['schemaVersion', 'queryProfile', 'observationRef', 'targetVersion', 'facts', 'bindings'], [], '');
  if (r.schemaVersion !== 1 || r.queryProfile !== PROFILE) fail('unsupported-query-profile', '');
  const f = object(r.facts, ['cities', 'persons'], [], '/facts'); const ids = new Set<string>();
  const unique = (v: unknown, path: string): string => { const value = id(v, path); if (ids.has(value)) fail('duplicate-entity-id', path); ids.add(value); return value; };
  const cities: City[] = list(f.cities, '/facts/cities', 64).map((v, i) => {
    const p = `/facts/cities/${i}`, c = object(v, ['id'], ['security', 'gold', 'current'], p); const out: City = { id: unique(c.id, p + '/id') };
    if (Object.hasOwn(c, 'security')) out.security = uint(c.security, p + '/security', 100);
    if (Object.hasOwn(c, 'gold')) out.gold = uint(c.gold, p + '/gold');
    if (Object.hasOwn(c, 'current')) { const current = object(c.current, [], ['plague', 'locust'], p + '/current'); out.current = {}; if (Object.hasOwn(current, 'plague')) out.current.plague = bool(current.plague, p + '/current/plague'); if (Object.hasOwn(current, 'locust')) out.current.locust = bool(current.locust, p + '/current/locust'); }
    return out;
  });
  const persons: Person[] = list(f.persons, '/facts/persons', 64).map((v, i) => { const p = `/facts/persons/${i}`, person = object(v, ['id'], ['cityId'], p); const out: Person = { id: unique(person.id, p + '/id') }; if (Object.hasOwn(person, 'cityId')) out.cityId = id(person.cityId, p + '/cityId'); return out; });
  const symbols = new Set<string>();
  const bindings: Binding[] = list(r.bindings, '/bindings', 3).map((v, i) => { const p = `/bindings/${i}`, b = object(v, ['symbol', 'entityKind', 'entityId'], [], p); const symbol = choice(b.symbol, ['search-city', 'searching-person', 'yu-ji'] as const, p + '/symbol'); if (symbols.has(symbol)) fail('duplicate-binding-symbol', p + '/symbol'); symbols.add(symbol); return { symbol, entityKind: choice(b.entityKind, ['city', 'person'] as const, p + '/entityKind'), entityId: id(b.entityId, p + '/entityId') }; });
  const ref = object(r.observationRef, ['family', 'sourcePath', 'gitBlobSha', 'sha256', 'observationId'], [], '/observationRef');
  const target = object(r.targetVersion, ['edition', 'platform', 'patch'], [], '/targetVersion');
  return { schemaVersion: 1, queryProfile: PROFILE,
    observationRef: { family: choice(ref.family, ['generic-events', 'scenario-events', 'ps2-scenario-events'] as const, '/observationRef/family'), sourcePath: text(ref.sourcePath, '/observationRef/sourcePath'), gitBlobSha: hash(ref.gitBlobSha, 40, '/observationRef/gitBlobSha'), sha256: hash(ref.sha256, 64, '/observationRef/sha256'), observationId: id(ref.observationId, '/observationRef/observationId') },
    targetVersion: { edition: target.edition === null ? null : choice(target.edition, ['PK', 'Vanilla'] as const, '/targetVersion/edition'), platform: target.platform === null ? null : choice(target.platform, ['PC', 'PS2', 'Wii'] as const, '/targetVersion/platform'), patch: target.patch === null ? null : text(target.patch, '/targetVersion/patch', 64) }, facts: { cities, persons }, bindings };
}
function reason(code: string, detail: string, sourceJSONPointer: string | null = null, factJSONPointer: string | null = null): Reason { return { code, detail, sourceJSONPointer, factJSONPointer }; }
function sourceRef(source: Source, observation: Raw): Ref { return { family: source.family, sourcePath: source.path, gitBlobSha: source.gitBlobSha, sha256: source.sha256, observationId: String(observation.observationId) }; }
function rawText(v: Json | undefined): string | null { return typeof v === 'string' ? v : null; }
function rawRecord(v: Json | undefined): Raw | null { return v !== null && typeof v === 'object' && !Array.isArray(v) ? v : null; }
function evidence(source: Source, corpus: Corpus, observation: Raw, pointer: string, node: Json): Evidence {
  const n = rawRecord(node);
  return { sourceRef: sourceRef(source, observation), commit: source.commit, tree: source.tree, datasetId: source.datasetId, evidence: source.evidence, sourceURL: rawText(observation.sourceURL) ?? corpus.sourceURL ?? null, sourceJSONPointer: pointer,
    sourceLocator: n?.sourceLocator ?? (typeof n?.sourceLine === 'number' ? { sourceLine: n.sourceLine } : null), snapshotSha256: rawText(observation.snapshotSha256) ?? corpus.snapshotSha256 ?? null };
}
function version(source: Json, target: TargetVersion): Output['versionResolution'] {
  const s = rawRecord(source), reasons: Reason[] = []; let conflict = false;
  for (const key of ['edition', 'platform', 'patch'] as const) {
    const claimed = s?.[key], requested = target[key];
    if (claimed === undefined || claimed === null || claimed === 'unspecified' || requested === null) reasons.push(reason('version-unknown', `Source or target ${key} is unspecified; no cross-version fallback.`, null, `/targetVersion/${key}`));
    else if (claimed !== requested) { conflict = true; reasons.push(reason('version-conflict', `Source and target ${key} differ.`, null, `/targetVersion/${key}`)); }
  }
  return { status: conflict ? 'conflict' : reasons.length ? 'unknown' : 'matched', source: clone(source), target: clone(target), reasons };
}
/** Strict same-type primitive comparison. No coercion, date inference or rank ordering. */
function compare(actual: Literal, op: Operator, literals: Literal[]): Truth {
  if (literals.length === 0 || literals.some(v => v.type !== actual.type)) return 'unknown';
  if (op === 'in' || op === 'not-in') { const contains = literals.some(v => v.value === actual.value); return (op === 'in' ? contains : !contains) ? 'met' : 'not-met'; }
  if (literals.length !== 1) return 'unknown'; const expected = literals[0]!;
  if (op === 'eq' || op === 'ne') return ((actual.value === expected.value) === (op === 'eq')) ? 'met' : 'not-met';
  if (actual.type !== 'integer' || expected.type !== 'integer') return 'unknown';
  switch (op) { case 'lt': return actual.value < expected.value ? 'met' : 'not-met'; case 'lte': return actual.value <= expected.value ? 'met' : 'not-met'; case 'gt': return actual.value > expected.value ? 'met' : 'not-met'; case 'gte': return actual.value >= expected.value ? 'met' : 'not-met'; default: return 'unknown'; }
}
/** Used only for the reviewed registry's explicit group, never inferred from source indentation. */
function group(kind: 'all' | 'any', children: Truth[]): Truth {
  if (!children.length) return 'unknown';
  if (kind === 'all') return children.includes('not-met') ? 'not-met' : children.every(t => t === 'met') ? 'met' : 'unknown';
  return children.includes('met') ? 'met' : children.every(t => t === 'not-met') ? 'not-met' : 'unknown';
}
type Context = { reasons: Reason[]; factPaths: string[]; bindingPaths: string[]; cityIndex: number | null };
function bindingContext(input: Input, predicate: Predicate): Context {
  const result: Context = { reasons: [], factPaths: [], bindingPaths: [], cityIndex: null };
  for (const symbol of predicate.requiredBindings) {
    const bi = input.bindings.findIndex(b => b.symbol === symbol), b = input.bindings[bi];
    if (!b) { result.reasons.push(reason('unbound-source-symbol', `Bind the exact source symbol ${symbol}; names are never inferred.`, predicate.sourceJSONPointer, '/bindings')); continue; }
    const path = `/bindings/${bi}`; result.bindingPaths.push(path);
    const expectedKind = symbol === 'search-city' ? 'city' : 'person';
    if (b.entityKind !== expectedKind) { result.reasons.push(reason('binding-type-mismatch', `${symbol} must bind a ${expectedKind}.`, predicate.sourceJSONPointer, path)); continue; }
    const index = expectedKind === 'city' ? input.facts.cities.findIndex(c => c.id === b.entityId) : input.facts.persons.findIndex(p => p.id === b.entityId);
    if (index < 0) { result.reasons.push(reason('bound-entity-missing', `No typed ${expectedKind} fact exists for ${b.entityId}.`, predicate.sourceJSONPointer, path)); continue; }
    result.factPaths.push(`/facts/${expectedKind === 'city' ? 'cities' : 'persons'}/${index}/id`);
    if (symbol === 'search-city') result.cityIndex = index;
  }
  // These are coherent query bindings, not a finding that an exploration took place.
  if (result.cityIndex !== null) {
    const city = input.facts.cities[result.cityIndex]!;
    for (const symbol of predicate.requiredBindings.filter(s => s !== 'search-city')) {
      const b = input.bindings.find(v => v.symbol === symbol && v.entityKind === 'person');
      if (!b) continue;
      const pi = input.facts.persons.findIndex(p => p.id === b.entityId), person = input.facts.persons[pi];
      if (!person) continue;
      const path = `/facts/persons/${pi}/cityId`; result.factPaths.push(path);
      if (person.cityId === undefined) result.reasons.push(reason('binding-city-fact-missing', `${symbol}'s city is not supplied.`, predicate.sourceJSONPointer, path));
      else if (person.cityId !== city.id) result.reasons.push(reason('binding-city-inconsistent', `${symbol} is not bound to the supplied search city; no reassignment is inferred.`, predicate.sourceJSONPointer, path));
    }
  }
  const actor = input.bindings.find(b => b.symbol === 'searching-person'), visitor = input.bindings.find(b => b.symbol === 'yu-ji');
  if (predicate.requiredBindings.includes('yu-ji') && actor && visitor && actor.entityId === visitor.entityId) result.reasons.push(reason('binding-role-collision', 'The searching person and Yu Ji must be distinct explicit query roles.', predicate.sourceJSONPointer, '/bindings'));
  return result;
}
function evaluate(expression: Expression, input: Input, predicate: Predicate, context: Context): Comparison {
  const base: Comparison = { predicateId: expression.id, kind: expression.kind, comparisonStatus: 'unknown', semanticScope: expression.semanticScope, factJSONPointers: [...context.factPaths], bindingJSONPointers: [...context.bindingPaths], actual: null, operator: null, literals: [], reasons: clone(context.reasons), children: [] };
  if (expression.kind !== 'atom') {
    base.children = expression.children.map(child => evaluate(child, input, predicate, context));
    base.factJSONPointers = [...new Set(base.children.flatMap(c => c.factJSONPointers))];
    base.comparisonStatus = group(expression.kind, base.children.map(c => c.comparisonStatus));
    base.reasons = [...base.reasons, ...base.children.flatMap(c => c.reasons)];
    if (!expression.children.length) base.reasons.push(reason('empty-group', 'An empty condition group is unknown.', predicate.sourceJSONPointer));
    return base;
  }
  base.operator = expression.operator; base.literals = clone(expression.literals);
  if (context.reasons.length || context.cityIndex === null) return base;
  const city = input.facts.cities[context.cityIndex]!, path = `/facts/cities/${context.cityIndex}/${expression.field.replace('.', '/')}`;
  base.factJSONPointers.push(path);
  const value = expression.field === 'security' ? city.security : expression.field === 'gold' ? city.gold : expression.field === 'current.plague' ? city.current?.plague : city.current?.locust;
  if (value === undefined) { base.reasons.push(reason('fact-missing', 'Missing primitive fact is unknown, never false or zero.', predicate.sourceJSONPointer, path)); return base; }
  if (expression.valueType === 'integer' && typeof value === 'number') base.actual = { type: 'integer', value };
  else if (expression.valueType === 'boolean' && typeof value === 'boolean') base.actual = { type: 'boolean', value };
  else { base.reasons.push(reason('fact-type-mismatch', 'The field type differs from the fixed predicate type.', predicate.sourceJSONPointer, path)); return base; }
  base.comparisonStatus = compare(base.actual, expression.operator, expression.literals);
  if (base.comparisonStatus === 'unknown') base.reasons.push(reason('operator-or-type-unsupported', 'Only fixed, same-type primitive operators are supported.', predicate.sourceJSONPointer, path));
  return base;
}
/** Source-node shapes describe transcription structure only, never executable semantics. */
function nodeShape(node: Json): NodeShape {
  if (typeof node === 'string') return 'source-note';
  const r = rawRecord(node); if (!r) return 'unrecognized-source-node';
  const keys = Object.keys(r);
  const exact = (required: string[], optional: string[] = []): boolean => required.every(k => Object.hasOwn(r, k)) && keys.every(k => required.includes(k) || optional.includes(k));
  switch (r.kind) {
    case 'fact': return exact(['kind', 'category', 'subject', 'field', 'operator', 'value', 'certainty']) ? 'historical-fact' : 'unrecognized-source-node';
    case 'all': return exact(['kind', 'items']) ? 'historical-all' : 'unrecognized-source-node';
    case 'any': return exact(['kind', 'items']) ? 'historical-any' : 'unrecognized-source-node';
    case 'if': return exact(['kind', 'condition', 'consequence']) ? 'historical-if' : 'unrecognized-source-node';
    case 'effect': return exact(['kind', 'operation', 'target', 'values']) ? 'historical-effect' : 'unrecognized-source-node';
    case 'branch': return exact(['kind', 'branchId', 'condition', 'orderedResults']) ? 'historical-branch' : 'unrecognized-source-node';
    case 'choice': return exact(['kind', 'choiceId', 'controller', 'aiDefault', 'options']) ? 'historical-choice' : 'unrecognized-source-node';
  }
  if (exact(['optionId', 'orderedResults'])) return 'historical-option';
  if (exact(['scope', 'text', 'certainty', 'sourceLocator', 'quantities'])) return 'generic-claim';
  if (exact(['sourceLine', 'depth', 'parentLine', 'role', 'text', 'certainty', 'sourceLineSha256'])) return 'ps2-clause';
  if (exact(['eventId', 'requirement', 'delay'])) return 'historical-prerequisite';
  if (exact(['label', 'sourceLine', 'status', 'url'])) return 'ps2-reference';
  if (exact(['possibleGroupings']) || exact(['baselineConditions', 'accelerationEvent', 'affectedBaselinePredicates', 'replacementConditions'], ['accelerationWhen'])) return 'unresolved-date-wrapper';
  return 'unrecognized-source-node';
}
function visitClauses(observation: Raw, root: string, add: (node: Json, pointer: string, role: string, shape: NodeShape) => void): void {
  function nested(node: Json, pointer: string, role: string): void {
    const shape = nodeShape(node); add(node, pointer, role, shape);
    const r = rawRecord(node);
    if (!r) { if (Array.isArray(node)) node.forEach((child, i) => nested(child, `${pointer}/${i}`, 'unresolved-source-structure')); return; }
    function child(key: string, childRole: string): void {
      const value = r![key]; if (value === undefined) return;
      const childPointer = `${pointer}/${escapePointer(key)}`;
      if (Array.isArray(value)) value.forEach((item, i) => nested(item, `${childPointer}/${i}`, childRole));
      else nested(value, childPointer, childRole);
    }
    switch (shape) {
      case 'historical-all': case 'historical-any': child('items', 'conditions'); return;
      case 'historical-if': child('condition', 'conditions'); child('consequence', 'conditions'); return;
      case 'historical-branch': child('condition', 'conditions'); child('orderedResults', 'orderedResults'); return;
      case 'historical-choice': child('options', 'options'); return;
      case 'historical-option': child('orderedResults', 'orderedResults'); return;
      case 'historical-fact': {
        const value = rawRecord(r.value);
        // Structured value payloads are not automatically predicates. These two
        // transcribed date wrappers explicitly contain nested predicate objects.
        if (value && (Object.hasOwn(value, 'baselineConditions') || Object.hasOwn(value, 'possibleGroupings'))) child('value', 'unresolved-source-structure');
        return;
      }
      case 'unresolved-date-wrapper': child('baselineConditions', 'conditions'); child('possibleGroupings', 'conditions'); return;
      case 'unrecognized-source-node':
        // Unknown object shapes stay unknown, but cannot hide nested source data.
        // Merely browsing a child does not grant it grouping or result semantics.
        for (const [key, value] of Object.entries(r)) if (value !== null && typeof value === 'object') child(key, 'unresolved-source-structure');
        return;
      default:
        // generic quantities, source locators, prerequisite delays and effect.values
        // remain complete literal payloads on their parent, not new logical clauses.
        return;
    }
  }
  for (const key of ['conditions', 'prerequisites', 'results', 'orderedResults', 'annotations', 'clauses', 'references', 'uncertainties']) {
    const values = observation[key];
    if (Array.isArray(values)) values.forEach((node, i) => nested(node, `${root}/${key}/${i}`, key === 'clauses' ? rawText(rawRecord(node)?.role) ?? key : key));
  }
}
function query(input: Input): Output {
  const ref = input.observationRef, source = REGISTRY.sources.find(s => s.family === ref.family && s.path === ref.sourcePath);
  const out: Output = { ok: true, schemaVersion: 1, queryProfile: PROFILE, observationRef: clone(ref), resolution: 'unknown', documentedConditionsStatus: 'unknown', conditionCompleteness: 'not-resolved', resultCompleteness: 'not-resolved', versionResolution: version(null, input.targetVersion), onceOnly: { status: 'not-stated', flagId: null }, boundary: clone(BOUNDARY), evidence: null, originalObservation: null, clauses: [], reasons: [] };
  if (!source || source.gitBlobSha !== ref.gitBlobSha || source.sha256 !== ref.sha256) { out.reasons.push(reason('source-identity-unresolved', 'The family, source path and both source-file hashes must match one fixed source.', null, '/observationRef')); return out; }
  const corpus = CORPORA[source.path], records = corpus?.[source.collection];
  if (!corpus || corpus.executionEnabled !== false || corpus.datasetId !== source.datasetId || !records) { out.reasons.push(reason('installed-source-unavailable', 'The trusted installed source does not satisfy the fixed catalog identity contract.')); return out; }
  const index = records.findIndex(r => r.observationId === ref.observationId), observation = records[index];
  if (!observation) { out.reasons.push(reason('observation-not-found', 'No exact observation ID exists in the selected source; event IDs and names are not aliases.', null, '/observationRef/observationId')); return out; }
  const root = `/${source.collection}/${index}`;
  out.resolution = 'resolved'; out.originalObservation = clone(observation); out.evidence = evidence(source, corpus, observation, root, observation);
  out.conditionCompleteness = rawText(observation.conditionCompleteness) ?? 'partial-source-description'; out.resultCompleteness = rawText(observation.resultCompleteness) ?? 'partial-source-description';
  out.onceOnly = clone(observation.onceOnly ?? { status: 'not-stated', flagId: null });
  out.versionResolution = version(observation.versionScope ?? observation.version ?? corpus.versionScope ?? null, input.targetVersion);
  const registered = REGISTRY.predicates.filter(p => p.sourcePath === source.path && p.sourceGitBlobSha === source.gitBlobSha && p.observationId === ref.observationId);
  visitClauses(observation, root, (node, pointer, role, shape) => {
    const predicate = registered.find(p => p.sourceJSONPointer === pointer);
    const clause: Clause = { nodeShape: shape, evidence: evidence(source, corpus, observation, pointer, node), originalClause: clone(node), originalText: rawText(rawRecord(node)?.text), role, status: 'unknown', comparison: null, reasons: [] };
    if (!predicate) {
      const raw = rawRecord(node);
      const code = shape === 'unrecognized-source-node' ? 'source-node-shape-unrecognized'
        : shape === 'unresolved-date-wrapper' ? 'date-description-unresolved'
        : role === 'results' || role === 'orderedResults' || role === 'result' || role === 'options' ? 'effects-never-executed'
        : raw?.certainty === 'source-ambiguous' || raw?.certainty === 'unverified' ? 'source-certainty-unresolved'
        : raw?.kind === 'if' ? 'conditional-context-unresolved'
        : raw?.kind === 'all' || raw?.kind === 'any' ? 'source-grouping-not-certified' : 'clause-not-in-reviewed-registry';
      clause.reasons.push(reason(code, 'The original source clause is retained without inferred executable meaning.', pointer));
    }
    else if (canonical(node) !== canonical(predicate.sourceClause)) clause.reasons.push(reason('registered-clause-content-mismatch', 'The installed clause differs from the complete fixed registry clause; do not reuse the predicate.', pointer));
    else {
      clause.comparison = evaluate(predicate.expression, input, predicate, bindingContext(input, predicate));
      clause.reasons.push(...clause.comparison.reasons);
      for (const code of predicate.uncoveredReasons) clause.reasons.push(reason(code, 'Only the explicitly reviewed fragment is compared; the full original clause remains unresolved.', pointer));
      if (out.versionResolution.status !== 'matched') clause.reasons.push(reason('version-not-resolved', 'Comparison is only against source wording; runtime version applicability remains unknown.', pointer));
      // Comparison truth never bypasses unknown version, context, or partial coverage.
      if (predicate.clauseCoverage === 'complete' && out.versionResolution.status === 'matched') clause.status = clause.comparison.comparisonStatus;
    }
    out.clauses.push(clause);
  });
  out.reasons.push(reason('observation-grouping-unresolved', 'No whole-observation all/any relation is certified by this registry; local clause comparisons are not combined into event eligibility.', root));
  out.reasons.push(...out.versionResolution.reasons, reason('unknown-repeatability', 'The source does not state a once-only flag or repeatable behavior.', root + '/onceOnly'));
  const conditions = observation.conditions, ps2Conditions = Array.isArray(observation.clauses) ? observation.clauses.filter(c => rawRecord(c)?.role === 'condition') : [];
  if (observation.coverageKind === 'heading-only' || (!Array.isArray(conditions) || conditions.length === 0) && ps2Conditions.length === 0) out.reasons.push(reason('empty-or-heading-only-conditions', 'Absent documented conditions cannot be treated as an empty true conjunction.', root));
  return out;
}
freeze(REGISTRY);
freeze(CORPORA);
/** Complete registry and pinned source catalog. Caller-defined predicates are not accepted. */
export function getSourceEventQueryProfileV1(): SourceEventQueryProfileResultV1 {
  return respond<ProfileResult>(() => ({ ok: true, profile: clone(REGISTRY) }));
}
/** Independent observations, not merged event/native IDs. No optional filtering DSL. */
export function listSourceEventObservationsV1(): SourceEventObservationListResultV1 {
  return respond<ListResult>(() => {
  const summaries: Summary[] = [];
  for (const source of REGISTRY.sources) {
    const corpus = CORPORA[source.path]; if (!corpus) continue;
    const records = corpus[source.collection] ?? [];
    records.forEach((observation, index) => summaries.push({ observationRef: sourceRef(source, observation), title: rawText(observation.sourceSection) ?? rawText(observation.title) ?? String(observation.observationId), sourceURL: rawText(observation.sourceURL) ?? corpus.sourceURL ?? null, sourceJSONPointer: `/${source.collection}/${index}`, coverageKind: rawText(observation.coverageKind) ?? 'descriptive-source-record', registeredPredicateIds: REGISTRY.predicates.filter(p => p.sourcePath === source.path && p.observationId === observation.observationId).map(p => p.id), executionEnabled: false }));
  }
  return { ok: true, observations: summaries };
  });
}
/** Closed non-Proxy DTO input, immutable result; no I/O, RNG, mutations or action history. */
export function querySourceEventV1(value: unknown): SourceEventQueryResultV1 {
  return respond<Result>(() => query(parseInput(value)));
}
