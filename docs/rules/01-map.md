# 地图、地形、移动、港关与水战

## 1. 世界地图

### 原作底层拓扑

`[PC-PK1.1][reverse-engineered]`

原地图不是抽象的42城图，而是固定的六角格战场：

```text
200 × 200 = 40,000 格
struct_map_grid size = 0x14 bytes
base = 06FB0E68
```

坐标打包：

```ts
x = packedCoord & 0xffff
y = packedCoord >> 16
index = x * 200 + y
gridAddress = 0x06FB0E68 + index * 0x14
```

`地形研究.txt` 的实地址样本与 `x*200+y` 完全吻合。原程序另外存在：

- `00483A50 GetAdjacentCoordinateInDirection`：六方向邻格；
- `00483DB0 AreCoordinatesAdjacent`：六角格邻接；
- `008E8970 CalcHexGridDistance`：六角距离。

现代原作兼容实现将布局标记为 odd-q；该点目前为 `reimplementation-high`，待直接展开 `00483A50` 函数体后可升级为逐指令确认。

### 地图格 → 城市领域

`struct_map_grid + 4` 的低5位是 terrain ID；其余相关 bit 中取出一个 7-bit area code：

```ts
terrainId = gridInfo & 0x1f
areaCode = (gridInfo >> 5) & 0x7f
cityId = Tbl_GridToCityID[areaCode]
```

`0079C2B0 Tbl_GridToCityID` 长96项，因此 areaCode 与42城是多对一映射；不能用“最近城市”或简单 flood-fill 猜原作领域。

城市结构本身另外保存最多6个 `AdjacentCities`，这是战略城市邻接图，和40,000格六角邻接、逐格城市领域是三层不同数据。

当前 repo 的 `docs/sources/cities.json.neighbors` 只覆盖“城市战略邻接图”。真正仍缺的是原作40,000格的 terrain/areaCode/特殊flag 静态数据 dump。

地图格已逆出的字段/bit 至少包括：

- 占用类型（空/部队/建筑）；
- terrain ID；
- area code；
- 内政用地 flag；
- 地图格对象 ID；
- 着火、落石等状态位。

因此本项的缺口已经从“地图规则未知”收缩为“静态地图数据未导入”。

## 2. 地形战法可用性

### 底层机制

`[PC-PK1.1][reverse-engineered]`

原程序不是用一个“兵种×地形”的硬编码二维表直接决定战法。

`struct_equipment`：

```text
+78 Tactics[32]   // 兵装能否使用32种战法
```

`struct_tactic`：

```text
+31 MinRange
+32 MaxRange
+33 ToTroop
+34 ToEngineerEquipment
+35 ToShip
+36 ToBuilding
+38 TacticOnTerrains   // 32-bit terrain mask
+3C NecessaryUnitBranch
```

并存在：

- `0047EE30 CheckEquipTactic`
- `0090E550 CheckTroopTactic`

因此 fidelity 规则应理解为：

```text
兵装是否拥有该战法
×
目标类型是否合法
×
战法 terrain bit 是否允许目标地形
×
适性/部队条件
×
特技/技巧例外
```

下面的表只是常用陆军战法的**人类可读汇总**，不是唯一权威数据源。

### 常用陆军汇总

`[COMMON][empirical-high; reverse-engineered structure]`

| 地形 | 枪 | 戟 | 骑 | 弩 |
|---|---:|---:|---:|---:|
| 草地/土/本道/荒地 | ○ | ○ | ○ | ○ |
| 砂地 | × | ○ | ○ | ○ |
| 湿地 | ○ | ○ | × | ○ |
| 毒泉 | ○ | ○ | × | ○ |
| 森 | ○ | ○ | × | × |
| 栈道 | ○ | ○ | × | ○ |
| 间道 | ○ | ○ | ○ | ○ |
| 渡 | ○ | ○ | ○ | ○ |
| 浅滩 | ○ | ○ | **冲突证据** | ○ |

当前最佳证据倾向于：战法地形检查主要看**目标格**。Wiki 的个别“枪兵看自己所在格”描述与其兵科页和其他长期实测冲突，暂不作为源码规则。

“射手”是明确的 terrain override：允许弩兵对森林目标使用弩兵战法。骑射/白马属于额外弓箭攻击能力，不等于解除骑兵突击/突破/突进的森林等禁区。

### 仍有一个小型 exactness gap

“骑兵能否对浅滩目标使用骑兵战法”在同一日文 Wiki 内部存在互相矛盾的表述。当前更倾向 **不可**，但在取得原 `TacticOnTerrains` 对应位或实机 golden test 前保留 `conflicting-evidence`，不得标 confirmed。

## 3. 地形移动成本

### 原算法

`[PC-PK1.1][reverse-engineered]`

原函数 `计算部队进入某地格消耗的移动力` 直接读取目标格 terrain，并按：

```ts
equipmentId * 32 + terrainId
```

查询 `struct_equipment.MoveConsumptions[32]`。

只有目标 terrain 为：

```text
7 = 河
8 = 海
```

时调用 `00495490 GetNavalMobilityEquipID`；其他 terrain 调用 `00495480 GetLandMobilityEquipID`。

运输队没有独立成本表：

- 陆地运输强制使用兵装0“剑”的移动消耗；
- 水上运输强制使用兵装9“小船/走舸”的移动消耗。

目标格着火时：

```ts
moveCost *= 4
```

这是精确的位移 `<< 2`，不是 +4。

### 标准移动成本

