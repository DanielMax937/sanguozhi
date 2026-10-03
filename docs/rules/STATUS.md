# 规则审计当前状态

更新：2026-10-03。

## A1–E20 主审计已完成；正在清理 exactness gaps

A1–A5、B1–B9、C1–C11、D1–D10、E1–E20 共55个主审计点已经完成写回。

### 最新完成：P0-44 据点陷落 durability=0 / troops=0 takeover reset 边界

- [P0-44 正文](79-facility-takeover-reset-boundary.md)
- [P0-44 结构化证据](../sources/facility-takeover-reset-boundary.json)
- [P0-44 校验脚本](../../scripts/check_facility_takeover_reset_boundary.py)
- [攻城主规则](05-combat.md)

P0-44 新收敛：

```text
00487E20..00487E4F
  = SetFacilityDurability

004B329B
  = captured-resource retention
```

耐久归零和守兵归零都能导致陷落的行为边界继续成立，但 takeover reset writer 仍未恢复。`004B329B` 只闭合金/粮/兵/12类兵装的资源保留，不能证明“耐久归零后重置最大耐久10%”或“守兵归零时保留当前耐久”。两种陷落入口是否汇入同一 finalizer 也继续 open。

下一项：P0-45 内政设施保留 selector / retained-facility RNG 边界。



















