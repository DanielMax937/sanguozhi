# 有界锻冶开发与普通生产 v1

`bounded-forge-development-production-v1` 是一个单城、单军团、固定势力的独立规则根：在空开发地上开始一座 Lv1 锻冶，经逐旬施工完成，再以同一个设施 ID 实际执行普通兵装生产。施工和生产使用同一份金钱、AP、人物成长、行动标记、人员预约与设施账；日期和任务只由一个共享时钟推进。

本页是完整游戏规则正文。[engine 合同](../engine/bounded-forge-development-production.md)给出七个 API、闭合 DTO、首错次序、完整保存重建及预算证明。固定数据见[根政策](../../data/policies/bounded-forge-development-production-v1.json)、[建设目录](../../data/catalogs/facility-construction-catalog-v1.json)和[建设政策目录](../../data/catalogs/facility-construction-policies-v1.json)；[来源清单](../../data/sources/bounded-forge-development-production-v1.json)逐项保留固定提交与 blob 身份。

本根的连接规则是明确标记的 provisional simulation policy（暂定模拟政策）。数值核的公开反汇编证据、社区设施数据、调用者供应的固定事实和新根的事务/调度政策不是同一种证据。本文不宣称恢复原作世界、原生调度或原游戏存档。当前验证范围为静态源码、文本及纸面推导；未运行测试、示例、typecheck、编译、build、runtime、checker 或 schema validator，本文不是运行通过认证。

## 1. 支持的场景

场景必须提供真实初态，不接受外部算好的工期、工作量、完成结果或生产增量：

- 一座 `kind=city` 的城市、所属势力、同势力军团，以及当前日期和 turn；势力、军团、城市所有者与 activeForceId 必须一致
- 初始金钱 0..1,000,000,000，固定金钱上限 1,000,000,000；军团 AP 0..255；势力 TP 0..10,000
- 1..8 名同城同势力人物；领导、魅力、智力、政治各 0..255，available 布尔值，技能数组只含不重复的 79/80/81。每人分别保存领导、魅力、智力、政治、武力五项 XP、merit 与 actedTurn；各 XP/merit 为 0..1,000,000,000
- 0 或 1 座已有的完整 Lv1 锻冶，已有设施提供真实 initialUsedTurn；开发地数量恰比已有设施多 1，因此恰有一个空地，最多两块地、最终最多两座锻冶
- 每块开发地都有唯一 ID、所属城市和轴坐标；同城坐标不可重复，不得与城市中心重合。已有设施必须唯一占用已提供的地块
- 库存恰有装备类型 1/2/3/4 四槽，每槽真实 quantity 和 capacity，0≤quantity≤capacity≤1,000,000。类型 4 只保留和验证，不提供生产命令；全部当前 reserved 恒为 0
- 四项完整生产基础价格，每项为 0..65,535；normal/super 难度、player/ai 控制方、装备解锁和特产数组。数组只能含不重复的 1/2/3/4，不从人物 ID 或城市名称猜表值
- 真实 security 0..100、troops 0..troopCapacity≤1,000,000、morale 0..moraleCap、moraleCap 20..255，以及 patrolUsedTurn。它们供旧普通生产 frame 完整读取，在本根中不变化；不得以虚构的 0 补齐
- 明确的 `completeFieldUnits=true`，最多 16 个完整野外单位，以及最多 16 个显式敌对势力 ID；敌对集合不得包含己方。异势力不自动等于敌军
- 完整建设目录和完整选定政策，不能只给 ID、版本或 digest。所有这些外部事实在整个 episode 固定；本根不更新单位位置、归属、属性或可用状态

ID 是 1..64 字节 ASCII，匹配 `[A-Za-z0-9][A-Za-z0-9_.:-]*`；job ID 是 `job:` 加完整开工命令 ID，最长 68 字节，不能截断。q/r 坐标均在 −1,000,000..1,000,000。所有数值为安全整数；初始 acted/used/patrol marker 为 null 或不大于初始 turn。初态不允许正在建设的设施、外部 job 或预约。

日期只取年 1..9999、月 1..12、日 1/11/21。`advanceLimit` 为 1..12；创建时就验证整个窗口内的日期和 turn 都可表示。没有用户提供的未来事件或临时改变事实的入口。

## 2. 三个命令与共享资源

