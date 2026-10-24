# 有界 checked 双队出牌事务 API v1

[规则与来源边界](../rules/debate-checked-play-v1.md) · [固定政策与证据](../sources/debate-checked-play-v1.json) · [纸面案例，未运行](../../data/scenarios/debate-checked-play-example-v1.json)。

实现入口为 [debate-checked-play.ts](../../packages/engine/src/debate-checked-play.ts)，公共导出见 [engine index](../../packages/engine/src/index.ts)。本页覆盖一个独立、有界、非终局且非教程的双队数据事务：先手完成选择／移除／可选再考／重置／重选，后手再完成同一流程，最后调用原攻击方查询，到 `DamagePhaseBegin` 的 `CalcAttacker` 之后、`Attack` 之前停止。

直接复用既有 `evaluateDebateCardAvailability`、`evaluateDebateRethinkAction`、`evaluateDebateAttackerSelection`；再考继续通过原动作复用填牌和冷静加成，不复制第二套算法。**每次选择前的 Availability gate 是显式工程 checked-choice 条件，不是来源 `PlayPhase` 或 `PlayCard` 内调用了 `IsCardAvailable` 的声明。** 来源只提供有界流程所依据的操作与顺序；本接口不实现等待、AI、UI或可持久化的phase／step机器。

## 1. 公开入口与固定合同

```ts
evaluateDebateCheckedPlay(input: unknown): DebateCheckedPlayResultV1
DEBATE_CHECKED_PLAY_POLICY_V1: DebateCheckedPlayPolicyV1
DEBATE_CHECKED_PLAY_EVIDENCE_V1: DebateCheckedPlayEvidenceV1
```

输入为JSON式数据值，不是JSON文本。`unknown` 入口先安全分离完整输入，再作封闭字段和领域校验；类型断言不能绕过校验。输入字段为复数 `policies`，成功及收据字段为单数 `policy`；必须传完整固定政策，不能只传id，也不能替换任何嵌套组件政策。

复合公开类型递归readonly。下文DTO省略重复readonly标记，仅是静态说明；成功、失败、导出常量及全部嵌套收据均递归冻结。调用者对象不会被修改或冻结，输出不保存调用者的可变引用。没有隐藏牌堆游标、seed、跨调用状态或自动旧session桥接。

全部30个公开类型别名为：

```text
DebateCheckedPlayTeamV1
DebateCheckedPlayAttackerV1
DebateCheckedPlayPersonalityV1
DebateCheckedPlayCardCodeV1
DebateCheckedPlaySourceCardV1
DebateCheckedPlayPhysicalCardV1
DebateCheckedPlayPhysicalHandV1
DebateCheckedPlayRawDrawV1
DebateCheckedPlayRawResultV1
DebateCheckedPlayCharacterCheckpointV1
DebateCheckedPlayCharacterStateV1
DebateCheckedPlaySelectionV1
DebateCheckedPlayPlanV1
DebateCheckedPlayInputV1
DebateCheckedPlayStateV1
DebateCheckedPlayReadyCheckpointV1
DebateCheckedPlayPlayedCardWriteV1
DebateCheckedPlayDiscardedTailCardV1
DebateCheckedPlaySurvivorV1
DebateCheckedPlayRemovalAuditV1
DebateCheckedPlayResetAuditV1
DebateCheckedPlaySelectionAuditV1
DebateCheckedPlayRandomEventV1
DebateCheckedPlayReceiptV1
DebateCheckedPlaySuccessV1
DebateCheckedPlayFailureReasonV1
DebateCheckedPlayFailureV1
DebateCheckedPlayResultV1
DebateCheckedPlayPolicyV1
DebateCheckedPlayEvidenceV1
```

没有create、execute、save、load、replay或完整游戏入口。性格、牌码、两种随机记录和攻击方类型直接沿用原组件域；本层新加的是有限计划、状态边界和组合收据，不改依赖核定义。

## 2. 输入、选择计划与检查点

```ts
type DebateCheckedPlayTeamV1 = 0 | 1;
type DebateCheckedPlayAttackerV1 = -1 | DebateCheckedPlayTeamV1;
type DebateCheckedPlayPersonalityV1 = 'timid' | 'calm' | 'bold' | 'reckless';
type DebateCheckedPlayCardCodeV1 =
  1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14;
type DebateCheckedPlaySourceCardV1 = 0 | DebateCheckedPlayCardCodeV1;
type DebateCheckedPlayPhysicalCardV1 = -1 | DebateCheckedPlaySourceCardV1;
type DebateCheckedPlayPhysicalHandV1 = [
  DebateCheckedPlayPhysicalCardV1, DebateCheckedPlayPhysicalCardV1,
  DebateCheckedPlayPhysicalCardV1, DebateCheckedPlayPhysicalCardV1,
  DebateCheckedPlayPhysicalCardV1, DebateCheckedPlayPhysicalCardV1,
  DebateCheckedPlayPhysicalCardV1
];
type DebateCheckedPlayRawDrawV1 = {
  role: 'debate-fill-topic-repair'; bound: 9; value: number;
};
type DebateCheckedPlayRawResultV1 = {
  role: 'debate-calm-rethink-rand-bool'; percent: 40; value: boolean;
};
type DebateCheckedPlayCharacterCheckpointV1 = {
  personality: DebateCheckedPlayPersonalityV1;
  angerTimer: number;
  maxCardCount: number;
  hand: DebateCheckedPlayPhysicalHandV1;
  playedCard: -1;
  canRethink: boolean;
  cardTape: DebateCheckedPlayCardCodeV1[];
  deckCursor: number;
};
type DebateCheckedPlayCharacterStateV1 =
  Omit<DebateCheckedPlayCharacterCheckpointV1, 'playedCard'> & {
    playedCard: DebateCheckedPlayPhysicalCardV1;
  };
type DebateCheckedPlaySelectionV1 = {
  cardIndex: number;
  rawDraws: DebateCheckedPlayRawDrawV1[];
  rawResults: DebateCheckedPlayRawResultV1[];
};
type DebateCheckedPlayPlanV1 = { selections: DebateCheckedPlaySelectionV1[] };
type DebateCheckedPlayInputV1 = {
  schemaVersion: 1;
  profile: 'debate-checked-play-reference-v1';
  policies: DebateCheckedPlayPolicyV1;
  isTutorial: false;
  winner: -1;
  firstTeam: DebateCheckedPlayTeamV1;
  currentTopic: number;
  characters: [DebateCheckedPlayCharacterCheckpointV1, DebateCheckedPlayCharacterCheckpointV1];
  plans: [DebateCheckedPlayPlanV1, DebateCheckedPlayPlanV1];
};
type DebateCheckedPlayStateV1 = {
  isTutorial: false;
  winner: -1;
  firstTeam: DebateCheckedPlayTeamV1;
  currentTopic: number;
  characters: [DebateCheckedPlayCharacterStateV1, DebateCheckedPlayCharacterStateV1];
};
```

