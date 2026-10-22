# 独立冷静再考补牌后加成 API v1

[规则与来源边界](../rules/debate-calm-rethink-v1.md) · [固定政策与证据](../sources/debate-calm-rethink-v1.json) · [纸面案例，未运行](../../data/scenarios/debate-calm-rethink-example-v1.json)。

实现入口为 [debate-calm-rethink.ts](../../packages/engine/src/debate-calm-rethink.ts)，公共导出见 [engine index](../../packages/engine/src/index.ts)。本页仅覆盖固定现代 C# `CharacterRethink` 在 `CharacterFillCards` 返回后的冷静性格加成与最终排序：调用者给出已经补满、已经数值排序的活动手牌，本核不执行此前的清牌或补牌。

仅 `angerTimer>0` 且 `personality='calm'` 时读取恰好一个显式 `RandBool(40)` **语义布尔返回值**，无论当前话题是否有效。返回真且话题为0..2时，将当前物理槽1覆盖为对应大牌3／6／9；之后所有成功路径都完成最终数值排序。覆盖前后同牌面也属于已执行覆盖，不得因数值未变省略记录。

这是独立的补牌后合成检查点，不证明输入确由某次再考产生、人物性格已正确解析、实际持有或获准使用再考，也不检查再考额度。`ok:true` 只表示本有界数据合同内的求值完成，不表示整个再考事务、完整回合或舌战已经执行。

旧九会话及已有补牌、牌组再生成、愤怒组件、政策和存档不修改、不自动接入或迁移。完整冷静再考／刚胆耗牌、TurnStart／TurnEnd、计时递减、全回合随机／身份预算及人物／书籍解析仍不在本核范围。固定现代 C# 不是原生 PK、Vanilla 或主机版等价证明；43证据主题／45历史快照保持，P078及其全部依赖排除。

## 1. 三个值导出与全部18个类型别名

```ts
evaluateDebateCalmRethink(input: unknown): DebateCalmRethinkResultV1
DEBATE_CALM_RETHINK_POLICY_V1: DebateCalmRethinkPolicyV1
DEBATE_CALM_RETHINK_EVIDENCE_V1: DebateCalmRethinkEvidenceV1
```

没有 create、preview、execute、save、load、replay、session 或完整 CharacterRethink 入口。输入是 JSON 式数据值，不是 JSON 字符串；`unknown` 入口先安全分离，再执行领域解析。类型断言不能绕过运行时合同。

| 公开类型别名 | 完整值域或定义位置 |
|---|---|
| `DebateCalmRethinkPersonalityV1` | `'timid' \| 'calm' \| 'bold' \| 'reckless'` |
| `DebateCalmRethinkCardV1` | 整数牌码联合0..14，第2节另限制各物理槽 |
| `DebateCalmRethinkBonusCardV1` | `3 \| 6 \| 9` |
| `DebateCalmRethinkRawResultV1` | 第2节三个字段的语义布尔返回值 |
| `DebateCalmRethinkInputV1` | 第2节八字段输入 |
| `DebateCalmRethinkGateReasonV1` | `'timer-zero' \| 'personality-not-calm' \| 'positive-timer-calm'` |
| `DebateCalmRethinkGateV1` | 第4.1节四字段条件审计 |
| `DebateCalmRethinkConsumedResultV1` | 第4.1节四字段消费记录 |
| `DebateCalmRethinkReplacementV1` | 第4.2节四字段覆盖记录 |
| `DebateCalmRethinkSortAuditV1` | 第4.2节四字段排序记录 |
| `DebateCalmRethinkAuditV1` | 第4.3节七字段总审计 |
| `DebateCalmRethinkReasonV1` | 第3节五种正常求值原因 |
| `DebateCalmRethinkSuccessV1` | 第4节八字段成功结果 |
| `DebateCalmRethinkFailureReasonV1` | 第6节十三种失败原因 |
| `DebateCalmRethinkFailureV1` | `{ok:false,reason:DebateCalmRethinkFailureReasonV1}` |
| `DebateCalmRethinkResultV1` | `DebateCalmRethinkSuccessV1 \| DebateCalmRethinkFailureV1` |
| `DebateCalmRethinkPolicyV1` | 第7节所链接完整固定政策的递归 readonly 字面量类型 |
| `DebateCalmRethinkEvidenceV1` | 第7节所链接完整固定证据的递归 readonly 字面量类型 |

