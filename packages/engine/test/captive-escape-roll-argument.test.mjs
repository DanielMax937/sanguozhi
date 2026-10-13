import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { CAPTIVE_ESCAPE_ROLL_ARGUMENT as source, calculateCaptiveEscapeRollArgument as calculate,
  createSession, syntheticScenario, canonical, dispatch, saveGame, loadGame, replaySession } from '../src/index.ts';
import { calculateCaptiveEscapeRollArgument as direct } from '../src/captive-escape-roll-argument.ts';

const PROFILE = 'captive-escape-roll-argument-u8-v1';
const input = (savedBlU8 = 80, currentAlU8 = 100, lateCaptiveMonthsU8 = 7) =>
  ({profile: PROFILE, savedBlU8, currentAlU8, lateCaptiveMonthsU8});
const numericKeys = ['savedBlU8', 'currentAlU8', 'lateCaptiveMonthsU8', 'selectedMaximumByte',
  'effectiveStat', 'effectiveMonthFactor', 'numerator', 'rollArgument'];
const frozen = value => {
  if (value !== null && typeof value === 'object') {
    assert.ok(Object.isFrozen(value));
    for (const child of Object.values(value)) frozen(child);
  }
};

// Independent exact-integer oracle: conditional unsigned comparisons and BigInt
// multiplication/division, without production helpers, Math.max/floor or metadata.
// This is a scalar-domain oracle, not a claim that every tuple is game-reachable.
function expected(bl, al, months) {
  const b = BigInt(bl), a = BigInt(al), m = BigInt(months);
  const selected = b >= a ? b : a;
  const stat = selected >= 30n ? selected : 30n;
  const factor = m >= 4n ? m - 2n : 1n;
  const numerator = factor * factor * stat;
  const quotient = numerator / 150n;
  return {savedBlU8: Number(b), currentAlU8: Number(a), lateCaptiveMonthsU8: Number(m),
    selectedMaximumByte: Number(selected), effectiveStat: Number(stat),
    effectiveMonthFactor: Number(factor), numerator: Number(numerator),
    rollArgument: Number(quotient >= 1n ? quotient : 1n)};
}
function compare(fn, bl, al, months) {
  const got = fn(input(bl, al, months)), want = expected(bl, al, months);
  assert.equal(got.supported, true);
  assert.equal(got.profile, PROFILE);
  for (const key of numericKeys) {
    assert.equal(got[key], want[key], `${bl},${al},${months}:${key}`);
    assert.equal(Object.is(got[key], -0), false, `${key} must be canonical +0`);
    assert.equal(Number.isSafeInteger(got[key]), true, key);
  }
  assert.deepEqual(Object.keys(got).sort(), [...numericKeys, 'supported', 'profile', 'evidence'].sort());
  return got;
}

const anchors = [
  [0, 0, 0, 1], [0, 0, 1, 1], [0, 0, 2, 1], [0, 0, 3, 1], [-0, -0, -0, 1],
  [0, 0, 4, 1], [0, 0, 5, 1], [0, 0, 6, 3], [0, 0, 25, 105],
  [29, 29, 7, 5], [30, 0, 7, 5], [0, 31, 7, 5],
  [80, 100, 7, 16], [100, 80, 7, 16], [100, 100, 7, 16],
  [127, 0, 4, 3], [128, 0, 4, 3], [0, 128, 4, 3], [127, 128, 4, 3],
  [255, 0, 4, 6], [0, 255, 4, 6], [255, 255, 4, 6],
  [255, 0, 0, 1], [0, 255, 1, 1], [255, 255, 2, 1], [255, 255, 3, 1],
  [255, 255, 128, 26989], [255, 255, 255, 108815],
  [37, 0, 4, 1], [38, 0, 4, 1], [149, 0, 4, 3], [150, 0, 4, 4], [151, 0, 4, 4],
];
const fieldReasons = [
  ['savedBlU8', 'invalid-saved-bl-u8'], ['currentAlU8', 'invalid-current-al-u8'],
  ['lateCaptiveMonthsU8', 'invalid-late-captive-months-u8'],
];
const extras = ['earlyCaptiveMonthsU8', 'gateMonth', 'earlyMonthGate', 'eligible', 'war', 'intelligence',
  'officer', 'facility', 'state', 'rng', 'rngReturn', 'random', 'escapeProbability', 'escaped',
  'release', 'helper', 'nativePointer', 'before', 'after'];
