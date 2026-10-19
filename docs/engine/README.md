## 有限锻冶根的私有三命令 core（2026-10-19，静态）

[私有core职责](bounded-forge-core.md) · [原七API与完整保存合同](bounded-forge-development-production.md) · [建设到生产具体规则](../rules/bounded-forge-development-production.md)

原有开工、普通生产、一次旬推进三命令业务和必要数据／错误叶抽到包内；公开owner仍负责安全输入、全部重建、不变量、预算、事务和七API。原v1全部DTO、512次trace、整数JSON及保存格式保持，未增加月产、开放hooks或trusted-state入口。仅静态审阅，未运行产品、测试、编译、构建或validator。

## 月特产的单兵种私有阶段（2026-10-19，静态）

[无独立时钟的月特产阶段](monthly-specialty-phases.md) · [完整财政服务合同](city-finance-lifecycle.md) · [月特产具体规则](../rules/city-finance-lifecycle.md)

旧finance的单兵种月特产输入、完整核receipt、返回检查与库存饱和credit抽到包内；旧owner仍掌握工资后1→4顺序、月界、太守、完整月事务与保存重建。全部四兵种和原政策域保持。没有新增动态设施月产、第二clock或新公共API；只做静态审阅，未运行测试、编译、构建、产品或validator。

## 单锻冶厂建设与生产的共享根（2026-10-19，静态）

[七API／完整DTO／保存重建与预算](bounded-forge-development-production.md) · [具体规则](../rules/bounded-forge-development-production.md)

新profile把一次锻冶厂建设和普通兵装1–3生产接到同一ledger与唯一旬时钟；复用已抽出的construction阶段及普通即时生产核。原建设服务与既有共享根保持其原接口和保存格式。无CLI、批次、legal分页或旧存档迁移；只做静态审阅，未运行测试、编译、构建或产品。下方“私有抽取未整合”的说明是原批次范围，不表示本新profile不存在。

## 建设施工的私有工作量与完成阶段（2026-10-19，静态）

[私有phase与owner边界](facility-construction-phases.md) · [九类新建／五类吸收具体规则](../rules/facility-construction-lifecycle.md)

现有construction服务的工作量计算、精确Write、单任务进度与完成写入抽到包内；开始资格、日期／AP、全部政策、逐人错误顺序、多任务调度和完整保存重建仍由旧owner控制。没有新公共入口或建设到生产的共享根，HP／原生任务等边界保持。只做静态审阅，未运行产品、测试、编译、构建或validator。

## 有限单城共享时钟与工房任务（2026-10-18，静态）

[八API／完整历史／保存与分页合同](bounded-city-piece-clock.md) · [具体规则](../rules/bounded-city-piece-clock.md)

独立profile复用既有私有即时归约器与件数数学，以唯一根持有clock、AP恢复、预约、完成和完整历史。只支持固定facts的5号单工房有限会话；不改旧API，不新增CLI，不执行产品或测试。下方私有抽取与固定旬服务的范围是各自历史边界，不能据此误读新root已覆盖全世界。

## 件数生产私有计划器兼容抽取（2026-10-18，静态）

[计算／开工准备／收费／无时钟完成计划](piece-command-planners.md) · [具体规则与兼容边界](../rules/city-command-lifecycle.md)

旧city-command的件数装备5–8／10–11抽到包内计划器；公开接口、政策、保存回执、首错顺序、StartSnapshot复制时点、多任务完成次序和原owner时钟／AP恢复保持。没有新共享任务root或原生人员任务集成；计划器不从公共index导出。未运行产品、测试、编译、构建或validator，静态兼容审查不证明运行等价。

## 固定单城共享根（2026-10-18，静态）

[八API、连续legal分页与独立CLI](bounded-city-economy.md) · [具体规则](../rules/bounded-city-economy.md)

普通内政与商人即时动作共用一份genesis／ledger／历史；原子批次按动作顺序求值，完整保存重算。仅固定单城／单旬，无世界推进，不导入旧state，原TP／奖励和证据边界保留。基于PR91私有reducer；静态代码与文件核对不等于运行验收，未运行测试、编译、构建或产品。

