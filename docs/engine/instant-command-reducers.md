# 包内即时命令归约器

本页说明旧独立城市命令与独立商人服务的内部兼容抽取。巡察、征兵、数量生产和买卖粮的具体游戏规则分别仍以[城市命令规则](../rules/city-command-lifecycle.md)与[商人规则](../rules/city-merchant-lifecycle.md)为准；本页没有新增游戏规则、公共profile或共用世界账本。

## 状态与入口

此次修改仅经过静态文本分析。没有运行产品、示例、测试、typecheck、编译、build、runtime、checker或validator，也没有由本修改取得新的CI通过证据。历史验证限制继续适用，不据此宣称运行兼容、全部验证通过或原作等价。

公开调用仍从 `packages/engine/src/index.ts` 进入原 `city-command-lifecycle.ts` 或 `city-merchant-lifecycle.ts`。`index.ts` 与package exports未增加内部出口。以下文件仅供包内复用，不是稳定公共API：

- `internal/city-service-types.ts`：城市即时frame、audit、封闭拒绝类型与原数值结构
- `internal/city-domestic-leaves.ts`：原writer、核审计保留、设施倍率、征兵捕获、价格/数量计算、奖励计划
- `internal/city-instant-reducer.ts`：Patrol、Recruit、Produce 1/2/3/4的一次候选计算
- `internal/city-merchant-types.ts`、`internal/city-merchant-trade-reducer.ts`：原商人结构与一次BuyFood/SellFood候选计算

内部文件不反向运行时导入lifecycle、barrel或council。数值叶继续调用既有五个数值核；生产时间核及其技能82/83、造船厂/练兵所信息留在旧城市owner。内部模块没有注册表、信任token、保存载入器、命令历史或可推进的时钟。

## 数据所有权与边界

旧公开入口仍先执行自己的脱离输入、完整验证、历史重建与预算检查。已有城市trusted WeakSet和商人genesis重建流程保持各自原有边界；调用内部函数不能把任意最终state变成可信输入。

每次调用携带两个值：完整原始commandId及当前turn。城市ID仍适用原128字符域，不截断成未来其他接口的长度，也不派生新的子命令ID。商人不会因为内部context而新增事件或审计字段。

owner组装脱离外部调用者的普通数据视图，归约器另建自有工作副本。成功给出候选frame与audit，失败给出封闭reason；未知JavaScript异常继续向旧外层传播。返回数据不会与输入、policy或catalog保留可变别名，不冻结调用者对象。审计回写保留原number值；只有原来就使用JSON副本的核input/output保留步骤仍按原方法复制。

这不是额外的不可信输入接口。内部类型不会再次解析或收窄旧公共输入，更不能用它替代旧Proxy、数据预算和历史验证。禁止通过deep import将内部候选直接提交到公开state。

## 城市即时视图与回写

输入包括当前gold/security/troops/morale/AP、四种数量装备的quantity/capacity/reserved、全部旧人物和设施、真实acted/used/reservation标记、压力、难度、控制方、解锁与特产装备、四种价格，以及原八族即时政策：attributes、facilityMultiplier、writer、morale、productionAp、rewards、zeroYield、presentation。

人物与设施继续接受旧宽域：可以没有人物，完整人物上限256，旧0..255技能与全部五种设施类型保留。没有把一个新场景的更窄设施/技能域强加到旧服务。frame不含jobs、日期、revision、genesis或十装备完整库存。

owner只按下表回写，不能整体替换city、officers、facilities或inventory：

| 动作 | 资源与城市字段 | 选中人物、设施字段 |
|---|---|---|
| Patrol | gold、security、patrolUsedTurn、AP | 对应policy的XP维度、merit、actedTurn |
| Recruit | gold、troops、security、morale、AP | 对应XP维度、merit、actedTurn、所选facility.usedTurn |
| Produce 1–4 | gold、相应库存quantity、AP | 对应XP维度、merit、actedTurn、所选facility.usedTurn |

其余库存、reserved、预约job、能力、成员身份和数组原序均保留。奖励维度来自policy，数量生产可按原政策奖励intelligence或politics，不能硬编码。

外壳仍先建立旧receipt seed，只用audit替换calculation、fees、rewards、events、sideEffectsNotModeled与rngDraws；commandId、revision、turn、taskKind、newJobId、completions与apRecovery由原owner持有。即时事件只有一次 `command-committed`，subjectId等于完整原envelope.id。

### 不能移动的顺序

1. 公开state/envelope验证后，先同ID重试或冲突、stale revision、历史上限、revision溢出，再fork与receipt seed
2. city匹配；仅Patrol检查本旬巡察使用标记
3. 按officerIds原序，每人依次检查存在、成员、所在城市、available、生产预约、已行动
4. 设置selectedOfficerIds，再按原顺序检查非Patrol设施的存在、所在城市、完成、类别、预约、已使用
5. 计算、writer、奖励；Produce先检查解锁。核错误和writer溢出仍可能早于费用不足
6. 即时零产出拒绝政策，随后先缺金、再缺AP
7. 先金费writer、再AP writer；sourceApRequest仍20，实际数量生产AP为注册政策的20或25
8. selected人物acted、设施used、唯一commit事件；最后由owner增加revision并追加历史

首个拒绝立即回到城市原fail通道，reason拼写不统一成商人或未来根服务的reason。失败不回传部分候选，不占用命令ID。

### 数值与审计维护要点

