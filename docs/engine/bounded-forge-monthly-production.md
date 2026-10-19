# Bounded Forge Monthly Production v1

`bounded-forge-monthly-production-v1` 是单城、固定势力/军团、最多一个永久建设 job 的独立 owner。建设和普通 `Produce(1|2|3)` 复用私有 forge core；唯一旬推进先完成施工，再在新日为 1 时调用现有单设备月特产 phase，顺序 1→2→3。三项实际结果接回 `current.ledger.inventory`，因此后续普通生产读取同一真实余额。

这是独立 profile，不是旧 `bounded-forge-development-production-v1` 的存档迁移或同域升级。旧 owner 的 71 类型、7 API、JSON、schema、policy 和 512 trace 域保持；新 owner 有 84 类型、7 API、1 常量、独立 tag/save，以及显式 **128** trace 域。原子性、完整核 evidence、两份观察、所有历史前缀与全部包装均不因加入月产而缩减。

游戏政策全文见[规则正文](../rules/bounded-forge-monthly-production.md)。机器数据：[政策](../../data/policies/bounded-forge-monthly-production-v1.json)、[自包含 schema](../../data/schemas/bounded-forge-monthly-production-v1.schema.json)、[静态初态](../../data/scenarios/bounded-forge-monthly-production-example-v1.json)、[来源身份](../../data/sources/bounded-forge-monthly-production-v1.json)。本文是静态接口、字段关系及预算说明；未运行测试、编译、typecheck、build、runtime、validator、示例、serializer 或产品尺寸测量，不宣称候选运行通过。

## 1. 公开入口：7 API、1 常量、84 只读类型

全部公开类型是相应闭合 DTO 的 `DeepReadonly`。以下签名中的短名 T 指完整名字 `BoundedForgeMonthlyProductionTV1`；Date 的完整名字为 `BoundedForgeMonthlyProductionDateV1`，不是 DateV1V1。

|函数|输入|返回|
|---|---|---|
|`createBoundedForgeMonthlyProductionV1`|input: Scenario|CreateOrLoadResult|
|`inspectBoundedForgeMonthlyProductionV1`|input: State|InspectResult|
|`previewBoundedForgeMonthlyProductionV1`|input: State, inputEnvelope: Envelope|PreviewResult|
|`executeBoundedForgeMonthlyProductionV1`|input: State, inputEnvelope: Envelope|ExecuteResult|
|`saveBoundedForgeMonthlyProductionV1`|input: State|SaveResult|
|`loadBoundedForgeMonthlyProductionV1`|input: string|CreateOrLoadResult|
|`replayBoundedForgeMonthlyProductionV1`|input: Trace|ReplayResult|

常量 `BOUNDED_FORGE_MONTHLY_PRODUCTION_POLICY` 为 `DeepReadonly<Policy>`，不计为第八个行为 API。没有公共 adapter、parser、writer、core、trusted-state、hook 或手工月结入口。

84 个完整别名由以下无重复名单唯一展开：每项加前缀 `BoundedForgeMonthlyProduction` 和后缀 `V1`（Date 项亦恰如此）。前 71 项对应旧表面同形叶及本根替换的外壳，后 13 项是月 DTO：

```text
 1 ConstructionPolicy       2 ConstructionCatalog       3 Id
 4 JobId                    5 Digest                    6 Marker
 7 Equipment                8 ProduceEquipment          9 Date
10 Position                11 Clock                    12 Progress
13 OfficerFacts            14 Lot                      15 ExistingForge
16 Unit                    17 ProductionCatalog        18 Scenario
19 Policy                  20 DomesticPolicies         21 RateInput
22 RateEvidence            23 RateReceipt              24 ConstructionWrite
25 ConstructionWritePolicyId 26 DomesticWrite           27 OfficerRow
28 FacilityRow             29 Ledger                   30 ConstructionReward
31 Completion              32 StartSnapshot            33 ConstructionFees
34 Work                    35 Job                      36 Current
37 PriceInput              38 PriceOutput              39 QuantitySlot
40 QuantityInput           41 QuantityOutput           42 Kernels
43 ProductionCalculation   44 DomesticFees             45 DomesticReward
46 ProductionAudit         47 StartCommand             48 ProduceCommand
49 AdvanceCommand          50 Command                  51 Envelope
52 UnitCheck               53 StartReservations        54 StartDetail
55 ProgressAudit           56 TickDetail               57 ReceiptCommon
58 Receipt                 59 State                    60 Stage
61 Reason                  62 Failure                  63 CreateOrLoadResult
64 InspectResult           65 ExecuteResult            66 PreviewResult
67 SaveEnvelope            68 SaveResult               69 ReplayOutcome
70 Trace                   71 ReplayResult
72 MonthlyFacts            73 MonthlyPolicy            74 MonthlySlots
75 MonthlyInput            76 MonthlyCapture           77 MonthlyArithmetic
78 MonthlyQuantityRequest  79 MonthlyEvidence          80 MonthlyKernelResult
81 MonthlyKernelCall       82 MonthlyWrite             83 MonthlyItem
84 MonthlyReceipt
```

输入虽有 TypeScript 签名，仍全部作为不可信数据安全读取。所有成功及失败输出分离并递归冻结；不改动或冻结 caller 对象。没有使用 type assertion 让未核验月回执取得可信身份的通道。

## 2. 精确外壳、标签和共同域

```ts
type StartCommand = {
  type:'StartForgeDevelopment'; cityId:Id; lotId:Id;
  facilityId:Id; officerIds:Id[];
};
type ProduceCommand = {
  type:'Produce'; cityId:Id; facilityId:Id;
  officerIds:Id[]; equipmentType:1|2|3;
};
type AdvanceCommand = {type:'AdvanceSharedFacilityTurn'};
type Envelope = {id:Id; expectedRevision:number; command:Command};
type State = {
  tag:'san11-bounded-forge-monthly-production-state-v1';
  schemaVersion:1; profile:'bounded-forge-monthly-production-v1';
  genesis:Scenario; revision:number; current:Current;
  acceptedCommands:{envelope:Envelope;receipt:Receipt}[];
};
type Current = {clock:Clock;ledger:Ledger;jobs:Job[]};
type SaveEnvelope = {
  tag:'san11-bounded-forge-monthly-production-save-v1';state:State;
};
type Trace = {
  tag:'san11-bounded-forge-monthly-production-trace-v1';scenario:Scenario;
  attempts:{envelope:Envelope;expected:ReplayOutcome|null}[];
  expectedFinalState:State|null;
};
```

