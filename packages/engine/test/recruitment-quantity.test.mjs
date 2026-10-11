import test from 'node:test';
import assert from 'node:assert/strict';
import {RECRUITMENT_QUANTITY, calculateRecruitmentQuantityProjection as calc,
  canonical, createSession, syntheticScenario, saveGame, loadGame, replaySession} from '../src/index.ts';
import {calculateRecruitmentQuantityProjection as direct} from '../src/recruitment-quantity.ts';

const profile = 'recruitment-quantity-observations-f32-v1';
const call = (callAddress, eax, slotIndex) => ({callAddress, ...(slotIndex === undefined ? {} : {slotIndex}), eax});
const gateCalls = [call('005C3619',1), call('005C3630',1), call('005C3643',0), call('005C364B',1)];
function request({validity=[1,1,1], charisma=[100,100,100], skill=[0,0,0],
  savedSecurityByte=100, resolvedFacilityFactorBits='3F800000', difficultyWord=0,
  virtual=0, pressure=0, first=[0,0x7fffffff], second}={}) {
  const captures = structuredClone(gateCalls);
  for (let i=0;i<3;i++) {
    captures.push(call('005C367B',validity[i],i));
    if (validity[i] !== 0) captures.push(call('005C3689',charisma[i],i),call('005C36AA',skill[i],i));
  }
  if (difficultyWord===2) captures.push(call('005C3725',virtual));
  captures.push(call('005C3738',pressure),call('005C374E',first[0]),call('005C3757',first[1]));
  if (second) captures.push(call('005C3764',second[0]),call('005C376B',second[1]));
  return {profile,captures,savedSecurityByte,resolvedFacilityFactorBits,difficultyWord};
}
function early(which) {
  const captures=structuredClone(gateCalls.slice(0,[1,2,4][which]));
  captures.at(-1).eax=0;
  return {profile,captures};
}
function frozen(value) {
  if (value!==null && typeof value==='object') {
    assert.ok(Object.isFrozen(value));
    for (const item of Object.values(value)) frozen(item);
  }
}
function reject(input, reason) {
  const r=calc(input);
  assert.equal(r.supported,false);
  if (reason) assert.equal(r.reason,reason);
  assert.deepEqual(Object.keys(r).sort(),['evidence','reason','supported']);
  assert.strictEqual(r.evidence,RECRUITMENT_QUANTITY.evidence);
  frozen(r);
}
const stages = ['charismaSum','validSlotCount','skillParameter','baseQuantity','integerQuantity',
  'savedSecurityByte','resolvedFacilityFactorBits','difficultyWord','convertedQuantity','cityVirtualEax',
  'afterSuperU32','pressureEax','afterPressureU32','firstTroopsEax','firstCapacityEax','firstSumU32',
  'secondTroopsEax','secondCapacityEax'];

test('recruitment exports frozen conditional source evidence without command/helper claims',()=>{
  assert.strictEqual(calc,direct);
  assert.equal(RECRUITMENT_QUANTITY.profileId,profile);
  assert.equal(RECRUITMENT_QUANTITY.level,'source-listing-reconstruction');
  assert.equal(RECRUITMENT_QUANTITY.stockOriginalVerified,false);
  assert.equal(RECRUITMENT_QUANTITY.originalExecutableExecuted,false);
  assert.equal(RECRUITMENT_QUANTITY.evidence.commandIntegrated,false);
  assert.equal(RECRUITMENT_QUANTITY.source.gitBlobSha1,'0b122837b1ff1ae11789121595531b64e80ff8d2');
  assert.equal(RECRUITMENT_QUANTITY.originalListing.instructionCount,131);
  assert.equal(RECRUITMENT_QUANTITY.originalListing.byteLength,373);
  frozen(RECRUITMENT_QUANTITY);
  const r=calc(request());assert.equal(r.supported,true);assert.strictEqual(r.evidence,RECRUITMENT_QUANTITY.evidence);
});

