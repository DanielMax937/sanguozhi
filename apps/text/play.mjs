import { createInterface } from 'node:readline/promises';
import { readFile, writeFile } from 'node:fs/promises';
import { stdin, stdout } from 'node:process';
import { createSession, dispatch, evidenceSummary, inspectState, loadGame, previewCommand, replaySession, saveGame, syntheticScenario } from '../../packages/engine/src/index.ts';

let session = createSession(syntheticScenario());
const help = `PK训练沙盒（虚构短场景，未实现完整游戏）
目标：演练城气力40→100，通常需要3次训练；达到WAR XP100的操作会被拒绝
train o1,o2,o3 [baseId]   执行训练（默认city1）
preview o1,o2,o3 [baseId] 同路径预览（不消耗AP/随机）
end                      下一旬：只恢复AP、重置行动/训练标记、推进日期
inspect                  查看状态
trace                    查看最近一次完整规则证据
save [path]              存档（默认training-save.json）
load [path]              校验重放后载入存档
replay                   重放并验证全部已接受命令
help / quit
没有AI、经济、战争或历史剧本；原命令表现层RNG被省略，不能代表原游戏全局随机流。`;
console.log(help);
console.log(inspectState(session.state));
const rl = createInterface({input:stdin,output:stdout});
let quitting = false;
let inputClosed = false;
rl.on('close', () => { inputClosed = true; });
rl.setPrompt('\n训练> ');
rl.prompt();
try {
  for await (const line of rl) {
    const [verb, arg, baseId = 'city1'] = line.trim().split(/\s+/);
    try {
      if (verb === 'quit' || verb === 'exit') { quitting = true; break; }
      if (verb === 'help') { console.log(help); continue; }
      if (verb === 'inspect') { console.log(inspectState(session.state)); continue; }
      if (verb === 'trace') { console.log(JSON.stringify(session.trace.at(-1) ?? {message:'暂无已接受命令'},null,2)); continue; }
      if (verb === 'save') { const path = arg ?? 'training-save.json'; await writeFile(path,saveGame(session) + '\n',{flag:'wx'}); console.log(`已保存 ${path}（不会覆盖现有文件）`); continue; }
      if (verb === 'load') { session = loadGame(await readFile(arg ?? 'training-save.json','utf8')); console.log('已校验并载入'); continue; }
      if (verb === 'replay') { session = replaySession(session); console.log(`重放一致：${session.trace.length}条命令；${JSON.stringify(evidenceSummary(session))}`); continue; }
      const command = verb === 'end' ? {type:'EndTurn'} : {type:'Train',baseId,officerIds:arg ? arg.split(',') : []};
      if (!['end','train','preview'].includes(verb)) { console.log('输入help查看命令'); continue; }
      const outcome = verb === 'preview' ? {result:previewCommand(session.state,command),session} : dispatch(session,command);
      session = outcome.session;
      console.log(JSON.stringify(outcome.result.calculation,null,2));
      console.log(outcome.result.ok ? (verb === 'preview' ? '预览有效，未改变状态' : '已执行') : `拒绝：${outcome.result.reasons.join('; ')}`);
      console.log('规则证据：' + [...new Set(outcome.result.evidence.map(x => x.evidence.level))].join(', '));
      if (session.state.bases.find(b => b.id === 'city1')?.morale === 100) console.log('短场景目标完成：演练城气力100。');
    } catch (error) { console.log(`操作未完成：${error.message}`); }
    finally { if (!quitting && !inputClosed) rl.prompt(); }
  }
} finally { rl.close(); }
