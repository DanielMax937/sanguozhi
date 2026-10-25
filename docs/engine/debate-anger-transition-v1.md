# 舌战愤怒结算后条件回合衔接 API v1

[规则与来源边界](../rules/debate-anger-transition-v1.md) · [固定政策与证据](../sources/debate-anger-transition-v1.json) · [实现](../../packages/engine/src/debate-anger-transition.ts) · [公共导出](../../packages/engine/src/index.ts)。

本 API 组合既有且不改动的 `evaluateDebateAngerPhase` 与 `evaluateDebateRoundTransition`：安全分离完整输入并校验全部衔接元数据及初始手牌边界后，调用一次愤怒核完成其完整验证与结算；只有结算后仍非终局，才把同一份愤怒后检查点交给一次回合衔接。终局结果停在 `terminal-pending-classification`；非终局成功停在工程数据检查点 `ready-for-play`。不是完整舌战、普通攻击回合、可运行阶段机或旧 session 适配器。

本页的类型块、常量及因果说明均为静态合同，不是运行结果。本批次未运行候选代码、来源 C#、测试、编译器、typecheck、build、validator、scenario 或 replay，也不借用旧批次的运行记录来认证本新增组合。

## 1. 入口、不可变性与一次提交

公开求值入口及固定常量为：

```ts
evaluateDebateAngerTransition(input: unknown): DebateAngerTransitionResultV1
DEBATE_ANGER_TRANSITION_POLICY_V1: DebateAngerTransitionPolicyV1
DEBATE_ANGER_TRANSITION_EVIDENCE_V1: DebateAngerTransitionEvidenceV1
```

复合公开 DTO 递归 readonly；下文结构说明省略 readonly 修饰。输入是 JSON 式数据值，不是 JSON 字符串。外层先建立完整、安全且与调用者分离的数据副本，封闭解析外层、transition 与初始手牌交集；原愤怒调用再完成其剩余全部输入解析，之后才进入任何领域求值。成功、失败、常量、状态及全部嵌套收据递归冻结；不修改或冻结调用者对象，不返回调用者的可变引用。

只有最终 `ok:true` 才可提交。愤怒已成功、话题已局部计算或队伍0已局部补牌，都不构成可采用的部分事务。非终局分支的回合衔接失败时，不返回愤怒成功对象、愤怒后状态、部分话题、部分手牌或部分收据；失败只携带类型化原因和必要的依赖失败对象。没有外部存储、外部 RNG 或 session 可供本层回滚，也没有隐式重试、缓存状态或续跑游标。

## 2. 完整输入 DTO

顶层恰有五个必需字段。`anger` 是原有完整 `DebateAngerPhaseInputV1`，不是其摘要、预计算输出或可选选项。`transition` 只接收不属于愤怒检查点的补充元数据，不能另交一套 HP、手牌、timer、崩坏或 firstTeam 与愤怒结果竞争。

```ts
type DebateAngerTransitionInputV1 = {
  schemaVersion: 1;
  profile: 'debate-anger-transition-reference-v1';
  policies: DebateAngerTransitionPolicyV1;
  anger: DebateAngerPhaseInputV1;
  transition: DebateAngerTransitionTransitionContextV1;
};
type DebateAngerTransitionTransitionCharacterV1 = {
  playedCard: PhysicalCard;
  canRethink: boolean;
  cardTape: PlayableCard[];
  deckCursor: number;
  rawDraws: FillRawDraw[];
};
type DebateAngerTransitionTransitionContextV1 = {
  isTutorial: false;
  attacker: -1 | 0 | 1;
  currentTopic: number;
  characters: [DebateAngerTransitionTransitionCharacterV1,
               DebateAngerTransitionTransitionCharacterV1];
  topicRawDraws: TopicRawDraw[];
};
type PlayableCard = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14;
type PhysicalCard = -1 | 0 | PlayableCard;
type FillRawDraw = { role: 'debate-fill-topic-repair'; bound: 9; value: number };
type TopicRawDraw = { role: 'debate-turn-end-topic-reroll'; bound: 3; value: number };
```

上面 `PlayableCard`、`PhysicalCard`、`FillRawDraw`、`TopicRawDraw` 是本页便于阅读的结构缩写，不另加公共导出。数组必须稠密；空抽样数组也必须明确给出。schemaVersion、profile 与完整 policies 必须逐值相符，不接受仅 policy id、部分嵌套政策、默认政策或调用者 evidence。

### 2.1 原愤怒输入的完整展开

```ts
type DebateAngerPhaseCharacterV1 = {
  personality: 'timid' | 'calm' | 'bold' | 'reckless';
  strength: number;
  hp: number;
  stress: number;
  angerTimer: number;
  maxCardCount: 4 | 5 | 6 | 7;
  hand: [PhysicalCard, PhysicalCard, PhysicalCard, PhysicalCard,
         PhysicalCard, PhysicalCard, PhysicalCard];
};
type DebateAngerPhaseComboV1 = {
  active: boolean;
  attacker: -1 | 0 | 1;
  counter: number;
};
type DebateAngerPhaseRawDrawV1 = {
  role: 'debate-timid-combo-jitter'; bound: 5; value: number;
};
type DebateAngerPhaseInputV1 = {
  schemaVersion: 1;
  profile: 'debate-anger-phase-reference-v1';
  policies: DebateAngerPhasePolicyV1;
  genericOnly: true;
  firstTeam: 0 | 1;
  winner: -1;
  characters: [DebateAngerPhaseCharacterV1, DebateAngerPhaseCharacterV1];
  combo: DebateAngerPhaseComboV1 & { active: false };
  crumbledLevels: [0 | 1 | 2 | 3, 0 | 1 | 2 | 3];
  crumbled: [boolean, boolean];
  resolvedAttacks: [number, number];
  passDraws: [DebateAngerPhaseRawDrawV1[], DebateAngerPhaseRawDrawV1[]];
};
```

`anger` 恰有上述12个字段，两个人物 record 各恰有七个字段。保持原愤怒准入：两队初始 HP 为整数1..1000，strength 为1..100，stress 为0..100，angerTimer 为0..4，maxCardCount 为4..7；每队 resolvedAttack 为70..227。combo 必须初始失活，attacker 为−1..1、counter 为0..7，但不要求后两者清零。crumbledLevels 是两项0..3整数；crumbled 是两项 boolean。genericOnly 必须精确 true，不是人物专属伤害已被核验的证明。

passDraws 按第1、2遍排列，不按攻击队伍排列；每遍长度0..4，每项固定 role、bound=5、value 为整数0..4。两队攻击力及两遍全部抽样数据都要合法，即使相应队伍或遍次最终不被使用。实际消费、无 combo 必须空数组、第一遍终局时第二遍数组必须为空，仍由原愤怒组件精确执行。

### 2.2 新组合的手牌交集准入

本组合进一步要求每队初始 `hand[0]===0`，并禁止活动可出牌槽 `hand[1..maxCardCount-1]` 出现0。其余所有物理槽仍须为−1..14；活动可出牌槽允许−1空位或1..14。非活动尾槽 `hand[maxCardCount..6]` 可以是−1..14，不因为不参与当前牌操作而成为未校验数据。

这是本组合显式的工程收窄，不是来源普遍不变量，也不是原愤怒核或原回合衔接核一直具有的规则。原愤怒输入允许所有七槽任意−1..14；原回合衔接只禁止活动可出牌槽0、允许槽0为任意−1..14。本层选择 canonical 初始槽0=0，是为了保持愤怒移除／压紧之后的活动牌域可接到不变的 TurnStart；不修改两个旧核的合同。

不要求初始排序；重复牌、活动空槽、非活动尾部非空和 playedCard 不在当前手牌中，都不因此被新增拒绝。不能通过排序、归一化、补0、删除尾槽或预先填空来修正不合格输入。原组件执行真实移除时会按其来源规则清空全七槽，并稳定压紧活动前缀内非空幸存者；这个变化不是外层为了通过准入而做的修补。

### 2.3 回合补充元数据与三种抽样域

transition 恰有 isTutorial、attacker、currentTopic、characters、topicRawDraws 五个字段；每队补充 record 恰有 playedCard、canRethink、cardTape、deckCursor、rawDraws 五个字段：

- isTutorial 精确为 boolean false；不接受 true，也不把它解释为只跳过填牌。
- attacker 为−1、0或1，含义是原普通回合 `debate.attacker`，不是 combo.attacker、实际愤怒入场队伍或最后连打方。
- currentTopic 为有符号32位整数−2147483648..2147483647；无来源赋值分支时按值保留，不自行钳制为0..2。
- playedCard 为整数−1..14；canRethink 必须为 boolean。
- cardTape 恰有18项，每项整数1..14，包括本次可能不读取的项；deckCursor 为整数0..18。
- 每队 rawDraws 长度0或1，固定 role=`debate-fill-topic-repair`、bound=9、value 为整数0..8。
- topicRawDraws 长度0或1，固定 role=`debate-turn-end-topic-reroll`、bound=3、value 为整数0..2。

所有 raw draw 对象恰有 role、bound、value 三个字段。三种角色不能借用、混排或变换数值来互换；rawDraws 是求值输入，不是持久人物状态。全部数值先须为安全整数且不能为−0，不接受字符串数字、分数、NaN、Infinity 或 unsafe integer。

## 3. 组合顺序与唯一状态来源

