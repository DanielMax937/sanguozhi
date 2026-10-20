# 六类战斗牌 + 再考独立舌战 API v1

[规则与固定来源](../rules/rethink-debate-session-v1.md) · [全部政策及证据字面值](../sources/rethink-debate-session-v1.json) · [五轮接纳及独立拒绝候选的纸面场景，未运行](../../data/scenarios/rethink-debate-example-v1.json)。

实现入口为 [rethink-debate.ts](../../packages/engine/src/rethink-debate.ts)，公共导出见 [engine index](../../packages/engine/src/index.ts)。这是独立 profile=`debate-topic-shout-ignore-compose-agitate-sophistry-rethink-reference-v1`、tag=`rethink-debate-session-v1`，不会修改或隐式迁移旧 topic-only、Shout、Ignore、Compose、Agitate 或 Sophistry session。

本 profile 仅覆盖普通难度、非教程、通用身份、无愤怒状态的现代转录子集。六类战斗牌仍是 topic、shout、ignore、compose、agitate、sophistry；**再考是出牌前可选的整手换牌操作，不是第七类牌**。没有 `kind:'rethink'`，没有再考伤害、power、Effect 或随机数角色。这里的“可选”指命令内可以不请求该操作，不表示省略命令的 `rethinks` 字段。

## 1. 七个公开函数与两个常量

全部参数按 unknown 处理并严格校验；全部成功、失败输出和常量递归深冻结，不修改调用者输入。

| 函数 | 参数 | 成功值 |
|---|---|---|
| `createRethinkDebate` | scenario | `{ok:true,session}` |
| `inspectRethinkDebate` | 完整 session | `{ok:true,inspection:{snapshot,policy,evidence,entryCount,remainingEntryCapacity,canonicalUtf8Bytes}}` |
| `previewRethinkDebateRound` | 完整 session, command | `{ok:true,preview:{receipt,projectedSnapshot,policy,evidence,externalRngConsumed:0}}` |
| `executeRethinkDebateRound` | 完整 session, command | `{ok:true,session,receipt}` |
| `saveRethinkDebate` | 完整 session | `{ok:true,json}` |
| `loadRethinkDebate` | JSON 字符串 | `{ok:true,session}` |
| `replayRethinkDebate` | scenario, commands 数组 | `{ok:true,session}` |

常量为 `RETHINK_DEBATE_POLICY_V1:RethinkDebatePolicyV1` 与 `RETHINK_DEBATE_EVIDENCE_V1:RethinkDebateEvidenceV1`。全部失败统一为 `{ok:false,reason,index}`，不返回 partial session、半轮 hand 或失败 receipt。

preview/execute 名称有 Round 后缀，没有无后缀别名。两者使用相同的完整历史重算、拟议 append 和预算检查。只有 preview 不返回拟议 session，而是返回 receipt/projectedSnapshot 及固定 policy/evidence/externalRngConsumed；execute 返回新的 session 与 receipt，调用者采用新 session 才保留这次推进。二者均不修改原输入。inspect 也会重算，不是仅展示现有 snapshot。replay 是 API 名称，不表示本批实际执行过该函数。

## 2. 公开 DTO 全字段

复合类型均为递归 readonly。下面 `Pair<T>` 表示恰好两项的保序 tuple，仅为文档简写，不是额外导出。所有 number 均须为安全整数且不能为 −0。

### 2.1 卡牌、participant、scenario

| 导出类型 | 完整结构或域 |
|---|---|
| `RethinkDebateTopicV1` | `'story' \| 'logic' \| 'trend'` |
| `RethinkDebateLevelV1` | `'small' \| 'medium' \| 'large'` |
| `RethinkDebateTopicCardV1` | `{kind:'topic',topic:RethinkDebateTopicV1,level:RethinkDebateLevelV1}` |
| `RethinkDebateShoutCardV1` | `{kind:'shout'}` |
| `RethinkDebateIgnoreCardV1` | `{kind:'ignore'}` |
| `RethinkDebateComposeCardV1` | `{kind:'compose'}` |
| `RethinkDebateAgitateCardV1` | `{kind:'agitate'}` |
| `RethinkDebateSophistryCardV1` | `{kind:'sophistry'}` |
| `RethinkDebateCardV1` | 上述六种 Card 的封闭联合 |
| `RethinkDebateCardOccurrenceV1` | Card 联合加 `{token:string,tapeIndex:number}` |
| `RethinkDebateParticipantV1` | `{id:string,resolvedIntelligence:number,hp:1000,stress:0,angerTimer:0,cardTape:RethinkDebateCardV1[]}` |
| `RethinkDebateScenarioV1` | `{schemaVersion:1,profile:'debate-topic-shout-ignore-compose-agitate-sophistry-rethink-reference-v1',genericOnly:true,difficulty:'source-normal',policies:RethinkDebatePolicyV1,challengerId:string,initialTopic:RethinkDebateTopicV1,participants:Pair<RethinkDebateParticipantV1>}` |

ID 必须匹配 ASCII `[A-Za-z][A-Za-z0-9_-]{0,63}`；两人不同，challengerId 属于其中之一，并决定初始 firstId。INT 为 1..100；初始 hp/stress/angerTimer 固定 1000/0/0。不允许人物、物品、性格 hook、任意中局输入或调用者指定 canRethink。

每方 cardTape 最多 512 项，须足够初始手牌。模板不带 token；发牌生成的 occurrence 才带 token/tapeIndex。tapeIndex 为 0..511，token 严格按 `participantId:tapeIndex` 生成。再考只推进原牌带，不回收被弃 token，不重新编号，也不凭空生成 topic。

只接受列出的全部必需键，不补默认值。特殊牌不能有 topic/level；缺少或未知 kind、非法 topic/level 为 unsupported-card，普通牌缺字段为 malformed-data，特殊牌带额外字段为 unknown-field。scenario/command 不接受 tutorial、reflection、预计算攻击/伤害、额外话题抽取结果、任意状态覆盖或再考卡牌。

### 2.2 participant state、snapshot、outcome

`RethinkDebateParticipantStateV1` 的全部字段：

