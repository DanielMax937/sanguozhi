# 财政季初治安：内部共享 phase

本页描述 `packages/engine/src/internal/finance-seasonal-security-phases.ts` 的私有执行片段。它从 `standalone-city-finance-v1` 现有结算路径提取季初治安公式、条件抽取与实际写入，不增加公开 API，不修改旧 profile、schema、policy、digest、收据或保存格式。导出仅供 engine 内部模块引用，不从 `packages/engine/src/index.ts` 暴露。

这是已有 provisional finance policy 的复用边界，不是原生 scheduler、RNG、太守解析器或完整财政恢复。source/native/stock 未证事实保持原样；这里没有新增原 EXE 等价或游戏规则证据。没有执行测试、build、compile、typecheck、runtime、validator、诊断或产品场景。

## 1. 输入与所有权

`applyFinanceSeasonalSecurityPhase` 接收：

- `quarterStart`：调用根已判定的季初门，不在 phase 内推进或重新计算日期。
- `governor`：调用根已解析的 `{ id, charm }` 或 `null`。魅力必须是 `0..100` 的整数；无太守使用魅力 `0`。
- `hasAdministrativeReform`：调用根已校验的严格 boolean。
- `securityTarget`：调用根独占、尚未提交的候选账本，仅需可写的 `security`，初值为 `0..100` 整数。phase 入口捕获该值作为完整治安收据及 writer 的 `before`。
- `writerPolicyId`：调用根固定政策里的治安 writer 身份，不是开放的外部调用者政策。
- `draw(bound, purpose)`：调用根拥有的抽取回调。bound 恰 `100 | 3`，purpose 恰 `administrative-reform | seasonal-loss`。回调必须返回 `0..bound-1` 的整数，或按调用根既有失败机制抛错。

phase 不接收外部 unknown、不验证完整情景、不拥有 tape/cursor/history、不重建状态、不冻结输入、不独立提交。它只可写 `securityTarget.security`；其余对象和字段不改。返回 `{ security, write }`，其中 `security` 是既有完整治安收据，`write` 为既有单笔治安写入或 `null`。

调用根必须先校验输入，再克隆可变候选；全根最后成功才提交。抽取回调可先推进该候选 cursor、追加该候选 draw receipt，后续失败则与其他候选变化一起丢弃。phase 不吞掉、包装或改名回调异常，也不尝试回滚某一笔或补回随机值。

## 2. 固定分支、公式与抽取顺序

非季初：

- 不抽取、不写治安。
- `status=not-due`，`governorId` 保留已解析太守 ID 或 `null`；`charm/adminRoll/lossRoll=null`。
- `requestedLoss=actualLoss=0`，`before=after=入口治安`，`write=null`。

季初：

1. 读取已解析太守魅力，无太守取 `0`。
2. 仅在 `hasAdministrativeReform=true` 时先抽取 `(100, administrative-reform)`。
3. 该值 `<50` 时返回 `administrative-reform-skip`，保留魅力及 adminRoll，不再抽取 loss，不写治安。`lossRoll=null`、两个 loss 为 `0`、`before=after`、`write=null`。
4. 无行政改革或 adminRoll 为 `50..99` 时，恰抽取一次 `(3, seasonal-loss)`，得到 `roll=0..2`。
5. `requestedLoss=min(5, floor(max(1, 90-charm)/10)+roll)`；`actualLoss=min(before, requestedLoss)`；候选治安扣减 `actualLoss`。

不要把 `max(1,90-charm)` 移到除法/向下取整之后：魅力 `90..100` 且 roll 为 `0` 时请求量可以是 `0`。无太守/魅力为 `0` 时三个 roll 的请求量均被上限收敛为 `5`。零治安仍执行应有抽取并返回完整 applied 收据，不能用零收益跳过 RNG。

因此每次调用抽取数量恰为：非季初 `0`；行政改革成功跳过 `1`；无改革季初 `1`；有改革但未跳过季初 `2`。同一次未跳过的双抽取必须先 bound100 后 bound3；不得预抽 loss、按整个窗口提前消费或用通用 PRNG 替换 tape。

applied 收据保留太守 ID/魅力、adminRoll/null、lossRoll、请求/实际损失、before/after。即使 `actualLoss=0`，也返回并追加完整 security write：

- `resource=security`，`reason=seasonal-security`，`cap=100`；
- `requested=requestedLoss`，`accepted=actualLoss`；
- `actualDelta` 为 `actualLoss===0 ? 0 : -actualLoss`，不制造 `-0`；
- `discarded=requestedLoss-actualLoss`；
- `writerPolicyId` 原样使用调用根已绑定的治安政策 ID。

## 3. 旧独立财政服务兼容边界

`city-finance-lifecycle.ts` 保留原有流程：advance/date 门、工资名单和太守解析、月丰收输入、金收入、粮收入、季初治安、完整工资、特产、时钟/事件、最后提交。新 phase 仍位于粮写入之后、完整工资之前。它不改变金/粮核先读取本次结算前治安的规则，也不把季初损失提前应用到当期收入。

旧根在季初 phase 之前没有其他治安写入，所以 `after.city.security` 的入口值与原来的 `before.city.security` 相等。旧根先验证非空 `governorOfficerId` 必须存在于完整名单，且后续不改变该关系，因此解析太守 ID 与旧 not-due/skip 收据使用的城市太守 ID 一致。三种状态各字段、对象构造顺序、write 追加位置、正零处理与原逻辑一致。

原 `draw` 回调继续在旧根持有，仍先检查 tape 是否耗尽，再检查 bound，再追加 `{ index, bound, value, purpose }`、推进候选 cursor。故 `rng-exhausted`、`rng-bound-mismatch`、它们与后续工资/特产拒绝的先后，以及失败时全候选不提交的行为均保持。旧创建/预览/执行/保存/加载/重放及输出预算入口没有修改。

新组合根可以在它自己的明确政策下复用该 phase，但必须自行绑定日历、当前治安、太守、行政改革、writer 与 bounded tape，并完整记录抽取和原子事务。复用本片段不授权更改旧服务日历、旧错误名或旧保存格式，也不证明不同根的调度顺序为原生事实。
