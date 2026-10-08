import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { PK_SKILL_TRAINING_S1 as profile, qualifyPkSkillTraining as qualify,
  qualifyPkStatTraining, completePkStatTraining, createSession, syntheticScenario, dispatch,
  canonical, saveGame, loadGame, replaySession } from '../src/index.ts';

const input = (current = -1, target = 0) => ({profile: 's1-pk-skill-training-v1', person: {rawE8: current}, trainingRecord: {raw58: target}});
const values = [-2147483648, -1, ...Array.from({length: 100}, (_, n) => n), 100, 2147483647];
// Independent native branch oracle: explicit signed branches, then equality, then caller inversion.
function oracle(current, target) {
  let helper;
  if (target < 0) helper = 0;
  else if (target > 99) helper = 0;
  else if (current === target) helper = 1;
  else helper = 0;
  return {helper: helper !== 0, eligible: helper === 0};
}
function verify(module) {
  let checked = 0;
  for (const current of values) for (const target of values) {
    const result = module.qualifyPkSkillTraining(input(current, target));
    const expected = oracle(current, target);
    assert.equal(result.supported, true, `${current}/${target}`);
    assert.equal(result.helperMatchesSkill, expected.helper, `${current}/${target}`);
    assert.equal(result.eligible, expected.eligible, `${current}/${target}`);
    assert.equal(result.reason, expected.eligible ? 'eligible' : 'already-has-target-skill');
    assert.equal(result.personRawE8, current); assert.equal(result.trainingRecordRaw58, target);
    checked++;
  }
  return checked;
}

test('explicit S1 scope, raw scalar domain, source binding and recursive immutability', () => {
  assert.equal(profile.profileId, 's1-pk-skill-training-v1');
  assert.equal(profile.source.id, 'S1'); assert.equal(profile.source.commit, '66e167e40c3440929ec016f3872aefc3486434c1');
  assert.equal(profile.source.idbSha256, 'c591cb40ce6d6be9246148002532dedc042463f36cd39c5ed300b7c449feefab');
  assert.equal(profile.scope, 'already-selected-category-2-scalar-eligibility-only');
  assert.equal(profile.level, 'compatibility-reconstruction');
  assert.equal(profile.stockOriginalVerified, false); assert.equal(profile.originalExecutableExecuted, false);
  assert.deepEqual(profile.constants, {targetMin: 0, targetMax: 99});
  assert.deepEqual(profile.domains['person.rawE8'], [-2147483648, 2147483647]);
  assert.deepEqual(profile.domains['trainingRecord.raw58'], [-2147483648, 2147483647]);
  function frozen(v) {if (v && typeof v === 'object') {assert.ok(Object.isFrozen(v)); Object.values(v).forEach(frozen);}}
  frozen(profile); assert.throws(() => {profile.constants.targetMax = 98;}, TypeError);
  assert.strictEqual(qualify(input()).evidence, profile.evidence);
});

test('independent range/equality/inversion oracle exhausts 10,816 boundary-class pairs', () => {
  assert.equal(verify({qualifyPkSkillTraining: qualify}), 10816);
});

test('same skill rejects; another existing skill or raw no-skill sentinel does not block', () => {
  for (let target = 0; target <= 99; target++) {
    assert.equal(qualify(input(target, target)).eligible, false);
    assert.equal(qualify(input((target + 1) % 100, target)).eligible, true);
    assert.equal(qualify(input(-1, target)).eligible, true);
  }
  // The source proves no special empty-slot prerequisite; the raw values have no guessed ID mapping.
  assert.equal(qualify(input(27, 32)).eligible, true);
});

test('out-of-range signed targets yield caller true even when equal, rather than native rejection', () => {
  for (const target of [-2147483648, -101, -1, 100, 101, 65536, 2147483647]) {
    const r = qualify(input(target, target));
    assert.equal(r.supported, true); assert.equal(r.helperMatchesSkill, false); assert.equal(r.eligible, true);
  }
  assert.equal(qualify(input(0, 0)).eligible, false);
  assert.equal(qualify(input(99, 99)).eligible, false);
});

test('full signed32 input support is distinct from engineering shape/domain rejection', () => {
  const bad = [null, undefined, [], 1, 'input', {}, {...input(), extra: 0},
    {...input(), category: 2}, {...input(), guideSkillId: 0},
    {...input(), profile: 'S2'}, {...input(), profile: 'pk'}, {...input(), profile: 'vanilla'},
    {...input(), person: null}, {...input(), person: []}, {...input(), person: 1},
    {...input(), trainingRecord: null}, {...input(), trainingRecord: []},
    {...input(), person: {rawE8: 0, skillId: 0}}, {...input(), trainingRecord: {raw58: 0, category: 2}}];
  for (const n of [-2147483649, 2147483648, 4294967295, 1.5, NaN, Infinity, -Infinity, '0', null, undefined, true, 1n]) {
    bad.push({...input(), person: {rawE8: n}}, {...input(), trainingRecord: {raw58: n}});
  }
  for (const i of bad) assert.equal(qualify(i).supported, false);
  for (const field of ['profile', 'person', 'trainingRecord']) {
    const i = input(); delete i[field]; assert.equal(qualify(i).supported, false);
  }
  const a = input(); delete a.person.rawE8; assert.equal(qualify(a).reason, 'invalid-person-raw-e8');
  const b = input(); delete b.trainingRecord.raw58; assert.equal(qualify(b).reason, 'invalid-record-raw-58');
  assert.equal(qualify(input(2147483647, -2147483648)).supported, true);
  assert.equal(qualify(input(-2147483648, 2147483647)).supported, true);
});

