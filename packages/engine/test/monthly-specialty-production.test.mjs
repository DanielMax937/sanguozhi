import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {calculateMonthlySpecialtyProduction as calculate,MONTHLY_SPECIALTY_PRODUCTION as source} from '../src/index.ts';
const header={profile:'monthly-specialty-production-observed-v1',arithmeticProfile:'comment-f32-rne-trunc-v1',equipmentType:1,specialtyEaxU32:1};
const sample=(n=1,p=80)=>({...header,slots:Array.from({length:30},(_,i)=>i<n?{validityEaxU32:256,correspondingCompletedEaxU32:256}:{validityEaxU32:0}),...(n?{governorPoliticsEaxU32:p}:{})});
const bad=(v,reason)=>{const result=calculate(v);assert.equal(result.supported,false);if(reason)assert.equal(result.reason,reason);};
const frozen=v=>v===null||typeof v!=='object'||Object.isFrozen(v)&&Object.values(v).every(frozen);
test('monthly specialty: AL gate, three stages, full EAX predicates and four equipment types',()=>{
 for(const equipmentType of [1,2,3,4])for(const word of [0,256,65536,0x80000000]){const r=calculate({...header,equipmentType,specialtyEaxU32:word});assert.equal(r.path,'not-specialty');assert.equal(r.completedFacilityCount,null);assert.equal(r.capturedReturns.length,1);assert.equal(r.quantityRequest,null);}
 for(const word of [1,255,256,65536,0x80000000,0xFFFFFFFF]){const v=sample(0);v.slots[29]={validityEaxU32:word,correspondingCompletedEaxU32:word};v.governorPoliticsEaxU32=0xFFFFFF50;const r=calculate(v);assert.equal(r.completedFacilityCount,1);assert.equal(r.quantityRequest.quantityU32,300);assert.equal(r.arithmetic.politicsAL,80);assert.equal(r.capturedReturns.at(-2).slotIndex,29);}
 const z=sample(0);z.slots[3]={validityEaxU32:1,correspondingCompletedEaxU32:0};const r=calculate(z);assert.equal(r.path,'no-completed-facilities');assert.equal(r.capturedReturns.length,32);assert.equal(r.quantityRequest,null);
});
test('monthly specialty: piecewise count offsets, single f32 store and truncating converter',()=>{
 const expected=[[1,0x3F800000,300],[2,0x3FC00000,450],[3,0x40000000,600],[4,0x40100000,675],[7,0x40400000,900],[8,0x40466666,929],[17,0x40800000,1200],[30,0x40A9999A,1500]];
 for(const [n,bits,q] of expected){const r=calculate(sample(n));assert.equal(r.arithmetic.factorBitsU32,bits);assert.equal(r.quantityRequest.quantityU32,q);}
 const witness=calculate(sample(8,80));assert.equal(witness.arithmetic.scaledValue,929.9999713897705);assert.equal(witness.arithmetic.convertedSigned32,929);
 assert.equal(calculate(sample(1,255)).quantityRequest.quantityU32,561);assert.equal(calculate(sample(1,254)).quantityRequest.quantityU32,561);
 const boundary=calculate(sample(17,130));assert.equal(boundary.arithmetic.convertedSigned32,1500);assert.equal(boundary.arithmetic.capApplied,false);assert.equal(calculate(sample(30,255)).arithmetic.capApplied,true);
});
test('monthly specialty: captured call order reflects invalid and valid slots without helper execution',()=>{
 const v=sample(0);v.slots[0]={validityEaxU32:1,correspondingCompletedEaxU32:0};v.slots[29]={validityEaxU32:0x80000000,correspondingCompletedEaxU32:0x80000000};v.governorPoliticsEaxU32=256;
 const r=calculate(v);assert.deepEqual(r.capturedReturns.slice(0,4).map(c=>[c.kind,c.slotIndex,c.consumedWidthBits]),[['specialty',null,8],['validity',0,32],['corresponding-completed',0,32],['validity',1,32]]);assert.equal(r.capturedReturns.at(-1).kind,'governor-politics');assert.equal(r.capturedReturns.length,34);assert.equal(r.arithmetic.politicsTerm,60);
});
test('monthly specialty: unsupported profiles, fields, types and dependent stage shapes reject',()=>{
 for(const v of [null,[],1,'x',true,undefined,new Date(),Object.assign(Object.create({a:1}),header)])bad(v,'invalid-input');
 for(const key of Object.keys(header)){const v={...header,specialtyEaxU32:0};delete v[key];bad(v);}
 bad({...header,specialtyEaxU32:0,profile:'native'} ,'unsupported-profile');bad({...header,specialtyEaxU32:0,arithmeticProfile:'decimal'},'unsupported-profile');
 for(const key of ['specialtyEaxU32','equipmentType'])for(const value of [true,'1',1.5,NaN,Infinity,-1,4294967296,null])bad({...header,specialtyEaxU32:0,[key]:value});
 for(const n of [0,5,255])bad({...header,specialtyEaxU32:0,equipmentType:n});
 bad({...header,specialtyEaxU32:0,slots:[]},'stage-mismatch');bad({...header,specialtyEaxU32:0,governorPoliticsEaxU32:1},'stage-mismatch');bad({...header},'stage-mismatch');
 bad({...sample(0),governorPoliticsEaxU32:0},'stage-mismatch');const p=sample();delete p.governorPoliticsEaxU32;bad(p,'stage-mismatch');
 for(const slots of [[],Array(30),Array.from({length:29},()=>({validityEaxU32:0})),Array.from({length:31},()=>({validityEaxU32:0}))])bad({...sample(0),slots});
 for(const slot of [{},{validityEaxU32:0,correspondingCompletedEaxU32:0},{validityEaxU32:1},{validityEaxU32:1,correspondingCompletedEaxU32:true},{validityEaxU32:0,extra:1}]){const v=sample(0);v.slots[0]=slot;bad(v);}
 const x=sample();x.slots.extra=1;bad(x,'unexpected-field');bad({...header,specialtyEaxU32:0,ignored:1},'unexpected-field');
});
test('monthly specialty: accessors, hidden fields and inherited values never consumed',()=>{
 let reads=0;const getter=()=>{reads++;throw Error('must not invoke');};
 for(const target of ['top','slot','array']){const v=sample();if(target==='top')Object.defineProperty(v,'governorPoliticsEaxU32',{get:getter,enumerable:true});if(target==='slot')Object.defineProperty(v.slots[0],'validityEaxU32',{get:getter,enumerable:true});if(target==='array')Object.defineProperty(v.slots,'0',{get:getter,enumerable:true});bad(v,'invalid-input');}
 assert.equal(reads,0);
 const h=sample();Object.defineProperty(h,'hidden',{value:1});bad(h,'unexpected-field');const symbol=sample();symbol[Symbol('extra')]=1;bad(symbol,'unexpected-field');
 const inherited=sample();inherited.slots[0]=Object.assign(Object.create({correspondingCompletedEaxU32:1}),{validityEaxU32:1});bad(inherited,'invalid-input');
 const nullproto=sample();Object.setPrototypeOf(nullproto,null);Object.setPrototypeOf(nullproto.slots[0],null);assert.equal(calculate(nullproto).supported,true);
 const hidden=sample();Object.defineProperty(hidden.slots[0],'validityEaxU32',{value:1,enumerable:false});bad(hidden,'invalid-input');
});
test('monthly specialty: descriptor maps reject holes and accessors without inherited getter reads',()=>{
 const hole=sample();delete hole.slots[17];let inheritedReads=0;let result;let thrown;
 Object.defineProperty(Object.prototype,'17',{get(){inheritedReads++;throw Error('inherited numeric getter');},configurable:true});
 try{result=calculate(hole);}catch(error){thrown=error;}finally{delete Object.prototype[17];}
 assert.equal(thrown,undefined);assert.equal(inheritedReads,0);assert.equal(result.supported,false);assert.equal(result.reason,'invalid-input');
 for(const index of [0,1,17]){
  const v=sample();const expected=calculate(v);let reads=0;let answer;let failure;
  Object.defineProperty(Object.prototype,String(index),{get(){reads++;throw Error('inherited capture index');},configurable:true});
  try{answer=calculate(v);}catch(error){failure=error;}finally{delete Object.prototype[index];}
  assert.equal(failure,undefined,String(index));assert.equal(reads,0,String(index));assert.deepEqual(answer,expected);
 }
 for(const target of ['top','slot','array']){
  const v=sample();let ownReads=0;let prototypeReads=0;let answer;let failure;
  const descriptor={get(){ownReads++;throw Error('input accessor');},enumerable:true,configurable:true};
  if(target==='top')Object.defineProperty(v,'governorPoliticsEaxU32',descriptor);
  if(target==='slot')Object.defineProperty(v.slots[0],'validityEaxU32',descriptor);
  if(target==='array')Object.defineProperty(v.slots,'0',descriptor);
  Object.defineProperty(Object.prototype,'value',{get(){prototypeReads++;throw Error('inherited descriptor value');},configurable:true});
  try{answer=calculate(v);}catch(error){failure=error;}finally{delete Object.prototype.value;}
  assert.equal(failure,undefined,target);assert.equal(ownReads,0,target);assert.equal(prototypeReads,0,target);assert.equal(answer.supported,false,target);assert.equal(answer.reason,'invalid-input',target);
 }
});
test('monthly specialty: deterministic deep immutable receipts and copied observations',()=>{
 const v=sample(8);const a=calculate(v),b=calculate(v);assert.deepEqual(a,b);assert.notEqual(a,b);assert.notEqual(a.observations.slots,v.slots);assert.ok(frozen(a));assert.ok(frozen(source));
 v.slots[0].validityEaxU32=0;v.governorPoliticsEaxU32=0;assert.equal(a.observations.slots[0].validityEaxU32,256);assert.equal(a.observations.governorPoliticsEaxU32,80);
 assert.throws(()=>{a.quantityRequest.quantityU32=0;},TypeError);assert.throws(()=>{a.capturedReturns.push({});},TypeError);assert.throws(()=>{a.evidence.stockOriginalVerified=true;},TypeError);
 const z=calculate({...header,specialtyEaxU32:-0});assert.ok(!Object.is(z.observations.specialtyEaxU32,-0));assert.equal(z.evidence.runtimeSourceRehashPerformed,false);
});
test('monthly specialty: public static types reject bad stages/tuples/mutations and narrow receipt paths',()=>{
 const dir=mkdtempSync(join(tmpdir(),'specialty-type-'));try{
  const entry=resolve('packages/engine/src/index.ts').replaceAll('\\','/');const file=join(dir,'types.mts');
  writeFileSync(file,`import {calculateMonthlySpecialtyProduction as c,MONTHLY_SPECIALTY_PRODUCTION as doc} from '${entry}';\nimport type {MonthlySpecialtyProductionInput as I,MonthlySpecialtyProductionSlots as S,MonthlySpecialtyProductionCapturedReturn as C} from '${entry}';\nconst h={profile:'monthly-specialty-production-observed-v1',arithmeticProfile:'comment-f32-rne-trunc-v1',equipmentType:1,specialtyEaxU32:0} as const;\nconst good:I=h;\n// @ts-expect-error unsupported equipment\nconst wrong:I={...h,equipmentType:5};\n// @ts-expect-error no boolean EAX\nconst boolean:I={...h,specialtyEaxU32:true};\n// @ts-expect-error missing slots on politics branch\nconst missing:I={...h,governorPoliticsEaxU32:80};\n// @ts-expect-error exact30 tuple\nconst short:S=[];\n// @ts-expect-error undefined cannot bypass absent fields\nconst undef:I={...h,slots:undefined};\n// @ts-expect-error wrong captured kind/address pair\nconst captured:C={kind:'specialty',callAddress:'00590AB3',target:'0047A630',consumedWidthBits:32,slotIndex:0,eaxU32:1,consumedValue:1};\nconst r=c(good);if(r.supported&&r.path==='production'){const n:number=r.quantityRequest.quantityU32;const f:number=r.arithmetic.factorValue;\n// @ts-expect-error immutable request\nr.quantityRequest.quantityU32=2;\n// @ts-expect-error immutable captures\nr.capturedReturns.push(captured);\n// @ts-expect-error immutable nested evidence\nr.evidence.nativeExecutableExecuted=true;}\n// @ts-expect-error immutable exported profile\ndoc.arithmeticProfile.constants.tenth.bitsU32=0;\n`);
  const run=spawnSync(process.execPath,['node_modules/typescript/bin/tsc','--ignoreConfig','--noEmit','--strict','--exactOptionalPropertyTypes','--skipLibCheck','--target','ES2023','--module','NodeNext','--allowImportingTsExtensions',file],{encoding:'utf8'});assert.equal(run.status,0,run.stdout+run.stderr);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
