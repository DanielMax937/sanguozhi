# 有限市场施工、动态月金与完整普通官薪

`bounded-market-income-payroll-v1` 只把一座新 Lv1 市场的建设、月初金收入和完整普通官薪放进同一个有限模拟。开工费用、完工奖励、收入和工资使用唯一金账本，日期也只有一个。该 profile 的 owner、调度、容量、写入和保留金是具名的 provisional engine 政策；它不等于原版精确复原，也不等于完整城市财政。

本文给出完整行为规则、来源、边界和纸面例子。所有数值例子都是静态推导，没有作为场景、测试、编译、typecheck、build、runtime、validator 或产品尺寸测量执行。精确 DTO、七个 API、完整失败集合、保存和预算见[工程接口](../engine/bounded-market-income-payroll.md)。

## 1. 一次模拟允许什么

一次 episode 固定单城、单势力 force、单军团 corps；active force、城市 owner 和军团 force 必须相同。城市金容量显式给定且全窗不变，范围 0..1,000,000,000；初始金不能超过容量。安全度 security 为 0..100，基础钱 baseMoneyWord 为 0..65,535；难度只接受 normal，controller 为 player 或 ai，normal 下二者不改变金核分支。

- 日期只有每月 1、11、21 日，year 1..9999；推进窗口为 1..12 旬
- 创建时就检查完整未来日期和 turn 窗口；越过 year9999 或安全整数 turn 的窗口拒绝
- 既有完整 Lv1 市场可以是 0 或 1 座，另有恰一个空 lot；总 lot 为 1 或 2，最终市场最多 2 座
- 只有一个 development job，而且完成后永久保留，所以本 episode 不能再开第二座
- 完整固定名单为 1..8 名普通有名官职人员，参建者每次选择其中 1..3 名
- accepted commands 最多 13，即最多一次开工加最多 12 次推进；trace attempts 最多 32
- ID 在各实体类别内分别唯一；不同类别之间不要求同名一律禁止

lot 均属本城，ID、坐标不重复，不与城中心重合，初设施占用的 lot 必须真实存在且不重占。30 个 `facilityLotSlots` 显式存 lot ID 或 null；每个提供的 lot 恰出现一次，其余为 null。空 lot 的槽位同样预先保留，月界才按该 lot 上的当前设施求真实 facility ID。

提供的数据被声明为本 episode 的完整固定事实：未提供设施在本 profile 中不存在，人员与敌情整窗不变，也没有额外支出。这只定义有限的封闭世界，不能据缺数据断言外部原版存档确实不存在那些对象。

## 2. 完整人员身份、忙碌和工资

### 2.1 谁在工资表中

`completeResidentRoster=true` 和 `prisonerCount=0` 是创建时明确声明。每人 role 必须为 `ordinary-officer`，同城同 force；officer ID 唯一，officeId 也唯一，官职只能是完整既有目录的 0..79。空名单、不完整声明、未知内部条目 80、君主身份、俘虏或用自定义薪额代替目录身份都不支持。

这是调用者提交的完整名单声明，程序无法由它认证外部真实存档没有漏人。工资“全员”的含义是这份被接受、固定、完整声明的名单，不是对所有原作人员类型或人口财政的支持。

每月工资清单从全部人员派生，复制 `{id,officeId}` 后按 ID 的 code-unit 升序排序，不按官职、选择顺序或 locale 排序。每项完整保存 officerId、officeId、目录原名 officeName 和 catalogSalary，然后求和 W。既不能只提交 total，也不能只存参建者工资。

`available=false`、正忙于本工程、已有 actedTurn 或不参与建设的名单成员，都照常计入全额工资。可用性和行动标记只影响新开工选人，不影响工资。非月初也在 not-due receipt 中保留完整工资项目和 sum，paid=0、availableBeforeSalary=null，并不把名单清空。

每人 politics 0..100 在整个窗口固定，incomeSkills 必须是空数组；五项 XP、merit 和 actedTurn 都完整保存。取得政治 XP 不自动提高 politics，也不据官职 bonusText 自动叠加政治值。输入 politics 是本 profile 接受的固定 resolved 数值。

