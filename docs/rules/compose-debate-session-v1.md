# 普通话题牌 + 大喝 + 无视 + 镇静独立舌战 session v1

日期：2026-10-20。实现：[compose-debate.ts](../../packages/engine/src/compose-debate.ts) · [完整 API、DTO 与错误](../engine/compose-debate-session-v1.md) · [完整政策与固定来源](../sources/compose-debate-session-v1.json) · [六轮纸面场景，未运行](../../data/scenarios/compose-debate-example-v1.json)。

本页新增独立、有界的现代参考子集，不修改旧普通牌、大喝或无视 session。镇静不是“自己加防御”或“抵消此次攻击”：它先承受胜牌的 Attack，再在 Effect 阶段降低对方的当前 stress；无视胜和等 power 平局不会执行败方镇静。

## 1. 固定身份与支持边界

- profile：`debate-topic-shout-ignore-compose-reference-v1`。
- session tag：`compose-debate-session-v1`。
- 唯一命令：`ResolveComposeDebateRound`。
- 常量：`COMPOSE_DEBATE_POLICY_V1`、`COMPOSE_DEBATE_EVIDENCE_V1`。
- 公开类型：`ComposeDebate*V1`。

两名 source-normal 通用参与者，从 HP1000/stress0/angerTimer0 开始。支持九种普通话题模板、大喝、无视、镇静，以及 token 出牌/消费/补牌、整数伤害、分阶段 stress 与 Effect 记录、HP 胜负、保存和逐项重放。旧 profile、牌 DTO 和存档不隐式迁移。

仍不支持诡辩及反射、激昂、再考、四性格愤激、持有镇静的自动反制及第二张消费、连打/兴奋 timer、真实人物/书籍/MOD hook、原作 DeckGenerate/洗牌/概率、开场一击决胜、追击/留情/负伤。**主动选择镇静是本批新支持的出牌，不等于支持愤激触发后的自动镇静反制。**

本接口不接 campaign、training GameState、外交自动结算、部队/城市/势力/奖励、P078/native 人员任务、俘虏/处斩/归属或 return/mission 链。通用 ID 不映射武将；结束只返回 session outcome。

Effects 完成且没有 HP 终局后，任一 stress 达到100仍整轮拒绝。不能 cap99、清零、跳过愤激或借用未支持的自动反制绕过。有些参考源码合法牌局因此停在本 profile 边界。

## 2. 固定来源与证据层级

现代参考仓库为 `tankyc/sango_infinity`，固定 commit：

`a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef`

来源为固定 [Debate.cs](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs) 与 [DebatePhase.cs](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/DebatePhase.cs)，blob 分别为 `0137498d10773cd4596d497083ccdf6a26b3a261` 和 `6aa98f855a5d4d172cde7e8ffc18a141b8a7b587`。字节、SHA-256及源文件身份见 [manifest](../sources/compose-debate-session-v1.json)。

