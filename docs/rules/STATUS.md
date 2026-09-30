# 规则审计当前状态

更新：2026-10-01。

## 最新完成：E17 地形伤害随机值

当前逐点审计已写回 A1–A5、B1–B9、C1–C11、D1–D10、E1–E17，共52个审计点。

- [当前总表](17-post-15-source-audit.md)
- [E17 规则正文](32-terrain-hazard-damage.md)
- [E17 结构化证据](../sources/terrain-hazard-damage.json)
- [E17 校验脚本](../../scripts/check_terrain_hazard_damage.py)
- [地图主规则](01-map.md)
- [E16 非骑战法武将伤亡](31-non-cavalry-casualty-sources.md)

E17 已闭合 PC-PK1.1 的栈道/毒泉随机兵损：

```text
栈道 = 100 + GetRandomX(200) = 100..299 / 每进入一格
毒泉 = 200 + GetRandomX(200) = 200..399 / 每进入一格
```

`GetRandomX(X)` 已确认返回 `0..X-1`。踏破/难所行军使栈道无伤，解毒使毒泉无伤。旧“毒泉1000兵+气力-5”“栈道300～500”全部撤回。

落石专用地址参数为：对部队base1500/range500、对建筑base800/range1000；当前直接还原为1500～1999与800～1799。踏破使落石伤害约×0.1，而不是减半；固定30%混乱旧fallback撤回。

落石仍保留一个小型 exactness：全陷阱共通基本50在最终落石算式中的参与位置尚未由完整函数体确认。

下一项：E18 普通君主继承优先级。
