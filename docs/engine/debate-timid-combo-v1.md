# 独立胆小连打 API v1

[规则与来源边界](../rules/debate-timid-combo-v1.md) · [固定政策与证据](../sources/debate-timid-combo-v1.json) · [独立纸面案例，未运行](../../data/scenarios/debate-timid-combo-example-v1.json)。

实现入口为 [debate-timid-combo.ts](../../packages/engine/src/debate-timid-combo.ts)，公共导出见 [engine index](../../packages/engine/src/index.ts)。本页仅描述固定现代 C# 参考中，从调用者给定的全新胆小待处理检查点开始、一次完整 `ComboAttack()` 的独立求值；不是完整愤怒阶段、回合或 session。

角色继续使用既有愤怒入场组件的完整双人形状。攻击方性格必须为 timid、angerTimer=1，combo 必须 active=true、attacker 为队伍0或1、counter=0。调用者还必须提供已解析攻击力、genericOnly=true 与恰够实际命中的原始抖动记录。本核不重新运行入场、不查询人物、不生成随机、不补牌、不衰减 timer，也不依据 HP 提前终止或判胜。

## 1. 公开入口、结果与不变性

唯一公开函数与两个公开常量为：

```ts
evaluateDebateTimidCombo(input: unknown): DebateTimidComboResultV1
DEBATE_TIMID_COMBO_POLICY_V1: DebateTimidComboPolicyV1
DEBATE_TIMID_COMBO_EVIDENCE_V1: DebateTimidComboEvidenceV1
```

结果的全部顶层字段为：

```ts
type DebateTimidComboFailureV1 = {
  ok: false;
  reason: DebateTimidComboFailureReasonV1;
};
type DebateTimidComboResultV1 =
  | {
      ok: true;
      characters: [DebateTimidComboCharacterV1, DebateTimidComboCharacterV1];
      combo: DebateTimidComboComboV1;
      receipt: DebateTimidComboReceiptV1;
    }
  | DebateTimidComboFailureV1;
```

复合 DTO 的公开类型均递归 readonly；以下结构展示省略 readonly 噪声。成功和失败结果、嵌套状态、收据以及两个常量均递归冻结。输入先安全分离，再在私有数据上解析、求值；不会修改或冻结调用者对象，也不会将输入对象引用带到输出。

成功的 characters、combo 与 receipt.after 中对应字段值相同，但不提供对象身份相同的合同。失败恰为 `{ ok:false, reason }`，不含部分状态、已消费随机记录、收据、索引或错误位置。少给或多给 raw draw，即使已经在私有状态中计算过若干击，也只返回原子失败。

每次调用都是独立求值，不推进隐藏 session、不记住上次的 RNG 游标。把成功返回的 combo 直接作为下一次输入会因 active=false 而不满足本版本的全新待处理准入域。

## 2. 完整输入合同

输入是 JSON 式数据值，不是序列化 JSON 字符串；顶层恰有以下八个必需字段：

```ts
type DebateTimidComboTeamV1 = 0 | 1;
type DebateTimidComboPersonalityV1 = 'timid' | 'calm' | 'bold' | 'reckless';
type DebateTimidComboCardCodeV1 =
  -1 | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14;
type DebateTimidComboHandV1 = [
  DebateTimidComboCardCodeV1, DebateTimidComboCardCodeV1,
  DebateTimidComboCardCodeV1, DebateTimidComboCardCodeV1,
  DebateTimidComboCardCodeV1, DebateTimidComboCardCodeV1,
  DebateTimidComboCardCodeV1
];
type DebateTimidComboCharacterV1 = {
  personality: DebateTimidComboPersonalityV1;
  strength: number;
  hp: number;
  stress: number;
  angerTimer: number;
  maxCardCount: 4 | 5 | 6 | 7;
  hand: DebateTimidComboHandV1;
};
type DebateTimidComboComboV1 = {
  active: boolean;
  attacker: DebateTimidComboTeamV1;
  counter: number;
};
type DebateTimidComboPendingComboV1 = {
  active: true;
  attacker: DebateTimidComboTeamV1;
  counter: 0;
};
type DebateTimidComboRawDrawV1 = {
  role: 'debate-timid-combo-jitter';
  bound: 5;
  value: number;
};
type DebateTimidComboInputV1 = {
  schemaVersion: 1;
  profile: 'debate-timid-combo-reference-v1';
  policies: DebateTimidComboPolicyV1;
  genericOnly: true;
  characters: [DebateTimidComboCharacterV1, DebateTimidComboCharacterV1];
  combo: DebateTimidComboPendingComboV1;
  resolvedAttack: number;
  rawDraws: DebateTimidComboRawDrawV1[];
};
```

