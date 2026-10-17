# O09a 三方针普通单挑独立 session v1

日期：2026-10-17。实现：`packages/engine/src/ordinary-duel.ts`；[API](../engine/ordinary-duel-session-v1.md)；[固定来源与分项等级](../sources/duel-ordinary-session-v1.json)；[静态完整场景](../../data/scenarios/ordinary-duel-example-v1.json)。

本页覆盖可创建、预演、推进到HP胜负/50合平局、保存并从genesis重放的**普通单挑子集**。它不是全部单挑，也不是原生 PC-PK/PK1.1 认证。`evidenceLevel=translated-source-reference`、`nativeEquivalent=false`、`stockOriginalVerified=false`。原43组未决证据主题不减，E14原生全链仍open。新增代码、场景和正文仅静态编写与人工审阅，未运行测试、编译、build、checker、产品或诊断；历史通过数不适用于本树，旧默认全套food失败仍保留。

## 1. profile 与输入域

- `schemaVersion=1`；`profile=duel-ordinary-translated-reference-v1`
- `genericOnly=true`、`difficulty=source-normal` 均必须显式给出；完整 `policies` 必须逐字段等于导出的 `ORDINARY_DUEL_POLICY_V1`，不是只对比ID
- 恰好两名参与者，数组固定顺序为挑战方、被挑战方，每方一人；不得排序。每人仅有 `id,resolvedStrength,hp,spirit,stance`
- `id` 是session内唯一opaque字符串，ASCII字母开头，后接字母/数字/下划线/连字符，总长1..64；不映射真实武将。数值ID、personId、人物hook请求拒绝。把标签写成某个真实姓名不会授予其特例，调用者必须明确选择通用身份profile
- `resolvedStrength` 是已经解析的武力整数1..100；本profile不计算伤病、隐藏属性或装备。来源注释还允许110，本域上限100是工程限制，不是原作最高武力断言
- 创建时 `hp=1..100`，后续snapshot可为0..100；`spirit=0..300`；方针仅 `Attack/Defense/Spirit`
- 数字只能是安全整数，拒绝NaN、Infinity、负零、浮点数；对象只能是普通/null原型数据对象或稠密标准数组。拒绝accessor、proxy、循环、exotic prototype、symbol、隐藏字段、额外数组属性和函数；不调用caller getter、toJSON或迭代器
- 只支持具有 `process.getBuiltinModule('node:util').types.isProxy` 的可信Node运行时。缺少该能力返回 `unsupported-runtime`，不降级到无法识别proxy的模式；这里未运行任何运行时兼容性验证

创建不允许HP0、已有胜负或非零初始计数。没有与training-kernel-v2、部队、势力、城市、战役账户、P078/native任务、mission/return、俘虏、处斩、人员归属的连接。

## 2. 全量具名policy

完整常量既包含以下ID，也包含源表以外的数值域、动作名、限额和开关。Scenario保留 `policies`；Session和每个receipt保留完整 `policy` 与 `evidence`。不能在旧session中途改policy或删字段。

| Policy ID | 具体行为 | 等级 |
|---|---|---|
| three-stance-ordinary-only-v1 | 三方针、单次普通动作，关闭会心/反击 | provisional-engine-rule（取来源中的普通分支） |
| generic-identity-hooks-v1 | 全部人物hook恒等或关闭，包括伤害、先攻、必定格挡等；不查询人物数据 | provisional-engine-rule |
| source-normal-no-items-no-buffs-v1 | 来源Normal，无物品或buff；不推定原生难度映射 | translated-source-reference子域选择 |
| simultaneous-stance-at-exchange-start-v1 | 每次交换先同时选方针，再选行动者；无独立免费改方针命令 | provisional-engine-rule |
| pinned-source-speed-share-actor-v1 | reverse=false；较快者先排列，同速保留挑战方先；无人物或装备加成 | translated-source-reference |
| bounded-percent-lt-v1 | 原始有界整数，roll严格小于阈值；不声明原作PRNG或RandBool等价 | provisional-engine-rule |
| source-stepwise-integer-truncation-v1 | 完整duelScore平方份额与逐步向0截断，除法使用BigInt | translated-source-reference；实现数值表示为工程选择 |
| source-pre-write-hp-spirit-v1 | 两方斗志都读取HP写入前值；raw≤0先返回0 | translated-source-reference |
| source-hp100-spirit300-clamp-v1 | HP clamp0..100、斗志clamp0..300，requested/actual分别记录 | translated-source-reference |
| source-nondodge-blow-limit50-v1 | Hit/Block加1合，Dodge加0；HP胜负优先于50合平局 | translated-source-reference；固定默认50的子域 |
| bounded-generic-participants-v1 | 两个opaque ID、武力1..100、正初始HP | provisional-engine-rule |
| full-policy-genesis-recompute-v1 | 完整policy/evidence、每条receipt及终态逐字段重算 | provisional-engine-rule |
| bounded-history-reject-v1 | 4096条与16MiB等预算；耗尽原子拒绝，不制造平局 | provisional-engine-rule |

