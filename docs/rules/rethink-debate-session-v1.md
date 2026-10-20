# 普通话题牌 + 五话术 + 再考独立舌战 session v1

日期：2026-10-20。实现：[rethink-debate.ts](../../packages/engine/src/rethink-debate.ts) · [完整 API、DTO 与错误](../engine/rethink-debate-session-v1.md) · [完整政策与固定来源](../sources/rethink-debate-session-v1.json) · [纸面场景，未运行](../../data/scenarios/rethink-debate-example-v1.json)。

本页在独立的新 profile 中接纳正常、非教程、无愤激状态的**出牌前再考**：清空该方整副可出手牌，沿提供式牌带补满，再选择一张最终普通牌或话术牌参加本轮比较。再考不是第七种战斗牌，不比较 power，不直接造成 HP/stress 变化，也不替代本轮最终出牌。

## 1. 固定身份与支持边界

- profile：`debate-topic-shout-ignore-compose-agitate-sophistry-rethink-reference-v1`。
- session tag：`rethink-debate-session-v1`。
- 唯一命令：`ResolveRethinkDebateRound`。
- 常量：`RETHINK_DEBATE_POLICY_V1`、`RETHINK_DEBATE_EVIDENCE_V1`。
- 公开类型族：`RethinkDebate*V1`；七个公开函数为 create、inspect、previewRound、executeRound、save、load、replay 的 RethinkDebate 变体，完整名称见 API。

两名 source-normal 通用参与者从 HP1000、stress0、angerTimer0、canRethink=true 开始。最终战斗牌仍只有 topic、shout、ignore、compose、agitate、sophistry 六种 kind。新模块独立保存再考许可、弃牌/替换牌审计、牌带游标和最终选牌；原有普通、大喝、无视、镇静、激昂、诡辩六种 profile、源码、卡牌 DTO、保存格式均不改写、不自动迁移。

本 profile 不接纳任意中局注入。中局 HP、stress、崩坏层、手牌、canRethink 必须由自身 genesis 和历史重算。仍不支持教程、四性格愤激、冷静愤激的再考恢复/大牌覆写、自动镇静或激昂反制及额外卡牌消费、连打与兴奋 timer、真实人物/书籍/MOD hook、原作 DeckGenerate/洗牌/概率、显示排序、开场一击决胜、追击/留情/负伤。

不接 campaign、training GameState、外交自动结算、部队/城市/势力/奖励、P078/native 人员任务及其依赖、俘虏/处斩/归属、return/mission 链。通用 ID 不映射武将；完成仅返回 session outcome。

## 2. 固定来源与证据层级

现代参考仓库为 `tankyc/sango_infinity`，三个文件固定在 commit `a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef`。本批沿用已记录的源字节身份并静态重读，不把本地文本阅读说成重新获取或执行源码。

| 文件 | blob | 字节数 | SHA-256 |
|---|---|---:|---|
| [Debate.cs](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs) | `0137498d10773cd4596d497083ccdf6a26b3a261` | 71288 | `622789ca8b8b6799a321526dcfb513d6622adf5b5d54025175c2a7795ef7da28` |
| [DebatePhase.cs](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/DebatePhase.cs) | `6aa98f855a5d4d172cde7e8ffc18a141b8a7b587` | 14048 | `5b47f7b6a89d6123a23e7c14f22168e59c9edd549e98d9bc0258d8a55bb9cbf3` |
| [DebateEnum.cs](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/DebateEnum.cs) | `5b46a8ac87613193eb9f4b99a25e489ba6f5e483` | 8447 | `cd71efed5059fb4ca876091b1e39bd34636fb978c8ec9bfbf924d6a443070bc1` |

### 2.1 再考新增的逐段归因

