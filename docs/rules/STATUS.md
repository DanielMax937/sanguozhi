# 规则审计当前状态

更新：2026-10-03。

## A1–E20 主审计已完成；正在清理 exactness gaps

A1–A5、B1–B9、C1–C11、D1–D10、E1–E20 共55个主审计点已经完成写回。

### 最新完成：P0-32 部队资源事务 finalizer / commit-return 边界

- [P0-32 正文](67-troop-resource-finalizer-boundary.md)
- [P0-32 结构化证据](../sources/troop-resource-finalizer-boundary.json)
- [P0-32 校验脚本](../../scripts/check_troop_resource_finalizer_boundary.py)
- [P0-9 部队资源事务](44-troop-resource-transaction-exactness.md)

P0-32 新收敛：

```text
004AE2A0 / 004AE300 / 004AE3C0 / 004AE430
004AE4A0 / 004AE510 / 004AE570
  = 单项 resource mutation primitives
  != sortie commit finalizer
  != return finalizer
```

因此 draft/UI、commit、return 必须维持三层分离。当前公开资料仍没有 battle/transport commit finalizer 与 enter-building/disband return finalizer 的地址/body，也没有 mutation 顺序或 rollback 语义，不能用底层 adjust helper 冒充最终事务。

下一项：P0-33 主副将血缘 /3 PC opcode 边界。







