# 普通话题牌 + 五话术独立舌战 session v1：诡辩与反射

日期：2026-10-20。实现：[sophistry-debate.ts](../../packages/engine/src/sophistry-debate.ts) · [完整 API、DTO 与错误](../engine/sophistry-debate-session-v1.md) · [完整政策与固定来源](../sources/sophistry-debate-session-v1.json) · [纸面场景，未运行](../../data/scenarios/sophistry-debate-example-v1.json)。

本页新增独立、有界的现代参考子集：九种普通话题模板加大喝、无视、镇静、激昂、诡辩，共六种 card kind。诡辩 power20，胜普通牌时以**诡辩胜者的 attack、败方普通牌的等级与话题、轮开始 currentTopic**计算反射伤害，伤害写给普通牌出牌者。它也反射镇静与激昂的写入目标，并在符合条件的非终局回合末重抽话题。**本 profile 明确只接纳正常、非教程模式**；不能把源码的教程门槛当作不存在。

## 1. 固定身份与支持边界

- profile：`debate-topic-shout-ignore-compose-agitate-sophistry-reference-v1`。
- session tag：`sophistry-debate-session-v1`。
- 唯一命令：`ResolveSophistryDebateRound`。
- 常量：`SOPHISTRY_DEBATE_POLICY_V1`、`SOPHISTRY_DEBATE_EVIDENCE_V1`。
- 公开类型：`SophistryDebate*V1`。

两名 source-normal 通用参与者从 HP1000、stress0、angerTimer0 开始。支持提供式牌带、token 出牌与消费、补牌、整数伤害、分阶段 stress、Effect/反射审计、分阶段原始随机输入、HP 胜负和逐条重算保存。新牌、新随机协议和新回执只进入这个 profile；既有普通、大喝、无视、镇静、激昂五种 profile、卡牌 DTO、源码与存档均不修改、不自动迁移。

仍不支持教程模式、再考、四性格愤激、自动镇静/激昂反制及额外卡牌消费、连打或兴奋 timer、真实人物/书籍/MOD hook、原作 DeckGenerate/洗牌/概率、开场一击决胜、追击/留情/负伤。主动镇静、主动激昂和反射不等于已经实现愤激状态机或持牌自动反制。

不接 campaign、training GameState、外交自动结算、部队/城市/势力/奖励、P078/native 人员任务及其依赖、俘虏/处斩/归属、return/mission 链。通用 ID 不映射武将；完成只返回 session outcome。

完成 Attack 与 Effect 后，若尚无 HP 终局而任一 stress 达到100，仍以 `unsupported-anger-trigger` 整轮拒绝。不能 cap99、清零、跳过愤激或自动消费别的牌绕过。反射激昂可能使诡辩胜者触及该边界，胜出不保证该轮可以提交。

## 2. 固定来源、范围与证据层级

现代参考仓库为 `tankyc/sango_infinity`，三个文件均固定在 commit `a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef`：

| 文件 | blob | 字节数 | SHA-256 |
|---|---|---:|---|
| [Debate.cs](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs) | `0137498d10773cd4596d497083ccdf6a26b3a261` | 71288 | `622789ca8b8b6799a321526dcfb513d6622adf5b5d54025175c2a7795ef7da28` |
| [DebatePhase.cs](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/DebatePhase.cs) | `6aa98f855a5d4d172cde7e8ffc18a141b8a7b587` | 14048 | `5b47f7b6a89d6123a23e7c14f22168e59c9edd549e98d9bc0258d8a55bb9cbf3` |
| [DebateEnum.cs](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/DebateEnum.cs) | `5b46a8ac87613193eb9f4b99a25e489ba6f5e483` | 8447 | `cd71efed5059fb4ca876091b1e39bd34636fb978c8ec9bfbf924d6a443070bc1` |

前两文件身份沿用固定源记录；本批静态重读。新增枚举文件按同一固定 commit 获取。字节身份记录不是执行结果，也不是原生版本认证。

