import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { clone, canonical, createReference, runReference, project, projectReference } from './helpers/city-command-reference.mjs';
const api = await import(process.env.CITY_COMMAND_ENGINE_URL ?? '../src/index.ts');
const vectors = JSON.parse(readFileSync(new URL('./fixtures/city-command-lifecycle-v1.json', import.meta.url), 'utf8'));
const good = r => { assert.equal(r.ok, true, r.ok === true ? undefined : JSON.stringify(r)); return r; };
const created = scenario => { const s = api.createCityCommandState(scenario); assert.notEqual(s.ok, false, JSON.stringify(s)); return s; };
const base = () => clone(vectors.scenario);
const sha = v => createHash('sha256').update(canonical(v)).digest('hex');
const path = (v, p) => p.split('.').reduce((x, k) => x?.[k], v);
const freeze = v => { if (v && typeof v === 'object') { for (const x of Object.values(v)) freeze(x); Object.freeze(v); } return v; };
function frozen(v) { if (v && typeof v === 'object') { assert.ok(Object.isFrozen(v)); for (const x of Object.values(v)) frozen(x); } }
function patch(v, replacements) { for (const [p, value] of Object.entries(replacements)) { const keys = p.split('/').slice(1), last = keys.pop(); keys.reduce((x, k) => x[k], v)[last] = clone(value); } return v; }
function roundtrip(s) { const raw = good(api.saveCityCommandState(s)).serialized, loaded = api.loadCityCommandState(raw); assert.notEqual(loaded.ok, false, loaded.ok === false ? JSON.stringify(loaded) : undefined); assert.equal(canonical(loaded), canonical(s)); assert.equal(good(api.saveCityCommandState(loaded)).serialized, raw); frozen(loaded); return loaded; }
function invariant(s) {
  const ids = new Set(), facilities = new Set(), totals = {};
  for (const j of s.productionJobs) {
    assert.equal(j.dueTurn, j.startTurn + j.durationTurns);
    if (j.status === 'active') {
      assert.equal(j.remainingTurns, j.dueTurn - s.turn); assert.ok(j.remainingTurns > 0); assert.equal(j.completedTurn, null);
      totals[j.equipmentType] = (totals[j.equipmentType] ?? 0) + j.reservedQuantity;
      assert.ok(!facilities.has(j.facilityId)); facilities.add(j.facilityId); assert.equal(s.facilities.find(f => f.id === j.facilityId).reservationJobId, j.id);
      for (const oid of j.officerIds) { assert.ok(!ids.has(oid)); ids.add(oid); assert.equal(s.officers.find(o => o.id === oid).reservationJobId, j.id); }
    } else { assert.equal(j.remainingTurns, 0); assert.equal(j.completedTurn, j.dueTurn); assert.ok(j.completion); }
  }
  for (const [t, stock] of Object.entries(s.city.inventory)) { assert.equal(stock.reserved, totals[t] ?? 0); assert.ok(stock.quantity + stock.reserved <= stock.capacity); }
  for (const o of s.officers) assert.equal(o.reservationJobId !== null, ids.has(o.id));
  for (const f of s.facilities) assert.equal(f.reservationJobId !== null, facilities.has(f.id));
  assert.equal(s.revision, s.appliedCommands.length); assert.equal(new Set(s.appliedCommands.map(a => a.envelope.id)).size, s.revision);
}
function context(r, original, envelope) {
  const s = r.ok ? r.state : original, rec = r.receipt, ids = envelope.command.officerIds ?? [];
  return { ...r, state: s, calculation: rec?.calculation, eachSelected: ids.map(id => s.officers.find(o => o.id === id)), newJobs: s.productionJobs.length - original.productionJobs.length, taskKind: rec?.taskKind, newJob: s.productionJobs.at(-1), participantsReserved: ids.filter(id => s.officers.some(o => o.id === id && o.reservationJobId !== null)).length, facilityReserved: s.facilities.find(f => f.reservationJobId === rec?.newJobId)?.id, officer0: { reward: rec?.rewards.find(x => x.officerId === 'o1') }, stateUnchanged: canonical(original) === canonical(s) };
}
function checkExpected(ctx, expected, label) {
  for (const [p, value] of Object.entries(expected)) {
    const [head, ...tail] = p.split('.');
    if (['eachSelected', 'completedParticipants', 'eachOf6Participants'].includes(head)) {
      const people = ctx[head]; assert.ok(people?.length > 0, label + ':' + p + ': participants required');
      for (const person of people) assert.deepEqual(path(person, tail.join('.')), value, label + ':' + p + ':' + person.id);
    } else assert.deepEqual(path(ctx, p), value, label + ':' + p);
  }
}
for (const v of vectors.sourceLiteralVectors) test(`literal:${v.id}`, () => {
  const name = v.api === 'calculateRecruitmentQuantity' ? 'calculateRecruitmentQuantityProjection' : v.api;
  const r = api[name](freeze(clone(v.input))); for (const [k, expected] of Object.entries(v.expected)) assert.deepEqual(r[k], expected, `${v.id}:${k}`);
});
for (const v of [...vectors.policyReferenceVectors, ...vectors.invalidInputVectors]) test(`vector:${v.id}`, () => {
  const scenario = patch(base(), v.initialPatch), inputBefore = canonical(scenario), s = api.createCityCommandState(freeze(scenario));
  assert.equal(canonical(scenario), inputBefore);
  if (s.ok === false) { assert.equal(v.expected.ok, false); assert.equal(s.reason, v.expected.reason); return; }
  frozen(s); const before = canonical(s), preview1 = api.previewCityCommand(s, freeze(clone(v.envelope))), preview2 = api.previewCityCommand(s, clone(v.envelope));
  assert.equal(canonical(s), before); assert.deepEqual(preview1, preview2);
  const r = api.executeCityCommand(s, freeze(clone(v.envelope))); assert.equal(canonical(s), before); frozen(r);
  if (r.ok) { assert.equal(preview1.ok, true); assert.deepEqual(preview1.receipt, r.receipt); invariant(r.state); roundtrip(r.state); }
  else assert.deepEqual(preview1, r);
  checkExpected(context(r, s, v.envelope), v.expected, v.id);
  if (r.ok) { const ref = runReference(createReference(scenario), v.envelope); good(ref); assert.deepEqual(project(r.state), projectReference(ref.state), v.id + ': independent ledger'); }
});
function runLifecycle(v, { reloadEvery = false } = {}) {
  const scenario = patch(base(), v.initialPatch); let s = created(scenario), ref = createReference(scenario); const outcomes = [], trace = [], ctx = {};
  for (const [i, c] of v.commands.entries()) {
    if (c.operation === 'save-load-roundtrip') { s = roundtrip(s); outcomes.push(null); continue; }
    const before = canonical(s), preview = api.previewCityCommand(s, c), r = api.executeCityCommand(s, c), reference = runReference(ref, c); assert.equal(canonical(s), before);
    if (r.ok) { good(reference); assert.deepEqual(preview.receipt, r.receipt); s = r.state; ref = reference.state; assert.deepEqual(project(s), projectReference(ref), v.id + ':' + i + ': reference'); invariant(s); }
    else { assert.deepEqual(r, reference, v.id + ':' + i + ': rejection'); assert.deepEqual(preview, r); }
    ctx['step' + i] = { ...r, quantityKernelReturn: r.receipt?.calculation.quantityKernelReturn, jobRemaining: s.productionJobs.at(-1)?.remainingTurns, stateUnchanged: before === canonical(s) };
    outcomes.push(r); trace.push({ envelope: clone(c), expected: r.ok ? { ok: true, duplicate: r.duplicate, receipt: clone(r.receipt) } : clone(r) });
    if (reloadEvery) s = roundtrip(s);
  }
  const replay = good(api.replayCityCommands({ tag: 'san11-city-command-trace-v1', initialScenario: scenario, steps: trace, expectedFinalDigest: sha(s) }));
  assert.deepEqual(replay.state, s); const ids = [...new Set(s.productionJobs.filter(j => j.status === 'completed').flatMap(j => j.officerIds))], completed = ids.map(id => s.officers.find(o => o.id === id));
  const last = [...v.commands].reverse().find(c => c.command?.officerIds), recruitResult = outcomes.find(r => r?.ok && r.receipt.calculation.troopWrite);
  Object.assign(ctx, { final: s, duplicateSteps: outcomes.flatMap((r, i) => r?.duplicate ? [i] : []), duplicateFinal: outcomes.at(-1)?.duplicate, activeJobs: s.productionJobs.filter(j => j.status === 'active').length, completedJobs: s.productionJobs.filter(j => j.status === 'completed').length, completionEvents: s.appliedCommands.reduce((n, a) => n + a.receipt.completions.length, 0), completedParticipants: completed, eachOf6Participants: completed, eachSelected: (last?.command.officerIds ?? []).map(id => s.officers.find(o => o.id === id)), replayEqualsFinal: true, saveLoadContinuationEqualsUninterrupted: true, savedPoliciesRestoredExactly: canonical(s.policies) === canonical(scenario.policies), afterRecruit: recruitResult ? { quantityKernelReturn: recruitResult.receipt.calculation.quantityKernelReturn, security: recruitResult.state.city.security, morale: recruitResult.state.city.morale } : null });
  // A named cumulative XP check has a distinct receipt spelling in the scenario specification.
  const expected = { ...v.expected };
  if ('completedParticipants.intelligenceXpAfterExtraTicks' in expected) { for (const person of completed) assert.equal(person.xp.intelligence, expected['completedParticipants.intelligenceXpAfterExtraTicks']); delete expected['completedParticipants.intelligenceXpAfterExtraTicks']; }
  checkExpected(ctx, expected, v.id); return { state: s, scenario, trace, outcomes };
}
for (const v of vectors.lifecycleVectors) test(`lifecycle:${v.id}`, () => { const a = runLifecycle(v), b = runLifecycle(v, { reloadEvery: true }); assert.deepEqual(a.state, b.state); });

