# 季初治安、巡察、市场月收与完整工资：工程合同

Profile：`bounded-seasonal-patrol-market-v1`。独立于旧 `bounded-patrol-market-income-payroll-v1` 与 `bounded-market-income-payroll-v1`；不迁移旧save，不改变旧API、schema、domain或错误顺序。

本页是闭合数据合同及静态上界说明。没有建立测试、build、compile、typecheck、runtime、validator、产品场景执行或尺寸测量结论；也不构成原EXE或native等价验证。规则正文见[季初治安巡察市场规则](../rules/bounded-seasonal-patrol-market.md)。

## 0. 范围和证据等级

恰三个命令：StartMarketDevelopment、Patrol、AdvanceSharedMarketTurn。单城、单force、单corps；1..8完整固定普通工资名单；初始0或1既有Lv1市场和恰一空lot；最多一次永久保留job；最终最多2设施、30槽；固定太守/行政改革、最多4条完整条件tape；1..12旬、25 accepted commands、32 trace attempts。终端拒绝新的Start和Patrol，合法旧ID重复仍可查询原收据。

增加既有财政私有phase的季初治安降；不接灾害、敌情变化、粮、征兵、生产、商人、收入技能、欠薪后果、HP维修、设施升级/拆除/取消、ownership变化、P078及其依赖。压力是独立固定supplied观察，不从建设两格敌情推导。source-kernels-with-provisional-owner不是native scheduler、原生财务或全游戏模拟。

## 1. 全局闭合和类型记法

代码块仅是DTO/签名合同，不是实现。每个object恰列出全部键；无任意字段、开放audit、any、unknown内部DTO。union按分支exact required；数组稠密、顺序有意义。入口unknown是安全读取边界，不能进入重建后的DTO。所有返回detached并递归冻结，public aliases全部DeepReadonly；不修改或冻结输入。

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
 officeId:number;leadership:number;charm:number;war:number;intelligence:number;politics:number;available:boolean;incomeSkills:[];initial:Progress};
type Lot={id:Id;cityId:Id;position:Position};
type ExistingMarket={id:Id;lotId:Id;cityId:Id;kind:'market';level:1;complete:true};
type Unit={id:Id;forceId:Id;position:Position};
type SourceBinding={path:string;gitBlobSha1:Blob;sha256:Digest};
type SourceBindings={constructionPolicy:SourceBinding;constructionCatalog:SourceBinding;
 offices:SourceBinding;financePolicy:SourceBinding;financeFacilities:SourceBinding;
 moneySource:SourceBinding;rateSource:SourceBinding;patrolSource:SourceBinding;domesticPolicy:SourceBinding};
type SourceBoundary={level:'source-kernels-with-provisional-owner';
 adapterObservationKind:'derived-adapter-observations';
 ownership:'provisional-engine-rule';scheduling:'provisional-engine-rule';
 writers:'provisional-engine-rule';reserve:'provisional-engine-rule';
 nativeExecution:false;stockVerified:false;nativeFullFinance:false;
 nativePayrollConsequences:false;nativeScheduler:false;nativeHp:false};
type Scenario={schemaVersion:1;profile:'bounded-seasonal-patrol-market-v1';episodeId:Id;
 clock:{date:DateV1;turn:number};advanceLimit:number;activeForceId:Id;
 force:{id:Id;initialTechniquePoints:number};
 corps:{id:Id;forceId:Id;initialActionPoints:number};
 city:{id:Id;kind:'city';ownerForceId:Id;position:Position;
 goldCapacity:number;initialGold:number;security:number;patrolUsedTurn:Marker};
 completeResidentRoster:true;prisonerCount:0;officers:OfficerFacts[];
 lots:Lot[];facilities:ExistingMarket[];facilityLotSlots:Thirty<Id|null>;
 baseMoneyWord:number;difficulty:'normal';controller:'player'|'ai';
 pressureActive:boolean;governorOfficerId:Id|null;hasAdministrativeReform:boolean;
 rng:{draws:RngTapeDraw[]};constructionEnvironment:{completeFieldUnits:true;hostileForceIds:Id[];fieldUnits:Unit[]};
 constructionCatalog:ConstructionCatalog;officesCatalog:OfficesCatalog;
 policy:Policy;sourceBindings:SourceBindings};
```

Scenario全部27键；业务首错读取顺序以§6.1为准，不以JSON键顺序决定。advanceLimit1..12；goldCapacity0..1e9，initialGold≤cap；初始security0..100，后续Patrol可增至100、季初phase可扣至0；baseMoneyWord0..65535。完整日期窗口先校验，创建当天无补发。force.id=activeForceId=city.ownerForceId=corps.forceId。人员1..8，ID与officeId各唯一，officeId恰目录0..79；role唯一ordinary-officer、每人同城同force，五项leadership/charm/war/intelligence/politics各0..100、incomeSkills恰[]。完整名单是调用者明确声明的封闭世界事实；不能从未提供人员推断确实无人遗漏，更不能默认为外部真实存档完整。busy/available=false/acted的名单成员照常付薪。五项属性固定且显式supplied，leadership解释为旧核已解析稳定值；XP不自动改属性。五XP/merit全保留；巡察仅领导XP/merit，施工仅政治XP/merit，魅力/智力/武力XP恒定。city.patrolUsedTurn初值为null或不晚于初turn，pressureActive为严格boolean且全窗固定。

lots.length=facilities.length+1∈1..2；同城，ID/坐标唯一，不与city同格；初设施0..1、只complete市场Lv1，lot存在且不重占。facilityLotSlots恰30，每个已供lot恰出现一次，其他恰null；不可重复lot、未知lot或漏lot；占空lot也保留其slot中的lotId，设施ID映射在月界重新求。声明未提供设施全部不存在是新profile范围，不拿缺数据当原作空设施。

外部单位0..16，ID唯一；hostileForceIds0..16唯一且不含owner。单位/敌对/位置全窗固定，异势力不自动敌对。只有开工检查城心距离≤2，advance不重查。各类ID分别唯一，不要求不同实体类别跨域不重名。

## 2. 固定政策、目录、来源

完整新根Policy JSON逐字列于附录R，身份为bounded-seasonal-patrol-market-v1；实际本根预算为maxUtf8Bytes=16777216、maxNodes=500000、maxRngDraws=4。附录P/F/D是各旧来源的完整正文，不是替代本根Policy；其中旧来源自己的budget/budgets值必须保留原值，不适用于本根。

ConstructionCatalog=附录C完整JSON const；OfficesCatalog=附录O完整JSON const。它们每个值、键、顺序都固定，不能只验版本/digest或删除未使用行。薪资查目录monthlySalary，不接收调用者薪资sum或身份替代值；office80明确不支持。建设查询market/type31/Lv1/D500/cost200/completionTP30；income yield100。ConstructionPolicy=附录P.common完整11键，另加apRecoveryPolicies[0]、initialWorkPolicies[0]、rewardPolicies[0]、completionActorPolicies[0]四个完整对象，键名分别apRecovery/initialWork/rewards/completionActors。旧common较大budget和calendar仅作为完整来源参数保留，本根更窄Policy.budgets优先执行。

FinancePolicies只取附录F的完整payroll/credit/debit对象，恰三个键，逐值const。所选credit/debit完整语义不删；季初security由独立SeasonalSecurityPolicy绑定附录F.security完整固定值；它不被伪装成FinancePolicies第四键。其余粮/特产政策仍只在原服务，未假称本根执行。SourceBindings九行的精确path/blob/SHA见本页“固定来源身份”，属于固定const而非任意string。产品source文件完整保存固定来源身份、原source的source/license/original范围/未证事实、政策代价及本节边界；不把原始listing长bytesHex复制入每个save或receipt。完整金核自身Evidence和rate Evidence仍逐receipt原样保留。

```ts
type FinancePolicies={payroll:/*附录F.payroll精确const*/typeof F.payroll;
 credit:/*附录F.credit精确const*/typeof F.credit;
 debit:/*附录F.debit精确const*/typeof F.debit};
type ReservePolicy={id:'remaining-window-salary-reserve-v1';
 count:'floor((dayOffset+remainingAdvances)/3)';
 requirement:'gold>=monthStarts*monthlySalary';
 start:'gold-200>=required';patrol:'gold-100>=required';borrowFutureIncome:false;
 prepaid:false;separateWallet:false;nativeRuleVerified:false};
type Policy={id:'bounded-seasonal-patrol-market-v1';version:1;
 clock:'root-completion-income-security-payroll-v1';
 ownership:'fixed-supplied-city-corps-force-v1';
 transaction:'one-command-all-or-nothing-v1';
 reservation:'root-bidirectional-market-lock-v1';
 externalFacts:'fixed-for-entire-bounded-episode-v1';
 security:'patrol-and-quarterly-security-loss-v1';seasonalSecurity:SeasonalSecurityPolicy;incomeSkills:'none';food:'not-modeled';
 payrollIdentity:'complete-fixed-ordinary-roster-v1';
 reserve:ReservePolicy;construction:ConstructionPolicy;finance:FinancePolicies;patrol:PatrolPolicy;
 budgets:{acceptedCommands:25;traceAttempts:32;maxJobs:1;maxAdvances:12;
 maxOfficers:8;maxLots:2;maxFacilities:2;maxFieldUnits:16;maxHostileForces:16;
 maxRngDraws:4;maxUtf8Bytes:16777216;maxNodes:500000;maxDepth:48;maxArray:4096;maxObjectKeys:128}};
```

F/P/C/O是附录JSON的数学名称，非未定义实现全局；实际类型由完整字面常量derive或显式readonly const结构生成。包括type alias ConstructionCatalog、OfficesCatalog、ConstructionPolicy，不得以any/unknown或省略键的schema替代。

这是有意保守的流动性政策：可能拒绝未来税收足以付工资的开工。R不占仓、不提前扣薪、不另钱包；当前可支出额gold−R。名单/office/窗口/五属性固定，治安只能由accepted Patrol核/写点与季初security phase改变，新功能不允许用未来收入借款。若不接受代价或需要名单变更/额外支出，停止重裁合同，不加欠薪、忠诚/人口惩罚或P078。

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
type OfficerRow=Progress & {id:Id;leadership:number;charm:number;war:number;intelligence:number;politics:number;reservationJobId:JobId|null};
type FacilityRow={id:Id;lotId:Id;cityId:Id;kind:'market';targetLevel:1;typeId:31;
 status:'developing'|'complete';effectiveLevel:0|1;jobId:JobId|null};
type Ledger={gold:number;goldCapacity:number;actionPoints:number;security:number;patrolUsedTurn:Marker;
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
type Current={clock:Clock;ledger:Ledger;jobs:Job[];rng:RngCurrent};
type Reserve={monthlySalary:number;remainingAdvances:number;monthStarts:number;
 required:number;gold:number;spendableGold:number};
```

RateInput政治按选择1..3人顺序，不带null；output补齐三槽，sum0..300/max0..100/half0..150/politicsRate0..250。rate=max(politicsRate,41)∈41..250，duration=ceil(375/rate)∈2..10，work125..500；最短2旬，不能套forge最短1旬。必须实际调用已交付calculateConstructionDevelopment→原rate核，保留完整输入/result/evidence。

Write负请求精确扣；正请求actual=min(request,cap−before)、discarded=request−actual。开工AP−20 cap255与gold−200 cap真实goldCapacity，用construction.writer.id；恢复AP+20、cap255、apRecovery.id；完成TP+30 cap10000、writer.id；每人政治XP+3/merit+100 cap1e9、rewards.id，饱和0增量亦完整记录。完成时其它4XP保持该完成前current值，不回滚此前巡察成长。所有正负writer均禁止-0，0保持+0。

ledger.gold是唯一可变金余额。ledger.goldCapacity只为private owned gold target的真实readonly视图键，必须等genesis.city.goldCapacity且任何phase不得改它；security仅由本根Patrol writer与季初phase writer改变，patrolUsedTurn只由accepted Patrol写current.turn。没有finance snapshot或影子wallet。Current不存R余额，Reserve完全派生。Clock唯一；revision在State不在第二child。

jobs.length0..1，完成永久保留。active: remaining1..10、completedTurn/completion=null、work<500；completed: remaining0、work500、completedTurn=dueTurn、完整completion。officerIds与politics均1..3同顺序。初设施固定顺序，新增append唯一一项；developing/effective0/job=id，complete/effective1/job=null。完成job与tick中Completion分别完整深副本，历史Start中的job是开工active副本，永不随current变化。

