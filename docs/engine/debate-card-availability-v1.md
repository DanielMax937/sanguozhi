# 独立卡牌可用性 API v1

[规则与来源边界](../rules/debate-card-availability-v1.md) · [固定政策与证据](../sources/debate-card-availability-v1.json) · [纸面案例，未运行](../../data/scenarios/debate-card-availability-example-v1.json)。

实现入口为 [debate-card-availability.ts](../../packages/engine/src/debate-card-availability.ts)，公共导出见 [engine index](../../packages/engine/src/index.ts)。本页描述固定现代 C# 参考 `IsCardAvailable(team, card)` 的独立、无状态求值：调用者提供双人检查点，查询其中一队的一张数字牌码是否通过该谓词。

`available:true` **不等于这张牌可以实际打出**。本核不检查手牌所有权、人物话术资格、HP、当前回合、出牌阶段、先后手或话题，也不执行再考、出牌、攻击或任何状态变化。`ok:true, available:false` 是合法查询结果，不是输入失败。旧九个会话及既有独立核不接入、不修改，不接受或迁移其存档。

## 1. 公开入口与全部类型别名

唯一函数和两个常量为：

```ts
evaluateDebateCardAvailability(input: unknown): DebateCardAvailabilityResultV1
DEBATE_CARD_AVAILABILITY_POLICY_V1: DebateCardAvailabilityPolicyV1
DEBATE_CARD_AVAILABILITY_EVIDENCE_V1: DebateCardAvailabilityEvidenceV1
```

没有 create、preview、execute、save、load、replay、批量查询或 session 别名。输入为 JSON 式数据值，不是 JSON 字符串。函数的运行时参数是 `unknown`，声明类型不能跳过安全分离和字段校验。

全部17个公开类型别名如下；复合类型递归 readonly。下文结构展示省略重复的 readonly，文档中的 `Pair<T>` 仅表示恰好两项的保序 tuple，不是额外导出。

| 公开别名 | 完整定义位置或值域 |
|---|---|
| `DebateCardAvailabilityTeamV1` | `0 \| 1` |
| `DebateCardAvailabilityPersonalityV1` | `'timid' \| 'calm' \| 'bold' \| 'reckless'` |
| `DebateCardAvailabilityCharacterV1` | 第2节三字段角色 |
| `DebateCardAvailabilityInputV1` | 第2节六字段完整输入 |
| `DebateCardAvailabilityAngerReasonV1` | 第4.1节四种局部愤怒判定原因 |
| `DebateCardAvailabilityEligibilityV1` | 第4.1节六字段角色审计 |
| `DebateCardAvailabilityCardClassV1` | 第3节五种牌类 |
| `DebateCardAvailabilityCheckRuleV1` | 第4.2节六种检查名 |
| `DebateCardAvailabilityCheckV1` | `{rule:DebateCardAvailabilityCheckRuleV1,passed:boolean}` |
| `DebateCardAvailabilityAuditV1` | 第4.2节六字段审计 |
| `DebateCardAvailabilityAvailabilityReasonV1` | 第4.3节八种可用性结果原因 |
| `DebateCardAvailabilitySuccessV1` | 第4节11字段成功结果 |
| `DebateCardAvailabilityFailureReasonV1` | 第6节13种失败原因 |
| `DebateCardAvailabilityFailureV1` | `{ok:false,reason:DebateCardAvailabilityFailureReasonV1}` |
| `DebateCardAvailabilityResultV1` | `DebateCardAvailabilitySuccessV1 \| DebateCardAvailabilityFailureV1` |
| `DebateCardAvailabilityPolicyV1` | 第7节完整固定政策的递归 readonly 字面量类型 |
| `DebateCardAvailabilityEvidenceV1` | 第8节完整固定证据的递归 readonly 字面量类型 |

成功、失败、嵌套审计、数组及两个常量均递归冻结。先分离输入，再解析和求值，不修改或冻结调用者对象，不保留调用者所有的可变输入引用；输入与结果可以共享已经冻结的导出常量。政策与证据可使用内部冻结常量，不承诺每次调用产生新的常量对象身份；调用者应比较值，不依赖跨调用引用身份。