对象均 exact-key；没有持久 unknown、自由错误文本、额外 side cache 或第二份库存/时钟。Id 为完整匹配 `^[A-Za-z0-9][A-Za-z0-9_.:-]{0,63}$` 且拒绝尾部换行；JobId 恰 `job:`+开工 envelope.id；Digest 恰 64 小写 hex。UInt≤9,007,199,254,740,991；业务数字拒绝 −0。坐标整数 ±1,000,000，date 为 year1..9999/month1..12/day1|11|21；marker=null 或不大于对应 turn 的安全整数。

Scenario 恰18键：schemaVersion、profile、episodeId、clock、advanceLimit、activeForceId、force、corps、city、officers、lots、facilities、domestic、constructionEnvironment、productionCatalog、constructionCatalog、policy、monthlySpecialty。schemaVersion=1，clock 恰 date/turn，advanceLimit1..12，整个窗口必须可表示。

共同供应域：officers1..8、lots1..2、初始 complete Lv1 forge0..1，lots 数恰为初始 facilities 数+1；设施/lot/人物各自 ID 唯一且关系完整。initial 不接受 job、锁或 developing。四库存0≤quantity≤capacity≤1e6；金0..1e9、AP0..255、TP0..10000；五XP/merit0..1e9；四稳定属性U8；技能唯一且仅79/80/81。city.kind=city，goldCapacity=1e9，troopCapacity≤1e6、security≤100、moraleCap20..255。16个以内完整 units 与16个以内显式 hostile forces，completeFieldUnits 必须 true。完整目录、政策必须逐值匹配；缺事实不能补默认。

Current.ledger 恰 gold/actionPoints/security/troops/morale/patrolUsedTurn/force/inventory/officers/facilities。inventory 固定1..4，每行仅 quantity、reserved:0，无 capacity 字段。OfficerRow 恰五XP、merit、actedTurn、id、politics、reservationJobId；FacilityRow 恰 id/lotId/cityId/kind/targetLevel/typeId/status/effectiveLevel/jobId/usedTurn。developing 必须 effective0、有 job、used=null；complete 必须 effective1、job=null。Current.jobs 永久最多1，含完成记录，不删除历史 job 释放额度。

MonthlyFacts 恰 `{governorOfficerId:Id|null,facilityLotSlots:Thirty<Id|null>}`。固定太守必须是供应人物且政治0..100；其他人物政治仍0..255。30项稠密 tuple 必须将每个供应 lot 恰映射一次，剩余为 null，包括当前空 lot，不得重复/漏项/外部 lot。月初从当前设施按槽派生事实，太守从同一 OfficerRow 按固定ID读取，不看 available/acted/reservation 作为月资格。

## 3. 政策嵌套、共享 core 和两个摘要

新 Policy 恰 `{id,version,base,monthly,budgets}`，id=`bounded-forge-monthly-production-v1`、version=1。base 是完整旧 `bounded-forge-development-production-v1` 政策，包含完整 construction、domestic 与旧 budgets，未执行的来源参数也不删掉。只认完整 canonical 值，不能只认 ID 或 digest。

monthly 的十键固定如下：

|字段|固定值|
|---|---|
|id|dynamic-forge-monthly-v1|
|clock|after-core-completion-at-month-start-v1|
|slots|explicit-lot-slots-from-current-v1|
|governor|fixed-officer-current-politics-0-to-100-v1|
|initialDate|no-create-catchup-v1|
|payroll|not-modeled|
|order|[1,2,3]|
|specialty|完整 documented-matching-complete-facilities-v1：来源 order[1,2,3,4]，1/2/3→forge、4→stable，completedFacilityWeight1、governorRequired true、arithmeticProfile comment-f32-rne-trunc-v1、kernelRequestCap1500、nativeMatchingHelperRecovered false|
|arithmetic|完整 comment-f32-rne-trunc-v1，含六常量、四档 factor、一次 f32 round-to-nearest-even、floor(politics/2)+60、乘 storedFactor 再乘 three、向零截断、requestCap1500、provisional evidence|
|credit|完整 saturating-positive-credit-v1：accepted=min(requested,capacity-before)、discarded=requested-accepted、bonusBasis=requested-base、caps=explicit-scenario-not-native|

六个 arithmetic constantBitsU32 为 half1056964608、one1065353216、quarter1048576000、two1073741824、tenth1036831949、three1077936128。四档字符串为 `count=1:1`、`2..3:1+(count-1)*half`、`4..7:2+(count-3)*quarter`、`8..30:3+(count-7)*tenth`。保留较宽来源常量不扩张本 owner 的两设施、三设备域。

最外层 budgets 固定 acceptedCommands64/traceAttempts128/maxJobs1/maxAdvances12/maxOfficers8/maxLots2/maxFacilities2/maxFieldUnits16/maxHostileForces16/maxUtf8Bytes8388608/maxNodes250000/maxDepth48/maxArray4096/maxObjectKeys128。base.budgets.traceAttempts512 记录旧 core 政策身份，**仅最外层128决定新 trace/replay 边界**；base.construction 中其他较大限额同样不覆盖本根域。

core 的输入是具体 object literal 构造的12键 `ForgeCoreFacts`：advanceLimit、activeForceId、force、corps、city、officers、lots、domestic、constructionEnvironment、productionCatalog、constructionCatalog、policy。最后 policy=`s.policy.base`。不强转新 Scenario 为旧 Scenario，不给 core 看半整数月回执、新政策或历史。

- Start 调私有 `startForge({genesis:coreFacts(s),revision},candidate,envelope,command)`
- 普通生产调 `produce(coreFacts(s),candidate,command,envelope.id)`
- Advance 调 `advanceShared(coreFacts(s),candidate)`，之后调 `applyForgeMonthlySpecialty(s,candidate)`
- 不调用旧公共 execute/inspect，不构造伪旧 State，不复制普通生产/施工数值业务，不注入 callback/writer/resolver

`Job.startSnapshot.policyDigest` 是开工时完整 **base** 的 canonical SHA-256，表达 core 实际消费的政策。新 `Receipt.policyDigest` 是完整五键 **新 Policy** 的摘要，表达本根月序与边界。Current 不变量重建 snapshot 仍使用 coreFacts，不能混淆两摘要。production/construction catalog 摘要都覆盖完整目录，Current 摘要覆盖整份整数 Current；任何摘要都不能代替全文比较。

私有 data 模块共用 core 原 record/object/integer/literal/choice/jobId/array/advanceDate 读取器以及同一 stop/caught 错误品牌；仅 owned clone/same/digest/detach/budget 使用本根安全 JSON。缺 crypto 或所需 intrinsic 时 fail-closed，无缓存摘要、通用 owner factory 或第二 WeakMap 信任体系。