test('all early gates return zero with exactly 1/2/4 calls and no fabricated numeric stages',()=>{
  for (let i=0;i<3;i++) {
    const q=early(i),r=calc(q);
    assert.equal(r.supported,true);assert.equal(r.reason,['facility-invalid','first-slot-invalid','city-invalid'][i]);
    assert.equal(r.returnedValue,0);assert.equal(r.rawEaxU32,0);
    assert.deepEqual(r.slots,[]);assert.deepEqual(r.trace,q.captures);assert.equal(r.callDetails.length,[1,2,4][i]);
    for (const key of stages) assert.equal(r[key],null,key);
    for (const key of ['superApplied','pressureApplied','capacityFallbackApplied']) assert.equal(r[key],false);
    for (const key of ['savedSecurityByte','resolvedFacilityFactorBits','difficultyWord'])
      reject({...q,[key]:undefined},'unexpected-field');
    reject({...q,captures:[...q.captures,call('005C3738',0)]},'capture-sequence-mismatch');
    frozen(r);
  }
});

test('full EAX gates pass at 256/FFFFFFFF and resolver is opaque even when zero',()=>{
  for (const eax of [256,0xffffffff]) for (const resolver of [0,1,0xffffffff]) {
    const q=request();for(const i of [0,1,3])q.captures[i].eax=eax;q.captures[2].eax=resolver;
    const r=calc(q);assert.equal(r.supported,true);assert.equal(r.returnedValue,2800);assert.equal(r.trace[2].eax,resolver);
  }
  const q=early(2);q.captures[2].eax=0xffffffff;assert.equal(calc(q).reason,'city-invalid');
});

test('initial first-slot gate is independent and all eight later validity masks are supported',()=>{
  for (let mask=0;mask<8;mask++) {
    const validity=[0,1,2].map(i=>(mask>>i)&1),q=request({validity}),r=calc(q);
    const count=validity.reduce((a,b)=>a+b,0);
    assert.equal(r.supported,true);assert.equal(r.validSlotCount,count);assert.equal(r.charismaSum,100*count);
    assert.equal(r.baseQuantity,1000+600*count);assert.equal(r.integerQuantity,1000+600*count);
    assert.equal(r.slots.length,3);
    for (let i=0;i<3;i++) {
      assert.equal(r.slots[i].slotIndex,i);assert.equal(r.slots[i].validityEax,validity[i]);
      assert.equal(r.slots[i].charismaEax,validity[i]?100:null);
      assert.equal(r.slots[i].charismaAl,validity[i]?100:null);assert.equal(r.slots[i].skillEax,validity[i]?0:null);
    }
    assert.deepEqual(r.trace,q.captures);
  }
  const r=calc(request({validity:[0,0,0]}));assert.equal(r.returnedValue,1000);assert.equal(r.skillParameter,10);
  const q=request({validity:[0,1,1]});q.captures[1].eax=0;reject(q,'capture-sequence-mismatch');
});

test('all validity/skill masks preserve later calls, query 4F and the 19-input/21-call maximum',()=>{
  for (let validMask=0;validMask<8;validMask++) for(let skillMask=0;skillMask<8;skillMask++)
    for(const difficultyWord of [0,2]) for(const clips of [false,true]) {
      const validity=[0,1,2].map(i=>(validMask>>i)&1),skill=[0,1,2].map(i=>((skillMask>>i)&1)?256:0);
      const q=request({validity,skill,difficultyWord,...(clips?{first:[100,0],second:[0,10000]}:{})}),r=calc(q);
      const count=validity.reduce((a,b)=>a+b,0),d=Number(difficultyWord===2),c=Number(clips);
      assert.equal(r.supported,true);assert.equal(r.skillParameter,(validMask&skillMask)?15:10);
      assert.equal(r.trace.length,10+2*count+d+2*c);assert.equal(r.callDetails.length,12+2*count+d+2*c);
      assert.deepEqual(r.trace,q.captures);
      const skills=r.callDetails.filter(x=>x.callAddress==='005C36AA');assert.equal(skills.length,count);
      for(const item of skills)assert.equal(item.queryId,79);
      assert.equal(r.capacityFallbackApplied,clips);
    }
  const q=request({difficultyWord:2,first:[100,0],second:[0,10000]}),r=calc(q);
  assert.equal(q.captures.length,19);assert.equal(r.callDetails.length,21);
});

