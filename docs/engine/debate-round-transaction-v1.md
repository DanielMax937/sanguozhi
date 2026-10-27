# 有界舌战单回合组合事务 API v1

[规则与来源](../rules/debate-round-transaction-v1.md) · [实现](../../packages/engine/src/debate-round-transaction.ts) · [来源映射](../sources/debate-round-transaction-v1.json) · [未运行纸面案例](../../data/scenarios/debate-round-transaction-paper-v1.json)

`evaluateDebateRoundTransaction(input: unknown): DebateRoundTransactionResultV1`；导出完整 `DEBATE_ROUND_TRANSACTION_POLICY_V1`、`DEBATE_ROUND_TRANSACTION_EVIDENCE_V1`。仅从调用者显式提供的两队ready-hand检查点推进一轮，到下轮ready-for-play或当前closing-pending。没有create/execute/save/load/session循环接口，不把中间成功提交给外部。

## 1. 完整输入

以下省略递归readonly；所有字段必需，顶层恰17字段，人物恰13字段。

```ts
{
  schemaVersion: 1,
  profile: 'debate-round-transaction-reference-v1',
  policies: DEBATE_ROUND_TRANSACTION_POLICY_V1,
  genericOnly: true,
  isTutorial: false,
  winner: -1,
  firstTeam: 0 | 1,
  currentTopic: number, // 仅整数0..2
  characters: [CharacterCheckpoint, CharacterCheckpoint],
  combo: { active: false, attacker: -1 | 0 | 1, counter: number },
  crumbledLevels: [number, number], // 各整数0..3
  plans: [Plan, Plan],
  attackRawDraws: HpDraw[],
  angerPassDraws: [AngerDraw[], AngerDraw[]], // pass1、pass2，不是team
  topicRawDraws: TopicDraw[],
  fillRawDraws: [FillDraw[], FillDraw[]], // team0、team1
  terminal: {
    criticalDisabled: boolean, initialCritical: -1,
    initialWinType: 0, choice: 0 | 1 | null
  }
}
```

完整政策包含四个现有事务的完整政策：play、attack、angerTransition、terminal，逐值精确相等，不只比较id，不允许替换任何嵌套政策。缺失或多余字段均拒绝。传数据对象，不传JSON字符串。所有数值均安全整数，负零、小数、NaN、Infinity和不安全整数拒绝。

### CharacterCheckpoint

|字段|范围／含义|
|---|---|
|personality|timid/calm/bold/reckless，调用者已解析|
|strength|1..100，用于愤怒／崩坏组件|
|hp|初始1..1000，两队都正数；中间和最终允许−100..1000|
|stress|0..100，包括初始100|
|angerTimer|0..4|
|maxCardCount|4..7活动槽容量|
|hand|恰七项，每项−1..14；槽0=0，活动槽1..容量−1须1..14；非活动尾槽−1..14。无需排序|
|playedCard|初始−1|
|canRethink|boolean|
|crumbled|boolean，初始锁存标志不擅自清零|
|cardTape|完整当前18项牌堆，每项1..14；不只传剩余后缀|
|deckCursor|0..18|
|resolvedAttack|70..227，同一队普通HP与愤怒连打所用已解析攻击属性，不现场解析人物／书籍／hook|

combo初始必须inactive，attacker允许−1/0/1，counter0..7，其余inactive残留原样交给原愤怒核。`crumbledLevels`按队号0、1。胜负和开关、人物属性与牌带是供应事实，不认证完整前史或原生可达性。输出的resolvedAttack是本轮输入携带值，不保证下一轮仍是正确有效属性；再次调用前由外层重新提供完整符合合同的输入，不能把返回state当成可直接重放的输入。

### Plan与各抽样

Plan恰 `{selections: Selection[]}`，每队1..2项。Selection恰 `{cardIndex,rawDraws,rawResults}`；cardIndex0..6，执行时由PR125检查当时活动范围/非空/可用性。第一项非再考不得带第二项；选择再考后必须重选一张最终非0牌。物理索引针对当前手牌，非旧牌身份。

|输入数组|形状与长度|实际需求由谁决定|
|---|---|---|
|每选择rawDraws|0..1项 `{role:'debate-fill-topic-repair',bound:9,value:0..8}`|PR125内原再考／补牌|
|每选择rawResults|0..1项 `{role:'debate-calm-rethink-rand-bool',percent:40,value:boolean}`|PR125内原冷静再考|
|attackRawDraws|0..1项 `{role:'debate-hp-damage-jitter',bound:5,value:0..4}`|PR127普通攻击分支，零伤害HP调用仍消耗|
|每个angerPassDraws|0..4项 `{role:'debate-timid-combo-jitter',bound:5,value:0..4}`|PR126内完整两次愤怒连打|
|topicRawDraws|0..1项 `{role:'debate-turn-end-topic-reroll',bound:3,value:0..2}`|PR126内原TurnEnd|
|每个fillRawDraws|0..1项 `{role:'debate-fill-topic-repair',bound:9,value:0..8}`|PR126内原TurnStart，按队号|

所有选择和后续draw的形状、枚举和值域在调用任何领域核前完整检查，包括后来不会执行的路径。语法正确不等于使用数量正确：各核仍检查实际需求，任何多给/少给整笔拒绝。Attack已终局时两pass、topic、两队fill必须全部空；愤怒内终局的未用pass或衔接draw继续由原核拒绝。不会把未用draw静默丢掉、借给另一阶段或以外部RNG补足。

