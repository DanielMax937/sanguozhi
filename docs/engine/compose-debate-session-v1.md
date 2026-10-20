# 普通话题牌 + 大喝 + 无视 + 镇静独立舌战 API v1

[规则、固定来源与未运行纸面边界](../rules/compose-debate-session-v1.md) · [全部政策/证据字面值及来源身份](../sources/compose-debate-session-v1.json) · [六轮纸面场景，未运行](../../data/scenarios/compose-debate-example-v1.json)。

实现入口为 [compose-debate.ts](../../packages/engine/src/compose-debate.ts)，公共导出见 [engine index](../../packages/engine/src/index.ts)。独立 profile=`debate-topic-shout-ignore-compose-reference-v1`、tag=`compose-debate-session-v1`；不修改或隐式迁移旧topic-only、Shout或Ignore session。

## 1. 七个公开函数

全部参数按unknown处理并严格校验；全部成功/失败输出和常量递归深冻结，不修改外部输入。

| 函数 | 参数 | 成功值 |
|---|---|---|
| `createComposeDebate` | scenario | `{ok:true,session}` |
| `inspectComposeDebate` | 完整session | `{ok:true,inspection:{snapshot,policy,evidence,entryCount,remainingEntryCapacity,canonicalUtf8Bytes}}` |
| `previewComposeDebateRound` | 完整session, command | `{ok:true,preview:{receipt,projectedSnapshot,policy,evidence,externalRngConsumed:0}}` |
| `executeComposeDebateRound` | 完整session, command | `{ok:true,session,receipt}` |
| `saveComposeDebate` | 完整session | `{ok:true,json}` |
| `loadComposeDebate` | JSON字符串 | `{ok:true,session}` |
| `replayComposeDebate` | scenario, commands数组 | `{ok:true,session}` |

常量为 `COMPOSE_DEBATE_POLICY_V1:ComposeDebatePolicyV1`、`COMPOSE_DEBATE_EVIDENCE_V1:ComposeDebateEvidenceV1`。全部失败统一 `{ok:false,reason,index}`，无partial session或失败receipt。

preview/execute有Round后缀，没有无后缀别名。preview同样完整重算输入、执行拟议append及预算，只返回receipt/projectedSnapshot，不提交日志或返回拟议session。inspect不是只读展示字段，也会完整重算。

## 2. 公开 DTO 全字段

复合类型均为递归readonly；本文 `Pair<T>` 仅表示恰好两项的保序tuple，不是额外导出。所有number都是安全整数且不为−0。

### 2.1 卡牌、scenario、participant

| 导出类型 | 完整结构/域 |
|---|---|
| `ComposeDebateTopicV1` | `'story' \| 'logic' \| 'trend'` |
| `ComposeDebateLevelV1` | `'small' \| 'medium' \| 'large'` |
| `ComposeDebateTopicCardV1` | `{kind:'topic',topic:ComposeDebateTopicV1,level:ComposeDebateLevelV1}` |
| `ComposeDebateShoutCardV1` | `{kind:'shout'}` |
| `ComposeDebateIgnoreCardV1` | `{kind:'ignore'}` |
| `ComposeDebateComposeCardV1` | `{kind:'compose'}` |
| `ComposeDebateCardV1` | 上述四种Card的封闭联合 |
| `ComposeDebateCardOccurrenceV1` | Card联合加 `{token:string,tapeIndex:number}` |
| `ComposeDebateParticipantV1` | `{id:string,resolvedIntelligence:number,hp:1000,stress:0,angerTimer:0,cardTape:ComposeDebateCardV1[]}` |
| `ComposeDebateScenarioV1` | `{schemaVersion:1,profile:'debate-topic-shout-ignore-compose-reference-v1',genericOnly:true,difficulty:'source-normal',policies:ComposeDebatePolicyV1,challengerId:string,initialTopic:ComposeDebateTopicV1,participants:Pair<ComposeDebateParticipantV1>}` |

ID必须匹配ASCII `[A-Za-z][A-Za-z0-9_-]{0,63}`，两人不同，challengerId属于其中之一。INT为1..100，初始hp/stress/timer固定1000/0/0；不允许人物、物品、性格hook或任意中局输入。每方cardTape最多512项，并须足够初始手牌。

只接受表内全部必需键，不补默认值。特殊牌不能有topic/level；缺/未知kind或非法topic/level为unsupported-card，普通牌缺字段为malformed-data，特殊牌多带字段为unknown-field。模板不带token；API生成的hand occurrence才带token和tapeIndex。

