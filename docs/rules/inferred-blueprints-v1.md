# 地图、剧本与来源事件的明确抽象替代 v1

日期2026-10-28。对应当前缺口T37/T40/T41/T42/T43。代码：[inferred-blueprints.ts](../../packages/engine/src/inferred-blueprints.ts)。这是用户允许的**独立设计推断资料**，不是原生数据恢复。没有世界加载/写入、没有人物移籍/死亡/受伤/奖励、没有P078或Closing执行。

## T37 / T40：42城中性沙盒蓝图

`createInferredSandboxBlueprint(startYear)`，年1..9999整数。返回1月1日起始日期、42个城市的稳定名称排序与已有攻略neighbors，以及每城统一初值：金5000、粮20000、兵10000。城主/太守null、武将名单空、设施空、势力空；开发地总数沿城市资料。地形/原生坐标null，**不是40000格原地图**。

具体取值都是中性设计，不是某历史剧本数据：使用一致规模避免在没有开局表时偏袒某城/势力，给出可继续设计的明确资源模板；兵粮金不是把城市gold/food基础收入字段误当库存。年份由调用者选，不捏造“190原作开局”。没有真实人物表就不用史实猜人物在哪、能力或归属。全部`historicalScenario=false`、`worldLoadingEnabled=false`、`playableGameState=false`。

来源：[城市攻略资料](../sources/cities.json)；原来的城际邻接事实与新增库存假设分层。此蓝图可作为外部场景编辑的起点，但不是现有任一服务的可直接加载GameState，缺人物/所属配置不能被宣传为可玩剧本。推断蓝图交付不关闭原作地图/历史开局证据未知。

## T40 的明确消费者：单城服务输入

`createInferredCityCommandScenario(cityName,startYear)` 返回wrapper中的`scenario`，其消费者明确为既有`createCityCommandState(scenario)`；本函数不调用create或execute。采用已存在city-command-example的固定目录/格式，城名在wrapper中关联源城市，内部forceA/cityA/o1等均是合成身份，不是原武将/势力。

初值金5000、治安80、兵10000、容量用该城已录maxSoldiers、气力80、AP200；一位合成人员统率/魅力/智力70、既有零XP/功绩；分别保留示例第一座军营和第一座锻冶设施并置一级/complete、未行动。所有兵装初始数量0，数量类容量10000、件数类10；只开放基础枪戟弩马types1–4，未开放攻具/高级船。目录原价沿固定示例（不是新认定原生价格），无特产折扣、无兵临、普通难度、player控制；这些都是模板选择，不是历史开局。使用现有默认政策完整快照，1月1日turn0，不产生任务或世界加载。可供既有Patrol/Recruit/Produce/Advance有限服务使用；这是新模板，不把旧示例当新实现。

蓝图粮20000不能硬塞不支持粮字段的city-command合同，故只在wrapper明确`omittedFoodStock=20000`、`foodModeledByConsumer=false`；这不代表实际粮账本已建。返回scenario字段形状与现有create合同进行了静态核对，未实际调用，不宣称运行验收。根42城中性图与单城合成身份属于不同用途，不自动合成全世界。

## T41 / T42 / T43：来源叙事计划，不执行原事件

`planInferredNarrativeNotice(sourcePath, observationId, year, month, alreadyNoticed, knownConditionsConfirmed, versionCompatibleConfirmed)`。

1. 从现有`listSourceEventObservationsV1`实际核对唯一来源文件+观测ID；不存在/有歧义拒绝。通用、PS2、历史来源保持各自原资料ID，不当native ID，不合并矛盾版本。
2. 新设计把该观测作为**叙事提示卡**：使用来源真实标题/URL，固定提示文字明确“原事件未执行”；不会捏造原作结果或把攻略标题扩成已发生史实。
3. 为缺失原日历的替代计划，取`sourcePath + NUL + observationId`的UTF-16 code unit FNV-1a32，month=hash%12+1，day=1。理由是稳定分散提示、同输入可追溯，无随机重跑刷同事件；**月份只是设计，完全不是推断历史发生月份**。
4. `shouldPresent = !alreadyNoticed && knownConditionsConfirmed && versionCompatibleConfirmed && month===scheduledMonth`。已知条件/版本必须由调用者明确确认；false不会被忽略。原query仍返回原来unknown，不把未知条件提升为true。这里的“通过”仅允许提示卡，不等于原事件合法/触发。
5. 提示结果不写alreadyNoticed；它是外部已提示账本事实，调用者须按来源文件+ID去重。没有账本不自动假定未提示。该函数不运行每月调度，不保证用户给定事实正确。
6. 三类来源资料都沿既有列表接入；原始conditions/results/差异保持原样，`executionEnabled=false`、`originalConditionsReconstructed=false`、`originalEventOccurrence=not-evaluated`、所有resource/personnel/world changes空。没有从PS2到PC的隐式映射。

此计划提供可用的确定日期/条件门/提示结果，而不是只有“未知则拒绝”；同时明确它不是完整游戏事件条件/结果实现。原来已有事件的详细奖惩仍只作为来源资料，不由此执行，未述的原生flag、概率、人物/势力变动仍未证实。

## 替换与审阅

若取得版本可归属的原地图/开局表/事件条件和结果链，新增相应source-backed蓝图或计划；不覆盖原资料、旧推断policy、旧日历。条件或平台矛盾不得靠该模板抹去。四项关键区别：资料输入≠原始数据；推断计划≠事件发生；空效果数组≠原事件无效果；中性蓝图≠可运行全游戏。

仅静态审阅；未运行测试、typecheck、编译、build、候选或来源程序，运行正确性未验证。
