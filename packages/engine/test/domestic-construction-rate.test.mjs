import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { stripTypeScriptTypes } from 'node:module';
import {
  DOMESTIC_CONSTRUCTION_RATE as profile,
  calculateDomesticConstructionRate as calculate,
  createSession, syntheticScenario, canonical, dispatch, saveGame, loadGame, replaySession,
} from '../src/index.ts';
import { calculateDomesticConstructionRate as directCalculate } from '../src/domestic-construction-rate.ts';

const PROFILE = 'domestic-construction-rate-stable-v1';
const input = (politics = [75, 1, 0], facilityDurability = 450) => ({profile: PROFILE, politics, facilityDurability});
const numericFields = ['politicsSum', 'maxPolitics', 'halfPoliticsSum', 'politicsRate',
  'durabilityQuarter', 'durabilityRemainder', 'durabilityMinimum', 'rate'];

// Independent register-level transcription of ORIGINAL bytes only. Constants are
// literal decoded immediates, never imported production constants or formulas.
// The Python companion additionally decodes and executes the verified GBK bytes.
function signedImulHigh(a, b) {
  return Number(BigInt.asIntN(32, (BigInt(a | 0) * BigInt(b | 0)) >> 32n));
}
function originalPolitics(slots, out = {}) {
  let ebp = 0, ebx = 0, edi = 0, eax = 0, ecx = 0, edx = 0;
  do {
    const stableAL = slots[edi];
    if (stableAL !== null && stableAL !== undefined) {
      eax = stableAL;
      ecx = eax & 0xff;                         // 005BB1F2 movzx ecx,al
      ebp = (ebp + ecx) | 0;                    // 005BB1F5 add ebp,ecx
      eax = stableAL;                           // 005BB1F9 repeated stable getter
      edx = eax & 0xff;
      if ((ebx | 0) < (edx | 0)) {              // 005BB203 JNL
        eax = stableAL;                         // 005BB207 third getter on update
        ebx = eax & 0xff;
      }
    }
    edi = (edi + 1) | 0;
  } while (edi < 3);
  out.politicsSum = ebp;
  out.maxPolitics = ebx;
  eax = ebp;                                   // saved [esp+10], NOT overwritten BP
  edx = eax >> 31;                             // CDQ
  eax = (eax - edx) | 0;
  eax >>= 1;                                   // SAR, signed truncation sequence
  out.halfPoliticsSum = eax;
  ebx = (ebx + eax) | 0;
  out.politicsRate = ebx;
  return out;
}
function originalDurability(D, savedEbp = 0) {
  const ebp = ((savedEbp & 0xffff0000) | (D & 0xffff)) | 0; // MOV BP preserves high half
  let eax = D & 0xffff;                         // MOVZX word [ECX+C2]
  eax >>>= 2;                                  // SHR, unsigned
  const quarter = eax;
  let ecx = ebp & 0xffff;                       // MOVZX ECX,BP
  ecx = (ecx - eax) | 0;
  const remainder = ecx;
  eax = 0x38e38e39;                            // original immediate, not MOD code
  let edx = signedImulHigh(eax, ecx);           // signed IMUL -> EDX:EAX
  edx >>= 1;                                   // SAR EDX,1
  ecx = edx;
  ecx >>>= 31;                                 // SHR ECX,31
  ecx = (ecx + edx) | 0;
  return {durabilityQuarter: quarter, durabilityRemainder: remainder, durabilityMinimum: ecx};
}
function original(politics, D) {
  const out = originalPolitics(politics);
  Object.assign(out, originalDurability(D, out.politicsSum));
  if ((out.durabilityMinimum | 0) <= (out.politicsRate | 0)) { // 005BB26A JLE includes tie
    out.selectedBranch = 'politics';
    out.rate = out.politicsRate;
  } else {
    // The original reads the stable facility again and repeats signed IMUL.
    const edi = D & 0xffff;                     // MOV DI then MOVZX ECX,DI
    let edx = D & 0xffff;
    edx >>>= 2;
    const ecx = (edi - edx) | 0;
    edx = signedImulHigh(0x38e38e39, ecx);
    edx >>= 1;
    let eax = edx;
    eax >>>= 31;
    eax = (eax + edx) | 0;
    out.selectedBranch = 'durability-minimum';
    out.rate = eax;
  }
  return out;
}
function compareReceipt(actual, expected, description = '') {
  assert.equal(actual.supported, true, description);
  for (const field of numericFields) assert.equal(actual[field], expected[field], `${description}: ${field}`);
  assert.equal(actual.selectedBranch, expected.selectedBranch, `${description}: JLE branch`);
}
function deepFrozen(value) {
  if (value !== null && typeof value === 'object') {
    assert.ok(Object.isFrozen(value));
    for (const child of Object.values(value)) deepFrozen(child);
  }
}
function evidenceContract(value) {
  assert.equal(value.profileId, PROFILE);
  assert.equal(value.level, 'source-listing-reconstruction');
  assert.equal(value.stockOriginalVerified, false);
  assert.equal(value.originalExecutableExecuted, false);
  assert.equal(value.source.commit, '66e167e40c3440929ec016f3872aefc3486434c1');
  assert.equal(value.source.gitBlobSha1, '76b1f9591a9f94830bcf4e5a67764d2911e19fd4');
  assert.equal(value.source.originalBytes, 5936);
  assert.equal(value.originalListing.instructionCount, 84);
  assert.equal(value.originalListing.byteLength, 219);
  assert.equal(value.excludedMod.replacementSite, '005BB263');
  assert.equal(value.excludedMod.target, '008A9DE8');
  assert.equal(value.excludedMod.instructionCount, 9);
  assert.equal(value.excludedMod.executed, false);
}

