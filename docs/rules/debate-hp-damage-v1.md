# 现代参考通用舌战体力伤害计算核 v1

日期：2026-10-21。[实现](../../packages/engine/src/debate-hp-damage.ts) · [API 与完整 DTO](../engine/debate-hp-damage-v1.md) · [来源与政策记录](../sources/debate-hp-damage-v1.json)。

这是新的、独立、有界 `CalcHpDamage` 通用算术投影，不是 HP writer，不是整轮结算，也不是第十个舌战 session。只根据已经解析的攻击、性格、愤怒计时、当前话题、牌号和一个显式 jitter，返回通用公式的体力伤害请求及算术记录。既有九个 session、存档合同和此前独立核不因本组件改变。

公开入口为 `evaluateDebateHpDamage`，常量为 `DEBATE_HP_DAMAGE_POLICY_V1`、`DEBATE_HP_DAMAGE_EVIDENCE_V1`；公开 DTO 使用 `DebateHpDamage*V1` 命名。政策 id 为 `debate-hp-damage-policy-v1`，不是任何既有session的政策别名。

## 1. 固定来源与证据边界

唯一算法参考为 `tankyc/sango_infinity` 的现代 C# 转录源码，固定 commit：

`a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef`

| 固定来源 | 本组件采用的内容 |
|---|---|
| [Debate.cs 1145–1196](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L1145-L1196) | `CalcHpDamage` 的分支顺序、系数、一次 `RandInt(5)`、连乘后整数除法，以及公式之后的人物 hook 边界 |
| [Debate.cs 853–893](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L853-L893) | `GetCardTopic`、`GetCardLevel` 的普通牌分组及非普通牌返回 `-1` |
| [DebateEnum.cs](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/DebateEnum.cs) | 话题0..2、普通牌1..9、大喝10、其他牌0与11..14、四性格的标识对应 |

本批静态读取固定来源副本；来源身份详见本页链接的来源与政策记录。不执行 C# 来源，也不把源码注释或“由 C++ 翻译”声明升级为原生二进制证据。

必须区分三层：

1. **固定现代参考中的行为：** 下述可达分支及整数公式，尤其是正计时优先于大喝／匹配话题、冷静独有 angerCoef15、无论 levelCoef 是否为0都发生一次抽样。
2. **工程支持域和接口政策：** 严格 DTO、已解析标量、timer0..4、attack70..227、数字枚举范围、显式抽样带、精确整数中间量、`genericOnly:true`、封闭政策对象、审计标签和不写状态。这些不是原作完整输入域或随机系统。
3. **未证明的整局／原生结论：** 没有证明某个实际人物、手牌或阶段一定能到达本输入；没有证明 stock PC-PK／PK1.1、Vanilla、主机版或 MOD 等价；没有执行原作或真实存档。

`nativeEquivalent:false`、`stockOriginalVerified:false`、`completeDebate:false` 的边界不变。43个未决证据主题、45份历史快照不减少；本算术切片不关闭完整愤怒阶段、人物解析、全局 RNG 或全链集成的证据债。

## 2. 精确输入域

顶层只接受以下必需字段；缺失、额外或类型不符的字段不能靠默认值、截断或忽略修补。全部整数须为安全整数。

| 字段 | 必须满足 | 性质 |
|---|---|---|
| `schemaVersion` | 整数 `1` | 工程版本 |
| `profile` | `debate-hp-damage-reference-v1` | 独立支持域 |
| `policies` | 与 `DEBATE_HP_DAMAGE_POLICY_V1` 全部字段和值一致；不能只给政策 id | 工程政策绑定 |
| `genericOnly` | 严格 `true` | 只求人物伤害 hook 为恒等时的通用数值 |
| `personality` | `timid` / `calm` / `bold` / `reckless` | 已解析性格，分别对应来源枚举0/1/2/3 |
| `angerTimer` | 整数0..4 | 已给定检查点；只判断是否大于0，不推导计时来源 |
| `resolvedAttack` | 整数70..227 | 已解析攻击；不由智力、难度、人物、物品或对手现场计算 |
| `currentTopic` | 整数0/1/2 | 分别为故事／道理／时节；不能传 `-1` 或 `Topic_Max=3` |
| `card` | 整数-1..14 | 一个来源牌号或空牌哨兵；不是手牌 token |
| `rawDraws` | 恰好一项 `{role:'debate-hp-damage-jitter',bound:5,value:0..4}` | 显式来源抽样结果 |

没有 `team`、对手、人物 ID、HP、压力、手牌、牌组、会话 revision、胜方或预计算系数输入。`genericOnly:true` 不是任意真实人物均可套用的认证；调用者必须在本组件之外解决身份和调用资格，不能携带人物对象让本核猜测 hook。