| 字段 | 类型或域 |
|---|---|
| id, resolvedIntelligence | string、number，保留 scenario 值 |
| attack | number，由双方 INT 重算，范围 70..227 |
| hp, stress, angerTimer | number −100..1000、number 0..100、字面量 0 |
| sourceSlotCount | number 4/5/6/7 |
| playableHandCapacity | number 3/4/5/6，INT 阈值 70/80/90 |
| reservedRethinkSlot | 字面量 true |
| crumbledLevel | number 0..3，非终局重算，终局保留 |
| canRethink | boolean，初始 true，使用后 false，仅非终局崩坏等级变化恢复 true |
| hand | RethinkDebateCardOccurrenceV1[] |
| deckCursor | number 0..牌带长度，指向下一未发项 |

`RethinkDebateOutcomeV1`=`{kind:'hp-defeat',winnerId:string,loserId:string}`。

`RethinkDebateSnapshotV1`=`{schemaVersion:1,profile:'debate-topic-shout-ignore-compose-agitate-sophistry-rethink-reference-v1',revision:number,roundIndex:number,currentTopic:RethinkDebateTopicV1,firstId:string,status:'active'|'finished',outcome:RethinkDebateOutcomeV1|null,participants:Pair<RethinkDebateParticipantStateV1>}`。

初局 revision/roundIndex 均 0，成功每轮各 +1。六类战斗牌共用 playableHandCapacity，reservedRethinkSlot 不是 hand 中一个可选 token，不增加第七种战斗牌。sourceSlotCount=playableHandCapacity+1 只描述来源槽位模型。

active 成功态 HP>0、stress<100，双方 hand 补满且各含至少一张 topic。finished 状态消费本轮最终选出的两张战斗牌后不补牌，因此终局剩余 hand 可以没有 topic。所有 fill 都执行话题边界，详见 §2.3；“非终局最终 hand 有 topic”不等于可以跳过再考 replacement 的中间 fill 检查。

canRethink 不是每轮重置。非终局崩坏按 `clamp(trunc((1000-hp)/250),0,3)` 重算；话题/先手处理完成后，折叠在本次原子推进内的下一轮开始阶段仅在新旧 crumbledLevel 不同时把 canRethink 设为 true，其他情况保留已有值。再考后同轮若发生非终局崩坏变化，可在最终 snapshot 中恢复 true，供下一轮使用；不允许同轮第二次再考。HP 终局不计算崩坏或恢复可用性：已用者保持 false，未用者保留旧值。没有可独立保存或继续的“已再考、尚未出牌”交互中间态。

### 2.3 command、selection 与出牌前再考

```ts
type RethinkDebateSelectionV1 = {
  participantId: string;
  cardToken: string;
};
type RethinkDebateRawDrawV1 =
  | { role: 'psychological-damage-jitter'; bound: 5; value: number }
  | { role: 'sophistry-topic-reroll'; bound: 3; value: number };
type RethinkDebateCommandV1 = {
  type: 'ResolveRethinkDebateRound';
  expectedRevision: number;
  expectedRoundIndex: number;
  expectedFirstId: string;
  rethinks: string[];
  choices: [RethinkDebateSelectionV1, RethinkDebateSelectionV1];
  rawDraws: RethinkDebateRawDrawV1[];
};
```

expected 计数为 0..4096，必须匹配 snapshot，expectedFirstId 也须匹配。`rethinks` 必填，空数组表示不再考，最多包含两位不重复的本场 participant ID。数组输入顺序不决定操作顺序；重复请求不能表达同一人再考两次。命令与 receipt.command 保留输入顺序，不将数组排序来伪造另一条命令。

choices 始终严格按 scenario 参与者顺序。执行顺序则严格使用轮开始 firstId：

1. 检查本轮请求的参与者身份与再考可用性。
2. firstId 一方若被请求，再考；然后该方从当前手牌作最终选择并移除所选牌。
3. other 一方若被请求，再考；然后该方从当前手牌作最终选择并移除所选牌。
4. 两个最终 play 确定后，执行原有比较、Attack、Effect 及结束阶段。

因此可在同一 atomic command 中选择本轮刚由再考发出的 token；不能先以旧 hand 校验两个 token，再执行再考。请求了再考的参与者也必须最终出一张战斗牌，再考不占整个回合，不替代该人的 choice。未请求再考者只能选自己的当前 hand。另一方的旧选择尚未作出时，不应提前作为已经移除的牌处理。

再考的动作是：丢弃本人**全部**现有 hand，依原 cardTape 从 deckCursor 补到原 playableHandCapacity，检查 replacement hand 至少含一张 topic，并将 canRethink 从 true 置 false。不保留指定牌、不改变容量、不重洗、不重排展示、不回收弃牌，不花费 rawDraws，也不改变 HP、stress、话题、firstId 或独立增加 revision/roundIndex。全轮失败时这些拟议变化全部回滚。

每次 fill 必须至少有一张 topic，范围包括：

- genesis 初始填满；
- 再考丢弃全手后的完整 replacement；
- 非终局消费最终出牌后的空位补牌。

不足牌带返回 deck-exhausted；填满却仍无 topic 返回 unsupported-topic-repair。该边界禁止调用或模拟来源的强制话题 `RandInt(9)`，不补造替换牌，不从后续牌带扫描直到遇见 topic，也不偷取普通伤害或诡辩的话题 draw。即使 replacement 的某张特殊牌本可参与本轮，replacement 无 topic 仍不能继续。终局没有 fill，故无 topic 的终局残手不触发该错误。

token 语法是合法 ID、冒号、规范十进制 0..999；实际生成索引最多 511。格式通过后仍检查实际手牌成员资格。不能选择对方、已消费、已弃、未发的 token，不能直接传卡牌模板。再考发到哪张牌只由 cardTape 和 cursor 决定，命令不能注入 replacementCards。

### 2.4 再考审计

`RethinkDebateRethinkV1` 完整结构：

```ts
{
  sequence: 0 | 1;
  participantId: string;
  discardedCards: RethinkDebateCardOccurrenceV1[];
  replacementCards: RethinkDebateCardOccurrenceV1[];
  beforeDeckCursor: number;
  afterDeckCursor: number;
  beforeCanRethink: true;
  afterCanRethink: false;
}
```

