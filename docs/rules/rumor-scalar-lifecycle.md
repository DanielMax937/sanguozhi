# 固定双城普通流言标量生命周期

更新：2026-10-17。O12-B 独立有限软件服务，profile 为 `standalone-rumor-scalar-v1`。见[工程接口](../engine/rumor-scalar-lifecycle.md)、[完整政策](../../data/catalogs/rumor-scalar-policy-v1.json)、[来源manifest](../sources/rumor-scalar-lifecycle.json)、[结构schema](../sources/rumor-scalar-lifecycle.schema.json)及[未运行静态场景](../../data/scenarios/rumor-scalar-example-v1.json)。

本服务在固定双城与普通人员名单内，内部生成成功判定、候选与稀疏选人、抗性及忠诚/治安损失，实际维护独立金/AP、执行者本旬次数、真实忠诚、治安、日历、随机状态及接受历史。调用方只选执行者和固定目标城，不能提交最终success、目标名单、roll或损失。所有具体公式、三人平均防守、关系保护、至多一人加空槽、义理阈值、loss分布、RNG、费用时点及即时结算都是新软件政策；不能当作原作公式恢复。

仅静态代码、规则和数据交付；没有运行测试、typecheck、编译、build、checker、诊断、schema校验、产品或示例。文中的数学例及检查义务均非运行结果。

## 1. 首要边界：不是原世界流言命令

每个profile声明与接受receipt必须显式保留：

| 声明 | 值与含义 |
|---|---|
| 原命令等价 | `originalCommandEquivalent:false` |
| 原世界动作 | `worldActionSupported:false` |
| 原被捕风险 | `originalCaptureRisk:"unresolved-not-modeled"`；未知，不是0 |
| 行程与任务 | `travelAndMission:"not-modeled"` |
| 失败外交后果 | `failureDiplomacy:"not-modeled"`；官方有此后果，本域不模拟 |
| 经验/功绩/技巧点 | `xpMeritTp:"not-modeled"` |
| 人物归属与离开 | `ownershipAndDeparture:"frozen-not-modeled"`、`ownershipFrozen:true` |
| 出贼与其他世界后果 | `banditAndWorldConsequences:"not-modeled"` |

官方原命令有期间，失败会降低外交关系；没有足够依据证明任一普通流言调用无被捕风险。本域即时结算和冻结归属不能消除原风险。要求把本次标量动作提交成原世界Rumor的调用，必须以 `unsupported-world-rumor-command` 拒绝，不收费、不抽随机。不能成功结算标量后再吞掉行程、外交、捕获或归属后果，也不产出等待其他模块执行的归属提案。

有限价值是比较智力、固定防守、计略府与人员抗性对独立预算和忠诚/治安标量的影响，支持付费失败、成功但无人掉忠、隐藏忠诚下降及可重放的多轮尝试。它不输出挖人、策反、夺城或原游戏最优策略结论。

## 2. 证据等级与当前基线

本批基线为 main `c9127cd5b911ef0b17e712379431562e741bd996`，提交树 `2a03082efa32d2d98f0df8d99ba5bdcb7bb4bbf0`。PR83 已交付 O12-A 固定驻城自然忠诚与现金褒赏；O12-B 不重做它，也不与其共享账户、RNG或存档。提交树身份不等于本批未提交工作树身份，更不证明本批经过执行验证。

- 官方PK手册支持流言200金、30AP、执行者智力越高及目标太守/君主/军师智力越低越容易成功，以及成功降低忠诚/治安、失败外交下降和有期间。这些定性方向与费用不证明下文任何精确公式
- 公开 `005D02A0..005D05AD` listing支持计略府参数10→12这一单独参数事实。它不证明本policy把10/12接入odds权重就是原贡献，也未补齐 `005BA410`、角色/名单helper、最终随机比较或RNG
- listing在 `005D0540` 与 `005D055A` 的助记符写 `sar dl,02/03`，旁列bytes为 `c1 fa 02/03`，存在操作宽度文字冲突；未运行解码、未修原资料，保留E
- `005D05B0`、`005D05F0`是独立后续函数的边界资料；谁负责selector、忠诚、治安及writer并未证明。success/effect分层不等于完整原成功概率已恢复
- 玩家百人城、300余次成功流言的观察反对全员同步同量下降；不能据此恢复“至多一人”、空槽权重或原分布。PC-PK玩家120→109支持隐藏忠诚层，不是1..12均匀loss的拟合依据
- 关系/义理的定性资料不足以证明亲爱绝对免疫、固定线性义理系数或相性gate。下文保护、阈值和忽略相性均公开为synthetic policy