复合 DTO 类型递归 readonly；后文为便于阅读省略重复的 readonly，不引入其他公开别名。两个常量、成功与失败结果及全部嵌套对象／数组均递归冻结。不会修改或冻结调用者对象，输出不保留调用者拥有的可变引用。固定 policy／evidence 可以复用已冻结常量，不承诺每次调用创建新的常量对象身份。

## 2. 完整输入合同

```ts
type DebateCalmRethinkPersonalityV1 = 'timid' | 'calm' | 'bold' | 'reckless';
type DebateCalmRethinkCardV1 =
  0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14;
type DebateCalmRethinkBonusCardV1 = 3 | 6 | 9;
type DebateCalmRethinkRawResultV1 = {
  role: 'debate-calm-rethink-rand-bool';
  percent: 40;
  value: boolean;
};
type DebateCalmRethinkInputV1 = {
  schemaVersion: 1;
  profile: 'debate-calm-rethink-reference-v1';
  policies: DebateCalmRethinkPolicyV1;
  personality: DebateCalmRethinkPersonalityV1;
  angerTimer: number;
  currentTopic: number;
  hand: DebateCalmRethinkCardV1[];
  rawResults: DebateCalmRethinkRawResultV1[];
};
```

顶层恰有以上八个必需键，每项 rawResults 恰有 role、percent、value 三个必需键。没有默认值、额外字段、数字字符串或真值转换。

| 字段 | 运行时要求 |
|---|---|
| schemaVersion / profile | 数字1 / 精确字符串 `debate-calm-rethink-reference-v1` |
| policies | 与完整固定政策逐值一致，不只是 id；对象键顺序无关，数组顺序有关 |
| personality | timid（胆小）、calm（冷静）、bold（刚胆）、reckless（莽撞）之一 |
| angerTimer | 整数0..4 |
| currentTopic | 有符号32位整数，−2147483648..2147483647 |
| hand | 稠密数组，长度4..7，按牌码非递减排序；槽0恰为0，其余每槽均为1..14，且至少一张普通话题牌1..9 |
| rawResults | 稠密数组，领域长度只能0或1；正计时器冷静恰需1项，其他情况恰需0项 |
| rawResults[i].role / percent / value | 精确 role / 数字40 / 真正 boolean；不接受0／1或字符串真假 |

所有数值在安全层必须为安全整数且不是负零。小数、NaN、Infinity、不安全整数、−0，无论藏在哪个字段，均先为 `malformed-data`。通过安全层的 currentTopic=2147483648 才是 `invalid-current-topic`；currentTopic=−1或3仍是合法 signed32 输入，只是不执行覆盖，不是坏形。

### 2.1 已补满排序手牌，不是七槽 backing array

hand 只含活动物理前缀，长度本身就是本次容量4..7，不另传 maxCardCount。0是保留再考槽；1／2／3为故事小／中／大，4／5／6为道理小／中／大，7／8／9为时节小／中／大，10大喝、11诡辩、12无视、13镇静、14激昂。允许重复非零牌码。

不接受−1空槽、稀疏数组空洞、尾部非活动占位、额外0、无普通话题牌或尚未排序的手牌。槽1因此是调用开始时数值最小的可出牌物理槽，但不等同于等级最低的牌，也不是随机位置。本核不会先排序不合法输入再继续，不从原始未排序手牌重新定位目标。

所有已接受性格都允许 timer=0..4；不额外要求 timid／reckless 只能0或1。这是工程检查点支持域，不证明现代或原生历史可达。personality 是调用者给定的已解析结果，不是人物ID或 C# 数字枚举。

输入不接受 canRethink、personId、books、team、firstTeam、hp、stress、deck、deckCursor、generation、cardToken、seed、rawDraws、RNG回调、预计算结果、audit 或 evidence。调用者须显式投影本节字段；完整角色或旧会话对象不能直接传入。

### 2.2 显式语义布尔返回值，不是原生随机采样

`percent:40` 记录来源调用参数，只接受已经得到的语义 boolean。本核不从0..99或其他整数阈值产生该布尔值，不实现 PRNG、概率分布、取模、整数溢出、seed 或原生随机流；不能据此宣称已复原40%的底层映射或随机消费预算。

正计时器冷静要求并记录恰好一个返回值，即使话题在0..2之外，或替换牌面会与原槽1相同。计时器为0或不是冷静时必须传空数组，不能把“不会改牌”误认为所有分支都可以随意省略或附带返回值。rawResults 的结构和内容先全量校验，最后才校验所需数量。

