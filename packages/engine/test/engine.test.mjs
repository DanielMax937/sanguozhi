import test from 'node:test';
import assert from 'node:assert/strict';
import { canonical, conservativeTrainingGate, createSession, DEFAULT_ADAPTERS, dispatch, evidenceSummary, executeCommand, loadGame, previewCommand, replayCommands, replaySession, resolveRuleset, RULES, RULESET, saveGame, seededRandom, syntheticScenario, validateState, advanceDate } from '../src/index.ts';

const train = {type:'Train',baseId:'city1',officerIds:['o1','o2','o3']};
const copy = value => JSON.parse(JSON.stringify(value));
function freeze(value) { if (value && typeof value === 'object') { Object.freeze(value); for (const child of Object.values(value)) freeze(child); } return value; }
function unboosted() { const s = syntheticScenario(); s.bases[0].facilities.drillGround='none'; s.bases[0].facilities.militaryOffice='none'; return s; }
function rejectAtomic(state, command, pattern) {
  const snapshot = canonical(state);
  const result = executeCommand(freeze(state),command);
  assert.equal(result.ok,false);
  if (pattern) assert.match(result.reasons.join('; '),pattern);
  assert.strictEqual(result.state,state);
  assert.equal(canonical(state),snapshot);
  assert.equal(result.rngDraws,0);
}
const vectors = [
 [[100,100,100],0,false,23],[[100,100,100],0,true,34],
 [[100,100,100],10000,false,19],[[100,100,100],10000,true,28],
 [[100,100,100],100000,false,8],[[100,100,100],100000,true,12],
 [[100,100,100],150000,false,7],[[100,100,100],150000,true,10],
 [[80,60,40],50000,false,8],[[80,60,40],50000,true,12],
 [[100],5000,false,12],[[100],5000,true,18],
];
for (const [wars,troops,drill,expected] of vectors) test(`main reference vector WAR${wars}/troops${troops}/drill${drill}`,() => {
 const state=unboosted(); state.bases[0].troops=troops; state.bases[0].morale=0; state.bases[0].facilities.drillGround=drill?'complete':'none';
 wars.forEach((war,i) => {state.officers[i].war=war;state.officers[i].warBase=war;});
 const preview=previewCommand(state,{...train,officerIds:wars.map((_,i)=>`o${i+1}`)});
 assert.equal(preview.calculation.training.gainBeforeCap,expected);
 assert.equal(preview.ok,troops>0); // zero troops is a documented conservative gate, not formula behavior
});

