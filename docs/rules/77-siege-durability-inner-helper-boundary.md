# P0-42 攻城耐久 `005ADDC0 / 005ADE20` inner helper body 边界

更新：2026-10-03。主目标版本：PC-PK1.1。

## 1. 本轮结论

两个耐久基础 helper 的函数边界已经锁定：

```text
005ADDC0 .. 005ADE1F
  ordinary / 井阑 / 投石等耐久基础 helper
  length ≈ 0x60

005ADE20 .. 005ADEAF
  冲车 / 木兽专用耐久基础 helper
  length ≈ 0x90

005ADEB0
  next = GetPrefectActualTroopStrength
```

更重要的是，从 `005AFC70` caller 可以确认：

```text
helper 返回后直接继续 x87 fmul
直到 005B057E 才统一 call 00707A74 (_ftol2)
```

因此两个 helper 返回的是**浮点耐久基础值（x87 ST(0)）**，不是已经取整的最终耐久伤害。

状态：

```text
P0-42-audit-complete
ordinary-helper-boundary-exact
ram-woodbeast-helper-boundary-exact
helper-float-return-contract-exact
outer-modifier-order-resolved
inner-formula-body-open
x87-small-value-boundary-open
```

## 2. ordinary helper 的 caller

非冲车/木兽分支：

```asm
005B04DA ...
005B04E2 push durabilityPower
005B04E3 push scalarA
005B04E8 push scalarB
005B04E9 call 005ADDC0
```

也就是该 helper 接收3个 scalar 参数。

当前 caller 上下文已知至少包含：

- 本次耐久威力 `durabilityPower`；
- 攻击部队相关数值；
- 兵力/攻击等参与耐久基础式的 scalar。

但在没有 helper body / 完整局部变量语义前，不进一步伪造三个参数的精确名字。

## 3. 冲车 / 木兽 helper 的 caller

当：

```text
attacker current unit type == 5 (冲车)
or == 8 (木兽)
```

走：

```asm
005B04F8 push durabilityPower
005B04F9 push scalarA
005B04FE push scalarB
005B04FF call 005ADE20
```

同样是3个 scalar 参数。

所以 `005ADE20` 不是无参数 lookup table，而是输入当前攻击状态计算基础耐久值。

## 4. helper 返回值是 x87 浮点

这是本轮最关键的 exact 边界。

两个 helper 返回后：

```asm
005B0504 ...
005B050E fmul criticalMultiplier ; 1.15 if critical
...
005B0525/0537/0544/0568/0570/0578
  fmul target-type multiplier

005B057E call 00707A74
```

也就是说控制流依赖：

```text
ST(0) = innerHelperBaseDurability
```

然后继续在 x87 栈上做外层倍率。

最终：

```text
_ftol2
```

才把正浮点耐久伤害向0截断，正常域等价 floor。

## 5. 外层倍率和 inner helper 必须严格分层

已确认外层：

```text
critical:
  ×1.15

target-type multiplier:
  city / pass / harbor / camp / fort / fortress / wall / domestic / fire-trap / dam ...

ladder:
  ordinary land unit ×1.4
  siege/later profile ×1.2

Super player:
  final durability ×0.75
```

这些不能塞回 `005ADDC0 / 005ADE20` 的基础公式里。

特别是冲车/木兽：

```text
005B0552 / 005B0557
```

会跳过一部分 ordinary target durability attenuation。

所以它们高破耐久不仅来自 `005ADE20`，也来自**外层目标倍率分支差异**。

## 6. ordinary reconstructed formula 继续是 high-confidence，不是 body-exact

现有重构：

```text
sqrt(attackerTroops)
* attackerAttack
* sqrt(1/1500)
* (1 + durabilityPower/25)
```

再乘外层倍率，可以复算：

```text
10000兵 / Attack80 / city
adjacent normal (power15) -> 231
ranged normal (power5)    -> 173
```

与原作实测吻合。

但由于 `005ADDC0` body 未公开，当前仍只能标：

```text
empirical-high / reconstructed
```

不能升级为 PC opcode-exact。

## 7. 为什么 x87 small-value edge 继续 open

现在已确认：

```text
helper -> x87 ST(0)
-> multiple fmul
-> _ftol2
```

因此以下边界可能受：

- x87 80-bit intermediate precision；
- helper 内部 sqrt 实现；
- float/double 常量装载精度；
- 很小兵力/攻击值；

影响。

所以不能把重构式简单用 JS/TS double 一次性计算后 floor，就宣称 bit-exact。

## 8. 当前安全实现

```ts
base = unitType === RAM || unitType === WOOD_BEAST
  ? ramWoodBeastDurabilityBase(args)
  : ordinaryDurabilityBase(args)

raw = base
raw *= criticalModifier
raw *= targetTypeModifier
...
final = truncTowardZero(raw)
```

其中：

```text
outer modifier order:
  reverse-engineered

inner base helper formulas:
  unresolved / reconstructed profile
```

## 9. 本轮关闭 / 仍 open

### 已关闭 / 收紧

- `005ADDC0..005ADE1F` 边界；
- `005ADE20..005ADEAF` 边界；
- 两者都是3 scalar 参数 helper；
- 冲车/木兽走独立 helper；
- helper 返回值保留在 x87 ST(0)；
- critical / target-type 等外层倍率在 helper 之后；
- 最终统一 `_ftol2`。

### 仍 open

1. `005ADDC0` 完整 body；
2. `005ADE20` 完整 body；
3. 三个 caller scalar 参数的精确命名/来源；
4. ordinary helper sqrt / 常量的 opcode；
5. ram/wood-beast helper 的内部公式；
6. x87 80-bit 中间精度边界；
7. 极小兵力/极小攻击的 exact rounding；
8. Vanilla / PS2 / Wii 差异。

## 10. 来源

- sjn4048/311MemoryResearch `内存资料/函数[部队攻击].txt`
- fudanglp/311resource `san11pk_dump.exe_functions.csv`
- 关联：`05-combat.md`、`16-unresolved-rules-fallbacks.md`
