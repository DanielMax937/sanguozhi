# Bounded city economy v1 API

本 API 是固定一城、一势力/军团、一个旬的共享资源 episode。金、粮、AP、人物行动、五维 XP、merit、兵装、治安、气力和设施机会从同一 genesis 派生。所有返回值只读、分离并递归冻结；输入不被修改或冻结。没有全局 world store、隐含提交或跨进程锁。调用者采用 execute 的新 state 引用才完成提交；CLI 另持有自己的内存 session。

具体数值、前置 gate、费用、writer、饱和和来源限度见[规则正文](../rules/bounded-city-economy.md)。[完整 schema](../../data/schemas/bounded-city-economy-v1.schema.json)提供 `$defs` 的所有输入、输出、状态、receipt 与五核审计；[政策](../../data/policies/bounded-city-economy-v1.json)是完整固定快照，不能只传 ID。schema 是结构和静态范围描述，不能替代引擎的跨字段不变量、预算、历史重算和完整比较。

状态：静态实现/文本审阅，未运行测试、示例、typecheck、compile、build、runtime、checker 或 schema validator。下面是协议说明，不是运行通过声明。

## 公共入口

从 `packages/engine/src/index.ts` 导入；实现文件为 `packages/engine/src/bounded-city-economy.ts`。八个函数都是新入口，不扩展旧 dispatcher、training GameState 或旧 save tag。

```ts
createBoundedCityEconomyV1(scenario: BoundedCityEconomyScenarioV1): BoundedCityEconomyCreateOrLoadResultV1
inspectBoundedCityEconomyV1(state: BoundedCityEconomyStateV1): BoundedCityEconomyInspectResultV1
previewBoundedCityEconomyV1(state: BoundedCityEconomyStateV1, envelope: BoundedCityEconomyEnvelopeV1): BoundedCityEconomyPreviewResultV1
executeBoundedCityEconomyV1(state: BoundedCityEconomyStateV1, envelope: BoundedCityEconomyEnvelopeV1): BoundedCityEconomyExecuteResultV1
listBoundedCityActionsV1(state: BoundedCityEconomyStateV1, request: BoundedCityEconomyLegalRequestV1): BoundedCityEconomyLegalResultV1
saveBoundedCityEconomyV1(state: BoundedCityEconomyStateV1): BoundedCityEconomySaveResultV1
loadBoundedCityEconomyV1(serialized: string): BoundedCityEconomyCreateOrLoadResultV1
replayBoundedCityEconomyV1(trace: BoundedCityEconomyTraceV1): BoundedCityEconomyReplayResultV1
```

`BOUNDED_CITY_ECONOMY_POLICY` 是对完整 JSON 快照的私有 clone/freeze，不冻结调用者或导入模块的共享对象。公开 readonly 类型还包括 BoundedCityEconomyPolicyV1、LedgerV1、ActionV1、ReceiptV1、StepReceiptV1、KernelAuditV1、FailureV1、LegalCursorV1、ReplayOutcomeV1（均使用 BoundedCityEconomy 前缀）。内部 reducer/JSON leaf 不通过 barrel 或 package 子路径公开，不提供 trusted-state token、unsafe commit 或 register-trusted 入口。

## 输入和结果 shapes

所有对象为 closed object，字段必填；只有明确 union 分支允许不同字段。数字不是任意浮点，必须 safe integer 且不是负零。完整支持范围见规则表和 schema。

Scenario 的顶层为 schemaVersion:1、profile、episodeId、clock、activeForceId、corps、city、officers、facilities、domestic、merchant、productionCatalog、merchantCatalog、policy。只有 genesis 的 city.initial/officers.initial/facilities.initialUsedTurn/corps.initialActionPoints 提供初值。Scenario 不接受 ledger、history、receipt、child state 或旧 service save。

State 为：

```ts
{
  tag: 'san11-bounded-city-economy-state-v1', schemaVersion: 1,
  profile: 'bounded-city-domestic-merchant-v1',
  genesis: Scenario, revision: number, ledger: Ledger,
  acceptedCommands: { envelope: Envelope, receipt: Receipt }[]
}
```

