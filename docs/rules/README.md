> 最新capture人员/城市容量来源与有界模型：[P0-49](84-capture-personnel-source-profile.md)；完整人员迁移、AI处分和stock等价仍开放。

新增[P0-77 event9 live home getter](112-native-event9-home-getter.md)：004BA44C..45E direct troop08、live leader/saved person signed homeBaseId与numeric building pointer；raw44=-1非gate，不读building row/validity，26入口，presentation与45E..46C reaction继续观察；最新main全新124/124命令、28 model、25 source及继承链、双IDB/1329 raw和8 probes通过；2184文件/index全程一致，集成delta与终态独审通过。

新增[P0-76 event9 saved-troop原生raw44 reset](111-native-event9-troop-reset.md)：004BA442..44C单次saved troop live validity及raw44=-1 direct store；saved EBX force保持，25入口，presentation与44C..46C home/reaction继续观察；最新main全新122/122命令、34 model、20 source及继承链、双IDB/1327 raw和6 probes通过；2146文件/index全程一致，集成delta独审通过。

新增[P0-75 event9 saved-force原生reset](110-native-event9-force-reset.md)：004BA432..442固定saved force、单次live validity、有序raw94/raw98 direct stores；24入口，presentation与442..46C reaction继续观察；最新main全新120/120命令、34 model、17 source及继承链、双IDB/1323 raw和10 probes通过；1954文件/index全程一致，集成delta独审通过。

新增[P0-74 event9原生展示决策](109-native-event9-presentation.md)：saved force与live owner分离、原序可变virtual48/08决策；23入口和明确immutable-event域，presentation/reaction仍两段观察，temporary lifetime未闭合；最新main 118命令集合定点恢复后通过（首轮117/118，两次npm SIGKILL保留，semi16新配置通过）；42 model、26 source及继承链、双IDB/1317 raw和17 probes、集成delta独审通过，1766文件/index全程一致。

新增[P0-73 event9原生live部队选择](108-native-event9-selection.md)：saved-next heap-node遍历与live raw44/order/target，完整可变virtual effect-query；21继承加1新direct，presentation/reaction仍边界，engine预算非原作规则；最新main全新116/116命令、21+21+17/12/13 source、39 model、双IDB/1297 raw区间及18既有独审probe通过；1583文件/index冻结一致，集成delta独审通过。

新增[P0-72原生live位置与可变fallback](107-native-live-position.md)：base/troop/fallback pointer身份与后置DWORD读取、signed16坐标及fast path；显式新frame无fallback默认值，旧API及unknown债保留；21+17/12/13组source、32组model、双IDB及17组既有独审probe通过；114命令集合经定点恢复通过（首轮112/114），两次文件/index冻结分别核验，集成delta及单metadata pin例外独审通过；不是单轮全绿。

新增[P0-71原生部队成员判断](106-native-troop-membership.md)：live location、leader raw validity、signed deputy<1100与原生成员匹配；18入口/新troop frame，旧API和unknown边界保留；17+12/13组source、31组model、双IDB及8组既有独审probe通过；最新main全新112/112命令通过，文件/index冻结一致，集成delta独审无阻断。

新增[P0-70原生零退款tail距离](105-native-tail-distance.md)：同frame领土/源分离距离表、parent saved distance与live validity低byte写回；零新增原始机器码字节，旧API及其余证据债保留；12+13组source、29组model、双IDB及8组既有独审probe通过；最新main全新110/110命令通过，文件/index冻结一致，集成delta独审无阻断。

新增[P0-69 generic设施入口与早返](104-generic-facility.md)：004B40C0入口、generic87..16383共享frame归属与明确0/1结果；canonical完整观察及其余证据债保留；13+13组source、28组model、双IDB、9组既有独审probe通过；108命令集合经重试全过（首轮107/108，lifecycle以512MiB old-space上限重试成功，137原因未确认），集成delta独审无阻断。

新增[P0-68 live零退款取消9/10/12/22](103-live-zero-refund.md)：同frame gate/control与live return，精确presentation观察及其余证据债保留；13组source、28组model、双IDB和最新main106命令复验及集成delta独审通过。

新增[P0-67武将迁移与固定参数移动准备](102-officer-relocation.md)：004A8270、取消分派和004A7990原生组合，旧API不变；两个officer-relocation检查覆盖来源/模型，最新main104命令复验及集成独审通过。

新增[P0-66据点归属、耐久与event9/10](101-base-ownership-events.md)：归属/耐久/flags与源分离事件predicate，深层handler及部队反应保持明确可变边界。20项source、23项model与102命令全回归及独审通过；运行两项base-ownership检查。

# 三国志11规则总索引

> 目标：建立可直接驱动规则引擎的《三国志11》规则规范，并严格区分无印（Vanilla）与威力加强版（PK）。
> 更新日期：2026-10-07 UTC。

## 最新审计入口

新增[PS2史实攻略独立资料](ps2-historical-event-source-data.md)：64观测/64独立ID、741来源节点；59条件结果（2仅接续）、4仅条件、1外链参照，保留24来源限制、PK归属未知及原生/运行时证据债。本次恢复数据后采用全新验收，不复用丢失的旧日志。

新增[所选通用事件攻略静态资料](generic-event-source-data.md)：Wiki31标题加游民2009两条，共33观测/31新资料ID；21空标题与10项未决问题保留，无引擎执行，旧史实105/66/41字节不变。

此前PR #42总表对账基于PR #36–41合并基线 `6095cc0cb16249988fbdbbdceb714441dba9efc0`。已交付：[港关静态所属](static-subordinate-bases.md)、[PK能力研究攻略树](15-pk-ability-research.md)、[所选史实资料](historical-event-source-data.md)，以及[训练沙盒CLI/私有重放/adapter证据合同](../engine/pk-training-lifecycle.md)修正。具体已交付/仍缺/下一证据见[STATUS](STATUS.md)与[缺口总表](../../缺少的数据.md)。

