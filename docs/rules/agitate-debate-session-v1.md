# 普通话题牌 + 大喝 + 无视 + 镇静 + 激昂独立舌战 session v1

日期：2026-10-20。实现：[agitate-debate.ts](../../packages/engine/src/agitate-debate.ts) · [完整 API、DTO 与错误](../engine/agitate-debate-session-v1.md) · [完整政策与固定来源](../sources/agitate-debate-session-v1.json) · [纸面场景，未运行](../../data/scenarios/agitate-debate-example-v1.json)。

本页新增独立、有界的现代参考子集，不修改已有普通牌、大喝、无视或镇静四种 session。激昂不是“令对方加怒”，也不直接开始愤激：在本子集无诡辩反射的前提下，它败给普通牌或大喝后，先承受 Attack，再在 Effect 阶段令自己 stress 请求增加40。无视胜抑制败方 Effect；等 power 平局跳过全部 Effect，包括激昂对镇静。

## 1. 固定身份与支持边界

- profile：`debate-topic-shout-ignore-compose-agitate-reference-v1`。
- session tag：`agitate-debate-session-v1`。
- 唯一命令：`ResolveAgitateDebateRound`。
- 常量：`AGITATE_DEBATE_POLICY_V1`、`AGITATE_DEBATE_EVIDENCE_V1`。
- 公开类型：`AgitateDebate*V1`。

两名 source-normal 通用参与者，从 HP1000/stress0/angerTimer0 开始。支持九种普通话题模板、大喝、无视、镇静、激昂，以及 token 出牌/消费/补牌、整数伤害、分阶段 stress 与 Effect 审计、HP 胜负、保存和逐项重放。新牌只进入新 profile；旧 profile、牌 DTO 和存档不隐式迁移。

仍不支持诡辩及反射、再考、四性格愤激、自动镇静或激昂反制及额外卡牌消费、连打/兴奋 timer、真实人物/书籍/MOD hook、原作 DeckGenerate/洗牌/概率、开场一击决胜、追击/留情/负伤。**主动打出激昂的 +40 与愤激状态机、持牌自动反制是不同功能；本批仅接纳前者。**

本接口不接 campaign、training GameState、外交自动结算、部队/城市/势力/奖励、P078/native 人员任务及其依赖、俘虏/处斩/归属或 return/mission 链。通用 ID 不映射武将；结束只返回 session outcome。

Effects 完成且没有 HP 终局后，任一 stress 达到100仍整轮拒绝。不能 cap99、清零、跳过愤激、自动消费另一张牌或借用未支持的反制绕过。激昂在正常态可使用，不表示本 profile 接纳其随后触发的愤激；部分参考源码合法牌局因此停在本边界。

## 2. 固定来源与证据层级

现代参考仓库为 `tankyc/sango_infinity`，固定 commit：

`a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef`

来源为固定 [Debate.cs](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs) 与 [DebatePhase.cs](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/DebatePhase.cs)，blob 分别为 `0137498d10773cd4596d497083ccdf6a26b3a261` 和 `6aa98f855a5d4d172cde7e8ffc18a141b8a7b587`。继承的字节、SHA-256 与身份记录见 [manifest](../sources/agitate-debate-session-v1.json)；本批静态重读；来源身份沿用既有记录并经只读文件哈希核对，源码未执行，文件身份核对不等于项目验证。

