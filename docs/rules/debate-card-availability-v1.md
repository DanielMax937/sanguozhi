# 舌战卡牌可用性独立核 v1

本页规定 `debate-card-availability-reference-v1` 对单个牌号的可用性判断。它补足固定现代参考 `IsCardAvailable` 的一个独立规则边界，不执行出牌，不证明该牌归本方所有，也不表示完整愤怒阶段或旧会话已经接入。

入口是 [`evaluateDebateCardAvailability`](../../packages/engine/src/debate-card-availability.ts)；字段、固定政策、错误和运行环境要求见 [API 合同](../engine/debate-card-availability-v1.md)。本文的判定表与人工推导仅用于静态说明，未执行候选核或测试。

## 1 证据范围

唯一行为参考是 `tankyc/sango_infinity` 固定提交 `a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef`：

- [`Debate.cs 934–987`](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L934-L987)：选定本方／对手，产生两个局部 `angered` 布尔值，按牌号短路返回可用性。
- [`Debate.cs 369–375`](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L369-L375)：`CharacterGetPersonality` 优先使用有效的角色性格覆盖值，否则回落到人物 getter。
- 同一参考工程 `DebateEnum.cs` 的 `DebateCard`、`Personality` 和 `DebateTeam`：再考为 0，普通话题牌为 1..9，五话术为 10..14，Max 为 15；胆小／冷静／刚胆／莽撞依次为 0..3；队伍为 0、1。枚举对照用于固定输入含义，不据注释反推原生实现。

这是现代 C# 参考的局部静态转译，不是原生 PK、Vanilla、主机或 stock 版本的反编译认证。原有 43 个证据主题和 45 个历史快照缺口保持，不因本核交付而减少。

## 2 输入与边界

输入携带 `schemaVersion: 1`、`profile: "debate-card-availability-reference-v1"`、与导出常量 `DEBATE_CARD_AVAILABILITY_POLICY_V1` 完全一致的 `policies`、`team`、`characters` 和 `card`。不得省略政策后隐式选用默认值，也不自动迁移别的 profile。

`team` 为 0 或 1；`characters` 按队伍 0、1 固定排列，每方仅给定：

- `personality`：`timid`、`calm`、`bold`、`reckless`，分别表示胆小、冷静、刚胆、莽撞。
- `angerTimer`：整数 0..4。
- `canRethink`：明确的布尔值。

`personality` 是调用方已经解析好的性格，不是人物 ID，也不是待执行的 getter。来源的覆盖值／人物回落、人物书籍与能力解析、外部 hook 均不在本核内。timer 限为 0..4 是此 API 的工程支持域；来源这里只判断大于 0，不能把 API 拒绝 5 写成来源规则禁止 timer=5。

`card` 必须是有符号 32 位整数，即 −2147483648..2147483647。整数但不在 0..14 的牌号是合法查询，成功返回 `available: false`，不是格式错误。输入快照先拒绝小数、负零、NaN 等不受支持的数值，返回 `malformed-data`；通过快照后，字符串牌号或超出有符号 32 位范围的整数牌号返回 `invalid-card`。这些错误均不进入可用性判定，完整拒绝顺序以 API 为准。

本核只读输入，返回冻结的判定及审计，不修改 `canRethink`、timer、手牌或其他状态。严格结构检查、未知字段拒绝、资源预算、安全运行环境和输入快照机制是工程契约，不是 `IsCardAvailable` 的原有游戏规则；详细拒绝优先序以 API 为准。

## 3 局部受限状态的准确含义

对每方独立计算：

`angered = angerTimer > 0 && (personality == calm || personality == bold)`

| 给定性格 | timer=0 | timer=1..4 | 对本核的含义 |
| --- | --- | --- | --- |
| 胆小 timid | false | false | 正 timer 不触发本方法的选牌限制 |
| 冷静 calm | false | true | 本方不能镇静／激昂；作为对手时封锁五话术 |
| 刚胆 bold | false | true | 本方不能再考或使用五话术；作为对手时不产生冷静封锁 |
| 莽撞 reckless | false | false | 正 timer 不触发本方法的选牌限制 |

这里的 `angered` 是来源方法的局部布尔量，不是“角色是否处于任何愤怒状态”的通用真值。胆小、莽撞可以有正 timer，但本方法仍将它们的局部 `angered` 置为 false。也不能把对手刚胆的 `opponentAngered=true` 误写成话术封锁，因为后续还要求对手性格为冷静。

审计中的 `angerReason` 使用工程标签 `timer-zero`、`personality-not-calm-or-bold`、`positive-timer-calm`、`positive-timer-bold` 说明上述推导；这些字符串不是来源已有返回值。