官方PDF此次来源链仅有搜索索引读取记录，全文打开受47,138,551字节大小限制；未重新下载、核页或取得文件hash。公开listing的已取得blob为 `61de21c7a0924c83fc11066a7ffeeb1b8e2dc0ff`；UTF-8文本SHA-256为 `dc3725f31d44628284df98a27eaf7e2695b31289bbde40110093ccb01f0a4611`，不冒充原EXE身份。

## 3. 固定支持域

- 两个不同势力、两座不同城市，关系固定 `hostile`。攻击城只有1..32名普通固定驻城执行者；敌城只有0..128名普通固定驻城忠诚目标
- 防守固定包含太守、君主、军师三名不同角色ID，三人均不在执行者/目标普通名单内；智力均0..100。三职位已存在，不处理缺位、替补、任免或原角色回退链
- 执行者智力0..100，目标真实忠诚0..255、内部义理0..4；true loyalty是唯一权威状态，UI为 `min(trueLoyalty,100)`
- 目标普通名单是所提供的有限子场景全部名单，不能称为原世界整座城全体人员；执行者、目标和三防守角色的人员ID全局唯一
- 金/AP各0..1,000,000,000；目标治安0..100；预算与其他服务独立，没有共享余额适配器
- 日期年1..9999、月1..12、日1/11/21；advanceLimit为1..360，创建时要求整个配置推进窗口不越过9999年
- 每条关系边必须恰有一端为目标君主，另一端为目标普通人员；不能连接两个普通目标、执行者或固定太守/军师。有向likes可记录两个方向，但只有目标→君主保护；spouses/swornSiblings为无向pair。禁止自指/重复、未知端点，每人最多一个配偶，因此君主最多一位配偶；pair与名单在create规范排序，保存的genesis须已规范
- 身份、名单、能力、关系、城市/势力归属、位置与计略府固定。后续命令只能改金/AP、loyalty/security、lastUsedTurn、日期/turn/revision、RNG与历史

没有工资、自然掉忠、现金褒赏、登用、宝物、官职、部队、俘虏、死亡、任务、在途或迁移字段。不得把其他模块的保护、相性或自然忠诚条件隐式挪入本policy。

## 4. 完整新成功政策

`rumor-scalar-policy-v1` 固定下列算式，所有运算均在本域安全整数范围内：

```text
I = actor.intelligence
D = floor((governorIntelligence + rulerIntelligence + strategistIntelligence) / 3)
w = hasStrategyOffice ? 12 : 10
successWeight = (I + 20) * w
resistanceWeight = (D + 20) * 10
threshold = floor(10000 * successWeight / (successWeight + resistanceWeight))
roll = nextBounded(10000)
success = roll < threshold
```

threshold等号失败。三人平均、偏置20、权重拼接和分母10000全部是设计值；10/12仅有独立listing参数依据。没有暴击、必中、技能、难度、相性或其他隐含修正。不能把本域缺省当作原作不存在这些作用。

纸面算例，未运行：I=80，三防守60/70/80得D=70；无府权重1000:900，threshold=5263；有府1200:900，threshold=5714。这只说明新policy的算术，不是原作命中率样本或实测。

## 5. 成功后的稀疏selector与分离loss

严格按以下顺序消费本域随机流：

