# 独立攻击方判定 API v1

[规则与来源边界](../rules/debate-attacker-selection-v1.md) · [固定政策与证据](../sources/debate-attacker-selection-v1.json) · [纸面案例，未运行](../../data/scenarios/debate-attacker-selection-example-v1.json)。

实现入口为 [debate-attacker-selection.ts](../../packages/engine/src/debate-attacker-selection.ts)，公共导出见 [engine index](../../packages/engine/src/index.ts)。本页描述固定现代 C# `GetCardPower(int topic, int card)` 与 `CalcAttacker()` 的独立参考查询：来源后者读取实例字段，本API改为显式接收检查点。先求双方基础牌力，再对正计时器的刚胆分别覆盖为100，最后按严格大于选择队伍；相等返回−1。

100是**替换值**，不是加100，也不是至少100。兴奋刚胆的无视120或大喝110同样会被降为100。选择只使用最终牌力，不用先手、智力、武力或人物身份打破平局。

这是调用者提供已解析性格、计时器、当前话题与两张牌码的**合成检查点查询**。`ok:true` 只表示输入在本工程合同内且计算完成，不证明持有该牌、牌可用、可以出牌、检查点真实可达或攻击已执行。本核不调用独立可用性核，不抽随机数，不计算或写入 HP／stress，不删除牌、不推进计时器、不运行胜负或回合结算。

九个旧会话及既有各独立核、profile、政策与存档保持原合同，没有自动接入或隐式迁移。现代参考核的增加不减少43个证据主题／45个历史快照缺口；P078及全部依赖排除。固定现代 C# 不是原生 PK、Vanilla 或主机版等价证明，完整原生链仍开放。

## 1. 公开入口与全部类型别名

唯一函数及两个常量：

```ts
evaluateDebateAttackerSelection(input: unknown): DebateAttackerSelectionResultV1
DEBATE_ATTACKER_SELECTION_POLICY_V1: DebateAttackerSelectionPolicyV1
DEBATE_ATTACKER_SELECTION_EVIDENCE_V1: DebateAttackerSelectionEvidenceV1
```

没有单独公开的 GetCardPower、create、preview、execute、save、load、replay、session 或批量入口。输入为 JSON 式数据值，**不是 JSON 字符串**；`unknown` 入口始终安全分离后再校验，类型断言不能绕过运行时合同。

全部23个公开类型别名如下。复合类型递归 readonly；后文结构为便于阅读省略重复的 readonly，不新增公开别名。

| 公开别名 | 完整值域或定义位置 |
|---|---|
| `DebateAttackerSelectionTeamV1` | `0 \| 1` |
| `DebateAttackerSelectionAttackerV1` | `-1 \| 0 \| 1` |
| `DebateAttackerSelectionPersonalityV1` | `'timid' \| 'calm' \| 'bold' \| 'reckless'` |
| `DebateAttackerSelectionTopicV1` | `0 \| 1 \| 2`，仅表示有效话题，不限制输入 currentTopic 为此类型 |
| `DebateAttackerSelectionCardTopicV1` | `-1 \| 0 \| 1 \| 2` |
| `DebateAttackerSelectionCardLevelV1` | `-1 \| 0 \| 1 \| 2` |
| `DebateAttackerSelectionCharacterV1` | 第2节二字段角色 |
| `DebateAttackerSelectionInputV1` | 第2节六字段输入 |
| `DebateAttackerSelectionCardClassV1` | 第3.1节八种牌类 |
| `DebateAttackerSelectionBaseReasonV1` | 第3.2节七种基础牌力原因 |
| `DebateAttackerSelectionBaseCalculationV1` | 第4.1节八字段基础计算 |
| `DebateAttackerSelectionOverrideReasonV1` | 第3.3节三种覆盖原因 |
| `DebateAttackerSelectionOverrideAuditV1` | 第4.2节三字段覆盖审计 |
| `DebateAttackerSelectionTeamAuditV1` | 第4.2节八字段队伍审计 |
| `DebateAttackerSelectionComparisonRelationV1` | `'team-0-greater' \| 'team-1-greater' \| 'equal'` |
| `DebateAttackerSelectionComparisonV1` | 第4.3节五字段比较 |
| `DebateAttackerSelectionAuditV1` | 第4.3节五字段总审计 |
| `DebateAttackerSelectionSuccessV1` | 第4节十一字段成功结果 |
| `DebateAttackerSelectionFailureReasonV1` | 第6节十三种失败原因 |
| `DebateAttackerSelectionFailureV1` | `{ok:false,reason:DebateAttackerSelectionFailureReasonV1}` |
| `DebateAttackerSelectionResultV1` | `DebateAttackerSelectionSuccessV1 \| DebateAttackerSelectionFailureV1` |
| `DebateAttackerSelectionPolicyV1` | 第7节完整固定政策的递归 readonly 字面量类型 |
| `DebateAttackerSelectionEvidenceV1` | 第8节完整固定证据的递归 readonly 字面量类型 |

