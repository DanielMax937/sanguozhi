# 给定当前牌堆与补牌核接入的舌战会话 v1

日期：2026-10-20。实现：[filled-debate.ts](../../packages/engine/src/filled-debate.ts) · [共享正常态战斗阶段](../../packages/engine/src/debate-normal-round.ts) · [API 与保存合同](../engine/filled-debate-session-v1.md) · [固定来源与政策账本](../sources/filled-debate-session-v1.json) · [纸面案例，未运行](../../data/scenarios/filled-debate-example-v1.json)。

这是一个新的、有界且版本隔离的会话 profile：`debate-filled-current-deck-reference-v1`，保存 tag 为 `filled-debate-session-v1`，原子回合命令为 `ResolveFilledDebateRound`。它把已交付的 `evaluateDebateHandFill` 真正接入初始发牌、正常态再考替换、非终局下一轮补牌三处，而不是另抄一份补牌算法，也不是自动升级旧七个 profile。

支持域仍限固定现代参考、通用身份、正常难度、非教程、双方 `angerTimer=0`。普通话题牌和五话术共六类战斗牌沿用正常态结算；再考是战前行动，不是第七类战斗牌。初始话题与两副当前牌堆由调用者提供，不生成牌堆、不实施原生 PRNG，也不接 campaign。

## 1. 来源身份和证据边界

固定现代参考为 `tankyc/sango_infinity` commit `a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef`。本批仅静态阅读既有固定文本；下列身份沿用先前账本，不声称本批重新下载、重新哈希或执行原始代码。

| 文件 | 固定 blob | 用途 |
|---|---|---|
| [Debate.cs](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs) | `0137498d10773cd4596d497083ccdf6a26b3a261` | 当前牌堆18项、数值补牌/修补/排序、移除压缩、再考、正常态战斗与回合更新 |
| [DebatePhase.cs](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/DebatePhase.cs) | `6aa98f855a5d4d172cde7e8ffc18a141b8a7b587` | 先手/后手再考后重选及 Attack→Effect→HP终局的阶段顺序 |
| [DebateEnum.cs](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/DebateEnum.cs) | `5b46a8ac87613193eb9f4b99a25e489ba6f5e483` | 数值牌码、话题枚举与修补映射 |

来源文件自述为现代翻译；枚举文件还声明部分枚举由实现归纳。它们不是原始头文件、clean stock EXE 或原生 RNG 的认证。既有 E15 的普通公式证据标签只用于其原限定域，不外推到本批的牌堆、排序、修补、再考或完整会话。

关键归因如下，完整行范围见[来源账本](../sources/filled-debate-session-v1.json)：

- `Debate.cs 54,343–354,406–438`：18项当前牌堆、INT容量、保留0槽、按空槽补牌、仅最后新增槽的条件修补、随后数值排序。
- `Debate.cs 453–465,991–999`：出牌调用移除函数；移除先置空再压缩幸存牌。补牌所见的物理槽是压缩后的布局，不是保留出牌前的内部空洞。
- `Debate.cs 490–509,1253–1263`：再考清空后填满、用后关闭许可；愤激冷静额外覆写不在正常态范围内。
- `DebatePhase.cs 172–253`：先手再考及最终重选完成后，才轮到另一方；配对原子命令是工程封装，不保存交互式子阶段。
- `Debate.cs 1046–1079,1083–1126,1520–1531`：下一轮先按崩坏变化恢复再考、按队伍0再1填牌；非终局胜者/话题与诡辩话题抽样。
- `DebatePhase.cs 394–420`：Attack→Effect→CalcWinner；HP终局先于愤激及下一轮。现代参考还包含本 profile 明确拒绝或排除的分支，不能因引用整个函数就声称全部覆盖。

## 2. 数值牌堆、手牌容量与身份

每方 `cardTape` 必须**恰好18项**，每项是1..14整数，表示已经提供的当前牌堆。初始游标为0，允许成功停在18；需要第19项时整次初始化或整轮拒绝 `unsupported-deck-regeneration`。这不是最长512项的旧提供牌带，也不能循环、拼接后继牌堆或借修补抵销缺牌。

