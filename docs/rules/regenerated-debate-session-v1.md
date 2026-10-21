# 当前牌堆耗尽后再生的舌战会话 v1

日期：2026-10-21。实现：[regenerated-debate.ts](../../packages/engine/src/regenerated-debate.ts) · [API 与保存合同](../engine/regenerated-debate-session-v1.md) · [固定来源与完整政策](../sources/regenerated-debate-session-v1.json) · [纸面案例，未运行](../../data/scenarios/regenerated-debate-example-v1.json)。

这是一个新的、独立版本的有界会话：profile=`debate-regenerated-deck-reference-v1`，保存 tag=`regenerated-debate-session-v1`，原子回合命令=`ResolveRegeneratedDebateRound`。它实际把 PR113 的 `evaluateDebateDeckGenerate` 接入补手牌过程中“当前牌堆已耗尽、仍有下一空位要填”的分支，并延续 PR112 的正常态战斗、战前再考和非终局补牌编排。它不是把数副牌预先拼成无限牌带，也不是把旧 profile 的拒绝改掉。

支持域仍为固定现代参考、通用身份、正常难度、非教程、双方 `angerTimer=0`。普通话题牌和五话术共六类战斗牌沿用共享正常态结算；再考是战前行动，不是第七类战斗牌。新增闭环仅覆盖提供式抽样下的有限牌堆再生，既不实现原生 PRNG，也不实现人物/书籍 `DeckInit` 或 campaign。

## 1. 固定来源与证据边界

算法与阶段次序的依据为 `tankyc/sango_infinity` commit `a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef` 的现代 C# 参考。本批仅静态阅读已留存的固定文本；以下身份继承已有来源账本，不声称重新下载、重新计算哈希或执行来源。

| 固定文件 | blob | 本批使用范围 |
|---|---|---|
| [Debate.cs](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs) | `0137498d10773cd4596d497083ccdf6a26b3a261` | 18项牌堆、生成、补牌内再生及游标重置、统一修补/排序、再考、正常态战斗 |
| [DebatePhase.cs](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/DebatePhase.cs) | `6aa98f855a5d4d172cde7e8ffc18a141b8a7b587` | first→other 的再考/重选、Attack→Effect→HP终局、回合末至下一轮 |
| [DebateEnum.cs](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/DebateEnum.cs) | `5b46a8ac87613193eb9f4b99a25e489ba6f5e483` | 0..14牌码、话题及五种话术枚举 |

关键逐段归因：

- `Debate.cs 103–119` 把当前牌堆、游标、完整话术数组及数量分开保存；话术数组不是每次生成时临时重新排序的集合。
- `306–340` 是 `DeckGenerate` 的固定映射、前14张普通牌、2000次话术交换、4个尾槽和2000次牌堆交换。该方法自身没有游标重置。
- `409–442` 是一次完整 `CharacterFillCards`：保留0槽、按空位升序取牌，在要取下一张且游标已达18时调用生成并重置游标，全部空位补完后才条件修补最后新增原槽并排序。
- `453–465,991–999` 是出牌后的压缩；`490–509,1253–1263` 是再考清空后填满及关闭许可。冷静愤激额外覆写仍排除。
- `1046–1079` 是队伍0→1的下一轮补牌及崩坏变化恢复再考；`1083–1126` 是先手/话题更新及条件诡辩抽样。
- `DebatePhase.cs 172–253,261–275,394–420` 支持战前先后顺序、TurnEnd→TurnStart、Attack→Effect→HP终局。原子配对命令与完整保存包装是工程封装，不是原生交互式子阶段存档。

来源自述为现代翻译，枚举还声明部分内容由实现归纳。固定现代文本不认证原始头文件、clean stock EXE、PC-PK/PK1.1、Vanilla 或主机二进制。既有 E15 普通公式证据只在原限定域有效，不扩张到生成、洗牌、身份排序、再生、PRNG 或完整舌战。

## 2. 提供的初始检查点，不是完整开局历史

每方输入包含恰好18项的 `cardTape`、`initialDeckCursor` 和有序 `rhetoricCards`：