成功、失败及其嵌套对象／数组与两个导出常量均递归冻结。调用者对象不会被修改或冻结；结果不保留调用者拥有的可变引用。policy／evidence 可复用已冻结的导出常量，不承诺每次调用都创建新的常量对象身份。失败恰为 `{ok:false,reason}`，没有输入回显、错误路径、部分牌力或部分审计。

## 2. 完整输入合同

```ts
type DebateAttackerSelectionCharacterV1 = {
  personality: DebateAttackerSelectionPersonalityV1;
  angerTimer: number;
};
type DebateAttackerSelectionInputV1 = {
  schemaVersion: 1;
  profile: 'debate-attacker-selection-reference-v1';
  policies: DebateAttackerSelectionPolicyV1;
  currentTopic: number;
  characters: [DebateAttackerSelectionCharacterV1, DebateAttackerSelectionCharacterV1];
  playedCards: [number, number];
};
```

顶层恰有这六个必需键，每个角色恰有这两个必需键。characters 与 playedCards 都恰有两项，按队伍0、队伍1对应；不是本方／对手的可交换视图。无默认值，无额外字段，不转换数字字符串、布尔值、枚举别名或分数。

| 字段 | 运行时要求 |
|---|---|
| schemaVersion / profile | 精确为数字1 / `debate-attacker-selection-reference-v1` |
| policies | 与第7节完整政策逐值一致，不是仅 id；对象键顺序无关，数组顺序有关 |
| currentTopic | 有符号32位整数，−2147483648..2147483647；只有0..2可产生匹配加分 |
| characters | 恰两项的稠密数组，每项为封闭角色 record |
| characters[i].personality | timid（胆小）、calm（冷静）、bold（刚胆）、reckless（莽撞）之一 |
| characters[i].angerTimer | 整数0..4 |
| playedCards | 恰两项的稠密数组，每项均为有符号32位整数 |

安全层先要求所有数值均为安全整数且不是负零。因此 currentTopic=2147483648 为 `invalid-current-topic`，card=2147483648 为 `invalid-card`；但任意字段中的1.5、NaN、Infinity、不安全整数或−0先是 `malformed-data`。数字字符串经过安全分离后仍不被当作数字接受。

0、1、2分别是故事、道理、时节。currentTopic 为−1、3或任意其他 signed32 值均是合法查询，只是不授予话题加分，不是 `invalid-current-topic`。导出的 `DebateAttackerSelectionTopicV1` 仅描述有效话题子集；输入 currentTopic 的公开声明刻意为 number，不可误缩为0..2。

playedCards 中0..14以外的 signed32 整数也合法：基础牌力走默认0分，随后仍可能被兴奋刚胆覆盖为100。不能照搬伤害核的−1..14输入范围或可用性核的不可用结果作为本核的输入拒绝规则。

性格是调用者已解析的 `CharacterGetPersonality` 结果，不是人物ID或原始数值枚举。本核不查询人物、武力、智力或书籍。每种性格均接受 timer=0..4，不额外要求 timid／reckless 只能为0或1；该工程检查点域不证明真实历史可达。

输入没有 team、firstTeam、personId、resolvedAttack、hp、stress、canRethink、hand、cardToken、available、phase、rawDraws、seed、RNG回调、预计算牌力、attacker、audit 或 evidence。将其他核的完整角色或会话直接塞入会因额外键失败；须显式投影本节字段。即使两张牌最终都为0分，也必须完整校验全部输入。