characters[0]、[1] 始终分别为队伍0、1，攻击方为 combo.attacker，对手为另一队。resolvedAttack 是唯一一份本次攻击方攻击力，不是双人数组，也不是人物武力 strength；本 API 的 Character 不含 attack 字段。对方完整角色必须提供，即使其性格、武力、手牌不参与伤害公式。

| 字段 | 必须提供的值或范围 |
|---|---|
| schemaVersion / profile | 精确为1 / `debate-timid-combo-reference-v1` |
| policies | 与完整固定政策逐值一致，不只是 id |
| genericOnly | 精确为 boolean true |
| characters | 恰好两项完整角色 record |
| personality | timid（胆小）、calm（冷静）、bold（刚胆）、reckless（莽撞）之一 |
| strength | 已解析有效武力，整数1..100；本次保留而不参与公式 |
| hp / stress | 整数−100..1000 / 0..100 |
| angerTimer | 整数0..4；攻击方另要求恰为1 |
| maxCardCount | 整数4..7，定义有效物理前缀长度 |
| hand | 恰好7项，每项为整数−1..14 |
| combo.active / attacker / counter | 恰为 true / 数字0或1 / 数字0 |
| resolvedAttack | 已解析攻击方攻击力，整数70..227 |
| rawDraws | 稠密数组；安全语法长度0..64，成功时恰等于实际命中次数0..4 |
| 每项 rawDraw | 恰有 role、bound、value；role 为上述固定字符串、bound=5、value 为整数0..4 |

所有数值必须是安全整数且不是−0，不进行字符串、真假值或分数转换。无默认字段；不接受 firstTeam、topic、canReflect、seed、RNG 回调、人物 id、evidence、receipt、winner 或 phase。当前愤怒胆小分支的 topicCoef 恒为10，不需要输入当前话题。

准入范围是明确的工程合同，不证明外部历史、所有现代源码／MOD 状态或原生状态的可达性。genericOnly=true 是调用者对本次使用通用 identity 伤害行为的明确断言，不是本核已经查证人物没有专属行为；本核不会计算或应用 ModifyAttack／ModifyHpDamage 的人物覆盖。

### 2.1 七个物理槽与保留范围

hand 是完整七槽 backing array，有效前缀是下标0..maxCardCount−1。−1表示空槽，0为现代再考，1..9为普通话题，10大喝、11诡辩、12无视、13镇静、14激昂。本核只将1..9作为可命中牌，其余合法牌码跳过；下标0没有特例，放在0的普通话题同样可以被打出。

允许−1空槽、重复牌码及有效前缀外的非空槽；−1不等于 JavaScript 稀疏数组空洞，后者拒绝。不会预先排序、压紧、补齐、恢复再考或强制改写下标0。没有命中时，攻击方全部七槽原样保留；对手手牌始终不变。发生实际命中移除时，才按第3节全槽清空和稳定压紧，丢弃前缀外非空槽。

## 3. 一次连打的精确顺序

### 3.1 当前物理下标扫描，不是预选原始牌列表

循环从物理下标 i=0 开始，始终访问当时手牌的 hand[i]，到 i=maxCardCount−1 为止。每次循环结束 i 加1，命中并压紧后也不回退、不重扫原下标；遇到非话题牌只跳过，不消费抖动、不改牌、不递增连打 counter。

每次遇到话题1..9，依次完成：

1. 消费下一项 raw draw，计算通用愤怒胆小 HP 伤害。
2. 从本次请求 HP 伤害计算压力请求，不从实际掉血或普通话题压力表计算。
3. 写对手 HP 并截断，再写对手压力并截断。
4. 移除当前物理槽的这张牌，将全部七槽清空，再把原有效前缀内其余非−1牌按原顺序从下标0连续写回。
5. combo.counter 加1，然后循环下标继续加1。

移除按当前物理槽，不是按牌码重新寻找第一张；重复牌只移除本击所在的那一张。压紧可能让尚未读取的牌移动到已经越过的位置，所以一次连打不一定打完初始手中的所有普通牌。不得用预筛选普通牌、倒序移除或“命中后保持 i 不变”来替代。

