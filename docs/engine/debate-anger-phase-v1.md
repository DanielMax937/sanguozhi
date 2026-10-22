# 独立舌战愤怒结算事务 API v1

[规则与来源边界](../rules/debate-anger-phase-v1.md) · [固定政策与证据](../sources/debate-anger-phase-v1.json) · [独立纸面案例，未运行](../../data/scenarios/debate-anger-phase-example-v1.json)。

实现入口为 [debate-anger-phase.ts](../../packages/engine/src/debate-anger-phase.ts)，公共导出见 [engine index](../../packages/engine/src/index.ts)。本页描述固定现代 C# 参考中一次有界、原子的愤怒结算事务：第一次允许激昂反射的入场及完整胆小连打，判胜；若未终局，再进行一次不允许激昂反射的入场及完整胆小连打，先更新崩坏再判胜。它组合既有 PR115 愤怒入场与 PR116 胆小连打内核，不另抄一套入场、移除或连打规则。

这不是完整 `AngerPhase` 状态机。输出只描述“已终局但待分类”或“待回合结束”，不调用 `CanCritical`，不决定或执行 Critical／Closing 路由，不执行 `TurnEnd`，也不推进任何旧 session。输入是调用者提供的全新非终局检查点；人物性格、有效武力、手牌容量和每队有效攻击力已经解析完成。没有人物查询、随机生成、动画、补牌或外围 campaign 写入。

## 1. 公开入口与原子性

唯一公开函数和两个公开常量为：

```ts
evaluateDebateAngerPhase(input: unknown): DebateAngerPhaseResultV1
DEBATE_ANGER_PHASE_POLICY_V1: DebateAngerPhasePolicyV1
DEBATE_ANGER_PHASE_EVIDENCE_V1: DebateAngerPhaseEvidenceV1
```

复合 DTO 的公开类型递归 readonly；以下结构展示省略 readonly 噪声。成功和失败结果、完整收据、嵌套组件收据、角色及两项常量均递归冻结。调用者输入先安全分离，在私有数据上完整解析后才求值；不修改或冻结调用者对象，不把调用者对象引用带入结果。

成功只发布整笔事务的最终状态。第二遍的失败、缺少实际命中需要的抖动、合法但未消费的抖动，都会使整笔事务失败，不发布第一遍已算出的角色、连击、胜者或收据。子组件失败可额外给出组件名、遍次与原组件错误代码，但不返回部分组件输出。失败并不表示已经推进了外部状态或消耗了外部 RNG。

相同输入的每次调用均重新独立求值，不记住上次调用、隐藏 session 或随机游标。最终状态与 `receipt.after` 的对应字段值相同，但不保证引用身份相同。

## 2. 输入准入与物理状态

输入为 JSON 式数据值，不是序列化 JSON 字符串。所有字段必需且封闭，没有默认政策、默认攻击力或自动补齐随机记录。`characters`、`resolvedAttacks`、`crumbledLevels`、`crumbled` 始终按队伍0、1排列，不跟随先手换位；`passDraws` 则按第1、2遍排列，不按队伍排列。

```ts
type DebateAngerPhaseTeamV1 = 0 | 1;
type DebateAngerPhaseMaybeTeamV1 = -1 | 0 | 1;
type DebateAngerPhasePersonalityV1 = 'timid' | 'calm' | 'bold' | 'reckless';
type DebateAngerPhaseCardCodeV1 =
  -1 | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14;
type DebateAngerPhaseHandV1 = [
  DebateAngerPhaseCardCodeV1, DebateAngerPhaseCardCodeV1,
  DebateAngerPhaseCardCodeV1, DebateAngerPhaseCardCodeV1,
  DebateAngerPhaseCardCodeV1, DebateAngerPhaseCardCodeV1,
  DebateAngerPhaseCardCodeV1
];
type DebateAngerPhaseCharacterV1 = {
  personality: DebateAngerPhasePersonalityV1;
  strength: number;
  hp: number;
  stress: number;
  angerTimer: number;
  maxCardCount: 4 | 5 | 6 | 7;
  hand: DebateAngerPhaseHandV1;
};
type DebateAngerPhaseComboV1 = {
  active: boolean;
  attacker: DebateAngerPhaseMaybeTeamV1;
  counter: number;
};
type DebateAngerPhaseInactiveComboV1 = DebateAngerPhaseComboV1 & { active: false };
type DebateAngerPhaseRawDrawV1 = {
  role: 'debate-timid-combo-jitter';
  bound: 5;
  value: number;
};
type DebateAngerPhaseCrumbleLevelV1 = 0 | 1 | 2 | 3;
type DebateAngerPhasePassNumberV1 = 1 | 2;
type DebateAngerPhaseOutcomeV1 =
  'terminal-pending-classification' | 'turn-end-pending';
type DebateAngerPhaseInputV1 = {
  schemaVersion: 1;
  profile: 'debate-anger-phase-reference-v1';
  policies: DebateAngerPhasePolicyV1;
  genericOnly: true;
  firstTeam: DebateAngerPhaseTeamV1;
  winner: -1;
  characters: [DebateAngerPhaseCharacterV1, DebateAngerPhaseCharacterV1];
  combo: DebateAngerPhaseInactiveComboV1;
  crumbledLevels: [DebateAngerPhaseCrumbleLevelV1, DebateAngerPhaseCrumbleLevelV1];
  crumbled: [boolean, boolean];
  resolvedAttacks: [number, number];
  passDraws: [DebateAngerPhaseRawDrawV1[], DebateAngerPhaseRawDrawV1[]];
};
```

