# 规则审计当前状态

更新：2026-10-03。

## A1–E20 主审计已完成；正在清理 exactness gaps

A1–A5、B1–B9、C1–C11、D1–D10、E1–E20 共55个主审计点已经完成写回。

### 最新完成：P0-42 攻城耐久 `005ADDC0 / 005ADE20` inner helper body 边界

- [P0-42 正文](77-siege-durability-inner-helper-boundary.md)
- [P0-42 结构化证据](../sources/siege-durability-inner-helper-boundary.json)
- [P0-42 校验脚本](../../scripts/check_siege_durability_inner_helper_boundary.py)
- [战斗/攻城主规则](05-combat.md)

P0-42 新收敛：

```text
005ADDC0..005ADE1F
  = ordinary / 井阑 / 投石耐久基础 helper

005ADE20..005ADEAF
  = 冲车 / 木兽耐久基础 helper
```

两个 helper 都由 caller 传3个 scalar 参数，返回值继续留在 x87 `ST(0)`；会心、目标类型等外层倍率在 helper 返回后继续 `fmul`，最后 `005B057E -> 00707A74 (_ftol2)` 才统一整数化。因此 outer modifier order 已进一步闭合，但两个 inner helper 的完整 body、sqrt/constants 与冲车/木兽基础式继续 open。

下一项：P0-43 兵临城下出城 / AI 3格与1.2倍出城兵力边界。

















