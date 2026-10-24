# 舌战非终局回合衔接组合核 v1

日期：2026-10-22。实现：[debate-round-transition.ts](../../packages/engine/src/debate-round-transition.ts) · [API 与精确 DTO](../engine/debate-round-transition-v1.md) · [固定来源与完整政策](../sources/debate-round-transition-v1.json) · [独立纸面案例，未运行](../../data/scenarios/debate-round-transition-example-v1.json)。

`evaluateDebateRoundTransition` 使用独立 profile `debate-round-transition-reference-v1`，只把显式给定的**非终局、非教程、两队回合结束检查点**，按现代固定参考的 `TurnEnd` 顺序处理，再调用**未经修改的公开 `evaluateDebateTurnStart`**，返回下一次出牌之前的检查点。它闭合的是 `TurnEnd → TurnStart → pre-play` 这一个局部衔接，不是一次完整对局、完整回合、胜负路由器或旧会话桥接。

最重要的时序是：先递减两队计时器，再根据**原始 attacker 与原始已出牌**更新先手和话题，最后才用递减后的计时器执行回合开始。冷静 timer1 因而先变0，不能仅凭性格恢复再考；冷静 timer2 先变1，仍符合正计时恢复条件。旧崩坏恢复额度是独立条件，不随计时归零失效。

成功时同时公开整个衔接结果和完整嵌套回合开始收据；任何失败仅返回失败原因，不公开已递减的计时、已更新的先手或话题、任何已补手牌或部分收据。调用者输入不被修改。

## 1. 固定来源、路由证据与工程限制

规则依据为已留存的 `tankyc/sango_infinity` 现代 C# 翻译参考，固定 commit `a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef`：

