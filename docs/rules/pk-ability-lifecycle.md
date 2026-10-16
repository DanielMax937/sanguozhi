# 独立PK能力研究与武将培育生命周期

版本：`standalone-pk-ability-guide-compat-v1`。本页完整规定本服务的游戏规则；[API合同](../engine/pk-ability-lifecycle.md)给出数据和调用方式，[来源清单](../sources/pk-ability-lifecycle.json)保存证据和全部政策参数。

## 1. 两阶段范围与证据

研究Start扣金/AP并建立研究任务；逐旬Advance到期只解锁节点。随后培育Start对一个人物扣AP、预留次数和人物；再经过3个Advance才实际写XP、适性或单一特技。研究完成不等于人物获得效果，培育开始也不立即加能力。服务自己计算费用、资格、进度、效果及次数，调用者不得提供最终答案。

本实现只管理一个固定势力、据点、军团的独立账本。city/gate/port都支持：研究三类据点可用有攻略依据，培育统一可用为本profile政策。研究不选择执行武将，不占人物，不发XP或功绩，是明示范围选择。一个研究与三个不同类别培育可同时进行；最多四个active任务。

- 48基础节点、52基础依赖、4起点、50隐藏候选和所选费用/月数/次数是documented-guide，语义ID不是原生表记录
- 五维复用S1 `qualifyPkStatTraining` / `completePkStatTraining`，等级为compatibility-reconstruction；MOD关联来源不能提升为clean-stock等价
- 月转旬、固定三旬培育、三类别容量、同据点资格、零其他培育扣款、预约与计次点、完成顺序、AP恢复及持久化全为具名provisional-engine-rule
- 旧规则15的历史confirmed/empirical标记不把上述组合整体升级为原作精确；新版策略没有抹去旧来源分歧

排除P078及其依赖、native任务/归属/俘虏/取消/return链、势力灭亡与继承、原作存档导入、原生98表映射、native skill/person ID、全局RNG、多据点迁移、年龄/宝物/官职/伤病/特殊人物getter、外部在途数值写入、自动派发及技能战斗/内政效果。`capture`只是一个特技标签，不接捕缚链。旧Train/EndTurn、training-kernel-v2、saveVersion2及技巧研究服务保持独立。

## 2. 固定目录与隐藏选择

目录固定为`pk-ability-research-guide-v1`。原文件SHA256为`ed731ae89f88ca1729712d3ca0d0889718cdec6ecc6566d4c7e384bb69a13b77`，规范JSON SHA256为`8f9480d1a032f94d1b0d934e477fd8c40d08a360f5ac9e7875a3fe6ef5abb0e9`。完整原目录、图示字段、来源和六冲突都进入state/save/trace；下面表给出实际执行字段。

初始化必须显式选择10槽中的恰好5槽，每槽恰好一个其本槽候选。4槽、6槽、重复槽、重复候选、错槽或未知ID都拒绝。排序仅规范存储，不改变选项；没有缺省抽样、运行时重抽或更换入口。每场景有效集合严格为48基础+5候选=53节点，`rngDraws=0`。

每个候选内的allOf全部为AND；候选之间是开局替代选择，不是运行中OR。图示`imageIncoming`不用于解锁。52仅计基础节点间边，4起点箭头不是前置；29橙箭头是隐藏槽位图示，不是每个候选完整条件。50隐藏候选包含44个不同skillKey，不能按同名合并节点/次数。米道2、征收3、屯田3、仁政2各保留独立候选ID。

四个空前置根：war.low、leadership.low、intelligence.low、politics.low。八个双前置基础节点：war.medium、war.high、charisma.low、iron-wall、clear-mirror、overlord、fame、debater。前置只认已经研究完成，不认在途任务；满足后不消费前置，完成节点不能再次研究。

### 2.1 48个基础节点

所有节点研究费都是金300/AP20/TP0。表中月份×3才是本服务旬数；次数为全独立scope共享的培育上限，不按武将另开。`∅`表示根，`&`表示全部必须完成。

