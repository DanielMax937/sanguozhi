# 规则审计当前状态

更新：2026-10-03。

## A1–E20 主审计已完成；正在清理 exactness gaps

A1–A5、B1–B9、C1–C11、D1–D10、E1–E20 共55个主审计点已经完成写回。

### 最新完成：P0-37 技巧研究时间完整难度矩阵 / Super 阈值边界

- [P0-37 正文](72-technique-research-difficulty-matrix-boundary.md)
- [P0-37 结构化证据](../sources/technique-research-difficulty-matrix-boundary.json)
- [P0-37 校验脚本](../../scripts/check_technique_research_difficulty_matrix_boundary.py)
- [P0-14 技巧研究时间](49-technique-research-time-exactness.md)

P0-37 新收敛：

```text
005D7DD0..005D7EFF
  = research-time calculator

struct_scenario +0x20
  = DifficultyLevel
```

但当前没有证据证明 calculator 实际读取 DifficultyLevel。Super 的 70/140/210/280 仍只来自受控实测，继续标 empirical-high；Beginner / Advanced 不能复制 Super，也不能凭难度字段存在就补三套矩阵。

下一项：P0-38 技巧研究完成功绩 writer / participant distribution 边界。












