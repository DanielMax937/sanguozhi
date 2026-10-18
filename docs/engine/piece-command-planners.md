# 旧城市 piece 命令的私有规划器

本次只把 `city-command-lifecycle.ts` 已有的 piece 计算、开始准备、收费和单项完成数学拆成内部规划器。它保持原 `city-command-lifecycle-v1`、全部 piece 类型 5/6/7/8/10/11、全部注册政策及旧 public API；不增加场景、公共入口、共享时钟或任务根。游戏规则见 [城市命令生命周期](../rules/city-command-lifecycle.md)。即时动作继续使用 [instant reducers](instant-command-reducers.md)。

即时归约器文档中“piece 时间/完成数学留在 owner”的说明记录其先前抽取阶段；当前 piece 数学位置以本页为准。该文档的即时动作与商人合同不变，piece 的提交、clock/AP、snapshot、job 和 history 所有权仍在旧 owner。

本次只进行文本静态审阅；没有运行测试、typecheck、编译、build、runtime、示例、checker 或 validator。既有文档的运行限制继续适用，不因此宣称原游戏等价或完整运行验证。

## 文件与所有权

| 私有文件 | 工作 | 明确不拥有 |
|---|---|---|
| `internal/city-piece-types.ts` | 具体输入、计划、完整三核审计、closed typed rejection | runtime imports、registry、State、公开类型替换 |
| `internal/city-piece-calculation.ts` | price → one-piece quantity → time 适配及时间政策 | 余额、预约、完整 snapshot、clock、history |
| `internal/city-piece-start-reducer.ts` | 按旧顺序准备开工；另一个函数规划收费 | Job、Receipt、history、trusted state、实际写账 |
| `internal/city-piece-completion-reducer.ts` | 一个已到期 job 的库存与当前 XP/merit 计划 | 日期推进、AP 恢复、队列递减、人员/设施释放 |

依赖仅向既有 `city-service-types`、`city-domestic-leaves`、production-time 核及这些 piece 模块。不存在 internal → lifecycle/index/council/root 的 runtime 反向依赖。内部函数虽有模块 export，但不从 package index 导出，不是调用者提供审计、绕过验证或制造可信状态的入口。

旧 owner 仍负责 public detach/validate、原 Invalid/fail/error/catch、duplicate/stale/revision、StartSnapshot、Job、完整 Receipt、唯一提交、history、trusted WeakSet、save/load/replay 重建。两个窄函数的成功结果为 `{ok:true,value}`；开始准备为 `{ok:true,plan}`。owner 对 start 显式检查 `ok` 后取 `plan`，对 fee/completion 用 `unwrapPiece` 取 `value`，失败仍调用原 `fail(reason)`。不使用 optional value 或 `any` 混淆两种成功壳。

## 精确读视图

所有输入来自旧 owner 已验证的私有候选；规划器不调用 public parser、execute 或另一个 state validator。只读形状不是新增对外输入承诺。

| 函数 | Context / action | Frame 内容及理由 |
|---|---|---|
| `calculatePieceProduction` | 无 context；equipmentType | 按命令顺序 selected people 的 id/intelligence/skillIds，选定 basePriceWord、specialty membership、drillGroundComplete、time policy |
| `planPieceStart` | commandId/turn；Produce/cityId/officerIds/facilityId/equipmentType | activeForceId；city id/drill 和六种 piece stock；所有人物 id/forceId/cityId/available/intelligence/skillIds/actedTurn/reservationJobId；所有设施 id/cityId/kind/complete/usedTurn/reservationJobId；完整 unlock/specialty 列表；六种 piece 价格；time/productionAp；全部 productionJobs.length |
| `planPieceStartFees` | 无 context；刚生成的 goldCost/actionPointsCost | 当下 gold/actionPoints；不接收 public supplied fee 或批准 token |
| `planPieceCompletion` | owner 已推进的 turn；jobId/reservedQuantity | 对应当前 stock；按 job.officerIds 排列的当前 id/xp/merit；当前 writer/rewards |

