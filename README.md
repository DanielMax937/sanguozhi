## 当前新增：固定双城普通流言标量（O12-B，2026-10-17）

[完整规则](docs/rules/rumor-scalar-lifecycle.md)与[API](docs/engine/rumor-scalar-lifecycle.md)：固定双城普通名单，内部新odds成功判定、关系保护、至多一人加空槽、义理抗性、分离忠诚/治安loss；实际独立扣200金/30AP、执行者每旬一次、真实byte/UI分层、旬序、新RNG、完整policy及原子幂等保存重算。见[政策](data/catalogs/rumor-scalar-policy-v1.json)、[来源](docs/sources/rumor-scalar-lifecycle.json)、[schema](docs/sources/rumor-scalar-lifecycle.schema.json)、[未运行场景](data/scenarios/rumor-scalar-example-v1.json)。

所有具体公式、平均防守、保护、selector、义理/loss和RNG均synthetic；官方仅支持200/30及智力方向等定性事实，计略府10/12只为listing独立参数依据。原成功率仍E；原被捕风险 unresolved-not-modeled，travel/failureDiplomacy/xpMeritTp均不模拟，ownershipFrozen=true；完整原世界流言仍X。PR83已交付O12-A自然/现金，本批不重做；整个O12与原43不关闭、不新增分母。仅静态交付，未运行测试、typecheck、编译、build、checker、诊断、schema校验、产品或示例，旧测试及历史food失败保留。

## 当前新增：固定驻城自然忠诚与现金褒赏（O12-A，2026-10-17）

[完整规则](docs/rules/personnel-loyalty-lifecycle.md)与[API](docs/engine/personnel-loyalty-lifecycle.md)：独立固定单城普通名单，CashReward实际扣每人100金/5AP、每旬一次、内部新政策5+roll5；AdvancePersonnelTurn自行判定季度入口、仁政/关系豁免、AL>25/义理野望/dislikes三分支及人心掌握/两次loss。真实byte0..255与UI100分离，true0仍消费其候选路径draw，true>100正常下降，99+9保留108。完整policy、共享新非零xorshift流、原子幂等及genesis/receipt/snapshot保存重算。见[政策](data/catalogs/personnel-loyalty-policies-v1.json)、[来源](docs/sources/personnel-loyalty-lifecycle.json)、[未运行场景](data/scenarios/personnel-loyalty-example-v1.json)。

现金5..9是明确不使用魅力/义理的新软件规则，与原作定性作用存在保真差异；旧+5/+8/+9日记已纠正为无印Sourcenext且有S/L选择偏差，不作PK分布证据。原global RNG/关系helper/writer与stock仍未证；不接登用ownership、工资/欠薪后果、俘虏或P078及所有依赖。仅O12-A有限软件服务，整个O12及原43不关闭；未新增或运行测试，未运行typecheck、编译、build、checker、诊断、schema校验、产品或示例，旧测试和历史food失败保留。

## 当前新增：已完成内政设施自动修复（O11-B，2026-10-17）

[完整具体规则](docs/rules/domestic-repair-lifecycle.md)、[API](docs/engine/domestic-repair-lifecycle.md)：固定单城/owner/可空太守与工兵、最多30座标准设施原始正HP、逐旬完整敌军位置，独立计算 `B=clamp(floor(9P/2),150,450)` 与无工兵 `floor(3B/20)` / 有工兵 `floor(3B/10)`，再实际cap写入、记录弃置和首次到满事件。只支持AdvanceRepairTurn与完整genesis保存重算；[来源与政策](docs/sources/domestic-repair-lifecycle.json)、[结构schema](docs/sources/domestic-repair-lifecycle.schema.json)、[未运行场景](data/scenarios/domestic-repair-example-v1.json)。

敌情为明确的设施中心两格注释派生政策，不等价于未恢复helper，也不是建设城心gate。工兵最终整数不能先floor再×2；22/45和67/135为纸面反例。目录仅给类型身份，maxHP供应；writer/事件为独立合同，无AP/金/XP或native副作用。城市港关同址指令冲突、堤坝、PK特殊楼、原版身份与全局组合仍开放，整个O11与原43不关闭。仅静态新增，未运行测试、typecheck、编译、build、checker、诊断、产品或示例；旧测试及历史food失败保留。

## 当前新增：标准设施建设与吸收（O11-A，2026-10-17）