## 3. 牌力、覆盖与比较顺序

### 3.1 牌码、牌类与基础值

| card | 含义 / cardClass | cardTopic | cardLevel | 无匹配加分时的基础牌力 |
|---|---|---|---|---|
| signed32中小于0或大于14 | 来源默认 / `out-of-range` | −1 | −1 | 0 |
| 0 | 再考 / `rethink` | −1 | −1 | 0 |
| 1 / 2 / 3 | 故事小／中／大 / `topic` | 0 | 0 / 1 / 2 | 1 / 2 / 3 |
| 4 / 5 / 6 | 道理小／中／大 / `topic` | 1 | 0 / 1 / 2 | 1 / 2 / 3 |
| 7 / 8 / 9 | 时节小／中／大 / `topic` | 2 | 0 / 1 / 2 | 1 / 2 / 3 |
| 10 | 大喝 / `shout` | −1 | −1 | 110 |
| 11 | 诡辩 / `sophistry` | −1 | −1 | 20 |
| 12 | 无视 / `ignore` | −1 | −1 | 120 |
| 13 | 镇静 / `compose` | −1 | −1 | 0 |
| 14 | 激昂 / `agitate` | −1 | −1 | 0 |

表中八个 cardClass 字符串构成 `DebateAttackerSelectionCardClassV1` 的全部值。out-of-range 是成功审计中的牌类，不是输入失败；−2147483648和2147483647均能走此类。

普通牌 cardTopic 为 `(card−1)` 除3向下取整，cardLevel 为 `(card−1)` 模3；levelPower 为1+cardLevel。只有当前话题有效且等于 cardTopic，才加10，故匹配普通牌依次为11、12、13分。非普通牌的辅助诊断值恒−1，不会因为 currentTopic=−1而匹配加分。非伤害牌的0牌力也不代表它没有其他游戏效果。

### 3.2 全部基础计算原因

`GetCardPower` 按无视、大喝、诡辩、普通牌、默认的来源优先关系求值：

| reason | 条件 | fixedPower | levelPower | topicBonus / topicMatched |
|---|---|---|---|---|
| `ignore-fixed` | card=12 | 120 | 0 | 0 / false |
| `shout-fixed` | card=10 | 110 | 0 | 0 / false |
| `sophistry-fixed` | card=11 | 20 | 0 | 0 / false |
| `topic-match` | 普通牌且有效当前话题匹配 | 0 | 1..3 | 10 / true |
| `topic-unmatched` | 普通牌且有效当前话题不匹配 | 0 | 1..3 | 0 / false |
| `topic-invalid-current` | 普通牌且当前话题不在0..2 | 0 | 1..3 | 0 / false |
| `other-card-zero` | 其他所有已接受牌码 | 0 | 0 | 0 / false |

以上七个字符串为 `DebateAttackerSelectionBaseReasonV1` 的全部值。基础计算始终返回完整字段，包括零值和不匹配信息；`basePower = fixedPower + levelPower + topicBonus`。

### 3.3 全部刚胆覆盖原因

先完成队伍0及队伍1两次基础计算，再按队伍0、队伍1分别检查覆盖：

| 条件，按审计原因优先序 | reason | applied | assignedPower | finalPower |
|---|---|---|---|---|
| angerTimer=0，任意性格 | `timer-zero` | false | null | basePower |
| angerTimer>0且不是bold | `personality-not-bold` | false | null | basePower |
| angerTimer>0且为bold | `positive-timer-bold` | true | 100 | 100 |

以上三种 reason 为 `DebateAttackerSelectionOverrideReasonV1` 的全部值。timer-zero 优先于性格不为bold。timid、calm、reckless 的正计时器均不改变这条牌力；不能把其他核对“兴奋”的局部定义套用为本核条件。

覆盖适用于**每个已接受 signed32 牌码**，包括再考、镇静、激昂和 out-of-range 默认牌。这是独立数学查询的行为，不是许可刚胆实际打出这些牌。对无视和大喝分别发生120→100、110→100；不是 `max(basePower,100)`，也不是 `basePower+100`。基础计算审计保留覆盖前结果，不因覆盖而省略。

