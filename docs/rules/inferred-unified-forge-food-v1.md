# v3 单锻冶建设与城/运输耗粮：同一时钟、库存和预约

依赖已合并Train/T28 main `9c1782f53f322a4f245bd5d621e7fd9a263954b7`。仍使用已有mobile v3稳定入口；新增可选forgeConfig/foodConfig参数和根字段，旧无字段的根不插默认值、不启用新扣款或工作。未知字段、伪造当前job/设施状态不接受。

## 单锻冶建设的有限配置

`forgeConfig={profile:'single-forge-owner-v1',facilityId}`要求progressConfig已启用（同一TP owner），目标必须是原cityScenario固定名单中的未完成1级forge。只开发该槽一次，不开放第二建设模式、吸收、任意新设施、改变级别或所有权。

typed action `{kind:'StartForge',officerIds}`，outer自己派生唯一`job:synthetic-forge-N`，不让用户提交既有工作/资源补丁。复用实际construction development叶、默认catalog/policy及advance/complete phases：金300、AP20、最大耐久800，默认初始work/政治工速与普通完成TP/政治XP/merit规则均由原核返回，不手写另一套工期。相关细节/证据见同批single-forge bridge规则。

开始必须同城同force、available、resident、未行动、未被其他生产或建设预约；固定无敌情profile沿当前只有本城合成owner且merchant敌情快照被排除的合同，不声称对真实周边侦察无敌。将来存在敌方空间owner时必须重新接敌距检查，不能沿用这一有限投影。

金/AP从当前city ledger一次扣；TP同progress。选人的reservationJobId、actedTurn和设施reservationJobId直接写**同一ledger**；没有第二个“建设可用人员”清单。job只记录工作/起点事实和剩余旬，不携第二城市余额。

## 真实贯穿旧生产，而非拼接输出

private `SyntheticForgeExtension`仅由本次完整outer重演所得forge状态生成，不是对外可信token。它贯穿currentInvariant、rootInvariant、advanceShared、transitionValidatedRoot：

- 所有预约都必须来自当前活动production job或当前活动forge job，且不能同时占同一个人/设施；job ID不能碰撞。没有无主锁、释放其他工作的锁或暂时清锁绕验证。
- 普通城务rootGuard直接读同一ledger锁，Train/Deploy/Grant也读它，因此建筑中的人不能被其他消费者重复使用。
- 生产job的type5 reserved库存、fees、startSnapshot、remaining与完成收据仍完整保留；forge不被伪装成production job，不改旧genesis。
- 仅在执行普通quantity production等城务时，private effective facility view投影当前forge.complete；原scenario保持不动。完成的forge因此真正可供下一条Produce使用，不仅是结果显示完成。旧默认extension为空，行为不变。

当前仅forge可变化，workshop与生产时间核的静态设施条件不被改写；多设施/升级/吸收仍非本profile。

## 同一WorldTick完成与费用原子性

具名跨域顺序：旧city一次advance/AP恢复/生产推进 → forge一次工作推进及普通完成 → 月工资/自然忠诚 → 中性城运输耗粮 → field一次Tick → 外层旅行Tick。该组合顺序为工程推断，不称原游戏调度opcode。

forge完成由旧completeConstructionPhase一次写回TP、所选人的politicsXP/merit/actedTurn，释放自身锁，并设置当前facility完成overlay；不是Closing战斗奖励。完成旬人物保持acted锁；不在同一Tick末额外清除。普通生产和forge可使用不相交人员按旧许可并行，不新增双建设模式。

所有消费者全成功、同turn/date、预算/容量/锁一致才返回；工资忠诚归零、field终结损耗、任何phase失败均回绝整Tick，没有先发建设奖励再丢后续错误。job剩余旬取生产/forge最大值，同时为world、citytimeline、field预留日志Tick槽，并检查旧city advanceLimit，不能接受注定超出当前horizon的开工。

## 中性耗粮的有限配置

`foodConfig={profile:'city-transport-neutral-food-v1'}`，只对当前城和已存在同owner transports执行。每次真正Tick调用pure `planSyntheticNeutralFoodTick`一次，从当前兵数/粮/容量投影旧ConsumeTurn的无火/无覆盖中性算术叶（exact source-bits有理数），写回food-only。已有交易/转运之后的下一Tick立即读新粮。

扣到food=0允许，已空跳过；缺粮只报告，不扣兵、不触发零兵终结，不改金/AP，不调用whole finance/season/health。火/设施覆盖**未建模**不是观测“无火”；当前field单位粮库存/耗粮未由此桥覆盖。receipt逐账户before/after及food-consumed-sink记录缺口，不声称整个战役后勤闭合。

食物配置在创世只作纯输入合法性投影验证，不提交消耗；只有接受的Tick有一次真实food patch。保存仅固定初值和统一commands，读档重演每个Tick一次，不通过重复load额外扣粮。

## 兼容与验证

createInferredMobileResourceWorld / createBoundedSyntheticMobileTimeline在progressConfig后新增可选forgeConfig、foodConfig。无这些字段的旧根仍不增对应输出。forge启用时输出当前forge、effectiveFacilities和completionTicksRequired，供外层实际预算检查；不是另一权威场景。

P078/Closing/真人归属伤亡/零终结持续排除。静态验收需同时看私有invariant调用链和helper：建设者被Train/Deploy/Produce拒、普通生产不丢史、完成后forge真实可生产、费用/奖励一次、重复id拒、任一失败无半状态、food0不损兵。没有执行候选、tests、typecheck或build；须最终整批独审。
