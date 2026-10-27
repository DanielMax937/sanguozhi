# 支持按需再生成的有界舌战单回合 API v2

[规则](../rules/debate-regenerated-round-v2.md) · [来源映射](../sources/debate-regenerated-round-v2.json) · [v1 合同](debate-round-transaction-v1.md) · [实现](../../packages/engine/src/debate-regenerated-round.ts) · [未运行纸面场景](../../data/scenarios/debate-regenerated-round-paper-v2.json)

这是独立单回合工程版本，不是长会话。它复用受检出牌、再考、普通攻击、愤怒、TurnEnd、TurnStart与终局分类逻辑，新增“实际补牌遇到当前堆耗尽时”的生成支持。到 `ready-for-play` 或 `closing-pending` 停止；不执行 Closing。

> 仅静态实现与纸面说明，不代表测试、编译或运行兼容性通过。

## 1. 独立版本与输入

公共入口采用 `input: unknown`，安全分离完整输入后才调用领域逻辑；不接受用户函数或回调。入口为 `evaluateDebateRegeneratedRound(input: unknown): DebateRegeneratedRoundResultV2`，导出完整 `DEBATE_REGENERATED_ROUND_POLICY_V2`、`DEBATE_REGENERATED_ROUND_EVIDENCE_V2` 和 Input/Success/Failure/Result V2 类型。不得把 v2 事务或再生成收据伪装成原有“耗尽即拒绝”的 v1 成功结果。

```ts
{
  schemaVersion: 2,
  profile: 'debate-regenerated-round-reference-v2',
  policies: DEBATE_REGENERATED_ROUND_POLICY_V2,
  round: RoundInputV1WithoutVersionMetadata,
  rhetoricCards: [RhetoricCard[], RhetoricCard[]],
  generationPackets: {
    rethink: [GenerateDraw[] | null, GenerateDraw[] | null],
    turnStart: [GenerateDraw[] | null, GenerateDraw[] | null]
  }
}
```