[完整具体规则](docs/rules/facility-construction-lifecycle.md)、[API](docs/engine/facility-construction-lifecycle.md)：独立单城供应地块上的9类建设/5类吸收，实际扣费/占地腾地/人员预留/逐旬进度/完工TP与XP功绩、16组可组合具名政策、旧级效力与既有金粮核只读投影、完整genesis/命令/回执/snapshot重建。[政策与设施表](data/catalogs/facility-construction-policies-v1.json)、[来源](docs/sources/facility-construction-lifecycle.json)、[未运行场景](data/scenarios/facility-construction-example-v1.json)。

工作量与战斗HP分开，本模块不提供HP；初始work/调度/奖励writer是明确政策，功绩100/造币150冲突保留。本建设模块不覆盖维修；独立维修子域见上方O11-B。PK特殊楼、维修其余边界、全局组合与原生任务仍未完成；不称全部O11，原43不减。未运行测试、typecheck、编译、build、checker、诊断、产品或示例，旧测试未改，历史food失败保留。

## 当前新增：单城商人即时粮食交易（O10-B，2026-10-17）

[完整具体规则](docs/rules/city-merchant-lifecycle.md)与[API](docs/engine/city-merchant-lifecycle.md)：每城每旬一次、20AP、完整supplied两格敌情、UI相场3..7、政治20..100的12观测锚点与精确有理插值、买ceil/卖floor且仅卖侧4/5、整笔容量拒绝、行动/XP5、固定外部旬输入及AP20/0政策、完整genesis/receipt/finalstate重建。见[来源及完整政策](docs/sources/city-merchant-lifecycle.json)和[未运行场景](data/scenarios/city-merchant-example-v1.json)。

这是独立O10-B子域，不扩O04或O10-A；两批不等于全财政完成，原43不减。原交易135条listing存在，但三helper/raw byte尺度/native writer仍未闭合；经验与provisional政策不升级为native认证。未运行测试、typecheck、编译、build、checker、诊断、产品或示例，旧测试未改，旧food失败保留。以下原有“当前”与历史通过措辞按其原日期保留。

## 当前新增：有限单城财政（O10-A，2026-10-17）

固定owner与完整驻城有官薪名单、30设施和U16基础产值自行推导金粮，单旬推进、月金粮/季初治安/足额月薪/四类月特产顺序、独立库存cap与逐笔弃置、完整genesis/receipt/snapshot重算已补静态代码。见[完整具体规则](docs/rules/city-finance-lifecycle.md)、[API](docs/engine/city-finance-lifecycle.md)、[固定来源与全部政策](docs/sources/city-finance-lifecycle.json)、[未运行静态场景](data/scenarios/city-finance-example-v1.json)。不足薪资整旬拒绝，无俘虏/未知工资身份；每未来月丰作primitive必须明确提供。

这仅完成O10-A有限服务的代码/规则覆盖，不是全部财政或原生事务认证；O04/schema与旧核不改。所有者、payer/名单、稳定helper、实际writer/cap、随机带与调度均为provisional。原43不减。未运行测试、typecheck、编译、build、checker、产品、诊断或示例，未改旧测试；历史food全套失败未解决，历史通过数不验证本树。下面按主题保留以前交付导航和历史措辞，各自有限支持域仍以正文为准，不能当作本次运行结果。

## 普通话题牌独立舌战session（O09b，静态新增）

三类九种普通牌、显式有序牌带与occurrence token、智力3/4/5/6普通手牌、精确attack/power/damage/stress、旧话题算伤/非终局胜者更新话题与先手、HP终局优先、完整genesis/receipt保存重放见[完整规则](docs/rules/debate-topic-session-v1.md)、[API](docs/engine/topic-debate-session-v1.md)、[未运行五轮纸面设计](data/scenarios/topic-debate-example-v1.json)。非终局stress100整轮拒绝；五话术/四性格愤激/再考/人物/结束结算尚未完成。E15公式等级保留，新session仅固定现代转录子集，不是native认证；原43不减、P078及任务/归属/外交自动结算排除。没有运行测试、typecheck、编译、build、checker、产品、诊断或示例；旧测试及旧food失败保留。

## 普通单挑独立session（O09a，静态新增）