失败恰为 `{ok:false,reason}`，不含 schemaVersion、profile、policy、evidence、index、错误位置、部分 audit 或部分结果。没有隐藏状态、缓存中的上次查询结果或跨调用随机游标。

## 2. 完整输入合同

```ts
type DebateCardAvailabilityCharacterV1 = {
  personality: DebateCardAvailabilityPersonalityV1;
  angerTimer: number;
  canRethink: boolean;
};
type DebateCardAvailabilityInputV1 = {
  schemaVersion: 1;
  profile: 'debate-card-availability-reference-v1';
  policies: DebateCardAvailabilityPolicyV1;
  team: DebateCardAvailabilityTeamV1;
  characters: [DebateCardAvailabilityCharacterV1, DebateCardAvailabilityCharacterV1];
  card: number;
};
```

顶层恰有上述六个必需键；每个角色恰有上述三个必需键。不补默认值、不接受额外键，不进行数字字符串、真假值或分数转换。

| 字段 | 运行时要求 |
|---|---|
| schemaVersion / profile | 精确为数字1 / `debate-card-availability-reference-v1` |
| policies | 与第7节完整政策逐值一致，不是仅提供 id；对象键顺序不影响比较，数组顺序影响比较 |
| team | 数字0或1 |
| characters | 恰好两项的稠密数组；下标0固定为队伍0，下标1固定为队伍1 |
| personality | timid（胆小）、calm（冷静）、bold（刚胆）、reckless（莽撞）之一 |
| angerTimer | 整数0..4 |
| canRethink | boolean；与所在角色对应的来源 `canRethink[team]` 值 |
| card | 有符号32位整数，−2147483648..2147483647 |

所有数值在字段解析前已要求为安全整数且不是负零。`card=-1`、`card=15` 和有符号32位边界都允许输入，但查询结果不可用。超出有符号32位、仍为安全整数的 card 为 `invalid-card`；小数、NaN、Infinity、负零或不安全整数先返回 `malformed-data`，不是 `card-out-of-range`。

`team` 决定 self，另一队是 opponent。即使只查询队伍1，characters 也不能换成 self-first 顺序。对方 canRethink 不参与本次可用性决定，但仍是必需、须校验且会写入审计的字段。即使 card 不在0..14，也先校验双方完整角色和整个输入。

personality 是调用者已解析的 `CharacterGetPersonality` 结果，不是人物ID、原始枚举数值或未经解析的人物属性。本核不执行人物覆盖／缺省性格解析。canRethink 同样由调用者提供，不从手牌、崩坏、是否曾再考或 timer 推导。

timer 允许0..4内任何整数，不按性格强行限定 timid/reckless 必须0或1，也不证明所给组合可以由游戏历史到达。它是有限工程检查点域，不是完整现代源码状态域或原生游戏可达性认证。

不接受 hand、cardToken、strength、hp、stress、combo、firstTeam、currentTopic、genericOnly、phase、seed、rawDraws、RNG 回调、预计算 angered、available、audit 或 evidence。即使这些字段来自旧组件，直接把其完整角色传入也会因额外键失败；调用者须明确投影本 API 的三字段角色并补充匹配的 canRethink。

## 3. 牌码与来源分支顺序

| card | 来源含义 | audit.cardClass |
|---|---|---|
| 有符号32位域内的其他整数 | 不在有效牌码0..14内 | `out-of-range` |
| 0 | 再考 | `rethink` |
| 1..3 | 故事小／中／大 | `topic` |
| 4..6 | 道理小／中／大 | `topic` |
| 7..9 | 时节小／中／大 | `topic` |
| 10 / 11 / 12 | 大喝／诡辩／无视 | `shout-sophistry-ignore` |
| 13 / 14 | 镇静／激昂 | `compose-agitate` |

先分别计算双方仅用于本谓词的 angered：`angerTimer > 0` 且性格为 calm 或 bold。timid/reckless 即使 timer>0，也在这个局部判定中为 false；这不表示它们没有任何愤怒效果。随后检查牌码范围，再按下表短路：