R推导：n=advanceLimit−clock.advancedCount，d=day1/11/21对应0/1/2；H=floor((d+n)/3)，W=按ID排序全部目录工资之和，R=H×W。Reserve各域W10..480、n0..12、H0..4、R0..1920、gold0..cap、spendableGold=gold−R≥0。完整日历枚举进入day1次数须等H；当前day1不算补发。创建要求gold≥R，开工要求gold−200≥R，巡察要求gold−100≥R；创建不要求gold≥200+R。W0仍是旧finance合法域，绝不扩给本根1..8人员。

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
type Salary={status:'paid'|'not-due';items:SalaryItem[];sum:number;
 availableBeforeSalary:number|null;paid:number;shortfall:0;
 payerPolicyId:'complete-named-office-payroll-v1'};
type MonthlyReceipt={status:'not-due'|'settled';settlement:{cityId:Id;year:number;month:number}|null;
 facilityIds:Thirty<Id|null>|null;moneyKernel:MoneyKernelCall|MoneyKernelNotDue;
 writes:GoldWrite[];salary:Salary;securityBeforeIncome:number;payerCityId:Id;
 payrollOfficerIds:Id[];incomeEffects:{taxation:false;wealthy:false}};
```

MonthlyReceipt是相关联合（schema必须oneOf表达）：not-due⇒settlement/facilityIds=null、notDue核、writes=[]、salary.status=not-due/available=null/paid0；settled⇒settlement=newDate年月/真实city、完整facilityIds/Called、writes恰[收入,工资]、salary paid/available非null/paid=sum。两支salary.items完整1..8、sum=W、payrollOfficerIds同排序、shortfall0。officeName精确匹配完整目录（UTF8最多12bytes），catalogSalary10..60；不允许自填工资、略去busy人员或只存total。incomeEffects两个false是明确本根不支持技能，原finance四技能域不变。

30槽：genesis.facilityLotSlots[i]为null或其lot当前无设施⇒facilityIds[i]=null及slot=null；developing⇒facilityId真实id、type31/construction0且必须没有adjacentMint；complete⇒type31/construction1/adjacentMint=false。先根completion后适配，所以恰在1日完成计入当月，是具名可替换新政策，不声称原scheduler顺序已恢复。安全security取本次月初实际current.security，不用genesis.security；太守只用于季初治安phase，不伪造钱核太守字段；normal difficulty1且没有cityPlayerPredicate。六个resolved rows完整保留，不缩到只有31。

原核实际调用；支持返回须每字段/30receipt/evidence完整读取并原样保留，不能用手算M替换。slots[i].index=i；null→invalid-slot/effective=null/yield=null/contribution0；developing→unfinished/effective=null/yield=null/contribution0；complete→yield/effective31/yield100/contribution100；mint false。rawMoney=base+100×completeCount≤65735；effectiveSecurity=max(50,security)50..100；scaledRaw=difficultyAdjusted=raw×100≤6573500；difficultyProduct=null；securityProduct≤657350000<2^31；securityAdjusted=floor(product/100)≤6573500；M=floor(securityAdjusted/100)≤65735。profile较原核收窄，但绝不改旧核输入域。

收入先clip：requested=M，accepted=min(M,cap−G)，actualDelta=accepted，after=G+accepted，discarded=M−accepted。即M0或满仓也保留收入write。工资随后exact W：before=收入after，requested/accepted/paid=W，actualDelta=−W，after=before−W，discarded0；cap同真实cap。先clip再薪禁止替换为净额M−W。月初工资phase以同一ledger对象为target。monthly status不能掩盖不足：任何phase unsupported-salary-shortfall仍原子拒绝并保留proposal；在合法本根可达域保留金证明使其不可能正常出现。

每条金审计链：从genesis.initialGold开始按accepted history排序；Start的fees.gold.before=上一G、after=G−200；Patrol的audit.fees.gold.before=上一G、after=G−100；tick非月无金写；月tick income.before=上一G，salary.before=income.after，最终G=salary.after；同条Reserve.before.gold和after.gold分别对应链端；每条receipt.currentDigestBefore/After对完整Current计算。最终G=initialGold−200×Start数−100×Patrol数+Σincome.actualDelta−Σsalary.accepted。保留金不是该等式中的一笔支出。fullfold逐笔重算而非只核净余额。

## 5. 命令、完整receipt和公开包装

```ts
type StartCommand={type:'StartMarketDevelopment';cityId:Id;lotId:Id;facilityId:Id;officerIds:Id[]};
type AdvanceCommand={type:'AdvanceSharedMarketTurn'};
type PatrolCommand={type:'Patrol';cityId:Id;officerIds:Id[]};
type Command=StartCommand|PatrolCommand|AdvanceCommand;
type Envelope={id:Id;expectedRevision:number;command:Command};
type UnitCheck={unitId:Id;forceId:Id;position:Position;hostile:boolean;distance:number;blocks:boolean};
type StartReservations={officers:{officerId:Id;jobBefore:null;jobAfter:JobId;
 actedBefore:Marker;actedAfter:number}[];facility:{facilityId:Id;jobBefore:null;jobAfter:JobId};
 lot:{lotId:Id;occupantBefore:null;occupantAfter:Id}};
type StartDetail={job:Job;createdFacility:FacilityRow;unitChecks:UnitCheck[];reservations:StartReservations};
type ProgressAudit={jobId:JobId;remainingBefore:number;remainingAfter:number;workBefore:number;workAfter:number};
type TickDetail={apRecovery:ConstructionWrite;progress:ProgressAudit[];
 completions:Completion[];monthly:MonthlyReceipt;seasonalSecurity:SeasonalSecurityDetail};
type CatalogDigests={construction:Digest;offices:Digest};
type ReceiptCommon={envelope:Envelope;revisionBefore:number;revisionAfter:number;
 policyDigest:Digest;catalogDigests:CatalogDigests;sourceDigest:Digest;
 sourceBoundary:SourceBoundary;clockBefore:Clock;clockAfter:Clock;
 currentDigestBefore:Digest;currentDigestAfter:Digest;
 ownerSnapshot:{activeForceId:Id;ownerForceId:Id;corpsId:Id;corpsForceId:Id};
 reserveBefore:Reserve;reserveAfter:Reserve;
 scope:'bounded-shared-seasonal-patrol-market';rngDraws:number;
 rngBefore:number;rngAfter:number;drawsConsumed:RngDrawReceipt[];nativeIntegration:false};
type Receipt=ReceiptCommon & ({kind:'market-start';detail:StartDetail}|{kind:'tick';detail:TickDetail}|{kind:'patrol';detail:PatrolDetail});
type State={tag:'san11-bounded-seasonal-patrol-market-state-v1';schemaVersion:1;
 profile:'bounded-seasonal-patrol-market-v1';genesis:Scenario;revision:number;
 current:Current;acceptedCommands:{envelope:Envelope;receipt:Receipt}[]};
type Proposal={required:number;available:number;shortfall:number};
type MoneyKernelReason='invalid-input'|'unexpected-field'|'unsupported-profile'
 |'missing-type-row'|'missing-adjacent-mint'|'unsupported-arithmetic-domain';
type Stage='input'|'rebuild'|'deduplication'|'revision'|'domain'|'construction'
 |'reservation'|'patrol'|'tick'|'money'|'seasonal-security'|'payroll'|'invariant'|'budget'|'comparison';
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
 |'invariant-mismatch'|'budget-exceeded'|'trace-outcome-mismatch'|'trace-final-mismatch'
 |'episode-closed'|'patrol-phase-rejected'|'unknown-governor'|'invalid-rng-tape'
 |'rng-tape-exhausted'|'rng-bound-mismatch';
type Failure={ok:false;committed:false;stage:Stage;reason:Reason;
 blockingUnitId:Id|null;officerId:Id|null;facilityId:Id|null;jobId:JobId|null;
 proposal:Proposal|null;kernelReason:MoneyKernelReason|null;patrolReason:PatrolReason|null;index:number|null};
type CreateOrLoadResult=Failure|{ok:true;state:State};
type InspectResult=Failure|{ok:true;revision:number;current:Current;reserve:Reserve;
 remainingHistorySlots:number;remainingAdvances:number;reservedCompletionSlots:number;
 scope:'bounded-shared-seasonal-patrol-market'};
type ExecuteResult=Failure|{ok:true;committed:boolean;duplicate:boolean;state:State;receipt:Receipt};
type PreviewResult=Failure|{ok:true;committed:false;duplicate:boolean;baseRevision:number;
 projectedCurrent:Current;receipt:Receipt};
type SaveEnvelope={tag:'san11-bounded-seasonal-patrol-market-save-v1';state:State};
type SaveResult=Failure|{ok:true;serialized:string};
type ReplayOutcome=Failure|{ok:true;duplicate:boolean;receipt:Receipt};
type Trace={tag:'san11-bounded-seasonal-patrol-market-trace-v1';scenario:Scenario;
 attempts:{envelope:Envelope;expected:ReplayOutcome|null}[];expectedFinalState:State|null};
