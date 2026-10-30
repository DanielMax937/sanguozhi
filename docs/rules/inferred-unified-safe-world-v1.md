# 有限合成城市/旅行/战术场协调 v1

## 实际连接与不冒称连接

这是显式opt-in的固定部署演练，复用 `inferred-shared-world-clock.ts` 的城市/旅行唯一旬钟和 `inferred-unified-field.ts` 的唯一战术roster。不是把多个可花余额塞入数组：同一个部署人员ID同时引用城市固定资料和战术单位，但**行动、气力、战术兵数、混乱只由field roster负责**；城市侧该人员完全禁止参加动作、生产预约或领取本会话普通动作奖励。非部署人员继续由原城市服务负责。一个WorldTick原子推进城市、旅行与战术场。

既有城市/旅行模块实际读取基线 `334ec4f2`，`inferred-shared-world-clock.ts` blob `4aff303139218a5ea2d6be294486e38cbc9a8d6d`，`bounded-city-piece-clock.ts` blob `d1d96029223ffe6162b393f3cbd040fcf82bd822`。新field模块是本批前置候选，不将本地源文件当已发布；发布以其固定审阅/PR记录为准。此处没有新增原版资料或实验。

此有限合同的下列选择均为具名推断：固定部署、每一世界旬映射一次field tick、城市/战术兵初值显式分配、无跨域动态转账。真实人物的出征、移城、回城、任免、归属、死亡/伤病均未实现且不借此接入。

## Genesis 与身份唯一负责者

`createInferredUnifiedSafeWorld(cityName, cityScenario, travelScenario, fieldCells, fieldInitial, troopsBudget)`：

1. 先调用既有城市旅行create，沿用其全policy/catalog验证、同年1月1日turn0、严格synthetic身份及城市名绑定。
2. 调用field create，沿用其1..8 actors、正兵、气力、固定能力/技能资格、cell、预算等验证。
3. **全部field actor.id必须恰等于一个city officer.id**，intelligence必须等于该officer固定智力；不支持alias。此关系是本演练固定部署表，不能运行中加人/删人/换部署。部署人员原city.initial.actedTurn须null；旧城市初值没有活动生产job。
4. 城市source facts中的cityId视为此合成映射的固定home记录，不据它推断仍可在城行动。city.available与field.available不是互相复制的两次行动资格；城市调用的人员门禁具有优先权，field资格继续按field固定配置。field skills/immune等仍是显式演练数据，不伪称由原city.skillIds自动换算。
5. 每个部署actor的城市progress（xp/merit/acted/reservation）每步都必须保持创世值/无预约；城市侧不消费其行动。静态读取旧 `advanceShared` 确认仅恢复AP并推进已有生产job，未全员清acted、被动增长智力或执行季度人物结算。因此禁止部署actor进入新job后，普通中性WorldTick不会因全员自动重置而误报。
6. 战术cell不能与城市实体ID同名；部署actor不能与episode/force/corps/city/facility/cell同名。旅行者继续独立命名域，禁止 `traveler-${cityOfficerId}` 这种显式同名alias，**不把旅行者绑定人员**。
7. merchant.fieldUnits与hostileForceIds必须空，以免固定城市敌情影子与动态field roster误作同一世界位置；field cells没有被伪映射成城市axial地理。该限制不表示真实世界无敌军，只定义独立战术演练与城务协同范围。

`troopsBudget`必须严格等于 city.initial.troops + ΣfieldInitial.troops，所有数字来自已验证的初始子域；这是**新局已经分配后的总额声明**，不是从某既有原部队自动扣出兵力。城市兵和field兵不各自拥有同一份总额。没有动态部署、返还、增援、跨域库存转账或第二份可花field兵力快照。之后城市征兵会增加城市余额、field伤害会减少field余额，故总额不是每旬固定守恒量；输出区分initialTotal与当前city/field分量。

## 命令与原子次序