| 牌类 | 按顺序实际检查 | 最终通过 |
|---|---|---|
| out-of-range | `card-in-range=false`，立即结束 | 不可用 |
| rethink | 范围；self 不是愤怒 bold；self.canRethink | 可用，`rethink-enabled` |
| shout-sophistry-ignore | 范围；self 不是愤怒 bold；opponent 不是愤怒 calm | 可用，`rhetoric-available` |
| compose-agitate | 范围；self.angered=false；opponent 不是愤怒 calm | 可用，`rhetoric-available` |
| topic | 范围；`topic-default=true` | 可用，`topic-card-available` |

冷静愤怒者可以通过大喝／诡辩／无视的 self 检查，但不能通过镇静／激昂的 self 检查。刚胆愤怒者的再考、大喝、诡辩、无视先被 self 检查拒绝；镇静／激昂则按另一规则返回 self-angered。两方条件同时阻断时，先命中的 self 条件决定结果，不补记尚未到达的 opponent 条件。

对方愤怒冷静会阻断五种话术，但**不会阻断再考或普通话题**。再考只在通过 self 检查后返回自己的 canRethink；本核既不把它置 false，也不实际更换手牌。普通话题不受本谓词的双方 angered 或 canRethink 限制。

## 4. 成功结果与审计全部字段

```ts
type DebateCardAvailabilitySuccessV1 = {
  ok: true;
  schemaVersion: 1;
  profile: 'debate-card-availability-reference-v1';
  policy: DebateCardAvailabilityPolicyV1;
  evidence: DebateCardAvailabilityEvidenceV1;
  team: DebateCardAvailabilityTeamV1;
  opponentTeam: DebateCardAvailabilityTeamV1;
  card: number;
  available: boolean;
  reason: DebateCardAvailabilityAvailabilityReasonV1;
  audit: DebateCardAvailabilityAuditV1;
};
```

输入用复数 policies，成功结果用单数 policy。team、card 保留已校验的输入值；opponentTeam 为另一队。schemaVersion、profile、policy、evidence 为固定版本身份。available 是这一次谓词结果，不是执行许可。reason 是可用性结果原因，与失败对象里的输入／运行时失败 reason 属于不同类型。

### 4.1 双方局部资格

```ts
type DebateCardAvailabilityAngerReasonV1 =
  | 'timer-zero'
  | 'personality-not-calm-or-bold'
  | 'positive-timer-calm'
  | 'positive-timer-bold';
type DebateCardAvailabilityEligibilityV1 = {
  team: DebateCardAvailabilityTeamV1;
  personality: DebateCardAvailabilityPersonalityV1;
  angerTimer: number;
  canRethink: boolean;
  angered: boolean;
  angerReason: DebateCardAvailabilityAngerReasonV1;
};
```

self 和 opponent 都具有以上全部六字段；personality、angerTimer、canRethink 来自各自队伍的已分离输入。angerReason 优先 timer-zero：任意性格 timer=0 都是该原因、angered=false。timer>0 时，calm 对应 positive-timer-calm／true，bold 对应 positive-timer-bold／true，timid/reckless 对应 personality-not-calm-or-bold／false。

双方局部资格在来源的范围判断之前计算，因此 card-out-of-range 成功结果也有完整 self/opponent 审计。没有推断全局愤怒阶段、激昂反制或连击资格的额外字段。

### 4.2 检查轨迹

```ts
type DebateCardAvailabilityCardClassV1 =
  | 'out-of-range'
  | 'rethink'
  | 'topic'
  | 'shout-sophistry-ignore'
  | 'compose-agitate';
type DebateCardAvailabilityCheckRuleV1 =
  | 'card-in-range'
  | 'self-not-angry-bold'
  | 'self-not-angered'
  | 'opponent-not-angry-calm'
  | 'can-rethink'
  | 'topic-default';
type DebateCardAvailabilityCheckV1 = {
  rule: DebateCardAvailabilityCheckRuleV1;
  passed: boolean;
};
type DebateCardAvailabilityAuditV1 = {
  self: DebateCardAvailabilityEligibilityV1;
  opponent: DebateCardAvailabilityEligibilityV1;
  cardClass: DebateCardAvailabilityCardClassV1;
  checks: DebateCardAvailabilityCheckV1[];
  decisiveCheck: DebateCardAvailabilityCheckRuleV1;
  externalRngConsumed: 0;
};
```

