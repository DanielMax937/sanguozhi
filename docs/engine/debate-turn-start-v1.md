# 独立舌战回合开始事务 API v1

[规则与来源边界](../rules/debate-turn-start-v1.md) · [固定政策与证据](../sources/debate-turn-start-v1.json) · [独立纸面案例，未运行](../../data/scenarios/debate-turn-start-example-v1.json)。

实现入口为 [debate-turn-start.ts](../../packages/engine/src/debate-turn-start.ts)，公共导出见 [engine index](../../packages/engine/src/index.ts)。本页描述固定现代 C# 参考中的一次有界、非教程、两队 `TurnStart` 事务，直接调用既有 `evaluateDebateHandFill`，不复制填槽、普通话题修补或排序算法。

每队依次重置已出牌、按崩坏与兴奋冷静状态恢复再考额度、补满当前活动手牌、按补牌及修补后的最终活动手牌处理兴奋刚胆耗尽，最后清除崩坏旗标。来源按队伍0的全部步骤完成后再处理队伍1，不是先重置双方再补双方，也不按先手换序。

这是独立检查点转换，不是舌战 session、完整回合或旧九会话集成。人物性格、计时器、手牌容量、完整七槽 backing array、当前18张牌组及游标均由调用者给定。这里只接纳有限当前牌组，不生成、循环或拼接下一副牌组，不执行教程分支、`TurnEnd`、计时递减、胜负分类、先手或话题更新。

## 1. 公开入口、全部导出与原子性

唯一公开函数与两个固定常量为：

```ts
evaluateDebateTurnStart(input: unknown): DebateTurnStartResultV1
DEBATE_TURN_START_POLICY_V1: DebateTurnStartPolicyV1
DEBATE_TURN_START_EVIDENCE_V1: DebateTurnStartEvidenceV1
```

公开类型共23个，完整清单为：

```text
DebateTurnStartTeamIndexV1
DebateTurnStartPersonalityV1
DebateTurnStartCardCodeV1
DebateTurnStartPhysicalCardV1
DebateTurnStartPhysicalHandV1
DebateTurnStartRawDrawV1
DebateTurnStartCharacterCheckpointV1
DebateTurnStartCharacterInputV1
DebateTurnStartInputV1
DebateTurnStartStateV1
DebateTurnStartRethinkQuotaReasonV1
DebateTurnStartRethinkQuotaV1
DebateTurnStartBoldReasonV1
DebateTurnStartBoldAuditV1
DebateTurnStartTeamReceiptV1
DebateTurnStartConsumedDrawV1
DebateTurnStartReceiptV1
DebateTurnStartSuccessV1
DebateTurnStartFailureReasonV1
DebateTurnStartFailureV1
DebateTurnStartResultV1
DebateTurnStartPolicyV1
DebateTurnStartEvidenceV1
```

复合公开 DTO 均递归 readonly。以下结构展示省略 readonly 噪声，不是建议运行的代码。`CardCode` 和 `RawDraw` 沿用原填牌核的公开类型，不改写组件合同。所有成功、失败、收据、嵌套收据及固定常量均递归冻结；调用者输入先安全分离，不被修改或冻结，不从结果暴露调用者的可变对象引用。

成功只发布整笔事务结果；失败仅为 `{ok:false,reason}`，没有 teamIndex、组件名、部分状态、部分 receipt 或已消费 RNG 对象。队伍0完成后的私有候选不会成为可独立提交的结果。相同输入重新调用是独立求值，不继续上次调用，不维护隐式游标或 session。

## 2. 完整输入 DTO 与检查点准入

