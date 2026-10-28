# 原创推断练习地图与中性开局加载 v1

日期：2026-10-28。基线 `fb34caa440aa823677627328d7d33e7c8fd60d62`。
代码：[inferred-practice-map.ts](../../packages/engine/src/inferred-practice-map.ts)。对应T37/T40。**缺原数据时采用明确原创工程选择，不把未知当停工理由，也不把新设计说成原作事实。**

## 两个实际入口

1. `createInferredPracticeMovementRequest()` 实际构造完整40000格的地图和移动输入，形状直接符合现有 `moveOnSuppliedMap`。不是只返回描述，也不需要外部下载游戏素材。
2. `createInferredPracticeScenario(cityName,startYear)` 沿既有中性单城模板，**实际调用** `createCityCommandState`；再对生成地图用空路径实际调用 `moveOnSuppliedMap`完成输入验证。任一失败返回失败，不给半个场景。成功返回真实 `cityState` 与可消费 `movementRequest`。

这里“实际调用”描述静态代码连线，并非声称本轮已经运行；本轮按限制未执行候选、测试、编译、typecheck或build。

## 地图规则：所有布置均为原创推断

| 部分 | 明确采用 | 理由/证据层次 |
|---|---|---|
| 尺寸 | 200×200，x/y 0..199，共40000格 | 尺寸参照已有原地图结构资料；格内布局完全新造，不能从尺寸相同推出地图相同。 |
| 邻接 | odd-q六邻居：同列y±1；偶x跨列y−1/y，奇x跨列y/y+1；出界边不加入 | 可替换的六角练习布局设计，不声称原helper逐指令恢复。 |
| 格ID | `g-x-y`，按x后y生成 | 新软件稳定命名，不是native坐标编码/对象ID。 |
| 起点/练习设施标记 | (100,100)，周围|dx|≤2且|dy|≤2为草地广场 | 中心出发便于验证多方向移动；坐标不对应任何真实城市。 |
| 边界 | x或y为0/199的外圈blocked=true，terrain仍0 | 明确边界保护，不虚构原悬崖ID；全场无域外边。 |
| 河道 | 广场和边界外，x%40==20且y%20!=10取terrain7 | 人工等距河道，仅练习陆水成本，不仿中国真实河流。 |
| 过河走廊 | y%20==10的河道交点退回陆地选择 | 固定练习通道，不称原港口或原桥。 |
| 树林 | 非河道/广场/边界，(31x+17y)%7==0取terrain5，其余terrain0 | 无RNG的均匀散点设计；不是从原种子复原的森林。 |
| 地形ID | 0草地、5森、7河 | 沿现有攻略移动参考及地图规则的ID层；本批只用已有参考成本支持的三类，不编更多未定义地形。 |
| flags/占用 | flagsU32=0；occupied=false；unsupportedContext=false | 新练习场无其他实体、火或隐藏灾害的显式初值，不是从真实地图缺数据推断“没有”。 |
| 设施信息 | 仅中心facilityPresent=true | 供已有移动回执展示的标记，不生成原建筑、不触发入城/归属/城市服务自动联动。 |

所有格均保留明确邻边。单列河道可使用现有陆/水兵装参考成本；不添加搭船费用或原作未知港口切换，继承原移动器自己的既有限制。不存在原地图的areaCode、城市领域、堤坝/洪水标记；不在原始 `cities.json` 或原数据记录上补假坐标。

## 初始移动状态

单位标记ID `synthetic-practice-marker`、起点g-100-100、budget64、landEquipmentId1、navalEquipmentId9、transport=false、空path。64是足够练习若干步的设计预算，不是从武将统率/兵种行军力还原的原预算。使用原 `GUIDE_REFERENCE_MOVEMENT_POLICY`，不改其名称、成本或缺失条目解释。

可将返回request的path替换成用户选择的相邻格序列交给 `moveOnSuppliedMap`。连续移动时用上一结果的state加新path构造下次request；**不能始终重用初始budget64来冒充连续世界状态**。原移动器原子拒绝不可达、blocked、未知成本、超预算；没有自动寻路、AI或旬末刷新预算。

在旧参考policy中，起点广场相邻草地消费5。纸面例如g-100-100→g-100-101：budget64→59；返回到原格再耗5。此为按静态规则推导的例子，未运行。

## 中性城市初始状态：资料与推断分开

`cityName` 必须是已录42城目录之一，`startYear`1..9999。沿 [既有中性单城模板](inferred-blueprints-v1.md)：城市容量来自该城`maxSoldiers`，金5000、兵10000、治安/气力80、AP200、一名70能力合成人员、一级军营及锻冶、基础兵装1..4、固定既有catalog/policies、1月1日turn0。除目录容量与类别参考外，这些全是中性练习初值，不是该城原剧本开局。

不同cityName只切换这个单城练习源标签和该城容量，不改变40000格原创布局。地图中心不是该真实城市原坐标。没有生成历史武将/君主/势力归属；内部身份沿旧模板的synthetic IDs。

消费者明确分开：`cityState`给`executeCityCommand`，`movementRequest`给`moveOnSuppliedMap`。前者真实创建已验证的独立城市state，不再只把scenario JSON留给调用方猜消费者。

## 不是两个独立服务冒充全局世界

返回标记恒为 `historicalScenario=false`、`nativeMapRecovered=false`、`nativeScenarioRecovered=false`、`clocksShared=false`、`resourcesShared=false`、`globalGameStateCreated=false`、`cityFoodModeled=false`、`nativePersonsOrUnitsCreated=false`。

城市推进旬不会自动恢复地图移动预算；移动不自动使城内兵减少或人员出征。城市保存用既有saveCityCommandState；移动状态与地图输入由原移动合同保存/重放，没有偷偷合成新全局save。单城缺粮字段仍不补假粮账本。

这完成“明确推断地图+初始场景加载入口”的有限代码闭环，不是全游戏、历史剧本或全局战争模式。原图本体及原剧本证据仍需合法可核资料；若之后获得原数据，可走[SHEX只读导入](shex-map-import-v1.md)等新profile，保留本练习布局版本以免旧存档含义变化。

无P078及依赖、Closing奖励/受伤/世界写入、人物移籍/俘虏/死亡、双建设或新玩法模式。仅新增可明确替换的练习数据和现有初始化入口。