纸面例子：容量7、初始手牌 `[1,2,3,4,5,6,7]` 时，按来源顺序命中的是原始槽0、2、4、6的牌1、3、5、7，对应实际访问并命中的当前槽0、1、2、3；其余普通牌留在结果手牌中。这只是静态推导，未执行示例或候选 API。

最多扫描7次、最多实际命中4次。每次命中既消耗一个当前槽，又让后继牌左移，而循环索引仍前进；这是容量≤7下的循环结构上界，不是“打四次后强行 break”的另加规则。即使目标 HP 已到0或−100，也继续扫描并完成后续实际命中。

### 3.2 伤害公式、截断和写入

普通牌等级按现代枚举分组：1/4/7为等级0，2/5/8为等级1，3/6/9为等级2；levelCoef 分别为10、15、20。不是把牌码1..3全部视为小牌。

```text
baseAttack = resolvedAttack + jitter
angerCoef = 10
levelCoef = [10, 15, 20][cardLevel]
topicCoef = 10
numerator = baseAttack × angerCoef × levelCoef × topicCoef
preHookHpDamage = truncate(numerator / 1000)
requestedHpDamage = preHookHpDamage       // generic identity hook
requestedStressDamage = truncate(requestedHpDamage / 15)
```

本准入域内等效于 `(resolvedAttack + jitter)` 按牌等级乘以1、1.5或2，再对结果向零截断；整数截断只在完整 HP 公式末尾进行一次，不能先把1.5系数或各中间步骤改为整数。之后另对 HP 请求除以15向零截断。全为正数时向零截断等同向下取整。最大完整分子462000，HP 请求70..462，压力请求4..30，都在安全整数域内。

本核的压力不是 `CalcStressDamage(card)` 的10/15/20固定表，而是本击请求 HP 伤害÷15。HP 写入 `clamp(beforeHp − requestedHpDamage, −100, 1000)` 后，压力写入 `clamp(beforeStress + requestedStressDamage, 0, 100)`；两笔请求分别截断到各自边界。目标已−100 HP时，本击 actualHpDelta 可以为0，但仍计算、记录并写入压力，照常移除牌、递增 counter、消费该击 jitter。

攻击方 HP、stress、timer、personality、strength、maxCardCount 不变；对手只可能变 HP 和 stress。没有一般 Attack 分派、会心、反弹、镇静或激昂反制、人物专属覆盖、再次 CalcAngering、胜负判定或崩坏。

### 3.3 随机输入与完成标记

每次实际命中恰消费一项 `debate-timid-combo-jitter / bound=5 / value=0..4`，按照 hits 的顺序连续消费；扫描非话题或空槽不消费。输入 rawDraws 的全部条目先完成结构与范围解析，之后才求值。缺少某击需要的条目为 missing-raw-draw；扫描完成后仍有合法未消费条目为 extra-raw-draws，均不发布部分结果。

成功时 consumedDraws.length、hits.length、combo.counter 与 suppliedRawDrawCount 相同，范围0..4。raw draw 是调用者提供的外部随机结果描述，不是本核调用 RNG；externalRngConsumed 恒为0，不表示 consumedDraws 必须为空，也不证明原生 RNG 流对齐。

扫描全部有效槽后无条件把 combo.active 设为false，attacker 保留原队伍，counter 为本次实际命中总数。零命中也正常成功完成：active=false、counter=0、scans 仍逐槽记录、hits=[]、consumedDraws=[]，且必须提供 rawDraws=[]。completed=true 只表示这一有界 ComboAttack 已完成，不表示完整愤怒阶段、回合或舌战已结束。

## 4. 完整 receipt 与审计 DTO

### 4.1 主记录和逐槽扫描

