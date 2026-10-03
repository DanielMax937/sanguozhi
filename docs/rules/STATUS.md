# 规则审计当前状态

更新：2026-10-01。

## A1–E20 主审计已完成；正在清理 exactness gaps

A1–A5、B1–B9、C1–C11、D1–D10、E1–E20 共55个主审计点已经完成写回。

### 最新完成：P0-14 技巧研究时间 PC 函数 / 人才府减时 / 难度矩阵

- [P0-14 正文](49-technique-research-time-exactness.md)
- [P0-14 结构化证据](../sources/technique-research-time-exactness.json)
- [P0-14 校验脚本](../../scripts/check_technique_research_time_exactness.py)
- [技巧研究时间主规则](26-technique-research-time.md)
- [open exactness](13-open-exactness.md)
- [fallback 总表](16-unresolved-rules-fallbacks.md)
- [当前总表](17-post-15-source-audit.md)

P0-14 新收敛：

```text
005D7DD0 sub_5d7dd0
  = research time calculator containing function

005D7ED7
  talent office -2 turns

005D7EF0 / 005D7EF4
  minimum 1 turn
```

`ResearchTimeLeft` 以旬保存并每旬-1。当前恢复的 `struct_technology[36]` 没有已知 research-time 字段，因此基础时间应视为代码派生。

超级70/140/210/280只保留 empirical-high；初级/上级继续open。

下一项：P0-15 技巧研究完成功绩 PC caller / 两套表冲突。
