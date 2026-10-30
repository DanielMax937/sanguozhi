# T38：开发设施只读 marker 投影 v1

`projectInferredDevelopmentMarkers(cityName, startYear, constructionState, movementRequest)` 为 [推断开发区](inferred-development-layout-v1.md) 提供**显式调用的只读视图投影**。它不会自动订阅、运行世界回合、执行任何建造/吸收命令或奖励，也不是原生世界状态写入。

## 固定布局绑定与验证

1. 通过旧 `createInferredDevelopmentScenario` 在内部重建所选城市/年份的固定推断布局。调用方不能传入自定义lot映射、数量或坐标。
2. 原construction输入先调用旧 `saveFacilityConstructionState` 完整重放验证，再调用旧 `loadFacilityConstructionState` 解析及重放。未直接读取未验证输入字段。
3. 比对加载后的完整genesis与内部固定布局genesis：包括初值、年份、名单、lot数量/位置、policy/catalog等，采用对象key无关/数组顺序保留的canonical比较。三城12/18/15地块不同，不能把北海建设state与建業图混搭；仅伪造同一个合成cityId不足以通过。
4. movement输入先交旧 `moveOnSuppliedMap` 验证；要求空path，完整固定map ID、数组长度/逐格顺序、所有非marker字段和policy必须与内部布局一致。仅实际开发地上的旧facilityPresent位允许不同（可能是之前的陈旧视图）；非开发地marker也不能改动。不能借投影输入替换地形、六邻接、阻挡、occupied或flags。

只接受旧synthetic marker的unitId/兵装/transport配置，budget不能超过原64。有效当前位置和剩余budget可以随明确的外部演练变化，但本模块**不认证移动历史/花费来源**，不是防作弊协议；movementInput是普通数据，不是原生单位。非空path一律拒绝：旧验证器是纯函数，可能在返回前计算该路径，但本模块不会返回或提交它的移动结果。

## 输出规则

按已经完整重放的construction当前snapshot，在每个固定lot查找当前facility：

- 存在设施（developing、absorbing或complete）则该地块facilityPresent=true，并输出id/kind/status/level/effectiveLevel/jobId。
- 空lot为false、facility=null；吸收中已从snapshot移除的donor不再展示，不通过历史job重新造出来。
- 城市本身及其他非lot格完全保留；不会新添/删除设施或物品。

输出新movementRequest再次调用旧 `moveOnSuppliedMap` 以空路径验证。此处facilityPresent只是旧移动服务的展示/步骤记录marker，**不改blocked/occupied、地形成本或设施碰撞规则**。返回建设revision/date帮助调用方识别视图版本，但不推进任一时钟。不返回“已同步全世界”或“原生地图恢复”状态。

原construction输入、原movement输入、catalog和全部旧保存都不改写；调用方可选择展示这份新视图。之后建设状态再次变化，旧视图不会自动更新，需再次明确调用投影。旧layout中的`automaticMapFacilitySync:false`仍准确：新增的是独立手动投影函数，不是自动同步器、双向状态桥或新建设模式。

## 证据与安全边界

三城总数/布局资料、推断连通片及原生null边界沿用T38布局规则，不新增原生坐标、原生建筑ID或历史剧本事实。合法重写整个合成历史可以形成另一个一致场景；旧save/load重放不是签名，不证明输入作者或原游戏事实。

不触P078、Closing奖励/受伤/世界写入、人物归属、伤亡、零值终结、全局资源。旧服务有自己的纯校验/重放，但本模块不调用执行命令入口；验证保存中的既有命令不等于对外重复执行其效果。

外层捕获输入异常；旧服务descriptor/data-only验证仍生效。仅面向普通可信数据，不能承诺所有runtime中Proxy反射无副作用。当前仅静态审阅，未运行候选、测试、typecheck、build或重放程序，不宣称运行验证通过。