const regressions = [
  [[75, 1, 0], 450, 113], [[29, 1, 0], 500, 44], [[0, 0, 0], 500, 41],
  [[100, 100, 100], 500, 250], [[255, 255, 255], 0, 637], [[255, 255, 255], 65535, 5461],
  [[], 0, 0], [[null, null, null], 11, 1], [[1, null, null], 11, 1],
  [[1, 1, 1], 35, 3], [[0, 0, 0], 35, 3], [[0, 0, 0], 36, 3],
];
function verifyBehavior(calculateCandidate) {
  for (const [politics, D] of regressions) {
    compareReceipt(calculateCandidate(input(politics, D)), original(politics, D), `${JSON.stringify(politics)},D=${D}`);
  }
  for (const politics of [[0, 0, 0], [1, 0, 0], [29, 1, 0], [75, 1, 0], [255, 255, 255]]) {
    for (const D of [0, 1, 2, 3, 4, 8, 9, 10, 11, 12, 13, 35, 36, 37, 449, 450, 451, 499, 500, 501, 65534, 65535]) {
      compareReceipt(calculateCandidate(input(politics, D)), original(politics, D));
    }
  }
}

test('construction rate public export, byte-level provenance and frozen evidence remain explicit', () => {
  assert.strictEqual(calculate, directCalculate);
  evidenceContract(profile);
  deepFrozen(profile);
  assert.deepEqual(profile.constants, {politicsDivisor: 2, durabilityQuarterDivisor: 4,
    durabilityRemainderDivisor: 9, signedDivisionMagic: '0x38E38E39'});
  const result = calculate(input());
  assert.strictEqual(result.evidence, profile.evidence);
  deepFrozen(result);
  assert.throws(() => {result.evidence.durabilityMinimum.push('MOD');}, TypeError);
});

test('independent signed register oracle proves counterexamples and the shared 250 anchor', () => {
  for (const [politics, D, expectedRate] of regressions) {
    const expected = original(politics, D);
    assert.equal(expected.rate, expectedRate);
    compareReceipt(calculate(input(politics, D)), expected);
  }
  verifyBehavior(calculate);
});

