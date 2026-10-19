# 有界锻冶建设、普通生产与动态月特产 v1

`bounded-forge-monthly-production-v1` 把一座城市的 Lv1 锻冶建设、普通兵装生产和月初特产放在同一个时钟、同一本资源账中。新建锻冶从真实 developing 状态推进到 complete；月初按当时设施及固定太守读取月产数量，写回普通 `Produce` 随后继续使用的真实库存。

本页直接规定游戏行为。接口、完整审计、保存重建及逐包预算见[工程说明](../engine/bounded-forge-monthly-production.md)；完整常量见[政策](../../data/policies/bounded-forge-monthly-production-v1.json)，输入结构见[schema](../../data/schemas/bounded-forge-monthly-production-v1.schema.json)，固定来源见[来源清单](../../data/sources/bounded-forge-monthly-production-v1.json)。[静态场景](../../data/scenarios/bounded-forge-monthly-production-example-v1.json)只提供初态，不是已经运行过的记录。

以下连接顺序、固定事实映射、库存 writer、AP 和成长分配均有具名 simulation policy。特别是“同一月初先完成施工，再计算月特产”是 provisional（暂定且可替换）政策，不是已恢复的原生完整月调用者。本文依据静态源码、类型、来源记录及纸面推导；未运行测试、build、编译、typecheck、runtime、示例、validator 或产品输出测量，不构成运行通过或原生等价认证。

## 1. 一个有限且完整供应事实的城市

初态恰有一座 `kind=city` 的城市、一个所属势力和同势力军团。`activeForceId`、势力 ID、军团 forceId、城市 ownerForceId 相同。归属及以下外部事实在整个 episode 固定，没有途中编辑入口：

- 初始城市金钱 0..1,000,000,000，上限固定 1,000,000,000；军团 AP 0..255；势力 TP 0..10,000
- 1..8 名同城同势力人物，各有 available、稳定领导/魅力/智力/政治 0..255、唯一技能列表（只能含 79/80/81），以及领导/魅力/智力/政治/武力五项 XP、merit、actedTurn。XP/merit 为 0..1,000,000,000
- 0 或 1 座已有完整 Lv1 锻冶，每座提供真实 initialUsedTurn；开发地数量恰比已有设施多 1。因此初态恰有一个空地，最多两块地，最终最多两座锻冶
- 每块 lot 的 ID 和坐标唯一，属于本城，不与城心同格；已有设施恰占其供应 lot。不得以外部 job、初始 developing 设施或既有预约作为初态
- 装备库存固定四槽 1/2/3/4，逐槽供应 quantity、capacity，满足 `0≤quantity≤capacity≤1,000,000`。当前库存只有 quantity 与恒为 0 的 reserved，capacity 从固定初态读取
- 四项 `basePriceWord` 0..65,535、normal/super 难度、player/ai 控制方、解锁数组与特产数组。两数组只能包含不重复的 1/2/3/4，不能从城市名、人物 ID 或常识猜值
- security 0..100、troops 0..troopCapacity≤1,000,000、morale 0..moraleCap、moraleCap 20..255、patrolUsedTurn 均须真实供应。本根不改变这些数值，也不把缺失值补成 0
- `completeFieldUnits=true`，完整野外单位最多 16 个，显式敌对势力最多 16 个；各单位提供 ID、forceId、坐标，敌对集合不能包含己方。异势力不自动当敌军
- 普通生产的 `pressureActive` 单独供应，和建设开工的城心敌情门相互独立。建设敌情不反写普通生产环境
- 完整生产目录、完整建设目录和完整政策正文。只给 ID、版本或摘要不足以定义场景；保留目录里的其他设施数据也不意味着本根支持建造它们

ID 为 1..64 ASCII 字符，首字符字母或数字，后续只允许字母、数字、下划线、点、冒号、连字符，末尾换行不合法。job ID 恰为 `job:` 加开工命令 ID，最长 68 字节，不截断。q/r 为 −1,000,000..1,000,000 整数。所有业务域数字都是拒绝负零的安全整数；初始 marker 为 null 或不大于初始 turn。

旬历为年 1..9999、月 1..12、日只取 1/11/21。`advanceLimit` 为 1..12；创建时检查整个窗口内 date 和 turn 可表示。只有 `AdvanceSharedFacilityTurn` 推进日期，没有自动后台时间或第二个结算时钟。