| ID | 名称 | 类别 | 月 | 旬 | 次数 | allOf | 完成培育目标 |
|---|---|---|---:|---:|---:|---|---|
| aptitude.spear.a | 枪兵A | aptitude | 5 | 15 | 5 | aptitude.crossbow.a | spear→A |
| aptitude.crossbow.a | 弩兵A | aptitude | 5 | 15 | 5 | stat.war.medium | crossbow→A |
| stat.war.medium | 武+5中 | stat | 4 | 12 | 5 | aptitude.spear.b & aptitude.navy.b | war→80 |
| aptitude.halberd.a | 戟兵A | aptitude | 5 | 15 | 5 | aptitude.navy.b | halberd→A |
| aptitude.navy.a | 水军A | aptitude | 5 | 15 | 5 | aptitude.halberd.a | navy→A |
| skill.support | 辅佐 | skill | 6 | 18 | 3 | aptitude.navy.a | support |
| skill.overlord | 霸王 | skill | 6 | 18 | 1 | skill.support & stat.leadership.medium | overlord |
| skill.chain-attack | 连战 | skill | 6 | 18 | 3 | aptitude.spear.a | chain-attack |
| aptitude.spear.b | 枪兵B | aptitude | 4 | 12 | 5 | aptitude.crossbow.b | spear→B |
| aptitude.navy.b | 水军B | aptitude | 4 | 12 | 5 | aptitude.halberd.b | navy→B |
| aptitude.halberd.b | 戟兵B | aptitude | 4 | 12 | 5 | stat.war.low | halberd→B |
| skill.diamond | 金刚 | skill | 3 | 9 | 3 | skill.indomitable | diamond |
| stat.leadership.medium | 统+5中 | stat | 4 | 12 | 5 | skill.diamond | leadership→80 |
| stat.leadership.high | 统+5高 | stat | 6 | 18 | 3 | stat.leadership.medium | leadership→95 |
| stat.war.high | 武+5高 | stat | 6 | 18 | 3 | skill.chain-attack & aptitude.cavalry.a | war→95 |
| aptitude.crossbow.b | 弩兵B | aptitude | 4 | 12 | 5 | stat.war.low | crossbow→B |
| stat.war.low | 武+5低 | stat | 3 | 9 | 5 | ∅ | war→70 |
| stat.leadership.low | 统+5低 | stat | 3 | 9 | 5 | ∅ | leadership→70 |
| skill.indomitable | 不屈 | skill | 3 | 9 | 3 | stat.leadership.low | indomitable |
| skill.fame | 名声 | skill | 6 | 18 | 3 | stat.leadership.medium & skill.efficient-official | fame |
| skill.capture | 捕缚 | skill | 6 | 18 | 1 | skill.fame | capture |
| aptitude.cavalry.a | 骑兵A | aptitude | 5 | 15 | 5 | aptitude.siege.a | cavalry→A |
| skill.range | 射程 | skill | 4 | 12 | 3 | aptitude.cavalry.b | range |
| aptitude.cavalry.b | 骑兵B | aptitude | 4 | 12 | 5 | aptitude.siege.b | cavalry→B |
| aptitude.siege.b | 兵器B | aptitude | 4 | 12 | 5 | stat.war.low | siege→B |
| skill.iron-wall | 铁壁 | skill | 3 | 9 | 3 | stat.leadership.low & skill.fortification | iron-wall |
| skill.efficient-official | 能吏 | skill | 6 | 18 | 3 | skill.breeding | efficient-official |
| skill.debater | 论客 | skill | 6 | 18 | 1 | skill.capture & skill.efficient-official | debater |
| aptitude.siege.a | 兵器A | aptitude | 5 | 15 | 5 | skill.range | siege→A |
| skill.sweep | 扫讨 | skill | 3 | 9 | 3 | skill.ambush | sweep |
| skill.ambush | 待伏 | skill | 3 | 9 | 3 | stat.intelligence.low | ambush |
| stat.intelligence.low | 知+5低 | stat | 3 | 9 | 5 | ∅ | intelligence→70 |
| stat.politics.low | 政+5低 | stat | 3 | 9 | 5 | ∅ | politics→70 |
| skill.fortification | 筑城 | skill | 3 | 9 | 3 | stat.politics.low | fortification |
| skill.breeding | 繁殖 | skill | 6 | 18 | 3 | stat.politics.high | breeding |
| stat.politics.high | 政+5高 | stat | 6 | 18 | 3 | skill.invention | politics→95 |
| stat.intelligence.high | 知+5高 | stat | 6 | 18 | 3 | skill.deep-plan | intelligence→95 |
| stat.intelligence.medium | 知+5中 | stat | 4 | 12 | 5 | skill.sweep | intelligence→80 |
| stat.charisma.low | 魅+5低 | stat | 3 | 9 | 5 | stat.intelligence.low & stat.politics.low | charisma→70 |
| stat.charisma.high | 魅+5高 | stat | 6 | 18 | 3 | stat.charisma.medium | charisma→95 |
| skill.transport | 运搬 | skill | 3 | 9 | 3 | skill.fortification | transport |
| skill.invention | 发明 | skill | 4 | 12 | 3 | skill.shipbuilding | invention |
| skill.deep-plan | 深谋 | skill | 6 | 18 | 1 | skill.clear-mirror | deep-plan |
| skill.clear-mirror | 明镜 | skill | 6 | 18 | 3 | stat.intelligence.medium & skill.intimidation | clear-mirror |
| skill.intimidation | 威压 | skill | 3 | 9 | 3 | stat.charisma.low | intimidation |
| stat.charisma.medium | 魅+5中 | stat | 4 | 12 | 5 | skill.intimidation | charisma→80 |
| stat.politics.medium | 政+5中 | stat | 4 | 12 | 5 | skill.transport | politics→80 |
| skill.shipbuilding | 造船 | skill | 4 | 12 | 3 | stat.politics.medium | shipbuilding |

### 2.2 10槽×5候选

以下50项仅为目录候选；每场景只有显式选中的五项可开始。研究费均金300/AP20/TP0；培育都20AP、3旬。每行独立allOf，不从槽名、图示月份或相同特技推导。

