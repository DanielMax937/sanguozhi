import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { SEARCH_GOLD_CALLER as source, calculateSearchGoldCallerProjection as calculate,
  createSession, syntheticScenario, canonical, dispatch, saveGame, loadGame, replaySession } from '../src/index.ts';
import { calculateSearchGoldCallerProjection as direct } from '../src/search-gold-caller.ts';
const PROFILE = 'search-gold-caller-resolved-v1';
const input = (rngEax=80, firstGold=0, firstCapacity=1000, secondRead) => ({profile:PROFILE,rngEax,firstGold,firstCapacity,...(secondRead===undefined?{}:{secondRead})});
const frozen = v => { if(v!==null && typeof v==='object'){assert.ok(Object.isFrozen(v));for(const x of Object.values(v))frozen(x);} };
const anchors = [
  [input(29),29,'nothing',false], [input(30),30,'gold-handler',false],
  [input(80),80,'gold-handler',false], [input(81),80,'gold-handler',false],
  [input(0x1001e),30,'gold-handler',false], [input(0x8000),80,'gold-handler',false],
  [input(0xffffffff),80,'gold-handler',false],
  [input(80,0x7fffffff,0x7fffffff),80,'gold-handler',false],
  [input(80,0xffffffff,79),80,'gold-handler',false],
  [input(80,100,0,{gold:0,capacity:500}),500,'gold-handler',true],
  [input(80,100,0,{gold:0xffffffff,capacity:29}),30,'gold-handler',true],
  [input(80,100,120,{gold:100,capacity:120}),20,'nothing',true],
  [input(80,100,120,{gold:100,capacity:0}),0xffffff9c,'nothing',true],
  [input(80,100,120,{gold:0,capacity:0x80000000}),0x80000000,'nothing',true],
  [input(80,100,120,{gold:0x80000000,capacity:0xffffffff}),0x7fffffff,'gold-handler',true],
];
function controls(fn){
  for(const [request,amount,outcome,clipped] of anchors){const r=fn(request);assert.equal(r.supported,true);assert.equal(r.amountU32,amount);assert.equal(r.outcome,outcome);assert.equal(r.capacityExceeded,clipped);assert.equal(r.firstSumU32,Number(BigInt.asUintN(32,BigInt(request.firstGold)+BigInt(Math.min(request.rngEax&0xffff,80)))));assert.equal(r.amountSigned,amount>=0x80000000?amount-0x100000000:amount);assert.equal(r.goldHandlerArgument,outcome==='nothing'?null:amount);}
  assert.equal(fn(input(80)).branchTrace.rollCapTaken,false);
  assert.equal(fn(input(81)).branchTrace.rollCapTaken,true);
  assert.equal(fn(input(80,0,80)).branchTrace.capacitySufficientTaken,true);
  assert.equal(fn(input(30)).branchTrace.nothingTaken,false);
}
test('search gold exports source-listing-only frozen evidence',()=>{
  assert.strictEqual(calculate,direct);assert.equal(source.profileId,PROFILE);
  assert.equal(source.evidence.level,'source-listing-reconstruction');
  for(const flag of ['stockOriginalVerified','originalExecutableExecuted','nativeHelpersReconstructed','realRewardRecovered','rngIntegrated','commandIntegrated','callerIntegrated','mutableStateRecovered','completeSearchRecovered'])assert.equal(source.evidence[flag],false,flag);
  assert.equal(source.evidence.interpretedCallSitesCaptured,true);frozen(source);frozen(calculate(input()));
});
test('search gold respects low word, signed overflow and distinct second captures',()=>controls(calculate));
test('search gold captures exact getter order and stops before either handler',()=>{
  for(const [request,,outcome,clipped] of anchors){const r=calculate(request);frozen(r);assert.deepEqual(r.reads,[
    {callAddress:'005D5BBE',target:'00486C80',value:request.firstGold},
    {callAddress:'005D5BCB',target:'00486D30',value:request.firstCapacity},
    ...(clipped?[{callAddress:'005D5BDA',target:'00486C80',value:request.secondRead.gold},{callAddress:'005D5BE3',target:'00486D30',value:request.secondRead.capacity}]:[])]);
    assert.equal(r.exitAddress,outcome==='nothing'?'005D5C02':'005D5BF8');assert.equal(r.handlerTarget,outcome==='nothing'?'005D4160':'005D3F80');
    assert.equal(Object.hasOwn(r,'secondRead'),clipped);
  }
});
test('all 65536 low words preserve zero-extension, cap branch and 30 boundary',()=>{
  for(let low=0;low<=0xffff;low++){const r=calculate(input(low));const b=BigInt(low);assert.equal(r.rngLow16,low);assert.equal(r.proposedAmount,Number(b>80n?80n:b));assert.equal(r.amountU32,r.proposedAmount);assert.equal(r.branchTrace.rollCapTaken,low>80);assert.equal(r.outcome,low<30?'nothing':'gold-handler');}
});
test('captured uint32 boundaries agree with independent BigInt modular arithmetic',()=>{
  const values=[0,1,29,30,79,80,81,0x7fffffaf,0x7fffffff,0x80000000,0x80000001,0xffffffaf,0xffffffff];
  const sign=n=>BigInt.asIntN(32,n);
  let cases=0;
  for(const roll of [0,29,30,79,80,81,0x8000,0x1001e,0xffff001e,0xffffffff])for(const gold of values)for(const cap of values){
    const r=BigInt(roll)&0xffffn;const proposed=r>80n?80n:r;const sum=BigInt.asUintN(32,BigInt(gold)+proposed);
    const clipped=sign(BigInt(cap))<sign(sum);const second={gold:cap,capacity:gold};
    const receipt=calculate(input(roll,gold,cap,clipped?second:undefined));assert.equal(receipt.supported,true);
    const amount=clipped?BigInt.asUintN(32,BigInt(second.capacity)-BigInt(second.gold)):proposed;
    assert.equal(receipt.firstSumU32,Number(sum));assert.equal(receipt.capacityExceeded,clipped);assert.equal(receipt.amountU32,Number(amount));assert.equal(receipt.amountSigned,Number(sign(amount)));cases++;
  }assert.equal(cases,1690);
});
test('closed own data contracts reject malformed observations without invoking accessors',()=>{
  const rejects=(v,why)=>{const r=calculate(v);assert.equal(r.supported,false);assert.equal(r.reason,why);frozen(r);assert.strictEqual(r.evidence,source.evidence);};
  for(const v of [null,undefined,1,'',false,[],new Date(),()=>1,Object.create(input())])rejects(v,'invalid-input');
  for(const field of ['profile','rngEax','firstGold','firstCapacity']){
    const missing=input();delete missing[field];rejects(missing,'invalid-input');
    for(const descriptor of [{get(){throw Error('accessor executed');}},{set(){throw Error('setter executed');}}]){const v=input();Object.defineProperty(v,field,descriptor);rejects(v,'invalid-input');}
  }
  for(const field of ['rngEax','firstGold','firstCapacity'])for(const bad of [-1,0x100000000,1.5,NaN,Infinity,-Infinity,'30',30n,null,undefined])rejects({...input(),[field]:bad},'invalid-u32');
  for(const extra of ['rng','seed','nativePointer','stock','cityId','extra'])rejects({...input(),[extra]:1},'unexpected-field');
  rejects({...input(),[Symbol()]:1},'unexpected-field');rejects({...input(),profile:'stock'},'unsupported-profile');
  rejects(input(80,100,0),'second-read-required');rejects({...input(),secondRead:undefined},'unexpected-second-read');
  rejects(input(80,0,1000,{gold:0,capacity:1000}),'unexpected-second-read');
  for(const v of [undefined,null,[],1,{}, {gold:0},{capacity:0},{gold:0,capacity:0,extra:1},Object.create({gold:0,capacity:0})])rejects({...input(80,100,0),secondRead:v},'invalid-second-read');
  for(const key of ['gold','capacity']){
    for(const bad of [-1,0x100000000,1.5,NaN,Infinity,'1',1n])rejects(input(80,100,0,{gold:0,capacity:0,[key]:bad}),'invalid-second-read');
    const s={gold:0,capacity:0};Object.defineProperty(s,key,{get(){throw Error('nested accessor executed');}});rejects(input(80,100,0,s),'invalid-second-read');
  }
  rejects(input(80,100,0,{gold:0,capacity:0,[Symbol()]:0}),'invalid-second-read');
  const getter=input(80,100,0);Object.defineProperty(getter,'secondRead',{get(){throw Error('second getter executed');}});rejects(getter,'invalid-input');
});
test('null prototypes and nonenumerable data accepted; negative zero normalized without freezing callers',()=>{
  const a=Object.assign(Object.create(null),input(-0,-0,-0));Object.defineProperty(a,'rngEax',{value:-0,enumerable:false});const r=calculate(a);assert.equal(r.supported,true);for(const field of ['rngEax','firstGold','firstCapacity','amountU32','amountSigned'])assert.equal(Object.is(r[field],-0),false);assert.equal(Object.isFrozen(a),false);
  const second=Object.assign(Object.create(null),{gold:-0,capacity:50});const v=input(80,100,0,second);const before=JSON.stringify(v);const c=calculate(v);assert.equal(c.amountU32,50);assert.notStrictEqual(c.secondRead,second);assert.equal(Object.isFrozen(second),false);assert.equal(JSON.stringify(v),before);second.capacity=40;assert.equal(c.secondRead.capacity,50);
});
test('actual TypeScript implementation mutants are distinguished by anchored controls',()=>{
  const path=new URL('../src/search-gold-caller.ts',import.meta.url);const original=fs.readFileSync(path,'utf8');
  const substitutions=[
    ['low byte','rngEax & 0xffff','rngEax & 0xff'],['full eax','rngEax & 0xffff','rngEax'],['signed ax','rngEax & 0xffff','(rngEax << 16) >> 16'],
    ['cap79','Math.min(rngLow16, 80)','Math.min(rngLow16, 79)'],['cap81','Math.min(rngLow16, 80)','Math.min(rngLow16, 81)'],
    ['no add wrap','(firstGold + proposedAmount) >>> 0','firstGold + proposedAmount'],['unsigned capacity','signed32(firstCapacity) < signed32(firstSumU32)','firstCapacity < firstSumU32'],
    ['capacity equal clips','signed32(firstCapacity) < signed32(firstSumU32)','signed32(firstCapacity) <= signed32(firstSumU32)'],
    ['reuse first gold','secondRead.capacity - secondRead.gold','secondRead.capacity - firstGold'],['reuse first cap','secondRead.capacity - secondRead.gold','firstCapacity - secondRead.gold'],
    ['sub reversed','secondRead.capacity - secondRead.gold','secondRead.gold - secondRead.capacity'],['no sub wrap','(secondRead.capacity - secondRead.gold) >>> 0','secondRead.capacity - secondRead.gold'],
    ['threshold29','amountSigned < 30','amountSigned < 29'],['threshold31','amountSigned < 30','amountSigned < 31'],['unsigned threshold','amountSigned < 30','amountU32 < 30'],
    ['final cap','const amountSigned = signed32(amountU32);','amountU32 = Math.min(80, amountU32); const amountSigned = signed32(amountU32);'],
    ['minimum30','const amountSigned = signed32(amountU32);','amountU32 = Math.max(30, amountU32); const amountSigned = signed32(amountU32);'],
    ['jg-to-jge trace','rngLow16 > 80','rngLow16 >= 80'],
  ];
  for(const [label,before,after] of substitutions){assert.equal(original.split(before).length-1,1,label);const modified=original.replace(before,after).replace(/^import source .*;$/m,`const source = ${JSON.stringify(source)};`);const js=stripTypeScriptTypes(modified,{mode:'strip'}).replaceAll('export ','');const fn=new Function(js+'\nreturn calculateSearchGoldCallerProjection;')();assert.throws(()=>controls(fn),undefined,label);}
  assert.equal(substitutions.length,18);
});
test('search gold remains pure and does not integrate a new command or RNG',()=>{
  const random=Math.random;Math.random=()=>{throw Error('must not consume RNG');};
  try{controls(calculate);}finally{Math.random=random;}
  let session=createSession(syntheticScenario());const before=canonical(session);
  for(const [request] of anchors)calculate(request);assert.equal(canonical(session),before);
  for(const type of ['SearchGold','SearchGoldCallerProjection','Search','Explore','FindGold']){const r=dispatch(session,{type});assert.equal(r.result.ok,false);assert.strictEqual(r.session,session);}
  session=dispatch(session,{type:'EndTurn'}).session;assert.deepEqual(loadGame(saveGame(session)),session);assert.deepEqual(replaySession(session),session);
});

