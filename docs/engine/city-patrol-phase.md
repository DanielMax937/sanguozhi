# 私有巡察候选阶段

`internal/city-patrol-phase.ts` 的 `applyPatrolPhase(context, view, action, calculation)` 抽取已有巡察的一次候选计算。`internal/city-patrol-phase-types.ts` 只声明内部类型；两者均不是 package exports 或公共 API。旧 `reduceDomesticInstant` 保持兼容入口，城市命令、BoundedCityEconomy、BoundedCityPieceClock 仍由各自 owner 管理。没有新增市场接口、规则 profile 或保存协议。

本次抽取仅作静态源码分析，未运行测试、build、compile、typecheck、runtime、产品 import、validator、checker 或场景，不能据此宣称运行兼容或原作等价。业务规则见[城市命令](../rules/city-command-lifecycle.md)，核的独立域与证据见[巡察治安](../rules/patrol-security-gain.md)和[来源 manifest](../sources/patrol-security-gain.json)。费用、资格、奖励 writer、时序仍属于 provisional 工程服务规则。

## 类型与所有权

- `PatrolPhaseOfficer` 是旧 Officer 的 id、forceId、cityId、available、leadership、xp、merit、actedTurn、reservationJobId 投影。xp 保持真实五维 `Record<Stat, number>`；奖励属性从原 rewards 政策的 patrol 字段读取，不硬编码统率
- `PatrolPhaseView` 包含 activeForceId、corps.actionPoints、city 的 id/gold/security/patrolUsedTurn、上述 officers、pressureActive，以及 writer/rewards/zeroYield 三族原政策
- `PatrolPhaseAction` 是旧 DomesticInstantAction 中 type=Patrol 的 Extract；`PatrolPhaseResult` 是原 `DomesticLeafResult<DomesticInstantAudit>`。不新造失败品牌或 audit
- context/action 为 DeepRO；view 是 owner 独占的可写临时候选，calculation 必须是本次刚由 emptyCalculation 创建的空对象。不可复用上一次命令的计算对象

这是已验证数据的内部阶段，不是 parser、可信状态工厂或提交接口。不新增 record/prototype、ID、重复、人数、marker 或数域验证；这些继续由各自公共入口负责。普通内部对象已脱离外部输入，不能传外部 state 作为可写 view。结构兼容允许旧全宽 frame 直接作为 view，但阶段不展开、复制、枚举整个 view/city/officer，不取得 兵力、气力、库存、设施、价格、魅力、智力或技能等无关字段。

旧 reducer 仍依次 copyOwned(frame)、copyOwned(action)、copyOwned(context)、emptyCalculation，随后仅 Patrol 分流。成功用原 freezeOwned 一次递归冻结全宽 candidate 与原 audit；不冻结调用者输入或其政策/catalog，不丢弃全宽非写域。phase 本身不 clone、不 freeze、不提交历史；成功壳及失败对象都是 mutable。失败可发生在临时候选已改写之后，调用者必须丢弃整候选，不能局部回滚后继续复用。旧 root 不向外泄露失败的候选或计算对象。未知 JavaScript 异常继续传播。

将来其他 owner 使用平铺 XP DTO 时，必须从真实当前进度建立独占窄 staging，并在全部根门成功后按白名单写回；不得伪造宽 frame、用零填五维 XP 或以政治替代统率。此处不提供该适配或 reserve 逻辑。

## 严格执行顺序

