# T02：合成施计者费用/资格事务 v1

模块 `inferred-strategy-caster-transaction.ts` 是新的显式opt-in入口，复用 [合成计略效果](inferred-strategy-effects-v1.md)，不改旧效果服务、默认profile或存档。只覆盖伏兵、内讧、妖术；旧空格火计适配不在本入口支持范围，不宣称完整火计/施计系统。

## 已读资料与新增推断

2026-10-30 实际读取仓库固定提交 `f84170228ca0ff98ead3d2887be993eef8088885`：

- [06计略](06-strategy.md) 的战场计略列表明确记录伏兵气力10、同讨/内讧气力20；本服务使用这两个既有记录值，而非城市AP。该文还要求伏兵适合部队/地形、内讧合法相邻组合，本服务不具备真实地图，不能声称恢复这些原生资格。
- 同文所读部分没有妖术明确费用，本profile选择**30气力**作为具名工程推断：高于双目标内讧20，以区分最多3目标控制；不是原始数值/拟合结果。
- 已读实际 `inferred-strategy-effects.ts`，其伏兵300兵、内讧双150兵、妖术1回合混乱及命中率均仍为已具名推断，不因接入费用而升级原生证据。

新policy标识 `inferred-caster-energy-and-group-target-v1`。命中/失手同样扣费并占用行动、目标组最高智力/任一免疫保护整组、不可自己攻击自己、固定允许策略列表及同一合成回合等都是本profile明确选择，不冒充原作完整资格resolver。

## 初始化：身份与属性不再逐次由caller任意填写

`createInferredStrategyCasterTransaction(initial)` 接受2..32个固定合成actor。每条严格只有：

`id, troops, intelligence, energy, strategies, available, immune, guaranteed, beautyBonus, confusedTurns`。

id为唯一 `synthetic-[a-z0-9-]{1,48}`；troops为1..100万；智力/气力0..100；strategies为无重复的ambush/discord/sorcery子集（可空，表示不可施计）；四个能力/可用性值为布尔；confusedTurns为0或1。初始化将这些actor一一建为旧效果服务单位，acted初始false。无真实武将ID、势力、归属、技能getter或位置字段。

actor的固定智力、免疫、必中、美人、可用策略/可用性从初始配置取得，执行命令不能覆盖；气力是事务余额，行动/混乱直接用同一旧效果单位状态。初值是用户声明的合成演练，不是原人物资格证据。所有目标在本profile视为可选择的其他合成单位，不增加真实敌我/距离/地形推断。

## 两类命令与事务

每条命令都有唯一合成id、expectedRevision，严格按journal长度递增。最多64条外层命令。

### cast

字段严格为kind=cast、id、expectedRevision、casterId、strategy、targets、roll。目标唯一且不含caster；伏兵1个、内讧2个、妖术1..3个。roll为0..99显式随机输入，不抽全局随机。

检查caster存在、available、允许策略、未acted、未混乱、气力足额；核目标都存在。接收的命中参数由固定配置计算：施计智力直接取caster；目标智力取该组最高值；任一目标immune则整组免疫；guaranteed/beautyBonus取caster。组判定仍只用一次roll，非逐目标独立roll。

然后以确定内部ID将cast交旧效果服务，再向同一服务发caster的act。两步都成功后才提交气力扣款、外层命令与回执：命中或miss都花10/20/30并acted=true；零兵/终结被旧效果拒绝、费用不足、混乱、已行动、目标不合法或任何第二步失败都整条失败，不暴露半提交新state。效果损耗/控制与费用/行动原子。气力恰好用完允许为0，因为它不是兵力归零终结。

### advance

字段仅kind=advance、id、expectedRevision。调用一次旧效果advance，合成turn+1、所有acted重置false、混乱递减；费用余额不恢复，避免凭空发放气力。施计资格和效果共享该一个合成turn，没有第二套caster时钟；不等同战役日期/真实旬调度。最多64条外层命令产生不超过128条旧命令，低于旧256容量。

## 保存与复核

状态严格只有schema、initial、commands；每次read/execute/save/load完整从初值重放，重建气力、旧效果状态、行动、turn及回执，不接受外部余额或独立effectState注入。只读返回effectState供查看，不是可以修改后塞回事务的入口。旧cast/act内部ID按外层顺序生成，与外层ID分离；外层重复ID、旧revision均拒绝。合法改写初值代表另一个合成演练，不是防作弊签名。

所有公共普通输入先有界descriptor复制，拒accessor、symbol、稀疏数组、额外数组属性、循环及自定义原型；异常失败返回。Node可用时拒Proxy，其他runtime不能保证反射trap无副作用，只接可信普通数据。保存/加载同限100万字符，标准JSON.parse重复键last-wins，不声称原字节唯一性。

这次闭合的是**合成caster的固定属性/允许策略、气力扣款、每回合行动与同一效果时钟**。真实地图资格、原技能条件、人物归属、伤亡、P078/Closing、真实全局世界写入仍不做；原AP不扣，不叠加城市费用。仅静态编写与待独立审阅，未执行候选、测试、typecheck或build，运行验收未完成。
