# 独立舌战愤怒入场 API v1

[规则与来源边界](../rules/debate-anger-entry-v1.md) · [固定政策与证据](../sources/debate-anger-entry-v1.json) · [独立纸面案例，未运行](../../data/scenarios/debate-anger-entry-example-v1.json)。

实现入口为 [debate-anger-entry.ts](../../packages/engine/src/debate-anger-entry.ts)，公共导出见 [engine index](../../packages/engine/src/index.ts)。本页描述固定现代 C# 参考中一次 `CalcAngering(canReflect)` 及其后的单次 `Anger()` 入场，不是完整愤怒阶段、连打、回合或 session。

输入是调用者明确提供的两方检查点；性格、有效武力与有效手牌容量已经解析完成。本函数不查人物、技能、书籍或 campaign，不消费随机，不根据 HP 提前终止，也不判定胜者。无候选及反制取消均可返回 `ok:true`，表示求值成功，不表示一定有人进入愤怒。

## 1. 公开入口、结果与不变性

唯一公开函数和两个公开常量为：

```ts
evaluateDebateAngerEntry(input: unknown): DebateAngerEntryResultV1
DEBATE_ANGER_ENTRY_POLICY_V1: DebateAngerEntryPolicyV1
DEBATE_ANGER_ENTRY_EVIDENCE_V1: DebateAngerEntryEvidenceV1
```

结果的全部顶层字段为：

```ts
type DebateAngerEntryFailureV1 = {
  ok: false;
  reason: DebateAngerEntryFailureReasonV1;
};
type DebateAngerEntryResultV1 =
  | {
      ok: true;
      characters: [DebateAngerEntryCharacterV1, DebateAngerEntryCharacterV1];
      combo: DebateAngerEntryComboV1;
      receipt: DebateAngerEntryReceiptV1;
    }
  | DebateAngerEntryFailureV1;
```

复合 DTO 的公开类型均递归 readonly，下列结构展示省略 readonly 噪声。成功结果、失败结果、收据及其嵌套数据、两个公开常量均递归冻结。输入先安全分离，再在私有数据上解析和求值；不会修改或冻结调用者的 record 或数组，也不会把调用者对象引用带入输出。

成功的 `characters`、`combo` 与 `receipt.after` 中对应字段值相同，但不提供对象身份相同的合同。失败恰为 `{ ok:false, reason }`，不含部分状态、收据、索引或错误位置；即使内部阶段已经计算，仍不发布半成品。相同输入重复调用是重新独立求值，不是推进隐藏 session、继续连打或接着执行第二次判定。

## 2. 完整输入合同

输入是 JSON 式数据值，不是序列化 JSON 字符串；顶层恰有以下七个必需字段：

```ts
type DebateAngerEntryTeamV1 = 0 | 1;
type DebateAngerEntryMaybeTeamV1 = -1 | 0 | 1;
type DebateAngerEntryPersonalityV1 = 'timid' | 'calm' | 'bold' | 'reckless';
type DebateAngerEntryCardCodeV1 =
  -1 | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14;
type DebateAngerEntryHandV1 = [
  DebateAngerEntryCardCodeV1, DebateAngerEntryCardCodeV1,
  DebateAngerEntryCardCodeV1, DebateAngerEntryCardCodeV1,
  DebateAngerEntryCardCodeV1, DebateAngerEntryCardCodeV1,
  DebateAngerEntryCardCodeV1
];
type DebateAngerEntryCharacterV1 = {
  personality: DebateAngerEntryPersonalityV1;
  strength: number;
  hp: number;
  stress: number;
  angerTimer: number;
  maxCardCount: 4 | 5 | 6 | 7;
  hand: DebateAngerEntryHandV1;
};
type DebateAngerEntryComboV1 = {
  active: boolean;
  attacker: DebateAngerEntryMaybeTeamV1;
  counter: number;
};
type DebateAngerEntryInputV1 = {
  schemaVersion: 1;
  profile: 'debate-anger-entry-reference-v1';
  policies: DebateAngerEntryPolicyV1;
  firstTeam: DebateAngerEntryTeamV1;
  canReflect: boolean;
  characters: [DebateAngerEntryCharacterV1, DebateAngerEntryCharacterV1];
  combo: DebateAngerEntryComboV1;
};
```

