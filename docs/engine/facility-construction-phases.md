# 标准设施建设的私有计算与写入阶段

2026-10-19。本文记录`standalone-facility-construction-v1`的代码分工和兼容边界。公共接口仍见[建设与吸收接口](facility-construction-lifecycle.md)，完整游戏规则见[建设与吸收规则](../rules/facility-construction-lifecycle.md)。这些私有函数不从公共index导出，不新增命令、profile、schema、存档字段、政策或可外供的回调。

此处为静态结构说明；未运行测试、typecheck、编译、build、validator、诊断、产品入口或示例，未修改旧测试。原有历史通过数不能证明本树，既有全套food失败未处理。拆分没有新增建设接入普通生产、财政入账或原生任务整合，不能据此声称运行等价。

## 1. 单一状态所有者与单向依赖

|文件|职责|明确不持有的能力|
|---|---|---|
|[facility-construction-lifecycle.ts](../../packages/engine/src/facility-construction-lifecycle.ts)|公共输入分离/解析、完整重建、注册政策和目录、资格/敌情、Start费用和占地、dueDate、时钟/AP、ASCII多任务调度、历史、预算、冻结和effects投影|不把完整Scenario/Snapshot交给私有phase|
|[internal/facility-construction-types.ts](../../packages/engine/src/internal/facility-construction-types.ts)|四个私有函数所需的明确输入/输出及候选对象窄视图；引用既有完整DomesticConstructionRateReceipt类型|无运行时registry、反向root依赖、公共schema或新增数据入口|
|[internal/facility-construction-leaves.ts](../../packages/engine/src/internal/facility-construction-leaves.ts)|calculateConstructionWrite和calculateConstructionDevelopment两个纯计算|无写状态、目录查询、日历、history、clone/freeze或提交|
|[internal/facility-construction-phases.ts](../../packages/engine/src/internal/facility-construction-phases.ts)|advanceConstructionWork及completeConstructionPhase，在所有者的detached candidate上同步修改指定字段|无Scenario/Snapshot、日历/date、AP、历史、目录解析、公共服务调用或自行提交|

依赖从所有者流向leaves/phases；leaves依赖私有types和既有[construction-rate核](../../packages/engine/src/domestic-construction-rate.ts)，phases仅有types依赖。types仅引用既有rate回执类型。所有者的领域类型、全部公开Frozen类型和对象结构保留原声明；私有类型按结构兼容接入，不使用any、unknown断言或ReturnType掩盖边界。

结构窄视图不会在运行时剥离实体或政策的其他字段，也不是安全沙箱；实现只读写声明的字段，不枚举、强转扩权、保存实体/services引用或转成异步任务。internal目录及不从index导出是包内接口纪律，不是任意deep import都无法访问的证明。

私有helper不是第二套外部验证接口。完整场景、政策和目录先由所有者按原规则解析、完整注册比对，随后才进入这些步骤；不会接受用户提供的函数或已算好的施工计划。存档、trace和acceptedCommands中都没有私有输入壳或services。

## 2. 精确Write纯计算与原错误适配

`calculateConstructionWrite(before, delta, cap, policyId)`返回明确联合：成功为`{ok:true,write}`，失败仅为`{ok:false,reason:'insufficient-balance'}`。算法顺序：

1. delta<0且before<−delta则失败
2. actualDelta为负delta本身，否则Math.min(delta,cap−before)
3. Write按before、requestedDelta、actualDelta、after、cap、discarded、policyId的键顺序产生；requestedDelta=delta，after=before+actualDelta，discarded=delta−actualDelta

没有新增clamp、低端cap、安全整数门、部分扣费或负discarded修正。已经验证的外部域没有扩大；也没有借此更换成另一模块的requested/returned回执格式。

所有者原`write`函数仍在每个既有调用点使用，只将纯计算失败映射回原`fail(result.reason)`，成功返回result.write。因此原Invalid类型、公共failure包装和reason位置不变。初始AP/金零delta Write、Start的AP/金扣费、Advance的AP恢复、完成TP/XP/功绩都保留各自原时点、cap和policyId。完成phase通过所有者提供的同步write服务调用同一适配器，不另造写账路径。

## 3. 新建工作量与完整速率证据

`calculateConstructionDevelopment`只接required、有序politics及initialWork的mode/divisor；mode仍为原JSON注册对象的string类型。所有者先执行Lv1`levelRow`查询，才传入文献maxDurability和people.map所得政治。

纯计算依次进行：

1. quarter-floor模式取Math.floor(required/divisor)，其余已注册模式取0
2. 以固定`domestic-construction-rate-stable-v1`、原序politics和required实际调用一次calculateDomesticConstructionRate
3. 不支持时返回unsupported-construction-rate；随后rate≤0时返回nonpositive-construction-rate
4. durationTurns=Math.ceil((required−initial)/rate.rate)，成功返回`{ok:true,required,initial,rate,durationTurns}`

仅两个纯计算有ok壳。所有者在原位置将失败交给fail，随后解构成功字段，再调用原due：先invalid-duration，再completion-outside-horizon，再逐边界nextDate推导。纯计算不做额外工期检查，不碰日期/AP，不把计算壳spread进job或receipt。