```ts
type DebateTurnStartTeamIndexV1 = 0 | 1;
type DebateTurnStartPersonalityV1 = 'timid' | 'calm' | 'bold' | 'reckless';
type DebateTurnStartCardCodeV1 =
  1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14;
type DebateTurnStartPhysicalCardV1 = -1 | 0 | DebateTurnStartCardCodeV1;
type DebateTurnStartPhysicalHandV1 = [
  DebateTurnStartPhysicalCardV1, DebateTurnStartPhysicalCardV1,
  DebateTurnStartPhysicalCardV1, DebateTurnStartPhysicalCardV1,
  DebateTurnStartPhysicalCardV1, DebateTurnStartPhysicalCardV1,
  DebateTurnStartPhysicalCardV1
];
type DebateTurnStartRawDrawV1 = {
  role: 'debate-fill-topic-repair'; bound: 9; value: number;
};
type DebateTurnStartCharacterCheckpointV1 = {
  personality: DebateTurnStartPersonalityV1;
  angerTimer: number;
  maxCardCount: number;
  hand: DebateTurnStartPhysicalHandV1;
  playedCard: DebateTurnStartPhysicalCardV1;
  canRethink: boolean;
  crumbled: boolean;
  cardTape: DebateTurnStartCardCodeV1[];
  deckCursor: number;
};
type DebateTurnStartCharacterInputV1 =
  DebateTurnStartCharacterCheckpointV1 & { rawDraws: DebateTurnStartRawDrawV1[] };
type DebateTurnStartInputV1 = {
  schemaVersion: 1;
  profile: 'debate-turn-start-reference-v1';
  policies: DebateTurnStartPolicyV1;
  isTutorial: false;
  characters: [DebateTurnStartCharacterInputV1, DebateTurnStartCharacterInputV1];
};
type DebateTurnStartStateV1 = {
  isTutorial: false;
  characters: [
    DebateTurnStartCharacterCheckpointV1, DebateTurnStartCharacterCheckpointV1
  ];
};
```

顶层恰有上述五个字段；每个 CharacterInput 恰有10个字段。所有字段都必需，不能省略 false、空 draw 数组、完整牌组或政策。不接纳 HP、压力、武力、智力、当前话题、先手、winner、人物 id、seed、RNG callback、precomputed hand、receipt 或调用者 evidence；这些不参与本次检查点转换。`maxCardCount` 的公开类型为 number，4..7是本核的运行时准入，不伪写成另一种静态类型。

| 字段 | 必须提供的值或范围 |
|---|---|
| schemaVersion / profile | 精确为1 / `debate-turn-start-reference-v1` |
| policies | 与完整固定政策逐值一致，包括嵌套的原填牌政策 |
| isTutorial | 精确为 boolean false；true以及其他值均不代表“跳过补牌” |
| characters | 恰好两项，固定队伍0、1顺序 |
| personality | timid（胆小）、calm（冷静）、bold（刚胆）、reckless（莽撞）之一 |
| angerTimer | 整数0..4 |
| maxCardCount | 整数4..7，决定活动前缀 |
| hand | 恰好七项，每项为整数−1..14；活动可出牌槽不允许0 |
| hand[0] | 可为−1..14，填牌时恢复成0 |
| hand[1..maxCardCount−1] | −1空位或1..14牌码，不能为0 |
| hand[maxCardCount..6] | 可为−1..14，保留但不参与活动逻辑 |
| playedCard | 整数−1..14，即使它必将重置也须有效 |
| canRethink / crumbled | 必须是 boolean，不做数值转换 |
| cardTape | 恰好18项，所有项为1..14 |
| deckCursor | 整数0..18 |
| rawDraws | 每队一个稠密数组，长度0或1 |
| 每项 draw | 恰有 role、bound、value；固定 role、bound9、整数 value0..8 |

全部数值首先要求安全整数且不能为−0，不接受 NaN、Infinity、分数或字符串转数值。手牌、已出牌、计时器、容量及给定性格范围均是本工程明确的支持域，不证明来源的所有可达状态均在域内，也不证明给定状态确实由某次前序回合产生。`playedCard` 不需出现在当前手牌中；已有牌序无需预先排序。

现代数字牌码：−1为空；0为再考；1..3为故事小／中／大，4..6为道理小／中／大，7..9为时节小／中／大；10大喝、11诡辩、12无视、13镇静、14激昂。重复数值允许存在，不合并发牌或身份审计。

两队分别提供各自的完整牌组、游标和 rawDraws；不存在共享牌组或共享 draw 池。一队的合法修补 draw 不能补给另一队。外层在执行前检查全部 draw 的格式和语义域，再由原填牌核按实际修补需求决定缺失或多余；无需求时不能携带合法但未使用的 draw。

## 3. 来源顺序与关键边界

安全分离与全部结构解析先于领域步骤。领域处理始终为队伍0、队伍1，各队内部遵循固定的现代参考顺序：

1. 将该队 `playedCard` 重置为−1。
2. 若该队原 `crumbled` 为true，则置 `canRethink=true`；否则不因此改写额度。
3. 若 `angerTimer>0` 且性格为冷静，则置 `canRethink=true`；其余情况不清除已有额度。
4. 调用原填牌核。恢复活动槽0为再考0，按原槽序填充活动可出牌空位；必要时只修补最后新增槽，再排序活动前缀。
5. 仅对 `angerTimer>0` 的刚胆角色，统计刚完成填牌、话题修补和排序后的最终活动手牌中1..9的普通话题牌。数量为0时将其计时器重置为0，否则保留。
6. 无条件将该队 `crumbled` 清为false，结束该队的全部步骤，再开始下一队。

