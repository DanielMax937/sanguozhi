# T28：可选合成宝物授予账本 v1

`inferred-treasure-ledger.ts` 消费已有 `projectInferredTreasureLoyalty`，公式及证据见 [独立规划](inferred-independent-planning-v1.md)：真忠诚加物品价值，封顶255；显示忠诚封顶100；普通授予请求AP10、金0。原证据仍为empirical candidate，不宣称原始opcode、身份资格、完整原世界规则已恢复。新账本结构与合成ID都是工程设计。

## 实际写集，不是只加忠诚

创建入口 `createInferredTreasureLedger(initialAP, initialOfficers, initialItems)`：

- AP为0..1000000；人员和物品各1..64条；所有ID须为 `synthetic-[a-z0-9-]{1,48}` 且各自集合内唯一。
- 人员只含id与真忠诚1..255，没有真实武将ID/势力/归属/所在地。
- 物品只含id、value0..255、holder（null表示合成府库，否则必须是已存在合成人员ID）。物品不会新生成/删除/复制；价值是初始场景明确输入，非历史宝物catalog。

`executeInferredTreasureGrant(state, command)` 严格接受id、expectedRevision、itemId、officerId、eligibilityConfirmed:true。普通授予资格由调用方明示，本模块不推断原作人物资格。最大64次成功命令。目标与物品必须存在，物品必须在府库，AP足够10；已持有人物品拒绝，不能换个命令ID重复领取，也不能以此夺取/没收他人物品。

全部前置验证通过后，一次事务同时把该物品holder由null改为目标synthetic人员、增加该人忠诚至255以内、扣AP10并写回执。即使价值0或已满忠诚，仍按明确普通授予合同转交物品并花10AP，实际增益可0；无额外金钱扣费。未改变真实人物势力或归属。失败不提交任何局部物品/忠诚/AP变化，输入不被修改。请求费用只在本账本扣一次，不再次叠加T16总表收费。

## 重放、保存与不支持项

状态严格只有schema、initialAP、initialOfficers、initialItems、commands。每次read/execute/save/load均完整重放，返回冻结的余额/持有/忠诚/逐条回执；不接受外部余额快照。命令ID唯一、revision连续；保存只写初值和命令。JSON文本限10万字符，标准JSON.parse重复键last-wins，不承诺字节唯一/签名/防作弊。改写合法初值代表另一合成场景，不可当原历史认证。

普通输入经有界descriptor复制，拒绝accessor/symbol/循环/稀疏/自定义原型等；异常失败返回。Node支持时拒绝Proxy，其他runtime不能保证Proxy反射trap无副作用，因此只接受可信普通数据，不接可执行对象。

未实现没收、装备加成、物品流转市场、自动分配、真实人物忠诚/归属、战役资源/时钟/Closing写入；不触P078及依赖。没有迁移旧存档/修改旧默认，也没有给原世界凭空加宝物。这一批闭合的是显式合成库存授予原子事务，不把它叫原作全局世界集成。

## 静态验收

核物品守恒/唯一持有、已授予不能重复、AP与忠诚/物品同时提交、满忠诚与零价值边界、revision/id/资格门、保存完整重放、旧模块零修改。未执行候选、测试、typecheck或build；仅静态审阅，不代表运行验收通过。
