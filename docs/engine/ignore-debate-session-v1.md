# 普通话题牌 + 大喝 + 无视独立舌战 API v1

[完整规则与固定来源定位](../rules/ignore-debate-session-v1.md) · [政策/证据完整字面值](../sources/ignore-debate-session-v1.json) · [四轮纸面场景，未运行](../../data/scenarios/ignore-debate-example-v1.json)。

实现直接入口为 [ignore-debate.ts](../../packages/engine/src/ignore-debate.ts)，本批也通过 [engine index](../../packages/engine/src/index.ts) 导出。独立 profile=`debate-topic-shout-ignore-reference-v1`、tag=`ignore-debate-session-v1`，不会修改或隐式迁移旧topic-only/Shout存档。

## 1. 公开函数、常量与返回值

全部函数接收unknown并校验，不依赖调用者的TS类型保证。所有输出及常量递归深冻结，不修改输入。

| 公开函数 | 参数 | 成功值 |
|---|---|---|
| `createIgnoreDebate` | scenario | `{ok:true,session}` |
| `inspectIgnoreDebate` | 完整session | `{ok:true,inspection:{snapshot,policy,evidence,entryCount,remainingEntryCapacity,canonicalUtf8Bytes}}` |
| `previewIgnoreDebateRound` | 完整session, command | `{ok:true,preview:{receipt,projectedSnapshot,policy,evidence,externalRngConsumed:0}}` |
| `executeIgnoreDebateRound` | 完整session, command | `{ok:true,session,receipt}` |
| `saveIgnoreDebate` | 完整session | `{ok:true,json}` |
| `loadIgnoreDebate` | JSON字符串 | `{ok:true,session}` |
| `replayIgnoreDebate` | scenario, commands数组 | `{ok:true,session}` |

常量为 `IGNORE_DEBATE_POLICY_V1: IgnoreDebatePolicyV1` 和 `IGNORE_DEBATE_EVIDENCE_V1: IgnoreDebateEvidenceV1`。所有失败均为 `{ok:false,reason,index}`，没有partial session或失败receipt。

preview/execute名称含Round后缀，没有同名无后缀别名。preview使用完整追加路径和预算，不只是伤害计算器；不提交日志、不返回拟议session。inspect也先完整重算。

## 2. 公开 DTO 全字段

以下列出全部公开类型。复合类型实际均为递归readonly；表中`Pair<T>`只是“恰好两项的保序tuple”的文档缩写，不是额外导出。所有number须安全整数且非−0。

### 2.1 卡牌、场景及参与者

| 导出类型 | 完整结构/域 |
|---|---|
| `IgnoreDebateTopicV1` | `'story' \| 'logic' \| 'trend'` |
| `IgnoreDebateLevelV1` | `'small' \| 'medium' \| 'large'` |
| `IgnoreDebateTopicCardV1` | `{kind:'topic',topic:IgnoreDebateTopicV1,level:IgnoreDebateLevelV1}` |
| `IgnoreDebateShoutCardV1` | `{kind:'shout'}` |
| `IgnoreDebateIgnoreCardV1` | `{kind:'ignore'}` |
| `IgnoreDebateCardV1` | 上述三种Card的封闭联合 |
| `IgnoreDebateCardOccurrenceV1` | Card联合加 `{token:string,tapeIndex:number}` |
| `IgnoreDebateParticipantV1` | `{id:string,resolvedIntelligence:number,hp:1000,stress:0,angerTimer:0,cardTape:IgnoreDebateCardV1[]}` |
| `IgnoreDebateScenarioV1` | `{schemaVersion:1,profile:'debate-topic-shout-ignore-reference-v1',genericOnly:true,difficulty:'source-normal',policies:IgnoreDebatePolicyV1,challengerId:string,initialTopic:IgnoreDebateTopicV1,participants:Pair<IgnoreDebateParticipantV1>}` |

id必须匹配ASCII `[A-Za-z][A-Za-z0-9_-]{0,63}`、两人不同；challengerId属于其中之一。INT为1..100，hp/stress/timer固定1000/0/0；不接受真实人物/物品字段。牌带每方最多512项且足够初始容量。

scenario/card/participant均只接受表内必需键，不默认补值。Shout/Ignore不能带topic/level，缺kind或未知kind为unsupported-card，话题牌缺topic/level为malformed-data，特殊牌多带字段为unknown-field。模板没有token，只有API生成的hand occurrence才有。

### 2.2 snapshot 与 outcome

`IgnoreDebateParticipantStateV1` 的全部字段：