## 即时命令内部维护（2026-10-18，静态）

[包内即时命令说明](instant-command-reducers.md) · [城市命令具体规则](../rules/city-command-lifecycle.md) · [商人买卖粮具体规则](../rules/city-merchant-lifecycle.md)

此次仅作内部兼容抽取，原规则与公共接口继续适用，不新增玩法或共享账本。未运行产品、示例、测试、typecheck、编译、build、runtime、checker或validator；既有验证限制保留。

## 固定单城季节：独立simulation六API（2026-10-18，静态）

[CitySeason V1](city-season-lifecycle.md)通过公共[src/index.ts](../../packages/engine/src/index.ts)导出 `createCitySeasonState`、`previewCitySeasonCommand`、`executeCitySeasonCommand`、`saveCitySeasonState`、`loadCitySeasonState`、`replayCitySeasonTrace`，以及 `CITY_SEASON_POLICY_V1`、`CITY_SEASON_FOOD_CATALOG_V1`、`CITY_SEASON_SOURCES_V1` 和11个类型。[具体规则](../rules/city-season-lifecycle.md) · [policy](../../data/catalogs/city-season-policy-v1.json) · [设施catalog](../../data/catalogs/city-season-food-facilities-v1.json) · [source](../sources/city-season-lifecycle.json) · [schema](../sources/city-season-lifecycle.schema.json) · [未运行trace](../../data/scenarios/city-season-example-v1.json)。

唯一AdvanceSeasonMonth在固定单城／完整名单／30槽中推进current与scheduled，内部PRNG派生概率／持续／兵粮损失／健康恶化／Lv1移除，真实扣30TP并在季初串联两旧粮纯核后入账。风水不治疗旧current；祈愿、月序、概率／持续／损失均显式simulation。任一死亡边界、非正兵粮、TP不足及后段预算失败均回滚整月。Lv2和未知设施／技能整体拒绝；不是原版全局scheduler或完整财政接续。

完整genesis、policy／catalog／sources和每个receipt重新计算；保存／加载、preview、历史ID幂等与escaped SaveResult及全部旧返回预算都共享有界合同。API返回使用相应schema result fragment，create/load共用stateResult；条件字段关系仍由adapter／纯核／完整replay约束，不把shape schema当语义认证。strictlyUnbiased=false，非原版PRNG。

公共入口集成基线为PR89 main `0c5ad00667d40960e72f2d8b14c9c20f7eec30fc`／tree `a88a940c92a37c85ac8a827f1f8988ae18401aea`；来源manifest保留PR86历史读取身份。两粮核、两份来源依赖与设施catalog在这两个基线间Git blob相同，不把集成版本提升为新的原作证据。 仅静态实现，产品、示例、测试、typecheck、编译、build、runtime、checker、诊断及schema验证均未运行。原43主题与45快照的证据缺口不减少，下方历史结果不验证本新增。

## 一次内政评定：独立episode API（2026-10-18，静态）

[SingleCouncil V1](single-council-lifecycle.md)通过公共src/index导出 `createSingleCouncilState`、`previewSingleCouncilCommand`、`executeSingleCouncilCommand`、`querySingleCouncilState`、`saveSingleCouncilState`、`loadSingleCouncilState`、`replaySingleCouncilCommands`，以及 `SINGLE_COUNCIL_POLICY_V1` 与14个类型。[具体规则](../rules/single-council-lifecycle.md) · [policy](../../data/catalogs/single-council-policy-v1.json) · [source](../sources/single-council-lifecycle.json) · [schema](../sources/single-council-lifecycle.schema.json) · [未运行trace](../../data/scenarios/single-council-example-v1.json)。

完整CityScenario与supplied角色／roster进入单次服务；最多6名下属，方针／具体案两阶段建议及采决。只有Patrol／Recruit／Produce1–4由引擎内部选成提案并通过原child公开API原子执行；19类与件数生产排除。Complete后不能继续，Abort无普通案提交；可查询／保存／重放及旧ID幂等重试。普通内政账本复用而不重写，原child没有TP，wrapper只记录封顶10000的一次+10完成奖projection，ordinaryProposalTp保持not-modeled，无全局finalTP。