test('charisma consumes AL only while validity and skill consume full EAX',()=>{
  const r=calc(request({validity:[256,0xffffffff,1],charisma:[256,257,0xffffffff],skill:[256,0,0]}));
  assert.equal(r.charismaSum,256);assert.equal(r.skillParameter,15);
  assert.deepEqual(r.slots.map(x=>x.charismaAl),[0,1,255]);
  assert.deepEqual(r.slots.map(x=>x.charismaEax),[256,257,0xffffffff]);
  for(const high of [0,0x100,0x123400,0x80000000,0xffffff00]) for(let low=0;low<256;low++) {
    const raw=high+low,q=request({validity:[0,1,0],charisma:[0,raw,0],skill:[0,raw,0]}),v=calc(q);
    assert.equal(v.charismaSum,low);assert.equal(v.slots[1].charismaEax,raw);assert.equal(v.skillParameter,raw===0?10:15);
  }
});

test('integer stages use saved unsigned security and preserve skill-before-FIMUL truncation',()=>{
  for(const [charm,want] of [[4,1807],[5,1808]]) {
    const r=calc(request({savedSecurityByte:0,charisma:[charm,0,0],skill:[1,0,0],resolvedFacilityFactorBits:'3F99999A'}));
    assert.equal(r.baseQuantity,1000+charm);assert.equal(r.integerQuantity,charm===4?1506:1507);
    assert.equal(r.convertedQuantity,want);assert.equal(r.returnedValue,want);
  }
  for(const security of [0,1,127,128,254,255]) for(const charisma of [[0,0,0],[1,0,0],[19,0,0],[20,0,0],[255,255,255]])
    for(const skill of [[0,0,0],[0,0,256]]) {
      const r=calc(request({savedSecurityByte:security,charisma,skill}));
      const a=1000+Math.floor((security+20)*charisma.reduce((x,y)=>x+y,0)/20);
      assert.equal(r.baseQuantity,a);assert.equal(r.integerQuantity,Math.floor(a*(skill[2]?15:10)/10));
      assert.equal(r.savedSecurityByte,security);
    }
  const max=calc(request({savedSecurityByte:255,charisma:[255,255,255],skill:[1,0,0],resolvedFacilityFactorBits:'3FC00000',difficultyWord:2}));
  assert.equal(max.baseQuantity,11518);assert.equal(max.integerQuantity,17277);assert.equal(max.convertedQuantity,25915);
  assert.equal(max.afterSuperU32,51830);assert.equal(max.returnedValue,51830);
});

test('all supported binary32 identities produce explicit supplier and derived conversion receipts',()=>{
  for(const [bits,want] of [['3F800000',1001],['3F99999A',1201],['3FC00000',1501]]) {
    const q=request({savedSecurityByte:0,charisma:[1,0,0],resolvedFacilityFactorBits:bits}),r=calc(q);
    assert.equal(r.resolvedFacilityFactorBits,bits);assert.equal(r.convertedQuantity,want);
    const index=r.callDetails.findIndex(x=>x.callAddress==='005C36C8');
    assert.deepEqual(r.callDetails[index],{callAddress:'005C36C8',target:'005C3550',slotIndex:null,queryId:null,kind:'captured-st0-f32',eax:null,st0Bits:bits});
    assert.deepEqual(r.callDetails[index+1],{callAddress:'005C3710',target:'00707A74',slotIndex:null,queryId:null,kind:'derived-converter-eax',eax:want,st0Bits:null});
    assert.ok(!r.trace.some(x=>['005C36C8','005C3710'].includes(x.callAddress)));
    for(const site of ['005C36C8','005C3710']) {
      const extra=structuredClone(q);extra.captures.splice(index,0,call(site,want));reject(extra,'capture-sequence-mismatch');
    }
  }
});