```ts
type DebateTimidComboSnapshotV1 = {
  characters: [DebateTimidComboCharacterV1, DebateTimidComboCharacterV1];
  combo: DebateTimidComboComboV1;
};
type DebateTimidComboScanV1 = {
  sequence: number;
  physicalSlot: number;
  card: DebateTimidComboCardCodeV1;
  originalSlot: number | null;
  outcome: 'topic-hit' | 'skip-non-topic';
  hitIndex: number | null;
};
type DebateTimidComboComboTransitionV1 = {
  before: DebateTimidComboComboV1;
  after: DebateTimidComboComboV1;
  completed: true;
  hitCount: number;
};
type DebateTimidComboReceiptV1 = {
  schemaVersion: 1;
  profile: 'debate-timid-combo-reference-v1';
  policy: DebateTimidComboPolicyV1;
  evidence: DebateTimidComboEvidenceV1;
  genericOnly: true;
  resolvedAttack: number;
  attackerTeam: DebateTimidComboTeamV1;
  targetTeam: DebateTimidComboTeamV1;
  before: DebateTimidComboSnapshotV1;
  after: DebateTimidComboSnapshotV1;
  scans: DebateTimidComboScanV1[];
  hits: DebateTimidComboHitV1[];
  comboTransition: DebateTimidComboComboTransitionV1;
  consumedDraws: DebateTimidComboRawDrawV1[];
  suppliedRawDrawCount: number;
  externalRngConsumed: 0;
};
```

输入字段为复数 policies，收据字段为单数 policy。before/after 保存整对角色和三字段 combo；resolvedAttack、genericOnly、攻击方与目标队伍单独记录。snapshot 不包含随机输入游标或攻击力字段。

scans 恰有攻击方 maxCardCount 项，sequence 从0连续编号；每项 physicalSlot 是当时访问的物理下标，也按0..maxCardCount−1递增。topic-hit 的 hitIndex 指向 hits 中该笔，skip-non-topic 的 hitIndex=null。扫描中出现空槽时 card=−1、originalSlot=null；非空条目的 originalSlot 为本次调用开始时的原始槽位置。

originalSlot 是额外审计身份，只在这一次求值内追踪初始七槽中的牌；不会参与打牌决策、不改变来源循环，不是跨调用持久 occurrence id。被压紧移到已扫描位置的牌可能不再出现在后续 scans，不能补造其“跳过”扫描。其去向由 removal.survivors 与 after.hand 解释。

### 4.2 每击算术、写入与移除

```ts
type DebateTimidComboHpTransitionV1 = {
  sequence: number;
  team: DebateTimidComboTeamV1;
  beforeHp: number;
  requestedHpDelta: number;
  afterHp: number;
  actualHpDelta: number;
};
type DebateTimidComboStressTransitionV1 = {
  sequence: number;
  team: DebateTimidComboTeamV1;
  beforeStress: number;
  requestedStressDelta: number;
  afterStress: number;
  actualStressDelta: number;
};
type DebateTimidComboRemovalV1 = {
  team: DebateTimidComboTeamV1;
  card: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
  physicalSlot: number;
  originalSlot: number;
  maxCardCount: 4 | 5 | 6 | 7;
  beforeHand: DebateTimidComboHandV1;
  afterHand: DebateTimidComboHandV1;
  survivors: {
    card: DebateTimidComboCardCodeV1;
    fromSlot: number;
    toSlot: number;
    originalSlot: number;
  }[];
  discardedInactive: {
    card: DebateTimidComboCardCodeV1;
    physicalSlot: number;
    originalSlot: number;
  }[];
};
type DebateTimidComboHitV1 = {
  sequence: number;
  attackerTeam: DebateTimidComboTeamV1;
  targetTeam: DebateTimidComboTeamV1;
  physicalSlot: number;
  originalSlot: number;
  card: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
  cardLevel: 0 | 1 | 2;
  drawIndex: number;
  draw: DebateTimidComboRawDrawV1;
  arithmetic: {
    resolvedAttack: number;
    jitter: number;
    baseAttack: number;
    angerCoef: 10;
    levelCoef: 10 | 15 | 20;
    topicCoef: 10;
    numerator: number;
    divisor: 1000;
    preHookHpDamage: number;
    hook: 'generic-identity';
  };
  requestedHpDamage: number;
  requestedStressDamage: number;
  hp: DebateTimidComboHpTransitionV1;
  stress: DebateTimidComboStressTransitionV1;
  removal: DebateTimidComboRemovalV1;
  counterBefore: number;
  counterAfter: number;
};
```

hits 按真实命中顺序从 sequence=0连续编号，不按原始槽排序后重新播放。每击 drawIndex 指向输入 rawDraws 与 receipt.consumedDraws 的同一项；draw 为该记录的 detached 数据。rawDraws 本身没有调用者可填写的 sequence、drawIndex 或 physicalSlot。

requestedHpDamage 与 requestedStressDamage 为正伤害量；hp.requestedHpDelta 是负 HP 请求，stress.requestedStressDelta 是正压力请求。actualHpDelta=afterHp−beforeHp，actualStressDelta=afterStress−beforeStress；即使实际变化为0也保留记录。hp/stress 的 team 是 targetTeam，removal.team 是 attackerTeam，不可混用。