Team、MaybeTeam、Personality、CardCode、Hand、Character、Combo 七个别名直接沿用 PR115 对应公开类型，RawDraw 直接沿用 PR116 对应类型；没有改写旧类型。Character 的 hp 类型仍是 number，初始1..1000是本函数的运行时准入，而不是给旧 Character 增加另一个静态数字类型。上面的展开用于自足说明，实际公开复合别名均保留原有递归 readonly。

顶层恰有这12个字段。不接受调用者 canReflect、phase、topic、seed、RNG 回调、evidence、receipt 或人物 id。反射开关由遍次固定；当前 angry timid 伤害使用组件已固定的话题系数，不需要当前话题输入。

### 2.1 字段范围与全新检查点

| 字段 | 必须提供的值或范围 |
|---|---|
| schemaVersion / profile | 精确为1 / `debate-anger-phase-reference-v1` |
| policies | 与完整固定政策逐值一致，不只是 id |
| genericOnly | 精确为 boolean true，包括实际没有连打的输入 |
| firstTeam | 数字0或1；两遍始终使用同一先手 |
| winner | 精确为数字−1，不接受已判定胜者 |
| characters | 恰好两项完整角色 record |
| personality | timid（胆小）、calm（冷静）、bold（刚胆）、reckless（莽撞）之一 |
| strength | 已解析有效武力，整数1..100 |
| hp | 初始整数1..1000，两方都必须存活 |
| stress / angerTimer | 整数0..100 / 0..4 |
| maxCardCount | 整数4..7，定义有效物理前缀长度 |
| hand | 恰好7项，每项整数−1..14 |
| combo.active | 精确为 boolean false，不接受恢复一段待处理连打 |
| combo.attacker / combo.counter | 整数−1..1 / 0..7，允许非默认的失活检查点 |
| crumbledLevels | 恰好两项，每项整数0..3 |
| crumbled | 恰好两项，每项 boolean |
| resolvedAttacks | 恰好两项，每队已解析攻击力为整数70..227 |
| passDraws | 恰好两个稠密数组，每遍0..4项 |
| 每项 raw draw | 恰有 role、bound、value；role=`debate-timid-combo-jitter`，bound=5，value 为整数0..4 |

全部数值必须是安全整数且不是−0，不做字符串、真假值或分数转换。武力、timer、攻击力、连击和崩坏范围是工程准入合同，不证明任意外部历史、MOD 或原生状态可达性。初始 HP>0 只约束外部输入；第一次入场或连打之后的内部 HP 可以降到0或负数，按组件的−100..1000写入范围保留，不重新施加外部存活准入。

失活 combo 的 attacker、counter 不会因 active=false 被清零，也不要求 attacker=−1 或 counter=0。仅当一次实际胆小入场创建新 combo 时，既有入场核才将其改为 active=true、attacker=实际入场队伍、counter=0。连打完成后保留该攻击方与本次实际命中计数；没有任何胆小入场时，原失活检查点的三个字段全程保留。

resolvedAttacks 与 strength 是不同输入。莽撞入场仍用实际入场者的 strength；胆小连打按这一次的 combo.attacker 读取 `resolvedAttacks[attacker]`。本事务不由武力、智力、timer 或人物 id 推算攻击力。genericOnly=true 仅为调用者对通用 identity 伤害行为的断言，不表示本核已查询并证实双方没有人物专属覆盖。

两队攻击力和两遍全部抖动都在执行第一遍前校验。第一遍会终局、某队从不攻击或某遍没有连打，不会使相应字段成为可缺失或可放非法值的占位数据。没有连打的遍次必须给空数组；第一遍终局而跳过第二遍时，第二数组也必须为空，否则整笔失败。

### 2.2 七槽手牌与组件兼容

hand 是完整七槽 backing array；有效前缀为下标0..maxCardCount−1。−1为空，0为现代再考，1..9为普通话题，10大喝、11诡辩、12无视、13镇静、14激昂。允许空槽、同码重复牌、下标0处任意合法牌和有效前缀外非空槽；数值−1不是 JavaScript 稀疏数组空洞，后者拒绝。

外层不排序、压紧、补牌、恢复再考0或修补槽位。反制查找保留 PR115 的“首张匹配下标严格大于0”规则：下标0同码牌会遮蔽其后的重复牌。反制移除与连打命中移除分别由原组件执行，全七槽清空后仅稳定压紧有效前缀内的非空幸存者；原有效前缀外非空牌在相应移除审计中列为丢弃，不当作额外命中或反制。

PR115 接受有界的普通 combo 检查点，PR116 只接受 active=true、counter=0、有效攻击队伍且该角色为 timid／timer1 的全新待处理检查点。外层要求初始 active=false，使每次实际传给 PR116 的活动 combo 都来自刚发生的胆小入场；完成后恢复 active=false，再作为第二遍入场的检查点。不会把任意旧 active=true 连击强行转换成可恢复状态。

## 3. 两遍来源顺序、判胜与崩坏

### 3.1 固定顺序与早停

全部输入解析后，事务按以下顺序执行：