输入顶层精确字段为 `schemaVersion,profile,policies,isTutorial,winner,firstTeam,currentTopic,characters,plans`。`characters` 与 `plans` 始终按队号0、1索引，**不是按先后手顺序存放**；执行顺序才由 `firstTeam` 决定。

每个角色精确字段为 `personality,angerTimer,maxCardCount,hand,playedCard,canRethink,cardTape,deckCursor`。每队计划精确字段为 `selections`，每个选择精确字段为 `cardIndex,rawDraws,rawResults`。所有字段均必需，没有默认值、可省略数组、字符串数值转换或自动补全。

| 字段 | 准入合同 |
|---|---|
| schemaVersion / profile | 数字1 / 精确字符串 `debate-checked-play-reference-v1` |
| policies | 完整固定政策逐值相等；对象键顺序无关，数组顺序有关 |
| isTutorial | 精确false；不模拟教程选择路由 |
| winner | 精确数字−1；只是调用方非终局路由检查点，不自行查询HP或胜负 |
| firstTeam | 数字0或1；另一队为1−firstTeam |
| currentTopic | 有符号32位整数−2147483648..2147483647；0..2以外可进入但不获得话题匹配／冷静覆盖 |
| characters | 恰好两个角色，分别为队0与队1 |
| personality | `timid`、`calm`、`bold`、`reckless` 四个精确字符串之一；调用方已解析性格 |
| angerTimer | 整数0..4 |
| maxCardCount | 整数4..7；活动物理槽为0..容量减1 |
| hand | 恰好七项稠密数组；初始槽0必须为0，活动槽1..容量减1全部为1..14，非活动尾槽为−1..14 |
| playedCard | 初始精确为−1 |
| canRethink | 真正boolean；true或false均可作为初始事实，选择0时另经Availability检查 |
| cardTape | 每队完整当前18项牌堆，每项1..14；不能只传剩余片段 |
| deckCursor | 整数0..18 |
| plans | 恰好两队计划，按队号索引 |
| selections | 每队1或2项，不接纳空计划或任意长度脚本 |
| cardIndex | 整数0..6；轮到该选择时还必须小于当时maxCardCount并指向非空活动槽 |
| rawDraws | 每次选择0或1项；每项为 `{role:'debate-fill-topic-repair',bound:9,value:0..8}` |
| rawResults | 每次选择0或1项；每项为 `{role:'debate-calm-rethink-rand-bool',percent:40,value:boolean}` |

数值安全层首先拒绝小数、NaN、Infinity、不安全整数和−0。原手牌不要求排序，重复牌面允许；`cardIndex` 是**当时的物理槽下标**，不是牌码、原手牌身份或重抽前索引。每次选择都重新从当前候选手牌读取该槽。初始满手条件、七槽域、性格／计时域、非终局／非教程声明均为工程准入，不证明该状态确实由上次TurnStart或完整来源历史产生。

牌码为：−1空；0再考；1..3故事、4..6道理、7..9时节，各组依次小／中／大；10大喝、11诡辩、12无视、13镇静、14激昂。活动可出牌槽的0与−1不满足初始ready-hand合同，即使它随后可能被再考清除。独立RethinkAction允许原活动0的更宽检查点，不表示本入口也允许。

### 2.1 计划不是“试到可用”为止

每队必须以一张非0的普通牌或话术完成出牌。第一项若为非0，立即结束该演员；第二项即使语法合法也属于多余选择。第一项若为0，必须先完成移除、原RethinkAction和playedCard重置，才读取第二项；缺第二项则整个事务失败。

不替调用者跳过无效下标、空槽或不可用牌，不自动改选其他槽，不把来源等待UI／AI重新返回选择的循环模拟成重试。第二项选择恢复后的0也仍调用Availability；成功再考已把额度写false，因此会被拒绝。每队最多一个**已接受**再考是本checked gate与额度写入共同得出的上界，不是来源PlayPhase循环本身只允许一次的证明。

非0选择不能携带任何随机项。再考选择携带的两个数组先通过完整形状／值域解析，随后由原动作判断是否真的需要修补整数draw或冷静布尔结果。不能把本次选择的随机记录移到下一项或另一队；不存在可自由消费的共享随机池。

### 2.2 有限当前牌堆

非0选择不补牌，不推进牌堆游标；初始cursor18也可正常出牌。再考无论旧手牌是否已满都重新取 `maxCardCount−1` 张，即3..6张。成功要求本队 `deckCursor + maxCardCount - 1 <= 18`；恰好使用索引17并返回cursor18有效，实际需要第19张则整个事务失败。

不回绕、不重置游标、不截短补牌、不借用对手牌堆，不调用DeckGenerate。话题修补draw不是额外牌堆项。完整18牌都须有效，包括已消费与本次未用项。任意第二队耗尽仍不能发布第一队已完成的结果。

## 3. 来源操作顺序与工程 gate

完整安全分离和全部领域解析完成后，私有候选严格按以下流程处理：

