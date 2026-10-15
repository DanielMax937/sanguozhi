import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const api = await import(process.env.HAZARD_ENGINE_URL ?? '../src/index.ts');
const fixture = JSON.parse(readFileSync(new URL('./fixtures/terrain-hazard-v1.json', import.meta.url), 'utf8'));
const copy = x => JSON.parse(JSON.stringify(x));
const set = (x, path, value) => { const keys = path.split('.'); const last = keys.pop(); for (const key of keys) x = x[key]; x[last] = copy(value); };
const get = (x, path) => path.split('.').reduce((a, k) => a[k], x);
function make(overrides = {}) { const s = copy(fixture.baseState); for (const [p, v] of Object.entries(overrides)) set(s, p, v); return s; }
const run = (s, type, fields = {}) => api.executeHazardCommand(s, { type, expectedRevision: s.revision, ...fields });
function atomic(r, s, reason) { assert.equal(r.ok, false); assert.equal(r.reason, reason); assert.deepEqual(r.after, s); assert.deepEqual(r.before, s); assert.deepEqual(r.effects, []); assert.equal(r.rngAfter, s.rng.cursor); }
for (const vector of fixture.vectors) test(`literal:${vector.id}`, () => {
  const s = make(vector.stateOverrides), original = copy(s), c = copy(vector.command), r = api.executeHazardCommand(s, c);
  assert.deepEqual(api.previewHazardCommand(s, c), r); assert.deepEqual(s, original); assert.deepEqual(c, vector.command);
  for (const [key, expected] of Object.entries(vector.expected)) {
    const actual = key === 'afterEqualsBefore' ? assert.deepEqual(r.after, r.before) : key === 'entryDamage' ? r.effects.filter(e => e.type === 'entry').map(e => e.actualDamage) : key === 'orderedEffectTypes' ? r.effects.map(e => e.type) : key === 'recoveryStep' ? r.effects.find(e => e.type === 'statusCounted').step : get(r, key);
    if (key !== 'afterEqualsBefore') assert.deepEqual(actual, expected, `${vector.id}:${key}`);
  }
  assert.equal(r.after.revision, s.revision + (r.ok ? 1 : 0));
});
function scenario() {
  const initial = make(fixture.scenario.initialOverrides); let current = initial; const receipts = [];
  for (const command of fixture.scenario.commands) { const r = api.executeHazardCommand(current, command); assert.equal(r.ok, true); receipts.push(r); current = r.after; }
  return { schema: 'san11-detached-hazard-trace-v1', initial, policySnapshot: initial.policy, commands: copy(fixture.scenario.commands), receipts, finalState: current };
}
test('scenario: multi-turn state, ordered effects, save/load and replay', () => {
  const trace = scenario(); for (const [p, v] of Object.entries(fixture.scenario.expectedFinal)) assert.deepEqual(get(trace.finalState, p), v);
  assert.deepEqual(trace.receipts[4].effects.map(e => e.type), ['actionConsumed', 'statusCounted', 'fireCounted']);
  assert.deepEqual(trace.receipts[6].effects.map(e => e.type), ['actionConsumed', 'statusCounted', 'statusCleared', 'fireCounted', 'fireExtinguished']);
  const saved = api.saveHazardState(trace.finalState); assert.equal(saved.ok, true); assert.deepEqual(api.loadHazardState(saved.json), {ok:true,state:trace.finalState});
  assert.deepEqual(api.replayHazardTrace(copy(trace)), {ok:true,state:trace.finalState,receipts:trace.receipts});
  atomic(run(trace.finalState, 'applyStatus', {kind:'confused',critical:false}),trace.finalState,'rng-exhausted');
});
test('replay-tampered: supplied after/effects/commands/final/policy never authoritative', () => {
  for (const mutate of [t=>t.receipts[0].after.unit.troops++,t=>t.receipts[0].effects[0].actualDamage++,t=>t.commands[0].path.reverse(),t=>t.finalState.unit.energy--,t=>t.policySnapshot.id='replacement',t=>t.policySnapshot.statusInitial.threshold=50,t=>t.receipts[0].policySnapshot.id='replacement']) {
    const t=copy(scenario()); mutate(t); assert.equal(api.replayHazardTrace(t).ok,false);
  }
  const t=copy(scenario()); t.initial.policy.id=t.policySnapshot.id=t.finalState.policy.id='custom'; t.policySnapshot.statusInitial.threshold=50; assert.equal(api.replayHazardTrace(t).ok,false);
});
test('detached-mutation: caller writable, result deeply frozen and disjoint', () => {
  const s=make({'rng.draws':[{bound:200,value:0}]}), c={type:'enterCells',expectedRevision:0,path:['P']}; const r=api.executeHazardCommand(s,c); assert.equal(r.ok,true);
  assert.equal(Object.isFrozen(s),false); assert.equal(Object.isFrozen(s.unit),false); assert.equal(Object.isFrozen(c.path),false);
  s.unit.troops=1; c.path[0]='Q'; s.policy.statusInitial.threshold=1; assert.equal(r.before.unit.troops,2000); assert.equal(r.command.path[0],'P'); assert.equal(r.policySnapshot.statusInitial.threshold,70);
  for (const v of [r,r.before,r.after,r.after.unit,r.after.rng.draws,r.effects,r.effects[0],r.policySnapshot.lifetimeBySource.strategy.weights]) assert.equal(Object.isFrozen(v),true);
  assert.throws(()=>r.after.unit.troops=4,TypeError); assert.throws(()=>r.effects.push({}),TypeError);
  const created=api.createHazardState(make()); assert.equal(created.ok,true); assert.equal(Object.isFrozen(created.state.map.cells[0].adjacent),true);
});
test('whole/segmented paths preserve domain; different committed transactions do not roll back',()=>{
  const s=make({'rng.draws':[{bound:200,value:0},{bound:200,value:199}]});
  const whole=run(s,'enterCells',{path:['P','Q']}), first=run(s,'enterCells',{path:['P']}), second=run(first.after,'enterCells',{path:['Q']});
  const a=copy(whole.after),b=copy(second.after); delete a.revision;delete b.revision;assert.deepEqual(a,b);
  assert.deepEqual(whole.effects.map(({index,...e})=>e),[...first.effects,...second.effects].map(({index,...e})=>e));
  s.unit.troops=499; const failed=run(s,'enterCells',{path:['P','Q']}); atomic(failed,s,'unsupported-lethal-damage');
  const committed=run(s,'enterCells',{path:['P']}); const late=run(committed.after,'enterCells',{path:['Q']}); atomic(late,committed.after,'unsupported-lethal-damage'); assert.equal(late.after.unit.troops,399);
});
test('policy: source-specific replacement, threshold and fixed profiles are actually used',()=>{
  for (const source of ['strategy','fire-arrow','fire-trap','lightning']) {
    const s=make({'policy.id':`replacement-${source}`,'rng.draws':[{bound:100,value:99}]}); s.policy.lifetimeBySource[source].weights=[{turns:3,weight:100}];
    assert.equal(run(s,'igniteCell',{cellId:'F',source,critical:true}).after.fires[0].remaining,4);
    const other=source==='strategy'?'fire-arrow':'strategy'; assert.equal(run(s,'igniteCell',{cellId:'F',source:other,critical:true}).after.fires[0].remaining,3);
  }
  const s=make({'policy.id':'fixed-254','policy.lifetimeBySource.scripted-event.turns':254}); assert.equal(run(s,'igniteCell',{cellId:'F',source:'scripted-event',critical:true}).after.fires[0].remaining,255);
  const t=make({'policy.id':'threshold-one','policy.statusInitial.threshold':1,'rng.draws':[{bound:100,value:1}]});assert.equal(run(t,'applyStatus',{kind:'confused',critical:false}).after.unit.remaining,2);
  const r=make({'unit.status':'confused','unit.remaining':255,'rng.draws':[{bound:100,value:99}]});assert.equal(run(r,'applyStatus',{kind:'confused',critical:true}).after.unit.remaining,255);
});
test('atomic semantic boundaries and phase/overflow checks',()=>{
  for(const [overrides,type,args,reason] of [
    [{},'enterCells',{path:[]},'empty-path'],[{},'enterCells',{path:['A']},'nonadjacent'],[{},'enterCells',{path:['X']},'missing-cell'],
    [{'unit.acted':true},'enterCells',{path:['P']},'unit-unavailable'],[{'unit.status':'confused','unit.remaining':1},'enterCells',{path:['P']},'unit-unavailable'],
    [{'unit.status':'confused','unit.remaining':1},'applyStatus',{kind:'false-report',critical:false},'unsupported-status-replacement'],
    [{},'calm',{critical:true},'unsupported-calm-area'],[{},'beginTurn',{},'out-of-phase'],[{'phase':'resolved'},'resolveTurn',{},'out-of-phase'],
    [{'revision':4294967295},'calm',{critical:false},'revision-overflow'],[{'phase':'resolved','turn':4294967295},'beginTurn',{},'turn-overflow'],
    [{'map.cells.4.unsupportedContext':true,'rng.draws':[{bound:200,value:0}]},'enterCells',{path:['P','Q']},'unsupported-context'],
    [{'map.cells.4.blocked':true,'rng.draws':[{bound:200,value:0}]},'enterCells',{path:['P','Q']},'blocked'],
    [{'rng.draws':[{bound:200,value:0}]},'enterCells',{path:['P','Q']},'rng-exhausted'],
    [{'rng.draws':[{bound:200,value:0},{bound:100,value:0}]},'enterCells',{path:['P','Q']},'rng-bound-mismatch'],
  ]){const s=make(overrides);atomic(run(s,type,args),s,reason);}
  const s=make(); atomic(api.executeHazardCommand(s,{type:'calm',critical:false,expectedRevision:1}),s,'stale-revision');
  const normal=make({'unit.acted':true});assert.equal(run(normal,'resolveTurn').after.unit.acted,true);
  const self=make();self.map.cells[0].adjacent.push('A');assert.equal(run(self,'enterCells',{path:['A']}).ok,true);
});
test('aura qualification and ASCII fire effect order, without stacking',()=>{
  const s=make({'unit.status':'confused','unit.remaining':3,'auras':[
    {id:'z',facilityTier:3,eligible:true,coveredCells:['A']},{id:'A',facilityTier:3,eligible:true,coveredCells:['A']},
    {id:'off',facilityTier:3,eligible:false,coveredCells:['A']},{id:'tier',facilityTier:4,eligible:true,coveredCells:['A']}],
    'fires':[{cellId:'F',source:'strategy',remaining:1},{cellId:'N',source:'lightning',remaining:2}]});
  const r=run(s,'resolveTurn');assert.deepEqual(r.effects[1].auraIds,['A','z']);assert.equal(r.effects[1].step,2);assert.deepEqual(r.effects.slice(2).map(e=>[e.type,e.cellId]),[['fireCounted','F'],['fireExtinguished','F'],['fireCounted','N']]);
  s.defenseTier=5;assert.equal(run(s,'resolveTurn').after.unit.remaining,2);
});
test('strict schema: malformed nested state/policy and command rejected at every public boundary',()=>{
  const invalids=[
    s=>s.unit.remaining=1,s=>s.unit.status='confused',s=>s.unit.troops=0,s=>s.unit.energy=256,s=>s.unit.cellId='X',s=>s.map.cells[0].blocked=true,
    s=>s.map.cells.push(copy(s.map.cells[0])),s=>s.map.cells.reverse(),s=>s.map.cells[0].adjacent.push('X'),s=>s.map.cells[0].adjacent.push('P'),s=>s.unit.extra=1,
    s=>s.map.cells[0].terrainInfoU32=-0,s=>s.unit.troops=NaN,s=>s.unit.troops=Infinity,s=>s.revision=1.5,s=>s.rng.draws=[{bound:100,value:100}],s=>s.rng.cursor=1,
    s=>s.policy.version=2,s=>s.policy.naturalSpread=true,s=>s.policy.id='bad id',s=>s.policy.statusInitial.threshold=50,
    s=>{s.policy.id='new';s.policy.statusInitial.threshold=0},s=>{s.policy.id='new';s.policy.lifetimeBySource.strategy.weights=[{turns:255,weight:100}]},
    s=>{s.policy.id='new';s.policy.lifetimeBySource.strategy.criticalBonus=2},s=>{s.policy.id='new';s.policy.lifetimeBySource.strategy.weights=[{turns:2,weight:20},{turns:1,weight:80}]},
    s=>{s.policy.id='new';s.policy.lifetimeBySource.strategy.weights=[{turns:1,weight:99}]},s=>s.fires=[{cellId:'F',source:'strategy',remaining:0}],
    s=>s.auras=[{id:'a',facilityTier:3,eligible:true,coveredCells:['X']}],s=>s.map.cells[0].adjacent.length=4,
  ];
  for(const mutate of invalids){const s=make();mutate(s);for(const result of [api.createHazardState(s),api.saveHazardState(s),run(s,'resolveTurn'),api.previewHazardCommand(s,{type:'resolveTurn',expectedRevision:0})])assert.deepEqual(result,{ok:false,reason:'invalid-input'});}
  for(const c of [{type:'resolveTurn',expectedRevision:0,extra:1},{type:'applyStatus',expectedRevision:0,kind:'confused',critical:false,duration:9},{type:'enterCells',expectedRevision:0,path:['P'],damage:1},{type:'calm',expectedRevision:0,critical:0}])assert.deepEqual(api.executeHazardCommand(make(),c),{ok:false,reason:'invalid-input'});
  assert.deepEqual(api.loadHazardState('{bad'),{ok:false,reason:'invalid-input'});assert.deepEqual(api.loadHazardState('{}'),{ok:false,reason:'invalid-input'});
  const occupied=make({'fires':[{cellId:'A',source:'strategy',remaining:1}]});assert.deepEqual(api.createHazardState(occupied),{ok:false,reason:'unsupported-fire-damage'});
});
test('hostile inputs: getters, proxies, cycles, functions, symbols, prototypes and bytes',()=>{
  let calls=0;const getter=make();Object.defineProperty(getter.unit,'troops',{get(){calls++;throw Error('unsafe')},enumerable:true});assert.deepEqual(run(getter,'resolveTurn'),{ok:false,reason:'invalid-input'});assert.equal(calls,0);
  const proxy=new Proxy(make(),{getPrototypeOf(){calls++;throw Error('unsafe')},ownKeys(){calls++;throw Error('unsafe')}});assert.deepEqual(api.createHazardState(proxy),{ok:false,reason:'invalid-input'});assert.equal(calls,0);
  const revoked=Proxy.revocable({},{});revoked.revoke();assert.deepEqual(api.createHazardState(revoked.proxy),{ok:false,reason:'invalid-input'});
  const cycle=make();cycle.extra=cycle;const symbol=make();symbol[Symbol('x')]=1;const proto=make();Object.setPrototypeOf(proto.unit,{x:1});const fn=make();fn.extra=()=>{calls++};const hidden=make();Object.defineProperty(hidden,'hidden',{value:1});
  for(const s of [cycle,symbol,proto,fn,hidden])assert.deepEqual(api.createHazardState(s),{ok:false,reason:'invalid-input'});
  assert.equal(calls,0);assert.deepEqual(api.loadHazardState(' '.repeat(1048577)),{ok:false,reason:'invalid-input'});
  const huge=make();huge.extra='x'.repeat(1048577);assert.deepEqual(api.createHazardState(huge),{ok:false,reason:'invalid-input'});
  const nullProto=make();Object.setPrototypeOf(nullProto.unit,null);assert.equal(api.createHazardState(nullProto).ok,true);
});
test('finite collection limits and future draws are validated',()=>{
  const s=make();s.rng.draws=Array.from({length:4096},()=>({bound:2,value:1}));assert.equal(api.createHazardState(s).ok,true);s.rng.draws.push({bound:2,value:0});assert.equal(api.createHazardState(s).ok,false);
  const q=make();q.map.cells[0].adjacent.push('A');assert.equal(run(q,'enterCells',{path:Array(4096).fill('A')}).ok,true);assert.deepEqual(run(q,'enterCells',{path:Array(4097).fill('A')}),{ok:false,reason:'invalid-input'});
  const a=make();a.auras=Array.from({length:256},(_,i)=>({id:`a${i}`,facilityTier:3,eligible:false,coveredCells:[]}));assert.equal(api.createHazardState(a).ok,true);a.auras.push({id:'extra',facilityTier:3,eligible:false,coveredCells:[]});assert.equal(api.createHazardState(a).ok,false);
});
