# 合成统一资源 owner：城市、工资、宝物、转运与唯一 WorldTick

## 为什么必须有新 timeline

本模块针对旧城市生产job/预约/历史不能被外层改余额或重设genesis的问题，新增 `bounded-synthetic-resource-timeline-v1` 和 `inferred-unified-resource-world-v1`。**不修改旧默认命令、旧schema、旧load/read规则**。

城市源码 `bounded-city-piece-clock.ts` 新增的timeline从唯一cityScenario创世重演全部外层命令。普通城务调用同文件private `transitionValidatedRoot`，保留current、jobs、reservation、startSnapshot、fees、dueDate与历史receipt；资源桥从同一个current.ledger读金粮/AP/兵/气力/装备，并只按固定单笔事务写回。没有rebase cityScenario，没有擦除已发生费用或活动生产，也没有公开“可信补丁token”。

内部legacy State只在本次完整重演中存在。桥之后它不是可当旧档load的合法历史；新接口**不导出该tag/State**，只导出新timeline的genesis+统一commands，以及派生current/metadata/transports/receipts。旧公共入口仍从其旧genesis+旧命令重新核算，不能装入新桥状态。当前值范围检查不是来源证明，来源由完整外层日志重演提供。

## 单一资源负责者

- 城市唯一金/AP/food/troops/morale/inventory：`current.ledger`。宝物或工资没有第二份可花city AP/gold。
- 人物唯一当前忠诚、工资数、宝物持有、自然忠诚RNG：`metadata`；不把忠诚硬塞旧officer XP/基础能力。
- transport唯一库存：metadata并列transport accounts，**不重复城市库存**；转账一次同时改城市与transport。
- field仍由单一roster拥有战术兵/气力/acted/confused；固定部署identity与城市动作排他沿前一统一world合同。
- treasury、confiscation、capacity-transfer、personnel服务在每次事务内从当前权威值投影，执行单笔，然后被丢弃。其临时state不是另一个持续余额；只有最外层完整journal可以继续。

初始`troopsBudget = 城兵 + field兵 + Σtransport兵`，是合成新局已分配总额声明；不从真实部队自动出征。资源Config中声明的初始treasury与personnel是新局事实，不能把它称原世界历史认证。之后城征兵、火伤与转运按各自实际规则改变或守恒对应分量，不要求总兵永远固定。

## 创世合同

`createInferredUnifiedResourceWorld(cityName, cityScenario, travelScenario, fieldCells, fieldInitial, troopsBudget, resourceConfig, transportInitial)`。

原城市旅行创世验证、同年1/1/turn0、固定同ID部署智力绑定、city动作门禁、禁止merchant敌情影子、field与city实体碰撞、旅行者不映射武将等保持。新局开启资源桥必须显式提供：

```
resourceConfig = {
  initialConfiscation, // 旧confiscation可验证初始合成声明
  personnelScenario,  // 旧自然忠诚完整固定facts/policies/seed
  salaries: [{officerId,salary}]
}
```

两份输入名册均恰等于cityScenario.officers ID集合；force/city/date/初忠/AP精确绑定，初忠严格1..255。personnelScenario的gold须0（它不是城市金的第二余额），AP须等于城市初AP；后续投影永远从当前城市AP取值。salary0..1000000、固定完整名单；自然ruler也必须synthetic，关系/特技/性格沿旧personnel验证。metadata只保存固定facts和唯一loyalty/RNG/date，无当前城市金/AP副本。人物、设施、transport、宝物对象ID不得碰撞已有城市实体。

`transportInitial`允许0..8个同city force的synthetic transport，严格沿T20账户/已知60000兵、100000金、500000粮上限；初兵为正，morale0..100。城市morale也须≤100才能使用此版本，较高值拒绝而非截断。旧城市可接受的其他场景不因此改变默认行为。

## 三类显式桥命令

外层world命令仍 `{id,expectedRevision,action}`，新增：

```
{kind:'Resource', command:{kind:'Grant',itemId,officerId}}
{kind:'Resource', command:{kind:'Confiscate',itemId}}
{kind:'Resource', command:{kind:'Transfer',transportId,direction,amounts}}
```

没有任意资源delta、未来余额、调用者指定成功/扣费/随机结果、callback、重写genesis入口。每条占用日志槽。

### 宝物

Grant/Confiscate复用已合并旧单笔宝物事务：AP10从同一城市扣，持有与忠诚写回唯一metadata；没收后归零忠诚拒绝整单。当前受赠/被没收者必须为本城固定名单、available、未被生产预约、本旬尚未城行动；world另拒固定部署人员。这里是保守受领资格门，不是新人物出行/归属逻辑。

