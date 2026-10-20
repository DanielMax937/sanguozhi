# 普通话题牌 + 大喝 + 无视 + 镇静 + 激昂 + 诡辩独立舌战 API v1

[规则、固定来源与未运行纸面边界](../rules/sophistry-debate-session-v1.md) · [全部政策/证据字面值及来源身份](../sources/sophistry-debate-session-v1.json) · [七轮接纳及第八轮拒绝的纸面场景，未运行](../../data/scenarios/sophistry-debate-example-v1.json)。

实现入口为 [sophistry-debate.ts](../../packages/engine/src/sophistry-debate.ts)，公共导出见 [engine index](../../packages/engine/src/index.ts)。独立 profile=`debate-topic-shout-ignore-compose-agitate-sophistry-reference-v1`、tag=`sophistry-debate-session-v1`；不修改或隐式迁移旧 topic-only、Shout、Ignore、Compose 或 Agitate 五种 session。本文诡辩指 `sophistry`。本 profile 明确仅覆盖非教程模式；没有 tutorial 参数、默认分支或可切换的教程选项。

## 1. 七个公开函数

全部参数按 unknown 处理并严格校验；全部成功/失败输出和常量递归深冻结，不修改外部输入。

| 函数 | 参数 | 成功值 |
|---|---|---|
| `createSophistryDebate` | scenario | `{ok:true,session}` |
| `inspectSophistryDebate` | 完整 session | `{ok:true,inspection:{snapshot,policy,evidence,entryCount,remainingEntryCapacity,canonicalUtf8Bytes}}` |
| `previewSophistryDebateRound` | 完整 session, command | `{ok:true,preview:{receipt,projectedSnapshot,policy,evidence,externalRngConsumed:0}}` |
| `executeSophistryDebateRound` | 完整 session, command | `{ok:true,session,receipt}` |
| `saveSophistryDebate` | 完整 session | `{ok:true,json}` |
| `loadSophistryDebate` | JSON 字符串 | `{ok:true,session}` |
| `replaySophistryDebate` | scenario, commands 数组 | `{ok:true,session}` |

常量为 `SOPHISTRY_DEBATE_POLICY_V1:SophistryDebatePolicyV1`、`SOPHISTRY_DEBATE_EVIDENCE_V1:SophistryDebateEvidenceV1`。全部失败统一 `{ok:false,reason,index}`，无 partial session 或失败 receipt。

preview/execute 有 Round 后缀，没有无后缀别名。preview 同样完整重算输入、执行拟议 append 及预算，只返回 receipt/projectedSnapshot，不提交日志或返回拟议 session。inspect 不是只读展示字段，也会完整重算。replay 是公开 API 名称，不表示本批实际调用过它。

## 2. 公开 DTO 全字段

复合类型均为递归 readonly；本文 `Pair<T>` 仅表示恰好两项的保序 tuple，不是额外导出。所有 number 都是安全整数且不为 −0。

### 2.1 卡牌、scenario、participant

| 导出类型 | 完整结构/域 |
|---|---|
| `SophistryDebateTopicV1` | `'story' \| 'logic' \| 'trend'` |
| `SophistryDebateLevelV1` | `'small' \| 'medium' \| 'large'` |
| `SophistryDebateTopicCardV1` | `{kind:'topic',topic:SophistryDebateTopicV1,level:SophistryDebateLevelV1}` |
| `SophistryDebateShoutCardV1` | `{kind:'shout'}` |
| `SophistryDebateIgnoreCardV1` | `{kind:'ignore'}` |
| `SophistryDebateComposeCardV1` | `{kind:'compose'}` |
| `SophistryDebateAgitateCardV1` | `{kind:'agitate'}` |
| `SophistryDebateSophistryCardV1` | `{kind:'sophistry'}` |
| `SophistryDebateCardV1` | 上述六种 Card 的封闭联合 |
| `SophistryDebateCardOccurrenceV1` | Card 联合加 `{token:string,tapeIndex:number}` |
| `SophistryDebateParticipantV1` | `{id:string,resolvedIntelligence:number,hp:1000,stress:0,angerTimer:0,cardTape:SophistryDebateCardV1[]}` |
| `SophistryDebateScenarioV1` | `{schemaVersion:1,profile:'debate-topic-shout-ignore-compose-agitate-sophistry-reference-v1',genericOnly:true,difficulty:'source-normal',policies:SophistryDebatePolicyV1,challengerId:string,initialTopic:SophistryDebateTopicV1,participants:Pair<SophistryDebateParticipantV1>}` |

ID 必须匹配 ASCII `[A-Za-z][A-Za-z0-9_-]{0,63}`，两人不同，challengerId 属于其中之一且决定初始 firstId。INT 为 1..100，初始 hp/stress/timer 固定 1000/0/0；不允许人物、物品、性格 hook 或任意中局输入。每方 cardTape 最多 512 项，并须足够初始手牌。occurrence 的 tapeIndex 为 0..511，token 严格由该 participantId 与 tapeIndex 生成。

只接受表内全部必需键，不补默认值。特殊牌不能有 topic/level；缺/未知 kind 或非法 topic/level 为 unsupported-card，普通牌缺字段为 malformed-data，特殊牌多带字段为 unknown-field。模板不带 token；API 生成的 hand occurrence 才带 token 和 tapeIndex。scenario 或 command 不能增加 tutorial、reflection、预计算攻击/伤害、话题抽取结果或任意状态覆盖字段。