额度更新为保留原true值的累积恢复，不是每轮初始化为true或false。兴奋刚胆没有独立恢复再考额度的分支；胆小和莽撞的正计时器也不会被误作冷静。这里的计时器只有刚胆无话题时的归零，没有一般性的减1，也不连带改写压力或其他人物状态。

### 3.1 七槽 backing array 与有效前缀

完整物理手牌始终有七项，有效活动范围为下标0..`maxCardCount−1`，活动容量4..7。填牌只适配活动槽1..`maxCardCount−1`；−1空位映射为既有填牌核的null，已有1..14牌保留。槽0由填牌核恢复为0，不取当前牌组的一项。外层把填牌核返回的完整活动手牌写回同一前缀，活动范围之外的每个原物理尾槽逐值保留。

因此尾槽不是额外补牌目标，不参加活动排序，不计入刚胆的最终话题数；不能借用尾槽中的话题牌避免刚胆归零，也不能因为尾槽为空而额外取牌。本事务没有使用反制或胆小连打内核中的“清空七槽后压紧”的移除语义。数字−1是显式空槽值，不能用 JavaScript 数组洞替代。

### 3.2 最终话题数不是填牌核的修补前计数

嵌套填牌收据的 `topicCardCountAfterFill` 是“所有空槽填满后、话题修补前”的统计。它可能为0，而随后一次修补已经制造了普通话题牌。刚胆分支必须重新依据最终活动手牌统计，不能直接读这个修补前字段并重置计时器。

相反，已满且全为话术的活动手牌没有新增槽，填牌核按来源跳过修补；此时最终话题数仍为0，兴奋刚胆计时器归零。槽0的再考0不是普通话题牌。尾槽中的1..9也不属于本次活动话题数。

### 3.3 有限当前牌组与两队原子事务

每队的牌组都是恰好18项的完整当前窗口，游标指向下一未取项，允许0..18。只要没有活动可出牌空槽，游标18仍可成功；只要某个空槽确实需要下一张而游标已到18，就拒绝整笔两队事务。不自动调用 `DeckGenerate`、不重置游标、不绕回牌首、不把修补抽样当牌组来源。

输入的全部牌组项都须有效，包括已越过及本次不会消费的项。填牌可能恰好使用索引17并返回游标18，这本身不构成耗尽失败。队伍0成功而队伍1失败时，没有队伍0的部分状态、已推进游标或局部收据对外提交。调用者只能在最终 `ok:true` 后采用完整结果。

## 4. 完整输出 DTO 与嵌套审计

### 4.1 成功、主收据与快照

```ts
type DebateTurnStartSuccessV1 = {
  ok: true;
  schemaVersion: 1;
  profile: 'debate-turn-start-reference-v1';
  policy: DebateTurnStartPolicyV1;
  evidence: DebateTurnStartEvidenceV1;
  characters: [
    DebateTurnStartCharacterCheckpointV1, DebateTurnStartCharacterCheckpointV1
  ];
  receipt: DebateTurnStartReceiptV1;
};
type DebateTurnStartReceiptV1 = {
  schemaVersion: 1;
  profile: 'debate-turn-start-reference-v1';
  policy: DebateTurnStartPolicyV1;
  evidence: DebateTurnStartEvidenceV1;
  before: DebateTurnStartStateV1;
  after: DebateTurnStartStateV1;
  teamOrder: [0, 1];
  teams: [DebateTurnStartTeamReceiptV1, DebateTurnStartTeamReceiptV1];
  consumedDraws: DebateTurnStartConsumedDrawV1[];
  drawCount: 0 | 1 | 2;
  externalRngConsumed: 0;
};
type DebateTurnStartFailureV1 = {
  ok: false; reason: DebateTurnStartFailureReasonV1;
};
type DebateTurnStartResultV1 =
  DebateTurnStartSuccessV1 | DebateTurnStartFailureV1;
```

成功顶层恰有七个字段，没有顶层 `isTutorial`、`state`、`outcome` 或 session。`characters` 与 `receipt.after.characters` 值一致；State 内的 `isTutorial` 固定false。before/after 和各队 before/after 都是完整 CharacterCheckpoint，包含全部七槽、完整18牌牌组、各自游标与全部旗标，但不包含 rawDraws。请求抽样不是人物状态，另记于各队收据。

