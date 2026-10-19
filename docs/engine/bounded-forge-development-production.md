# Bounded forge development / production v1 API

`bounded-forge-development-production-v1` 是独立的有界施工与普通生产根。只有 `StartForgeDevelopment`、`Produce`（装备1/2/3）和 `AdvanceSharedFacilityTurn` 三个命令；没有 batch、legal、CLI、UI 或旧 save 迁移。它维护一个 `Current`，让同一新 facility ID 从不存在到 developing、complete，再以真实当前生命周期进入普通生产。

[完整规则正文](../rules/bounded-forge-development-production.md)说明资格、费用、数量、成长及证据边界。[根政策](../../data/policies/bounded-forge-development-production-v1.json)、[DTO schema](../../data/schemas/bounded-forge-development-production-v1.schema.json)及[来源记录](../../data/sources/bounded-forge-development-production-v1.json)分别记录固定参数、闭合结构和来源身份。本文所有数值保证均以精确 DTO 和完整重建合同为条件。

实现入口为 [bounded-forge-development-production.ts](../../packages/engine/src/bounded-forge-development-production.ts)，仅七个行为函数经 package index 导出；私有施工/生产 helper 不从公共入口导出。调用者采用 execute 返回的新 state 才保存自己的会话；没有后台推进、全局可变 world store、外部 resolver 或 trusted-state 绕行。

验证范围：静态实现与文本审阅、字段和整数代数证明。未运行测试、示例、typecheck、编译、build、runtime、checker、schema validator 或产品尺寸测量。本页不是运行通过、性能/峰值内存、发布或 native 等价认证。新根组合、日历/AP、work、完成时点、writer、成长分配和 acted 行为属于 provisional 模拟政策；局部 source-listing 算术不会把这些政策提升为原作世界行为。

运行环境边界：实现通过 `process.getBuiltinModule` 取得 `node:util` 的 `types.isProxy` 和 `node:crypto` 的 SHA-256。安全复制在反射对象前识别并拒绝 Proxy；缺少所需 intrinsic 时拒绝对象输入或摘要操作，不降级为不安全复制。本接口不承诺浏览器或缺少这些能力的旧 Node 环境可运行；本次没有进行任何运行环境验证。

## 1. 类型记法、通用域和闭合规则

以下代码块是精确 DTO 合同，采用短名以便阅读。公开 readonly 类型统一为 `BoundedForgeDevelopmentProduction{短名}V1`；例如 `Scenario` 对应 `BoundedForgeDevelopmentProductionScenarioV1`。唯一命名例外是本文短名 `DateV1` 对应 `BoundedForgeDevelopmentProductionDateV1`，不重复 V1 后缀。所有 object 恰含列出的键；没有 index signature、additionalProperties、any、unknown audit 或自由文本。`T[]` 的长度、顺序和唯一性由本节及后文给定；所有 number 均为有限安全整数，不接受 -0、NaN/Infinity、BigInt。public 入口可以接 unknown 做安全读取，但 unknown 不进入任何已重建 DTO。所有返回数据是 detached、递归冻结的新对象；不冻结或修改调用者输入。

- Id：`^[A-Za-z0-9][A-Za-z0-9_.:-]{0,63}$`，1..64 ASCII 字节
- JobId：恰 `job:` + 开工 envelope.id；正则 `^job:[A-Za-z0-9][A-Za-z0-9_.:-]{0,63}$`，5..68 ASCII 字节；不得截断
- Digest：64 个小写 hex，canonical JSON SHA-256；仅辅助审计，不能代替完整比较
- UInt：0..9007199254740991；U8：0..255；Balance：0..1000000000；TP：0..10000
- Date：year1..9999、month1..12、day恰1/11/21；创建验证初始 turn+advanceLimit 安全且完整日历窗口可表示
- Marker：null 或 0..对应 current turn 的安全整数。初始 marker 不得超初始 turn
- Position：q/r 为 -1000000..1000000 整数；距离 max(abs(dq),abs(dr),abs(dq+dr)) ≤4000000
- 数组顺序就是语义：officers/genesis lots/facilities/fieldUnits、所选 officerIds、核 slots、所有 audit/receipt/history 都保持输入或规定生成顺序；不得排序人员来去重
- 安全 JSON：8,388,608 UTF-8 bytes、250,000 nodes、root depth0 最大48、每 array≤4096、每 object≤128 keys。descriptor-only detach，拒绝 getter/setter、symbol、非可枚举项、稀疏/带额外属性数组、原型既非 Object.prototype 也非 null 的对象、cycle、函数、undefined；相同引用在不同分支允许但按出现次数计预算。JSON 文本拒绝重复的**解码后** key，包括转义碰撞
- 所有 schema object `additionalProperties:false`；union 分支互斥、required 齐全，固定 registry 必须全文等值，绝不只验 id/digest。schema/domain gate 与完整重算各自必需

```ts
type Id = string; type JobId = string; type Digest = string;
type Marker = number | null;
type Equipment = 1 | 2 | 3 | 4;
type ProduceEquipment = 1 | 2 | 3;
type DateV1 = {year:number; month:number; day:1|11|21};
type Position = {q:number; r:number};
type Clock = {date:DateV1; turn:number; advancedCount:number};
type Progress = {
  leadershipXp:number; charmXp:number; intelligenceXp:number;
  politicsXp:number; warXp:number; merit:number; actedTurn:Marker;
};
type OfficerFacts = {
  id:Id; forceId:Id; cityId:Id; available:boolean;
  leadership:number; charm:number; intelligence:number; politics:number;
  skillIds:(79|80|81)[]; initial:Progress;
};
type Lot = {id:Id; cityId:Id; position:Position};
type ExistingForge = {
  id:Id; lotId:Id; cityId:Id; kind:'forge'; level:1; complete:true;
  initialUsedTurn:Marker;
};
type Unit = {id:Id; forceId:Id; position:Position};
type ProductionCatalog = {
  id:Id; version:1;
  entries:{1:{basePriceWord:number};2:{basePriceWord:number};
           3:{basePriceWord:number};4:{basePriceWord:number}};
};
type Scenario = {
  schemaVersion:1; profile:'bounded-forge-development-production-v1'; episodeId:Id;
  clock:{date:DateV1;turn:number}; advanceLimit:number; activeForceId:Id;
  force:{id:Id; initialTechniquePoints:number};
  corps:{id:Id;forceId:Id;initialActionPoints:number};
  city:{id:Id;kind:'city';ownerForceId:Id;position:Position;
    goldCapacity:1000000000;troopCapacity:number;moraleCap:number;
    initial:{gold:number;security:number;troops:number;morale:number;patrolUsedTurn:Marker};
    inventory:{1:{quantity:number;capacity:number};2:{quantity:number;capacity:number};
               3:{quantity:number;capacity:number};4:{quantity:number;capacity:number}}};
  officers:OfficerFacts[]; lots:Lot[]; facilities:ExistingForge[];
  domestic:{pressureActive:boolean;difficulty:'normal'|'super';controller:'player'|'ai';
    unlockedEquipmentTypes:Equipment[];specialtyEquipmentTypes:Equipment[]};
  constructionEnvironment:{completeFieldUnits:true;hostileForceIds:Id[];fieldUnits:Unit[]};
  productionCatalog:ProductionCatalog; constructionCatalog:ConstructionCatalog;
  policy:Policy;
};
```

