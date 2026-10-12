import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { RECRUITMENT_SECURITY_ARGUMENT as source, calculateRecruitmentSecurityArgument as calculate,
  createSession, syntheticScenario, canonical, dispatch, saveGame, loadGame, replaySession } from '../src/index.ts';
import { calculateRecruitmentSecurityArgument as direct } from '../src/recruitment-security-argument.ts';

const PROFILE = 'recruitment-security-argument-v1';
const input = (savedCharmSum = 300, savedTroopReturnU32 = 4200) => ({profile: PROFILE, savedCharmSum, savedTroopReturnU32});
const numericKeys = ['savedCharmSum','savedTroopReturnU32','signedTroopReturn','divisor','quotientSigned',
  'remainderSigned','securityDeltaSigned','securityDeltaU32'];
const frozen = value => {
  if (value !== null && typeof value === 'object') {
    assert.ok(Object.isFrozen(value));
    for (const child of Object.values(value)) frozen(child);
  }
};
// Independent unsigned long division on exact integer magnitudes, with explicit
// sign/remainder correction. No production code, metadata constants or BigInt.
function expected(c, u) {
  c = c === 0 ? 0 : c; u = u === 0 ? 0 : u;
  const n = u < 2147483648 ? u : u - 4294967296, d = c + 100;
  let remainder = 0, q = 0, magnitude = Math.abs(n);
  for (let bit = 31; bit >= 0; bit--) {
    remainder = remainder * 2 + (Math.floor(magnitude / 2 ** bit) % 2);
    q *= 2;
    if (remainder >= d) { remainder -= d; q++; }
  }
  const quotientSigned = q === 0 ? 0 : n < 0 ? -q : q;
  const remainderSigned = remainder === 0 ? 0 : n < 0 ? -remainder : remainder;
  const securityDeltaSigned = q === 0 ? 0 : -quotientSigned;
  const securityDeltaU32 = securityDeltaSigned < 0 ? securityDeltaSigned + 4294967296 : securityDeltaSigned;
  return {savedCharmSum:c,savedTroopReturnU32:u,signedTroopReturn:n,divisor:d,quotientSigned,
    remainderSigned,securityDeltaSigned,securityDeltaU32};
}
function compare(fn, c, u) {
  const got = fn(input(c,u)), want = expected(c,u);
  assert.equal(got.supported,true);
  assert.equal(got.profile,PROFILE);
  for (const key of numericKeys) {
    assert.equal(got[key],want[key],`${c},${u}:${key}`);
    assert.equal(Object.is(got[key],-0),false,`${key} must be canonical +0`);
  }
  assert.deepEqual(Object.keys(got).sort(), [...numericKeys,'supported','profile','evidence'].sort());
}
const anchors = [[300,4200,-10],[300,6300,-15],[0,0xffffff9b,1],[0,0xffffffff,0],
  [0,0x80000000,21474836],[28,0x80000000,16777216],[28,0x7fffffff,-16777215],
  [765,864,0],[765,865,-1],[765,0xffffffff,0],[0,0,0],[-0,-0,0],
  [300,200,0],[299,399,-1],[300,399,0],[0,101,-1],[0,10000,-100],[0,10100,-101]];
function controls(fn) {
  for (const [c,u,delta] of anchors) {compare(fn,c,u);assert.equal(fn(input(c,u)).securityDeltaSigned,delta);}
  for (const [field,bad] of [['savedCharmSum',[-1,766,0.5,NaN,Infinity,'300',true]],
    ['savedTroopReturnU32',[-1,4294967296,1.5,NaN,Infinity,'4200',true]]]) {
    for (const value of bad) assert.equal(fn({...input(),[field]:value}).supported,false);
  }
  for (const field of ['city','currentSecurity','quantity','quantityCharmSum','lawSkill','state'])
    assert.equal(fn({...input(),[field]:1}).reason,'unexpected-field');
  assert.equal(fn({...input(),profile:'stock'}).supported,false);
}

test('recruitment security exports frozen source-listing-only evidence and a closed receipt', () => {
  assert.strictEqual(calculate,direct); frozen(source); frozen(calculate(input()));
  assert.equal(source.profileId,PROFILE);
  assert.equal(source.evidence.level,'source-listing-reconstruction');
  assert.equal(source.source.gitBlobSha1,'3e1767ccafd7d217881119d142e8f4b02cdf88ce');
  assert.equal(source.source.commit,'66e167e40c3440929ec016f3872aefc3486434c1');
  assert.equal(source.fullCaller.instructionCount,316);assert.equal(source.fullCaller.byteLength,955);
  assert.equal(source.leaf.instructionCount,7);assert.equal(source.leaf.byteLength,19);
  assert.equal(source.leaf.argumentInstructionCount,9);assert.equal(source.leaf.argumentByteLength,21);
  assert.equal(source.excludedMod.instructionCount,16);assert.equal(source.excludedMod.contiguous,false);
  for (const key of ['stockOriginalVerified','originalExecutableExecuted','nativeHelpersReconstructed',
    'abiVerified','realTraceReachabilityVerified','troopWriterRecovered','securityWriterRecovered',
    'commandIntegrated','modLawExemptionIncluded']) assert.equal(source.evidence[key],false,key);
  assert.strictEqual(calculate(input()).evidence,source.evidence);controls(calculate);
});