| 地形 | 剑 | 枪/戟/弩 | 骑 | 兵器 | 输送 | 舰船 |
|---|---:|---:|---:|---:|---:|---:|
| 都市/关/港 | 4 | 4 | 4 | 4 | 4 | - |
| 本道/渡 | 4 | 4 | 4 | 4 | 4 | - |
| 土 | 5 | 5 | 4 | 5 | 5 | - |
| 草地/砂地 | 5 | 5 | 5 | 6 | 5 | - |
| 荒地 | 6 | 6 | 7 | 7 | 6 | - |
| 湿地 | 8 | 8 | 8 | 8 | 8 | - |
| 森 | 6 | 6 | 10 | 8 | 6 | - |
| 浅滩 | 5 | 5 | 5 | 5 | 5 | - |
| 栈道 | 6 | 6 | 7 | 6 | 6 | - |
| 间道/小径 | 6 | 6 | 10 | 10 | 6 | - |
| 毒泉 | 12 | 12 | 12 | 12 | 12 | - |
| 河/海 | - | - | - | - | 4 | 4 |
| 川/岸/崖 | 不可 | 不可 | 不可 | 不可 | 不可 | 不可 |

小径步兵使用 6；早期个别中文实测写7，与后期原作数据重建和日文表冲突，当前采用6。

### 设施格纠错

不要写“设施格统一移动消耗4”。

移动成本函数不检查格上是否存在阵、砦、箭楼、投石台等玩家设施，只读取**底层 terrain ID**与着火 flag。因此：

```text
砂地上的箭楼仍按砂地成本
森林里的设施仍按森林成本
```

“都市/关/港”为4，是因为它们本身就是独立 terrain type；不是“有建筑所以4”。

敌我设施是否允许穿越属于路径合法性/ZOC等另一层规则，不应混进 terrain cost。

来源：
- 311MemoryResearch `函数[计算部队进入某地格消耗的移动力].txt`
- 311SireCustomizedPackageDev `struct_equipment.MoveConsumptions`
- https://w.atwiki.jp/sangokushi11/pages/91.html
- https://w.atwiki.jp/sangokushi11/pages/149.html

## 4. 总移动力与加成叠加

`[PC-PK1.1][reverse-engineered]`

原函数 `00496570 计算部队属性` 在同一条属性计算链中完成基础移动力、技巧修正与行军特技修正。这里的“总移动力”与上一节“进入某地格消耗多少移动力”是两套独立数值。

### 4.1 基础移动力

基础值来自当前行军兵装的 `struct_equipment +0x57 Mobility`。

常用基线：

| 行军兵装 / 部队 | 基础移动力 |
|---|---:|
| 剑兵 | 20 |
| 枪 / 戟 / 弩 | 22 |
| 骑兵 | 28 |
| 冲车 / 井阑 / 投石 / 木兽 | 18 |
| 走舸 | 16 |
| 楼船 / 斗舰 | 20 |
| 运输队陆上 | 25 |
| 运输队水上 | 21 |

运输队的 25 / 21 不是独立装备表值：原函数在剑兵或小船基础移动力上无条件再加 5。

### 4.2 技巧修正

原汇编先处理势力技巧，再处理武将特技，全部是**整数直接加法**，不是百分比。

| 技巧 | 条件 | 修正 |
|---|---|---:|
| 精锐枪兵 | 枪兵 | +6 |
| 精锐戟兵 | 戟兵 | +6 |
| 精锐弩兵 | 弩兵 | +6 |
| 出产良马 | 骑兵 | +4 |
| 精锐骑兵 | 骑兵 | +2 |
| 强化车轴 | 兵器 | +4 |
| 木牛流马 | 运输队，陆/水均适用 | +3 |

因此：

```text
枪/戟/弩：22 → 28
骑兵：28 → 32（出产良马）→ 34（精锐骑兵）
兵器：18 → 22
运输陆上：25 → 28
运输水上：21 → 24
```

原代码地址：

- `00496A95 / 00496AA9 / 00496ABD`：精锐枪/戟/弩各 +6；
- `00496AD1`：精锐骑兵 +2；
- `00496AE2`：出产良马；
- `00496AE6`：强化车轴；
- 原始 `00496AF3-00496AF6`：出产良马/强化车轴 +4；
- `00496B38-00496B49`：运输队基础 +5，木牛流马额外 +3。

### 4.3 行军特技修正

| 特技 | 条件 | 修正 |
|---|---|---:|
| 强行 | 陆上剑/枪/戟/弩/骑，兵器与运输除外 | +5 |
| 长驱 | 陆上骑兵 | +3 |
| 搬运 | 运输队，陆/水均适用 | +5 |
| 操舵 | 水上部队，运输也适用 | +4 |
| 飞将 / 遁走 | 陆上 ZOC 规则，不增加移动力 | +0 |
| 推进 | 水上 ZOC 规则，不增加移动力 | +0 |

原特技 ID 分支：

- `02 = 强行`
- `03 = 长驱`
- `05 = 操舵`
- `07 = 搬运`

### 4.4 重要：强行与长驱不叠加

骑兵分支的原代码顺序是：

```text
先检查强行
有强行 → +5 → 跳过长驱

没有强行
↓
再检查长驱
有长驱 → +3
```

所以同时拥有“强行”和“长驱”的骑兵只取得：

```text
+5
```

而不是：

```text
+5 +3
```

这不是“同特技不叠加”的一般规则，而是骑兵移动力函数本身明确设置了优先级：**强行覆盖长驱**。

