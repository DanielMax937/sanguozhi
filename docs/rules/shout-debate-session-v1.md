# 普通话题牌 + 大喝独立舌战 session v1

日期：2026-10-20。直接实现入口：[shout-debate.ts](../../packages/engine/src/shout-debate.ts)。[完整 API 与 DTO](../engine/shout-debate-session-v1.md) · [全部政策与来源记录](../sources/shout-debate-session-v1.json) · [三轮纸面场景，未运行](../../data/scenarios/shout-debate-example-v1.json)。

这是新的、独立、有界子集，不是给旧 `topic-debate-session-v1` 存档换名，也不是完整舌战或原生三国志 11 的等价实现。PR105初版仅新增文件，不改当时旧入口、旧索引、旧存档合同或经济批次。2026-10-20后续登记批次补齐公共包导出与全局索引，不改变本profile行为；普通＋大喝＋无视另见[独立规则](ignore-debate-session-v1.md)，没有隐式升级本存档。

## 1. 支持域与明确排除

本 profile 支持两名 source-normal 通用参与者、九种普通话题模板和一种大喝模板，按当前手牌 occurrence 选牌、消费、显式牌带补牌、整数伤害与 stress writer、回合胜负、非终局先手/话题更新、HP 终局、完整保存、校验与重放。

固定身份：

- profile：`debate-topic-shout-reference-v1`
- session tag：`shout-debate-session-v1`
- 唯一命令：`ResolveShoutDebateRound`
- 政策导出：`SHOUT_DEBATE_POLICY_V1`
- 公开类型命名空间：`ShoutDebate*V1`

仅支持新局 HP1000、stress0、angerTimer0。普通牌既有语义保留；本批只增加正常态大喝，不加入无视、诡辩、镇静、激昂、再考、四性格愤激、反制消费/连打/兴奋 timer、真实人物或书籍特例、原作牌组生成与随机洗牌、开场一击决胜、追击/留情/负伤、Vanilla/主机或 MOD。

这不是 campaign 集成：不接 training GameState、外交自动结算、部队/城市/势力/奖励、P078/native 人员任务、俘虏/处斩/归属或 return/mission 链。输入通用 ID 不会映射成武将，`debateEligible` 不会自动创建 session，胜者也不会自动写回外交。

非终局 stress 到达100时整轮原子拒绝，不能承诺任意原作牌局都能在本子集中完成。不能 cap99、清零、跳过愤激或把不支持的牌当普通牌。

## 2. 证据身份与固定来源

来源为 `tankyc/sango_infinity` 的现代 C# 转录参考，固定 commit：

`a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef`

本批已通过固定 ref 读回 [Debate.cs 全文](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs) 与 [DebatePhase.cs 全文](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/DebatePhase.cs)，对实际文件重算 Git blob、SHA-256、UTF-8 bytes，与 [来源 manifest](../sources/shout-debate-session-v1.json) 一致。这里只核对来源文件身份并静态读取，没有执行源码或项目验证器。

| 文件 | Git blob | UTF-8 bytes | SHA-256 |
|---|---|---:|---|
| Debate.cs | `0137498d10773cd4596d497083ccdf6a26b3a261` | 71288 | `622789ca8b8b6799a321526dcfb513d6622adf5b5d54025175c2a7795ef7da28` |
| DebatePhase.cs | `6aa98f855a5d4d172cde7e8ffc18a141b8a7b587` | 14048 | `5b47f7b6a89d6123a23e7c14f22168e59c9edd549e98d9bc0258d8a55bb9cbf3` |