test('recruitment security signed IDIV preserves negative dividends, endpoints and +0', () => {
  for (const [c,u] of anchors) compare(calculate,c,u);
  assert.equal(calculate(input(0,0xffffff9b)).remainderSigned,-1);
  assert.equal(calculate(input(0,0xffffffff)).remainderSigned,-1);
  assert.equal(calculate(input(300,4200)).securityDeltaU32,4294967286);
  assert.equal(calculate(input(28,0x80000000)).remainderSigned,0);
});

test('all 766 divisors match independent bitwise long division at quotient boundaries', () => {
  let count = 0;
  for (let c=0;c<=765;c++) {
    const d=c+100;
    const values = new Set([0,1,d-1,d,d+1,2*d-1,2*d,2*d+1,0x7fffffff,0x80000000,0xffffffff]);
    for (const magnitude of [1,d-1,d,d+1,2*d-1,2*d,2*d+1]) values.add(4294967296-magnitude);
    for (const u of values) {compare(calculate,c,u);count++;}
  }
  assert.equal(count,13022);
});

test('recruitment security requires exact own data fields without executing getters', () => {
  const reject = (request,reason) => {
    const result=calculate(request);assert.equal(result.supported,false);assert.equal(result.reason,reason);
    assert.deepEqual(Object.keys(result).sort(),['evidence','reason','supported']);
    assert.strictEqual(result.evidence,source.evidence);frozen(result);
  };
  for (const request of [null,undefined,false,0,'',[],()=>1,new Date(),new Number(1),Object.create(input())])
    reject(request,'invalid-input');
  for (const field of Object.keys(input())) {
    const missing=input();delete missing[field];reject(missing,'invalid-input');
    const getter=input();Object.defineProperty(getter,field,{get(){throw Error('getter invoked');}});reject(getter,'invalid-input');
    const setter=input();Object.defineProperty(setter,field,{set(){throw Error('setter invoked');}});reject(setter,'invalid-input');
  }
  for (const field of ['city','currentSecurity','quantity','quantityCharmSum','lawSkill','state','nativePointer','writer','actualLoss','before','after'])
    reject({...input(),[field]:1},'unexpected-field');
  const extra=input();Object.defineProperty(extra,'extra',{get(){throw Error('extra getter invoked');}});reject(extra,'unexpected-field');
  reject({...input(),[Symbol('extra')]:1},'unexpected-field');
  for (const [field,max,reason] of [['savedCharmSum',765,'invalid-saved-charm-sum'],
    ['savedTroopReturnU32',4294967295,'invalid-saved-troop-return-u32']]) {
    for (const value of [undefined,null,-1,max+1,-0.5,1.5,Number.MIN_VALUE,Number.MAX_SAFE_INTEGER,
      NaN,Infinity,-Infinity,'0',true,false,{},[],1n,Symbol('bad')]) reject({...input(),[field]:value},reason);
  }
  for (const profile of [undefined,null,'','stock',0,'recruitment-quantity-observations-f32-v1'])
    reject({...input(),profile},'unsupported-profile');
  assert.deepEqual(calculate(Object.assign(Object.create(null),input())),calculate(input()));
  const hidden={};for (const [key,value] of Object.entries(input())) Object.defineProperty(hidden,key,{value});
  assert.deepEqual(calculate(hidden),calculate(input()));
  assert.deepEqual(calculate(Object.freeze(input(765,0xffffffff))),calculate(input(765,0xffffffff)));
});

test('execution-scan charm and saved troop writer word remain independent leaf inputs', () => {
  // Counterexamples are scalar-contract examples, not claims of game reachability.
  assert.equal(calculate(input(300,200)).securityDeltaSigned,0); // quantity return4200 is not input200
  assert.equal(calculate(input(299,399)).securityDeltaSigned,-1); // earlier execution C299
  assert.equal(calculate(input(300,399)).securityDeltaSigned,0); // later quantity C300 cannot replace it
  assert.equal(calculate(input(300,4200)).securityDeltaSigned,-10); // not clipped to hypothetical security3
  assert.equal(calculate({...input(),currentSecurity:3}).supported,false);
  assert.equal(calculate({...input(),lawSkill:true}).supported,false);
  assert.equal(calculate({...input(),actualLoss:-3}).supported,false);
});

