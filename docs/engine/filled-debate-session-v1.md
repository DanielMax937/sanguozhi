# 当前18张牌组与填牌修补独立舌战 API v1

[规则与来源边界](../rules/filled-debate-session-v1.md) · [完整固定政策与证据](../sources/filled-debate-session-v1.json) · [五轮纸面场景，未运行](../../data/scenarios/filled-debate-example-v1.json)。

实现入口：[filled-debate.ts](../../packages/engine/src/filled-debate.ts)。本页描述独立 profile=`debate-filled-current-deck-reference-v1`、tag=`filled-debate-session-v1`。它把 [PR111 填牌内核](debate-hand-fill-v1.md) 接入初局、出牌前再考及非终局补牌，并复用 [PR110 六类战斗与再考](rethink-debate-session-v1.md) 的普通难度、非教程、通用身份、无愤怒战斗语义。

旧七个 session 的 profile、对象牌 DTO、政策、证据和存档合同保持独立；没有隐式升级或格式迁移。尤其旧 Rethink 的 `unsupported-topic-repair` 边界没有被新 profile 放宽。再考仍是可选前置操作，不是第七类战斗牌；保留码0不是可选战斗 token。

本文及配套场景仅为静态读源、文本编辑与纸面推导。没有运行候选 API、示例、replay、测试、typecheck、编译器、build、validator 或诊断，不声称运行时已验证。

## 1. 公开接口与采用结果

全部参数为 `unknown`，由入口安全分离并严格检查。全部成功/失败结果与常量递归冻结；不修改或冻结调用者输入。

| 函数 | 参数 | 成功值 |
|---|---|---|
| `createFilledDebate` | scenario | `{ok:true,session}` |
| `inspectFilledDebate` | 完整 session | `{ok:true,inspection:{snapshot,policy,evidence,entryCount,remainingEntryCapacity,canonicalUtf8Bytes}}` |
| `previewFilledDebateRound` | 完整 session, command | `{ok:true,preview:{receipt,projectedSnapshot,policy,evidence,externalRngConsumed:0}}` |
| `executeFilledDebateRound` | 完整 session, command | `{ok:true,session,receipt}` |
| `saveFilledDebate` | 完整 session | `{ok:true,json}` |
| `loadFilledDebate` | JSON 字符串 | `{ok:true,session}` |
| `replayFilledDebate` | scenario, commands 数组 | `{ok:true,session}` |

固定常量为 `FILLED_DEBATE_POLICY_V1:FilledDebatePolicyV1` 与 `FILLED_DEBATE_EVIDENCE_V1:FilledDebateEvidenceV1`。preview/execute 的函数名带 `Round`，没有无后缀别名。统一失败为 `{ok:false,reason:string,index:number|null}`，不返回 partial session、部分 fill 或失败 receipt。

调用者只在 `ok:true` 后采用返回的新 session。preview 与 execute 都对完整拟议追加历史应用相同的重算、领域检查及预算；preview 只返回 receipt/projectedSnapshot，不返回拟议 session。inspect/save/load 也重算历史，不信任现成 snapshot。所有 API 均不调用 RNG；提供式 draw 是输入数据，成功或失败都不推进外部随机源。

## 2. 输入合同、牌码与身份

以下代码块只展示 DTO，省略递归 `readonly`；不是建议执行的示例。`Pair<T>` 表示恰好两项、保序的 tuple。复合公开类型为 `FilledDebate*V1` 族。

### 2.1 数值牌、参与者与初局

```ts
type CardCode = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14;
type Topic = 'story' | 'logic' | 'trend';
type Occurrence = { cardCode: CardCode; token: string; tapeIndex: number };
type Participant = {
  id: string; resolvedIntelligence: number;
  hp: 1000; stress: 0; angerTimer: 0;
  cardTape: CardCode[];
};
type Scenario = {
  schemaVersion: 1;
  profile: 'debate-filled-current-deck-reference-v1';
  genericOnly: true; difficulty: 'source-normal';
  policies: FilledDebatePolicyV1;
  challengerId: string; initialTopic: Topic;
  participants: Pair<Participant>;
  genesisRawDraws: RawDraw[];
};
type RepairDraw = {
  role: 'debate-fill-topic-repair'; bound: 9; value: number;
  participantId: string; phase: 'genesis' | 'rethink' | 'refill';
};
```

