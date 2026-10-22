# 有界当前牌堆再考动作事务 API v1

[规则与来源边界](../rules/debate-rethink-action-v1.md) · [固定政策与证据](../sources/debate-rethink-action-v1.json) · [纸面案例，未运行](../../data/scenarios/debate-rethink-action-example-v1.json)。

实现入口为 [debate-rethink-action.ts](../../packages/engine/src/debate-rethink-action.ts)，公共导出见 [engine index](../../packages/engine/src/index.ts)。本页覆盖一次独立、单角色、有限当前18牌堆的再考数据动作：清空全部活动槽，直接调用既有 `evaluateDebateHandFill`，再直接调用既有 `evaluateDebateCalmRethink`，全部成功后才把 `canRethink` 写成false。不另复制第二套补牌、话题修补、冷静奖励或排序算法。

“完整事务”只指本页准入域内从清牌到额度写false的有界数据转换，不是完整 `PlayPhase`、UI操作、旧会话接入或原生舌战。角色已选择再考的 `playedCard=0` 是工程检查点要求；本动作成功后仍保留0，来源稍后由 `PlayPhase` 调用方执行的 `ResetPlayedCard` 不在此事务。输入 `canRethink` 为true或false都接纳，不添加来源 `Rethink` 本身没有的额度资格门。

## 1. 公开入口与使用边界

```ts
evaluateDebateRethinkAction(input: unknown): DebateRethinkActionResultV1
DEBATE_RETHINK_ACTION_POLICY_V1: DebateRethinkActionPolicyV1
DEBATE_RETHINK_ACTION_EVIDENCE_V1: DebateRethinkActionEvidenceV1
```

输入是JSON式数据值，不是序列化JSON字符串。`unknown` 入口的类型断言不能绕过运行时安全分离与完整字段校验。输入使用复数 `policies`；成功与收据使用单数 `policy`。必须提供完整固定政策值，包括两个未修改组件的政策，不能只传id。

所有复合公开类型递归readonly。以下DTO说明省略重复readonly标记，仅为静态接口说明，不是已执行的代码。成功、失败、全部嵌套审计和导出常量均递归冻结；调用者输入不会被修改或冻结，输出不携带调用者拥有的可变引用。重复调用彼此独立，没有隐藏游标、seed、跨调用状态、session或存档。

全部25个公开类型别名为：

```text
DebateRethinkActionPersonalityV1
DebateRethinkActionCardCodeV1
DebateRethinkActionSourceCardV1
DebateRethinkActionPhysicalCardV1
DebateRethinkActionPhysicalHandV1
DebateRethinkActionRawDrawV1
DebateRethinkActionRawResultV1
DebateRethinkActionCharacterCheckpointV1
DebateRethinkActionInputV1
DebateRethinkActionStateV1
DebateRethinkActionClearedSlotV1
DebateRethinkActionDiscardedCardV1
DebateRethinkActionClearAuditV1
DebateRethinkActionQuotaWriteV1
DebateRethinkActionPlayedCardAuditV1
DebateRethinkActionRandomEventV1
DebateRethinkActionAppliedRepairV1
DebateRethinkActionFinalProvenanceV1
DebateRethinkActionReceiptV1
DebateRethinkActionSuccessV1
DebateRethinkActionFailureReasonV1
DebateRethinkActionFailureV1
DebateRethinkActionResultV1
DebateRethinkActionPolicyV1
DebateRethinkActionEvidenceV1
```

没有create、execute、save、load、replay或完整游戏入口。别名沿用组件的CardCode、RawDraw、RawResult和已应用修补类型，不改变组件值域或局部索引合同。

## 2. 七物理槽输入检查点

```ts
type DebateRethinkActionPersonalityV1 = 'timid' | 'calm' | 'bold' | 'reckless';
type DebateRethinkActionCardCodeV1 =
  1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14;
type DebateRethinkActionSourceCardV1 = 0 | DebateRethinkActionCardCodeV1;
type DebateRethinkActionPhysicalCardV1 = -1 | DebateRethinkActionSourceCardV1;
type DebateRethinkActionPhysicalHandV1 = [
  DebateRethinkActionPhysicalCardV1, DebateRethinkActionPhysicalCardV1,
  DebateRethinkActionPhysicalCardV1, DebateRethinkActionPhysicalCardV1,
  DebateRethinkActionPhysicalCardV1, DebateRethinkActionPhysicalCardV1,
  DebateRethinkActionPhysicalCardV1
];
type DebateRethinkActionRawDrawV1 = {
  role: 'debate-fill-topic-repair'; bound: 9; value: number;
};
type DebateRethinkActionRawResultV1 = {
  role: 'debate-calm-rethink-rand-bool'; percent: 40; value: boolean;
};
type DebateRethinkActionCharacterCheckpointV1 = {
  personality: DebateRethinkActionPersonalityV1;
  angerTimer: number;
  maxCardCount: number;
  hand: DebateRethinkActionPhysicalHandV1;
  playedCard: 0;
  canRethink: boolean;
  cardTape: DebateRethinkActionCardCodeV1[];
  deckCursor: number;
};
type DebateRethinkActionInputV1 = {
  schemaVersion: 1;
  profile: 'debate-rethink-action-reference-v1';
  policies: DebateRethinkActionPolicyV1;
  currentTopic: number;
  character: DebateRethinkActionCharacterCheckpointV1;
  rawDraws: DebateRethinkActionRawDrawV1[];
  rawResults: DebateRethinkActionRawResultV1[];
};
type DebateRethinkActionStateV1 = {
  currentTopic: number;
  character: DebateRethinkActionCharacterCheckpointV1;
};
```

