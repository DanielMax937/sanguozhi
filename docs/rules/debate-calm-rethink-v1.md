# 舌战冷静再考补牌后增益独立核 v1

日期：2026-10-22。实现：[debate-calm-rethink.ts](../../packages/engine/src/debate-calm-rethink.ts) · [API 与精确 DTO](../engine/debate-calm-rethink-v1.md) · [固定来源与完整政策](../sources/debate-calm-rethink-v1.json) · [手工场景](../../data/scenarios/debate-calm-rethink-example-v1.json)。

`evaluateDebateCalmRethink` 的独立 profile 为 `debate-calm-rethink-reference-v1`。它只在**已经补满并按牌号升序排好的有效手牌**上，求值正计时冷静的再考增益及末尾排序。不清空手牌、不调用补牌、不生成牌组，也不等于完整 `CharacterRethink` 或完整再考会话。

输入显式提供来源 `RandBool(40)` 的布尔结果，不提供百分位整数、不调用外部 RNG。源分支需要这个布尔值时，即使当前话题无效也必须提供并消费；不需要时必须为空。成功含完整分离审计，失败只有失败原因，不发布部分手牌。

## 1. 固定来源与证据等级

行为依据为已留存的 `tankyc/sango_infinity` 现代 C# 参考，固定 commit `a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef`。本批静态阅读实际参考文本，不执行来源，不声称重新下载或重新认证来源。

- [Debate.cs 491–509](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L491-L509)：完整 `CharacterRethink` 先清空有效槽、再补牌，随后检查 timer、冷静和 `RandBool(40)`；布尔为真后才判断话题范围并写物理1槽，最后总是排序。本核只取补牌返回后的这一段。
- [Debate.cs 406–445](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L406-L445)：`CharacterSortCards` 按数值排序有效前缀；`CharacterFillCards` 恢复0槽、补空位、必要时修补普通话题牌，最后排序。这里只解释输入检查点，不在本核执行这些补牌步骤。
- [Debate.cs 369–375](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L369-L375)：来源性格优先采用有效覆盖值，否则查询人物。本核不执行解析，只接收调用者已经解析的四性格之一。

现代参考牌号采用再考0、普通话题牌1..9、话术10..14；故事、道理、时节话题分别为0、1、2，对应大牌3、6、9。来源里的大牌数组顺序是故事大、道理大、时节大，不是随机选一张大牌。

这是固定现代参考的局部规则，不认证 clean stock EXE、PC-PK、PK1.1、Vanilla、主机或原生二进制。原43个证据主题与45个历史快照缺口不减少。输入支持域、安全预算、原因标签及排序身份审计均为工程政策，不能当作源游戏已有接口或原生证明。

## 2. 显式输入：补满且排好序的检查点

每次调用都必须提供完整字段，不默认补政策、不隐式转换其他 profile：

| 字段 | 要求 |
| --- | --- |
| `schemaVersion` | 严格为1 |
| `profile` | `debate-calm-rethink-reference-v1` |
| `policies` | 与完整 `DEBATE_CALM_RETHINK_POLICY_V1` 相同；只给政策 id 不够 |
| `personality` | 已解析的 `timid`、`calm`、`bold` 或 `reckless` |
| `angerTimer` | 整数0..4 |
| `currentTopic` | 有符号32位整数，即−2147483648..2147483647 |
| `hand` | 稠密数组，长度4..7，按牌号非递减排列；恰有开头保留牌0，其余槽均为整数1..14，并至少有一张普通话题牌1..9 |
| `rawResults` | 稠密数组；无记录，或恰一份下述布尔记录 |

唯一接纳的原始结果记录为：

```json
{"role":"debate-calm-rethink-rand-bool","percent":40,"value":true}
```

`value` 也可以为布尔 `false`，不能用0、1、字符串或百分位整数替代。`percent` 必须是40，不是调用者可调的成功概率。字段名是 `rawResults`，不是其他核的 `draws` 或 `passDraws`。

`hand.length` 就是本次有效容量，没有单独的 `maxCardCount`，没有未激活尾槽。长度4的输入必须只有4项，不能补三个−1表示七物理槽。可出手区为槽1到末槽，共3..6张；重复牌号合法，但重复保留0、−1空槽、无普通牌、乱序或超出牌码域都不接纳。

这个严格检查点是工程准入域，不是声称每次调用来源 `CharacterFillCards` 都无条件保证普通牌：来源只有“填后无普通牌且本次确实补过空槽”时才修补。完整 `CharacterRethink` 先清空再补牌，本核则要求调用方直接交付完成后的有效状态，既不复核其补牌历史，也不偷偷修复不合格输入。

