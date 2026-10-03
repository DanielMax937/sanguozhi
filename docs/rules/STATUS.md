# 规则审计当前状态

更新：2026-10-03。

## A1–E20 主审计已完成；正在清理 exactness gaps

A1–A5、B1–B9、C1–C11、D1–D10、E1–E20 共55个主审计点已经完成写回。

### 最新完成：P0-38 技巧研究完成功绩 writer / participant distribution 边界

- [P0-38 正文](73-technique-research-completion-writer-boundary.md)
- [P0-38 结构化证据](../sources/technique-research-completion-writer-boundary.json)
- [P0-38 校验脚本](../../scripts/check_technique_research_completion_writer_boundary.py)
- [P0-15 技巧研究完成功绩](50-technique-research-merit-exactness.md)

P0-38 新收敛：

```text
00599CF0 技巧研究分支：
  ResearchTimeLeft > 0 -> -1
  归零后该分支内没有 completion call

能力研究分支：
  归零 -> 005CE600 completion handler
```

因此技巧研究的技术解锁、完成功绩、提示与参与者结算必然在另一条 completion path；`005D8F68` 继续明确只是研究命令/AP anchor。mission=5 研究武将的生命周期会读取 force ResearchTimeLeft，但当前仍无 merit write 证据。

下一项：P0-39 火焰寿命 base RNG / setter 候选边界。













