# 当前18张牌组惰性再生成独立舌战 API v1

[规则与来源边界](../rules/regenerated-debate-session-v1.md) · [固定政策与证据](../sources/regenerated-debate-session-v1.json) · [纸面场景，未运行](../../data/scenarios/regenerated-debate-example-v1.json)。

实现入口：[regenerated-debate.ts](../../packages/engine/src/regenerated-debate.ts)。本页描述独立 profile=`debate-regenerated-deck-reference-v1`、tag=`regenerated-debate-session-v1` 的 `RegeneratedDebate*V1` 合同。它在实际填牌需要越过当前18张牌组时接入 [DeckGenerate 参考内核](debate-deck-generate-v1.md)，把新牌组、游标、代次及完整话术数组连续保存；前置再考、普通难度六类战斗、非终局补牌与历史重算仍在同一个原子回合中。

这是新的独立 profile/tag，不是旧 [Filled session](filled-debate-session-v1.md) 的自动升级。旧八个 session 的公开 DTO、固定政策、证据和存档保持独立；旧 Filled 及独立 hand-fill 内核仍保留原有 `unsupported-deck-regeneration` 边界。新合同也不把旧 Rethink 的 `unsupported-topic-repair` 放宽。

本文依据文本读源与接口书写，不是运行报告。没有运行候选 API、初局、纸面命令、replay、测试、typecheck、编译器、build、validator、checker 或诊断，不声称运行时已验证。

## 1. 公开接口与采用结果

全部参数类型为 `unknown`，公开入口先安全分离再严格检查。成功、失败、审计及常量均递归冻结，不修改或冻结调用者输入。

| 函数 | 参数 | 成功值 |
|---|---|---|
| `createRegeneratedDebate` | scenario | `{ok:true,session}` |
| `inspectRegeneratedDebate` | 完整 session | `{ok:true,inspection:{snapshot,policy,evidence,entryCount,remainingEntryCapacity,canonicalUtf8Bytes}}` |
| `previewRegeneratedDebateRound` | 完整 session, command | `{ok:true,preview:{receipt,projectedSnapshot,policy,evidence,externalRngConsumed:0}}` |
| `executeRegeneratedDebateRound` | 完整 session, command | `{ok:true,session,receipt}` |
| `saveRegeneratedDebate` | 完整 session | `{ok:true,json}` |
| `loadRegeneratedDebate` | JSON 字符串 | `{ok:true,session}` |
| `replayRegeneratedDebate` | scenario, commands 数组 | `{ok:true,session}` |

常量为 `REGENERATED_DEBATE_POLICY_V1:RegeneratedDebatePolicyV1` 与 `REGENERATED_DEBATE_EVIDENCE_V1:RegeneratedDebateEvidenceV1`。preview/execute 名称带 `Round`，不提供省略该后缀的别名。统一失败结构为 `{ok:false,reason:string,index:number|null}`，不含 partial session、部分 generation/fill 或失败 receipt。

调用者只在 `ok:true` 后采用返回的新 session。preview 与 execute 对相同完整拟议追加 session 做重算和预算，preview 只返回 receipt/projectedSnapshot，不返回可保存的拟议 session。inspect/save/load 同样重算，不只信任 snapshot。所有 draw 都是调用者提供的数据；全部入口不调用外部 RNG，成功或失败都不推进外部随机源。

## 2. 合同起点与身份

### 2.1 提供式合成检查点，不是 DeckInit

每方输入一副完整18项 `cardTape`、`initialDeckCursor` 与有序 `rhetoricCards`。游标为0..18，代次从0开始，初始手牌不由调用者提供；系统从检查点游标起实际填满初手。输入不是“剩余牌段”，不能只给未消费后缀，也不是任意长未来牌流。

以下短名只为展示 DTO，省略递归 `readonly`；`Pair<T>` 是恰好两项、保序的 tuple，不是任意数组。

```ts
type Topic = 'story' | 'logic' | 'trend';
type CardCode = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14;
type RhetoricCardCode = 10 | 11 | 12 | 13 | 14;
type Participant = {
  id: string; resolvedIntelligence: number;
  hp: 1000; stress: 0; angerTimer: 0;
  cardTape: CardCode[]; initialDeckCursor: number; rhetoricCards: RhetoricCardCode[];
};
type Scenario = {
  schemaVersion: 1; profile: 'debate-regenerated-deck-reference-v1';
  genericOnly: true; difficulty: 'source-normal'; policies: RegeneratedDebatePolicyV1;
  challengerId: string; initialTopic: Topic; participants: Pair<Participant>;
  genesisRawDraws: RawDraw[];
};
```

两人 ID 互异，符合 `[A-Za-z][A-Za-z0-9_-]{0,63}`；challengerId 必须属于本场，成为初始 firstId。INT 为1..100，HP/stress/angerTimer 初值必须严格1000/0/0。INT<70、70..79、80..89、90..100分别得到3/4/5/6个可选手牌位置，来源总槽数再加保留再考槽1。所有键必填，不自动补默认值；完整 policies 必须与固定常量逐字段匹配，不只检查 id。对象键序不影响相等，数组内容与顺序有意义。

`genesisRawDraws` 必填，最多8036项，实际只接受初局所需的生成和修补。无所需抽样时须为 `[]`，不能省略、自动补 draw、携带战斗 draw 或预存以后要用的下一副随机流。

该起点明确是工程提供式合成检查点：不要求游标之前的牌已经组成某个真实旧手牌，不证明当前18张牌与话术数组之间存在生成关系，不认证此前的洗牌、发牌、弃牌或随机历史。即使初始游标非零，两人仍采用本合同规定的初始 HP/stress/angerTimer、再考资格及空手填牌流程，而不是导入任意原生中局。

`rhetoricCards` 是10..14中长度0..5的互异、有序子集。它不是当前手牌，也不是当前牌组里出现过的话术集合；不得从牌组扫描推导、去重后另排、或只保留本次选入的前四张。空数组表示明确提供零话术资格，不代表资格未知。不调用人物/物品查询，也不执行 `DeckInit`、天生话术、书籍资格或人物专属 hook。