`currentTopic` 在有符号32位域内但不在0..2时，仍是合法计算输入，不是结构失败。`angerTimer=5` 则超出本版本的工程支持域；不能因为来源只判断 `>0` 就将任意正整数自动接纳。已解析性格不认证某位人物、覆盖值、书籍或物品配置正确，也不执行人物 getter。

## 3. 来源短路顺序与布尔记录消费

所有字段先完整安全分离与验证，再按以下顺序求值。即使某分支最终不使用话题，话题仍须满足公开输入合同。

1. `angerTimer=0`：门控原因及最终原因均为 `timer-zero`，必须 `rawResults=[]`。
2. timer为正但性格不是 `calm`：门控原因及最终原因均为 `personality-not-calm`，必须 `rawResults=[]`。
3. 正timer且冷静：门控为 `positive-timer-calm`，**必须恰有一份**合法布尔记录，并记录已消费1份。此要求不依赖当前话题是否有效。
4. 该布尔值为false：最终原因 `boolean-result-false`，不覆写任何槽。此时不把无效话题提升为最终原因。
5. 布尔值为true，但当前话题不在0..2：最终原因 `topic-out-of-range`，不覆写；布尔记录仍已经消费。
6. 布尔值为true且当前话题为0、1或2：覆写物理1槽，最终原因 `replacement-applied`。
7. **所有成功分支都执行末尾数值排序并返回排序审计。** 不因timer0、非冷静、false、无效话题或同面覆写而跳过。

例如，冷静/timer1/话题−1配true记录是成功的不覆写结果，不是“无需布尔值”；若改为空数组则拒绝。反之，胆小/timer1/有效话题配一份记录也拒绝，不能吞掉多余值。timer0且非冷静时，timer检查先短路，原因是 `timer-zero`。

这只是提供式布尔结果的消费合同。`percent:40`保留来源调用参数，**不定义** `RandInt(100)<40`、`<=40`、0..99或1..100等映射，不证明真实40%分布、种子、PRNG、取整或全局流位置。`externalRngConsumed:0`表示本核未调用外部随机源，并不表示源 `CharacterRethink` 没有随机调用。

## 4. 覆写物理1槽，再作完整最终排序

有效话题的大牌映射为：

| `currentTopic` | 覆写牌号 | 牌面 |
| --- | --- | --- |
| 0 | 3 | 故事大 |
| 1 | 6 | 道理大 |
| 2 | 9 | 时节大 |

目标固定为**输入补牌排序后的物理下标1**，不是按等级寻找最弱牌，不是按牌力计算最弱牌，也不是找第一张非当前话题牌。在本输入域内，0是唯一最小的保留再考牌，且至少含一张普通牌，所以1槽是最低数值的可出手牌，并一定属于普通话题牌。

数值顺序不等于等级顺序。例如 `[0,3,4,14]` 中1槽是故事大3，2槽是道理小4；话题2且布尔true时，应把3改为时节大9，不能因为4是小牌就改写2槽。

覆写不是抽取新牌：不推进牌组游标，不创建新牌组项，不消耗另一份随机输入，不调整手牌长度，也不消耗或恢复再考额度。若1槽已经是目标大牌，仍记录一次 `replacement-applied`，`replacement.changed=false`，不能把它改称未触发或false分支。

最终排序对覆写后的整个有效手牌按牌号升序进行。审计的 `sort.before` 是可选覆写后、最终排序前的数组，`sort.after` 是最终数组。`sort.sourceIndices[i]` 表示最终位置i的牌来自这次最终排序前的哪个物理槽；它不是初始发牌下标或牌组游标。

同牌号的审计次序使用 `source-slot-ascending-engine-policy`，即按排序前物理槽升序打破相等牌号的身份平局。来源这里只使用数值 `Array.Sort`，没有提供可认证的同值对象身份规则；本核的稳定来源槽映射不证明原生排序稳定，也不构成跨补牌、跨再考或跨session的 occurrence/token身份。

## 5. 成功审计与原子失败

成功结果为 `{ok:true,schemaVersion:1,profile,policy,evidence,hand,reason,audit}`，政策及证据分别对应导出常量 `DEBATE_CALM_RETHINK_POLICY_V1` 与 `DEBATE_CALM_RETHINK_EVIDENCE_V1`。注意输入键为复数 `policies`，成功结果键为单数 `policy`。完整 DTO 见 [API](../engine/debate-calm-rethink-v1.md)。

`audit` 保存：