### 3.4 严格比较

依次检查 finalPowers[0]>finalPowers[1]，否则检查 finalPowers[1]>finalPowers[0]，否则相等。对应 attacker 为0、1、−1，relation 为 `team-0-greater`、`team-1-greater`、`equal`。

双方同时兴奋刚胆时两边都为100，因此必为−1；不会用覆盖前牌力或先手破平。−1仅表示本次牌力比较没有攻击方，不是输入失败、胜负结果或完整回合的无效果断言。`CalcAttacker` 原先对 attacker 字段的赋值在这里仅作为数据返回，不写入任何游戏状态。

## 4. 成功结果与全部嵌套字段

```ts
type DebateAttackerSelectionSuccessV1 = {
  ok: true;
  schemaVersion: 1;
  profile: 'debate-attacker-selection-reference-v1';
  policy: DebateAttackerSelectionPolicyV1;
  evidence: DebateAttackerSelectionEvidenceV1;
  currentTopic: number;
  playedCards: [number, number];
  basePowers: [number, number];
  finalPowers: [number, number];
  attacker: DebateAttackerSelectionAttackerV1;
  audit: DebateAttackerSelectionAuditV1;
};
```

输入用复数 policies，成功结果用单数 policy；版本及 policy／evidence 为固定身份。currentTopic、playedCards 回显已校验值。三个二项数组均按队伍0、1排序；basePowers／finalPowers分别等于 audit.teams 中对应队伍的 basePower／finalPower。顶层没有 characters 回显，但各队伍性格与timer完整保存在 audit.teams。

没有 winner、damage、HP、stress、available、playable、session 或 state 字段。`ok:true` 包含平局、双零牌力、默认牌码和无效话题等正常查询结果。

### 4.1 基础计算全部字段

```ts
type DebateAttackerSelectionBaseCalculationV1 = {
  cardClass: DebateAttackerSelectionCardClassV1;
  reason: DebateAttackerSelectionBaseReasonV1;
  cardTopic: DebateAttackerSelectionCardTopicV1;
  cardLevel: DebateAttackerSelectionCardLevelV1;
  fixedPower: 0 | 20 | 110 | 120;
  levelPower: 0 | 1 | 2 | 3;
  topicBonus: 0 | 10;
  topicMatched: boolean;
};
```

cardTopic／cardLevel 是普通牌映射的诊断值，非普通牌恒−1；不是指所有来源分支都调用了辅助函数。fixedPower只用于三种固定牌力，levelPower只用于普通牌。topicMatched只有普通牌且有效话题匹配时为true，并与topicBonus=10对应。

### 4.2 覆盖与队伍全部字段

```ts
type DebateAttackerSelectionOverrideAuditV1 = {
  applied: boolean;
  reason: DebateAttackerSelectionOverrideReasonV1;
  assignedPower: 100 | null;
};
type DebateAttackerSelectionTeamAuditV1 = {
  team: DebateAttackerSelectionTeamV1;
  card: number;
  personality: DebateAttackerSelectionPersonalityV1;
  angerTimer: number;
  baseCalculation: DebateAttackerSelectionBaseCalculationV1;
  basePower: number;
  override: DebateAttackerSelectionOverrideAuditV1;
  finalPower: number;
};
```

team固定与二项数组下标相同；card对应 playedCards[team]，性格／timer来自 characters[team]。basePower为基础计算三项之和。applied=true时 assignedPower=100且finalPower=100；否则 assignedPower=null且finalPower=basePower，不用0伪装未执行的覆盖。

### 4.3 比较与总审计全部字段

```ts
type DebateAttackerSelectionComparisonV1 = {
  rule: 'strict-greater-than';
  team0Power: number;
  team1Power: number;
  relation: DebateAttackerSelectionComparisonRelationV1;
  attacker: DebateAttackerSelectionAttackerV1;
};
type DebateAttackerSelectionAuditV1 = {
  currentTopicValid: boolean;
  teams: [DebateAttackerSelectionTeamAuditV1, DebateAttackerSelectionTeamAuditV1];
  comparison: DebateAttackerSelectionComparisonV1;
  externalRngConsumed: 0;
  stateWrites: 0;
};
```