顶层合同为 `schemaVersion,profile,policies,currentTopic,character,rawDraws,rawResults` 七个必需字段。角色合同为 `personality,angerTimer,maxCardCount,hand,playedCard,canRethink,cardTape,deckCursor` 八个必需字段；没有可省略的默认值或类型转换。

| 字段 | 准入合同 |
|---|---|
| schemaVersion / profile | 数字1 / 精确字符串 `debate-rethink-action-reference-v1` |
| policies | 与完整固定政策逐值相同，对象键顺序无关、数组顺序有关 |
| currentTopic | 有符号32位整数，−2147483648..2147483647 |
| character.personality | `'timid' \| 'calm' \| 'bold' \| 'reckless'` |
| character.angerTimer | 整数0..4，所有四性格均允许此工程支持域 |
| character.maxCardCount | 整数4..7，活动范围为物理槽0..容量减1 |
| character.hand | 恰好七项稠密数组，**所有七槽**均允许整数−1..14 |
| character.playedCard | 精确为数字0，表示本动作的已选择再考检查点 |
| character.canRethink | 真正boolean，true与false均可进入，不作为动作资格门 |
| character.cardTape | 完整当前18项牌堆，每项为1..14；不能只给剩余片段 |
| character.deckCursor | 整数0..18，指向当前牌堆下一未取项 |
| rawDraws | 稠密数组，长度0或1；每项恰有固定role、bound9、整数value0..8 |
| rawResults | 稠密数组，长度0或1；每项恰有固定role、percent40、真正boolean的value |

数值在安全层首先必须是安全整数且不为负零。NaN、Infinity、小数、不安全整数、−0不能作为任何字段或额外数据的值；即使该值稍后本应被清空也不能携带不安全形态。普通整数 `currentTopic=-1` 或3有效，但不属于0..2的奖励话题；它们不是输入类型错误。

−1为空，0为再考；1..3为故事小／中／大，4..6为道理小／中／大，7..9为时节小／中／大；10大喝、11诡辩、12无视、13镇静、14激昂。原手牌无需排序，允许重复牌码。性格是调用者已解析结果，不是人物ID，也不执行人物、书籍或hook查找。

不接纳team、opponent、firstTeam、isTutorial、HP、压力、武力、智力、crumbled、人物ID、books、seed、RNG callback、预计算hand、receipt或调用者evidence。来源Rethink本身没有教程gate，故本动作不虚构isTutorial=false要求；教程编排仍未实现。完整人物或旧session对象须显式投影后才能使用本合同。

### 2.1 先清空，而不是保留原活动牌

本事务清空活动前缀的**每一槽**，包括原槽0及全部活动可出牌槽；因此活动槽里的0也有效。不能把保留旧牌的TurnStart合同“活动可出牌槽不能为0”机械移植到本动作。原手牌已经满、全是话题牌、全是话术、含空槽或含多个0，都不会减少本次重新取牌数量。

活动前缀之外的 `hand[maxCardCount..6]` 原值逐槽保留，不清空、不排序、不补牌，也不计入话题判定。最终hand仍恰有七项；组件输入输出的活动hand长度则恰为maxCardCount。尾槽中的普通牌不能避免活动区的话题修补，尾槽中的空值不能增加取牌数。

本次将活动可出牌槽全部适配成填牌核的null；填牌核先恢复槽0为再考0，再按原物理槽1..maxCardCount−1取牌。因此每次成功恰消费 `maxCardCount−1` 张当前牌堆牌，即3..6张；保留槽0不消耗牌堆项。新补牌必有新增槽，必要修补后至少有一张普通话题牌，且排序后恰以0开头，保证可直接交给未修改的冷静核。

### 2.2 有限当前牌堆

整个18项牌堆都须合法，包括已消费与本次不会消费的项。成功要求 `deckCursor + maxCardCount - 1 <= 18`；等号允许，最后实际取到索引17后返回游标18不是失败。再考必需3..6张新牌，故输入游标18没有“原手牌已满便不取牌”的成功例外。

若实际补槽需要第19张，返回整个事务失败。不调用 `DeckGenerate`，不回绕、不重置游标、不截短、不拼接下一牌堆，也不把话题修补draw充当缺失牌堆项。私有中间步骤可能已填若干槽，但不会发布任何部分状态或审计。

## 3. 来源顺序、随机种类与额度

安全分离及本层解析先完成，随后在私有候选中按以下顺序执行：