1. action.cityId 不匹配先 unknown-city；随后同 turn 的 patrolUsedTurn 拒绝 patrol-already-used
2. 按 officerIds 原序逐一 find 第一个匹配人物。每人依次 unknown-officer、officer-not-member、officer-not-present、officer-unavailable、officer-production-reserved、officer-already-acted；预约 `!== null` 早于已行动 `=== turn`。全过后才加入 people，不排序或去重
3. 复制 officerIds 到 calculation.selectedOfficerIds；调用原 patrolSecurityGain 一次。失败原样返回，不能绕过 leaf 重算公式
4. 用原 writer 对 security 写入核返回，cap=100；先记 securityWrite，再写 security，再取 actualDelta 作为 yieldActual。returned 的 requested/actual 政策不会改变判零字段
5. 先写 patrolUsedTurn，再调 planRewards(people, 'patrol', 原 rewards)。按原 index 写 policy 对应 XP，随后 merit；保持 plan.rewards 同一数组和人员顺序。奖励算术仍只有原 leaf
6. 奖励之后，只有 actualDelta=0 且 zeroYield.parameters.zero='reject' 才 zero-yield；其他原政策值继续。核/writer/reward 错误均可早于费用不足
7. 先检查 gold<100，再 AP<20，分别 insufficient-gold、insufficient-ap；100 金/20 AP 恰好足够可归零
8. 先金费 writer：requested=`-gold || 0`、cap=1,000,000,000；再 AP writer：requested=-20、cap=255。两者用原 DEBIT `exact-affordable-debit-v1`，不是 owner 的资源 writer 或新容量
9. fees 原序为 gold、actionPoints、sourceApRequest=20、effectiveApCost=20；费用均成功后先写 gold，再写 AP，然后按 people 序写 actedTurn
10. 返回原 audit：calculation、fees、rewards、唯一 command-committed 事件（完整 context.commandId）、新建 sideEffectsNotModeled 数组、rngDraws=0

业务失败复用原 DomesticReason；Patrol 不因共享 union 而产生设施错误。没有新 failure wrapper、index、proposal 或 state 字段。满治安时 pay 政策仍收费、成长并消耗机会；reject 政策丢弃候选。BoundedCityEconomy 原固定普通巡察每人请求2 XP/50 merit、上限1e9；独立城市仍保留原完整注册 writer/zero/reward 政策域。

允许写集合精确为 city.security/patrolUsedTurn/gold、corps.actionPoints、所选人物 xp[政策属性]/merit/actedTurn，以及 calculation 的 selectedOfficerIds/securityKernelReturn/securityWrite/kernels。身份、能力、available、reservation、其他 XP、数组顺序、设施、时钟、revision、genesis、history 不写。

## 完整审计

emptyCalculation 的字段顺序与初值不变：observationKind='derived-adapter-observations'、selectedOfficerIds、securityKernelReturn、quantityKernelReturn、quantityPreCapacity、priceKernelReturn、timeKernelReturn、facilityApplied、earlyCharmSum、moraleSecuritySnapshot、newRecruitMorale、securityWrite、troopWrite、inventoryWrite、moraleWrite、kernels。Patrol 只填选择列表、securityKernelReturn、securityWrite、kernels；其他 number/write 仍 null，facilityApplied 仍 false，不省略或换 undefined。

成功 kernels 恰一项，api='calculatePatrolSecurityGain'。input 的 profile='patrol-security-gain-stable-v1'，resolvedLeadershipSlots 按选择序取真实 leadership，publicOrderByte 为写前 security，pressureHelperEax 为 supplied 布尔映射的0/1。retainKernel 保持原 JSON 复制 input，并过滤 output.evidence 后复制 output；unsupported 变为 kernel-rejected，不产生成功核记录。

output 保留 supported/profile/normalizedLeadershipSlots/publicOrderByte/pressureHelperEax/sumLeadership/baseGain/afterPressure/returnedDelta/pressureApplied/capBranch；normalizedLeadershipSlots 的三项及尾 null 不缩短。核审计 JSON 复制的 signed-zero 语义与普通 copyOwned 保留 primitive signed zero 的语义分别保持。不得把 evidence、公式摘要或阶段壳加入旧 audit。

每个 Write 完整八字段：before/requested/returned/actualDelta/after/cap/discarded/policyId。每位 reward 完整 officerId/attribute/xp/merit，XP 与 merit 是独立 Write，按原 ACCUMULATE `saturating-accumulator-v1` 先 XP 后 merit，饱和也保留零变化 Write。

