# 独立通用体力请求伤害 API v1

[规则与来源边界](../rules/debate-hp-damage-v1.md) · [固定政策与证据](../sources/debate-hp-damage-v1.json) · [纸面案例，未运行](../../data/scenarios/debate-hp-damage-example-v1.json)。

实现入口为 [debate-hp-damage.ts](../../packages/engine/src/debate-hp-damage.ts)，公共导出见 [engine index](../../packages/engine/src/index.ts)。本页按最终实现的静态文本描述固定现代 C# `CalcHpDamage(team, card)` 中、人物修正钩子之前的通用整数公式，并将后置 `ModifyHpDamage` 限定为恒等结果。调用者提供已解析的性格、计时器、攻击值、当前话题、牌码和一条有界随机记录。

`requestedHpDamage` 只是这次公式得到的**请求扣血量**，不是实际扣除的 HP、出牌许可、胜负结果或可达状态证明。本核不选择攻击者、不比较双方牌、不检查手牌所有权或可用性、不生成随机数、不读取或写入 HP／stress，也不执行人物特殊修正。`genericOnly:true` 是调用者对恒等钩子边界的明确断言，**不是核验真实人物没有特殊行为**。

本核独立于旧九个会话及已有独立核：不接入、不迁移存档、不改旧 profile／政策／拒绝边界。现代参考核的增加不减少43个证据主题／45个历史快照缺口；P078及其依赖仍排除，原生完整链仍未闭合。

## 1. 公开入口与全部类型别名

唯一函数与两个常量：

```ts
evaluateDebateHpDamage(input: unknown): DebateHpDamageResultV1
DEBATE_HP_DAMAGE_POLICY_V1: DebateHpDamagePolicyV1
DEBATE_HP_DAMAGE_EVIDENCE_V1: DebateHpDamageEvidenceV1
```

没有 create、preview、execute、save、load、replay、session 或批量求值入口。运行时输入是 JSON 式数据值，不是 JSON 字符串；参数类型为 `unknown`，TypeScript 声明不能跳过安全分离与领域校验。

全部18个公开类型别名如下。复合类型递归 readonly；后文结构展示省略重复 readonly，不引入额外导出。

| 公开别名 | 完整定义位置或值域 |
|---|---|
| `DebateHpDamagePersonalityV1` | `'timid' \| 'calm' \| 'bold' \| 'reckless'` |
| `DebateHpDamageTopicV1` | `0 \| 1 \| 2` |
| `DebateHpDamageCardTopicV1` | `-1 \| 0 \| 1 \| 2` |
| `DebateHpDamageCardLevelV1` | `-1 \| 0 \| 1 \| 2` |
| `DebateHpDamageRawDrawV1` | 第2节三字段随机记录 |
| `DebateHpDamageInputV1` | 第2节十字段完整输入 |
| `DebateHpDamageTopicReasonV1` | 第3.2节五种话题系数分支原因 |
| `DebateHpDamageLevelReasonV1` | 第3.3节五种等级系数原因 |
| `DebateHpDamageAngerReasonV1` | 第3.4节两种愤怒系数原因 |
| `DebateHpDamageArithmeticV1` | 第4.1节十一字段整数运算账本 |
| `DebateHpDamageDrawAuditV1` | 第4.2节四字段抽取审计 |
| `DebateHpDamageAuditV1` | 第4.2节十字段分支与消耗审计 |
| `DebateHpDamageSuccessV1` | 第4节十六字段成功结果 |
| `DebateHpDamageFailureReasonV1` | 第6节十七种失败原因 |
| `DebateHpDamageFailureV1` | `{ok:false,reason:DebateHpDamageFailureReasonV1}` |
| `DebateHpDamageResultV1` | `DebateHpDamageSuccessV1 \| DebateHpDamageFailureV1` |
| `DebateHpDamagePolicyV1` | 第7节完整固定政策的递归 readonly 字面量类型 |
| `DebateHpDamageEvidenceV1` | 第8节完整固定证据的递归 readonly 字面量类型 |

成功、失败、嵌套对象、数组及两个导出常量均递归冻结。先安全分离输入，再解析和求值，不修改或冻结调用者对象，不保留调用者所有的可变输入引用。输入与结果可以共享已冻结的导出常量；policy／evidence 可使用内部冻结常量，不承诺每次调用产生新的常量对象身份。比较值，不要依赖跨调用引用身份。

失败恰为 `{ok:false,reason}`，不含 schemaVersion、profile、policy、evidence、输入回显、错误位置、部分 arithmetic、部分 audit 或已消费计数。没有隐藏会话状态、上次结果缓存或跨调用随机游标。

## 2. 完整输入合同

