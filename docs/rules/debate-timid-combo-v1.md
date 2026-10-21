# 舌战胆小待执行连打核 v1

日期：2026-10-21。实现：[debate-timid-combo.ts](../../packages/engine/src/debate-timid-combo.ts) · [API 与审计合同](../engine/debate-timid-combo-v1.md) · [固定来源与完整政策](../sources/debate-timid-combo-v1.json)。

`evaluateDebateTimidCombo` 是独立纯求值入口，profile 为 `debate-timid-combo-reference-v1`。它从**刚由胆小进入产生的待执行检查点**开始，按固定现代参考 `ComboAttack()` 的物理下标循环完成一次连打，再关闭 combo。它不是一般攻击、愤激进入、完整愤激阶段、回合或 session。

本核只支持已解析的胆小攻击方、timer=1、counter=0、显式通用恒等伤害 hook，以及调用者提供的 attack 和逐击 bound5 原始值。它不会从人物智力生成 attack，不查人物行为，不取得真实随机数，不补牌，不判断胜负。成功只证明输入在这个有界合同内得到确定结果，不证明检查点由完整开局历史可达。

## 1. 固定来源与证据身份

依据为 `tankyc/sango_infinity` commit `a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef` 的现代 C# 翻译参考。以下文件身份继承已留存来源账本；本批静态阅读固定文本，不声称重新下载、重新计算来源哈希或执行来源。

| 固定文件 | Git blob | 用途 |
|---|---|---|
| [Debate.cs](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs) | `0137498d10773cd4596d497083ccdf6a26b3a261` | 连打、伤害公式、手牌压缩、逐次 HP/stress 写入 |
| [DebatePhase.cs](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/DebatePhase.cs) | `6aa98f855a5d4d172cde7e8ffc18a141b8a7b587` | 连打与外层胜负检查、第二次进入、TurnEnd 的边界 |
| [DebateEnum.cs](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/DebateEnum.cs) | `5b46a8ac87613193eb9f4b99a25e489ba6f5e483` | 普通话题牌码和性格符号；部分枚举自述由实现归纳补齐 |

精确归因：