状态严格只包含schema=`inferred-unified-safe-world-v1`、cityName、cityScenario、travelScenario、fieldCells、fieldInitial、troopsBudget、commands。只存唯一初值与外层日志；不接受child state/current/余额/时钟快照作为输入。

外层命令严格 `{id,expectedRevision,action}`；ID为synthetic格式、全历史唯一、revision连续。

- `City {command}`：只允许旧ExecuteCityActions及StartPieceProduction。前者穷尽枚举Patrol/Recruit/Produce的officerIds以及BuyFood/SellFood的officerId，后者检查officerIds；额外字段、未知动作及任一部署actor引用直接拒绝，再由旧服务核完整资格/资源/参数。不能偷偷传AdvanceSharedCityTurn。
- `StartTravel {travelerId,destination}`：只路由旧旅行开始请求，不推进时间、不迁移城市武将。
- `Field {command}`：仅Cast或FireCast，字段最终交field完整校验。不能路由FieldTick或任意子域命令；field roster承接所有策略的同一兵力/气力/行动与混乱状态。
- `WorldTick {draws}`：先求旧shared AdvanceWorldTurn候选（城市普通生产完成及旅行一步），再求field FieldTick候选。全部成功且field.turn等于shared.clock.turn才提交；draws由field核完整驻留集合/顺序，无隐含RNG。日期直接取旧城市/旅行一致日期，不另算第三种日历；每个field tick对应一旬是本profile选择，不认证原战斗时序。

任何子域错误、终结伤害、预算、时钟或部署progress冲突都只返回失败，无新state；已局部计算的城市AP/生产完成/旅行进展也不发布。旧服务都是纯状态候选，不进行外部写入。调用者须原子保留/替换最外层state；不会写数据库或磁盘。

外层receipt记录日期/turn及两子域revision前后；返回shared/field各自完整已重放receipts供追踪实际费用、伤害和生产结果。返回子域只是派生读数；拆出另行操作会成为另一个独立分支，不是本协调器接受的继续历史，不能把那些结果回灌本state。

## 完整重放、容量与进度

公开read/create/execute/save/load前缀为 `InferredUnifiedSafeWorld`。每次从唯一genesis完整重放，每条内部ID由外层序号确定，不允许重放旧命令二次扣费。保存只序列化genesis+outer commands；所有派生状态/receipt不受外部快照信任。

最多32外命令；field最多32内命令、旧shared最多64，所有路由仍受子域各自时间horizon/字段/内层fire预算约束。每步为现有active生产job预留足够外层槽与field剩余槽；这只保证日志槽，不承诺未来每个Tick的火伤不会碰零值拒绝或未来输入一定满足其他约束。城市advanceLimit仍沿旧值。

本层descriptor复制限制200000节点、深64、数组10000、对象键128、累计字符串2000000；成功前对根state再过同一复制预算。每个前缀的`state+shared+field+receipts` JSON字符≤2000000−8192，为最终元数据留空；save/load均2000000字符，旧子服务自行预算。遇到预算原子失败，不交付可创建不可重读的状态。

输入只允许普通有限JSON数据，拒accessor、symbol、稀疏/额外数组字段、循环、非普通原型；Node可用时拒Proxy，其他运行时不保证反射trap无副作用。JSON采用标准last-wins重复键，不提供签名/真实历史认证；修改合法genesis构成另一演练。

## 明确保留的缺口

这不是通用全局战役：无动态出征/回城、官职工资宝物自然忠诚融合、原生地图战术坐标、原世界外交与人物归属；旅行者并非武将。部署actor同ID固定智力绑定及city动作排他是真实校验，不是把独立人物余额默认为等同。P078及依赖、Closing、真人伤亡/归属、零值终结仍完全排除，旧默认不变。

静态审阅应核：各city白名单无人可绕过部署门禁；任一子域失败整tick不提交；field未advance时city不得advance；source intelligence固定且无独立可写副本；保存重放不接受子域快照。未执行任何候选、测试、typecheck、build或示例，运行正确性未验证。