type ReplayResult={ok:true;state:State;outcomes:ReplayOutcome[]}|(Failure & {state:null});
```

expectedRevision0..MAX_SAFE_INTEGER，不先截到25；history/revision0..25，Trace attempts0..32。Start与Patrol officerIds1..3、唯一、输入顺序，所有其它数组界同所引用DTO。unitChecks与原units顺序一致；Start成功全blocks=false；reservations.officers恰选中顺序。Tick progress/completions各0..1；Completion.rewards/releasedIds按原选择1..3顺序。reservedCompletionSlots=active remaining或0；remainingHistory=25−revision。

Proposal仅salary-reserve-shortfall、unsupported-salary-shortfall非null：reserve创建required=R/available=initialGold；开工required=R/available=G−200、巡察required=R/available=G−100（普通gold gate保证非负），shortfall=required−available；工资required=W/available=phase见到的gold。其它Failure proposal=null。patrolReason只patrol-phase-rejected为非null（精确闭合union见§11），其它null；kernelReason只money-kernel-rejected为原有限reason，其余null。context只明确知道的首个实体ID填写，不猜；index普通API通常null；rng-tape-exhausted/rng-bound-mismatch用首个所需tape索引0..4，rebuild历史失败为0..24历史索引，replay outcome失败保留普通index，聚合/比较外层失败按下文指定0..31或null。Failure不带stack、message或任意内部对象。

### 精确公开API

```ts
export function createBoundedSeasonalPatrolMarketV1(input:unknown):BoundedSeasonalPatrolMarketCreateOrLoadResultV1;
export function inspectBoundedSeasonalPatrolMarketV1(input:unknown):BoundedSeasonalPatrolMarketInspectResultV1;
export function previewBoundedSeasonalPatrolMarketV1(input:unknown,command:unknown):BoundedSeasonalPatrolMarketPreviewResultV1;
export function executeBoundedSeasonalPatrolMarketV1(input:unknown,command:unknown):BoundedSeasonalPatrolMarketExecuteResultV1;
export function saveBoundedSeasonalPatrolMarketV1(input:unknown):BoundedSeasonalPatrolMarketSaveResultV1;
export function loadBoundedSeasonalPatrolMarketV1(serialized:string):BoundedSeasonalPatrolMarketCreateOrLoadResultV1;
export function replayBoundedSeasonalPatrolMarketV1(input:unknown):BoundedSeasonalPatrolMarketReplayResultV1;
export const BOUNDED_SEASONAL_PATROL_MARKET_POLICY:DeepReadonly<Policy>;
```

公开aliases为本合同所有DTO名称T对应BoundedSeasonalPatrolMarketTV1=DeepReadonly<T>。完整名称集合（恰下列，不导出私有helper）：Id,JobId,Digest,Blob,Marker,DateV1,Position,Clock,Progress,OfficerFacts,Lot,ExistingMarket,Unit,SourceBinding,SourceBindings,SourceBoundary,Scenario,ConstructionCatalog,OfficesCatalog,ConstructionPolicy,FinancePolicies,ReservePolicy,Policy,RateInput,RateEvidence,RateReceipt,ConstructionWritePolicyId,ConstructionWrite,OfficerRow,FacilityRow,Ledger,ConstructionReward,Completion,StartSnapshot,ConstructionFees,Work,Job,Current,Reserve,MoneySlot,MoneyTypeRows,MoneyInput,MoneyEvidence,MoneySlotReceipt,MoneyIntermediates,MoneyResult,MoneyKernelCall,MoneyKernelNotDue,GoldWrite,SalaryItem,Salary,MonthlyReceipt,StartCommand,AdvanceCommand,Command,Envelope,UnitCheck,StartReservations,StartDetail,ProgressAudit,TickDetail,CatalogDigests,ReceiptCommon,Receipt,State,Proposal,MoneyKernelReason,PatrolCommand,PatrolPolicy,PatrolWrite,PatrolReward,PatrolFees,PatrolInput,PatrolOutput,PatrolEvidence,PatrolKernelCall,PatrolCalculation,PatrolAudit,PatrolActorChange,PatrolDetail,PatrolReason,Stage,Reason,Failure,CreateOrLoadResult,InspectResult,ExecuteResult,PreviewResult,SaveEnvelope,SaveResult,ReplayOutcome,Trace,ReplayResult,SeasonalSecurityPolicy,RngTapeDraw,RngDrawReceipt,RngCurrent,SeasonalSecurityReceipt,SeasonalSecurityWrite,SeasonalSecurityDetail。DateV1名称别名特例为BoundedSeasonalPatrolMarketDateV1，避免DateV1V1；DeepReadonly/Thirty为private type constructors不另泛型公开。没有第8行为API或可选配置参数。Patrol新增DTO别名同样逐一公开，下文完整定义，不能导出宽DomesticResult/unknown。

## 6. 首错与原子业务步骤

所有入口先安全读取，不访问任意property getter。execute/preview顺序严格为detach(state)→detach(command)→完整rebuild(state)→Envelope外层exact三键/id/expectedRevision/command普通object→dedup→revision→history→command分支shape→终端门→业务。command细节有意晚于dedup/revision：同ID完整canonical相同直接取原receipt，返回最新state/current，优先于stale/history/horizon/业务；同ID任一内容不同为command-id-conflict。失败ID不登记。没有trusted-state快捷入口。

### 6.1 创建

确定创建读取序：top exact→schema/profile/episodeId→clock/advanceLimit/完整日期及turn窗口→activeForce→force→corps→city→ownership一致→completeResidentRoster/prisoners→officers逐项及ID/office唯一→governor→hasAdministrativeReform→全部rng.draws形状→完整条件窗口覆盖→lots逐项→facilities逐项→layout→30slot映射→base/difficulty/controller/pressureActive→environment→完整constructionCatalog→完整officesCatalog→完整Policy→完整SourceBindings→工资resolver→reserve gate→initialState全不变量与fitRoot。

每object先exact keys，再明列的读取序；array先长度、按index逐元素，再unique。officer内部依声明顺序验证；office范围/目录行未知unsupported-payroll-identity，后验重复office用duplicate-office，重复ID用duplicate-entity-id。数量错误invalid-officer-count；role非ordinary用unsupported-payroll-identity；incomeSkills非空unsupported-income-skill。owner不等owner-corps-mismatch，工资成员错城force用officer-city-force-mismatch。lot缺/错城/坐标冲突/城心重合/非恰一空lot→invalid-lot-layout；30映射不完整→invalid-facility-slots。固定completeFieldUnits不是true→incomplete-field-unit-snapshot。政策/目录/来源任意值不同分别unsupported-policy/catalog/source。基本值型错误invalid-number/id/date/array/fields；profile/schema/kind/difficulty/controller按同名unsupported reason。pressureActive紧接controller后校验，city.patrolUsedTurn紧接security后校验。Calendar越9999→calendar-overflow，turn+limit越安全数→turn-overflow。

初current clock advancedCount0；ledger真实初值含city.patrolUsedTurn；每OfficerRow复制完整Progress、id、五项属性，reservation=null；初设施complete/effective1/job=null；jobs/history[]；rng={cursor:0,drawsConsumed:[]}；revision0。不发工资/收入、AP/TP/成长/季初治安，不消费tape。W查完整名单；R只读派生，gold<R用salary-reserve-shortfall附完整proposal。

### 6.2 开工首错和写点

Envelope新ID/stale/history后，Start exact字段type/city/lot/facility/officerIds；选人1..3唯一，按输入顺序。stage=construction：

1. 新Start在advancedCount=limit时先episode-closed；cityId相同→owner/force/corps不变量→jobs历史<1（包括完成job）
2. 完整计算按原units顺序UnitCheck；hostile由显式列表；distance以city中心；取首blocks报hostile-within-two与blockingUnitId。若失败receipt不提交，公共Failure不携带整个检查数组
3. 按选人顺序逐个完整检查：exists→同城同force→available→reservation=null→actedTurn≠current.turn；首错填officerId
4. AP≥20→G≥200→G−200≥R；分别insufficient-action-points/insufficient-gold/salary-reserve-shortfall
5. lot存在→current不占用→facilityId在当前和永久任务历史未用；unknown-lot/occupied-lot/facility-id-reused
6. 完整catalog market/Lv1读取→调用calculateConstructionDevelopment(required500,politics,initialWork)→supported/positive→duration2..10整数→剩余窗口≥duration→date/turn due→提交Start后的25−(revision+1)≥剩余全部advance数，且≥duration
7. 同一detached candidate内AP exact debit→gold exact debit→建立唯一active job与developing facility→按选人记录reservation与acted=current.turn；无进度/XP/merit/TP→receipt→不变量/所有预算→一次提交

Job id由开工id派生；rateInput、startSnapshot、fee、完整rate及所有锁before/after保留。first error不能为方便调换成先查lot或先计算rate。late失败整candidate弃用，无ID/地块/锁/部分扣费遗留。all history accepted≤25不代替尾预留；两个门都保留。

### 6.3 唯一Advance

stage=tick：advancedCount<limit→nextDate/turn/advancedCount各一次→AP+20/cap255→有active job则advanceConstructionWork一次→due时completion→月初money→季初security→full salary→不变量/receipt/预算→一次提交。

完成门：facility存在且status developing/jobId相同→remaining0/newTurn=dueTurn/newDate=dueDate→work500→catalog completionTP30。调用completeConstructionPhase，input.job/facility/force均candidate真实引用；policies从完整construction仅投影writer/rewards/completionActors/scheduler。内部同步services.write调用calculateConstructionWrite并验证完整返回；requireReservedOfficer在phase逐人写点查candidate真实OfficerRow，必须reservation=本job，否则officer-reservation-mismatch。TP先写→按选择顺序每人政治XP/merit写→释放锁、acted=newTurn→设施complete/effective1/job=null→job.completedTurn；root保存完整completion两处。不再发第二份奖励、不重置其他XP、既有merit或余额。仅声明内部函数依赖，不允许用户callback/插件/可序列化代码。

没有active时progress/completions[]；忙或acted不阻止advance/工资；固定敌情只挡新开工，不挡完成。AP恢复与成长饱和仍成功，丢弃量真实记录。

非day1：通过相同money/seasonal-security/payroll phases的not-due分支，不调用钱核、不消费tape、不改治安；salary仍含完整items/sum；无gold write。day1：completion后的current→30事实→money phase税/富两false→income write立即写ledger.gold→seasonal-security phase（仅Jan/Apr/Jul/Oct day1 due）→full salary用同ledger→写工资。若private阶段失败，映射闭合reason（money-kernel:原reason拆成money-kernel-rejected+kernelReason，salary proposal原值）并整次回滚，包括clock/AP/完成/成长/解锁。阶段返回不是天然可信：必须核exact shape及本根窄域，并逐字段核每个phase的允许写点；money/payroll的任何cap、AP、security、rng、clock、人员或设施额外变化均报unexpected-phase-effect。seasonal-security只允许security与受控rng追加变化，完整约束见§12。

### 6.4 兼容phase接合锁定

以下为既有finance私有接口；Patrol接口另列§11。新owner不得自行复制finance业务公式，也不将public FinanceAdvance与ConstructionAdvance合并delta。

- deriveFinanceMoneyInput(facts:FinanceMoneyFacts):FinanceMoneyInputResult
- applyFinanceMoneyPhase(input:FinanceMoneyPhaseInput):FinanceMoneyPhaseResult
- compareFinanceOfficerIds(a:FinanceOfficerIdFact,b:FinanceOfficerIdFact):-1|0|1
- resolveFinancePayroll(ordered:readonly FinancePayrollOfficerFact[]):FinancePayrollResult
- applyFinanceFullSalaryPhase(input:FinanceFullSalaryPhaseInput):FinanceFullSalaryPhaseResult

FinanceMoneyFacts精确键facilities/baseMoneyWord/difficulty/controller/securityBeforeIncome；设施facts仅kind/level/complete/position、null槽，总30；这里kind market、level1、complete真实status、position来自lot。FinanceMoneyPhaseInput增加monthStart/taxationActive/wealthyActive/goldTarget；后二false，goldTarget=candidate.ledger真实对象的{gold,readonly goldCapacity}视图，不是复制钱包。成功{ok:true,kernel,writes}，kernel是完整Called或NotDue，writes此域0或1。PayrollOfficerFact仅{id,officeId}，使用compare叶对完整名单排序后resolver，成功{ok:true,payroll:{items,sum}}。FullSalaryInput={monthStart,payroll,goldTarget}，成功{ok:true,salary,write}。helper内固定复用原目录和policy IDs，不能注入任意替换目录/工资公式。root组装MonthlyReceipt.writes顺序为income phase.writes再salary.write（非null才append）。

准确错误union/readonly类型由对应私有模块定义；若与本节字段不等，必须同步修订本合同，不能cast、宽unknown接受或以同名假定兼容。旧finance的W0/not-due items、六rows、粮/季降夹在income与payroll之间、原proposal/首错及旧公共形状不得改变。新root W>0是自己的输入约束。

## 7. 全fold、safe JSON、共用错误协议

### 7.1 safe boundary

每包16,777,216 canonical UTF8 bytes、500,000 occurrence nodes、root depth0≤48、array≤4096、object≤128 keys；同一引用重复出现分别计，cycles拒绝。每普通JSON value必须safe integral number，无半整数新需求。descriptor-only读取，不接受getter/setter/symbol/非枚举字段/函数/undefined/sparse或额外属性array/非ordinary或null prototype object；先检查proxy再任何反射。Node内使用process.getBuiltinModule('node:util').types.isProxy，缺失时object boundary fail-closed invalid-data，不偷偷退化成可能触发trap的克隆。Node运行能力是该安全边界的先决条件，本页不宣称已执行验证。

严格文本parser：拒绝decoded重复key（包括转义碰撞）、无效token/尾随内容/-0/非safe integer，先限raw输入实际UTF8字节，再逐节点深度/完整canonical预算；单string token可由JSON.parse解码，对象不可先普通JSON.parse再检测已丢重复key。canonical object keys按code-unit排序，arrays保序；UTF8真实计Unicode/escape/代理项；通过域门后的普通strings全部固定短literal或ASCII IDs，只有SaveResult.serialized特长例外。字节门计算真实JSON escaping，不用JS字符串length替代。

json模块独立用于本根，可按已交付安全实现机械移植整数分支；不引入通用owner factory、不更改旧monthly半整数域。私有json函数名固定decodeBoundedMarketJson(text:string)、detachBoundedMarketData(value:unknown)、fitBoundedMarketData(value:unknown)，前二返回{ok:true,value:unknown}|{ok:false,reason:JsonReason或DataReason}，fit返回{ok:true}|{ok:false,reason:DataReason}。JsonReason=invalid-json|duplicate-json-key|invalid-number|budget-exceeded；DataReason=invalid-data|invalid-number|invalid-array|invalid-prototype|budget-exceeded。它们只做结构安全，不签发可信State。

私有errors.ts持有唯一WeakMap<object,Failure>，所有本根模块共享stop(reason,stage,context):never与caught(error):Failure；throw对象必须由此注册。caught只读取WeakMap身份，不读任意抛出对象的reason/message/getter，不duck-type或吞成成功。未知异常恒invalid-data/input且context/null。Context=Partial<Pick<Failure,'blockingUnitId'|'officerId'|'facilityId'|'jobId'|'proposal'|'kernelReason'|'patrolReason'|'index'>>。json/phase结果显式映射后才能stop；不允许不同模块复制互不识别的错误类导致所有领域错误降级。失败结果也冻结并完整预算。

### 7.2 full fold

rebuild安全读取后：State exact/tag/schema/profile→parse full genesis→revision/history长度0..25且相等→initialState并fitRoot→每history entry按序exact{envelope,receipt}→parse envelope外层→重复accepted ID拒绝duplicate-accepted-entry→相同transition产生next→完整receipt canonical比较→fitRoot全部包→下一条→raw整个State与重建State全文相等。current/digest/receipt、catalog/policy/source任何字段不能仅摘要验证。无效历史transition报history-recomputation-mismatch并保留合法context/index；错误输入shape保留其finite reason；receipt不同专用receipt-recomputation-mismatch；最终差异state-recomputation-mismatch。rebuild内stage=rebuild，budget仍budget。失败无部分state。

load只接受正确SaveEnvelope exact tag/state，不能接旧服务save或重置genesis迁移。save完整rebuild后canonical SaveEnvelope；serialized含完整State一次，不裁剪history、旧receipt、核evidence或completed job。inspect同样重建，无只读绕验证捷径。

### 7.3 不变量

每可达prefix和fold逐步都检查：

1. revision=history.length；clock.turn=initial+advancedCount、date完整日历、count≤limit；Start不改clock，Advance恰一次，AP只有初值/开工−20/巡察−20/每tick+20 clip
2. current固定人员顺序/ID/五属性，5XP与merit范围，魅力/智力/武力XP恒初；office/role/membership/availability/skills全在固定genesis；marker≤turn，只有开工/完成/巡察改acted
3. gold≤cap，cap固定，security按巡察与季初扣降时序链完整重建，patrolUsedTurn仅按巡察链重建；所有金变化恰上述审计链；salary items全员同目录同排序，每新月恰一次，创建无发薪；历史同月settlement不能重复；工资付的是完整名单，不因reservation/availability/acted而减项
4. 每个lot最多一facility；初设施恒complete；新增唯一市场与永久job同ID/lot/city；status/effective/job字段相关；所有active reservation双向吻合；非参与者无孤儿锁；completed设施与所有人员锁清除
5. active elapsed=turn−startTurn，work=min(500,125+elapsed×rate)、remaining=dueTurn−turn>0；due=start+ceil(375/rate)，rate/input/full snapshot/fee都重算；completed current500/remaining0/completion恰一次且与history相符
6. TP=初TP+唯一completion.actualDelta；每参建者政治XP/merit按完成前当前值饱和成长；每巡察者领导XP/merit按动作前值饱和，按history次序相加，绝不覆盖施工快照；不存在native增长或其它TP命令
7. W固定10..480，H按剩余日历，R=H×W，G≥R；每条Reserve.before/after与真实对应prefix相等，spendable非负；没有保留金wallet或隐性credit
8. rng.cursor=drawsConsumed.length∈0..4；累计索引恰0..cursor−1，与固定tape的已消费前缀逐值相同；顺序/目的/季初分支由完整日历及固定改革事实独立重算；所有receipt的rngBefore/After/Draws与当前切片相同
9. 25−revision≥advanceLimit−advancedCount≥active.remainingTurns（无active时末项为0），当前及所有返回预算满足；readonly深冻结不保留外部对象alias

任一晚门失败整candidate丢弃，原state可继续使用；preview执行同transition但不提交，不得有省预算/省工资/省锁的shortcut。

## 8. 所有包装、最旧duplicate及replay

fitRoot对每prefix分别检查State、{ok,state}、Inspect、raw SaveEnvelope、二次转义SaveResult、新成功Execute/Preview，以及历史每个receipt与最新State/Current的duplicate Execute/Preview。逐包检查，不组成未经承诺的巨大duplicates数组。当前最后收据小不能代替旧最大月初收据；旧月初receipt含完整kernel、薪资和可能completion，必须再计一次。Execute新提交committed=true/duplicate=false；重复committed=false/duplicate=true且receipt保持原值；Preview永远committed=false，新旧都baseRevision=最新revision，projectedCurrent为新候选或重复时最新Current。

replay先安全detach整个trace→top exact/tag→parse Scenario→attempts0..32每外壳exact→initialState。逐attempt与Execute同入口顺序产出ReplayOutcome，成功/duplicate receipt完整，失败完整Failure；失败/duplicate不占history，失败可以继续。expected不是oracle，不影响决策；非null全文相等才继续。mismatch返回stage comparison/reason trace-outcome-mismatch/index=attempt/state=null。每append outcome后检查整个ReplayResult，budget失败index=null/state=null，不冒充可继续的业务失败。最后expectedFinalState非null对整个State全文比较，差异trace-final-mismatch/index=null/state=null。外层trace解析错误不返回部分state；一般index=null，Scenario的rng覆盖错误仍保留tape index，state=null；成功返回全部outcomes/最终State。没有截断、摘要、只比较finalCurrent或漏掉expected输入全副本。

32次可以全重试同一旧最大receipt；完整Trace的expectedFinalState含full genesis/current/history，附录B逐项另算。Trace输入与ReplayResult输出是两个独立包，不拼成未提供的{trace,result}；内部内存/CPU/性能并非此JSON纸面预算结论。

## 9. 模块边界

root负责唯一transition、时钟、fullfold、所有包装及fitRoot；types负责闭合DTO；data负责固定来源和政策；json负责安全结构与canonical字节；errors提供唯一品牌失败协议；adapter负责真实current投影、既有phase调用及允许写点校验。不存在第二服务State、钱包、revision或clock。construction/finance/Patrol只接既有私有叶和phase；没有可注入callback、任意policy factory或额外公开行为API。

### 私有adapter的完整入口

以下为私有接口，不增加package public API：

```ts
resolveMarketPayroll(s:Scenario):FinancePayroll;
deriveMarketReserve(s:Scenario,current:Current,payroll:FinancePayroll):Reserve;
deriveMarketMoneyFacts(s:Scenario,current:Current):FinanceMoneyFacts;
settleMarketMonth(s:Scenario,candidate:Current,payroll:FinancePayroll):
 {monthly:MonthlyReceipt;seasonalSecurity:SeasonalSecurityDetail};
