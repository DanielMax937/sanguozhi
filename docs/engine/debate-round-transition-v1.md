# 独立舌战回合衔接事务 API v1

[规则与来源边界](../rules/debate-round-transition-v1.md) · [完整固定政策与证据](../sources/debate-round-transition-v1.json) · [独立纸面案例，未运行](../../data/scenarios/debate-round-transition-example-v1.json)。

实现入口为 [debate-round-transition.ts](../../packages/engine/src/debate-round-transition.ts)，公共导出见 [engine index](../../packages/engine/src/index.ts)。本页描述固定现代 C# 参考中的一次有界、非终局、非教程 `TurnEnd → TurnStart` 衔接；后半段直接调用既有且不改动的 `evaluateDebateTurnStart`，再由它调用既有当前牌组填牌核，不复制这两个组件的领域算法。

新层先按队伍0、1递减双方正兴奋计时器，再依原 `attacker` 更新先手、普通牌话题及至多一次诡辩话题抽样，然后将所得完整检查点交给原 TurnStart。TurnStart 使用已经递减的计时器，依队伍0全部步骤、队伍1全部步骤，重置已出牌、恢复额度、补牌、检查刚胆最终活动手牌并清除崩坏。

这是严格准入的独立检查点转换，不是完整舌战 session 或可接受任意前序输出的通用适配器。当前18张牌组、游标、完整七槽手牌、性格、容量、原 attacker、firstTeam、currentTopic 等均由调用者显式提供。`winner=-1` 是本工程限定“非终局衔接”请求的路由标记，不是来源 `TurnEnd` 中的胜负 guard，也不证明任意一方 HP 正数、胜负已正确计算或检查点可达。

## 1. 公开入口与不可变事务

唯一公开求值函数与固定常量为：

```ts
evaluateDebateRoundTransition(input: unknown): DebateRoundTransitionResultV1
DEBATE_ROUND_TRANSITION_POLICY_V1: DebateRoundTransitionPolicyV1
DEBATE_ROUND_TRANSITION_EVIDENCE_V1: DebateRoundTransitionEvidenceV1
```

全部27个公开类型为：

```text
DebateRoundTransitionTeamIndexV1
DebateRoundTransitionAttackerV1
DebateRoundTransitionPersonalityV1
DebateRoundTransitionCardCodeV1
DebateRoundTransitionPhysicalCardV1
DebateRoundTransitionPhysicalHandV1
DebateRoundTransitionRawDrawV1
DebateRoundTransitionTopicRawDrawV1
DebateRoundTransitionCharacterCheckpointV1
DebateRoundTransitionCharacterInputV1
DebateRoundTransitionInputV1
DebateRoundTransitionStateV1
DebateRoundTransitionTimerAuditV1
DebateRoundTransitionFirstTeamAuditV1
DebateRoundTransitionOrdinaryTopicAuditV1
DebateRoundTransitionSophistryTeamCheckV1
DebateRoundTransitionSophistryAuditV1
DebateRoundTransitionTopicConsumedDrawV1
DebateRoundTransitionFillConsumedDrawV1
DebateRoundTransitionConsumedDrawV1
DebateRoundTransitionReceiptV1
DebateRoundTransitionSuccessV1
DebateRoundTransitionFailureReasonV1
DebateRoundTransitionFailureV1
DebateRoundTransitionResultV1
DebateRoundTransitionPolicyV1
DebateRoundTransitionEvidenceV1
```

复合公开DTO递归readonly；下文类型展示省略readonly噪声，只说明结构，不是已运行的调用示例。成功、失败、嵌套收据及常量均递归冻结；输入先安全分离，既不修改或冻结调用者对象，也不在结果中泄漏其可变引用。

失败只有 `{ok:false,reason}`，没有部分状态、组件名、队伍编号、候选receipt或可继续消费的RNG对象。TurnEnd已得到局部候选、队伍0已经完成补牌，均不足以提前提交；只有最终ok:true才可采用完整结果。该函数不保存session、隐式游标或前次调用进度；再次调用是独立求值，而非接续上次失败。

## 2. 完整输入 DTO 与严格准入

输入结构为：

```ts
type DebateRoundTransitionInputV1 = {
  schemaVersion: 1;
  profile: 'debate-round-transition-reference-v1';
  policies: DebateRoundTransitionPolicyV1;
  isTutorial: false;
  winner: -1;
  firstTeam: 0 | 1;
  attacker: -1 | 0 | 1;
  currentTopic: number;
  characters: [DebateTurnStartCharacterInputV1, DebateTurnStartCharacterInputV1];
  topicRawDraws: { role: 'debate-turn-end-topic-reroll'; bound: 3; value: number }[];
};
```

顶层恰有上述十个字段，全部必需；不能省略false、−1、空draw数组、任一完整牌组或完整固定policies。未知键不被忽略。输入不接纳HP、combo、pressure、人物id、种子、RNG callback、precomputed状态、receipt或自定义evidence，不能用这些字段越过本层路由与准入。

