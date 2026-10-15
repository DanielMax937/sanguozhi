import test from 'node:test';
import assert from 'node:assert/strict';
import {calculateMonthlyCityFoodBaseArgument as calculate, MONTHLY_CITY_FOOD_BASE_ARGUMENT as source} from '../src/index.ts';
const profile='monthly-city-food-base-argument-u32-v1';
const input=(extra={})=>({profile,entryFoodEdiU32:0,harvestPredicateEaxU32:0,lateLevyFlagDwordU32:0,...extra});
const frozen=x=>x===null||typeof x!=='object'||Object.isFrozen(x)&&Object.values(x).every(frozen);
function canonical(x){if(typeof x==='number')assert.ok(Number.isSafeInteger(x)&&!Object.is(x,-0));if(x&&typeof x==='object')for(const v of Object.values(x))canonical(v);}
function good(raw,h,l,want){
 const i=input({entryFoodEdiU32:raw,harvestPredicateEaxU32:h,lateLevyFlagDwordU32:l});const before=structuredClone(i);const r=calculate(i);
 assert.equal(r.supported,true);assert.equal(r.pushedArgumentSigned,want);assert.equal(r.pushedArgumentU32,want>>>0);
 assert.equal(r.entryFoodEdiU32,raw===0?0:raw);assert.equal(r.harvestPredicateEaxU32,h===0?0:h);assert.equal(r.lateLevyFlagDwordU32,l===0?0:l);
 assert.equal(r.harvestApplied,h!==0);assert.equal(r.levyApplied,l!==0);assert.equal(r.instructionCount,6+5*Number(h!==0)+5*Number(l!==0));
 assert.deepEqual(r.lateLevyRead,{address:'005905EE',widthBits:32,count:1});assert.equal(r.executedAddresses.filter(x=>x==='005905EE').length,1);
 assert.equal(r.executedAddresses.at(-1),'00590602');assert.equal(r.continuationAddress,'00590603');
 assert.deepEqual(i,before);assert.ok(frozen(r));canonical(r);assert.deepEqual(JSON.parse(JSON.stringify(r)),r);return r;
}
const bad=(i,reason)=>assert.deepEqual(calculate(i),{supported:false,reason,evidence:source.evidence});
const signed=n=>BigInt.asIntN(32,n),raw=n=>Number(BigInt.asUintN(32,n));
function ref(n,h,l){let u=BigInt(n);if(h)u=BigInt.asUintN(32,signed(3n*u)/2n);if(l)u=BigInt.asUintN(32,signed(u)/2n);return Number(signed(u));}

