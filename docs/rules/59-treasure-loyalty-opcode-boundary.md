# P0-24 宝物授予 / 没收忠诚变动 opcode 边界

更新：2026-10-03。主目标版本：PC-PK1.1。

## 1. 本轮结论

当前公开逆向可以把“宝物所有权变化”和“忠诚变化”明确拆成两套 primitive：

```text
TreasureValue
  struct_treasure +0x3C

SetTreasureOwnerAndCity
  004A0A40
  -> 00484DE0 SetOwnerAndCityForTreasure

SetTreasureStatus
  004A0A70
  -> 00484E20 SetTreasureState

ModifyPersonLoyalty
  004A6CF0

SetLoyalty
  0048A770
```

因此：

```text
宝物 ownership mutation
!=
忠诚 side effect
```

状态：

```text
P0-24-audit-complete
treasure-value-field-exact
treasure-owner-primitive-exact
treasure-state-primitive-exact
loyalty-primitive-separate-exact
grant-value-to-loyalty-xref-open
confiscation-minus30-opcode-open
```

## 2. “授予没收”是独立命令类别

SIRE 数据表中：

```text
command 14 / 0x0E = 授予没收
```

说明它不是现金褒赏的一个子模式，而是独立的命令路径。

这也要求引擎把：

```text
cash reward
treasure grant/confiscation
```

作为两套独立 loyalty profile。

## 3. 宝物价值字段是明确结构字段

结构体：

```text
struct_treasure +0x38 = TreasureType
struct_treasure +0x3C = TreasureValue
struct_treasure +0x40 = Owner
struct_treasure +0x44 = City
struct_treasure +0x48 = State
```

所以“宝物价值”不是 UI 临时计算值，而是原数据结构中的明确输入字段。

官方说明“价值越高，忠诚增加越多”因此有清晰的数据来源。

## 4. 所有权 setter 不应被实现为自动改忠诚

公开地址表明确：

```text
004A0A40 SetTreasureOwnerAndCity
  push cityID
  push personID
  push treasure
  -> 00484DE0
```

它的语义是修改：

```text
treasure.owner
treasure.city
```

而忠诚有独立 primitive：

```text
004A6CF0 ModifyPersonLoyalty(delta)
```

因此 fidelity 架构应当是：

```ts
transferTreasureOwnership(treasure, target)
applyTreasureLoyaltySideEffect(target, treasure, cause)
```

而不是：

```ts
treasure.setOwner(target) // 内部偷偷改忠诚
```

## 5. gain = TreasureValue 仍不能升级为 opcode exact

目前证据：

- 官方：价值越高，忠诚提升越多；
- 实测：价值20宝物可出现 true loyalty 100 -> 120；
- 结构：TreasureValue 为 +0x3C；
- 但公开仓库仍没有命令结算层到 `004A6CF0` 的 xref / 指令 dump。

因此：

```text
grant gain == TreasureValue
```

继续保持：

```text
empirical-high candidate
```

不能升级为 reverse-engineered exact。

## 6. 没收 -30 仍是经验常量，不是已恢复 opcode

长期攻略/实测常把普通没收描述为约：

```text
-30 loyalty
```

但当前没有：

```text
push -30
call 004A6CF0
```

这类公开反汇编证据。

因此 `-30` 继续标：

```text
empirical-high / version-boundary-open
```

不能因为授予可能 `+value` 就构造对称公式 `-value`。

## 7. 宝物 state 与 owner 也应分离

`004A0A70 -> 00484E20 SetTreasureState` 独立于 owner/city setter。

这意味着授予/没收命令可能涉及至少：

```text
owner/city mutation
state mutation
loyalty side effect
AP transaction
```

多个步骤。

在恢复完整 caller 前，不要把它们压成一个单函数。

## 8. 当前安全实现

```ts
function resolveTreasureTransfer(ctx) {
  setTreasureOwnerAndCity(ctx.treasure, ctx.newOwner, ctx.city)
  setTreasureStateIfNeeded(ctx.treasure, ctx.newState)

  const delta = ctx.rules.treasureLoyalty.delta({
    cause: ctx.cause, // grant | confiscate
    value: ctx.treasure.value,
    target: ctx.target,
  })

  modifyTrueLoyalty(ctx.target, delta)
}
```

其中：

```text
grant delta profile:
  value-monotonic official
  gain=value empirical-high

confiscate delta profile:
  loyalty loss empirical-high
  -30 empirical-high
```

## 9. 本轮关闭 / 仍 open

### 已关闭 / 收紧

- `TreasureValue = +0x3C`；
- `004A0A40 / 00484DE0` 是宝物 owner/city setter；
- `004A0A70 / 00484E20` 是宝物 state setter；
- `004A6CF0` 是独立 loyalty delta primitive；
- 因而 ownership/state mutation 与 loyalty side effect 必须分层。

### 仍 open

1. 授予没收命令完整 execution caller；
2. `TreasureValue -> loyalty delta` 的 exact xref；
3. `gain == value` 的 PC opcode；
4. 没收 `-30` 的 PC opcode；
5. 没收是否受宝物价值/关系/义理修正；
6. 先改 ownership 还是先改 loyalty 的 exact 顺序；
7. 状态 setter 是否所有路径都调用；
8. Vanilla / PS2 / Wii 差异。

## 10. 来源

- sean2077/311SireCustomizedPackageDev `material/结构体汇总.md`
- sean2077/311SireCustomizedPackageDev `material/内存地址汇总.md`
- sean2077/311SireCustomizedPackageDev `material/数据汇总.md`
- fudanglp/311resource `san11pk_dump.exe_functions.csv`
- sjn4048/311MemoryResearch `内存资料/修改记录by sjn4048.txt`
- 关联：`41-nonnatural-loyalty-exactness.md`
