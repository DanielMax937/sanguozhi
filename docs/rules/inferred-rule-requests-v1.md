# 独立推断请求与资料 v1

2026-10-28；用户允许无法核实时用合理推断。本页全部新规则为 **explicit-inference-not-native**，不是原版/PK已证实。这些公开函数只返回请求或资料，不修改现有服务状态，不创建人物/部队，不迁移归属，不扣兵/伤亡/世界资源；`worldWriteEnabled=false`。P078及依赖与Closing排除。

实现：[inferred-rule-requests.ts](../../packages/engine/src/inferred-rule-requests.ts)，从[引擎入口](../../packages/engine/src/index.ts)导出。旧policy、场景、存档和原资料不改。下列T编号对应当前45条缺口快照顺序，旧43统计映射未确证，不以此偷换计数。

## T05 饥饿：projectInferredStarvation(troops, wholeHungryTurns)

- 既有来源：[耗粮证据更正](20-food-consumption.md)、[断粮精确性](47-food-overlap-starvation-exactness.md)。0.76没有可靠原函数支持，保持legacy-only；当前food-supply服务仍report-only。
- 推断决定：每个完整缺粮旬 `remaining=floor(previous*76/100)`。不是一次性对初值乘幂后取整。选择24%损耗仅为沿用历史兼容值，不新造另一无来源常数；它既非原生事实，也非已证实的保守下界。
- 输入兵数0..MAX_SAFE_INTEGER、旬数0..360安全整数，拒绝−0、非整数和非法值；用BigInt乘除避免安全整数乘76中间损精度。0旬无损失。
- 返回逐旬before/projectedRemaining/requestedLoss和总请求；若正兵投影到0，`terminalHandlingRequired=true`，**不执行死亡，不暗夹至1**。这不是可直接回灌原生单位的nextState。
- 有原生断粮函数、取整位置与旬调用证据时替换为新policy版本，旧 `inferred-legacy-76-percent-retention-v1` 保留。现有耗粮服务不自动采用本投影，不能把投影交付说成完整饥饿玩法已接通。

## T36 隐藏能力研究：selectInferredHiddenResearch(seed)

- 来源：[PK攻略树](15-pk-ability-research.md)、[固定攻略目录](../sources/pk-ability-research/catalog.json)。已知10位置、每位置5候选；原选择权重/RNG未知。
- 推断决定：10个资料slot按ID字符序排列；从剩余位置中选5个不重复slot，每取一个后立即从该slot按tableColumn排序的5个候选中选1个。没有理由优待特定技能，因此用近等权映射，不推定稀有权重。
- 新合成LCG32：seed为0..4294967295整数；每次 `word=(imul(word,1664525)+1013904223)>>>0`；索引 `floor(word*bound/2^32)`。固定交错消费位置/候选10次，bound为10,5,9,5,8,5,7,5,6,5。并非原RNG、密码随机或严格无偏；返回`strictlyUniform=false`及每次draw收据。
- 返回`hiddenSelections`按slotId序、finalWord。调用者可显式把该只读结果用于**新建**既有PK能力场景的hiddenSelections；原`explicit-five-fixed-v1`和旧存档不变、不自动抽选或重抽，不自动开始研究。
- 取得原隐藏选择函数/权重与draw顺序后新增profile替换；不原位改LCG或排序以免同seed漂移。目录不是10×5时拒绝，而非静默少选。

## T38 三城开发分片：inferCityDevelopmentPartition(cityName)

- 来源：[三城专页证据](city-development-guide-v1.md)、[城市资料](../sources/cities.json)。北海/建業“聚集”仅定性；會稽仅“配置良好”，不是原生拓扑证明。
- 推断决定：北海12、建業18、會稽15地块各作为**一个抽象开发分量**。前两城是定性攻略推断；會稽是一片的最简设计选择，明确low-design-choice，证据更弱。
- 仅接受原资料名北海/建業/會稽，返回资料中的总地块数与单项componentSizes。**同分量不意味着任意两地块相邻**；不生成六方向边/坐标，不据此触发造币厂、谷仓或合并邻接加成。原cities.json三个null完整保留。
- 这是具名替代资料，使用者必须显式选用；获得可归属版本的完整布局/格子关系后才能建立原生分量，新版本不覆盖旧推断记录。

## T45 无部队旅行：projectInferredOfficerTravel(fromCity, toCity)

- 来源：[城市资料](../sources/cities.json)的42城neighbors，仅攻略城际邻接，非原生道路/路径/行程函数。
- 推断决定：按资料列出的有向邻接做BFS最少边路线，每边10日；同城0日。相同长度路线按邻城Unicode默认排序确定；不取随机路线。理由是仅有城市邻接而没有可辩护的格距，先用一旬/边作为可读、可替换抽象，不伪造地形速度。
- 返回route、edges、requestedTravelDays；未知城市、非法邻城、无路径拒绝。所有已知港关、敌对边界、季节、兵种、船只、特殊人物加速均未建模；`eligibilityEstablished=false`、`nativeDistanceEstablished=false`。
- 不是移动命令，不改变人物位置/状态、任务、期限或城归属。需要真实无部队旅行caller与距离公式才可替换原生模型；当前不能用这个结果验证P078相关任务。

## 静态审阅用边界，不是测试记录

- 饥饿：100→76→57，两旬请求43；0旬不扣；1兵1旬投影0但只置terminal标志。
- 隐藏：每次从剩余slot移除，恰5唯一slot/各1候选；输出字段与既有新建场景hiddenSelections相同，但函数不新建场景。
- 分片：只有三城，每城输出一个分量，总数取原资料；无任何原资料写回。
- 旅行：同城0边/0日；其他route由实际neighbors串成；同长稳定排序，无人事/世界作用。

以上为人工文本/算术检查点，不是运行结果。未运行测试、typecheck、编译、build或候选；运行正确性未验证。