hp/stress 的 sequence 共享一条全局写入编号：第 n 击（hits[n]）的 HP sequence=2n、压力 sequence=2n+1，依次为0..7以内的 HP、压力交替顺序；不是各自独立从0计数，也不是直接复制 hit.sequence。receipt 不另外提供平铺的 hpTransitions 或 stressTransitions 数组。

removal.physicalSlot 是本击移除前当前手牌的槽；originalSlot 为它在初始手牌中的槽，两者可不同。beforeHand/afterHand 是该次移除前后完整七槽，不是整个调用的初始／最终手牌。survivors 按当前 fromSlot 递增，toSlot 从0连续编号，originalSlot 沿之前的压紧保留；其中不含−1。discardedInactive 只列该次移除前在有效前缀外且非−1的原槽，按 physicalSlot 递增。这些丢弃不是额外命中，不消费 draw、不产生伤害、不增加 counter。

第一次实际移除会清除攻击方所有前缀外槽；之后的移除不会再有 inactive 丢弃，因为本核不加牌。全程零命中时不发生任何清空，前缀外状态也保留。counterBefore 为本击前计数，counterAfter=counterBefore+1；不以扫描次数计数。

以上结构及第5、6节覆盖全部22个公开类型别名；没有单独公开 TopicCard 或 Origins 类型。Hit 与 Removal 的 card 明确窄化为1..9，其他牌码仍可出现在完整手牌、扫描、幸存者和丢弃条目中。

## 5. 固定政策与证据常量

DebateTimidComboPolicyV1 和 DebateTimidComboEvidenceV1 是实现固定 POLICY/EVIDENCE 对象的递归 readonly 类型，不是可扩展设置。完整字面量保留在[来源账本](../sources/debate-timid-combo-v1.json)与[实现](../../packages/engine/src/debate-timid-combo.ts)中；调用者应使用完整固定政策，不能只交 id、改某项语义或添加扩展键。record 键顺序不影响 canonical 比较，数组内容与顺序影响。

政策 id 精确为 `debate-timid-combo-fresh-pending-policy-v1`，profile 为 `debate-timid-combo-reference-v1`。全部顶层键为 `id, profile, checkpoint, combo, hand, scan, damage, draws, audit, safety, capacity, boundary`；安全结构中任何值缺失、增加或变更都不能成为新的可选设置，而会导致 unsupported-policy。

政策锁定全新 timid/timer1 检查点、当前物理槽前向循环、命中后全槽清空与有效前缀稳定压紧、每命中一项 jitter、完整整数伤害公式、请求伤害÷15压力、HP先于压力、无早停和最终 active=false，并固定输入安全预算和无 session 边界。严格 DTO、准入范围、安全分离、错误、审计与不可变输出是工程合同，不冒充原生 JSON API。

证据固定于现代 C# 转录仓库 tankyc/sango_infinity，commit `a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef`；Debate.cs blob=`0137498d10773cd4596d497083ccdf6a26b3a261`，DebateEnum.cs blob=`5b46a8ac87613193eb9f4b99a25e489ba6f5e483`。主要固定来源：

- [Debate.cs 1356–1377](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L1356-L1377)：ComboAttack 当前槽前向循环、只打话题牌、请求 HP÷15压力、HP／压力写入、移除、计数及最终关闭 combo。
- [Debate.cs 1145–1196](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L1145-L1196)：CalcHpDamage 的 topicCoef、levelCoef、angerCoef、RandInt(5)、完整末尾整数除法与最终人物 hook；本核只取已明确声明的 generic identity 子域。
- [Debate.cs 447–466](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L447-L466)：按物理槽读取、移除后全七槽清空和有效前缀非空幸存者压紧。
- [Debate.cs 512–534](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L512-L534)：HP／压力独立 clamp 写入。
- [Debate.cs 875–893](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L875-L893)：话题牌等级；[1328–1354](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L1328-L1354)：胆小入场设置 comboAttacker、counter=0、combo=true，仅说明本核的输入边界，不重新执行入场。

其余具名 source Lines、人物 hook 限制与工程边界以完整 evidence 为准。输入不能注入或改写 evidence。没有原生、stock original、PK 或 Vanilla 等价认证；43证据主题／45历史快照仍开放，native whole chain 不闭合。P078及其全部依赖、原生卡组重建和 RNG 流接入均排除。