Scenario 域：advanceLimit1..12；人员1..8、四项稳定属性0..255、五项XP/merit各0..1e9；skills唯一、0..3项。全人员 force/city 必须吻合。initial AP0..255、TP0..10000、gold0..1e9、security0..100、troopCapacity0..1e6、troops0..cap、moraleCap20..255、morale0..cap。库存1..4全部供应，每项capacity0..1e6、quantity0..capacity；basePriceWord0..65535。domestic两个装备数组0..4项、唯一。普通 pressure 为独立固定事实，不能从施工城心敌情推导。

facilities恰0或1项，全部完整Lv1 forge；lots.length=facilities.length+1，即恰1个空lot。lotId/坐标各唯一、同城、不得与city中心同格；初始facility lot都存在、无重复占用；所有实体同类ID唯一。constructionEnvironment单位0..16，unit IDs唯一；hostile IDs0..16且唯一、不得含owner；别的force不自动算敌对。整个episode不改变这些外部事实。初始不接任何任务、预约或building状态。

city.security/troops/morale/patrolUsedTurn 等旧 DomesticInstantFrame 必需但本根不修改的字段，仍是上述**真实供应、验证、保存的 genesis/current 值**。不用无来源0伪造 frame。food/merchant fields 不属于此 frame，因此不另造输入。本根不删减该 frame，也不修改旧 reducer 的输入合同。

## 2. 固定完整 policy、catalog 与 evidence

### 2.1 Policy 精确结构

```ts
type Policy = {
 id:'bounded-forge-development-production-v1';version:1;
 clock:'root-xun-ap-then-forge-completion-v1';
 ownership:'fixed-supplied-city-corps-force-v1';
 transaction:'one-command-all-or-nothing-v1';
 reservation:'root-bidirectional-forge-lock-v1';
 externalFacts:'fixed-for-entire-bounded-episode-v1';
 pressureBinding:'independent-supplied-domestic-helper-v1';
 techniquePointScope:'genesis-plus-construction-completion-only';
 ordinaryTechniquePoints:'not-modeled';
 construction:ConstructionPolicy; domestic:DomesticPolicies;
 budgets:{acceptedCommands:64;traceAttempts:512;maxJobs:1;maxAdvances:12;
  maxOfficers:8;maxLots:2;maxFacilities:2;maxFieldUnits:16;maxHostileForces:16;
  maxUtf8Bytes:8388608;maxNodes:250000;maxDepth:48;maxArray:4096;maxObjectKeys:128};
};
type DomesticPolicies = {
 attributes:{id:'stable-effective-attributes-v1';version:1;parameters:{snapshot:'command-start';xpChangesEffectiveAbility:false}};
 facilityMultiplier:{id:'guide-levels-f32-v1';version:1;parameters:{levelBits:['3F800000','3F99999A','3FC00000']}};
 writer:{id:'clip-and-return-actual-v1';version:1;parameters:{overflow:'clip';returned:'actual-delta'}};
 morale:{id:'weighted-floor-presecurity-min20-v1';version:1;parameters:{rounding:'floor';security:'before-write';minimum:20}};
 productionAp:{id:'production-request20-effective20-v1';version:1;parameters:{quantity:20;piece:20}};
 rewards:{id:'source-reward-compat-intelligence-v1';version:1;parameters:{patrol:'leadership';recruit:'charm';quantity:'intelligence';piece:'intelligence';instantXp:2;instantMerit:50;completionXp:4;completionMerit:100;cap:1000000000}};
 zeroYield:{id:'pay-zero-yield-instant-v1';version:1;parameters:{zero:'pay-and-reward'}};
 presentation:{id:'no-presentation-rng-no-tp-v1';version:1;parameters:{rngDraws:0;techniquePoints:'not-modeled'}};
};
```

ConstructionPolicy 是**单个精确 JSON 值**，不是可变 registry，也不是宽 string 类型：取[建设政策目录](../../data/catalogs/facility-construction-policies-v1.json)的 `common` 全部11个字段（version/calendar/development/absorption/hostility/ownership/scheduler/writer/effects/budget/persistence），再恰增加 `apRecovery=apRecoveryPolicies[0]`、`initialWork=initialWorkPolicies[0]`、`rewards=rewardPolicies[0]`、`completionActors=completionActorPolicies[0]` 四个完整对象。没有任何其他键或替代政策。该目录被选择部分的每个 scalar、数组值和顺序都属本类型的 const，等价 JSON Schema `const`；不是仅约束形状。原 common budget/calendar 中较大的旧域值作为来源 policy 完整记录保留，本根始终执行 Policy.budgets 与 advanceLimit≤12；它们不授予旧域、不覆盖新根上限。root只将helper需要的窄只读字段传入，绝不把完整旧Scenario或旧Snapshot交给helper。

ConstructionCatalog 同样为[建设目录](../../data/catalogs/facility-construction-catalog-v1.json)的**整个精确 JSON const**，包括九类、中文name、全部levels、incomeRows和combatHpWriterRecovered；不能仅留forge条目。根仅查询forge Lv1＝type34、D800、gold300、完成TP30。完整 catalog 保留不表示其其他功能可用。productionCatalog则是显式供应的4项价格，不从未知native表猜默认值。

### 2.2 全部 construction rate DTO（完整 evidence，不摘要）

```ts
type RateInput = {profile:'domestic-construction-rate-stable-v1';politics:number[];facilityDurability:800};
type RateEvidence = {
 slotsAndStablePolitics:['005BB1E0..005BB213'];
 politicsHalfAndAdd:['005BB23E..005BB247'];
 stableFacilityReads:['005BB223','005BB22A','005BB237','005BB249','005BB26C','005BB279','005BB27E'];
 durabilityMinimum:['005BB249..005BB266','005BB26C..005BB29E'];
 selectAndReturn:['005BB268..005BB2AA'];
 excludedMod:['*005BB263..*008A9DFD'];
};
type RateReceipt = {
 supported:true;profile:'domestic-construction-rate-stable-v1';
 politics:[number|null,number|null,number|null];facilityDurability:800;
 politicsSum:number;maxPolitics:number;halfPoliticsSum:number;politicsRate:number;
 durabilityQuarter:200;durabilityRemainder:600;durabilityMinimum:66;
 rate:number;selectedBranch:'politics'|'durability-minimum';evidence:RateEvidence;
};
```