完整genesis与child保存重算、每次完整receipt、固定raw−1非零域PRNG映射、所有历史幂等返回与escaped SaveResult预算均保持同一原子边界；这不证明原作chooser或整体抽样严格无偏。公共入口集成基线为PR88 main `8063d39731a42af87646168d4b36b92bd9d3ed3d`／tree `5e555fcda99f97e71e50c9c8565810dca50915be`；来源manifest继续保留PR86原始读取身份，普通city-command源码blob `f07b0762e045dfb77caeb8e46c06e7cee8bd255f`在两版本间相同，不把集成版本当成新的原作证据。原43主题与45快照中的未决证据不减，原版事件与跨服务一致性尚未集成。仅静态实现，未运行产品、示例、测试、typecheck、编译、build、runtime、checker、诊断或schema验证；下方历史结果不验证本新增。

## O14 query：固定来源事件三值查询（静态新增）

[SourceEventQuery V1](source-event-query.md)通过公共src/index导出 `getSourceEventQueryProfileV1`、`listSourceEventObservationsV1`、`querySourceEventV1`及七个类型；成功分别返回ok/profile、ok/observations与query结果，共享带pointerStatus的小型failure。[完整规则](../rules/source-event-query.md) · [固定registry](../../data/catalogs/source-event-query-profile-v1.json) · [来源](../sources/source-event-query.json) · [输入schema](../../data/schemas/source-event-query-v1.schema.json) · [响应schema](../../data/schemas/source-event-query-response-v1.schema.json) · [未运行示例](../../data/scenarios/source-event-query-example-v1.json)。

固定观察身份＋typed facts＋显式bindings，只核五原子／一局部all；缺失／版本／未解析／未知分组保持unknown。完整原始观察、子条款pointer、证据和fact路径可读；comparison不是documentedConditionsStatus或executionEligibility。所有整体条件仍unknown，executionEnabled=false，无执行／保存／重放API。输入1MiB／16384节点／深24与成功响应4MiB／65536值／深48分别限额；失败pointer超过1024 UTF-8 bytes置null并标明原因，完整failure小于8KiB。

实现集成于PR87 main `021097bdb63ed882bb7b1e1d11f6bdeaf8af017b`／tree `077cb16ad83c8a3a32a6f60a26b3a00cee1b0a93`，五语料仍为PR85固定相同Git blob。原43／45和O14／O15未决范围保留。仅静态实现，未运行产品、示例、测试、typecheck、编译、build、checker、诊断或schema校验。

## O14 field：独立正兵力动作服务（静态新增）

[FieldCombat V1](field-combat-lifecycle.md)公开 createFieldCombatStateV1／previewFieldCombatV1／executeFieldCombatV1／saveFieldCombatV1／loadFieldCombatV1／replayFieldCombatV1，支持固定episode七动作和最多一次反应。闭合DTO、内部阶段tape、全genesis逐receipt重算、所有历史重复结果及转义SaveResult预算保持同一提交边界。当前只有独立兵力／气力／acted／状态账本，未结算原生奖励或全局回合。

[具体规则](../rules/field-combat-lifecycle.md)与[来源](../sources/field-combat-lifecycle.json)明确反击等新政策。集成基线PR86 main `a04ee326fdaa68e930681430352f4d98fee5209e`／tree `df4e2be515e2434e4e64476517c8e58f0d3afaf0`。原43证据组与45条snapshot不减，全部原作exactness E及域外X保留。没有运行产品、示例、测试、typecheck、编译、build、checker、诊断或schema校验；静态代码存在不是运行通过。

## 相邻遗迹／庙独立事件（O13-B）

更新：2026-10-18 UTC。

