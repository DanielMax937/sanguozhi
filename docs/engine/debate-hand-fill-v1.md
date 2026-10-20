# 独立舌战填牌与话题修补 API v1

[规则与来源边界](../rules/debate-hand-fill-v1.md) · [固定政策与证据](../sources/debate-hand-fill-v1.json) · [独立纸面案例，未运行](../../data/scenarios/debate-hand-fill-example-v1.json)。

实现入口为 [debate-hand-fill.ts](../../packages/engine/src/debate-hand-fill.ts)，公共导出见 [engine index](../../packages/engine/src/index.ts)。本页描述独立的纯函数填牌内核，不是新的完整舌战 session，也没有把它接入旧 session 的发牌、再考或回合补牌。

它只处理一次已经给定槽位和当前牌组窗口的填充：恢复来源再考保留槽0，按原始槽位从前到后补空位，必要时用调用者提供的 bound9 原始整数修补最后一个新增槽，然后按现代数字牌码升序展示。它不生成牌组、不调用 RNG、不接受 callback，不推进任何外部状态。

旧七个 session profile、卡牌对象 DTO、存档、政策与行为保持独立。尤其 PR110 的 Rethink session 仍在其规定的无话题 fill 边界返回 `unsupported-topic-repair`；本内核支持受限的一次修补，不会暗中放宽旧 guard，也不构成新旧格式迁移。

## 1. 公开函数、常量与结果

唯一公开函数：

```ts
evaluateDebateHandFill(input: unknown): DebateHandFillResultV1
```

两个公开常量：

```ts
DEBATE_HAND_FILL_POLICY_V1: DebateHandFillPolicyV1
DEBATE_HAND_FILL_EVIDENCE_V1: DebateHandFillEvidenceV1
```

成功值和失败值分别为：

```ts
{ ok: true; hand: DebateHandFillHandV1; deckCursor: number;
  receipt: DebateHandFillReceiptV1 }
{ ok: false; reason: DebateHandFillFailureReasonV1 }
```

没有 `index`、partial 结果、session 或外部 RNG 对象。成功顶层 hand/deckCursor 与 receipt.after 的值相同；hand 包括保留再考0，长度为输入 playableSlots 长度加1。所有返回对象、数组和两个常量递归冻结；函数先分离输入，不修改或冻结调用者输入，也不会从输出暴露调用者的可变对象。

本函数不维护隐式游标。重复调用相同输入不代表继续发牌；如调用方要继续，必须自行采用成功结果并明确构造下一次输入。手牌中出现保留0不授予再考可用性，也不改变旧 session 状态。

## 2. 完整输入 DTO 与数字牌码

以下复合类型均为递归 readonly，代码块仅为去掉 readonly 噪声后的结构展示；不是建议执行的示例。

```ts
type DebateHandFillCardCodeV1 =
  1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14;
type DebateHandFillTopicCardCodeV1 = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
type DebateHandFillSourceCardCodeV1 = 0 | DebateHandFillCardCodeV1;
type DebateHandFillHandV1 = [0, ...DebateHandFillCardCodeV1[]];
type DebateHandFillRawDrawV1 = {
  role: 'debate-fill-topic-repair';
  bound: 9;
  value: number;
};
type DebateHandFillInputV1 = {
  schemaVersion: 1;
  profile: 'debate-hand-fill-reference-v1';
  policies: DebateHandFillPolicyV1;
  playableSlots: (DebateHandFillCardCodeV1 | null)[];
  cardTape: DebateHandFillCardCodeV1[];
  deckCursor: number;
  rawDraws: DebateHandFillRawDrawV1[];
};
```

七个输入键全部必需，不自动补政策、游标或空 draw 数组。只接受列出的键；没有 tutorial、人物、INT、canRethink、session、seed、replacementCards、预计算手牌或调用者 evidence 字段。输入使用复数 `policies`，必须逐字段等于固定常量；receipt 使用单数 `policy`。

所有数值必须是安全整数且不能为 −0。可出牌与当前牌组只接受以下现代数字牌码：

| 牌码 | 含义 | 牌码 | 含义 |
|---:|---|---:|---|
| 1 | 故事·小 | 8 | 时节·中 |
| 2 | 故事·中 | 9 | 时节·大 |
| 3 | 故事·大 | 10 | 大喝 |
| 4 | 道理·小 | 11 | 诡辩 |
| 5 | 道理·中 | 12 | 无视 |
| 6 | 道理·大 | 13 | 镇静 |
| 7 | 时节·小 | 14 | 激昂 |