function reject(fn, request, reason) {
  const receipt = fn(request);
  assert.equal(receipt.supported, false);
  assert.equal(receipt.reason, reason);
  assert.deepEqual(Object.keys(receipt).sort(), ['evidence', 'reason', 'supported']);
  assert.deepEqual(receipt.evidence, source.evidence);
  frozen(receipt);
}
function controls(fn) {
  for (const [bl, al, months, argument] of anchors) {
    const receipt = compare(fn, bl, al, months);
    assert.equal(receipt.rollArgument, argument);
    frozen(receipt);
  }
  for (const [field, reason] of fieldReasons) {
    for (const value of [-1, 256, 1.5, NaN, Infinity, '0', true])
      reject(fn, {...input(), [field]: value}, reason);
  }
  for (const field of extras) reject(fn, {...input(), [field]: 1}, 'unexpected-field');
  reject(fn, {...input(), profile: 'stock'}, 'unsupported-profile');
  reject(fn, Object.assign(Object.create({}), input()), 'invalid-input');
  for (const field of Object.keys(input())) {
    const accessor = input();
    Object.defineProperty(accessor, field, {get() { throw Error('getter must not run'); }});
    reject(fn, accessor, 'invalid-input');
  }
}

test('captive escape argument exports frozen source-listing evidence and a closed receipt', () => {
  assert.strictEqual(calculate, direct);
  assert.equal(source.profileId, PROFILE);
  assert.equal(source.evidence.level, 'source-listing-reconstruction');
  assert.equal(source.source.gitBlobSha1, '966493977fe3c19250fecc32d3d4f5bc23361d86');
  assert.equal(source.source.commit, '66e167e40c3440929ec016f3872aefc3486434c1');
  assert.equal(source.fullCaller.instructionCount, 266);
  assert.equal(source.fullCaller.byteLength, 902);
  assert.equal(source.fullCaller.implemented, false);
  assert.equal(source.leaf.start, '00582CE4');
  assert.equal(source.leaf.endExclusive, '00582D31');
  assert.equal(source.leaf.instructionCount, 26);
  assert.equal(source.leaf.byteLength, 77);
  assert.equal(source.leaf.sha256, '11335bc56749367435b1d5f70629b93b5c2139c063533c516833ca50e2defc83');
  assert.equal(source.leaf.containsCalls, false);
  assert.equal(source.leaf.rollHelperExecuted, false);
  for (const field of ['stockOriginalVerified', 'originalExecutableExecuted', 'nativeHelpersReconstructed',
    'abiVerified', 'realTraceReachabilityVerified', 'earlyMonthGateIntegrated', 'attributeGettersRecovered',
    'rngRecovered', 'escapeReleaseRecovered', 'monthlySchedulerIntegrated', 'commandIntegrated', 'modBehaviorIncluded'])
    assert.equal(source.evidence[field], false, field);
  frozen(source);
  assert.strictEqual(calculate(input()).evidence, source.evidence);
  assert.strictEqual(calculate({...input(), savedBlU8: -1}).evidence, source.evidence);
  controls(calculate);
});

test('captive escape unsigned high bytes, signed month subtraction and unclipped argument anchors', () => {
  for (const [bl, al, months, argument] of anchors)
    assert.equal(compare(calculate, bl, al, months).rollArgument, argument);
  const high = calculate(input(255, 255, 255));
  assert.equal(high.selectedMaximumByte, 255);
  assert.equal(high.effectiveStat, 255);
  assert.equal(high.effectiveMonthFactor, 253);
  assert.equal(high.numerator, 16322295);
  assert.equal(high.rollArgument, 108815);
  assert.ok(high.numerator < 2147483648);
  assert.equal(calculate(input(0, 0, 25)).rollArgument, 105);
});

test('all 65536 unsigned attribute pairs match the independent oracle at month 7', () => {
  let cases = 0;
  for (let bl = 0; bl <= 255; bl++) for (let al = 0; al <= 255; al++) {
    compare(calculate, bl, al, 7);
    cases++;
  }
  assert.equal(cases, 65536);
});

