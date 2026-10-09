import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { PRODUCTION_QUANTITY as profile, calculateProductionQuantity as calculate,
  createSession, syntheticScenario, canonical, dispatch, saveGame, loadGame, replaySession } from '../src/index.ts';
import { calculateProductionQuantity as directCalculate } from '../src/production-quantity.ts';

const PROFILE = 'production-quantity-resolved-f32-v1';
const slot = (intelligenceGetterEax,skillHelperEax=0) => ({intelligenceGetterEax,skillHelperEax});
const early = nativeEquipmentType => ({profile:PROFILE,nativeEquipmentType});
const input = (slots=[slot(1),slot(1),null],bits='3F800000',difficultyWord=0,cityVirtualEax=0,nativeEquipmentType=1) => ({
  ...early(nativeEquipmentType),slots,resolvedFacilityFactorBits:bits,difficultyWord,
  ...(difficultyWord===2?{cityVirtualEax}:{})
});
function frozen(value) {
  if (value !== null && typeof value === 'object') {
    assert.ok(Object.isFrozen(value)); for (const child of Object.values(value)) frozen(child);
  }
}
const anchors = [
  [input([null,slot(100),null]),2000], [input([null,null,slot(0)]),1000],
  [input([slot(256),null,null]),1000], [input([slot(257),null,null]),1010],
  [input([slot(0,256),null,null]),2000], [input([slot(1),slot(1),null],'3FC00000'),1522],
  [input([slot(1,1),slot(1),null],'3FC00000'),3045],
  [input([slot(1),slot(1),null],'3FC00000',2),3044],
  [input([slot(100,1),slot(100),slot(100)],'3FC00000',2),18000],
  [input([slot(255,1),slot(255),slot(255)],'3FC00000',2),36600],
  [input([slot(100,1),slot(100,1),slot(100,1)],'3F99999A',2),14400],
  [input([slot(1,2),slot(1),null],'3FC00000',2,256),3045],
  [input([slot(10),slot(100,1),slot(255)],'3F800000'),8200],
  [input([slot(1,256),slot(1),null],'3FC00000',2,0x80000000),3045],
];
function controls(fn) {
  for (const [request,want] of anchors) {
    const got=fn(request);assert.equal(got.supported,true);assert.equal(got.returnedQuantity,want);
  }
  for(const type of [-2147483648,-1,12,2147483647]) assert.equal(fn(early(type)).returnedQuantity,0);
  for(const type of [5,6,7,8,9,10,11]) assert.equal(fn(early(type)).returnedQuantity,1);
}

test('production quantity public export and immutable conditional evidence remain explicit', () => {
  assert.strictEqual(calculate,directCalculate);assert.equal(profile.profileId,PROFILE);
  assert.equal(profile.level,'source-listing-reconstruction');assert.equal(profile.stockOriginalVerified,false);
  assert.equal(profile.originalExecutableExecuted,false);assert.equal(profile.evidence.commandIntegrated,false);
  assert.equal(profile.source.commit,'66e167e40c3440929ec016f3872aefc3486434c1');
  assert.equal(profile.source.gitBlobSha1,'e8c0c22e68e8557b202088290d52101abb02ca3a');
  assert.equal(profile.originalListing.instructionCount,88);assert.equal(profile.originalListing.byteLength,254);
  frozen(profile);const result=calculate(input());assert.strictEqual(result.evidence,profile.evidence);frozen(result);
});

test('quantity preserves late valid slots, uint8 AL, full helper EAX and ordered skill/float/super operations', () => controls(calculate));

test('quantity native type branches are closed and skill query IDs preserve -1/80/81', () => {
  for(const type of [-2147483648,-1,12,2147483647,5,6,7,8,9,10,11]) {
    const result=calculate(early(type));assert.equal(result.supported,true);assert.equal(result.resolvedInputsObserved,false);
    assert.equal(result.reason,type<0||type>11?'native-invalid-type-return-zero':'single-item-return-one');
    assert.deepEqual(Object.keys(result).sort(),['evidence','nativeEquipmentType','profile','reason','resolvedInputsObserved','returnedQuantity','supported']);
    const accessor=early(type);Object.defineProperty(accessor,'slots',{get(){throw Error('must not read early slots');}});
    assert.equal(calculate(accessor).reason,'unexpected-field');
  }
  for(let type=0;type<5;type++) {
    const result=calculate(input([slot(0,256),null,null],'3F800000',0,0,type));
    assert.equal(result.skillQueryId,type===0?-1:type===4?81:80);
    assert.equal(result.returnedQuantity,2000);assert.equal(result.skillApplied,true);
  }
});

