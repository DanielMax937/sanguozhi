# T26 欠薪独立请求：v1撤回，v2更正

2026-10-28。PR136曾发布的`projectInferredSalaryShortfall` / `inferred-proportional-unpaid-loyalty-request-v1`采用逐人部分支付，**该规则错误，撤回、不再导出**。它与已有逆向证据冲突，不是证据空白可任选的假设。历史提交仍保存；本仓库未新增持久化使用；外部是否已调用未知，旧入口移除属兼容性变更。替换公开入口为[projectInferredSalaryShortfallV2](../../packages/engine/src/inferred-salary-request.ts)。调用方必须改为设施总工资、扣其他费用后的可用金、当前人员工资三个参数，不能沿用原两个参数。

## 已知事实与未知项

[57欠薪边界§2–5](57-salary-shortfall-loyalty-boundary.md)：PC-PK1.1外层`005909A8 cmp eax,edi / jg 005909B0 / sub edi,eax`，设施总工资足够整笔扣、不足整笔不扣；不是逐人预算先到先得。设施遍历结束才调用统一finalizer。该事实也见[人事§8.15](03-personnel.md)。具体欠薪名单与减忠诚callee仍未知。

## v2具体合同

三个输入`facilitySalaryDue, remainingGold, officerSalaryDue`均为0..MAX_SAFE_INTEGER整数（拒绝−0/小数/NaN/Infinity），且个人工资不得超过设施总工资。caller须提供同一设施、同一期、合法薪俸名单内人员。设施总额与个人身份/工资相符、扣费顺序及是否到期由caller保证，本函数不查询世界。

- `facilityCanPay = remainingGold >= facilitySalaryDue`
- `facilityPaidRequest = facilityCanPay ? facilitySalaryDue : 0`
- `officerPaidRequest = facilityCanPay ? officerSalaryDue : 0`
- `remainingGoldRequest = remainingGold - facilityPaidRequest`
- **唯一新推断**：设施不足且该人应领工资>0时请求减忠诚5，否则0。选择固定5让全欠薪与零工资边界明确；没有证据支持按比例/魅力/义理补正。5不是逆向值。

例如设施总工资100、可用40、个人工资20：设施与个人均支付0、剩余40、该人减忠诚请求5；可用100则设施100、个人20、剩余0、减忠诚0。全0输入支付0损失0。以上是纸面说明，未运行。

## 禁止误接与替换条件

同一设施多人请求中`facilityPaidRequest/remainingGoldRequest`是**重复的设施总计划，不得每人扣一次或逐人更新余额**；它不提供执行事务。个人减忠诚是计划，未知的原名单资格不得据此声称已恢复。`worldEffectsApplied=false`，不写金钱/忠诚/归属，不调统一finalizer，不触P078/Closing。现有city-finance仍保留欠薪整旬拒绝；没有改默认政策。新ID不冒充原v1兼容，原v1仅历史归档，不推荐使用。

获得减忠诚callee、完整名单与顺序后新建替代policy；已知整笔支付门不再视作未知。仅静态审阅，未运行测试、typecheck、编译、build或候选，运行正确性未验证。
