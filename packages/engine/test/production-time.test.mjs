import test from 'node:test';
import assert from 'node:assert/strict';
import {PRODUCTION_TIME, calculateProductionTimeProjection as calc} from '../src/index.ts';
import {calculateProductionTimeProjection as direct} from '../src/production-time.ts';
const profile='production-time-observations-v1';
const call=(callAddress,eax,slotIndex)=>({callAddress,...(slotIndex===undefined?{}:{slotIndex}),eax});
function request(type=5, values=[100,100,100], skills=[0,0,0], valid=[1,1,1], ship=[0]) {
 const captures=[];
 if(type>=5 && type<=11 && type!==9) for(let i=0;i<3;i++) {
  captures.push(call('005C6CF8',valid[i],i));
  if(valid[i]!==0) captures.push(call('005C6D06',values[i],i),call('005C6D25',skills[i],i));
 }
 if(type>=9 && type<=11) {
  captures.push(call('005C6D90',ship[0]));
  if(ship[0]!==0) {
   captures.push(call('005C6DAA',ship[1]),call('005C6DB0',ship[2]));
   if(ship[2]!==0) captures.push(call('005C6DCA',ship[3]),call('005C6DD1',ship[4]),call('005C6DDE',ship[5]));
  }
 }
 return {profile,nativeEquipmentType:type,captures};
}
const freezeCheck=v=>{if(v!==null&&typeof v==='object'){assert.ok(Object.isFrozen(v));for(const x of Object.values(v))freezeCheck(x);}};
test('production time exports isolated frozen listing evidence',()=>{
 assert.strictEqual(calc,direct); assert.equal(PRODUCTION_TIME.profileId,profile);
 assert.equal(PRODUCTION_TIME.originalListing.instructionCount,138);
 assert.equal(PRODUCTION_TIME.originalListing.byteLength,404);
 assert.equal(PRODUCTION_TIME.originalListing.calls.length,9);
 assert.equal(PRODUCTION_TIME.evidence.originalExecutableExecuted,false);
 assert.equal(PRODUCTION_TIME.evidence.stockOriginalVerified,false); freezeCheck(PRODUCTION_TIME);
});
test('signed32 type gates and all seven jump-table routes',()=>{
 for(const type of [-2147483648,-1,0,1,2,3,4,12,2147483647]) {
  const r=calc(request(type));assert.equal(r.supported,true);assert.equal(r.returnedValue,0);assert.equal(r.rawEaxU32,0);assert.equal(r.q,null);assert.equal(r.scannedSlots,false);assert.deepEqual(r.trace,[]);
 }
 for(let type=5;type<=11;type++) {const r=calc(request(type));assert.equal(r.supported,true);assert.equal(r.skillQueryId,type===9?null:type<=8?82:83);assert.equal(r.returnedValue,type===9?9:2);assert.equal(r.scannedSlots,type!==9);}
});
test('all eight validity combinations include all-invalid native nine',()=>{
 for(let mask=0;mask<8;mask++) {
  const valid=[0,1,2].map(i=>(mask>>i)&1), r=calc(request(5,[100,100,100],[0,0,0],valid));
  const count=valid.reduce((a,b)=>a+b,0), maximum=count?100:0, x=maximum+count*100-200;
  assert.equal(r.supported,true);assert.equal(r.intelligenceSum,count*100);assert.equal(r.intelligenceMax,maximum);assert.equal(r.rawX,x);assert.equal(r.q,Math.trunc(Math.max(24,x)/24));assert.equal(r.returnedValue,10-r.q);assert.equal(r.trace.length,3+2*count);
 }
 assert.equal(calc(request(5,[],[],[0,0,0])).returnedValue,9);
});
test('uint32 captures use AL only for intelligence and full EAX for validity/skill',()=>{
 const r=calc(request(5,[256,257,0xffffffff],[256,0,0],[256,0xffffffff,1]));
 assert.equal(r.supported,true);assert.equal(r.intelligenceSum,256);assert.equal(r.intelligenceMax,255);assert.equal(r.skillApplied,true);assert.deepEqual(r.slots.map(s=>s.intelligenceAl),[0,1,255]);
 for(const high of [0,0x100,0x123400,0xffffff00]) {
  const a=calc(request(5,[high+99,high+55,high+23])); assert.equal(a.intelligenceSum,177);assert.equal(a.intelligenceMax,99);
 }
});
test('skill at every slot never short circuits subsequent captures',()=>{
 for(let mask=0;mask<8;mask++) {const skills=[0,1,2].map(i=>(mask>>i)&1), q=request(5,[80,80,80],skills),r=calc(q);assert.equal(r.trace.length,9);assert.equal(r.returnedValue,mask?2:5);assert.deepEqual(r.trace,q.captures);}
});
test('unclamped negative and zero values and signed truncation',()=>{
 for(const [value,normal,half] of [[255,-24,-12],[248,-23,-11],[110,0,0],[104,1,0],[98,2,1]]) {
  assert.equal(calc(request(5,[value,value,value])).returnedValue,normal);
  const r=calc(request(5,[value,value,value],[1,0,0]));assert.equal(r.returnedValue,half);assert.equal(r.rawEaxU32,half>>>0);assert.equal(Object.is(r.returnedValue,-0),false);
 }
});
test('all attainable q transitions and x=23/24/25',()=>{
 const targets=new Set([23,24,25]);for(let k=1;k<=34;k++)for(let d=-1;d<=1;d++)targets.add(24*k+d);
 let covered=0;
 for(const x of targets) {
  let found;
  for(let a=0;a<256&&!found;a++)for(let b=0;b<=a&&!found;b++){const c=x+200-2*a-b;if(c>=0&&c<=a)found=[a,b,c];}
  if(!found)continue;
  const r=calc(request(5,found));assert.equal(r.rawX,x);assert.equal(r.q,Math.trunc(Math.max(24,x)/24));assert.equal(r.returnedValue,10-r.q);covered++;
 }
 assert.ok(covered>=100);
});
test('ship helper paths have independent repeat validations and opaque resolver returns',()=>{
 for(const type of [9,10,11]) {
  for(const ship of [[0],[1,0,0],[1,0xffffffff,1,0,0xffffffff,0],[1,0,256,0xffffffff,0,256]]) {
   const q=request(type,[100,100,100],[0,0,0],[1,1,1],ship),r=calc(q);assert.equal(r.supported,true);assert.deepEqual(r.trace,q.captures);assert.equal(r.facilityApplied,ship.length===6&&ship[5]!==0);
   assert.equal(r.returnedValue,type===9?(r.facilityApplied?7:9):2);
  }
 }
 const a=calc(request(10,[],[],[0,0,0],[1,15,1,123,456,1]));assert.equal(a.returnedValue,7);assert.equal(a.trace.length,9);
 const b=calc(request(10,[255,255,255],[1,0,0],[1,1,1],[0]));assert.equal(b.returnedValue,-12);
 assert.equal(calc(request(10,[255,255,255],[1,0,0],[1,1,1],[1,15,1,123,456,1])).returnedValue,1);
});
test('type nine has no skill or intelligence reads and fixed nine/seven result',()=>{
 for(const ship of [[0],[1,1,0],[1,1,1,2,3,0],[1,1,1,2,3,1]]) {
  const r=calc(request(9,[],[],[],ship));assert.equal(r.q,1);assert.equal(r.skillApplied,false);assert.equal(r.intelligenceSum,0);assert.equal(r.intelligenceMax,0);assert.deepEqual(r.slots,[]);assert.equal(r.returnedValue,ship[5]?7:9);
 }
 const q=request(9);q.captures.unshift(call('005C6CF8',1,0));assert.equal(calc(q).supported,false);
});
test('query receipts preserve actual target, skill IDs and facility parameter',()=>{
 for(const type of [5,8,10,11]) {
  const r=calc(request(type,[0,0,0],[0,0,0],[1,1,1],[1,1,1,2,3,1]));
  assert.deepEqual(r.callDetails.filter(c=>c.callAddress==='005C6D25').map(c=>c.queryId),Array(3).fill(type<=8?82:83));
  assert.ok(r.callDetails.filter(c=>c.callAddress==='005C6D06').every(c=>c.target==='00489090'));
  if(type>=9)assert.equal(r.callDetails.at(-1).queryId,45);
 }
});
test('missing surplus reordered wrong-site and wrong-slot captures reject',()=>{
 const good=request(10,[100,100,100],[1,0,0],[1,1,1],[1,13,1,17,19,1]);
 for(let i=0;i<good.captures.length;i++) {
  let q=structuredClone(good);q.captures.splice(i,1);assert.equal(calc(q).supported,false);
  q=structuredClone(good);q.captures[i].callAddress='00000000';assert.equal(calc(q).supported,false);
  q=structuredClone(good);q.captures[i].slotIndex=i<9?((q.captures[i].slotIndex+1)%3):0;assert.equal(calc(q).supported,false);
 }
 let q=structuredClone(good);[q.captures[0],q.captures[1]]=[q.captures[1],q.captures[0]];assert.equal(calc(q).supported,false);
 q=request(5);q.captures.push(call('005C6D90',0));assert.equal(calc(q).supported,false);
 q=request(10,[],[],[0,0,0],[1,0,0]);q.captures.push(call('005C6DCA',1));assert.equal(calc(q).supported,false);
});
test('closed input and capture validation never invokes accessors',()=>{
 let touched=0;const getter=()=>{touched++;throw Error('must not run');};
 const invalid=[null,[],{}, {...request(),profile:'other'}, {...request(),extra:1}, Object.assign(Object.create({}),request())];
 for(const value of [NaN,Infinity,-Infinity,1.2,-2147483649,2147483648,'5',null,undefined,5n])invalid.push({...request(),nativeEquipmentType:value});
 for(const key of ['profile','nativeEquipmentType','captures']) {const q=request();Object.defineProperty(q,key,{get:getter});invalid.push(q);}
 for(const key of ['callAddress','slotIndex','eax']){const q=request();Object.defineProperty(q.captures[0],key,{get:getter});invalid.push(q);}
 {const q=request();Object.defineProperty(q.captures,'0',{get:getter});invalid.push(q);}
 {const q=request();delete q.captures[0];invalid.push(q);}
 for(const key of ['extra',Symbol('extra')]) {const q=request();q.captures[key]=1;invalid.push(q);const w=request();w.captures[0][key]=1;invalid.push(w);const e=request();e[key]=1;invalid.push(e);}
 for(const eax of [-1,4294967296,NaN,Infinity,1.5,'1',null,undefined,1n]){const q=request();q.captures[0].eax=eax;invalid.push(q);}
 {const q=request();q.captures[0].callAddress='005c6cf8';invalid.push(q);}
 {const q=request();q.captures[0].slotIndex=undefined;invalid.push(q);}
 for(const q of invalid)assert.equal(calc(q).supported,false);assert.equal(touched,0);
});
test('accepts null prototypes/nonenumerable own data while cloning and freezing outputs only',()=>{
 const q=request(10,[248,248,248],[256,0,0],[1,1,1],[1,0,1,0xffffffff,0,1]);
 const before=structuredClone(q);Object.setPrototypeOf(q,null);Object.setPrototypeOf(q.captures[0],null);
 Object.defineProperty(q,'profile',{value:profile,enumerable:false});
 const r=calc(q);assert.equal(r.supported,true);freezeCheck(r);assert.equal(Object.isFrozen(q),false);assert.equal(Object.isFrozen(q.captures),false);assert.equal(Object.isFrozen(q.captures[0]),false);
 q.captures[0].eax=0;assert.equal(r.trace[0].eax,before.captures[0].eax);
});
