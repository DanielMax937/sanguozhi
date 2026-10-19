# 有限市场施工、动态月金与完整普通官薪：工程接口

`bounded-market-income-payroll-v1` 把一个市场建设任务、月初金收入和完整普通官薪置于同一个 owner、时钟和金账本中。它是有明确范围的 simulation profile；施工写点、调度、资源容量和保留金仍是具名 provisional engine 政策，不能称为原版精确复原或完整城市财政。

本文描述闭合接口、所有审计字段、失败顺序、完整重算和静态容量证明。示例与边界数值均为纸面整数推导，没有执行测试、编译、typecheck、build、runtime、validator、场景或产品尺寸测量；静态预算不是运行结果。规则说明见[详细规则](../rules/bounded-market-income-payroll.md)。

## 0. 入口、范围与实现位置

- 行为恰两个命令：`StartMarketDevelopment`、`AdvanceSharedMarketTurn`
- 单城、单 force、单 corps，最初 0 或 1 座完整 Lv1 市场，恰一空 lot，最终最多 2 市场
- 完整固定的 1..8 名普通有名官职人员，最多 1 个永久保留的 development job，最多 12 旬、13 accepted commands、32 trace attempts
- 不支持粮、季节治安下降、灾害、收入技能、兵装月产、普通生产、商人、巡察、吸收、升级、取消、拆除、欠薪后果、贷款、HP、维修、伤害或 ownership 变更；P078 及其依赖排除
- 这些上限只属于新 profile，不缩小既有 construction/forge 的 512/128 域或既有 finance 的输入域

公开 owner：[bounded-market-income-payroll.ts](../../packages/engine/src/bounded-market-income-payroll.ts)。闭合类型、固定数据、安全 JSON、失败协议和窄适配分别位于同目录 `internal/bounded-market-income-payroll-{types,data,json,errors,adapter}.ts`。根负责唯一 transition、clock、full fold 和包装预算；adapter 只在真实 candidate ledger 上调用已交付 phases，不另有 State、钱包、child clock 或可序列化 callback。

固定[政策](../../data/policies/bounded-market-income-payroll-v1.json)、[schema](../../data/schemas/bounded-market-income-payroll-v1.schema.json)、[纸面示例输入](../../data/scenarios/bounded-market-income-payroll-example-v1.json)与[来源](../../data/sources/bounded-market-income-payroll-v1.json)分别承担完整值、结构、静态示例和证据边界。示例文件不是运行 receipt。

## 1. 全局闭合和类型记法

下面给出 DTO 与签名；数值范围、相关联合和完整常量相等检查同样是接口的一部分。每个object恰列出全部键；无任意字段、开放audit、any、unknown内部DTO。union按分支exact required；数组稠密、顺序有意义。入口unknown是安全读取边界，不能进入重建后的DTO。所有返回detached并递归冻结，public aliases全部DeepReadonly；不修改或冻结输入。

Id匹配^[A-Za-z0-9][A-Za-z0-9_.:-]{0,63}$，ASCII1..64bytes；JobId恰job:+开工envelope.id，5..68bytes；Digest64小写hex；Blob40小写hex。普通numbers为有限安全整数，拒绝-0、NaN/Infinity、BigInt/coercion。balance/cap/XP/merit0..1e9，AP0..255，TP0..10000。Date year1..9999/month1..12/day1|11|21。初turn0..MAX_SAFE_INTEGER-advanceLimit；Marker=null或0..对应turn。Position q/r∈[-1000000,1000000]，hex distance=max(abs(dq),abs(dr),abs(dq+dr))≤4000000。

```ts
type DeepReadonly<T> = T extends object ? {readonly [K in keyof T]:DeepReadonly<T[K]>}:T;
type Id=string; type JobId=string; type Digest=string; type Blob=string;
type Marker=number|null;
type Thirty<T>=[T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T];
type DateV1={year:number;month:number;day:1|11|21};
type Position={q:number;r:number};
type Clock={date:DateV1;turn:number;advancedCount:number};
type Progress={leadershipXp:number;charmXp:number;intelligenceXp:number;
 politicsXp:number;warXp:number;merit:number;actedTurn:Marker};
type OfficerFacts={id:Id;forceId:Id;cityId:Id;role:'ordinary-officer';
 officeId:number;politics:number;available:boolean;incomeSkills:[];initial:Progress};
type Lot={id:Id;cityId:Id;position:Position};
type ExistingMarket={id:Id;lotId:Id;cityId:Id;kind:'market';level:1;complete:true};
type Unit={id:Id;forceId:Id;position:Position};
type SourceBinding={path:string;gitBlobSha1:Blob;sha256:Digest};
type SourceBindings={constructionPolicy:SourceBinding;constructionCatalog:SourceBinding;
 offices:SourceBinding;financePolicy:SourceBinding;financeFacilities:SourceBinding;
 moneySource:SourceBinding;rateSource:SourceBinding};
type SourceBoundary={level:'source-kernels-with-provisional-owner';
 adapterObservationKind:'derived-adapter-observations';
 ownership:'provisional-engine-rule';scheduling:'provisional-engine-rule';
 writers:'provisional-engine-rule';reserve:'provisional-engine-rule';
 nativeExecution:false;stockVerified:false;nativeFullFinance:false;
 nativePayrollConsequences:false;nativeScheduler:false;nativeHp:false};
type Scenario={schemaVersion:1;profile:'bounded-market-income-payroll-v1';episodeId:Id;
 clock:{date:DateV1;turn:number};advanceLimit:number;activeForceId:Id;
 force:{id:Id;initialTechniquePoints:number};
 corps:{id:Id;forceId:Id;initialActionPoints:number};
 city:{id:Id;kind:'city';ownerForceId:Id;position:Position;
 goldCapacity:number;initialGold:number;security:number};
 completeResidentRoster:true;prisonerCount:0;officers:OfficerFacts[];
 lots:Lot[];facilities:ExistingMarket[];facilityLotSlots:Thirty<Id|null>;
 baseMoneyWord:number;difficulty:'normal';controller:'player'|'ai';
 constructionEnvironment:{completeFieldUnits:true;hostileForceIds:Id[];fieldUnits:Unit[]};
 constructionCatalog:ConstructionCatalog;officesCatalog:OfficesCatalog;
 policy:Policy;sourceBindings:SourceBindings};
```

Scenario全部23键按上述顺序解释。advanceLimit1..12；goldCapacity0..1e9，initialGold≤cap；security0..100固定；baseMoneyWord0..65535。完整日期窗口先校验，创建当天无补发。force.id=activeForceId=city.ownerForceId=corps.forceId。人员1..8，ID与officeId各唯一，officeId恰目录0..79；role唯一ordinary-officer、每人同城同force，politics0..100、incomeSkills恰[]。完整名单是调用者明确声明的封闭世界事实；不能从未提供人员推断确实无人遗漏，更不能默认为外部真实存档完整。busy/available=false/acted的名单成员照常付薪。政治固定，XP不自动改属性；五项XP及merit全保留，非政治XP只复制恒定不改。

lots.length=facilities.length+1∈1..2；同城，ID/坐标唯一，不与city同格；初设施0..1、只complete市场Lv1，lot存在且不重占。facilityLotSlots恰30，每个已供lot恰出现一次，其他恰null；不可重复lot、未知lot或漏lot；占空lot也保留其slot中的lotId，设施ID映射在月界重新求。声明未提供设施全部不存在是新profile范围，不拿缺数据当原作空设施。

外部单位0..16，ID唯一；hostileForceIds0..16唯一且不含owner。单位/敌对/位置全窗固定，异势力不自动敌对。只有开工检查城心距离≤2，advance不重查。各类ID分别唯一，不要求不同实体类别跨域不重名。

## 2. 固定政策、目录、来源

ConstructionCatalog=附录C完整JSON const；OfficesCatalog=附录O完整JSON const。它们每个值、键、顺序都固定，不能只验版本/digest或删除未使用行。薪资查目录monthlySalary，不接收调用者薪资sum或身份替代值；office80明确不支持。建设查询market/type31/Lv1/D500/cost200/completionTP30；income yield100。ConstructionPolicy=附录P.common完整11键，另加apRecoveryPolicies[0]、initialWorkPolicies[0]、rewardPolicies[0]、completionActorPolicies[0]四个完整对象，键名分别apRecovery/initialWork/rewards/completionActors。旧common较大budget和calendar仅作为完整来源参数保留，本根更窄Policy.budgets优先执行。

FinancePolicies只取附录F的完整payroll/credit/debit对象，恰三个键，逐值const。所选credit/debit完整语义不删；finance其他粮/季节/特产政策仍在原服务，未假称本根执行。SourceBindings 七行的精确 path/blob/SHA 见本文来源节，属于固定 const 而非任意 string。[来源文件](../../data/sources/bounded-market-income-payroll-v1.json)保留完整来源身份、原 source 的 source/license/original 范围/未证事实、政策代价及本节边界；不把原始listing长bytesHex复制入每个save或receipt。完整金核自身Evidence和rate Evidence仍逐receipt原样保留。

```ts
type ConstructionCatalog=typeof C;
type OfficesCatalog=typeof O;
type ConstructionPolicy=typeof P.common & {apRecovery:typeof P.apRecoveryPolicies[0];
 initialWork:typeof P.initialWorkPolicies[0];rewards:typeof P.rewardPolicies[0];
 completionActors:typeof P.completionActorPolicies[0]};
type FinancePolicies={payroll:typeof F.payroll;credit:typeof F.credit;debit:typeof F.debit};
type ReservePolicy={id:'remaining-window-salary-reserve-v1';
 count:'floor((dayOffset+remainingAdvances)/3)';
 requirement:'gold>=monthStarts*monthlySalary';
 start:'gold-200>=required';borrowFutureIncome:false;
 prepaid:false;separateWallet:false;nativeRuleVerified:false};
type Policy={id:'bounded-market-income-payroll-v1';version:1;
 clock:'root-completion-income-payroll-v1';
 ownership:'fixed-supplied-city-corps-force-v1';
 transaction:'one-command-all-or-nothing-v1';
 reservation:'root-bidirectional-market-lock-v1';
 externalFacts:'fixed-for-entire-bounded-episode-v1';
 security:'fixed-no-seasonal-loss-v1';incomeSkills:'none';food:'not-modeled';
 payrollIdentity:'complete-fixed-ordinary-roster-v1';
 reserve:ReservePolicy;construction:ConstructionPolicy;finance:FinancePolicies;
 budgets:{acceptedCommands:13;traceAttempts:32;maxJobs:1;maxAdvances:12;
 maxOfficers:8;maxLots:2;maxFacilities:2;maxFieldUnits:16;maxHostileForces:16;
 maxUtf8Bytes:8388608;maxNodes:250000;maxDepth:48;maxArray:4096;maxObjectKeys:128}};
```

F/P/C/O是附录 JSON 常量名称，非未定义实现全局；实际类型由完整字面常量derive或显式readonly const结构生成。包括type alias ConstructionCatalog、OfficesCatalog、ConstructionPolicy，不引入 any/unknown 或省略键的 schema；附录提供完整固定值，领域边界逐值比较。

这是有意保守的流动性政策：可能拒绝未来税收足以付工资的开工。R不占仓、不提前扣薪、不另钱包；当前可支出额gold−R。名单/office/窗口/能力/治安全固定，新功能不允许用未来收入借款。名单变更、额外支出、欠薪和忠诚/人口后果均不在这个固定 profile 内；需要不同机制时须定义新的版本及其完整证明。

## 3. 施工完整核与唯一current

```ts
type RateInput={profile:'domestic-construction-rate-stable-v1';politics:number[];facilityDurability:500};
type RateEvidence={slotsAndStablePolitics:['005BB1E0..005BB213'];
 politicsHalfAndAdd:['005BB23E..005BB247'];
 stableFacilityReads:['005BB223','005BB22A','005BB237','005BB249','005BB26C','005BB279','005BB27E'];
 durabilityMinimum:['005BB249..005BB266','005BB26C..005BB29E'];
 selectAndReturn:['005BB268..005BB2AA'];excludedMod:['*005BB263..*008A9DFD']};
type RateReceipt={supported:true;profile:'domestic-construction-rate-stable-v1';
 politics:[number|null,number|null,number|null];facilityDurability:500;
 politicsSum:number;maxPolitics:number;halfPoliticsSum:number;politicsRate:number;
 durabilityQuarter:125;durabilityRemainder:375;durabilityMinimum:41;
 rate:number;selectedBranch:'politics'|'durability-minimum';evidence:RateEvidence};
type ConstructionWritePolicyId='facility-exact-debit-saturating-reward-v1'
 |'facility-community-rewards-v1'|'facility-ap20-cap255-v1';
type ConstructionWrite={before:number;requestedDelta:number;actualDelta:number;
 after:number;cap:number;discarded:number;policyId:ConstructionWritePolicyId};
type OfficerRow=Progress & {id:Id;politics:number;reservationJobId:JobId|null};
type FacilityRow={id:Id;lotId:Id;cityId:Id;kind:'market';targetLevel:1;typeId:31;
 status:'developing'|'complete';effectiveLevel:0|1;jobId:JobId|null};
type Ledger={gold:number;goldCapacity:number;actionPoints:number;security:number;
 force:{techniquePoints:number};officers:OfficerRow[];facilities:FacilityRow[]};
type ConstructionReward={officerId:Id;politicsXp:ConstructionWrite;merit:ConstructionWrite;
 politicsBefore:number;politicsAfter:number};
type Completion={jobId:JobId;facilityId:Id;typeId:31;level:1;effectiveLevel:1;
 techniquePoints:ConstructionWrite;rewards:ConstructionReward[];releasedOfficerIds:Id[];
 policyId:'next-boundary-capped-work-v1'};
type StartSnapshot={clock:{date:DateV1;turn:number};activeForceId:Id;corpsId:Id;cityId:Id;
 lot:Lot;officers:{id:Id;politics:number}[];policyDigest:Digest;constructionCatalogDigest:Digest};
type ConstructionFees={actionPoints:ConstructionWrite;gold:ConstructionWrite};
type Work={initial:125;current:number;required:500;perAdvance:number;rate:RateReceipt};
type Job={id:JobId;kind:'development';facilityKind:'market';cityId:Id;lotId:Id;facilityId:Id;
 fromLevel:0;targetLevel:1;officerIds:Id[];politics:number[];startTurn:number;startDate:DateV1;
 dueTurn:number;dueDate:DateV1;durationTurns:number;remainingTurns:number;work:Work;
 startSnapshot:StartSnapshot;rateInput:RateInput;fees:ConstructionFees;
 completedTurn:Marker;completion:Completion|null};
type Current={clock:Clock;ledger:Ledger;jobs:Job[]};
type Reserve={monthlySalary:number;remainingAdvances:number;monthStarts:number;
 required:number;gold:number;spendableGold:number};
```

RateInput政治按选择1..3人顺序，不带null；output补齐三槽，sum0..300/max0..100/half0..150/politicsRate0..250。rate=max(politicsRate,41)∈41..250，duration=ceil(375/rate)∈2..10，work125..500；最短2旬，不能套forge最短1旬。必须实际调用已交付calculateConstructionDevelopment→原rate核，保留完整输入/result/evidence。

Write负请求精确扣；正请求actual=min(request,cap−before)、discarded=request−actual。开工AP−20 cap255与gold−200 cap真实goldCapacity，用construction.writer.id；恢复AP+20、cap255、apRecovery.id；完成TP+30 cap10000、writer.id；每人政治XP+3/merit+100 cap1e9、rewards.id，饱和0增量亦完整记录。其它4XP保持原值。所有正负writer均禁止-0，0保持+0。

ledger.gold是唯一可变金余额。ledger.goldCapacity只为private owned gold target的真实readonly视图键，必须等genesis.city.goldCapacity且任何phase不得改它；security同样固定。没有finance snapshot或影子wallet。Current不存R余额，Reserve完全派生。Clock唯一；revision在State不在第二child。

