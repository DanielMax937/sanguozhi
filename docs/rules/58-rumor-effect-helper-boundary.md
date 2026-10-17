# P0-23 流言 effect helper / target-selector 边界

原边界记录：2026-10-03；现行措辞纠正：2026-10-17。主目标版本标签为PC-PK1.1，不据此认证clean-stock身份。

## 1. 本轮结论

公开逆向资料中的流言成功计算listing列出到以下返回边界；它未补齐被调helper、原角色/名单、最终随机比较及RNG，因此不称端到端完整原成功概率已恢复：

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

据既有函数边界资料，可以分开登记：

```text
rumor success-rate calculator
!=
005D05B0
!=
005D05F0
```

也就是说，成功计算listing与两个后续函数不是同一函数。后续函数的effect-side业务角色仍未证明，不能把地址相邻当作成功后的实际调用关系。

状态：

```text
P0-23-audit-complete
success-listing-and-following-functions-separated
two-following-function-boundaries-recorded
original-complete-success-probability-open
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

这收紧了“两个独立后续函数”的边界，但不证明effect-side实际业务分工、调用顺序或writer。

## 3. 成功计算listing与后续函数边界分开，effect业务角色未证

所列成功计算文本可见：

- 计略府参数10→12这一独立事实；
- 若干读取与参数传递；
- `005BA410`调用；
- 末段整数运算及返回。

这些内容不证明完整原概率或其输入语义。005D0540/005D055A的文本写sar dl,02/03，旁列bytes为c1 fa 02/03，操作宽度冲突继续E；未解码、未修源。

并在 `005D05AD` 返回。

所以不能再把：

```text
流言成功率公式
```

直接当作：

```text
流言成功后忠诚下降公式
```

两者应按不同证据问题处理；原完整成功率和后续具体效果均仍open。

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
  visible listing; original helpers/role selection/comparison/RNG remain open

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
- 成功计算listing与两后续函数边界分开；后续effect业务角色及实际调用顺序仍未证；
- 不能从可见成功listing直接推完整原概率、忠诚或治安损失。

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
10. Vanilla / PS2 / Wii 差异；
11. 原成功概率的005BA410/角色与名单helper/最终随机比较，以及sar文本宽度冲突。

## 9. 来源

- sjn4048/311MemoryResearch `内存资料/函数[计算流言是否成功].txt`
- fudanglp/311resource `san11pk_dump.exe_functions.csv`
- 关联：`41-nonnatural-loyalty-exactness.md`

## 10. O12-B有限软件服务不关闭原证据

[完整规则](rumor-scalar-lifecycle.md)另实现固定双城普通标量：新odds与三人平均防守、关系保护、至多一人加空槽、义理表、分离loss及独立RNG均synthetic，不从玩家观察恢复分布。200金/30AP与智力方向有官方依据，10/12只为listing单独参数事实。原被捕风险 unresolved-not-modeled，不是0；travel/failureDiplomacy/xpMeritTp未模拟，ownershipFrozen=true。原成功/效果仍E，完整原世界命令和P078依赖仍X；O12与原43不关闭、不新增分母。仅静态交付，未运行测试、typecheck、编译、build、checker、诊断、schema校验、产品或示例。
