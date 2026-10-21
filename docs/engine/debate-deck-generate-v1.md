# 独立舌战牌组生成 API v1

[规则与来源边界](../rules/debate-deck-generate-v1.md) · [固定政策与证据](../sources/debate-deck-generate-v1.json) · [独立纸面案例，未运行](../../data/scenarios/debate-deck-generate-example-v1.json)。

实现入口为 [debate-deck-generate.ts](../../packages/engine/src/debate-deck-generate.ts)，公共导出见 [engine index](../../packages/engine/src/index.ts)。本页描述一次独立的纯函数 `DeckGenerate` 参考内核，不是完整舌战、再生成 session 或新的发牌适配器。

它只用调用者明确提供的有序话术牌与原始整数 draw，按固定现代 C# 来源顺序生成18张牌，返回生成后的牌组以及经过交换后的完整话术数组。函数不调用外部 RNG，不接受 seed、callback 或随机数对象，不读取人物、书籍、INT 或旧 session 状态。

旧八个 session profile、旧内核、卡牌对象 DTO、存档、政策与行为均保持独立。PR112 的 filled session 仍在请求第19张当前牌组项时拒绝；本内核不会暗中把第19张请求改成自动生成下一副牌，也不会改变旧 hand-fill 内核的再生成边界。

## 1. 公开函数、常量与不变性

唯一公开函数：

```ts
evaluateDebateDeckGenerate(input: unknown): DebateDeckGenerateResultV1
```

两个公开常量：

```ts
DEBATE_DECK_GENERATE_POLICY_V1: DebateDeckGeneratePolicyV1
DEBATE_DECK_GENERATE_EVIDENCE_V1: DebateDeckGenerateEvidenceV1
```

成功和失败结构分别为：

```ts
{ ok: true; deck: DebateDeckGenerateDeckV1;
  rhetoricCards: DebateDeckGenerateRhetoricCardCodeV1[];
  receipt: DebateDeckGenerateReceiptV1 }
{ ok: false; reason: DebateDeckGenerateFailureReasonV1 }
```

deck 为完整18项最终牌组，rhetoricCards 为完整 n 项交换后话术数组；它们分别与 receipt.after 中同名字段的值相同。失败不含 index、receipt、deck 或 rhetoricCards 字段。

函数先安全分离调用者输入，再在私有数据上生成结果；不修改或冻结调用者的数组或 record，不消费任何外部 RNG 状态。成功结果、失败结果、审计记录、嵌套数组与两个公开常量递归冻结，不向调用者暴露可变内部状态。

所有 draw 都是输入数据。失败没有部分成功，不返回半副牌组、部分交换结果或已推进的随机数位置。重复调用相同输入不是继续洗牌或继续发牌，而是再次计算同一个独立结果。调用者若另行采用返回状态，应同时考虑完整话术数组，不能只保存选入本副牌的四张话术。

## 2. 完整输入与数字牌码

输入恰有五个必需字段：

```ts
type DebateDeckGenerateTopicCardCodeV1 = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
type DebateDeckGenerateRhetoricCardCodeV1 = 10 | 11 | 12 | 13 | 14;
type DebateDeckGenerateCardCodeV1 =
  DebateDeckGenerateTopicCardCodeV1 | DebateDeckGenerateRhetoricCardCodeV1;
type DebateDeckGenerateRawDrawV1 =
  | {
      role: 'debate-deck-small-topic' | 'debate-deck-medium-topic' |
        'debate-deck-large-topic';
      bound: 3;
      value: number;
    }
  | { role: 'debate-deck-rhetoric-swap'; bound: 1 | 2 | 3 | 4 | 5; value: number }
  | { role: 'debate-deck-tail-fallback'; bound: 9; value: number }
  | { role: 'debate-deck-table-swap'; bound: 18; value: number };
type DebateDeckGenerateInputV1 = {
  schemaVersion: 1;
  profile: 'debate-deck-generate-reference-v1';
  policies: DebateDeckGeneratePolicyV1;
  rhetoricCards: DebateDeckGenerateRhetoricCardCodeV1[];
  rawDraws: DebateDeckGenerateRawDrawV1[];
};
```

