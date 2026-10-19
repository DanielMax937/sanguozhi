# Bounded city piece clock v1 API

独立 profile `bounded-city-economy-piece-clock-v1` 将有限单城的即时内政、商人和 type5 生产放进一个权威 `Current`。只有根推进日期、turn、AP 和 job；内部 reducer/planner 不拥有 State、history 或第二个时钟。调用者采用 execute 返回的新 state 引用才提交自己的会话；没有全局 world store、跨进程锁或自动推进。

[规则正文](../rules/bounded-city-piece-clock.md)说明数值、资格、预约、完成和来源边界。[完整 schema](../../data/schemas/bounded-city-piece-clock-v1.schema.json)覆盖所有 DTO，[完整政策](../../data/policies/bounded-city-piece-clock-v1.json)固定全部参数，[来源记录](../../data/sources/bounded-city-piece-clock-v1.json)区分数值 listing、旧服务、固定场景输入和新增工程政策。

验证状态：静态实现与文本审阅，未运行测试、示例、typecheck、编译、构建、runtime、checker 或 schema validator。本文不是运行通过收据。文末尺寸证明只在实现严格遵守列出的封闭 DTO、固定事实及政策时成立，不证明性能或原游戏等价。

## 公共入口与所有权

实现为 `packages/engine/src/bounded-city-piece-clock.ts`，通过 `packages/engine/src/index.ts` 导出八个新函数。它们不改变旧 API、旧 state/save tag 或旧 dispatcher；本版没有 CLI。

```ts
createBoundedCityPieceClockV1(scenario: BoundedCityPieceClockScenarioV1): BoundedCityPieceClockCreateOrLoadResultV1
inspectBoundedCityPieceClockV1(state: BoundedCityPieceClockStateV1): BoundedCityPieceClockInspectResultV1
executeBoundedCityPieceClockV1(state: BoundedCityPieceClockStateV1, envelope: BoundedCityPieceClockEnvelopeV1): BoundedCityPieceClockExecuteResultV1
previewBoundedCityPieceClockV1(state: BoundedCityPieceClockStateV1, envelope: BoundedCityPieceClockEnvelopeV1): BoundedCityPieceClockPreviewResultV1
saveBoundedCityPieceClockV1(state: BoundedCityPieceClockStateV1): BoundedCityPieceClockSaveResultV1
loadBoundedCityPieceClockV1(serialized: string): BoundedCityPieceClockCreateOrLoadResultV1
listBoundedCityPieceActionsV1(state: BoundedCityPieceClockStateV1, request: BoundedCityPieceClockLegalRequestV1): BoundedCityPieceClockLegalResultV1
replayBoundedCityPieceClockV1(trace: BoundedCityPieceClockTraceV1): BoundedCityPieceClockReplayResultV1
```

常量 `BOUNDED_CITY_PIECE_CLOCK_POLICY` 是完整 JSON 政策的 owned clone/freeze。其他公开 readonly 类型使用 `BoundedCityPieceClock…V1` 命名：Policy、Clock、Ledger、Current、Action、Command、Envelope、Receipt、StepReceipt、KernelAudit、PieceCalculation、PieceStartSnapshot、PieceCompletion、Job、Failure、LegalCursor、ReplayOutcome 等。下文为便于阅读省略该共同前后缀。

所有成功返回值分离并递归冻结，只冻结自己拥有的数据；不修改或冻结 caller。内部 JSON leaf 和 piece planner 不经公共 barrel 暴露；没有 trusted-state token、unsafe commit、注册可信 state 或仅校摘要入口。

复用关系：即时路径调用原国内/商人 private reducers；Start 调用 `calculatePieceProduction` 和 `planPieceStartFees`；完成调用 `planPieceCompletion`。新根不调用旧 `planPieceStart`，因为它的合法宽域要求六种 piece 库存及价格；不得为新根伪补类型 6/7/8/10/11，也不得收窄旧 helper。新根自行持有统一资格、horizon、预约、clock、job 和唯一提交。

## 域与完整 genesis

所有对象闭合且字段必需，只有明确 union 才有不同形状；无 unknown audit、任意 metadata 或开放 policy 参数。所有 number 是安全整数，拒绝 −0、NaN、Infinity。ID 正则 `^[A-Za-z0-9][A-Za-z0-9_.:-]{0,63}$`；JobId 是 `job:` 加 Id，5–68 字符，不能误套 64 上限。RequestId 同字符域但最长 32；Digest 是 64 位小写 hex。

