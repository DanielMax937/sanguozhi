# 规则审计当前状态

更新：2026-10-01。

## A1–E20 主审计已完成；正在清理 exactness gaps

A1–A5、B1–B9、C1–C11、D1–D10、E1–E20 共55个主审计点已经完成写回。

### 最新完成：P0-18 火焰寿命 setter / 重复点火刷新边界

- [P0-18 正文](53-fire-lifetime-setter-boundary.md)
- [P0-18 结构化证据](../sources/fire-lifetime-setter-boundary.json)
- [P0-18 校验脚本](../../scripts/check_fire_lifetime_setter_boundary.py)
- [P0-4 火焰持续/蔓延](39-fire-lifetime-spread-exactness.md)

P0-18 新收敛：

```text
00486320 IsBuildingOnFire
00495CA0 IsTroopOnFire
```

公开逆向资料确认了独立的 fire-state 查询层，但仍没有公开 fire lifetime setter / getter / reignite helper。并且 `00599CF0` 继续没有证据可作为地面火寿命 ticker。因此重复点火的 overwrite/max/add/ignore 语义必须继续 open，不能从现代复刻反推原作。

下一项：P0-19 登场 / 自然死亡 RNG 内部函数边界。