所有排除功能都是本profile关闭，不表示原作不存在。未来扩展必须新profile/policy/genesis，不能静默迁移旧存档。

## 3. 三方针静态表

固定Duel.cs:276–278，279行的Fury有意不纳入。

| stance | speed | hit | attack | block | attackSub | spiritGain |
|---|---:|---:|---:|---:|---:|---:|
| Attack | 42 | 71 | 16 | 12 | 3 | 4 |
| Defense | 10 | 200 | 14 | 90 | 2 | 8 |
| Spirit | 15 | 125 | 14 | 55 | 3 | 10 |

## 4. 命令、双计数及随机合同

唯一命令 `ResolveOrdinaryExchange` 的字段恰好为：`type,expectedRevision,expectedExchangeIndex,expectedBlowCount,stances,rawDraws`。`stances`必须是按原参与者顺序的两项方针。不存在 `result,hpDamage,attacker` 等覆盖字段。

每条接受命令：revision和exchangeIndex各加1；Hit或Block另使blowCount加1，Dodge不加合。初始三个计数均为0；revision/exchangeIndex工程域0..4096、blowCount0..50。revision不是合数。命令的三个expected值必须分别吻合。

有序原始随机项恰好为：

1. `{role:'actor-percent',bound:100,value:0..99}`
2. `{role:'hit-jitter',bound:10,value:0..9}`
3. `{role:'hit-percent',bound:100,value:0..99}`
4. 仅第3项未命中时才有 `{role:'dodge-percent',bound:100,value:0..99}`

命中只能3项，未命中恰好4项；第四项不能因为caller给了就消费。role/bound必须按序匹配，值为原始整数；不接受caller生成的Hit/Dodge/Block标签或最终伤害。所谓原始值是随机helper的有界返回值，不是EXE seed。百分比采用严格 `value<threshold`；threshold本身不再掷骰。

preview和execute均无外部RNG、无全局seed、无回调。receipt保存真实使用的3/4项与drawCount。拒绝时无随机副作用，输入也保持不变。未来外部seed适配器只负责产生这些值，不能因此宣称原生RNG。

## 5. 完整duelScore与actionRatio

所有除法向0截断，写作 `T(n/d)`；不能化简为武力差表，也不能合并逐步除法。实现以BigInt执行每处除法和份额乘法，结果在明确小整数域转回number。对每个self/other：

```text
hi=max(selfStrength,otherStrength); lo=min(...)
curve=T(max(hi-5,0)^2/1500)
decadeGap=max(T(hi/10)-T(lo/10),1)
x=selfStrength-lo
c=max(x+decadeGap-curve-1,0)*decadeGap
y=min(x,curve); z=y+decadeGap-curve
d=y*(curve-y)+T(y*(y+1)/2)+T(max(z,0)*max(z-1,0)/2)
duelScore=180+c+d
A=duelScore(self,other)^2; B=duelScore(other,self)^2
ratio(self,other)= A>=B ? min(T(A*100/(A+B)),99)
                            : 100-min(T(B*100/(A+B)),99)
```

弱方采用强方截断份额的补数，不能各自向下取整。双方ratio范围1..99；同武力50；100/95为55、80/75为52。receipt记录双方hi/lo、curve、decadeGap、x/c/y/z/d、score、score²及ratio。