这些资料和工程修正没有扩成完整游戏：研究/史实执行、三城null分片、40,000格地图、原剧本数据、clean-stock/跨版本/全局RNG/运行时仍有缺口。训练gate/reset已有source-profile证据；战斗与计略的实测公式不提升成stock opcode-exact。P0-78及依赖capture/force/native事务的工作不在本轮；下方历史审计数字和冻结证据不变。

[港关静态所属城市](static-subordinate-bases.md)：45 个唯一据点（10 关、35 港）对应既有 42 城，逐行来源及所有城市数量一致；社区来源版本边界明确，三城开发分片仍未知，不涉及动态归属或事件执行。

新增[100-empty-legion-redistribution.md](100-empty-legion-redistribution.md)新增独立版本，展开空军团primary/nonprimary分派、source/destination合并方向、完整两次roster复制、live据点扫描与人员迁移调用、raw44-byte reset。primary fallback丢弃ordinal查找值而直接使用global ID2..8的原生控制流保留；nearest距离与S1/S2 RNG分开，S2三次共享页读要求逐调用观察。004AD550/004A8270仍是明确可变深层边界，force灭亡仍atomic defer；旧API、stock/Vanilla/全局RNG边界不变。`python scripts/check_empty_legion_source.py`、`python scripts/check_empty_legion_profile.py`。

新增[99-return-route-target-force.md](99-return-route-target-force.md)新增独立版本，直接执行005BA320任务分派/arg0与arg1/目标force君主live home/可选territory输出，以及00487EB0设施raw owner、领土city和canonical subtype势力链。两源地图byte分别固定，完整原生getter不再用whole-route/target-force观察；真实外部作用仍绑定full frame/callStack/RNG。新force rulerId和legion forceId与valid严格派生，旧API/trace不变。source未改表/固定vtable/不别名输出与可读map域明确；force灭亡/空军团/ruler/base/capture、其他event、stock/Vanilla/全局RNG仍open。`python scripts/check_return_route_target_force_source.py`、`python scripts/check_return_route_target_force_profile.py`。

新增[P0-63原生roster/role排序与capacity](98-native-roster-sort.md)：固定field0 key链、两种quicksort/一种merge、按实际比较序live读与两轮allocated筛选；capacity分别执行S1/S2标量路径，query377/278保留全frame/RNG可变观察。`python scripts/check_native_roster_sort_source.py`、`python scripts/check_native_roster_sort_profile.py`；旧API不变，一般flags/vtable、route/force/capture/stock继续open。

新增[P0-62原生return/list/role递归组合](97-recursive-officer-return.md)：每调用context stack保存native locals，正常非空角色event直接回到dispatcher/handler/return；count<2 sort闭合，多节点sort/route/target-force明确可变观察；灭亡/空军团/ruler路径原子defer。`python scripts/check_recursive_officer_return_source.py`、`python scripts/check_recursive_officer_return_profile.py`。

新增[P0-61共享frame单事务event8/14组合](96-mission-event-composition.md)：dispatcher直接调用已知handler/notification/return-tail primitives，保留copied/live/native saved locals，再执行004BA1D0空分支与fresh post-event observer。全部unknown边界可变观察或原子拒绝，旧API不变；完整return/list/role仍next。`python scripts/check_mission_event_composition_source.py`、`python scripts/check_mission_event_composition_profile.py`。

新增[P0-60通知门与零退款return尾](95-mission-notification-tail.md)：canonical通知资格、saved-pointer presentation、acted/dirty/可变observer/active尾追加/期间写序及S2 mutable query267。旧API不变，完整return/role/event待新版本组合。`python scripts/check_mission_notification_tail_source.py`、`python scripts/check_mission_notification_tail_profile.py`。

新增[P0-59 event8/14任务监听](94-mission-event-listeners.md)：44slot注册、live列表/任务分派、23/8与24/14 predicate及handler gate；成功tail用完整阶段观察或原子拒绝，绝不默认非干预。完整return/角色/后置observer仍open。`python scripts/check_mission_event_listener_source.py`与`python scripts/check_mission_event_listener_profile.py`。

新增[P0-58稳定非空军团/太守角色协调](93-legion-role-reconciliation.md)：独立004BE2A0稳定分支与004BCA30(refresh=0)，不同比较器、原roster顺序、live身份变化与event8/14阶段账本；完整监听/force/返回组合仍open。`python scripts/check_legion_role_source.py`与`python scripts/check_legion_role_reconciliation_profile.py`。

新增[P0-55能力培养任务取消](90-special-mission-cancellation.md)：41..43有序actor/建筑/98培养记录gate，无actual-location valid gate；home通知与troop/home=-1边界、独立原子API及重放。完整return/callback和stock仍open。`python scripts/check_special_mission_cancellation_profile.py`与`python scripts/check_special_mission_cancellation_evidence.py`。

新增[P0-54设施任务取消/销毁字段/宝物42](89-facility-mission-cancellation.md)：0/38 gate与返回、raw0x38精确写宽、S1/S2城市byte表差异、allocated-person home引用；base销毁及完整回调仍open。`python scripts/check_facility_mission_cancellation_profile.py`与`python scripts/check_facility_mission_cancellation_evidence.py`。

新增[P0-51人员游离/末城逃逸/任务取消](86-personnel-detachment-source-profile.md)：004BA520有向distance1候选与RNG阶段、004BBB00局部role写回及event时序、invalid-former/last-city入口、44项cancel注册分流及有界退款。S1/S2金cap和acted hook明确分离。`python scripts/check_personnel_detachment_profile.py`、`python scripts/check_mission_cancellation_profile.py`。完整force消亡/监听回调/其他专用取消仍open。

