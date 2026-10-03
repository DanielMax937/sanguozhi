# 规则审计当前状态

更新：2026-10-03。

## A1–E20 主审计已完成；正在清理 exactness gaps

A1–A5、B1–B9、C1–C11、D1–D10、E1–E20 共55个主审计点已经完成写回。

### 最新完成：P0-26 `005BA410` helper / 数据组合边界

- [P0-26 正文](61-shared-numeric-helper-005ba410-boundary.md)
- [P0-26 结构化证据](../sources/shared-numeric-helper-005ba410-boundary.json)
- [P0-26 校验脚本](../../scripts/check_shared_numeric_helper_005ba410_boundary.py)
- [P0-25 普通登用签名](60-hiring-success-rate-signature-boundary.md)

P0-26 新收敛：

```text
005BA410..005BA4BF
  = shared numeric-combination helper

005C4F80 GetHiringSuccessRate
  -> 005BA410

005D052C rumor-success path
  -> 005BA410
```

因此 `005BA410` 不是登用专用公式，而是至少被登用与流言成功率共同复用的通用数值组合 helper。流言 callsite 在调用前明确准备4个栈参数，其中一个 raw input = `20 * edi`。helper 完整数学运算、各输入业务语义以及登用 caller 的参数准备仍 open。

下一项：P0-27 `005BA4C0` deterministic generator / 输入混合边界。