### 2.2 snapshot、participant state 与 outcome

`SophistryDebateParticipantStateV1` 全部字段：

| 字段 | 类型/域 |
|---|---|
| id, resolvedIntelligence | string、number，保留 scenario 值 |
| attack | number，双方 INT 重算为 70..227，不接受外部覆盖 |
| hp, stress, angerTimer | number −100..1000、number 0..100、字面量 0 |
| sourceSlotCount, playableHandCapacity | number 4/5/6/7、number 3/4/5/6，INT 阈值 70/80/90 |
| reservedRethinkSlot | 字面量 true，不代表有再考动作 |
| crumbledLevel | number 0..3，非终局重算，终局保留 |
| hand | SophistryDebateCardOccurrenceV1[] |
| deckCursor | number 0..牌带长度，指向下一未发项 |

`SophistryDebateOutcomeV1`=`{kind:'hp-defeat',winnerId:string,loserId:string}`。

`SophistryDebateSnapshotV1`=`{schemaVersion:1,profile:'debate-topic-shout-ignore-compose-agitate-sophistry-reference-v1',revision:number,roundIndex:number,currentTopic:SophistryDebateTopicV1,firstId:string,status:'active'|'finished',outcome:SophistryDebateOutcomeV1|null,participants:Pair<SophistryDebateParticipantStateV1>}`。

初局 revision/roundIndex 为 0，成功每轮各 +1。六类牌共用容量；hand 保序留牌再补空位，不新增诡辩或反射专用槽位。active 成功态 HP>0、stress<100 且 hand 补满；finished 消费本轮两张牌后不补。终局 first/topic 保留轮开始值，终局胜者读 outcome。反射普通牌伤害仍可能导致 HP 终局；镇静与激昂仍不能胜出，无视不减 HP。

### 2.3 command、selection 与分阶段 raw draw

```ts
type SophistryDebateSelectionV1 = { participantId: string; cardToken: string };
type SophistryDebateRawDrawV1 =
  | { role: 'psychological-damage-jitter'; bound: 5; value: number }
  | { role: 'sophistry-topic-reroll'; bound: 3; value: number };
type SophistryDebateCommandV1 = {
  type: 'ResolveSophistryDebateRound';
  expectedRevision: number;
  expectedRoundIndex: number;
  expectedFirstId: string;
  choices: [SophistryDebateSelectionV1, SophistryDebateSelectionV1];
  rawDraws: SophistryDebateRawDrawV1[];
};
```

expected 计数为 0..4096 并匹配 snapshot，first 也须匹配。choices 严格按 scenario 顺序，每方选自己当前 hand 中的 token。token 语法为合法 ID 加冒号及规范十进制 0..999；实际生成索引最多 511，再检查当前 hand 成员资格。不能选择对方、已消费、未发牌或重复 token，不能直接传模板。

rawDraws 最多两项。jitter 的 value 仅 0..4，话题 draw 的 value 仅 0..2，后者固定映射 `0→story,1→logic,2→trend`。如两种都要，顺序严格为 Attack jitter 在前、topic reroll 在后，不能交换；不能以总数正确代替 role/bound/值域正确。

| 比较与结算分支 | Attack draw | 非终局且无 stress100 时的 topic draw | 成功整轮总数 |
|---|---|---|---|
| 普通/大喝胜，双方无诡辩 | jitter 一项 | 无 | 1 |
| 诡辩胜普通牌 | jitter 一项，使用诡辩方 attack 与败方普通牌系数 | 一项 | 2；HP 终局则仅 1 |
| 大喝胜诡辩 | jitter 一项 | 一项，诡辩败方仍触发 | 2；HP 终局则仅 1 |
| 诡辩胜镇静或激昂 | 无 | 一项 | 1 |
| 无视胜，包括败方诡辩 | 无 | 无，被无视抑制 | 0 |
| 任意等 power 平局，包括双诡辩 | 无 | 无 | 0 |

Attack draw 是独立阶段：普通/大喝胜或诡辩反射普通牌伤害才取 jitter。诡辩对镇静/激昂没有 HP Attack，不构造零伤害 jitter。Topic draw 则只在完成 Attack、所有 Effect、HP 终局检查以及非终局 stress 边界之后，才按需要消费。因此不能在 power 比较后预先要求“整轮固定两项”，不能先取一个无用 topic draw 再丢弃。

HP 终局跳过 topic reroll，额外 topic draw 不被容忍。非终局 stress100 先拒绝 unsupported-anger-trigger，不要求随后尚未到达的话题阶段提供 draw；参见 §6.1 的独立第八轮候选。成功路径最后严格核对全部已消费 draw，不接受多余项。平局与无视胜严格空数组。重抽可以得到原 topic；“值没变”仍消费一项，不能改记为 skipped。

全部 draw 都是调用者提供的有限原始整数，不使用全局 RNG、callback、seed 或预计算 power、attack、damage、Effect、winner。preview 的 externalRngConsumed 恒0，不表示它可以省略命令内的必要 draw。完整随机审计及各跳过分支见 §2.6。


### 2.4 play 与 damage

`SophistryDebatePlayV1`=`{participantId:string,card:SophistryDebateCardOccurrenceV1,attack:number,power:number,matchesCurrentTopic:boolean}`。