初始完整牌组的每项仍须是1..14的合法数值码，包括游标之前的已跳过前缀和暂未发到的后缀。提供式检查点不强制满足生成器的8小/4中/2大基础配额，亦不声称它来自生成器；只有实际进入再生成时的新牌组按固定生成内核产生。

### 2.2 数值牌与 occurrence

1/2/3=故事小/中/大，4/5/6=道理小/中/大，7/8/9=时节小/中/大，10=大喝，11=诡辩，12=无视，13=镇静，14=激昂。0仍只是来源再考保留槽，不是牌组项、可选战斗牌或独立回合动作。

```ts
type Occurrence = { cardCode: CardCode; token: string; tapeIndex: number; deckGeneration: number };
```

稳定 token 采用 `participantId:deckGeneration:tapeIndex`。代次与本代0..17下标一起标识一次实际发牌；同一参与者的第0代第0项与第1代第0项是不同 occurrence，不能因下标或牌码相同而合并。保留的旧代手牌可以与当前代新牌共存，不要求整手都属于当前牌组代次。

数字排序、话题修补、保留与压紧不改变 token 或发牌代次/下标。修补只覆盖该 occurrence 的当前牌面，不改原牌组项，不回退游标，不重发同一项。选择、再考弃牌及旧牌组被新牌组替换后都不能回收已消费 token。

## 3. 惰性再生成与一次完整填牌

### 3.1 触发点

再生成只发生在某个实际空位正在请求一张新牌、且该方当前游标已经是18时：

1. 以该方当前**完整有序**话术数组和接下来的提供式生成 draw 调用生成内核。
2. 接受完整生成收据与交换后的完整话术数组，把新18张牌替换为当前牌组。
3. 代次加1，游标重置为0，然后为这个尚未填满的空位发牌。
4. 继续原先同一次 fill 的余下空位，最后才判断话题修补与排序。

恰好发完第18张并不会立即生成下一副。若没有后续空位、已经满手、或本轮 HP 终局不做回合末补牌，游标可以合法停在18；不能预先要求下一代 draw。初局游标18同样要等第一个实际空位才生成，不在“读取检查点”时单独生成。

一次 fill 可先用旧代剩余后缀，再切换到新代。不能将它拆成“旧后缀调用一次旧 hand-fill，生成后再调用一次 hand-fill”：旧后缀用完不代表来源的一整次 `CharacterFillCards` 已结束，拆分会提前修补、提前排序并改变最后新增槽及 draw 顺序。

### 3.2 全部空位完成后，只修补、排序一次

初局和再考从空手开始；普通 refill 保留选择移除后已经压紧的 hand，并在尾部补空位。旧手牌被选出的原位置不会留下内部洞。所有空位按原来源槽升序填充，跨代不会重排尚在处理的槽。

整个 fill 完成后，再调用与旧 hand-fill 共用的内部 `completeDebateHandFill`（[源码](../../packages/engine/src/debate-hand-fill-completion.ts)）：统计新手牌中的普通牌；仅当完全没有1..9且本次确实新增槽时，用该参与者、该阶段的 bound9 draw 将**最后新增原槽**改为 `1+value`；随后按数字码升序排序。没有新增槽且无普通牌仍是 `no-new-slot`，不能凭空补一张普通牌。该 helper 是受信内部基础设施，不是独立公开 profile，不接受调用者 callback；新 session 不伪造跨代的旧 hand-fill kernel receipt。

话题修补的映射是 `1+value`；生成器普通牌和尾部回填的映射是 `[4,1,7,5,2,8,6,3,9]`。这两种 bound9 draw 含义不同，不能互换角色或把生成器 value0 错写成故事小。

最后新增槽可能属于新一代；修补不针对“旧副最后一张”“排序后的最后一张”或“最后保留牌”。相同数字牌的审计 tie 使用原槽顺序，这是确定性工程政策，不证明现代 `Array.Sort` 或原生牌对象的物理身份稳定。

### 3.3 生成内核不被改写

一次再生成仍完整执行 [独立生成器](debate-deck-generate-v1.md) 的来源顺序：8次小、4次中、2次大普通牌；非空话术数组的2000次交换；缺少前四张话术位置时的普通牌回填；最后2000次全牌组交换。

话术数组长度为 `n` 时，primitive draw 数为 `14 + (n>0 ? 2000 : 0) + (4-min(4,n)) + 2000`：n=0为2018，n=1为4017，n=2为4016，n=3为4015，n=4或5为4014。n=1时2000次 bound1/value0交换仍不得省略；同位、同值交换仍保留完整消费与审计。不改用 Fisher–Yates，不承诺均匀分布，不从 seed 生成 draw。

n=5时所有五项先参加话术交换，只有交换后的前四项加入牌组；第五项仍随完整数组保存供下一次再生成使用。当前生成器本身不重置游标，游标归零与代次推进是本 session 在成功衔接新牌组时承担的编排政策。

## 4. 命令、原子回合与 draw 时间线

### 4.1 每轮命令

```ts
type Selection = { participantId: string; cardToken: string };
type Command = {
  type: 'ResolveRegeneratedDebateRound';
  expectedRevision: number; expectedRoundIndex: number; expectedFirstId: string;
  rethinks: string[]; choices: Pair<Selection>; rawDraws: RawDraw[];
};
```

expectedRevision/expectedRoundIndex 接受0..16整数且必须与当前 snapshot 匹配，expectedFirstId 也必须匹配。rethinks 必填，长度0..2，不得重复或包含场外 ID；请求顺序不决定实际动作顺序，但原输入顺序仍保存在 receipt.command。已终局不能推进，包括只想再考。

cardToken 中的两个数字必须用无前导零的十进制表示；代次语法接纳0..17，tapeIndex严格0..17。该语法上界不是已生成或可选的证明，最终仍须从本人当前 hand 找到这个 token；对方、未发、已弃、已消费的 occurrence不能选择，不能用数字牌码或语义牌模板代替 token。

