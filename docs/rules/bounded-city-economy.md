# 固定单城单旬共享内政与商人 v1

`bounded-city-domestic-merchant-v1` 将巡查、征兵、数量装备生产和粮食买卖放进同一个当前账本。一个根事务可按调用者顺序执行 1–8 个动作，全部成功才提交。卖粮获得的金可以支付同一事务后续征兵；商人使用的人不能再执行巡查；所有动作消耗同一军团 AP。

这是具名、有限的模拟组合，不是原作世界存档或完整游戏。日期、城、势力、军团、有效属性、设施、敌情、商人在场和相场在创建时固定；没有推进旬、AP 恢复、人物迁移、任务、部队调度、成长或完整 TP 账本。`revision` 只是提交版本，不是日期或回合。旧独立服务的保存和公共接口保持各自边界，不是本服务可导入的余额来源。

本次仅有静态文本审阅；没有运行测试、示例、typecheck、编译、构建、runtime、checker 或 schema validator。文中的数字例子是纸面推导，不是运行结果。

## 资料和证据层级

- 本服务的[完整政策快照](../../data/policies/bounded-city-economy-v1.json)须逐字段相等，不能只交政策 ID
- [来源记录](../../data/sources/bounded-city-economy-v1.json)区分原服务历史版本、即时 reducer 版本、原数值 listing、经验观察和本版新增模拟政策
- 数值核分别见[巡查](patrol-security-gain.md)、[征兵数量](recruitment-quantity.md)、[征兵治安参数](recruitment-security-argument.md)、[生产价格](production-price.md)、[生产数量](production-quantity.md)
- [普通内政旧规则](city-command-lifecycle.md)和[商人旧规则](city-merchant-lifecycle.md)仍说明各自更宽支持域及来源限度。本版选择旧普通内政默认政策，未接旧政策的全部变体
- 历史服务来源固定在 [0c5ad006](https://github.com/DanielMax937/sanguozhi/tree/0c5ad00667d40960e72f2d8b14c9c20f7eec30fc)，即时 reducer 来源固定在 [aab86f14](https://github.com/DanielMax937/sanguozhi/tree/aab86f1482ce0951fcd229f8f163d5b072e87104)。来源版本不同，不能相互重标；字节身份不证明运行兼容或原作等价

商人官方说明支持城市命令、20 AP、无固定金费、两格敌军门槛及政治影响交易；具体相场、政治锚点和 XP5 来自经验资料。本版未恢复原生交易的三个 helper、raw price 尺度、writer 或舍入。新原子组合、整数 writer、容量、ID、预算、分页和保存协议都是工程/模拟政策，不升级为原作 confirmed 规则。

## 完整支持域

所有对象闭合，所有列出的字段必填，数组必须稠密且保持顺序。数值均为安全整数，拒绝负零。ID 为 1–64 个 ASCII 字符，首字符字母或数字，其余为字母、数字、下划线、点、冒号或连字符；legal 的 requestId 最长 32。

| 资料 | 范围与条件 |
|---|---|
| 固定身份 | 一城 `kind=city`；`activeForceId = city.ownerForceId = corps.forceId`；每个人与设施均属该城，每个人 forceId 也相同 |
| 固定时钟 | year 1–9999，month 1–12，day 只能 1/11/21；turn 0–9007199254740991；动作不改变任何时钟字段 |
| 人物 | 1–256 个，人物 ID 内唯一；available 为固定供应资格；leadership/charm/intelligence 各 0–255，politics 20–100 |
| 技能 | 唯一数组，只接受 79/80/81；空数组明确表示没有本域技能，不暗含其他技能已解析 |
| 进度 | 五维 XP：leadership/charm/intelligence/politics/war，各 0–1e9；merit 0–1e9；actedTurn 为 null 或不晚于固定 turn 的非负整数 |
| 设施 | 0–30 个，设施 ID 内唯一，kind 为 barracks/forge/stable，level 1/2/3，complete 显式布尔；initialUsedTurn 同 marker 域 |
| 金、粮、AP | gold 0–1e9，goldCapacity 必须 1e9；food 0–foodCapacity，foodCapacity 0–1e9；AP 0–255 |
| 城市 | security 0–100，troops 0–troopCapacity，troopCapacity 0–1e6；morale 0–moraleCap，moraleCap 20–255 |
| 装备 | 仅 1/2/3/4 四个键，每个 quantity/capacity 0–1e6 且 quantity≤capacity；无 reserved/job 字段 |
| 生产资料 | 四个价格键完整，basePriceWord 0–65535；目录 id/version/entries 完整保留；解锁与特产是 1–4 的唯一集合 |
| 普通内政事实 | pressureActive 布尔、difficulty normal/super、controller player/ai；全程固定 |
| 商人事实 | present 显式布尔，即使不在也须 uiTradePrice 为 3–7；completeFieldUnits 必须 true，空单位也须显式 [] |
| 敌情 | 最多 4096 个 ID 唯一单位、最多 256 个唯一敌对 forceId；敌对名单不得含 activeForceId；单位及城轴坐标 q/r 各 −1e6…1e6 |

人物、设施、单位有独立 ID 命名空间；跨类型相同字符串可以存在，不据此合并对象。ledger 人物/设施行必须按 genesis 原序一一对应，不能加行、删行或重排。过去的 acted/used 标记保留；当旬标记阻挡行动；未来标记拒绝。

有效属性是 supplied resolved facts，不从 XP、宝物、关系、官职、伤病或部队位置推导。`domestic.pressureActive` 是独立 supplied helper 抽象，不能由商人两格敌情布尔推导。不同势力不自动敌对。固定事实不意味着恢复了原作商人生成、粮价变动、地图几何或原生 pressure predicate。

## 唯一账本与行动机会

当前金、粮、AP、治安、兵、气力、四类装备库存只在根 ledger 各存一次。每个人的五维 XP、merit 和 actedTurn 也只存一次。商人的 politicsXp 是内部投影视图，实际对应同一 `xp.politics`，不存在第二份可独立修改的余额。

巡查机会 `patrolUsedTurn` 与商人机会 `merchantUsedTurn` 相互独立；巡查每城一次，商人买卖共用每城一次。设施机会逐设施独立；同一设施不能由另一个人再用。所有选中人物共用 actedTurn，换动作类别不能绕过。初始当旬机会可已使用，不自动清空。

根场景不含任务/预约，不能导入带任务旧 state 再抹去 reserved。不存在 caller 传入的 finalLedger、delta、报价、成功标记、childState 或外来 receipt 修补口。模拟按当前候选账本逐步计算，不能预先读同一个事务起点再相加 delta。

## 前置检查与失败优先级

公共入口先进行有界数据复制/严格解码、闭合 shape/整数/ID 校验，再从 genesis 与全部接受历史重建并比较完整 state。新命令先查 ID：完全相同 envelope（含 expectedRevision 和动作/选人顺序）是 duplicate；同 ID 不同内容是 `command-id-conflict`。重复优先于 stale 检查。新 ID 再校 expectedRevision、历史额度、动作数量和完整支持域。

每个普通内政动作依次检查：

1. cityId 匹配；巡查再检查 patrolUsedTurn
2. 按 officerIds 顺序检查每人存在、同势力同城、available、未当旬 acted；每动作 1–3 个不同人物
3. 征兵/生产检查指定设施存在、在城、complete、种类正确、未当旬使用；本域不接受外来任务锁
4. 生产再检查装备已解锁；随后调用数量/价格核，计算 writer、奖励和候选效果
5. 应用固定 pay-zero-yield 政策后先检查金足够，再检查 AP 足够；最后精确扣费、写 acted/设施 used

临时候选计算在扣费前发生不代表先提交。任何后续检查失败都丢弃整个根事务，包括已计算奖励。

商人依次检查：cityId、city kind、owner/corps/force 匹配、present、城市商人未用、人物存在/同城同势力、available、未 acted、政治支持域；然后按完整单位输入序找首个明确敌对且距离≤2 的单位；再检查 AP≥20、计算政治效果与金额、拒绝零金卖出、检查金额支持域，最后检查余额与容量。买粮先金余额再粮容量；卖粮先粮余额再金容量。`hostile-within-two` 的 blockingUnitId 是首个阻挡单位，其余失败该字段为 null。

## 巡查 Patrol

收费 100 金和 20 AP。选择 1–3 人，不需要设施。设所选统率和为 L、行动前治安为 O：

1. B = floor(L / 28) + 2
2. pressureActive 为 true 时 H = floor(B / 2)，否则 H = B
3. 数值核请求治安增量 min(H, 100 − O)，压力先于封顶
4. 用 clip-and-return-actual writer 写治安；实际增加与请求、returned、discarded 均入 audit
5. 写当旬 patrolUsedTurn，所有选中人 actedTurn；每人请求 leadership XP +2、merit +50，分别饱和 1e9

治安已 100 导致零收益，仍收费、占机会和发饱和奖励。该行为是 `pay-zero-yield-instant-v1` 政策。常见失败为 unknown-city、patrol-already-used、unknown-officer、officer-unavailable、officer-already-acted、insufficient-gold、insufficient-action-points；核/不变量错误不产生部分写入。

## 征兵 Recruit

收费 300 金和 20 AP。指定同城完整、未用 barracks，1–3 人。使用所选兵舍等级，不能改成全城最高等级或设施数量。

令 C 为魅力和、O 为动作开始治安；有任一选中人含技能 79 则 K=15，否则 K=10：

1. A = 1000 + floor((O + 20) × C / 20)
2. N = floor(A × K / 10)
3. R = trunc(N × F)，F 是等级的精确 binary32 数值
4. super/AI 在转换后加倍；随后压力为真时向零除以 2
5. 既有数量核按当前兵和容量给出返回量；本服务非负无溢出域可理解为限制到剩余兵容量，不能据此改写核的通用 signed32/U32 分支
6. troop writer 处理核返回，保存 requested/returned/actualDelta/discarded。征兵治安核输入是 `troopWrite.returned >>> 0`，不是预容量数量
7. 本域非负 returned 对应请求治安变化 −floor(returned / (C + 100))；以当前治安 writer 写入。audit 仍保留 signed 值及 U32 形式
8. 新兵气力先取 floor(O / 2)。设实际收到兵数 a、旧兵 T、旧气力 M：若 T+a>0，混合值=(T×M+a×floor(O/2))/(T+a)，否则为 M。最终气力=min(moraleCap,max(20,floor(混合值)))
9. 每人请求 charm XP +2、merit +50，写 actedTurn 和该兵舍 usedTurn

治安的 O 是写治安前快照；气力用 actualDelta，不能错用数量请求。即使 a=0，旧气力<20 时仍执行 min20 步骤。满兵时零入库仍收费、奖励和占机会。除人物/费用门槛外，可能因 unknown-facility、facility-incomplete、wrong-facility-kind、facility-used-this-turn 失败。

## 数量生产 Produce

仅装备 1/2/3/4，1–3 人；1–3 使用 forge，4 使用 stable。设施须完整未用，装备须在显式 unlockedEquipmentTypes 内。没有件数装备、生产 job、工期、跨旬预约或完工奖励。

价格从指定装备的 uint16 basePriceWord 读一次。装备在 specialtyEquipmentTypes 中则供给 specialty EAX=1（非零 AL），价格=floor(basePriceWord×8/10)；否则原价。0 是合法价格，没有隐含最小 1 金或固定价表。仍须 20 AP，并照常写 acted/used 和奖励。

令 I 为所选 intelligence 和、M 为最大值：

1. base=(M+I+200)×5
2. 装备 1–3 查技能 80，装备 4 查技能 81；任一人有相应技能时 base×2，多人不叠加
3. 乘设施 F 后向零截断
4. super/AI 在转换后再加倍；特产只影响价格，不改变此数量
5. 将返回量写该装备当前库存，用剩余容量 clip；没有核内 9000 cap 或 1010 minimum
6. 扣计算价格和 20 AP，每人请求 intelligence XP +2、merit +50，写人物 actedTurn/设施 usedTurn

同事务后续生产读取前一次真实库存，不能各自读取原空库存。满库存实际入库 0 仍按默认政策收费、占机会、奖励。一次仅允许对应装备库存改变；equipment-locked 与设施、人物、费用失败均原子拒绝。

## 设施、难度、writer 与奖励政策

等级 1/2/3 的 F 分别为 1、5033165/4194304、3/2，binary32 bits 为 `3F800000`、`3F99999A`、`3FC00000`。中间值不是任意 JS 1.2，也不是原生 stock table 已恢复的证明。技能步骤在 factor 转换之前。

normal→difficultyWord=0，super→2；super player→cityVirtualEax=1，super ai→0。原两个数量核只有 EAX===0 才加倍。本版保持此适配，不按自然语言猜测调换。production 非 super 输入不含 cityVirtualEax，输出仍保留 observed=false/eax=null。

普通资源 writer：raw=before+requested，after=min(cap,max(0,raw))，actualDelta=after−before，returned=actualDelta，discarded=requested−actualDelta。收费使用独立 exact-affordable-debit，不能 clip 一个负担不起的收费。XP/merit 使用独立饱和 accumulator，cap=1e9，保留请求与实际差额。

默认数量生产 XP 选 intelligence 兼容政策；旧 politics 变体仍属于旧服务，本版不自选或混用。五维 XP 不反算能力，不等于其他培养服务 3000 累计 XP/显示成长；merit 上限不等于官职服务上限。普通 TP 未建模，不创建势力 TP 总账。

## 买粮 BuyFood 与卖粮 SellFood

每城当旬最多一笔商人买或卖，执行者一人，20 AP，无固定金手续费。请求 Q 为 1–1e9 粮，不接受请求金量、最终报价或零粮空交易。城市和执行者标记与全部普通内政共享。

单位与城的轴距为 max(abs(dq),abs(dr),abs(dq+dr))。只把 hostileForceIds 中势力视为敌对；任一敌对单位距离≤2 阻挡，距离3不阻挡。必须提供完整快照，不能将缺失数组当空敌情。

政治 p 只支持 20–100。固定目录 `merchant-politics-observed-linear-v1` 的 12 个锚点为：

| p | 效果百万分子 A |
|---|---:|
|20|930240|
|50|1000000|
|51|1002516|
|60|1025650|
|70|1052642|
|80|1081090|
|90|1111122|
|92|1117328|
|97|1133154|
|98|1136374|
|99|1139612|
|100|1142868|

锚点效果 N/D=A/1000000；相邻锚点 l<h 之间 N=A_l×(h−p)+A_h×(p−l)，D=1000000×(h−l)。保留未约分分数。设 UI 相场 u∈{3,4,5,6,7}，其单位是粮/金：

- 买粮成本 ceil(Q×D/(u×N))
- 卖粮收入 floor(Q×N×4/(u×D×5))

全程 BigInt 精确整数分数；receipt 保存 exactGold 未约分分子/分母、remainder、ceil/floor 和 roundingDifference。买的差额为 (settled×denominator−numerator)/denominator；卖的差额为 (numerator−settled×denominator)/denominator，各小于1金；4/5 只在卖方，不能与舍入混为一次损耗。

金额先校 0–1e9，零金卖出 `zero-value-sale` 拒绝。买必须金足且 food+Q≤foodCapacity；卖必须粮足且 gold+credit≤1e9。整笔成交，无 partial、overflow clip、隐藏手续费；成功的 gold/food writer discarded=0。此 full-fill-cap-reject 与普通内政 clip writer 刻意不同。

成功后人物 politics XP 请求+5，实际=min(5,1e9−原值)，能力 politics 不变。其他四维 XP 不变；共享 merit 原值不变，audit 明示 `merchantMerit=not-modeled-preserve-existing`。旧 audit 的 meritDelta/techniquePointsDelta/loyaltyDelta=0 是未应用占位，不能表述为原作奖励为0。官方提到商人提高功绩，本版尚未集成其算法。

外部商人只记录互补 goldDelta/foodDelta，balanceMode=external-untracked；没有可查询“无限余额商人账户”。本域 rngDraws=0，不证明原作两服务整体无随机。

## 事务、幂等与完整审计

整个 batch 只有一个 envelope ID、一个 revision+1 和一条 acceptedCommands。每步读取上一步候选 ledger；每个 domestic event 的 subjectId 都是根 envelope ID，由 step.index 区分，不制造子 history 或子 revision。

每步根 changes 只记录实际改变，顺序固定：city 的 gold/food/security/troops/morale/patrolUsedTurn/merchantUsedTurn → corps AP → equipment 1/2/3/4 → genesis 人物序每人 leadership/charm/intelligence/politics/war/merit/actedTurn → genesis 设施序 usedTurn。一个路径最多一次。audit 另保留原核数组顺序、选人奖励序和 before=after 的 Write，不能用 changes 代替完整审计。

五种核 audit 是闭合 typed union，不能以 unknown 或任意对象保存。Patrol 只 stable 成功分支；Recruit quantity 只 captured-quantity-projection，保留三槽、trace、callDetails；Recruit security 的 signed 差额与 U32（最高4294967295）不能套 ledger 的非负1e9限制；Price 保存合法零价和 AL；Production quantity 只 resolved equipment1–4，不接受早退/piece/无观察分支。只删旧顶层 evidence，不能删 callDetails 或改数组顺序。schema 的范围校验不是执行依据，load/replay 仍完整重算并逐字段比较。

任何一步（包括第8步、预算或序列化）失败，金粮、兵装、AP、XP、merit、acted/used、revision、history 全不提交；失败 ID 不占用，失败不返回部分 receipt/state。完全相同成功 ID 重试返回原 receipt 与当前 state，不再收费。preview 返回 projectedLedger 而不提交，仍执行相同 gates 和全部输出/保存预算。

## 保存、分页和 CLI 边界

[API 文档](../engine/bounded-city-economy.md)给出完整 DTO、失败和协议。保存包括唯一 genesis、完整政策/目录、每个完整 envelope/receipt、当前 ledger；load 从头重放全部历史和每个前缀的预算/不变量，比较完整 receipt 和最终 state。摘要不取代重算，expected 只比较，不能指定结果。完全自洽地改写 genesis+history 可形成另一合法场景；这不是签名、原作存档认证或反篡改身份认证。

预算固定：每输入/完整返回/raw save/含转义 serialized 的 SaveResult ≤8MiB UTF-8、250000 节点、48 深、数组≤4096、对象≤128键；history≤128、每批1–8动作、trace≤512尝试。revision0 及每个前缀也须 fit；当前 state 上所有旧 ID 的 duplicate execute/preview 返回也须 fit。固定 AP≤255 且每动作20，实际成功动作最多12；remainingHistorySlots 不等于剩余可行动数。

legal 只枚举请求指定的 1–3 人普通组或 null，和最多16个不同(人,Q)商人探针。先 Patrol，再按 genesis 设施序生成 barracks Recruit、forge Produce1/2/3、stable Produce4，最后按探针序 Buy 再 Sell；包括已用、未完工、未解锁而会被拒绝的候选，最多123。每页1–4项上限，只返回可 fit 连续区间，不跳项或省略 audit。cursor 绑定完整 state 和请求顺序；执行任一候选后旧 cursor 失效。globalCompleteness 恒 false，未枚举其他选人、粮量、多动作 batch。最后一页标志只表示无后页，不能证明已读前页。

独立 CLI `npm run play:city-economy` 使用显式 JSON 文件。`execute` 只内存提交，`save` 才创建文件，使用 wx，绝不覆盖现有文件；IO/stdout 失败不重执行动作，也不回滚已持有内存 state。新文件中途失败可能留下不完整文件，错误中的 partialNewFileMayRemain 明示该可能性；不偷偷删除/重试。quit 不保存。没有 EndTurn、Advance、autoAdvance、旧 state 导入、merge-saves 或 reset-genesis。

## 可复核纸面例子（synthetic，未运行）

[场景](../../data/scenarios/bounded-city-economy-example-v1.json)固定 turn0，金200、粮1000、AP60、治安80、兵1000、气力80；merchantA 与 recruiterB 分离，政治50，相场5，无敌情，等级1兵舍，charm100，无技能。

[动作文件](../../data/scenarios/bounded-city-economy-actions-v1.json)先 SellFood(merchantA,1000)，再 Recruit(recruiterB)：

1. 卖粮收入 floor(1000×4/(5×5))=160；候选金360、粮0、AP40；merchantA politics XP5、merit仍123
2. 征兵量1000+floor(100×100/20)=1500，兵变2500；治安 −floor(1500/200)=−7，变73；气力 floor((1000×80+1500×40)/2500)=56
3. 扣300金/20AP 后金60、粮0、AP20；recruiterB charm XP2/merit50；两人 actedTurn0，merchantUsedTurn0、barracks usedTurn0；revision1，日期/turn不动

反序 Recruit→Sell 会先缺金，整批拒绝；同人 Sell→Patrol 会因第二步已 acted 整批拒绝；AP39 的 Sell→Recruit 会因第二步缺 AP 整批拒绝。任何拒绝都恢复初态，而非保留卖粮那半笔。

[legal 请求](../../data/scenarios/bounded-city-economy-legal-v1.json)从 null cursor 开始；[trace](../../data/scenarios/bounded-city-economy-trace-v1.json)只给输入且 expected=null，不伪造未运行的完整 receipt 或 oracle。场景中的属性、容量、价格、身份与安全敌情都是合成资料，不是原作 stock 数据。