开始视图通过 `copyOwned` 保留 primitive；人物和设施使用精确字段投影，但保留全部原记录与原数组顺序，不能先过滤其他城/势力、不可用或已预约项。旧 0..256 人、0..30 设施、0..255 skill ID 域不缩小。计算只取选择者，选择顺序不排序。`productionJobCount` 含 completed，不是 active 数量；4096 是旧服务常量。

完成 view 是本项处理当下的只读投影；规划器只读 stock/xp/policies。返回的库存值、reward progress 和 completion 都是自己构造的数据。所有成功输出只冻结 owned 数据，不冻结或修改 frame、action、context；owner 需写入审计时使用保留 primitive 的 owned copy。

## 开始计划与严格首错

公开入口仍先校验 State，再 detach/validate envelope。transition 按以下顺序：相同 ID 完整重试 → ID 冲突 → stale revision → command history 4096 → revision overflow → mutableFork → empty calculation 和零 fees receipt seed。零费用两份 Write 仍调用原 DEBIT，source/effective AP 均为 0。

`isDomesticInstant` 不变：所有非 Produce 动作及 Produce 1..4 已被送往旧即时 reducer。剩余合法 Produce 恰为 5/6/7/8/10/11，内部 action 类型断言只表达这项既有路由事实，不增加 runtime gate。旧 private production 的 quantity-only 分支原本不可达，移除它不移除共享 quantity leaf 或公开核。

开始准备严格依次：

1. city 不符 → `unknown-city`
2. 按 officerIds 顺序，每个人依次不存在、非本势力、非本城、不可用、已预约、当旬已行动 → `unknown-officer`、`officer-not-member`、`officer-not-present`、`officer-unavailable`、`officer-production-reserved`、`officer-already-acted`
3. 设施依次不存在、非本城、未完成、kind 不符、已预约、当旬用过 → `unknown-facility`、`facility-not-present`、`facility-incomplete`、`wrong-facility-kind`、`facility-production-reserved`、`facility-used-this-turn`；5..8 要 workshop，10/11 要 shipyard
4. 缺 unlock → `equipment-locked`
5. price 核 → piece quantity 核 → time 核；unsupported 仍 `kernel-rejected`；非正 time 在拒绝政策下为 `unsupported-nonpositive-production-time`
6. 读取 piece AP 20/30 和对应 stock
7. 全部 job 数 >=4096 → `production-history-full`
8. quantity + reserved + 1 > capacity → `piece-capacity-unavailable`
9. 检查 `turn + duration`，精确复现旧 uint 的 number/safe integer/非负/非 −0/不超过 MAX_SAFE_INTEGER 条件；失败仍 `invalid-state`。产生 `job:` + commandId

计划包含 job/city/facility/officer IDs、equipment type、startTurn、remainingTurns、dueTurn、durationTurns、reservedQuantity=1、quantityToReserve=1、goldCost、actionPointsCost、完整 calculation。它不创建 snapshot/Job/receipt，不写账或预约，不验证未来日历。

| 多个条件同时存在 | 仍最先返回 |
|---|---|
| 人物非本势力且非本城 | officer-not-member |
| 人物不可用、预约且已行动 | officer-unavailable |
| 人物预约且已行动 | officer-production-reserved |
| 设施类型错误且预约 | wrong-facility-kind |
| 设施预约且已使用 | facility-production-reserved |
| 未解锁且 raw time 非正 | equipment-locked |
| time 政策拒绝且库存满、缺金 | unsupported-nonpositive-production-time |
| jobs 满且库存满 | production-history-full，前提是更早的 command history 门未先拒绝 |
| 库存满且 dueTurn 不可表示 | piece-capacity-unavailable |
| dueTurn 不可表示且缺金/AP | invalid-state |
| 同时缺金和 AP | insufficient-gold |