checks 只记录实际到达的检查，保持上述来源分支顺序，长度1..3；没有固定三槽填充、skipped 条目、sequence 或索引字段。第一项总是 card-in-range。出现 false 就立即结束，故最多一项 false 且必在末尾；成功可用时全部 passed=true。

decisiveCheck 恰为最后一项 checks 的 rule，不是独立运行的额外检查。普通话题有两项，结尾为 topic-default；有效再考最多三项，结尾为 can-rethink；话术最多三项，全部通过时结尾为 opponent-not-angry-calm。card-out-of-range 恰有一项 card-in-range=false。

externalRngConsumed 恒0；本输入不接收随机记录，本函数也没有随机生成、游戏状态写入或外部副作用。此字段不证明其他模块或原生整链没有随机消耗。

### 4.3 全部可用性原因

| reason | available | decisiveCheck | 含义 |
|---|---|---|---|
| `card-out-of-range` | false | card-in-range | 合法有符号32位 card 不在0..14 |
| `self-angry-bold` | false | self-not-angry-bold | 再考或10..12被本方正 timer 的 bold 阻断 |
| `rethink-disabled` | false | can-rethink | 再考通过 self 检查，但本方 canRethink=false |
| `self-angered` | false | self-not-angered | 13..14被本方正 timer 的 calm/bold 阻断 |
| `opponent-angry-calm` | false | opponent-not-angry-calm | 10..14通过 self 检查后，被对方正 timer 的 calm 阻断 |
| `rethink-enabled` | true | can-rethink | 再考通过 self 检查且本方 canRethink=true |
| `rhetoric-available` | true | opponent-not-angry-calm | 10..14的两个相关角色检查均通过 |
| `topic-card-available` | true | topic-default | 1..9通过范围检查后按默认分支可用 |

reason、检查名称、cardClass 和审计结构是工程可观察性合同，不声称来源返回了这些文字或收据。

## 5. 安全分离与输入预算

模块取得并保存受信任 Node 运行时的 `process.getBuiltinModule('node:util').types.isProxy`。若该能力在模块初始化时不可用，调用返回 unsupported-runtime，先于检查输入；不降级到无法排除 Proxy 的路径。本合同不承诺浏览器、旧运行时或已遭替换的内建环境可用，也没有执行能力探测来证明本批环境支持它。

安全分离先于任何领域校验：

- 接受 null、boolean、string、安全整数及符合下述限制的普通对象／数组；这些值通过安全层后，仍须通过各字段具体要求。
- 普通对象的原型须为 Object.prototype 或 null；数组原型须精确为 Array.prototype。类实例、Date、Map、Set、类型化数组及自定义原型拒绝。
- 对对象先检查 Proxy，再反射原型和自有属性；只读取数据属性描述符，不调用 getter、setter、toJSON、回调或输入函数。
- 拒绝 Proxy、访问器、symbol 键、symbol 值、undefined、function、bigint、非有限数、小数、不安全整数及负零；普通对象非可枚举字段也拒绝。
- 数组须稠密，只能有规范的0..length−1索引及原生 length 字段；不允许空洞、附加属性、符号或隐藏字段。数组 length 是唯一允许的非可枚举字段。
- 拒绝循环引用。重复但不形成环的对象引用可接受，每次独立复制并重复计入预算；结果不保留调用者的共享引用关系。
- 对象属性按数据值复制，不调用输入对象的序列化方法。任何额外领域键随后按封闭模式拒绝，不把 `__proto__` 等额外名字作为特殊输入能力。