- `cardTape` 每项为1..14整数，表示调用者已经给定的当前牌堆，不是只给剩余后缀，也不是未来所有牌的流。
- `initialDeckCursor` 为0..18，指初次补牌将读取的下一项。前缀可以已跳过；本 profile 不反推这些牌曾被谁取得、使用或弃掉。
- `rhetoricCards` 为0..5项互不重复的10..14牌码，顺序有意义。数量由长度定义，不另接收可矛盾的计数字段，不要求数值升序。
- 初始当前牌堆的 `deckGeneration=0`。这是本次有限会话的局部编号，不证明它由相同库存生成，也不证明其初始游标来自一个可达的完整舌战历史。

初始手牌仍由空手填满；HP1000、stress0、angerTimer0、崩坏0、再考可用，初始话题及 challenger 由输入给定。故“允许初始游标不为0”是工程接纳的合成检查点，不是恢复任意中局手牌、历史伤害、愤激、再考许可、人物或 campaign 状态。

普通牌1/2/3为故事小/中/大，4/5/6为道理小/中/大，7/8/9为时节小/中/大；10/11/12/13/14为大喝/诡辩/无视/镇静/激昂。0只用于再考保留槽，不是生成结果、库存项或可选战斗 occurrence。通用 INT 为1..100；INT<70、70..79、80..89、90..100分别有3/4/5/6个可出槽，另有保留0槽。

持续状态分别保存 `deck`、`deckCursor`、`deckGeneration` 和完整 `rhetoricCards`。旧的 `cardTape` 保留在原始 scenario 中，不能被后续再生覆盖或冒充最新牌堆。来源人物资格、书籍/物品、行为表及 MOD hook 均不从这些提供值推断。

## 3. 惰性再生与一次完整补牌

初始、再考和非终局补缺使用同一编排：按原可出槽升序遍历空位，从当前牌堆取下一张；若**确实还有空位要填**且 `deckCursor=18`，此时才调用独立生成核。生成成功后，由会话安装新18项牌堆、保存返回的完整话术顺序、增加 generation，并把游标重置为0，再给这个尚未填的槽取牌。

游标从17变为18本身不触发生成。最后一个空位恰好取得旧牌堆最后一项时，成功状态可停在18；没有下一次实际取牌就没有生成抽样。HP终局不补牌，不能只因游标18而强行生成或拒绝。

一次补牌可能先取得旧 generation 的末项，再取得新 generation 的首项。两段是同一次 fill，不能在旧段耗尽时先修补或先排序，再对新段各做一次。这会改变最后新增槽、普通牌计数、随机调用次序和卡牌身份。

所有空位补完后，实际调用包内共享 `completeDebateHandFill` 完成：

1. 统计整副可出手牌中的1..9普通牌，包括保留牌及跨 generation 新取牌。
2. 仅当计数为0且本次确实新增过槽，消费一次 bound9 `debate-fill-topic-repair`，把**最后新增原槽**改为 `1+value`。
3. 最后统一按数值牌码排序，并保留原槽/来源身份映射。

已有普通牌或补入普通牌时不修补；没有新增空位的满手全话术也不修补。修补不是额外发一张牌，不增加、回退或抵销游标，不改变当前牌堆原值，不覆盖最后保留牌或排序后的末牌。

共享模块 [debate-hand-fill-completion.ts](../../packages/engine/src/debate-hand-fill-completion.ts) 只是包内的纯完成阶段，不建立新的公开 profile、输入政策或独立 receipt 包装。旧 `evaluateDebateHandFill` 继续保留自己的 DTO、政策、证据、校验、取牌循环、耗尽拒绝及收据构造，只复用完成阶段；新会话没有冒用旧内核收据来声称旧内核支持跨牌堆再生。

## 4. 每次生成的实际内核与库存延续

每次需要新牌堆时，实际调用 `evaluateDebateDeckGenerate`，传入完整固定 `DEBATE_DECK_GENERATE_POLICY_V1`、当前完整话术顺序及对应的连续提供抽样，保留原核完整 policy/evidence 和 receipt。不是复制其算法、提供预先洗好的新牌堆，也不是忽略交换过程只记最终牌面。

固定普通牌映射表为 `[4,1,7,5,2,8,6,3,9]`。内核先取8个 bound3 小牌、4个 bound3 中牌、2个 bound3 大牌；非空话术库存再做2000次左下标 `i%n`、右下标提供值的交换；尾槽依次取交换后前 `min(4,n)` 种话术，不足部分按九项表的 bound9 抽样回退；最后对18项牌堆做2000次左下标 `i%18` 的交换。

