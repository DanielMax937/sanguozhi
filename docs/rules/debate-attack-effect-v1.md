# 舌战普通攻击、附加效果与胜负检查 v1

[API 合同](../engine/debate-attack-effect-v1.md) · [来源映射](../sources/debate-attack-effect-v1.json) · [纸面场景](../../data/scenarios/debate-attack-effect-paper-v1.json) · [实现](../../packages/engine/src/debate-attack-effect.ts)。

本批是给定已出牌与普通攻击方检查点的有界 `Attack → Effect → CalcWinner` 数据事务。它复用不变的 `evaluateDebateHpDamage`，并不复用假定普通怒气系数、提前崩坏／结束回合的旧普通回合核。不调用愤怒、TurnEnd、TurnStart、Critical 或 Closing；终局返回待分类检查点，非终局返回愤怒前检查点。不是完整阶段机、全回合或可直接执行的原生会话。

## 来源与适用范围

唯一算法参考为 `tankyc/sango_infinity` 固定 commit `a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef` 的现代 C# 翻译，不是原作 PK／Vanilla 已验证等价：

- `Project/Assets/Sango/Scripts/Game/Debate/Debate.cs`，blob `0137498d10773cd4596d497083ccdf6a26b3a261`，SHA256 `622789ca8b8b6799a321526dcfb513d6622adf5b5d54025175c2a7795ef7da28`。
- `Project/Assets/Sango/Scripts/Game/Debate/DebatePhase.cs`，blob `6aa98f855a5d4d172cde7e8ffc18a141b8a7b587`。
- `Debate.cs` 45–51：HP −100..1000、压力0..100；512–534：逐次钳制写入；1145–1209：HP／压力计算；1216–1297：平局、大喝、话题、无视、镇静和激昂；1380–1395：胜负顺序；1423–1479：攻击与单队效果；1568–1579：双队效果顺序。
- `DebatePhase.cs` 394–417：先 Attack，后 Effect，再 CalcWinner；非终局进入 Anger，终局转后续分类。

完整安全输入、有限域、固定政策、快照与收据是工程合同。人物与攻击力由调用者解析；`genericOnly: true` 限制人物伤害 hook 为恒等假设，不证明任何真实人物、书籍或专属行为。43证据主题／45历史快照原生缺口不减。P078及全部依赖、旧九会话、UI／AI／日志、教程、随机流实现与持久化均排除。

## 准入与衔接不是自动适配

检查点明确提供两队 personality、angerTimer、hp、stress、resolvedAttack、playedCard，以及 firstTeam、attacker、currentTopic；初始 winner 必须 −1、HP 正数，教程为 false。已出牌只接受1..14，故再考0／未出牌−1不属于本段：PR125已经负责再考并最终选择，不能在 Effect 中再生成手牌。

PR125的 currentTopic 是 signed32，本段由于复用的 HP 核只接受0..2而明确收窄；即使当前分支不调用HP核，也拒绝越界话题。不钳制、不取模、不静默替换；不能声称PR125任意成功输出均可接入。attacker 是调用者已解析值，本段不重新调用攻击方或可用性核，也不证明任意出牌／attacker组合源可达。

本段不携带或改写手牌、槽位、牌组、游标、再考额度、strength、combo、崩坏或回合元数据。调用者保留PR125已有元数据，以本段实际返回HP／压力覆盖后，补充PR126愤怒入口所需其余完整显式信息，并遵守其独立准入。非终局标记仅表示普通伤害后的工程边界，不是整个PR126输入已经构造或核验。终局绝不能送入要求初始正HP／winner−1的愤怒入口。

## Attack 精确分支

| 攻击方／牌 | 行为 | HP核调用／jitter需求 |
|---|---|---|
| attacker=−1 | 两队按队伍0、1各压力+15；不执行任何Effect | 0／空数组 |
| 无视12 | 对手压力+30 | 0／空数组 |
| 诡辩11，对手普通话题牌1..9 | 用诡辩方自身personality、timer、resolvedAttack计算对手牌伤害；伤害>0时反射给对手，附加该牌固定压力 | 1／一项 |
| 诡辩11，对手非普通牌 | Attack不改状态，随后仍可执行Effect | 0／空数组 |
| 大喝10 | 对手HP减伤害、压力+15 | 1／一项 |
| 其余（含镇静13、激昂14） | 默认TopicCard；对手HP减伤害并加牌压力 | 1／一项，即使计算结果为0 |

诡辩反射不是以原出牌者攻击力计算，也不是把伤害扣到诡辩方。普通牌压力按等级依次10／15／20；其余非大喝牌为0。HP公式完全由旧HP核决定，包含兴奋态人物系数，不能固定怒气系数10。每个需要HP核的分支恰消费一个role=`debate-hp-damage-jitter`、bound=5、value=0..4抽样；其余分支恰为零个。没有随机发生器、隐式抽样或多余抽样吞掉行为。

## Effect 顺序与反射

攻击后，即使已造成HP≤0，也不提前判胜，先按攻击方、对手顺序执行效果。攻击方无视12时，在其自身效果处理后抑制对手效果。平局直接略过整个Effect。

- 镇静13：先读取当时**对手**压力，计算 `−max(trunc(opponentStress/2),30)`。若对手已出牌为诡辩11，作用于镇静方自己，否则作用于对手。反射不改变计算量的读取对象。
- 激昂14：+40，通常作用于自己；对手诡辩时改为对手。
- 其他准入牌：无附加效果。

逐次写入均即时钳制，后一步读取前一步实际状态，而不是原始压力或预先并行计算结果。`CharacterAddStress` **不检查angerTimer**；正timer依然发生压力增减，只由HP公式使用timer选择系数。本段既不触发满怒也不拒绝初始满压力。

## CalcWinner 与终点

完成全部效果后，先检查firstTeam的对手HP≤0，则firstTeam胜；否则检查firstTeam自身HP≤0，则对手胜；否则winner保持−1。保留来源顺序，而不把attacker当成firstTeam。正HP准入和本段最多单一HP目标意味着双亡不是本段可达场景，不以人工注入双亡宣称覆盖完整来源。

胜负已定只返回 `terminal-pending-classification`，不选择CanCritical、Critical、Closing、胜利方式或奖励。未定只返回愤怒前检查点；不计算崩坏、不递减timer、不清已出牌或补牌、不开始下一回合。

## 验证声明

纸面场景为人工顺序推导，不是测试向量已运行。仅静态文字／来源阅读、人工审阅和字节身份核对；未运行测试、编译、typecheck、build、validator、checker、候选代码、来源代码、场景或replay。旧批次运行记录不认证本新增组合。
