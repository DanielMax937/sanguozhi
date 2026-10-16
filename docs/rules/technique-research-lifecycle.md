# 独立技巧研究生命周期 v1

更新：2026-10-16。本文是具体工程规则；[API合同](../engine/technique-research-lifecycle.md)、[36项版本目录](../sources/technique-research-lifecycle-catalog.json)、[来源与限制](../sources/technique-research-lifecycle.json)分别提供调用入口、固定身份和证据登记。

## 1. 支持范围与证据等级

服务实现固定单势力、单城市、单军团内的技巧研究：开始资格→实际扣金/AP/技巧P→占用所选人员→逐旬倒计时→自动解锁/经验/功绩/释放。状态与旧训练 `GameState`、城市生产、耗粮补给及PK能力研究相互独立，不修改它们的资源或格式。技巧目录为0..35，内政32..35属于PK；这不是48节点的PK能力研究树。

唯一profile是 `standalone-technique-research-pk11-compat-v1`。`compat` 明确表示采用具名兼容政策，不承诺原作研究完整执行。两组时间是攻略fallback，功绩有两套冲突候选，逐人奖励和归零同事务结算均为provisional。任何strict-original profile、未知政策或改写参数均拒绝，绝不静默回退。原43组未决证据主题不因该服务减少。

| 内容 | 等级与不能推出的结论 |
|---|---|
| 36项身份、系、等级、费用、相关能力 | 既有混合结构化资料；每行保留原 `originalTechniqueRowEvidence`，不代表生命周期全链精确 |
| 最多3人、AP50、参与指导折扣、两格敌军开始gate | 官方日文合订手册的搜索索引文本；不是繁中PC-PK1.1二进制认证 |
| 人才府减2旬、最低1 | 既有地址级逆向记录；本服务直接使用显式本城完工事实，未恢复设施resolver |
| 两组基础时间 | `compatibility-guide-fallback`；未建模能力、难度矩阵 |
| 功绩两表 | 文献候选且高等级冲突；不能分别命名Vanilla表/PK表 |
| 单active、逐人全额、原子完成、释放、本旬行动、容量保护 | 独立服务政策，不是native caller结论 |