RateInput.politics恰选中1..3人顺序、每项U8，无null；output补齐末尾null，polSum0..765、max0..255、half0..382、politicsRate0..637、rate66..637。必须实际复用 calculateConstructionDevelopment→calculateDomesticConstructionRate，按原完整结果保留；这些范围不许可另写近似核。EAX/getter/D 的来源身份见[本仓库来源记录](../../data/sources/bounded-forge-development-production-v1.json)及[速率原始来源](../sources/domestic-construction-rate.json)；该 evidence 是固定ASCII数组，catalog中文名字另按UTF-8计入，不能将整个设计误称纯ASCII。

## 3. 一份 current 账与施工任务

```ts
type ConstructionWrite = {
 before:number;requestedDelta:number;actualDelta:number;after:number;
 cap:number;discarded:number;policyId:ConstructionWritePolicyId;
};
type ConstructionWritePolicyId = 'facility-exact-debit-saturating-reward-v1'
 |'facility-community-rewards-v1'|'facility-ap20-cap255-v1';
type DomesticWrite = {
 before:number;requested:number;returned:number;actualDelta:number;after:number;
 cap:number;discarded:number;policyId:'clip-and-return-actual-v1'
 |'saturating-accumulator-v1'|'exact-affordable-debit-v1';
};
type OfficerRow = Progress & {id:Id;politics:number;reservationJobId:JobId|null};
type FacilityRow = {
 id:Id;lotId:Id;cityId:Id;kind:'forge';targetLevel:1;typeId:34;
 status:'developing'|'complete';effectiveLevel:0|1;jobId:JobId|null;usedTurn:Marker;
};
type Ledger = {
 gold:number;actionPoints:number;security:number;troops:number;morale:number;patrolUsedTurn:Marker;
 force:{techniquePoints:number};
 inventory:{1:{quantity:number;reserved:0};2:{quantity:number;reserved:0};
            3:{quantity:number;reserved:0};4:{quantity:number;reserved:0}};
 officers:OfficerRow[];facilities:FacilityRow[];
};
type ConstructionReward = {
 officerId:Id;politicsXp:ConstructionWrite;merit:ConstructionWrite;
 politicsBefore:number;politicsAfter:number;
};
type Completion = {
 jobId:JobId;facilityId:Id;typeId:34;level:1;effectiveLevel:1;
 techniquePoints:ConstructionWrite;rewards:ConstructionReward[];
 releasedOfficerIds:Id[];policyId:'next-boundary-capped-work-v1';
};
type StartSnapshot = {
 clock:{date:DateV1;turn:number};activeForceId:Id;corpsId:Id;cityId:Id;
 lot:Lot;officers:{id:Id;politics:number}[];
 policyDigest:Digest;constructionCatalogDigest:Digest;
};
type ConstructionFees = {actionPoints:ConstructionWrite;gold:ConstructionWrite};
type Work = {initial:200;current:number;required:800;perAdvance:number;rate:RateReceipt};
type Job = {
 id:JobId;kind:'development';facilityKind:'forge';cityId:Id;lotId:Id;facilityId:Id;
 fromLevel:0;targetLevel:1;officerIds:Id[];politics:number[];
 startTurn:number;startDate:DateV1;dueTurn:number;dueDate:DateV1;
 durationTurns:number;remainingTurns:number;work:Work;startSnapshot:StartSnapshot;
 rateInput:RateInput;fees:ConstructionFees;completedTurn:Marker;completion:Completion|null;
};
type Current = {clock:Clock;ledger:Ledger;jobs:Job[]};
```

这两种 Write 形状分别来自旧construction与domestic叶，禁止硬cast、别名互换或遗漏returned/requestedDelta。ConstructionWrite负请求精确扣减；正请求actual=min(request,cap−before)，discarded=request−actual；domestic returned保持实际delta语义。ConstructionFees AP请求−20/cap255，gold−300/cap1e9，policyId=writer；AP恢复请求+20/cap255，policyId=apRecovery；完成TP请求+30/cap10000，policyId=writer；每人politicsXP+3、merit+100/cap1e9，policyId=rewards。所有 before/after 取同一 current，不由启动snapshot回写。完整规则包括饱和0实际增量。

扁平5项XP是本根唯一人物进度。current OfficerRow.politics复制固定真实属性并在每次不变量比较中等于genesis；它是为了私有completion能直接拿真实当前OfficerRow引用读取politics，**不是第二份可变有效政治**。domestic frame.xp从五项对应字段映射，成功后仅接回intelligenceXp、merit、actedTurn；construction直接改politicsXp、merit、actedTurn/reservation。不要做临时politicsXp影子对象而忘记回写。

FacilityRow是唯一设施账：初始0..1条，最终≤2；初始条目永远complete/effective1/job=null；新条目开工时developing/effective0/job=新job，完成原地改complete/effective1/job=null，targetLevel始终1。旧private frame必须用level=targetLevel=1、complete=(status==='complete')、reservationJobId=jobId、真实usedTurn；不传level0，不提前complete，不从genesis生成动态设施。lot占用从此数组唯一导出，不另存可独立更新的occupancy账。

jobs.length0..1；完成永不删除或复用。Job是上面字段的精确分支约束：active completedTurn/completion均null、remaining1..10、work.current<800；completed completedTurn=dueTurn、remaining0、work.current800、completion完整非null。rate、rateInput、startSnapshot、fees、开始日期与选人顺序永久保留。Start receipt的job是开工时深复制，始终active，不随current.job后来完成被修改。

## 4. 完整普通生产 audit

仅重用 reduceDomesticInstant 的 Produce 分支。旧 retainKernel 本来只去掉 price/quantity 的顶层 evidence，其余字段完整保留；本合同保持此**现有审计形状**，不把它类推到 construction rate。没有未知字段/开放api名或任意 output。

