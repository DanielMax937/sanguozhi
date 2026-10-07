import test from 'node:test';
import assert from 'node:assert/strict';
import { canonical, createSession, DEFAULT_ADAPTERS, derivedWar, dispatch, loadGame, replayCommands, replaySession, rulesetForAdapters, saveGame, syntheticScenario } from '../src/index.ts';

const train={type:'Train',baseId:'city1',officerIds:['o1','o2','o3']};
const end={type:'EndTurn'};
const copy=value=>JSON.parse(JSON.stringify(value));
function freeze(value) {
  if(value && typeof value==='object') {Object.freeze(value);Object.values(value).forEach(freeze);}
  return value;
}
// Public dispatch remains the independent, unchanged producer of the original save format.
function reference(initial,commands,adapters=DEFAULT_ADAPTERS) {
  let session=createSession(initial,adapters);
  for(const [index,command] of commands.entries()) {
    const next=dispatch(session,command,adapters);
    if(!next.result.ok) throw new Error(`Replay command ${index} rejected: ${next.result.reasons.join('; ')}`);
    session=next.session;
  }
  return session;
}
function compare(initial,commands,adapters=DEFAULT_ADAPTERS) {
  const expected=reference(initial,commands,adapters);
  const actual=replayCommands(initial,commands,adapters);
  assert.equal(canonical(actual),canonical(expected));
  assert.equal(canonical(loadGame(canonical(expected),adapters)),canonical(expected));
  assert.equal(saveGame(actual,adapters),canonical(expected));
  assert.equal(canonical(replaySession(expected,adapters)),canonical(expected));
  return actual;
}
function setGrowth(person,talent,xp,config=DEFAULT_ADAPTERS.growth.config) {
  person.warBase=talent;person.warXp=xp;person.war=derivedWar(talent,xp,config);
}

test('private replay matches dispatch byte-for-byte for empty and mixed histories',()=>{
  for(const commands of [[],[end],[train,end,train,end,train]]) compare(freeze(syntheticScenario()),freeze(copy(commands)));
});
for(const xp of [97,98,99,100,199,2899,2998,2999,3000]) {
  test(`private replay preserves dispatch growth boundary ${xp}`,()=>{
    const initial=syntheticScenario();initial.officers.forEach((person,i)=>setGrowth(person,50-i*10,xp));
    compare(initial,[train,end,train]);
  });
}
for(const kind of ['port','gate']) {
  test(`private replay preserves ${kind} training and reset snapshots`,()=>{
    const initial=syntheticScenario();
    initial.bases.push({...copy(initial.bases[0]),id:kind,kind,parentCityId:'city1',facilities:{drillGround:'none',militaryOffice:'none',completedTalismanPlatforms:0}});
    initial.officers.forEach(person=>person.baseId=kind);
    const session=compare(initial,[{...train,baseId:kind},end,{...train,baseId:kind}]);
    assert.deepEqual(session.trace[1].calculation.turn.resetBaseIds,[kind]);
  });
}
test('private replay matches legal replacement adapters with no core random draws',()=>{
  let draws=0;
  const adapters={...DEFAULT_ADAPTERS,
    gate:{id:'replay-test-gate',evidence:copy(DEFAULT_ADAPTERS.gate.evidence),evaluate:()=>[]},
    growth:{...DEFAULT_ADAPTERS.growth,config:{experiencePerPoint:50,experienceCap:1500,statMin:1,statMax:95}},
    turn:{...DEFAULT_ADAPTERS.turn,id:'replay-test-turn',phases:[...DEFAULT_ADAPTERS.turn.phases].reverse()},
    random:{id:'replay-test-random',next(){draws++;throw new Error('Unexpected core random draw');}},
  };
  const initial=syntheticScenario();initial.ruleset=rulesetForAdapters(adapters);initial.rng.algorithm=adapters.random.id;
  initial.officers.forEach((person,i)=>setGrowth(person,60-i*10,49,adapters.growth.config));
  const session=compare(freeze(initial),freeze(copy([train,end,train])),freeze(adapters));
  assert.equal(session.state.officers[0].warXp,53);assert.equal(session.state.officers[0].war,61);assert.equal(draws,0);
});