牌码映射固定：1/2/3=故事小/中/大，4/5/6=道理小/中/大，7/8/9=时节小/中/大，10=大喝，11=诡辩，12=无视，13=镇静，14=激昂。0仅为填牌内核恢复的再考保留槽；不能出现在参与者 cardTape 或可选 occurrence 中。

两人 ID 不同且匹配 `[A-Za-z][A-Za-z0-9_-]{0,63}`；challengerId 必须属于其中一人，并成为初始 firstId。INT 为1..100，HP/stress/angerTimer 初值严格为1000/0/0。每方 `cardTape` 必须**恰好18项**，整副当前牌组均检查，包括尚未发到的后缀；不能提供仅剩牌段、任意长未来牌流或旧对象牌模板。输入不认证原生配比、生成概率或洗牌来源。

INT<70、70..79、80..89、90..100 对应 playableHandCapacity=3/4/5/6；sourceSlotCount 再加1。初始 cursor=0，不接收任意中局手牌、游标、攻击、人物/物品 hook、性格、canRethink 或生成器。

每次从当前牌组发牌后生成 `token=participantId:tapeIndex`，tapeIndex 为0..17。token 不因排序、保留、选择压紧或话题修补改变；修补只改该 occurrence 的 `cardCode`，原牌组、tapeIndex 和已消费项不变。相同牌码不是同一 occurrence，不能合并、重新编号或回收弃牌。

`genesisRawDraws` 的公开字段类型是 RawDraw[]，但领域接纳只允许实际需要的初局修补。它必填、至多两项，按 scenario 参与者0→1顺序消费；不是第0轮 command.rawDraws，也不占任一回合 drawIndex。无修补须为 `[]`；不得省略、自动补 draw 或在初局携带战斗/回合末抽样。

所有键均必填且只能使用登记字段；不补默认值。所有数值是安全整数且不能为 −0。完整 policies 必须与固定常量逐字段匹配，不只匹配 id；对象键序不影响相等，数组内容与顺序有意义。

### 2.2 每轮命令

```ts
type Selection = { participantId: string; cardToken: string };
type RawDraw =
  | RepairDraw
  | { role: 'psychological-damage-jitter'; bound: 5; value: number }
  | { role: 'sophistry-topic-reroll'; bound: 3; value: number };
type Command = {
  type: 'ResolveFilledDebateRound';
  expectedRevision: number; expectedRoundIndex: number; expectedFirstId: string;
  rethinks: string[];
  choices: Pair<Selection>;
  rawDraws: RawDraw[];
};
```

expected 计数为0..64，必须与当前 snapshot 匹配，expectedFirstId 亦同。rethinks 必填，长度0..2，只能列本场不重复且当前可再考的参与者。先检查所有请求者可用性，再开始任何 replacement；请求数组顺序不决定动作顺序，但原输入顺序仍写入 receipt.command。

choices 必须按 scenario 参与者0→1顺序，不能改成 first/other 顺序。实际前置处理按轮开始 firstId→other：该方若请求再考，先弃全手并填满，然后选择并移除其最终战斗牌，才处理另一方。请求再考者须选择 replacement 中的 token；否则选择自己的现有 hand。不能提前用旧手牌验证再考后的选择，也不能跳过最终出牌。

cardToken 的语法是合法 ID、冒号与规范十进制0..99；实际只能选当前本人手中的0..17发牌索引。语法可通过的未发、已弃、已消费、对方或越出当前18项的 token 仍不能选，不接受卡牌模板替代 token。

再考不独立推进 revision/roundIndex，不改变 HP/stress/话题/先手/攻击；动作局部将 canRethink=true→false。成功非终局只在崩坏层变化时于折叠的下一轮开始恢复 true，非每轮重置。没有可单独保存的“已再考、尚未选牌”状态。

## 3. 三处实际填牌与严格抽样顺序

初局、再考 replacement、非终局补牌均实际调用既有 `evaluateDebateHandFill`，不是另写一个同名模拟结果。内核的完整输入/审计、数字排序和修补条件见 [填牌 API](debate-hand-fill-v1.md)。

session 适配步骤为：

1. 初局/再考从空手建立容量个 `null`；普通补牌则保留选择移除后已经压紧的 hand，并在**尾部**补 `null` 至容量。不会把已选牌原位置保留为内部洞。
2. 把保留 occurrence 的 cardCode、当前完整18项 cardTape、cursor 交给内核。内核恢复0槽，按原槽升序填空位。
3. 仅当填完仍无1..9且本次确实新增槽时，消费该参与者、该 phase 的 bound9 draw，覆盖最后新增原槽为 `1+value`。修补不多取牌，不回退 cursor，不覆盖最后保留牌或排序后末牌。
4. 内核按数字码升序排序。session 根据 sortedProvenance 把 retained 槽映回原 occurrence，把 tape 槽映到新 token，应用修补后的 face；丢弃保留0的展示项，保存可选 occurrence hand。