currentTopicValid当且仅当currentTopic在0..2。即使两张牌都是非普通牌而不会使用话题加分，该布尔值仍完整返回。team0Power／team1Power为最终牌力，不是基础牌力；comparison.attacker与顶层attacker一致。

externalRngConsumed与stateWrites恒0，没有输入随机记录、隐藏RNG、会话缓存或跨调用状态。原因字符串、牌类、算术分解、审计字段及预算是工程可观察性合同，不声称现代C#返回过这些文字或收据，也不证明原生整链没有随机消耗。

## 5. 安全分离、不可变性与预算

模块初始化时取得并保存受信任 Node 运行时的 `process.getBuiltinModule('node:util').types.isProxy`。若该能力不可用，每次调用先返回 `unsupported-runtime`，**不检查输入**，不降级为无法排除 Proxy 的路径。不承诺浏览器、旧运行时或内建环境已遭替换时可用；本批没有运行能力探测来证明任一环境支持它。

领域检查之前，安全层完整分离输入：

- 允许 null、boolean、string、安全整数及下述普通对象／数组；通过安全层不代表满足字段语义。
- 普通对象原型须为 Object.prototype 或 null；数组原型须精确为 Array.prototype。自定义原型、类实例、Date、Map、Set和类型化数组拒绝。
- 先检查 Proxy 再反射对象；仅读取数据属性描述符，不调用 getter、setter、toJSON、回调或输入函数。
- 拒绝 Proxy、访问器、symbol键或值、undefined、function、bigint、非有限数、小数、不安全整数、负零与普通对象的非可枚举字段。
- 数组须稠密，只允许规范0..length−1索引及原生length字段，不接受空洞、额外属性或隐藏字段；length是唯一允许的非可枚举字段。
- 拒绝循环引用；重复但不成环的引用可接受，每次独立复制、独立计入预算，不保留调用者的共享引用关系。
- 数据属性安全复制，不调用输入序列化方法；`__proto__` 等额外名字不会成为特殊能力，随后按封闭字段规则拒绝。

| 预算 | 上界与计数方式 |
|---|---|
| 值节点 | 1024；根计1，每次访问值计1，重复非循环引用每次展开独立计数 |
| 深度 | 10；根深度0，每个属性值／数组元素深入1 |
| 单数组长度 | 32；领域层 characters／playedCards仍分别恰为2项 |
| 单对象自有键数 | 反射键数不超过1024，数组length也计为自有键 |
| 字符串／键预检 | 单个字符串或键的JS长度不超过16384；遍历累计字符串值及全部自有键UTF-8字节不超过16384 |
| 完整规范表示 | 对象键排序、数组保序、无空白，含JSON转义和标点的canonical表示UTF-8字节不超过16384 |
| 单次工作 | 1次双队伍查询、2次基础计算、2次覆盖检查、0次随机、0次状态写入 |

预算包含完整policies及后来才会被判为额外或错误的字段。预检累计还计入数组索引及length等键，故仅最终canonical字节不超限，并不足以保证通过全部预检。超限返回 `input-limit`，不裁剪、不部分求值。

安全分离先于封闭模式，所以未知字段藏有getter、函数、分数或负零时，先得 `malformed-data`，不是 `unknown-field`；多个安全问题按遍历首次遇到处停止，不承诺跨问题的全局错误排序。policy也接受同样分离，不能以不安全对象绕过精确比较。

输入与输出可共享已经冻结的导出常量；除此之外，成功结果仅来自已分离数据及受信任内部值。调用者可变数组不被推进、修改或冻结。失败对象同样冻结，且不暴露已处理队伍数、部分算术或错误路径。

## 6. 全部失败原因及优先顺序

```ts
type DebateAttackerSelectionFailureReasonV1 =
  | 'unsupported-runtime'
  | 'input-limit'
  | 'malformed-data'
  | 'unknown-field'
  | 'unsupported-profile'
  | 'unsupported-policy'
  | 'invalid-current-topic'
  | 'invalid-characters'
  | 'invalid-character'
  | 'invalid-personality'
  | 'invalid-anger-timer'
  | 'invalid-played-cards'
  | 'invalid-card';
```