test('all seven validity masks and 256 AL values preserve whole three-slot scan and helper-high-bit distinctions', () => {
  for(let mask=1;mask<8;mask++)for(let value=0;value<256;value++) {
    const slots=[0,1,2].map(i=>(mask&(1<<i))?slot((0x80000100+value)>>>0,i===2?256:0):null);
    const result=calculate(input(slots));assert.equal(result.supported,true);
    const count=slots.filter(s=>s!==null).length;
    assert.equal(result.validSlotCount,count);assert.equal(result.intelligenceSum,value*count);assert.equal(result.intelligenceMax,value);
    assert.equal(result.skillApplied,(mask&4)!==0);
    assert.equal(result.baseQuantity,(value+count*value+200)*5);
    for(const item of result.slots)if(item)assert.equal(item.intelligenceAl,value);
  }
  for(const high of [0,0x100,0x12345600,0x7fffff00,0x80000000,0xffffff00])for(let low=0;low<256;low++) {
    const raw=(high+low)>>>0;
    const got=calculate(input([slot(raw,raw),null,null]));
    assert.equal(got.intelligenceMax,low);assert.equal(got.skillApplied,raw!==0);
  }
  for(const permutation of [[slot(255,1),slot(1),null],[null,slot(255,1),slot(1)],[slot(1),null,slot(255,1)]])
    assert.equal(calculate(input(permutation)).returnedQuantity,7110);
});

test('difficulty compares the whole word and invokes the city virtual only at exactly two', () => {
  for(const difficulty of [0,1,3,0x80000000,0xffffffff]) {
    const request=input(undefined,'3FC00000',difficulty);
    const result=calculate(request);assert.equal(result.returnedQuantity,1522);
    assert.equal(result.cityVirtualObserved,false);assert.equal(result.cityVirtualEax,null);assert.equal(result.superApplied,false);
    assert.equal(calculate({...request,cityVirtualEax:0}).reason,'unexpected-field');
  }
  for(const eax of [0,1,256,0x80000000,0xffffffff]) {
    const result=calculate(input(undefined,'3FC00000',2,eax));
    assert.equal(result.cityVirtualObserved,true);assert.equal(result.cityVirtualEax,eax);
    assert.equal(result.superApplied,eax===0);assert.equal(result.returnedQuantity,eax===0?3044:1522);
  }
});

test('quantity closed records reject unsupported domains without accessor execution or fabricated native zero', () => {
  function reject(value,reason) {
    const result=calculate(value);assert.equal(result.supported,false);if(reason)assert.equal(result.reason,reason);
    assert.deepEqual(Object.keys(result).sort(),['evidence','reason','supported']);frozen(result);
  }
  for(const value of [undefined,null,false,1,'',[],()=>1,new Date(),Object.create(input())]) reject(value,'invalid-input');
  for(const key of Object.keys(input())) {
    const missing=input();delete missing[key];reject(missing);
    const getter=input();Object.defineProperty(getter,key,{get(){throw Error('top accessor executed');}});reject(getter);
  }
  for(const key of ['city','officers','facilityLevel','politics','fame','specialty','mod','nativePointer','extra'])reject({...input(),[key]:1},'unexpected-field');
  reject({...input(),[Symbol('extra')]:1},'unexpected-field');
  for(const value of [undefined,null,'1',true,{},[],1n,NaN,Infinity,-Infinity,1.5,-2147483649,2147483648])
    reject({...input(),nativeEquipmentType:value},'invalid-native-equipment-type');
  for(const value of [undefined,null,'','S1','PK1.1','stock','production-quantity-resolved-f32-v2'])reject({...input(),profile:value},'unsupported-profile');
  for(const value of [undefined,null,-1,1.5,'2',true,{},[],1n,NaN,Infinity,4294967296]) {
    reject({...input(),difficultyWord:value},'invalid-difficulty-word');
    reject({...input(undefined,'3F800000',2),cityVirtualEax:value},'invalid-city-virtual-eax');
    for(const key of ['intelligenceGetterEax','skillHelperEax'])reject(input([{...slot(1),[key]:value},null,null]),'invalid-slot');
  }
  const noVirtual=input(undefined,'3F800000',2);delete noVirtual.cityVirtualEax;reject(noVirtual,'invalid-input');
  for(const bits of [undefined,null,1,1.2,1.5,0x3f99999a,'3f99999a','0x3F99999A','3F999999','7F800000','7FC00000','BF800000','00000000','3F800001',{},[]])
    reject({...input(),resolvedFacilityFactorBits:bits},'unsupported-facility-factor-bits');
  for(const slots of [null,{},[],[null],[slot(1),null],[slot(1),null,null,null],Array(3),Object.assign([slot(1),null,null],{extra:1})])
    reject({...input(),slots},'invalid-slots');
  const getterArray=[slot(1),null,null];Object.defineProperty(getterArray,'1',{get(){throw Error('array accessor executed');}});reject(input(getterArray),'invalid-slots');
  const symbolArray=[slot(1),null,null];symbolArray[Symbol('extra')]=0;reject(input(symbolArray),'invalid-slots');
  for(const value of [undefined,false,1,'',[],Object.create(slot(1)),{intelligenceGetterEax:1},{...slot(1),extra:0}])reject(input([value,null,null]),'invalid-slot');
  for(const key of ['intelligenceGetterEax','skillHelperEax']) {
    const accessor=slot(1);Object.defineProperty(accessor,key,{get(){throw Error('slot accessor executed');}});reject(input([accessor,null,null]),'invalid-slot');
  }
  reject(input([null,null,null]),'no-valid-slot');
  const nullRecord=Object.assign(Object.create(null),input([Object.assign(Object.create(null),slot(1)),null,null]));
  assert.equal(calculate(nullRecord).returnedQuantity,1010);
});

