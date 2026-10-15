import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const api = await import(process.env.FOOD_SUPPLY_ENGINE_URL ?? '../src/index.ts');
const fixture = JSON.parse(readFileSync(new URL('./fixtures/food-supply-lifecycle-v1.json', import.meta.url), 'utf8'));
const copy = x => JSON.parse(JSON.stringify(x));
const vector = id => copy(fixture.vectors.find(v => v.id === id));
const sessionVector = id => copy(fixture.sessions.find(v => v.id === id));
const success = r => { assert.equal(r.ok, true, JSON.stringify(r)); return r; };
const create = s => success(api.createFoodSupplySession(s)).session;
const save = s => success(api.saveFoodSupply(s)).json;
const roundtrip = s => success(api.loadFoodSupply(save(s))).session;
function subset(actual, expected, path = '') {
  if (expected && typeof expected === 'object') {
    assert.ok(actual && typeof actual === 'object', path);
    if (Array.isArray(expected)) { assert.ok(Array.isArray(actual)); assert.equal(actual.length, expected.length, path); }
    for (const [key, value] of Object.entries(expected)) subset(actual[key], value, `${path}.${key}`);
  } else assert.deepEqual(actual, expected, path);
}
function deepFrozen(v) { if (v && typeof v === 'object') { assert.ok(Object.isFrozen(v)); for (const x of Object.values(v)) deepFrozen(x); } }
function resources(a) { return { food: a.food, money: a.money, troops: a.troops, ...Object.fromEntries(a.equipment.map((v, i) => [`equipment:${i}`, v])) }; }
function audit(before, after, receipt) {
  const delta = new Map(before.accounts.map(a => [a.id, Object.fromEntries(Object.keys(resources(a)).map(k => [k, 0n]))]));
  assert.deepEqual(after.accounts.map(a => a.id), before.accounts.map(a => a.id));
  assert.deepEqual([...receipt.ledger].sort((a,b) => [a.resource,a.from,a.to].join('\0') < [b.resource,b.from,b.to].join('\0') ? -1 : 1), receipt.ledger);
  for (const l of receipt.ledger) {
    assert.ok(Number.isInteger(l.amount) && l.amount > 0); delta.get(l.from)[l.resource] -= BigInt(l.amount);
    if (receipt.type === 'ManualSupply') delta.get(l.to)[l.resource] += BigInt(l.amount);
    else { assert.equal(l.to, 'food-consumed-sink'); assert.equal(l.resource, 'food'); }
  }
  for (let i = 0; i < before.accounts.length; i++) {
    const a = before.accounts[i], b = after.accounts[i];
    for (const [k,v] of Object.entries(resources(a))) assert.equal(BigInt(resources(b)[k]) - BigInt(v), delta.get(a.id)[k], `${a.id}.${k}`);
    for (const k of ['id','kind','ownerId','classification','equipmentId','capacity']) assert.deepEqual(b[k], a[k]);
    if (receipt.type === 'ConsumeTurn' || a.id !== receipt.targetId) assert.equal(b.morale,a.morale);
  }
}
for (const v of fixture.vectors) test(`literal:${v.id} ${v.purpose}`, () => {
  const input = copy(v.input), original = copy(input), built = api.createFoodSupplySession(input.state);
  const s = built.ok ? built.session : { initialState: input.state, currentState: input.state, entries: [] };
  const snapshot = copy(s), preview = api.previewFoodSupply(s, input.command), r = api.executeFoodSupply(s, input.command);
  assert.equal(r.ok,v.expected.ok); assert.equal(preview.ok,r.ok); assert.deepEqual(input,original); assert.deepEqual(s,snapshot);
  if (!r.ok) { assert.equal(r.reason,v.expected.reason); assert.equal(preview.reason,r.reason); assert.deepEqual(r.ledger,[]); assert.deepEqual(r.entries,[]); if (built.ok) assert.deepEqual(r.state,input.state); return; }
  assert.deepEqual(r.state,v.expected.state); assert.deepEqual(preview.proposedState,r.state); assert.deepEqual(preview.receipt,r.receipt); subset(r.receipt,v.expected.receiptSubset);
  assert.equal(r.session.entries.length,1); assert.equal(s.entries.length,0); assert.deepEqual(r.receipt.effectiveProfile,input.state.profile); assert.deepEqual(r.session.entries[0].command,input.command);
  audit(input.state,r.state,r.receipt); deepFrozen(r); assert.deepEqual(roundtrip(r.session),r.session);
  if(r.receipt.type==='ConsumeTurn') for(const c of r.receipt.consumptions) {
    for (const k of ['normalRaw','fireRaw','combinedRaw']) assert.ok(c[k]===null || /^(0|[1-9][0-9]*)\/[1-9][0-9]*$/.test(c[k]));
    if (c.status==='already-empty-skipped' || c.status==='tuntian-exempt') assert.deepEqual([c.normalRaw,c.fireRaw,c.combinedRaw],[null,null,null]);
  }
});
function scenario(id='J01') {
  const v=sessionVector(id); let s=create(v.input.initialState); const boundaries=[s];
  for(const c of v.input.commands) { const old=copy(s); const p=success(api.previewFoodSupply(s,c)), r=success(api.executeFoodSupply(s,c)); assert.deepEqual(s,old); assert.deepEqual(p.receipt,r.receipt); s=r.session; boundaries.push(s); }
  return {v,s,boundaries};
}
test('session:J01 consume/refill/consume has exact full state, ledger and current availability',()=>{
  const {v,s,boundaries}=scenario(); assert.deepEqual(s.currentState,v.expected.finalState); assert.deepEqual(s.entries.map(e=>e.receipt.ledger),v.expected.ledgerByCommand);
  assert.equal(s.entries.filter(e=>e.command.type==='ConsumeTurn').flatMap(e=>e.receipt.ledger).reduce((n,l)=>n+l.amount,0),275);
  assert.equal(boundaries[1].currentState.accounts[0].food,0); assert.equal(boundaries[1].entries[0].receipt.consumptions[0].shortfall,50);
  assert.equal(boundaries[2].currentState.accounts[0].food,200); assert.equal(boundaries[2].entries[1].receipt.foodAvailabilityAfter.target,'positive');
  assert.equal(s.entries[2].receipt.consumptions[0].status,'consumed'); assert.equal(s.entries[2].receipt.consumptions[0].shortfall,0);
  assert.deepEqual(success(api.replayFoodSupply(v.input.initialState,v.input.commands,v.input.expectedProfile)).session,s);
  for(let i=0;i<boundaries.length;i++) { let loaded=roundtrip(boundaries[i]); for(const c of v.input.commands.slice(i)) loaded=success(api.executeFoodSupply(loaded,c)).session; assert.equal(save(loaded),save(s)); }
});
test('session:J02 duplicate ID takes priority over stale revision, survives save and fails without charge',()=>{
  const {s,v}=scenario(); const restored=roundtrip(s), before=save(restored);
  for(const c of [v.input.commands[0],{...v.input.commands[0],expectedRevision:s.currentState.revision}]) { const r=api.executeFoodSupply(restored,c); assert.equal(r.reason,'duplicate-command'); assert.deepEqual(r.state,s.currentState); assert.deepEqual(r.ledger,[]); assert.equal(save(restored),before); }
});
test('session:J03 roundtrip before final command equals unbroken bytes',()=>{const {s,v,boundaries}=scenario(); const r=success(api.executeFoodSupply(roundtrip(boundaries[2]),v.input.commands[2]));assert.equal(save(r.session),save(s));});
for(const [id,mutate,reason] of [
  ['J04',x=>x.currentState.accounts[0].food++,'replay-mismatch'],
  ['J05',x=>x.entries[0].receipt.ledger[0].amount--,'replay-mismatch'],
  ['J06',x=>{x.initialState.profile.morale='round-nearest-v1';x.currentState.profile.morale='round-nearest-v1'},'unsupported-profile'],
]) test(`session:${id} saved tamper rejection`,()=>{const {s}=scenario();const x=JSON.parse(save(s));mutate(x);assert.equal(api.loadFoodSupply(JSON.stringify(x)).reason,reason);});
test('session:J07 late replay failure returns original, zero committed entries',()=>{const v=sessionVector('J01');v.input.commands[2].contexts[1].politics=101;const r=api.replayFoodSupply(v.input.initialState,v.input.commands,v.input.expectedProfile);assert.equal(r.reason,'invalid-input');assert.deepEqual(r.state,v.input.initialState);assert.deepEqual(r.entries,[]);assert.equal(r.session,null);assert.deepEqual(r.ledger,[]);});
test('session:J08 canonical save stabilizes and retains command IDs',()=>{const {s}=scenario();const a=save(s),b=save(roundtrip(s)),c=save(roundtrip(roundtrip(s)));assert.equal(a,b);assert.equal(b,c);assert.deepEqual(s.entries.map(e=>e.command.commandId),['consume-1','supply-2','consume-3']);});
test('session:J09 legacy save and unknown schema rejected',()=>{assert.equal(api.loadFoodSupply('{"schemaVersion":2}').reason,'unsupported-schema');assert.equal(api.loadFoodSupply('{"schema":"unknown","version":1}').reason,'unsupported-schema');});
test('session:J10 duplicate JSON keys rejected, including escaped spellings',()=>{const {s}=scenario();for(const pair of ['"food":0,"food":','"f\\u006fod":0,"food":'])assert.equal(api.loadFoodSupply(save(s).replace('"food":',pair)).reason,'invalid-json');});
for(const id of ['J11','J12'])test(`session:${id} cross-profile replay rejected before commands`,()=>{const v=sessionVector(id),r=api.replayFoodSupply(v.input.initialState,v.input.commands,v.input.expectedProfile);assert.equal(r.reason,'profile-mismatch');assert.deepEqual(r.state,v.expected.returnedState);assert.deepEqual(r.entries,[]);assert.deepEqual(r.ledger,[]);});
test('session:J13 half-up arithmetic, full profile, canonical save and same-mode replay',()=>{const {v,s}=scenario('J13');assert.deepEqual(s.currentState,v.expected.finalState);assert.equal(s.currentState.accounts[0].morale,1);assert.deepEqual(s.entries[0].receipt.effectiveProfile,v.input.expectedProfile);assert.equal(save(roundtrip(s)),save(s));assert.deepEqual(success(api.replayFoodSupply(v.input.initialState,v.input.commands,v.input.expectedProfile)).session,s);});
test('host:H01 preview deeply frozen, detached and never appends history',()=>{const v=vector('S01'),s=create(v.input.state),old=copy(s),r=success(api.previewFoodSupply(s,v.input.command));deepFrozen(r);assert.throws(()=>r.proposedState.accounts[0].food++,TypeError);assert.throws(()=>r.receipt.accepted.troops++,TypeError);assert.deepEqual(s,old);assert.equal(success(api.executeFoodSupply(s,v.input.command)).session.entries.length,1);});
test('host:H02 late context getter is never invoked and nothing is charged',()=>{const v=vector('A01'),s=create(v.input.state);let calls=0;Object.defineProperty(v.input.command.contexts[1],'politics',{get(){calls++;return 100},enumerable:true});const r=api.executeFoodSupply(s,v.input.command);assert.equal(r.reason,'invalid-input');assert.equal(calls,0);assert.deepEqual(r.state,s.currentState);});
test('host:H03 rejects non-data numbers, cycles, symbols, sparse arrays and prototypes',()=>{
  for(const mutate of [s=>s.accounts[0].food=NaN,s=>s.accounts[0].food=Infinity,s=>s.accounts[0].food=-0,s=>s.accounts[0].food=true,s=>s.accounts[0].equipment.length=14,s=>s.accounts[0].equipment=Array(12),s=>s.loop=s,s=>s[Symbol('x')]=1,s=>Object.setPrototypeOf(s,{})]) {const v=vector('S01');mutate(v.input.state);assert.equal(api.createFoodSupplySession(v.input.state).reason,'invalid-input');}
});
test('host:H04 accepts frozen input without mutating it; returned data is disjoint',()=>{const v=vector('S01');const recursive=x=>{if(x&&typeof x==='object'){Object.values(x).forEach(recursive);Object.freeze(x)}return x};const input=recursive(v.input.state),s=create(input),r=success(api.executeFoodSupply(s,recursive(v.input.command)));assert.deepEqual(input,vector('S01').input.state);assert.notEqual(r.state.accounts[0],input.accounts[0]);deepFrozen(r);});
test('host:H05 edited old preview cannot change recomputed supply',()=>{const v=vector('S01'),s=create(v.input.state),p=copy(success(api.previewFoodSupply(s,v.input.command)));p.receipt.accepted.troops=999999;p.proposedState.accounts[0].troops=999999;const r=success(api.executeFoodSupply(s,v.input.command));assert.equal(r.receipt.accepted.troops,500);assert.deepEqual(r.state,v.expected.state);});
test('host: proxies, revoked proxies and throwing trap payloads never invoke traps or escape',()=>{
  let calls=0;const poison=new Proxy({}, {get(){calls++;throw poison},getPrototypeOf(){calls++;throw poison},ownKeys(){calls++;throw poison},getOwnPropertyDescriptor(){calls++;throw poison}});
  const rev=Proxy.revocable({},{});rev.revoke();const v=vector('S01'),s=create(v.input.state);
  for(const x of [poison,rev.proxy]) {
    for(const run of [()=>api.createFoodSupplySession(x),()=>api.previewFoodSupply(x,v.input.command),()=>api.executeFoodSupply(x,v.input.command),()=>api.previewFoodSupply(s,x),()=>api.executeFoodSupply(s,x),()=>api.saveFoodSupply(x),()=>api.loadFoodSupply(x),()=>api.replayFoodSupply(x,[],v.input.state.profile),()=>api.replayFoodSupply(v.input.state,x,v.input.state.profile),()=>api.replayFoodSupply(v.input.state,[],x)])assert.equal(run().ok,false);
    const nested=vector('S01').input.state;nested.accounts[0].capacity=x;assert.equal(api.createFoodSupplySession(nested).ok,false);
  }
  assert.equal(calls,0);
});
test('host: accessors, nonenumerables and toJSON hooks never run across public boundaries',()=>{
  let calls=0;const v=vector('S01');Object.defineProperty(v.input.state,'toJSON',{get(){calls++;throw 1},enumerable:true});assert.equal(api.createFoodSupplySession(v.input.state).ok,false);
  const s=copy(create(vector('S01').input.state));Object.defineProperty(s.entries,'hook',{value:1});assert.equal(api.saveFoodSupply(s).ok,false);assert.equal(calls,0);
});
test('scope: no extra fields, missing fields, native transitions or automatic variants',()=>{
  const v=vector('S01'),s=create(v.input.state);
  for(const type of ['AutomaticSupply','arrival','return','capture','death','revive','createUnit','starvation','P078'])assert.equal(api.executeFoodSupply(s,{...v.input.command,type}).reason,'unsupported-command');
  for(const key of ['nativeId','officerId','mission','death','location','return','finalizer']) {const x=copy(v.input.state);x.accounts[0][key]='x';assert.equal(api.createFoodSupplySession(x).reason,'invalid-input');const c=copy(v.input.command);c[key]='x';assert.equal(api.executeFoodSupply(s,c).reason,'invalid-input');}
  for(const key of Object.keys(v.input.state)) {const x=copy(v.input.state);delete x[key];assert.equal(api.createFoodSupplySession(x).ok,false);}
});
test('profile: both exact complete profiles required, no callbacks, hot swaps or label-only modes',()=>{
  const v=vector('S17');assert.deepEqual(api.DETACHED_FOOD_SUPPLY_PROFILE,fixture.profiles[0]);assert.deepEqual(api.DETACHED_FOOD_SUPPLY_HALF_UP_PROFILE,fixture.profiles[1]);
  for(const p of fixture.profiles){const s=copy(v.input.state);s.profile=p;assert.equal(success(api.executeFoodSupply(create(s),v.input.command)).state.accounts[0].morale,p.morale==='weighted-floor-v1'?0:1)}
  for(const [key,value] of Object.entries({...fixture.profiles[0],extra:'extra'})) {const s=copy(v.input.state);s.profile[key]=`${value}-unknown`;assert.equal(api.createFoodSupplySession(s).reason,'unsupported-profile');}
  const s=copy(create(v.input.state));s.currentState.profile=copy(fixture.profiles[1]);assert.equal(api.executeFoodSupply(s,v.input.command).reason,'profile-mismatch');
  assert.equal(api.replayFoodSupply(v.input.state,[]).ok,false);
});
test('inventory: all spear/halberd/crossbow/horse slots transfer exactly; all others remain inert',()=>{
  for(let eq=0;eq<12;eq++) {const v=vector('S01'),a=v.input.state.accounts[0],b=v.input.state.accounts[1];a.equipmentId=eq;a.equipment=Array(12).fill(7);b.equipment=Array(12).fill(11);if(eq>=1&&eq<=4){a.equipment[eq]=a.troops;b.equipment[eq]=600}const r=success(api.executeFoodSupply(create(v.input.state),v.input.command));assert.equal(r.receipt.accepted.troops,500);for(let i=0;i<12;i++){assert.equal(r.state.accounts[0].equipment[i],a.equipment[i]+(i===eq&&eq>=1&&eq<=4?500:0));assert.equal(r.state.accounts[1].equipment[i],b.equipment[i]-(i===eq&&eq>=1&&eq<=4?500:0))}audit(v.input.state,r.state,r.receipt)}
});
test('strict: malformed capacities, stocks, IDs and context restrictions',()=>{
  const mutations=[s=>s.accounts=[],s=>s.accounts.push(copy(s.accounts[0])),s=>s.accounts[0].id='bad id',s=>s.accounts[0].id='a'.repeat(129),s=>s.accounts[0].equipmentId=null,s=>s.accounts[1].equipmentId=1,s=>s.accounts[0].capacity.troops=60001,s=>s.accounts[0].capacity.food=49999,s=>s.accounts[1].capacity.money=99999,s=>s.accounts[0].capacity.equipment[1]=9000,s=>s.accounts[0].morale=256,s=>s.accounts[0].troops=-1,s=>s.accounts[0].equipment.push(0),s=>s.accounts[0].capacity.equipment[0]=-1];
  for(const mutate of mutations){const v=vector('S01');mutate(v.input.state);assert.equal(api.createFoodSupplySession(v.input.state).ok,false)}
  for(const mutate of [c=>c.contexts[0].politics=null,c=>c.contexts[0].hasTuntian=1,c=>c.contexts[0].onFire=0,c=>c.contexts[0].accountId='unknown',c=>c.contexts[0].coverage.selectedId='unknown']){const v=vector('F01');mutate(v.input.command);assert.equal(api.executeFoodSupply(create(v.input.state),v.input.command).reason,'invalid-input')}
  const v=vector('F29');v.input.command.contexts[0].coverage={candidates:[{id:'a',type:'camp',ownerId:'F1'}],selectedId:'a'};assert.equal(api.executeFoodSupply(create(v.input.state),v.input.command).reason,'invalid-input');
});
test('canonical: sorts account/context/candidate IDs by ASCII and disallows sink account alias',()=>{
  const v=sessionVector('J01');v.input.initialState.accounts.reverse();v.input.commands[0].contexts.reverse();const s=create(v.input.initialState);assert.deepEqual(s.currentState.accounts.map(a=>a.id),['C','T']);assert.deepEqual(success(api.executeFoodSupply(s,v.input.commands[0])).receipt.consumptions.map(a=>a.accountId),['C','T']);
  const f=vector('F07');f.input.command.contexts[0].coverage.candidates.reverse();assert.equal(success(api.executeFoodSupply(create(f.input.state),f.input.command)).receipt.consumptions[0].requestCost,833);
  const x=vector('F01').input.state;x.accounts[0].id='food-consumed-sink';assert.equal(api.createFoodSupplySession(x).reason,'invalid-input');
  const y=vector('F01').input.state;y.accounts[0].id='constructor';assert.equal(create(y).currentState.accounts[0].id,'constructor');
});
test('command history: failed IDs remain reusable, structural validation precedes duplicate detection',()=>{
  const v=vector('S01'),s=create(v.input.state),bad=copy(v.input.command);bad.requested.food=-1;assert.equal(api.executeFoodSupply(s,bad).reason,'invalid-input');const next=success(api.executeFoodSupply(s,v.input.command)).session;
  assert.equal(api.executeFoodSupply(next,bad).reason,'invalid-input');assert.equal(api.executeFoodSupply(next,v.input.command).reason,'duplicate-command');assert.equal(next.entries.length,1);
});
test('load: altered commands/receipt profiles/turn/extra entries all fail; JSON grammar remains strict',()=>{
  const {s}=scenario();for(const mutate of [x=>x.entries[1].command.requested.food++,x=>x.entries[1].receipt.effectiveProfile.id='other',x=>x.currentState.turn++,x=>x.entries.push(copy(x.entries[0])),x=>x.entries[1].receipt.extra=1,x=>x.entries[0].command.contexts[1].politics=101]) {const x=JSON.parse(save(s));mutate(x);assert.equal(api.loadFoodSupply(JSON.stringify(x)).ok,false)}
  for(const text of ['','{} trailing','{"a":1,}','[1,]','{"a":01}','{"a":NaN}','{"a":"\n"}','{"a":"\\x20"}','{"a":1,"\\u0061":2}'])assert.equal(api.loadFoodSupply(text).reason,'invalid-json');
});
test('bounds: 4096 accounts valid, next count/depth/bytes invalid, history cap shared by preview/execute',()=>{
  const base=vector('F01').input.state;base.accounts=Array.from({length:4096},(_,i)=>({...copy(base.accounts[0]),id:`a${String(i).padStart(4,'0')}`}));const s=create(base);assert.equal(s.currentState.accounts.length,4096);
  const command={type:'ConsumeTurn',commandId:'all',expectedRevision:0,turn:1,contexts:base.accounts.map(a=>({accountId:a.id,onFire:false,politics:100,hasTuntian:false,coverage:{candidates:[],selectedId:null}}))};const all=success(api.executeFoodSupply(s,command));assert.equal(all.receipt.consumptions.length,4096);assert.equal(all.receipt.ledger.length,4096);assert.equal(save(all.session),save(roundtrip(all.session)));
  base.accounts.push({...copy(base.accounts[0]),id:'overflow'});assert.equal(api.createFoodSupplySession(base).ok,false);
  let deep={};for(let i=0;i<65;i++)deep={next:deep};assert.equal(api.createFoodSupplySession(deep).ok,false);assert.equal(api.loadFoodSupply(' '.repeat(16*1024*1024+1)).reason,'invalid-json');
  const v=vector('S16'),commands=Array.from({length:4096},(_,i)=>({...v.input.command,commandId:`s${i}`,expectedRevision:i}));const full=success(api.replayFoodSupply(v.input.state,commands,v.input.state.profile)).session;
  const next={...v.input.command,commandId:'next',expectedRevision:4096};assert.equal(api.previewFoodSupply(full,next).reason,'out-of-range');assert.equal(api.executeFoodSupply(full,next).reason,'out-of-range');assert.equal(api.executeFoodSupply(full,commands[0]).reason,'duplicate-command');
  assert.equal(api.replayFoodSupply(v.input.state,[...commands,next],v.input.state.profile).ok,false);
});
test('bounds: turn overflow and whole-context validation apply even with empty food',()=>{
  const v=vector('F16');v.input.state.turn=2147483647;v.input.command.turn=2147483647;assert.equal(api.executeFoodSupply(create(v.input.state),v.input.command).reason,'out-of-range');v.input.command.contexts[0].politics=101;assert.equal(api.executeFoodSupply(create(v.input.state),v.input.command).reason,'invalid-input');
});
