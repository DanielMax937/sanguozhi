import test from 'node:test';
import assert from 'node:assert/strict';
import {calculateCityFoodIncomeProjection as calculate, CITY_FOOD_INCOME_PROJECTION as source} from '../src/index.ts';
const profile = 'city-food-income-stable-resolved-non-easy-u32-v1';
const input = (extra = {}) => ({profile, baseFoodWord: 0, slots: Array(30).fill(null), resolvedTypeRows: {}, difficultyWord: 1, securityByte: 100, ...extra});
const slot = (type, construction = 1, granary) => ({facilityTypeWord: type, constructionWord: construction, ...(granary === undefined ? {} : {adjacentGranary: granary})});
const one = (s, rows, extra = {}) => input({slots: [s, ...Array(29).fill(null)], resolvedTypeRows: rows, ...extra});
const row = y => ({valid: true, foodYieldWord: y});
const military = (troops, yieldWord=1500, extra={}) => one(slot(49), {49:row(yieldWord)}, {cityTroopsWord:troops,...extra});
function good(i, expected) { const r=calculate(i); assert.equal(r.supported,true); assert.equal(r.returnedIncomeSigned,expected); assert.equal(r.evidence,source.evidence); assert.equal(r.returnedIncomeU32,expected>>>0); assert.ok(Object.isFrozen(r)); assert.ok(Object.isFrozen(r.slots)); for(const x of r.slots) assert.ok(Object.isFrozen(x)); return r; }
function bad(i, reason) { assert.deepEqual(calculate(i),{supported:false,reason,evidence:source.evidence}); }

