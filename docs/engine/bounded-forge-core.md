# Bounded forge 私有 core：v1 兼容复用

这是 `bounded-forge-development-production-v1` 的私有兼容抽取。core 不是独立 owner，不接 public State/save，不构造可信根，也不产生 native 等价证明。公共入口、完整输入读取、历史重建、提交与预算仍由 [v1 owner](../../packages/engine/src/bounded-forge-development-production.ts) 独占；[完整 API/DTO 合同](bounded-forge-development-production.md)和[完整规则](../rules/bounded-forge-development-production.md)继续定义现有行为。

本页描述的源段固定来自 [PR96 已有 root，提交 9a9305cf2458487a07baed11e1b09c24c9130308](https://github.com/DanielMax937/sanguozhi/blob/9a9305cf2458487a07baed11e1b09c24c9130308/packages/engine/src/bounded-forge-development-production.ts)，root Git blob 为 `ba17782812176a88fbe91518760c470187092d72`。下文“旧行”只指该版本。抽取改变代码位置和几个私有签名，不改变原数值核、listing、registry 或 source manifest 的来源身份。

验证边界为静态实现、逐段文本比较、类型接口与调用点阅读及既有整数/字段证明；未运行测试、示例、typecheck、compile、build、runtime、checker、validator、场景/命令序列或产品尺寸测量。没有运行通过、性能、峰值内存、缺 intrinsic 环境或原作世界行为认证。

## 1. 模块职责与来源映射

|私有模块|职责|固定旧 root 源段|
|---|---|---|
|[bounded-forge-core-errors.ts](../../packages/engine/src/internal/bounded-forge-core-errors.ts)|唯一 WeakMap 错误品牌、stop/caught|90–101|
|[bounded-forge-core-data.ts](../../packages/engine/src/internal/bounded-forge-core-data.ts)|owned canonical clone/全文比较/SHA-256、原 primitive readers、旬历推进|111–118、123–139、141、143–145、154–162|
|[bounded-forge-core-types.ts](../../packages/engine/src/internal/bounded-forge-core-types.ts)|两个闭合的内部事实/开工上下文视图|只引用原 Scenario 字段，不复制旧 DTO|
|[bounded-forge-core.ts](../../packages/engine/src/internal/bounded-forge-core.ts)|现有三命令业务与完整内部输出反查|240–488；私有 MAX 取旧87的同一固定值|

具体业务映射如下。除表中列明的签名和 private-module export 外，保留每个表达式、条件、字面量、对象 key 插入顺序、数组顺序、读写次序、核调用、clone 次数、错误与返回值。

|旧行|声明|改变|
|---|---|---|
|240–244|RATE_EVIDENCE|无，仍 file-private|
|245–253|rateReceipt|增加 private-module export|
|254–262|constructionWrite|增加 private-module export|
|263–268|writeConstruction|无|
|269–277|domesticWrite|无|
|278–280|expectDomesticWrite|无|
|281–335|productionAudit|Scenario 注解改为 ForgeCoreFacts|
|336–347|domesticFrame|同上|
|348–357|domesticReason|无|
|358–373|produce|增加 export；Scenario 改为 ForgeCoreFacts|
|374–378|forgeCatalog|Scenario 改为 ForgeCoreFacts|
|379–382|startSnapshot|增加 export；Scenario 改为 ForgeCoreFacts|
|383–429|startForge|增加 export；State 改为 ForgeCoreStartContext|
|430–446|completionReceipt|无|
|447–473|completeForge|Scenario 改为 ForgeCoreFacts|
|474–488|advanceShared|增加 export；Scenario 改为 ForgeCoreFacts|

owner 保留旧102–110的 atStage/freeze、119–122的 detach/budget、140/142/146–153/163–167的高层字段读取、168–239的 policy/scenario/initialState/envelope/command，以及489–695的不变量、transition/rebuild/fitRoot 和七个公开函数。后一段唯一业务 call-site 改动是旧621的 Start 上下文包装，见§3。原239的结束括号也保持。

旧 types、registry、JSON、index、policy/schema/scenario/source、construction/domestic helpers、数值核与包配置均不因本次抽取改变。没有通用 owner factory、profile mode、注册表、缓存、callback 接口或可插入阶段的 hooks。

## 2. 精确私有类型与完整签名

### 2.1 事实与开工上下文

```ts
import type { Scenario } from './bounded-forge-development-production-types.ts';

export type ForgeCoreFacts = Pick<Scenario,
  | 'advanceLimit'
  | 'activeForceId'
  | 'force'
  | 'corps'
  | 'city'
  | 'officers'
  | 'lots'
  | 'domestic'
  | 'constructionEnvironment'
  | 'productionCatalog'
  | 'constructionCatalog'
  | 'policy'
>;

export type ForgeCoreStartContext = {
  genesis: ForgeCoreFacts;
  revision: number;
};
```

12个字段全部直接沿用[固定版本的旧 Scenario 定义](https://github.com/DanielMax937/sanguozhi/blob/9a9305cf2458487a07baed11e1b09c24c9130308/packages/engine/src/internal/bounded-forge-development-production-types.ts)。policy 是原完整精确 Policy，包含 construction、domestic、固定 ID/版本/字面量和全部 budgets，不是只有政策 ID 或局部 policy。Job、Write、Receipt、ProductionAudit、QuantityOutput 等仍使用同一份旧闭合 DTO，没有复制一套宽类型。

Facts 是 TypeScript 结构型视图，不是运行时 exact-key parser、自动删除额外字段的投影、nominal 身份或可信 token。实际 owner 仍直接传入完整、已验证的 genesis 引用；Scenario 超集可赋给 Facts，额外字段并未被复制或删除。数值域和跨字段关系仍由 owner 的 detach/parser/full fold 证明。

视图不包含 schemaVersion/profile/episodeId、genesis.clock/facilities、State tag/current/history 或“已验证”标记；StartContext 只补当前 revision。它们不出现在 public API、任何保存/收据/历史或持久缓存。沿用旧可变嵌套类型不授予业务写 genesis 的权限；源码中的唯一业务 mutation 对象仍是 owner 已 clone 的 Current 候选。

### 2.2 错误与数据叶签名

以下是实现的签名索引，非可调用的公共 SDK。errors 的 Context/failure/WeakMap 不导出；data 的 Hash/runtime/crypto 不导出。

```ts
type Context = Partial<Pick<Failure, 'blockingUnitId' | 'officerId' | 'facilityId' | 'jobId'>>;
function failure(reason: Reason, stage: Stage = 'input', context: Context = {}): Failure;
export function stop(reason: Reason, stage: Stage = 'input', context: Context = {}): never;
export function caught(error: unknown): Failure;

export function clone<T>(value: T): T;
export function same(a: unknown, b: unknown): boolean;
export function digest(value: unknown): Digest;
export function record(value: unknown, reason: Reason = 'invalid-fields'): Record<string, unknown>;
export function object(value: unknown, keys: readonly string[], reason: Reason = 'invalid-fields'): Record<string, unknown>;
export function integer(value: unknown, max = Number.MAX_SAFE_INTEGER, min = 0, reason: Reason = 'invalid-number'): number;
export function literal<T extends string | number | boolean | null>(value: unknown, expected: T, reason: Reason = 'invalid-data'): T;
export function choice<T extends string | number>(value: unknown, options: readonly T[], reason: Reason = 'invalid-data'): T;
export function jobId(value: unknown): JobId;
export function array(value: unknown, max: number, min = 0, reason: Reason = 'invalid-array'): unknown[];
export function advanceDate(value: DateV1, count: number): DateV1;
```

clone 仍为 `JSON.parse(canonicalBoundedForgeJson(value)) as T`；same 比较两份完整 canonical 文本，不能用 digest 等值代替。record/object 保留旧 object/array/exact-key 门，integer 保持 safe integer、拒绝 -0 和原范围；没有 half-integer 模式。jobId 保留两条完整正则，不截断 `job:` 后的 ID。advanceDate 先 clone，再每轮执行1→11→21→下月1与年份溢出门，不引入第二时钟或公历加十天。

这些函数只处理已有 owned 数据和原内部返回值读取路径。原 `Record<string, unknown>`、unknown 参数和 clone 的局部断言并不成为新的 unknown audit/receipt，也不能代替安全输入 detach。

### 2.3 三命令业务的全部签名

```ts
const MAX = 1_000_000_000;
const RATE_EVIDENCE: RateEvidence; // initializer 为旧240–244的完整固定证据

export function rateReceipt(value: unknown, politics: number[]): RateReceipt;
export function constructionWrite(value: unknown): ConstructionWrite;
function writeConstruction(before: number, delta: number, cap: number, policyId: string): ConstructionWrite;
function domesticWrite(value: unknown): DomesticWrite;
function expectDomesticWrite(value: unknown, before: number, requested: number, cap: number, policyId: DomesticWrite['policyId']): DomesticWrite;
function productionAudit(value: unknown, s: ForgeCoreFacts, c: Current, action: ProduceCommand, commandId: Id): ProductionAudit;
function domesticFrame(s: ForgeCoreFacts, l: Ledger): DomesticInstantFrame;
function domesticReason(reason: DomesticReason): Reason;
export function produce(s: ForgeCoreFacts, c: Current, action: ProduceCommand, commandId: Id): { audit: ProductionAudit };
function forgeCatalog(s: ForgeCoreFacts): { goldCost: 300; techniquePoints: 30; durability: 800; typeId: 34 };
export function startSnapshot(s: ForgeCoreFacts, clock: Clock, lot: Lot, people: OfficerRow[]): StartSnapshot;
export function startForge(state: ForgeCoreStartContext, c: Current, e: Envelope, action: StartCommand): StartDetail;
function completionReceipt(value: unknown, before: Current, job: Job): Completion;
function completeForge(s: ForgeCoreFacts, c: Current, job: Job): Completion;
export function advanceShared(s: ForgeCoreFacts, c: Current): TickDetail;
```

core 恰导出六个内部函数；其余声明和常量 file-private。类型依赖只来自旧 DTO、旧 city-service-types 和两个新视图，不反向 import owner。六个函数都没有 services、callback、Mode、factory、外部资源或用户可替换逻辑参数。completeForge 内部仍原位构造 phase 的固定 write/resolver 闭包，它们不是 core 调用者的扩展点。

旧 `clone(r) as unknown as RateReceipt` 与 `clone(qo) as unknown as QuantityOutput` 保留在原 exact14/rate证据与 exact20/三槽/input-output 绑定检查之后，用以保持旧返回形状和 key 顺序。没有新增 `as Scenario`、`as State`、`as Policy` 或绕过前置门的信任断言。

## 3. owner 接回与唯一上下文包装

owner 保留 registry/JSON imports 和 `calculateConstructionDevelopment`；后者仍由 currentInvariant 实际重算速率，不能因 Start 移走而删除。其后先 import core，再 errors/data。旧 public type import 和71个 readonly aliases 不清理或改序。

唯一业务调用点变化为原 construction 闭包内：

```ts
if (parsed.type === 'StartForgeDevelopment') branch = { kind: 'forge-start', detail: atStage('construction', () => startForge({ genesis: state.genesis, revision: state.revision }, current, e, parsed)) };
```

这保留原 genesis 引用和 revision 值，不带 history/current/tag/receipt，不 clone、不冻结、不登记，也不存入输出。包装把 revision 的属性读取从旧414的历史槽门提前到调用前；等价的前提是此处 state 由完整 fold 创建，是 owned plain 对象，没有 getter/Proxy，且这一同步路径既不改变 revision，也没有用户可替换 callback。这里不声称对任意恶意 getter/Proxy State 有逐属性读取时机等价；公共输入仍先安全 detach 和完整重建，不会把这种外部对象直接交给 Start。

Produce/Advance 的旧622–623调用文字不变；currentInvariant 对 constructionWrite、rateReceipt、startSnapshot 的调用文字和完整结果比较不变。Start snapshot 的完整 policy/catalog digest 仍在旧381/415对应调用点计算，invariant 也继续重算完整 snapshot；没有预计算、缓存或缩小摘要对象。

## 4. 唯一错误品牌与失败包装

errors 模块只含一份 `WeakMap<object, Failure>`。stop 创建一个空对象 token，向该 Map 写入完整 Failure，再抛出 token；只有 stop 能登记，Map 和 token 注册接口都不导出。owner、data 和 core 通过相同相对模块路径解析到同一个品牌实例，owner 不保留第二份 Map。

caught 只做 null/typeof/WeakMap.get，不读取任意异常的 name/message/stack 或其他属性。不属于该 Map 的 Error、普通对象、null、primitive 仍返回 `invalid-data`。Failure 恰保留 ok/committed/stage/reason 及 blockingUnitId/officerId/facilityId/jobId 四个 nullable 字段，缺省为 null；没有自由异常文本。

owner 的原 atStage 保留：budget 的阶段仍为 budget，其他错误按当前 construction/domestic/tick/invariant/rebuild 包装覆盖，身份 context 原样接回。历史 transition 无效仍映射 history-recomputation-mismatch，budget token 原样抛出；replay 仍逐 attempt catch，聚合 budget 错误的 index/state 都为 null。receipt digest 仍在业务闭包之后原位置，不能移入业务阶段。

没有新增 catch、Result-union 协议或 fallback；其他模块的错误协议不用于替换本 root 的已有身份协议。

## 5. 三命令的读取、审计与真实引用

### 5.1 Start

顺序仍为 city→owner→永久 job 历史门→完整 unitChecks 后首个 blocks→按选人顺序逐人 exists/member/available/reservation/acted→AP→gold→lot/占用/facilityId→完整 catalog→development 核/rate/duration→horizon/date→完成历史槽→JobId/snapshot。首阻挡单位、首失败人物及其 context 均保持。

原写序是 facility push→AP Write/落账→gold Write/落账→组 Job→人物 reservation/acted→append job。snapshot 的日期、lot、人物投影与返回 StartDetail 的 job/facility 独立复制；未来完成不能反写旧 Start receipt。rate 的完整 evidence 不被摘要、删减或重算近似值替代。

### 5.2 Produce

domesticFrame 仍来自真实 current 的 AP/gold、四槽库存、五项 XP、merit、acted/reservation、当前设施生命周期。资格/价格/caps/policy 来自固定 genesis。新设施在完成前传 level=targetLevel1、complete=false、reservation=jobId；不能从 genesis 的初始设施列表伪造当前资格。

恰调用一次旧 reduceDomesticInstant；其 city/人物/设施/unlock→price→quantity→库存/奖励→zero-yield→gold足额→AP足额→gold/AP扣费→acted/used 顺序不变，不新增提前 AP 门。productionAudit 完整反查 exact6 audit、exact16 calculation、两个 kernels、price7字段、quantity20字段、三槽、difficulty/controller/skill/input-output绑定、fees/rewards/events/sideEffects/rng，保留全部 null 和 facilityApplied=false。

随后按原位置 clone before、构造 expected、比较整个 reducer candidate。回写白名单仍仅 gold、AP、目标库存、参与者 intelligenceXp/merit/acted、目标 facility.usedTurn；政治 XP、TP、job、预约和其他字段不会被新 frame 覆盖。不把 frame cast 回 Current。

### 5.3 Advance 与 Completion

horizon 后恰推进一次 date/turn/advancedCount，恢复一次 AP，再推进真实 job 的 remaining/work，并反查完整 progress，最后到期完成。不会调用第二个拥有 clock 的服务。

completeForge 先核当前设施预约、due turn/date 和完整 work，再 clone before。completeConstructionPhase 收到的是同一个候选 job、facility、force 引用；requireReservedOfficer 在 phase 每人即将成长时查当前 ledger 的真实 OfficerRow，不提前批验，不使用需要额外回写的影子对象。

phase 写序仍为 TP 计算并落 force→按选人顺序 resolver→该人 politicsXP 计算→merit 计算→XP/merit落账/释放/acted→设施 status/effectiveLevel/jobId→job.completedTurn。完整 Completion 反查和 full Current expected equality 在原位置；之后分别 clone 到 job.completion 与 TickDetail，两份完整审计都保留。

## 6. 完整 owner、原子性和保存等价

execute/preview 仍先 detach state、再 detach envelope、完整 rebuild state、读 envelope 外层，然后 dedup→revision/history→command shape/domain。相同旧 ID 的全文相同 envelope 返回旧完整 receipt 加最新 state/current；冲突优先于 stale。core 不登记 ID、不接 public state，也不持有 accepted history。

原 transition 在业务前 clone Current。业务内部无持久 State、外部 effect 或用户 callback；费用、后一个 resolver、最后 audit/invariant、receipt digest 或 fitRoot 任一处失败，都丢弃完整候选，不发布 state、不追加历史。公共最终 freeze 和 caller-owned 输入保护不变。

静态兼容论证以不变 initialState 为起点，以三分支相同候选/完整 detail/错误为单步关系，结合保留的 transition shell 逐 accepted prefix 归纳。于是每个 state/receipt 保持，preview 仍只是相同成功结果的投影；rebuild 仍逐历史 full fold、全文比较 receipt，最终全文比较 raw State。save 仍为 canonical SaveEnvelope 完整字节；load exact-tag/full-fold；replay 每个 attempt 的结果与 expected 仍全文比较。digest 不代替任何一项全文比较。

Facts/StartContext 不进入 genesis、Current、Job、Receipt、history、save 或 replay。没有新 trusted-state 路径、token、可复用验证缓存或保存迁移。

## 7. Node 初始化与 owned-data 边界

owner 先保留 registry→JSON→construction leaves 的依赖，然后载入 core；core 的运行时 imports 顺序是 leaves→construction phases→domestic reducer→errors→data。没有 owner 反向依赖。旧 phases/reducer 及其既有数值核/冻结常量仍在 crypto lookup 前初始化，唯一错误 WeakMap 同样先于 lookup。

data 保留原一次 `runtime.process?.getBuiltinModule?.('node:crypto')`。Hash 仍是局部结构型 `{ update(text: string, encoding: 'utf8'): Hash; digest(encoding: 'hex'): string }`；没有新增 Node ambient types、npm依赖、WebCrypto、随机 fallback 或 runtime adapter。缺 crypto 时仍只在实际 digest 调用点 stop invalid-data，摘要仍针对完整 canonical UTF-8 作 SHA-256；没有 eager digest。

MAX/RATE_EVIDENCE 只是原固定普通常量，不引入外部操作。root 政策常量仍在原169对应位置 `freeze(clone(ROOT_POLICY))`，只冻结 owned 副本，不冻结 imported registry 或调用者。

原 JSON 模块字节不变：node:util isProxy intrinsic 在 Array.isArray/prototype/ownKeys/descriptors 前；缺 intrinsic 时对象输入 fail closed；descriptor-only detach 不执行 getter/toJSON/iterator；cycle 拒绝、非cycle alias 按出现次数计数；重复解码 key、UTF-8、safe integer/-0、depth0 和全部五种预算保留。data 的 canonical clone 不是另一套输入验证器。上述是依赖位置和原路径的静态论证，不是浏览器、旧 Node 或任意猴子补丁环境的运行认证。

## 8. 公开协议与所有预算保持

71个原 readonly public aliases、七个行为入口和固定 `BOUNDED_FORGE_DEVELOPMENT_PRODUCTION_POLICY` 常量不变；constant 不是第八个行为 API。日期名仍为 `BoundedForgeDevelopmentProductionDateV1`，没有重复 V1 后缀。PROFILE/STATE_TAG/SAVE_TAG/TRACE_TAG、Reason/Stage/Failure、全部 DTO 和 schema 不变，两个新视图没有 public aliases，package index/exports 没有新入口。

owner 的 fitRoot 仍逐包核 State、create/load、Inspect、raw SaveEnvelope、escaped SaveResult、最新 Execute/Preview，以及历史每个旧 receipt 加最新 State/Current 的 duplicate Execute/Preview。不能只核最新小 Tick，也不能把内部引用共享当作只计一次。

|独立包|nodes上界|UTF-8 bytes上界|
|---|---:|---:|
|State|9200|1288000|
|create/load|9202|1288280|
|Inspect|367|51380|
|raw SaveEnvelope|9202|1288280|
|escaped SaveResult|3|2576587|
|新 Execute / 任意旧 ID duplicate|9569|1339660|
|新 Preview / 任意旧 ID duplicate|730|102200|
|完整512 ReplayResult|197619|7459000|
|完整512 Trace input + expectedFinalState|205075|7902000|

这些是[原全域静态预算](bounded-forge-development-production.md#9-全域静态预算证明)的继承，不是本次新测量。Start/Produce 每次20 AP、初始≤255、每 Tick 恢复≤20、T≤12，故 P+S≤24、S≤1、history≤36。完整 completed Job、旧 active Start receipt、双 completion、每份 envelope 都没有删减。形状和值的逐步等价使各包 node/byte/depth 上界不增长；escaped SaveResult 仍为 `2B+27`。

安全上限仍是8,388,608 bytes、250,000 nodes、depth48、array4096、object128。合法最大数组512，所有包 depth≤15；对象取≤32的保守宽界已足够。完整 Trace 仍余486608 bytes/44925 nodes，expected 只比较，不驱动 transition；512不意味着任意伪造巨型 expected 都必须接受。

完成尾仍依靠 Start 的 horizon/date/history 预留、双向锁、AP恢复及正向TP/XP/merit饱和写、每一未来 prefix 的完整预算。保证工程完成，不保证完工后仍有钱、AP、可用人员或余旬生产；末旬完成且仅有参建者时，他们已 acted 是合法结果。

## 9. 复用边界与非目标

这里只有现有 v1 的精确 Policy，没有新 profile、月产 policy、半整数 JSON、太守、30槽、新设备或新 receipt/trace/save/fold。财政、工资、HP、维修、P078及其依赖也不由本次抽取接入。ordinaryTechniquePoints 仍为 not-modeled，nativeIntegration 仍为 false；既有 provisional、MOD排除、clean-stock/跨平台与原生调度未证实的结论均不升级。

未来具体新 profile 的完整 policy 不会自动等于 ForgeCoreFacts.policy。复用前须单独定义并审阅那个新 policy 的精确类型接缝，保留 StartSnapshot 对完整 owner policy 的 digest 与原调用时点；不能通过 generic/unknown、`as Policy` 或双重断言逃过现有闭合类型。新预算、保存和完整 owner fold 同样须另行建立。私有 core 的存在本身不授予新规则或公共框架承诺。