### 2.2 完整普通官职薪资表

下表直接列出固定 `named-offices-v1` 的 80 个普通有名官职。名字保留目录原字，不做简繁替换；monthlySalary 每月 10..60。同一 episode 最多从中给 8 名不同官职的普通人员付薪。目录的 10 个 ruler titles 仍完整保留用于来源一致性，但不在本工资身份域。

|officeId|目录官职原名|每月工资|
|---:|---|---:|
|0|丞相|60|
|1|司空|60|
|2|太尉|60|
|3|司徒|60|
|4|大都督|55|
|5|衛將軍|55|
|6|驃騎將軍|55|
|7|車騎將軍|55|
|8|光祿勳|50|
|9|大司農|50|
|10|廷尉|50|
|11|衛尉|50|
|12|征東將軍|50|
|13|征南將軍|50|
|14|征西將軍|50|
|15|征北將軍|50|
|16|尚書令|45|
|17|太僕|45|
|18|太常|45|
|19|大鴻臚|45|
|20|鎮東將軍|45|
|21|鎮南將軍|45|
|22|鎮西將軍|45|
|23|鎮北將軍|45|
|24|中書令|40|
|25|御史中丞|40|
|26|執金吾|40|
|27|少府|40|
|28|安東將軍|40|
|29|安南將軍|40|
|30|安西將軍|40|
|31|安北將軍|40|
|32|秘書令|35|
|33|侍中|35|
|34|留府長史|35|
|35|太学博士|35|
|36|左將軍|35|
|37|右將軍|35|
|38|前將軍|35|
|39|後將軍|35|
|40|謁者僕射|30|
|41|都尉|30|
|42|黄門侍郎|30|
|43|太史令|30|
|44|軍師將軍|30|
|45|安国將軍|30|
|46|破虜將軍|30|
|47|討逆將軍|30|
|48|郎中|25|
|49|從事中郎|25|
|50|長史|25|
|51|司馬|25|
|52|平東將軍|25|
|53|平南將軍|25|
|54|平西將軍|25|
|55|平北將軍|25|
|56|太楽令|20|
|57|大倉令|20|
|58|武庫令|20|
|59|衛士令|20|
|60|牙門將軍|20|
|61|護軍|20|
|62|偏將軍|20|
|63|裨將軍|20|
|64|主簿|15|
|65|諫議大夫|15|
|66|侍郎|15|
|67|中郎|15|
|68|忠義校尉|15|
|69|昭信校尉|15|
|70|儒林校尉|15|
|71|建議校尉|15|
|72|左僕射|10|
|73|右僕射|10|
|74|典農校尉|10|
|75|議郎|10|
|76|奮威校尉|10|
|77|長水校尉|10|
|78|破賊校尉|10|
|79|武衛校尉|10|

工资段汇总：0..3=60，4..7=55，8..15=50，16..23=45，24..31=40，32..39=35，40..47=30，48..55=25，56..63=20，64..71=15，72..79=10。证明采用保守 10≤W≤480；officeId 唯一实际可以进一步收紧上界，但预算和完成性不依赖该优化。共享 finance 原有的空名单/W=0 仍合法，这个新 root 自己要求 1..8 人和 W>0。

## 3. 开工：500 工作量、200 金、20 AP

市场固定 `kind=market`、type31、targetLevel1、required work D=500、费用金 200、AP 20、completion TP 30。目录的 durability 数字在这里是施工工作量参数，不能当作已实现的战斗 HP、伤害或维修系统。

初始 work 采用 `facility-work-quarter-floor-v1`：floor(500/4)=125。开工当旬不再追加一次施工推进，也不发 TP、政治 XP 或 merit；第一次增加工作量在下一次 `AdvanceSharedMarketTurn`。

### 3.1 政治速率与持续时间

选中 1..3 人，保留输入顺序及各自 politics；调用既有 `calculateConstructionDevelopment`，由它调用 `domestic-construction-rate-stable-v1` 原速率核。开始时快照固定 rate，后续不重取政治。完整输入、三个输出政治槽、所有中间量、选择分支和 evidence 都保存。

设 P 为选中政治数组：