| 字段 | 类型/域 |
|---|---|
| id, resolvedIntelligence | string、number；保留scenario值 |
| attack | number；从双方INT重算，固定70..227，不能外部覆盖 |
| hp, stress, angerTimer | number−100..1000、number0..100、字面量0 |
| sourceSlotCount, playableHandCapacity | number4/5/6/7、number3/4/5/6，INT阈值70/80/90 |
| reservedRethinkSlot | 字面量true，不表示可用动作 |
| crumbledLevel | number0..3，非终局重算，终局保留 |
| hand | IgnoreDebateCardOccurrenceV1[] |
| deckCursor | number0..牌带长度，指向下一未发项 |

`IgnoreDebateOutcomeV1`=`{kind:'hp-defeat',winnerId:string,loserId:string}`。

`IgnoreDebateSnapshotV1`=`{schemaVersion:1,profile:'debate-topic-shout-ignore-reference-v1',revision:number,roundIndex:number,currentTopic:IgnoreDebateTopicV1,firstId:string,status:'active'|'finished',outcome:IgnoreDebateOutcomeV1|null,participants:Pair<IgnoreDebateParticipantStateV1>}`。

初局revision/roundIndex0，成功轮各+1。三类牌共用playableHandCapacity，不额外增加无视槽。active成功态hand补满、HP>0、stress<100；finished最后消费后不补牌。first/topic在终局保留轮开始值，winner只能看outcome。无视不减HP，不能从合法active状态产生HP终局。

### 2.3 command、selection、raw draw

```ts
type IgnoreDebateSelectionV1 = { participantId: string; cardToken: string };
type IgnoreDebateRawDrawV1 = {
  role: 'psychological-damage-jitter'; bound: 5; value: number;
};
type IgnoreDebateCommandV1 = {
  type: 'ResolveIgnoreDebateRound';
  expectedRevision: number;
  expectedRoundIndex: number;
  expectedFirstId: string;
  choices: [IgnoreDebateSelectionV1, IgnoreDebateSelectionV1];
  rawDraws: IgnoreDebateRawDrawV1[];
};
```

expected计数0..4096且匹配当前snapshot，expectedFirstId匹配first。choices严格scenario顺序，每方选择自己的当前hand token。token语法为合法ID加冒号及规范十进制0..999；实际生成索引最多511，并继续检查hand成员资格。重复、对方、已消费或未发牌均不可选。

rawDraws不是按“是否winner”简单二分：

| 结算分支 | rawDraws / drawCount | noDrawReason |
|---|---|---|
| 普通或大喝胜 | 恰一项value0..4 / 1 | null |
| 无视胜 | [] / 0 | `ignore-no-hp-damage` |
| 任何等power平局 | [] / 0 | `equal-card-power` |

不给无视计算jitter，也不接收多余draw后忽略；没有全局RNG、callback或seed。命令不接受预计算power/attack/damage/winner。

### 2.4 receipt、play、damage 与 change

`IgnoreDebatePlayV1`=`{participantId:string,card:IgnoreDebateCardOccurrenceV1,attack:number,power:number,matchesCurrentTopic:boolean}`。普通牌power1..3/11..13，大喝110，无视120。Shout/Ignore的matchesCurrentTopic恒false，但大喝伤害topicCoefficient仍12，不能从false推导为6。

`IgnoreDebateDamageV1`=`{sourceId:string,targetId:string,attack:number,jitter:number,angerCoefficient:10,levelCoefficient:number,topicCoefficient:number,requestedHpDamage:number}`，仅普通/大喝胜产生。普通levelCoefficient10/15/20、topicCoefficient按旧topic为10/6；大喝15/12。无视不造零系数damage对象。

`IgnoreDebateChangeV1`全部字段：

- `participantId:string`。
- `beforeHp:number,afterHp:number,requestedHpDamage:number,actualHpDelta:number`。
- `beforeStress:number,afterStress:number,requestedStress:number,actualStressDelta:number`。
- `beforeCrumbledLevel:number,afterCrumbledLevel:number`。
- `consumedCard:IgnoreDebateCardOccurrenceV1,refilledCards:IgnoreDebateCardOccurrenceV1[]`。
- `beforeDeckCursor:number,afterDeckCursor:number`。

actual为after−before，有符号，与requested需求分开。普通/大喝伤害受HP−100下限影响；终局stress可能cap100。无视成功时双方requestedHpDamage/actualHpDelta均0、败方requestedStress/actualStressDelta均30、胜方stress增量0；若会到stress100则整轮拒绝。