不提前费用或容量预检，不增加 dueDate/horizon/未来日期可完成性。合法末年末旬仍可能开工；之后的 Advance 才按原日历规则拒绝。ID 仍为原 1..128 字符域；派生 job ID 的前缀不触发新长度检查。

## 原 owner 的开工接回

owner 从 plan IDs 找回自己候选中的完整 selected officers/facility。顺序保持：

1. 使用一次 owned calculation，供 receipt 和 job 共同引用
2. 拍摄完整 StartSnapshot：envelope、turn/date、完整 selected Officers、完整 Facility、全十项 catalog、全十二族 policies、citySecurity、drillGroundComplete、完整 specialty 列表、difficulty/controller
3. envelope/date/people/facility/catalog/policies 仍逐项旧 JSON copy；specialty 仍数组展开。时点在任何预约、acted、used、扣费之前
4. 构造可写 Job，active、completedTurn/completion=null；fees 暂指向 receipt 原零费用对象。追加 job，增加 reserved，锁定设施和所有选择者，写 production-started
5. 此时才调用 fee planner：先缺金、再缺 AP；先 gold DEBIT、再 AP DEBIT，cap 分别 1e9/255。金 requested 是 `-goldCost || 0`，允许合法零价格且不制造 −0；sourceApRequest 固定 20，effectiveApCost 20/30
6. 回写 gold/AP；一次 owned fees 同时给 receipt，并按原 find(newJobId) 回填 job，替换零费占位引用
7. 所有 selected acted=turn，选定 facility used=turn；写 command-committed
8. 原 transition 尾 revision++，追加 envelope JSON copy/digest/committedRevision/同一个 receipt

任何失败都由原 catch 丢弃整份候选；即使费不足在预约之后才被发现，外部也不看到半预约、费用或部分 job。开始没有 XP/merit、库存 quantity 或时钟写入。

不能把原 snapshot JSON copy 换成 copyOwned/structuredClone：JSON 对可达派生 −0 的规范化属于原语义。也不能把直接计算审计改成 JSON 往返。mutableFork 保持 date/corps 浅展开，city/officers/facilities JSON copy，旧 jobs 逐项浅展开、history 浅数组复制。新 calculation/fees/completion 的 owned copy 保留原数值和内部数组顺序，不给 job 与 receipt 分别复制两份。

## 三核完整审计

新类型细化 private audit；公开 `Calculation.kernels` 的 `{api:string,input:unknown,output:unknown}[]` 展开不变。叶函数的 `retainKernel` 仍只删输出顶层 evidence，并对 input/其余 output 使用旧 JSON copy。成功出口的类型窄化以确定 piece 输入和三核成功为依据，不新增核重算、字段校验、拒绝或 audit 压缩。

- price input 是 profile/savedBasePriceWord/specialtyHelperEax；output 保留 supported/profile/savedBasePriceWord/specialtyHelperEax/specialtyResultAl/discountApplied/returnedPrice。word 0..65535、specialty 0/1，零收费合法
- quantity input 严格只有 profile/nativeEquipmentType；output 保留 supported/profile/nativeEquipmentType/reason=`single-item-return-one`/resolvedInputsObserved=false/returnedQuantity=1。不伪造 slots、factor 或 difficulty，也不省略该核
- time input 为 profile/nativeEquipmentType/captures。slot 0/1/2 依次 validity 005C6CF8；存在者才 intelligence 005C6D06、skill 005C6D25；skill 查询 5..8 为 82，10/11 为 83。空 slot 的 output intelligenceAl/skillEax 为 null
- 船才依序加 005C6D90/005C6DAA/005C6DB0/005C6DCA/005C6DD1 的 eax1，以及 005C6DDE 的 drill bit。它们的 capture 没有 slotIndex 字段，不补 null
- time output 保留 supported/profile/type/reason/returnedValue/rawEaxU32/scannedSlots/skillQueryId/三个 slots/intelligenceSum/intelligenceMax/rawX/clampedX/q/facilityApplied/skillApplied/beforeSkill/trace/callDetails。callDetails 的非 slot 项明确 slotIndex=null，queryId 仅 skill82/83 或 drill45，其余 null；target 保留原核值