## 2. 固定太守与三十个设施槽

新增事实 `monthlySpecialty` 恰有 `governorOfficerId`、`facilityLotSlots` 两键。

太守 ID 可以为 null，表示无太守；非 null 必须是供应人物中同城、同势力的一人，且该人的政治为 0..100。这个限制只针对选中的太守，其他人物仍允许政治 0..255。不存在另一个可自行填写的 governorPolitics，也不会从排名、官职、available 或 acted 自动选太守。

月初按固定 ID 从当前人物账读取政治，必须仍与初态稳定政治一致。政治 XP 增加不会自动提升政治。太守即使 unavailable、已经 acted、正在施工预约中，或刚在本月初完成工程，也照常提供月特产政治值；这些状态不构成月产门槛。非 null 太守在当前账中缺失或政治漂移属于不变量错误，不能偷偷降级为“无太守”。

`facilityLotSlots` 恰为 30 项，逐项为供应 lot ID 或 null。每个供应 lot 必须出现恰一次，包括尚为空地的 lot；不能重复、遗漏、引用外部 lot、截短或自动补 null。最多两个非 null lot ID，其余均显式 null。此顺序是场景事实的一部分，保存和重放都保留。

月初实际观察来自本旬施工完成之后的 `current.ledger.facilities`，不是初态 facilities：

|固定槽对应的当前情况|月回执 facilityIds|有效性观察|对应完整设施观察|是否计入完成数|
|---|---|---|---|---|
|映射为 null，或所映射 lot 当前为空|该槽 null|validity=0|字段不存在|否|
|lot 上有 developing 锻冶|真实设施 ID|validity=1|completed=0|否|
|lot 上有 complete 锻冶|真实设施 ID|validity=1|completed=1|是|

存在但未完成与不存在是不同分支；developing 也触发对应完整性观察。完整设施按每座权重 1 计数，不按目标等级、工作量或耐久加权，不把 developing 先算作 complete。本根所有设施都是 forge，设备 1/2/3 都以完整 forge 计数；设备 4 的 stable 匹配规则只是保留的来源政策，本根不执行设备 4 月产。

## 3. 三个命令共用一份余额与行动机会

|命令|费用与产出|人员、设施及时间|
|---|---|---|
|`StartForgeDevelopment(cityId,lotId,facilityId,officerIds)`|金 −300、AP −20；当时不发 XP/merit/TP，不增加库存|1..3 人被预约并写当前 acted；空 lot 创建 developing Lv1 锻冶；不推进时间|
|`Produce(cityId,facilityId,officerIds,equipmentType)`|类型只允许 1/2/3；金扣价格核返回值、AP −20；饱和入库；各所选人智力 XP +2、merit +50|1..3 人写当前 acted，完整锻冶写当前 usedTurn；不推进时间|
|`AdvanceSharedFacilityTurn()`|AP 请求 +20；到期完成时 TP +30，各参建者政治 XP +3、merit +100；新日为月初时再做三设备特产|唯一推进一次；完工释放预约、参建者写新旬 acted；月产不消耗行动机会|

金钱、AP、TP、全部人物成长及库存都只有一份真实当前账。开工和生产竞争同一余额；非参建者在旧锻冶获得的成长不会被后来完工覆盖；月产增加的数量不会被下一次普通生产从初始库存覆盖。

普通行动按人物 acted 与设施 usedTurn 各自限制：换人不能绕过同一设施本旬已用，换设施不能绕过同一人本旬已行动。不同可用人物可在同旬分别使用两座完整锻冶，仍竞争同一金钱与 AP。月特产不使用这些机会；月边界按实际完整状态计数，不以人物 acted 或设施 usedTurn 排除设施。

每笔命令全成或全不成。任何资格、余额、核、写账、完整审计、不变量、历史槽或最终数据包预算错误都丢弃唯一候选；不留下部分扣费、成长、占地、锁、库存、月结或 revision。服务不持有会自动推进的世界，调用者通过接收 execute 返回的新 state 保存会话。

## 4. 开工与工作量

建设只支持 forge、目标 Lv1、typeId=34、目录耐久 D=800、金钱 300、完成 TP=30。一生最多一个建设 job；已完成 job 永久保留，所以完成后也不能再开第二个任务。初态允许另有一座完整旧锻冶。