Ledger 包含 gold、food、actionPoints、security、troops、morale、patrolUsedTurn、merchantUsedTurn、inventory（键1–4的当前数量）、officers（id/xp/merit/actedTurn）和 facilities（id/usedTurn）。容量和身份只在 genesis 固定事实；ledger 行序必须与 genesis 一一对应。只有 create/完整 load/replay/execute 可产生可接受 state，手写的 state 仍必须完整重建。

Envelope 为 `{id,expectedRevision,command:{type:'ExecuteCityActions',actions}}`。actions 长度1–8，形状为：

```ts
{type:'Patrol', cityId, officerIds}
{type:'Recruit', cityId, officerIds, facilityId}
{type:'Produce', cityId, officerIds, facilityId, equipmentType:1|2|3|4}
{type:'BuyFood'|'SellFood', cityId, officerId, foodAmount}
```

普通 officerIds 为1–3个不同人物，数组顺序有意义；商人只一人，foodAmount 1–1e9。command 不接最终价格、费用、效果、delta 或合法性标记。

成功结果：

- create/load：`{ok:true,state}`
- inspect：`{ok:true,revision,clock,ledger,remainingHistorySlots,scope:'bounded-shared-city-episode'}`；remainingHistorySlots=128−revision，不代表 AP 或动作机会
- execute：`{ok:true,committed,duplicate,state,receipt}`；新接受 committed=true/duplicate=false，完全相同重试 committed=false/duplicate=true
- preview：`{ok:true,committed:false,duplicate,baseRevision,projectedLedger,receipt}`；不返回可偷渡提交的候选 State；duplicate 的 projectedLedger 是当前 ledger
- save：`{ok:true,serialized}`，serialized 是 canonical save envelope 字符串
- replay：`{ok:true,state,outcomes}`，outcomes 保留每次尝试的成功、失败或 duplicate 比较结果

所有普通失败为：

```ts
{ok:false,committed:false,stage,reason,actionIndex:null|number,blockingUnitId:null|string}
```

stage 是 input/rebuild/deduplication/revision/domain/domestic/merchant/invariant/budget/comparison 之一。actionIndex 是事务内0基动作位置，非动作位置错误为 null。blockingUnitId 仅 hostile-within-two 可非 null。失败不带半个 ledger、receipt 或 state。replay 外层失败在同一 Failure 上增加 `{index:null|number,state:null}`；index 为0基 attempt，外层 shape/整体预算失败为 null，不给可误用的部分重放 state。小型失败不回显异常对象、未知字段或恶意输入，预算上限8KiB。

## 失败代码

固定 reason 集如下；不是任意异常字符串，旧 service 的 reason 集不因此改变。

- 输入：invalid-data、invalid-json、duplicate-json-key、invalid-fields、invalid-number、invalid-id、invalid-date、invalid-array、invalid-prototype、duplicate-entity-id
- 支持域：unsupported-schema、unsupported-profile、unsupported-policy、unsupported-catalog、unsupported-command、unsupported-city-kind、unsupported-equipment、unsupported-skill、unsupported-politics、unsupported-external-state
- 身份/场景：owner-corps-mismatch、officer-city-force-mismatch、facility-not-present、incomplete-field-unit-snapshot、owner-marked-hostile、invalid-marker、invalid-officer-count、invalid-action-count
- 根命令：command-id-conflict、stale-revision、history-limit
- legal：candidate-id-collision、invalid-page-size、invalid-cursor、unsupported-cursor-version、cursor-state-mismatch、cursor-request-mismatch
- 动作门槛：unknown-city、unknown-officer、unknown-facility、officer-unavailable、officer-already-acted、patrol-already-used、facility-incomplete、wrong-facility-kind、facility-used-this-turn、equipment-locked
- 收费/交易：insufficient-gold、insufficient-action-points、insufficient-food、merchant-absent、city-merchant-already-used、hostile-within-two、zero-value-sale、gold-amount-out-of-range、gold-capacity-exceeded、food-capacity-exceeded
- 计算/一致性：kernel-rejected、writer-cap-overflow、zero-yield、state-recomputation-mismatch、history-recomputation-mismatch、receipt-recomputation-mismatch、duplicate-accepted-entry、unexpected-reducer-effect、invariant-mismatch、budget-exceeded、trace-outcome-mismatch、trace-final-mismatch