普通 power 为 1..3/11..13，大喝110、无视120、诡辩20，镇静与激昂均0。特殊牌 matchesCurrentTopic 恒 false；大喝伤害 topicCoefficient 仍12，不能从 false 推为6。诡辩赢所有普通牌及两种零 power 牌，输给大喝/无视；双诡辩平局。任何等 power 都不通过 firstId 破同分。

`SophistryDebateDamageV1` 是以下公共字段与恰一分支的交叉联合。这里 `TopicOccurrence`、`ShoutOccurrence`、`SophistryOccurrence` 仅为文档简写，分别指对应 Card 模板加 `{token:string,tapeIndex:number}`，不是另加的公开类型。

公共字段：

```ts
{
  sourceId: string;
  cardOwnerId: string;
  targetId: string;
  attack: number;
  jitter: number;
  angerCoefficient: 10;
  levelCoefficient: number;
  topicCoefficient: number;
  roundStartTopic: SophistryDebateTopicV1;
  requestedHpDamage: number;
  requestedStress: number;
}
```

分支：

```ts
{ kind: 'topic'; sourceCard: TopicOccurrence; card: TopicOccurrence;
  reflected: false; writer: 'topic-card'; positiveHpGuard: false; writerApplied: true }
{ kind: 'shout'; sourceCard: ShoutOccurrence; card: ShoutOccurrence;
  reflected: false; writer: 'shout'; positiveHpGuard: false; writerApplied: true }
{ kind: 'reflected-topic'; sourceCard: SophistryOccurrence; card: TopicOccurrence;
  reflected: true; writer: 'topic-card'; positiveHpGuard: true; writerApplied: boolean }
```

sourceId 是攻击计算者，不是无条件的系数牌主人；cardOwnerId 是 `card` 的主人，targetId 是实际 HP/stress writer 目标。sourceCard 和 card 都记录完整 occurrence：

- 普通/大喝胜：sourceId=cardOwnerId=胜方，targetId=败方；sourceCard 与 card 为同一胜牌 occurrence。普通 levelCoefficient10/15/20，topicCoefficient 按轮开始话题匹配10、否则6；大喝固定15/12。requestedStress 为对应普通等级10/15/20或大喝15。
- 诡辩胜普通牌：sourceId 为诡辩胜方，sourceCard 为诡辩牌；cardOwnerId=targetId 为普通牌败方，card 为该败方普通牌。使用胜方 attack，却从败方 topic/level 与 roundStartTopic 计算系数及 stress。不是用败方 attack，也不是给诡辩虚构 level，不能因为胜方 matchesCurrentTopic=false 而一律取 topicCoefficient6。
- 反射分支保留 `positiveHpGuard:true`：只在计算的 HP 伤害大于0时调用败方普通牌的反射 writer，HP 与相应 Attack stress 一起受此 guard 约束，writerApplied 记录该条件。当前固定 INT/系数范围给出的伤害为正；DTO 的 boolean 不授权外部注入零伤害或放宽系数。
- 无视胜、任何平局、诡辩胜镇静/激昂均 `damage:null`。后两种零 power 牌不能胜出。不为这些情况构造零系数对象；damage=null 也不等于 result=draw。

攻击值为 `100+trunc(40*(myINT-opponentINT)/(131-myINT))`；HP 请求为 `trunc((attack+jitter)*10*levelCoefficient*topicCoefficient/1000)`。除法向零，内部精确 bigint；power 差、先手与重抽后的话题都不参加本轮伤害计算。


### 2.5 分阶段 stress 与 Effect 审计联合

`SophistryDebateStressStageV1`=`{beforeStress:number,requestedStress:number,afterStress:number,actualStressDelta:number}`。

actualStressDelta 为 after−before。Attack 与每个实际 Effect writer 分别 clamp 到 0..100；requested 允许负数，不等于实际差。

`SophistryDebateEffectV1` 的公共字段仅为：

```ts
{ sequence: 0 | 1; actorId: string; opponentId: string }
```

再与以下恰一分支相交，不能自由混搭：

```ts
{
  status: 'applied'; invoked: true; cardKind: 'compose';
  targetId: string; reflected: boolean;
  requestBasisId: string; requestBasisStress: number;
  requestedStress: number;
  beforeStress: number; afterStress: number; actualStressDelta: number;
}
{
  status: 'applied'; invoked: true; cardKind: 'agitate';
  targetId: string; reflected: boolean;
  requestBasisId: null; requestBasisStress: null;
  requestedStress: 40;
  beforeStress: number; afterStress: number; actualStressDelta: number;
}
{
  status: 'no-additional-effect'; invoked: true;
  cardKind: 'topic' | 'shout' | 'ignore' | 'sophistry';
  targetId: null; reflected: null;
  requestBasisId: null; requestBasisStress: null;
  requestedStress: 0; beforeStress: null; afterStress: null; actualStressDelta: 0;
}
{
  status: 'suppressed-by-ignore'; invoked: false;
  cardKind: 'topic' | 'shout' | 'ignore' | 'compose' | 'agitate' | 'sophistry';
  targetId: null; reflected: null;
  requestBasisId: null; requestBasisStress: null;
  requestedStress: null; beforeStress: null; afterStress: null; actualStressDelta: 0;
}
```

合法规则：