开工首错依次为：城市及固定 owner/corps/force → 永久 job 额度 → 全部野外单位检查及供应顺序首个阻挡者 → 按所选顺序逐人存在/同城同势力/available/未预约/未 acted → AP → 金钱 → lot 存在且未占/设施 ID 未用 → 目录、速率、工期 → 剩余窗口、到期日、完成历史槽。

敌对单位距城心两格以内（含两格）阻止开始，距离为 `max(abs(dq),abs(dr),abs(dq+dr))`。检测中心为城市而非拟建 lot；全部单位检查保留，失败标出首个 blockingUnitId。敌情只限制开工，不暂停已接受工程，也不新增普通 Produce 的敌情拒绝门。

成功开工创建同一个 facilityId，状态 developing、effectiveLevel=0、targetLevel=1、jobId 绑定该工程、usedTurn=null。所选人员 reservation 双向绑定，actedTurn=当前 turn。开工快照完整保存地块、所选人政治顺序、目录/政策摘要、费用、单位检查、预约变化和速率证据；历史开工回执中的 active job 不会随当前 job 完工而改写。

施工复用既有建设与速率数值核，冻结所选 1..3 人的稳定政治：

- 政治分支 `maxPolitics + floor(sumPolitics/2)`
- 耐久分支 `floor((800−floor(800/4))/9)=66`
- `rate=max(政治分支,66)`，范围 66..637
- 暂定政策 `facility-work-quarter-floor-v1`：required=800、initial=current=200，开工当下不推进
- 从下一旬起 `work=min(800,work+rate)`，工期 `ceil(600/rate)`，为 1..10 次边界

纸面例：单人政治 0 时 rate=66，10 次边界；政治 100 时 rate=150，4 次，工作量 350/500/650/800；三人均政治 255 时 rate=637，一次到顶。这些是规则推导，不是已执行示例。没有额外“强制十旬完工”；D/4 的原始速率算术不证明原生初始工作量或 HP writer，本根 work 不是战斗 HP。

开工必须在剩余 advanceLimit 内完成，且保留足够接受历史槽给全部完成推进；不足即原子拒绝。施工中的 XP 不改变稳定属性或 rate。每个后续成功非推进命令也必须为 active job 保留 remainingTurns 个历史槽。

## 5. 唯一旬边界：完成在先，月产在后

每个 `AdvanceSharedFacilityTurn` 严格执行以下同一候选内的次序：

1. 检查剩余窗口，日期按 1→11→21→下月1（12月21→次年1月1）推进，turn 和 advancedCount 各 +1
2. AP 请求恢复 20，实际为 `min(20,255−before)`，多余部分记录 discarded
3. active 工程 remaining 减 1、work 按 rate 增长并裁剪至 800；到期核对 dueTurn、dueDate、设施/job 绑定及完整工作量
4. 到期时 TP 请求 +30；按参建顺序各自政治 XP 请求 +3、merit 请求 +100；释放人员预约，人物 actedTurn=新 turn；最后同一设施 ID 改 complete/effectiveLevel=1/jobId=null，job 保存完整 completion
5. 若新日期日=1，以这些已经完成的当前设施和当前太守执行月产，设备顺序恰为 1→2→3；否则生成明确 not-due 回执
6. 核对整个候选、库存历史链、完整回执与所有输出包装，全部成功后只提交一次

TP 上限 10,000，XP/merit 上限 1,000,000,000，正奖励按余量裁剪。每名参建者全额请求 XP3/merit100，不按人数分摊。实际奖励为 0 不阻止完成。每笔都保存 before/requestedDelta/actualDelta/after/cap/discarded/policyId。completed job 不再推进或二次奖励。

到期不再检查外敌、available、旧 acted，也不再扣金或生产 AP。无 active job 时同样推进、恢复 AP，progress/completions 为空；月初月产仍发生。若第三设备月回执或最后预算出错，之前的施工完成、TP/成长、前两设备库存全部丢弃，不存在“施工已经完成但月产失败”的半提交。

“恰在月初完工的锻冶参加该月特产”来自 `after-core-completion-at-month-start-v1` 暂定政策。本根不把它声称为原作施工、工资、收入、月产的原生总顺序。创建即使初日为 1，也不发月产、不追补上月、不推断工资已付；只在一次真正接受的旬推进进入日=1时处理。

## 6. 五种月产分支及三设备完整记录

每个 tick 都有 `monthlySpecialty`，恰含 status、settlement、governor、facilityIds、三项 items，items 顺序固定设备 1、2、3。