Date 为 `{year,month,day}`，year 1–9999、month 1–12、day 1/11/21；Marker 为 null 或 0…对应当前 turn。XP 为 leadership/charm/intelligence/politics/war 五个完整键；XP/merit 与金粮统一资源上限 1e9，AP≤255，兵/装备容量≤1e6。实体和事实的全部范围见规则表。

Scenario 必填顶层：

```ts
{
  schemaVersion: 1, profile: 'bounded-city-economy-piece-clock-v1', episodeId,
  clock: {date, turn}, advanceLimit, activeForceId,
  corps: {id, forceId, initialActionPoints},
  city: {
    id, kind:'city', ownerForceId, position:{q,r},
    goldCapacity:1000000000, foodCapacity, troopCapacity, moraleCap,
    initial:{gold,food,security,troops,morale,patrolUsedTurn,merchantUsedTurn},
    inventory: {'1':{quantity,capacity}, '2':{quantity,capacity},
      '3':{quantity,capacity}, '4':{quantity,capacity}, '5':{quantity,capacity}}
  },
  officers: [{id,forceId,cityId,available,leadership,charm,intelligence,politics,
    skillIds,initial:{xp,merit,actedTurn}}],
  facilities: [{id,cityId,kind,level,complete,initialUsedTurn}],
  domestic: {pressureActive,difficulty,controller,
    unlockedEquipmentTypes,specialtyEquipmentTypes},
  merchant: {present,uiTradePrice,hostileForceIds,completeFieldUnits:true,
    fieldUnits:[{id,forceId,position:{q,r}}]},
  productionCatalog: {id,version:1,entries:{
    '1':{basePriceWord},'2':{basePriceWord},'3':{basePriceWord},
    '4':{basePriceWord},'5':{basePriceWord}}},
  merchantCatalog, policy
}
```

人物/设施 1–8，恰一个完整 Lv1 workshop；其他设施只 barracks/forge/stable。skills 为 79/80/81/82 无重复数组；解锁/特产是 1–5 无重复数组。fieldUnits/hostileForceIds 各最多 16。不同实体表可同名；同一表不可重名。genesis 保存每项真实事实、完整 Policy 和完整 12-anchor MerchantCatalog，不接受摘要替代。policy/catalog 不只是 id/version 检查。

`advanceLimit` 1–12；创建时验证初始 turn+advanceLimit 安全，日期推进整段不超过 9999 年。所有初始 markers≤genesis.turn。可 supplied 当前旬已 acted/used 的记录，但不能 supplied 初始 job/锁。当前值只能由初始值和完整历史派生。

## State、Current 和任务

```ts
type Clock = {date:Date; turn:number; advancedCount:number};
type Ledger = {
  gold:number; food:number; actionPoints:number; security:number;
  troops:number; morale:number; patrolUsedTurn:Marker; merchantUsedTurn:Marker;
  inventory:Record<1|2|3|4|5,{quantity:number;reserved:number}>;
  officers:{id:Id;xp:Xp;merit:number;actedTurn:Marker;reservationJobId:JobId|null}[];
  facilities:{id:Id;usedTurn:Marker;reservationJobId:JobId|null}[];
};
type Current = {clock:Clock;ledger:Ledger;jobs:Job[]};
type State = {
  tag:'san11-bounded-city-piece-clock-state-v1'; schemaVersion:1;
  profile:'bounded-city-economy-piece-clock-v1'; genesis:Scenario;
  revision:number; current:Current;
  acceptedCommands:{envelope:Envelope;receipt:Receipt}[];
};
```

初始 advancedCount=0、jobs=[]，所有 reservation=null、reserved=0。Ledger 人物/设施行按 genesis 原序同 ID 一一对应。所有容量和固定身份只由完整 genesis 给出。Current.clock 是唯一当前权威；genesis 和 receipt 的日期是历史事实，不能作为第二个当前时钟。

```ts
type PieceStartSnapshot = {
  clock:{date:Date;turn:number}; activeForceId:Id; corpsId:Id; cityId:Id;
  officers:{id:Id;intelligence:number;hasSkill82:boolean}[];
  facility:{id:Id;kind:'workshop';level:1;complete:true};
  basePriceWord:number; specialty:boolean;
  policyDigest:Digest; productionCatalogDigest:Digest;
};
type PieceCompletion = {
  jobId:JobId; turn:number; inventoryWrite:Write; rewards:Reward[];
  inventoryReservedBefore:1; inventoryReservedAfter:0;
  officerIds:Id[]; facilityId:Id; actedTurnAfter:number;
};
type Job = {
  id:JobId; status:'active'|'completed'; cityId:Id; equipmentType:5;
  facilityId:Id; officerIds:Id[];
  startTurn:number; startDate:Date; durationTurns:number;
  dueTurn:number; dueDate:Date; remainingTurns:number; reservedQuantity:1;
  startSnapshot:PieceStartSnapshot; calculation:PieceCalculation; fees:Fees;
  completedTurn:number|null; completion:PieceCompletion|null;
};
```

