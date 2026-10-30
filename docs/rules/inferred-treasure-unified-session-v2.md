# T28 v2：同一外层 journal 的授予、没收、自然忠诚与装备视图

新增 `inferred-treasure-unified-session-v2`，不覆盖 [固定快照v1](inferred-treasure-turn-projection-v1.md)。v1仍只支持固定库存后的自然推进；v2在一个新的明确合成session内支持授予/没收与自然旬推进交错。不是旧存档的静默升级，也不是全局战役。

## 一个当前状态来源

外层保存严格只有schema、initialSession和commands。initialSession必须是v1验证通过且**自然commands为空**的初值，内含完整授予/没收旧历史、绑定日期/名单/忠诚/AP、来源映射与显式bonus配置；不允许把已演进v1当前余额直接当新初值绕过历史。

当前 `officers, items, actionPoints, date, rng` 全部从同一外层genesis+journal按顺序推导。对外余额/投影/回执只是派生读视图，不可作为输入替代history。初值中的旧库存是历史证据，不是另一份可继续花的当前余额。

## 三种命令与内部服务复用

`executeInferredUnifiedTreasureCommand(state, command)`：

- `{id,expectedRevision,type:'Grant',itemId,officerId,eligibilityConfirmed:true}`：以**当时派生**AP/物品/忠诚创建一次内部 `createInferredTreasureLedger`，调用旧 `executeInferredTreasureGrant`。府库检查、忠诚增益/封顶、AP10与物品转交由旧服务原子执行。
- `{id,expectedRevision,type:'Confiscate',itemId,eligibilityConfirmed:true}`：以当前派生状态创建一次内部treasure，再创建旧confiscation continuation并执行一次没收。既有价值量减忠诚/零值拒绝/AP推断沿旧具名policy；不复用历史初值重新花钱。
- `{id,expectedRevision,type:'Advance'}`：调用一次旧 `AdvancePersonnelTurn`，只让自然服务决定日期、季度候选、关系/技能门、随机数和正值变化；不开放CashReward或额外外部delta。

所有命令全局ID唯一、revision连续，最多128次（合计）。相同ID重复也拒绝；失败不留命令、不扣AP、不改持有、日期或RNG。授予/没收可在同一旬多次发生，受AP和实际持有门约束；它们不推进日期、不消耗自然RNG。没有偷偷补AP或加物品。

每个内部交易使用自己的revision0/临时genesis，是服务组合适配，不修改或重写任何已存在旧journal；外层始终从原始genesis重新派生这些边界。内部临时状态不作为第二份持久当前账本返回，回执保留其算术证据。

## 自然旬调度连续性

内部personnel的静态关系、性格、技能、势力/城市范围、政策来自原绑定scenario。每Advance只把**当前日期、当前忠诚、当前AP及上次RNG state**注入一旬临时scenario：`advanceLimit:1`，初始日期仍已结算。执行后外层记录新日期，advanceCount加1，且总advanceCount不能超过原scenario.advanceLimit。

季度入口由旧服务的真实日历推进到1/4/7/10月1日判定；不是每旬固定掉忠。相同旧日不重复结算，也不因为授予/没收而回退到原始日期。所用旧自然分支的数值不依赖累计turn；turn相关现金奖励/赞赏命令没有开放。初始praised标记仅在第一次advance之前保留，此后不再影响本范围。

RNG只以上一次非零xorshift32状态续接，不每次重置原seed。临时receipt的局部drawIndex从1开始，外层额外输出globalDraws并叠加之前的总drawCount；内部receipt原样保留，不把局部turn/revision伪称全局编号。creation不抽签。这个连续流仍是旧服务明确的合成local RNG，不是原游戏全局随机源。

旧自然结果任一忠诚为0则整条外层命令拒绝，之前的当前状态不提交任何变化；不夹到1，不触发离反/归属/人物终结。并核自然分支金必须仍0、AP不变；出现意外资源写入则拒绝，而非丢弃或偷同步。

## 装备视图始终取当前持有

每次派生完成后按**当前items.holder**重新计算v1同名 `explicit-max-per-stat-cap255-view-v1`：五维只读取初始baseStats，各项bonus取当前持有物品显式inferredBonuses最大值，不累计进永久基础属性。没收后加成立即消失、再授予后出现在新的持有人视图，不沿用旧快照holder。

资料sourceIndex/条目value绑定沿v1；source effect只是定性展示，不执行单挑、舌战、撤退、奖励或技能。numeric bonus全部具名推断，不把value变为属性数值。真实资料/未知caller局限见v1及既有自然忠诚规则，不升级证据。

## 保存与边界

create/read/execute/save/load都验证v1初始绑定并完整重放outer journal。保存只存初始session和命令，不存可篡改当前快照；全序列可以追溯授予→季度自然下降→没收→再授予的真实执行顺序。JSON最大200万字符，普通descriptor复制/Proxy运行时边界同v1；标准JSON.parse重复键last-wins，不提供签名或防作弊认证。

旧treasure、confiscation、personnel存档和接口完全不变。外部继续调用独立旧账本会形成另一条分支，不能绕过v2 outer journal当作同一余额。v2不自动迁移已推进v1历史，也没有跨会话导入当前余额命令。

这是明确合成单城名册/物品的组合服务，不是原生武将或全局campaign。无新玩法，无P078及依赖、Closing、真实人物归属、伤亡、零值终结；所有人物/力/城市ID仍合成，物品集合固定，永久属性不改。

仅静态审阅；未执行候选、tests、typecheck、build或重放。连续性依据旧函数控制流静态分析，非运行实验认证。
