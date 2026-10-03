# 规则审计当前状态

更新：2026-10-03。

## A1–E20 主审计已完成；正在清理 exactness gaps

A1–A5、B1–B9、C1–C11、D1–D10、E1–E20 共55个主审计点已经完成写回。

### 最新完成：P0-40 应射/还射完整 caller / 连击递归深度边界

- [P0-40 正文](75-response-fire-recursion-boundary.md)
- [P0-40 结构化证据](../sources/response-fire-recursion-boundary.json)
- [P0-40 校验脚本](../../scripts/check_response_fire_recursion_boundary.py)
- [P0-17 应射/连击方向性](52-response-fire-double-strike-exactness.md)

P0-40 新收敛：

```text
00584D70..00584E7F
  contains 00584DC8 response-fire

005860A0..0058716F
  contains 00586E12 / 00586F0F double-strike logic
```

因此应射 eligibility/helper 与连击/攻击执行 core 属于两层不同函数。当前仍没有二者之间的 xref，不能把“应射自身可连击”的 documented/empirical-high 行为升级为 opcode exact；双方应射+连击的递归终止条件与最大 chain depth 继续 open。

下一项：P0-41 兵粮袭击 `005ADB20` helper body / RNG-clamp 边界。