| 固定源码位置 | 本批使用的含义与限制 |
|---|---|
| [343–354](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L343-L354)、[413–438](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L413-L438) | 总槽4/5/6/7，保留一个再考槽；本 profile 不实现再考或源 UI 排序 |
| [513–534](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L513-L534)、[554–570](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L554-L570) | HP/stress clamp、attack、初始 stress/timer；人物 hook 在本子集恒等或禁用 |
| [908–926](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L908-L926) | 大喝 power110；普通 power 为等级1/2/3加当前话题10 |
| [934–987](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L934-L987) | 牌可用性含愤激/性格门槛；这里 timer 恒0，不推广成任何状态都可大喝 |
| [991–999](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L991-L999) | 选择消费手牌；本 API 折叠为两方选择的一次原子提交 |
| [1083–1126](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L1083-L1126) | TurnEnd：有胜方先更新 first，只有普通话题牌才跟随更新 topic；诡辩重随机排除 |
| [1129–1142](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L1129-L1142) | power 比较决定攻击方；大胆愤激强制 power 分支排除 |
| [1146–1195](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L1146-L1195) | 正常态大喝 levelCoef15、topicCoef12、angerCoef10、jitter0..4；人物伤害 hook 恒等 |
| [1199–1208](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L1199-L1208)、[1216–1236](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L1216-L1236) | 大喝对败方 stress15；平局双方 stress15；大喝只写对方 HP/stress |
| [1423–1480](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L1423-L1480)、[1567–1580](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L1567-L1580) | Attack 分派大喝或普通牌；逐牌 Effect 没有额外大喝效果，不能结算第二次 |
| [1380–1395](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L1380-L1395)、[1520–1531](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L1520-L1531) | HP 胜负与崩坏；崩坏仅展示，不恢复再考权限 |

注意行号：TurnEnd 定义在1083，1090是其中 timer 分支；Shout 定义在1227，1230是取 target；1540是 Init 的 `critical=-1`，不是 Attack/Effect。应引用上表完整区间，不把近似行号误作方法定义。