1. 先取 `requestedSecurityLoss=1+nextBounded(6)`。治安已经0也照抽；概率失败不抽
2. 按目标ID代码单元升序，派生每个人的保护理由。目标定向likes君主，或与君主为spouse/sworn pair则protected并排除；其余进入候选池。这个绝对保护是新设计，未认证为原作免疫。true0仍进入普通候选池
3. 空池不抽selector。池大小n>0时取 `slot=nextBounded(n+1)`；slot=n为空槽，无人入选；其余slot选择排序后的对应人员。一成功最多尝试一人，绝不是全城逐人扣忠；这一稀疏上限与空槽本身均为synthetic
4. 有选中者才取 `resistanceRoll=nextBounded(100)`。义理0/1/2/3/4的接受阈值固定80/60/40/20/10；roll严格小于阈值才接受损失，等号抵抗
5. 只有通过抗性者才取 `requestedLoyaltyLoss=1+nextBounded(12)`。1..12是新均匀有界draw的输出范围，不是由120→109单例估计的原分布
6. 独立写回 `securityAfter=max(0,securityBefore-requestedSecurityLoss)`；被接受人员写 `loyaltyAfter=max(0,trueBefore-requestedLoyaltyLoss)`；actualLoss均为before-after

loyalty120扣11为109，UI仍100；不能先clip100。true0或security0的actualLoss可为0，但仍消费本分支应有的全部draw。空池、全保护、空槽、义理抵抗均可能导致无人掉忠；成功只降治安或两标量实际都没变仍是已接受成功尝试。

相性、仁政、人心掌握、符节台均不参与本policy。关系保护、义理表、稀疏人数上限、忽略相性及饱和writer均是保真缺口，不提高原helper、原writer或stock证据等级。

## 6. 两种命令、真实费用与独立旬序

envelope为 `{id,expectedRevision,command}`，仅两种命令：

- `AttemptRumorScalar {actorId,targetCityId}`：目标必须为唯一固定敌城；执行者必须存在、本城普通固定驻城且 `lastUsedTurn !== turn`；需足额200金/30AP。全部资格检查之后才在detached draft抽随机，已接受尝试无论概率成功或失败都扣全额并写 `lastUsedTurn=turn`
- `AdvanceRumorTurn`：1→11→21→下月1，12月21→次年1月1；turn/advancedCount各+1。通过lastUsedTurn比较释放新旬机会，不抹掉历史标记

同一城市可以由不同执行者本旬多次尝试，没有每城每旬一次限制。初始化usedThisTurn=true映射lastUsedTurn=0，否则null。advance不补金/AP，不付薪，不自然降忠，不巡查或恢复治安，不推进原世界任务。费用不转给敌势力，不提供退款/回收命令。

200/30有官方依据；扣费时点、概率失败付全费、单人每旬一次、即时完成及独立日历都是本软件政策。不能把一次advance解释为原命令实际行程已经完成。

## 7. 独立RNG、顺序与draw预算

新 `xorshift32-nonzero-rejection-v1` 接受seed1..4294967295，state初值为seed、drawCount为0。每个raw draw依次xor-left13、xor-logical-right17、xor-left5，每步归一uint32。输出新非零state，取 `u=state-1`，总域M=4294967295：

```text
limit = M - (M % bound)
u < limit → 接受，value = u % bound
u >= limit → 拒绝，继续raw draw
```

bound仅来自10000、6、候选数+1、100、12。每次bounded最多32 raw draws，超出为 `rng-draw-budget` 并回滚整个命令；一次尝试最多5次bounded、160次raw。rejection避免直接模映射的不等桶问题，不宣称有限确定流独立，不认证原global RNG或原消费顺序。

每raw记录index、before/after state、bound、是否接受、value或null、label及targetId或null；label固定success、security-loss、target-slot、susceptibility、loyalty-loss。preview克隆RNG。输入/资格/预算失败、世界动作请求及全部事务失败均不消费真实流。

## 8. 原子性、幂等与完整保存重算

输入先完整验证。已接受ID的canonical envelope完全一致，包括原expectedRevision，返回原receipt和当前state，不再收费或抽随机；同ID异内容拒绝冲突。新ID才检查revision、资格和预算。