test('all 65,536 uint16 durabilities preserve SHR/IMUL/SAR and JLE at five politics levels', () => {
  const politicsCases = [[null, null, null], [1, 0, 0], [29, 1, 0], [75, 1, 0], [255, 255, 255]];
  const politicsOracle = politicsCases.map(slots => originalPolitics(slots));
  const digest = createHash('sha256');
  const bytes = Buffer.alloc(4);
  let cases = 0, ties = 0, minimumBranch = 0, politicsBranch = 0;
  for (let D = 0; D < 65536; D++) {
    const d = originalDurability(D);
    bytes.writeUInt32LE(d.durabilityMinimum);
    digest.update(bytes);
    for (let i = 0; i < politicsCases.length; i++) {
      const expected = {...politicsOracle[i], ...d};
      const usePolitics = (expected.durabilityMinimum | 0) <= (expected.politicsRate | 0);
      expected.selectedBranch = usePolitics ? 'politics' : 'durability-minimum';
      expected.rate = usePolitics ? expected.politicsRate : original(politicsCases[i], D).rate;
      const actual = calculate(input(politicsCases[i], D));
      compareReceipt(actual, expected, `D=${D},politics-level=${i}`);
      if (expected.durabilityMinimum === expected.politicsRate) ties++;
      if (usePolitics) politicsBranch++; else minimumBranch++;
      cases++;
    }
  }
  assert.equal(cases, 327680);
  assert.ok(ties > 0 && minimumBranch > 0 && politicsBranch > 0);
  // Pinned independently by the Python byte interpreter, which reads the exact
  // GBK Git blob and executes all non-starred instructions for every D.
  assert.equal(digest.digest('hex'), '826db99dd6e4d88727fb0bcb5ea048b5007595ad8b0fdacff3401ad33cb0b6ed');
});

test('all 16,777,216 uint8 politics triples follow MOVZX, signed compares and sum-halving', () => {
  const slots = [0, 0, 0];
  const request = input(slots, 0);
  const expected = {};
  let cases = 0;
  for (let a = 0; a <= 255; a++) {
    slots[0] = a;
    for (let b = 0; b <= 255; b++) {
      slots[1] = b;
      for (let c = 0; c <= 255; c++) {
        slots[2] = c;
        originalPolitics(slots, expected);
        const actual = calculate(request);
        if (!actual.supported || actual.politicsSum !== expected.politicsSum || actual.maxPolitics !== expected.maxPolitics ||
            actual.halfPoliticsSum !== expected.halfPoliticsSum || actual.politicsRate !== expected.politicsRate ||
            actual.rate !== expected.politicsRate || actual.selectedBranch !== 'politics') {
          assert.fail(`uint8 politics mismatch at [${a},${b},${c}]: ${JSON.stringify({actual, expected})}`);
        }
        cases++;
      }
    }
  }
  assert.equal(cases, 16777216);
});

test('all 197,377 null-containing triples and missing trailing slots preserve empty pointer semantics', () => {
  const slots = [null, null, null], expected = {};
  const request = input(slots, 500);
  const d = originalDurability(500);
  let cases = 0;
  for (let a = -1; a <= 255; a++) for (let b = -1; b <= 255; b++) for (let c = -1; c <= 255; c++) {
    if (a >= 0 && b >= 0 && c >= 0) continue;
    slots[0] = a < 0 ? null : a;
    slots[1] = b < 0 ? null : b;
    slots[2] = c < 0 ? null : c;
    originalPolitics(slots, expected);
    Object.assign(expected, d);
    expected.selectedBranch = expected.durabilityMinimum <= expected.politicsRate ? 'politics' : 'durability-minimum';
    expected.rate = expected.selectedBranch === 'politics' ? expected.politicsRate : expected.durabilityMinimum;
    compareReceipt(calculate(request), expected);
    cases++;
  }
  assert.equal(cases, 197377);
  for (const slots of [[], [null], [0], [255], [null, null], [null, 255], [255, null], [255, 255]]) {
    const actual = calculate(input(slots, 500));
    compareReceipt(actual, original(slots, 500));
    assert.deepEqual(actual.politics, [slots[0] ?? null, slots[1] ?? null, slots[2] ?? null]);
  }
});

