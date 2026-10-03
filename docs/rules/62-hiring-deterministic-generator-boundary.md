# P0-27 `005BA4C0` deterministic generator / 输入混合边界

更新：2026-10-03。主目标版本：PC-PK1.1。

## 1. 本轮结论

普通登用 mode=0 的最终判定：

```text
005BA4C0(...) -> deterministicValue
deterministicValue < successRate
```

本轮进一步确认：

```text
005BA4C0 .. 005BA4EF
next function = 005BA4F0
length ≈ 0x30 bytes
```

公开资料目前只在普通登用最终判定链中明确看到该 helper。

因此更安全的定位是：

```text
small deterministic leaf/mixer helper
```

而不是：

```text
完整登用成功率函数
或
大型通用 PRNG
```

状态：

```text
P0-27-audit-complete
function-boundary-exact
seven-input-callsite-exact
final-threshold-compare-exact
small-leaf-helper-high-confidence
cross-domain-reuse-not-found
mixing-formula-open
```

## 2. 函数边界非常小

`311resource` 函数表：

```text
005BA4C0 sub_5ba4c0
005BA4F0 next function
```

所以函数只有大约：

```text
0x30 bytes
```

这与 `005BA410` 的约0xB0字节、`005C4F80` 的约0x240字节形成明显区别。

因此 `005BA4C0` 更像：

- 紧凑整数混合；
- 小型 deterministic transform；
- 简单 hash-like leaf；

但仍不能把其中任何一种命名为源码事实。

## 3. 七个输入仍以 caller 为 exact 证据

普通登用 caller 明确 push：

```text
dateKey
targetPersonId
executorPersonId
targetLoyalty
executorCharm
executorTargetCompatibilityDifference
0
```

随后：

```asm
004AFE97 call 005BA4C0
004AFEA3 xor edx,edx
004AFEA5 cmp eax,ecx
004AFEA7 setl dl
```

所以 exact 语义仍是：

```ts
success = generator(inputs) < successRate
```

而不是 runtime random roll。

## 4. 公开资料暂未发现跨业务 caller

本轮在：

- 311MemoryResearch；
- SIRE 地址表；
- 311resource；

中搜索 `005BA4C0 / 5BA4C0 / sub_5ba4c0 / call 005ba4c0`，没有找到除普通登用链之外的明确公开 caller。

这与 P0-26 的 `005BA410` 不同：

```text
005BA410
  已证明跨登用 / 流言复用

005BA4C0
  当前只确认普通登用最终判定
```

因此目前应标：

```text
hiring-path-specific confirmed usage
cross-domain reuse not found
```

注意：`not found` 不等于“绝对没有其他 xref”；公开资料缺 xref dump，仍不能宣称唯一 caller。

## 5. 第七参数固定0不能被擅自解释

普通登用明确：

```text
arg7 = 0
```

但没有 body 前不能说它一定是：

- mode；
- salt；
- seed selector；
- reserved flag；
- difficulty；
- random-table index。

正确表述只应是：

```text
normal-hiring caller passes literal zero as seventh argument
```

## 6. dateKey 是稳定输入，不等于“旬随机数”

`dateKey = day*7 + month*5 + year*3`。

异地登用会保留发令日 dateKey，因此：

```text
同一人物组合 + 同一保存的 dateKey
```

会把同一组核心输入继续送入 `005BA4C0`。

但我们仍不能推出：

```text
005BA4C0 = hash(inputs) % 100
```

或者：

```text
返回范围严格0..99
```

因为 body 未恢复。

唯一 exact 的是输出被拿去和 successRate 做 `<` 比较。

## 7. 为什么不能把它实现成普通 PRNG

非0 mode 的原链明确走：

```text
004721D0 ProbabilityCheck
```

而 mode=0 单独走：

```text
005BA4C0
```

这说明两者在原程序中就是不同机制。

因此 fidelity 引擎应保留：

```ts
normalHiring:
  stableDeterministicGenerator(inputs)

otherHiringMode:
  runtimeProbabilityCheck(p)
```

不能统一成 `Math.random()`。

## 8. 当前安全接口

```ts
interface HiringDeterministicGenerator {
  value(args: {
    dateKey: number
    targetId: number
    executorId: number
    targetLoyalty: number
    executorCharm: number
    compatibilityDiff: number
    constantZero: 0
  }): number
}
```

fallback 可以做 stable hash，但必须显式命名：

```text
compatibilityDeterministicMixer
```

不能冒充原 `005BA4C0`。

## 9. 本轮关闭 / 仍 open

### 已关闭 / 收紧

- `005BA4C0` 函数边界 `005BA4C0..005BA4EF`；
- 函数长度约0x30；
- 普通登用七参数 callsite exact；
- 最终比较 `generator < successRate` exact；
- mode=0 与 runtime PRNG path 分离 exact；
- 当前公开资料未发现明确跨业务 caller。

### 仍 open

1. `005BA4C0` 完整 body；
2. 七输入的 exact 混合顺序；
3. 返回值范围；
4. 是否使用乘法/异或/取模/查表；
5. 第七参数0的真实语义；
6. 是否存在未公开其他 caller；
7. Vanilla / PS2 / Wii 等价性。

## 10. 来源

- sjn4048/311MemoryResearch `Func-人才01-计算登用是否成功.txt`
- fudanglp/311resource `san11pk_dump.exe_functions.csv`
- 关联：`36-hiring-probability-exactness.md`、P0-25、P0-26