1. 完整安全分离整个输入，封闭解析外层及完整政策，先完整解析 transition 的全部元数据、两套18牌组和三组 transition 抽样语法，再检查 anger 顶层／人物封闭字段和 canonical 初始手牌／容量交集。没有先调用旧核来探测合法性的 validation probe。
2. 调用一次 `evaluateDebateAngerPhase`，由它在自己的任何领域处理前完成 anger 的完整 schema、精确原政策、HP／属性／combo／崩坏／攻击力和两遍抽样等剩余验证。它仍至多执行两遍入场／完整胆小连打，并按自身顺序判胜、计算崩坏。新层不复制这些算法，不稳定化第三遍，也不在连打途中按 HP 早停。
3. 只根据该次愤怒成功所得 winner／outcome 分支，而非根据最初 `winner=-1` 直接衔接回合。
4. 若终局，不调用任何 RoundTransition、TurnEnd、TurnStart 或填牌；检查 transition 三组抽样数组均为空后发布终局检查点。
5. 若非终局，以愤怒后 personality、angerTimer、maxCardCount、hand 和 crumbled 为权威值，以原 firstTeam 和原 transition 元数据构成完整 RoundTransition 输入，调用一次不变的 `evaluateDebateRoundTransition`。
6. 仅当它完整成功，才将其人物覆盖字段、firstTeam、currentTopic 合并到愤怒后检查点，并发布唯一最终成功结果。

### 3.1 终局保留元数据，但不偷偷执行下一阶段

终局结果保留愤怒所得人物、combo、winner 和 crumbledLevels，人物 crumbled 来自愤怒结果。原 firstTeam、attacker、currentTopic、playedCard、canRethink、cardTape、deckCursor 保留。timer 不递减，手牌不填充或排序，playedCard 不复位，canRethink 不因 Calm／崩坏增加，crumbled 不清除，也不决定 Critical 或 Closing。

终局时即便某个元数据未来不会使用，也须已在调用愤怒前通过语法与域校验。反过来，合法但非空的 topicRawDraws 或任一队 rawDraws 不会被静默丢弃：返回 `unused-transition-draws`，整笔失败而不泄漏已算出的愤怒结果。终局路线的 transition 嵌套结果为 null，transitionDrawOffset 也为 null；null 表示未调用，不是“调用后空收据”。

### 3.2 非终局投影与最终覆盖

传入原 RoundTransition 的 firstTeam 来自 `anger.firstTeam`；winner 固定为愤怒已经确认的−1；attacker 与 currentTopic 来自原 transition 补充输入。两队 personality、angerTimer、maxCardCount、hand 与 crumbled 来自愤怒完成后的结果；playedCard、canRethink、cardTape、deckCursor、rawDraws 仍来自各队原补充元数据。没有第二份调用者 hand／timer／crumbled 可覆盖这条来源链。

最终状态保留愤怒所得 strength、hp、stress、combo、winner 与 crumbledLevels，接收回合衔接所得 hand、angerTimer、playedCard、canRethink、crumbled、deckCursor、firstTeam 与 currentTopic。personality、maxCardCount、cardTape 在两个阶段均按不变合同保留；attacker 始终保留原普通攻击者。不得在 TurnStart 已清除崩坏后，重新用愤怒旗标覆盖最终 crumbled。

原回合衔接先按队伍0、1递减正 timer，再按原 attacker 更新先手、普通出牌话题及至多一次诡辩重抽，最后调用一次原 TurnStart。原 playedCard 保留到此时供话题与诡辩判断，然后才由 TurnStart 重置。不能把胆小最后一击、反制牌、combo.attacker 或新 timer 重新计算出来的攻击者替代它们。

### 3.3 当前18牌组与愤怒造成的新空位

填牌需求必须以愤怒完成后实际 hand 为准：愤怒反制或胆小连打移除造成的空位，也是本次 TurnStart 的补牌需求。外层不根据原手牌预判需求，不提前检查“牌已满”后绕过填牌，也不为通过耗尽边界生成牌组。

各队牌组独立，恰18项。post-anger 活动手牌无空位时游标18仍可成功；恰好消费索引17并将游标推进到18本身不失败；确需下一张而无可用项时，沿用当前牌组核的失败并拒绝整笔事务。不绕回、不生成、不共享牌组，不把 jitter、topic reroll 或 fill repair draw 当作 cardTape 项。

因此新入场 Calm 的正 timer 会先递减再决定额度恢复；Reckless 的新 timer1会先变0；崩坏可独立恢复额度；Bold 要看补牌／修补／活动排序后的最终普通话题牌计数。这些是两个未改动组件在新衔接点上的结果关系，不是本页已运行的样例或对完整来源状态可达性的证明。

## 4. 完整结果、状态与主收据

```ts
type DebateAngerTransitionStateV1 = {
  genericOnly: true;
  isTutorial: false;
  firstTeam: 0 | 1;
  attacker: -1 | 0 | 1;
  currentTopic: number;
  winner: -1 | 0 | 1;
  characters: [DebateAngerTransitionCharacterV1, DebateAngerTransitionCharacterV1];
  combo: DebateAngerPhaseComboV1;
  crumbledLevels: [0 | 1 | 2 | 3, 0 | 1 | 2 | 3];
};
type DebateAngerTransitionCharacterV1 = DebateAngerPhaseCharacterV1 & {
  playedCard: PhysicalCard;
  canRethink: boolean;
  crumbled: boolean;
  cardTape: PlayableCard[];
  deckCursor: number;
};
type DebateAngerTransitionSuccessV1 = {
  ok: true;
  schemaVersion: 1;
  profile: 'debate-anger-transition-reference-v1';
  policy: DebateAngerTransitionPolicyV1;
  evidence: DebateAngerTransitionEvidenceV1;
  state: DebateAngerTransitionStateV1;
  nextCheckpoint: 'terminal-pending-classification' | 'ready-for-play';
  receipt: DebateAngerTransitionReceiptV1;
};
type DebateAngerTransitionReceiptV1 = {
  schemaVersion: 1;
  profile: 'debate-anger-transition-reference-v1';
  policy: DebateAngerTransitionPolicyV1;
  evidence: DebateAngerTransitionEvidenceV1;
  before: DebateAngerTransitionStateV1;
  afterAnger: DebateAngerTransitionStateV1;
  after: DebateAngerTransitionStateV1;
  anger: DebateAngerPhaseSuccessV1;
  transition: DebateRoundTransitionSuccessV1 | null;
  transitionDrawOffset: number | null;
  consumedDraws: DebateAngerTransitionConsumedDrawV1[];
  drawCount: number;
  nextCheckpoint: 'terminal-pending-classification' | 'ready-for-play';
  externalRngConsumed: 0;
};
type DebateAngerTransitionResultV1 =
  DebateAngerTransitionSuccessV1 | DebateAngerTransitionFailureV1;
```

State 不另设顶层 crumbled 数组；愤怒的两项旗标投影到各人物 crumbled，避免两份最终旗标互相矛盾。每份 State 都含完整七槽 hand、完整18项 cardTape 及游标，不含求值用 rawDraws。before 是合并后的完整输入检查点；afterAnger 是愤怒完成、回合尚未推进的同形检查点；after 与成功 state 按值一致。

终局 after 与 afterAnger 按值一致，winner 为0或1；非终局 after 是回合衔接完整提交后的合并检查点，winner 为−1。成功与 receipt 的 nextCheckpoint 相同。nextCheckpoint 仅为本工程本次事务的输出标签，不是来源 phase 字段、UI状态或 session 已推进的保证。

### 4.1 嵌套结果不裁剪、不改写

receipt.anger 保存原 `DebateAngerPhaseSuccessV1` 的完整成功对象，不只是其 receipt，也不是改成外层 profile 的摘要；receipt.transition 保存原 `DebateRoundTransitionSuccessV1` 的完整成功对象或 null。各自继续包含自己的固定政策、证据、before／after 与全部深层收据，原局部抽样编号不重写。

- [愤怒 API 的完整 DTO](debate-anger-phase-v1.md)：其 success 为 characters、combo、winner、crumbledLevels、crumbled、ok、outcome、receipt；receipt 保留完整 passes、winnerChecks、crumbleResult、drawAudit、entryReceipt 与 comboReceipt。
- [回合衔接 API 的完整 DTO](debate-round-transition-v1.md)：其 success 为 ok、schemaVersion、profile、policy、evidence、state、characters、nextCheckpoint、receipt；receipt 保留 before、afterTurnEnd、after、timerOrder、timers、firstTeam、ordinaryTopic、sophistry、turnStart、turnStartDrawOffset、consumedDraws、drawCount、externalRngConsumed。
- [TurnStart API](debate-turn-start-v1.md)、[愤怒入场 API](debate-anger-entry-v1.md)、[胆小连打 API](debate-timid-combo-v1.md) 与[当前牌组填牌 API](debate-hand-fill-v1.md)继续规定其各自完整导入类型，不因本页摘要而丢字段。

例如 anger.receipt.after 是愤怒后快照，不等于非终局的外层 after；transition.receipt.before 是愤怒后投影且尚未递减 timer；transition.receipt.afterTurnEnd 是已递减且话题处理完成、TurnStart 尚未执行的检查点。不得把不同阶段的同名 before／after 当作一份状态。

### 4.2 完整全局抽样 DTO