- [`Debate.cs 42–57`](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L42-L57)：HP 下限−100、上限1000、stress 上限100、7槽物理手牌；[`122–150`](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L122-L150) 与 [`212–217`](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L212-L217)：运行时字段与 combo 字段。
- [`343–391`](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L343-L391)：一般存活人物容量4..7、性格解析、胆小进入 timer=1。人物查询及容量推导不在本核内。
- [`453–466`](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L453-L466)：删除指定物理槽后清空7槽，只稳定压缩活动前缀中的非空幸存项。
- [`512–534`](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L512-L534)：HP 与 stress 的逐次 clamp writer。
- [`554–566`](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L554-L566)：一般初始化 attack 的智力公式及随后 `ModifyAttack`。这里只用于说明输入边界，不执行该初始化。
- [`845–851`](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L845-L851) 与 [`874–895`](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L874-L895)：对手队伍和普通牌等级。
- [`1128–1196`](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L1128-L1196)：`CalcAttacker` 与 `CalcHpDamage` 分立；本核只使用后者在愤激胆小普通牌上的有界通用分支，不执行牌力胜负选择。伤害公式后仍存在人物 `ModifyHpDamage` 调用，不能默认为所有人物恒等。
- [`1328–1354`](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L1328-L1354)：胆小进入设置 attacker、counter=0、combo=true。
- [`1356–1377`](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L1356-L1377)：本核主体的递增下标、逐击写入、删除、计数与循环后的 combo=false。
- [`DebatePhase.cs 333–390`](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/DebatePhase.cs#L333-L390)：`CalcWinner` 位于整次 `ComboAttack` 返回之后，而非每次命中之间。

[`DebateEnum.cs 33–61`](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/DebateEnum.cs#L33-L61) 固定0为再考、1..9为普通话题、10..14为五话术；−1为空槽。话题牌1/4/7为小、2/5/8为中、3/6/9为大。[`116–124`](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/DebateEnum.cs#L116-L124) 固定胆小等四性格符号。

这不是 clean stock EXE、PC-PK/PK1.1、Vanilla、主机版本或原生 PRNG 的运行证据；不把现代源码身份、代码注释或本核工程政策升级为这些版本的认证。

## 2. 输入只承接新产生的胆小 pending 检查点

公开输入包含 `schemaVersion:1`、上述 profile、完整固定 `policies`、`genericOnly:true`、按队伍0和1排列的 `characters`、`combo`、`resolvedAttack`、`rawDraws`。固定常量为 `DEBATE_TIMID_COMBO_POLICY_V1` 与 `DEBATE_TIMID_COMBO_EVIDENCE_V1`；完整类型与拒绝合同见 [API](../engine/debate-timid-combo-v1.md)。

每方 `Character` 与 [PR115 单次愤激进入核](debate-anger-entry-v1.md) 的数据形状一致：

- 有效 `personality` 为 `timid|calm|bold|reckless`，整数 `strength=1..100`。
- 整数 `hp=-100..1000`、`stress=0..100`、`angerTimer=0..4`。
- `maxCardCount=4|5|6|7`，`hand` 恰好7个物理槽，槽值为整数−1..14。
- 保留重复牌、内部空洞、非再考的0槽，以及活动前缀外的有值槽；不预先整理输入。

本核额外要求 `combo={active:true, attacker:0|1, counter:0}`，并要求所指攻击方的性格为 `timid`、`angerTimer=1`。另一方不要求 timer=0 或 stress 未满；双方HP也不要求大于0。源 `ComboAttack` 本身并不验证这些新 pending 条件，它们是本版本选定的准入范围，不能宣传为覆盖任意来源调用状态。

`strength` 随检查点原样携带但不参与连打计算；`maxCardCount` 是调用者已经解析的容量，不从智力重算。`resolvedAttack` 是攻击方本次稳定使用的整数70..227，不是武力，也不是由这对 Character 自动推导的值。

来源初始化默认式为 `100 + trunc(40 * (myInt - opponentInt) / (131 - myInt))`，之后还能被 `ModifyAttack` 改写。若双方智力另行限定1..100且 hook 恒等，默认式落在70..227；本核只是采用这个有界通用标量范围，**不读取智力、不执行默认式或 hook、不核验该标量与某个人物/智力对一致，也不声明任意MOD的完整值域**。

`genericOnly:true` 声明本次采用通用恒等人物伤害分支。它不是人物身份检测或获得自定义能力支持的开关；`ModifyHpDamage(self, opponent, card, n)` 可以依赖双方人物及牌，非恒等行为、人物配置查询、任意 hook 回调均不在合同内。也不因为提供一个范围内的 attack 就宣称完成了人物初始化或验证了真实人物的通用性。

不接收当前 topic：在所接纳的愤激胆小状态，`topicCoef=10`，不再检查普通牌与当前话题是否一致；`angerCoef=10`，不会进入冷静的15分支。这一省略依赖严格的胆小/timer准入，不能推广到非愤激或其他性格的普通伤害核。

## 3. 固定下标读取当前手牌，不是先收集所有话题牌

设攻击方容量为 `m`。来源从物理下标 `i=0` 开始，每次循环结束固定 `i++`，直到 `i=m`。**每次都读取当时手牌的第 i 槽**，而不是读取原手牌快照的第 i 槽。

当该槽不是1..9时跳过：包括−1、再考0、五话术10..14。跳过不产生伤害、移牌、计数或随机消费。没有“从1槽开始”的连打限制，也不调用普通选牌可用性或 `CalcAttacker`；所以明确提供在0槽的普通话题牌会命中。

普通话题牌命中时，严格依次进行：

1. 消费下一条 bound5 jitter，计算本次请求HP伤害，再以它计算请求stress伤害。
2. 对唯一目标，即攻击方的对手，先执行HP写入，再执行stress写入。
3. 来源记录日志并可能调用表现层；本纯核不执行日志、视图、动画或外部可变回调。
4. 移除攻击方当前第 i 槽，并按第4节重建物理手牌。
5. `comboCounter++`，然后外层 `i++`，进入下一个下标。

循环中不改变容量，不排序，不重抽，不补牌，不重置 i。也不能改成 `while (仍有话题牌)`、反向循环、删除后 `i--`，或提前建立待打牌清单。这些改写都会吞掉来源的跳过行为。

全部扫描结束后，无条件把 `combo.active` 设为false，保留 attacker，把 counter 留在实际命中次数。零命中同样关闭 active，但counter仍为0。攻击方的timer不会因连打完成而被清零或递减。

## 4. 删除压缩会让后续牌越过未访问位置

一次 `CharacterRemoveCard` 的顺序为：将选中槽设−1；复制当前7槽物理数组；清空全部7槽；只遍历这份副本的原活动前缀 `0..m-1`，将非−1幸存项按原顺序压到最前方。

要点：

- 压缩保留所有种类的幸存牌，不只普通话题牌；重复牌不合并，也不数值排序。
- 活动前缀外的非空物理槽会被这次清空丢弃，但不会因此攻击或消费额外 jitter。
- 未发生任何移牌时，所有7槽原样保留，包括非活动尾槽；不能在输入或函数结束时无条件清除它们。
- 删除后仍递增 i。原来移入 i 的牌不会立刻命中；若之前有空洞，更多后续牌可能被压到已访问位置而不再读取。不能将这种效果简单化为“每次恰好跳过原来下一张牌”。

receipt 的扫描同时标记当前 `physicalSlot` 和输入来源 `originalSlot`，移牌记录完整前后手牌、幸存项槽迁移与非活动丢弃项。该原始槽标记是工程审计身份，不是源数组中的对象ID、牌堆token或完整 session 的 occurrence 身份。

### 最多4击的纸面上界

本输入域最大容量7，实际命中最多 `ceil(m/2)`：容量4/5/6/7分别最多2/3/3/4击。这个上界包含0槽允许话题牌、空洞及重复牌，不是假设0槽必为再考。

证明：对任意实际存在的第 k 击（k≥2），此前已有 k−1 次删除，且最近一次删除已经把剩余活动非空牌压成连续前缀，其长度至多 `m-(k-1)`。第 k 击的循环下标至少为 k−1；要读取到非空牌，该下标又必须至多 `m-k`。因此 `k-1 <= m-k`，即 `k <= floor((m+1)/2) = ceil(m/2)`。零击或一击也满足本域的上界。初始空洞与额外跳过只能减少机会，不能超过此界。

容量7、七槽全是普通牌时可以达到4击；不能因为一般填牌会把0槽设为再考，就把这个明确接纳合成物理手牌的核硬限为3击。上界是结果及消费预算，不是将源 counter 任意 clamp 到4。

## 5. 每击的请求伤害与逐次clamp

令 `A=resolvedAttack`，本击提供值为 `j=0..4`。普通牌小/中/大对应源等级0/1/2，`levelCoef` 分别为10/15/20。按来源整数乘除顺序：

```text
baseAttack = A + j
numerator = baseAttack * 10 * levelCoef * 10
hpDamage = trunc(numerator / 1000)
stressDamage = trunc(hpDamage / 15)
```

两个固定10分别是 `angerCoef` 和 `topicCoef`。本域全为正安全整数，向零截断与 floor 相同，最大乘积462000不会产生C# int溢出；中牌可能产生半数，必须在完整乘积除1000处截断，不能先对系数做整数除法。

单击HP请求范围70..462，stress请求范围4..30。小/中/大HP请求分别为 `A+j`、`trunc(1.5*(A+j))`、`2*(A+j)`。这里不调用按牌等级返回10/15/20的 `CalcStressDamage`；连打的stress明确由本次hpDamage除15得到。

每一击先写：`target.hp = clamp(target.hp - hpDamage, -100, 1000)`；然后写：`target.stress = clamp(target.stress + stressDamage, 0, 100)`。HP和stress分别在每次写入时裁剪，不能先合计整次连打再裁剪。receipt 同时保留请求伤害、请求有符号delta、写前/写后值和实际delta。

stress基数是完整的**请求HP伤害**，不是因HP下限裁剪后的实际损失。目标已是−100时仍有伤害请求和stress请求；stress已满时也不能省略该次计算、抽样、移牌或计数。

## 6. 按真实命中次序提供随机值，没有真实RNG调用

每条 `rawDraws` 精确为 `{role:'debate-timid-combo-jitter', bound:5, value:0..4}`。只有动态扫描确实命中普通牌才消费下一条；扫描空槽、话术、被压到旧下标而错过的牌，或被清除的非活动尾槽均不消费。

消费数量是本次实际命中数，不是输入普通牌总数，不是容量，不是固定4条，也不因HP已终局而提前减少。零命中要求空列表；命中时缺失、角色或bound不符、值越界，以及最后多余的合法原始值均不产生成功结果。

一般输入数组安全预算与实际消费上界分开：可解析数组预算不是要求 `rawDraws.length <= 4` 的语法捷径；成功时必须恰好耗尽提供值，而有效消耗不超过4。完整的解析预算、错误种类与拒绝优先次序以 [API](../engine/debate-timid-combo-v1.md) 为准。

`externalRngConsumed=0` 表示本纯核未调用外部随机服务；`consumedDraws` 仍记录来源每次 `RandInt(5)` 对应的提供式抽样。不能把零外部副作用说成来源连打零随机，也不声称恢复了原生PRNG、全局流位置、随机种子、概率或完整回合随机顺序。

## 7. HP终局不会截断连打，结果不包含胜负判定

源 `ComboAttack` 没有逐击 `CalcWinner`，也没有HP或stress gate。因此：

- 即使输入攻击方或目标HP已小于等于0，本有界核仍按全部扫描处理。
- 某一击把目标降到0以下或−100后，后续可命中牌仍消耗 jitter、产生HP/stress请求、执行clamp、移牌并增加counter。
- stress达到100不在函数中触发目标愤激，也不触发自动镇静/激昂反制；它只是供后续外层步骤读取的结果。
- 本次关闭 combo 后不调用胜负、崩坏、追击/留情、第二次 `CalcAngering(false)`、TurnEnd或timer递减。

外层 `AngerPhase` 确实在整次连打返回后安排胜负判定，这不授权本核在每击之间添加提前结束。接纳低HP合成检查点也不证明正常阶段实际会进入这些检查点。

## 8. 手工纸面例子，均未运行

以下只展示有关字段与纸面预期，不是完整公开输入或执行收据。统一由队伍0攻击、counter从0开始，攻击方为timid/timer1；未写字段保持不变。完整输入仍须满足 [API](../engine/debate-timid-combo-v1.md)。

### A. 7槽四击，原牌2/4/6没有被打出

容量7，物理手牌 `[1,2,3,4,5,6,7]`，`A=100`，目标初始HP1000/stress0，依命中提供 jitter `[0,1,2,3]`。

| 当前槽 | 输入原槽 | 牌 | HP请求 | stress请求 | 写后目标HP/stress | 删除后的7槽 |
|---:|---:|---:|---:|---:|---|---|
| 0 | 0 | 1 | 100 | 6 | 900 / 6 | `[2,3,4,5,6,7,-1]` |
| 1 | 2 | 3 | 202 | 13 | 698 / 19 | `[2,4,5,6,7,-1,-1]` |
| 2 | 4 | 5 | 153 | 10 | 545 / 29 | `[2,4,6,7,-1,-1,-1]` |
| 3 | 6 | 7 | 103 | 6 | 442 / 35 | `[2,4,6,-1,-1,-1,-1]` |

随后槽4..6均空，不再抽样。结果counter=4、active=false、attacker仍0。三张保留牌仍是普通话题牌，不表示核漏执行；这正是逐次压缩但循环继续加一的结果。

### B. 初始空洞导致两张话题牌都落到已经访问的位置

容量4，手牌 `[-1,1,2,3,9,10,14]`，`A=100`，只提供 jitter `[0]`。槽0空；槽1的牌1命中后，活动前缀幸存牌2、3压到槽0、1，手牌成为 `[2,3,-1,-1,-1,-1,-1]`。后续只扫描槽2、3，因此总共一击。

原槽4..6的9、10、14被首次删除清空；其中9虽是话题牌，也不攻击或取随机。counter=1、active=false。预先压缩输入或循环退回会错误地增加命中数。

### C. 零击关闭combo，但不清掉非活动话题牌

容量4，手牌 `[0,10,13,14,1,2,3]`，`rawDraws=[]`。只扫描活动前缀的再考、大喝、镇静、激昂，均不命中。因此HP/stress与全部7槽物理手牌原样保留，counter=0，active由true改为false，attacker仍0。

不能为了清理状态删除尾部1、2、3；不能为了“必须攻击”改牌或补牌。若额外提供一条合法 jitter，它也是未使用的多余输入，而不是被自动忽略。

### D. 第一击达到HP下限，后三击仍消费并计数

容量7，七槽均为大牌3，`A=227`，四条 jitter 均为4。每击HP请求462、stress请求30。目标初始HP10/stress95。

第一击HP请求−462，原算术值−452裁剪成−100，实际delta为−110；stress请求+30裁剪成100，实际delta为+5。后三击仍各自请求HP−462/stress+30，但两项实际delta都为0。四击全部完成，四条抽样全部消费，最后保留三张牌3、counter=4、active=false。

此例不能用实际HP损失110算stress，也不能在第一击后停止；本核仍不输出winner。固定中牌整数截断还可直接纸面核对：`A=101,j=0,levelCoef=15` 时HP请求151而非152，stress请求10。

## 9. 分离快照、完整审计与原子失败

成功返回 `{ok:true, characters, combo, receipt}`，失败返回 `{ok:false, reason}`。求值在分离数据上进行，不修改调用者；结果和receipt递归冻结。输入封闭结构、固定完整政策、非安全整数、可执行值/代理/访问器拒绝、预算及运行时安全前提属于工程接口政策，不是源 `ComboAttack` 自带的校验。

receipt 保存 `before`、`after` 完整Character与combo快照、每个实际扫描槽、各击的输入原槽身份、提供式抽样索引、系数与完整乘积、请求伤害、HP/stress各自写入、手牌移除和幸存迁移、每击counter前后值、最终 `comboTransition`。其中 `scans` 反映全容量扫描，`hits` 只反映实际命中，不能以一份预筛选牌表替代二者。

允许的状态变更仅有：目标HP/stress、攻击方实际移牌后的手牌、combo counter，以及最终active=false。双方其余携带字段、目标手牌、攻击方HP/stress、两方timer、容量与性格均不被顺便重写。所有新增索引、审计、角色标签和快照结构是工程可复核表示，不冒充源码中的日志事件、原生ABI或既有session DTO。

缺失后续抽样或最后发现多余抽样时，不发布部分击打结果、半次移牌或中间receipt；也不触及调用者输入或外部随机源。完整字段名及错误优先级见 [API](../engine/debate-timid-combo-v1.md)。

## 10. 可接收PR115结果的数据，不等于已经接入阶段或session

[PR115](https://github.com/DanielMax937/sanguozhi/pull/115) 的独立愤激进入核若真正以胆小进入，输出的Character对与 `active=true, attacker=<进入方>, counter=0` 可作为本核的数据基础。调用者还必须显式补足本核profile、固定政策、`genericOnly:true`、适用的 `resolvedAttack` 与恰好所需的提供式抽样。不是把PR115整份receipt直接作为本核输入，也不是任何保留下来的active combo都自动满足这里的更窄准入。

两个核之间**没有自动调用或阶段编排集成**。本批不改PR115，不实现“进入→连打→winner→第二次进入→连打→崩坏→winner→TurnEnd”的完整 `AngerPhase`；也不把本核结束自动当成一回合结束。

旧九个session profile、源码、正常态共享combat helper、固定政策、存档tag、命令、receipt、load/replay和 `angerTimer:0` 支持域保持不变。包括PR114 regenerated profile原有的非终局 `unsupported-anger-trigger` 整轮拒绝，不因这两个独立核而消失；不能直接改旧存档或绕过拒绝假装已完成集成。先前独立补牌/牌组生成核与本次Character手牌之间也没有补牌调用链。

继续开放：其他性格的一般选牌/伤害/再考效果、完整阶段排序与timer衰减、人物智力/行为/书籍/物品解析、任意attack域与非恒等伤害hook、完整回合随机流、额外消耗后的补牌/再生与occurrence身份、交互式阶段存档、开局历史可达性、教程、开场/追击/留情及campaign结果。

P078/native人员任务及全部依赖、俘虏/处斩/归属、return/mission和外交自动结算均排除。原43证据主题与45历史快照不因本现代参考独立核清零；原生完整链、stock/PK/Vanilla等价和完整舌战仍开放。

本批仅静态源码/文档阅读、文本编写与纸面推导。未运行测试、typecheck、编译器、build、validator、checker、诊断器、项目、候选核、来源、场景、例子或replay。纸面预期不构成运行通过或运行等价证据；本页不自行声称候选已发布或已合并。