| 槽/候选ID | 特技名 | skillKey | 月 | 旬 | 次数 | allOf |
|---|---|---|---:|---:|---:|---|
| hidden.war-i.option-1 | 乱战 | chaotic-combat | 6 | 18 | 5 | aptitude.spear.a |
| hidden.war-i.option-2 | 掎角 | pincer | 6 | 18 | 5 | skill.chain-attack |
| hidden.war-i.option-3 | 勇将 | brave-general | 6 | 18 | 5 | aptitude.spear.a |
| hidden.war-i.option-4 | 斗神 | war-god | 6 | 18 | 5 | skill.chain-attack |
| hidden.war-i.option-5 | 疾走 | gallop | 6 | 18 | 5 | stat.war.high |
| hidden.war-ro.option-1 | 心攻 | heart-attack | 3 | 9 | 5 | aptitude.cavalry.b |
| hidden.war-ro.option-2 | 枪神 | spear-god | 3 | 9 | 3 | aptitude.spear.b & skill.chain-attack |
| hidden.war-ro.option-3 | 戟神 | halberd-god | 3 | 9 | 3 | aptitude.crossbow.b & skill.chain-attack |
| hidden.war-ro.option-4 | 弓神 | bow-god | 3 | 9 | 3 | aptitude.crossbow.b & skill.chain-attack |
| hidden.war-ro.option-5 | 水神 | water-god | 3 | 9 | 3 | aptitude.crossbow.b & skill.chain-attack |
| hidden.war-ha.option-1 | 攻城 | siege | 6 | 18 | 5 | stat.intelligence.high & aptitude.siege.a |
| hidden.war-ha.option-2 | 神将 | divine-general | 6 | 18 | 5 | stat.intelligence.high & aptitude.siege.a |
| hidden.war-ha.option-3 | 骑神 | cavalry-god | 6 | 18 | 3 | aptitude.siege.a |
| hidden.war-ha.option-4 | 工神 | engineering-god | 6 | 18 | 3 | aptitude.siege.a |
| hidden.war-ha.option-5 | 猛者 | fierce | 6 | 18 | 5 | aptitude.siege.a |
| hidden.leadership-i.option-1 | 长驱 | long-drive | 3 | 9 | 5 | skill.diamond |
| hidden.leadership-i.option-2 | 踏破 | traverse | 3 | 9 | 5 | skill.diamond |
| hidden.leadership-i.option-3 | 血路 | blood-road | 3 | 9 | 5 | stat.leadership.low |
| hidden.leadership-i.option-4 | 护卫 | bodyguard | 3 | 9 | 5 | skill.indomitable |
| hidden.leadership-i.option-5 | 奏乐 | music | 3 | 9 | 3 | skill.support & skill.indomitable |
| hidden.leadership-ro.option-1 | 飞将 | flying-general | 6 | 18 | 3 | stat.leadership.high & skill.overlord |
| hidden.leadership-ro.option-2 | 遁走 | escape | 6 | 18 | 3 | stat.leadership.medium |
| hidden.leadership-ro.option-3 | 强行 | forced-march | 6 | 18 | 3 | stat.leadership.high |
| hidden.leadership-ro.option-4 | 藤甲 | rattan-armor | 6 | 18 | 3 | stat.leadership.high |
| hidden.leadership-ro.option-5 | 强运 | fortune | 6 | 18 | 5 | stat.leadership.medium |
| hidden.intelligence-i.option-1 | 虚实 | feint | 6 | 18 | 3 | stat.intelligence.high |
| hidden.intelligence-i.option-2 | 洞察 | insight | 6 | 18 | 3 | stat.intelligence.high |
| hidden.intelligence-i.option-3 | 神算 | divine-calculation | 6 | 18 | 3 | skill.deep-plan |
| hidden.intelligence-i.option-4 | 百出 | hundred-plans | 6 | 18 | 3 | stat.intelligence.high |
| hidden.intelligence-i.option-5 | 鬼门 | demon-gate | 6 | 18 | 3 | stat.intelligence.high |
| hidden.intelligence-ro.option-1 | 看破 | perception | 3 | 9 | 3 | stat.charisma.low & skill.ambush |
| hidden.intelligence-ro.option-2 | 火神 | fire-god | 3 | 9 | 3 | stat.intelligence.medium |
| hidden.intelligence-ro.option-3 | 鬼谋 | demonic-plan | 3 | 9 | 3 | stat.intelligence.low & skill.clear-mirror |
| hidden.intelligence-ro.option-4 | 连环 | chain-plan | 3 | 9 | 3 | stat.charisma.low & skill.ambush |
| hidden.intelligence-ro.option-5 | 反计 | counter-plan | 3 | 9 | 3 | stat.intelligence.low & skill.ambush |
| hidden.politics-i.option-1 | 指导 | guidance | 3 | 9 | 5 | skill.indomitable & skill.fortification |
| hidden.politics-i.option-2 | 眼力 | discernment | 3 | 9 | 5 | skill.indomitable & skill.fortification |
| hidden.politics-i.option-3 | 征税 | taxation | 3 | 9 | 3 | skill.breeding |
| hidden.politics-i.option-4 | 风水 | feng-shui | 3 | 9 | 5 | skill.fortification |
| hidden.politics-i.option-5 | 祈愿 | prayer | 3 | 9 | 5 | skill.fortification |
| hidden.politics-ro.option-1 | 米道 | rice | 6 | 18 | 5 | skill.invention |
| hidden.politics-ro.option-2 | 米道 | rice | 6 | 18 | 5 | stat.politics.high |
| hidden.politics-ro.option-3 | 征收 | collection | 6 | 18 | 5 | skill.invention |
| hidden.politics-ro.option-4 | 征收 | collection | 6 | 18 | 5 | stat.politics.high |
| hidden.politics-ro.option-5 | 征收 | collection | 6 | 18 | 5 | stat.politics.high & skill.invention |
| hidden.politics-ha.option-1 | 屯田 | farming | 6 | 18 | 5 | skill.shipbuilding & skill.invention |
| hidden.politics-ha.option-2 | 屯田 | farming | 6 | 18 | 5 | skill.shipbuilding |
| hidden.politics-ha.option-3 | 屯田 | farming | 6 | 18 | 5 | skill.invention |
| hidden.politics-ha.option-4 | 仁政 | benevolence | 6 | 18 | 5 | skill.shipbuilding |
| hidden.politics-ha.option-5 | 仁政 | benevolence | 6 | 18 | 5 | skill.invention |