两类2000次交换都不是 Fisher–Yates。n=0跳过话术交换；n=1仍消费并记录2000次 bound1/value0，即使每次都是自交换。回退使用九项表，不是补手牌修补所用的 `1+value`。全部自交换和同值牌交换均须记录，不能以最终值未变而删除。

每次生成的抽样总数由库存长度 n=0..5分别确定为2018、4017、4016、4015、4014、4014。数量不是 session 层可任意压缩的参数。n=5时只有交换后的前4种话术进入本副牌，但全部5项都返回并持续保存；下一次生成必须从这个**已变更的完整顺序**开始，不得截断成4项、恢复初始顺序或重新排序。

原生成核的 `cursorEffect:'not-read-or-written'` 保持不变，含义仍是核不处理游标。新会话对游标的重置必须单独归因于 `CharacterFillCards` 调用者，并以外层前后状态审计记录，不能篡改核收据使它看似自己重置了游标。

## 5. 跨 generation 的 occurrence 身份

数值 occurrence 保留 `cardCode`、`token`、`tapeIndex` 和 `deckGeneration`。token 格式为 `participantId:deckGeneration:tapeIndex`；每一副当前牌堆内部的 tapeIndex 为0..17。generation 只在成功安装下一副牌时增加，不因修补、排序、再考或回合切换单独增加。

同一方旧副下标0与新副下标0是不同 token；相同牌码不是同一张 occurrence。旧副幸存手牌可以与新副手牌并存，替换当前 `deck` 不改变幸存牌的来源 generation，也不让旧 token 再次可用。

修补改变 occurrence 的牌面 `cardCode`，但其 token、generation 和 tapeIndex 保持。审计仍保留修补前取出的牌码，最终战斗则按修补后的数值牌码派生语义牌。不得用旧牌堆原值覆盖修补后的实际战斗牌面。

统一排序直接采用共享完成阶段的 `sortedProvenance`。相同牌码按 `preSortSlot` 打破并列，是确定性工程审计政策，不认证 C# `Array.Sort` 或原生物理卡牌的身份稳定性。保留0槽参与完成阶段数字结果，但不生成可选战斗 token。

## 6. 一条严格分阶段的提供抽样流

初始使用 `scenario.genesisRawDraws`，按队伍0→1分别完成全部取牌、必要再生、最终修补。每轮使用一条 `command.rawDraws`，条件消费次序为：

1. 轮开始 first 一方请求再考时的完整 fill：必要生成在取牌点发生，最后才可能修补。
2. other 一方请求再考时的完整 fill，同样先必要生成再最终修补。
3. Attack 真正需要的 bound5 `psychological-damage-jitter`。
4. 非终局实际需要的 bound3 `sophistry-topic-reroll`。
5. 非终局下一轮队伍0的补缺，必要生成后才可能修补。
6. 非终局下一轮队伍1的补缺，必要生成后才可能修补。

生成项是扁平逐次记录，不是 seed、生成器、回调、压缩运行长度、嵌套 draw 列表或调用者提供的最终排列。每条保留原核 `role/bound/value`，另带精确 `participantId`、`phase`（`genesis`、`rethink` 或 `refill`）及 `generation`（即将生成的下一编号）。六类生成角色依次为 `debate-deck-small-topic`、`debate-deck-medium-topic`、`debate-deck-large-topic`、条件 `debate-deck-rhetoric-swap`、条件 `debate-deck-tail-fallback`、`debate-deck-table-swap`。

修补项仍是 `debate-fill-topic-repair`、bound9、value0..8，绑定参与者及 phase；生成项的 generation 标记不能替代修补的阶段身份。战斗 jitter 与话题 reroll 保持其各自三键抽样形状。确切必填字段与错误顺序见 [API](../engine/regenerated-debate-session-v1.md)。

所有输入先通过安全结构和字段语法检查；具体角色、bound、value、参与者、phase 和生成编号在实际消费点核对。未触发的阶段消费0项，不预留占位抽样，不搜索后方同角色项凑数；缺项、错序、错身份、越界或末尾多余均拒绝。所有提供值只是确定性输入，`externalRngConsumed=0`，不认证随机来源、独立性、均匀性或全局 RNG 链。