`IgnoreDebateReceiptV1`全部字段：

| 字段组 | 精确字段与类型 |
|---|---|
| 版本及合同 | schemaVersion:1；profile固定新profile；command:IgnoreDebateCommandV1；policy:IgnoreDebatePolicyV1；evidence:IgnoreDebateEvidenceV1 |
| 计数 | beforeRevision/afterRevision/beforeRoundIndex/afterRoundIndex:number |
| 先手与话题 | beforeFirstId/afterFirstId:string；beforeTopic/afterTopic:IgnoreDebateTopicV1 |
| 出牌记录 | orderedIds:Pair<string>；plays:Pair<IgnoreDebatePlayV1> |
| 本轮结果 | result:'winner'\|'draw'；roundWinnerId:string\|null；damage:IgnoreDebateDamageV1\|null |
| 写入记录 | changes:Pair<IgnoreDebateChangeV1> |
| 随机记录 | consumedDraws:IgnoreDebateRawDrawV1[]；drawCount:0\|1；noDrawReason:'equal-card-power'\|'ignore-no-hp-damage'\|null |
| 结束标记 | terminal:boolean；crumbleEvaluated:boolean；refillApplied:boolean；outcome:IgnoreDebateOutcomeV1\|null |

orderedIds按轮开始first/other排列，plays/changes按scenario排列。无视胜：result=winner、roundWinnerId非null、damage=null、consumedDraws=[]、drawCount0；不是平局。双无视：result=draw、roundWinnerId=null、双方stress15。零draw不等于没有胜方，damage=null也不等于没有stress写入。

非终局成功crumbleEvaluated/refillApplied=true；终局两者false、refilledCards=[]、cursor不推进，first/topic保留原值。无视成功receipt必为非终局，仍会消费并补牌。

### 2.5 session、genesis、entry

| 导出类型 | 完整结构 |
|---|---|
| `IgnoreDebateGenesisV1` | `{scenario:IgnoreDebateScenarioV1,snapshot:IgnoreDebateSnapshotV1}` |
| `IgnoreDebateEntryV1` | `{command:IgnoreDebateCommandV1,receipt:IgnoreDebateReceiptV1}` |
| `IgnoreDebateSessionV1` | `{tag:'ignore-debate-session-v1',policy:IgnoreDebatePolicyV1,evidence:IgnoreDebateEvidenceV1,genesis:IgnoreDebateGenesisV1,snapshot:IgnoreDebateSnapshotV1,entries:IgnoreDebateEntryV1[]}` |

genesis包含两条完整牌带及重建初局；所有receipts与最终snapshot全字段对照。不能只保存当前状态或跳过历史。每条receipt.command也必须与重算命令一致。

### 2.6 全部结果类型

以下成功值结构见§1；每个联合都含失败类型，且递归readonly：

| 导出类型 | 联合 |
|---|---|
| `IgnoreDebateFailureV1` | `{ok:false,reason:string,index:number|null}` |
| `IgnoreDebateSessionResultV1` | `{ok:true,session:IgnoreDebateSessionV1}`或Failure |
| `IgnoreDebateExecuteResultV1` | `{ok:true,session:IgnoreDebateSessionV1,receipt:IgnoreDebateReceiptV1}`或Failure |
| `IgnoreDebatePreviewResultV1` | `{ok:true,preview:{receipt:IgnoreDebateReceiptV1,projectedSnapshot:IgnoreDebateSnapshotV1,policy:IgnoreDebatePolicyV1,evidence:IgnoreDebateEvidenceV1,externalRngConsumed:0}}`或Failure |
| `IgnoreDebateSaveResultV1` | `{ok:true,json:string}`或Failure |
| `IgnoreDebateInspectionResultV1` | `{ok:true,inspection:{snapshot:IgnoreDebateSnapshotV1,policy:IgnoreDebatePolicyV1,evidence:IgnoreDebateEvidenceV1,entryCount:number,remainingEntryCapacity:number,canonicalUtf8Bytes:number}}`或Failure |
| `IgnoreDebateReplayResultV1` | 与SessionResult相同 |

reason公开TS类型为string，不是封闭错误联合。load返回SessionResult；replay返回整个session，全部receipt已在entries中，没有额外partial或receipt列表。

## 3. Policy / evidence 合同