牌码为：1/2/3故事小/中/大，4/5/6道理小/中/大，7/8/9时节小/中/大，10大喝，11诡辩，12无视，13镇静，14激昂。0仅由补牌核恢复为再考保留槽，不是可选择的战斗牌，也不能作为牌堆项。提供的通用 `resolvedIntelligence` 必须为1..100；INT<70、70..79、80..89、90..100分别有3/4/5/6个可出槽，另有一个0号保留槽。

会话 occurrence 使用 `cardCode`、`token` 和 `tapeIndex`，token 格式为 `participantId:tapeIndex`。token 表示消耗过的牌堆项身份，不是永久牌面：若一项被修补，其 `cardCode` 变为1+draw，但 token 与 `tapeIndex` 保留。不得另造一项牌堆来源、再推进游标，或把修补后牌码宣称为原牌堆值。

每次 fill 的数字排序和身份映射直接读取核返回的 `sortedProvenance`。保留牌按 `preSortSlot` 回接原 occurrence，新牌按核记录的 `tapeIndex` 建立 occurrence；保留0槽不成为可出 occurrence。等值牌按原槽顺序打破并列是核的明确工程审计政策，不认证 C# `Array.Sort` 的对象身份稳定性。排序后位置会变化，调用者必须用 token 选牌，不能把数组位置或牌码当唯一身份。

## 3. 三处实际调用同一补牌核

三处均调用 `evaluateDebateHandFill`，传入完整固定 `DEBATE_HAND_FILL_POLICY_V1`，保留完整 `DEBATE_HAND_FILL_EVIDENCE_V1` 和核收据；核自身公开协议与独立功能不改。

适配层先以空修补列表调用这个纯核；只有核返回 `missing-raw-draw` 才读取当前阶段的一个外层修补项，核对参与者/阶段，再交回同一个核求值。它不在外层重算“是否无普通牌”，也不把牌堆不足变成一次修补请求。空列表探测没有外部副作用；只有成功核结果才写候选手牌/游标并记下消费项，失败不会返回可提交的部分fill。

1. 初始：按 scenario 队伍0→1，从全空的可出槽和游标0填牌，再建立初始排序手牌。两方初始HP1000、stress0、angerTimer0、崩坏0、再考可用；先手来自 challenger，初始话题为提供值。
2. 再考：按当前 first→other的战前顺序，先检查请求许可，弃掉该方全部可出 occurrence，再以全空槽和当前游标调用核；记录弃牌与整副替换牌，关闭本次再考许可，然后从替换后的排序手牌中选择最终战斗 token。另一方尚未再考时，不可先消费它的修补抽样。
3. 非终局补缺：双方已出牌并完成战斗、附加效果、愤激边界、崩坏及话题/先手后，在下一轮按队伍0→1，各方先按自身崩坏变化恢复再考，再调用核补缺。选定牌先从其槽移除，幸存牌按原顺序压缩，余下槽补尾部 `null`，这才是传给核的原槽布局。不得用保留内部空洞或仅按 token 排序替换此布局。

核内顺序始终为：恢复保留0→按原槽升序填空→统计全部可出槽中的普通牌→必要时修补最后新增原槽→数值排序。只有填完仍无1..9普通牌且本次填过空位，才消费一次 bound9，把最后新增原槽改为 `1+value`。已有普通牌或新取普通牌均跳过修补；无空位的满手全话术也跳过，不把“最终总有普通牌”作为无条件规则。

来源的 `CharacterRethink` 在 fill 后另有一次排序；正常态没有冷静愤激覆写，数值已排序，所需牌面结果沿核确定。同值来源身份仍只依本 profile 的核审计政策，不从第二次 C# 排序推导原生 token 顺序。

## 4. 一条按阶段消费的提供式抽样流

初始抽样置于 `scenario.genesisRawDraws`，只供初始队伍0→1的条件修补，和后续命令的抽样列表分开。每轮命令只有一条 `rawDraws`，按实际到达的阶段消费：

