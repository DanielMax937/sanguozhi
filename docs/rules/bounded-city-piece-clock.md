# 单城共享生产时钟 v1

`bounded-city-economy-piece-clock-v1` 在一个有限单城会话里，将巡查、征兵、数量装备生产、粮食买卖和 type5 件数生产放进同一金、粮、AP、人物进度及装备账本。只有根 `AdvanceSharedCityTurn` 推进旬并恢复 AP；一个完整 Lv1 工房同时最多承载一个生产任务。

这是独立的具名模拟 profile。它有自己的完整 genesis、状态、保存和回放协议，不升级或导入旧独立服务的 state，不把不同服务余额相加。`revision` 记录成功提交次数；它不等于 `turn`。最多推进 1–12 旬，事实在这段会话内固定，不是完整原作世界。

验证状态：本版本仅有静态实现与文本审阅；没有运行测试、示例、typecheck、编译、构建、runtime、checker 或 schema validator。以下算术及尺寸上界是规则和静态推导，不是运行输出或性能验证。

## 来源层级

- [生产价格](production-price.md)、[生产数量](production-quantity.md)、[生产耗时](production-time.md)记录原 listing 的数值投影；[旧城市命令](city-command-lifecycle.md)记录调用者的收费和完成请求
- 即时动作沿用[固定单城经济规则](bounded-city-economy.md)的数值、writer、奖励与商人政策；本页另行规定共享时钟、统一资格检查、预约和有限域
- [完整政策](../../data/policies/bounded-city-piece-clock-v1.json)、[来源记录](../../data/sources/bounded-city-piece-clock-v1.json)和[工程协议](../engine/bounded-city-piece-clock.md)分别给出固定参数、来源身份及保存/预算边界
- 原 listing 内可确认的分支、算术和调用请求属于 `source-local` 证据；有效能力、价格表、容量、外部敌情等是 supplied facts；所有组合、预约、舍入、writer、旬映射和预算均为可被其他具名版本替换的 provisional 模拟政策。当前 v1 只接受自己的完整固定政策，不允许在保存中悄悄替换参数

生产时间原体没有通用最低 1；本版 `max(1,raw)` 明确来自工程时间政策。原 caller 的输出 1、智力经验 4、功绩 100 和 AP 请求 20，不证明原生 writer、实际成长或完成调度已恢复。适配生成的 observations 不是真实原生捕获。新增共享根不会把旧证据表的 43 个主题、45 份快照及其中未闭合项清零。

## 完整场景事实

所有对象闭合、字段必填；整数必须安全且不是负零。普通 ID 为 1–64 位 ASCII，首位字母或数字，余位只能字母、数字、`_ . : -`。表内 ID 唯一；人物、设施、单位之间可以同名，不能跨表合并。

| 数据 | 本版范围 |
|---|---|
| 身份 | 一城 `kind=city`；activeForceId、city.ownerForceId、corps.forceId 相等；所有人物 forceId 相同且 cityId 为本城，所有设施也在本城 |
| 初始时钟 | year 1–9999、month 1–12、day 仅 1/11/21；turn 为非负安全整数；advanceLimit 1–12，创建时证明整段推进的 turn 和日历均可表示 |
| 人物 | 1–8 人；available 显式固定；leadership/charm/intelligence 各 0–255，politics 20–100 |
| 技能 | skillIds 为 79/80/81/82 的无重复数组；0–4 项，空数组明确表示没有这些技能 |
| 人物进度 | leadership/charm/intelligence/politics/war 五个 XP 键齐全，各 0–1e9；merit 0–1e9；初始 actedTurn 为 null 或不晚于初始 turn 的整数 |
| 设施 | 1–8 个，恰好一个 complete=true、level=1 的 workshop；其余只可 barracks/forge/stable，level 1–3，complete 显式固定；initialUsedTurn 为 null 或过去/当前 turn |
| 金、粮、AP | goldCapacity 固定 1e9；foodCapacity 0–1e9；初值在各自容量内；AP 0–255 |
| 城市 | security 0–100，troops≤troopCapacity≤1e6，morale≤moraleCap，moraleCap 20–255；初始巡查/商人 marker 显式提供 |
| 装备 | 库存键 1/2/3/4/5 全部必需，每项初始 quantity≤capacity≤1e6；初始无预约、无 job |
| 生产资料 | 五项完整价格目录，每项 basePriceWord 为 0–65535；解锁/特产是 1–5 的无重复数组，可不含 5 |
| 内政事实 | pressureActive、difficulty normal/super、controller player/ai 固定；pressure 不从商人敌情推导 |
| 商人事实 | present、uiTradePrice 3–7、完整 hostileForceIds 和 fieldUnits 显式提供；completeFieldUnits 必须 true，即使没有单位也必须提供 [] |
| 敌情 | 单位 0–16、敌对势力 0–16，各自 ID 唯一；敌对表不得包括城主；城和单位 q/r 各在 −1e6…1e6 |
| 完整政策/目录 | policy 必须与本版完整常量逐字段相同；merchantCatalog 必须是完整 12 锚点及全部字段，不能用 ID 或摘要代替 |