### 2.2 snapshot、participant state 与 outcome

`ComposeDebateParticipantStateV1`全部字段：

| 字段 | 类型/域 |
|---|---|
| id, resolvedIntelligence | string、number，保留scenario值 |
| attack | number，双方INT重算为70..227，不接受外部覆盖 |
| hp, stress, angerTimer | number−100..1000、number0..100、字面量0 |
| sourceSlotCount, playableHandCapacity | number4/5/6/7、number3/4/5/6，INT阈值70/80/90 |
| reservedRethinkSlot | 字面量true，不代表有再考动作 |
| crumbledLevel | number0..3，非终局重算，终局保留 |
| hand | ComposeDebateCardOccurrenceV1[] |
| deckCursor | number0..牌带长度，指向下一未发项 |

`ComposeDebateOutcomeV1`=`{kind:'hp-defeat',winnerId:string,loserId:string}`。

`ComposeDebateSnapshotV1`=`{schemaVersion:1,profile:'debate-topic-shout-ignore-compose-reference-v1',revision:number,roundIndex:number,currentTopic:ComposeDebateTopicV1,firstId:string,status:'active'|'finished',outcome:ComposeDebateOutcomeV1|null,participants:Pair<ComposeDebateParticipantStateV1>}`。

初局revision/roundIndex为0，成功每轮各+1。四类牌共用容量；hand保序留牌再补空位，不因镇静新增槽位。active成功态HP>0、stress<100且hand补满；finished消费本轮牌后不补。终局first/topic保留轮开始值，终局胜者读outcome。无视不减HP，Compose不能胜出，因此HP终局仍仅来自普通/大喝胜。

### 2.3 command、selection 与raw draw

```ts
type ComposeDebateSelectionV1 = { participantId: string; cardToken: string };
type ComposeDebateRawDrawV1 = {
  role: 'psychological-damage-jitter'; bound: 5; value: number;
};
type ComposeDebateCommandV1 = {
  type: 'ResolveComposeDebateRound';
  expectedRevision: number;
  expectedRoundIndex: number;
  expectedFirstId: string;
  choices: [ComposeDebateSelectionV1, ComposeDebateSelectionV1];
  rawDraws: ComposeDebateRawDrawV1[];
};
```

expected计数为0..4096并匹配snapshot，first也须匹配。choices严格按scenario顺序，每方选自己当前hand中的token。token语法为合法ID加冒号及规范十进制0..999；实际生成索引最多511，再检查当前hand成员资格。不能选择对方、已消费、未发牌或重复token，不能直接传模板。

| Attack分支 | rawDraws / drawCount | noDrawReason |
|---|---|---|
| 普通/大喝胜，含败方Compose | 恰一项value0..4 / 1 | null |
| 无视胜，含败方Compose | [] / 0 | `ignore-no-hp-damage` |
| 任何等power平局，含双Compose | [] / 0 | `equal-card-power` |

Compose自己的Effect不增加draw，但整轮draw由胜牌/平局决定。数量、role、bound和值域严格验证，不取无用随机数再丢弃。无全局RNG、callback或seed；命令不接受预计算power、attack、damage、Effect或winner。

### 2.4 play 与damage

`ComposeDebatePlayV1`=`{participantId:string,card:ComposeDebateCardOccurrenceV1,attack:number,power:number,matchesCurrentTopic:boolean}`。

普通power1..3/11..13，大喝110，无视120，镇静0。特殊牌matchesCurrentTopic恒false；大喝伤害topicCoefficient仍12，不能从false推为6。

`ComposeDebateDamageV1`=`{sourceId:string,targetId:string,attack:number,jitter:number,angerCoefficient:10,levelCoefficient:number,topicCoefficient:number,requestedHpDamage:number}`。

仅普通/大喝胜产生damage。普通levelCoefficient10/15/20、topicCoefficient按轮开始话题为10/6；大喝15/12。无视/平局damage=null；不为Compose、Ignore构造零系数对象。

### 2.5 分阶段stress与Effect审计联合

`ComposeDebateStressStageV1`=`{beforeStress:number,requestedStress:number,afterStress:number,actualStressDelta:number}`。

actualStressDelta为after−before。Attack与Effect分别clamp到0..100；requested允许负数，不等于实际差。

`ComposeDebateEffectV1`的公共字段：