|分支|触发条件|调用及回执|库存|
|---|---|---|---|
|`not-due`|推进后不是月初|整个阶段 status=not-due，settlement/governor/facilityIds 均 null；三项 not-due，不调用 phase 或月核|不变|
|`no-governor`|月初且固定太守为 null|status=no-governor，保留 city/year/month 和真实 30 个 facilityIds；顺序调用三项 phase，但每项内部不调用核，count/request/write 均 null|不变|
|`not-specialty`|有太守，该设备不在供应特产数组|status=settled；实际调用月核，specialty bit=0，只记录此一个 captured return；count/arithmetic/request/write 均 null|不变|
|`no-completed-facilities`|有太守，该设备是特产，但完整 forge 数=0|实际调用核，完整 30 槽观察，count=0，不读太守政治 helper，arithmetic/request/write=null|不变|
|`production`|有太守、该设备是特产、完整 forge 数=1或2|实际调用核并保留全部输入/结果、政治、算术、数量请求和 write|按容量饱和增加|

status=settled 只说明本根月特产阶段已处理，可以三项都非特产或 count0；它不表示工资、金钱收入、粮食或完整 finance 已结清。三项独立决定 eligibility，不把非特产的 null 请求伪造成 0 生产；无太守不等于政治 0，政治 0 的合法太守仍能生产。

有太守时，特产 bit 只由 `specialtyEquipmentTypes.includes(k)` 推导。月产不要求普通生产的装备解锁、不检查价格、技能、智力、压力、normal/super 或 player/ai；这些仍属于普通生产路径。月产所需真实事实只有设备类型、显式特产资格、当前完整匹配设施和固定太守政治。

对每个真正调用的核，回执完整保留一次 input 和 result.observations 再一份，不能因内容相同删除任一份。captures 顺序是：specialty；槽 0..29 每槽 validity，若 validity=1 立即接该槽 corresponding-completed；仅完成数>0时最后 governor-politics。developing 也产生 completed=0 的 capture。最大 34 条，非特产恰 1 条，count0 为 `31+当前存在设施数`，production 为 `32+当前存在设施数`。

所有核地址、宽度、槽索引与证据标记完整保存；满库存也不能跳核、删 input、删 observations、删 evidence 或省去 write。三个设备都保留自己的完整审计，没有仅留总月入库数量的简化。

## 7. 月产数量的公式、1.5 与半整数

月核 profile 为 `monthly-specialty-production-observed-v1`，算术 profile 为 `comment-f32-rne-trunc-v1`。本根匹配 complete 数 c 只能为 1 或 2，太守政治 p 在 0..100：

|c|factorTier|factorBitsU32|factorValue|
|---|---|---:|---:|
|1|one|1065353216（0x3F800000）|1|
|2|two-to-three|1069547520（0x3FC00000）|1.5|

`politicsAL=p`；`politicsTerm=floor(p/2)+60`，范围 60..110。`scaledValue=politicsTerm×factorValue×3`，范围 180..495，只可能整数或半整数。`convertedSigned32=trunc(scaledValue)`，即向零截断；数量请求 q 为这个整数。`quantityU32=quantitySigned32=kernelQuantityRequest=q`，范围 180..495。

原算术政策保留 1500 请求上限，在本根窄域不可能触及，因此 capApplied 始终 false。这个核上限与城市库存 capacity 不是一回事。count2 的 factor1.5 必须保存，scaledValue 出现 x.5 时也必须原样保存，不能提前取整、四舍五入、改为字符串或删字段。

纸面例：p=2、c=2 时 term=61，scaled=274.5，q=274；p=100、c=1 时 q=330，c=2 时 q=495。它们展示公式语义，不声称执行了这些场景。真实实现仍调用原月核的 binary32 factor store 和转换流程；上述窄域公式用于审计反查，不能替换核调用。

原来源的更宽 count1..30 算术政策完整保留四段：1；`1+(count−1)×half`；`2+(count−3)×quarter`；`3+(count−7)×tenth`。本根不会因保留这些常量就接受第三座 forge 或超过两座的计数。half、quarter、tenth 等内存常量编码及转换器语义仍是注明可替换的假设，不是恢复到的原生内存数据。

## 8. 实际入库与后续普通生产

月产写入的是 `current.ledger.inventory[k].quantity`。设该真实当前数量 b、初态固定 capacity C、核请求 q：