terminal配置在所有输入都须提供；非终局choice必须null，终局再交PR128：对手HP−100且未禁用时必须显式0追击或1留情，其他终局必须null。初始critical−1与Normal0固定显式要求，不执行AI默认选择。choice0映射winType1、choice1映射winType2。

## 2. 顺序与权威字段

1. PR125受检出牌一次：先手整队计划完成再后手，保留完整选择、移牌、再考与攻击方收据。选牌gate属于checked工程政策，不冒称来源PlayPhase直接调用IsCardAvailable。
2. 以PR125实际输出的手牌、已出牌、额度、牌堆游标覆盖外层，保留HP/stress/strength/crumbled/level/combo/resolvedAttack。容量来自已验证初始值（PR125不会修改容量），明确收窄number到4..7，不另创造容量。
3. PR127一次：用实际普通attacker和最终playedCard，当前HP/stress与属性；Attack之后全部Effect再CalcWinner。其HP/stress输出是进入愤怒的唯一权威，不能把最初HP/stress覆盖回去。外层手牌等不从PR127伪造。
4. Attack终局：不调用愤怒、TurnEnd或TurnStart；拒绝所有后续抽样，保留移牌后的手牌和游标、计时／额度／崩坏，调用PR128分类。
5. Attack非终局：调用PR126一次。anger输入投影实际HP/stress、出牌后手牌和原strength/timer/capacity，combo和崩坏原样；transition携带**普通attacker、普通playedCard、原currentTopic及出牌后的额度／牌堆／游标**，不可换成combo.attacker或连打末牌。
6. PR126返回后采用其完整state（包含实际更新手牌/timer/HP/stress/firstTeam/topic/combo/crumbled/levels），只补回调用者resolvedAttack。不得用旧字段覆盖它。其终局则分类，不补牌或递减timer；其非终局则ready-for-play且terminal.choice必须null。
7. PR128仅更新critical/winType，保留全部已结算状态；不执行Closing、奖励、受伤或世界写入。到此才构造成功对象。

## 3. 输出与失败原子性

成功字段：`ok:true,schemaVersion,profile,policy,evidence,state,nextCheckpoint,receipt`。nextCheckpoint为ready-for-play或closing-pending。

state含genericOnly、isTutorial、firstTeam、attacker、currentTopic、winner、characters、combo、crumbledLevels、critical、winType。人物含输入13字段，但playedCard可−1..14、HP可非正。首次before.attacker=−1仅表示尚未解析普通攻击方；afterPlay开始才是实际值，不当作源前序attacker记忆。

receipt含before、afterPlay、afterAttack、after；完整play/attack成功结果；完整angerTransition成功结果或null（null表示未调用）；完整terminal成功结果或null；terminalAfter为attack/anger/null；events/eventCount及externalRngConsumed=0。所有嵌套组件收据完整原样保留，不用摘要替代。

事件表按实际发生顺序索引：PR125的randomEvents → 本轮普通HP draw（若调用）→ PR126的consumedDraws（连打→话题→队0补牌→队1补牌）。每项外层index连续；localIndex保留原组件索引，嵌套event不改写；play事件可为整数或布尔结果，不把两者混称全局数值RNG。最多4+1+11=16项是保守组件和，不证明所有上限能在更窄准入域同时达到。

失败仅 `ok:false,reason` 或带完整dependencyFailure，不包含任何先前成功state/receipt或已消费外层事件。dependency标签为play-failure、attack-failure、anger-transition-failure、terminal-failure；原原因保持在dependencyFailure，不改写历史核错误。其余validation原因：unsupported-runtime、input-limit、malformed-data、unknown-field、unsupported-profile、unsupported-policy、invalid-checkpoint、invalid-character、invalid-plans、invalid-draws、invalid-combo、invalid-terminal、unused-after-attack-draws、unused-terminal-choice。不是穷举错误列表；同时多项错误按检查顺序返回最早问题。

## 4. 安全与资源边界

安全JSON分离后才执行领域调用：拒绝代理/getter/setter/隐藏字段/symbol/函数/undefined/循环/非普通原型/稀疏装饰数组；null原型记录可接受。代理检测依赖可信Node内建isProxy，缺失则unsupported-runtime、在输入反射前失败；不承诺防御被篡改的JS全局。输出递归冻结，调用者不变不被冻结。重复非循环引用分别复制和预算。

上限32768节点、深度48、单数组64、canonical UTF-8 262144字节。每值含重复引用分别计数，键及字符串提前计字节，最后计完整canonical字节；政策对象键顺序无关。固定四套政策和最多4选择/2手牌/2个18牌带/有限draw容器在该静态保守域内；不接受任意长历史。依赖保留自己的更小预算；外层不会把完整大政策/证据传给较小核，只投影其准确合同及原导出政策。输出含完整固定证据和收据，不能整体作为下一输入；不提供保存/加载/重放服务。

仅静态文本阅读、人工纸面推导及字节身份核对；未运行测试、编译、typecheck、build、validator、checker、候选、来源、场景或replay。代码存在及静态审阅不证明运行正确。现代C#参考及显式工程组合不是原生PK／Vanilla等价，43证据主题／45历史快照不减。P078及全部依赖、Closing奖励受伤世界写入均排除。