test('M01: preview pure, deeply frozen result, no mutable input aliases', () => {
  const q = base(), s = created(q), e = clone(vectors.policyReferenceVectors.find(v => v.id === 'R23').envelope), before = canonical(s), a = good(api.previewCityCommand(s, e)); frozen(a);
  assert.equal(canonical(s), before); q.officers[0].intelligence = 1; e.command.officerIds.reverse(); assert.equal(canonical(s), before);
  assert.deepEqual(a, api.previewCityCommand(s, vectors.policyReferenceVectors.find(v => v.id === 'R23').envelope));
  assert.throws(() => { a.receipt.calculation.selectedOfficerIds[0] = 'x'; }, TypeError);
});
test('M02: rejection leaves complete input bytes unchanged including late affordability', () => {
  for (const v of [...vectors.invalidInputVectors, ...vectors.policyReferenceVectors.filter(v => v.expected.ok === false)]) {
    const q = patch(base(), v.initialPatch), s = api.createCityCommandState(q); if (s.ok === false) continue; const original = clone(s), before = canonical(original);
    assert.equal(api.executeCityCommand(original, v.envelope).ok, false); assert.equal(canonical(original), before);
  }
});
test('M03: all six participant permutations preserve arithmetic and per-person rewards', () => {
  const permutations = [['o1','o2','o3'],['o1','o3','o2'],['o2','o1','o3'],['o2','o3','o1'],['o3','o1','o2'],['o3','o2','o1']];
  for (const type of ['Patrol','Recruit','Produce']) {
    const q = base(); q.officers[0].leadership = 1; q.officers[1].charm = 73; q.officers[2].intelligence = 155; let prior;
    for (const ids of permutations) { const command = { type, cityId: 'cityA', officerIds: ids, ...(type === 'Patrol' ? {} : { facilityId: type === 'Recruit' ? 'b1' : 'f1' }), ...(type === 'Produce' ? { equipmentType: 1 } : {}) }; const r = good(api.executeCityCommand(created(q), { id:'p', expectedRevision:0, command })); assert.deepEqual(r.receipt.calculation.selectedOfficerIds, ids); const got = { city:r.state.city, officers:r.state.officers, corps:r.state.corps }; if (prior) assert.deepEqual(got, prior); prior = got; }
  }
});
test('M04: reservation invariants hold after every lifecycle prefix', () => { for (const v of vectors.lifecycleVectors) runLifecycle(v); });
test('M05: alternate policies change behavior and complete parameters are saved', () => {
  const pairs = [['R05','R12'],['R13','R16'],['R14','R15'],['R23','R18'],['R24','R25'],['R13','R19']];
  for (const ids of pairs) { const rs = ids.map(id => {const v = vectors.policyReferenceVectors.find(x => x.id === id); return api.executeCityCommand(created(patch(base(),v.initialPatch)),v.envelope);}); assert.notEqual(canonical(rs[0]), canonical(rs[1])); }
  const q = base(); q.policies.writer = clone(vectors.policyConfigurations['clip-and-return-request-v1']); q.city.inventory[1].quantity = 9900; const r = good(api.executeCityCommand(created(q),vectors.policyReferenceVectors.find(v => v.id === 'R13').envelope)); assert.equal(r.receipt.calculation.inventoryWrite.returned,4500);assert.equal(r.receipt.calculation.inventoryWrite.actualDelta,100);roundtrip(r.state);
  for (const increment of [0,40]) { const q = base();q.policies.apRecovery=clone(vectors.policyConfigurations[`fixed${increment}-cap255-ap-recovery-v1`]);const r=good(api.executeCityCommand(created(q),{id:'t',expectedRevision:0,command:{type:'AdvanceCityTurn'}}));assert.equal(r.state.corps.actionPoints,200+increment);roundtrip(r.state); }
  const q2=base();q2.city.security=100;q2.policies.morale=clone(vectors.policyConfigurations['weighted-ceil-presecurity-min20-v1']);const r2=good(api.executeCityCommand(created(q2),vectors.policyReferenceVectors.find(v=>v.id==='R05').envelope));assert.equal(r2.state.city.morale,56);
});
test('M06: every full-chain prefix survives canonical save/load and exact replay', () => { const v=vectors.lifecycleVectors.find(v=>v.id==='C09');assert.deepEqual(runLifecycle(v).state,runLifecycle(v,{reloadEvery:true}).state); });
test('M07: corrupt schema, complete policy, catalog, derived jobs, locks and history rejected', () => {
  const v=vectors.lifecycleVectors.find(v=>v.id==='C03'), q=base();let s=created(q);s=good(api.executeCityCommand(s,v.commands[0])).state;
  const raw=JSON.parse(good(api.saveCityCommandState(s)).serialized);
  const edits=[x=>{x.state.schemaVersion=2},x=>{x.state.profile='other'},x=>{x.state.policies.time.id='unknown'},x=>{x.state.policies.time.parameters.nonpositive='reject'},x=>{x.state.catalogDigest='0'.repeat(64)},x=>{x.state.productionJobs[0].dueTurn++},x=>{x.state.productionJobs[0].remainingTurns--},x=>{x.state.productionJobs[0].reservedQuantity=2},x=>{x.state.productionJobs.push(clone(x.state.productionJobs[0]))},x=>{x.state.officers.shift()},x=>{x.state.officers[0].reservationJobId=null},x=>{x.state.facilities[4].reservationJobId=null},x=>{x.state.city.inventory[5].reserved=0},x=>{x.state.appliedCommands[0].envelopeDigest='0'.repeat(64)},x=>{x.state.productionJobs[0].calculation.timeKernelReturn=1},x=>{x.state.productionJobs[0].startSnapshot.officers[0].intelligence=255},x=>{x.state.appliedCommands[0].receipt.fees.gold.actualDelta=0}];
  for(const edit of edits){const x=clone(raw);edit(x);assert.equal(api.loadCityCommandState(JSON.stringify(x)).ok,false);}
  const completed=runLifecycle(v).state, saved=JSON.parse(good(api.saveCityCommandState(completed)).serialized);saved.state.officers[0].reservationJobId='job:start';assert.equal(api.loadCityCommandState(JSON.stringify(saved)).ok,false);
});
test('M08: closed data shapes reject getters, symbols, inherited/sparse data and nonintegers', () => {
  let calls=0;const s=created(base()),e=clone(vectors.policyReferenceVectors[0].envelope);
  const changes=[x=>{Object.defineProperty(x,'command',{enumerable:true,get(){calls++;throw 1}})},x=>{Object.defineProperty(x.command.officerIds,0,{get(){calls++;throw 1}})},x=>{x[Symbol('x')]=1},x=>{x.extra=1},x=>{x.command.quantity=4500},x=>{delete x.command.officerIds[0]},x=>{x.command.officerIds.extra=1},x=>{x.expectedRevision=NaN},x=>{x.expectedRevision=Infinity},x=>{x.expectedRevision=-0},x=>{x.expectedRevision=0.5},x=>{x.expectedRevision='0'},x=>{x.expectedRevision=undefined},x=>{x.command=Object.create(x.command)},x=>{Object.defineProperty(x,'hidden',{value:1})},x=>{x.toJSON=()=>{calls++;return {}}},x=>{x.command=x}];
  for(const change of changes){const x=clone(e);change(x);assert.equal(api.executeCityCommand(s,x).ok,false);assert.equal(api.previewCityCommand(s,x).ok,false);}assert.equal(calls,0);
  const q=base();Object.defineProperty(q.officers[0],'charm',{get(){calls++;throw 1},enumerable:true});assert.equal(api.createCityCommandState(q).ok,false);assert.equal(calls,0);
  const hostile=new Proxy(e,{get(){calls++;throw 1},getPrototypeOf(){calls++;throw 1},ownKeys(){calls++;throw 1},getOwnPropertyDescriptor(){calls++;throw 1}});assert.equal(api.executeCityCommand(s,hostile).ok,false);assert.equal(calls,0);
  const raw=good(api.saveCityCommandState(s)).serialized;for(const x of [raw.replace('"schemaVersion":1','"schemaVersion":1,"schemaVersi\\u006fn":1'),raw.replace('"revision":0','"revision":-0'),raw.replace('"revision":0','"revision":"0"'),'[1,]','null'])assert.equal(api.loadCityCommandState(x).ok,false);
});
test('M09: strict late writer errors and late debit errors discard all staged mutations', () => {
  for(const id of ['R09','R15']){const v=vectors.policyReferenceVectors.find(v=>v.id===id),s=clone(created(patch(base(),v.initialPatch))),before=clone(s);assert.equal(api.executeCityCommand(s,v.envelope).reason,'writer-cap-overflow');assert.deepEqual(s,before);}
  const q=base();q.city.gold=999;const s=clone(created(q)),before=clone(s);assert.equal(api.executeCityCommand(s,vectors.policyReferenceVectors.find(v=>v.id==='R23').envelope).reason,'insufficient-gold');assert.deepEqual(s,before);
});
test('M10: two same-boundary jobs complete together; malformed second job rejected before tick', () => {
  const v=vectors.lifecycleVectors.find(v=>v.id==='C08');const r=runLifecycle(v);assert.equal(r.state.city.inventory[5].quantity,2);assert.equal(r.state.appliedCommands.at(-1).receipt.completions.length,2);
  let s=created(base());for(const e of v.commands.slice(0,3))s=good(api.executeCityCommand(s,e)).state;const x=clone(s);x.productionJobs[1].reservedQuantity=2;const before=clone(x);assert.equal(api.executeCityCommand(x,v.commands[3]).ok,false);assert.deepEqual(x,before);
});
test('M11: legacy byte domains remain separate from service bounds', () => {const q=base();q.city.security=101;assert.equal(api.createCityCommandState(q).ok,false);for(const id of ['L05','L06','L30']){const v=vectors.sourceLiteralVectors.find(v=>v.id===id);const r=api[v.api](v.input);assert.equal(r.supported,true);}});
test('M12: no RNG state or external-task fields are accepted or emitted', () => {
  const q=base();q.rng={seed:123};assert.equal(api.createCityCommandState(q).ok,false);const r=runLifecycle(vectors.lifecycleVectors.find(v=>v.id==='C09'));for(const a of r.state.appliedCommands){assert.equal(a.receipt.rngDraws,0);assert.ok(a.receipt.sideEffectsNotModeled.includes('native-personnel-tasks'));assert.ok(a.receipt.sideEffectsNotModeled.includes('technique-points'));}
});
test('M13: replay stops at first outcome mismatch and never trusts expected final answers', () => {
  const r=runLifecycle(vectors.lifecycleVectors.find(v=>v.id==='C09'));const steps=clone(r.trace);steps[2].expected.receipt.calculation.inventoryWrite.actualDelta++;
  let result=api.replayCityCommands({tag:'san11-city-command-trace-v1',initialScenario:r.scenario,steps,expectedFinalDigest:null});assert.equal(result.ok,false);assert.equal(result.index,2);assert.equal(result.reason,'replay-outcome-mismatch');assert.equal(result.state.revision,2);
  const q=clone(r.scenario);q.officers[0].leadership=0;result=api.replayCityCommands({tag:'san11-city-command-trace-v1',initialScenario:q,steps:r.trace,expectedFinalDigest:null});assert.equal(result.index,0);assert.equal(result.state.revision,0);
});
test('M14: date boundaries and affordability exactness, no completion recharging', () => {
  for(const date of [{year:226,month:2,day:1},{year:226,month:2,day:11},{year:226,month:2,day:21},{year:226,month:12,day:21}]){const q=base();q.date=date;const e={id:'t',expectedRevision:0,command:{type:'AdvanceCityTurn'}},r=good(api.executeCityCommand(created(q),e)),reference=good(runReference(createReference(q),e));assert.deepEqual(r.state.date,reference.state.date);}
  for(const id of ['R35','R36','R37']){const v=vectors.policyReferenceVectors.find(v=>v.id===id);const q=patch(base(),v.initialPatch);assert.equal(api.executeCityCommand(created(q),v.envelope).ok,true);q.city.gold--;assert.equal(api.executeCityCommand(created(q),v.envelope).reason,'insufficient-gold');}
  const r=runLifecycle(vectors.lifecycleVectors.find(v=>v.id==='C03'));for(const a of r.state.appliedCommands.filter(a=>a.envelope.command.type==='AdvanceCityTurn')){assert.equal(a.receipt.fees.gold.requested,0);assert.equal(a.receipt.fees.actionPoints.requested,0);}
  let bounded=created(base());for(let i=0;i<4096;i++){const r=good(api.executeCityCommand(bounded,{id:'bound:'+i,expectedRevision:i,command:{type:'AdvanceCityTurn'}}));bounded=r.state;}assert.equal(bounded.revision,4096);assert.equal(bounded.turn,4096);assert.equal(bounded.corps.actionPoints,255);const last=bounded.appliedCommands.at(-1).envelope;assert.equal(good(api.executeCityCommand(bounded,last)).duplicate,true);assert.equal(api.executeCityCommand(bounded,{id:'overflow',expectedRevision:4096,command:{type:'AdvanceCityTurn'}}).reason,'command-history-full');roundtrip(bounded);
});
test('M15: excluded command families and unsupported producible types reject', () => {
  const s=created(base());for(const type of ['CancelProduction','ForceComplete','ReassignOfficer','Capture','Return','SetOwner','ClearTask','unknown'])assert.equal(api.executeCityCommand(s,{id:'x',expectedRevision:0,command:{type}}).reason,'unsupported-command');
  for(const equipmentType of [0,9,12,-1,'1'])assert.equal(api.executeCityCommand(s,{id:'x',expectedRevision:0,command:{type:'Produce',cityId:'cityA',officerIds:['o1'],facilityId:'f1',equipmentType}}).reason,'unsupported-equipment');
});