- `requested=q`
- `accepted=actualDelta=min(q,C−b)`
- `after=b+accepted`
- `discarded=q−accepted`
- cap=C，resource=`equipment-k`，reason=`specialty`，writerPolicyId=`saturating-positive-credit-v1`

例如规则上 b=990、C=1000、q=330，则实际 +10、丢弃 320；若 b=C，则实际 +0、丢弃整个 q，仍有完整 production 核和 write，不报“零产量失败”。capacity=0 同样合法。此处的 accepted 是库存 writer 接纳量，不是 accepted command 数。

每项 phase 只获得自己的 `{quantity:b,capacity:C}` 临时库存和冻结事实，不能触达整城账。完整 response/receipt 以及临时库存 capacity、quantity 反查一致后，才把 after 接回真实 row；所有三项后再检查仅 1/2/3 quantity 改动。临时适配对象不是第二份持久库存。

月产不改变 reserved、设备 4、金钱、AP、TP、XP、merit、actedTurn、设施 usedTurn、任何锁或工作量；不收费、不授予普通生产成长、不发普通 TP，也不独立增加历史。普通生产可以先把同一库存装满，月产随后记录零入库；月产先入库后，普通 Produce 则以这一 after 为 before 并裁剪自己的入库。这些顺序必须按历史逐笔核对，不能只将总请求量相加后一次裁剪。

## 9. 完成锻冶的普通生产资格

普通 `Produce` 继续使用真实现设施：不存在的 ID 拒绝；developing/effective0 拒绝；到期后同一 ID complete/effective1 才合格。不是把新设施临时追加到初始设施表后另开旧根。

资格首错依旧：城市 → 每个所选人存在/归属/available/预约/acted → 设施存在/归属/complete/kind/预约/used → 装备解锁 → 价格核 → 数量核 → 库存 writer、奖励与零收益政策 → 金钱 → AP → 实际费用、acted、used 和完整审计反查。

因此参建者在施工中通常先因人员预约被拒绝；其他人尝试 developing 设施才到 facility-incomplete。完成不写 usedTurn，未参建且当旬可行动的人可以同旬使用新锻冶；参建者完成时已被标新旬 acted，要到下一旬且满足其他条件才能普通生产。他们作为太守却不因此失去同月月产资格。

“所有已接受工程有可完成的推进尾”不保证完工后还剩可生产的一旬、可行动人员、金钱或 AP。例如恰在最后允许旬完成、只有参建者时，工程成功完成且可进行该边界月产，但普通生产未必能立即执行。

## 10. 普通生产价格、数量和零收益费用保留

普通生产继续调用 `reduceDomesticInstant` 的 Produce 分支及 `calculateProductionPrice`、`calculateProductionQuantity`。设备只允许 1/2/3，目标同城完整 Lv1 forge，所选 1..3 人均须具备普通行动资格。

价格为供应 basePriceWord；该设备特产 bit=1 时 `floor(basePriceWord×8/10)`，否则原价。这是一次命令的金钱费用，不按最终实际入库比例退款。基础价格 0 合法，仍消耗 AP20。

数量三个有序人物槽使用稳定智力 U8，技能 80 映射为 bit，尾部补 null：

1. `baseQuantity=(最大智力+智力总和+200)×5`
2. 任意选人具有技能 80，先将数量加倍
3. Lv1 设施 factor 位串为准确 `3F800000`（1.0），按既有核乘法和转换顺序处理
4. normal 的 difficultyWord=0，不供应 cityVirtualEax；super 为 2，player→1、ai→0。仅 super 且 cityVirtualEax=0 在设施转换之后再次加倍

返回数量最多 24,400；不新增 9,000 上限、1,010 下限、政治/名声加成或额外特产数量乘数。稳定属性、技能、难度和设施映射是适配政策，不证明原生 getter 或 AI helper 已恢复。

普通库存 writer 同样以真实当前数量为 before：requested 为完整核返回量，returned=actualDelta 为余量内实际增加，after 为裁剪后数量，溢出为 discarded。各所选人物智力 XP 请求 +2、merit 请求 +50，到 1e9 饱和。

`pay-zero-yield-instant-v1` 保留：库存已满或 capacity=0，实际入库为 0 也仍扣足金钱和 AP20、请求成长、写 acted 与 facility.usedTurn。月产的零入库不会产生普通费用或成长，两条路径各按自己的政策执行。