1. 取actorOrder为 `[firstTeam,1-firstTeam]`。先手的一队计划彻底结束后才开始后手，不交错两队再考／重选。
2. 在当前角色手牌解析本次cardIndex，检查活动范围和非空；向未修改的Availability传递两队当前性格、计时器、额度及读到的牌码。不可用则整个事务失败，不能先移除。
3. 记录playedCard赋值，再按来源CharacterRemoveCard移除本槽并压紧活动前缀。
4. 牌码非0时本演员完成；两种随机数组必须为空，且不能有第二个选择。
5. 牌码为0时，将**移除后的七槽手牌**和playedCard=0交给未修改RethinkAction。动作先清活动前缀、原fill、原Calm、最后额度false；完整成功对象原样保留。随后本组合层按PlayPhase后续步骤把playedCard从0重置为−1，再以新手牌解析下一cardIndex。
6. 两队都以非0牌完成后，把最终playedCards按队0、队1顺序传给未修改AttackerSelection；保留其完整成功对象，并返回攻击前检查点，不执行Attack。

### 3.1 移除会清除非活动尾槽

来源CharacterRemoveCard先把选中槽置−1，复制完整七槽，再把**全部七个物理槽**清为−1；最后仅按原活动前缀的下标升序，把非−1值压回开头。它不是只清活动区，也不是数值排序。相等牌和其他非空牌按原槽顺序保留，选中槽以外的非活动尾槽也不会存活。

因此本组合任何已接受选择都会清掉原尾槽，不能照搬独立RethinkAction的“尾槽保留”作为整笔事务保证。再考组件仍原样保留它收到的尾槽，但那时尾槽已被前面的PlayCard移除变成−1。初始hand0=0的非0选择保留0；选择再考0后，原其他活动牌会压到槽0，随后原再考动作再清除这些牌并恢复新的再考0。

### 3.2 Availability保留原短路与对手条件

普通牌1..9始终通过该谓词。再考0先阻止己方正计时器刚胆，再检查己方额度；对方正计时器冷静不会直接禁止再考。10／11／12先阻止己方正计时器刚胆，再阻止对方正计时器冷静。13／14先阻止己方正计时器冷静或刚胆，再阻止对方正计时器冷静。胆小／莽撞的正计时器不触发这些限制；对方正计时器刚胆不等于对方冷静压制。

不可用在Availability模块本身是 `ok:true,available:false`，在本事务则转成 `selected-card-unavailable` 且无部分审计。成功收据只包含已接受选择的完整Availability成功对象，包括原reason和实际到达的短路checks，不重新计算或抹去组件证据。

### 3.3 两类显式随机与组件局部索引

单次再考最多先消费一个bound9修补整数draw，再消费一个percent40的语义布尔返回值。只有正timer的calm需要后者，即使currentTopic不在0..2也不能省略；返回true且话题有效才覆盖当前已排序手牌槽1为3／6／9。同牌覆盖仍记录执行，不能以值未变删掉历史。percent40不是bound100，接口不生成或推断底层PRNG结果。

外层事件按照实际演员顺序、该演员再考内的修补→冷静顺序排列，总数最多4。牌堆逐项取牌不是这份显式随机事件表中的新增RNG调用。原fill修补drawIndex、原Calm布尔index、原RethinkAction的eventIndex与localIndex全部保留，外层另给全局位置，不改写嵌套索引。

### 3.4 攻击方仍由原查询决定

两队最终牌码均为1..14，但AttackerSelection本身的独立宽输入合同不被修改。普通牌基础牌力为1加零基等级，话题有效且匹配再加10；大喝110、诡辩20、无视120，镇静／激昂0。正计时器刚胆无条件将自身最终牌力赋为100，不是加100或取最大值；严格较大者为攻击方，相等为−1，不按先手打破平局。

本checked入口会先拒绝兴奋刚胆持10／11／12的选择，因此不能直接借用独立查询“刚胆降低无视120为100”的合成例子冒充本入口成功路径。可用性资格与最终牌力判断是两个不同组件、不同职责。

## 4. 成功检查点与完整主收据

```ts
type DebateCheckedPlayReadyCheckpointV1 = DebateCheckedPlayStateV1 & {
  kind: 'ready-for-attack';
  sourceBoundary: 'after-DamagePhaseBegin-CalcAttacker-before-Attack';
  attacker: DebateCheckedPlayAttackerV1;
};
type DebateCheckedPlaySuccessV1 = {
  ok: true;
  schemaVersion: 1;
  profile: 'debate-checked-play-reference-v1';
  policy: DebateCheckedPlayPolicyV1;
  evidence: DebateCheckedPlayEvidenceV1;
  attacker: DebateCheckedPlayAttackerV1;
  checkpoint: DebateCheckedPlayReadyCheckpointV1;
  receipt: DebateCheckedPlayReceiptV1;
};
type DebateCheckedPlayReceiptV1 = {
  schemaVersion: 1;
  profile: 'debate-checked-play-reference-v1';
  policy: DebateCheckedPlayPolicyV1;
  evidence: DebateCheckedPlayEvidenceV1;
  before: DebateCheckedPlayStateV1;
  after: DebateCheckedPlayReadyCheckpointV1;
  actorOrder: [DebateCheckedPlayTeamV1, DebateCheckedPlayTeamV1];
  plans: [DebateCheckedPlayPlanV1, DebateCheckedPlayPlanV1];
  selections: DebateCheckedPlaySelectionAuditV1[];
  attackerSelection: DebateAttackerSelectionSuccessV1;
  randomEvents: DebateCheckedPlayRandomEventV1[];
  selectionCount: 2 | 3 | 4;
  rethinkCount: 0 | 1 | 2;
  randomEventCount: 0 | 1 | 2 | 3 | 4;
  externalRngConsumed: 0;
};
type DebateCheckedPlayFailureV1 = {
  ok: false; reason: DebateCheckedPlayFailureReasonV1;
};
type DebateCheckedPlayResultV1 =
  DebateCheckedPlaySuccessV1 | DebateCheckedPlayFailureV1;
```