| 固定位置 | 本子集采用的语义 |
|---|---|
| [Debate.cs 908–926](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L908-L926) | 无视120、大喝110、普通牌1/2/3及匹配话题+10；镇静走返回0的分支 |
| [934–987](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L934-L987) | 可用性含性格/愤激门槛；本子集双方 timer 恒0 |
| [1083–1142](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L1083-L1142) | power 比较；非终局胜者更新 first，只有普通胜牌跟随改 topic |
| [1146–1236](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L1146-L1236) | 普通/大喝伤害与 stress；平局双方stress15 |
| [1267–1285](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L1267-L1285) | 无视只写对方stress；未反射镇静以对方为目标，只修改stress |
| [1423–1456](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L1423-L1456) | Attack：无视显式stress30，不调用伤害随机数；其他已接纳胜牌正常伤害 |
| [1459–1480](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L1459-L1480) | Compose取对方此时stress，需求值为 `-max(stress / 2,30)`；诡辩反射分支存在但未接纳 |
| [1567–1580](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L1567-L1580) | 平局提前返回；胜者Effect先执行；无视胜后提前返回，不执行败方Effect |
| [DebatePhase.cs 394–420](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/DebatePhase.cs#L394-L420) | Attack → Effect → HP winner → Anger |

初始 attack、HP/stress clamp、手牌/保留再考槽和崩坏显示沿用相同来源的既有子集，完整定位见 manifest。原源码另有 `CalcAngering`/`AngerTrigger` 自动反制，不能与本页主动镇静 Effect 混用。

这里只扩大现代转录参考的规则覆盖，不发现新公式、不认证原 PC-PK/PK1.1、Vanilla或主机二进制。`nativeEquivalent:false`、`stockOriginalVerified:false`、`completeDebate:false`。既有 E15 标签只属于普通通用核心；原43组未决证据主题不因本子集减少或清零。源码转录、工程政策、原生等价是不同证据层。

## 3. 输入、牌带与手牌

scenario 严格只有 `schemaVersion:1,profile,genericOnly:true,difficulty:'source-normal',policies,challengerId,initialTopic,participants`。policies 必须是完整 `COMPOSE_DEBATE_POLICY_V1`，不是只传 id 或部分默认值。initialTopic 显式为 story/logic/trend；participants 恰好两项并固定顺序。

participant 严格只有 `id,resolvedIntelligence,hp:1000,stress:0,angerTimer:0,cardTape`：

- ID唯一，ASCII `[A-Za-z][A-Za-z0-9_-]{0,63}`；challengerId 是其中一人，决定初始 first。
- INT为1..100安全整数，已经解析，不调用人物或物品 hook。
- 每方牌带最多512项且必须够初始手牌，按提供顺序发牌。
- 不接受中局 stress/HP 导入；中局只能从本 profile 的 genesis 和历史重算。

牌模板为封闭四选一：

```ts
{ kind: 'topic', topic: 'story' | 'logic' | 'trend', level: 'small' | 'medium' | 'large' }
{ kind: 'shout' }
{ kind: 'ignore' }
{ kind: 'compose' }
```

后三种没有 topic/level。缺 kind、未知 kind、未支持话术、多余字段均拒绝，旧 `{topic,level}` 不自动转换。

| INT | sourceSlotCount | playableHandCapacity |
|---|---:|---:|
| 1..69 | 4 | 3 |
| 70..79 | 5 | 4 |
| 80..89 | 6 | 5 |
| 90..100 | 7 | 6 |

四类牌共用容量，`reservedRethinkSlot:true` 不产生可用动作。hand occurrence 是模板加 `token,tapeIndex`，token=`id:tapeIndex`，从0起。初始发满；消费所选token，稳定保留其他牌，再按牌带补空位，deckCursor 指向下一未发项。相同模板仍是不同 occurrence。不恢复原作洗牌、循环牌组或显示排序。

## 4. power、Attack、Effect 与随机输入

| 比较结果 | power | Attack的HP/stress | Effect | rawDraws |
|---|---:|---|---|---|
| 普通胜 | 非匹配1/2/3；匹配11/12/13 | 败方按公式受HP伤害及stress10/15/20 | 若败牌为镇静，随后镇静胜者 | 恰好1项 |
| 大喝胜 | 110 | 败方按公式受HP伤害及stress15 | 若败牌为镇静，随后镇静胜者 | 恰好1项 |
| 无视胜 | 120 | 败方仅stress30，HP不变 | 阻断败方附加效果，包括镇静 | 严格空 |
| 等power平局 | 相等 | 双方stress15，HP不变 | Effect整体提前返回，包括双镇静 | 严格空 |
| 镇静 | 0 | 本封闭牌集内不可能胜出 | 只有败给普通/大喝时执行 | 由胜牌分支决定 |

镇静输给任意普通、大喝、无视，双镇静平局。Compose自身无jitter并不表示“有Compose的一轮必为零draw”。普通/大喝胜Compose仍须一项伤害jitter；Ignore胜Compose、双Compose则必须空。

固定 attack：

`attack = 100 + trunc(40 * (myINT - opponentINT) / (131 - myINT))`

仅普通/大喝胜计算：

`requestedHpDamage = trunc((attack+jitter) * 10 * levelCoef * topicCoef / 1000)`

普通 levelCoef=10/15/20，topicCoef按轮开始话题匹配10、否则6；大喝为15/12。正常态 angerCoef10，jitter为0..4。除法向零，内部用精确 bigint，外部只允许安全整数；负 attack 中间差不能 floor。power差不参与伤害。

HP writer 为 `clamp(beforeHp-requestedHpDamage,-100,1000)`，stress writer 为 `clamp(beforeStress+requestedStress,0,100)`。无视不调用 HP 公式、不取随机数、不构造零系数damage；`damage:null` 不等于平局。

### 4.1 镇静的目标、时点与 clamp

在普通/大喝胜后，先完整写入败方的HP与stress，再执行胜者Effect（无附加效果），最后执行败方Compose：

`requestedComposeStress = -max(trunc(targetCurrentStress / 2),30)`

`afterComposeStress = clamp(targetCurrentStress+requestedComposeStress,0,100)`

target 是镇静出牌者的对方，即本轮胜者，不是出牌者。读的是 Effect 执行当下目标stress，不是败方受击后的stress，也不是一律减半。目标stress0/15/45/60/75/90分别请求−30/−30/−30/−30/−37/−45，实际得到0/0/15/30/38/45。

镇静不撤销败方已受HP伤害或stress，不改HP、不改power、不直接换topic/first，不新增随机draw。无视胜时不会先计算一个负数再丢弃；其败方Effect根本不执行。双镇静也不是各减30或各减半，而是平局各加15、无Effect。

### 4.2 分阶段回执不是净值猜测

每个 participant change 包含 `attackStress` 与 `effectStress`，各记录 `beforeStress,requestedStress,afterStress,actualStressDelta`。顶层requestedStress为两个阶段需求之和，actualStressDelta为整轮after−before；必须保留阶段clamp，不能把两个需求相加后只clamp一次。

receipt 另含 `effects,effectOrder,effectSkipReason`：

- 非平局按胜者、败者顺序给两条记录，`effectOrder:'winner-then-loser-audit-slots'`，与first/scenario顺序无关。记录包含actor、target、kind、阶段stress、状态和invoked。
- 普通/大喝胜者为 `no-additional-effect`、invoked=true、requestedStress=0，表示已进入Effect但没有writer，不表示写入一次0；败方Compose为 `applied`、invoked=true。目标stress0仍是applied，请求−30、实际0，不能改成no-op。
- 无视胜者记录无附加效果；败方记录 `suppressed-by-ignore`、invoked=false、requestedStress=null、actualStressDelta=0。这是被跳过的审计槽，null明确表示没有计算请求，不表示调用过败方Effect。participant的effectStress汇总只含已评估请求，受抑制时其汇总请求为0。
- 平局 `effects:[]`、`effectOrder:'none-equal-card-power'`、`effectSkipReason:'equal-card-power'`。无视胜为 `effectSkipReason:'ignore-suppresses-loser-effect'`，其余胜负为null。

严格字段及类型见API。与旧Ignore回执相比，这是新增合同，不把旧的整轮净stress字段冒充逐阶段证据。

## 5. 原子命令与整轮顺序

命令只有 `type:'ResolveComposeDebateRound',expectedRevision,expectedRoundIndex,expectedFirstId,choices,rawDraws`。expected计数为0..4096安全整数并匹配snapshot，first亦须匹配。choices恰好两项 `{participantId,cardToken}`，按scenario顺序选择自己的当前hand token，不能按first重排。

- 普通/大喝胜：`[{role:'psychological-damage-jitter',bound:5,value:0..4}]`。
- 无视胜、任何等power平局：`[]`。
- 数量、role、bound和值域严格匹配，不接受多余draw后忽略；没有外部RNG、callback或seed。

执行顺序：

1. 安全分离外部输入，从genesis完整重算session；检查结构、active、expected值和当前hand。
2. 以旧topic算power，确定胜方/平局，按Attack分支核对draw。
3. 在私有副本消费双方各一张牌，执行Attack：普通/大喝伤害，无视stress30，或平局双方stress15。
4. **执行Effect后再判HP。** 非平局按胜者→败者，Ignore跳过败方；平局直接跳过全部Effect。生成阶段与Effect审计记录。
5. HP<=0时提交finished；revision/roundIndex各+1，保留轮开始first/topic，不更新崩坏、不补牌。已发生的镇静必须保留；stress100和牌带不足不阻止HP终局。
6. 无HP终局且任一stress>=100，`unsupported-anger-trigger`整轮拒绝，连同已拟议的Attack、镇静、消费、cursor、计数和日志一起回滚。不能用手中未出牌Compose触发自动反制。
7. 非终局更新崩坏层 `clamp(trunc((1000-hp)/250),0,3)`。普通胜改first/topic；大喝/无视胜只改first；平局保持。Compose不胜出，不存在独立Compose-winner话题规则。
8. 按牌带补空位；任一不足为 `deck-exhausted` 整轮拒绝。检查完整拟议session预算后提交深冻结新session/receipt，不改输入。

preview走同一append及预算路径，但不提交日志、不消耗外部RNG。first只用于receipt的 `orderedIds:[first,other]`，无伤害优势；plays/changes/choices保持scenario顺序，而effects使用胜者/败者顺序。把选牌、结算和补牌折成一个原子命令是工程政策，不声明复刻AI、UI、私密选牌或半回合。

## 6. 保存、严格输入与资源边界

session envelope 为 `tag,policy,evidence,genesis,snapshot,entries`；genesis包含完整scenario与重建初局，entry包含command和receipt。inspect/execute/preview/save/load均重建genesis、逐条重算并对照receipt全字段，再对照最终snapshot。attack、hand、cursor、power、winner、damage、两阶段stress、Effect顺序/状态/目标和noDrawReason均不可信任外部值。

save输出对象键排序、数组保序的canonical JSON；load接受等价键序JSON。不支持旧profile/tag/command或隐式迁移。存档未签名、未加密，只证明内部一致性，不认证外部真实牌局或制作者。

共同上限：4096条entries、每方512牌、完整canonical session UTF-8 16MiB、1,000,000值节点、深度32。policy/evidence与每条receipt都计入，preview同预算。remainingEntryCapacity仅为条数剩余，不保证牌带/字节/节点还够。预算耗尽是拒绝，不是平局。

失败统一 `{ok:false,reason,index}`，没有partial session。replay场景/外层列表错误index=−1，首失败命令为0-based index；session历史错误定位entry，新命令错误通常null。完整原因及优先级边界见API。

拒绝Proxy、accessor、函数、undefined、外部BigInt、Symbol、custom prototype、循环、稀疏array、额外array属性、非法整数及−0。Node安全Proxy探测入口缺失为 `unsupported-runtime`，不降级。本批未运行，不能声称Node或浏览器兼容性已验证。

## 7. 手工推导，全部未运行

本节与 [独立场景](../../data/scenarios/compose-debate-example-v1.json) 均为纸面设计，不是执行receipt、存档或测试结果。文件外层说明/paperExpected不是API输入；使用时只取scenario和commands。下列中局前提均须由合法genesis历史达到，不能直接导入stress。

### 7.1 六轮独立场景

INT60/60、容量3、各9张牌，初始story/first=beta。只有第4轮使用一项jitter0，其他轮rawDraws均空。

| 轮 | alpha / beta | 轮后HP（alpha,beta） | 轮后stress | first / topic | 双方cursor |
|---|---|---|---|---|---:|
| 1 | Ignore / Shout | 1000,1000 | 0,30 | alpha / story | 4 |
| 2 | Ignore / Shout | 1000,1000 | 0,60 | alpha / story | 5 |
| 3 | Shout / Shout | 1000,1000 | 15,75 | alpha / story | 6 |
| 4 | Compose / story-small | 900,1000 | 25,38 | beta / story | 7 |
| 5 | Compose / Ignore | 900,1000 | 55,38 | beta / story | 8 |
| 6 | Compose / Compose | 900,1000 | 70,53 | beta / story | 9 |

第4轮beta power11胜alpha0，Attack使alpha HP−100/stress+10；随后alpha的Compose对beta当前75请求−37，实际−37，得到38。beta为scenario第二人，但effect记录先beta后alpha。第5轮无视使alpha+30，败方Compose被阻断，beta保持38而不是8。第6轮双方各+15，没有镇静Effect，first保持beta。

### 7.2 下限clamp和错误目标

初局A出story-small、B出Compose，jitter0。A胜，B HP900/stress10；B的Compose目标A stress0，请求−30、实际0，状态仍为applied。不能给B清掉stress10，也不能免除B的HP100伤害。

另从三次合法平局到双方stress45后，A story-small胜B Compose：B HP900/stress55，A镇静后15。请求−30、实际−30，不能一律减半成23。从五次平局到双方75，随后同样出牌：B stress85，A请求−37后38；不能向上取半、四舍五入或误取B受击后的85。

### 7.3 大喝、无视与零draw条件

同INT初局A Shout胜B Compose，jitter0：B HP820/stress15，A stress0；B镇静请求−30、实际0。与普通胜Compose一样，缺draw为draw-shape；多一项也拒绝。

从三次平局到双方stress45后，A Ignore胜B Compose：B stress75，A保持45、HP均1000。damage=null、drawCount0、noDrawReason=`ignore-no-hp-damage`，败方Effect记录suppressed-by-ignore、invoked=false、请求null；不存在对A的−30。即使额外给的是合法jitter0，也必须整轮draw-shape拒绝。

### 7.4 双镇静不是双减怒

初局双Compose power0/0，rawDraws=[]：result=draw、roundWinnerId=null、damage=null、双方stress15，effects为空；first/topic保持，各消费并补一张。noDrawReason与effectSkipReason均为equal-card-power。

六次双Compose平局可达双方90，第七次拟议clamp100后无Effect且无HP终局，整轮unsupported-anger-trigger。不能靠双镇静在stress90自救。双Ignore、双Shout及普通等power平局仍是同一平局路径。

### 7.5 镇静后的愤激边界仍原子回滚

从六次合法平局到双方HP1000/stress90。下一轮A story-small胜B Compose，jitter0：拟议Attack令B HP900/stress100；Effect令A90→45；随后无HP终局，B仍100，所以整轮unsupported-anger-trigger。成功历史仍停在双方1000/90，两张牌和cursor未消费/推进，不返回部分镇静receipt。

这说明检查在Effect后，不说明Compose能消除本轮败方的愤激。其目标是胜者，败方的受击stress仍在。手牌中另外留有镇静也不启用自动反制。

### 7.6 HP终局必须保留此前镇静

同INT、初始story，先一次普通等power平局，双方stress15。然后A连续四次story-large胜B非匹配small，每次jitter0：B依次HP800/600/400/200、stress35/55/75/95，A保持HP1000/stress15。

下一轮A story-large、B Compose，jitter0：先让B HP0、stress从95请求+20并clamp100（实际+5）；再让A受Compose请求−30，stress15→0（实际−15）；最后接受HP终局。B的镇静不会因自身HP0而跳过。receipt terminal=true、Effect applied，first/topic保留轮开始值，crumbleEvaluated/refillApplied=false；两张牌已消费，无补牌、cursor不推进。终局stress100及后续牌带耗尽不拒绝。

### 7.7 补牌与存档篡改边界

牌带仅够初始容量时，第一次普通胜Compose虽可完成伤害/Effect推导，仍因非终局补牌不足整轮deck-exhausted，不能留下未满hand、HP或镇静净值；HP终局不要求补牌。

把六轮历史第4轮Compose目标改成alpha、把−37改成−30、交换effects顺序、把第5轮suppressed改成applied、或给双Compose添加Effect，均不等于重算receipt，应拒绝receipt-mismatch。只把保存文本对象键重排、不改数组顺序与值，则不改变合同。以上都是预期合同说明，未调用API验证。

## 8. 保留事项与未执行声明

本批仅静态读源、修改代码及补规则文档，没有运行测试、typecheck、编译、build、checker、validator、诊断、产品或示例。旧session及旧测试不修改；既往通过结果不覆盖本批新代码。

诡辩反射、激昂、性格/愤激/自动反制、再考/真实发牌、人物/书籍、开场/追击/留情及campaign结果仍需独立合同和证据。主动镇静的power0、目标stress下降、无视阻断与平局早退覆盖不等于完整舌战、原生等价或P078完成。