复合 DTO 的公开类型为递归 readonly；本页结构展示省略 readonly 噪声。`DebateDeckGenerateDeckV1` 为恰好18项 `DebateDeckGenerateCardCodeV1` 的 readonly tuple，不是任意长度数组。输入使用复数 `policies`，必须与固定政策的完整键值匹配，不能只给 policy id。没有默认 schema/profile/policies，没有自动补空数组或 draw，没有调用者 evidence 字段。

`rhetoricCards` 是长度0..5、元素互不重复的有序子集，牌码限10..14。输入顺序有意义，不自动排序，不把重复话术合并，也不从人物技能、物品或书籍推导资格。空数组表示本次明确提供零张话术；不是“资格未知”，也不触发人物查询。

| 牌码 | 含义 | 牌码 | 含义 |
|---:|---|---:|---|
| 1 | 故事·小 | 8 | 时节·中 |
| 2 | 故事·中 | 9 | 时节·大 |
| 3 | 故事·大 | 10 | 大喝 |
| 4 | 道理·小 | 11 | 诡辩 |
| 5 | 道理·中 | 12 | 无视 |
| 6 | 道理·大 | 13 | 镇静 |
| 7 | 时节·小 | 14 | 激昂 |

生成的牌组只包含1..14。牌码0是来源的再考保留槽，不是本生成器的输入话术或输出牌组项；本函数不生成、恢复或授予再考槽。输入数组顺序、来源映射顺序和最终牌组顺序是不同概念，不能混同为数字升序。

每项 raw draw 恰为 `{ role, bound, value }`；value 必须满足 `0 <= value < bound`，所有数值均为安全整数且不能为 −0。六种 role 对应固定的阶段，不可换成一个通用随机数角色。bound 是上界而非最大可取值，bound1 只允许 value0。

## 3. 来源顺序与完整 draw 合同

固定映射表为：

```text
sourceTopicTable = [4, 1, 7, 5, 2, 8, 6, 3, 9]
```

它按“小、中、大”分为三个连续组，每组内依次为“道理、故事、时节”。它不是数字牌码1..9的顺序。因此 bound3 的 value0 对小牌产生4，对中牌产生5，对大牌产生6；尾部 bound9 的 value0 产生4，不是1。

令 `n = rhetoricCards.length`、`selected = min(4, n)`、`fallback = 4 - selected`。安全分离和输入语法检查先于下列领域阶段：

| 顺序 | raw draw role | 次数 | bound | 写入或交换 |
|---:|---|---:|---:|---|
| 1 | `debate-deck-small-topic` | 8 | 3 | table[0..7] = sourceTopicTable[value] |
| 2 | `debate-deck-medium-topic` | 4 | 3 | table[8..11] = sourceTopicTable[3 + value] |
| 3 | `debate-deck-large-topic` | 2 | 3 | table[12..13] = sourceTopicTable[6 + value] |
| 4 | `debate-deck-rhetoric-swap` | n>0 时2000，否则0 | n | 依次交换 rhetoric[i % n] 与 rhetoric[value] |
| 5 | `debate-deck-tail-fallback` | fallback | 9 | 缺少话术的尾槽使用 sourceTopicTable[value] |
| 6 | `debate-deck-table-swap` | 2000 | 18 | 依次交换 table[i % 18] 与 table[value] |

第4和第6阶段中的 i 都从0重新开始，各自独立运行到1999。i 不是全局 drawIndex；第6阶段不能从已经消费的 draw 总数继续取模。第4阶段在 n=0 时完全跳过，不存在 bound0 draw、取模0或空数组交换。

第5阶段按尾槽14、15、16、17依次处理。先复制交换后话术数组的前 selected 项，再给剩余尾槽逐项消费 fallback draw。复制话术本身不消费 draw；不得为这 selected 项伪造 bound9 draw。第6阶段开始时18项均已填满，再执行全部2000次交换。

最终牌组包含 min(4,n) 张话术和18-min(4,n) 张普通牌。8小、4中、2大仅描述前14项的来源配额；n<4时尾部回填可能增加任意大小的普通牌，所以不能说整副牌始终“恰好8小4中2大”。

### 3.1 精确计数与阶段位置

```text
drawCount = 14 + (n > 0 ? 2000 : 0) + (4 - min(4, n)) + 2000
```