根将 domestic insufficient-ap 规范化为 insufficient-action-points，officer-not-member/officer-not-present 为 officer-city-force-mismatch；merchant city-mismatch 为 unknown-city，officer-not-found 为 unknown-officer。同名允许码保持；本域不可合法出现的 reservation/invalid-rational/未知内部码归为 unexpected-reducer-effect。只新根使用该映射，旧 wrapper 不受影响。

## 执行、重复与允许写集合

调用分四层：有界 detach/严格文本解码/闭合数据校验 → 从唯一 genesis fold 全部历史的重建 → 私有已验证根上的 transition → 公共包装。重建不递归调用 public execute 重放所有前缀；fit 纯构造/测量返回包，不调用 public save/execute/preview 重入。

1. 先输入预算再大复制/canonical；Node24 使用 intrinsic isProxy，且在 Array.isArray/getPrototypeOf/ownKeys/descriptors 等对象反射之前检查
2. 完整重建传入 state，逐完整 receipt、最终 state 比较
3. 查 command ID；整个 envelope 相同则 duplicate，含 expectedRevision 或数组顺序的任何变化均冲突；duplicate 优先于 stale
4. 新 ID 检 revision、128历史额度、动作域，创建一个私有候选 ledger
5. 顺序执行所有动作；第i步读取第i−1步结果，固定事实不变；每步 reducer context 的 commandId 为根 ID，turn 为 genesis turn
6. 按下列 allowlist 接回变化并核所有其他值恒等，构造完整 step audit/changes/digests
7. revision 只+1，追加一个 envelope/receipt，完成全部 fit；最后才冻结返回

允许写集合：

| 动作 | 唯一可变路径 |
|---|---|
|Patrol|gold、AP、security、patrolUsedTurn；选中人的 leadership XP、merit、actedTurn|
|Recruit|gold、AP、troops、security、morale；选中人的 charm XP、merit、actedTurn；选定兵舍 usedTurn|
|Produce|gold、AP、对应装备数量；选中人的 intelligence XP、merit、actedTurn；选定设施 usedTurn|
|Buy/Sell|gold、food、AP、merchantUsedTurn；选定人的 politics XP、actedTurn|

身份、属性、available、skillIds、容量、日期/turn、政策/目录、其他机会和未选人全部恒等；商人不能写 merit。临时 frame 不含自己的 genesis、history、revision 或日期。根的无任务域投影 reserved=0/reservationJobId=null 只是内部适配，不能导入后抹任务。

失败包括最后的序列化或预算失败，均丢弃整个 batch 且不占 ID。preview 使用相同 transition/fit 和费用审计，不给“轻量跳过历史/预算”通道。重复使用原 receipt、当前 state/current projectedLedger，不重算成新执行。

## Receipt 与五核 closed audit

根 Receipt 完整字段：envelope、revisionBefore、revisionAfter、policyDigest、catalogDigests.production/merchant、clock、steps、ledgerDigestBefore/After、scope、rngDraws:0、techniquePoints:'not-modeled'、nativeIntegration:false。

每个 StepReceipt：index、action、ledgerDigestBefore/After、changes、audit。audit 是 `{kind:'domestic',detail}` 或 `{kind:'merchant',detail}`。

Domestic detail 保留 calculation、fees、rewards、events、sideEffectsNotModeled、rngDraws。calculation 有 observationKind:'derived-adapter-observations'、selectedOfficerIds、securityKernelReturn、quantityKernelReturn、quantityPreCapacity、priceKernelReturn、timeKernelReturn、facilityApplied、earlyCharmSum、moraleSecuritySnapshot、newRecruitMorale、securityWrite、troopWrite、inventoryWrite、moraleWrite、kernels。无关字段仍为原 null/false；核序为 Patrol[patrol]、Recruit[quantity,security]、Produce[price,quantity]，probe 不进 kernels。

所有 Write 保留 before/requested/returned/actualDelta/after/cap/discarded/policyId；signed delta 不得误作非负余额。奖励按所选人物序，XP与merit两个 Write 分开。实际 changes 的稳定路径序详见规则正文，不同于奖励序，也不包含零变化。

KernelAudit 以 api 字面量区分五个完整闭合 input/output：

