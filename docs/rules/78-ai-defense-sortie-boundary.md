# P0-43 兵临城下出城 / AI 3格与1.2倍出城兵力边界

更新：2026-10-03。主目标版本：PC-PK1.1。

## 1. 本轮结论

旧规则：

```text
敌军进入城市3格内
AND 城内兵力 >= 对方1.2倍
AND 有武将和兵装
=> 旬初出1~3支部队
```

不能继续作为 original fidelity。

PC-PK1.1 的 AI 出兵策略反汇编显示，真正流程是：

```text
城市/目标态势
-> AP / 资源硬门槛
-> 难度 / 君主野望 / 战略倾向
-> 计划兵力计算
-> 最低5000
-> 兵粮 / 兵装 / 治安 / 移动时间检查
-> 概率层
-> 主将 / 兵种 / 兵器选择
-> 创建部队
```

没有发现统一的：

```text
friendlyTroops / enemyTroops >= 1.2
```

出兵 gate。

也没有恢复出一个可独立确认的：

```text
enemyDistance <= 3
```

作为“守城必出”的单一 hard trigger。

状态：

```text
P0-43-audit-complete
legacy-3-tile-1.2-rule-rejected
ai-sortie-procedural-pipeline-exact-partial
planned-troops-min5000-exact
single-ratio-gate-not-supported
three-tile-defense-trigger-open
```

## 2. AI 出兵不是单一兵力比判定

`311MemoryResearch/AI专题/函数[AI出兵策略].txt` 显示，出兵策略会读取和计算：

- 当前城市 / 目标；
- 难度；
- 君主野望；
- StrategicTendency；
- 城市治安；
- 可用兵力；
- 已有任务 / 已出部队；
- 兵粮；
- 枪戟弩马/兵器库存；
- 到目标的移动旬数；
- 出兵概率；
- 主将与兵装评分。

所以旧 `1.2` 兵力比阈值过度简化。

## 3. 计划兵力存在明确最低5000

反汇编：

```asm
005EFC20 cmp eax,00001388 ; 5000
...
005EFC2E mov [esp+2C],00001388
```

因此：

```text
plannedTroops = max(calculatedPlannedTroops, 5000)
```

是 PC-PK1.1 source-level exact。

这与“按固定1.2倍敌军兵力出城”是不同模型。

## 4. 计划兵力本身不是简单比例

前段可见：

- 对目标/态势值做整数运算；
- 至少1支/多支编成相关随机；
- 随机 `0..1000`、`15000..19999` 等修正；
- 某些状态下对计划兵力再乘 50%~90%；
- 最终再进入兵粮、兵装、资源检查。

所以不能把某个观测到的 1.2 倍现象反推成核心公式。

## 5. 兵粮是硬 gate

主出兵路径：

```text
foodHorizon = travelTime * 5 + 15
requiredFood = 005F6470(plannedTroops, foodHorizon)
carriedFood = min(requiredFood, availableAfterReserve, 50000)
```

若：

```text
carriedFood < requiredFood
```

则该支部队直接不出。

因此即便兵力很多，也可能因为兵粮不足不出城。

## 6. 兵装/治安/金钱也参与

原流程还包含：

- 出兵城治安 80/90 级别 gate；
- 枪/戟/弩/马与兵器可用量检查；
- 城市金钱与携金概率；
- 港关俸禄×8的资金约束；
- 不同兵器 80%/90% 等独立选择概率。

这进一步排除“只看1.2倍兵力”的模型。

## 7. 3格触发目前没有源码闭合

仓库早期 `rules.md` 写：

```text
敌军进入3格内 -> AI守军考虑出城
```

但它本来就被标为“存疑”。

本轮在 `AI出兵策略` 公开文本中没有恢复出一个能单独解释为：

```text
distance <= 3 => defense sortie
```

的 hard compare。

这不等于证明原作完全不关心近敌距离；AI 明确读取目标/城市态势与移动时间。

正确状态是：

```text
fixed 3-tile defense trigger = open / unsupported
```

而不是 confirmed。

## 8. 与“兵临城下征兵减半”必须分开

另一个已知规则：

```text
兵临城下 -> 征兵量减半
```

属于征兵命令的 eligibility/effect path。

它的“2格/3格口径争议”不能拿来证明 AI 出城也使用同一个范围。

所以：

```text
recruit-under-siege radius
!=
AI defense sortie trigger radius
```

必须分开。

## 9. 当前安全实现

严格 fidelity 不再写：

```ts
if (enemyWithin3 && cityTroops >= enemyTroops * 1.2) sortie()
```

而应走已有：

```ts
runPkAiSortiePipeline(city, target, state)
```

其中已恢复的资源/概率/计划兵力逻辑按逆向实现；尚未命名的局部权重继续保留可替换。

## 10. 本轮关闭 / 仍 open

### 已关闭 / 收紧

- 旧“3格+1.2倍”不能作为 fidelity；
- 统一 1.2 兵力比 gate 被反汇编结构否定；
- 计划兵力最低5000 exact；
- AI出兵受多层资源/概率/态势约束；
- 征兵的兵临城下范围不能外推到AI出城。

### 仍 open

1. 防守/迎击专用分支的完整业务命名；
2. 是否存在某条独立近敌距离 hard gate；
3. 若有，距离到底是2/3/其他；
4. `005EF440` 中尚未命名局部变量；
5. 城市防守时1~3支部队数量生成的完整规则；
6. Vanilla / PS2 / Wii AI差异。

## 11. 来源

- sjn4048/311MemoryResearch `内存资料/AI专题/函数[AI出兵策略].txt`
- `16-unresolved-rules-fallbacks.md` E20 AI architecture audit
- `04-military.md` 兵临城下征兵减半（仅作边界对照）