顶层恰以上六个字段。`round` 是 [v1 完整输入](debate-round-transaction-v1.md#1-完整输入) 去掉 `schemaVersion`、`profile`、`policies` 后的十四个字段；不是 v1 成功 state，不是只传发生变化的字段。所有原有输入域继续成立：

- `genericOnly:true`、非教程、初始 `winner:-1`、两队初始 HP 为 1..1000、非活动 combo；
- `firstTeam` 为 0/1、话题 0..2、七个物理手牌槽、容量 4..7、初始槽0为再考牌0，其他活动槽均为1..14；
- 完整当前18项牌堆和游标0..18；没有“游标18即自动换堆”的预处理；
- 调用者提供已解析 personality、strength、resolvedAttack、额度、崩坏、有限选牌计划以及原各阶段抽样；
- 每队至多一次再考；普通 attacker 和最终普通 playedCard 继续独立于 combo.attacker／连打牌；
- 终局显式 choice 的门槛与映射沿用原终局分类核，非终局 choice 必须 null。

### 1.1 有序话术池

`rhetoricCards` 按队号，不按先后手顺序。每队0..5项、值为10..14、不得重复，原顺序有意义：生成核对当前池进行来源规定的交换，并返回真实的新顺序。不得排序、初始化为固定顺序、根据人物或书籍补出缺项，也不能只保留本次放入牌堆尾部的最多4项。资格由调用者供给，不验证人物／书籍资格或原生可达性。

### 1.2 分阶段生成包

- `rethink[team]` 仅供该队本轮再考补牌；`turnStart[team]` 仅供该队本轮最终 TurnStart 补牌。
- `null` 表示没有包。非 null 的空数组是“提供了空包”，不等于缺省。
- 每队两阶段最多一项非 null；整轮最多两包，每包至多4017项。
- 全部包的结构、角色、bound、value域在任何领域工作前完整检查；实际调用生成时，由原生成核继续核验需求顺序、角色及实际数量。
- 错阶段包不能被另一阶段借用。未到达的阶段或未真正需要生成时，其包必须为 null；缺包、多余包、错误包均整笔拒绝。

生成 draw 的原始形状与语义：

|role|bound|value|
|---|---|---|
|`debate-deck-small-topic` / `debate-deck-medium-topic` / `debate-deck-large-topic`|3|0..2|
|`debate-deck-rhetoric-swap`|1..5|0..bound−1；实际bound还须等于当次池长度|
|`debate-deck-tail-fallback`|9|0..8|
|`debate-deck-table-swap`|18|0..17|

所有数字为安全整数，拒绝负零、NaN、Infinity、小数和不安全整数；不从单个seed或外部RNG生成抽样。

## 2. 共享逻辑及版本边界

六个非会话核（含单回合主组合）使用同一份领域解析流程，通过受信内部组合接口替换填牌依赖。内部闭包由代码提供，不从公共输入取得。

|共享实现|复用范围|v2差异|
|---|---|---|
|`debate-rethink-action.ts`|清活动槽→填牌→冷静加成→额度写入／来源追踪|填牌返回实际当前／新牌堆及完整再生成审计|
|`debate-checked-play.ts`|先手完整计划→后手、可用性→移牌→再考→重选→普通攻击方|再考调用共享内部主体，不复制整套出牌resolver|
|`debate-turn-start.ts`|每队重置牌／额度→填牌→大胆检查→清崩坏，队0先于队1|使用新的受信填牌实现并带回实际牌堆|
|`debate-round-transition.ts`|timer→先手／话题→一次TurnStart|只替换内部TurnStart依赖；普通attacker语义不变|
|`debate-anger-transition.ts`|原愤怒核→终局门→非终局衔接、权威状态覆盖|仅非终局调用新的共享衔接路径|
|`debate-round-transaction.ts`|出牌→Attack/Effect/CalcWinner→愤怒或终局分类|共享主组合体；v2独立政策与输出包装|
|`debate-regenerated-fill-internal.ts`|实际空槽抽牌及跨界、完整来源跟踪|直接调用原生成核；最后仅一次公共内部completion|

原 v1 公共入口仍使用原当前堆填牌依赖、原输入政策和失败结构，并恢复原版本元数据；这属于静态代码保持目标，不等同于已运行兼容测试。不得写“全部现有核源码未变”。旧九会话实现、会话状态和存档格式不改。

## 3. 按需生成的精确顺序

整轮事件顺序：**先手再考 → 后手再考 → 普通攻击 → 两遍愤怒 → TurnEnd话题 → team0补牌 → team1补牌**。

每次填牌：

1. 保存完整当前牌堆、游标、有序话术池和原物理槽。按原始槽序处理，保留牌不消费牌堆；槽0恢复为0。
2. 只有实际遇到空槽并且游标恰18，才取该阶段生成包调用 `evaluateDebateDeckGenerate`。先生成成功，随后才用真实生成结果替换牌堆和话术池，并将游标18置0。
3. 为该空槽抽一张，游标加1。跨界前旧堆剩余牌不得跳过；不能提前换堆、回绕、拼接伪牌堆或把同次填牌拆成两次已有补牌调用。
4. **全部空槽填完后**恰一次 `completeDebateHandFill`：按原规则统计普通牌、必要时只改最后新增槽，然后对完整手牌排序。无新槽不修补；不允许跨界中途修补／排序。
5. 保存当前／新堆来源、tapeIndex、原牌面和修补后的牌面、完整生成交换收据与最终completion。返回内部成功后才供该轮下一阶段使用；并不向用户提交部分结果。

例如游标17且两个空槽：第一个取旧堆第17项，第二个触发生成并取新堆第0项，最后只修补／排序一次。游标18但无空槽不生成，多余生成包拒绝。

## 4. 收据、权威状态和失败

v2 使用独立版本标识和政策；共享主体收据不冒用旧v1“禁止再生成”的政策。未改变的普通攻击、愤怒计算、冷静加成、生成、终局分类等依赖仍保留各自真实完整原收据。

新增填牌收据保留：

- before/after：完整手牌或原填牌槽、完整牌堆、游标、完整有序话术池；
- generation 或 null：触发原槽、旧堆／旧池、真实新堆／新池、成功后的18→0游标写入；
- 完整 `DeckGenerate` receipt，包含所有topic放置、话术交换、尾部放置和2000次牌堆交换；
- 每个新增槽的 `deckSource:current|generated` 和 `tapeIndex`，保留牌及槽0来源为空；
- 完整一次completion的postFillHand、preSortHand、普通牌计数、修补、排序来源与抽样；
- 生成与修补事件原索引，以及外层阶段／队号顺序。

这里的current/generated只相对于该次补牌，不声称永久牌身份。再考先生成、后面TurnStart继续用该堆时，它就是后一次填牌的current；不能再以“生成过”为由重置游标。

外层 `events/eventCount` 保留含生成的全量顺序；`nonGenerationEvents/nonGenerationEventCount` 单独保留原主组合体的非生成事件，不能把两种计数混称。

普通攻击后的HP/stress为愤怒输入权威；出牌后的手牌／额度／牌堆／游标为后续权威；愤怒衔接返回的完整状态为最终权威。实际话术池修改必须与该队生成收据一致，不能只在审计中记录而丢失到最终状态。

成功到ready-for-play或closing-pending；必须在全部阶段和所有未用包检查通过后才返回。生成、修补、第二队或终局choice后期失败时，只返回失败，不附先前HP、手牌、游标、已生成牌堆、成功收据或可提交状态。原子性不承诺可回滚外部RNG，因为根本不调用外部RNG。

攻击或愤怒终局：不执行后续补牌／生成／额外timer递减；所有未到阶段的生成包必须null。不消耗为未发生路径准备的抽样。Closing奖励、受伤或世界写入仍不发生。

## 5. 有界预算与验证状态

每队再考最多取6张，本轮最后补牌最多取6张，合计最多12张；生成堆有18张，因此每队最多一次生成，全轮至多两次。单次生成最多4017项抽样，非生成沿用保守16项：`2×4017+16=8050`。这是组件保守和，不声称所有上限同时可达。

代码固定预算如下；超限整笔拒绝，不截断输入或审计：

|预算|上限|
|---|---:|
|输入节点|100000|
|输入深度|64|
|单输入数组|4017|
|输入canonical UTF-8字节|2097152（2 MiB）|
|输出节点，重复引用按展开后的每次出现计数|4000000|
|输出深度|128|
|输出canonical UTF-8字节|67108864（64 MiB）|
|外层事件|8050|

输入保守结构核算：两包共8034个生成draw，每draw对象及三值按4节点算32136；原round域保守最多32768；新包装／政策余量小于1000，合计小于65904节点，低于100000。按每生成draw保守96字节，另加原round的262144字节预算与新政策小于16 KiB，低于2 MiB。这是结构保守估计，不是运行测量或精确可达最大值。

输出保留所有生成交换审计。主项为最多8000行交换，加三份8034项draw／audit出现：生成器 `consumedDraws`、fill `randomEvents`、顶层 `events`。交换只保存在完整生成收据一次。按每项保守16节点／512字节，主项为513632节点／16436224字节；固定状态、非生成收据及有限元数据按至多128个固定审计组、每组保守8192节点／256 KiB另留1048576节点／32 MiB，合计1562208节点／49990656字节（小于48 MiB），仍低于4000000节点／64 MiB限制。固定leaf上界为 availability4、calm2、attacker1、attack1（HP子调用≤1）、anger1（entry≤2、combo≤2）、terminal≤1、generator≤2；排除已计大数组后，固定状态／小数组／政策／证据没有用户自由长文本，域内仅七槽手牌、18项牌堆、最多4次选择、2次愤怒pass和16非生成事件。此为保守源码结构余量而非精确或同时可达界，不能被读作实测输出大小。

输出构造后、公开成功前保留 `enforceOutputBudget`：逐次展开核对节点和深度，再核canonical UTF-8字节；任何超限或事件超过8050均返回 `output-limit`，不删减生成收据，不返回部分成功。外层不会把大生成包送入旧小输入域，而是在相应受信填牌点交给原生成器。不得将完整输出直接当下一次输入。

安全分离继续拒绝代理、访问器、函数、隐藏／symbol字段、循环、非普通原型和稀疏装饰数组；可信代理检测不可用时在反射前拒绝。调用者数据不被修改；对外成功与失败递归冻结。重复非循环引用按独立数据计入预算。

[纸面说明](../../data/scenarios/debate-regenerated-round-paper-v2.json)包含13个成功和19个拒绝情景，其中含4个仅内部helper层面的情景，并非32个可执行公共API fixtures，也非32次运行结果。仅静态文本、字节身份和纸面推导；未运行测试、编译、typecheck、build、validator、checker、候选、来源或重放。现代C#参考工程扩展不证明原生PK／Vanilla等价；43证据主题／45历史快照不减。P078及全部依赖、人物／书籍资格、非恒等hook、全局RNG、教程、长期会话和Closing世界写入均排除。