官方手册：[Steam发布PDF](https://cdn.akamai.steamstatic.com/steam/apps/628070/manuals/32sangokushi11wpk_manual.pdf?t=1516151052)。Playing Manual印刷页38描述最多3人、AP50和两格敌军；页18描述指导持有者参与；PK页9描述本城人才府缩时。本次只取得索引文本，47,138,551字节全文未取得，没有PDF字节SHA或页面像素证据。

## 2. 场景字段与合法域

场景为闭合plain-data对象，以下字段全部必填；无可省略默认值。政策可以从导出的默认常量完整复制，仍须在场景中提交全份快照。

| 字段 | 意义与约束 |
|---|---|
| `profile` | 上述固定compat profile |
| `date` | `{year,month,day}`；年1..9999、月1..12、日只能1/11/21 |
| `turn` | 非负安全整数，独立旬序号；可从任意合法日期与序号开始 |
| `force` | `{id,techniquePoints,completedTechniqueIds}`；技巧P 0..10000，已完成ID0..35不重复 |
| `corps` | `{id,actionPoints}`；AP 0..255 |
| `city` | `{id,gold,talentOffice,enemyWithinTwoCells}`；金0..1,000,000,000；人才府只能none/building/complete；敌军为显式boolean |
| `officers` | 0..256个武将，ID互异；少于合格人数时场景仍合法，Start自行拒绝 |
| 武将身份 | `id,forceId,cityId`；字符串匹配 `^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$` |
| 武将资格 | `available`为boolean；`actedTurn`为null或0..当前turn的整数 |
| 武将能力 | `effectiveAttributes`必须且只含leadership/war/intelligence/politics，各0..255；已解析事实，不自行读原生Basic/Actual/伤病getter |
| 武将技能 | `skillKeys`只能空数组或`["guidance"]`；不用姓名推断，不映射native特技ID |
| 武将奖励账本 | `xp`四维各0..1,000,000,000；`merit`同上；经验记账不提升effectiveAttributes |
| `difficulty` | beginner/advanced/super；记录但不参与fallback时长计算 |
| `policies` | 第4节全部14个政策族，每份`{id,version:1,parameters}`必须与注册值完全相同 |

初始技巧集合须为每系连续前缀：如有ID2必须已有1、0；不能自动补齐，不允许重复或未知ID。输入顺序可不同，新建时按数值排序。武将与所选参与者数组保持各自输入顺序。场景可含异城、异势力、不可用武将，只有实际选中才逐一拒绝。

`available`、所属、城市敌军和设施完工均是供应事实，不是服务从地图/人物表推导的答案。它们在本服务期间无修改入口。原生地图扫描、归属迁移、设施建造和人员变更不在范围。

除已知技巧P10000上限外，AP255、金额/XP/功绩十亿、能力255、日期与记录数量等上界是服务约束，不据此声称原作上限。

## 3. 36项身份、前置与能力

每系4级。除Lv1无前置外，必须先完成同系上一ID；一旦解锁不可重复研究。下表全部采用第5节相同等级费用/奖励表；A/B时长取第6节。

| ID | 系 | Lv | 名称 | 前置ID | 相关能力 | 时间组 | PK专有 |
|---:|---|---:|---|---|---|---|---|
| 0 | 枪兵 | 1 | 枪兵锻炼 | 无 | 统率 | A | 否 |
| 1 | 枪兵 | 2 | 兵粮袭击 | 0 | 统率 | A | 否 |
| 2 | 枪兵 | 3 | 奇袭 | 1 | 统率 | A | 否 |
| 3 | 枪兵 | 4 | 精锐枪兵 | 2 | 统率 | A | 否 |
| 4 | 戟兵 | 1 | 戟兵锻炼 | 无 | 统率 | A | 否 |
| 5 | 戟兵 | 2 | 矢盾 | 4 | 统率 | A | 否 |
| 6 | 戟兵 | 3 | 大盾 | 5 | 统率 | A | 否 |
| 7 | 戟兵 | 4 | 精锐戟兵 | 6 | 统率 | A | 否 |
| 8 | 弩兵 | 1 | 弩兵锻炼 | 无 | 统率 | A | 否 |
| 9 | 弩兵 | 2 | 应射 | 8 | 统率 | A | 否 |
| 10 | 弩兵 | 3 | 强弩 | 9 | 统率 | A | 否 |
| 11 | 弩兵 | 4 | 精锐弩兵 | 10 | 统率 | A | 否 |
| 12 | 骑兵 | 1 | 骑兵锻炼 | 无 | 统率 | A | 否 |
| 13 | 骑兵 | 2 | 良马产出 | 12 | 统率 | A | 否 |
| 14 | 骑兵 | 3 | 骑射 | 13 | 统率 | A | 否 |
| 15 | 骑兵 | 4 | 精锐骑兵 | 14 | 统率 | A | 否 |
| 16 | 练兵 | 1 | 熟练兵 | 无 | 武力 | A | 否 |
| 17 | 练兵 | 2 | 难所行军 | 16 | 武力 | A | 否 |
| 18 | 练兵 | 3 | 军制改革 | 17 | 武力 | A | 否 |
| 19 | 练兵 | 4 | 云梯 | 18 | 武力 | A | 否 |
| 20 | 发明 | 1 | 车轴强化 | 无 | 智力 | B | 否 |
| 21 | 发明 | 2 | 石造建筑 | 20 | 智力 | B | 否 |
| 22 | 发明 | 3 | 投石开发 | 21 | 智力 | B | 否 |
| 23 | 发明 | 4 | 霹雳 | 22 | 智力 | B | 否 |
| 24 | 防卫 | 1 | 工兵育成 | 无 | 政治 | B | 否 |
| 25 | 防卫 | 2 | 设施强化 | 24 | 政治 | B | 否 |
| 26 | 防卫 | 3 | 城壁强化 | 25 | 政治 | B | 否 |
| 27 | 防卫 | 4 | 防御强化 | 26 | 政治 | B | 否 |
| 28 | 火攻 | 1 | 木兽开发 | 无 | 智力 | B | 否 |
| 29 | 火攻 | 2 | 神火计 | 28 | 智力 | B | 否 |
| 30 | 火攻 | 3 | 火药炼成 | 29 | 智力 | B | 否 |
| 31 | 火攻 | 4 | 爆药炼成 | 30 | 智力 | B | 否 |
| 32 | 内政 | 1 | 木牛流马 | 无 | 政治 | B | 是 |
| 33 | 内政 | 2 | 港关扩张 | 32 | 政治 | B | 是 |
| 34 | 内政 | 3 | 政令整备 | 33 | 政治 | B | 是 |
| 35 | 内政 | 4 | 人心掌握 | 34 | 政治 | B | 是 |

完成只更新本服务的 `force.completedTechniqueIds`。上述36种战斗/生产/设施/士气/移动效果不自动应用到世界；其他只读面板若需要已完成ID，须由调用方显式组合，不能把列表回灌进仅支持技巧16的旧训练状态。

## 4. 完整版本化政策

政策族不可缺失或增加；比较的是id、version、全部parameters的规范数据，而非仅看id。参数、数组顺序、是否多余字段均参与比较，合法键顺序可不同。现有状态不支持中途换政策。

| 族 | 注册ID与参数语义 |
|---|---|
| participants | `one-to-three-distinct-v1`：minimum=1、maximum=3 |
| eligibility | `supplied-city-force-availability-v1`：enemyRadiusCells=2、unavailableBlocks=true、actedThisTurnBlocks=true |
| parallelism | `single-active-force-project-v1`：maximumActive=1 |
| fees | `catalog-exact-participating-guidance-v1`：actionPoints=50、guidanceGoldDivisor=2、guidanceStacks=false |
| attributes | `start-effective-attributes-snapshot-v1`：xpChangesEffectiveAbility=false |
| time | `guide-two-family-fallback-v1`：militaryTrainingTurns=[3,4,6,9]、otherTurns=[4,5,7,10]、abilityDependent=false、difficultyDependent=false |
| talentOffice | `complete-local-talent-office-minus2-min1-v1`：reduction=2、minimum=1 |
| merit | 默认`current-wiki-merit-candidate-v1`：[500,1000,2000,3000]；替代`early-guide-merit-candidate-v1`：[500,1000,1500,2500]；参数为byLevel及provisional=true |
| allocation | `each-selected-full-reward-v1`：recipients=all-selected-in-command-order、provisional=true |
| experience | `consumed-tp-div100-per-selected-v1`：divisor=100、provisionalAllocation=true |
| writer | `exact-debits-saturating-rewards-v1`：rewardCap=goldCap=1,000,000,000、techniquePointCap=10000、actionPointCap=255 |
| turn | `one-boundary-auto-complete-v1`：boundaries=1、completion=unlock-reward-release、completionActors=acted-new-turn、requireRepresentableDueDate=true、reserveCompletionHistoryCapacity=true、provisional=true |
| apRecovery | 默认`no-ap-recovery-v1`：increment=0、cap=255；替代`fixed20-cap255-v1`：increment=20、cap=255 |
| presentation | `no-presentation-rng-v1`：rngDraws=0 |

只开放两种功绩候选和两种AP恢复政策，共四种组合；没有“任意自定义日数/奖励”入口。所谓两组时间是一个明确fallback政策下按技巧系选择A/B，并非两套伪精确难度公式。

## 5. 一次性费用与完成奖励

| Lv | 技巧P扣款 | 基础金扣款 | 有参与指导时金 | AP扣款 | 每人相关XP请求 | 当前Wiki功绩候选 | 早期攻略功绩候选 |
|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 | 1000 | 1000 | 500 | 50 | 10 | 500 | 500 |
| 2 | 2000 | 2000 | 1000 | 50 | 20 | 1000 | 1000 |
| 3 | 3000 | 5000 | 2500 | 50 | 30 | 2000 | 1500 |
| 4 | 5000 | 10000 | 5000 | 50 | 50 | 3000 | 2500 |

开始时，至少一名**本次实际选中**武将带guidance才将金除以2，所有目录费用均可整除。未选中的同城指导无效；选中多个指导只折一次。指导不减AP、技巧P、时间，也不将部队经验倍增规则套到研究。

资金必须足额，不能部分支付或透支。费用收据 `gold/actionPoints/techniquePoints` 各保存 `before,requested,actualDelta,after,cap,discarded,policyId`。`requested`与`actualDelta`都是负扣款量，`after=before+actualDelta`，成功时二者相等、discarded=0。金/AP/TP全部核足后一起扣，不存在部分扣费失败。`guidanceParticipantIds`按所选顺序保存真正触发者；`discountApplied`明示是否折扣。

开始和中途tick均不发奖。归零完成时：

- `xpRequest = -job.fees.techniquePoints.actualDelta / 100`，读取真正已支付技巧P；对目录的相关能力记账
- `meritRequest = job.startSnapshot.policies.merit.parameters.byLevel[level-1]`
- 每名实际参与者各获得完整请求量，不平分；这只是 `each-selected-full-reward-v1` 的provisional选择
- 两种奖励都做 `credited=min(requested,cap-before)`，`after=before+credited`，`discarded=requested-credited`，cap=十亿
- 奖励收据额外保存 `credited`，并注明XP/功绩/逐人分配政策ID；已到cap仍可研究、解锁和释放，丢弃额可见
- 非相关能力XP、effectiveAttributes均不变；没有能力成长或新技能赋予

默认AP不会每旬恢复；替代政策每次Advance添加20并夹到255，收据记录请求、实际和丢弃量。该公式是服务政策，不能当原生AP恢复。无金或技巧P收入命令，没有退款。

## 6. 时长公式与旬历

| 组别 | 系 | Lv1..4基础旬数 | 本城人才府complete时 |
|---|---|---|---|
| A / military-training | 枪、戟、弩、骑、练兵 | 3 / 4 / 6 / 9 | 1 / 2 / 4 / 7 |
| B / invention-defense-fire-domestic | 发明、防卫、火攻、内政 | 4 / 5 / 7 / 10 | 2 / 3 / 5 / 8 |

`duration=max(1,baseTurns-(talentOffice==='complete'?2:0))`。building与none均不减；没有乘法叠加或能力加速。人才府尾修正有既有地址证据，但套用的基础值仍是fallback。

`relatedAbilitySum=sum(selected.effectiveAttributes[row.relatedAbility])`保存为开始观察；时间收据同时保存difficulty及 `abilityDependentTimingModeled:false,difficultyDependentTimingModeled:false`。哪怕两次能力和分别0与765、难度不同，所选fallback仍同长，不能把结果描述成已实现原作难度矩阵。

日历每次只推进1旬：月内1→11→21→下月1，十二月21→下一年一月1。`dueTurn=startTurn+duration`，开始时逐旬预算 `dueDate`；跨9999年或turn不再安全即整次拒绝。这个完结性gate避免先收费后无法完成，不是原作边界结论。

4096个接受命令是持久化预算。Start同时要求 `已有记录数+1+duration<=4096`，为自身开始和必需的所有tick留足空间；否则返回 `completion-history-capacity-unavailable`。该预算不代表原作限制。由于active期间不能接受另一Start，其余能接受的只有tick，重复重试不占槽，故不会因正常接受其他命令耗尽完成预算。

本旬Start只写remaining=duration，不立即减1。下一次Advance才减1；即便duration=1，也必须跨一次旬界。归零、解锁、发奖和释放同一命令完成。无active也允许Advance，供已完成参与者跨到下一旬后再用。

## 7. Start的确定顺序与原子边界

命令包只能是 `{id,expectedRevision,command}`，Start体只能包含type、cityId、techniqueId、officerIds。ID格式同实体ID，revision为非负安全整数。

1. detach闭合plain-data，校验整个状态或从genesis重算；校验命令包形状、1–3名人数与ID去重
2. 查已接受ID：完整envelope相同则返回原receipt、duplicate=true；同ID内容不同拒绝；之后才核expectedRevision
3. 核命令总预算、revision加1安全；在私有分叉状态中计算
4. 核城市、未研究、同系前置、无active及研究记录上界36
5. 对已通过形状/人数/去重的参与者，按输入顺序逐一存在→同势力→在本城→available→未被本服务reserved→本旬未行动
6. 敌军两格gate为true即拒绝；只读supplied boolean，不做原生距离扫描
7. 从固定目录和已选者算费用、指导、相关能力和；算完整时长、dueTurn、dueDate及完成历史预算
8. 依次核金、AP、技巧P足额；随后原子扣三账户、建立 `research:<commandId>`、保留参与者并标actedTurn=startTurn
9. revision+1，保存完整envelope、其摘要、receipt；输出深冻结状态

任何失败不返回可提交的新状态，不改变输入或历史；失败ID不登记，因此修正前置后可重用。多个不合格条件同时存在时，以上述顺序首次失败为准。

## 8. Advance与自动完成的确定顺序

Advance体仅 `{type:'AdvanceResearchTurn'}`；caller不得给elapsedTurns、remaining、完成列表或奖励答案。

1. 共用幂等/revision/历史预算处理
2. 先核新turn与下一日期可表示，再在私有分叉推进；收据保存before/after turn/date
3. 按AP政策记本旬恢复；默认也写一条请求0的收据
4. 若有active，则remaining减1，并在boundary保存旧值/新值；大于0时无额外扣款或奖励
5. 到0时，从job保存的人员ID找到当前服务武将并逐一确认reservation恰好指向该job；拒绝不一致
6. 确认技巧尚未解锁，保存旧集合，再加入并排序
7. 按所选顺序逐人记相关XP和功绩，使用job的政策快照与实际费用
8. 只清这些人的本服务reservation，全部设actedTurn=newTurn；job记completed、completedTurn和唯一completion
9. revision+1、记录receipt，整笔提交

完成当旬参与者不能立即再Start；再Advance一旬后，旧actedTurn不再等于当前turn而自然可用，不清全城所有人的标记。未参与者不受影响。完成job永久保留，后续tick不再触碰它，重复同ID tick只返回原收据，因此不二次奖励。

完成收据含jobId/techniqueId/turn/date、解锁前后集合、逐人奖励、releasedOfficerIds、actedTurn、turnPolicyId。操作没有外部回调，解锁/奖励/释放不会出现半提交。

这是独立服务的完成顺序。既有 `00599CF0` 技巧分支只递减，不能据服务行为把它重新标成原生完成writer。无Complete、force-complete、cancel、退款、任务改派或原生mission入口。

## 9. 派生状态与持久化实质

State完整保存场景当前值，并增加：`schemaVersion:1`、固定scope、revision、initialScenario、完整catalog及catalogDigest、policyDigest、researchJobs、appliedCommands。当前武将比primitive多一个 `reservationJobId`，由服务初始置null，场景拒绝caller提交该字段。

job保存身份、状态、参与者、start/duration/remaining/dueTurn、timing、fees、completedTurn/completion；startSnapshot包含日期/旬、本城事实、difficulty、各参与者的开始前属性/奖励/标记、目录行和完整政策。不能caller直接创建active/completed job。

- preview和execute走同一transition；preview只返回receipt、duplicate与baseRevision，不提交状态
- 输出全层冻结；接受合法冻结输入及对象键序变化
- save格式为 `{tag:'san11-technique-research-save-v1',state}` 的规范JSON
- load从initialScenario重建revision0，逐条执行接受过的完整envelope，再逐条比较整个applied entry与最后全部派生状态；不是只看hash
- catalog或完整policy参数不匹配即拒绝；金额、dueDate、奖励、reservation、completed集合、历史顺序或receipt被改，即使重写摘要仍须通过同一实质重算
- replay tag为`san11-technique-research-trace-v1`，强制带完整catalog、catalogDigest、initialScenario、steps和可空expectedFinalDigest；目录全文/摘要必须匹配当前固定v1，即便所有expected为null也不跳过目录核对；每步expected可为null、成功receipt或失败reason；expected只比较，不参与计算
- replay失败命令保持状态；期望不符则返回该步前状态与index；末状态摘要不符返回全部已执行状态及失败原因
- 摘要为对规范JSON UTF-8的SHA-256，标识一致性，非签名、非存档防伪认证

预算：任意数组最多4096项；对象遍历最多2,000,000个值节点，深度64；字符串值累计和序列化文本分别最多67,108,864个UTF-16 code units，**不是字节数**。id另有128字符限制。JSON解析拒绝重复key，包括转义后同名；拒绝额外字段、getter/setter、symbol、循环、稀疏/额外属性数组、undefined、非有限/非安全整数、负零、字符串转数字。支持Node `process.getBuiltinModule('node:util').types.isProxy`的运行时可先拒绝Proxy；其他运行时不能可靠识别所有Proxy，不把它描述成通用安全沙箱。

## 10. 具体失败边界

| 边界 | 代表reason |
|---|---|
| 不支持profile/policy/catalog/schema/command | unsupported-profile / unsupported-policy / unsupported-catalog / unsupported-schema / unsupported-command |
| 数据形状、非法标量、额外key | invalid-input / invalid-state / unexpected-field |
| 初始前置不连续或重复 | missing-initial-prerequisite / duplicate-technique |
| 命令ID复用、revision不匹配、历史已满 | command-id-conflict / revision-conflict / command-history-full |
| 未知城、已解锁、前置不足、研究占用 | unknown-city / technique-already-completed / missing-prerequisite / research-already-active |
| 人数/重复/未知武将 | invalid-officer-count / duplicate-officer / unknown-officer |
| 势力/城市/可用/预约/本旬行动 | officer-wrong-force / officer-not-present / officer-unavailable / officer-research-reserved / officer-acted-this-turn |
| 两格敌军 | enemy-within-two-cells |
| 不足金/AP/技巧P | insufficient-gold / insufficient-ap / insufficient-technique-points |
| 日期、turn、revision溢出；无法保留完成记录 | calendar-overflow / turn-overflow / revision-overflow / completion-history-capacity-unavailable |
| 完成reservation或重复解锁不一致 | reservation-mismatch / completion-already-unlocked；正常服务历史不会产生该状态 |
| 保存历史/派生状态不符 | state-history-mismatch / state-recomputation-mismatch |
| JSON/保存/trace限制 | invalid-json / duplicate-json-key / save-too-large / invalid-save / invalid-trace |
| 重放期望不符 | replay-outcome-mismatch / replay-final-mismatch |

旧存档不自动迁移，本服务存档不能交给旧训练load；输出也不表示原生部队/城市/人员已发生变化。没有RNG抽取，所有receipt的rngDraws=0。

## 11. 手算例与静态示例

[示例场景](../../data/scenarios/technique-research-example-v1.json)为手工数据，未执行。设本城人才府complete，选中的guide-1为指导，研究枪兵锻炼ID0：基础金1000→实际扣500，AP扣50、技巧P扣1000，A组Lv1的3旬减2得到1旬；相关能力和只记录。Start当旬无奖励；下一Advance解锁0，参与者统率XP请求10、功绩请求500，各自饱和入账，reservation释放且actedTurn记完成旬。

若指导只存在未选人员中，金仍1000。若人才府building，时长仍3旬。若研究发明Lv1 ID20，完工人才府下为4−2=2旬。Lv3研究的功绩按所选政策分别为每人2000或1500；这些算例是文中公式推演，不是运行结果。

## 12. 原证据冲突保持与验证状态

旧 `techniques.json research.officers:3`原值保留，新增maximum语义；旧三名时间观察不改锚点，不再宣称指令固定必须三名。旧 `researchTimeLeftType:'short'`保留为结构布局描述；来源中00599D7A实际读取+A0低byte，二者并列，不能推出字段整体布局或setter写宽。S1/S2源均MOD关联；本轮没有取EXE、下载IDB或新反汇编。

两套功绩、原生完成人员分配、完整时长矩阵、Basic/Actual读取、完成writer及原生执行顺序均保持open。相关旧文见[时间](26-technique-research-time.md)、[时间边界](49-technique-research-time-exactness.md)、[功绩](27-technique-research-merit.md)、[完成writer边界](73-technique-research-completion-writer-boundary.md)。

本次仅修改代码、静态示例及规则文档；没有运行测试、typecheck、构建、checker、诊断、游戏或demo。不能写本树通过或沿用历史验收证明它。旧默认全套food文件失败仍未解决。P0-78及其依赖、原生任务/归属/迁移/返回/取消/退款、真实人员死亡俘虏与势力灭亡、资源跨服务共享和36项世界效果应用全部排除。
