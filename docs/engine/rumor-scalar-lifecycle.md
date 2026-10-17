# Rumor scalar lifecycle API

更新：2026-10-17。模块 `packages/engine/src/rumor-scalar-lifecycle.ts`；profile `standalone-rumor-scalar-v1`，scope `two-fixed-cities-ordinary-scalar-only`。见[完整规则](../rules/rumor-scalar-lifecycle.md)、[固定policy](../../data/catalogs/rumor-scalar-policy-v1.json)、[来源manifest](../sources/rumor-scalar-lifecycle.json)、[交换schema](../sources/rumor-scalar-lifecycle.schema.json)及[未运行场景](../../data/scenarios/rumor-scalar-example-v1.json)。

本页描述静态实现合同；没有运行测试、typecheck、编译、build、checker、诊断、schema校验、产品或示例，不能写成验证通过。schema只描述结构，不代替跨字段约束、完整历史重算或原作证据。

## 1. 固定边界与公共接口

`sourceBoundary`在state、receipt和inspect中保留完整固定声明。最重要的是 `originalCommandEquivalent:false`、`worldActionSupported:false`、`originalCaptureRisk:"unresolved-not-modeled"`、`travelAndMission:"not-modeled"`、`failureDiplomacy:"not-modeled"`、`xpMeritTp:"not-modeled"`、`ownershipAndDeparture:"frozen-not-modeled"`、`ownershipFrozen:true`、`banditAndWorldConsequences:"not-modeled"`。

原被捕风险未知，不等于0；官方失败外交后果确有依据但本服务不模拟。固定归属/即时结算不等于原世界动作安全。要求原世界Rumor的调用拒绝 `unsupported-world-rumor-command`，不扣费或抽随机。原成功概率E、完整原动作X与O12整体开放状态不变。

| 函数 | 参数 | 成功结果 |
|---|---|---|
| `createRumorScalarStateV1` | 完整scenario | `{ok:true,state}` |
| `inspectRumorScalarV1` | state | `{ok:true,snapshot,actors,targetOfficers,sourceBoundary,unsupported}` |
| `previewRumorScalarV1` | state,envelope | `{ok:true,committed:false,duplicate,receipt,projectedSnapshot}` |
| `executeRumorScalarV1` | state,envelope | `{ok:true,committed,duplicate,state,receipt}` |
| `saveRumorScalarV1` | state | `{ok:true,json}` |
| `loadRumorScalarV1` | JSON字符串 | `{ok:true,state}` |
| `replayRumorScalarV1` | trace对象 | `{ok:true,state,outcomes}` |

参数入口均为unknown并做严格解析；返回结构深度不可变。公开常量为 `RUMOR_SCALAR_DEFAULT_POLICY_V1`、`RUMOR_SCALAR_POLICY_REGISTRY_V1`、`RUMOR_SCALAR_EVIDENCE_V1`、`RUMOR_SCALAR_UNSUPPORTED_V1`。完整policy逐值比较，没有digest字段，也不依digest验真。

导出类型均以 `RumorScalar...V1` 命名：Scenario、State、Snapshot、Command、Envelope、Policy、Relations、Draw、Selection、LoyaltyWrite、Receipt、Failure、StateResult、CommandResult、PreviewResult、SaveResult、Inspection、Trace、ReplayResult。

## 2. 场景输入

根对象的以下字段全部必填，不接受额外字段：

| 字段 | 结构与约束 |
|---|---|
| schemaVersion/profile/scope | `1` / `standalone-rumor-scalar-v1` / `two-fixed-cities-ordinary-scalar-only` |
| date | `{year,month,day}`；年1..9999、月1..12、日1/11/21 |
| advanceLimit | 1..360；整个配置推进窗口必须不越过9999年 |
| attackingForce | `{id}` |
| targetForce | `{id,rulerId}`；势力ID不同 |
| relation | 恰为 `hostile`，不是可变外交分数 |
| originCity | `{id,forceId,gold,actionPoints,hasStrategyOffice}`；forceId匹配攻击势力；金/AP各0..1000000000 |
| targetCity | `{id,forceId,security,defense}`；forceId匹配目标势力；城市ID不同；security0..100 |
| actors | 1..32名，字段见下 |
| targetOfficers | 0..128名，字段见下 |
| relations | `{likes,spouses,swornSiblings}`，见下 |
| rng | `{kind:"xorshift32-nonzero-rejection-v1",seed:1..4294967295}` |
| policy | 注册的[完整固定policy](../../data/catalogs/rumor-scalar-policy-v1.json)，不接受同ID改参 |