## 6. 一次交换的唯一行动者

先把双方方针换成本次stances，保留交换前原方针和交换用方针两份快照。a初始挑战方、b初始被挑战方，仅当aSpeed<bSpeed交换顺序，同速不交换。

```text
speedShare=T(aSpeed*100/(aSpeed+bSpeed))
ratioAdjustment=T((ratio(a,b)-50)/2)
pActor=clamp(speedShare+ratioAdjustment,1,99)
actor-percent<pActor ? actor=a : actor=b
```

负ratioAdjustment也向0截断。receipt记录排序后双方ID/speed、两个分项、未clamp和最终阈值、唯一攻守方。来源还有物品/人物先攻修正，generic profile全部关闭。另一方不会自动追加一次攻击。

## 7. 普攻基础、命中与条件闪避

```text
n1=T(attackerStance.attack*ratio/50)
n2=T(n1*attackerStance.attackSub*7/27)
n=max(n2,3)
h1=T(attackerStance.hit*(100-defenderStance.block)/80)
h2=T(h1*ratio/50)
pHit=clamp(h2+hit-jitter,10,99)
```

hit-percent<pHit即Hit，否则才计算：

```text
diff=defenderStrength-attackerStrength
pDodge=clamp(10+T(diff/3),5,30)+(defenderStance==Defense ? 25 : 0)
dodge-percent<pDodge ? Dodge : Block
```

Defense的25在clamp后加；非Defense最终5..30，Defense30..55。命中分支receipt.dodge为null，不假装计算/消费了未发生分支。基础伤害和命中两次截断的中间值分别记录；普通格挡是未命中且未闪避后的结果，不是额外独立优先掷骰，也不反击。

## 8. HP请求与两项raw spirit

先计算结果分支前的n，再产生三元组；后续实际扣血不能回填为raw。

| 结果 | requestedHpDamage | attackerRaw | defenderRaw |
|---|---:|---:|---:|
| Hit | n | n | n |
| Block，守方Defense | max(T(n×3/10),1) | T(n×3/4) | max(T(n/2),1) |
| Block，守方其他 | T(n/2) | T(n×3/4) | max(T(n/2),1) |
| Dodge，守方Defense | 0 | 0 | n |
| Dodge，守方Spirit | 0 | 0 | max(T(n/2),1) |
| Dodge，守方Attack | 0 | 0 | 0 |

不纳入来源中的无敌早返或人物必定格挡。Defense Dodge保留完整n，不能与Spirit Dodge合并。Block只改变守方HP，`counterattackHpDamage=0`。

## 9. requested斗志：读取写入前HP

对攻方raw调用receiving=false，对守方raw调用receiving=true，即使Dodge也如此：

```text
if raw<=0: requestedGain=0，立即返回
minimum = receiving && stance in {Defense,Spirit} ? 5 : 3
v=max(raw,minimum)
v=T(v*stance.spiritGain/7)
if receiving: v=T(v*5/4)
if preWriteHp<30: v=v*2
else if preWriteHp<50: v=T(v*3/2)
requestedGain=max(v,1)
```

HP=30走3/2，HP=50无加成；必须两方都先算完requested，随后写HP。没有难度或剑修正。receipt分别记录raw、minimum、afterMinimum/afterStance/afterReceiving、preWriteHp、hpMultiplier、requested和actual；raw0时分项为0且hpMultiplier为none，表明早返。

例：n12、Defense Dodge守方HP100：raw12→T(12×8/7)=13→T(13×5/4)=16；不能融合为17。Spirit Dodge raw6→8→10。防御Block raw6→6→7。低HP倍率再作用于这些已截断值。

## 10. 原子writer与终局顺序

只在局部副本里推演，全部解析、分支draw形状与容量通过后才返回新session：

1. 守方HP=`clamp(preHp-requestedHpDamage,0,100)`；攻方HP不变；actualHpLoss=preHp-postHp
2. 双方spirit各自=`clamp(preSpirit+requestedGain,0,300)`；actualGain=post-pre，cap丢弃部分不再使用
3. revision与exchangeIndex各加1；Hit/Block blowCount加1，Dodge加0
4. 先判守方HP0：`hp-defeat`，winnerId=行动者、loserId=守方
5. 仍存活且blowCount达到50：`blow-limit-draw`，winnerId/loserId均null
6. 有outcome则status=finished，否则active；封存后的任何后续exchange拒绝