成功后每队 playedCard=−1、crumbled=false，活动槽0为0，活动可出牌槽均为1..14且数值升序；牌组内容、性格、容量和非活动尾槽不变。canRethink 仅保留或置true；timer 仅保留或在符合刚胆条件时归零。这里不保证每队最终都有话题牌，因为已满的全话术手牌没有新增槽，不做话题修补。

### 4.2 每队完整审计

```ts
type DebateTurnStartTeamReceiptV1 = {
  teamIndex: DebateTurnStartTeamIndexV1;
  before: DebateTurnStartCharacterCheckpointV1;
  after: DebateTurnStartCharacterCheckpointV1;
  playedCardReset: { before: DebateTurnStartPhysicalCardV1; after: -1 };
  rethinkQuota: DebateTurnStartRethinkQuotaV1;
  fill: DebateHandFillReceiptV1;
  bold: DebateTurnStartBoldAuditV1;
  crumbledClear: { before: boolean; after: false };
  providedRawDraws: DebateTurnStartRawDrawV1[];
  consumedDraws: DebateTurnStartRawDrawV1[];
  drawCount: 0 | 1;
};
type DebateTurnStartRethinkQuotaReasonV1 =
  'crumbled-and-positive-calm' | 'crumbled' | 'positive-calm' | 'preserved';
type DebateTurnStartRethinkQuotaV1 = {
  before: boolean;
  after: boolean;
  crumbledApplied: boolean;
  calmApplied: boolean;
  reason: DebateTurnStartRethinkQuotaReasonV1;
};
type DebateTurnStartBoldReasonV1 =
  'timer-zero' | 'personality-not-bold' |
  'topic-cards-remain' | 'no-topic-cards-reset';
type DebateTurnStartBoldAuditV1 = {
  eligible: boolean;
  topicCardCount: number | null;
  countSource: 'final-post-repair-active-prefix';
  angerTimerBefore: number;
  angerTimerAfter: number;
  resetApplied: boolean;
  reason: DebateTurnStartBoldReasonV1;
};
```

`teams` 总是恰好两项，并且 `teams[0].teamIndex=0`、`teams[1].teamIndex=1`。每队 before 是该队输入检查点，after 已包括该队的全部六步，而不是只补牌后或刚胆处理前。原 playedCard 已为−1、原 crumbled 已为false时，仍保留相应重置/清除审计；没有“数值不变便省略动作”的约定。

rethinkQuota 的两个 applied 字段记录对应条件成立并执行置true，不表示额度此前一定为false：原额度为true且条件成立时仍记 applied=true。两条件同时成立的 reason 为 `crumbled-and-positive-calm`；只有崩坏、只有兴奋冷静分别为 `crumbled`、`positive-calm`；都不成立为 `preserved`，即使原额度为false也不改为true。

Bold 原因优先级明确：timer=0时为 `timer-zero`，不因同时不是刚胆改报其他原因；timer>0且不是刚胆时为 `personality-not-bold`；这两条的 eligible=false、topicCardCount=null、resetApplied=false。null表示来源 gate 没有执行话题扫描，不能伪写成0。

只有 eligible=true 才有整数 topicCardCount，范围0..`maxCardCount−1`。大于0为 `topic-cards-remain`，保留timer；等于0为 `no-topic-cards-reset`，angerTimerAfter=0且resetApplied=true。angerTimerBefore 是本队完成填牌后、刚胆检查前的值；填牌不改timer，所以与本队输入timer相同。计数来源固定为最终活动前缀，不引用尾槽或修补前计数。

### 4.3 不裁剪、不改写的原填牌收据

每队的 `fill` 始终存在，哪怕没有空槽或没有修补，也保存 `evaluateDebateHandFill` 本次调用的完整 `DebateHandFillReceiptV1`。它保持原 profile=`debate-hand-fill-reference-v1`，policy、evidence、局部索引和字段全部不变，不替换成 TurnStart 的主收据。

原组件完整结构如下；其中类型均属原填牌组件，而不是本次新导出的别名：

```ts
type DebateHandFillReceiptV1 = {
  schemaVersion: 1;
  profile: 'debate-hand-fill-reference-v1';
  policy: DebateHandFillPolicyV1;
  evidence: DebateHandFillEvidenceV1;
  before: { playableSlots: (DebateHandFillCardCodeV1 | null)[]; deckCursor: number };
  after: { hand: DebateHandFillHandV1; deckCursor: number };
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
```

