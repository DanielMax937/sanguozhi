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