test('monthly food argument: documented anchors, signed wrap and modifier order',()=>{
 const rows=[[0,0,0],[1,1,0],[3,4,2],[5,7,3],[10375,15562,7781],[0xFFFFFFFD,-4,-2],[0xFFFFFFFF,-1,0],[0x2AAAAAAA,1073741823,536870911],[0x2AAAAAAB,-1073741823,-536870911],[0x55555555,0,0],[0x55555556,1,0],[0x7FFFFFFF,1073741822,536870911],[0x80000000,-1073741824,-536870912]];
 for(const [n,h,hl]of rows){good(n,1,0,h);good(n,1,1,hl);good(n,0,0,n|0);good(n,0,1,Number(BigInt(n|0)/2n));}
 assert.equal(good(3,1,1,2).postHarvestSigned,4);
});
test('monthly food argument: both full DWORD predicates and all four exact traces',()=>{
 for(const n of [3,0xFFFFFFFD,0x2AAAAAAB,0x55555555])for(const h of [0,1,2,255,256,65536,0x80000000,0xFFFFFFFF])for(const l of [0,1,2,255,256,65536,0x80000000,0xFFFFFFFF]){
  const r=good(n,h,l,ref(n,h,l));assert.deepEqual(r.executedAddresses,['005905E0','005905E2',...(h?['005905E4','005905E7','005905E8','005905EA','005905EC']:[]),'005905EE','005905F5','005905F7',...(l?['005905F9','005905FB','005905FC','005905FE','00590600']:[]),'00590602']);
 }
});
test('monthly food argument: dense signed residues and every triple-wrap discontinuity',()=>{
 const values=new Set();for(let n=-4096;n<=4096;n++)values.add(n>>>0);
 for(let k=1;k<=5;k++){const b=Math.floor(k*2**31/3);for(let d=-8;d<=8;d++)if(b+d>=0&&b+d<=0xFFFFFFFF)values.add(b+d);}
 for(const n of values)for(const [h,l]of [[0,0],[256,0],[0,65536],[0x80000000,0xFFFFFFFF]])good(n,h,l,ref(n,h,l));
});
test('monthly food argument: closed shapes, selectors, full raw widths and excluded composition',()=>{
 for(const v of [null,undefined,[],true,1,'x',()=>{}])bad(v,'invalid-input');
 for(const k of Object.keys(input())){const i=input();delete i[k];bad(i,'invalid-input');}
 for(const k of ['state','owner','force','city','cityCalculatorReturnU32','earlyLevyFlagDwordU32','quarterStart','rng','writer','extra'])bad(input({[k]:0}),'unexpected-field');
 for(const v of ['stock',1,null,true])bad(input({profile:v}),'unsupported-profile');
 for(const k of ['entryFoodEdiU32','harvestPredicateEaxU32','lateLevyFlagDwordU32'])for(const v of [-1,2**32,0.5,true,'1',null,undefined,NaN,Infinity,-Infinity,1n,Number.MAX_SAFE_INTEGER])bad(input({[k]:v}),'invalid-input');
});
test('monthly food argument: own enumerable data only, getters never evaluated',()=>{
 let calls=0;for(const k of Object.keys(input())){const i=input();Object.defineProperty(i,k,{get(){calls++;throw Error('getter executed');}});bad(i,'invalid-input');}
 const extra=input();Object.defineProperty(extra,'extra',{get(){calls++;throw Error('getter executed');}});bad(extra,'unexpected-field');assert.equal(calls,0);
 const hidden=input();Object.defineProperty(hidden,'entryFoodEdiU32',{value:3,enumerable:false});bad(hidden,'invalid-input');
 const extraHidden=input();Object.defineProperty(extraHidden,'extra',{value:3,enumerable:false});bad(extraHidden,'unexpected-field');
 const sym=input();sym[Symbol('s')]=0;bad(sym,'unexpected-field');
});
test('monthly food argument: plain/null prototypes, no inherited values or custom prototypes',()=>{
 const i=input();Object.setPrototypeOf(i,null);assert.equal(calculate(i).supported,true);
 bad(Object.assign(Object.create({inherited:1}),input()),'invalid-input');bad(new class {profile=profile;entryFoodEdiU32=0;harvestPredicateEaxU32=0;lateLevyFlagDwordU32=0;}(),'invalid-input');
 const p=JSON.parse(JSON.stringify(input()).slice(0,-1)+',"__proto__":{}}');bad(p,'unexpected-field');
});
test('monthly food argument: canonical positive zero, immutable fresh receipts and no aliases',()=>{
 const i=input({entryFoodEdiU32:-0,harvestPredicateEaxU32:-0,lateLevyFlagDwordU32:-0});const a=calculate(i),b=calculate(i);assert.notEqual(a,b);assert.notEqual(a.executedAddresses,b.executedAddresses);assert.notEqual(a.lateLevyRead,b.lateLevyRead);canonical(a);assert.ok(frozen(source));
 const r=good(0xFFFFFFFF,0,1,0);assert.ok(!Object.is(r.pushedArgumentSigned,-0));assert.throws(()=>{r.evidence.earlyLevyReused=true;},TypeError);assert.throws(()=>{r.executedAddresses.push('00590609');},TypeError);
 i.entryFoodEdiU32=7;assert.equal(a.entryFoodEdiU32,0);assert.equal(good(0,256,256,0).lateLevyRead.count,1);
});