rate保留既有完整DomesticConstructionRateReceipt：supported、profile、三个有序政治槽、facilityDurability、politicsSum、maxPolitics、halfPoliticsSum、politicsRate、durabilityQuarter、durabilityRemainder、durabilityMinimum、rate、selectedBranch、完整evidence。evidence定义由原核负责，不在私有types复制或降成摘要。核返回的冻结对象仍在所有者组装Work时执行原`clone(rate)`。

job.politics仍另一次people.map，保持1..3个原序政治值；不以rate中null补齐的三槽替代。Work完整保留initial/current/required/perAdvance/rate。吸收继续由所有者使用政治70阈值推导1或2旬并执行due，work=null；不经过此计算，也不伪造rate。

## 4. 单任务工作推进与多任务所有权

`advanceConstructionWork(job)`拿到当前after.jobs中同一job对象的窄视图，仅有id、remainingTurns和work。依次读取remainingBefore及workBefore，remainingTurns减1，非null work按min(required,current+perAdvance)写current，最后返回字段顺序固定的jobId、remainingBefore、remainingAfter、workBefore、workAfter。吸收两个work值都是null。

该函数不检查completed，不重新计算速率，不完成job，不判断敌情，不推进clock/AP，不追加receipt/history。所有者仍先做advance-limit、turn-overflow、missing-turn-input门，唯一一次推进date/turn/advancedCount和fieldUnits，随后唯一一次AP恢复。

所有者再用`[...after.jobs].sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:0)`取得ASCII排序副本；原jobs数组保持开始次序。每个job先跳过completed，再将advanceConstructionWork返回值push进progress；若remainingTurns===0，立即调用原complete包装并将完成回执加入completions，然后才处理下一job。不会先批量推进后批量奖励，不使用localeCompare，不从其他公共Advance借用时钟。

inputIndex、origin=fixed-external-scenario、clone(input)、progress/completions包装及最多512个历史job均留在原位置。已完成job保留在历史中，不再推进或发奖。

## 5. 完成前门、真实引用及同步逐人服务

所有者`complete(s,after,job)`先按原顺序完成四步：

1. 从after.facilities按job.facilityId取设施；不存在、jobId不符或status=complete，报facility-reservation-mismatch
2. remainingTurns、after.turn/dueTurn及完整canonical date/dueDate比对；不符报completion-timing-mismatch
3. 非null work的current必须等于required，否则incomplete-work
4. development在此读取row(job.facilityKind).completionTechniquePoints，absorption读取原政策TP；不提前做目录查询

通过后只调用一次completeConstructionPhase。输入job、facility、force分别是同一after候选里的真实对象，currentTurn是已经推进的after.turn，requestedTechniquePoints是上述结果。不会复制余额/人物到另一份账本，也不从before、genesis或Start快照取完成余额。

policies:p按ConstructionCompletionPolicies结构提供只读窄视图，只读取writer的id/techniquePointCap/rewardCap、rewards的id及五个奖励值、completionActors.actedOnCompletion和scheduler.id。底层仍是所有者已完整比对的政策对象，不重新枚举其余字段、不强转扩权、不另造政策投影或第二套外供注册表。保存及digest仍使用原完整政策。

services包含两个仅内部的同步函数：write是原错误适配器；requireReservedOfficer在调用到某人时才从after.officers按ID查找，缺人或reservationJobId不等于当前job.id，原样fail('officer-reservation-mismatch')；成功返回同一人物对象。此闭包捕获本次complete的after和job，不预查全体、不缓存Start人物、不添加available/acted/force/city门，不进入public API或序列化。

## 6. 完成写序与当前账户

completeConstructionPhase没有第二个ok/committed/state壳，直接返回完整Completion，且只按以下顺序执行：

1. 从当前force.techniquePoints调用services.write，cap为writer.techniquePointCap，policyId为writer.id，立即赋回techniquePoints.after
2. 按job.officerIds原数组map；每人先requireReservedOfficer，再算奖励。absorption的XP用absorptionPoliticsXp；mint/granary新建用supportDevelopmentPoliticsXp；其余七类新建用ordinaryDevelopmentPoliticsXp。仅mint新建使用mintDevelopmentMerit，其他分支使用otherMerit
3. 先从该人当前politicsXp算Write，再从当前merit算Write，cap均为writer.rewardCap、policyId为rewards.id。然后依次赋回politicsXp、merit、reservationJobId=null、actedTurn为currentTurn或明确null
4. 每个Reward按officerId、politicsXp、merit、politicsBefore、politicsAfter返回；后二者均读取当前o.politics，不使用job.politics替代，不提升政治
5. 全员成功后，依次设facility.status=complete、facility.effectiveLevel=job.targetLevel、facility.jobId=null、job.completedTurn=currentTurn
6. 返回jobId、facilityId、typeId、level、effectiveLevel、techniquePoints、rewards、releasedOfficerIds、policyId。typeId来自当前facility，level/effectiveLevel来自job.targetLevel；releasedOfficerIds为原序新数组，policyId为scheduler.id

