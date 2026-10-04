import test from 'node:test';
import assert from 'node:assert/strict';
import { canonical, calculateWarGrowth, createSession, DEFAULT_ADAPTERS, derivedWar, dispatch, executeCommand, loadGame, migrateLegacyState, previewCommand, replayCommands, replaySession, rulesetForAdapters, saveGame, syntheticScenario, validateState } from '../src/index.ts';

const train={type:'Train',baseId:'city1',officerIds:['o1','o2','o3']};
const end={type:'EndTurn'};
const copy=x=>JSON.parse(JSON.stringify(x));
function setGrowth(person,talent,xp) { person.warBase=talent;person.warXp=xp;person.war=derivedWar(talent,xp,DEFAULT_ADAPTERS.growth.config); }
function atomic(s,command,adapters=DEFAULT_ADAPTERS) {
 const before=canonical(s);const out=executeCommand(s,command,adapters);
 assert.equal(out.ok,false,out.reasons.join('; '));assert.strictEqual(out.state,s);assert.equal(canonical(s),before);return out;
}
for (const [xp,after,gain] of [[97,99,0],[98,100,1],[99,101,1],[100,102,0],[199,201,1],[2899,2901,1],[2998,3000,1],[2999,3000,1],[3000,3000,0]]) {
 test(`cumulative XP boundary ${xp}+2 -> ${after}, WAR gain ${gain}`,()=>{
  const s=syntheticScenario();setGrowth(s.officers[2],20,xp);
  const before=copy(s);const preview=previewCommand(s,train);const out=executeCommand(s,train);
  assert.equal(out.ok,true,out.reasons.join('; '));assert.deepEqual(out.calculation,preview.calculation);assert.deepEqual(s,before);
  const p=out.state.officers[2],g=out.calculation.progression[2];
  assert.equal(p.warXp,after);assert.equal(p.war,20+Math.floor(after/100));assert.equal(g.actualStatGain,gain);
  assert.equal(g.creditedXp,after-xp);assert.equal(g.remainderAfter,after%100);assert.equal(g.earnedPointsAfter,Math.floor(after/100));assert.equal(g.displayProgressAfter,after===3000?100:after%100);
  assert.equal(out.state.officers[2].merit,50);assert.equal(out.state.officers[2].acted,true);assert.equal(out.state.bases[0].trainingCompleted,true);
 });
}
test('stat100 continues accumulating XP to3000 without further WAR or reward rejection',()=>{
 const s=syntheticScenario();setGrowth(s.officers[2],99,2999);
 const out=executeCommand(s,train);assert.equal(out.ok,true);const g=out.calculation.progression[2];
 assert.equal(g.xpAfter,3000);assert.equal(g.actualStatGain,0);assert.equal(g.creditedXp,1);assert.equal(g.statAtCap,true);assert.equal(g.xpAtCap,true);
 assert.equal(out.state.officers[2].merit,50);assert.equal(out.state.officers[2].warBase,99);
});
test('no 100XP consumption, no double counted growth; new WAR affects the next training formula',()=>{
 const s=syntheticScenario();s.bases[0].facilities.drillGround='none';s.bases[0].troops=1;s.bases[0].morale=0;
 s.officers.forEach(p=>setGrowth(p,79,98));
 const one=executeCommand(s,train);assert.equal(one.calculation.training.warSum,237);
 assert.ok(one.state.officers.every(p=>p.war===80&&p.warXp===100&&p.warBase===79));
 const turn=executeCommand(one.state,end);const two=executeCommand(turn.state,train);
 assert.equal(two.calculation.training.warSum,240);assert.equal(one.calculation.training.baseGain,18);assert.equal(two.calculation.training.baseGain,19);
 assert.ok(two.state.officers.every(p=>p.war===80&&p.warXp===102));
});
test('source-style +30 budget and stat100 cap are independent for 1600 arithmetic awards',()=>{
 let person=copy(syntheticScenario().officers[2]);setGrowth(person,3,0);
 let credited=0,growth=0;
 for(let n=0;n<1600;n++) {const g=calculateWarGrowth(person,2,DEFAULT_ADAPTERS.growth.config);credited+=g.creditedXp;growth+=g.actualStatGain;person.warXp=g.xpAfter;person.war=g.warAfter;}
 assert.equal(person.warXp,3000);assert.equal(person.war,33);assert.equal(credited,3000);assert.equal(growth,30);
});
test('invalid talent, cumulative XP and forged derived WAR fail before rewards',()=>{
 for(const mutate of [s=>s.officers[2].warXp=3001,s=>s.officers[2].warXp=-1,s=>s.officers[2].warBase=-1,s=>s.officers[2].war++,s=>s.officers[2].warXp=100,s=>s.officers[2].warXp=1.5]) {const s=syntheticScenario();mutate(s);atomic(s,train);}
});
for(const [label,mutate] of [['prisoner',p=>p.identity=5],['away',p=>p.location='away'],['deployed',p=>p.location='unit'],['mission',p=>p.onMission=true]]) {
 test(`eligibility ${label} stays unavailable after action reset`,()=>{
  const s=syntheticScenario();const p=s.officers[2];mutate(p);p.acted=true;
  assert.deepEqual(validateState(s,DEFAULT_ADAPTERS),[]);atomic(s,train);
  const out=executeCommand(s,end);assert.equal(out.ok,true);assert.equal(out.state.officers[2].location,p.location);assert.equal(out.state.officers[2].onMission,p.onMission);
  atomic(out.state,train);assert.equal(executeCommand(out.state,{...train,officerIds:['o1','o2']}).ok,true);
 });
}
test('AP status adapter counts active at-base officers, including in-base mission, without changing roles',()=>{
 for(const [mutate,count] of [[p=>p.identity=5,2],[p=>p.location='away',2],[p=>p.location='unit',2],[p=>p.onMission=true,3]]) {
  const s=syntheticScenario();mutate(s.officers[2]);const out=executeCommand(s,end);assert.equal(out.ok,true);assert.equal(out.calculation.ap.officerParam,count);
 }
 const s=syntheticScenario();s.officers[1].location='away';const out=executeCommand(s,end);
 assert.equal(out.calculation.ap.adviserPercent,110);assert.equal(out.calculation.ap.officerParam,2);
});
test('ruler or adviser cannot become prisoner without an explicit future role-transition implementation',()=>{
 for(const i of [0,1]) {const s=syntheticScenario();s.officers[i].identity=5;assert.match(atomic(s,end).reasons.join('; '),/active identity/);}
});
test('reset trace lists only changed represented objects and never clears foreign base flags',()=>{
 const s=syntheticScenario();const city=copy(s.bases[0]);city.id='enemy';city.ownerForceId='enemy';city.corpsId=null;city.trainingCompleted=true;s.bases.push(city);
 s.bases[0].trainingCompleted=true;s.officers[0].acted=true;s.officers[2].acted=true;s.officers[2].onMission=true;
 const out=executeCommand(s,end);assert.equal(out.ok,true);
 assert.deepEqual(out.calculation.turn.resetBaseIds,['city1']);assert.deepEqual(out.calculation.turn.resetOfficerIds,['o1','o3']);
 assert.equal(out.state.bases[1].trainingCompleted,true);assert.equal(out.state.officers[2].acted,false);assert.equal(out.state.officers[2].onMission,true);
 assert.deepEqual(out.calculation.turn.phases,DEFAULT_ADAPTERS.turn.phases);
});
test('replaceable growth config is saved, traceable and rejects loading under a different config with the same ID',()=>{
 const adapters={...DEFAULT_ADAPTERS,growth:{...DEFAULT_ADAPTERS.growth,config:{experiencePerPoint:50,experienceCap:1500,statMin:1,statMax:95}}};
 const s=syntheticScenario();s.ruleset=rulesetForAdapters(adapters);s.officers.forEach(p=>{p.warBase=60;p.warXp=49;p.war=60});
 const session=replayCommands(s,[train,end,train],adapters);assert.equal(session.state.officers[0].war,61);assert.equal(session.state.officers[0].warXp,53);
 assert.deepEqual(loadGame(saveGame(session,adapters),adapters),session);assert.throws(()=>loadGame(JSON.stringify(session)),/profile/);
 const tampered=copy(session);tampered.initialState.ruleset.progressionConfig.experiencePerPoint=100;assert.throws(()=>loadGame(JSON.stringify(tampered),adapters));
});
test('replaceable bounded phase order is saved and replayed; incomplete or repeated phases are rejected atomically',()=>{
 const adapters={...DEFAULT_ADAPTERS,turn:{...DEFAULT_ADAPTERS.turn,id:'test-turn-order',phases:[...DEFAULT_ADAPTERS.turn.phases].reverse()}};
 const s=syntheticScenario();s.ruleset=rulesetForAdapters(adapters);
 const session=replayCommands(s,[train,end],adapters);assert.deepEqual(session.trace[1].calculation.turn.phases,adapters.turn.phases);assert.equal(session.state.turn,1);
 assert.deepEqual(loadGame(saveGame(session,adapters),adapters),session);assert.throws(()=>loadGame(JSON.stringify(session)),/profile/);
 for(const phases of [[],['advance-date'],[...adapters.turn.phases,'recover-ap'],['bad',...adapters.turn.phases.slice(1)]]) {
  const bad={...adapters,turn:{...adapters.turn,phases}};assert.match(atomic(s,end,bad).reasons.join(),/phases/);
 }
});
test('invalid lifecycle configurations and adapter metadata are rejected without throwing or mutating',()=>{
 for(const config of [null,{}, {...DEFAULT_ADAPTERS.growth.config,experiencePerPoint:0},{...DEFAULT_ADAPTERS.growth.config,experienceCap:3001},{...DEFAULT_ADAPTERS.growth.config,statMin:101}]) {
  const bad={...DEFAULT_ADAPTERS,growth:{...DEFAULT_ADAPTERS.growth,config}};atomic(syntheticScenario(),train,bad);
 }
 atomic(syntheticScenario(),train,{...DEFAULT_ADAPTERS,turn:null});
});
test('custom permissive gate cannot bypass action, ownership, physical location, mission or prisoner safety',()=>{
 const gate={id:'test-permissive',evidence:copy(DEFAULT_ADAPTERS.gate.evidence),evaluate(){return [];}};const adapters={...DEFAULT_ADAPTERS,gate};
 for(const mutate of [s=>s.officers[2].onMission=true,s=>s.officers[2].identity=5,s=>s.officers[2].location='unit',s=>s.officers[2].acted=true,s=>s.bases[0].trainingCompleted=true,s=>s.bases[0].troops=0,s=>s.bases[0].morale=100]) {
  const s=syntheticScenario();s.ruleset=rulesetForAdapters(adapters);mutate(s);atomic(s,train,adapters);
 }
});
test('legacy migration is explicit, state-only and preserves below100 cumulative XP without fabricated history',()=>{
 const s=syntheticScenario();s.schemaVersion=1;delete s.originProfile;s.ruleset={id:'pk-training-slice-v1',rulesetVersion:'pk',patchVersion:'1.1',fixProfile:'original',gateProfile:'conservative-training-v1',apProfile:'single-first-corps-c9-v1',turnProfile:'training-only-turn-v1',progressionProfile:'reject-stat-growth-v1',presentationProfile:'omit-training-presentation-v1'};
 s.officers.forEach(p=>{delete p.warBase;delete p.identity;delete p.location;delete p.onMission;p.warXp=98});
 const before=copy(s);const result=migrateLegacyState(s);assert.deepEqual(s,before);assert.equal(result.migration.historicalTracePreserved,false);
 assert.equal(result.state.officers[2].warBase,60);assert.equal(result.state.officers[2].warXp,98);
 const session=createSession(result.state);assert.equal(session.trace.length,0);assert.equal(dispatch(session,train).session.state.officers[2].war,61);
 assert.throws(()=>loadGame(JSON.stringify({saveVersion:1,engineVersion:'training-kernel-v1',initialState:s,state:s,trace:[]})),/explicit state migration/);
 for(const mutate of [s=>s.officers[0].warXp=100,s=>s.officers[0].extra=true,s=>s.ruleset.gateProfile='unknown',s=>s.corps.actionPoints=-1]) {const bad=copy(s);mutate(bad);assert.throws(()=>migrateLegacyState(bad));}
});
test('ten-year synthetic lifecycle keeps time moving after morale cap; full trace/seed save-load replay stays identical',()=>{
 const initial=syntheticScenario(20261004);initial.officers.forEach((p,i)=>setGrowth(p,60-i*10,98));
 let session=createSession(initial),acceptedTraining=0,rejectedTraining=0;
 for(let turn=0;turn<360;turn++) {
  const trained=dispatch(session,train);
  if(trained.result.ok) {session=trained.session;acceptedTraining++;}
  else {assert.strictEqual(trained.session,session);assert.match(trained.result.reasons.join(),/at cap/);rejectedTraining++;}
  const out=dispatch(session,end);assert.equal(out.result.ok,true);session=out.session;
 }
 assert.ok(acceptedTraining>0&&rejectedTraining>0);assert.equal(session.state.turn,360);assert.deepEqual(session.state.date,{year:210,month:12,day:11});
 assert.equal(session.state.bases[0].morale,100);assert.equal(session.state.corps.actionPoints,255);
 assert.ok(session.state.officers.every(p=>p.warXp===98+2*acceptedTraining&&p.war===p.warBase+1&&!p.acted));
 assert.deepEqual(session.state.rng,initial.rng);assert.deepEqual(loadGame(saveGame(session)),session);assert.deepEqual(replaySession(session),session);
 const altered=copy(session);const index=altered.trace.findIndex(t=>t.command.type==='Train');altered.trace[index].calculation.progression[0].creditedXp++;
 assert.throws(()=>loadGame(JSON.stringify(altered)),/mismatch/);
});

test('returned result calculation/evidence/reasons cannot mutate the accepted journal',()=>{
 const out=dispatch(createSession(syntheticScenario()),train);const before=canonical(out.session);
 out.result.calculation.progression[0].xpAfter=3000;
 out.result.evidence[0].detail='mutated presentation data';
 out.result.evidence[0].evidence.source.originalUrls.push('untrusted');
 out.result.reasons.push('not a session rejection');
 assert.equal(canonical(out.session),before);assert.deepEqual(loadGame(saveGame(out.session)),out.session);
});