| 字段 | 必须提供的值或运行时范围 |
|---|---|
| schemaVersion / profile | 精确为1 / `debate-round-transition-reference-v1` |
| policies | 与完整固定政策逐值相等，包括嵌套原TurnStart政策 |
| isTutorial | 精确为boolean false；其他值不表示跳过某一步 |
| winner | 精确为number −1；0、1或其他值不接纳为本层非终局请求 |
| firstTeam | 0或1 |
| attacker | −1、0或1；提供原TurnEnd攻击者，不接受combo攻击者替代 |
| currentTopic | 有符号32位整数−2147483648..2147483647 |
| characters | 恰好两项，固定队伍0、队伍1次序 |
| topicRawDraws | 稠密数组，长度0或1 |
| 每项topic draw | 恰有role、bound、value；role固定、bound=3、整数value=0..2 |

currentTopic故意保留signed32检查点域，而非仅允许0..2；没有来源赋值分支时须原样保留给定值，不能擅自钳制或随机补正。只有普通牌赋值或实际诡辩重抽把话题改为0..2。此宽域同样是工程准入，不证明任意signed32值都是可达话题。

每项characters严格沿用原TurnStart输入，恰有以下十个字段：

```ts
type DebateTurnStartCharacterInputV1 = {
  personality: 'timid' | 'calm' | 'bold' | 'reckless';
  angerTimer: number;
  maxCardCount: number;
  hand: [PhysicalCard, PhysicalCard, PhysicalCard, PhysicalCard,
         PhysicalCard, PhysicalCard, PhysicalCard];
  playedCard: PhysicalCard;
  canRethink: boolean;
  crumbled: boolean;
  cardTape: CardCode[];
  deckCursor: number;
  rawDraws: { role: 'debate-fill-topic-repair'; bound: 9; value: number }[];
};
type CardCode = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14;
type PhysicalCard = -1 | 0 | CardCode;
```

新层的TeamIndexV1为0|1，AttackerV1为−1|0|1；PersonalityV1、CardCodeV1、PhysicalCardV1、RawDrawV1、CharacterCheckpointV1、CharacterInputV1直接沿用同名后缀的原TurnStart公开类型，PhysicalHandV1为递归readonly七槽元组。TopicRawDrawV1单独定义为上述bound3的topic draw。新层RawDrawV1仍专指bound9的填牌修补draw，不是两个角色的联合类型。

这里的CardCode／PhysicalCard只是便于阅读的结构缩写，不增加原组件的牌码范围。CharacterCheckpoint拥有相同人物字段，但不含rawDraws；抽样请求不属于持久人物状态。

| 人物字段 | 约束 |
|---|---|
| personality | 四个给定字符串之一，由调用方预先解析，不做人物查表或fallback |
| angerTimer | 整数0..4 |
| maxCardCount | 整数4..7 |
| hand | 恰好七项；每项整数−1..14 |
| hand[0] | −1..14，可被原填牌恢复为0 |
| hand[1..maxCardCount−1] | 只能是−1空位或1..14；0明确拒绝 |
| hand[maxCardCount..6] | −1..14，原样保留但不进入活动逻辑 |
| playedCard | 整数−1..14，即使随后将重置也必须有效 |
| canRethink / crumbled | 精确boolean，不做真值转换 |
| cardTape | 恰好18项，所有项为整数1..14，包括本次不会读取的项 |
| deckCursor | 整数0..18 |
| rawDraws | 每队独立的稠密数组，长度0或1 |
| 每项fill draw | 恰有role、bound、value；固定role、bound=9、整数value=0..8 |

所有数字在进入上述领域范围前，已要求为安全整数且不能是−0；NaN、Infinity、分数、unsafe integer不进入普通范围错误。字符串不会转为数字。数字−1是显式空位，不接受数组洞。重复牌码、未预排序手牌以及playedCard不在当前手牌中均不被额外拒绝；不据此推导牌身份或证明合法历史。

现代牌码为：−1空，0再考；1..3故事、4..6道理、7..9时节，各为小／中／大；10大喝、11诡辩、12无视、13镇静、14激昂。话题重抽使用bound3、value0..2；填牌修补使用bound9、value0..8并映射为普通牌1+value，二者不能借用或互换。

## 3. 来源执行顺序与组合边界

安全分离、封闭结构解析、两队全部牌组及抽样域检查先于领域求值。之后严格按以下阶段执行，不按 firstTeam 换序：

1. 队伍0的正计时器减1，否则保留0；然后队伍1执行相同步骤。这一步先于任何先手或话题处理，也先于任何 TurnStart 的额度恢复或补牌。
2. 若原 attacker 为0或1，令 firstTeam=attacker，读取该队尚未重置的原 playedCard。若为1..9普通话题牌，按1..3→话题0、4..6→话题1、7..9→话题2更新 currentTopic；其他牌码不因此改话题。
3. 仅在原 attacker 有效的同一分支内，检查两队原 playedCard：任意一队出11诡辩且对手不为12无视，便需要一次 bound=3 抽样并将 currentTopic 设为其0..2结果。即使两队都满足条件，也只抽一次；无需保证新旧话题不同。
4. 若 attacker=-1，整个先手与话题分支均跳过。firstTeam 和 currentTopic 保留，既不应用普通牌话题，也不检查或触发诡辩重抽；双方计时器递减仍已发生。
5. 在完成上述全部 TurnEnd 处理后，调用一次原 `evaluateDebateTurnStart`。传入同一人物检查点，仅计时器改为递减后的值；playedCard 和 crumbled 等由原 TurnStart 按其本身顺序处理，不在外层提前抹除。
6. 原 TurnStart 按队伍0全流程、队伍1全流程执行。仅当整个调用成功，才一并发布最终状态、TurnEnd 审计和完整 TurnStart 收据。

