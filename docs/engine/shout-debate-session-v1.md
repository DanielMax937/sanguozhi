# 普通话题牌 + 大喝独立舌战 API v1

[规则、公式与执行顺序](../rules/shout-debate-session-v1.md) · [完整政策/证据/固定来源](../sources/shout-debate-session-v1.json) · [三轮纸面场景，未运行](../../data/scenarios/shout-debate-example-v1.json)。

可直接从 [packages/engine/src/shout-debate.ts](../../packages/engine/src/shout-debate.ts) 或公共 [engine index](../../packages/engine/src/index.ts) 导入。PR105初版仅新增独立文件；2026-10-20后续登记批次补齐公共导出，不改变本模块行为或保存合同。新 profile 为 `debate-topic-shout-reference-v1`，tag 为 `shout-debate-session-v1`；旧普通牌存档/API 不自动迁移。

## 1. 全部公开函数与常量

以下是源模块的公开名称及签名，不是运行记录：

```ts
export const SHOUT_DEBATE_POLICY_V1: ShoutDebatePolicyV1;
export const SHOUT_DEBATE_EVIDENCE_V1: ShoutDebateEvidenceV1;

export function createShoutDebate(input: unknown): ShoutDebateSessionResultV1;
export function inspectShoutDebate(input: unknown): ShoutDebateInspectionResultV1;
export function previewShoutDebateRound(
  input: unknown, command: unknown
): ShoutDebatePreviewResultV1;
export function executeShoutDebateRound(
  input: unknown, command: unknown
): ShoutDebateExecuteResultV1;
export function saveShoutDebate(input: unknown): ShoutDebateSaveResultV1;
export function loadShoutDebate(json: unknown): ShoutDebateSessionResultV1;
export function replayShoutDebate(
  initialScenario: unknown, commands: unknown
): ShoutDebateReplayResultV1;
```

create/replay 的第一个参数为 scenario；inspect/preview/execute/save 的第一个参数为完整 session；load 只收 JSON 字符串，不接受已解析对象。preview/execute 的函数名有 `Round` 后缀，没有同名无后缀别名。

所有公开结果、其嵌套 DTO 和常量深冻结。输入从不修改；公开输入为 unknown，TypeScript 类型不是运行时校验的替代。

| API | 成功分支 |
|---|---|
| create / load / replay | `{ok:true,session}` |
| inspect | `{ok:true,inspection:{snapshot,policy,evidence,entryCount,remainingEntryCapacity,canonicalUtf8Bytes}}` |
| preview | `{ok:true,preview:{receipt,projectedSnapshot,policy,evidence,externalRngConsumed:0}}` |
| execute | `{ok:true,session,receipt}` |
| save | `{ok:true,json}` |
| 全部失败 | `{ok:false,reason,index}` |

preview 使用与 execute/replay 相同的完整 append/预算路径，不只是伤害预估；不提交日志，也不返回拟议 session。inspect 也会完整重算，不是原样读展示数据。

## 2. 全部公开 DTO 类型

所有名称都从源模块导出。以下结构用可读写形式展示字段；实际导出的复合类型均经递归 readonly 映射，包含数组元素。`Pair<T>` 表示恰好两项且保序，不是任意长度数组。

### 2.1 牌、场景与参与者

```ts
type ShoutDebateTopicV1 = 'story' | 'logic' | 'trend';
type ShoutDebateLevelV1 = 'small' | 'medium' | 'large';
type ShoutDebateTopicCardV1 = {
  kind: 'topic'; topic: ShoutDebateTopicV1; level: ShoutDebateLevelV1;
};
type ShoutDebateShoutCardV1 = { kind: 'shout' };
type ShoutDebateCardV1 = ShoutDebateTopicCardV1 | ShoutDebateShoutCardV1;
type ShoutDebateCardOccurrenceV1 = ShoutDebateCardV1 & {
  token: string; tapeIndex: number;
};
type ShoutDebateParticipantV1 = {
  id: string;
  resolvedIntelligence: number;
  hp: 1000;
  stress: 0;
  angerTimer: 0;
  cardTape: ShoutDebateCardV1[];
};
type ShoutDebateScenarioV1 = {
  schemaVersion: 1;
  profile: 'debate-topic-shout-reference-v1';
  genericOnly: true;
  difficulty: 'source-normal';
  policies: ShoutDebatePolicyV1;
  challengerId: string;
  initialTopic: ShoutDebateTopicV1;
  participants: [ShoutDebateParticipantV1, ShoutDebateParticipantV1];
};
```

