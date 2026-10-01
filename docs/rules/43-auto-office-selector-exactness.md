# P0-8 官职自动分配资格 / selector / tie-break exactness

更新：2026-10-01。

## 1. 本轮最重要的纠错

旧文档把：

```text
005FA650
```

写成了“候选列表生成 / 排序”。

这是错误的。

从 `005FAF00` 的调用约定可直接恢复：

```text
arg1 = caller 提供的候选武将列表
arg2 = 目标官职指针
arg3 = 评分模式 flag
this = selector 所属上下文
```

入口先执行：

```asm
005FAF03 mov eax,[esp+1C]   ; arg2: office
005FAF07 push eax
005FAF0C call 005FA650
```

`005FA650(office)` 的返回值随后被当作：

```text
officeType
```

使用。

因此：

```text
005FA650 = 官职分类 helper
NOT candidate list generator
```

候选列表在进入 `005FAF00` 之前已经存在。

这意味着 P0-8 真正剩下的是：

```text
谁构造 arg1
arg1 的迭代顺序
arg3 在各 caller 中为何值
005FA4D0 的完整资格条件
```

而不是继续追不存在的“005FA650 排序算法”。

---

## 2. 005FAF00 的参数语义

`005FAF00` 末尾：

```asm
ret 000C
```

说明有3个栈参数。

结合内部访问：

```text
arg1:
  被 0047BED0 迭代
  每个元素取出 struct_person*
  => candidate list

arg2:
  push 给 005FA4D0(person, office)
  也先传给 005FA650
  => office pointer

arg3:
  005FAF8A 读取
  test eax,eax
  je 005FB070
  => scoring-mode flag
```

所以推荐接口：

```ts
selectAutomaticOfficeCandidate(
  candidates,
  office,
  scoringModeFlag
)
```

而不是以前模糊的：

```ts
autoOffice(office)
```

---

## 3. 005FA650：官职 type classifier

`005FAF00` 对 `005FA650(office)` 的结果只分：

```text
0
1
other
```

原逆向注释与80个有名官职的 ID 排布共同支持：

```text
type 0:
  丞相 / 司空 / 太尉 / 司徒
  顶级四个文官

type 1:
  武官

type 2:
  其余文官
```

80个有名官职按每层8个排布：

```text
前4：文官
后4：武官
```

且已知：

```text
office ID 0x2C = 军师将军
```

与当前静态表中 ID 44 正好落在“五官中郎将层”的第5项（第一武官）一致。

因此对已命名 ID 0..79，可采用：

```ts
function classifiedOfficeType(officeId) {
  if (officeId >= 0 && officeId <= 3)
    return 0

  if ((officeId % 8) >= 4)
    return 1

  return 2
}
```

证据等级：

```text
classification behavior:
reverse-inferred-high

005FA650 complete opcode body:
open
```

第81个内部 office entry 不纳入这个推导。

---

## 4. 公共 hard gate：资格 helper + 真实忠诚90

对每个 candidate：

```asm
005FAF65 office
005FAF6A person
005FAF6B call 005FA4D0
005FAF70 test eax,eax
005FAF72 je reject
```

然后：

```asm
005FAF78 cmp byte ptr [person+AC],5A
005FAF84 jb reject
```

所以无论两种 score mode：

```ts
if (!isEligibleBy005FA4D0(person, office))
  reject

if (person.trueLoyalty < 90)
  reject
```

忠诚读取的是 `+0xAC` 原始 byte。

显示100但真实值>100不影响门槛；只要真实值≥90通过这一层。

`005FA4D0` 的完整 body 当前没有公开 TXT。已知研究注释只说它主要处理：

- 功绩；
- 所在；
- 状态；
- 以及其他任官资格。

因此不能把手工封官 UI 的所有条件擅自等同于 `005FA4D0`。

---

## 5. scoringModeFlag != 0：门槛 + 忠诚权重模式

第三参数非0时进入：

```text
005FAF98 ...
```

### 5.1 type 0：顶级四文官

```ts
base =
  leadership + intelligence

if (base < 150)
  reject

loyaltyTerm =
  9 * min(trueLoyalty - 90, 10)

score =
  base + loyaltyTerm
```

注意：

```text
>=150 合格
```

不是“必须 >150”。

忠诚项范围：

```text
90 -> +0
91 -> +9
...
100 -> +90
>100 -> 仍 +90
```

### 5.2 type 1：武官

资格能力门：

