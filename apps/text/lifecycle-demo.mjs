import { canonical, createSession, derivedWar, dispatch, inspectState, loadGame, saveGame, syntheticScenario } from '../../packages/engine/src/index.ts';

console.log('PK训练生命周期：十年合成回归，非原版EXE验证');
console.log('从累计XP98开始；满气力后保守拒绝训练，时间仍继续推进。没有自动扣气力或无限刷经验规则。');
const initial=syntheticScenario(20261004);
initial.officers.forEach((p,i)=>{p.warBase=60-i*10;p.warXp=98;p.war=derivedWar(p.warBase,p.warXp,initial.ruleset.progressionConfig)});
let session=createSession(initial),trained=0,rejected=0;
const train={type:'Train',baseId:'city1',officerIds:['o1','o2','o3']};
for(let turn=0;turn<360;turn++) {
  const attempt=dispatch(session,train);
  if(attempt.result.ok) {session=attempt.session;trained++;}
  else {if(!attempt.result.reasons.some(r=>r.includes('at cap')))throw new Error(attempt.result.reasons.join('; '));rejected++;}
  const next=dispatch(session,{type:'EndTurn'});
  if(!next.result.ok)throw new Error(next.result.reasons.join('; '));
  session=next.session;
}
const loaded=loadGame(saveGame(session));
if(canonical(loaded)!==canonical(session))throw new Error('Save/load replay divergence');
console.log(inspectState(session.state));
console.log(`训练接受${trained}次，满气力拒绝${rejected}次；旬推进360次；重放一致${session.trace.length}条已接受命令`);
console.log('WAR成长使用累计XP，不扣100；源样本IDB仍未证明为stock PK。原表现层RNG省略，核心seed不变。');
