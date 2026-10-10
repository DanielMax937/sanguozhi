import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { TREASURE_ROLL_ARGUMENT as source, calculateTreasureRollArgument as calculate,
  createSession, syntheticScenario, canonical, dispatch, saveGame, loadGame, replaySession } from '../src/index.ts';
import { calculateTreasureRollArgument as direct } from '../src/treasure-roll-argument.ts';

const PROFILE = 'treasure-roll-resolved-v1';
const input = (treasureValueU8 = 0) => ({profile: PROFILE, treasureValueU8});
const frozen = value => {
  if (value !== null && typeof value === 'object') {
    assert.ok(Object.isFrozen(value));
    for (const child of Object.values(value)) frozen(child);
  }
};
// Includes the signed intermediate quotient: a clamp would hide floor errors.
const anchors = [
  [0, 61, 3, 3, 'quotient'], [1, 60, 3, 3, 'quotient'],
  [2, 59, 2, 2, 'quotient'], [20, 41, 2, 2, 'quotient'],
  [21, 40, 2, 2, 'quotient'], [22, 39, 1, 1, 'quotient'],
  [40, 21, 1, 1, 'quotient'], [41, 20, 1, 1, 'quotient'],
  [42, 19, 0, 1, 'minimum-clamp'], [60, 1, 0, 1, 'minimum-clamp'],
  [61, 0, 0, 1, 'minimum-clamp'], [62, -1, 0, 1, 'minimum-clamp'],
  [80, -19, 0, 1, 'minimum-clamp'], [81, -20, -1, 1, 'minimum-clamp'],
  [82, -21, -1, 1, 'minimum-clamp'], [101, -40, -2, 1, 'minimum-clamp'],
  [255, -194, -9, 1, 'minimum-clamp'],
];
function controls(fn) {
  for (const [value, numerator, quotient, rollArgument, branch] of anchors) {
    const receipt = fn(input(value));
    assert.equal(receipt.supported, true);
    assert.equal(receipt.profile, PROFILE);
    assert.equal(receipt.treasureValueU8, value);
    assert.equal(receipt.numerator, numerator);
    assert.equal(receipt.quotient, quotient);
    assert.equal(receipt.rollArgument, rollArgument);
    assert.equal(receipt.branch, branch);
  }
  assert.equal(fn(input(-0)).treasureValueU8, 0);
  for (const value of [-1, 256, 1.5, NaN, Infinity, '1']) assert.equal(fn(input(value)).supported, false);
  assert.equal(fn({...input(), profile: 'stock'}).supported, false);
  assert.equal(fn({...input(), extra: 1}).supported, false);
  assert.equal(fn({...input(), extra: 1}).reason, 'unexpected-field');
}

test('treasure roll exports frozen listing-only evidence and metadata', () => {
  assert.strictEqual(calculate, direct);
  assert.equal(source.profileId, PROFILE);
  assert.equal(source.evidence.level, 'source-listing-reconstruction');
  for (const field of ['stockOriginalVerified', 'originalExecutableExecuted', 'nativeHelpersReconstructed',
    'callerIntegrated', 'finalProbabilityRecovered', 'rngIntegrated', 'candidateSelectionRecovered',
    'ownershipWriterRecovered', 'commandIntegrated']) assert.equal(source.evidence[field], false, field);
  frozen(source);
  frozen(calculate(input()));
  assert.strictEqual(calculate(input()).evidence, source.evidence);
  assert.deepEqual(Object.keys(calculate(input())).sort(), ['supported', 'profile', 'treasureValueU8',
    'numerator', 'quotient', 'rollArgument', 'branch', 'evidence'].sort());
});

test('treasure roll keeps signed truncation, minimum clamp and branch boundaries', () => {
  controls(calculate);
  for (let value = 62; value <= 80; value++) {
    assert.equal(calculate(input(value)).quotient, 0);
    assert.equal(Object.is(calculate(input(value)).quotient, -0), false);
  }
  assert.equal(calculate(input(82)).quotient, -1);
  assert.equal(calculate(input(255)).quotient, -9);
});

test('all 256 treasure bytes match independent BigInt signed arithmetic', () => {
  let cases = 0;
  const distribution = new Map();
  for (let value = 0; value <= 255; value++) {
    const receipt = calculate(input(value));
    // BigInt division defines truncation independently of floating-point Math.
    const numerator = 61n - BigInt(value);
    const quotient = numerator / 20n;
    const argument = quotient < 1n ? 1n : quotient;
    assert.equal(receipt.supported, true);
    assert.equal(receipt.treasureValueU8, value);
    assert.equal(receipt.numerator, Number(numerator));
    assert.equal(receipt.quotient, Number(quotient));
    assert.equal(receipt.rollArgument, Number(argument));
    assert.equal(receipt.branch, quotient < 1n ? 'minimum-clamp' : 'quotient');
    assert.equal(Object.is(receipt.quotient, -0), false);
    distribution.set(receipt.rollArgument, (distribution.get(receipt.rollArgument) ?? 0) + 1);
    cases++;
  }
  assert.equal(cases, 256);
  assert.deepEqual([...distribution], [[3, 2], [2, 20], [1, 234]]);
});