```ts
if (max(leadership, war) < 60)
  reject
```

但真正 score 不是 max：

```ts
score =
  leadership
  + war
  + 9 * min(trueLoyalty - 90, 10)
```

所以：

```text
threshold = max(统,武)
ranking   = 统+武
```

这两个必须分开。

### 5.3 type 2：普通文官

```ts
civil =
  max(intelligence, politics)

if (civil < 70)
  reject

score =
  civil
  + 9 * min(trueLoyalty - 90, 10)
```

这里 ranking 只取智/政较高值，不是智+政。

---

## 6. scoringModeFlag == 0：文武倾向模式

第三参数为0时跳到 `005FB070`。

先算：

```ts
martial =
  max(leadership, war)

civil =
  max(intelligence, politics)
```

### type 1 武官

```ts
if (martial < civil)
  reject

score = martial
```

即：

```text
martial >= civil
```

时才属于武官候选。

### type 0 / type 2 文官侧

对 type 0 和普通文官都是：

```ts
if (civil <= martial)
  reject

score = civil
```

因此平局：

```text
martial == civil
```

会：

```text
允许武官
拒绝文官
```

这是源码级 tie in **文武分类**，与最终候选 score tie 是两件不同的事。

### 这一模式没有忠诚加权

忠诚仍有公共：

```text
trueLoyalty >= 90
```

hard gate。

但通过后：

```text
没有 9*(loyalty-90)
```

这项。

---

## 7. 第三个参数不是“官职类型”

旧文档容易把：

```text
officeType
scoringModeFlag
```

混淆。

现在可以确定：

```text
officeType
= 005FA650(office)

scoringModeFlag
= 005FAF00 的第三栈参数
```

两者是两个独立变量。

因此以后查 caller 时应搜索：

```text
call 005FAF00 前第三个 push
```

而不是继续逆 `005FA650` 猜 mode。

---

## 8. flag 的业务语义仍不能假装已经恢复

从行为看，两个 mode 很像：

```text
flag != 0:
  更严格的 AI-like quality score
  + 能力下限
  + 忠诚90~100权重

flag == 0:
  只做文武倾向 partition
  不做忠诚加权
```

而 SIRE v1.26 的公开更新说明也明确存在：

```text
电脑自动封官的规则可设定
```

这与非0分支的“忠诚/能力门槛”非常吻合。

但当前公开 IDB 导出没有 xref/caller 上下文，所以仍不能正式写：

```text
flag=1 一定是 AI
flag=0 一定是 玩家自动按钮
```

当前正确命名：

```text
weightedThresholdMode
roleAffinityMode
```

caller meaning：

```text
open
```

来源交叉：
- https://games.sina.com.cn/d/e/pc/140457.shtml
- https://patch.ali213.net/showpatch/18430.html

---

## 9. 最终 score tie-break：005FAF00 本身已经 exact

初始化：

```text
bestScore = INT_MIN
bestPerson = null
```

每个 candidate 算出 `score` 后：

```asm
005FB0BA cmp [bestScore],edi
005FB0BE jnl 005FB0C8
005FB0C0 bestScore = score
005FB0C4 bestPerson = person
```

这里：

```text
jnl
= bestScore >= candidateScore 时不替换
```

因此：

```ts
if (candidateScore > bestScore) {
  best = candidate
}
```

而不是：

```ts
if (candidateScore >= bestScore)
```

所以：

```text
相同 score
→ 先被迭代到的人获胜
```

这条 tie-break 已经是源码级 exact。

---

## 10. 真正未知的是 caller list order

因为候选列表是 arg1，由 caller 传入：

```text
005FAF00 自己不排序候选列表
005FA650 也不生成候选列表
```

所以最终同分结果为：

```text
first-in-caller-list wins
```

但：

```text
caller list 是按 personId？
按当前所属？
按功绩？
按某个 PersonList 原生顺序？
先军团后城市？
```

当前都没有 xref 证据。

因此不要再写：

```text
同分 -> personId 小者
```

也不要写：

```text
同分 -> 功绩高者
```

除非后续恢复 caller 的 list construction。

---

## 11. “功绩高者自动拿高官”为什么只是表象

`005FA4D0` 会先做官职资格，其中功绩门槛已经确定为：

```text
officeTier * 4000
```

因此高功绩武将有资格竞争更高官。

但进入 `005FAF00` 之后：

```text
weighted mode:
  分数看能力 + 忠诚

affinity mode:
  分数看文武侧能力
```

并没有：

