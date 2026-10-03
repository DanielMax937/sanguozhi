# P0-37 技巧研究时间完整难度矩阵 / Super 阈值边界

更新：2026-10-03。主目标版本：PC-PK1.1。

## 1. 本轮结论

`005D7DD0` 研究时间 calculator 的函数边界继续保持：

```text
005D7DD0 .. 005D7EFF
next = 005D7F00
length ≈ 0x130 bytes
```

本轮没有找到其公开完整 body，也没有找到能把 `70/140/210/280` 直接绑定到 PC opcode 的地址。

同时，场景结构中明确存在：

```text
DifficultyLevel
```

但当前没有证据证明 `005D7DD0` 实际读取该字段。

因此：

```text
Super 70/140/210/280
  = empirical-high

Beginner/Advanced
  = open

DifficultyLevel field exists
  != calculator difficulty branch proven
```

状态：

```text
P0-37-audit-complete
calculator-boundary-exact
talent-office-tail-exact
super-thresholds-empirical-high
difficulty-field-exists-exact
difficulty-branch-xref-open
beginner-advanced-matrix-open
```

## 2. calculator 边界再次确认

`311resource` functions.csv：

```text
005D7DD0 sub_5d7dd0
005D7F00 next function
```

所以所有：

```text
base duration
人才府 -2 turns
minimum 1 turn
```

都处于同一 calculator 范围。

## 3. DifficultyLevel 是真实场景字段

SIRE 结构体资料：

```text
struct_scenario +0x20 DifficultyLevel
```

这证明原程序确实有独立难度状态。

但现在仍缺：

```text
005D7DD0 -> read scenario.DifficultyLevel
```

的 xref / body。

所以不能因为字段存在，就自动假设研究时间三难度分别有不同矩阵。

## 4. Super 阈值仍停留在 empirical-high

日文 Wiki 受控实测：

```text
70 / 140 / 210 / 280
```

并明确注明：

```text
超級で確認
難易度による変化は未確認
```

所以这四个阈值只能绑定：

```text
Super difficulty observed behavior
```

不能绑定：

```text
PC opcode constants
```

更不能复制到 Beginner / Advanced。

## 5. 完整矩阵仍不能补

目前只知道若干锚点：

```text
abilitySum=210, no talent office:
  30 / 40 / 60 / 90 days

abilitySum=280, talent office:
  Lv1 = 10 days
  Lv4 = 60 days
```

人才府 exact -20 days 可反推：

```text
280, no talent office, Lv4 = 80 days
```

但不能据此线性补全：

```text
<70 / 70 / 140 / 210 / 280
×
Lv1..Lv4
×
36 techniques
```

## 6. 两组“通常显示时间”继续只是 guide-level

军事/练兵：

```text
30 / 40 / 60 / 90
```

发明/防卫/火攻/内政：

```text
40 / 50 / 70 / 100
```

攻略本身又说明研究时间会随研究者能力变化，所以这两组不能当完整基础矩阵。

## 7. 当前安全实现

```ts
resolveResearchTurns({
  techId,
  techLevel,
  relatedAttributeSum,
  difficulty,
})

then:

if (hasTalentOffice) turns -= 2
turns = max(turns, 1)
```

其中：

```text
Super observed bins:
  available as empirical profile

Beginner/Advanced:
  unresolved-original
```

## 8. 本轮关闭 / 仍 open

### 已关闭 / 收紧

- `005D7DD0..005D7EFF` calculator 边界；
- 人才府 -2旬 + 最低1旬继续 exact；
- `DifficultyLevel` 场景字段真实存在；
- 但“字段存在”与“calculator读取”严格分开；
- Super 70/140/210/280 继续仅 empirical-high；
- Beginner/Advanced 不允许复制 Super。

### 仍 open

1. `005D7DD0` 完整 body；
2. calculator 参数签名；
3. DifficultyLevel exact xref；
4. 70/140/210/280 PC opcode / comparator；
5. Super 完整5档×36技巧矩阵；
6. Beginner完整矩阵；
7. Advanced完整矩阵；
8. Basic vs Actual attribute getter；
9. `struct_technology +0x68` 含义；
10. Vanilla / PS2 / Wii 差异。

## 9. 来源

- fudanglp/311resource `san11pk_dump.exe_functions.csv`
- sean2077/311SireCustomizedPackageDev `material/结构体汇总.md`
- 日文 Wiki 技巧研究评论区实测
- 关联：`49-technique-research-time-exactness.md`、`26-technique-research-time.md`
