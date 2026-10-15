import test from 'node:test';
import assert from 'node:assert/strict';
import {decideOrdinaryRecruitment as decide, ORDINARY_RECRUITMENT_POLICY} from '../src/ordinary-recruitment-policy.ts';
const base = () => ({profile:'ordinary-recruitment-provisional-v1',scope:'ordinary-decision-only',dateKey:612,target:{id:2,status:'officer',forceId:20,currentRulerId:4,forceControlledCityCount:1,loyalty:60,giriInternal:0,affinity:0,spouse:null,swornSiblingIds:[],swornSenior:null,likesIds:[],dislikesIds:[],forbiddenLordId:null,forbiddenMonths:0},executor:{id:1,forceId:10,charisma:50,affinity:0},ruler:{id:3,forceId:10,affinity:0}});
const run = (patch={}) => {const q=base();Object.assign(q.target,patch);return decide(q)};
test('literal independently calculated threshold and seven-word vectors',()=>{
  for(const [date,hash,roll,success] of [[19,3254478763,63,false],[22,1763120062,62,false],[121,3936307361,61,true]]) {const q=base();q.dateKey=date;q.target.loyalty=46;q.executor.charisma=0;const r=decide(q);assert.equal(r.path,'continuous');assert.equal(r.rateDetails.rate,62);assert.equal(r.rollDetails.hashU32,hash);assert.equal(r.rollDetails.roll,roll);assert.equal(r.success,success);}
  const r=decide(base());assert.deepEqual(r.rollDetails,{words:[612,2,1,60,50,0,0],hashU32:2048297862,roll:62});
});
test('all nine ordered gates and actual precedence conflicts',()=>{
  const cases=[['G1',false,{spouse:{personId:5,forceId:20}}],['G2',true,{spouse:{personId:1,forceId:10},loyalty:255,dislikesIds:[1]}],['G3',false,{dislikesIds:[1],swornSiblingIds:[1],swornSenior:{personId:1,forceId:10}}],['G4',true,{swornSiblingIds:[1],swornSenior:{personId:1,forceId:10},loyalty:255}],['G5',false,{loyalty:93,giriInternal:4,spouse:{personId:5,forceId:10}}],['G6',true,{swornSiblingIds:[5,6],swornSenior:{personId:6,forceId:10}}],['G7',true,{spouse:{personId:5,forceId:10}}],['G8',false,{likesIds:[4,1,3]}],['G9',true,{likesIds:[1,3]}]];
  for(const [reason,success,p] of cases){const r=run(p);assert.equal(r.reason,reason);assert.equal(r.success,success);assert.equal(r.gateTrace.length,Number(reason.slice(1)));assert.equal(r.rateDetails,null);assert.equal(r.rollDetails,null);}
  assert.equal(run({loyalty:92,giriInternal:4}).path,'continuous');assert.equal(run({loyalty:92,giriInternal:4}).rateDetails.rate,0);
  assert.equal(run({likesIds:[1]}).path,'continuous');
});
test('exact-rational reference table and separate actor distances',()=>{
  for(const [loyalty,giri,d,c,expected] of [[60,0,0,50,60],[60,0,0,100,75],[60,4,0,100,66],[90,0,0,50,10],[90,0,75,50,5],[96,0,0,50,0],[0,0,0,100,95],[0,0,75,100,62],[60,2,0,80,65],[46,0,0,0,62]]){const q=base();Object.assign(q.target,{loyalty,giriInternal:giri});q.ruler.affinity=d;q.executor.charisma=c;assert.equal(decide(q).rateDetails.rate,expected);}
  const q=base();q.ruler.affinity=75;q.executor.affinity=149;const r=decide(q);assert.equal(r.rateDetails.rulerTargetDistance,75);assert.equal(r.rollDetails.words[5],1);
});
test('wild baseline60 is rate-only and prohibition unsupported before forced success',()=>{
  const q=base();Object.assign(q.target,{status:'wild',forceId:null,currentRulerId:null,forceControlledCityCount:0,loyalty:20});const a=decide(q);q.target.loyalty=90;const b=decide(q);assert.equal(a.rateDetails.rate,60);assert.equal(b.rateDetails.rate,60);assert.equal(a.rollDetails.words[3],20);assert.equal(b.rollDetails.words[3],90);q.target.loyalty=100;assert.equal(decide(q).reason,'G5');
  assert.deepEqual(run({spouse:{personId:1,forceId:10},forbiddenMonths:1,forbiddenLordId:99}),{supported:false,reason:'unsupported-service-prohibition'});
});
test('G1 truth table and executor=ruler identity',()=>{
  for(const force of [null,10,20,30])for(const cities of [0,1,42]){const r=run({spouse:{personId:5,forceId:force},forceControlledCityCount:cities});assert.equal(r.reason==='G1',force!==null&&force!==10&&cities>0);}
  const q=base();q.ruler.id=1;q.target.likesIds=[1];assert.equal(decide(q).reason,'G9');q.ruler.affinity=1;assert.equal(decide(q).reason,'inconsistent-snapshot');
});
test('strict descriptors, nested validation, closed domains, identities',()=>{
  let getters=0;const q=base();Object.defineProperty(q.target,'loyalty',{get(){getters++;return 60},enumerable:true});assert.equal(decide(q).supported,false);assert.equal(getters,0);
  const invalid=[q,null,[],{...base(),mode:0},{...base(),dateKey:'612'},{...base(),profile:'vanilla'}];
  for(const field of ['loyalty','affinity','giriInternal']){const q=base();q.target.spouse={personId:1,forceId:10};q.target[field]=NaN;invalid.push(q);}
  for(const a of [Array(1),[1,1],Object.assign([1],{extra:1})]){const q=base();q.target.likesIds=a;invalid.push(q);}
  for(const change of [q=>q.target.likesIds=[2],q=>q.target.swornSiblingIds=[5],q=>q.target.spouse={personId:1,forceId:null},q=>q.target.currentRulerId=1,q=>q.executor.forceId=20,q=>q.target.affinity=150,q=>q.target.loyalty=256,q=>q.target.forbiddenLordId=0,q=>q.target.forbiddenMonths=1]){const q=base();change(q);invalid.push(q);}
  const sym=base();sym.target[Symbol('x')]=1;invalid.push(sym);const hidden=base();Object.defineProperty(hidden,'x',{value:1});invalid.push(hidden);
  const inherited=Object.create(base());invalid.push(inherited);const cyclic=base();cyclic.target.spouse=cyclic;invalid.push(cyclic);
  const rev=Proxy.revocable({},{});rev.revoke();invalid.push(rev.proxy);invalid.push(new Proxy({},{getPrototypeOf(){throw rev.proxy}}));
  for(const q of invalid)assert.equal(decide(q).supported,false);
  const n=base();n.dateKey=-0;assert.equal(Object.is(decide(n).observations.dateKey,-0),false);
  assert.equal(decide(Object.assign(Object.create(null),base())).supported,true);
});
test('canonical detached deep-frozen replay and no runtime RNG',()=>{
  const q=base();q.target.likesIds=[6,5];q.target.dislikesIds=[8,7];q.target.swornSiblingIds=[10,9];q.target.swornSenior={personId:2,forceId:20};
  const random=Math.random;Math.random=()=>{throw Error('runtime RNG used')};let r;try{r=decide(q)}finally{Math.random=random}
  assert.deepEqual(r,decide(JSON.parse(JSON.stringify(r.observations))));q.target.likesIds.reverse();q.target.dislikesIds.reverse();q.target.swornSiblingIds.reverse();assert.deepEqual(r,decide(q));q.target.likesIds.push(1);assert.deepEqual(r.observations.target.likesIds,[5,6]);
  const frozen=x=>{if(x&&typeof x==='object'){assert.ok(Object.isFrozen(x));for(const v of Object.values(x))frozen(v)}};frozen(r);frozen(ORDINARY_RECRUITMENT_POLICY);
});
