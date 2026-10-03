# 规则审计当前状态

更新：2026-10-03。

## A1–E20 主审计已完成；正在清理 exactness gaps

A1–A5、B1–B9、C1–C11、D1–D10、E1–E20 共55个主审计点已经完成写回。

### 最新完成：P0-43 兵临城下出城 / AI 3格与1.2倍出城兵力边界

- [P0-43 正文](78-ai-defense-sortie-boundary.md)
- [P0-43 结构化证据](../sources/ai-defense-sortie-boundary.json)
- [P0-43 校验脚本](../../scripts/check_ai_defense_sortie_boundary.py)
- [AI 架构审计](16-unresolved-rules-fallbacks.md)

P0-43 新收敛：

```text
旧规则：
  enemy within 3 tiles
  && city troops >= enemy troops * 1.2
  => sortie

结论：
  不支持，撤回为 legacy fallback
```

PC-PK AI 出兵实际是多阶段 procedural pipeline：态势/难度/野望/战略倾向 -> 计划兵力 -> 最低5000 -> 兵粮/兵装/治安/移动时间硬门槛 -> 概率 -> 主将/兵种选择。没有统一1.2兵力比 gate；固定3格守城触发也仍未从源码闭合。兵临城下征兵减半的2/3格口径不能外推到AI出城。

下一项：P0-44 据点陷落 durability=0 / troops=0 takeover reset 边界。


