| reason | 条件 |
|---|---|
| unsupported-runtime | 缺少受支持的受信任Proxy检测能力，先于检查输入 |
| input-limit | 安全分离的节点／深度／数组／键数／字节预算超限 |
| malformed-data | 不安全形态或数值、循环、访问器等；顶层非record；顶层／角色缺键；未分类内部异常也封闭归入此码 |
| unknown-field | 通过安全层的顶层或某角色有额外键 |
| unsupported-profile | schemaVersion不为1或profile不为精确固定字符串 |
| unsupported-policy | policies完整canonical表示与政策不相等，含整体类型错误、缺键、多键、错值或数组错序 |
| invalid-current-topic | 通过安全层的currentTopic不是数字或不在signed32范围，不是“不在0..2” |
| invalid-characters | characters不是数组或长度不为2 |
| invalid-character | 某角色不是非null、非数组的record |
| invalid-personality | 某角色personality不属于四个支持字符串 |
| invalid-anger-timer | 某角色angerTimer不是数字0..4 |
| invalid-played-cards | playedCards不是数组或长度不为2 |
| invalid-card | 某张牌不是数字或不在signed32范围，不是“不在0..14” |

完整领域顺序如下：

1. 运行时能力；安全分离整个输入及所有预算，先于任何领域检查。
2. 顶层须为record；先拒绝额外键，再检查必需键。
3. schemaVersion/profile，然后完整policies，然后currentTopic。
4. characters须为二项数组；按下标0再1解析角色。每项先record、额外键、缺键，再personality、angerTimer。
5. playedCards须为二项数组；按下标0再1校验signed32数字。
6. 仅全部通过后，按第3节完成两次基础计算、两次覆盖及严格比较。

角色非record才是invalid-character；角色record缺键仍为malformed-data，多键仍为unknown-field。顶层同时缺键又多键，unknown-field优先。policy用完整规范值比较，不能将其中的缺键／多键按顶层封闭模式解释。数组空洞、非法数值等安全问题也会早于领域长度检查。

失败没有schemaVersion、profile、policy、evidence或audit，不发布已成功解析的第一个角色或部分牌力。没有“无效话题值”“默认牌码”“平局”所特设的失败码；这些在signed32和其他合同条件满足时均为成功查询。

## 7. 完整固定政策字面量

`DEBATE_ATTACKER_SELECTION_POLICY_V1` 是唯一政策，输入可引用该常量或提供逐值相同的安全副本。不接受仅id、局部覆盖或近似策略。以下为完整固定值；所有字符串都是合同字面量，不能用中文释义替换。