例如全骑兵技巧完成：

```text
基础 28
+ 出产良马 4
+ 精锐骑兵 2
= 34

仅长驱：37
仅强行：39
强行 + 长驱：仍为39
```

### 4.5 搬运与操舵明确可以叠加

运输队走的是独立分支：

```text
当前行军兵装基础移动力
+ 运输队固定5
+ 木牛流马3（如有）
+ 搬运5（如有）
↓
如果当前处于水上
+ 操舵4（如有）
```

因此全部条件满足时：

```text
陆上运输：
20 +5 +3 +5 = 33

水上运输：
16 +5 +3 +5 +4 = 33
```

“搬运 + 操舵”在 PC/CS PK 的社区实测也长期确认可以同时生效。

### 4.6 技巧与特技之间是加法叠加

技巧修正先写回移动力，随后才进入特技检查，所以：

```ts
movement =
  equipmentBase
  + transportBaseAdjustment
  + technologyBonus
  + applicableMarchSkillBonus
  + applicableNavalSkillBonus
```

没有百分比乘算，因此不存在技巧/特技之间的取整顺序问题。

### 4.7 陆水状态决定哪些特技生效

- 强行/长驱属于陆上分支；进入水上、当前行军兵装切换为舰船后不继续提供其陆上加成。
- 操舵只在“当前为水上队”时 +4。
- 搬运与木牛流马属于运输队自身修正，因此陆上与水上都保留。
- 水上运输最后还能再叠加操舵。

来源：
- 311MemoryResearch `函数[计算部队属性].txt`
- https://www.gamersky.com/handbook/200809/124090.shtml
- https://w.atwiki.jp/sangokushi11/pages/91.html
- https://w.atwiki.jp/sangokushi11/pages/13.html
- https://w.atwiki.jp/sangokushi11/pages/90.html

## 5. ZOC

### 5.1 基本定义与效果

`[COMMON][empirical-high]`

ZOC（Zone of Control）不是额外增加某格的 terrain move cost，而是**进入敌方控制格后立即终止本回合继续移动**。

长期实测描述为：

```text
敌方部队 / 会产生ZOC的敌方设施
        ↓
其相邻六角格（最多6格）
        ↓
敌军进入其中任一格
        ↓
该格正常 terrain cost 仍照常计算
        ↓
本回合剩余移动力失效，不能继续从该格向外扩展
```

所以不要实现成：

```ts
moveCost += zocPenalty
```

更接近：

```ts
payTerrainCost(targetCell)

if (targetCell.isEnemyZOC && !ignoreZOC) {
  stopFurtherMovementThisAction()
}
```

2008 年中文移动力专项明确写“移动力消耗不变，但一进入这些格子当前回合移动力自动归0”；日文 FAQ 也说明即使尚有剩余移动力也会在 ZOC 格被迫停止。

### 5.2 ZOC 来源

`[COMMON][empirical-high]`

正常敌部队会向相邻六格形成 ZOC。

大多数有所属势力的军事/支援设施同样形成 ZOC，例如：

- 阵 / 砦 / 城塞；
- 弓橹 / 连弩橹 / 投石台；
- 军乐台 / 太鼓台；
- 石兵八阵等有所属设施；
- 城市、港、关等敌方据点按同类“敌方建筑/设施”控制逻辑处理。

但下面这些**阻挡物/陷阱没有 ZOC**：

- 土垒；
- 石墙；
- 火种 / 火炎种 / 业火种；
- 火球 / 火炎球 / 业火球等火陷阱。

它们是否能直接穿越属于“格子可通行性”问题，而不是 ZOC。比如土垒会堵格但不向周围扩散 ZOC；火陷阱不靠 ZOC 阻止移动。

日文战争页明确总结：“各类设施会产生ZOC，但土垒、石壁、火罠不产生ZOC”。

### 5.3 PC-PK1.1 ZOC 原参数

`[PC-PK1.1][reverse-engineered-parameters]`

繁中 PK1.1 已有精确地址：

```text
005A369D  陆上 ZOC 开关，原值 1
005A36A4  水上 ZOC 开关，原值 1

005A36B8  陆上 ZOC 无视适用的兵装范围，原值 4
           0..4 = 剑/枪/戟/弩/骑
           5 才会进一步包含兵器范围

005A36BE  飞将（特技0）
005A36CB  遁走（特技1）
005A36D7  命中上面条件后关闭本部队受到的陆上 ZOC

005A36DE  推进（特技4）
005A36EB  命中后关闭本部队受到的水上 ZOC
```

这证明原程序把**陆上 ZOC 与水上 ZOC 分成两个独立开关/分支**，不是一个全局 `ignoreZOC` bool。

来源：
https://game.ali213.net/thread-2168294-1-1.html

### 5.4 飞将 / 遁走 / 推进的边界

`[PC-PK1.1][reverse-engineered-parameters + empirical-high]`

- **飞将**：陆上 ZOC 无视 + 其他战法会心效果；ZOC 部分与遁走共享陆上分支。
- **遁走**：陆上 ZOC 无视。
- **推进**：水上 ZOC 无视。
- 飞将/遁走的原陆上范围上限排除攻城兵器，因此兵器部队不能靠这两个特技穿过陆上 ZOC。
- 水军状态下飞将/遁走不负责水上 ZOC；需要“推进”。
- 运输队在陆上按剑兵行军形态处理，因此“遁走”效果仍可生效；Wiki 对飞将也明确说明运输队时只保留其中的“遁走/ZOC无视”部分。
- 运输队进入水上后若要忽略水上 ZOC，应走“推进”分支。