test('treasure roll accepts only complete own data fields and never invokes accessors', () => {
  const reject = (request, reason) => {
    const receipt = calculate(request);
    assert.equal(receipt.supported, false);
    assert.equal(receipt.reason, reason);
    assert.deepEqual(Object.keys(receipt).sort(), ['evidence', 'reason', 'supported']);
    assert.strictEqual(receipt.evidence, source.evidence);
    frozen(receipt);
  };
  for (const value of [null, undefined, false, 0, '', [], () => 1, new Date(), new Number(1),
    Object.create(input())]) reject(value, 'invalid-input');
  for (const field of Object.keys(input())) {
    const missing = input();
    delete missing[field];
    reject(missing, 'invalid-input');
    const getter = input();
    Object.defineProperty(getter, field, {get() { throw Error('must not execute getter'); }});
    reject(getter, 'invalid-input');
    const setter = input();
    Object.defineProperty(setter, field, {set() { throw Error('must not execute setter'); }});
    reject(setter, 'invalid-input');
  }
  for (const field of ['nativePointer', 'treasureId', 'candidateIndex', 'candidateCount', 'owner',
    'rng', 'probability', 'stock', 'extra']) reject({...input(), [field]: 1}, 'unexpected-field');
  reject({...input(), [Symbol('hidden')]: 1}, 'unexpected-field');
  const hidden = input();
  Object.defineProperty(hidden, 'extra', {value: 1});
  reject(hidden, 'unexpected-field');
  const extraGetter = input();
  Object.defineProperty(extraGetter, 'extra', {get() { throw Error('must not execute extra getter'); }});
  reject(extraGetter, 'unexpected-field');
  for (const value of [undefined, null, -1, 256, -0.5, 1.5, 255.5, Number.MIN_VALUE,
    Number.MAX_SAFE_INTEGER, NaN, Infinity, -Infinity, '0', true, {}, [], 1n, Symbol('value')])
    reject({...input(), treasureValueU8: value}, 'invalid-treasure-value-u8');
  for (const profile of [null, undefined, '', 'stock', 0, 'treasure-roll-resolved-v2',
    'search-talent-resolved-v1']) reject({...input(), profile}, 'unsupported-profile');
  assert.deepEqual(calculate(Object.assign(Object.create(null), input())), calculate(input()));
  const nonEnumerable = {};
  for (const [key, value] of Object.entries(input())) Object.defineProperty(nonEnumerable, key, {value});
  assert.deepEqual(calculate(nonEnumerable), calculate(input()));
  assert.deepEqual(calculate(input(-0)), calculate(input(0)));
  assert.deepEqual(calculate(Object.freeze(input(255))), calculate(input(255)));
});

test('treasure receipts are immutable deterministic snapshots without RNG or command integration', () => {
  const request = input(22), before = JSON.stringify(request), receipt = calculate(request);
  assert.equal(JSON.stringify(request), before);
  assert.deepEqual(receipt, calculate(request));
  request.treasureValueU8 = 255;
  assert.equal(receipt.treasureValueU8, 22);
  assert.throws(() => { receipt.rollArgument = 9; }, TypeError);
  assert.throws(() => { receipt.evidence.rngIntegrated = true; }, TypeError);
  const originalRandom = Math.random;
  Math.random = () => { throw Error('pure arithmetic must not draw RNG'); };
  try { controls(calculate); } finally { Math.random = originalRandom; }
  let session = createSession(syntheticScenario());
  const original = canonical(session);
  for (let value = 0; value <= 255; value++) calculate(input(value));
  assert.equal(canonical(session), original);
  for (const type of ['TreasureRollArgument', 'SearchTreasure', 'Explore', 'Search', 'FindTreasure']) {
    const result = dispatch(session, {type});
    assert.equal(result.result.ok, false);
    assert.strictEqual(result.session, session);
  }
  session = dispatch(session, {type: 'EndTurn'}).session;
  assert.deepEqual(loadGame(saveGame(session)), session);
  assert.deepEqual(replaySession(session), session);
});

test('actual treasure TypeScript mutations fail intermediate and boundary controls', async () => {
  const raw = fs.readFileSync(new URL('../src/treasure-roll-argument.ts', import.meta.url), 'utf8');
  const text = raw.replace(raw.split('\n')[0], `const source = ${JSON.stringify(source)};`);
  const load = text => import(`data:text/javascript;base64,${Buffer.from(stripTypeScriptTypes(text)).toString('base64')}`);
  controls((await load(text)).calculateTreasureRollArgument);
  const changes = [
    ['61 - treasureValueU8', '60 - treasureValueU8'],
    ['61 - treasureValueU8', '62 - treasureValueU8'],
    ['61 - treasureValueU8', 'treasureValueU8 - 61'],
    ['Math.trunc(numerator / 20)', 'Math.floor(numerator / 20)'],
    ['Math.trunc(numerator / 20)', 'Math.ceil(numerator / 20)'],
    ['Math.trunc(numerator / 20)', 'Math.trunc(numerator / 19)'],
    ['Math.trunc(numerator / 20)', 'Math.trunc(numerator / 21)'],
    ['truncated === 0 ? 0 : truncated', 'truncated'],
    ['Math.max(1, quotient)', 'Math.max(0, quotient)'],
    ['Math.max(1, quotient)', 'Math.max(2, quotient)'],
    ['Math.max(1, quotient)', 'Math.min(1, quotient)'],
    ["quotient < 1 ? 'minimum-clamp' : 'quotient'", "quotient <= 1 ? 'minimum-clamp' : 'quotient'"],
    ['value === 0 ? 0 : value', 'value'],
    ['value >= 0', 'value >= -1'],
    ['value <= 255', 'value <= 256'],
    ['Number.isSafeInteger(value)', 'Number.isFinite(value)'],
    ["profile !== 'treasure-roll-resolved-v1'", 'false'],
    ["return reject('unexpected-field')", 'void 0'],
  ];
  for (const [from, to] of changes) {
    assert.ok(text.includes(from), from);
    const mutant = (await load(text.replace(from, to))).calculateTreasureRollArgument;
    assert.throws(() => controls(mutant), undefined, `${from} -> ${to}`);
  }
});
