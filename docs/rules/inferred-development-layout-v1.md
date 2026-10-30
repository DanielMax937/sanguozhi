# T38：三城推断开发区的实际加载入口 v1

新增 `createInferredDevelopmentScenario(cityName, startYear)`，不是重新声明三城原生分片已知。范围仅北海、建業、會稽；年份1..9998，留出36旬固定建设演练时域。没有网络请求，不读取未公开资源。

## 资料与推断分开

- [既有城市总表](../sources/cities.json) 提供开发地总数：北海12、建業18、會稽15。此处仅复用总数，不把收入字段当库存。
- [三城来源补充](city-development-guide-v1.md) 记录北海/建業“聚集”、會稽“配置良好”的社区攻略评价，不证明原生片数或六邻接。历史原文继续保留。
- **新布局是明确工程推断**：统一使用三列连续行的一个 axial 连通分量，依次 `q=1+(index%3), r=floor(index/3)`；不存在原生坐标/高度/片数证明。會稽一片尤其是纯设计选择，不能借“配置良好”升级可信度。
- `cities.json` 完全不改，三城 `developmentPatches:null` 保留；输出分别标记 `nativeDevelopmentPatches` 与 `inferredComponentCount:1`，不混写。原生资料缺口仍开放。

## 两个真实消费者入口

1. 生成lotId/城市ID/axial位置，将它们写入已有 `facility-construction-example-v1.json` 的独立场景克隆，然后调用 **`createFacilityConstructionState`**。返回已初始化的 `constructionState`，可以由旧 `executeFacilityConstructionCommand` 消费、由旧save/load接口保存重放。不是仅给出坐标列表。
2. 在 #142 原创200×200 odd-q练习图上，将这些开发地对应格铺为普通草地、空地；使用 `x=100+q, y=100+r+floor(q/2)`。保持所有六邻接边不变，检查每个开发地映射到唯一现有格，然后调用 **`moveOnSuppliedMap`** 以空路径验证输入，返回可由该服务继续消费的 `movementRequest`。

城市的construction本地坐标为(0,0)，对应练习图(100,100)。q=1..3不会占城市格，所有格位于地图内。三列连续行按已有axial距离 `max(abs(dq),abs(dr),abs(dq+dr))` 连通；坐标转换保持与练习odd-q邻接一致。`mapping` 明确保存lot↔cell关系，但不是自动双向同步器。

## 合成初值与旧默认

场景采用唯一synthetic力/军团/城市/执行者身份：金5000、容量100000、AP200、TP0、一位政治70的合成执行者、无初始设施、无敌军/野外单位、36条空野外输入。已有example中的income基础0/0、治安100、normal/player仍保留，它们是演练配置，不是原三城历史开局。旧catalog和完整policy按原example原样复制，不新造双建设模式；唯一执行者仍受旧预约/行动门约束。

加载不会自动执行StartDevelopment、AdvanceFacilityTurn、吸收或完成奖励，不触P078、Closing、真实人物归属/伤亡或世界finalizer。返回旧建设服务入口不表示新授权绕过旧规则。原facilities/save/policy没有被覆盖。

两个状态的时钟、资源和保存仍独立。今后在constructionState建出设施，**不会自动把movementRequest对应格改成设施或阻挡**；输出 `automaticMapFacilitySync:false` 明示此边界，也不把city-command生产状态或全局GameState拼进来。地图只是本次空地布局的加载时视图，变化后需显式适配，不得声称持续同步完成。

## 失败与验收

未知城市/年份/总数不受支持直接失败；旧建设初始化或移动验证失败均返回原因，不产出部分可用组合，也不修改原catalog/example。函数只接收string/number原始值，拒绝无效类型、非整数、−0和年份越界。

静态验收：核总数来源、唯一lot/cell、连通与转换公式、实际旧初始化入口、旧policy原样、原生null不改、双状态不伪融合。未执行候选、测试、typecheck、build、重放程序；编码完成不等于运行验收通过。
