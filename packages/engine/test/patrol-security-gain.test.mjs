import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { stripTypeScriptTypes } from 'node:module';
import { PATROL_SECURITY_GAIN as profile, calculatePatrolSecurityGain as calculate,
  createSession, syntheticScenario, canonical, dispatch, saveGame, loadGame, replaySession } from '../src/index.ts';
import { calculatePatrolSecurityGain as directCalculate } from '../src/patrol-security-gain.ts';

const PROFILE = 'patrol-security-gain-stable-v1';
const input = (resolvedLeadershipSlots = [28], publicOrderByte = 0, pressureHelperEax = 0) =>
  ({profile: PROFILE, resolvedLeadershipSlots, publicOrderByte, pressureHelperEax});
const fields = ['sumLeadership', 'baseGain', 'afterPressure', 'returnedDelta', 'pressureApplied', 'capBranch'];

// Independent literal-register transcription of the original public instruction
// bytes, not imported profile constants or the engineering formula. Companion
// Python oracle additionally decodes the pinned source bytes and executes them.
function baseFromOriginal(sum) {
  const ebx = sum | 0;
  let eax = 0x92492493 | 0;
  let edx = Number(BigInt.asIntN(32, (BigInt(eax) * BigInt(ebx)) >> 32n));
  edx = (edx + ebx) | 0;                     // 005CBA8E
  edx >>= 4;                                 // C1 FA 04: EDX, NOT DL
  eax = edx;
  eax >>>= 31;
  return (edx + eax + 2) | 0;                // 005CBA9E LEA
}
function original(sum, order, helper) {
  const baseGain = baseFromOriginal(sum);
  let esi = baseGain;
  const pressureApplied = (helper >>> 0) !== 0; // full TEST EAX,EAX
  if (pressureApplied) {
    let eax = esi;
    const edx = eax >> 31;                    // CDQ
    eax = (eax - edx) | 0;
    eax >>= 1;
    esi = eax;
  }
  const afterPressure = esi;
  const eax = order & 0xff;                   // MOVZX city byte
  const ecx = (eax + esi) | 0;
  const capBranch = !(ecx <= 0x64);           // original JLE includes equality
  if (capBranch) esi = (0x64 - eax) | 0;
  return {sumLeadership: sum, baseGain, afterPressure, returnedDelta: esi, pressureApplied, capBranch};
}
function compare(actual, expected, description = '') {
  assert.equal(actual.supported, true, description);
  for (const key of fields) assert.equal(actual[key], expected[key], `${description}:${key}`);
}
function deepFrozen(value) {
  if (value !== null && typeof value === 'object') {
    assert.ok(Object.isFrozen(value));
    for (const child of Object.values(value)) deepFrozen(child);
  }
}
function evidenceContract(p) {
  assert.equal(p.profileId, PROFILE);
  assert.equal(p.level, 'source-listing-reconstruction');
  assert.equal(p.stockOriginalVerified, false);
  assert.equal(p.originalExecutableExecuted, false);
  assert.equal(p.source.commit, '66e167e40c3440929ec016f3872aefc3486434c1');
  assert.equal(p.source.gitBlobSha1, '71b6c28bdc4c3d0f591d0af5ee813c8fb9f4134a');
  assert.equal(p.source.originalBytes, 6637);
  assert.equal(p.originalListing.instructionCount, 79);
  assert.equal(p.originalListing.byteLength, 204);
  assert.equal(p.excludedMod.instructionCount, 7);
  assert.equal(p.excludedMod.executed, false);
}
const regressions = [
  [[0], 0, 0, 2], [[28], 0, 1, 1], [[84], 97, 1, 2], [[28], 97, 0, 3],
  [[0], 101, 0, -1], [[0], 255, 0, -155], [[255, 255, 255], 0, 0, 29],
  [[28], 0, 2, 1], [[28], 0, 0xffffffff, 1], [[28], 0, 0x100, 1],
  [[27], 0, 0, 2], [[56], 96, 0, 4], [[57], 98, 0, 2], [[255, null, 255], 0, 1, 10],
];
function verifyBehavior(fn) {
  for (const [slots, order, helper, delta] of regressions) {
    const sum = slots.reduce((s, v) => s + (v ?? 0), 0);
    const expected = original(sum, order, helper);
    assert.equal(expected.returnedDelta, delta);
    compare(fn(input(slots, order, helper)), expected);
  }
  assert.equal(fn(input([null, 100, 100])).supported, false, 'invalid first slot is not leadership zero');
}