test('prototype pollution cannot fabricate missing captures or invoke inherited getters',()=>{
  const cases=[['secondRead',{value:{gold:0,capacity:500}},input(80,100,0),'second-read-required'],
    ['firstGold',{value:0},(()=>{const v=input();delete v.firstGold;return v;})(),'invalid-input'],
    ['gold',{value:0},input(80,100,0,{capacity:500}),'invalid-second-read']];
  for(const [key,value,request,reason] of cases){
    const previous=Object.getOwnPropertyDescriptor(Object.prototype,key);
    try{Object.defineProperty(Object.prototype,key,{value,configurable:true});const r=calculate(request);assert.equal(r.supported,false);assert.equal(r.reason,reason);}
    finally{if(previous)Object.defineProperty(Object.prototype,key,previous);else delete Object.prototype[key];}
  }
  const previous=Object.getOwnPropertyDescriptor(Object.prototype,'secondRead');let invoked=0;
  try{Object.defineProperty(Object.prototype,'secondRead',{get(){invoked++;throw Error('inherited descriptor getter');},configurable:true});assert.equal(calculate(input(80,100,0)).reason,'second-read-required');assert.equal(calculate(input()).supported,true);assert.equal(invoked,0);}
  finally{if(previous)Object.defineProperty(Object.prototype,'secondRead',previous);else delete Object.prototype.secondRead;}
});

test('polluted descriptor value cannot turn accessors into data captures',()=>{
  const requests=[];
  for(const setter of [false,true]){
    const request=input();Object.defineProperty(request,'rngEax',setter?{set(){throw Error('setter');}}:{get(){throw Error('getter');}});requests.push([request,'invalid-input']);
    const second={gold:0,capacity:500};Object.defineProperty(second,'gold',setter?{set(){throw Error('nested setter');}}:{get(){throw Error('nested getter');}});requests.push([input(80,100,0,second),'invalid-second-read']);
  }
  const prior=Object.getOwnPropertyDescriptor(Object.prototype,'value');
  try{Object.defineProperty(Object.prototype,'value',{value:30,configurable:true});for(const [request,reason] of requests){const r=calculate(request);assert.equal(r.supported,false);assert.equal(r.reason,reason);}}
  finally{delete Object.prototype.value;if(prior)Object.defineProperty(Object.prototype,'value',prior);}
});
