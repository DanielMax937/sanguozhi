# 规则审计当前状态

更新：2026-10-01。

## A1–E20 主审计已完成；正在清理 exactness gaps

A1–A5、B1–B9、C1–C11、D1–D10、E1–E20 共55个主审计点已经完成写回。

### 最新完成：P0-22 欠薪 loyalty selector / 0058D5E0→0058C190 边界

- [P0-22 正文](57-salary-shortfall-loyalty-boundary.md)
- [P0-22 结构化证据](../sources/salary-shortfall-loyalty-boundary.json)
- [P0-22 校验脚本](../../scripts/check_salary_shortfall_loyalty_boundary.py)
- [P0-6 非自然忠诚](41-nonnatural-loyalty-exactness.md)

P0-22 新收敛：

```text
0058D5E0:
  欠薪据点逐次调用
  arg = facility + active-officer list
  this = 跨据点累计容器

0058C190:
  所有设施循环完成后调用一次
  只接收累计容器
```

因此欠薪忠诚不是在每个据点循环中即时逐人写回，而是 prepare/accumulate → monthly batch finalize 两阶段。受罚人员 selector、君主过滤、每人掉忠公式和 RNG 仍 open。

下一项：P0-23 流言 effect helper / target-selector 边界。