成功顶层只有以上八字段；没有顶层playedCards、hand、reason、session或可恢复step。`attacker`、`checkpoint.attacker`、`receipt.after.attacker`及 `receipt.attackerSelection.attacker` 相同；checkpoint与receipt.after值相同，不以对象身份作为调用合同。

before保存两队完整输入状态，不含plans或随机数组；原计划及所有提供的随机记录另在receipt.plans中完整保留。after为完整七槽状态及新攻击方边界，不是只给差异。成功后两队playedCard实际均为1..14，槽0仍为0，活动区剩余容量减2张非0牌，其余七槽中的空位为−1。原始手牌可未排序，非0移除不排序；没有再考时最终剩余牌仍按原槽顺序，不保证数值非递减。

`CharacterStateV1.playedCard` 的静态联合含−1／0／1..14，以表达中间快照；不能据该宽类型声称最终ReadyCheckpoint会带−1或0。currentTopic、firstTeam、isTutorial、winner、性格、计时器、容量和cardTape内容保持原样。没有再考时额度／cursor保持；有再考时只本队cursor推进且额度false，组合层不恢复额度。

selectionCount等于selections长度，也是2加rethinkCount；randomEventCount等于randomEvents长度。每个成功计划所有项都确实消费，没有悄悄丢弃的选择或随机项。失败只有冻结的ok、reason，不含这些计数、部分角色、事件、异常文本或失败阶段。

## 5. 每次选择、移除与随机审计

### 5.1 选择审计与阶段快照

```ts
type DebateCheckedPlayPlayedCardWriteV1 = {
  before: -1;
  after: DebateCheckedPlaySourceCardV1;
  beforeRemoval: true;
};
type DebateCheckedPlayResetAuditV1 = {
  before: 0;
  after: -1;
  afterRethink: true;
  beforeReselection: true;
};
type DebateCheckedPlaySelectionAuditV1 = {
  selectionOrder: number;
  actorOrder: DebateCheckedPlayTeamV1;
  team: DebateCheckedPlayTeamV1;
  selectionIndex: number;
  cardIndex: number;
  card: DebateCheckedPlaySourceCardV1;
  before: DebateCheckedPlayCharacterStateV1;
  availability: DebateCardAvailabilitySuccessV1;
  playedCardWrite: DebateCheckedPlayPlayedCardWriteV1;
  removal: DebateCheckedPlayRemovalAuditV1;
  rethink: DebateRethinkActionSuccessV1 | null;
  reset: DebateCheckedPlayResetAuditV1 | null;
  after: DebateCheckedPlayCharacterStateV1;
};
```

selectionOrder为整笔选择的0起连续序号。selectionIndex为本队计划的0起下标。**单项中的actorOrder虽然类型也为0或1，但表示执行位置：0先手、1后手，不是队号；team才是队号。** 例如firstTeam=1时，先手两次选择的actorOrder均0、team均1、selectionIndex分别0和1。主收据actorOrder则是队号排列 `[1,0]`，不要将二者同名字段混淆。

before是本演员本次选择前的完整角色，playedCard必为−1。playedCardWrite记录先写牌码再移除，beforeRemoval恒true。非0选择的rethink与reset均null，after为移除后的最终角色；再考选择的after则是原动作成功、额度已false且**外层playedCard重置为−1之后**的角色，还没有执行下一选择。

原动作success.character及receipt.after.character中的playedCard仍为0，其receipt.playedCard.resetPerformed仍false；本层必须保留原值，不能把外层reset混写进嵌套收据。原动作receipt.before.character与removal.handAfter对应，是实际移除后输入，不是本层selection.before。对手状态没有塞进该角色快照，但Availability保留其两队资格审计；顶层before／after保存完整两队状态。

### 5.2 全七槽清除与稳定压紧

```ts
type DebateCheckedPlayDiscardedTailCardV1 = {
  sourceIndex: number; card: DebateCheckedPlaySourceCardV1;
};
type DebateCheckedPlaySurvivorV1 = {
  sourceIndex: number;
  destinationIndex: number;
  card: DebateCheckedPlaySourceCardV1;
};
type DebateCheckedPlayRemovalAuditV1 = {
  selectedIndex: number;
  selectedCard: DebateCheckedPlaySourceCardV1;
  activeSlotCount: number;
  handBefore: DebateCheckedPlayPhysicalHandV1;
  handAfterSelectedClear: DebateCheckedPlayPhysicalHandV1;
  handAfterBackingClear: DebateCheckedPlayPhysicalHandV1;
  handAfter: DebateCheckedPlayPhysicalHandV1;
  discardedTail: DebateCheckedPlayDiscardedTailCardV1[];
  survivors: DebateCheckedPlaySurvivorV1[];
  allBackingSlotsCleared: true;
  numericSortPerformed: false;
};
```

handBefore为移除之前的七槽；handAfterSelectedClear仅选中槽改成−1；handAfterBackingClear恒为七个−1；handAfter为活动区非空幸存牌按原下标升序压回后的七槽。activeSlotCount等于maxCardCount，不因移除减少容量。

discardedTail只按sourceIndex升序记录原非活动尾槽里非−1的值，包含0；不记录本次选中牌或活动幸存牌，不表示有外部弃牌堆写入。survivors只记录原活动区非−1且非选中槽的牌，包含活动再考0；destinationIndex从0连续递增，sourceIndex是该次移除前物理槽，不是跨再考永久牌身份。删除一次只建立该次局部映射，不能直接把它当作全session occurrence标识。

### 5.3 原组件输出完整保留

以下组件类型属于原模块，不另列为本次新类型导出：