[create/preview/execute/save/load/replay V1 API](adjacent-site-discovery-lifecycle.md) · [完整B1–B5规则](../rules/adjacent-site-discovery-lifecycle.md) · [policy](../../data/catalogs/adjacent-site-discovery-policy-v1.json) · [source](../sources/adjacent-site-discovery-lifecycle.json) · [schema](../sources/adjacent-site-discovery-lifecycle.schema.json) · [未运行场景](../../data/scenarios/adjacent-site-discovery-example-v1.json)。冻结到达自行过滤／资格／独立LCG抽样，pending冻结12个月奖励或庙offer，实际写XP／素质／适性／技能；完整genesis、收据与状态重建、4096历史／16MiB预算。仅三命令，无inspect或全局移动适配器。

攻略、供应事实与新政策分层；原概率／坐标／技能池／writer未恢复，原43／45及E／X不变。静态撰写，产品、示例、测试、typecheck、编译、build、checker、诊断和schema校验均未执行。

## 固定单城探索与发现（O13-A）

[create/preview/execute/save/load/replay V1 API](city-search-lifecycle.md) · [完整规则](../rules/city-search-lifecycle.md) · [policy](../../data/catalogs/city-search-policy-v1.json) · [source](../sources/city-search-lifecycle.json) · [schema](../sources/city-search-lifecycle.schema.json) · [未运行场景](../../data/scenarios/city-search-example-v1.json)。复用PR53／54／55已发布数值核；内部过滤／选择／LCG抽样与独立发现、金／AP／行动／奖励账本，保留205和条件稳定二读，完整保存重建、4096历史／16MiB全返回及全部旧幂等receipt容量。仅AP20独立旬推进，无inspect或原世界适配器。

新policy不等于原概率／writer／stock认证；O13-B遗迹／庙另见[独立静态profile](adjacent-site-discovery-lifecycle.md)，不进入A命令集，原43／45不减。没有运行产品、示例、测试、typecheck、编译、build、checker、诊断或schema校验；历史核验证不覆盖本批。

## 固定双城普通流言标量（O12-B）

[create/inspect/preview/execute/save/load/replay V1 API](rumor-scalar-lifecycle.md) · [规则](../rules/rumor-scalar-lifecycle.md) · [完整policy](../../data/catalogs/rumor-scalar-policy-v1.json) · [schema](../sources/rumor-scalar-lifecycle.schema.json)。独立success、稀疏selector、抗性/loss、200金/30AP和actor频次、true loyalty/security、旬序/RNG及完整保存重算；所有具体数值公式和RNG均synthetic。原成功率E；被捕风险 unresolved-not-modeled、travel/failureDiplomacy/xpMeritTp未模拟、ownershipFrozen=true，完整原动作X。PR83的O12-A已交付；O12与原43不关闭、不新增分母。静态交付未运行任何测试、编译、checker、schema或产品。

## 固定驻城自然忠诚与现金褒赏（O12-A）

[create/inspect/preview/execute/save/load/replay API](personnel-loyalty-lifecycle.md) · [完整规则](../rules/personnel-loyalty-lifecycle.md) · [固定policy](../../data/catalogs/personnel-loyalty-policies-v1.json)。两个真实命令，独立资源/真实忠诚byte/频次/日历与新共享RNG，完整genesis/receipt重算。现金5..9不使用魅力/义理，关系图与writer为明确软件政策；不接登用ownership、欠薪、俘虏、P078及全部依赖。仅静态交付，未运行测试、编译、schema或产品；整个O12和原43不关闭。

## Facility construction and absorption

[Facility construction lifecycle v1](facility-construction-lifecycle.md): standalone supplied-lot StartDevelopment/StartAbsorption/AdvanceFacilityTurn, exact debits, busy actors, work progress and completion rewards, registered alternatives, full reconstruction and existing income-kernel effect projections. [Detailed rules](../rules/facility-construction-lifecycle.md). Static implementation only; not run or tested; no repair, combat HP or native task integration.

## 当前新增：O10-B独立单城商人

[create/preview/execute/save/load/replay API](city-merchant-lifecycle.md) · [完整买卖规则、12政治锚点及公式](../rules/city-merchant-lifecycle.md) · [source/policy](../sources/city-merchant-lifecycle.json)。BuyFood/SellFood/单旬推进、整笔资源/AP/XP写入和完整重建；独立于O04/O10-A，原43不减，不代表全财政或native认证。代码与场景仅静态新增，未运行测试、编译或产品。

