# 规则审计当前状态

更新：2026-10-01。

## A1–E20 主审计已完成；正在清理 exactness gaps

A1–A5、B1–B9、C1–C11、D1–D10、E1–E20 共55个主审计点已经完成写回。

### 最新完成：P0-13 野外补给 / 输送抵达 finalizer / 气力加权

- [P0-13 正文](48-supply-transport-finalizer-exactness.md)
- [P0-13 结构化证据](../sources/supply-transport-finalizer-exactness.json)
- [P0-13 校验脚本](../../scripts/check_supply_transport_finalizer_exactness.py)
- [补给/输送主规则](21-supply-transport.md)
- [open exactness](13-open-exactness.md)
- [fallback 总表](16-unresolved-rules-fallbacks.md)
- [当前总表](17-post-15-source-audit.md)

P0-13 新收敛：

```text
004BF1F0 sub_4bf1f0
...
004BF522 transport arrival merit +200
...
004BF6F0 next function
```

因此输送抵达 finalizer 的 containing function 范围已找到；资源逐字段 body 仍open。

行为层：

```text
transport arrival:
  destination cap
  overflow discard + warning
  +200 merit

field supply:
  target cap
  untransferred cargo stays with supplier
  quantity equipment must match added troops
  morale weighted by troop counts
```

气力非整除 rounding 继续open。

下一项：P0-14 技巧研究时间 PC 函数 / 人才府减时 / 难度矩阵。
