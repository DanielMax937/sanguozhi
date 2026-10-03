# 规则审计当前状态

更新：2026-10-01。

## A1–E20 主审计已完成；正在清理 exactness gaps

A1–A5、B1–B9、C1–C11、D1–D10、E1–E20 共55个主审计点已经完成写回。

### 最新完成：P0-12 阵/砦/城塞耗粮重叠 / 粮尽逃兵

- [P0-12 正文](47-food-overlap-starvation-exactness.md)
- [P0-12 结构化证据](../sources/food-overlap-starvation-exactness.json)
- [P0-12 校验脚本](../../scripts/check_food_overlap_starvation_exactness.py)
- [兵粮消耗主规则](20-food-consumption.md)
- [军事主规则](04-military.md)
- [open exactness](13-open-exactness.md)
- [fallback 总表](16-unresolved-rules-fallbacks.md)
- [当前总表](17-post-15-source-audit.md)

P0-12 新闭合：

```text
0049D180
→ 返回一个阵系设施 type
→ 0049D2E0 只取一个 multiplier
→ 重叠效果不叠乘
```

原 float32：

```text
无   0x40000000
阵   0x3FD55555
砦   0x3FAAAAAB
城塞 0x3F800000
× 0.05f(0x3D4CCCCD)
→ _ftol2 trunc
```

18000兵结果：1800 / 1499 / 1200 / 900。

粮尽方面，`0059BF40` 已确认不负责0粮掉兵；旧0.76缺乏可验证来源，降为 legacy-only。

下一项：P0-13 野外补给 / 输送抵达 finalizer / 气力加权取整。