jobs.length0..1，完成永久保留。active: remaining1..10、completedTurn/completion=null、work<500；completed: remaining0、work500、completedTurn=dueTurn、完整completion。officerIds与politics均1..3同顺序。初设施固定顺序，新增append唯一一项；developing/effective0/job=id，complete/effective1/job=null。完成job与tick中Completion分别完整深副本，历史Start中的job是开工active副本，永不随current变化。

R推导：n=advanceLimit−clock.advancedCount，d=day1/11/21对应0/1/2；H=floor((d+n)/3)，W=按ID排序全部目录工资之和，R=H×W。Reserve各域W10..480、n0..12、H0..4、R0..1920、gold0..cap、spendableGold=gold−R≥0。完整日历枚举进入day1次数须等H；当前day1不算补发。创建要求gold≥R，开工要求gold−200≥R；创建不要求gold≥200+R。W0仍是旧finance合法域，绝不扩给本根1..8人员。

## 4. 月初金核、完整工资与金链

```ts
type MoneySlot=null|{facilityTypeWord:31;constructionWord:0}
 |{facilityTypeWord:31;constructionWord:1;adjacentMint:false};
type MoneyTypeRows={31:{valid:true;moneyYieldWord:100};50:{valid:true;moneyYieldWord:120};
 51:{valid:true;moneyYieldWord:150};46:{valid:true;moneyYieldWord:300};
 47:{valid:true;moneyYieldWord:200};48:{valid:true;moneyYieldWord:80}};
type MoneyInput={profile:'city-money-income-stable-resolved-i32-safe-v1';
 baseMoneyWord:number;slots:Thirty<MoneySlot>;resolvedTypeRows:MoneyTypeRows;
 difficultyWord:1;securityByte:number};
type MoneyEvidence={level:'source-listing-reconstruction';
 profile:'city-money-income-stable-resolved-i32-safe-v1';
 source:'docs/sources/city-money-income-projection.json';
 originalRange:'0049E590 <= PC < 0049E745';fullCallerBytesVerified:true;
 entryGatesIntegrated:false;stableResolvedInputsRequired:true;stockOriginalVerified:false;
 originalExecutableExecuted:false;nativeHelpersReconstructed:false;abiVerified:false;
 realTraceReachabilityVerified:false;typeTableStockVerified:false;adjacencyHelperRecovered:false;
 rngRecovered:false;monthlySchedulerIntegrated:false;incomeWriterIntegrated:false;
 commandIntegrated:false;modBehaviorIncluded:false};
type MoneySlotReceipt={index:number;facilityTypeWord:31|null;effectiveType:31|null;
 status:'invalid-slot'|'unfinished'|'yield';moneyYieldWord:100|null;
 mintApplied:false;contribution:0|100};
type MoneyIntermediates={scaledRaw:number;difficultyProduct:null;difficultyAdjusted:number;
 securityProduct:number;securityAdjusted:number};
type MoneyResult={supported:true;profile:'city-money-income-stable-resolved-i32-safe-v1';
 baseMoneyWord:number;difficultyWord:1;securityByte:number;slots:Thirty<MoneySlotReceipt>;
 rawMoney:number;difficultyPercent:100;effectiveSecurity:number;
 intermediates:MoneyIntermediates;returnedIncome:number;evidence:MoneyEvidence};
type MoneyKernelCall={status:'called';api:'calculateCityMoneyIncomeProjection';
 profile:'city-money-income-stable-resolved-i32-safe-v1';
 adapterObservationKind:'derived-adapter-observations';input:MoneyInput;result:MoneyResult};
type MoneyKernelNotDue={status:'not-due';reason:'nonmonthly-without-taxation'};
type GoldWrite={resource:'gold';reason:'money-base'|'salary';before:number;requested:number;
 accepted:number;actualDelta:number;after:number;cap:number;discarded:number;
 writerPolicyId:'saturating-positive-credit-v1'|'exact-affordable-salary-debit-v1'};
type SalaryItem={officerId:Id;officeId:number;officeName:string;catalogSalary:number};
type Salary={items:SalaryItem[];sum:number;shortfall:0;
 payerPolicyId:'complete-named-office-payroll-v1'} & (
 {status:'paid';availableBeforeSalary:number;paid:number} |
 {status:'not-due';availableBeforeSalary:null;paid:0});
type MonthlyReceipt={securityBeforeIncome:number;payerCityId:Id;
 payrollOfficerIds:Id[];incomeEffects:{taxation:false;wealthy:false}} & (
 {status:'not-due';settlement:null;facilityIds:null;moneyKernel:MoneyKernelNotDue;
 writes:[];salary:Salary & {status:'not-due'}} |
 {status:'settled';settlement:{cityId:Id;year:number;month:number};
 facilityIds:Thirty<Id|null>;moneyKernel:MoneyKernelCall;
 writes:[GoldWrite,GoldWrite];salary:Salary & {status:'paid'}});
```

MonthlyReceipt是相关联合（schema 用 oneOf 表达）：not-due⇒settlement/facilityIds=null、notDue核、writes=[]、salary.status=not-due/available=null/paid0；settled⇒settlement=newDate年月/真实city、完整facilityIds/Called、writes恰[收入,工资]、salary paid/available非null/paid=sum。两支salary.items完整1..8、sum=W、payrollOfficerIds同排序、shortfall0。officeName精确匹配完整目录（UTF8最多12bytes），catalogSalary10..60；不允许自填工资、略去busy人员或只存total。incomeEffects两个false是明确本根不支持技能，原finance四技能域不变。

30槽：genesis.facilityLotSlots[i]为null或其lot当前无设施⇒facilityIds[i]=null及slot=null；developing⇒facilityId真实id、type31/construction0且必须没有adjacentMint；complete⇒type31/construction1/adjacentMint=false。先根completion后适配，所以恰在1日完成计入当月，是具名可替换新政策，不声称原scheduler顺序已恢复。安全security取固定真实current.security；无太守伪字段，normal difficulty1且没有cityPlayerPredicate。六个resolved rows完整保留，不缩到只有31。

原核实际调用；支持返回须每字段/30receipt/evidence完整读取并原样保留，不能用手算M替换。slots[i].index=i；null→invalid-slot/effective=null/yield=null/contribution0；developing→unfinished/effective=null/yield=null/contribution0；complete→yield/effective31/yield100/contribution100；mint false。rawMoney=base+100×completeCount≤65735；effectiveSecurity=max(50,security)50..100；scaledRaw=difficultyAdjusted=raw×100≤6573500；difficultyProduct=null；securityProduct≤657350000<2^31；securityAdjusted=floor(product/100)≤6573500；M=floor(securityAdjusted/100)≤65735。profile较原核收窄，但绝不改旧核输入域。

收入先clip：requested=M，accepted=min(M,cap−G)，actualDelta=accepted，after=G+accepted，discarded=M−accepted。即M0或满仓也保留收入write。工资随后exact W：before=收入after，requested/accepted/paid=W，actualDelta=−W，after=before−W，discarded0；cap同真实cap。先clip再薪禁止替换为净额M−W。月初工资phase以同一ledger对象为target。monthly status不能掩盖不足：任何phase unsupported-salary-shortfall仍原子拒绝并保留proposal；在合法本根可达域保留金证明使其不可能正常出现。

每条金审计链：从genesis.initialGold开始按accepted history排序；Start的fees.gold.before=上一G、after=G−200；tick非月无金写；月tick income.before=上一G，salary.before=income.after，最终G=salary.after；同条Reserve.before.gold和after.gold分别对应链端；每条receipt.currentDigestBefore/After对完整Current计算。最终G=initialGold−200×Start数+Σincome.actualDelta−Σsalary.accepted。保留金不是该等式中的一笔支出。fullfold逐笔重算而非只核净余额。

## 5. 命令、完整receipt和公开包装

```ts
type StartCommand={type:'StartMarketDevelopment';cityId:Id;lotId:Id;facilityId:Id;officerIds:Id[]};
type AdvanceCommand={type:'AdvanceSharedMarketTurn'};
type Command=StartCommand|AdvanceCommand;
type Envelope={id:Id;expectedRevision:number;command:Command};
type UnitCheck={unitId:Id;forceId:Id;position:Position;hostile:boolean;distance:number;blocks:boolean};
type StartReservations={officers:{officerId:Id;jobBefore:null;jobAfter:JobId;
 actedBefore:Marker;actedAfter:number}[];facility:{facilityId:Id;jobBefore:null;jobAfter:JobId};
 lot:{lotId:Id;occupantBefore:null;occupantAfter:Id}};
type StartDetail={job:Job;createdFacility:FacilityRow;unitChecks:UnitCheck[];reservations:StartReservations};
type ProgressAudit={jobId:JobId;remainingBefore:number;remainingAfter:number;workBefore:number;workAfter:number};
type TickDetail={apRecovery:ConstructionWrite;progress:ProgressAudit[];
 completions:Completion[];monthly:MonthlyReceipt};
type CatalogDigests={construction:Digest;offices:Digest};
type ReceiptCommon={envelope:Envelope;revisionBefore:number;revisionAfter:number;
 policyDigest:Digest;catalogDigests:CatalogDigests;sourceDigest:Digest;
 sourceBoundary:SourceBoundary;clockBefore:Clock;clockAfter:Clock;
 currentDigestBefore:Digest;currentDigestAfter:Digest;
 ownerSnapshot:{activeForceId:Id;ownerForceId:Id;corpsId:Id;corpsForceId:Id};
 reserveBefore:Reserve;reserveAfter:Reserve;
 scope:'bounded-shared-market-income-payroll';rngDraws:0;nativeIntegration:false};
type Receipt=ReceiptCommon & ({kind:'market-start';detail:StartDetail}|{kind:'tick';detail:TickDetail});
type State={tag:'san11-bounded-market-income-payroll-state-v1';schemaVersion:1;
 profile:'bounded-market-income-payroll-v1';genesis:Scenario;revision:number;
 current:Current;acceptedCommands:{envelope:Envelope;receipt:Receipt}[]};
type Proposal={required:number;available:number;shortfall:number};
type MoneyKernelReason='invalid-input'|'unexpected-field'|'unsupported-profile'
 |'missing-type-row'|'missing-adjacent-mint'|'unsupported-arithmetic-domain';
type Stage='input'|'rebuild'|'deduplication'|'revision'|'domain'|'construction'
 |'reservation'|'tick'|'money'|'payroll'|'invariant'|'budget'|'comparison';
type Reason='invalid-data'|'invalid-json'|'duplicate-json-key'|'invalid-fields'|'invalid-number'
 |'invalid-id'|'invalid-date'|'invalid-array'|'invalid-prototype'|'duplicate-entity-id'
 |'unsupported-schema'|'unsupported-profile'|'unsupported-policy'|'unsupported-catalog'
 |'unsupported-source'|'unsupported-command'|'unsupported-city-kind'|'unsupported-difficulty'
 |'unsupported-controller'|'unsupported-income-skill'|'unsupported-prisoners'
 |'incomplete-payroll-roster'|'unsupported-payroll-identity'|'duplicate-office'
 |'owner-corps-mismatch'|'officer-city-force-mismatch'|'incomplete-field-unit-snapshot'
 |'owner-marked-hostile'|'invalid-marker'|'invalid-officer-count'|'invalid-lot-layout'
 |'invalid-facility-slots'|'calendar-overflow'|'turn-overflow'|'salary-reserve-shortfall'
 |'command-id-conflict'|'stale-revision'|'history-limit'|'unknown-city'|'unknown-officer'
 |'unknown-facility'|'unknown-lot'|'occupied-lot'|'facility-id-reused'|'officer-unavailable'
 |'officer-already-acted'|'officer-reserved-by-job'|'insufficient-gold'
 |'insufficient-action-points'|'hostile-within-two'|'unsupported-facility'
 |'unsupported-construction-rate'|'nonpositive-construction-rate'|'invalid-duration'
 |'job-history-limit'|'completion-horizon-exceeded'|'completion-history-slots'
 |'advance-limit-reached'|'facility-reservation-mismatch'|'officer-reservation-mismatch'
 |'completion-timing-mismatch'|'incomplete-work'|'insufficient-balance'
 |'money-kernel-rejected'|'unsupported-kernel-return'|'invalid-resource-boundary'
 |'unsupported-salary-shortfall'|'state-recomputation-mismatch'|'history-recomputation-mismatch'
 |'receipt-recomputation-mismatch'|'duplicate-accepted-entry'|'unexpected-phase-effect'
 |'invariant-mismatch'|'budget-exceeded'|'trace-outcome-mismatch'|'trace-final-mismatch';
type Failure={ok:false;committed:false;stage:Stage;reason:Reason;
 blockingUnitId:Id|null;officerId:Id|null;facilityId:Id|null;jobId:JobId|null;
 proposal:Proposal|null;kernelReason:MoneyKernelReason|null;index:number|null};
type CreateOrLoadResult=Failure|{ok:true;state:State};
type InspectResult=Failure|{ok:true;revision:number;current:Current;reserve:Reserve;
 remainingHistorySlots:number;remainingAdvances:number;reservedCompletionSlots:number;
 scope:'bounded-shared-market-income-payroll'};
type ExecuteResult=Failure|{ok:true;committed:boolean;duplicate:boolean;state:State;receipt:Receipt};
type PreviewResult=Failure|{ok:true;committed:false;duplicate:boolean;baseRevision:number;
 projectedCurrent:Current;receipt:Receipt};
type SaveEnvelope={tag:'san11-bounded-market-income-payroll-save-v1';state:State};
type SaveResult=Failure|{ok:true;serialized:string};
type ReplayOutcome=Failure|{ok:true;duplicate:boolean;receipt:Receipt};
type Trace={tag:'san11-bounded-market-income-payroll-trace-v1';scenario:Scenario;
 attempts:{envelope:Envelope;expected:ReplayOutcome|null}[];expectedFinalState:State|null};
type ReplayResult={ok:true;state:State;outcomes:ReplayOutcome[]}|(Failure & {state:null});
```

expectedRevision0..MAX_SAFE_INTEGER，不先截到13；history/revision0..13，Trace attempts0..32。Start officerIds1..3、唯一、输入顺序，所有其它数组界同所引用DTO。unitChecks与原units顺序一致；Start成功全blocks=false；reservations.officers恰选中顺序。Tick progress/completions各0..1；Completion.rewards/releasedIds按原选择1..3顺序。reservedCompletionSlots=active remaining或0；remainingHistory=13−revision。

Proposal仅salary-reserve-shortfall、unsupported-salary-shortfall非null：reserve创建required=R/available=initialGold；开工required=R/available=G−200（普通gold gate保证非负），shortfall=required−available；工资required=W/available=phase见到的gold。其它Failure proposal=null。kernelReason只money-kernel-rejected为原有限reason，其余null。context只明确知道的首个实体ID填写，不猜；index普通API null，rebuild失败为0..12历史索引，replay outcome失败保留普通index，聚合/比较外层失败按下文指定0..31或null。Failure不带stack、message或任意内部对象。

### 精确公开API

```ts
export function createBoundedMarketIncomePayrollV1(input:unknown):BoundedMarketIncomePayrollCreateOrLoadResultV1;
export function inspectBoundedMarketIncomePayrollV1(input:unknown):BoundedMarketIncomePayrollInspectResultV1;
export function previewBoundedMarketIncomePayrollV1(input:unknown,command:unknown):BoundedMarketIncomePayrollPreviewResultV1;
export function executeBoundedMarketIncomePayrollV1(input:unknown,command:unknown):BoundedMarketIncomePayrollExecuteResultV1;
export function saveBoundedMarketIncomePayrollV1(input:unknown):BoundedMarketIncomePayrollSaveResultV1;
export function loadBoundedMarketIncomePayrollV1(serialized:string):BoundedMarketIncomePayrollCreateOrLoadResultV1;
export function replayBoundedMarketIncomePayrollV1(input:unknown):BoundedMarketIncomePayrollReplayResultV1;
export const BOUNDED_MARKET_INCOME_PAYROLL_POLICY:DeepReadonly<Policy>;
```