| n | 话术交换 | 尾部回填 | 全牌组交换 | 总 drawCount |
|---:|---:|---:|---:|---:|
| 0 | 0 | 4 | 2000 | 2018 |
| 1 | 2000 | 3 | 2000 | 4017 |
| 2 | 2000 | 2 | 2000 | 4016 |
| 3 | 2000 | 1 | 2000 | 4015 |
| 4 | 2000 | 0 | 2000 | 4014 |
| 5 | 2000 | 0 | 2000 | 4014 |

前三阶段始终占 rawDraws[0..13]。n=0 时尾部回填占[14..17]，全牌组交换占[18..2017]。n>0 时话术交换占[14..2013]，随后是 fallback 项，最后2000项为全牌组交换；没有回填时，全牌组交换从 drawIndex2014开始。

n=1 仍必须提供全部2000项 bound1/value0 的话术交换 draw。每次交换虽然同位、同值，却是来源实际存在的随机调用，不得因“结果没变”而省略。两个阶段中的其他同位交换或相等牌码交换同样保留消费与审计。

rawDraws 不是可供按需截取的长随机流。本次所需阶段、role、bound、顺序和项数都必须精确匹配；不得复用上一阶段 draw、填充缺失 draw，或默许末尾多余项。

### 3.2 完整话术状态与选择前四项

话术交换作用于长度 n 的完整私有数组，不是只洗前四项。n=5 时五张牌都参加2000次交换，然后只取交换结果的前四张加入牌组，剩余第五张仍保留在返回的完整话术状态中。

完整数组与选中前四项不能互相替代：如果调用者仅保存本副牌选中的四张，下一次明确构造输入时将改变 n、交换 bound、候选话术集合和可能的结果。本内核返回状态但不自动保存，不认证跨调用的资格或连续 RNG 来源。

### 3.3 不是均匀洗牌承诺

这里按来源进行固定2000次“当前位置取模 + 原始整数目标”的交换，不改写为 Fisher–Yates、随机排序或均匀选样。原始整数来自调用者，函数没有承诺它们独立、均匀或来自原生 PRNG。最终交换保留已生成的18项多重集，但文档与 receipt 不认证原作概率分布。

DeckGenerate 来源函数本身不重置游标。本接口没有 deckCursor 输入或输出，不把“生成新牌组”扩张成“重置游标到0”，也不执行来源外围填牌、初始化、再考或回合补牌流程。

## 4. 完整 receipt 与输出类型

### 4.1 前后状态、普通牌与尾槽

```ts
type DebateDeckGenerateBeforeV1 = {
  rhetoricCards: DebateDeckGenerateRhetoricCardCodeV1[];
};
type DebateDeckGenerateAfterV1 = {
  deck: DebateDeckGenerateDeckV1;
  rhetoricCards: DebateDeckGenerateRhetoricCardCodeV1[];
};
type DebateDeckGenerateTopicPlacementV1 = {
  size: 'small' | 'medium' | 'large';
  slot: number;
  tableIndex: number;
  card: DebateDeckGenerateTopicCardCodeV1;
  drawIndex: number;
};
type DebateDeckGenerateTailPlacementV1 =
  | {
      source: 'rhetoric';
      slot: number;
      rhetoricIndex: number;
      card: DebateDeckGenerateRhetoricCardCodeV1;
    }
  | {
      source: 'topic-fallback';
      slot: number;
      tableIndex: number;
      card: DebateDeckGenerateTopicCardCodeV1;
      drawIndex: number;
    };
```

before.rhetoricCards 保留输入原顺序；after.rhetoricCards 是完成整个话术交换阶段后的完整 n项数组，后续全牌组交换不会再次改变它。before 不含旧牌组或游标，因为本接口没有接收它们。

topicPlacements 恰好14项，按来源生成顺序排列。slot 是全牌组交换前的0-based位置0..13，tableIndex 指向固定九项映射表，drawIndex 指向完整 consumedDraws 的0-based位置。tableIndex 不是牌码，也不是最终牌组位置。

