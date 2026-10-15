import test from 'node:test';
import assert from 'node:assert/strict';
import {projectSuppliedTerrainCost as project, moveOnSuppliedMap as move, GUIDE_REFERENCE_MOVEMENT_POLICY as guide} from '../src/supplied-map-movement.ts';
const clone = x => JSON.parse(JSON.stringify(x));
const projection = (b=5,t=0,f=0) => ({profile:'captured-terrain-al-v1',terrainInfoU32:t,flagsU32:f,resolvedEquipmentId:4,row:{equipmentId:4,bytes:Array(32).fill(b)}});
const cell = (id,t,adjacent) => ({id,terrainInfoU32:t,flagsU32:0,adjacent,blocked:false,occupied:false,unsupportedContext:false,facilityPresent:false});
const fixture = () => ({version:1,map:{id:'finite-map',cells:[cell('a',0,['b']),cell('b',1,['a','c']),cell('c',7,['b'])]},state:{unitId:'unit',cellId:'a',budget:30,landEquipmentId:4,navalEquipmentId:9,transport:false},path:['b','c'],policy:clone(guide)});
function frozen(x) { if (x && typeof x==='object') { assert(Object.isFrozen(x)); Object.values(x).forEach(frozen); } }
test('independent arithmetic: all 256 bytes, 32 terrain bits, masks, and unsigned boundaries',()=>{
  for(let b=0;b<256;b++) for(let t=0;t<32;t++) for(const f of [0,1,0x80000000,0x00800000,0x01000000,0x02000000,0x03800000,0xffffffff]) {
    const r=project(projection(b,t+0xffffffe0,f)); assert.equal(r.ok,true);
    const fire = Math.floor(f / 2**23)%8 !== 0;
    assert.equal(r.receipt.costAL,fire ? (b*4)%256 : b);
    assert.equal(r.receipt.terrainId,t); assert.equal(r.receipt.helper,[7,8].includes(t)?'naval':'land'); assert.equal(r.receipt.tableIndex,128+t);
  }
});
test('projection strict shape and numeric guards, mismatch and dense own arrays',()=>{
 for(const v of [-1,-0,NaN,Infinity,0x100000000,1.5,'1',null,undefined]) for(const k of ['flagsU32','terrainInfoU32']) {const r=projection();r[k]=v;assert.equal(project(r).ok,false);}
 for(const v of [-1,65536,1.5,'4']) {const r=projection();r.resolvedEquipmentId=v;assert.equal(project(r).ok,false);}
 for(const v of [-1,256,1.5,'5',null]) {const r=projection();r.row.bytes[0]=v;assert.equal(project(r).ok,false);}
 for(const change of [r=>r.row.equipmentId++,r=>r.extra=1,r=>r.row.bytes.pop(),r=>delete r.row.bytes[0],r=>r.row.bytes.extra=0,r=>r.profile='other']) {const r=projection();change(r);assert.equal(project(r).ok,false);}
 let calls=0; const r=projection();Object.defineProperty(r,'flagsU32',{get(){calls++;return 0;}});assert.equal(project(r).ok,false);assert.equal(calls,0);
 const a=projection();Object.defineProperty(a.row.bytes,'0',{get(){calls++;return 5;}});assert.equal(project(a).ok,false);assert.equal(calls,0);
 const inherited=projection();Object.setPrototypeOf(inherited.row.bytes,{0:5});delete inherited.row.bytes[0];assert.equal(project(inherited).ok,false);
});
test('actual detached immutable transitions, full receipts, JSON replay and composition',()=>{
 const q=fixture(),before=clone(q),r=move(q);assert.equal(r.ok,true);assert.equal(r.state.cellId,'c');assert.equal(r.state.budget,22);assert.equal(r.spent,8);assert.equal(r.steps.length,2);assert.equal(r.steps[0].from,'a');assert.equal(r.steps[0].to,'b');assert.equal(r.steps[1].from,'b');assert.equal(r.steps[1].to,'c');assert.equal(r.steps[0].budgetBefore,30);assert.equal(r.steps[1].budgetAfter,22);assert.deepEqual(q,before);frozen(r);
 assert.notEqual(r.request.map,q.map);assert.notEqual(r.state,q.state);q.map.cells[1].terrainInfoU32=5;assert.equal(r.request.map.cells[1].terrainInfoU32,1);
 assert.deepEqual(move(clone(r.request)),r);
 const first=fixture();first.path=['b'];const a=move(first);const second=fixture();second.state=clone(a.state);second.path=['c'];const b=move(second);assert.deepEqual(b.state,r.state);assert.equal(a.spent+b.spent,r.spent);
 const no=fixture();no.path=[];const n=move(no);assert.equal(n.ok,true);assert.deepEqual(n.state,no.state);assert.equal(n.spent,0);
 const loop=fixture();loop.path=['b','a','b'];const l=move(loop);assert.equal(l.spent,13);assert.equal(l.state.cellId,'b');
});
test('late failures are atomic and leave input and returned original state intact',()=>{
 const cases=[['missing-cell',q=>q.path[1]='absent'],['nonadjacent',q=>q.map.cells[1].adjacent=['a']],['blocked',q=>q.map.cells[2].blocked=true],['occupied',q=>q.map.cells[2].occupied=true],['unsupported-context',q=>q.map.cells[2].unsupportedContext=true],['unknown-cost',q=>q.policy.rows=q.policy.rows.filter(r=>r.equipmentId!==9)],['insufficient-budget',q=>q.state.budget=7]];
 for(const [reason,change] of cases){const q=fixture();change(q);const before=clone(q),r=move(q);assert.equal(r.ok,false);assert.equal(r.reason,reason);assert.equal(r.failedStep,1);assert.deepEqual(r.state,q.state);assert.deepEqual(r.steps,[]);assert.equal(r.spent,0);assert.deepEqual(q,before);frozen(r);assert.notEqual(r.state,q.state);}
 const q=fixture();q.state.budget=8;assert.equal(move(q).state.budget,0);q.state.budget=3;assert.equal(move(q).failedStep,0);
 const start=fixture();start.map.cells[0].unsupportedContext=true;assert.equal(move(start).failedStep,null);
});
test('reference table independently specified across all named terrains and equipment categories',()=>{
 const expected={0:[5,5,5,8,12,6,null,null,null,6,4,6,4,5,null,null,4,4,4,6],1:[5,5,5,8,12,6,null,null,null,6,4,6,4,5,null,null,4,4,4,6],4:[5,4,5,8,12,10,null,null,null,7,4,7,4,5,null,null,4,4,4,10],5:[6,5,6,8,12,8,null,null,null,7,4,6,4,5,null,null,4,4,4,10]};
 for(let e=0;e<12;e++)for(let t=0;t<32;t++){
  const q=fixture();q.path=['b'];q.state.landEquipmentId=e;q.state.navalEquipmentId=e;q.map.cells[1].terrainInfoU32=t;
  const want=e>=9?([7,8].includes(t)?4:null):(expected[e]??expected[e<4?1:5])[t]??null;
  const r=move(q);assert.equal(r.ok,want!==null,`e${e} t${t}`);if(r.ok)assert.equal(r.spent,want);
 }
 const q=fixture();q.state.transport=true;const r=move(q);assert.equal(r.spent,9);assert.equal(r.steps[0].cost.equipmentId,0);assert.equal(r.steps[1].cost.equipmentId,9);
 q.map.cells[1].facilityPresent=true;assert.equal(move(q).spent,9);
 q.map.cells[1].flagsU32=0x00800000;assert.equal(move(q).spent,24);
});
test('custom data policy, zero/wrapped bytes and unknown entry rejection',()=>{
 for(const b of [0,63,64,255]){const q=fixture();q.path=['b'];q.state.budget=255;q.map.cells[1].flagsU32=0x00800000;q.policy.id='custom';q.policy.rows.find(r=>r.equipmentId===4).costs[1]=b;assert.equal(move(q).spent,(b*4)%256);}
 const q=fixture();q.policy.rows.find(r=>r.equipmentId===4).costs[1]=null;assert.equal(move(q).reason,'unknown-cost');
});
test('whole request validation includes unused cells, rows, edges, path and policies',()=>{
 const cases=[q=>q.version=2,q=>q.extra=1,q=>q.policy.effects='simulate-damage',q=>q.policy.version=2,q=>q.policy.id='',q=>q.policy.cost='unknown',q=>q.policy.adjacency='hex',q=>q.policy.helper='native',q=>q.policy.hazards='ignore',q=>q.policy.rows[0].costs[31]=256,q=>q.policy.rows.push(q.policy.rows[0]),q=>q.map.cells.push(q.map.cells[0]),q=>q.map.cells[0].adjacent.push('absent'),q=>q.map.cells[0].adjacent.push('b'),q=>q.state.cellId='absent',q=>q.state.budget=-1,q=>q.state.transport=1,q=>q.map.cells[2].occupied=0,q=>q.path.push(2),q=>delete q.path[0],q=>q.policy.rows[0].costs.length=31,q=>q.state.landEquipmentId=65536,q=>q.map.cells[2].flagsU32=0x100000000];
 for(const change of cases){const q=fixture();change(q);assert.deepEqual(move(q),{ok:false,reason:'invalid-input'});}
 let calls=0;const q=fixture();Object.defineProperty(q.map.cells[2],'blocked',{get(){calls++;return false;}});assert.equal(move(q).reason,'invalid-input');assert.equal(calls,0);
 const cycle=fixture();cycle.map.cells[0].adjacent=cycle;assert.equal(move(cycle).reason,'invalid-input');
 const sym=fixture();sym[Symbol('hidden')]=1;assert.equal(move(sym).reason,'invalid-input');
 const hidden=fixture();Object.defineProperty(hidden,'hidden',{value:1});assert.equal(move(hidden).reason,'invalid-input');
});
test('independent deterministic walker over multiple directed finite supplied maps',()=>{
 for(let seed=0;seed<40;seed++){
  const q=fixture();q.map.cells=Array.from({length:8},(_,i)=>cell('n'+i,i%6,['n'+((i+1)%8)]));q.state.cellId='n0';q.state.budget=seed*7;q.path=Array.from({length:seed%15},(_,i)=>'n'+((i+1)%8));
  const costs=[5,4,5,8,12,10];let left=q.state.budget,pos='n0',failed=null;
  for(let i=0;i<q.path.length;i++){const n=(i+1)%8,c=costs[n%6];if(c>left){failed=i;break;}left-=c;pos='n'+n;}
  const r=move(q);assert.equal(r.ok,failed===null);if(r.ok){assert.equal(r.state.cellId,pos);assert.equal(r.state.budget,left);}else{assert.equal(r.failedStep,failed);assert.deepEqual(r.state,q.state);}
 }
});