test('pure deterministic receipts and rejected inputs never mutate input or frozen evidence', () => {
  for (const i of [input(32, 32), input(27, 32), input(-1, -1), input(2147483648, 1)]) {
    const before = structuredClone(i); Object.freeze(i.person); Object.freeze(i.trainingRecord); Object.freeze(i);
    const a = qualify(i), b = qualify(i); assert.deepEqual(a, b); assert.deepEqual(i, before);
    assert.ok(Object.isFrozen(a)); assert.throws(() => {a.evidence.category.push('fake');}, TypeError);
  }
});

test('existing stat qualification and independent completion arithmetic remain unchanged', () => {
  const i = {profile: 's1-pk-stat-training-v1', attribute: 'war', xp: 1900, target: 80,
    growth: {kind: 'ordinary-no-age', talent: 51}};
  qualify(input(1, 2));
  assert.equal(qualifyPkStatTraining(i).eligible, true);
  const c = completePkStatTraining(i);
  assert.equal(c.requestedXp, 500); assert.equal(c.xpAfter, 2400); assert.equal(c.growthAfter, 75);
  assert.equal(qualifyPkStatTraining({...i, xp: c.xpAfter}).eligible, false);
  assert.equal(completePkStatTraining({...i, xp: 2000}).supported, true);
});

test('standalone scalar API adds no commands, state, save schema or replay effects', () => {
  let session = createSession(syntheticScenario()); const before = canonical(session);
  qualify(input(27, 32)); qualify(input(-1, -1)); assert.equal(canonical(session), before);
  for (const type of ['PkSkillTraining', 'SkillTraining', 'AbilityResearch', 'TrainOfficer']) {
    const rejected = dispatch(session, {type}); assert.equal(rejected.result.ok, false);
    assert.strictEqual(rejected.session, session); assert.equal(canonical(session), before);
  }
  assert.equal(session.saveVersion, 2); assert.equal(session.engineVersion, 'training-kernel-v2');
  session = dispatch(session, {type: 'EndTurn'}).session;
  assert.deepEqual(loadGame(saveGame(session)), session); assert.deepEqual(replaySession(session), session);
});

test('actual production range/equality/caller mutants die against independent oracle with controls', async () => {
  const raw = fs.readFileSync(new URL('../src/pk-skill-training.ts', import.meta.url), 'utf8');
  const source = raw.replace(raw.split('\n')[0], `const source = ${JSON.stringify(profile)};`);
  async function load(text) {return import(`data:text/javascript;base64,${Buffer.from(stripTypeScriptTypes(text)).toString('base64')}`);}
  const mutations = [
    ['requires empty skill', 'const eligible = !helperMatchesSkill;', 'const eligible = personRawE8 === -1 && !helperMatchesSkill;'],
    ['omits target range', 'trainingRecordRaw58 >= limits.targetMin && trainingRecordRaw58 <= limits.targetMax', 'true'],
    ['omits lower bound', 'trainingRecordRaw58 >= limits.targetMin', 'true'],
    ['omits upper bound', 'trainingRecordRaw58 <= limits.targetMax', 'true'],
    ['excludes zero', 'trainingRecordRaw58 >= limits.targetMin', 'trainingRecordRaw58 > limits.targetMin'],
    ['excludes99', 'trainingRecordRaw58 <= limits.targetMax', 'trainingRecordRaw58 < limits.targetMax'],
    ['includes100', 'trainingRecordRaw58 <= limits.targetMax', 'trainingRecordRaw58 <= 100'],
    ['reverses equality', 'personRawE8 === trainingRecordRaw58', 'personRawE8 !== trainingRecordRaw58'],
    ['forgets inversion', 'const eligible = !helperMatchesSkill;', 'const eligible = helperMatchesSkill;'],
    ['rejects native out-of-range targets', 'const personRawE8 = input.person.rawE8;', "if (input.trainingRecord.raw58 < 0 || input.trainingRecord.raw58 > 99) return reject('invalid-record-raw-58');\n  const personRawE8 = input.person.rawE8;"],
    ['narrows current domain', "if (!signed32(input.person.rawE8))", "if (!signed32(input.person.rawE8) || input.person.rawE8 < -1 || input.person.rawE8 > 99)"],
    ['coerces raw skill to byte', 'const personRawE8 = input.person.rawE8;', 'const personRawE8 = input.person.rawE8 & 255;'],
  ];
  for (const [name, from, to] of mutations) {
    assert.equal(verify(await load(source)), 10816, `control: ${name}`);
    assert.equal(source.split(from).length, 2, `one real production anchor: ${name}`);
    const mutant = await load(source.replace(from, to));
    assert.throws(() => verify(mutant), undefined, name);
  }
});