intelligence sum 0..765，max 0..255，rawX=max+sum−200 在 −200..820，clampedX=max(24,rawX)，q=trunc(clampedX/24) 在 1..34。普通 beforeSkill=10−q；船且 drill 才 max(2,8−q)。技能最后向零减半；raw 的 −24..9 域及 rawEaxU32=`returnedValue>>>0` 都保留。调度 duration 取 max(1,raw) 或先拒绝非正 raw，不能回写覆盖审计 raw。

## 单项完成与旧 Advance

Advance 仍是唯一 clock/AP owner，完整顺序：nextDate → uint(turn+1) → receipt.turn → 一次 AP 恢复。AP Write 先使用 ACCUMULATE，再覆盖 policyId 为所选恢复政策 ID。

owner 对 `[...productionJobs]` 按 ASCII 字典序迭代，state 数组本身不重排。例如 job:a10 在 job:a2 前。completed 跳过；active 先 remainingTurns--，仅 `>0` 跳过。不是新增 remaining===0 条件。

对每项应完成 job，当下取对应 stock 和按 job.officerIds 排列的人物当前 XP/merit；调用 completion planner。planner 先用所选 writer 请求 +reservedQuantity；writer 失败先返回，之后 actualDelta 不等该数量才 `completion-reservation-mismatch`；再用原 `planRewards(...,'piece',...)`。结果为 stockAfter.quantity=Write.after、reserved=旧 reserved−1，逐人 progress 和完整 completion。没有日期、remaining、dueTurn、预约匹配或 eligibility gate，也不新增 reserved>=1 检查。

owner 按旧序先回写人物 XP/merit，再创建一次 owned completion，回写库存 quantity/reserved，释放人物并 acted=newTurn，释放设施 reservation。facility.usedTurn 保留原值；不清除其他旧 acted/patrol/facility markers。再写 job status/completedTurn/completion，receipt.completions 压入同一个 completion，写 production-completed。下一 job 的规划读取这些写回之后的当前值，不能用 startSnapshot XP 或统一旧快照批量规划。

所有项后才写 turn-advanced，仍只一次 revision/history。Advance 不扣 gold、不重扣 job fees；顶层 calculation 为空、fees 为原零费、rewards=[]、newJobId=null、taskKind=turn-boundary。完成奖励只在 completions 内，未完成项不新增 progress receipt。

## 全部旧政策兼容

| 族 | piece/Advance 的旧行为 |
|---|---|
| time 两种 | minimum-one 或 reject nonpositive；signed raw 审计不变 |
| productionAp 两种 | piece20/30、source request20；quantity20/25 仍走 instant |
| writer 三种 | completion 库存 clip-actual/reject-overflow/clip-request；actualDelta 必须1；开始 DEBIT 不受该选择替换 |
| rewards 两种 | piece 均 intelligence XP4、merit100，cap1e9，用 ACCUMULATE；保留政策身份。quantity 智力/政治差异仍保留 |
| apRecovery 三种 | 旧 Advance +20/+0/+40、cap255；+0 仍有 Write，policyId 为选定政策 |
| reservations / turn | 原全部参与者/设施/容量预约、单旬推进、完成者 acted、完成设施释放 |
| attributes / facilityMultiplier 两种 / morale 两种 / zeroYield 两种 / presentation | piece 计算不读不适用参数；完整政策仍在 snapshot，instant 各变体不变 |

共享 writeDomestic、productionPrice/Quantity、planRewards、emptyCalculation、retainKernel、ACCUMULATE/DEBIT/NOT_MODELED/copyOwned/freezeOwned 继续单份。没有改 merchant、council 调用、既有经济根、共享 clock、原预算、保存格式或 public 类型。未来窄域任务 profile 的预算/完成尾证明是独立工作，不能把 type5、单工房、8人、12旬、64历史等新限制夹进这个兼容路径。