## 4. 三业务与唯一提交顺序

Start 与 Produce 的收费、数值核、预约、acted、设施 used、成长、完成行为保留。Start 金−300/AP−20；rate=max(maxPolitics+floor(sumPolitics/2),66)，work200→800、duration=ceil(600/rate)1..10。普通 Produce 金扣价格核结果/AP−20，各选人 intelligenceXp+2/merit+50；库存满仍 pay-and-reward。详细游戏公式和资格见规则正文，不另写近似生产核。

Advance 的同一 `tick` stage：检查 horizon → 唯一 date/turn/advancedCount+1 → AP+20裁剪255 → active work/progress → 到期 TP+30、各人 politicsXp+3/merit+100、释放锁、完工 acted、设施 complete → 月阶段。新 TickDetail 恰 `{apRecovery,progress,completions,monthlySpecialty}`，前三项直接来自同一次 core advance。没有第二次时钟、独立月结命令或中间提交。

到期完成数≤1，progress/completions 各0..1。奖励写保留所有 before/requestedDelta/actualDelta/after/cap/discarded/policyId；TP10000、XP/merit1e9饱和。参建者在完工旬 acted 会影响普通 Produce，但不影响其作为太守的月产。月产不占 usedTurn，不改AP/gold/TP/XP/merit/锁/工作量/设备4。

唯一 candidate 在所有业务、current/root 不变量、历史余槽、Receipt 和全包装 fit 后才发布。任何 late 错误，包括第三设备核结果或最终 SaveResult 预算错误，丢弃全部本旬候选变更，连同本旬完成和前两设备库存。

## 5. 月回执的完整闭合字段

`MonthlyReceipt` 恰5键：status、settlement、governor、facilityIds、items。items 恰3项，equipmentType 按位置固定1/2/3；各项恰7键：equipmentType、arithmeticProfile、eligibility、count、kernelQuantityRequest、kernel、write。

|阶段/项分支|必须保留的值|
|---|---|
|新day≠1|status=not-due；settlement/governor/facilityIds=null；三项 eligibility=not-due、count/request/write=null，kernel={status:not-due,reason:not-month-start}；不调用 phase 或核|
|day=1，无太守|status=no-governor；settlement={cityId,year,month}、真实30 facilityIds、governor=null；三项 no-governor、count/request/write=null，kernel={status:not-due,reason:no-governor}；三次 phase 按序调用但内部不调核|
|day=1，有太守|status=settled，真实 settlement、governor={officerId,politics}、30 facilityIds；各设备进入以下三项之一|
|not-specialty|count/request/write=null，kernel called，result.path=not-specialty|
|no-completed-facilities|count=0，request/write=null，kernel called，result.path=no-completed-facilities|
|production|count1或2，request整数180..495，kernel called、result.path=production，完整write|

settled 允许全部项非生产，不代表工资或全 finance 已结算。非月初三事实字段必须为 null，不能暗增每旬30ID副本；月初 no-governor 保留真实设施映射并按月初预算计算。

### 5.1 设施、Input、captures

月初在 core 完成后，按固定30 lot 槽读取 Current.ledger.facilities。null映射或空lot→facilityId=null/facility=null；developing→真实ID和 `{kind:'forge',complete:false}`；complete→真实ID和 `{kind:'forge',complete:true}`。当前非空最多2，不读取初态设施快照替代现设施。

MonthlySlots 每槽互斥 exact 对象：无效恰 `{validityEaxU32:0}`；有效恰 `{validityEaxU32:1,correspondingCompletedEaxU32:0|1}`。developing 的 validity1/completed0 不能省掉第二字段。

MonthlyInput 共同键为 profile=`monthly-specialty-production-observed-v1`、arithmeticProfile=`comment-f32-rne-trunc-v1`、equipmentType1|2|3、specialtyEaxU32：

- specialty0：恰上述4键，无 slots 或 politics
- specialty1/count0：增加完整30 slots，恰5键，无 governorPoliticsEaxU32
- specialty1/count1或2：再增加 governorPoliticsEaxU32=current politics，恰6键

每条 MonthlyCapture 恰 kind/callAddress/target/slotIndex/eaxU32/consumedWidthBits/consumedValue 七键：

|kind|callAddress|target|slotIndex|宽度|值|
|---|---|---|---|---:|---|
|specialty|00590A7E|0047B3A0|null|8|设备特产bit0或1|
|validity|00590AB3|0047A630|当前槽0..29|32|真实存在bit0或1|
|corresponding-completed|00590AC6|0049CFB0|当前槽0..29|32|complete bit0或1|
|governor-politics|00590B4E|004890A0|null|8|政治0..100，EAX与consumed均等该p|

captures 固定顺序：specialty → 每槽 validity，紧接该槽的 completed（仅 validity1） → 最后政治（仅 count>0）。非特产1条，count0为31+存在设施数，production为32+存在设施数，最大34；不能按完成数误减 developing capture。

MonthlyKernelCall 恰6键：status=called、api=calculateMonthlySpecialtyProduction、profile、adapterObservationKind=derived-adapter-observations、input、result。result 恰11键：supported=true、profile、arithmeticProfile、equipmentType、observations、capturedReturns、evidence、path、completedFacilityCount、arithmetic、quantityRequest。observations 全文等 input 且完整保留第二份；每个设备都有自己的全部副本。

### 5.2 算术、request、write 的精确关系

production 时 c=1：factorTier=one，factorBits1065353216，factorValue1；c=2：tier=two-to-three，bits1069547520，factorValue1.5。MonthlyArithmetic 恰8键，另5键为 politicsAL=p、politicsTerm=floor(p/2)+60（60..110）、scaledValue=term×factor×3（180..495整数或半整数）、convertedSigned32=trunc(scaledValue)（180..495整数）、capApplied=false。

MonthlyQuantityRequest 恰4键：pushAddress=00590B82、continuationAddress=00590B83、quantityU32=q、quantitySigned32=q；q=convertedSigned32=外层 kernelQuantityRequest。原1500 cap未触及。非生产 path 的 arithmetic、quantityRequest 为 null，count 按分支 null 或0。

MonthlyWrite 恰10键：resource=equipment-1|2|3、reason=specialty、before、requested、accepted、actualDelta、after、cap、discarded、writerPolicyId=saturating-positive-credit-v1。before=b 来自真实当前row，cap=C 来自初态同槽capacity；requested=q；accepted=actualDelta=min(q,C−b)；after=b+accepted；discarded=q−accepted。全为安全整数，0≤b≤C≤1e6，0≤actual/discarded≤495。满库存也必须调用核并保留 actual0 的 write。

### 5.3 完整22字段 evidence