- calculatePatrolSecurityGain：stable profile，1–3 非 null leadership 输入0–255，publicOrderByte0–100，pressure0/1；output normalizedLeadershipSlots恰三项，尾缺位null，sum0–765，完整 gain/cap 分支
- calculateRecruitmentQuantityProjection：正式 captured-quantity-projection；savedSecurityByte0–100、三种 factor bits、difficulty0/2、完整 captures；output 三槽、所有正式计算字段、trace 与 callDetails，非super的cityVirtualEax和无fallback的secondTroops/Capacity才可null
- calculateRecruitmentSecurityArgument：savedCharmSum0–765，savedTroopReturnU32/securityDeltaU32为0–4294967295；signedTroopReturn signed32，divisor100–865，quotient/remainder/securityDeltaSigned为 signed safe integer
- calculateProductionPrice：resolved profile、uint16原价、specialty0/1，完整 AL/discount/returnedPrice（允许0）
- calculateProductionQuantity：resolved equipment1–4，恰三 slots，存在槽 intelligence0–255/skill0或1、缺位null；difficulty0时无cityVirtualEax字段，2时有0/1；output正式resolved分支、skillQueryId80/81、全部 factor/转换/难度审计

Recruit capture 的固定顺序为四个入门 eax1（3619/3630/3643/364B）→依次slot0/1/2 validity（367B），存在者再charisma（3689）和skill（36AA）→super才有3725→pressure3738→当前兵374E→容量3757→fallback才有3764/376B，地址共同前缀005C。callDetails 另在slots后插入36C8/factor和3710/converter；不能放进捕获 trace。

callDetails 的地址/target 映射闭合：3619/3630/364B/367B→0047A630，3643→004866F0，3689→004890B0，36AA→004890F0/queryId79，36C8→005C3550，3710→00707A74，3725→vtable+0x48，3738→004B99B0，374E/3764→vtable+0x50，3757/376B→00486BC0。其他 queryId=null；只有三类slot调用有slotIndex0/1/2，其他为null。factor条 kind=captured-st0-f32、eax=null、bits为三种固定值；converter条 derived-converter-eax；其他 captured-eax，非factor st0Bits=null。这些是固定审计字段，不提供任意原生地址调用接口。

Merchant detail 保留 ownerSnapshot、AP before/requestedDelta/actualDelta/after/cap/policyId、fixedGoldFee:0、旧 merit/TP/loyalty delta:0、rngDraws:0、非null trade，另加 merchantMerit:'not-modeled-preserve-existing'。trade 保留 direction、priceScale、Q、politicsEffect与未约分fraction、sellFactor、exactGold、rounding、remainder、roundingDifference、settledGold、eligibility完整unitChecks、人物/商人新marker、gold/food两write、外部对手方delta及共享politics XP饱和审计。十进制分数串无前导零（0独立），denominator>0。

任何保存/trace 输入携带 audit 都只用于比较；不是 trusted quote，不能指挥执行。

## 保存与完整重放

raw save 为 `{tag:'san11-bounded-city-economy-save-v1',state}`。canonical 排序对象 key，数组保留原序；所有 digest 是 canonical UTF-8 SHA256，64位小写hex。load 严格拒绝重复解码 key，包括原始文本里的 `"id"` 与 `"\u0069d"`；不能先 JSON.parse 整个对象造成覆盖后才校验。

load/rebuild 重新校验 genesis，生成唯一 revision0 ledger 并 fit，再逐条以同一 transition fold 完整 acceptedCommands。每条历史 envelope、receipt、所有核/Write/fraction、revision、前缀预算/不变量和最终完整 State 都须相等。历史内不允许 duplicate entries；stored digest、policy ID、手写 revision、最终余额或 expected 不能代替这些步骤。没有 checkpoint、剪历史、reset-genesis、merge-saves、外来credits或repair receipt接口。

Trace 为 `{tag:'san11-bounded-city-economy-trace-v1',scenario,attempts,expectedFinalState}`；attempts≤512，每项 `{envelope,expected}`，expected 为 null、完整成功 `{ok:true,duplicate,receipt}` 或完整 Failure。expectedFinalState 为 null 或完整 State。期望只比较；合法拒绝和 duplicate 可被记录为尝试，但不进入 accepted history。expected 不匹配时 replay 外层失败 state:null；全部 outcomes 的预算失败也如此。