1. 保存输入检查点，清空活动物理前缀0..maxCardCount−1；非活动尾槽保留。
2. 调用未修改的 `evaluateDebateHandFill`：恢复再考0，按原槽升序取满所有活动可出牌槽；若填满后普通话题牌数为0，消费唯一修补整数draw，把最后新增原槽改为 `1+value`；数值排序活动前缀。
3. 把填牌核已补满、已排序的活动hand交给未修改的 `evaluateDebateCalmRethink`；仅timer>0且calm时消费一个布尔返回值，返回true且话题0..2时覆盖当前物理槽1为3／6／9；所有成功分支都执行第二次活动排序。
4. 两个组件都成功后，把 `canRethink` 写为false，再发布完整结果。原false也仍记录本次赋值；不能把这一末尾动作误作提前验证的true门。

动作不改变currentTopic、personality、angerTimer、maxCardCount、cardTape内容或playedCard；playedCard在成功后仍为0。不执行后续回合计时、压力、胜负、崩坏或已出牌重置。调用者只能在外层 `ok:true` 后采用完整character，不能提前提交清牌或填牌结果。

### 3.1 两种显式随机记录不能合并为一种整数流

```ts
// 话题修补整数抽样，仅确需修补时恰需一项。
{ role: 'debate-fill-topic-repair', bound: 9, value: 0 /* 至8 */ }

// 正计时器冷静时恰需一项语义布尔返回值。
{ role: 'debate-calm-rethink-rand-bool', percent: 40, value: true }
```

若两者都发生，先记录修补整数抽样，再记录冷静布尔返回值。若只有布尔返回值，则它是外层第0个事件，但其原组件局部index仍为0；若两者都发生，布尔项是外层第1个事件，局部index仍为0。没有消费的分支不制造占位事件。

`percent:40` 是来源调用参数，不是bound100抽样或概率证明。不得把该boolean伪装为整数、从0..99阈值推导它，或声称底层PRNG、随机映射或原生随机流已经复原。牌堆取牌、修补整数抽样、语义布尔返回值是三类不同事情；外层随机事件只排列后两类显式输入消费，不把每张牌堆牌都记为一个新增随机事件。

timer=0优先于性格检查；正timer非calm不需要布尔返回值；正timer的calm必须提供一项，即使currentTopic在0..2之外。false优先于话题越界成为冷静成功原因。true且合法话题时覆盖的是第一次排序后**物理槽1**，不是原清牌槽1、指定话题牌或最低等级牌。

覆盖前后同牌面仍是执行过的覆盖，冷静原因仍为 `replacement-applied`，replacement非null而changed=false。最终排序来源映射和外层组合来源也必须保留这次覆盖，不能用数值相等把它抹掉。

## 4. 输出与类型合同

### 4.1 成功、失败与完整主收据

```ts
type DebateRethinkActionSuccessV1 = {
  ok: true;
  schemaVersion: 1;
  profile: 'debate-rethink-action-reference-v1';
  policy: DebateRethinkActionPolicyV1;
  evidence: DebateRethinkActionEvidenceV1;
  currentTopic: number;
  character: DebateRethinkActionCharacterCheckpointV1;
  receipt: DebateRethinkActionReceiptV1;
};
type DebateRethinkActionReceiptV1 = {
  schemaVersion: 1;
  profile: 'debate-rethink-action-reference-v1';
  policy: DebateRethinkActionPolicyV1;
  evidence: DebateRethinkActionEvidenceV1;
  before: DebateRethinkActionStateV1;
  after: DebateRethinkActionStateV1;
  clear: DebateRethinkActionClearAuditV1;
  fill: DebateHandFillReceiptV1;
  calm: DebateCalmRethinkSuccessV1;
  quotaWrite: DebateRethinkActionQuotaWriteV1;
  playedCard: DebateRethinkActionPlayedCardAuditV1;
  providedRawDraws: DebateRethinkActionRawDrawV1[];
  providedRawResults: DebateRethinkActionRawResultV1[];
  randomEvents: DebateRethinkActionRandomEventV1[];
  randomEventCount: 0 | 1 | 2;
  finalProvenance: DebateRethinkActionFinalProvenanceV1[];
  externalRngConsumed: 0;
};
type DebateRethinkActionFailureV1 = {
  ok: false; reason: DebateRethinkActionFailureReasonV1;
};
type DebateRethinkActionResultV1 =
  DebateRethinkActionSuccessV1 | DebateRethinkActionFailureV1;
```

成功顶层恰有以上八字段，没有顶层reason、hand、deckCursor、state或session。`currentTopic` 与 `receipt.after.currentTopic` 值相同，`character` 与 `receipt.after.character` 值相同；不以对象身份作接口保证。before和after均为完整状态，包含七槽hand、完整当前牌堆、游标、性格、计时器、容量、playedCard及额度，不含随机输入数组。

成功后活动前缀等于 `receipt.calm.hand`，槽0为0，其他活动槽为1..14，整体数值非递减且至少一张普通话题牌。只有活动hand、deckCursor及canRethink可能改变，其余给定状态保留；尾槽仍可能为−1或0，不因此成为未完成的活动补牌。失败只有冻结的ok与reason，没有phase、部分character、局部消费数组或半份receipt。

### 4.2 清牌、弃牌、额度赋值与保留已出牌