test('ties take politics, permutations preserve numeric rate, and mixed odd/even values do not round', () => {
  for (const values of [[75, 1, 0], [29, 1, 0], [255, 254, null], [255, 0, 1], [1, 2, 3]]) {
    for (const permutation of [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]]) {
      const slots = permutation.map(i => values[i]);
      compareReceipt(calculate(input(slots, 500)), original(values, 500));
    }
  }
  assert.equal(calculate(input([1, null, null], 11)).selectedBranch, 'politics');
  assert.equal(calculate(input([1, null, null], 23)).selectedBranch, 'durability-minimum');
  assert.equal(calculate(input([255, 255, 255], 0)).halfPoliticsSum, 382);
});

test('malformed inputs, foreign profiles, extra command fields and non-integer domains reject without coercion', () => {
  const reject = (value, reason) => {
    const result = calculate(value);
    assert.equal(result.supported, false);
    assert.equal(result.reason, reason);
    assert.deepEqual(Object.keys(result).sort(), ['evidence', 'reason', 'supported']);
    assert.strictEqual(result.evidence, profile.evidence);
    deepFrozen(result);
  };
  for (const value of [null, undefined, false, 0, '', [], () => 1]) reject(value, 'invalid-input');
  for (const badProfile of [undefined, null, 0, '', 'S1', 'PS2', 'Vanilla', 'PK1.1', '008A9DE8', 'domestic-construction-rate-stable-v2']) {
    reject({...input(), profile: badProfile}, 'unsupported-profile');
  }
  for (const field of ['officerId', 'facilityId', 'currentDurability', 'initialDurability', 'mutableGetters', 'mod', 'turns', 'extra']) {
    reject({...input(), [field]: 1}, 'unexpected-field');
  }
  for (const politics of [undefined, null, 1, '75', {}, new Uint8Array([75]), [0, 0, 0, 0], Array(1), [, 1], [1, , 1]]) {
    reject({...input(), politics}, 'invalid-politics');
  }
  const named = [1]; named.extra = 1; reject({...input(), politics: named}, 'invalid-politics');
  for (const value of [undefined, -1, 256, 65535, 1.5, NaN, Infinity, -Infinity, '1', false, {}, [], 1n]) {
    for (let i = 0; i < 3; i++) {
      const slots = [0, 0, 0]; slots[i] = value;
      reject(input(slots), 'invalid-politics');
    }
  }
  for (const value of [undefined, null, -1, 65536, 1.5, NaN, Infinity, -Infinity, '500', false, {}, [], 500n]) {
    reject({...input(), facilityDurability: value}, 'invalid-facility-durability');
  }
  for (const [field, reason] of [['profile', 'unsupported-profile'], ['politics', 'invalid-politics'], ['facilityDurability', 'invalid-facility-durability']]) {
    const value = input(); delete value[field]; reject(value, reason);
  }
});

test('accepted receipts clone politics, deeply freeze outputs and never mutate the supplied input', () => {
  const slots = [75, 1, null];
  const value = input(slots);
  const a = calculate(value), b = calculate(value);
  assert.deepEqual(a, b);
  assert.notStrictEqual(a.politics, slots);
  deepFrozen(a);
  slots[0] = 255;
  assert.deepEqual(a.politics, [75, 1, null]);
  assert.equal(a.rate, 113);
  assert.throws(() => {a.politics[0] = 2;}, TypeError);
  assert.throws(() => {a.rate = 2;}, TypeError);
  const frozen = Object.freeze(input(Object.freeze([75, 1, 0])));
  const before = JSON.stringify(frozen);
  compareReceipt(calculate(frozen), original([75, 1, 0], 450));
  assert.equal(JSON.stringify(frozen), before);
});

