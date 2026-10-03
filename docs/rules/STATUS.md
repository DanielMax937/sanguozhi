# 规则审计当前状态

更新：2026-10-03。

## A1–E20 主审计已完成；正在清理 exactness gaps

A1–A5、B1–B9、C1–C11、D1–D10、E1–E20 共55个主审计点已经完成写回。

### 最新完成：P0-27 `005BA4C0` deterministic generator / 输入混合边界

- [P0-27 正文](62-hiring-deterministic-generator-boundary.md)
- [P0-27 结构化证据](../sources/hiring-deterministic-generator-boundary.json)
- [P0-27 校验脚本](../../scripts/check_hiring_deterministic_generator_boundary.py)
- [P0-1 普通登用概率](36-hiring-probability-exactness.md)

P0-27 新收敛：

```text
005BA4C0..005BA4EF
  length ≈ 0x30

normal hiring:
  7 inputs -> 005BA4C0 -> deterministicValue
  deterministicValue < successRate

nonzero mode:
  uses 004721D0 runtime probability instead
```

因此 `005BA4C0` 更像一个紧凑 deterministic leaf/mixer，而不是完整登用公式或通用大型 PRNG。当前公开资料只确认普通登用 caller，尚未发现跨业务复用；但没有 xref dump，所以不能宣称唯一 caller。输入混合公式、返回范围和第七参数0的语义仍 open。

下一项：P0-28 `004AF7D0` hard recruitment gate / 关系优先级边界。