jobs≤12，按 Start 接受顺序保留，completed 也计数。Snapshot 是费用、预约、acted/used 写入前的最小事实投影；不包含整个人物 XP、全部设施、policy/catalog 副本或 envelope。完整原始输入仍在 genesis/history，加载不能只信 Snapshot 或摘要。

每个 job 与唯一历史 Start 对应；job ID=`job:`+envelope.id。duration 1–9 且重算；dueTurn/startTurn/dueDate/startDate 相互绑定。active 至多一个，remaining=dueTurn−current.turn>0，completedTurn/completion 为 null；completed.remaining=0、completedTurn=dueTurn≤current.turn，completion 必须完整相等。没有 job 删除、导入、修复或复活接口。

## 命令和完整回执

```ts
type Action =
 | {type:'Patrol';cityId:Id;officerIds:Id[]}
 | {type:'Recruit';cityId:Id;officerIds:Id[];facilityId:Id}
 | {type:'Produce';cityId:Id;officerIds:Id[];facilityId:Id;equipmentType:1|2|3|4}
 | {type:'BuyFood'|'SellFood';cityId:Id;officerId:Id;foodAmount:number};
type Command =
 | {type:'ExecuteCityActions';actions:Action[]}
 | {type:'StartPieceProduction';cityId:Id;officerIds:Id[];facilityId:Id;equipmentType:5}
 | {type:'AdvanceSharedCityTurn'};
type Envelope = {id:Id;expectedRevision:number;command:Command};
```

actions 1–4，officerIds 1–3 个唯一 ID，数组有序；foodAmount 1…1e9。不接派生 duration、quantity、fees、due、delta、success、外来 receipt 或额外 phase。

```ts
type StartDetail = {
  jobId:JobId; startSnapshot:PieceStartSnapshot; calculation:PieceCalculation; fees:Fees;
  reservations:{officerIds:Id[];facilityId:Id;jobId:JobId;
    inventoryReservedBefore:0;inventoryReservedAfter:1};
};
type JobProgress = {jobId:JobId;remainingBefore:number;remainingAfter:number;
  statusAfter:'active'|'completed'};
type TickDetail = {apRecovery:Write;progress:JobProgress[];completions:PieceCompletion[]};
type ReceiptCommon = {
  envelope:Envelope; revisionBefore:number; revisionAfter:number;
  policyDigest:Digest; catalogDigests:{production:Digest;merchant:Digest};
  clockBefore:Clock; clockAfter:Clock;
  currentDigestBefore:Digest; currentDigestAfter:Digest;
  scope:'bounded-shared-city-piece-clock'; rngDraws:0;
  techniquePoints:'not-modeled'; nativeIntegration:false;
};
type Receipt = ReceiptCommon & (
 | {kind:'instant';detail:{steps:StepReceipt[]}}
 | {kind:'piece-start';detail:StartDetail}
 | {kind:'tick';detail:TickDetail}
);
```

kind 与 envelope.command.type 严格对应。instant steps 等于 actions 数，index 0…n−1，每个 action 完整相等；start detail 与对应 job 的 snapshot/calculation/fees 相等；tick progress/completions 各 0–1 项，不用 null 占位。instant/start 的 clockBefore=clockAfter；tick 只有根推进一次。完整序列化仍分别计入这些重复对象，不因 JS 引用共享折扣。

Write 是八个必需字段 `{before,requested,returned,actualDelta,after,cap,discarded,policyId}`。Reward 是 `{officerId,attribute,xp:Write,merit:Write}`；Fees 是 `{gold:Write,actionPoints:Write,sourceApRequest,effectiveApCost}`。完成 rewards 按 job.officerIds 原序，attribute=intelligence；source/effective 开工 AP 均 20。零金价保留合法零 debit，不产生 −0。

### 即时审计与 effect allowlist

StepReceipt 恰为 `{index,action,ledgerDigestBefore,ledgerDigestAfter,changes,audit}`。摘要覆盖新 Ledger 的全部库存和真实预约；Change 仍只表达即时白名单的实际变化，不能用它代替完整 audit。changes 顺序：city gold/food/security/troops/morale/patrolUsedTurn/merchantUsedTurn → corps AP → equipment1/2/3/4 quantity → genesis 人物序各 XP/merit/acted → genesis 设施序 usedTurn。每个路径最多一项；before=after 的 Write 仍在 audit 中。