### 2.3 六个保留分歧

1. 看破/连环采用显式表的charisma.low AND ambush；图中缺魅力低橙箭头，实际29橙边原样保存
2. 心攻采用3个月，现有截图第48行支持；ZOL6个月仍保留。不能用槽的imageMonths覆写候选
3. 祈愿采用5次，现有截图第62行支持；ZOL3次及祈愿/祈祷别称仍记录
4. 采用显式5槽；ZOL开头6、后文5的冲突不删除，未知抽样不以固定选择冒认
5. 戟兵B采用图示war.low；旧文leadership.low保留为分歧
6. 仅invention→征收是独立候选，不能因旧摘要未列而删除或与politics.high合并

来源图像hash是已有资料身份，不代表本版重新下载、观察或运行原作。完整冲突原文在state.catalog.conflicts以及[历史目录正文](historical-pk-ability-research-catalog.md)。

## 3. 初始场景与支持域

所有输入为闭合plain-data：拒绝多余/缺失字段、函数、undefined、symbol、accessor、循环、稀疏数组、非普通原型、非安全整数、NaN、Infinity和负零。Node24支持的Proxy检测拒绝Proxy；API支持域为普通数据，不允许依靠Proxy传参。JSON读取另拒绝重复key及转义同名key。安全ID为1..128个ASCII字符，首字符字母/数字，后续可含字母、数字、点、下划线、冒号和连字符。

- profile固定；date年1..9999、月1..12、日只1/11/21，turn非负安全整数
- scope的forceId/baseId/corpsId和city/gate/port不变；gold为0..1,000,000,000，AP0..255，TP0..10000
- officers数量0..256，ID唯一；每人forceId/baseId/available为初始化供应事实，可含不在本scope的人以明确拒绝，不能在运行中修改归属
- actedTurn为null或0..turn；五维leadership/war/intelligence/politics/charisma每项talent0..100、累计xp0..3000
- 六适性spear/halberd/crossbow/cavalry/siege/navy，每项C/B/A/S；skillKey为null或安全语义字符串，允许非研究特技作为已有值
- policies必须提交全部18族的id/version/parameters，与登记对象完整相等；同ID改参数仍拒绝
- 初态completedNodeIds为空、usesSpent全0、jobs/history空、reservation全null，由服务生成；构造器不接受预装解锁、次数或任务

这里只使用ordinary-no-age领域，不接受resolved-native-growth完成自动写回。可见五维=clamp(talent+floor(xp/100),1,100)，不另存可篡改的显示能力，也没有额外“研究+20余额”。

## 4. 完整具名政策

下表每条version均为1，全部生命周期政策标provisional-engine-rule；所依赖攻略数字另保留documented-guide来源。参数不是调用者自由调优；只有AP恢复允许在表中两个登记变体之间初始化选择。变化需要新版本/明确迁移，不重新解释已存任务。

