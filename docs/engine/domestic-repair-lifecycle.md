# Completed domestic auto repair v1 API

`packages/engine/src/domestic-repair-lifecycle.ts` 提供独立、有限期的内政设施正耐久修复账本；由 engine public index 导出。具体游戏数值、证据分层及未覆盖部分见[规则正文](../rules/domestic-repair-lifecycle.md)。本模块不导入建设或其他旧核，不扩展训练沙盒、GameState/v2、生产与财政 state。

本批仅完成代码与文本静态审阅。未运行测试、typecheck、编译、build、checker、诊断、产品、schema 验证或 example；以下是 API 合同与纸面推导，不是执行通过记录。

## 导出

- `DOMESTIC_REPAIR_POLICY_REGISTRY_V1`：只有一个完整注册政策集合，不接受同 ID 改参数；没有无需求的替代算法
- `DOMESTIC_REPAIR_DEFAULT_POLICIES_V1`、`DOMESTIC_REPAIR_POLICY_DIGEST_V1`：该政策与 canonical JSON SHA-256
- `DOMESTIC_REPAIR_CATALOG_V1`、`DOMESTIC_REPAIR_CATALOG_DIGEST_V1`：9 类标准内政设施 kind/name/levels(level,typeId)，不规定 maxHP、不含原生类型表认证
- `DOMESTIC_REPAIR_EVIDENCE_V1`：公开混合研究 listing、源注释距离政策、独立 writer 与非 stock 边界
- 公共类型 `DomesticRepair…V1`：Scenario、State、Snapshot、Command、Envelope、Policies、Catalog、Facility、Write、Arithmetic、Pressure、Repair、HpFull、Receipt、Failure、StateResult、CommandResult、PreviewResult、SaveResult、Trace、ReplayResult

所有导出快照与成功/失败结果递归冻结。入参只接受可分离的普通 JSON 数据；禁止 accessor、自定义 prototype、symbol、非枚举字段、稀疏数组、循环、非有限数值与负零。不承诺识别恶意 Proxy；不要将有执行行为的 Proxy 当成纯数据输入。

## 场景与创建

`createDomesticRepairState(input: unknown)` 返回 `{ok:true,state}` 或 Failure。必需且仅允许：

```ts
{
  schemaVersion: 1,
  profile: 'completed-domestic-auto-repair-v1',
  date: { year, month, day }, turn, advanceLimit,
  city: { id, kind: 'city', ownerForceId, position: { q, r } },
  governor: null | { id, politics }, engineering,
  facilities: [{ id, cityId, kind, level, phase, position, currentHP, maxHP }],
  hostileForceIds, completeFieldUnits: true,
  turnInputs: [{ fieldUnits: [{ id, forceId, position }] }],
  policies, catalog
}
```

- 日期 day 只能 1/11/21，year 1..9999、month 1..12；turn 是非负安全整数；advanceLimit 1..360。创建即检查整段日期与 turn 不溢出
- city 是唯一已解析母城，owner 固定有效；governor 可为空，否则 politics 是已解析 uint8(0..255)。政治、太守身份、工兵、hostileForceIds、设施位置/phase/上限整个会话固定，不能在回执或 snapshot 修改
- 最多 30 设施；当前 HP 与最大 HP 是供应的独立账本初始事实，`1 <= currentHP <= maxHP <= 32767`。maxHP 不从目录猜取；不接受 0 HP、复活、损毁或 unsigned16 上半区
- 设施 cityId 必须匹配；ID 和设施坐标分别唯一，不能与城中心同格。坐标 q/r 各为 -1000000..1000000 整数；没有额外推定地图所属区域
- 市场/农场/兵舍/锻冶/厩舍允许 1..3 级，工房/造船厂/造币厂/谷仓只有 1 级。typeId 由固定目录推导，禁止输入答案
- phase 为 complete/building/absorbing；创建不完成施工，推进也不改变 phase。这里允许任意已支持 kind/level 搭配这三种供应标记，building/absorbing 只用于排除修复，不证明该组合可由建设服务产生；本模块不校验施工状态可达性。complete 可在其他领域被生产使用，本服务不要求闲置，也不接受或推断生产 reservation
- 最多 128 敌方势力，不得包括本城 owner；每旬最多 128 部队，同旬单位 ID 唯一。非敌方、友军与中立单位不挡修复；允许每旬不同单位集合、阵营与位置
- `turnInputs.length === advanceLimit`，每个输入是该次边界完整部队事实快照，不是增量，也不从上旬继承遗漏单位。`completeFieldUnits:true` 是供应方完整性声明，服务不会查询原地图补齐；创建时检查所有未来输入
- policies/catalog 需要完整内容与注册数据相等，单给 ID 或 hash 不够；额外字段拒绝