三方针Attack/Defense/Spirit、原始有界随机、Hit/Dodge/Block、HP/斗志writer、双计数、HP胜负/50合平局与genesis保存重放已补独立代码和[完整具体规则](docs/rules/duel-ordinary-session-v1.md)，见[API](docs/engine/ordinary-duel-session-v1.md)和[纸面场景](data/scenarios/ordinary-duel-example-v1.json)。仅普通子集；Fury/会心/必杀/装备/人物特例与舌战不在本模块。现代转录来源不是原生PC-PK/PK1.1认证，原43组未决主题不减；无P078/native人员任务链。本轮未运行测试、编译、build、checker、产品或诊断，历史通过数不覆盖本树，旧默认food失败仍保留。

## Ordinary diplomacy: gift, alliance and ceasefire

[Detailed rules](docs/rules/ordinary-diplomacy-service.md) and [API](docs/engine/ordinary-diplomacy-service.md): a standalone PK-era empirical service with exact rational thresholds, a force-pair relationship ledger, actual independent gold/AP settlement, explicit immediate-refund policy, single-xun ceasefire expiry and fully recomputed persistence. Dangerous failure is atomically unsupported; no native mission/person lifecycle or TP/merit/XP rewards. Named provisional policies and all evidence gaps remain visible. This addition has not been run or tested.

## Current engineering-rule navigation

- [PR1–71 game-rule coverage and detailed rule pages](docs/rules/historical-pr-rule-index.md): per-PR mechanisms, source/version limits, concrete service policies and full readable static catalogs. This is documentation coverage, not runtime validation or original-game equivalence.

- [Food consumption and manual supply](docs/engine/food-supply-lifecycle.md): delivered in merged PR #69; detached resource accounts and atomic, bounded transfers
- [Unit formation and capability panels](docs/engine/unit-formation.md): delivered in merged PR #70; pure specifications and inventory feasibility, without creating a runtime unit
- [City commands](docs/rules/city-command-lifecycle.md): delivered in merged PR #71; explicit service-policy patrol, recruitment and production lifecycle, with detailed formulas and resource rules
- [Technique research lifecycle](docs/rules/technique-research-lifecycle.md): independent 36-technique Start/Advance lifecycle with actual debits, automatic completion, explicit fallback timing and provisional reward policies; [API](docs/engine/technique-research-lifecycle.md) and [engineering API index](docs/engine/README.md). This addition has not been run or tested
- [PK ability research and officer cultivation](docs/rules/pk-ability-lifecycle.md): independent two-stage research/unlock/cultivation lifecycle with 48 base nodes and five explicitly selected hidden candidates; actual resource debits, three-category completion effects, use reservations, atomic turns and fully recomputed persistence. [API](docs/engine/pk-ability-lifecycle.md). Explicit guide/S1/provisional policies; static implementation only, not run or tested
- [Complete rule index](docs/rules/README.md) and [delivery/evidence status](docs/rules/STATUS.md)

PR #69/#70's prior validation belongs to their historical revisions. This final revision has only static review and has not been retested; the earlier default-suite food-file failure remains unresolved. See [validation status](docs/rules/city-command-lifecycle.md#validation-status). Historical candidate/unpublished wording below is retained in its original dated context and does not override these delivery entries. Service delivery does not certify original-game equivalence or close the original43 evidence groups.

## Detached terrain, status and empty-cell fire lifecycle

A finite supplied-map state machine with positive-troop terrain exposure, ordinary status effects, explicit turn boundaries and vacant-cell fire counters. Immutable transactions, bounded RNG tape, replaceable per-source policy, save/load and independently recomputed replay. See [API, examples and evidence boundaries](docs/rules/terrain-hazard-lifecycle.md). False-report retreat, occupied/burning-cell damage and lethal terrain are atomically rejected; original43 and P078 exclusions remain unchanged.

## Ordinary recruitment provisional decision

A standalone strict supplied-facts decision API with ordered empirical gates, exact-rational fallback and a newly specified deterministic FNV roll. Immutable replay receipts; no personnel effects or native equivalence claims. See [public usage and policy boundaries](docs/rules/ordinary-recruitment-policy.md). Original43 evidence groups unchanged; P078 and dependencies excluded.

## Supplied-map movement

Apply explicit paths on finite supplied maps with atomic budget/position updates, immutable receipts, and JSON replay. See [usage and policy boundaries](docs/rules/supplied-map-movement.md). Cost arithmetic follows the captured AL routine; the standard table is a replaceable guide reference, not a native map or end-to-end native movement claim.