| 族 | ID | 全部参数 |
|---|---|---|
| catalog | selected-guide-catalog-v1 | `{"catalogId":"pk-ability-research-guide-v1","canonicalSha256":"8f9480d1a032f94d1b0d934e477fd8c40d08a360f5ac9e7875a3fe6ef5abb0e9","preserveConflicts":6}` |
| hidden | explicit-five-fixed-v1 | `{"slots":10,"candidatesPerSlot":5,"selectedSlots":5,"candidatesPerSelectedSlot":1,"rngDraws":0,"mutable":false}` |
| researchFees | guide-300g-20ap-zero-tp-v1 | `{"gold":300,"actionPoints":20,"techniquePoints":0,"debitAt":"start"}` |
| researchActor | no-officer-assignment-v1 | `{"officerCount":0,"xp":0,"merit":0}` |
| researchCapacity | one-active-research-per-scope-v1 | `{"maximum":1,"mayOverlapCultivation":true}` |
| researchClock | guide-months-times-three-boundaries-v1 | `{"boundariesPerMonth":3,"allowedMonths":[3,4,5,6],"tickAtStart":false}` |
| cultivationFees | guide20ap-no-other-debit-v1 | `{"gold":0,"actionPoints":20,"techniquePoints":0,"debitAt":"start","zeroOtherDebitIsProvisional":true}` |
| cultivationClock | fixed-three-boundaries-v1 | `{"durationTurns":3,"tickAtStart":false,"provisional":true}` |
| cultivationCapacity | one-active-per-category-distinct-person-v1 | `{"perCategory":1,"total":3,"samePersonAcrossCategories":false,"scope":"whole-independent-force-scope"}` |
| qualification | supplied-same-scope-available-unacted-unreserved-v1 | `{"sameForce":true,"sameBase":true,"available":true,"actedThisTurnBlocks":true,"reservedBlocks":true}` |
| uses | reserve-at-start-spend-at-completion-v1 | `{"reserveAt":"start","spendAt":"completion","sharedAcrossOfficers":true}` |
| stats | s1-ordinary-no-age-guide-targets-v1 | `{"core":"s1-pk-stat-training-v1","low":70,"medium":80,"high":95,"externalMidJobWrites":false}` |
| aptitude | adjacent-c-to-b-b-to-a-v1 | `{"forB":"C","forA":"B","mayTrainS":false,"rawNativeEncoding":false}` |
| skill | guide-key-single-skill-replacement-v1 | `{"equalTargetBlocks":true,"replacement":true,"stacking":false,"nativeIdMapping":false}` |
| completion | research-then-stat-aptitude-skill-atomic-v1 | `{"order":["research","stat","aptitude","skill"],"officerActedAt":"completion-turn","atomic":true}` |
| apRecovery | fixed20-cap255-v1 | `{"increment":20,"cap":255}` |
| apRecovery | no-ap-recovery-v1 | `{"increment":0,"cap":255}` |
| persistence | strict-reexecute-from-genesis-v1 | `{"maxCommands":4096,"reserveMaximumActiveRemaining":true,"compareFullStateAndReceipts":true}` |
| presentation | no-rng-no-native-callback-v1 | `{"rngDraws":0,"callbacks":false}` |

默认每次Advance恢复AP20、上限255，用于有限账本持续研究整个53节点目录；可改选登记的no-ap-recovery-v1，恢复0。两者都是工程政策，不是原生恢复公式。没有金或技巧收入；15900金足够53×300的目录研究，这是目录算术，不是原作命令认证。无恢复时缺AP只阻止新Start，不阻止已付费任务完成。

## 5. 公共校验、幂等及失败顺序

三个命令都使用`{id,expectedRevision,command}`。先脱离输入引用、验证普通数据与状态完整来源，再验证命令闭合形状。已有成功ID且完整envelope相同，返回原receipt、duplicate=true，当前state保持不变；此判断先于revision。相同ID改expectedRevision或任何命令内容，返回command-id-conflict；新ID才检查expectedRevision是否等于当前revision。

接下来检查4096条成功命令历史容量与revision+1安全整数。失败只返回`{ok:false,reason}`，不登记ID、扣费、推进时间、改变人物或消耗次数。失败的ID可以在条件改变后重新提交。新ID重复业务不是幂等重试，会重新走资格并通常被already-researched/category-active等拒绝。

所有成功都在私有分叉形成完整效果，然后一次提交新冻结state和receipt。输入state/envelope不改变，输出冻结且无对外可写别名。状态导入从genesis全历史重算；不能靠caller更改终态再重算hash蒙混。

### 5.1 StartAbilityResearch确定顺序

1. 公共步骤成功后，baseId必须等于scope.baseId
2. nodeId必须在本场景48+5有效集合；未选隐藏候选一律inactive-or-unknown-node
3. 已完成拒绝node-already-researched；已有active研究拒绝research-already-active
4. allOf任一个未完成拒绝missing-prerequisite；研究历史不得超过53
5. 月数×3计算durationTurns及完整dueTurn/dueDate；同时检查全部active任务的剩余历史预算
6. 足额金300、AP20、TP0；先金再AP再TP检查，TP0也能成功。金299/AP19失败，金300/AP20精确归零
7. 建立research:<commandId>，保存开始日期、目录节点、政策全文、账户、已付费用和到期；remaining=duration，不在Start扣一旬
8. 原子扣金/AP，TP记录零写入；revision+1并保存envelope与receipt

Start不接officerIds，不标人物行动，不奖励XP/功绩，不消耗培育次数；武将人数或能力不会改变研究时间，这是明示政策。研究期间可开启符合条件的培育。

### 5.2 StartOfficerCultivation确定顺序

1. 公共步骤后检查base及有效节点；节点必须已经研究完成，否则node-not-researched
2. 对应stat/aptitude/skill类别必须空闲，否则cultivation-category-active；每类别最多一个，不与研究互斥
3. 人物存在，依次检查同势力、同据点、available、未本旬行动、未被任何类别预约；一个人不能跨类占位
4. 查询该node全scope次数：available=limit-spent-reserved，必须至少1
5. 按第6节进行类别资格与预期效果的安全预计算；无效不扣费/预约
6. 历史总培育job数上界为53个有效节点useLimit之和，按目录算出，不写死为50或按skillKey去重
7. 计算固定3旬到期，检查日期/整数/全active预算；AP须≥20，金和TP都0扣款
8. 建立cultivation:<commandId>，保存准确节点/目标、该人物开始快照、资格结果、预期效果、费用、全部政策；预期效果只作预约安全核对，不立即写人物
9. 原子扣AP20、增加该节点reserved、人物reservationJobId=job.id、actedTurn=currentTurn；spent不变，available减1