| 预算 | 上界与计数方式 |
|---|---|
| 值节点 | 1024；根值计1，每次访问的值再计1，重复非循环引用的每次展开分别计数 |
| 嵌套深度 | 10；根深度0，属性值／数组元素各深入1 |
| 单个数组长度 | 32；不是 characters 可放32人，领域层仍只允许2人 |
| 自有键数量 | 反射所得单个对象键数不得超过1024；数组 length 也在自有键内 |
| 字符串／键预检 | 单个字符串或键的 JS 长度不超过16384；遍历时累计字符串值与所有自有键 UTF-8 字节不超过16384 |
| 完整规范表示 | 对象键排序、数组保序、无空白、保留 JSON 转义／标点的 canonical 表示 UTF-8 字节数不超过16384 |
| 单次工作 | 1个队伍×1张牌；最多3项谓词检查，0项随机，0项状态写入 |

预算覆盖整个输入，包含完整 policies 与后来会被判为多余或错误的字段。中间键／字符串累计包括数组的索引和 length 等自有键，因此“最终 canonical 表示不超16384”并不单独保证通过全部预检。超预算在安全分离阶段返回 input-limit，不裁剪内容或尝试部分求值。

安全层和字段层的顺序是公开行为的一部分：例如藏在未知字段中的 getter 或负零会先触发 malformed-data，而非 unknown-field。合规但有未知键的数据才到达封闭字段检查。

## 6. 全部失败原因及优先顺序

```ts
type DebateCardAvailabilityFailureReasonV1 =
  | 'unsupported-runtime'
  | 'input-limit'
  | 'malformed-data'
  | 'unknown-field'
  | 'unsupported-profile'
  | 'unsupported-policy'
  | 'invalid-team'
  | 'invalid-characters'
  | 'invalid-character'
  | 'invalid-personality'
  | 'invalid-anger-timer'
  | 'invalid-can-rethink'
  | 'invalid-card';
```

| reason | 条件 |
|---|---|
| unsupported-runtime | 没有受支持的受信任 Proxy 检测能力；不先检查输入 |
| input-limit | 安全分离节点／深度／数组／键数／字节预算超限 |
| malformed-data | 不安全数据形态、数字、循环、访问器等；顶层不是 record；顶层或角色缺必需键；未分类的内部异常也封闭归入此码 |
| unknown-field | 安全数据的顶层或某角色存在未列出的键 |
| unsupported-profile | schemaVersion≠1或 profile 不是精确固定字符串 |
| unsupported-policy | policies 的完整规范表示与固定政策不相等，包括政策内缺键、多键、错值、数组错序或整体类型不符 |
| invalid-team | 通过安全层的 team 不是数字0或1 |
| invalid-characters | characters 不是数组或长度不等于2 |
| invalid-character | 某项角色不是非 null、非数组 record |
| invalid-personality | 某角色 personality 不属于四个支持字符串 |
| invalid-anger-timer | 某角色 angerTimer 不是数字0..4 |
| invalid-can-rethink | 某角色 canRethink 不是 boolean |
| invalid-card | 通过安全层的 card 不是数字或不在有符号32位域内 |

完整顺序为：

1. 检查运行时能力并安全分离全部输入，执行所有预算。此阶段在遍历首次遇到问题时停止，不保证同时存在多个安全问题时得到领域层预期的码。
2. 顶层必须为 record；先拒绝额外键，再检查缺键。
3. schemaVersion/profile，然后完整 policies，然后 team。
4. characters 必须为二项数组；按下标0再1解析角色。每项先 record、额外键、缺键，再 personality、angerTimer、canRethink。
5. 校验 card 为有符号32位数字。
6. 计算双方局部 angered，再运行第3节的来源有序谓词；该阶段只有成功结果中的 available true/false，没有“牌不可用”输入失败码。

角色形状检查的 invalid-character 只适用于非 record；合法 record 缺键仍是 malformed-data，多键仍是 unknown-field。policy 不使用角色／顶层的逐键错误分类，整体不相等即 unsupported-policy。顶层同时有额外键和缺键时，unknown-field 在前。错误输出不泄露路径或已检查数量，也不发布部分审计。

## 7. 完整固定政策

`DEBATE_CARD_AVAILABILITY_POLICY_V1` 是唯一政策。输入可引用该常量或提供逐值相同的安全副本；不接受仅 id、局部覆盖或近似策略。精确字面量见[实现常量](../../packages/engine/src/debate-card-availability.ts)及[来源账本](../sources/debate-card-availability-v1.json)，下面枚举全部字段，避免维护另一份重复政策。