- 有 winner 时固定两个审计槽：sequence0 为 winner、sequence1 为 loser；actorId 是该槽的出牌者，opponentId 是另一个参与者。此顺序独立于 firstId 与 scenario 顺序。
- 普通/大喝/无视/诡辩被调用 Effect 但没有 stress writer：no-additional-effect、invoked=true、请求0、实际0；没有 target，不读取 before/after，也不声称 reflected=false。诡辩的后续 topic reroll 另列于 receipt，不冒充此处的 stress Effect。
- Compose 被调用：requestBasisId 恒等于 opponentId，requestBasisStress 取对手在此 Effect 执行时的当前 stress，计算 `-max(trunc(requestBasisStress/2),30)`。对手未出诡辩时 targetId=opponentId、reflected=false；对手出诡辩时 targetId=actorId、reflected=true。**反射改变 writer 目标，不改变请求依据。** before/after 是实际 target 的 stress，不是 requestBasisStress。即使 target 为0而实际差为0，仍记 applied 和完整负请求。
- Agitate 被调用：请求固定40，requestBasisId/requestBasisStress 均 null。对手未出诡辩时 targetId=actorId、reflected=false；对手出诡辩时 targetId=opponentId、reflected=true。before/after 指实际 target；如90→100，请求仍40、实际差10。不消费额外 jitter。
- Ignore 胜：胜者槽 no-additional-effect，败者槽 suppressed-by-ignore、invoked=false、请求null；target、reflection、request basis、before/after 全为 null，实际0。不计算假想的 −30/+40，也不为败方诡辩预先评估重抽。本新 schema 不沿用旧 profile 对 no-writer/suppressed 槽记录假想 target 的设计。
- 所有平局，包括双诡辩、双镇静、双激昂和镇静/激昂任一顺序：Attack 只对双方各请求 stress+15，effects=[]。没有两条 no-op 记录，不施加 −30 或 +40，也不重抽话题。

镇静/激昂只有作为普通、大喝或诡辩的败牌才能 applied；它们不能赢，对 Ignore 受抑制，彼此零 power 相等无 Effect。所有 Effect 都在 Attack 后、HP 终局检查前；没有“actor 已 HP<=0 就跳过”的门槛。不得提前结束而遗漏败方 writer，也不得将未调用 Effect 的 null 改成“已评估0”。


### 2.6 change、topic reroll 与 receipt

`SophistryDebateChangeV1` 全部字段：

- `participantId:string`。
- `beforeHp:number,afterHp:number,requestedHpDamage:number,actualHpDelta:number`。
- `beforeStress:number,afterStress:number,requestedStress:number,actualStressDelta:number`。
- `attackStress:SophistryDebateStressStageV1,effectStress:SophistryDebateStressStageV1`。
- `beforeCrumbledLevel:number,afterCrumbledLevel:number`。
- `consumedCard:SophistryDebateCardOccurrenceV1,refilledCards:SophistryDebateCardOccurrenceV1[]`。
- `beforeDeckCursor:number,afterDeckCursor:number`。

attackStress 跨越本轮 Attack，effectStress 从 Attack 后到全部 Effect 后；两阶段总是存在，即使没有 writer。change.requestedStress 是两个阶段已评估请求之和；受抑制 Effect 的 null 不加入，effectStress 汇总请求为0。请求按实际 target 归入 change，不能一律按 actor、opponent 或 requestBasisId 归档。整轮实际 stress 差等于两阶段实际差之和，不能用整轮请求和代替各阶段 clamp。

HP 实际差同样为 after−before，请求伤害与 HP−100 下限 clamp 分开。终局 stress 可 clamp100；非终局若最终 stress100 则拒绝，不产生成功 receipt。

`SophistryDebateTopicRerollV1` 为封闭联合：

```ts
{
  status: 'applied'; drawIndex: 0 | 1; rawValue: number;
  beforeTopic: SophistryDebateTopicV1; afterTopic: SophistryDebateTopicV1;
  sophistryOwnerId: string; opponentId: string;
}
{
  status: 'skipped';
  reason: 'terminal' | 'equal-card-power' | 'no-sophistry' | 'opponent-ignore';
}
```

applied 的 rawValue 仅0..2，drawIndex 是该项在 rawDraws/consumedDraws 中的0-based位置：有 Attack jitter 时为1，否则0。beforeTopic/afterTopic 可相同，仍是 applied。sophistryOwnerId 是诡辩牌主人，不必是 roundWinnerId；大喝胜诡辩仍记录败方为 owner。skipped 分支只有 status/reason，不得增添假想 drawIndex/rawValue、null 话题或 owner 字段。只有非终局、非平局、存在诡辩且对手不是 Ignore 才 applied。跳过原因依阶段判断：HP 终局为 terminal；否则平局为 equal-card-power；否则无诡辩为 no-sophistry；存在诡辩且对手为 Ignore 才为 opponent-ignore。因此普通 Ignore 胜普通牌不是 opponent-ignore，而是 no-sophistry。

`SophistryDebateReceiptV1` 全部字段：