## 3. 条件、消费、覆盖与最终排序

先完成全部输入解析，再按以下短路语义判定。下表同时列出成功顶层 reason 的全部五个字符串：

| 条件，按判定顺序 | gate.reason / eligible | 消费条数 | 顶层 reason | replacement |
|---|---|---|---|---|
| angerTimer=0，任意性格 | `timer-zero` / false | 0 | `timer-zero` | null |
| angerTimer>0且不是calm | `personality-not-calm` / false | 0 | `personality-not-calm` | null |
| angerTimer>0且为calm，value=false | `positive-timer-calm` / true | 1 | `boolean-result-false` | null |
| 同上，value=true，currentTopic不在0..2 | `positive-timer-calm` / true | 1 | `topic-out-of-range` | null |
| 同上，value=true，currentTopic在0..2 | `positive-timer-calm` / true | 1 | `replacement-applied` | 非null |

timer-zero 优先于 personality-not-calm；布尔返回 false 优先于无效话题。因此正计时器冷静、false、话题−1的成功原因是 boolean-result-false，不是 topic-out-of-range。无效话题仅指已接受的 signed32 值不在0..2，不涵盖输入类型或范围错误。

符合最后一行时，话题0／1／2分别把**当前物理槽1**赋为3／6／9。赋值不是挑选同话题牌、最低等级牌或新的随机槽，不向手牌追加牌，也不消耗或新增牌身份。即使 before=after，仍返回 replacement-applied 和非null replacement，只有 changed=false。

每条成功路径最后都对全部活动槽按数值升序排序。审计以“牌码升序，相等时来源物理槽升序”显式打破相等牌的来源身份平局，保证本工程输出可重现；这是工程稳定策略，不宣称来源 `Array.Sort` 对等牌对象身份有相同保证。数值相同不代表排序步骤被跳过。

没有随机回调、外部 RNG 调用、调用者状态写入、隐藏游标、跨调用状态、补牌、发牌、再生成、额度消费、TurnEnd或计时器变化。调用者可以自行使用返回 hand，但本函数不会提交到旧 session。

## 4. 成功结果及全部嵌套字段

```ts
type DebateCalmRethinkSuccessV1 = {
  ok: true;
  schemaVersion: 1;
  profile: 'debate-calm-rethink-reference-v1';
  policy: DebateCalmRethinkPolicyV1;
  evidence: DebateCalmRethinkEvidenceV1;
  hand: DebateCalmRethinkCardV1[];
  reason: DebateCalmRethinkReasonV1;
  audit: DebateCalmRethinkAuditV1;
};
```

输入是复数 policies，成功结果是单数 policy。hand 是最终数值排序后的完整活动手牌，与 audit.sort.after 值相同，长度与输入相同。不承诺这些数组有相同对象身份。没有 session、state、deck、canRethink、winner、currentTopic、quota 或回合完成字段；不得给成功结果增造未声明的顶层字段。

### 4.1 条件与语义返回值记录

```ts
type DebateCalmRethinkGateV1 = {
  personality: DebateCalmRethinkPersonalityV1;
  angerTimer: number;
  eligible: boolean;
  reason: DebateCalmRethinkGateReasonV1;
};
type DebateCalmRethinkConsumedResultV1 = {
  index: 0;
  role: 'debate-calm-rethink-rand-bool';
  percent: 40;
  value: boolean;
};
```

gate 回显给定性格与计时器；eligible 当且仅当 timer>0且为calm，不依赖当前话题、value或牌面是否改变。eligible=true时 booleanResult 非null，index恒0并保留显式布尔值；否则 booleanResult=null。false 是真实消费记录，不用null表示返回假。

### 4.2 覆盖与排序记录

```ts
type DebateCalmRethinkReplacementV1 = {
  sourceSlot: 1;
  before: DebateCalmRethinkCardV1;
  after: DebateCalmRethinkBonusCardV1;
  changed: boolean;
};
type DebateCalmRethinkSortAuditV1 = {
  before: DebateCalmRethinkCardV1[];
  after: DebateCalmRethinkCardV1[];
  sourceIndices: number[];
  equalCardTieBreak: 'source-slot-ascending-engine-policy';
};
```

replacement.sourceSlot 始终是覆盖时的物理槽1，不是最终排序后槽号。before 是原输入 hand[1]，after 为话题对应3／6／9，changed 等于 before!==after；同牌面覆盖也保留完整记录。

