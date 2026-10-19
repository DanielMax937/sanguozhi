# 标准内政设施建设与吸收合并：独立有限服务

首次规则记录：2026-10-17；私有阶段边界补记：2026-10-19。`standalone-facility-construction-v1` 在供应的单城开发地上执行9类新建和5类吸收：扣费、占地/腾地、锁定人员、逐旬施工、完工奖励、有效等级及金粮数值投影、保存和重放。它是实际独立状态转换，不只是建设速度的另一层包装。

本页给出可执行服务的完整规则。官方命令说明、社区数据、已交付公开速率listing与新增工程政策分开标注；原生初始/进度writer、真实调度、原游戏存档、战斗HP及维修均未因此恢复。本模块不覆盖维修；[独立维修服务](domestic-repair-lifecycle.md)另提供已完成标准内政设施的独立正HP维修账本，不自动连接本模块work。维修其余边界、PK特殊建筑和组合运行时仍开放，原43组未决证据主题不减。

最初实现及本次私有阶段拆分均只有静态代码、文档和人工设计场景；未运行测试、typecheck、编译、build、checker、诊断、产品入口或示例，未修改旧测试。历史通过数不验证本树，既有全套food失败未处理。API见[接口文档](../engine/facility-construction-lifecycle.md)，私有分工见[阶段边界](../engine/facility-construction-phases.md)，数据见[设施表](../../data/catalogs/facility-construction-catalog-v1.json)、[全部政策](../../data/catalogs/facility-construction-policies-v1.json)、[来源](../sources/facility-construction-lifecycle.json)和[结构schema](../sources/facility-construction-lifecycle.schema.json)。

私有拆分仅复用工作量计算、精确写账算术、单任务推进和完工写入；公共命令、存档、政策和九类新建/五类吸收范围不变。资格、敌情、日历、AP、全部任务调度、历史重建和提交仍由原服务负责。这不新增建设接入普通生产的功能，也不提高原生证据等级。

## 1. 场景、账户与支持范围

初态必须完整提供以下原始事实，不接受外部算好的施工进度、工期、最终费用或完成结果：

- `schemaVersion=1`、上述profile、`date={year,month,day}`、`turn`、`advanceLimit`、`activeForceId`
- 固定 `force={id,techniquePoints}`；`corps={id,forceId,actionPoints}`；`city={id,kind:"city",ownerForceId,position,gold,goldCapacity}`。force、corps和city归属必须一致，港关不支持
- `economy={baseMoneyWord,baseFoodWord,securityByte,difficulty,controller}`：基础金粮U16，治安U8；难度仅normal/super，控制方player/ai。这是只读经济投影的原始环境，不是收入或实际入账
- 最多128武将，各有id、forceId、cityId、available、政治0..255、politicsXp、merit及`actedTurn`。初态无任何本模块任务；政治是已解析稳定byte，不由人物ID自行查询。XP只积累，不改变政治
- 最多30个 `lots={id,cityId,position}`。每个地块属本城，ID、轴坐标均唯一，不能与城市中心重合。这里明确供应开发用地，不把任意地图空格视作合法地块
- 初始设施仅完整的 `{id,lotId,kind,level}`，ID和占用地块唯一，等级由下表允许；typeId、有效等级和状态由服务推导。初始进行中设施/外部生产锁不支持，不能从此接口导入另一服务尚未完成的任务
- `hostileForceIds` 显式列敌方（最多128、不含己方），`completeFieldUnits=true`，当前完整fieldUnits和恰好advanceLimit个 `{fieldUnits}` 未来旬输入。每旬最多128单位，单位id唯一；异势力并不自动视为敌军
- 完整catalog与policies快照。不能只交ID或digest。所有共同参数及四组选择都必须与注册内容完全一致

所有ID使用1..64字节ASCII模式 `[A-Za-z0-9][A-Za-z0-9_.:-]*`。坐标q/r均为−1,000,000..1,000,000整数。turn为非负安全整数。TP0..10000；AP0..255；金钱/容量/XP/功绩0..1,000,000,000，金钱不得超过本城容量。初态行动标记须null或不超过turn。

