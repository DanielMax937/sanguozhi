# P0-40 应射/还射完整 caller / 连击递归深度边界

更新：2026-10-03。主目标版本：PC-PK1.1。

## 1. 本轮结论

本轮通过 IDB 函数表把此前三个孤立地址分别归入 containing function：

```text
00584D70 .. 00584E7F
  contains 00584DC8 还射/应射
  length ≈ 0x110

005860A0 .. 0058716F
  contains 00586E12 间接攻击弩兵时主动方连击抑制
  contains 00586F0F 连击50% / 支援排除 / 战法失败后普攻可连击
  length ≈ 0x10D0
```

因此应射判定与连击执行属于两层不同函数。

状态：

```text
P0-40-audit-complete
response-fire-containing-function-resolved
double-strike-containing-function-resolved
layer-separation-exact
response-fire-to-attack-executor-xref-open
recursive-chain-depth-open
```

## 2. `00584DC8` 属于独立小函数

`311resource` 函数边界：

```text
00584D70 sub_584D70
...
00584DC8 response-fire address
...
00584E80 next function
```

所以：

```text
00584D70..00584E7F
```

是应射相关 containing function。

当前仍没有完整 body，因此不能继续断言：

- technique9 检查的精确指令；
- attack-type enum；
- unit-type compare；
- 射程/地形合法性 helper 的调用顺序。

## 3. 连击逻辑在另一大型攻击处理函数

`00586E12` 与 `00586F0F` 都属于：

```text
005860A0..0058716F
```

因此：

```text
response-fire eligibility/helper
!=
normal attack / double-strike execution core
```

这支持现有架构：

```text
先决定是否产生 response attack instance
再由攻击执行链处理该 attack instance 是否允许连击
```

但真正 caller xref 仍未恢复。

## 4. 主动方连击抑制仍 exact

已有地址语义继续成立：

```text
00586E12
  indirect attack vs crossbow target
  -> attacker double strike disabled
```

这发生在大型攻击执行函数中，而不是 `00584D70` 应射 helper 内。

所以：

```text
主动方连击 gate
和
应射 eligibility
```

必须保持独立。

## 5. 应射自身可连击仍是 documented/empirical-high

历史原作资料支持：

```text
response-fire normal attack
can trigger defender double strike
```

但当前还没有：

```text
00584D70 -> 005860A0
```

或反向 caller xref。

因此“应射调用普通攻击执行器”仍只能作为行为高置信，而不是 PC opcode exact。

## 6. 递归链深度仍不能写死

历史实测出现双方：

```text
应射 + 连战
-> 多次相互还射
```

但 PC 端要闭合递归，需要至少恢复：

```text
A attack
-> B response
-> B double strike
-> A response?
-> ...
```

每个新 attack instance 是否再次调用 `00584D70`。

目前没有 xref，因此不能写：

- 最大10次；
- 固定2层；
- 无限直到连击失败；
- 每方最多一次 response。

这些都继续 open。

## 7. 当前安全实现

```ts
resolveAttackInstance(ctx) {
  executeHit(ctx)

  if (canDoubleStrike(ctx))
    maybeExecuteSecondAttack(ctx)

  if (canResponseFire(ctx.target, ctx.attacker, ctx))
    enqueueResponseAttack(...)
}
```

但必须增加显式 chain guard：

```text
compatibility safety guard
!= original chain limit
```

避免工程实现出现无限递归。

## 8. 本轮关闭 / 仍 open

### 已关闭 / 收紧

- `00584DC8` containing function = `00584D70..00584E7F`；
- `00586E12` / `00586F0F` containing function = `005860A0..0058716F`；
- 应射 helper 与连击/攻击执行 core 是两层不同函数；
- 主动方 indirect-vs-crossbow 连击抑制继续 exact；
- 支援攻击不连击、战法失败后普攻可连击继续 exact。

### 仍 open

1. `00584D70` 完整 body；
2. `005860A0` 完整 body；
3. response-fire helper 与 attack executor 的 xref；
4. 应射生成的攻击实例是否再次进入 response-fire gate；
5. 双方应射+连击的递归终止条件；
6. 最大 chain depth；
7. arrow tactic primary/collateral 细分；
8. naval profile；
9. Vanilla / PS2 / Wii 差异。

## 9. 来源

- fudanglp/311resource `san11pk_dump.exe_functions.csv`
- sjn4048/311MemoryResearch `地址资料.txt`
- 关联：`52-response-fire-double-strike-exactness.md`、`25-response-fire.md`
