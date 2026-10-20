# 巡察、市场收入与完整工资规则

本页解释独立profile `bounded-patrol-market-income-payroll-v1` 的实际规则合同。它把普通巡察、一次市场施工、月初金收入和完整普通官薪接在同一金账上。旧 `bounded-market-income-payroll-v1` 的固定治安、API、错误顺序和save不变；旧save不能隐式升级。

这是source-kernel与具名engine政策的有界组合，不是完整原作财政或native scheduler。本文只有静态规则与纸面推导，没有测试、build、compile、typecheck、runtime、validator、场景执行或产品尺寸测量结论。

## 1. 世界范围和固定事实

- 单城、单势力、单军团，所属关系全窗固定且一致
- 完整固定1..8名普通官员名单，所有人同城同势力；officeId各不同，来自完整80个有名官职目录0..79；不支持内部office80、君主、俘虏或不完整名单
- 五项统率、魅力、武力、智力、政治各0..100，均为调用者明确提供的稳定已解析值；XP不会自动提升基础属性
- 初始0或1座已完成Lv1市场，另有且仅有一空lot；最后最多两座市场；30槽明确映射所有已提供lot，每个恰一次，其余null
- 最多一次开工；完成后的job永久保留，不能完成后重开；无取消、拆除、升级、维修或吸收
- advanceLimit为1..12旬，日期仅1/11/21日，完整窗口须落在1..9999年与安全turn域内
- 建设单位快照和显式敌对列表完整、固定；各0..16项。不同势力不自动敌对。pressureActive为独立固定boolean观察，不能从单位距离、敌对列表或“城外有敌”推导
- 无粮、收入技能、季治安降、灾害、招兵、生产、商人、欠薪惩罚或P078及其依赖

调用者声明completeResidentRoster=true与completeFieldUnits=true是封闭输入事实，并不证明外部真实存档确实无人或单位遗漏。名单成员即使unavailable、已行动或参与建设，仍全额付薪。

## 2. 普通巡察：旧核公式、成本和成长

每次选1..3名不同人物，顺序保留。每位必须存在、属该势力、在该城、available=true、没有施工reservation，且actedTurn不等于当前turn。城市本旬patrolUsedTurn也不得等于当前turn。每个非终端turn最多一次成功巡察。

令L为这些人物的已解析统率之和：

1. B=floor(L/28)+2
2. H=pressureActive ? floor(B/2) : B
3. delta=(security+H<=100) ? H : 100-security
4. newSecurity=security+delta

受压减半发生在“除28再加2”之后。统率0合法；本根L为0..300，B为2..12，H为1..12，delta为0..12。恰好到100不走clip分支，严格超过100才clip。调用既有calculatePatrolSecurityGain，原核更宽uint8/uint32域不变；不能把本根的域收窄应用到旧API。pressure输入只是0或1，不冒称恢复了原压力helper。

成功巡察花100金、20AP；每名选人请求领导XP+2、功绩+50，各在1,000,000,000处饱和。其他四XP、五基础属性、技术点、施工进度和日期均不变。城市标记写当前turn，选人actedTurn写当前turn。

满治安100时delta=0，仍收费、成长、占城市与人物本旬机会；成长满cap也不免收费。巡察金费用writer的cap保留旧1,000,000,000，并非市场goldCapacity；真实账本仍始终受自己的容量约束。AP cap255，治安cap100。负费用精确扣除，正成长返回实际增量及丢弃量，零值必须为+0。

## 3. 同一金账与剩余工资保留金

令G为当前唯一ledger.gold，W为按ID排序的完整固定名单逐人查目录monthlySalary的总和。每人月薪10..60，W在10..480；不接受调用者自填工资或只给total。

n=advanceLimit−advancedCount；d为当前日1/11/21对应0/1/2；H=floor((d+n)/3)，即剩余advance将进入1日的次数；R=H×W。当前已处于1日不补发。H≤4，R≤1920。

- 创建要求G≥R，不要求先有开工费
- 开工要求G≥200且G−200≥R
- 巡察要求G≥100且G−100≥R
- 可支出额为G−R；R仅派生，不占仓、不另建钱包、不预扣工资

这是保守流动性政策，会拒绝“未来收入足以付薪但当前余额不足”的动作。不能借未来税收、巡察收益或尚未完工市场收入。巡察先按旧phase检查普通金/AP并产生候选，再检查R；R不足整次回滚，连治安、成长、机会标记、费用都不提交。

