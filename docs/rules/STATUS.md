# 规则审计当前状态

更新：2026-10-03。

## 新增可运行切片：PK训练内核（不是完整游戏）

[切片指南](../engine/pk-training-slice.md) · [归一化运行规则](../sources/pk-training-runtime.json)。

以main `5c5611bb067c0dfe13cea1126ad69a12dade697c` 为基线，新增Train、有限EndTurn、纯文本短目标、preview、存档/重放和逐命令证据。原资格gate/完整scheduler仍open；原训练表现层的发言武将RNG被明示省略，不声称整条原命令随机流一致。Vanilla不静默继承PK；XP达到100的未实现成长路径会原子拒绝。该实现不包含未合并PR3，不改变下列P0研究状态。

## A1–E20 主审计已完成；正在清理 exactness gaps

A1–A5、B1–B9、C1–C11、D1–D10、E1–E20 共55个主审计点已经完成写回。

### 最新完成：P0-45 内政设施保留 selector / retained-facility RNG 边界

- [P0-45 正文](80-retained-facility-selector-boundary.md)
- [P0-45 结构化证据](../sources/retained-facility-selector-boundary.json)
- [P0-45 校验脚本](../../scripts/check_retained_facility_selector_boundary.py)
- [攻城主规则](05-combat.md)

P0-45 新收敛：

```text
魅力 >=100 -> 5
80..99      -> 4
60..79      -> 3
40..59      -> 2
<=39        -> 1
```

保留数量档位继续是 documented/empirical-high；但具体“保留哪几座”的 selector 仍未恢复。`004BA610` 已明确是单个内政设施被破坏后的掉资源函数，`004B329B` 是破城后金/粮/兵/12类兵装保留函数，二者都不是 retained-facility selector。玩家不能手选也不能推出均匀随机，因此 seeded sample 继续仅作 provisional fallback。

下一项：P0-46 城市/港关陷落时内政设施 destruction caller / selector xref 边界。




















