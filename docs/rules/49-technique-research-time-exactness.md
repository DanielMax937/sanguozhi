# P0-14 技巧研究时间 PC 函数 / 人才府减时 / 难度边界

更新：2026-10-03。

## 1. 本轮结论

P0-14 重点解决 E11 三个长期 open：

```text
A. 原 PC 技巧研究时间计算函数在哪
B. 人才府 -20 天到底属于哪一层
C. 难度是否真的有三套已知矩阵
```

当前状态：

```text
P0-14-audit-complete
research-time-containing-function-resolved
talent-office-minus-two-turns-exact
minimum-one-turn-exact
technology-struct-time-field-absent
super-thresholds-empirical-high
beginner-advanced-matrix-open
base-time-code-derived-high
```

---

## 2. 研究时间计算函数范围：005D7DD0..005D7EFF

旧资料只留下了三个孤立地址：

```text
005D7ED7 人才府 -20天
005D7EF0 最低1旬判断
005D7EF4 最低1旬写回
```

P0-14 用原 IDB 的函数边界确认：

```text
005D7DD0 sub_5d7dd0
...
005D7ED7 talent-office adjustment
005D7EF0 minimum-turn guard
005D7EF4 minimum-turn fallback
005D7F00 next function
```

因此：

```text
sub_5d7dd0
```

可以升级为：

```text
PC-PK1.1 技巧研究时间 calculator containing function
```

函数体约 `0x130` bytes。

当前仍没有公开逐指令全文，因此不伪造：

- 参数签名；
- 具体属性 getter；
- 70/140/210/280 分支对应 opcode；
- 技巧类别/等级基础时长分支。

---

## 3. 人才府修正是 calculator 内部末端修正

人才府相关地址全部位于 `sub_5d7dd0` 尾部。

已有原地址资料确认：

```text
有合资格人才府：
  researchTurns -= 2

然后：
  researchTurns = max(1, researchTurns)
```

换成天：

```ts
finalDays =
  max(10, baseDays - 20)
```

所以人才府：

- 不是 ×0.5；
- 不是改变能力和；
- 不是改变70/140/210/280阈值；
- 是**基础研究时间算完后的固定 -2旬**；
- 最低1旬。

这部分可以保持 PC-PK1.1 exact。

---

## 4. struct_technology 没有研究时间字段

SIRE/IDA 恢复出的 PC-PK1.1：

```text
struct_technology
size = 0x6C
count = 36
```

目前已识别字段只有：

```text
+0x60 RequiredPoints
+0x68 unknown int
```

而没有：

```text
ResearchDays
ResearchTurns
BaseResearchTime
```

这样的静态字段。

因此旧 open：

> “基础时间是否直接来自技巧数据字段”

现在可以显著收紧为：

```text
not stored in any currently recovered technology time field
base research time is code-derived / branch-derived
```

注意：

这不等于证明 `+0x68` 与研究时间绝对无关；它仍是 unknown int。
但至少不能再假设有一个已经恢复的“每技巧基础天数”字段。

---

## 5. 技巧类别存在至少两组基础时间行为

早期攻略长期记录：

### 枪 / 戟 / 弩 / 骑 / 练兵

```text
Lv1 30
Lv2 40
Lv3 60
Lv4 90
```

### 发明 / 防卫 / 火攻 / PK内政

```text
Lv1 40
Lv2 50
Lv3 70
Lv4 100
```

而这些攻略同时明确说明：

```text
研究时间并非固定
会随参与武将数量/能力变化
上述只是通常显示时间
```

因此 `sub_5d7dd0` 很可能至少读取：

```text
tech category / tech ID / level
+
researcher related-attribute sum
```

不能把研究时间写成单纯：

```ts
days = byLevel[level]
```

也不能写成只有能力和、完全不看技巧类别。

来源：
- 2006原版攻略
- 2006 PK内政技巧攻略

---

## 6. 超级难度：70 / 140 / 210 / 280 仍是 empirical-high

2021 日文 Wiki 受控玩家实测明确记录：

```text
相关能力合计：
70
140
210
280
```

会出现研究天数分档。

并明确注明：

```text
超級で確認
難易度による変化は未確認
```

所以当前唯一正确的证据等级是：

```text
Super thresholds:
  empirical-high

Beginner:
  open

Advanced:
  open
```

不能把“超级实测”复制成三难度通用公式。

来源：
- https://w.atwiki.jp/sangokushi11/pages/90.html

---

## 7. 超级已知锚点

