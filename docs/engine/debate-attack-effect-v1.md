# 舌战普通 Attack → Effect → CalcWinner API v1

[规则与固定来源](../rules/debate-attack-effect-v1.md) · [来源映射](../sources/debate-attack-effect-v1.json) · [实现](../../packages/engine/src/debate-attack-effect.ts) · [纸面场景](../../data/scenarios/debate-attack-effect-paper-v1.json)。

入口 `evaluateDebateAttackEffect(input: unknown): DebateAttackEffectResultV1`；固定常量 `DEBATE_ATTACK_EFFECT_POLICY_V1`、`DEBATE_ATTACK_EFFECT_EVIDENCE_V1`。只在本段完成后发布唯一成功结果，不调用下一段、不修改调用者对象、不修改任何既有核或旧会话。本页是静态合同，未执行代码、场景、测试、编译或validator。

## 完整输入

以下结构省略递归 readonly。对象须为安全JSON式数据，不是JSON字符串；顶层恰十一字段，人物恰六字段。`policies` 必须等于完整固定政策，包括嵌套原HP政策，不能仅传id、少字段、补丁或自定evidence。

```ts
type DebateAttackEffectInputV1 = {
  schemaVersion: 1;
  profile: 'debate-attack-effect-reference-v1';
  policies: DebateAttackEffectPolicyV1;
  genericOnly: true;
  isTutorial: false;
  winner: -1;
  firstTeam: 0 | 1;
  attacker: -1 | 0 | 1;
  currentTopic: 0 | 1 | 2;
  characters: [DebateAttackEffectCharacterV1, DebateAttackEffectCharacterV1];
  rawDraws: { role: 'debate-hp-damage-jitter'; bound: 5; value: number }[];
};
type DebateAttackEffectCharacterV1 = {
  personality: 'timid' | 'calm' | 'bold' | 'reckless';
  angerTimer: number;
  hp: number;
  stress: number;
  resolvedAttack: number;
  playedCard: number;
};
```

数值均为安全整数且不能是负零。每队angerTimer为0..4，初始hp为1..1000，stress为0..100，resolvedAttack为70..227，playedCard为1..14。winner初始必须−1；firstTeam与attacker不是同一概念。所有两队数据都完整校验，包括分支不会使用的属性。满压力、正timer不拒绝，也不因此自动进入愤怒。

currentTopic无条件限定0..2；PR125允许signed32，不代表其所有输出均可接入。attacker只接受调用者已解析检查点，不重算、不认证可用性或出牌可达性。手牌、牌堆、strength、combo等不属于本DTO；未知字段直接拒绝。

rawDraws数组必须明确提供，语法长度0或1，每个draw恰role、bound、value三字段；value为0..4。先验证完整语法再检查分支需求：平局、无视、诡辩对非普通牌需求0，其余需求1。缺失、多余均整笔拒绝。镇静／激昂作为攻击牌走默认HP核，虽然结果为0仍需求1。不得复用愤怒连打jitter角色或将牌堆游标当抽样。

## 安全与执行顺序

1. 通过可信Node `process.getBuiltinModule('node:util').types.isProxy` 检测器，先安全分离完整输入。检测器不可用时在检查调用者输入前失败关闭。
2. 不调用getter或调用者函数；拒绝proxy、accessor、symbol、非普通原型、不可枚举装饰字段、稀疏数组、循环、非JSON值、非整数／unsafe数字／负零。重复但无环引用分别复制并计预算。
3. 完整封闭字段、政策与所有领域边界检查。分支所需draw数量检查在任何状态写入或HP核调用之前完成。
4. 需要时调用一次不变 `evaluateDebateHpDamage`，使用攻击方personality／timer／resolvedAttack；诡辩只替换为对手已出话题牌作为card参数。原HP完整成功结果保留，不仅摘出数值。
5. 依来源执行Attack，保存afterAttack，再执行攻击方／对手Effect（平局跳过、无视抑制对手），保存afterEffects；最后CalcWinner。
6. 仅完整成功返回state和receipt；失败没有部分人物或成功HP收据泄漏。所有成功、失败、常量和嵌套结果递归冻结并与调用者分离，不冻结或修改调用者对象。

安全预算为4096访问节点、深度16、数组长度32、canonical UTF-8 65536字节；领域draw数组仍限0..1、人物数组仍恰2项。预算是工程上限，不是来源规则。HP核保留其自身独立边界与预算，不传入本层完整政策或收据。

## 完整成功结果

```ts
type DebateAttackEffectSuccessV1 = {
  ok: true;
  schemaVersion: 1;
  profile: 'debate-attack-effect-reference-v1';
  policy: DebateAttackEffectPolicyV1;
  evidence: DebateAttackEffectEvidenceV1;
  state: DebateAttackEffectStateV1;
  nextCheckpoint: 'ready-for-anger' | 'terminal-pending-classification';
  receipt: DebateAttackEffectReceiptV1;
};
type DebateAttackEffectStateV1 = {
  genericOnly: true;
  isTutorial: false;
  winner: -1 | 0 | 1;
  firstTeam: 0 | 1;
  attacker: -1 | 0 | 1;
  currentTopic: 0 | 1 | 2;
  characters: [DebateAttackEffectCharacterV1, DebateAttackEffectCharacterV1];
};
```

