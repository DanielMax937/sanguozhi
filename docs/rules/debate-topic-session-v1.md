# O09b 普通话题牌独立舌战 session v1

日期：2026-10-17。实现：[topic-debate.ts](../../packages/engine/src/topic-debate.ts)；[API](../engine/topic-debate-session-v1.md)；[固定来源、全部政策与证据等级](../sources/debate-topic-session-v1.json)；[五轮纸面设计](../../data/scenarios/topic-debate-example-v1.json)。本页是完整受支持子集合同，不是“全部舌战完成”。

## 1. 交付与不支持的范围

实现两名source-normal通用参与者、三类普通话题牌及各小/中/大、合法手牌选择与消费、显式有序牌带补牌、固定attack、power比较、普通心理伤害和stress writer、非终局话题/先手更新、HP胜负、独立保存及逐项重放。仅适用于新局HP1000、stress0、angerTimer0。非终局stress达到100时原子拒绝；有些合法原作牌局会停在这个边界，不能保证任意原作牌局都能完成。

不实现五话术（大喝/无视/诡辩/镇静/激昂）、再考、四性格愤激、反制消费/连打/兴奋timer、人物和书籍特例、开场一击决胜、追击/留情/负伤、Vanilla/主机版或MOD配置。没有训练GameState、外交自动结算、部队/城市/势力/奖励、P078、native人员任务、俘虏/处斩/归属、return/mission链。`debateEligible`不会自动启动本session，session胜者也不会自动写回外交。

只新增代码、文档及静态场景。没有运行测试、typecheck、编译、build、checker、产品、诊断或示例；旧测试未增删，历史默认全套food失败仍保留。纸面算例不是运行结果，历史通过数字不验证本树。原43组未决证据主题不减、不清零。

## 2. 证据层级与来源身份

- `formulaEvidence:'reverse-transcribed-cross-validated'`只沿用E15普通通用核心的既有标签。[规则30](30-debate-psychological-damage.md)与其旧证据保留。它不代表新session全部获得原生认证。
- `stateMachineEvidence:'pinned-modern-translated-reference'`：固定现代C#转录行为；源码自称从C++翻译，不能据此认证原PC-PK/PK1.1、Vanilla或主机二进制。
- `dealPolicyEvidence:'provided-sequence-engine-policy'`：调用者给定牌带与初始话题；不恢复DeckGenerate、2000次shuffle或真实概率，不悄悄调用seededRandom补牌。
- `sessionEvidence:'bounded-modern-reference-subset'`；`nativeEquivalent:false`、`stockOriginalVerified:false`、`completeDebate:false`。
- 官方2006年4Gamer发布资料与GamerSky/日文wiki只交叉支撑机制；官方报道并不能认证连续常数、全部状态机或原生版本身份。旧E15的PC-PK-oriented命名是目标/分层，不能升级此session。

固定仓库 `tankyc/sango_infinity`，commit `a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef`：

| 文件 | Git blob | UTF-8 bytes | SHA-256 |
|---|---|---:|---|
| Debate.cs | `0137498d10773cd4596d497083ccdf6a26b3a261` | 71288 | `622789ca8b8b6799a321526dcfb513d6622adf5b5d54025175c2a7795ef7da28` |
| DebatePhase.cs | `6aa98f855a5d4d172cde7e8ffc18a141b8a7b587` | 14048 | `5b47f7b6a89d6123a23e7c14f22168e59c9edd549e98d9bc0258d8a55bb9cbf3` |

[Debate.cs固定全文](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs)；[DebatePhase.cs固定全文](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/DebatePhase.cs)。本轮独立读取固定ref文件并核对实际字节的Git blob、SHA-256及行号，没有执行源码或旧checker。

定位：Debate.cs343–354总槽位；413–438再考占位/填空/排序；513–534 HP/stress clamp；554–570 attack与初始化；908–926 power；991–999消费；1046–1126 TurnStart/End；1129–1142胜方；1146–1195伤害；1199–1208 stress；1216–1223平局；1239–1251普通writer；1380–1395胜者；1405的追击阈值`<=-100`属于排除结果层；1520–1531崩坏；1535–1560初始topic（1538）/first（1560）；1567–1580附加效果。Phase164–168开始、172–253先手后手/再考、333–389愤激、394–420 Attack→Effect→CalcWinner→Anger。普通牌没有这里的附加话术效果，但不把五话术简化成普通damage。