普通生产审计完整保存价格与数量 input/output、slots、中间值、null/false、费用、成长、事件和未建模副作用列表。`ProductionCalculation.facilityApplied=false` 是原 audit 的实际字段，真实设施因子可在完整 quantity input/output 中核对；不能为“表现已接设施”而把它改 true。普通生产不覆盖建设政治 XP、TP、锁、工作量或无关人物/设施。

## 11. 保存、重复命令、128 次重放与完成尾

外层命令为 `{id,expectedRevision,command}`。成功接受一次，revision 加 1，保存完整 envelope 与 receipt；失败、preview、同 ID 重试均不增加 accepted history。相同 ID 的完整 envelope 相同，返回原 receipt 和最新 state/current，不再推进、收费、月结或发奖励。若同 ID 的 command、选人顺序或 expectedRevision 任一改变，先报 command-id-conflict，优先于 stale-revision。未成功 ID 不登记。

本根的 profile、state/save/trace tag 均独立。save 使用 `san11-bounded-forge-monthly-production-save-v1`，保存完整 genesis、目录、五键政策、current 和全部 history；load 从 genesis 逐历史重算，并全文比较每份回执和最终 State。任何月份、槽位、地址、false evidence、半整数、库存 write 或摘要篡改都不能靠最后余额“看起来正确”通过。摘要仅辅助记录，不是信任令牌。

preview 使用相同 transition，返回 projectedCurrent，不登记 ID。replay 从自己的场景开始，按顺序保留完整成功、失败、重复 outcome；expected 只是比较目标，不能驱动状态。每个 accepted/rebuilt prefix，以及每个 replay outcome 聚合，均进行完整包装预算检查；所有旧回执搭配最新 State 的 duplicate 也单独覆盖。

接受历史上限 64，永久 job≤1，推进≤12，人物≤8、设施≤2。AP 纸面约束 `20×(Produce+Start)≤255+20×Advance≤495`，所以实际接受 Start+Produce≤24、总 revision≤36；12 次推进最多跨 4 个月初。Start 的剩余窗口/完成槽约束，加上月产不检查工资、余额或 acted、满库存可饱和为 0，使合法 active job 连续推进至完成的每个前缀都处于已证明的有限域内。

新 trace 最多 **128** 次尝试；旧 `bounded-forge-development-production-v1` 仍保留 **512**，旧 save/schema/API 不被改写，新根也不迁移旧存档。新政策 base 中的 512 是完整旧政策的身份参数，不能覆盖新外层 128。这是独立支持域，不宣称同域无差别升级。

每个包硬限仍为 8,388,608 UTF-8 bytes、250,000 nodes、深度48、数组4096、对象128键。完整三设备月核使 512 次重复在纸面上可能超界，所以本根明确128；没有削掉 evidence、第二份 observations、64字节 ID、8人或2设施来伪装兼容。逐字段预算给出完整128 Trace≤226,411 nodes/7,660,000 bytes、Replay≤223,747 nodes/7,440,000 bytes，包含完整 expected 与最终 State；这是静态证明，不是运行测量。

## 12. 数据安全与半整数的准确含义

输入被安全读取并分离，输出递归冻结，只冻结拥有的数据。拒绝 Proxy（包括 revoked Proxy）、getter/setter、symbol、稀疏数组、额外属性、循环、特殊原型、undefined、函数、BigInt，以及解码后重复 JSON key。读取 Proxy 前不触发它的 traps；必要环境能力缺失时 fail-closed。

新 JSON 安全层接纳非 −0 的安全整数，或两倍为安全整数的精确半整数；NaN、Infinity、0.25、超范围数不接纳。业务字段没有全面改成小数：Scenario、Command、Current、政策、数量、write、captures、observations 仍是整数。合法非整数只能是全文重算一致的 factorValue=1.5 和 scaledValue=x.5。旧根 JSON 的整数规则保持不变。

文本数字仍按 JSON 数字语法经 Number(token) 转为 JS number 后检查，不保证两个不同十进制字面文本转换前无舍入；canonical 输出同值规范文本。不能用这一点接受不在域内的 JS number。存档 serialized 字符串二次转义也单独预算；不把它当普通短字符串。

## 13. 原始来源、适用版本与尚未恢复的部分