`IgnoreDebatePolicyV1`、`IgnoreDebateEvidenceV1`为固定内部POLICY/EVIDENCE对象的递归readonly类型，不是任意配置map。完整字段/字面值见 [manifest 的 policies 与 evidence](../sources/ignore-debate-session-v1.json)，常量提供同一合同。scenario使用复数policies，session/receipt使用单数policy；必须所有字段相等，不只核id。

policy id=`ignore-debate-standalone-policy-v1`。顶层键为 `id,profile,cards,shout,ignore,identities,initialTopic,deal,hand,round,topic,arithmetic,writer,anger,closing,opening,rethink,refill,capacity,persistence`。新增/易误用部分：

- cards登记topic/shout/ignore三个kind，id=`topic-shout-and-ignore-only-v1`。
- ignore id=`source-no-anger-ignore-v1`：power120、stressDamage30、hpDamage0、damageJitter=false、availability=`angerTimer-zero-only`、additionalEffect=`none`、suppressOpponentAdditionalEffect=true、suppressionScope=`vacuous-for-admitted-cards`。
- round明确hpDamageWinnerDrawCount1、equalPowerDrawCount0、ignoreWinnerDrawCount0，以及两个noDrawReasons。
- topic id=`source-topic-shout-or-ignore-winner-follow-v1`：普通非终局胜改first/topic；大喝/无视非终局胜只改first；平局保持。terminalFirstChange/terminalTopicChange/terminalRefill均false。
- hand使用playableCapacities，不再叫ordinaryCapacities。Shout组没有旧profile的otherRhetoric字段；不得把旧policy与新policy拼合。
- arithmetic公式仅用于普通/大喝；Ignore独立分支不调用damage公式。anger到100非终局整轮拒绝；refill仅填空，牌带不足整轮拒绝。
- identities固定通用、人物hook恒等或禁用；deal为调用者提供序列，非原作随机分布；持久化、原子选择、预算是工程政策。

evidence明确 `ignoreEvidence:'pinned-modern-translated-reference-only'`、`ignoreEvidenceScope:'no-anger-generic-topic-shout-and-ignore-subset'`、`ignoreEffectSuppression:'source-return-before-opponent-effect-vacuous-for-admitted-cards'`。后者只限定在没有额外Effect的已接纳牌，不认证诡辩/镇静/激昂交互。

`sourceIdentity:'modern-CSharp-translation-not-native-or-Vanilla'`；`nativeEquivalent:false,stockOriginalVerified:false,completeDebate:false,originalUnresolvedGroups:43`。普通核心既有E15标签不升级为无视原生证据，不声称本批发现新公式。改变政策/证据需新版本或明确迁移，不能修改字符串继续load。

## 4. 当前全部失败原因与顺序

| reason | 条件 |
|---|---|
| malformed-data / unknown-field | 非安全plain输入、缺键、非法数字/−0、稀疏数组/描述符、JSON解析失败；或未登记键 |
| unsupported-runtime | 没有内建Proxy安全探测入口 |
| unsupported-profile | schemaVersion/profile/difficulty/tag不符，含旧session |
| unsupported-policy / evidence-mismatch | 完整policy/evidence与固定合同不同 |
| unsupported-person / unsupported-item | genericOnly错误、非法ID、personId/person/personHooks/characterId或items/item/equipment/weapon/sword额外键 |
| unsupported-initial-state | 初局不是HP1000/stress0/timer0 |
| unsupported-card / unsupported-action | 未知/缺card kind、非法topic/level；或命令非ResolveIgnoreDebateRound |
| duplicate-participant / invalid-challenger | scenario或choices参与者重复；challenger不属于场景两人 |
| invalid-token / duplicate-token / not-in-hand / invalid-choice-order | token格式错误/重复、不属于自己的当前hand、choices不按scenario排序 |
| stale-revision / stale-round / stale-first | expected值与snapshot不符 |
| session-finished | 终局后继续推进 |
| draw-shape / draw-range | 数量/role/bound不符，含无视胜多给draw；或结构通过后的value不在0..4 |
| unsupported-anger-trigger | 没有HP终局且stress到100，整轮回滚 |
| deck-exhausted | 开局牌不够，或非终局补牌不足；HP终局不补 |
| history-limit | 任何条数/牌带/字节/节点/深度预算超限 |
| invalid-genesis / receipt-mismatch / snapshot-mismatch | 初局、某条receipt或最终snapshot不等于重算 |

表不是多错误优先级承诺。安全分离先于领域解析，例如−0先报malformed-data而不是draw-range；未知字段的人物/物品分类先于一般unknown-field。