## 3. 完整scenario输入

对象严格只有下列必需字段；不接受默认为缺失字段补值。

| 字段 | 域/含义 |
|---|---|
| schemaVersion | 整数1 |
| profile | `debate-topic-only-reference-v1` |
| genericOnly | 严格true，不映射真实武将 |
| difficulty | `source-normal`，不接受难度改变/教程模式 |
| policies | 完整`TOPIC_DEBATE_POLICY_V1`对象，全字段相等，不只核ID |
| challengerId | 必须等于一个participant.id，决定初始firstId |
| initialTopic | `story`故事 / `logic`道理 / `trend`时节，调用者明确提供 |
| participants | 恰好两项，顺序固定为此后choices/plays/changes顺序 |

每个participant严格只有：

| 字段 | 域/含义 |
|---|---|
| id | 唯一、不变、opaque session ID；ASCII `[A-Za-z][A-Za-z0-9_-]{0,63}`；不是原生人物ID |
| resolvedIntelligence | 安全整数1..100，已经解析完的智力，不含书籍/MOD/人物hook |
| hp | 严格1000 |
| stress | 严格0 |
| angerTimer | 严格0 |
| cardTape | 至多512项有序普通牌；每项严格`{topic,level}`，必须够开局手牌 |

`personId/person/personHooks/characterId`等额外人物字段拒绝，不能输入真实人物再暗中忽略特例。attack不允许外部覆盖，初始化与伤害人物hook均恒等。不是任意中局导入器；中局只允许本API生成并可从genesis完整重算的session。

## 4. 九种牌、power与手牌容量

三个topic各有以下三个level，合计9模板；重复模板合法，但每个出现位置是不同牌。

| level | levelIndex | 非当前话题power | 当前话题power | levelCoef | 对败方requestedStress |
|---|---:|---:|---:|---:|---:|
| small | 0 | 1 | 11 | 10 | 10 |
| medium | 1 | 2 | 12 | 15 | 15 |
| large | 2 | 3 | 13 | 20 | 20 |

`power=1+levelIndex+(card.topic===roundStartTopic?10:0)`。等power平局，两方各requestedStress+15，双方HP不变。不同非当前话题同level也可平局。power差仅用于判断谁赢，不进入伤害。

| 智力 | 源总槽位sourceSlotCount | 本profile普通手牌ordinaryHandCapacity |
|---|---:|---:|
| 1..69 | 4 | 3 |
| 70..79 | 5 | 4 |
| 80..89 | 6 | 5 |
| 90..100 | 7 | 6 |

源第0槽固定给Rethink，因此普通容量是源总槽位减1，不能给普通牌多一张。snapshot明确`reservedRethinkSlot:true`，它仅记录保留边界，不是可选择的卡或可用按钮。`no-rethink-v1`拒绝所有Rethink命令。崩坏数可展示，但不表示恢复了再考能力。

创建时依次取牌带开头到容量，不洗牌。手牌occurrence为`{topic,level,token,tapeIndex}`；token=`participantId + ':' + tapeIndex`，tapeIndex从0开始。初始deckCursor=已取牌数，指向下一未取位置。选择后只移除相应token，保留其他牌；非终局从cursor继续补空位。手牌采用保留牌稳定顺序加新牌的工程展示顺序，不复制源CharacterSortCards的UI排序；因为按token选择，这不改变普通比较规则。牌带不是源循环18张卡组，耗尽不会循环或随机再生。

## 5. 完整具名policy

所有政策完整内容写入scenario、session和每条receipt，并逐字段相等校验；[source manifest](../sources/debate-topic-session-v1.json)的`policies`保存全部字面值，导出常量提供完全相同对象。以下表列每组的具体意义，不能用未注册函数替换。