DomesticAudit 完整保留 calculation/fees/rewards/events/sideEffectsNotModeled/rngDraws；MerchantAudit 完整保留 ownerSnapshot/actionPoints/fixedGoldFee/meritDelta/techniquePointsDelta/loyaltyDelta/rngDraws/trade/merchantMerit。merchant 的 context/marker 绑定当前根 turn，不沿用 genesis 固定旬。其 full unit checks、分数、余数、舍入差和 XP 都不可删。

五类即时 KernelAudit 沿用[固定经济 API](bounded-city-economy.md)的闭合类型和字段：Patrol、Recruit quantity、Recruit security、Price、Quantity1–4。只删除核输出顶层 evidence；其余 null、signed/rawU32、slots、captures/trace/callDetails 原样保留。Recruit captures/trace≤19、callDetails≤21、slots 恒 3；Quantity 必须限 1–4，不能因新库存包含 5 而放宽其分支。原始 unknown 类型不是本根的可接受 audit。

| transition | 唯一允许的业务写入 |
|---|---|
| Patrol | gold/AP/security/patrolUsedTurn；选择者 leadership XP/merit/acted |
| Recruit | gold/AP/troops/security/morale；选择者 charm XP/merit/acted；指定 barracks.usedTurn |
| Produce1–4 | gold/AP/对应 quantity；选择者 intelligence XP/merit/acted；指定设施 usedTurn |
| Buy/Sell | gold/food/AP/merchantUsedTurn；该人 politics XP/acted，merit 保留 |
| Start | gold/AP；inventory5.reserved；选择者 reservation/acted；工房 reservation/used；追加 job |
| Tick | clock/AP；active remaining；到期库存5.quantity/reserved、选择者 intelligence XP/merit/reservation/acted、工房 reservation、job completed/completion |

每类最后仅追加一条 accepted entry 并 revision+1。Tick 不改 facility.usedTurn、不清 markers、不扣 gold 或生产 AP；Start 不发奖励、不增 quantity。instant 不改 clock/jobs/任何 reservation/type5 quantity。

国内 frame 投影所有真实人物/设施及 reservation，不过滤 busy 项；库存1–4用真实 reserved=0。merchant frame 不加不存在的 reservation，也不以伪造 available/acted 代替根 gate。root 对 reducer 全候选重投影逐字段比较，禁止无关人物、顺序、身份、能力、价格、cap、policy、锁或其他非白名单写入；意外效果返回 `unexpected-reducer-effect`。

### type5 三核

PieceCalculation 必填 observationKind/selectedOfficerIds/securityKernelReturn/quantityKernelReturn/quantityPreCapacity/priceKernelReturn/timeKernelReturn/facilityApplied/earlyCharmSum/moraleSecuritySnapshot/newRecruitMorale/securityWrite/troopWrite/inventoryWrite/moraleWrite/kernels。observationKind 固定 derived-adapter-observations；quantity 两值均 1；facilityApplied=false；不适用的 security/charm/morale/Write 槽保留 null。

kernels 恰为 price、piece quantity、time 三项 tuple：

- Price input 为 profile/savedBasePriceWord/specialtyHelperEax；完整 output 包含 supported/profile/savedBasePriceWord/specialtyHelperEax/specialtyResultAl/discountApplied/returnedPrice
- Quantity input 只有 profile/nativeEquipmentType=5；output 保留 supported/profile/nativeEquipmentType/reason=single-item-return-one/resolvedInputsObserved=false/returnedQuantity=1
- Time input 为 profile/nativeEquipmentType=5/captures。每槽 validity=`005C6CF8`，存在者再 intelligence=`005C6D06`、skill=`005C6D25`；全部保持三槽原序。captures、trace、callDetails 各最多 9，无船观测，skillQueryId=82
- Time output 的 19 字段为 supported/profile/nativeEquipmentType/reason/returnedValue/rawEaxU32/scannedSlots/skillQueryId/slots/intelligenceSum/intelligenceMax/rawX/clampedX/q/facilityApplied/skillApplied/beforeSkill/trace/callDetails。slots 恒 3，空槽 intelligenceAl/skillEax 为 null；callDetails 保留 callAddress/target/slotIndex/queryId 的精确值和 null

signed raw −24…9、U32 表示和 duration=max(1,raw) 是不同字段；不能以调度正数覆盖原核返回。

## 执行次序、拒绝与幂等