`choices` 按 scenario 参与者顺序给出；实际前置再考与选牌按本轮 `firstId`→other 处理。先检查所有再考请求者的可用性；某方请求再考时，先弃旧手，完成它的一次跨代 fill，再从 replacement 选择并移除最终战斗牌，才处理另一方。不能先以旧手牌验证一个再考后的选择。

再考不独立推进 revision/roundIndex，不改变 HP/stress、话题、先手或攻击；动作局部 canRethink 从true变false。成功非终局只在崩坏层变化时于折叠下一轮开始恢复true，不是每轮重置。没有可单独保存的“已再考、未最终选牌”中间态。

### 4.2 原始 draw 的三种封闭分支

```ts
type FillPhase = 'genesis' | 'rethink' | 'refill';
type RepairDraw = {
  role: 'debate-fill-topic-repair'; bound: 9; value: number;
  participantId: string; phase: FillPhase;
};
type GenerationDraw = DebateDeckGenerateRawDrawV1 & {
  participantId: string; phase: FillPhase; generation: number;
};
type CombatDraw =
  | { role: 'psychological-damage-jitter'; bound: 5; value: number }
  | { role: 'sophistry-topic-reroll'; bound: 3; value: number };
type RawDraw = GenerationDraw | RepairDraw | CombatDraw;
```