- `inputHand`：调用者提供的原始检查点手牌副本，未被覆写。
- `gate`：`personality`、`angerTimer`、`eligible` 和上述门控 `reason`。
- `rawResultsConsumed`：0或1；`booleanResult`为null，或含 `index:0`、原role、`percent:40`及布尔value的消费记录。
- `replacement`：未覆写时为null；覆写时含 `sourceSlot:1`、`before`、`after`及 `changed`，包括同牌面覆写。
- `sort`：`before`、`after`、`sourceIndices`及固定 `equalCardTieBreak`，每次成功均保留。
- `externalRngConsumed:0`。

失败结果严格只有 `{ok:false,reason}`，不含候选手牌、部分成功审计、已消费记录或恢复用半状态。失败原因全集为 `unsupported-runtime`、`input-limit`、`malformed-data`、`unknown-field`、`unsupported-profile`、`unsupported-policy`、`invalid-personality`、`invalid-anger-timer`、`invalid-current-topic`、`invalid-hand`、`invalid-raw-results`、`invalid-raw-result`、`raw-result-count-mismatch`。多处同时坏形时的先后及精确错误归类以API为准，不从本页纸面案例猜测额外优先级。

输出是分离且递归冻结的数据，输入不被修改或冻结；重复调用不持有隐式牌组、计时器或RNG状态。`hand`是返回值，不是对外部人物对象执行写入。

### 5.1 数据与安全边界属于工程政策

入口要求可信 Node 运行时可通过 `process.getBuiltinModule('node:util').types.isProxy` 检测Proxy；缺少该能力时fail closed，不退回不安全反射。安全分离在反射前拒绝Proxy，不调用getter；拒绝accessor、函数等可执行或非JSON数据、symbol、非普通原型、环、稀疏或附加自定义字段的数组，以及非数组length的隐藏字段。普通对象和null原型记录可接纳；重复但无环的引用按独立副本分离和计入预算。

非整数、不安全整数、负零、NaN及Infinity不通过数值安全边界；字符串或boolean不能冒充牌号、计时或话题。全局预算为1024个值节点、root depth 0至10、数组最长32项及16384 canonical UTF-8字节，另有键和字符串预算；实际手牌4..7、原始结果0..1的语义限制更窄。精确计数及校验顺序见API。这些限制不是来源舌战规则，也不保证任意恶意宿主环境都受支持。

## 6. 手工成功案例：全部未运行

以下是纸面期望，不是候选执行、实际收据或测试通过记录。各例默认schema、profile、完整政策和所有未写出的结构均符合API。`[true]`或`[false]`仅为合法role/percent记录的value简写，不是实际公开输入格式。

| 例 | 性格 / timer / 话题 | 输入手牌 | 布尔记录简写 | 最终手牌 | 最终原因与关键审计 |
| --- | --- | --- | --- | --- | --- |
| A | calm / 1 / 0 | `[0,1,4,10]` | `[true]` | `[0,3,4,10]` | `replacement-applied`；1→3，changed=true，消费1 |
| B | calm / 4 / 1 | `[0,2,5,7]` | `[true]` | `[0,5,6,7]` | 物理1槽2→6；`sort.before=[0,6,5,7]`，sourceIndices为`[0,2,1,3]` |
| C | calm / 1 / 2 | `[0,1,4,5,10]` | `[true]` | `[0,4,5,9,10]` | 1→9；`sort.before=[0,9,4,5,10]`，sourceIndices为`[0,2,3,1,4]` |
| D | calm / 4 / 2 | `[0,3,4,14]` | `[true]` | `[0,4,9,14]` | 覆写故事大3，不改道理小4；目标不是最低等级 |
| E | calm / 1 / 1 | `[0,6,7,14]` | `[true]` | `[0,6,7,14]` | 仍为`replacement-applied`；replacement为1槽6→6、changed=false，消费1，仍排序 |
| F | calm / 1 / 0 | `[0,1,3,14]` | `[true]` | `[0,3,3,14]` | 重复3合法；sourceIndices为`[0,1,2,3]`，同值按来源槽的工程规则追踪 |
| G | calm / 4 / 2 | `[0,1,4,14]` | `[false]` | `[0,1,4,14]` | `boolean-result-false`；消费1，replacement=null，仍排序 |
| H | calm / 1 / −1 | `[0,1,4,14]` | `[true]` | `[0,1,4,14]` | `topic-out-of-range`；消费1，replacement=null，不能省略记录 |
| I | calm / 1 / 3 | `[0,1,4,14]` | `[false]` | `[0,1,4,14]` | `boolean-result-false`优先于无效话题，消费1 |
| J | calm / 0 / 0 | `[0,1,4,14]` | `[]` | `[0,1,4,14]` | `timer-zero`；消费0，booleanResult和replacement均null，仍排序 |
| K | bold / 4 / 0 | `[0,1,4,14]` | `[]` | `[0,1,4,14]` | `personality-not-calm`；不混用刚胆兴奋规则，消费0，仍排序 |
| L | timid / 0 / 2 | `[0,1,4,14]` | `[]` | `[0,1,4,14]` | 先检查timer，故为`timer-zero`而非非冷静原因 |
| M | calm / 4 / 2 | `[0,1,1,4,7,10,14]` | `[true]` | `[0,1,4,7,9,10,14]` | 最大有效容量7；仅1槽覆写，另一张1保留；sourceIndices为`[0,2,3,4,1,5,6]` |