公开aliases为本 profile所有DTO名称T对应BoundedMarketIncomePayrollTV1=DeepReadonly<T>。完整名称集合（恰下列，不导出私有helper）：Id,JobId,Digest,Blob,Marker,DateV1,Position,Clock,Progress,OfficerFacts,Lot,ExistingMarket,Unit,SourceBinding,SourceBindings,SourceBoundary,Scenario,ConstructionCatalog,OfficesCatalog,ConstructionPolicy,FinancePolicies,ReservePolicy,Policy,RateInput,RateEvidence,RateReceipt,ConstructionWritePolicyId,ConstructionWrite,OfficerRow,FacilityRow,Ledger,ConstructionReward,Completion,StartSnapshot,ConstructionFees,Work,Job,Current,Reserve,MoneySlot,MoneyTypeRows,MoneyInput,MoneyEvidence,MoneySlotReceipt,MoneyIntermediates,MoneyResult,MoneyKernelCall,MoneyKernelNotDue,GoldWrite,SalaryItem,Salary,MonthlyReceipt,StartCommand,AdvanceCommand,Command,Envelope,UnitCheck,StartReservations,StartDetail,ProgressAudit,TickDetail,CatalogDigests,ReceiptCommon,Receipt,State,Proposal,MoneyKernelReason,Stage,Reason,Failure,CreateOrLoadResult,InspectResult,ExecuteResult,PreviewResult,SaveEnvelope,SaveResult,ReplayOutcome,Trace,ReplayResult。DateV1名称别名特例为BoundedMarketIncomePayrollDateV1，避免DateV1V1；DeepReadonly/Thirty为private type constructors不另泛型公开。没有第8行为API或可选配置参数。

### 5.1 全部 79 个公开只读别名

```ts
export type BoundedMarketIncomePayrollIdV1=DeepReadonly<Id>;
export type BoundedMarketIncomePayrollJobIdV1=DeepReadonly<JobId>;
export type BoundedMarketIncomePayrollDigestV1=DeepReadonly<Digest>;
export type BoundedMarketIncomePayrollBlobV1=DeepReadonly<Blob>;
export type BoundedMarketIncomePayrollMarkerV1=DeepReadonly<Marker>;
export type BoundedMarketIncomePayrollDateV1=DeepReadonly<DateV1>;
export type BoundedMarketIncomePayrollPositionV1=DeepReadonly<Position>;
export type BoundedMarketIncomePayrollClockV1=DeepReadonly<Clock>;
export type BoundedMarketIncomePayrollProgressV1=DeepReadonly<Progress>;
export type BoundedMarketIncomePayrollOfficerFactsV1=DeepReadonly<OfficerFacts>;
export type BoundedMarketIncomePayrollLotV1=DeepReadonly<Lot>;
export type BoundedMarketIncomePayrollExistingMarketV1=DeepReadonly<ExistingMarket>;
export type BoundedMarketIncomePayrollUnitV1=DeepReadonly<Unit>;
export type BoundedMarketIncomePayrollSourceBindingV1=DeepReadonly<SourceBinding>;
export type BoundedMarketIncomePayrollSourceBindingsV1=DeepReadonly<SourceBindings>;
export type BoundedMarketIncomePayrollSourceBoundaryV1=DeepReadonly<SourceBoundary>;
export type BoundedMarketIncomePayrollScenarioV1=DeepReadonly<Scenario>;
export type BoundedMarketIncomePayrollConstructionCatalogV1=DeepReadonly<ConstructionCatalog>;
export type BoundedMarketIncomePayrollOfficesCatalogV1=DeepReadonly<OfficesCatalog>;
export type BoundedMarketIncomePayrollConstructionPolicyV1=DeepReadonly<ConstructionPolicy>;
export type BoundedMarketIncomePayrollFinancePoliciesV1=DeepReadonly<FinancePolicies>;
export type BoundedMarketIncomePayrollReservePolicyV1=DeepReadonly<ReservePolicy>;
export type BoundedMarketIncomePayrollPolicyV1=DeepReadonly<Policy>;
export type BoundedMarketIncomePayrollRateInputV1=DeepReadonly<RateInput>;
export type BoundedMarketIncomePayrollRateEvidenceV1=DeepReadonly<RateEvidence>;
export type BoundedMarketIncomePayrollRateReceiptV1=DeepReadonly<RateReceipt>;
export type BoundedMarketIncomePayrollConstructionWritePolicyIdV1=DeepReadonly<ConstructionWritePolicyId>;
export type BoundedMarketIncomePayrollConstructionWriteV1=DeepReadonly<ConstructionWrite>;
export type BoundedMarketIncomePayrollOfficerRowV1=DeepReadonly<OfficerRow>;
export type BoundedMarketIncomePayrollFacilityRowV1=DeepReadonly<FacilityRow>;
export type BoundedMarketIncomePayrollLedgerV1=DeepReadonly<Ledger>;
export type BoundedMarketIncomePayrollConstructionRewardV1=DeepReadonly<ConstructionReward>;
export type BoundedMarketIncomePayrollCompletionV1=DeepReadonly<Completion>;
export type BoundedMarketIncomePayrollStartSnapshotV1=DeepReadonly<StartSnapshot>;
export type BoundedMarketIncomePayrollConstructionFeesV1=DeepReadonly<ConstructionFees>;
export type BoundedMarketIncomePayrollWorkV1=DeepReadonly<Work>;
export type BoundedMarketIncomePayrollJobV1=DeepReadonly<Job>;
export type BoundedMarketIncomePayrollCurrentV1=DeepReadonly<Current>;
export type BoundedMarketIncomePayrollReserveV1=DeepReadonly<Reserve>;
export type BoundedMarketIncomePayrollMoneySlotV1=DeepReadonly<MoneySlot>;
export type BoundedMarketIncomePayrollMoneyTypeRowsV1=DeepReadonly<MoneyTypeRows>;
export type BoundedMarketIncomePayrollMoneyInputV1=DeepReadonly<MoneyInput>;
export type BoundedMarketIncomePayrollMoneyEvidenceV1=DeepReadonly<MoneyEvidence>;
export type BoundedMarketIncomePayrollMoneySlotReceiptV1=DeepReadonly<MoneySlotReceipt>;
export type BoundedMarketIncomePayrollMoneyIntermediatesV1=DeepReadonly<MoneyIntermediates>;
export type BoundedMarketIncomePayrollMoneyResultV1=DeepReadonly<MoneyResult>;
export type BoundedMarketIncomePayrollMoneyKernelCallV1=DeepReadonly<MoneyKernelCall>;
export type BoundedMarketIncomePayrollMoneyKernelNotDueV1=DeepReadonly<MoneyKernelNotDue>;
export type BoundedMarketIncomePayrollGoldWriteV1=DeepReadonly<GoldWrite>;
export type BoundedMarketIncomePayrollSalaryItemV1=DeepReadonly<SalaryItem>;
export type BoundedMarketIncomePayrollSalaryV1=DeepReadonly<Salary>;
export type BoundedMarketIncomePayrollMonthlyReceiptV1=DeepReadonly<MonthlyReceipt>;
export type BoundedMarketIncomePayrollStartCommandV1=DeepReadonly<StartCommand>;
export type BoundedMarketIncomePayrollAdvanceCommandV1=DeepReadonly<AdvanceCommand>;
export type BoundedMarketIncomePayrollCommandV1=DeepReadonly<Command>;
export type BoundedMarketIncomePayrollEnvelopeV1=DeepReadonly<Envelope>;
export type BoundedMarketIncomePayrollUnitCheckV1=DeepReadonly<UnitCheck>;
export type BoundedMarketIncomePayrollStartReservationsV1=DeepReadonly<StartReservations>;
export type BoundedMarketIncomePayrollStartDetailV1=DeepReadonly<StartDetail>;
export type BoundedMarketIncomePayrollProgressAuditV1=DeepReadonly<ProgressAudit>;
export type BoundedMarketIncomePayrollTickDetailV1=DeepReadonly<TickDetail>;
export type BoundedMarketIncomePayrollCatalogDigestsV1=DeepReadonly<CatalogDigests>;
export type BoundedMarketIncomePayrollReceiptCommonV1=DeepReadonly<ReceiptCommon>;
export type BoundedMarketIncomePayrollReceiptV1=DeepReadonly<Receipt>;
export type BoundedMarketIncomePayrollStateV1=DeepReadonly<State>;
export type BoundedMarketIncomePayrollProposalV1=DeepReadonly<Proposal>;
export type BoundedMarketIncomePayrollMoneyKernelReasonV1=DeepReadonly<MoneyKernelReason>;
export type BoundedMarketIncomePayrollStageV1=DeepReadonly<Stage>;
export type BoundedMarketIncomePayrollReasonV1=DeepReadonly<Reason>;
export type BoundedMarketIncomePayrollFailureV1=DeepReadonly<Failure>;
export type BoundedMarketIncomePayrollCreateOrLoadResultV1=DeepReadonly<CreateOrLoadResult>;
export type BoundedMarketIncomePayrollInspectResultV1=DeepReadonly<InspectResult>;
export type BoundedMarketIncomePayrollExecuteResultV1=DeepReadonly<ExecuteResult>;
export type BoundedMarketIncomePayrollPreviewResultV1=DeepReadonly<PreviewResult>;
export type BoundedMarketIncomePayrollSaveEnvelopeV1=DeepReadonly<SaveEnvelope>;
export type BoundedMarketIncomePayrollSaveResultV1=DeepReadonly<SaveResult>;
export type BoundedMarketIncomePayrollReplayOutcomeV1=DeepReadonly<ReplayOutcome>;
export type BoundedMarketIncomePayrollTraceV1=DeepReadonly<Trace>;
export type BoundedMarketIncomePayrollReplayResultV1=DeepReadonly<ReplayResult>;
```

## 6. 首错与原子业务步骤

所有入口先安全读取，不访问任意property getter。execute/preview顺序严格为detach(state)→detach(command)→完整rebuild(state)→Envelope外层exact三键/id/expectedRevision/command普通object→dedup→revision→history→command分支shape→业务。command细节有意晚于dedup/revision：同ID完整canonical相同直接取原receipt，返回最新state/current，优先于stale/history/horizon/业务；同ID任一内容不同为command-id-conflict。失败ID不登记。没有trusted-state快捷入口。

### 6.1 创建

按Scenario声明序：top exact→schema/profile/episodeId→clock/advanceLimit/完整日期及turn窗口→activeForce→force→corps→city→ownership一致→completeResidentRoster/prisoners→officers逐项→lots逐项→facilities逐项→layout→30slot映射→base/difficulty/controller→environment→完整constructionCatalog→完整officesCatalog→完整Policy→完整SourceBindings→工资resolver→reserve gate→initialState全不变量与fitRoot。

每object先exact keys，再声明序；array先长度、按index逐元素，再unique。officer内部依声明顺序验证；office范围/目录行未知unsupported-payroll-identity，后验重复office用duplicate-office，重复ID用duplicate-entity-id。数量错误invalid-officer-count；role非ordinary用unsupported-payroll-identity；incomeSkills非空unsupported-income-skill。owner不等owner-corps-mismatch，工资成员错城force用officer-city-force-mismatch。lot缺/错城/坐标冲突/城心重合/非恰一空lot→invalid-lot-layout；30映射不完整→invalid-facility-slots。固定completeFieldUnits不是true→incomplete-field-unit-snapshot。政策/目录/来源任意值不同分别unsupported-policy/catalog/source。基本值型错误invalid-number/id/date/array/fields；profile/schema/kind/difficulty/controller按同名unsupported reason。Calendar越9999→calendar-overflow，turn+limit越安全数→turn-overflow。

初current clock advancedCount0；ledger真实初值；每OfficerRow复制完整Progress、id、politics，reservation=null；初设施complete/effective1/job=null；jobs/history[]；revision0。不发工资/收入、AP/TP/成长。W查完整名单；R只读派生，gold<R用salary-reserve-shortfall附完整proposal。

### 6.2 开工首错和写点

Envelope新ID/stale/history后，Start exact字段type/city/lot/facility/officerIds；选人1..3唯一，按输入顺序。stage=construction：

1. cityId相同→owner/force/corps不变量→jobs历史<1（包括完成job）
2. 完整计算按原units顺序UnitCheck；hostile由显式列表；distance以city中心；取首blocks报hostile-within-two与blockingUnitId。若失败receipt不提交，公共Failure不携带整个检查数组
3. 按选人顺序逐个完整检查：exists→同城同force→available→reservation=null→actedTurn≠current.turn；首错填officerId
4. AP≥20→G≥200→G−200≥R；分别insufficient-action-points/insufficient-gold/salary-reserve-shortfall
5. lot存在→current不占用→facilityId在当前和永久任务历史未用；unknown-lot/occupied-lot/facility-id-reused
6. 完整catalog market/Lv1读取→调用calculateConstructionDevelopment(required500,politics,initialWork)→supported/positive→duration2..10整数→剩余窗口≥duration→date/turn due→提交Start后的13−(revision+1)≥duration
7. 同一detached candidate内AP exact debit→gold exact debit→建立唯一active job与developing facility→按选人记录reservation与acted=current.turn；无进度/XP/merit/TP→receipt→不变量/所有预算→一次提交

Job id由开工id派生；rateInput、startSnapshot、fee、完整rate及所有锁before/after保留。first error不能为方便调换成先查lot或先计算rate。late失败整candidate弃用，无ID/地块/锁/部分扣费遗留。all history accepted≤13不代替尾预留；两个门都保留。

### 6.3 唯一Advance

stage=tick：advancedCount<limit→nextDate/turn/advancedCount各一次→AP+20/cap255→有active job则advanceConstructionWork一次→due时completion→月初money→full salary→不变量/receipt/预算→一次提交。

完成门：facility存在且status developing/jobId相同→remaining0/newTurn=dueTurn/newDate=dueDate→work500→catalog completionTP30。调用completeConstructionPhase，input.job/facility/force均candidate真实引用；policies从完整construction仅投影writer/rewards/completionActors/scheduler。内部同步services.write调用calculateConstructionWrite并验证完整返回；requireReservedOfficer在phase逐人写点查candidate真实OfficerRow，必须reservation=本job，否则officer-reservation-mismatch。TP先写→按选择顺序每人政治XP/merit写→释放锁、acted=newTurn→设施complete/effective1/job=null→job.completedTurn；root保存完整completion两处。不再发第二份奖励、不重置其他XP、既有merit或余额。仅声明内部函数依赖，不允许用户callback/插件/可序列化代码。

没有active时progress/completions[]；忙或acted不阻止advance/工资；固定敌情只挡新开工，不挡完成。AP恢复与成长饱和仍成功，丢弃量真实记录。

非day1：通过相同money/payroll phases的not-due分支，不调用钱核；salary仍含完整items/sum；无gold write。day1：completion后的current→30事实→money phase税/富两false→income write立即写ledger.gold→full salary用同ledger→写工资。若private阶段失败，映射闭合reason（money-kernel:原reason拆成money-kernel-rejected+kernelReason，salary proposal原值）并整次回滚，包括clock/AP/完成/成长/解锁。阶段返回不是天然可信：必须核exact shape及本根窄域，并逐字段核该phase仅改允许的gold；任何cap、AP、security、clock、人员或设施的额外变化报unexpected-phase-effect。

### 6.4 兼容phase接合锁定

以下 private 接口来自已交付的 money/payroll 兼容模块，绑定 PR100 的实际提交与三模块 blob，见来源节。新 owner 不复制 finance 业务公式，也不将 public FinanceAdvance 与 ConstructionAdvance 合并 delta。

- deriveFinanceMoneyInput(facts:FinanceMoneyFacts):FinanceMoneyInputResult
- applyFinanceMoneyPhase(input:FinanceMoneyPhaseInput):FinanceMoneyPhaseResult
- compareFinanceOfficerIds(a:FinanceOfficerIdFact,b:FinanceOfficerIdFact):-1|0|1
- resolveFinancePayroll(ordered:readonly FinancePayrollOfficerFact[]):FinancePayrollResult
- applyFinanceFullSalaryPhase(input:FinanceFullSalaryPhaseInput):FinanceFullSalaryPhaseResult