```ts
type DebateRethinkActionClearedSlotV1 = {
  slot: number; before: DebateRethinkActionPhysicalCardV1; after: -1;
};
type DebateRethinkActionDiscardedCardV1 = {
  slot: number; card: DebateRethinkActionSourceCardV1;
};
type DebateRethinkActionClearAuditV1 = {
  activeSlotCount: number;
  slots: DebateRethinkActionClearedSlotV1[];
  discardedCards: DebateRethinkActionDiscardedCardV1[];
  handAfterClear: DebateRethinkActionPhysicalHandV1;
  inactiveTailPreserved: true;
};
type DebateRethinkActionQuotaWriteV1 = {
  before: boolean;
  after: false;
  applied: true;
  changed: boolean;
  afterPhase: 'character-rethink';
};
type DebateRethinkActionPlayedCardAuditV1 = {
  before: 0;
  after: 0;
  resetPerformed: false;
  resetBoundary: 'caller-next-play-phase-step';
};
```

clear.activeSlotCount等于maxCardCount。clear.slots按原物理下标升序列出每个活动槽，包括原值已为−1的槽以及槽0；每项after均为−1。clear.discardedCards只列原值不是−1的活动槽，**包含0**，不列非活动尾槽。这是审计命名约定，不向全局弃牌区或牌堆追加任何对象。

handAfterClear为完整七槽快照：活动前缀全−1，尾槽原样；这是恢复保留再考0之前，不是fill.postFillHand，也不是最终状态。不能依据原discardedCards数量决定本次取几张牌。

quotaWrite在两个组件及活动前缀覆写之后无条件记录 `applied:true,after:false`。原额度true时changed=true，原false时changed=false；changed不决定是否执行赋值。playedCard审计明确未重置，before/after均0；成功不意味着整个PlayPhase已推进到下一步。

### 4.3 完整保留的两个组件输出

`receipt.fill` 是原填牌组件的完整收据，不裁剪policy、evidence或局部drawIndex。`receipt.calm` 保存的是冷静组件**整个成功对象**，不是只有audit；因此包含它自己的ok、schemaVersion、profile、policy、evidence、hand、reason和audit。所有嵌套组件profile及证据保持原值。

原组件主要DTO完整字段如下，其中所用组件类型仍归原模块所有，不另算本次新导出别名：

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
type DebateCalmRethinkSuccessV1 = {
  ok: true;
  schemaVersion: 1;
  profile: 'debate-calm-rethink-reference-v1';
  policy: DebateCalmRethinkPolicyV1;
  evidence: DebateCalmRethinkEvidenceV1;
  hand: DebateCalmRethinkCardV1[];
  reason: DebateCalmRethinkReasonV1;
  audit: DebateCalmRethinkAuditV1;
};
type DebateCalmRethinkAuditV1 = {
  inputHand: DebateCalmRethinkCardV1[];
  gate: {
    personality: DebateCalmRethinkPersonalityV1;
    angerTimer: number;
    eligible: boolean;
    reason: 'timer-zero' | 'personality-not-calm' | 'positive-timer-calm';
  };
  rawResultsConsumed: 0 | 1;
  booleanResult: DebateCalmRethinkConsumedResultV1 | null;
  replacement: DebateCalmRethinkReplacementV1 | null;
  sort: {
    before: DebateCalmRethinkCardV1[];
    after: DebateCalmRethinkCardV1[];
    sourceIndices: number[];
    equalCardTieBreak: 'source-slot-ascending-engine-policy';
  };
  externalRngConsumed: 0;
};
type DebateCalmRethinkConsumedResultV1 = {
  index: 0;
  role: 'debate-calm-rethink-rand-bool';
  percent: 40;
  value: boolean;
};
type DebateCalmRethinkReplacementV1 = {
  sourceSlot: 1;
  before: DebateCalmRethinkCardV1;
  after: 3 | 6 | 9;
  changed: boolean;
};
```

填牌收据中的细项及本动作不变关系：

- before.playableSlots恰为maxCardCount−1个null，不保存原活动手牌；原手牌另在外层before/clear审计中。after.hand和Calm.audit.inputHand值相同，均是第一次数值排序后的活动前缀。
- filled每项为 `{preSortSlot,tapeIndex,card}`，依原槽1..容量减1升序，card是修补前实际取到的1..14牌，tapeIndex为当前牌堆真实0..17索引。filled长度恒为容量减1，不因原手牌已满而减少。
- postFillHand是原槽序、修补前的完整活动hand；preSortHand是原槽序、修补后但第一次排序前；after.hand是第一次排序后。topicCardCountAfterFill只统计修补前的1..9，不能冒充修补后的数量。
- repair为 `{status:'applied',preSortSlot,beforeCard,afterCard,drawIndex:0,rawValue}` 或 `{status:'skipped',reason:'topic-present'|'no-new-slot'}`；afterCard是1..9且等于1+rawValue。本动作全新补槽使lastNewSlot恒为容量减1，成功时不会有no-new-slot，仍保留原组件联合类型不改写。
- sortedProvenance每项恰有 `sortedIndex,preSortSlot,origin,tapeIndex,originalCard,card,topicRepairApplied`。origin联合为reserved-rethink／retained／tape；本动作没有retained活动牌，实际只出现reserved-rethink和tape。保留0的tapeIndex为null，其余为实际消耗索引；originalCard永远保留修补前牌面。

冷静reason的完整五种成功值为 `timer-zero`、`personality-not-calm`、`boolean-result-false`、`topic-out-of-range`、`replacement-applied`，依第3节顺序判定。timer=0或非calm时booleanResult为null，false返回值则是非null的真实消费记录。sort.before在可选覆盖之后、第二次排序之前；sort.after等于calm.hand。replacement.sourceSlot恒1，不是最终位置。

组件手牌及各自索引不包含非活动尾槽。详细原组件完整类型与合同见[填牌API](debate-hand-fill-v1.md)及[冷静API](debate-calm-rethink-v1.md)；不能把外层before/after、外层随机序号或本动作profile塞回原收据覆盖其字段。

### 4.4 异质随机事件与原局部索引

```ts
type DebateRethinkActionRandomEventV1 =
  | {
      eventIndex: number;
      phase: 'fill-topic-repair';
      kind: 'integer-draw';
      localIndex: 0;
      draw: DebateRethinkActionRawDrawV1;
    }
  | {
      eventIndex: number;
      phase: 'calm-rethink-bonus';
      kind: 'boolean-result';
      localIndex: 0;
      result: DebateCalmRethinkConsumedResultV1;
    };