嵌套生成核只接收原三键局部抽样，其局部 `drawIndex` 和完整收据不改。外层每次生成记录所属完整初始/回合流中的 `drawStartIndex` 与 `drawEndIndexExclusive`；修补和诡辩话题的外层位置同样是完整流索引，不能沿用旧最多6项协议或0/1限制。

## 7. 再考、正常态战斗和关闭

初始和非终局补牌按 scenario 队伍0→1；再考与最终选择按当前 first→other。再考先弃全部可出牌，再填满并关闭许可，然后才选择该方最终战斗 token；另一方的生成/修补不能提前消费。`rethinks` 输入列表的排列不改变这个次序，choices 仍按 scenario 队伍顺序。

正常出牌先移除选中 occurrence，再把幸存牌按原顺序压紧，尾部才补空位。这与在原选中位置留下内部洞不同，会影响新牌原槽和同值排序审计。再考不单独推进回合，不保存“已再考尚未重选”的半阶段。

正常态战斗继续复用 [debate-normal-round.ts](../../packages/engine/src/debate-normal-round.ts)，不建立新的伤害或附加效果规则：

- 牌力为无视120、大喝110、诡辩20、普通1+等级下标且匹配话题再加10、镇静和激昂0。等牌力双方stress+15，不取伤害 jitter、不执行附加效果。
- 通用 attack=`100+trunc(40*(myINT-opponentINT)/(131-myINT))`；伤害按普通正常态系数、提供的 bound5 抽样和向零整数除法计算。无视不伤HP、加对方stress30并抑制败方附加效果。
- 诡辩仅反射败方普通牌，用诡辩胜者attack和败方普通牌系数；正HP伤害 guard 同时控制该攻击的HP与stress写入。胜镇静/激昂不取伤害抽样。
- 附加效果按胜者→败者，不按先手；镇静请求基于其对手**当前stress**，反射只改写入目标，激昂请求40。逐次clamp，不用净变化替代每次写入。
- Attack 和应执行 Effect 完成后才判HP终局；不能因败者已经HP≤0而跳过其合法 Effect。终局停止话题/先手更新、崩坏、再考恢复、补牌及再生。
- 非终局效果后任一stress达到100，整轮拒绝 `unsupported-anger-trigger`，不cap99、不重置、不跳过愤激继续。正常态之外的四性格、反制、连打与timer仍不支持。
- 非终局崩坏为 `clamp(trunc((1000-hp)/250),0,3)`，仅自身等级变化才在下一轮恢复再考；本轮未来的恢复不能满足本轮开头的许可。
- 非终局胜者成为下轮先手，普通胜牌先设其话题；只要一方诡辩且对面不是无视，非平局下即使诡辩败给大喝仍消费话题重抽。平局或HP终局不消费。

## 8. 审计、原子提交和保存

每次 fill 保存 `beforeDeck`/`afterDeck` 检查点，字段为完整 `deck`、`deckCursor`、`deckGeneration` 和 `rhetoricCards`；保存前后及新发 occurrence、一次最终完成阶段审计、实际发生的 `generations[]` 和条件修补的全流位置。

每条 generation 保存完整不改写的独立生成核 receipt 与全流连续范围，其 `before`/`after` 检查点截在生成前后，游标为18→0；后续给空位取牌的游标推进属于外层fill，不混进生成动作的检查点。完成阶段保存修补前 `postFillHand`、修补后 `preSortHand`、最后新增原槽、普通牌计数、条件修补与带身份的 `sortedProvenance`。这是新会话自己的组合审计，不谎称为旧 `DebateHandFillReceiptV1`。

初始化、preview、execute、load 与 replay 在分离的候选数据上重算。后一阶段失败，包括另一方再考、最终选了弃掉的旧token、生成中途错抽样、repair缺项、战斗/话题错抽样、非终局愤激边界、队伍1补牌失败、剩余抽样或完整保存预算超限，都拒绝整次候选操作；此前生成的牌堆、变更的话术库存、游标重置、HP/stress、再考关闭及审计均不得部分提交。

保存包含完整固定新政策与证据、原始scenario及初始抽样、初始fill/生成审计、每条接受命令及完整receipt、最终snapshot。读取时从提供的 generation0 初始检查点重建，逐条重算并比较完整内容，不只核对policy ID，也不信任外来当前牌堆、库存、generation或最终snapshot。修改旧tag、塞入generation字段或转换旧token都不构成允许的迁移。