1. 第1遍调用原入场核，canReflect=true、firstTeam 为输入先手。
2. 若入场新建了胆小 combo，使用其实际攻击队伍的 resolvedAttack 和第1遍完整 draw 数组，调用原连打核完成整个可变手牌扫描；否则要求第1遍 draw 数组为空。
3. 执行第1次 winner 检查。若终局，跳过第2遍及全部崩坏计算，并要求第2遍 draw 数组为空。
4. 若仍未终局，第2遍以第1遍最终角色及 combo 调用原入场核，canReflect=false，firstTeam 不变。此时跳过激昂查找，但仍可由镇静反制。
5. 若新建胆小 combo，使用实际攻击队伍的 resolvedAttack 与第2遍完整 draw 数组，完成整个连打；否则要求第2遍 draw 数组为空。
6. 两队各更新一次崩坏，再执行第2次 winner 检查，返回最终状态与待续状态说明。

不存在第3遍，也不循环到压力稳定；第2遍伤害新造成的满压力不会再触发本事务内另一轮入场。第1遍无候选、镇静取消或零命中不意味着结束，只要未终局仍执行第2遍。

一次连打不会因目标 HP≤0 提前停止。所有实际命中、抖动消费、HP／压力写入、当前槽移除与 counter 递增全部完成后，才进行该遍 winner 检查。零命中也是完整连打，combo.active 仍变回false，组件收据不是null。

### 3.2 判胜的检查顺序

每次检查先看 `opponent(firstTeam)` 的 HP 是否≤0，满足时 winner=firstTeam；否则再看 firstTeam 的 HP 是否≤0，满足时 winner=对手；两方都存活则 winner=−1。保留来源的分支优先级，不把它改为固定队伍0优先或扫描全部队伍后挑选。

外部存活准入及本子域的单向伤害排除了任意注入双死起点，但审计仍描述来源优先顺序；不能从这一边界推导对整个现代／原生舌战的双死规则认证。winner 只表示本事务的 HP 判胜结果，不提供胜利类型、Critical 资格、Closing 路由、留情或结算。

### 3.3 崩坏是 level 比较，不是仅上升事件

第2遍完整连打之后，对每队计算：

```text
calculatedLevel = clamp(truncate((1000 − hp) / 250), 0, 3)
afterLevel = calculatedLevel
afterCrumbled = beforeCrumbled OR (beforeLevel != calculatedLevel)
```

整数除法向零截断；在本 HP 域内分子非负。level 与给定旧值不同就置 crumbled=true，包括 level 向下变化，不要求损伤跨越了新的一档。旧值相同时保留旧 crumbled，已为true不会自动清回false。本 API 不要求初始 crumbledLevels 与初始 HP 相互一致，因此显式给定的较高旧 level 可以被向下更新。

第1遍终局时完全不计算崩坏，两个输入崩坏数组原样保留，即使与最终 HP 不相符也不会补算。第2遍终局则包含此前已完成的崩坏更新。崩坏旗标在这里不播放动画、不消耗、不复位。

### 3.4 随机记录按遍次精确分配

发生连打时，本遍完整数组原样交给 PR116，不由外层预扫手牌预测命中数，也不拆分一个全局随机流。每次真实话题命中恰消费一项 jitter；非话题扫描、反制、莽撞入场、判胜与崩坏不消费。缺少实际需要的 draw 或多给任何合法但未使用的 draw 都是失败。

单遍最多4项，两遍最多8项。这是容量≤7的可变物理下标前向扫描加稳定压紧所导出的上界，不是新增“第4击强制停止”。外层全局 draw 索引仅用于审计定位，不重写任何嵌套组件的本地 drawIndex、hit sequence、writer sequence 或 originalSlot。

raw draw 是调用者提供的随机结果数据，不是本核运行 RNG。`externalRngConsumed` 恒为0，不表示没有消费 supplied draws，也不证明原生随机流对齐。

## 4. 完整输出、审计与类型

### 4.1 成功、快照和主收据

```ts
type DebateAngerPhaseSnapshotV1 = {
  characters: [DebateAngerPhaseCharacterV1, DebateAngerPhaseCharacterV1];
  combo: DebateAngerPhaseComboV1;
  winner: DebateAngerPhaseMaybeTeamV1;
  crumbledLevels: [DebateAngerPhaseCrumbleLevelV1, DebateAngerPhaseCrumbleLevelV1];
  crumbled: [boolean, boolean];
};
type DebateAngerPhaseSuccessV1 = DebateAngerPhaseSnapshotV1 & {
  ok: true;
  outcome: DebateAngerPhaseOutcomeV1;
  receipt: DebateAngerPhaseReceiptV1;
};
type DebateAngerPhaseReceiptV1 = {
  schemaVersion: 1;
  profile: 'debate-anger-phase-reference-v1';
  policy: DebateAngerPhasePolicyV1;
  evidence: DebateAngerPhaseEvidenceV1;
  genericOnly: true;
  firstTeam: DebateAngerPhaseTeamV1;
  resolvedAttacks: [number, number];
  before: DebateAngerPhaseSnapshotV1;
  after: DebateAngerPhaseSnapshotV1;
  passes: DebateAngerPhasePassV1[];
  winnerChecks: DebateAngerPhaseWinnerCheckV1[];
  crumbleResult: DebateAngerPhaseCrumbleResultV1 | null;
  drawAudit: DebateAngerPhaseDrawAuditV1;
  outcome: DebateAngerPhaseOutcomeV1;
  externalRngConsumed: 0;
};
```

成功的全部顶层字段就是 ok、characters、combo、winner、crumbledLevels、crumbled、outcome、receipt。输出 combo 的类型沿用普通 Combo，但本版本每次成功的 active 均为false：初始失活，任何新建胆小 combo 都完整关闭。attacker 仍可为−1，例如没有胆小入场且初始为−1时；counter 不等于两遍累计击数，第二次胆小入场会先重置为0。