| 固定位置 | 本子集采用或保留的语义 |
|---|---|
| [Debate.cs 343–354、413–438](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L343-L438) | 按 INT 的总槽位、保留再考槽和补空位；本引擎仍使用提供式有序牌带，不复刻生成或显示排序 |
| [513–534、554–570](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L513-L570) | HP/stress writer、初始 attack/stress/timer；人物 hook 排除 |
| [908–926、934–988](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L908-L988) | Ignore120、Shout110、Sophistry20、普通1/2/3及匹配+10、Compose/Agitate0；可用性受愤激门槛影响 |
| [1083–1126](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L1083-L1126) | 有胜者才更新 first；普通胜牌先跟随 topic；非教程且任一诡辩面对的不是无视，才调用 `RandInt(Topic_Max)` |
| [1129–1236](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L1129-L1236) | power 比较、HP/stress 公式、平局各 stress15、大喝 writer |
| [1239–1251](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L1239-L1251) | TopicCard 的 reflected=true 将伤害写给该普通牌出牌者自己 |
| [1267–1297](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L1267-L1297) | 无视 stress writer；镇静反射到自己，激昂反射到对手 |
| [1423–1456](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L1423-L1456) | Sophistry 只对败方普通牌计算 HP/stress；计算者是胜者，card 来自败方；Compose/Agitate 没有 Attack jitter |
| [1459–1480](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L1459-L1480) | 镇静请求先按对方当前 stress 计算，再根据对方是否诡辩选择写入目标；激昂固定请求40 |
| [1567–1580](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L1567-L1580) | 平局不调用 Effect；胜者先、败者后；Ignore 提前返回，不调用败方 Effect |
| [DebatePhase.cs 394–420](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/DebatePhase.cs#L394-L420) | Attack → Effect → HP winner → Anger；不能提前判死而省略败方 Effect |
| [DebateEnum.cs 1–20、96–103](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/DebateEnum.cs#L96-L103) | 现代源码说明 Topic 枚举由实现归纳：story0、logic1、trend2、Max3；不是原始头文件/二进制枚举独立证明 |

这里扩大的是现代转录参考规则覆盖，不发现新公式，不认证原 PC-PK/PK1.1、Vanilla 或主机二进制。`nativeEquivalent:false`、`stockOriginalVerified:false`、`pkEquivalent:false`、`vanillaEquivalent:false`、`completeDebate:false`。既有 E15 标签只属于普通通用核心，不外推到诡辩、反射或话题随机。原43证据主题／45历史快照保持不变。

须分开理解三类内容：固定现代源码提供卡牌和阶段语义；提供式牌带、通用身份、初始话题、非教程限定、原子双人命令、原始抽样输入、严格保存和资源上限是明确的工程接纳政策；原生版本等价仍未证明。历史公共机制交叉链接不证明这批新增常数、完整链路或版本身份。

## 3. 输入、牌带与正常态约束

scenario 的完整字段与严格 DTO 见 [API](../engine/sophistry-debate-session-v1.md)。其身份为 schemaVersion1、新 profile、genericOnly=true、difficulty=source-normal，必须带完整 `SOPHISTRY_DEBATE_POLICY_V1`；policy 固定 `tutorial:false`、`tutorialPolicy:'non-tutorial-only'`，scenario 没有另一个可切换 tutorial 输入。initialTopic 显式为 story/logic/trend；两名 participants 固定顺序；challengerId 决定初始 first。

participant 只接受 `id,resolvedIntelligence,hp:1000,stress:0,angerTimer:0,cardTape`。ID 唯一，ASCII `[A-Za-z][A-Za-z0-9_-]{0,63}`；INT 为1..100安全整数，已经解析，不调用人物或物品 hook。每方牌带最多512项且够初始手牌。不接纳任意中局 HP/stress：中局必须由本 profile 的 genesis 和历史重算。

牌模板为封闭六选一：

```ts
{ kind: 'topic', topic: 'story' | 'logic' | 'trend', level: 'small' | 'medium' | 'large' }
{ kind: 'shout' }
{ kind: 'ignore' }
{ kind: 'compose' }
{ kind: 'agitate' }
{ kind: 'sophistry' }
```

五种特殊牌没有 topic/level。缺 kind、未知 kind、未支持话术和多余字段拒绝；旧 `{topic,level}` 不自动转换。

| INT | sourceSlotCount | playableHandCapacity |
|---|---:|---:|
| 1..69 | 4 | 3 |
| 70..79 | 5 | 4 |
| 80..89 | 6 | 5 |
| 90..100 | 7 | 6 |

六类牌共用容量，`reservedRethinkSlot:true` 不生成再考动作。hand occurrence 为模板加 `token,tapeIndex`，token=`id:tapeIndex`，索引从0起。初始发满；每轮消费所选两张，稳定保留其他牌，再从牌带补空位；deckCursor 指向下一未发项。相同模板仍是不同 occurrence。不会额外消费持有的镇静、激昂或其他反制牌。

## 4. power、反射 Attack 与普通算术

| 牌种 | power | 本子集内的胜负与 Attack |
|---|---:|---|
| Ignore | 120 | 除同牌平局外均胜；对败方 stress30，无 HP 伤害，阻断败方 Effect |
| Shout | 110 | 输 Ignore，平 Shout，胜其余；正常伤害及 stress15 |
| Sophistry | 20 | 输 Ignore/Shout，平 Sophistry，胜普通/Compose/Agitate；只反射普通牌的 HP/stress |
| topic | 非匹配1/2/3；匹配11/12/13 | 普通胜时正常伤害；输 Sophistry 时由诡辩方计算反射伤害 |
| Compose / Agitate | 0 | 本封闭牌集内不能胜；彼此或同牌均为平局 |

所有等 power 平局都仅令双方 stress15、HP不变，跳过全部 Effect 和话题重抽；不以 firstId、牌种名称或牌带顺序破平。

固定 attack：

`attack = 100 + trunc(40 * (myINT - opponentINT) / (131 - myINT))`

普通/大喝胜，以及 Sophistry 胜普通牌时：

`requestedHpDamage = trunc((attack+jitter) * 10 * levelCoef * topicCoef / 1000)`

普通 levelCoef=10/15/20，topicCoef 按**轮开始**话题匹配为10，否则6；大喝固定15/12。正常态 angerCoef10；jitter0..4。整数除法向零，内部精确 bigint，外部只有安全整数。power差不参与伤害。HP writer 为 `clamp(beforeHp-requestedHpDamage,-100,1000)`，stress writer 为 `clamp(beforeStress+requestedStress,0,100)`。

### 4.1 反射不等于用败方 attack

Sophistry 胜 topic 时：

1. 攻击系数来自 Sophistry 胜者自己的已解析 attack。
2. levelCoef、普通 topic 和 stress10/15/20 来自败方普通牌。
3. 匹配与否依据本轮开始 currentTopic，不使用稍后的随机话题。
4. 反射写入对象是普通牌出牌者，即败方；Sophistry 胜者不受该伤害。
5. 源码在 hpDamage>0 时调用反射 writer。本 profile 的 INT1..100 保证 attack>=70，jitter>=0，普通牌最小系数10/6，因此伤害>=42，guard 始终成立；仍保留并审计这个 guard，不能因此推论未接纳范围也无条件写入。

例如 INT80 的 A 出 Sophistry、INT60 的 B 出 story-large，初始 story、jitter0：A attack=115，B attack=89。反射采用115而非89，B 承受HP230、stress20，A不变。若随后话题抽样值2转为 trend，也不能回头把本轮匹配伤害改成138。

Sophistry 胜 Compose 或 Agitate 时，Attack 不调用 HP 公式、不调用 stress writer、不取 jitter，`damage:null`。它们仍是有胜者的回合，仍执行败方 Effect；不是平局或零系数伤害。非终局还需要话题重抽，故“没有 Attack draw”不代表整轮没有 draw。

### 4.2 普通、大喝、无视的既有分支

普通或 Shout 胜 Compose/Agitate 时，先执行正常受击，再执行败方对应 Effect。Ignore 胜任何牌只向败方请求 stress30，不调用 HP 公式，不取 jitter；胜者 Effect 无附加 writer，然后直接阻断败方 Effect。Ignore 胜 Sophistry 同时令话题重抽条件为假，不是先取随机数再丢弃。

## 5. 镇静/激昂反射与分阶段审计

### 5.1 镇静：请求依据与写入目标必须分开

镇静出牌者记为 actor，其对方记为 opponent。无论反射与否，请求都为：

`requestedComposeStress = -max(trunc(opponentCurrentStress / 2),30)`

读取的是 Effect 调用时对方的当前 stress。对方出 Sophistry 时 reflected=true，**写入目标改为 actor 自己，但请求依据仍是 opponent**；否则写入 opponent。不能把公式改成 targetCurrentStress，也不能在反射后重新按自己的 stress 计算。

纸面中局例：A 出 Compose，A stress45；B 出 Sophistry，B stress90。Attack 无伤害。镇静读取 B90，请求−45，反射写 A45→0；B保持90。若误按 A45计算，结果会是 A15，和源码不同。另一例 A5/B90，请求仍−45，A clamp 到0，实际−5；需求和实际变化不可混同。

没有反射时仍是镇静作用于对方，而非“给自己降怒”。普通/大喝胜后，败方镇静不会撤销自身已承受的 HP 或 Attack stress；它作用于胜者。Ignore 阻断时，请求未评估，不得填一个假想的−30或−45。

### 5.2 激昂：反射改变目标，不改变请求40

激昂恒请求+40。无反射时 target=actor自己；对方出 Sophistry 时 reflected=true，target=opponent，也就是诡辩胜者。

例如初局 A Sophistry、B Agitate：Attack 无 HP/stress 写入；B Effect 请求+40，反射写到 A0→40，B保持0。若合法中局 A65/B0，则 A被写65→100，实际+35；HP未结束时整轮 `unsupported-anger-trigger`，没有部分提交的反射或话题重抽。不能把+40写给 B、改成+35的请求、直接设置 angerTimer 或额外消费反制牌。

普通/大喝胜激昂仍为败方先受 Attack，再给自己+40；Ignore 胜则败方激昂不执行；平局也不执行。

### 5.3 Effect 调用顺序与审计

非平局有胜者、败者两个审计槽，顺序为 `winner-then-loser-audit-slots`，不是 scenario 顺序或 first 顺序。普通/大喝/无视/诡辩自身 Effect 没有附加 writer，标为 `no-additional-effect`、invoked=true、请求0。败方 Compose/Agitate 被调用时为 `applied`，即使 clamp 导致实际0也不改成未执行。

Ignore 胜者有无附加效果槽；败方槽 `suppressed-by-ignore`、invoked=false、requestedStress=null、实际0。没有 writer 或未调用的槽不伪造实际写入目标、反射、请求依据及 stress 快照，这些字段为null；不同于旧 profile 的审计目标写法。null 是未评估/无 writer，不是已请求0。平局 `effects:[]`、`effectOrder:'none-equal-card-power'`、`effectSkipReason:'equal-card-power'`；不得伪造两条 no-op。

每名 participant 的 `attackStress` 和 `effectStress` 各记录 before、requested、after 和 actual delta；顶层 requestedStress 为作用于该人的已评估阶段请求之和，actualStressDelta 为整轮 after−before。先按真实阶段逐次 clamp，再汇总；不能把请求相加后只 clamp 一次。反射后的 effectStress 必须按真实 target 归档，不是按 actor 归档。

Effect 审计保留反射与请求来源，damage 审计区分计算伤害的胜者、败方牌的拥有者和实际目标；完整字段见 API。**Effect 在 HP 终局检查前执行，没有“出牌者已 HP<=0 就跳过”的门槛。**

## 6. 话题重抽与两阶段随机协议

源码 TurnEnd 先要求有效 attacker，再经过 `!IsTutorial()`。本 profile 明确排除教程，在**非终局、不触发未支持愤激的已接受回合**中，只要任一出牌为 Sophistry，且它面对的不是 Ignore，就在回合末取一个 bound3 抽样：0→story、1→logic、2→trend。只取一次；抽回原话题完全合法，不保证“变化到不同话题”。

因此 Sophistry 胜普通/Compose/Agitate会重抽，**Sophistry 输给 Shout 也会重抽**；Ignore/Sophistry 不重抽，双 Sophistry 等 power 平局不重抽。普通胜者仍按普通胜牌跟随 topic；不含 Sophistry 的 Shout/Ignore 胜只改 first。任何 HP 终局保留轮开始 first/topic，跳过回合末 draw、崩坏和补牌。

原始输入不是一个无阶段的 value 列表。Attack jitter 的 role=`psychological-damage-jitter`、bound5、value0..4；话题 draw 的 role=`sophistry-topic-reroll`、bound3、value0..2。有两个 draw 时固定 Attack 在前、TurnEnd 在后，不接受交换、错 role/bound、多余值或缺值。整轮最多两项，阶段由 role 和消费位置确定。回执区分 `attackDrawCount`、`attackNoDrawReason`、`topicDrawCount` 与整轮 `drawCount`，并保留 `topicReroll`，不能用 Attack 的 no-draw reason 推断总 draw 数为0。

`attackNoDrawReason` 为 `equal-card-power`、`ignore-no-hp-damage`、`sophistry-opponent-not-topic` 或null。`topicReroll` 被应用时记 drawIndex、rawValue、beforeTopic、afterTopic、sophistryOwnerId 和 opponentId；跳过时 reason 为 `terminal`、`equal-card-power`、`no-sophistry` 或 `opponent-ignore`。同话题抽样仍是 applied，topicDrawCount=1；终局先于其余跳过理由。这里没有旧 profile 的整轮 `noDrawReason` 字段。

| 已接受分支 | Attack jitter | 话题 draw | 总数 |
|---|---:|---:|---:|
| 普通/Shout 胜，且本轮无 Sophistry | 1 | 0 | 1 |
| 非终局 Sophistry 胜普通牌 | 1 | 1 | 2 |
| 非终局 Shout 胜 Sophistry | 1 | 1 | 2 |
| 非终局 Sophistry 胜 Compose/Agitate | 0 | 1 | 1 |
| Ignore 胜，含 Sophistry | 0 | 0 | 0 |
| 任意等 power 平局，含双 Sophistry | 0 | 0 | 0 |
| HP 终局，含反射普通牌或 Shout 胜 Sophistry | 1 | 0 | 1 |

HP 终局只可能来自有 HP 伤害的分支。无 HP 终局且最终 stress100 的拟议回合拒绝，不消费一个虚构的 TurnEnd draw。合法结构的空 rawDraws 在 Sophistry/Agitate 将 stress 推到100时，先返回 `unsupported-anger-trigger`，不是因缺失尚未到达阶段的话题抽样而返回 draw-shape；原始结构、非法条目和多余/错序值仍按严格 API 阶段检查。

## 7. 原子命令、保存与资源边界

命令严格为 `ResolveSophistryDebateRound`，携带 expectedRevision、expectedRoundIndex、expectedFirstId、两个 choices 与 phased rawDraws。expected 计数为0..4096安全整数并匹配 snapshot，first亦须匹配。choices 按 scenario 顺序选择各自当前 hand token，不能按 first 重排或传模板替代 token。

执行顺序：

1. 安全分离外部输入，从 genesis 和全部历史重算；检查结构、active、expected值和当前 hand。
2. 以轮开始 topic 算 power；在私有副本消费双方各一张牌，按 Attack 分支校验并取必要 jitter，执行 HP/stress 写入。
3. 完成全部适用 Effect：胜者先、败者后；Ignore 阻断败方；平局跳过全部；保留实际目标、请求依据、反射与阶段 clamp。
4. **再判 HP。** HP<=0 提交 finished，revision/roundIndex各+1；保留轮开始 first/topic和崩坏层，不补牌，不重抽话题。stress100和补牌不足不阻止 HP 终局。
5. 无 HP 终局且任一 stress>=100，`unsupported-anger-trigger` 整轮拒绝：Attack、Effect、消费、cursor、计数和日志全回滚；不进入 TurnEnd。
6. 非终局重算崩坏层 `clamp(trunc((1000-hp)/250),0,3)`；有胜者更新 first，普通胜者跟随 topic；再按 Sophistry 条件校验和应用回合末 bound3 draw。
7. 按牌带补空位；不足为 `deck-exhausted` 整轮拒绝。检查完整拟议 session 预算后，提交深冻结新 session/receipt，不修改输入。

first 仅提供 `orderedIds:[first,other]` 的记录顺序，无伤害加成；plays/changes/choices 为 scenario 顺序，effects 为胜者/败者顺序。preview 走同一 append 与预算路径，不提交日志、不消耗外部 RNG。原子双人选择、提供式牌带和 rawDraws 是工程政策，不宣称复刻 AI、UI、私密出牌、原生 RNG 或半回合状态。

session envelope 为 `tag,policy,evidence,genesis,snapshot,entries`；genesis 包含完整 scenario 和重建初局，entry包含 command 与 receipt。inspect/execute/preview/save/load 均重建 genesis、逐条重算并比对 receipt 全字段，再比对最终 snapshot；反射来源、目标、请求依据、随机阶段/数量、话题变化和跳过原因同样不信任外部填写。

save 输出键排序、数组保序的 canonical JSON；load 接受等价键序，不接受旧 profile/tag/command 或隐式迁移。存档不签名、不加密，只证明内部一致性，不认证外部真实牌局或作者。

共同上限：4096条 entries、每方512牌、完整 canonical session UTF-8 16MiB、1,000,000值节点、深度32。policy/evidence及每条 receipt 全部计入；preview同预算。remainingEntryCapacity 仅为条数余量，不保证牌带/字节/节点足够。预算耗尽是拒绝，不是平局。

失败统一 `{ok:false,reason,index}`，不返回部分 session。replay场景/外层列表错误 index=−1，命令错误为0-based index；历史错误定位 entry，新命令错误通常null。拒绝 Proxy、accessor、函数、undefined、外部 BigInt、Symbol、custom prototype、循环、稀疏 array、额外 array 属性、非法整数和−0。Node安全 Proxy探测入口缺失为 `unsupported-runtime`，不降级。本批未运行，不能声称运行时兼容性已验证。

## 8. 纸面边界与未运行说明

下列为静态手工推导，**不是测试断言、执行 receipt、存档或 replay 结果**。中局前提必须由合法 genesis 历史达到，不能直接作为 scenario 导入；完整纸面场景见独立文件。

### 8.1 七轮接受，第八轮独立拒绝

INT60/60、attack100/100、容量3；初始 story、first=beta；提供足够牌带。下表的“topic值”是 bound3 draw，不是 jitter；表内 jitter 均为0。

| 轮 | alpha / beta | rawDraws阶段 | 轮后 HP（alpha,beta） | 轮后 stress | first / topic |
|---|---|---|---|---|---|
| 1 | Agitate / story-small | jitter | 900,1000 | 50,0 | beta / story |
| 2 | Sophistry / Compose | topic值1 | 900,1000 | 50,0 | alpha / logic |
| 3 | Sophistry / Agitate | topic值2 | 900,1000 | 90,0 | alpha / trend |
| 4 | trend-small / Compose | jitter | 900,900 | 45,10 | alpha / trend |
| 5 | Sophistry / Shout | jitter、topic值0 | 720,900 | 60,10 | beta / story |
| 6 | Sophistry / story-large | jitter、topic值0 | 720,700 | 60,30 | alpha / story |
| 7 | Sophistry / Ignore | 空 | 720,700 | 90,30 | beta / story |

第2轮镇静的 requestBasis=alpha50，请求−30但反射写 beta0→0；这是 applied，实际0，不是未调用。第3轮激昂+40反射到 alpha。第4轮 beta先受击到stress10，再按 alpha90请求−45并写 alpha90→45。第5轮败方诡辩仍触发话题重抽。第6轮抽回原 story仍消耗第二项 draw。第7轮无视同时阻断败方 Effect与诡辩话题重抽。

独立的拟议第8轮 alpha Sophistry、beta Agitate，rawDraws=[]：Attack没有writer；beta激昂请求40反射写 alpha90→100，实际+10。HP未结束，故 `unsupported-anger-trigger` 在索取话题 draw 之前发生。保留第7轮revision/roundIndex、HP720/700、stress90/30、first=beta、story、手牌、cursor及日志；不返回部分反射receipt。示例的已接受commands只包含前七轮，第八轮独立列为拒绝设计，不能把它混进“成功replay”数组。

### 8.2 额外可达边界

1. 同 INT、story-small 对 Sophistry、jitter0：普通牌方 HP900/stress10，诡辩方不变；非终局还需话题 draw。topic值0可保留story，仍是applied。
2. INT100的A出Sophistry，INT50的B出logic-large，初始story、jitter0、topic值1：A attack164，B attack76；反射用A164与B的非匹配大牌系数20/6，伤害196，B HP804/stress20。不能误用B76得到91，也不能先转logic后按匹配计算328。damage的sourceId=A、cardOwnerId=B、targetId=B。
3. 可从初局到达镇静请求依据与目标不同的状态：先双Sophistry平局，双方stress15；再两轮B Ignore胜A普通牌，A依次45、75，B保持15；接着A Sophistry胜B Compose。镇静依据A75请求−37，反射写B15→0，实际−15，A保持75。最后一轮只有话题draw，前面三轮均无draw；需提供足够牌带。若错按目标B15计算就会请求−30，虽然同样clamp到0，回执请求仍是错误的。
4. 初局Sophistry对Agitate使诡辩方stress40；第二次同配对达80；第三次拟议达100时整轮拒绝，实际clamp增量20也不能改写固定请求40。前两轮各有话题draw，第三轮在话题阶段前拒绝。
5. 同 INT初局Shout对Sophistry、jitter0：诡辩方HP820/stress15；非终局还须话题draw。Ignore对Sophistry只令败方stress30，无任何draw；双Sophistry各stress15、effects=[]，无draw且first/topic保持。
6. 可从初局到达反射终局：A INT100、B INT1，A attack227；三轮A Sophistry对B story-large，jitter0，前两轮topic值0。B每轮请求HP伤害454，HP依次546、92、−100，stress20、40、60。第三轮只接受jitter，跳过话题draw、崩坏和补牌，first/topic保留轮开始值；多带topicdraw为draw-shape。HP请求454与最后一轮实际−192须分别记录。
7. 普通/Shout一击令败方Compose/Agitate HP<=0时，败方Effect仍执行；其写入或clamp到100保留在终局receipt。不存在actor-alive guard，也不能把同样stress100的非终局拒绝规则提前用于终局。

## 9. 本批交付口径

基线为 PR #108 已交付的 main `cc4d11f2fe9fee497eba00f17a62c981cd051270`。新增独立实现、规则/API、来源账本与纸面场景；旧五种 profile 和存档保持原状。是否发布以仓库实际记录为准，本页不虚构提交、合并或CI结果。

遵循用户要求，本批只有静态源文阅读、文本修改与人工审阅：未运行测试、typecheck、编译、构建、项目 validator/checker、诊断、示例、replay 或产品。来源字节身份不是项目验证；纸面数值不是运行结果。历史测试记录、default-food失败、原43/45证据边界和 P078 排除均不因本批被覆盖、减少或清零。