tailPlacements 恰好4项，按 slot14..17排列。source=rhetoric 时 rhetoricIndex 为交换后话术数组的0-based位置0..3，不是输入话术的原始位置，也不附加虚构 drawIndex。source=topic-fallback 时才有 drawIndex 和 tableIndex；这两个字段不会出现在话术复制分支中。

preShuffleDeck 是普通牌、话术复制和缺项回填全部结束后的18项完整快照，尚未执行2000次全牌组交换。after.deck 是全部全牌组交换后的结果。placement 中的 slot 不因最终交换而改写；要理解后续位置变化，应阅读 tableSwaps，而不是把原 slot 冒充最终下标。

### 4.2 每次交换，包括无操作交换

```ts
type DebateDeckGenerateSwapV1 = {
  iteration: number;
  drawIndex: number;
  leftIndex: number;
  rightIndex: number;
  leftBefore: DebateDeckGenerateCardCodeV1;
  rightBefore: DebateDeckGenerateCardCodeV1;
  leftAfter: DebateDeckGenerateCardCodeV1;
  rightAfter: DebateDeckGenerateCardCodeV1;
};
```

rhetoricSwaps 在 n=0 时为空，否则有2000项；tableSwaps 始终有2000项。两组分别按 iteration0..1999排列。drawIndex 则一直使用整个 consumedDraws 的全局下标，不随阶段归零。

leftIndex 分别为 iteration%n、iteration%18；rightIndex 等于相应 draw 的 value。leftBefore 和 rightBefore 均在两次写入之前读取，leftAfter/rightAfter 则为该次交换完成后的对应值。同位交换的两个 before 值及两个 after 值相同，但整项仍保留。同值异位交换也保留两个不同下标。

Swap 的公开牌码类型涵盖1..14；在 rhetoricSwaps 中实际值仍仅为10..14。审计跟踪数值、位置与交换顺序，不给相同普通牌码创造永久 occurrence 身份，也没有原生卡牌 token 或跨 session 身份承诺。

### 4.3 完整结构与消费统计

```ts
type DebateDeckGenerateDrawCountsV1 = {
  smallTopic: 8;
  mediumTopic: 4;
  largeTopic: 2;
  rhetoricSwap: 0 | 2000;
  tailFallback: number;
  tableSwap: 2000;
  total: number;
};
type DebateDeckGenerateReceiptV1 = {
  schemaVersion: 1;
  profile: 'debate-deck-generate-reference-v1';
  policy: DebateDeckGeneratePolicyV1;
  evidence: DebateDeckGenerateEvidenceV1;
  before: DebateDeckGenerateBeforeV1;
  after: DebateDeckGenerateAfterV1;
  rhetoricCardCount: number;
  topicPlacements: DebateDeckGenerateTopicPlacementV1[];
  rhetoricSwaps: DebateDeckGenerateSwapV1[];
  tailPlacements: DebateDeckGenerateTailPlacementV1[];
  preShuffleDeck: DebateDeckGenerateDeckV1;
  tableSwaps: DebateDeckGenerateSwapV1[];
  consumedDraws: DebateDeckGenerateRawDrawV1[];
  drawCounts: DebateDeckGenerateDrawCountsV1;
  cursorEffect: 'not-read-or-written';
};
type DebateDeckGenerateFailureV1 = {
  ok: false;
  reason: DebateDeckGenerateFailureReasonV1;
};
type DebateDeckGenerateResultV1 =
  | {
      ok: true;
      deck: DebateDeckGenerateDeckV1;
      rhetoricCards: DebateDeckGenerateRhetoricCardCodeV1[];
      receipt: DebateDeckGenerateReceiptV1;
    }
  | DebateDeckGenerateFailureV1;
```

rhetoricCardCount 恒等于 before/after.rhetoricCards 的长度，不是进入牌组的话术数量。drawCounts.tailFallback 恒为4-min(4,n)，total 恒等于 consumedDraws.length，也等于六阶段计数之和。这里没有名为 receipt.drawCount 的单独字段；总数的正式位置是 receipt.drawCounts.total。

consumedDraws 包含全部实际消费的原始整数记录，按来源顺序排列，不压缩自交换或重复数值。成功时其值序列与整个输入 rawDraws 相同；失败不发布其前缀。receipt.policy 用单数，与输入 policies 区分。