同一实测给出：

### 能力和 210、无人才府

```text
Lv1 30日
Lv2 40日
Lv3 60日
Lv4 90日
```

### 人才府

```text
能力和210 + 人才府：
  Lv1 = 10日

能力和280 + 人才府：
  Lv1 = 10日
  Lv4 = 60日
```

由于人才府 exact -20日：

```text
280 / Lv4 / 无人才府
= 80日
```

这一反推是可靠的。

但不要继续线性外推：

```text
140 -> 100日
70  -> 110日
<70 -> 120日
```

因为没有证据。

---

## 8. 研究时间存储单位是“旬”

势力结构：

```text
+0x9C ResearchingTech
+0xA0 ResearchTimeLeft (short)
```

每旬自动处理：

```text
00599CF0
→ 若 ResearchTimeLeft > 0
→ decrement by 1
```

所以 runtime 存的是：

```text
remaining turns/tens
```

而不是“剩余天数”。

因此：

```ts
days = turns * 10
```

人才府减20日，在代码层就是：

```text
-2 turns
```

最低：

```text
1 turn
```

---

## 9. 研究执行路径与时间 calculator 分开

旧逆向还定位：

```text
005D8F68
研究技巧命令的行动力消耗路径
```

IDB 函数边界：

```text
005D8C50 sub_5d8c50
...
005D8F68 AP-related research command path
...
005D8FA0 next function
```

所以至少要分：

```text
sub_5d7dd0
  research duration calculator

sub_5d8c50
  research command execution / surrounding path
```

不要把时间计算和研究命令执行混成一个函数。

---

## 10. 当前安全实现

严格 fidelity profile：

```ts
baseTurns =
  researchTimeProfile.resolve(
    techId,
    level,
    relatedAttributeSum,
    difficulty
  )

if (hasTalentOffice)
  baseTurns -= 2

finalTurns =
  max(1, baseTurns)
```

其中：

```text
人才府与最低值：
exact

Super部分锚点：
empirical-high

完整baseTurns矩阵：
open
```

### compatibility fallback

如果引擎必须闭环，可暂时：

```text
枪戟弩骑练兵：
  3 / 4 / 6 / 9旬

发明防卫火攻内政：
  4 / 5 / 7 / 10旬
```

再 exact 应用：

```text
人才府 -2旬，最低1旬
```

但必须标：

```text
compatibility-guide-fallback
```

它不模拟能力和动态分档。

---

## 11. 当前剩余 exactness gap

### 已闭合 / 收紧

- 技巧研究时间 calculator containing function = `005D7DD0..005D7EFF`；
- 人才府在 calculator 内部做固定 -2旬；
- 最低1旬；
- runtime ResearchTimeLeft 以旬计数；
- 每旬 `00599CF0` -1；
- `struct_technology` 当前没有已恢复的研究时间字段；
- 基础时间应视为代码派生，而不是已知静态 time field；
- 研究时间至少存在类别差异；
- 超级 70/140/210/280 分档保持 empirical-high；
- 初级/上级不能复制超级；
- 研究执行路径 `sub_5d8c50` 与时间 calculator 分离。

### 仍 open

1. `005D7DD0` 完整逐指令 body；
2. calculator 参数签名；
3. 相关能力读取 Basic / Actual 哪一层；
4. 70/140/210/280 的 exact 比较符；
5. 超级完整5档 × 36技巧矩阵；
6. 初级 / 上级是否使用相同阈值或不同常量；
7. 技巧类别基础时间在代码中的分支方式；
8. `struct_technology +0x68` 精确含义；
9. Vanilla / PS2 / Wii 差异。

状态：

```text
P0-14-audit-complete
research-time-function-5D7DD0-resolved
talent-office-minus20-exact
minimum10days-exact
runtime-turn-unit-exact
static-time-field-not-recovered
base-time-code-derived-high
super-thresholds-empirical-high
beginner-advanced-open
```

## 12. 来源

逆向：
- 311MemoryResearch `修改记录by sjn4048.txt`
- 311MemoryResearch `Func-自动02-计数器处理【未】.txt`
- 311resource IDB functions.csv
- 311SireCustomizedPackageDev `struct_force / struct_technology`

原攻略 / 实测：
- https://w.atwiki.jp/sangokushi11/pages/90.html
- https://w.atwiki.jp/sangokushi11/pages/74.html
- https://www.gamersky.com/handbook/200603/21607.shtml
- https://gl.ali213.net/html/2006/5914.html