人物属性、身份、available、技能、设施完成度/等级、价格、解锁/特产、pressure、商人在场、相场和敌军位置在整个有限会话不变。XP 不改变有效属性。固定商人资料跨旬继续使用是 `fixed-for-entire-bounded-episode-v1` 工程政策，不表示原作商人出现、粮价或战场跨旬不变。

当前金、粮、AP、兵、气力、治安、五种库存、每个人 XP/merit/acted 与每个设施 used 都只在根 ledger 各存一份。每个库存槽另有真实 `reserved`；人物/设施有真实 `reservationJobId`。商人的 politics XP 直接对应同一人的 `xp.politics`，不存在第二份可独立修改的商人进度。

## 统一资格与先后

公共入口先做有界安全数据复制并完整重建 state，再校外层 envelope。相同 ID、完整相同 envelope（包括 expectedRevision 和数组顺序）为 duplicate；同 ID 不同内容是 `command-id-conflict`。这一检查先于 stale、历史、horizon 和命令业务资格；但不跳过数据安全和外层字段检查。新 ID 再检查 expectedRevision 和 64 条防御历史额度，然后验证完整 command/action 结构。

每个动作按以下根资格顺序检查：

1. cityId 匹配
2. 按选择顺序逐人检查存在、同城同势力、available、reservation、当旬 acted；先处理完一个人，再看下一个人
3. 有设施的动作随后检查设施存在、同城、complete、匹配 kind、reservation、当旬 used
4. 再执行相应服务规则，包括巡查城市机会、商人在场/城市机会及价格、费用等检查

因此同一个人同时 reserved 和 acted 时先报 `officer-reserved-by-job`；前一个人已 acted 仍先于后一个人的 reservation 报错。不能先跨人扫描所有锁。facility kind 错先于 facility reservation，reservation 又先于 used。Recruit 要 barracks，Produce 1–3 要 forge，Produce 4 要 stable，Start 5 要唯一 workshop。

`available`、`actedTurn` 和预约是三种不同事实。推进后 acted 变旧不能绕过仍 active 的生产锁；这项统一检查也约束买卖。它是新 profile 的首错顺序，不宣称与各旧 public API 的全部首错相同。

## 即时动作与原子 batch

`ExecuteCityActions` 包含 1–4 个有序动作。普通动作选 1–3 个不同人物，买卖选一人。先验证所有动作的完整结构，再依次对同一个私有候选计算；后一步读取前一步真实写入的金、AP、库存、XP 和机会。卖粮所得可付后续费用，前一步用过的人不能换动作再用。Start 和 Advance 都不能嵌入 batch。

任一步失败，整个 batch 的费用、金粮、兵装、XP、merit、markers、revision 和 history 均不提交。成功只产生一个根 envelope、一次 revision+1、一条完整 acceptedCommands。失败 ID 不登记。

### 巡查

每城每旬一次，收费 100 金、20 AP。令 L 为选择者统率和、O 为动作前治安：B=floor(L/28)+2；压力为真则 H=floor(B/2)，否则 H=B；核请求 `min(H,100−O)`。用 clip-and-return-actual writer 写治安，每人请求 leadership XP+2、merit+50，写 acted 和 patrolUsedTurn。

### 征兵

收费 300 金、20 AP，使用指定兵舍的等级。C 为魅力和、O 为写入前治安；任一人有技能 79 则 K=15，否则 K=10：

1. A=1000+floor((O+20)×C/20)，N=floor(A×K/10)
2. 乘所选设施的精确 binary32 F 后向零截断；super/AI 随后加倍；pressure 随后向零减半
3. 数量核结合当前兵和容量；本版非负无溢出域相当于限制到剩余容量，但这不是核全部 signed32/U32 路径的替代定义
4. troop writer 的 returned 送入治安参数核；本域治安请求为 −floor(returned/(C+100))
5. 新兵气力为 floor(O/2)。以实际入兵 a、旧兵 T、旧气力 M 算 `(T×M+a×floor(O/2))/(T+a)`；分母为 0 时用旧 M；最终 floor 后 clamp 到 20…moraleCap
6. 每人请求 charm XP+2、merit+50，写 acted 和指定兵舍 used