execute/preview 使用同一 private transition：

1. 按参数顺序有界 detach 整个 state、整个 envelope；数据安全/输入预算优先，再完整重建 state
2. 校闭合外层 `{id,expectedRevision,command}`；command 此刻仅要求安全普通 object，业务分支稍后验证
3. 已接受 ID 若整个 canonical envelope 相等，返回 duplicate；否则 command-id-conflict。改 expectedRevision、选择顺序或 command 字段都属于冲突；完全重试返回旧 receipt 加当前 State/Current
4. 新 ID 检 stale revision，再检 64 条 history 防御限额
5. 校完整 Command union；batch 先校全部 actions 的 shape/domain，再逐步执行，后项结构错误不会先执行前项
6. 根统一逐人/设施 guard，再进入 reducer 或 start。任一失败丢弃整个候选
7. 校根不变量、剩余完成槽、完整 receipt 和所有 fitRoot 包，然后唯一 append/commit

actor 按选择顺序逐人处理 city/存在/同城同势力/available/reservation/acted，不能跨人分阶段扫描。facility 随后按存在/同城/complete/kind/reservation/used。巡查 once 和商人 presence/city-once 在根 actor 后。Start 再依次 unlock5→三核→job 历史额度→容量→due/horizon→完成 history 槽→snapshot→gold affordability→AP affordability→候选写入。Tick 先 advanceLimit，再复核预约，随后 clock→AP→递减/完成。

```ts
type Failure = {
  ok:false; committed:false; stage:Stage; reason:Reason;
  actionIndex:0|1|2|3|null; blockingUnitId:Id|null;
  officerId:Id|null; facilityId:Id|null; jobId:JobId|null;
};
```

stage 是 input/rebuild/deduplication/revision/domain/domestic/merchant/invariant/budget/comparison/reservation/piece/tick 的有限 union。reason 也闭合，不是异常字符串。既有 reason 集：

- 输入：invalid-data、invalid-json、duplicate-json-key、invalid-fields、invalid-number、invalid-id、invalid-date、invalid-array、invalid-prototype、duplicate-entity-id
- 支持域：unsupported-schema、unsupported-profile、unsupported-policy、unsupported-catalog、unsupported-command、unsupported-city-kind、unsupported-equipment、unsupported-skill、unsupported-politics、unsupported-external-state
- 身份/场景：owner-corps-mismatch、officer-city-force-mismatch、facility-not-present、incomplete-field-unit-snapshot、owner-marked-hostile、invalid-marker、invalid-officer-count、invalid-action-count
- 根命令：command-id-conflict、stale-revision、history-limit
- legal：candidate-id-collision、invalid-page-size、invalid-cursor、unsupported-cursor-version、cursor-state-mismatch、cursor-request-mismatch
- 动作：unknown-city、unknown-officer、unknown-facility、officer-unavailable、officer-already-acted、patrol-already-used、facility-incomplete、wrong-facility-kind、facility-used-this-turn、equipment-locked
- 费用/交易：insufficient-gold、insufficient-action-points、insufficient-food、merchant-absent、city-merchant-already-used、hostile-within-two、zero-value-sale、gold-amount-out-of-range、gold-capacity-exceeded、food-capacity-exceeded
- 计算/一致性：kernel-rejected、writer-cap-overflow、zero-yield、state-recomputation-mismatch、history-recomputation-mismatch、receipt-recomputation-mismatch、duplicate-accepted-entry、unexpected-reducer-effect、invariant-mismatch、budget-exceeded、trace-outcome-mismatch、trace-final-mismatch

本 profile 仅新增八项：officer-reserved-by-job、facility-reserved-by-job、job-history-limit、piece-capacity-unavailable、completion-horizon-exceeded、completion-history-slots、advance-limit-reached、completion-reservation-mismatch。

officer-reserved 仅 officerId/jobId 非 null；facility-reserved 仅 facilityId/jobId 非 null；hostile-within-two 才有 blockingUnitId；其他新增理由元数据均 null。Start/tick 的 actionIndex=null，batch 为失败所在 step。Failure 不带部分 state/receipt/job。

旧 insufficient-ap→insufficient-action-points；officer-not-member/officer-not-present→officer-city-force-mismatch；merchant city-mismatch→unknown-city、officer-not-found→unknown-officer。旧 reducer 若绕过根 gate 仍返回 production-reserved，视作 unexpected-reducer-effect，不扩展旧 API 的 reason union。

## 成功结果与只读预览

