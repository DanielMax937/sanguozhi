# P0-23 流言 effect helper / target-selector 边界

更新：2026-10-03。主目标版本：PC-PK1.1。

## 1. 本轮结论

公开逆向资料已经把流言成功率计算函数完整展开到：

```text
...
005D0599 ret
005D059A ... error/invalid branch
005D05AD ret
```

而 IDA 函数表紧接着给出：

```text
005D05B0 sub_5d05b0
005D05F0 sub_5d05f0
005D07C0 next function
```

因此可以二进制层面确认：

```text
rumor success-rate calculator
!=
005D05B0
!=
005D05F0
```

也就是说，成功率计算与成功后的 effect-side 处理至少被拆成独立函数层。

状态：

```text
P0-23-audit-complete
success-vs-effect-separation-exact
two-post-success-functions-exact
effect-role-assignment-open
target-selector-open
per-target-loyalty-loss-open
security-loss-open
```

## 2. 005D05B0 与 005D05F0 是两个独立函数

`311resource` 函数边界：

```text
005D05B0 .. 005D05EF   (~0x40 bytes)
005D05F0 .. 005D07BF   (~0x1D0 bytes)
005D07C0 next function
```

因此这不是同一函数内部的两个 label，而是两个独立 subroutine。

这点很重要，因为旧文档只能笼统写“流言相关函数”，现在至少可以确定 effect-side 有多个函数层。

## 3. 成功率函数与 effect helper 明确分离

流言成功率函数已经展开出：

- 计略府加成；
- 若干全局/势力参数；
- `005BA410`；
- 最终整数成功率结果。

并在 `005D05AD` 返回。

所以不能再把：

```text
流言成功率公式
```

直接当作：

```text
流言成功后忠诚下降公式
```

两者是不同函数层。

## 4. 不能仅凭函数大小给 005D05B0 / 005D05F0 强行命名

`005D05B0` 约 0x40 bytes，`005D05F0` 约 0x1D0 bytes。

虽然从大小上看，前者像 wrapper/helper，后者像更复杂 effect routine，但在没有指令/xref/伪代码前不能升级为：

```text
005D05B0 = target selector
005D05F0 = loyalty loss
```

或：

```text
005D05B0 = security loss
005D05F0 = officer loss
```

这些角色分配继续 open。

## 5. 实机证据继续要求“目标选择”和“单人损失”分层

原作长期实测显示：

```text
100+ 武将城市
300+ 次成功流言
治安已降到0
但大多数武将忠诚没有同步大幅下降
只有部分目标明显被影响
```

以及同一次成功流言在不同 RNG 状态下：

```text
受影响武将集合会变化
单个武将掉忠量也会变化
```

所以实现上仍必须保留至少：

```ts
targets = selectRumorTargets(...)

for (target of targets) {
  loss = rollRumorLoyaltyLoss(target, ...)
  modifyTrueLoyalty(target, -loss)
}

applySecurityLoss(...)
```

当前不能把这三层合并成“全城统一 -N”。

## 6. true loyalty 写回仍必须走底层层级

P0-21 已确认：

```text
0048A770 SetLoyalty(0..255)
004A6CF0 ModifyPersonLoyalty(delta)
```

因此流言若修改忠诚，也应作用于 true loyalty。

但当前仍没有 `005D05B0/005D05F0 -> 004A6CF0` 的公开 xref，所以不能把该调用关系写成 exact。

## 7. 当前安全架构

```ts
function applyRumorSuccess(ctx) {
  const targets = rumorRules.selectTargets(ctx)

  for (const target of targets) {
    const loss = rumorRules.rollLoyaltyLoss(target, ctx)
    modifyTrueLoyalty(target, -loss)
  }

  const securityLoss = rumorRules.rollSecurityLoss(ctx)
  modifySecurity(ctx.city, -securityLoss)
}
```

其中：

```text
success roll:
  reverse-engineered separately

target selector:
  open

loyalty loss:
  open

security loss:
  open
```

## 8. 本轮关闭 / 仍 open

### 已关闭 / 收紧

- 流言成功率函数在 `005D05AD` 前结束；
- `005D05B0` 与 `005D05F0` 是两个独立后续函数；
- 成功率与成功后 effect-side 逻辑二进制层面分离；
- 不能从成功率公式直接推忠诚/治安损失。

### 仍 open

1. `005D05B0` 完整 body；
2. `005D05F0` 完整 body；
3. 两者各自的业务角色；
4. loyalty target selector；
5. per-target loyalty loss；
6. security loss；
7. 亲爱/义理/相性 gate；
8. RNG helper 与调用顺序；
9. 到 `004A6CF0` / 城市治安 setter 的 exact xref；
10. Vanilla / PS2 / Wii 差异。

## 9. 来源

- sjn4048/311MemoryResearch `内存资料/函数[计算流言是否成功].txt`
- fudanglp/311resource `san11pk_dump.exe_functions.csv`
- 关联：`41-nonnatural-loyalty-exactness.md`