```ts
{
  sequence: 0 | 1;
  actorId: string;
  targetId: string;
  cardKind: 'topic' | 'shout' | 'ignore' | 'compose';
  beforeStress: number;
  afterStress: number;
  actualStressDelta: number;
}
```

再与以下恰一分支相交：

```ts
{ status: 'applied'; invoked: true; requestedStress: number }
{ status: 'no-additional-effect'; invoked: true; requestedStress: 0 }
{ status: 'suppressed-by-ignore'; invoked: false; requestedStress: null }
```

这不是可自由组合的字段集合。合法规则：

- winner存在时固定两个审计槽：sequence0为winner、sequence1为loser。target均为actor的对方；before/after指目标的stress，不是actor的stress。
- 普通/大喝/无视被调用Effect但无分支：no-additional-effect、invoked=true、请求0、实际0；这是无writer，不是写入一次0。
- Compose被调用：applied、invoked=true，请求 `-max(trunc(targetCurrentStress/2),30)`，写入clamp后记录实际差。即使目标为0，请求仍−30、实际0、状态仍applied。
- Ignore胜：winner槽是no-additional-effect，loser槽suppressed-by-ignore、invoked=false、请求null、实际0、before=after。null表示请求未评估；不能记一个假想−30，也不能改成0冒充已评估。
- 平局包括双Compose：effects=[]，没有两条no-op记录，也不施加镇静。

镇静只有作为普通/大喝的败牌才能applied；诡辩未接纳，不存在reflection字段或反射路径。Effect独立于firstId，且没有“actor已HP<=0就跳过”的门槛。

### 2.6 change与receipt

`ComposeDebateChangeV1`全部字段：

- `participantId:string`。
- `beforeHp:number,afterHp:number,requestedHpDamage:number,actualHpDelta:number`。
- `beforeStress:number,afterStress:number,requestedStress:number,actualStressDelta:number`。
- `attackStress:ComposeDebateStressStageV1,effectStress:ComposeDebateStressStageV1`。
- `beforeCrumbledLevel:number,afterCrumbledLevel:number`。
- `consumedCard:ComposeDebateCardOccurrenceV1,refilledCards:ComposeDebateCardOccurrenceV1[]`。
- `beforeDeckCursor:number,afterDeckCursor:number`。

attackStress跨越本轮Attack，effectStress从Attack后到全部Effect后；两阶段总是存在，即使没有writer。change.requestedStress是两个阶段已评估请求之和；受抑制Effect的null不加入，effectStress汇总请求为0。整轮actualStressDelta为afterStress−beforeStress，等于两个阶段实际差之和，不能用整轮需求和代替各阶段clamp。

HP实际差同样为after−before，请求伤害与HP−100下限clamp分开。终局stress可clamp100；非终局若最终stress100则拒绝，不产生成功receipt。

`ComposeDebateReceiptV1`全部字段：

| 字段组 | 精确字段与类型 |
|---|---|
| 版本及合同 | schemaVersion:1；profile固定新profile；command:ComposeDebateCommandV1；policy:ComposeDebatePolicyV1；evidence:ComposeDebateEvidenceV1 |
| 计数 | beforeRevision/afterRevision/beforeRoundIndex/afterRoundIndex:number |
| 先手/话题 | beforeFirstId/afterFirstId:string；beforeTopic/afterTopic:ComposeDebateTopicV1 |
| 出牌 | orderedIds:Pair<string>；plays:Pair<ComposeDebatePlayV1> |
| 本轮结果 | result:'winner'\|'draw'；roundWinnerId:string\|null；damage:ComposeDebateDamageV1\|null |
| Effect审计 | effects:ComposeDebateEffectV1[]；effectOrder:'winner-then-loser-audit-slots'\|'none-equal-card-power'；effectSkipReason:'equal-card-power'\|'ignore-suppresses-loser-effect'\|null |
| 写入 | changes:Pair<ComposeDebateChangeV1> |
| 随机 | consumedDraws:ComposeDebateRawDrawV1[]；drawCount:0\|1；noDrawReason:'equal-card-power'\|'ignore-no-hp-damage'\|null |
| 结束 | terminal:boolean；crumbleEvaluated:boolean；refillApplied:boolean；outcome:ComposeDebateOutcomeV1\|null |