```ts
type DebateHpDamageRawDrawV1 = {
  role: 'debate-hp-damage-jitter';
  bound: 5;
  value: number;
};
type DebateHpDamageInputV1 = {
  schemaVersion: 1;
  profile: 'debate-hp-damage-reference-v1';
  policies: DebateHpDamagePolicyV1;
  genericOnly: true;
  personality: DebateHpDamagePersonalityV1;
  angerTimer: number;
  resolvedAttack: number;
  currentTopic: DebateHpDamageTopicV1;
  card: number;
  rawDraws: [DebateHpDamageRawDrawV1];
};
```

顶层恰有上述十个必需键；随机记录恰有上述三个必需键。不补默认值、不接受额外键，不转换数字字符串、真假值、分数或枚举别名。

| 字段 | 运行时要求 |
|---|---|
| schemaVersion / profile | 精确为数字1 / `debate-hp-damage-reference-v1` |
| policies | 与第7节完整政策逐值一致，不是仅 id；对象键顺序无关，数组顺序有关 |
| genericOnly | 精确为 boolean `true`；false、1、字符串或 null 都不接受 |
| personality | timid（胆小）、calm（冷静）、bold（刚胆）、reckless（莽撞）之一 |
| angerTimer | 整数0..4，零与正数决定系数分支 |
| resolvedAttack | 整数70..227，调用者已经解析的 `characters[team].attack` |
| currentTopic | 数字0、1或2，依次为故事、道理、时节 |
| card | 整数−1..14，映射见第3.1节 |
| rawDraws | 恰好一项的稠密数组，不接受零项或额外抽取 |
| rawDraws[0].role | 精确字符串 `debate-hp-damage-jitter` |
| rawDraws[0].bound | 精确数字5，表示值域上界不含5 |
| rawDraws[0].value | 整数0..4，不是 seed 或无界原始随机值 |

所有数值在字段解析之前已要求为安全整数且不是负零。比如 resolvedAttack=69 是 `invalid-resolved-attack`，resolvedAttack=70.5 却先是 `malformed-data`；card=15 是 `invalid-card`，card=−0 同样先是 `malformed-data`。输入的 card 值域是这个核的工程检查点域，不沿用可用性核的整个有符号32位域。

personality 是调用者已经解析的 `CharacterGetPersonality` 结果，不是人物 ID、原始数值枚举或供本核解析的完整人物对象。resolvedAttack 已包含调用者决定的上游攻击值来源；本核不按智力、武力、人物或书籍再推导攻击值。angerTimer 的0..4任一整数都接受，不按性格强行限制 timid／reckless 只能为0或1，不验证该组合由真实游戏历史可达。

`genericOnly:true` 限定本次数学模型的后置人物修正为恒等：返回公式整数本身。它不查询人物身份、不接受行为注册表或回调、不执行 `ModifyHpDamage`，也不能证明特定真实人物满足这一前提。如果人物钩子可能改变伤害，不能把本核结果当作该人物的最终请求伤害。

没有 team、characters、opponent、person、personId、hp、stress、hand、cardToken、canRethink、available、phase、seed、RNG 回调、预计算系数、requestedHpDamage、audit 或 evidence 输入。将其他核的完整角色或状态直接塞入本对象会因额外键失败；调用者须显式投影这十个字段。

即使 card=−1、0、11..14最终给出零伤害，也必须提供完整合法的 personality、timer、attack、topic、policy 和恰好一条随机记录。零伤害不是绕过校验或省略抽取的路径。

## 3. 来源分支、牌码和整数算式

### 3.1 牌码及辅助映射

| card | 含义 | cardTopic | cardLevel | levelCoef |
|---|---|---|---|---|
| −1 | 无普通牌的检查点值 | −1 | −1 | 0 |
| 0 | 再考 | −1 | −1 | 0 |
| 1 / 2 / 3 | 故事小／中／大 | 0 | 0 / 1 / 2 | 10 / 15 / 20 |
| 4 / 5 / 6 | 道理小／中／大 | 1 | 0 / 1 / 2 | 10 / 15 / 20 |
| 7 / 8 / 9 | 时节小／中／大 | 2 | 0 / 1 / 2 | 10 / 15 / 20 |
| 10 | 大喝 | −1 | −1 | 15，来自专门分支 |
| 11 / 12 / 13 / 14 | 诡辩／无视／镇静／激昂 | −1 | −1 | 0 |

cardTopic 对应 `GetCardTopic` 的辅助映射，cardLevel 对应 `GetCardLevel` 的辅助映射。二者总会出现在成功结果中，**不表示来源当次分支真的调用或比较了该辅助值**。尤其大喝 cardLevel=−1，但专门的 levelCoef=15；不能用 cardLevel=−1推断大喝零伤害。

本核允许计算−1和0..14中的任一牌码，不判断该牌在该性格／timer／阶段是否可以打出。非伤害牌的零结果只描述这条通用 HP 公式，不表示其完整游戏效果为空。

### 3.2 topicCoef 与全部 TopicReason

