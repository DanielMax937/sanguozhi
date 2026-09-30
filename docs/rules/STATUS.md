# 规则审计当前状态

更新：2026-10-01。

## A1–E20 主审计已完成；正在清理 exactness gaps

A1–A5、B1–B9、C1–C11、D1–D10、E1–E20 共55个主审计点已经完成写回。

当前不新增 E21；后续按 [open exactness](13-open-exactness.md) 逐项清理剩余真实缺口。

### 最新完成：P0-1 普通登用概率 exactness 收窄

- [P0-1 正文](36-hiring-probability-exactness.md)
- [P0-1 结构化证据](../sources/hiring-probability-exactness.json)
- [P0-1 校验脚本](../../scripts/check_hiring_probability_exactness.py)
- [人才主规则](03-personnel.md)
- [当前总表](17-post-15-source-audit.md)

本轮没有伪造 `005C4F80` 的成功率闭式，而是把原版 PC-PK1.1 外层锁定为：

```text
004AF7D0 hard gate
→ 005C4F80 successRate
→ normal: 005BA4C0 deterministicValue < p
→ nonzero-mode: giri multiplier + runtime ProbabilityCheck
```

普通人才命令第三参数=0，因此不使用非0模式外层义理0.9/0.7倍率。

`005BA4C0` 的七个入参已恢复；`005B9C00` 的 dateKey 为 `day*7+month*5+year*3`，异地登用保存发令日。

2025年以来新版 SIRE/血色衣冠的“基准60、忠诚/相性/魅力系数、仕官第一年-20、浮动值6”已明确隔离为 **MOD 新忠诚系统**，禁止回填原版。

真正仍 open：`004AF7D0` 函数体、`005C4F80`、`005BA410`、`005BA4C0` deterministic generator 与跨平台差异。

下一项：P0-2 外交公式的版本边界。
