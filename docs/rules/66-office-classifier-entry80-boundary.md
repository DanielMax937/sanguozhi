# P0-31 `005FA650` office classifier / 第81内部官职边界

更新：2026-10-03。主目标版本：PC-PK1.1。

## 1. 本轮结论

`005FA650` 已确认是 `005FAF00` 用来取得 office type 的 classifier helper。

函数边界：

```text
005FA650 .. 005FA6DF
next = 005FA6E0
length ≈ 0x90 bytes
```

官职数组本身则由 SIRE 结构资料明确为：

```text
struct_office_ARRAY
start = 0727F334
end   = 07280630
count = 81
size  = 0x3C each
```

所以第81项（index 80）确实是原程序真实数组成员，不是文档推导出来的虚构 entry。

状态：

```text
P0-31-audit-complete
office-array-count-81-exact
classifier-function-boundary-exact
named-office-0-to-79-pattern-high-confidence
internal-entry-80-real-exact
internal-entry-80-classification-open
classifier-opcode-open
```

## 2. `005FA650` 在 selector 中的角色 exact

`005FAF00`：

```asm
005FAF03 mov eax,[esp+1C]  ; office ptr
005FAF07 push eax
005FAF0C call 005FA650
005FAF15 mov [esp+04],eax  ; office type
```

后续只按返回值：

```text
0
1
other
```

分成三套 scoring branch。

因此 `005FA650` 的业务角色可以固定为：

```text
office -> officeType
```

而不是 candidate generation / sorting。

## 3. 已命名 0..79 官职的分类模式仍保持高置信

目前静态官职表与 selector branch 行为共同支持：

```text
type 0:
  officeId 0..3
  顶级四文官

type 1:
  named office IDs 0..79 中
  officeId % 8 >= 4
  武官

type 2:
  其余已命名文官
```

兼容实现：

```ts
if (id >= 0 && id <= 3) return 0
if (id >= 0 && id < 80 && id % 8 >= 4) return 1
if (id >= 0 && id < 80) return 2
```

但由于 `005FA650` body 未恢复，这仍是：

```text
reverse-inferred-high
```

不是 opcode-exact。

## 4. 第81项(index 80)现在确认“真实存在”

SIRE 结构体资料明确：

```text
struct_office[81]
array_sizes: 81
```

因此 index 80 必须在 fidelity 数据模型中保留一个 slot。

不能再把 office array 简化成：

```text
exactly 80 entries
```

也不能直接丢弃最后一项。

## 5. 但 index 80 的业务分类仍 open

当前公开资料没有：

- index 80 的实际字段 dump；
- 对应名称；
- `005FA650` body；
- caller 使用 index 80 的 xref。

因此不能声称它是：

- 隐藏武官；
- 隐藏文官；
- 占位；
- 无官职 sentinel；
- 事件专用官职。

这些都没有原证据。

## 6. office struct 当前已知字段不足以自行分类

`struct_office` 当前可见：

```text
+0x2C TroopNumber
+0x30 AttrIncreaseType
+0x34 AttrIncrease
+0x35 Salary
+0x36 Rank/Level
```

但没有第80项具体值。

所以不能根据结构定义本身反推出 classifier result。

## 7. 当前安全实现

```ts
function classifyOffice(officeId: number) {
  if (officeId >= 0 && officeId <= 3) return 'top-civil'

  if (officeId >= 0 && officeId < 80) {
    return (officeId % 8) >= 4
      ? 'military'
      : 'civil'
  }

  if (officeId === 80)
    return rules.office.internalEntry80Type

  return 'invalid'
}
```

其中：

```text
internalEntry80Type = open
```

不能默认成 civil / military。

## 8. 本轮关闭 / 仍 open

### 已关闭 / 收紧

- `005FA650` 函数边界 `005FA650..005FA6DF`；
- `005FA650` 的角色是 office classifier；
- 官职数组精确为81项；
- index80 是真实原数组成员；
- 已命名0..79的三类模式继续保持高置信。

### 仍 open

1. `005FA650` 完整 body；
2. index80 的字段值；
3. index80 名称/用途；
4. index80 classifier result；
5. index80 是否被自动封官 scheduler 使用；
6. Vanilla / PS2 / Wii 差异。

## 9. 来源

- sean2077/311SireCustomizedPackageDev `material/结构体汇总.md`
- sean2077/311SireCustomizedPackageDev `material/内存地址汇总.md`
- sjn4048/311MemoryResearch `内存资料/函数[自动封官].txt`
- fudanglp/311resource `san11pk_dump.exe_functions.csv`
- 关联：`43-auto-office-selector-exactness.md`