orderedIds是轮开始first/other的记录；plays/changes是scenario顺序；effects是winner/loser审计顺序，三个顺序不能互相替代。无视胜仍result=winner且roundWinnerId非null，但damage=null、drawCount0、effectSkipReason=ignore-suppresses-loser-effect。平局roundWinnerId=null、effectOrder=none-equal-card-power、effectSkipReason=equal-card-power。

非终局成功crumbleEvaluated/refillApplied=true。终局两者false，refilledCards=[]、cursor不推进、first/topic不变，但effects仍完整：必须先Attack→Effect，再HP终局，不能先判死再省略败方Compose。

### 2.7 session、genesis与entry

| 导出类型 | 完整结构 |
|---|---|
| `ComposeDebateGenesisV1` | `{scenario:ComposeDebateScenarioV1,snapshot:ComposeDebateSnapshotV1}` |
| `ComposeDebateEntryV1` | `{command:ComposeDebateCommandV1,receipt:ComposeDebateReceiptV1}` |
| `ComposeDebateSessionV1` | `{tag:'compose-debate-session-v1',policy:ComposeDebatePolicyV1,evidence:ComposeDebateEvidenceV1,genesis:ComposeDebateGenesisV1,snapshot:ComposeDebateSnapshotV1,entries:ComposeDebateEntryV1[]}` |

genesis包含两条完整牌带及重建初局；每条receipt.command与重算命令相同。不能只存当前snapshot、略去Effect审计或只校验净stress。

### 2.8 全部结果类型

以下均为递归readonly联合，成功值见§1：

| 导出类型 | 联合 |
|---|---|
| `ComposeDebateFailureV1` | `{ok:false,reason:string,index:number|null}` |
| `ComposeDebateSessionResultV1` | `{ok:true,session:ComposeDebateSessionV1}`或Failure |
| `ComposeDebateExecuteResultV1` | `{ok:true,session:ComposeDebateSessionV1,receipt:ComposeDebateReceiptV1}`或Failure |
| `ComposeDebatePreviewResultV1` | `{ok:true,preview:{receipt:ComposeDebateReceiptV1,projectedSnapshot:ComposeDebateSnapshotV1,policy:ComposeDebatePolicyV1,evidence:ComposeDebateEvidenceV1,externalRngConsumed:0}}`或Failure |
| `ComposeDebateSaveResultV1` | `{ok:true,json:string}`或Failure |
| `ComposeDebateInspectionResultV1` | `{ok:true,inspection:{snapshot:ComposeDebateSnapshotV1,policy:ComposeDebatePolicyV1,evidence:ComposeDebateEvidenceV1,entryCount:number,remainingEntryCapacity:number,canonicalUtf8Bytes:number}}`或Failure |
| `ComposeDebateReplayResultV1` | 与SessionResult相同 |

reason的公开类型是string，不是封闭错误联合。load返回SessionResult，replay返回完整session，receipts已在entries中，无额外partial/receipt列表。

## 3. Policy / evidence固定合同

`ComposeDebatePolicyV1`、`ComposeDebateEvidenceV1`是内部固定对象的递归readonly类型，不是可配置map。完整字面值见 [manifest的policies与evidence](../sources/compose-debate-session-v1.json)，本页不重复整份JSON。scenario用复数policies，session/receipt用单数policy，必须全字段一致，不仅核id。

policy id=`compose-debate-standalone-policy-v1`，顶层键为 `id,profile,cards,shout,ignore,compose,identities,initialTopic,deal,hand,round,effects,topic,arithmetic,writer,anger,closing,opening,rethink,refill,capacity,persistence`。

新增/容易误用的政策：

- cards id=`topic-shout-ignore-and-compose-only-v1`，登记四个kind；手牌playableCapacities共用，不新增Compose槽。
- compose id=`source-no-anger-compose-v1`，power0、hpDamage0、damageJitter=false；target=opponent，请求公式明确读取target-current-stress，最小需求下降30。reflection=false、angerCounter=excluded，attack=never-wins-in-admitted-card-set。
- ignore suppressionScope=`loser-effect-including-compose`，不再是旧Ignore合同的vacuous作用域。
- round resolutionOrder=`attack-then-winner-effect-then-loser-effect`；orderedIdsMeaning=`first-then-other-recorded-play-order-only`；仍是普通/大喝胜一draw、无视/平局零draw。
- effects明确after-attack-before-hp-terminal、winner-then-loser-audit-slots、平局无调用/空审计、Ignore败方受抑制、null-not-evaluated及no-op无writer0。changeRequestedStress为sum-of-evaluated-attack-and-effect-requests。
- closing.priority为attack→additional-effects→hp-defeat→unsupported-anger-trigger→crumble→topic-and-first→refill，terminalEffects=true、terminalRefill/terminalTopicChange/terminalFirstChange=false。
- anger在Effects及HP终局检查后才判断，automaticCounterCards=excluded；不会从未出牌hand中消费第二张Compose。
- 普通非终局胜改first/topic；大喝/无视胜只改first；平局保持。topic政策无需Compose-winner分支，因为其不能胜出。
- 提供牌带、原子双选、预算、保存重算是工程政策，不是原作随机发牌/AI/UI认证。

