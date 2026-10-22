# 舌战有界再考动作事务 v1

日期：2026-10-22。实现：[debate-rethink-action.ts](../../packages/engine/src/debate-rethink-action.ts) · [API 与精确 DTO](../engine/debate-rethink-action-v1.md) · [固定来源与完整政策](../sources/debate-rethink-action-v1.json) · [人工纸面场景](../../data/scenarios/debate-rethink-action-example-v1.json)。

`evaluateDebateRethinkAction` 使用独立 profile `debate-rethink-action-reference-v1`，把一个人物的一次**清空有效手牌 → 当前牌组补满／必要话题修补／补牌排序 → 可选冷静增益／最终排序 → 写再考额度为 false**封装成原子数据动作。它复用未改动的补牌核与冷静再考增益核，覆盖给定当前18张牌足够完成补牌时的 `CharacterRethink` 数据效果及 `Rethink` 的额度写入，不等于完整出牌阶段或完整舌战会话。

本动作从已经选择再考牌的显式检查点开始。`playedCard` 必须为0，成功后仍为0；`canRethink` 可以是true或false，本动作不负责判断是否允许选择再考。最后的额度写入只在整条动作成功时发布。当前牌组不足、随机记录错误或其他输入失败都只返回失败原因，不发布清空后的手牌、已推进的游标或半成功收据。

## 1. 固定来源与工程边界

规则依据为已留存的 `tankyc/sango_infinity` 现代 C# 参考，固定 commit `a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef`。本批只静态阅读已留存文本，不执行来源，不声称重新下载或重新认证来源。