防守字段：`{governorId,strategistId,governorIntelligence,rulerIntelligence,strategistIntelligence}`，智力均0..100。governorId、strategistId及targetForce.rulerId三者不同，均不进入actors或targetOfficers，所有人员ID全局唯一。三角色能力是固定场景事实；其floor平均是新软件规则，不是原角色selector/缺位回退。

执行者为 `{id,forceId,cityId,kind:"ordinary-fixed-resident",intelligence,usedThisTurn}`，intelligence0..100，force/city须匹配攻击城。目标为 `{id,forceId,cityId,kind:"ordinary-fixed-resident",trueLoyalty,giriInternal}`，true0..255、giri0..4，force/city须匹配敌城。名单只是有限普通子场景，不称原世界完整城市名单。

关系规则：

- likes每项为 `{from,to}`，最多256条；两个方向都能作为事实输入，但只有目标普通人员→君主触发保护
- spouses/swornSiblings每项是两个ID的pair，各输入上限128；create规范pair端点顺序、再按端点tuple排序
- 每条边必须恰有一端为target ruler、另一端为targetOfficers成员；不能连接两个普通目标，也不能引用actors或太守/军师
- 无自指/重复；无向pair交换端点视为同一边。配偶全图每人最多一个，因此此profile的君主最多一位配偶
- create会规范名单、关系顺序；load时genesis必须已规范，乱序保存不能作为等价保存接受

ID是1..64位ASCII，首位字母或数字，其余仅字母数字或`_.:-`；排序用代码单元比较，不用locale。初态revision/turn/advancedCount均0；rng.state=seed、drawCount=0；usedThisTurn=true映射lastUsedTurn=0，否则null。

## 3. 两种命令与所有派生值

```text
{id,expectedRevision,command:{type:"AttemptRumorScalar",actorId,targetCityId}}
{id,expectedRevision,command:{type:"AdvanceRumorTurn"}}
```

expectedRevision整数0..1024。未知command type一律为 `unsupported-world-rumor-command`；已知type夹带未知字段为 `invalid-fields`。caller不能提供success、roll、immune/eligible/selected名单、loss、概率系数或callback。