```ts
type PriceInput = {profile:'production-price-resolved-v1';savedBasePriceWord:number;specialtyHelperEax:0|1};
type PriceOutput = {supported:true;profile:'production-price-resolved-v1';savedBasePriceWord:number;
 specialtyHelperEax:0|1;specialtyResultAl:0|1;discountApplied:boolean;returnedPrice:number};
type QuantitySlot = {intelligenceGetterEax:number;skillHelperEax:0|1}|null;
type QuantityInput = {
 profile:'production-quantity-resolved-f32-v1';nativeEquipmentType:ProduceEquipment;
 slots:[QuantitySlot,QuantitySlot,QuantitySlot];resolvedFacilityFactorBits:'3F800000';
} & ({difficultyWord:0}|{difficultyWord:2;cityVirtualEax:0|1});
type QuantityOutput = {
 supported:true;profile:'production-quantity-resolved-f32-v1';nativeEquipmentType:ProduceEquipment;
 reason:'resolved-quantity';resolvedInputsObserved:true;
 slots:[{intelligenceGetterEax:number;intelligenceAl:number;skillHelperEax:0|1}|null,
        {intelligenceGetterEax:number;intelligenceAl:number;skillHelperEax:0|1}|null,
        {intelligenceGetterEax:number;intelligenceAl:number;skillHelperEax:0|1}|null];
 validSlotCount:number;intelligenceSum:number;intelligenceMax:number;skillQueryId:80;
 skillApplied:boolean;baseQuantity:number;skillAdjustedQuantity:number;
 resolvedFacilityFactorBits:'3F800000';convertedQuantity:number;difficultyWord:0|2;
 cityVirtualObserved:boolean;cityVirtualEax:0|1|null;superApplied:boolean;returnedQuantity:number;
};
type Kernels = [
 {api:'calculateProductionPrice';input:PriceInput;output:PriceOutput},
 {api:'calculateProductionQuantity';input:QuantityInput;output:QuantityOutput}
];
type ProductionCalculation = {
 observationKind:'derived-adapter-observations';selectedOfficerIds:Id[];
 securityKernelReturn:null;quantityKernelReturn:number;quantityPreCapacity:number;
 priceKernelReturn:number;timeKernelReturn:null;facilityApplied:false;
 earlyCharmSum:null;moraleSecuritySnapshot:null;newRecruitMorale:null;
 securityWrite:null;troopWrite:null;inventoryWrite:DomesticWrite;moraleWrite:null;kernels:Kernels;
};
type DomesticFees = {gold:DomesticWrite;actionPoints:DomesticWrite;sourceApRequest:20;effectiveApCost:20};
type DomesticReward = {officerId:Id;attribute:'intelligence';xp:DomesticWrite;merit:DomesticWrite};
type ProductionAudit = {
 calculation:ProductionCalculation;fees:DomesticFees;rewards:DomesticReward[];
 events:[{type:'command-committed';subjectId:Id}];
 sideEffectsNotModeled:['technique-points','native-stat-growth','native-writer-semantics',
 'native-personnel-tasks','native-corps-effects','presentation-rng'];rngDraws:0;
};
```

核域与关联：slots按选中1..3人顺序、末尾null；getter/intelligenceAl均该人稳定U8；skill由80真实存在映射为bit。Price输入base0..65535、specialty bit；返回0..65535，打折为floor(base×8/10)。quantity valid1..3、sum0..765、max0..255、base=(max+sum+200)×5∈1000..6100、skillAdjusted/converted≤12200；factor1；normal input没有cityVirtualEax，normal output observed=false/value=null，super output observed=true/value=controller player?1:0；superApplied当且仅当difficulty2且value0，返回≤24400。完整重算约束这些关系，不能仅靠各字段范围。

calculation.quantityKernelReturn=quantityPreCapacity=returnedQuantity；priceKernelReturn=returnedPrice；inventoryWrite before为真实库存、requested=returnedQuantity、cap=genesis capacity−reserved（reserved恒0），actual与returned为clip后真实增量。奖励恰所选人数/顺序，每人XP+2、merit+50，饱和不拒绝；费用先gold后AP，gold可0但AP固定20。满库存也pay-and-reward，不偷偷切到zero-yield拒绝。

不另存changes/delta列表：完整audit已有库存/费用/成长Write，markers由完整envelope/current/fold审计。这里删的不是旧已承诺字段，因为是新root DTO；旧产品接口与receipt完全不变。ProductionDetail只含 `{audit:ProductionAudit}`，不夹带内部候选/frame。

## 5. 三命令、收据和全部公共包装

```ts
type StartCommand = {type:'StartForgeDevelopment';cityId:Id;lotId:Id;facilityId:Id;officerIds:Id[]};
type ProduceCommand = {type:'Produce';cityId:Id;facilityId:Id;officerIds:Id[];equipmentType:ProduceEquipment};
type AdvanceCommand = {type:'AdvanceSharedFacilityTurn'};
type Command = StartCommand|ProduceCommand|AdvanceCommand;
type Envelope = {id:Id;expectedRevision:number;command:Command};
type UnitCheck = {unitId:Id;forceId:Id;position:Position;hostile:boolean;distance:number;blocks:boolean};
type StartReservations = {
 officers:{officerId:Id;jobBefore:null;jobAfter:JobId;actedBefore:Marker;actedAfter:number}[];
 facility:{facilityId:Id;jobBefore:null;jobAfter:JobId};
 lot:{lotId:Id;occupantBefore:null;occupantAfter:Id};
};
type StartDetail = {job:Job;createdFacility:FacilityRow;unitChecks:UnitCheck[];reservations:StartReservations};
type ProgressAudit = {jobId:JobId;remainingBefore:number;remainingAfter:number;workBefore:number;workAfter:number};
type TickDetail = {apRecovery:ConstructionWrite;progress:ProgressAudit[];completions:Completion[]};
type ReceiptCommon = {
 envelope:Envelope;revisionBefore:number;revisionAfter:number;policyDigest:Digest;
 catalogDigests:{production:Digest;construction:Digest};clockBefore:Clock;clockAfter:Clock;
 currentDigestBefore:Digest;currentDigestAfter:Digest;
 ownerSnapshot:{activeForceId:Id;ownerForceId:Id;corpsId:Id;corpsForceId:Id};
 scope:'bounded-shared-forge-development-production';rngDraws:0;
 techniquePointScope:'genesis-plus-construction-completion-only';
 ordinaryTechniquePoints:'not-modeled';nativeIntegration:false;
};
type Receipt = ReceiptCommon & (
 {kind:'forge-start';detail:StartDetail} |
 {kind:'production';detail:{audit:ProductionAudit}} |
 {kind:'tick';detail:TickDetail}
);
type State = {
 tag:'san11-bounded-forge-development-production-state-v1';schemaVersion:1;
 profile:'bounded-forge-development-production-v1';genesis:Scenario;revision:number;
 current:Current;acceptedCommands:{envelope:Envelope;receipt:Receipt}[];
};
type Stage = 'input'|'rebuild'|'deduplication'|'revision'|'domain'|'construction'
 |'domestic'|'reservation'|'tick'|'invariant'|'budget'|'comparison';
type Reason =
 'invalid-data'|'invalid-json'|'duplicate-json-key'|'invalid-fields'|'invalid-number'
 |'invalid-id'|'invalid-date'|'invalid-array'|'invalid-prototype'|'duplicate-entity-id'
 |'unsupported-schema'|'unsupported-profile'|'unsupported-policy'|'unsupported-catalog'
 |'unsupported-command'|'unsupported-city-kind'|'unsupported-equipment'|'unsupported-skill'
 |'unsupported-external-state'|'owner-corps-mismatch'|'officer-city-force-mismatch'
 |'facility-not-present'|'incomplete-field-unit-snapshot'|'owner-marked-hostile'
 |'invalid-marker'|'invalid-officer-count'|'invalid-lot-layout'
 |'command-id-conflict'|'stale-revision'|'history-limit'
 |'unknown-city'|'unknown-officer'|'unknown-facility'|'unknown-lot'|'occupied-lot'
 |'facility-id-reused'|'officer-unavailable'|'officer-already-acted'
 |'officer-reserved-by-job'|'facility-reserved-by-job'|'facility-incomplete'
 |'wrong-facility-kind'|'facility-used-this-turn'|'equipment-locked'
 |'insufficient-gold'|'insufficient-action-points'|'hostile-within-two'
 |'kernel-rejected'|'writer-cap-overflow'|'zero-yield'|'insufficient-balance'
 |'unsupported-construction-rate'|'nonpositive-construction-rate'|'invalid-duration'
 |'job-history-limit'|'completion-horizon-exceeded'|'completion-history-slots'
 |'advance-limit-reached'|'facility-reservation-mismatch'|'officer-reservation-mismatch'
 |'completion-timing-mismatch'|'incomplete-work'
 |'state-recomputation-mismatch'|'history-recomputation-mismatch'
 |'receipt-recomputation-mismatch'|'duplicate-accepted-entry'|'unexpected-reducer-effect'
 |'invariant-mismatch'|'budget-exceeded'|'trace-outcome-mismatch'|'trace-final-mismatch';
type Failure = {ok:false;committed:false;stage:Stage;reason:Reason;
 blockingUnitId:Id|null;officerId:Id|null;facilityId:Id|null;jobId:JobId|null};
type CreateOrLoadResult = Failure|{ok:true;state:State};
type InspectResult = Failure|{ok:true;revision:number;current:Current;
 remainingHistorySlots:number;remainingAdvances:number;reservedCompletionSlots:number;
 scope:'bounded-shared-forge-development-production'};
type ExecuteResult = Failure|{ok:true;committed:boolean;duplicate:boolean;state:State;receipt:Receipt};
type PreviewResult = Failure|{ok:true;committed:false;duplicate:boolean;baseRevision:number;
 projectedCurrent:Current;receipt:Receipt};
type SaveEnvelope = {tag:'san11-bounded-forge-development-production-save-v1';state:State};
type SaveResult = Failure|{ok:true;serialized:string};
type ReplayOutcome = Failure|{ok:true;duplicate:boolean;receipt:Receipt};
type Trace = {tag:'san11-bounded-forge-development-production-trace-v1';scenario:Scenario;
 attempts:{envelope:Envelope;expected:ReplayOutcome|null}[];expectedFinalState:State|null};
type ReplayResult = {ok:true;state:State;outcomes:ReplayOutcome[]}
 |(Failure&{index:number|null;state:null});
```