2026-10-15 新独立候选：[每月特产兵装自动生产数量请求核](docs/rules/monthly-specialty-production.md)。逐equipment1..4、特产AL与30槽full-EAX捕获，独立政治AL；71条/256 bytes控制流重构，显式版本化comment-f32-rne-trunc算术政策。单次factor binary32存储，count8/政治80得到929，最后signed cap1500。没有writer/库存/owner/force/command/scheduler集成；不是stock/native认证，P0-78及依赖排除，旧43未决证据主题不减。当前树须全新验收/独审，历史通过数不验证本候选。

2026-10-14 新独立本地工程候选：[每月城市粮食harvest→levy参数叶](docs/rules/monthly-city-food-base-argument.md)，基于main `f6b6a31d587a8094fbba4b6fd27371288e3f3287`。仅连续无CALL的16条/35 bytes `[005905E0,00590603)`，当前EDI/EAX与独立晚期levy DWORD三个完整U32；先low32三倍再signed向零半减，后levy再向零半减，投影PUSH EDI位模式与signed视图。只补C2/C3已知规则工程债，原43不减；不假定helper保留EDI、不复用早期levy、不组合city或return-tail API，不接stack/writer/owner/force/scheduler/EndTurn。source-listing-reconstruction不认证stock/Vanilla/native。P0-78及依赖继续排除；正式新树验收/发布另记，历史PASS不验证本候选。

2026-10-14 新本地工程候选：[金钱/粮食据点收入返回尾部](docs/rules/base-income-return-tail.md)，基于已合并main `c508efac720574b17031ded707c052e19f3fb8d1`。双来源各66条/149 bytes只作身份核验，只投影15条/33 bytes返回叶段；捕获city callee返回EAX与后读type DWORD，零type原bits复制，任何非零raw type作signed32向零/5。完整U32输入，不自动调用city模块、不接owner/helper/ABI/writer/scheduler。仅部分补20%已知规则工程覆盖，原43组不减，P0-78及依赖排除。所有正式新树聚合/独审结果另记，以下历史通过数字不验证此候选；无外部发布。

2026-10-14 新独立工程候选：[城市粮食收入非Easy稳定已解析输入投影](docs/rules/city-food-income-projection.md)，基于PR #60已合并main `57a2f4dd34d0d888b23d1e46e2cb78402b91a7b4`。固定160条/494 bytes和16+22 bytes两表、30槽与4种统一类型行；军屯农保留U32乘积低位后unsigned /15000，最后signed32向零/100支持负返回；difficulty0整个Easy分支拒绝。只补已有规则的工程覆盖，原43组未决证据主题不减。来源仅source-listing-reconstruction，不认证stock/Vanilla、真实helper/ABI、原表、city/owner、writer或scheduler，P0-78及依赖排除。实现和全新验收仅本地；正式聚合及独审结果另记，以下历史通过数字不验证本树，旧城市金钱179原run/证据保持不动。

2026-10-13 新独立工程候选：[城市金钱收入稳定已解析输入投影](docs/rules/city-money-income-projection.md)，基于已合并PR #59 main `4824cfa124c573f2e2762396b85e0bcc8042d2da`。完整来源150条/437 bytes及16+21 bytes跳表，固定30槽、有效类型统一产量行、升级回退、限定造币、难度与晚期uint8治安；逐路径拒绝signed32中间乘法溢出，不将无界公式冒充原返回。属于已知规则的补充工程覆盖债，旧43组未决证据主题不减为42。不实现前置city/owner门槛、原查表/邻接helper、真实入账、完整财政/月度调度或P0-78及依赖；stock、原表和真实游戏执行仍open。本树须完成全新验收与独审，旧通过数不验证本树；以下旧候选文字为各自发布前历史记录。

# 三国志11规则研究与训练内核

2026-10-12 新独立工程候选：[俘虏自然逃亡roll参数纯整数核](docs/rules/captive-escape-roll-argument.md)，基于已合并PR #58 main `3db7dc80363454b56c2dd9d138ae285f50dadf29`。这是已有文档公式的来源绑定API，不是新概率发现：26条/77 bytes、入口BL/AL和晚期月份三个U8，完整0..255域参数最高108815，不clip100、不合并早期month gate、不接RNG/释放/状态/EndTurn。完整自然逃亡、getter/ABI、调度及stock仍open；00599AA0同期仅纠正“断粮人口”命名债。43组剩余是证据主题，非43个可直接实现的任务。原PR #58及之前各项已按各自边界交付；以下旧候选/通过数属历史记录，不验证本树。本候选全新验收与实际发布状态另记；P0-78及依赖新增实现继续排除。

