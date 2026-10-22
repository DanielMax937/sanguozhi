# 舌战有界愤激结算事务 v1

日期：2026-10-21。实现：[debate-anger-phase.ts](../../packages/engine/src/debate-anger-phase.ts) · [API 与审计合同](../engine/debate-anger-phase-v1.md) · [固定来源与完整政策](../sources/debate-anger-phase-v1.json)。

`evaluateDebateAngerPhase` 是独立纯求值入口，profile 为 `debate-anger-phase-reference-v1`。它组合 [PR115 单次愤激进入核](debate-anger-entry-v1.md) 与 [PR116 胆小待执行连打核](debate-timid-combo-v1.md) 的公共 API，在给定的存活双方检查点上，完成**至多两次进入、各自可能的一次完整连打、规定位置的胜负检查，以及未被首次终局跳过的一次崩坏更新**。

这是固定现代参考中一个有界结算事务，不是完整阶段路由、回合或 session。成功边界仅为 `terminal-pending-classification` 或 `turn-end-pending`：前者尚待外层区分 Critical/Closing，后者尚待外层执行 TurnEnd。不能把边界名称解释成已经调用 `CanCritical()`、进入 Closing 或完成回合结束。

## 1. 固定来源与证据身份

依据为 `tankyc/sango_infinity` commit `a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef` 中已留存的现代 C# 参考文本；本批静态阅读实际文件，不执行来源，也不据此声称重新下载或重新认证来源。

