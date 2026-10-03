# 规则审计当前状态

更新：2026-10-01。

## A1–E20 主审计已完成；正在清理 exactness gaps

A1–A5、B1–B9、C1–C11、D1–D10、E1–E20 共55个主审计点已经完成写回。

### 最新完成：P0-24 宝物授予/没收忠诚变动 opcode 边界

- [P0-24 正文](59-treasure-loyalty-opcode-boundary.md)
- [P0-24 结构化证据](../sources/treasure-loyalty-opcode-boundary.json)
- [P0-24 校验脚本](../../scripts/check_treasure_loyalty_opcode_boundary.py)
- [P0-6 非自然忠诚](41-nonnatural-loyalty-exactness.md)

P0-24 新收敛：

```text
TreasureValue = +0x3C
004A0A40 -> 00484DE0
  = 宝物 owner/city setter
004A0A70 -> 00484E20
  = 宝物 state setter
004A6CF0
  = ModifyPersonLoyalty(delta)
```

因此宝物所有权/状态变化与忠诚 side effect 是独立层。官方“价值越高加忠越多”有明确数据字段支撑，但 `gain == TreasureValue` 仍只能标 empirical-high；没收 `-30` 仍没有原 opcode 支撑。

下一项：P0-25 普通登用 005C4F80 内部成功率公式边界。