因此引擎最好拆成：

```ts
ignoreLandZOC
ignoreWaterZOC
```

而不是：

```ts
ignoreZOC
```

### 5.5 混乱：ZOC 明确消失

`[COMMON][empirical-high]`

长期实测、日文攻略和关卡攻略一致：

> 混乱部队不形成 ZOC。

因此可以直接实现：

```ts
if (sourceTroop.status === CONFUSED) {
  sourceTroop.emitsZOC = false
}
```

这也是“先扰乱前排，再让后续部队穿过敌阵”的常见战术基础。

### 5.6 伪报：当前存在来源冲突

`[COMMON][conflicting-evidence]`

这一点不能冒充已锁定：

- 2008 年中文“一兵流/移动力”研究写：敌军处于**混乱、伪报**时均不产生 ZOC。
- 日文三国志11攻略 Wiki 的“战争”页却明确区分：
  - 混乱：ZOC 消失；
  - **伪报：ZOC 仍保留**。
- 多个实际战报利用“对敌伪报后，再用我方部队/设施的 ZOC 限制其撤退路线”，证明伪报不会让被伪报部队“免疫别人 ZOC”，但这仍不能单独证明它自己是否继续向周围发出 ZOC。

目前公开的 `005A36xx` 参数只确认陆/水 ZOC 与无视特技，没有恢复“异常状态 → 是否发出ZOC”的那一小段判断，因此保留 exactness gap。

为了引擎可运行，当前建议默认：

```ts
falseReportRetainsZOC = true
```

并明确标记：

```text
provisional-engine-rule / compatibilityAssumption
```

理由仅是日文长期攻略对此有更明确的逐状态区分；未来一旦取得原状态分支反汇编或可靠实机 A/B 实验，立即替换。

### 5.7 ZOC 与实体阻挡是两回事

即使某部队能够无视 ZOC：

- 仍不能穿过实际不可通行地形；
- 仍不能穿过被敌方实体真正占用、且规则不允许穿越的格子；
- 被六个实体完全包围时，飞将/遁走也不会“穿模”越过占用格。

同理，混乱导致 ZOC 消失也只代表**相邻控制区消失**，该敌部队自己占着的那一格仍是实体阻挡。

### 5.8 当前 fidelity 模型

```ts
function emitsZOC(source) {
  if (source.isTroop) {
    if (source.status === CONFUSED) return false

    // 待原函数回归确认
    if (source.status === FALSE_REPORT)
      return falseReportRetainsZOC

    return source.isHostileActiveUnit
  }

  if (source.isBuilding) {
    if (source.kind in [
      EARTH_WALL,
      STONE_WALL,
      FIRE_TRAP
    ]) return false

    return source.isHostileOwnedZOCFacility
  }

  return false
}

function stopsOnZOC(mover, targetCell) {
  if (!targetCell.inEnemyZOC) return false

  if (targetCell.isWater)
    return !mover.ignoreWaterZOC

  return !mover.ignoreLandZOC
}
```

证据来源：
- https://game.ali213.net/thread-2168294-1-1.html
- https://www.gamersky.com/handbook/200809/124600.shtml
- https://w.atwiki.jp/sangokushi11/pages/8.html
- https://w.atwiki.jp/sangokushi11/pages/13.html
- https://w.atwiki.jp/sangokushi11/pages/85.html

## 6. 高度与高低差

### 6.1 规则作用范围

`[PC-PK中心][empirical-high / reverse-engineered-function-known]`

原程序已经定位到 `005AF850 TacticSuccessRate`（战法成功率函数），而 SIRE/长期逆向资料一致表明：**高低差不是全局攻防倍率**，主要作用于会强制改变双方位置的若干陆战战法成功率。

受高低差影响：

- 枪兵：突刺、二段突；
- 戟兵：熊手；
- 骑兵：突击、突破、突进。

不受这层高低差修正：

- 螺旋突；
- 横扫、旋风；
- 弩兵贯射/乱射；
- 攻城兵器常规战法；
- 水军常规战法。

火矢会受“目标地形类型”影响点火/战法成功率，但那是 terrain type 修正，不是本节的 elevation 修正。

### 6.2 有利方向

稳定结论：

```text
枪兵 / 骑兵：
攻击者地势越高越有利

熊手：
攻击者地势越低越有利
```

即：

```ts
// 概念方向，不代表已经锁定完整闭式
spearOrCavalryBonus ∝ attackerElevation - defenderElevation
hookBonus           ∝ defenderElevation - attackerElevation
```

### 6.3 “行动开始位置”而不是“发动位置”

这是最容易做错的一点。

日文长期实测明确指出：

> 高低差判定使用该部队**本次行动开始前所在格**，不是移动之后实际发动战法的格子。

所以不能写：

```ts
heightDiff =
  currentAttackCell.height - targetCell.height
```

更接近：

```ts
heightDiff =
  actionStartCell.elevationClass - targetCell.elevationClass
```

例如部队从坡下移动到坡上再突击，UI 成功率仍可能保留“坡下开局”对应的不利修正。

因此部队一次行动至少需要保留：

```ts
troop.actionStartCoord
```

直到该次行动结束。

### 6.4 数值关系：旧“每级固定 ±5%”需要降级

当前文档以前写“每级 ±5%”，这只能作为近似摘要，不能继续标精确公式。

多组 PCPK 实测稳定支持：