test('quantity receipts are deep-frozen detached snapshots and leave command/save/replay state untouched', () => {
  const request=input(),before=JSON.stringify(request),result=calculate(request);
  assert.equal(JSON.stringify(request),before);assert.deepEqual(result,calculate(request));frozen(result);
  request.slots[0].intelligenceGetterEax=255;request.slots[1]=null;request.difficultyWord=2;
  assert.equal(result.slots[0].intelligenceGetterEax,1);assert.equal(result.slots[1].intelligenceGetterEax,1);
  assert.equal(result.returnedQuantity,1015);assert.throws(()=>{result.slots[0].intelligenceAl=255;},TypeError);
  let session=createSession(syntheticScenario());const previous=canonical(session);
  calculate(input());assert.equal(canonical(session),previous);
  for(const type of ['Produce','Production','ProductionQuantity','ProductionStock']) {
    const next=dispatch(session,{type});assert.equal(next.result.ok,false);assert.strictEqual(next.session,session);
  }
  session=dispatch(session,{type:'EndTurn'}).session;
  assert.deepEqual(loadGame(saveGame(session)),session);assert.deepEqual(replaySession(session),session);
});

test('actual quantity control-flow and arithmetic mutants are killed by independent literal anchors', async () => {
  const raw=fs.readFileSync(new URL('../src/production-quantity.ts',import.meta.url),'utf8');
  const first=raw.split('\n')[0];assert.match(first,/^import source from /);
  const source=raw.replace(first,`const source = ${JSON.stringify(profile)};`);
  const load=text=>import(`data:text/javascript;base64,${Buffer.from(stripTypeScriptTypes(text)).toString('base64')}`);
  const control=await load(source);controls(control.calculateProductionQuantity);
  const mutations=[
    ['native-single-item','returnedQuantity: invalid ? 0 : 1','returnedQuantity: invalid ? 0 : 0'],
    ['first-slot-gate','if (validSlotCount === 0)','if (snapshot[0] === null || validSlotCount === 0)'],
    ['getter-eax-not-al','intelligenceGetterEax & 0xff','intelligenceGetterEax'],
    ['getter-cap100','intelligenceGetterEax & 0xff','Math.min(100, intelligenceGetterEax & 0xff)'],
    ['helper-al-not-eax','skillHelperEax !== 0','(skillHelperEax & 0xff) !== 0'],
    ['helper-one-only','skillHelperEax !== 0','skillHelperEax === 1'],
    ['base-round-other-half','(intelligenceMax + intelligenceSum + 200) * 5','(intelligenceMax + 100 + Math.floor((intelligenceSum - intelligenceMax) / 2)) * 10'],
    ['skill-after-convert','Math.trunc(skillAdjustedQuantity * factor)','Math.trunc(baseQuantity * factor) * (skillApplied ? 2 : 1)'],
    ['float-round','Math.trunc(skillAdjustedQuantity * factor)','Math.round(skillAdjustedQuantity * factor)'],
    ['super-before-convert','const returnedQuantity = superApplied ? convertedQuantity * 2 : convertedQuantity;','const returnedQuantity = superApplied ? Math.trunc(skillAdjustedQuantity * factor * 2) : convertedQuantity;'],
    ['virtual-al-not-eax','cityVirtualEax === 0','(cityVirtualEax & 0xff) === 0'],
    ['cap9000','const returnedQuantity = superApplied ? convertedQuantity * 2 : convertedQuantity;','const returnedQuantity = Math.min(9000, superApplied ? convertedQuantity * 2 : convertedQuantity);'],
    ['minimum1010','(intelligenceMax + intelligenceSum + 200) * 5','Math.max(1010, (intelligenceMax + intelligenceSum + 200) * 5)'],
    ['miss-later-intelligence','intelligenceSum += intelligenceAl','intelligenceSum = intelligenceAl'],
  ];
  for(const [name,from,to] of mutations) {
    controls(control.calculateProductionQuantity);assert.equal(raw.split(from).length,2,`unique mutation ${name}`);
    const mutant=await load(raw.replace(from,to).replace(first,`const source = ${JSON.stringify(profile)};`));assert.throws(()=>controls(mutant.calculateProductionQuantity),{name:'AssertionError'},name);
  }
});