- [Debate.cs 491–509](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L491-L509)：`CharacterRethink` 清空从0到有效容量末槽的整个前缀，调用 `CharacterFillCards`，再按正timer、冷静性格、`RandBool(40)`、有效话题的顺序决定是否覆写物理1槽，最后再次排序。
- [Debate.cs 406–438](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L406-L438)：补牌先恢复0槽再考牌，按物理槽升序从当前牌组取牌；填后没有普通牌且确实补过空槽时，修补最后新补槽；随后按数值排序有效前缀。来源有越界再生成分支，本版本明确不实现该分支。
- [Debate.cs 1254–1260](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L1254-L1260)：`Rethink` 调用 `CharacterRethink` 返回后才写 `canRethink[team]=false`。随后视图回调与日志不在本数据动作中。
- [DebatePhase.cs 199–209](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/DebatePhase.cs#L199-L209)及[235–245](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/DebatePhase.cs#L235-L245)：先手与后手都在发现已出牌为再考0后调用 `Rethink`，再在**下一步**调用 `ResetPlayedCard`。不能把下一步的重置偷偷并入本动作。

来源行为与工程政策必须分开：清空范围、调用先后、修补目标、冷静门控、话题大牌映射、数值排序和末尾额度写入来自上述现代参考；七槽输入形状、四性格已解析字段、timer0..4、signed32话题、只支持当前18牌、`playedCard=0`准入、原子失败、安全预算、原因标签及牌身份审计是本版本的显式工程合同。输入 `playedCard=0` 不代表 `Rethink` 函数自身有该检查，接纳 `canRethink=false` 也不证明UI允许重复选择再考。

这不是 clean stock EXE、PC-PK、PK1.1、Vanilla、主机或原生二进制认证；现代参考局部可组合不等于原生整链闭合。原43个证据主题与45个历史快照缺口不减少。P078及全部依赖继续排除。

## 2. 显式输入：一个人物、七个物理槽

每次调用都提供全部字段，不默认政策、不把旧profile自动转换为本动作：

| 字段 | 合同 |
| --- | --- |
| `schemaVersion` | 严格为1 |
| `profile` | `debate-rethink-action-reference-v1` |
| `policies` | 完整 `DEBATE_RETHINK_ACTION_POLICY_V1`，id为 `debate-rethink-action-bounded-current-deck-policy-v1`；只有id不够，不能混用子核政策 |
| `currentTopic` | 有符号32位整数−2147483648..2147483647；0..2以外仍是合法无覆写话题 |
| `character.personality` | 已解析的 `timid`、`calm`、`bold` 或 `reckless` |
| `character.angerTimer` | 整数0..4；不因来源判断大于0便扩展到任意正整数 |
| `character.maxCardCount` | 整数4..7，有效槽为0..容量−1 |
| `character.hand` | 恰好七项的稠密数组，每项整数−1..14，包括有效0槽及未激活尾槽 |
| `character.playedCard` | 严格为再考牌0；表示调用方已到达本版本支持的选牌后检查点 |
| `character.canRethink` | 布尔true或false；不是本动作的可用性门控 |
| `character.cardTape` | 完整当前18张牌，每项整数1..14；不是只提供本次要抽的后缀 |
| `character.deckCursor` | 整数0..18，指向当前牌组下一张 |
| `rawDraws` | 0或1份补牌话题修补记录 |
| `rawResults` | 0或1份冷静 `RandBool(40)` 布尔结果记录 |

对象是封闭schema，所有字段均必需。原始手牌**不要求排序、不要求0槽原来是0、不要求有效前缀有普通牌，也不禁止多个0**：这些原牌都将先清空。尾槽同样允许−1..14，却不被清空、补牌、排序或改写。四槽容量仍输入七项，不能只传四项；这与只接收已排序有效手牌的独立冷静核不同。

`-1`是外层物理空槽码，子补牌核的可出手空槽表示则为 `null`。本动作内部明确构造容量−1个 `null`，不是将原可出手牌传给子核保留。完整原手牌也必须整副重抽，不是只补原有空位。七槽表示和准入域是有界数据接口，不认证该原始检查点在完整游戏中可达。

`cardTape`的18项全部验证，包括游标之前和本次不会消费的项；所有槽位和其他字段也完整验证，不因随后被清空或门控短路便忽略坏形。人物性格解析、人物对象getter、书籍／物品和来源team查找不执行。

本接口没有对手、team或教程标志。上述来源的 `Rethink`／`CharacterRethink` 本身没有教程门控，不能凭其他阶段的教程分支擅自添加 `tutorial=false` 准入规则；这也不表示本动作模拟了完整教程流程。

## 3. 一次动作的固定顺序

### 3.1 清空整个有效前缀，保留未激活尾槽

先保存分离的输入快照，再把物理槽0..容量−1全部设为−1。清空包含原再考0和原有效0槽的任意合法牌码；不能套用只处理消耗／空位的补缺逻辑，也不能把 TurnStart 的行为当作本动作。

清空审计为每个有效槽记录 `slot/before/after`，包括原来已是−1的槽；`discardedCards`只记录其中原来不是−1的牌，**包括被丢弃的0**。`handAfterClear`仍是七项，保留原未激活尾槽。

### 3.2 从当前18牌补满，每次固定消费容量−1张

调用未改动的 `evaluateDebateHandFill`，交给它容量−1个空位、当前完整牌组和游标。子核恢复0槽为再考0，按原物理槽1..容量−1升序各消费一张牌。因此每次成功固定推进容量−1张，最少3张、最多6张，与原手牌空不空、原有效槽有多少牌无关。

必须满足 `deckCursor + maxCardCount − 1 <= 18`。等号合法，表示恰好用尽当前牌组；需要第19项时返回 `unsupported-deck-regeneration`，不循环牌带、不截短补牌、不自动生成下一代。容量4时，游标15成功推进到18，游标16失败；即使原手牌已经满也一样，因为它们已全部被丢弃。

若刚填出的可出手牌全是话术10..14，子核需要一份bound9修补记录，将最后新补原物理槽改为1+rawValue，再作补牌排序。因本动作一定补过至少3个新槽，成功后必有普通牌1..9。这个事实使补牌结果自然满足独立冷静核要求的“唯一保留0、其余1..14、至少一张普通牌、有效长度4..7、已按数值排序”检查点；不靠降低冷静核准入或额外修补来兼容。

### 3.3 冷静短路顺序、物理1槽与最终排序

将补牌排序后的有效手牌交给未改动的 `evaluateDebateCalmRethink`：

1. timer为0：原因 `timer-zero`，不消费布尔记录。
2. timer为正且不是冷静：原因 `personality-not-calm`，不消费布尔记录。
3. timer为正且冷静：必须消费一份 `RandBool(40)`布尔结果，**即使话题不在0..2**。
4. 布尔false：原因 `boolean-result-false`，不覆写；不会再以无效话题作为原因。
5. 布尔true但话题无效：原因 `topic-out-of-range`，不覆写，但布尔结果已经消费。
6. 布尔true且话题0／1／2：将补牌排序后**物理1槽**分别覆写成3／6／9，原因 `replacement-applied`。
7. 所有成功分支都对有效手牌作最终数值排序，不因未覆写或同面覆写而省略。

物理1槽不是“等级最低牌”，也不是按当前话题或牌力搜索的目标。例如补满排序后 `[0,3,4,14]`，话题2且true应覆写故事大3，得到排序后 `[0,4,9,14]`，不能因为4是道理小而覆写4。目标已经是对应大牌时仍发生一次赋值，记录 `replacement-applied` 和 `changed:false`，不能伪装成未触发。

冷静覆写不消耗牌组项、不另加游标、不增减有效容量。补牌修补和冷静增益可以依次覆写**同一已消费牌组项**，保留它的来源身份，不伪造第二张抽牌。最终有效前缀覆回七槽手牌，未激活尾槽仍逐项等于输入。

### 3.4 最后写额度，已出牌保持0

整条 `CharacterRethink` 数据效果成功后，写 `canRethink=false`。原来true时 `changed:true`，原来false时 `changed:false`，两者都记录 `applied:true`。false输入不会跳过重抽，也不作为拒绝理由；是否允许执行这次动作由上游选择／可用性规则负责。

`playedCard`不重置：输入0，输出仍0，收据明确 `resetPerformed:false`。调用方下一出牌阶段步骤才负责来源 `ResetPlayedCard`，随后重新选牌。把本动作输出改为−1或直接继续普通攻击，都会越过本版本边界。

## 4. 两类随机提供值与外层事件顺序

修补记录的唯一形状为：

```json
{"role":"debate-fill-topic-repair","bound":9,"value":0}
```

`value`只能是整数0..8，对应普通牌1..9。只有刚补满的可出手牌全为话术时才需要且只能有一份；若已有普通牌，必须为空。即使后面的冷静true会产生普通牌，也不能省略先发生的修补。

冷静记录的唯一形状为：

```json
{"role":"debate-calm-rethink-rand-bool","percent":40,"value":true}
```

`value`也可以为布尔false，不能用数字0／1、百分位整数、字符串或bound100抽样代替。`percent:40`记录来源调用参数，不定义 `RandInt(100)<40` 等映射，也不认证真实概率、种子或PRNG。

外层先严格解析两类完整提供数组的形状及值域，之后按来源顺序由补牌核与冷静核判定是否需要／是否多余。外层并非复制补牌核“先抽牌、后检查修补值域”的公开错误顺序：本动作在任何清空／补牌前就拒绝坏role、bound或修补值域；合法记录是否缺失／多余才由子核依次判定。完整数据先验证不等于改变合法记录的来源消费顺序。两者都需要时，外层 `randomEvents` 必定先补牌修补，再冷静布尔：

- 修补事件：`eventIndex`为外层连续事件下标，`localIndex:0`，`phase:'fill-topic-repair'`、`kind:'integer-draw'`，`draw`保留原修补记录。
- 冷静事件：后续外层下标，`localIndex:0`，`phase:'calm-rethink-bonus'`、`kind:'boolean-result'`，`result`保留冷静核完整消费记录及其原 `index:0`。

只有冷静时，其外层 `eventIndex`为0；两者都有时分别为0、1。子核局部索引不被改成全局索引；完整嵌套收据原样保留，外层另作顺序标记。每次成功有0..2个事件，`randomEventCount`记录实际数目；`externalRngConsumed:0`表示本计算未调用外部随机源，不是来源再考永远无随机。

## 5. 成功收据、两次排序与组合来源身份

成功返回 `{ok:true,schemaVersion,profile,policy,evidence,currentTopic,character,receipt}`；输入键为复数 `policies`，结果键为单数 `policy`。政策及证据分别为 `DEBATE_RETHINK_ACTION_POLICY_V1` 与 `DEBATE_RETHINK_ACTION_EVIDENCE_V1`。返回人物保留性格、timer、容量、已出牌0、完整当前牌组和尾槽，更新有效手牌、游标及额度。完整字段、政策常量与精确类型见 [API](../engine/debate-rethink-action-v1.md)。

`receipt`包含：

- `before`和`after`：完整 `currentTopic/character`快照。
- `clear`：有效槽数、逐槽清空、丢弃牌、完整清空后七槽手牌及 `inactiveTailPreserved:true`。
- `fill`：未裁剪的补牌收据，含补牌前后、每张消费牌、修补前后、补牌排序和局部来源身份。
- `calm`：未裁剪的冷静核完整成功对象，含其profile、policy、evidence、最终原因、布尔消费、覆写和最终排序审计。
- `quotaWrite`：额度写入前后、applied／changed及 `afterPhase:'character-rethink'`。
- `playedCard`：前后均0、`resetPerformed:false`及 `resetBoundary:'caller-next-play-phase-step'`。
- 两类完整提供记录、`randomEvents`、`randomEventCount`、`finalProvenance`及外部RNG消费0。

`finalProvenance`只描述最终有效前缀，不给未激活尾槽编造新发牌身份。对最终有效位置i，先取冷静最终排序的 `sourceIndices[i]` 作为 `fillSortedIndex`，再查补牌 `sortedProvenance[fillSortedIndex]`；不能直接把i当成补牌前槽，也不能把冷静物理1槽等同于本次原物理1槽。

每条组合记录保存 `finalIndex`、`fillSortedIndex`、`preSortSlot`、`origin`、`tapeIndex`、`originalCard`、`fillCard`、最终 `card`，以及 `topicRepairApplied/topicRepair`、`calmOverwriteApplied/calmOverwrite`。有修补或覆写时保留对应完整应用记录，没有时相应记录为null。`originalCard`是该已消费牌组项的原牌面，`fillCard`是补牌核结束后的牌面，`card`是最终牌面，三者不能混为一谈。

本动作没有原有效牌的 `retained`来源：除恢复的保留0外，每张有效牌都来自本次牌组消费。两个覆写标记可以同时为true，同面覆写仍为true；更改牌面不删除原 `tapeIndex`。这只是当前动作的有限来源追踪，不升级为跨牌组代号、跨动作、跨回合或完整session的永久token。

两次排序都按数值牌码升序，同值身份各用子核明确的来源槽工程平局规则。来源 `Array.Sort`本身不提供这些对象身份保证，因此组合审计不能用于声称原生排序稳定。尾槽完全不参加任一次排序。

## 6. 人工成功案例：全部未运行

以下均为纸面输入和预期，不是运行收据、测试断言或通过记录。各例假定完整schema、profile、固定政策、合法七槽和18牌齐全；“本次牌组项”只是展示将要消费的片段，实际输入仍须给全部18项。`true/false`表示合法布尔记录的value简写，不是公开输入格式。

| 例 | 容量／游标；本次牌组项 | 性格／timer／话题 | 修补／布尔 | 纸面有效手牌结果与关键点 |
| --- | --- | --- | --- | --- |
| A | 4／15；`[2,5,7]` | calm／4／1 | 无／true | 补牌`[0,2,5,7]`，覆写2→6，最终`[0,5,6,7]`，游标18，恰好用尽合法 |
| B | 4／0；`[10,11,14]` | calm／1／2 | rawValue0／true | 先将最后新槽14→1，补牌排序`[0,1,10,11]`，再同一来源项1→9，最终`[0,9,10,11]` |
| C | 4／0；`[3,7,14]` | calm／1／0 | 无／true | 最终仍`[0,3,7,14]`，冷静同面3→3，`replacement-applied`、`changed:false` |
| D | 4／0；`[1,4,14]` | calm／4／−1 | 无／true | 最终`[0,1,4,14]`，`topic-out-of-range`，仍消费一份布尔结果 |
| E | 4／0；`[1,4,14]` | calm／1／3 | 无／false | `boolean-result-false`先于无效话题原因，仍最终排序 |
| F | 4／0；`[10,11,14]` | bold／4／0 | rawValue4／无 | 先修补最后新槽14→5，最终`[0,5,10,11]`；非冷静没有布尔结果 |
| G | 4／0；`[1,4,14]` | calm／0／0 | 无／无 | 仍完整清空重抽和两次排序；冷静原因`timer-zero`，额度仍写false |
| H | 4／0；`[10,11,14]` | calm／1／0 | rawValue2／true | 同一来源先14→3，再3→3；两个覆写标记均true，冷静changed为false |
| I | 7／12；`[1,1,4,7,10,14]` | calm／4／2 | 无／true | 最终`[0,1,4,7,9,10,14]`，仅一个1被覆写，游标18，没有尾槽 |

### 6.1 七槽原牌、尾槽与额度false

将A的原七槽设为 `[7,14,0,-1,12,0,-1]`，`canRethink=false`，`playedCard=0`：

- 清空后为 `[-1,-1,-1,-1,12,0,-1]`；逐槽审计有0..3四条，丢弃记录为槽0的7、槽1的14、槽2的0，原槽3的−1不列入丢弃牌。
- 成功七槽为 `[0,5,6,7,12,0,-1]`，尾槽 `[12,0,-1]`逐项不变；不能把尾槽0移到有效前缀，也不能排序七个物理槽。
- 额度仍false，但写入已应用且 `changed:false`；已出牌仍0，没有重置。
- 冷静排序 `sourceIndices=[0,2,1,3]`；最终6位于有效下标2，却来自补牌排序下标1、原补牌槽1、牌组下标15的原牌2。

A将原有效前缀换为一副完整满手牌，同样消费这3张牌、同样推进到18。再把游标改为16则失败，不因原手牌已满而允许零消费。

### 6.2 修补后再覆写同一牌组项

B的修补作用于原物理3槽和 `tapeIndex:2`。补牌排序前为 `[0,10,11,1]`，排序后为 `[0,1,10,11]`，所以冷静物理1槽对应的是原物理3槽，不是原物理1槽。

最终9的组合来源为：`finalIndex:1`、`fillSortedIndex:1`、`preSortSlot:3`、`origin:'tape'`、`tapeIndex:2`、`originalCard:14`、`fillCard:1`、`card:9`，两种覆写标记均true。外层事件0是修补、事件1是冷静，两个嵌套局部下标各自保持0。游标只由0推进到3，不因两次覆写推进到4或5。

H采用同一来源路径，只是 `fillCard:3`、最终 `card:3`，冷静记录仍存在且 `changed:false`。不能因为最终牌面与补牌牌面相同，删掉第二个事件或第二个覆写记录。

## 7. 原子失败与拒绝范围

失败严格只有 `{ok:false,reason}`。补牌成功后发现缺失冷静结果、提供了多余结果，或者任何后续步骤失败，都不会返回已补好的候选手牌、推进后的游标、额度写入或部分收据。输入不会被修改或冻结，成功输出分离并递归冻结；没有隐式人物对象、牌组或全局随机状态。

公开失败类型联合保留两个子核的原因，加上本动作自己的准入原因：

- 通用：`unsupported-runtime`、`input-limit`、`malformed-data`、`unknown-field`、`unsupported-profile`、`unsupported-policy`。
- 补牌：`invalid-playable-slots`、`unsupported-card-code`、`invalid-card-tape`、`invalid-deck-cursor`、`unsupported-deck-regeneration`、`missing-raw-draw`、`unexpected-raw-draw`、`invalid-raw-draw`。
- 冷静及共用字段：`invalid-personality`、`invalid-anger-timer`、`invalid-current-topic`、`invalid-hand`、`invalid-raw-results`、`invalid-raw-result`、`raw-result-count-mismatch`。
- 动作：`invalid-character`、`invalid-max-card-count`、`invalid-played-card`、`invalid-can-rethink`、`invalid-raw-draws`。

保留子核联合不表示每个子核错误都能由通过外层检查的输入触发；例如动作自己构造合格的全空 `playableSlots`，不向调用者开放这个字段。

以下是人工拒绝范围，不是运行结果；完整错误联合、语法／语义先后及多处坏形的错误优先级以 [API](../engine/debate-rethink-action-v1.md)为准：

- 容量4且游标16，即使完整原手牌无需通常补缺，也要重抽3张，拒绝 `unsupported-deck-regeneration`。容量7需6张，游标13同样不够。
- 刚抽的牌全部是话术而 `rawDraws=[]`，缺少先发生的修补。不能用稍后冷静true替代这份修补。
- 已抽到普通牌却提供一份修补记录，是多余记录；不悄悄丢弃。
- 正timer冷静却没有布尔记录，哪怕话题为−1也失败；timer0或非冷静却提供布尔记录也失败。布尔false是合法消费值，不是“没有结果”。
- 修补值不在0..8、role或bound错误、布尔记录用数字0／1或百分位整数、percent不为40、两份同类记录、缺字段或未知字段，都不进入宽松兼容路径。
- `playedCard=-1`、普通牌或话术不在本动作检查点域；不自动选择再考，不执行后续重置。`canRethink=false`本身**不是**失败，非布尔才失败。
- 七槽中的任一项超出−1..14，即使在即将清空的有效槽或未激活尾槽也失败。四项有效手牌不能替代七物理槽，稀疏数组不能自动补齐。
- 当前牌组不是恰18项、任一项为0／−1／15，或者游标不在0..18，都不截短、循环或重生成。未消费项也完整验证。
- 未知性格、timer−1或5、容量3或8、signed32域外话题、浮点、负零、不安全整数、NaN、Infinity或字符串数字，都不默认修正或clamp。
- 缺失完整政策、政策内容不等、错误profile、未知字段、getter、Proxy、函数、symbol、非普通原型、循环、隐藏数据字段、稀疏／附加字段数组及超出安全预算，按公开安全边界拒绝。

安全分离、可信运行时要求与预算属于工程政策，不属于古典游戏规则。入口须能使用可信 Node `process.getBuiltinModule('node:util').types.isProxy`在反射前识别Proxy；缺少该能力时fail closed，不退回读取getter或尝试执行值。普通对象和null原型记录可接受，重复无环引用按独立副本处理。外层上限为2048个值节点、root depth 0至12、数组最长32项及32768 canonical UTF-8字节，另有累计键／字符串字节预算；七槽、18牌、每类最多一条随机记录的语义界限更窄。每次最多清空7槽、填6槽、修补1次、冷静布尔1份、外层随机事件2条。子核自己的原安全合同不变。精确计数与先后见API；不能将本页数值例子当作对任意恶意宿主的安全保证。

“成功但无冷静覆写”不是失败，原额度false也不是失败；“本次无法完整清空后补满并结算”才不能发布动作。原子化只表示数据求值全有或全无，不声称来源C#已经拥有相同事务API。

## 8. 兼容性与未实现范围

本批新增独立有界动作，复用既有补牌与冷静核而不改变其公开profile、DTO、政策、错误、收据或行为。九个旧session、它们的命令／save tag／load／replay／拒绝域及阶段路由不改变；没有自动接入、存档迁移或把旧session突然升级成愤怒再考会话。

明确不在本动作内：

- 选择再考牌、持牌／出牌可用性判断、UI灰态、AI、先后手调度、`PlayCard`、后续 `ResetPlayedCard`、重新选牌和完整 `PlayPhase`。
- 任何牌组再生成、跨18牌代号、DeckInit、洗牌／分布证明、原生PRNG、全局随机流以及跨动作永久牌token。
- timer设置／递减／清零、额度恢复、冷静TurnStart恢复、刚胆耗牌、TurnStart／TurnEnd、胜负、崩坏、双次愤怒阶段、攻击、HP／stress、连打或完整回合编排。
- 教程特例及分支、视图回调、日志、人物性格与能力解析、书籍／物品／非恒等hook、开场、追击／留情及campaign集成。
- 原生整链、P078与所有依赖、俘虏／处斩／归属、return／mission、外交自动结算及其他外部结果。

“有界完整再考动作”只表示在本公开输入域、当前18牌足够且提供随机记录精确时，完整串起这里列出的清空、补牌、冷静及额度数据步骤；不表示覆盖来源任意运行态，也不表示整个舌战已完成。

本页及关联场景只提供静态规则说明、人工输入和纸面预期。未运行测试、编译器、typecheck、build、validator、checker、诊断器、项目、候选核、参考来源、场景、示例或replay；不能据此声称运行通过、已发布、已合并、原生等价或完整舌战闭环。