终局优先级沿用既有普通 session，并由本批固定来源读回的 [DebatePhase.cs 394–420](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/DebatePhase.cs#L394-L420) 静态支持：Attack→Effect→HP winner→Anger。文件身份核对不是项目执行或行为测试，也不升级来源的原生证据等级。

证据必须分层：普通通用核心沿用既有 E15 标签，不是本批发现新公式；大喝只增加固定现代参考下的状态机覆盖。`nativeEquivalent:false`、`stockOriginalVerified:false`、`completeDebate:false`。现代源码自称从 C++ 翻译，不等于认证原 PC-PK/PK1.1、Vanilla 或主机二进制。提供牌带、原子命令、容量和持久化都是工程政策，不是原作随机分布或原生全链。原43组未决证据主题不因本批清零或减少。

## 3. 完整 scenario 输入域

每个对象严格只接受登记的必需字段，不默认补字段。类型与全部 DTO 见 API 文档。

| scenario 字段 | 必须满足 |
|---|---|
| schemaVersion | 整数1 |
| profile | `debate-topic-shout-reference-v1` |
| genericOnly | 严格 true |
| difficulty | `source-normal` |
| policies | 完整 `SHOUT_DEBATE_POLICY_V1`，所有字段/值相等，不能只传 id |
| challengerId | 与两名参与者之一的 id 相同，决定开局 firstId |
| initialTopic | 显式 `story` / `logic` / `trend`，不随机生成 |
| participants | 恰好两项，顺序固定为所有 choices、plays、changes 顺序 |

每个 participant 只有 `id,resolvedIntelligence,hp,stress,angerTimer,cardTape`：

- `id` 唯一且为 ASCII `[A-Za-z][A-Za-z0-9_-]{0,63}`，是 session opaque ID，不是人物 ID。
- `resolvedIntelligence` 为1..100安全整数，已解析，不携带书籍/人物/MOD hook。
- `hp:1000,stress:0,angerTimer:0` 严格固定。
- `cardTape` 每方最多512项，且必须足够初始手牌。数组顺序是发牌顺序，不循环、不洗牌、不随机补充。
- `personId/person/personHooks/characterId`、物品字段以及未登记字段不允许通过“忽略”方式进入。

不是任意中局导入器。中局只接受能从本 profile genesis 和完整 commands/receipts 重算一致的 session。

## 4. 封闭牌联合与同一手牌容量

牌模板严格为二选一：

```ts
{ kind: 'topic', topic: 'story' | 'logic' | 'trend', level: 'small' | 'medium' | 'large' }
{ kind: 'shout' }
```

大喝没有 topic 或 level，不能伪装为 `story/medium`，也不能携带额外字段。普通牌必须含 `kind:'topic'`；旧 `{topic,level}` 牌不是本 profile 输入。每个模板出现都产生单独 occurrence，重复模板合法但不是同一张牌。

| 牌 | power | 伤害 levelCoef | 伤害 topicCoef | 分出胜负时败方 requestedStress |
|---|---:|---:|---:|---:|
| 普通 small | 非当前1 / 当前11 | 10 | 匹配旧 topic10，否则6 | 10 |
| 普通 medium | 非当前2 / 当前12 | 15 | 匹配旧 topic10，否则6 | 15 |
| 普通 large | 非当前3 / 当前13 | 20 | 匹配旧 topic10，否则6 | 20 |
| 大喝 | 恒110 | 15 | 恒12 | 15 |

大喝总是胜过本 profile 的任何普通牌。两张大喝等 power，走平局：双方 HP 不变、各 requestedStress15、不计算 damage、不接收 jitter。普通牌等 power 同样平局，包括不同非当前话题但同等级的组合。power差不进入伤害。

| INT | sourceSlotCount | 可出牌容量 |
|---|---:|---:|
| 1..69 | 4 | 3 |
| 70..79 | 5 | 4 |
| 80..89 | 6 | 5 |
| 90..100 | 7 | 6 |

普通牌与大喝共用 `playableHandCapacity`，即“总槽减一个再考保留槽”的容量，不为大喝加槽。政策中的对应数组名为 `hand.playableCapacities`，不是旧 profile 的 `ordinaryCapacities`。`reservedRethinkSlot:true` 只是边界记录，不是可选牌或可用再考按钮。

occurrence 为合法模板加 `token,tapeIndex`，token=`id:tapeIndex`，tapeIndex 从0开始。初始手牌取牌带前若干项，deckCursor 指向下一未发位置；消费按 token 精确移除，保留手牌稳定顺序，再追加新牌。没有复制源 CharacterSortCards 的 UI 排序。

## 5. 精确整数公式

开局 attack 固定：

`attack = 100 + trunc(40 * (myINT - opponentINT) / (131 - myINT))`

所有除法向零，不能用 floor 处理负值。中间值使用精确 bigint，公开结果为安全整数。INT100对80为125，80对100为85，同 INT 为100；attack 不允许外部覆盖。

普通牌：

`requestedHpDamage = trunc((attack + jitter) * 10 * levelCoef * topicCoef / 1000)`

大喝：

`requestedHpDamage = trunc((attack + jitter) * 10 * 15 * 12 / 1000)`

双方正常态固定 angerCoef10。分出胜负时仅胜方使用一个外部提供的 jitter，范围0..4。没有 RNG callback、全局 RNG、seed 或隐式随机数。平局不计算此公式、无 draw。

同 INT 的大喝为180..187伤害；匹配普通大为200..208。因此“power110大于13”只说明大喝赢比较，不意味着伤害数也比普通大更高。大喝固定系数12不是匹配任何 topic 的加成，不能先把 topic 改成某个伪造的大喝话题。

writer：

- HP=`clamp(beforeHp-requestedHpDamage,-100,1000)`。
- stress=`clamp(beforeStress+requestedStress,0,100)`。
- `actualHpDelta=afterHp-beforeHp` 是有符号差，通常非正；不是 requestedHpDamage。
- `actualStressDelta=afterStress-beforeStress` 可因 cap100 小于 requestedStress。
- 胜方 requestedDamage/stress 均0；平局双方 damage0/stress15。

## 6. 唯一命令与随机输入

命令必需且仅有 `type,expectedRevision,expectedRoundIndex,expectedFirstId,choices,rawDraws`：

- `type:'ResolveShoutDebateRound'`。
- expectedRevision/expectedRoundIndex 为0..4096安全整数，必须与当前 snapshot 一致。
- expectedFirstId 必须是当前 firstId。
- choices 恰好两项，每项只有 `participantId,cardToken`，顺序必须与 scenario 一致，不能按先手重排。
- cardToken 必须在该 participant 当前 hand 中。对方牌、旧牌、未发牌、重复token、仅传模板均不能出牌。
- token 语法为合法 ID + 冒号 + 规范十进制0..999；真实牌带上限512意味着可生成索引仅0..511。
- 平局 `rawDraws:[]`；胜负恰好 `[{role:'psychological-damage-jitter',bound:5,value:0..4}]`。
- 错 role/bound/条数或无用 draw 拒绝；不接收外部预计算 power/attack/damage/winner。

两个选择在一个命令内原子提交，不模拟私密选牌、AI、思考时间或半回合。firstId 决定记录的 `orderedIds:[first,other]`，不产生额外伤害优势。choices/plays/changes 仍为 scenario 顺序。

## 7. 单轮执行顺序与原子性

1. 安全分离输入，先从 genesis 完整重算 session，再检查命令结构、active 状态、expected 值和当前 hand 成员资格。
2. 用本轮开始的 topic 算双方 power，决定 winner/draw，然后核对该分支 rawDraws 精确数量。
3. 在私有副本计算伤害/stress，消费双方选择各一张，执行 HP/stress clamp。
4. **先判断 HP<=0。** 终局记录 HP 胜者，revision/roundIndex各+1，status=`finished`。即使同击 stress100、补牌已耗尽，也接受终局。不执行愤激、崩坏更新、TurnEnd先手/话题更新或补牌。firstId/currentTopic 保持本轮开始值，胜者以 outcome 为准。
5. 无 HP 终局且任一 stress>=100，整轮返回 `unsupported-anger-trigger`。输入 session、HP/stress、手牌、cursor、计数和日志全不变；不会提交半轮或消耗 draw 记录。
6. 非终局更新展示崩坏层 `clamp(trunc((1000-hp)/250),0,3)`；这不恢复再考。
7. 非终局普通牌胜：firstId=胜者，currentTopic=胜者普通牌 topic。非终局大喝胜：只更新 firstId，currentTopic 不变。平局：两者都不变。
8. 从双方牌带补空位，得到下一轮起点。任一方不足则 `deck-exhausted`，整轮回滚，哪怕另一方局部已补牌。终局永不进入此步。
9. 对完整拟议 session envelope 检查条数、字节、节点、深度等预算，全部通过才返回成功 session/receipt。所有输出深冻结，不修改输入。

preview 和 execute 走相同 append 和完整预算路径。preview 不返回提交后的 session、不追加输入日志、外部 RNG 消耗固定0；它不是跳过预算的伤害计算器。

选择时消费与下一轮开头补牌被折叠进一个原子命令，这是工程边界，不声称复刻原作 UI/半回合状态机。“失败时 draw 不消费”是说没有成功 receipt/日志，不是回滚某个外部随机源。

## 8. 保存、重算与预算

session envelope 只有 `tag,policy,evidence,genesis,snapshot,entries`；genesis 只有完整 `scenario,snapshot`；每条 entry 只有 `command,receipt`。

create 生成初局。inspect、preview、execute、save 对传入 session 从 genesis 重算全部历史；load 对 JSON 解析后的 session 做相同重算。初始 snapshot、每条 receipt、最终 snapshot 都逐字段比较，不信任 attack/cursor/hand/power/damage/winner 等自报值。policy/evidence 为完整注册值，不能只核 id。

save 的 canonical JSON 对 object 键排序，保留数组顺序；load 可接受不同键序的语义相同 JSON。它不是签名或加密，不认证外部真实游戏记录，也不能阻止调用者重新制作一个内部一致但虚构的历史。旧 topic-only 存档不能直接 load 到新 profile，也没有隐式迁移。

共同硬边界：

| 项目 | 上限 |
|---|---:|
| 成功 entries / replay commands | 4096 |
| 每方 cardTape | 512 |
| 完整 canonical session UTF-8 bytes | 16,777,216 |
| 输入或输出值节点 | 1,000,000 |
| 嵌套深度 | 32 |

对象输入安全分离和最终拟议结果均受预算限制；load 还限制原 JSON 文本字节。policy/evidence/receipt 的重复内容计入完整 session 大小，不能只算命令。剩余 entry 数不保证还有字节/节点/牌带容量。预算耗尽是 API 拒绝，不是 SAN11 平局。

replay 从 scenario 重建，顺序处理 commands，首失败原子返回，不提供 partial session。安全输入域、完整错误与 index 定位规则见 API 文档。

## 9. 手工推导示例：全部未运行

以下是纸面设计，不是运行 receipt、保存文件、测试结果或通过证明。

独立 [三轮场景文件](../../data/scenarios/shout-debate-example-v1.json) 另展示：INT60/60、初始story/alpha先手；第一轮beta大喝胜，alpha HP820/stress15、first转beta但topic仍story；第二轮双大喝平局，HP不变、stress为30/15，无draw；第三轮alpha非匹配trend/large胜beta非匹配logic/small，伤害120使beta HP880/stress35，之后first转alpha、topic转trend。双方cursor依次4/5/6。文件外层的说明和 `paperExpected` 不是API输入，使用时只取 `scenario` 和 `commands`。

### 9.1 六次大喝完成一场

A/B均INT100，初始topic=`story`，challenger=`B`。每方牌带11张：A全 `{kind:'shout'}`，B全 `{kind:'topic',topic:'logic',level:'small'}`。初始容量6，hand tokens为0..5，cursor6。第n轮依次选择双方索引n−1，jitter0。

双方power为110/1，A attack100，每次 requestedHpDamage=`100*10*15*12/1000=180`；B requestedStress15。普通牌即使改为当前话题大牌power13，也不能胜过大喝。

| 成功轮 | expectedRevision/round | expectedFirstId | B HP | B stress | 双方cursor | 轮后first/topic |
|---|---|---|---:|---:|---:|---|
| 1 | 0/0 | B | 820 | 15 | 7 | A/story |
| 2 | 1/1 | A | 640 | 30 | 8 | A/story |
| 3 | 2/2 | A | 460 | 45 | 9 | A/story |
| 4 | 3/3 | A | 280 | 60 | 10 | A/story |
| 5 | 4/4 | A | 100 | 75 | 11 | A/story |
| 6 | 5/5 | A | −80 | 90 | 11 | A/story，finished |

前五轮补入索引6..10。第六轮消费索引5后不补牌，保留手牌6..10，牌带耗尽不阻止终局。revision/roundIndex为6，outcome为A胜B负；B崩坏前五轮为0/1/2/2/3，终局保留3。每次大喝均保留story，不能把B出的logic带到下一轮话题。

### 9.2 大喝平局与愤激边界

两方都选 `{kind:'shout'}`，有足够牌带，rawDraws必须 `[]`。六次成功平局 HP始终1000，stress为15/30/45/60/75/90，first/topic保持原值。第七次请求会把双方stress写到100但没有HP终局，必须整轮 `unsupported-anger-trigger`；第六轮 session、hand token、cursor、revision和entries全部保留。传入一个jitter反而先因 `draw-shape` 拒绝，不得先取随机数再忽略。

### 9.3 普通牌仍用旧话题

同INT、旧topic=`story`，A出logic/large，B出trend/small，power3/1，jitter0：damage=`100*10*20*6/1000=120`，败方stress20。若非终局，之后first=A、topic=logic。本轮不能因为结束时改topic而误算成200。

### 9.4 requested 与 actual、终局优先级

A INT100、B INT1，A attack=`100+trunc(3960/31)=227`。大喝jitter4的 requestedDamage=`trunc(231*10*15*12/1000)=415`。连续三击的B HP为585/170/−100；第三击实际HP差−270，不是−415。第三击终局，不补牌、不更新崩坏。

普通匹配large、同INT、jitter0连续五次，B HP800/600/400/200/0、stress20/40/60/80/100，第五击仍接受HP终局，说明终局优先于stress100。无论最后胜牌是普通牌或大喝，first/topic均保持最后一轮开始值，不保证first等于最终winner。

如需让最后 winner 与保留 first 不同，可用同INT设计：A先赢五次大喝使B HP100/stress75；第六轮B用当前story/small胜A的logic/small，使first=B；第七轮A大喝击败B。最后first仍B、winner为A、topic仍story。两人牌带至少12项才足前六轮非终局补牌；该设计同样未运行。

### 9.5 牌带边界

两方牌带都仅够初始容量，第一次非终局大喝胜、普通胜或平局都会因缺下一轮补牌而 `deck-exhausted`，不是成功后留下空槽。若当前已有可验证中局且本轮形成HP终局，同样耗尽的牌带不阻止最后一击。

## 10. 未执行与保留事项

本批仅静态读源码、编辑代码和文档。没有运行测试、typecheck、编译、build、checker、validator、诊断、产品或样例；未改旧测试，不能引用历史通过数字认证本树。手工推导只说明合同，不是行为已经运行验证。

下一步仍需分别补证并独立定版本：其他四话术的攻击/附加效果/无视阻断/诡辩反射与topic重随机；四性格愤激/反制/连打/timer；再考与真实牌组/分布；人物书籍例外；开场/追击/留情/结果层；原生PC、Vanilla、主机与campaign整链。大喝这一个子集的闭合，不是这些未决项的默认实现。
