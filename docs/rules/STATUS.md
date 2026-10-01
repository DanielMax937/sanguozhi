# 规则审计当前状态

更新：2026-10-01。

## A1–E20 主审计已完成；正在清理 exactness gaps

A1–A5、B1–B9、C1–C11、D1–D10、E1–E20 共55个主审计点已经完成写回。

### 最新完成：P0-6 褒赏 / 欠薪 / 流言等非自然忠诚变动

- [P0-6 正文](41-nonnatural-loyalty-exactness.md)
- [P0-6 结构化证据](../sources/nonnatural-loyalty-exactness.json)
- [P0-6 校验脚本](../../scripts/check_nonnatural_loyalty_exactness.py)
- [武将忠诚主规则](03-personnel.md)
- [计略主规则](06-strategy.md)
- [fallback 总表](16-unresolved-rules-fallbacks.md)
- [当前总表](17-post-15-source-audit.md)

P0-6 最重要的新闭合是月俸资金事务：

```text
salarySum <= postCaptiveGold
→ 全额扣 salarySum

salarySum > postCaptiveGold
→ 不扣任何部分工资
→ 0058D5E0
→ 0058C190 欠薪忠诚处理
```

同时已经否定两个错误 fidelity 模型：

```text
褒赏固定/保底11
流言成功后全城全员统一扣固定忠诚
```

褒赏忠诚闭式、欠薪每人掉忠以及流言 target selector / loss RNG 仍open。

下一项：P0-7 俘虏资金不足释放排序 / 主动释放后的禁仕与技巧点。