相同牌码按 preSortSlot 顺序审计，是确定性工程政策，不证明现代 Array.Sort 或原生物理牌身份稳定。来源槽位0与保留再考存在于嵌套 kernel receipt，不在 session.hand 中制造 token。满手无话题且无新增槽的内核分支仍是 `no-new-slot`，不是无条件补造普通牌。

空位数超出 `18-deckCursor` 时整次推进拒绝 `unsupported-deck-regeneration`。不回绕、不拼接下一副、不跳过话术扫描普通牌，也不借修补 draw 代替不足的牌组项。恰好用完第18项允许成功；终局不补牌，因此仅因 cursor 已到18不额外失败。

### 3.1 回合 rawDraws

每轮 rawDraws 至多6项，属于各阶段上限之和的保守输入限额，不声称所有六阶段 draw 能在同一可达轮中同时发生。条件式消费顺序固定：

1. first 一方再考所需的修补。
2. other 一方再考所需的修补。
3. 战斗实际需要的 psychological-damage-jitter。
4. 非终局实际需要的 sophistry-topic-reroll。
5. scenario 参与者0回合末补牌所需的修补。
6. scenario 参与者1回合末补牌所需的修补。

未请求或不需要的阶段不留占位项。每项修补除 role/bound/value 外，必须带正确 participantId 和 phase；jitter/topic draw 仍只有原三键，不接受额外 participantId/phase。repair.value 为0..8，jitter.value 为0..4，topic.value 为0..2，对应 story/logic/trend。

一次修补在嵌套 kernel receipt 中的 repair.drawIndex 固定0；外层 fill.drawIndex 是整条 genesisRawDraws 或 command.rawDraws 的全局0-based位置。回合 topicReroll.drawIndex 也使用命令全局位置，不能沿用只有战斗 draw 时的0/1假设。跳过修补的 fill.drawIndex=null，不制造虚假的 draw。

外层修补draw保留五键身份信息；传给内核及保存在kernel.consumedDraws中的对应draw只有原三键role/bound/value。participantId/phase由外层Fill承载，不篡改PR111原receipt形状。

所有已提供 draw 的安全结构和字段语法先检查；实际需不需要、属于哪个阶段及参与者，在对应阶段检查。成功必须恰好消费全部提供项。HP 终局跳过 topic reroll 和全部回合末 fill，额外的相应 draw 仍拒绝；非终局 stress100 在话题及补牌阶段前拒绝，不预消费未来 draw。

## 4. 状态与审计 DTO

### 4.1 snapshot

```ts
type ParticipantState = {
  id: string; resolvedIntelligence: number; attack: number;
  hp: number; stress: number; angerTimer: 0;
  sourceSlotCount: number; playableHandCapacity: number;
  reservedRethinkSlot: true; canRethink: boolean; crumbledLevel: number;
  hand: Occurrence[]; deckCursor: number;
};
type Outcome = { kind: 'hp-defeat'; winnerId: string; loserId: string };
type Snapshot = {
  schemaVersion: 1; profile: 'debate-filled-current-deck-reference-v1';
  revision: number; roundIndex: number; currentTopic: Topic; firstId: string;
  status: 'active' | 'finished'; outcome: Outcome | null;
  participants: Pair<ParticipantState>;
};
```

初局 revision/roundIndex=0、canRethink=true、crumbledLevel=0，成功每轮计数各加1。HP clamp −100..1000，stress clamp 0..100；active 成功态 HP>0 且 stress<100，双方手牌补满。终局手牌消费本轮选牌后不补，允许没有普通牌。cursor 为0..18，始终指下一未发牌项。

attack=`100+trunc(40*(myINT-opponentINT)/(131-myINT))`，由双方 INT 重算。非终局崩坏层为 `clamp(trunc((1000-hp)/250),0,3)`；只在层发生变化时恢复再考。终局不再算崩坏、不恢复资格、first/topic 保持轮开始值，但已经完成的前置再考仍保留在成功终局轮。

### 4.2 填牌与再考审计

