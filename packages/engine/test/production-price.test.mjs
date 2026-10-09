import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { stripTypeScriptTypes } from 'node:module';
import { PRODUCTION_PRICE as profile, calculateProductionPrice as calculate,
  createSession, syntheticScenario, canonical, dispatch, saveGame, loadGame, replaySession } from '../src/index.ts';
import { calculateProductionPrice as directCalculate } from '../src/production-price.ts';

const PROFILE = 'production-price-resolved-v1';
const input = (savedBasePriceWord = 10, specialtyHelperEax = 1) => ({profile: PROFILE, savedBasePriceWord, specialtyHelperEax});
function frozen(value) {
  if (value !== null && typeof value === 'object') {
    assert.ok(Object.isFrozen(value)); for (const child of Object.values(value)) frozen(child);
  }
}
// Literal-register transcription of the original bytes; no production constants
// or price formula. The companion Python interpreter decodes the pinned bytes
// and executes the full function for all 131072 branch/word combinations.
function original(price, eax) {
  const specialtyResultAl = eax & 255;
  const discountApplied = specialtyResultAl !== 0;
  let esi = price & 65535;
  if (discountApplied) {
    const ecx = esi << 3;
    let edx = Number(BigInt.asIntN(32, (BigInt(0x66666667) * BigInt(ecx)) >> 32n));
    edx >>= 2;
    const signCorrection = edx >>> 31;
    esi = (edx + signCorrection) | 0;
  }
  return {specialtyResultAl, discountApplied, returnedPrice: esi};
}
function compare(fn, p, h) {
  const actual = fn(input(p,h)), expected = original(p,h);
  assert.equal(actual.supported, true);
  for (const field of Object.keys(expected)) assert.equal(actual[field],expected[field],`${p},${h}:${field}`);
  assert.equal(actual.savedBasePriceWord,p); assert.equal(actual.specialtyHelperEax,h);
}
const regressions = [[0,1,0],[1,1,0],[2,1,1],[3,1,2],[4,1,3],[5,1,4],[9,1,7],[10,1,8],[11,1,8],
  [65535,0,65535],[65535,1,52428],[10,256,10],[10,257,8],[10,0x80000000,10],[10,0x80000001,8],[10,0xffffffff,8]];
function controls(fn) {
  for (const [p,h,want] of regressions) { compare(fn,p,h); assert.equal(fn(input(p,h)).returnedPrice,want); }
}
function evidenceContract(p) {
  assert.equal(p.profileId,PROFILE); assert.equal(p.level,'source-listing-reconstruction');
  assert.equal(p.stockOriginalVerified,false); assert.equal(p.originalExecutableExecuted,false);
  assert.equal(p.source.commit,'66e167e40c3440929ec016f3872aefc3486434c1');
  assert.equal(p.source.gitBlobSha1,'928b34bd8b9f06057dd44e9639db92dacc364c85');
  assert.equal(p.originalListing.instructionCount,45); assert.equal(p.originalListing.byteLength,113);
  assert.equal(p.excludedMod.instructionCount,6); assert.equal(p.excludedMod.byteLength,14);
  assert.equal(p.excludedMod.executedByProduction,false); assert.equal(p.evidence.commandIntegrated,false);
}

test('production price public export, closed evidence and original/MOD provenance remain explicit', () => {
  assert.strictEqual(calculate,directCalculate); evidenceContract(profile); frozen(profile);
  assert.deepEqual(profile.constants,{discountNumerator:8,discountDenominator:10,signedDivisionMagic:'0x66666667'});
  const result=calculate(input()); assert.strictEqual(result.evidence,profile.evidence); frozen(result);
});

test('production price preserves AL-only branch, unsigned word, multiply-before-divide and legal zero', () => { controls(calculate); });

test('all 131072 uint16 price / zero-or-nonzero-AL combinations match original register operations', () => {
  let count=0; const digest=createHash('sha256'), bytes=Buffer.alloc(6);
  for(let p=0;p<65536;p++)for(const h of [0,1]) {
    compare(calculate,p,h); const result=calculate(input(p,h));
    bytes.writeUInt32LE(result.returnedPrice,0);bytes[4]=result.specialtyResultAl;bytes[5]=Number(result.discountApplied);digest.update(bytes);count++;
  }
  assert.equal(count,131072);
  // The digest is pinned from independently byte-driven full-function oracle.
  assert.equal(digest.digest('hex'),'5af77bb6015e56730168c31270fd4e7ae4cbfe0683e98d69bdc7b8598eb3f019');
});

test('all 256 AL values across six high-bit patterns leave upper EAX bits irrelevant', () => {
  for(const high of [0,0x100,0x12345600,0x7fffff00,0x80000000,0xffffff00]) for(let low=0;low<256;low++) {
    const raw=(high+low)>>>0; compare(calculate,13,raw);
    assert.equal(calculate(input(13,raw)).discountApplied,low!==0);
  }
});