输入 `playableSlots` 长度为3..6，元素是1..14的牌码或 `null`；`null` 是唯一空位标记，不能用 −1、0、数组洞或 undefined 替代。不根据 INT 或人物资料计算容量。长度本身决定本次来源总槽数4..7。

`cardTape` 必须为恰好18项的完整当前牌组；所有项都接受检查，包括游标以前和本次不会用到的后续项。这里不要求牌组有某种数量配比或至少一张话题，也不声称提供的牌组由原生 generator 产生。`deckCursor` 为0..18且指向下一未取项。

`rawDraws` 必填，不能省略或为 null。无修补时为 `[]`；实际需要修补时必须恰有一项 `{role:'debate-fill-topic-repair',bound:9,value:0..8}`。draw 的 value 为0..8，修补牌码对应1..9；没有第二次修补 draw，不接受预选最终牌、seed、RNG 对象或 callback。修补不取代当前牌组正常发牌，不能用 draw 来补牌组余量不足。

## 3. 槽位、当前牌组与执行顺序

`playableSlots` 的数组下标从0开始，现代来源的可出牌原槽位从1开始；两者相差1。来源槽位0专用于再考保留牌，不由调用者放进可出牌数组，也不从当前牌组取牌。成功输出会恢复数字0，并与可出牌一起形成来源展示序列；这不代表可以在该内核选择或执行再考。

当前牌组窗口恰好18项，而不是任意长度的逻辑流。游标允许0..18。空位数不能超过当前窗口余量；需要来源下一次 `DeckGenerate` 的填充整体拒绝，不能跨窗口、循环、借用修补 draw 生成一副牌，也不能跳过或扫描后续话题牌。游标18而没有空位仍是有效输入。

领域阶段按以下顺序处理；输入的安全分离和结构校验先于这些步骤：

1. 以输入可出牌槽位的原顺序建立私有候选，并恢复来源保留槽0。
2. 按原槽位1..N升序访问，仅给 `null` 槽连续发当前牌组从游标开始的牌。非空槽原样保留；本次最后填充的原槽位单独记录。
3. 在全部空位填满后，计算可出牌中的普通话题牌数量。
4. 仅当话题数为0且本次确实填过至少一槽时，替换最后新增的原槽位：新牌码为 `1 + rawValue`，其中 rawValue 为0..8。修补不是再次抽取当前牌组，不额外推进牌组游标。
5. 形成按数字牌码升序的展示结果。相等牌码的审计排序按原槽位升序处理，这是确定性工程政策，不是现代 `Array.Sort` 或原生同牌身份稳定性的证明。

修补发生在排序前。目标既不是“排序后的最后一张”，也不是最大牌码或最后保留的一张。被覆盖的发牌仍已消费当前牌组的一项；它不会退回牌组，也不能重新发给另一个槽。

### 3.1 无需修补的关键边界

完全填满但只有话术的 `[10,11,14]` 没有本次新增槽，因此不修补、不要求 draw，也不创造普通牌。数字排序与保留槽恢复仍可发生。这个来源条件是“没有话题且本次填过牌”，不是“每次调用后必须有话题”。

有空位但原手已保留普通牌时，同样无需修补。新发牌自然包含普通牌时也无需修补。以上无修补路径不得携带额外的修补 draw。

### 3.2 数字顺序与来源身份

现代枚举中的普通牌1..9与话术10..14用于比较和展示；0只保留给再考槽。数值0不是普通牌，也不是调用者可提供的可出牌或牌组项。重复牌码允许存在；重复数值不等于可以删除一次发牌、合并审计或把原槽位身份改成排序后身份。

## 4. 输出 DTO 与审计含义

### 4.1 前后值、发牌与修补

```ts
type DebateHandFillBeforeV1 = {
  playableSlots: (DebateHandFillCardCodeV1 | null)[];
  deckCursor: number;
};
type DebateHandFillAfterV1 = {
  hand: DebateHandFillHandV1;
  deckCursor: number;
};
type DebateHandFillFilledCardV1 = {
  preSortSlot: number;
  tapeIndex: number;
  card: DebateHandFillCardCodeV1;
};
type DebateHandFillRepairV1 =
  | {
      status: 'applied';
      preSortSlot: number;
      beforeCard: DebateHandFillCardCodeV1;
      afterCard: DebateHandFillTopicCardCodeV1;
      drawIndex: 0;
      rawValue: number;
    }
  | { status: 'skipped'; reason: 'topic-present' | 'no-new-slot' };
```