每次失败按上述先遇到的原因返回。研究/培育费用都只在Start扣一次；Advance不重复扣。一次只培育一个人物，不存在caller's target/useCount/forceComplete/elapsedTurns字段。

## 6. 三类资格与实际完成效果

### 6.1 五维强化

表2.1显式映射五维×低/中/高15项，目标为70/80/95。每项使用该attribute当前累计XP及ordinary-no-age talent。资格调用S1核心：先XP<2000，再currentGrowth<target。XP1999可继续看目标，XP2000直接xp-start-limit；当前值等于/大于目标拒绝growth-target-reached。

完成使用`completePkStatTraining`，不重新调用启动资格：

- growthBefore=clamp(talent+floor(xpBefore/100),1,100)
- requestedPoints=min(5,target-growthBefore)
- requestedXp=requestedPoints×100
- xpAfter=min(3000,xpBefore+requestedXp)
- creditedXp=xpAfter-xpBefore，clippedXp=requestedXp-creditedXp
- growthAfter=clamp(talent+floor(xpAfter/100),1,100)，actualGrowth=growthAfter-growthBefore

五维只写目标attribute的XP，talent及其余四维不变。请求点数可能不等于实际可见增长；没有另设研究+20计数。talent0初始显示1。S1独立完成函数仍接受已经开始任务的XP2000/3000、相等目标零增并拒绝负差，但本生命周期没有外部在途XP修改入口，不把这些不可达在途输入冒充已实现路径。

例如talent51、xp1900显示70，完成中级目标80可请求5点/500XP，变xp2400、显示75；再次培育该维度的任一档位会被该维度XP≥2000拦住；其他四维仍按各自XP和目标判断。目标/XP来自固定节点和人物，不能由命令绕开。开始时预计算同一完成算术并预约结果；到期再计算并核对完全相等，保证本profile无外部写入条件下可完成。

### 6.2 六兵科适性

表2.1覆盖spear/halberd/crossbow/cavalry/siege/navy各B/A共12项。B目标仅允许当前C，A目标仅允许当前B；C→A不跳级，B→B、A→A以及S→任意都拒绝aptitude-not-adjacent。到期精确替换目标兵科枚举，其余五兵科不变。

这是adjacent-c-to-b-b-to-a-v1的独立语义政策。S1 caller仅有相邻目标观察，完整getter/callee仍缺；C/B/A/S不是native raw编码推断。S只是保留的初始化语义，不提供S培育节点。

### 6.3 单一特技替换

21基础skill节点与表2.1的skillKey一一明确映射；隐藏目标直接取所选候选的skillKey。现有skillKey等于目标拒绝skill-already-known；null或不同已有特技允许。Start不写技能，第3旬完成才把唯一skillKey替换，收据保留before/after，不叠加。

不把guide键、目录序号或虚构0..99数字传给旧`qualifyPkSkillTraining`。旧API仍只接原生raw signed32标量，完整边界保留；这里是受其“相同有效技能阻挡、另一已有技能不阻挡”观察约束的显式语义政策。学得capture等标签没有额外战斗、捕缚或内政执行效果。

## 7. Advance逐旬、并行与原子完成

每条Advance只过一个旬界：1→11→21→下月1，十二月21→次年1月1。年9999之后或turn安全整数溢出，整条拒绝。没有任务也可Advance，仍按照选定政策恢复AP并记完整历史。

1. 在私有分叉计算新date/turn，记录AP恢复的before/requestedDelta/actualDelta/after/discarded
2. 收集active任务，严格排序研究→stat→aptitude→skill；不依赖对象键顺序或人物数组位置
3. 每项remaining减1并记录progress前后，非到期不写人物/解锁/计次
4. 研究到期：核对dueDate/dueTurn及固定快照，加入排序唯一completedNodeIds；保存解锁前/后，不发人物奖励，不变useLimit
5. 培育到期：核对本服务人物reservation、准确node/candidate/target、政策、开始属性与预约效果；执行第6节实际效果
6. 培育reserved减1、spent加1，available不变；释放reservation，actedTurn=newTurn；写唯一job.completion并标completed
7. 全部到期项处理成功才提交time/AP/progress/解锁/人物/次数/history/revision；任一内部不一致丢弃整个分叉，前面完成项也不半提交

完成不重跑是否本旬行动、是否available等启动gate；那些是静态供应事实，本服务保留其不变性。reservation与快照核对是完整性检查。完成当天同一人仍已行动，需再Advance一旬才能开始；其他未行动人物可在容量腾空后立即Start。刚解锁节点可在下一条Start使用，不在同一Advance自动安排新培育。

completed job永不再tick。重复相同Advance envelope只返回原receipt，时间/AP/完成不再执行；新ID Advance才推进一旬。余额不足不会中断已经付费并预留完成资源的任务。