2026-10-11 新独立候选：[征兵治安writer请求参数叶](docs/rules/recruitment-security-argument.md)，基于已合并PR #57 main d1e93ada18efa5f95c584afd9309b228f9391f0c。只接早期保存C与入口ESI的u32两标量，signed IDIV/NEG、规范+0；7条/19 bytes（含两push9条/21 bytes），不接写回/command、不复用数量输入、法治MOD隔离。实际征兵/治安损失、ABI/helpers/stock仍open；新验收另记，下方旧候选/最新数字不验证本树。P0-78及其依赖新增实现继续排除。

2026-10-11 当前新增候选：[征兵数量显式ST0逐调用投影](docs/rules/recruitment-quantity.md)，基于已合并PR #56 main `aa751399544b65390ecfd66750c1362bba95a389`。131条/373所列字节；最多19个EAX捕获与独立ST0字段，最多21次typed调用收据，保留全loop无效N=1000、先技能后FIMUL、super先pressure及容量二次getter/32位回绕。仅pure caller数值核，不等于完整征兵、实际入库或stock认证。本树新验收/独审/发布另记；下方旧“最新/本地候选”与验证数字属历史冻结记录，不验证本树。P0-78及其依赖新实现持续排除。


2026-10-11 新本地候选：[生产耗时caller整数投影](docs/rules/production-time.md)，基于PR #55 main `6a29c50`；完整138条/404所列字节与9调用点观测，保留type9、全无效9、负数向零减半和独立重复解析。返回内部整数，非真实日数或完整生产命令；本树单独验收与发布状态另记，P0-78及依赖排除。

2026-10-10 最新本地候选：[探索搜金caller整数投影](docs/rules/search-gold-caller.md)，基于已合并PR #54 main `cb76e148f35b519283cc296361b507674d0fff3a`。仅RNG返回后29条/82字节、逐调用点uint32观测与signed32分支；二轮getter仅裁剪时必填，不复用首轮，结果非实际奖励。人才PR #53、宝物参数PR #54已交付；以下旧“本地候选”及验收数字是各自历史冻结记录。本批新树单独验收、尚未发布；完整搜金/探索、RNG/helper/writer/stock仍open，P0-78及依赖排除。


新增本地候选：[探索宝物roll参数纯核](docs/rules/treasure-roll-argument.md)，基于已合并PR #53 main ec8baea；已选候选uint8价值，经trunc((61-value)/20)再最低1。公开listing 12条/38字节，止于RNG前；并非最终概率、候选选择或完整探索。新树验收另记，未发布。

主目标逐步复现PC-PK1.1，再单独恢复Vanilla；已证实规则、实测、工程替代和原作证据债分开记录。

当前可运行的是**虚构训练沙盒**：Train、限定EndTurn、训练资格、累计武力经验成长、状态检查、JSON存档与确定性重放。能连续推进时间，但没有AI、经济、战争、历史剧本或完整调度系统。Vanilla明确不支持。

## 运行

需要Node.js24.x与npm：

```sh
npm ci --ignore-scripts
npm run check
npm run demo
npm run demo:lifecycle
npm run play
npm run play -- --growth-fixture
```

`demo`完成气力40→100；`demo:lifecycle`从经验98推进十年（360旬）并验证完整存档重放；`--growth-fixture`在交互沙盒演示能力成长。满气力后训练仍拒绝，时间可以继续推进；没有额外添加刷经验规则。

累计XP每100贡献+1，最多3000，普通武力封顶100。默认source-profile算术可替换且带证据，尚未认证clean stock PK等价。保存默认`training-save.json`，不覆盖同名文件；v1需显式状态快照迁移，不静默改写旧trace。

交互命令支持用成对单引号或双引号包住整个参数，例如`save "存档目录/训练 存档.json"`、`load "存档目录/训练 存档.json"`（目录需已存在）。反斜杠按字面保留，不做shell展开；引号参数后必须空白或行尾，不支持部分参数拼接。命令的缺失、空或多余参数及未闭合引号会在执行前拒绝，空白行忽略。读档失败保留当前会话；输入结束会处理已收到的命令并等待存取档完成，无需额外输入`quit`。

