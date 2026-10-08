import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { PK_STAT_TRAINING_S1 as profile, qualifyPkStatTraining as qualify, completePkStatTraining as complete,
  createSession, syntheticScenario, dispatch, canonical, saveGame, loadGame, replaySession } from '../src/index.ts';

const input = (xp = 1900, current = 70, target = 80, attribute = 'war') => ({
  profile: 's1-pk-stat-training-v1', attribute, xp, target, growth: {kind: 'resolved-native-growth', value: current},
});
const ordinary = (talent = 51, xp = 1900, target = 80) => ({...input(xp, 1, target), growth: {kind: 'ordinary-no-age', talent}});
const growth = (talent, xp) => Math.max(1, Math.min(100, talent + Math.trunc(xp / 100)));
// Independent branch oracle: no production constants, formulas or helper imports.
function oracle(xp, current, target) {
  const eligible = xp < 2000 && current < target;
  if (current > target) return {eligible, supported: false};
  const points = target - current >= 5 ? 5 : target - current;
  const requested = points * 100;
  const after = xp + requested > 3000 ? 3000 : xp + requested;
  return {eligible, supported: true, points, requested, after, credited: after - xp};
}
function verify(module) {
  for (const [xp, current, target] of [[1999, 70, 80], [2000, 70, 80], [0, 80, 80], [1900, 79, 80],
    [1900, 76, 80], [1900, 75, 80], [1900, 74, 80], [2999, 70, 80], [3000, 70, 80], [2300, 70, 80], [1, 81, 80]]) {
    const expected = oracle(xp, current, target), i = input(xp, current, target);
    const q = module.qualifyPkStatTraining(i), c = module.completePkStatTraining(i);
    assert.equal(q.eligible, expected.eligible);
    assert.equal(c.supported, expected.supported);
    if (!expected.supported) {assert.equal(c.reason, 'unsupported-negative-delta'); continue;}
    assert.equal(c.requestedPoints, expected.points); assert.equal(c.requestedXp, expected.requested);
    assert.equal(c.xpAfter, expected.after); assert.equal(c.creditedXp, expected.credited);
    assert.equal(c.clippedXp, expected.requested - expected.credited);
    assert.equal(c.growthAfter, null); assert.equal(c.actualGrowth, null);
  }
  for (const [talent, xp, target] of [[51, 1900, 80], [0, 0, 80], [0, 99, 80], [99, 1, 100], [80, 2000, 100], [51, 1999, 80]]) {
    const i = ordinary(talent, xp, target), q = module.qualifyPkStatTraining(i), c = module.completePkStatTraining(i);
    assert.equal(q.growthBefore, growth(talent, xp));
    assert.equal(c.growthAfter, growth(talent, c.xpAfter));
    assert.equal(c.actualGrowth, c.growthAfter - c.growthBefore);
  }
}

test('S1 identity, source addresses and constants are explicit and recursively immutable', () => {
  assert.equal(profile.profileId, 's1-pk-stat-training-v1'); assert.equal(profile.source.id, 'S1');
  assert.equal(profile.source.commit, '66e167e40c3440929ec016f3872aefc3486434c1');
  assert.equal(profile.stockOriginalVerified, false); assert.equal(profile.originalExecutableExecuted, false);
  assert.equal(profile.level, 'compatibility-reconstruction');
  assert.deepEqual(profile.constants, {startXpExclusive: 2000, pointsPerCompletion: 5, xpPerPoint: 100, xpCap: 3000, growthMin: 1, growthMax: 100});
  function frozen(v) {if (v && typeof v === 'object') {assert.ok(Object.isFrozen(v)); Object.values(v).forEach(frozen);}}
  frozen(profile); assert.throws(() => {profile.constants.xpCap = 1;}, TypeError);
  assert.deepEqual(qualify(input()).evidence, profile.evidence);
});

test('independent hard-coded oracle covers start boundaries, completion tiers and storage clipping', () => {
  verify({qualifyPkStatTraining: qualify, completePkStatTraining: complete});
});