sort.before 是可选覆盖**之后、最终排序之前**的活动手牌；不是原始输入快照。sort.after 是最终手牌。sourceIndices 的每项对应相同下标的最终牌，值为这张牌在 sort.before 中的物理槽号；完整数组是0..hand.length−1的一次排列。被覆盖的新牌面继续使用原物理槽1作为本次排序来源，没有发明新 occurrence id。

相等牌按这些来源槽号升序排列。sourceIndices 只描述本次最终排序的局部来源，不是 deck下标、跨代身份或原生 Array.Sort 身份证明；不能用于断言完整游戏随机／牌身份链已经对齐。

### 4.3 总审计

```ts
type DebateCalmRethinkAuditV1 = {
  inputHand: DebateCalmRethinkCardV1[];
  gate: DebateCalmRethinkGateV1;
  rawResultsConsumed: 0 | 1;
  booleanResult: DebateCalmRethinkConsumedResultV1 | null;
  replacement: DebateCalmRethinkReplacementV1 | null;
  sort: DebateCalmRethinkSortAuditV1;
  externalRngConsumed: 0;
};
```

inputHand 完整保存最初已校验的补牌后排序检查点，与可选覆盖后 sort.before 明确分离。无覆盖时两者值相同；有覆盖时只可能槽1不同，同牌面覆盖则仍值相同但 replacement 非null。

rawResultsConsumed 当且仅当 gate.eligible 时为1，并与 booleanResult 是否非null一致。externalRngConsumed 恒0，只表示本核没有调用外部随机；不表示语义返回值没被使用，更不是原生随机流零消耗结论。审计、原因字符串和输入支持域都是工程可观察性合同，不声称 C# 原函数返回这些收据。

## 5. 安全分离、预算、fail-closed 与原子性

模块初始化保存受信任 Node 运行时的 `process.getBuiltinModule('node:util').types.isProxy` 能力。若无法取得该能力，每次调用先返回 unsupported-runtime，不读取输入，不降级到不能排除 Proxy 的路径。浏览器、旧 Node 或内建对象已遭替换的环境不在所承诺的运行条件内；本批没有执行运行时能力探测。

领域解析前完整安全分离输入，规则如下：

- 允许 null、boolean、string、安全整数及以下普通对象／数组；通过安全层不等于符合领域字段。
- 普通对象原型只能是 Object.prototype 或 null；数组原型只能精确为 Array.prototype。自定义原型、类实例、Date、Map、Set与类型化数组拒绝。
- 先检测 Proxy，再反射对象；只读数据属性描述符，不调用 getter、setter、toJSON、函数或回调。
- 拒绝 Proxy、访问器、symbol键／值、undefined、function、bigint、非有限数、小数、不安全整数、−0及普通对象的非可枚举字段。
- 数组须稠密，除原生 length 外只允许规范0..length−1索引，不接受额外属性、空洞或隐藏字段；length 是唯一允许的非可枚举字段。
- 拒绝循环引用；重复但不成环的引用每次独立复制并计入预算，不保留调用者共享引用关系。
- 安全复制数据属性，不调用输入序列化；`__proto__` 等名称没有特殊能力，额外键仍由后续封闭字段规则拒绝。

| 预算 | 上界与计数 |
|---|---|
| 值节点 | 1024；根计1，每次访问值计1，重复非循环引用每次展开独立计数 |
| 深度 | 10；根深度0，每个属性值／数组元素深入1 |
| 单数组长度 | 32；领域层 hand 仍只能4..7、rawResults仍只能0..1 |
| 单对象自有键数 | 反射自有键不超过1024，数组length也计入 |
| 字符串／键预检 | 单项JS长度不超过16384；全部字符串值及自有键累计UTF-8字节不超过16384 |
| 完整规范表示 | 对象键排序、数组保序、无空白，含JSON转义和标点的canonical表示UTF-8字节不超过16384 |
| 一次领域工作 | 最多7个活动槽、1个显式布尔返回值、1次槽1覆盖、1次最终排序，0次外部RNG调用 |

所有预算包含完整 policies 与稍后才判为错误／额外的字段。字符串预检也计入数组索引和length等键；最终canonical大小符合上界不代表一定通过所有预检。超限返回 input-limit，不截断数组、裁剪审计或部分求值。

安全层优先于封闭字段解析。未知字段藏有getter、小数、函数或负零时先为 malformed-data；未知字段藏有超大数组时可先为 input-limit。多个安全问题按遍历首次遇到处停止，不承诺跨问题的全局优先级。