工程上限为360次推进、累计512个任务、872个接受命令、2616次trace尝试。每个数组最多4096项，单对象128键、深度48、输入4,000,000节点，canonical UTF-8结果最多67,108,864 bytes。它们不是原游戏容量。date年1..9999、月1..12、日仅1/11/21；创建时验证整个有限horizon日期与turn均可表示。未来输入缺项或有坏数据即创建拒绝，不等到走到该旬才忽略。

## 2. 九类建设表与五类升级表

数值沿用[经济规则§4](02-economy.md#4-无印内政设施)与日文社区设施表；typeId为既有PC-PK资料映射。不是本次取得的原始设施表字节。

|kind|设施|Lv1 typeId|建造金|文献耐久D|完工TP|每人政治XP|
|---|---|---:|---:|---:|---:|---:|
|market|市场|31|200|500|30|3|
|farm|农场|32|200|500|30|3|
|barracks|兵舍|33|300|800|30|3|
|forge|锻冶|34|300|800|30|3|
|stable|厩舍|35|300|800|30|3|
|workshop|工房|36|300|800|30|3|
|shipyard|造船厂|37|300|800|30|3|
|mint|造币厂|38|400|1000|50|4|
|granary|谷仓|39|400|1000|50|4|

每次新建另外扣20AP。固定建Lv1，不能直接购买Lv2/Lv3；允许标准设施多座，不套用PK特殊楼的一城唯一限制。

|系列|Lv1/Lv2/Lv3 typeId|Lv1/Lv2/Lv3文献耐久|
|---|---|---|
|市场|31/50/51|500/600/700|
|农场|32/52/53|500/600/700|
|兵舍|33/54/55|800/900/1000|
|锻冶|34/56/57|800/900/1000|
|厩舍|35/58/59|800/900/1000|

工房、造船厂、造币厂、谷仓只有Lv1。高等级耐久直接见社区表，作为`documentedMaxDurability`展示；吸收计时不使用该耐久。目录的`maxDurability`是文献类型值，不是某设施当前战斗HP。升级开始/完成的HP迁移规则仍未知，本模块根本没有currentHP字段、伤害或修复writer。

## 3. 建设开始：资格、费用、人员与地块

命令为 `StartDevelopment(cityId,lotId,facilityId,facilityKind,officerIds)`。只能选择1..3名不同武将；每人须同城同势力、available、当旬未行动且未被本模块任何任务预留。官方说明支持最多3人和建设期间不可另行执行命令；本服务使用自己的reservationJobId表达忙碌，绝不恢复原生人物任务链。

地块须属于本城并空闲；新facilityId在整个场景历史中从未用过。被吸收donor的ID也不能复用，但其原格可由别的新ID设施重建。己方城市周围两格敌军门槛在开始时计算：

`distance=max(abs(unit.q-city.q),abs(unit.r-city.r),abs((unit.q-city.q)+(unit.r-city.r)))`

若显式敌方单位distance≤2，拒绝并返回blockingUnitId。中心是城市，不是建设设施；邻近设施却距城3格的敌军不触发此门槛。所有单位的距离、hostile和blocks都入开始回执。持续压力是否应暂停施工未取得原证据，本profile明确采取`facility-start-only-pressure-gate-v1`：只阻止开始，既有任务继续。

AP与金必须足额。任一资格、容量、有限horizon或输出预算失败，整个命令拒绝，不扣费、不占地、不锁人、不改变revision。成功才一次扣20AP及表中金钱；设施占地，level=1/typeId按表，status=developing、effectiveLevel=0；所有人员标记本旬已行动并绑定job。多项任务可以并行，只要人员和设施资源不冲突。

两类Start在状态重建、命令解析和新ID检查之后，共用以下首错顺序：

1. 城市ID不符 `city-mismatch`，归属/军团不符 `owner-corps-mismatch`，累计任务满 `job-history-limit`
2. 按供应的fieldUnits原序计算全部单位检查，再取首个blocks；`hostile-within-two`携该单位的blockingUnitId
3. 按所选人员ID原序逐人检查：`officer-not-found` → `officer-city-force-mismatch` → `officer-unavailable` → `officer-busy` → `officer-already-acted`；每人检查完才到下一人
4. 读取AP成本及金成本，新建的金成本来自设施目录；然后 `insufficient-action-points` → `insufficient-gold`

新建继续按 `unknown-lot` → `occupied-lot` → `facility-id-reused` → Lv1目录读取 → 初始工作量/速率 → `unsupported-construction-rate` → `nonpositive-construction-rate` → `invalid-duration` → `completion-outside-horizon` → dueDate日历推导的顺序处理。全部通过后组装任务与设施，再按AP扣费、金扣费、所选人员预留/行动标记、任务及开始回执的顺序写入候选状态。不会先查地块再查余额，也不会先锁人再推导工期。

## 4. 精确速率与独立工程工作量

实际调用既有 `calculateDomesticConstructionRate`，不另造近似公式。开始时冻结1..3人的政治和Lv1文献D，完整数值回执进入job.work.rate：

`rate=max(maxPolitics+floor(sumPolitics/2),floor((D-floor(D/4))/9))`

来源是固定公开非星号listing `005BB1D0..005BB2AA`；政治稳定U8、设施D稳定U16。详细地址、byte边界、被排除MOD和getter条件见[速率专项](domestic-construction-rate.md)。其纯数值核可接0人，不代表建设命令可选0人；此命令严格1..3人。政治0合法，九类设施的耐久下界仍能提供正速率。

工作量计算只调用该数值核一次。job.politics保留所选1..3人的原序政治数组，rate.politics则是核补齐null的三个有序槽，两者分别保留。job.work.rate包含完整supported/profile、politics、facilityDurability、politicsSum、maxPolitics、halfPoliticsSum、politicsRate、durabilityQuarter、durabilityRemainder、durabilityMinimum、rate、selectedBranch和evidence；不能只保存最终rate或删去证据。核的完整冻结回执在组装Work时按原路径克隆，dueDate仍由服务在速率成功之后推导。

默认工作量政策 `facility-work-quarter-floor-v1`：

- required=D，initial=current=floor(D/4)
- 起始不推进；下一次Advance才第一次增加rate
- 每旬current=min(required,current+rate)
- durationTurns=ceil((required−initial)/rate)，到达阈值的同一旬完成

可替代 `facility-work-zero-v1`：initial=0，其他运算一致，确实改变工期。二者都只是工程工作量政策，不是初始战斗耐久writer恢复。原速率函数里的D>>2只证明下界算术，不证明实例被写quarter。D450时floor=112与旧half-up113的差异保留为证据边界；本表没有D450特殊楼，因此不为这个反例私自扩展设施域。

没有另加“强制10旬完工”。例如单人政治100建市场：rate150，默认125→275→425→500，3次边界完成；zero政策需4次。政治0建市场默认速率41，需要ceil(375/41)=10次；zero需ceil(500/41)=13次。都是具名政策的算术结果，不是原EXE日数认证。

开始前推导dueTurn/dueDate，并要求当前advancedCount+durationTurns≤advanceLimit；剩余horizon不足就原子拒绝，不能留下永远无法完成的任务。施工速率不因在途奖励改变，XP账本也不自动提升政治。

## 5. 吸收：合法组合、腾地与旧级效果

命令为 `StartAbsorption(cityId,receiverId,donorId,officerId)`。本profile恰好选1人；这是明确服务合同，不把未确认的全部版本UI人数升级为源事实。人员、归属、当旬行动和城心敌情条件同建设。

两设施须不同、完整且无施工job，同类且属于市场/农场/兵舍/锻冶/厩舍；六角距离必须恰为1。donor必须Lv1；receiver必须Lv1或Lv2。因此只有Lv1+Lv1→Lv2、Lv2+Lv1→Lv3合法。Lv1吸Lv2、Lv2吸Lv2、Lv3再吸、非邻接、跨种或在途设施都拒绝。

固定扣10AP+100金，不套军事府减半。开始即移除donor并释放其lot；完整donor快照保留在开始回执，历史ID不可再用。receiver立即改成目标等级和目标typeId，status=absorbing，effectiveLevel保留前一级；执行者预留至完工。

政治≥70用1旬，否则2旬，取开始政治；建设速率与高等级D均不参与吸收计时。这是攻略实测等级，005D758B完整原生函数仍未闭合。开始同样必须能在有限horizon内完成。

在两类Start共门之后，吸收的首错顺序是 `same-absorption-facility` → `facility-not-found` → `incompatible-absorption-kind` → `facility-busy` → `incompatible-absorption-level` → `facilities-not-adjacent` → 目标等级目录读取 → 政治阈值工期 → `invalid-duration` → `completion-outside-horizon` → dueDate推导。之后才克隆receiver/donor、移除donor和更新receiver；AP、金、人员和任务写入顺序同新建。吸收始终work=null，不借用建设工作量或速率回执。

有效等级由服务推导：新建未完=0；完整=目标level；吸收未完=目标level−1。donor已消失，不保留第二个生产槽或收入。receiver完成后解除当前job，可以在后续合法人员/旬条件下再吸收；旧任务历史仍保留。释放的donor地块可由另一空闲武将在同旬立刻新建。

## 6. 单旬推进与完工奖励

`AdvanceFacilityTurn`不接targetDate、进度、结算或最终快照。一次边界按1→11→21→下月1推进，12月21后为次年1月1；不是实际公历加10日。顺序固定为：

1. 依次检查 `advance-limit`、`turn-overflow`、`missing-turn-input`，取预置的下一旬完整敌情；日期、turn、advancedCount及fieldUnits只更新一次
2. 按所选AP政策恢复并封顶，只写一次AP恢复
3. 复制job数组后按ID的ASCII字典序处理，跳过已完成任务。每个未完任务先remainingTurns减1；若work非null，再将current更新到min(required,current+perAdvance)，记录remaining/work前后值
4. 当前任务remainingTurns为0时立即处理它的完成，完成后才进入下一个任务。完成先写TP，再逐人写奖励/释放/行动标记，最后才标记设施和任务完成；不是先推进全部任务再批量发奖

job数组保留开始次序；只有边界处理顺序按ID排序。一个Advance处理全部任务为一笔事务，任何失败不会保留前面已算出的部分更新。所有完成在同一边界独立记录requested/actual/discarded，TP累计超cap时依确定顺序分配可用空间。

每个完成依次检查：当前设施存在且仍绑定本job、status不是complete，否则 `facility-reservation-mismatch`；remainingTurns=0、当前turn=dueTurn且当前date与dueDate全量相同，否则 `completion-timing-mismatch`；非null work必须current=required，否则 `incomplete-work`。随后读取新建目录TP或吸收TP，再开始写账。推进和完成不另查敌情、available或当旬已行动；开始时的敌情不会暂停已接受的任务。

完工写序精确为：从当前候选force.techniquePoints计算TP Write并立即赋回；按job.officerIds原序，每人到达时才查当前人物及reservationJobId，缺人或锁不符报 `officer-reservation-mismatch`，不预查全部人。随后先算该人当前politicsXp的Write，再算当前merit的Write，再依次赋回XP、功绩、清reservationJobId、写actedTurn。所有人成功后才依次写facility.status=complete、effectiveLevel=targetLevel、jobId=null、job.completedTurn=当前turn。level/typeId已在开始时确定，完成不再改写。完整Completion保留jobId、facilityId、typeId、level、effectiveLevel、techniquePoints、rewards、releasedOfficerIds和policyId；releasedOfficerIds保持人员原序并使用新数组。

新建完成发目录TP30/50；吸收完成发TP10。默认人员奖励每个选中者全额获得：普通7类建设政治XP3、造币/谷仓XP4；吸收XP2；所有任务功绩100。功绩替代政策仅把造币厂新建改为每人150，谷仓仍100。两套政策均实际写入独立账本，均不自动涨政治。

XP数据由社区经验表直接支持；功绩存在冲突：Wiki表列市场100、造币150、吸收100，另一2011作者自述实测摘要称全部开发100。默认100是可替换选择，不是冲突已解决；其他设施功绩逐项原writer、多人如何分配及何时发放仍未证明。全部参与者在完成时获得全额是本服务政策，不宣称原生分配函数已恢复。

写入政策：扣费必须全额；TP封顶10000，XP和功绩封顶1e9，超出部分丢弃并记录，不能绕过cap。每笔回执均有before/requestedDelta/actualDelta/after/cap/discarded/policyId。AP默认每Advance+20到255，可替代+0；它不是原军团恢复公式。

精确算术是：delta<0且before<−delta时 `insufficient-balance`；否则actualDelta为负delta本身，非负delta则取min(delta,cap−before)；requestedDelta=delta，after=before+actualDelta，discarded=delta−actualDelta。没有部分扣费、额外低端clamp或把requestedDelta改成实际增量。开始回执初始化仍有AP/金的零delta Write，成功Start在原位置覆盖；Advance的AP恢复Write使用所选恢复政策ID。

同旬后一个job读取前一个job已经写回后的当前TP，人员奖励也从完工时当前XP/功绩读取，不从开始快照计算。纸面例：TP9990时ASCII先完成普通新建，请求30，实际10、丢弃20；后完成吸收请求10，实际0、丢弃10。交换处理顺序即使最终仍10000，两份回执也不同。XP999999999时请求3，实际1、丢弃2。每个参与者全额计奖，不除以人数；politicsBefore/politicsAfter都记录当前政治，政治本身不写，job.politics仍只用于开始时速率证据。这些例子是算术推导，并非执行结果。

默认完工人员`actedTurn=新turn`，该旬不能再次行动，下一旬可用。可替代政策在完成时设null，使完成同旬可再行动；两者在施工中都持续保留reservation，不能换旬提前解锁。完成任务不再二次推进或发奖励。

## 7. 已有金粮核的真实复用与生产视图

`projectFacilityEffects(state)`先完整重建state，再提供每个活动设施的target/effective level、phase、typeId、文献耐久、constructionLocked、jobId、remainingTurns/remainingWork。每座有效兵舍/锻冶/厩舍/工房/造船厂提供一个只读productionSlots条目；建设锁不等于吸收旧级效力消失。这些条目不导入另一服务，外部生产锁/名额使用仍未共享。

金钱与粮食投影分别实际调用现有`calculateCityMoneyIncomeProjection`和`calculateCityFoodIncomeProjection`，保留完整输入与回执：

- 按genesis lots顺序构成槽位，不足30补null
- 保留吸收目标typeId并传constructionWord=0，由旧核恰好降低一级，不能先手动降低后再传未完
- 新建未完Lv1的邻接布尔字段省略；未完市场/农场不产出
- 仅已完成造币厂/谷仓在六角距离1提供布尔邻接，多个不叠加，未完成支持设施不生效
- 市场表100/120/150，农场表1500/1800/2250；支持邻接对相应基础值floor(3×yield/2)。精确难度/治安顺序继续由已有核负责

例如两座无造币Lv1市场从贡献200，吸收在途变100，完工120；Lv2吸Lv1在途按120、完工150。邻完整造币的receiver对应150→180或180→225。被消耗donor不再进入任何槽。

投影不写实际金粮，也不推进财政时点；`incomePosted=false`、`externalProductionJobsIntegrated=false`。既有独立生产服务的genesis不会因此改动，不宣称跨服务调度已经完成。合法建设场景的经济投影仍可能被已有核拒绝：较高baseMoneyWord/securityByte的super-ai组合可能超出金钱核的signed32安全乘法域，统一返回`unsupported-effects-projection`，建设/吸收状态没有改变。不能把这看成已经收钱失败或承诺所有合法state投影必成功。

## 8. 完整注册政策与替换方式

共同参数完整见[政策目录](../../data/catalogs/facility-construction-policies-v1.json)。场景policies必须含common全部字段及下列四个选择对象；每组任选一个，合计16种组合均由运行时读取相应参数，禁止隐藏参数、未知ID或ID相同但参数不同。

|组|默认|可替代|实际区别|
|---|---|---|---|
|initialWork|facility-work-quarter-floor-v1|facility-work-zero-v1|floor(D/4)或0起始，工期随之重算|
|apRecovery|facility-ap20-cap255-v1|facility-ap0-cap255-v1|每边界+20或0，cap255|
|rewards|facility-community-rewards-v1|facility-mint150-rewards-v1|造币新建每人功绩100或150，其余相同|
|completionActors|facility-completion-actors-acted-v1|facility-completion-actors-available-v1|完成旬已行动或完成即可再行动|

其他共同政策也具名、完整保存：有限十日日历；标准9开发；同类邻接Lv1吸收；开始时敌情门槛；固定owner/供应地块；下一边界cap推进、ASCII任务顺序且无强制10旬；足额扣费/奖励封顶；旧级有效效果/无combatHP；有限JSON预算；全量canonical重建。共同参数不能在当前profile任意改写；新增注册版本才能换掉现有语义。

四个开关独立。下表A20/A0对应上述AP政策，Q/Z对应quarter-floor/zero，R100/R150对应默认/造币150奖励，Act/Avail对应完成时已行动/可用。表为全部支持组合的规则清单，不是16格执行结果：

|组合|AP|initialWork|rewards|completionActors|
|---:|---|---|---|---|
|1|A20|Q|R100|Act|
|2|A20|Q|R100|Avail|
|3|A20|Q|R150|Act|
|4|A20|Q|R150|Avail|
|5|A20|Z|R100|Act|
|6|A20|Z|R100|Avail|
|7|A20|Z|R150|Act|
|8|A20|Z|R150|Avail|
|9|A0|Q|R100|Act|
|10|A0|Q|R100|Avail|
|11|A0|Q|R150|Act|
|12|A0|Q|R150|Avail|
|13|A0|Z|R100|Act|
|14|A0|Z|R100|Avail|
|15|A0|Z|R150|Act|
|16|A0|Z|R150|Avail|

Q/Z只改变新建initial及派生duration/work；A20/A0只改变服务的AP恢复；R150只改变mint新建功绩，不改变granary或吸收；Avail在完成时明确写actedTurn=null，不保留旧标记。所有组合都保留9类新建、5类吸收、1..3人新建、1人吸收、最多512个历史job及30个供应地块。完整共同参数和每组选中对象仍逐字段比对注册内容，不能只验政策ID。

## 9. 原子失败、重复ID、保存与重放

成功命令revision+1，完整envelope与receipt追加一次。相同命令ID和完整envelope完全相同，返回原receipt、duplicate=true/committed=false，即使当前revision/horizon变化；改expectedRevision也算ID冲突。新ID必须expectedRevision等于当前值。失败不进入acceptedCommands。

公共命令入口先完整分离并重建state，再分离/解析新envelope。append先查已接受ID：完整envelope不同时 `command-id-conflict`；相同时立即返回重建出的旧receipt。只有新ID才检查expectedRevision、接受命令容量并执行。因此完全重复在当前余额、horizon或容量检查之前返回，不二次计费、推进、奖励或追加历史；不能先信任输入snapshot或先解析新命令来改变首错。

公共API先进行有界数据分离，拒绝普通对象的accessor、函数、symbol、循环、稀疏数组、非有限数、负零、未知字段或越界。仅普通JSON数据是支持域；Proxy/自定义prototype不在合同内，不保证可移植地识别全部Proxy或避免它们的trap副作用。输出递归冻结，caller对象不被本模块修改。

保存包含完整genesis scenario与初态snapshot、完整policies/catalog与canonical SHA-256摘要、全部接受命令/回执及当前snapshot。加载不是相信snapshot，也不是只验digest：从genesis重新推导初态，重做每个命令，比较每一个receipt字段，最终比较整个snapshot。伪造work、日期、奖励、释放人员、donor、有效等级、政策或目录都会不一致。

重建顺序为根shape/schema、genesis shape、完整scenario/initialState及初始结果预算、policies及digest、catalog及digest、genesis.snapshot；随后逐条检查accepted entry/envelope并append，拒绝duplicate-accepted-entry，预算该步完整execute包装，再比较完整receipt；最后比较完整snapshot并预算state。旧接受步骤错误保留其index。私有计算壳、服务函数或回调不进入save/trace，加载仍重走实际计算，不能从存档信任预先算好的计划。

所有修改都发生在resolve克隆出的同一个候选after中：若后续人物、后续job或最终输出预算拒绝，已算出的TP/奖励/进度都随候选丢弃。resolve成功才更新revision与receipt日期/turn，再由append构造新state并进行预算/冻结。新建receipt设施与snapshot设施分开克隆；snapshot job和start.job也分别克隆；吸收的receiverBefore/removedDonor各自克隆，receiverAfter与snapshot替换对象分离。成功结果的receipt与其acceptedCommands最后项共享同一个结果对象，随后递归冻结；跨公共调用会先重新分离与重建，不承诺保持对象身份。

preview与execute使用同一reconstruct/resolve和完整execute结果预算，preview不提交；load、save、replay重建每个接受步骤时，也使用当时execute的同一完整输出预算。trace可保存成功、重复或失败尝试，expectedOutcome只做断言，不供应结果；expectedFinalSnapshot可null或完整比对。结构schema只表示数据形状，跨字段关系、完整kernel回执、总预算和全历史重算由运行时执行，schema本身未运行。

关键失败包括不支持的profile/policy/catalog、非法地块/类型/等级、同ID或重复人、忙人/当旬已行动、敌军两格、AP/金不足、非邻接吸收、设施忙、ID复用、超出完成horizon、历史容量、revision冲突、回执/最终snapshot不一致和输出预算。所有不支持Cancel/Demolish/Damage/Repair/Capture/Transfer等命令一律拒绝，不退款、不释放、不改owner。

## 10. 人工场景与尚未运行的检查项

[静态示例](../../data/scenarios/facility-construction-example-v1.json)含scenario、5条命令和人工预期。默认政策下一名100政治武将建市场，另一名70政治者吸收相邻两市场；两次开始后金700/AP70；3个推进后gold700/AP130/TP40，新建完成，吸收已完成。XP分别3和2、功绩各100。相邻完整造币让最终rawMoney为330。这些是纸面推导，不是执行日志。

未来验证应覆盖九类建设和五类升级、69/70吸收边界、0/255政治、所有16政策组合、多人预留、完成同旬资格、被释放地块同旬重建、receiver二次吸收、旧donor ID复用拒绝；城心敌距2/3和在途敌情；金/AP恰足与不足；末旬能/不能完工；同旬多job奖励cap；年末日历；active job保存后恢复；重复ID/冲突/新ID旧revision；篡改完整receipt/policy/目录/进度；带溢出风险的只读经济投影拒绝。均未在本批执行。

## 11. 来源层级与明确剩余

- 官方手册/官方PK网页支持开发与吸收的命令约束。本次手册只取得搜索可见文本，47MB PDF未全文下载，未看页图、未取得原文件hash；不得写作逐页核验
- 固定公开速率listing及已交付金粮核只覆盖各自局部返回值；原始字节身份和稳定输入假设见各专项。它们不认证当前服务writer或clean-stock
- 社区表提供Lv2/3耐久、XP与功绩观察；功绩冲突完整保留。政治70/69时间、TP10保留empirical等级
- 新服务工作量、首次推进、计时/人员marker、奖励分配/时点/cap、AP恢复、轴坐标供应环境、history/replay是具名工程规则

未支持10类PK特殊楼与地理/铜雀/唯一/黑市撤除条件；不处理战斗HP、升级HP迁移、修复、破坏、废弃、取消、退款、城市易主、部队移动、全局RNG、原生存档或EndTurn。原生capture/ownership/return/mission/cancellation/finalizer链排除。本页的完成范围只能称“独立标准设施建设与吸收任务账本”；不能称完整设施生命周期或原作等价。

私有阶段拆分没有取得新的原始getter、stock字节、平台/版本等价或原生scheduler/writer证据。TP完整来源、XP到属性增长及造币功绩100/150冲突仍未闭合；工作量初值、逐旬cap、首次下一边界、完成时点/写序、AP恢复、逐人全额奖励及acted/null仍是上述具名工程政策。
