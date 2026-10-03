# 规则审计当前状态

更新：2026-10-01。

## A1–E20 主审计已完成；正在清理 exactness gaps

A1–A5、B1–B9、C1–C11、D1–D10、E1–E20 共55个主审计点已经完成写回。

### 最新完成：P0-23 流言 effect helper / target-selector 边界

- [P0-23 正文](58-rumor-effect-helper-boundary.md)
- [P0-23 结构化证据](../sources/rumor-effect-helper-boundary.json)
- [P0-23 校验脚本](../../scripts/check_rumor_effect_helper_boundary.py)
- [P0-6 非自然忠诚](41-nonnatural-loyalty-exactness.md)

P0-23 新收敛：

```text
流言成功率 calculator：
  在 005D05AD 前结束

005D05B0..005D05EF：
  独立函数

005D05F0..005D07BF：
  另一独立函数
```

因此成功率与成功后 effect-side 逻辑在二进制层面明确分离，并且 effect-side 至少有两个函数层。当前仍不能把两者强行命名为“目标选择/忠诚下降/治安下降”；业务角色、target selector、per-target loss 与 security loss 都保持 open。

下一项：P0-24 宝物授予/没收忠诚变动 opcode 边界。