全部解析、返回值数量校验和求值只在私有数据中完成，不会修改、冻结或推进调用者输入，也没有外部随机副作用。失败仅为冻结的 `{ok:false,reason}`，不暴露部分手牌、消费位置、覆盖、排序、audit或路径；没有部分提交。结果由分离数据及可信内部值构造，固定常量以外不携带输入可变引用。

## 6. 全部失败原因与解析优先序

```ts
type DebateCalmRethinkFailureReasonV1 =
  | 'unsupported-runtime'
  | 'input-limit'
  | 'malformed-data'
  | 'unknown-field'
  | 'unsupported-profile'
  | 'unsupported-policy'
  | 'invalid-personality'
  | 'invalid-anger-timer'
  | 'invalid-current-topic'
  | 'invalid-hand'
  | 'invalid-raw-results'
  | 'invalid-raw-result'
  | 'raw-result-count-mismatch';
type DebateCalmRethinkFailureV1 = {
  ok: false;
  reason: DebateCalmRethinkFailureReasonV1;
};
type DebateCalmRethinkResultV1 =
  DebateCalmRethinkSuccessV1 | DebateCalmRethinkFailureV1;
```

| reason | 条件 |
|---|---|
| unsupported-runtime | 缺少受支持的可信Proxy检测能力；先于检查输入 |
| input-limit | 安全分离的节点、深度、数组、键数或字节预算超限 |
| malformed-data | 不安全形态／数值、访问器、循环等；顶层不是record；顶层或rawResult缺必需键；未分类异常封闭归入此码 |
| unknown-field | 安全分离后顶层或rawResult有额外键；同一record内先于缺键 |
| unsupported-profile | schemaVersion不是1或profile不是固定精确字符串 |
| unsupported-policy | policies完整canonical值不等于固定政策；包括缺键、多键、错值、整体类型错或数组顺序错 |
| invalid-personality | personality不是四个精确字符串之一 |
| invalid-anger-timer | 安全层后timer不是数字或不在0..4 |
| invalid-current-topic | 安全层后话题不是数字或不在signed32范围；合法整数但不在0..2不属于此错误 |
| invalid-hand | 手牌不是数组、长度不在4..7、未非递减排序、槽0不是0、其他槽不在1..14，或没有普通话题牌1..9 |
| invalid-raw-results | rawResults不是数组或领域长度不是0..1；超过通用安全数组上界可更早为input-limit |
| invalid-raw-result | 某项不是record，或role／percent／value不符合固定语义形状；字段缺失／额外另按上述错误处理 |
| raw-result-count-mismatch | 全部条目合法后，正计时器冷静不是恰1项，或其他分支不是恰0项 |

在输入可安全分离的前提下，固定解析顺序为：

1. 顶层封闭record：先额外键，再缺键。
2. schemaVersion／profile。
3. 完整政策精确canonical比较。
4. personality。
5. angerTimer。
6. currentTopic。
7. hand完整形状与域。
8. rawResults数组与长度0..1。
9. 按数组顺序解析每项：record形状、额外键、缺键，再role／percent／boolean。
10. 依 timer>0且calm 校验恰需的返回值数量。
11. 求值与最终排序，发布完整冻结成功结果。

运行时能力门在上述所有步骤之前；随后全量安全分离／预算也在第1步之前。因此 top缺字段同时多安全字段时 unknown-field优先，而rawResult.value=−0可在顶层profile错误前就成为malformed-data。timer=0不允许跳过有错的rawResults；合法多余返回值才走最后的raw-result-count-mismatch。

## 7. 完整固定政策、证据与来源边界

`DebateCalmRethinkPolicyV1` 与 `DebateCalmRethinkEvidenceV1` 分别是 [实现中两个导出常量](../../packages/engine/src/debate-calm-rethink.ts)的完整递归readonly字面量类型。完整字段与取值同时见[固定政策／证据来源账本](../sources/debate-calm-rethink-v1.json)；本页用链接保持与实现同源，不手抄一份可能漂移的政策或证据对象。调用者必须传完整 `DEBATE_CALM_RETHINK_POLICY_V1` 的值，不能只传正确id、用成功结果的evidence代替policies，或把其他核的政策移植过来。

固定现代参考主要为 [CharacterRethink第491–509行](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L491-L509)。清牌与调用CharacterFillCards属于本核之前的来源上下文；本核只实现它返回后的条件、RandBool语义返回值使用、槽1覆盖与最终排序。代码里的原生地址注释不是独立原生等价证据。