8个固定字符串：level=source-listing-control-flow-with-provisional-arithmetic、controlFlow=source-listing-reconstruction、arithmetic=documented-replaceable-assumptions、profile=monthly-specialty-production-observed-v1、arithmeticProfile=comment-f32-rne-trunc-v1、source=docs/sources/monthly-specialty-production.json、projectTarget=PC-PK1.1、sourceEditionClaim=PK。

14个字段恒 false：exactSourceVersionVerified、runtimeSourceRehashPerformed、nativeExecutableExecuted、nativeHelpersReconstructed、converterBodyKnown、memoryConstantBytesRecovered、stockOriginalVerified、vanillaVerified、abiVerified、fullCallerExecuted、stateWriterIntegrated、ownerForceIntegrated、schedulerIntegrated、rngIntegrated。新模拟 owner 的接账不改变原核 native 证据。任何省略、额外字段、地址变化或 false→true 都不能通过全文反查。

## 6. 月 phase 隔离、完整反查与唯一可写集合

私有 adapter 入口为 `applyForgeMonthlySpecialty(s:Scenario,current:Current):MonthlyReceipt`，只在当前 root 拥有且已验证的 candidate 上调用。非月初直接构造 not-due；月初遵循：

1. 保存整个 core 后 Current 的 beforeMonthly/expectedCurrent，先派生设施，再取固定太守。缺 lot、重复占用或太守缺失/政治漂移报 invariant-mismatch，不用 null/default 掩盖
2. 克隆并冻结设施、特产数组与 phase governor；后者仅 `{politics}`，不把 officerId 或 Current 引用传给 phase，不冻结 caller 或 import 对象
3. 按设备1→2→3，从当前 row 取b、固定初态取C，建立 owned `{quantity:b,capacity:C}`；完整 expected item 仅用于事后反查，不提前写账
4. 每设备恰调用一次 `applyMonthlySpecialtyEquipmentPhase({equipmentType,monthStart:true,facilities,governor,specialtyEquipmentTypes,stock})`
5. 安全 detach response。false 时必须 exact `{ok,reason}` 并按有限映射拒绝；成功必须 exact `{ok,receipt}`、ok=true，receipt 安全 detach 后与完整 typed expected canonical 等值
6. 完整核对 input、result.observations、每 capture、算术、22 evidence、request、count、item分支与 write。成功采用自己构造 expected 的深副本，不能 cast 宽 phase receipt 为新 DTO
7. stock 再安全 detach，必须仍 exact `{quantity,capacity}`，capacity=C、quantity=已核write.after；无write时quantity=b。extra/mismatch 拒绝
8. 只有现在回写 `candidate.ledger.inventory[k].quantity`；expectedCurrent 同位同步，reserved仍0
9. 三设备后整个 Current 与 expectedCurrent 全文等值；允许变化的只有库存1..3 quantity。之后 root 再做完整不变量和包装检查

phase 不能触达 candidate；facts 冻结防止跨设备篡改。外层不接受只返数量的替代 reducer，也不绕过真实 phase 直接把 expected 当结果。宽 phase 的设备4/count30/string类型通过具体 expected reader 收窄，不扩大本根公开域。

## 7. current/root 不变量与历史库存链

Current 仍完整检查 clock/date/turn/count、固定人物顺序/政治、XP范围、设施顺序/ID/lot、job全部22键、rate/fees/snapshot、互锁、due/completed关系与marker。Work 为 initial200/current200..800/required800/perAdvance=开工rate；active remaining=due−turn>0，completed remaining0、work800、completedTurn=dueTurn、完整completion。历史 Start.job 永远 active 快照，不随 Current 完成而更新。

Job 22键为 id/kind/facilityKind/cityId/lotId/facilityId/fromLevel/targetLevel/officerIds/politics/startTurn/startDate/dueTurn/dueDate/durationTurns/remainingTurns/work/startSnapshot/rateInput/fees/completedTurn/completion。完整开工rate输入/结果、所有证据数组、原费用、base摘要永远保留；Current completed Job 和历史 Start active Job 是两份数据，各自计预算。

RateReceipt 的完整政治tuple、sum/max/half/rate分支、D800/quarter200/remainder600/min66、14字段和6证据数组保留。ConstructionWrite7字段、DomesticWrite8字段及普通ProductionAudit完整calculation/fees/rewards/events/sideEffects/rng保留。施工AP/gold先全额扣减，正奖励饱和；普通库存/费用/奖励按原 writer 规则反查，不能仅信核返回量。

rootInvariant 保留 AP/gold/TP、命令数、完成数、历史余槽检查，并按 accepted entry 顺序建立本次调用内的 expectedStocks 与 settlement Set：

- 从 genesis 四槽真实quantity开始；Start 不改库存
- 普通 production 的 inventoryWrite.before 必须等当前 expectedStocks[k]，cap等初态capacity，完整write关系成立后更新该槽
- tick 若 clockAfter.day≠1 必须 not-due；day=1 必须 settlement=该城市/年/月，不得缺失或 not-due；status与太守事实相符
- 月份唯一键 cityId/year/month 不重复；每月items按1→2→3，write.before必须接上此前库存，request与完整核一致；无write不变
- 扫描末四槽 quantity 等真实 Current，reserved0，设备4始终初值；不能以累计请求总和代替逐笔 clip 链

历史某月的 facilityIds、当时 complete、政治和完整核，由每条历史 transition 的重算证明。不得拿最终设施状态倒推全部过去月份；这个附加库存扫描不替代 fullfold。集合不持久化，没有第二 settled cache。

## 8. 安全 JSON：独立支持精确半整数

旧 JSON 模块保持整数语义。新私有模块四入口为 `decodeBoundedForgeMonthlyJson`、`detachBoundedForgeMonthlyData`、`boundedForgeMonthlyJsonFits`、`canonicalBoundedForgeMonthlyJson`，结构遍历、parser及budget与原严格边界同源，仅固定数值集合为：

```ts
!Object.is(value,-0) &&
  (Number.isSafeInteger(value) || Number.isSafeInteger(value*2))
```

它保留全部安全整数，同时允许 binary64 中精确 x.5 且两倍为安全整数的半整数。NaN、Infinity、超界、−0、0.25均拒绝。该谓词同时作用于文本 number token 转换后和对象 number 分支，不能只改其一。

这不是业务域整体放宽：原 integer/literal 读取器仍拒绝小数。Scenario、Current、Command、政策、captures、observations、request、write 都保持整数；合法fraction只可能在已全文重算一致的 MonthlyArithmetic.factorValue=1.5 或 scaledValue=x.5。