```ts
type Fill = {
  sequence: number; phase: 'genesis' | 'rethink' | 'refill';
  participantId: string; drawIndex: number | null;
  beforeCards: Occurrence[]; afterCards: Occurrence[]; drawnCards: Occurrence[];
  kernel: DebateHandFillReceiptV1;
};
type Rethink = {
  sequence: 0 | 1; participantId: string;
  discardedCards: Occurrence[]; replacementCards: Occurrence[];
  beforeDeckCursor: number; afterDeckCursor: number;
  beforeCanRethink: true; afterCanRethink: false;
  fillSequence: number;
};
```

fill.sequence 是所在 genesis.fills 或 receipt.fills 数组的紧凑索引；fills 按实际发生顺序，不固定按 participant 索引。genesis 固定两条，回合先列实际再考 fill，再在非终局列参与者0/1的 refill。嵌套 kernel receipt 保留完整 policy/evidence、before/after、filled、修补前后数字手牌、修补目标、已消费 draw 和 sortedProvenance，结构不改写为新 session 的 DTO。

beforeCards/afterCards 用数值 occurrence 连接一次 fill 的前后身份；afterCards 按最终数字展示顺序，drawnCards 只列本次新发的 occurrence，按原填槽/牌组消费顺序，不含保留牌或0。kernel.filled 的 card 是修补前发牌码，session occurrence 的 cardCode 则是修补后的 face，不能以二者不同认定 token 已改变。

初局与再考fill.beforeCards=[]；再考已弃旧手单列于Rethink.discardedCards。普通refill.beforeCards则是选择移除后压紧的保留手，kernel.before.playableSlots在其牌码后补尾部null。Rethink.replacementCards取排序后的整手，不等同于按发牌顺序排列的fill.drawnCards。

rethinks 只列实际请求者，按 source-first 顺序，sequence 是其自身紧凑索引。仅 other 再考时 sequence 仍0。fillSequence 指向本轮对应 fill；replacementCards 包含随后可能立即选出的牌，action-local cursor 在 replacement 后、最终选牌前截取。afterCanRethink=false 描述动作局部，即使同轮非终局崩坏令最终状态恢复 true，也不能抹去本次使用记录。

### 4.3 共用战斗审计与整轮变化