新增[P0-50旧俘虏释放/迁移/稳定排序](85-capture-relocation-source-profile.md)：前置链序、返回原势力、目的地分层/距离同分RNG、非瞬移actual-location语义、缺席home-roster与身份rank排序。有界独立投影、defer/reject与事件时序，`python scripts/check_capture_relocation_profile.py`。126范围/63对照；P0-50 v1未投影004BBB00/资源，后续P0-51另模块恢复部分范围；完整AI/force回调和clean stock仍open。

新增[P0-48 capture transaction](83-capture-transaction-source-profile.md)：完整有序世界候选、三caller cause/mode、normal/neutral scalar finalizer、普通入城资源与耐久投影、显式fallback及重放。`python scripts/check_capture_transaction_profile.py`。61个来源范围、24组S1/S2对照；source字节不等于stock证明，完整人物/force/事件链仍open。独立参考模型，未接入训练沙盒战斗。

新增运行入口：[PK训练生命周期v2](../engine/pk-training-lifecycle.md)。资格/行动重置/旬推进/累计WAR成长、显式迁移与十年重放；非完整游戏。`npm run check`、`npm run demo:lifecycle`。新增[P0-47 source审计](82-training-lifecycle-source-profile.md)与`../sources/training-lifecycle-source-profile.json`；两MOD关联样本明确分离，stock等价/完整scheduler和Vanilla仍open。

[当前审计总表](17-post-15-source-audit.md) · [状态](STATUS.md) · [P0-46据点陷落selector来源](81-capture-selector-source-profile.md) · [P0-2外交版本边界](37-diplomacy-version-boundaries.md)。

P0-46已恢复公开IDB的capture caller/候选/selector字节，但其输入路径含“血色5.0公测”。`opcode-exact`限定source profile/hash，stock PC-PK1.1仍open；PK采用为`compatibility-reconstruction`，Vanilla另为`compatibility-assumption`，主机版独立open。

A1–E2原审计全文和旧STATUS分别完整保存在 `audit-history/`，原blob复用，无历史段落丢失。历史快照不是当前进度指针。

相同平台/版本的面板规则，E3的明确分项运算优先于旧总规则或旧对照表中的宽泛缩写。E2的人物合成继续由 `04-military.md` 管理，E3静态参数在 `../sources/unit-panels.json`。参考校验命令：`python scripts/check_unit_panels.py`；该脚本不是原游戏EXE测试。

E4训练与气力以 `19-training-morale.md` 为当前专项规范；参考校验命令为 `python scripts/check_training_morale.py`。该脚本只验证解出的整数表达式与测试向量，不代替原游戏EXE回归。

E5兵粮消耗以 `20-food-consumption.md` 为当前专项规范；参考校验命令为 `python scripts/check_food_consumption.py`。粮尽逃兵仍保持实测层，不因基础耗粮公式已恢复而自动升级。

E6补给与输送以 `21-supply-transport.md` 为当前专项规范；参考校验命令为 `python scripts/check_supply_transport.py`。脚本只验证已确认的容量约束与气力加权样例，不代替尚未恢复的PC finalizer。

E7技巧系统以 `22-techniques.md` 为基础规范，结构化表为 `../sources/techniques.json`。E8版本差异以 `23-technique-patch-differences.md` 和 `../sources/technique-version-deltas.json` 覆盖；实现时必须区分 `rulesetVersion + patchVersion + fixProfile`，社区修复不得静默覆盖 fidelity。校验命令分别为 `python scripts/check_techniques.py` 与 `python scripts/check_technique_patch_profiles.py`。

E9兵粮袭击见 `24-food-raid.md`；E10应射以 `25-response-fire.md` 为当前专项规范，结构化证据为 `../sources/response-fire.json`，兼容判定校验命令为 `python scripts/check_response_fire.py`。

E11技巧研究时间以 `26-technique-research-time.md` 为当前专项规范，结构化证据为 `../sources/technique-research-time.json`；只保存已知阈值/锚点与人才府精确修正，不填满未知矩阵。

E12技巧研究完成功绩以 `27-technique-research-merit.md` 为当前专项规范，结构化冲突证据为 `../sources/technique-research-merit.json`。现行500/1000/2000/3000仅是当前Wiki候选，早期500/1000/1500/2500同时保留；Lv3/Lv4的PC-PK1.1 exact值不得冒充已确认。

E13混乱/伪报持续与恢复以 `28-status-duration-recovery.md` 为当前专项规范，结构化证据为 `../sources/status-duration-recovery.json`。PC-PK1.1自然恢复已确认是确定性倒计时：普通每旬-1、合资格阵系范围-2、到0恢复；普通计略初始duration和重复施放刷新语义仍保持open。

E14单挑连续公式以 `29-duel-continuous-formulas.md` 为当前专项规范，结构化证据为 `../sources/duel-continuous-core.json`。PC-PK导向通用核心已闭合武力→actionRatio→Hit/Dodge/Block→伤害→斗志链；人物隐藏补正与Vanilla/主机版差异继续open。

E15舌战普通牌心理伤害以 `30-debate-psychological-damage.md` 为当前专项规范，结构化证据为 `../sources/debate-psychological-damage.json`。牌力只决定胜负，心理伤害另走智力attack×牌等级×话题系数×愤激系数；大喝、诡辩、无视/镇静/激昂边界已拆开。

E16非骑战法来源的负伤/战死以 `31-non-cavalry-casualty-sources.md` 为当前专项规范，结构化证据为 `../sources/non-cavalry-casualty-sources.json`。普通击破统一伤亡roll已撤回；弩系狙伤、猛者、业火、骑兵与单挑按来源分流。

E17地形伤害随机值以 `32-terrain-hazard-damage.md` 为当前专项规范，结构化证据为 `../sources/terrain-hazard-damage.json`。栈道100～299/格与毒泉200～399/格已源码级闭合；落石专用参数与踏破×0.1已恢复，但common50 finalizer仍open。