test('city food: explicit supported zero and all 30 invalid-slot receipts',()=>{
 const r=good(input(),0); assert.equal(r.rawFood,0); assert.equal(r.slots.length,30);
 assert.ok(r.slots.every(s=>s.status==='invalid-slot' && s.contribution===0 && s.militaryProductRaw===null));
 for(const v of [0,1,65535]) bad(input({baseFoodWord:v,difficultyWord:0}),'unsupported-easy-branch');
});
test('city food: four types, both upgrade fallbacks, and every nonzero construction word',()=>{
 const rows={32:row(101),49:row(202),52:row(303),53:row(404)};
 for(const t of [32,49,52,53]) for(const c of [0,1,2,255,0x80000000,0xFFFFFFFF]) {
  const effective=c===0?(t===52?32:t===53?52:null):t;
  const r=good(one(slot(t,c,effective!==null&&effective!==49?false:undefined),rows,effective===49?{cityTroopsWord:15000}:{}),effective===null?0:rows[effective].foodYieldWord);
  assert.equal(r.slots[0].effectiveType,effective); assert.equal(r.slots[0].status,effective===null?'unfinished':'yield');
 }
});
test('city food: all dispatch entries and out-of-range U32 types are ignored',()=>{
 for(const t of [0,1,31,...Array.from({length:22},(_,i)=>32+i).filter(t=>![32,49,52,53].includes(t)),54,255,0x7FFFFFFF,0x80000000,0xFFFFFFFF]) {
  const r=good(one(slot(t),{}),0); assert.equal(r.slots[0].status,'ignored-type');
 }
});
test('city food: granary is ordinary-farm-only, including zero yield and upgrade fallback',()=>{
 for(const t of [32,52,53]) for(const y of [0,1,2,3,99,65535]) for(const g of [true,false]) good(one(slot(t,1,g),{[t]:row(y)}),g?Math.floor(3*y/2):y);
 good(one(slot(52,0,true),{32:row(3),52:row(999)}),4);
 good(one(slot(53,0,true),{52:row(3),53:row(999)}),4);
 bad(one(slot(49,1,true),{49:row(1500)},{cityTroopsWord:20000}),'unexpected-field');
 bad(one(slot(32),{32:row(0)}),'missing-adjacent-granary');
 bad(one(slot(49),{49:row(0)}),'missing-city-troops');
 good(military(0,0),0);
});
test('city food: missing row, invalid row and unconsumed conditional data stay distinct',()=>{
 bad(one(slot(32,1,false),{}),'missing-type-row');
 bad(one(slot(52,0,false),{52:row(100)}),'missing-type-row');
 bad(one(slot(53,0,false),{53:row(100)}),'missing-type-row');
 good(one(slot(32),{32:{valid:false}}),0);
 for(const i of [one(slot(32,1,false),{32:{valid:false}}),one(slot(32,0,false),{}),one(slot(31,1,false),{}),input({cityTroopsWord:0}),one(slot(49,0),{},{cityTroopsWord:0}),one(slot(49),{49:{valid:false}},{cityTroopsWord:0})]) bad(i,'unexpected-field');
 good(one(slot(49),{49:{valid:false}}),0);
});
test('city food: unsigned troop minimum and low32 product before unsigned /15000',()=>{
 for(const [t,y,c] of [[0,1500,1500],[14999,1500,1500],[15000,1500,1500],[15001,1500,1500],[20000,1500,2000],[0x80000000,1500,0],[2863311,1500,286331],[2863312,1500,0],[65537,65535,286331],[0xFFFFFFFF,65535,286326]]) {
  const r=good(military(t,y),c); assert.equal(r.slots[0].effectiveTroops,Math.max(15000,t));
  assert.equal(r.slots[0].militaryProductRaw,Math.max(15000,t)*y); assert.equal(r.slots[0].militaryProductU32,Number(BigInt(Math.max(15000,t))*BigInt(y)&0xFFFFFFFFn));
 }
});
const maximum=(extra={})=>input({baseFoodWord:65535,slots:Array.from({length:30},()=>slot(49)),resolvedTypeRows:{49:row(65535)},cityTroopsWord:65537,...extra});
test('city food: full-width negative return is supported and divides signed toward zero',()=>{
 for(const [d,p,s,want] of [[1,undefined,248,21465553],[1,undefined,249,-21397565],[2,false,198,21422275],[2,false,199,-21419204],[2,false,255,-15360378]]) {
  const r=good(maximum({difficultyWord:d,securityByte:s,...(p===undefined?{}:{cityPlayerPredicate:p})}),want);
  assert.equal(r.rawFood,8655465); assert.equal(r.securityProductRaw,r.securityProductU32);
  if(want<0) assert.ok(r.securityProductSigned<0);
 }
 const r=good(maximum({difficultyWord:2,cityPlayerPredicate:false,securityByte:255}),-15360378); assert.equal(r.securityProductRaw,2758929405);
});
test('city food: all 256 security bytes and non-Easy difficulty paths retain sequential flooring',()=>{
 for(const [d,p,q] of [[1,undefined,100],[2,true,75],[2,false,125],[3,undefined,100],[0x80000000,undefined,100],[0xFFFFFFFF,undefined,100]]) for(let s=0;s<256;s++) {
  const r=good(input({baseFoodWord:123,difficultyWord:d,securityByte:s,...(p===undefined?{}:{cityPlayerPredicate:p})}),Math.floor(Math.floor(123*q/100)*Math.max(50,s)/100));
  assert.equal(r.difficultyPercent,q); assert.equal(r.effectiveSecurity,Math.max(50,s));
 }
 bad(input({difficultyWord:2}),'invalid-input'); bad(input({difficultyWord:2,cityPlayerPredicate:1}),'invalid-input'); bad(input({cityPlayerPredicate:false}),'unexpected-field');
});
test('city food: stable repeated rows, slot order, thirty-slot consumption and normal examples',()=>{
 const shared=slot(53,0,true); const i=input({slots:Array(30).fill(shared),resolvedTypeRows:{52:row(3)}}); const before=structuredClone(i);
 const r=good(i,120); assert.deepEqual(i,before); assert.equal(r.slots[29].contribution,4); i.resolvedTypeRows[52].foodYieldWord=99; shared.adjacentGranary=false; assert.equal(r.slots[0].foodYieldWord,3);
 const mixed=input({baseFoodWord:5000,slots:[slot(53,1,true),slot(49),...Array(28).fill(null)],resolvedTypeRows:{53:row(2250),49:row(1500)},cityTroopsWord:20000});
 good(mixed,10375); good({...mixed,difficultyWord:2,cityPlayerPredicate:true,securityByte:50},3890); good({...mixed,difficultyWord:2,cityPlayerPredicate:false,securityByte:255},33068);
});
test('city food: closed input shapes, width limits, profile and type-row validation',()=>{
 for(const v of [null,[],true,42,'x',undefined]) bad(v,'invalid-input');
 for(const k of ['profile','baseFoodWord','slots','resolvedTypeRows','difficultyWord','securityByte']) {const i=input();delete i[k];bad(i,'invalid-input');}
 for(const k of ['rawFood','finalIncome','easyConvertedEax','rng','state','pointer']) bad(input({[k]:0}),'unexpected-field');
 bad(input({profile:'stock'}),'unsupported-profile');
 for(const [k,max] of [['baseFoodWord',65535],['difficultyWord',0xFFFFFFFF],['securityByte',255]]) for(const v of [-1,max+1,0.5,true,'1',NaN,Infinity,-Infinity,null,undefined,1n]) bad(input({[k]:v}),'invalid-input');
 for(const v of [-1,0x100000000,0.5,true,'1',NaN,Infinity,null]) {bad(military(v),'invalid-input');bad(one({...slot(32,1,false),facilityTypeWord:v},{}),'invalid-input');bad(one({...slot(32,1,false),constructionWord:v},{}),'invalid-input');}
 for(const n of [0,29,31]) bad(input({slots:Array(n).fill(null)}),'invalid-input');
 bad(input({resolvedTypeRows:{31:row(1)}}),'unexpected-field');
 for(const v of [-1,65536,0.5,true,'1',NaN,Infinity,null,undefined]) bad(input({resolvedTypeRows:{32:row(v)}}),'invalid-input');
 bad(input({resolvedTypeRows:{32:{valid:false,foodYieldWord:0}}}),'unexpected-field'); bad(input({resolvedTypeRows:{32:{valid:1}}}),'invalid-input'); bad(input({resolvedTypeRows:{32:{valid:true}}}),'invalid-input'); bad(input({resolvedTypeRows:{32:{valid:true,foodYieldWord:1,extra:0}}}),'unexpected-field');
});
test('city food: getters never execute, prototypes and sparse or extended arrays reject',()=>{
 let hits=0; const getter={get(){hits++;throw Error('getter executed');}};
 for(const mutate of [i=>Object.defineProperty(i,'baseFoodWord',getter),i=>Object.defineProperty(i.slots,'0',getter),i=>Object.defineProperty(i.resolvedTypeRows,'32',getter),i=>{i.slots[0]=slot(32,1,false);Object.defineProperty(i.slots[0],'facilityTypeWord',getter);},i=>{i.resolvedTypeRows[32]=row(1);Object.defineProperty(i.resolvedTypeRows[32],'valid',getter);}]) {const i=input();mutate(i);bad(i,'invalid-input');}
 assert.equal(hits,0);
 for(const mutate of [i=>Object.setPrototypeOf(i,{inherited:true}),i=>Object.setPrototypeOf(i.resolvedTypeRows,{}),i=>Object.setPrototypeOf(i.slots,{}),i=>{delete i.slots[0];},i=>{i.resolvedTypeRows[32]=new(class {valid=true;foodYieldWord=1;})();}]) {const i=input();mutate(i);bad(i,'invalid-input');}
 for(const mutate of [i=>{i[Symbol('x')]=0;},i=>{i.slots.extra=1;},i=>{i.slots[Symbol('x')]=0;}]) {const i=input();mutate(i);bad(i,'unexpected-field');}
 const i=input(); Object.setPrototypeOf(i,null);Object.setPrototypeOf(i.resolvedTypeRows,null);good(i,0);
});
test('city food: all output zero values normalize to positive zero, evidence recursively frozen',()=>{
 const i=one(slot(-0,-0),{}, {baseFoodWord:-0,securityByte:-0});const r=good(i,0);
 function walk(v){if(typeof v==='number' && v===0)assert.equal(Object.is(v,-0),false);if(v&&typeof v==='object')for(const x of Object.values(v))walk(x);} walk(r);
 assert.ok(Object.isFrozen(source));assert.ok(Object.isFrozen(source.evidence));assert.ok(Object.isFrozen(source.inputSchema));
 assert.throws(()=>{r.evidence.stockOriginalVerified=true;},TypeError);
 assert.equal(source.evidence.level,'source-listing-reconstruction');assert.equal(source.evidence.easyBranchSupported,false);
});