test('patrol public export, provenance and deep-frozen evidence are explicit', () => {
  assert.strictEqual(calculate, directCalculate);
  evidenceContract(profile);
  deepFrozen(profile);
  assert.deepEqual(profile.constants, {leadershipDivisor: 28, baseOffset: 2, pressureDivisor: 2,
    publicOrderCap: 100, signedDivisionMagic: '0x92492493'});
  const result = calculate(input());
  assert.strictEqual(result.evidence, profile.evidence);
  deepFrozen(result);
});

test('patrol instruction counterexamples retain full EAX, operation order, signed delta and strict cap path', () => {
  verifyBehavior(calculate);
  assert.equal(calculate(input([28], 97)).capBranch, false);
  assert.equal(calculate(input([28], 98)).capBranch, true);
  assert.equal(calculate(input([84], 97, 1)).returnedDelta, 2);
  assert.equal(calculate(input([null, 100, 100])).reason, 'invalid-leadership-slots');
  assert.equal(calculate(input([0, null, null])).baseGain, 2);
  for (const helper of [1, 2, 0x7f, 0x80, 0xff, 0x100, 0x10000, 0x800000, 0x7fffffff, 0x80000000, 0xfffffffe, 0xffffffff]) {
    compare(calculate(input([28], 0, helper)), original(28, 0, helper));
  }
});

test('all 766 sums by 256 city bytes by zero/nonzero helper agree with literal signed instruction oracle', () => {
  let cases = 0, equality = 0, negative = 0, caps = 0;
  const digest = createHash('sha256');
  const bytes = Buffer.alloc(6);
  for (let sum = 0; sum <= 765; sum++) {
    const a = Math.min(sum, 255), b = Math.min(sum - a, 255), c = sum - a - b;
    for (let order = 0; order <= 255; order++) for (const helper of [0, 1]) {
      const expected = original(sum, order, helper);
      const result = calculate(input([a, b, c], order, helper));
      compare(result, expected, `sum=${sum},order=${order},helper=${helper}`);
      if (order + expected.afterPressure === 100) { equality++; assert.equal(result.capBranch, false); }
      if (result.returnedDelta < 0) negative++;
      if (result.capBranch) caps++;
      bytes.writeInt32LE(result.returnedDelta, 0); bytes[4] = Number(result.capBranch); bytes[5] = Number(result.pressureApplied); digest.update(bytes);
      cases++;
    }
  }
  assert.equal(cases, 392192);
  assert.equal(equality, 1532);
  assert.equal(negative, 237460);
  assert.ok(caps > negative);
  assert.equal(digest.digest('hex'), '4b723b88993d38804e72ef42f4ae9d78305b0426d56fa650637660f140baaa37');
});

test('all 16777216 uint8 leadership triples preserve MOVZX sums and no conventional 100 clamp', () => {
  const slots = [0, 0, 0], request = input(slots);
  const expected = Array.from({length: 766}, (_, sum) => baseFromOriginal(sum));
  let cases = 0;
  for (let a = 0; a < 256; a++) for (let b = 0; b < 256; b++) for (let c = 0; c < 256; c++) {
    slots[0] = a; slots[1] = b; slots[2] = c;
    const result = calculate(request), sum = a + b + c;
    if (!result.supported || result.sumLeadership !== sum || result.baseGain !== expected[sum]
        || result.afterPressure !== expected[sum] || result.returnedDelta !== expected[sum]
        || result.pressureApplied || result.capBranch) assert.fail(`triple ${a},${b},${c}`);
    cases++;
  }
  assert.equal(cases, 16777216);
});