### 3.1 原 attacker 不是组合攻击者

本层接受来源 `TurnEnd` 所读的原 `attacker`，而不是攻击结算中的 `combo.attacker`、最终出手者、获益者或上一层某个同名派生字段。两者可能不一致，不能互换。`attacker=-1` 也是明确有效的输入状态，不应通过比较牌、计时器、性格、伤害或先手“补算”成某队。

本层从不调用攻击者选择、组合攻击、伤害、胜负分类或清算内核。调用方必须在自己的证据链内选择正确的原字段；静态类型或本层成功只说明检查点通过本层准入，不认证其前序来源。不能宣称任意 PR120 输出都可直接适配：若活动可出牌槽出现0，仍按既有 TurnStart 的严格域拒绝，不做静默归一化。

### 3.2 递减后的冷静与独立的崩坏恢复

原 TurnStart 的冷静条件仍为 `angerTimer>0 && personality==='calm'`，没有被新层更改，但它现在看到的是 TurnEnd 之后的计时器。因此原冷静timer=1会先成为0，不再因冷静恢复额度；原timer=2先成为1，仍恢复额度。原 canRethink=true 不因这次条件不成立而清成false。

崩坏恢复是独立条件：即使冷静timer=1→0，只要原 crumbled=true，TurnStart 仍将额度设true，然后最终清除崩坏。不能把“兴奋结束”理解为取消全部恢复资格。非冷静性格的正计时器不会被误算为冷静恢复。

### 3.3 最终活动手牌决定刚胆，而非修补前计数

TurnStart 的刚胆 gate 同样使用递减后的计时器。原timer=1→0时不进入刚胆话题扫描，嵌套审计为 timer-zero；原timer=2→1且性格为刚胆时，才统计补牌、必要话题修补、活动排序之后的最终活动前缀中的1..9。

填牌收据的 `topicCardCountAfterFill` 是修补前计数，不能直接用来决定刚胆归零。它可为0，但本次修补已经使最终活动手牌含有普通话题牌，此时刚胆timer保留为递减后的正值。反之，已满且全话术的手牌没有新增槽，填牌不修补，最终活动话题仍为0，正刚胆timer才归零。

### 3.4 七槽尾部、有限18牌组与未改动组件

每队始终保留完整七槽 backing array。活动前缀为0..maxCardCount−1，槽0恢复为再考0；仅活动可出牌槽1..maxCardCount−1中的−1映射为填牌核的null空位，已有1..14保持。活动外尾槽逐值保留，不参与填牌、排序或刚胆话题扫描；尾槽中的话题牌不能阻止刚胆归零。

每队各自提供恰好18张的完整当前牌组及0..18游标。无空槽时游标18可成功；确需取下一张而游标已为18时，整笔衔接拒绝。恰好取索引17后到游标18本身不失败。不生成新牌组、不绕回、不共享两队牌组，也不把话题重抽或修补draw当作牌组项。

新层没有放宽 TurnStart 或填牌核的政策、安全预算、错误域或拒绝边界，没有改原模块中的活动槽0拒绝、尾槽保留、局部draw索引、修补和排序规则。完整组件合同见[TurnStart API](debate-turn-start-v1.md)与[当前牌组填牌 API](debate-hand-fill-v1.md)。

## 4. 完整输出、阶段快照与嵌套收据

### 4.1 三份完整快照与一次整体结果

成功结构为：

```ts
type DebateRoundTransitionSuccessV1 = {
  ok: true;
  schemaVersion: 1;
  profile: 'debate-round-transition-reference-v1';
  policy: DebateRoundTransitionPolicyV1;
  evidence: DebateRoundTransitionEvidenceV1;
  state: DebateRoundTransitionStateV1;
  characters: [DebateTurnStartCharacterCheckpointV1, DebateTurnStartCharacterCheckpointV1];
  nextCheckpoint: 'ready-for-play';
  receipt: DebateRoundTransitionReceiptV1;
};
type DebateRoundTransitionStateV1 = {
  isTutorial: false;
  winner: -1;
  firstTeam: 0 | 1;
  attacker: -1 | 0 | 1;
  currentTopic: number;
  characters: [DebateTurnStartCharacterCheckpointV1, DebateTurnStartCharacterCheckpointV1];
};
type DebateRoundTransitionFailureV1 = {
  ok: false;
  reason: DebateRoundTransitionFailureReasonV1;
};
type DebateRoundTransitionResultV1 =
  DebateRoundTransitionSuccessV1 | DebateRoundTransitionFailureV1;
```

state与receipt.after值一致，顶层characters与state.characters值一致。nextCheckpoint是本工程结果标签，表示本次支持域内已完成TurnStart；不证明完整阶段机、UI调度、HP或原生session已进入可玩的状态。

- receipt.before保存原完整State，含双方原计时器、已出牌、额度和崩坏等字段。
- receipt.afterTurnEnd保存双方递减及原attacker分支之后、TurnStart之前的完整State。此时原playedCard、canRethink、crumbled、手牌与牌组游标尚未因TurnStart改动。
- receipt.after保存TurnStart全部成功之后的完整State，保留TurnEnd所得firstTeam、currentTopic及原attacker。winner仍为−1，不在本层重新分类。