receipt.rethinks 只记录实际请求且在成功原子轮中完成的操作，不为未请求者增加 skipped/no-op 槽。记录按 firstId→other 的操作顺序排列；sequence 是**紧凑审计索引**，仅 other 再考时，该唯一记录仍为 sequence0，不能把它写成 source 位次1。

discardedCards 按换牌前 hand 顺序记录完整 occurrence，replacementCards 按牌带发牌顺序记录完整新 hand，包含之后本轮可能消费的那张牌。action-local afterDeckCursor 在整手 replacement 后、最终选择前截取，不包含非终局回合末补牌。没有 RNG 字段、伤害字段或额外的 selection 字段；该方最终选择见 plays/changes.consumedCard。

此审计的 true→false 是动作局部可用性；Change 的 beforeCanRethink/afterCanRethink 则跨整轮。一次再考与同轮崩坏恢复可以使 audit=true→false，而 Change=true→true。二者必须同时保留，不能以最终 true 推断“没有用过再考”。

### 2.5 分阶段 raw draw

rawDraws 最多两项。伤害 jitter 的 value 为 0..4；诡辩话题 draw 的 value 为 0..2，固定映射 `0→story,1→logic,2→trend`。如都需要，严格先 Attack jitter、后 topic reroll。再考 replacement 与任何 fill 都不新增 raw draw 类型。

| 比较与结算分支 | Attack draw | 非终局且无 stress100 时的 topic draw | 成功整轮总数 |
|---|---|---|---|
| 普通/大喝胜，双方无诡辩 | jitter 一项 | 无 | 1 |
| 诡辩胜普通牌 | jitter 一项，使用诡辩方 attack 和败方牌系数 | 一项 | 2；HP 终局仅 1 |
| 大喝胜诡辩 | jitter 一项 | 一项，败方诡辩仍触发 | 2；HP 终局仅 1 |
| 诡辩胜镇静或激昂 | 无 | 一项 | 1 |
| 无视胜，包括败方诡辩 | 无 | 无，受无视抑制 | 0 |
| 任意等 power 平局，包括双诡辩 | 无 | 无 | 0 |

Attack 与话题 draw 分阶段要求。只在普通/大喝伤害或诡辩反射普通伤害时取 jitter，不能为诡辩胜镇静/激昂构造零伤害 jitter。topic draw 在 Attack、全部 Effect、HP 终局与非终局 stress 边界之后才按需要求；不能在比较后固定要求“两项”，或先消费无用 draw 再丢弃。

HP 终局跳过 topic reroll，额外 topic draw 仍拒绝。非终局最终 stress100 先返回 unsupported-anger-trigger，不要求未到达阶段的 topic draw。成功路径严格核对所有 draw 已消费，平局和无视胜须为 []。重抽到原话题仍是 applied 并消费一项，不能写为 skipped。

draw 都是调用者提供的有限原始整数，不使用全局 RNG、callback、seed 或预计算 winner/power/attack/damage/Effect。preview.externalRngConsumed 恒0，不表示可以省略命令内必要 draw。rawDraws 的结构、已提供值的范围、未知字段等在进入领域阶段前仍严格校验；阶段延后不是接受恶意输入的豁免。

### 2.6 play 与 damage

`RethinkDebatePlayV1`=`{participantId:string,card:RethinkDebateCardOccurrenceV1,attack:number,power:number,matchesCurrentTopic:boolean}`。

普通牌 power 为 1..3/11..13；大喝110，无视120，诡辩20，镇静/激昂均0。特殊牌 matchesCurrentTopic 恒 false；大喝 topicCoefficient 仍固定12，不能据 false 推为6。诡辩赢普通牌与两种零 power 牌，输大喝/无视；任何等 power 都平局，不通过 firstId 破同分。

`RethinkDebateDamageV1` 为公共字段与恰一分支的交叉联合。下列 TopicOccurrence/ShoutOccurrence/SophistryOccurrence 仅为对应 Card 模板加 `{token:string,tapeIndex:number}` 的文档简写，不是额外导出。

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
  roundStartTopic: RethinkDebateTopicV1;
  requestedHpDamage: number;
  requestedStress: number;
}
```

恰一分支：

```ts
{ kind: 'topic'; sourceCard: TopicOccurrence; card: TopicOccurrence;
  reflected: false; writer: 'topic-card'; positiveHpGuard: false; writerApplied: true }
{ kind: 'shout'; sourceCard: ShoutOccurrence; card: ShoutOccurrence;
  reflected: false; writer: 'shout'; positiveHpGuard: false; writerApplied: true }
{ kind: 'reflected-topic'; sourceCard: SophistryOccurrence; card: TopicOccurrence;
  reflected: true; writer: 'topic-card'; positiveHpGuard: true; writerApplied: boolean }
