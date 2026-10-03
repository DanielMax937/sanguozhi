# 规则审计当前状态

更新：2026-10-01。

## A1–E20 主审计已完成；正在清理 exactness gaps

A1–A5、B1–B9、C1–C11、D1–D10、E1–E20 共55个主审计点已经完成写回。

### 最新完成：P0-16 兵粮袭击 caller / 零伤害边界

- [P0-16 正文](51-food-raid-caller-exactness.md)
- [P0-16 结构化证据](../sources/food-raid-caller-exactness.json)
- [P0-16 校验脚本](../../scripts/check_food_raid_caller_exactness.py)
- [E9 兵粮袭击](24-food-raid.md)

P0-16 新收敛：

```text
005B03BA 防御技能判定
005B03C6 成功则 troopDamage = 0
...
005B03F9 仍 call 005ADB20
```

因此“damage==0 就在 caller 层跳过抢粮”已被排除。food raid 结果与 troop damage 使用独立字段；反击/反伤专用跳转则会直接绕过 food raid。仍 open 的是 `005ADB20` 内部 gate、RNG 粒度和资源裁剪。

下一项：P0-17 应射 caller / attack-type 与连战边界。