- `before.playableSlots` 只包含本队活动槽1..容量末槽，−1已映射为null；不含原槽0或七槽尾部。`after.hand` 为含再考0的完整活动手牌，不是七槽全 backing array。
- `filled` 按本次原槽升序记录 `{preSortSlot,tapeIndex,card}`；card 是修补前实际取牌码，tapeIndex 为本队当前牌组0..17索引，不是全事务取牌索引。
- `postFillHand` 是原槽序、补满后但修补前；`preSortHand` 是原槽序、修补后但排序前；`after.hand` 才是活动范围数值排序后。`topicCardCountAfterFill` 保留修补前统计，不能改写为最终值。
- `repair` 要么为 `{status:'applied',preSortSlot,beforeCard,afterCard,drawIndex:0,rawValue}`，要么为 `{status:'skipped',reason:'topic-present'|'no-new-slot'}`。有话题时优先记 `topic-present`；只有既无话题又无新增槽才记 `no-new-slot`。applied 时 afterCard=1+rawValue，目标是最后新增原槽。
- `sortedProvenance` 每项包含 `sortedIndex,preSortSlot,origin,tapeIndex,originalCard,card,topicRepairApplied`。origin 为 `reserved-rethink`、`retained` 或 `tape`；保留或再考来源的 tapeIndex 为null，取牌来源保留实际索引。修补只改card，不丢失originalCard或原tapeIndex，不退回取出的牌。
- 数值相同的 provenance 按 preSortSlot 升序排列，是原组件工程审计规则，不证明现代 Array.Sort 或原生 occurrence 的身份稳定性。这里没有跨队、跨调用或全 session 牌身份承诺。

完整类型与其他约束以[既有填牌 API](debate-hand-fill-v1.md)为准。外层仅做字段适配、活动前缀覆写和事务编排，不重写原填牌政策或修补算法，也不改原模块的失败优先级；本次外层额外的预解析优先级见第6节。

### 4.4 每队与扁平抽样索引

```ts
type DebateTurnStartConsumedDrawV1 = {
  flatDrawIndex: number;
  teamIndex: DebateTurnStartTeamIndexV1;
  localDrawIndex: 0;
  draw: DebateTurnStartRawDrawV1;
};
```

每队 `providedRawDraws` 是该队已验证的请求数组副本；`consumedDraws` 与嵌套 fill.consumedDraws 值相同，每队drawCount均为其长度。成功不允许闲置合法抽样，因此成功时该队提供与消费的数组值相同；失败不发布其中任何一个数组。字段分别保留是为了说明提供与实际消费的角色，不把“提供”直接当成已执行。

主收据 consumedDraws 按队伍0、1实际消费顺序展平，flatDrawIndex 从0连续递增。每项 localDrawIndex 固定0，对应这队原填牌调用中唯一可能的 repair.drawIndex。只有队伍1修补时，其 flatDrawIndex=0、teamIndex=1、localDrawIndex=0；双方都修补时，队伍1的 flatDrawIndex=1，但嵌套 repair.drawIndex 仍为0。没有消费的队伍不制造占位项或索引空洞。

一次事务成功时最多两次填牌调用、12个新增活动槽、两项修补抽样。补牌消费的是给定当前牌组，raw draw 仅用于必要的一次话题修补；两者不是同一类随机消费。`externalRngConsumed=0` 表示本核未调用外部 RNG，不表示 supplied draws 没有被采用，不认证原生 PRNG 流或概率映射。

## 5. 固定政策与证据类型

`DebateTurnStartPolicyV1`、`DebateTurnStartEvidenceV1` 分别为源文件内完整 POLICY、EVIDENCE 字面对象的递归 readonly 类型，不是可配置字典。输入用复数 `policies`，成功及收据用单数 `policy`；完整对象须逐值等于固定常量，仅给id不够。对象键顺序不影响比较，数组顺序及所有嵌套键值仍有意义。完整字面值见[来源账本](../sources/debate-turn-start-v1.json)及[源码](../../packages/engine/src/debate-turn-start.ts)。

policy 的顶层键恰为 `id,profile,mode,checkpoint,rethinkQuota,fill,bold,randomness,safety,capacity,boundary`：

