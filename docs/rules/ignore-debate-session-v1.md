# 普通话题牌 + 大喝 + 无视独立舌战 session v1

日期：2026-10-20。实现：[ignore-debate.ts](../../packages/engine/src/ignore-debate.ts) · [API、完整 DTO 与错误](../engine/ignore-debate-session-v1.md) · [全部政策与固定来源](../sources/ignore-debate-session-v1.json) · [纸面场景，未运行](../../data/scenarios/ignore-debate-example-v1.json)。

本页定义新的有界子集，不是旧普通牌/大喝 session 的静默扩容，也不是完整舌战或原版认证。普通牌与正常态大喝语义保留；新增正常态无视，特别区分“胜出但无 HP 伤害”和“平局”。

## 1. 固定身份与支持边界

- profile：`debate-topic-shout-ignore-reference-v1`。
- session tag：`ignore-debate-session-v1`。
- 唯一命令：`ResolveIgnoreDebateRound`。
- 常量：`IGNORE_DEBATE_POLICY_V1`、`IGNORE_DEBATE_EVIDENCE_V1`。
- 公开类型：`IgnoreDebate*V1`。

两名 source-normal 通用参与者，从 HP1000/stress0/angerTimer0 开始。支持九种普通话题模板、大喝、无视、按 token 出牌/消费/补牌、整数伤害/stress、HP 胜负、保存与逐项重放。旧 session 和旧 card DTO 不自动迁移。

仍不支持诡辩、镇静、激昂、再考、四性格愤激、反制第二张消费、连打/兴奋 timer、真实人物/书籍/MOD hook、原作 DeckGenerate/洗牌/概率、开场一击决胜、追击/留情/负伤。参考源码中无视会跳过对方附加效果，不等于这个子集已实现其他话术。

本接口不接 campaign、training GameState、外交自动结算、部队/城市/势力/奖励、P078/native 人员任务、俘虏/处斩/归属或 return/mission 链。通用 ID 不映射武将；session 结束也不自动写外部状态。

任一非终局 stress 达到100时整轮拒绝。不能 cap99、清零、跳过愤激或伪造“无视击败”来绕过。因此，有些原作合法牌局会停在本 profile 边界。

## 2. 固定来源与证据层级

现代参考仓库为 `tankyc/sango_infinity`，commit：

`a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef`

使用固定 [Debate.cs](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs) 与 [DebatePhase.cs](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/DebatePhase.cs)。来源 blob 分别为 `0137498d10773cd4596d497083ccdf6a26b3a261` 和 `6aa98f855a5d4d172cde7e8ffc18a141b8a7b587`；文件身份、字节、SHA-256及读回说明见 [source manifest](../sources/ignore-debate-session-v1.json)。