- `Debate.cs` blob：`0137498d10773cd4596d497083ccdf6a26b3a261`。
- `DebatePhase.cs` blob：`6aa98f855a5d4d172cde7e8ffc18a141b8a7b587`。
- [Debate.cs 1083–1126](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L1083-L1126)：先逐队递减 timer；仅在 attacker 有效时写 first、跟随攻击方普通牌话题，再检查诡辩的单次随机话题覆盖。
- [Debate.cs 394–398](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L394-L398)：正计时减1；不把0减成−1。
- [Debate.cs 854–872](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L854-L872)：普通牌的三组话题映射。
- [DebatePhase.cs 261–274](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/DebatePhase.cs#L261-L274)：回合结束阶段调用 `TurnEnd`，后续阶段指向 `TurnStart`。
- [DebatePhase.cs 163–168](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/DebatePhase.cs#L163-L168)：回合开始阶段调用 `TurnStart`，随后指向 `Play`。
- [Debate.cs 1046–1079](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L1046-L1079)：既有回合开始核所实现的逐队重置、额度恢复、补牌、刚胆检查与清除崩坏。

以上阶段链接只用于界定这次组合的位置，不是完整状态机移植。来源 `TurnEnd` 函数本身**没有 `winner == -1` 守卫**；本接口要求 `winner=-1`，是拒绝终局路线的工程准入，不能倒写成该来源函数具有胜负判定或自动跳过终局。

本批静态阅读上述已留存文本，不执行来源，也不声称重新下载、重新认证固定来源。政策、严格 DTO、有限容量、提供式抽样、三阶段快照、原子失败与冻结输出都是工程合同，不是原生 C++ 内存结构、原生事务机制或任意检查点可达性证明。

证据等级仍是**现代翻译参考的局部行为与有界工程组合**。不声称 clean stock EXE、PC-PK、PK1.1、Vanilla、主机或原生二进制等价；原43个证据主题、45个历史快照缺口均不减少。

## 2. 显式检查点与完整角色支持域

顶层恰有以下10个必需字段，不能仅给政策 id 或依靠隐含默认值。确切类型、完整政策内容与错误分类以 [API](../engine/debate-round-transition-v1.md) 和 [固定政策](../sources/debate-round-transition-v1.json) 为准：

| 顶层字段 | 准入要求 |
| --- | --- |
| `schemaVersion` | 严格为1 |
| `profile` | `debate-round-transition-reference-v1` |
| `policies` | 与完整 `DEBATE_ROUND_TRANSITION_POLICY_V1` 相同，包括嵌套原TurnStart与补牌政策；固定id为 `debate-round-transition-bounded-current-deck-policy-v1` |
| `isTutorial` | 精确为boolean false |
| `winner` | 精确为−1，仅为工程非终局路线标记 |
| `firstTeam` | 整数0或1，原先手 |
| `attacker` | 整数−1、0或1，前序阶段已经确定的攻击方 |
| `currentTopic` | 有符号32位整数−2147483648..2147483647，不限于0..2 |
| `characters` | 恰好两份完整原TurnStart角色输入，按队0、1排列 |
| `topicRawDraws` | 长度0或1的本次回合结束话题抽样数组 |

本页讨论来源变量时简称 first/topic，公开字段分别是 `firstTeam`、`currentTopic`。`currentTopic` 接纳完整有符号32位范围，是刻意保留既有值的工程支持域；没有话题更新时包括−1或99在内的合法输入原样保留，普通牌或诡辩更新发生时才写0..2。不把给定旧话题强制规范化为合法话题枚举，也不据此声称任意整数话题在完整来源对局中可达。

输入 `attacker` 是先前阶段已经算出的本回合攻击方，不是先手、胜方、角色下标排序或连打攻击方。来源 `attacker` 与 `comboAttacker` 是不同状态；本核不读 `combo.attacker`，不从连打状态推导本次 attacker，也不在 timer 递减后重新运行 `CalcAttacker`。给定 attacker 并不认证先前伤害、牌力或愤怒计算正确。

两队下标固定为0、1。每队完整沿用已有回合开始准入域，不因新增了 TurnEnd 而收窄或扩张：

| 角色字段 | 准入要求与作用 |
| --- | --- |
| `personality` | 已解析的 `timid`、`calm`、`bold`、`reckless`；不查询人物或物品 |
| `angerTimer` | 整数0..4；本次先执行回合结束递减 |
| `maxCardCount` | 整数4..7，包括保留0槽 |
| `hand` | 恰好七个物理槽，不是长度等于有效容量的数组 |
| `playedCard` | 整数−1..14；回合结束先读取原值，回合开始才重置−1 |
| `canRethink` | boolean；没有恢复条件时保留旧值，不默认写false |
| `crumbled` | boolean；可独立恢复再考额度，回合开始末尾清false |
| `cardTape` | 恰好18个整数牌码1..14，代表本队完整当前牌组 |
| `deckCursor` | 整数0..18，本队当前牌组下一项位置 |
| `rawDraws` | 本队0或1份原补牌话题修补抽样；无需求也须显式给 `[]` |

七槽的三个分域保持原样：

1. 物理0槽允许−1..14，包括0、普通牌与话术；进入补牌时无条件覆写为再考0，不推进牌组游标。
2. 物理1至 `maxCardCount-1` 是有效可出牌区，只允许−1空槽或1..14牌码；**有效可出区中的0必须拒绝**，不能当作空位或第二张保留再考。
3. 物理 `maxCardCount` 至6是非激活尾槽，允许−1..14，包括0；保持原位置与原值，不参与填牌、修补、排序或刚胆普通牌扫描。

例如容量4时，七槽尾部的普通牌9不能阻止有效区全话术刚胆退怒；尾部的0却是合法输入。物理0槽原来为14同样合法，但会被覆写，而不是保留到尾槽或放回牌组。

全部18项牌组都需合法，包括游标之前和本次不会取到的项。每队有自己的牌组、游标和修补数组，不存在共享未来牌流。有效空洞的位置必须保留至补牌，不能先压紧现有牌再补末尾，因为最后新增原槽决定可选修补的位置。

这些输入域是工程支持域，不证明所有来源可达状态均落在域内，也不证明调用者提供的状态确实可达。允许原始已出牌与当前手牌不同；本核不执行原出牌的选择、合法性检查、移除或回放。

## 3. 第一阶段：先递减两队 timer

安全分离并解析完整输入之后，按队0、队1顺序执行回合结束计时规则：

- timer0保留0。
- timer1变0；timer2变1；timer3变2；timer4变3。
- 不按性格改变递减幅度，不按先手或 attacker 调换顺序。
- 两队 timer 都处理完后，才进入 attacker、first 与 topic 规则。

来源在正计时归零时记录状态结束并可调用表现层事件；本纯函数只保存可审计的数值与条件，不执行日志、动画、回调或外部事件。timer 归零不在本核中重新计算牌力、攻击方、伤害、HP、压力、胜负或性格。

递减对下一阶段有真实影响，不能先运行 TurnStart 再减 timer：

| 进入衔接的状态 | TurnEnd之后 | TurnStart的额度判断 |
| --- | --- | --- |
| calm、timer1、额度false、崩坏false | timer0 | 冷静条件不成立，额度仍false |
| calm、timer2、额度false、崩坏false | timer1 | 正计时冷静成立，额度变true |
| calm、timer1、额度false、崩坏true | timer0 | 冷静条件不成立，但旧崩坏独立恢复为true |
| 任意性格、timer0、额度true、崩坏false | timer0 | 保留旧true，不清除 |
| bold、timer1 | timer0 | 刚胆正计时门控不成立，不以普通牌数重新恢复兴奋 |
| bold、timer2且最终有效手牌无普通牌 | timer1 | 进入刚胆门控，最终timer再清0 |

表格省略的手牌、牌组与抽样仍须合法；不是可以省略完整 DTO 的执行样例。

## 4. 第二阶段：原始 attacker 门控先手和话题

### 4.1 无攻击方必须跳过整个块

当原始 `attacker=-1` 时，保留原先手和原话题，跳过**所有** first/topic 处理，包括普通牌跟随和诡辩扫描。即使原始已出牌出现11对非12，也不触发话题重抽，不可消费话题抽样。

这并不跳过 timer 递减或后续 TurnStart：双方仍会递减、清已出牌、按条件恢复额度、补牌、检查刚胆并清崩坏。不能把 attacker−1理解成“整个调用无动作”，也不能把它偷偷改成旧 first。

### 4.2 有攻击方先写 first，再跟随普通牌

原始 attacker 为0或1时，先令 first 等于该 attacker，再读取该队的**原始 `playedCard`**。只有普通牌1..9才设置普通话题：

| 攻击方原始已出牌 | 普通牌话题结果 |
| --- | --- |
| 1、2、3 | 故事，topic0 |
| 4、5、6 | 道理，topic1 |
| 7、8、9 | 时节，topic2 |
| −1、0、10、11、12、13、14 | 不执行普通牌话题更新，暂时保留旧话题 |

普通牌判定是数值区间1..9，不需要与当前话题相同，也不依赖牌力、牌级、timer或是否仍在手中。即使 first 已经等于 attacker，来源赋值条件仍成立；不能因值相等说该规则未应用。

### 4.3 再判断诡辩；两边同时符合也只重抽一次

仅在有效 attacker 的块内，非教程分支按双方原始已出牌判断：

- 队0为11（诡辩）且队1不是12（无视），或
- 队1为11且队0不是12。

任一条件成立即触发一次话题重抽，消费一份 bound3、value0..2的提供值，结果直接写入 topic。这里的“对方不是12”不是“对方必须是普通牌”；在本工程已接纳的已出牌域内，对方为−1、0、其他话术或11同样满足非12。

两边都是11时两项条件都成立，但来源只把一个 boolean 标记置true，循环结束后调用一次随机话题。不能按每名诡辩使用者抽一次，不能重抽两次，也不能采用第一名或最后一名的独立抽样。

| 原始已出牌 `[队0,队1]` | 有效 attacker 下是否重抽 |
| --- | --- |
| `[11,12]` 或 `[12,11]` | 否，诡辩面对无视 |
| `[11,11]` | 是，恰好一次 |
| `[11,10]` 或 `[14,11]` | 是，恰好一次 |
| `[11,-1]` 或 `[0,11]` | 是，恰好一次；不额外声称该检查点可达 |
| `[1,9]` | 否，无诡辩 |
| 任意上述组合但 attacker−1 | 否，整个话题块跳过 |

诡辩更新位于普通牌话题更新之后，所以可以覆盖刚设置的普通话题。例如 attacker0、已出牌 `[4,11]`：先手写0，普通牌4先写 topic1，再由唯一重抽值2覆盖为 topic2。反之，重抽值恰好也是1，仍是执行过重抽、消费过一份值，不是“话题未变所以没抽”。

所有这些判断都发生在 TurnStart 清空已出牌之前；不能先把双方 `playedCard` 写成−1，再以清空后的值决定是否跟随或重抽。

## 5. 第三阶段：直接复用不变的公开 TurnStart

回合结束成功后，组合层把递减后的两队 timer、未清空的原始已出牌、原始额度与崩坏、当前手牌、各自18牌组和游标、各自修补数组，交给既有 [evaluateDebateTurnStart](../../packages/engine/src/debate-turn-start.ts)。本批不修改既有核的校验或角色支持域，也不复制其填牌、修补、排序、额度判断、刚胆扫描或收据算法。外层为全量安全准入独立解析相同角色字段，不以先运行一次TurnStart再丢弃结果的方式探测输入。

该调用按完整队0序列结束后再处理队1，不按 first 或 attacker 重排：

1. `playedCard=-1`。
2. 若旧崩坏为true，令 `canRethink=true`。
3. 若**递减后的 timer>0**且为冷静，再令 `canRethink=true`；两条件均不成立则保留额度。
4. 非教程补牌：恢复0槽，按有效空洞原槽升序从本队当前牌组取牌，按需修补最后新增原槽，排序有效前缀。
5. 若递减后的 timer>0且为刚胆，扫描补牌、修补和排序之后的**最终有效手牌**。普通牌1..9数量为0才把 timer清0，否则保留递减后的值。
6. 清除该队崩坏，随后才开始另一队。

这里不会再额外递减一次。比如非刚胆timer3应在衔接后为2，而不是1；timer4刚胆持有最终普通牌时保留3，而不是回到4。

### 5.1 补牌修补与刚胆检查不能合并

已有补牌核仅在“填完后无普通牌，且本次至少新增一槽”时修补最后新增原槽，把牌改为 `1+value`，value为0..8。修补不是再取牌，不再推进游标。

- 已满有效手牌全是话术：没有新增槽，不修补；正计时刚胆因最终普通牌数0退怒。
- 有有效空槽，补入话术后仍无普通牌：必须提供修补值；修补后已有一张普通牌，正计时刚胆不退怒。
- 原先保留或本次补入普通牌：无需修补；不能提供一份“备用”修补值。

嵌套补牌收据的 `topicCardCountAfterFill` 是普通填牌后、可选修补前的数量，不能替代最终有效手牌的刚胆计数。尾槽普通牌和保留0槽都不能增加有效普通牌计数。刚胆退怒不撤销此前由崩坏等条件恢复的额度。

### 5.2 当前18牌耗尽边界保持不变

每队只允许使用显式提供的完整18项当前牌组：

- cursor18且没有有效空槽可以成功，不需要再生成。
- cursor17且恰有一个空槽可以成功，游标到18。
- cursor18还有空槽，或cursor17需要填两个空槽，拒绝为 `unsupported-deck-regeneration`。
- 不再生成、不回绕、不追加未来牌、不向另一队借牌；话题修补也不能代替缺失的牌组项。

即使回合结束话题已经在私有候选中更新，或队0已经补完，队1越过当前牌组边界仍使**整个衔接**失败。不存在单独可提交的 TurnEnd 或队0半成品。

## 6. 三条提供式抽样通道与全局顺序

回合结束话题抽样为单独的 `topicRawDraws` 数组，长度0或1。唯一合法记录格式是 `{"role":"debate-turn-end-topic-reroll","bound":3,"value":0}`，value可为0、1或2。实际需要重抽时必须恰有一份；不需要时必须为 `[]`。

每队原有 `rawDraws` 格式保持不变：唯一合法记录为 `{"role":"debate-fill-topic-repair","bound":9,"value":0}`，value可为0..8。每队在实际需要补牌话题修补时消费一份，否则必须为空。

三条通道不混用：回合结束topic值不能代替某队的修补值，某队draw不能给另一队，也不能把它们先合成不带用途的随机池。抽样格式与语义域在完整输入解析时先检查；是否实际必需或多余由对应阶段的条件判定。

实际消费的全局顺序是：

1. 若需要，唯一回合结束话题重抽。
2. 若需要，队0补牌话题修补。
3. 若需要，队1补牌话题修补。

因此最多3份记录，不是每队诡辩一份加每队修补一份的4份。未发生的步骤不插入假记录，索引从实际消费的第0项连续排列。

外层全局索引是独立审计，不能覆盖完整嵌套 TurnStart 收据的局部索引，也不能覆盖更内层每队 fill 的 `drawIndex:0`。例如三条通道都消费时，外层顺序为0、1、2；嵌套 TurnStart 两份消费索引仍是0、1，两个 fill 各自的局部修补索引仍是0。

本核没有外部 RNG 调用，`externalRngConsumed=0`。提供值保留 bound3或bound9的局部关系，不认证抽样均匀性、来源 PRNG、种子、原生随机流或跨回合全局位置。当前牌组游标推进不是新的随机抽样，不能把每张填牌重复记入三份随机预算。

外层每项记录有 `flatDrawIndex` 和 `stage`。topic项的stage是 `turn-end-topic`、teamIndex为null、localDrawIndex为0；fill项的stage是 `turn-start-fill`，保留所属teamIndex、原 `localDrawIndex`，并把原TurnStart全局索引单独记为 `turnStartFlatDrawIndex`。`turnStartDrawOffset` 为0或1，表示之前实际发生了几份topic消费，不是每队固定预留位置。

## 7. 原子结果、三阶段快照与完整嵌套审计

成功为 `{ok:true,schemaVersion,profile,policy,evidence,state,characters,nextCheckpoint:'ready-for-play',receipt}`；`state`与 `receipt.after` 是同一最终状态，`characters`指向 `state.characters`。失败严格为 `{ok:false,reason}`，没有半成功的 timer、first、topic、手牌、游标、队伍结果、已消费值或可提交的部分 receipt。输入复数 `policies` 与输出单数 `policy` 不要混淆。精确返回类型、字段、理由全集和校验优先级见 [API](../engine/debate-round-transition-v1.md)。

外层保留三个不同阶段，不能把它们压成一个含糊的“回合后状态”：

- `before`：本次输入的原始检查点，包括未递减 timer 与原始已出牌。
- `afterTurnEnd`：两队 timer已递减、先手与话题规则已完成，但尚未清已出牌、恢复额度、补牌或清崩坏的检查点。
- `after`：完整 TurnStart 之后、下一次出牌之前的检查点；已出牌−1、崩坏false，其他值按规则保留或更新。

话题和先手由 TurnEnd 决定，TurnStart不再次计算；winner仍是工程准入的−1，不在成功结果中被推导为某队获胜。快照是可审计的显式状态，不代表新建会话、自动执行下一次 Play、回合号递增或对来源对象的写入。

每份快照都为 `{isTutorial:false,winner:-1,firstTeam,attacker,currentTopic,characters}`，保留原始attacker。角色快照不含rawDraws；topicRawDraws也不是持久状态，提供式抽样只属于本次求值请求。`nextCheckpoint:'ready-for-play'` 是工程结果标签，不是来源phase字段写入或可运行阶段循环。

外层核心审计字段为：

- `timerOrder:[0,1]` 与两份 `timers`：各自teamIndex、before、after、decrementApplied、expired。只有TurnEnd的1→0才记expired=true；原来0不算刚到期，TurnStart后续刚胆清零也不倒记为TurnEnd到期。
- `firstTeam`：原attacker、eligible、before、after和reason。有效攻击方条件成立时为 `attacker-selected`，否则为 `attacker-minus-one`；即使赋相同值也仍为selected。
- `ordinaryTopic`：eligible表示攻击方门控，attackerCard为所读原牌，before、after、applied及reason区分 `attacker-minus-one`、`attacker-card-not-topic`、`attacker-topic-card`。attacker−1时attackerCard为null；普通牌跟随即使写回同值也记applied=true。
- `sophistry`：eligible、checks、qualifyingTeams、before、after、rerollApplied、reason、提供与消费记录及drawCount。attacker−1时checks为null、qualifyingTeams为空，不能用两个虚假的未符合记录掩盖“整块未扫描”。有效攻击方时checks保存两队原牌、对方原牌、isSophistry、blockedByIgnore与qualifies。仅本队为诡辩且面对无视时blockedByIgnore=true。
- `sophistry.reason`分别为 `attacker-minus-one`、`no-unopposed-sophistry` 或 `single-topic-reroll`；双诡辩qualifyingTeams为 `[0,1]` 也只消费一份。其before是**普通话题更新之后**的值，不一定等于总快照before的话题。
- `turnStart`：完整原TurnStart成功收据；另有turnStartDrawOffset、独立外层consumedDraws、0..3的drawCount与externalRngConsumed0。

嵌套 TurnStart必须保存**完整原样成功收据**，而非只挑最终手牌或两个摘要。它包含来源队序、两队前后检查点、已出牌重置、额度恢复理由、完整填牌收据、最终有效普通牌刚胆审计、崩坏清除与自身消费记录。外层新增的时间和话题审计不能改写这些内部事实。

输入先安全分离、全量解析，再进入私有候选计算。队1有畸形字段或错bound时，不能先公开队0或TurnEnd；后续依赖核报告缺失draw、多余draw或当前牌组耗尽时，同样整体拒绝。原子性是本工程保证，不是对原C#坏输入行为或原生回滚的描述。

所有输出与固定常量递归冻结并与调用者数据分离，输入本身不被修改或冻结。不得执行调用者 getter、Proxy、随机回调、函数或其他可执行值；不把字符串、boolean、NaN、Infinity、小数、负零或不安全整数静默转成状态。循环、稀疏数组、自定义附加字段、symbol、隐藏或访问器属性、不支持原型以及安全预算超限按严格数据边界拒绝。所需可信运行时能力、完整容量预算与失败分类以API及固定政策为准。

外层要求可信Node运行时提供 `process.getBuiltinModule('node:util').types.isProxy`，缺少时fail closed。外层安全预算为4096个值节点、root depth0至16、单数组最多32项、canonical UTF-8最多65536字节，另累计键与字符串预算；有重复但无环的引用独立分离并分别计数。嵌套TurnStart与填牌核仍执行各自不变的更窄预算，外层容量不是放宽依赖核边界。调用TurnStart恰好一次，不以额外探测调用代替完整安全解析。

新增失败理由为 `unsupported-terminal-checkpoint`、`invalid-first-team`、`invalid-attacker`、`invalid-current-topic`、`invalid-topic-raw-draws`、`invalid-topic-raw-draw`、`missing-topic-raw-draw`、`unexpected-topic-raw-draw`；其余沿用全部TurnStart失败理由。topic数组数量／类型错误与单份topic记录语义错误不同；缺失／多余则取决于来源需求阶段。完整格式与域先通过后，topic需求检查先于TurnStart内部队0、队1补牌需求检查，不能混淆“输入解析先后”与“来源执行先后”。

## 8. 人工纸面案例：未执行

以下是静态手算期望，不是运行断言、执行回执或测试通过记录。每例均假定完整 schema、profile、政策、winner−1、非教程标记、两队合法七槽与18项牌组；省略字段不能在实际输入中省略。完整人工材料见 [独立纸面案例](../../data/scenarios/debate-round-transition-example-v1.json)。

### 8.1 冷静归零与独立崩坏恢复

设双方手牌已满且含普通牌，不取新牌、无需修补，attacker−1，不提供topic抽样。

- 队0为calm、timer1、旧额度false、崩坏false：TurnEnd先变timer0；TurnStart冷静恢复条件不成立，最终额度false，已出牌−1、崩坏false。
- 队1为calm、timer2、旧额度false、崩坏false：TurnEnd先变timer1；TurnStart正计时冷静恢复额度，最终timer1、额度true。
- 若只把队0旧崩坏改为true，最终timer仍0，但额度变true；嵌套额度审计应归因于崩坏，不应谎记正计时冷静。

这组对照专门区分“先减后恢复”与错误的“先恢复后减”。attacker−1并未阻止两队正常完成这些步骤。

### 8.2 攻击方普通话题先写，再被诡辩覆盖

初始first1、topic0、attacker0，双方原始已出牌分别4和11，topic抽样为bound3/value2，双方补牌无需修补。

1. 先递减两队timer。
2. first由1写0。
3. 读取攻击方原始牌4，topic先由0写1。
4. 队1诡辩11面对队0非12，恰好消费一次topic值2，topic再写2。
5. TurnStart才把两队已出牌清−1并完成其余步骤。最终first0、topic2。

若topic抽样改为value1，最终topic1，但普通跟随与诡辩重抽两项都实际发生，不因覆盖值相同而省略消费。

### 8.3 双诡辩与 attacker−1的差别

原始已出牌为 `[11,11]`：

- attacker0或1时，双方都符合诡辩条件，但只需且只允许一份topic抽样，先手设置为该原始attacker。
- attacker−1时，整个first/topic块跳过，先手与话题原样保留，topic抽样必须为空。

把第二种情形仍提供一份合法bound3/value0，不代表“有备无患”：它是多余输入，整个调用拒绝。不能先消费后丢弃。

### 8.4 递减后的刚胆与最终有效手牌

队0为bold、timer2、容量4，七槽 `[-1,14,10,12,9,0,-1]`，cursor18，修补数组为空。TurnEnd使timer2变1；TurnStart把有效前缀排序成 `[0,10,12,14]`，没有空槽也没有新增槽，所以不修补，最终有效普通牌数0使timer1再清0。尾槽9保持原位置，但不能阻止退怒。

若手牌改为 `[-1,14,-1,12,9,0,-1]`、cursor0、当前牌组第0项10，并提供bound9/value8：原物理2填10后修补为9，最终七槽 `[0,9,12,14,9,0,-1]`、cursor1。递减后的timer1因最终有效区已有普通牌而保留1，不回到2，也不退怒。

### 8.5 三份消费顺序与局部索引保留

初始attacker0、原始已出牌 `[4,11]`，topic抽样value2。双方都容量4、七槽 `[-1,14,-1,12,-1,0,-1]`，各自cursor0且当前牌组第0项10；队0修补value0，队1修补value8。其他字段给合法值，后续18牌组项均合法。

TurnEnd先设置first0、普通topic1，再以唯一topic重抽写2。TurnStart队0在物理2填10并修补为1，队1在物理2填10并修补为9；最终有效前缀分别 `[0,1,12,14]` 与 `[0,9,12,14]`，两队cursor均1。

外层实际消费顺序为：topic value2、队0repair value0、队1repair value8，数量3。嵌套 TurnStart仍只有两份修补，局部全局索引为0、1；各队fill修补索引仍各为0。不得把外层1、2反写到嵌套0、1。

### 8.6 后半段失败撤销整个公开结果

在可完成topic重抽、队0补牌的合法基例中，仅把队1改为cursor18且存在一个有效空槽。纸面期望为整个调用返回 `unsupported-deck-regeneration`，没有 `afterTurnEnd` 或队0成功半收据。不能公开先手或topic已更新的结果后，再把队1失败另附成警告。

### 8.7 非枚举旧话题仍按门控保留

给定currentTopic99、firstTeam1、attacker−1、原始已出牌 `[11,11]`，topic抽样为空。99属于支持的有符号32位输入；因为整个话题块被跳过，TurnStart后currentTopic仍99、firstTeam仍1。若只把attacker改为0，则需要一份topic抽样，不能因为旧话题不是0..2而跳过诡辩或先自行规范化旧话题。类似地，有效attacker的原牌为10且双方均无诡辩时，旧99仍保留。

## 9. 人工拒绝边界：不静默修补输入

以下逐项改变一个其余部分合格的输入，均按整个事务拒绝。表述是边界说明，不另建与API冲突的错误优先级。

- 教程或终局路线：不实现教程跳过补牌，也不做终局先手、话题、补牌或结局路由。
- 未提供完整顶层字段、字段多余、错schema或profile、政策仅有id或内容不同：不默认补齐、不猜测意图。
- attacker、first、topic、winner超出各自明确准入域：不clamp、不用当前先手替代无效攻击方、不把任意负值等同−1。
- 队数不是2、稀疏数组、角色缺字段、无效性格、timer−1或5、容量3或8：不调整成最接近的支持值。
- 手牌不是七槽、任一槽越界、有效可出区含0：拒绝。物理0槽为−1或14、非激活尾槽为0本身合法，不应误拒绝。
- 已出牌越界、额度或崩坏不是boolean：即使TurnStart会重置这些字段也不能忽略坏输入。
- 当前牌组不是18项、任一未读取项也有非法码、cursor不在0..18：不截断、补齐或只校验使用的切片。
- 当前牌组剩余项不足以填满全部有效空槽：`unsupported-deck-regeneration`，不通过topic修补或保留普通牌绕过。
- 需要topic重抽却没有topic值、无需要却给了合法topic值、或给两份topic值：拒绝，双诡辩也不例外。
- topic记录role错、bound不是3、value不在0..2，或把bound9修补记录放入topic数组：拒绝。
- 某队需要修补却没有repair值、无需修补却给值、给两份、给错队、role错、bound不是9或value不在0..8：沿用原核拒绝，不借用别的通道。
- 任意阶段失败：不公开之前已经私下算出的timer、first、topic、补牌、额度或退怒结果。
- 不安全普通数据、可执行属性、循环、稀疏或附加字段数组、运行时能力不足与预算超限：按API的严格数据合同拒绝，绝不以“尽量执行”探测调用者代码。

“计时到0”“刚胆有效普通牌耗尽后清0”“重抽得到原话题”都是可能的成功结果，不能与缺失draw、当前牌组耗尽或输入不合法混为一类。

## 10. 不改变既有合同，也不宣称完整闭环

本批新增独立组合入口，依赖原公开 TurnStart及其原补牌核。已有核的实现、profile、DTO、固定政策、失败域与局部审计不因组合而改变；新增profile不自动迁移或接入旧九会话。

明确排除：

- 终局路线、胜负计算、结局、教程TurnEnd或TurnStart、完整阶段调度与真实时间推进。
- 出牌选择与消耗、攻击方重新计算、牌力覆盖、伤害、HP／stress写入、会心、愤怒入场、连打、崩坏层重新计算。
- 完整CharacterRethink、清空重抽、再考执行或额度消费、冷静补牌后的大牌增益。恢复额度不等于执行再考。
- 当前18牌组之后的DeckGenerate、洗牌、未来牌带、循环、PRNG实现、真实分布、种子或整场随机流预算。
- 真实人物／智力／书籍／物品解析、非恒等hook、AI、开场、追击／留情、外部事件结果覆写。
- 旧九会话的阶段、profile、命令、存档tag、save/load/replay、拒绝域及任何隐式桥接或迁移。
- 跨回合稳定牌token／occurrence身份、完整开局可达性认证、自动连续执行或完整会话闭环。
- P078/native人员任务及其依赖，俘虏、处斩、归属、return/mission、外交自动结算和campaign后果。

最终状态只是下一次出牌前检查点。原43证据主题与45历史快照仍开放，不以新增现代局部组合抵销原生证据缺口。

本页与关联案例仅为静态文本和人工纸面期望。未运行测试、编译器、typecheck、build、validator、checker、诊断器、项目、候选核、参考来源、场景、示例或replay；不以本页声称运行通过、已发布或已合并。
