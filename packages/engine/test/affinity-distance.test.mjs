import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { AFFINITY_DISTANCE as profile, calculateAffinityDistance as calculate,
  createSession, syntheticScenario, canonical, dispatch, saveGame, loadGame, replaySession } from '../src/index.ts';
import { calculateAffinityDistance as directCalculate } from '../src/affinity-distance.ts';

const PROFILE = 'affinity-distance-tutorial-u8-v1';
const input = (sourceAffinityByte = 1, targetAffinityByte = 149) => ({profile: PROFILE, sourceAffinityByte, targetAffinityByte});
function frozen(value) {
  if (value !== null && typeof value === 'object') {
    assert.ok(Object.isFrozen(value)); for (const child of Object.values(value)) frozen(child);
  }
}
const anchors = [[0,0,0], [0,1,1], [1,149,2], [149,1,2], [0,74,74], [0,75,75], [0,76,74],
  [0,149,1], [0,150,0], [0,151,-1], [0,255,-105], [255,0,-105], [128,255,23], [255,255,0]];
function compare(fn, a, b) {
  const r=fn(input(a,b)); assert.equal(r.supported,true);
  const d=a>=b?a-b:b-a, c=150-d, want=d<c?d:c;
  assert.equal(r.sourceAffinityByte,a);assert.equal(r.targetAffinityByte,b);
  assert.equal(r.absoluteDifference,d);assert.equal(r.complement,c);
  assert.equal(r.signedComparisonBranch,d<75?'keep-d':'use-complement');
  assert.equal(r.returnedSigned32,want);assert.equal(r.returnedEax,want<0?4294967296+want:want);
  assert.equal(r.returnedAl,want<0?256+want:want);return r;
}
function controls(fn) {
  for (const [a,b,want] of anchors) assert.equal(compare(fn,a,b).returnedSigned32,want);
  assert.equal(fn(input(-1,0)).supported,false);assert.equal(fn(input(256,0)).supported,false);
  assert.equal(fn(input(0,-1)).supported,false);assert.equal(fn(input(0,256)).supported,false);
  assert.equal(fn({...input(),profile:'S1'}).supported,false);
}

test('affinity public export and immutable tutorial-only evidence have no machine-code or caller claim', () => {
  assert.strictEqual(calculate,directCalculate);assert.equal(profile.profileId,PROFILE);
  assert.equal(profile.evidence.level,'tutorial-source-projection');
  assert.equal(profile.evidence.opcodeBytes,null);
  for(const field of ['machineCodeVerified','stockOriginalVerified','originalExecutableExecuted','s1CallerIntegrated','loyaltyIntegrated','recruitmentIntegrated'])
    assert.equal(profile.evidence[field],false,field);
  frozen(profile);const result=calculate(input());assert.strictEqual(result.evidence,profile.evidence);frozen(result);
});

test('affinity preserves signed comparison, strict tie branch and negative signed32/EAX/AL distinctions', () => {
  controls(calculate);
  assert.equal(calculate(input(0,151)).returnedEax,0xffffffff);
  assert.equal(calculate(input(0,151)).returnedAl,255);
  assert.equal(calculate(input(0,255)).returnedEax,0xffffff97);
  assert.equal(calculate(input(0,255)).returnedAl,151);
  assert.equal(calculate(input(0,75)).signedComparisonBranch,'use-complement');
});

test('all 65536 unsigned-byte pairs preserve numerical receipt, symmetry and normal-domain boundaries', () => {
  let count=0, normal=0, negatives=0, minimum=Infinity,maximum=-Infinity;
  for(let a=0;a<256;a++)for(let b=0;b<256;b++) {
    const r=compare(calculate,a,b);assert.equal(r.returnedSigned32,calculate(input(b,a)).returnedSigned32);
    count++;negatives+=Number(r.returnedSigned32<0);minimum=Math.min(minimum,r.returnedSigned32);maximum=Math.max(maximum,r.returnedSigned32);
    if(a<150&&b<150) {normal++;assert.ok(r.returnedSigned32>=0&&r.returnedSigned32<=75);}
  }
  assert.equal(count,65536);assert.equal(normal,22500);assert.equal(negatives,11130);
  assert.equal(minimum,-105);assert.equal(maximum,75);
});

