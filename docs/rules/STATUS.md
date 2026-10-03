# 规则审计当前状态

更新：2026-10-03。

## A1–E20 主审计已完成；正在清理 exactness gaps

A1–A5、B1–B9、C1–C11、D1–D10、E1–E20 共55个主审计点已经完成写回。

### 最新完成：P0-41 兵粮袭击 `005ADB20` helper body / RNG-clamp 边界

- [P0-41 正文](76-food-raid-helper-boundary.md)
- [P0-41 结构化证据](../sources/food-raid-helper-boundary.json)
- [P0-41 校验脚本](../../scripts/check_food_raid_helper_boundary.py)
- [P0-16 caller/零伤害](51-food-raid-caller-exactness.md)

P0-41 新收敛：

```text
005ADB20..005ADBDF
  = food-raid helper

caller:
  EAX = target troop
  ESI = attacker troop

005ADB55:
  techId = 1
```

因此 helper 边界、寄存器调用契约与技巧检查位置都已锁定；但公开资料仍没有这约0xC0字节函数体。原 RNG 粒度/分布、Attack×R精确算术、目标缺粮与攻方满粮的 clamp 顺序仍 open。`10..20` 整数档与守恒 min-clamp 继续分别只作 compatibility-reconstruction / engine-safety-fallback。

下一项：P0-42 攻城耐久 `005ADDC0 / 005ADE20` inner helper body 边界。
















