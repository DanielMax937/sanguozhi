import test from 'node:test';
import assert from 'node:assert/strict';
import {calculateBaseIncomeReturnTail as calculate, BASE_INCOME_RETURN_TAIL as source} from '../src/index.ts';
const profile='base-income-return-tail-u32-v1';
const input=(extra={})=>({profile,resource:'money',cityCalculatorReturnU32:0,lateFacilityTypeU32:0,...extra});
const frozen=x=>x===null||typeof x!=='object'||Object.isFrozen(x)&&Object.values(x).every(frozen);
function canonical(x){if(typeof x==='number')assert.ok(Number.isSafeInteger(x)&&!Object.is(x,-0));if(x&&typeof x==='object')for(const v of Object.values(x))canonical(v);}
function good(raw,type,want,resource='money'){
 const i=input({resource,cityCalculatorReturnU32:raw,lateFacilityTypeU32:type});const before=structuredClone(i);const r=calculate(i);
 assert.equal(r.supported,true);assert.equal(r.returnedIncomeSigned,want);assert.equal(r.returnedIncomeU32,want>>>0);
 assert.equal(r.cityCalculatorReturnU32,raw===0?0:raw);assert.equal(r.lateFacilityTypeU32,type===0?0:type);assert.equal(r.resource,resource);
 assert.equal(r.branch,type===0?'copy':'signed-divide-by-five');assert.deepEqual(i,before);assert.ok(frozen(r));canonical(r);
 if(type===0)assert.equal(r.division,null);else {const d=r.division;assert.equal(d.multiplierU32,0x66666667);assert.equal(d.sarHighSigned+d.correctionU32,want);assert.equal(BigInt(d.productSignedDecimal),BigInt(raw|0)*0x66666667n);assert.equal(d.productLowU32,Number(BigInt.asUintN(32,BigInt(d.productSignedDecimal))));}
 return r;
}
const bad=(i,reason)=>assert.deepEqual(calculate(i),{supported:false,reason,evidence:source.evidence});

test('base return tail: documented signed boundaries, exact multiples, and raw U32 copy',()=>{
 for(const resource of ['money','food'])for(const n of [0,1,2,3,4,5,6,9,10,11,-1,-2,-3,-4,-5,-6,-9,-10,-11,2147483647,-2147483648]){
  good(n>>>0,0,n,resource);
  for(const t of [1,2,255,256,65535,65536,0x80000000,0xFFFFFFFF])good(n>>>0,t,Number(BigInt(n)/5n),resource);
 }
 assert.equal(good(0x80000000,1,-429496729).returnedIncomeU32,0xE6666667);
 assert.equal(good(0x7FFFFFFF,1,429496729).returnedIncomeU32,0x19999999);
});
test('base return tail: dense signed residues around zero and quotient boundaries',()=>{
 for(let n=-4096;n<=4096;n++)for(const resource of ['money','food'])good(n>>>0,1,Number(BigInt(n)/5n),resource);
 for(let power=0;power<32;power++)for(const sign of [-1,1])for(let delta=-6;delta<=6;delta++){
  const n=sign*2**power+delta;if(n>=-2147483648&&n<=2147483647)good(n>>>0,0x80000000,Number(BigInt(n)/5n));
 }
});
test('base return tail: full raw type widths remain eligible, never low-byte/word narrowing',()=>{
 for(const type of [0,1,255,256,257,65535,65536,65537,0x7FFFFFFF,0x80000000,0xFFFFFF00,0xFFFF0000,0xFFFFFFFF])
  for(const n of [-10,-6,-1,0,1,6,10])good(n>>>0,type,type?Number(BigInt(n)/5n):n);
});
test('base return tail: closed shapes, strict JSON number widths and unsupported selectors',()=>{
 for(const v of [null,undefined,[],true,1,'x',()=>{}])bad(v,'invalid-input');
 for(const k of ['profile','resource','cityCalculatorReturnU32','lateFacilityTypeU32']){const i=input();delete i[k];bad(i,'invalid-input');}
 for(const k of ['state','owner','force','cityIncome','cachedFacilityType','rng','writer','extra'])bad(input({[k]:0}),'unexpected-field');
 for(const v of ['stock',1,null,true])bad(input({profile:v}),'unsupported-profile');
 for(const v of ['gold','port',1,null,true])bad(input({resource:v}),'unsupported-resource');
 for(const k of ['cityCalculatorReturnU32','lateFacilityTypeU32'])for(const v of [-1,2**32,0.5,true,'1',null,undefined,NaN,Infinity,-Infinity,1n,Number.MAX_SAFE_INTEGER])bad(input({[k]:v}),'invalid-input');
});
test('base return tail: data descriptors only; never execute getters',()=>{
 let calls=0;
 for(const k of ['profile','resource','cityCalculatorReturnU32','lateFacilityTypeU32']){
  const i=input();Object.defineProperty(i,k,{get(){calls++;throw Error('getter executed');}});bad(i,'invalid-input');
 }
 const unknown=input();Object.defineProperty(unknown,'extra',{get(){calls++;throw Error('getter executed');}});bad(unknown,'unexpected-field');
 assert.equal(calls,0);
 const i=input();Object.defineProperty(i,'cityCalculatorReturnU32',{value:10,enumerable:false});bad(i,'invalid-input');
 const hidden=input();Object.defineProperty(hidden,'extra',{value:1,enumerable:false});bad(hidden,'unexpected-field');
 const symbol=input();symbol[Symbol('hidden')]=0;bad(symbol,'unexpected-field');
});
test('base return tail: plain/null prototype accepted, inherited/class/prototype keys rejected',()=>{
 const plain=input();Object.setPrototypeOf(plain,null);assert.equal(calculate(plain).supported,true);
 bad(Object.assign(Object.create({inherited:1}),input()),'invalid-input');
 bad(new class {profile=profile;resource='money';cityCalculatorReturnU32=0;lateFacilityTypeU32=0;}(),'invalid-input');
 bad(JSON.parse('{"profile":"base-income-return-tail-u32-v1","resource":"money","cityCalculatorReturnU32":0,"lateFacilityTypeU32":0,"__proto__":{}}'),'unexpected-field');
});
test('base return tail: positive-zero normalization and no result/input aliases',()=>{
 const i=input({cityCalculatorReturnU32:-0,lateFacilityTypeU32:-0});const a=calculate(i),b=calculate(i);assert.notEqual(a,b);canonical(a);assert.ok(frozen(source));
 const r=good(0xFFFFFFFF,1,0);assert.ok(!Object.is(r.returnedIncomeSigned,-0));
 assert.throws(()=>{r.division.correctionU32=8;},TypeError);assert.throws(()=>{r.evidence.fullCallerExecuted=true;},TypeError);
 i.cityCalculatorReturnU32=123;assert.equal(a.cityCalculatorReturnU32,0);
});
