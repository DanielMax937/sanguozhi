# 同一资源 owner 的动态部署 / 返回与唯一旬推进 v2

## 资料与范围

本版本叠加 `inferred-unified-resource-world-v1.md` 的唯一城市库存、工资/宝物忠诚、运输账本与完整历史。保留 v1 和所有旧默认接口；新增 `bounded-synthetic-dynamic-timeline-v2` 与 `inferred-dynamic-resource-world-v2`，不把旧档任意迁移为新档。

气力语义沿现有 `docs/engine/food-supply-lifecycle.md`：来源气力不扣减，目标按兵数加权；气力不是可守恒库存。`docs/rules/06-strategy.md` 对气力开销的资料沿 dynamic-field v2。Deploy 继承城 morale 作为 field energy；Return 用 BigInt 加权再 floor，是具名兼容选择，不宣称原作出入城取整已经核实。没有新增 energyReserve、可兑换能量池、用户指定气力信用。

这是固定同势力、同城、合成人物的角色/兵配额切换，不是人物所有权变更、死亡、部队归零终结、奖励或 Closing/P078。原生地形、跨城移动、真实人物迁移未由该版本实现。

## 唯一根与入口

`createInferredDynamicResourceWorld(cityName,cityScenario,travelScenario,fieldCells,fieldTemplates,troopsBudget,resourceConfig,transportInitial)`。

动态 field 模板全部初始 resident。模板 ID 必须是当前城市 officer ID，intelligence 和 available 与城市固定 facts 精确相同。固定 entryCellId 必须存在；细胞 ID 不得混成城市实体、武将、transport、宝物。所有身份 synthetic；不使用 merchant 的敌情/fieldUnits 静态影子。旅行者继续独立 traveler 名字空间，不伪称同一武将旅行已融合。

city/field 由 **同一 bounded 私有 timeline** 从唯一初值及所有命令完整重演。field 返回的 proposal 永远只从本次内部权威状态生成，不能从外部提交 credit/delta。对外 state 只含初值+日志，current、角色、火、工资、忠诚都为派生值，不接受快照覆盖。city private transition 保留原 jobs、预约、startSnapshot、已付 fees、完成历史；不重建 genesis、不丢掉已经启动的工作。

初始 troopsBudget 仅为城兵+运输兵（居民没有独立兵/气力余额）。后续征兵可增总兵、火伤/计略可减兵，不强制运行总兵等于创世总额。每次 Deploy/Return 自身严格借贷相等，不能用创世预算伪证运行守恒。

## 显式命令

外层 `{id,expectedRevision,action}`，除 v1 的 City/Resource/Field/StartTravel/WorldTick 外新增：

- `{kind:'Deploy',actorId,troops}`：没有 caller energy、cellId、owner、任意效果字段。
- `{kind:'Return',actorId}`：没有 caller troop amount/energy，必须全部返回当前内部正兵和当前气力。

Deploy 复用现有 T16 `projectInferredCommandAP('deploy',false)`，从唯一城市 AP 扣20，收据保留原请求、实际前后余额和 no-office 标记。已回读 main 42dd88e2 的 `inferred-independent-planning.ts`（blob 4a17282ff7411c801314c8fcf4d5e97288523d5b）：基数20为 `inferred-base`，军事府减半门为已有规则；本有限 profile 没有军事府输入，因此明确无折扣，而非凭空享有减免。费用不足或其他失败全部拒绝。

Return 不等同 T16 的 moveOfficer/summonOfficer，不擅套其20 AP；当前 Return 为具名无额外 AP 政策，仅锁行动和回收现兵/加权气力，不额外扣金粮或授奖励。这不是“原作回城免费”的证据。

Deploy 要求当前 resident，城市 officer available、无生产预约、当前旬未行动；数量 1..60000，扣后城市仍有正兵，城市 morale<=100。仅在该模板固定 entryCellId 部署；该点已有部署者或火则保守拒绝，不允许任意地点出生。内部执行 field Deploy，继承城当前气力，扣同一 city troop owner，城市 actedTurn=当前 turn，同时 field acted=true。因此不能出城立即再施计。

Return 要求当前 deployed、field 未行动、无混乱、仍在固定 entry、城市身份仍未预约/未当旬行动。目的城容量足够后一次归还所有现兵，城新气力=`floor((旧城兵*旧城气力 + 返回现兵*当前field气力)/(旧城兵+返回现兵))`。field 变 resident 且不再携带可花兵/气力，city actedTurn=当前旬；不是先把兵写成0再调用终结器，不删除人物，气力为0本身仍合法。Return 后不能立即再城务或重新 Deploy。

城务在解析旧 whitelist 后逐 actor 检查，deployed 不能执行 Patrol/Recruit/Produce/BuyFood/SellFood/StartPieceProduction。宝物 recipient/current holder 同样禁止 deployed、预约及当旬已城行动；宝物本身按 v1 只花 AP，不追加受领者 acted。居民城务后 Deploy 通过同一 city acted marker 被拒，field resident marker 不是第二套可花城行动许可。

## 单旬原子结算

只有 WorldTick：同一个 timeline 先旧 city advance（AP/普通生产完成）、月工资、自然季度忠诚，再 field FieldTick；外层再旅行同旬推进。所有子操作均是候选计算，全成功、日期/turn一致、总预算和生产完工槽验证后才返回新状态。任一火伤归零、忠诚归零、任一容量/命令/预算失败，整条不返回半提交结果。

resident 无 field 兵，不受驻留火伤；所有角色每 Tick 正常恢复 field acted，city 历史 actedTurn 沿旧时间门比较不重写旧史。field 的火剩余寿命、已使用 fire ID、RNG样本、历史预算不因 Return/Deploy 清空；无 deployed 也可空 draws 推进火寿命，不伪造单位。Field 路由只开放 Cast/FireCast，不允许外层私自 FieldTick/Deploy 伪造气力。City 路由不开放单独 Advance。

metadata 自然忠诚仍全合成固定名单（含部署者），唯一 AP/gold/loyalty owner 不分叉。v1 转运的 5 槽适配与后7槽硬零、reserved保护、不支持城市 morale>100的明确限制继续有效。即使 transportInitial 为空，城市初兵也必须>0（createSyntheticCityTransports 的正值域）；这是新增 opt-in 约束，不是旧默认城市兼容承诺。

## 完整重放与静态验收

外层和 city timeline 32条，field32条，旧 city 64条；对活动 job 每次预留未来必须的 Tick 槽（world、citytimeline、field），不把桥命令当免费无限历史。日期、同一人物角色、兵/气力、acted、预约、所有收据都由同一日志重算。新 schema 不能载入旧默认 save；派生 field proposal 被单独分支运行不构成本 world 的余额证明。

新增 read/create/execute/save/loadInferredDynamicResourceWorld；city timeline 新增 read/create/executeBoundedSyntheticDynamicTimeline。world 输出动态部署支持 true，仅证明上述有限桥，nativeCampaignEquivalent/realPeopleWritten 仍 false。

独立静态审查应逐条核：城务后出征拒绝；出征后施计/城务拒绝；旬后可施计；火伤后返回量为当前值；返回后城务/再部署拒绝；第二次旬后可再部署但不恢复初始兵气；预约者不能切角色；任一失败保持原日志；工资/宝物/转运后普通 city 和下一 Tick 读取同一余额；活动生产始终保留并只完成一次。

全部为静态候选，未执行测试、typecheck、build 或产品代码；须与资源 v1 helpers、dynamic-field v2、最终 bounded/source 完整固定 hash 一起独审。不能沿用子模块 PASS 代替跨域守恒与历史一致性审查。