applyMarketPatrol(s:Scenario,candidate:Current,command:PatrolCommand,commandId:string):PatrolDetail;
```

resolveMarketPayroll从完整genesis.officers复制{id,officeId}，compareFinanceOfficerIds排序后调用resolveFinancePayroll，保留全部items/sum；不信任public提供的工资答案。每次create/accepted transition在完整genesis验证后先解析一次工资，Reserve及该次结算使用同一结果；这不读取或改变余额。deriveMarketMoneyFacts只投影30个当前设施和normal/controller/base/current security，不复制金账。settleMarketMonth按candidate.clock判断月初，使用candidate.ledger真实goldTarget依次调用money、seasonal-security、full salary阶段；not-due仍含完整工资列表，对前后写点作allowlist反查。所有异常保持失败，不伪装成功；整个candidate由root承担原子性。applyMarketPatrol只接收上述四参数，负责旧phase调用、返回及允许写点校验和真实候选投影；revision与本次payroll由root持有。旧phase成功并完成返回/候选校验后，root才检查真实gold.after=G−100≥R，再检查25−(revision+1)≥remainingAdvances，最后组装收据及检查不变量/包装预算；旧phase失败仍先于这两个晚门，失败时整候选丢弃。

## 10. 静态结论限制

本页公式和预算是全域纸面推导，不是测试输出。任何新字段、宽域、开放字符串或审计结构变化都需要重新证明，不得删审计或降低旧profile域来容纳。

## 11. Patrol完整闭合合同及窄phase精确接点

### 11.1 新政策与DTO（均为规范字段，不是可选注释）

PatrolPolicy只选择旧domestic writer/rewards/zeroYield三族完整值，不接生产/征兵/商人policy。保留reward中的其它kind参数是来源完整性，不表示支持那些动作。费用cap1e9沿旧Patrol费用writer；真实ledger.goldCapacity仍独立≤1e9，扣费不能超出真实cap，绝不把fee.cap改写成市场cap。以下是全部新DTO，所有object exact，tuple长度exact。

```ts
type PatrolPolicy={
 id:'ordinary-patrol-market-binding-v1';
 pressure:'independent-fixed-supplied-v1';
 attributes:'fixed-resolved-five-attributes-v1';
 opportunity:'once-per-nonterminal-turn-v1';
 terminal:'reject-new-actions-after-final-advance-v1';
 goldCost:100;actionPointsCost:20;
 writer:{id:'clip-and-return-actual-v1';version:1;
  parameters:{overflow:'clip';returned:'actual-delta'}};
 rewards:{id:'source-reward-compat-intelligence-v1';version:1;
  parameters:{patrol:'leadership';recruit:'charm';quantity:'intelligence';piece:'intelligence';
   instantXp:2;instantMerit:50;completionXp:4;completionMerit:100;cap:1000000000}};
 zeroYield:{id:'pay-zero-yield-instant-v1';version:1;parameters:{zero:'pay-and-reward'}}
};
type PatrolWrite={before:number;requested:number;returned:number;actualDelta:number;
 after:number;cap:number;discarded:number;
 policyId:'clip-and-return-actual-v1'|'saturating-accumulator-v1'|'exact-affordable-debit-v1'};
type PatrolReward={officerId:Id;attribute:'leadership';xp:PatrolWrite;merit:PatrolWrite};
type PatrolFees={gold:PatrolWrite;actionPoints:PatrolWrite;sourceApRequest:20;effectiveApCost:20};
type PatrolInput={profile:'patrol-security-gain-stable-v1';resolvedLeadershipSlots:number[];
 publicOrderByte:number;pressureHelperEax:0|1};
type PatrolOutput={supported:true;profile:'patrol-security-gain-stable-v1';
 normalizedLeadershipSlots:[number,number|null,number|null];publicOrderByte:number;
 pressureHelperEax:0|1;sumLeadership:number;baseGain:number;afterPressure:number;
 returnedDelta:number;pressureApplied:boolean;capBranch:boolean};
type PatrolEvidence={entryGates:['005CBA18','005CBA30','005CBA4C'];
 gateFailureReturn:['005CBAD6..005CBADB'];slotsAndStableLeadership:['005CBA60..005CBA81'];
 leadershipDivisionAndOffset:['005CBA87..005CBA9E'];
 pressureHelperAndFullEaxTest:['005CBAA2..005CBAAB'];pressureHalving:['005CBAAD..005CBAB4'];
 publicOrderByteAndStrictUpperClip:['005CBABA..005CBACE'];selectAndReturn:['005CBAD0..005CBAD5'];
 excludedMod:['005CBA83..005CBA97 in separate 修改 section']};
type PatrolKernelCall={api:'calculatePatrolSecurityGain';input:PatrolInput;output:PatrolOutput};
type PatrolCalculation={observationKind:'derived-adapter-observations';selectedOfficerIds:Id[];
 securityKernelReturn:number;quantityKernelReturn:null;quantityPreCapacity:null;
 priceKernelReturn:null;timeKernelReturn:null;facilityApplied:false;earlyCharmSum:null;
 moraleSecuritySnapshot:null;newRecruitMorale:null;securityWrite:PatrolWrite;
 troopWrite:null;inventoryWrite:null;moraleWrite:null;kernels:[PatrolKernelCall]};
type PatrolAudit={calculation:PatrolCalculation;fees:PatrolFees;rewards:PatrolReward[];
 events:[{type:'command-committed';subjectId:Id}];
 sideEffectsNotModeled:['technique-points','native-stat-growth','native-writer-semantics',
 'native-personnel-tasks','native-corps-effects','presentation-rng'];rngDraws:0};
type PatrolActorChange={officerId:Id;before:Progress;after:Progress;
 reservationBefore:null;reservationAfter:null};
type PatrolDetail={audit:PatrolAudit;sourceEvidence:PatrolEvidence;
 evidenceProjection:'fixed-source-evidence-not-phase-output-v1';
 patrolUsedBefore:Marker;patrolUsedAfter:number;actors:PatrolActorChange[]};
type PatrolReason='unknown-city'|'patrol-already-used'|'unknown-officer'|'officer-not-member'
 |'officer-not-present'|'officer-unavailable'|'officer-production-reserved'|'officer-already-acted'
 |'kernel-rejected'|'writer-cap-overflow'|'zero-yield'|'insufficient-gold'|'insufficient-ap';