E18普通君主继承以 `33-ruler-succession-priority.md` 为当前专项规范，结构化证据为 `../sources/ruler-succession-priority.json`。历史事件、玩家普通死亡、COM自动继承三路已分离；COM血缘>义兄弟>配偶>年长者为empirical-high，组内tie与004B9080函数体仍open。

E19评定完整提案池以 `34-council-proposal-pool.md` 为当前专项规范，结构化证据为 `../sources/council-proposal-pool.json`。原版评定MSG恢复22类具体案和两阶段多选采决；chooser、参与者过滤与采纳案执行链仍open。

E20委任AI权重/决策架构以 `35-delegated-ai-architecture.md` 为当前专项规范，结构化证据为 `../sources/delegated-ai-architecture.json`。统一utility表假设已撤回；战争AI恢复为hard gate+概率+局部selector的procedural架构，城市内政scheduler仍open。

P0-1普通登用概率exactness以 `36-hiring-probability-exactness.md` 为专项记录，结构化证据为 `../sources/hiring-probability-exactness.json`。004AFD60外层与normal/nonzero模式已源码级收窄；005C4F80本体仍open，现代SIRE登用意愿公式已隔离为MOD-only。

P0-2外交公式版本边界以 `37-diplomacy-version-boundaries.md` 为专项记录，结构化证据为 `../sources/diplomacy-version-boundaries.json`。Vanilla 1.1友好度与1.2外交成功率补丁边界已官方锁定；现有完整公式绑定PK-era corpus，Vanilla复用必须标compatibility assumption。

P0-3攻城统一公式与据点接管资源以 `38-siege-capture-exactness.md` 为专项记录，结构化证据为 `../sources/siege-capture-exactness.json`。城兵共用005ADC30、耐久外层链与004B329B资源最低5%保留已收窄；005ADDC0/005ADE20内部函数体仍open。

P0-4火焰持续/自然蔓延以 `39-fire-lifetime-spread-exactness.md` 为专项记录；会心持续+1与自然邻格蔓延关闭已固定，基础寿命RNG仍open。

P0-5登场/自然死亡以 `40-debut-death-exactness.md` 为专项记录，结构化证据为 `../sources/debut-death-exactness.json`；月初`005833D0`入口、史实/假想登场与寿命模式语义已收紧，内部死亡函数仍open。

P0-6非自然忠诚变动以 `41-nonnatural-loyalty-exactness.md` 为专项记录，结构化证据为 `../sources/nonnatural-loyalty-exactness.json`；PC-PK月俸整笔支付/整笔不支付事务已闭合，褒赏增量与流言目标/掉忠函数仍open。

P0-7俘虏释放以 `42-captive-release-exactness.md` 为专项记录，结构化证据为 `../sources/captive-release-exactness.json`；资金不足释放人数与 comparator/list/finalizer 架构已闭合，`0058C320` 排序语义、主动释放技巧P exact 与各 release path 的禁仕 side effect 仍open。

P0-8自动官职 selector 以 `43-auto-office-selector-exactness.md` 为专项记录，结构化证据为 `../sources/auto-office-selector-exactness.json`；`005FAF00` 单官职评分和同分 first-wins 已闭合，并纠正 `005FA650` 为 office classifier；caller 列表顺序和多官职 scheduler 仍open。

P0-9部队资源事务以 `44-troop-resource-transaction-exactness.md` 为专项记录，结构化证据为 `../sources/troop-resource-transaction-exactness.json`；战斗/输送容量与draft函数边界、transport普通兵装100000上限及resource primitives已收紧，原commit/return finalizer仍open。

P0-10主副将关系/FPU取整以 `45-deputy-rounding-exactness.md` 为专项记录，结构化证据为 `../sources/deputy-rounding-exactness.json`；`00707A74` 已识别为MSVC `_ftol2`，正值最终floor闭合；普通/亲爱PC指令精确，血缘/3仍保留PC opcode gap。

P0-11训练/气力以 `46-training-morale-exactness.md` 为专项记录，结构化证据为 `../sources/training-morale-exactness.json`；训练gate边界、每回合一次cadence及`0059A230`野外恢复local handler已收紧，reset/top scheduler xref仍open。

P0-14技巧研究时间以 `49-technique-research-time-exactness.md` 为专项记录，结构化证据为 `../sources/technique-research-time-exactness.json`；`005D7DD0` calculator、人才府-20日/最低10日已收紧，完整难度矩阵仍open。

P0-15技巧研究完成功绩以 `50-technique-research-merit-exactness.md` 为专项记录，结构化证据为 `../sources/technique-research-merit-exactness.json`；`005D8F68` 仅锁定研究命令/AP路径，公开逆向功绩地址表未暴露研究完成常量，因此Lv3/Lv4两套表冲突继续open，禁止伪造Vanilla→PK改值。

P0-16兵粮袭击caller以 `51-food-raid-caller-exactness.md` 为专项记录，结构化证据为 `../sources/food-raid-caller-exactness.json`；防御技能将兵损置0后 caller 仍调用 `005ADB20`，food raid 与 troop damage 字段分离；helper 内部RNG与资源裁剪仍open。

P0-17应射/连击方向性以 `52-response-fire-double-strike-exactness.md` 为专项记录，结构化证据为 `../sources/response-fire-double-strike-exactness.json`；`00586E12` 明确压掉主动方对弩兵间接攻击的连击，`00586F0F` 明确支援攻击不连击且战法失败后的普通攻击仍可连击；还射自身连击保持empirical-high，完整`00584DC8` caller仍open。

P0-18火焰寿命setter边界以 `53-fire-lifetime-setter-boundary.md` 为专项记录，结构化证据为 `../sources/fire-lifetime-setter-boundary.json`；`00486320/00495CA0` 只确认着火状态查询，未恢复寿命setter/reignite helper，`00599CF0` 继续不能冒充火焰ticker。