## 统一预算与 fit

固定 v1：≤8MiB 真正 UTF-8，≤250000节点，最大深度48，数组≤4096，对象≤128键；history≤128，actions1–8，trace attempts≤512，legal候选上限128，pageSize1–4。schema 本身不能测量 byte/node/depth 或执行安全对象检查；运行时边界负责这些要求。

revision0 和每次候选提交前，fit 检查 State、create/load成功包、inspect、raw save、包含转义serialized的 SaveResult，以及本次 execute/preview 完整返回。还在当前 state 上构造全部历史 ID 的 duplicate execute 和 duplicate preview 返回：旧大 receipt 搭配当前 state/ledger 也必须 fit。preview 不可省略 save/转义或 duplicate 预算；raw save fit 不意味着 SaveResult fit。

所有数组/字符串在大 canonical 分配前先有界检查，文本先 length快门再真UTF-8计数；拒绝Proxy/accessor/symbol/cycle/稀疏数组/非法prototype/非整数/超safe/NaN/Infinity/负零。Node24 的 Proxy 防线只适用于其 intrinsic 可用的边界；其他环境不应宣称等价 Proxy 检测，只承诺可信 JSON/unpolluted realm。不得对外来异常对象调用 getter/trap 或回显。

预算不是保证所有最大字段组合都同时成功。到历史上限可 inspect/save/load/retry已有ID，但新ID拒绝；不隐式丢历史。固定AP本身最多支持12个成功动作，128只是防御额度。

## LegalRequest 与无状态连续分页

请求精确字段：

```ts
{
  requestId, expectedRevision,
  domesticOfficerIds: null | [/* 1–3 unique IDs, ordered */],
  merchantRequests: [/* 0–16 unique {officerId,foodAmount} pairs, ordered */],
  cursor: null | {version:1,orderVersion:'genesis-facility-and-request-order-v1',
    stateDigest,requestDigest,revision,nextIndex},
  pageSize: 1|2|3|4
}
```

stateDigest 覆盖完整 State，包括所有 genesis/history IDs/receipts/revision/ledger，不能只 hash 当前余额。requestDigest 覆盖 requestId、expectedRevision、domesticOfficerIds、merchantRequests 四字段及所有数组顺序，明确不含 cursor/pageSize。改变 pageSize 可继续，改变探针或选人顺序不能。

query 先完整重建state并校请求/expectedRevision。cursor版本/orderVersion不支持为 unsupported-cursor-version，shape/hex/范围坏为invalid-cursor，页长坏为invalid-page-size。先比较 cursor revision/stateDigest（cursor-state-mismatch），再 requestDigest（cursor-request-mismatch）。不静默从头重启。

候选全清单先产生：domestic非null则先Patrol，再按genesis设施序：barracks一条Recruit、forge三条Produce1/2/3、stable一条Produce4；最后按merchantRequests序每项Buy再Sell。不会筛掉未用资格/解锁/设施完成失败，拒绝同样作为可见候选。最多1+30×3+16×2=123。每个globalOrdinal从0起，ID=`legal:<requestId>:<globalOrdinal>`，expectedRevision固定请求版本，一条one-action envelope可直接执行。

在评估任何页之前，对整个候选清单（包括后页）做history ID碰撞扫描；任一碰撞整query为candidate-id-collision，不把duplicate当新legal。cursor是可公开重算的位置，不是签名/权限/可信状态，可以从任意合法中间index开始；非null nextIndex必须0≤index<total，不能指向已完结的total。total0仅允许初始null cursor，返回空且完结。

成功页完整字段：ok、baseRevision、stateDigest、requestDigest、totalCandidates、startIndex、endIndexExclusive、nextCursor、completePage:true、enumerationComplete、globalCompleteness:false、candidates、notEnumerated。每candidate包含globalOrdinal、exact envelope、完整PreviewResult。notEnumerated固定为other-officer-selections/other-food-amounts/multi-action-batches。

每页从start=cursor.nextIndex或0连续评估，最多pageSize条，使用与public preview同义的transition+fit。每加一条均测量真实页包（含end/实际nextCursor/全部metadata）；保留可fit的连续前缀，不跳过拒绝/超大项，不重排，不省audit。若第一项连页包装都不能fit，顶层budget-exceeded，无零进度cursor；已有正长度前缀能fit则返回它，nextIndex指第一条未返回者。