Envelope expectedRevision0..MAX_SAFE_INTEGER（超当前通常stale，不先截到64）；officerIds1..3、唯一且有序。历史输入形状最多64，只有重建证明可达后才可称已接受state；数学证明所有可达history≤36，不把输入shape64直接当36。trace attempts0..512，每个expected可null；expected仅比较，不驱动决策。不持有历史failure或duplicate；完整history entry中的envelope与receipt.envelope分别真实存储、预算逐份计。

最小公共API恰7个，名字冻结为：

1. createBoundedForgeDevelopmentProductionV1(Scenario): CreateOrLoadResult
2. inspectBoundedForgeDevelopmentProductionV1(State): InspectResult
3. previewBoundedForgeDevelopmentProductionV1(State,Envelope): PreviewResult
4. executeBoundedForgeDevelopmentProductionV1(State,Envelope): ExecuteResult
5. saveBoundedForgeDevelopmentProductionV1(State): SaveResult
6. loadBoundedForgeDevelopmentProductionV1(string): CreateOrLoadResult
7. replayBoundedForgeDevelopmentProductionV1(Trace): ReplayResult

全部相应公开 DTO 使用递归 readonly 类型导出；private helper永不从package index导出。固定 `BOUNDED_FORGE_DEVELOPMENT_PRODUCTION_POLICY` 常量另行导出，不增加第8个行为API。save serialized 是 canonical SaveEnvelope 完整文本，唯一允许超过一般string域的长string；不得按普通Id长度预算。成功execute新提交committed=true/duplicate=false；同envelopeduplicate committed=false/duplicate=true；preview任何成功都committed=false且不更新调用者state。

## 6. 首错：根、创建、三业务分支

### 6.1 全公共入口与完整fold

execute/preview精确顺序：先detach(state)，再detach(envelope)；二者安全读取完成后完整rebuild(state)；再parse envelope外层三个键/id/expectedRevision/command为普通非array object；随后按以下顺序：

1. 同ID查历史；完整envelope canonical相同直接返回原receipt+**最新**state/current，先于stale/history/horizon/业务门。若同ID但command或expectedRevision任一不同，command-id-conflict。完整相同旧Start/tick重试绝不重扣/推进/奖励
2. expectedRevision必须等当前revision，否则stale-revision
3. revision<64，否则history-limit
4. 完整command分支shape/domain：type分派，exact keys；Start按cityId→lotId→facilityId→officerIds；Produce按cityId→facilityId→officerIds→equipmentType；Advance只有type。unknown type unsupported-command。officerIds每项先Id再unique
5. detached current上执行相应分支；完整不变量→完成history槽→full receipt/history/返回预算；全部通过才返回新state

安全错误先于rebuild错误；rebuild先于envelope外层错误；outer错误先于dedup。command内部shape/domain故意在dedup/stale之后；safe malformed树不会绕过detach，但旧ID冲突不能被后置业务解析改变。失败ID从不登记。

create按Scenario声明顺序解析：top exact keys→schema/profile/episodeId→clock/窗口→activeForce→force→corps→city标量/initial/inventory→owner匹配→officers逐人→lots逐项→facilities逐项→占用/唯一空lot关系→domestic→constructionEnvironment→productionCatalog→完整constructionCatalog等值→完整Policy等值。每个object先exact keys再声明顺序字段；数组先length再按index元素再全数组unique。invalid-lot-layout处理重复坐标/城心重合/错城/缺lot/非恰一空lot；重复实体Id用duplicate-entity-id。类型/常量数值超域分别使用上面的finite Reason，不吐自由错误文本。

rebuild：安全detach→State exact顶层/tag/profile/schema→parse genesis→revision整数0..64/history数组0..64且长度=revision→生成唯一initialState并fitRoot→按history序逐项exact {envelope,receipt}。先parse envelope外层、拒绝重复accepted ID；内部同一transition做完整fold（不是public execute递归）；无效历史业务映射history-recomputation-mismatch，预算仍budget-exceeded；任一receipt完整canonical不等为receipt-recomputation-mismatch；最后整个raw State与重算State全文等值，否则state-recomputation-mismatch。所有prefix均fitRoot，不能仅最终fit/digest相等。未提供receipt/多字段/错array顺序也必须拒绝。

除了budget保留stage=budget外，rebuild里错误统一stage=rebuild，保持其finite reason和上下文。create/load输入stage=input；commandshape=domain；dedup/revision对应阶段；业务阶段见下。未捕获非领域异常映射invalid-data，不泄漏任意Error文本。

