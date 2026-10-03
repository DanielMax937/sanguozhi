# 规则审计当前状态

更新：2026-10-01。

## A1–E20 主审计已完成；正在清理 exactness gaps

A1–A5、B1–B9、C1–C11、D1–D10、E1–E20 共55个主审计点已经完成写回。

### 最新完成：P0-19 登场 / 自然死亡 RNG 内部函数边界

- [P0-19 正文](54-death-lifecycle-layer-boundary.md)
- [P0-19 结构化证据](../sources/death-lifecycle-layer-boundary.json)
- [P0-19 校验脚本](../../scripts/check_death_lifecycle_layer_boundary.py)
- [P0-5 登场/自然死亡](40-debut-death-exactness.md)

P0-19 新收敛：

```text
005833D0 = 月初 lifecycle handler
0048A000 = GetDeathYear
00489160 = IsMarkedForDeath
00488C80 = IsDead
+0x15C = HealthLevel
```

因此 effective death year、预定死亡 flag、健康状态、最终 DEAD identity 必须分层，禁止继续用单一 finalDeathDate 合并。真正仍 open 的是 `005833D0 / 0048A000` 内部 transition 顺序与概率。

下一项：P0-20 俘虏 forced-release comparator / 选择方向。