输入为复数 policies，主收据为单数 policy。before 是完整初始快照，after 是整笔事务最终快照；firstTeam、genericOnly 与 resolvedAttacks 单独放在收据上，不在 Snapshot 中重复。Snapshot 不含随机游标、当前话题、阶段对象或 outcome。

passes 与 winnerChecks 各有1或2项，顺序与实际执行一致，长度相同。第一遍终局时二者只有第1项且 crumbleResult=null；不是补一个“未执行第二遍”的空占位。否则恰好两遍且 crumbleResult 非null，即使两遍都无人入场。outcome 在主结果和主收据中相同：winner=−1时为 turn-end-pending，否则为 terminal-pending-classification。

### 4.2 每遍记录与完整依赖收据

```ts
type DebateAngerPhasePassV1 = {
  pass: DebateAngerPhasePassNumberV1;
  canReflect: boolean;
  before: DebateAngerPhaseSnapshotV1;
  entryReceipt: DebateAngerEntryReceiptV1;
  comboReceipt: DebateTimidComboReceiptV1 | null;
  drawAudit: DebateAngerPhasePassDrawAuditV1;
  winnerCheck: DebateAngerPhaseWinnerCheckV1;
  after: DebateAngerPhaseSnapshotV1;
};
```

pass 为1或2，不是0起的数组索引；canReflect 在第1遍严格为true、第2遍严格为false。before 为本遍入场前完整状态，第2遍的 before 与第1遍 after 值相同。after 已包括本遍 winner 检查；第2遍 after 还包含先行的崩坏更新。

entryReceipt 每遍都存在，包括无候选、反制取消的情况。comboReceipt=null 仅表示没有调用连打；实际调用但零命中时仍保留非null完整连打收据。嵌套收据并未裁剪或省略字段，也不换成外层 profile：

- [DebateAngerEntryReceiptV1 完整合同](debate-anger-entry-v1.md)：保留该组件全部 before/after、先手与反射开关、候选资格与先后顺序、selectedTeam／enteredTeam、实际短路反制查找、物理移除及 inactive 丢弃、压力写入、莽撞伤害、timer 与 combo transition，以及其固定 policy/evidence。
- [DebateTimidComboReceiptV1 完整合同](debate-timid-combo-v1.md)：保留该组件全部 before/after、攻击方／目标、resolvedAttack、逐槽 scans、逐击算术与写入、移除与原槽映射、combo transition、完整 consumedDraws、suppliedRawDrawCount，以及其固定 policy/evidence。

这两个导入类型的全部字段由既有 API 页面和对应源码规定，本页没有宣称它们只剩上述摘要。外层不新增同名 EntryReceipt／ComboReceipt 类型，不把其局部 snapshot 扩展成含 winner／崩坏的外层 Snapshot。特别是 entryReceipt.after 为入场后、连打前；comboReceipt.after 为连打后、外层判胜及崩坏之前。

子收据中的 hit sequence、HP／压力 writer sequence、drawIndex 和 originalSlot 仍是原组件本次调用的本地编号。originalSlot 表示那一次连打开始时的手牌槽，不是整个两遍事务开始时的统一身份，更不是跨 session occurrence id。

### 4.3 判胜审计

```ts
type DebateAngerPhaseWinnerTestV1 = {
  team: DebateAngerPhaseTeamV1;
  hp: number;
  terminal: boolean;
};
type DebateAngerPhaseWinnerReasonV1 =
  'opponent-hp-nonpositive' | 'first-hp-nonpositive' | 'no-terminal-hp';
type DebateAngerPhaseWinnerCheckV1 = {
  pass: DebateAngerPhasePassNumberV1;
  firstTeam: DebateAngerPhaseTeamV1;
  order: [DebateAngerPhaseTeamV1, DebateAngerPhaseTeamV1];
  hp: [number, number];
  beforeWinner: -1;
  afterWinner: DebateAngerPhaseMaybeTeamV1;
  tests: DebateAngerPhaseWinnerTestV1[];
  reason: DebateAngerPhaseWinnerReasonV1;
  terminal: boolean;
};
```

order 始终完整表示 `[opponent(firstTeam), firstTeam]`；hp 始终按队伍0、1保存两值，不按 order 换位。tests 则只记录实际计算的分支：第一项是对手 HP 检查；其 terminal=true 时只有这一项，否则才追加先手 HP 检查。省略的第二分支不是判定为false，不能补造测试条目。

beforeWinner 固定−1，因为初始准入要求未判胜且第一次终局不再做第二次检查。afterWinner 是检查后状态，terminal 精确等于 afterWinner≠−1。reason 为 opponent-hp-nonpositive 时先手获胜；first-hp-nonpositive 时对手获胜；no-terminal-hp 时仍为−1。每遍的 winnerCheck 与主收据 winnerChecks 对应项值相同，不保证它们是不同引用或相同引用。

### 4.4 崩坏审计

```ts
type DebateAngerPhaseCrumbleTeamV1 = {
  team: DebateAngerPhaseTeamV1;
  hp: number;
  unboundedLevel: number;
  computedLevel: DebateAngerPhaseCrumbleLevelV1;
  previousLevel: DebateAngerPhaseCrumbleLevelV1;
  changed: boolean;
  previousFlag: boolean;
  afterFlag: boolean;
};
type DebateAngerPhaseCrumbleResultV1 = {
  beforeLevels: [DebateAngerPhaseCrumbleLevelV1, DebateAngerPhaseCrumbleLevelV1];
  beforeFlags: [boolean, boolean];
  afterLevels: [DebateAngerPhaseCrumbleLevelV1, DebateAngerPhaseCrumbleLevelV1];
  afterFlags: [boolean, boolean];
  teams: [DebateAngerPhaseCrumbleTeamV1, DebateAngerPhaseCrumbleTeamV1];
  anyCrumbled: boolean;
};
```