## 当前新增：O10-A有限单城财政

[create/preview/execute/save/load/replay API](city-finance-lifecycle.md) · [完整游戏规则、80薪表与设施公式](../rules/city-finance-lifecycle.md) · [source/policy](../sources/city-finance-lifecycle.json)。独立固定owner/完整驻城名单、无俘虏、最多360旬；月薪不足整旬回滚。写入本服务金粮/治安/兵装，不修改O04/schema；全genesis/receipt/snapshot重算。静态新增未运行任何测试、编译或产品；仅O10-A子域，原生财政与原43证据缺口不关闭。

以下为既有模块导航，各自历史验收仅对原版本有效。

## 普通话题牌独立舌战

[O09b API](topic-debate-session-v1.md)与[完整规则](../rules/debate-topic-session-v1.md)：ordered tape/token、3/4/5/6普通容量、原子round、HP先于anger/refill、严格genesis保存重放。现代转录普通子集，五话术/愤激/再考/人物/结束结算保留；静态新增，未运行测试/typecheck/编译/build/checker/产品或诊断。

# 工程API入口

接口与实际游戏规则分开定位；各模块的版本、支持域和证据等级以各自正文为准。最新工程/证据状态见[STATUS](../rules/STATUS.md)，完整游戏规则见[规则索引](../rules/README.md)。

| 模块 | API合同 | 具体规则 |
|---|---|---|
| 合成训练运行 | [训练切片](pk-training-slice.md)、[训练生命周期](pk-training-lifecycle.md) | [训练与旬推进政策](../rules/training-runtime-policy.md) |
| 独立耗粮/手动补给 | [账户与事务](food-supply-lifecycle.md) | [耗粮与手动补给](../rules/food-supply-lifecycle.md) |
| 编成与面板 | [编成接口](unit-formation.md) | [编成政策](../rules/unit-formation-policy.md) |
| 独立城市命令 | [场景、收据及保存接口](../rules/city-command-lifecycle.md) | 同页巡查/征兵/生产公式、费用与预约 |
| 独立技巧研究 | [研究接口](technique-research-lifecycle.md) | [36项、费用、时长、奖励和完成规则](../rules/technique-research-lifecycle.md) |
| 独立PK能力研究与培育 | [两阶段接口、收据及持久化](pk-ability-lifecycle.md) | [完整目录、资格、费用、次数、效果与并行完成](../rules/pk-ability-lifecycle.md) |

技巧研究采用明确provisional政策，未修改训练GameState或共享任何其他服务的账户/预约。本次新增代码和规则只做静态工作，没有运行测试、编译、构建或诊断；历史验收不覆盖本次最终树。

- [独立官职分配服务](office-assignment-service.md)：80有名职selector→plan→apply，明确fill/rebuild、资格与排序政策，单关系状态与请求重放；不接native角色/归属事务

- [普通外交独立服务](ordinary-diplomacy-service.md)：固定PK经验profile、Gift/Alliance/Ceasefire/单旬、金/AP/关系/期限、全量policy与genesis重放；[完整规则](../rules/ordinary-diplomacy-service.md)。危险失败不提交，不应用奖励，未运行或测试

- [三方针普通单挑独立session](ordinary-duel-session-v1.md)：create/inspect/preview/execute/save/load/replay，原始draw、双计数和HP/斗志收据；[全部具体规则](../rules/duel-ordinary-session-v1.md)。仅普通子集，现代转录参考，静态新增未运行

## 独立内政设施自动修复

[Domestic repair lifecycle v1](domestic-repair-lifecycle.md)：完成设施的太守政治整式、工兵独立取整、设施中心两格供应敌军门槛、正 signed16 HP 自写封顶与本域 hp-full 事件，带 create/preview/execute/save/load/replay 完整重算合同。只读[具体规则与证据边界](../rules/domestic-repair-lifecycle.md)；不自动共享建设 work、生产 state 或全局调度。本批仅静态审阅，未运行代码、schema 或验证流程。