```

§5 aliases集合新增的每个T都公开为BoundedSeasonalPatrolMarketTV1=DeepReadonly<T>；Date仍唯一特例BoundedSeasonalPatrolMarketDateV1。PatrolPolicy不接受自由参数或用户自定义cap/奖励，PatrolWrite字段全部保留returned，不误当construction的requestedDelta结构。

PatrolInput.resolvedLeadershipSlots恰选中1..3个当前固定统率，不能用politics代替。output补齐三槽null，sum0..300，baseGain2..12，afterPressure1..12，returnedDelta0..12；pressureApplied恰pressureActive；capBranch恰oldSecurity+afterPressure>100，等于100不进clip分支。所有数据来自实际旧叶调用，再逐字段检查，不允许直接用纸面公式替代旧核。旧retainKernel明确删去output.evidence，故PatrolOutput恰不含该键。sourceEvidence由固定patrolSource正文.evidence完整投影，必须标evidenceProjection；不宣称窄phase返回了它，也不改变旧receipt以补证据。完整原source正文保存在独立source artifact，不把长来源listing塞进每收据。

### 11.2 原子Patrol步骤与首错

公共安全读取/rebuild/dedup/revision/history/command-shape顺序同§6。新命令exact type/cityId/officerIds，1..3唯一合法IDs。shape之后，advancedCount=advanceLimit先episode-closed/stage domain；这只约束新请求，合法旧ID duplicate依然优先成功，最终state仍可inspect/save/load/replay。

调用新private phase，保持旧顺序：city相等→该城patrolUsedTurn≠turn→每个选人依输入顺序exists/force member/city present/available/reservation null/acted≠turn→完整patrolSecurityGain→security writer→city patrol marker→planRewards并写领导XP/merit→zero-yield policy→gold≥100→AP≥20→gold exact debit→AP exact debit→选人actedTurn=turn→完整audit。满治安收益0仍收费/成长/占城与人当旬机会。失败允许phase已改detached候选，root不得提交任何部分。

phase返回后先安全读取其返回与候选、验证exact shape/允许写点/核与费用奖励字段，再检查新root reserve：phase真实gold.after=原G−100且≥R。不足salary-reserve-shortfall/stage patrol，proposal={required:R,available:G−100,shortfall:R−(G−100)}；旧phase失败优先于该reserve门，既不提前检查R掩盖普通gold/AP错误，也不把R逻辑塞进旧phase。

phase有限失败逐个映射为patrol-phase-rejected/stage patrol/patrolReason=原reason，公共Failure的其余context均null（phase不返回entity上下文，不伪造首人）。新episode/预算/reserve/unsafe-output有各自reason，不包装成phase错误。unknown phase reason或不支持shape→unsupported-kernel-return/stage patrol。额外写点→unexpected-phase-effect/invariant。phase错误不直接塞入顶层Reason；公开PatrolReason独立保留其原词。

adapter安全核对阶段结果并白名单回写本次detached candidate、组装PatrolDetail返回后，由唯一root先检查reserve；reserve成功后root再检查25−(revision+1)≥remainingAdvances（比只预留active completion更强），失败completion-history-slots。然后root组装完整Receipt、检查所有不变量与包装预算，一次提交。PatrolDetail先在局部产生不等于提交；任一root晚门失败仍丢弃整candidate。没有新clock/AP恢复/TP/施工进度或收入结算，city/security唯一变化与audit.securityWrite完全相等。actors按选人顺序保留完整before/after五XP、merit、acted及双null reservation；未选人的任何字段变化都拒绝。before/after是该动作真实current进度，不能从genesis重置。

### 11.3 唯一账本、时点与锁

巡察人物active job期间被reservation挡住；另一未锁人物可行动。巡察acted者同旬不能开工；完成当旬人员acted=newTurn，因此虽解锁仍不能巡察，下一Advance后才可。完整工资始终全员支付，包括busy/unavailable/acted。压力boolean独立于建设敌情，敌情只影响开工；pressure=true不自行引入“有敌不许巡察”的新门。

全history治安从genesis.security开始，每Patrol按audit核/securityWrite串联；每季初Advance在income后按seasonalSecurity.security/write扣减，Start与非季初Advance不改。marker从genesis.city.patrolUsedTurn开始，仅成功Patrol写turn；Advance不重置marker，turn增加即自然恢复机会。monthly.securityBeforeIncome必须等该Advance完成后、季初扣降前的current security；完成不改治安，但不得忽略此前季初损失。当日Advance已做1日结算后再巡察，只改变下一月输入，不回溯结算。终端1日之后新巡察拒绝。

AP审计初AP−20×各Start/Patrol、每Advance+20逐次clip；不能净额算总体AP。金链初G−200×Start−100×Patrol+Σ实际收入−Σ工资；完整writer逐笔串联，工资前收入clip保留。领导XP+2与merit+50请求饱和，建设政治XP+3与merit+100按时间次序共同累加；五基础属性固定无自动升级，巡察不发原TP。

### 11.4 private接口与所有权

private签名如下，不是package public API：

applyPatrolPhase(context: DeepRO<InstantContext>, view: PatrolPhaseView, action: DeepRO<Extract<DomesticInstantAction,{type:'Patrol'}>>, calculation: Calculation): DomesticLeafResult<DomesticInstantAudit>

PatrolPhaseView exact：activeForceId；corps{actionPoints}；city{id,gold,security,patrolUsedTurn}；officers数组每项仅id/forceId/cityId/available/leadership/xp/merit/actedTurn/reservationJobId；pressureActive；policies{writer,rewards,zeroYield}。xp恰leadership/charm/intelligence/politics/war五键。context恰commandId/turn。action恰PatrolCommand。Calculation必须用既有emptyCalculation()创建，不能开放调用者提供。view无troops/morale/inventory/facilities/productionCatalog/假0事实；无需传的charm/war/intelligence/politics基础值仍完整保留在新root，投影不改它们。

新root当前ledger的字段名与phase旧Officer.xp结构不同：在本次已隔离candidate内建立一次窄view，全部值从当前真实candidate投影；phase唯一作用于这次view，不建立第二owner/state/revision/history。安全核对后把实际view gold/AP/security/marker及选人xp/merit/acted字段逐一投回同一个candidate ledger。reservation不能改；投影不扩大phase权限。失败丢弃view和整个candidate。该temporary adapter不是持久钱包，也不是靠调用另一个public owner再拼delta。finance仍直接使用candidate.ledger金target。

接口来自internal/city-patrol-phase.ts及city-patrol-phase-types.ts，emptyCalculation来自city-domestic-leaves.ts。返回失败union、mutable view、null字段、去evidence的output、copy/freeze归属和费用cap均属接口合同；不得unsafe cast宽frame或忽略额外字段。签名、政策或输出结构变化须同步复核DTO和预算。

### 巡察核的精确算术

令L为所选1..3人已解析稳定统率之和，B=floor(L/28)+2；pressureHelperEax取独立supplied pressureActive的0或1，H=pressureActive ? floor(B/2) : B；delta=(security+H<=100) ? H : 100-security。新security=security+delta。必须先加2再受压减半；恰等100不走严格上界clip分支。此根统率0..100、安全治安0..100，原核的uint8/uint32宽域不受影响。既有calculatePatrolSecurityGain实际调用及完整输出仍是审计来源，此式不是替代实现。

### 数值域闭合补充（无新增字段）

所有未重列的number仍服从§1安全整数及相关逐字段等式，不能用宽number绕开schema范围。Receipt.revisionBefore0..24/revisionAfter1..25、State/Inspect/baseRevision0..25、history slots0..25、remaining/reserved advances0..12（active reserved1..10）；duplicate的receipt revisions保留历史值，baseRevision取最新。Clock.advancedCount0..12，turn/markers服从初窗及current上界。UnitCheck.distance0..4000000；ProgressAudit.remainingBefore1..10/After0..9，workBefore125..499/workAfter166..500且after=min500,before+rate；没有active则无该项。Work.perAdvance41..250/current125..500；Job.duration2..10/remaining0..10/startTurn≤currentTurn、dueTurn=startTurn+duration安全，completedTurn仅null或dueTurn。completion政治Before/After0..100且相等。

ConstructionWrite.before/after/cap按各资源gold≤1e9/AP≤255/TP≤10000/XPmerit≤1e9；requestedDelta仅−200、−20、+20、+30、+3、+100的对应字段字面量；actualDelta负请求全额、正请求0..requested；discarded负请求0、正请求0..requested。GoldWrite.before/after/cap0..1e9；income requested0..65735、accepted/actual0..requested、discarded0..requested，writerPolicy只credit；salary requested/accepted10..480、actual−480..−10、discarded0、writerPolicy只debit。Salary.sum10..480、paid恰0或sum、available=null或0..1e9；officeId0..79且工资/name为同一目录行；payrollOfficerIds与items相同。Proposal.required1..1920/available0..1e9/shortfall1..1920且shortfall=required−available，只在确实不足时存在。Reserve.gold/spendable0..1e9，其余按§3。MoneySlotReceipt.index0..29且=i；其余字段相关union按§4。SourceBinding三string全部固定const，SalaryItem.officeName只允许目录80个原字面值；没有任意文本入口。


### Patrol数值与失败相关分支补充

PatrolWrite.before/after按security0..100、gold0..1e9、AP0..255、XP/merit0..1e9；cap按security100/fee gold1e9/AP255/奖励1e9固定。requested依字段恰security核returnedDelta0..12、gold−100、AP−20、XP+2、merit+50；returned=actualDelta，actual负请求精确、正请求0..requested；discarded=requested−actual且非负。PatrolActorChange两个Progress均完整且只有领导XP/merit/acted允许变；actor reservation前后null。Patrol markerAfter=clockBefore.turn=clockAfter.turn，before为null或此前合法marker。未知phase错误不得成为任意string。Failure.patrolReason仅patrol-phase-rejected非null，rebuild把业务原因改为history-recomputation-mismatch时该专属字段归null；其余保留实体index协议。Context类型必须包含patrolReason，固定fallback也显式patrolReason:null。


### 错误闭合与逐资源PatrolWrite关联表

Failure exact为12键：ok、committed、stage、reason、blockingUnitId、officerId、facilityId、jobId、proposal、kernelReason、patrolReason、index。其普通无proposal实例13nodes，proposal非null16nodes，与附录B7一致。schema须用相关分支：reason=patrol-phase-rejected时patrolReason为PatrolReason非null且kernelReason/proposal/context ID均null；reason=money-kernel-rejected时kernelReason非null、patrolReason/proposal=null；两salary原因proposal非null、两个kernel/phase reason=null；其他原因两reason/proposal均null。rebuild映射后按新的顶层reason重新归一专属字段，不从旧failure泄漏不相干原因。index按重建/重放位置规则填写；新RNG覆盖/消费错误另外保留首个所需tape索引0..4，历史重建时由外层历史索引替代。

以下每行除了共同8键，不得接受其他policyId或宽number：

|PatrolWrite位置|policyId|before/cap|requested|returned和actualDelta|after/discarded|
|---|---|---|---|---|---|
|audit.calculation.securityWrite|clip-and-return-actual-v1|before=动作前security0..100，cap=100|本条核output.returnedDelta0..12|二者恰min(requested,100−before)；本域核已封顶故恰requested|after=before+actualDelta；discarded=requested−actualDelta=0|
|audit.fees.gold|exact-affordable-debit-v1|before=动作前G100..真实goldCapacity≤1e9，cap=1e9|−100|均−100|after=before−100≥0；discarded=0|
|audit.fees.actionPoints|exact-affordable-debit-v1|before=动作前AP20..255，cap=255|−20|均−20|after=before−20；discarded=0|
|audit.rewards[i].xp|saturating-accumulator-v1|before=该人动作前leadershipXp0..1e9，cap=1e9|2|均min(2,1e9−before)|after=before+actualDelta；discarded=2−actualDelta|
|audit.rewards[i].merit|saturating-accumulator-v1|before=该人动作前merit0..1e9，cap=1e9|50|均min(50,1e9−before)|after=before+actualDelta；discarded=50−actualDelta|

所有0必须+0；费用两个after必须恰实际phase view和最终candidate对应字段，security同理。奖励attribute恰leadership，officerId和顺序恰请求选人，before/after还须逐项等PatrolActorChange对应Progress。fullfold重跑原phase并按本关联表全部比较，不能仅验范围或policyId集合。

## 12. 季初治安与完整条件tape：闭合合同

### 12.1 完整DTO与固定事实

```ts
type SeasonalSecurityPolicy={id:'quarterly-security-tape-v1';
 writer:'seasonal-security-bounded-tape-v1';calendar:'enter-quarter-start-after-income-v1';
 rng:'complete-window-conditional-tape-v1';nativeRngVerified:false};