test('difficulty is the post-conversion full word and city virtual is conditional full EAX',()=>{
  for(const difficultyWord of [0,1,2,3,258,0x80000000,0xffffffff]) for(const virtual of [0,256,0xffffffff]) {
    const r=calc(request({difficultyWord,virtual}));
    assert.equal(r.supported,true);assert.equal(r.cityVirtualEax,difficultyWord===2?virtual:null);
    assert.equal(r.superApplied,difficultyWord===2&&virtual===0);assert.equal(r.afterSuperU32,r.superApplied?5600:2800);
    assert.equal(r.callDetails.filter(x=>x.callAddress==='005C3725').length,Number(difficultyWord===2));
  }
  let q=request();q.captures.splice(-3,0,call('005C3725',0));reject(q,'capture-sequence-mismatch');
  q=request({difficultyWord:2});q.captures=q.captures.filter(x=>x.callAddress!=='005C3725');reject(q,'capture-sequence-mismatch');
});

test('super precedes pressure on an odd converted quantity and pressure uses full EAX',()=>{
  for(const pressure of [0,1,256,0x80000000,0xffffffff]) {
    const base={savedSecurityByte:0,charisma:[1,0,0],resolvedFacilityFactorBits:'3FC00000',pressure};
    const normal=calc(request(base)),superResult=calc(request({...base,difficultyWord:2}));
    assert.equal(normal.convertedQuantity,1501);assert.equal(normal.afterPressureU32,pressure?750:1501);
    assert.equal(superResult.afterSuperU32,3002);assert.equal(superResult.afterPressureU32,pressure?1501:3002);
    assert.equal(normal.pressureEax,pressure);assert.equal(normal.pressureApplied,pressure!==0);
  }
});

test('capacity equality and wrapping ADD use signed JGE, not unsigned/min arithmetic',()=>{
  for(const [first,rawSum] of [ [[100,1100],1100], [[0x7fffffff,0x7fffffff],2147484647],
    [[0xffffffff,999],999], [[0x80000000,0],2147484648], [[0x80000000,0x800003e8],2147484648] ]) {
    const r=calc(request({validity:[0,0,0],first}));
    assert.equal(r.supported,true);assert.equal(r.firstSumU32,rawSum);assert.equal(r.capacityFallbackApplied,false);
    assert.equal(r.returnedValue,1000);assert.equal(r.secondTroopsEax,null);assert.equal(r.secondCapacityEax,null);
    assert.equal(r.trace.at(-1).callAddress,'005C3757');
  }
  const q=request({validity:[0,0,0],first:[100,1100],second:[100,1100]});reject(q,'capture-sequence-mismatch');
});

test('fallback independently repeats both getters, wraps SUB and never clamps the result',()=>{
  for(const [second,want] of [ [[0,10000],10000], [[100,0],-100], [[0xffffffff,0],1],
    [[0,0x80000000],-2147483648], [[0,0x7fffffff],2147483647], [[1,0],-1], [[0,0],0] ]) {
    const q=request({validity:[0,0,0],first:[100,0],second}),r=calc(q);
    assert.equal(r.supported,true);assert.equal(r.capacityFallbackApplied,true);assert.equal(r.returnedValue,want);
    assert.equal(r.rawEaxU32,want>>>0);assert.equal(r.secondTroopsEax,second[0]);assert.equal(r.secondCapacityEax,second[1]);
    assert.deepEqual(r.trace.slice(-2).map(x=>x.callAddress),['005C3764','005C376B']);
  }
  const r=calc(request({validity:[0,0,0],first:[0,0x80000000],second:[0,0x80000000]}));
  assert.equal(r.returnedValue,-2147483648);assert.equal(r.capacityFallbackApplied,true);
});