before.playableSlots 保留输入原槽位顺序与 null，不含保留0。filled 只列本次真正填充的空位，按原槽位升序；每项 tapeIndex 是当前18项牌组中的0-based索引，card 是修补前实际发出的牌码。filled 不包含保留牌、保留0，也不将修补伪装成第二次发牌。

`lastNewSlot` 为 filled 最后一项的 preSortSlot；没有填槽时为 null，不用 −1冒充可出牌。applied repair 的 preSortSlot 与它相同；beforeCard 是该次发出的牌码，afterCard 为1+rawValue。修补时所需 draw 必是 rawDraws[0]，所以 drawIndex 固定0。

skip 的 reason 有明确优先级：填充后已有话题为 topic-present，包括没有空位但原手已有话题的情况；只有无话题且无新增槽时为 no-new-slot。跳过分支没有 rawValue、target 或伪造的 beforeCard/afterCard 字段。

### 4.2 排序身份审计

```ts
type DebateHandFillSortedProvenanceV1 = {
  sortedIndex: number;
  preSortSlot: number;
  origin: 'reserved-rethink' | 'retained' | 'tape';
  tapeIndex: number | null;
  originalCard: DebateHandFillSourceCardCodeV1;
  card: DebateHandFillSourceCardCodeV1;
  topicRepairApplied: boolean;
};
```

sortedProvenance 逐项对应 after.hand；sortedIndex 为排序后0-based展示位置，preSortSlot 则永久指向排序前的来源槽位0..N。

- `reserved-rethink`：preSortSlot=0、originalCard=card=0、tapeIndex=null、topicRepairApplied=false；数字排序后仍处于 sortedIndex0。
- `retained`：来自输入非空可出牌槽；tapeIndex=null、originalCard=card，topicRepairApplied=false。
- `tape`：来自本次填槽；tapeIndex 为实际消费的0..17索引，originalCard 为原发牌码。若被修补，card 为新的话题码且 topicRepairApplied=true；否则 card=originalCard。

因此 originalCard 不是修补后的值；tapeIndex 不会因修补丢失或指向 draw。审计 origin 也不会从 tape 变成另一个虚构的“修补牌组”。没有跨调用的 token、全局牌身份或原生 occurrence 身份承诺。

### 4.3 完整 receipt 和结果类型

```ts
type DebateHandFillReceiptV1 = {
  schemaVersion: 1;
  profile: 'debate-hand-fill-reference-v1';
  policy: DebateHandFillPolicyV1;
  evidence: DebateHandFillEvidenceV1;
  before: DebateHandFillBeforeV1;
  after: DebateHandFillAfterV1;
  reservedSlot: { preSortSlot: 0; card: 0 };
  filled: DebateHandFillFilledCardV1[];
  postFillHand: DebateHandFillHandV1;
  preSortHand: DebateHandFillHandV1;
  topicCardCountAfterFill: number;
  lastNewSlot: number | null;
  repair: DebateHandFillRepairV1;
  consumedDraws: DebateHandFillRawDrawV1[];
  drawCount: 0 | 1;
  sortedProvenance: DebateHandFillSortedProvenanceV1[];
};
type DebateHandFillFailureV1 = {
  ok: false;
  reason: DebateHandFillFailureReasonV1;
};
type DebateHandFillResultV1 =
  | { ok: true; hand: DebateHandFillHandV1; deckCursor: number;
      receipt: DebateHandFillReceiptV1 }
  | DebateHandFillFailureV1;
```

三个完整手牌数组均包含保留0，但阶段不同：

1. postFillHand：按原槽位排列，已经填满，尚未进行话题修补。
2. preSortHand：按原槽位排列，已经完成或跳过修补，尚未排序。
3. after.hand：按数字码升序排序；同值审计按 preSortSlot 升序。

`topicCardCountAfterFill` 统计第1阶段中1..9的数量，不包括保留0，不是修补后的统计。修补成功时该值仍为0，不能改写成1来消除触发原因。`consumedDraws` 仅含实际修补的一项，或跳过时为空；drawCount 与其长度相等。完整当前牌组不重复收入 receipt，receipt 不是可自证来源或可重放 session 的存档。

## 5. 固定政策与证据

