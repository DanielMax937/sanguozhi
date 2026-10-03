# 规则审计当前状态

更新：2026-10-03。

## A1–E20 主审计已完成；正在清理 exactness gaps

A1–A5、B1–B9、C1–C11、D1–D10、E1–E20 共55个主审计点已经完成写回。

### 最新完成：P0-34 训练 reset / top scheduler xref 边界

- [P0-34 正文](69-training-reset-scheduler-boundary.md)
- [P0-34 结构化证据](../sources/training-reset-scheduler-boundary.json)
- [P0-34 校验脚本](../../scripts/check_training_reset_scheduler_boundary.py)
- [P0-11 训练/气力](46-training-morale-exactness.md)

P0-34 新收敛：

```text
004AD080..004AD15F
  = SetSPTrainingStatus

0047B710..0047B72F
  = SetCityTrainingStatus

0059A230..0059A4AF
  = 野外气力恢复 local handler
```

训练每回合一次与下一回合 reset 的行为语义已闭合，但当前公开资料仍没有 setter(value=0) 的 exact caller/xref；`0059A230` 的 top-level 每旬 scheduler xref 也仍未恢复。地址邻近关系不能代替调用证据，`00599CF0` 继续明确排除为训练 reset caller。

下一项：P0-35 阵系 overlap winner / starvation original function 边界。