test('affinity rejects coercion, accessors, inherited and unexpected fields without a fake native EAX', () => {
  const reject=(value,reason)=>{const r=calculate(value);assert.equal(r.supported,false);assert.equal(r.reason,reason);
    assert.deepEqual(Object.keys(r).sort(),['evidence','reason','supported']);frozen(r);};
  for(const value of [null,undefined,false,0,'',[],()=>1,new Date(),Object.create(input())]) reject(value,'invalid-input');
  for(const field of ['profile','sourceAffinityByte','targetAffinityByte']) {
    const missing=input();delete missing[field];reject(missing,'invalid-input');
    const getter=input();Object.defineProperty(getter,field,{get(){throw Error('getter must not execute');}});reject(getter,'invalid-input');
  }
  for(const field of ['sourcePointer','targetPointer','personId','resolver','stock','caller','loyalty','recruitment','extra'])
    reject({...input(),[field]:1},'unexpected-field');
  reject({...input(),[Symbol('extra')]:1},'unexpected-field');
  const extra=input();Object.defineProperty(extra,'hidden',{value:1});reject(extra,'unexpected-field');
  for(const value of [undefined,null,-1,256,1.5,NaN,Infinity,-Infinity,'1',true,{},[],1n]) {
    reject({...input(),sourceAffinityByte:value},'invalid-source-affinity-byte');reject({...input(),targetAffinityByte:value},'invalid-target-affinity-byte');
  }
  for(const value of [undefined,null,0,'','S1','stock','affinity-distance-tutorial-u8-v2']) reject({...input(),profile:value},'unsupported-profile');
  assert.deepEqual(calculate(Object.assign(Object.create(null),input())),calculate(input()));
  const hidden={};for(const [key,value] of Object.entries(input()))Object.defineProperty(hidden,key,{value});
  assert.deepEqual(calculate(hidden),calculate(input()));
  assert.deepEqual(calculate(input(-0,-0)),calculate(input(0,0)));
});

test('affinity receipts are frozen deterministic snapshots with no input mutation', () => {
  const request=input(),before=JSON.stringify(request),r=calculate(request);
  assert.equal(JSON.stringify(request),before);assert.deepEqual(r,calculate(request));frozen(r);
  request.sourceAffinityByte=0;request.targetAffinityByte=255;
  assert.equal(r.sourceAffinityByte,1);assert.equal(r.targetAffinityByte,149);assert.equal(r.returnedSigned32,2);
  assert.throws(()=>{r.returnedAl=255;},TypeError);
  assert.deepEqual(calculate(Object.freeze(input())),r);
});

test('affinity does not add commands, loyalty, recruitment, Train/EndTurn or save/replay integration', () => {
  let session=createSession(syntheticScenario());const before=canonical(session);
  calculate(input());assert.equal(canonical(session),before);
  for(const type of ['AffinityDistance','NaturalLoyalty','Recruit','Recruitment']) {
    const r=dispatch(session,{type});assert.equal(r.result.ok,false);assert.strictEqual(r.session,session);
  }
  assert.equal(canonical(session),before);session=dispatch(session,{type:'EndTurn'}).session;
  assert.deepEqual(loadGame(saveGame(session)),session);assert.deepEqual(replaySession(session),session);
});

test('actual affinity arithmetic, width, tie and input-validation mutants fail controls', async () => {
  const raw=fs.readFileSync(new URL('../src/affinity-distance.ts',import.meta.url),'utf8');
  const importLine=raw.split('\n')[0];assert.match(importLine,/^import source from /);
  const source=raw.replace(importLine,`const source = ${JSON.stringify(profile)};`);
  const load=text=>import(`data:text/javascript;base64,${Buffer.from(stripTypeScriptTypes(text)).toString('base64')}`);
  const control=await load(source);controls(control.calculateAffinityDistance);
  const mutations=[
    ['no-absolute','Math.abs(sourceAffinityByte - targetAffinityByte)','sourceAffinityByte - targetAffinityByte'],
    ['modulo150','Math.abs(sourceAffinityByte - targetAffinityByte)','Math.abs(sourceAffinityByte - targetAffinityByte) % 150'],
    ['signed-source-byte','Math.abs(sourceAffinityByte - targetAffinityByte)','Math.abs((sourceAffinityByte << 24 >> 24) - targetAffinityByte)'],
    ['wrong-circle','150 - absoluteDifference','149 - absoluteDifference'],
    ['unsigned-complement','150 - absoluteDifference','(150 - absoluteDifference) >>> 0'],
    ['nonnegative-clamp',"signedComparisonBranch === 'keep-d' ? absoluteDifference : complement","Math.max(0, signedComparisonBranch === 'keep-d' ? absoluteDifference : complement)"],
    ['inclusive-tie','absoluteDifference < complement','absoluteDifference <= complement'],
    ['max-not-min','absoluteDifference < complement','absoluteDifference > complement'],
    ['signed-eax','returnedSigned32 >>> 0','returnedSigned32'],
    ['whole-eax-as-al','const returnedAl = returnedEax & 255;','const returnedAl = returnedEax;'],
    ['accept-negative','value >= 0','value >= -1'],
    ['accept-256','value <= 255','value <= 256'],
  ];
  for(const [name,from,to] of mutations) {
    assert.equal(source.split(from).length,2,`unique mutation: ${name}`);
    const mutant=await load(source.replace(from,to));assert.throws(()=>controls(mutant.calculateAffinityDistance),{name:'AssertionError'},name);
  }
});