先设 topicCoef=6，然后按来源的外层 timer 分支求值：

| 条件，按来源优先关系 | topicCoef | topicReason | cardTopicCompared |
|---|---|---|---|
| angerTimer>0，timid 或 bold | 10 | `positive-timer-timid-or-bold` | false |
| angerTimer>0，calm 或 reckless | 6 | `positive-timer-calm-or-reckless-default` | false |
| angerTimer=0，card=10 | 12 | `zero-timer-shout` | false |
| angerTimer=0，非大喝，cardTopic=currentTopic | 10 | `zero-timer-matching-topic` | true |
| angerTimer=0，非大喝，cardTopic≠currentTopic | 6 | `zero-timer-default` | true |

以上五个字符串构成 `DebateHpDamageTopicReasonV1` 的全部值。

正 timer 分支会完全跳过零 timer 的大喝与匹配话题判断，而不是“先尝试愤怒加成，否则回退大喝／匹配话题”。因此愤怒 calm／reckless 即使打出大喝或当前话题牌，topicCoef 仍是6；愤怒 timid／bold 的大喝则是10，不是12。

currentTopic 只能为0..2，因此 cardTopic=−1的非大喝牌在零 timer 分支不会匹配；此时 cardTopicCompared 仍为 true，因为来源的比较确实到达，只是结果不匹配。正 timer 下即使两个诊断值相等，cardTopicCompared 也为 false。

### 3.3 levelCoef 与全部 LevelReason

等级系数独立于 timer、性格及话题匹配。先检查大喝；否则使用辅助等级：

| 条件 | levelCoef | levelReason | cardLevelLookupUsed |
|---|---|---|---|
| card=10 | 15 | `shout-fixed-level` | false |
| cardLevel=0，普通小牌 | 10 | `ordinary-level-zero` | true |
| cardLevel=1，普通中牌 | 15 | `ordinary-level-one` | true |
| cardLevel=2，普通大牌 | 20 | `ordinary-level-two` | true |
| 其他合法牌码 | 0 | `non-damaging-card-zero-level` | true |

以上五个字符串构成 `DebateHpDamageLevelReasonV1` 的全部值。非伤害牌依旧走等级查找并得到−1，随后给0系数，不省略接下来的愤怒系数与抽取／算式步骤。

### 3.4 angerCoef 与全部 AngerReason

仅当 angerTimer>0且 personality=calm 时，angerCoef=15、angerReason=`positive-timer-calm`；所有其他情况为 angerCoef=10、angerReason=`default`。这两个字符串是 `DebateHpDamageAngerReasonV1` 的全部值。

这里不能套用卡牌可用性核中“正 timer 且 calm／bold 才算局部 angered”的概念：本公式对四种性格直接按自己的 timer 分支处理，并未接收或返回一个通用 angered 布尔值。

### 3.5 单次抽取与算式顺序

来源先求 topic、level、anger 三个系数，再无条件取得一次 `RandInt(5)`。本核不调用 RNG，而是消费调用者给出的唯一 `rawDraws[0].value`，严格按下列顺序保留整数中间值：

```text
attackWithJitter = resolvedAttack + jitter
afterAnger = attackWithJitter × angerCoef
afterLevel = afterAnger × levelCoef
numerator = afterLevel × topicCoef
requestedHpDamage = trunc(numerator / 1000)
```

只在全部乘法之后除1000并向零截断一次，不逐步除、不四舍五入、不额外 clamp。接受域内所有量非负，因此这个向零截断也等于向下取整；这里不据此扩展到负攻击值或负伤害。

即使 levelCoef=0，仍保留 attackWithJitter 与 afterAnger，消费恰好一条记录；随后 afterLevel、numerator、requestedHpDamage 为0。`consumedDraws=1` 是本次使用一条调用者已提供的记录，`externalRngConsumed=0` 则表示没有向外部 RNG 请求任何抽取，二者不矛盾。失败不返回部分抽取审计，也不会生成或改写调用者的随机流。

在这个有限域内，attackWithJitter 为70..231，afterAnger 最大3465，afterLevel 最大69300，numerator 为0..462000，requestedHpDamage 为0..462，整数中间值可精确表示。不能把独立系数的最大值直接同时相乘：angerCoef=15的 calm 正 timer 分支强制 topicCoef=6；其最大请求伤害为415。全域最大462由231×10×20×10÷1000得到。来源注释中的693保留为来源文字，但不是本域的上界，不能用它代替实际分支约束。这些范围是静态人工推导，不是运行证明。

## 4. 成功结果与全部审计字段

