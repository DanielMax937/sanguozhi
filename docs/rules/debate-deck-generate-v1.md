# 独立舌战牌堆生成内核 v1

日期：2026-10-21。实现：[debate-deck-generate.ts](../../packages/engine/src/debate-deck-generate.ts) · [API 与错误契约](../engine/debate-deck-generate-v1.md) · [完整政策与固定来源](../sources/debate-deck-generate-v1.json) · [纸面案例，未运行](../../data/scenarios/debate-deck-generate-example-v1.json)。

本模块只求值固定现代参考 `DeckGenerate` 的局部语义：从调用者提供的有序话术库存和逐次抽样，生成18项数值牌堆，并返回来源交换后保留下来的话术顺序。它是独立、确定、提供式抽样的纯函数，不是新 session、既有 session 的自动升级、原生 PRNG、真实人物牌堆初始化或完整舌战。

固定 profile 为 `debate-deck-generate-reference-v1`。唯一公开求值函数为 `evaluateDebateDeckGenerate`，固定常量为 `DEBATE_DECK_GENERATE_POLICY_V1` 与 `DEBATE_DECK_GENERATE_EVIDENCE_V1`，公开类型为 `DebateDeckGenerate*V1` 族。本批不新增创建、预览、执行、保存、载入或 replay session 的函数。

## 1. 来源身份与证据等级

唯一算法依据是 `tankyc/sango_infinity` 的现代 C# 参考，固定 commit 为 `a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef`。本批静态阅读既有固定参考文本；以下身份沿用此前来源账本的记录，不声称重新下载、重新哈希、运行或认证原生代码。

| 文件 | blob | 字节数 | SHA-256 |
|---|---|---:|---|
| [Debate.cs](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs) | `0137498d10773cd4596d497083ccdf6a26b3a261` | 71288 | `622789ca8b8b6799a321526dcfb513d6622adf5b5d54025175c2a7795ef7da28` |
| [DebateEnum.cs](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/DebateEnum.cs) | `5b46a8ac87613193eb9f4b99a25e489ba6f5e483` | 8447 | `cd71efed5059fb4ca876091b1e39bd34636fb978c8ec9bfbf924d6a443070bc1` |

### 1.1 逐段归因