三份状态都保留每队完整七槽、完整18牌组和游标，不夹带rawDraws。成功最终每队playedCard=−1、crumbled=false、活动槽0为0，活动可出牌槽补满并数值升序，尾槽不变；牌组内容、性格和容量不变。canRethink仅保留或置true；计时器先递减，再可能因正刚胆无活动话题而归零。

### 4.2 外层完整收据与TurnEnd审计

```ts
type DebateRoundTransitionReceiptV1 = {
  schemaVersion: 1;
  profile: 'debate-round-transition-reference-v1';
  policy: DebateRoundTransitionPolicyV1;
  evidence: DebateRoundTransitionEvidenceV1;
  before: DebateRoundTransitionStateV1;
  afterTurnEnd: DebateRoundTransitionStateV1;
  after: DebateRoundTransitionStateV1;
  timerOrder: [0, 1];
  timers: [DebateRoundTransitionTimerAuditV1, DebateRoundTransitionTimerAuditV1];
  firstTeam: DebateRoundTransitionFirstTeamAuditV1;
  ordinaryTopic: DebateRoundTransitionOrdinaryTopicAuditV1;
  sophistry: DebateRoundTransitionSophistryAuditV1;
  turnStart: DebateTurnStartReceiptV1;
  turnStartDrawOffset: 0 | 1;
  consumedDraws: DebateRoundTransitionConsumedDrawV1[];
  drawCount: 0 | 1 | 2 | 3;
  externalRngConsumed: 0;
};
type DebateRoundTransitionTimerAuditV1 = {
  teamIndex: 0 | 1;
  before: number;
  after: number;
  decrementApplied: boolean;
  expired: boolean;
};
type DebateRoundTransitionFirstTeamAuditV1 = {
  attacker: -1 | 0 | 1;
  eligible: boolean;
  before: 0 | 1;
  after: 0 | 1;
  reason: 'attacker-minus-one' | 'attacker-selected';
};
type DebateRoundTransitionOrdinaryTopicAuditV1 = {
  eligible: boolean;
  attackerCard: PhysicalCard | null;
  before: number;
  after: number;
  applied: boolean;
  reason: 'attacker-minus-one' | 'attacker-card-not-topic' | 'attacker-topic-card';
};
type DebateRoundTransitionSophistryTeamCheckV1 = {
  teamIndex: 0 | 1;
  playedCard: PhysicalCard;
  opponentPlayedCard: PhysicalCard;
  isSophistry: boolean;
  blockedByIgnore: boolean;
  qualifies: boolean;
};
type DebateRoundTransitionSophistryAuditV1 = {
  eligible: boolean;
  checks: [DebateRoundTransitionSophistryTeamCheckV1, DebateRoundTransitionSophistryTeamCheckV1] | null;
  qualifyingTeams: (0 | 1)[];
  before: number;
  after: number;
  rerollApplied: boolean;
  reason: 'attacker-minus-one' | 'no-unopposed-sophistry' | 'single-topic-reroll';
  providedRawDraws: DebateRoundTransitionTopicRawDrawV1[];
  consumedDraws: DebateRoundTransitionTopicRawDrawV1[];
  drawCount: 0 | 1;
};
```

timerOrder固定[0,1]，timers[0]/[1]对应各队。decrementApplied只在原timer>0时为true；expired只表示本次TurnEnd发生1→0，不把原本0或后续TurnStart刚胆归零记作TurnEnd到期。timers.after与afterTurnEnd的计时器相同，可能不等于最终after中的刚胆计时器。

firstTeam.eligible、ordinaryTopic.eligible、sophistry.eligible均表示原attacker有效的外层gate，不表示一定有普通牌或诡辩。有效attacker即使等于原firstTeam也记录attacker-selected；ordinaryTopic的applied表示普通牌分支执行，不要求数值真的变化。

attacker=-1时，ordinaryTopic.attackerCard=null、applied=false；sophistry.checks=null、qualifyingTeams=[]、rerollApplied=false。null明确表示来源gate没有扫描，不伪造“扫描双方但都不满足”的两项检查。有效attacker时checks固定两项按队伍0、1；blockedByIgnore只有本队确实出11且对手出12时才true，不将任何面对12的普通牌也记作被挡诡辩。

ordinaryTopic.before为原currentTopic，after为普通牌分支后的值；sophistry.before正是这个中间值，after为必要重抽后的值。qualifyingTeams按0、1记录满足条件的队伍，可能为[0,1]，但drawCount仍只为1；没有需要时为0。rerollApplied也不要求话题改变，因为来源仍会进行相同值的SetTopic。

### 4.3 不裁剪、不改写的完整TurnStart收据

receipt.turnStart是原 `evaluateDebateTurnStart` 的完整 `DebateTurnStartReceiptV1`，不是摘要、结果投影或重新命名的外层receipt。其profile、policy、evidence、各队before/after、额度及刚胆审计、完整fill receipt和原抽样索引全部保留：

