import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { SEARCH_TALENT_BASELINE as source, calculateSearchTalentBaseline as calculate,
  createSession, syntheticScenario, canonical, dispatch, saveGame, loadGame, replaySession } from '../src/index.ts';
import { calculateSearchTalentBaseline as direct } from '../src/search-talent-baseline.ts';
const PROFILE='search-talent-resolved-v1';
const input=(filteredCandidateCount=1,politicsAL=100,eyeSkillEax=0,cityRegion=1,officerBirthRegion=2)=>
  ({profile:PROFILE,filteredCandidateCount,politicsAL,eyeSkillEax,cityRegion,officerBirthRegion});
const freeze=value=>{if(value!==null&&typeof value==='object'){assert.ok(Object.isFrozen(value));for(const v of Object.values(value))freeze(v);}};
const anchors=[[0,255,256,1,1,0],[1,100,0,1,2,33],[1,100,0,1,1,36],
  [5,100,0,1,2,73],[5,100,0,1,1,80],[6,255,0,1,1,205],
  [2147483647,255,0,-2147483648,-2147483648,205],[1,0,256,1,2,100],
  [1,0,4294967295,1,2,100],[1,0,0,1,1,0],[1,255,0,1,2,85],[5,255,0,1,2,187]];
function controls(fn){for(const [c,p,e,a,b,want] of anchors){const r=fn(input(c,p,e,a,b));assert.equal(r.supported,true);assert.equal(r.returnedEax,want);}
  assert.equal(fn(input(-1)).supported,false);assert.equal(fn(input(1,256)).supported,false);
  assert.equal(fn(input(1,1,-1)).supported,false);assert.equal(fn({...input(),extra:1}).supported,false);
}
test('search baseline exports frozen listing-only evidence and metadata',()=>{
  assert.strictEqual(calculate,direct);assert.equal(source.profileId,PROFILE);assert.equal(source.evidence.level,'source-listing-reconstruction');
  for(const key of ['stockOriginalVerified','originalExecutableExecuted','nativeHelpersReconstructed','callerIntegrated','finalProbabilityRecovered','rngIntegrated','searchGoldRecovered','searchTreasureRecovered'])assert.equal(source.evidence[key],false,key);
  freeze(source);freeze(calculate(input()));assert.strictEqual(calculate(input()).evidence,source.evidence);
});
test('search baseline preserves early return order, full EAX, min5 and values above100',()=>{
  controls(calculate);
  for(const e of [1,256,2147483648,4294967295]){assert.equal(calculate(input(0,255,e)).branch,'no-candidates');assert.equal(calculate(input(1,0,e)).branch,'eye-skill');}
  for(const r of [calculate(input(0)),calculate(input(1,100,1))])for(const key of ['cappedCandidateCount','regionFactor','numerator'])assert.equal(r[key],null);
  assert.equal(calculate(input(5,255,0,1,1)).numerator,61710);
});
test('search baseline bounded exhaustive domain matches separate rational arithmetic',()=>{
  let cases=0,max=0;
  for(const count of [0,1,2,3,4,5,6,7,2147483647])for(let politics=0;politics<=255;politics++)
    for(const eye of [0,1,256,4294967295])for(const same of [false,true]){
      const r=calculate(input(count,politics,eye,-2147483648,same?-2147483648:2147483647));
      const c=BigInt(count>5?5:count),p=BigInt(politics),f=same?11n:10n;
      const expected=count===0?0:eye!==0?100:Number(((c+c+c+7n)*p*f)/300n);
      assert.equal(r.returnedEax,expected);assert.equal(r.branch,count===0?'no-candidates':eye!==0?'eye-skill':'arithmetic');
      if(r.branch==='arithmetic'){assert.equal(r.cappedCandidateCount,Number(c));assert.equal(r.regionFactor,Number(f));assert.equal(r.numerator,Number((c+c+c+7n)*p*f));}
      cases++;max=Math.max(max,r.returnedEax);
    }
  assert.equal(cases,18432);assert.equal(max,205);
});
test('search baseline strictly rejects unsupported inputs without invoking accessors',()=>{
  const reject=(value,reason)=>{const r=calculate(value);assert.equal(r.supported,false);assert.equal(r.reason,reason);assert.deepEqual(Object.keys(r).sort(),['evidence','reason','supported']);freeze(r);};
  for(const v of [null,undefined,false,0,'',[],()=>1,new Date(),Object.create(input())])reject(v,'invalid-input');
  for(const field of Object.keys(input())){const missing=input();delete missing[field];reject(missing,'invalid-input');const getter=input();Object.defineProperty(getter,field,{get(){throw Error('must not execute');}});reject(getter,'invalid-input');}
  for(const field of ['nativePointer','personId','cityValid','rng','stock','extra'])reject({...input(),[field]:1},'unexpected-field');
  reject({...input(),[Symbol('hidden')]:1},'unexpected-field');const hidden=input();Object.defineProperty(hidden,'extra',{value:1});reject(hidden,'unexpected-field');
  const fields=[['filteredCandidateCount',0,2147483647,'invalid-filtered-candidate-count'],['politicsAL',0,255,'invalid-politics-al'],['eyeSkillEax',0,4294967295,'invalid-eye-skill-eax'],['cityRegion',-2147483648,2147483647,'invalid-city-region'],['officerBirthRegion',-2147483648,2147483647,'invalid-officer-birth-region']];
  for(const [field,lo,hi,reason] of fields)for(const v of [undefined,null,lo-1,hi+1,1.5,NaN,Infinity,-Infinity,'1',true,{},[],1n])reject({...input(),[field]:v},reason);
  for(const profile of [null,undefined,'','stock',0,'search-talent-resolved-v2'])reject({...input(),profile},'unsupported-profile');
  assert.deepEqual(calculate(Object.assign(Object.create(null),input())),calculate(input()));
  const data={};for(const [k,v] of Object.entries(input()))Object.defineProperty(data,k,{value:v});assert.deepEqual(calculate(data),calculate(input()));
  assert.deepEqual(calculate(input(-0,-0,-0,-0,-0)),calculate(input(0,0,0,0,0)));
  reject({...input(0),politicsAL:256},'invalid-politics-al');
});
test('search receipts are immutable deterministic snapshots without mutation or game integration',()=>{
  const request=input(),before=JSON.stringify(request),r=calculate(request);assert.equal(JSON.stringify(request),before);assert.deepEqual(r,calculate(request));request.politicsAL=255;assert.equal(r.politicsAL,100);assert.throws(()=>{r.returnedEax=1;},TypeError);
  let session=createSession(syntheticScenario());const original=canonical(session);calculate(input());assert.equal(canonical(session),original);
  for(const type of ['SearchTalent','SearchTalentBaseline','Explore','Recruit']){const out=dispatch(session,{type});assert.equal(out.result.ok,false);assert.strictEqual(out.session,session);}
  session=dispatch(session,{type:'EndTurn'}).session;assert.deepEqual(loadGame(saveGame(session)),session);assert.deepEqual(replaySession(session),session);
});
test('actual search implementation mutations fail boundary controls',async()=>{
  const raw=fs.readFileSync(new URL('../src/search-talent-baseline.ts',import.meta.url),'utf8');
  const text=raw.replace(raw.split('\n')[0],`const source = ${JSON.stringify(source)};`);
  const load=s=>import(`data:text/javascript;base64,${Buffer.from(stripTypeScriptTypes(s)).toString('base64')}`);
  controls((await load(text)).calculateSearchTalentBaseline);
  const changes=[['filteredCandidateCount === 0','filteredCandidateCount < 0'],['eyeSkillEax !== 0','(eyeSkillEax & 255) !== 0'],['Math.min(filteredCandidateCount, 5)','Math.max(filteredCandidateCount, 5)'],['? 11 : 10','? 10 : 11'],['Math.floor(numerator / 300)','Math.floor(numerator / 30)'],['Math.floor(numerator / 300)','Math.min(100, Math.floor(numerator / 300))'],['Math.floor(numerator / 300)','Math.ceil(numerator / 300)'],['integer(count, 0, 2147483647)','integer(count, -1, 2147483647)'],['integer(politics, 0, 255)','integer(politics, 0, 256)'],['integer(eye, 0, 4294967295)','integer(eye, -1, 4294967295)']];
  for(const [from,to] of changes){assert.ok(text.includes(from),from);const fn=(await load(text.replace(from,to))).calculateSearchTalentBaseline;assert.throws(()=>controls(fn),undefined,from);}
});