1. 先手请求再考时的条件修补。
2. 后手请求再考时的条件修补。
3. 本轮 Attack 真正需要的 bound5 `psychological-damage-jitter`。
4. 非终局、非平局且诡辩未被对面无视阻断时的 bound3 `sophistry-topic-reroll`。
5. 非终局下一轮队伍0补牌的条件修补。
6. 非终局下一轮队伍1补牌的条件修补。

修补项同时携带 `participantId` 与 `phase`（`genesis`、`rethink` 或 `refill`），角色为 `debate-fill-topic-repair`、bound为9、value为0..8。到达对应阶段才验证应消费的项；不是先取所有同名修补项再任选分配。未触发的阶段消费0项，不能插入占位抽样。缺失、错角色、错bound、越界、错人、错阶段或末尾多余均拒绝，不猜测或生成随机数。

核内部修补 `drawIndex` 仍是其局部列表的0；外层 fill 审计另记它在所属初始/回合列表的索引，不篡改原核收据。诡辩话题审计也必须反映回合完整列表中的位置，不能错误沿用旧无修补协议的0/1限制。

再考不再被概括成“零随机”：它在本次替换触发话题修补时消费bound9；仅不需修补时为0。每个fill至多一个修补，初始至多2项，完整回合至多6项；这些是阶段上界，不是必须供满的配额。全部提供值仅作为确定性输入，`externalRngConsumed=0`；不证明随机均匀性或真实来源，不声称还原原作全局随机链。

## 5. 正常态战斗和回合关闭

`debate-normal-round.ts` 是包内共享正常态战斗阶段，不建立第二套 session、存档、随机流或公开玩法。新 profile 与旧 Rethink profile 复用它的战斗计算；各自 owner 仍负责输入、牌带/牌堆、填牌、再考、完整事务与保存。

- 牌力：无视120，大喝110，诡辩20；普通牌为1+levelIndex，匹配回合初话题再加10；镇静和激昂为0。相同牌力为平局，双方stress+15，无伤害jitter和附加效果调用。
- 通用attack为 `100+trunc(40*(myINT-opponentINT)/(131-myINT))`；伤害为 `trunc((attack+jitter)*10*levelCoef*topicCoef/1000)`，中间整数精确且除法向零。普通等级系数10/15/20、压力10/15/20；匹配话题系数10，否则6。大喝等级15、话题12、压力15。
- 无视不取伤害jitter、不伤HP，给对方stress+30，随后阻断败方附加效果。
- 诡辩胜普通牌，以诡辩方attack和败方普通牌的话题/等级计算，只在计算HP伤害>0时把伤害及压力反射回普通牌所有者。胜镇静/激昂时没有HP、压力攻击或jitter；不是无条件反弹任意牌。
- 附加效果按胜方→败方调用，不按先手。镇静请求始终基于对方当前stress：`-max(trunc(opponentStress/2),30)`；通常写对方，遇对方诡辩则写自己。激昂通常给自己+40，遇对方诡辩则给对方+40。逐次裁剪，明确记录请求基数与真正写入目标。
- HP裁剪到−100..1000，stress裁剪到0..100。即使本轮HP已败退，仍先处理应执行的附加效果，再判定HP终局；不能提前省略败方镇静/激昂。
- HP终局停止话题/先手更新、崩坏、再考恢复与下一轮补牌。未终局但效果后任一stress达到100时，整轮拒绝 `unsupported-anger-trigger`，不cap99、不重置、不跳过愤激来继续。
- 通过边界后崩坏为 `clamp(trunc((1000-hp)/250),0,3)`。仅等级变化者于下一轮开始恢复再考许可，不是每轮恢复，不累积额度。本轮已用再考随后跨阈值可以在最终快照恢复，但不能借未来恢复满足本轮开头的请求。
- 非终局胜者成为下轮先手；普通胜牌先设置其话题。只要一方为诡辩且对面不是无视，即使诡辩败给大喝，仍消费bound3把话题映射到故事/道理/时节；允许抽回原话题。平局和HP终局均不消费这项抽样。

## 6. 原子审计和保存

初始化、preview、execute及replay均在独立候选数据中完成。任何后续错误，包括后手再考失败、错选替换前的旧token、伤害/话题抽样不符、非终局stress100、队伍1补牌越界、余下抽样或完整保存预算超限，都不得提交之前的牌堆游标、修补、再考关闭、HP、stress或半轮审计。