|命令|费用及产出|人员与设施效果|时钟|
|---|---|---|---|
|`StartForgeDevelopment(cityId,lotId,facilityId,officerIds)`|一次扣 20 AP、300 金；不发 XP、merit 或 TP，不增加库存|选择 1..3 人并预约到完工；占用空地，创建 developing 锻冶|不推进|
|`Produce(cityId,facilityId,officerIds,equipmentType)`|类型仅 1/2/3；扣 20 AP 和价格核返回金钱；库存按实际余量入账；每人智力 XP +2、merit +50|选择 1..3 人，本旬 acted；目标完整锻冶本旬 used|不推进|
|`AdvanceSharedFacilityTurn()`|AP 请求恢复 +20、上限 255；若工程到期，TP 请求 +30，每名参建者政治 XP +3、merit +100|推进工作量；到期释放人员/设施预约，参建者标为新旬 acted|唯一推进一次|

金钱与 AP 都是同一当前余额，不能给建设和生产各发一份初始资源。人物也只有一份五项 XP、merit 和 acted/reservation 账：施工预约中的人物不能去旧锻冶生产；其他人物在旧锻冶生产取得的成长不会被后续完工覆盖。

每旬一个人物最多参与一次成功行动；每座完整锻冶每旬最多成功生产一次。人物机会与设施机会是两个独立限制，换人不能绕过同一设施 used，换设施也不能绕过同一人物 acted。不同可用人物可在同旬分别使用两座完整锻冶，但仍竞争相同金钱和 AP。

每笔命令全成或全不成。任何资格、余额、工期、写账、不变量、历史或最终包装预算失败，都不扣费、不占地、不占 ID、不锁人、不写库存、不留下部分成长，也不增加 revision。调用者采用 execute 返回的新 state 才保存自己的会话；服务没有后台自动推进。

## 3. 开工：敌情、人员、地块和一生一次的任务

开工仅支持 `kind=forge`、目标 Lv1、typeId 34。建设目录取 D=800、金钱 300、完成 TP=30；本根不接受其他设施、直接高等级建设、吸收、升级、维修或第二个建设任务。

资格按以下先后检查，多个条件同时失败时只返回最先到达的一项：

1. 城市 ID、固定势力/军团/所有者一致；累计 job 数必须小于 1。完成后的 job 永久保留，所以第二次开工先报 `job-history-limit`
2. 按供应顺序计算全部单位检查，再取首个阻挡单位。显式敌军距城市中心两格以内（含两格）阻止开工，距离为 `max(abs(dq),abs(dr),abs(dq+dr))`；中心不是拟建地块
3. 按所选人物顺序逐人检查存在、同城同势力、available、未预约、当旬未 acted；每个人全部检查完才检查下一人
4. AP 至少 20，然后金钱至少 300
5. lot 存在、尚未被当前设施占用、facilityId 未被使用，然后读取目录并计算速率、工期、到期日和完成所需历史槽

完整 unitChecks 记录每个单位的位置、hostile、distance 和 blocks；失败标出供应顺序中首个 blockingUnitId。敌情只限制开始，之后不暂停已经接受的工程。普通生产的 `pressureActive` 是另一项独立供应事实，本根不会把城心敌情偷偷写入旧生产环境；旧 Produce 分支本身也不新增这个开工敌情门。

成功时同一个新 facilityId 首次进入设施账，唯一占用该 lot：`status=developing`、`targetLevel=1`、`effectiveLevel=0`、`jobId=job:<开工命令ID>`、`usedTurn=null`。各参建者 reservation 绑定该 job，actedTurn 为当前 turn。随后保留完整开工 job、原顺序政治、速率证据、费用、地块/人员快照、全部预约变化。

开工回执里的 job 永远是开工瞬间的 active 快照。后续当前 job 完工，不能反向修改旧回执。地块占用只由当前设施数组推导，没有可以独立漂移的第二份 occupancy 账。

## 4. 工作量与 1..10 次边界工期

实际速率沿用 `calculateConstructionDevelopment` 调用的既有 `calculateDomesticConstructionRate`，不另写近似核。冻结所选 1..3 人的政治，按原顺序求和与最大值：

- 政治分支：`maxPolitics + floor(sumPolitics / 2)`
- 文献耐久分支：`floor((800 − floor(800 / 4)) / 9) = 66`
- `rate = max(政治分支,66)`，本根允许的完整域是 66..637