```ts
type DebateHpDamageSuccessV1 = {
  ok: true;
  schemaVersion: 1;
  profile: 'debate-hp-damage-reference-v1';
  policy: DebateHpDamagePolicyV1;
  evidence: DebateHpDamageEvidenceV1;
  genericOnly: true;
  personality: DebateHpDamagePersonalityV1;
  angerTimer: number;
  resolvedAttack: number;
  currentTopic: DebateHpDamageTopicV1;
  card: number;
  cardTopic: DebateHpDamageCardTopicV1;
  cardLevel: DebateHpDamageCardLevelV1;
  requestedHpDamage: number;
  arithmetic: DebateHpDamageArithmeticV1;
  audit: DebateHpDamageAuditV1;
};
```

输入使用复数 policies，成功结果使用单数 policy。schemaVersion、profile、policy、evidence 是固定版本身份；genericOnly、personality、angerTimer、resolvedAttack、currentTopic、card 回显已校验值。cardTopic／cardLevel 是第3.1节的诊断辅助值，是否实际使用由审计布尔值表达。

requestedHpDamage 等于 arithmetic.truncatedDamage。结果没有 actualHpDamage、hpBefore、hpAfter、stress、attacker、winner、playable 或 state 字段；调用者不能将不存在的状态效果从成功标志推导出来。`ok:true` 表示合同内计算成功，包括伤害为0的正常结果。

### 4.1 全部算术字段

```ts
type DebateHpDamageArithmeticV1 = {
  resolvedAttack: number;
  jitter: number;
  attackWithJitter: number;
  angerCoef: 10 | 15;
  afterAnger: number;
  levelCoef: 0 | 10 | 15 | 20;
  afterLevel: number;
  topicCoef: 6 | 10 | 12;
  numerator: number;
  divisor: 1000;
  truncatedDamage: number;
};
```

resolvedAttack 是输入攻击值，jitter 是已接受的唯一 draw.value，其余值逐项对应第3.5节，不省略零值。divisor 恒1000，truncatedDamage 与顶层 requestedHpDamage 一致。这里没有浮点系数、预截断值、余数或后置人物覆盖伤害。

### 4.2 全部分支与抽取字段

```ts
type DebateHpDamageDrawAuditV1 = {
  index: 0;
  role: 'debate-hp-damage-jitter';
  bound: 5;
  value: number;
};
type DebateHpDamageAuditV1 = {
  topicReason: DebateHpDamageTopicReasonV1;
  levelReason: DebateHpDamageLevelReasonV1;
  angerReason: DebateHpDamageAngerReasonV1;
  cardTopicCompared: boolean;
  cardLevelLookupUsed: boolean;
  draws: [DebateHpDamageDrawAuditV1];
  consumedDraws: 1;
  externalRngConsumed: 0;
  stateWrites: 0;
  modifyHpDamage: 'identity-only-not-invoked';
};
```

三种 reason 分别记录第3.2、3.3、3.4节实际选择的系数分支，不是输入错误码。cardTopicCompared 仅在零 timer 且非大喝时为 true；cardLevelLookupUsed 除大喝外恒 true。辅助值始终可见与来源分支未到达可以同时成立。

draws 恰有一项，index 恒0，role／bound／value 逐值对应合法输入记录；没有 RNG 状态、seed、重试记录或额外消耗。consumedDraws 恒1，externalRngConsumed 与 stateWrites 恒0。modifyHpDamage 恒 `identity-only-not-invoked`，明确不宣称运行了真实人物钩子。原因名、账本、审计字段与工程预算是本 API 的可观察性合同，不冒充 C# 返回了这些文字或收据。

## 5. 安全分离、不可变性与输入预算

模块初始化时取得并保存受信任 Node 运行时的 `process.getBuiltinModule('node:util').types.isProxy`。若这项能力不可用，每次调用先返回 `unsupported-runtime`，不检查输入、不降级到无法排除 Proxy 的路径。本合同不承诺浏览器、旧运行时或内建环境已遭替换时可用；本批也未执行探测证明当前环境支持此能力。

安全层沿用先前独立卡牌可用性核的模式，先于任何领域检查完整分离输入：

- 可接受 null、boolean、string、安全整数及符合下述限制的普通对象／数组；通过安全层不代表通过对应领域字段。
- 普通对象原型只能为 Object.prototype 或 null；数组原型必须精确为 Array.prototype。类实例、Date、Map、Set、类型化数组与自定义原型拒绝。
- 对象先检查 Proxy 再反射原型及自有属性；仅读取数据属性描述符，不调用 getter、setter、toJSON、回调或输入函数。
- 拒绝 Proxy、访问器、symbol 键或值、undefined、function、bigint、非有限数、小数、不安全整数与负零；拒绝普通对象的非可枚举字段。
- 数组须稠密，只能有规范0..length−1索引及原生 length 字段，不接受空洞、额外属性、符号或隐藏字段；length 是唯一允许的非可枚举字段。
- 拒绝循环引用。重复但不成环的引用可以接受，每次独立复制、重复计入预算，结果不保留调用者的共享引用关系。
- 按数据值复制对象，不调用输入序列化方法；额外领域键随后由封闭模式拒绝，`__proto__` 等名字不会成为特殊输入能力。