完整固定政策与证据原文保存在[来源账本](../sources/regenerated-debate-session-v1.json)，与实现常量一致；严格公开字段、错误合同和完整预算入口以 [API](../engine/regenerated-debate-session-v1.md) 为准。

## 9. 有界预算与旧版本隔离

单方手牌容量最多6。初始填牌每方最多取6张；一轮内该方最多再考取6张并在非终局补1张，总量不超过7，因此同方一轮最多再生一次、双方便是最多两次。初始两方同样至多两次再生。这个结论依赖本 profile 排除的愤激额外消耗不发生，不外推到完整舌战。

保守抽样上限为初始8036项、每轮8040项：分别是两次最大4017生成，加初始最多2次修补，或回合最多4次修补与2次战斗/话题抽样。它们是阶段上界之和，不保证所有上限能在同一可达局面同时出现，也不是必须提供的配额。

历史最多16条接受回合；完整canonical UTF-8保存包装上限32MiB（33,554,432字节），通用结构预算为2,000,000节点、深度32、单数组8192项。8192不放宽18项牌堆、5项库存、16条历史或8036/8040的专门限制。完整初始与历史中的生成收据也计入预算，故可能在尚未达到16条前先被字节或节点预算拒绝；容量拒绝不是游戏平局、失败结局或可忽略审计。

旧八个会话的公开入口、DTO、完整政策/证据、保存tag及行为保持独立；旧七个对象牌会话和 PR112 filled 会话都不自动升级。PR112 及独立 `evaluateDebateHandFill` 的 `unsupported-deck-regeneration` 仍保留，旧 Rethink 的 `unsupported-topic-repair` 仍保留。仅本新 profile 在其提供式抽样支持域内接入耗尽再生，不能把它描述为旧拒绝在全工程中已删除。

PR113 独立生成核自身不变，仍不是 session、仍不接收或重置游标、仍不处理补牌修补。共享完成阶段的抽取只是旧公开补牌包装的包内重用，不是旧公开政策或 receipt 升级；静态保留合同不等于本批运行等价认证。

## 10. 未覆盖范围与交付口径

[纸面案例](../../data/scenarios/regenerated-debate-example-v1.json)明列主场景初始4015项抽样及三条回合命令：同一次fill从旧副下标17跨入generation1，生成核保留完整五项话术顺序，最后一次修补保持新牌token。另有独立三轮HP终局场景，游标依次17→18→18，说明恰好耗尽不预生成、终局不补牌；这些均为手工预期，不是执行回执。

案例还附两条明确标为非API输入的人类阅读配方，分别说明再考中的生成应先于战斗、非终局补牌中的生成应后于战斗。压缩配方不是公开 `rawDraws` 可接收的格式，不能把未展开的交换描述当作已执行或已验收的场景。

仍排除原生 PRNG/seed/全局随机链、均匀洗牌证明、`DeckInit` 及真实人物/书籍/物品资格、初始检查点历史可达性、教程、交互式子阶段存档、四性格愤激/自动反制/连打/timer、冷静愤激再考恢复及大牌覆写、开场一击决胜、追击/留情/负伤、完整 campaign 结局和事件覆写。

P078/native 人员任务及全部依赖、俘虏/处斩/归属、return/mission、外交自动结算均不在本批范围内。`nativeEquivalent:false`、`stockOriginalVerified:false`、`pkEquivalent:false`、`vanillaEquivalent:false`、`completeDebate:false`；原43证据主题和45历史快照继续开放且计数不变，不因现代参考局部再生闭环而声称原作完整舌战或原生证据缺口清零。

静态基线为 PR113 main `35ba11338510a01bd28cf780f75e7e7ab6650950`，tree `ab7f1e9769605f31e66830713765a70f9b75e4d7`。本批仅源码和文档静态阅读、文本编辑及纸面推导。未执行测试、typecheck、编译器、build、validator、checker、diagnostics、产品、候选代码、来源、场景或replay；纸面案例不是运行回执、测试通过或运行等价证明，历史验证数字不为本批背书。本文件不自行声称已发布、已合并或通过运行验收。