所有 pair 和 teams 均按队伍0、1排列。hp 是第2遍入场及连打结束后的值；unboundedLevel 是向零截断后的未clamp整数，computedLevel 才是截断到0..3的等级。changed 精确等于 computedLevel≠previousLevel；afterFlag=previousFlag或changed。afterLevels 保存实际最终等级，等于两队 computedLevel。

anyCrumbled 是 `afterFlags[0] || afterFlags[1]`，不是 `teams.some(changed)`。即使没有任何等级变化，旧 sticky true 也能使其为true；此返回值不控制 winner 或 outcome。第一遍终局时此结构为null，不伪造 changed=false 的两队记录，也不重新计算其 anyCrumbled。

### 4.5 draw 审计与跨遍偏移

```ts
type DebateAngerPhaseDrawUseV1 = {
  globalIndex: number;
  pass: DebateAngerPhasePassNumberV1;
  passDrawIndex: number;
  draw: DebateAngerPhaseRawDrawV1;
};
type DebateAngerPhasePassDrawAuditV1 = {
  pass: DebateAngerPhasePassNumberV1;
  globalStartIndex: number;
  globalEndIndexExclusive: number;
  suppliedCount: number;
  consumedCount: number;
  consumed: DebateAngerPhaseDrawUseV1[];
};
type DebateAngerPhaseDrawAuditV1 = {
  suppliedCounts: [number, number];
  executedPasses: DebateAngerPhasePassNumberV1;
  consumedCount: number;
  consumed: DebateAngerPhaseDrawUseV1[];
};
```

主 drawAudit.suppliedCounts 永远记录输入的两份长度，即使第二遍未执行；成功的早停结果中第二项必为0。executedPasses 是实际遍数1或2，等于 passes.length，不是命中次数。主 consumed 按第1遍然后第2遍的实际命中连续排列，globalIndex 从0连续编号；consumedCount=consumed.length，成功时也等于两项 suppliedCounts 的总和。

每遍 globalStartIndex 是本遍开始时已经消费的总数，globalEndIndexExclusive 是本遍结束总数，因此 consumedCount=end−start=consumed.length=suppliedCount。没有 combo 或实际零命中时 start=end，consumed 为空；第2遍仍可从0开始，不能强行按“四条预留”把它从4起编号。

每项 passDrawIndex 从该遍0起，指向原 `passDraws[pass−1]`，亦与嵌套 comboReceipt 的 consumedDraws 下标、命中 drawIndex 一致；globalIndex=globalStartIndex+passDrawIndex。draw 是该条记录的分离副本。paper 例子若两遍各消费4条，则第1遍全局索引0..3、第2遍4..7，但两遍各自的 passDrawIndex 都是0..3；这只是字段映射，不是执行记录。

本文第2、4、5、6节覆盖全部33个新增公开类型别名。Pair、Frozen、Mutable 等实现辅助类型不公开；旧组件的 receipt、policy 与 failure reason 类型保持原合同，不在本外层重新定义。

## 5. 固定政策与证据

DebateAngerPhasePolicyV1 与 DebateAngerPhaseEvidenceV1 是实现固定 POLICY/EVIDENCE 对象的递归 readonly 类型，不是可以自由扩展的设置。完整逐字段字面量保留在[来源账本](../sources/debate-anger-phase-v1.json)及[实现](../../packages/engine/src/debate-anger-phase.ts)中；本节说明其全部顶层键与固定含义，不以文字摘要替代输入必须匹配的完整对象。

### 5.1 完整政策身份与所有顶层键

| policy 顶层键 | 固定值或约束含义 |
|---|---|
| id | `debate-anger-phase-bounded-two-pass-policy-v1` |
| profile | `debate-anger-phase-reference-v1` |
| dependencies | entryProfile=`debate-anger-entry-reference-v1`、entryPolicyId=`debate-anger-entry-single-pass-policy-v1`；comboProfile=`debate-timid-combo-reference-v1`、comboPolicyId=`debate-timid-combo-fresh-pending-policy-v1`；调用既有公共核与其完整导出政策，保留完整嵌套收据 |
| checkpoint | 两队、未判胜、初始HP1..1000、内部HP−100..1000、既有角色字段、四性格、武力1..100、stress0..100、timer0..4、容量4..7／七槽／码−1..14、失活combo及其保留、两项崩坏数据、队伍攻击力70..227与genericOnly=true；都是工程准入而非完整可达性 |
| ordering | true入场／整次combo／判胜；首次终局直接返回；否则false入场／整次combo／崩坏／判胜；最多两遍，无候选仍继续固定顺序，无连打HP早停、第三遍或稳定循环 |
| winner | 初始−1，对手HP先于先手HP短路检查，阈值≤0；双死来源优先先手；不做胜利分类 |
| crumble | 仅第二次连打之后、第二次判胜之前，按队伍0、1；向零截断后clamp0..3；任意方向等级变化置true，同级保留；返回最终旗标OR；首次终局不计算并保留初始数据 |
| draws | 两份按遍次数组；固定role／bound5／值0..4，每遍至多4；完整验证后才求值；交由连打核精确消费；无combo及跳过第二遍要求空；外层global／pass／local索引；少给或多给原子失败，无RNG实现或原生流声明 |
| audit | 完整初始／最终／每遍快照，一或两遍完整组件收据，实际短路HP测试，崩坏明细或null，按遍偏移和完整平铺draw记录 |
| safety | 封闭schema、安全分离与精确政策；可信Proxy检测必需且缺失即fail closed；拒绝可执行输入；递归冻结、无输入别名；失败仅有校验或带遍次的组件错误代码，无部分状态／收据 |
| capacity | 输入节点4096、深度16、通用数组64、canonical UTF-8字节65536；最多入场2次、连打2次、判胜2次、崩坏1次、提供式draw消费8条 |
| boundary | 有界两遍现代参考组合；仅返回两种pending outcome；不做CanCritical／Critical／Closing、TurnEnd／timer衰减、phase对象／delta／step／view、补牌／再生、人物解析／攻击力推导、非通用hook、RNG／campaign／session／持久化；旧profile不变 |