| 预算 | 上界与计数方式 |
|---|---|
| 值节点 | 1024；根值计1，每次访问的值计1，重复非循环引用的每次展开独立计数 |
| 嵌套深度 | 10；根深度0，每个属性值／数组元素深入1 |
| 单个数组长度 | 32；领域层 rawDraws 仍只允许1项，不是32条随机预算 |
| 单个对象自有键数 | 反射所得键数不超过1024；数组 length 也属于自有键 |
| 字符串／键预检 | 单个字符串或键的 JS 长度不超过16384；遍历累计字符串值与所有自有键 UTF-8 字节不超过16384 |
| 完整规范表示 | 对象键排序、数组保序、无空白、包含 JSON 转义与标点的 canonical 表示 UTF-8 字节不超过16384 |
| 单次计算 | 1个通用伤害检查点、1条调用者记录、0次外部随机、0次状态写入 |

预算覆盖整个输入，包括完整 policies 与后来会被判为多余或错误的字段。中间字符串／键累计包含数组索引、length 等键，所以最终 canonical 不超16384并不单独保证通过所有预检。超限返回 `input-limit`，不裁剪、不做部分求值。

安全分离阶段先发生，故未知字段中的 getter、函数、分数或负零会先产生 `malformed-data`，而非 `unknown-field`；合规但含未知键的数据才进入封闭字段检查。数字1.5放在任一字段中都会先被安全层拒绝，即使该字段本应返回另一种领域错误。policy 本身也参与同样的安全分离，不允许用不安全对象绕过精确值比较。

输入的每个可变对象都先复制，成功结果只组装分离数据和受信任的冻结常量；失败对象同样冻结。不会修改调用者的数组、推进调用者游标或冻结调用者对象。输入若引用 `DEBATE_HP_DAMAGE_POLICY_V1`，返回 policy 可以是同一个已冻结导出常量，这不构成保留可变输入引用的例外漏洞。

## 6. 全部失败原因及优先顺序

```ts
type DebateHpDamageFailureReasonV1 =
  | 'unsupported-runtime'
  | 'input-limit'
  | 'malformed-data'
  | 'unknown-field'
  | 'unsupported-profile'
  | 'unsupported-policy'
  | 'invalid-generic-only'
  | 'invalid-personality'
  | 'invalid-anger-timer'
  | 'invalid-resolved-attack'
  | 'invalid-current-topic'
  | 'invalid-card'
  | 'invalid-raw-draws'
  | 'invalid-draw'
  | 'invalid-draw-role'
  | 'invalid-draw-bound'
  | 'invalid-draw-value';
```

| reason | 条件 |
|---|---|
| unsupported-runtime | 没有受支持的受信任 Proxy 检测能力，先于检查输入 |
| input-limit | 安全分离的节点／深度／数组／键数／字节预算超限 |
| malformed-data | 不安全数据形态或数字、访问器、循环等；顶层不是 record；顶层或抽取记录缺必需键；未分类的内部异常也封闭归入此码 |
| unknown-field | 安全数据的顶层或单条抽取记录含未列出的键 |
| unsupported-profile | schemaVersion 不为1或 profile 不精确匹配 |
| unsupported-policy | policies 与完整固定政策规范表示不等，包括缺键、多键、错值、数组错序或整体类型错误 |
| invalid-generic-only | genericOnly 不精确为 true |
| invalid-personality | personality 不是四个支持字符串之一 |
| invalid-anger-timer | 通过安全层的 angerTimer 不是数字0..4 |
| invalid-resolved-attack | 通过安全层的 resolvedAttack 不是数字70..227 |
| invalid-current-topic | 通过安全层的 currentTopic 不是数字0..2 |
| invalid-card | 通过安全层的 card 不是数字−1..14 |
| invalid-raw-draws | rawDraws 不是数组，或长度不是1 |
| invalid-draw | 唯一抽取项不是非 null、非数组 record |
| invalid-draw-role | role 不精确为 `debate-hp-damage-jitter` |
| invalid-draw-bound | bound 不精确为数字5 |
| invalid-draw-value | 通过安全层的 value 不是数字0..4 |

完整优先顺序：

1. 检查运行时能力，安全分离全部输入并执行全部预算。此阶段在遍历首次遇到问题时停止；若同时有多个安全问题，不保证返回某个领域错误码。
2. 顶层须为 record；先拒绝额外键，再检查必需键是否齐全。
3. schemaVersion／profile，然后完整 policies，然后 genericOnly，然后 personality。
4. 依次校验 angerTimer、resolvedAttack、currentTopic、card。
5. rawDraws 须为恰好一项的数组；该项先 record、额外键、缺键，再依次 role、bound、value。
6. 所有输入通过后，按第3节顺序计算系数、消费唯一已提供抽取并组装算式／审计。