`characters[0]` 和 `[1]` 始终是队伍0、1，不随先手顺序换位；对手为另一队。没有默认 schema、profile、policies、combo 或 canReflect，也不接收调用者 evidence、receipt、winner、phase、rawDraws、seed 或回调。

| 字段 | 必须提供的值或范围 |
|---|---|
| schemaVersion / profile | 精确为1 / `debate-anger-entry-reference-v1` |
| policies | 与完整固定政策逐值一致，不只是 id |
| firstTeam / canReflect | 数字0或1 / boolean，不做字符串或真假值转换 |
| characters | 恰有两项，逐项为上述完整角色 record |
| personality | `timid`（胆小）、`calm`（冷静）、`bold`（刚胆）、`reckless`（莽撞）之一 |
| strength | 已解析有效武力，整数1..100 |
| hp / stress | 整数−100..1000 / 0..100 |
| angerTimer | 整数0..4 |
| maxCardCount | 整数4..7，限定有效物理前缀长度 |
| hand | 恰好7项，每项整数−1..14 |
| combo.active | boolean |
| combo.attacker / combo.counter | 整数−1..1 / 0..7 |

所有数值必须是安全整数且不是 −0。这里的武力、timer 和 combo 范围是明确的工程准入域，不是所有现代源码状态、MOD 数值或原生状态可达性的证明。函数不由智力计算 maxCardCount，也不核验四性格与给定 timer 是否能在外部某条历史中同时出现。

combo 不加跨字段一致性条件：例如 active=false 时 attacker 不必为−1、counter 不必为0；active=true 时 attacker=−1 也不会仅因这一组合被拒绝。它是给定的有界检查点，只在本次实际胆小入场时被改写。不要把成功接纳解释成已认证其过去的连击历史。

### 2.1 七个物理槽，不是七张有效牌

`hand` 保留完整七槽 backing array；有效查找前缀为下标 `0..maxCardCount-1`。−1表示空槽，0是现代再考牌码，1..9为普通话题，10大喝、11诡辩、12无视、13镇静、14激昂。本核仅把13与14用作自动反制，其他合法牌码作为给定状态保存或压紧。

允许−1空槽、重复牌码、下标0处的任意合法牌码以及有效前缀外的非空槽。数值−1空槽不是 JavaScript 稀疏数组空洞，后者拒绝。不会补齐、排序、恢复再考0、修补普通话题牌或把下标0强制改成保留槽。

未发生反制移除时，七槽原值和顺序全部保留，包括无候选、无可用反制、对手已兴奋，以及无反制的各性格入场。只有发生实际反制牌移除时，才按第3.3节清除全部七槽并压紧有效前缀幸存牌。

## 3. 单次来源顺序与边界

安全分离与全部输入解析完成后，按以下顺序求值；没有随机或外围 session 调用。

### 3.1 选人和短路反制

1. 把本次候选重置为无。先看 firstTeam，再看对手；候选要求 angerTimer=0 且 stress=100。两方都符合时只选先手，不在本次继续处理另一方。
2. 无候选则不执行触发或入场，所有状态原值保留。
3. 候选对手 angerTimer>0 时，不查找任何反制牌；仍对候选执行无反制触发和入场。
4. 对手 angerTimer=0 时，若 canReflect=true，先查激昂14；只有其第一张匹配牌的物理下标严格大于0才反制。激昂合格就短路，不再查镇静。
5. 未选中激昂时查镇静13，也要求第一张匹配牌下标严格大于0。canReflect=false 只跳过激昂查找，仍可镇静反制。

查找从物理下标0开始，只查有效前缀。没有匹配牌时返回−1，第一张位于0则返回0；两者都不能反制。不能改成“下标1之后任意有一张即合格”：下标0的同码牌会遮蔽后面的重复牌。激昂第一张为0时仍可继续查镇静；有效前缀外的13或14永不参与查找。