HP终局优先于同次第50合平局。实际只剩4HP时n12仍请求12伤害、raw仍12，actualHpLoss为4；不会因此减少双方requested斗志。没有负伤、反击、外部奖励或人物事件。

来源ActionAnim先产生requested值，随后写入；CalcResult/ActionEndPhase的HP结果到Closing早于剩余TurnEndPhase的50合判断。这里单参与者独立session立即封存是对该普通来源子域的工程表达，不模拟完整动画/多队员阶段机。

## 11. Session、receipt、容量与失败原子性

Session字段恰好 `tag,policy,evidence,genesis,snapshot,entries`，tag=`ordinary-duel-session-v1`。Snapshot含Scenario所有字段和 `revision,exchangeIndex,blowCount,status,outcome`。genesis必须正HP、三个计数0、active/null。entries各有完整command和receipt。

Receipt含完整command/policy/evidence，三个计数的前后值，原方针/交换用方针/最终参与者快照，双方score和ratio，actor排序及阈值，基础伤害和hit分项、条件dodge分项，结果、独立raw/requested/actual、消耗draws及outcome。没有只保存摘要替代完整依据。

共同预算：最多4096 entries、canonical UTF-8 envelope最多16MiB（16,777,216 bytes）、每次输入或生成envelope最多1,000,000值节点、深度32（根深度0）、任意数组最多4096项。所有create/inspect/preview/execute/save/load/replay都遵守；生成envelope也走与detach一致的结构限制。字符串/key的UTF-8预预算与canonical最终预算同时存在；JSON文本包括空白的UTF-8长度也不得超限。inspect的remainingEntryCapacity只是条数余量，不能承诺字节/节点余量足够。

preview与execute共同调用同一个append，连拟追加的完整history预算也一致。任何一个预算先到都返回history-limit，保持旧session原样；持续Dodge可以保持blowCount不变直到工程预算耗尽，不能改成原作平局。此预算是防无界历史的工程拒绝，不是游戏终局条件。

主要失败：

- malformed-data：缺字段/类型/非安全整数/负零、proxy或非plain-data等
- unknown-field：未声明字段（包括caller传入的结果覆盖字段）
- unsupported-profile / unsupported-policy / unsupported-action / unsupported-person / unsupported-item：不支持的显式请求
- unsupported-runtime：缺乏可靠proxy检测；evidence-mismatch：修改了完整证据身份
- invalid-genesis：非零初始计数、已结束/HP0的genesis
- stale-revision / stale-exchange / stale-blow：各自期待计数不符
- session-finished：终局后命令
- draw-shape / draw-range：随机个数、顺序、role/bound或合法整数值域不符；全局非plain数字先归malformed-data
- history-limit：共享条数、字节、节点或深度预算超限
- receipt-mismatch / snapshot-mismatch：重算与完整缓存不符

任何失败都不返回partial session、不修改输入、不消费外部RNG，不推进计数/日志。普通失败 `index=null`。加载/检查session先检查完整输入结构：能定位时附结构错误的entry index，外层/数组描述符错误可能为null，不承诺跨结构与语义两阶段的最小混合错误索引；进入历史重算后带首个失败entry index。replay单独按命令顺序检查，scenario/outer-list错误index=-1，命令结构、解析或执行失败带最早失败命令index。

## 12. 保存、加载和重放

`saveOrdinaryDuel`先严格重算整份session再输出canonical JSON，键排序、数组顺序不变。`loadOrdinaryDuel`限制文本后JSON解析、detach，核对完整policy/evidence，从genesis顺序重新执行每条command，逐字段比较receipt，最后比较完整snapshot；它不信任缓存HP/结果/日志长度。

更改draw、漏日志后保留终态、伪造outcome、错误revision、未知字段、policy内容替换均不能靠终态HP相同而通过。若同时修改genesis和所有commands/receipts使其形成另一合法历史，它是一份新的自洽记录；canonical JSON不是签名，不证明外部真实性。不同profile不能静默加载迁移。