test('recruitment security leaves sandbox state, dispatch and replay untouched', () => {
  const request=input(), original=JSON.stringify(request), receipt=calculate(request);
  assert.equal(JSON.stringify(request),original);assert.deepEqual(receipt,calculate(request));
  request.savedCharmSum=0;request.savedTroopReturnU32=0;assert.equal(receipt.securityDeltaSigned,-10);
  assert.throws(()=>{receipt.securityDeltaSigned=0;},TypeError);
  assert.throws(()=>{receipt.evidence.commandIntegrated=true;},TypeError);
  const random=Math.random;Math.random=()=>{throw Error('unexpected RNG');};
  try {controls(calculate);} finally {Math.random=random;}
  let session=createSession(syntheticScenario());const before=canonical(session);
  for(const [c,u] of anchors) calculate(input(c,u));assert.equal(canonical(session),before);
  for(const type of ['RecruitmentSecurityArgument','Recruit','Recruitment','ChangeSecurity']) {
    const result=dispatch(session,{type});assert.equal(result.result.ok,false);assert.strictEqual(result.session,session);
  }
  session=dispatch(session,{type:'EndTurn'}).session;
  assert.deepEqual(loadGame(saveGame(session)),session);assert.deepEqual(replaySession(session),session);
});

test('actual security TypeScript mutants are killed by unchanged controls and signed boundaries', async () => {
  const raw=fs.readFileSync(new URL('../src/recruitment-security-argument.ts',import.meta.url),'utf8');
  const text=raw.replace(raw.split('\n')[0],`const source = ${JSON.stringify(source)};`);
  const load=async value=>(await import(`data:text/javascript;base64,${Buffer.from(stripTypeScriptTypes(value)).toString('base64')}`)).calculateRecruitmentSecurityArgument;
  const changes=[
    ['BigInt.asIntN(32, BigInt(savedTroopReturnU32))','BigInt.asUintN(32, BigInt(savedTroopReturnU32))'],
    ['savedCharmSum + 100','savedCharmSum + 99'],['savedCharmSum + 100','savedCharmSum + 101'],
    ['savedCharmSum + 100','Math.min(savedCharmSum, 300) + 100'],
    ['savedCharmSum + 100','300 + 100'],
    ['BigInt(signedTroopReturn) / BigInt(divisor)','BigInt(Math.floor(signedTroopReturn / divisor))'],
    ['BigInt(signedTroopReturn) / BigInt(divisor)','BigInt(Math.ceil(signedTroopReturn / divisor))'],
    ['BigInt(signedTroopReturn) / BigInt(divisor)','BigInt(Math.trunc(Math.abs(signedTroopReturn) / divisor))'],
    ['BigInt(signedTroopReturn) / BigInt(divisor)','4200n / BigInt(divisor)'],
    ['Number(-quotient)','Number(quotient)'],['Number(-quotient)','-Number(quotient)'],
    ['Number(-quotient)','Math.min(0, Number(-quotient))'],
    ['Number(-quotient)','Math.max(-100, Number(-quotient))'],
    ['Number(-quotient)','Math.max(-3, Number(-quotient))'],
    ['Number(-quotient)','0'],
    ['Number(BigInt.asUintN(32, -quotient))','Number(-quotient)'],
    ['Number(BigInt(signedTroopReturn) - quotient * BigInt(divisor))','0'],
    ['charm === 0 ? 0 : charm','charm'],['troops === 0 ? 0 : troops','troops'],
    ['integer(charm, 765)','integer(charm, 300)'],['integer(charm, 765)','integer(charm, 766)'],
    ['integer(troops, 0xffffffff)','integer(troops, 0x7fffffff)'],
    ['integer(troops, 0xffffffff)','integer(troops, 0x100000000)'],
    ['Number.isSafeInteger(value)','Number.isFinite(value)'],
    ["profile !== 'recruitment-security-argument-v1'",'false'],
    ["return reject('unexpected-field')",'void 0'],
  ];
  let killed=0;
  for(const [from,to] of changes) {
    assert.equal(raw.split(from).length-1,1,`mutant location must be unique: ${from}`);
    controls(await load(text)); // unchanged control is checked before every mutant
    const changed=raw.replace(from,to);
    const mutant=await load(changed.replace(changed.split('\n')[0],`const source = ${JSON.stringify(source)};`));
    assert.throws(()=>controls(mutant),undefined,`${from} -> ${to}`);killed++;
  }
  assert.equal(killed,26);
});