| policy组/id | 固定行为 |
|---|---|
| cards / topic-only-no-rhetoric-v1 | 三topic/三level；power、10/15/20伤害与stress系数；平局各15 |
| identities / generic-identity-debate-hooks-v1 | source-normal，所有人物hook identity-or-disabled，其中初始化attack及hpDamage恒等；真实人物映射/items/personality全部false |
| initialTopic / provided-initial-topic-v1 | 外部显式初始topic，不生成 |
| deal / provided-ordered-card-tapes-v1 | 顺序牌带、occurrence token；无洗牌/原生分布/源UI排序 |
| hand / source-reserved-rethink-slot-v1 | 70/80/90阈值，总4/5/6/7，普通3/4/5/6，保留1槽、不可再考 |
| round / paired-choice-atomic-round-v1 | 唯一ResolveTopicRound，两方选择一起提交，choices按scenario顺序；记录first先于other，不加先手伤害优势 |
| topic / source-topic-winner-follow-v1 | 伤害用旧topic；非终局胜者更新first/topic；平局保留 |
| arithmetic / source-normal-integer-topic-damage-v1 | 精确bigint中间整数、除法向零；angerCoef10、topicCoef10或6、jitter bound5；非原生PRNG |
| writer / source-hp-minus100-to1000-stress0-to100-v1 | HP[-100,1000]，stress[0,100]，requested/actual分离 |
| anger / reject-nonterminal-anger-trigger-v1 | 非终局stress100整轮拒绝，无cap99/清零/跳过 |
| closing / session-result-only-closing-v1 | HP<=0先结束，再考虑anger/crumble/topic/refill；终局不改topic/先手、不补牌、不写campaign |
| opening / no-opening-instant-win-v1 | 1000/0/0新局，不实施原作开场一击决胜 |
| rethink / no-rethink-v1 | crumbleStep250、max3，仅信息，无再考动作 |
| refill / fill-next-round-from-tape-v1 | 下一回合开始补牌折入本次非终局提交，只填空；不足整轮拒绝，终局不补 |
| capacity / bounded-session-reject-v1 | 4096条、每人512牌、16MiB、100万节点、深32；耗尽是API拒绝，不是SAN11平局 |
| persistence / full-policy-genesis-recompute-v1 | 全policy、genesis初态、每条receipt和最终snapshot重算 |

profile/policy替换必须另设明确版本或迁移，不能在存档里改字符串而继续接收。提供序列、原子两方选择、容量、持久化是工程政策，不能标成原作规则。

## 6. 唯一推进命令

严格字段：`type:'ResolveTopicRound'`、`expectedRevision`、`expectedRoundIndex`（安全整数0..4096）、`expectedFirstId`、`choices`、`rawDraws`。

choices恰好两项，各只有`participantId,cardToken`；参与者顺序必须与scenario一致，token必须在该参与者当前手中。重复participant/token拒绝；旧牌、对方牌、未发牌、越界牌都不能使用。token语法只接受有效ID后接冒号和规范十进制0..999，实际成员资格还由hand约束；牌带真实上限512意味着可生成最大索引511。不能直接传topic/level替代token，也不能把某个模板当唯一牌。

rawDraws条件域：

- 平局严格`[]`，不存在无用jitter，也不先消费再忽略
- 分出胜负严格一项`{role:'psychological-damage-jitter',bound:5,value:0..4}`，value必须安全整数
- 错role/bound/条数拒绝；额外draw拒绝；范围外值拒绝；没有RNG callback/global RNG/seed

这是两方已经选好牌的一次原子提交，不模拟玩家私密选牌、AI或思考时间。firstId决定记载的`orderedIds=[first,other]`，不改变请求choices的固定排列，不额外赋予伤害优势；以后若需要分阶段选择须另开profile。

## 7. 初始化及精确整数公式

初始每方固定attack：

`attack = 100 + trunc(40 * (myINT - opponentINT) / (131 - myINT))`

所有除法向零，特别是负智力差，不可floor。1..100域分母31..130；中间值用bigint，公开结果为安全整数。例如INT100对80，attack125；80对100，attack85；同INT均100。不接受存档自报attack而不重算。

分出胜负时只由胜方牌造成伤害：

`hpDamage = trunc((winner.attack + jitter) * 10 * levelCoef * topicCoef / 1000)`

- levelCoef小10、中15、大20
- topicCoef胜者牌匹配**本轮开始**话题10，否则6
- 正常angerCoef固定10；本profile没有兴奋状态
- requestedStress为胜者牌对应10/15/20，施加于败方；胜方0
- jitter为已提供0..4；平局不计算此公式

