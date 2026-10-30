# T28：固定合成宝物快照的自然忠诚旬调度与装备只读投影

状态版本 `inferred-treasure-turn-projection-v1`。只增加 opt-in wrapper，不改变旧宝物、没收、人事服务或其存档。范围是**一个固定宝物快照之后**的自然忠诚时间线和按该快照持有关系计算的装备视图，不是可交错授予/没收的统一世界账本。

## 实际资料与复用

1. [自然忠诚普通候选](natural-loyalty-candidate-boundary.md) 保留公开caller的普通三OR候选、豁免/季度边界、相性helper来源与native writer/RNG未知项。本批实际复用 [personnel-loyalty-lifecycle](personnel-loyalty-lifecycle.md) 的 `createPersonnelLoyaltyState` / `executePersonnelLoyaltyCommand`；不重新造“每旬固定减1”之类公式。
2. 该旧服务按1/11/21日推进，在季度入口处理普通名册；保留关系/仁政豁免、人心掌握、已有源形状降量及local xorshift RNG。相性adapter不同来源、符节台原listing带修改标记等局限仍沿旧sourceBoundary，不能因为wrapper能运行就升级为原生证实。俘虏不支持。
3. 宝物持有关系只来自旧 `readInferredConfiscationLedger` 的完整重放，内含已验证 `inferred-treasure-ledger` 授予历史。没有第二份独立holder表可编辑。
4. 已读 [treasures.json](../sources/treasures.json)：43条社区资料的effect是“单挑斗志率上升”“单挑攻击力上升”“可用暗器/伪退”“舌战全话术”等定性效果；不提供五维属性数值加成。地点/持有人属于该资料指定剧本，不导入本合成世界。

## 装备：资料定性效果与明确数值推断分离

`baseStats` 每位合成人员一条，字段 `{officerId, stats:{leadership,war,intelligence,politics,charisma}}`，基础值0..100。必须恰好覆盖快照全部人员。

`equipment` 每个快照物品一条 `{itemId, sourceIndex, inferredBonuses}`，inferredBonuses是同样五维、每项0..100：

- `sourceIndex` 为treasures.json数组0-based索引或null；使用索引避免重名宝物混淆。非null时物品value必须与该资料条目value相同，作为显式绑定一致性门；这不证明它就是原生物品ID或历史实物。
- null代表纯合成物品，没有可归属资料effect。
- 所有**数值bonus都明确由调用者提供、属于推断**，没有自动默认某把名剑加武力，也不将宝物value当作五维属性加成。
- 新具名设计policy `explicit-max-per-stat-cap255-view-v1`：同一持有人各项取持有物品bonus的最大值而非相加，输出 `min(255,base+bonus)`。在当前base/bonus范围内最多200，255上限是命名策略边界，不冒充原作上限。
- 资料effect仅原样作为 `documentedEffect` 展示，`effectExecuted:false`；不会触发单挑/舌战/撤退、奖励、技能或永久成长。无物品持有则bonus全0；府库物品没有目标，不给任何人加成。

数值绑定可以在**新会话配置**中替换，但已保存会话内不可边推进边改规则。未验证的数值推断不覆盖原始资料字段。

## 创建与严格绑定

`createInferredTreasureTurnSession(initialConfiscation, personnelScenario, baseStats, equipment)`：

- 初始没收快照由旧服务完整重放；即使无没收，也需用旧 `createInferredConfiscationLedger` 包装授予账本，不传伪造余额对象。
- personnelScenario是旧自然忠诚完整合法scenario；固定force/ruler/city及所有officer IDs须匹配 `synthetic-[a-z0-9-]{1,48}`。
- 人员集合必须与库存快照完全一致，每位初始trueLoyalty必须逐ID等于该快照loyalty且严格正值；不得漏人、换人、重置为100或重复加授予收益。
- scenario.city.gold固定0（自然推进不花金），AP必须等于快照剩余AP；以后仅自然推进，不开放CashReward，故两个资源始终不被本wrapper消耗。
- 日期、季度节拍、关系、性格、技能、seed与advanceLimit均由旧scenario验证，完整持久化；`initialDateAlreadySettled:true`保留。宝物账本本身没有日期，因此开始日期是**显式合成锚点**，不宣称验证了历史授予/没收发生时间。

## 旬调度、零值门与重放

`advanceInferredTreasureTurn(state, command)`只接受 `{id, expectedRevision, type:'AdvanceTreasureTurn'}`。id须合成格式，revision连续、id唯一；重复ID（即使换revision）拒绝。不接受外部期号跳跃、批量补扣或真实游戏命令。最多128次成功推进，且不能越过旧scenario的advanceLimit。

每条实际调用旧 `AdvancePersonnelTurn`；它在纯候选中计算完整自然变化/局部RNG/回执。若任何人员结果trueLoyalty为0，**整条wrapper失败**：不返回新state、日期/RNG/命令不提交、没有局部成功。保留旧输入，禁止将旧服务原本允许的零忠诚结果带入本wrapper。不碰归属、离反、伤亡、Closing。

`readInferredTreasureTurnSession` 每次从初始库存、完整scenario与全部wrapper命令重放；输出当前自然personnelState、日期、回执和按固定库存推导的装备视图。当前忠诚唯一来自本会话的自然状态；初始库存中loyalty只是绑定时历史值，不可作为当前忠诚再次花用。

save只存初始库存的原journal、绑定scenario、baseStats/equipment及wrapper命令，不存一份可编辑最终余额/holder/bonus快照；load同样重放。JSON文本最大200万字符，标准JSON.parse重复键last-wins；不是签名或防作弊协议。合法重写全套初值意味着新合成场景，不认证原历史。对象输入descriptor有界复制拒绝accessor/symbol/循环/稀疏/自定义原型；Node支持时拒Proxy，其余runtime不能保证Proxy反射无副作用，只接普通可信数据。

## 明确未闭合的接口

**本会话期间不允许授予、没收、导入新库存或改变持有关系。** 原treasure服务只能从自身初值+授予journal重放；原confiscation服务固定一份授予快照；旧personnel服务不接收宝物忠诚delta。把自然结果覆盖旧库存初值会改写历史并可能重复计算授予收益，故不做这种“同步”。

要继续授予/没收，需要新的明确可交错事务合同；本模块不会自动切换会话或把已自然下降的忠诚重新基准化。外部若继续执行旧库存API，其结果是另一条未协调时间线，**不得称为本session继续**。此次是最小固定快照闭环，不是完整共用忠诚账本或全局战役。

基础属性不会写回人员，装备不能影响本session自然忠诚的性格/关系输入；五维只读view不可当永久升级。没有P078及依赖、真实人物归属、伤病、Closing奖励/世界写入、用户电脑或Cloud任务。

## 验收状态

仅静态：核旧自然服务复用、季度而非每旬固定扣减、库存/名单/忠诚/AP逐项绑定、item sourceIndex和值匹配、bonus明确推断不从value生成、全序列去重重放、零值整条拒绝与输入不变。未执行候选、测试、typecheck、build或重放；运行验收未完成。