强制域：

- 所有 number 为安全整数且非−0；INT为1..100。
- id为 `[A-Za-z][A-Za-z0-9_-]{0,63}`，两人不同；challengerId必须在其中。
- `hp:1000,stress:0,angerTimer:0` 固定；不是任意中局导入。
- 每方牌带最多512项，至少足初始容量；牌带只有模板，不接受 token/tapeIndex。
- 大喝对象只有kind；topic牌必须有kind/topic/level。没有kind或未知kind为 `unsupported-card`；大喝附带topic/level为 `unknown-field`；topic缺必需字段为 `malformed-data`。
- `policies` 必须等于完整 `SHOUT_DEBATE_POLICY_V1`，不是只传id或不完整副本。
- source-normal、genericOnly、固定profile都是边界，不能悄悄接受真人/书籍/性格/MOD字段。

### 2.2 snapshot 与终局

```ts
type ShoutDebateParticipantStateV1 = {
  id: string;
  resolvedIntelligence: number;
  attack: number;
  hp: number;
  stress: number;
  angerTimer: 0;
  sourceSlotCount: number;
  playableHandCapacity: number;
  reservedRethinkSlot: true;
  crumbledLevel: number;
  hand: ShoutDebateCardOccurrenceV1[];
  deckCursor: number;
};
type ShoutDebateOutcomeV1 = {
  kind: 'hp-defeat'; winnerId: string; loserId: string;
};
type ShoutDebateSnapshotV1 = {
  schemaVersion: 1;
  profile: 'debate-topic-shout-reference-v1';
  revision: number;
  roundIndex: number;
  currentTopic: ShoutDebateTopicV1;
  firstId: string;
  status: 'active' | 'finished';
  outcome: ShoutDebateOutcomeV1 | null;
  participants: [ShoutDebateParticipantStateV1, ShoutDebateParticipantStateV1];
};
```

revision/roundIndex从0开始，每成功轮各+1，拒绝不变。attack从双方INT重算，正常域70..227。HP在−100..1000、stress在0..100；成功active状态stress<100，finished可到100；timer恒0。INT阈值70/80/90对应 sourceSlotCount 4/5/6/7、playableHandCapacity 3/4/5/6，普通牌与大喝共用容量，不含再考占位。

hand occurrence的token为 `id:tapeIndex`。初始从tape索引0起按序发，deckCursor是下一未发位置。active成功态补满hand；finished最后消费后不补，通常比容量少一。crumble为0..3，非终局重算，终局保留上轮值。firstId/currentTopic在终局保留最后一轮开始值，不能用firstId代替outcome.winnerId。

### 2.3 唯一命令、选择与随机输入

```ts
type ShoutDebateSelectionV1 = { participantId: string; cardToken: string };
type ShoutDebateRawDrawV1 = {
  role: 'psychological-damage-jitter'; bound: 5; value: number;
};
type ShoutDebateCommandV1 = {
  type: 'ResolveShoutDebateRound';
  expectedRevision: number;
  expectedRoundIndex: number;
  expectedFirstId: string;
  choices: [ShoutDebateSelectionV1, ShoutDebateSelectionV1];
  rawDraws: ShoutDebateRawDrawV1[];
};
```

expectedRevision/round为0..4096且必须匹配；expectedFirstId必须匹配。choices顺序固定为scenario顺序，不随先手变化。两方各选本人的当前hand token，不能只提供模板。token语法接受合法ID后接规范十进制0..999，实际手牌成员资格仍需检查；可生成的tapeIndex最多511。

胜负只接收一个draw，value为0..4；平局严格空数组。没有额外draw角色、RNG callback、seed或外部预计算伤害。两个大喝均power110，因此平局、damage=null、drawCount0。

### 2.4 receipt 的全部子类型