每次fill保留完整核收据，连同阶段、参与者、前后occurrence与外层抽样位置。核收据中的 `filled` 与 `postFillHand` 保存修补前信息；`preSortHand` 和 `sortedProvenance` 保存修补后牌面及原槽、原牌堆来源。被覆盖的牌仍可追溯，不因只看最终手牌而丢失。回合另保存再考弃牌/替换、最终plays、攻击和附加效果分阶段写入、条件话题抽样、前后游标与许可等审计。

手牌、fill与change中的消费牌保留数值 occurrence；供共享战斗阶段使用的 `plays` 和 damage牌则由当下 `cardCode` 派生六类语义牌，并保留同一token/tapeIndex。因此修补后的普通牌按新牌面战斗，不会误用原牌堆的话术牌面。

保存必须包含完整固定新政策、证据、初始scenario及其抽样/填牌审计、每条命令和完整收据、当前snapshot；读取时从初始输入重新构造再逐条重算，比较所有政策、证据、初始信息、收据和最终状态，不信任外来快照或仅比政策ID。不能通过修改旧tag、添加新字段或把旧对象牌带改码来隐式迁移。

本新profile至多64条接受历史，完整canonical UTF-8包装上限16MiB；不是单个snapshot或单条receipt的预算。通用结构预算为至多1,000,000个节点、深度32、单数组4096项；4096并不放宽历史64、牌堆18、初始抽样2或回合抽样6的专门边界。执行、预览和重放对同一个完整候选保存包装计量。严格数据形状、错误顺序与API字段以[API合同](../engine/filled-debate-session-v1.md)和实现为准；超限是工程拒绝，不是游戏平局或胜负。

## 7. 旧版本兼容和未覆盖范围

旧七个 session profile、公开API、完整policy/evidence、保存tag与行为保持。旧Rethink仅抽取共享正常态战斗内部，不改其最长512项的对象牌带、旧排序政策、最多两项伤害/话题抽样、旧预算和 `unsupported-topic-repair` 接纳边界；它不会自动调用新补牌核。其他六个旧会话不因本批而升级。独立 `evaluateDebateHandFill` 协议与常量也不变。

本批新增的是“给定18项当前牌堆＋局部fill修补＋正常态会话”的有限闭环，不是完整发牌器或完整舌战。仍不实现 `DeckGenerate`、库存分布、洗牌、原生PRNG、教程、四性格愤激/自动反制/连打/timer、冷静愤激的额外再考恢复与大牌覆写、真实人物/书籍/MOD hooks、开场一击决胜、追击/留情/负伤及campaign结局写入。P078/native人员任务及全部依赖、俘虏/处斩/归属、return/mission和外交自动结算均排除。

`nativeEquivalent:false`、`stockOriginalVerified:false`、`pkEquivalent:false`、`vanillaEquivalent:false`、`completeDebate:false`。原43证据主题与45历史快照继续开放，数量不减；固定现代转录不能认证PC-PK/PK1.1、Vanilla或主机二进制，不能据本有限接入宣称原作全链恢复。

## 8. 本批交付口径

[纸面案例](../../data/scenarios/filled-debate-example-v1.json)除主链和独立拒绝分支外，还包含 `independentDeckBoundaryChain`：手工推导第12轮成功用完索引17、cursor到18；第13轮仍有合法手牌选择，但非终局补牌需要第19项，故整轮拒绝 `unsupported-deck-regeneration`。这是有限当前牌堆的边界说明，不是执行回执或测试通过结论。

静态基线为PR111之后main `29a84012609b779249da349fa4590755f7c3d757`，tree `a57979a60ab913f18a1d43f1ffcd16e66c96a4d2`。本批仅源码与文档静态阅读、文本编辑和纸面推导；未执行测试、typecheck、编译、build、validator、checker、diagnostics、产品、候选代码、示例或replay。任何纸面案例与静态兼容审查都不是运行回执、通过测试或运行等价证明；历史验证数字不为本批背书。