- id=`debate-turn-start-bounded-current-deck-policy-v1`，profile=`debate-turn-start-reference-v1`。
- mode 固定非教程、有界当前牌组、两队、顺序[0,1]和六步团队内序列；明确一整队完成后才开始下一队。true教程输入不是省略填牌的开关。
- checkpoint 固定性格支持域、timer0..4、容量4..7、七槽手牌与各区域牌码限制、playedCard−1..14、必需布尔值、18牌及游标0..18，并标明这不是状态可达性证明。
- rethinkQuota 固定“原额度保留，崩坏或兴奋冷静则置true”，从不赋false；冷静再考的大牌奖励及其随机返回值不属于 TurnStart。
- fill 嵌入原 `DEBATE_HAND_FILL_POLICY_V1`，固定−1到null映射、活动前缀覆写、尾槽保留、游标18条件、原错误传递及完整原收据保留。
- bold 固定正timer与刚胆gate，统计最终修补后活动槽0..容量末槽中的1..9；0话题归零、否则保留，禁止用修补前计数代替。
- randomness 固定每队0..1个既有 role=`debate-fill-topic-repair`、bound9、value0..8抽样；双方的完整语法与范围先验证，需求与闲置由原核处理；扁平索引独立于本地索引，没有callback或外部RNG。
- safety 固定封闭结构、严格分离、完整政策相等、可信 Node Proxy 检测、检测不可用时封闭拒绝、递归冻结与纯错误输出。
- capacity 固定2048节点、深度12、通用数组32、32768 canonical UTF-8字节，以及两次填牌、最多两次修补与12个填槽。
- boundary 固定独立两队非教程转换；不解析人物、不做教程、DeckGenerate、TurnEnd／timer递减、攻击或再考动作、完整session／存档、P078，legacyProfilesChanged=false。

evidence 包含 `sourceIdentity,repository,sourceCommit,debatePath,debateBlob,debateSha256,debateEnumPath,debateEnumBlob,sourceTurnStartLines,sourceTimerResetLines,sourceSortLines,sourceFillLines,sourceCardEnumLines,sourceBehavior,handFill,personalityBoundary,domainBoundsSafetyBudgetsAuditAndReasonNames,nativeEquivalent,stockOriginalVerified,pkEquivalent,vanillaEquivalent,completeDebate,p078,nativeWholeChain,nativeDeckRegeneration,nativeRngStream,legacySessionIntegration`。其中 handFill 是完整原 `DEBATE_HAND_FILL_EVIDENCE_V1`，不是改写后的摘要；原组件的43／45历史边界仍随其保留。来源身份、实际行范围及排除项见第8节和来源账本。

nativeEquivalent、stockOriginalVerified、pkEquivalent、vanillaEquivalent、completeDebate 都为false；nativeWholeChain=open，其余所列未实现链路保持excluded。调用者不能用自带evidence、修改政策或替换嵌套证据来提升证明等级。

## 6. 全部错误与准确解析优先级

`DebateTurnStartFailureReasonV1` 是原 `DebateHandFillFailureReasonV1` 的14项加本次10项，合计24个字面值；只返回冻结的 `{ok:false,reason}`。未分类异常归为 malformed-data，不附加异常文本、队伍编号或部分候选。

| reason | 含义 |
|---|---|
| `unsupported-runtime` | 可信内建 Proxy 检测不可用；在检查输入前拒绝 |
| `input-limit` | 安全分离节点、深度、通用数组或字节预算超限 |
| `malformed-data` | 不安全/非JSON式数据、非法数值语法、缺必需键等 |
| `unknown-field` | 顶层、人物或draw出现未知键；政策差异由 unsupported-policy 处理 |
| `unsupported-profile` | schemaVersion或profile不符 |
| `unsupported-policy` | 完整固定政策不符，包括嵌套原填牌政策 |
| `unsupported-tutorial` | isTutorial不精确等于false |
| `invalid-characters` | characters不是长度2数组，或某队不是record |
| `invalid-personality` | 某队性格不属于四个给定字符串 |
| `invalid-anger-timer` | 已安全分离的timer不是number或不在0..4 |
| `invalid-max-card-count` | 已安全分离的容量不是number或不在4..7 |
| `invalid-hand` | 手牌不是七项数组、某项不是−1..14或活动可出牌槽为0 |
| `invalid-played-card` | 已安全分离的playedCard不是number或不在−1..14 |
| `invalid-can-rethink` | canRethink不是boolean |
| `invalid-crumbled` | crumbled不是boolean |
| `invalid-card-tape` | 完整当前牌组不是恰好18项数组 |
| `unsupported-card-code` | 已安全分离的牌组项不在1..14支持域 |
| `invalid-deck-cursor` | 已安全分离的游标不是number或不在0..18 |
| `invalid-raw-draws` | 某队rawDraws不是数组或长度超过1 |
| `invalid-raw-draw` | 某项draw不是record，或role、bound、value不符合固定域 |
| `unsupported-deck-regeneration` | 原填牌核实际需要下一张时当前18牌已耗尽 |
| `missing-raw-draw` | 原填牌核实际需要修补，但该队未提供draw |
| `unexpected-raw-draw` | 原填牌核无需修补，但该队提供了合法draw |
| `invalid-playable-slots` | 原填牌核的继承失败码；本层成功解析的活动槽适配不会正常产生此错误 |

