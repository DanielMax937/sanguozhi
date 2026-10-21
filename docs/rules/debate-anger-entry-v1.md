# 舌战单次愤激进入核 v1

日期：2026-10-21。实现：[debate-anger-entry.ts](../../packages/engine/src/debate-anger-entry.ts) · [API 与审计合同](../engine/debate-anger-entry-v1.md) · [固定来源与完整政策](../sources/debate-anger-entry-v1.json)。

`evaluateDebateAngerEntry` 是独立纯求值入口，profile 为 `debate-anger-entry-reference-v1`。一次调用依次完成固定现代参考的 `CalcAngering(canReflect)`、其中的 `AngerTrigger`，以及紧随其后的 `Anger`。它选择一个触发方、处理一次自动反制、消耗反制牌，再对最终进入方设置性格 timer 或产生进入效果。

本核没有随机抽样，不生成或补充手牌，不执行胆小连打，不自动做第二次愤激判定，也不推进回合或保存会话。提供的检查点可以是合成局面；成功结果只表示该有界输入按本核政策求值得到结果，不证明它能由完整开局历史到达。

## 1. 固定来源与证据身份

依据为 `tankyc/sango_infinity` commit `a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef` 的现代 C# 参考。以下文件身份继承已留存来源账本；本批静态阅读固定文本，不声称重新下载、重新计算来源哈希或执行来源。

| 固定文件 | Git blob | 用途 |
|---|---|---|
| [Debate.cs](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs) | `0137498d10773cd4596d497083ccdf6a26b3a261` | 触发选择、反制、写入、手牌压缩、性格进入 |
| [DebatePhase.cs](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/DebatePhase.cs) | `6aa98f855a5d4d172cde7e8ffc18a141b8a7b587` | 确认本核截取位置及尚未接入的阶段边界 |
| [DebateEnum.cs](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/DebateEnum.cs) | `5b46a8ac87613193eb9f4b99a25e489ba6f5e483` | 牌码及性格符号；部分枚举自述由实现归纳补齐 |

精确归因：