```ts
type ShoutDebatePlayV1 = {
  participantId: string;
  card: ShoutDebateCardOccurrenceV1;
  attack: number;
  power: number;
  matchesCurrentTopic: boolean;
};
type ShoutDebateDamageV1 = {
  sourceId: string;
  targetId: string;
  attack: number;
  jitter: number;
  angerCoefficient: 10;
  levelCoefficient: number;
  topicCoefficient: number;
  requestedHpDamage: number;
};
type ShoutDebateChangeV1 = {
  participantId: string;
  beforeHp: number;
  afterHp: number;
  requestedHpDamage: number;
  actualHpDelta: number;
  beforeStress: number;
  afterStress: number;
  requestedStress: number;
  actualStressDelta: number;
  beforeCrumbledLevel: number;
  afterCrumbledLevel: number;
  consumedCard: ShoutDebateCardOccurrenceV1;
  refilledCards: ShoutDebateCardOccurrenceV1[];
  beforeDeckCursor: number;
  afterDeckCursor: number;
};
type ShoutDebateReceiptV1 = {
  schemaVersion: 1;
  profile: 'debate-topic-shout-reference-v1';
  command: ShoutDebateCommandV1;
  policy: ShoutDebatePolicyV1;
  evidence: ShoutDebateEvidenceV1;
  beforeRevision: number;
  afterRevision: number;
  beforeRoundIndex: number;
  afterRoundIndex: number;
  beforeFirstId: string;
  afterFirstId: string;
  beforeTopic: ShoutDebateTopicV1;
  afterTopic: ShoutDebateTopicV1;
  orderedIds: [string, string];
  plays: [ShoutDebatePlayV1, ShoutDebatePlayV1];
  result: 'winner' | 'draw';
  roundWinnerId: string | null;
  damage: ShoutDebateDamageV1 | null;
  changes: [ShoutDebateChangeV1, ShoutDebateChangeV1];
  consumedDraws: ShoutDebateRawDrawV1[];
  drawCount: 0 | 1;
  noDrawReason: 'equal-card-power' | null;
  terminal: boolean;
  crumbleEvaluated: boolean;
  refillApplied: boolean;
  outcome: ShoutDebateOutcomeV1 | null;
};
```

orderedIds是轮开始 `[first,other]`；plays/changes仍按scenario顺序。大喝 `matchesCurrentTopic:false`，但其damage.topicCoefficient明确为12，不能从false推断为6。普通牌该boolean才用于区分10/6。

平局result=draw、roundWinnerId=null、damage=null、drawCount0、noDrawReason=`equal-card-power`；双方requestedStress15。胜负damage含上述全部系数，drawCount1，noDrawReason=null。大喝levelCoefficient15/topicCoefficient12，对败方stress15；普通level与stress系数10/15/20，topic系数按轮开始topic为10或6。

changes中的requested量与actual差量分开，HP下限−100或stress上限100可能使两者不同。终局terminal=true、crumbleEvaluated=false、refillApplied=false，refilledCards为空、cursor不推进；非终局成功时后二项true。失败没有receipt。

### 2.5 genesis、entry 与 session

```ts
type ShoutDebateGenesisV1 = {
  scenario: ShoutDebateScenarioV1; snapshot: ShoutDebateSnapshotV1;
};
type ShoutDebateEntryV1 = {
  command: ShoutDebateCommandV1; receipt: ShoutDebateReceiptV1;
};
type ShoutDebateSessionV1 = {
  tag: 'shout-debate-session-v1';
  policy: ShoutDebatePolicyV1;
  evidence: ShoutDebateEvidenceV1;
  genesis: ShoutDebateGenesisV1;
  snapshot: ShoutDebateSnapshotV1;
  entries: ShoutDebateEntryV1[];
};
```

genesis.scenario包含完整牌带；genesis.snapshot必须与重建的初局一致。entries保留完整命令、draw和receipt，不能只存最终snapshot。每条receipt的command必须与该条重算命令一致。

### 2.6 所有结果类型

