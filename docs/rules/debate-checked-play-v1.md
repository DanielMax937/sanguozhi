# 舌战有界双队受检出牌事务 v1

日期：2026-10-24。实现：[debate-checked-play.ts](../../packages/engine/src/debate-checked-play.ts) · [完整 API 与精确 DTO](../engine/debate-checked-play-v1.md) · [固定来源与完整政策](../sources/debate-checked-play-v1.json) · [人工纸面场景](../../data/scenarios/debate-checked-play-example-v1.json)。

`evaluateDebateCheckedPlay` 使用独立profile `debate-checked-play-reference-v1`，把给定双队检查点上的**按先后手完成选牌 → 受检可用性 → 写已出牌及物理移除 → 必要的一次再考／重置／重新选牌 → 双方最终牌的攻击方选择**组合成一个原子数据事务，终点仅到 `DamagePhaseBegin` 的 `CalcAttacker` 结果。它不是完整 `PlayPhase`、伤害阶段、交互会话或完整回合。

复用的公开核保持不变：[出牌可用性](debate-card-availability-v1.md)（PR117）、[当前牌堆再考动作](debate-rethink-action-v1.md)（PR123）及[攻击方选择](debate-attacker-selection-v1.md)（PR119）。不复制第二套可用性、补牌／修补／冷静或牌力算法，不放宽这些子核的公开政策或输入合同。

**“受检”是本组合层的工程选择。固定来源的 `PlayPhase` 自身并没有调用 `IsCardAvailable`。** 来源在非法物理下标或空牌时留在原步骤等待；本接口则接收完整有限计划，一次成功或整笔失败，既不等待玩家，也不保存中途步骤。

## 1. 固定来源与证据边界

行为参考为已留存的 `tankyc/sango_infinity` 现代 C# 文本，固定 commit `a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef`。本批仅静态阅读留存文件，不运行来源，不声称重新下载、重新认证或在原版中复现。