固定 provisional 工作量政策为 `facility-work-quarter-floor-v1`：required=800，initial=current=200；开工不增加工作量。从下一次共享旬边界起，每次 `current=min(800,current+rate)`，工期为 `ceil(600/rate)`，因此是 1..10 次边界推进。

纸面推导：单人政治 0 时 rate=66，需要 10 次；单人政治 100 时 rate=150，需要 4 次，工作量依次为 350/500/650/800；三人政治均 255 时 rate=637，一次到顶。这些是合同算术，不是执行样例或原生工期认证，也没有另外施加“强制十旬完工”。

D=800 是来源目录的类型耐久值；200→800 是本根的工程工作量。这里没有 currentHP、伤害或修复，不能把工作量写作战斗 HP。公开速率 listing 内的 D/4 只证明速率下界算术，并不证明原生实例的初始 HP 或初始 work writer。

开始时必须满足剩余 advance 窗口足以到期，且历史槽足以容纳全部完成推进；不足就原子拒绝，不留下无法完成的已接受任务。政治 XP 只累积，不自动提升政治，施工速率也不因在途成长变化。

## 5. 唯一共享旬推进与完工写账

`AdvanceSharedFacilityTurn` 不接目标日期、外部进度或完成结果。每次只按 1→11→21→下月1 推进；12月21到次年1月1。这是旬历，不是公历机械加十天。

顺序固定为：检查窗口 → date/turn/advancedCount 各推进一次 → AP 恢复一次 → active job 工作量推进一次 → 到期完成。没有第二个施工时钟，也不会再调用旧服务让 AP 或日期恢复两次。无 active job 时仍可推进和恢复 AP，progress/completions 为空数组。

AP 的 requestedDelta=20，实际增量为 `min(20,255−当前AP)`，超出部分记录为 discarded。AP=250 时一次推进实际 +5、丢弃 15；这是纸面写账规则。旧命令重复不会再恢复 AP。

到期先验证目标设施仍存在且绑定相同 job、任务 remaining=0、当前 turn/date 与 dueTurn/dueDate 完全一致、work.current=800，再完成以下同一候选内的写入：

1. 势力 TP 请求 +30，立即写到真实当前 force 账
2. 按参建顺序逐人读取当前人物并核对预约；该人先计算政治 XP +3，再计算 merit +100，随后落账、释放预约、写 `actedTurn=新turn`
3. 全员完成后，原设施原地改为 complete、effectiveLevel=1、jobId=null；同一个设施 ID、lotId 和 typeId 保留。任务记录 completedTurn 与完整 completion，永久保留

TP 上限 10,000，XP/merit 上限 1,000,000,000。正向奖励按剩余空间裁剪，每笔保存 before/requestedDelta/actualDelta/after/cap/discarded/policyId；已满时实际奖励 0 也不阻止完成。比如 TP=9990 时请求 30、实际 10、丢弃 20。每名参与者全额请求 XP3/merit100，不除以人数；这是具名政策，不宣称原作多人分配已恢复。

完成不再检查外敌、available 或旧 acted，也不再扣金或生产 AP。若内部最后一步失败，之前的候选 TP 和人物写入一并丢弃。completed job 不再推进、不再发第二次奖励。

## 6. 从同一个设施 ID 进入普通生产

新设施的资格链是真实当前状态转换：开工前 ID 不存在 → 开工后 developing/effective0 → 到期后同 ID complete/effective1 → 对该 ID 执行 Produce。

- 未开工且前面的人员资格均通过时，生产查不到该 facilityId，拒绝 unknown-facility
- 建设中，满足其他人员资格的非参建者尝试生产会在设施 complete 门拒绝 facility-incomplete；参建者会更早在人员 reservation 门被拒绝。旧生产 frame 的等级仍传 targetLevel=1，complete=false，锁真实保留；不传 level0，不把设施提前标成完整
- 完成后，用当前设施 phase、usedTurn 和预约生成 frame；不能从 genesis 设施列表生成生产资格，因为新设施在 genesis 中不存在
- 完成不写 usedTurn，所以未参建且当旬可行动的人，可以在完工的同一旬立即使用这座新锻冶
- 参建者完成时被标为新旬 acted，所以该旬不能生产；再推进一旬后，旧 acted 自然过期，符合其他门槛时可以生产。预约在施工期间不会因换旬提前消失

只保证所有已接受工程能够完成，不保证完工后仍有可生产的余旬、可用人物、AP、金钱或设施机会。尤其恰好最后允许旬完工且只有参建者时，工程完成但他们当旬不能生产，有限窗口也不允许再推进；不能把这种合法场景描述成“完工必定马上生产”。

