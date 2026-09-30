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

## 6. 高度

- 地图格包含高度。
- 枪/骑位移战法受双方高度差影响；现有兵科规则按每级 ±5% 处理。
- 戟位移类战法方向相反时按兵科表处理。
- 完整高度静态表仍需从地图数据导入。

## 7. 水陆切换与港关

- 陆军进入可航行水域后按舰船配置转为水军兵科；无高级舰船时使用走舸。
- 水上使用水军适性与舰船战法。
- 港/关可驻兵、存储金粮兵装，并可被攻陷。

### 港关容量

`[COMMON][confirmed]` 基础：

- 金 10,000
- 粮 100,000
- 士兵 30,000
- 各兵装 30,000

`[PK][confirmed]` 港关扩张后：

- 金 40,000
- 粮 400,000
- 士兵 60,000
- 各兵装 60,000

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