## 8. 费用、计次、快照与收据

每个资源写入显式保存before、requestedDelta、actualDelta、after、cap、discarded、policyId。金与TP即使零扣也有收据；扣款actualDelta必须完整等于请求，不可截断成部分付款。AP恢复请求20时，若before250则actualDelta5、after255、discarded15；no-recovery则请求和实际都是0。

每次培育Start或培育完成的uses含nodeId、before/after的limit/spent/reserved/available以及policyId。例如limit3、spent0、reserved0、available3：Start后0/1/2；完成后1/0/2。研究解锁不消耗次数；相同技能、已达目标、AP不足或容量失败不耗次数。额度属于候选ID而非skillKey；同名不同候选不共享计次。

每job保存kind/category/nodeId/officerId、开始/到期turn/date、duration/remaining、status、费用、开始快照及唯一completion。快照仅保存对应一个人物而非整个世界，保存节点与全部政策，不复制完整目录到每条receipt；完整目录由state保留。预留的效果是Start时本服务计算的结果，调用者无写入入口。

完成收据包含jobId、nodeId和catalogCandidateId、turn/date、sourceLevel、lifecycleLevel、policyId。通用sourceLevel=documented-guide仅标目录/攻略来源，不能把五维数值核升级为documented原作；五维effect.result.evidence仍携带S1 compatibility-reconstruction来源。研究另有解锁前后；五维有XP/成长/请求与截断；适性/特技有字段before/after；培育都有uses和释放/行动标记。

## 9. 可完成性与4096条预算

初态researchJobs为0，最多53个；cultivationJobs最多Σ有效节点useLimit，最高不超过53×5=265。所有成功命令最多4096；失败和幂等重试不占槽。开始前必须有：

`historyLength + 1 + max(newDuration, 所有现存active.remainingTurns) <= 4096`

这里必须算所有active研究和培育；不能只给本次3旬培育保留3条而挤掉18旬研究的尾部。每个Start都重新检查，Advance增加1历史且所有remaining减1，因而不会破坏已留完成空间。revision也预检到最长尾部，turn/date为新任务完整到期预检；已存在任务的到期已在原Start预检。

人物同一时间唯一预约且没有外部数值编辑入口。五维预计算确认支持且XP cap3000，适性/技能是有限枚举/字符串替换，uses上限由目录约束，AP恢复饱和255；已接受任务不需未来新金/AP。因此只要调用方继续合法Advance，Start不会留下因历史、日历、整数或数值效果域不足而无法完成的预约。

边界例：若已有研究remaining18且historyLength4077，此时另开培育需要4077+1+18=4096可接受；再增加一个Start需要4097而拒绝。此时只能使用已预留槽Advance现有任务至完成；Advance令history增加1且最长remaining减1，二者之和不变，不会恢复新增Start容量。年9999-12-21不能再Advance，新研究/培育在到期越界时更早拒绝且不收费。turn接近MAX_SAFE_INTEGER时同理。

## 10. 保存、读取、重放与只读查看

save tag为san11-pk-ability-save-v1，trace tag为san11-pk-ability-trace-v1；与旧训练、技巧研究格式隔离。save包含完整genesis、目录、policies、所有envelope/receipt、jobs/startSnapshot/completion、人物/预约、次数和终态。规范JSON键排序，数组保留语义顺序，digest为规范UTF-8 JSON的SHA256。

load不接受已篡改状态作为权威。从genesis重新初始化，逐条执行完整成功envelope，逐条比较envelopeDigest/committedRevision/完整receipt，再比较整个重建state。catalog/policy/隐藏选择/费用/时间/XP/技能/次数/预约/快照/history均在比较内；不是只核最终digest。数据内没有外部信任的expectedResult作为计算输入。

replay允许步骤包含预期结果或null，预期只供比较；按命令实际计算成功、失败、幂等。成功才更新state；预期不匹配返回该步前状态和index。可选expectedFinalState比较完整终态，可选expectedFinalDigest再比较hash；即使两者null，仍从genesis重建完整history/receipts/snapshots，不仅返回一个digest。

inspect返回全部有效节点的缺失前置、useCount、研究是否可Start/原因/到期，当前研究及每类别任务、人物共同资格/派生五维、逐节点培育是否可Start/原因、剩余历史容量。preview在私有分叉计算同一receipt，不改输入。二者不接受“已通过资格”答案，也不自动调用Start。

## 11. 从空研究开始的静态演算示例

以下是规则算术说明和可提交的命令顺序，没有在本版运行。完整初始化见[data/scenarios/pk-ability-lifecycle-example-v1.json](../../data/scenarios/pk-ability-lifecycle-example-v1.json)：200-1-1/turn0，金15900、AP255、TP0，三名普通无年龄人物五维talent51/XP0、六适性C、无技能，五隐藏选择明列。

### 11.1 最短真实两阶段