| 字段组 | 精确字段与类型 |
|---|---|
| 版本及合同 | schemaVersion:1；profile固定新profile；command:SophistryDebateCommandV1；policy:SophistryDebatePolicyV1；evidence:SophistryDebateEvidenceV1 |
| 计数 | beforeRevision/afterRevision/beforeRoundIndex/afterRoundIndex:number |
| 先手/话题 | beforeFirstId/afterFirstId:string；beforeTopic/afterTopic:SophistryDebateTopicV1 |
| 出牌 | orderedIds:Pair<string>；plays:Pair<SophistryDebatePlayV1> |
| 本轮结果 | result:'winner'\|'draw'；roundWinnerId:string\|null；damage:SophistryDebateDamageV1\|null |
| Effect审计 | effects:SophistryDebateEffectV1[]；effectOrder:'winner-then-loser-audit-slots'\|'none-equal-card-power'；effectSkipReason:'equal-card-power'\|'ignore-suppresses-loser-effect'\|null |
| 写入 | changes:Pair<SophistryDebateChangeV1> |
| 原始随机 | consumedDraws:SophistryDebateRawDrawV1[] |
| Attack随机 | attackDrawCount:0\|1；attackNoDrawReason:'equal-card-power'\|'ignore-no-hp-damage'\|'sophistry-opponent-not-topic'\|null |
| 话题及总随机 | topicDrawCount:0\|1；drawCount:0\|1\|2；topicReroll:SophistryDebateTopicRerollV1 |
| 结束 | terminal:boolean；crumbleEvaluated:boolean；refillApplied:boolean；outcome:SophistryDebateOutcomeV1\|null |

orderedIds 是轮开始 first/other 的记录；plays/changes 是 scenario 顺序；effects 是 winner/loser 审计顺序。三个顺序不能互相替代。无视胜仍 result=winner 且 roundWinnerId 非 null，但 damage=null、attackDrawCount0、attackNoDrawReason=ignore-no-hp-damage、effectSkipReason=ignore-suppresses-loser-effect。平局 roundWinnerId=null、effectOrder=none-equal-card-power、effectSkipReason=equal-card-power。

诡辩胜镇静/激昂的 attackDrawCount0、attackNoDrawReason=sophistry-opponent-not-topic，并不表示整轮无随机：非终局正常推进时 topicDrawCount1、drawCount1。诡辩反射普通伤害或败给大喝时，Attack有一项，故 attackNoDrawReason=null；正常非终局再取一项 topic draw，总数2。总数恒为 attackDrawCount+topicDrawCount，consumedDraws 与成功 command.rawDraws 全字段相同、顺序相同。新 schema **没有旧 receipt 顶层 noDrawReason 字段**；不能把 Attack 的无 draw 原因套在整个回合上。

非终局成功 crumbleEvaluated/refillApplied=true，崩坏按 `clamp(trunc((1000-hp)/250),0,3)` 更新；winner 决定新 firstId。普通胜牌令 currentTopic 跟随胜牌，合条件诡辩重新抽 topic，其他非平局特殊牌胜保持话题，平局保持 first/topic。先完成 HP 终局与 stress 边界检查，才到此话题/先手阶段，再补牌。

终局 crumbleEvaluated/refillApplied=false，refilledCards=[]、cursor 不推进、first/topic 不变，topicDrawCount0、topicReroll={status:'skipped',reason:'terminal'}，但 effects 仍完整：必须先 Attack→Effect，再 HP 终局。败方 HP<=0 后仍可激昂写到 stress100，再返回 HP 终局；非终局同一 stress100 则整轮拒绝。成功终局只消耗必要的 Attack draw，不能额外附带被跳过的话题 draw。


### 2.7 session、genesis 与 entry

| 导出类型 | 完整结构 |
|---|---|
| `SophistryDebateGenesisV1` | `{scenario:SophistryDebateScenarioV1,snapshot:SophistryDebateSnapshotV1}` |
| `SophistryDebateEntryV1` | `{command:SophistryDebateCommandV1,receipt:SophistryDebateReceiptV1}` |
| `SophistryDebateSessionV1` | `{tag:'sophistry-debate-session-v1',policy:SophistryDebatePolicyV1,evidence:SophistryDebateEvidenceV1,genesis:SophistryDebateGenesisV1,snapshot:SophistryDebateSnapshotV1,entries:SophistryDebateEntryV1[]}` |

genesis 包含两条完整牌带及重建初局；每条 receipt.command 与重算命令相同。不能只存当前 snapshot、略去 Effect/反射/话题随机审计，或只校验净 stress。

### 2.8 全部结果类型

以下均为递归 readonly 联合，成功值见 §1：

| 导出类型 | 联合 |
|---|---|
| `SophistryDebateFailureV1` | `{ok:false,reason:string,index:number|null}` |
| `SophistryDebateSessionResultV1` | `{ok:true,session:SophistryDebateSessionV1}` 或 Failure |
| `SophistryDebateExecuteResultV1` | `{ok:true,session:SophistryDebateSessionV1,receipt:SophistryDebateReceiptV1}` 或 Failure |
| `SophistryDebatePreviewResultV1` | `{ok:true,preview:{receipt:SophistryDebateReceiptV1,projectedSnapshot:SophistryDebateSnapshotV1,policy:SophistryDebatePolicyV1,evidence:SophistryDebateEvidenceV1,externalRngConsumed:0}}` 或 Failure |
| `SophistryDebateSaveResultV1` | `{ok:true,json:string}` 或 Failure |
| `SophistryDebateInspectionResultV1` | `{ok:true,inspection:{snapshot:SophistryDebateSnapshotV1,policy:SophistryDebatePolicyV1,evidence:SophistryDebateEvidenceV1,entryCount:number,remainingEntryCapacity:number,canonicalUtf8Bytes:number}}` 或 Failure |
| `SophistryDebateReplayResultV1` | 与 SessionResult 相同 |

reason 的公开类型是 string，不是封闭错误联合。load 返回 SessionResult，replay 返回完整 session，receipts 已在 entries 中，无额外 partial/receipt 列表。

## 3. Policy / evidence 固定合同

