# 合成城市/旅行统一旬钟 v1

本模块 `inferred-shared-world-clock.ts` 把两个**已有可执行服务**放进同一个显式世界命令封套，不重写收入、工资、生产或旅行算式：

- `bounded-city-piece-clock.ts` 已有单城统一旬钟、金粮/AP/兵力/生产库存账本、普通内政/买卖和 type-5 生产预约与完成。
- `inferred-travel-world.ts` 已有城市邻接旅行、每边十天的明确推断、合成 traveler 状态。

这是新具名工程整合，不是原生调度器证据；没有原作历史剧本、地图认证或真实人物数据。原服务的源证据、已知规则和推断身份完全保留。该城市服务的生产完成是其既有普通生命周期，不是被排除的 Closing 奖励/受伤/世界终结。

## 实际创世与身份

`createInferredSharedWorldClock(cityName, cityScenario, travelScenario)` 接收完整原城市/旅行创世参数，分别调用旧创建入口严格验证。cityName必须是现有城市图中的名称；它明确绑定这个合成城市ID与图城市名，不推断真实坐标/势力归属。

只允许双方从同年1月1日、turn0起步。城市episode/force/corps/city/officer/facility/显式敌对单位ID全部必须是 `synthetic-[a-z0-9-]{1,48}`；原城市validator继续验证全部force/city/corps引用、资源与政策合法性；本城市服务不提供月度工资结算，不能宣称覆盖。旅行ID必须是 `traveler-synthetic-[a-z0-9-]{1,40}`，且遵循旧唯一合成traveler合同。它们**不映射城市officer**，旅行到达不改变城市人员所属/可用性，也不把同字符串自动视为同实体。

创世只接受scenario，不接受已有城市或旅行快照，也不迁移旧存档；避免偷偷将不同历史/日期拼接。两份完整正规化genesis和外层命令是唯一保存来源。

## 外层命令和真实时钟推进

每条严格包含id（合成ID）、expectedRevision及action，最多64条成功命令。外层ID唯一，revision连续；重复ID拒绝，不会重放一遍费用或旅行。内部命令ID由外层序号产生 `world-N`，调用方不能注入内部revision/ID。

- `City`：command只允许旧 `ExecuteCityActions` 或 `StartPieceProduction`，随后由旧服务完整校验及执行。不能通过此路由偷传 `AdvanceSharedCityTurn`。
- `StartTravel`：显式 travelerId、destination，复用旧旅行start及路径资格；不推进日期。
- `AdvanceWorldTurn`：先计算旧城市 `AdvanceSharedCityTurn`，再计算旅行 `AdvanceTravelTurn`。**两个服务都成功，且实际输出turn/date仍相同才提交两份新状态**。任何一方失败整条外层失败，没有部分新状态/回执可提交；旧服务都不改输入，无真实外部写入需要补偿。

日期使用两服务已有真实日历推进（1→11→21→下月1），不手算覆盖它们的输出。每次比较year/month/day和turn防漂移。城市非推进动作与旅行start也经过这个一致性检查。共享的是**这两片段的旬钟**；字段明确 `sharedClockEstablished:true`，同时 `travelerOfficerIdentityShared:false`、`sharedFieldResourceLedger:false`。不会声称整个游戏、地图、策略、薪资或真实人员已经融合。

成功回执保留日期/旬数前后及两个旧服务实际回执。普通城市费用、人员行动标记、预约、完成结果都沿旧服务，外层不重复收费/派奖。未来城市生产尚有剩余旬数时，外层也预留至少其最大剩余旬数的64条历史空间，防旅行start耗尽外层历史使已承诺生产无法推进。旧城市自己的预约/历史/advanceLimit门仍生效。

## 全重放与预算

state严格只有schema、cityName、cityScenario、travelScenario、commands，不信任外部city/travel快照或回执。read/execute/save/load都从两个genesis完整重放所有外层命令；两个服务再各自核其完整历史。返回city/travel/current clock和回执只是派生视图。

普通输入经有界descriptor复制，拒绝accessor/symbol/自定义原型/循环/稀疏数组/额外数组字段；20万节点、深64、累计字符串200万字符、单数组10000项。Node支持时拒Proxy，其他运行时只接受可信普通数据，不能保证Proxy反射trap无副作用。公共入口捕获异常为失败。

保存/加载上限200万JSON字符；每个历史前缀及最终包装同时核完整派生city/travel/receipts的预算并留4096字符固定包装余量。成功state保存只含genesis和命令，可按同一预算重新加载；不是哈希摘要代替历史。标准JSON.parse重复键last-wins，不是原字节签名或防作弊。预算失败不发布部分state。

## 未连接与明确排除

未自动把旅行实体绑定城市武将，未整合野外粮食/损耗/策略时钟、地图位置、全局AI或历史事件。P078及依赖、Closing奖励/受伤/世界写入、真实人物归属/伤亡、零值占领/毁坏/释放终结均无新增路径。原默认service/policy/保存不改；没有任意callback执行器或新双建设模式。

本次闭合的是可保存的明确合成城市+旅行同旬时钟和原子命令路由，不叫全世界缺口清空。纯静态审阅；没有执行测试、typecheck、build或候选代码，运行验收仍待允许后完成。

## 有限演练窗口与运行依赖

旧城市piece-clock的推进窗口最多12旬，本外壳沿用该上限；旅行可以比剩余窗口长，因此不保证每次发起的长途旅行都能在本演练内抵达。只预留旧城市生产完成的历史槽，不伪称预留旅行的无限完成时间。耗尽窗口会明确拒绝后续Tick，而不是悄悄跳过城市或继续单边旅行。底层城市实现依赖Node crypto；其他运行环境可用性未验证，不称浏览器通用运行已验收。