test('all 65536 maximum-byte and late-month pairs match exact BigInt arithmetic', () => {
  // Together with the preceding max-prefix sweep, exercises the factorized
  // contract. This is 131072 cases across two sweeps, not 256^3 executions.
  let cases = 0, largestNumerator = 0, largestArgument = 0;
  for (let maximum = 0; maximum <= 255; maximum++) for (let months = 0; months <= 255; months++) {
    const receipt = compare(calculate, maximum, 0, months);
    assert.ok(receipt.rollArgument >= 1 && receipt.rollArgument <= 108815);
    assert.ok(receipt.numerator >= 30 && receipt.numerator <= 16322295);
    largestNumerator = Math.max(largestNumerator, receipt.numerator);
    largestArgument = Math.max(largestArgument, receipt.rollArgument);
    cases++;
  }
  assert.equal(cases, 65536);
  assert.equal(largestNumerator, 16322295);
  assert.equal(largestArgument, 108815);
});

test('crossed threshold triples preserve both byte roles, operand symmetry and integer floor', () => {
  const bytes = [0, 1, 29, 30, 31, 99, 100, 101, 127, 128, 129, 149, 150, 151, 254, 255];
  const months = [0, 1, 2, 3, 4, 5, 7, 24, 25, 99, 100, 101, 127, 128, 129, 254, 255];
  let cases = 0;
  for (const bl of bytes) for (const al of bytes) for (const month of months) {
    const receipt = compare(calculate, bl, al, month);
    const swapped = calculate(input(al, bl, month));
    for (const key of ['selectedMaximumByte', 'effectiveStat', 'effectiveMonthFactor', 'numerator', 'rollArgument'])
      assert.equal(receipt[key], swapped[key], key);
    // Exact quotient inequalities expose rounding even when the lower clamp hides it.
    if (receipt.numerator >= 150) {
      assert.ok(receipt.rollArgument * 150 <= receipt.numerator);
      assert.ok((receipt.rollArgument + 1) * 150 > receipt.numerator);
    }
    cases++;
  }
  assert.equal(cases, 4352);
});

test('captive escape accepts exactly four own data fields and never executes getters or coercions', () => {
  for (const request of [null, undefined, false, 0, '', [], () => 1, new Date(), new Number(1),
    Object.create(input()), Object.assign(Object.create({}), input())])
    reject(calculate, request, 'invalid-input');
  for (const field of Object.keys(input())) {
    const missing = input(); delete missing[field]; reject(calculate, missing, 'invalid-input');
    const getter = input();
    Object.defineProperty(getter, field, {get() { throw Error('getter invoked'); }});
    reject(calculate, getter, 'invalid-input');
    const setter = input();
    Object.defineProperty(setter, field, {set() { throw Error('setter invoked'); }});
    reject(calculate, setter, 'invalid-input');
  }
  for (const field of [...extras, '__proto__', 'constructor', 'toString', 'valueOf'])
    reject(calculate, {...input(), [field]: 1}, 'unexpected-field');
  const extra = input();
  Object.defineProperty(extra, 'extra', {get() { throw Error('extra getter invoked'); }});
  reject(calculate, extra, 'unexpected-field');
  reject(calculate, {...input(), [Symbol('extra')]: 1}, 'unexpected-field');
  const coercible = {valueOf() { throw Error('valueOf invoked'); }, toString() { throw Error('toString invoked'); }};
  for (const [field, reason] of fieldReasons) {
    for (const value of [undefined, null, -1, 256, -0.5, 1.5, Number.MIN_VALUE, Number.MAX_SAFE_INTEGER,
      NaN, Infinity, -Infinity, '0', '255', true, false, {}, [], 1n, Symbol('bad'), new Number(2), coercible])
      reject(calculate, {...input(), [field]: value}, reason);
  }
  for (const profile of [undefined, null, '', 'stock', 0, PROFILE.toUpperCase(), 'treasure-roll-resolved-v1', coercible])
    reject(calculate, {...input(), profile}, 'unsupported-profile');
  assert.deepEqual(calculate(Object.assign(Object.create(null), input())), calculate(input()));
  const hidden = {};
  for (const [key, value] of Object.entries(input())) Object.defineProperty(hidden, key, {value});
  assert.deepEqual(calculate(hidden), calculate(input()));
  assert.deepEqual(calculate(Object.freeze(input(255, 255, 255))), calculate(input(255, 255, 255)));
});