| 路径 | 全部子字段及固定含义 |
|---|---|
| id | `debate-card-availability-policy-v1` |
| profile | `debate-card-availability-reference-v1` |
| checkpoint | characters=2；teams=[0,1]；personality 指明调用者解析四性格；angerTimer={minimum:0,maximum:4}；canRethink 指明逐角色 boolean；card={minimum:−2147483648,maximum:2147483647}；bounds 指明工程检查点而非普遍可达域 |
| availability | angered；cardRange=[0,14]；outOfRange；rethink；shoutSophistryIgnore；composeAgitate；topic；rethinkOpponentSuppression=false；shortCircuit=true。七个非 boolean 字段固定描述第3节的判定与牌范围 |
| safety | input；requiredRuntime；unavailableProxyDetector；proxiesAccessorsAndExecutableValues；result；failure。六个固定字符串描述第5节安全层、冻结及仅错误码失败 |
| capacity | maxInputNodes=1024；maxInputDepth=10；maxInputArrayLength=32；maxCanonicalUtf8Bytes=16384；queries=1；maxChecks=3；randomDraws=0；stateWrites=0 |
| boundary | kind；personalityResolution；canRethinkDerivation；handOwnershipHpTurnCurrentTopicAndGameplay；rng；sessionIntegration=false；persistence=false；legacyProfilesChanged=false。前五个固定字符串限定独立查询和未实现能力 |

字符串字段不是调用者自由说明文本，必须与常量中的原文字面量一致；表内中文解释不能替代其值。Policy 类型完整保留这些字符串、数字、布尔值和 tuple 的字面量类型，不只是宽泛的 record。

## 8. 完整固定证据与解释边界

`DEBATE_CARD_AVAILABILITY_EVIDENCE_V1` 的完整固定值同样见[实现常量](../../packages/engine/src/debate-card-availability.ts)与[来源账本](../sources/debate-card-availability-v1.json)。Evidence 类型递归 readonly，全部字段枚举如下；没有省略的任意扩展字段。

| 字段 | 固定值或含义 |
|---|---|
| sourceIdentity | `modern-CSharp-translation-not-native-or-Vanilla` |
| repository / sourceCommit | `https://github.com/tankyc/sango_infinity` / `a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef` |
| debatePath / debateEnumPath | `Project/Assets/Sango/Scripts/Game/Debate/Debate.cs` / 同目录 `DebateEnum.cs` |
| debateBlob / debateEnumBlob | `0137498d10773cd4596d497083ccdf6a26b3a261` / `5b46a8ac87613193eb9f4b99a25e489ba6f5e483` |
| debateSha256 | `622789ca8b8b6799a321526dcfb513d6622adf5b5d54025175c2a7795ef7da28` |
| sourceResolvedPersonalityLines / sourceAvailabilityLines | [369,375] / [934,987] |
| sourceCardEnumLines / sourcePersonalityEnumLines | [33,61] / [116,124] |
| sourceBehavior | 固定描述双方局部愤怒、范围及有序分支 |
| personalityBoundary / canRethinkBoundary | 固定描述调用者解析的性格与匹配队伍的 canRethink，不执行人物解析 |
| boundsSafetyBudgetsAuditAndReasonNames | `engine-policy` |
| nativeEquivalent / stockOriginalVerified / pkEquivalent / vanillaEquivalent / completeDebate | 全为 false |
| p078 / nativeDeckRegenerationIntegration / nativeRngStream / legacySessionIntegration | 全为 `excluded` |
| nativeWholeChain | `open` |

主来源为固定提交的 [Debate.cs 第934–987行](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L934-L987)。[性格解析边界第369–375行](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L369-L375)只解释所需输入的来源；本核不执行该人物解析。数字牌码和四性格对应关系来自同一提交的 [DebateEnum.cs](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/DebateEnum.cs)。

证据明确是现代 C# 转录参考，不是原生 PK、Vanilla 或主机版等价证明。输入上下界、安全层、预算、审计和原因名是工程合同，不冒充来源本身的接口。没有运行原游戏、来源代码或原生 RNG 来认证任何链路。