test('captured EAX details preserve exact targets, slots and typed null fields',()=>{
  const q=request({difficultyWord:2,first:[100,0],second:[0,10000]}),r=calc(q);
  const targets={'005C3619':'0047A630','005C3630':'0047A630','005C3643':'004866F0','005C364B':'0047A630',
    '005C367B':'0047A630','005C3689':'004890B0','005C36AA':'004890F0','005C3725':'vtable+0x48',
    '005C3738':'004B99B0','005C374E':'vtable+0x50','005C3757':'00486BC0','005C3764':'vtable+0x50','005C376B':'00486BC0'};
  const details=r.callDetails.filter(x=>x.kind==='captured-eax');
  for(let i=0;i<details.length;i++) {
    const c=q.captures[i];assert.deepEqual(details[i],{callAddress:c.callAddress,target:targets[c.callAddress],
      slotIndex:c.slotIndex??null,queryId:c.callAddress==='005C36AA'?79:null,kind:'captured-eax',eax:c.eax,st0Bits:null});
  }
});

test('every missing, duplicate, wrong-site, reordered and wrong-slot observation rejects',()=>{
  for(const good of [request(),request({difficultyWord:2,first:[100,0],second:[0,10000]})]) {
    for(let i=0;i<good.captures.length;i++) {
      let q=structuredClone(good);q.captures.splice(i,1);reject(q);
      q=structuredClone(good);q.captures.splice(i,0,structuredClone(q.captures[i]));reject(q);
      q=structuredClone(good);q.captures[i].callAddress='00000000';reject(q);
      q=structuredClone(good);q.captures[i].slotIndex=q.captures[i].slotIndex===undefined?0:(q.captures[i].slotIndex+1)%3;reject(q);
      if(i+1<good.captures.length) {
        q=structuredClone(good);[q.captures[i],q.captures[i+1]]=[q.captures[i+1],q.captures[i]];reject(q);
      }
    }
  }
  const q=request({validity:[0,0,0]});q.captures.splice(5,0,call('005C3689',100,0));reject(q);
});

test('closed top-level fields reject invalid JSON/non-JSON values without coercion',()=>{
  for(const value of [undefined,null,false,1,'',[],()=>1,new Date(),new Map(),Object.create(request())]) reject(value,'invalid-input');
  for(const field of Object.keys(request())) {const q=request();delete q[field];reject(q);}
  for(const value of [null,undefined,'other',1,true,{},[],1n]) reject({...request(),profile:value},'unsupported-profile');
  for(const value of [null,undefined,'0',true,{},[],1n,NaN,Infinity,-Infinity,-1,1.5,256,0xffffffff])
    reject({...request(),savedSecurityByte:value},'invalid-saved-security-byte');
  for(const value of [null,undefined,'2',true,{},[],1n,NaN,Infinity,-Infinity,-1,1.5,4294967296])
    reject({...request(),difficultyWord:value},'invalid-difficulty-word');
  for(const value of [null,undefined,1,1.2,1.5,0x3f99999a,'3f99999a','0x3F99999A','3F800001','7F800000','7FC00000','00000000','BF800000',{},[]])
    reject({...request(),resolvedFacilityFactorBits:value},'unsupported-facility-factor-bits');
  for(const key of ['extra','slots','meritWords','facilityLevel','city','nativePointer','securityAfterSupplier','initialDifficultyWord','converterEax','cityVirtualEax','distance','seed',Symbol('extra')])
    reject({...request(),[key]:0},'unexpected-field');
});