test('production price rejects malformed, coercible, inherited, accessor and extra input without native zero', () => {
  function reject(value,reason) {
    const result=calculate(value);assert.equal(result.supported,false);assert.equal(result.reason,reason);
    assert.deepEqual(Object.keys(result).sort(),['evidence','reason','supported']);frozen(result);
  }
  for(const value of [null,undefined,false,1,'',[],()=>1,new Date(),Object.create(input())]) reject(value,'invalid-input');
  for(const name of ['profile','savedBasePriceWord','specialtyHelperEax']) {
    const value=input();delete value[name];reject(value,'invalid-input');
    const getter=input();Object.defineProperty(getter,name,{get(){throw Error('accessor must not execute');}});reject(getter,'invalid-input');
  }
  for(const name of ['city','equipmentType','basePrice','specialty','nativeId','mod','gold','stock','extra']) reject({...input(),[name]:1},'unexpected-field');
  reject({...input(),[Symbol('extra')]:1},'unexpected-field');
  for(const profile of [undefined,null,0,'','S1','PK1.1','Vanilla','production-price-resolved-v2']) reject({...input(),profile},'unsupported-profile');
  for(const savedBasePriceWord of [undefined,null,-1,65536,1.5,NaN,Infinity,-Infinity,'1',true,{},[],1n]) reject({...input(),savedBasePriceWord},'invalid-base-price-word');
  for(const specialtyHelperEax of [undefined,null,-1,4294967296,1.5,NaN,Infinity,-Infinity,'1',true,{},[],1n]) reject({...input(),specialtyHelperEax},'invalid-specialty-helper-eax');
  const nullPrototype=Object.assign(Object.create(null),input());assert.deepEqual(calculate(nullPrototype),calculate(input()));
});

test('captured-input receipts are immutable, deterministic snapshots without input mutation', () => {
  const request=input(), before=JSON.stringify(request), result=calculate(request);
  assert.equal(JSON.stringify(request),before);assert.deepEqual(result,calculate(request));frozen(result);
  request.savedBasePriceWord=65535;request.specialtyHelperEax=0;
  assert.equal(result.savedBasePriceWord,10);assert.equal(result.specialtyHelperEax,1);assert.equal(result.returnedPrice,8);
  assert.throws(()=>{result.returnedPrice=100;},TypeError);
  assert.deepEqual(calculate(Object.freeze(input())),result);
});

test('production price does not integrate commands, debit/stock, Train/EndTurn or save/replay', () => {
  let session=createSession(syntheticScenario());const before=canonical(session);
  calculate(input());assert.equal(canonical(session),before);
  for(const type of ['Produce','Production','ProductionPrice','ProductionDebit']) {
    const result=dispatch(session,{type});assert.equal(result.result.ok,false);assert.strictEqual(result.session,session);
  }
  assert.equal(canonical(session),before);session=dispatch(session,{type:'EndTurn'}).session;
  assert.deepEqual(loadGame(saveGame(session)),session);assert.deepEqual(replaySession(session),session);
});

test('actual production price branch and arithmetic mutants fail independent controls', async () => {
  const raw=fs.readFileSync(new URL('../src/production-price.ts',import.meta.url),'utf8');
  const importLine=raw.split('\n')[0];assert.match(importLine,/^import source from /);
  const source=raw.replace(importLine,`const source = ${JSON.stringify(profile)};`);
  const load=text=>import(`data:text/javascript;base64,${Buffer.from(stripTypeScriptTypes(text)).toString('base64')}`);
  const control=await load(source);controls(control.calculateProductionPrice);
  const mutations=[
    ['whole-EAX-branch','specialtyResultAl !== 0','specialtyHelperEax !== 0'],
    ['one-only-branch','specialtyResultAl !== 0','specialtyResultAl === 1'],
    ['signed-word','savedBasePriceWord * limits.discountNumerator','(savedBasePriceWord << 16 >> 16) * limits.discountNumerator'],
    ['wrong-numerator','* limits.discountNumerator','* 7'],
    ['wrong-denominator','/ limits.discountDenominator','/ 9'],
    ['rounding','Math.floor(savedBasePriceWord * limits.discountNumerator / limits.discountDenominator)','Math.round(savedBasePriceWord * limits.discountNumerator / limits.discountDenominator)'],
    ['ceiling','Math.floor(savedBasePriceWord * limits.discountNumerator / limits.discountDenominator)','Math.ceil(savedBasePriceWord * limits.discountNumerator / limits.discountDenominator)'],
    ['minimum-one','Math.floor(savedBasePriceWord * limits.discountNumerator / limits.discountDenominator)','Math.max(1, Math.floor(savedBasePriceWord * limits.discountNumerator / limits.discountDenominator))'],
    ['division-first','Math.floor(savedBasePriceWord * limits.discountNumerator / limits.discountDenominator)','Math.floor(savedBasePriceWord / limits.discountDenominator) * limits.discountNumerator'],
  ];
  // Include AL2 so a fabricated boolean helper contract cannot survive.
  const verify=fn=>{controls(fn);compare(fn,10,2);};
  for(const [name,from,to] of mutations) {
    verify(control.calculateProductionPrice);assert.equal(source.split(from).length,2,`unique mutation: ${name}`);
    const mutant=await load(source.replace(from,to));assert.throws(()=>verify(mutant.calculateProductionPrice),{name:'AssertionError'},name);
  }
  const contaminated=structuredClone(profile);contaminated.excludedMod.executedByProduction=true;
  assert.throws(()=>evidenceContract(contaminated),{name:'AssertionError'});
});
