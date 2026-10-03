# 规则审计当前状态

更新：2026-10-01。

## A1–E20 主审计已完成；正在清理 exactness gaps

A1–A5、B1–B9、C1–C11、D1–D10、E1–E20 共55个主审计点已经完成写回。

### 最新完成：P0-15 技巧研究完成功绩 PC caller / 两套表冲突

- [P0-15 正文](50-technique-research-merit-exactness.md)
- [P0-15 结构化证据](../sources/technique-research-merit-exactness.json)
- [P0-15 校验脚本](../../scripts/check_technique_research_merit_exactness.py)
- [E12 技巧研究完成功绩](27-technique-research-merit.md)

P0-15 新收敛：

```text
005D8F68
  = research command / AP path anchor
  != completion merit writer

公开逆向“经验和功绩获得”章节：
  明确列出大量其他动作功绩地址
  明确给出“技术研究经验 = 消费技巧P / 100”
  但未给出技巧研究完成功绩地址/常量
```

因此 Lv1=500、Lv2=1000 保持两表共识；Lv3/Lv4 仍必须保留 2000/3000 与 1500/2500 冲突。PC-PK1.1 exact caller、1～3名研究者分配、Vanilla→PK版本映射仍 open。

下一项：继续从 P0 剩余 exactness gaps 中按证据密度选择下一条。