test('ordinary cumulative XP and research share capacity: 51 + 1900 -> 70 -> 75, then ineligible', () => {
  const i = ordinary(), q = qualify(i), c = complete(i);
  assert.equal(q.eligible, true); assert.equal(q.growthBefore, 70);
  assert.deepEqual([c.xpBefore, c.requestedPoints, c.requestedXp, c.creditedXp, c.xpAfter, c.growthAfter], [1900, 5, 500, 500, 2400, 75]);
  const next = qualify({...i, xp: c.xpAfter});
  assert.equal(next.eligible, false); assert.equal(next.reason, 'xp-start-limit');
});

test('completion is not a command and does not re-run start eligibility, including zero delta', () => {
  for (const xp of [2000, 2001, 2499, 2500, 2999, 3000]) {
    const i = input(xp); assert.equal(qualify(i).eligible, false);
    assert.equal(complete(i).supported, true); assert.equal(complete(i).requestedXp, 500);
    const zero = complete(input(xp, 80, 80));
    assert.equal(zero.supported, true); assert.equal(zero.requestedXp, 0); assert.equal(zero.xpAfter, xp);
  }
  const both = qualify(input(2000, 80, 80)); assert.equal(both.reason, 'xp-start-limit');
  assert.equal(qualify(input(1999, 80, 80)).reason, 'growth-target-reached');
});

test('all five attributes preserve the same bounded arithmetic over 75,025 vectors', () => {
  let count = 0;
  for (const attribute of ['leadership', 'war', 'intelligence', 'politics', 'charisma']) {
    for (let xp = 0; xp <= 3000; xp++) for (const current of [80, 79, 76, 75, 74]) {
      const i = input(xp, current, 80, attribute), expected = oracle(xp, current, 80);
      const q = qualify(i), c = complete(i);
      assert.equal(q.eligible, expected.eligible); assert.equal(c.xpAfter, expected.after);
      assert.equal(c.requestedXp, expected.requested); assert.equal(c.creditedXp, expected.credited);
      assert.equal(c.attribute, attribute); assert.equal(c.growthAfter, null); count++;
    }
  }
  assert.equal(count, 75025);
});

test('ordinary mode handles floor, min1 and cap100 without double-counting or inventing talent', () => {
  for (let talent = 0; talent <= 100; talent++) for (const xp of [0, 1, 99, 100, 101, 1899, 1900, 1999, 2000, 2499, 2999, 3000]) {
    const i = ordinary(talent, xp, 100), before = growth(talent, xp), c = complete(i);
    const expected = oracle(xp, before, 100);
    assert.equal(c.xpAfter, expected.after); assert.equal(c.growthBefore, before);
    assert.equal(c.growthAfter, growth(talent, expected.after));
    assert.equal(c.actualGrowth, c.growthAfter - before);
  }
  assert.equal(complete(ordinary(0, 0, 80)).actualGrowth, 4); // clamp1 before is not talent1
});

test('opaque native getter is respected and cannot imply an ordinary post-write value', () => {
  const c = complete(input(1900, 10, 80));
  assert.equal(c.growthBefore, 10); assert.equal(c.xpAfter, 2400);
  assert.equal(c.growthAfter, null); assert.equal(c.actualGrowth, null);
  assert.equal(complete(input(0, 81, 80)).reason, 'unsupported-negative-delta');
  assert.equal(qualify(input(0, 81, 80)).reason, 'growth-target-reached');
});

test('malformed JSON-shaped inputs, foreign profiles and out-of-domain values reject without coercion', () => {
  const bad = [null, undefined, [], 1, {}, {...input(), extra: 1}, {...input(), profile: 'pk'}, {...input(), profile: 'S2'},
    {...input(), profile: 'vanilla'}, {...input(), attribute: 'aptitude'}, {...input(), attribute: 1},
    {...input(), growth: null}, {...input(), growth: []}, {...input(), growth: {kind: 'age-adjusted', value: 70}},
    {...input(), growth: {kind: 'ordinary-no-age', talent: 51, nativePersonId: 700}},
    {...input(), growth: {kind: 'resolved-native-growth', value: 70, talent: 51}}];
  for (const n of [-1, 3001, 65536, 1.5, NaN, Infinity, '1900', null, undefined]) bad.push({...input(), xp: n});
  for (const n of [-1, 0, 101, 1.5, NaN, Infinity, '80', null, undefined]) {
    bad.push({...input(), target: n}, {...input(), growth: {kind: 'resolved-native-growth', value: n}});
  }
  for (const n of [-1, 101, 1.5, NaN, Infinity, '51', null, undefined]) bad.push({...input(), growth: {kind: 'ordinary-no-age', talent: n}});
  for (const i of bad) for (const f of [qualify, complete]) assert.equal(f(i).supported, false);
  for (const field of ['profile', 'attribute', 'xp', 'target', 'growth']) {
    const i = input(); delete i[field]; assert.equal(qualify(i).supported, false); assert.equal(complete(i).supported, false);
  }
});

