# P0-20 俘虏 forced-release comparator / 选择方向

更新：2026-10-03。主目标版本：PC-PK1.1。

## 1. 本轮结论

P0-20 继续追踪资金不足自动释放时“到底放谁”。本轮仍未恢复 `0058C320` comparator body，但调用链能进一步锁定列表裁剪语义：

```asm
00590940 push 0
00590942 push 0
00590944 push 0058C320
00590949 push 1
0059094B lea  ecx,[esp+40]
0059094F call 004AA200

00590954 cmp  esi,[esp+3c]
00590958 jnl  0059096F

00590960 lea  ecx,[esp+30]
00590964 call 004A8E10
00590969 cmp  esi,[esp+3c]
0059096D jl   00590960
```

其中 `esi = releaseCount`，`[esp+3c] = current list count`。

因此：

```text
004AA200
  使用 0058C320 comparator 对候选列表做一次有序处理

004A8E10
  每次仅接收 list this/ecx
  没有显式 index / person / releaseCount 参数
  被反复调用直到 listCount == releaseCount
```

状态：

```text
P0-20-audit-complete
forced-release-count-exact
comparator-sort-stage-exact
shrink-is-repeated-no-arg-list-operation-exact
arbitrary-per-iteration-selection-rejected
comparator-business-key-open
shrink-end-open
final-priority-open
```

## 2. 释放 subset 不是每轮重新按业务条件挑一人

如果原程序每轮都要重新选择“最低忠诚”“最高能力”或随机一人，通常需要向 shrink helper 传入至少某种：

```text
index
person pointer
key
callback
```

但 `00590964` 的调用形式只有：

```asm
lea ecx,[esp+30]
call 004A8E10
```

没有额外 push。

所以当前可以排除这种结构：

```ts
while (list.length > releaseCount) {
  const person = chooseAgainByBusinessRule(list)
  list.remove(person)
}
```

更符合原调用链的是：

```ts
list = sortOrOrderOnce(list, comparator0058C320)

while (list.length > releaseCount) {
  shrinkOneFromFixedContainerSide(list)
}
```

具体是删头还是删尾仍 open。

## 3. comparator 与 shrink side 必须联合解释

即使未来只恢复 `0058C320` 的比较方向，也还不能单独得出“谁被释放”。

例如：

```text
若 comparator = 能力升序
且 shrink 删除尾端
=> 最终保留低能力者作为释放集合

若 comparator = 能力升序
且 shrink 删除头端
=> 最终保留高能力者作为释放集合
```

所以 exact 结论必须同时拿到：

```text
A. 0058C320 comparison key + return orientation
B. 004A8E10 删除列表哪一端
```

两者缺一不可。

## 4. 004AA200 的调用形态确认 comparator 是一次性排序/有序处理层

调用参数：

```asm
push 0
push 0
push 0058C320
push 1
ecx = candidate list
call 004AA200
```

至少可以确认 `0058C320` 以函数指针形式进入通用列表算法，而不是在 release loop 中逐人直接调用。

因此 selector 架构固定为：

```text
candidate construction
-> comparator-based ordering
-> repeated generic shrink
-> exact-size subset
-> 0058D1D0 accumulator
-> 0058D430 finalizer
```

## 5. 当前仍不能猜 comparator 业务字段

没有 `0058C320` body 前，以下全部不能升级：

- 忠诚；
- 能力；
- 功绩；
- 身份；
- 义理；
- 俘虏月份；
- 武将 ID；
- 原势力；
- 随机值。

因此项目当前的 `stable-person-id-order` 只能继续作为 provisional deterministic fallback，不能写成原版优先级。

## 6. 311resource 能提供到什么程度

`san11pk_dump.exe_functions.csv` 确认函数边界：

```text
0x58C320 sub_58c320
0x58C3D0 next function

0x4A8E10 sub_4a8e10
0x4A8EA0 next function

0x4AA200 sub_4aa200
0x4AA350 next function
```

所以大致长度为：

```text
0058C320 comparator ~0xB0 bytes
004A8E10 shrink helper ~0x90 bytes
004AA200 generic ordering helper ~0x150 bytes
```

但当前公开仓库没有对应 decompiler/xref/instruction dump，不能凭函数长度猜语义。

## 7. 当前安全实现

```ts
const candidates = getCaptivesAtFacility(facility)

const ordered = rules.captiveMaintenance.order(candidates)

while (ordered.length > releaseCount) {
  rules.captiveMaintenance.shrinkOne(ordered)
}

const released = ordered
```

strict fidelity：

```text
order comparator = unresolved
shrink side = unresolved
```

compatibility：

```text
stable person-id order + documented deterministic side
```

必须显式标 provisional。

## 8. 本轮关闭 / 仍 open

### 已关闭 / 收紧

- `0058C320` 是传给 `004AA200` 的 comparator；
- comparator-based ordering 在 shrink loop 之前只做一次；
- `004A8E10` 每次只接收列表对象；
- shrink loop 不传具体 person/index；
- 因而“每轮重新按业务规则挑一人删除”的结构可以排除；
- 最终 subset 大小严格等于 releaseCount。

### 仍 open

1. `0058C320` comparison key；
2. comparator return orientation；
3. `004A8E10` 删除头还是尾；
4. `004AA200` 参数 `1, comparator, 0, 0` 的完整业务语义；
5. 同 key tie-break；
6. `0058D1D0 / 0058D430` side effects；
7. forced release Forbidden/技巧P；
8. Vanilla / PS2 / Wii 差异。

## 9. 来源

- sjn4048/311MemoryResearch `内存资料/整理/Func-收支03-每月钱粮兵装收支.txt`
- fudanglp/311resource `extractor/ida/data/python_idb/san11pk_dump.exe_functions.csv`
- 关联：`42-captive-release-exactness.md`