- revision0提交research-war-low：StartAbilityResearch(base-example,stat.war.low)，金15900→15600，AP255→235，remaining9，人物XP0不变
- revision1..9分别提交九个不同ID的Advance；每次revision准确递增。前8次不解锁，第9次到200-4-1/turn9，stat.war.low进入completed；AP恢复到255
- revision10提交cultivate-war-low：StartOfficerCultivation(base-example,stat.war.low,officer-stat)，AP255→235，spent0/reserved1/available4；人物行动标记9，XP仍0
- revision11..13提交三个Advance；前两次XP0，第3次200-5-1/turn12，XP0→500、显示51→56，spent1/reserved0/available4，释放预约但actedTurn=12
- revision14同旬立即再培育此人应失败officer-acted-this-turn；失败无revision和次数变化。先Advance再开始则可继续，取决于目标与剩余次数

时间演算以一年12月、每月三旬界定义，不把公历月长当日数。每次Start不偷跑一旬。

### 11.2 全部类别与更深前置

从空研究依次研究war.low→halberd.b，各自等待9/12旬，halberd.b才可对C适性的officer-aptitude开始；3旬后仅halberd变B。想训练A必须另外满足并研究halberd.a（需navy.b），且人物当前B，不允许仅凭A节点已解锁让C跳级。

从空研究intelligence.low与politics.low（各9旬）→charisma.low（9旬）、ambush（9旬），表中选定hidden.intelligence-ro.option-1看破才满足双前置；研究9旬后可对officer-skill开始，3旬后skillKey变perception。只有ambush完成、缺charisma.low时不能研究看破，即使图中其他箭头已满足。

三个类别各有已解锁节点时，选择三个不同、当前未行动的人可并行；同时可开一个研究。所有到期在同一Advance按研究→stat→aptitude→skill处理。stat.war.medium必须先完成spear.b和navy.b两前置；不是仅做war.low便能研究。talent51/XP1900显示70的中级示例可通过低级四次培育积累达到，但必须按整张依赖图另行研究中级，不能构造器预装解锁替代链路。

### 11.3 全树静态安排

对于示例的5个隐藏选择，按下面推荐拓扑序逐个Start研究，再提交节点months×3个Advance，即可在规则上覆盖全部53个研究节点。该列表只由固定表的依赖静态排序生成，未执行产品或认证通过；每个Start金300，总金15900，起始默认AP255及每旬+20足够该串行安排。培育需另按资格/次数提交，研究顺序本身不发人物效果。

1. `stat.war.low`
2. `aptitude.halberd.b`
3. `aptitude.navy.b`
4. `aptitude.halberd.a`
5. `aptitude.navy.a`
6. `skill.support`
7. `aptitude.crossbow.b`
8. `aptitude.spear.b`
9. `stat.war.medium`
10. `aptitude.crossbow.a`
11. `aptitude.spear.a`
12. `skill.chain-attack`
13. `stat.leadership.low`
14. `skill.indomitable`
15. `skill.diamond`
16. `stat.leadership.medium`
17. `skill.overlord`
18. `stat.leadership.high`
19. `aptitude.siege.b`
20. `aptitude.cavalry.b`
21. `skill.range`
22. `aptitude.siege.a`
23. `aptitude.cavalry.a`
24. `stat.war.high`
25. `stat.intelligence.low`
26. `skill.ambush`
27. `skill.sweep`
28. `stat.politics.low`
29. `skill.fortification`
30. `skill.iron-wall`
31. `stat.intelligence.medium`
32. `stat.charisma.low`
33. `skill.transport`
34. `skill.intimidation`
35. `skill.clear-mirror`
36. `skill.deep-plan`
37. `stat.intelligence.high`
38. `stat.charisma.medium`
39. `stat.charisma.high`
40. `stat.politics.medium`
41. `skill.shipbuilding`
42. `skill.invention`
43. `stat.politics.high`
44. `skill.breeding`
45. `skill.efficient-official`
46. `skill.fame`
47. `skill.capture`
48. `skill.debater`
49. `hidden.war-i.option-1`
50. `hidden.leadership-i.option-1`
51. `hidden.intelligence-ro.option-1`
52. `hidden.politics-i.option-5`
53. `hidden.politics-ro.option-3`

## 12. 静态交付状态与仍开放事项

本版新增代码、完整规则、API、来源和静态场景；没有添加/删除测试，没有运行测试、编译、build、checker、产品、游戏或诊断。示例和算术推导不是运行输出，类型检查和运行正确性也未认证。既有旧默认全套food文件失败仍未解决，不沿用历史通过记录证明本树。

后续若进行独立验证，应覆盖每个48节点/52边/八双前置、每个隐藏候选的5槽配置、六冲突、费用299/300与AP19/20及TP0、三类并行/同人占用、useLimit1/3/5、XP1999/2000和目标边界、六兵科相邻、同技能拒绝/不同技能替换、日期1/11/21及跨年/9999、最长active历史预算、完整save/load/replay篡改、preview不变与旧服务隔离。本页列的是覆盖范围，不是本次已经运行的测试结果。

clean-stock PC-PK1.1可归属构建、原生98表与skill ID、隐藏随机算法/权重、完整原生资格/收费/调度/计次数写点、适性getter/完成writer、特殊人物成长、攻略与原生字段对应以及Vanilla/主机等价继续开放。原43证据主题口径不减。P078、native任务/归属/俘虏/取消链是明确范围排除，不是本独立实现等待的依赖。
