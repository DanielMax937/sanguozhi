# T05 有限正兵全旬零粮边界提案

此候选只提供临时纯提案，不建立第二 troop ledger/时钟，不自行调度/提交。静态读写，无测试、构建、typecheck、候选执行或远端操作。D 有效政治粮耗候选保持冻结。必须待 owner 原子集成和独审后才能称有限消费者闭合。

## 实际依据与具名推断

来源为 `san11-hg-owner-gap-contract-20261030` 的固定归档（该合同说明源 main d417ecce 与已交付候选）。完整文件复制到本目录 evidence，并在 manifest 记录散列：
- `inferred-rule-requests.ts:21–34` 的 `projectInferredStarvation`，每次边界使用 BigInt 计算 floor(before*76/100)，输出 request/steps，自身不写 world。
- `inferred-positive-hazard-ledger.ts:64–70` 已调用同一 projector，projectedRemaining===0 拒绝，不运行终结。
- `47-food-overlap-starvation-exactness.md` 明确旧 0.76 provenance unresolved，不能标原生/实证高置信；0059BF40 已零粮直接 skip，扣至零仅消息，饥饿属于另链，不能拿设施围城伤亡路径补野战饥饿。

本叶**实际 import 并复用** `projectInferredStarvation`，不复制发明新减兵率。不调用旧 persistent hazard ledger 或任何 whole-season API。该源模块还导入 city data/ability research供其他导出使用；本调用只进入 starvation 纯函数，无 health/人物/Closing/P078 调用。

新调度推断名 `inferred-whole-zero-food-tick-retain76-positive-v1`，算术仍为既有 `inferred-legacy-76-percent-retention-v1`。无完整原生首旬、持续和跨核顺序证据，不包装为原生 fidelity 已闭合。

## 唯一 API / 数据权威

`projectSyntheticStarvationBoundary(rawContext,rawPolicy)`

```
policy={profile:'inferred-whole-zero-food-tick-retain76-positive-v1'}
context={
 turn,
 eligibleActorIds:[actorId],
 currentRoster:[{id,ownerId,role:'resident'|'deployed',troops}],
 foodAllocations:[{actorId,food}]
}
```

导出只读 `SyntheticStarvationBoundaryContext` 与 `SyntheticStarvationBoundaryPolicy` 类型供 owner 编译期对齐，但 raw 参数仍强验证。context 必须由 owner 从同一当前重放状态生成，**不得作为用户可自报的 action 参数**。

完整固定名册 1..64，合成 ID 唯一且不与 owner ID 混用；所有当前 actor 恰一个 food allocation（非只交受影响 subset）。resident troop=0/food=0，deployed troop 1..60000；food 0..50000。eligible IDs 唯一、均存在、deployed、当前粮0；未知/重复/居民/正粮目标均拒。空资格集合是合法 no-op receipt。

只能从 shape 验证当前关系，不能凭输入知道是否故意遗漏一个合格 actor 或伪造此前补给史。**完整 eligibility 与名册身份由外层唯一 root genesis+journal 重放证明**：叶不能接受 eligibility=true 替代，也不声称 standalone API 能证明全旬事实。

## 边界与 phase 合同

1. owner 在唯一 world turn 上保存 `zeroFoodBoundaryTurn` 与 `deployedTurn` 作为历史证据（不是独立推进时钟），从已 deployed、当前 food=0 且真正跨过完整零粮边界的固定名册推导 eligible。具名初值/首旬约定：genesis 独立敌方已部署零粮可视 T0 边界；home 当旬 Deploy 零粮不算完整边界，首次 Tick 跳过，下一次才可能符合。Tick 结束仍0才记录新的 boundary；不能从任意当前 food0 直接宣称完整一旬。
2. 在当次粮耗、补给与火/既有地形正值伤害之后，恢复之前调用。本次从正粮耗至0者不加入。任何动作获得正数量粮即清除其 zero-food 证据，即使同旬后来又失为0也等待新的真实边界；Tick 过程中的正数量补给同样剔除资格。owner 应覆盖实际 ManualSupply/袭粮等所有正粮获得事件，不只检查 Tick 内补给。
3. 以此时唯一当前 field troops 而非 Tick 开始旧兵数调用；owner 构造完整 currentRoster/current food。无自由用户指定 wholeHungryTurns，本叶对每个目标固定传 1。
4. eligible 按固定 code-point actor ID 排序。每个目标恰一 patch `{actorId,ownerId,troopsBefore,troopsAfter,loss}` 与完整 projector request；不随机，不按数组偶然顺序。
5. 任一个 projectedRemaining=0，返回失败且不暴露部分 patch；整次 Tick 必须撤销先前粮、火、日期、AP、RNG等全部提案。不钳1、不跳过危险目标、不只提交安全目标，不走死亡/删除实体/人物伤亡路径。
6. 全部目标成功才返回冻结 `{ok:true,troopPatches,receipt}`；外层再与后续 recovery 等所有结果一起提交，核对 troopsBefore/ownerId 与同一 current state，不能分批落地。

本叶只验证 turn 是合法整数，不自行确认下一旬、不做去重。外层现有命令ID/expectedRevision/原始history保证一次边界只计一次；重放相同数据只是还原 proposal，不能二次扣兵。没有额外 AP/energy 恢复或费用，也不修改食粮、忠诚、人物、health、身份、归属。

## 静态验收边界（未运行）

- 100 正兵、完整零粮边界 → projector 给76；1兵 → projected0，整个 Tick 拒。
- 本旬才耗尽不扣；home Deploy 零粮首次 Tick 不扣；正粮获得清证据；居民不扣；未知/重复eligible拒。
- 当前火伤后正兵作为输入，若其后饥饿触零拒整单；不能按火伤前兵力计算以逃避零保护。
- fixed roster/allocation bijection和排序可静态核查；完整资格、阶段顺序与原子提交须在 owner 整体独审。
- 只覆盖 field 部署部队，不声称 transport、市内兵、全部原生饥饿已覆盖；运输有独立唯一 troop owner 时不能投影为同一 field 再重复扣。

## 当前整批接线状态

以上“待owner接线/集成”描述仅是本纯叶独立交付阶段的能力边界，不是当前累计候选尚未接线。当前本地整批已由[唯一owner规则](unified-repair-starvation-owner-v3.md)接入同一WorldTick和完整原子重放；整批独审与远端发布分别核验，纯叶PASS不代替整体或运行验收。旧默认保持，受限终结仍排除。