- politicsSum = sum(P)，0..300
- maxPolitics = max(P)，0..100
- halfPoliticsSum = floor(sum(P)/2)，0..150
- politicsRate = max(P)+floor(sum(P)/2)，0..250
- durabilityQuarter=125，durabilityRemainder=375
- durabilityMinimum=floor(375/9)=41
- rate=max(politicsRate,41)，范围 41..250
- durationTurns=ceil(375/rate)，范围 2..10 旬

同值时继续沿原核的 politics 分支。例如 [27,1] 的 politicsRate=41，与最低速率相等，但 selectedBranch 仍为 politics。不存在“政治为 0 就不前进”，也不能把 forge 的最短 1 旬套给市场：即使 rate250，仍需填满 375 工作量，所以至少 2 旬。

|静态选人|速率|work 纸面序列|持续旬数|
|---|---:|---|---:|
|单人 P0|41|初125；9旬494；第10旬截到500|10|
|单人 P100|150|125→275→425→500|3|
|三人均 P100|250|125→375→500|2|

上述数列是公式推导，不是程序执行记录。没有“强制十旬完成”捷径；10 只是本有限政治域和 D500 算出的最慢时长。

### 3.2 敌情、人员与首个失败

外部 field units 和 hostile force ID 各最多 16，完整声明为 true，ID 不重复，hostile 列表不得含本城 owner。坐标 q/r 在 ±1,000,000 内，整窗固定。异势力不会自动变敌对；必须在显式 hostile 列表中。

敌情只阻止新开工：以城中心为原点，hex distance=max(abs(dq),abs(dr),abs(dq+dr))≤2 的敌对单位阻断。按给定 unit 顺序保留完整检查，首个 blocks=true 单位作为失败上下文。不是以 lot 为中心，也不在推进或完成时再次检查敌情。

新 ID 命令先通过外层、去重、revision 和 history 门，再按以下业务顺序检查：

1. cityId、owner/force/corps 一致性、永久 job 历史尚空
2. 完整敌情检查
3. 按参建选择顺序检查人员存在、同城同 force、available、无已有 reservation、没有在当前 turn acted
4. AP≥20、G≥200，再检查扣 200 后仍有足够全窗保留金
5. lot 存在且未占用，facilityId 在当前及永久历史中未使用
6. 固定市场目录、原速率叶、正速率和 2..10 旬 duration；整个工程在剩余日期窗口内；开工后历史剩槽足够容纳全部完成推进
7. 在同一个 detached candidate 中精确扣 AP20、金200，建 job 和 developing facility，记录选择人员的 reservation 与 acted=current turn，形成完整 receipt 后一次提交

不能为了方便先查 lot，改变上述首错。晚失败丢弃整个 candidate，不登记失败命令 ID，不留下地块占用、人员锁或半笔扣费。没有部分支付开工费。

### 3.3 双向锁与永久 job

job ID 为 `job:` 加开工 envelope.id。job 保留 city、lot、facility、选人、政治快照、start/due 日期与 turn、duration/remaining、work、rateInput/full rate receipt、startSnapshot、费用与 completion。

active job 期间 remaining 为 1..10、work<500、completedTurn/completion=null；设施 developing/effectiveLevel0/jobId=该 job，全部参建人员 reservationJobId 指向同 job。job、设施、lot occupant 和各人员必须双向一致，不能只在一端写锁。其他人员不能有孤儿锁。

完成后 work500、remaining0、completedTurn=dueTurn，设施 complete/effectiveLevel1/jobId=null，所有参建人员释放 reservation。完成 job 及完整 completion 永久保留，因此释放人员不表示可以回收历史 job 再开工。历史 Start receipt 内的 job 始终是当时的 active 快照，不随着 current 偷换为 completed。

## 4. 推进和完工奖励

唯一推进命令 `AdvanceSharedMarketTurn` 每次只做一旬；没有另一个 finance advance 或 construction clock。顺序为具名 `root-completion-income-payroll-v1`：

