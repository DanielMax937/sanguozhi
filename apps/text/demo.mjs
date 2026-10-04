import { canonical, createSession, dispatch, evidenceSummary, inspectState, loadGame, previewCommand, saveGame, syntheticScenario } from '../../packages/engine/src/index.ts';

console.log('三国志11 PK：训练内核演练（虚构短场景，不是完整游戏）');
console.log('目标：用三个训练命令将演练城气力从40提升至100；不触发能力成长。');
console.log('仅训练、有限旬结算、检查、存档和重放；没有AI、经济、战争或原版完整随机流。\n');
let session = createSession(syntheticScenario());
const train = {type:'Train',baseId:'city1',officerIds:['o1','o2','o3']};
const commands = [train,{type:'EndTurn'},train,{type:'EndTurn'},train];
for (const command of commands) {
  const preview = previewCommand(session.state,command);
  const next = dispatch(session,command);
  if (!next.result.ok) throw new Error(next.result.reasons.join('; '));
  if (canonical(preview.calculation) !== canonical(next.result.calculation)) throw new Error('Preview/execute mismatch');
  session = next.session;
  console.log(`${command.type}: ${JSON.stringify(next.result.calculation)}`);
  console.log(`Evidence: ${[...new Set(next.result.evidence.map(x => x.evidence.level))].join(', ')}`);
}
console.log('\n' + inspectState(session.state));
const save = saveGame(session);
const replayed = loadGame(save);
if (canonical(replayed) !== canonical(session)) throw new Error('Replay divergence');
console.log(`\n目标完成：气力 ${session.state.bases[0].morale}/100；WAR XP每人${session.state.officers[0].warXp}/100（本短目标未跨成长阈值）`);
console.log(`Save/load/replay verified: ${session.trace.length} accepted commands, ${save.length} characters`);
console.log(`Evidence use counts (includes explicit fallback and open boundaries): ${JSON.stringify(evidenceSummary(session))}`);
console.log('原命令的发言武将随机选择被省略；此处0 core draws不等于原游戏命令0随机或全局随机流一致。');