- 有利高差 1 级：常见 +5%；
- 有利高差 2 级：常见 +10%；
- 不利方向对枪/骑会降低成功率；
- 熊手方向相反。

但针对**二段突 / 突进**，存在稳定实测：

```text
高差2级时可达到 +15%
```

而不是简单 +10%。

社区深入测试将地势大致分类为：

```text
凹地 ≈ -1
平地 ≈  0
凸地 ≈ +1
坡地 ≈ +2
```

并观察到城池格在部分场景按“凸地”处理。

因此当前不能用一个无条件：

```ts
bonus = 5 * (attackerHeight - defenderHeight)
```

替代原作。

### 6.5 目前最安全的 fidelity 接口

在完整 `005AF850` 高低差子分支尚未逐指令恢复前，应保留离散 hook：

```ts
getElevationTacticModifier({
  tacticId,
  actionStartCell,
  targetCell,
  displacementDestinationCells
})
```

而不是把高度直接乘进普通战斗伤害。

当前建议数据层至少允许：

```ts
interface TacticalElevation {
  class: -1 | 0 | 1 | 2
}
```

但这个 `-1/0/1/2` 分类目前来自高质量实测整理，**尚未确认就是原二进制直接存储的字段值**。

### 6.6 原始高度数据存储位置仍未锁定

这里要纠正旧文档的“地图格包含高度”。

已公开的 `struct_map_grid` 目前明确命名的部分只有：

- terrain / area；
- 占用对象；
- 内政用地；
- 着火/陷阱等 flag。

它**没有一个已经被 SIRE 结构体资料明确命名为 Height 的字段**。

现代原作兼容实现是从地图几何/高度场读取每格中心高度来渲染，但这不能反推原作逻辑一定把 elevation class 直接存进 `struct_map_grid`。

所以当前应区分：

```text
规则层：高低差确实参与部分战法成功率 —— 已确认
静态数据层：每格原始 elevation class / 高度值存在哪里 —— 仍 open
```

这也是 N1“全地图坐标/地形/高度静态数据”后续仍必须导出的原因。

### 6.7 高低差不应直接影响普通攻击伤害

目前没有可靠原版证据支持：

```text
站得更高 → 普攻伤害统一增加
站得更高 → 防御统一增加
站得更高 → 每格移动成本变化
```

长期实测讨论反而把高低差效果集中在上述位移战法成功率；弩的普通/战法高低差也未显示统一加成。

因此 fidelity 模式目前：

```ts
normalAttackHeightMultiplier = 1
terrainMoveCostHeightModifier = 0
```

除非后续原函数提供相反证据。

来源：
- `005AF850 TacticSuccessRate`：311SireCustomizedPackageDev 地址表
- https://w.atwiki.jp/sangokushi11/pages/91.html
- https://w.atwiki.jp/sangokushi11/pages/1945.html
- https://dl.3dmgame.com/patch/26091.html
- https://vincecarter0315.pixnet.net/blog/posts/14217116027

## 7. 水陆切换与舰船

### 7.1 原程序保存的是“陆/水两套兵装”，不是一次性变身

`[PC-PK1.1][reverse-engineered-structure]`

SIRE 已命名以下原函数：

~~~text
00495480 GetLandMobilityEquipID
          取得部队陆上行军兵装

00495490 GetNavalMobilityEquipID
          取得部队水上行军兵装

00496160 GetTroopMobilityEquipID(troop, coord)
          按指定坐标取得当时应使用的行军兵装

00912FE8 getTroopEquipmentIDs(mainSlot, secondarySlot, onWater)
          根据主/副装备栏与 onWater 返回当前正确的
          “行军兵装 + 武器兵装”组合
~~~

`struct_troop` 同时保存：

- `EquipmentStatus`；
- `CurrentUnitType`（当前实际使用兵种，区分水陆）；
- 六兵科实际适性；
- 当前实际攻击/防御/移动力。

因此 fidelity 模型应理解成：

~~~text
一支部队
├─ 陆上兵装 / 陆战兵科
└─ 水上兵装 / 舰船

当前坐标
↓
选择当前 active equipment / unit category
↓
派生当前攻防、移动、战法、适性
~~~

部队从水面重新上陆后，恢复使用原来的陆上兵装；不是把原陆兵装永久替换为舰船。

### 7.2 真正触发“水上行军兵装”的地形只有河 / 海

`[PC-PK1.1][reverse-engineered]`

原“进入目标格移动力消耗”函数直接写死：

~~~text
terrain 7 = 河 → naval branch
terrain 8 = 海 → naval branch
其余 terrain → land branch
~~~

也就是：

~~~ts
const onWater =
  targetTerrainId === TERRAIN_RIVER ||
  targetTerrainId === TERRAIN_SEA
~~~

这带来三个重要纠错：

1. **渡所**不是水军切换格；
2. **浅滩**不是水军切换格；
3. **港**也不是普通“水面格”的 naval branch。

所以：

~~~text
渡所 / 浅滩：
仍按陆上兵装、陆上移动表处理

河 / 海：
切到舰船/水上兵装

川：
不可正常通行，不等于“河”
~~~

港口本身是据点/建筑交互；低层 terrain ID 为“港”时不会因为名字里有“港”就走 `GetNavalMobilityEquipID`。

### 7.3 水上使用水军适性，而不是原陆兵科适性

`[PC-PK1.1][reverse-engineered]`

原 `00496570 计算部队属性` 对兵装 ID 9（走舸）有明确分支：