1. 检查 advancedCount 未到 limit；日期、turn、advancedCount 各推进一次
2. 恢复 AP20，cap255，溢出部分记录 discarded
3. 有 active job 时仅推进一次 work：min(500,work+rate)，remaining 减 1
4. 到期时核 facility/job/全部人员锁、newDate/newTurn 与 due 一致且 work500，执行完整 completion
5. 若新日期为 1 日，按完成后的设施动态求月金，入账后支付全员工资
6. 检查不变量、完整 receipt 和所有公共包装预算，一次提交

完成使用 `next-boundary-capped-work-v1`，先 force TP+30，cap10000；再按原选择顺序为每人 politicsXp+3、merit+100，cap 均为 1e9；随后释放 reservation、acted=newTurn，更新设施，再保存 job.completedTurn。每人得到完整成长量，不均摊。leadership/charm/intelligence/war 四项 XP 不变，politics 数值也不变。

正奖励实际值=min(请求量,cap−before)，discarded=请求量−实际值。达到上限仍可完成，例如 TP9990 则 actual10/discarded20；politicsXp999999999 则 actual1/discarded2；merit999999950 则 actual50/discarded50。这些是纸面说明。没有负零，零增量保持 +0 并记录完整 before/requestedDelta/actualDelta/after/cap/discarded/policyId。

无 active job 时 progress/completions 都为空数组。忙碌、当旬 acted、敌军、AP 已满都不阻止推进、工资或到期完成。完成和月结发生在同一个 candidate，任何后续 phase、锁、不变量或预算失败都撤回该次日期、AP、work、TP、成长、解锁和金账，不能留下“工程完成但月账失败”的半状态。

## 5. 动态 30 槽月初金收入

### 5.1 槽位来自当前完成状态

每次进入 1 日，先完成本旬工程，再按固定 lot-slot 映射和当前 facilities 重建全部 30 槽：

|当前映射|facilityIds 槽|钱核 input 槽|完整 result 槽|
|---|---|---|---|
|null 或对应 lot 当前无设施|null|null|invalid-slot，effectiveType/yield=null，contribution0|
|developing 市场|真实 facility ID|type31、constructionWord0；不得有 adjacentMint|unfinished，effectiveType/yield=null，contribution0|
|complete Lv1 市场|真实 facility ID|type31、constructionWord1、adjacentMint=false|yield、effectiveType31、moneyYieldWord100、contribution100|

全部 result.index 必须等于槽序 0..29，mintApplied 始终 false。初有市场与新完成市场一视同仁，不能只复用 genesis 的初始设施，也不能把施工中的市场按未来收益提前计入。

输入仍完整保留六个 resolved type rows：31→100、50→120、51→150、46→300、47→200、48→80，valid 均为 true。虽然本 root 只产生 type31，不能把共享核输入缩成只剩一行。normal 固定 difficultyWord1，difficultyPercent100，不带 super 才需要的 cityPlayerPredicate。

### 5.2 固定治安和全部整数中间量

securityBeforeIncome 取 candidate.ledger 的固定真实 security，没有伪造太守字段；本 root 无季节治安下降。设 B=baseMoneyWord，C=当前完整市场数量（0..2），s=security：

- rawMoney=B+100C，0..65,735
- scaledRaw=rawMoney×100，difficultyProduct=null
- difficultyAdjusted=scaledRaw，0..6,573,500
- effectiveSecurity=max(50,s)，50..100
- securityProduct=difficultyAdjusted×effectiveSecurity，最高 657,350,000，小于 signed32 上界
- securityAdjusted=floor(securityProduct/100)
- returnedIncome M=floor(securityAdjusted/100)，0..65,735

这些等式用于说明并核对原核完整返回；真实 phase 调用 `calculateCityMoneyIncomeProjection`，不能以手算 M 替代调用、30 槽结果或证据。金核完整 input、result、intermediates 和 19-key evidence 均记录。

11 日和 21 日无税收技能，所以 moneyKernel 为 not-due/nonmonthly-without-taxation，不调用金核，无金 write，仍保留全员工资项目。创建当天即使是 1 日也不补发收入和工资。

### 5.3 恰在月初完成：同月计入的明确政策