test('late months 0 and 1 are valid arithmetic inputs without importing the earlier month gate', () => {
  for (const month of [0, 1, 2, 3]) {
    const receipt = calculate(input(255, 255, month));
    assert.equal(receipt.supported, true);
    assert.equal(receipt.lateCaptiveMonthsU8, month);
    assert.equal(receipt.effectiveMonthFactor, 1);
    assert.equal(receipt.numerator, 255);
    assert.equal(receipt.rollArgument, 1);
  }
  // The observed late read is independent of the earlier qualification read.
  // No previous gate value or helper callback is part of this public contract.
  for (const early of [0, 1, 2, 255])
    reject(calculate, {...input(255, 255, 255), earlyCaptiveMonthsU8: early}, 'unexpected-field');
  for (const field of ['gateMonth', 'eligible', 'rngReturn', 'escapeProbability', 'escaped'])
    reject(calculate, {...input(), [field]: 1}, 'unexpected-field');
  assert.deepEqual(Object.keys(calculate(input())).sort(), [...numericKeys, 'supported', 'profile', 'evidence'].sort());
});

test('captive escape argument is deterministic, immutable and consumes no Math.random', () => {
  const request = input(), before = JSON.stringify(request), receipt = calculate(request);
  assert.equal(JSON.stringify(request), before);
  assert.deepEqual(calculate(request), receipt);
  request.savedBlU8 = 255; request.currentAlU8 = 255; request.lateCaptiveMonthsU8 = 255;
  assert.equal(receipt.savedBlU8, 80);
  assert.equal(receipt.currentAlU8, 100);
  assert.equal(receipt.lateCaptiveMonthsU8, 7);
  assert.equal(receipt.rollArgument, 16);
  for (const key of numericKeys) assert.throws(() => { receipt[key] = 0; }, TypeError);
  assert.throws(() => { receipt.evidence.commandIntegrated = true; }, TypeError);
  assert.throws(() => { source.leaf.rollHelperExecuted = true; }, TypeError);
  const random = Math.random;
  Math.random = () => { throw Error('unexpected RNG use'); };
  try { controls(calculate); } finally { Math.random = random; }
});

test('argument calls leave state, dispatch, month-boundary EndTurn, saves and replay untouched', () => {
  const state = syntheticScenario(); state.date = {year: 200, month: 12, day: 21};
  state.officers[2].identity = 5; // Existing synthetic captive identity, not native status bits.
  let session = createSession(state);
  const before = canonical(session);
  const withoutArgumentCalls = dispatch(session, {type: 'EndTurn'});
  for (const [bl, al, months] of anchors) calculate(input(bl, al, months));
  assert.equal(canonical(session), before);
  for (const type of ['CaptiveEscapeRollArgument', 'CaptiveEscape', 'Escape', 'ReleaseCaptive']) {
    const result = dispatch(session, {type});
    assert.equal(result.result.ok, false);
    assert.strictEqual(result.session, session);
    assert.equal(result.result.rngDraws, 0);
  }
  const endTurn = dispatch(session, {type: 'EndTurn'});
  assert.deepEqual(endTurn, withoutArgumentCalls);
  assert.equal(endTurn.result.ok, true);
  assert.equal(endTurn.result.rngDraws, 0);
  assert.deepEqual(endTurn.session.state.rng, state.rng);
  assert.deepEqual(endTurn.session.state.date, {year: 201, month: 1, day: 1});
  assert.deepEqual(endTurn.session.state.officers, state.officers);
  assert.deepEqual(Object.keys(endTurn.result.calculation).sort(), ['ap', 'calendar', 'turn']);
  session = endTurn.session;
  assert.deepEqual(loadGame(saveGame(session)), session);
  assert.deepEqual(replaySession(session), session);
});