- [探索发现人才基准数值核](docs/rules/search-talent-baseline.md)：005D1DF0公开listing重构；已过滤count0先返回0，眼力完整EAX非零返回100，否则min(count,5)、政治AL和同异州整数式，允许205；非最终概率，无native/RNG/探索命令集成，搜金/宝物仍open。本批仅本地候选
- [相性距离独立数值核](docs/rules/affinity-distance.md)：教程37条助记符的 `tutorial-source-projection`，双uint8已解析输入；`min(abs(a-b),150-abs(a-b))` 保留signed32、EAX位模式和AL，0/151返回-1与AL255，不取模或夹零。无opcode bytes，不认证stock/S1；该纯核原交付不接自然忠诚或登用caller，新O12-A另以显式software adapter复用，不改变旧证据等级；原批次验收记录不验证新模块
- [生产数量显式binary32限定核](docs/rules/production-quantity.md)：原88条/254字节与两套MOD隔离；signed32类型早返0/1，0..4精确三槽getter AL与完整skill EAX、显式倍率bitword，仅difficulty2才观察city virtual。先技能倍增、倍率后向零转换、再超级倍增；无9000cap，不以返回量代替实际库存增量。PR #51已合并交付，原发布前冻结文字不代表尚未交付
- [生产价格捕获输入整数核](docs/rules/production-price.md)：原45条/113字节，另列MOD6条/14字节独立；uint16已保存原价与特产helper完整uint32 EAX输入，仅AL非零才floor(8p/10)，EAX256不折、257折。无最低1，不捏造价格表/ID/helper/扣钱库存writer/命令/调度；PR #50已合并交付，其原发布前冻结文字不代表尚未交付
- [巡查治安增量限定数值核](docs/rules/patrol-security-gain.md)：稳定已解析1～3个uint8统率（首槽必有效）、城市byte与压力helper完整uint32 EAX；先总和/28+2、非零半减、严格>100上clip，允许负delta；原79条/204字节与另列MOD7条/21字节隔离。PR #49已交付；getter/helper/资格/扣费/writer/调度/stock及技巧点串接仍缺，不接入训练沙盒
- [内政建设速度限定数值核](docs/rules/domestic-construction-rate.md)：公开005BB1D0..2AA非星号路径，稳定已解析uint8政治与uint16设施耐久；最高政治+总和一半与除9耐久下界取高；完整工期/writer/进度/调度/getter/stock仍缺，不接入训练沙盒
- [自然忠诚候选静态纠错](docs/rules/natural-loyalty-candidate-boundary.md)：相性返回AL严格>25、低义理高野望、或004889E0非零三选一；俘虏绕过这组三条，相性教程投影另见上项，但教程与caller同源、native解析/其他callee/writer/RNG/stock仍缺。该历史静态批次没有新增忠诚runtime；新O12-A有限软件执行见顶部，不能提升旧证据等级
- [PK特技培育S1限定资格核](docs/rules/pk-skill-training-s1.md)：已进入类别2后的native signed32标量查询；有效相同目标不合格，另一已有特技不阻挡，越界目标保留helper零/caller一；不写状态、不映射攻略ID、不实现完成/费用/调度
- [PK五维培育限定数值核](docs/rules/pk-stat-training-s1.md)：S1资格XP<2000/成长低于目标，完成min(5,差)×100累计顶3000；两个纯函数分层，负差显式拒绝，完整命令/时长/使用数/隐藏RNG仍缺
- [PS2史实事件独立静态资料](docs/rules/ps2-historical-event-source-data.md)：64观测/64独立资料ID、741来源节点；59项条件与结果（含2仅接续）、4项仅条件、1项外链参照；24来源限制和PK归属未知保留，不执行事件
- [所选通用事件静态资料](docs/rules/generic-event-source-data.md)：Wiki31标题加游民2009两条观测，共33观测/31新资料ID；21空标题与10项未决问题保留，旧史实105/66/41不变，仅攻略转录
- [训练切片入口](docs/engine/pk-training-slice.md)
- [生命周期、配置、证据与迁移](docs/engine/pk-training-lifecycle.md)
- [45 个港关的静态所属城市](docs/rules/static-subordinate-bases.md)：10 关、35 港与全部 42 城计数逐项一致，保留来源、拼写转换和版本边界；仅补静态数据，三城未知开发分片不变
- [event9 live home getter与numeric building pointer](docs/rules/112-native-event9-home-getter.md)：004BA44C..45E direct live troop08、saved person signed homeBaseId与纯numeric building resolver；raw44=-1不是gate，不读building row/validity，25继承入口加1新direct；45E..46C reaction仍观察；最新main全新124/124命令通过；双IDB/1329 raw、8 probes及集成delta与终态独审通过
- [event9 saved-troop原生raw44 reset](docs/rules/111-native-event9-troop-reset.md)：004BA442..44C单次live troop validity及raw44=-1 direct store；早期saved EBX force身份不重算，24继承入口加1新direct，后续home/reaction44C..46C仍完整观察；最新main全新122/122命令通过；双IDB/1327 raw、6 probes及集成delta独审通过
- [event9 saved-force原生reset](docs/rules/110-native-event9-force-reset.md)：004BA432..442固定saved force身份、单次live validity及有序raw94/raw98写入；23继承入口加1新direct，442..46C reaction仍完整观察；最新main全新120/120命令通过；双IDB/1323 raw、10 probes及集成delta独审通过
- [event9原生展示决策](docs/rules/109-native-event9-presentation.md)：saved-force身份与live troop/force virtual48决策，22继承入口加1新direct；immutable-event支持域明确，展示与reaction仍分别观察；最新main 118命令集合经环境定点恢复通过（首轮117/118，原npm同配置重试仍SIGKILL，追加semi16后85/85）；双IDB/1317 raw区间、17 probes及集成独审通过
- [event9原生live部队选择](docs/rules/108-native-event9-selection.md)：saved-next heap-node遍历、live raw44/order/target与精确可变virtual查询；21继承入口加1新direct，presentation/reaction仍显式边界；最新main全新116/116命令、双IDB/1297 raw区间、18独审probe及集成delta独审通过
- [原生live位置与可变fallback](docs/rules/107-native-live-position.md)：base/troop/fallback pointer身份、后置DWORD读取及signed16坐标；新version/frame且无fallback默认值，旧API及其余缺口保留；114命令集合经定点恢复通过（首轮112/114），集成delta独审通过
- [原生部队成员判断](docs/rules/106-native-troop-membership.md)：live location、raw leader validity与两deputy成员；18入口、新troop frame、旧API及其余缺口保留；最新main112命令复验及集成delta独审通过
- [原生零退款tail距离](docs/rules/105-native-tail-distance.md)：同frame领土/源分离距离表、parent saved distance与live低byte写回；旧API及其余缺口保留；最新main110命令复验及集成delta独审通过
- [generic设施入口与早返](docs/rules/104-generic-facility.md)：004B40C0入口、87..16383原生共享frame归属与0/1返回；canonical续段及其余缺口保留；最新main108命令集合重试后通过（首轮107/108），集成delta独审通过
- [live零退款取消9/10/12/22](docs/rules/103-live-zero-refund.md)：同frame原生gate/control与live return；presentation和其余缺口保留；最新main106命令复验及集成delta独审通过
- [武将迁移与固定移动准备](docs/rules/102-officer-relocation.md)：同一frame内的迁移/cancel分派/保存值与live回读；ruler与troop/位置等边界明确；104命令复验及集成独审通过
- [据点归属、耐久与event9/10](docs/rules/101-base-ownership-events.md)：原生归属/耐久/flags与复制列表事件predicate；深层取消/部队反应显式观察；专项、102命令回归与独审通过
- [空军团分派、合并与raw reset](docs/rules/100-empty-legion-redistribution.md)：两方向merge、copied/live状态、精确写宽及S2额外熵；深层base/迁移保持显式边界
- [原生任务route与目标势力](docs/rules/99-return-route-target-force.md)：live任务参数/君主home、设施与领土/canonical势力链；source地图分开与旧API不变
- [原生roster/role排序与capacity](docs/rules/98-native-roster-sort.md)：真实比较调用序、重复节点/两轮过滤及S2可变hook；旧API不变
- [原生return/list/role与event8/14递归组合](docs/rules/97-recursive-officer-return.md)：独立上下文栈、live重读和单次原子提交；多节点sort/force/空军团仍有明确边界
- [共享frame的event8/14与handler/tail事务](docs/rules/96-mission-event-composition.md)：真实调用序、native saved locals、原子可变边界与后置observer；完整return/roles仍open
- [通知门与active-list/acted/零退款return尾审计](docs/rules/95-mission-notification-tail.md)：精确写序、可变observer与S2 query267；完整return/role/event组合仍open
- [event8/14任务监听审计](docs/rules/94-mission-event-listeners.md)：live任务/列表顺序、原生predicate/gate与可变tail观察；完整return/事件组合仍open
- [稳定军团/太守角色协调审计](docs/rules/93-legion-role-reconciliation.md)：不同排名、live身份写入与event8/14顺序；灭亡/空军团/完整监听仍open
- [武将返回字段/列表顺序审计](docs/rules/92-officer-return-finalizer.md)：home/location/rawlegion/bit9、真实troop gate与ruler defer；完整role/callback仍open
- [mission37完成/一步移动/延迟退款审计](docs/rules/91-return-mission-lifecycle.md)：active资格、源分离六邻城、先退款再清任务和到达direct acted0；完整return/scheduler仍open
- [能力培养任务取消审计](docs/rules/90-special-mission-cancellation.md)：41..43有序gate、98记录域、home通知与无所在地valid gate；完整回调仍open
- [设施任务取消/销毁字段/宝物42审计](docs/rules/89-facility-mission-cancellation.md)：0/38、raw写宽、城市byte/S2差异与home引用；完整销毁回调仍open
- [组任务取消/城市计数/研究字段审计](docs/rules/88-group-mission-cancellation.md)：2/5组ID序前三人、先字段后返回与S2研究扩展；完整回调仍open
- [六个零退款cancel handler来源审计](docs/rules/87-mission-cancellation-zero-refund.md)：精确gate、设施/城市子对象分离、字段顺序与独立v2重放；完整return/callback仍open
- [人员游离/末城逃逸/任务取消来源审计](docs/rules/86-personnel-detachment-source-profile.md)：在野目的地、人员/职务/事件顺序与来源隔离退款；完整force消亡/回调仍open
- [capture旧俘虏释放/迁移/排序来源审计](docs/rules/85-capture-relocation-source-profile.md)：P0-50 v1有界前置释放与非瞬移投影；后续在野/取消部分投影见P0-51
- [capture城兵容量/人员分组/处分来源审计](docs/rules/84-capture-personnel-source-profile.md)：独立有界人员投影，未覆盖完整迁移与AI处分
- [capture caller/完整候选/有界事务来源审计](docs/rules/83-capture-transaction-source-profile.md)：独立Python参考模型与重放，未接入沙盒战斗
- [训练gate/reset/累计经验来源审计](docs/rules/82-training-lifecycle-source-profile.md)
- [规则总索引](docs/rules/README.md) · [当前研究状态](docs/rules/STATUS.md) · [待办与证据债](TODO.md)