“completion 先于 monthly money” 是 `root-completion-income-payroll-v1` 的 provisional 选择，不声称恢复了原生 scheduler。恰在 4 月 1 日完成的市场会参加 4 月收入；4 月 11 日才完成则从 5 月 1 日开始贡献。

单人 P100 的静态比较：3 月 1 日开工，三次推进为 3 月11、3 月21、4 月1，最后一次 work500 并计入 4 月；若 3 月11 日开工，4 月1 日仅 work425，4 月11 日完成，新市场不贡献 4 月金。差一旬的区别必须真实保留。

## 6. 先截收入，再扣完整工资

唯一可变金余额是 `current.ledger.gold`；真实 goldCapacity 只读固定，不是 finance wallet。设月结开始金 G、cap K、钱核请求 M、完整月薪 W：

1. 收入 accepted A=min(M,K−G)，实际增量 A，G1=G+A，discarded=M−A
2. 工资 after=G1−W，requested=accepted=paid=W，actualDelta=−W，discarded=0

收入立即写同一 candidate.ledger，然后工资 phase 读取同一个对象。即使 M=0 或仓库已满，月初仍有完整收入 write，随后一笔完整工资 write。不能先把 M−W 算净额，再一次 clip；两种操作有不同结果。

例如静态 G=K=1000、M=100、W=10：收入 actual0/discarded100，金仍1000，随后工资−10，最后990。若把净额90直接 clip 到1000，会错误地免去工资。收入后的工资能力检查使用真实 G1，不能使用未入账 M 或未截仓前的预测值。

每月恰两条 write，顺序 money-base→salary，全部 before/requested/accepted/actualDelta/after/cap/discarded/writerPolicyId 都保存。salary 还保留每人目录名、目录薪额、总额、availableBeforeSalary、paid、shortfall0 和 payerPolicyId；payrollOfficerIds 与 items 顺序相同，payerCityId 为真实固定本城。

工资不分期、不部分支付，不创建每人的现金钱包，不建欠薪或忠诚/人口惩罚。共享工资 phase 若报告 unsupported-salary-shortfall，完整 required/available/shortfall proposal 必须返回，并回滚整个推进。在合法本 root 可达域，下一节保留金证明保证工资不会正常短缺；实现异常仍必须失败，不能伪装 paid。

全历史的金链为：

`Gfinal = Ginitial − 200×acceptedStartCount + Σincome.actualDelta − Σsalary.accepted`

每条 Start.fees.gold.before/after 接上一链端；非月 tick 无金 write；月 tick 的 income.before 接上一 G，salary.before=income.after，receipt.reserveAfter.gold 与最终 current 一致。每条 receipt 的 before/after Current digest 只辅助，仍全字段重算；保留金不出现在上式中，因为它不是支出。

## 7. 剩余窗口全薪保留金

### 7.1 R=H×W，只派生约束，不提前扣钱

保留政策为 `remaining-window-salary-reserve-v1`。每个当前状态取：

- n=advanceLimit−advancedCount，剩余推进数 0..12
- d=dayOffset，当前 day1/11/21 分别取 0/1/2
- H=floor((d+n)/3)，未来 n 次推进进入月初的次数，0..4
- W=完整固定工资清单的月薪和，10..480
- R=H×W，0..1920
- spendableGold=G−R，合法状态必须非负

当前已经是 1 日不把当月再算一次；只数未来边界。R 不占仓、不提前扣薪、不产生另外的钱包，也不能借未来税收或预计新市场收入。实际工资仍只在未来每个 1 日扣一次，Reserve 只是当前状态的派生说明。

创建要求 G≥R；不要求 G≥200+R，因此可以先开一个金不够建市场、但足够付完整窗口工资的 episode，再等待已实际入账的收入。新开工则要求 G≥200 且 G−200≥R。AP20 与普通200金门先于 reserve 门，proposal.available 因此不会为负。

### 7.2 日期边界的完整含义

|当前日期与剩余推进 n|未来月初数 H|含义|
|---|---:|---|
|任何 day，n=0|0|窗口已结束，R=0|
|day1，n=1|0|只到11日，不计当前月|
|day1，n=2|0|只到21日|
|day1，n=3|1|第三次才进入下月1日|
|day11，n=1|0|只到21日|
|day11，n=2|1|第二次进入下月1日|
|day21，n=1|1|下一次就是下月1日|
|任一 day，n=12|4|固定四个未来月初|

