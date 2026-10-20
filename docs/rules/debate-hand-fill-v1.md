# 独立舌战补满手牌内核 v1

日期：2026-10-20。实现：[debate-hand-fill.ts](../../packages/engine/src/debate-hand-fill.ts) · [API 与错误契约](../engine/debate-hand-fill-v1.md) · [完整政策与固定来源](../sources/debate-hand-fill-v1.json) · [纸面案例，未运行](../../data/scenarios/debate-hand-fill-example-v1.json)。

本模块只求值固定现代参考中的 `CharacterFillCards` 局部语义：恢复再考保留槽、依原槽位补空、在限定条件下修补一张普通话题牌、按数值排序。它是提供式当前牌堆和至多一个提供式抽样上的纯函数，不是舌战 session、再考命令、发牌器、原生 RNG 或完整舌战规则。

固定 profile 为 `debate-hand-fill-reference-v1`。唯一公开求值函数为 `evaluateDebateHandFill`，固定常量为 `DEBATE_HAND_FILL_POLICY_V1` 与 `DEBATE_HAND_FILL_EVIDENCE_V1`，公开类型为 `DebateHandFill*V1` 族。没有创建、预览、执行、保存、载入或 replay session 的第二套函数。

## 1. 来源身份与证据等级

唯一算法依据是 `tankyc/sango_infinity` 的现代 C# 参考，固定 commit 为 `a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef`。本批静态阅读既有固定参考文本；以下身份沿用既有来源账本的记录，不声称重新下载、重新哈希、执行或认证原生代码。

| 文件 | blob | 字节数 | SHA-256 |
|---|---|---:|---|
| [Debate.cs](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs) | `0137498d10773cd4596d497083ccdf6a26b3a261` | 71288 | `622789ca8b8b6799a321526dcfb513d6622adf5b5d54025175c2a7795ef7da28` |
| [DebateEnum.cs](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/DebateEnum.cs) | `5b46a8ac87613193eb9f4b99a25e489ba6f5e483` | 8447 | `cd71efed5059fb4ca876091b1e39bd34636fb978c8ec9bfbf924d6a443070bc1` |

### 1.1 逐段归因