文本采用完整 JSON 数字语法，先 Number(token) 再检查；不承诺源十进制 lexeme 转换前无舍入。不同lexeme若转成同一合法JS值，canonical可相同；−0结果仍拒绝。canonical以JSON.stringify数值最短文本输出，按UTF16 code units排序object keys，保留array顺序；只用于已经拥有且字段闭合的数据，不能替代输入安全门。

安全边界逐项保留：

- Node util.types.isProxy 在 Array.isArray/prototype/ownKeys/descriptors 前检查；普通或 revoked Proxy 都拒绝，不触发 trap，必要 intrinsic 缺失时 object input fail-closed
- 仅 Object.prototype/null 原型对象；数组必须 Array.prototype、own data length、稠密索引、无额外key/symbol；不调用 getter/setter/toJSON/iterator
- 拒绝非枚举字段、特殊prototype、undefined、function、BigInt、symbol、cycle；非循环 alias 每次出现独立计数和分离，不因引用共享折扣
- parser拒绝解码后重复key，包括unicode escape碰撞；null-prototype构造防 __proto__ 污染；不对整文 JSON.parse 绕过重复键
- 实际UTF8、lone surrogate转义、引号/反斜线/control转义、root depth0、每array4096、object128、8MiB/250000节点均检查

## 9. 精确失败优先序、原子性与 fullfold

Failure 恰8键：`{ok:false,committed:false,stage,reason,blockingUnitId,officerId,facilityId,jobId}`。四ID context默认null；不暴露异常 message/name、源文本或任意reason。Stage共12项：input/rebuild/deduplication/revision/domain/construction/domestic/reservation/tick/invariant/budget/comparison。Reason沿用旧有限联合，没有新增 monthly stage。

### 9.1 wrappers 和 Scenario

execute/preview 先 detach(state)，再 detach(envelope)，两次都结束才 rebuild(state)，之后才读取 outer envelope；因此整个 envelope 的结构安全错误可以早于 state 重建的业务错误。create 为 detach→scenario→initialState→rootInvariant→fitRoot→freeze；inspect 为 detach→rebuild→inspected→freeze；save 为 detach→rebuild→serialized→SaveResult budget；load 为 decode→exact save/tag/state→rebuild→成功包budget。

Scenario 首错：exact18keys → schema/profile/episodeId → clock/完整窗口 → activeForce/force → corps → city scalar/initial/四库存 → owner一致 → officers按序/唯一 → lots按序/唯一 → 初始facilities按序/唯一 → 空lot/坐标/关联 → domestic → environment → productionCatalog → 完整constructionCatalog → 完整Policy → MonthlyFacts。

MonthlyFacts 首错：exact两键 → governor null或Id → 非null查genesis人物（unknown-officer）→同城同势力→politics≤100（否则invalid-number并带officerId）→slots恰30→逐index null/Id→每个lot存在→非null不重复→每供应lot恰出现一次。对象先exact keys，数组先长度再元素再唯一性。

### 9.2 transition

1. outer exact id/expectedRevision/command；先ID，再expectedRevision安全整数，再command record。expectedRevision不提前限制为64
2. 先查同ID历史：整个envelope不同即 deduplication/command-id-conflict；完全相同则逐包fit，返回原完整receipt与最新State，不经过stale/history/command业务/月产
3. 非重复才查 expectedRevision，错为 revision/stale-revision；然后history≥64拒绝
4. domain阶段读取 exact typed command。Start字段 city→lot→facility→officerIds；Produce为city→facility→officerIds→equipment；Advance仅type。选人1..3，逐ID后唯一；未知type unsupported-command
5. clone唯一Current，Start进入construction，Produce进入domestic，Advance在一个tick中先core再monthly
6. currentInvariant → 为active任务保留完成槽 → 完整ReceiptCommon与branch → 唯一nextState和history
7. rootInvariant(next) → fitRoot(next,receipt) → committed=true/duplicate=false。此前任意失败丢弃candidate

成功 preview 使用相同 transition，但公开 committed=false、baseRevision、projectedCurrent，不登记ID或替换 caller state。所有未品牌化异常统一 invalid-data，不读取异常自定义字段；atStage只重映射已品牌有限错误，budget始终保留budget阶段。

业务首错完整保留：Start为city→owner/corps/force→job额度→全部unitChecks及首阻挡→逐人exists/member/available/reservation/acted→AP→gold→lot/占用→facilityId→catalog/rate/duration→horizon/due→完成槽。Produce为city→逐人资格→设施exists/city/complete/kind/reservation/used→unlock→price→quantity→库存writer/成长计划/zeroYield→gold→AP→费用/acted/used→全文审计与回写。

月phase失败映射在tick阶段固定且封闭：specialty-kernel:invalid-input、specialty-kernel:unexpected-field、specialty-kernel:unsupported-profile、specialty-kernel:stage-mismatch、unsupported-kernel-return 均→kernel-rejected；invalid-resource-boundary→writer-cap-overflow。未知reason或错误response形状→unexpected-reducer-effect。response必须先安全detach/record/ok，再按false分支exact{ok,reason}或成功exact{ok,receipt}检查；成功完整receipt后才检查stock，最后才回写真账。结构安全错误保留其有限reason，预算仍budget；已知太守缺失才填officerId，不猜其他context。

### 9.3 rebuild 和 replay

rebuild 的 rebuild stage：State exact7keys/tag/schema/profile → Scenario → revision0..64 → history0..64且长度相等 → 唯一initialState/rootInvariant/fitRoot → 逐entry exact envelope/receipt → outer读取 → 禁重复acceptedID → 同private transition → 禁重复entry → receipt全文canonical比较 → 最新重算State替换。末尾 supplied整State与重算整State全文比较。

历史业务错误映为 history-recomputation-mismatch（保留有限context），预算例外不改；回执不同为 receipt-recomputation-mismatch；最终State不同为 state-recomputation-mismatch；重复历史为 duplicate-accepted-entry。没有 trusted current、仅摘要比较、仅最后prefix检查或从最终设施推断历史的捷径。

replay先安全detach整Trace、exact4keys/tag、Scenario、attempts0..128及各attempt exact envelope/expected；初始化后逐attempt走相同transition。失败成为完整Failure outcome且state不变，可以继续下个attempt；成功outcome只有ok/duplicate/receipt。expected非null全文比较，仅比较、不驱动业务。每追加outcome即检查完整 `{ok,state,outcomes}`。

Replay期望outcome错为 comparison/trace-outcome-mismatch，index为当前0..127；最终expectedFinalState不等为 trace-final-mismatch/index=null；聚合预算错误index=null/state=null。失败和duplicate都不进入accepted history。完整expectedFinalState始终计入输入包，不能把base512当新attempts上限。