`SophistryDebatePolicyV1`、`SophistryDebateEvidenceV1` 是内部固定对象的递归 readonly 类型，不是可配置 map。完整字面值见 [manifest 的 policies 与 evidence](../sources/sophistry-debate-session-v1.json)，本页不重复整份 JSON。scenario 用复数 policies，session/receipt 用单数 policy，必须全字段一致，不仅核 id。

policy id=`sophistry-debate-standalone-policy-v1`。顶层键为 `id,profile,tutorial,tutorialPolicy,cards,shout,ignore,compose,agitate,sophistry,identities,initialTopic,deal,hand,round,effects,topic,randomness,arithmetic,writer,anger,closing,opening,rethink,refill,capacity,persistence`。

新增/容易误用的政策：

- tutorial=false、tutorialPolicy=non-tutorial-only 是固定政策，不是输入选项。现代源码中的教程门槛不能删去后冒充所有模式适用；不接受覆盖该门槛的 scenario 字段。
- cards id=`topic-shout-ignore-compose-agitate-and-sophistry-only-v1`，登记六个 kind；playableCapacities 共用，不新增话术槽。
- sophistry id=`source-no-anger-sophistry-v1`：power20，attack=reflect-loser-topic-only，damageCalculator=sophistry-winner-attack，coefficientCard=loser-topic-and-level，writer=loser-topic-card-reflected-true，writerGuard=calculated-hp-damage-positive，nonTopicAttack=no-hp-stress-or-jitter，additionalEffect=none。
- compose id=`source-no-anger-compose-reflection-v1`，target=opponent-unless-reflected-then-self，requestBasis=opponent-current-stress-regardless-of-reflection，requestedStress=-max(trunc(opponent-current-stress/2),30)，reflection=opponent-played-sophistry。agitate id=`source-no-anger-agitate-reflection-v1`，target=self-unless-reflected-then-opponent，请求40，reflection 同上；二者仍 power0、不能胜出、angerCounter=excluded。
- ignore 保留 suppressionScope=loser-effect-including-compose-and-agitate，另有 suppressSophistryTopicReroll=true，不能只看旧 suppressionScope 字符串而漏掉话题阶段抑制。
- effects timing=after-attack-before-hp-terminal，auditOrder=winner-then-loser-audit-slots；平局无调用/空审计，Ignore 败方受抑制。nonWriterAuditTarget 与 nonWriterAuditReflection 均为字符串 `null`；真正 DTO 字段值则是 JSON null。composeRequestBasis=opponent-current-stress-before-write-not-writer-target，nonComposeRequestBasis=null。changeRequestedStress 按实际 writer target 汇总已评估请求。
- topic id=`source-non-tutorial-sophistry-topic-reroll-v1`，rerollCondition=nonterminal-valid-attacker-either-played-sophistry-opponent-not-ignore，losingSophistryAgainstShoutRerolls=true，sameTopicAllowed=true。drawRole=sophistry-topic-reroll、drawBound=3、valueToTopic=[story,logic,trend]，phase=after-hp-closing-anger-boundary-and-crumble-before-refill，terminalReroll=false。
- randomness id=`provided-phased-debate-draws-v1`，maxDrawsPerRound2，order=[psychological-damage-jitter,sophistry-topic-reroll]，consumeAtPhase=true；missingWrongOrExtra=whole-round-atomic-rejection，externalRngConsumed0、nativePrng=false。
- closing.priority 为 attack→additional-effects→hp-defeat→unsupported-anger-trigger→crumble→topic-and-first→refill。terminalEffects=true；terminalRefill、terminalTopicChange、terminalTopicDraw、terminalFirstChange 均false。anger 的 evaluation 明确在 Attack/Effects/HP 终局检查后、topic reroll 前；不消费未出牌 hand 中的自动反制，也不进入愤怒/性格状态。
- 提供牌带、原子双选、随机整数输入、预算、保存重算是工程政策，不是原作随机发牌、AI/UI 或 native PRNG 认证。

evidence 新增 sophistryEvidence=pinned-modern-translated-reference-only、sophistryEvidenceScope=normal-non-tutorial-generic-six-kind-subset-no-anger-counter；本独立合同的 composeEvidenceScope/agitateEvidenceScope 为 no-anger-generic-six-kind-subset-with-sophistry-reflection-no-anger-counter。旧 profile 的证据字符串不随之修改。关键作用域：

- topicEnumEvidence=`pinned-modern-DebateEnum.cs-Topic-Story0-Logic1-Trend2-Max3`；debateEnumBlob=`5b46a8ac87613193eb9f4b99a25e489ba6f5e483`。
- rhetoric=`shout-ignore-compose-agitate-sophistry-only-rethink-excluded`。
- composeEffectTarget=`opponent-or-reflected-self-request-always-based-on-opponent-stress`。
- agitateEffectTarget=`self-or-reflected-opponent-plus40`。
- sophistryAttack=`winner-attack-with-loser-topic-card-reflected-to-loser-positive-damage-guard`。
- sophistryTopic=`non-tutorial-nonterminal-valid-attacker-with-sophistry-unless-opponent-ignore-even-when-losing-to-shout`。
- additionalEffects=`source-attacker-then-opponent-not-first-id`；equalPowerEffects=`source-invalid-attacker-return-no-effects`；effectTiming=`source-attack-then-effect-then-calc-winner`。