月核原始研究来自 sjn4048/311MemoryResearch 固定提交 `66e167e40c3440929ec016f3872aefc3486434c1` 的[《Func-收支03-每月钱粮兵装收支》](https://github.com/sjn4048/311MemoryResearch/blob/66e167e40c3440929ec016f3872aefc3486434c1/%E5%86%85%E5%AD%98%E8%B5%84%E6%96%99/%E6%95%B4%E7%90%86/Func-%E6%94%B6%E6%94%AF03-%E6%AF%8F%E6%9C%88%E9%92%B1%E7%B2%AE%E5%85%B5%E8%A3%85%E6%94%B6%E6%94%AF.txt)，listing blob `028fae66ba44f70716951edd9fae51420780cea0`。本仓库[月特产来源记录](../sources/monthly-specialty-production.json)保存控制流、原始身份、指令范围和算术假设：完整 listing `00590490..00590C23`，月数量切片 `00590A83..00590B83`，另含前置 specialty helper 调用 `00590A7E`。

项目目标标为 PC-PK1.1，来源版本只声称 PK；精确原版本未验证，不认证 vanilla、PS2、其他平台、clean-stock 可执行文件或 ABI。来源注释的常量不是恢复的内存字节；仅 count1 的内联 0x3F800000 在指令中可见。factor store 采用一次 binary32 round-to-nearest-even；未知转换器 `00707A74` 暂按向零截断。count−1/−3/−7 以实际指令为准，不能照抄遗漏偏移的注释。

完整月核 evidence 的 14 个 false 始终保留：exactSourceVersionVerified、runtimeSourceRehashPerformed、nativeExecutableExecuted、nativeHelpersReconstructed、converterBodyKnown、memoryConstantBytesRecovered、stockOriginalVerified、vanillaVerified、abiVerified、fullCallerExecuted、stateWriterIntegrated、ownerForceIntegrated、schedulerIntegrated、rngIntegrated。外层现在有模拟 writer 与 scheduler，不把原核的 native 证据标记改为 true。

其他规则来源仍独立：

- 建设速率：[原始 listing](https://github.com/sjn4048/311MemoryResearch/blob/66e167e40c3440929ec016f3872aefc3486434c1/%E5%86%85%E5%AD%98%E8%B5%84%E6%96%99/%E5%87%BD%E6%95%B0%5B%E8%AE%A1%E7%AE%97%E5%86%85%E6%94%BF%E5%BB%BA%E8%AE%BE%E9%80%9F%E5%BA%A6%5D.txt)、[项目来源](../sources/domestic-construction-rate.json)；只使用非星号 `005BB1D0..005BB2AA`，排除星号 MOD
- 普通价格：[原始 listing](https://github.com/sjn4048/311MemoryResearch/blob/66e167e40c3440929ec016f3872aefc3486434c1/内存资料/整理/Func-内政10-计算生产价格.txt)、[项目来源](../sources/production-price.json)；排除自定义折扣 MOD
- 普通数量：[原始 listing](https://github.com/sjn4048/311MemoryResearch/blob/66e167e40c3440929ec016f3872aefc3486434c1/内存资料/整理/Func-内政11-计算生产数量.txt)、[项目来源](../sources/production-quantity.json)；排除政治替换和特产产量 MOD
- 建设资格、设施值和奖励：[标准设施规则](facility-construction-lifecycle.md)。社区目录不等于原版原始表字节；全额逐人奖励、初始 work、AP恢复与完成 acted 仍是具名政策
- 普通成长采用兼容政策 `source-reward-compat-intelligence-v1`；[命令来源](../sources/city-command-lifecycle.json)的 quantityXpConflict 未解决，不能由本根选择反推原生奖励属性已经确认

TP 范围精确为 `genesis-plus-construction-completion-only`。`ordinaryTechniquePoints=not-modeled` 表示普通生产 TP 未建模，不等同原作普通生产 TP=0，也不等同原生完整 TP 总账恢复。月产不支付工资，不写金钱/粮食收入，没有 office roster、完整 finance、全月总账或原生月循环。

也不支持 HP、伤害、维修、吸收、升级、取消、拆除、退款、所有权变化、外部任务、全地图单位移动、RNG、piece、商人、batch、legal 枚举、UI/CLI 或旧 save 迁移。排除 P0-78 及全部依赖。固定来源 commit 和私有阶段复用身份证明代码来源，不把静态阅读提升为 native 认证或本根运行验收。
