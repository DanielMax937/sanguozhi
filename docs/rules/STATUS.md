# 规则审计当前状态

更新：2026-10-01。

## A1–E20 主审计已完成；正在清理 exactness gaps

A1–A5、B1–B9、C1–C11、D1–D10、E1–E20 共55个主审计点已经完成写回。

### 最新完成：P0-11 训练资格 / 已训练 reset / 野外气力恢复

- [P0-11 正文](46-training-morale-exactness.md)
- [P0-11 结构化证据](../sources/training-morale-exactness.json)
- [P0-11 校验脚本](../../scripts/check_training_morale_exactness.py)
- [训练/气力主规则](19-training-morale.md)
- [open exactness](13-open-exactness.md)
- [fallback 总表](16-unresolved-rules-fallbacks.md)
- [当前总表](17-post-15-source-audit.md)

P0-11 新收敛：

```text
005C4100 = 据点级训练资格 gate
005C4220 = 执行训练
004AD080 = 据点训练状态 setter

0059A230 = 军乐台/奏乐/诗想
            野外气力恢复 local handler
```

训练“每回合一次”的行为 cadence 已由官方手册与状态字段闭合；reset 的 exact xref 仍open。

气力恢复优先级：

```text
军乐台范围 + 诗想  -> 20
军乐台范围         -> 10
无军乐台 + 奏乐    -> 5
否则               -> 0
```

下一项：P0-12 阵/砦/城塞耗粮重叠优先级 / 粮尽逃兵。