```json
{
  "id": "debate-attacker-selection-policy-v1",
  "profile": "debate-attacker-selection-reference-v1",
  "checkpoint": {
    "characters": 2,
    "teams": [0, 1],
    "personality": "caller-resolved-timid-calm-bold-or-reckless",
    "angerTimer": {"minimum": 0, "maximum": 4},
    "currentTopic": {"minimum": -2147483648, "maximum": 2147483647},
    "playedCards": {"length": 2, "minimum": -2147483648, "maximum": 2147483647},
    "bounds": "explicit-engine-checkpoint-domain-not-universal-source-reachability"
  },
  "cards": {
    "rethink": 0,
    "story": [1, 2, 3],
    "logic": [4, 5, 6],
    "trend": [7, 8, 9],
    "shout": 10,
    "sophistry": 11,
    "ignore": 12,
    "compose": 13,
    "agitate": 14,
    "topicCodes": [0, 1, 2],
    "ordinaryLevelCodes": [0, 1, 2],
    "otherCardTopicAndLevel": -1
  },
  "basePower": {
    "ignore": 120,
    "shout": 110,
    "sophistry": 20,
    "topic": "one-plus-zero-based-level-plus-valid-matching-topic-bonus",
    "matchingTopicBonus": 10,
    "invalidCurrentTopic": "accepted-with-no-topic-bonus",
    "otherCards": 0,
    "outOfRangeCard": "accepted-with-zero-base-power"
  },
  "override": {
    "condition": "positive-timer-and-bold-only",
    "assignedPower": 100,
    "operation": "unconditional-assignment-not-maximum-or-addition",
    "appliesToEverySigned32Card": true,
    "canLowerIgnoreAndShout": true
  },
  "selection": {
    "order": ["team-0-base-power", "team-1-base-power", "team-0-bold-override", "team-1-bold-override", "strict-power-comparison"],
    "comparison": "strict-greater-than",
    "team0Greater": 0,
    "team1Greater": 1,
    "equal": -1
  },
  "safety": {
    "input": "closed-schema-detached-safe-JSON-data-with-exact-policy",
    "requiredRuntime": "trusted-node-util-types-isProxy-via-process-getBuiltinModule",
    "unavailableProxyDetector": "fail-closed-before-inspecting-input",
    "proxiesAccessorsAndExecutableValues": "rejected-without-invocation",
    "result": "recursively-frozen-and-detached-from-input",
    "failure": "typed-code-only-no-partial-audit"
  },
  "capacity": {
    "maxInputNodes": 1024,
    "maxInputDepth": 10,
    "maxInputArrayLength": 32,
    "maxCanonicalUtf8Bytes": 16384,
    "evaluations": 1,
    "basePowerCalculations": 2,
    "overrideChecks": 2,
    "randomDraws": 0,
    "stateWrites": 0
  },
  "boundary": {
    "kind": "two-team-pure-attacker-selection-query",
    "personalityResolution": "caller-supplied-not-evaluated",
    "availabilityOwnershipHpAndTurnLegality": "not-checked-not-applied",
    "sourceAttackerAssignment": "returned-not-written-to-state",
    "winnerAndDamage": "not-evaluated",
    "rng": "no-implementation-no-external-consumption",
    "sessionIntegration": false,
    "persistence": false,
    "legacyProfilesChanged": false
  }
}
```

Policy类型保留上述全部字符串、数字、boolean及tuple的递归readonly字面量，不是任意record。JSON示意仅表达值，不表示输入必须先序列化为字符串。

## 8. 完整固定证据与解释边界

`DEBATE_ATTACKER_SELECTION_EVIDENCE_V1` 的完整固定值如下；Evidence类型递归readonly，保留字面量。证据由模块返回，不是调用者可提供或修改的输入字段。

```json
{
  "sourceIdentity": "modern-CSharp-translation-not-native-or-PK-or-Vanilla",
  "repository": "https://github.com/tankyc/sango_infinity",
  "sourceCommit": "a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef",
  "debatePath": "Project/Assets/Sango/Scripts/Game/Debate/Debate.cs",
  "debateBlob": "0137498d10773cd4596d497083ccdf6a26b3a261",
  "debateSha256": "622789ca8b8b6799a321526dcfb513d6622adf5b5d54025175c2a7795ef7da28",
  "debateEnumPath": "Project/Assets/Sango/Scripts/Game/Debate/DebateEnum.cs",
  "debateEnumBlob": "5b46a8ac87613193eb9f4b99a25e489ba6f5e483",
  "sourceResolvedPersonalityLines": [369, 375],
  "sourceCardTopicLines": [853, 873],
  "sourceCardLevelLines": [875, 893],
  "sourceCardPowerLines": [906, 929],
  "sourceAttackerSelectionLines": [1128, 1142],
  "sourceCardEnumLines": [33, 61],
  "sourcePersonalityEnumLines": [116, 124],
  "sourceBehavior": "both-base-powers-then-unconditional-positive-timer-bold-overrides-then-strict-comparison",
  "personalityBoundary": "CharacterGetPersonality-result-supplied-by-caller-no-person-fallback-run",
  "stateBoundary": "source-attacker-field-assignment-returned-as-data-not-applied",
  "boundsSafetyBudgetsAuditAndReasonNames": "engine-policy",
  "nativeEquivalent": false,
  "stockOriginalVerified": false,
  "pkEquivalent": false,
  "vanillaEquivalent": false,
  "completeDebate": false,
  "p078": "excluded",
  "nativeWholeChain": "open",
  "nativeDeckRegenerationIntegration": "excluded",
  "nativeRngStream": "excluded",
  "legacySessionIntegration": "excluded"
}
```