- create和普通新命令错误index通常null。
- inspect/save/load/execute/preview先分离整个session；能定位的entries元素结构错误给0-based index，外层或数组描述符错误可能null。晚entry的非法accessor可能早于前entry语义错误被发现。
- 安全结构通过后按历史顺序重算，首失败entry给0-based index；最终snapshot mismatch为null。
- replay先检查scenario和外层commands列表，错误index=−1；之后逐元素分离/parse/append，首失败命令给0-based index，不提前解析后续内部来覆盖较早命令错误。外层洞/非法属性/长度错误仍可先报−1。
- 任一失败没有partial返回；原session、手牌、cursor、日志和计数不变。无视零draw不免除其他校验。

## 5. 输入安全、预算与运行时

只接受Object.prototype或null原型record、标准Array及合法JSON式标量；字段须可枚举数据属性。拒绝Proxy、getter/setter、函数、undefined、外部BigInt、Symbol、Date/custom prototype、循环、稀疏array、额外array属性或非枚举record字段。不调用调用者getter/toJSON/custom iterator。

Proxy检测依赖 `process.getBuiltinModule('node:util').types.isProxy`，缺少时fail-closed为unsupported-runtime。内部BigInt算术不允许外部DTO带BigInt。代码采用可擦除TS语法，但本批未运行，不宣称Node或浏览器兼容性已验证。

| 预算 | 上限 |
|---|---:|
| 成功entries / replay命令数 | 4096 |
| 每方cardTape | 512 |
| canonical完整session UTF-8 bytes | 16,777,216 |
| 值节点 / 嵌套深度 | 1,000,000 / 32 |

输入分离与最终拟议输出都受限；分离器还对数组执行4096通用长度上限，再按领域收紧。load限制原始JSON文本字节；replay累计commands输入预算。政策/证据/receipt重复内容计入整个session，不只算commands。

inspect.remainingEntryCapacity=4096−entryCount，仅说明条数。字节/节点/牌带或stress边界可能先到；preview同样受拟议append后的全部预算。预算耗尽是拒绝，不是游戏平局。

## 6. 保存、加载、重放与接入

save重新校验整个session后返回canonical JSON：object键排序、数组保序，无函数/RNG/外部引用。load只收字符串，可接受等价键序JSON，重新检查tag/policy/evidence、重建genesis、逐条执行命令并对照完整receipt，最后对照snapshot。

inspect/preview/execute/save也完整重算输入，不只在load时检查。存档不能仅存snapshot，不信任外部attack/cursor/hand/damage/赢家/零draw原因；但未签名未加密，不能证明来自真实原作或阻止构造一个内部一致的虚构历史。

使用四轮场景时，取文件的scenario传createIgnoreDebate，或取scenario与commands传replayIgnoreDebate。不要把包含说明/paperExpected的外层对象当scenario，不把paperExpected当已运行receipt。每次函数先判断ok，execute成功后采用返回的新session；save成功json再交load。

首轮命令示意（未执行）：

```ts
{
  type: 'ResolveIgnoreDebateRound',
  expectedRevision: 0,
  expectedRoundIndex: 0,
  expectedFirstId: 'alpha',
  choices: [
    { participantId: 'alpha', cardToken: 'alpha:0' },
    { participantId: 'beta', cardToken: 'beta:0' },
  ],
  rawDraws: [],
}
```

独立场景的首轮alpha Shout/beta Ignore，power110/120，beta胜却damage=null，alpha stress30、双方HP1000，first转beta/topic仍story，双cursor4，revision/round1；noDrawReason为ignore-no-hp-damage。第二轮双Ignore平局使stress45/15，理由改为equal-card-power；第三轮beta Shout使alpha HP820/stress60；第四轮alpha非匹配trend-large伤害120使beta HP880/stress35，然后first转alpha/topic转trend。四轮双cursor4/5/6/7，只有后两轮各一项jitter0。

场景是纸面设计，不是本API执行生成的存档。规则页另有连续无视到stress90、下一轮原子拒绝及HP终局不补牌的边界算例。

## 7. 未执行与不支持声明

仅静态读源与编辑，没有测试、typecheck、编译、build、checker、validator、诊断、产品或样例执行。旧测试、旧topic/Shout session合同未修改；新公开导出不表示历史验证数字覆盖新代码。

现代转录参考子集不是原PC/PK/Vanilla/主机或完整舌战认证，也不覆盖P078、愤激/性格、再考、其他话术、人物/书籍、开场/追击或campaign结果。无视的零HP胜负和附加效果阻断边界不得扩张为未支持动作的许可。
