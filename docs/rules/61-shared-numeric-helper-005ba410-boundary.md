# P0-26 `005BA410` helper / 数据组合边界

更新：2026-10-03。主目标版本：PC-PK1.1。

## 1. 本轮结论

`005BA410` 不是普通登用专用 helper。

已确认至少两条独立业务链调用它：

```text
普通登用成功率
005C4F80 GetHiringSuccessRate
  -> 005BA410

流言成功率
005D052C
  -> 005BA410
```

因此它应视为：

```text
shared numeric-combination helper
```

而不是：

```text
hiring-only formula
```

状态：

```text
P0-26-audit-complete
shared-helper-cross-domain-exact
hiring-specific-helper-model-rejected
rumor-callsite-four-stack-inputs-exact
input-business-semantics-open
helper-body-open
```

## 2. 函数边界

`311resource`：

```text
005BA410 sub_5ba410
005BA4C0 next function
```

因此：

```text
005BA410 .. 005BA4BF
length ≈ 0xB0 bytes
```

函数长度足以承载若干整数运算，但不能凭长度猜算法。

## 3. 它被登用与流言共同复用

SIRE 地址表明确备注：

```text
005C4F80 GetHiringSuccessRate
会调用 005BA410（一组数据的计算）
```

流言成功率的公开反汇编则直接给出：

```asm
005D052C call 005BA410
```

因此可关闭旧假设：

```text
005BA410 = 招聘专用属性公式
```

更安全的抽象是：

```ts
combineProbabilityInputs(a, b, c, d, ...)
```

具体业务含义由 caller 决定。

## 4. 流言调用点明确准备四个栈参数

调用前：

```asm
005D051E push eax
005D0523 push edx
005D0527 push eax
005D052B push ecx
005D052C call 005BA410
```

其中：

```asm
005D0524 lea ecx,[edi+edi*4]
005D0528 shl ecx,02
```

所以最后一个参数明确为：

```text
20 * edi
```

其余参数来自前序人物/场景相关 helper 与局部变量。

目前只能确认 raw dataflow，不能可靠命名它们各自的业务字段。

## 5. 这说明 helper 更像通用“数组/多输入组合”层

登用和流言是不同业务域。

如果同一个 helper 同时被两者调用，那么更可能的职责是：

- 对一组整数做统一组合；
- 对多输入做规范化/加权；
- 根据若干参数生成中间值。

但以下仍不能断言：

- hash；
- CRC；
- 加权平均；
- 方差/平方差；
- compatibility 专用函数；
- 概率 clamp。

这些都需要 body。

## 6. 与 `005BA4C0` 必须继续分层

`005BA410`：

```text
shared helper
被成功率公式调用
```

`005BA4C0`：

```text
normal hiring final deterministic-value generator
接受 dateKey / IDs / loyalty / charm / affinityDiff / 0
```

两者地址相邻，但不能因为相邻就视为同一算法族或前后两段。

当前唯一 exact 的关系是：

```text
005BA410 ends before 005BA4C0 begins
```

以及二者有不同 caller / 参数语境。

## 7. 对 `005C4F80` 的意义

P0-25 已确认：

```text
005C4F80(targetPtr, executorPtr, mode, dateKey)
```

现在又确认它内部调用一个跨业务共享的 `005BA410`。

所以 `005C4F80` 本体很可能承担两部分职责：

```text
A. 从人物/场景读取并准备业务输入
B. 调 005BA410 做通用组合
C. 对结果做登用专属后处理
```

其中 B 的“通用组合”身份比之前更有证据，但 A/C 的具体内容仍 open。

## 8. 当前安全接口

```ts
interface NumericCombinationHelper {
  combine(rawInputs: number[]): number
}

interface HiringSuccessRateProfile {
  getRate(ctx): number
}

interface RumorSuccessRateProfile {
  getRate(ctx): number
}
```

不要让业务层直接依赖一个叫：

```text
hiringAttributeFormula()
```

的 helper，因为原程序已经证明它跨业务复用。

## 9. 本轮关闭 / 仍 open

### 已关闭 / 收紧

- `005BA410` 函数边界 `005BA410..005BA4BF`；
- 它被 `005C4F80` 调用；
- 它也被流言成功率 `005D052C` 调用；
- 因而不是登用专用函数；
- 流言 callsite 明确准备 4 个栈输入；
- 其中一项 raw value = `20 * edi`。

### 仍 open

1. `005BA410` 完整 body；
2. 四个流言 raw input 的业务语义；
3. 登用 callsite 传入多少参数及各自来源；
4. helper 的 exact 数学运算；
5. 是否有 clamp / normalization；
6. `005C4F80` 在 helper 前后的专属处理；
7. Vanilla / PS2 / Wii 等价性。

## 10. 来源

- sjn4048/311MemoryResearch `函数[计算流言是否成功].txt`
- sean2077/311SireCustomizedPackageDev `material/内存地址汇总.md`
- fudanglp/311resource `san11pk_dump.exe_functions.csv`
- 关联：`36-hiring-probability-exactness.md`、`60-hiring-success-rate-signature-boundary.md`