## 7. 生产数量、价格、费用与成长

普通生产实际复用既有 `reduceDomesticInstant` 的 Produce 分支、价格核 `calculateProductionPrice` 与数量核 `calculateProductionQuantity`。这里只支持装备类型 1/2/3，必须已解锁，设施为同城完整 Lv1 forge、未预约且当旬未使用。选中 1..3 人须同城同势力、available、未预约、当旬未 acted。

资格后先算价格，再算数量，再库存 writer 和奖励；之后才校金钱、AP 足额并扣费。不能把 AP 门提前到核计算之前，改变旧分支的首错次序。

价格使用场景供应的 basePriceWord：非特产返回原价；特产 helper bit 为 1 时返回 `floor(basePriceWord×8/10)`。费用是一次生产的价格，不按最终实际入库量比例退还；价格为 0 仍保留合法费用回执，AP 固定 20。

数量核的三个有序槽来自所选人物，尾部补 null；每个有效槽的 getter 为真实稳定智力 U8，技能 80 存在映射为 helper bit 1：

1. `baseQuantity=(最大智力+智力总和+200)×5`
2. 有任一技能 80 时先加倍，否则不变
3. 设施因子为 Lv1 的准确 binary32 位串 `3F800000`（1.0），按既有核乘法/转换顺序处理
4. normal 使用 difficultyWord=0，不提供 cityVirtualEax；super 使用 2，并按本根固定映射 player→1、ai→0。仅 super 且 cityVirtualEax=0 时，在设施转换之后再加倍

本根返回数量最多 24,400；不添加 9,000 上限、最低 1,010、政治加成、名声加成或额外特产产量乘数。原核只消费已解析 helper/getter/倍率；本根从人物、难度和设施映射这些值属于适配政策，不证明原生 getter、设施选择器或 AI 判定函数已恢复。

库存真实增加 `min(核返回量,capacity−当前quantity)`；requested 保留完整核返回量，returned/actualDelta 记录实际入库量，溢出量计 discarded。每个所选人物智力 XP 请求 +2、merit 请求 +50，各自到 1e9 裁剪。

零收益政策固定 `pay-zero-yield-instant-v1`：库存已满或 capacity=0 时实际入库为 0，仍须足额支付金钱和 20 AP，仍请求人物奖励、写 acted 和 facility.usedTurn。不能以“什么都没得到”为由免费重试或省掉行动机会。

审计完整保留价格和数量 input/output、中间值、null/false、槽位与写账。旧 `ProductionCalculation.facilityApplied` 保持 false；这只是既有 audit 字段的实际值，不表示设施未参与。真实因子及其效果由 quantity 核的完整 input/output（含 `3F800000`、convertedQuantity）记录，不能改成 true 美化审计。

普通生产只回写当前金/AP、目标库存、所选者 intelligenceXp/merit/acted 和目标 facility.usedTurn。它不重置 construction 政治 XP，不覆写工作量、TP、锁、其他人物或其他设施。

## 8. 保存、重复命令和重放

每个命令外包为 `{id,expectedRevision,command}`。新成功命令增加 revision 并保留完整 envelope 与 receipt；失败和重复不占 history。只有 64 条接受历史、1 个永久建设 job、最多 12 次 advance；完整 trace 最多 512 次尝试。

同一 ID 的整个 envelope 完全相同，返回原 receipt 加最新 state/current，不重扣费、不重做生产、不推进时间、不再奖励。即使旧开工 receipt 内仍是 active job，它与最新已完成 current 一起返回也是正确结果。相同 ID 改 command、选人顺序或 expectedRevision 均为 command-id-conflict，优先于 stale。未成功的 ID 没有登记，可修正后再用。

save 保存完整 genesis、固定政策/目录、current 和全部接受历史，使用独立的 `san11-bounded-forge-development-production-save-v1` tag。load 不信任余额、job、receipt 或摘要，必须从 genesis 按全部历史重新执行同一纯 transition，逐项比较完整 envelope、receipt 与最终 State；缺失、额外字段、错顺序和任何审计篡改均不通过。SHA-256 digest 是辅助记录，不能代替完整比较。