cursorEffect 固定为 not-read-or-written，表示本函数没有游标动作，而不是承诺“原来为0”或“成功后为0”。receipt 解释本次给定数据的确定性求值，不是存档、session replay、输入来源认证或 PRNG 状态证明。

## 5. 固定政策与证据

`DebateDeckGeneratePolicyV1` 与 `DebateDeckGenerateEvidenceV1` 分别是源码固定 POLICY 与 EVIDENCE 对象的递归 readonly 类型，不是可自由扩展的配置 map。完整字面值见[来源账本](../sources/debate-deck-generate-v1.json)和[实现源码](../../packages/engine/src/debate-deck-generate.ts)。输入只有 policies，没有调用者 evidence；输出证据由内核自己附加，不能由请求升级来源层级。

policy id=`debate-deck-generate-supplied-draws-policy-v1`，profile=`debate-deck-generate-reference-v1`。其顶层键为 `id,profile,cards,rhetoric,topicFill,rhetoricShuffle,tailFill,tableShuffle,randomness,audit,capacity,boundary`。完整对象逐字段匹配，不仅比较 id；对象键顺序不影响匹配，但数组的值和顺序有意义。

主要固定条目为：

- cards 指定现代数值表示、topicTable=`[4,1,7,5,2,8,6,3,9]`、rhetoricFirst/Last10/14、rethinkExcluded=true。
- rhetoric 指定 `input=active-unique-ordered-subset`、minCount0/maxCount5、`inactiveSourceSlots=excluded`、`initialOrder=preserved-until-source-swaps`、`mutatedOrder=returned-for-subsequent-generation`。不接受来源5项容量中的未激活占位槽。
- topicFill 的 small/medium/large 分别固定 count8/4/2、startSlot0/8/12、tableOffset0/3/6、对应 role 和 bound3。
- rhetoricShuffle 指定 count-nonzero、iterations2000、左索引 iteration-modulo-rhetoric-count、右索引 supplied-raw-value、bound=rhetoric-count；boundOneDraws=2000，selfSwapsConsumeDraw=true。
- tailFill 指定 startSlot14/count4，只取交换后话术的前 min(4,n) 项；fallback 固定按 topic-table-at-supplied-raw-value，不是1+raw-value。
- tableShuffle 固定 deckSize18、iterations2000、左索引 iteration-modulo-eighteen、右索引 supplied-raw-value、bound18；selfSwapsConsumeDraw=true、uniformDistributionClaim=false。
- randomness 指定 caller-supplied-draws、all-syntax-first-then-phase-role-bound-value、完整六阶段顺序、drawCountsByRhetoricCount=`[2018,4017,4016,4015,4014,4014]`；missingExtraOrInvalid=atomic-rejection、externalRngConsumed=0、nativePrng=false。
- audit 要求每次 topic/tail 放牌、两个阶段的每次交换和完整 consumedDraws；同位交换不省略，记录 before、pre-table-shuffle 与最终状态。
- capacity 固定20000输入值节点、深度12、通用数组4096、393216 canonical UTF-8 bytes、最多4017已消费 draw、最多4000交换记录。
- boundary 指定 independent-deck-generate-kernel；deckCursor 不接受、不读、不写、不重置；deckInit、人物/书籍/资格推导均排除，sessionIntegration、persistence、legacyProfilesChanged 均为 false。

固定来源为现代 C# 转录仓库 `tankyc/sango_infinity`，commit `a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef`。Debate.cs blob 为 `0137498d10773cd4596d497083ccdf6a26b3a261`，DebateEnum.cs blob 为 `5b46a8ac87613193eb9f4b99a25e489ba6f5e483`。证据范围为：