本profile宝物动作**不消费受领者城行动marker**：它是君主物品处置的合成桥，花的是城市AP，沿旧单笔合同不偷偷发XP/功绩。因此多件合法处置可发生，但每件各扣AP、持有检查与日志去重保持；不声称此门与原作精确相同。

下一条城务直接读扣后的AP；下一次工资/自然忠诚直接读授予/没收后的同一loyalty，不恢复初值。

### 城市与transport转运

只允许city↔同owner transport，direction为`to-city`/`from-city`，amounts为T20的troops/money/food/12槽equipment。**本适配仅城市Equipment1..5映射本地槽0..4**；后7槽的初stock/capacity/请求全部必须0，不丢弃、不猜原生兵装ID映射、不把未知槽静默转换。

当前城市quantity作为可花库存，reserved不可转出；映射目标容量为capacity−reserved，所以type5预约占位不会被转运占掉。成功只换quantity，reserved原值保留，随后旧currentInvariant重新核所有jobs双向锁。仍沿旧T20：15坐标整单足额、目标容量全过才双方同时提交、源兵归零拒绝、无实体解散；兵转入时morale按BigInt加权floor，气力是强度不是可加守恒货物。

## 唯一 WorldTick 的结算顺序

world仍只允许WorldTick推进时钟；City不能传私自advance，Field不能传FieldTick。一次Tick：

1. 城市旧private advance：AP恢复、普通生产job推进/完成；只处理旧允许普通完成，不是Closing。
2. 如果**推进后day=1**，从此时同一城市gold按完整固定名单一次求总工资。足额整笔扣一次；不足全不扣，各正工资者忠诚减5（既有具名推断），零工资者不减。所有人使用同一个扣款前gold，不逐人重复扣总额。任一忠诚归零整Tick拒绝。
3. 使用工资后的唯一忠诚与连续RNG执行旧personnel单旬自然核。只有季度月1/4/7/10的day1触发其自然规则；不每旬掉忠。保留累计drawCount与globalDrawIndex。其投影gold=0，验证自然核不改AP/gold；归零忠诚拒绝整Tick。
4. 旅行推进一旬；field完成同一Tick驻留伤害与恢复。全部成功且日期/turn一致才发布所有结果。

月度工资门有既有工资资料；“城市普通完成→月工资/欠薪→自然季度→旅行/field候选”的跨服务顺序为具名政策 `inferred-monthly-salary-before-natural-quarter-v1`，不是恢复原opcode顺序。旧bounded-city-piece-clock没有财政工资扣款，所以没有第二次工资扣除；本桥不导入另一个finance tick。

自然metadata.lastDate必须精确落后本Tick日期一旬；非Tick处置要求同日。外层连续revision和完整重演确保每个已接受Tick只结算一次。任何后续field终结损耗、忠诚归零、容量、预算失败都不发布已局部计算的AP/完成奖励/工资/RNG/旅行改变。

## 日志、预算、读写边界

新world的read/create/execute/save/load名为`...InferredUnifiedResourceWorld`。城市新timeline另提供`readBoundedSyntheticResourceTimeline`、`createBoundedSyntheticResourceTimeline`、`executeBoundedSyntheticResourceTimeline`供严格synthetic场景使用；它不是原生档补丁API。

world及城市timeline最多32条命令，全部从原genesis完整重演；内部旧城务revision只计旧城务步，外层revision计所有桥步，二者不混用。每步为活动job预留剩余Tick槽（外层、城市timeline、field），type5完成只发生于真正Tick一次；保留旧startSnapshot/fees/锁/remaining。槽预留不能保证未来所有损耗必定避开零终结，遇此仍拒绝。

城市timeline沿既有bounded JSON结构/预算验证，world再限2000000字符和200000节点/深64；保存仅唯一genesis+commands。所有子域及结果都来自相同重演，不接受current余额/metadata快照覆写；正常失败不返回半成品state。派生输出被拿到模块外另行分支操作，不是可回灌本world的历史。

旧默认、旧保存与旧独立入口不变。新版本不声称原作地图、跨版本等价、通用世界调度或真实人物迁移；P078/Closing/真人归属伤亡/零值终结仍排除。动态Deploy/Return是紧随资源桥的具体集成工作，本版本仍固定部署，不因未实现而假称已闭合。

仅静态实现与审阅候选，未执行代码、示例、测试、typecheck或build。独立审阅应覆盖所有helper及完整outer桥，而不只看外壳；最终以固定hash及远端合并记录区分本地与已发布。