### 3.2 触发压力、移除、重定向

| 反制 | 按实际来源先后执行的压力请求 | 之后的入场队伍 |
|---|---|---|
| 无，card=−1 | 原候选−100 | 原候选 |
| 镇静13 | 原候选−50 | 无，取消入场 |
| 激昂14 | 先候选对手−100，再原候选−50 | 候选对手 |

每一笔压力写入单独截断到0..100，记录请求和实际有符号变化；不是把所有变化先合计再截断。实际反制牌在上述触发压力之后移除，再执行激昂转移或镇静取消，最后才进入 `Anger()`。

激昂转移后不重新检查接收方是否压力满。其压力刚被−100请求归零，仍会直接进入对应性格的愤怒。`selectedTeam` 是转移前候选，`enteredTeam` 是最终入场者，二者不可混用。镇静取消也不另选另一名候选。

### 3.3 反制移除的物理语义

移除再次查找已选牌码的第一张有效匹配，去掉该物理槽；先把全部七槽置−1，再把原有效前缀内其余非−1牌按原顺序连续写回下标0起。不会保留下标0的特殊位置，也不会把有效前缀外的牌压入新手牌。

原有效前缀外非空槽因全七槽清空而丢弃，单列在 removal.discardedInactive；不是额外打出或额外选中的反制牌。幸存映射保留同码重复牌各自的 fromSlot/toSlot，但不创造跨调用的 occurrence 身份。移除最多一张选中的反制牌，不继续自动出第二张，不补牌。

### 3.4 入场计时器、胆小和莽撞

只有 enteredTeam≠−1 才进行一次入场，使用转移后的实际入场者性格：

- 胆小 / 莽撞设置 angerTimer=1；冷静 / 刚胆设置为4。本核不递减 timer。
- 胆小只设置 combo.active=true、attacker=enteredTeam、counter=0，不执行 `ComboAttack()`、不消耗普通牌、不造成连打伤害。
- 冷静和刚胆只设置本次计时器，不在这里恢复再考、改大牌、消耗额外牌或处理牌耗尽。
- 莽撞对实际入场者的对手请求 HP 伤害 `200 + strength`，随后请求压力伤害 `truncate(requestedHpDamage / 15)`。输入域内分别为201..300和13..20；向零截断在这里等同于正数向下取整。

莽撞先写 HP 并截断到−100..1000，再写压力并截断到0..100。压力基数是请求 HP 伤害，不是因 HP 下限而减少的实际掉血；目标已经−100 HP 仍会记录 HP 实际变化0并继续写压力。此分支不调用普通 Attack、会心、牌系数或通用伤害 hook。

无入场、镇静取消以及非胆小入场均原样保留 combo 的全部三个字段，不能擅自清零。receipt.comboTransition.pending 是结果 combo.active，而不是“本次新启动连打”，可能在无候选或非胆小入场时仍为true。

本核没有 HP>0 前置保护，也不在伤害后判定胜者。它不会因为本次压力写入令另一方达到100就继续第二次 CalcAngering，不会循环到稳定，不执行来源完整阶段中的连打、第二次判定、胜负、崩坏或回合结束顺序。

## 4. 完整 receipt 与审计字段

### 4.1 主记录与反制查找