test('integer denominator 1999/2000 boundary and odd boosted gain',() => {
 const state=unboosted(); state.bases[0].morale=0; state.officers.forEach(p=>{p.war=100;p.warBase=100});
 state.bases[0].troops=1999; assert.equal(previewCommand(state,train).calculation.training.denominator,20);
 state.bases[0].troops=2000; assert.equal(previewCommand(state,train).calculation.training.denominator,21);
 state.bases[0].troops=10000; state.bases[0].facilities.drillGround='complete';
 assert.equal(previewCommand(state,train).calculation.training.gainBeforeCap,28); // floor(19*1.5)
});
test('preview and execution share arithmetic; input frozen; zero core RNG draws',() => {
 const state=freeze(syntheticScenario()); const before=canonical(state);
 const random={id:state.rng.algorithm,next(){throw new Error('RNG must not be called');}};
 const adapters={...DEFAULT_ADAPTERS,random};
 const preview=previewCommand(state,train,adapters); const result=executeCommand(state,train,adapters);
 assert.equal(preview.ok,true); assert.deepEqual(preview.calculation,result.calculation);
 assert.equal(canonical(state),before); assert.notStrictEqual(result.state,state);
 assert.deepEqual(result.state.rng,state.rng); assert.equal(result.rngDraws,0);
 assert.ok(result.evidence.some(x=>x.evidence.id==='engine.presentationOmitted'));
});
test('actual capped gain drives TP; gold unchanged; all rewards and flags',() => {
 const state=unboosted(); state.bases[0].morale=95; state.officers.forEach(p=>{p.war=100;p.warBase=100});
 const out=executeCommand(state,train); assert.equal(out.ok,true);
 assert.equal(out.state.bases[0].morale,100); assert.equal(out.calculation.training.actualGain,5);
 assert.equal(out.state.force.techniquePoints,7); assert.equal(out.state.corps.actionPoints,20);
 assert.equal(out.state.bases[0].gold,state.bases[0].gold); assert.equal(out.state.bases[0].trainingCompleted,true);
 for (const person of out.state.officers) {assert.equal(person.warXp,2);assert.equal(person.merit,50);assert.equal(person.acted,true);}
});
test('TP and merit caps expose computed award vs credited amount',() => {
 const state=syntheticScenario(); state.force.techniquePoints=9999; state.officers[0].merit=59975;
 const out=executeCommand(state,train); assert.equal(out.ok,true);
 assert.equal(out.state.force.techniquePoints,10000); assert.equal(out.state.officers[0].merit,60000);
 assert.equal(out.calculation.training.techniquePointsBeforeCap,17);
 assert.match(out.evidence.find(x=>x.evidence.id==='resource.tpCap').detail,/credited TP=1/);
});
test('technique ID16 gives120 cap without changing existing morale',() => {
 const state=unboosted(); state.force.techniqueIds=[16]; state.bases[0].morale=119;
 const out=executeCommand(state,train); assert.equal(out.ok,true); assert.equal(out.state.bases[0].morale,120);
 assert.equal(out.state.force.techniquePoints,5); assert.equal(state.bases[0].morale,119);
});
test('only completed city facilities apply bonuses',() => {
 const state=syntheticScenario(); state.bases[0].facilities.drillGround='building';state.bases[0].facilities.militaryOffice='building';
 const p=previewCommand(state,train);assert.equal(p.calculation.training.drillApplied,false);assert.equal(p.calculation.training.apCost,20);
 const base={...copy(state.bases[0]),id:'port1',kind:'port',parentCityId:'city1',facilities:{drillGround:'none',militaryOffice:'none',completedTalismanPlatforms:0}};
 state.bases.push(base);state.officers.forEach(o=>o.baseId='port1');
 const port=executeCommand(state,{...train,baseId:'port1'});assert.equal(port.ok,true);assert.equal(port.calculation.training.apCost,20);assert.equal(port.calculation.training.drillApplied,false);
 base.facilities.drillGround='complete';rejectAtomic(state,{...train,baseId:'port1'},/City-only/);
});
for (const [name, mutate, command, pattern] of [
 ['insufficient AP',s=>{s.corps.actionPoints=9},train,/Insufficient/],
 ['already trained',s=>{s.bases[0].trainingCompleted=true},train,/already trained/],
 ['acted officer',s=>{s.officers[0].acted=true},train,/acted/],
 ['zero troops',s=>{s.bases[0].troops=0},train,/needs troops/],
 ['full morale',s=>{s.bases[0].morale=100},train,/at cap/],
 ['duplicate officers',()=>{},{...train,officerIds:['o1','o1']},/Duplicate/],
 ['zero officers',()=>{},{...train,officerIds:[]},/1\.\.3/],
 ['too many officers',()=>{},{...train,officerIds:['o1','o2','o3','o4']},/1\.\.3/],
 ['unknown officer',()=>{},{...train,officerIds:['missing']},/Unknown/],
 ['unknown base',()=>{},{...train,baseId:'missing'},/Unknown/],
 ['XP past storage cap',s=>{s.officers[0].warXp=3001},train,/XP/],
 ['overcap morale',s=>{s.bases[0].morale=101},train,/resources/],
 ['negative resource',s=>{s.bases[0].troops=-1},train,/resources/],
 ['fractional stat',s=>{s.officers[0].war=1.5},train,/outside/],
 ['unsupported technique',s=>{s.force.techniqueIds=[99]},train,/technique/],
 ['second corps',s=>{s.corps.isFirst=false},train,/first corps/],
 ['invalid day',s=>{s.date.day=31},{type:'EndTurn'},/calendar/],
 ['unknown command',()=>{},{type:'Recruit'},/Unsupported command/],
 ['unexpected command field',()=>{},{...train,cost:0},/Unexpected/],
]) test(`atomic rejection: ${name}`,() => {const s=syntheticScenario(); mutate(s);rejectAtomic(s,command,pattern);});
test('failed dispatch leaves accepted command log and session byte-identical',() => {
 const session=createSession(syntheticScenario());const before=canonical(session);
 const out=dispatch(session,{...train,officerIds:['o1','o1']});assert.strictEqual(out.session,session);assert.equal(canonical(session),before);assert.equal(session.trace.length,0);
});
test('XP97 to99 to101 remains cumulative; stat100 can still accumulate XP',() => {
 const state=syntheticScenario();state.officers[0].warXp=97;
 const one=executeCommand(state,train);assert.equal(one.ok,true);assert.equal(one.state.officers[0].warXp,99);
 const next=executeCommand(one.state,{type:'EndTurn'});const two=executeCommand(next.state,train);assert.equal(two.ok,true);assert.equal(two.state.officers[0].warXp,101);assert.equal(two.state.officers[0].war,100);
});
test('EndTurn resets modeled flags, restores per-corps AP, preserves morale/gold/XP/RNG',() => {
 const trained=executeCommand(syntheticScenario(),train).state;const before=copy(trained);
 const out=executeCommand(trained,{type:'EndTurn'});assert.equal(out.ok,true);
 assert.equal(out.calculation.ap.coreRecovery,42);assert.equal(out.state.corps.actionPoints,72);
 assert.equal(out.state.bases[0].trainingCompleted,false);assert.ok(out.state.officers.every(p=>!p.acted));
 assert.equal(out.state.bases[0].morale,before.bases[0].morale);assert.equal(out.state.bases[0].gold,before.bases[0].gold);
 assert.equal(out.state.officers[0].warXp,2);assert.deepEqual(out.state.rng,before.rng);
 assert.equal(executeCommand(out.state,train).ok,true);
});
function apFixture(counts) {
 const state=syntheticScenario();state.bases=[];state.officers=[];state.force.rulerId='o1';state.force.adviserId='o2';
 let counter=1;
 counts.forEach((count,i)=>{const b=copy(syntheticScenario().bases[0]);b.id=`b${i}`;b.facilities={drillGround:'none',militaryOffice:'none',completedTalismanPlatforms:0};state.bases.push(b);
  for(let n=0;n<count;n++){const p=copy(syntheticScenario().officers[0]);p.id=`o${counter++}`;p.baseId=b.id;p.leadership=100;p.charisma=100;p.intelligence=100;state.officers.push(p);}
 });
 state.corps.actionPoints=0;return state;
}
test('AP top6/per-base10 caps, talisman after floor, recovery above180, AP bank255',() => {
 const s=apFixture([11,12,10,10,10,10,9]);s.bases[0].facilities.completedTalismanPlatforms=2;s.corps.actionPoints=100;
 const r=executeCommand(s,{type:'EndTurn'});assert.equal(r.ok,true);assert.equal(r.calculation.ap.officerParam,60);
 assert.equal(r.calculation.ap.cityParam,50);assert.equal(r.calculation.ap.coreRecovery,180);assert.equal(r.calculation.ap.recovery,190);assert.equal(r.calculation.ap.actualRecovery,155);assert.equal(r.state.corps.actionPoints,255);
});
test('AP integer adviser115% avoids floating floor error; no adviser100%',() => {
 const s=apFixture([10,10,10,10]);s.officers[0].leadership=50;s.officers[0].charisma=50; // leader30 + city30 + heads40 =100
 s.officers[1].intelligence=90;
 assert.equal(executeCommand(s,{type:'EndTurn'}).calculation.ap.coreRecovery,115);
 s.force.adviserId=null;assert.equal(executeCommand(s,{type:'EndTurn'}).calculation.ap.coreRecovery,100);
});
test('AP documented 86+5=91 PK anchor',() => {
 const s=apFixture([10,10,2]);s.officers[0].leadership=50;s.officers[0].charisma=50;s.bases[0].facilities.completedTalismanPlatforms=1;
 const ap=executeCommand(s,{type:'EndTurn'}).calculation.ap;assert.equal(ap.coreRecovery,86);assert.equal(ap.recovery,91);
});
test('port counts heads only with controlled mother city, never city count',() => {
 const s=apFixture([2,4]);s.bases[1].kind='port';s.bases[1].parentCityId='b0';
 let ap=executeCommand(s,{type:'EndTurn'}).calculation.ap;assert.equal(ap.cityParam,0);assert.equal(ap.officerParam,6);
 const foreign=copy(s.bases[0]);foreign.id='enemy';foreign.ownerForceId='enemy';foreign.corpsId=null;s.bases.push(foreign);s.bases[1].parentCityId='enemy';
 ap=executeCommand(s,{type:'EndTurn'}).calculation.ap;assert.equal(ap.officerParam,2);
});
test('calendar uses xun including December/year and season boundaries',() => {
 assert.deepEqual(advanceDate({year:200,month:2,day:1}).next,{year:200,month:2,day:11});
 assert.deepEqual(advanceDate({year:200,month:2,day:11}).next,{year:200,month:2,day:21});
 assert.deepEqual(advanceDate({year:200,month:2,day:21}).next,{year:200,month:3,day:1});
 assert.equal(advanceDate({year:200,month:3,day:21}).seasonBoundary,true);
 assert.deepEqual(advanceDate({year:200,month:12,day:21}),{next:{year:201,month:1,day:1},monthBoundary:true,seasonBoundary:true,yearBoundary:true});
});
test('Vanilla is explicit unsupported profile and cannot inherit PK effects',() => {
 assert.equal(resolveRuleset('pk').ok,true);const vanilla=resolveRuleset('vanilla');assert.equal(vanilla.ok,false);assert.match(vanilla.reason,/Unsupported/);
 const s=syntheticScenario();s.ruleset.rulesetVersion='vanilla';rejectAtomic(s,train,/Unsupported ruleset/);assert.throws(()=>createSession(s),/Vanilla/);
});
test('seeded RNG is deterministic, pure, serializable and explicitly engineering',() => {
 const s={algorithm:seededRandom.id,seed:123,draws:0};const a=seededRandom.next(freeze(s));const b=seededRandom.next(s);
 assert.deepEqual(a,b);assert.equal(s.draws,0);assert.equal(a.state.draws,1);assert.ok(a.value>=0&&a.value<1);
 assert.equal(RULES['engine.rng'].level,'provisional-engine-rule');assert.throws(()=>seededRandom.next({...s,seed:-1}));
});
test('replaceable gate is identified by saved profile; failure/mutation cannot corrupt state',() => {
 const s=syntheticScenario();s.ruleset.gateProfile='test-reject';
 const gate={id:'test-reject',evidence:{...copy(conservativeTrainingGate.evidence),id:'test-reject'},evaluate(snapshot){snapshot.bases[0].morale=999;return [];}};
 const before=canonical(s);const result=executeCommand(s,train,{...DEFAULT_ADAPTERS,gate});assert.equal(result.ok,false);assert.match(result.reasons.join(),/adapter failed/);assert.equal(canonical(s),before);
 assert.equal(validateState(s,DEFAULT_ADAPTERS).length>0,true);
});
test('normalized runtime rules and ruleset are frozen',() => {assert.throws(()=>{RULES['train.ap'].value.ordinary=0});assert.throws(()=>{RULESET.fixProfile='patched'});});
test('five-command synthetic objective and full save/load/replay identity',() => {
 const commands=[train,{type:'EndTurn'},train,{type:'EndTurn'},train];
 const session=replayCommands(syntheticScenario(),commands);assert.equal(session.state.bases[0].morale,100);assert.equal(session.state.officers[0].warXp,6);assert.equal(session.state.force.techniquePoints,45);
 assert.deepEqual(session.state.date,{year:201,month:1,day:1});assert.equal(session.state.rng.draws,0);
 assert.deepEqual(replaySession(session),session);assert.deepEqual(loadGame(saveGame(session)),session);assert.equal(session.trace.length,5);
 for(const entry of session.trace){assert.ok(entry.before);assert.ok(entry.after);assert.ok(entry.evidence.every(x=>x.evidence.source.path&&x.evidence.originalEvidence));}
 assert.ok(evidenceSummary(session)['provisional-engine-rule']>0);assert.ok(evidenceSummary(session).open>0);
});
test('tampered save state, trace, evidence or ruleset is rejected',() => {
 const session=replayCommands(syntheticScenario(),[train]);
 for(const mutate of [s=>s.state.corps.actionPoints++,s=>s.trace[0].after.bases[0].morale++,s=>s.trace[0].evidence[0].evidence.level='opcode-exact',s=>s.initialState.ruleset.patchVersion='1.2',s=>s.trace.push({command:{type:'Recruit'}})]) {
  const broken=copy(session);mutate(broken);assert.throws(()=>loadGame(JSON.stringify(broken)));
 }
 assert.throws(()=>loadGame('{}'));assert.throws(()=>loadGame('not json'));
});
test('input session and earlier results are not aliased after dispatch',() => {
 const session=freeze(createSession(syntheticScenario()));const out=dispatch(session,train);out.result.state.bases[0].morale=1;
 assert.equal(out.session.state.bases[0].morale,64);assert.equal(session.state.bases[0].morale,40);
});
test('valid-state wrong-base officers and foreign-base selection are rejected atomically',() => {
 const s=syntheticScenario();const another=copy(s.bases[0]);another.id='city2';s.bases.push(another);
 const before=canonical(s);const wrong=executeCommand(s,{...train,baseId:'city2'});assert.equal(wrong.ok,false);assert.match(wrong.reasons.join(),/not present/);assert.equal(canonical(s),before);
 another.ownerForceId='enemy';another.corpsId=null;rejectAtomic(s,{...train,baseId:'city2'},/controlled|ownership/);
});
test('unsupported zero-owned-city and split-corps state rejected before mutation',() => {
 const s=syntheticScenario();s.bases[0].ownerForceId='enemy';s.bases[0].corpsId=null;rejectAtomic(s,{type:'EndTurn'},/controlled city/);
 const split=syntheticScenario();split.bases[0].corpsId='c2';rejectAtomic(split,{type:'EndTurn'},/Split-corps/);
});
test('calendar/turn/revision representational boundaries reject atomically',() => {
 const s=syntheticScenario();s.date={year:9998,month:12,day:21};rejectAtomic(s,{type:'EndTurn'},/limit/);
 const turn=syntheticScenario();turn.turn=Number.MAX_SAFE_INTEGER-1;rejectAtomic(turn,{type:'EndTurn'},/limit/);
 const revision=syntheticScenario();revision.revision=Number.MAX_SAFE_INTEGER-1;rejectAtomic(revision,train,/limit/);
});
test('RNG injection is never called by either supported core command or preview',() => {
 const s=syntheticScenario();s.rng.algorithm='test-rng';let calls=0;
 const adapters={...DEFAULT_ADAPTERS,random:{id:'test-rng',next(){calls++;throw new Error('Unexpected draw')}}};
 for(const command of [train,{type:'EndTurn'}]) {assert.equal(previewCommand(s,command,adapters).ok,true);assert.equal(executeCommand(s,command,adapters).ok,true);}
 assert.equal(calls,0);
});
test('engine kernel imports contain no I/O, wallclock or ambient randomness',async () => {
 const {readFile,readdir}=await import('node:fs/promises');const {fileURLToPath}=await import('node:url');const dir=fileURLToPath(new URL('../src/',import.meta.url));
 for(const name of await readdir(dir)) {if(!name.endsWith('.ts'))continue;const source=await readFile(`${dir}/${name}`,'utf8');assert.doesNotMatch(source,/Math\.random|Date\.now|new Date\(|from ['"]node:|from ['"](?:fs|http|https|net|child_process)['"]|\bfetch\(/,name);}
});
test('text adapter handles piped commands, atomic invalid action, file save/load and replay',async () => {
 const {spawnSync}=await import('node:child_process');const {mkdtemp,readFile,rm}=await import('node:fs/promises');const {tmpdir}=await import('node:os');const {join}=await import('node:path');const {fileURLToPath}=await import('node:url');
 const directory=await mkdtemp(join(tmpdir(),'san11-training-cli-'));
 try {
  const program=fileURLToPath(new URL('../../../apps/text/play.mjs',import.meta.url));
  const input=['preview o1,o2,o3','train o1,o1','train o1,o2,o3','end','train o1,o2,o3','end','train o1,o2,o3','inspect','save test-save.json','load test-save.json','replay','save test-save.json','quit'].join('\n')+'\n';
  const run=spawnSync(process.execPath,[program],{cwd:directory,input,encoding:'utf8'});
  assert.equal(run.status,0,run.stderr);assert.equal(run.stderr,'');assert.match(run.stdout,/Duplicate officers/);assert.match(run.stdout,/morale 100/);assert.match(run.stdout,/已保存 test-save.json/);assert.match(run.stdout,/已校验并载入/);assert.match(run.stdout,/重放一致：5条命令/);assert.match(run.stdout,/EEXIST/);
  const loaded=loadGame(await readFile(join(directory,'test-save.json'),'utf8'));assert.equal(loaded.state.bases[0].morale,100);assert.equal(loaded.trace.length,5);
 } finally { await rm(directory,{recursive:true,force:true}); }
});