创建只生成 genesis，不修复。snapshot 的 revision/advancedCount 初值 0，fieldUnits 初值 null，表示尚未采纳任何旬输入，不能解读成初旬无敌军。首次 Advance 使用 turnInputs[0]。

`data/scenarios/domestic-repair-example-v1.json` 是 `{status,description,scenario,commands,manualExpectations}` 包装；把其中 scenario 传入 create。示例未执行，其文字预期仅为纸面算术。

## 命令、预览与执行

唯一 envelope：

```ts
{ id, expectedRevision, command: { type: 'AdvanceRepairTurn' } }
```

禁止请求者给出恢复量、基础量、writer 返回、满耐久结果、目标日期或额外字段。expectedRevision 为 0..360 整数；ID 为 1..64 字符，匹配 `^[A-Za-z0-9][A-Za-z0-9_.:-]{0,63}$`。

`previewDomesticRepairCommand(state,envelope)` 与 `executeDomesticRepairCommand(state,envelope)` 都先完整重建输入 state，再独立计算命令。execute 返回 `{ok:true,committed,duplicate,state,receipt}`；采用新 state 才代表调用方实际提交。preview 返回 `{ok:true,committed:false,duplicate,receipt,projectedSnapshot}`，先执行相同的完整 execute 输出预算，再检查自身输出预算。

每个新接受命令推进一次 1→11→21→下月1 的旬边界，turn/revision/advancedCount 各加一，读取本次输入，再按设施 ASCII ID 排序计算修复。输入数组顺序保留，snapshot 设施数组保持原顺序，receipt 的 repairs/events 排序稳定。

相同 ID、完整 envelope 相等时返回原始 receipt，duplicate=true、committed=false，不管当前 revision 是否已推进或 horizon 是否已用尽；该结果仍带当前 state。相同 ID 改任意字段为 command-id-conflict；新 ID 的 expectedRevision 不匹配为 revision-conflict。失败不修改输入或返回可提交的部分 state。最多接受 360 次；实际允许次数由 advanceLimit 进一步限制。

## 每旬修复、回执与事件

每设施的最近敌军距离取 `max(abs(dq),abs(dr),abs(dq+dr))`，中心是该设施位置。只取 hostileForceIds 内的单位，距离相同以 ASCII 单位 ID 决胜。Pressure 保存 `{closestHostileUnitId,distance,blocked}`；无敌军时前两项为 null，blocked=false。它连同完整 input 足以重算门槛，不为每设施重复拷贝所有单位。

gate 的首个原因依次为：phase 非 complete → not-complete；已满 → already-full；敌军距离≤2 → hostile-nearby；governor=null → no-governor；其余 repaired。敌军压力是跳过该设施，不拒绝整旬；其他设施仍能修复。

仅 repaired 生成 Arithmetic：`politics`、`multipliedPolitics=9P`、`halfFloor=floor(9P/2)`、`clampedBase=clamp(halfFloor,150,450)`、engineering、numerator=3、denominator=20 或 10、numeratorProduct、requestedRecovery、policyId。无工兵与有工兵分别 floor，不对已取整普通结果乘二。P 为 0..255，最大 9P=2295、halfFloor=1147、clampedBase=450、numeratorProduct=1350，所有中间数在 JS 精确整数域。

Write 为 `{before,requestedDelta,actualDelta,after,cap,discarded,policyId}`。cap=maxHP；actualDelta=min(requestedDelta,cap-before)；after=before+actualDelta；discarded=requestedDelta-actualDelta。跳过时 Arithmetic=null、requested/actual/discarded=0。服务自己写 HP，不采用调用者给定实际恢复量。