`DebateHandFillPolicyV1` 与 `DebateHandFillEvidenceV1` 分别是固定 POLICY 与 EVIDENCE 对象的递归 readonly 类型，不是可配置 map；完整字面值见[来源账本](../sources/debate-hand-fill-v1.json)和[源码](../../packages/engine/src/debate-hand-fill.ts)。只比较 policy id 不足以接纳请求，完整对象键值都必须匹配；对象键顺序不影响比较，数组内容和顺序仍有意义。

policy id=`debate-hand-fill-current-deck-policy-v1`，profile=`debate-hand-fill-reference-v1`；顶层键为 `id,profile,cards,slots,deck,repair,sort,randomness,capacity,boundary`。主要固定条目为：

- cards 指定现代数值表示、rethink0、topicFirst/Last1/9、rhetoricFirst/Last10/14与 playableMin/Max1/14。
- slots 指定 `input=playable-only-original-source-order`、vacancy=null、sourceSlotOffset1、playableCounts[3,4,5,6]、reservedSlot/reservedCard0、`reservedHandling=restore-before-fill`。
- deck.id=`provided-current-deck-18-v1`，sourceDeckTableSize=providedEntries=18，`fillOrder=ascending-vacant-original-source-slot`，`consume=advance-one-per-filled-slot`；exhaustion=`unsupported-deck-regeneration`、regeneration=excluded、nativeDistribution=false。
- repair.condition=`post-fill-topic-count-zero-and-new-slot-exists`，target=`last-new-original-source-slot`；drawRole=`debate-fill-topic-repair`、drawBound9、cardMapping=`1+raw-value`、noNewSlot=`skip-even-with-no-topic`。
- sort.key=`numeric-card-code-ascending`，scope=`all-source-slots-including-reserved-zero`；equalCodeAuditTie=`preSortSlot-ascending-engine-policy`，nativeEqualCodeIdentityOrder=false。
- randomness.source=`caller-supplied-draws`，validation=`syntax-before-fill-semantic-at-repair`，count=`one-only-if-repair-applies`，extra=`atomic-rejection`；externalRngConsumed=0、nativePrng=false。
- capacity 指定1024节点、深度12、通用数组32和16,384 canonical UTF-8 bytes。
- boundary.kind=`independent-character-fill-kernel`；sessionIntegration、persistence、legacyProfilesChanged 均为 false。

evidence 固定现代 commit、Debate.cs 与 DebateEnum.cs 路径和 blob，标出牌组长度、填充、排序与枚举行范围；同时单独标注当前牌组提供式边界、同码审计顺序、安全与预算均属工程政策。不会接纳调用者提供的 evidence 来升级来源层级。

固定来源为现代 C# 转录仓库 `tankyc/sango_infinity`，commit `a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef`。范围以[规则页](../rules/debate-hand-fill-v1.md)和[来源账本](../sources/debate-hand-fill-v1.json)为准：