`plays`、`damage` 和 `effects` 复用 PR110 的语义牌审计，牌面是 `{kind:'topic',topic,level}` 或对应话术 `{kind}`，再带原 token/tapeIndex，**不是数值 occurrence**。数值与语义映射只发生在内部战斗适配，不改变旧 DTO。完整封闭分支见 [PR110 API §2.6–2.8](rethink-debate-session-v1.md#26-play-与-damage)；精确结构别名如下，而非允许任意 record：

```ts
type FilledDebatePlayV1 = RethinkDebatePlayV1;
type FilledDebateDamageV1 = RethinkDebateDamageV1;
type FilledDebateEffectV1 = RethinkDebateEffectV1;
type FilledDebateOutcomeV1 = RethinkDebateOutcomeV1;
```

共同结构与含义：

- Play：`{participantId,card,attack,power,matchesCurrentTopic}`。普通 power=1..3，匹配轮开始话题另加10；大喝110、无视120、诡辩20、镇静/激昂0。等 power 必为平局，不以 firstId 破平。
- Damage：`sourceId,cardOwnerId,targetId,attack,jitter,angerCoefficient:10,levelCoefficient,topicCoefficient,roundStartTopic,requestedHpDamage,requestedStress`，再与 `kind:'topic'|'shout'|'reflected-topic'` 的 sourceCard/card/reflected/writer/positiveHpGuard/writerApplied 分支相交。无视、平局及诡辩胜镇静/激昂时为 null。
- StressStage：`{beforeStress,requestedStress,afterStress,actualStressDelta}`，数值全为 number。请求不等于 clamp 后差值。
- Effect：公共 `sequence:0|1,actorId,opponentId`，分 applied compose、applied agitate、no-additional-effect、suppressed-by-ignore。仍完整保留 invoked、targetId、reflected、requestBasisId/requestBasisStress、requestedStress、beforeStress/afterStress/actualStressDelta 的 PR110 联合与 null 语义。

战斗顺序仍为 Attack→胜者 Effect→败者 Effect→HP终局→非终局愤怒边界→崩坏→话题/先手。无视抑制败者 Effect；平局 effects=[]，双方各请求stress+15。镇静请求始终按其对手当前 stress 求 `-max(trunc(stress/2),30)`，反射只改 writer target；激昂请求+40。逐次 writer clamp，不能拿净请求代替。败者已 HP<=0 仍先执行其未受抑制 Effect，然后才结算终局。

HP 请求仍为 `trunc((attack+jitter)*10*levelCoefficient*topicCoefficient/1000)`，内部精确 bigint、除法向零。诡辩胜普通牌使用诡辩方 attack 和败方普通牌系数，反射给败方，正HP伤害 guard 同时控制其HP和Attack stress写入。非终局诡辩即使败给大喝仍重抽话题；对手无视、等 power 或终局不重抽。

```ts
type Change = {
  participantId: string;
  beforeHp: number; afterHp: number; requestedHpDamage: number; actualHpDelta: number;
  beforeStress: number; afterStress: number; requestedStress: number; actualStressDelta: number;
  attackStress: StressStage; effectStress: StressStage;
  beforeCanRethink: boolean; afterCanRethink: boolean;
  rethinkRefreshReason: 'crumble-level-changed' | 'no-crumble-change' | 'terminal-no-next-turn';
  beforeCrumbledLevel: number; afterCrumbledLevel: number;
  consumedCard: Occurrence; refilledCards: Occurrence[];
  beforeDeckCursor: number; afterDeckCursor: number;
};
type TopicReroll =
  | { status: 'applied'; drawIndex: number; rawValue: number;
      beforeTopic: Topic; afterTopic: Topic; sophistryOwnerId: string; opponentId: string }
  | { status: 'skipped';
      reason: 'terminal' | 'equal-card-power' | 'no-sophistry' | 'opponent-ignore' };
```

Change 横跨整轮，cursor 差包含再考和回合末 fill；refilledCards 只含回合末新牌，replacement 单列。终局 refilledCards=[]，但若本轮先再考，cursor仍可增加。consumedCard 为最终选择的数值 occurrence。requestedStress 按实际 target 汇总已评估的 Attack/Effect 请求，不把 suppressed 的 null 算成假想请求。

plays/changes 按 scenario 顺序；orderedIds 为轮开始 first/other；rethinks/fills 为实际动作顺序；effects 为胜/败审计顺序。这些顺序不可互换。

### 4.4 receipt、genesis、entry 与 session

```ts
type Receipt = {
  schemaVersion: 1; profile: 'debate-filled-current-deck-reference-v1';
  command: Command; policy: FilledDebatePolicyV1; evidence: FilledDebateEvidenceV1;
  beforeRevision: number; afterRevision: number;
  beforeRoundIndex: number; afterRoundIndex: number;
  beforeFirstId: string; afterFirstId: string; beforeTopic: Topic; afterTopic: Topic;
  orderedIds: Pair<string>; rethinks: Rethink[]; fills: Fill[];
  plays: Pair<FilledDebatePlayV1>; result: 'winner' | 'draw'; roundWinnerId: string | null;
  damage: FilledDebateDamageV1 | null; effects: FilledDebateEffectV1[];
  effectOrder: 'winner-then-loser-audit-slots' | 'none-equal-card-power';
  effectSkipReason: 'equal-card-power' | 'ignore-suppresses-loser-effect' | null;
  changes: Pair<Change>; consumedDraws: RawDraw[];
  attackDrawCount: 0 | 1;
  attackNoDrawReason: 'equal-card-power' | 'ignore-no-hp-damage' | 'sophistry-opponent-not-topic' | null;
  topicDrawCount: 0 | 1; fillDrawCount: number; drawCount: number;
  topicReroll: TopicReroll;
  terminal: boolean; crumbleEvaluated: boolean; refillApplied: boolean; outcome: Outcome | null;
};
type Genesis = { scenario: Scenario; snapshot: Snapshot; fills: Fill[]; consumedDraws: RawDraw[] };
type Entry = { command: Command; receipt: Receipt };
type Session = {
  tag: 'filled-debate-session-v1';
  policy: FilledDebatePolicyV1; evidence: FilledDebateEvidenceV1;
  genesis: Genesis; snapshot: Snapshot; entries: Entry[];
};
```

回合 fillDrawCount 统计该轮所有实际修补，包含再考及非终局 refill，不包含 genesis。drawCount=attackDrawCount+topicDrawCount+fillDrawCount=consumedDraws.length；成功 consumedDraws 与 command.rawDraws 全字段、顺序一致。无 jitter 时 attackNoDrawReason 解释战斗阶段，不表示整轮无 fill/topic draw。相同话题重抽仍为 applied。

终局 terminal=true、crumbleEvaluated/refillApplied=false、topicDrawCount=0；fills 仍可能含已发生的前置再考 fill，不能把终局 fills 固定写成[]。非终局三者反向：terminal=false、crumbleEvaluated/refillApplied=true。无视胜的 damage=null、result=winner；平局 roundWinnerId=null、effects=[]，两者仍可能需要 fill 修补。

### 4.5 全部公开类型名称与结果类型

除 §4.3 的共用语义牌别名外，本页短名与导出名逐一对应：

| 本页短名 | 精确导出名 |
|---|---|
| Topic / CardCode / Occurrence | FilledDebateTopicV1 / FilledDebateCardCodeV1 / FilledDebateCardOccurrenceV1 |
| Participant / ParticipantState / Scenario / Snapshot | FilledDebateParticipantV1 / FilledDebateParticipantStateV1 / FilledDebateScenarioV1 / FilledDebateSnapshotV1 |
| Command / Selection / RepairDraw / RawDraw | FilledDebateCommandV1 / FilledDebateSelectionV1 / FilledDebateRepairDrawV1 / FilledDebateRawDrawV1 |
| `'genesis'\|'rethink'\|'refill'` / Fill / Rethink | FilledDebateFillPhaseV1 / FilledDebateFillV1 / FilledDebateRethinkV1 |
| StressStage / Change / TopicReroll / Receipt | FilledDebateStressStageV1 / FilledDebateChangeV1 / FilledDebateTopicRerollV1 / FilledDebateReceiptV1 |
| Entry / Genesis / Session | FilledDebateEntryV1 / FilledDebateGenesisV1 / FilledDebateSessionV1 |

没有新导出的语义 `FilledDebateCardV1`、Level、各kind模板或 CombatDraw；需要语义牌结构时使用上文精确共用类型，不把它与数值 CardOccurrence 混用。FilledDebatePolicyV1 / FilledDebateEvidenceV1 分别是源码固定 POLICY/EVIDENCE 的递归 readonly 类型，不是可配置 map。

```ts
type FilledDebateFailureV1 = { ok: false; reason: string; index: number | null };
type FilledDebateSessionResultV1 =
  | { ok: true; session: FilledDebateSessionV1 } | FilledDebateFailureV1;
type FilledDebateExecuteResultV1 =
  | { ok: true; session: FilledDebateSessionV1; receipt: FilledDebateReceiptV1 }
  | FilledDebateFailureV1;
type FilledDebatePreviewResultV1 =
  | { ok: true; preview: {
      receipt: FilledDebateReceiptV1; projectedSnapshot: FilledDebateSnapshotV1;
      policy: FilledDebatePolicyV1; evidence: FilledDebateEvidenceV1; externalRngConsumed: 0;
    } }
  | FilledDebateFailureV1;
type FilledDebateSaveResultV1 = { ok: true; json: string } | FilledDebateFailureV1;
type FilledDebateInspectionResultV1 =
  | { ok: true; inspection: {
      snapshot: FilledDebateSnapshotV1; policy: FilledDebatePolicyV1; evidence: FilledDebateEvidenceV1;
      entryCount: number; remainingEntryCapacity: number; canonicalUtf8Bytes: number;
    } }
  | FilledDebateFailureV1;
type FilledDebateReplayResultV1 = FilledDebateSessionResultV1;
```

以上同样省略递归 readonly。load 返回 SessionResult；replay 也返回完整 session，receipts 已在 entries 中，不另返回前缀或收据列表。reason 的公开类型是 string，不是封闭错误枚举。

## 5. 保存、失败与预算

完整 session 保存固定 tag、policy/evidence、genesis、当前 snapshot 与全部 entries。genesis 保存 scenario、重算初局 snapshot、两方 fills 与 consumedDraws；entry 保存 command 与完整 receipt。不能只交 snapshot、初局净手牌或省略嵌套 fill 审计。

save 返回对象键排序、数组保序的 canonical JSON。load 仅收字符串，校验完整政策/证据，重新填牌构建 genesis，比较完整初局审计，再逐条重算并逐字段比较 receipt，最后比较 snapshot。inspect/preview/execute/save 同样走完整历史重算。外层或嵌套 policy/evidence、修补前牌码、稳定 token、draw 归属/顺序/global index、再考资格和最终 hand 均不是可信外部输入。

存档未签名、未加密，不证明来自原作或防止构造内部一致的虚构历史。旧 profile/tag、旧对象牌输入或删减审计的存档不能自动迁移；版本或固定合同变化需新的明确合同。

失败是原子拒绝：不提交任一已拟议再考、发牌、修补、选择、伤害、Effect、资格恢复、cursor、话题、first、计数或日志；不给可继续使用的前缀 session。预算耗尽与来源牌组再生成边界均不是“游戏平局”。

### 5.1 当前失败原因与 index

| reason | 条件 |
|---|---|
| `malformed-data` / `unknown-field` | 缺键、非法类型/整数/−0、不安全对象或描述符、JSON解析失败；或出现未登记键 |
| `unsupported-runtime` | 缺少安全 Proxy 检测入口，拒绝不安全降级 |
| `unsupported-profile` | schemaVersion、profile、difficulty 或 tag 不符 |
| `unsupported-policy` / `evidence-mismatch` | 完整固定政策或外层证据不匹配 |
| `unsupported-person` / `unsupported-item` | 非 genericOnly、非法 ID，或 personId/person/personHooks/characterId、items/item/equipment/weapon/sword 等被排除字段 |
| `unsupported-initial-state` | 初值不是 HP1000、stress0、angerTimer0 |
| `invalid-card-tape` / `unsupported-card-code` | 当前牌组不是恰好18项数组，或安全分离后的牌码不在1..14 |
| `unsupported-card` / `unsupported-action` | initialTopic非法或共用战斗遇不支持牌种；命令不是 ResolveFilledDebateRound |
| `duplicate-participant` / `invalid-challenger` | scenario/choices 人员重复，或 challenger 不属于本场两人 |
| `invalid-token` / `duplicate-token` / `not-in-hand` / `invalid-choice-order` | token格式、重复、最终选择时不在本人手中，或 choices 未按 scenario 顺序 |
| `invalid-rethink-participant` / `duplicate-rethink-participant` / `rethink-unavailable` | 再考请求者不属于本场、请求重复或不可用 |
| `stale-revision` / `stale-round` / `stale-first` | expected 值与当前 snapshot 不符 |
| `session-finished` | 请求推进已终局 session，包括只想再考 |
| `draw-shape` | draw数组形状/最大数量、实际所需战斗role/bound/顺序，或修补role/participantId/phase不符；也包括战斗阶段缺少所需draw |
| `draw-range` | 实际消费的战斗draw为安全整数，但不在jitter0..4或topic0..2 |
| `missing-raw-draw` | 内核确认本次需要修补，但全局流没有下一项 |
| `invalid-raw-draw` | 修补身份/阶段正确，但内核拒绝其bound或value语义 |
| `unexpected-raw-draw` | 所有实际到达阶段结束后仍有未消费项，包括终局后附加topic/refill抽样 |
| `unsupported-deck-regeneration` | 任一fill需要超过当前18项窗口；不替代为旧profile的deck-exhausted |
| `unsupported-anger-trigger` | Attack和全部Effect后没有HP终局且stress达到100，拒绝整轮 |
| `invalid-fill-provenance` | 内核审计无法映回保留槽/新牌组索引的内部一致性保护，不是新的调用方字段 |
| `history-limit` | session/输入/历史/replay任一条数、字节、节点、深度或数组预算超限 |
| `input-limit` | 底层填牌内核自己的输入预算失败，原样传播，不改成游戏结果 |
| `invalid-genesis` / `receipt-mismatch` / `snapshot-mismatch` | 完整初局、某条完整receipt或最终snapshot不等于重算 |

适配器对内核其他失败也不做成功降级，完整集合见[内核错误合同](debate-hand-fill-v1.md#61-全部失败原因)。例如 `invalid-playable-slots` / `invalid-deck-cursor` 是内核的防御性错误；本session不接收可供调用者直接填写这些值的字段，其槽数/游标只能从重建历史生成。新profile不会以旧 `unsupported-topic-repair` 拒绝本合同可提供draw的修补。

前置安全检查不因阶段尚未到达而跳过：−0、非整数、访问器、未知字段等仍可先拒绝。raw draw 的 role 是字符串、bound/value 是合法安全整数等只属语法；语义在实际消费时检查。修补中仅字符串类型的participantId/phase先通过语法，错误身份/阶段在需要修补时给draw-shape，而非当作普通participant ID重新解析。rethinks本身不是数组或超过2项为malformed-data，非法请求ID语法仍为unsupported-person。

内核先以空draw求值，只有返回missing-raw-draw才取下一全局项并以单项再次求值；这是私有纯函数探测，不发布第一个候选、不推进cursor或外部RNG。需新牌组时在要求修补draw之前拒绝。非终局stress100亦早于尚未到达的话题/补牌draw要求。以上不承诺所有多错输入有统一优先级。

- create或直接preview/execute的新命令失败通常index=null，包括本轮填牌、修补或战斗错误。
- inspect/save/load/preview/execute先分离整个session。可定位的entries内部安全结构失败带0-based index；外层数组/描述符错误可能为null，较后条目的结构错误可先于较前条目的领域错误。
- 安全分离后按历史顺序重算，首条失败entry的index为0-based；invalid-genesis与最终snapshot-mismatch为null。
- replay的scenario（含初局fill）或外层commands列表错误index=−1；其后逐条安全分离、解析和追加，首个失败命令为0-based index。不预先读取后来命令内部值，但外层洞/额外属性/列表长度可先报−1。
- 所有失败均无部分结果；index仅定位输入/历史，不代表失败前的前缀已被提交。

### 5.2 安全数据与固定资源上限

只接收 Object.prototype/null 原型 record、标准 Array 和合法 JSON 式标量。字段必须为可枚举数据属性；拒绝 Proxy、getter/setter、函数、undefined、外部 BigInt、Symbol、Date/custom prototype、循环、稀疏数组、额外 array 属性、非枚举 record 字段与不安全整数。不会调用调用者 getter、toJSON 或 custom iterator。

Proxy 检测依赖 `process.getBuiltinModule('node:util').types.isProxy`；缺失时返回 unsupported-runtime，不降级为不安全反射。这是代码接口要求，不是已验证 Node/浏览器兼容性声明。

| 范围 | 固定限额 |
|---|---:|
| 历史 entries / replay 命令数 | 64 |
| 每方 cardTape | 恰好18项 |
| genesisRawDraws / 单轮 rawDraws | 最多2 / 6项 |
| 完整 canonical session UTF-8 bytes | 16,777,216 |
| 输入值节点数 / 嵌套深度 | 1,000,000 / 32 |
| 安全分离的通用数组长度 | 4096，再按领域收紧 |

load 还检查原始 JSON 字节数，replay 累计 commands 输入预算。preview/execute/replay 对相同的完整拟议追加 session 预算，所有政策、证据、嵌套 kernel receipts、历史、弃牌与重发审计都计入。inspection.canonicalUtf8Bytes计量canonical完整session，不是外层API结果wrapper或单独命令的大小。内核自身仍执行其1024节点、深度12、数组32、16,384 canonical字节的独立输入预算，未因 session 集成而放宽。

remainingEntryCapacity=64−entryCount 只表示剩余日志条数；当前牌组、字节/节点、再考可用性或愤怒边界可更早阻止推进，不保证还可成功那么多轮。

## 6. 证据与未覆盖边界

固定完整政策/证据字面值以 [来源账本](../sources/filled-debate-session-v1.json) 与源码为准，本文不复制巨型旧政策。现代来源仍固定 commit `a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef`；基线由 PR111 手填内核及 PR110 再考 session组成。内部共用 normal combat 抽取不升级旧profile证据或改变旧公开DTO。

新合同允许提供式18张当前牌组上的条件性 bound9 话题修补、数字展示排序及完整 fill 追踪；不等于原作随机发牌或完整随机链。初局话题、提供牌组与 draw、token、同值审计顺序、安全预算和原子命令编排均明确属于工程合同。

`nativeEquivalent`、`stockOriginalVerified`、`pkEquivalent`、`vanillaEquivalent`、`completeDebate` 均保持 false。E15 既有普通通用公式证据不外推到全部填牌、话术、随机、再考或原生全链。原43证据主题与45历史快照仍开放，不因新增子集减少。

不实现 DeckGenerate/洗牌/概率/原生PRNG、教程、四性格愤激与自动反制、额外消耗、连打/timer、冷静愤激再考/大牌覆写、真实人物/书籍/MOD hooks、开场/追击、campaign或外交自动结算；P078/native人员任务及其依赖、俘虏/处斩/归属、return/mission亦不在范围内。

配套[五轮场景](../../data/scenarios/filled-debate-example-v1.json)与独立拒绝候选是纸面材料，不是执行生成的回执、通过的测试或已验证存档。本页没有将 API 描述当成运行结果。

同一纸面文件另列独立HP终局链及当前牌组耗尽链。耗尽链的12轮前缀手算到双方cursor18，下一轮需第19张时整轮拒绝；它不接在五条主命令后，不修改主场景预期，也不是已执行的边界测试。材料中的说明、paperExpected或独立候选均不是scenario字段或完整runtime receipt。