| 固定位置 | 本子集采用的语义 |
|---|---|
| [Debate.cs 908–926](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L908-L926) | 无视120、大喝110、普通牌1/2/3及匹配话题+10；镇静与激昂走返回0的分支 |
| [934–988](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L934-L988) | 镇静/激昂可用性受性格与双方愤激门槛约束；本子集双方 timer 恒0 |
| [1083–1142](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L1083-L1142) | power 比较；非终局胜者更新 first，只有普通胜牌跟随改 topic |
| [1146–1236](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L1146-L1236) | 普通/大喝伤害与 stress；平局双方 stress15 |
| [1267–1297](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L1267-L1297) | 无视写对方 stress；未反射镇静写对方，未反射激昂写自己 |
| [1423–1456](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L1423-L1456) | Attack：无视显式 stress30，无伤害随机数；其他已接纳胜牌正常伤害 |
| [1459–1480](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L1459-L1480) | 镇静请求 `-max(stress / 2,30)`；激昂请求40；诡辩反射分支存在但未接纳 |
| [1567–1580](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L1567-L1580) | 平局提前返回；胜者 Effect 先执行；无视胜后返回，不执行败方 Effect |
| [DebatePhase.cs 394–420](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/DebatePhase.cs#L394-L420) | Attack → Effect → HP winner → Anger |

初始 attack、HP/stress clamp、手牌/保留再考槽和崩坏显示沿用相同来源的既有子集，完整定位见 manifest。源码另有 `CalcAngering`/`AngerTrigger`，不能与本页主动激昂 Effect 混用。

这里只扩大现代转录参考的规则覆盖，不发现新公式、不认证原 PC-PK/PK1.1、Vanilla或主机二进制。`nativeEquivalent:false`、`stockOriginalVerified:false`、`pkEquivalent:false`、`vanillaEquivalent:false`、`completeDebate:false`。既有 E15 标签只属于普通通用核心，不外推到激昂。原43证据主题／45历史快照不因本子集减少或清零。

须分开理解三类内容：固定现代源码提供卡牌与阶段语义；提供式牌带、通用身份、初始话题、原子双人命令、严格保存与资源上限是显式工程政策；原生版本等价仍未证明。历史公共交叉链接只提供机制背景，不证明本次新增常数、全链或版本身份。

## 3. 输入、牌带与手牌

scenario 严格只有 `schemaVersion:1,profile,genericOnly:true,difficulty:'source-normal',policies,challengerId,initialTopic,participants`。policies 必须是完整 `AGITATE_DEBATE_POLICY_V1`，不是只传 id 或部分默认值。initialTopic 显式为 story/logic/trend；participants 恰好两项并固定顺序。

participant 严格只有 `id,resolvedIntelligence,hp:1000,stress:0,angerTimer:0,cardTape`：

- ID唯一，ASCII `[A-Za-z][A-Za-z0-9_-]{0,63}`；challengerId 是其中一人，决定初始 first。
- INT为1..100安全整数，已经解析，不调用人物或物品 hook。
- 每方牌带最多512项且必须够初始手牌，按提供顺序发牌。
- 不接受中局 stress/HP 导入；中局只能从本 profile 的 genesis 和历史重算。

牌模板为封闭五选一：

```ts
{ kind: 'topic', topic: 'story' | 'logic' | 'trend', level: 'small' | 'medium' | 'large' }
{ kind: 'shout' }
{ kind: 'ignore' }
{ kind: 'compose' }
{ kind: 'agitate' }
```

后四种没有 topic/level。缺 kind、未知 kind、未支持话术、多余字段均拒绝，旧 `{topic,level}` 不自动转换。

| INT | sourceSlotCount | playableHandCapacity |
|---|---:|---:|
| 1..69 | 4 | 3 |
| 70..79 | 5 | 4 |
| 80..89 | 6 | 5 |
| 90..100 | 7 | 6 |

五类牌共用容量，`reservedRethinkSlot:true` 不产生可用动作。hand occurrence 是模板加 `token,tapeIndex`，token=`id:tapeIndex`，从0起。初始发满；消费所选 token，稳定保留其他牌，再按牌带补空位，deckCursor 指向下一未发项。相同模板仍是不同 occurrence。不恢复原作洗牌、循环牌组或显示排序，也不因为手牌另有激昂/镇静而额外消费它。

## 4. power、Attack、Effect 与随机输入

| 比较结果 | power | Attack 的 HP/stress | Effect | rawDraws |
|---|---:|---|---|---|
| 普通胜 | 非匹配1/2/3；匹配11/12/13 | 败方按公式受 HP 伤害及 stress10/15/20 | 败方镇静作用于胜者；败方激昂作用于自己 | 恰好1项 |
| 大喝胜 | 110 | 败方按公式受 HP 伤害及 stress15 | 败方镇静作用于胜者；败方激昂作用于自己 | 恰好1项 |
| 无视胜 | 120 | 败方仅 stress30，HP不变 | 阻断败方附加效果，包括镇静与激昂 | 严格空 |
| 等 power 平局 | 相等 | 双方 stress15，HP不变 | Effect 整体提前返回 | 严格空 |
| 镇静或激昂 | 0 | 本封闭牌集内不可能胜出 | 只有败给普通/大喝时执行各自 Effect | 由胜牌分支决定 |

镇静/激昂输给任意普通、大喝、无视；双镇静、双激昂和镇静对激昂均为 power0/0 平局。不能按牌种不同额外分胜负。激昂本身无 jitter，不等于“含激昂的一轮不取 draw”：普通/大喝胜激昂仍须一项伤害 jitter，其他已列分支严格为空。

固定 attack：

`attack = 100 + trunc(40 * (myINT - opponentINT) / (131 - myINT))`

仅普通/大喝胜计算：

`requestedHpDamage = trunc((attack+jitter) * 10 * levelCoef * topicCoef / 1000)`

普通 levelCoef=10/15/20，topicCoef 按轮开始话题匹配10、否则6；大喝为15/12。正常态 angerCoef10，jitter为0..4。除法向零，内部用精确 bigint，外部只允许安全整数；负 attack 中间差不能 floor。power差不参与伤害。

HP writer 为 `clamp(beforeHp-requestedHpDamage,-100,1000)`，stress writer 为 `clamp(beforeStress+requestedStress,0,100)`。无视不调用 HP 公式、不取随机数、不构造零系数 damage；`damage:null` 不等于平局。

### 4.1 激昂只写自己，先受击后加40

在普通/大喝胜后，先完整写入败方 HP 与 stress，再执行胜者 Effect（无附加效果），最后执行败方激昂：

`targetId = actorId`

`requestedAgitateStress = 40`

`afterAgitateStress = clamp(actorCurrentStress+40,0,100)`

读取的是 Attack 已完成后的自身当前 stress，不是轮开始 stress。不会给对方加40、抵消 HP 伤害、改变 power、直接换 topic/first、生成随机数，或直接设置 angerTimer。请求40恒定，实际变化可以因 clamp 小于40，甚至为0；仍属于已调用且 `applied` 的效果。

例如初局同 INT、story-small 胜 Agitate，jitter0：败方 HP900；Attack stress0→10，Effect stress10→50，需求10+40=50，实际+50。不能只留下40，也不能把40写给胜者。大喝胜激昂同条件为败方 HP820，stress0→15→55。

无视胜时不先计算40再丢弃，而是败方 Effect 根本不执行。等 power 平局亦不调用激昂；镇静对激昂不是“先减后加”或“双方各执行一次”。

### 4.2 镇静保留对方目标，与激昂目标分开

镇静请求与旧独立 profile 相同：

`requestedComposeStress = -max(trunc(targetCurrentStress / 2),30)`

`afterComposeStress = clamp(targetCurrentStress+requestedComposeStress,0,100)`

target 是镇静出牌者的对方，即本轮胜者，不是自己。目标 stress0/15/45/60/75/90分别请求−30/−30/−30/−30/−37/−45，结果0/0/15/30/38/45。镇静不撤销败方已受 HP 或 stress，不是始终减半。诡辩未接纳，所以镇静不反射到自己，激昂也不反射到对方。

### 4.3 分阶段回执不是净值猜测

每个 participant change 含 `attackStress` 与 `effectStress`，各记录 `beforeStress,requestedStress,afterStress,actualStressDelta`。顶层 requestedStress 为该参与者所承受的两个阶段已评估需求之和，actualStressDelta 为整轮 after−before；必须保留阶段 clamp，不能将需求相加后只 clamp 一次，也不能把需求值写成实际变化。

receipt 另含 `effects,effectOrder,effectSkipReason`：

- 非平局给胜者、败者两条审计记录，`effectOrder:'winner-then-loser-audit-slots'`，与 first 或 scenario 顺序无关。字段包含 actor、target、kind、阶段 stress、状态和 invoked。
- 普通/大喝/无视胜者为 `no-additional-effect`、invoked=true、requestedStress=0，表示已进入 Effect 但没有 writer，不是另写一次0。
- 败方镇静/激昂在普通或大喝胜时为 `applied`、invoked=true。镇静 target=对方，激昂 target=自己；每人的 effectStress 必须按真实目标汇总，不得假定都是作用于对方。
- 无视胜者记录无附加效果；败方记录 `suppressed-by-ignore`、invoked=false、requestedStress=null、actualStressDelta=0。受抑制的激昂审计槽仍 target=actor，但没有计算或写入40；受抑制镇静仍以对方为审计目标。null不是0，更不是已执行。参与者 effectStress 汇总只含已评估请求，受抑制时汇总请求为0。
- 平局 `effects:[]`、`effectOrder:'none-equal-card-power'`、`effectSkipReason:'equal-card-power'`；无视胜为 `effectSkipReason:'ignore-suppresses-loser-effect'`；其余胜负为null。

严格字段及类型见 API。effectStress 的 before 是该参与者完成 Attack 后的 stress；每条 Effect 的 before/after 则属于该条实际 target。不能为了让演员顺序与参与者顺序相同而交换记录。

## 5. 原子命令与整轮顺序

命令只有 `type:'ResolveAgitateDebateRound',expectedRevision,expectedRoundIndex,expectedFirstId,choices,rawDraws`。expected计数为0..4096安全整数并匹配 snapshot，first亦须匹配。choices 恰好两项 `{participantId,cardToken}`，按 scenario 顺序选自己的当前 hand token，不能按 first 重排。

- 普通/大喝胜：`[{role:'psychological-damage-jitter',bound:5,value:0..4}]`。
- 无视胜、任何等 power 平局：`[]`。
- 数量、role、bound和值域严格匹配，不接受多余 draw 后忽略；没有外部 RNG、callback或seed。

执行顺序：

1. 安全分离外部输入，从 genesis 完整重算 session；检查结构、active、expected值和当前 hand。
2. 以旧 topic 算 power，确定胜方/平局，按 Attack 分支核对 draw。
3. 在私有副本消费双方各一张牌，执行 Attack：普通/大喝伤害，无视 stress30，或平局双方 stress15。
4. **执行 Effect 后再判 HP。** 非平局按胜者→败者，Ignore 跳过败方；平局跳过全部 Effect。记录正确目标和阶段 clamp。
5. HP<=0时提交 finished；revision/roundIndex各+1，保留轮开始 first/topic，不更新崩坏、不补牌。败方已 HP<=0也不跳过其激昂/镇静；已发生的 Effect 必须保留。stress100和补牌不足不阻止 HP 终局。
6. 无 HP 终局且任一 stress>=100，`unsupported-anger-trigger` 整轮拒绝，连同拟议 Attack、Effect、消费、cursor、计数和日志一起回滚。不会提交 stress100 的 active session，也不自动使用手中其他激昂/镇静。
7. 非终局更新崩坏层 `clamp(trunc((1000-hp)/250),0,3)`。普通胜改 first/topic；大喝/无视胜只改 first；平局保持。镇静/激昂不胜出，没有独立胜者话题规则。
8. 按牌带补空位；任一不足为 `deck-exhausted` 整轮拒绝。检查完整拟议 session 预算后提交深冻结新 session/receipt，不改输入。

preview走同一 append 及预算路径，但不提交日志、不消耗外部 RNG。first只用于 receipt 的 `orderedIds:[first,other]`，没有伤害优势；plays/changes/choices 保持 scenario 顺序，而 effects 使用胜者/败者顺序。选牌、结算和补牌折成原子命令是工程政策，不声明复刻 AI、UI、私密选牌或半回合。

## 6. 保存、严格输入与资源边界

session envelope 为 `tag,policy,evidence,genesis,snapshot,entries`；genesis含完整 scenario 与重建初局，entry含 command 和 receipt。inspect/execute/preview/save/load均重建 genesis、逐条重算并对照 receipt 全字段，再对照最终 snapshot。外部 attack、hand、cursor、power、winner、damage、分阶段 stress、Effect 顺序/状态/目标和 noDrawReason 都不可信任。

save输出对象键排序、数组保序的 canonical JSON；load接受等价键序 JSON。不支持旧 profile/tag/command 或隐式迁移。存档未签名、未加密，只证明内部一致性，不认证外部真实牌局或制作者。

共同上限：4096条 entries、每方512牌、完整 canonical session UTF-8 16MiB、1,000,000值节点、深度32。policy/evidence与每条 receipt 均计入，preview同预算。remainingEntryCapacity只表示条数剩余，不保证牌带/字节/节点还够。预算耗尽是拒绝，不是平局。

失败统一 `{ok:false,reason,index}`，没有 partial session。replay场景/外层列表错误 index=−1，首失败命令为0-based index；session历史错误定位 entry，新命令错误通常null。完整原因及优先级边界见 API。

拒绝 Proxy、accessor、函数、undefined、外部 BigInt、Symbol、custom prototype、循环、稀疏 array、额外 array 属性、非法整数及−0。Node安全 Proxy 探测入口缺失为 `unsupported-runtime`，不降级。本批未运行，不能声称 Node 或浏览器兼容性已经验证。

## 7. 手工推导，全部未运行

本节与 [独立场景](../../data/scenarios/agitate-debate-example-v1.json) 均为纸面设计，不是执行 receipt、存档或测试结果。文件外层说明和纸面预期不是 API 输入；使用时只取对应 scenario 与命令。下列中局前提须由合法 genesis 历史达到，不能直接导入 stress/HP。

### 7.1 五轮接受与第六轮拒绝的纸面场景

INT60/60，attack均100，容量3，初始 story/first=beta。前五轮均有足够牌带补牌；第1、3轮 jitter0，第2、4、5轮 rawDraws=[]。

| 轮 | alpha / beta | 轮后 HP（alpha,beta） | 轮后 stress | first / topic |
|---|---|---|---|---|
| 1 | Agitate / story-small | 900,1000 | 50,0 | beta / story |
| 2 | Ignore / Compose | 900,1000 | 50,30 | alpha / story |
| 3 | story-small / Compose | 900,900 | 20,40 | alpha / story |
| 4 | Agitate / Agitate | 900,900 | 35,55 | alpha / story |
| 5 | Agitate / Ignore | 900,900 | 65,55 | beta / story |

第1轮 beta power11胜 alpha0，Attack使 alpha HP−100/stress0→10；然后 alpha激昂写自己10→50，beta保持0。beta虽是 scenario 第二人，effects仍先 beta、后 alpha。

第2轮 beta镇静被无视阻断，不能把 alpha50降为20。第3轮 beta先承受HP−100/stress30→40，再以镇静使 alpha50→20，请求−30。第4轮双激昂只有各+15，无+40。第5轮 alpha激昂被无视阻断，alpha仅35→65；审计 targetId仍为 alpha，invoked=false，请求null。

拟议第6轮 alpha出 Agitate、beta出 story-small，jitter0：Attack拟议 alpha HP900→800、stress65→75；激昂请求40，clamp至100、实际+25。HP尚未终局，整轮 `unsupported-anger-trigger`，保留第5轮 revision/roundIndex、HP900/900、stress65/55、first=beta、手牌、cursor及日志；没有部分提交的受击或激昂 receipt。

### 7.2 普通/大喝胜激昂与正确目标

同 INT初局 A出 story-small、B出 Agitate，jitter0：B HP900、stress0→10→50；A仍 HP1000/stress0。B change的 attackStress请求10、effectStress请求40、顶层请求50。effects先 A无附加效果，再 B applied且 targetId=B。

同条件 A改出 Shout：B HP820、stress0→15→55，只有一项伤害 jitter。漏 draw或多 draw均为 draw-shape，不因激昂自身不取随机数而容许空数组。

### 7.3 无视不调用败方激昂

初局 A Ignore胜 B Agitate，rawDraws=[]：B HP1000/stress30，A不变。damage=null、drawCount0、noDrawReason=`ignore-no-hp-damage`；B的 Effect 槽为 suppressed-by-ignore、targetId=B、invoked=false、requestedStress=null。不能给B加到70，也不能先加40再“抵消”。额外提供一项合法 jitter0仍整轮 draw-shape拒绝。

### 7.4 双激昂与镇静对激昂都只有平局 stress

初局 Agitate/Agitate、Compose/Agitate、Agitate/Compose均为 power0/0：HP不变、双方stress15、effects为空、first/topic保持、drawCount0、noDrawReason与effectSkipReason均为equal-card-power。不能把 mixed pair当作先镇静后激昂或按first先调用。

六次合法这类平局可达双方90；第七次拟议双方clamp100、无Effect、无HP终局，因此整轮 unsupported-anger-trigger。不能靠双镇静或激昂搭配绕过不支持的愤激。

### 7.5 达到100的触发只在全部 Effect 与 HP 判定之后

从三次合法平局到双方HP1000/stress45。A story-medium胜B Agitate，jitter0：拟议B HP850、Attack stress45→60；激昂请求40得到100，实际+40。无HP终局，整轮拒绝，不能提交B的150伤害或把stress截成99。

此处即使B还持有另一张Compose，也不触发自动反制，不额外消费卡牌，不清零或延后拒绝。检查时点在Effect后，不等于本 profile 已经实现 Anger。

### 7.6 HP终局仍执行败方激昂，保留clamp

同 INT、初始 story，先让 A连续五次 Shout胜 B普通牌，每次jitter0且补牌充足：B依次HP820/640/460/280/100，stress15/30/45/60/75；A一直HP1000/stress0。

下一轮 A Shout、B Agitate，jitter0：Attack先使B HP100→−80、stress75→90；随后B激昂仍执行，请求+40，stress90→100、实际+10；最后接受 HP终局。B的整轮 requestedStress=15+40=55，actualStressDelta=25，不能记成55，也不能因为B已HP−80而省略激昂。

receipt terminal=true、败方Effect applied、first/topic保留轮开始值，crumbleEvaluated/refillApplied=false。两张牌已消费，不补牌、cursor不推进；终局stress100和后续牌带不足不拒绝。不能把HP终局提前到Effect之前，亦不能把愤激拒绝提前于HP终局。

### 7.7 补牌、输入与存档边界

牌带只够初始容量时，第一轮普通胜激昂的伤害/Effect虽可纸面推导，仍因非终局补牌不足整轮 deck-exhausted；不留下HP、stress50或未满hand。HP终局不要求补牌。

把第1轮激昂 targetId改成beta、把40改成30、交换effects顺序、把第5轮suppressed改为applied，或给第4轮添加两条激昂Effect，均不等于重算receipt，应拒绝receipt-mismatch。participant effectStress也必须与真实目标一致，不能只修改顶层净值规避逐阶段核对。

只重排保存文本的对象键、不改数组顺序和值，则仍是同义JSON。把旧Compose tag/profile/command直接改名或给旧牌DTO追加新kind，不构成有效迁移；必须由新profile的合法genesis及命令历史重建。

## 8. 交付与验证声明

基线为PR #107已交付的 main `46837ddb7bcf80e14ace560a0e59b1a1b40fb181`。新增独立实现、规则/接口文档、来源manifest与纸面场景；普通、大喝、无视、镇静四种既有profile保持不变。是否发布以仓库实际记录为准，本页不虚构提交、合并或CI结果。

遵循用户要求，本批只有静态源文阅读、文本修改与人工审阅：未运行测试、typecheck、编译、构建、项目validator/checker、诊断、示例、replay或产品。纸面数值不是运行断言；历史测试结果、default-food失败、原43/45证据边界和P078排除均不因本批被覆盖或清零。