evidence新增 `composeEvidence:'pinned-modern-translated-reference-only'`、`composeEvidenceScope:'no-anger-generic-topic-shout-ignore-and-compose-subset-no-anger-counter-or-reflection'`。关键作用域为：

- ignoreEffectSuppression=`source-return-before-loser-effect-including-compose`。
- composeEffectTarget=`opponent-current-stress-not-self`。
- additionalEffects=`source-attacker-then-opponent-not-first-id`。
- equalPowerEffects=`source-invalid-attacker-return-no-effects`。
- effectTiming=`source-attack-then-effect-then-calc-winner`。

固定commit和blob见规则页与manifest；sourceIdentity=`modern-CSharp-translation-not-native-or-Vanilla`。`nativeEquivalent:false,stockOriginalVerified:false,pkEquivalent:false,vanillaEquivalent:false,completeDebate:false,originalUnresolvedGroups:43`。既有E15只属于普通通用核心，不升级为镇静原生证据。改变policy/evidence须另定版本或显式迁移，不可原地改字符串继续load。

## 4. 全部当前失败原因与定位

| reason | 条件 |
|---|---|
| malformed-data / unknown-field | 非安全plain输入、缺键、非法整数/−0、稀疏array/非法描述符、JSON解析失败；或未登记键 |
| unsupported-runtime | 缺少内建安全Proxy探测入口 |
| unsupported-profile | schemaVersion/profile/difficulty/tag不符，包含旧session |
| unsupported-policy / evidence-mismatch | 完整policy/evidence与固定合同不同 |
| unsupported-person / unsupported-item | genericOnly错误、非法ID、personId/person/personHooks/characterId或items/item/equipment/weapon/sword额外键 |
| unsupported-initial-state | 初局不为HP1000/stress0/timer0 |
| unsupported-card / unsupported-action | 缺/未知card kind、非法topic/level；或命令非ResolveComposeDebateRound |
| duplicate-participant / invalid-challenger | scenario或choices参与者重复；challenger不属于场景两人 |
| invalid-token / duplicate-token / not-in-hand / invalid-choice-order | token格式错误/重复、不在自己的当前hand、choices顺序不符 |
| stale-revision / stale-round / stale-first | expected值与snapshot不符 |
| session-finished | 终局后继续推进 |
| draw-shape / draw-range | 数量/role/bound不符，含普通胜Compose缺draw、无视胜Compose多draw；或结构通过后的value不在0..4 |
| unsupported-anger-trigger | Effect后无HP终局且stress达到100，整轮回滚 |
| deck-exhausted | 初始牌带不够，或非终局补牌不足；终局不补牌 |
| history-limit | 条数/牌带/字节/节点/深度任一预算超限 |
| invalid-genesis / receipt-mismatch / snapshot-mismatch | 初局、某条receipt或最终snapshot不等于重算 |

表不承诺多错误优先级。安全分离先于领域解析；如−0先malformed-data而非draw-range，未知人物/物品键先于一般unknown-field。

- create及普通新命令错误index通常null。
- inspect/save/load/execute/preview先分离整个session；能定位的entries元素结构错误为0-based index，外层/array描述符错误可能null。后面entry非法accessor可能早于前面entry语义错误。
- 安全结构通过后按历史顺序重算，首失败entry为0-based index；最终snapshot-mismatch为null。任何Effect字段或顺序篡改都参与receipt全字段比较。
- replay先检查scenario及外层commands列表，失败index=−1；然后逐项分离/parse/append，首失败命令为0-based index，不预先解析后来内部值来覆盖较早命令错误。外层洞、非法属性和长度仍可先报−1。
- 任一失败无partial返回，不修改原session、牌、HP/stress、cursor、日志或计数。Effect已经在私有拟议状态执行，不代表失败后会留下半轮。