同智力attack100时，匹配小100..104、中150..156、大200..208；非匹配小60..62、中90..93、大120..124。这里是算术区间，不是本轮测试记录。即使同轮胜者将下一话题改成自己的topic，本轮仍用旧topic系数；先改topic再算damage会错误地把非匹配伤害提升。

## 8. 单轮顺序与原子提交

1. 严格分离外部plain输入，完整session自genesis重算；检查active、expectedRevision/round/first、choices当前hand成员资格。
2. 根据旧currentTopic得到双方power，确定winner或draw；核对分支的rawDraws精确条数。
3. 在私有副本计算requestedDamage/requestedStress，消费双方所选各一张；HP写`clamp(beforeHp-requestedHpDamage,-100,1000)`，stress写`clamp(beforeStress+requestedStress,0,100)`。
4. **先判HP<=0**。本profile一轮只伤害败方，不会自然双败。终局记录本轮胜者；revision/round各+1，status=finished，封存。即使同击stress达到100也先接受HP胜负；不进入愤激、崩坏更新、TurnEnd话题/先手更新或补牌。firstId/currentTopic保留本轮开始值，可能不等于终局winner，winner以outcome为准。
5. 若未终局且任一stress>=100，返回`unsupported-anger-trigger`并回滚整轮。原session、两张牌、HP/stress、计数、cursor、raw draw记录和日志均不改变。不cap99、不清零、不跳过愤激，也不提交半轮保存。
6. 未触发边界则更新显示崩坏层`clamp(trunc((1000-hp)/250),0,3)`。源崩坏可恢复再考，本profile只记录层级；终局不重算层级，因为源提前转入closing。
7. 非终局有winner：firstId=winner.id，currentTopic=winner.card.topic；平局两者保持。
8. 从双方牌带各补所缺空位，以得到下一回合起点。任一方不足则`deck-exhausted`并回滚整个命令，哪怕另一方局部已补牌，也没有可见提交。终局从不要求补牌，不能用牌带耗尽拒绝已胜利的最后一击。
9. 检查**完整拟议session envelope**的所有预算，之后才返回新session及receipt；revision/round各+1。preview走同一追加和预算路径，只返回projectedSnapshot/receipt，不提交日志。所有输出深冻结，所有输入不修改。

本接口整轮处理选择；源选择阶段消费卡、本接口局部稍后消费是原子可观察等价的工程折叠，不声称相同UI/半回合状态机。该实现没有外部RNG可回滚；“raw draw回滚”指失败时不形成任何成功receipt/消耗日志。

## 9. Snapshot、genesis和session全部字段

snapshot严格由API生成：

- `schemaVersion:1,profile`与上述profile一致
- `revision,roundIndex`从0起，成功轮各加1；拒绝不加
- `currentTopic,firstId`为当前/下一轮起点，终局保留最后一轮起点
- `status:'active'|'finished'`；`outcome:null`或`{kind:'hp-defeat',winnerId,loserId}`
- `participants`固定两项顺序，每项完整字段如下

| participant snapshot字段 | 含义 |
|---|---|
| id,resolvedIntelligence | 从scenario保留 |
| attack | 每次load从初局智力重算固定值 |
| hp,stress,angerTimer | writer结果；angerTimer恒0 |
| sourceSlotCount,ordinaryHandCapacity,reservedRethinkSlot | 总槽与普通容量及保留再考槽，不提供动作 |
| crumbledLevel | 0..3，非终局更新，终局保留上一轮值 |
| hand | occurrence数组；active时补满，finished时允许最后消费后少一张 |
| deckCursor | 下一未发牌的tape索引，0..牌带长度 |

session只有`tag:'topic-debate-session-v1',policy,evidence,genesis,snapshot,entries`。

- genesis只有`scenario,snapshot`：scenario含两完整牌带与初始话题；snapshot是计算attack、容量、初始手牌的初局。load必须重新生成并全字段相等，伪造attack/cursor/手牌/初始outcome均拒绝
- policy/evidence分别为完整注册对象；所有字段含分层证据也要相等
- entries每项只有`command,receipt`，command保留原始jitter和所选tokens
- 最终snapshot、每个receipt全字段逐项重算比较，不信任自报结果
- 任意字段增删/篡改不会被忽略：边界结构或重算匹配失败即拒绝
- canonical JSON对object键排序，数组保序；不是密码签名，不能证明外部真实性或谁玩过这局