| 固定位置 | 支持的陈述 | 不能外推的陈述 |
|---|---|---|
| [Debate.cs 53–57](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L53-L57) | `DeckTableSize=18`，来源手牌数组上限为7 | 不证明提供的18项符合来源生成概率或是某次真实牌堆 |
| [343–354](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L343-L354) | 正常存活人物的总槽数为4/5/6/7；扣除保留槽后为3/4/5/6 | 内核不读取人物、存活状态、INT或装备，也不重算容量 |
| [406–410](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L406-L410) | 排序范围是从0开始的完整 `maxCardCount` 个数值槽 | 不保证同值牌身份的稳定顺序；稳定 provenance 是工程审计政策 |
| [413–420](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L413-L420) | 先恢复 `card[0]=0`；`last=-1`；按原槽1到末槽扫描，仅填来源值为−1的空位 | `null` 空位表示及纯函数 DTO 属工程映射，不是 C# 存储格式 |
| [421–427](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L421-L427) | 来源在需要越过牌堆末端时生成新牌堆并重置游标；每次取牌后推进游标，记录最后填入的原槽 | 内核不实现 `DeckGenerate`，不循环、不拼接下一副牌堆，越界需求原子拒绝 |
| [429–437](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L429-L437) | 填完后统计普通话题牌；只有数量为0且 `last>=0` 才把最后新增原槽替换为 `TopicFirst+RandInt(9)` | 不是“所有全话术手牌都修补”；不是覆盖排序后末牌；不多取一张牌堆牌 |
| [438](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L438) | 补牌与可选修补之后才排序 | 不能先排序再选择修补槽 |
| [DebateEnum.cs 1–20](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/DebateEnum.cs#L1-L20) | 文件自述为现代翻译，部分枚举由实现归纳 | 不是原始头文件或原生二进制认证 |
| [33–61](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/DebateEnum.cs#L33-L61) | 再考为0，普通牌为1..9，五话术为10..14；普通牌范围给出修补基数1和 bound9 | 不扩展为 PK、Vanilla 或主机原生 enum 等价 |

本批不采用 `DeckGenerate` 的生成或洗牌语义。其[306–340](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L306-L340)只用于界定排除范围：提供18张当前牌堆不是重新实现来源的牌种分布、话术库存或洗牌随机过程。

## 2. 数值牌与输入边界

输入手牌只含3..6个可出牌槽，不含保留槽0。每个元素为1..14的整数牌码或表示空位的 `null`。输入数组位置0对应来源原槽1，位置1对应来源原槽2，依此类推。−1仅是来源内部空位哨兵，不是本 API 的合法牌码；0只由内核恢复到输出保留槽，不能作为 playable 或牌堆输入。

| 牌码 | 来源枚举 |
|---:|---|
| 0 | Rethink，再考保留槽 |
| 1 / 2 / 3 | Story1 / Story2 / Story3，故事小/中/大 |
| 4 / 5 / 6 | Logic1 / Logic2 / Logic3，道理小/中/大 |
| 7 / 8 / 9 | Trend1 / Trend2 / Trend3，时节小/中/大 |
| 10 / 11 / 12 / 13 / 14 | Shout / Sophistry / Ignore / Compose / Agitate |

`cardTape` 必须恰好包含18个1..14整数，表示一个已经提供的当前牌堆；游标范围为0..18，表示下一项的0-based位置。已经经过的前缀和本次不取用的后缀仍属于严格输入，不能包含非法值。此 DTO 不接受任意长度的连续未来发牌流，也不声称这18项按来源生成程序可达。

手牌容量由调用者直接给定。这里不通过真实武将、INT、能力 hook 或 session 状态推导容量，也不证明输入手牌与牌堆组合能从某个完整对局到达。

每次调用必须携带 `schemaVersion:1`、上述固定 `profile` 和完整 `policies`，不只提交版本 ID。`rawDraws` 字段必需：无需修补时为 `[]`；来源修补条件成立时，恰好为 `[{role:'debate-fill-topic-repair',bound:9,value:0..8}]`。抽样的消费是条件式的，字段本身不是可省略的选项。不接收 seed、随机回调或额外抽样流。完整字段名、严格形状与错误优先级见 [API](../engine/debate-hand-fill-v1.md)，完整政策和证据常量见 [来源账本](../sources/debate-hand-fill-v1.json)。

## 3. 严格的来源顺序

一次成功求值依次进行：

1. 建立独立候选数据，把保留原槽0恢复为再考码0，令最后新增原槽为不存在。
2. 按原槽1..n升序扫描。保留非空槽，空位依次取 `cardTape` 当前游标的牌并推进游标，更新最后新增原槽。
3. 完整填牌后，在全部可出槽中统计1..9普通牌，不能只统计新取的牌。
4. 仅当普通牌为0且本次至少填过一个槽时，消费唯一提供式 bound9 抽样，把**最后新增的原槽**改成 `1+value`。这是覆盖本次刚抽到的一张牌，不是再次取牌，不再推进牌堆游标。
5. 按所有槽的数字牌码升序排序，包含保留0槽。审计信息仍能区分原槽、牌堆来源、修补替换与排序后位置。

来源 `last` 是最后填入的原槽，不是最后一张话术、当前最大牌码、排序后末槽或最后保留牌。先排序再修补会改变规则，不能替代上述顺序。回执中该值为 `lastNewSlot`，没有新增时为 `null`；原槽使用 `preSortSlot`，排序后位置使用 `sortedIndex`，两者均将保留槽记为0。

### 3.1 三个必须区分的无修补分支

- 保留手牌本来有普通牌：即使所有新增牌都是话术，也不修补、不取修补抽样。
- 新增牌至少有一张普通牌：不修补、不取修补抽样。
- 已满且全部为话术：`last=-1`，所以仍不修补、不取抽样；输出仅恢复0并排序，普通牌数量允许保持0。

因此，本内核的结论不是“每次调用后的手牌必有普通牌”，而是“本次填过空位且填完后仍无普通牌时，修补最后新增槽”。多余提供的抽样不能被静默丢弃。

### 3.2 18项当前牌堆边界

若本次空位数超过 `18-cursor`，来源将到达 `DeckGenerate` 分支。本内核返回 `unsupported-deck-regeneration`，不生成、拼接、回绕或复用牌堆，也不先提交能填的那部分。

恰好用完第18项可成功，成功后的游标可以为18。游标已经为18但本次无空位也可成功，因为没有访问新牌堆的需求。该满手情形仍执行恢复0、普通牌统计和排序；若满手全话术，仍因没有新增槽而不修补。

修补抽样不是第19张牌，不会缓解不足以填满的牌堆。不能在尚未填满时先生成普通牌、借修补替代缺少的牌堆项，或借“最终可能无需修补”跳过需要新牌堆的边界。

## 4. 数值排序与身份审计

来源调用 `Array.Sort(self.card, 0, self.maxCardCount)`。本内核采用完整槽的数值升序；因为0小于1..14，保留再考在成功排序后位于位置0。

同值牌之间保持原槽顺序是**明确的工程审计政策**，用于让重复牌的 provenance 确定且可阅读。它不声称 C# `Array.Sort` 对卡牌身份稳定，也不构造来源未保存的物理牌 ID。输入保留牌来源是原槽，新取牌来源是当前牌堆索引；被修补者仍记录其原槽和被覆盖的抽牌来源，不能把 `1+value` 伪装成牌堆原牌。

`filled` 按原槽升序保留本次取牌时的牌码和 `tapeIndex`，即使这张牌随后被修补；`postFillHand` 是修补前的完整数值手牌，`preSortHand` 是修补后、排序前的完整数值手牌。`sortedProvenance` 中 `originalCard` 为修补前牌码，`card` 为最终牌码，`topicRepairApplied` 标记替换，`origin` 区分 `reserved-rethink`、`retained`、`tape`。修补不创造额外的 tape 来源。

排序后位置只描述本次结果。它不是跨调用永久 token，也不能直接替代旧 session 的 occurrence、choice token 或存档身份。

## 5. 纯函数、原子失败与非集成边界

所有工作发生在本次私有候选数据中。成功返回完整结果，失败不返回可提交的部分手牌、部分游标或半段修补审计；输入手牌、牌堆、政策和抽样对象不修改。输入或输出的严格数据形状、脱离外部引用及冻结细节由 [API](../engine/debate-hand-fill-v1.md) 约束。

本内核不持有 session，不写 HP、stress、angerTimer、canRethink、崩坏层、当前话题、先手、回合、历史或 campaign 状态；不创建、载入、保存或 replay session。0号再考只是恢复的保留数值槽，不是获准执行一次再考，也不表示许可 true。

新函数与此前七个 session profile 相互独立。没有调用替换、自动升级、桥接、存档迁移或 token 转换。尤其既有 Rethink session 仍保留自己的 `unsupported-topic-repair` 接纳边界：本独立内核接纳提供式 bound9 修补，并不让旧 Rethink profile 自动支持该修补，也不改变其提供式牌带政策。

## 6. 纸面分支与非运行示例

[纸面案例](../../data/scenarios/debate-hand-fill-example-v1.json)使用完整18项当前牌堆。以下是手工推导，不是执行回执或通过的测试：

| 场景 | 关键输入 | 纸面结果 |
|---|---|---|
| 单空位修补 | 原可出槽 `[12,null,14]`，cursor5的牌为10，draw4 | 最后新增原槽2被改为5；排序 `[0,5,12,14]`，cursor6 |
| 多空位修补 | `[null,11,null,13]`，cursor0起牌为14、10，draw8 | 先填原槽1和3；只修补原槽3为9；排序 `[0,9,11,13,14]`，cursor2 |
| 保留普通牌且恰好用完 | `[9,null,10]`，cursor17的牌为12，无 draw | 保留9使修补跳过；排序 `[0,9,10,12]`，cursor18 |
| 满手全话术且已到牌堆末端 | `[14,10,12]`，cursor18，无 draw | 无新槽也无牌堆访问；排序 `[0,10,12,14]`，cursor18，修补原因 `no-new-slot` |
| 同值身份审计 | `[null,10,10]`，cursor0的牌为10，draw0 | 原槽1修补为1；排序 `[0,1,10,10]`；同值10的审计按原槽2再3，工程政策而非来源身份保证 |

仍需拒绝的纸面边界包括：需要修补但没有 raw draw，返回 `missing-raw-draw`；不需要修补却多给 draw，返回 `unexpected-raw-draw`；仅提供17项当前牌堆，返回 `invalid-card-tape`；以及 `[null,9,null]` 在cursor17只剩一项时的 `unsupported-deck-regeneration`。最后一种情形即使保留9能避免话题修补，也不能避免填牌所需的新牌堆。完整错误优先级以 [API](../engine/debate-hand-fill-v1.md) 为准。

## 7. 尚未支持与交付口径

不支持来源 `DeckGenerate`、洗牌、概率或原生 PRNG；不采样、不调用全局 RNG，也不认证提供抽样的均匀性或真实来源。提供数值仅复现局部 `1+draw` 映射，不等于完整原作随机链。

不实现教程、四性格愤激、自动反制或额外消耗、连打与 timer、冷静愤激的再考恢复和大牌覆写、真实人物/书籍/MOD hook、开场一击决胜、攻击/反射/Effect、追击/留情/负伤、结局和 campaign 写入。P078/native 人员任务及其依赖、俘虏/处斩/归属、return/mission、外交自动结算完全不在范围内。

`nativeEquivalent:false`、`stockOriginalVerified:false`、`pkEquivalent:false`、`vanillaEquivalent:false`、`completeDebate:false`。现代 C# 文本不能认证 PC-PK/PK1.1、Vanilla 或主机二进制；既有 E15 普通公式证据不扩张到本补牌/随机/排序内核。原43证据主题与45历史快照继续开放，数量不减，不宣称舌战全链或原始证据缺口关闭。

基线为 PR110 main `5c4913c3d747f76be431e8c460c0bf50fa61b51c`。本批仅静态源码和文档阅读、文本编写及纸面推导；不执行候选代码、不运行测试、typecheck、编译器、build、validator、diagnostics、产品或 replay。纸面案例不能称为通过的测试、运行回执或可用性验证。