顶层同时多键和缺键时是 unknown-field；抽取项为合规 record 但缺键时是 malformed-data，多键时是 unknown-field，不能混作 invalid-draw。policy 不采用顶层／抽取项的逐键错误分类，安全分离后整体不等就是 unsupported-policy。

例：card=15且 rawDraws=[]，在通过安全层及前置字段后先得到 invalid-card；card=15且 draw.value=1.5，则完整安全分离先得到 malformed-data。即使是零伤害牌，rawDraws=[]仍返回 invalid-raw-draws，而不是成功零结果。失败不泄露字段路径、已检查数量或部分运算／抽取审计。

## 7. 完整固定政策字段清单

`DEBATE_HP_DAMAGE_POLICY_V1` 是唯一政策，完整原文字面量见[实现常量](../../packages/engine/src/debate-hp-damage.ts)及[来源账本](../sources/debate-hp-damage-v1.json)。输入可引用导出常量或提供逐值一致的安全副本；不接受仅 id、局部覆盖、近似策略或自由文字。下表枚举全部字段与子字段，不维护第二份重复的大型 JSON。

| 路径 | 全部子字段及固定含义 |
|---|---|
| id | `debate-hp-damage-policy-v1` |
| profile | `debate-hp-damage-reference-v1` |
| checkpoint | genericOnly=true；personality 指明调用者解析四性格；angerTimer={minimum:0,maximum:4}；resolvedAttack={minimum:70,maximum:227}；currentTopic={minimum:0,maximum:2}；card={minimum:−1,maximum:14}；bounds 指明工程检查点而非普遍可达域 |
| cards | none=−1；rethink=0；story=[1,2,3]；logic=[4,5,6]；trend=[7,8,9]；shout=10；sophistry=11；ignore=12；compose=13；agitate=14；topicCodes=[0,1,2]；ordinaryLevelCodes=[0,1,2]；otherCardTopicAndLevel=−1 |
| coefficients | topicDefault=6；positiveTimerTimidOrBold=10；positiveTimerCalmOrReckless=6；zeroTimerShout=12；zeroTimerMatchingOrdinaryTopic=10；positiveTimerSkipsShoutAndMatchingTopicBranches=true；shoutLevel=15；ordinaryLevels=[10,15,20]；otherCardLevel=0；angerDefault=10；positiveTimerCalmAnger=15 |
| arithmetic | order=[attack-plus-jitter,multiply-anger,multiply-level,multiply-topic,divide-1000]；division 指明全部乘法后一次向零截断；intermediate 指明接受域内精确安全整数；divisor=1000；minimumRequestedHpDamage=0；maximumRequestedHpDamage=462；maximumNumerator=462000；sourceComment693 指明不作为本域上界；modifyHpDamage=`identity-only-not-invoked` |
| draw | role=`debate-hp-damage-jitter`；bound=5；minimum=0；maximum=4；count=1；zeroLevelStillConsumes=true；origin=`caller-provided-not-generated` |
| safety | input；requiredRuntime；unavailableProxyDetector；proxiesAccessorsAndExecutableValues；result；failure。六个固定字符串说明闭合模式、安全分离、受信任 Proxy 检测、冻结和仅错误码失败 |
| capacity | maxInputNodes=1024；maxInputDepth=10；maxInputArrayLength=32；maxCanonicalUtf8Bytes=16384；evaluations=1；providedRandomDraws=1；externalRandomDraws=0；stateWrites=0 |
| boundary | kind；personalityResolution；attackDerivation；genericOnly；personSpecificModifyHpDamage；teamPersonHpAndState；availabilityOwnershipWinnerAndCalcAttacker；stressDamageAndHpClamping；rng；sessionIntegration=false；persistence=false；legacyProfilesChanged=false。前九个固定字符串限定单次通用请求伤害、调用者解析前提、恒等钩子及各项排除能力 |

表中中文解释不是替代字符串；所有字符串必须与实现中的原文字面量一致。Policy 类型保留这些字符串、数字、boolean 与 tuple 的完整字面量类型，不是宽泛的 record。输入字段名 policies 与政策内部各键不可互换。

## 8. 完整固定证据字段清单与解释边界

`DEBATE_HP_DAMAGE_EVIDENCE_V1` 的完整固定值见[实现常量](../../packages/engine/src/debate-hp-damage.ts)及[来源账本](../sources/debate-hp-damage-v1.json)。Evidence 类型递归 readonly，全部字段如下，没有任意扩展字段：