- Patrol保留压力输入、100治安上限、原writer返回语义和奖励。零实际增量仍由原zeroYield政策决定是否收费及奖励
- Recruit保留固定3 slots、skill79、先probe选择容量捕获分支，再正式核。probe不进入kernels数组
- super映射difficultyWord=2；player映射EAX1，ai映射EAX0，既有核EAX0加倍。不能借重构调整这个旧算法
- 征兵治安核接troopWrite.returned的U32映射；气力使用actualDelta及本步开始的security。actualDelta=0仍走原加权、floor/ceil、最低20与cap步骤
- Produce按price再quantity保留审计；特产价格、三slots、skill80/81和f32倍率字串都沿用旧核
- writer保留before/requested/returned/actualDelta/after/cap/discarded/policyId全部字段，包括signed审计；不能套用账本非负数域删减信息
- rewards按选择顺序，先XP再merit，饱和仍保留before=after的Write；即时2XP/50merit、完成4XP/100merit来自原policy
- sideEffectsNotModeled仍依次为technique-points、native-stat-growth、native-writer-semantics、native-personnel-tasks、native-corps-effects、presentation-rng；rngDraws仍0

## 旧piece与Advance归属

Produce 5/6/7/8/10/11继续走旧piece控制流。它复用同一价格、quantity、writer与reward叶；时间捕获、duration、生产历史、容量预约、dueTurn、startSnapshot、job和两项事件留在owner。startSnapshot仍在费用与acted回写之前拍摄；job fees仍回填一次。事件顺序仍为production-started、command-committed。

AdvanceCityTurn的日期、turn、AP恢复、按job.id词法顺序完成、库存writer核对、完成奖励、人物/设施释放预约与末尾turn-advanced全部留原流程。完成设施不会因此新增usedTurn写入，job费用不会重扣。城市恢复政策原有0/20/40继续适用。

active piece存在时，未预约人物可按旧规则执行即时动作；预约字段真实传入frame，被预约人物/设施仍先于acted/used拒绝。即时归约器不能清除或覆盖这些锁。

## 商人即时视图与回写

商人输入包括activeForceId、完整hostileForceIds、当前corps/city/officers、completeFieldUnits与按原序提供的fieldUnits、原固定catalog；政策视图精确为ownership、eligibility、hostility、pricing、zeroSale、capacity、rewards七族。apRecovery、calendar、inputs、budget和persistence仍归旧owner。

只回写city.gold/food/merchantUsedTurn、corps.actionPoints、选中officer.politicsXp/actedTurn。没有新merit字段，也没有把固定0的merit/TP/loyalty审计当作另一个实际账本。

旧resolve保留完整snapshot fork及receipt metadata：schema/profile/command、前后revision/date/turn、digest、sourceBoundary、cityId与advance。归约器提供原ownerSnapshot/actionPoints、固定零字段和trade，原owner最后仅一次revision++与dateAfter/turnAfter收尾。没有新增merchant events字段。

拒绝顺序仍为city匹配、城市类型、owner/corps、商人存在、城市使用标记、人物存在/城势力/available/acted、政治数域、完整敌情检查、AP、政治插值、金有理数与结算、零价卖出、金额域、买缺金/粮容量或卖缺粮/金容量。多个敌军按输入数组首个blockingUnitId拒绝。typed rejection桥接原fail(reason, null, blockingUnitId)，重建与replay仍由旧外层补原index。

金额继续用未约分BigInt分数，买ceil、卖floor，保留remainder与roundingDifference。trade.writes顺序为gold、food；requested保持正成交量，actualDelta与counterparty delta保留原符号。政治XP的全部before/requested/actualDelta/after/cap/discarded及politicsBefore/After字段保留。固定金费、merit、TP、loyalty、rngDraws继续为原0。

AdvanceMerchantTurn继续由旧owner检查advance-limit、turn-overflow、missing-turn-input，推进日期与外部输入，再恢复AP并完成收据。只保留原注册0/20恢复，不增加40。原horizon、acceptedCommands、envelope revision及trace预算不变。

## 公共兼容面

两个服务继续各自的create/preview/execute/save/load/replay协议。城市create返回State或Failure，商人create返回包含state的成功对象或Failure；城市preview仍有baseRevision，商人仍有projectedSnapshot和committed:false；save仍分别使用serialized与json。旧tags、canonical排序、数组顺序、重试语义与失败时是否携带前缀state均由旧接口决定。

council仍只调用原城市公共preview/execute/save，不直接调用这些内部归约器。原普通TP未建模和完成奖投影不变。旧CLI、示例、季节服务与入口exports也未为此次抽取改变。共用内部函数并不表示城市与商人已经共用AP、gold、人物经验、行动标记、clock或save协议。

## 巡察窄阶段

[私有巡察候选阶段](city-patrol-phase.md)说明 `city-patrol-phase-types.ts` 与 `applyPatrolPhase`。旧 reduceDomesticInstant 先保持全宽 frame/action/context 的 copyOwned 和全新 emptyCalculation，再仅将 Patrol 分流；Recruit/Produce 的原资格、设施、算术、奖励与费用尾继续保留。公共入口、保存与预算不新增字段。

阶段只接真实身份/leadership/五维XP/merit/标记、city gold/security/巡察标记、AP、supplied pressure 和三族原政策，不需要无关宽字段。阶段直接修改 owner 独占候选，不自行 clone/freeze；失败须丢弃整个候选。旧 root 成功仍深冻全宽 candidate 与完整原 audit，失败仍为 mutable reason。城→巡察标记→原选择序人物六门→核/writer→标记/奖励→零收益→金/AP门→两费用writer→acted 顺序不变；完整核审计仍过滤 evidence，所有 null/false、八字段 Write、事件完整ID和原政策语义保留。该抽取仅静态分析，未测试或执行，未关闭原生来源证据缺口。