```ts
type DebateAngerEntrySnapshotV1 = {
  characters: [DebateAngerEntryCharacterV1, DebateAngerEntryCharacterV1];
  combo: DebateAngerEntryComboV1;
};
type DebateAngerEntryCounterSearchV1 = {
  card: 13 | 14;
  firstIndex: number;
  eligible: boolean;
};
type DebateAngerEntryCounterAuditV1 = {
  team: DebateAngerEntryMaybeTeamV1;
  card: -1 | 13 | 14;
  status: 'no-candidate' | 'opponent-already-angry' |
    'no-eligible-counter' | 'agitate' | 'compose';
  searches: DebateAngerEntryCounterSearchV1[];
};
type DebateAngerEntryReceiptV1 = {
  schemaVersion: 1;
  profile: 'debate-anger-entry-reference-v1';
  policy: DebateAngerEntryPolicyV1;
  evidence: DebateAngerEntryEvidenceV1;
  firstTeam: DebateAngerEntryTeamV1;
  canReflect: boolean;
  before: DebateAngerEntrySnapshotV1;
  after: DebateAngerEntrySnapshotV1;
  selection: {
    order: [DebateAngerEntryTeamV1, DebateAngerEntryTeamV1];
    eligibleByTeam: [boolean, boolean];
  };
  selectedTeam: DebateAngerEntryMaybeTeamV1;
  enteredTeam: DebateAngerEntryMaybeTeamV1;
  calcAngeringResult: boolean;
  counter: DebateAngerEntryCounterAuditV1;
  removal: DebateAngerEntryRemovalV1 | null;
  stressTransitions: DebateAngerEntryStressTransitionV1[];
  reckless: DebateAngerEntryRecklessV1 | null;
  timerTransition: DebateAngerEntryTimerTransitionV1 | null;
  comboTransition: DebateAngerEntryComboTransitionV1;
  externalRngConsumed: 0;
};
```

输入是复数 policies，收据为单数 policy。before/after 都含完整角色和 combo 状态；firstTeam/canReflect 单独记录，不在 snapshot 内重复。selection.order 是 `[firstTeam, opponent]`；eligibleByTeam 始终按队伍0、1排列，表示触发前的资格，不按先后手排序。

selectedTeam=−1 表示无候选；enteredTeam=−1 表示没有入场，可以是无候选或镇静取消。calcAngeringResult 恒等于 enteredTeam≠−1，不是求值成功标志，也不是胜负或是否消费了牌。

无候选时 counter 恰为 team=−1、card=−1、status=no-candidate、searches=[]。有候选时 team 为其对手，即使对手已兴奋或没有合格牌；card=−1表示没有选中的反制。status 分别区分对手已兴奋、查无可用反制、激昂和镇静。

searches 最多两项，只记录实际求值的查找，保持短路顺序。对手已兴奋时为空；canReflect=false 时不出现激昂项；激昂合格时不出现镇静项。被省略不是“查找失败”，不能补造 firstIndex=−1。已有记录的 firstIndex 为−1或有效前缀物理下标0..6，eligible 精确等于 firstIndex>0。

### 4.2 移除、逐笔压力和 HP

```ts
type DebateAngerEntryRemovalV1 = {
  team: DebateAngerEntryTeamV1;
  card: 13 | 14;
  physicalSlot: number;
  maxCardCount: 4 | 5 | 6 | 7;
  beforeHand: DebateAngerEntryHandV1;
  afterHand: DebateAngerEntryHandV1;
  survivors: {
    card: DebateAngerEntryCardCodeV1;
    fromSlot: number;
    toSlot: number;
  }[];
  discardedInactive: {
    card: DebateAngerEntryCardCodeV1;
    physicalSlot: number;
  }[];
};
type DebateAngerEntryStressTransitionV1 = {
  sequence: number;
  stage: 'anger-trigger' | 'reckless-entry';
  cause: 'agitate-opponent-reset' | 'agitate-selected-half-reset' |
    'compose-selected-half-reset' | 'uncountered-selected-reset' | 'reckless-hit';
  team: DebateAngerEntryTeamV1;
  beforeStress: number;
  requestedStressDelta: number;
  afterStress: number;
  actualStressDelta: number;
};
type DebateAngerEntryHpTransitionV1 = {
  beforeHp: number;
  requestedHpDelta: number;
  afterHp: number;
  actualHpDelta: number;
};
type DebateAngerEntryRecklessV1 = {
  attackerTeam: DebateAngerEntryTeamV1;
  targetTeam: DebateAngerEntryTeamV1;
  strength: number;
  requestedHpDamage: number;
  requestedStressDamage: number;
  hp: DebateAngerEntryHpTransitionV1;
  stress: DebateAngerEntryStressTransitionV1;
};
```

