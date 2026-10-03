# P0-25 普通登用 005C4F80 内部成功率公式边界

更新：2026-10-03。主目标版本：PC-PK1.1。

## 1. 本轮结论

本轮仍没有恢复 `005C4F80 GetHiringSuccessRate` 完整 body，但函数签名与参数角色可以进一步锁定：

```text
005C4F80 GetHiringSuccessRate
cdecl
arg1 = 被登用武将指针
arg2 = 登用武将指针
arg3 = mode / 第三个参数
arg4 = dateKey / 第四个整型参数
```

调用点：

```asm
004AFDDD mov ecx,[esp+20]   ; arg4
004AFDE1 mov ebp,[esi+F0]   ; target giri，外层单独保存
004AFDE7 push ecx           ; arg4
004AFDE8 push ebx           ; arg3
004AFDE9 push edi           ; executor ptr
004AFDEA push esi           ; target ptr
004AFDEB call 005C4F80
```

因此状态：

```text
P0-25-audit-complete
GetHiringSuccessRate-signature-exact
target/executor-pointer-inputs-exact
mode-input-exact
dateKey-input-exact
outer-giri-read-exact
internal-stat-formula-open
005BA410-body-open
```

## 2. 005C4F80 的函数边界

`311resource` 函数表：

```text
005C4F80 GetHiringSuccessRate
005C51C0 next function
```

因此函数约为：

```text
0x240 bytes
```

这说明它不是一个极小 wrapper，内部确实有足够空间承载多层计算；但函数长度本身不能用来猜公式。

## 3. 四个参数角色已经明确

SIRE 声明：

```c
int __cdecl GetHiringSuccessRate(void *lp, void *, int, int)
```

与 `004AFD60` 调用点完全吻合。

所以可以固定接口：

```ts
getHiringSuccessRate(
  targetPerson,
  executorPerson,
  mode,
  dateKey
)
```

这比旧文档笼统的“目标/执行者完整指针 + 若干上下文”更精确。

## 4. target giri 在 005C4F80 调用前被外层单独读取

调用前：

```asm
004AFDE1 mov ebp,[esi+000000F0]
```

`+0xF0 = target giri`。

随后这个 `ebp` 在 `005C4F80` 返回后，只有 mode != 0 的外层倍率使用：

```text
factor10 = min(10, 15 - 2*giri)
```

因此可明确：

```text
非0 mode 的外层 giri multiplier
不属于 005C4F80 本体
```

普通 mode=0 时该外层倍率完全不参与。

## 5. loyalty/charm/compatibility 不是 005C4F80 的显式标量参数

这点很关键。

在调用 `005C4F80` 时，外层没有 push：

```text
target loyalty
executor charm
compatibility difference
```

它只 push 两个人物指针、mode、dateKey。

所以如果 `005C4F80` 内部使用：

- target loyalty；
- executor charm；
- compatibility；
- ruler relation；
- giri；
- ambition；

都必须是通过人物指针/全局 helper 在函数内部读取。

不能再把这些字段写成 `005C4F80` 的“已知显式参数”。

## 6. 与 005BA4C0 的参数必须区分

在 `005C4F80` 返回以后，普通 mode=0 的最终 deterministic check 才显式重新取：

```text
targetId
executorId
targetLoyalty
executorCharm
executorTargetCompatibilityDifference
dateKey
0
```

并传给：

```text
005BA4C0
```

因此：

```text
005C4F80 success-rate inputs
!=
005BA4C0 deterministic-value inputs
```

这是两个不同层级，不能把 `005BA4C0` 的 7 个入参误认为成功率公式的直接入参。

## 7. dateKey 同时进入成功率函数与 deterministic generator

第四参数在：

```text
005C4F80
```

和后续：

```text
005BA4C0
```

都会使用。

异地登用又明确保存发令时 dateKey。

因此 dateKey 不只是“最终随机种子”，它同时也是成功率函数的上下文输入。

这意味着不能简单假设：

```text
successRate 只由人物静态属性决定
```

原函数理论上可以根据日期上下文调整输出。

是否真的使用 dateKey 的具体值，仍需 body 才能确认。

## 8. 005BA410 仍是内部关键缺口

SIRE 明确备注：

```text
005C4F80 会调用 005BA410（一组数据的计算）
```

`311resource` 函数边界：

```text
005BA410 .. 005BA4BF
005BA4C0 next function
```

约 `0xB0` bytes。

目前没有公开 body，因此不能确认它是在计算：

- 属性组合；
- 关系分数；
- 相性/忠诚中间量；
- 日期相关值；
- 某种归一化。

## 9. 当前 fidelity 实现应如何写

```ts
const p = rules.hiring.getSuccessRate({
  target,
  executor,
  mode,
  dateKey,
})
```

其中 fallback 公式可以读取 target/executor 的属性，但必须标 compatibility profile。

不要把 API 写成：

```ts
getSuccessRate(
  targetLoyalty,
  executorCharm,
  compatibilityDiff
)
```

因为那会错误暗示原函数签名已经如此。

## 10. 本轮关闭 / 仍 open

### 已关闭 / 收紧

- `005C4F80` 函数边界 `005C4F80..005C51BF`；
- exact cdecl 四参数签名；
- arg1 target ptr；
- arg2 executor ptr；
- arg3 mode；
- arg4 dateKey；
- target giri 在调用前由外层单独读取；
- loyalty/charm/compatibility 不是 `005C4F80` 的显式标量参数；
- `005BA4C0` 七参数不得混同为 `005C4F80` 输入。

### 仍 open

1. `005C4F80` 完整 body；
2. `005BA410` 完整 body；
3. 本体是否读取 loyalty/charm/compatibility/giri/ambition；
4. 每项权重与整数取整顺序；
5. dateKey 在 success-rate body 内是否真正参与；
6. hard gate `004AF7D0` 完整 body；
7. `005BA4C0` deterministic generator；
8. Vanilla / PS2 / Wii 等价性。

## 11. 来源

- sjn4048/311MemoryResearch `Func-人才01-计算登用是否成功.txt`
- sean2077/311SireCustomizedPackageDev `material/内存地址汇总.md`
- fudanglp/311resource `san11pk_dump.exe_functions.csv`
- 关联：`36-hiring-probability-exactness.md`