本核不实现完整双次愤怒阶段、普通愤怒出牌／伤害系数、冷静额外再考、刚胆耗牌、计时推进、胜负、发牌、牌组再生成、人物／书籍、开场／追击／留情、campaign 或全链随机／身份预算。P078及其全部依赖排除。旧九个会话的 profile、政策、存档和原有拒绝边界保持；43个证据主题／45个历史快照缺口不因这个现代独立谓词而减少。

## 9. 纸面输入与预期

以下仅为对静态代码及来源分支的人工推导，不是执行输出、测试通过或运行能力证明。

### 9.1 再考不受对方愤怒冷静阻断

完整输入构造示意：

```ts
const input: DebateCardAvailabilityInputV1 = {
  schemaVersion: 1,
  profile: 'debate-card-availability-reference-v1',
  policies: DEBATE_CARD_AVAILABILITY_POLICY_V1,
  team: 0,
  characters: [
    { personality: 'calm', angerTimer: 4, canRethink: true },
    { personality: 'calm', angerTimer: 4, canRethink: false },
  ],
  card: 0,
};
```

纸面预期为 ok=true、available=true、reason=rethink-enabled、team=0、opponentTeam=1、card=0；audit.cardClass=rethink，双方 angered=true、angerReason=positive-timer-calm。self.canRethink=true、opponent.canRethink=false 分别保留，checks 恰为：

```ts
[
  { rule: 'card-in-range', passed: true },
  { rule: 'self-not-angry-bold', passed: true },
  { rule: 'can-rethink', passed: true },
]
```

decisiveCheck=can-rethink、externalRngConsumed=0。固定 schemaVersion/profile/policy/evidence 仍按第4节完整返回；上述文字仅展开与案例有关的值，不另定义精简结果类型。把 card 改成10则通过 self 检查后返回 opponent-angry-calm；改成13则在 self-not-angered 处先返回 self-angered。

### 9.2 其他分支与错误的人工对照

下表各行独立，除该行明确列出的错误外，均使用完整固定版本、政策及合法输入结构；三元组为 personality／angerTimer／canRethink，self/opponent 按该行 team 投影，不改变 characters 的队伍顺序。

| 场景 | card | 纸面预期 |
|---|---|---|
| self=bold/1/false，opponent=calm/4/true | 0 | ok=true、available=false、self-angry-bold；2项 checks，不检查 can-rethink 或对方 |
| self=timid/4/false，opponent=calm/4/true | 0 | ok=true、available=false、rethink-disabled；self.angered=false，3项 checks，无 opponent 检查 |
| self=reckless/4/false，opponent=bold/4/false | 14 | ok=true、available=true、rhetoric-available；3项 checks；本方局部 angered=false，对方不是 calm |
| self=bold/4/false，opponent=calm/4/false | 1 | ok=true、available=true、topic-card-available；2项 checks，不受双方局部愤怒阻断 |
| 双方任意合规角色 | −2147483648或2147483647 | ok=true、available=false、card-out-of-range；完整双方资格加1项失败范围检查 |
| 双方合法，card为数字2147483648 | 2147483648 | ok=false、invalid-card，无 audit |
| 双方合法，card为数字−0或1.5 | −0或1.5 | ok=false、malformed-data，安全分离先拒绝 |
| 第二个角色额外含 hp:1000 | 15 | ok=false、unknown-field；不会用越界 card 的可用性结果掩盖角色错误 |
| 顶层少 policies | 0 | ok=false、malformed-data；无缺省政策 |
| policies 仅有正确 id | 0 | ok=false、unsupported-policy |

队伍方向示例：characters[0]=calm/4/true、characters[1]=timid/1/false，team=1、card=10 时，self 是队伍1且局部 angered=false，对方队伍0是愤怒冷静，因此 reason=opponent-angry-calm；不能把 characters[0]误当成本次 self。

本页及配套案例仅作静态规格和人工纸面推导。本批未运行测试、编译、typecheck、build、validator、checker、诊断、候选模块、来源代码、示例、场景或 replay，不能据此宣称运行通过或完成完整舌战。