```

sourceId 是攻击计算者，cardOwnerId 是系数牌 card 的主人，targetId 是实际 writer 目标。sourceCard/card 均记录完整 occurrence：

- 普通/大喝胜：sourceId=cardOwnerId=胜方，targetId=败方，sourceCard 与 card 均为胜牌。普通等级系数10/15/20，匹配轮开始话题取10、否则6；大喝固定15/12。普通 requestedStress 为10/15/20，大喝15。
- 诡辩胜普通牌：sourceId 为诡辩胜方，sourceCard 是诡辩；cardOwnerId=targetId 为普通牌败方，card 是该败方普通牌。使用胜方 attack、败方 topic/level 与 roundStartTopic，不使用败方 attack，也不替诡辩虚构等级。
- 反射分支 positiveHpGuard=true，只有计算的 HP 伤害大于0才调用普通牌反射 writer，HP 与相应 Attack stress 同受 guard 约束，writerApplied 记录该条件。当前固定范围伤害为正；boolean 字段不授权外部注入零伤害或其他系数。
- 无视胜、任意平局、诡辩胜镇静/激昂均 damage=null，不构造零系数对象。damage=null 不等于 result=draw。

attack=`100+trunc(40*(myINT-opponentINT)/(131-myINT))`；HP 请求=`trunc((attack+jitter)*10*levelCoefficient*topicCoefficient/1000)`。除法向零，内部精确 bigint；power 差、先手、再考和稍后重抽的话题均不进入本轮伤害公式。

### 2.7 stress 阶段与 Effect 审计

`RethinkDebateStressStageV1`=`{beforeStress:number,requestedStress:number,afterStress:number,actualStressDelta:number}`。

actualStressDelta=after−before。Attack 和每个实际 Effect writer 分别 clamp 到0..100，requested 可为负且不等于实际差。

`RethinkDebateEffectV1` 的公共字段：

```ts
{ sequence: 0 | 1; actorId: string; opponentId: string }
```

再与以下恰一分支相交：

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

有 winner 时固定两个 Effect 审计槽：sequence0 胜者、sequence1 败者，actorId 为该槽出牌者，opponentId 为另一人。此顺序独立于 firstId、scenario 顺序、再考请求顺序或再考审计顺序。

- 普通/大喝/无视/诡辩的 Effect 被调用但无 stress writer：no-additional-effect、invoked=true、请求0、实际0，target/reflection/basis/before/after 均为 null。诡辩的后续 topic reroll 另列，不冒充 stress Effect。
- Compose 被调用：请求依据始终是 opponentId 在执行此 Effect 时的当前 stress，计算 `-max(trunc(requestBasisStress/2),30)`。对手不是诡辩时写 opponentId；对手是诡辩时反射写 actorId。反射只改实际 target，不改请求依据。before/after 指实际 target；即使 target 为0、实际差0，仍为 applied 和完整负请求。
- Agitate 被调用：请求固定40，basis 两字段 null。对手不是诡辩时写 actorId，对手为诡辩时反射写 opponentId。90→100 时请求仍40，实际差10。不额外消费 jitter。
- Ignore 胜：胜者 no-additional-effect，败者 suppressed-by-ignore、invoked=false、requestedStress=null。目标、reflection、basis、before/after 全 null，实际0；不评估假想 −30/+40，不预先执行败方诡辩 topic reroll。
- 所有等 power 平局，包括双诡辩、双镇静、双激昂或镇静/激昂：仅 Attack 对双方各请求 stress+15，effects=[]；没有两个 no-op 槽，也无额外 Effect 或话题 draw。

镇静/激昂只能作为普通、大喝或诡辩的败牌 applied，不能胜出；遇 Ignore 受抑制，彼此平局无 Effect。所有 Effect 均在 Attack 后、HP 终局检查前；actor 已 HP<=0 不构成跳过条件。不得提前结束而遗漏败方 writer，不得将未调用的 null 请求改为“已评估0”。

### 2.8 change、topic reroll、receipt

`RethinkDebateChangeV1` 全部字段：

- `participantId:string`。
- `beforeHp:number,afterHp:number,requestedHpDamage:number,actualHpDelta:number`。
- `beforeStress:number,afterStress:number,requestedStress:number,actualStressDelta:number`。
- `attackStress:RethinkDebateStressStageV1,effectStress:RethinkDebateStressStageV1`。
- `beforeCrumbledLevel:number,afterCrumbledLevel:number`。
- `beforeCanRethink:boolean,afterCanRethink:boolean`。
- `rethinkRefreshReason:'crumble-level-changed'|'no-crumble-change'|'terminal-no-next-turn'`。
- `consumedCard:RethinkDebateCardOccurrenceV1,refilledCards:RethinkDebateCardOccurrenceV1[]`。
- `beforeDeckCursor:number,afterDeckCursor:number`。

Change 横跨整轮：before 字段来自轮开始 snapshot，after 字段来自最终 snapshot，cursor 差包括本轮再考 replacement 和非终局补牌。consumedCard 是再考后最终选中的战斗牌，不是所有被丢弃的牌；refilledCards 只记录回合末补空位，再考 replacementCards 单列在 receipt.rethinks。终局 refilledCards=[]，但若本轮使用过再考，afterDeckCursor 仍会高于 beforeDeckCursor，不能沿用“终局 cursor 完全不动”的旧表述。

rethinkRefreshReason 对两人都记录：非终局且崩坏改变为 crumble-level-changed；非终局未改变为 no-crumble-change；HP 终局一律 terminal-no-next-turn。它解释下一轮资格刷新，不等于“本轮是否请求了再考”；no-crumble-change 可以对应原本未用且仍 true，也可以对应使用后仍 false。终局不以 HP 另算一个假想崩坏级别。

attackStress 跨 Attack，effectStress 从 Attack 后至全部 Effect 后；两个阶段始终存在，无 writer 时也保留0请求。change.requestedStress 是两个阶段已评估请求之和，按实际 target 归档，不按 actor/opponent/basis 一概归档。受抑制 Effect 的 null 不计入请求。整轮实际差等于两阶段实际差之和，不能以整轮请求和代替分阶段 clamp。

HP 实际差亦为 after−before，requestedHpDamage 与 −100 下限 clamp 分开。终局 stress 可达100；非终局最终 stress100 拒绝全轮，无成功 receipt。

`RethinkDebateTopicRerollV1` 的封闭联合：

```ts
{
  status: 'applied'; drawIndex: 0 | 1; rawValue: number;
  beforeTopic: RethinkDebateTopicV1; afterTopic: RethinkDebateTopicV1;
  sophistryOwnerId: string; opponentId: string;
}
{
  status: 'skipped';
  reason: 'terminal' | 'equal-card-power' | 'no-sophistry' | 'opponent-ignore';
}
```

applied.rawValue 仅0..2，drawIndex 为 rawDraws/consumedDraws 的0-based位置，有 Attack jitter 为1，否则0；beforeTopic/afterTopic 可相同。sophistryOwnerId 是诡辩主人，不一定是 winner，大喝胜诡辩仍记录败方。skipped 只有 status/reason，不增添假想 drawIndex、rawValue、null 话题或 owner。

跳过原因按阶段判定：HP 终局为 terminal；否则平局 equal-card-power；否则没有诡辩 no-sophistry；存在诡辩且对手为 Ignore 才 opponent-ignore。因此 Ignore 胜普通牌属于 no-sophistry，不是 opponent-ignore。

`RethinkDebateReceiptV1` 全部字段：

| 字段组 | 精确字段及类型 |
|---|---|
| 版本及合同 | schemaVersion:1；profile固定新profile；command:RethinkDebateCommandV1；policy:RethinkDebatePolicyV1；evidence:RethinkDebateEvidenceV1 |
| 计数 | beforeRevision/afterRevision/beforeRoundIndex/afterRoundIndex:number |
| 先手/话题 | beforeFirstId/afterFirstId:string；beforeTopic/afterTopic:RethinkDebateTopicV1 |
| 再考 | rethinks:RethinkDebateRethinkV1[] |
| 出牌 | orderedIds:Pair<string>；plays:Pair<RethinkDebatePlayV1> |
| 本轮结果 | result:'winner'\|'draw'；roundWinnerId:string\|null；damage:RethinkDebateDamageV1\|null |
| Effect审计 | effects:RethinkDebateEffectV1[]；effectOrder:'winner-then-loser-audit-slots'\|'none-equal-card-power'；effectSkipReason:'equal-card-power'\|'ignore-suppresses-loser-effect'\|null |
| 写入 | changes:Pair<RethinkDebateChangeV1> |
| 原始随机 | consumedDraws:RethinkDebateRawDrawV1[] |
| Attack随机 | attackDrawCount:0\|1；attackNoDrawReason:'equal-card-power'\|'ignore-no-hp-damage'\|'sophistry-opponent-not-topic'\|null |
| 话题及总随机 | topicDrawCount:0\|1；drawCount:0\|1\|2；topicReroll:RethinkDebateTopicRerollV1 |
| 结束 | terminal:boolean；crumbleEvaluated:boolean；refillApplied:boolean；outcome:RethinkDebateOutcomeV1\|null |

orderedIds 是轮开始 first/other，并实际决定再考及最终选择次序；plays/changes 仍按 scenario 顺序；rethinks 是仅请求者的 source-first 操作顺序；effects 是 winner/loser 审计顺序。四种数组/顺序不能混用。

无视胜仍 result=winner 且 roundWinnerId 非 null，但 damage=null、attackDrawCount0、attackNoDrawReason=ignore-no-hp-damage、effectSkipReason=ignore-suppresses-loser-effect。平局 roundWinnerId=null、effectOrder=none-equal-card-power、effectSkipReason=equal-card-power。

诡辩胜镇静/激昂的 attackDrawCount0、attackNoDrawReason=sophistry-opponent-not-topic，不代表整轮无随机，正常非终局仍 topicDrawCount1。攻击有 jitter 时 attackNoDrawReason=null。drawCount 恒等于 attackDrawCount+topicDrawCount，consumedDraws 与成功 command.rawDraws 全字段及顺序相同。receipt 顶层没有旧的 noDrawReason 字段。

非终局成功 crumbleEvaluated/refillApplied=true。先 HP/stress 边界，再崩坏，再话题/先手，核完 draw 消耗后才折叠下一轮开始的可用性刷新与补牌；普通胜牌令话题跟随胜牌，符合条件的诡辩重抽话题，其他特殊胜牌保持话题，winner 成为新 firstId，平局保持 first/topic。fill 的 unsupported-topic-repair 与任何其他失败一样不提交此前再考、伤害、Effect 或可用性恢复。

终局 crumbleEvaluated/refillApplied=false，refilledCards=[]，first/topic 保持轮开始值，topicDrawCount0，topicReroll={status:'skipped',reason:'terminal'}。本轮前置再考及最终选牌仍属于该成功终局轮；不因为终局跳过已发生的前置动作。Effect 仍完整执行：败方 HP<=0 后可由激昂写到 stress100，再返回 HP 终局；相同 stress100 在非终局则全轮拒绝。

### 2.9 genesis、entry、session

| 导出类型 | 完整结构 |
|---|---|
| `RethinkDebateGenesisV1` | `{scenario:RethinkDebateScenarioV1,snapshot:RethinkDebateSnapshotV1}` |
| `RethinkDebateEntryV1` | `{command:RethinkDebateCommandV1,receipt:RethinkDebateReceiptV1}` |
| `RethinkDebateSessionV1` | `{tag:'rethink-debate-session-v1',policy:RethinkDebatePolicyV1,evidence:RethinkDebateEvidenceV1,genesis:RethinkDebateGenesisV1,snapshot:RethinkDebateSnapshotV1,entries:RethinkDebateEntryV1[]}` |

genesis 含两条完整牌带及重建初局，每条 receipt.command 与重算命令相同。不能仅保存当前 snapshot、略去再考弃牌/换牌审计或可用性历史，也不能仅校验净 stress、cursor 或最终 hand。

### 2.10 全部结果类型

| 导出类型 | 完整联合 |
|---|---|
| `RethinkDebateFailureV1` | `{ok:false,reason:string,index:number|null}` |
| `RethinkDebateSessionResultV1` | `{ok:true,session:RethinkDebateSessionV1}` 或 Failure |
| `RethinkDebateExecuteResultV1` | `{ok:true,session:RethinkDebateSessionV1,receipt:RethinkDebateReceiptV1}` 或 Failure |
| `RethinkDebatePreviewResultV1` | `{ok:true,preview:{receipt:RethinkDebateReceiptV1,projectedSnapshot:RethinkDebateSnapshotV1,policy:RethinkDebatePolicyV1,evidence:RethinkDebateEvidenceV1,externalRngConsumed:0}}` 或 Failure |
| `RethinkDebateSaveResultV1` | `{ok:true,json:string}` 或 Failure |
| `RethinkDebateInspectionResultV1` | `{ok:true,inspection:{snapshot:RethinkDebateSnapshotV1,policy:RethinkDebatePolicyV1,evidence:RethinkDebateEvidenceV1,entryCount:number,remainingEntryCapacity:number,canonicalUtf8Bytes:number}}` 或 Failure |
| `RethinkDebateReplayResultV1` | 与 SessionResult 相同 |

均为递归 readonly 联合。reason 的公开类型是 string，不是封闭错误枚举。load 返回 SessionResult；replay 返回完整 session，receipts 已在 entries 内，不额外返回 partial 或 receipt 列表。

## 3. 固定 policy 与 evidence 合同

`RethinkDebatePolicyV1` 和 `RethinkDebateEvidenceV1` 是内部固定对象的递归 readonly 类型，不是调用者可配置 map。完整字面值以 [manifest](../sources/rethink-debate-session-v1.json) 的 policies/evidence 和 [实现源码](../../packages/engine/src/rethink-debate.ts) 为准。scenario 使用复数 policies，session/receipt 使用单数 policy；比较所有字段，不仅比较 id。

policy id=`rethink-debate-standalone-policy-v1`；顶层键为 `id,profile,tutorial,tutorialPolicy,cards,shout,ignore,compose,agitate,sophistry,identities,initialTopic,deal,hand,round,effects,topic,randomness,arithmetic,writer,anger,closing,opening,rethink,refill,capacity,persistence`。tutorial=false、tutorialPolicy=non-tutorial-only 均固定，不能由 scenario 切换。

与旧 Sophistry 合同的关键新增字面值：

- deal.id=`provided-ordered-card-tapes-with-topic-admissibility-v1`；topicRequirement=`at-least-one-topic-after-every-fill`，topicRequirementPhases=[genesis,rethink-replacement,nonterminal-refill]，topicRepair=`unsupported-topic-repair`，sourceTopicRepairDraw=`excluded-RandInt9`，deckRegeneration=`excluded`。
- hand.id=`source-reserved-rethink-slot-precombat-action-v1`；rethinkPlayable=false，reservedSlotRepresentation=`capacity-metadata-only-no-physical-slot-removal`。这不是禁止本 profile 的前置再考，而是明确再考不是战斗牌，也不模拟删除一个实体第七槽位。
- round.id=`paired-choice-precombat-rethink-atomic-round-v1`，action=`ResolveRethinkDebateRound`；choicesOrder=`scenario-participant-order`，precombatOrder=`source-first-optional-rethink-then-final-selection-removal-then-other-optional-rethink-then-final-selection-removal`，orderedIdsMeaning=`first-then-other-precombat-processing-order`，interactivePhasePersistence=false。
- randomness.id=`provided-phased-debate-draws-no-topic-repair-v1`；rethinkDrawCount=0，rethinkZeroDrawScope=`admitted-provided-tape-without-deck-regeneration-or-topic-repair`，maxDrawsPerRound=2。两种 draw 及顺序仍是 psychological-damage-jitter、sophistry-topic-reroll。
- rethink.id=`provided-tape-precombat-rethink-v1`；action=`ResolveRethinkDebateRound.rethinks`，separateCommand=false，combatCard=false，maxRequestsPerRound=2，duplicateRequests=`duplicate-rethink-participant`，requestOrder=`input-order-immaterial`，auditOrder=`source-first-then-other-among-requested`，auditSequence=`compact-zero-based-audit-index`，availabilityCheck=`all-requested-participants-before-any-replacement`。
- rethink.initiallyAvailable=true，availabilityAfterUse=false，discard=`entire-current-playable-hand`，replacement=`fill-playable-capacity-from-same-next-tape-cursor`，finalSelection=`replacement-token-for-requester-current-hand-token-otherwise`；reenable=`nonterminal-crumble-level-change-at-folded-next-turn-start`，ordinaryRoundReset=false，terminalReset=false，exposedAvailableAction=true。
- closing.id=`session-result-only-closing-with-rethink-v1`；priority=[precombat-rethink-and-selection,attack,additional-effects,hp-defeat,unsupported-anger-trigger,crumble,topic-and-first,next-turn-start-rethink-availability,refill]，terminalRethinkReset=false。terminalEffects=true；terminalRefill、terminalTopicChange、terminalTopicDraw、terminalFirstChange 仍为 false。

evidence 新增 rethinkEvidence=`pinned-modern-translated-reference-only`，rethinkEvidenceScope=`normal-non-tutorial-generic-precombat-provided-tape-no-topic-repair-subset`。rhetoric=`shout-ignore-compose-agitate-sophistry-combat-with-precombat-rethink-action`；rethinkAvailability=`modern-controlled-UI-guard-engine-admission-not-native-unconditional-Rethink-guard`；rethinkReenable=`modern-nonterminal-crumble-level-change-folded-next-TurnStart`；rethinkSequence=`atomic-engine-orchestration-source-first-rethink-selection-removal-then-other`；rethinkPhysicalSlotRemoval=`excluded-capacity-metadata-only`；topicGuarantee=`provided-tape-admissibility-after-every-fill-modern-source-RandInt9-repair-excluded`；rethinkRandomness=`zero-additional-supplied-draws-only-in-admitted-no-deck-regeneration-no-topic-repair-subset`。

新合同必须明确区分：

- 六类战斗牌，与出牌前再考操作。不存在第七种 card kind 或再考 power。
- 正常非教程、无愤怒子集，与教程、性格、愤怒自动反制及原作完整流程。
- 来源 first/other 的再考→最终选择顺序，与原子双选命令的工程组织、scenario 顺序及 winner/loser Effect 顺序。
- canRethink 初始 true、使用 false、仅非终局崩坏等级变化恢复，与错误的“每轮自动恢复”或“使用再考立即允许重用”。
- 牌带整手 replacement 与原作随机发牌；每次 fill 的 topic 边界与来源强制话题修补。此 API 明确拒绝需修补的无 topic fill，不实现其 `RandInt(9)`。
- 真正调用的 Effect、反射请求依据和 writer target，与受抑制或无 writer 的 null 审计。
- Attack jitter、诡辩 topic reroll 与来源发牌/强制修补 RNG。这里只接受前两种显式原始整数。

固定现代来源 commit=`a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef`；Debate.cs blob=`0137498d10773cd4596d497083ccdf6a26b3a261`，DebatePhase.cs blob=`6aa98f855a5d4d172cde7e8ffc18a141b8a7b587`，DebateEnum.cs blob=`5b46a8ac87613193eb9f4b99a25e489ba6f5e483`。再考初始、使用与崩坏恢复的精确来源及 UI guard 限制见规则页；现代源码注释提及原 C++ 玩家侧漏判断，不将该注释当作本 API 放宽 canRethink 或已经复刻原作漏判的授权。

sourceIdentity=`modern-CSharp-translation-not-native-or-Vanilla`；`nativeEquivalent:false,stockOriginalVerified:false,pkEquivalent:false,vanillaEquivalent:false,completeDebate:false,originalUnresolvedGroups:43`。E15 仅支撑普通通用核心，不升级为再考、话术、反射、原生随机发牌或完整舌战证据。原43组/45历史快照不因这个子集清零。

完整 policy/evidence 也进入预算及保存重算。变更字面值须另定版本或显式迁移，不得原地改字符串继续 load 旧存档。旧 profile 的证据作用域和政策不随新 profile 改写。

## 4. 当前全部失败原因与 index

| reason | 条件 |
|---|---|
| malformed-data / unknown-field | 非安全 plain 输入、缺键、非法整数/−0、稀疏 array/非法描述符、JSON 解析失败；或未登记键 |
| unsupported-runtime | 缺少安全 Proxy 探测的内建入口 |
| unsupported-profile | schemaVersion/profile/difficulty/tag 不符，包括旧 session |
| unsupported-policy / evidence-mismatch | 完整 policy/evidence 不等于固定合同 |
| unsupported-person / unsupported-item | genericOnly 错误、非法 ID、personId/person/personHooks/characterId，或 items/item/equipment/weapon/sword 等字段 |
| unsupported-initial-state | 初局不是 HP1000/stress0/angerTimer0 |
| unsupported-card / unsupported-action | 缺/未知 card kind、非法 topic/level，或命令不是 ResolveRethinkDebateRound |
| duplicate-participant / invalid-challenger | scenario/choices 人员重复，或 challenger 不是本场二人之一 |
| invalid-token / duplicate-token / not-in-hand / invalid-choice-order | token 格式/重复、最终选择时不在本人的当前 hand、choices 不按 scenario 顺序 |
| invalid-rethink-participant | rethinks 中的参与者不属于本场 |
| duplicate-rethink-participant | rethinks 重复请求同一参与者 |
| rethink-unavailable | 请求者 canRethink=false |
| stale-revision / stale-round / stale-first | expected 值与当前 snapshot 不符 |
| session-finished | 终局后仍请求推进，包括仅想再考 |
| draw-shape / draw-range | rawDraws 数量、阶段 role/bound/顺序不符，或结构通过后的 value 不在对应0..4/0..2 |
| unsupported-anger-trigger | 所有 Effect 后没有 HP 终局且 stress 达100；整轮拒绝，尚未要求的 topic draw 缺项不覆盖此错误 |
| deck-exhausted | genesis、整手再考或非终局 fill 需要的牌带不足 |
| unsupported-topic-repair | genesis、整手再考或非终局 fill 后无 topic，需要本 profile 不实现的来源强制修补 |
| history-limit | 条数、牌带、字节、节点或深度任一预算超限 |
| invalid-genesis / receipt-mismatch / snapshot-mismatch | 初局、某条完整 receipt 或最终 snapshot 不等于重算 |

rethinks 必须为数组且长度至多2，领域形状错误为 malformed-data；合法 ID 语法仍按通用 ID 校验，不能将非法类型/语法都改报 invalid-rethink-participant。极端数组也先受通用安全分离预算限制。此表不承诺任意多错误组合的优先级。

安全分离先于领域解析；例如 −0 为 malformed-data 而非 draw-range，人物/物品禁用字段可先于一般 unknown-field。来源执行顺序不是安全检查可被省略的理由。

- create 与直接 preview/execute 的新命令错误通常 index=null，包括新的再考/修补错误。
- inspect/save/load/preview/execute 先安全分离整个 session；能定位的 entries 内部结构错误为0-based index，外层/array 描述符错误可能 null；后面 entry 的非法 accessor 可早于前面 entry 的语义错误。
- 安全结构通过后按历史顺序重算，首个失败 entry 为0-based index；最终 snapshot-mismatch 为 null。完整再考审计、可用性、手牌、cursor、Effect、damage 与 draw 都比较，不仅对结果数值验和。
- replay 先处理 scenario 与外层 commands 列表；这些失败 index=−1。之后逐条分离、parse、append，首个失败命令为0-based index，不预先解析后来命令内部值来覆盖较早错误；外层洞、非法属性与长度仍可先报−1。
- 所有失败均无 partial 返回，不修改原 session 的牌带、hand、弃牌、canRethink、HP/stress、cursor、topic、first、日志或计数。私有拟议状态已执行部分操作不表示留下半轮；命令显式 draw 是输入数据，不会推进外部 RNG。

## 5. 安全输入、资源预算与运行时边界

仅接收 Object.prototype 或 null 原型 record、标准 Array 和合法 JSON 式标量；字段必须为可枚举数据属性。拒绝 Proxy、getter/setter、函数、undefined、外部 BigInt、Symbol、Date/custom prototype、循环、稀疏数组、额外 array 属性、非枚举 record 字段。不会调用调用者的 getter、toJSON 或 custom iterator。

Proxy 检测依赖 `process.getBuiltinModule('node:util').types.isProxy`；缺失时 fail-closed 返回 unsupported-runtime，不做不安全降级。内部精确 bigint 不允许外部 DTO 携带 BigInt。可擦除 TS 语法不代表本批已经验证任何 Node/浏览器版本。

| 预算 | 上限 |
|---|---:|
| entries / replay 命令数 | 4096 |
| 每方 cardTape | 512 |
| canonical 完整 session UTF-8 bytes | 16,777,216 |
| 值节点 / 嵌套深度 | 1,000,000 / 32 |

安全分离与最终拟议输出均受预算约束；通用 array 长度另限4096，再按领域收紧。load 也限制原始 JSON 文本字节；replay 累计 commands 输入预算。完整 policy/evidence、每条 receipt、再考弃牌与 replacement、Effect/反射/话题审计都计入，不是只算命令数。

inspect.remainingEntryCapacity=4096−entryCount 仅表示条数剩余；牌带、字节、节点、无 topic fill 或 stress 边界可能更早到达。再考一次耗掉完整新手牌的牌带容量，不应将每轮消耗误算为始终一张。preview 与实际 append 的预算相同，不可绕过；预算超限是拒绝，不是游戏平局。

## 6. 保存、完整重放与调用方接入

save 对完整 session 重算后返回 canonical JSON：对象键排序、数组保序，无函数、RNG 或外部引用。load 只收字符串，接受等价对象键序；核 tag/policy/evidence，重建 genesis，按每个 entry 重新执行命令、比较完整 receipt，最后比较 snapshot。

inspect/preview/execute/save 同样重算，不只 load 校验。以下均不被信任：外部 attack、cursor、canRethink、hand、winner、damage、净/阶段 stress、Effect 的 actor/basis/target/reflection/status/invoked/null 字段与顺序、再考请求/弃牌/replacement/顺序/动作局部可用性、崩坏后可用性、话题阶段与原始 draw 消耗。仅有正确的最终 snapshot 不构成有效存档。

输入 rethinks 数组顺序可不影响领域执行结果，但它本身仍是持久化命令内容，不能在保存/重放比较时忽略或重排。存档未签名、未加密，不能证明来自原作或防止构造内部一致的虚构历史。

调用方先判 ok；execute 成功后采用返回的新 session。save 成功 json 再交 load。只把纸面材料里的 scenario 交 create，或 scenario 与 commands 交 replay；说明、手算预期、拒绝候选不是 scenario 字段，也不是已运行生成的 receipt/存档。本文不实际调用这些 API。

### 6.1 五轮纸面接纳

[纸面场景](../../data/scenarios/rethink-debate-example-v1.json) 的双方 INT60、attack100，初始 topic=story、first=beta、HP1000/stress0、canRethink=true。初始双方 token0/1/2 都是 story-small；所有 topic 牌均为 story。A/B 分别为 alpha/beta；具体牌带与完整命令以场景文件为准。

下面全部是**手工推导、未执行**，不是运行 receipt。每轮 rawDraws 均只有 jitter0，五轮均无诡辩话题 draw。

| 轮次 | rethinks 输入；实际审计顺序 | A / B 最终选择 | 轮后 A HP/stress/canRethink | 轮后 B HP/stress/canRethink | A/B cursor；轮后 first |
|---|---|---|---|---|---|
| 1 | `[alpha,beta]`；beta→alpha | A3 story-large / B3 story-small | 1000/0/false | 800/20/false | 7/7；alpha |
| 2 | `[]`；无 | A4 story-large / B4 story-small | 1000/0/false | 600/40/true | 8/8；alpha |
| 3 | `[beta]`；beta，sequence0 | A5 story-small / B8 story-large | 800/20/false | 600/40/false | 9/12；beta |
| 4 | `[]`；无 | A6 story-small / B9 story-large | 600/40/true | 600/40/false | 10/13；beta |
| 5 | `[alpha]`；alpha，sequence0 | A10 Compose / B10 story-small | 500/50/true | 600/10/false | 14/14；beta |

五轮话题始终 story。第1轮请求数组是 scenario 顺序，但操作先 beta 再 alpha，各丢0/1/2、补3/4/5、选3、轮末补6；两人 canRethink 都变 false。beta HP800 尚未跨崩坏阈值，不会每轮自动刷新。

第2轮 beta HP800→600，crumble0→1，故恢复 true；alpha 没有崩坏变化仍 false。第3轮 first=alpha，alpha 先选旧牌5，随后 beta 才再考，丢5/6/7、换8/9/10、选8并轮末补11；beta action-local cursor8→11，整轮 Change cursor8→12。唯一再考审计 sequence0，不是1。alpha HP1000→800 尚不刷新。

第4轮 alpha HP800→600、crumble0→1，恢复 true；beta 仍 false。第5轮 first=beta，beta 先选10；alpha 再考丢7/8/9、换10/11/12，选 Compose10。beta 的 story-small 请求 HP伤害100、stress10，使 alpha HP600→500、stress40→50；随后 alpha Compose 的请求依据是 beta 当前stress40，请求−30并作用于 beta，beta40→10。alpha crumble1→2，故同轮使用的再考再次恢复为下一轮可用。

第5轮 alpha 再考审计 canRethink=true→false，但 Change=true→true；不能据最终 true 否认本轮用过，也不能据动作局部 false 丢掉崩坏恢复。两方轮末各补13，cursor 都为14。最终 revision/roundIndex=5，alpha hand11/12/13，beta hand11/12/13，first=beta，topic=story。

### 6.2 两个独立拒绝候选

纸面示例将失败候选与五条成功 commands 分开，不把拒绝动作伪装成第六条成功 entry：

- 第1轮成功后的独立下一轮候选请求 alpha 再考。alpha.canRethink=false，返回 rethink-unavailable；不能从牌带再发一手，也不能自动给它刷新资格。该候选不是上述成功第2轮。
- 第5轮成功后的独立第6轮候选请求 beta 再考。beta.canRethink=false，返回 rethink-unavailable；保留第5轮的两手牌、cursor14、HP/stress、first/topic、可用性和 revision/roundIndex5，无失败 receipt。

直接 preview/execute 新候选时 index=null。若将第1个候选接在第1条成功命令后交 replay，失败 index=1；若将第二个接在五条成功命令后，失败 index=5，均不返回前缀 partial session。可用性检查先于请求的再考取牌，但本文不以多错输入宣称更广的错误优先级。

## 7. 未执行与不支持声明

本批仅静态读源、文字编辑与纸面推导；没有运行测试、typecheck、编译、build、checker、validator、诊断、项目代码、产品或示例。七个公开函数及重放流程是接口描述，不是执行报告。新增导出不表示过去验证数字覆盖本批。

本 profile 不覆盖 P078 及全部依赖，不宣称 PC/PK/Vanilla/主机或完整舌战等价；不实现教程状态机、愤怒/愤激/性格/持有牌自动反制、人物/书籍、原作随机发牌、强制话题 RandInt(9) 修补、显示排序、开场/追击或 campaign 结果。

已纳入的是所列六类战斗牌、其支持的反射和非教程话题重抽，以及有明确可用性与来源顺序的再考整手替换。再考仍使用提供牌带及原子轮的工程边界，不能把“没有额外 rawDraw”写成“与原作再考的随机链等价”。任何未知卡牌、额外消费或状态写入仍被拒绝，原作缺口也不会因该独立子集清零。