输入支持域、封闭schema、fail-closed运行时、安全预算、冻结、原子拒绝、等牌来源槽打平与审计原因均为显式工程政策，不是对原C#额外行为的声称。语义RandBool返回值不认证底层随机；合成手牌不认证发牌或再考来源；来源personality调用不证明本核解析了人物或书籍。

本核没有清牌、补牌、牌组再生成、再考额度、完整再考事务、旧九会话接入、TurnStart／TurnEnd、计时器推进、HP／压力、胜负／崩坏或完整回合编排。人物／书籍、非恒等人物hook、开场／追击／留情与campaign排除。P078及全部依赖排除，native whole chain仍开放，43证据主题／45历史快照不减少。

## 8. 紧凑纸面示例，未执行

以下仅为完整输入构造示意和人工静态推导，没有调用函数、运行示例或执行候选代码：

```ts
const input: DebateCalmRethinkInputV1 = {
  schemaVersion: 1,
  profile: 'debate-calm-rethink-reference-v1',
  policies: DEBATE_CALM_RETHINK_POLICY_V1,
  personality: 'calm',
  angerTimer: 4,
  currentTopic: 2,
  hand: [0, 1, 4, 9],
  rawResults: [{ role: 'debate-calm-rethink-rand-bool', percent: 40, value: true }],
};
```

纸面预期为 reason=replacement-applied、hand=[0,4,9,9]。audit.inputHand=[0,1,4,9]；gate={personality:'calm',angerTimer:4,eligible:true,reason:'positive-timer-calm'}；rawResultsConsumed=1；booleanResult={index:0,role:'debate-calm-rethink-rand-bool',percent:40,value:true}；replacement={sourceSlot:1,before:1,after:9,changed:true}。sort.before=[0,9,4,9]，sort.after=[0,4,9,9]，sourceIndices=[0,2,1,3]，equalCardTieBreak='source-slot-ascending-engine-policy'；externalRngConsumed=0。两个相等9按覆盖后、最终排序前的来源槽1、3排序，不表示原生等牌身份已获验证。

以下各行相互独立，未列字段均假定满足完整合同：

| 输入要点 | 纸面预期 |
|---|---|
| calm/1、topic=0、hand=[0,3,6,9]、true | replacement-applied；replacement={sourceSlot:1,before:3,after:3,changed:false}；hand不变但仍记录排序 |
| calm/1、topic=1、hand=[0,3,4,7]、true | 槽1的3被6覆盖，结果[0,4,6,7]；不是挑最低等级的4或7 |
| calm/1、topic=−1、true | 必须且只消费1项；topic-out-of-range，replacement=null，仍最终排序 |
| calm/1、topic=−1、false | boolean-result-false优先；仍消费1项，不是topic-out-of-range |
| calm/0、rawResults=[] | timer-zero，消费0、booleanResult=null、replacement=null，仍排序 |
| bold/4、rawResults=[] | personality-not-calm，消费0，不因正timer要求返回值 |
| reckless/0、rawResults=[] | timer-zero优先于personality-not-calm |
| calm/1、topic=3、rawResults=[] | raw-result-count-mismatch；无效话题不能省略返回值 |
| calm/0、一个完全合法返回值 | raw-result-count-mismatch；不会静默忽略多余返回值 |
| calm/0、一个value=1的返回值 | invalid-raw-result先于数量不匹配 |
| rawResults有2项，均为安全数据 | invalid-raw-results，不是raw-result-count-mismatch |
| hand=[0,1,3,2] | invalid-hand；不先修复排序再接受 |
| hand=[0,10,11,12] | invalid-hand；至少需要一张普通话题牌 |
| hand=[0,0,1,2]或[0,−1,1,2] | invalid-hand；只允许槽0保留再考0，且没有空槽 |
| currentTopic=2147483648 | invalid-current-topic，无部分audit |
| hand中含1.5或任意字段含−0 | malformed-data先于领域解析 |
| 安全顶层同时多unknown字段且缺hand | unknown-field优先 |
| policies只有正确id | unsupported-policy |

本页与配套案例仅作静态规格、人工纸面推导和审阅材料。本批未运行测试、编译、typecheck、build、validator、checker、诊断、候选模块、来源代码、示例、场景或replay，也没有验证运行时能力；不得据此声称执行通过、原生等价或完整舌战闭环。
