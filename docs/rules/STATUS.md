# 规则审计当前状态

更新：2026-10-01。

## A1–E20 主审计已完成；正在清理 exactness gaps

A1–A5、B1–B9、C1–C11、D1–D10、E1–E20 共55个主审计点已经完成写回。

### 最新完成：P0-21 非自然忠诚：褒赏忠诚增量 caller / RNG 边界

- [P0-21 正文](56-cash-reward-loyalty-boundary.md)
- [P0-21 结构化证据](../sources/cash-reward-loyalty-boundary.json)
- [P0-21 校验脚本](../../scripts/check_cash_reward_loyalty_boundary.py)
- [P0-6 非自然忠诚](41-nonnatural-loyalty-exactness.md)

P0-21 新收敛：

```text
005B5D60..005B5F9F
  = cash reward execution containing function

0048A770
  = SetLoyalty(0..255)

004A6CF0
  = ModifyPersonLoyalty(delta)

struct_person +0xAC
  = Loyalty byte
```

因此真实忠诚层与 UI 100 显示上限已经结构级分离；褒赏必须作用于 true loyalty，不能先 clamp 到100。真正仍 open 的是 `005B5D60` 到 loyalty primitive 的 exact xref、delta calculator、RNG/魅力/义理公式。

下一项：P0-22 欠薪 loyalty selector / 0058D5E0→0058C190 边界。