气力使用 actualDelta，治安核使用 returned；不能交换或将预容量数量当实收。O 始终是本动作写治安之前的值。

### 数量生产 1–4

装备必须显式解锁。价格来自对应 basePriceWord；特产为 true 时 floor(basePriceWord×8/10)，否则原价。零价合法，仍收费 20 AP。

设 I 为 intelligence 和、M 为最大值：base=(M+I+200)×5；类型 1–3 任一人有技能 80，或类型 4 任一人有技能 81，则 base 加倍；再乘 F 向零截断，最后 super/AI 加倍。多人同技能不叠加，特产不额外乘数量。将核返回写对应库存，剩余容量不足时 clip；每人请求 intelligence XP+2、merit+50，写 acted 和指定设施 used。

F 在等级 1/2/3 分别为 1、5033165/4194304、3/2，对应 `3F800000`、`3F99999A`、`3FC00000`；不以任意 JavaScript 1.2 或全城最高设施替代。满治安、满兵或满数量库存导致零收益，仍按固定 pay-zero-yield 政策收费、占机会和发饱和奖励。

### 买粮与卖粮

每城每旬买卖合计一笔，收费 20 AP，无固定金费。请求粮 Q 为 1…1e9。城市与明确敌对单位的轴距为 max(abs(dq),abs(dr),abs(dq+dr))；距离≤2 阻挡，按完整单位数组顺序报告首个 blockingUnitId；不同势力不自动敌对。

