# E17 地形伤害随机值

更新：2026-10-01。主目标：PC-PK1.1 栈道、毒泉、落石的伤害随机值与减免边界。

## 1. 本轮结论

E17 把旧的粗略 terrain-hazard fallback 拆成三个独立来源：

```text
栈道：移动进入该格时逐格结算
毒泉：移动进入该格时逐格结算
落石：地图陷阱触发后沿路径结算
```

旧值：

```text
毒泉固定1000兵 + 气力-5
栈道300~500
落石1000~2000 + 30%混乱
踏破落石减半
```

全部撤回。

PC-PK1.1 当前最佳规则：

```text
栈道：100..299 / 每进入一格
毒泉：200..399 / 每进入一格
落石对部队：1500..1999（参数级直接还原）
落石对建筑：800..1799（参数级直接还原）
踏破对落石：×0.1
落石固定混乱：无证据，不附加
```

其中栈道/毒泉是源码级随机区间；落石仍保留一个很小的 finalizer gap，见第7节。

## 2. 随机函数

SIRE 地址表确认：

```text
00472150 GetRandomX(X)
返回 0 .. X-1
```

因此：

```text
GetRandomX(200) -> 0..199
GetRandomX(500) -> 0..499
GetRandomX(1000) -> 0..999
```

这是把“固定基本值 + 变动范围”恢复成闭区间的关键。

## 3. 栈道

### 3.1 地址

```text
005AE58D  栈道 terrain 11 行军损伤
005AE597  踏破(6)
005AE5A4  难所行军(17)
005AE5C6  固定基本伤害 100
005AE5AF  附加变动范围 200
```

### 3.2 精确区间

```ts
function plankDamage(unit) {
  if (
    unit.hasSkill(TRAVERSE)
    || unit.force.hasTech(DIFFICULT_MARCH)
  ) {
    return 0
  }

  return 100 + GetRandomX(200)
}
```

即：

```text
100..299
```

### 3.3 触发时机

这是**逐格移动损伤**：

```text
进入一格栈道
→ 判断踏破 / 难所行军
→ 生成本格损伤
→ 扣兵
```

不是：

```text
站在栈道上每旬扣一次
```

### 3.4 免伤

PC-PK1.1：

```text
踏破：0伤
难所行军：0伤
```

日文 Wiki 也把踏破写为栈道无损；PK 技巧资料明确难所行军通过栈道时不受伤害。

## 4. 毒泉

### 4.1 地址

```text
005AE588  毒泉 terrain 4 行军损伤
005AE5D9  解毒(8)
005AE5F8  固定基本伤害 200
005AE5E2  附加变动范围 200
```

### 4.2 精确区间

```ts
function poisonSpringDamage(unit) {
  if (unit.hasSkill(ANTIDOTE)) {
    return 0
  }

  return 200 + GetRandomX(200)
}
```

即：

```text
200..399
```

同样是**每进入一格**结算。

### 4.3 解毒

```text
解毒 -> 毒泉伤害0
```

日文 Wiki 对此也明确写为“防止毒泉伤害”。

### 4.4 删除“气力-5”

当前地址研究完整列出了：

- 毒泉 terrain 分支；
- 固定兵损200；
- 随机范围200；
- 解毒判断。

没有毒泉独立气力扣减常量。

同一地址表对扫荡-5、威风-20等气力变化都会明确列出数值地址，因此当前采用：

```text
poisonSpring.energyDamage = 0
```

证据等级：

```text
negative-evidence-high
```

意思是“不添加额外气力伤害”，不是声称找到了一个写死的0常量。

## 5. 落石

### 5.1 专用参数

```text
005B16D2  对部队固定基本威力 1500
005B16D7  对部队附加变动范围 500

005B171D  对建筑固定基本威力 800
005B1722  对建筑附加变动范围 1000

005B1844  对部队伤害资料指标
005B1864  对建筑伤害资料指标
```

2008 内存研究明确注明这些地址对应**繁中 PK1.1**。

### 5.2 当前 fidelity 还原

基于专用参数和共用随机函数：

```ts
function rockfallTroopDamage() {
  return 1500 + GetRandomX(500)
  // 1500..1999
}

function rockfallBuildingDamage() {
  return 800 + GetRandomX(1000)
  // 800..1799
}
```

这一级别标记为：

```text
reverse-engineered-parameters / reconstructed-finalizer
```

而不是“完整函数逐指令已恢复”。

社区实测出现过对高统率部队造成1725兵损，位于该区间内，和参数还原相容。