```ts
type DebateTurnStartReceiptV1 = {
  schemaVersion: 1;
  profile: 'debate-turn-start-reference-v1';
  policy: DebateTurnStartPolicyV1;
  evidence: DebateTurnStartEvidenceV1;
  before: { isTutorial: false; characters: [CharacterCheckpoint, CharacterCheckpoint] };
  after: { isTutorial: false; characters: [CharacterCheckpoint, CharacterCheckpoint] };
  teamOrder: [0, 1];
  teams: [DebateTurnStartTeamReceiptV1, DebateTurnStartTeamReceiptV1];
  consumedDraws: DebateTurnStartConsumedDrawV1[];
  drawCount: 0 | 1 | 2;
  externalRngConsumed: 0;
};
type DebateTurnStartTeamReceiptV1 = {
  teamIndex: 0 | 1;
  before: CharacterCheckpoint;
  after: CharacterCheckpoint;
  playedCardReset: { before: PhysicalCard; after: -1 };
  rethinkQuota: {
    before: boolean; after: boolean;
    crumbledApplied: boolean; calmApplied: boolean;
    reason: 'crumbled-and-positive-calm' | 'crumbled' | 'positive-calm' | 'preserved';
  };
  fill: DebateHandFillReceiptV1;
  bold: {
    eligible: boolean;
    topicCardCount: number | null;
    countSource: 'final-post-repair-active-prefix';
    angerTimerBefore: number;
    angerTimerAfter: number;
    resetApplied: boolean;
    reason: 'timer-zero' | 'personality-not-bold' | 'topic-cards-remain' | 'no-topic-cards-reset';
  };
  crumbledClear: { before: boolean; after: false };
  providedRawDraws: DebateTurnStartRawDrawV1[];
  consumedDraws: DebateTurnStartRawDrawV1[];
  drawCount: 0 | 1;
};
type DebateTurnStartConsumedDrawV1 = {
  flatDrawIndex: number;
  teamIndex: 0 | 1;
  localDrawIndex: 0;
  draw: DebateTurnStartRawDrawV1;
};
```

此处CharacterCheckpoint与第2节定义相同，仅移除rawDraws。嵌套TurnStart before与after分别对应外层afterTurnEnd.characters与after.characters，不含外层firstTeam、attacker、currentTopic或winner，因为原组件本来就没有这些字段。各队bold.angerTimerBefore也是已经经过TurnEnd递减的值，不是原外层before的timer。

rethinkQuota的applied记录条件成立并执行置true，不要求额度原为false；崩坏与正冷静同时成立时两项均true。Bold的reason优先级保持timer-zero、personality-not-bold、topic-cards-remain／no-topic-cards-reset；前两种不扫描话题，topicCardCount=null，不可伪写成0。

每个fill仍是原组件完整收据，哪怕无新增槽或未修补也不省略：

```ts
type DebateHandFillReceiptV1 = {
  schemaVersion: 1;
  profile: 'debate-hand-fill-reference-v1';
  policy: DebateHandFillPolicyV1;
  evidence: DebateHandFillEvidenceV1;
  before: { playableSlots: (CardCode | null)[]; deckCursor: number };
  after: { hand: [0, ...CardCode[]]; deckCursor: number };
  reservedSlot: { preSortSlot: 0; card: 0 };
  filled: { preSortSlot: number; tapeIndex: number; card: CardCode }[];
  postFillHand: [0, ...CardCode[]];
  preSortHand: [0, ...CardCode[]];
  topicCardCountAfterFill: number;
  lastNewSlot: number | null;
  repair:
    | { status: 'applied'; preSortSlot: number; beforeCard: CardCode;
        afterCard: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
        drawIndex: 0; rawValue: number }
    | { status: 'skipped'; reason: 'topic-present' | 'no-new-slot' };
  consumedDraws: DebateHandFillRawDrawV1[];
  drawCount: 0 | 1;
  sortedProvenance: {
    sortedIndex: number;
    preSortSlot: number;
    origin: 'reserved-rethink' | 'retained' | 'tape';
    tapeIndex: number | null;
    originalCard: 0 | CardCode;
    card: 0 | CardCode;
    topicRepairApplied: boolean;
  }[];
};
```

以上fill结构只为解释嵌套完整性，精确原类型细分仍以[填牌API](debate-hand-fill-v1.md)为准，不额外导出或改写组件类型。filled及postFillHand保留修补前实际取牌，preSortHand为修补后排序前，after.hand为活动排序后。repair只改最后新增槽，不退还原取牌；sortedProvenance保留原槽、牌组索引和originalCard。等码按原槽顺序审计是工程约定，不证明来源Array.Sort的牌身份稳定顺序。

## 5. 显式抽样、固定政策与证据

### 5.1 三层索引互不覆盖

```ts
type DebateRoundTransitionTopicConsumedDrawV1 = {
  flatDrawIndex: number;
  stage: 'turn-end-topic';
  teamIndex: null;
  localDrawIndex: 0;
  draw: DebateRoundTransitionTopicRawDrawV1;
};
type DebateRoundTransitionFillConsumedDrawV1 = {
  flatDrawIndex: number;
  stage: 'turn-start-fill';
  teamIndex: 0 | 1;
  turnStartFlatDrawIndex: number;
  localDrawIndex: 0;
  draw: DebateRoundTransitionRawDrawV1;
};
type DebateRoundTransitionConsumedDrawV1 =
  DebateRoundTransitionTopicConsumedDrawV1 | DebateRoundTransitionFillConsumedDrawV1;
```