生成 primitive 联合仍是三类小/中/大 topic role（bound3）、rhetoric-swap（bound1..5）、tail-fallback（bound9）、table-swap（bound18），精确拼写见[生成内核输入](debate-deck-generate-v1.md#2-完整输入与数字牌码)。每一项都带六键外层数据，不是只给整段一个 envelope。generation 指**将要生成的新代次**，对应完成后的 deckGeneration，不是旧代次、fill.sequence 或 generation.sequence。

修补恰有五键，不带 generation；战斗恰有三键，不带 participantId、phase或generation。向内核传参前，适配器先核对生成六键中的身份/阶段/代次，再只传 role/bound/value三键。嵌套 kernel.consumedDraws 保持三键，外层 consumedDraws 保留全部六键，不篡改旧内核 DTO。

所有数值必须为安全整数且不能为−0。领域消费时 repair.value为0..8，jitter.value为0..4，topic.value为0..2（story/logic/trend）；生成值则符合实际阶段的 `0<=value<bound`。安全结构与字段语法先检查，role、bound、value及归属的实际阶段语义在消费时检查；尚未到达的阶段不能躲过安全对象检查。

### 4.3 条件式时间线

一次成功轮的条件式消费顺序是：

1. first 方再考 fill 内，在实际耗尽点消费完整生成 draw，全部空位完成后才消费它的修补 draw。
2. other 方再考的对应生成和修补。
3. 实际所需战斗 jitter。
4. 非终局实际所需诡辩话题重抽。
5. scenario 第0方 refill 的生成和修补。
6. scenario 第1方 refill 的生成和修补。

未请求、未耗尽或不需要的阶段没有占位 draw。初局独立按 scenario 第0→第1方完成各自 fill，使用初局 draw 数组，不借用第0轮命令的 draw。每次生成 draw 的外层归属必须精确匹配参与者、阶段及目标新代次；普通 jitter/topic draw不因此接受生成元数据。

全局 draw 范围与嵌套生成器 drawIndex 不属于同一坐标系。完整生成收据保留内核从0开始的局部 drawIndex，含所有 placement、swap 和 consumedDraws；外层记录这次生成在初局或命令 draw 数组中的连续范围，以及 participant/phase/generation。不能把嵌套每条 swap 的 drawIndex 改成 session 全局下标，或以外层摘要替代完整内核收据。

战斗顺序仍是 Attack→胜者 Effect→败者 Effect→HP终局→非终局愤怒边界→崩坏→话题/先手→refill。HP终局不重抽话题、不补牌、不生成下一副，但已经完成的前置再考及其生成仍属于成功终局轮。非终局 stress100 在话题/补牌前拒绝整轮，不先消费那些未来阶段的 draw。

成功要求恰好消费全部提供 draw。多余的下一副生成流、终局后补牌流或不需要的修补都不是可保留供下一轮使用的尾流。失败不提交任何已拟议再考、生成后的话术数组、代次、游标、发牌、修补、选择、战斗、资格恢复或历史记录；不返回可继续采用的前缀 session。

## 5. 状态与完整审计 DTO

### 5.1 当前牌组检查点与 snapshot

```ts
type DeckCheckpoint = {
  deck: CardCode[]; deckCursor: number; deckGeneration: number;
  rhetoricCards: RhetoricCardCode[];
};
type ParticipantState = DeckCheckpoint & {
  id: string; resolvedIntelligence: number; attack: number;
  hp: number; stress: number; angerTimer: 0;
  sourceSlotCount: number; playableHandCapacity: number;
  reservedRethinkSlot: true; canRethink: boolean; crumbledLevel: number;
  hand: Occurrence[];
};
type Outcome = { kind: 'hp-defeat'; winnerId: string; loserId: string };
type Snapshot = {
  schemaVersion: 1; profile: 'debate-regenerated-deck-reference-v1';
  revision: number; roundIndex: number; currentTopic: Topic; firstId: string;
  status: 'active' | 'finished'; outcome: Outcome | null;
  participants: Pair<ParticipantState>;
};
```

输入 Participant.cardTape 与连续状态 DeckCheckpoint.deck 的字段名不同；deck始终是当前代的完整18项，不能改成只保存未发后缀。deckCursor指下一未发项，可为0..18；deckGeneration是该方当前牌组代次，不是当前所有手牌的共同代次。

genesis开始时代次0，但初局填牌若触发再生成，成功 genesis.snapshot 中该方代次已是1。初局 revision/roundIndex=0、canRethink=true、crumbledLevel=0；每轮成功计数各加1。active成功状态 HP>0且stress<100，双方手牌补满；终局不补本轮消费的牌，手牌可以没有普通牌。

attack=`100+trunc(40*(myINT-opponentINT)/(131-myINT))`；HP clamp −100..1000、stress clamp0..100。非终局崩坏层为 `clamp(trunc((1000-hp)/250),0,3)`，只有层变化恢复再考。终局不再算崩坏或恢复资格，话题/先手保持轮开始值，但此前已发生的再考与生成不会从成功终局中删除。

### 5.2 一次 generation 与混代 fill

```ts
type Generation = {
  sequence: number; participantId: string; phase: FillPhase; generation: number;
  before: DeckCheckpoint; after: DeckCheckpoint;
  drawStartIndex: number; drawEndIndexExclusive: number;
  kernel: DebateDeckGenerateReceiptV1;
};
type FillSlot = {
  preSortSlot: number; origin: 'reserved-rethink' | 'retained' | 'deck';
  token: string | null; deckGeneration: number | null; tapeIndex: number | null;
  originalCard: 0 | CardCode; card: 0 | CardCode; topicRepairApplied: boolean;
};
type CompletionRepair =
  | { status: 'applied'; preSortSlot: number; beforeCard: CardCode;
      afterCard: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
      drawIndex: 0; rawValue: number }
  | { status: 'skipped'; reason: 'topic-present' | 'no-new-slot' };
type FillCompletion = {
  hand: [0, ...CardCode[]]; postFillHand: [0, ...CardCode[]];
  preSortHand: [0, ...CardCode[]]; topicCardCountAfterFill: number;
  lastNewSlot: number | null; repair: CompletionRepair;
  consumedDraws: { role: 'debate-fill-topic-repair'; bound: 9; value: number }[];
  drawCount: 0 | 1; sortedProvenance: (FillSlot & { sortedIndex: number })[];
};
type Fill = {
  sequence: number; phase: FillPhase; participantId: string;
  beforeCards: Occurrence[]; afterCards: Occurrence[]; drawnCards: Occurrence[];
  beforeDeck: DeckCheckpoint; afterDeck: DeckCheckpoint; generations: Generation[];
  completion: FillCompletion;
  drawStartIndex: number; drawEndIndexExclusive: number;
  repairDrawIndex: number | null; generationDrawCount: number; repairDrawCount: 0 | 1;
};
```

Generation.sequence是**所属 Fill.generations** 内部从0开始的紧凑索引，不是整轮第几个生成，也不是牌组代次。当前受限容量下该数组至多一项；审计仍保留数组结构。before截在实际耗尽点，因此其deckCursor=18；若本fill先发旧代后缀，它不等于Fill.beforeDeck。after截在生成成功、cursor归零且尚未取新牌之时，故deckCursor=0；Fill.afterDeck才包含同一次fill随后取出的新牌数量。

Generation的范围为半开区间 `[drawStartIndex,drawEndIndexExclusive)`，长度等于kernel.drawCounts.total。kernel完整保留独立生成器的policy/evidence、before/after、14项topicPlacements、2000或0项rhetoricSwaps、4项tailPlacements、preShuffleDeck、2000项tableSwaps、全部consumedDraws/drawCounts及 `cursorEffect:'not-read-or-written'`。这个字面值不改成session的cursor归零，因为两层责任不同。

Fill.sequence是所在genesis.fills或receipt.fills数组的紧凑索引。genesis固定第0、第1方两条；回合先列实际请求者的rethink fill，再于非终局列scenario第0、第1方refill。Fill.generations只含该fill中发生的生成，不在receipt顶层额外建立另一个generation列表。

Fill的半开draw区间包含其生成与末尾修补，区间长度为generationDrawCount+repairDrawCount。不消费draw时start=end，不能把空区间写成null。repairDrawIndex只在真正修补时指全局索引，否则为null；completion.repair.drawIndex仍局部0，completion.consumedDraws只含三键修补draw，不含生成primitive。

FillCompletion不是旧 `DebateHandFillReceiptV1`：它没有虚构的单一cardTape/cursor输入，也不带自己的profile/policy/evidence。真正跨代信息由beforeDeck/afterDeck、generation完整收据及每槽deckGeneration/tapeIndex/token承载。

postFillHand为全部空位已填完、尚未修补的原槽顺序；preSortHand为修补后、排序前原槽顺序；hand才是最终数字升序。三个数组都保留0槽，sortedProvenance也保留reserved-rethink项，其token、deckGeneration、tapeIndex均null、originalCard/card均0。session.hand不生成对应token。

每个非保留0槽的originalCard为本次完成逻辑之前的牌面；card是修补后的牌面。retained项携带原occurrence身份，deck项携带实际发牌代次和下标；修补仅改变最后新增项card/topicRepairApplied。已经在更早fill修补过的保留牌，本次originalCard是它当前牌面，不回溯成最早牌组原值。

afterCards按最终数字顺序；drawnCards仅列本次新发牌，按原填槽顺序，带修补后的cardCode，不包括保留牌或0。不能把drawnCards当作排序后的整手，或把其修补后牌面与当前deck原项不同当成token失效。初局与再考beforeCards=[]；refill.beforeCards是选牌移除后压紧的幸存牌。

### 5.3 再考与整轮变化

```ts
type Rethink = {
  sequence: 0 | 1; participantId: string;
  discardedCards: Occurrence[]; replacementCards: Occurrence[];
  beforeDeck: DeckCheckpoint; afterDeck: DeckCheckpoint;
  beforeCanRethink: true; afterCanRethink: false; fillSequence: number;
};
type StressStage = {
  beforeStress: number; requestedStress: number; afterStress: number; actualStressDelta: number;
};
type Change = {
  participantId: string;
  beforeHp: number; afterHp: number; requestedHpDamage: number; actualHpDelta: number;
  beforeStress: number; afterStress: number; requestedStress: number; actualStressDelta: number;
  attackStress: StressStage; effectStress: StressStage;
  beforeCanRethink: boolean; afterCanRethink: boolean;
  rethinkRefreshReason: 'crumble-level-changed' | 'no-crumble-change' | 'terminal-no-next-turn';
  beforeCrumbledLevel: number; afterCrumbledLevel: number;
  consumedCard: Occurrence; refilledCards: Occurrence[];
  beforeDeck: DeckCheckpoint; afterDeck: DeckCheckpoint;
};
type TopicReroll =
  | { status: 'applied'; drawIndex: number; rawValue: number;
      beforeTopic: Topic; afterTopic: Topic; sophistryOwnerId: string; opponentId: string }
  | { status: 'skipped'; reason: 'terminal' | 'equal-card-power' | 'no-sophistry' | 'opponent-ignore' };
```

Rethink按实际source-first动作顺序，sequence在rethinks数组内紧凑计数，只有other请求时也从0开始。discardedCards是被弃旧手；replacementCards是完成排序后的整手，包含随后可能立即选出的牌。beforeDeck/afterDeck跨越该次再考fill，afterDeck截在最终选牌之前；fillSequence连接对应fill。afterCanRethink=false只描述动作局部，不能被同轮崩坏导致最终重新获得资格所覆盖。

Change的beforeDeck/afterDeck横跨整轮，不是简单cursor差。游标在再生成时重置，不能用afterCursor−beforeCursor计算发牌数；应读实际fill.drawnCards及generation审计。refilledCards只列回合末新牌，不包含rethink replacement；终局refilledCards=[]，但before/afterDeck仍可能因前置再考发生变化。consumedCard是本轮最终所选数值occurrence。

requestedStress汇总实际target的Attack和Effect请求，不等于clamp后的actualStressDelta，不把suppressed的null请求算成假想值。TopicReroll.drawIndex是命令rawDraws全局下标，已包含此前再考的生成与修补偏移；相同话题重抽仍是applied。

### 5.4 不变的共用战斗审计

```ts
type RegeneratedDebatePlayV1 = RethinkDebatePlayV1;
type RegeneratedDebateDamageV1 = RethinkDebateDamageV1;
type RegeneratedDebateEffectV1 = RethinkDebateEffectV1;
type RegeneratedDebateOutcomeV1 = RethinkDebateOutcomeV1;
```

这些精确类型别名保留 [Rethink API](rethink-debate-session-v1.md#26-play-与-damage) 的封闭分支，不是任意record。plays/damage中的语义牌仍为 `{kind:'topic',topic,level,token,tapeIndex}` 或话术 `{kind,token,tapeIndex}`，**不新增deckGeneration字段**；代次已在token内，数值occurrence另有显式deckGeneration。不能把两类牌对象混用或借本profile改写旧共用DTO。

- Play：`{participantId,card,attack,power,matchesCurrentTopic}`。普通power1..3、匹配轮开始话题另加10；大喝110、无视120、诡辩20、镇静/激昂0。等power始终平局，不由firstId破平。
- Damage：保留sourceId/cardOwnerId/targetId、attack/jitter、系数、轮开始话题、HP/stress请求，以及topic、shout、reflected-topic各自sourceCard/card/reflected/writer/positiveHpGuard/writerApplied分支。平局、无视及诡辩胜镇静/激昂时为null。
- Effect：公共sequence0或1、actorId/opponentId，分applied compose、applied agitate、no-additional-effect和suppressed-by-ignore。保留invoked、target/reflected、requestBasis与before/after/requested/actual值及其null语义。平局effects=[]；其他轮按胜者再败者审计，无视抑制败者Effect。

HP请求为 `trunc((attack+jitter)*10*levelCoefficient*topicCoefficient/1000)`，内部使用精确bigint、除法向零。诡辩胜普通牌使用诡辩方attack和败方普通牌系数，反射给败方，其正HP伤害guard同时控制HP与Attack stress写入。

平局双方各请求stress+15。镇静请求始终按对手当前stress取 `-max(trunc(stress/2),30)`，反射只改变writer target；激昂请求+40。逐次writer各自clamp，不以净请求代替。即使败者HP已<=0，仍先执行未被抑制的败者Effect再判终局。非终局诡辩即使败给大喝仍重抽话题；对方无视、等power或终局不重抽。

plays/changes按scenario顺序，orderedIds为轮开始first/other，rethinks/fills为实际动作顺序，effects为胜/败审计顺序。这些顺序不能互换。

### 5.5 receipt、genesis、entry 与 session

```ts
type Receipt = {
  schemaVersion: 1; profile: 'debate-regenerated-deck-reference-v1';
  command: Command; policy: RegeneratedDebatePolicyV1; evidence: RegeneratedDebateEvidenceV1;
  beforeRevision: number; afterRevision: number;
  beforeRoundIndex: number; afterRoundIndex: number;
  beforeFirstId: string; afterFirstId: string; beforeTopic: Topic; afterTopic: Topic;
  orderedIds: Pair<string>; rethinks: Rethink[]; fills: Fill[];
  plays: Pair<RegeneratedDebatePlayV1>; result: 'winner' | 'draw'; roundWinnerId: string | null;
  damage: RegeneratedDebateDamageV1 | null; effects: RegeneratedDebateEffectV1[];
  effectOrder: 'winner-then-loser-audit-slots' | 'none-equal-card-power';
  effectSkipReason: 'equal-card-power' | 'ignore-suppresses-loser-effect' | null;
  changes: Pair<Change>; consumedDraws: RawDraw[];
  attackDrawCount: 0 | 1;
  attackNoDrawReason: 'equal-card-power' | 'ignore-no-hp-damage' | 'sophistry-opponent-not-topic' | null;
  topicDrawCount: 0 | 1; generationDrawCount: number; repairDrawCount: number;
  fillDrawCount: number; drawCount: number; topicReroll: TopicReroll;
  terminal: boolean; crumbleEvaluated: boolean; refillApplied: boolean; outcome: Outcome | null;
};
type Genesis = { scenario: Scenario; snapshot: Snapshot; fills: Fill[]; consumedDraws: RawDraw[] };
type Entry = { command: Command; receipt: Receipt };
type Session = {
  tag: 'regenerated-debate-session-v1';
  policy: RegeneratedDebatePolicyV1; evidence: RegeneratedDebateEvidenceV1;
  genesis: Genesis; snapshot: Snapshot; entries: Entry[];
};
```

generationDrawCount统计primitive draw数量，不是生成次数；repairDrawCount统计实际修补次数。`fillDrawCount=generationDrawCount+repairDrawCount`，这里与旧Filled中仅统计修补的同名字段语义不同，因此必须保留独立profile。

`drawCount=attackDrawCount+topicDrawCount+fillDrawCount=consumedDraws.length`。这些回合计数都不包含genesis。成功consumedDraws与command.rawDraws全字段、顺序一致。attackNoDrawReason只解释战斗阶段，不表示整轮没有生成/修补/topic draw。

终局terminal=true、crumbleEvaluated/refillApplied=false、topicDrawCount=0；fills仍可能包含前置再考及其generation，不能固定为空。非终局terminal=false、crumbleEvaluated/refillApplied=true。无视胜可以damage=null但result=winner；平局roundWinnerId=null、effects=[]，两者仍可能进行非终局fill。

### 5.6 精确导出名与结果类型

本页短名与导出名对应如下：

| 短名 | 精确导出名 |
|---|---|
| Topic / CardCode / RhetoricCardCode / Occurrence | RegeneratedDebateTopicV1 / RegeneratedDebateCardCodeV1 / RegeneratedDebateRhetoricCardCodeV1 / RegeneratedDebateCardOccurrenceV1 |
| DeckCheckpoint / Participant / ParticipantState | RegeneratedDebateDeckCheckpointV1 / RegeneratedDebateParticipantV1 / RegeneratedDebateParticipantStateV1 |
| Scenario / Snapshot / Command / Selection | RegeneratedDebateScenarioV1 / RegeneratedDebateSnapshotV1 / RegeneratedDebateCommandV1 / RegeneratedDebateSelectionV1 |
| FillPhase / RepairDraw / GenerationDraw / CombatDraw / RawDraw | RegeneratedDebateFillPhaseV1 / RegeneratedDebateRepairDrawV1 / RegeneratedDebateGenerationDrawV1 / RegeneratedDebateCombatDrawV1 / RegeneratedDebateRawDrawV1 |
| Fill / FillSlot / FillCompletion / Generation / Rethink | RegeneratedDebateFillV1 / RegeneratedDebateFillSlotV1 / RegeneratedDebateFillCompletionV1 / RegeneratedDebateGenerationV1 / RegeneratedDebateRethinkV1 |
| StressStage / Change / TopicReroll / Receipt | RegeneratedDebateStressStageV1 / RegeneratedDebateChangeV1 / RegeneratedDebateTopicRerollV1 / RegeneratedDebateReceiptV1 |
| Entry / Genesis / Session | RegeneratedDebateEntryV1 / RegeneratedDebateGenesisV1 / RegeneratedDebateSessionV1 |

另有§5.4的Play/Damage/Effect/Outcome四个精确别名。Policy/Evidence导出类型分别为 `RegeneratedDebatePolicyV1` / `RegeneratedDebateEvidenceV1`，是固定字面值的递归readonly类型，不是可配置map。本文CompletionRepair仅是展开说明，没有同名 `RegeneratedDebateCompletionRepairV1` 导出；也没有新导出的语义Card或Level模板。

```ts
type RegeneratedDebateFailureV1 = { ok: false; reason: string; index: number | null };
type RegeneratedDebateSessionResultV1 =
  | { ok: true; session: RegeneratedDebateSessionV1 } | RegeneratedDebateFailureV1;
type RegeneratedDebateExecuteResultV1 =
  | { ok: true; session: RegeneratedDebateSessionV1; receipt: RegeneratedDebateReceiptV1 }
  | RegeneratedDebateFailureV1;
type RegeneratedDebatePreviewResultV1 =
  | { ok: true; preview: {
      receipt: RegeneratedDebateReceiptV1; projectedSnapshot: RegeneratedDebateSnapshotV1;
      policy: RegeneratedDebatePolicyV1; evidence: RegeneratedDebateEvidenceV1; externalRngConsumed: 0;
    } }
  | RegeneratedDebateFailureV1;
type RegeneratedDebateSaveResultV1 = { ok: true; json: string } | RegeneratedDebateFailureV1;
type RegeneratedDebateInspectionResultV1 =
  | { ok: true; inspection: {
      snapshot: RegeneratedDebateSnapshotV1;
      policy: RegeneratedDebatePolicyV1; evidence: RegeneratedDebateEvidenceV1;
      entryCount: number; remainingEntryCapacity: number; canonicalUtf8Bytes: number;
    } }
  | RegeneratedDebateFailureV1;
type RegeneratedDebateReplayResultV1 = RegeneratedDebateSessionResultV1;
```

以上同样省略递归readonly。load返回SessionResult；replay返回完整session，receipts在entries里，不另返回前缀或receipt数组。reason公开类型是string，不是封闭错误枚举。

## 6. 重算、保存与资源边界

保存和检查必须保留并重算完整 genesis 与 entry 历史，不信任调用者现成 snapshot 或压缩摘要。除手牌和战斗状态外，当前完整18张牌组、游标、代次和完整话术数组都是连续状态；遗漏任何一项都会改变下一次耗尽后的行为。

save返回对象键排序、数组保序的canonical JSON。load仅接受字符串，先检查原始UTF-8字节预算，再解析、安全分离并检查完整tag/policy/evidence，以genesis.scenario重新构建初局，逐字段比较完整genesis；随后按历史顺序重算每个entry.command、比较完整receipt，最后比较snapshot。inspect/preview/execute/save也走完整历史重算。

每次重算以最初提供式检查点为起点，按实际生成顺序重建每代完整生成收据、跨代发牌身份、一次最终修补/排序、战斗及最终 snapshot。外层归属/global range、内核 local index、未选入牌组的第五张话术、修补前原牌码和修补后 occurrence 都属于比较范围。

存档是确定性可重算合同，不是签名或原作真实性证明。调用者能够构造一条内部一致的合成历史，不代表它来自原生游戏。旧 profile/tag 的存档不能隐式迁移，新 profile 也不接受旧 token 语法伪装成跨代 occurrence。

固定预算按完整数据而不是摘要计量：

| 范围 | 固定限额 |
|---|---:|
| 历史entries / replay命令数 | 16 |
| 输入cardTape / 连续状态deck | 恰好18项 |
| 有序rhetoricCards | 0..5项，互异 |
| genesisRawDraws / 单轮rawDraws | 最多8036 / 8040项 |
| canonical完整Session UTF-8 bytes | 33,554,432，即32 MiB |
| 输入值节点数 / 嵌套深度 | 2,000,000 / 32 |
| 安全分离通用数组长度 | 8192，再按领域收紧 |

完整生成收据中的每条交换、draw，以及全部历史、政策、证据和occurrence都计入拟议Session。独立生成内核自己的输入预算仍独立执行；共享完成helper不是放宽旧hand-fill公开输入预算的通道，旧hand-fill本身不接收本session的混代fill。

每方初局最多发6张；每轮每方最多前置再考6张再加非终局 refill 1张。生成一次后获得18张，所以上述一次初局或一轮内每方最多生成一次，总共最多两次。生成原始 draw 最坏为两次4017；另加初局最多两次修补得到8036，或回合最多四次修补及两次战斗/话题 draw得到8040。这是保守输入容量上界，不断言每个极值可在同一可达回合同时实现。

remainingEntryCapacity=`16-entryCount`，不是还可成功推进的轮数保证。字节/节点预算、再考资格、终局或愤怒边界可能更早阻止推进。preview、execute和replay同样须检查**完整拟议追加Session envelope**，不能仅检查旧session或独立receipt；大收据可以在达到16条以前触发原子拒绝。

这个envelope准确指Session，不是外层ExecuteResult中重复携带receipt后的wrapper，也不是PreviewResult wrapper；这些结果wrapper不能作为Session再次提交。inspection.canonicalUtf8Bytes计量canonical完整Session。load还检查原始JSON字节数；replay累计commands输入的节点/字节预算，并逐次检查完整追加Session。预算拒绝不是游戏平局，也不能通过省略交换审计、截断话术数组或隐藏历史来继续。

## 7. 安全数据、拒绝原因与 index

### 7.1 严格安全分离与封闭合同

只接收Object.prototype/null原型record、标准Array及合法JSON式标量。字段须为可枚举数据属性；拒绝Proxy、getter/setter、函数、undefined、外部BigInt、Symbol、Date/custom prototype、循环、稀疏数组、额外array属性、不可枚举record字段及不安全整数。不会调用调用者getter、toJSON或custom iterator。所有数值，包括尚未到达阶段的draw，都不能为−0或非安全整数。

Proxy检测依赖 `process.getBuiltinModule('node:util').types.isProxy`；缺少安全检测时拒绝 `unsupported-runtime`，不降级为不安全反射。这是接口的代码要求，不是已验证Node/浏览器兼容性声明。

输入scenario/participant/command/draw及session外层使用登记字段集合，无缺省键或开放扩展字典。genesis/fill/generation/completion/receipt/snapshot等完整审计经安全分离后与重算值比较，增删或改动任意字段也不能通过；它们的拒绝可能是invalid-genesis、receipt-mismatch或snapshot-mismatch，而不是把每个嵌套值单独解析成unknown-field。

### 7.2 当前失败合同

| reason | 条件 |
|---|---|
| `malformed-data` / `unknown-field` | 缺字段、非法类型/整数/−0、不安全对象或描述符、JSON解析失败；或严格解析对象出现未登记字段 |
| `unsupported-runtime` | 无安全Proxy检测入口，拒绝不安全降级 |
| `unsupported-profile` | schemaVersion/profile/difficulty/tag不符，包括旧session直接提交 |
| `unsupported-policy` / `evidence-mismatch` | 完整固定policy或外层evidence不匹配 |
| `unsupported-person` / `unsupported-item` | 非genericOnly、非法ID，或被排除的人物/物品字段 |
| `unsupported-initial-state` | 初值不是HP1000、stress0、angerTimer0 |
| `invalid-card-tape` / `unsupported-card-code` | cardTape不是恰好18项，或分离后的牌码不在1..14 |
| `invalid-deck-cursor` | initialDeckCursor不在0..18，或内部发牌/生成游标一致性保护 |
| `invalid-rhetoric-cards` | rhetoricCards不是数组、超过5项、含10..14以外值或重复 |
| `unsupported-card` / `unsupported-action` | initialTopic非法/共用战斗不支持该牌种，或命令不是ResolveRegeneratedDebateRound |
| `duplicate-participant` / `invalid-challenger` | scenario或choices重复参与者，或challenger不属于本场 |
| `invalid-token` / `duplicate-token` / `not-in-hand` / `invalid-choice-order` | token语法或范围非法、重复、最终选择时不在本人手中，或choices未按scenario顺序 |
| `invalid-rethink-participant` / `duplicate-rethink-participant` / `rethink-unavailable` | 再考请求者场外、重复或当前不可用 |
| `stale-revision` / `stale-round` / `stale-first` | expected值与当前snapshot不同 |
| `session-finished` | 已终局仍请求推进 |
| `draw-shape` | 初局/回合draw数组类型或领域长度非法；实际生成片段身份/阶段/目标代次错误或出现非生成项；修补role/归属/阶段错误；所需战斗draw缺失或role/bound顺序错误 |
| `draw-range` | 实际战斗draw的安全整数value越出jitter0..4或topic0..2 |
| `missing-raw-draw` | 实际生成时剩余全局项不足该次必需primitive片段长度，或实际修补时无下一项 |
| `invalid-raw-draw` | 外层归属可接受但生成primitive的role/bound/value被内核拒绝，或修补bound/value语义非法 |
| `unexpected-raw-draw` | 所有实际到达阶段结束后仍有未消费项，包括满手/终局预供的下一副生成或修补抽样 |
| `unsupported-anger-trigger` | Attack及全部Effect后尚未HP终局且stress达到100，整轮拒绝 |
| `invalid-fill-provenance` | 内部完成审计不能映回原保留槽或新occurrence的一致性保护，不是额外调用方字段 |
| `history-limit` | entries/commands、字节、节点、深度或数组等session预算超限 |
| `input-limit` | 独立生成内核的输入预算失败，原样传播，不改成游戏结果 |
| `invalid-genesis` / `receipt-mismatch` / `snapshot-mismatch` | 完整初局、某条完整receipt或最终snapshot与重算值不等 |

人物排除字段包括personId/person/personHooks/characterId；物品包括items/item/equipment/weapon/sword。这些错误由严格对象解析时的排除键识别产生，不代表支持读取真实人物或物品状态。非法rethinks数组或长度>2是malformed-data；请求ID自身语法非法仍为unsupported-person。

rawDraw语法根据role选择键集合：以 `debate-deck-` 开头的项要求六键生成形状，精确repair role要求五键，其他项要求三键。陌生生成role在正确六键形状下可到内核才报invalid-raw-draw；任意陌生role附带未登记元数据可先报unknown-field。仅为string的participantId/phase、仅为安全整数的generation通过语法，不代表它们匹配实际消费阶段。

一次生成先按当前话术长度取得**固定所需数量**的全局片段，然后检查该片段所有项的外层归属，再交内核检查primitive。若删除最后一项生成draw，但后面仍有repair补足片段长度，可能是draw-shape而不是missing-raw-draw；只有剩余总片段不足才在该步骤报missing-raw-draw。文档不承诺所有多错输入的统一错误优先级。

新profile支持本合同中的实际再生成与修补，不用旧 `unsupported-deck-regeneration` 或 `unsupported-topic-repair` 作为正常耗尽/修补拒绝。它仍不承诺无限回合，亦不接受不在本合同范围内的原生状态。

### 7.3 失败定位与原子性

- create、直接preview/execute新命令失败通常index=null，包括新轮生成、修补和战斗错误。
- inspect/save/load/preview/execute先分离整个session。能定位的entries内部安全结构错误带0-based index；外层数组或描述符错误可能为null，较后entry结构错误也可能先于较前entry领域错误出现。
- 安全分离后按历史顺序重算，首个失败entry为0-based index；invalid-genesis与最终snapshot-mismatch为null。
- replay的scenario（含初局填牌/生成）或外层commands列表错误index=−1；之后逐条安全分离、解析和追加，首个失败命令为0-based index。不预先读取后续命令内部值，但外层洞/额外属性/长度可先报−1。
- 所有失败均不返回部分结果；index仅定位失败输入或历史，不表示该index以前的前缀已经提交。缺draw、错误归属或预算失败不会推进任何调用者外部RNG。

## 8. 来源范围与未覆盖项

现代来源固定 commit `a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef`，属于现代 C# 翻译参考，不是原生 PK/Vanilla 实测。生成、来源填牌循环以及六类普通战斗各自的引用与工程编排界线见[规则页](../rules/regenerated-debate-session-v1.md)及[来源账本](../sources/regenerated-debate-session-v1.json)。

`nativeEquivalent`、`stockOriginalVerified`、`pkEquivalent`、`vanillaEquivalent`、`completeDebate` 均保持 false。原43证据主题与45历史快照仍开放，不因这个新子集减少；E15普通通用公式的证据也不外推为随机全链或原生完全等价。

本合同不实现 DeckInit、原生 PRNG/seed 连续链、原生资格或概率认证、教程、四性格愤激与自动反制、额外消耗、连打/timer、冷静愤激再考/大牌覆写、真实人物/书籍/MOD hooks、开场/追击、campaign或外交自动结算。P078/native人员任务及其依赖、俘虏/处斩/归属、return/mission继续排除。

配套纸面材料不是执行生成的 receipt，不是通过的测试，也不是已验证存档。材料中的说明、预期或拒绝候选不属于严格 scenario DTO，不能把整个说明文件当成 API 参数。

## 9. 纸面材料的阅读边界

[配套文件](../../data/scenarios/regenerated-debate-example-v1.json)给出完整主scenario、三条commands、一个独立HP终局scenario和三条commands，以及人工预期、拒绝变更说明和两个紧凑阶段配方。只有其中的scenario及单条command是直接API输入；paperGenesis、paperRounds、paperExpected、说明和compactPhaseRecipes都不是DTO或运行收据。

主例以双方INT1开始。A检查点cursor17、旧牌组全10、完整话术数组 `[10,11,12,13,14]`；初局先拿旧代第17项，再生成第1代并拿第0、1项。生成的完整话术数组为 `[14,11,12,13,10]`，第五项10仍保存但未复制进新牌组；旧手中的10则来自独立token `A:0:17`。

本次A的修补前原槽数组为 `[0,10,14,11]`，全部空位完成后才用value0把最后新增槽的11改成1。排序后手牌为1/10/14，token依次为 `A:1:1`、`A:0:17`、`A:1:0`，当前代1、游标2。生成primitive占全局 `[0,4014)`，修补在4014，初局共4015项；这展示混代身份、完整第五项话术留存及不提前修补，不能当成一次已执行成功的证明。

三轮主命令的人工推导保留既有战斗顺序：首轮普通小牌平局后修补A的refill；第二轮B普通牌胜A激昂，A为HP900/stress65；第三轮B再胜A镇静，镇静写向对手B，最终A为HP800/stress75、B为HP1000/stress0。这些是纸面选定字段，不是完整receipt替代品。

独立终局例让A的游标在前两轮非终局补牌后依次到17、18，第三轮HP终局仍停18，不请求生成。文件另列：再考时先2018项生成再jitter的配方，以及回合末先jitter再2018项生成的配方。两者均明确为human-recipe-not-an-API-input，未展开成已验证的回合历史。

拒绝说明分别讨论截断生成片段但仍留repair、错误新代次、提前repair、缺少最终repair、终局多供生成draw和混淆旧/新代token。所列错误理由来自当前源码的静态分支阅读，不来自测试、validator、replay或其他执行。