## 4 牌号决策表

先通过输入结构校验，再按下面顺序判断。表内先命中的拒绝即结束，不收集后续假想失败。

| 牌号 | 类别 | 按顺序检查 | 成功条件 |
| --- | --- | --- | --- |
| 有符号 32 位整数但不在 0..14 | 范围外 | 立即不可用 | 无 |
| 0 | 再考 Rethink | ①本方刚胆且 timer>0 则不可用；②读取本方 `canRethink` | ①未阻止且 `canRethink=true` |
| 1..9 | 普通话题牌 | 不追加性格或再考条件 | 始终可用 |
| 10..12 | 大喝／诡辩／无视 | ①本方刚胆且 timer>0 则不可用；②对手冷静且 timer>0 则不可用 | 两项均未阻止 |
| 13..14 | 镇静／激昂 | ①本方冷静或刚胆且 timer>0 则不可用；②对手冷静且 timer>0 则不可用 | 两项均未阻止 |

重要区别：

1. 再考不检查对手。即使对手冷静正 timer，本方只要不受刚胆限制且 `canRethink=true`，再考仍可用。
2. 冷静正 timer 的本方仍可使用大喝、诡辩、无视，但可能被对手冷静正 timer 封锁；不能使用镇静、激昂。
3. `canRethink` 只约束牌号 0，不约束 1..14；对手的 `canRethink` 不参与本方结果。
4. 1..9 始终可用只是在这个局部谓词内成立，不等于玩家持有该牌、当前轮可出牌或双方仍存活。
5. `angerTimer` 在 1..4 内的大小不会改变这张表；本核不递减 timer，也不恢复或消费再考额度。

## 5 短路原因与审计

来源只返回 `bool`。本核新增 `reason`、局部状态解释和有序 `checks`，帮助查明命中哪条来源分支；原因名称、收据结构及冻结策略均属于工程政策，不能作为原生行为的新证据。

| 返回 reason | available | 决定分支 |
| --- | --- | --- |
| `card-out-of-range` | false | 牌号不在 0..14 |
| `self-angry-bold` | false | 再考或 10..12 命中本方刚胆正 timer 限制 |
| `rethink-disabled` | false | 再考未被刚胆阻止，但本方 `canRethink=false` |
| `self-angered` | false | 13..14 命中本方冷静／刚胆正 timer 限制 |
| `opponent-angry-calm` | false | 10..14 通过本方检查后，命中对手冷静正 timer 限制 |
| `rethink-enabled` | true | 再考通过本方刚胆检查，且本方 `canRethink=true` |
| `rhetoric-available` | true | 10..14 通过适用的本方和对手检查 |
| `topic-card-available` | true | 普通话题牌 1..9 |

同样的 false 不一定对应相同 reason。例如本方刚胆正 timer、对手冷静正 timer 同时存在时，牌 10 返回 `self-angry-bold`，牌 13 返回 `self-angered`，两者都不会把未到达的对手分支记作决定原因。本方刚胆正 timer 且 `canRethink=false` 时，牌 0 也先返回 `self-angry-bold`。

成功封装中，`ok: true` 表示查询有效，不表示牌可用；必须读取 `available`。`audit.self` 与 `audit.opponent` 保存角色输入及局部 `angered` 推导，`cardClass` 区分类别，`checks` 按实际短路顺序记录，`decisiveCheck` 指向决定项。精确字段和值见 API。

失败封装 `ok: false` 只报告输入或支持域问题，没有部分判定或部分状态写入。比如非整数牌号与未知性格不可伪装成来源的 `false`。本核没有随机调用；`externalRngConsumed: 0` 只证明此边界无抽样，不证明再考、发牌、攻击或外围阶段无随机。

## 6 人工推导案例

下表全部是从固定分支手工推导的预期，不是已经运行的测试。`性格/timer/可再考` 按己方视角表示；未显式写出的政策、schema、team 与另一方结构均假定符合 API。