## 10. 全部结果与 schema 的职责

成功结果精确为：

- Create/Load：`{ok:true,state}`
- Inspect：`{ok:true,revision,current,remainingHistorySlots,remainingAdvances,reservedCompletionSlots,scope:'bounded-shared-forge-monthly-production'}`
- Execute：`{ok:true,committed,duplicate,state,receipt}`
- Preview：`{ok:true,committed:false,duplicate,baseRevision,projectedCurrent,receipt}`
- Save：`{ok:true,serialized}`，serialized为完整canonical SaveEnvelope文本
- ReplayOutcome：`{ok:true,duplicate,receipt}` 或 Failure
- Replay：`{ok:true,state,outcomes}` 或 Failure扩展 `{index:number|null,state:null}`

ReceiptCommon原15键完整保留：envelope、revisionBefore/After、policyDigest、catalogDigests、clockBefore/After、currentDigestBefore/After、ownerSnapshot、scope、rngDraws、techniquePointScope、ordinaryTechniquePoints、nativeIntegration；再加kind/detail共17键。scope换为 bounded-shared-forge-monthly-production，rngDraws0、TPscope=genesis-plus-construction-completion-only、ordinaryTP=not-modeled、nativeIntegration=false。新tick只新增monthly一个对象，不额外复制全Current/frame/Policy/finance receipt。

schema采用draft2020-12、自包含$defs、exact keys、完整required及边界。共同叶保持原域，完整旧Policy以BasePolicy保存；新Policy const完整五键，包括base中的512和外层128。Scenario18键、所有新tag/scope、TickDetail/月DTO、所有结果和Trace都引用新类型；attempts/outcomes maxItems=128。

MonthlySlots严格区分validity0无completed键与validity1必有completed；MonthlyInput按4/5/6键互斥；capture按kind绑定地址/宽度/slot；evidence为完整22字段const。arithmetic.factorValue enum[1,1.5]，scaledValue为number/min180/max495/multipleOf0.5，其余数值是相应integer域。MonthlyItem五分支绑定对应result.path；MonthlyReceipt按status三分支互斥，tuple位置equipmentType固定1/2/3，不使用additionalProperties:true填空。

JSON Schema不能替代 Proxy/−0/UTF8检查、首错、动态设施映射、数值跨字段等式或fullfold；这些由owner执行。本文没有运行schema validator。静态example仅是Scenario：episodeId=forge-monthly-example，初日200年1月1日、limit6，builder政治100，specialty=[1,2,3]，太守builder，槽前两项existing-lot/new-lot、其余28null；不附声称已生成的receipt/trace。

## 11. 静态预算定义与全部叶节点

以下为闭合字段逐项计算，不是执行产品或测量样本。每个object/array/scalar/null计1 node，key不计；同一内容每次出现各算一份，不以JS alias折扣。root depth0。字节保守式为 `B(object)≤2+Σ(keyRawUTF8+4+B(value))`、`B(array)≤2+Σ(1+B(item))`，各项多算一个末尾逗号。

Id≤64 ASCII、JobId≤68、digest64；闭合固定字符串≤68UTF8、key≤64ASCII，中文目录名按UTF8计。scalar/container编码≤70、每条边key/分隔≤68，故一般闭合值 `B<140N`。serialized存档长字符串不适用此短scalar引理，另计二次转义。

### 11.1 政策、Scenario、Current

|对象|逐字段节点式|节点|
|---|---|---:|
|specialty|root1+六scalar6+order5+matchingKinds5|17|
|arithmetic|root1+七scalar7+constantBits7+factorTiers5|20|
|credit|root1+五scalar5|6|
|monthly policy|1+六scalar6+order4+17+20+6|54|
|ConstructionPolicy|root1+version1+calendar10+development10+absorption16+hostility10+ownership7+scheduler15+writer9+effects12+budget16+persistence10+apRecovery6+initialWork6+rewards10+completionActors5|144|
|DomesticPolicies|root1+八族6/8/6/7/6/13/5/6|58|
|BasePolicy|root1+十scalar10+construction144+domestic58+budgets15|228|
|新Policy|1+id1+version1+base228+monthly54+budgets15|300|
|ConstructionCatalog|root1+三scalar3+entries(1+5×19+4×11)+incomeRows9|153|
|MonthlyFacts|root1+太守Id/null1+slots31|33|
|OfficerFacts及officers8|1+八scalar8+skills4+Progress8；array1+8×21|21；169|
|lots2/初始facility1|1+2×6；1+8|13；9|
|city|1+六scalar6+position3+initial6+inventory13|29|
|domestic/environment/ProductionCatalog|1+三scalar3+两数组各5；1+true1+hostiles17+units97；1+id1+version1+entries9|14；116；12|
|原Scenario共同字段含旧Policy|1+三scalar3+clock6+两scalar2+force3+corps4+city29+officers169+lots13+facilities9+domestic14+environment116+productionCatalog12+constructionCatalog153+Policy228|762|
|新Scenario|762−228+300+33|867（包装宽取1000）|
|OfficerRow及officers8|root1+七Progress字段7+id/politics/reservation3；1+8×11|11；89|
|Ledger|1+六scalar6+force2+inventory13+officers89+facilities23|134|
|无job Current|root1+clock7+Ledger134+jobsArray1|143|
|有completed job Current|143+210|353（宽取360）|

### 11.2 建设与普通生产全部旧审计叶