跨年沿相同三旬周期。例如 200 年12月21日、n1，H1，推进到201年1月1日结算一次；9999年12月21日、n1 由于终点越界在创建时拒绝，不等到 active 工程末尾卡住。turn 也在创建时检查初值+limit≤MAX_SAFE_INTEGER。

月初到11日的非月推进，d+n 不变，所以 H 不变；21日进入下月1日时，d+n 减3，H 恰减1。不能因只看当前月份的数字变化而把已付或未付的工资数错。

### 7.3 为什么可以保证已接受工程的月薪

归纳只需非负收入，不假设未来一定有税：

- 初始 G≥HW
- 接受开工后 G'=G−200≥HW
- 非月 tick 的 G 与 H 都不变
- 月 tick 的收入 A≥0，哪怕满仓 A=0；发薪后 G'=G+A−W≥HW−W=(H−1)W

因此每个合法可达前缀仍有 G≥R，工资不足不会因为工程已经开工而正常发生。这个推导没有将市场未来收益当担保，也没有改变工资时点。其他金支出在本 root 不存在，唯一 Start 的门已经计入。

### 7.4 代价：会拒绝某些靠未来收入本可支付的方案

这是故意保守的流动性限制。例如当前剩四个月工资 W10，R40，金230。即使下月预计有100收入，开工后只剩30<R40，仍拒绝；gold−200=30，proposal 为 required40/available30/shortfall10。拒绝没有扣费用，没有锁人或占地。

如果之后先推进使收入真实入账，可以重新用新状态判断。不能提前将预计100加进可花金，也不提供贷款、延期工资或欠薪补救。若需要这种策略，必须另外定义允许未来收入承担风险的规则，不能把本 profile 的拒绝描述为原游戏一定拒绝。

## 8. 完成尾、历史与原子失败

开工既检查到期日期不超过 episode 窗口，也检查开工提交后 `13−revision >= durationTurns`。任一 active 前缀继续 D=remainingTurns 次合法新 ID 的推进：

1. 日期和 turn 已在整窗中，推进门不会在到期前越界
2. AP、TP、XP、merit 都只做饱和正 credit，无新的资源负担
3. 固定名单、设施与双向锁不被取消、拆除或第二 job 破坏；敌情、busy、acted 不阻挡推进
4. work=min(500,125+elapsed×rate)，前一旬<500，到期恰500，日期/turn/remaining 一致
5. 全窗工资由 R 的归纳保证，不靠新增市场收入
6. 每推进消耗一个 history 槽、D 同时减一，尾槽不变量保持；最多一次 Start 加12 Advance 仍≤13
7. 完整 completed job、月初同旬 completion、全部核证据与薪资、保存和最旧重复 receipt 从一开始都纳入静态预算

这保证的是该闭合规则下合法状态的静态可完成性。恶意输入、实现错误、缺失安全运行能力或不遵守接口的 phase 仍 fail-closed；不能把这些异常当作正常欠薪机制。

所有入口都安全复制输入，不修改或冻结调用者对象。preview 运行同一规则但不提交；execute 成功才返回新 state。任何 late failure 都不提交候选状态，原 state 可继续使用。failure 只含有限 stage/reason、已知实体 ID、需要时的有限 proposal/kernelReason/index，不携任意 stack/message 或内部对象。

## 9. 同 ID、完整重算、保存与 trace

同 ID 去重先于 stale revision、history、horizon 和业务门：同一完整 canonical envelope 再次出现，返回原 receipt 及最新 state/current，committed=false、duplicate=true，不再推进时钟、结算工资或发奖励；同 ID 任一内容不同，包括 expectedRevision 不同，就是 command-id-conflict。失败 ID 不登记。expectedRevision 允许完整安全整数域，真正 state revision 仍为0..13。