| 固定位置 | 可支持的陈述及不能外推的部分 |
|---|---|
| [Debate.cs 289–298](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L289-L298) | 现代 `CanRethink` 公开布尔许可供表现层读取；注释明确提到原 C++ 玩家侧漏判断。此现代 UI guard 不能证明原作玩家侧始终具有相同强制限制 |
| [343–354](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L343-L354) | INT 阈值70/80/90对应总槽4/5/6/7 |
| [406–438](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L406-L438) | 保留再考槽、补空位、牌组耗尽后生成、至少一张普通话题牌的随机修补、最后排序。新 profile 只采用容量与补空位语义，牌带/稳定顺序/拒绝修补均为工程政策 |
| [491–509](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L491-L509) | CharacterRethink 清空全部槽再调用填牌；冷静愤激的40%大牌覆写和排序不在本 profile 内 |
| [934–970](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L934-L970) | 无愤激限定下，再考可用性读取 canRethink；不据此支持其他性格或 timer 分支 |
| [991–999](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L991-L999) | PlayCard 记录并移除所选牌；新 API 只将最终战斗牌记录为 play，不模拟物理再考槽的暂时移除 |
| [1046–1078](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L1046-L1078) | TurnStart 在 crumbled 时恢复再考；冷静愤激也能恢复，但被排除。非教程补牌后清除 crumbled 标志；不是所有回合都恢复 canRethink |
| [1254–1263](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L1254-L1263) | Rethink 调用全手重抽后把 canRethink 设 false，再通知现代表现层 |
| [1520–1531](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L1520-L1531) | `clamp((1000-hp)/250,0,3)` 与原层比较；层发生变化才标记 crumbled，不是“每受一次伤害” |
| [1553–1560](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L1553-L1560) | 初始层0、crumbled=false、canRethink=true；挑战方先出牌 |
| [DebatePhase.cs 172–253](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/DebatePhase.cs#L172-L253) | first 一方先选牌；如选再考则重抽、清除 playedCard 并回到该方选牌；随后另一方同样处理，最终才进 Damage。双人一次提交与有限请求数组不是原生交互阶段 |
| [DebateEnum.cs 33–61](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/DebateEnum.cs#L33-L61) | 现代 enum 将 Rethink0、九种普通牌和五话术分开；本工程没有把0号再考加入 combat kind |

既有六种最终牌的 power、伤害、反射、Effect、话题重抽和终局阶段逐段归因一并保留在来源账本。Topic 的 story0/logic1/trend2/Max3 来自[现代归纳枚举96–103](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/DebateEnum.cs#L96-L103)，不是独立取得的原始头文件或二进制证据。

这里新增现代参考覆盖，不发现新的原始公式，不认证 PC-PK/PK1.1、Vanilla 或主机二进制。`nativeEquivalent:false`、`stockOriginalVerified:false`、`pkEquivalent:false`、`vanillaEquivalent:false`、`completeDebate:false`。既有 E15 证据只属于普通通用核心，不扩张为再考许可/UI 修补、完整话术、原生随机或整条舌战链证明。原43证据主题／45历史快照保持开放且数量不变。

## 3. 卡牌、手牌与每次填牌的接纳边界

scenario 完整字段见 API；必须携带完整固定政策，明确 genericOnly=true、difficulty=source-normal、非教程。initialTopic 由调用者提供为 story/logic/trend，两名参与者顺序固定。participant 仅接受 `id,resolvedIntelligence,hp:1000,stress:0,angerTimer:0,cardTape`。ID 唯一且为 ASCII `[A-Za-z][A-Za-z0-9_-]{0,63}`；INT 为1..100安全整数；每方牌带最多512项。不从真实人物或装备解析能力。

牌模板只有以下封闭六种：

```ts
{ kind: 'topic', topic: 'story' | 'logic' | 'trend', level: 'small' | 'medium' | 'large' }
{ kind: 'shout' }
{ kind: 'ignore' }
{ kind: 'compose' }
{ kind: 'agitate' }
{ kind: 'sophistry' }
```

`{kind:'rethink'}` 不是合法模板。五话术不得带 topic/level；未知字段、缺少必需键或非法值按严格 DTO 拒绝。

| INT | sourceSlotCount | playableHandCapacity |
|---|---:|---:|
| 1..69 | 4 | 3 |
| 70..79 | 5 | 4 |
| 80..89 | 6 | 5 |
| 90..100 | 7 | 6 |

`reservedRethinkSlot:true` 说明来源总槽减一的容量；它不在 hand 中生成再考 occurrence，也不消耗牌带的一项。六种最终牌共享 playableHandCapacity。每张 occurrence 都有 `token=id:tapeIndex` 和从0开始的 tapeIndex；重复模板仍是不同牌。牌带顺序固定，保留牌次序稳定，不实施显示排序。

**每次实际填牌后，完整手牌必须至少有一张普通 topic。** 适用于初始发牌、再考全手替换和非终局补空位。固定现代参考 CharacterFillCards 会在没有 topic 时对最后新增槽调用 `RandInt(9)` 修补；本 profile 不采样、不替换成虚构 topic，也不悄悄容忍缺失，统一以 `unsupported-topic-repair` 拒绝。这是明确的工程接纳边界，不声称已经实现原作“保证普通牌”的随机算法。

牌带不够完成本次填牌时为 `deck-exhausted`，不自动再生或循环。先必须能完成填牌，才判断其 topic 保证；不能把不足的部分手牌当作已填满后修补。

最终出牌后未填牌的中间手牌可以暂时只有话术。HP 终局不会补牌，所以终局剩余手牌也允许全话术；不能把“每次填牌后有 topic”误写成“所有阶段始终有 topic”。非终局则必须在本轮末折叠的下一 TurnStart 补满并重新检查。

## 4. 再考许可、请求与来源顺序

`canRethink` 是每方独立且持久的布尔状态：

1. 初局 true。
2. 被请求且实际重抽后 false；不是每轮自动恢复。
3. 非终局本轮的崩坏层发生变化时，在折叠的下一 TurnStart 恢复 true。未变层保持原值；仅“HP下降”不够。
4. HP 终局跳过后续崩坏/TurnStart，不因终局伤害越层恢复。
5. 愤激冷静的额外恢复、40%大牌覆写、连续再考和其他性格行为不接纳。

每个命令必须提供 `rethinks:string[]`。空数组表示不再考；至多两个 ID，必须各自属于 scenario 且唯一。请求数组的输入顺序不规定处理顺序。重复为 `duplicate-rethink-participant`，无此参与者为 `invalid-rethink-participant`，请求者当前许可 false 为 `rethink-unavailable`；不是数组或超过两项为 `malformed-data`。

外层结构与请求合法性检查后，先检查所有请求者当前许可，避免先重抽某方再发现另一方不可用。随后私有候选状态按照来源 first/other 顺序处理：

1. first 方若请求再考，弃掉其全部当前 playable hand，从牌带的当前 cursor 连续取满容量，检查 topic 保证，把许可置 false。
2. 在 first 方**完成可选重抽后的** hand 中找其最终 choice token，并立即移除该最终牌。
3. other 方若请求再考，同样全弃、全补、检查并清许可。
4. 在 other 方完成可选重抽后的 hand 中找其最终 choice token，并移除，再进入 combat。

没有再考的方从原 hand 选择。再考方不能继续选已弃掉的旧 token、未发项或对方 token。choices 仍必须按 scenario 参与者顺序排列，而不是 first 顺序；内部执行依 first 处理。这三种顺序不能混为一谈：命令/plays/changes 为 scenario 顺序，再考审计为实际 first→other 顺序，Effect 为胜者→败者顺序。

一次请求仅进行一次全手替换，不能传“选几张换几张”、模板替换、强制指定新手牌、延迟选择或回调。此 API 是原子双人命令，不持久保存源代码的 step0…9、隐藏信息、AI 决策或可中断 UI 状态。它采用现代可用性限制，不认证原始玩家侧漏判已被复刻或解决。

## 5. 最终牌的正常态结算保持独立

再考只改变本轮进入比较的 occurrence。最终六牌规则与这个新 profile 的固定政策一起保存，不调用旧 session 修改旧状态。

| 牌种 | power | Attack / Effect |
|---|---:|---|
| Ignore | 120 | 败方 stress+30，不减 HP，不取 jitter；阻断败方 Effect 与诡辩话题重抽 |
| Shout | 110 | 正常 HP 伤害，levelCoef15、topicCoef12，败方 stress+15 |
| Sophistry | 20 | 只反射败方普通牌的 HP/stress；计算用诡辩胜者 attack、普通牌败者的 topic/level 与轮开始话题 |
| topic | 不匹配1/2/3；匹配11/12/13 | 普通 HP 伤害；等级对应 levelCoef 与 stress10/15/20 |
| Compose / Agitate | 0 | 本牌集内不能胜；作为被调用的败方 Effect 才有镇静/激昂写入 |

任何等 power 平局只令双方 stress+15，effects=[]，不以 first、牌种或再考破同分。Compose 请求为 `-max(trunc(对手当前stress/2),30)`；对手出诡辩时写回自己，但请求仍基于对手而非反射目标。Agitate 固定请求+40，通常写自己，对手出诡辩时改写对手。Ignore 胜时败者 Effect 记为未调用，不能记录假想请求。

固定 attack 为 `100+trunc(40*(myINT-opponentINT)/(131-myINT))`。普通、大喝和诡辩反射普通牌的 HP 请求为 `trunc((attack+jitter)*10*levelCoef*topicCoef/1000)`，除法向零，内部精确 bigint；普通 topicCoef 匹配10、否则6。反射保留源码 HP 请求大于0的 writer guard，当前接纳范围内伤害为正。HP clamp −100..1000，每次 stress writer 独立 clamp0..100；请求量与实际变化分开记录。

顺序固定 Attack→胜者 Effect→败者 Effect→HP 胜负。平局不调用任何 Effect，Ignore 在胜者 Effect 后阻断败者。已经被 Attack 击至 HP<=0 的败方 Compose/Agitate 仍执行适用 Effect，不能提前结束省略。

## 6. 随机输入不因再考新增角色

所有抽样由命令提供，无全局 RNG、callback、seed 或原生 PRNG：

- Attack 需要时消费 `{role:'psychological-damage-jitter',bound:5,value:0..4}`。
- 通过 HP 与非终局 stress 边界后，符合诡辩条件才消费 `{role:'sophistry-topic-reroll',bound:3,value:0..2}`，映射 story/logic/trend。
- 两者都需要时严格 jitter 在前、话题 draw 在后；每轮最多两项。再考不增加一个伪造的抽样角色。

再考替换用提供式牌带，不表示原作重抽没有随机性。源码可能涉及 DeckGenerate、topic 保证 RandInt9 和愤激冷静 RandBool40；这些全部在本 profile 外，不能记作“已消耗0次原生 RNG”的原作断言。这里只保证工程 API 外部 RNG 消费为0。

非终局有有效 attacker 且任一最终牌为 Sophistry、其对面不是 Ignore，才话题重抽。诡辩输 Shout 仍会重抽；双诡辩平局不会；抽回当前话题仍消费一项。无重抽时，普通胜牌令 topic 跟随其话题，话术胜保持 topic，平局保持 topic/first；有胜者则非终局 first 改为胜者。

HP 终局跳过话题 draw，额外提交它为 `draw-shape`。非终局最终 stress>=100 则先返回 `unsupported-anger-trigger`，不为了未到达的后续话题阶段索取 draw。非法原始结构仍先拒绝；成功路径必须恰好消费全部提供项。

## 7. 原子阶段、终局与错误边界

命令还必须携带匹配 snapshot 的 expectedRevision、expectedRoundIndex、expectedFirstId，两个最终 choices 和 rawDraws。expected 计数为0..4096安全整数。完整 DTO 和错误枚举见 API。

1. 安全分离外部输入，从 genesis 与所有历史重算，核对固定 policy/evidence、当前 active 状态、expected 值及命令结构。
2. 检查再考请求者与全部许可；按 §4 的 first→other 顺序在私有副本进行可选全手重抽、最终选择和移除。
3. 按轮开始 topic 比较最终牌 power，分阶段取必要 draw，执行 Attack 与所有适用 Effect。
4. 再判 HP。HP<=0 则形成 finished 候选，最终成功时 revision/roundIndex各+1，保留轮开始 first/topic 与原崩坏层，不补牌、不重抽话题、不恢复再考。已经完成的本轮再考与最终消费仍属于终局 receipt，但仍须通过后面的额外 draw 与预算检查。
5. 无 HP 终局而任一最终 stress>=100，以 `unsupported-anger-trigger` 整轮拒绝。不 cap99、清零、跳过愤激或自动消费反制牌。
6. 非终局重算 `clamp(trunc((1000-hp)/250),0,3)`，按规则处理 first/topic 与必要话题 draw。
7. 所有分支先核对 draw 已全部消费。只在非终局，下一 TurnStart 被折叠到本命令末尾：变层者恢复再考许可，再按牌带补空位、检查 topic 保证。
8. 核对完整拟议 session 预算，再提交深冻结新 session/receipt。

`deck-exhausted` 或 `unsupported-topic-repair` 可能发生在 combat 之前的再考替换，也可能发生在非终局 combat 之后的补牌。前者不能借“本轮本来会打死对手”绕过，因为源顺序尚未到 combat；后者在 HP 终局路径不发生，因为没有填牌。

所有失败均返回 `{ok:false,reason,index}`，不返回部分 session 或失败 receipt。任何一方重抽/选牌失败、后来伤害阶段的 draw 错误、stress100、非终局补牌失败或预算失败，都回滚整轮的弃牌、替换、canRethink、最终消费、HP/stress、cursor、层、topic、first、计数和日志。调用者输入不修改，不能把前半方再考当作已提交。

## 8. 回执、保存与严格边界

`receipt.rethinks` 只包含实际请求并成功重抽的参与者，按 first→other 排序，sequence 是此紧凑审计数组的0-based索引：只有后手请求时仍为0，不是其队伍索引。每条保存 participantId、完整 discardedCards、完整 replacementCards、before/afterDeckCursor、beforeCanRethink:true、afterCanRethink:false。replacementCards 是**最终牌移除前**的完整新手牌，因此可包含该方本轮 consumedCard；这不是重复消费。

`change.beforeCanRethink/afterCanRethink` 是整轮前后状态，可能出现再考审计 after=false、同轮末 change.after=true，因为非终局伤害恰好改变崩坏层。change 的 cursor 跨越整轮重抽与后续补牌，rethinks 的 cursor 只覆盖全手替换；refilledCards 只记录轮末空位补牌，不把 replacementCards 重记为 refill。没有再考者也有 change 前后许可。

每方 `change.rethinkRefreshReason` 严格为以下之一：

- `crumble-level-changed`：非终局崩坏层发生变化，在折叠的下一 TurnStart 恢复 true，即使本来就是 true 仍记录此原因。
- `no-crumble-change`：非终局层未变，保留出牌前流程处理后的许可，不自动补回。
- `terminal-no-next-turn`：HP 终局没有下一 TurnStart，不计算新崩坏层，不恢复许可。

session envelope 保留完整 policy、evidence、genesis、snapshot、entries；每条 entry 为 command 与 receipt。inspect、preview、execute、save、load 都重新建立 genesis 并逐条重算/比对完整 receipt 和最终 snapshot，包含再考请求、弃换牌、游标、许可、反射、分阶段随机和跳过理由。篡改后自称成功的 history 不被信任。

save 为键排序、数组保序的 canonical JSON；load 可接受等价键序，不接受旧 profile/tag/command 或隐式升级。存档没有签名/加密，只证明内部一致性，不认证外部真实对局或作者。

上限为4096条 entries、每方512牌、完整 canonical session UTF-8 16MiB、1,000,000值节点、深度32；policy/evidence、再考完整弃换牌审计和 receipt 都计入预算。preview 走同一拟议 append 预算，不修改输入或提交日志。remainingEntryCapacity 只是条数余量，不保证其他资源够用；容量耗尽拒绝，不是游戏平局。

拒绝 Proxy、accessor、函数、undefined、外部 BigInt、Symbol、自定义原型、循环、稀疏数组、额外数组属性、非法整数和−0。Node 安全 Proxy 探测入口缺失为 `unsupported-runtime`，不降级。运行兼容性本批未验证。

## 9. 纸面边界与本批交付口径

独立[纸面场景](../../data/scenarios/rethink-debate-example-v1.json)只用于手工推导，**不是运行 receipt、测试断言、实际保存或 replay 结果**。中局示例必须由合法 genesis 和历史到达。

### 9.1 五轮接受与第六轮独立拒绝

双方 INT60、attack100、容量3，initialTopic=story、初始 first=beta；两方牌带0..2均为 story-small。其余有限牌带如下，表中 small/large 均为 story 普通牌：

| tapeIndex | alpha | beta |
|---:|---|---|
| 3 | large | small |
| 4 | large | small |
| 5 | small | large |
| 6 | small | large |
| 7 | compose | large |
| 8 | small | large |
| 9 | small | large |
| 10 | compose | small |
| 11 | small | small |
| 12 | small | small |
| 13 | small | small |

每轮 rawDraws 只有 jitter0，无话题 draw；currentTopic 始终 story。下表 HP、stress、cursor、canRethink、崩坏层均按 alpha/beta 排列，数字选牌是各方 token 的 tapeIndex：

| 轮 | rethinks 请求 | 最终 alpha/beta | 轮后 HP | stress | cursor | canRethink | 崩坏层 | first |
|---|---|---|---|---|---|---|---|---|
| 1 | alpha,beta | 3 large / 3 small | 1000,800 | 0,20 | 7,7 | false,false | 0,0 | alpha |
| 2 | 空 | 4 large / 4 small | 1000,600 | 0,40 | 8,8 | false,true | 0,1 | alpha |
| 3 | beta | 5 small / 8 large | 800,600 | 20,40 | 9,12 | false,false | 0,1 | beta |
| 4 | 空 | 6 small / 9 large | 600,600 | 40,40 | 10,13 | true,false | 1,1 | beta |
| 5 | alpha | 10 compose / 10 small | 500,600 | 50,10 | 14,14 | true,false | 2,1 | beta |

第1轮请求顺序 alpha,beta，但 first=beta，审计为 beta(sequence0) 再 alpha(sequence1)。双方弃0/1/2，替换3/4/5并选3，轮末各补6；初始→替换 cursor3→6，整轮3→7。

第2轮 beta600跨到崩坏层1，仅 beta恢复；alpha仍false。第3轮只有 beta请求，审计sequence0：弃5/6/7，替换8/9/10，选8后轮末补11；beta action-local cursor8→11、整轮8→12。alpha受伤到800但层仍0，不恢复。

第4轮 alpha600跨层1，恢复 true。第5轮 first=beta，beta先从当前手牌选10并移除；随后 alpha弃7/8/9，换10/11/12、选10镇静，轮末各补13。beta的small先使 alpha600→500、stress40→50；alpha的镇静依据 beta40 请求−30，使 beta40→10。alpha 同轮再考审计 true→false，但 HP500又跨层1→2，最终 change 为 true→true、`rethinkRefreshReason='crumble-level-changed'`，不能把这误判成未使用再考。

已接受 commands 仅为这五轮。独立拟议第6轮请求 beta再考时，beta仍false，先以 `rethink-unavailable` 拒绝；即使牌带此时恰好耗尽，也不能误报先发生 `deck-exhausted`。保留第5轮 revision/roundIndex、HP500/600、stress50/10、cursor14/14、许可true/false、first=beta、story、手牌与日志。不得把这条拒绝设计放入“成功 replay”的 commands 数组。

### 9.2 额外边界

需要区分的边界包括：

- 再考许可初始为 true，使用后保持 false；下一普通回合不能自动重用。
- 真实变层在非终局末恢复许可；终局越层不恢复。
- first 与 scenario 顺序相反、双方请求数组次序相反时，仍按 first 完成重抽及最终消费，再处理 other。
- 被弃掉的旧 token 失效，完整 replacementCards 包含稍后消费的最终牌；新牌带索引不重复或回退。
- 初始、再考替换和非终局 refill 缺 topic 均拒绝；终局移除最后 topic 后的全话术剩余手牌合法。
- 一方已完成候选重抽，另一方 token/填牌或后续随机/stress/预算出错，仍无部分提交。
- 再考不是 combat card，不能传 `{kind:'rethink'}`、选择虚构再考 token 或为它追加 rawDraw。

### 9.3 本批口径

基线为 PR #109 已交付的 main `60f50e151118637de8a9aed62810afcf90d925c5`。本批新增独立实现、规则/API、来源账本与纸面场景；旧六种 profile 与存档保持原状。发布、合并、CI 状态只能以实际仓库记录为准，本页不虚构结果。

按用户要求，本批只有静态源文阅读、文本修改与人工审阅：未运行测试、typecheck、编译、构建、项目 validator/checker、诊断、示例、replay 或产品。源字节身份不是项目执行或验证；纸面数值不是运行结果。旧测试、历史 default-food 失败、43/45证据边界与 P078 排除均未被覆盖、减少或清零。