`replayOrdinaryDuel(scenario,commands)`重新创建genesis，使用同一resolver/budget依次推进；失败报告首个command index且不返回看似成功的部分结果。先安全检查外层稠密数组描述符，再按索引逐命令detach、解析和局部推演，同时累计整个commands输入的节点、深度及字节预算。这样第0条动作错误不会被第1条NaN等遮盖；失败不返回任何局部推进结果。只有scenario或外层数组自身错误为-1。

## 13. 手算完整走通设计（未运行）

静态场景明确 `validationStatus=paper-design-not-run`，不是原生fixture或测试通过。两人武力100、HP100、spirit0、Attack；每次方针不变，draws为actor0/jitter0/hit0。手算双方ratio50、pActor50、pHit78、n12，始终挑战方行动：

| exchange | 守方preHP | 守方postHP | 守方requestedGain | 守方累计spirit |
|---:|---:|---:|---:|---:|
| 1 | 100 | 88 | 7 | 7 |
| 2 | 88 | 76 | 7 | 14 |
| 3 | 76 | 64 | 7 | 21 |
| 4 | 64 | 52 | 7 | 28 |
| 5 | 52 | 40 | 7 | 35 |
| 6 | 40 | 28 | 10 | 45 |
| 7 | 28 | 16 | 14 | 59 |
| 8 | 16 | 4 | 14 | 73 |
| 9 | 4 | 0 | 14 | 87 |

攻方每次requested6，终值54。第9次requested伤害12、actual4；exchangeIndex=revision=blowCount=9，挑战方hp-defeat胜出。此处手算覆盖低HP与writer设计；旧 `check_duel_continuous_core.py` 的raw0..13、HP100/sourceNormal/无剑专项只是参考文本，未被执行、修改或扩成session验证。

## 14. 排除项及后续证据债

Fury、会心、所有必杀、气合/坚守、无敌、宝物/装备、任何真实人物特例、换人/援助、退却、一击决胜、负伤、非Normal难度和多队员均不支持。显式额外字段/动作/方针请求拒绝，不能默认为“没效果”。舌战也不是本模块的功能。

后续开放这些动作，需要分别证明合法性、触发率、次数/斗志消耗、buff计时、writer、多击死亡顺序和人物hook；仅存在伤害公式不能证明可调度。完整原生PC-PK/PK1.1链、原始C++身份与stock/patch、Vanilla、PS2/Wii差异仍open。P078和相关native生命周期不纳入本轮。

## 15. 固定来源定位

现代仓库 `tankyc/sango_infinity` 固定commit `a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef`。来源自述从C++转译，不能当成已认证原始C++或原生EXE。

- [Duel.cs](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Duel/Duel.cs)：blob `d0e825097067c58c95c37e067d1c2a2688a74898`；UTF-8 142829 bytes；SHA256 `4c72e962a9b5dc07ae6bb26285c1e165a511c8c66d5b669520fd1d5b78e3ef07`
- [DuelPhase.cs](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Duel/DuelPhase.cs)：blob `9098e6541d84ac5b36ecafa6112beb082442c53f`；UTF-8 25227 bytes；SHA256 `90d1c7ff9b6a878ce9e3d0b1d29ed0609d8461cd8bca7c2a6779bd8578ffb5ad`

Hash定义为完整connector content原样UTF-8/LF，不归一化换行或空白；本轮独立静态审阅重新读取两份固定来源并核对文件元数据，不执行来源代码。

Duel.cs定位：HP/spirit上限33–37（HP在34，spirit在37）、默认50在67、方针276–278、CalcResult1746–1787、基础伤害1794–1805、actor1962–1988、ratio2214–2267、gain2271–2323、dodge2359–2369、damage/raw2573–2677、result2712–2744、单actor/actionCount2754–2774、ActionAnim2778–2825（raw→gain2790–2801、普通计合2815）、HPwriter3154–3164、spiritwriter3168–3181。DuelPhase.cs：ActionEnd657–705，TurnEnd397–429；两者共同支持HP优先于50合。