```ts
type CreateOrLoadResult = Failure|{ok:true;state:State};
type ExecuteResult = Failure|{ok:true;committed:boolean;duplicate:boolean;
  state:State;receipt:Receipt};
type PreviewResult = Failure|{ok:true;committed:false;duplicate:boolean;
  baseRevision:number;projectedCurrent:Current;receipt:Receipt};
type InspectResult = Failure|{ok:true;revision:number;current:Current;
  remainingHistorySlots:number;remainingAdvances:number;reservedCompletionSlots:number;
  scope:'bounded-shared-city-piece-clock'};
type SaveResult = Failure|{ok:true;serialized:string};
```

execute 新接受时 committed=true、duplicate=false；重试时 committed=false、duplicate=true。preview 永不提交 caller，返回完整 projectedCurrent 而非可绕过边界提交的候选 State；duplicate preview 使用当前 Current 与旧 receipt，baseRevision 为当前 revision。inspect 也保留完整 job 审计；remainingHistorySlots=64−revision，remainingAdvances=advanceLimit−advancedCount，reservedCompletionSlots=active.remaining 或 0。

## 保存、加载与全历史回放

SaveEnvelope 为 `{tag:'san11-bounded-city-piece-clock-save-v1',state}`，保存为 canonical JSON 字符串。load 严格解码文本，拒绝 decoded duplicate keys 和尾部垃圾，并精确校 SaveEnvelope。旧 save tag 不兼容。

完整重建重新校 genesis，从空锁/空 job 初态 fold 全部 accepted envelopes。每条都重算完整 receipt、计算核、Write、fee、reward、date、snapshot、reservation 和所有摘要；每条历史 receipt 逐字段相等，最终完整 State 也须相等。重复 accepted ID、错误前缀 revision、孤儿 job、伪造 completion 都拒绝。每个前缀还重新满足不变量和 fitRoot。

重建失败重标 stage=rebuild，budget 失败保留 budget。没有 trusted shortcut、checkpoint、剪历史、reset-genesis、merge-saves 或 repair receipt。摘要只作冗余绑定；一致性检查不认证作者身份，完整自洽地改写 genesis/history 可以产生另一个合法场景。

```ts
type ReplayOutcome = Failure|{ok:true;duplicate:boolean;receipt:Receipt};
type Trace = {
  tag:'san11-bounded-city-piece-clock-trace-v1'; scenario:Scenario;
  attempts:{envelope:Envelope;expected:ReplayOutcome|null}[];
  expectedFinalState:State|null;
};
type ReplayResult = {ok:true;state:State;outcomes:ReplayOutcome[]}|
  (Failure&{index:number|null;state:null});
```

attempts 0–512，先校每个 attempt 的外层字段再按序执行。失败不提交，duplicate 不重做；expected 仅比较，不驱动结果。第一个 outcome mismatch 返回 comparison 失败及 0 基 index；最终 state mismatch 的 index=null。外层结构/整体预算失败也不泄漏部分 State。

每次累积按真实返回包测量；outcomes 聚合超预算是整体 Failure、index=null、state=null，不是可以忽略的一次业务拒绝。512 个大 duplicate 回执可超预算，不能截断或省略审计来声称成功。

## LegalRequest 与连续分页

```ts
type LegalCursor = {
  version:1;orderVersion:'facility-trade-piece-advance-order-v1';
  stateDigest:Digest;requestDigest:Digest;revision:number;nextIndex:number;
};
type LegalRequest = {
  requestId:RequestId;expectedRevision:number;
  domesticOfficerIds:Id[]|null;
  merchantRequests:{officerId:Id;foodAmount:number}[];
  cursor:LegalCursor|null;pageSize:1|2|3|4;
};
type LegalResult = Failure|{
  ok:true;baseRevision:number;stateDigest:Digest;requestDigest:Digest;
  totalCandidates:number;startIndex:number;endIndexExclusive:number;
  nextCursor:LegalCursor|null;completePage:true;enumerationComplete:boolean;
  globalCompleteness:false;
  candidates:{globalOrdinal:number;envelope:Envelope;result:PreviewResult}[];
  notEnumerated:['other-officer-selections','other-food-amounts','multi-action-batches'];
};
```

domesticOfficerIds 为 null 或 1–3 个有序唯一 ID；merchantRequests 0–4，完整 officerId/foodAmount pair 不重复。requestDigest 只含 requestId/expectedRevision/domesticOfficerIds/merchantRequests，保留顺序，不含 pageSize/cursor。stateDigest 覆盖完整 State，包括完整 history、clock、jobs 和锁，不能只 hash 余额。