计时1、2、3、4在本公式中等价，不按剩余回合数乘伤害。工程上允许某性格配任一0..4计时，不认证这种组合由完整游戏流程可达。attack70..227也是本 profile 的有界前提，不是重新实现攻击解析器或宣称所有扩展来源都只能落在此范围。

接口接收 JSON 形状的数据值，不接收序列化 JSON 字符串。先安全分离输入，再校验完整形状和政策，最后计算；不调用 getter、`toJSON`、Proxy trap 或输入回调。Proxy、访问器、符号键、循环、稀疏／附加字段数组、非纯数据对象、非整数／不安全数和负零均拒绝。运行时须提供可信 Node `process.getBuiltinModule('node:util').types.isProxy`；缺失时在检查输入前返回 `unsupported-runtime`，不降级成不安全遍历。

工程预算为1024输入节点、深度10、单数组长度32、规范化 UTF-8 16384字节。预算不是原作限制；超限拒绝。成功和失败结果均递归冻结；调用者输入不被修改或冻结。政策比较不要求对象键排列相同，但要求字段和值完整相同。详细安全与拒绝码合同见 API。

## 3. 牌号、诊断分类与等级系数

| `card` | 牌 | `cardTopic` | `cardLevel` | `levelCoef` |
|---|---|---:|---:|---:|
| -1 | 空牌哨兵 | -1 | -1 | 0 |
| 0 | 再考 | -1 | -1 | 0 |
| 1 / 2 / 3 | 故事·小／中／大 | 0 | 0 / 1 / 2 | 10 / 15 / 20 |
| 4 / 5 / 6 | 道理·小／中／大 | 1 | 0 / 1 / 2 | 10 / 15 / 20 |
| 7 / 8 / 9 | 时节·小／中／大 | 2 | 0 / 1 / 2 | 10 / 15 / 20 |
| 10 | 大喝 | -1 | -1 | **15，独立特判** |
| 11 / 12 / 13 / 14 | 诡辩／无视／镇静／激昂 | -1 | -1 | 0 |

大喝不是“普通中牌”，没有普通话题或普通等级。其 `cardLevel:-1` 与 `levelCoef:15` 不矛盾：前者是统一诊断分类，后者由源码的大喝特判产生。其他非普通牌的0只表示这次通用 HP 公式的结果为0，不表示该牌的其他效果、压力变化或完整阶段都无作用。

本核接受牌号不等于承诺可以出牌。不查持有、手牌 occurrence、卡槽、可用性、反制、牌消耗、选牌优先级或来源 caller 是否会对该牌调用本方法。

## 4. 分支优先级与完整系数矩阵

先决定 `topicCoef`，不能先应用大喝／匹配话题加成，再叠加愤怒。

1. 初始化 `topicCoef=6`。
2. 若 `angerTimer>0`，只检查性格：胆小或刚胆改成10；冷静或莽撞保留6。**本分支不再检查大喝或话题匹配。**
3. 仅当 `angerTimer=0` 时，大喝设12；否则普通牌的来源话题等于当前话题则设10；其余保留6。
4. 独立决定 `levelCoef`：大喝15；普通小／中／大为10／15／20；其他0。
5. 初始化 `angerCoef=10`；仅“正计时且冷静”改为15。

| 计时／性格 | 普通匹配：`topicCoef` | 普通不匹配：`topicCoef` | 大喝：`topicCoef` | 其他牌：`topicCoef` | `angerCoef` |
|---|---:|---:|---:|---:|---:|
| timer0，任一性格 | 10 | 6 | 12 | 6 | 10 |
| timer1..4，胆小 timid | 10 | 10 | 10 | 10 | 10 |
| timer1..4，冷静 calm | 6 | 6 | 6 | 6 | 15 |
| timer1..4，刚胆 bold | 10 | 10 | 10 | 10 | 10 |
| timer1..4，莽撞 reckless | 6 | 6 | 6 | 6 | 10 |

“其他牌”即-1、0、11..14，虽然 topicCoef 仍按相同分支选择，但 levelCoef0使最终结果为0。currentTopic 在正计时分支仍必须是合法输入，只是不参与当次 topic 系数判断。

常见误读：

- 正计时冷静即使使用匹配普通牌，topicCoef也为6，不能叠成15×10。
- 正计时大喝不保留正常态的12：胆小／刚胆为10，冷静／莽撞为6。
- 胆小和刚胆的正计时普通牌不受当前话题影响，但这只是伤害算术，不是“任意牌都允许出”的规则。
- 莽撞正计时的通用 HP 公式没有额外 angerCoef 奖励；其入场伤害属于别的组件，不能在这里再加一次。

