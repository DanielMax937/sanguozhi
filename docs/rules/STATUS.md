# 规则审计当前状态

更新：2026-10-03。

## A1–E20 主审计已完成；正在清理 exactness gaps

A1–A5、B1–B9、C1–C11、D1–D10、E1–E20 共55个主审计点已经完成写回。

### 最新完成：P0-36 补给/输送 finalizer 气力非整除 rounding 边界

- [P0-36 正文](71-morale-weighted-merge-rounding-boundary.md)
- [P0-36 结构化证据](../sources/morale-weighted-merge-rounding-boundary.json)
- [P0-36 校验脚本](../../scripts/check_morale_weighted_merge_rounding_boundary.py)
- [P0-13 补给/输送](48-supply-transport-finalizer-exactness.md)

P0-36 新收敛：

```text
004B9840..004B989F
  = building/facility morale weighted-merge helper

inputs:
  old troops / old morale
  added troops / incoming morale
```

兵力加权气力核心继续 high-confidence；但公开资料仍没有 `004B9840` body，也没有 troop→troop morale merge helper/xref，因此非整除 rounding 继续 open。不能因为 P0-10 已确认 `_ftol2` 就在没有 xref 时直接写成 floor-exact。

下一项：P0-37 技巧研究时间完整难度矩阵 / Super阈值边界。