```

eventIndex从0连续递增，顺序为可选修补、可选冷静；randomEventCount等于randomEvents长度，最大2。局部localIndex始终0，且原fill.repair.drawIndex、原calm.audit.booleanResult.index均仍0。boolean事件的result保留组件自带index0，不把它改成外层eventIndex。联合类型只在整数分支有draw、布尔分支有result，不制造bound100字段。

providedRawDraws和providedRawResults分别完整保留已校验的请求数组。成功时不存在合法闲置项，提供数组与相应组件消费值一致；“提供”本身不构成已执行证明，失败时不会返回这些字段。externalRngConsumed恒0只表示没有调用外部RNG，不表示给定随机值未被使用，更不是原生随机流消费数结论。

### 4.5 两次排序后的来源组合与双重覆盖

```ts
type DebateRethinkActionAppliedRepairV1 =
  Extract<DebateHandFillRepairV1, { status: 'applied' }>;
type DebateRethinkActionFinalProvenanceV1 = {
  finalIndex: number;
  fillSortedIndex: number;
  preSortSlot: number;
  origin: 'reserved-rethink' | 'retained' | 'tape';
  tapeIndex: number | null;
  originalCard: DebateRethinkActionSourceCardV1;
  fillCard: DebateRethinkActionSourceCardV1;
  card: DebateRethinkActionSourceCardV1;
  topicRepairApplied: boolean;
  topicRepair: DebateRethinkActionAppliedRepairV1 | null;
  calmOverwriteApplied: boolean;
  calmOverwrite: DebateCalmRethinkReplacementV1 | null;
};
```

finalProvenance只列最终活动前缀，长度等于maxCardCount、finalIndex按0..容量减1连续排列。对每个最终位置i，先取 `calm.audit.sort.sourceIndices[i]` 得fillSortedIndex，再取 `fill.sortedProvenance[fillSortedIndex]` 得原来源。fillSortedIndex是第一次排序后／冷静覆盖前的物理槽，preSortSlot是第一次排序前的原补牌槽；两者不能混用。

originalCard与tapeIndex一直指向填牌最初取到的牌，不因话题修补或冷静覆盖而丢失。fillCard是第一次排序后的牌面，card是第二次排序后的最终牌面。匹配原preSortSlot的applied修补完整存入topicRepair；若该项在Calm覆盖时的fillSortedIndex为1，完整replacement存入calmOverwrite。可同时topicRepairApplied=true及calmOverwriteApplied=true，双重历史并存，且同牌覆盖也必须保留calmOverwriteApplied=true、changed=false。

保留槽0仍有独立reserved-rethink来源；原清牌时的0和新恢复的0不是被审计为“原牌被保留”。无覆盖时相应历史为null而不是伪造空对象。相等牌两次均按各组件明确的来源槽序打平，此组合是可重复的工程审计身份映射，不证明来源Array.Sort、原生occurrence、跨牌代或全session身份稳定性。

## 5. 固定政策与证据的完整类型

`DebateRethinkActionPolicyV1`、`DebateRethinkActionEvidenceV1` 是实现中POLICY／EVIDENCE完整字面对象的递归readonly类型，而不是任意字典。全部字段和值见[固定政策与证据](../sources/debate-rethink-action-v1.json)及[两个导出常量](../../packages/engine/src/debate-rethink-action.ts)，不另复制一份可漂移的可配置政策。

policy顶层恰为 `id,profile,mode,checkpoint,clearing,fill,calm,writes,randomness,provenance,safety,capacity,boundary`：

- id为 `debate-rethink-action-bounded-current-deck-policy-v1`，profile为 `debate-rethink-action-reference-v1`。
- mode固定一角色清牌→原fill→原Calm→活动覆写→额度false，不要求team／opponent或教程flag；表现层／日志排除。
- checkpoint固定本页的全部数据域，特别是所有原槽−1..14、playedCard=0和canRethink真假均允许；不是状态可达性证明。
- clearing固定清除每个活动槽，包括0；discard审计包括原非空0，非活动尾槽不动。
- fill.policy嵌入完整 `DEBATE_HAND_FILL_POLICY_V1`，calm.policy嵌入完整 `DEBATE_CALM_RETHINK_POLICY_V1`，原样复用对应入口／收据；不只引用id。
- writes固定额度最后false与played0保留；randomness固定两类请求、全域预解析、阶段需求委托与事件顺序，禁止bound100转换。
- provenance固定第二次sort.sourceIndices→第一次sortedProvenance组合，保留原牌面、牌堆索引及两层覆盖史。
- safety与capacity固定第7节预算／安全合同；boundary保留所有本页排除项，legacyProfilesChanged=false。

evidence包含来源仓库／commit／路径／blob／hash及CharacterRethink、Rethink、后续PlayPhase行范围，并嵌入完整handFill和calmRethink证据。quotaBoundary明确原Rethink没有canRethink资格检查，tutorialBoundary明确原Rethink与CharacterRethink没有教程gate；postSelectionPlayedCardDomain、provenanceIdentity、boundsSafetyBudgetsAuditAndReasonNames标明工程边界。输入不能提供额外evidence或更改这些固定值来提升来源证明等级。

## 6. 全部失败原因与准确解析优先序

失败联合为原填牌14个原因、原Calm13个原因的去重并集，再加本层5个原因，共26个字面值。所有失败仅返回冻结的 `{ok:false,reason}`；组件错误直接传递，不包为component-failed，不带阶段、异常文本、半份审计或已清空手牌。

| reason | 条件 |
|---|---|
| unsupported-runtime | 缺少可信Node内建Proxy检测能力，检查输入之前封闭拒绝 |
| input-limit | 安全节点、深度、数组、键数或字节预算超限 |
| malformed-data | 不安全数据／数值、缺必需字段、顶层不是record，或未分类异常 |
| unknown-field | 安全分离后顶层、character、draw或result含额外字段 |
| unsupported-profile | schemaVersion不是1或profile不精确匹配 |
| unsupported-policy | 完整固定政策canonical值不符，包括任一嵌套组件政策 |
| invalid-current-topic | 安全分离后的topic不是number或超出signed32；不在0..2本身不是错误 |
| invalid-character | character不是record |
| invalid-personality | 性格不是四个精确字符串之一 |
| invalid-anger-timer | timer不是number或不在0..4 |
| invalid-max-card-count | 容量不是number或不在4..7 |
| invalid-hand | hand不是恰七项数组，或某项不是−1..14；原活动0不属于错误 |
| invalid-played-card | playedCard不精确为数字0 |
| invalid-can-rethink | canRethink不是boolean；false不是错误 |
| invalid-card-tape | 当前牌堆不是恰18项数组 |
| unsupported-card-code | 牌堆某项不是1..14；手牌非法值另报invalid-hand |
| invalid-deck-cursor | 游标不是number或不在0..18 |
| invalid-raw-draws | rawDraws不是数组或长度超过1 |
| invalid-raw-draw | draw项不是record，或role／bound／value不符合完整域 |
| invalid-raw-results | rawResults不是数组或长度超过1 |
| invalid-raw-result | result项不是record，或role／percent／boolean不符合完整域 |
| unsupported-deck-regeneration | 填牌实际需要下一项时当前18牌已耗尽 |
| missing-raw-draw | 填满后确需话题修补，但rawDraws为空 |
| unexpected-raw-draw | 无需话题修补，却提供一个合法draw |
| raw-result-count-mismatch | 轮到Calm时正timer冷静不是恰1项，或其他情况不是恰0项 |
| invalid-playable-slots | 原填牌核继承码；正确通过本层解析的全null活动适配不会正常产生此错 |

精确解析与阶段顺序：

1. 检查运行时Proxy检测能力，然后完整安全分离**全部**输入，包括完整政策、原七槽、整个牌堆、两种随机数组及额外字段。危险值和预算超限早于任何领域错误；多个安全问题按实际遍历首次遇到处停止，不承诺跨不同对象键顺序的全局优先级。
2. 顶层封闭record，先查额外键，再查缺必需键；继而检查schemaVersion/profile、完整policies canonical相等、currentTopic。
3. character封闭record；继而按personality、angerTimer、maxCardCount、hand、playedCard、canRethink、cardTape形状与所有牌码、deckCursor顺序完整解析。
4. rawDraws先检查数组及最多一项，再逐项检查封闭record和完整role／bound／value域。
5. rawResults先检查数组及最多一项，再逐项检查封闭record和完整role／percent／boolean域。
6. 完成上述所有解析才清牌并调用fill。fill先实际补槽；成功补满后才判断修补需求与合法draw是否缺失或多余。
7. fill成功后才调用Calm，由其校验已合法的rawResults数量是否符合正timer冷静gate，然后执行奖励及第二次排序。
8. 两组件都成功后覆写活动前缀、游标与额度，组装完整审计并冻结发布。

每个封闭record内部未知键优先于缺键；缺键统一malformed-data。政策比较不把政策内差异拆成unknown-field，而是unsupported-policy。record类型错误分别使用上表的invalid-character／invalid-raw-draw／invalid-raw-result，顶层错误为malformed-data。

**本层先校验两种随机payload的语法和完整语义域，但不预判其需求。** 因此非法布尔value=1可在任何填牌前报invalid-raw-result，即使牌堆本会耗尽；非法draw的bound或role也不会等到修补阶段才查。这是有意的组合层优先序，不能把独立fill“到修补阶段才检查draw域”的合同照搬过来。反之，合法空数组只是可能缺项：若同时牌堆不足与缺布尔结果，先为unsupported-deck-regeneration；若全话术且缺修补、也缺布尔，先为missing-raw-draw。

rawDraws有2个安全条目在本层为invalid-raw-draws，rawResults有2个安全条目为invalid-raw-results，不等到组件报告需求错误。任意数值小数或−0则在步骤1已为malformed-data；数组长度超过通用上限则可更早为input-limit。

## 7. 安全分离、预算与原子性

模块使用可信Node运行时的 `process.getBuiltinModule('node:util').types.isProxy`。能力不可用时先返回unsupported-runtime，不读取输入、不降级为不能排除Proxy的路径；不保证浏览器、旧Node或内建能力遭篡改的环境可用。本批未实际探测运行时能力。

- 允许JSON式标量及普通record／数组；record原型只能为Object.prototype或null，数组原型只能精确为Array.prototype。
- 先拒绝Proxy再反射；只读数据属性描述符，不调用getter、setter、toJSON、函数、迭代器或随机回调。
- 拒绝自定义原型、类实例、Date、Map、Set、类型化数组、访问器、Symbol键／值、undefined、function、bigint及非安全整型数字。
- record自有字段须可枚举；数组仅允许规范连续索引和原生length，拒绝空洞、额外属性或隐藏字段。length是唯一允许的非可枚举字段。
- 循环引用拒绝；重复但不成环的引用独立复制、每次展开独立计入预算，不保留调用者共享可变引用。数据键用安全属性定义复制，`__proto__`没有特殊能力，后续仍按封闭字段校验。

| 预算 | 上界与计数 |
|---|---|
| 值节点 | 2048，根计1；每次访问值计1，重复非循环引用重新计数 |
| 深度 | 12，根为0，每个属性值／数组元素深入1 |
| 单数组长度 | 32；领域层仍要求hand7、牌堆18、两种随机数组各0..1 |
| 单对象自有键数 | 反射键数不超过2048，数组length也计入 |
| 字符串／键预检 | 每项JS长度不超过32768；全部字符串值与自有键累计UTF-8字节不超过32768 |
| 完整canonical表示 | 对象键排序、数组保序、无空白，含JSON转义及标点的UTF-8字节不超过32768 |
| 成功路径领域工作 | 1次fill、1次Calm；最多7清槽、6取牌、1修补draw、1布尔结果、2随机事件；0外部RNG调用 |

预算包含完整政策及稍后才会判错的字段，不截断payload或部分审计。字符串预检还累计数组索引／length等键，与最终canonical字节检查是同时存在的约束。两个原组件还保留各自原安全预算，本动作只给它们投影后的最小完整输入，不放宽组件的安全限制。

事务是纯数据全有或全无，不是外部副作用回滚器。即使fill已在私有候选中完成而Calm因缺项或闲置项失败，也只返回失败码；不发布清空手牌、推进游标、已用额度、部分修补记录或fill收据。调用者对象从未被写入，无需写回恢复；本函数也不能撤销调用者在调用前已做的RNG操作。

## 8. 人工纸面示例：一张牌先修补再冷静覆盖

以下是静态输入构造，不调用候选模块，也不是测试或replay输出：

```ts
const input: DebateRethinkActionInputV1 = {
  schemaVersion: 1,
  profile: 'debate-rethink-action-reference-v1',
  policies: DEBATE_RETHINK_ACTION_POLICY_V1,
  currentTopic: 0,
  character: {
    personality: 'calm', angerTimer: 1, maxCardCount: 4,
    hand: [0, 14, 13, 12, 13, -1, 2],
    playedCard: 0, canRethink: true,
    cardTape: [10, 11, 12, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    deckCursor: 0,
  },
  rawDraws: [{ role: 'debate-fill-topic-repair', bound: 9, value: 8 }],
  rawResults: [{ role: 'debate-calm-rethink-rand-bool', percent: 40, value: true }],
};
```

人工推导如下，不省略阶段：

1. clear.handAfterClear为 `[-1,-1,-1,-1,13,-1,2]`；clear.slots记0..3全部清空，discardedCards为原0／14／13／12，不含尾槽。
2. fill.before.playableSlots为 `[null,null,null]`，本次取tape索引0／1／2，即10／11／12；postFillHand为 `[0,10,11,12]`，修补前topicCardCountAfterFill为0，lastNewSlot为3。
3. draw8把原槽3从12改为9，repair.drawIndex仍0；preSortHand为 `[0,10,11,9]`，第一次排序after.hand为 `[0,9,10,11]`。
4. 正timer冷静消费true，booleanResult.index仍0；topic0把当前物理槽1从9覆盖为3。Calm.reason为replacement-applied，replacement为 `{sourceSlot:1,before:9,after:3,changed:true}`；sort.before及sort.after都为 `[0,3,10,11]`，sourceIndices为 `[0,1,2,3]`，第二次排序仍执行。
5. 最终character.hand为 `[0,3,10,11,13,-1,2]`，deckCursor为3、canRethink=false、playedCard仍0、topic仍0。quotaWrite为 `{before:true,after:false,applied:true,changed:true,afterPhase:'character-rethink'}`。

randomEvents有两项：eventIndex0是phase=fill-topic-repair、kind=integer-draw、localIndex0的draw8；eventIndex1是phase=calm-rethink-bonus、kind=boolean-result、localIndex0的完整booleanResult。两个组件原局部索引仍为0。

最终位置1的来源为：finalIndex=1，fillSortedIndex=1，preSortSlot=3，origin=tape，tapeIndex=2，originalCard=12，fillCard=9，card=3，topicRepairApplied=true且保存12→9完整repair，calmOverwriteApplied=true且保存9→3完整replacement。它不是来自原清牌槽1的14，也没有因为第一次修补而失去tape2／originalCard12。

独立边界纸面推导，未列字段假定满足完整合同：

| 输入变化 | 纸面结果 |
|---|---|
| 上例topic=2 | 冷静同面9→9仍replacement-applied、changed=false，两层历史仍存在 |
| 上例topic=99、布尔true | 必须消费布尔项；Calm为topic-out-of-range，不覆盖，仍最终排序和额度false |
| 上例topic=99、布尔false | boolean-result-false优先，仍消费布尔项 |
| 原canRethink=false | 正常完成；quotaWrite.applied=true、changed=false，不报告无资格 |
| 原活动hand含0 | 正常清除；不以TurnStart的活动0限制拒绝 |
| cap4且cursor15，剩余3牌合法且随机项匹配 | 可成功到cursor18 |
| cap4且cursor16，原手牌即使已满 | unsupported-deck-regeneration，仍需3张新牌 |
| 上例rawDraws=[]且rawResults=[] | missing-raw-draw先于Calm需求检查；若必需字段本身缺失则为malformed-data |
| cap4/cursor16且rawResults=[] | unsupported-deck-regeneration先于缺布尔需求 |
| cap4/cursor16且布尔项value=1 | invalid-raw-result先于开始填牌 |
| 非calm／timer0却有一项合法布尔结果 | fill若成功，随后raw-result-count-mismatch，外层不发布fill收据 |
| 原playedCard=−1或其他非0安全值 | invalid-played-card，不替调用方补做出牌选择 |
| 增加isTutorial=false | unknown-field；本动作未声明教程flag |
| policies只给正确id | unsupported-policy |

## 9. 来源身份、兼容性与明确排除

固定来源为现代C#翻译仓库 `tankyc/sango_infinity`，commit `a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef`。主要依据为 [CharacterRethink，第491–509行](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L491-L509)、[Rethink包装，第1254–1260行](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L1254-L1260)，及[填牌与排序，第407–438行](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L407-L438)。

[PlayPhase第199–209行](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/DebatePhase.cs#L199-L209)及[第235–245行](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/DebatePhase.cs#L235-L245)说明：Rethink之后的ResetPlayedCard属于后续调用方步骤。本页只保留已选择再考的检查点，不把该后续步骤合进动作。

清空活动前缀、两次排序、先修补后冷静奖励、正timer冷静在话题判断前使用RandBool返回值、最后额度写false，均来自上述固定参考。七槽支持域、timer0..4、容量4..7、signed32话题、playedCard=0准入、全量安全分离、预算、政策匹配、冻结、原子失败、错误名称与等牌身份打平属于显式工程合同，不是新增C#原函数承诺，也不认证原生状态可达。

直接复用既有填牌和冷静模块的公开入口、完整固定政策、证据与收据；不修改原模块、原接口或其内部局部索引。新增动作不会自动接入旧九会话或迁移旧政策／存档。独立fill仍保留“已满全话术且无新增槽可跳过修补”的合同；只是本动作先清空所以不会走到该成功分支。独立Calm仍是严格的补牌后活动hand核；本动作保证适配输入，而不是放宽它。

明确排除：选择与出牌可用性判定、完整PlayPhase、PlayCard移除、后续ResetPlayedCard、表现层通知和日志、人物／书籍／非恒等hook解析、教程编排、牌组再生成、TurnStart额度恢复、TurnEnd／计时递减、HP／压力／胜负／崩坏、全回合随机与牌身份预算、完整session与存档、开场／追击／留情及campaign。

现代翻译源码及其中原生地址注释不构成独立原生证明。nativeEquivalent、stockOriginalVerified、pkEquivalent、vanillaEquivalent、completeDebate均不提升为true；native whole chain继续开放，43证据主题／45历史快照保持，P078及其全部依赖排除。

## 10. 静态交付状态

本页、实现和配套案例只作静态规格、文本审阅与人工纸面推导。本批未运行测试、编译、typecheck、build、validator、checker、诊断、候选模块、来源代码、示例、场景或replay，也没有执行运行时能力探测。不能据此宣称执行通过、完整舌战闭环或原生等价。