外层consumedDraws按实际消费顺序排列：可选TurnEnd话题draw，随后原TurnStart的队伍0修补draw、队伍1修补draw。flatDrawIndex从0连续递增，不给未消费的阶段留空洞。话题draw属于全局话题变化，teamIndex=null，不绑定到某个诡辩队，也不附带turnStartFlatDrawIndex。

turnStartDrawOffset为0或1，等于本次话题draw数。每个fill项的外层flatDrawIndex等于turnStartDrawOffset加该项turnStartFlatDrawIndex；后者是原TurnStart receipt.consumedDraws中的索引，localDrawIndex仍为原填牌核的0。外层只增加审计项，不改变嵌套TurnStart flatDrawIndex或每队fill.repair.drawIndex。

例如话题重抽与两队修补都发生时，外层序号为0、1、2；两个fill的turnStartFlatDrawIndex为0、1，两个localDrawIndex与嵌套repair.drawIndex都仍是0。若没有话题重抽且只有队伍1修补，则唯一项为flatDrawIndex=0、turnStartFlatDrawIndex=0、teamIndex=1、localDrawIndex=0。

sophistry保留topic providedRawDraws与consumedDraws；各队fill draw的提供与消费保留在完整turnStart.teams中。成功时不允许有合法但闲置的draw，各提供数组与对应消费数组值一致。数组分开记录是为了区分“提供”与“确实需要并采用”，不能在领域成功前把提供视作消费。

全事务最多1个topic draw、2个fill修补draw，总计3项。当前牌组消费另由各fill receipt的filled/tapeIndex/deckCursor记录，不计入这3项supplied draw。externalRngConsumed=0只表示函数未调用外部RNG，不意味着本次没有采用调用者给的draw，也不证明原生PRNG流、概率映射或跨调用随机流。

### 5.2 完整常量的唯一合同位置

`DebateRoundTransitionPolicyV1`与`DebateRoundTransitionEvidenceV1`分别是实现中完整POLICY与EVIDENCE字面值的递归readonly类型；常量也递归冻结。政策id固定为 `debate-round-transition-bounded-current-deck-policy-v1`。请求policies必须逐值等于完整政策，不接受只给id、删减嵌套成员、改预算、追加新字段或替换为TurnStart政策。JSON record的键顺序不影响规范比较，数组顺序仍影响。

完整固定常量保存在[来源JSON](../sources/debate-round-transition-v1.json)，本页不重复巨大嵌套常量。policy的顶层键为 `id,profile,mode,checkpoint,timers,firstAndTopic,turnStart,randomness,safety,capacity,boundary`。其中turnStart.policy包含不变的完整原TurnStart政策，原TurnStart又保留原填牌政策；不能因外层实现了TurnEnd而篡改嵌套组件自身“独立TurnStart不做TurnEnd”的边界文字。

evidence保留新层sourceIdentity／repository／sourceCommit、Debate与DebatePhase及枚举身份、五组新来源行范围、sourceBehavior、composition、完整turnStart证据、terminalMarker、attackerIdentity及工程域说明。nativeEquivalent、stockOriginalVerified、pkEquivalent、vanillaEquivalent、completeDebate均为false，nativeWholeChain保持open；P078、原生牌组生成、原生RNG流及旧会话接入保持excluded。嵌套组件自己的证据身份与43／45历史边界原样保存，不被新层覆盖。

## 6. 全部错误与解析优先级

`DebateRoundTransitionFailureReasonV1`包含原TurnStart的24个失败字面值与本层新增8项，共32项。失败只返回冻结的 `{ok:false,reason}`；未分类异常归为malformed-data，不泄漏异常文本、部分状态或已构造的收据。

| reason | 含义 |
|---|---|
| `unsupported-runtime` | 可信内建Proxy检测不可用，检查输入前封闭拒绝 |
| `input-limit` | 安全分离节点、深度、通用数组或字节预算超限 |
| `malformed-data` | 非JSON式或不安全数据、非法数值语法、缺少必需键等 |
| `unknown-field` | 封闭顶层、人物或draw record包含未知键 |
| `unsupported-profile` | schemaVersion或profile不符 |
| `unsupported-policy` | 完整固定政策不符，包括任何嵌套政策差异 |
| `unsupported-tutorial` | isTutorial不精确为false |
| `unsupported-terminal-checkpoint` | winner不精确为−1，包括0、1及其他错误值；不代表进行了HP判定 |
| `invalid-first-team` | 已分离firstTeam不是number或不在0..1 |
| `invalid-attacker` | 已分离attacker不是number或不在−1..1 |
| `invalid-current-topic` | 已分离currentTopic不是number或超出signed32 |
| `invalid-characters` | characters不是恰好两项数组，或其中人物不是record |
| `invalid-personality` | 性格不是四个固定字符串之一 |
| `invalid-anger-timer` | 已分离timer不是number或不在0..4 |
| `invalid-max-card-count` | 已分离容量不是number或不在4..7 |
| `invalid-hand` | 非七项手牌、牌值不在−1..14，或活动可出牌槽为0 |
| `invalid-played-card` | 已分离playedCard不是number或不在−1..14 |
| `invalid-can-rethink` | canRethink不是boolean |
| `invalid-crumbled` | crumbled不是boolean |
| `invalid-card-tape` | 当前牌组不是恰好18项数组 |
| `unsupported-card-code` | 已分离的任一牌组项不是number或不在1..14 |
| `invalid-deck-cursor` | 已分离游标不是number或不在0..18 |
| `invalid-raw-draws` | 某队fill rawDraws不是数组或超过一项 |
| `invalid-raw-draw` | 某项fill draw非record或固定role、bound9、value0..8域错误 |
| `invalid-topic-raw-draws` | topicRawDraws不是数组或超过一项 |
| `invalid-topic-raw-draw` | 某项topic draw非record或固定role、bound3、value0..2域错误 |
| `missing-topic-raw-draw` | 有效attacker下至少一队诡辩满足条件，却没有topic draw |
| `unexpected-topic-raw-draw` | 不需要话题重抽却提供合法topic draw，包括attacker=−1 |
| `unsupported-deck-regeneration` | 实际填槽需要下一张时当前18牌组已耗尽 |
| `missing-raw-draw` | 原填牌核需要修补而该队没有fill draw |
| `unexpected-raw-draw` | 原填牌核不需要修补却提供了合法fill draw |
| `invalid-playable-slots` | 继承自填牌核；本层成功解析并正常适配的输入不会产生此项 |

