import test from 'node:test';
import assert from 'node:assert/strict';
import { canonical, createSession, DEFAULT_ADAPTERS, dispatch, evidenceSummary, executeCommand, loadGame, previewCommand, replayCommands, replaySession, saveGame, syntheticScenario, validateState } from '../src/index.ts';
import { validateAdapters } from '../src/state.ts';

const copy=value=>JSON.parse(JSON.stringify(value));
const train={type:'Train',baseId:'city1',officerIds:['o1','o2','o3']},end={type:'EndTurn'};
const levels=['opcode-exact','address-level','reverse-engineered-partial','empirical-high','documented-guide','compatibility-assumption','compatibility-reconstruction','provisional-engine-rule','open'];
const required=['id','level','target','originalEvidence','source','note','value'];
const sourceRequired=['repository','commit','path','section','url','originalUrls'];
const invalid=['Invalid adapter identity/evidence'];
function adaptersFor(kind,evidence) {
  return {...DEFAULT_ADAPTERS,[kind]:{...DEFAULT_ADAPTERS[kind],evidence}};
}
function reject(kind,mutate,label) {
  const evidence=copy(DEFAULT_ADAPTERS[kind].evidence);mutate(evidence);
  const adapters=adaptersFor(kind,evidence);let gateCalls=0,randomCalls=0;
  adapters.gate={...adapters.gate,evaluate(){gateCalls++;return [];}};
  adapters.random={...adapters.random,next(){randomCalls++;throw new Error('Unexpected random call');}};
  const initial=syntheticScenario(),session=createSession(initial),before=canonical({initial,session});
  assert.deepEqual(validateAdapters(adapters),invalid,label);
  assert.deepEqual(validateState(initial,adapters),invalid,label);
  for(const command of [train,end]) {
    assert.deepEqual(previewCommand(initial,command,adapters).reasons,invalid,label);
    const result=executeCommand(initial,command,adapters);assert.equal(result.ok,false,label);assert.equal(result.state,initial,label);
    const next=dispatch(session,command,adapters);assert.equal(next.result.ok,false,label);assert.equal(next.session,session,label);assert.deepEqual(next.result.reasons,invalid,label);
  }
  for(const run of [()=>createSession(initial,adapters),()=>replayCommands(initial,[],adapters),()=>replayCommands(initial,[train,end],adapters),()=>saveGame(session,adapters),()=>loadGame(canonical(session),adapters),()=>replaySession(session,adapters)]) assert.throws(run,/Invalid adapter identity\/evidence/,label);
  assert.equal(gateCalls,0,label);assert.equal(randomCalls,0,label);assert.equal(canonical({initial,session}),before,label);
}
function roundtrip(kind,evidence) {
  const adapters=adaptersFor(kind,evidence),initial=syntheticScenario(),commands=[train,end,train];
  let expected=createSession(initial,adapters);
  for(const command of commands) {const next=dispatch(expected,command,adapters);assert.equal(next.result.ok,true);expected=next.session;}
  const actual=replayCommands(initial,commands,adapters),bytes=canonical(expected);
  assert.equal(canonical(actual),bytes);assert.equal(saveGame(actual,adapters),bytes);assert.equal(canonical(loadGame(bytes,adapters)),bytes);assert.equal(canonical(replaySession(actual,adapters)),bytes);
  const uses=actual.trace.flatMap(entry=>entry.evidence).filter(use=>use.evidence.id===evidence.id);
  assert.equal(uses.length,kind==='turn'?1:2);for(const use of uses) assert.deepEqual(use.evidence,evidence);
  assert.deepEqual(actual.state.rng,initial.rng);return actual;
}
for(const kind of ['gate','growth','turn']) {
  test(`${kind} evidence rejects every missing or inherited required field before execution`,()=>{
    for(const field of required) {
      reject(kind,e=>{delete e[field];},`missing ${field}`);
      reject(kind,e=>{const value=e[field];delete e[field];Object.setPrototypeOf(e,{[field]:value});},`inherited ${field}`);
    }
    for(const field of sourceRequired) {
      reject(kind,e=>{delete e.source[field];},`missing source.${field}`);
      reject(kind,e=>{const value=e.source[field];delete e.source[field];Object.setPrototypeOf(e.source,{[field]:value});},`inherited source.${field}`);
    }
  });
  test(`${kind} evidence rejects wrong metadata and source field types`,()=>{
    for(const field of ['id','target','originalEvidence','note']) for(const value of [undefined,null,0,false,[],{}]) reject(kind,e=>{e[field]=value;},`${field} ${String(value)}`);
    for(const value of ['', 'x'.repeat(201)]) reject(kind,e=>{e.id=value;},'invalid evidence id');
    for(const value of [undefined,null,0,'source',[],{}]) reject(kind,e=>{e.source=value;},'invalid source');
    for(const field of ['repository','path','section','commit','url','introducedWith']) for(const value of [undefined,0,false,[],{}]) reject(kind,e=>{e.source[field]=value;},`source.${field} ${String(value)}`);
    for(const field of ['repository','path','section','introducedWith']) reject(kind,e=>{e.source[field]=null;},`source.${field} null`);
    for(const value of [undefined,null,0,'url',{},[null],[1],['ok',undefined],new Array(1)]) reject(kind,e=>{e.source.originalUrls=value;},'invalid originalUrls');
  });
  test(`${kind} evidence rejects unknown levels including object prototype names`,()=>{
    for(const level of [undefined,null,0,[],{},'', 'unknown','__proto__','constructor','toString','hasOwnProperty','valueOf','isPrototypeOf','propertyIsEnumerable']) reject(kind,e=>{e.level=level;},`level ${String(level)}`);
    reject(kind,e=>{for(const field of Object.keys(e)) delete e[field];Object.assign(e,{id:'custom',level:'__proto__',source:{}});},'original incomplete evidence reproduction');
  });
  test(`${kind} evidence checks actual URL array slots without invoking custom iterators`,()=>{
    for(const originalUrls of [[17],new Array(1)]) {
      originalUrls[Symbol.iterator]=function*(){yield 'pretend-valid';};
      reject(kind,e=>{e.source.originalUrls=originalUrls;},'iterator cannot disguise invalid array slots');
    }
    const inherited=new Array(1);Object.setPrototypeOf(inherited,{0:'inherited'});
    reject(kind,e=>{e.source.originalUrls=inherited;},'inherited URL slot is a hole');
    const evidence=copy(DEFAULT_ADAPTERS[kind].evidence);evidence.source.originalUrls=['actual-url'];
    evidence.source.originalUrls[Symbol.iterator]=()=>{throw new Error('Metadata validation must not call array iterator');};
    assert.deepEqual(validateAdapters(adaptersFor(kind,evidence)),[]);
    const session=replayCommands(syntheticScenario(),[train,end],adaptersFor(kind,evidence));
    const use=session.trace.flatMap(entry=>entry.evidence).find(use=>use.evidence.id===evidence.id);
    assert.deepEqual(use.evidence.source.originalUrls,['actual-url']);
    assert.equal(saveGame(session,adaptersFor(kind,evidence)),canonical(session));
  });
  test(`${kind} evidence supports every declared level with custom save/load/replay`,()=>{
    for(const level of levels) {
      const evidence={...copy(DEFAULT_ADAPTERS[kind].evidence),id:`custom-${kind}-${level}`,level,target:'Independent fixture',originalEvidence:'Custom annotation',source:{repository:'custom-repository',commit:null,path:'custom.txt',section:'fixture',url:null,originalUrls:['custom:source'],introducedWith:'custom-v1'},note:'Metadata is not source authenticity verification',value:{custom:[1,true,null,'value']}};
      roundtrip(kind,evidence);
    }
  });
  test(`${kind} evidence preserves string, nullable, optional and extension semantics`,()=>{
    for(const id of ['__proto__','constructor','toString','x'.repeat(200)]) {
      const evidence={id,level:'open',target:'',originalEvidence:'x'.repeat(201),source:{repository:'',commit:'custom-reference',path:'',section:'',url:'not a verified URL',originalUrls:['','x'.repeat(201)],introducedWith:'',extension:'source extension'},note:'',value:null,extension:{retained:true}};
      roundtrip(kind,evidence);
      delete evidence.source.introducedWith;evidence.source.commit=null;evidence.source.url=null;evidence.source.originalUrls=[];
      roundtrip(kind,evidence);
    }
  });
  test(`${kind} evidence keeps value unknown without adding a recursive JSON contract`,()=>{
    for(const value of [null,false,0,'',[1,null],{nested:{data:true}},undefined,()=>{},Symbol('unknown'),1n]) {
      const evidence={...copy(DEFAULT_ADAPTERS[kind].evidence),value};
      assert.deepEqual(validateAdapters(adaptersFor(kind,evidence)),[]);
      if(value!==undefined && typeof value!=='function' && typeof value!=='symbol' && typeof value!=='bigint') roundtrip(kind,evidence);
    }
    const cycle={};cycle.self=cycle;
    assert.deepEqual(validateAdapters(adaptersFor(kind,{...copy(DEFAULT_ADAPTERS[kind].evidence),value:cycle})),[]);
  });
}