| 固定位置 | 支持的陈述 | 不能外推的陈述 |
|---|---|---|
| [Debate.cs 53–54](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L53-L54) | 牌堆长度为18 | 不等于无限连续发牌流 |
| [103–119](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L103-L119) | `table`、`index`、`rhetoricCard` 与话术数量是不同字段；话术数组持有可持续的顺序 | 本 API 不创建来源对象或接纳游标；不模拟字段初始化器 |
| [306–313](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L306-L313) | 映射表为 `[4,1,7,5,2,8,6,3,9]` | 不能改为数值升序 `[1,2,3,4,5,6,7,8,9]` |
| [314–322](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L314-L322) | 按顺序先8张小牌、再4张中牌、再2张大牌，每张均取一次 bound3 抽样 | 不保证三种话题数量均衡；尾部回退可能再增加任一大小的普通牌 |
| [323–328](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L323-L328) | 话术数非0时恰好2000次交换，左下标为 `i%n`，右下标来自 bound n 抽样 | n=1也有2000次调用；不是 Fisher–Yates，也不认证均匀随机排列 |
| [329–336](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L329-L336) | 4个尾槽依次取交换后话术数组的前 `min(4,n)` 项；不足项用映射表的 bound9 抽样补足 | 第5种话术不直接进入本副牌，但不能从返回库存丢掉；回退不是 `1+draw` |
| [337–340](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L337-L340) | 完整18项牌堆再做2000次交换，左下标为 `i%18`，右下标来自 bound18 抽样；方法内没有游标赋值 | 不能“顺便”把游标清0或认证最终排列的均匀性 |
| [421–426](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L421-L426) | 补手牌调用者在需要新牌堆时先 `DeckGenerate`，随后另行设置 `index=0` | 该调用编排没有被本纯函数或既有 session 接入 |
| [537–550](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L537-L550) | `DeckInit` 通过人物、书籍/业务 hook 与行为修改决定初始话术，再调用生成方法 | 提供库存不证明其属于某武将；不实现 `DeckInit`、真实书籍、人物能力或 MOD hook |
| [DebateEnum.cs 1–20](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/DebateEnum.cs#L1-L20) | 文件自述为现代翻译，部分枚举由实现归纳 | 不是原始头文件或原生二进制认证 |
| [33–61](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/DebateEnum.cs#L33-L61) | 再考0、普通牌1..9、五话术10..14的数值编码 | 不证明 PK、Vanilla 或主机原生枚举等价 |
| [105–114](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/DebateEnum.cs#L105-L114) | 五种话术与 `Rhetoric_Max=5`；该枚举自述由实现归纳 | 不是独立于现代参考的第二份证据 |

## 2. 提供式输入与数值映射

输入必须包含 `schemaVersion:1`、固定 `profile`、完整 `policies`、`rhetoricCards` 和 `rawDraws`。完整政策按结构和值匹配，不只核对一个政策 ID。唯一求值入口接收 `unknown`，严格数据形状、资源限制与错误优先级见 [API](../engine/debate-deck-generate-v1.md)。

`rhetoricCards` 是0..5项、值为10..14且互不重复的有序数组。其长度直接定义 n，不另接收可能与数组矛盾的 `rhetoricCardCount`。空数组合法。来源 `DeckInit` 可按枚举顺序建立初始库存，但后续 `DeckGenerate` 会改变库存顺序，所以本函数不排序输入，不要求升序，也不丢弃 n=5时暂未入牌堆的第五项。

库存资格由调用者提供，内核只检查这个局部契约。不读取人物、书籍、物品、能力、行为表或 MOD hook，不判定某个完整对局能否到达该库存和抽样序列。

| 数值 | 含义 |
|---|---|
| 0 | 再考保留槽；不是本函数输入库存或输出牌堆成员 |
| 1 / 2 / 3 | 故事小/中/大 |
| 4 / 5 / 6 | 道理小/中/大 |
| 7 / 8 / 9 | 时节小/中/大 |
| 10 / 11 / 12 / 13 / 14 | 大喝 / 诡辩 / 无视 / 镇静 / 激昂 |

本函数的普通牌查表顺序是：

| 原始抽样 value | 小牌，表下标 value | 中牌，表下标 3+value | 大牌，表下标 6+value |
|---:|---:|---:|---:|
| 0 | 4 | 5 | 6 |
| 1 | 1 | 2 | 3 |
| 2 | 7 | 8 | 9 |

尾部回退则直接使用全部九项表：value0..8分别得到4、1、7、5、2、8、6、3、9。它与独立补手牌内核的 `1+value` 修补公式不是同一个映射，不得复用后者来替代本函数的回退。

## 3. 严格来源阶段与抽样次序

`rawDraws` 必须是逐次明列的有序记录数组，每条只有 `role`、`bound`、`value`。它不是 seed、回调、计数压缩格式、可无限读取的 RNG、shuffle 结果或未来 session 共用的抽样流。value 是满足 `0 <= value < bound` 的整数，必须与该来源阶段的角色和 bound 一起匹配。

| 顺序 | role | 次数 | bound | 作用 |
|---:|---|---:|---:|---|
| 1 | `debate-deck-small-topic` | 8 | 3 | 按顺序填生成前牌堆下标0..7 |
| 2 | `debate-deck-medium-topic` | 4 | 3 | 填下标8..11 |
| 3 | `debate-deck-large-topic` | 2 | 3 | 填下标12..13 |
| 4 | `debate-deck-rhetoric-swap` | n>0时2000，否则0 | n | 对完整库存做来源交换 |
| 5 | `debate-deck-tail-fallback` | `4-min(4,n)` | 9 | 只在尾槽没有对应话术时补普通牌 |
| 6 | `debate-deck-table-swap` | 2000 | 18 | 对完成后的18项牌堆做来源交换 |

前14次普通牌抽样完成后，才开始话术交换；话术交换全部完成后，才填4个尾槽；尾槽完成后，才开始牌堆交换。不能提前填话术尾槽，不能把回退抽样插在话术交换之间，也不能把两类2000次交换混为一次操作。

### 3.1 两类交换均不得“优化掉”

话术交换令局部 i从0到1999，每次以当前数组为基础交换 `rhetoricCards[i%n]` 与 `rhetoricCards[value]`。n=0时整个阶段跳过，不做除0运算也不消费该角色抽样。n=1时每次只能提供 value0，交换虽然不改变值，仍必须保留、消费并记录2000条 bound1 抽样。

牌堆交换同样令本阶段局部 i从0到1999，交换 `deck[i%18]` 与 `deck[value]`。其左下标不继承前一阶段循环计数，不是“只交换未处理后缀”。自交换和交换同值牌都仍是一次来源操作，不能去重、跳过或减少抽样。

本实现求值的是这两个固定长度的交换程序，不是 Fisher–Yates，不是按随机排序键重排，也不以“看起来随机”或“最终值相同”为由替换算法。不认证来源 PRNG、独立性、均匀性、概率分布、跨调用随机流或与原作 RNG 的耦合。

### 3.2 尾部话术、回退与张数

生成前下标14..17依次处理。若尾部局部 i小于 n，则复制交换后库存的第 i项，不消费尾部抽样；否则消费一条 bound9 回退抽样查九项表。

因此每副牌准确包含 `min(4,n)` 张话术和 `18-min(4,n)` 张普通牌。前14项确定有8张小、4张中、2张大；若 n<4，回退还会增加普通牌，故不能把整副牌概括为“恰好8小4中2大”。n=5时有且只有库存交换后的前4种话术入牌堆，其余一种保留在返回库存，不是被删除或锁死。

| n | 普通牌初建抽样 | 话术交换抽样 | 尾部回退抽样 | 牌堆交换抽样 | 总数 |
|---:|---:|---:|---:|---:|---:|
| 0 | 14 | 0 | 4 | 2000 | 2018 |
| 1 | 14 | 2000 | 3 | 2000 | 4017 |
| 2 | 14 | 2000 | 2 | 2000 | 4016 |
| 3 | 14 | 2000 | 1 | 2000 | 4015 |
| 4 | 14 | 2000 | 0 | 2000 | 4014 |
| 5 | 14 | 2000 | 0 | 2000 | 4014 |

缺少抽样、语义不匹配或多给抽样都原子拒绝，不能从外部 RNG 补足，也不能忽略末尾多余记录。所有原始记录仍须满足严格 DTO 数据检查，不能因为它暂时不在当前消费位置而夹带异常结构。

## 4. 结果、库存持续性与审计

成功形状为 `{ok:true,deck,rhetoricCards,receipt}`：`deck` 恰好18张1..14牌码，`rhetoricCards` 为完整 n项库存经过2000次来源话术交换后的顺序。输入库存不被修改；返回变化后的库存是纯函数对来源可变字段的显式映射，而不是把源对象副作用丢掉。

如果未来调用者要复现同一来源 `Deck` 的下一次生成，必须明确传递本次返回的库存顺序，不能每次重新把库存排序或恢复成最初顺序。本批仅保留这种组合所需的信息，不实现未来生成循环、游标切换、牌堆身份或任何 session 接入。

回执保留完整政策和证据、输入与结果快照、普通牌和尾槽放置记录、牌堆交换前的 `preShuffleDeck`、全部有序 `consumedDraws`，以及每一次 `rhetoricSwaps` 和 `tableSwaps`。总抽样数位于 `receipt.drawCounts.total`；`cursorEffect:'not-read-or-written'` 只说明无游标动作，不表示游标原值或结果为0。这些审计记录解释给定值如何得到结果，不是原生物理牌身份、session choice token、PRNG 状态或统计证明。精确字段见 [API](../engine/debate-deck-generate-v1.md)。

失败形状仅为 `{ok:false,reason}`，不返回可提交的部分牌堆、部分库存或半截回执。成功与失败均不修改调用者输入，不消费外部随机源，不写文件、存档或 session 状态。

### 4.1 本函数不接纳或重置游标

来源 `Deck` 有 `index` 字段，但 `DeckGenerate` 方法自身只写牌堆和话术数组，不把 `index` 清0。补手牌逻辑在另一处先调用生成方法，再执行 `self.deck.index=0`。两者必须分别归因，不能在本纯函数添加来源没有的游标动作。

本 API 因而不接收旧牌堆、`deckCursor` 或 session，不返回游标，也不声称新牌堆已被某个消费者安装。未来若做完整补手牌再生，需要另外定义生成调用、游标重置、库存持续、牌堆身份、抽样编排及原子提交的完整契约。

## 5. 与已有 session 和内核严格隔离

此前八个舌战 session profile 全部保持原入口、政策、证据、命令、存档标签及行为；本批不修改既有补手牌内核、普通回合内核或任何 session 消费链。新文件的存在不产生隐式桥接、自动 profile 升级、旧存档迁移或 replay 语义变化。

尤其 PR112 的 `debate-filled-current-deck-reference-v1` 仍只接纳已提供的18项当前牌堆。需要读取第19项时仍返回 `unsupported-deck-regeneration`，不得调用本新函数、复用第一项、拼接另一副牌或偷偷清0游标。独立 `evaluateDebateHandFill` 的同名再生拒绝也保留。旧 Rethink session 的 `unsupported-topic-repair` 边界同样不变。

新内核不补手牌、不恢复再考保留槽、不做普通牌修补或排序；它也不授予再考许可，不做攻击、反射、附加效果，不写 HP、stress、angerTimer、canRethink、崩坏层、话题、先手、回合、历史、结局或 campaign。

## 6. 纸面核对重点与未运行口径

[纸面案例](../../data/scenarios/debate-deck-generate-example-v1.json)用于人工阅读来源分支，不是运行回执或通过的测试。应分别覆盖：

- n=0：跳过话术交换，4次尾部回退，总2018次；回退 value0得到4而不是1。
- n=1：2000次 bound1/value0话术自交换仍存在，3次回退，总4017次。
- n=2、n=3：分别只有2次、1次回退；话术复制取交换后的顺序。
- n=4：没有回退抽样，4种话术各入牌堆一次。
- n=5：所有5项参与交换且全部返回，只有前4项进入本副牌；不能先截断再交换。
- 牌堆自交换、交换同值牌仍消费抽样；交换的索引和前后值可静态逐条阅读。
- 库存重复、普通牌充当库存、错误角色/bound/value、缺少抽样或多给尾部抽样必须拒绝。
- 游标或 session 字段不是本 API 的隐式扩展点；既有消费者需要第19项的请求仍未获支持。

上述是规则与人工检查目标，不表示任何样例已执行。确切纸面输入、展开方式和预期值以单独案例文件为准，不把压缩的人类阅读记法当作求值函数接受的 `rawDraws` 格式。

案例文件的完整主输入提供 `[10,11,12,13,14]`：前14次 value0得到8张4、4张5、2张6；话术第一次交换0与4，其余均自交换，所以库存变为 `[14,11,12,13,10]`，复制的尾部为 `[14,11,12,13]`。牌堆第一次交换0与17，其余均自交换，所以最终下标0为13、下标17为4，其余与交换前相同。返回库存仍保留末项10。这个4014次抽样的推导区分了“完整话术顺序”“选中尾部”和“最终牌堆”，不是实际运行证明。

## 7. 排除项与证据缺口

本批不实现 `DeckInit` 人物资格、书籍/物品、行为表或 MOD hook；不实现原生 PRNG、seed、跨阶段 RNG 耦合、均匀洗牌认证、真实游戏可达性或统计分布；不接入手牌补满、再考、牌堆耗尽、游标重置、session/save/replay/campaign。

教程、四性格愤激、自动反制与额外消耗、连打与 timer、冷静愤激的再考恢复和大牌覆写、开场一击决胜、追击/留情/负伤及完整舌战结局继续排除。P078/native 人员任务及所有依赖、俘虏/处斩/归属、return/mission、外交自动结算完全不在本批范围内。

`nativeEquivalent:false`、`stockOriginalVerified:false`、`pkEquivalent:false`、`vanillaEquivalent:false`、`completeDebate:false`。现代 C# 文本不能认证 PC-PK/PK1.1、Vanilla 或主机二进制；既有 E15 普通公式证据不扩张到本生成/交换/随机内核。原43证据主题与45历史快照继续开放，数量不减，不宣称舌战全链或原始证据缺口关闭。

基线为 PR112 main `7f71b1fbe277c47609bde2e0f716281d54100e1f`。本批仅静态源码与文档阅读、文本编写和纸面推导；不执行候选代码或来源，不运行测试、typecheck、编译器、build、validator、checker、diagnostics、产品或 replay。历史通过数不能作为本批验证结果；本文件不声称已发布、已合并或通过运行验收。