### 6.2 Start首错与原子开始

stage=construction：cityId匹配→固定owner/force/corps一致→jobs历史<1→计算完整unitChecks并按供应顺序取首个blocks（阻挡失败带blockingUnitId）→按选人顺序逐人检查存在、同force/city、available、reservation、acted（每个人全部走完才下个人）→AP≥20→gold≥300→lot存在→lot未被current设施占用→facilityId未用→查询完整catalog forge Lv1→调用calculateConstructionDevelopment→rate supported与positive→duration安全正整数→due≤剩余horizon→算dueDate→候选历史剩槽≥duration。

person gate映射unknown-officer/officer-city-force-mismatch/officer-unavailable/officer-reserved-by-job/officer-already-acted并带officerId；lot缺/占用分别unknown-lot/occupied-lot，facility-id-reused带facilityId。job已完成也占唯一history额度，故第二次Start优先job-history-limit而不是occupied-lot。

通过后在同候选：组装Job和startSnapshot/full rate/fees；新facility占lot，developing/effective0/usedTurn=null；新jobId=`job:`+envelope.id；依序AP扣费→gold扣费→每参建者reservation=jobId、acted=currentTurn→append job。完整reservations记录真实before/null与after，不用清空人物掩饰busy。不发XP/merit/TP，不推进clock或work。Start receipt.job深复制开工Job，createdFacility亦独立复制；unitChecks全16项最多、success时全blocks=false。

initialWork固定quarter-floor800/4=200；duration=ceil(600/rate)∈1..10。P0 rate66需10旬，P100 rate150需4旬，三人255 rate637需1旬；这是纸面边界，不是新执行公式。每一步失败连同最后预算失败都丢弃完整候选，费用/地块/ID/锁/历史均不留痕。

### 6.3 Produce首错、frame与回写

stage=domestic：root commandshape以后依旧private reducer顺序：city→每人exists/member/present/available/reservation/acted→facility exists/city/complete/kind/reservation/used→unlock→price核→quantity核→库存writer→奖励计划/写入→zero-yield政策→gold足额→AP足额→gold扣费→AP扣费→参与者acted和facility.usedTurn→audit。不得为了方便root预查AP而把AP错误移到price/quantity之前。

private reasons映射：officer-not-member/officer-not-present→officer-city-force-mismatch；officer-production-reserved→officer-reserved-by-job；facility-production-reserved→facility-reserved-by-job；insufficient-ap→insufficient-action-points；其余已列reason同名。private failure无对象context时这4个必需身份字段全部取null，不能猜是谁失败。Start和Advance root显式知道的context才填写。

每次frame来自真实current：AP/gold/库存/5XP/merit/acted/reservations/设施used/phase；固定供应资格/属性/caps/prices/policies来自genesis。完成前新forge level1但complete=false/reservation真实，资格门因此阻止生产。成功候选全面反查：只允许gold、AP、目标库存quantity、所选者intelligenceXp/merit/acted、目标facility.usedTurn变化。其余所有frame字段及root TP/job/lot/facility lifecycle/所有未选人物都必须逐字段恒等，否则unexpected-reducer-effect。不能把整个frame无审查地cast回ledger；不能吞掉construction政治XP或merit已有增量。

### 6.4 唯一Advance和内部helper接合

stage=tick：horizon门→新turn/date/advancedCount各推进一次→ConstructionWrite按apRecovery恢复一次AP+20/cap255→若唯一job active，调用clock-free advanceConstructionWork(job)一次并保存完整progress→remaining0时执行下面完成门→收据/不变量/fitRoot。无active时progress/completions均[]。不重新检查城心敌情/availability/acted；它们不能阻止已接受工程完成。

root完成门顺序：当前facility存在、jobId相等且status非complete，否则facility-reservation-mismatch；remaining0、当前turn/dueTurn、date/dueDate相等，否则completion-timing-mismatch；work.current===required，否则incomplete-work；再从完整catalog查询forge completionTP30。接下来恰调用一次 completeConstructionPhase。

接合采用既有 construction phase 的原内部接口：input.job=current.jobs[0]真实引用；input.facility=current.ledger.facilities对应真实引用；input.force=current.ledger.force真实引用；currentTurn=已推进clock.turn；requestedTechniquePoints=目录30；policies仅从完整已核Policy.construction投影writer/rewards/completionActors/scheduler。services由新root自己定义：

- write(before,delta,cap,policyId)：调用calculateConstructionWrite，失败映射root insufficient-balance；成功返回完整ConstructionWrite（再严格检查policyId有限集及形状）
- requireReservedOfficer(officerId)：从候选当前ledger按id取**同一OfficerRow对象**，missing或reservation≠本job.id报officer-reservation-mismatch；调用位置仍为phase内每次逐人成长之前，不提前遍历批验

services是仅内部同步代码依赖，绝不允许public用户callback、serializable函数、替换writer、resolver配置、Promise或可访问外部资源的接口。

phase保持原写入序：TP Write立即落force→按原选人顺序resolver→该人politicsXP Write→merit Write→XP/merit落账→reservation=null→acted=newTurn→下一人；全员完成后facility status/effectiveLevel/jobId→job.completedTurn；返回完整Completion。root严核该返回type/level等受窄域约束，并把它深复制入job.completion与tick.completions。两份都计预算。不自己再次发同一奖励或恢复AP。

完成当旬参建者acted=newTurn所以不能Produce；非参建且合资格者可在**同一新facilityId**立即Produce，因为完成不改usedTurn。下一旬原参建者acted自然过期。承诺只保证工程能完成；due恰末旬且只有参建者时不承诺还能生产，要在该场景完成后生产，需另一个可用人或额外一旬。

## 7. 不变量、完整原子性和TP边界

所有accepted prefix、inspect/load/save/replay重建后，均检查：

- revision=history长度；clock.turn=genesis.turn+advancedCount、date为精确同次数推进、advancedCount≤advanceLimit
- current人员固定genesis顺序/ID/政治；所有XP/merit范围有效；markers≤current turn；initial其他属性仍真实供应
- facilities初始固定顺序+至多唯一新增；各lot与ID唯一；type34/target1；没有其他phase/虚假effective0 complete；current jobs全部反向对应
- active task与参与者reservation和facility.jobId双向一一；无孤儿锁、非参与者锁或completed锁。只有当前active job才占预约；任何其他人物reservation必须null
- active elapsed=current.turn−startTurn，work=min(800,200+elapsed×rate)，remaining=dueTurn−current.turn>0；due=start+duration；rate核、startSnapshot、费用与输入完整重算；completed保持current800、remaining0、completedTurn=dueTurn且completion恰一次
- inventory reserved恒0且quantity≤cap；Start/Advance不写任何库存；Produce只写1..3目标；4完全恒等
- security/troops/morale/patrolUsedTurn恒等genesis；Start/Produce不改clock；除了tick恢复外AP没有来源；所有新非tick固定消耗20
- TP只有初始force账+最多一次完成actualDelta，scope始终genesis-plus-construction-completion-only；Produce不改此账，ordinaryTechniquePoints明确not-modeled，**绝非原作普通TP=0或native总账已完整**
- history剩槽64−revision≥active remaining；全域尺寸闭合并不替代该不变量