原核可返回的失败码直接传递，不包成 `component-failed`。本层已把每队抽样数量限制到0..1，因此超过一项在本层是 invalid-raw-draws，而不是等到原核改报 unexpected-raw-draw。手牌非法牌码用 invalid-hand，牌组非法牌码用 unsupported-card-code，两者不混用。

### 6.1 解析与执行的先后

1. 首先完整安全分离整个输入，包括两队、全部牌组、全部draw和policies。Proxy／getter／稀疏数组／非安全整数／−0等问题在结构和领域解析前被拒绝。若同时有多个安全问题，按分离的实际属性及数组访问顺序处理，不承诺任意畸形对象都有固定跨属性错误优先级。
2. 检查顶层必须为record；未知键先于缺少键。然后依次检查schemaVersion/profile、完整policies、isTutorial=false、characters数组与长度。
3. 完整解析队伍0，然后完整解析队伍1。每队先检查record及封闭必需键，再依次检查personality、angerTimer、maxCardCount、hand、playedCard、canRethink、crumbled、cardTape及其全部牌码、deckCursor、rawDraws数量及其draw字段域。未知键先于缺键；缺必需键统一为 malformed-data。
4. draw record 的键检查仍遵循上述规则：未知键为 unknown-field，缺键为 malformed-data；record本身错形和安全分离后的role／bound／value域错误为 invalid-raw-draw。数字value为分数、−0或unsafe integer则已经在步骤1变为 malformed-data。
5. 双方全部解析成功才执行队伍0的完整六步，然后执行队伍1完整六步。每队原填牌核先填完当前窗口可填槽，再判定修补需求；牌组耗尽失败先于该队缺失或闲置合法draw的需求失败。

这里有刻意保留的组合层差异：两队draw的role／bound／value域在任何一队填牌前都检查。因此队伍1非法draw可先于队伍0需要牌组再生成的领域错误；不能把原填牌核“抽样语义到修补阶段才检查”的单次调用优先级照搬为本层合同。反过来，队伍1只是缺少可能需要的draw时，语法上空数组有效，其需求错误只有轮到队伍1实际填牌后才判定。

### 6.2 原子拒绝并非外部回滚器

队伍0局部求值成功后，队伍1出现牌组耗尽、缺draw或多余draw，仍只返回一个失败码。没有第一队的已排序手牌、恢复额度、清除崩坏、消耗卡牌位置、抽样审计或局部成功状态对外提交。输入从未被改写，因此不需要通过写回恢复调用者对象。

rawDraws只是外部已经提供的数据。本函数不会撤销调用者在调用前另行做过的RNG操作，也没有外部牌组服务或持久存档可回滚。调用方应先拿到整个 `ok:true` 再采用两队结果，不能从文档纸面步骤自行提前提交第一队。

## 7. 安全分离、资源预算与纸面边界

输入是JSON式数据值，不接受序列化JSON字符串替代对象。允许 Object.prototype 或null原型record、标准Array以及允许的标量；字段必须为可枚举数据属性。拒绝Proxy、访问器、Symbol／非枚举字段、自定义原型、Date、函数、undefined、BigInt、循环、稀疏或附加属性的数组，以及所有不安全或非整数数字。不会执行调用者getter、toJSON、custom iterator或callback。

使用 `process.getBuiltinModule('node:util').types.isProxy` 的可信内建检测，在反射对象前识别并拒绝Proxy。获取不到此能力时返回 unsupported-runtime，不进行不能识别Proxy的降级检查。这是必要运行时能力要求，不是某个Node／浏览器版本已经实测可用的声明。