每prefix都保持G≥H×W：非月推进不变G/H；月初先收入实际A≥0，再扣W，得到G'=G+A−W≥(H−1)W。即便满仓导致A=0，工资也能支付。此证明不依赖巡察回本。

## 4. 一次市场开发和人物锁

新StartMarketDevelopment只在非终端接受。城市/归属正确且没有任何历史job后，先逐单位检查显式敌对与城心轴坐标距离：distance=max(abs(dq),abs(dr),abs(dq+dr))，敌对且距离≤2阻止开工。只在开工检查；固定敌情不阻止后续推进或完成，也不自动禁止巡察。

选1..3名人物，逐人依次查存在、同城同势力、available、无reservation、未本旬行动。然后检查AP≥20、G≥200、G−200≥R；再查lot存在且空、facilityId未在当前或永久job历史使用。

市场固定type31、Lv1、required work500、成本200金、20AP、完成技术点30；初始work125。对所选固定政治值，S为总和、Pmax为最大值：politicsRate=Pmax+floor(S/2)，durabilityMinimum=floor((500−125)/9)=41，rate=max(politicsRate,41)，duration=ceil(375/rate)。本域rate41..250、duration2..10旬：政治0单人10旬、政治100单人3旬、三人100为2旬。实际调用既有建设核，不复制替代核；work不是原生HP。

开工只扣费、建立developing/effectiveLevel0设施与唯一job、写所有参建者reservation=job及actedTurn=当前turn，不立即增长XP/功绩/技术点。开工时必须剩余窗口足够完成，还须保留全部剩余advance所需的history槽。

推进时work=min(500,work+rate)，剩余旬数减1。到期要求真实设施/双向人物锁都匹配、日期和turn等于due、work=500。随后技术点请求+30（cap10000），各参建者政治XP+3、功绩+100（cap1e9）；保留他们完成前真实其他XP和已有功绩，不能回滚此前巡察成长。设施变complete/effectiveLevel1，释放所有reservation，job完成记录永久保留。

完成时参建者actedTurn写“完成的新turn”。因此完工虽解锁，该旬仍不能巡察；再推进一旬才可。施工中锁住的人不能巡察，另一个未锁且合资格的人可巡察。先巡察的人同旬也不能再开工。

## 5. 唯一旬推进与月初收入、工资顺序

AdvanceSharedMarketTurn依次执行：

1. 检查剩余advance，日期/turn/advancedCount各推进一次
2. AP请求+20、cap255，记录实际恢复与丢弃量
3. 对active job推进一次，在到期时完成并写成长/解锁
4. 若新日期为1日，以此时真实current设施和security计算月收入
5. 收入先按容量clip入同一个ledger.gold，再全额扣完整名单工资
6. 完整审计、不变量和全部包装预算通过后一次提交

不是1日时不调用钱核、不写金；仍保留完整工资items/sum及not-due结果。创建当天没有任何补发。到1日恰好完工的市场计入本月收入，这是具名“先完成再收入”engine政策，不是已证实的原scheduler顺序。

30槽逐位投影：没有设施为null；施工中市场type31/constructionWord0，必须没有adjacentMint字段；已完成市场type31/constructionWord1/adjacentMint=false。设施ID映射和每槽完整核receipt都保留。市场yield100，baseMoneyWord为0..65535，难度固定normal、difficultyWord1，玩家/AI可供但无收入技能。

rawMoney=baseMoneyWord+100×completeMarketCount；effectiveSecurity=max(50,currentSecurity)；scaledRaw=rawMoney×100；securityProduct=scaledRaw×effectiveSecurity；securityAdjusted=floor(securityProduct/100)；M=floor(securityAdjusted/100)。实际调用calculateCityMoneyIncomeProjection并保存完整input/result/Evidence，以上算式只是本域解释。M在0..65735，securityProduct≤657350000，落在既有安全i32域。

收入requested=M，accepted=min(M,goldCapacity−G)，discarded=M−accepted；写入G+accepted后，再以完整W精确扣薪。禁止换成净额M−W：满仓时先收入actual0，再减W。收入0或被全丢弃时仍保留收入write。任何私有phase晚失败或预算失败，整个推进（含时钟、AP、完成、成长、解锁与金）全部回滚。

巡察写入的是真实current.security，后续月收读取该值；建设和推进不改治安。低于50时提升治安可能仍不增加effectiveSecurity。已完成本月1日结算后再巡察，只影响下一个月，不回算已结算收入。终端1日的新巡察被拒绝。

纸面例：初1月21日，limit1，security60，base100，一座完成市场，单统率100、office79月薪10，G500，AP足够。巡察后security65、G400；推进至2月1，收入130、再扣工资10，得G520。不巡察则收入120、结算G610。巡察多税10不代表覆盖100成本。此为手算规则说明，未执行。