|叶|节点式|界|
|---|---|---:|
|DomesticWrite/Reward/rewards3|1+8；1+id1+attribute1+2×9；1+3×21|9/21/64|
|DomesticFees/events1/sideEffects6|1+2×9+两scalar2；1+(1+2)；1+6|21/4/7|
|PriceInput/Output/Kernel|1+3；1+7；1+api1+4+8|4/8/14|
|QuantityInput(super)/Output|1+五scalar5+slots10；1+十九scalar19+slots13|16/33|
|QuantityKernel/Kernels|1+api1+16+33；1+14+51|51/66|
|ProductionCalculation|1+十scalar/null10+selected4+Write9+三null3+Kernels66|93|
|ProductionAudit/Detail|1+93+21+64+4+7+rng1；1+191|191/192|
|RateEvidence/Receipt/Input|1+六arrays(2+2+8+3+2+2)；1+十二scalar12+politics4+20；1+profile1+politics4+durability1|20/37/7|
|ConstructionWrite/Reward|1+7；1+id1+双Write16+政治前后2|8/20|
|Completion|1+六scalar6+TPWrite8+rewards61+releasedIds4|80|
|ConstructionFees/Work|1+2×8；1+四scalar4+Rate37|17/42|
|Date/Clock/snapshotClock/Lot|1+3；1+Date4+两scalar2；1+Date4+turn1；1+两Id2+position3|4/7/6/6|
|StartSnapshot|1+五scalar5+clock6+lot6+officers10|28（宽30）|
|active Job|1+十三scalar13+Ids4+politics4+双Date8+Work42+Snapshot30+RateInput7+Fees17+completionNull1|127（宽130）|
|completed Job|127−null1+Completion80|206（宽210）|
|FacilityRow/UnitCheck/checks16|1+10；1+五scalar5+position3；1+16×9|11/9/145|
|StartReservations|1+officers19+facility4+lot4|28|
|StartDetail|1+Job130+facility11+checks145+reservations28|315|
|ProgressAudit/旧完成TickDetail|1+5；1+AP8+progress7+completions81|6/97|
|Start或Produce Envelope|1+id1+revision1+Command(1+四scalar4+Ids4)|12|
|Advance Envelope|1+id1+revision1+Command2|5|
|Receipt公共部分（含root/kind，不含envelope/detail）|1+kind1+revision2+policyDigest1+catalog3+双Clock14+双digest2+owner5+五scalar5|34|
|Start/Produce/旧完成Tick Receipt|34+12+315；34+12+192；34+5+97|361→365/238→240/136→140|
|Start/Produce/旧Tick history entry|1+Envelope+Receipt宽界|378/253/146|

两份完整completion（Current.job和tick）各80；历史active Job与当前completed Job分别130/210。完整rate/evidence、输入/输出、snapshot和fees均已计入，没有只留摘要或选择性审计。

### 11.3 三设备月节点

|组成|节点式|界|
|---|---|---:|
|30slots|array1+28×2+2×3|63|
|production Input|root1+四scalar4+slots63+politics1|69|
|capture/captures34|1+七scalar7；1+34×8|8/273|
|Evidence/Arithmetic/QuantityRequest|1+8+14；1+8；1+4|23/9/5|
|完整Result|1+六scalar6+observations69+captures273+evidence23+arithmetic9+request5|386|
|Called|1+四scalar4+input69+result386|460|
|Write|1+十scalar10|11（宽12）|
|item|1+五scalar/null5+called460+write12|478|
|items三项/月五字段|1+3×478；1+status1+settlement4+governor3+facilityIds31+items1435|1435/1475（宽1500）|
|not-due kernel/item/month|3；1+五scalar5+kernel3+writeNull1；1+四scalar/null4+items31|3/10/36（宽40）|
|月初no-governor|1+status1+settlement4+null1+facilityIds31+items31|69（按月初1500覆盖）|
|完整月Tick|旧Tick136+monthly1475|1611（统一Receipt宽1620）|

按真实Write11而非宽12时，item477、items1432、monthly1472、月Tick1608；统一包络采用较宽数值。30槽Input和result.observations都算，三设备都算，developing capture不删。

## 12. 可达 State、直接字节与每一个公共包装

设S/P/T/M分别为成功Start/Produce/Advance/进入月初次数。月产没有额外AP来源，`20(P+S)≤255+20T≤495`，故P+S≤24；S≤1、T≤12、M≤4，实际revision≤36。创建不补月产。

完整State的所有prefix界：

```text
N ≤ 5 + 867 + (143+210S) + 1
    +378S +253P +146T +1500M +40(T−M)
  = 1016 +253(P+S) +335S +186T +1460M
  ≤ 1016 +6072 +335 +2232 +5840
  = 15495 < 16000
```

即使current job一直按completed界、每tick都按有completion界，也仍成立。由140N得State≤2,240,000 bytes。此式同时覆盖尚未完成、恰月初完成及整个未来完成尾，不是只选一条小路径。

### 12.1 月回执直接 UTF-8 字节界

大量duplicate需要直接receipt字节界，不能用1620×140再乘128。下列按每个固定key和有界value手算：

|组成|字段包络|字节上界|
|---|---|---:|
|无效/有效slot|1个14字节key或再加28字节key，值0/1及结构|22/56|
|slots30|2+28×23+2×57|760|
|Input|6keys≤30，profile≤50/arithmetic≤32，slots760及有界数|1100|
|capture|7keys合66+结构30+值合≤57=153|170|
|captures34|2+34×171|5816|
|Evidence|2+22×36+8×60+14×5=1344|1400|
|Arithmetic/QuantityRequest|8keys≤20+结构，八值≤66；4keys≤20+结构及地址/三位数|260/140|
|Result|2+11×28+六scalar≤118+1100+5816+1400+260+140=9144|9300|
|Called|2+6×26+四string≤138+1100+9300=10696|10800|
|Write|10keys≤14，三完整string和七有界数|320|
|item|2+7×(21+4)+五scalar≤67+10800+320=11364|11400|
|三items|2+3×11401|34205|
|settlement/governor/facilityIds|29+66+4+2；27+66+3；2+28×5+2×67|110/100/280|
|monthly|五key开销62+status13+110+100+280+34205=34770|35000|

kernelQuantityRequest key实际21字节；corresponding-completed原文23字节，带引号25；上述不是“所有key≤20”的错误估计。完整capture的值已按最长kind算。

旧叶直接字节界也展开保留：ConstructionWrite≤220；activeJob≤130×140=18200；Facility≤500；UnitCheck≤260/checks16≤4200；单人reservation≤250/三人755、设施190、lot200、总reservations1200。StartDetail≤58+18200+500+4200+1200=24158→24200。Envelope≤620，Receipt公共壳≤1500，所以Start≤26320→26400。

普通DomesticWrite≤220，Reward≤570/rewards≤1715，Fees≤510、events115/sideEffects190；PriceKernel≤370、QuantityKernel≤2000、双Kernels≤2400；Calculation≤3400、Audit≤6100、Detail≤6120。因此ProduceReceipt≤1500+620+6120=8240。

Completion每reward≤600、三人≤1805、其余完整字段后≤2600；progress≤160/array163；旧TickDetail≤43+220+163+2603=3029→3100，旧TickReceipt≤1500+620+3100=5220。新增monthlySpecialty key16+结构4，故完整月Tick≤5220+35000+20=40240→**40500**。统一receipt覆盖Start和Produce。ReplayOutcome三key开销32+ok4+duplicate5+receipt40500=40541→40550；Trace attempt两key开销26+Envelope620+Outcome40550=41196。

### 12.2 每包完整界，包含全部旧ID duplicate

选Scenario1000、State16000、Current360、Receipt1620、Envelope12节点包络，统一深度≤20：