- `availability: DebateCardAvailabilitySuccessV1` 保留全部 `ok,schemaVersion,profile,policy,evidence,team,opponentTeam,card,available,reason,audit`。audit仍有self、opponent、cardClass、按实际短路次序的checks、decisiveCheck和externalRngConsumed。成功选择的available必为true；其原reason不转换成新的成功理由。完整定义见[Availability API](debate-card-availability-v1.md)与[原模块](../../packages/engine/src/debate-card-availability.ts)。
- `rethink: DebateRethinkActionSuccessV1` 非null时保留整个 `ok,schemaVersion,profile,policy,evidence,currentTopic,character,receipt`。嵌套receipt保留完整before／after、clear、fill、calm、quotaWrite、playedCard、providedRawDraws、providedRawResults、randomEvents／count、finalProvenance、externalRngConsumed及自身版本／政策／证据。fill是原填牌完整receipt，calm是原Calm整个success，不裁成部分audit。完整定义见[RethinkAction API](debate-rethink-action-v1.md)与[原模块](../../packages/engine/src/debate-rethink-action.ts)。
- `attackerSelection: DebateAttackerSelectionSuccessV1` 保留全部 `ok,schemaVersion,profile,policy,evidence,currentTopic,playedCards,basePowers,finalPowers,attacker,audit`。audit保留currentTopicValid、两队team audits、strict comparison、externalRngConsumed和stateWrites；原查询stateWrites仍0，不能因本层把attacker放到检查点就改写它。完整定义见[AttackerSelection API](debate-attacker-selection-v1.md)与[原模块](../../packages/engine/src/debate-attacker-selection.ts)。

RethinkAction的finalProvenance仍指向**该次再考完成时**活动手牌，保留两次排序来源、原tapeIndex／originalCard及修补／冷静覆盖史。它不会随下一次最终出牌而重新计算。外层没有声称把这份数组变成最终剩余hand的永久身份；两层审计的边界各自保留。

### 5.4 外层事件不覆盖内层索引

```ts
type DebateCheckedPlayRandomEventV1 = {
  eventIndex: number;
  team: DebateCheckedPlayTeamV1;
  selectionIndex: number;
  actionEventIndex: number;
  localIndex: 0;
} & (
  | {
      stage: 'fill-topic-repair';
      kind: 'integer-draw';
      draw: DebateCheckedPlayRawDrawV1;
    }
  | {
      stage: 'calm-rethink-bonus';
      kind: 'boolean-result';
      result: {
        index: 0;
        role: 'debate-calm-rethink-rand-bool';
        percent: 40;
        value: boolean;
      };
    }
);
```

外层eventIndex从0连续递增；team和selectionIndex定位原计划。actionEventIndex抄原RethinkAction.receipt.randomEvents的eventIndex，单次动作内为0或1；localIndex始终0。原动作使用phase，本层用stage字段，其值相同而原动作对象不变。整数分支只有draw，布尔分支只有带原index0的result，不额外制造bound100或统一rawValue字段。

例如先手只有冷静事件、后手同时有修补与冷静，外层eventIndex为0／1／2，对应actionEventIndex为0／0／1，各组件局部index都仍0。`externalRngConsumed:0` 仅表示没有调用外部RNG，不表示显式提供值没有被使用，也不是原生全局RNG消费数证明。

## 6. 全部失败原因与解析优先序

`DebateCheckedPlayFailureReasonV1` 为三项依赖原因联合加本层14项，去重后44个字面值。依赖原因直接传递，不包为component-failed，也不附带失败队号／阶段／异常文本。完整联合如下：

```ts
type DebateCheckedPlayFailureReasonV1 =
  | 'unsupported-runtime' | 'input-limit' | 'malformed-data' | 'unknown-field'
  | 'unsupported-profile' | 'unsupported-policy' | 'unsupported-tutorial'
  | 'invalid-winner' | 'invalid-first-team' | 'invalid-current-topic'
  | 'invalid-characters' | 'invalid-character' | 'invalid-personality'
  | 'invalid-anger-timer' | 'invalid-max-card-count' | 'invalid-hand'
  | 'invalid-ready-hand' | 'invalid-played-card' | 'invalid-can-rethink'
  | 'invalid-card-tape' | 'unsupported-card-code' | 'invalid-deck-cursor'
  | 'invalid-plans' | 'invalid-plan' | 'invalid-selections' | 'invalid-selection'
  | 'invalid-card-index' | 'invalid-raw-draws' | 'invalid-raw-draw'
  | 'invalid-raw-results' | 'invalid-raw-result'
  | 'selected-index-not-active' | 'selected-card-empty' | 'selected-card-unavailable'
  | 'missing-final-selection' | 'unexpected-selection'
  | 'unsupported-deck-regeneration' | 'missing-raw-draw' | 'unexpected-raw-draw'
  | 'raw-result-count-mismatch'
  | 'invalid-team' | 'invalid-card' | 'invalid-played-cards' | 'invalid-playable-slots';
```