test('standalone numerical API leaves construction eligibility, Train/EndTurn and save/replay unchanged', () => {
  let session = createSession(syntheticScenario());
  const before = canonical(session);
  calculate(input());
  assert.equal(canonical(session), before);
  for (const type of ['Construct', 'BuildFacility', 'DomesticConstructionRate']) {
    const rejected = dispatch(session, {type});
    assert.equal(rejected.result.ok, false);
    assert.strictEqual(rejected.session, session);
    assert.equal(canonical(session), before);
  }
  session = dispatch(session, {type: 'EndTurn'}).session;
  assert.deepEqual(loadGame(saveGame(session)), session);
  assert.deepEqual(replaySession(session), session);
});

test('actual-production arithmetic mutants fail the independent oracle, with a passing unmutated control', async () => {
  const raw = fs.readFileSync(new URL('../src/domestic-construction-rate.ts', import.meta.url), 'utf8');
  const importLine = raw.split('\n')[0];
  assert.match(importLine, /^import source from /);
  const source = raw.replace(importLine, `const source = ${JSON.stringify(profile)};`);
  const load = text => import(`data:text/javascript;base64,${Buffer.from(stripTypeScriptTypes(text)).toString('base64')}`);
  const mutations = [
    ['remainder /9 changed to /10', 'durabilityRemainder / limits.durabilityRemainderDivisor', 'durabilityRemainder / 10'],
    ['politics floor changed to round', 'Math.floor(politicsSum / limits.politicsDivisor)', 'Math.round(politicsSum / limits.politicsDivisor)'],
    ['quarter floor changed to round', 'Math.floor(input.facilityDurability / limits.durabilityQuarterDivisor)', 'Math.round(input.facilityDurability / limits.durabilityQuarterDivisor)'],
    ['minimum floor changed to round', 'Math.floor(durabilityRemainder / limits.durabilityRemainderDivisor)', 'Math.round(durabilityRemainder / limits.durabilityRemainderDivisor)'],
    ['old composite-first politics rounding', 'maxPolitics + halfPoliticsSum', 'Math.floor((maxPolitics + Math.floor((politicsSum - maxPolitics + 1) / 3)) * 3 / 2)'],
    ['drop durability minimum', 'Math.max(politicsRate, durabilityMinimum)', 'politicsRate'],
    ['premature D/12 simplification', 'Math.floor(durabilityRemainder / limits.durabilityRemainderDivisor)', 'Math.floor(input.facilityDurability / 12)'],
    ['equality changes original JLE branch', "durabilityMinimum > politicsRate ? 'durability-minimum' : 'politics'", "durabilityMinimum >= politicsRate ? 'durability-minimum' : 'politics'"],
    ['clamp uint8 politics to conventional 100', 'politicsSum += value;', 'politicsSum += Math.min(value, 100);'],
  ];
  const control = await load(source);
  verifyBehavior(control.calculateDomesticConstructionRate);
  for (const [name, from, to] of mutations) {
    verifyBehavior(control.calculateDomesticConstructionRate);
    assert.equal(source.split(from).length, 2, `unique mutation site: ${name}`);
    const mutant = await load(source.replace(from, to));
    assert.throws(() => verifyBehavior(mutant.calculateDomesticConstructionRate), {name: 'AssertionError'}, name);
  }
  // The literal MOD multiply-by-100/divide-by-100 has the same numeric output
  // on this bounded domain. Do not misreport a behavioral kill for equivalent
  // arithmetic; MOD execution is an independently enforced provenance contract.
  const contaminated = structuredClone(profile);
  contaminated.excludedMod.executed = true;
  assert.throws(() => evidenceContract(contaminated), {name: 'AssertionError'});
});