- [`Debate.cs 42–57`](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L42-L57)：双方、HP上下限、stress上限与7槽物理手牌常量；[`343–355`](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L343-L355) 展示一般存活人物的4..7容量分段，本核不执行人物存活与智力查询。
- [`Debate.cs 363–391`](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L363-L391)：读取武力、有效性格以及设置 timer。本核只接收已解析的 `strength`、`personality`，不实现人物 getter、性格 override 回退或真实人物映射。
- [`453–477`](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L453-L477)：删除并压缩手牌、从0槽开始返回第一个匹配下标。
- [`512–534`](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L512-L534)：HP 与 stress 的逐次 clamp writer。
- [`1300–1354`](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L1300-L1354)：反制触发的 stress 写入和移牌，随后 personality timer、胆小 combo 标记与莽撞直接伤害。
- [`1482–1517`](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L1482-L1517)：先手优先、反制牌优先级、严格 `index > 0`、激昂重定向及镇静取消。
- [`DebatePhase.cs 333–390`](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/DebatePhase.cs#L333-L390)：完整 `AngerPhase` 在两次进入判定之间还有连打与胜负检查，本核不等于该阶段。

[`DebateEnum.cs 33–61`](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/DebateEnum.cs#L33-L61) 固定 `0` 为再考、`1..9` 为普通话题、`10..14` 为大喝/诡辩/无视/镇静/激昂；`-1` 空槽语义见上面的手牌方法。[`116–124`](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/DebateEnum.cs#L116-L124) 列出胆小、冷静、刚胆、莽撞四性格。本批静态阅读已留存的枚举文本，不把它描述为检查了原始 C++ 头文件；来源文件头明确提示部分枚举由实现归纳补齐。

现代翻译文本及其文件身份不认证 clean stock EXE、PC-PK/PK1.1、Vanilla、主机版本或原生 PRNG。既有普通伤害公式证据不能自动覆盖本核的自动反制、性格进入或手牌物理槽语义。

## 2. 显式检查点与有界支持域

公开输入必须携带 `schemaVersion:1`、固定 profile、完整固定 `policies`、`firstTeam`、`canReflect`、按队伍0和1排列的 `characters`，以及既有 `combo`。固定政策常量为 `DEBATE_ANGER_ENTRY_POLICY_V1`，证据常量为 `DEBATE_ANGER_ENTRY_EVIDENCE_V1`；具体封闭字段、错误值及审计字段见 [API](../engine/debate-anger-entry-v1.md)。

每方显式提供：

- `personality` 为 `timid`、`calm`、`bold`、`reckless` 四者之一，表示已解析的有效性格。
- 整数 `strength=1..100`、`hp=-100..1000`、`stress=0..100`、`angerTimer=0..4`。
- `maxCardCount=4..7`，表示本次读取的活动前缀长度，不由本核从智力或人物存活状态推导。
- `hand` 恰好7个物理槽，每项是整数 `-1..14`。重复牌、内部空洞、非再考的0槽，以及活动前缀之外的有值槽均可显式提供。

`combo` 提供 `active`、`attacker=-1|0|1` 和整数 `counter=0..7`。本核不增加相互约束，不把非活动 combo 的旧 attacker/counter 清零，也不声称所有接纳组合在完整阶段中可达。counter 上限只是接口检查点预算，不是来源中的 clamp；本核没有连打自增。

这些范围是本版本的明确支持域。源代码的 `angerTimer <= 0` 在本域等价于0，但不据此声称源代码拒绝负 timer；武力范围、容量4..7和 combo counter 上限也不应冒充源 getter 的完整值域。

输入手牌不能先排序、先压缩或把0槽改成再考。否则会改变第一个匹配位置及 `index > 0` 结果。也不能因为活动前缀外有值就提前清除；未发生删除时，全部7个输入槽原样保留。

本核不接收上一轮 `angering`。来源 `CalcAngering` 每次先重置它为 `-1`，因而本次选择及最终进入方由当前输入重新决定。`firstTeam` 和 `canReflect` 是本次调用参数，不代表本核维护了阶段游标。

## 3. 只选择一个触发方

先检查 `firstTeam`，再检查另一方。入选条件为 `angerTimer <= 0` 且 `stress >= 100`。若先手符合，后手即使也符合也不会替代先手。

无人符合时，最终进入方为 `-1`，HP、stress、timer、全部手牌和既有 combo 保持。不能把 `stress=100` 且 timer 大于0的参与者再次触发，也不能先递减 timer 后再判断。

本函数没有 HP gate。HP小于等于0不单独取消其内部触发；完整 `DamagePhase` 在进入 `AngerPhase` 前的胜负检查属于外层流程，不能暗中加入本核。接纳低HP合成检查点不证明实际阶段会到达它。

## 4. 自动反制及严格的 first-match 语义

选定触发方后，只有其对手 `angerTimer <= 0` 才查找反制牌。对手 timer 大于0时，两种查找均跳过。

查找优先级为：

1. `canReflect=true` 时查找激昂14。只有**第一个匹配下标严格大于0**才选择它。
2. 未选择激昂时，查找镇静13，同样只接受第一个匹配下标严格大于0。
3. 两者均不满足则没有反制牌。

`canReflect=false` 只关闭激昂查找，不关闭镇静查找。激昂成功后也不再查找镇静。审计应区分未执行的查找、查不到返回 `-1`、以及首个匹配在0槽而不合格，不能补做源控制流没有执行的查找来生成结果。

查找只遍历 `0..maxCardCount-1`，返回第一个等值槽；不跳过0槽后重新寻找后续副本。若0槽和2槽都是激昂，第一结果仍为0，这张牌不能作为激昂反制。活动前缀外的镇静或激昂也不能反制。

自动反制不调用一般 `IsCardAvailable`，不要求 `canRethink`，不经过普通 Attack/Effect 的反射结算，也不另取随机抽样。

## 5. 按源顺序写入 stress、移牌并决定进入方

以下“原触发方”是反制之前选中的一方，“对手”指它的对手。每次 stress 请求写入后立刻 clamp 到0..100，审计分别保存请求量与实际变化。

| 自动反制 | 源顺序的 stress 请求 | 移除的牌 | 最终进入方 |
|---|---|---|---|
| 无 | 原触发方 `-100` | 无 | 原触发方 |
| 镇静13 | 原触发方 `-50` | 对手第一张镇静 | `-1`，取消本次进入 |
| 激昂14 | 对手 `-100`，随后原触发方 `-50` | 对手第一张激昂 | 对手 |

stress 写入在移牌之前。选中有效反制时，来源在移牌时再次寻找该牌的第一个匹配槽；本纯核在两次查找之间没有外部可变回调，故它仍是同一物理槽。没有反制时不调用移牌函数，不能顺便压缩或清除手牌。

移牌准确展开 `CharacterRemoveCard`：先把移除槽设为 `-1`，保存全部7槽，再清空全部7槽，只按原顺序复制原活动前缀内所有非 `-1` 幸存项到最前方。既不数值排序，也不按牌类筛选。

因此，活动前缀之外有值的槽仅在实际移牌时被清掉；它们不是被顺带“打出”的额外牌。保留项的 `fromSlot → toSlot` 与丢弃的非活动槽应分开记录。相同牌码的两个输入槽也不能因为值相同就合并成一个。

激昂不是让原触发方继续以自己的性格进入；移牌后将进入方重定向到对手，下一步使用对手的性格和武力。镇静取消后不设置任何 timer，不运行任何进入伤害。

## 6. 进入性格状态，不等于完成愤激回合

最终进入方有效时，先设置它的 timer：

| 性格 | timer 新值 | 随后的本次进入效果 |
|---|---:|---|
| timid 胆小 | 1 | 设置 combo attacker 为进入方，counter为0，active为true |
| calm 冷静 | 4 | 无其他本次进入写入 |
| bold 刚胆 | 4 | 无其他本次进入写入 |
| reckless 莽撞 | 1 | 对其对手执行直接HP与stress写入 |

胆小只**开启待执行 combo**。本核不读取普通牌来连打、不消耗其话题牌、不计算 combo 伤害、不增加 counter，也不清除 active。非胆小进入、镇静取消和无人触发时，既有 combo 的全部字段均保持；不要把它们统一重置成空 combo。

莽撞的请求量为：

- `hpDamage = 200 + 进入方.strength`。
- `stressDamage = trunc(hpDamage / 15)`。
- 先给其对手请求HP变化 `-hpDamage`，clamp到 `[-100,1000]`；再请求stress变化 `+stressDamage`，clamp到 `[0,100]`。

在当前武力支持域，HP请求201..300，stress请求13..20。stress请求由**原始 hpDamage**计算，不能改用HP clamp后的实际损失。即使第一笔HP写入已经致死，第二笔stress仍写入；本核不在中间插入胜负判断。

此进入分支不调用 `CalcHpDamage`，不读取 attack，不使用牌等级或话题系数，不消费 bound5 jitter，也不调用一般 `ModifyHpDamage` hook。实际人物武力如何解析不在本核内。

## 7. 手工纸面例子，未运行

以下数字用于解释分支与顺序，不是完整公开输入或执行收据。未列状态保持不变；两方的完整结构仍必须满足 [API](../engine/debate-anger-entry-v1.md)。

### A. 0槽遮蔽后续激昂，转而选择镇静

先手0的stress为100、timer为0；对手1的timer为0、`maxCardCount=4`，物理手牌为 `[14,14,13,-1,-1,9,10]`，`canReflect=true`。

激昂的第一个匹配是0，不满足 `>0`，不能改取1槽；随后镇静第一个匹配为2，成立。队伍0的stress变50，本次进入取消。移除2槽后，对手手牌为 `[14,14,-1,-1,-1,-1,-1]`。原5、6槽的9和10位于活动前缀之外，在这次源移牌清空中被丢弃，不参与反制，也不保留到压缩结果。

### B. canReflect=false 仍可镇静

先手0的stress100、timer0；对手1的timer0、容量4，手牌 `[0,14,13,1,-1,-1,-1]`，`canReflect=false`。

跳过激昂查找，直接找到镇静2槽。队伍0的stress100→50，进入取消，对手手牌压缩为 `[0,14,1,-1,-1,-1,-1]`。激昂14保留，没有“本次不能反制所以连镇静也禁用”的规则。

### C. 激昂重定向到莽撞，使用重定向方的武力

先手0的HP1000、stress100、timer0；对手1的stress40、timer0、性格reckless、strength90，容量4手牌 `[0,14,2,13,-1,-1,-1]`，`canReflect=true`。

激昂1槽优先于镇静3槽。依次写队伍1 stress40→0，再写队伍0 stress100→50；消费14后，对手手牌为 `[0,2,13,-1,-1,-1,-1]`。最终进入方为1，它的timer设1。随后队伍1的武力90产生HP请求290和stress请求19，队伍0变为HP710、stress69。原触发方的性格及武力不决定这笔进入伤害。

### D. HP与stress分别clamp，HP致死不省略stress

先手0为reckless、strength100、stress100、timer0，对手无合格反制，HP10、stress95。

队伍0先stress100→0、timer设1。莽撞请求伤害300，目标HP10−300=-290，clamp后为−100，实际损失110；随后stress请求仍按300/15得到20，目标stress95+20 clamp为100，实际只增加5。不能以110计算stress，也不能在HP≤0后跳过这次stress写入。

### E. 无人触发时完整保留检查点

先手0的stress100、timer1；队伍1的stress99、timer0。两者都不符合，最终进入方−1。若提供的既有 combo 为 `active=true, attacker=1, counter=3`，本核仍原样保留它；也不因槽内有空洞或非活动尾槽有值而整理手牌。该合成 combo 检查点不等于完整阶段一定会在这里再次调用本核。

### F. 双方满stress仍只处理一次进入

双方stress100、timer0，无合格反制，先手0为calm。此次只选队伍0：其stress变0、timer设4，队伍1仍stress100、timer0。即使第二方仍可触发，也不在同一调用内递归处理或自动做第二轮。

## 8. 原子求值、审计与旧接口隔离

本核在分离候选数据上求值，不修改调用者输入。成功返回的状态和 receipt 使用本版本完整固定政策与证据，保存选择顺序、反制查找、原触发方/最终进入方、实际移牌与槽映射、有序数值写入、timer及 combo 前后值。输出深冻结；精确字段名和拒绝合同以 [API](../engine/debate-anger-entry-v1.md) 为准。

没有抽样参数，`externalRngConsumed=0`。这表示本边界内无随机调用，不能推出外围连打、再考、牌堆、话题或原生全局RNG不消费随机数。也没有把视图、日志、动画、人物 getter 或外部可变回调当成已实现的事件系统。

新入口不替换旧会话或其内部正常态 combat helper。PR114的 `debate-regenerated-deck-reference-v1`、旧保存tag、固定政策、DTO、历史命令、receipt、`angerTimer:0`域及非终局 `unsupported-anger-trigger` 整轮拒绝均保持。不得把本独立核的存在描述为这些会话已能跨越愤激边界，也不接受用它的结果直接改写旧存档规避旧拒绝。

## 9. 尚未接入的阶段与证据边界

完整 [`AngerPhase`](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/DebatePhase.cs#L333-L390) 固定编排为：第一次 `CalcAngering(true)`、`Anger`、可能的combo、胜负检查；随后第二次 `CalcAngering(false)`、`Anger`、可能的combo、崩坏、胜负检查和TurnEnd。它不是“持续循环到stress不满100”。本核只覆盖其中一次选择加进入，不包含其余阶段。

明确继续开放：

- [`ComboAttack 1356–1377`](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L1356-L1377)：源循环每次移牌压缩后仍递增下标，会影响下一次访问，不能用“消费所有话题牌”概括。本核不执行它，也不支持其抽样或物理槽迁移链。
- [`IsCardAvailable 933–988`](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L933-L988)：冷静/刚胆愤激下的一般选牌限制。
- [`CalcAttacker/CalcHpDamage 1128–1196`](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L1128-L1196)：刚胆牌力替换、愤激伤害系数、提供式抽样及一般伤害hook。
- [`TurnStart 1045–1079`](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L1045-L1079)：冷静恢复再考、补牌后刚胆无话题牌取消timer；[`TurnEnd 1082–1097`](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L1082-L1097)：timer递减和结束表现。
- [`CharacterRethink 490–509`](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L490-L509)：冷静愤激的条件40%大牌覆写及后续排序。
- [`CalcWinner/CanCritical 1379–1406`](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L1379-L1406) 与 [`DamagePhase 394–420`](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/DebatePhase.cs#L394-L420)：阶段间HP终局、先手优先的胜负次序、追击/留情及结果分派。
- 包含这些步骤的新会话、发生额外消耗后的补牌/再生预算、occurrence身份、完整回合抽样顺序、阶段存档、load/replay、教程、真实人物/书籍/物品、行为hook、开局历史可达性、campaign后果与事件结果覆写。

P078/native人员任务及全部依赖、俘虏/处斩/归属、return/mission与外交自动结算均不在本核范围。原43证据主题和45历史快照不因本现代参考独立核而清零。原生完整链、stock/PK/Vanilla等价、完整舌战和运行认证继续开放。

本批只有静态源码/文档阅读、文本编写和纸面推导。未运行测试、typecheck、编译器、build、validator、checker、诊断器、项目、候选核、来源、场景或replay。纸面数字不构成通过测试、已运行或运行等价的证据；本页也不自行声称已发布或已合并。