无反制时 removal=null；否则 physicalSlot 是移除前有效前缀内首张匹配的下标1..6，beforeHand/afterHand 是完整七槽快照。survivors 按原 fromSlot 递增排列，toSlot 从0连续编号，实际项不会含−1；discardedInactive 按物理下标递增，只列出有效前缀外原本非−1的槽，不列空槽。

stressTransitions 最多三项，sequence 从0起连续编号，按来源实际写入顺序排列。每项 actualStressDelta=afterStress−beforeStress；requestedStressDelta 保留−100、−50或莽撞正值，不因截断而改写。请求发生但实际变化0的写入仍保留。无候选时该数组为空。

reckless 仅在实际莽撞入场时非null。requestedHpDamage/requestedStressDamage 为正数伤害量，hp.requestedHpDelta 是其负的 HP 请求；actualHpDelta=afterHp−beforeHp。reckless.stress 是相应的 reckless-hit 压力写入记录，sequence 对应完整 stressTransitions 中的位置；这是同一笔写入的详情，不是额外加一次压力。HP transition 不另带 team，目标由外层 targetTeam 指定。

### 4.3 计时器和连击检查点

```ts
type DebateAngerEntryTimerTransitionV1 = {
  team: DebateAngerEntryTeamV1;
  personality: DebateAngerEntryPersonalityV1;
  beforeTimer: number;
  afterTimer: 1 | 4;
};
type DebateAngerEntryComboTransitionV1 = {
  before: DebateAngerEntryComboV1;
  after: DebateAngerEntryComboV1;
  activatedByTimid: boolean;
  pending: boolean;
};
```

timerTransition 在无入场时为null，其他情况只记录实际入场方的一次设置，不制造对手 timer 变化。输入与反制门槛保证本支持域内实际入场者 beforeTimer=0；公开字段类型仍为 number。

comboTransition 始终存在。activatedByTimid 表示本次实际执行胆小入场写入，即使传入 active 已经为true也为true；pending 恒等于 after.active，不声称 ComboAttack 已执行、可执行或已经完成。before/after 为完整三字段快照，不省略没有变化的字段。

以上展示覆盖全部23个公开类型别名。没有单独的 counterCard、removedSlot、damage、winner、drawCount 或 session 字段；纸面案例中的概念摘要不能替代这些正式字段。

## 5. 固定政策与证据常量

`DebateAngerEntryPolicyV1` 和 `DebateAngerEntryEvidenceV1` 是实现中固定 POLICY/EVIDENCE 对象的递归 readonly 类型，不是可扩展配置。完整字面量在[来源账本](../sources/debate-anger-entry-v1.json)与[源码](../../packages/engine/src/debate-anger-entry.ts)中保留，本页不再复制整份大对象。

政策 id 为 `debate-anger-entry-single-pass-policy-v1`，profile 为 `debate-anger-entry-reference-v1`。其全部顶层键是 `id, profile, checkpoint, hand, selection, counter, trigger, entry, combo, audit, safety, capacity, boundary`。输入必须与固定对象完整一致；record 键顺序不影响比较，数组值与顺序影响比较。缺失、添加或改写任何安全政策值都为 unsupported-policy，不允许仅提交 id 或覆盖某条机制。

政策明确锁定七物理槽、先手优先、首匹配下标严格大于0、反制短路与压力写入顺序、反制时全槽清空和稳定压紧、转移后不复查压力、四性格计时器、莽撞请求伤害基数、胆小只置连击待处理、其余分支保留 combo、安全预算与无 session 边界。严格 DTO、准入范围、安全分离、审计、错误和不可变输出是工程合同，不冒充原作 JSON API 或完整源码可达状态空间。

证据固定于现代 C# 转录仓库 `tankyc/sango_infinity`，commit `a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef`；Debate.cs blob=`0137498d10773cd4596d497083ccdf6a26b3a261`，DebateEnum.cs blob=`5b46a8ac87613193eb9f4b99a25e489ba6f5e483`。核心顺序来源为：

