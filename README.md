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
- [相性距离独立数值核](docs/rules/affinity-distance.md)：教程37条助记符的 `tutorial-source-projection`，双uint8已解析输入；`min(abs(a-b),150-abs(a-b))` 保留signed32、EAX位模式和AL，0/151返回-1与AL255，不取模或夹零。无opcode bytes，不认证stock/S1，不接自然忠诚或登用caller；本批全新重建，验收另记
- [生产数量显式binary32限定核](docs/rules/production-quantity.md)：原88条/254字节与两套MOD隔离；signed32类型早返0/1，0..4精确三槽getter AL与完整skill EAX、显式倍率bitword，仅difficulty2才观察city virtual。先技能倍增、倍率后向零转换、再超级倍增；无9000cap，不以返回量代替实际库存增量。PR #51已合并交付，原发布前冻结文字不代表尚未交付
- [生产价格捕获输入整数核](docs/rules/production-price.md)：原45条/113字节，另列MOD6条/14字节独立；uint16已保存原价与特产helper完整uint32 EAX输入，仅AL非零才floor(8p/10)，EAX256不折、257折。无最低1，不捏造价格表/ID/helper/扣钱库存writer/命令/调度；PR #50已合并交付，其原发布前冻结文字不代表尚未交付
- [巡查治安增量限定数值核](docs/rules/patrol-security-gain.md)：稳定已解析1～3个uint8统率（首槽必有效）、城市byte与压力helper完整uint32 EAX；先总和/28+2、非零半减、严格>100上clip，允许负delta；原79条/204字节与另列MOD7条/21字节隔离。PR #49已交付；getter/helper/资格/扣费/writer/调度/stock及技巧点串接仍缺，不接入训练沙盒
- [内政建设速度限定数值核](docs/rules/domestic-construction-rate.md)：公开005BB1D0..2AA非星号路径，稳定已解析uint8政治与uint16设施耐久；最高政治+总和一半与除9耐久下界取高；完整工期/writer/进度/调度/getter/stock仍缺，不接入训练沙盒
- [自然忠诚候选静态纠错](docs/rules/natural-loyalty-candidate-boundary.md)：相性返回AL严格>25、低义理高野望、或004889E0非零三选一；俘虏绕过这组三条，相性教程投影另见上项，但教程与caller同源、native解析/其他callee/writer/RNG/stock仍缺，不新增忠诚runtime
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