| 固定源码 | 本版本采用的事实 |
| --- | --- |
| [DebatePhase.cs 174–211](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/DebatePhase.cs#L174-L211) | 先处理 `first` 方；取得物理下标和牌面，出牌；已出牌为0时再考，下一步重置已出牌，再回到该方选择 |
| [DebatePhase.cs 216–250](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/DebatePhase.cs#L216-L250) | 整个先手完成后才处理对手；对手也可再考后重新选择；最终转入伤害阶段 |
| [DebatePhase.cs 255–259](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/DebatePhase.cs#L255-L259) | `DamagePhaseBegin` 只调用 `CalcAttacker`；不等于已执行伤害 |
| [Debate.cs 991–1000](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L991-L1000) | `PlayCard` 先将选中牌写入该方 `playedCard`，随后调用 `CharacterRemoveCard`；表现回调与日志不进入本数据事务 |
| [Debate.cs 454–466](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L454-L466) | 被选槽先置−1，随后清空全部七个物理背板槽，再按原活动槽顺序压紧非空幸存牌；不会保留非活动尾槽 |
| [Debate.cs 491–509](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L491-L509)及[1254–1260](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L1254-L1260) | `CharacterRethink` 清空活动前缀、补牌、可选冷静覆盖及最终排序；`Rethink` 随后写额度false |
| [Debate.cs 406–438](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L406-L438) | 再考所复用补牌核的保留0槽、逐槽抽牌、必要普通牌修补及数值排序；来源有再生成分支，本版本不执行它 |
| [Debate.cs 1010–1013](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L1010-L1013) | 调用方后续 `ResetPlayedCard` 将0重置为−1；不能提前并入独立再考子核 |
| [Debate.cs 934–988](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L934-L988) | `IsCardAvailable` 的牌类、性格／计时及额度分支；本组合层主动把它用作每次选择的检查门槛 |
| [Debate.cs 908–926](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L908-L926)及[1129–1142](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L1129-L1142) | 最终两张牌的基础牌力、正计时刚胆100赋值与严格比较；平局攻击方−1 |

选牌后的写入／移除次序、两方行动顺序、再考后重置并重新选择、物理压紧和最终攻击方比较来自上述现代参考。以下则是显式工程合同，不得说成来源自身的检查：初始满活动手牌和 `playedCard=-1`、`winner=-1`、`isTutorial=false`、容量／timer／当前18牌域、每方一到两次的完整选择计划、每次额外调用可用性、原子失败、有限预算、安全快照、原因名及审计身份。

这是现代参考的有限组合，不是 clean stock EXE、原生 PC-PK、PK1.1、Vanilla、主机或其他二进制版本等价证明。原有43个证据主题与45个历史快照缺口保持不变；不会因本局部边界可组合而减少。P078及全部依赖继续排除。

## 2. 起点：两方当前18牌与完整物理手牌

根输入严格为 `{schemaVersion:1, profile:'debate-checked-play-reference-v1', policies, isTutorial:false, winner:-1, firstTeam, currentTopic, characters, plans}`；`policies` 必须为完整 `DEBATE_CHECKED_PLAY_POLICY_V1`，政策id为 `debate-checked-play-bounded-paired-selection-policy-v1`，包括其中完整嵌套依赖政策，不能仅提供id。精确闭合schema及公开类型见 [API](../engine/debate-checked-play-v1.md)。语义准入域如下：

- 两方固定为队伍0和1；`firstTeam` 为0或1，另一方是其对手。队伍编号不是本次行动次序。
- `currentTopic` 为有符号32位整数−2147483648..2147483647；只有0、1、2是有效话题，其余合法整数不获得话题匹配加成，也不会触发冷静话题大牌覆盖。
- `winner` 必须为−1，`isTutorial` 必须为false。它们只是本路由的工程支持域，不证明已经做过HP／胜负检查，也不表示来源 `PlayPhase` 或 `Rethink` 自带相同检查。
- 每方性格已经解析为 `timid`、`calm`、`bold` 或 `reckless`，计时器为整数0..4，容量为整数4..7，`canRethink` 为显式布尔值。
- 每方手牌恰好七个稠密物理槽。初始活动槽0严格为再考牌0；活动槽1..容量−1全部为1..14，不允许空位、额外0或未知牌号。初始有效手牌不要求排序，也不要求已有普通话题牌。
- 非活动尾槽为容量..6，每项允许−1..14，包括0。它们不是可选择区域，不能按它们的牌面寻找替代选择。
- 两方初始 `playedCard` 均为−1。已有选择、再考后的中间态或一方已完成的半事务不作为本入口输入。
- 每方提供自己完整的当前18张 `cardTape`，全部项为1..14，`deckCursor` 为整数0..18。不是只提供将用到的后缀，也不是共享一副隐式牌堆。
- 每方提交一到两次当前物理下标选择；这些计划按队伍0、1归属，执行时才按 `firstTeam` 排序。选择附带的再考修补和冷静提供值只能用于该次再考，不从其他选择借用。

`characters` 恰为两项，固定按队伍编号排列；每项仅有 `personality, angerTimer, maxCardCount, hand, playedCard, canRethink, cardTape, deckCursor`。`plans` 同样是按队伍编号排列的两项，每项严格为 `{selections:[...]}`，其数组长度为1或2。每次选择严格为 `{cardIndex, rawDraws, rawResults}`：`cardIndex` 是整数0..6的当前物理下标，执行时还须位于当前活动前缀；两个数组字段**始终必需**，每类只允许0或1条记录；没有记录时写 `[]`，不是省略、null或可选字段。非0选择的两数组都必须为空。

完整输入先通过安全分离和结构／值域校验，才开始数据步骤。即使某队没有再考，也要验证其全部18牌；即使尾槽必将被清除，也要验证其值域。多余字段和错误类型不是可忽略提示。不会隐式解析人物 getter、恢复额度、填平初始空槽或把旧九牌 profile 自动转换成此域。

这里证明的是给定支持域内的数据组合，不证明该检查点在完整新局中可达。初始手牌可以全是话术，当前牌组可以已经用尽；没有再考时无需抽牌，用尽本身不导致失败。

## 3. 固定调度：先手整段结束，再到对手

行动顺序为 `[firstTeam, 1-firstTeam]`。不是先双方各选一次，再双方一起再考；也不是永远0方先做。

每方的完整序列如下：

1. 在**该次选择发生时的当前手牌**中解析物理下标和牌面，禁止指向非活动尾槽或空槽。
2. 使用两方当时的已解析性格、timer及额度，调用不改动的 `evaluateDebateCardAvailability`。只有成功且 `available=true` 才继续。该查询的完整成功对象属于本次选择收据，而非将查询结果简化成一个自造布尔判断。
3. 将解析出的牌面写入该方 `playedCard`，再执行来源式七槽清空及活动幸存牌压紧。
4. 若所出牌不是0，该方选择结束；不得再消费该方多余的选择或随机提供值，也不在此处补满手牌。
5. 若所出牌为0，以**移除／压紧后的七槽手牌**和 `playedCard=0` 调用不改动的 `evaluateDebateRethinkAction`。当前18牌不足、修补记录不符或冷静记录不符均使外层整笔失败。
6. 再考子核成功时已写 `canRethink=false`，但其 `playedCard` 仍为0。外层随后明确执行来源的重置步骤，将已出牌0写为−1；保留子核完整成功对象，不能把它改写为仿佛子核已重置。
7. 从再考完成后的新手牌执行该方下一次物理选择，重新解析牌面、重新检查可用性并写入／移除。最终必须得到一张非0牌，该方才完成。

整个先手包括可能的重抽、重置和第二次选择，都在对手首次选择之前完成。随后对手按同一规则处理。双方最终非0牌就位后，才整体调用 `evaluateDebateAttackerSelection`。

### 3.1 为什么最多一次再考

来源阶段循环本身没有“一方最多循环两次”的计数器。这里的一次再考上限来自**受检选择语义**：成功再考把额度写为false，下一次再选择0会得到 `rethink-disabled`，因而不能通过本组合层的门槛。正计时刚胆还可能在额度检查之前以 `self-angry-bold` 禁止初次再考。

本接口把完整计划限制为每方一到两次：不再考时恰好一次，再考时必须再有一次最终非0选择。仅选择0而没有后续选择不是一个成功的半事务；首次已经非0却仍给第二次选择也不能静默丢弃。不能从本上限倒推出原始 `PlayPhase` 的任意直接调用都至多循环一次。

### 3.2 可用性规则没有被放宽

- 普通话题牌1..9通过该谓词。
- 再考0先拒绝正计时刚胆，再读己方额度；对手正计时冷静不直接禁止再考。
- 大喝10／诡辩11／无视12先拒绝己方正计时刚胆，再拒绝对手正计时冷静。
- 镇静13／激昂14先拒绝己方正计时冷静或刚胆，再拒绝对手正计时冷静。
- 胆小和莽撞的正timer不会被错误归入该谓词的局部受限兴奋态。

这些完整判定由原可用性核完成。来源 `PlayCard` 的局部写入／移除本身并未实现这些门槛。一次查询 `available=true` 原本也不证明持牌；本事务另由当前物理手牌解析来保证它检查的是实际选中牌，而非调用者任意提交的牌号。

## 4. 物理移除：清空七槽，不是只清空活动前缀

对所选物理槽赋−1后，保留这个临时手牌，再把全部七个背板槽设为−1。随后只扫描旧活动范围0..容量−1，把其中所有非−1牌按原物理槽递增顺序写回新手牌起始位置。

因此：

- 压紧保持幸存牌的相对物理次序，**不是排序**。初始手牌未排序时，一次普通出牌不会替调用者排序。
- 所选牌从活动手牌删除一次；重复牌面不导致删除所有同值牌，也不能靠牌面查找替代给定下标。
- 原非活动尾槽不参加扫描，无论有无牌都会被清为−1；它们既不进入幸存牌，也不变成新抽牌。
- 正常非0出牌保留原活动0槽的再考0；选择再考0则先把它移除，其他原活动牌压紧到前面。
- 不从牌组补这个空位，不改变游标，不改timer，不因刚胆恰好耗尽普通牌而在此清timer。后者属于另一阶段的规则，不能提前执行。

例如容量4、七槽 `[0,6,1,3,14,0,-1]`，选择物理3槽的3：赋空后为 `[0,6,1,-1,14,0,-1]`，最终为 `[0,6,1,-1,-1,-1,-1]`，不是 `[0,1,6,-1,14,0,-1]`。原尾槽14和0都被丢弃，6仍先于1。

### 4.1 与再考子核保留尾槽并不矛盾

独立再考动作只清空／补牌／排序活动前缀，保留传入它的非活动尾槽。本事务却在调用它**之前**已经通过 `CharacterRemoveCard` 清空全部七槽，并只重放活动幸存牌。

所以再考子核仍真实地“保留输入尾槽”，只是此时传入尾槽已经全为−1。不能以子核的 `inactiveTailPreserved:true` 声称整个受检出牌事务保留了用户初始的非空尾槽；也不能修改子核去重复清尾，从而掩盖真正发生清尾的来源步骤。

成功后双方都至少出过一张牌，故双方非活动尾槽均为−1。每方最终活动手牌保留容量−1张非空牌，并留下一个活动末尾空槽；不做最终补满。

## 5. 再考、当前物理下标与显式随机事件

### 5.1 重抽固定消费容量减一张

再考始终先清空整个活动前缀，包括刚压紧过来的旧牌，再从该方当前牌组取容量−1张。每方一次成功再考消费3..6张，和原手牌是否满、第一次移除后还有几张无关。必须满足：

`deckCursor + maxCardCount - 1 <= 18`

等号合法。容量4、游标15恰好推进到18；游标16需要跨入下一组时，整个双队事务拒绝。不循环牌带、不复用第18项、不截短动作，也不执行来源 `DeckGenerate`。无再考时游标保持不变，即使原游标为18也可以完成普通选择。

补牌先恢复0槽，按物理1..容量−1逐槽消费当前牌组。若新补可出牌全为话术10..14，必须先按bound9修补最后新补物理槽为1..9，再数值排序。之后按原冷静核规则处理加成和再次排序；这些行为均保留在再考子核的完整收据中。

### 5.2 第二次下标作用于新手牌

计划中的第二次下标不是初始手牌位置，不是第一次压紧后的旧牌位置，也不是原牌组位置。它作用于**修补、补牌排序、冷静覆盖和最终排序全部结束后的当前七槽手牌**。

例如容量4，本次新抽 `[10,11,14]`，修补整数value0，冷静正timer、话题2、布尔true：最后新补槽14先修补为1，补牌排序为 `[0,1,10,11]`，冷静将当前物理1槽的1覆盖为9，最终为 `[0,9,10,11]`。第二次选下标1得到9，不是初始物理1槽的旧牌，也不是新牌组第一张10。

这张9可沿再考完整来源审计追溯至本次牌组第三项的原牌14；修补和冷静覆盖均作用于同一已消费项，没有多抽两张。最终移除9后手牌为 `[0,10,11,-1,-1,-1,-1]`。等牌身份及两次排序映射沿用子核工程审计，不声称原生 `Array.Sort` 有相同对象身份稳定性，也不创建跨回合永久牌token。

### 5.3 修补整数与冷静布尔不是同一种抽样

每次选择分别提供自己的记录；详细包装形状见 [API](../engine/debate-checked-play-v1.md)。只有选择0的再考步骤才能消费它们：

- 必要普通牌修补为 `role:'debate-fill-topic-repair'`、`bound:9`、整数 `value:0..8`。有普通牌便不需要，不能额外提供。
- 冷静记录为 `role:'debate-calm-rethink-rand-bool'`、`percent:40`、布尔 `value:true/false`。只有timer正且性格冷静时需要；不能用数字0／1、百分位整数或自造bound100映射代替。
- 正计时冷静即使 `currentTopic` 不在0..2，也先消费该布尔结果；true后因无效话题不覆盖，false则先得布尔false原因。不能用无效话题提前短路掉必要布尔。
- 非0选择不得携带未使用的再考记录；timer0或非冷静不得提供多余冷静结果。必要修补不可因随后冷静true也能产生普通牌而省略。

全局顺序严格是先手再考中的“可选修补整数 → 可选冷静布尔”，再到对手再考中的相同顺序。若 `firstTeam=1`，最先的随机事件属于队1，而非硬编码队0。两方均需两类结果时共有四个事件。

外层另记连续事件顺序及所属队伍／选择；**不改写**嵌套再考自己的事件下标、不改写修补局部下标，也不把冷静消费记录的局部 `index:0` 改为全局值。完整嵌套可用性、再考和攻击方结果均保留，而非只摘出最终牌面。`externalRngConsumed:0`表示本数据求值不调用外部随机源，不是来源出牌过程不存在随机，也不认证真实PRNG、seed或40%的实现分布。

## 6. 终点：只选择攻击方，不执行攻击

双方各自完成最终非0选择后，按固定队伍0、1排列最终两张牌，交给不改动的攻击方核；不是按先后手重排它的牌数组。

- 基础牌力：无视12为120，大喝10为110，诡辩11为20；普通牌为1加零基等级，且仅有效话题匹配时加10；镇静13和激昂14为0。
- 各方正计时且刚胆时，将自身最终牌力无条件赋为100，不是加100或取最大。这里不改timer。
- 严格较大的一方是攻击方0或1；相等为−1，不以 `firstTeam` 破平局。

攻击方独立核原本接受任意signed32牌号，本组合层的成功最终牌则已经经过持牌与可用性检查，必为1..14。不能把子核合成输入中的“正计时刚胆打无视”示例直接搬来当作本事务成功例：本事务会在上游检查阻止该选择。两者支持域不同不是算法矛盾。

返回−1表示未选出攻击方，不是赢家−1的新胜负判定。到此没有调用 `Attack`，没有HP／stress变化、话术效果、伤害随机、反射、无视阻断、镇静／激昂效果或愤怒入场。最终牌仍保留为已出牌，不在比较后重置；先手、当前话题、性格、timer、容量和当前18牌内容也不在此改变。

### 6.1 成功检查点与完整收据

成功对象为 `{ok:true, schemaVersion, profile, policy, evidence, attacker, checkpoint, receipt}`。输入键为复数 `policies`，输出键为单数 `policy`；政策与证据分别为导出 `DEBATE_CHECKED_PLAY_POLICY_V1`、`DEBATE_CHECKED_PLAY_EVIDENCE_V1`。没有成功后另行推送外部状态的步骤。

`checkpoint` 保留最终两方完整人物状态以及 `isTutorial/winner/firstTeam/currentTopic`，另外标记 `kind:'ready-for-attack'`、`sourceBoundary:'after-DamagePhaseBegin-CalcAttacker-before-Attack'` 和 `attacker`。这个标签是工程交接说明，不表示存在已接入的 `Attack` 执行器，也不是来源阶段对象的序列化存档。

`receipt` 保留：

- `before` 起点及 `after` 完整终点、原 `plans`、本次 `actorOrder:[firstTeam,opponent]`。
- 按真实执行次序排列的 `selections`。每项含全局 `selectionOrder`、行动先后序号 `actorOrder`、队伍 `team`、该方计划内 `selectionIndex`、当前 `cardIndex/card`、人物 `before/after` 和完整可用性成功对象 `availability`。选择内的 `actorOrder` 为0或1的行动位置，不是队伍身份；应看 `team` 区分两者。
- 每次 `playedCardWrite` 记录−1→选中牌且 `beforeRemoval:true`。`removal` 保留移除前、选槽赋空后、七槽全部清空后、压紧后的四副七槽手牌；`survivors` 使用 `sourceIndex/destinationIndex/card` 记录幸存映射；`discardedTail` 只记录非空原尾牌，也包括0。另有 `allBackingSlotsCleared:true` 和 `numericSortPerformed:false`。
- 再考选择中的 `rethink` 为完整未改写子核成功对象，包含清牌、补牌、冷静、额度、局部事件及来源身份；`reset` 则单独记录 `before:0,after:-1,afterRethink:true,beforeReselection:true`。普通选择两字段均为null，不伪造空再考收据。
- 完整未改写的 `attackerSelection`；全局 `randomEvents` 中的 `eventIndex/team/selectionIndex/actionEventIndex/localIndex` 以及原整数／布尔内容。`actionEventIndex`保留再考收据原事件下标，`localIndex`仍为0；外层阶段字段为 `stage`，不改动内层的 `phase`。
- `selectionCount` 为2..4、`rethinkCount` 为0..2、`randomEventCount` 为0..4及 `externalRngConsumed:0`。

这些完整数据使“选中了哪张当前牌、在哪里清除了尾槽、何时重抽与重置、哪份局部随机记录对应哪个全局位置”可被逐步阅读。精确类型及所有字段以 [API](../engine/debate-checked-play-v1.md)为准。

## 7. 人工纸面推导：全部未运行

下例只展示必要字段，实际调用仍需完整schema、profile、政策、两方七槽、完整18牌和全部选择包装。数组顺序始终是物理槽顺序；省略的非活动尾槽在文字中会单独说明。它们不是运行输出、通过记录或测试断言。

### A. 队1先出牌，队0仍可成为攻击方

双方 `timid/0`、容量4、无再考、话题0。队0初始七槽 `[0,6,1,3,14,0,-1]`，选择3；队1初始七槽 `[0,2,4,9,12,11,10]`，选择3。`firstTeam=1`。

先完成队1，最终已出牌9，手牌 `[0,2,4,-1,-1,-1,-1]`；再完成队0，最终已出牌3，手牌 `[0,6,1,-1,-1,-1,-1]`。按队伍索引最终牌为 `[3,9]`，牌力 `[13,3]`，攻击方0。双方游标不变、没有随机事件。队0幸存的6和1未被排序；两方初始尾牌全部清除。

### B. 一次再考后，用新手牌物理1槽选9

`firstTeam=0`。队0为 `calm/1`、容量4、额度true、话题2，初始七槽 `[0,2,5,14,12,0,7]`，游标0，本次将消费的牌组片段 `[10,11,14]`。计划先选0，再选1；第一次选择提供修补value0和冷静true，第二次没有再考记录。

出再考0后先得到 `[2,5,14,-1,-1,-1,-1]`。再考清活动旧牌、补牌并双重覆盖后得到 `[0,9,10,11,-1,-1,-1]`，游标3、额度false，子核已出牌仍0。外层重置为−1，再选当前槽1的9，最终 `[0,10,11,-1,-1,-1,-1]`、已出牌9。全局两个事件依次是修补和布尔；原尾牌12、0、7没有被保留或发回。

若对手为 `timid/0` 并最终选8，双方最终牌 `[9,8]`，话题2牌力 `[13,12]`，攻击方0。对手的普通牌通过可用性；若改选话术10，就会被对手正计时冷静限制而整笔拒绝，不能返回队0已经完成的半结果。

### C. 两次再考、四个事件，先手不破平局

两方均 `calm/1`、容量4、额度true、话题2、游标0，本次各自抽 `[10,11,14]`，均先选0再选1，各提供修补value0及布尔true。`firstTeam=1`。

先完成队1的两个选择，再完成队0；每方最终9、额度false、游标3、七槽 `[0,10,11,-1,-1,-1,-1]`。全局事件为：队1修补、队1冷静、队0修补、队0冷静。两份嵌套再考各保留自己的事件0、1，各补牌／布尔记录仍保留自己的局部0。最终牌力 `[13,13]`，攻击方−1，不因队1先手改成1。

### D. 恰好用尽与需要再生成

容量4、游标15、再考本次抽 `[2,5,7]`，timer0，不需要修补或冷静记录。再考排序结果 `[0,2,5,7]`，游标恰好18；重置后可继续选当前槽3的7，当前牌堆未跨界。

只把游标改为16，需要三张但当前只剩两张，则失败，不产生该方新手牌或已写false额度。若这是后手，先手即使已经完成也不发布。相反，游标18但双方都直接选非0牌时，没有补牌需求，游标耗尽不构成失败。

### E. 再考额度与多余计划不是静默修正

初始额度false而选择槽0，必须在移除前因再考不可用拒绝。初始额度true，第一次再考成功后第二次仍选择槽0，也不能再重抽：新的0还在手中，但额度已false。仅有第一次0而没有第二选择、首次非0却仍提交第二选择、或非0选择附带修补／布尔，均不能默默补全或忽略。

输入某活动可出牌槽为−1或0、物理选择落在尾槽、初始已出牌不为−1、tutorial=true、winner为0或1，也不进入本路由。以上失败边界属于接口支持域，不等同于来源UI显示方式或原游戏永远不能出现这些状态。

## 8. 原子性、有限预算与失败安全

本接口成功发布整笔最终双队状态及完整收据；任一步失败只返回类型化失败原因，不返回候选状态、第一方半结果、已清尾手牌、推进后的游标、已消费额度或部分收据。原子化是本数据求值的工程合同，不是声称来源C#已有相同事务接口。

失败严格只有 `{ok:false,reason}`，不会附带哪个队已经完成的半成功数据。需要区分结构／政策／支持域错误、物理选择不符、可用性拒绝、计划缺失或多余、当前牌堆需要再生成、随机记录缺失／多余／值域错误，以及既有子核拒绝：

- 计划结构：`invalid-plans`、`invalid-plan`、`invalid-selections`、`invalid-selection`。
- 物理选择：`invalid-card-index`、`selected-index-not-active`、`selected-card-empty`。
- 受检门槛：`selected-card-unavailable`；这是组合层失败名，不能伪称来源 `PlayPhase` 会返回这个原因。
- 完整计划：`missing-final-selection`、`unexpected-selection`。
- 非0选择携带未使用修补记录：`unexpected-raw-draw`；携带未使用冷静记录：`raw-result-count-mismatch`。
- 再考或其他子核失败沿用原原因，例如需要跨出当前18牌的 `unsupported-deck-regeneration`；不替换成成功但空手牌。

完整联合、通用安全／准入原因、映射与先后以 [API](../engine/debate-checked-play-v1.md)为准；不可将不可用牌悄悄替换成其他牌，也不可遇到坏计划后回到隐式等待。

`selected-card-empty` 是防御性的执行时检查；当前“初始活动满牌＋成功再考补满”的准入域内，实际被接受的计划不会到达它。初始活动空槽先由 `invalid-ready-hand` 拒绝，不能把它当成合法空手检查点来制作成功或等待例子。

完整输入形状和随机提供值域先验证；合法数据的动作内先后另外遵循执行顺序。非0分支在检查该选择是否已为计划末项之后，才检查多余修补，再检查多余冷静记录。0分支先调用再考、重置，再检查是否缺最终选择；因此牌堆不足等子核失败可能先于 `missing-final-selection`。这些失败均没有外发中途状态，不应因某个错误较晚发现便描述为实际已经提交了前序动作。

语义上限固定为：

- 两个行动方，整个先手后整个对手。
- 每方最多两次选择，合计最多四次可用性查询和四次写已出牌／物理移除。
- 每方最多一次再考，合计最多两次既有再考动作、两次0→−1重置。
- 每次再考最多新抽六张，两方合计最多十二张；各自只在当前18牌内推进。
- 每次再考最多一个修补整数和一个冷静布尔；合计最多四个外层随机事件。
- 两方完成后只调用一次既有攻击方选择；不会把结果继续送入攻击或回合状态机。

输入是闭合、有限、脱离调用者的安全JSON数据合同；必须提供完整匹配政策，而非仅给一个id。可信Proxy识别能力缺失时fail closed，不能退回尝试读取getter；Proxy、访问器、可执行值、危险／额外字段、异常原型、循环、稀疏数组及超预算数据依公开合同拒绝，不调用用户回调。成功输出分离并递归冻结，输入不被改写或冻结。

外层安全预算为4096个值节点、root depth 0至16、数组最多32项及65536 canonical UTF-8字节，另按实现合同计累计键／字符串字节；七槽、18牌及每次最多一条各类随机记录的语义上限更窄。可信运行时、精确计数与检查先后见API及完整政策；子核各自安全域不改变，不能把有限预算说明当作任意恶意宿主中的普遍安全证明。

完整嵌套收据是审计数据，不是已执行某次外部随机抽样或原生游戏运行的证据。二次排序来源映射、同面覆盖记录、物理压紧记录和全局事件索引是显式工程可追踪性；不升级为整个会话的存档格式、全局随机流或永久牌身份。

## 9. 兼容性与仍未闭合的范围

新增受检事务不改变PR117／PR123／PR119及其依赖的公开核、profile、DTO、固定政策、错误、收据或行为。九个旧会话profile的命令、save tag、存档／load／replay、拒绝域和阶段编排保持；不自动接入、不迁移存档、不宣称旧正常态会话已经支持完整愤怒出牌。

明确继续排除：

- 完整 `PlayPhase`／`step` 状态机、任意中途恢复、UI／AI选牌、玩家取消或非法输入等待、视图回调及日志。
- `Attack`、伤害／HP／stress、任何实际话术效果、非恒等人物hook、胜负或终局分类、反制／连打／双次愤怒阶段。
- `TurnEnd`、`TurnStart`、先手与话题更新、计时递减／清零、再考额度恢复、刚胆耗牌退出、崩坏及完整跨回合编排。
- 牌组再生成、跨18牌代号、DeckInit、洗牌分布、底层PRNG、全局随机流与跨动作永久牌token。
- 教程、终局、开场、追击／留情、Closing、真实人物／能力／书籍／物品解析及campaign集成。
- 旧九牌分支、原生整链、P078与全部依赖、俘虏／处斩／归属、return／mission、外交自动结算及其他外部结果。

“有界双队受检出牌事务”只表示在给定完整计划、合法支持域、当前牌堆足够且显式随机提供值精确时，组合到两方最终牌及攻击方判定。它不证明任意前序状态可接入，也不把这个边界夸大为完整舌战、完整回合或原生PK／Vanilla等价。

本文与关联场景只包含静态规则、人工输入与纸面预期。本批没有运行测试、编译器、typecheck、build、validator、checker、诊断器、项目、候选核、参考来源、场景、示例或replay。不得据此声称运行通过、已发布、已合并或完整原生链已闭合。
