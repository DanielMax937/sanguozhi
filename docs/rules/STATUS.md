# 规则审计当前状态

更新：2026-10-01。

## A1–E20 主审计已完成；正在清理 exactness gaps

A1–A5、B1–B9、C1–C11、D1–D10、E1–E20 共55个主审计点已经完成写回。

### 最新完成：P0-8 官职自动分配资格 / selector / tie-break

- [P0-8 正文](43-auto-office-selector-exactness.md)
- [P0-8 结构化证据](../sources/auto-office-selector-exactness.json)
- [P0-8 校验脚本](../../scripts/check_auto_office_selector_exactness.py)
- [官职主规则](03-personnel.md)
- [open exactness](13-open-exactness.md)
- [fallback 总表](16-unresolved-rules-fallbacks.md)
- [当前总表](17-post-15-source-audit.md)

P0-8 已把单个官职的 `005FAF00` selector 收紧到 exact：

```text
candidate list (caller传入)
+ office
+ scoringMode flag
→ 005FA4D0 eligibility
→ true loyalty >=90
→ exact score
→ strict greater-than replace
→ same score = first-in-list wins
```

并修正旧误标：

```text
005FA650 = office classifier
不是 candidate-list generator
```

当前真正剩余的是 caller 层：候选列表顺序、arg3业务语义、多个官职连续分配 scheduler，以及 `005FA4D0` 完整资格 body。

下一项：P0-9 部队编成最终资源事务。