| 字段 | 固定值或含义 |
|---|---|
| sourceIdentity | `modern-CSharp-translation-not-native-or-Vanilla` |
| repository / sourceCommit | `https://github.com/tankyc/sango_infinity` / `a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef` |
| debatePath | `Project/Assets/Sango/Scripts/Game/Debate/Debate.cs` |
| debateBlob | `0137498d10773cd4596d497083ccdf6a26b3a261` |
| debateSha256 | `622789ca8b8b6799a321526dcfb513d6622adf5b5d54025175c2a7795ef7da28` |
| sourceCardTopicLines / sourceCardLevelLines | [853,873] / [875,893] |
| sourceHpDamageLines | [1145,1196] |
| sourceTopicCoefficientLines / sourceLevelCoefficientLines | [1148,1165] / [1167,1180] |
| sourceAngerCoefficientLines / sourceArithmeticLines | [1182,1184] / [1186,1190] |
| sourcePersonHookLines | [1192,1195] |
| sourceBehavior | 固定说明先 topic、level、anger 系数，后一次 jitter 与整数算式，最后才是来源人物钩子 |
| personalityBoundary | 固定说明调用者提供 CharacterGetPersonality 结果，本核不运行人物回退 |
| attackBoundary | 固定说明调用者提供 character.attack，本核不推导攻击值 |
| hookBoundary | 固定说明 genericOnly 要求恒等结果，不验证实际人物、不调用钩子 |
| boundsSafetyBudgetsAuditAndReasonNames | `engine-policy` |
| sourceComment693 | `comment-preserved-as-evidence-not-an-accepted-domain-bound` |
| nativeEquivalent / stockOriginalVerified / pkEquivalent / vanillaEquivalent / completeDebate | 全为 false |
| p078 / nativeDeckRegenerationIntegration / nativeRngStream / legacySessionIntegration | 全为 `excluded` |
| nativeWholeChain | `open` |

主来源为固定提交的 [CalcHpDamage，第1145–1196行](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L1145-L1196)，辅助映射见同提交的 [GetCardTopic／GetCardLevel，第853–893行](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L853-L893)。

证据是现代 C# 转录参考，不是原生 PK、Vanilla、stock original 或其他原生版本的等价证明。完整来源最终执行人物行为钩子；本核明确截取恒等钩子边界，不能把通用公式的静态对应扩大成整个 `CalcHpDamage` 对所有人物的等价性。

personality／attack 的解析、人物特殊行为、CalcAttacker、双方大小比较、可用性、实际出牌、HP clamp、stress 伤害、普通或双次愤怒阶段、连击、计时推进、胜负、发牌与牌组再生成、人物／书籍、开场／追击／留情、campaign、原生 RNG 与全链身份预算均不在本核内。P078及其全部依赖仍排除；旧九个会话保持既有边界；43／45缺口不因本次独立现代公式而关闭。

## 9. 人工纸面示例，未执行

下述输入与预期只据最终静态实现和来源人工推导，不是函数运行输出、测试通过、运行时能力或原生整链验证。示例引用完整固定常量，不使用 id-only 政策。

### 9.1 匹配话题的愤怒冷静者仍使用 topicCoef=6

完整输入构造示意：

```ts
const input: DebateHpDamageInputV1 = {
  schemaVersion: 1,
  profile: 'debate-hp-damage-reference-v1',
  policies: DEBATE_HP_DAMAGE_POLICY_V1,
  genericOnly: true,
  personality: 'calm',
  angerTimer: 4,
  resolvedAttack: 100,
  currentTopic: 0,
  card: 3,
  rawDraws: [
    { role: 'debate-hp-damage-jitter', bound: 5, value: 2 },
  ],
};
```

纸面预期：ok=true、cardTopic=0、cardLevel=2、requestedHpDamage=183。完整成功结构仍按第4节返回固定版本、policy／evidence 和已校验输入回显；以下仅展开本例的 arithmetic 与 audit，不定义精简结果类型：

```ts
const expectedExcerpt = {
  arithmetic: {
    resolvedAttack: 100,
    jitter: 2,
    attackWithJitter: 102,
    angerCoef: 15,
    afterAnger: 1530,
    levelCoef: 20,
    afterLevel: 30600,
    topicCoef: 6,
    numerator: 183600,
    divisor: 1000,
    truncatedDamage: 183,
  },
  audit: {
    topicReason: 'positive-timer-calm-or-reckless-default',
    levelReason: 'ordinary-level-two',
    angerReason: 'positive-timer-calm',
    cardTopicCompared: false,
    cardLevelLookupUsed: true,
    draws: [{ index: 0, role: 'debate-hp-damage-jitter', bound: 5, value: 2 }],
    consumedDraws: 1,
    externalRngConsumed: 0,
    stateWrites: 0,
    modifyHpDamage: 'identity-only-not-invoked',
  },
};
```

虽然 cardTopic=currentTopic=0，正 timer 的外层分支已阻止话题匹配比较。仅把 angerTimer 改成0，纸面系数变为 anger10／level20／topic10，numerator=204000、requestedHpDamage=204，topicReason=zero-timer-matching-topic、angerReason=default、cardTopicCompared=true。