Attempt从固定场景和当前账本自行检查目标、执行者、lastUsedTurn与200金/30AP。通过后按[完整规则](../rules/rumor-scalar-lifecycle.md#4-完整新成功政策)计算新odds，内部派生候选保护、至多一人加空槽、义理抗性、security1..6与loyalty1..12。全部具体算式/保护/平均防守/selector/义理/loss/RNG为synthetic；200/30与智力方向有官方依据，10/12仅listing单独参数事实。

概率失败的outcome为 `probability-failure`，仍是ok:true的已接受命令，付全费并消耗actor机会，revision+1。成功为 `probability-success`，忠诚/治安实际损失可为0。advance为 `turn-advanced`，只推进独立旬序、turn/advancedCount并增加revision；不刷新金/AP、治安或自然忠诚。

## 4. Snapshot、inspection与receipt

snapshot封闭字段：

```text
revision, turn, advancedCount, date, gold, actionPoints, security
actors: [{id,lastUsedTurn}]
targetOfficers: [{id,trueLoyalty}]
rng: {state,drawCount}
```

state只存true，不存UI。inspect.actors每项 `{id,usedThisTurn,hasAttemptBudget,eligible}`；hasAttemptBudget只看金/AP，eligible再看本旬是否用过及history空间，不能保证下一命令必定通过完整输出容量预算。inspect.targetOfficers为 `{id,trueLoyalty,displayedLoyalty,protectionReasons}`，显示值min(true,100)。inspect不变state/RNG/日历。

每个接受receipt含：

- schemaVersion/profile/scope、commandId、完整envelope、完整policy、sourceBoundary与unsupported
- revisionBefore/After、turnBefore/After、dateBefore/After、固定targetCityId
- actor资格与lastUsedTurnBefore/After，advance时actor=null
- outcome，successCalculation及selection；advance时后二者null
- security `{before,requestedLoss,actualLoss,after}`；resources记录金/AP的before/cost/after
- 全部raw draws；writeSet含完整before/after snapshot

successCalculation为 `{actorIntelligence,defense,defenseAverage,hasStrategyOffice,facilityWeight,successWeight,resistanceWeight,threshold,denominator,roll,success}`。

selection为 `{status,sortedCandidateIds,protected,slot,selectedOfficerId,giriInternal,susceptibilityThreshold,susceptibilityRoll,susceptible,loyalty}`。status只取not-reached、empty-pool、empty-slot、resisted、loyalty-loss-applied。概率失败也有由固定关系派生的候选/保护列表，但status=not-reached，其余抽取字段与loyalty均null；没有消费effect随机。protected每项 `{officerId,reasons}`，理由按likes-ruler、spouse-of-ruler、sworn-sibling-of-ruler固定顺序。

有忠诚写回时loyalty为 `{officerId,trueBefore,displayBefore,requestedLoss,actualLoss,trueAfter,displayAfter}`；true0也可进入该分支且actualLoss=0。成功治安0仍取security-loss。真实120扣11得109、display仍100，是纸面policy例，未运行。

## 5. 独立随机流与完整trace

每raw draw为 `{drawIndex,label,targetId,bound,beforeState,afterState,accepted,value}`。拒绝采样步骤也必须保存；accepted=false时value=null。label和targetId为：

| label | bound | targetId |
|---|---:|---|
| success | 10000 | 固定目标城ID |
| security-loss | 6 | 固定目标城ID |
| target-slot | 候选数+1，2..129 | null |
| susceptibility | 100 | 选中人员ID |
| loyalty-loss | 12 | 选中人员ID |

独立非零xorshift32依序left13/logical-right17/left5，每步uint32；u=state-1，M=4294967295，limit=M-(M%bound)，u<limit才接受u%bound。每bounded至多32 raw，单次attempt至多5 bounded/160 raw；耗尽为rng-draw-budget并整条回滚。详见[随机政策](../rules/rumor-scalar-lifecycle.md#7-独立rng顺序与draw预算)。这不是原global RNG、原消费顺序或有限随机独立性认证。

## 6. 原子事务、幂等与preview

新命令先完整验证，再查ID/revision与业务资格。已接受同ID、canonical完整envelope相同，包括原expectedRevision，返回当前state与原receipt，committed=false、duplicate=true；同ID异内容拒绝。新接受命令committed=true、duplicate=false。失败ID不保留。

计算、费用、actor频次、忠诚/治安、RNG和history在detached draft整体提交；迟发保存/result容量或draw预算错误也整体回滚。概率失败不作为验证失败回滚，其费用是真实独立账本变化。

preview经同样command/save预算门槛派生，再核完整preview结果预算；committed始终false，不占ID、不预约费用、不推进真实RNG。新命令同state/envelope应派生与execute同一receipt；幂等重试的projectedSnapshot是当前state，不回退到旧receipt的after snapshot。

失败对象封闭为 `{ok:false,committed:false,reason,revision,turn,commandId,index}`；后四项无可用上下文时为null。index可标识坏history/trace项。失败不返回伪造接受receipt或修改后的state。

## 7. 完整保存与重放

state与解析后的save同形：

```text
{
  tag:"rumor-scalar-state-v1",schemaVersion:1,profile,scope,policy,sourceBoundary,
  genesis:{scenario,snapshot},snapshot,
  acceptedCommands:[{envelope,receipt}]
}
```

save不是delta，也不是policy ID/hash。它保存完整canonical初态、完整policy、seed、每个接受envelope/receipt及最终snapshot。save、inspect和命令入口都先重建传入state，不能借直接修改snapshot绕过历史。

load严格解析JSON，从canonical genesis经同一execute逐条重建；核每条ID唯一、revision、全部receipt、每个中间预算及最终snapshot。被接受历史重复出现旧ID会拒绝，不能借幂等结果充一条新history。genesis不规范、被改policy/sourceBoundary、篡改receipt/RNG或不可达snapshot整体失败。不是把输入终态覆盖重算结果。

trace为：

```text
{
  tag:"rumor-scalar-trace-v1",scenario,
  attempts:[{envelope,expectedOutcome}],
  expectedFinalSnapshot
}
```

expectedOutcome为null、`{ok:true,duplicate,receipt}`或完整Failure；expectedFinalSnapshot可null。null仅取消断言，计算仍由服务内部完成；提供expected值不能驱动success/roll/loss。replay按同一execute派生接受/拒绝、对比所有提供断言；返回outcomes与最终state。typed schema只描述合法形状envelope；防御性运行入口也可记录畸形envelope的拒绝，但这些故意畸形输入不属于typed交换schema。

本版本只注册一套完整policy；任何改参须新ID/版本，并保留旧保存解释，不隐式采用最新默认或迁移。没有原世界Rumor、其他服务账户或native save适配器。

## 8. 资源限制与输入防护

| 限额 | 值 |
|---|---:|
| 已接受命令，包括概率失败与advance | 1024 |
| replay尝试 | 1024 |
| 独立旬推进 | 360，并受scenario.advanceLimit约束 |
| scenario规范UTF-8 | 524288字节 |
| 完整结构state/结果/保存 | 8388608字节 |
| 结构深度/节点 | 32 / 262144 |
| 通用每数组/每对象字段 | 1024 / 128 |
| 每attempt raw draw | 160 |

8MiB不仅计未转义内层save，还核完整 `{ok:true,json:...}` 包装内转义字符串；command结果含完整state及独立receipt副本、preview/replay/inspection也核完整结果。每次接受前确保result与save预算，load/replay每条中间状态亦核；不能只计新receipt。

提交新state前还为“当前state + 任意历史ID的完整旧receipt”的幂等重试结果预留容量。静态实现分别取历史receipt的canonical UTF-8字节、节点数、最大深度、原始字符串加key字节四维极值，对最多四个完整duplicate结果逐一过预算；只取最大字节receipt不能替代另外三维。此预留可能让后续新命令比只看自身结果更早整体拒绝，但原state的旧ID仍能返回原receipt与当前state。它不额外扣费、不占command ID，也不预留用户资源；load/replay按同一execute对每个中间state做相同检查。上限相互约束，不保证1024条/128人/最大draw等同时达到最大。

纯JSON入口拒绝undefined、非有限/非安全整数、小数、负零、accessor、symbol/隐藏字段、自定义原型、循环或稀疏数组；普通对象允许Object.prototype或null原型，数组仅Array.prototype。JSON文本另拒绝重复解码key和尾部内容。未知/缺少字段、额外字段、同ID不同policy均拒绝。

规范化对所有对象key采用代码单元升序；人员按ID、关系按端点tuple排序，history与RNG保留发生顺序；序列化无空白、标准字符串转义与十进制整数。JSON Schema不能单独表达这些全部约束，本文件和schema没有经过运行校验。

## 9. 主要拒绝与边界

主要reason包括unsupported-profile、policy-mismatch、source-boundary-mismatch、unsupported-world-rumor-command、unsupported-personnel-scope、invalid-fields/number/id/data/prototype/array/json、duplicate-json-key、inconsistent-scenario、unknown-actor、wrong-target-city、actor-already-used、insufficient-gold、insufficient-ap、stale-revision、duplicate-command-id-conflict、advance/calendar/history-limit、serialization-budget、rng-draw-budget、noncanonical-genesis/envelope、genesis-snapshot/receipt/snapshot-mismatch、duplicate-accepted-entry、trace-outcome/snapshot-mismatch。具体拒绝是静态合同，不是已运行样例结果。

O12-A自然/现金已由PR83交付，本模块与它独立；已有相性核、普通登用决策、O10足额工资和O07官职不重造。O12仍开放，原43不减少、45行旧快照不变成新分母。原成功与效果证据E、完整原命令及P078全部依赖X保留；普通item登记不被误列native人物ownership X，宝物E/未来物品范围也不是本批追加必做。