## 6. 全薪、全部来源和证据边界

完整80行官职目录、10爵位、null奖金字段和建设/finance原政策见[工程文档附录P/C/O/F](../engine/bounded-patrol-market-income-payroll.md)。完整目录整体固定，不只保存实际用到的工资行；内部office80不支持。工资依据[日文Wiki《爵位・官职》](https://w.atwiki.jp/sangokushi11/pages/111.html)及docs/sources/ranks.json保留的来源，社区表不冒称stock验证。

巡察算术来源：[sjn4048/311MemoryResearch巡查效果listing](https://github.com/sjn4048/311MemoryResearch/blob/66e167e40c3440929ec016f3872aefc3486434c1/内存资料/整理/Func-内政08-计算巡查效果.txt)，[Apache-2.0许可](https://github.com/sjn4048/311MemoryResearch/blob/66e167e40c3440929ec016f3872aefc3486434c1/LICENSE)，归属原仓库作者。范围005CBA10≤PC<005CBADC，79条/204bytes；独立MOD段排除。原source、许可、转码/字节身份、命令上下文与未证事实保存在docs/sources/patrol-security-gain.json和完整组合source artifact。

旧phase保留的kernel.output刻意不带evidence，新收据额外sourceEvidence是来自固定source正文的静态投影，标记evidenceProjection='fixed-source-evidence-not-phase-output-v1'；不能说phase返回了它。钱核与建设核Evidence仍完整保存。真实统率getter、压力helper、原TP、writer、stock、ABI、原native scheduler、完整财政/欠薪后果均未验证；43主题45快照/E/X证据债不减少。

100金/20AP、饱和成长、零收益照付、共享账、独立pressure、每旬机会、工资保留金、永久单job及完成先收入均为明确集成政策。巡察政策完整保留旧domestic.writer/rewards/zeroYield三对象，其他动作的reward参数只是来源完整性，不表示本根支持这些动作。

## 7. 原子首错、重复、保存与有限预算

所有动作先安全detach state和命令，再从genesis完整重放history；然后Envelope外壳、dedup、revision、history容量、命令分支shape、终端门、业务。新ID才受后续门控制；同ID完整内容相同返回原receipt和最新state/current，优先于stale、满history和终端门；同ID内容不同为command-id-conflict。失败ID不登记。

巡察业务首错依次为城市、城市机会、按选择顺序逐人的存在/归属/在城/available/reservation/acted，再核/治安写/成长/零收益政策，再金≥100、AP≥20、扣费及acted，最后根检查工资保留金及完成尾槽。普通phase失败以patrol-phase-rejected及有限patrolReason保留；不猜phase未给出的实体ID。所有晚失败都不提交任何候选变化。

每成功动作完整保存费用、成长、核输入/输出、必要Evidence、当前摘要、真实reserve前后与完整历史。load、inspect、save、preview都执行fullfold；不能只信digest或当前余额。完整保存不是历史裁剪、摘要或临时快照。preview同一transition但永不提交。任何current、history、核、费用、奖励、marker或来源篡改都由完整重算比较拒绝。

至多12个可巡察非终端turn、12次Advance、1次Start，accepted最多25；trace attempts最多32（包含失败和重复）。每prefix显式保证25−revision≥remainingAdvances≥active.remainingTurns。只有一个永久job，已接受工程可沿合法新ID与正确revision持续Advance至完成，工资和历史槽不会中途耗尽。

每包限制8,388,608 canonical UTF8 bytes、250,000 occurrence nodes、depth48、array4096、object keys128。安全读取拒绝getter/setter、proxy、循环、稀疏数组、额外字段、不安全整数、-0、重复JSON key与非普通对象；缺少安全proxy识别能力时fail-closed。返回detached且递归冻结，不冻结或修改调用者输入。

静态最坏细项：MonthlyReceipt精确465 nodes，保守放宽565；TickDetail精确562、保守662；月初完成Receipt精确627、保守727，统一Receipt800。565不是精确加总。State保守23000；完整32 expected及expectedFinalState的Trace51115 nodes/7156100 bytes；ReplayResult48699/6817860；二次转义SaveResult≤6440587 bytes。每个旧receipt搭配最新state/current的duplicate包装、每prefix以及突然增大的完成尾均分别计算；不以最后小receipt替代最旧大receipt。完整DTO、七API、一个政策常量、别名、失败相关分支和逐字段证明见工程合同。