- [Debate.cs 54–119](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L54-L119)：DeckTableSize=18；103–119的 Deck 中，牌组、游标、话术容量与激活数量是不同状态。
- [Debate.cs 306–340](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L306-L340)：本内核的唯一生成机制范围；308–313映射表、314–322分组话题牌、323–328完整激活话术交换、329–336尾部、337–339全牌组交换。
- [Debate.cs 537–551](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L537-L551)：外围 DeckInit 的人物/书籍/话术资格处理只作为排除边界，不在此函数中执行。
- [DebateEnum.cs 33–61](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/DebateEnum.cs#L33-L61)：现代再考0、普通牌1..9与话术10..14。

独立输入、唯一有序话术子集、调用者供 draw、严格错误、安全分离、预算、不可变输出与详细审计都是工程合同。它们不是原作 JSON 接口、原生 RNG、人物/书籍行为或二进制状态布局的认证。

`nativeEquivalent`、`stockOriginalVerified`、`pkEquivalent`、`vanillaEquivalent`、`completeDebate` 均保持 false。来源不升级成原始头文件、PC-PK/PK1.1、Vanilla 或主机二进制证据；43个原证据主题／45个历史快照仍开放且数量不变，nativeWholeChain=open、P078=excluded，不扩张 E15 既有普通通用核心的证据范围。

## 6. 错误、安全分离与预算

### 6.1 全部失败原因

`DebateDeckGenerateFailureReasonV1` 是以下10个字面值的封闭联合：

| reason | 条件 |
|---|---|
| `unsupported-runtime` | 安全 Proxy 检测所需内建入口不可用，拒绝不安全降级 |
| `input-limit` | 安全分离的值节点数、深度、通用数组长度或字节预算超限 |
| `malformed-data` | 非法 JSON 式数据、必需字段缺失、非法属性结构、数值不是安全整数或为 −0；rawDraws 不是数组，或 draw 字段的语法类型不符 |
| `unknown-field` | 输入顶层或 raw draw 对象出现未登记键；完整 policies 的安全值差异按 unsupported-policy 处理 |
| `unsupported-profile` | schemaVersion 或 profile 不等于固定值 |
| `unsupported-policy` | 完整 policies 不匹配固定政策，不只比较 id |
| `invalid-rhetoric-cards` | 已安全分离的 rhetoricCards 不是数组、长度超过5、含重复值，或元素不是10..14的数值牌码 |
| `missing-raw-draw` | 到达需要消费的来源步骤，但 rawDraws 已无下一项 |
| `unexpected-raw-draw` | 全部来源步骤已正常完成，仍有未消费的 rawDraws 项 |
| `invalid-raw-draw` | 当前消费位置的 role、bound 或 value 范围不符合该来源步骤 |

没有独立 unsupported-card-code、deck-exhausted、部分成功或 fallback 成功值。非法话术码和重复话术统一使用 invalid-rhetoric-cards；但在安全分离阶段就发现的分数、NaN、Infinity、−0或不安全对象结构仍先归 malformed-data，不被降成领域范围错误。未归类的内部异常也归为 malformed-data，不附带调用者数据或半成品。

### 6.2 语法先行，语义按来源消费

处理顺序是：安全分离全部输入；检查顶层必需键、profile、完整 policies、rhetoricCards；检查 rawDraws 是数组并逐项读取全部 draw 的对象形状与字段语法；最后按第3节的来源阶段消费。

draw.role 必须是字符串，bound/value 必须是安全整数。字段语法不符为 malformed-data；角色字符串错误、整数 bound 不符或 value 越界则在实际消费该位置时为 invalid-raw-draw。不会把后者提前解释为缺 draw，也不会从错误角色继续搜索“下一项匹配的 draw”。

rawDraws 中每项都先接受安全与语法检查，包括多余末尾项。因此“尚未用到”不能隐藏 getter、Proxy、未知键或非法字段类型。完整固定政策内部的安全数据结构虽也接受分离，但它的键值差异统一通过完整政策比较拒绝。

缺少与多余的语义检查不是只比较总长度：

- 下一来源步骤需要 draw 而列表已经结束，返回 missing-raw-draw。
- 在列表结束前先遇到错误 role/bound/value，返回 invalid-raw-draw，不等到末尾才报告缺少。
- 全部规定来源步骤均正常完成，才检查是否有剩余项并返回 unexpected-raw-draw。
- 末尾多余项如有非法语法，仍在来源步骤之前被拒绝；语法合法但不会被消费的多余项不再作为某个新来源阶段检查。

这些说明不承诺所有同时包含多种结构错误的恶意输入都有额外的统一优先级。失败始终原子拒绝：即使已经在私有候选中完成若干交换，也不公开部分牌组、话术状态或审计，更不修改调用者输入。

### 6.3 允许的数据和固定资源上限

仅接收 Object.prototype 或 null 原型的 record、标准 Array，以及允许的 JSON 式标量。record 字段必须为可枚举数据属性；数组必须稠密、索引完整且没有额外属性。可接受已冻结的普通输入，但不会冻结调用者输入。

拒绝 Proxy、getter/setter、函数、undefined、BigInt、Symbol、Date、自定义原型、循环引用、稀疏数组、非枚举 record 字段和不安全数字。不会调用调用者 getter、toJSON 或自定义 iterator。所有可接受数值均须是安全整数且不是 −0，不只是 draw 的 bound/value。

Proxy 检测依赖 `process.getBuiltinModule('node:util').types.isProxy`；不能取得该安全检测入口时返回 unsupported-runtime，不尝试无检测降级。此运行时要求是合同的一部分，不表示本批已运行或验证某个 Node、浏览器或产品环境。

| 项目 | 固定上限或范围 |
|---|---:|
| rhetoricCards | 0..5项，10..14且互不重复 |
| 输出 deck / preShuffleDeck | 恰好18项 |
| 安全分离输入值节点数 | 20000 |
| 嵌套深度，根为0 | 12 |
| 通用输入数组长度 | 4096 |
| 输入 canonical UTF-8 字节数 | 393216 |
| 实际消费 draw | 最大4017 |
| 交换审计合计 | 最大4000 |
| topicPlacements / tailPlacements | 恰好14 / 4项 |

字节限制既在分离时累计检查键与字符串，也对分离后完整 canonical JSON 的 UTF-8 字节数检查；预算包含完整 policies。对象 canonical 顺序按键排序，数组顺序保持不变。

通用数组4096只是安全预算，不替代领域约束：话术数组仍最多5项，draw 数量仍由 n和六阶段精确决定。输出审计由内核构造，不接受调用者注入任意 receipt、swap、placement 或 evidence。这些上限只覆盖本独立输入与审计，不是 session 保存、历史或通用回放预算。

其中20000节点、深度12、通用数组4096和393216字节只约束传入 input 的安全分离，不作为返回 result/receipt 的统一封装预算。成功结果允许同时保留最多4000条完整交换记录、4017条 consumedDraws、放牌记录与快照；不能因这些输出合计大于输入节点或字节额度而删减审计。输出自身由固定阶段和最多5张话术的领域界限定长，不意味着用户可把完整 receipt 当作下一次 input 提交。

## 7. 纸面示例，不是运行结果

[案例文件](../../data/scenarios/debate-deck-generate-example-v1.json)的 input 保留一份完整直接 API 输入，完整 policies 和每一项 rawDraws 都已明列。paperExpected、paperDerivation、phaseDrawRanges 和其他 compact recipe 是人工阅读辅助，不是输入字段或真实执行产生的 receipt。不得把整个外层案例对象传给 API，也不能把 compact recipe 当成可接受的压缩 draw 格式。

以下所有值均为**手工推导、未运行**，不是通过测试、候选输出或原生样本。

### 7.1 五张话术：完整交换、只取前四项

完整案例输入话术为 `[10,11,12,13,14]`。前14次话题 draw 全为0，按固定映射产生8张4、4张5、2张6。

话术交换第0次右下标取4，先交换位置0与4；其余1999次右下标都等于各自 iteration%5，均为同位交换。完整返回话术因而为 `[14,11,12,13,10]`。尾槽只复制 `[14,11,12,13]`，没有 fallback draw，但10仍留在完整话术状态中。

全牌组交换前的 preShuffleDeck 为：

```text
[4,4,4,4,4,4,4,4,5,5,5,5,6,6,14,11,12,13]
```

全牌组交换第0次右下标取17，交换位置0与17；其余1999次右下标等于各自 iteration%18。最终纸面预期牌组为：

```text
[13,4,4,4,4,4,4,4,5,5,5,5,6,6,14,11,12,4]
```

对应首次话术 swap 的 iteration=0、drawIndex=14、leftIndex=0、rightIndex=4、leftBefore=10、rightBefore=14、leftAfter=14、rightAfter=10。首次全牌组 swap 的 iteration=0、drawIndex=2014、leftIndex=0、rightIndex=17、leftBefore=4、rightBefore=13、leftAfter=13、rightAfter=4。

总消费4014项；rhetoricSwaps 和 tableSwaps 各2000项。最后一项 table swap 的 iteration=1999、drawIndex=4013、leftIndex=1，不能把全局 drawIndex4013取模18当作来源左下标。

### 7.2 零张话术：四次查表回填

独立 compact recipe 使用空话术数组；前14次话题 value0，尾部 value依次为 `[0,1,2,8]`，全牌组交换全部为同位交换。

尾部因而得到 `[4,1,7,9]`，不是 `[1,2,3,9]`。完整纸面预期为 `[4,4,4,4,4,4,4,4,5,5,5,5,6,6,4,1,7,9]`，话术仍为空，总消费2018项，其中话术交换0项、回填4项、全牌组交换2000项。

### 7.3 一张话术：保留全部 bound1 调用

独立 compact recipe 输入 `[12]`；前14次话题 value0，话术阶段完整提供2000项 bound1/value0，尾部回填 value依次为 `[0,1,2]`，全牌组交换全部同位。

尾部为 `[12,4,1,7]`，完整纸面预期为 `[4,4,4,4,4,4,4,4,5,5,5,5,6,6,12,4,1,7]`；完整话术仍为 `[12]`。总消费4017项，不能省略没有改变值的2000项话术调用。

### 7.4 显式采用交换后话术的另一次输入

另一个独立 compact recipe 明确提供 `[14,11,12,13,10]`，话题 value全0、两个交换阶段全部同位，尾部仍取 `[14,11,12,13]`，总消费4014项。它说明下一次调用为什么需要保留完整交换后状态，不代表已有隐式 session、自动安装新牌组或连续 RNG。

### 7.5 独立拒绝候选

案例文件中的拒绝 recipe 均独立修改完整 input，不与上述案例串成执行历史：

- 删掉最后一项 draw：missing-raw-draw；不返回此前已经交换的候选。
- 完整有效来源序列末尾追加一项语法合法 draw：unexpected-raw-draw。
- 第一项话术交换的 bound从5改为4：invalid-raw-draw。
- 第一项全牌组交换的 value从17改为18：invalid-raw-draw。
- 输入话术改成 `[10,10]`：invalid-rhetoric-cards。
- 顶层新增 deckCursor:18：unknown-field；不暗中解释为成功后清0。

这些预期也是纸面推导，没有执行失败候选。案例文件中的 paperExpected.drawCount 是人工摘要字段；正式成功 receipt 使用 drawCounts.total，不能把摘要格式当作完整输出 DTO。

## 8. 接入与未执行声明

只有 ok:true 时调用者才可采用返回的新牌组与完整话术数组；失败不提供可提交的部分状态。rawDraws 只是数据：本函数不会推进或回滚调用者自行管理的 RNG，也不会保存本次结果。当前返回值之间不存在自动的 session、牌组编号、下一次调用或游标连接。

本内核没有 create、inspect、preview、execute-round、save、load、replay 或 session 适配器。它不接纳旧牌组/游标，不执行 DeckInit、不补手牌、不修补话题、不排序手牌、不授予再考、不计算人物资格，不处理人物、书籍、物品、行为表或 MOD hook。

教程、四性格愤激、自动反制、额外消耗、连打与 timer、冷静愤激的再考恢复和大牌覆写、开场一击决胜、追击/留情/负伤、完整终局、campaign、外交自动结算继续排除。P078/native 人员任务及全部依赖、俘虏/处斩/归属、return/mission 同样排除。

旧八个 session 与已有独立内核不变，尤其 PR112 和旧 hand-fill 遇到第19项当前牌组需求时仍维持 unsupported-deck-regeneration；旧 Rethink 的 unsupported-topic-repair 也不因本模块改变。生成器的存在不构成任何旧 profile 的升级授权。

本批仅做静态文本编辑、阅读既有固定源码与纸面推导。没有运行测试、typecheck、编译器、build、checker、validator、diagnostics、候选 API、项目、产品、来源代码或 replay；没有用历史通过记录替代本批验证。文档与新导出不表示已验证运行时兼容性、通过验收、发布或合并。