候选自身 preview 因其 execute/save/duplicate预算失败，是该candidate.result的budget Failure，仍占一个ordinal；候选本身可fit但叠加页包装不fit，是query包装预算问题，不能伪装成候选不合法。两种层次明确区分。

恒等式：candidates.length=end−start；ordinal严格[start,end)；0≤start≤end≤total；非空待枚举页end>start；end<total时cursor.nextIndex=end且digest/revision不变；end=total时cursor=null。completePage只表示本区间完整；enumerationComplete等于nextCursor===null，只表示无后续区间；调用者仍需核0..total的覆盖，不得用最后一页声称前页已读。提交任何候选改变revision，所有旧cursor与其余exact envelope均变旧。多个独立可行候选不能据此声称同一batch可行。

## 独立 CLI

入口 `apps/text/city-economy-play.mjs`，脚本 `npm run play:city-economy`。旧 play/parse-input/demo 不改。CLI 无网络服务/后台/全局配置/凭据/自动同步。

无参数仅 help/quit/inspect/trace。文件命令仅 create/load/replay/preview/execute/legal/save，后跟一个 JSON string 路径。例如：

```text
create "data/scenarios/bounded-city-economy-example-v1.json"
legal "data/scenarios/bounded-city-economy-legal-v1.json"
preview "data/scenarios/bounded-city-economy-actions-v1.json"
execute "data/scenarios/bounded-city-economy-actions-v1.json"
inspect
save "new-city-economy-save.json"
trace
quit
```

命令行≤8KiB UTF-8，verb后只允许空格/Tab，末尾只允许空格/Tab；路径允许空格，但必须一个完整JSON-string token，空/NUL路径、多余token、未知verb拒绝。路径是本地字面量，没有shell展开、环境插值、eval、动态import、URL fetch或脚本执行。

文件先open并看描述符元数据，普通文件才读；分块累计最多8MiB+1，文件增长仍按实际字节拒绝。严格UTF-8，非法字节/BOM/尾部垃圾拒绝。所有scenario/envelope/legal/trace/save先过同一个无状态有界重复解码key拒绝parser，再进对象API；不复制另一份parser，也不先JSON.parse整文档。parser同时限制节点/深度/数组/键数，拒绝负零、非整数、超safe；科学计数仅解码后为safe integer且非负零才可过字段校验。

没有session时只可help/quit/create/load/replay。create必须显式文件，不默认清空当前世界；create/load/replay仅完整成功且所有输出fit后替换session，失败保留原session。execute成功即内存提交；stdout或文件IO失败不重执行，也不回滚已经持有的新state。文件保存是另一个显式效果。

save先完整引擎save，再用wx独占创建新文件；现有路径拒绝，无force/覆盖/自动保存/重试。成功输出包含saved:true/memoryCommitted:false。中途IO失败返回io-error和partialNewFileMayRemain:true，可能留下新建但不完整的文件；不偷偷删除、覆盖或重执行动作。quit不写文件。

trace是只读输出由当前acceptedCommands派生的Trace，scenario=genesis，每项expected={ok:true,duplicate:false,receipt}，expectedFinalState=当前state。CLI不保留失败/duplicate/preview的第二账本，trace超整体预算只返回失败，不截断。需要包含失败尝试的回放时由显式外部trace提供，expected仍只能比较。

CLI错误是小型 `{ok:false,kind:'city-economy-cli',reason}`，reason为invalid-cli-input/no-session/not-regular-file/io-error/budget-exceeded；引擎API失败保留引擎Failure。严格文件decoder的细节拒绝在CLI读文件层归为invalid-cli-input（预算保留budget-exceeded），不会回显文件内容/异常对象。

## 可用性与未建模范围

它可演示真实共享金/AP/行动和全部历史重算；没有共同scheduler、任务、native人物身份或ownership、capture/death/inheritance/mission finalizer、原作存档兼容、完整force TP或原生merit/loyalty算法。保持这些明确边界，不能因新增CLI或合法动作列表就称为“全世界已可玩”。