| 固定位置 | 支持的规则 |
|---|---|
| [Debate.cs 908–926](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L908-L926) | 无视120、大喝110、普通牌等级1/2/3加当前话题10 |
| [934–987](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L934-L987) | 参考源码可用性有性格/愤激门槛；本子集双方 timer 恒0，不能推广为任意状态可用 |
| [1083–1126](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L1083-L1126) | 非终局胜者更新 first；只有普通牌跟随改 topic；无视/大喝保留话题 |
| [1129–1142](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L1129-L1142) | power 比较；未支持大胆愤激强制 power |
| [1146–1208](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L1146-L1208) | 普通/大喝 HP 与 stress 系数；不是无视的伤害入口 |
| [1216–1236](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L1216-L1236) | 等 power 平局双方stress15，无 HP 伤害；大喝写对方 HP/stress |
| [1267–1275](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L1267-L1275)、[1423–1456](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L1423-L1456) | Attack 的无视分支直接 `Ignore(team,30)`；只给对方stress，不调用CalcHpDamage，不取jitter |
| [1459–1480](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L1459-L1480)、[1567–1580](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L1567-L1580) | 无视胜后跳过对方附加效果；本 profile 三类牌均无额外 Effect，不重复施加stress |
| [DebatePhase.cs 394–420](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/DebatePhase.cs#L394-L420) | Attack→Effect→HP winner→Anger，HP终局先于愤激 |

初始化 attack、HP/stress clamp、槽位/再考保留槽、崩坏显示沿用同一固定来源的既有普通/大喝子集，完整定位收于 manifest。无视30来自 Attack 的显式参数，不能套用 `CalcStressDamage` 对普通/大喝的返回值。

本批扩展的是现代参考子集覆盖，不发现新公式、不认证原 PC-PK/PK1.1、Vanilla或主机二进制。`nativeEquivalent:false`、`stockOriginalVerified:false`、`completeDebate:false`；既有 E15 标签只适用于既有普通通用核心。原43组未决证据主题不因无视子集减少或清零。现代源码转录、工程政策、原生等价是不同证据层。

## 3. 全部输入与封闭牌联合

scenario 严格只有 `schemaVersion:1,profile,genericOnly:true,difficulty:'source-normal',policies,challengerId,initialTopic,participants`。policies 是完整 `IGNORE_DEBATE_POLICY_V1`，不接受只给 id 或部分默认值。initialTopic 为 story/logic/trend，显式提供；participants 恰好两项，顺序固定。

每个 participant 严格只有 `id,resolvedIntelligence,hp:1000,stress:0,angerTimer:0,cardTape`：

- id 唯一、ASCII `[A-Za-z][A-Za-z0-9_-]{0,63}`；challengerId 必须属于两人之一，决定开局先手。
- resolvedIntelligence 为1..100安全整数，已解析且无外部 hook。
- cardTape 每方最多512项，必须足够初始手牌，按提供顺序发牌。
- 不接受真实人物/物品/性格字段，不是任意中局导入器；中局须由本 session 的 genesis 和历史重算。

cardTape 模板严格三选一：

```ts
{ kind: 'topic', topic: 'story' | 'logic' | 'trend', level: 'small' | 'medium' | 'large' }
{ kind: 'shout' }
{ kind: 'ignore' }
```

大喝和无视没有 topic/level。缺 kind、未知 kind、其他话术均拒绝；多余字段不静默忽略。旧 `{topic,level}` 不是本profile输入。

| INT | sourceSlotCount | playableHandCapacity |
|---|---:|---:|
| 1..69 | 4 | 3 |
| 70..79 | 5 | 4 |
| 80..89 | 6 | 5 |
| 90..100 | 7 | 6 |

三类牌共用容量，保留一个不可用再考槽，`reservedRethinkSlot:true` 不产生动作。occurrence 是模板加 `token,tapeIndex`；token=`id:tapeIndex`，索引从0起。初始按牌带取满，deckCursor 指向下一未发位置；移除所选token，稳定保留其他牌，再按牌带补空位。重复模板是不同 occurrence；不恢复原作牌组循环、洗牌或 UI 排序。

## 4. 比较、伤害与零随机数胜负

| 胜牌/分支 | power | HP requestedDamage | requestedStress | rawDraws |
|---|---:|---|---|---|
| 普通small/medium/large | 非匹配1/2/3；匹配11/12/13 | 按普通公式 | 败方10/15/20，胜方0 | 恰好1项 |
| 大喝 | 110 | 按大喝公式 | 败方15，胜方0 | 恰好1项 |
| 无视 | 120 | 双方0 | 败方30，胜方0 | 严格空 |
| 等power平局 | 相等 | 双方0 | 双方15 | 严格空 |

无视胜大喝与任何普通牌，双无视平局；双大喝也平局。不同非当前话题但同等级普通牌可平局。power差只决定胜方，不进入伤害。

固定 attack：

`attack = 100 + trunc(40 * (myINT - opponentINT) / (131 - myINT))`

普通/大喝才计算：

`requestedHpDamage = trunc((attack+jitter) * 10 * levelCoef * topicCoef / 1000)`

- 普通 levelCoef=10/15/20，topicCoef 按本轮开始话题匹配10、否则6。
- 大喝 levelCoef15、topicCoef12，不受话题影响。
- 正常态 angerCoef10；jitter 明确给0..4。
- 除法向零，负 attack 中间差值不可 floor；内部用精确 bigint，公开为安全整数。
- 无视不调用公式，不构造零系数 damage 对象，不取随机数再丢弃；它的 `damage:null` 是“没有 HP 伤害事件”，不是平局。

同INT大喝jitter0为180，普通匹配large为200，非匹配large为120；无视无论INT与topic都为0 HP、败方stress30。不能误认为power120意味着更高 HP 伤害。

writer 为 HP=`clamp(beforeHp-requestedHpDamage,-100,1000)`，stress=`clamp(beforeStress+requestedStress,0,100)`。receipt 分别记 requested 和实际差 `after-before`。无视成功回合不会到stress100，所以其败方实际stress增量必为30；若需clamp到100则整轮拒绝，不产生成功receipt。

## 5. 命令与整轮顺序

唯一命令只有 `type:'ResolveIgnoreDebateRound',expectedRevision,expectedRoundIndex,expectedFirstId,choices,rawDraws`。expected计数为0..4096安全整数且匹配当前snapshot；first也须匹配。choices恰好两项 `{participantId,cardToken}`，按scenario顺序，各自选择当前hand中的token。不能按先手重排choices或传入模板替代token。

分支随机输入精确要求：

- 普通或大喝胜：`[{role:'psychological-damage-jitter',bound:5,value:0..4}]`。
- 无视胜或任何平局：`[]`。
- 额外draw、缺draw、错role/bound/值域均拒绝；不存在外部RNG callback或seed。

执行：

1. 安全分离外部输入，从genesis完整重算session；检查命令结构、active、expected值和手牌成员资格。
2. 用旧topic算power，确定胜方或平局，按胜牌kind决定是否需要HP伤害draw并严格核对。
3. 私有副本消费双方各一张牌。普通/大喝胜写败方HP与stress；无视胜仅写败方stress30；平局各写stress15。
4. **先判HP<=0。** 普通/大喝可产生终局；成功计数各+1并finished，保留本轮开始first/topic，不更新崩坏、不补牌，stress100或牌带耗尽不阻止已形成的HP终局。
5. 无HP终局且任一stress>=100，`unsupported-anger-trigger`整轮拒绝，HP/stress、两张牌、cursor、计数和日志全不变。无视不减HP，从可验证active状态出发不能形成HP终局，不能借“winner”绕过这一检查。
6. 非终局更新显示崩坏层 `clamp(trunc((1000-hp)/250),0,3)`，不恢复再考。普通胜改first和topic；大喝/无视胜只改first、保持topic；平局都保持。
7. 双方按牌带补空位，任一不足则`deck-exhausted`整轮回滚。无视胜虽然没有HP伤害仍须消费和补牌，不是免费跳过轮次。
8. 检查完整拟议session预算后提交新session/receipt；输出深冻结，不改输入。preview共用同一append与预算，但不提交日志，外部RNG消耗0。

first只决定receipt的 `orderedIds:[first,other]`，不带伤害优势。plays/changes与choices均维持scenario顺序。参考源码的选择和补牌阶段被折叠成一个原子命令，这是工程政策，不声明复刻私密选牌、AI、UI或半回合。

## 6. 保存与错误边界

session envelope 为 `tag,policy,evidence,genesis,snapshot,entries`；genesis为完整scenario及重建初局snapshot；entry为command和receipt。inspect/execute/preview/save/load均重新校验genesis、逐条重算并全字段对照receipt，最后对照snapshot。只改attack/hand/cursor/power/winner/damage/noDrawReason等展示字段不能绕过。

save输出对象键排序、数组保序的canonical JSON；load接受等价键序JSON。旧profile/tag/command不兼容，无隐式迁移。存档未签名、未加密，只证明内部一致性，不能认证外部真实牌局或制作者。

共同上限：4096条、每方512牌、完整canonical session UTF-8 16MiB、1,000,000值节点、深度32。policy/evidence及每条receipt均计入，不只计算commands。preview与execute同预算；remainingEntryCapacity仅是条数剩余，不保证牌带/字节/节点还够。耗尽是API拒绝，不是游戏平局。

失败统一 `{ok:false,reason,index}`，不返回partial session。replay场景/外层列表错误index=−1，之后首失败命令为0-based index；session历史重算错误定位entry，普通输入/新命令错误通常null。安全分离可能先发现后面entry的非法结构，完整优先级和全部reason见API。

拒绝Proxy、accessor、函数、undefined、外部BigInt、Symbol、custom prototype、循环、稀疏array、额外array属性和非法整数/−0。Node安全Proxy探测入口缺失为`unsupported-runtime`，不降级；本批未运行，不能宣称已验证Node兼容性。

## 7. 手工推导，全部未运行

以下数值与 [独立场景](../../data/scenarios/ignore-debate-example-v1.json) 都是纸面设计，不是运行receipt、运行存档或测试结果。静态文件外层说明/paperExpected不是API输入，只取scenario和commands。

独立场景采用INT60/60、容量3、各7张牌、初始story/first=alpha，四轮如下；前两轮rawDraws空，后两轮jitter0：

| 轮 | alpha / beta 出牌 | 轮后 HP（alpha,beta） | 轮后stress | first / topic | 双方cursor |
|---|---|---|---|---|---:|
| 1 | Shout / Ignore | 1000,1000 | 30,0 | beta / story | 4 |
| 2 | Ignore / Ignore | 1000,1000 | 45,15 | beta / story | 5 |
| 3 | logic-large / Shout | 820,1000 | 60,15 | beta / story | 6 |
| 4 | trend-large / logic-small | 820,880 | 60,35 | alpha / trend | 7 |

第三轮大喝伤害180，第四轮普通牌伤害120使用旧story；不是先改trend再算200。

### 7.1 无视胜不是平局

A/B均INT60，初始story、first=A，各至少4张牌，初始容量3/cursor3。A选story/large，B选ignore，rawDraws为空。power13/120，result=winner、roundWinnerId=B；双方HP1000，A stress30/B stress0。damage=null、drawCount0、noDrawReason=`ignore-no-hp-damage`，不是equal-card-power。非终局first=B、topic仍story；双方消费选牌并补索引3，cursor4、revision/roundIndex1。

若给一个合法jitter，也因draw-shape整轮拒绝；不会使用它计算0伤害。把A改为大喝时power110/120，其他无视结果一样。

### 7.2 双无视平局

两方ignore均power120，rawDraws空，result=draw、roundWinnerId=null、damage=null、drawCount0、noDrawReason=`equal-card-power`。各stress15、HP不变、first/topic保留。给单方30或给双方30均错误。

### 7.3 无视加速触及子集边界

两方HP1000、stress0、有足够牌带，A连续无视胜B：B stress依次30、60、90，HP始终1000。第四次拟议stress clamp100但没有HP终局，整轮unsupported-anger-trigger；第三轮session、手牌和cursor全部保留。不能宣称A靠stress100取得本profile的HP胜利。

### 7.4 旧普通/大喝语义与终局仍保留

同INT、旧topic=story，logic/large胜trend/small，jitter0：damage120、败方stress20，之后first转胜者、topic转logic。大喝胜普通牌，jitter0：damage180、stress15，非终局只改first，topic不变。

同INT匹配large连续五胜，败方HP800/600/400/200/0、stress20/40/60/80/100，第五轮仍优先接受HP终局；终局first/topic保留轮开始值、不补牌。此合同没有因为加入无视而改变。无视本身不能造成这一终局。

若牌带仅够初始容量，第一次非终局无视胜也会因补牌不足而deck-exhausted，不能成功后留下空槽。正常HP终局则不要求补牌。

## 8. 保留事项与未执行声明

本批仅静态读源、修改代码和补文档，没有运行测试、typecheck、编译、build、checker、validator、诊断、产品或示例。旧测试及旧session合同未改；历史通过结果不验证本批。

下一批仍需独立处理其他三话术的附加效果/反射/重随机，四性格愤激及反制/连打/timer，再考/真实发牌，真实人物/书籍，开场/追击/留情和campaign结果层。无视的power、stress和零draw分支覆盖不等于这些部分默认完成。