## 5. 唯一整数公式与随机消费

令 `jitter=rawDraws[0].value`，按来源顺序保留中间量：

```text
attackWithJitter = resolvedAttack + jitter
afterAnger      = attackWithJitter * angerCoef
afterLevel      = afterAnger * levelCoef
numerator       = afterLevel * topicCoef
requestedHpDamage = trunc(numerator / 1000)
```

完整乘积形成后才做一次向零整数除法。实现使用精确整数算术；不能在乘法之间提前除1000、逐段舍入或使用最近整数。由于支持域内所有乘数非负，最终向零等于 floor，但这不改变来源除法语义。

**每个合法调用都恰好消费一个显式 jitter，包括空牌、再考以及11..14的零等级系数。** 源码没有在 levelCoef0时提前返回，而是在系数选择之后仍执行 `system.RandInt(5)`。输入不得缺 draw，也不得多给备用 draw；错 role、错 bound、越界或非整数 value 一律拒绝。

这里的“消费”是验证并记录输入带的一项，不调用外部 RNG，不修改调用者的数组或随机状态，不实现 seed、PRNG、原作全局抽样序列或概率分布。完整来源游戏是否在某阶段调用此方法，是本核之外的问题；不能用此规则把整局平局或未攻击分支也强制变成一次 HP 抽样。

### 有界极值：最大462，而不是693

本输入域内 `attackWithJitter` 最大为 `227+4=231`。逐分支可达最大值为：

| 分支 | 普通牌最大值 | 大喝最大值 |
|---|---:|---:|
| timer0 | 匹配大牌：`231×10×20×10/1000 = 462` | `trunc(231×10×15×12/1000) = 415` |
| 正计时胆小／刚胆 | 任一话题大牌：`231×10×20×10/1000 = 462` | `trunc(231×10×15×10/1000) = 346` |
| 正计时冷静 | 任一话题大牌：`trunc(231×15×20×6/1000) = 415` | `trunc(231×15×15×6/1000) = 311` |
| 正计时莽撞 | 任一话题大牌：`trunc(231×10×20×6/1000) = 277` | `trunc(231×10×15×6/1000) = 207` |

所以最大完整分子为462000，所有合法输出都在0..462；最小正值42由attack70、jitter0、timer0、不匹配普通小牌得到。该区间是包络，不宣称其中每个整数都可达。

来源行内的 `42 .. 693` 注释不能直接作为本组件的最大值。693需要把15×20×10这组系数同时组合起来，但 angerCoef15只发生于正计时冷静，而该分支 topicCoef恒6。**按实际分支，可达最大值是462。** 这是一项固定现代源码与本输入域的纸面推导，不是对原生程序实测，也不是新增伤害上限 clamp；公式自然产出该上界。

## 6. 纸面边缘例，不是已运行测试

以下均假定合法且完整的版本／政策／`genericOnly`输入，并显式提供一个合法 jitter。表中系数顺序为 `angerCoef × levelCoef × topicCoef`。

| 输入要点 | 系数 | 完整分子 | `requestedHpDamage` | 说明 |
|---|---|---:|---:|---|
| timid，timer0，attack100，topic0，card1，jitter4 | 10×10×10 | 104000 | 104 | 匹配普通小牌 |
| timid，timer0，attack100，topic0，card6，jitter4 | 10×20×6 | 124800 | 124 | 不匹配普通大牌，末尾一次截断 |
| calm，timer0，attack100，topic0，card10，jitter4 | 10×15×12 | 187200 | 187 | 正常态大喝，冷静此时仍是angerCoef10 |
| calm，timer1，attack100，topic0，card10，jitter0 | 15×15×6 | 135000 | 135 | 正计时优先，大喝不再取12 |
| calm，timer4，attack100，topic0，card3，jitter0 | 15×20×6 | 180000 | 180 | 匹配也不取10；timer4不是四倍 |
| bold，timer1，attack100，topic0，card6，jitter0 | 10×20×10 | 200000 | 200 | 正计时刚胆不要求话题匹配 |
| timid，timer1，attack100，topic0，card10，jitter0 | 10×15×10 | 150000 | 150 | 正计时胆小大喝系数10而非12 |
| reckless，timer1，attack100，topic0，card10，jitter0 | 10×15×6 | 90000 | 90 | 不采用冷静独有的angerCoef15 |
| calm，timer1，attack71，topic0，card3，jitter0 | 15×20×6 | 127800 | 127 | 先连乘，再向零除1000 |
| bold，timer4，attack227，topic0，card9，jitter4 | 10×20×10 | 462000 | 462 | 可达最大值；不匹配仍为10 |
| calm，timer4，attack227，topic0，card14，jitter4 | 15×0×6 | 0 | 0 | 激昂的通用数值为0，仍记录并消费一个jitter |
| timid，timer0，attack70，topic2，card-1，jitter0 | 10×0×6 | 0 | 0 | 空牌也不能省略抽样 |