phase不改facility.level/typeId/lotId/kind，不改job.work/remainingTurns/due/politics/officerIds，不移除job，不清理usedFacilityIds。当前任务TP写入先于该任务第一个人员预约门，每人的两个Write也先于该人字段赋回，设施/任务完成标记最后才写。不能因为候选会回滚就重排首错或写序。

所有者继续按ASCII逐job即时完成，所以后一个job读取前一个已经写回的当前TP。九类新建的TP30/50与五类吸收TP10均保留，九类/五类不缩为forge单项；人员XP3/4/2、mint功绩100/150、其他100及各cap都读取原政策。完整16种AP、初值、奖励、完成人员政策组合见[规则§8](../rules/facility-construction-lifecycle.md#8-完整注册政策与替换方式)。AP开关仍只在所有者，Q/Z只在development leaf，奖励/acted开关在完成phase，四者互不替代。

## 7. clone/freeze与事务边界

- resolve开头仍仅创建after=clone(before)。所有progress/completion修改均落同一detached candidate；helper不冻结、克隆、提交或返回另一份state
- 新建createdFacility作为receipt对象，snapshot仍push它的clone；after.jobs.push(clone(job))与receipt.start.job=clone(job)保持两次独立克隆
- 吸收receiverBefore、removedDonor各自clone；receiverAfter留在receipt，snapshot的filter/map仍clone替换对象，原设施顺序不变
- Work.rate仍在所有者原组装点clone完整核回执；私有development返回壳不冻结也不持久化
- progress只含标量/null；Completion的Write、rewards及releasedOfficerIds均为新结果对象/数组，不把job.officerIds直接挂到可变结果上
- append成功时，直接CommandResult.receipt与acceptedCommands最后项仍引用同一个新receipt；duplicate返回本次完整重建出的旧receipt。不同公共调用间不承诺对象身份
- 原公共成功/失败递归freeze路径保留。任何后续人物、后续job、重建比对或输出预算失败都丢弃本次候选，不能部分提交或登记失败的envelope ID

## 8. 首错、重建与预算仍由所有者负责

commandResult保持reconstruct(detach(input))、envelope(detach(rawCommand))、append的顺序。append先处理旧ID完整envelope冲突/重复，再处理新ID的expectedRevision和MAX_HISTORY，最后resolve；完整重复不重扣费用、不推进、不发奖。

reconstruct保持根shape/schema、genesis shape、scenario/initialState及初始结果预算、完整policies/digest、完整catalog/digest、genesis.snapshot，再逐条accepted entry/envelope/append、duplicate-accepted-entry、完整execute输出预算、完整receipt比对，最后完整snapshot和state预算。旧接受步骤的错误index及blockingUnitId包装不变。preview继续先预算完整execute结果，replay每次成功/duplicate尝试继续预算完整execute形状，失败不改变候选。

Start共门的city/owner/job容量、全部单位检查和首个blocks、按所选ID逐人的全部资格、AP/金成本及不足门仍先于各自新建/吸收门。新建lot/占用/历史ID、due及组装不下移；吸收双方/同类/忙碌/等级/邻接、政治阈值、donor移除及receiver更新不下移。具体首错见[规则§3](../rules/facility-construction-lifecycle.md#3-建设开始资格费用人员与地块)及[规则§5](../rules/facility-construction-lifecycle.md#5-吸收合法组合腾地与旧级效果)。

两种纯计算失败仅在原所有者fail点转为Invalid；progress没有新增失败，completion的失败只由同步所有者服务在原时点抛出。没有新Error类型、catch层或私有assert将原错误降成invalid-data；原failure对非Invalid的fallback仍保留。

原JSON分离/解析器、重复JSON键、负零、descriptor、稀疏数组、prototype、4,000,000节点、深度48、数组4096、对象128键和67,108,864字节等预算均不变。所有者仍完整保存policies/catalog/genesis/全部envelope与receipt/current snapshot，不缓存可信state、不只核digest或部分receipt字段，不新增尾预算保证。

## 9. 只读effects与原证据边界

projectFacilityEffects仍先完整重建，再按原目录、六角邻接和genesis lots顺序生成30槽金粮输入并调用既有核；productionSlots仍是只读视图。incomePosted=false、externalProductionJobsIntegrated=false保持不变，经济核原拒绝条件仍可能使合法建设state得到unsupported-effects-projection。

公开速率listing只支持稳定已解析政治U8和设施D U16下的局部算术；完整evidence没有因此成为原getter、stock字节或跨平台认证。目录typeId/耐久/XP/功绩沿用既有资料等级，政治69/70吸收时长与TP10保留empirical等级，造币功绩100/150冲突不解决。

工作量quarter/zero初值、每旬cap、工期、首次下一边界、完成时点/写序、AP+20/0、逐人全额奖励/cap、acted/null及独立history/replay都是具名工程政策。原生TP完整来源、XP到属性增长、人员返回/取消/城市易主/任务终结链、原生存档和全局日历/RNG仍未闭合。拆分不引入currentHP、伤害、维修或升级HP迁移，也不代表新建设施已接入实际普通生产。