每次 inspect、preview、execute、save、load 都从完整 genesis 和 acceptedCommands 顺序重算。policy、全部建设目录、80官职/10title、七来源、每笔 receipt、完整 current 与审计都逐字段比较；不能只比较 digest、最终金余额或最后 receipt。篡改 rate/input/evidence/槽位/fees/成长/reservation/gold/history 任一字段都会破坏完整重算。

save 带完整 State 一次，包含旧 receipt、永久 completed job 和全部核证据；load 只认本 profile 的 exact tag，不接受旧服务 save 自动迁移或重置 genesis。JSON 重复 decoded key（包括转义碰撞）、负零、非安全整数、getter/proxy、环、稀疏数组、未知字段或预算越界均拒绝。

trace 最多32个 attempts，成功、失败和 duplicate 都有完整 outcome；失败和 duplicate 不占 accepted history。每个非 null expected 必须全文相等，expectedFinalState 也比较整个 State，不能只比 finalCurrent。expected 是比较值，不指导计算。32次全重试一个旧最大月初 receipt 仍须完整保留32份 outcome；未通过整体预算或比较时返回 state=null，不能截断结果。

## 10. 静态容量：完整审计不会在完工时突然装不下

每个公共包分别限制8,388,608 canonical UTF-8 bytes、250,000 occurrence nodes、depth48、array4096、object128 keys。重复引用每出现一次重新计，不按 alias 去重；UTF-8 和 JSON 转义真实计字节，不使用 JavaScript 字符串长度替代。保存返回的 serialized 字符串二次转义另计。