H的话题改为−2147483648或2147483647仍属合法输入，布尔true时相同地消费1份且不覆写。G或I即使话题有效性改变，false仍先阻止覆写。K把性格换为timid或reckless且timer保持正数，也不消费布尔记录；不能将所有兴奋性格归入冷静门控。

无覆写例子的输入本已排序，最终数值不变，但仍有完整最终排序审计。不能因为相同输入输出而声称没有执行本次排序或没有消费布尔结果。

## 7. 手工拒绝案例：不是运行断言

以下各项单独改变一个原本合格的完整输入，均不产生成功手牌；实际结构及失败先后见API。

- 冷静/timer1配空 `rawResults`，即使话题为−1，仍缺少来源会消费的布尔结果，拒绝为 `raw-result-count-mismatch`。
- timer0或正timer非冷静配一份合法记录，是多余提供值，拒绝为 `raw-result-count-mismatch`，不能静默忽略。
- 提供两份结果、不提供数组、缺少记录字段、错role、`percent:39`、`bound:100`或数字value都不属于本合同；`value:0`不是false。
- `[0,4,1,14]`未排序；不能先帮调用者排序再覆写，因为那会改变其所描述的物理检查点。
- `[0,10,13,14]`没有普通话题牌；不能在本核调用话题修补，也不能用true布尔值让本来不合格的手牌变合格。
- `[0,0,1,14]`重复保留牌、`[0,-1,1,14]`有空槽、`[1,2,3,14]`缺保留0、`[0,1,14,15]`有越界牌号，均拒绝。
- 三槽、八槽、把四槽有效手牌加三个−1尾槽、稀疏数组或附加字段的数组，均不靠裁剪或补齐恢复。
- timer为−1或5、未知性格、话题2147483648或−2147483649，都超出相应支持域；不截断、不clamp、不默认替换。
- 任一数字为负零、浮点小数、NaN、Infinity或字符串，都不能通过数值安全边界；布尔结果以外的boolean也不能代替数字。
- 省略完整政策、仅给政策id、改政策内容、错profile或加未知字段，都不进行“尽量兼容”的推测。
- Proxy、getter、函数、symbol、循环引用、预算超限或不支持安全检查的运行时，按安全边界拒绝；不执行它们以探测真实牌面。

“成功但不覆写”与“输入失败”必须分开：合法无效话题和false是前者；缺失或多余布尔记录、坏形及域外数值是后者。失败不留下已覆写而未排序的半手牌，也不把计数错误前的私有候选包装成成功。

## 8. 兼容性、未实现范围与静态声明

本批只增加独立补牌后增益入口，不调用或修改既有补牌、牌组生成、攻击、可用性或愤怒阶段核，不改变九个旧session的profile、DTO、固定政策、命令、保存tag、拒绝域、load/replay或阶段编排。旧正常态会话的timer0边界、原有未支持愤怒触发的拒绝都继续存在，没有自动接入或隐式存档迁移。

以下明确不在本核范围：

- `CharacterRethink` 的前半段清空、补满、牌组游标、跨18牌再生成、话题修补及其抽样；不串联此前生成或补牌收据。
- 再考是否允许、是否实际选择、额度消费／恢复、冷静回合开始恢复额度、崩坏、选牌、消耗、攻击、HP或stress写入。
- 计时设置／递减／清零、刚胆普通牌耗尽取消timer、TurnStart/TurnEnd、完整愤怒阶段或完整回合路由。
- 原生 `RandBool` 实现、bound100到布尔的映射、原生40%概率证明、seed、全局PRNG及全回合随机流；跨再考的牌token/occurrence身份。
- 人物性格解析、人物智力／行为／书籍／物品、非恒等hook、AI、教程、开场、追击／留情、事件结果覆写、完整开局可达性及campaign集成。
- P078/native人员任务及全部依赖，俘虏／处斩／归属、return/mission、外交自动结算和其他外部后果。

本页及关联场景只提供静态规则说明、人工纸面输入和预期。未运行测试、编译器、typecheck、build、validator、checker、诊断器、项目、候选核、参考来源、场景、示例或replay；不能据此声称运行通过、已发布、已合并、原生等价或完整舌战闭环。