cursor 按 version/shape/range→expectedRevision→nextIndex<total→state/revision 摘要→request 摘要检查；不匹配不会静默从头重启。pageSize 可改变，同一 continuation 的候选顺序不变。cursor 是可重算的位置，不是签名或权限凭据。

完整候选依次为：

1. domestic 非 null 时一项 Patrol
2. 按 genesis 设施序：barracks 列 Recruit；forge 列 Produce1/2/3；stable 列 Produce4；workshop 此处略过
3. 按 merchantRequests 原序，每项 BuyFood、SellFood
4. domestic 非 null 时唯一 StartPieceProduction5
5. 始终一项 AdvanceSharedCityTurn

最大为 1+7×3+8+1+1=32。未完成、未解锁、busy、到 horizon 的候选照列，返回其真实拒绝，不过滤导致 ordinal 漂移。ID=`legal:${requestId}:${ordinal}`，最长 41。先对完整候选清单与全部 accepted ID 碰撞预扫，包括后续页；碰撞整 query 为 candidate-id-collision。

每项独立对同一个 base State preview，含完整根 gate/费用/完成槽/fit，不能模拟页内连做。从 nextIndex 或 0 取最多 pageSize 的连续前缀；每增加一项都测量真实完整 LegalResult（含实际 terminal/null cursor）。第一项不 fit，整体 budget-exceeded；后项不 fit，返回此前非空连续前缀。不能跳过大项、返回零进度非终止页或省略 receipt。

`candidates.length=endIndexExclusive−startIndex`，ordinals 精确覆盖该区间。end<total 时 nextIndex=end；end=total 时 cursor=null。completePage 只保证当前区间，enumerationComplete 只说明没有后续区间，globalCompleteness 恒 false。成功提交使所有旧 cursor 失效，旧 exact envelope 的 revision 也变旧；duplicate/失败不改变 state。独立可行候选不证明其组合成 batch 可行。

## 未执行的合成输入

[场景](../../data/scenarios/bounded-city-piece-clock-example-v1.json)、[Start 请求](../../data/scenarios/bounded-city-piece-clock-actions-v1.json)、[legal 请求](../../data/scenarios/bounded-city-piece-clock-legal-v1.json)和[trace 输入](../../data/scenarios/bounded-city-piece-clock-trace-v1.json)仅为静态编写的 synthetic 数据。trace 放入开工、推进、预约人物买粮、预约工房开工、完成当旬人物行动、卖粮后征兵 batch 及原 Start 重试等请求，用于说明协议意图。全部 attempt.expected 和 expectedFinalState 为 null；没有填入伪装为已观察到的成功、拒绝、回执或最终 state，也没有执行这些文件。

## Schema 与引擎的不同职责

JSON Schema 2020-12 为每种 DTO 提供闭合定义：所有 object 的 additionalProperties=false、所有键 required，tag/profile/version/固定 policy/catalog 均完整 const，union 使用明确 tag，五库存键齐全。schema 可描述形状、静态范围、数组上限、ID/hex 和核分支/null；它不能独自证明可达性。

引擎另外负责：−0、prototype/proxy/accessor/symbol/cycle/稀疏数组/隐藏字段安全；ID 唯一与行序、marker 相对 turn、容量/身份、固定常量全量相等；时钟计算、双向预约；核 captures/trace/callDetails 关系、write/reward 算术；摘要/receipt/history 全量重算；legal 连续覆盖及实际 UTF-8/node/depth 预算。

安全边界复用 data-only JSON leaf，先 detach 再精确校验。Proxy 检查使用 `process.getBuiltinModule('node:util').types.isProxy` intrinsic，缺少该能力时 fail closed，不能宣称其他环境有等价检测。未知异常返回受控 Failure，不访问异常 getter/trap 或回显内部数据。

新根只保存规范 JSON 域；受验证数字不含 −0，因此其 canonical copy 不改变合法 primitive。调用原 private planner 仍遵守各自 owned/frozen 合同；不为新根改变旧 StartSnapshot 的 JSON-copy 语义。

## 静态容量与完成尾证明

硬边界：每个输入/真实完整输出/raw save/含转义 serialized 的 SaveResult≤8,388,608 UTF-8 bytes、250,000 nodes、深度 48、数组 4096、对象 128 键；history≤64、actions≤4、jobs≤12、advances≤12、trace attempts≤512、legal candidates≤32、pageSize≤4。节点计 object/array/scalar/null 各一；key 不计 node，但计 JSON bytes；根深度 0；同一引用出现在不同位置要分别展开计数。