## 10. Receipt完整字段与requested/actual

每条receipt包含：

- `schemaVersion,profile,command,policy,evidence`：完整命令与注册政策/证据
- `beforeRevision,afterRevision,beforeRoundIndex,afterRoundIndex,beforeFirstId,afterFirstId,beforeTopic,afterTopic`
- `orderedIds:[first,other]`；`plays`固定scenario顺序，各`participantId,card,attack,power,matchesCurrentTopic`，其中card完整occurrence
- `result:'winner'|'draw',roundWinnerId`（平局null）；`damage`平局null，胜负含`sourceId,targetId,attack,jitter,angerCoefficient:10,levelCoefficient,topicCoefficient,requestedHpDamage`
- `changes`固定两项，各`participantId,beforeHp,afterHp,requestedHpDamage,actualHpDelta,beforeStress,afterStress,requestedStress,actualStressDelta,beforeCrumbledLevel,afterCrumbledLevel,consumedCard,refilledCards,beforeDeckCursor,afterDeckCursor`
- `consumedDraws,drawCount:0|1,noDrawReason`，平局reason=`equal-card-power`，胜负null
- `terminal,crumbleEvaluated,refillApplied,outcome`；终局后两项false，非终局成功true

requestedHpDamage是非负需求；actualHpDelta=`afterHp-beforeHp`为非正数。requestedStress是非负请求；actualStressDelta可能因cap100小于请求。不能把请求量说成实际损失。HP下限保留-100，source追击阈值资料仍有意义，但本profile并未实现追击；不能因此启用该动作。终局后手牌/cursor保留消费结果且无refill；receipt不造“下一轮”。

## 11. 拒绝边界与失败定位

所有公开API失败为`{ok:false,reason,index}`，没有partial session、成功receipt或输入写回。

| reason | 典型条件 |
|---|---|
| malformed-data / unknown-field | 非plain值、缺字段、未知字段、非法整数、-0、稀疏array、异常描述符等 |
| unsupported-runtime | 缺少Node内建安全proxy检测，fail-closed |
| unsupported-profile / unsupported-policy / evidence-mismatch | profile/难度/版本不支持，完整policy或证据不同 |
| unsupported-person / unsupported-item | 人物身份/额外人物或物品字段；非法ID |
| unsupported-initial-state | 新局不是HP1000/stress0/angerTimer0 |
| unsupported-card / unsupported-action | 不支持topic/level，任何非ResolveTopicRound动作，包括Rethink、话术、追击 |
| duplicate-participant / invalid-challenger | 重复参与者，挑战者不在两人中 |
| invalid-token / duplicate-token / not-in-hand / invalid-choice-order | 非规范token，重复token，不属于当前hand，choices顺序不符 |
| stale-revision / stale-round / stale-first | expected值与当前session不一致 |
| session-finished | 终局后继续推进 |
| draw-shape / draw-range | 条数/role/bound不符，jitter不在0..4 |
| unsupported-anger-trigger | 非终局stress达到100，整轮拒绝 |
| deck-exhausted | 开局牌不足或非终局补牌不足；终局不受此补牌检查 |
| history-limit | 任一条数/牌带/字节/节点/深度预算超限 |
| invalid-genesis / receipt-mismatch / snapshot-mismatch | 初局、某条receipt或最终状态不等于重算 |

reason优先级以实际流程为准；同时多个错误不承诺按此表顺序。对象边界先拒绝结构错误，再进入重算；比如载入晚entry的accessor可在较早语义错误前被发现，这是安全分离而非“首语义错误被跳过”。

- create及普通输入错误index=null
- inspect/save/load/execute/preview先安全分离整个session；可定位entries元素的结构错误带该0-based index，外层/array描述符错误可能null；结构正确进入重算后按顺序报告首个失败entry；最终snapshot mismatch为null
- replay先校验scenario/外层command-list（失败index=-1），然后逐元素安全分离、parse、append；首个失败命令返回精确0-based index。不会先解析后续元素从而遮蔽较早命令的错误；外层本身的非法额外键/洞/长度错误仍先报告-1
- replay失败不返回partial结果。成功也只有完整session