```ts
type ShoutDebateFailureV1 = {
  ok: false; reason: string; index: number | null;
};
type ShoutDebateSessionResultV1 =
  | { ok: true; session: ShoutDebateSessionV1 }
  | ShoutDebateFailureV1;
type ShoutDebateExecuteResultV1 =
  | { ok: true; session: ShoutDebateSessionV1; receipt: ShoutDebateReceiptV1 }
  | ShoutDebateFailureV1;
type ShoutDebatePreviewResultV1 =
  | { ok: true; preview: {
      receipt: ShoutDebateReceiptV1;
      projectedSnapshot: ShoutDebateSnapshotV1;
      policy: ShoutDebatePolicyV1;
      evidence: ShoutDebateEvidenceV1;
      externalRngConsumed: 0;
    } }
  | ShoutDebateFailureV1;
type ShoutDebateSaveResultV1 =
  | { ok: true; json: string }
  | ShoutDebateFailureV1;
type ShoutDebateInspectionResultV1 =
  | { ok: true; inspection: {
      snapshot: ShoutDebateSnapshotV1;
      policy: ShoutDebatePolicyV1;
      evidence: ShoutDebateEvidenceV1;
      entryCount: number;
      remainingEntryCapacity: number;
      canonicalUtf8Bytes: number;
    } }
  | ShoutDebateFailureV1;
type ShoutDebateReplayResultV1 = ShoutDebateSessionResultV1;
```

`reason`的公开TS类型是string，而不是封闭字面量联合；当前实际原因见§4。没有partial成功值，也不会在失败对象附带中途session。

## 3. Policy 与 evidence 的完整登记合同

`ShoutDebatePolicyV1` 和 `ShoutDebateEvidenceV1` 分别是源模块固定 POLICY/EVIDENCE 的递归只读类型，不是可扩展配置map。完整字段及字面量逐字存于 [source manifest 的 policies/evidence](../sources/shout-debate-session-v1.json)，也是常量对象的合同。scenario的复数字段`policies`与session/receipt的单数字段`policy`不能混用。

policy顶层必需键为 `id,profile,cards,shout,identities,initialTopic,deal,hand,round,topic,arithmetic,writer,anger,closing,opening,rethink,refill,capacity,persistence`。

| 组 / 固定 id | 登记内容 |
|---|---|
| 顶层 | id=`shout-debate-standalone-policy-v1`，profile=`debate-topic-shout-reference-v1` |
| cards / `topic-and-shout-only-v1` | kinds topic/shout；topics story/logic/trend；levels small/medium/large；topicPower公式；topicLevelCoefficients和topicStressCoefficients均[10,15,20]；drawStressEach15 |
| shout / `source-no-anger-shout-v1` | power110、levelCoefficient15、topicCoefficient12、stressCoefficient15、availability=`angerTimer-zero-only`、additionalEffect=`none`、otherRhetoric=false |
| identities / `generic-identity-debate-hooks-v1` | realPersonMapping=false、allPersonHooks=`identity-or-disabled`、attackHook/hpDamageHook=`identity`、difficulty=`source-normal`、items/personality=false |
| initialTopic / `provided-initial-topic-v1` | generated=false |
| deal / `provided-ordered-card-tapes-v1` | shuffle/nativeDistribution=false、token=`participantId:tapeIndex`、order=`tape-order-stable-retained-hand`、sourceDisplaySort=false |
| hand / `source-reserved-rethink-slot-v1` | intelligenceThresholds[70,80,90]、sourceSlotCounts[4,5,6,7]、playableCapacities[3,4,5,6]、reservedRethinkSlots1、rethinkPlayable=false |
| round / `paired-choice-atomic-round-v1` | action=`ResolveShoutDebateRound`、choicesOrder=`scenario-participant-order`、resolutionOrder=`first-then-other-recorded-only`、firstDamageBonus=false |
| topic / `source-topic-or-shout-winner-follow-v1` | damageTopic=`round-start`；nonterminalTopicWinnerSets[firstId,currentTopic]；nonterminalShoutWinnerSets[firstId]；nonterminalShoutKeeps[currentTopic]；drawKeeps[firstId,currentTopic] |
| arithmetic / `source-normal-integer-topic-shout-damage-v1` | attack及hpDamage公式见规则；division=`toward-zero`、intermediate=`exact-bigint`、matchingTopicCoefficient10、nonmatchingTopicCoefficient6、angerCoefficient10、jitterBound5、nativePrng=false |
| writer / `source-hp-minus100-to1000-stress0-to100-v1` | hpMin−100、hpMax1000、stressMin0、stressMax100 |
| anger / `reject-nonterminal-anger-trigger-v1` | triggerStress100、rejection=`whole-round-atomic`、cap99/reset/skip=false |
| closing / `session-result-only-closing-v1` | defeatHp0；priority依次hp-defeat、unsupported-anger-trigger、crumble、topic-and-first、refill；terminalRefill/terminalTopicChange/terminalFirstChange/campaignWrite=false |
| opening / `no-opening-instant-win-v1` | initialHp1000、initialStress0、initialAngerTimer0 |
| rethink / `no-rethink-v1` | crumbleStep250、crumbleMax3、exposedAvailableAction=false |
| refill / `fill-next-round-from-tape-v1` | fillOnlyVacancies=true、terminalRefill=false、insufficientTape=`whole-round-atomic-rejection` |
| capacity / `bounded-session-reject-v1` | maxEntries4096、maxTapePerParticipant512、maxCanonicalUtf8Bytes16777216、maxInputNodes1000000、maxInputDepth32、exhaustion=`rejection-not-game-draw` |
| persistence / `full-policy-genesis-recompute-v1` | policyComparison=`all-fields`、genesisSnapshot=`recompute`、receipts/snapshot=`compare-all-fields` |