|完整包|节点式及上界|UTF-8字节界|
|---|---:|---:|
|State|16000|2240000|
|Create/Load成功|1+ok1+State16000=16002|2240280|
|Inspect|1+六scalar6+Current360=367|51380|
|Raw SaveEnvelope|1+tag1+State16000=16002|2240280|
|Escaped SaveResult|1+ok1+serialized1=3|4480587|
|Execute及任意旧ID duplicate|1+三scalar3+State16000+Receipt1620=17624|2467360|
|Preview及任意旧ID duplicate|1+四scalar4+Current360+Receipt1620=1985|277900|
|ReplayOutcome成功|1+ok1+duplicate1+Receipt1620=1623|40550|
|完整Replay128|1+ok1+State16000+array1+128×1623=223747|7430563（宽7440000）|
|完整Trace128，含每项expected和expectedFinalState|1+tag1+Scenario1000+array1+128×(1+Envelope12+Outcome1623)+State16000=226411|7653331（宽7660000）|

Replay字节为 `29+4+2240000+2+128×(1+40550)=7430563`。Trace为 `55+58+140000+2240000+2+128×(1+41196)=7653331`。SaveResult的serialized需二次JSON转义：raw Save文本最多2倍，引号和反斜线计入，外壳含string两端引号27，因此 `2×2240280+27=4480587`；不将超长serialized套140N。Failure有限8字段，Replay failure追加index/state，均小于对应成功界。

fitRoot对每个initial/accepted/rebuilt prefix分别检查：State、Create/Load包、Inspect、RawSave、EscapedSave、最新Receipt的Execute/Preview，以及历史**每一份**receipt搭配最新State/Current的duplicate Execute/Preview。月初旧receipt可能远大于最新not-due，不能只核最新或只记最大Start。每包单独检查，不把所有duplicate额外放入同一数组。replay每次追加outcome核完整聚合，n≤128时上述公式单调，因此覆盖每个prefix。

最深新增State路径：acceptedCommands→entry→receipt→detail→monthly→items→item→kernel→result→observations→slots→slot→scalar，depth13；Trace expected路径14，统一20。最大实际数组128（captures34、slots30、history≤36），最大实际对象Job/evidence22，统一32；均低于48/4096/128硬界。最紧Trace节点余23589，宽字节界余728608；余量不是新增字段授权。

## 13. 完成尾保证与旧512不能直接沿用

任意合法active prefix剩r∈1..10时，Start已保证剩余advance窗口容纳duration、history槽容纳全部完成推进；后续任何非tick也须保留remaining槽。连续r次Advance，每个prefix仍满足S≤1、P+S≤24、T≤12、M≤4，故State、所有旧duplicate、save和receipt包络不变。rate与事实固定，remaining每次减1、work饱和800，到due完整释放。

月产不存在工资、gold、AP、available/acted或满库存拒绝门；null太守/count0有明确no-op，真实stock容量允许actual0，核输出整数/半整数都可表达。因此新增月序/预算不会使一个已经合法接受的任务只因完工尾更大而卡死。保证以实现遵守闭合合同且crypto/intrinsic可用为前提；伪数据、实现错误、环境能力缺失仍应fail-closed，不保证任意恶意对象成功。

512三设备完整月receipt确有纸面可达反例：合法初日1月21日、一个空lot、无既有forge、政治100参建者兼太守、特产[1,2,3]、充足余额；Start+4Advance共5次接受，在3月1日完成并月产。把最后envelope原样重试507次，共512 attempts，完成月receipt出现508份。此为规则推演，未执行场景。

count1每设备33 captures，每条至少129bytes，加input和observations各30槽每槽至少20bytes、evidence仅保守取100bytes，三设备下界为 `3×(33×129+2×30×20+100)=16671`；`508×16671=8468868>8388608`。即便只保留一个特产品种，单人完整完成月receipt至少561nodes，`508×561=284988>250000`。所以不能用旧512聚合证明或只限短ID解决；新域明确128，保留8人、2设施、3设备、64字节ID和全审计。

一般化保守Trace式为nodes=`17003+1636n`（n142→249315，n143→250951），bytes=`2380115+41197n`（n145→8353680，n146→8394877）。这些仅说明选128的证明余量，不自动将支持域提升至142/145。改字段、数组域、AP来源、设施数、政策副本或月时序需重新证明，不能依赖单个运行样例尺寸。

## 14. 来源、版本与验证边界

共同owner来源固定于主线提交 `9a9305cf2458487a07baed11e1b09c24c9130308`（tree `a8a83abd434bd3e7482a12dd90a768aa62b42912`）；单设备phase来源固定于 `d7339b39cf8b85de394a77ce5cd481293682bcd0`（tree `bd7b490d744e944eb6c0cf10bcc52f1a71c6803e`）；兼容core主线提交为 `ec9e279e8c5056c5469cd275c8862d299d7ad602`（tree `bb556e3f3d7b05a88a395e970829fac599485b87`）。这些是已交付依赖身份，不是本根运行结果。

月核完整来源和版本限制见[月特产manifest](../sources/monthly-specialty-production.json)：研究仓库 sjn4048/311MemoryResearch commit `66e167e40c3440929ec016f3872aefc3486434c1`，listing blob `028fae66ba44f70716951edd9fae51420780cea0`，[原始月钱粮兵装listing](https://github.com/sjn4048/311MemoryResearch/blob/66e167e40c3440929ec016f3872aefc3486434c1/%E5%86%85%E5%AD%98%E8%B5%84%E6%96%99/%E6%95%B4%E7%90%86/Func-%E6%94%B6%E6%94%AF03-%E6%AF%8F%E6%9C%88%E9%92%B1%E7%B2%AE%E5%85%B5%E8%A3%85%E6%94%B6%E6%94%AF.txt)。完整范围00590490..00590C23，所用数量切片00590A83..00590B83及前置specialty调用；项目目标PC-PK1.1、来源只声称PK，精确版本、原生helper/常量字节/转换器/ABI/clean-stock/vanilla未认证。

月factor一次f32 round-to-nearest-even及未知00707A74向零截断是可替换假设；只有count1内联0x3F800000有指令证据。新30lot/current太守/完成后月产/饱和writer/128域/halfJSON是独立模拟政策，不更改原22字段证据。旧来源及其false flags不被“已接库存”提升为native真值。

工资、income、food、office roster、完整finance、HP/repair/吸收/升级/取消/拆除/ownership变化、全地图移动、piece、merchant、UI/CLI/legal/batch、RNG和P0-78及依赖均不在范围。普通TP未建模，TP仅genesis加建设完成。本文的源码说明、schema描述、数值和全包预算均为静态核对范围；不声称运行通过、生成过示例回执、旧存档兼容或原游戏世界循环已经恢复。