- [`DebatePhase.cs 333–390`](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/DebatePhase.cs#L333-L390)：两次进入、整次连打、两次胜负检查和崩坏的顺序，以及仍在本核以外的 Critical/Closing/TurnEnd 路由。
- [`Debate.cs 1483–1517`](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L1483-L1517)：每次重置进入方，先手优先，反制时的 first-match `index > 0`，`canReflect` 只门控激昂，不门控镇静。
- [`1300–1354`](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L1300-L1354)：触发压力、反制移牌、性格 timer、胆小开启 combo、莽撞进入伤害。
- [`1356–1377`](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L1356-L1377)：一次完整连打扫描、每击写入和移牌、counter 自增及末尾关闭 combo；没有逐击终局退出。
- [`1379–1396`](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L1379-L1396)：只在 winner 尚未确定时，先查先手对方的 HP，再查先手自己的 HP。
- [`1520–1531`](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L1520-L1531)：崩坏等级计算、变化标志与返回值；等级下降也属于变化，等级不变不清除旧标志。
- [`42–57`](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L42-L57)、[`363–391`](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L363-L391)、[`453–477`](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L453-L477)、[`512–534`](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L512-L534)：常量、已解析性格/武力边界、移牌压缩、HP/stress 逐次 clamp，沿用两个子核的规则。
- [`1128–1196`](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L1128-L1196)：通用胆小连打伤害的系数及其后的人物伤害 hook，后者不能默认对所有人物恒等。

本核的组合关系及来源记录不认证 clean stock EXE、PC-PK/PK1.1、Vanilla、主机版本、原生 PRNG 或开局历史可达性。现代参考的行为、公开输入支持域及工程审计表示应分别表述。

## 2. 显式检查点与更窄的准入域

完整输入必须含 `schemaVersion:1`、固定 profile、与 `DEBATE_ANGER_PHASE_POLICY_V1` 完全一致的 `policies`、`genericOnly:true`、`firstTeam`、`winner`、`characters`、`combo`、`crumbledLevels`、`crumbled`、`resolvedAttacks`、`passDraws`。没有默认值；准确封闭结构、错误值与解析预算见 [API](../engine/debate-anger-phase-v1.md)。证据常量为 `DEBATE_ANGER_PHASE_EVIDENCE_V1`。

| 输入 | 本版本要求 |
|---|---|
| `firstTeam` / `winner` | 先手为数字0或1；初始 winner 必须为−1 |
| `characters` | 按队伍0、1排列的两份完整 PR115 Character |
| `personality` / `strength` | `timid\|calm\|bold\|reckless`；已解析有效武力整数1..100 |
| 初始 `hp` / `stress` | 整数1..1000 / 0..100，双方必须存活 |
| `angerTimer` | 整数0..4，不先递减 |
| `maxCardCount` / `hand` | 容量4..7；恰好7个物理槽，每项整数−1..14 |
| `combo` | `active:false`，`attacker:-1\|0\|1`，整数 `counter:0..7` |
| `crumbledLevels` / `crumbled` | 按队伍0、1排列的等级整数0..3对 / boolean 标志对 |
| `resolvedAttacks` | 按队伍0、1排列的已解析攻击力整数70..227对 |
| `passDraws` | 恰好两份稠密数组，分别供第一次、第二次进入后的连打；每份长度0..4 |
| 每个 draw | 精确为 `{role:'debate-timid-combo-jitter', bound:5, value:0..4}` |

所有数值按 API 的安全整数要求接纳，不用字符串或真假值代替。PR115/PR116 可以接纳低至−100的 HP 检查点，本组合核则要求**初始**双方 HP>0；内部伤害仍沿用−100..1000 clamp，结果 HP 可以为0或负数。此差异是有界入口政策，不是声称来源 `AngerPhase` 本身验证了这些条件。

初始不接纳 active combo，以免把未知旧连打当作本阶段新产生的 pending。inactive combo 的旧 attacker/counter 则合法，不强制写回−1/0：无人进入、镇静取消及非胆小进入都保留它们；只有真实胆小进入才重设 attacker、counter=0、active=true，再由完整连打关闭 active。

保留手牌重复码、内部−1空槽、非再考的0槽和非活动前缀的有值槽，不预排序、预压缩或修复手牌。崩坏等级也不要求预先与 HP 一致，允许描述未同步的检查点，因此后面的等级下降规则有意义。接纳合成检查点不是宣告它一定来自完整开局。

`characters`、`resolvedAttacks` 与 `firstTeam` 分别表达队伍数据、队伍攻击力和先手顺序，不能把先手排到数组0重新编号。`passDraws[0]` 属于第一次经过，`passDraws[1]` 属于第二次经过，**不是按队伍分配**。若激昂把进入方重定向到另一队，连打使用实际 `combo.attacker` 对应的 `resolvedAttacks`，仍消费本次经过的那份 draws。

`genericOnly:true`、显式性格/武力和两个 attack 标量均是调用者提供的边界声明，不是人物查询或认证结果。本核不证明它们与某位人物、智力、书籍、物品、性格覆盖或行为配置一致，不执行 `ModifyAttack` 或非恒等 `ModifyHpDamage`。即使两次都没有连打，也必须完整提供并验证双方攻击力。

## 3. 精确编排：最多两次，不循环至压力稳定

解析并分离全部输入后，在私有候选状态中严格依次求值：

1. 调用 PR115 `evaluateDebateAngerEntry`，`canReflect=true`。此调用已包含选择、触发、反制移牌及一次 `Anger()`，不能再调用一次进入效果。
2. 若进入结果开启 combo，调用 PR116 `evaluateDebateTimidCombo`，完成**整个** `ComboAttack`；否则不调用该子核。
3. 做第一次 `CalcWinner` 等价检查。若有胜者，直接以 `terminal-pending-classification` 完成事务，**跳过第二次进入、第二次连打及全部崩坏更新**。
4. 尚无胜者时，再调用 PR115，固定 `canReflect=false`；读的是第一次结果中的当前状态，不是初始快照。
5. 若第二次进入开启 combo，再用 PR116 完成整个连打。
6. 对双方执行一次 `CalcCrumbled` 等价更新。
7. 做第二次 `CalcWinner` 等价检查。有胜者则为 `terminal-pending-classification`；否则为 `turn-end-pending`。

第一次无人进入、被镇静取消或连打零命中，都不省略它后面的胜负检查，也不跳过正常情况下的第二次进入。第二次无进入同样仍做崩坏和第二次胜负检查。相反，第一次已终局不能为了“对齐两次 receipt”而空跑第二次或补算崩坏。

没有第三次进入，不递归处理连打刚增加的 stress，不反复运行到双方 stress 都低于100。不执行 TurnStart/TurnEnd，不递减或清零 timer，不抽牌、补牌、再生、排序，不推进外部 phase step、会话或存档游标。源 `AngerPhase` 的 `delta` 和动画逐帧推进不在纯事务输入中。

### 3.1 `canReflect=false` 仍允许镇静

两次调用都完整继承 PR115 的先手优先、对手 timer 门控和 first-match 严格 `index > 0` 规则。第二次只是关掉激昂14的查找，镇静13仍可自动反制、消费并取消进入；不能把它实现成“第二次完全不允许反制”。

反制移牌和第一次连打都可能改变第二次读取的物理手牌。第二次查找必须使用当时已经压缩的七槽状态，不能复用第一次的查找结果。激昂成功后用重定向方的性格和武力；若该方胆小，其 attack 也按这个实际队伍读取。

### 3.2 连打必须完整完成，不能在击间判胜

PR116 每次都从物理下标0开始，在当前手牌上递增扫描。每次话题命中按顺序消费一条 jitter、写目标 HP、写目标 stress、移除并压缩、递增 counter，然后继续下一个下标；移牌后不回退下标，不预收集所有话题牌。

HP 已到0或−100不会中断本次连打。后续实际命中仍消费 jitter、写入压力、移牌并计数；逐击 clamp 和以请求 HP 伤害除15求 stress 的语义不变。外层胜负检查只能出现在整次连打之后，不能塞进子核的每击之间。

每次 fresh timid pending 最多4击，两次合计最多8条 draws。这个上界来自容量≤7、移牌压缩且扫描下标继续递增，并不是人为打满4次即 break。第二次胆小进入会重设 counter=0；最终 counter 不是两次击数的总和。

## 4. 胜负检查与待分类边界

来源 `CalcWinner` 在 winner 为−1时，固定令 `team=firstTeam`、`opponentTeam=1-firstTeam`：

1. 若对方 HP≤0，winner 设为 firstTeam。
2. 否则，若 firstTeam 的 HP≤0，winner 设为另一方。
3. 否则仍为−1。

顺序是“检查先手的对方 HP，再检查先手自己的 HP”，不是先查队伍0，也不是先查自己的 HP。由 `if/else if` 可知，若两方 HP 都≤0，先手胜；这条规则来自固定来源，**不是本版本允许输入双死状态**。初始双方存活、一次只伤害对方且第一次终局即停止的通用域，也不因纸面描述这个 tie-break 就宣称能到达双死结果。

`terminal-pending-classification` 只说明这里已得到 winner。是否达到会心门槛、会心功能是否关闭、进入 Critical 还是 Closing、追击/留情、事件强制胜负覆写和最终奖励结算，都留给外层。`turn-end-pending` 也只表示两次规定检查均无胜者；此时 timer 仍是进入效果写入后的值，没有执行 TurnEnd。

## 5. 崩坏是第二次之后的同步，标志不是重算成 changed

只有首次胜负检查未终局时，才在第二次进入及可能的完整连打之后、第二次胜负检查之前，对队伍0、1依次计算：

```text
computedLevel = clamp(trunc((1000 - currentHp) / 250), 0, 3)
if computedLevel != previousLevel:
    crumbledLevel = computedLevel
    crumbled = true
else:
    preserve previousLevel and previous crumbled
```

本域 currentHp≤1000，分子非负，向零截断与 floor 相同。HP1000..751对应0，750..501对应1，500..251对应2，250..−100均为3。逐方比较输入携带的旧等级，不是只问这次伤害是否跨越阈值。

- 等级增加或下降都写新等级并设 `crumbled=true`；不使用 `max(oldLevel,newLevel)`。
- 等级相同，旧 `crumbled=true` 保持 true，旧 false 保持 false；不能每次先清空标志，也不能直接把 flag 赋成 `changed`。
- 来源返回值是更新后的 `crumbled[0] || crumbled[1]`，可能因旧的 sticky true 为真，即使两方等级均没变化；它不是本次变化数量，也不控制本事务胜负。
- 第二次伤害已把一方打死，仍先算崩坏，再判胜。第一次伤害终局则完全不算崩坏，允许结果等级暂时与新 HP 不一致。

崩坏同步不消耗 RNG、不修改 HP、stress、timer 或手牌；也不推进表现层来自动清除标志。

## 6. 提供式 draws、全量验证与原子失败

本事务复用 PR116 的原始记录角色，不另造“phase jitter”或改变 bound：每项仍为 `debate-timid-combo-jitter / 5 / 0..4`。每个经过使用独立数组，先后次序是第一次全部实际命中，再是第二次全部实际命中；不能从第二份借一条补第一次，也不能把第一次余数递交第二次。

所有顶层字段、两方 Character、旧 combo、崩坏数组、两个 attack 和两份 draw 数组及其每项，**在任何私有候选求值前完成结构与范围验证**。未来可能跳过的第二份数据也不能藏非法 role、bound、value 或结构。固定政策必须完整匹配，不能只比较 policy id。

结构合法还不等于消费数量正确：

- 每次真实连打必须恰好耗尽本次提供值；少给某击、或结束后多给值，均失败。
- 没有开启 combo 的经过必须提供空数组；不能把非空数组静默忽略。
- 开启了零命中 combo 也只接纳空数组，但应保留真实的零击子核 receipt，而不是伪装成未调用。
- 第一次已终局时，第二份必须为空。非空即是被跳过经过的未使用 draws，不发布“第一步成功”的终局结果。
- 每份最多4条是本组合核自身的输入上限，比 PR116 独立 API 的通用数组解析预算更窄；它不修改 PR116 的既有合同。

成功返回完整分离状态和 receipt，并递归冻结；不修改或冻结调用者输入。任一解析、子核或消费一致性失败，只返回失败，不发布中间进入结果、半次连打、已更新的崩坏或部分收据。即使错误只有在私有求值后才能发现，也不能把前半段当作提交过的事务。

`externalRngConsumed=0` 表示没有调用外部随机源；成功的提供式消费仍可达8条。它不表示源连打没有 `RandInt(5)`，也不证明种子、原生 PRNG、全局流位置或完整回合随机序列已经对齐。

## 7. 手工纸面例子，均未运行

以下只列相关字段及纸面推导，不是完整公开输入、实际 receipt 或执行结果。除另述外，先手为0，初始 winner=−1，inactive combo，双方 timer=0、HP1000，初始崩坏等级 `[0,0]`、标志 `[false,false]`，无合格反制。所有省略字段仍必须按 [API](../engine/debate-anger-phase-v1.md) 完整提供；每个 jitter 数字都是相应 role/bound 记录的 value 简写。

### A. 第一次莽撞致死：第二次和崩坏都跳过

队伍0为reckless、strength100、stress100；队伍1 HP10、stress95。两份 draws 都为空。

第一次进入让队伍0 stress100→0、timer设1；对队伍1请求 HP−300，10−300裁剪为−100，随后 stress+20裁剪为100。无 combo。第一次胜负检查得 winner=0，结果是 `terminal-pending-classification`。

即使队伍1此时 stress100、timer0，仍不做第二次进入。崩坏等级和标志保持初始 `[0,0]`、`[false,false]`，不能因队伍1 HP 已−100而补写等级3。若初始 combo 是 `active:false,attacker:1,counter:7`，非胆小进入也不会把其旧字段清空。若第二份 draws 非空，则整个事务失败，而不是忽略它后返回这个终局状态。

### B. 第一次连打早已致死：四击仍全部完成

队伍0为timid、stress100、容量7，手牌七槽全为大牌3，`resolvedAttacks[0]=227`；队伍1 HP10、stress95。`passDraws[0]` 提供四条 value=4，第二份为空。

每击请求 HP462、stress30。第一击后目标已 HP−100/stress100，但后三击仍各自消费 draw、记录请求、移牌并计数，两项实际变化为0。最后队伍0保留三张牌3，combo 为 inactive、attacker0、counter4。**此后**第一次胜负检查才给 winner0；第二次和崩坏跳过。

只提供一条 draw 不能因第一击致死而成功；它会缺少后续真实命中的值。也不能把剩余三个 draw 视为可忽略的终局尾数。

### C. 第二次莽撞致死：先崩坏，再判胜

队伍0为calm、HP250、stress100；队伍1为reckless、strength100、stress100；两份 draws 为空。

第一次队伍0进入：stress变0、timer设4，双方仍存活，winner仍−1。第二次先手因timer4不合格，队伍1进入：stress变0、timer设1，对队伍0请求 HP−300/stress+20，结果 HP−50、stress20。

接下来仍先做崩坏：队伍0的 `trunc((1000−(−50))/250)=4` 被上限裁成3，队伍1为0，所以等级变 `[3,0]`、标志 `[true,false]`。第二次胜负检查先看队伍1 HP1000，再看队伍0 HP−50，得到 winner1，返回 `terminal-pending-classification`。队伍0 timer仍4，不因败北或“阶段结束”自动变成3或0。

### D. 两次都被镇静取消，第二次仍查镇静

双方 stress100、timer0、容量4。队伍0手牌 `[0,14,13,1,-1,-1,-1]`，队伍1手牌 `[0,13,1,-1,-1,-1,-1]`。两份 draws 为空。

第一次选队伍0；对手队伍1没有激昂，镇静在1槽合格。队伍0 stress100→50，进入取消；队伍1消费镇静后手牌变 `[0,1,-1,-1,-1,-1,-1]`，其自身stress仍100、timer仍0。

第二次选队伍1；对手队伍0仍timer0，虽然手里有1槽激昂，但 `canReflect=false` 跳过激昂查找，仍找到2槽镇静。队伍1 stress100→50，进入取消；队伍0手牌变 `[0,14,1,-1,-1,-1,-1]`。双方 timer仍0，没有连打。崩坏不变，两次胜负均无胜者，结果是 `turn-end-pending`，不是已经执行 TurnEnd。

### E. 双胆小达到八条 draws 上界，最终counter不是8

双方timid、stress100、容量7，手牌均为七张小牌1，`resolvedAttacks=[70,70]`。两份 draws 各提供四条 value=0。

第一次队伍0进入并连打四击，每击 HP70/stress4。队伍1变 HP720，stress原已100仍为100；队伍0 timer1、stress0。第一次无胜者。

第二次队伍1仍符合进入条件；其进入后 stress0、timer1，重设 combo attacker1/counter0，再连打四击，使队伍0变 HP720、stress16。最终双方手牌均剩三张牌1，HP为 `[720,720]`、stress为 `[16,0]`、timer为 `[1,1]`。最终 combo 是 inactive、attacker1、counter4，不是counter8。

崩坏等级由 `[0,0]` 变 `[1,1]`，标志变 `[true,true]`；无胜者，边界为 `turn-end-pending`。八条提供式 draws 全部消费，但没有外部 RNG 调用，也没有递减这两个timer。

### F. 等级下降也置true，同级保留旧true

双方stress0、timer0，HP分别为1000、751，初始等级为 `[3,0]`、标志为 `[false,true]`；两份 draws 为空。两次都无人进入，也都没有胜者。

崩坏同步时，队伍0计算等级0，与旧3不同，故下降到0并把flag设true。队伍1因249/250截断为0，与旧等级相同，保留其旧true。结果等级 `[0,0]`、标志 `[true,true]`，来源返回的OR为true；这不意味着本次两方都发生了等级变化。若队伍1旧flag为false，同级时则继续为false。

该例有意使用未同步的输入崩坏等级。它解释检查点合同，不冒充真实一局中发生过的回血或历史。没有实际进入时，初始 inactive combo 的合法旧 attacker/counter也原样保留。

## 8. 组合审计与旧接口隔离

成功结果包含 `characters`、`combo`、`winner`、`crumbledLevels`、`crumbled`、`outcome` 和 `receipt`。receipt 保存完整 `before`/`after`、实际发生的一或两次 `passes`、`winnerChecks`、`crumbleResult`、`drawAudit` 和固定政策/证据；每次经过保留完整 PR115 `entryReceipt`，以及真实调用时的完整 PR116 `comboReceipt`。

未调用 combo 时 `comboReceipt=null`；真实零击 combo 则有 receipt。首次终局时只有第一次经过和第一次胜负检查，`crumbleResult=null`，不能伪造第二次进入、零消费的第二次 combo 或崩坏记录。第二次到达时，第二次经过后的快照包含崩坏和该次胜负检查结果，精确字段见 [API](../engine/debate-anger-phase-v1.md)。

子核收据保留其各自的 profile、policy、evidence，不把旧profile重标为phase。PR116 `originalSlot` 仍是那一次连打开始时的局部槽身份，不因此升级成跨进入、跨补牌或跨session的 occurrence 标识。新组合记录说明调用顺序和输入承接，不冒充原生 ABI、源日志或逐帧动画事件。

本批只增加独立组合入口，不改 [PR115](https://github.com/DanielMax937/sanguozhi/pull/115) 与 [PR116](https://github.com/DanielMax937/sanguozhi/pull/116) 的源码和公开合同，也不把它们强行变成可变 session。既有九个 session profile、正常态共享 combat helper、保存tag、固定政策、DTO、命令、receipt、load/replay 和 `angerTimer:0` 支持域保持不变。PR114 regenerated profile 的非终局 `unsupported-anger-trigger` 整轮拒绝继续保留，不能用本核存在为理由绕过或直接改写旧存档。

## 9. 明确保留的开放项与未运行声明

尚未接入：`CanCritical`、Critical/Closing/TurnEnd 实际路由与调用，TurnEnd timer衰减，其他性格的一般选牌/伤害/再考规则，冷静大牌覆写，刚胆补牌后无话题取消timer，完整回合额外牌耗后的补牌/再生及occurrence身份，完整随机流，交互式阶段存档与load/replay，人物智力/行为/书籍/物品解析，非恒等hook，开局可达性、教程、追击/留情、事件结果覆写与campaign后果。

P078/native人员任务及全部依赖、俘虏/处斩/归属、return/mission与外交自动结算均排除。原43证据主题和45历史快照不会因这个现代参考组合核而清零；原生完整链、stock/PK/Vanilla等价和完整舌战仍开放。

本批仅静态源码/文档阅读、文本编写和纸面推导。未运行测试、typecheck、编译器、build、validator、checker、诊断器、项目、候选核、来源、场景、例子或replay。纸面预期不是运行通过或运行等价证据；本页不自行声称已发布、已合并或已完成原生认证。
