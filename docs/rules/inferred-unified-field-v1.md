# T02/T06：单一合成野战名册、火计与统一FieldTick v1

`inferred-unified-field.ts` 是新opt-in外壳；固定基线 `334ec4f23af32d0b20f3a05d61abc80f5d5d38f2` 下实际读取旧 `inferred-fire-lifecycle.ts` 和 `inferred-strategy-caster-transaction.ts`，并复用既有命中核、计略效果和火生命周期。旧服务与默认存档不改。

## 单一权威身份/兵力

状态只保存 `schema:inferred-unified-field-v1, cells, initial, commands`。`createInferredUnifiedField(cells,initial)` 接受1..16个唯一synthetic格ID、1..8个唯一synthetic Actor：

`id,cellId,troops,intelligence,energy,strategies,available,immune,guaranteed,beautyBonus,confusedTurns`。

synthetic ID格式沿旧服务，cell必须存在；troops1..100万，智力/气力0..100，混乱0/1，四个布尔严格校验；策略列表为fire/ambush/discord/sorcery唯一子集。初始acted=false，无火。位置和智力/策略/技能等配置固定；不同单位可同格，驻留火会覆盖全部同格单位。没有Move/teleport，没有真实身份/阵营/路径或游戏地图绑定。

重放中唯一权威 `roster` 包含id、cellId、troops、energy、acted、confusedTurns。所有四策略与驻留火都修改这一份兵力，绝不并列保留“火账本兵力”和“caster账本兵力”。旧消费者只从此名册临时投影，提交后临时服务状态丢弃；外部不能注入旧子服务快照。返回receipt中的before/after是审计快照，不是第二个可写状态。

## 临时旧消费者投影，不是重新发生事件

火消费者需要自己的初值/历史，而策略会改变同一兵力。因此每次需要火处理时，由当前roster生成临时旧fire初值，并用内部seed将活火剩余计数恢复为1/2/3。seed映射draw0/99和critical只用于表达剩余数，并核旧服务输出remainingTicks**完全相等**；不等则拒绝 `fire-duration-policy-not-projectable`。这不是重新掷寿命、不追加外层真实Ignite、不消耗外层随机数。真实FireCast原始durationDraw仍完整保留在外层journal；剩余寿命始终由外层历史推导。每次至多16个seed加一个动作，低于旧64命令预算。

普通策略临时投影同样使用当前roster兵力/混乱/acted，调用旧cast与act后把变化收回同一名册。不会接受旧服务独立推进后再回填历史。新外层是唯一真实回放合同，不能拿临时服务receipt当从原genesis开始的原生历史。

## 命令：32条固定预算

`executeInferredUnifiedField(state,{id,expectedRevision,action})`：id唯一，expectedRevision等于外层命令数，最多32条。

### FireCast

action严格为`{kind:'FireCast',casterId,cellId,fireId,roll,durationDraw}`。先核同一roster施计者可用、允许fire、未行动、未混乱、至少10气力；目标格存在、不是施计者所在格、没有活火；fireId不能是此前成功点燃过的ID（熄灭也不重用）。roll与durationDraw各0..99。

命中核复用 `decideInferredStrategyHit('fire',...)`。有占格者时取该组最高固定智力，任一immune则整组免疫；空格目标智力0且不免疫。这是明确工程选择，不是原生格资格/目标解析。必中/美人取施计者固定配置，仍沿旧免疫优先顺序。

合法命中调用实际旧Ignite（critical=false），产生火源；合法miss不点火，但**同样扣10气力、acted=true**。所有前置条件和子结果成功才提交。旧策略火70/30寿命分布仍是fallback，不升级原生证据；durationDraw只在命中有实际效果，miss仍要求其格式合法。没有即时额外火伤；火伤在FieldTick统一结算。

### Cast

action严格为`{kind:'Cast',casterId,strategy,targets,roll}`，strategy为伏兵/内讧/妖术。同一名册资格门；目标不得含自己，数量沿旧服务1/2/1..3。最高目标智力/任一目标免疫沿已有caster合成选择；调用旧效果服务并旧act，再统一扣10/20/30气力。命中/miss均占用同一个acted，不能同轮再改用火计绕过。

伏兵10、内讧20、火计10沿仓库 [06计略](06-strategy.md) 记录；妖术30是 [caster具名推断](inferred-strategy-caster-transaction-v1.md)。旧伤害300/150、混乱1期及概率仍明确推断，非原作恢复。任何归零/非法目标/不足费用整笔拒绝。

### FieldTick

action严格为`{kind:'FieldTick',draws:[{targetId,draw}]}`。draw0..200，必须覆盖**全部当前着火格占格者**，次序严格按genesis名册。空受影响集须空数组，不允许caller少报目标。

同一次事务先实际调用旧fire Tick：全部驻留火伤成功后递减寿命/熄灭；再由受伤后的同一名册调用旧策略advance，清除/递减混乱并重置acted，最后外层turn+1。任何一个单位将归零、draw不完整、子服务失败或预算失败，则火伤、熄灭、行动恢复、气力、turn全部不提交。每个成功Tick不恢复气力。

先伤/寿命后恢复的顺序是本具名policy，不能当原caller证明。火子投影内部tick=1只是一次临时计算；外层turn才是唯一合成时钟。最多32命令、8单位，且显式累计火伤命令≤256，不能通过重新投影悄悄绕过旧有限损耗预算。外层32命令也限定总策略次数，不声称无限运行调度。

## 保存与实际边界

read/execute/save/load都从固定genesis+外层journal完整重放，派生fireId使用史、名册、火源与turn。无外部余额/火源快照入口。状态文本超10万字符即拒绝，保存/加载同限；标准JSON.parse重复键last-wins，不是防作弊或原字节认证。普通输入经descriptor有界复制，拒accessor、循环、symbol、自定义原型/稀疏等；Node可用时拒Proxy，其他runtime不保证反射trap无副作用，只接受可信普通数据。

已真正合并：四策略共享同一施计身份/气力/行动/混乱/兵力，驻留火与计略共用唯一名册，FieldTick一次原子推进火源和行动恢复。尚未合并：真实地图移动、城市军团AP、真实人物/归属、原技能getter或全局world scheduler。无P078/Closing、死亡/解散/占领/奖励，零兵终结始终拒绝。无需也不提供子服务独立advance入口；旧服务单独使用语义不被改写。

仅静态实现待独审；未执行候选、测试、typecheck或build，运行验收未完成。