每个 revision0、重建前缀、新候选都 fitRoot：State、create/load、完整 Inspect、SaveEnvelope、escaped SaveResult、新 execute/preview，以及每个旧 accepted receipt 配当前 State/Current 的 duplicate execute/preview。fit 不调用 public API 递归重建；只检查最新 receipt 或 raw save 均不够。

以下为完整 DTO 的保守数学上界，不是样例大小测量。设 A 为成功即时步骤数、S 为 Start 数、I 为即时根命令数、T 为 tick 数。每个非 tick 步骤收费 20 AP，初始≤255、每 tick 实际恢复≤20，故：

`20(A+S)≤255+20T≤495`，所以 `A+S≤24`；I≤A、T≤12，故 revision=I+S+T≤36。不能把 batch 上限 4 再乘进 24。

完整叶展开的宽界：Write9、Reward21、Fees21、即时 Step≤640、PieceCalculation≤204、开工 Snapshot≤32、Completion≤84、完整 completed Job≤365、完整 Scenario≤688、Ledger≤147。Time captures/trace 各≤9、callDetails≤9，Recruit 完整审计各≤19/21 已计；未删 null、quantity=1 核或 signed/U32。

Current≤156+365S；一条含 a 步的 instant history≤43+658a，start history≤321，完成 tick history≤140。因此：

`N(State)≤5+688+(156+365S)+1+43I+658A+321S+140T`

`≤850+701A+686S+140T≤850+701×24+140×12=19,354`。

每个 job 都按完整 completed 形状、每个 tick 都按带 completion 估，未来完成的审计增长已经提前计入。entry.envelope 与 receipt.envelope、step.action、job 与 receipt 的 snapshot/calculation/fees、job 与 tick 的 completion 都分别计入。Current 独立上界 4,536，单 receipt 上界 2,632。

全部普通字段名≤64 ASCII，值 ID≤64、job ID≤68，其他固定字符串≤64；不含引号、反斜线、控制字符或非 ASCII。固定商人 12 锚点的最大值 1,142,868、最大跨度 30，给出插值 N≤34,286,040、D≤30,000,000；Q≤1e9、u≤7 时最大 sell numerator≤137,144,160,000,000,000，全部派生十进制串≤18 位。这个结论来自固定输入重算，不能用宽松 decimal regex 接受任意长审计。

每节点本身最多 70 bytes、每条对象边（key/冒号/逗号）最多 68 bytes，故普通包 `B≤70N+68(N−1)<140N`。长 serialized 字符串不套此引理，须另计转义。

| 必须可用的包装 | 节点上界 | UTF-8 bytes 上界 | 深度上界 |
|---|---:|---:|---:|
| State | 19,354 | 2,709,560 | 16 |
| create/load | 19,356 | 2,709,840 | 17 |
| 完整 Inspect | 4,543 | 636,020 | 11 |
| raw SaveEnvelope | 19,356 | 2,709,840 | 17 |
| escaped SaveResult | 3 | 5,419,707 | 1 |
| 新 execute 或任意旧 ID duplicate execute | 21,990 | 3,078,600 | 17 |
| 新 preview 或任意旧 ID duplicate preview | 7,173 | 1,004,220 | 14 |

raw save 的 canonical 文本全为 ASCII，第二层 JSON string 中每 byte 最多展开两倍，外壳 `{"ok":true,"serialized":""}` 为 27 bytes：`2×2,709,840+27=5,419,707`。结构引号也已计入。所有旧 receipt 均用 2,632 界，不假设最新 tick 最大。逐个 duplicate 包分别检查，不形成全 duplicate 结果数组。

保证包的最大数组≤36、对象≤32 键，深度≤17；分别小于硬界 4096/128/48。最大字节余量 2,968,901、节点余量 228,010。这些余量不是扩 DTO 或政策的授权；新增字段、动态字符串、AP 来源、并行 job、实体上限或复制整份 Current 到 receipt 都需重新证明。

对任意合法 active 状态，D=remainingTurns≤9。Start 已证明 due 在安全日历/horizon 内，容量预约和双向锁保证完成实际库存+1，当前 XP/merit 饱和仍合法，完成不再资格否决。每 tick 消耗一条历史并使 D−1；revision+D≤36+9=45<64。连续 D 个新 ID、正确 revision 的 Advance 的每个前缀仍服从上述完整 completed-size 上界，故这些必须包装的预算不会锁死该尾序列。

该保证不涵盖错误 ID/stale 请求，不保证任意 legal/trace 聚合必 fit，不认证 native 完成流程，也不是运行速度结论。legal/trace 另做真实动态聚合预算；特别是任意重复 trace 仍可能整体 budget 拒绝。