固定 commit 和 blob 见规则页与 manifest；sourceIdentity=modern-CSharp-translation-not-native-or-Vanilla。`nativeEquivalent:false,stockOriginalVerified:false,pkEquivalent:false,vanillaEquivalent:false,completeDebate:false,originalUnresolvedGroups:43`。E15 仅属于普通通用核心，不升级为诡辩、反射或 topic enum 的原生证据。原43组/45历史快照不因本子集归零。改变 policy/evidence 须另定版本或显式迁移，不可原地改字符串继续 load。


## 4. 全部当前失败原因与定位

| reason | 条件 |
|---|---|
| malformed-data / unknown-field | 非安全 plain 输入、缺键、非法整数/−0、稀疏 array/非法描述符、JSON 解析失败；或未登记键 |
| unsupported-runtime | 缺少内建安全 Proxy 探测入口 |
| unsupported-profile | schemaVersion/profile/difficulty/tag 不符，包含旧 session |
| unsupported-policy / evidence-mismatch | 完整 policy/evidence 与固定合同不同 |
| unsupported-person / unsupported-item | genericOnly 错误、非法 ID、personId/person/personHooks/characterId 或 items/item/equipment/weapon/sword 额外键 |
| unsupported-initial-state | 初局不为 HP1000/stress0/timer0 |
| unsupported-card / unsupported-action | 缺/未知 card kind、非法 topic/level；或命令非 ResolveSophistryDebateRound |
| duplicate-participant / invalid-challenger | scenario 或 choices 参与者重复；challenger 不属于场景两人 |
| invalid-token / duplicate-token / not-in-hand / invalid-choice-order | token 格式错误/重复、不在自己的当前 hand、choices 顺序不符 |
| stale-revision / stale-round / stale-first | expected 值与 snapshot 不符 |
| session-finished | 终局后继续推进 |
| draw-shape / draw-range | rawDraws 数量、当前阶段 role/bound 或顺序不符；或结构通过后的 value 不在对应的 0..4/0..2 |
| unsupported-anger-trigger | 全部 Effect 后无 HP 终局且 stress 达到 100，整轮回滚；尚未要求话题抽取的缺项不覆盖此错误 |
| deck-exhausted | 初始牌带不够，或非终局补牌不足；终局不补牌 |
| history-limit | 条数/牌带/字节/节点/深度任一预算超限 |
| invalid-genesis / receipt-mismatch / snapshot-mismatch | 初局、某条 receipt 或最终 snapshot 不等于重算 |

表不承诺任意多错误组合的优先级。安全分离先于领域解析；如 −0 先 malformed-data 而非 draw-range，未知人物/物品键先于一般 unknown-field。提供的 draw 仍先须符合 DTO 结构及值域；阶段延后只指“什么时候要求下一个必要 draw”，不是允许恶意结构、非法值或多余键进入结算。

- create 及普通新命令错误 index 通常 null。
- inspect/save/load/execute/preview 先分离整个 session；能定位的 entries 元素结构错误为 0-based index，外层/array 描述符错误可能 null。后面 entry 非法 accessor 可能早于前面 entry 语义错误。
- 安全结构通过后按历史顺序重算，首失败 entry 为 0-based index；最终 snapshot-mismatch 为 null。任何 damage/Effect 的 actor、card owner、request basis、target、reflection、状态、null 字段、顺序，以及阶段 draw count 和 topic reroll 篡改，都参与 receipt 全字段比较。
- replay 先检查 scenario 及外层 commands 列表，失败 index=−1；然后逐项分离/parse/append，首失败命令为 0-based index，不预先解析后来内部值来覆盖较早命令错误。外层洞、非法属性和长度仍可先报 −1。
- 任一失败无 partial 返回，不修改原 session、牌、HP/stress、cursor、日志、计数或话题。Effect 已经在私有拟议状态执行，不代表失败后会留下半轮。命令中的显式 draw 是输入数据，失败也不会推进外部 RNG。


## 5. 安全输入、资源预算与运行时

仅接收 Object.prototype 或 null 原型 record、标准 Array 及合法 JSON 式标量；字段必须是可枚举数据属性。拒绝 Proxy、getter/setter、函数、undefined、外部 BigInt、Symbol、Date/custom prototype、循环、稀疏 array、额外 array 属性、非枚举 record 字段。不会调用调用者 getter、toJSON 或 custom iterator。

Proxy 检测依赖 `process.getBuiltinModule('node:util').types.isProxy`，缺少时 fail-closed 为 unsupported-runtime，不尝试不安全降级。内部精确 BigInt 不允许外部 DTO 带 BigInt。可擦除 TS 语法不表示已验证任何 Node/浏览器版本。

| 预算 | 上限 |
|---|---:|
| entries / replay 命令数 | 4096 |
| 每方 cardTape | 512 |
| canonical 完整 session UTF-8 bytes | 16,777,216 |
| 值节点 / 嵌套深度 | 1,000,000 / 32 |

安全分离和最终拟议输出均受限，通用 array 长度另限 4096 再按领域收紧。load 还限制原始 JSON 文本字节；replay 累计 commands 输入预算。policy/evidence 及每条完整 receipt 的重复内容、Effect 审计、反射字段、话题抽取记录和阶段字段都计入，不仅计算 commands。

inspect.remainingEntryCapacity=4096−entryCount 只说明条数。牌带、字节、节点或 stress 边界可能更早触达。preview 使用同一完整拟议 append 及预算，不可绕过限制；超限是 API 拒绝，不是游戏平局。