- [Debate.cs 1483–1517](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L1483-L1517)：CalcAngering 的单次选人、短路反制、转移与返回值。
- [Debate.cs 1300–1354](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L1300-L1354)：AngerTrigger 先压力后移除；Anger 设置 timer、胆小连击标记及莽撞入场伤害。
- [Debate.cs 377–391](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L377-L391)、[453–477](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L453-L477)、[512–534](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L512-L534)：性格计时器、七槽清空／有效前缀压紧和查找、HP／压力写入截断。
- [Debate.cs 1356–1377](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L1356-L1377) 的 ComboAttack 仅作为排除边界，本核不执行。

其余常量、角色／combo 字段、容量、武力和性格解析、对手及枚举来源范围由完整 evidence 的具名 Lines 字段逐项记录；输入不能注入或改写 evidence。`nativeEquivalent`、`stockOriginalVerified`、`pkEquivalent`、`vanillaEquivalent`、`completeDebate` 均为false。43证据主题／45历史快照保持开放，nativeWholeChain=open，P078及其全部依赖排除，不升级为原生 PK、Vanilla、主机二进制或原始头文件认证。

## 6. 全部错误、安全分离与预算

### 6.1 封闭的18种失败原因

`DebateAngerEntryFailureReasonV1` 恰为下列 reason 字面值的联合：

| reason | 条件 |
|---|---|
| `unsupported-runtime` | 无法取得必需的安全 Proxy 检测入口，在输入检查前拒绝降级 |
| `input-limit` | 值节点、深度、通用数组长度、键数量或字节预算超限 |
| `malformed-data` | 非法 JSON 式结构或数值、缺少必需字段、非法属性；顶层不是 record；未归类内部异常 |
| `unknown-field` | 顶层、角色或 combo record 出现未登记键 |
| `unsupported-profile` | schemaVersion 或 profile 不等于固定值 |
| `unsupported-policy` | 完整 policies 与固定政策不匹配 |
| `invalid-first-team` | firstTeam 不是数字0或1 |
| `invalid-can-reflect` | canReflect 不是 boolean |
| `invalid-characters` | characters 不是数组或长度不是2 |
| `invalid-character` | characters 中某项不是 record |
| `invalid-personality` | personality 不属于四个明确的字符串 |
| `invalid-strength` | strength 类型或整数范围不符合1..100 |
| `invalid-hp` | hp 类型或整数范围不符合−100..1000 |
| `invalid-stress` | stress 类型或整数范围不符合0..100 |
| `invalid-anger-timer` | angerTimer 类型或整数范围不符合0..4 |
| `invalid-hand-capacity` | maxCardCount 类型或整数范围不符合4..7 |
| `invalid-hand` | hand 不是七项数组，或某个安全分离后的值不是−1..14数字牌码 |
| `invalid-combo` | combo 不是 record，active 不是 boolean，或 attacker/counter 类型或范围不符 |

安全分离先于上述领域范围检查：分数、NaN、Infinity、非安全整数、−0、undefined 等先归 malformed-data；例如 strength=101 为 invalid-strength，但 strength=1.5 为 malformed-data。键缺失在顶层、角色、combo 都是 malformed-data，不改成某个字段专用原因。安全 policies 内部键值差异统一按 unsupported-policy；其中的危险结构仍先由安全分离拒绝。

静态解析顺序为：分离整个输入；顶层形状；schema/profile；完整政策；firstTeam；canReflect；characters 数组形状；队伍0再队伍1的角色；最后 combo。每个角色依次检查形状、personality、strength、hp、stress、angerTimer、maxCardCount、hand。object 形状检查先未知键，再缺失键。此说明不另行承诺所有同时含多种非法对象结构的输入都有跨结构统一错误优先级。

没有 unsupported-anger、unsupported-combo、终局拒绝或跨字段连击拒绝。没有候选是成功的无状态变化结果，而不是失败。所有字段解析完毕才执行领域写入，失败不返回部分人物、连击或收据，也不输出调用者私有值。