function collectObjects(value,seen=new Set()) {
  if(value && typeof value==='object' && !seen.has(value)) {seen.add(value);Object.values(value).forEach(child=>collectObjects(child,seen));}
  return seen;
}
function assertIsolated(value,forbidden=new Set(),seen=new Set()) {
  if(!value || typeof value!=='object') return;
  assert.ok(!forbidden.has(value),'output shares a mutable object with an input');
  assert.ok(!seen.has(value),'distinct output paths share a mutable object');
  seen.add(value);Object.values(value).forEach(child=>assertIsolated(child,forbidden,seen));
}
test('private replay deeply isolates inputs, output state, commands, evidence and adjacent snapshots',()=>{
  const initial=syntheticScenario(),commands=copy([train,end,train]);
  const inputs=collectObjects([initial,commands,DEFAULT_ADAPTERS]);
  const session=replayCommands(initial,commands);
  assertIsolated(session,inputs);
  const before=canonical(session);
  initial.bases[0].facilities.drillGround='none';commands[0].officerIds.push('external');
  assert.equal(canonical(session),before);
  for(const mutate of [
    s=>s.initialState.officers[0].warXp++,
    s=>s.state.bases[0].facilities.drillGround='none',
    s=>s.trace[0].before.rng.draws++,
    s=>s.trace[0].after.officers[0].warXp++,
    s=>s.trace[0].calculation.progression[0].xpAfter++,
    s=>s.trace[0].evidence[0].evidence.source.originalUrls.push('changed'),
    s=>s.trace[0].command.officerIds.push('changed'),
  ]) {
    const isolated=replayCommands(freeze(syntheticScenario()),freeze(copy([train,end,train])));
    const nextBefore=canonical(isolated.trace[1].before),lastAfter=canonical(isolated.trace[2].after);
    mutate(isolated);
    assert.equal(canonical(isolated.trace[1].before),nextBefore);assert.equal(canonical(isolated.trace[2].after),lastAfter);
    assert.equal(canonical(session),before);
  }
  assertIsolated(replayCommands(syntheticScenario(),[]));
  const old=freeze(reference(syntheticScenario(),[train]));const oldBytes=canonical(old);
  const next=dispatch(old,end);assertIsolated(next.session,collectObjects([old,next.result]));
  next.session.trace[0].after.officers[0].warXp++;assert.equal(canonical(old),oldBytes);
});

test('private replay preserves exact rejection index and reason without input mutation',()=>{
  const cases=[ [null], [{type:'Recruit'}], [train,train], [end,{...train,officerIds:['o1','o1']}], [train,end,{...train,baseId:'missing'}] ];
  for(const commands of cases) {
    const initial=freeze(syntheticScenario());freeze(commands);const before=canonical({initial,commands});
    let expected;try {reference(initial,commands);} catch(error) {expected=error.message;}
    assert.ok(expected);assert.throws(()=>replayCommands(initial,commands),error=>error.message===expected);
    assert.equal(canonical({initial,commands}),before);
  }
});

test('dispatch-produced saves remain compatible and all envelope and journal tamper categories reject',()=>{
  const legacy=reference(syntheticScenario(),[train,end,train]);const serialized=canonical(legacy);
  const loaded=loadGame(serialized);assert.equal(canonical(loaded),serialized);assertIsolated(loaded,collectObjects(legacy));
  const mutations=[
    s=>s.saveVersion=1, s=>s.engineVersion='other', s=>s.extra=true,
    s=>s.initialState.bases[0].morale++, s=>s.state.corps.actionPoints++,
    s=>s.trace[0].before.officers[0].warXp++, s=>s.trace[0].after.bases[0].morale++,
    s=>s.trace[0].command.officerIds.pop(), s=>s.trace[0].calculation.progression[0].creditedXp++,
    s=>s.trace[0].evidence[0].detail='changed', s=>s.trace[0].evidence[0].evidence.level='opcode-exact',
    s=>s.trace[0].evidence[0].evidence.source.originalUrls.push('changed'),
    s=>s.trace[0].reasons.push('changed'), s=>s.trace[0].ok=false, s=>s.trace[0].rngDraws++,
    s=>s.trace[0].extra=true, s=>delete s.trace[0].before, s=>s.trace.pop(),
    s=>s.trace.reverse(), s=>s.trace[0]=null, s=>s.trace[0].command=null,
  ];
  for(const mutate of mutations) {
    const altered=copy(legacy);mutate(altered);const bytes=canonical(altered);
    assert.throws(()=>loadGame(bytes));assert.throws(()=>saveGame(altered));assert.throws(()=>replaySession(altered));
    assert.equal(canonical(altered),bytes);assert.equal(canonical(legacy),serialized);
  }
});

test('private replay exactly matches the 364-command ten-year dispatch journal',()=>{
  const initial=syntheticScenario(20261004);initial.officers.forEach((person,i)=>setGrowth(person,60-i*10,98));
  let legacy=createSession(initial);const commands=[];
  for(let turn=0;turn<360;turn++) {
    const trained=dispatch(legacy,train);
    if(trained.result.ok) {legacy=trained.session;commands.push(copy(train));}
    const ended=dispatch(legacy,end);assert.equal(ended.result.ok,true);legacy=ended.session;commands.push(copy(end));
  }
  assert.equal(commands.length,364);assert.equal(legacy.state.turn,360);
  const serialized=canonical(legacy),replayed=replayCommands(freeze(initial),freeze(commands));
  assert.equal(canonical(replayed),serialized);assert.equal(canonical(loadGame(serialized)),serialized);
  assert.equal(saveGame(replayed),serialized);assert.equal(canonical(replaySession(legacy)),serialized);
  assert.deepEqual(replayed.state.rng,initial.rng);assertIsolated(replayed,collectObjects([initial,commands,legacy]));
});