evidence完整登记键/值：

- `formulaEvidence:'reverse-transcribed-cross-validated'`，`formulaEvidenceScope:'existing-E15-generic-ordinary-core-only'`。只沿用既有普通核心，不把大喝升级为新原生公式发现。
- `shoutEvidence:'pinned-modern-translated-reference-only'`，`shoutEvidenceScope:'no-anger-generic-topic-and-shout-subset'`。
- `stateMachineEvidence:'pinned-modern-translated-reference'`，`dealPolicyEvidence:'provided-sequence-engine-policy'`，`sessionEvidence:'bounded-modern-reference-subset'`。
- `sourceIdentity:'modern-CSharp-translation-not-native-or-Vanilla'`，`sourceCommit:'a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef'`。
- `debateBlob:'0137498d10773cd4596d497083ccdf6a26b3a261'`，`debatePhaseBlob:'6aa98f855a5d4d172cde7e8ffc18a141b8a7b587'`。
- `nativeEquivalent:false`，`stockOriginalVerified:false`，`completeDebate:false`，`originalUnresolvedGroups:43`。
- `genericIdentity:'engine-restricted-source-identity-hooks'`，`initialTopic:'provided-engine-policy'`，`pairedChoice:'atomic-engine-policy'`，`capacityAndPersistence:'engine-policy'`。
- `rhetoric:'shout-only-other-rhetoric-excluded'`，`cardAvailability:'source-no-anger-restricted'`，`angerAndPersonality:'unsupported-boundary'`。
- `rethink:'excluded'`，`realPersonExceptions:'excluded'`，`closingConsequences:'excluded'`，`nativeWholeChain:'open'`。

policy/evidence替换需新版本或明确迁移，不能改字符串继续接收。来源层级不是可由调用者自行提高的配置。

## 4. 全部当前错误与定位