test('actual captive escape TypeScript mutants are killed by unchanged contract controls', async () => {
  const raw = fs.readFileSync(new URL('../src/captive-escape-roll-argument.ts', import.meta.url), 'utf8');
  const load = async value => {
    const firstLine = value.split('\n')[0];
    assert.equal(firstLine, "import source from '../../../docs/sources/captive-escape-roll-argument.json' with { type: 'json' };");
    const standalone = value.replace(firstLine, `const source = ${JSON.stringify(source)};`);
    const module = await import(`data:text/javascript;base64,${Buffer.from(stripTypeScriptTypes(standalone)).toString('base64')}`);
    assert.equal(typeof module.calculateCaptiveEscapeRollArgument, 'function');
    return module.calculateCaptiveEscapeRollArgument;
  };
  const changes = [
    ['Math.max(savedBlU8, currentAlU8)', 'Math.min(savedBlU8, currentAlU8)'],
    ['Math.max(savedBlU8, currentAlU8)', 'savedBlU8'],
    ['Math.max(savedBlU8, currentAlU8)', 'currentAlU8'],
    ['Math.max(savedBlU8, currentAlU8)', 'Math.max((savedBlU8 << 24) >> 24, (currentAlU8 << 24) >> 24)'],
    ['Math.max(savedBlU8, currentAlU8)', 'Math.max(savedBlU8 & 127, currentAlU8 & 127)'],
    ['Math.max(30, selectedMaximumByte)', 'Math.max(29, selectedMaximumByte)'],
    ['Math.max(30, selectedMaximumByte)', 'Math.max(31, selectedMaximumByte)'],
    ['Math.max(30, selectedMaximumByte)', 'selectedMaximumByte'],
    ['Math.max(30, selectedMaximumByte)', 'Math.min(100, Math.max(30, selectedMaximumByte))'],
    ['Math.max(30, selectedMaximumByte)', '100'],
    ['Math.max(1, lateCaptiveMonthsU8 - 2)', 'Math.max(0, lateCaptiveMonthsU8 - 2)'],
    ['Math.max(1, lateCaptiveMonthsU8 - 2)', 'Math.max(2, lateCaptiveMonthsU8 - 2)'],
    ['Math.max(1, lateCaptiveMonthsU8 - 2)', 'Math.max(1, lateCaptiveMonthsU8 - 1)'],
    ['Math.max(1, lateCaptiveMonthsU8 - 2)', 'Math.max(1, lateCaptiveMonthsU8 - 3)'],
    ['Math.max(1, lateCaptiveMonthsU8 - 2)', 'Math.max(1, Math.min(100, lateCaptiveMonthsU8) - 2)'],
    ['Math.max(1, lateCaptiveMonthsU8 - 2)', 'Math.max(1, ((lateCaptiveMonthsU8 << 24) >> 24) - 2)'],
    ['effectiveMonthFactor * effectiveMonthFactor * effectiveStat', 'effectiveMonthFactor * effectiveStat'],
    ['effectiveMonthFactor * effectiveMonthFactor * effectiveStat', 'effectiveMonthFactor ** 3 * effectiveStat'],
    ['effectiveMonthFactor * effectiveMonthFactor * effectiveStat', 'effectiveMonthFactor * effectiveMonthFactor * selectedMaximumByte'],
    ['Math.floor(numerator / 150)', 'Math.ceil(numerator / 150)'],
    ['Math.floor(numerator / 150)', 'Math.round(numerator / 150)'],
    ['Math.floor(numerator / 150)', 'Math.floor(numerator / 149)'],
    ['Math.floor(numerator / 150)', 'Math.floor(numerator / 151)'],
    ['Math.floor(numerator / 150)', 'Math.floor(numerator / 100)'],
    ['Math.max(1, Math.floor(numerator / 150))', 'Math.floor(numerator / 150)'],
    ['Math.max(1, Math.floor(numerator / 150))', 'Math.min(100, Math.max(1, Math.floor(numerator / 150)))'],
    ['Math.max(1, Math.floor(numerator / 150))', '1'],
    ['value <= 255', 'value <= 100'], ['value <= 255', 'value <= 256'],
    ['value >= 0', 'value >= -1'], ['Number.isSafeInteger(value)', 'Number.isFinite(value)'],
    ["typeof value === 'number'\n  && Number.isSafeInteger(value)", 'Number.isSafeInteger(Number(value))'],
    ["profile !== 'captive-escape-roll-argument-u8-v1'", 'false'],
    ["return reject('unexpected-field')", 'void 0'],
    ["!('value' in descriptors[key])", 'false'],
    ['prototype !== Object.prototype && prototype !== null', 'false'],
    ['bl === 0 ? 0 : bl', 'bl'], ['al === 0 ? 0 : al', 'al'], ['months === 0 ? 0 : months', 'months'],
    ["if (!u8(months))", 'if (!u8(months) || months < 2)'],
    ['Object.freeze({supported: false, reason, evidence})', '({supported: false, reason, evidence})'],
    ['return Object.freeze({supported: true', 'return ({supported: true'],
    ['Object.freeze(value);', 'void value;'],
  ];
  let killed = 0;
  for (const [from, to] of changes) {
    assert.equal(raw.split(from).length - 1, 1, `mutant location must be unique: ${from}`);
    controls(await load(raw)); // Successful unchanged controls precede every mutant.
    const mutant = await load(raw.replace(from, to)); // Parse/import errors never count as kills.
    assert.throws(() => controls(mutant), undefined, `${from} -> ${to}`);
    killed++;
  }
  assert.equal(killed, 43);
});