FinanceMoneyFacts精确键facilities/baseMoneyWord/difficulty/controller/securityBeforeIncome；设施facts仅kind/level/complete/position、null槽，总30；这里kind market、level1、complete真实status、position来自lot。FinanceMoneyPhaseInput增加monthStart/taxationActive/wealthyActive/goldTarget；后二false，goldTarget=candidate.ledger真实对象的{gold,readonly goldCapacity}视图，不是复制钱包。成功{ok:true,kernel,writes}，kernel是完整Called或NotDue，writes此域0或1。PayrollOfficerFact仅{id,officeId}，使用compare叶对完整名单排序后resolver，成功{ok:true,payroll:{items,sum}}。FullSalaryInput={monthStart,payroll,goldTarget}，成功{ok:true,salary,write}。helper内固定复用原目录和policy IDs，不能注入任意替换目录/工资公式。root组装MonthlyReceipt.writes顺序为income phase.writes再salary.write（非null才append）。

兼容模块的错误 union 和 readonly 类型以本节所绑定的实际源码为准；窄读不得用 cast、宽 unknown 或仅同名假定来越过结构与数值检查。旧finance的W0/not-due items、六rows、粮/季降夹在income与payroll之间、原proposal/首错及旧公共形状不得改变。新root W>0是自己的输入约束。

## 7. 全fold、safe JSON、共用错误协议

### 7.1 safe boundary

每包8,388,608 canonical UTF8 bytes、250,000 occurrence nodes、root depth0≤48、array≤4096、object≤128 keys；同一引用重复出现分别计，cycles拒绝。每普通JSON value必须safe integral number，无半整数新需求。descriptor-only 读取；拒绝 getter/setter、symbol、非枚举字段、函数、undefined、稀疏或带额外属性的 array。普通对象原型只接受 Object.prototype 或 null，数组原型只接受 Array.prototype；任何反射前先检查 proxy。Node内使用process.getBuiltinModule('node:util').types.isProxy，缺失时object boundary fail-closed invalid-data，不偷偷退化成可能触发trap的克隆。这里说明运行环境所需能力，不表示本文执行过该能力检查。

严格文本parser：拒绝decoded重复key（包括转义碰撞）、无效token/尾随内容/-0/非safe integer，先限raw输入实际UTF8字节，再逐节点深度/完整canonical预算；单string token可由JSON.parse解码，对象不可先普通JSON.parse再检测已丢重复key。canonical object keys按code-unit排序，arrays保序；UTF8真实计Unicode/escape/代理项；通过域门后的普通strings全部固定短literal或ASCII IDs，只有SaveResult.serialized特长例外。字节门计算真实JSON escaping，不用JS字符串length替代。

json模块独立用于本根，可按已交付安全实现机械移植整数分支；不引入通用owner factory、不更改旧monthly半整数域。私有json函数名固定decodeBoundedMarketJson(text:string)、detachBoundedMarketData(value:unknown)、fitBoundedMarketData(value:unknown)，前二返回{ok:true,value:unknown}|{ok:false,reason:JsonReason或DataReason}，fit返回{ok:true}|{ok:false,reason:DataReason}。JsonReason=invalid-json|duplicate-json-key|invalid-number|budget-exceeded；DataReason=invalid-data|invalid-number|invalid-array|invalid-prototype|budget-exceeded。它们只做结构安全，不签发可信State。

私有errors.ts持有唯一WeakMap<object,Failure>，所有本根模块共享stop(reason,stage,context):never与caught(error):Failure；throw对象必须由此注册。caught只读取WeakMap身份，不读任意抛出对象的reason/message/getter，不duck-type或吞成成功。未知异常恒invalid-data/input且context/null。Context=Partial<Pick<Failure,'blockingUnitId'|'officerId'|'facilityId'|'jobId'|'proposal'|'kernelReason'|'index'>>。json/phase结果显式映射后才能stop；不允许不同模块复制互不识别的错误类导致所有领域错误降级。失败结果也冻结并完整预算。

### 7.2 full fold

rebuild安全读取后：State exact/tag/schema/profile→parse full genesis→revision/history长度0..13且相等→initialState并fitRoot→每history entry按序exact{envelope,receipt}→parse envelope外层→重复accepted ID拒绝duplicate-accepted-entry→相同transition产生next→完整receipt canonical比较→fitRoot全部包→下一条→raw整个State与重建State全文相等。current/digest/receipt、catalog/policy/source任何字段不能仅摘要验证。无效历史transition报history-recomputation-mismatch并保留合法context/index；错误输入shape保留其finite reason；receipt不同专用receipt-recomputation-mismatch；最终差异state-recomputation-mismatch。rebuild内stage=rebuild，budget仍budget。失败无部分state。

load只接受正确SaveEnvelope exact tag/state，不能接旧服务save或重置genesis迁移。save完整rebuild后canonical SaveEnvelope；serialized含完整State一次，不裁剪history、旧receipt、核evidence或completed job。inspect同样重建，无只读绕验证捷径。

### 7.3 不变量

每可达prefix和fold逐步都检查：

1. revision=history.length；clock.turn=initial+advancedCount、date完整日历、count≤limit；Start不改clock，Advance恰一次，AP只有初值/开工−20/每tick+20 clip
2. current固定人员顺序/ID/政治，5XP与merit范围，非政治XP恒初；office/role/membership/availability/skills全在固定genesis；marker≤turn，只有开工/完成改acted
3. gold≤cap，cap/security固定；所有金变化恰上述审计链；salary items全员同目录同排序，每新月恰一次，创建无发薪；历史同月settlement不能重复；工资付的是完整名单，不因reservation/availability/acted而减项
4. 每个lot最多一facility；初设施恒complete；新增唯一市场与永久job同ID/lot/city；status/effective/job字段相关；所有active reservation双向吻合；非参与者无孤儿锁；completed设施与所有人员锁清除
5. active elapsed=turn−startTurn，work=min(500,125+elapsed×rate)、remaining=dueTurn−turn>0；due=start+ceil(375/rate)，rate/input/full snapshot/fee都重算；completed current500/remaining0/completion恰一次且与history相符
6. TP=初TP+唯一completion.actualDelta；每参建者政治XP/merit按当前值饱和成长，其余全部保持；不存在native增长或其它TP命令
7. W固定10..480，H按剩余日历，R=H×W，G≥R；每条Reserve.before/after与真实对应prefix相等，spendable非负；没有保留金wallet或隐性credit
8. 13−revision≥active.remainingTurns，当前及所有返回预算满足；readonly深冻结不保留外部对象alias

任一晚门失败整candidate丢弃，原state可继续使用；preview执行同transition但不提交，不得有省预算/省工资/省锁的shortcut。

## 8. 所有包装、最旧duplicate及replay

fitRoot对每prefix分别检查State、{ok,state}、Inspect、raw SaveEnvelope、二次转义SaveResult、新成功Execute/Preview，以及历史每个receipt与最新State/Current的duplicate Execute/Preview。逐包检查，不组成未经承诺的巨大duplicates数组。当前最后收据小不能代替旧最大月初收据；旧月初receipt含完整kernel、薪资和可能completion，必须再计一次。Execute新提交committed=true/duplicate=false；重复committed=false/duplicate=true且receipt保持原值；Preview永远committed=false，新旧都baseRevision=最新revision，projectedCurrent为新候选或重复时最新Current。

replay先安全detach整个trace→top exact/tag→parse Scenario→attempts0..32每外壳exact→initialState。逐attempt与Execute同入口顺序产出ReplayOutcome，成功/duplicate receipt完整，失败完整Failure；失败/duplicate不占history，失败可以继续。expected不是oracle，不影响决策；非null全文相等才继续。mismatch返回stage comparison/reason trace-outcome-mismatch/index=attempt/state=null。每append outcome后检查整个ReplayResult，budget失败index=null/state=null，不冒充可继续的业务失败。最后expectedFinalState非null对整个State全文比较，差异trace-final-mismatch/index=null/state=null。任何外层trace解析错误index=null/state=null；成功返回全部outcomes/最终State。没有截断、摘要、只比较finalCurrent或漏掉expected输入全副本。

32次可以全重试同一旧最大receipt；完整Trace的expectedFinalState含full genesis/current/history，本文静态预算节逐项另算。Trace输入与ReplayResult输出是两个独立包，不拼成未提供的{trace,result}；内部内存/CPU/性能并非此JSON纸面预算结论。

## 9. 逐字段数值域补充

所有未重列的number仍服从§1安全整数及相关逐字段等式，不能用宽number绕开schema范围。Receipt.revisionBefore0..12/revisionAfter1..13、State/Inspect/baseRevision0..13、history slots0..13、remaining/reserved advances0..12（active reserved1..10）；duplicate的receipt revisions保留历史值，baseRevision取最新。Clock.advancedCount0..12，turn/markers服从初窗及current上界。UnitCheck.distance0..4000000；ProgressAudit.remainingBefore1..10/After0..9，workBefore125..499/workAfter166..500且after=min500,before+rate；没有active则无该项。Work.perAdvance41..250/current125..500；Job.duration2..10/remaining0..10/startTurn≤currentTurn、dueTurn=startTurn+duration安全，completedTurn仅null或dueTurn。completion政治Before/After0..100且相等。

ConstructionWrite.before/after/cap按各资源gold≤1e9/AP≤255/TP≤10000/XPmerit≤1e9；requestedDelta仅−200、−20、+20、+30、+3、+100的对应字段字面量；actualDelta负请求全额、正请求0..requested；discarded负请求0、正请求0..requested。GoldWrite.before/after/cap0..1e9；income requested0..65735、accepted/actual0..requested、discarded0..requested，writerPolicy只credit；salary requested/accepted10..480、actual−480..−10、discarded0、writerPolicy只debit。Salary.sum10..480、paid恰0或sum、available=null或0..1e9；officeId0..79且工资/name为同一目录行；payrollOfficerIds与items相同。Proposal.required1..1920/available0..1e9/shortfall1..1920且shortfall=required−available，只在确实不足时存在。Reserve.gold/spendable0..1e9，其余按§3。MoneySlotReceipt.index0..29且=i；其余字段相关union按§4。SourceBinding三string全部固定const，SalaryItem.officeName只允许目录80行中对应行的原字面值；没有任意文本入口。

## 10. 固定来源、实际兼容依赖与证据边界