概率失败仍是已接受命令：revision+1、费用与actor机会提交、记录失败概率receipt。验证失败不占ID、不追加历史。计算、扣费、actor标记、标量写回、RNG及receipt都在detached draft整体提交；迟发容量或随机预算错误同样整体回滚。

preview不占ID、不预约预算；同state/envelope的preview与execute按合同派生同一receipt。每份receipt保留完整policy与边界、命令、revision/turn/date前后、actor资格、I/D/w和成功权重/阈值/roll、概率结果、排序候选与保护理由、slot/抗性/loss、true/display、费用、lastUsedTurn、全部raw draw与前后状态。

save保留完整canonical初态、完整policy、seed、全部接受envelope和receipt、最终snapshot及随机状态/计数。load/replay从初态经同一execute逐条重建，校验唯一ID、revision、每个中间预算、每份完整receipt和最终快照；不能把输入终态覆盖回去，digest也不替代逐值比较。未知版本、篡改、不可达state及超限整体拒绝。

policy同ID参数必须逐值相同；替代必须新注册ID/版本并保留旧解释。不能用最新默认覆盖旧save，不隐式迁移，没有原世界存档导入适配器。

## 9. 有限资源与静态审查义务

上限为1024条已接受命令（含推进和概率失败）、360旬推进、scenario规范JSON最多512KiB、完整保存最多8MiB、结构深度32、节点262144。完整保存预算包括初态、全历史、receipt和终态，而非只检查新增条目；各上限相互约束，不保证同时达到最大。结果包装的具体预算见[工程合同](../engine/rumor-scalar-lifecycle.md)。

提交新state前还预留当前state加任意历史完整receipt的幂等返回空间：分别按canonical UTF-8字节、节点、最大深度、原始字符串/key字节取历史receipt极值，最多核四个完整duplicate结果。后续较小advance也不能吃掉旧大attempt的幂等返回空间；因此新命令可能比只看自身结果更早整体拒绝，旧state的同ID重试仍返回原receipt与当前state。此检查不是额外扣费或占ID；load/replay每个中间state采用相同检查。

严格封闭JSON拒绝未知/额外字段、错误policy/profile、重复ID、undefined、NaN/Infinity、小数、负零、accessor、symbol/隐藏字段、自定义原型、循环及稀疏数组。ID为1..64位ASCII，首位字母或数字，其余为字母数字或`_.:-`。对象key及语义无序名单/关系按代码单元序规范；命令历史和RNG保持发生顺序。

未运行的审查义务包括：200/30与199/29、roll=threshold、120→109与UI100、零标量仍抽随机、空名单/全保护/空槽/抵抗、百人名单最多一人、乱序规范化、幂等冲突、付费概率失败、无副作用预览、月年旬边界及保存重算；容量和draw预算的迟发拒绝必须全回滚。它们不是已通过的测试清单。

## 10. O12与证据E/排除X保留

本批只补O12普通流言的独立有限数值软件行为。O12-A自然/现金已由PR83交付；已有相性纯核、普通登用决策、O10足额工资与O07官职不重复计成果。O12仍是一组原目标，原43不减少，45行旧快照不变成新分母。

原成功概率/角色/名单/helper/RNG、selector/loss、原writer、stock与跨版本等价继续E；完整原命令的行程、失败后果、捕获风险及世界动作继续X。P078及全部依赖、native人物/城市/势力归属、捕获、灭亡/继承、return/mission/relocation/finalizer、俘虏及欠薪后果均排除，不以remote或synthetic命名绕回。

宝物授予/没收的原value映射、没收AP、-30版本及顺序是E/未来较大物品范围，不是本批必须追加的模块。普通自建物品登记不等于被排除的native人物/城市/势力ownership；但纯忠诚delta也不等于完整物品授予。低忠下野等人物归属后果仍X。本批不追加宝物实现，不因有限流言存在而把整个O12清零。