test('evidence summary counts prototype-reserved labels numerically on direct input',()=>{
  const labels=['__proto__','constructor','toString','hasOwnProperty','valueOf','isPrototypeOf','propertyIsEnumerable','open','__proto__','constructor','toString'];
  const session=createSession(syntheticScenario());session.trace=[{evidence:labels.map(level=>({evidence:{level}}))}];
  const before=canonical(session),summary=evidenceSummary(session);
  assert.equal(Object.getPrototypeOf(summary),null);
  for(const level of new Set(labels)) {assert.ok(Object.hasOwn(summary,level));assert.equal(summary[level],labels.filter(x=>x===level).length);assert.equal(typeof summary[level],'number');}
  assert.deepEqual(JSON.parse(JSON.stringify(summary)),Object.fromEntries([...new Set(labels)].map(level=>[level,labels.filter(x=>x===level).length])));
  assert.equal(canonical(session),before);assert.equal(Object.prototype.polluted,undefined);
});
test('evidence summary empty and default outputs retain JSON and enumerable consumer shape',()=>{
  const empty=evidenceSummary(createSession(syntheticScenario()));assert.equal(Object.getPrototypeOf(empty),null);assert.equal(JSON.stringify(empty),'{}');assert.equal(canonical(empty),'{}');assert.deepEqual(Object.entries(empty),[]);
  const session=replayCommands(syntheticScenario(),[train,end,train]);const counts=new Map();
  for(const entry of session.trace) for(const use of entry.evidence) counts.set(use.evidence.level,(counts.get(use.evidence.level)??0)+1);
  const expected=Object.fromEntries(counts),summary=evidenceSummary(session);
  assert.equal(JSON.stringify(summary),JSON.stringify(expected));assert.equal(canonical(summary),canonical(expected));assert.deepEqual(Object.keys(summary),Object.keys(expected));assert.deepEqual(Object.entries(summary),Object.entries(expected));assert.deepEqual({...summary},expected);
});