preview 走相同资格和算术，但不提交。replay 从自己的 scenario 开始，逐次记录完整成功、失败或重复 outcome；expected 仅用于比较，不决定行为。完整合法的 512 个 expected outcomes 与 expectedFinalState 输入包、512 个 outcomes 结果包都纳入独立预算，不删旧审计换取空间。

所有入口安全读取并分离输入，成功输出递归冻结，只冻结自己的数据；不修改或冻结调用者对象。禁止 getter/setter、symbol、稀疏数组、额外属性、原型既非 Object.prototype 也非 null 的数据对象、循环引用、undefined、函数、非安全整数及重复解码后 JSON key。工程上限为每包 8,388,608 UTF-8 bytes、250,000 nodes、深度 48、每数组 4096 项、每对象 128 键。

## 9. 政策与证据边界

普通生产沿用 `source-reward-compat-intelligence-v1` 的智力经验选择；[既有命令来源](../sources/city-command-lifecycle.json)中的 `quantityXpConflict` 仍未解决，不能用这一兼容选择宣称原生奖励属性已确认。

本根固定采用以下暂定模拟政策；虽然旧建设政策目录与设施目录保留其他政策和其他设施数据，它们不成为本根可选开关：

- `facility-ap20-cap255-v1`：每个共享旬 AP 请求 +20
- `facility-work-quarter-floor-v1`：D=800 的起始 work=200
- `next-boundary-capped-work-v1`：下个边界才推进，到顶裁剪、到期完成
- `facility-community-rewards-v1`：锻冶完成每人政治 XP3、merit100
- `facility-completion-actors-acted-v1`：完工人员在新旬已行动
- `facility-exact-debit-saturating-reward-v1`：全额扣费与饱和奖励，保留丢弃量
- 稳定有效属性、Lv1 因子、production AP20、生产智力 XP2/merit50、零产量仍收费，沿用具名普通内政政策

建设 TP 确实记入当前势力账，但范围只为 `genesis-plus-construction-completion-only`。`ordinaryTechniquePoints=not-modeled`：普通生产 TP 未建模，绝不等同“原作普通生产 TP 为 0”，也不等同完整原生 TP 总账已经恢复。

证据入口：

- 建设速率：[固定提交的公开 listing](https://github.com/sjn4048/311MemoryResearch/blob/66e167e40c3440929ec016f3872aefc3486434c1/%E5%86%85%E5%AD%98%E8%B5%84%E6%96%99/%E5%87%BD%E6%95%B0%5B%E8%AE%A1%E7%AE%97%E5%86%85%E6%94%BF%E5%BB%BA%E8%AE%BE%E9%80%9F%E5%BA%A6%5D.txt)、[本仓库来源记录](../sources/domestic-construction-rate.json)、[速率规则](domestic-construction-rate.md)。只使用非星号 `005BB1D0..005BB2AA`；星号 MOD 排除。政治 getter 与 D 读取要求稳定
- 生产价格：[固定提交的公开 listing](https://github.com/sjn4048/311MemoryResearch/blob/66e167e40c3440929ec016f3872aefc3486434c1/内存资料/整理/Func-内政10-计算生产价格.txt)、[本仓库来源记录](../sources/production-price.json)、[价格规则](production-price.md)。自定义折扣 MOD 排除，不把展示的补丁常数当原字节
- 生产数量：[固定提交的公开 listing](https://github.com/sjn4048/311MemoryResearch/blob/66e167e40c3440929ec016f3872aefc3486434c1/内存资料/整理/Func-内政11-计算生产数量.txt)、[本仓库来源记录](../sources/production-quantity.json)、[数量规则](production-quantity.md)。替换政治和特产产量 MOD 均排除
- 建设资格、社区设施值及奖励冲突：[标准设施建设规则](facility-construction-lifecycle.md)。目录/社区数据不提升为 clean-stock 原始表字节；逐人全额奖励与发放时点依旧是政策
- 原行为复用：[建设私有阶段](../engine/facility-construction-phases.md)；具体普通生产审计和核字段见[本根 engine 合同](../engine/bounded-forge-development-production.md)

没有 batch、legal 枚举、CLI、UI、商人、piece 生产、收入入账、HP、维修、吸收、升级、取消、拆除、退款、所有权变化、全地图单位移动、RNG、原生 scheduler 或旧 save 迁移。新根不通过重置 genesis“导入”旧余额和历史。公开 listing 的局部数值重建，不认证 clean-stock、跨版本/平台等价、原生库存 writer、原生人物任务、原生 AP/成长或完整世界循环。