## 6. 保存、重放与接入说明

save 重新检查完整 session 后返回 canonical JSON：对象键排序、数组保序，无函数/RNG/外部引用。load 只收字符串，接受等价键序 JSON；核 tag/policy/evidence、重建 genesis，按 entry 重跑命令并对照完整 receipt，最后核 snapshot。

inspect/preview/execute/save 同样重算，不只 load 校验。不信任外部 attack、cursor、hand、winner、damage、净 stress、阶段 stress、Effect 的 actor/request basis/target/reflection/status/invoked/null 请求或顺序，以及话题抽取阶段、随机数消耗与最终 topic；仅存 snapshot 不构成有效存档。存档未签名未加密，不能证明来自原作或阻止构造内部一致的虚构历史。

调用方先判 ok，execute 成功后采用返回的新 session；save 成功 json 再交 load。只将纸面材料内对应的 scenario 交 create，或 scenario 与 commands 交 replay；说明、手算预期和拒绝候选不属于 scenario，也不是运行生成的 receipt 或存档。本文只描述接口接入，不实际调用这些函数。

### 6.1 七轮纸面接纳与独立第八轮拒绝

[纸面场景](../../data/scenarios/sophistry-debate-example-v1.json) 中双方 INT60、attack100，初始 topic=story、first=beta、HP1000/stress0。下面均为手工推导，未执行，不是运行 receipt。表内 A/B 分别为 alpha/beta；具体 token 与牌带以该场景文件为准。

| 轮次 | A / B 出牌 | rawDraws 的 value，依实际阶段顺序 | 轮后 A HP/stress | 轮后 B HP/stress | 轮后 first/topic |
|---|---|---|---|---|---|
| 1 | Agitate / story-small | jitter 0 | 900/50 | 1000/0 | beta/story |
| 2 | Sophistry / Compose | topic 1 | 900/50 | 1000/0 | alpha/logic |
| 3 | Sophistry / Agitate | topic 2 | 900/90 | 1000/0 | alpha/trend |
| 4 | trend-small / Compose | jitter 0 | 900/45 | 900/10 | alpha/trend |
| 5 | Sophistry / Shout | jitter 0，topic 0 | 720/60 | 900/10 | beta/story |
| 6 | Sophistry / story-large | jitter 0，topic 0 | 720/60 | 700/30 | alpha/story |
| 7 | Sophistry / Ignore | 无 | 720/90 | 700/30 | beta/story |

第 2 轮诡辩胜镇静没有 HP Attack draw；B 镇静的请求依据是对手 A 当前 stress50，计算 −30，但反射实际写入 B 自己的 stress0，clamp 后仍 0。这条 Effect 是 applied，不能改记成 no-additional-effect。第 3 轮 B 激昂的 +40 被反射至对手 A，使 A50→90，而不是给 B 加到40。

第 4 轮 B 镇静未反射，依据并作用于 A 的90，请求 −45，A 降至45。第 5 轮诡辩虽败给大喝，非终局且不受无视抑制，仍在 Attack jitter 后消费话题 draw，重抽为 story。第 6 轮诡辩胜普通牌，使用 A 的 attack100 和 B 的 story-large 牌系数请求 HP伤害200、stress20，再消费第二个 draw；抽得 story 与原 topic 相同仍为一次真实 topic draw，不是“未抽”。第 7 轮无视胜不取 Attack draw，也抑制诡辩的额外效果与话题抽取。

场景只把前七条放进 commands；`rejectedNextCommand` 单独保存第八轮候选。第八轮 A Sophistry / B Agitate，rawDraws=[]：Attack 不取 jitter，B 激昂反射使 A90→100（请求+40，实际+10），没有 HP 终局，于是返回 unsupported-anger-trigger；该时点尚未要求 topic draw，不能因缺少 topic draw 改报 draw-shape。没有成功 receipt，保留第七轮全部状态。直接 preview/execute 的新命令 index=null；若另把第八条接到 replay 命令列表，失败 index=7 且无前七轮 partial session。

第七轮成功后 revision/roundIndex 均7，双方牌带各10张，依次消费 token0..6；hand 保留 token7/8/9，deckCursor=10。第八轮候选选双方 token7。只有第1、4、5、6轮各消费 Attack jitter；第2、3、5、6轮各消费 topic draw。拒绝的第八轮不提交 HP/stress、token 消费、cursor、topic、first、计数或 entry。纸面使用说明不改变“本批未执行”的事实。

规则页另外给出可从合法 genesis 到达的不同 stress 前提，用于区分镇静反射的 request basis 与实际 writer target。接口不允许为了展示该差异而直接注入任意中局 snapshot。

## 7. 未执行与不支持声明

本批只做静态读源、代码修改及规则文档补充，没有测试、typecheck、编译、build、checker、validator、诊断、产品或示例执行。旧测试和旧 profile 合同不修改；新导出不表示过去的验证数字覆盖本批。

现代转录子集不是原 PC/PK/Vanilla/主机或完整舌战认证，不覆盖 P078 及全部依赖、教程状态机、愤怒状态/愤激/性格/自动反制、再考、人物/书籍、原作随机发牌、开场/追击或 campaign 结果。接受本页明确列出的诡辩、普通牌伤害反射、镇静/激昂反射与非教程话题抽取，不允许任何未支持的持有牌反制、额外卡牌消费或外部状态写入，也不代表全部原作缺口已清空。