## 6. 全部错误、安全分离与预算

### 6.1 封闭失败原因

DebateTimidComboFailureReasonV1 恰为下列23种 reason 的字面值联合：

| reason | 条件 |
|---|---|
| `unsupported-runtime` | 取得必需的安全 Proxy 检测入口失败，在检查输入前 fail closed |
| `input-limit` | 值节点、深度、通用数组长度、对象自有键数量或字节预算超限 |
| `malformed-data` | 非法 JSON 式结构／数值、非法属性、缺少必需字段、顶层非 record 或未归类内部异常 |
| `unknown-field` | 顶层、角色、combo 或 raw draw record 出现未登记键 |
| `unsupported-profile` | schemaVersion 或 profile 不等于固定值 |
| `unsupported-policy` | 安全分离后的完整 policies 与固定对象不匹配 |
| `invalid-generic-only` | genericOnly 不严格等于 true |
| `invalid-characters` | characters 不是数组或长度不是2 |
| `invalid-character` | characters 中某项不是 record |
| `invalid-personality` | personality 不为四种固定字符串之一 |
| `invalid-strength` | strength 类型或范围不符合整数1..100 |
| `invalid-hp` | hp 类型或范围不符合整数−100..1000 |
| `invalid-stress` | stress 类型或范围不符合整数0..100 |
| `invalid-anger-timer` | angerTimer 类型或范围不符合整数0..4 |
| `invalid-hand-capacity` | maxCardCount 类型或范围不符合整数4..7 |
| `invalid-hand` | hand 不是七项数组，或某项不是范围−1..14的数字牌码 |
| `invalid-combo` | combo 非 record 或不满足 active=true、attacker为0或1、counter=0 |
| `invalid-resolved-attack` | resolvedAttack 类型或范围不符合整数70..227 |
| `invalid-raw-draws` | rawDraws 不是数组 |
| `invalid-raw-draw` | 某项不是 record，或 role、bound、value 不符合固定 jitter 合同 |
| `invalid-attacker-checkpoint` | 合法 combo 指向的角色不是 timid，或其 angerTimer 不为1 |
| `missing-raw-draw` | 实际命中时没有下一项已解析的 raw draw |
| `extra-raw-draws` | 所有槽扫描完成后仍有未消费的合法 raw draw |

安全分离先于领域检查，因此分数、NaN、Infinity、不安全整数、−0、undefined 等先为 malformed-data。例如 resolvedAttack=228 是 invalid-resolved-attack，而70.5是 malformed-data。缺少必需键总是 malformed-data，不改为字段专用错误。object 形状检查先未知键、再缺失键；policies 内安全但不匹配的键值结构整体归 unsupported-policy，不按普通 DTO 的 unknown-field 处理。

静态解析顺序为：安全分离整个输入；顶层形状；schema/profile；完整 policies；genericOnly；characters 数组形状；队伍0再队伍1的角色；combo；resolvedAttack；rawDraws 数组形状及从头到尾每项记录。每个角色依次检查形状、personality、strength、hp、stress、angerTimer、maxCardCount、hand。combo 先形状，再共同要求 active=true与counter=0，最后检查 attacker；每项 draw 先形状，再 role/bound，最后 value。全部解析后才检查所指攻击方 timid/timer1，再逐槽求值、逐击检查 missing，全部扫描及私有状态关闭 combo 后检查 extra。此顺序不另行承诺所有同时含多种危险结构的输入都有跨结构统一错误优先级。

所有 rawDraws 条目均在跨字段攻击方准入与任何命中求值之前解析；因此不会因零命中就忽略非法 draw，也不会让未消费的非法记录只得到 extra-raw-draws。安全语法层允许最多64项，但任何成功结果最多实际消费4项；第5项以后不是 silently ignored。

没有 invalid-first-team、invalid-can-reflect、终局拒绝、整段连打恢复或一般 session 错误。零命中是成功，不是 missing-raw-draw；只要给出空 rawDraws，就能完成并关闭 pending flag。所有失败均不含部分状态或调用者私有字段值。

### 6.2 不执行调用者代码的输入边界

只接收 Object.prototype 或 null 原型的普通 record、标准稠密 Array，以及受限 JSON 式标量。record 的自有字段必须为可枚举数据属性；数组必须索引完整、无附加属性，只有普通 length 属性可非枚举。已冻结的普通数据可以输入。