P0-19登场/自然死亡生命周期层级以 `54-death-lifecycle-layer-boundary.md` 为专项记录，结构化证据为 `../sources/death-lifecycle-layer-boundary.json`；月初`005833D0`、`0048A000 GetDeathYear`、`00489160 IsMarkedForDeath`、HealthLevel与最终DEAD identity分层确认，内部transition仍open。

P0-20俘虏 forced-release 排序/裁剪以 `55-captive-forced-release-ordering-boundary.md` 为专项记录，结构化证据为 `../sources/captive-forced-release-ordering-boundary.json`；`0058C320` comparator 先经 `004AA200` 一次排序，`004A8E10` 再以无索引参数固定缩减列表，直到恰好 releaseCount；comparison key 与删头/删尾仍open。

P0-21现金褒赏忠诚以 `56-cash-reward-loyalty-boundary.md` 为专项记录，结构化证据为 `../sources/cash-reward-loyalty-boundary.json`；`005B5D60` 为执行 containing function，`0048A770 SetLoyalty(0..255)` 与 `004A6CF0 ModifyPersonLoyalty(delta)` 证明 true loyalty 与UI100分层；增量RNG/魅力/义理公式仍open。

P0-22欠薪忠诚以 `57-salary-shortfall-loyalty-boundary.md` 为专项记录，结构化证据为 `../sources/salary-shortfall-loyalty-boundary.json`；`0058D5E0` 逐欠薪据点准备并写入跨据点累计容器，`0058C190` 在全部设施扫描后统一finalize；selector与每人掉忠公式仍open。

P0-23流言 effect helper 以 `58-rumor-effect-helper-boundary.md` 为专项记录，结构化证据为 `../sources/rumor-effect-helper-boundary.json`；流言成功率函数在`005D05AD`前返回，随后`005D05B0`与`005D05F0`是两个独立函数，确认 success 与 effect 分层；目标筛选、逐人掉忠与治安下降的角色分配仍open。

P0-24宝物授予/没收忠诚以 `59-treasure-loyalty-opcode-boundary.md` 为专项记录，结构化证据为 `../sources/treasure-loyalty-opcode-boundary.json`；TreasureValue `+0x3C`、宝物owner/city setter、state setter与`004A6CF0 ModifyPersonLoyalty`独立，确认ownership/state mutation与loyalty side effect分层；gain=value与没收-30仍非opcode exact。

P0-25普通登用成功率签名以 `60-hiring-success-rate-signature-boundary.md` 为专项记录，结构化证据为 `../sources/hiring-success-rate-signature-boundary.json`；`005C4F80` 精确签名为 `(targetPtr, executorPtr, mode, dateKey)`，忠诚/魅力/相性差并非显式标量参数；`005BA4C0` 的7个deterministic输入与success-rate函数输入已明确分层。

P0-12阵系耗粮/粮尽以 `47-food-overlap-starvation-exactness.md` 为专项记录，结构化证据为 `../sources/food-overlap-starvation-exactness.json`；阵/砦/城塞单一selector、float32常量与不叠乘已闭合，overlap winner与starvation原函数仍open；旧0.76降为legacy-only。

P0-13补给/输送finalizer以 `48-supply-transport-finalizer-exactness.md` 为专项记录，结构化证据为 `../sources/supply-transport-finalizer-exactness.json`；`004BF522` 已归入 `sub_4BF1F0`，到达满仓overflow丢弃行为与野外补给target-cap语义已收紧，troop气力非整除rounding和field-supply finalizer仍open。

## 版本标记

- `[COMMON]`：无印与 PK 共通。
- `[VANILLA]`：仅无印，或无印数值/行为与 PK 不同。
- `[PK]`：仅威力加强版新增或改变。
- 平台（PC / PS2 / Wii）有差异时单独标注。
- 少数 PC 规则还存在补丁差异（例如 Ver1.0 与后续版本），需额外记录 `patchVersion`。

## 证据等级

- **已证实**：游戏数据、官方/准官方资料，或多个可靠来源互证。
- **实测可信**：长期玩家实测/攻略 Wiki 结果稳定，但未取得内部公式。
- **临时采用**：原作机制存在，但精确内部公式未知；为引擎闭环采用确定性规则，必须和原作事实分开。
- **缺静态数据**：规则明确，但尚缺完整地图、剧本等数据文件。
- **参考模型已验证**：数据/参考算法通过测试，不等于已对原游戏EXE或存档完成验证。

## 模块

