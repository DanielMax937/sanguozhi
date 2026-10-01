# 规则审计当前状态

更新：2026-10-01。

## A1–E20 主审计已完成；正在清理 exactness gaps

A1–A5、B1–B9、C1–C11、D1–D10、E1–E20 共55个主审计点已经完成写回。

### 最新完成：P0-4 火焰持续与自然蔓延

- [P0-4 正文](39-fire-lifetime-spread-exactness.md)
- [P0-4 结构化证据](../sources/fire-lifetime-spread-exactness.json)
- [P0-4 校验脚本](../../scripts/check_fire_lifetime_spread_exactness.py)
- [战斗主规则](05-combat.md)
- [fallback 总表](16-unresolved-rules-fallbacks.md)
- [当前总表](17-post-15-source-audit.md)

P0-4 已把火系统拆成“点火寿命 / 主动范围与连锁 / 自然邻格蔓延”三层。

已固定的 fidelity 边界：

```text
criticalFireDuration = baseDuration + 1
naturalAdjacentSpread = false
```

PC-PK1.1 的基础寿命 setter / RNG 仍未找到，因此 `1/2 @ 70/30` 继续只作为可替换工程 fallback，不标原版精确常量。

仍 open：原始寿命概率、内部 counter 与可见回合 phase、重复点火 setter、不同点火来源差异、跨版本/平台等价性。

下一项：P0-5 登场 / 自然死亡精确 RNG。