原组件失败码原样传递，不包成component-failed，不改成新层topic错误。fill和topic的数组过长分别由本层invalid-raw-draws、invalid-topic-raw-draws拒绝，不等到需求阶段变成“多余draw”。手牌非法值用invalid-hand，牌组非法值用unsupported-card-code，两者有意区分。

### 6.1 固定的解析与领域优先级

1. 先完整安全分离整个输入，包括policies、双方人物、完整牌组和三类draw数组，并检查最终canonical字节预算。Proxy、getter、循环、数组洞、−0、分数、unsafe integer等先于任何领域错误；同时存在多个安全问题时依实际对象及数组遍历顺序处理，不保证任意畸形对象的跨字段错误顺序。
2. 顶层必须为record。先检查未知键，再检查缺必需键；随后依次检查schemaVersion/profile、完整policies、isTutorial、winner、firstTeam、attacker、currentTopic、characters数组形状与长度。
3. 完整解析队伍0，再完整解析队伍1。每队先record及封闭字段，再personality、angerTimer、maxCardCount、hand、playedCard、canRethink、crumbled、cardTape及所有牌码、deckCursor、rawDraws数组及所有draw域。此时不会执行TurnStart或以调用它作“预检查”。
4. 最后解析topicRawDraws的数组形状和全部draw域。三类draw record均先未知键→缺键，再固定role、bound与value；未知键为unknown-field，缺键为malformed-data，非record及分离后固定域错误才是对应invalid draw。
5. 仅当整个输入解析完成才求值TurnEnd。双方递减及先手／普通牌话题处理后，先判定topic draw是否缺失或多余；topic需求失败先于任何TurnStart填牌领域错误。
6. 调用一次原TurnStart，保留其整层安全检查、解析及队伍0完整领域处理→队伍1完整领域处理。每队原填牌核先满足实际取牌，牌组耗尽先于其修补draw缺失／多余错误；成功才发布全事务结果。

因此，非法队伍1 draw域能先于队伍0牌组耗尽，非法topic draw域也能先于已经可推知的缺topic draw或fill需求错误。另一方面，空draw数组本身语法有效，“缺失”只能按领域实际需求判断：合法但缺topic draw优先于团队填牌需求，而队伍1仅缺fill draw需等到队伍1实际修补时才失败。

### 6.2 原子性不是回滚外部随机源

失败时不发布任何计时器递减、先手变化、话题赋值、补牌游标、额度恢复、崩坏清除或局部收据。输入从未被改写，不需要恢复调用者对象。调用者在本函数前另行产生supplied draws的外部RNG活动不属于本函数可撤销事务；本层没有回滚外部服务、历史消息或存档的能力。只能拿完整ok:true结果统一提交，不应按纸面阶段自行提前写回。

## 7. 安全预算与未运行纸面案例

输入必须是JSON式数据对象，不接受序列化JSON字符串替代。允许Object.prototype或null原型的record、标准Array及支持标量；所有对象字段必须是可枚举数据属性。拒绝Proxy、访问器、Symbol、隐藏字段、自定义原型、Date、函数、undefined、BigInt、循环、稀疏／带附加属性数组及非安全整数。不会调用调用者getter、toJSON、custom iterator或callback。

通过 `process.getBuiltinModule('node:util').types.isProxy` 获取可信Proxy检测；不可用则在输入反射之前返回unsupported-runtime，不降级为无法识别Proxy的反射检查。这里声明必需能力，不声称任何Node或浏览器版本已经实际验证。非循环共享引用可被独立复制，每次出现都计入预算；当前递归路径中的循环拒绝。根深度为0，字符串与键名UTF-8预算和最终canonical UTF-8预算均检查。

| 项目 | 固定上限或范围 |
|---|---:|
| 外层安全分离节点 | 4096 |
| 外层深度，根为0 | 16 |
| 通用数组长度 | 32 |
| 外层canonical UTF-8字节 | 65536 |
| 队伍数／每队物理槽 | 恰好2／7 |
| 每队活动容量／活动可出牌槽 | 4..7／3..6 |
| 每队当前牌组／游标 | 恰好18项／0..18 |
| 成功事务的TurnStart调用 | 恰好1次 |
| 其内部填牌调用 | 恰好2次 |
| 全事务新增活动槽 | 最多12 |
| topic draw／fill draw／合计 | 最多1／2／3 |