1. `00-turn-scenario.md` 时间、回合、难度、势力行动顺序、剧本
2. `01-map.md` 六角地图、地形、移动、港关、水战、ZOC
3. `02-economy.md` 收入、内政设施、商人、行动力、灾害
4. `03-personnel.md` 武将生命周期、关系、忠诚、登用、俘虏、官职
5. `04-military.md` 征兵、兵装、编成、训练、补给、技巧
6. `05-combat.md` 攻防、战法、伤害、攻城、火、异常、伤亡
7. `06-strategy.md` 战场计略、城市计略
8. `07-diplomacy.md` 亲善、同盟、停战、交换俘虏、劝降
9. `08-ruler-corps.md` 汉帝、爵位、继承、军团、灭亡、统一
10. `09-events.md` 通用事件、历史事件、遗迹与庙
11. `10-duel.md` 单挑
12. `11-debate.md` 舌战
13. `12-pk.md` PK 专属系统总表
14. `13-open-exactness.md` 尚缺精确内部公式与引擎临时采用值
15. `14-evidence-audit-2026-09-29.md` 证据审计与升级记录
16. `15-pk-ability-research.md` PK 能力研究机制、48节点完整基础图与50隐藏候选数据；来源冲突、开局RNG和命令/scheduler仍有明确边界
17. `16-unresolved-rules-fallbacks.md` 15项未决规则逐项核对与引擎 fallback
18. `17-post-15-source-audit.md` 后续逐点审计当前总表与历史记录入口
19. `18-unit-panels.md` E3兵种基础参数、面板公式、修改器隔离和测试边界
20. `19-training-morale.md` E4训练闭式、气力上限、军乐/奏乐/诗想与气力特技
21. `20-food-consumption.md` E5旬级兵粮消耗、阵系减粮、着火烧粮与粮尽边界
22. `21-supply-transport.md` E6补给/输送路径、补兵约束、气力混合与平台差异
23. `22-techniques.md` E7 36技巧ID、研究成本、效果分层与证据等级
24. `23-technique-patch-differences.md` E8 Vanilla/PK补丁链、技巧版本差异、原BUG与社区修复profile
25. `24-food-raid.md` E9兵粮袭击触发路径、数量模型与RNG边界
26. `25-response-fire.md` E10应射箭类触发、射程/地形/支援边界与平台差异
27. `26-technique-research-time.md` E11技巧研究时间分档、人才府修正与证据矩阵
28. `27-technique-research-merit.md` E12技巧研究完成功绩冲突表、版本边界与PC exact缺口
29. `28-status-duration-recovery.md` E13混乱/伪报状态计数、每旬恢复、阵系加速与初始duration边界
30. `29-duel-continuous-formulas.md` E14单挑actionRatio、命中/闪避/格挡、伤害与斗志连续公式
31. `30-debate-psychological-damage.md` E15舌战牌力、心理伤害、怒气与话术反弹连续公式
32. `31-non-cavalry-casualty-sources.md` E16弩系狙伤、猛者、业火与普通击破武将伤亡来源分流
33. `32-terrain-hazard-damage.md` E17栈道、毒泉、落石随机伤害与免伤边界
34. `33-ruler-succession-priority.md` E18历史/玩家/COM君主继承路径与自动后继类别优先
35. `34-council-proposal-pool.md` E19君主评定22类具体提案、两阶段采决与chooser边界
36. `35-delegated-ai-architecture.md` E20委任/COM AI procedural架构、出兵gate/概率与局部主将评分
37. `36-hiring-probability-exactness.md` P0-1普通登用原版外层判定链与005C4F80未决边界
38. `37-diplomacy-version-boundaries.md` P0-2 Vanilla补丁外交边界、PK公式corpus与版本profile
39. `38-siege-capture-exactness.md` P0-3攻城耐久调用链、城兵共用核心与陷落资源保留公式
40. `39-fire-lifetime-spread-exactness.md` P0-4火焰寿命会心+1、基础RNG边界与自然邻格蔓延隔离
41. `40-debut-death-exactness.md` P0-5月初生命周期入口、登场/寿命profile与死亡内部函数边界
42. `41-nonnatural-loyalty-exactness.md` P0-6褒赏、月俸欠薪与流言忠诚效果边界
43. `42-captive-release-exactness.md` P0-7资金不足俘虏释放人数/选择管线、主动释放技巧P与禁仕路径冲突
44. `43-auto-office-selector-exactness.md` P0-8自动封官单官职评分、first-wins同分与caller列表边界
45. `44-troop-resource-transaction-exactness.md` P0-9出征/输送draft容量、资源守恒、100000兵装上限与finalizer边界
46. `45-deputy-rounding-exactness.md` P0-10主副将关系除数、_ftol2取整与剩余PC opcode边界
47. `46-training-morale-exactness.md` P0-11训练gate/reset cadence与0059A230野外气力恢复
48. `47-food-overlap-starvation-exactness.md` P0-12阵系耗粮重叠与粮尽逃兵边界
49. `48-supply-transport-finalizer-exactness.md` P0-13补给/输送finalizer与气力加权
50. `49-technique-research-time-exactness.md` P0-14研究时间calculator、人才府减时与难度边界
51. `50-technique-research-merit-exactness.md` P0-15技巧研究完成功绩caller、两套表冲突与参与者分配边界
52. `51-food-raid-caller-exactness.md` P0-16兵粮袭击caller、零伤害与反击绕过边界
53. `52-response-fire-double-strike-exactness.md` P0-17应射caller、主动/防守连击方向性与支援边界
54. `53-fire-lifetime-setter-boundary.md` P0-18火焰寿命setter、状态查询与重复点火边界
55. `54-death-lifecycle-layer-boundary.md` P0-19登场/自然死亡RNG层级、死亡年/flag/健康/DEAD边界
56. `55-captive-forced-release-ordering-boundary.md` P0-20俘虏forced-release comparator排序与固定方向裁剪边界
57. `56-cash-reward-loyalty-boundary.md` P0-21现金褒赏true-loyalty写回primitive与RNG公式边界
58. `57-salary-shortfall-loyalty-boundary.md` P0-22欠薪prepare/accumulate与月度batch-finalizer边界
59. `58-rumor-effect-helper-boundary.md` P0-23流言success/effect函数分层与target-selector边界
60. `59-treasure-loyalty-opcode-boundary.md` P0-24宝物授予/没收ownership-state与loyalty side-effect边界
61. `60-hiring-success-rate-signature-boundary.md` P0-25普通登用005C4F80四参数签名与内部输入边界
48. `47-food-overlap-starvation-exactness.md` P0-12阵系耗粮bit-exact、重叠不叠乘与粮尽逃兵证据降级
49. `48-supply-transport-finalizer-exactness.md` P0-13野外补给、输送抵达函数范围、overflow与气力加权边界

## 来源优先级

1. 游戏数据 / 官方攻略资料
2. 可明确区分原指令与修改指令的逆向记录
3. 游民星空《三国志11》专题资料
4. 日文《三國志11攻略wiki》
5. 仓库已有 `docs/sources/*.md`
6. 单一玩家经验帖仅作候选

