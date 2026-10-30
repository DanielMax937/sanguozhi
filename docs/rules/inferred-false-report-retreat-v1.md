# T04：安全合成伪报撤退适配 v1

`inferred-false-report-retreat.ts` 是新opt-in profile，复用已存在的 `terrain-hazard-lifecycle.ts` 持续时间、重置、减计数和恢复核。2026-10-30 已实际读取固定提交 `f84170228ca0ff98ead3d2887be993eef8088885` 的该模块：未行动伪报在旧resolveTurn中拒绝 `unsupported-retreat`，旧enterCells拒绝异常单位。本适配**不改变这两个旧安全门**；自己限定安全地图后承担新移动/acted写入，再调用旧状态核心。

## 固定范围和资料/推断

旧applyStatus使用配置threshold及bound100显式tape，基础1或2，critical再加1，重施取max。旧resolveTurn按当前格有任一同等级且eligible的恢复aura减2，否则减1，归0恢复normal；这些行为直接复用，不复制另一套时长公式。

本profile新增推断：最短无权BFS；每格邻居按JavaScript字符串默认字典序排序以确定同长路径；伪报且未行动每个advance朝固定目标走一格并消耗行动；到达只原地耗行动、不入城解散。没有原生最短路、实际出兵据点、每旬步长或路径选择证据，均标为 `inferred-safe-bfs-one-step-false-report-v1`。

`createInferredFalseReportRetreat(initial, retreatCellId)` 先严格验证旧hazard初态，再限制：

- 初态revision/turn/rng.cursor为0、orders、normal/remaining0、未acted，无fire。
- 单位与所有格ID为synthetic前缀；图至多64格，全部terrainInfoU32=0、非blocked、非unsupported。只此无火普通草地演练图，不接栈道、毒泉、敌单位、占城、危险地形或地形伤害。
- 目标是同图存在的synthetic格，初始单位到它必须有路径；地图、目标、aura/policy/tape在整个journal固定，不暴露改图或改目标命令。RNG tape最多256条，旧校验保证bounds/值等合法。
- 目标是纯坐标，不代表城池或真实出兵据点；原部队/人物归属不写。

## 命令与一次advance顺序

命令统一唯一synthetic id与expectedRevision；最多64条。

1. `applyFalseReport`：还需严格布尔critical；实际调用旧applyStatus(false-report)，消耗旧tape、刷新持续；不是计算原施计命中，不接caster费用，caller显式施加本合成状态。
2. `advance`：若当前仍false-report且未acted，算固定目标最短路，写入一步cellId和acted=true（已经到达则cellId不变），经旧createHazardState复核；之后调用旧resolveTurn，再旧beginTurn。

因此同一轮是**先移动、再在到达格判定恢复aura并减计数、再开启下轮**。先后顺序属于本适配设计，不宣称原作caller。到达不提前清除伪报；状态仍按旧核心倒计数。若伪报在到达之前已经恢复normal，之后advance不再自动撤退。不开单位销毁/入城/武将迁移/return finalizer，不改troops或energy，不隐含发奖励。

旧beginTurn将acted恢复false、turn+1；receipt分别保留适配movement、旧resolution与opening，所以“已耗行动”指刚结算的那轮，不是假称下一轮仍acted。外层revision每个成功命令+1；内部旧revision由实际旧命令递增，新移动写入由外层journal负责，不能把内部旧receipt单独当含移动的完整旧trace。

## 原子、保存与边界

状态严格为schema/initial/retreatCellId/commands。从初态完整重放每条命令，重建移动、时长、rng、行动与turn。重复ID/旧revision、旧状态/RNG失败或不可达全部失败，不提交半步移动或单独扣计数；输入不修改，调用方保留旧state。成功返回hazardState用于查看，不可用外部快照覆盖外层journal。保存仅初始与命令，读回同样重放；不能将这条新适配的保存冒充旧hazard原生trace。

普通数据输入经有界descriptor复制，拒accessor/symbol/稀疏/额外数组字段/自定义原型/循环。Node可用时拒Proxy，其他runtime不保证反射trap无副作用，只接受可信普通数据。文本save/load同限100万字符，标准JSON.parse重复键last-wins，不是防作弊或原字节认证。合法初值改写代表另一合成演练。

无P078及依赖、Closing奖励/受伤/世界写入、真实人物归属/伤亡、归零终结；没有扩大旧默认可移动域。只关闭限定合成地图上的“状态存在但无法安全撤退”缺口，不声称恢复原生路线/完整世界回城。仅静态编写，待独立审阅；未执行候选、测试、typecheck或build，运行未验收。