Receipt 保存完整命令、前后 revision/date/turn、policy/catalog digest、sourceBoundary、city/governor/engineering 固定上下文、inputIndex/inputOrigin/completeFieldUnits/input，以及逐设施 Repair 和 events。Repair 包含 facilityId/kind/level/typeId/position/phase/status/pressure/arithmetic/hp。不额外产生 AP、金、XP、功绩或原生对象的零写回。

只有本次 actualDelta>0 且 after===maxHP 才产生 `{type:'DomesticFacilityHpFull',facilityId,turn,currentHP,maxHP,policyId}`。已满不重发；重复 envelope 返回原 receipt（其中保留原 events），不创建新事件。消费者应只在 committed=true 时消费该次 events，本服务本身没有外部事件派发器。它只是本账本“耐久满”的事件，不是施工/吸收完成，不调用原生完成通知或改变 owner/phase。

## 保存、加载、重放

- `saveDomesticRepairState(state)` 返回 `{ok:true,json}`，json 为 canonical JSON
- `loadDomesticRepairState(json)` 有界解析并完整重建，返回 `{ok:true,state}`
- `replayDomesticRepairTrace(trace)` 接受 `{tag:'domestic-repair-trace-v1',scenario,attempts,expectedFinalSnapshot}`；最多 1080 次 attempt，每项 `{envelope,expectedOutcome}`
- expectedOutcome 可 null（不作断言），或 `{ok:true,duplicate,receipt}` / `{ok:false,reason}`；expectedFinalSnapshot 可 null 或完整 snapshot
- replay 返回 `{ok:true,state,outcomes}`。失败/重复命令不增加 acceptedCommands，拒绝的尝试可留在 outcomes

state 保存 tag/schemaVersion/profile/scope、完整 policies/catalog 与 digest、genesis(scenario/snapshot)、当前 snapshot 和 acceptedCommands(envelope/receipt)。所有 API 均从 genesis 重算 accepted history：完整比较初态、全部 receipt 和最终 snapshot；SHA-256 不取代内容比较。合法的相同 JSON 对象键顺序无关，数组顺序有意义。digest 是内容标识而非签名；整个合法 genesis 被替换是另一个场景，不能用本机制证明外部存档真实性。

每个重建/重放接受步骤都检查当时完整 `{ok,committed,duplicate,state,receipt}` execute 结果预算，不能通过 load/replay 绕过原执行边界。replay 中 append 或 execute-budget 拒绝时 candidate 保持原 state；预期断言不匹配、最后 snapshot 不匹配或最终结果预算失败则整次 replay 返回 Failure，无部分结果。

## 有界解析与失败

每个输入和完整成功输出统一限制 canonical UTF-8 67,108,864 字节、4,000,000 访问节点、48 层深度、单数组 4096 元素、单对象 128 键。对象输入先检查 descriptor 并分离；JSON 文本先限字节再有界解析，解码后重复键（包括转义别名）拒绝，禁止负零/非有限数值。纯合法结构也可能因最终完整输出或 save 文本转义预算超过限额而失败；不是所有单字段上限组合都保证可执行至 horizon。save 的 `{ok,json}` 包装也在同一预算内。

Failure 统一 `{ok:false,committed:false,reason,index}`。index 默认 null；已接受历史或 trace 步骤失败时是从零开始的条目位置。典型 reason：invalid-fields/invalid-number/invalid-id、unsupported-facility-level/unsupported-phase、facility-city-mismatch/facility-at-city/duplicate-facility-position、incomplete-field-unit-snapshot/incomplete-turn-input-horizon、own-force-hostile、policy-mismatch/catalog-mismatch、turn-overflow/calendar-overflow、advance-limit/history-limit、command-id-conflict/revision-conflict、genesis-snapshot-mismatch/receipt-mismatch/snapshot-mismatch、trace-outcome-mismatch/trace-snapshot-mismatch、duplicate-json-key/budget-exceeded。

结构 schema 不是算法认证；参考/唯一性、源 policy 完全相等、日历、HP cap、动态逐旬敌军、全部派生字段和预算由 runtime 检查。runtime 接受 unknown 的失败 trace，范围可宽于 schema 中合法 envelope 的 shape。本批没有运行 schema 或 runtime 验证。