| reason | 当前触发范围 |
|---|---|
| `malformed-data` | 非安全plain输入、缺必需字段、非法数字/−0、稀疏array、异常描述符、非字符串load、JSON解析失败或未分类异常 |
| `unknown-field` | 结构对象的未登记字段，包括大喝多带topic/level |
| `unsupported-runtime` | 缺少内建安全Proxy探测入口；fail-closed，不降级 |
| `unsupported-profile` | schemaVersion/profile/difficulty/tag不符，包含旧topic-only存档 |
| `unsupported-policy` | 完整policy与固定内容不同 |
| `evidence-mismatch` | session完整evidence不符 |
| `unsupported-person` | genericOnly不是true、非法ID或personId/person/personHooks/characterId额外键 |
| `unsupported-item` | items/item/equipment/weapon/sword额外键 |
| `unsupported-initial-state` | 新局hp/stress/angerTimer不为1000/0/0 |
| `unsupported-card` | 未知/缺kind、未支持topic/level；其他话术/再考不是牌联合成员 |
| `unsupported-action` | 非ResolveShoutDebateRound，包括旧ResolveTopicRound |
| `duplicate-participant` | 场景两人重复或choices重复participantId |
| `invalid-challenger` | challengerId不在场景两人中 |
| `invalid-token` | cardToken不是规范ID+十进制索引 |
| `duplicate-token` | 两个选择使用相同token |
| `not-in-hand` | token不是该参与者当前hand成员 |
| `invalid-choice-order` | choices参与者顺序不等于scenario顺序 |
| `stale-revision` / `stale-round` / `stale-first` | expected值与当前snapshot不符 |
| `session-finished` | 对finished session继续推进 |
| `draw-shape` | rawDraws不是数组、数量/role/bound不符，包含平局多给draw或胜负缺draw |
| `draw-range` | 结构通过后的jitter不在整数0..4 |
| `unsupported-anger-trigger` | 无HP终局且stress达到100，整轮拒绝 |
| `deck-exhausted` | 初局不足容量，或非终局补牌不足；终局不要求补牌 |
| `history-limit` | entry、牌带、字节、节点、深度等任一预算超限 |
| `invalid-genesis` | 保存的genesis.snapshot不等于重新生成的初局 |
| `receipt-mismatch` | 某条保存receipt不等于重算receipt |
| `snapshot-mismatch` | 保存的最终snapshot不等于重算结果 |

表不是多重错误优先顺序。外部安全分离先于语义解析，因此非法数字在分离时可能先报malformed-data，而不是后续draw-range；未知字段的特殊人物/物品分类也先于普通unknown-field。

index合同：

1. create一般错误及当前新命令错误为null。
2. inspect/save/load/execute/preview先安全分离整个session；能够定位的entries元素结构错误带该0-based index，外层或数组描述符错误可能为null。安全分离可能先发现晚entry的accessor，早于前entry语义错误；不承诺绕过安全边界找“更早”语义失败。
3. session结构安全后，按entry顺序重算，首失败entry给0-based index；最终snapshot mismatch为null。
4. replay先检查scenario和外层command-list，失败index=−1；随后逐元素分离、parse、append，首失败命令给0-based index。不会先解析后续元素内部来覆盖较早命令错误；外层非法属性/洞/长度仍可先报−1。
5. replay失败无partial session。成功只返回整个session，不另有receipt列表字段，因为entries已含全部receipts。

## 5. 安全输入域、运行时与预算

允许普通 Object.prototype或null原型record、标准Array以及合法JSON式标量；对象字段必须为可枚举数据属性。拒绝Proxy、getter/setter、函数、undefined、外部BigInt、Symbol、Date/custom prototype、循环、稀疏array、额外array属性、非枚举record字段。不调用外部getter/toJSON/custom iterator。

安全Proxy检测依赖 `process.getBuiltinModule('node:util').types.isProxy`。缺少该入口返回unsupported-runtime；不能由“浏览器有JSON”推断本模块可用。中间算术使用BigInt不代表外部DTO可含BigInt。源代码采用可擦除TypeScript语法，但本批没有实际执行，因此不宣称任何Node版本兼容性已经验证。

共同预算：4096 entries、每方512张牌、16MiB canonical完整session UTF-8、1,000,000值节点、深度32。分离器对数组长度也执行最多4096的通用结构上限，再按具体域收紧。输入分离与拟议完整输出均受预算；replay另累计外部command-list的输入预算，load另限制原始文本字节。

inspect.entryCount为已成功entry数，remainingEntryCapacity=4096−entryCount，仅反映条数。policy/evidence在每个receipt重复，全部计入canonicalUtf8Bytes，剩余条数不代表能继续那么多轮；牌带/字节/节点/愤激边界可能先到。preview也必须满足拟议新增entry后的完整预算。

## 6. 保存、加载与重放细节

save返回完整session的canonical JSON字符串：对象键排序，数组顺序不变。JSON中没有函数、RNG实例或外部资源引用。没有“只存snapshot”的快捷存档，也不提供中途跳过历史验证。

load接受canonical或等价键序的JSON，重新校验tag/policy/evidence、重建genesis、逐条执行command并全字段对照receipt，再比较最终snapshot。修改hand/attack/cursor/power/damage/first/topic/winner/draw或增加字段不会被静默忽略。但内部一致性不是身份认证：存档未签名、未加密，不能证明谁实际玩过或来自原作真实进程。