输入 policies 必须与上述完整固定对象 canonical 相等；键顺序不影响 record 比较，数组内容和顺序影响。安全数据中的缺键、添键、改值都不能变成自定义规则，归 unsupported-policy。两份依赖政策由组件自身导出常量提供，调用者不额外传 entryPolicies 或 comboPolicies，也不能用外层政策替换内层政策。

### 5.2 完整证据身份与所有顶层键

固定来源仓库为 [tankyc/sango_infinity](https://github.com/tankyc/sango_infinity)，commit=`a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef`。evidence 顶层键如下；分组仅为表述，不改变完整字面量中的独立字段：

| evidence 键 | 固定值或所记录的边界 |
|---|---|
| sourceIdentity | `modern-CSharp-translation-not-native-or-PK-or-Vanilla` |
| repository / sourceCommit | 上述仓库URL与固定commit |
| debatePath / debateBlob / debateSha256 | `Project/Assets/Sango/Scripts/Game/Debate/Debate.cs`；blob `0137498d10773cd4596d497083ccdf6a26b3a261`；SHA256 `622789ca8b8b6799a321526dcfb513d6622adf5b5d54025175c2a7795ef7da28` |
| phasePath / phaseBlob / phaseSha256 | `Project/Assets/Sango/Scripts/Game/Debate/DebatePhase.cs`；blob `6aa98f855a5d4d172cde7e8ffc18a141b8a7b587`；SHA256 `5b47f7b6a89d6123a23e7c14f22168e59c9edd549e98d9bc0258d8a55bb9cbf3` |
| sourceAngerPhaseLines | [DebatePhase.cs 333–390](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/DebatePhase.cs#L333-L390) 的两遍调度；其中外围路由不执行 |
| sourceAngerTriggerLines / sourceAngerLines | Debate.cs 1300–1325／1328–1354 的触发与入场，由PR115完整承接 |
| sourceComboAttackLines | Debate.cs 1356–1377 的完整连打，由PR116完整承接 |
| sourceWinnerLines | [Debate.cs 1379–1396](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L1379-L1396) 的先对手后先手判胜 |
| sourceExcludedCriticalLines | Debate.cs 1398–1406，仅记录排除的CanCritical来源，不代表实现 |
| sourceCalcAngeringLines | Debate.cs 1483–1517，既有候选和反制规则 |
| sourceCrumbleLines | [Debate.cs 1520–1531](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L1520-L1531) 的等级与sticky旗标 |
| entryDependency / comboDependency | `debate-anger-entry-reference-v1`／`debate-timid-combo-reference-v1` |
| phaseEvidence | true入场／整次combo／判胜，再false入场／整次combo／崩坏／判胜 |
| winnerEvidence | 先查对手HP，所以来源双死优先先手，不声明本准入域可到达双死 |
| crumbleEvidence | 向零截断与clamp，等级任意方向变化锁存true，同级保留旧旗标 |
| compressionBoundary | `source-step-ticks-compressed-no-view-or-external-phase-execution`，压缩来源step ticks为纯数据事务，不执行表现或外部phase |
| initialCheckpointAndGenericAdmission | 明确工程准入，不认证完整来源状态可达性 |
| inputSafetyBudgetsAuditAndReasonNames | 输入安全、资源预算、审计和错误名为工程政策 |
| nativeEquivalent / stockOriginalVerified / pkEquivalent / vanillaEquivalent / completeDebate | 全部为false |
| originalUnresolvedGroups / originalHistoricalSnapshots | 43／45，不因本组合归零 |
| nativeWholeChain | `open` |
| p078 / nativeDeckRegenerationIntegration / nativeRngStream / legacySessionIntegration | 全部为 `excluded` |

evidence 不接收调用者覆盖。source lines 是固定现代文本的定位，不是原生地址、运行日志或本次执行证明。依赖内核的枚举、伤害与移除证据仍以各自完整 evidence 保存在嵌套收据中，不以外层较短来源表替换。

## 6. 全部错误、安全分离与预算

### 6.1 外层27种校验／消费错误与2种组件错误

DebateAngerPhaseValidationFailureReasonV1 恰为下表27种字面值联合；DebateAngerPhaseFailureReasonV1 在其上仅增加 entry-kernel-failure 与 combo-kernel-failure。

| reason | 条件 |
|---|---|
| `unsupported-runtime` | 缺少必需的可信Proxy检测入口，在检查调用者输入前fail closed |
| `input-limit` | 输入节点、深度、通用数组长度、自有键数量或字节预算超限 |
| `malformed-data` | 非JSON式安全结构／数值、非法属性、缺少必需键、顶层非record或未归类内部异常 |
| `unknown-field` | 顶层、角色、combo或draw record有未登记键 |
| `unsupported-profile` | schemaVersion或profile不等于固定值 |
| `unsupported-policy` | 安全分离后的完整policies不匹配固定对象 |
| `invalid-generic-only` | genericOnly不严格等于true |
| `invalid-first-team` | firstTeam不是数字0或1 |
| `invalid-winner` | winner不严格等于数字−1 |
| `invalid-characters` | characters不是恰两项数组 |
| `invalid-character` | 某个角色不是record |
| `invalid-personality` | personality不在四个固定字符串中 |
| `invalid-strength` | strength不符合整数1..100 |
| `invalid-hp` | 初始hp不符合整数1..1000 |
| `invalid-stress` | stress不符合整数0..100 |
| `invalid-anger-timer` | angerTimer不符合整数0..4 |
| `invalid-hand-capacity` | maxCardCount不符合整数4..7 |
| `invalid-hand` | hand不是七项数组或某项不在数字牌码−1..14范围 |
| `invalid-combo` | combo不是record、active不为false、attacker不在−1..1或counter不在0..7 |
| `invalid-crumbled-levels` | crumbledLevels不是两项数组或某项不在整数0..3 |
| `invalid-crumbled` | crumbled不是两项boolean数组 |
| `invalid-resolved-attacks` | resolvedAttacks不是恰两项数组 |
| `invalid-resolved-attack` | 某队攻击力不符合整数70..227 |
| `invalid-pass-draws` | passDraws不是恰两项数组，或某遍不是数组／长度大于4 |
| `invalid-raw-draw` | draw不是record，或role、bound、value不符合固定jitter合同 |
| `draws-without-combo` | 某一已执行遍没有活动combo，却提供了非空且语法合法的draw数组 |
| `unused-second-pass-draws` | 第一次判胜已终局，而第二遍语法合法的draw数组非空 |

```ts
type DebateAngerPhaseValidationFailureV1 = {
  ok: false;
  reason: DebateAngerPhaseValidationFailureReasonV1;
};
type DebateAngerPhaseKernelFailureV1 =
  | {
      ok: false;
      reason: 'entry-kernel-failure';
      pass: DebateAngerPhasePassNumberV1;
      kernelReason: DebateAngerEntryFailureReasonV1;
    }
  | {
      ok: false;
      reason: 'combo-kernel-failure';
      pass: DebateAngerPhasePassNumberV1;
      kernelReason: DebateTimidComboFailureReasonV1;
    };
type DebateAngerPhaseFailureV1 =
  DebateAngerPhaseValidationFailureV1 | DebateAngerPhaseKernelFailureV1;
type DebateAngerPhaseResultV1 =
  DebateAngerPhaseSuccessV1 | DebateAngerPhaseFailureV1;
```

entry-kernel-failure 表示本遍原入场核返回失败，其原 reason 原样保存在 kernelReason；combo-kernel-failure 同理对应原连打核。外层另有对活动 combo.attacker=−1 的防御性检查，也映射为 combo-kernel-failure／invalid-combo；正常失活准入加真实胆小入场不应产生这一检查点。

例如某遍实际连打缺draw时，结果形状为 `{ok:false, reason:'combo-kernel-failure', pass:1或2, kernelReason:'missing-raw-draw'}`；有合法剩余draw时 kernelReason 为 extra-raw-draws。missing-raw-draw／extra-raw-draws 不直接成为外层 reason。其余完整可传播原因分别见[入场核错误合同](debate-anger-entry-v1.md)和[连打核错误合同](debate-timid-combo-v1.md)。

普通外层失败恰为 ok、reason 两字段，包括 draws-without-combo 与 unused-second-pass-draws；不因发生在某一遍而额外附加 pass。只有组件错误联合带 pass 与 kernelReason。所有失败都不含 characters、combo、winner、崩坏状态、receipt、部分draw transcript、错误输入值或内部异常文本。

### 6.2 完整解析顺序与错误优先级

1. 首先检查所需Proxy检测入口；可用才安全分离整个输入并检查预算。危险结构与非法数值在任何领域解析前拒绝。
2. 顶层封闭形状；schemaVersion／profile；完整policies；genericOnly；firstTeam；winner。
3. characters数组形状，然后队伍0、队伍1依次解析。每队先封闭形状，再personality、strength、hp、stress、angerTimer、maxCardCount、hand。
4. combo形状，再active=false、attacker、counter；crumbledLevels数组形状和队伍0／1等级；crumbled完整boolean pair。
5. resolvedAttacks数组形状，再队伍0／1攻击力；passDraws外层pair形状，再第1遍完整数组、随后第2遍完整数组。每遍先判断数组及长度≤4，再从头解析每个draw；每项先封闭形状，再role／bound，最后value。
6. 所有解析成功才调用第1遍入场核、可能的完整连打核。无combo时检查本遍draw为空；真实combo的missing／extra由原核判定并映射。第1遍顺利完成且已终局时，才检查第二遍数组为空；否则执行第2遍。任何后发失败都丢弃前面私有计算结果。

record形状总是先检查未知键，再检查必需键缺失；缺键为malformed-data，不转换成该字段专用原因。安全policies中的任何结构差异整体归unsupported-policy，不按普通DTO的unknown-field处理。

分数、NaN、Infinity、不安全整数、−0、undefined 等被安全分离优先拒绝为malformed-data。例如初始HP=0为invalid-hp，HP=0.5为malformed-data；攻击力228为invalid-resolved-attack，70.5为malformed-data。通用数组长度>64先input-limit；安全的每遍数组长度5..64则invalid-pass-draws，而不是组件extra-raw-draws。

即使第一遍按语义会致死，第2遍draw中的非法值也先报解析错误，不会先发布终局或只报unused-second-pass-draws。第1遍实际缺draw不会借用第二遍的合法条目。已有组件错误先于未到达的后续消费检查；这些规则不额外承诺所有同时含多种危险结构的输入都有跨结构统一错误排序。

### 6.3 安全数据边界与运行时前提

仅接受 Object.prototype 或null原型的普通record、标准Array及受限JSON式标量。record自有字段必须是可枚举的数据属性；数组必须稠密、索引完整、无附加属性，仅正常length属性可非枚举。已经冻结的普通数据也可以输入。

拒绝Proxy、getter/setter、函数、undefined、BigInt、Symbol、Date、自定义原型、循环引用、稀疏数组、符号键、隐藏字段与装饰过的数组。先检查Proxy再反射其原型／属性；仅读取数据描述符，不调用调用者getter、toJSON或自定义iterator。非循环的共享对象引用可以输入，但每次出现独立分离并计预算，不保留其引用身份。

运行时必须能通过可信 `process.getBuiltinModule('node:util').types.isProxy` 取得检测入口。实现初始化时取得该入口；不可用时求值返回unsupported-runtime且不先检查输入，不使用无检测降级。这是调用环境合同，不表示本批已经运行、安装或验证Node／浏览器环境，也不承诺防御已被攻击者改写的运行时内建对象。

### 6.4 固定预算与调用上界

| 项目 | 上限或精确范围 |
|---|---:|
| 外层输入值节点，每次重复引用展开分别计入 | 4096 |
| 外层嵌套深度，根为0 | 16 |
| 通用输入数组长度 | 64 |
| 每个对象的自有键数量 | 4096 |
| 输入canonical UTF-8字节 | 65536 |
| 单个键名或字符串的JavaScript length | 65536 |
| characters／每方hand／passDraws外层 | 恰好2／7／2项 |
| 每遍draw输入／成功消费 | 0..4项 |
| 整笔成功消费draw | 0..8项 |
| 入场调用／连打调用／winner检查 | 最多2／2／2次 |
| 崩坏调用 | 最多1次 |

分离期间累计全部键名和字符串的UTF-8字节，合计不得超过65536；单个length检查用JavaScript UTF-16码元长度。分离后完整canonical JSON再次检查65536字节。record键排序、数组保持原序；预算包括完整policies，对象自有键计数也适用于数组并包含length。

这些是外层输入预算，不是输出收据的统一序列化上限；输出由最多两次既有有限内核、两次判胜与一次两队崩坏定界，不为迁就输入额度而裁掉嵌套收据。子核仍使用自身原有输入安全预算与封闭schema，外层4096／16／65536不改写PR115／PR116的2048／12／32768合同。通用数组64也不取代每遍draw≤4、手牌7和角色2的更窄领域限制。

## 7. 使用范围与静态交付声明

[纸面案例](../../data/scenarios/debate-anger-phase-example-v1.json)的 status 为 paper-only-not-executed，仅为人工来源推导，不是观察到的候选 API 输出。成功案例内的 input 才是完整输入描述；拒绝案例以某个成功输入为底稿、按 replaceFields 改字段或说明 environmentCondition，是纸面配方，不是可直接调用的输入对象。外层包装、id、paperExpected、reasoning、replaceFields 与 environmentCondition 均不能作为 API 顶层扩展字段。选定期望摘要也不等于完整成功 DTO、完整收据或正式可省略字段的合同；所有非runtime错误和成功推导都以可信Proxy检测入口可用为前提。

调用者只有在 ok:true 时才可整体采用返回的角色、combo、winner 与崩坏状态；本核不自动回写任何 session。`terminal-pending-classification` 不是已执行 Critical／Closing，`turn-end-pending` 也不是已执行 `TurnEnd`。timer 不递减，firstTeam 不重排，话题不刷新，随机话题不生成；胆小／莽撞新设的timer仍为1，冷静／刚胆仍为4。

没有 create、inspect、preview、execute-round、save、load、replay 或完整舌战入口。完整愤怒阶段路由、胜利分类、回合结束、愤怒中一般出牌、补牌／卡组重建、人物与性格解析、攻击力推导、人物专属伤害 hook、AI、开场／追击／留情和 campaign 均不由本事务实现。P078及其全部依赖继续排除。

旧九个 session profile、既有政策与存档合同，以及 PR115／PR116 等此前独立内核均保持不变；没有第十个 session profile、隐式迁移或对既有 regenerated session 怒线限制的放宽。新的独立函数及其类型不代表旧类型发生修改。

证据仅来自固定现代 C# 转录参考，不是 native、stock original、PK 或 Vanilla 等价证明。43个原始证据主题／45个历史快照仍开放，native whole chain 仍未闭合。本事务扩大的是明确限定的现代参考组合范围，不把范围外链路标成完成。

本批只做固定源码静态阅读、文本编写与纸面推导；未运行测试、编译器、typecheck、build、validator、checker、诊断、项目、来源代码、候选 API、示例、scenario 或 replay。文档与导出存在不构成运行时兼容、测试通过、验收、发布或合并证明。