## 6. 踏破对落石

地址：

```text
005B17C0  踏破
005B17CF  落石/火陷阱伤害降至0.1
```

对本项落石：

```ts
if (unit.hasSkill(TRAVERSE)) {
  damage = trunc(rawDamage * 0.1)
}
```

等价于整数模型中的约：

```text
150..199
```

对于 raw=1500..1999。

因此旧：

```text
踏破落石减半
```

必须撤回。

日文 Wiki 也明确写“落石/火罠伤害减轻”，社区实测通常概括为约90%减伤。

## 7. 落石仍有一个小型 exactness gap

同一逆向资料还列出：

```text
005B1632
全陷阱（含落石）对部队与耐久固定基本伤害 50
```

但当前公开资料没有把完整 `GetTrapDamage` 函数体文本化。

所以仍不能100%回答：

```text
这个共通50
是否在落石专用1500/800之外再次独立叠加？
如果参与，具体整数顺序在哪里？
```

因此 E17 不把落石写成“函数体逐指令 confirmed”。

当前实现继续使用最直接的专用参数：

```text
部队 1500 + Random(0..499)
建筑 800 + Random(0..999)
```

并显式保存：

```text
rockfallCommonBase50Finalizer = unresolved
```

如果以后取得完整函数体，只需替换这一 finalizer，不需要推翻专用参数。

## 8. 落石不附加固定30%混乱

旧 fallback：

```text
rockfall.confusionChance = 30%
```

没有可靠原作依据。

逆向资料对已知混乱来源会明确记录独立概率，例如：

- 业火种50%；
- 火船25%；
- 石兵八阵；
- 螺旋突。

落石参数区只有部队/建筑伤害，没有对应混乱常量。

因此 fidelity：

```text
rockfall.confusionChance = 0
```

标签：

```text
negative-evidence-high
```

若将来完整落石函数显示状态分支，再更新。

## 9. 强制位移与逐格地形伤害

栈道/毒泉属于 terrain-entry damage。

因此引擎设计上，应让“正常移动”和“被战法强制移动”最终都经过同一个：

```ts
resolveTerrainEntryDamage(unit, enteredCell)
```

而不是只在玩家主动移动时扣伤。

玩家资料长期观察到把敌人推入毒泉可以造成毒泉伤害，这与上述服务化模型一致。

不过“每一种位移战法的中间格/终点格是否全部触发”的逐 caller 顺序仍可作为更细的实现测试，不影响基础随机区间。

## 10. 版本边界

### PC-PK1.1

```text
栈道/毒泉：
reverse-engineered

落石专用参数：
reverse-engineered

落石最终公式：
reconstructed from parameters
```

### Vanilla

2006 同期资料已确认机制层：

- 栈道有通行损伤；
- 踏破防/减栈道损伤并减轻落石；
- 解毒防毒泉；
- 难所行军影响栈道损伤。

但早期资料对“难所行军”有“降低”和“无伤”的文字差异。

因此在取得 Vanilla EXE 前：

```text
Vanilla 复用 PK1.1 常量
= compatibility-assumption
```

不可把100/200/1500/800标成 Vanilla 源码事实。

### PS2/Wii

继续 open。

## 11. E17 关闭与保留边界

### 已关闭

- 栈道随机兵损：100..299；
- 毒泉随机兵损：200..399；
- 栈道/毒泉按进入格逐次结算；
- 踏破、难所行军、解毒的 PC-PK1.1 基础免伤边界；
- 毒泉“固定1000 + 气力-5”旧模型；
- 栈道“300～500”旧模型；
- 落石专用1500/500、800/1000参数；
- 踏破对落石约×0.1；
- 固定30%落石混乱旧 fallback。

### 仍 open

1. 落石完整 finalizer 中共通基本50的确切参与位置；
2. 落石多目标逐格结算顺序；
3. 强制位移经过多格危险地形时的逐 caller 触发顺序；
4. Vanilla / PS2 / Wii 常量等价性。

## 12. 来源

PC-PK1.1 内存地址：
- https://game.ali213.net/thread-2168294-1-1.html

随机函数：
- `311SireCustomizedPackageDev/material/内存地址汇总.md`

Wiki 机制交叉：
- https://w.atwiki.jp/sangokushi11/pages/13.html
- https://w.atwiki.jp/sangokushi11/pages/149.html

PK难所行军：
- https://www.gamersky.com/handbook/200806/114545_2.shtml

落石实测：
- https://www.sohu.com/a/394347085_100186910