```ts
type DebateAngerTransitionAngerConsumedDrawV1 = {
  flatDrawIndex: number;
  stage: 'anger-combo';
  teamIndex: 0 | 1;
  angerGlobalIndex: number;
  pass: 1 | 2;
  passDrawIndex: number;
  draw: DebateAngerPhaseRawDrawV1;
};
type DebateAngerTransitionTopicConsumedDrawV1 = {
  flatDrawIndex: number;
  stage: 'turn-end-topic';
  teamIndex: null;
  localDrawIndex: 0;
  draw: TopicRawDraw;
  roundTransitionFlatDrawIndex: number;
};
type DebateAngerTransitionFillConsumedDrawV1 = {
  flatDrawIndex: number;
  stage: 'turn-start-fill';
  teamIndex: 0 | 1;
  turnStartFlatDrawIndex: number;
  localDrawIndex: 0;
  draw: FillRawDraw;
  roundTransitionFlatDrawIndex: number;
};
type DebateAngerTransitionConsumedDrawV1 =
  DebateAngerTransitionAngerConsumedDrawV1
  | DebateAngerTransitionTopicConsumedDrawV1
  | DebateAngerTransitionFillConsumedDrawV1;
```

全局次序为实际第1遍 jitter、第2遍 jitter（若执行）、TurnEnd topic、队伍0 fill、队伍1 fill。只记录实际消费项，不为没有调用的阶段或零消费阶段预留编号。flatDrawIndex 从0连续编号，drawCount 等于 consumedDraws.length，运行时范围0..11；number 静态类型不是允许任意输出计数。

anger-combo 的 teamIndex 来自该遍完整 comboReceipt.attackerTeam，是连打攻击方而不是原普通 attacker；angerGlobalIndex、pass、passDrawIndex 保留原愤怒审计值。topic／fill 条目的 roundTransitionFlatDrawIndex 保留原回合衔接 flatDrawIndex；fill 还保留原 TurnStart 的 turnStartFlatDrawIndex 及原 fill 的 localDrawIndex。topic 的 teamIndex 固定 null，不将话题抽样任意归到某队。

非终局 transitionDrawOffset 等于此前实际消费的愤怒 draw 数，范围0..8；即使回合衔接没有消费 draw 也仍是这个数而不是 null。每项 transition 全局 flatDrawIndex 等于 offset 加其 roundTransitionFlatDrawIndex。终局 offset=null 且无 transition 类条目；没有把阶段偏移写回任何嵌套 success 或 receipt。

externalRngConsumed 恒0，指没有外部 RNG 调用，不表示 supplied draws 没有被使用。调用者在求值前为这些输入值调用过外部 RNG，不在本事务可撤销范围内；本层不会回滚外部随机源，也不证明原生流对齐。

### 4.3 完整失败联合与阶段归属

```ts
type DebateAngerTransitionValidationFailureReasonV1 =
  | 'unsupported-runtime' | 'input-limit' | 'malformed-data' | 'unknown-field'
  | 'unsupported-profile' | 'unsupported-policy' | 'unsupported-tutorial'
  | 'invalid-transition' | 'invalid-transition-characters' | 'invalid-transition-character'
  | 'invalid-attacker' | 'invalid-current-topic' | 'invalid-played-card'
  | 'invalid-can-rethink' | 'invalid-card-tape' | 'unsupported-card-code'
  | 'invalid-deck-cursor' | 'invalid-fill-raw-draws' | 'invalid-fill-raw-draw'
  | 'invalid-topic-raw-draws' | 'invalid-topic-raw-draw'
  | 'invalid-anger-input' | 'invalid-anger-characters'
  | 'invalid-initial-hand-capacity' | 'invalid-initial-hand'
  | 'unused-transition-draws';
type DebateAngerTransitionValidationFailureV1 = {
  ok: false;
  reason: DebateAngerTransitionValidationFailureReasonV1;
};
type DebateAngerTransitionDependencyFailureV1 =
  | { ok: false; reason: 'anger-phase-failure'; dependencyFailure: DebateAngerPhaseFailureV1 }
  | { ok: false; reason: 'round-transition-failure'; dependencyFailure: DebateRoundTransitionFailureV1 };
type DebateAngerTransitionFailureReasonV1 =
  DebateAngerTransitionValidationFailureReasonV1
  | 'anger-phase-failure' | 'round-transition-failure';
type DebateAngerTransitionFailureV1 =
  DebateAngerTransitionValidationFailureV1 | DebateAngerTransitionDependencyFailureV1;
```