| reason | 准确条件 |
|---|---|
| unsupported-runtime | 可信Proxy检测能力不可用，读取输入前拒绝 |
| input-limit | 任一安全节点、深度、数组、键数或字节预算超限 |
| malformed-data | 危险／非JSON数据或数值，缺必需键，顶层非record，或未分类异常 |
| unknown-field | 安全分离后顶层或领域record带额外键 |
| unsupported-profile | schemaVersion／profile不匹配 |
| unsupported-policy | 完整嵌套政策canonical值不匹配，包括缺项或多项 |
| unsupported-tutorial | isTutorial不是精确false |
| invalid-winner | winner不是精确−1；不表示内部已经重新计算胜负 |
| invalid-first-team | firstTeam不是number或不在0..1 |
| invalid-current-topic | topic不是number或超signed32；0..2以外本身不属于错误 |
| invalid-characters | characters不是恰两项数组 |
| invalid-character | 某角色不是record |
| invalid-personality | 性格不在四个精确字符串中 |
| invalid-anger-timer | timer不是number或不在0..4 |
| invalid-max-card-count | 容量不是number或不在4..7 |
| invalid-hand | hand不是七项数组，或某项不是−1..14 |
| invalid-ready-hand | 七槽值域正确，但槽0不是0，或其他活动槽为−1／0 |
| invalid-played-card | 初始playedCard不是精确−1 |
| invalid-can-rethink | canRethink不是boolean；false本身有效 |
| invalid-card-tape | 当前牌堆不是恰18项数组 |
| unsupported-card-code | 牌堆某项不是1..14 |
| invalid-deck-cursor | cursor不是number或不在0..18 |
| invalid-plans | plans不是恰两项数组 |
| invalid-plan | 某队计划不是record |
| invalid-selections | selections不是数组，或长度不是1..2 |
| invalid-selection | 某选择不是record |
| invalid-card-index | cardIndex不是number或不在0..6 |
| invalid-raw-draws | 某选择rawDraws不是数组或超过1项 |
| invalid-raw-draw | draw不是record，或role／bound9／整数value0..8不符 |
| invalid-raw-results | 某选择rawResults不是数组或超过1项 |
| invalid-raw-result | result不是record，或role／percent40／boolean value不符 |
| selected-index-not-active | 实际轮到的cardIndex不小于当前容量，虽可能是有效七槽下标仍不能选择 |
| selected-card-empty | 实际活动槽为−1；防御码，正确初始满手加成功再考路线不会正常到达 |
| selected-card-unavailable | 原Availability查询成功但available=false |
| missing-final-selection | 再考动作已经成功并重置，但该队没有下一项最终选择 |
| unexpected-selection | 选到非0牌后计划仍有下一项，不忽略后续项 |
| unsupported-deck-regeneration | 再考填牌实际需要下一张时已超当前18牌边界 |
| missing-raw-draw | 原fill需要话题修补但未提供draw |
| unexpected-raw-draw | 非0选择带draw，或原fill不需要修补但带draw |
| raw-result-count-mismatch | 非0选择带布尔结果，或再考Calm所需0／1数量不匹配 |
| invalid-team | Availability继承码；通过本层投影的队号正常不会触发 |
| invalid-card | 查询依赖继承码；通过本层手牌／状态域的牌码正常不会触发 |
| invalid-played-cards | AttackerSelection继承码；本层成功计划必给合法二元组，正常不会触发 |
| invalid-playable-slots | fill继承码；原RethinkAction给合法全null适配，正常不会触发 |

精确顺序如下，不能按表格顺序虚构一个跨所有错误的全局优先级：

1. 检查Proxy检测能力，然后安全分离**完整**输入，含两队完整计划、所有随机payload及额外字段。危险值或预算超限早于任何领域解析；多个安全问题依实际遍历遇到次序，不能保证改变对象键顺序后同一优先级。
2. 顶层封闭record先查额外键，再查缺键；随后依次查schemaVersion／profile、完整policies、isTutorial、winner、firstTeam、currentTopic。
3. characters二元组形状；按队0再队1解析，不随firstTeam改变。每角色依次查封闭record、性格、timer、容量、七槽形状和全部槽值域、槽0与活动满手、playedCard、额度、牌堆形状与全部牌码、cursor。
4. plans二元组形状；按队0再队1，先查计划record与selections长度，再按每项原序查选择record、cardIndex、rawDraws数组和每项完整域、rawResults数组和每项完整域。**全部选择和随机payload解析结束之前，不调用任何依赖当校验探针。**
5. 执行顺序才换为firstTeam再对手：当前活动下标→非空→原Availability及available门→playedCard赋值→移除。
6. 非0分支先检查是否多余选择；只有没有多余项才依次检查rawDraws为空、rawResults为空。虽然私有候选已做移除，失败仍不发布任何状态。
7. 再考分支先执行整个原动作：fill实际取牌、修补需求检查，再Calm数量与奖励检查。动作成功才复制结果、重置playedCard，再检查是否有下一选择。故耗尽、缺修补或布尔数量错误都可先于missing-final-selection。
8. 两队完整结束才调用原AttackerSelection；完整成功后组装并冻结全部结果。

每个封闭领域record的未知键早于缺键；缺键统一malformed-data。政策内键值差异统一unsupported-policy，不拆成领域unknown-field。非整型／−0在安全层先为malformed-data，不落入对应字段的范围错误。

例如firstTeam=1时，plans[0]中未执行的第二项若有boolean value=1，也会在任何队1工作前报invalid-raw-result；不能以“队0稍后才执行”跳过它。合法空数组则只是可能缺项，不在预解析阶段决定需求：再考牌堆不足与缺布尔同时存在时，先unsupported-deck-regeneration；填满全话术且缺draw、也缺布尔时，先missing-raw-draw。反之非法boolean value=1会在任何填牌前报invalid-raw-result。非0第一项同时有额外第二项及合法draw时，先unexpected-selection；无额外第二项且两类payload都非空时，先unexpected-raw-draw。

## 7. 安全分离、预算与原子性

模块依赖可信Node运行时 `process.getBuiltinModule('node:util').types.isProxy`。检测能力不可用时，在检查输入前封闭拒绝，不降级到无法排除Proxy的路径；不承诺浏览器、旧Node或内建能力遭篡改的环境可用。本批没有执行运行时能力探测。

- 只接纳JSON式标量、普通record及稠密数组。record原型必须是Object.prototype或null；数组原型必须精确是Array.prototype。
- 先排除Proxy再反射，只读数据属性描述符，不运行getter、setter、toJSON、迭代器、函数或调用者随机回调。
- 拒绝自定义原型、类实例、Date、Map、Set、类型化数组、访问器、Symbol键／值、undefined、function、bigint，以及不安全数值。
- record自有字段须可枚举；数组只准连续规范下标与原生length，拒绝空洞、装饰字段及隐藏字段。length是唯一允许的非可枚举字段。
- 拒绝循环。重复但不成环的引用独立复制，每次展开重新计数。安全定义数据键，`__proto__`不具有改变原型的能力，之后仍服从封闭字段检查。