非循环的共享引用允许安全分离，但每次出现都独立复制并计入预算；循环按当前递归路径识别并拒绝。根深度为0。遍历时累计字符串与键名的UTF-8字节，还对最终规范化结构做完整字节上限检查；canonical对象键排序不调用自定义序列化逻辑。

| 项目 | 固定上限或范围 |
|---|---:|
| 外层安全分离节点 | 2048 |
| 外层最大深度，根为0 | 12 |
| 通用数组长度 | 32 |
| 外层canonical UTF-8字节 | 32,768 |
| 队伍数 | 恰好2 |
| 每队物理手牌 | 恰好7 |
| 每队活动容量／活动可出牌槽 | 4..7／3..6 |
| 每队完整当前牌组 | 恰好18 |
| 每队游标 | 0..18 |
| 每队原填牌调用 | 成功事务中恰好1次 |
| 每队／全事务修补draw | 0..1／0..2 |
| 全事务新增活动槽 | 最多12 |

通用数组预算不放宽任何领域长度；32不是允许32张当前牌组。预算包括完整固定policies，不是仅统计人物部分。原填牌核仍以自己的1024节点、深度12、通用数组32、16384 canonical UTF-8字节预算再次检查每次适配输入；本次没有修改或禁用组件安全检查。输出规模由固定两队及最大活动容量约束，不接受调用者注入任意receipt或history。

[纸面案例文件](../../data/scenarios/debate-turn-start-example-v1.json)只记录未运行的输入与人工预期，不是可声称已经通过的测试或执行日志。其中 `paperExpectedSelected` 是结果字段的递归选取投影，不是完整公开结果；`selectedAuditNotes` 是纸面说明，不是新增结果字段，也不是实际运行收据。阅读案例时尤其注意：

- 兴奋刚胆通过本次修补获得话题时，嵌套 topicCardCountAfterFill 仍可为0，而外层 bold.topicCardCount至少为1，timer保留。
- 已满全话术的兴奋刚胆没有新增槽，修补跳过，最终话题数0，timer归零；活动外尾槽中的话题不能改变结果。
- 崩坏与兴奋冷静可同时恢复额度；两条都记录，即使原额度已经为true。
- 无空槽且游标18合法；一个确需填充的空槽遇到游标18则整笔拒绝。
- 只有队伍1修补时，扁平索引为0但队伍编号为1；两队都修补时，各嵌套drawIndex仍均为0。
- 队伍0可先完成局部计算，但队伍1失败仍不发布任何局部结果。两个输入检查点和draw域却在这之前已经全部完成解析。

## 8. 来源证据、接入范围与未执行声明

固定来源为现代 C# 转录参考，commit `a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef`，`Debate.cs` blob `0137498d10773cd4596d497083ccdf6a26b3a261`。

- [Debate.cs 1046–1079](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L1046-L1079)：逐队完整执行的回合开始顺序、再考额度恢复、非教程填牌、兴奋刚胆最终手牌检查与崩坏旗标复位。
- [Debate.cs 406–438](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L406-L438)：活动前缀排序及既有填牌、最后新增槽话题修补；其中下一副牌组生成分支在本合同明确排除。
- [既有填牌 API](debate-hand-fill-v1.md)：本事务直接复用的完整组件合同，保持该组件原有 profile、政策、证据及审计含义。

输入安全、预算、显式抽样分配、不可变返回、严格错误、事务式提交及等码身份审计顺序属于工程合同。提供的人物状态、手牌及当前牌组是合成检查点，不证明真实人物解析、容量推导、牌组生成历史或原生可达性。

固定现代参考不构成原始头文件、原生 PK／PC-PK／PK1.1、Vanilla 或主机二进制等价证明。原43证据主题／45历史快照不减，原生整条链仍开放。旧九会话、既有政策、存档及填牌组件保持原样；没有 create、save、load、replay 或迁移适配器。

教程、下一副牌组生成、`TurnEnd`、完整回合状态机、冷静再考完整事务、人物／书籍与非恒等人物 hook、开场／追击／留情、campaign、P078 及其全部依赖均不在本合同内。这里只实现本页明确的现代参考子域，不能据此扩大旧会话支持或其他证据层级。

本批仅进行静态文本准备、读源与人工纸面推导。没有运行测试、编译器、typecheck、build、validator、checker、诊断、候选 API、来源代码、场景或 replay。案例是未运行的纸面预期，不是实际执行生成的收据；公开导出与静态文档不构成运行时兼容、运行成功或完整行为的验证。