任意late失败（writer、phase resolver、反查、全receipt/history或包装预算）都不发布候选。save/load/replay与create无内部可变持久状态；preview用同transition后仅投影成功包，不能特殊绕开gate。

## 8. 保存、所有旧duplicate和replay

fitRoot对每一已重建/新accepted prefix逐包检查：State；{ok,state}；Inspect；raw SaveEnvelope；转义后的SaveResult；当前最新receipt的Execute和Preview；**历史每一个**receipt与最新State/Current组成的duplicate Execute和Preview。每包独立预算，不组成额外duplicate数组。不能只核最新tick小receipt。

load只接正确save tag，安全parse后完整rebuild；失败不部分恢复。历史任何余额、job.current、rate/evidence、费用/成长、used/acted/reservation、policy/catalog、envelope或receipt篡改都由完整fold拒绝；digest同也不豁免。

replay先detach整个trace及顶层exact tag；parse scenario、attempts长度、每attempt外层exact键，然后initialState。逐attempt按相同envelope/transition产生成功或Failure outcome，failed/duplicate不增history；失败可以继续下一attempt。expected非null时全文比较；mismatch报comparison/trace-outcome-mismatch，index为该attempt、state=null。每次增加outcome后检查整个{ok,state,outcomes}；聚合预算失败报budget-exceeded/index=null/state=null，绝不伪装某一业务失败或返回半份成功state。最终expectedFinalState非null时全文比较，失败index=null；最终成功仍完整预算。任意恶意大input可先安全预算拒绝。

本文§9分别给出可达核心包和合法512 outcomes全聚合的纸面上界。Trace input若携带任意假的expected可被安全预算/比较拒绝；合法且完整expected的输入包装亦纳入证明，不能把输入allow512错误等同任意内容都有效。Trace输入和ReplayResult输出是两个各自受同一上限约束的API数据包，没有任何API返回 `{trace,result}` 或将它们合成一个包；因此各包独立证明，绝不既遗漏expected输入，也不凭空把两包的nodes/bytes相加成一个未承诺DTO。内存占用/性能不在本纸面JSON预算结论内。

## 9. 全域静态预算证明

以下是字段计数与整数代数的保守上界，不是 serializer、产品序列或运行测量。保证覆盖全部合法可达前缀、任意 active job 的完整完成尾、每一个旧 receipt 与最新 state/current 组成的 duplicate 包，以及合法的完整 512 尝试 trace/replay。所有实际安全读取与 fitRoot 检查仍必须保留。

节点定义：object、array、scalar 和 null 每个计 1，key 不计 node；同一引用出现在两个位置时按两份展开计数。root depth=0。普通 ID≤64 ASCII bytes，JobId≤68；固定字面量≤68 UTF-8 bytes，key≤64。中文目录 name 是 6 或 9 UTF-8 bytes，并非 2 或 3 个字节。一般字符串含引号≤70；每条树边的 key/冒号/逗号≤68，因此普通 DTO 有 `B≤70N+68(N−1)<140N`。唯一特殊长字符串 SaveResult.serialized 另算二次转义。

### 9.1 完整结构计数

|结构|节点上界及所含内容|
|---|---|
|ProductionCalculation / ProductionAudit / ProductionDetail|93 / 191 / 192；两核、完整字段、三人奖励及 null/false 全计|
|RateEvidence / RateReceipt / RateInput / Work|20 / 37 / 7 / 42；六组 evidence 全文保留|
|Completion|80；真实 TP Write、三人奖励和释放 ID|
|StartSnapshot|实际28，采用30|
|active / completed Job|实际125 / 204；含 Snapshot 放宽的中间界127 / 206，最终采用130 / 210|
|StartDetail / 完成 TickDetail|315 / 97；完整 unitChecks、reservation 和两份 completion 的各自存放位置|
|ConstructionCatalog / 选定 ConstructionPolicy / DomesticPolicies / Policy|153 / 144 / 58 / 228；所有未用于该动作但必须保存的固定字段仍计数|
|Scenario|实际762，采用800|
|Current|无 job 部分143，completed job 再加210；总353，采用360|
|Start / Produce / Tick Receipt|365 / 240 / 140|
|Start / Produce / Tick history entry|378 / 253 / 146；entry.envelope 与 receipt.envelope 分别计算|

当前 completed job 的完整 rate/evidence 不与旧 Start receipt 中的 active job 合并；job.completion 和 tick.completions 两份完整 Completion 也不合并。所有 tick 都按含 Completion 上估，即使最多只有一次完成。

设 P/S/T 为成功 Produce/Start/Advance 的次数。每个新非 tick 命令恰扣20 AP，初始最多255，每 tick 实际恢复最多20，因此：

`20(P+S)≤255+20T≤495`，所以 `P+S≤24`；`S≤1`、`T≤12`，完整接受历史最多36条。

零价格、零入库仍扣20 AP；failed、preview 和 duplicate 不增加资源；完成不另发 AP。因此没有遗漏可绕过该资源界的命令。

`N(State)≤5+800+(143+210S)+1+378S+253P+146T`

`=949+253(P+S)+335S+146T≤9108<9200`。

### 9.2 全部 receipt 的直接字节界

对 k 个 key 的 object 采用保守开销 `2+Σ(keyBytes+4+B(value))`，对 array 采用 `2+Σ(1+B(item))`。Start 是最大 receipt；直接字段界如下，不能只用最新小 tick 来估旧 duplicate：

|部分|UTF-8 bytes 上界|
|---|---:|
|StartSnapshot|1,000|
|完整 RateEvidence / RateReceipt / RateInput / Work|450 / 900 / 110 / 1,000|
|ConstructionWrite / ConstructionFees|220 / 470|
|active Job|3,700|
|FacilityRow|500|
|16个 UnitChecks|4,200|
|完整 StartReservations|1,200|
|StartDetail|9,700|
|Envelope|620|
|Receipt 公共壳|1,500|

active Job 的22个 key 长度合计189，key/标点开销 `2+189+4×22=279`；13个标量≤430，其余完整复合项≤2881，所以 `279+430+2881=3590<3700`。复合项为 officerIds203、politics14、双 Date80、Work1000、Snapshot1000、RateInput110、Fees470、completion null4；没有删掉证据来压缩。

`B(StartReceipt)≤1500+620+9700=11820<12000`。

Produce 的完整 calculation≤3400、audit≤6100、detail≤6120，故 receipt≤8240。Completion≤2600、完整 tick detail≤3100，故 tick receipt≤5220。任何 Failure≤600。统一 Receipt≤12000，ReplayOutcome≤12050；没有自由错误文本、整份 Current 或 private frame 偷渡到 receipt。