完整逐字段推导见[工程接口静态预算](../engine/bounded-market-income-payroll.md#11-完整静态预算与完成尾证明)。以下是保守手工上界，不是运行测量：

|包|节点上界|UTF-8 bytes上界|depth上界|
|---|---:|---:|---:|
|Scenario|1600|224000|8|
|Current|340|47600|10|
|任意完整 Receipt|730|102200|10|
|State|11700|1638000|14|
|Create/Load成功|11702|1638280|15|
|Inspect成功|354|49560|12|
|Raw SaveEnvelope|11702|1638280|15|
|二次转义 SaveResult|3|3276587|1|
|Execute，含任意旧 receipt duplicate|12434|1740760|15|
|Preview，含任意旧 receipt duplicate|1075|150500|13|
|ReplayResult 全32 outcomes|35159|4922260|15|
|Trace 全32 expected及完整expectedFinalState|37175|5204500|15|

预算把最多13条历史都按最大完整月初完成收据宽估，已覆盖 current.completed job 和 tick.completion 两份、每月30槽输入/结果、所有工资项及 sourceBoundary。最旧最大月初 receipt 与最新最大 State 配对的 duplicate 也另外计入，不能用最后一次较小 not-due receipt 代替。Trace 输入和 ReplayResult 输出各是一包，不假装二者是一个未承诺的 `{trace,result}`。

最大实际合法数组是80官职，不是只有32 trace；实际最大对象为23键 Scenario，保守宽放32仍<128。新增第二job、可变名单、额外支出、收入技能、难度、无限窗口、自由长文本、receipt嵌完整State或新的汇总数组都改变前提，必须重定版本和证明，不能以删审计、缩完整工资清单或降低旧服务512/128域补预算。

## 11. 一条贯穿建设、月金和工资的纸面例子

设200年1月1日、limit12、初金50/cap1000、security100、base100、初无市场，无敌军；单人 politics100、office79（武衛校尉，月薪10），AP足够。初 H4/W10/R40，金50足以创建，但此时不能开工200。

|静态时点|工作与结算|金链|结算后保留金|
|---|---|---|---:|
|创建1月1日|不补发当月收入/工资|50|40|
|2月1日|无市场，收入100，工资10|50→150→140|30|
|3月1日|无市场，收入100，工资10|140→240→230|20|
|3月1日随后开工|费用200，AP20，work125|230→30|20|
|3月11日|work275，非月无金写|30|20|
|3月21日|work425，非月无金写|30|20|
|4月1日|先work500及奖励；新市场使收入200，再工资10|30→230→220|10|
|5月1日窗口终点|完整市场收入200，再工资10|220→420→410|0|

该例消耗12次 Advance 和一次 Start，共13 accepted；建成只奖励一次，工资覆盖完整名单四个月，reserve 从未提前扣薪。它说明新市场入账和旧市场相同，但不构成已运行或已验证的 receipt。示例输入文件也是静态材料。

## 12. 来源、证据 false 和明确不支持项

固定政策为 `bounded-market-income-payroll-v1`，construction 来源为 `facility-construction-policies-v1` 和 `standard-nine-facilities-community-v1`，工资目录为 `named-offices-v1`，金核设施目录为 `documented-income-facility-table-v1`，finance 写入政策来源为 `city-finance-policies-v1`。完整值而非仅版本名参与重算。实际 money/payroll 兼容依赖在 [PR100](https://github.com/DanielMax937/sanguozhi/pull/100) 交付，commit `51276c329075c936e32de2ee9dadb3b9f0f47e64`，tree `9419afce86dd23fc6e5655ba63637cd7eb606404`。

金核和建设速率的原始 listing 来源为 sjn4048/311MemoryResearch commit `66e167e40c3440929ec016f3872aefc3486434c1`，按 Apache-2.0 来源记录保留归属及[许可证](../sources/production-price-LICENSE.txt)。金核范围 `0049E590 <= PC < 0049E745`；速率范围 `005BB1D0..005BB2AA`，星号 MOD 分支排除。金核 source SHA256 `cf7ff7276747b793d293e20ec53681e36a3b5232e16ce93677f595a0b33a65fd`；速率 source SHA256 `2a9839d373396ead062c277a8767a79c18d0d61de848236acd522cd108722bd8`。

普通官职表是既有[社区官职表](https://w.atwiki.jp/sangokushi11/pages/111.html)的固定规则转录，catalog SHA256 `949e956340414969224406315ce93d141e97379ca8a5403923bb9714bb8aa7c1`，对应 ranks source SHA256 `9b8c836e1d0b0c13dddf37d78393c323dfc86ffe98b897be1e79dfe823da4752`。市场目录 SHA256 `366fb875751367758606fb3fffb291682231a10606a8773bffa040ccd9fa4f43` 的 evidence 是 `community-tables-and-existing-rule-transcription-not-stock-data`；D500/cost200/TP30/yield100 不是本次从 stock 原表取证。

原 money evidence 仍逐次完整保留：fullCallerBytesVerified 和 stableResolvedInputsRequired 两项 true 延续已有源记录；以下全部 false，不能因为 simulation 已调用和记账而翻转：

- entryGatesIntegrated、stockOriginalVerified、originalExecutableExecuted、nativeHelpersReconstructed
- abiVerified、realTraceReachabilityVerified、typeTableStockVerified、adjacencyHelperRecovered、rngRecovered
- monthlySchedulerIntegrated、incomeWriterIntegrated、commandIntegrated、modBehaviorIncluded

新的 SourceBoundary 保持 nativeExecution、stockVerified、nativeFullFinance、nativePayrollConsequences、nativeScheduler、nativeHp 全 false。ownership、scheduling、writers、reserve 为 provisional-engine-rule；初work125、AP恢复、成长、完成先于月金、固定完整名单和全窗保留金均为可替换的 engine 政策。原 rate evidence 的全部地址范围和 excludedMod 也保留，不宣称恢复 native getter、指针、ABI或星号 MOD。

完整来源文件保留原 money/rate source 的正文、许可、原始路径和未证事实；完整 SourceBindings、依赖 blob/SHA、金核与速率源地址及原始字节身份见[工程来源节](../engine/bounded-market-income-payroll.md#10-固定来源实际兼容依赖与证据边界)。这里的固定原字节身份不是原生执行、ABI或存档真实性证明。

本 profile 不支持：粮收入、季节安全度变化、灾害、wealthy/rice-way/taxation/levy 等收入技能、兵装月产、普通生产、商人、巡察、其它建设类型、吸收、升级、取消、拆除、HP/维修/伤害、ownership变化、贷款、未来收入借款、欠薪后果、君主/俘虏/未知office80或名单变动。未建模不等于这些项目在原游戏中等于0。P078及其依赖排除，原43主题/45快照及E/X证据债不因本 simulation 接合而减少。