type RngTapeDraw={bound:100|3;value:number};
type RngDrawReceipt=RngTapeDraw & {index:number;purpose:'administrative-reform'|'seasonal-loss'};
type RngCurrent={cursor:number;drawsConsumed:RngDrawReceipt[]};
type SeasonalSecurityReceipt={status:'not-due'|'applied'|'administrative-reform-skip';
 governorId:Id|null;charm:number|null;adminRoll:number|null;lossRoll:number|null;
 requestedLoss:number;actualLoss:number;before:number;after:number};
type SeasonalSecurityWrite={resource:'security';reason:'seasonal-security';before:number;
 requested:number;accepted:number;actualDelta:number;after:number;cap:100;discarded:number;
 writerPolicyId:'seasonal-security-bounded-tape-v1'};
type SeasonalSecurityDetail={security:SeasonalSecurityReceipt;write:SeasonalSecurityWrite|null;
 rngBefore:number;rngAfter:number;drawsConsumed:RngDrawReceipt[]};
```

所有object exact，上述7个新DTO公开为BoundedSeasonalPatrolMarketTV1=DeepReadonly<T>。内部FinanceSeasonalSecurityReceipt的全部9键原样保留；FinanceSeasonalSecurityWrite全部10键保留，但writerPolicyId在本根收窄为固定literal。不是把两个完整phase结果缩成loss摘要。无额外公开advance/security/RNG API。

governorOfficerId必填，null明确无太守；非null必须命名完整officers中的同城同force人员，否则unknown-governor/input并officerId=该ID。取此人的固定supplied charm，不从leadership/politics或XP推断；太守available=false、已行动或正在施工都不影响这一被动固定事实。null用魅力0，不从名单首人推断太守。hasAdministrativeReform是严格boolean、全窗不变；不是incomeSkills的一种，也不是Patrol压力boolean。不能在历史中更换太守、属性、改革或tape。

RngTapeDraw恰两种闭合分支：bound100/value0..99，或bound3/value0..2。所有值安全整数且不是−0。genesis.rng恰{draws}；数组0..4，每条都校验，即使最终不会消费的suffix也不能带非法值或多余键。无seed、PRNG、外部回调、概率重新采样或自动扩充。RngDrawReceipt再带index0..3与purpose；bound100只能administrative-reform，bound3只能seasonal-loss。Current.rng.cursor0..4等累计drawsConsumed.length；累计完整prefix不裁掉、去重或替换成摘要。

### 12.2 创建覆盖与最坏4抽取

创建仅枚举进入的未来日期initialDate+1..advanceLimit，不消费真实cursor。完整1..12旬窗口中每次进入Jan/Apr/Jul/Oct day1：hasAdministrativeReform=false要求下一条bound3；true先要求bound100，value<50跳过loss，否则再要求bound3。只按条件实际必需的prefix检查，不强迫skip之后提供本不应消费的loss；完成全部日期后允许保留任意结构合法suffix。完整覆盖不是只检查首个季初，不能等工程接单后才发现后续tape不足。

季初之间恰9旬。在至多12个连续未来旬中若有3次季初，其首尾距离至少18旬，与窗口跨度至多11旬矛盾，故最多2个季初。每季初最多2抽取，整个窗口最多4。因此输入数组上限4足够；若无季初，空tape合法。创建在季初day1也不补发：下一个被进入的日期才可能due。

覆盖扫描先校验全部tape行形状，再按日期抽取顺序：没有所需row→rng-tape-exhausted/input，存在但bound不同→rng-bound-mismatch/input；index是首个所需的cursor，0..4。rng对象/数组/行键、bound或value不合规范→invalid-rng-tape/input；safe boundary已先发现的unsafe value仍按原安全错误顺序返回。改革非boolean沿原invalid-data，不伪装成tape错。完整覆盖之后才检查lots及后续来源/政策/保留金，因此首错可重复。

### 12.3 精确日历、公式和完整分支

Advance先推进唯一时钟、恢复AP、完成施工，再用完成后的设施与本旬季降前治安结算money，接着调用共享applyFinanceSeasonalSecurityPhase，最后full salary。quarterStart恰新日期day1且month∈{1,4,7,10}。不在创建当天、旧日期、任意月底、每月或每第三次advance盲目触发。

- not-due：governorId保留固定ID/null；charm/adminRoll/lossRoll全null，requestedLoss=actualLoss=0，before=after，write=null；本条drawsConsumed=[]。
- administrative-reform-skip：季度已due，charm为固定太守魅力或0；先消费bound100，adminRoll0..49；lossRoll=null，两个loss0，before=after，write=null；恰1抽取。
- applied且无改革：adminRoll=null，恰消费bound3，lossRoll0..2；恰1抽取。
- applied且改革未skip：adminRoll50..99，先bound100后bound3；恰2抽取，不先偷抽loss。

应用公式：base=floor(max(1,90−charm)/10)，requestedLoss=min(5,base+lossRoll)，actualLoss=min(before,requestedLoss)，after=before−actualLoss。charm0..100、before/after0..100、requested/actual0..5。max必须在floor除法之前，所以charm90..100且lossRoll0可请求0；无太守魅力0的三个roll都被封顶为5。治安0仍按分支消费tape并返回applied，不以零收益省抽取。

applied每次保留完整write，即使requested/actual为0：before/after等security对应字段，requested=requestedLoss，accepted=actualLoss，actualDelta=actualLoss===0?0:−actualLoss，cap100，discarded=requested−accepted，固定writer ID。明确保留+0，不制造−0。其余两分支write只能null。schema以四个互斥状态族表达这些字段关系，并细分cursor0..4的完整闭合分支，同时约束write/null、0/1/2条、连续index、bound/purpose/改革roll区间。common Receipt与TickDetail的cursor及数量同样按完整分支配对；重复存放的实际draw值、固定tape以及security/write跨对象等式和公式仍由root验证。

MonthlyReceipt.securityBeforeIncome及moneyKernel.input.securityByte等于本旬季降前治安；seasonalSecurity.security.before等于同值（income不写security）；季降只影响后续动作/收入，不回溯本旬money。monthly.writes仍恰[gold income,gold salary]，security write独立完整保存在seasonalSecurity.write，不能混进GoldWrite数组，亦不能把income与salary净额化。

### 12.4 phase写点、失败、摘要与完整fold

共享私有phase签名保留：applyFinanceSeasonalSecurityPhase(input:{quarterStart:boolean;governor:{readonly id:string;readonly charm:number}|null;hasAdministrativeReform:boolean;securityTarget:{security:number};writerPolicyId:string;draw:(bound:100|3,purpose:'administrative-reform'|'seasonal-loss')=>number}):{security:FinanceSeasonalSecurityReceipt;write:FinanceSeasonalSecurityWrite|null}。

实际调用securityTarget是当前detached候选的真实ledger，不是影子city。draw闭包仅由root私有adapter建立，从已验证tape/候选cursor消费，并追加完整receipt。adapter先从固定事实生成本次期望的0..2条计划，不预先推进真实cursor；phase每次回调必须按计划bound/purpose/index消费一次。实际phase返回需安全detach，再逐字段等完整预期；候选只可改变ledger.security、rng.cursor和rng.drawsConsumed的本次后缀。governor对象也不得被改。未知返回、少抽/多抽/错误调用→unsupported-kernel-return/seasonal-security；额外候选或governor变化→unexpected-phase-effect/invariant。输入覆盖良好不代替实际调用后的返回/写点审核。

SeasonalSecurityDetail.rngBefore是本次phase开始cursor，rngAfter=before+本次length；每draw.index按顺序递增，值/界/purpose与固定tape和分支相等。common Receipt的rngBefore/After覆盖整个命令，本条drawsConsumed与TickDetail相同，rngDraws等长度；Start/Patrol全为0抽取、空本条数组、cursor不变（不是一律cursor0）。PatrolAudit.rngDraws仍0，原phase没有季初抽取。

root在每accepted prefix独立按历史fold重算季初状态、公式和全部tape消费；该审核不调用seasonal phase，也不信任adapter的摘要。full rebuild另外仍重跑真实transition并逐字段比较历史receipt与整个State。每次重建重验全部tape行（包括未消费suffix）、固定governor/reform及已消费prefix；cursor、draw索引/目的/值、roll/write、common与detail的任何不一致不能只靠最终余额或摘要相同绕过。fullfold不是签名或外部真实存档认证：改成另一组自洽genesis事实，尤其改动尚未影响任何历史输出的合法suffix，不等于必然可检测的篡改。

preview使用同transition但不提交；失败包括季初后工资/不变量/预算失败，整条候选的时钟/AP/工程完成/成长/收入/security/cursor全部弃用。后续重试不会永久损失draw。合法duplicate返回历史原receipt及最新State或Current，不重新调用phase，不再次消费；它的rngBefore/After保持历史值，可早于最新cursor。full save保存全部genesis tape、累计current draws及历史每条draw，load/replay同样重建，不接受旧profile迁移。

新增有限reason恰unknown-governor、invalid-rng-tape、rng-tape-exhausted、rng-bound-mismatch；新增stage仅seasonal-security。Failure形状不增开放detail；unknown-governor填已知officerId，rng覆盖/抽取错误填首个tape index，其余context/null规则不变。rebuild历史业务失败映射为history-recomputation-mismatch，index按该历史项，专属proposal/kernelReason/patrolReason仍按顶层reason归一。nativeRngVerified=false保持在固定政策，sourceBoundary未升级，原财政的旧错误、policy、schema、save和scheduler含义不被新根替换。

## 固定来源身份

以下为产品来源文件身份，不是运行结果或stock验证；全部九行是const。完整原文、许可、listing、MOD排除及未证边界保存在data/sources/bounded-seasonal-patrol-market-v1.json及原docs/sources文件。

|SourceBindings键|产品path|Git blob|SHA256|
|---|---|---|---|
|constructionPolicy|data/catalogs/facility-construction-policies-v1.json|08976970d8c27b24d21791c8ec1d1d8fafbf72f7|a13564ab37cc6e38fbaad6cd6a6396f8c8692f62b944a44ecadb3be8a6f45a29|
|constructionCatalog|data/catalogs/facility-construction-catalog-v1.json|95435bf6d512aab24143e3fd04dac4420bba402a|366fb875751367758606fb3fffb291682231a10606a8773bffa040ccd9fa4f43|
|offices|data/catalogs/named-offices-v1.json|c1ed4746545d4be5349a8a923afa03f8253081ce|949e956340414969224406315ce93d141e97379ca8a5403923bb9714bb8aa7c1|
|financePolicy|data/catalogs/city-finance-policies-v1.json|bd44cb42416b34f450cc6c43e94788b82b1c950b|10db1115a29d1e9b8ea294defd21b9ed170bb20032b25d00ce50f0bf5463d118|
|financeFacilities|data/catalogs/city-finance-facilities-v1.json|4224d534b90bc2f42d1a6bf325153d03e7bf1101|b7317c35bfc614a426f235a38fb32b124d808c9dbdf65ce483de17e2f2baa0d8|
|moneySource|docs/sources/city-money-income-projection.json|502c0f0d7712c8dd23aed36b61bb60815f9a2f37|cf7ff7276747b793d293e20ec53681e36a3b5232e16ce93677f595a0b33a65fd|
|rateSource|docs/sources/domestic-construction-rate.json|0c9045377d7e9df5bd1d605d2e34c76d9a0cdeeb|2a9839d373396ead062c277a8767a79c18d0d61de848236acd522cd108722bd8|
|patrolSource|docs/sources/patrol-security-gain.json|945e81cae2b188c75758f39f4cb40985edacb49c|d80ebf8f7b288b7bfc5009a83d1d056649c71baf3d1507e3dff444167d975b68|
|domesticPolicy|data/policies/bounded-city-economy-v1.json|ce688dea591803fcd293d41cb2faea45793e865d|869854ec96dee7ba9cb2ebb55cf1c287f7eca7e4239470a916ea22273c2c28bf|

季初出处另外完整保存在source artifact的seasonalSecuritySource，不增加Scenario.SourceBindings第十行：docs/sources/city-finance-lifecycle.json，Git blob 0332d979e315ed53f5f26e07cc7c42e0393c3235，SHA256 bef1cfbf5a6717b723f7ec580b86e9b7312771b28843e19093f41261b97aad29。它保留securityReference（0058D6D0、helperBodyNewlyVerified=false、原季初/PK整备政令规则锚）、完整finance.security政策及原sourceBoundary。运行时除了固定financePolicy身份，还逐值匹配该security完整政策，不能接受任意loss公式。

source artifact的researchBaseline仍为875d9dddbcb0d1990021f0cb527105d2e606aff7/tree7263dda76e0bec6f76e28fcc518295edf0f4fc48；integrationBaseline为PR103软件提交34a9496b42cf77315e03202b227242877f4b755b，两者不可混成新原生证据。季降参考边界为PC-PK；原版、其他平台、stock、原PRNG及完整helper等价均未认证。JSON schema的SourceArtifact使用整个文件精确const，包含全部原文来源/许可/声明和新增出处，不只核版本或摘要；该独立出处文件不被复制进每个runtime save/receipt。

巡察原始资料：[sjn4048/311MemoryResearch的巡查效果listing](https://github.com/sjn4048/311MemoryResearch/blob/66e167e40c3440929ec016f3872aefc3486434c1/内存资料/整理/Func-内政08-计算巡查效果.txt)，[Apache-2.0许可](https://github.com/sjn4048/311MemoryResearch/blob/66e167e40c3440929ec016f3872aefc3486434c1/LICENSE)，归属原仓库作者。原GBK及UTF8转码身份、79条/204bytes、005CBA10≤PC<005CBADC、独立MOD分支均由docs/sources/patrol-security-gain.json记录。原调用者“Func-内政09-执行巡查.txt”只提供命令上下文，原TP consume/writer return未集成。统率getter、压力helper、原writer、stock、ABI、native scheduler、跨版本差异均未关闭。

工资表来源：[日文Wiki《爵位・官职》](https://w.atwiki.jp/sangokushi11/pages/111.html)，完整80行及10爵位见附录O和docs/sources/ranks.json。社区转录不是stock表验证；内部第81项office80未知且拒绝。钱核docs/sources/city-money-income-projection.json及建设核docs/sources/domestic-construction-rate.json保留各自source/license/original listing范围、MOD排除和全部未证事实。钱核Evidence完整保存，construction RateEvidence完整保存；原43主题45快照与E/X证据债不因新组合减少。

市场work不是HP。完成→月收→季初治安→全员工资、工资保留金、100金/20AP巡察共享账、动态治安读入、终端限制及有限预算都是具名engine政策，不提升原生证据等级。

## 附录R：本根唯一生效的完整Policy const

以下逐字保存data/policies/bounded-seasonal-patrol-market-v1.json完整当前正文。Scenario.policy与导出BOUNDED_SEASONAL_PATROL_MARKET_POLICY都逐值绑定本对象；末尾seasonalSecurity为完整必填对象，budgets包含maxRngDraws=4、maxUtf8Bytes=16777216、maxNodes=500000。construction内部继承的较宽budget只是原施工来源字段，本根仍按外层budgets约束。

```json
{
  "id": "bounded-seasonal-patrol-market-v1",
  "version": 1,
  "clock": "root-completion-income-security-payroll-v1",
  "ownership": "fixed-supplied-city-corps-force-v1",
  "transaction": "one-command-all-or-nothing-v1",
  "reservation": "root-bidirectional-market-lock-v1",
  "externalFacts": "fixed-for-entire-bounded-episode-v1",
  "security": "patrol-and-quarterly-security-loss-v1",
  "incomeSkills": "none",
  "food": "not-modeled",
  "payrollIdentity": "complete-fixed-ordinary-roster-v1",
  "reserve": {
    "id": "remaining-window-salary-reserve-v1",
    "count": "floor((dayOffset+remainingAdvances)/3)",
    "requirement": "gold>=monthStarts*monthlySalary",
    "start": "gold-200>=required",
    "borrowFutureIncome": false,
    "prepaid": false,
    "separateWallet": false,
    "nativeRuleVerified": false,
    "patrol": "gold-100>=required"
  },
  "construction": {
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
    },
    "apRecovery": {
      "id": "facility-ap20-cap255-v1",
      "version": 1,
      "perAdvance": 20,
      "cap": 255,
      "nativeFormulaRecovered": false
    },
    "initialWork": {
      "id": "facility-work-quarter-floor-v1",
      "version": 1,
      "mode": "quarter-floor",
      "divisor": 4,
      "nativeInitialWriterRecovered": false
    },
    "rewards": {
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
    "completionActors": {
      "id": "facility-completion-actors-acted-v1",
      "version": 1,
      "actedOnCompletion": true,
      "nativeMarkerRecovered": false
    }
  },
  "finance": {
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
    }
  },
  "patrol": {
    "id": "ordinary-patrol-market-binding-v1",
    "pressure": "independent-fixed-supplied-v1",
    "attributes": "fixed-resolved-five-attributes-v1",
    "opportunity": "once-per-nonterminal-turn-v1",
    "terminal": "reject-new-actions-after-final-advance-v1",
    "goldCost": 100,
    "actionPointsCost": 20,
    "writer": {
      "id": "clip-and-return-actual-v1",
      "version": 1,
      "parameters": {
        "overflow": "clip",
        "returned": "actual-delta"
      }
    },
    "rewards": {
      "id": "source-reward-compat-intelligence-v1",
      "version": 1,
      "parameters": {
        "patrol": "leadership",
        "recruit": "charm",
        "quantity": "intelligence",
        "piece": "intelligence",
        "instantXp": 2,
        "instantMerit": 50,
        "completionXp": 4,
        "completionMerit": 100,
        "cap": 1000000000
      }
    },
    "zeroYield": {
      "id": "pay-zero-yield-instant-v1",
      "version": 1,
      "parameters": {
        "zero": "pay-and-reward"
      }
    }
  },
  "budgets": {
    "acceptedCommands": 25,
    "traceAttempts": 32,
    "maxJobs": 1,
    "maxAdvances": 12,
    "maxOfficers": 8,
    "maxLots": 2,
    "maxFacilities": 2,
    "maxFieldUnits": 16,
    "maxHostileForces": 16,
    "maxUtf8Bytes": 16777216,
    "maxNodes": 500000,
    "maxDepth": 48,
    "maxArray": 4096,
    "maxObjectKeys": 128,
    "maxRngDraws": 4
  },
  "seasonalSecurity": {
    "id": "quarterly-security-tape-v1",
    "writer": "seasonal-security-bounded-tape-v1",
    "calendar": "enter-quarter-start-after-income-v1",
    "rng": "complete-window-conditional-tape-v1",
    "nativeRngVerified": false
  }
}
```

## 附录P：完整construction policy来源（selected方法见第2节）
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
## 附录C：完整ConstructionCatalog const
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
## 附录O：完整OfficesCatalog const
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
## 附录F：完整旧finance政策来源（finance选三对象，security另行固定绑定）
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

## 附录D：旧独立内政政策的完整来源，不是本根Policy

下列为data/policies/bounded-city-economy-v1.json完整来源正文，原id为bounded-city-domestic-merchant-v1。只选domestic.writer、domestic.rewards、domestic.zeroYield三个完整对象进入PatrolPolicy；其余对象仅保留来源，不执行其生产、征兵、商人政策。此来源原有budgets.maxUtf8Bytes=8388608、maxNodes=250000及其他预算不属于季初组合根，不能改写原值冒充本根政策；本根唯一生效的16 MiB、500000 nodes、4 draws完整政策见附录R。绑定附加的费用、机会、属性、压力与终端常量见§11.1完整PatrolPolicy。

```json
{
  "id": "bounded-city-domestic-merchant-v1",
  "version": 1,
  "clock": "fixed-genesis-xun-v1",
  "ownership": "fixed-supplied-city-corps-force-v1",
  "ordering": "caller-action-order-no-reordering-v1",
  "transaction": "all-or-nothing-batch-v1",
  "legalOrdering": "genesis-facility-and-request-order-v1",
  "legalPaging": "stateless-contiguous-prefix-full-state-bound-v1",
  "rewardScope": "shared-xp-merit-partial-no-tp-v1",
  "pressureBinding": "independent-supplied-domestic-helper-v1",
  "domestic": {
    "attributes": {
      "id": "stable-effective-attributes-v1",
      "version": 1,
      "parameters": {
        "snapshot": "command-start",
        "xpChangesEffectiveAbility": false
      }
    },
    "facilityMultiplier": {
      "id": "guide-levels-f32-v1",
      "version": 1,
      "parameters": {
        "levelBits": [
          "3F800000",
          "3F99999A",
          "3FC00000"
        ]
      }
    },
    "writer": {
      "id": "clip-and-return-actual-v1",
      "version": 1,
      "parameters": {
        "overflow": "clip",
        "returned": "actual-delta"
      }
    },
    "morale": {
      "id": "weighted-floor-presecurity-min20-v1",
      "version": 1,
      "parameters": {
        "rounding": "floor",
        "security": "before-write",
        "minimum": 20
      }
    },
    "productionAp": {
      "id": "production-request20-effective20-v1",
      "version": 1,
      "parameters": {
        "quantity": 20,
        "piece": 20
      }
    },
    "rewards": {
      "id": "source-reward-compat-intelligence-v1",
      "version": 1,
      "parameters": {
        "patrol": "leadership",
        "recruit": "charm",
        "quantity": "intelligence",
        "piece": "intelligence",
        "instantXp": 2,
        "instantMerit": 50,
        "completionXp": 4,
        "completionMerit": 100,
        "cap": 1000000000
      }
    },
    "zeroYield": {
      "id": "pay-zero-yield-instant-v1",
      "version": 1,
      "parameters": {
        "zero": "pay-and-reward"
      }
    },
    "presentation": {
      "id": "no-presentation-rng-no-tp-v1",
      "version": 1,
      "parameters": {
        "rngDraws": 0,
        "techniquePoints": "not-modeled"
      }
    }
  },
  "merchant": {
    "ownership": {
      "id": "merchant-fixed-owned-city-v1",
      "cityKind": "city",
      "activeOwnerCorpsMustMatch": true,
      "ownershipChanges": false
    },
    "eligibility": {
      "id": "merchant-once-city-actor-turn-v1",
      "cityTradesPerTurn": 1,
      "actorsPerTrade": 1,
      "actorMustBeAvailable": true,
      "actorMustMatchCityAndForce": true,
      "actionPointsCost": 20,
      "fixedGoldFee": 0,
      "minFoodAmount": 1,
      "maxFoodAmount": 1000000000
    },
    "hostility": {
      "id": "supplied-axial-distance-v1",
      "completeFieldUnitsRequired": true,
      "hostileForceIdsExplicit": true,
      "differentForceImpliesHostile": false,
      "distance": "max(abs(dq),abs(dr),abs(dq+dr))",
      "blockingDistanceInclusive": 2,
      "coordinateMin": -1000000,
      "coordinateMax": 1000000,
      "nativeGeometryRecovered": false
    },
    "pricing": {
      "id": "merchant-ui-rational-rounding-v1",
      "priceScale": "ui-food-per-gold",
      "uiTradePrices": [
        3,
        4,
        5,
        6,
        7
      ],
      "rawTradePriceAccepted": false,
      "requestUnit": "food",
      "buyGold": "ceil(Q*D/(uiPrice*N))",
      "sellGold": "floor(Q*N*4/(uiPrice*D*5))",
      "buyFactor": {
        "numerator": 1,
        "denominator": 1
      },
      "sellFactor": {
        "numerator": 4,
        "denominator": 5
      },
      "interpolation": "exact-unreduced-rational-v1",
      "goldFraction": "unreduced-nonnegative-decimal-strings-v1",
      "nativeRoundingRecovered": false
    },
    "zeroSale": {
      "id": "reject-zero-value-sale-v1",
      "minimumGoldCredit": 1
    },
    "capacity": {
      "id": "merchant-full-fill-cap-reject-v1",
      "maxBalanceAndCapacity": 1000000000,
      "partialFill": false,
      "discarded": 0,
      "failure": "atomic-reject"
    },
    "rewards": {
      "id": "merchant-politics-xp5-no-growth-v1",
      "politicsXpRequested": 5,
      "politicsXpCap": 1000000000,
      "automaticPoliticsGrowth": false,
      "meritDelta": 0,
      "techniquePointsDelta": 0,
      "loyaltyDelta": 0,
      "meritApplication": "not-integrated-profile-zero",
      "nativeMeritRewardRecovered": false
    }
  },
  "budgets": {
    "acceptedCommands": 128,
    "actionsPerCommand": 8,
    "traceAttempts": 512,
    "legalCandidates": 128,
    "legalPageSize": 4,
    "maxUtf8Bytes": 8388608,
    "maxNodes": 250000,
    "maxDepth": 48,
    "maxArray": 4096,
    "maxObjectKeys": 128
  }
}
```

## 附录B：逐字段预算、全部包装与完整尾

以下只用有限字段结构进行纸面上界推导。没有运行产品、测试、编译、typecheck、validator、诊断、场景或序列化尺寸测量；不把源码检查当作执行证明。原有profile全部保持原边界，新profile独立采用16,777,216 bytes、500,000 occurrence nodes、depth48、array4096、object keys128。

### B0 计数和字节引理

N(object)=1+各value的N之和；N(array)=1+各element之和；每scalar/null=1。同一引用每出现一次都计数，不能按内存共享减去副本。key不计node但计JSON bytes，root depth0。进入本根领域门后的普通key≤64 ASCII bytes；ID≤64、JobId≤68、digest64，固定literal/path与evidence每项≤68 UTF8 bytes，官职中文name≤12、君主title≤15。每个普通string的引号计入后≤70 bytes，没有内部引号、反斜线、控制字符或未配对surrogate；安全整数即使宽取25 bytes亦更小。每条object edge的key、冒号和逗号≤68 bytes，array edge更短。按每node自身≤70、每edge≤68有B<140N。实际safe boundary仍算真实UTF8/escaping，纸面引理不替代运行门。

SaveResult.serialized是唯一运行DTO中的长string，不能套普通短string引理，按B7二次转义单算。SourceArtifact是独立固定出处文件，不进入Scenario/State/receipt，也不是七API返回；其完整长listing不属于本运行预算，schema对其使用完整const而非删除来源。Schema文本本身亦不属于产品JSON包大小。

### B1 完整固定目录和政策

- ConstructionCatalog：前5多级row各19nodes，后4单级row各11，entries=1+5×19+4×11=140；incomeRows9，顶壳4，共153。
- ConstructionPolicy：root1+version1+calendar10+development10+absorption16+hostility10+ownership7+scheduler15+writer9+effects12+budget16+persistence10=117，再apRecovery6+initialWork6+rewards10+completionActors5，共144。原来源未用字段仍完整。
- OfficesCatalog：root1+四scalar4+titles数组(1+10×6)+offices数组(1+80×10)=867，保留80官职/10爵位及null。
- FinancePolicies=1+payroll13+credit6+debit6=26。ReservePolicy=10。
- PatrolPolicy=1+七scalar7+writer6+rewards13+zeroYield5=32。
- SeasonalSecurityPolicy=1+五scalar5=6。budgets=1+十五scalar15=16，包括maxRngDraws4。
- Policy=1+十一scalar11+Reserve10+Construction144+Finance26+Patrol32+Seasonal6+budgets16=246。
- 每SourceBinding4，九行SourceBindings=1+9×4=37；SourceBoundary=1+十二scalar12=13。完整目录/来源/原false证据不省略。

### B2 Genesis和current

Date4，Position3，Clock7，initial clock6，Progress8。OfficerFacts21，8数组169。Lot6，2数组13；初Market7，1数组8；city11，force3，corps4。Unit6，16数组97；constructionEnvironment=1+complete1+hostile17+units97=116；30 facilityLotSlots31。RngTapeDraw3，4数组13，genesis.rng14。

Scenario有原十一scalar加governor/reform二scalar共13。因此N=1+13+clock6+force3+corps4+city11+officers169+lots13+facilities8+slots31+environment116+constructionCatalog153+officesCatalog867+Policy246+bindings37+rng14=1692，宽取2200。governor/null计同样一node，不把新事实藏在预算外。

OfficerRow15，8数组121；FacilityRow10，2数组21；Ledger=1+五scalar5+force2+officers121+facilities21=150。RngDrawReceipt=1+四scalar4=5，4累计数组21，RngCurrent=1+cursor1+array21=23。Current=1+Clock7+Ledger150+jobsArray1+completedJob210+RngCurrent23=392，宽取450。Reserve7，无第二wallet。

### B3 施工及月初完整审计

RateEvidence20，RateReceipt=1+十二scalar12+三槽4+evidence20=37；RateInput7；ConstructionWrite8；ConstructionReward=1+officer1+两write16+双politics2=20。Completion=1+六scalar6+TP8+rewards61+releasedIds4=80。ConstructionFees17，Work42，StartSnapshot≤30，Job active≤130、completed≤210，全部input/rate/evidence/双日期/费用/snapshot/completion保留。

UnitCheck9，16数组145；StartReservations28。StartDetail=1+Job130+Facility10+checks145+reservations28=314。ProgressAudit6，1数组7。

MoneySlot最多2非null，30数组≤37；六type rows19。MoneyInput=1+四scalar4+slots37+rows19=61。每MoneySlotReceipt8，30数组241；intermediates6，MoneyEvidence20。MoneyResult=1+九scalar9+slots241+intermediates6+evidence20=277；MoneyKernelCall=1+四scalar4+input61+result277=343。

GoldWrite11，二笔数组23；SalaryItem5，8数组41；Salary=1+六scalar6+items41=48。MonthlyReceipt=1+status1+settlement4+facilityIds31+kernel343+writes23+salary48+security1+payer1+payrollIds9+effects3=465，宽取565。季降前的security是同一scalar，完整seasonal另算，绝不裁掉月核evidence或工资items。

SeasonalSecurityReceipt=1+九scalar9=10，SeasonalSecurityWrite=1+十scalar10=11；本次draws最多2，数组11。SeasonalSecurityDetail=1+security10+write11+双cursor2+draws11=35；其not-due/skip分支更小。

TickDetail=1+APWrite8+progress7+completions81+Monthly565+Seasonal35=697。此式允许施工完成、月收/工资、季初双抽取/降治安同旬发生，不能取这些任务的最大值代替相加。

### B4 Patrol逐字段

PatrolWrite9；PatrolReward=1+officer/attribute2+两write18=21，三reward数组64；PatrolFees=1+两write18+sourceAP/effectiveAP2=21。PatrolInput8，PatrolOutput15，PatrolKernelCall=1+api1+input8+output15=25，kernels tuple26。

PatrolCalculation16键共53nodes，保留observation、选人、securityReturn、所有其他返回null、facilityApplied=false、securityWrite、其它write null及完整kernels。PatrolAudit=1+calculation53+fees21+rewards64+events4+sideEffects7+rng1=151。PatrolEvidence=1+entryGates4+其余八数组各2=21。

PatrolActorChange=1+officer1+beforeProgress8+afterProgress8+双reservation2=20，三actors数组61。PatrolDetail=1+audit151+sourceEvidence21+projection1+双marker2+actors61=237，宽取250。Patrol自身仍零抽取，但common receipt两个cursor均保留当前非零值。

### B5 收据与完整history

StartCommand9/Envelope12；PatrolCommand7/Envelope10；AdvanceCommand2/Envelope5，统一Envelope≤12。Receipt公共壳（含kind，不含envelope/detail）原60nodes，再加两个cursor2与本次完整draw数组≤11，共≤73。rngDraws本身原已计一个scalar，不能漏记新增三键。

Start≤73+12+314=399；Patrol≤73+10+250=333；完整季初/月初/完成Tick≤73+5+697=775。统一Receipt宽取900。history entry≤1+Envelope12+Receipt900=913。State=root/tag/schema/profile/revision共5+Scenario2200+Current450+historyArray1+25×913=25481，宽取26000。真实完整tick不可能25次都达到最坏，但不借该优化，故覆盖所有prefix及历史最旧大收据。

### B6 深度与宽度

Construction最长Current→jobs→completedJob→completion→rewards→reward→write→scalar≤8；月核Receipt→detail→monthly→kernel→result→slots→row→scalar≤7；State→history→entry→receipt再加3。Patrol最长detail→audit→calculation→kernels→call→output→slots→scalar≤7。新增seasonal detail→draws→row→scalar与security/write更浅，current.rng同样浅。保守取Current/Receipt12、State16、外包17、Trace/Replay18，均<48。

最大领域数组为offices80；titles10、trace/outcomes32、slots30、history25、units/hostile16、roster8、tape/累计draws4、单次draws2、actors3、job1，均<4096。Scenario27键、Job22、Policy17、MoneyEvidence19、PatrolCalculation16；收据共同20键另kind/detail共22，保守32<128。完整常量中亦无开放map或无限string。

### B7 七API、全部duplicate、Save、Trace和Replay

Failure exact12键，普通13nodes；proposal由null1换成object4最多16。Replay外层failure多state:null最多17。新RNG原因只改变已有reason/index的值，不增加审计袋。

|独立公共包|nodes上界|canonical UTF8 bytes上界|
|---|---:|---:|
|create/load成功|1+ok1+State26000=26002|3,640,280|
|inspect成功|1+六scalar6+Current450+Reserve7=464|64,960|
|raw SaveEnvelope|1+tag1+State26000=26002|3,640,280|
|execute新成功或任一旧duplicate|1+三scalar3+State26000+Receipt900=26904|3,766,560|
|preview新成功或任一旧duplicate|1+四scalar4+Current450+Receipt900=1355|189,700|
|ReplayOutcome成功|1+ok1+duplicate1+Receipt900=903|126,420|
|完整ReplayResult32 outcomes|1+ok1+State26000+array1+32×903=54899|7,685,860|
|Trace32 expected和full finalState|1+tag1+Scenario2200+attemptsArray1+32×(entry1+Envelope12+expected903)+State26000=57515|8,052,100|

所有ordinary包B<140N；最大57515nodes远小于500000。Trace上界距16,777,216至少8,725,116bytes。SaveResult本身3nodes，但serialized长字串每一个原JSON字节至多二倍（本域内容无控制/未配对surrogate），完整外壳宽取27bytes：≤2×3,640,280+27=7,280,587bytes，亦小于预算。不能用其3nodes声称3×140即可。

最旧大月初/季初/完成receipt与最新最大State/Current的duplicate已各额外完整计900；32expected也全部按成功大收据，失败/空expected更小。Trace、ReplayResult、SaveResult为独立包，不另承诺把三个串在一个结果内。fitRoot每prefix仍逐个检查State、create/load、Inspect、raw/escapedSave、新Execute/Preview、每个历史receipt+最新state/current的duplicate包装；replay每append检查完整聚合。纸面上界不是删除真实预算门的理由。

### B8 保留金与完整完成尾

W=完整1..8普通名单工资，10≤W≤480；n=limit−advancedCount，d=day1/11/21对应0/1/2，H=floor((d+n)/3)≤4；R=HW。初G≥R；Start要求G−200≥R，Patrol要求G−100≥R。非月Advance不变G/H；月Advance收入A≥0再工资W，G'=G+A−W≥HW−W=(H−1)W。季降不扣金；即使治安降至0，钱核effectiveSecurity≥50且收入非负，满仓A0同样满足归纳。无借未来收入、预付工资或独立保留金wallet。

可行动turn恰k=0..limit−1，终端拒绝新Start/Patrol；每turn巡察机会至多1，P≤limit≤12；Advance T≤12，Start S≤1，h=P+T+S≤25。任prefix更强P≤min(T+1,limit)，h+n=P+S+limit≤25。根仍显式守25−revision≥remainingAdvances≥active.remainingTurns，不让额外Patrol吃掉工程完成尾。

对任active prefix，剩D∈1..10。连续使用新合法ID/正确revision提交D次Advance：日期/turn在初始完整窗口，rate41..250、duration=ceil(375/rate)2..10，work=min(500,125+elapsed×rate)，due已在开工时检查；reservation不变量保证人/设施存在，advance不受当旬机会/availability/固定敌情阻挡。每次h+1、n−1，h+n不变；保留金保证完整工资；饱和writer保证AP/成长/TP不因满cap失败。

新增RNG尾证明：完整窗口扫描只依固定日历、改革boolean与tape的已知值，实际quarter分支也只依这些量，不依巡察、治安、工资、太守魅力、人员忙或施工。创建已保证每个所需bound/value；实际prefix依同顺序消费，归纳得剩余实际需求正好是已覆盖prefix的suffix，故合法尾不应耗尽或bound错配。零治安/零loss不改变消费。全部最后完成/月收/季降/工资审计同时增长按B2–B7已覆盖，所以不能借预算或随机值耗尽放弃已接工程。

尾中若穿插合法Patrol，每次费用与h+n门继续守住同一归纳，Patrol不消耗tape。terminal duplicate保留历史receipt，不增加h、不扣费、不发薪、不消费draw。失败/preview全候选回滚，不破坏这些前缀等式；这是有限合同内纸面结论，不是原生随机数恢复或已运行测试的声明。