### 9.2 分支、零伤害与边界的纸面对照

除明确列出的变更外，各行独立使用第9.1节的完整版本／政策／genericOnly／rawDraws 结构，resolvedAttack=100、jitter=2、currentTopic=0；表中三系数按 anger／level／topic 排列。

| personality / timer / card | 三系数 | numerator → 请求伤害 | 关键审计 |
|---|---|---|---|
| timid / 0 / 3 | 10 / 20 / 10 | 204000 → 204 | zero-timer-matching-topic，辅助等级2 |
| timid / 0 / 6 | 10 / 20 / 6 | 122400 → 122 | zero-timer-default，cardTopic=1不匹配0，比较为true |
| bold / 1 / 6 | 10 / 20 / 10 | 204000 → 204 | positive-timer-timid-or-bold，不进行话题比较 |
| reckless / 4 / 3 | 10 / 20 / 6 | 122400 → 122 | positive-timer-calm-or-reckless-default，即使话题值匹配 |
| timid / 0 / 10 | 10 / 15 / 12 | 183600 → 183 | zero-timer-shout；两个辅助值都−1，比较与等级查找都false |
| timid / 1 / 10 | 10 / 15 / 10 | 153000 → 153 | positive-timer-timid-or-bold，shout-fixed-level |
| calm / 4 / 10 | 15 / 15 / 6 | 137700 → 137 | positive-timer-calm-or-reckless-default，positive-timer-calm |
| reckless / 1 / 10 | 10 / 15 / 6 | 91800 → 91 | 正 timer 不回退大喝12系数 |
| timid / 0 / 1 | 10 / 10 / 10 | 102000 → 102 | ordinary-level-zero |
| timid / 0 / 2 | 10 / 15 / 10 | 153000 → 153 | ordinary-level-one |
| calm / 4 / 11 | 15 / 0 / 6 | 0 → 0 | attackWithJitter=102、afterAnger=1530仍保留；draws仍一条 |
| timid / 0 / −1、0、12、13或14，各自独立 | 10 / 0 / 6 | 0 → 0 | non-damaging-card-zero-level；话题比较与等级查找都true，仍消费一条 |

上界示例：personality=bold、angerTimer=4、resolvedAttack=227、currentTopic=0、card=9、draw.value=4，纸面得到 attackWithJitter=231、afterAnger=2310、afterLevel=46200、topicCoef=10、numerator=462000、requestedHpDamage=462；话题不匹配不影响正 timer 的 bold 分支。所有零伤害示例也都要求 role、bound、value 合法，外部随机消耗仍为0。

### 9.3 错误优先级的纸面对照

下表均只修改一个完整合法输入所列部分；若没有受支持的运行时 Proxy 检测能力，实际合同首先是 unsupported-runtime，这里不假设本批已经探测过运行时。

| 输入变更 | 纸面失败原因与说明 |
|---|---|
| 顶层缺 policies | malformed-data，无默认政策 |
| 顶层多 hp:1000且缺 policies | unknown-field，顶层额外键先于缺键 |
| policies 只有正确 id | unsupported-policy，必须是完整固定字面量 |
| genericOnly=false | invalid-generic-only，不自动代入真实人物钩子 |
| personality=1 | invalid-personality，不转换来源枚举 |
| angerTimer=5 | invalid-anger-timer |
| resolvedAttack=228 | invalid-resolved-attack |
| currentTopic=−1 | invalid-current-topic，即使 cardTopic 为−1也不接受 |
| card=15或−2 | invalid-card，不生成“不可用但成功”的结果 |
| card=0且 rawDraws=[] | invalid-raw-draws，零伤害不省略抽取 |
| rawDraws 有两条合法记录 | invalid-raw-draws，不忽略额外记录 |
| rawDraws=[null] | invalid-draw，唯一项不是 record |
| 抽取项缺 value | malformed-data，不是 invalid-draw-value |
| 抽取项多 index:0 | unknown-field；index 只属于输出审计 |
| role=`other`、bound=4、value=5同时存在 | invalid-draw-role，先 role 后 bound 后 value |
| role 正确、bound=4、value=5 | invalid-draw-bound |
| role／bound 正确、value=5 | invalid-draw-value |
| resolvedAttack=100.5、card=−0或draw.value=1.5 | malformed-data，完整安全分离先于各字段错误 |
| card=15且draw.value=1.5 | malformed-data，安全层先于 card 领域校验 |
| card=15且rawDraws=[] | invalid-card，领域层 card 先于 rawDraws |

本页及配套案例仅为静态规格与人工推导。本批未运行测试、编译、typecheck、build、validator、checker、诊断、候选模块、来源代码、示例、场景或 replay；不能据此宣称任何运行检查通过或完整舌战已经实现。