execute/preview/save/inspect同样完整重算传入session；这避免只在load时检查、后续信任任意对象的漏洞。执行成功后调用者显式采用返回的新session，旧对象仍不变。

replay输入是原始scenario与commands数组，不是保存session，也不是带说明的静态场景包装对象。命令来自纸面设计不等于已经得到运行存档；本批没有生成任何运行存档。

## 7. 接入示意与未运行纸面结果

项目根目录的直接模块导入示意：

```ts
import {
  SHOUT_DEBATE_POLICY_V1,
  createShoutDebate,
  previewShoutDebateRound,
  executeShoutDebateRound,
  saveShoutDebate,
  loadShoutDebate,
  replayShoutDebate,
} from './packages/engine/src/shout-debate.ts';
```

以下是完整一轮输入设计，未执行、未typecheck：

```ts
const scenario = {
  schemaVersion: 1,
  profile: 'debate-topic-shout-reference-v1',
  genericOnly: true,
  difficulty: 'source-normal',
  policies: SHOUT_DEBATE_POLICY_V1,
  challengerId: 'alpha',
  initialTopic: 'story',
  participants: [
    {
      id: 'alpha', resolvedIntelligence: 60, hp: 1000, stress: 0, angerTimer: 0,
      cardTape: [
        { kind: 'topic', topic: 'logic', level: 'large' },
        { kind: 'shout' },
        { kind: 'topic', topic: 'trend', level: 'large' },
        { kind: 'topic', topic: 'story', level: 'small' },
      ],
    },
    {
      id: 'beta', resolvedIntelligence: 60, hp: 1000, stress: 0, angerTimer: 0,
      cardTape: [
        { kind: 'shout' },
        { kind: 'shout' },
        { kind: 'topic', topic: 'logic', level: 'small' },
        { kind: 'topic', topic: 'story', level: 'small' },
      ],
    },
  ],
} as const;
const command = {
  type: 'ResolveShoutDebateRound',
  expectedRevision: 0,
  expectedRoundIndex: 0,
  expectedFirstId: 'alpha',
  choices: [
    { participantId: 'alpha', cardToken: 'alpha:0' },
    { participantId: 'beta', cardToken: 'beta:0' },
  ],
  rawDraws: [{ role: 'psychological-damage-jitter', bound: 5, value: 0 }],
} as const;
```

使用顺序是create(scenario)，检查ok，再把成功session传preview/execute；execute成功后save(result.session)，load(saved.json)。每一步都处理失败分支，不从失败值继续取session。若只需重放，replay(scenario,[command])返回同合同的完整session。这些调用描述没有实际执行。

手工计算：初局两人attack100、playableHandCapacity3、cursor3。alpha所选power3，beta大喝power110；damage为180，alpha HP820/stress15，beta HP1000/stress0。非终局first转beta，topic仍story；双方补入索引3后cursor4、hand保留索引1/2/3，revision/roundIndex1。receipt.plays仍alpha/beta顺序，orderedIds为本轮开始alpha/beta；beta.matchesCurrentTopic=false但damage.topicCoefficient12。

该四张牌设计仅保证一轮补牌。下一轮即使有剩余可选手牌，若非终局仍因缺下一张补牌而deck-exhausted，不能误当作可完成整场的无限牌库。完整三轮输入请用 [独立场景](../../data/scenarios/shout-debate-example-v1.json) 的scenario/commands，不把其wrapper或paperExpected传入API。

## 8. 本批验证边界

仅静态读源和编辑文本，没有测试、typecheck、编译、build、checker、validator、诊断、产品或样例执行。没有改旧测试、旧普通session或package index。文档中的数值为手工推导，不是运行receipt。

`nativeEquivalent:false`、`stockOriginalVerified:false`、`completeDebate:false`。本profile只覆盖普通话题与正常态大喝，来源是固定现代C#转录，不认证PC/PK/Vanilla或主机原生等价，不接人物/再考/愤激/其他话术/追击/campaign。历史普通公式证据、这个API的子集覆盖和完整原作认证是三件不同的事。
