# 规则审计当前状态

更新：2026-10-01。

## 最新完成：E18 普通君主继承优先级

当前逐点审计已写回 A1–A5、B1–B9、C1–C11、D1–D10、E1–E18，共53个审计点。

- [当前总表](17-post-15-source-audit.md)
- [E18 规则正文](33-ruler-succession-priority.md)
- [E18 结构化证据](../sources/ruler-succession-priority.json)
- [E18 校验脚本](../../scripts/check_ruler_succession_priority.py)
- [君主/军团主规则](08-ruler-corps.md)
- [E17 地形伤害](32-terrain-hazard-damage.md)

E18 已关闭“普通君主继承完全无可靠规则”这一主问题。

继承必须先区分：

```text
历史事件 -> 事件专用脚本
玩家普通死亡 -> 玩家手选
COM普通死亡 -> 自动选择
```

COM 长期实测主类别顺序为：

```text
血缘 > 义兄弟 > 配偶 > 年长者
```

无特殊关系时年长者优先有多个案例支持，旧功绩/魅力/官职/统率综合评分 fallback 撤回。被敌方俘虏的武将会退出普通后继候选。

PC-PK1.1 的集中式处理入口 `004B9080` 已由 311MemoryResearch 禅让 DEMO 定位，但函数体未公开，所以 COM 顺序仍标 `empirical-high`，不升级成源码级。

剩余 exactness：关系组内部排序、同龄 tie-break、出阵/任务 candidate gate、`004B9080` 函数体、零合法候选流程与平台差异。

下一项：E19 评定完整提案池。