| 己方 | 对手 | card | 预期 available 与 reason | 区分点 |
| --- | --- | --- | --- | --- |
| bold/4/false | calm/4/false | −1 | false / `card-out-of-range` | 越界先于牌类限制 |
| timid/0/true | reckless/0/true | 15 | false / `card-out-of-range` | Max 不是可用牌 |
| timid/0/true | calm/4/false | 0 | true / `rethink-enabled` | 再考不受对手冷静封锁 |
| calm/4/true | calm/4/false | 0 | true / `rethink-enabled` | 冷静正 timer 仍可再考 |
| calm/4/false | timid/0/true | 0 | false / `rethink-disabled` | 不自动恢复 canRethink |
| bold/1/true | timid/0/true | 0 | false / `self-angry-bold` | 刚胆优先禁止再考 |
| bold/4/false | calm/4/true | 0 | false / `self-angry-bold` | 不继续判额度或对手 |
| bold/0/true | calm/4/true | 0 | true / `rethink-enabled` | 零 timer 不触发刚胆限制 |
| timid/1/true | calm/4/true | 0 | true / `rethink-enabled` | 胆小正 timer 不是局部 angered |
| reckless/4/true | calm/4/true | 0 | true / `rethink-enabled` | 莽撞正 timer 同理 |
| bold/4/false | calm/4/false | 1、9 | true / `topic-card-available` | 普通牌不受这些限制 |
| calm/4/false | bold/4/false | 10、11、12 | true / `rhetoric-available` | 本方冷静允许；对手刚胆不封锁 |
| bold/4/true | calm/4/true | 10、11、12 | false / `self-angry-bold` | 本方条件先于对手条件 |
| timid/4/false | calm/1/false | 10、11、12 | false / `opponent-angry-calm` | 胆小不自禁，仍受对手冷静封锁 |
| reckless/4/false | bold/4/false | 10、11、12 | true / `rhetoric-available` | 额度与对手刚胆不限制话术 |
| calm/1/true | calm/4/true | 13、14 | false / `self-angered` | 本方冷静先拒绝 |
| bold/4/true | calm/4/true | 13、14 | false / `self-angered` | 该牌类不使用 self-angry-bold 标签 |
| timid/4/false | calm/4/false | 13、14 | false / `opponent-angry-calm` | 本方通过后才看对手 |
| reckless/4/false | bold/4/false | 13、14 | true / `rhetoric-available` | 正 timer 不等于所有话术禁用 |
| calm/0/false | calm/0/false | 13、14 | true / `rhetoric-available` | 双方零 timer 不触发限制 |

另需保留以下纸面边界：

- −2147483648 与 2147483647 都是可查询的范围外整数，返回成功但不可用；2147483648 或字符串 `"1"` 返回 `invalid-card`；1.5、负零、NaN 在输入快照阶段先返回 `malformed-data`。
- `angerTimer=5` 返回 `invalid-anger-timer`，不是按来源直接比较后放行。未知性格或非布尔 `canRethink` 同样为输入错误。
- 交换 `characters[0]` 和 `characters[1]` 并同步切换 team，保持同一己方／对手语义；只切换 team 则必须重新以另一方为本方推导。例如 0 方 bold/4、1 方 calm/4 时，card 0 对 0 方被禁止，对 canRethink=true 的 1 方仍可用。
- 同一合法输入把正 timer 从 1 改为 4 不改变本方法结果；把它降为 0 则可能解除相应限制。输入对象本身不应被改写。

## 7 与旧会话及剩余规则的隔离

本核未被自动接入九个旧会话 profile；旧 DTO、保存标签、固定政策、回放、历史命令与各自拒绝边界均保持。旧正常态会话的 `angerTimer: 0` 支持域以及尚不支持的非终局愤怒触发，不因新增这个谓词而解除。此前独立愤怒入场、胆小连打等组件也没有因此获得新的整体编排。

以下事项继续排除，不能从 `available=true` 推导已经具备：

- 手牌所有权、物理槽合法性、牌面与 occurrence/token 身份、选牌阶段、出牌顺序、轮次合法性、AI 决策、UI 交互和教程。
- HP、胜负或终局检查；压力判定、愤怒入场、自动反制、连打、完整双次愤怒阶段、计时递减与崩坏处理。
- 冷静回合开始恢复再考、冷静再考的额外牌面覆写、刚胆普通牌耗尽时清 timer；本核只读取检查点，不制造这些上游状态。
- 刚胆牌力替换、愤怒伤害系数、通用伤害 hook、抽样或全局 RNG、发牌与补牌及牌组再生成。
- 真实人物／书籍／物品资格，开局历史可达性、开场／追击／留情，完整存档／load／replay 会话及 campaign 后果。
- P078、native 人员任务及全部依赖，俘虏／处斩／归属、return／mission 与外交自动结算。

本批仅做固定源码和文档的静态阅读、文本编写及人工推导。没有运行测试、编译、typecheck、build、validator、checker、诊断器、项目、候选核、来源代码、场景或 replay。本文不构成运行通过、完整舌战实现、原生版本等价、已发布或已合并的声明。
