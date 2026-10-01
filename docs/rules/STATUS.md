# 规则审计当前状态

更新：2026-10-01。

## A1–E20 主审计已完成；正在清理 exactness gaps

A1–A5、B1–B9、C1–C11、D1–D10、E1–E20 共55个主审计点已经完成写回。

### 最新完成：P0-3 攻城统一公式与据点接管资源

- [P0-3 正文](38-siege-capture-exactness.md)
- [P0-3 结构化证据](../sources/siege-capture-exactness.json)
- [P0-3 校验脚本](../../scripts/check_siege_capture_exactness.py)
- [战斗主规则](05-combat.md)
- [当前总表](17-post-15-source-audit.md)

P0-3 已确认城兵伤害共用 `005ADC30`，耐久分为 `005ADDC0` 与 `005ADE20` 两条 helper，外层 power、目标倍率、会心、云梯、超级难度修正已恢复。

攻陷资源 `004B329B` 已闭合：

```text
retainPct = max(5, trunc(CHA/10))
```

统一作用于金、粮、兵和12类兵装。旧低魅力可能0%保留的公式撤回。

仍 open：`005ADDC0/005ADE20` 内部函数体、小兵力/x87取整、内政设施具体保留 selector、接管耐久重置与跨平台差异。

下一项：P0-4 火焰持续与自然蔓延。