| 安全预算 | 上限与含义 |
|---|---|
| 输入值节点 | 4096；根计1，每次访问值计1，重复非循环引用每次另计 |
| 输入深度 | 16；根为0，每个属性值／数组元素深入1 |
| 单数组长度 | 32；领域层仍要求characters／plans各2、hand7、牌堆18、每计划1..2项、每随机数组0..1项 |
| 单对象自有键数 | 不超过4096；数组length也计入反射自有键 |
| 字符串／键预算 | 单项JS长度不超过65536，所有字符串值与自有键累计UTF-8字节不超过65536 |
| 完整canonical表示 | 对象键排序、数组保序、无空白，包含JSON转义与标点的UTF-8字节不超过65536 |

完整固定政策、两队全部牌堆、未执行选择及可能被判为额外的字段均计入预算，不按“本次用不上”跳过危险数据。各原组件继续使用自己的原安全预算，本组合只传最小完整投影，不抬高或绕过依赖核限制。

成功路径最多4次已接受选择／Availability、4次七槽移除、2次RethinkAction，以及合计各2次fill／Calm，最后1次AttackerSelection。每队再考最多从当前牌堆取6张，合计最多12张；最多2个修补整数draw、2个冷静布尔结果、4个外层随机事件。没有外部RNG调用或调用者状态写入。

这是纯数据的全有或全无，不是外部副作用回滚器。第一队已在私有候选中完成出牌、再考、推进游标和消耗额度，也不构成可发布结果；第二队失败时仍只有失败码，不能返回第一队半状态、局部消耗、半份收据或“可继续”的step。调用者对象从未被写入，也无须回写恢复。函数无法撤销调用者在调用前自行产生随机值的外部操作。

## 8. 人工纸面示例

下列只是人工静态推导，不是候选模块、来源、测试、场景或replay的运行结果。未展开的字段均须满足第2节完整合同；`policies` 必须使用完整导出常量，不是只提供id。每个非0选择的rawDraws与rawResults均为空。

### 8.1 先手为队1，计划仍按队号索引

共同currentTopic=0、maxCardCount=4、playedCard=−1、canRethink=true；两队当前18牌均为合法1..14值、cursor=18。队0为timid／timer0，hand=`[0,1,10,12,14,-1,2]`，plans[0]只选cardIndex3。队1为bold／timer1，hand=`[0,3,6,9,13,-1,14]`，plans[1]只选cardIndex1。firstTeam=1。

1. actorOrder为 `[1,0]`，先读取plans[1]：队1选到普通牌3，可用，移除后hand为 `[0,6,9,-1,-1,-1,-1]`，playedCard=3。原尾槽13／−1／14均不保留。
2. 再读取plans[0]：队0选到无视12。对方是正计时器刚胆而不是冷静，不产生对手冷静压制；移除后hand为 `[0,1,10,-1,-1,-1,-1]`，playedCard=12。
3. 最终playedCards按队号是 `[12,3]`，不是执行次序 `[3,12]`。基础牌力 `[120,13]`，队1刚胆覆盖后最终牌力 `[120,100]`，attacker=0。
4. 两队cursor仍18、额度仍true；selectionCount=2、rethinkCount=0、randomEventCount=0。成功到攻击前检查点，不执行无视或普通牌攻击效果。

### 8.2 再考后重新解析物理下标

firstTeam=0、currentTopic=0。队0为calm／timer1／cap4，初始hand=`[0,14,13,12,13,-1,2]`，额度true、cursor0，18牌开头为10／11／12，其余15项均为1。plans[0]先选index0并提供修补value8、冷静boolean true，再选index1且不带随机项。队1为timid／timer0／cap4，hand=`[0,4,5,6,12,-1,0]`，只选index3；其余检查点有效。

1. 队0先选再考0，playedCard置0；移除后的七槽为 `[14,13,12,-1,-1,-1,-1]`。原非活动尾槽13／−1／2已经清除。
2. 原再考动作清空活动前缀，fill取当前tape索引0、1、2得到10／11／12。填满仍无普通牌，修补value8把最后新增原槽3的12改成9；第一次排序得 `[0,9,10,11]`。
3. 正timer冷静消费true，topic0把当前物理槽1的9改成3，最终活动hand为 `[0,3,10,11]`。再考动作结果的playedCard仍0、canRethink=false、cursor3；完整七槽尾部均−1。
4. 组合层随后ResetPlayedCard为−1，再解释第二个index1：它现在选到3，**不是初始同槽的14**。完成移除后的hand为 `[0,10,11,-1,-1,-1,-1]`，playedCard=3，额度仍false。
5. 队1在全部上述步骤之后选到6，移除后hand为 `[0,4,5,-1,-1,-1,-1]`。最终playedCards=`[3,6]`，牌力13比3，attacker=0。

共有3个选择、1个再考、2个外层随机事件。顺序为队0修补整数draw，再队0冷静布尔结果；原组件局部索引均不改写。RethinkAction内部最终位置1保留tapeIndex2／originalCard12、修补12→9及冷静9→3两层历史；之后本层第二次选择又把该牌移除，不能把嵌套finalProvenance误称为整笔最终剩余hand的来源数组。

### 8.3 第二队失败不发布第一队结果

沿用上例，把队1的初始活动hand改为 `[0,4,5,12,12,-1,0]`，仍只选择index3。队0即使已在私有候选中完成再考与最终普通牌选择，队1无视12仍被对方calm／timer1压制；外层只返回 `selected-card-unavailable`。没有队0cursor3、额度false、已出牌3或两项随机事件的部分输出，原输入未改。

把队1改成另一个可用再考计划但当前牌堆只剩2张而cap4需3张，也仍整笔返回 `unsupported-deck-regeneration`，不发布第一队结果。前者是checked资格拒绝，后者是有限当前牌堆边界，不是来源自动回滚的证明。

### 8.4 独立边界推导