除hp／stress和winner外状态按输入值保留；结果hp允许−100..1000，不能把输出Character类型理解为再次输入时必然通过初始正HP域。timer不递减；playedCard不复位。成功不意味着原生全链闭合。

```ts
type DebateAttackEffectReceiptV1 = {
  sequence: ['Attack', 'Effect', 'CalcWinner'];
  attackBranch: 'draw' | 'ignore' | 'sophistry-ordinary' |
    'sophistry-no-ordinary' | 'shout' | 'default-topic';
  hpDamage: DebateHpDamageSuccessV1 | null;
  writes: DebateAttackEffectWriteV1[];
  effects: { team: 0 | 1; card: number; kind: 'none' | 'compose' | 'agitate' }[];
  opponentEffectSuppressed: boolean;
  effectsSkippedForDraw: boolean;
  afterAttack: [DebateAttackEffectCharacterV1, DebateAttackEffectCharacterV1];
  afterEffects: [DebateAttackEffectCharacterV1, DebateAttackEffectCharacterV1];
  consumedDraws: 0 | 1;
  externalRngConsumed: 0;
  winnerCheck: {
    firstTeam: 0 | 1;
    opponentTeam: 0 | 1;
    firstHp: number;
    opponentHp: number;
    winner: -1 | 0 | 1;
  };
};
type DebateAttackEffectWriteV1 = {
  index: number;
  stage: 'attack' | 'effect';
  kind: 'draw' | 'ignore' | 'topic' | 'shout' | 'compose' | 'agitate';
  actor: -1 | 0 | 1;
  target: 0 | 1;
  reflected: boolean;
  requestedHpDelta: number;
  requestedStressDelta: number;
  hpBefore: number;
  hpAfter: number;
  stressBefore: number;
  stressAfter: number;
};
```

writes是来源动作的合并HP／压力审计，每项携带前后值与请求delta；不是每个底层赋值的独立日志，也不能用请求delta替代钳制后实际差值。index按实际动作顺序从0连续。默认零伤害动作仍有write。平局两条write的actor为−1，目标按0、1；诡辩反射的topic write遵照 `TopicCard(opponentTeam,...,true)`，actor和target均为原话题出牌者，对手诡辩方仍是state.attacker且是hpDamage的计算属性来源。不可将write.actor误解为所有情况下的普通攻击方。

effects记录实际访问队伍，包括kind=none的访问；平局为空；无视仅攻击方一项。hpDamage=null表示没有调用HP核，不是调用所得零伤害；零伤害调用仍返回完整原成功对象与draw审计。afterAttack与afterEffects分别独立快照；后续修改不会回写前一阶段快照。

winnerCheck记录以firstTeam顺序检查的最终HP与winner。非终局只表示已准备到愤怒前数据边界，调用者须以返回HP／stress投影到其持有的完整PR126输入，另保留原ordinary attacker、playedCard与牌组等；本API不自动调用或替调用者证明愤怒入口。终局保留HP／压力和牌等元数据，停在待分类，不调用CanCritical／Critical／Closing。

## 失败与导出

失败仅 `{ ok:false, reason, dependencyFailure? }`。只有 `hp-damage-failed` 携带完整原HP失败对象；不携带中间state、writes、effects或成功HP结果。失败原因联合：

准确值为 `unsupported-runtime`、`input-limit`、`malformed-data`、`unknown-field`、`unsupported-profile`、`unsupported-policy`、`invalid-checkpoint`、`invalid-character`、`invalid-current-topic`、`invalid-raw-draws`、`invalid-draw`、`invalid-draw-role`、`invalid-draw-bound`、`invalid-draw-value`、`draw-count-mismatch`、`hp-damage-failed`。缺字段或非安全数据可能在具体领域错误前以malformed-data拒绝；不承诺多重错误时任意调用者偏好的优先级。

公共类型：`DebateAttackEffectCharacterV1`、`InputV1`、`StateV1`、`WriteV1`、`ReceiptV1`、`SuccessV1`、`FailureV1`、`FailureReasonV1`、`ResultV1`、`PolicyV1`、`EvidenceV1`（后十项均带相同`DebateAttackEffect`前缀）。EffectVisit、RawDraw等内部缩写未另设公共类型导出。

## 静态验收边界

配套22个成功／18个拒绝纸面描述以明确baseline、变更和人工期望列出，不是完整API输入或可执行runner，不携带从候选计算而来的“实测值”。覆盖攻击分支、诡辩属性／目标、零伤害仍抽样、四人格兴奋系数、压力钳制、反射量读取、效果顺序、致死后效果与域拒绝；不声称穷尽所有输入、双亡可达、运行正确或编译通过。

P078及依赖、旧九会话和既有HP核不改；43主题／45历史快照缺口不减。未运行测试、编译、typecheck、build、validator、checker、候选、来源、情景或replay。固定现代来源与静态审阅不构成原作PK／Vanilla等价证明。