### 9.3 所有公共包装和512次尝试

|独立 API 包|nodes上界|canonical UTF-8 bytes上界|depth上界|
|---|---:|---:|---:|
|State|9,200|1,288,000|14|
|create/load `{ok,state}`|9,202|1,288,280|15|
|Inspect|367|51,380|12|
|raw SaveEnvelope|9,202|1,288,280|15|
|escaped SaveResult|3|2,576,587|1|
|新 Execute / 任意旧 ID duplicate|9,569|1,339,660|15|
|新 Preview / 任意旧 ID duplicate|730|102,200|13|
|ReplayResult，512个完整outcome|197,619|7,459,000|15|
|Trace，512个完整合法expected及finalState|205,075|7,902,000|15|

SaveResult 中 serialized 是完整 raw SaveEnvelope 文本。外层 JSON 编码将引号/反斜线最多翻倍，中文 UTF-8 不按 UTF-16 长度计算；固定外壳含双引号27 bytes，因此 `2×1288280+27=2576587`。只验证 raw save 不足以证明 escaped 返回包。

ReplayOutcome≤368 nodes/12050 bytes：

- ReplayResult 节点：`9203+512×368=197619`
- ReplayResult 字节：`29+4+1288000+2+512×12051=7458147`，采用7459000
- Trace 每个 attempt≤381 nodes/12696 bytes，包含完整 envelope 和 expected outcome
- Trace 节点：`10003+512×381=205075`
- Trace 字节：`55+58+112000+2+512×12697+1288000=7900979`，采用7902000

上述界包含512次重复最大旧 Start receipt，以及合法 command ID 冲突、stale、业务失败；expected 为实际相同的完整结果，expectedFinalState 也完整保留。任意虚构巨大 expected 或不闭合输入仍可在安全门/比较处拒绝。Trace 输入和 ReplayResult 输出是两个独立 API 包，不返回未承诺的 `{trace,result}` 联合包；这些界不证明同时占用的进程内存。

最大数组512、最大对象22键，所有包 depth≤15；分别小于4096、128、48。最紧 Trace 比8,388,608少486,608 bytes，比250,000少44,925 nodes。五种预算分别成立，不能只以节点数代替字节、深度、数组或键数。

### 9.4 任意合法 active 前缀的完成尾

取任意合法可达 active State，D=remainingTurns，1≤D≤10。仅追加 D 次新 ID、正确 expectedRevision 的 Advance：

1. Start 已验证 due 在剩余窗口内，create 已验证完整日期/turn 可表示；每次正好推进一旬，故到期之前没有 horizon/溢出阻断
2. AP 的 +20 饱和写总有定义，不要求金钱、available、外敌或旧 acted 条件；只有唯一 clock 和一次恢复
3. 双向人员/设施预约保持；没有另一任务、取消、拆除或归属变化。工作量为 `min(800,200+elapsed×rate)`，ceil 工期保证到期时 current=800、remaining=0，turn/date 匹配
4. TP/XP/merit 已满也只裁剪并记录 discarded，不拒绝合法完成。phase 使用当前 force/人物/设施真实引用，奖励恰一次
5. 每 tick 消耗一条历史并让 D减1，预留槽不变量保持；即使使用更松 `revision+D≤36+10=46<64` 也足够
6. 每个尾前缀仍符合 `P+S≤24,S≤1,T≤12`；上述界已按 completed job 与所有 tick Completion 上估，并覆盖 save、旧 duplicate 和合法512次包装，所以不会因最后新增完成审计而锁死

本结论只保证任务完成，不保证完工后有钱/AP/可用人员/设施机会或额外旬用于生产。若恰最后一旬完成且只有参建者，他们该旬已 acted，又不能再 Advance；这仍是合同内的合法完成结局。

若增加任何 DTO 字段、开放字符串、放宽人物/设施/命令域、增加 AP 来源、允许回收 job 或增加返回组合，上述证明必须重新建立，不能继续沿用数字。静态数学界不等同 schema validator、编译或运行验收。

## 10. 来源、兼容性与非目标

源身份见[完整来源清单](../../data/sources/bounded-forge-development-production-v1.json)。基础实现固定于提交 `3a4cb15558ffa76d158fb0b84c13312b34d7f092`；这些链接是已存在实现的源码来源，不是新根已发布的证明：

- [construction leaves](https://github.com/DanielMax937/sanguozhi/blob/3a4cb15558ffa76d158fb0b84c13312b34d7f092/packages/engine/src/internal/facility-construction-leaves.ts)：calculateConstructionDevelopment、精确 ConstructionWrite 和完整速率 receipt
- [construction phases](https://github.com/DanielMax937/sanguozhi/blob/3a4cb15558ffa76d158fb0b84c13312b34d7f092/packages/engine/src/internal/facility-construction-phases.ts)：clock-free work 推进、真实当前账的逐人完工写序
- [ordinary reducer](https://github.com/DanielMax937/sanguozhi/blob/3a4cb15558ffa76d158fb0b84c13312b34d7f092/packages/engine/src/internal/city-instant-reducer.ts)与[domestic leaves](https://github.com/DanielMax937/sanguozhi/blob/3a4cb15558ffa76d158fb0b84c13312b34d7f092/packages/engine/src/internal/city-domestic-leaves.ts)：既有 Produce 顺序、完整 audit 和 facilityApplied=false
- [construction rate](https://github.com/DanielMax937/sanguozhi/blob/3a4cb15558ffa76d158fb0b84c13312b34d7f092/packages/engine/src/domestic-construction-rate.ts)、[price](https://github.com/DanielMax937/sanguozhi/blob/3a4cb15558ffa76d158fb0b84c13312b34d7f092/packages/engine/src/production-price.ts)、[quantity](https://github.com/DanielMax937/sanguozhi/blob/3a4cb15558ffa76d158fb0b84c13312b34d7f092/packages/engine/src/production-quantity.ts)：现有数值核，不另造近似替代

原公开 listing 与 MOD 排除、getter/设施表稳定假设见[规则来源一节](../rules/bounded-forge-development-production.md#9-政策与证据边界)。普通生产经验属性仍采用既有 intelligence 兼容政策，[命令来源](../sources/city-command-lifecycle.json)的 `quantityXpConflict` 没有因此解决。其他原生 writer、库存 cap、人员任务、AP 与成长、完整 TP、原生调度或 clean-stock/跨平台等价仍未建立。

800是目录文献耐久输入与独立 construction work 上限，不是战斗 HP。不存在 HP、repair、income、merchant、piece、取消、升级、吸收、ownership 变化、全世界任务或 RNG；不接受任何旧根 state/save，不以重置 genesis 迁移其余额和历史。普通 TP 明确未建模，receipt 中 `nativeIntegration=false` 不得省略。