以上26个外层校验／消费错误与两个依赖错误是完整 reason 联合。外层失败恰有 ok、reason；依赖失败另有完整 dependencyFailure，没有 stage、pass、kernelReason 的重命名副本。愤怒依赖若原本为带 pass 与 kernelReason 的 entry-kernel-failure／combo-kernel-failure，这些字段在 dependencyFailure 内原样保留；回合依赖的失败仍是其 `{ok:false,reason}`。完整原错误联合见[愤怒失败合同](debate-anger-phase-v1.md#6-全部错误安全分离与预算)与[回合衔接失败合同](debate-round-transition-v1.md#6-全部错误与解析优先级)。

| 外层错误 | 具体拒绝范围 |
|---|---|
| unsupported-runtime／input-limit | 缺少可信 Proxy 检测，或超出固定安全预算 |
| malformed-data／unknown-field | 不安全数据、缺必需字段／非record默认情况／未归类异常，或封闭 record 多出字段 |
| unsupported-profile／unsupported-policy | 外层版本或 profile 不符，或完整外层政策不符；不是嵌套 anger 自己的 profile／policy 错误 |
| unsupported-tutorial | transition.isTutorial 不精确为 false |
| invalid-transition | transition 不是 record |
| invalid-transition-characters／invalid-transition-character | transition.characters 不是恰两项数组，或其中补充人物不是 record |
| invalid-attacker／invalid-current-topic | attacker 不在−1..1，或 currentTopic 不在 signed32域 |
| invalid-played-card／invalid-can-rethink | playedCard 不在−1..14，或 canRethink 不是 boolean |
| invalid-card-tape／unsupported-card-code／invalid-deck-cursor | cardTape 不是恰18项，任一牌码不在1..14，或 cursor 不在0..18 |
| invalid-fill-raw-draws／invalid-fill-raw-draw | fill 数组不是0..1项，或其 record／role／bound9／value0..8错误 |
| invalid-topic-raw-draws／invalid-topic-raw-draw | topic 数组不是0..1项，或其 record／role／bound3／value0..2错误 |
| invalid-anger-input／invalid-anger-characters | anger 不是 record，或其 characters 不是恰两项／其中人物不是 record |
| invalid-initial-hand-capacity／invalid-initial-hand | 外层交集预检的容量不在4..7；手牌非七项、牌码不在−1..14、槽0不为0或其余活动槽含0 |
| unused-transition-draws | 实际愤怒终局后，任一语法合法的 transition 抽样数组非空 |

record 的未知字段先归 unknown-field，缺字段归 malformed-data；表中的 invalid record 原因仅用于该值根本不是 record 的情形。所有非法数值语法先在 detach 阶段归 malformed-data，不等到表中范围错误。未知异常不泄漏异常文本或错误输入值。

解析与错误优先级是：完整 detach → 外层形状／版本／政策 → transition 模式／attacker／topic → 队伍0完整元数据 → 队伍1完整元数据 → topic 抽样语法 → anger 顶层／人物形状及 canonical hand 交集 → 一次 anger 公共调用的完整校验和领域结算 → 实际终局空抽样检查，或一次 RoundTransition。外层不另抄 anger 全域解析器，所以其他 anger 属性错误会标为 anger-phase-failure，而非对应的外层 reason。

因此非法 transition 抽样语法可以先于嵌套 anger 的 HP 或政策错误，且绝不会因后来发现终局而被忽略。合法空数组是否“缺抽样”只由真实领域需求判断；非终局保留原回合衔接的 topic 需求先于 TurnStart 两队填牌需求次序。任一阶段失败均不返回任何已完成上游成功对象或部分 draw transcript。

### 4.4 全部公开类型及别名

本模块公开32个类型；不公开 ParsedInput、Pair、Frozen、Mutable 等辅助类型。完整列表如下：

```text
DebateAngerTransitionTeamV1
DebateAngerTransitionMaybeTeamV1
DebateAngerTransitionAttackerV1
DebateAngerTransitionPersonalityV1
DebateAngerTransitionCardCodeV1
DebateAngerTransitionPhysicalCardV1
DebateAngerTransitionHandV1
DebateAngerTransitionComboV1
DebateAngerTransitionCrumbleLevelV1
DebateAngerTransitionAngerRawDrawV1
DebateAngerTransitionFillRawDrawV1
DebateAngerTransitionTopicRawDrawV1
DebateAngerTransitionNextCheckpointV1
DebateAngerTransitionTransitionCharacterV1
DebateAngerTransitionTransitionContextV1
DebateAngerTransitionInputV1
DebateAngerTransitionCharacterV1
DebateAngerTransitionStateV1
DebateAngerTransitionAngerConsumedDrawV1
DebateAngerTransitionTopicConsumedDrawV1
DebateAngerTransitionFillConsumedDrawV1
DebateAngerTransitionConsumedDrawV1
DebateAngerTransitionReceiptV1
DebateAngerTransitionSuccessV1
DebateAngerTransitionValidationFailureReasonV1
DebateAngerTransitionValidationFailureV1
DebateAngerTransitionDependencyFailureV1
DebateAngerTransitionFailureReasonV1
DebateAngerTransitionFailureV1
DebateAngerTransitionResultV1
DebateAngerTransitionPolicyV1
DebateAngerTransitionEvidenceV1
```

Team／MaybeTeam 分别为0|1与−1|0|1；Attacker 沿用原回合衔接的−1|0|1；Personality、Hand、Combo、CrumbleLevel、AngerRawDraw 沿用原愤怒类型。CardCode 是1..14可出牌码，不含−1或0；PhysicalCard 是−1..14。FillRawDraw、TopicRawDraw 为第2节固定结构；NextCheckpoint 为两个结果标签联合。TransitionCharacter 是第2节五字段补充人物结构，TransitionContext 是第2节五字段 transition；Character 是第4节包含完整愤怒字段与补充元数据的结构。Policy／Evidence 为第7节完整固定对象的递归 readonly 类型。

## 5. 安全数据、固定预算与拒绝边界

运行时须能通过可信 `process.getBuiltinModule('node:util').types.isProxy` 取得 Proxy 检测器；不可用时，在反射调用者输入前封闭拒绝为 `unsupported-runtime`，不降级为可能触发 Proxy trap 的检查。这是声明的运行环境能力，不是本批次对任何 Node、浏览器或宿主版本的运行认证。

允许普通 Object.prototype 或 null 原型 record、标准数组及有限 JSON 标量；对象属性必须为可枚举数据属性。先拒绝 Proxy，再读取描述符，不调用 getter、setter、toJSON、自定义 iterator、函数或调用者 callback。拒绝 Symbol、自定义原型、Date、undefined、BigInt、可执行值、隐藏属性、循环、稀疏数组、带额外属性的数组及非法数值。非循环共享引用可以重复出现，但每次独立复制并重复计入资源预算。

外层固定预算是：

| 项目 | 外层上限 |
|---|---:|
| 输入节点 | 16384 |
| 递归深度，根为0 | 24 |
| 单个通用数组长度 | 64 |
| canonical UTF-8 字节 | 131072 |
| AngerPhase 公共调用 | 1 |
| RoundTransition 公共调用 | 终局0，非终局1 |
| 全局 supplied draw 消费 | 11 |

字符串及键名 UTF-8 预算、最终 canonical UTF-8 大小均受限；record 自有键也受节点预算约束。通用数组预算不替代具体数组约束：hand 仍恰7，cardTape 仍恰18，队伍 pair 仍恰2，pass 数组各至多4，topic／fill 数组各至多1。完整固定嵌套政策同样计入输入节点、深度与字节预算，不是免费或隐藏字段。

原依赖不会因为外层预算较大而被放宽。愤怒核仍有4096节点、深度16、通用数组64、65536 canonical UTF-8字节预算；回合衔接仍有4096节点、深度16、通用数组32、65536字节预算。它们的原入场、连打、TurnStart 和 fill 子核也保持各自原预算与安全检查。外层成功分离不跳过任何一次依赖的防御性准入。

最多两次原入场、两次完整连打、两次 winner 检查和一次 crumble，均由那一次愤怒调用内部完成。非终局最多一次原 TurnStart，再由它最多两次原当前牌组填牌。11是8条愤怒 jitter 加至多1条话题重抽与两队各至多1条 fill repair 的保守合计上界，不是独立新 RNG 的消费次数，也不是达到11后人为截断领域处理；不声称本层较窄准入域存在恰好消费11项的可达轨迹。

政策与证据是固定常量的递归 readonly 类型，不是开放配置。`policies` 以完整 canonical 值匹配：record 键次序不重要，数组次序重要；缺键、添键或改任何值均不能变成自定义规则。输入没有 evidence 字段，没有把调用者指定来源塞进成功收据的入口。

## 6. 来源范围与未完成边界

固定现代 C# 来源是 [tankyc/sango_infinity 的 a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef](https://github.com/tankyc/sango_infinity/tree/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef)，不是原生 SAN11／PK／Vanilla 的核验。当前依赖仍使用已固定的 Debate.cs blob `0137498d10773cd4596d497083ccdf6a26b3a261`、SHA256 `622789ca8b8b6799a321526dcfb513d6622adf5b5d54025175c2a7795ef7da28`，以及 DebatePhase.cs blob `6aa98f855a5d4d172cde7e8ffc18a141b8a7b587`、SHA256 `5b47f7b6a89d6123a23e7c14f22168e59c9edd549e98d9bc0258d8a55bb9cbf3`。这些是保留的固定文本身份，不是本批次重新执行或原生比较所得。

- [DebatePhase.cs 333–390](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/DebatePhase.cs#L333-L390)：愤怒两遍及其判胜出口；终局出口不通向这里的回合衔接。
- [DebatePhase.cs 261–274](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/DebatePhase.cs#L261-L274)及[163–168](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/DebatePhase.cs#L163-L168)：TurnEnd 到 TurnStart，再到 Play 的来源调度顺序；本层只建立数据检查点，不执行阶段对象或 Play。
- [Debate.cs 1083–1126](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L1083-L1126)：先双方 timer，再原普通 attacker 的先手／话题／诡辩分支；winner=-1是独立 RoundTransition 的工程路线准入，不伪称来源 TurnEnd 本身有这一 guard。

本组合的初始 canonical 手牌、通用伤害断言、signed32话题域、精确政策匹配、安全解析、错误名称、预算、全局审计编号及 ready-for-play 标签均为工程合同。它们不证明任何给定检查点在完整来源或原生游戏中可达。

仍明确排除：普通攻击的 attacker 选择与伤害结算、人物属性与攻击力推导、教程分支、CanCritical／Critical／Closing／终局清算、oldnine、牌组生成及原生再生整合、P078、原生 RNG 流与随机 callback、来源 view／log／动画、phase step／delta 调度、campaign、持久化、完整 session 与旧会话接入。旧核与旧 profile 均不改；nativeEquivalent、stockOriginalVerified、pkEquivalent、vanillaEquivalent、completeDebate 均不转为 true，nativeWholeChain 继续 open，原43组／45历史快照边界不因本层归零。

## 7. 完整固定政策与证据字面量

下列 JSON 是本版本固定常量的完整展开，不是调用样例，也不是执行输出。`policies` 的值精确对应 `DEBATE_ANGER_TRANSITION_POLICY_V1`；`evidence` 的值精确对应 `DEBATE_ANGER_TRANSITION_EVIDENCE_V1`。前者包含完整的 `composition.angerPolicy` 与 `composition.transitionPolicy`，后者包含完整的 `anger` 与 `transition` 证据；TurnStart／HandFill 的更深层常量亦全部展开，没有省略号、占位字段或只给 policy id。

这段静态字面量从当前[来源账本](../sources/debate-anger-transition-v1.json)复制；其依赖部分来自当前基线对应来源 JSON，并与保留的公开常量合同对应。复制与文本审阅不执行、导入或解析候选 TypeScript，不构成运行认证。外层输入仍须在 `anger.policies` 再提供完整原愤怒政策，值就是下面 `policies.composition.angerPolicy`，而不是把外层政策塞进该位置。输入 envelope 里因此包含外层组合中的一份 anger 政策、一份 round 政策，以及 nested anger 输入中的另一份 anger 政策。

实现中的静态保守预算说明为：两份 anger policy、round/TurnStart/fill policy 与外层固定文字，连同有界检查点，低于4096节点和100000 canonical字节，留在16384节点／131072字节预算之内；包装至多增加三个层级，低于深度24。此为逐字段静态预算论证，不是动态测量。每个依赖实际收到的只是自己的原政策和原尺寸检查点，因此不把外层政策、完整收据或多份政策一起传入依赖放大其预算。完整输出收据不受输入预算约束，也不能原样当成下一次有效输入 envelope。

```json
{
  "policies": {
    "id": "debate-anger-transition-bounded-current-deck-policy-v1",
    "profile": "debate-anger-transition-reference-v1",
    "composition": {
      "anger": "one-unchanged-public-evaluateDebateAngerPhase-call",
      "angerPolicy": {
        "id": "debate-anger-phase-bounded-two-pass-policy-v1",
        "profile": "debate-anger-phase-reference-v1",
        "dependencies": {
          "entryProfile": "debate-anger-entry-reference-v1",
          "entryPolicyId": "debate-anger-entry-single-pass-policy-v1",
          "comboProfile": "debate-timid-combo-reference-v1",
          "comboPolicyId": "debate-timid-combo-fresh-pending-policy-v1",
          "composition": "invoke-existing-public-evaluators-with-their-complete-exported-policies",
          "nestedReceipts": "preserve-full-existing-entry-and-combo-receipts"
        },
        "checkpoint": {
          "characters": 2,
          "firstTeam": [
            0,
            1
          ],
          "winner": -1,
          "initialHp": {
            "minimum": 1,
            "maximum": 1000
          },
          "intermediateHp": {
            "minimum": -100,
            "maximum": 1000
          },
          "characterFields": "anger-entry-character-fields-personality-strength-hp-stress-angerTimer-maxCardCount-hand",
          "personality": "caller-resolved-timid-calm-bold-or-reckless",
          "strength": {
            "minimum": 1,
            "maximum": 100
          },
          "stress": {
            "minimum": 0,
            "maximum": 100
          },
          "angerTimer": {
            "minimum": 0,
            "maximum": 4
          },
          "activeHandCapacity": {
            "minimum": 4,
            "maximum": 7
          },
          "physicalHandLength": 7,
          "cardCode": {
            "minimum": -1,
            "maximum": 14
          },
          "combo": {
            "active": false,
            "attacker": [
              -1,
              0,
              1
            ],
            "minimumCounter": 0,
            "maximumCounter": 7
          },
          "inactiveComboFields": "preserved-unless-timid-entry-resets-attacker-and-counter",
          "crumbledLevels": {
            "length": 2,
            "minimum": 0,
            "maximum": 3
          },
          "crumbled": "two-boolean-latched-flags-not-normalized-at-entry",
          "resolvedAttacks": {
            "length": 2,
            "index": "team",
            "minimum": 70,
            "maximum": 227
          },
          "genericOnly": true,
          "admittedBounds": "engine-admission-policy-not-universal-source-reachability"
        },
        "ordering": {
          "firstPass": [
            "entry-canReflect-true",
            "whole-pending-combo-if-active",
            "winner-check"
          ],
          "firstTerminal": "return-before-second-pass-and-before-crumble",
          "secondPass": [
            "entry-canReflect-false",
            "whole-pending-combo-if-active",
            "crumble",
            "winner-check"
          ],
          "maximumPasses": 2,
          "noCandidate": "still-check-winner-and-continue-source-sequence",
          "comboZeroHpBreak": false,
          "thirdPass": false,
          "stabilizationLoop": false
        },
        "winner": {
          "initialWinner": -1,
          "order": "opponent-of-firstTeam-then-firstTeam-with-short-circuit",
          "threshold": "hp-less-than-or-equal-to-zero",
          "opponentTerminal": "firstTeam-wins",
          "firstTerminalOnly": "opponent-wins",
          "simultaneousTerminal": "firstTeam-wins",
          "classification": "not-evaluated"
        },
        "crumble": {
          "when": "only-after-second-whole-combo-and-before-second-winner-check",
          "teamOrder": [
            0,
            1
          ],
          "formula": "clamp-truncate-toward-zero-of-1000-minus-hp-divided-by-250-to-zero-through-three",
          "changedLevel": "write-computed-level-and-set-flag-true-including-downward-change",
          "sameLevel": "preserve-existing-flag",
          "result": "after-flag-zero-or-after-flag-one",
          "firstTerminal": "not-evaluated-null-receipt-preserve-input-levels-and-flags"
        },
        "draws": {
          "input": "two-pass-keyed-arrays-of-caller-supplied-labeled-raw-draws",
          "role": "debate-timid-combo-jitter",
          "bound": 5,
          "minimum": 0,
          "maximum": 4,
          "maximumPerPass": 4,
          "validation": "detach-and-validate-both-arrays-before-any-gameplay",
          "consumption": "delegate-exact-consumption-to-each-whole-combo-kernel",
          "noCombo": "require-empty-corresponding-pass-array",
          "unusedSecondPass": "require-empty-second-array-on-first-pass-terminal",
          "offsets": "zero-based-global-consumed-index-plus-pass-and-local-draw-index",
          "missingOrExtra": "whole-composition-atomic-failure",
          "rngImplementation": "none",
          "nativeStreamClaim": false
        },
        "audit": {
          "snapshots": "detached-initial-final-and-each-executed-pass-before-after",
          "passes": "one-or-two-completed-passes-with-full-entry-and-optional-combo-receipts",
          "winnerChecks": "evaluated-hp-tests-in-short-circuit-order",
          "crumble": "before-after-levels-flags-and-per-team-computation-or-null",
          "draws": "pass-offsets-and-flat-consumed-transcript-with-original-pass-local-indices"
        },
        "safety": {
          "input": "closed-schema-detached-safe-JSON-data-with-exact-policy",
          "requiredRuntime": "trusted-node-util-types-isProxy-via-process-getBuiltinModule",
          "unavailableProxyDetector": "fail-closed-before-inspecting-input",
          "proxiesAccessorsAndExecutableValues": "rejected-without-invocation",
          "result": "recursively-frozen-and-detached-from-input",
          "failure": "typed-validation-or-pass-qualified-kernel-code-no-partial-state-or-receipt"
        },
        "capacity": {
          "maxInputNodes": 4096,
          "maxInputDepth": 16,
          "maxInputArrayLength": 64,
          "maxCanonicalUtf8Bytes": 65536,
          "maxEntryCalls": 2,
          "maxComboCalls": 2,
          "maxWinnerChecks": 2,
          "maxCrumbleCalls": 1,
          "maxConsumedDraws": 8
        },
        "boundary": {
          "kind": "bounded-two-pass-modern-reference-anger-phase-composition",
          "terminalOutcome": "terminal-pending-classification",
          "nonterminalOutcome": "turn-end-pending",
          "canCriticalAndCriticalClosing": "excluded",
          "turnEndAndTimerDecay": "excluded",
          "phaseObjectDeltaStepAndView": "excluded",
          "handRefillAndDeckRegeneration": "excluded",
          "personResolutionAndAttackDerivation": "caller-supplied-not-evaluated",
          "characterSpecificDamageHook": "excluded-generic-identity-assertion-only",
          "rng": "no-implementation-no-external-consumption",
          "campaign": false,
          "sessionIntegration": false,
          "persistence": false,
          "legacyProfilesChanged": false
        }
      },
      "transition": "one-unchanged-public-evaluateDebateRoundTransition-call-only-if-anger-winner-minus-one",
      "transitionPolicy": {
        "id": "debate-round-transition-bounded-current-deck-policy-v1",
        "profile": "debate-round-transition-reference-v1",
        "mode": {
          "kind": "bounded-current-deck-round-transition",
          "isTutorial": false,
          "winner": -1,
          "teamCount": 2,
          "timerOrder": [
            0,
            1
          ],
          "sequence": [
            "decrement-team-zero-positive-anger-timer",
            "decrement-team-one-positive-anger-timer",
            "if-original-attacker-valid-set-first-team",
            "if-original-attacker-topic-card-set-topic",
            "if-original-attacker-valid-and-any-unopposed-sophistry-reroll-topic-once",
            "evaluate-unchanged-public-TurnStart-once"
          ],
          "nextCheckpoint": "ready-for-play",
          "checkpointLabel": "engineering-result-not-source-phase-state-or-phase-loop",
          "terminalMarker": "winner-minus-one-engineering-route-precondition-not-source-TurnEnd-guard"
        },
        "checkpoint": {
          "firstTeam": [
            0,
            1
          ],
          "attacker": [
            -1,
            0,
            1
          ],
          "currentTopic": {
            "minimum": -2147483648,
            "maximum": 2147483647
          },
          "characters": "exact-pair-of-existing-TurnStart-character-inputs-including-rawDraws",
          "personality": "caller-resolved-timid-calm-bold-or-reckless",
          "angerTimer": {
            "minimum": 0,
            "maximum": 4
          },
          "maxCardCount": {
            "minimum": 4,
            "maximum": 7
          },
          "physicalHandLength": 7,
          "physicalCardRange": [
            -1,
            14
          ],
          "activePlayableSlots": "one-through-maxCardCount-minus-one",
          "activePlayableCards": "minus-one-vacancy-or-one-through-fourteen-no-zero",
          "slotZeroAndInactiveTail": "minus-one-through-fourteen-with-unchanged-TurnStart-treatment",
          "playedCardRange": [
            -1,
            14
          ],
          "booleans": "canRethink-and-crumbled-required",
          "cardTapeLength": 18,
          "cardTapeRange": [
            1,
            14
          ],
          "deckCursor": {
            "minimum": 0,
            "maximum": 18
          },
          "domain": "explicit-engineering-domain-not-reachability-proof"
        },
        "timers": {
          "positive": "subtract-one-on-each-team-before-any-first-or-topic-work",
          "zero": "preserve-zero",
          "expiration": "audit-only-one-to-zero-during-TurnEnd-not-later-Bold-reset",
          "attacker": "never-recompute-after-decrement"
        },
        "firstAndTopic": {
          "gate": "original-attacker-zero-or-one",
          "noAttacker": "skip-entire-first-ordinary-topic-and-Sophistry-block",
          "firstTeam": "set-to-original-attacker",
          "ordinaryTopic": "attacker-played-card-one-through-nine-maps-groups-of-three-to-zero-through-two",
          "sophistry": "any-team-played-eleven-and-opponent-played-not-twelve",
          "sophistryDraws": "one-if-any-qualifies-even-if-both-qualify",
          "ordering": "ordinary-topic-update-then-Sophistry-overwrite-including-same-topic",
          "playedCards": "original-values-retained-until-TurnStart-resets-them",
          "attackerIdentity": "debate-attacker-not-combo-attacker"
        },
        "turnStart": {
          "implementation": "unchanged-evaluateDebateTurnStart",
          "calls": 1,
          "policy": {
            "id": "debate-turn-start-bounded-current-deck-policy-v1",
            "profile": "debate-turn-start-reference-v1",
            "mode": {
              "kind": "bounded-current-deck",
              "isTutorial": false,
              "tutorialHandling": "explicit-false-required-true-rejected-not-skipped-fill",
              "teamCount": 2,
              "teamOrder": [
                0,
                1
              ],
              "sequence": [
                "reset-played-card",
                "grant-rethink-if-crumbled",
                "grant-rethink-if-positive-timer-calm",
                "evaluate-unchanged-current-deck-hand-fill",
                "reset-positive-bold-timer-if-final-active-topic-count-zero",
                "clear-crumbled"
              ],
              "ordering": "entire-team-zero-sequence-before-entire-team-one-sequence"
            },
            "checkpoint": {
              "personality": "caller-resolved-timid-calm-bold-or-reckless",
              "angerTimer": {
                "minimum": 0,
                "maximum": 4
              },
              "maxCardCount": {
                "minimum": 4,
                "maximum": 7
              },
              "physicalHandLength": 7,
              "physicalCardRange": [
                -1,
                14
              ],
              "activePlayableSlots": "one-through-maxCardCount-minus-one",
              "activePlayableCards": "minus-one-vacancy-or-one-through-fourteen-no-zero",
              "slotZeroInput": "any-minus-one-through-fourteen-restored-to-zero-by-fill",
              "inactiveTail": "any-minus-one-through-fourteen-preserved-without-fill-or-sort",
              "playedCardRange": [
                -1,
                14
              ],
              "booleans": "canRethink-and-crumbled-required",
              "cardTapeLength": 18,
              "cardTapeRange": [
                1,
                14
              ],
              "deckCursor": {
                "minimum": 0,
                "maximum": 18
              },
              "domain": "explicit-engineering-checkpoint-domain",
              "reachability": "not-a-proof-of-universal-or-source-reachable-state"
            },
            "rethinkQuota": {
              "operation": "set-true-if-crumbled-or-positive-timer-calm-otherwise-preserve",
              "falseAssignment": "never",
              "calmBonusAndRandomness": "not-part-of-TurnStart"
            },
            "fill": {
              "implementation": "unchanged-evaluateDebateHandFill",
              "policy": {
                "id": "debate-hand-fill-current-deck-policy-v1",
                "profile": "debate-hand-fill-reference-v1",
                "cards": {
                  "representation": "pinned-modern-enum-numeric-code",
                  "rethink": 0,
                  "topicFirst": 1,
                  "topicLast": 9,
                  "rhetoricFirst": 10,
                  "rhetoricLast": 14,
                  "playableMin": 1,
                  "playableMax": 14
                },
                "slots": {
                  "input": "playable-only-original-source-order",
                  "vacancy": null,
                  "sourceSlotOffset": 1,
                  "playableCounts": [
                    3,
                    4,
                    5,
                    6
                  ],
                  "reservedSlot": 0,
                  "reservedCard": 0,
                  "reservedHandling": "restore-before-fill"
                },
                "deck": {
                  "id": "provided-current-deck-18-v1",
                  "sourceDeckTableSize": 18,
                  "providedEntries": 18,
                  "fillOrder": "ascending-vacant-original-source-slot",
                  "consume": "advance-one-per-filled-slot",
                  "exhaustion": "unsupported-deck-regeneration",
                  "regeneration": "excluded",
                  "nativeDistribution": false
                },
                "repair": {
                  "condition": "post-fill-topic-count-zero-and-new-slot-exists",
                  "target": "last-new-original-source-slot",
                  "drawRole": "debate-fill-topic-repair",
                  "drawBound": 9,
                  "cardMapping": "1+raw-value",
                  "noNewSlot": "skip-even-with-no-topic"
                },
                "sort": {
                  "key": "numeric-card-code-ascending",
                  "scope": "all-source-slots-including-reserved-zero",
                  "equalCodeAuditTie": "preSortSlot-ascending-engine-policy",
                  "nativeEqualCodeIdentityOrder": false
                },
                "randomness": {
                  "source": "caller-supplied-draws",
                  "validation": "syntax-before-fill-semantic-at-repair",
                  "count": "one-only-if-repair-applies",
                  "extra": "atomic-rejection",
                  "externalRngConsumed": 0,
                  "nativePrng": false
                },
                "capacity": {
                  "maxInputNodes": 1024,
                  "maxInputDepth": 12,
                  "maxInputArrayLength": 32,
                  "maxCanonicalUtf8Bytes": 16384
                },
                "boundary": {
                  "kind": "independent-character-fill-kernel",
                  "sessionIntegration": false,
                  "persistence": false,
                  "legacyProfilesChanged": false
                }
              },
              "mapping": "active-minus-one-to-null-only",
              "output": "sorted-active-prefix-over-original-seven-slot-backing-tail",
              "currentDeckOnly": true,
              "cursorAtEighteen": "accepted-with-no-vacancies-otherwise-unsupported-deck-regeneration",
              "failure": "propagate-typed-reason-and-discard-whole-two-team-result",
              "nestedReceipt": "preserve-unchanged-including-local-drawIndex-zero"
            },
            "bold": {
              "gate": "positive-anger-timer-and-bold-personality",
              "countSource": "final-post-repair-active-prefix",
              "countSlots": "zero-through-maxCardCount-minus-one",
              "topicCardRange": [
                1,
                9
              ],
              "zeroCount": "reset-anger-timer-to-zero",
              "nonzeroCount": "preserve-anger-timer",
              "preRepairCount": "never-use-nested-topicCardCountAfterFill-for-Bold"
            },
            "randomness": {
              "rawDrawsPerTeam": "zero-or-one-existing-hand-fill-repair-draw",
              "role": "debate-fill-topic-repair",
              "bound": 9,
              "values": [
                0,
                8
              ],
              "parsing": "both-complete-checkpoints-and-draw-syntax-and-domain-before-evaluation",
              "requiredOrUnusedDraw": "unchanged-kernel-repair-phase-validation",
              "flatAudit": "team-order-with-separate-flatDrawIndex-and-localDrawIndex",
              "externalRngConsumed": 0,
              "callerCallbacks": "excluded"
            },
            "safety": {
              "input": "closed-schema-detached-safe-JSON-data-with-exact-policy",
              "requiredRuntime": "trusted-node-util-types-isProxy-via-process-getBuiltinModule",
              "unavailableProxyDetector": "fail-closed-before-inspecting-input",
              "proxiesAccessorsAndExecutableValues": "rejected-without-invocation",
              "output": "recursively-frozen-and-detached-from-caller",
              "failure": "typed-code-only-no-state-or-partial-receipt"
            },
            "capacity": {
              "maxInputNodes": 2048,
              "maxInputDepth": 12,
              "maxInputArrayLength": 32,
              "maxCanonicalUtf8Bytes": 32768,
              "handFillCalls": 2,
              "maxRepairDraws": 2,
              "maxFilledSlots": 12
            },
            "boundary": {
              "kind": "standalone-two-team-non-tutorial-turn-start-composition",
              "personalityResolution": "caller-supplied-no-person-lookup-or-fallback",
              "tutorialBranch": "excluded",
              "deckGenerate": "excluded-not-duplicated",
              "turnEndAndTimerDecrement": "excluded",
              "attackAndRethinkAction": "excluded",
              "fullSessionAndPersistence": "excluded",
              "p078": "excluded",
              "legacyProfilesChanged": false
            }
          },
          "input": "decremented-timers-still-original-playedCards-and-all-other-character-fields",
          "validation": "complete-safe-outer-parse-before-single-dependency-call-no-probe-call",
          "failure": "propagate-typed-reason-and-discard-entire-transition",
          "receipt": "preserve-full-unchanged-receipt-and-all-nested-draw-indices",
          "algorithms": "no-copied-fill-Bold-quota-or-deck-generation"
        },
        "randomness": {
          "topicRawDraws": "zero-or-one",
          "topicRole": "debate-turn-end-topic-reroll",
          "topicBound": 3,
          "topicValues": [
            0,
            2
          ],
          "fillRawDraws": "existing-zero-or-one-per-team-TurnStart-input",
          "parsing": "both-complete-characters-and-all-topic-and-fill-draw-syntax-before-evaluation",
          "demand": "TurnEnd-topic-demand-before-TurnStart-team-zero-then-team-one-fill-demand",
          "auditOrder": [
            "turn-end-topic",
            "turn-start-team-zero-fill",
            "turn-start-team-one-fill"
          ],
          "wrapperIndices": "flatDrawIndex-with-separate-turnStartFlatDrawIndex-and-localDrawIndex",
          "nestedIndices": "unchanged",
          "externalRngConsumed": 0,
          "callerCallbacks": "excluded"
        },
        "safety": {
          "input": "closed-schema-detached-safe-JSON-data-with-exact-policy",
          "requiredRuntime": "trusted-node-util-types-isProxy-via-process-getBuiltinModule",
          "unavailableProxyDetector": "fail-closed-before-inspecting-input",
          "proxiesAccessorsAndExecutableValues": "rejected-without-invocation",
          "output": "recursively-frozen-and-detached-from-caller",
          "failure": "typed-code-only-no-partial-timers-first-topic-or-fill-state"
        },
        "capacity": {
          "maxInputNodes": 4096,
          "maxInputDepth": 16,
          "maxInputArrayLength": 32,
          "maxCanonicalUtf8Bytes": 65536,
          "turnStartCalls": 1,
          "nestedHandFillCalls": 2,
          "maxTopicDraws": 1,
          "maxFillRepairDraws": 2,
          "maxTotalDraws": 3
        },
        "boundary": {
          "kind": "standalone-nonterminal-non-tutorial-round-transition",
          "winnerAndHitPoints": "not-calculated-or-reclassified",
          "attackerCalculation": "excluded",
          "damageAndAngerAction": "excluded",
          "comboAttacker": "not-input-not-substituted-for-debate-attacker",
          "tutorialBranch": "excluded",
          "deckGenerate": "excluded-current-eighteen-card-tape-only",
          "sourceLogsViewAndEngineCallbacks": "not-executed",
          "phaseSchedulingAndFullSession": "excluded",
          "persistence": "excluded",
          "p078": "excluded",
          "legacyProfilesChanged": false
        }
      },
      "order": [
        "complete-anger-phase",
        "inspect-actual-winner",
        "conditional-round-transition"
      ],
      "nestedResults": "preserve-complete-dependency-successes-including-all-policies-evidence-and-receipts",
      "noValidationProbes": true,
      "noCopiedGameplay": true
    },
    "input": {
      "envelope": "schemaVersion-profile-policies-anger-transition",
      "anger": "complete-unchanged-public-anger-input-with-its-complete-exact-policy",
      "transition": "isTutorial-attacker-currentTopic-two-team-metadata-topicRawDraws",
      "teamMetadata": "playedCard-canRethink-current18-cardTape-deckCursor-rawDraws",
      "singleSource": "hp-stress-strength-personality-timer-capacity-hand-combo-firstTeam-winner-and-crumble-come-only-from-anger",
      "parseOrder": "detach-entire-envelope-then-parse-all-transition-syntax-and-canonical-initial-hands-before-actual-anger-call",
      "nestedValidation": "anger-public-call-validates-its-full-closed-schema-before-its-own-gameplay"
    },
    "admission": {
      "kind": "explicit-engineering-intersection-not-universal-source-reachability",
      "genericOnly": true,
      "isTutorial": false,
      "initialWinner": -1,
      "initialHp": {
        "minimum": 1,
        "maximum": 1000
      },
      "initialCombo": "inactive-under-unchanged-anger-policy",
      "initialHand": {
        "physicalLength": 7,
        "maxCardCount": {
          "minimum": 4,
          "maximum": 7
        },
        "slotZero": 0,
        "activeOtherSlots": "minus-one-vacancy-or-one-through-fourteen-no-zero",
        "inactiveTail": "minus-one-through-fourteen",
        "preservation": "existing-anger-removals-shift-only-active-prefix-and-write-minus-one-never-introduce-active-zero"
      },
      "playedCard": {
        "minimum": -1,
        "maximum": 14
      },
      "cardTape": {
        "length": 18,
        "minimum": 1,
        "maximum": 14
      },
      "deckCursor": {
        "minimum": 0,
        "maximum": 18
      },
      "attacker": [
        -1,
        0,
        1
      ],
      "currentTopic": {
        "minimum": -2147483648,
        "maximum": 2147483647
      },
      "flags": "canRethink-required-boolean-in-metadata-crumbled-owned-by-anger",
      "widerActionOutputs": "not-accepted-arbitrarily-no-PR120-or-other-wider-output-admission-claim",
      "otherAngerBounds": "unchanged-complete-anger-policy"
    },
    "routing": {
      "source": "AngerPhase-case-three-or-eight-winner-before-TurnEndPhase-then-TurnStart",
      "terminal": "anger-winner-not-minus-one",
      "terminalResult": "terminal-pending-classification",
      "terminalTransitionCalls": 0,
      "terminalDraws": "all-topic-and-both-fill-draw-arrays-must-be-empty",
      "terminalMetadata": "preserve-firstTeam-attacker-currentTopic-playedCards-quota-cardTapes-and-cursors",
      "nonterminal": "anger-winner-minus-one",
      "nonterminalResult": "ready-for-play",
      "firstPassTerminal": "anger-dependency-skips-second-pass-and-crumble",
      "secondPassTerminal": "anger-dependency-finishes-crumble-before-winner",
      "classification": "do-not-call-CanCritical-Critical-or-Closing"
    },
    "mapping": {
      "afterAnger": "overlay-mutated-hp-stress-timer-hand-combo-crumble-levels-and-flags-over-carried-metadata",
      "roundInput": "post-anger-personality-timer-capacity-hand-crumble-plus-original-playedCards-quota-cardTapes-cursors-and-draws",
      "ordinaryAttacker": "original-transition-attacker-never-combo-attacker-never-recomputed-after-timer-decay",
      "topic": "original-currentTopic-until-round-transition-applies-source-rules",
      "afterRound": "overlay-timer-hand-playedCard-canRethink-crumbled-cardTape-deckCursor-firstTeam-currentTopic",
      "preservedAfterRound": "hp-stress-strength-personality-capacity-combo-crumble-levels-attacker-and-winner",
      "rawDraws": "evaluation-input-only-not-persistent-character-state"
    },
    "randomness": {
      "supplied": "anger-two-pass-draws-plus-transition-topic-and-two-fill-arrays",
      "syntax": "all-transition-draw-syntax-validated-before-anger-even-on-terminal-route",
      "demand": "unchanged-anger-then-unchanged-round-dependencies-except-terminal-unused-transition-rejection",
      "order": [
        "anger-pass-one",
        "anger-pass-two-if-executed",
        "turn-end-topic",
        "turn-start-team-zero-fill",
        "turn-start-team-one-fill"
      ],
      "globalIndex": "flatDrawIndex-zero-based-contiguous-across-executed-stages",
      "angerIndices": "preserve-angerGlobalIndex-pass-passDrawIndex-and-combo-attacker-teamIndex",
      "transitionIndices": "preserve-roundTransitionFlatDrawIndex-teamIndex-localDrawIndex-and-turnStartFlatDrawIndex-where-present",
      "nestedIndices": "never-rewrite-dependency-results",
      "maximumAngerDraws": 8,
      "maximumTopicDraws": 1,
      "maximumFillDraws": 2,
      "maximumTotalDraws": 11,
      "maximumMeaning": "conservative-sum-of-dependency-bounds-not-simultaneous-attainability-claim",
      "externalRngConsumed": 0,
      "implementation": "none-no-native-stream-claim"
    },
    "safety": {
      "input": "closed-schema-detached-safe-JSON-data-with-complete-exact-policies",
      "requiredRuntime": "trusted-node-util-types-isProxy-via-process-getBuiltinModule",
      "unavailableProxyDetector": "fail-closed-before-inspecting-input",
      "proxiesAccessorsAndExecutableValues": "rejected-without-invocation",
      "output": "recursively-frozen-detached-from-caller",
      "failure": "typed-wrapper-validation-or-tagged-complete-dependency-failure-no-partial-state-or-receipt",
      "dependencyFailure": "retain-anger-pass-and-kernelReason-and-all-other-existing-failure-fields"
    },
    "capacity": {
      "maxInputNodes": 16384,
      "maxInputDepth": 24,
      "maxInputArrayLength": 64,
      "maxCanonicalUtf8Bytes": 131072,
      "angerCalls": 1,
      "roundTransitionCalls": 1,
      "nestedEntryCalls": 2,
      "nestedComboCalls": 2,
      "nestedTurnStartCalls": 1,
      "nestedHandFillCalls": 2,
      "maxConsumedDraws": 11,
      "policyCopiesInInput": "one-anger-and-one-round-in-wrapper-policy-plus-one-anger-in-nested-input",
      "budgetProof": "three-fixed-dependency-policies-plus-bounded-wrapper-policy-and-checkpoints-no-state-or-policy-amplification-in-dependency-inputs",
      "dependencyBudgets": "unchanged-anger4096-depth16-array64-bytes65536-round4096-depth16-array32-bytes65536",
      "output": "bounded-full-receipts-not-subject-to-input-budget-and-not-a-valid-next-input-envelope"
    },
    "boundary": {
      "kind": "bounded-post-anger-to-ready-or-terminal-pending-classification-reference-transaction",
      "ordinaryNormalAttack": "excluded",
      "winnerClassification": "excluded",
      "deckRegeneration": "excluded-current-eighteen-card-tapes-only",
      "exhaustedCurrentTape": "unchanged-round-failure-when-refill-needs-regeneration",
      "tutorial": "excluded",
      "oldNineCardProfile": "excluded",
      "p078": "excluded",
      "personAndAttackResolution": "caller-supplied-not-derived",
      "sourcePhaseSchedulingViewLogsAndCallbacks": "not-executed",
      "fullTurnFullSessionCampaignAndPersistence": "excluded",
      "legacyProfilesChanged": false
    }
  },
  "evidence": {
    "sourceIdentity": "modern-CSharp-translation-not-native-original-PK-or-Vanilla",
    "repository": "https://github.com/tankyc/sango_infinity",
    "sourceCommit": "a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef",
    "debatePath": "Project/Assets/Sango/Scripts/Game/Debate/Debate.cs",
    "debateBlob": "0137498d10773cd4596d497083ccdf6a26b3a261",
    "debateSha256": "622789ca8b8b6799a321526dcfb513d6622adf5b5d54025175c2a7795ef7da28",
    "phasePath": "Project/Assets/Sango/Scripts/Game/Debate/DebatePhase.cs",
    "phaseBlob": "6aa98f855a5d4d172cde7e8ffc18a141b8a7b587",
    "phaseSha256": "5b47f7b6a89d6123a23e7c14f22168e59c9edd549e98d9bc0258d8a55bb9cbf3",
    "sourceAngerPhaseLines": [
      333,
      390
    ],
    "sourceWinnerLines": [
      1379,
      1396
    ],
    "sourceExcludedCriticalLines": [
      1398,
      1406
    ],
    "sourceTurnEndPhaseLines": [
      262,
      274
    ],
    "sourceTurnStartPhaseLines": [
      163,
      168
    ],
    "sourceTurnEndLines": [
      1083,
      1126
    ],
    "sourceTurnStartLines": [
      1046,
      1079
    ],
    "route": "actual-anger-winner-branches-before-TurnEnd-only-nonterminal-proceeds-to-TurnStart",
    "attacker": "source-ordinary-debate-attacker-distinct-from-comboAttacker",
    "anger": {
      "sourceIdentity": "modern-CSharp-translation-not-native-or-PK-or-Vanilla",
      "repository": "https://github.com/tankyc/sango_infinity",
      "sourceCommit": "a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef",
      "debatePath": "Project/Assets/Sango/Scripts/Game/Debate/Debate.cs",
      "debateBlob": "0137498d10773cd4596d497083ccdf6a26b3a261",
      "debateSha256": "622789ca8b8b6799a321526dcfb513d6622adf5b5d54025175c2a7795ef7da28",
      "phasePath": "Project/Assets/Sango/Scripts/Game/Debate/DebatePhase.cs",
      "phaseBlob": "6aa98f855a5d4d172cde7e8ffc18a141b8a7b587",
      "phaseSha256": "5b47f7b6a89d6123a23e7c14f22168e59c9edd549e98d9bc0258d8a55bb9cbf3",
      "sourceAngerPhaseLines": [
        333,
        390
      ],
      "sourceAngerTriggerLines": [
        1300,
        1325
      ],
      "sourceAngerLines": [
        1328,
        1354
      ],
      "sourceComboAttackLines": [
        1356,
        1377
      ],
      "sourceWinnerLines": [
        1379,
        1396
      ],
      "sourceExcludedCriticalLines": [
        1398,
        1406
      ],
      "sourceCalcAngeringLines": [
        1483,
        1517
      ],
      "sourceCrumbleLines": [
        1520,
        1531
      ],
      "entryDependency": "debate-anger-entry-reference-v1",
      "comboDependency": "debate-timid-combo-reference-v1",
      "phaseEvidence": "first-reflecting-entry-whole-combo-winner-then-second-nonreflecting-entry-whole-combo-crumble-winner",
      "winnerEvidence": "opponent-hp-tested-first-so-simultaneous-terminal-prefers-firstTeam",
      "crumbleEvidence": "truncate-and-clamp-level-difference-latches-flag-in-either-direction-unchanged-level-preserves-flag",
      "compressionBoundary": "source-step-ticks-compressed-no-view-or-external-phase-execution",
      "initialCheckpointAndGenericAdmission": "explicit-engine-policy-not-complete-source-state-reachability",
      "inputSafetyBudgetsAuditAndReasonNames": "engine-policy",
      "nativeEquivalent": false,
      "stockOriginalVerified": false,
      "pkEquivalent": false,
      "vanillaEquivalent": false,
      "completeDebate": false,
      "originalUnresolvedGroups": 43,
      "originalHistoricalSnapshots": 45,
      "nativeWholeChain": "open",
      "p078": "excluded",
      "nativeDeckRegenerationIntegration": "excluded",
      "nativeRngStream": "excluded",
      "legacySessionIntegration": "excluded"
    },
    "transition": {
      "sourceIdentity": "modern-CSharp-translation-not-native-or-Vanilla",
      "repository": "https://github.com/tankyc/sango_infinity",
      "sourceCommit": "a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef",
      "debatePath": "Project/Assets/Sango/Scripts/Game/Debate/Debate.cs",
      "debateBlob": "0137498d10773cd4596d497083ccdf6a26b3a261",
      "debateSha256": "622789ca8b8b6799a321526dcfb513d6622adf5b5d54025175c2a7795ef7da28",
      "debatePhasePath": "Project/Assets/Sango/Scripts/Game/Debate/DebatePhase.cs",
      "debatePhaseBlob": "6aa98f855a5d4d172cde7e8ffc18a141b8a7b587",
      "debateEnumPath": "Project/Assets/Sango/Scripts/Game/Debate/DebateEnum.cs",
      "debateEnumBlob": "5b46a8ac87613193eb9f4b99a25e489ba6f5e483",
      "sourceTurnEndLines": [
        1083,
        1126
      ],
      "sourceTimerDecrementLines": [
        394,
        398
      ],
      "sourceGetCardTopicLines": [
        854,
        872
      ],
      "sourceTurnEndPhaseLines": [
        261,
        274
      ],
      "sourceTurnStartPhaseLines": [
        163,
        168
      ],
      "sourceBehavior": "both-timers-before-original-attacker-first-ordinary-topic-single-Sophistry-reroll",
      "composition": "source-phase-order-TurnEnd-then-TurnStart-without-executing-phase-engine",
      "turnStart": {
        "sourceIdentity": "modern-CSharp-translation-not-native-or-Vanilla",
        "repository": "https://github.com/tankyc/sango_infinity",
        "sourceCommit": "a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef",
        "debatePath": "Project/Assets/Sango/Scripts/Game/Debate/Debate.cs",
        "debateBlob": "0137498d10773cd4596d497083ccdf6a26b3a261",
        "debateSha256": "622789ca8b8b6799a321526dcfb513d6622adf5b5d54025175c2a7795ef7da28",
        "debateEnumPath": "Project/Assets/Sango/Scripts/Game/Debate/DebateEnum.cs",
        "debateEnumBlob": "5b46a8ac87613193eb9f4b99a25e489ba6f5e483",
        "sourceTurnStartLines": [
          1046,
          1079
        ],
        "sourceTimerResetLines": [
          401,
          404
        ],
        "sourceSortLines": [
          406,
          409
        ],
        "sourceFillLines": [
          412,
          438
        ],
        "sourceCardEnumLines": [
          33,
          61
        ],
        "sourceBehavior": "team-local-reset-quota-fill-final-Bold-scan-clear-before-next-team",
        "handFill": {
          "sourceIdentity": "modern-CSharp-translation-not-native-or-Vanilla",
          "sourceCommit": "a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef",
          "debatePath": "Project/Assets/Sango/Scripts/Game/Debate/Debate.cs",
          "debateBlob": "0137498d10773cd4596d497083ccdf6a26b3a261",
          "debateEnumPath": "Project/Assets/Sango/Scripts/Game/Debate/DebateEnum.cs",
          "debateEnumBlob": "5b46a8ac87613193eb9f4b99a25e489ba6f5e483",
          "sourceDeckTableSizeLine": 54,
          "sourceSortLines": [
            406,
            409
          ],
          "sourceFillLines": [
            412,
            438
          ],
          "sourceCardEnumLines": [
            33,
            61
          ],
          "fillEvidence": "pinned-modern-translated-reference-only",
          "deckEvidence": "caller-provided-current-deck-engine-boundary",
          "topicRepairEvidence": "source-TopicFirst-plus-RandInt9-last-new-slot-only",
          "sortEvidence": "source-Array.Sort-numeric-codes-including-reserved-zero",
          "equalCodeAuditEvidence": "engine-preSortSlot-tie-policy-not-native-identity-order",
          "inputSafetyAndBudgets": "engine-policy",
          "nativeEquivalent": false,
          "stockOriginalVerified": false,
          "pkEquivalent": false,
          "vanillaEquivalent": false,
          "completeDebate": false,
          "originalUnresolvedGroups": 43,
          "originalHistoricalSnapshots": 45,
          "nativeWholeChain": "open",
          "p078": "excluded",
          "nativeDeckRegeneration": "excluded",
          "nativeRngStream": "excluded",
          "legacySessionIntegration": "excluded"
        },
        "personalityBoundary": "caller-supplied-CharacterGetPersonality-result",
        "domainBoundsSafetyBudgetsAuditAndReasonNames": "engine-policy-not-source-reachability-proof",
        "nativeEquivalent": false,
        "stockOriginalVerified": false,
        "pkEquivalent": false,
        "vanillaEquivalent": false,
        "completeDebate": false,
        "p078": "excluded",
        "nativeWholeChain": "open",
        "nativeDeckRegeneration": "excluded",
        "nativeRngStream": "excluded",
        "legacySessionIntegration": "excluded"
      },
      "terminalMarker": "winner-minus-one-is-engineering-route-precondition-not-source-TurnEnd-guard",
      "attackerIdentity": "source-debate-attacker-distinct-from-combo-attacker",
      "domainBoundsSafetyBudgetsAuditAndReasonNames": "engineering-policy-not-native-reachability-proof",
      "nativeEquivalent": false,
      "stockOriginalVerified": false,
      "pkEquivalent": false,
      "vanillaEquivalent": false,
      "completeDebate": false,
      "p078": "excluded",
      "nativeWholeChain": "open",
      "nativeDeckRegeneration": "excluded",
      "nativeRngStream": "excluded",
      "legacySessionIntegration": "excluded"
    },
    "implementationBase": "main-20cdd4ef",
    "admissionSafetyBudgetsSchemaAndAuditNames": "explicit-engineering-policy-not-complete-source-reachability",
    "canonicalHandIntersection": "slot-zero-canonical-and-no-active-zero-before-anger-then-existing-active-prefix-removals-preserve-round-admission",
    "compression": "phase-ticks-compressed-to-bounded-data-transaction-no-phase-engine",
    "nativeEquivalent": false,
    "stockOriginalVerified": false,
    "pkEquivalent": false,
    "vanillaEquivalent": false,
    "completeDebate": false,
    "nativeWholeChain": "open",
    "nativeDeckRegeneration": "excluded",
    "nativeRngStream": "excluded",
    "legacySessionIntegration": "excluded",
    "p078": "excluded"
  }
}
```