- 正常战斗部队上船时，走正常兵科适性计算；
- 此时使用的是**水军兵科适性**；
- 运输队则走运输专用衰减分支，不按正常水军战斗部队计算。

因此不能实现成：

~~~ts
// 错误
waterAttack = landAttack
waterDefence = landDefence
waterTacticLevel = landUnitAptitude
~~~

正确模型是分别派生：

~~~ts
landProfile = deriveBy(landEquipment, landAptitude)
waterProfile = deriveBy(shipEquipment, waterAptitude)

activeProfile =
  onWater ? waterProfile : landProfile
~~~

长期实测的舰船基础值也与此结构一致：

| 舰船 | 攻击系数 | 防御系数 | 基础移动 |
|---|---:|---:|---:|
| 走舸 | 0.75 | 0.75 | 16 |
| 楼船 | 0.90 | 0.85 | 20 |
| 斗舰 | 1.00 | 0.95 | 20 |

### 7.4 舰船战法同样按“舰船 + 水军适性”判定

`[COMMON][empirical-high; structure reverse-engineered]`

标准水军战法：

~~~text
走舸：
  火矢，水军B

楼船：
  火矢，水军B
  猛撞/激突，水军A

斗舰：
  火矢，水军B
  猛撞/激突，水军A
  投石，水军S
~~~

所以陆上即使是：

~~~text
骑兵S
枪兵S
井阑
投石车
~~~

进入河/海以后，当前可用战法仍改由：

~~~text
当前舰船
+
水军适性
~~~

决定。

### 7.5 走舸是标准低级水上 profile；楼船/斗舰是高级舰船

`[COMMON][empirical-high]`

长期资料与决战剧本数据都显示，同一支陆军编成可以组合：

~~~text
枪兵 + 走舸
骑兵 + 楼船
井阑 + 楼船
……
~~~

也就是说陆上兵装与水上舰船是**并列保存**，并非一套装备二选一。

没有配高级舰船时，普通战斗部队以走舸作为基础水上 profile。楼船需要舰船准备；“开发投石”完成后，楼船在战斗 profile 上升级为斗舰，获得更高攻防与投石战法。

这一条的玩法行为为 `empirical-high`；库存扣减、已存在楼船在研究完成瞬间如何重解释的内部函数，留到后续技巧/兵装专项继续核。

### 7.6 运输队水上固定使用走舸行军兵装

`[PC-PK1.1][reverse-engineered]`

这是 B3/B4 已经锁死、这里补齐语义。

`00495490 GetNavalMobilityEquipID` 的逆向显示：

~~~text
运输队 → 返回兵装ID 9（走舸）
其他部队 → 返回其水上舰船兵装
~~~

因此：

- 运输队不会因为势力拥有楼船/斗舰，就把**行军移动表**改成高级舰船；
- 水上运输基础移动来自走舸16；
- 再加运输队固定 +5；
- 木牛流马 +3；
- 搬运 +5；
- 水上还可叠加操舵 +4。

全条件时：

~~~text
16 + 5 + 3 + 5 + 4 = 33
~~~

### 7.7 上下水本身没有发现独立“换船手续费/额外移动税”

`[PC-PK1.1][negative-evidence-high]`

已逆出的逐格移动成本函数，在跨越水陆边界时只做：

~~~text
读取目标格 terrain
↓
目标是河/海 → 取水上行军兵装
否则 → 取陆上行军兵装
↓
查对应 terrain move cost
~~~

没有看到：

~~~text
上船额外 -N 移动力
下船额外 -N 移动力
额外消耗行动力
额外消耗气力
~~~

因此当前 fidelity 模式**不要另造 embark/disembark cost**。

不过完整可移动范围函数 `005A4540` 尚未逐指令恢复，所以“跨边界后剩余移动预算如何在陆/水两套总移动力之间比较”的每一个内部细节仍保留为小型 exactness gap。

### 7.8 从水上攻击陆地时，攻击者仍是水军 profile

当前兵种按**攻击者所在格**选择，而不是按目标格选择。

因此：

~~~text
攻击者在河/海
目标在岸上/港/城市附近
~~~

攻击者仍使用：

- 舰船攻防；
- 水军适性；
- 舰船战法；
- 水上专属特技/技巧边界。

这也是斗舰可以从水上投石攻击沿岸城市、港口与设施的基础。

### 7.9 当前实现接口

建议不要在“进入水格”事件里直接修改永久兵种，而是让派生层按坐标选择：

~~~ts
function isNavalCoordinate(cell) {
  return (
    cell.terrainId === TERRAIN_RIVER ||
    cell.terrainId === TERRAIN_SEA
  )
}

function getActiveEquipmentProfile(troop, cell) {
  return isNavalCoordinate(cell)
    ? troop.navalProfile
    : troop.landProfile
}
~~~

路径搜索则对每个**目标格**调用对应的：

~~~ts
getTroopMobilityEquipID(troop, targetCoord)
~~~

这与原函数职责最接近。

### 7.10 当前证据边界

已源码/结构确认：

- 陆上/水上行军兵装是独立函数；
- 当前坐标可决定使用哪一套行军兵装；
- 河/海才进入水上移动分支；
- 渡所/浅滩不触发水上兵装；
- 运输队水上行军映射为走舸；
- 水军适性与陆军适性是独立兵科。

仍待完整原函数：

- `00912FE8 getTroopEquipmentIDs` 的完整主/副装备解析细节；
- 出征时高级舰船库存扣减的原函数；
- `005A4540` 在一次路径跨陆水边界时如何处理两套“总移动力上限”的所有边界；
- 开发投石完成瞬间对既有楼船库存/在外部队的内部重解释时点。