## 5. 安全输入、资源预算与运行时

仅接收Object.prototype或null原型record、标准Array及合法JSON式标量；字段必须是可枚举数据属性。拒绝Proxy、getter/setter、函数、undefined、外部BigInt、Symbol、Date/custom prototype、循环、稀疏array、额外array属性、非枚举record字段。不会调用调用者getter、toJSON或custom iterator。

Proxy检测依赖 `process.getBuiltinModule('node:util').types.isProxy`，缺少时fail-closed为unsupported-runtime，不尝试不安全降级。内部精确BigInt不允许外部DTO带BigInt。可擦除TS语法不表示已验证任何Node/浏览器版本。

| 预算 | 上限 |
|---|---:|
| entries / replay命令数 | 4096 |
| 每方cardTape | 512 |
| canonical完整session UTF-8 bytes | 16,777,216 |
| 值节点 / 嵌套深度 | 1,000,000 / 32 |

安全分离和最终拟议输出均受限，通用array长度另限4096再按领域收紧。load还限制原始JSON文本字节；replay累计commands输入预算。policy/evidence及每条完整receipt的重复内容、Effect审计和阶段字段都计入，不仅计算commands。

inspect.remainingEntryCapacity=4096−entryCount只说明条数。牌带、字节、节点或stress边界可能更早触达。preview使用同一完整拟议append及预算，不可绕过限制；超限是API拒绝，不是游戏平局。

## 6. 保存、重放与接入说明

save重新检查完整session后返回canonical JSON：对象键排序、数组保序，无函数/RNG/外部引用。load只收字符串，接受等价键序JSON；核tag/policy/evidence、重建genesis，按entry重跑命令并对照完整receipt，最后核snapshot。

inspect/preview/execute/save同样重算，不只load校验。不信任外部attack、cursor、hand、winner、damage、净stress、阶段stress、Effect target/status/invoked/null请求或顺序；仅存snapshot不构成有效存档。存档未签名未加密，不能证明来自原作或阻止构造内部一致的虚构历史。

使用纸面场景时，只取scenario传createComposeDebate；或取scenario与commands传replayComposeDebate。不要将说明/paperExpected外层当scenario，也不要将paperExpected称为运行receipt。先判ok，execute成功后采用返回的新session；save成功json再交load。

独立例子的第4轮命令形状（未执行）：

```ts
{
  type: 'ResolveComposeDebateRound',
  expectedRevision: 3,
  expectedRoundIndex: 3,
  expectedFirstId: 'alpha',
  choices: [
    { participantId: 'alpha', cardToken: 'alpha:3' },
    { participantId: 'beta', cardToken: 'beta:3' },
  ],
  rawDraws: [
    { role: 'psychological-damage-jitter', bound: 5, value: 0 },
  ],
}
```

该六轮例子初始first=beta、INT60/60、story、各9张牌。前两轮alpha Ignore对beta Shout令beta stress30/60；第3轮双Shout令双方15/75。第4轮alpha Compose对beta story-small：beta胜，alpha HP900/stress25，Compose再使beta75→38，请求−37。该轮orderedIds=[alpha,beta]、plays/changes=[alpha,beta]，但effects为beta无附加效果→alpha镇静，不能把first当Effect首位。

第5轮alpha Compose对beta Ignore：alpha stress55、beta38不变，败方审计invoked=false/requestedStress=null。第6轮双Compose各加15至70/53，effects=[]，first仍beta。双cursor依次4..9，只有第4轮一个draw，其他均空。具体token、完整policy/evidence和纸面预期见场景；它不是API执行生成的存档。

规则页还给出stress0 clamp、45最小30、75奇数向零、双镇静至怒线、Effect后整轮拒绝、败方已HP0仍镇静胜者再终局、非终局补牌不足及receipt篡改边界，全部未运行。

## 7. 未执行与不支持声明

本批只做静态读源、代码修改及规则文档补充，没有测试、typecheck、编译、build、checker、validator、诊断、产品或示例执行。旧测试和旧profile合同不修改；新导出不表示过去的验证数字覆盖本批。

现代转录子集不是原PC/PK/Vanilla/主机或完整舌战认证，不覆盖P078、诡辩/反射、激昂、愤激/性格/自动反制、再考、人物/书籍、开场/追击或campaign结果。接受主动Compose并不允许未支持的持有牌反制、反射或外部状态写入。