- [Debate.cs 53–57](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L53-L57)：当前 DeckTableSize=18；这里不实现该牌组的生成机制。
- [Debate.cs 406–410、438](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L406-L438)：来源数值排序；不证明相等牌码 occurrence 的身份顺序稳定。
- [Debate.cs 415–427](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L415-L427)：恢复保留槽、按原槽位补空位并记录最后新增槽。421–425 的牌组再生成不在本内核内。
- [Debate.cs 429–437](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L429-L437)：仅无话题且有新增槽时修补，修补牌码为 TopicFirst 加 bound9 draw。
- [DebateEnum.cs 33–61](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/DebateEnum.cs#L33-L61)：现代再考0、普通牌1..9与话术10..14。

提供当前牌组窗口、提供 raw draw、不可变输出、安全分离、资源预算、严格错误与相等牌码的稳定审计顺序均属于工程合同。调用者提供的18张牌不被认证为原作概率分布、洗牌结果或合法原生牌组生成记录。

证据只覆盖固定现代参考的小范围机制，不认证原始头文件或 PC-PK/PK1.1、Vanilla、主机二进制。`nativeEquivalent`、`stockOriginalVerified`、`pkEquivalent`、`vanillaEquivalent`、`completeDebate` 均保持 false。原43证据主题／45历史快照仍开放且数量不变，不扩张 E15 既有普通通用核心的证据范围。

## 6. 错误、安全分离与预算

### 6.1 全部失败原因

| reason | 条件 |
|---|---|
| `unsupported-runtime` | 安全 Proxy 检测所需的内建入口不可用，拒绝不安全降级 |
| `input-limit` | 节点数、深度、通用数组长度或 canonical UTF-8 字节数超过预算 |
| `malformed-data` | 非法 JSON 式数据、缺少必需键、非法数值语法、−0、非法属性描述符或不安全对象结构 |
| `unknown-field` | 输入顶层或 raw draw 对象出现未登记键；policies 内差异统一按 unsupported-policy |
| `unsupported-profile` | schemaVersion 或 profile 与固定合同不符 |
| `unsupported-policy` | 传入的完整固定 policy 不匹配，不只比较 id |
| `invalid-playable-slots` | 已安全分离的可出牌槽位不是数组或长度不在3..6 |
| `unsupported-card-code` | 已安全分离的可出牌或当前牌组项不是1..14牌码；可出牌空位仅允许 null |
| `invalid-card-tape` | 已安全分离的当前牌组不是数组或长度不等于18 |
| `invalid-deck-cursor` | 已安全分离的游标不是 number 或不在0..18 |
| `unsupported-deck-regeneration` | 空位数超过18减游标，需要来源下一次牌组再生成 |
| `missing-raw-draw` | 实际需要修补但 rawDraws 为空 |
| `unexpected-raw-draw` | 跳过修补却提供 draw，或修补时提供超过一项 |
| `invalid-raw-draw` | 修补阶段的 role、bound 或 value 不符合固定 draw 合同 |

先安全分离和检查 raw draw 对象的必需键及字段语法，后按领域顺序检查 draw 的 role、bound、范围和所需数量。字符串 role、整数 bound/value 的语义不符属于 `invalid-raw-draw`；role 不是字符串，或 bound/value 不是合法安全整数等语法错误仍为 `malformed-data`。−0 不会延后当成范围错误。

牌组余量在修补消费前检查：不能为尚未完成填充的手牌补造话题，也不能以缺少修补 draw 掩盖需要下一副牌组的领域边界。此阶段顺序不表示恶意 rawDraws 的访问器、未知键或非法语法能绕过前置安全检查，也不承诺所有多错误组合都有同一优先级。

失败始终为原子拒绝，不发布部分 filled 审计、不改变调用者槽位、当前牌组或游标。没有 `deck-exhausted` 的成功替代、部分成功或“游戏平局”退路；本内核的耗尽原因明确表示来源再生成被排除。

`DebateHandFillFailureReasonV1` 是上表14个字面值组成的封闭联合；不像旧 session Failure，这里没有历史 entry index。未归类的内部异常也归为 malformed-data，不把调用者对象或半成品附加到错误输出。

### 6.2 安全输入与资源上限

只接收 Object.prototype 或 null 原型 record、标准 Array 与允许的 JSON 式标量。字段必须为可枚举数据属性；拒绝 Proxy、getter/setter、函数、undefined、BigInt、Symbol、Date/custom prototype、循环、稀疏数组、额外 array 属性、非枚举 record 字段与不安全数字。不会调用调用者的 getter、toJSON 或 custom iterator。

安全 Proxy 检测依赖 `process.getBuiltinModule('node:util').types.isProxy`；缺失时返回 unsupported-runtime，而不是在不能识别 Proxy 的环境中尝试继续。这个运行时要求是接口边界，不表示已经验证某个 Node/浏览器版本。

| 项目 | 固定上限或范围 |
|---|---:|
| playableSlots | 3..6 |
| 当前 cardTape | 恰好18 |
| deckCursor | 0..18 |
| 安全分离值节点数 | 1024 |
| 嵌套深度，根为0 | 12 |
| 通用数组长度 | 32 |
| 输入 canonical UTF-8 字节数 | 16,384 |

通用数组上限不放宽领域长度；例如18项要求不能被32项预算替代。以上是输入安全分离预算，包括完整 policies，而不是完整 session 的历史/保存预算。receipt 的字段与数组由固定合同和最大6个可出牌槽产生，不接受调用者注入任意审计或 evidence。

## 7. 纸面示例

以下全部为独立输入的**手工推导、未运行**，不是连续 session，也不是实际 API 生成的 receipt。[案例文件](../../data/scenarios/debate-hand-fill-example-v1.json)保留完整输入与纸面预期；每份 cardTape 均恰好18项，未单列的位置为牌码1，不能把下文列出的已使用部分当作完整请求。

### 7.1 稀疏空位：修补原槽位2

`playableSlots=[12,null,14]`，deckCursor=5，cardTape[5]=10，draw value=4。

- 槽位2从 tapeIndex5 发牌10；filled 只有这一项，lastNewSlot=2，游标5→6。
- 补满未修补的 postFillHand 为 `[0,12,10,14]`，topicCardCountAfterFill=0。
- 最后新增原槽位2从10修补为 `1+4=5`；preSortHand 为 `[0,12,5,14]`。
- 排序后的 after.hand 为 `[0,5,12,14]`；该5的 provenance 仍为 preSortSlot2、origin=tape、tapeIndex5、originalCard10、topicRepairApplied=true。

因此本例的修补槽位是2，不是排序后展示下标1；牌码10仍已从当前牌组消费，修补不退回这张牌。

### 7.2 多个空位：只修补最后新增原槽位3

`playableSlots=[null,11,null,13]`，deckCursor=0，cardTape[0]=14、cardTape[1]=10，draw value=8。

- filled 顺序为原槽位1←tapeIndex0/牌码14，再原槽位3←tapeIndex1/牌码10；lastNewSlot=3，游标0→2。
- postFillHand=`[0,14,11,10,13]`，话题数0。
- 仅原槽位3从10改为9；原槽位1的14保留，preSortHand=`[0,14,11,9,13]`。
- after.hand=`[0,9,11,13,14]`，drawCount=1。修补只占一项，不按空位数量要求两次 draw。

### 7.3 保留话题：在当前窗口末尾正常补牌

`playableSlots=[9,null,10]`，deckCursor=17，cardTape[17]=12，rawDraws=[]。

原槽位2从 tapeIndex17 发12，游标17→18，lastNewSlot=2；postFillHand=`[0,9,12,10]`，话题数1。repair 跳过，reason=topic-present，preSortHand 保持同值，after.hand=`[0,9,10,12]`，drawCount=0。恰好消费当前窗口最后一张牌不需要再生成；下一次是否可填由下一次请求自己的空位数决定。

### 7.4 已满全话术：不修补也不取牌

`playableSlots=[14,10,12]`，deckCursor=18，rawDraws=[]。

filled=[]、lastNewSlot=null、话题数0，postFillHand 和 preSortHand 都为 `[0,14,10,12]`。repair 跳过，reason=no-new-slot；after.hand=`[0,10,12,14]`，游标仍18，drawCount=0。没有话题不是单独的修补条件，空牌组余量也不是在零空位时拒绝的理由。

### 7.5 相同牌码：审计身份不随数值合并

`playableSlots=[null,10,10]`，deckCursor=0，cardTape[0]=10，draw value=0。

补满得到 `[0,10,10,10]`，最后新增原槽位1修补为1，preSortHand 与 after.hand 都为 `[0,1,10,10]`，游标0→1。两个最终10分别来自保留的原槽位2、3，排序后依次位于下标2、3；这是本工程的稳定 provenance 规则，不证明来源同牌身份排序稳定，也不把两张10合并成一张。

### 7.6 独立拒绝候选

这些候选不接在上述案例后面，不伪装成成功 receipt：

- 稀疏修补案例改成 rawDraws=[]：需要修补但缺 draw，`missing-raw-draw`。
- 已满全话术案例额外提供一项合法修补 draw：无需修补却有 draw，`unexpected-raw-draw`。
- playableSlots=`[null,9,null]`、deckCursor=17：要补两槽但当前窗口只剩一项，`unsupported-deck-regeneration`；保留话题9不能豁免牌组边界。
- cardTape 只有17项：`invalid-card-tape`；不能补默认项或把它解释成剩余牌段。

上述失败都不发布已填一槽的手牌或推进后的游标。它们与接纳纸面案例一样未经执行；文件中的预期不是测试通过记录。

## 8. 接入与未执行声明

调用者只应在 `ok:true` 后采用返回的新槽位和游标；失败不返回半副手牌、部分发牌收据或已推进的游标。输入中的 draw 只是原始数据，失败不会回滚或推进调用者另行管理的 RNG。本函数本身没有外部 RNG 消费。

本内核不提供 create、inspect、preview、execute-round、save、load、replay 或 session 适配器；没有人物、HP、stress、话题状态、先手、愤怒、再考许可、战斗比较或终局。它也不处理教程、冷静愤激大牌覆写、自动反制、原作 DeckGenerate/洗牌/概率、真实人物/物品 hook、campaign、外交自动结算、P078/native 人员任务及其全部依赖、俘虏/处斩/归属或 return/mission。

本批仅进行静态文本编辑、读源与纸面推导；没有运行测试、typecheck、编译器、build、checkers、validators、诊断、候选 API、项目或产品代码。示例不是执行产生的 receipt，也不是已验证存档。新增导出和文档不表示已经验证运行时兼容性或完整行为。