每个接受命令保留完整前后状态、算术、实际奖励/裁剪和来源证据。原发言武将随机选择仍被省略，核心零随机调用不等于原游戏全局随机流一致。

- [独立耗粮与手动补给资源会话](docs/engine/food-supply-lifecycle.md)：实际库存消费/不足、手动金粮兵及匹配兵装守恒转移、两种显式气力取整政策，提供不可变预览/原子提交/严格保存加载重放。18000兵阵覆盖耗粮1499；零兵保留资源账户，不执行饥饿掉兵、原生部队生命周期、移动到达或任务终结

- [独立编成与能力面板](docs/engine/unit-formation.md)：1–3人成员五维/六适性、12兵装与状态/技术、完整可替换profile、库存可行性预览、不可变单位规格及规范保存/重放。固有容量与来源限制分离；不创建runtime部队、不迁移人员或扣账，原43及原作证据边界保留

### Standalone city-command lifecycle

[API and evidence limits](docs/rules/city-command-lifecycle.md) cover atomic patrol/recruitment/quantity production, reserved piece production across service turns, and independent canonical save/replay. The existing scalar kernels are reused; eligibility, writer semantics, scheduling and full versioned policy snapshots are explicit service choices. Run the complete primitive example with `node apps/text/city-command-demo.mjs`. This does not change the legacy training state or close the original evidence gaps. This revision has not been retested; the earlier default-suite food-file failure remains unresolved, as recorded in the [validation status](docs/rules/city-command-lifecycle.md#validation-status).

## 独立官职分配服务

已提供80有名官职的单职selector、多职plan和独立状态原子apply；10个君主爵位元数据分离，fill保留既任、显式rebuild可重新分配，保存/回放按请求重算。评分来源与资格/调度工程政策分层；entry80和原生资格/调度/writer仍open。

- [完整官职规则与80行表](docs/rules/office-assignment-service.md)
- [API、原子提交及持久化](docs/engine/office-assignment-service.md)
- [静态使用情景](data/scenarios/office-assignment-example-v1.json)

本次仅静态代码/文档交付，未执行测试、typecheck、build、编译、checker、产品或诊断；旧测试不增删。