test('all 131328 null-containing valid-first triples and missing tails preserve stable skipped slots', () => {
  let cases = 0;
  for (let first = 0; first < 256; first++) {
    for (let second = -1; second < 256; second++) for (let third = -1; third < 256; third++) {
      if (second >= 0 && third >= 0) continue;
      const slots = [first, second < 0 ? null : second, third < 0 ? null : third];
      compare(calculate(input(slots, 99, 1)), original(first + Math.max(0, second) + Math.max(0, third), 99, 1));
      cases++;
    }
    compare(calculate(input([first])), original(first, 0, 0));
    assert.deepEqual(calculate(input([first])).normalizedLeadershipSlots, [first, null, null]);
    for (let second = -1; second < 256; second++) {
      const result = calculate(input([first, second < 0 ? null : second]));
      compare(result, original(first + Math.max(0, second), 0, 0));
      assert.equal(result.normalizedLeadershipSlots[2], null);
    }
  }
  assert.equal(cases, 131328);
});

test('patrol raw-domain rejection does not coerce inputs or fabricate native early-return receipts', () => {
  const reject = (value, reason) => {
    const result = calculate(value);
    assert.equal(result.supported, false);
    assert.equal(result.reason, reason);
    assert.deepEqual(Object.keys(result).sort(), ['evidence', 'reason', 'supported']);
    assert.strictEqual(result.evidence, profile.evidence);
    deepFrozen(result);
  };
  for (const value of [null, undefined, false, 0, '', [], () => 1, new Date(), Object.create(input())]) reject(value, 'invalid-input');
  for (const profile of [undefined, null, 0, '', 'S1', 'PK1.1', 'Vanilla', 'PS2', 'patrol-security-gain-stable-v2']) reject({...input(), profile}, 'unsupported-profile');
  for (const field of ['officerId', 'baseLeadership', 'facilityPointer', 'enemyWithin2', 'enemyWithin3', 'underSiege', 'mod', 'actualWriterDelta', 'tp', 'extra']) reject({...input(), [field]: 1}, 'unexpected-field');
  reject({...input(), [Symbol('extra')]: 1}, 'unexpected-field');
  for (const slots of [undefined, null, 1, '28', {}, new Uint8Array([28]), [], [null], [null, 100, 100], [1, 2, 3, 4], Array(1), [, 1], [1, , 2]]) reject({...input(), resolvedLeadershipSlots: slots}, 'invalid-leadership-slots');
  const named = [1]; named.extra = 1; reject(input(named), 'invalid-leadership-slots');
  const symbol = [1]; symbol[Symbol('extra')] = 1; reject(input(symbol), 'invalid-leadership-slots');
  const accessor = [1]; Object.defineProperty(accessor, 0, {get() {throw Error('must not read accessor');}}); reject(input(accessor), 'invalid-leadership-slots');
  const accessorInput = input(); Object.defineProperty(accessorInput, 'publicOrderByte', {get() {throw Error('must not read accessor');}}); reject(accessorInput, 'invalid-input');
  for (const value of [undefined, -1, 256, 1.5, NaN, Infinity, -Infinity, '1', false, {}, [], 1n]) {
    for (let i = 0; i < 3; i++) {const slots = [0, 0, 0]; slots[i] = value; reject({...input(), resolvedLeadershipSlots: slots}, 'invalid-leadership-slots');}
  }
  for (const value of [undefined, null, -1, 256, 1.5, NaN, Infinity, -Infinity, '100', false, {}, [], 100n]) reject({...input(), publicOrderByte: value}, 'invalid-public-order-byte');
  for (const value of [undefined, null, -1, 0x100000000, 1.5, NaN, Infinity, -Infinity, '1', true, {}, [], 1n]) reject({...input(), pressureHelperEax: value}, 'invalid-pressure-helper-eax');
  for (const [field, reason] of [['profile', 'unsupported-profile'], ['resolvedLeadershipSlots', 'invalid-leadership-slots'], ['publicOrderByte', 'invalid-public-order-byte'], ['pressureHelperEax', 'invalid-pressure-helper-eax']]) {
    const value = input(); delete value[field]; reject(value, reason);
  }
});

test('patrol receipts clone and freeze slots, leave inputs intact and allow deterministic repeated calls', () => {
  const slots = [28, null, 0], request = input(slots, 98, 1);
  const first = calculate(request), second = calculate(request);
  assert.deepEqual(first, second); assert.notStrictEqual(first.normalizedLeadershipSlots, slots); deepFrozen(first);
  slots[0] = 255; assert.deepEqual(first.normalizedLeadershipSlots, [28, null, 0]);
  assert.throws(() => {first.normalizedLeadershipSlots[0] = 4;}, TypeError);
  assert.throws(() => {first.returnedDelta = 0;}, TypeError);
  const frozen = Object.freeze(input(Object.freeze([28, null, 0]))), before = JSON.stringify(frozen);
  compare(calculate(frozen), original(28, 0, 0)); assert.equal(JSON.stringify(frozen), before);
});

