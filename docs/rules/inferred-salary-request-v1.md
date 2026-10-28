# T26 欠薪的独立推断请求 v1

2026-10-28。新函数[projectInferredSalaryShortfall](../../packages/engine/src/inferred-salary-request.ts)仅返回**单名武将**的已分配工资预算使用与减忠诚请求；不执行工资扣款、人物忠诚/归属变化、P078或Closing。`explicit-design-inference`、`worldEffectsApplied=false`。

来源：[财政生命周期](city-finance-lifecycle.md)、[非自然忠诚边界](57-salary-shortfall-loyalty-boundary.md)。现有来源支持按月支出在欠薪忠诚之前，但具体名单、部分支付及扣量未知；**以下部分发薪及线性扣量全部工程推断，不声称原作如此。**

## 具体规则

输入salaryDue、allocatedGold都是0..MAX_SAFE_INTEGER整数，不接受−0/NaN/Infinity/小数。allocatedGold是调用方已为该人分配的**互不重叠预算**，不是让每人重复读取同一城市余额。

```
paidRequest = min(salaryDue, allocatedGold)
unpaid = salaryDue - paidRequest
unspentAllocation = allocatedGold - paidRequest
loyaltyLossRequest = salaryDue==0 ? 0 : ceil(5*unpaid/salaryDue)
```

BigInt中间精确算ceil。选择理由：足额无损失、完全欠薪请求5点、部分欠薪单调且有界；不凭未知魅力/义理再加补正。5点是公开标名的设计尺度，不是样本拟合或逆向值。每月只应为每人计一次；函数无时钟/名单/幂等账本，不会自行重复执行。

例如到期100而分配40，提议支付40、欠60、减忠诚3；到期0时不支付也不减忠诚。上述是人工算术说明，未运行。

## 与现有消费者的边界

现有`city-finance-lifecycle`仍在欠薪时整旬拒绝；本函数**没有解除该安全门**，没有宣称工资后果已接入游戏。它是独立预算/平衡方案的规划器，调用方如需批量，应先明确完整名单和不重复预算，再逐人生成请求；实际工资/忠诚写入仍未授权接此函数。不得把requested loyalty loss直接减到真实人物导致归属链。

获得原生欠薪分配/扣量callee与调用顺序后增加新policy；旧推断保留。仅静态审阅，未运行测试、typecheck、编译、build、候选，运行正确性未验证。