## 7A. 港关容量与所属关系

### 7A.1 “所属城市”与“当前势力”是两套独立关系

`[PC-PK1.1][reverse-engineered]`

城市结构体保存：

```text
struct_city + D4
SubordinateHarborAndPassID[5]
```

也就是每座城市最多静态列出 5 个“地理/行政上从属于该城”的港口或关隘。

而港口 / 关隘结构体本身并**没有**存 `ParentCityID` 或 `ForceID`，而是保存：

```text
struct_harbor / struct_pass
+20 CorpsID
```

当前政治归属通过：

```text
港关 CorpsID
↓
struct_corp.PowerID
↓
ForceID
```

得到。原程序还存在：

- `0047B2B0 GetForceID`：城市/港/关统一取当前势力；
- `00483810 GetCorpIDForHarborOrPass`；
- `0065D6C0 GetForceIDOfCrop`；
- `0047BC50 GetNthHarborIDOfCity`：从城市静态下属列表取第 N 个港关。

因此必须分别建模：

```ts
harbor.parentCityId   // 静态地理关系
harbor.corpsId        // 当前军团
harbor.forceId        // 由 corpsId 派生
```

而不能写成：

```ts
harbor.forceId = city.forceId
```

### 7A.2 母城易手不会把“地理所属”改掉

`[COMMON][empirical-high + structure-supported]`

“虎牢关属于洛阳”“白马港属于邺”这种 `parentCityId` 是地图/剧本拓扑关系；战争中港关可以与母城处于**不同势力**控制下。

社区攻略明确把“控制母城”和“控制该城所有港关”区分开，例如长安只有在所属 5 个港关也全部控制时才取得对应全部附属收入。

原程序月度收支又专门比较：

```text
port.forceId == parentCity.forceId ?
```

如果游戏逻辑保证母城与港关永远同势力，这个分支本身就没有必要。

因此攻陷母城时不要重写 `SubordinateHarborAndPassID`；港关自己的当前军团/势力按据点占领流程独立变化。

### 7A.3 同一势力、不同军团仍视为同方

`[PC-PK1.1][reverse-engineered]`

月度收入判断在 `005906AC-005906C4`：

```text
GetForceID(port/pass)
GetForceID(parentCity)
compare ForceID
```

比较的不是：

```text
CorpsID
```

所以：

> 港关和母城只要属于**同一个势力**，即使分别属于该势力不同军团，仍满足附属收入条件。

### 7A.4 港关收入必须与母城当前同势力

`[PC-PK1.1][reverse-engineered]`

`00590490 MonthlyIncomeAndExpend` 的精确流程：

```text
遍历城市
↓
根据 city.SubordinateHarborAndPassID 逐个取得港关
↓
取得港关当前 ForceID
↓
取得母城当前 ForceID
↓
若不同：跳过该港关本次附属收入
若相同：继续结算
```

基础附属收入：

```ts
harborMoney = trunc(parentCityMoneyTick / 5)
harborFood  = trunc(parentCityFoodTick / 5)
```

也就是母城当次收入的 20%。

这里的 `parentCityMoneyTick / FoodTick` 已经走过征税/征收/丰作等当前 tick 分支；富豪/米道的港关额外部分又在后续分支处理。

所以“所属城市20%”不是港关自己拥有一套独立基础产值。

### 7A.5 港关是完整独立据点，不只是城市附加数字

`[PC-PK1.1][reverse-engineered]`

`struct_harbor` 与 `struct_pass` 均为独立 `0x90` 结构，自己保存：

- `CorpsID`
- 兵力
- 金钱
- 兵粮
- 枪/戟/弩/马库存
- 冲车～斗舰库存
- 耐久 / 最大耐久
- 气力
- 太守
- 训练状态
- 独立武将链表

并且有独立：

- `SetHarborTroops`
- `SetHarborMoney / Food`
- `SetHarborEquipment`
- `GetSPPersonList`
- `GetSPPrefectID`

因此港关可以独立驻将、驻兵、存钱粮、存兵装、被单独攻陷；不能把它实现为母城对象上的一个简单 bonus flag。

### 7A.6 基础容量

`[COMMON][confirmed-game-data; source functions located]`

未研究 PK“扩展港关”时：

| 项目 | 港 / 关上限 |
|---|---:|
| 金 | 10,000 |
| 兵粮 | 100,000 |
| 士兵 | 30,000 |
| 枪 | 30,000 |
| 戟 | 30,000 |
| 弩 | 30,000 |
| 军马 | 30,000 |

原程序有独立上限函数：

- `0048D7E0 GetHarborTroopLimit`
- `0048D820 GetBuildingMoneyLimit`
- `0048D860 GetHarborFoodLimit`
- `0048D8A0 GetHarborEquipmentLimit`
- 通用包装 `00486A30 / 00486BC0 / 00486D30 / 00486EA0`

### 7A.7 PK“扩展港关”

`[PK][confirmed-game-data]`

研究后：

| 项目 | 基础 | 扩展后 |
|---|---:|---:|
| 金 | 10,000 | 40,000 |
| 兵粮 | 100,000 | 400,000 |
| 士兵 | 30,000 | 60,000 |
| 枪 | 30,000 | 60,000 |
| 戟 | 30,000 | 60,000 |
| 弩 | 30,000 | 60,000 |
| 军马 | 30,000 | 60,000 |

日文 Wiki 与中文 PK 技巧表均给出完全一致的数值。citeturn559057search7turn476170search2