test('standalone patrol arithmetic changes no command, state, TP, Train/EndTurn or save/replay contract', () => {
  let session = createSession(syntheticScenario()); const before = canonical(session);
  calculate(input()); assert.equal(canonical(session), before);
  for (const type of ['Patrol', 'Inspect', 'PatrolSecurityGain', 'PatrolTechniqueReward']) {
    const rejected = dispatch(session, {type});
    assert.equal(rejected.result.ok, false); assert.strictEqual(rejected.session, session); assert.equal(canonical(session), before);
  }
  session = dispatch(session, {type: 'EndTurn'}).session;
  assert.deepEqual(loadGame(saveGame(session)), session); assert.deepEqual(replaySession(session), session);
});

test('actual patrol-production arithmetic and branch mutants fail independent controls; MOD isolation is structural', async () => {
  const raw = fs.readFileSync(new URL('../src/patrol-security-gain.ts', import.meta.url), 'utf8');
  const importLine = raw.split('\n')[0]; assert.match(importLine, /^import source from /);
  const source = raw.replace(importLine, `const source = ${JSON.stringify(profile)};`);
  const load = text => import(`data:text/javascript;base64,${Buffer.from(stripTypeScriptTypes(text)).toString('base64')}`);
  const mutations = [
    ['divisor 27', 'sumLeadership / limits.leadershipDivisor', 'sumLeadership / 27'],
    ['round sum division', 'Math.floor(sumLeadership / limits.leadershipDivisor)', 'Math.round(sumLeadership / limits.leadershipDivisor)'],
    ['offset 1', '+ limits.baseOffset', '+ 1'],
    ['helper equals 1 only', 'input.pressureHelperEax !== 0', 'input.pressureHelperEax === 1'],
    ['helper low byte only', 'input.pressureHelperEax !== 0', '(input.pressureHelperEax & 0xff) !== 0'],
    ['round pressure', 'Math.floor(baseGain / limits.pressureDivisor)', 'Math.round(baseGain / limits.pressureDivisor)'],
    ['halve leadership first', 'Math.floor(baseGain / limits.pressureDivisor)', 'Math.floor(Math.floor(sumLeadership / 2) / 28) + 2'],
    ['clip before pressure', 'Math.floor(baseGain / limits.pressureDivisor)', 'Math.floor(Math.min(baseGain, 100 - input.publicOrderByte) / 2)'],
    ['cap equality branch', 'input.publicOrderByte + afterPressure > limits.publicOrderCap', 'input.publicOrderByte + afterPressure >= limits.publicOrderCap'],
    ['lower clamp', 'limits.publicOrderCap - input.publicOrderByte : afterPressure', 'Math.max(0, limits.publicOrderCap - input.publicOrderByte) : afterPressure'],
    ['drop cap', 'const returnedDelta = capBranch ? limits.publicOrderCap - input.publicOrderByte : afterPressure;', 'const returnedDelta = afterPressure;'],
    ['conventional leadership clamp', 'sumLeadership += value;', 'sumLeadership += Math.min(value, 100);'],
  ];
  const control = await load(source); verifyBehavior(control.calculatePatrolSecurityGain);
  for (const [name, from, to] of mutations) {
    verifyBehavior(control.calculatePatrolSecurityGain); assert.equal(source.split(from).length, 2, `unique site: ${name}`);
    const mutant = await load(source.replace(from, to));
    assert.throws(() => verifyBehavior(mutant.calculatePatrolSecurityGain), {name: 'AssertionError'}, name);
  }
  // The displayed 100% MOD and original sum arithmetic agree on this domain.
  // Enforce its exclusion as provenance; do not invent an arithmetic divergence.
  const contaminated = structuredClone(profile); contaminated.excludedMod.executed = true;
  assert.throws(() => evidenceContract(contaminated), {name: 'AssertionError'});
});
