# 自动补给优先计划 → 既有独立资源账本 v1

日期：2026-10-28。基线 `c7af2158e02f1cca6a6c19d69c30211a8c7298f7`。
对应T20，实现 [inferred-automatic-supply.ts](../../packages/engine/src/inferred-automatic-supply.ts)。

## 真正新增了什么

此前 [planInferredAutomaticSupply](inferred-independent-planning-v1.md#t20-自动补给的纯优先级规划) 只输出建议。本批 `executeInferredAutomaticSupply` 消费其计划，调用既有 [executeFoodSupply / ManualSupply](../engine/food-supply-lifecycle.md)，在**同一已有 detached-food-supply 账本**里真正扣运输账户库存、增加目标战斗账户库存、同步1..4号兵装、按原选定profile更新目标气力，并写可保存/重放的命令和回执。

没有另造第二份资源状态，也不把返回计划的 `worldEffectsApplied=false` 改成“原生世界完成”。本消费者返回 `existingDetachedLedgerUpdated=true`、`nativeWorldEffectsApplied=false`；只陈述实际更新的独立账本。旧纯规划函数、既有手动补给和ConsumeTurn均不改默认行为。

## 证据与合理推断逐项

| 项目 | 本批采用 | 来源/边界 |
|---|---|---|
| 转移规则 | accepted=min(请求、源库存、目标空余)，余量留源；1..4号装备按受入兵量同步 | 复用既有 food-supply-lifecycle，来源与明确engine policies见其规则文档；不再写不同转移算法。 |
| 资格 | 源必须transport、目标必须combat、不同ID且同owner；每个目标adjacent必须true | 类型/owner直接核当前真实账本，邻接为显式供应事实；没有原地图时不假称验证物理相邻。 |
| 优先顺序 | 有粮缺口者按供应foodTurnsRemaining升序、ASCII ID同分排序；无粮缺口者按361排最后 | 沿既有 `inferred-food-horizon-priority-supply-plan-v1`，工程设计而非原AI算法。 |
| 缺口 | 当前容量−当前库存；匹配装备额外取装备空间上限 | **从经过重放的当前state推导**，调用方不能供应虚构deficit或旧库存。 |
| 食粮期限 | 每目标显式0..360整数 | 调用方评估/策略参数，不从兵力粗算冒充原耗粮；当前API不执行消耗，不自动选择目标。 |
| 批次事务 | 顺序消费每步后账本；只有全部成功才发布新session | 工程原子返回合同，不是原游戏调度或数据库事务；全程无外部可变状态写入。 |

所有原始资料等级沿 [独立规划](inferred-independent-planning-v1.md) 和既有食品账本来源，不新增未经读取的网络事实、原函数地址、原RNG或原AI决策主张。

## 输入及验证顺序

`executeInferredAutomaticSupply(session, request)`，请求严格字段：

```text
{ batchId, expectedRevision, sourceId,
  targets: [{ id, foodTurnsRemaining, adjacent: true }] }
```

1. 先调用原 `saveFoodSupply` 再 `loadFoodSupply`，完整核genesis、每条历史命令/回执与currentState；不信任调用方快照。
2. 请求为普通JSON数据，拒绝getter、symbol、稀疏数组、额外字段、负零、循环、异种原型；代理不属可执行代码沙箱支持域。目标1..64个且ID唯一，不得为源本身或保留sink。ID字符沿既有ASCII合同，batchId最多96字符，其他ID最多128。
3. Batch命令前缀 `auto-supply:<batchId字符数>:<batchId>:`；长度前缀防止允许冒号的ID互相前缀碰撞。此前任意历史命令占此命名空间即 `duplicate-batch`，**拒绝重复，不重发**；不宣称这是返回原成功回执的幂等API。原底层duplicate-command政策保留。
4. 新请求expectedRevision须等于当前revision。只基于这个已校验版本推导每个目标缺口，核源/目标资格和显式邻接；每目标期限0..360。
5. 调既有规划器按排序共享扣源预测，得到明确转移请求；无资源可转的目标跳过并列skippedTargetIds，不产生空转移历史。
6. 依计划顺序实际调用原ManualSupply，每条ID为上述前缀+排序后的原索引，expectedRevision取上一条实际结果的revision；不是所有条复用批次旧revision。检查消费者accepted三资源严格等于计划请求，否则整批拒绝。气力/装备/守恒验证仍由原消费者执行。
7. 全部目标都为零则 `no-transfer`，保持旧账本且不占用batchId；可以在资源变化后提交新批次。至少一条成功时返回最终session与每条真实receipt，revision按实际非零转移条数增长；turn不变。

## 失败与持久化

任何一步失败都只返回经验证的**最初session**和空receipts，绝不返回途中部分转移账本。若初始session本身无效，则session=null。输入不会被修改；内部临时不可变状态无人持有，不发生外部写入。

失败包括 invalid-session、invalid-request、invalid-target-or-adjacency、duplicate-batch、stale-revision、ineligible-source/target、planning-rejected、consumer-rejected、consumer-plan-mismatch、no-transfer。原消费者满历史4096、超序号/大小等仍是失败，不能被包装器绕过。外部整批提交需采用成功返回的完整session，失败时不得采纳中间对象（本API不提供它们）。

返回的session继续直接使用**原saveFoodSupply/loadFoodSupply**，所有实际命令及回执保留；重放不需要重新猜优先级。批次输入里的食粮期限/邻接与skippedTargetIds在本API返回的审计对象中，不新增到旧保存schema。若要复核“为什么此优先顺序”，调用方须同时保留这个返回审计；只有旧session也可复算所有实际资源变化，但不能复原未保存的优先级依据。重新载入后生成命令前缀仍存在，因此重复batch拒绝仍有效。

## 未运行纸面例

同owner运输源粮100、钱0、兵0，两个枪兵目标均留有100粮空间，期限A=0、B=1：规划A受100/B受0；执行A写一条真实ManualSupply账，源粮归0、A加100，B跳过。两个目标输入顺序颠倒也由规划器按期限排序。若期限相同，ASCII ID先者优先。

若第二次实际消费遭历史上限拒绝，即使第一步在局部计算成功，API整体失败并返回最初账本，不暴露第一步已扣资源的session。源库存被重复支出由规划器共享余额与每步消费者双重限制。目标/源身份字段、capacity、profile不改变。

以上仅静态逐句推导，不是运行结果。未运行测试、typecheck、build、编译或候选。

## 仍不包括

不创建/移动/解散原部队，不写人物/归属/伤亡/捕获/奖励，不碰P078与Closing；source兵0仍按原独立账户保留，不触发任何finalizer。无日期推进、耗粮、自动AI搜邻居、全局scheduler或现有GameState接线。T20只关闭“规划尚无这个既有消费者”的有限子缺口，不等于完整运输系统或原生世界结算完成。