固定提交主来源为 [GetCardPower第906–929行](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L906-L929)与[CalcAttacker第1128–1142行](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L1128-L1142)。普通牌映射来自[第853–893行](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L853-L893)，牌码与性格对应来自同提交的[DebateEnum.cs](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/DebateEnum.cs)。[人物性格解析第369–375行](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L369-L375)仅说明调用者输入来源，本核不执行该解析。

本核只新增独立攻击方查询，不把已有HP公式核、可用性核或入场／连击核拼成完整会话。完整双次愤怒阶段、胜负／崩坏／回合结束编排、冷静再考／刚胆耗牌、计时推进、全回合随机／身份预算与会话接入仍开放。人物／书籍解析、非恒等人物hook、开场／追击／留情及campaign均在范围外；P078及全部依赖排除。

所有输入域、安全预算、审计及原因名都是工程合同，不冒充原生证据。九个旧profile及其原政策、存档、拒绝边界不因本组件而改变；43证据主题／45历史快照缺口仍保留。

## 9. 紧凑纸面示例，未执行

下列为完整输入构造示意，没有调用函数；预期仅按静态文本人工推导，不是运行输出或测试通过。

```ts
const input: DebateAttackerSelectionInputV1 = {
  schemaVersion: 1,
  profile: 'debate-attacker-selection-reference-v1',
  policies: DEBATE_ATTACKER_SELECTION_POLICY_V1,
  currentTopic: 0,
  characters: [
    { personality: 'bold', angerTimer: 1 },
    { personality: 'calm', angerTimer: 0 },
  ],
  playedCards: [12, 10],
};
```

纸面预期：basePowers=[120,110]，finalPowers=[100,110]，attacker=1。队伍0基础原因ignore-fixed、覆盖positive-timer-bold／true／100；队伍1基础原因shout-fixed、覆盖timer-zero／false／null。两边cardTopic/cardLevel均−1，levelPower/topicBonus均0，topicMatched均false。audit.currentTopicValid=true，comparison={rule:'strict-greater-than',team0Power:100,team1Power:110,relation:'team-1-greater',attacker:1}，externalRngConsumed=0、stateWrites=0。其余固定身份及字段仍按第4节完整返回，不另定义简化成功类型。

几个相互独立的人工对照，均假定其他结构及政策完全合法：

| 输入要点 | 纸面预期 |
|---|---|
| 双方bold且timer>0，任意已接受牌码 | finalPowers=[100,100]，attacker=−1，relation=equal |
| 双方无覆盖，currentTopic=0，playedCards=[3,6] | base/final=[13,3]，attacker=0；原因topic-match与topic-unmatched |
| 双方无覆盖，currentTopic=−1，playedCards=[3,−1] | base/final=[3,0]，attacker=0；currentTopicValid=false；原因topic-invalid-current与other-card-zero |
| 队伍0为bold/4，currentTopic=2147483647，playedCards=[−2147483648,11]，队伍1无覆盖 | base=[0,20]，final=[100,20]，attacker=0；队伍0牌类out-of-range，不是合法出牌证明 |
| 双方无覆盖，playedCards=[0,13] | base/final=[0,0]，attacker=−1，仍ok=true |
| currentTopic=2147483648 | ok=false、invalid-current-topic，无audit |
| playedCards=[15,2147483648] | ok=false、invalid-card；15本身是合法默认牌码 |
| 任一timer=5 | ok=false、invalid-anger-timer |
| 任一牌为−0或1.5 | ok=false、malformed-data，先于领域检查 |
| 顶层多available字段，同时缺playedCards | 安全值前提下ok=false、unknown-field优先 |
| 第二个角色多hp字段，第一张牌为2147483648 | 安全值前提下ok=false、unknown-field；角色检查先于牌范围 |
| policies只有正确id | ok=false、unsupported-policy |

本页及配套案例只作静态规格与纸面推导。本批未运行测试、编译、typecheck、build、validator、checker、诊断、候选模块、来源代码、示例、场景或replay，也未验证运行时能力；不得据此宣称运行通过、原生等价或完整舌战闭环。