通用数组32上限不放宽任何领域数组长度，不代表可提供32张当前牌组。外层预算包括完整嵌套policies；原TurnStart仍使用2048节点／深度12／通用数组32／32768字节，原填牌核仍使用1024节点／深度12／通用数组32／16384字节，没有修改或绕过。输出规模由固定两队及容量上限约束，不接受无限历史、任意receipt或回调。

以下为人工推导的边界，不是实际执行结果或通过声明。纸面案例及其选取投影不能代替完整公开收据：

- 双方原timer分别为1、2时，必须先变为0、1，才进入任何 TurnStart；冷静额度不能按原timer判断。
- 冷静timer=1且crumbled=false、canRethink=false时最终额度仍false；只将crumbled改为true便可因崩坏恢复，不能因此标记冷静条件成立。
- 原attacker=1时firstTeam设1，即使另有组合攻击者字段指向0也不能采用；原attacker=-1时先手与话题全部保留。
- attacker=-1、双方都出诡辩仍不需要话题draw；若提供合法topic draw，则属于多余抽样而非允许消费。
- 有效attacker出普通牌，先应用该普通牌话题；对手诡辩且未被无视时，再用唯一topic draw覆盖话题。最终话题相同也仍是一次真实的来源赋值。
- 双方均出诡辩时，两队都可满足触发条件，但总计只有一次topic draw；诡辩对无视时不触发。
- 先话题重抽、再队伍0修补、再队伍1修补，最多三次 supplied draw。每层原组件局部drawIndex保留，不因新外层序号而改写。
- 原刚胆timer=2、补牌后经修补得到话题时，TurnStart sees timer=1，最终topic count为正，timer保留1；修补前计数0不能使其归零。
- 原刚胆timer=2、活动手牌已满全话术、仅非活动尾槽有话题时，修补跳过，最终timer归零；尾槽仍原样保留。
- 活动可出牌槽为0拒绝；槽0或非活动尾槽中的0是另一种准入情况，不能混为同一错误。
- 无空槽且游标18可成功；队伍1确需新牌而游标18时，即使TurnEnd与队伍0局部求值均已完成，整个结果仍只有失败码。
- 队伍1非法draw域在领域处理前被拒绝，不能为了让队伍0先失败而跳过全量解析；队伍1缺少本次实际所需draw则在其实际填牌阶段才判定。

## 8. 来源证据、明确排除项与未执行声明

固定来源是现代 C# 转录参考仓库 `tankyc/sango_infinity`，commit `a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef`。`Debate.cs` blob为 `0137498d10773cd4596d497083ccdf6a26b3a261`；完整来源身份及固定证据以[来源账本](../sources/debate-round-transition-v1.json)为准，不在此复制巨大的嵌套常量。

- [Debate.cs 1083–1126](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L1083-L1126)：双方先递减计时器，随后仅在原attacker有效时更新先手、普通牌话题及非教程诡辩话题。
- [Debate.cs 394–398](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L394-L398)：计时器大于0才减1，不制造负数。
- [Debate.cs 854–872](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L854-L872)：普通牌1..9分组到三个话题。
- [DebatePhase.cs 261–274](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/DebatePhase.cs#L261-L274)：TurnEndPhase先调用TurnEnd，再把nextPhase指向TurnStart；这里没有以winner字段检查HP的guard。
- [DebatePhase.cs 163–168](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/DebatePhase.cs#L163-L168)：TurnStartPhase调用TurnStart再转Play；本层只接纳这段逻辑衔接，不实现来源的UI帧、step计时或完整阶段调度器。
- [Debate.cs 1046–1079](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L1046-L1079)：既有不变TurnStart的逐队重置、额度恢复、补牌、最终刚胆扫描和崩坏清除顺序。

输入域、winner路由标记、安全分离、资源预算、显式抽样、不可变结果、错误名称、阶段审计和原子提交都是工程合同，不是来源运行状态的可达性证明。现代参考中的日志、view／engine事件及可视效果不在本API内；计时到0的审计不是已经触发外部引擎事件的凭证。

不涵盖教程、终局衔接或胜负判定、HP或压力更新、攻击者再选择、组合攻击与伤害、完整冷静再考事务、DeckGenerate、人物／书籍和非恒等人物hook、开场／追击／留情、完整回合状态机、完整session、存档／回放／迁移、campaign或P078及其依赖。旧九会话及既有组件保持原样，没有新增它们的接入承诺。

固定现代参考不构成原始头文件、原生PK／PC-PK／PK1.1、Vanilla或主机二进制等价证明。原43证据主题／45历史快照不减，原生整条链仍开放；本次没有将来源转录证据升级为原生行为证明，也不认证原生PRNG流或当前18牌组的生成历史。

本批只进行了静态文本准备、读源及人工纸面推导。没有运行测试、编译器、typecheck、build、validator、checker、诊断、候选API、来源代码、场景或replay。示例是未运行的纸面输入与预期，不是实际执行生成的收据；公开导出和本文不构成运行时兼容、成功执行或端到端正确性验证。