test('calls are deterministic, do not mutate input and return immutable evidence/receipts', () => {
  const i = ordinary(); Object.freeze(i.growth); Object.freeze(i);
  for (const f of [qualify, complete]) {
    const a = f(i), b = f(i); assert.deepEqual(a, b); assert.ok(Object.isFrozen(a));
    assert.throws(() => {a.evidence.writer.push('fake');}, TypeError);
  }
  assert.deepEqual(i, ordinary());
});

test('standalone APIs leave Train/EndTurn, unsupported commands and save/replay unchanged', () => {
  let session = createSession(syntheticScenario()); const before = canonical(session);
  qualify(ordinary()); complete(ordinary()); assert.equal(canonical(session), before);
  for (const type of ['AbilityResearch', 'TrainOfficer', 'PkStatTraining']) {
    const rejected = dispatch(session, {type}); assert.equal(rejected.result.ok, false);
    assert.strictEqual(rejected.session, session); assert.equal(canonical(session), before);
  }
  assert.equal(session.saveVersion, 2); assert.equal(session.engineVersion, 'training-kernel-v2');
  session = dispatch(session, {type: 'EndTurn'}).session;
  assert.deepEqual(loadGame(saveGame(session)), session);
  assert.deepEqual(replaySession(session), session);
});

test('behavioral oracles kill actual production arithmetic and boundary mutants with a passing control', async () => {
  const raw = fs.readFileSync(new URL('../src/pk-stat-training.ts', import.meta.url), 'utf8');
  const importLine = raw.split('\n')[0];
  const source = raw.replace(importLine, `const source = ${JSON.stringify(profile)};`);
  async function load(text) {return import(`data:text/javascript;base64,${Buffer.from(stripTypeScriptTypes(text)).toString('base64')}`);}
  const mutations = [
    ['XP boundary', 'state.xpBefore >= limits.startXpExclusive', 'state.xpBefore > limits.startXpExclusive'],
    ['target boundary', 'state.growthBefore >= state.target', 'state.growthBefore > state.target'],
    ['completion gate', '// Native has min', "if (state.xpBefore >= 2000) return reject('invalid-xp');\n  // Native has min"],
    ['negative silently zero', "if (state.growthBefore > state.target) return reject('unsupported-negative-delta');", ''],
    ['point ceiling', 'Math.min(limits.pointsPerCompletion, state.target - state.growthBefore)', 'Math.min(4, state.target - state.growthBefore)'],
    ['conversion factor', 'requestedPoints * limits.xpPerPoint', 'requestedPoints * 10'],
    ['shared XP storage', 'state.xpBefore + requestedXp', 'requestedXp'],
    ['storage cap', 'Math.min(limits.xpCap, state.xpBefore + requestedXp)', 'Math.min(2000, state.xpBefore + requestedXp)'],
    ['credit clipping', 'const creditedXp = xpAfter - state.xpBefore;', 'const creditedXp = requestedXp;'],
    ['opaque getter extrapolation', 'ordinaryGrowth(input.growth.talent, xpAfter) : null', 'ordinaryGrowth(input.growth.talent, xpAfter) : state.growthBefore + requestedPoints'],
    ['growth rounding', 'Math.floor(xp / limits.xpPerPoint)', 'Math.ceil(xp / limits.xpPerPoint)'],
    ['growth lower cap', 'Math.max(limits.growthMin, Math.min', 'Math.max(0, Math.min'],
    ['growth double count', 'ordinaryGrowth(input.growth.talent, xpAfter)', 'ordinaryGrowth(state.growthBefore, xpAfter)'],
  ];
  for (const [name, from, to] of mutations) {
    verify(await load(source)); assert.equal(source.split(from).length, 2, name);
    const mutant = await load(source.replace(from, to)); assert.throws(() => verify(mutant), undefined, name);
  }
});