### 6.2 不执行调用者代码的输入边界

只接受 Object.prototype 或 null 原型的普通 record、标准 Array 和受限 JSON 式标量。record 的自有字段必须为可枚举数据属性；数组必须稠密、索引完整、无附加属性，只有正常 length 属性可非枚举。可以传入已经冻结的普通数据。

拒绝 Proxy、getter/setter、函数、undefined、BigInt、Symbol、Date、自定义原型、循环引用、稀疏数组、符号键、隐藏字段及装饰过的数组。不会调用调用者 getter、toJSON 或自定义 iterator。每个 Proxy 在反射其原型和属性之前识别并拒绝；非循环的共享对象引用可以接收，但每次出现独立复制和计入预算，不保留输入引用身份。

运行时必须可通过可信 `process.getBuiltinModule('node:util').types.isProxy` 取得检测入口。不可用时为 unsupported-runtime，且不先检查输入；不进行无检测的兼容降级。这是运行时要求，不表示本批已运行、安装或验证某个 Node／浏览器环境。

### 6.3 固定资源边界

| 项目 | 上限或精确范围 |
|---|---:|
| 输入值节点，包括每次重复引用展开 | 2048 |
| 嵌套深度，根为0 | 12 |
| 通用输入数组长度 | 64 |
| 每个对象自有键数量的安全检查 | 最多2048 |
| 输入 canonical UTF-8 字节数 | 32768 |
| 单个键名或字符串的 JavaScript length | 32768 |
| characters / 每方物理 hand | 恰好2 / 7项 |
| counter.searches | 最多2项 |
| stressTransitions | 最多3项 |
| 选中并移除的反制牌 | 最多1张 |

分离期间还累计全部键名与字符串的 UTF-8 字节，合计最多32768；单个键名和字符串的 length 检查使用 JavaScript UTF-16 码元长度。分离后的完整 canonical JSON 再检查32768字节上限。预算包括完整 policies；对象自有键计数也适用于数组并包含 length 键。canonical 对象按键排序、数组保留顺序。通用数组64不替代领域限制，characters仍恰为2、hand仍恰为7。

这些分离预算限制传入 input，不是返回 result/receipt 的统一序列化封装额度。输出由两名角色、有限查找、一次移除、最多三笔压力及一次入场定界；不为满足输入额度而裁剪输出审计。没有存档字节、历史条数、回放次数或 RNG 消费预算，因为本核没有这些接口。

## 7. 使用范围与静态交付声明

[纸面案例](../../data/scenarios/debate-anger-entry-example-v1.json)中每个 successCases 项的 input 才是直接 API 输入；外层案例包装、paperExpected、推导文字及拒绝配方都不是可接收的额外字段。其 counterCard、removedSlot 等概念摘要仅用于阅读，不是完整 receipt 或实际执行输出。所有期望均为人工来源推导、未运行，不得据此宣称测试通过。

调用者只有在 ok:true 时才可采用整对 characters 与 combo；本核不自动把它们写入任一 session。receipt 是这一次给定检查点的确定性审计，不认证其初始状态来源、过去动作、完整连击历史或原生执行结果。

没有 create、inspect、preview、execute-round、save、load、replay 或完整阶段接口。完整愤怒阶段的两次判定、胆小连打、胜负／崩坏／回合结束次序、愤怒中出牌和伤害系数、冷静再考及刚胆牌耗尽继续开放；人物解析、开场／追击／留情、campaign、P078及其全部依赖排除。

旧九个 session profile、政策、存档和此前独立内核均不变，无隐式迁移。已有 regenerated profile 仍按原合同拒绝非终局怒线；交付本组件不等于将其接入旧 session，也不等于完整现代舌战或原生 PK／Vanilla 等价。

本批只做静态文本编辑、固定源码阅读与纸面推导；未运行测试、编译器、typecheck、build、validator、checker、诊断、项目、候选 API、示例、来源代码或 replay。文档及导出存在不构成运行时兼容、测试通过、验收、发布或合并证明。