拒绝 Proxy、getter/setter、函数、undefined、BigInt、Symbol、Date、自定义原型、循环引用、稀疏数组、符号键、隐藏字段及装饰过的数组。读取数据描述符，不调用用户 getter、toJSON 或自定义 iterator；Proxy 在对其原型和属性反射前拒绝。非循环的共享对象引用可接收，但每次出现独立分离、独立计预算，不保留输入引用身份。

运行时必须提供可信 `process.getBuiltinModule('node:util').types.isProxy`。取不到时 unsupported-runtime，且不先检查输入，不作无检测降级。此处是运行时合同，不表示本批已运行、安装或验证了某个 Node／浏览器环境。

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
| scans | 恰为攻击方 maxCardCount，4..7项 |
| hits / 实际移除／成功消费 draw | 0..4项 |
| 每击 HP／压力写入 | 各1笔，先 HP 后压力 |

分离期间累计所有键名和字符串的 UTF-8 字节，合计最多32768；单个 length 检查为 JavaScript UTF-16 码元长度。分离后完整 canonical JSON 再检查32768字节，canonical record 按键排序、数组保留顺序。输入预算包含完整 policies；对象自有键计数对数组也包含 length。

这些是输入预算，不是返回值统一序列化额度；输出由两名角色、至多7次扫描和4击审计定界，不裁掉收据来迁就输入额度。通用数组64不取代 characters=2、hand=7和成功 draw≤4的领域限制。没有存档、回放次数、种子或原生 RNG 流预算，因为本组件没有对应接口。

## 7. 使用范围与静态交付声明

[纸面案例](../../data/scenarios/debate-timid-combo-example-v1.json)是独立阅读材料，不是 API 执行结果。外层有 schemaVersion、id、status、method、expectedFields、successCases、rejectionCases、exclusions；status 为 paper-only-not-executed。每个案例的 input 才是直接 API 输入，id 与 paperExpected 不可传入函数；拒绝案例的 input 本来就用于展示不符合合同的输入。

paperExpected 是选定概念摘要，不是完整成功 DTO 或 receipt：hitCount 对应 receipt.hits.length／comboTransition.hitCount；scanCards 对应 scans 各项的 card；hitOriginalSlots 对应 hits 各项的 originalSlot；requestedHpDamage 与 requestedStressDamage 在摘要里是数组，而正式 hits 每项中是一个数字；attackerAfterHand、targetAfterHp、targetAfterStress 从结果角色中读取，正式 receipt 没有这些同名顶层字段。targetHpAfterEach、targetActualHpDelta、targetStressAfterEach、targetActualStressDelta 是逐击嵌套 writer 字段的汇总，并非额外写入。摘要中的 combo 描述预期完成状态，不替代 receipt.comboTransition 的完整结构。

外层包装、人工期望及推导文字都不是可添加到输入或 receipt 的扩展字段；成功摘要可以只写所关注的字段，省略不表示正式 DTO 可缺字段。拒绝案例的 paperExpected 即使写为 `{ok:false, reason}`，也是纸面期望而不是观察到的函数返回。纸面推导不得称作运行断言、回放输出或测试通过。

调用者只有在 ok:true 时才可采用整对 characters 和 combo；本组件不自动回写任一 session。独立愤怒入场组件的输出需满足本核 fresh pending/timid/timer1 条件，并由调用者另外明确提供 resolvedAttack、genericOnly 与 rawDraws，才在本组件准入域内；这不表示两者已接入完整阶段或新增 save profile。

没有 create、inspect、preview、execute-round、save、load、replay 或完整愤怒阶段入口。不做另一次 CalcAngering、timer衰减、胜负／崩坏／回合末顺序、补牌／卡组再生、AI选牌、专属人物行为、开场／追击／留情或 campaign。P078及其全部依赖仍排除。

旧九个 session profile、政策、存档及此前独立内核均不变，无隐式迁移；原有 regenerated session 的怒线限制不因这个独立连打组件而放宽。本交付不声称完整现代舌战完成，更不声称原生 PK／Vanilla 等价。

本批只做固定源码静态阅读、文本编写与纸面推导；未运行测试、编译器、typecheck、build、validator、checker、诊断、项目、来源代码、候选 API、示例或 replay。文档与导出存在不构成运行时兼容、测试通过、验收、发布或合并证明。