## 版本核心差异（先记住）

- **无印已经有 8 系技巧**：枪、戟、弩、骑、练兵、发明、防御、火攻。
- **PK 新增第 9 系：内政系技巧**（木牛流马、港关扩张、政令整备、人心掌握）。
- **PK 新增能力研究**。
- **PK 新增吸收合并**（同类设施 Lv1→Lv2→Lv3）。
- **PK 新增 10 类内政设施**：大市场、鱼市场、黑市、军屯农、练兵所、符节台、军事府、人才府、外交府、计略府。

## 冲突处理

1. 先分版本，不允许 PK 规则覆盖无印。
2. 同版本内：游戏数据/官方 > 已区分原版与修改的逆向 > 可复现实测 > 单篇攻略。
3. 找不到精确公式时保留“原作未知”，另写“引擎临时采用值”。
4. 找到更可靠证据时只替换临时采用项；不得把修改器的新增公式冒充原作。


P0-26 `005BA410` 共享数值 helper 以 `61-shared-numeric-helper-005ba410-boundary.md` 为专项记录，结构化证据为 `../sources/shared-numeric-helper-005ba410-boundary.json`；它同时被 `005C4F80` 登用成功率与 `005D052C` 流言成功率调用，因此不能再建模为 hiring-only 公式；完整 body 与输入业务语义仍 open。


P0-27 `005BA4C0` deterministic generator 以 `62-hiring-deterministic-generator-boundary.md` 为专项记录，结构化证据为 `../sources/hiring-deterministic-generator-boundary.json`；函数仅约0x30字节，普通登用七参数输入与 `< successRate` 判定已锁定，非0 mode 则走 `004721D0` runtime probability；具体混合算法与返回范围仍 open。


P0-28 `004AF7D0` hard recruitment gate 以 `63-hard-recruitment-gate-boundary.md` 为专项记录，结构化证据为 `../sources/hard-recruitment-gate-boundary.json`；函数通过 handled-return + out-result 短路 forced success/fail，只有未命中才进入 `005C4F80`，因此关系/禁仕条件不是概率修正；内部优先级仍 open。


P0-29自动封官跨官职scheduler以 `64-auto-office-scheduler-boundary.md` 为专项记录，结构化证据为 `../sources/auto-office-scheduler-boundary.json`；`005FAF00` 只负责单官职selector，candidate list由caller传入，官职遍历、候选构造、winner写回与后续移除均属于尚未恢复的上层scheduler。


P0-30 `005FA4D0` 任官资格 helper 以 `65-auto-office-qualification-helper-boundary.md` 为专项记录，结构化证据为 `../sources/auto-office-qualification-helper-boundary.json`；helper 只做 `(person, office)` 资格判定且发生在评分前，忠诚90 gate 明确在其外部；功绩门槛与所在/身份/任务等内部规则仍待 body 恢复。


P0-31 `005FA650` office classifier 以 `66-office-classifier-entry80-boundary.md` 为专项记录，结构化证据为 `../sources/office-classifier-entry80-boundary.json`；classifier 边界与 `struct_office[81]` 已锁定，index80 确认为真实原数组成员；0..79分类模式仍为高置信逆向推断，index80 类型与用途继续 open。


P0-32部队资源事务 finalizer 以 `67-troop-resource-finalizer-boundary.md` 为专项记录，结构化证据为 `../sources/troop-resource-finalizer-boundary.json`；据点/部队资源 adjust functions 只确认到单项 primitive，不能冒充出征commit或回城return finalizer；事务顺序、rollback与return caller继续open。


P0-33主副将血缘 `/3` PC opcode 以 `68-deputy-blood-third-pc-opcode-boundary.md` 为专项记录，结构化证据为 `../sources/deputy-blood-third-pc-opcode-boundary.json`；`00495AB0..00495B8F` 边界、普通 `/4` 与亲爱 `/2` 的 PC opcode 保持 exact，血缘 `/3` 继续只标 PS2 empirical-exact / cross-platform-high，PC 指令仍 open。


P0-34训练 reset / top scheduler xref 以 `69-training-reset-scheduler-boundary.md` 为专项记录，结构化证据为 `../sources/training-reset-scheduler-boundary.json`；训练 reset 行为语义与 `0059A230` local morale handler 边界已锁定，但 setter(value=0) caller 与 top-level morale scheduler xref 仍 open，禁止按地址邻近猜调用链。


P0-35阵系 overlap / starvation 原函数边界以 `70-food-overlap-starvation-function-boundary.md` 为专项记录，结构化证据为 `../sources/food-overlap-starvation-function-boundary.json`；`0049D180` single-selector 边界已锁定，重叠不叠加继续 exact；粮尽 troop-loss handler 地址/body 仍未找到，`00599AA0` 明确排除，0.76继续 legacy-only。


P0-36补给/输送气力非整除 rounding 以 `71-morale-weighted-merge-rounding-boundary.md` 为专项记录，结构化证据为 `../sources/morale-weighted-merge-rounding-boundary.json`；`004B9840` building morale merge helper 边界已锁定，兵力加权核心保持 high-confidence，但 building/troop 非整除 rounding 与 troop→troop helper 继续 open，禁止无 xref 套用 `_ftol2`。


P0-37技巧研究时间难度矩阵以 `72-technique-research-difficulty-matrix-boundary.md` 为专项记录，结构化证据为 `../sources/technique-research-difficulty-matrix-boundary.json`；`005D7DD0` calculator 边界与 `DifficultyLevel` 场景字段已锁定，但 calculator 是否读取难度仍无 xref；Super 70/140/210/280 保持 empirical-high，Beginner/Advanced 矩阵继续 open。