```text
score += merit
```

所以玩家观察到“高功绩容易拿大官”，主要是：

```text
功绩 = qualification gate
而不是 final ranking score
```

这比“自动封官就是按功绩排序”更接近原程序。

---

## 12. 当前推荐实现

### named office classifier

```ts
function getNamedOfficeType(officeId: number) {
  if (officeId >= 0 && officeId < 4)
    return "top-civil"

  if (officeId >= 0 && officeId < 80) {
    return (officeId % 8) >= 4
      ? "military"
      : "civil"
  }

  return "unknown"
}
```

### selector

```ts
function selectOfficeCandidate(
  candidates,
  office,
  mode
) {
  let best = null
  let bestScore = Number.MIN_SAFE_INTEGER

  for (const person of candidates) {
    if (!eligible005FA4D0(person, office))
      continue

    if (person.trueLoyalty < 90)
      continue

    const score =
      mode === "weighted-threshold"
        ? scoreWeighted(person, office)
        : scoreAffinity(person, office)

    if (score === null)
      continue

    if (score > bestScore) {
      bestScore = score
      best = person
    }
  }

  return best
}
```

重要：

```text
candidates 的输入顺序必须由 ruleset/caller profile 保留
```

不要在 selector 内自行 `.sort(personId)`，否则会把尚未恢复的 caller tie-break 写死。

---

## 13. fallback 边界

在 caller xref 恢复前：

### fidelity core

可以直接实现：

- `005FA4D0` 作为可替换 qualification callback；
- 忠诚<90拒绝；
- 两种 score mode 完整闭式；
- exact first-wins tie；
- named office type 映射。

### compatibility caller profile

如果引擎需要先有一个 deterministic caller：

```ts
candidateOrder =
  stablePersonIdAscending
```

但必须标：

```text
provisional caller-order fallback
```

不能把这个顺序说成原作。

第三参数建议显式：

```ts
scoringMode:
  "weighted-threshold"
  | "role-affinity"
```

禁止用模糊的：

```ts
isAI: boolean
```

直到 caller xref 闭合。

---

## 14. 当前剩余 exactness gap

### 已闭合 / 收紧

- `005FAF00` 三个参数的角色；
- `005FA650` 是 office classifier，不是 candidate-list generator；
- officeType 与 scoringModeFlag 分离；
- true loyalty <90 公共 hard gate；
- weighted mode 三类官职完整 threshold / score；
- 武官 threshold 用 max(统,武)，score 用统+武；
- 普通文官 threshold/score 用 max(智,政)；
- 顶级四文官要求统+智 >=150；
- loyalty bonus 精确为 `9*min(loyalty-90,10)`；
- affinity mode 的文武分流；
- martial==civil 时武官侧胜出；
- 最终 candidate score tie 精确为 first-in-list wins；
- merit 不进入 `005FAF00` final score；
- 旧“005FA650 生成/排序候选”说法撤回。

### 仍 open

1. `005FA4D0` 完整函数体；
2. `005FA650` 完整 opcode（虽然 named office 分类结果已高置信恢复）；
3. 哪些 caller 调 `005FAF00`；
4. 各 caller 传入的 candidate-list 构造 / 顺序；
5. 第三参数在每个 caller 的业务含义；
6. 第81个 internal office entry 如何分类；
7. 自动连续分配多个官职时，已分配者如何从后续 candidate list 移除；
8. 官职遍历顺序是否严格 officeId 0→79；
9. Vanilla / PS2 / Wii 差异。

状态：

```text
P0-8-audit-complete
selector-scoring-exact
selector-final-tie-exact
office-classifier-role-corrected
candidate-list-generator-attribution-corrected
caller-list-order-open
qualification-helper-open
mode-caller-mapping-open
```

## 15. 来源

逆向：
- https://github.com/sjn4048/311MemoryResearch/blob/master/内存资料/函数[自动封官].txt
- https://github.com/sjn4048/311MemoryResearch/blob/master/内存资料/地址资料.txt
- https://github.com/sean2077/311SireCustomizedPackageDev/blob/dev/material/结构体汇总.md
- https://github.com/fudanglp/311resource/blob/master/extractor/ida/data/python_idb/san11pk_dump.exe_functions.csv

静态官职：
- https://w.atwiki.jp/sangokushi11/pages/111.html

SIRE 历史交叉：
- https://games.sina.com.cn/d/e/pc/140457.shtml
- https://patch.ali213.net/showpatch/18430.html