对象允许普通Object.prototype或null原型record及标准Array。拒绝Proxy、getter/setter、函数、undefined、BigInt外部值、Symbol、Date/custom prototype、循环、稀疏数组、额外array属性及非枚举record字段；不执行getter/toJSON/custom iterator。所有输入numbers须安全整数且非-0。Proxy检测使用`process.getBuiltinModule('node:util').types.isProxy`；缺少它不降级为不安全解析。

## 12. 共同预算和保存重放

上限4096条、每人512张牌、canonical完整session UTF-8 16MiB、1,000,000值节点、深度32；任一先到即拒绝。byte/node预算计算完整policy/evidence/receipt重复内容，不只看commands。对象输入预分离及最终结果均预算；load另限制原JSON文本字节。条数未满不保证仍可提交。preview和execute/replay共用append，因此预算完全一致。

create生成初局；execute/preview/inspect/save都先完整重算传入session；load解析canonical或等价键序JSON后重算。replay从scenario重建初局，依次重放commands，全部成功才返回session。存档中不存函数、随机生成器或外部资源引用。改牌带、attack、power、cursor、winner、raw draw、receipt或policy内容都会影响重算，不可仅改展示字段绕过。

这些防护是代码合同与静态审阅结论，本次未运行样例、攻防测试或类型检查，不能当作已验证运行保证。

## 13. 五轮可完成设计：仅纸面，未运行

A/B INT100，初始topic story，challenger A。每人10张显式牌：A全story/large，B全logic/small。普通容量6；初始tokens A:0..5/B:0..5、cursor6。五轮分别选择A:0..4与B:0..4，每轮jitter0。双方power13/1，A attack100，damage=`100*10*20*10/1000=200`，不用power差12。

| 轮 | 提交expectedRevision/round | B HP | B stress | A/B cursor | 是否补牌 |
|---|---:|---:|---:|---:|---|
| 1 | 0/0 | 800 | 20 | 7 | 是，索引6 |
| 2 | 1/1 | 600 | 40 | 8 | 是，索引7 |
| 3 | 2/2 | 400 | 60 | 9 | 是，索引8 |
| 4 | 3/3 | 200 | 80 | 10 | 是，索引9 |
| 5 | 4/4 | 0 | 100 | 10 | 否，HP终局先于愤激 |

第五轮返回finished、outcome A胜B负、revision/round=5，hand保留索引5..9五张；虽然tape已耗尽，终局无需第11张。B崩坏非终局四轮0/1/2/3，第五轮仍3，不额外触发再考。这个设计展示支持域内可以结束整场，并不是执行得到的五条receipt。

另一个纸面边界：同power平局六轮，stress依次15/30/45/60/75/90、HP1000。第七轮请求会达到100且无HP终局，必须整轮`unsupported-anger-trigger`；第六轮session、两个token、cursor、日志都保留。即使有充足牌和历史预算也不能继续普通局。再如非当前logic large胜trend small，旧topic story时damage按6计算，本轮结束才把currentTopic设logic。

另一个未运行纸面writer边界：A INT100、B INT1，A attack227，每次story large、jitter4请求462；B HP依次538/76/−100。第三击requestedHpDamage仍462，但actualHpDelta为−176，不能报告实际扣462；该击终局不再补牌。若每方牌带恰等初始容量，则首次非终局回合因补牌不足整轮deck-exhausted，不能先消费牌再留下空手。

## 14. 保留的下一批规则

1. 五话术普通态：攻击/附加效果/无视阻断、诡辩反射与topic重随机必须分层，不能只填damage表
2. 四性格愤激：两次trigger、激昂/镇静自动反制及第二张消费、连打、强制power、timer与再考权限
3. 再考、真实DeckGenerate/分布、书籍及真实人物hooks，任何现代实现的原生等价需单独证据
4. 开场一击决胜与追击/留情等结果层，不能顺带接入俘虏、处斩或人员任务

本页不删除[11舌战](11-debate.md)、[30伤害核心](30-debate-psychological-damage.md)或[fallback §9](16-unresolved-rules-fallbacks.md#9-舌战普通牌心理伤害e15-已闭合通用核心)中保留的特殊规则及平台未决项。普通session代码覆盖、历史公式证据与完整原作认证是三件不同的事。