研究来源基线固定为 commit `ebd6d7e695a44ecf1c753ec8045718c8cb27d4b0` / tree `f97eae627ffbc11e813fbde1be4be1657041ed50`。兼容 money/payroll 阶段已在 [PR100](https://github.com/DanielMax937/sanguozhi/pull/100) 交付，实际集成基线为 commit `51276c329075c936e32de2ee9dadb3b9f0f47e64` / tree `9419afce86dd23fc6e5655ba63637cd7eb606404`。研究基线和实际依赖版本是两个不同身份，不能以设计摘要替代实际模块 blob。

### 10.1 Scenario 的七个固定 source binding

每行是 `{path,gitBlobSha1,sha256}` 的完整固定值；path 均相对本仓库。SourceBindings 的 key、各行完整内容与完整政策和目录一起进入重算；对象键顺序无关，数组顺序保留。sourceDigest 仅辅助，不能代替全字段比较。

|键|产品 path|Git blob SHA1|SHA256|
|---|---|---|---|
|constructionPolicy|data/catalogs/facility-construction-policies-v1.json|08976970d8c27b24d21791c8ec1d1d8fafbf72f7|a13564ab37cc6e38fbaad6cd6a6396f8c8692f62b944a44ecadb3be8a6f45a29|
|constructionCatalog|data/catalogs/facility-construction-catalog-v1.json|95435bf6d512aab24143e3fd04dac4420bba402a|366fb875751367758606fb3fffb291682231a10606a8773bffa040ccd9fa4f43|
|offices|data/catalogs/named-offices-v1.json|c1ed4746545d4be5349a8a923afa03f8253081ce|949e956340414969224406315ce93d141e97379ca8a5403923bb9714bb8aa7c1|
|financePolicy|data/catalogs/city-finance-policies-v1.json|bd44cb42416b34f450cc6c43e94788b82b1c950b|10db1115a29d1e9b8ea294defd21b9ed170bb20032b25d00ce50f0bf5463d118|
|financeFacilities|data/catalogs/city-finance-facilities-v1.json|4224d534b90bc2f42d1a6bf325153d03e7bf1101|b7317c35bfc614a426f235a38fb32b124d808c9dbdf65ce483de17e2f2baa0d8|
|moneySource|docs/sources/city-money-income-projection.json|502c0f0d7712c8dd23aed36b61bb60815f9a2f37|cf7ff7276747b793d293e20ec53681e36a3b5232e16ce93677f595a0b33a65fd|
|rateSource|docs/sources/domestic-construction-rate.json|0c9045377d7e9df5bd1d605d2e34c76d9a0cdeeb|2a9839d373396ead062c277a8767a79c18d0d61de848236acd522cd108722bd8|

### 10.2 已交付 private 依赖

下表前三个兼容模块的实际源码身份属于上面的 PR100 集成提交，后五项列出固定建设与金核依赖；它们保持原 finance 公共 API、较宽数据域和旧阶段顺序。新 root 自己约束 normal、1..8 人、无收入技能、固定安全度和保留金，不将这些限制下沉共享模块。

|模块|Git blob SHA1|SHA256|
|---|---|---|
|packages/engine/src/internal/finance-money-payroll-types.ts|27ffdcdfff1c17a4a0440ea2f789c6b8643e9125|86821af39d50921cd972ad4586a2165df3026e968a4da3e36dd2ada15ae1dd58|
|packages/engine/src/internal/finance-money-payroll-leaves.ts|1f65dbc7e7adfc269d69fda2a3f574792f8a6ab0|e7927108eebc0294cde56a12f624aa605da731002ee8daf955cf9d4030bbfcaa|
|packages/engine/src/internal/finance-money-payroll-phases.ts|31f9f59e23f7088a5a9872455fdfbb9ea579974c|c0bc524b5a019b6d3d54b7715dd2f174cf2fea63acc02035e21491d1a481aeee|
|packages/engine/src/internal/facility-construction-types.ts|953dd29cf8405a009f7900132c1998f01f25d204|62fb4a2a5ac0f68b3275dd47d8a751cc191937e249ae5b731bbdcde2c386e5d9|
|packages/engine/src/internal/facility-construction-leaves.ts|545ab4cac83d7234670323cf445f8efd15aaf89d|7ebc027bfc2c44ae3a834494c023491beddbc18a332ae2b88b999a7eddc2a3e1|
|packages/engine/src/internal/facility-construction-phases.ts|a01a7f5bb030b817326899073c090a4bc7ba981a|0bcb13ab1d3048c4ad14f064bacee79559a84964a39bf0b95d1d9693e90bf6fd|
|packages/engine/src/domestic-construction-rate.ts|58548fb0d8af91da905ddb6d29c6c068e08bdfb0|05fa2ee805deb399cf89378d6ecf5bdb9851079110ac17cbfaff55ba2131b4ad|
|packages/engine/src/city-money-income-projection.ts|f1abfe1dc7c2e3cd1c74c37c1e1b0ac0fb132ef7|3e7447fd5390a35b5ca55695fb24a34eac1790942db32ea15de2c604bfc77018|

市场 root 不导入 forge core，不把市场 cast 为 forge/type34/D800/cost300，不复制旧 owner 的业务逻辑，也不引入可任意配置的通用 owner factory。建设叶负责 rate/duration 和精确扣费/饱和 credit；建设 phase 接受 candidate 真实 owned job、facility、force、officers 引用。money/payroll phase 接受同一 candidate ledger 的 `{gold,readonly goldCapacity}` 视图。各 phase 均不拥有根日期或历史。

市场 adapter 的四个 private exports 是：

```ts
export function resolveMarketPayroll(s:Scenario):FinancePayroll;
export function deriveMarketReserve(s:Scenario,current:Current,payroll:FinancePayroll):Reserve;
export function deriveMarketMoneyFacts(s:Scenario,current:Current):FinanceMoneyFacts;
export function settleMarketMonth(s:Scenario,candidate:Current,payroll:FinancePayroll):MonthlyReceipt;
```

`FinancePayroll` / `FinanceMoneyFacts` 属于上表绑定的 private types，未作为新的 public API 导出。resolveMarketPayroll 复制全员 `{id,officeId}`，用 compareFinanceOfficerIds 排序并调用原目录 resolver。create 与每个 accepted transition 在业务前调用一次；reserve 和 monthly salary 使用同一份可信 payroll。deriveMarketMoneyFacts 只派生 current 的 30 个设施事实及固定 base/difficulty/controller/security，不复制金账。settleMarketMonth 以 candidate.clock 判定 monthStart，并完整窄读 phase input/result、工资和允许写点；not-due 也携全员工资清单。

### 10.3 原始金核、速率与目录来源

金核原始来源是 [sjn4048/311MemoryResearch](https://github.com/sjn4048/311MemoryResearch/tree/66e167e40c3440929ec016f3872aefc3486434c1)，固定 commit `66e167e40c3440929ec016f3872aefc3486434c1`，path `内存资料/整理/Func-收支04-计算城市收钱.txt`，blob `0f2c2d72a174d563427230bf207d65b6a639247c`。原 GBK 13,630 bytes / SHA256 `38b0ac07ba1d67e47add98460a013337d9ed4a97191e7371461ad1d4d89e1e7a`；UTF-8 快照 14,553 bytes / SHA256 `d1780c1a16fb50a06af16a0ac7acbad06c396bf31ed1ef09432077b91a5d833a`。已记录 listing 范围 `0049E590 <= PC < 0049E745`，150 instructions / 437 bytes / SHA256 `30a5160008a77ce78b8602819a7041f71015fffcb30d2b09221f5abee37a37f1`。未列出的 `0049E745..0049E748` 三 bytes 仍未知，不补 padding。

建设速率来自同一仓库和 commit，path `内存资料/函数[计算内政建设速度].txt`，blob `76b1f9591a9f94830bcf4e5a67764d2911e19fd4`。原 GBK 5,936 bytes / SHA256 `cabc5cb11e62dee04fda39aadce804284d272ca20e98ece202fd16cedfbe9216`；UTF-8 snapshot SHA256 `f092b0a16ab99ca74106c967e4dfb320211c2b4d2a066f0ca36b4be84272b132`。listing `005BB1D0..005BB2AA`，84 instructions / 219 bytes / SHA256 `8529878a0dca1cd080dfa805b5112ff940eba58631f31c5c5c83025400c7106c`。星号 MOD 路径 `005BB263→008A9DE8` 排除；稳定 getter 输入和 D 是 resolved facts，不是原生指针或 ABI 恢复。

来源许可证记录为 Apache-2.0，归属 sjn4048/311MemoryResearch；仓库文件 [production-price-LICENSE.txt](../sources/production-price-LICENSE.txt) 的 SHA256 为 `c71d239df91726fc519c6eb72d318ec65820627232b2f796219e87dcf35d0ab4`。这里引用固定发布记录，没有重新认证原可执行文件。

普通官职由 [named-offices-v1.json](../../data/catalogs/named-offices-v1.json) 固定，source 指向 [ranks.json](../sources/ranks.json)，该 source blob `ca897357854eae1ce9ac939213965cd111a3f110` / SHA256 `9b8c836e1d0b0c13dddf37d78393c323dfc86ffe98b897be1e79dfe823da4752`；直接表源是 [社区官职表](https://w.atwiki.jp/sangokushi11/pages/111.html)。这是已发布规则转录，不是当前网站抓取或原生欠薪后果验证。完整 80 行、10 ruler titles 和 unsupportedInternalEntry=80 都保留；保留 title 不表示支持君主工资。

市场目录证据为 `community-tables-and-existing-rule-transcription-not-stock-data`。type31/D500/cost200/TP30/yield100 均来自固定已有目录，不声称从 stock data 取证。work 不是 HP；XP/merit 的 1e9 是 engine accumulator cap，不等于原版人物数值上限已恢复。

### 10.4 不能提升的原 evidence

每次调用仍完整保留 money 的 19-key evidence 和建设 rate evidence。money 的 `fullCallerBytesVerified=true`、`stableResolvedInputsRequired=true` 延续既有来源声明；其余下列 boolean 均保持 false：

- entryGatesIntegrated、stockOriginalVerified、originalExecutableExecuted、nativeHelpersReconstructed
- abiVerified、realTraceReachabilityVerified、typeTableStockVerified、adjacencyHelperRecovered、rngRecovered
- monthlySchedulerIntegrated、incomeWriterIntegrated、commandIntegrated、modBehaviorIncluded

新 owner 的 SourceBoundary 同样保持 nativeExecution/stockVerified/nativeFullFinance/nativePayrollConsequences/nativeScheduler/nativeHp 全 false；ownership/scheduling/writers/reserve 为 `provisional-engine-rule`。模拟器真实入账不把旧 money evidence 的 incomeWriterIntegrated 或 monthlySchedulerIntegrated 改为 true，工资支付也不等于原生欠薪后果已经恢复。

完整原 source body 和许可证、来源目录信息保存在来源 artifact 中；它们不是 State 未声明的新字段。每条 receipt 的完整 input/result/evidence、30 槽和完整工资清单照常保存，不能以大 source body 已在文件为由缩掉这些审计。原 43 主题 / 45 快照及 E/X 证据债不因此减少；本文不扩入 P078 及其依赖。


## 11. 完整静态预算与完成尾证明

以下以每个公开包分别计算，保留全部历史、30 槽、核证据、工资项目与 expected。所有数值是字段组合和手工整数上界，不是序列化或节点计数器的运行测量。

### B0. 结论

|公共值／包装|N上界|canonical UTF8 bytes上界|depth保守界|
|---|---:|---:|---:|
|Scenario|1600|224000|8|
|Current|340|47600|10|
|任意完整Receipt|730|102200|10|
|State|11700|1638000|14|
|Create/Load成功|11702|1638280|15|
|Inspect成功|354|49560|12|
|Raw SaveEnvelope|11702|1638280|15|
|二次转义SaveResult|3|3276587|1|
|新Execute及任意旧receipt duplicate|12434|1740760|15|
|新Preview及任意旧receipt duplicate|1075|150500|13|
|ReplayResult全部32 outcomes|35159|4922260|15|
|Trace全部32 expected及完整expectedFinalState|37175|5204500|15|

所有包严格低于8388608bytes/250000nodes/depth48；最大合法数组是完整官职目录80，不是只算32attempts；对象实际最大23键，宽放32仍小128。最紧字节包Trace余3184108bytes。输入安全shape允许4096数组/128对象，不等于领域许可该长度；任意恶意/假的expected可拒绝，保证针对本 profile合法数据及真实全expected值。

### B1. 计数法、字符串和字节引理

每object/array/scalar/null为1 node，key只计bytes。复制/重复引用在每出现处各计；不以JS alias去重。N(obj)=1+ΣN(value)，N(array)=1+ΣN(item)。root depth0。

每固定key为ASCII且≤64bytes；Id1..64、JobId5..68、Digest64、Blob40 ASCII。所有实际固定literal/profile/tag/reason/policy/source路径≤68 UTF8bytes；RateEvidence最长条目20ASCII；MoneyEvidence最长profile/source<50bytes。完整目录中文market等最长3字9bytes；官职name最长4汉字12bytes、rulerTitle最长5字15bytes；bonusText汉字2字+ASCII2≤8bytes。其余原目录常量均短ASCII，没有自由description、原始listing长hex或外部URL塞入State。SourceBindings完整七path为data/catalogs或docs/sources短路径，最长construction-policies路径52bytes。source artifact的完整外部出处/原source正文是文件，不是未声明的State字段。

已通过领域门的普通strings没有引号、反斜线、控制字符或未配对surrogate；Unicode按UTF8真实3bytes/汉字计，不按JS length。数字为安全整数，最坏负号+16位≤17bytes（仍宽放binary64最短输出≤25）。所以每node自身标量/括号≤70，树N−1条edge最大key引号/冒号/逗号≤68：B≤70N+68(N−1)<140N。非对象边更小。SaveResult.serialized长string不能套此引理，B6另算二次转义。恶意输入实际byte gate仍按真实escape计算。

### B2. 固定完整政策／目录／source

ConstructionCatalog逐项：前5设施row=root+5scalar+levels(1+3×4)=19；后4row=root+5scalar+levels(1+4)=11；entries=1+5×19+4×11=140；incomeRows=root+两数组各4=9；全catalog=root+version/evidence/combatHp三个scalar+140+9=153。

ConstructionPolicy选定完整common：root1+version1+calendar10+development10+absorption16+hostility10+ownership7+scheduler15+writer9+effects12+budget16+persistence10=117。完整apRecovery6+initialWork6+rewards10+completionActors5，合144。这里不是只计被调用的字段；旧domain/budget/absorption/effects等仍完整保留。

OfficesCatalog顶层恰version/source/sourceSha256/rulerTitles/offices/unsupportedInternalEntry六键：root1+四scalar4+titles(1+10×6)+offices(1+80×10)=867。每title恰key/name/unlockedTier/referenceCitiesRequired/rulerCommand五scalar；每office恰officeId/sourceRowIndex/name/requiredTier/requiredMerit/command/bonusText/monthlySalary/kind九scalar，null bonus同样1node。80工资行和10君主title全部计入；保留title不表示本根支持君主工资。

FinancePolicies root1+payroll13+credit6+debit6=26。payroll=root+九scalar+officeRange数组3=13；credit/debit各root+五scalar6。没有漏掉maxOfficers80、uniqueOffice、payer或personCashWalletfalse。

ReservePolicy root+八scalar=9。Policy root1+十一scalar+Reserve9+Construction144+Finance26+budgets(1+14)=206。budgets14键恰accepted/trace/jobs/advances/officers/lots/facilities/units/hostile/bytes/nodes/depth/array/object。

SourceBinding=root+path/blob/SHA三scalar=4；SourceBindings=root+七Binding=29。SourceBoundary=root+十二scalar=13，每receipt完整一份，不只digest。

### B3. Scenario与Current全部字段

|DTO|逐字段式|N|
|---|---|---:|
|Date / Position|root+3 / root+2|4 / 3|
|Clock / initial clock|root+Date4+turn+advanced / root+Date4+turn|7 / 6|
|Progress|root+5XP+merit+acted|8|
|OfficerFacts|root+id/force/city/role/office/politics/available七scalar+incomeSkills空数组1+Progress8|17|
|officers8|array+8×17|137|
|Lot / lots2|root+id+city+Position3 / array+2×6|6 / 13|
|ExistingMarket / facilities1|root+id/lot/city/kind/level/complete / array+7|7 / 8|
|Scenario.city|root+id/kind/owner/cap/initialGold/security六scalar+Position3|10|
|Scenario.force / corps|root+2scalar / root+3scalar|3 / 4|
|Unit / fieldUnits16|root+id+force+Position3 / array+16×6|6 / 97|
|Environment|root+complete true+hostileIds17+fieldUnits97|116|
|facilityLotSlots|array+30 explicit Id/null|31|

Scenario共23键，其中十个scalar为schemaVersion/profile/episodeId/advanceLimit/activeForceId/completeResidentRoster/prisonerCount/baseMoneyWord/difficulty/controller。全部合：

N(Scenario)=1+10+clock6+force3+corps4+city10+officers137+lots13+facilities8+slots31+environment116+construction153+officesCatalog867+policy206+sourceBindings29=1594，取1600。

Current人物保留全部五XP/merit/acted和id/politics/reservation：OfficerRow root+10scalar=11；8人数组89。FacilityRow9键root+9scalar=10；2设施数组21。Ledger=root+gold/goldCapacity/AP/security四scalar+force2+officers89+facilities21=117。无job Current=root+Clock7+Ledger117+jobs空array1=126；加完整completed Job≤210得336，取340。cap真实保存并检查固定，不是第二金钱包；R不存current，Receipt/Inspect中的Reserve=root+六scalar=7。

### B4. 施工完整审计

|DTO|逐字段式|N上界|
|---|---|---:|
|RateEvidence|root+六arrays的2/2/8/3/2/2|20|
|RateReceipt|root+12scalar+三政治槽array4+Evidence20|37|
|RateInput|root+profile+D+政治array4|7|
|ConstructionWrite|root+7scalar|8|
|ConstructionReward|root+officer+2Write+politicsBefore/After|20|
|Completion|root+6scalar+TPWrite8+rewards61+releasedIds4|80|
|ConstructionFees|root+2Write|17|
|Work|root+4scalar+Rate37|42|
|StartSnapshot|root+5scalar+clock6+lot6+selectedFacts10|28，取30|
|Job active|root+13scalar+Ids4+politics4+双Date8+Work42+Snapshot30+RateInput7+Fees17+null1|127，取130|
|Job completed|127−null1+Completion80|206，取210|
|UnitCheck|root+5scalar+Position3|9|
|unitChecks16|array+16×9|145|
|StartReservations|root+officers(1+3×6)+facility4+lot4|28|
|StartDetail|root+activeJob130+Facility10+checks145+Reservations28|314|
|ProgressAudit / progress1|root+5scalar / array+6|6 / 7|

Job22键完整包含rateInput、work.rate、开始full snapshot、费用、双Date、完成full receipt；active精确125、completed204，表中保守130/210。current与Start历史job不是同一时间快照，不能把Start未来变成completed。Completion同时在current job和完成tick各80，本文两处独立计数。

### B5. 金核与工资逐键

MoneySlot null1/developing(root+2)=3/complete(root+3)=4；最多2非空因此slots≤1+28×1+2×4=37。六type rows每row=root+valid+yield=3、表root+6×3=19。MoneyInput=root+profile/base/difficulty/security四scalar+slots37+rows19=61；没有偷删六rows或adjacentMint false。

每MoneySlotReceipt恰index/facilityTypeWord/effectiveType/status/moneyYieldWord/mintApplied/contribution七scalar，N8；30数组241。MoneyIntermediates=root+五scalar=6；MoneyEvidence=root+19scalar=20。MoneyResult=root+九scalar+slots241+intermediates6+evidence20=277。Called=root+status/api/profile/adapter四scalar+Input61+Result277=343。完整Evidence原19键全部在内。

GoldWrite=root+十scalar=11；两笔writes数组23。SalaryItem=root+四scalar=5；8 items数组41。Salary=root+status/sum/available/paid/shortfall/payer六scalar+items41=48。not-due也保留items，但null available/paid0同样节点；paid最坏不多省节点。SalaryItems中文name字节在B1已算。

MonthlyReceipt10键：root1+status1+settlement4+facilityIds31+kernel343+writes23+salary48+security1+payer1+payrollOfficerIds9+incomeEffects3=465，保守放宽为565。settlement=root+city/year/month=4；effect root+双false3。not-due分支更小，不能以其代替整月上界。

TickDetail 的直接节点上界为 root1+APWrite8+progress7+completions(1+80)+monthly465=562；采用 monthly 的保守上界565后，整体保守上界为662。允许completion和月收入同一tick，因此不是max(施工,财政)，两者完整相加。

### B6. Receipt、history、全部包装

StartCommand=root+type/city/lot/facility四scalar+officerIds4=9，Envelope=root+id+expectedRevision+Command9=12；AdvanceCommand2/Envelope5。Receipt公共壳（含root和kind、不含envelope/detail）逐项：root1+kind1+revisionPair2+policyDigest1+catalogDigests3+sourceDigest1+SourceBoundary13+两Clock14+两currentDigest2+ownerSnapshot5+两Reserve14+scope/rng/native三scalar=60。

- StartReceipt≤60+12+314=386
- 最坏month-completion TickReceipt直接上界≤60+5+562=627；沿用保守上界≤60+5+662=727
- 任意receipt统一730；history entry=root+Envelope≤12+Receipt≤730=743

Accepted≤1Start+12Advance=13，失败/duplicate/preview不追加。State非history壳root/tag/schemaVersion/profile/revision为5；genesis1600、Current340、historyArray1全计：N(State)≤5+1600+340+1+13×743=11605，宽取11700。每一history都按最大month-completion估，比真实最多4月/1完成更保守；没有靠遗漏complete tail或裁旧月收据才装下。

Failure11键：root1+十scalar/null+非null Proposal4≤15；无proposal为12；Replay外层Failure再state:null最多16。

Create/Load root+ok+State=11702；Inspect=root+六scalar+Current340+Reserve7=354。RawSaveEnvelope root+tag+State=11702。Execute root+三个scalar+State11700+Receipt730=12434；Preview root+四scalar+Current340+Receipt730=1075。同界同时覆盖正常和历史每一个旧receipt重试；特别月收入/工资的最大旧receipt搭配最大最终State仍≤12434，不用最新not-due收据偷换。

字节全部乘140如B0。RawSave≤1638280bytes。SaveResult.serialized是这个完整canonical文本，二次JSON stringify最多每个原ASCII引号/反斜线double，UTF8汉字不增；raw canonical中控制字符已转义。固定外壳含字符串引号恰27bytes，故B(SaveResult)≤2×1638280+27=3276587。N3/depth1，不允许误把serialized当普通68byte string计。

ReplayOutcome成功root+ok+dup+Receipt730=733；Failure≤15。ReplayResult=root+ok+State11700+outcomesArray1+32×733=35159；B≤4922260。Trace attempt=root+Envelope12+expected733=746；Trace=root+tag+Scenario1600+attemptsArray1+32×746+expectedFinalState11700=37175；B≤5204500。每个expected包括完整receipt；finalState含所有完整历史，已经再计一次。expected=null或少于32更小。允许32次全返回同一个旧最大receipt，仍用该式覆盖。

### B7. 深度、object keys、arrays独立证明

RateEvidence→array→scalar H2；RateReceipt H3；Work H4；Job到Work H5（到snapshot.clock.date也是≤4）；completed Job到completion.rewards.reward.write.scalar H5。Current→jobs→Job H7。MoneyResult→slots→row→scalar H3；Called→result H4；Monthly→kernel H5；TickDetail→monthly H6；Receipt→detail H7；State→history array→entry→receipt H10。Scenario最长选定policy层≤6、完整OfficesCatalog≤4。宽放State14、Current/Receipt10，外包State15；Preview≤13；Trace/replay经expected receipt链或expectedState≤15；SaveResult string结构不算内部JSON深度。

最大数组OfficesCatalog.offices80；rulerTitles10；trace/outcomes32；slots30；history≤13；units16；hostile16；roster8；job/completion1；selected3。最大object键Scenario23、Job22、MoneyEvidence19、ConstructionPolicy15、Policy15，其余更小；宽放32<128。全schema文件本身不是runtime DTO，不纳入这些包；任何实现新增嵌套字段都必须重新核对本证明，不能照搬结论。

### B8. 工资、日期与完成尾静态定理

W是固定完整1..8人原目录和，10≤W≤480。唯一officeId可能收紧真实上界，但不用该优化。n≤12；dayOffset d∈{0,1,2}，每3次推进跨一次month-start，H=floor((d+n)/3)≤4；n0⇒H0，d2/n1⇒H1，d1/n2⇒H1，d0/n1⇒H0，任何d/n12⇒H4。advance终点固定，current day1不重复计当前月。创建完整日期窗口可表示，所以跨年与普通月同样计数。

创建G≥H×W；接受开工后G'=G−200≥H×W。非月tick H/G不变；月tick H'=H−1，income credit A≥0，即使满仓A0也成立；G'=G+A−W≥H×W−W=(H−1)×W。因此每个可达prefix都保持G≥R；工资不足在合法域不会阻止推进，也无需未来收入预测或预扣第二钱包。其它金支出只有唯一Start，其gate已证明。initialReserve可0但人员工资W不为0。

任取合法active prefix，D=remainingTurns1..10。用新不同合法IDs和正确expectedRevision只提交D次Advance：

1. Start已校验due≤episode终点，创建已校验整窗日期/turn；count/date/turn各一次，完成前horizon/溢出不会挡住
2. AP恢复与TP/成长全为合法饱和credit，满cap只记录discarded；无额外资源条件
3. 固定人员/设施/lot与双向锁由prefix不变量保持；advance不重新检查availability/acted/外敌；不存在取消/拆除/第二job破坏锁
4. 每次 work=min(500,125+elapsed×rate)、remaining 减1。固定总 duration=ceil(375/rate)，当前 D=dueTurn−currentTurn；rate41..250 保证到期 work500 而上一旬<500。经过当前剩余 D 次推进，dueDate/turn 一致，completion guard 满足
5. 月界最多4次，B8保留归纳保证每次income后足额工资；completion-before-income让新市场可能增收，但证明只用收入非负，不借它支付工资
6. Start时history剩槽≥duration；每tick消耗1槽且D减1，预留不变量保持。更强地所有路径S≤1/T≤12，history≤13；最末完成自然属于此同域
7. B6从一开始把current job按completed210、每tick按完整月初completion727估；每个未来尾prefix都仍N(State)≤11700，全部正常/duplicate/preview/save/escaped包和32trace全expected同时有上述界。完成最后一旬不会因突然增加audit或保存逃逸预算而失败

结论是profile 静态总定义保证；恶意输入、实现bug、Node安全intrinsic缺失、原 phase 不按已绑定接口工作仍fail-closed。不能把这些故障当作允许正常已接受工程欠薪死锁的政策。该证明只覆盖本文闭合 DTO 和规定的转移；实现与 DTO 发生变化时必须重新核对全部前提。本文没有执行模型来替代这一证明。

### B9. 必须重审的变化

增第二job/回收任务、名单/office/政策变动、新支出/收入技能/难度、更多市场、无限窗口、长自由字符串/开放source记录、receipt嵌入完整State、额外API数组汇总、改变safe整数域，都会破坏某项前提。相应版本必须重新定义并证明，不删30核槽/evidence、完整工资项、来源/policy/catalog、旧receipt或expectedFinalState，不降低旧512/128支持域来补本根预算。

## 附录：完整固定目录与所选政策来源

以下 P/C/O/F 均为完整只读字面常量，等价于以 `as const` 约束的固定 JSON 值。`ConstructionCatalog=typeof C`、`OfficesCatalog=typeof O`；ConstructionPolicy 取 P.common 全部键并增加四个明确选择的对象；FinancePolicies 只取 F 的 payroll/credit/debit。来源政策中保留的其他参数和 alternatives 不扩大本 profile 可执行命令。进入 Scenario 的固定完整目录及选定政策对象中，所有原值、数组顺序和未使用行都参与完整相等校验，不能只核 version/digest。P 的未选 alternatives 和 F 的其他政策只在来源附录保留，不加入 runtime Policy、State 或新可执行分支。

### 附录P：建设政策完整来源

```json
{
  "common": {
    "version": "facility-construction-policies-v1",
    "calendar": {
      "id": "finite-facility-ten-day-calendar-v1",
      "version": 1,
      "days": [
        1,
        11,
        21
      ],
      "minYear": 1,
      "maxYear": 9999,
      "maxAdvanceLimit": 360
    },
    "development": {
      "id": "standard-nine-development-v1",
      "version": 1,
      "actionPoints": 20,
      "minActors": 1,
      "maxActors": 3,
      "level": 1,
      "rateProfile": "domestic-construction-rate-stable-v1",
      "politicsMinimum": 0,
      "politicsMaximum": 255
    },
    "absorption": {
      "id": "same-kind-adjacent-lv1-absorption-v1",
      "version": 1,
      "actionPoints": 10,
      "goldCost": 100,
      "actors": 1,
      "donorLevel": 1,
      "receiverLevels": [
        1,
        2
      ],
      "adjacencyDistance": 1,
      "fastPoliticsThreshold": 70,
      "fastTurns": 1,
      "slowTurns": 2,
      "completionTechniquePoints": 10,
      "timingEvidence": "empirical-guide"
    },
    "hostility": {
      "id": "facility-start-only-pressure-gate-v1",
      "version": 1,
      "completeFieldUnitsRequired": true,
      "explicitHostileForceIds": true,
      "distance": "max(abs(dq),abs(dr),abs(dq+dr))",
      "cityCenteredBlockingDistanceInclusive": 2,
      "blockAdvance": false,
      "coordinateMin": -1000000,
      "coordinateMax": 1000000
    },
    "ownership": {
      "id": "fixed-owned-city-supplied-lots-v1",
      "version": 1,
      "ownershipChanges": false,
      "lotAtCityAllowed": false,
      "externalActiveJobsSupported": false,
      "usedFacilityIdReuse": false
    },
    "scheduler": {
      "id": "next-boundary-capped-work-v1",
      "version": 1,
      "startProgressAdvances": 0,
      "firstProgress": "next-boundary",
      "order": [
        "calendar",
        "ap-recovery",
        "jobs-in-ASCII-id-order",
        "completion-rewards-release"
      ],
      "rateSnapshot": "start",
      "workProgressCap": "required-work",
      "forcedTenTurnCompletion": false,
      "requireCompletionWithinHorizon": true,
      "nativeSchedulerRecovered": false
    },
    "writer": {
      "id": "facility-exact-debit-saturating-reward-v1",
      "version": 1,
      "actionPointCap": 255,
      "techniquePointCap": 10000,
      "rewardCap": 1000000000,
      "goldMaximum": 1000000000,
      "partialDebits": false,
      "overflowCredit": "clip-and-record-discarded"
    },
    "effects": {
      "id": "facility-active-level-kernel-view-v1",
      "version": 1,
      "developmentEffectiveLevel": 0,
      "absorptionEffectiveLevel": "target-minus-one",
      "completedEffectiveLevel": "target",
      "income": "existing-kernel-read-only-projection",
      "supportAdjacencyDistance": 1,
      "supportMultiplierStacks": false,
      "combatHpModeled": false,
      "repairsModeled": false,
      "automaticPoliticsGrowth": false
    },
    "budget": {
      "id": "facility-bounded-json-v1",
      "version": 1,
      "maxLots": 30,
      "maxOfficers": 128,
      "maxFieldUnits": 128,
      "maxHostileForces": 128,
      "maxJobs": 512,
      "maxAcceptedCommands": 872,
      "maxTraceAttempts": 2616,
      "maxCanonicalUtf8Bytes": 67108864,
      "maxInputNodes": 4000000,
      "maxInputDepth": 48,
      "maxArrayLength": 4096,
      "maxObjectKeys": 128,
      "maxIdLength": 64
    },
    "persistence": {
      "id": "facility-canonical-recompute-v1",
      "version": 1,
      "schemaVersion": 1,
      "comparison": "full-policy-catalog-genesis-receipts-snapshot",
      "digest": "sha256-canonical-json",
      "duplicateJsonKeys": "reject",
      "inputObjectKeyOrder": "irrelevant",
      "inputArrayOrder": "preserved",
      "executeOutputBudgetAtEveryAcceptedStep": true
    }
  },
  "apRecoveryPolicies": [
    {
      "id": "facility-ap20-cap255-v1",
      "version": 1,
      "perAdvance": 20,
      "cap": 255,
      "nativeFormulaRecovered": false
    },
    {
      "id": "facility-ap0-cap255-v1",
      "version": 1,
      "perAdvance": 0,
      "cap": 255,
      "nativeFormulaRecovered": false
    }
  ],
  "initialWorkPolicies": [
    {
      "id": "facility-work-quarter-floor-v1",
      "version": 1,
      "mode": "quarter-floor",
      "divisor": 4,
      "nativeInitialWriterRecovered": false
    },
    {
      "id": "facility-work-zero-v1",
      "version": 1,
      "mode": "zero",
      "divisor": 4,
      "nativeInitialWriterRecovered": false
    }
  ],
  "rewardPolicies": [
    {
      "id": "facility-community-rewards-v1",
      "version": 1,
      "ordinaryDevelopmentPoliticsXp": 3,
      "supportDevelopmentPoliticsXp": 4,
      "absorptionPoliticsXp": 2,
      "mintDevelopmentMerit": 100,
      "otherMerit": 100,
      "allocation": "full-per-selected-at-completion",
      "nativeRewardWriterRecovered": false
    },
    {
      "id": "facility-mint150-rewards-v1",
      "version": 1,
      "ordinaryDevelopmentPoliticsXp": 3,
      "supportDevelopmentPoliticsXp": 4,
      "absorptionPoliticsXp": 2,
      "mintDevelopmentMerit": 150,
      "otherMerit": 100,
      "allocation": "full-per-selected-at-completion",
      "nativeRewardWriterRecovered": false
    }
  ],
  "completionActorPolicies": [
    {
      "id": "facility-completion-actors-acted-v1",
      "version": 1,
      "actedOnCompletion": true,
      "nativeMarkerRecovered": false
    },
    {
      "id": "facility-completion-actors-available-v1",
      "version": 1,
      "actedOnCompletion": false,
      "nativeMarkerRecovered": false
    }
  ]
}
```

### 附录C：建设设施完整目录

```json
{
  "version": "standard-nine-facilities-community-v1",
  "evidence": "community-tables-and-existing-rule-transcription-not-stock-data",
  "entries": [
    {
      "kind": "market",
      "name": "市场",
      "goldCost": 200,
      "completionTechniquePoints": 30,
      "absorbable": true,
      "levels": [
        {
          "level": 1,
          "typeId": 31,
          "maxDurability": 500
        },
        {
          "level": 2,
          "typeId": 50,
          "maxDurability": 600
        },
        {
          "level": 3,
          "typeId": 51,
          "maxDurability": 700
        }
      ]
    },
    {
      "kind": "farm",
      "name": "农场",
      "goldCost": 200,
      "completionTechniquePoints": 30,
      "absorbable": true,
      "levels": [
        {
          "level": 1,
          "typeId": 32,
          "maxDurability": 500
        },
        {
          "level": 2,
          "typeId": 52,
          "maxDurability": 600
        },
        {
          "level": 3,
          "typeId": 53,
          "maxDurability": 700
        }
      ]
    },
    {
      "kind": "barracks",
      "name": "兵舍",
      "goldCost": 300,
      "completionTechniquePoints": 30,
      "absorbable": true,
      "levels": [
        {
          "level": 1,
          "typeId": 33,
          "maxDurability": 800
        },
        {
          "level": 2,
          "typeId": 54,
          "maxDurability": 900
        },
        {
          "level": 3,
          "typeId": 55,
          "maxDurability": 1000
        }
      ]
    },
    {
      "kind": "forge",
      "name": "锻冶",
      "goldCost": 300,
      "completionTechniquePoints": 30,
      "absorbable": true,
      "levels": [
        {
          "level": 1,
          "typeId": 34,
          "maxDurability": 800
        },
        {
          "level": 2,
          "typeId": 56,
          "maxDurability": 900
        },
        {
          "level": 3,
          "typeId": 57,
          "maxDurability": 1000
        }
      ]
    },
    {
      "kind": "stable",
      "name": "厩舍",
      "goldCost": 300,
      "completionTechniquePoints": 30,
      "absorbable": true,
      "levels": [
        {
          "level": 1,
          "typeId": 35,
          "maxDurability": 800
        },
        {
          "level": 2,
          "typeId": 58,
          "maxDurability": 900
        },
        {
          "level": 3,
          "typeId": 59,
          "maxDurability": 1000
        }
      ]
    },
    {
      "kind": "workshop",
      "name": "工房",
      "goldCost": 300,
      "completionTechniquePoints": 30,
      "absorbable": false,
      "levels": [
        {
          "level": 1,
          "typeId": 36,
          "maxDurability": 800
        }
      ]
    },
    {
      "kind": "shipyard",
      "name": "造船厂",
      "goldCost": 300,
      "completionTechniquePoints": 30,
      "absorbable": false,
      "levels": [
        {
          "level": 1,
          "typeId": 37,
          "maxDurability": 800
        }
      ]
    },
    {
      "kind": "mint",
      "name": "造币厂",
      "goldCost": 400,
      "completionTechniquePoints": 50,
      "absorbable": false,
      "levels": [
        {
          "level": 1,
          "typeId": 38,
          "maxDurability": 1000
        }
      ]
    },
    {
      "kind": "granary",
      "name": "谷仓",
      "goldCost": 400,
      "completionTechniquePoints": 50,
      "absorbable": false,
      "levels": [
        {
          "level": 1,
          "typeId": 39,
          "maxDurability": 1000
        }
      ]
    }
  ],
  "incomeRows": {
    "market": [
      100,
      120,
      150
    ],
    "farm": [
      1500,
      1800,
      2250
    ]
  },
  "combatHpWriterRecovered": false
}
```

### 附录O：有名官职完整目录

```json
{
  "version": "named-offices-v1",
  "source": "docs/sources/ranks.json",
  "sourceSha256": "9b8c836e1d0b0c13dddf37d78393c323dfc86ffe98b897be1e79dfe823da4752",
  "rulerTitles": [
    {
      "key": "none",
      "name": "無",
      "unlockedTier": 0,
      "referenceCitiesRequired": 1,
      "rulerCommand": 10000
    },
    {
      "key": "provincial-inspector",
      "name": "州刺史",
      "unlockedTier": 1,
      "referenceCitiesRequired": 2,
      "rulerCommand": 11000
    },
    {
      "key": "provincial-governor",
      "name": "州牧",
      "unlockedTier": 2,
      "referenceCitiesRequired": 4,
      "rulerCommand": 11000
    },
    {
      "key": "yulin-zhonglangjiang",
      "name": "羽林中郎將",
      "unlockedTier": 3,
      "referenceCitiesRequired": 6,
      "rulerCommand": 12000
    },
    {
      "key": "wuguan-zhonglangjiang",
      "name": "五官中郎將",
      "unlockedTier": 4,
      "referenceCitiesRequired": 8,
      "rulerCommand": 12000
    },
    {
      "key": "grand-general",
      "name": "大將軍",
      "unlockedTier": 5,
      "referenceCitiesRequired": 12,
      "rulerCommand": 13000
    },
    {
      "key": "grand-marshal",
      "name": "大司馬",
      "unlockedTier": 6,
      "referenceCitiesRequired": 14,
      "rulerCommand": 13000
    },
    {
      "key": "duke",
      "name": "公",
      "unlockedTier": 7,
      "referenceCitiesRequired": 18,
      "rulerCommand": 14000
    },
    {
      "key": "king",
      "name": "王",
      "unlockedTier": 8,
      "referenceCitiesRequired": 20,
      "rulerCommand": 14000
    },
    {
      "key": "emperor",
      "name": "皇帝",
      "unlockedTier": 9,
      "referenceCitiesRequired": 24,
      "rulerCommand": 15000
    }
  ],
  "offices": [
    {
      "officeId": 0,
      "sourceRowIndex": 0,
      "name": "丞相",
      "requiredTier": 9,
      "requiredMerit": 36000,
      "command": 15000,
      "bonusText": "政治+5",
      "monthlySalary": 60,
      "kind": "top-civil"
    },
    {
      "officeId": 1,
      "sourceRowIndex": 1,
      "name": "司空",
      "requiredTier": 9,
      "requiredMerit": 36000,
      "command": 15000,
      "bonusText": "政治+5",
      "monthlySalary": 60,
      "kind": "top-civil"
    },
    {
      "officeId": 2,
      "sourceRowIndex": 2,
      "name": "太尉",
      "requiredTier": 9,
      "requiredMerit": 36000,
      "command": 15000,
      "bonusText": "政治+5",
      "monthlySalary": 60,
      "kind": "top-civil"
    },
    {
      "officeId": 3,
      "sourceRowIndex": 3,
      "name": "司徒",
      "requiredTier": 9,
      "requiredMerit": 36000,
      "command": 15000,
      "bonusText": "政治+5",
      "monthlySalary": 60,
      "kind": "top-civil"
    },
    {
      "officeId": 4,
      "sourceRowIndex": 4,
      "name": "大都督",
      "requiredTier": 9,
      "requiredMerit": 36000,
      "command": 15000,
      "bonusText": "統率+2",
      "monthlySalary": 55,
      "kind": "military"
    },
    {
      "officeId": 5,
      "sourceRowIndex": 5,
      "name": "衛將軍",
      "requiredTier": 9,
      "requiredMerit": 36000,
      "command": 15000,
      "bonusText": "統率+2",
      "monthlySalary": 55,
      "kind": "military"
    },
    {
      "officeId": 6,
      "sourceRowIndex": 6,
      "name": "驃騎將軍",
      "requiredTier": 9,
      "requiredMerit": 36000,
      "command": 15000,
      "bonusText": "統率+2",
      "monthlySalary": 55,
      "kind": "military"
    },
    {
      "officeId": 7,
      "sourceRowIndex": 7,
      "name": "車騎將軍",
      "requiredTier": 9,
      "requiredMerit": 36000,
      "command": 15000,
      "bonusText": "統率+2",
      "monthlySalary": 55,
      "kind": "military"
    },
    {
      "officeId": 8,
      "sourceRowIndex": 8,
      "name": "光祿勳",
      "requiredTier": 8,
      "requiredMerit": 32000,
      "command": 9000,
      "bonusText": "政治+5",
      "monthlySalary": 50,
      "kind": "civil"
    },
    {
      "officeId": 9,
      "sourceRowIndex": 9,
      "name": "大司農",
      "requiredTier": 8,
      "requiredMerit": 32000,
      "command": 9000,
      "bonusText": "政治+5",
      "monthlySalary": 50,
      "kind": "civil"
    },
    {
      "officeId": 10,
      "sourceRowIndex": 10,
      "name": "廷尉",
      "requiredTier": 8,
      "requiredMerit": 32000,
      "command": 9000,
      "bonusText": "政治+5",
      "monthlySalary": 50,
      "kind": "civil"
    },
    {
      "officeId": 11,
      "sourceRowIndex": 11,
      "name": "衛尉",
      "requiredTier": 8,
      "requiredMerit": 32000,
      "command": 9000,
      "bonusText": "政治+5",
      "monthlySalary": 50,
      "kind": "civil"
    },
    {
      "officeId": 12,
      "sourceRowIndex": 12,
      "name": "征東將軍",
      "requiredTier": 8,
      "requiredMerit": 32000,
      "command": 14000,
      "bonusText": "統率+1",
      "monthlySalary": 50,
      "kind": "military"
    },
    {
      "officeId": 13,
      "sourceRowIndex": 13,
      "name": "征南將軍",
      "requiredTier": 8,
      "requiredMerit": 32000,
      "command": 14000,
      "bonusText": "統率+1",
      "monthlySalary": 50,
      "kind": "military"
    },
    {
      "officeId": 14,
      "sourceRowIndex": 14,
      "name": "征西將軍",
      "requiredTier": 8,
      "requiredMerit": 32000,
      "command": 14000,
      "bonusText": "統率+1",
      "monthlySalary": 50,
      "kind": "military"
    },
    {
      "officeId": 15,
      "sourceRowIndex": 15,
      "name": "征北將軍",
      "requiredTier": 8,
      "requiredMerit": 32000,
      "command": 14000,
      "bonusText": "統率+1",
      "monthlySalary": 50,
      "kind": "military"
    },
    {
      "officeId": 16,
      "sourceRowIndex": 16,
      "name": "尚書令",
      "requiredTier": 7,
      "requiredMerit": 28000,
      "command": 9000,
      "bonusText": "政治+4",
      "monthlySalary": 45,
      "kind": "civil"
    },
    {
      "officeId": 17,
      "sourceRowIndex": 17,
      "name": "太僕",
      "requiredTier": 7,
      "requiredMerit": 28000,
      "command": 9000,
      "bonusText": "政治+4",
      "monthlySalary": 45,
      "kind": "civil"
    },
    {
      "officeId": 18,
      "sourceRowIndex": 18,
      "name": "太常",
      "requiredTier": 7,
      "requiredMerit": 28000,
      "command": 9000,
      "bonusText": "政治+4",
      "monthlySalary": 45,
      "kind": "civil"
    },
    {
      "officeId": 19,
      "sourceRowIndex": 19,
      "name": "大鴻臚",
      "requiredTier": 7,
      "requiredMerit": 28000,
      "command": 9000,
      "bonusText": "政治+4",
      "monthlySalary": 45,
      "kind": "civil"
    },
    {
      "officeId": 20,
      "sourceRowIndex": 20,
      "name": "鎮東將軍",
      "requiredTier": 7,
      "requiredMerit": 28000,
      "command": 13000,
      "bonusText": "統率+1",
      "monthlySalary": 45,
      "kind": "military"
    },
    {
      "officeId": 21,
      "sourceRowIndex": 21,
      "name": "鎮南將軍",
      "requiredTier": 7,
      "requiredMerit": 28000,
      "command": 13000,
      "bonusText": "統率+1",
      "monthlySalary": 45,
      "kind": "military"
    },
    {
      "officeId": 22,
      "sourceRowIndex": 22,
      "name": "鎮西將軍",
      "requiredTier": 7,
      "requiredMerit": 28000,
      "command": 13000,
      "bonusText": "統率+1",
      "monthlySalary": 45,
      "kind": "military"
    },
    {
      "officeId": 23,
      "sourceRowIndex": 23,
      "name": "鎮北將軍",
      "requiredTier": 7,
      "requiredMerit": 28000,
      "command": 13000,
      "bonusText": "統率+1",
      "monthlySalary": 45,
      "kind": "military"
    },
    {
      "officeId": 24,
      "sourceRowIndex": 24,
      "name": "中書令",
      "requiredTier": 6,
      "requiredMerit": 24000,
      "command": 8000,
      "bonusText": "政治+4",
      "monthlySalary": 40,
      "kind": "civil"
    },
    {
      "officeId": 25,
      "sourceRowIndex": 25,
      "name": "御史中丞",
      "requiredTier": 6,
      "requiredMerit": 24000,
      "command": 8000,
      "bonusText": "政治+4",
      "monthlySalary": 40,
      "kind": "civil"
    },
    {
      "officeId": 26,
      "sourceRowIndex": 26,
      "name": "執金吾",
      "requiredTier": 6,
      "requiredMerit": 24000,
      "command": 8000,
      "bonusText": "政治+4",
      "monthlySalary": 40,
      "kind": "civil"
    },
    {
      "officeId": 27,
      "sourceRowIndex": 27,
      "name": "少府",
      "requiredTier": 6,
      "requiredMerit": 24000,
      "command": 8000,
      "bonusText": "政治+4",
      "monthlySalary": 40,
      "kind": "civil"
    },
    {
      "officeId": 28,
      "sourceRowIndex": 28,
      "name": "安東將軍",
      "requiredTier": 6,
      "requiredMerit": 24000,
      "command": 12000,
      "bonusText": null,
      "monthlySalary": 40,
      "kind": "military"
    },
    {
      "officeId": 29,
      "sourceRowIndex": 29,
      "name": "安南將軍",
      "requiredTier": 6,
      "requiredMerit": 24000,
      "command": 12000,
      "bonusText": null,
      "monthlySalary": 40,
      "kind": "military"
    },
    {
      "officeId": 30,
      "sourceRowIndex": 30,
      "name": "安西將軍",
      "requiredTier": 6,
      "requiredMerit": 24000,
      "command": 12000,
      "bonusText": null,
      "monthlySalary": 40,
      "kind": "military"
    },
    {
      "officeId": 31,
      "sourceRowIndex": 31,
      "name": "安北將軍",
      "requiredTier": 6,
      "requiredMerit": 24000,
      "command": 12000,
      "bonusText": null,
      "monthlySalary": 40,
      "kind": "military"
    },
    {
      "officeId": 32,
      "sourceRowIndex": 32,
      "name": "秘書令",
      "requiredTier": 5,
      "requiredMerit": 20000,
      "command": 8000,
      "bonusText": "政治+3",
      "monthlySalary": 35,
      "kind": "civil"
    },
    {
      "officeId": 33,
      "sourceRowIndex": 33,
      "name": "侍中",
      "requiredTier": 5,
      "requiredMerit": 20000,
      "command": 8000,
      "bonusText": "政治+3",
      "monthlySalary": 35,
      "kind": "civil"
    },
    {
      "officeId": 34,
      "sourceRowIndex": 34,
      "name": "留府長史",
      "requiredTier": 5,
      "requiredMerit": 20000,
      "command": 8000,
      "bonusText": "政治+3",
      "monthlySalary": 35,
      "kind": "civil"
    },
    {
      "officeId": 35,
      "sourceRowIndex": 35,
      "name": "太学博士",
      "requiredTier": 5,
      "requiredMerit": 20000,
      "command": 8000,
      "bonusText": "政治+3",
      "monthlySalary": 35,
      "kind": "civil"
    },
    {
      "officeId": 36,
      "sourceRowIndex": 36,
      "name": "左將軍",
      "requiredTier": 5,
      "requiredMerit": 20000,
      "command": 11000,
      "bonusText": null,
      "monthlySalary": 35,
      "kind": "military"
    },
    {
      "officeId": 37,
      "sourceRowIndex": 37,
      "name": "右將軍",
      "requiredTier": 5,
      "requiredMerit": 20000,
      "command": 11000,
      "bonusText": null,
      "monthlySalary": 35,
      "kind": "military"
    },
    {
      "officeId": 38,
      "sourceRowIndex": 38,
      "name": "前將軍",
      "requiredTier": 5,
      "requiredMerit": 20000,
      "command": 11000,
      "bonusText": null,
      "monthlySalary": 35,
      "kind": "military"
    },
    {
      "officeId": 39,
      "sourceRowIndex": 39,
      "name": "後將軍",
      "requiredTier": 5,
      "requiredMerit": 20000,
      "command": 11000,
      "bonusText": null,
      "monthlySalary": 35,
      "kind": "military"
    },
    {
      "officeId": 40,
      "sourceRowIndex": 40,
      "name": "謁者僕射",
      "requiredTier": 4,
      "requiredMerit": 16000,
      "command": 7000,
      "bonusText": "政治+3",
      "monthlySalary": 30,
      "kind": "civil"
    },
    {
      "officeId": 41,
      "sourceRowIndex": 41,
      "name": "都尉",
      "requiredTier": 4,
      "requiredMerit": 16000,
      "command": 7000,
      "bonusText": "政治+3",
      "monthlySalary": 30,
      "kind": "civil"
    },
    {
      "officeId": 42,
      "sourceRowIndex": 42,
      "name": "黄門侍郎",
      "requiredTier": 4,
      "requiredMerit": 16000,
      "command": 7000,
      "bonusText": "政治+3",
      "monthlySalary": 30,
      "kind": "civil"
    },
    {
      "officeId": 43,
      "sourceRowIndex": 43,
      "name": "太史令",
      "requiredTier": 4,
      "requiredMerit": 16000,
      "command": 7000,
      "bonusText": "政治+3",
      "monthlySalary": 30,
      "kind": "civil"
    },
    {
      "officeId": 44,
      "sourceRowIndex": 44,
      "name": "軍師將軍",
      "requiredTier": 4,
      "requiredMerit": 16000,
      "command": 10000,
      "bonusText": null,
      "monthlySalary": 30,
      "kind": "military"
    },
    {
      "officeId": 45,
      "sourceRowIndex": 45,
      "name": "安国將軍",
      "requiredTier": 4,
      "requiredMerit": 16000,
      "command": 10000,
      "bonusText": null,
      "monthlySalary": 30,
      "kind": "military"
    },
    {
      "officeId": 46,
      "sourceRowIndex": 46,
      "name": "破虜將軍",
      "requiredTier": 4,
      "requiredMerit": 16000,
      "command": 10000,
      "bonusText": null,
      "monthlySalary": 30,
      "kind": "military"
    },
    {
      "officeId": 47,
      "sourceRowIndex": 47,
      "name": "討逆將軍",
      "requiredTier": 4,
      "requiredMerit": 16000,
      "command": 10000,
      "bonusText": null,
      "monthlySalary": 30,
      "kind": "military"
    },
    {
      "officeId": 48,
      "sourceRowIndex": 48,
      "name": "郎中",
      "requiredTier": 3,
      "requiredMerit": 12000,
      "command": 7000,
      "bonusText": "政治+2",
      "monthlySalary": 25,
      "kind": "civil"
    },
    {
      "officeId": 49,
      "sourceRowIndex": 49,
      "name": "從事中郎",
      "requiredTier": 3,
      "requiredMerit": 12000,
      "command": 7000,
      "bonusText": "政治+2",
      "monthlySalary": 25,
      "kind": "civil"
    },
    {
      "officeId": 50,
      "sourceRowIndex": 50,
      "name": "長史",
      "requiredTier": 3,
      "requiredMerit": 12000,
      "command": 7000,
      "bonusText": "政治+2",
      "monthlySalary": 25,
      "kind": "civil"
    },
    {
      "officeId": 51,
      "sourceRowIndex": 51,
      "name": "司馬",
      "requiredTier": 3,
      "requiredMerit": 12000,
      "command": 7000,
      "bonusText": "政治+2",
      "monthlySalary": 25,
      "kind": "civil"
    },
    {
      "officeId": 52,
      "sourceRowIndex": 52,
      "name": "平東將軍",
      "requiredTier": 3,
      "requiredMerit": 12000,
      "command": 9000,
      "bonusText": null,
      "monthlySalary": 25,
      "kind": "military"
    },
    {
      "officeId": 53,
      "sourceRowIndex": 53,
      "name": "平南將軍",
      "requiredTier": 3,
      "requiredMerit": 12000,
      "command": 9000,
      "bonusText": null,
      "monthlySalary": 25,
      "kind": "military"
    },
    {
      "officeId": 54,
      "sourceRowIndex": 54,
      "name": "平西將軍",
      "requiredTier": 3,
      "requiredMerit": 12000,
      "command": 9000,
      "bonusText": null,
      "monthlySalary": 25,
      "kind": "military"
    },
    {
      "officeId": 55,
      "sourceRowIndex": 55,
      "name": "平北將軍",
      "requiredTier": 3,
      "requiredMerit": 12000,
      "command": 9000,
      "bonusText": null,
      "monthlySalary": 25,
      "kind": "military"
    },
    {
      "officeId": 56,
      "sourceRowIndex": 56,
      "name": "太楽令",
      "requiredTier": 2,
      "requiredMerit": 8000,
      "command": 6000,
      "bonusText": "政治+2",
      "monthlySalary": 20,
      "kind": "civil"
    },
    {
      "officeId": 57,
      "sourceRowIndex": 57,
      "name": "大倉令",
      "requiredTier": 2,
      "requiredMerit": 8000,
      "command": 6000,
      "bonusText": "政治+2",
      "monthlySalary": 20,
      "kind": "civil"
    },
    {
      "officeId": 58,
      "sourceRowIndex": 58,
      "name": "武庫令",
      "requiredTier": 2,
      "requiredMerit": 8000,
      "command": 6000,
      "bonusText": "政治+2",
      "monthlySalary": 20,
      "kind": "civil"
    },
    {
      "officeId": 59,
      "sourceRowIndex": 59,
      "name": "衛士令",
      "requiredTier": 2,
      "requiredMerit": 8000,
      "command": 6000,
      "bonusText": "政治+2",
      "monthlySalary": 20,
      "kind": "civil"
    },
    {
      "officeId": 60,
      "sourceRowIndex": 60,
      "name": "牙門將軍",
      "requiredTier": 2,
      "requiredMerit": 8000,
      "command": 8000,
      "bonusText": null,
      "monthlySalary": 20,
      "kind": "military"
    },
    {
      "officeId": 61,
      "sourceRowIndex": 61,
      "name": "護軍",
      "requiredTier": 2,
      "requiredMerit": 8000,
      "command": 8000,
      "bonusText": null,
      "monthlySalary": 20,
      "kind": "military"
    },
    {
      "officeId": 62,
      "sourceRowIndex": 62,
      "name": "偏將軍",
      "requiredTier": 2,
      "requiredMerit": 8000,
      "command": 8000,
      "bonusText": null,
      "monthlySalary": 20,
      "kind": "military"
    },
    {
      "officeId": 63,
      "sourceRowIndex": 63,
      "name": "裨將軍",
      "requiredTier": 2,
      "requiredMerit": 8000,
      "command": 8000,
      "bonusText": null,
      "monthlySalary": 20,
      "kind": "military"
    },
    {
      "officeId": 64,
      "sourceRowIndex": 64,
      "name": "主簿",
      "requiredTier": 1,
      "requiredMerit": 4000,
      "command": 6000,
      "bonusText": "政治+1",
      "monthlySalary": 15,
      "kind": "civil"
    },
    {
      "officeId": 65,
      "sourceRowIndex": 65,
      "name": "諫議大夫",
      "requiredTier": 1,
      "requiredMerit": 4000,
      "command": 6000,
      "bonusText": "政治+1",
      "monthlySalary": 15,
      "kind": "civil"
    },
    {
      "officeId": 66,
      "sourceRowIndex": 66,
      "name": "侍郎",
      "requiredTier": 1,
      "requiredMerit": 4000,
      "command": 6000,
      "bonusText": "政治+1",
      "monthlySalary": 15,
      "kind": "civil"
    },
    {
      "officeId": 67,
      "sourceRowIndex": 67,
      "name": "中郎",
      "requiredTier": 1,
      "requiredMerit": 4000,
      "command": 6000,
      "bonusText": "政治+1",
      "monthlySalary": 15,
      "kind": "civil"
    },
    {
      "officeId": 68,
      "sourceRowIndex": 68,
      "name": "忠義校尉",
      "requiredTier": 1,
      "requiredMerit": 4000,
      "command": 7000,
      "bonusText": null,
      "monthlySalary": 15,
      "kind": "military"
    },
    {
      "officeId": 69,
      "sourceRowIndex": 69,
      "name": "昭信校尉",
      "requiredTier": 1,
      "requiredMerit": 4000,
      "command": 7000,
      "bonusText": null,
      "monthlySalary": 15,
      "kind": "military"
    },
    {
      "officeId": 70,
      "sourceRowIndex": 70,
      "name": "儒林校尉",
      "requiredTier": 1,
      "requiredMerit": 4000,
      "command": 7000,
      "bonusText": null,
      "monthlySalary": 15,
      "kind": "military"
    },
    {
      "officeId": 71,
      "sourceRowIndex": 71,
      "name": "建議校尉",
      "requiredTier": 1,
      "requiredMerit": 4000,
      "command": 7000,
      "bonusText": null,
      "monthlySalary": 15,
      "kind": "military"
    },
    {
      "officeId": 72,
      "sourceRowIndex": 72,
      "name": "左僕射",
      "requiredTier": 0,
      "requiredMerit": 0,
      "command": 5000,
      "bonusText": "政治+1",
      "monthlySalary": 10,
      "kind": "civil"
    },
    {
      "officeId": 73,
      "sourceRowIndex": 73,
      "name": "右僕射",
      "requiredTier": 0,
      "requiredMerit": 0,
      "command": 5000,
      "bonusText": "政治+1",
      "monthlySalary": 10,
      "kind": "civil"
    },
    {
      "officeId": 74,
      "sourceRowIndex": 74,
      "name": "典農校尉",
      "requiredTier": 0,
      "requiredMerit": 0,
      "command": 5000,
      "bonusText": "政治+1",
      "monthlySalary": 10,
      "kind": "civil"
    },
    {
      "officeId": 75,
      "sourceRowIndex": 75,
      "name": "議郎",
      "requiredTier": 0,
      "requiredMerit": 0,
      "command": 5000,
      "bonusText": "政治+1",
      "monthlySalary": 10,
      "kind": "civil"
    },
    {
      "officeId": 76,
      "sourceRowIndex": 76,
      "name": "奮威校尉",
      "requiredTier": 0,
      "requiredMerit": 0,
      "command": 6000,
      "bonusText": null,
      "monthlySalary": 10,
      "kind": "military"
    },
    {
      "officeId": 77,
      "sourceRowIndex": 77,
      "name": "長水校尉",
      "requiredTier": 0,
      "requiredMerit": 0,
      "command": 6000,
      "bonusText": null,
      "monthlySalary": 10,
      "kind": "military"
    },
    {
      "officeId": 78,
      "sourceRowIndex": 78,
      "name": "破賊校尉",
      "requiredTier": 0,
      "requiredMerit": 0,
      "command": 6000,
      "bonusText": null,
      "monthlySalary": 10,
      "kind": "military"
    },
    {
      "officeId": 79,
      "sourceRowIndex": 79,
      "name": "武衛校尉",
      "requiredTier": 0,
      "requiredMerit": 0,
      "command": 6000,
      "bonusText": null,
      "monthlySalary": 10,
      "kind": "military"
    }
  ],
  "unsupportedInternalEntry": 80
}
```

### 附录F：工资及金写入政策完整来源

```json
{
  "version": "city-finance-policies-v1",
  "calendar": {
    "id": "finite-ten-day-calendar-v1",
    "days": [
      1,
      11,
      21
    ],
    "quarterMonths": [
      1,
      4,
      7,
      10
    ],
    "minYear": 1,
    "maxYear": 9999,
    "maxAdvanceLimit": 360,
    "initialDateAlreadySettled": true,
    "advanceCountPerCommand": 1
  },
  "ownership": {
    "id": "fixed-owned-city-v1",
    "cityKind": "city",
    "activeForceMustOwn": true,
    "ownershipChanges": false
  },
  "payroll": {
    "id": "complete-named-office-payroll-v1",
    "catalogVersion": "named-offices-v1",
    "officeRange": [
      0,
      79
    ],
    "maxOfficers": 80,
    "role": "ordinary-officer",
    "uniqueOffice": true,
    "completeResidentRoster": true,
    "prisonerCount": 0,
    "order": "ascending-code-unit-id",
    "payer": "fixed-city"
  },
  "incomeRoster": {
    "id": "stable-income-roster-v1",
    "skills": [
      "wealthy",
      "rice-way",
      "taxation",
      "levy"
    ],
    "stacking": "boolean-existence",
    "refresh": "each-advance",
    "source": "fixed-complete-resident-roster",
    "security": "before-seasonal-loss"
  },
  "adjacency": {
    "id": "supplied-axial-complete-support-v1",
    "distance": "max(abs(dq),abs(dr),abs(dq+dr))",
    "distanceRequired": 1,
    "supportMustBeComplete": true,
    "mintKinds": [
      "market"
    ],
    "granaryKinds": [
      "farm"
    ],
    "stacking": "boolean-existence"
  },
  "facilities": {
    "id": "documented-income-facility-table-v1",
    "slots": 30,
    "catalogVersion": "documented-income-facility-table-v1",
    "incompleteUpgradeFallback": "kernel",
    "completeWord": 1,
    "incompleteWord": 0,
    "forgeStableIncomeTypeSentinel": 0
  },
  "harvest": {
    "id": "post-monthly-harvest-snapshot-v1",
    "completeFutureMonthList": true,
    "initialCurrent": null,
    "application": "before-monthly-income",
    "missing": "reject",
    "nativeDisasterGeneration": false
  },
  "income": {
    "id": "documented-month-quarter-income-order-v1",
    "normalDifficultyWord": 1,
    "superDifficultyWord": 2,
    "easy": "reject-profile-only",
    "monthlyOrder": [
      "money-base",
      "wealthy-bonus",
      "food-base",
      "rice-way-bonus",
      "seasonal-security",
      "full-salary",
      "specialty-1-to-4"
    ],
    "taxation": "floor(M/2)-each-ten-day-turn",
    "wealthy": "month-start-only-floor(requested-money-base/2)",
    "foodGate": "quarter-start-or-levy",
    "foodModifiers": [
      "harvest-floor(3F/2)",
      "levy-floor(G/2)"
    ],
    "riceWay": "quarter-start-only-floor(requested-food-base/2)"
  },
  "credit": {
    "id": "saturating-positive-credit-v1",
    "accepted": "min(requested,capacity-before)",
    "discarded": "requested-accepted",
    "bonusBasis": "requested-base",
    "caps": "explicit-scenario-not-native"
  },
  "debit": {
    "id": "exact-affordable-salary-debit-v1",
    "amount": "sum-of-catalog-monthlySalary",
    "affordability": "after-income-caps",
    "partialPayment": false,
    "personCashWallet": false
  },
  "shortfall": {
    "id": "atomic-month-reject-shortfall-v1",
    "reason": "unsupported-salary-shortfall",
    "rollback": "whole-advance-including-calendar-and-rng",
    "nativeFinalizer": false
  },
  "security": {
    "id": "seasonal-security-bounded-tape-v1",
    "adminBound": 100,
    "adminSkipBelow": 50,
    "lossBound": 3,
    "missingGovernorCharm": 0,
    "base": "floor(max(1,90-charm)/10)",
    "requestedLoss": "min(5,base+roll3)",
    "floor": 0,
    "adminSkipConsumesLossDraw": false,
    "noGovernorStillConsumesLossDraw": true,
    "nativePrng": false,
    "evidence": "provisional-engine-rule"
  },
  "specialty": {
    "id": "documented-matching-complete-facilities-v1",
    "order": [
      1,
      2,
      3,
      4
    ],
    "matchingKinds": {
      "1": "forge",
      "2": "forge",
      "3": "forge",
      "4": "stable"
    },
    "completedFacilityWeight": 1,
    "governorRequired": true,
    "arithmeticProfile": "comment-f32-rne-trunc-v1",
    "kernelRequestCap": 1500,
    "nativeMatchingHelperRecovered": false
  },
  "capacity": {
    "id": "bounded-finance-input-v1",
    "maxGoldFoodCapacity": 1000000000,
    "maxEquipmentCapacity": 1000000,
    "maxTroops": 150000,
    "maxSecurity": 100,
    "maxBaseProductionWord": 65535,
    "maxRngDraws": 720,
    "maxTraceAttempts": 1080,
    "maxCanonicalUtf8Bytes": 67108864,
    "maxInputNodes": 4000000,
    "maxInputDepth": 48,
    "maxArrayLength": 1080,
    "maxObjectKeys": 128,
    "maxIdLength": 64,
    "capacityFailure": "budget-exceeded"
  },
  "persistence": {
    "id": "canonical-recompute-v1",
    "schemaVersion": 1,
    "policyComparison": "full-parameters",
    "catalogComparison": "full-snapshot",
    "digest": "sha256-canonical-json",
    "genesisSnapshot": "recompute",
    "receipts": "compare-all-fields",
    "finalSnapshot": "compare-all-fields",
    "jsonDuplicateKeys": "reject",
    "objectKeyOrder": "irrelevant",
    "arrayOrder": "preserved",
    "nativeExecution": false
  },
  "specialtyArithmetic": {
    "id": "comment-f32-rne-trunc-v1",
    "constantBitsU32": {
      "half": 1056964608,
      "one": 1065353216,
      "quarter": 1048576000,
      "two": 1073741824,
      "tenth": 1036831949,
      "three": 1077936128
    },
    "factorTiers": [
      "count=1:1",
      "2..3:1+(count-1)*half",
      "4..7:2+(count-3)*quarter",
      "8..30:3+(count-7)*tenth"
    ],
    "factorStore": "one-binary32-round-to-nearest-even",
    "politicsTerm": "floor(politics/2)+60",
    "scaledValue": "politicsTerm*storedFactor*three",
    "converter": "truncate-toward-zero",
    "requestCap": 1500,
    "evidence": "provisional-comment-constants-and-converter"
  }
}

```