| 变化 | 纸面结果或边界 |
|---|---|
| 每队都再考、正timer冷静且新抽全话术，所需payload齐全且最终均选普通牌 | 最多4次选择、2次再考、4事件；完整先手修补→先手冷静→后手修补→后手冷静 |
| cap4／cursor15，选择可用再考且payload匹配 | 可恰好到cursor18 |
| cap4／cursor16，选择再考 | 实际需3张而只剩2张，整个事务拒绝 |
| cursor18但两队都只选非0 | 不补牌，仍可成功 |
| 第二次仍选择再考恢复的槽0 | 原动作已把额度false，Availability拒绝，不执行第二次再考 |
| 一项计划只选再考且再考本身可完成 | `missing-final-selection`，不返回重抽后的半状态 |
| 第一项非0但还有第二项 | `unexpected-selection`，不是自动忽略第二项 |
| 合法物理index6但本队cap4 | `selected-index-not-active`，不读取尾槽牌作为选择 |
| 初始活动槽1为0或−1 | `invalid-ready-hand`，不借用独立RethinkAction宽域接纳 |
| 非0选择提供合法修补draw | `unexpected-raw-draw`，不把draw挪到别队 |
| 非0选择提供合法布尔结果且draw为空 | `raw-result-count-mismatch` |
| 正timer冷静再考、topic99、boolean true | 仍消费布尔项，不覆盖；其他步骤成功则继续重选 |
| 正timer刚胆选择再考／10／11／12／13／14 | Availability拒绝；普通牌仍可用 |
| 对方正timer冷静 | 不直接禁止本队再考或普通牌；禁止10..14 |
| 对方正timer刚胆、己方无其他限制 | 不构成对方冷静压制 |
| 两张最终牌力相等 | attacker=−1，先手不打破平局 |

## 9. 来源、固定政策及兼容性

来源为现代C#翻译仓库 `tankyc/sango_infinity`，固定commit `a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef`，不是原生PK／Vanilla。对应依据：

- [PlayPhase，第174–250行](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/DebatePhase.cs#L174-L250)：先手完整选择／再考／重置／重选，再后手；双方非再考牌完成后转伤害阶段。
- [DamagePhaseBegin，第255–259行](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/DebatePhase.cs#L255-L259)：进入时调用CalcAttacker，不等于Attack已经执行。
- [PlayCard／ResetPlayedCard，第991–1013行](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L991-L1013)及[CharacterRemoveCard，第454–466行](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L454-L466)：先记录出牌、清全部七槽并只压紧活动前缀，后续步骤重置。
- [CharacterRethink，第491–509行](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L491-L509)及[Rethink，第1254–1260行](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L1254-L1260)：直接复用既有动作，保留其fill／Calm及末尾额度false顺序。
- [IsCardAvailable，第934–988行](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L934-L988)：本组合明确加入的checked gate所调用谓词，不声称PlayPhase原地调用。
- [CalcAttacker，第1129–1142行](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L1129-L1142)：原攻击方查询不变。

`DebateCheckedPlayPolicyV1` 与 `DebateCheckedPlayEvidenceV1` 是实现POLICY／EVIDENCE完整字面对象的递归readonly类型，不是任意record。全部精确字段和值见[固定政策／证据源文件](../sources/debate-checked-play-v1.json)和[实现常量](../../packages/engine/src/debate-checked-play.ts)。政策包含完整未修改组件政策；本页不再复制一份巨大的可配置政策，以免形成漂移的第二真源。

policy顶层精确为 `id,profile,mode,checkpoint,plans,availability,removal,rethink,attacker,randomness,safety,capacity,boundary`。id为 `debate-checked-play-bounded-paired-selection-policy-v1`，profile为 `debate-checked-play-reference-v1`；availability.policy、rethink.policy、attacker.policy分别嵌入完整原 `DEBATE_CARD_AVAILABILITY_POLICY_V1`、`DEBATE_RETHINK_ACTION_POLICY_V1`、`DEBATE_ATTACKER_SELECTION_POLICY_V1`。其中RethinkAction政策又原样包含fill／Calm政策，不能删成id引用或自定义更小预算来改变调用方式。

evidence记录上述commit／仓库／Debate路径、blob、SHA-256、DebatePhase路径及每个来源行范围，嵌入完整availability、rethinkAction、attackerSelection证据。availabilityGuard、boundedPlans、readyCheckpoint、initialReadyHandAndWinnerAndTutorialAdmission、perRemovalProvenance及boundsSafetyBudgetsAuditAndReasonNames明确工程层，其他来源身份／等价性／排除标志保持固定。请求本身不能传evidence、receipt或额外控制项来提升证明等级。

七槽／满活动ready-hand、每队1..2项计划、非教程／非终局路由、已解析性格、signed32话题、checked gate、原子失败、安全预算、错误名称、冻结及审计身份均是明确工程合同；来源并未承诺这些DTO或证明输入可达。所有依赖核的公开入口、政策、证据、域及局部收据保持不变，未接入旧九会话或迁移旧存档。初始检查点可人工投影自兼容前序结果，但不自动调用TurnStart／RoundTransition或宣称任意前序返回均可直接连接。

明确排除完整phaseengine、AI、UI、等待／重试、step持久化、Attack及特殊牌效果、HP／压力／伤害／胜负重算、TurnEnd／计时递减／下一回合补牌、教程与终局分支、牌组再生成、人物／书籍／非恒等hook、开场／追击／留情、全回合随机流／永久牌身份、完整session／存档、旧九会话自动集成和campaign。P078及全部依赖排除；43证据主题／45历史快照保持。

现代翻译源码及原生地址注释不构成独立原生证明。nativeEquivalent、stockOriginalVerified、pkEquivalent、vanillaEquivalent、completeDebate不提升为true；native whole chain继续开放。`ready-for-attack` 只表示本有界数据事务完成了攻击方查询，不是整个舌战可运行或游戏已完成。

## 10. 静态交付状态

实现、本文和配套案例仅作静态文本审阅与人工纸面推导。本批未运行测试、编译、typecheck、build、validator、checker、诊断、候选模块、来源代码、示例、场景或replay，未作运行时能力探测。不能将纸面结果描述为执行通过、原生等价或完整舌战闭环。