政治 20–100 的效果 N/D 使用[固定 12 锚点及未约分线性插值](bounded-city-economy.md#买粮-buyfood-与卖粮-sellfood)。u=uiTradePrice，单位粮/金：买入扣 `ceil(Q×D/(u×N))` 金，卖出得 `floor(Q×N×4/(u×D×5))` 金。用 BigInt 精确分数，保留余数、roundingDifference、方向和完整 writer。卖出 0 金拒绝，金额必须在 0…1e9。

检查顺序在根 actor gate 之后依次为商人在场/城市机会、完整敌情、AP、金额；买入先金余额再粮容量，卖出先粮余额再金容量。整单成交，无部分成交或溢出 clip。成功请求 politics XP+5、饱和 1e9，其他 XP 与 merit 保持原值。`merchantMerit='not-modeled-preserve-existing'`，旧 audit 的 merit/TP/loyalty 0 是未应用占位，不是原作奖励为零。外部商人只记互补 delta，没有可查询的余额账户。

所有普通资源 Write 保留 before/requested/returned/actualDelta/after/cap/discarded/policyId；收费使用独立 exact-affordable-debit，不能裁剪负担不起的费用；经验和功绩各自饱和到 1e9。任何即时代码只能写其白名单字段，不得改时钟、job、预约或 type5 quantity。

## type5 开工：真实三核、一次收费

`StartPieceProduction` 固定 equipmentType=5，选 1–3 人和唯一完整 Lv1 工房。它不接受调用者给出的 duration、quantity、报价、due 或成功答案。依次执行：

1. 上述根 actor/facility gate，再检查装备 5 解锁
2. 真实调用 price、quantity、time 三个既有数值核，按选择顺序提供固定能力和技能；完整保留三核输入、输出和顺序
3. 全部历史 jobs（含 completed）必须少于 12
4. 当前库存 5 的 quantity+reserved+1≤capacity，预约一单位真实容量
5. 算 dueTurn 与 dueDate，必须落在本会话剩余推进 horizon 内
6. 接受 start 后的剩余历史槽 `64−(revision+1)` 必须至少等于 duration
7. 拍摄开工前的最小事实快照，再先检查金、后检查 AP，一次扣计算价格和 20 AP
8. 建立 job、人物/工房双向锁和库存 reserved=1；所选人 acted、工房 used 写当前 turn；一次原子提交

价格同前，basePriceWord=0 或折后 0 都合法，无最低 1 金。quantity 核独立返回 1，不能省掉这个核或伪造数量生产的 slots/factor/difficulty。

type5 时间设 I 为所选 intelligence 和、M 为最大值，`q=trunc(max(24,M+I−200)/24)`，减半前值 `10−q`。任一选择者有技能 82，最后向零除以 2；不用 floor 处理负数。三槽依序 validity，再对存在者读取 intelligence/skill，最多 9 captures；不生成船路径的六项观测，facilityApplied=false。设施等级、pressure、super/AI 不乘时间。

本域 I≤765、M≤255，rawX 为 −200…820，q 为 1…34，signed raw time 为 −24…9。原值及 rawEaxU32 都留在审计；调度只取 `duration=max(1,raw)`，得到 1–9 个服务旬，不回写覆盖 raw。

job ID 是 `job:` 加原 envelope ID，不截断；startTurn/date 为当前根时钟，dueTurn=startTurn+duration，dueDate 是当前日期推进 duration 次。开工不增加实际库存，不发 XP/merit，也不推进时钟。任何后续拒绝都没有半个 job、锁或扣费留下。

## 唯一旬推进与到期完成

`AdvanceSharedCityTurn` 在 advancedCount 达到 advanceLimit 时拒绝。每次合法推进按以下顺序进行，同一候选全部成功才提交：

1. 日期 1→11→21→下月 1，12 月之后进下一年；turn+1，advancedCount+1。这是模拟旬边界，不转换成真实日数
2. 根恰好一次恢复 AP：请求 +20、cap=255、actual=min(20,255−oldAP)，保留完整 Write 和固定 recovery policy ID；封顶损失不补回
3. 至多一个 active job 的 remainingTurns 减 1，记录 progress。仍大于 0 就继续预约，没有完成奖励
4. 到 0 时，以当前库存和按 job.officerIds 顺序取出的当前 XP/merit 调用完成 planner；库存请求 +1，实际必须 +1
5. 每个参与者请求 intelligence XP+4、merit+100，独立饱和到 1e9；写库存 quantity+1、reserved−1，释放全部参与者和工房的锁
6. 参与者 actedTurn 写新 turn；工房 usedTurn 保留开工时的原值；job 标记 completed、remaining=0、completedTurn=dueTurn，保存完整 completion

完成不再次扣金或生产 AP；不能用 startSnapshot 的旧 XP 替代当前进度。XP/merit 已满时仍合法完成，只是实际奖励可能为 0。completed job 不删除、不复活、不再完成。

不全局清空 acted、patrolUsedTurn、merchantUsedTurn 或 facility.usedTurn。旧 marker 与新 turn 比较自然过期；完成者在完成当旬又被标记 acted，必须再等一旬。其他合格空闲人物在完成当旬可使用已释放的工房，仍须通过自己全部资格、费用、容量和 horizon 检查。

## 双向锁与完成保证

每个合法状态都有以下关系：

- active job 至多一项；其人物和唯一工房全部指向该 job，反方向每个非 null 锁都必须属于该 active job；非参与者和非工房不能悬挂锁
- 库存 1–4 的 reserved 恒为 0，库存 5 的 reserved 等于 active 数（0 或 1）；每槽 quantity+reserved≤capacity
- jobs 与完整历史 Start 一一对应且保持接受顺序；active.remaining=dueTurn−current.turn>0，completed.remaining=0，完成记录逐字段可重算
- 当前时钟精确等于 genesis 推进 advancedCount 次；所有 marker≤current.turn；`64−revision≥active.remainingTurns`

接受 start 之前已经保留到期 horizon、真实库存空间和历史槽。此后从任一合法 active state 连续提交 remainingTurns 个新 ID、正确 revision 的 Advance，能在该有限模型内完成；无需再次用 acted 或商人资格否决完成。该结论也涵盖最后 completion 审计增长及全部保存/duplicate 包的静态预算，详见工程文档。

AP 总量还给出更强上界：每个成功即时步骤或 Start 都耗 20，初始 AP≤255，最多 12 次每次恢复≤20，所以成功非 tick 步骤合计最多 floor((255+240)/20)=24；接受根命令最多 24+12=36。即使再预留最多 9 个完成 tick，36+9=45<64。64 是防御额度，不能把正常运行描述成会用尽 64 条历史并锁死任务。

## 保存、查询与明确未建模范围

保存保留完整 genesis、完整政策/目录、所有 envelopes、完整 receipts/三核/Write、当前时钟/账本、全部 jobs 与 completion。load 从空 job/空锁初态逐条重新执行并比较每份完整 receipt 和最终 state；摘要只作绑定，不代替重算，也不是签名认证。

legal 页只列给定选人/粮量探针的候选；每项从同一个 base 独立预览，不代表这些动作能连成 batch。任何新成功提交令旧 cursor 失效；duplicate 和失败不改变 state。没有本 profile 的 CLI、自动 tick 或后台进程。

未建模：收入、工资、耗粮、季节/丰作、设施施工或 HP、能力成长、完整 TP、商人功绩/忠诚、其他 piece 类型、多个工房、并行生产。没有取消、返还、强制完成、人员迁移、出征回程、capture/death/inheritance/ownership 交易或 native task set/clear/cancel/finalizer。这里的 job 只是根账本预约，不是原生人员任务。仍不建立 clean-stock 可执行体身份、原生 helper/ABI、原生 writer/成长、真实耗时单位、跨版本等价或完整可玩世界的结论。