sideEffectsNotModeled 顺序固定：technique-points、native-stat-growth、native-writer-semantics、native-personnel-tasks、native-corps-effects、presentation-rng。rngDraws=0，不新增随机或能力成长。

## 旧调用者、其他命令与预算

三个 owner 的 parser、policy registry、detach、信任/重建、dedup、revision、domain、reduce、白名单回写、invariant、fit/save/trace 顺序保持。独立城市 ID 重试/冲突、stale revision 仍在 reducer 前；bounded 的 actionIndex/stage、全历史 fold、unexpected-reducer-effect 与整批回滚不变。

Recruit/Produce 保留原 applyRewardPlan 及原计算/共用费用尾。Recruit 的 earlyCharmSum、写前 security 气力快照、无审计 probe、troopWrite.returned 的 U32、加权气力 floor/ceil/min/cap 和零兵 writer 不变。Produce 保留解锁→价格→数量、reserved 库存、特产、f32、super/player/ai、注册 AP20/25 和奖励维度；零价格仍用 `-gold || 0` 产生 +0。旧设施存在/位置/完成/类别/预约/used 门顺序、末尾 used 标记、piece 生产/完成/锁、Advance 与 council 调用边界均保留。

兼容论证是单步 full candidate/audit 与 failure 同值、三个 owner 原实现不变，因而按 accepted prefix 归纳保留原 snapshot/ledger/receipt、最早或最新 duplicate 旧收据、失败 stage/index、save/load/replay、preview/execute，以及原本提供的 inspect/legal 分页。独立 city 不新增 inspect API；公共 index、exports、类型/tag、canonical、版本和保存文本形状不变。

限额没有统一或迁移：独立 city MAX_RECORDS=4096、MAX_VALUE=1e9、MAX_BYTES=64*1024*1024 仍按原字符计数/解析实现，不能表述成新的统一 UTF-8 证明。BoundedCityEconomy 保持128 history、每批1..8 actions、512 trace、128 legal候选/4页、8MiB/250000节点/48深度/4096数组/128键；PieceClock 的原政策数值不变。所有 fit 位置、完整 replay/legal 包络和 save 二次转义仍由原 owner 处理。窄 view 与 result.value 外壳不进入公开 JSON，本抽取不证明任何新市场预算。

## 依赖与来源边界

新增依赖只有 phase→原 leaves→五个旧核→各 source JSON，类型来自原 service-types；不反向 import owner/index，没有注册、缓存、I/O、随机、时间或环境读取。普通函数与可擦除类型使用 .ts imports 和独立 import type，按现有 Node>=24<25、NodeNext、strict、noUncheckedIndexedAccess、exactOptionalPropertyTypes、verbatimModuleSyntax 静态设计。奖励循环保留原非空断言，因为 planRewards 按 people 同序产生每个 progress；这里没有实际 typecheck 通过声明。

旧独立 scenario.pressureActive 与 bounded scenario.domestic.pressureActive 都是显式 supplied 布尔。BoundedCityEconomy 原 pressureBinding='independent-supplied-domestic-helper-v1'；它不是商人/施工两格敌情、hostileForceIds、距离、城市归属或外交的推导。

纯核 pressureHelperEax 仍支持0..0xffffffff，任意非零半减；布尔投影没有收窄独立纯核。统率是稳定已解析00489070 AL观测，旧服务保留0..255。纯核 publicOrderByte0..255 与可能的负返回保持，旧服务治安0..100仍由旧 parser 限制。1/2/3人、0/255统率、压力两值、相等cap与超cap分支仍走原核。

004B99B0 内部距离/敌我/同盟/设施/地形/可达性尚未恢复，源码注释城市3格/港关2格与说明书都市2格分歧保留；getter 重复读取、副作用、native gate/writer/task/调度/TP及 stock/EXE、跨版本/平台等价仍未证。source-listing-reconstruction 不等于原 EXE 执行。来源 evidence 的 false、43主题/45快照及 E/X 历史不因抽取升级或削减。P078及其依赖继续排除。