拒绝例包括timer5、attack228、topic3、card15、`genericOnly:false`、缺少 jitter、零结果给空 draw带、两个 draw、错误 role 或 bound，以及任意额外人物／HP字段。它们是工程支持域拒绝，不是“源码在这些输入会崩溃”的判断。

## 7. 收据与审计的含义

成功结果返回 `ok:true`、输入检查点事实、`policy`／`evidence`身份、诊断 `cardTopic/cardLevel`、`requestedHpDamage`，以及：

- `arithmetic`：`resolvedAttack,jitter,attackWithJitter,angerCoef,afterAnger,levelCoef,afterLevel,topicCoef,numerator,divisor:1000,truncatedDamage`。
- `audit.topicReason`：`positive-timer-timid-or-bold`、`positive-timer-calm-or-reckless-default`、`zero-timer-shout`、`zero-timer-matching-topic`、`zero-timer-default`之一。
- `audit.levelReason`：`shout-fixed-level`、`ordinary-level-zero`、`ordinary-level-one`、`ordinary-level-two`、`non-damaging-card-zero-level`之一。
- `audit.angerReason`：`positive-timer-calm`或`default`。
- `cardTopicCompared`：仅timer0且不是大喝时为true；正计时和大喝的短路分支为false。
- `cardLevelLookupUsed`：大喝为false，其他牌为true。
- 一个索引0的 draw记录，以及 `consumedDraws:1`、`externalRngConsumed:0`、`stateWrites:0`、`modifyHpDamage:'identity-only-not-invoked'`。

reason标签、结构化中间量、索引、消费计数和字段名是工程审计设计，不是声称源程序具有这些对象。统一提供诊断分类，不等于源码在短路分支真的执行了对应 getter；`cardTopicCompared/cardLevelLookupUsed`专门保留这一差别。

`requestedHpDamage` 是公式的请求值，不是目标实际减少的HP，不是 signed delta，也不是已经应用的伤害。没有 before/after HP、clamp、负HP规则、压力值、胜负或状态写入。失败只返回 `{ok:false,reason}`，不返回部分收据；完整 DTO 以 API 文档为准。拒绝不能产生部分伤害或先消耗外部 RNG。

## 8. 人物 hook、调用链与兼容性

来源在整数公式完成后获取双方 `Person`，再调用 `DebatePersonBehaviours.Get(self).ModifyHpDamage(self, opponent, card, n)`。本组件**不实现、不调用、不猜测**该人物分支，只承诺恒等 hook 下的通用结果。`genericOnly:true`因此不可删除，也不能用它绕过某真实人物的已知非恒等行为。

本批明确不做：

- 从人物、智力、难度、物品、对手或能力hook导出attack／personality；也不认证预解析标量来自何处。
- 牌所有权、手牌可用性、选牌、反制、消耗、压紧、补牌、洗牌、再生成、冷静再考或刚胆耗牌处理。
- 用power或其他条件选攻击方，处理平局、连续攻击、自动大喝、愤怒触发、timer递减或第二次愤怒判定。
- HP／压力 writer、clamp、崩坏、胜负、开场一击、追击、留情、负伤或整局结束。
- 会话、command、save/load/replay、阶段调度、全局 RNG、AI、外交或 campaign 集成。
- P078及其全部依赖，人员／归属／俘虏／处斩／军团太守／capture／return／mission／event链。

新核可作为后续显式集成的独立候选，但“已有公式核”不等于“既有session支持愤怒中出牌”。旧九个session、既有内核、旧政策及存档保持原合同；不能静默替换其内部公式、扩大旧profile支持域或复用本核收据冒充完整回合收据。

## 9. 本批验证状态

本页与组件交付仅采用静态文本读取／编辑、独立静态审阅、纸面推导及来源身份记录。上面的例子没有执行，极值没有通过穷举程序求得。

**本批未运行测试、编译器、typecheck、build、validator、checker、诊断脚本、候选代码、来源项目、示例场景或 replay。** 不增删测试，不复用旧批次通过状态，不把源码读取或文件身份核对表述为行为验收通过。之后若获准运行验证，应另行记录实际执行范围及结果，不能追认本批已经运行。