test('captures require dense plain arrays, exact data properties, uint32 and canonical sites',()=>{
  for(const captures of [undefined,null,{},'',new Uint32Array(1),new Set(),Array(1),Array(20),Object.assign([], {extra:1})])
    reject({...request(),captures},'invalid-captures');
  for(const prototype of [null,{}]) {
    const q=request();Object.setPrototypeOf(q.captures,prototype);reject(q,'invalid-captures');
  }
  class ExoticArray extends Array {}
  reject({...request(),captures:new ExoticArray(...request().captures)},'invalid-captures');
  for(const value of [undefined,null,false,1,'',[],new Date(),Object.create({callAddress:'005C3619',eax:1})]) {
    const q=request();q.captures[0]=value;reject(q,'invalid-captures');
  }
  for(const value of [undefined,null,false,'1',1n,-1,4294967296,NaN,Infinity,-Infinity,1.1]) {
    const q=request();q.captures[0].eax=value;reject(q,'invalid-captures');
  }
  for(const value of [undefined,null,1,'5C3619','0x005C3619','005c3619','005C361G','005C3619 ']) {
    const q=request();q.captures[0].callAddress=value;reject(q,'invalid-captures');
  }
  for(const value of [undefined,null,false,'0',0n,-1,3,NaN,Infinity,0.5]) {
    const q=request();q.captures[4].slotIndex=value;reject(q,'invalid-captures');
  }
  for(const key of ['extra',Symbol('extra')]) {
    let q=request();q.captures[key]=1;reject(q,'invalid-captures');
    q=request();q.captures[0][key]=1;reject(q,'invalid-captures');
  }
  for(const key of ['callAddress','eax']) {const q=request();delete q.captures[0][key];reject(q,'invalid-captures');}
  let q=request();delete q.captures[4].slotIndex;reject(q,'invalid-captures');
  q=request();delete q.captures[0];reject(q,'invalid-captures');
  q=request();q.captures[0].slotIndex=undefined;reject(q,'invalid-captures');
});

test('ordinary accessor properties are rejected with zero getter invocation',()=>{
  let calls=0;const getter=()=>{calls++;throw Error('getter executed');};
  for(const field of Object.keys(request())) {
    const q=request();Object.defineProperty(q,field,{get:getter});reject(q);
  }
  for(const field of ['callAddress','eax']) {
    const q=request();Object.defineProperty(q.captures[0],field,{get:getter});reject(q);
  }
  for(const field of ['callAddress','slotIndex','eax']) {
    const q=request();Object.defineProperty(q.captures[4],field,{get:getter});reject(q);
  }
  for(const field of ['0','4']) {const q=request();Object.defineProperty(q.captures,field,{get:getter});reject(q);}
  for(const key of ['savedSecurityByte','resolvedFacilityFactorBits','difficultyWord','extra',Symbol('extra')]) {
    const q=early(0);Object.defineProperty(q,key,{get:getter});reject(q);
  }
  assert.equal(calls,0);
});

test('null-prototype and nonenumerable data inputs remain accepted without freezing caller objects',()=>{
  const q=request({difficultyWord:2,first:[100,0],second:[0,10000]});
  Object.setPrototypeOf(q,null);
  for(const c of q.captures)Object.setPrototypeOf(c,null);
  Object.defineProperty(q,'profile',{value:profile,enumerable:false});
  Object.defineProperty(q.captures[0],'eax',{value:1,enumerable:false});
  const before=Object.getOwnPropertyDescriptors(q),r=calc(q);
  assert.equal(r.supported,true);assert.equal(r.returnedValue,10000);frozen(r);
  assert.deepEqual(Object.getOwnPropertyDescriptors(q),before);
  assert.equal(Object.isFrozen(q),false);assert.equal(Object.isFrozen(q.captures),false);
  for(const c of q.captures)assert.equal(Object.isFrozen(c),false);
  q.captures[0].eax=0;q.captures[4].eax=0;q.savedSecurityByte=0;
  assert.equal(r.trace[0].eax,1);assert.equal(r.slots[0].validityEax,1);assert.equal(r.savedSecurityByte,100);
  assert.throws(()=>{r.trace[0].eax=9;},TypeError);assert.throws(()=>{r.slots[0].charismaAl=9;},TypeError);
});

test('projection is repeatable and does not mutate caller input or session/save/replay state',()=>{
  const q=request(),before=structuredClone(q),r=calc(q);
  assert.deepEqual(q,before);assert.deepEqual(calc(q),r);frozen(r);
  const session=createSession(syntheticScenario()),state=canonical(session);
  calc(q);assert.equal(canonical(session),state);assert.deepEqual(loadGame(saveGame(session)),session);
  assert.deepEqual(replaySession(session),session);
});