P0-38技巧研究完成功绩 writer 以 `73-technique-research-completion-writer-boundary.md` 为专项记录，结构化证据为 `../sources/technique-research-completion-writer-boundary.json`；`00599CF0` 的技巧研究段只做倒计时，不在归零时调用 completion handler；能力研究则显式 `005CE600` 完成处理，因此技巧研究 writer 必在另一条链上，participant distribution 与两套功绩表冲突继续 open。


P0-39火焰寿命 base RNG / setter 候选以 `74-fire-lifetime-rng-setter-candidate-boundary.md` 为专项记录，结构化证据为 `../sources/fire-lifetime-rng-setter-candidate-boundary.json`；两个 fire-state query 边界已锁定且不能冒充 lifetime setter，setter 搜索范围收窄到火计/火矢/火陷阱成功点火执行链，base RNG / reignite / critical+1 opcode继续open。


P0-40应射/还射 caller / 连击递归深度以 `75-response-fire-recursion-boundary.md` 为专项记录，结构化证据为 `../sources/response-fire-recursion-boundary.json`；`00584DC8` 与 `00586E12/00586F0F` 已分别归入两个不同 containing function，应射 helper 与攻击/连击 core 分层确认，但二者 xref、response re-entry 与最大 chain depth 继续 open。


P0-41兵粮袭击 `005ADB20` helper 以 `76-food-raid-helper-boundary.md` 为专项记录，结构化证据为 `../sources/food-raid-helper-boundary.json`；helper 边界、caller寄存器契约和techId=1检查位置已锁定，但RNG、Attack×R精确算术以及双方粮食clamp顺序继续open。


P0-42攻城耐久 `005ADDC0 / 005ADE20` inner helper 以 `77-siege-durability-inner-helper-boundary.md` 为专项记录，结构化证据为 `../sources/siege-durability-inner-helper-boundary.json`；两个基础helper边界、3参数调用形态、x87浮点返回与外层倍率后置均已锁定，helper内部公式和x87小值边界继续open。


P0-43兵临城下出城 / AI 3格与1.2倍规则以 `78-ai-defense-sortie-boundary.md` 为专项记录，结构化证据为 `../sources/ai-defense-sortie-boundary.json`；旧“3格+1.2倍兵力比”已撤回为不受支持的 legacy fallback，AI 出兵必须走已逆出的多阶段 procedural pipeline；固定3格守城trigger仍open。


P0-44历史据点陷落 takeover reset 审计以 `79-facility-takeover-reset-boundary.md` 为专项记录，结构化证据为 `../sources/facility-takeover-reset-boundary.json`；`00487E20` 耐久 setter 与 `004B329B` 资源保留路径已分层，资源保留 exact，但两种陷落入口的 reset writer、10%耐久重置与守兵归零保留耐久都继续 open。


P0-45历史内政设施保留 selector 审计以 `80-retained-facility-selector-boundary.md` 为专项记录，结构化证据为 `../sources/retained-facility-selector-boundary.json`；魅力决定保留1–5座的档位继续 empirical-high，但具体 selector/RNG 仍 open，`004BA610` 与 `004B329B` 均已排除为该 selector。

P0-46当前capture selector以 `81-capture-selector-source-profile.md` 为专项记录，结构化证据为 `../sources/capture-selector-source-profile.json`。`004B2CA0` containing body及三caller、city-only gate、全局链表前30完成普通内政候选、魅力byte除20、全范围n次交换/RNG与销毁前缀已在固定source profile恢复；完成铜雀台另行跳过，新势力ID超0..41在shuffle后全毁。旧“100+固定5”和均匀sample不代表该source算法；stock等价、完整finalizer与跨版本仍open。局部模型/trace/replay校验：`python scripts/check_capture_selector_profile.py`；不代表原EXE或整引擎回归。

P0-47训练生命周期审计以`82-training-lifecycle-source-profile.md`为准：source gate/parameter/officer helpers、累计XP3000、普通growth1..100、PK研究共享XP、reset全局loop/noncontiguous tails和野外气力tail-xref已恢复；stock等价/完整AP与scheduler顺序仍未证实。实现是带配置/证据/重放的限定兼容模型。

P0-52专用零退款取消以[87-mission-cancellation-zero-refund.md](87-mission-cancellation-zero-refund.md)为准：9/10/12/22/23/24的ordered gate与零退款返回/reset有界投影，独立v2保留v1重放语义；组任务/设施/研究与完整return/callback仍open。

P0-53组任务取消以[88-group-mission-cancellation.md](88-group-mission-cancellation.md)为准：2/5按ID序前三人、signed city计数/force研究字段先于逐人返回，S2研究扩展单独绑定；独立新API保留v1/v2历史trace。

P0-54以[89-facility-mission-cancellation.md](89-facility-mission-cancellation.md)为准：0/38有独立有界投影；旧v1/v2/group语义不变，stock/Vanilla未验证。

P0-55以[90-special-mission-cancellation.md](90-special-mission-cancellation.md)为准：41..43共享handler有独立有界投影，无actual-location valid gate；旧模块/trace不变，完整return与stock仍open。

P0-56以[91-return-mission-lifecycle.md](91-return-mission-lifecycle.md)为准：mission37完成与单active-list成员的一步推进已有独立有界投影，退款先于reset、direct acted尾部、源分离距离/金cap、显式安全域与零local RNG重放；完整return/全链表与scheduler仍open。

P0-57以[92-officer-return-finalizer.md](92-officer-return-finalizer.md)为准：004BF6F0四字段及完整列表/role调用顺序已有独立有界投影，ruler ownership原子defer；004BE2A0稳定非空军团角色协调为下一主题，完整callback/force/stock/Vanilla仍open。

P0-58以[93-legion-role-reconciliation.md](93-legion-role-reconciliation.md)为准：原下一主题稳定军团与refresh=0太守标量协调已有独立有界API；事件监听、force灭亡/空军团及完整返回/capture仍open。