注意：

> 这里的“兵装 3万→6万”指**枪、戟、弩、军马四类数量型兵装**。

原结构把：

```text
EquipmentCounts[4]      // 枪～马
SiegeWeaponCounts[7]    // 冲车～斗舰
```

分开保存。

因此不能把“扩展港关”误写成：

```text
冲车 60000
井阑 60000
楼船 60000
```

这显然不是原数据语义。攻城兵器/舰船的小数量库存上限需要继续从 `GetHarborEquipmentLimit` 的完整函数体或实机边界测试中提取；本项不编造具体值。

### 7A.8 “扩展港关”不等于增加耐久

`[PK][confirmed-mechanism]`

扩展港关的说明只提高：

- 金
- 粮
- 士兵
- 四类数量兵装

港关耐久另有独立：

```text
MaxDurability
GetMaxDurabilityForHarborOrPass
```

而据点耐久提升属于防御系“城壁强化”等机制，不要把它并入“扩展港关”。

### 7A.9 当前实现建议

```ts
interface HarborPass {
  id: number

  // 永久地图关系
  parentCityId: number

  // 当前政治关系
  corpsId: number
  forceId: number

  troops: number
  money: number
  food: number

  massEquipment: {
    spear: number
    halberd: number
    crossbow: number
    horse: number
  }

  siegeAndShips: Record<EquipmentId, number>

  durability: number
  maxDurability: number
  morale: number
  prefectId: number
}

function getsParentIncome(sp, parentCity) {
  return sp.forceId >= 0 &&
         sp.forceId === parentCity.forceId
}
```

容量不要写死在结构体里，应通过当前势力技巧动态查询：

```ts
getHarborPassLimits(sp.forceId)
```

这样港关被另一势力占领后，会自然按**当前占领势力**是否拥有“扩展港关”来决定容量规则，而不是继续读取母城势力的技巧。

### 7A.10 证据边界

已经锁定：

- 城市静态保存下属港关列表；
- 港/关自己保存 CorpsID，当前 ForceID 独立派生；
- 母城与港关可以不同势力；
- 月度收入只比较 ForceID，不比较 CorpsID；
- 同势力不同军团仍有附属收入；
- 港关基础收入为母城当次钱粮的20%；
- 基础与扩展后的金/粮/兵/枪戟弩马容量。

仍 open：

- 冲车/井阑/投石/木兽/楼船/斗舰等小数量兵器在港关的精确库存上限；
- 占领港关时各类现有物资的完整继承/损失函数（与前一轮“攻陷资源继承”专项存在交集，不在 B8 重复展开）；
- Vanilla EXE 的容量 getter 是否逐字与 PC-PK 相同。

来源：
- 311SireCustomizedPackageDev `material/结构体汇总.md`
- 311SireCustomizedPackageDev `material/内存地址汇总.md`
- 311MemoryResearch `Func-收支03-每月钱粮兵装收支.txt`
- https://w.atwiki.jp/sangokushi11/pages/77.html
- https://w.atwiki.jp/sangokushi11/pages/90.html
- https://w.atwiki.jp/sangokushi11/pages/165.html

## 8. 地形伤害

### PC-PK1.1：栈道 / 毒泉

`[reverse-engineered]`

繁中 PK1.1 内存地址已经恢复逐格行军伤害参数：

```ts
// 栈道：每进入一格
plankDamage =
  hasTraverse || hasDifficultMarch
    ? 0
    : 100 + GetRandomX(200) // 100..299

// 毒泉：每进入一格
poisonDamage =
  hasAntidote
    ? 0
    : 200 + GetRandomX(200) // 200..399
```

这里是“每走一格”的 entry damage，不是每旬站在地形上定时扣血。

旧规则中的“毒泉固定 -1000兵、-5气力”没有逆向依据，已删除；目前毒泉只扣兵，不额外扣气力。

地址来源：
- 栈道：`005AE58D / 005AE5C6 / 005AE5AF`
- 踏破：`005AE597`
- 难所行军：`005AE5A4`
- 毒泉：`005AE588 / 005AE5F8 / 005AE5E2`
- 解毒：`005AE5D9`

来源：https://game.ali213.net/thread-2168294-1-1.html

### PC-PK1.1：落石

`[reverse-engineered-parameters / reconstructed]`

专用参数：

```ts
troopDamage =
  1500 + GetRandomX(500) // 1500..1999

buildingDurabilityDamage =
  800 + GetRandomX(1000) // 800..1799
```

踏破：

```ts
troopDamage =
  trunc(troopDamage / 10)
```

也就是只承受约10%的落石伤害。

当前没有可靠证据支持“落石固定30%混乱”，因此 fidelity 模式不附加混乱状态。

来源：
- https://game.ali213.net/thread-2168294-1-1.html
- https://www.sohu.com/a/394347085_100186910

### 剩余边界

落石逆向资料另外暴露一个“全陷阱共通基本伤害50”参数。完整函数体尚未文本化，所以是否还需独立叠加该50、以及最终整数顺序，仍保留为小型 exactness gap。

上述具体常量来自**繁中 PK1.1**。Vanilla 机制层确认相同，但未取得无印 EXE 的精确常量；Vanilla 暂复用时必须标 `compatibilityAssumption=true`。

## 9. 堤防与水攻

- 原作存在地图固定堤防及破坏后的水攻效果。
- 完整堤防坐标、洪水覆盖格、耐久与逐格伤害仍缺静态/实测数据。
