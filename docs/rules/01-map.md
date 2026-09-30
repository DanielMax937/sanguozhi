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

## 4. 移动力加成

- 强行：剑/枪/戟/弩/骑陆军移动 +5。
- 长驱：骑兵移动 +3。
- 操舵：舰船与水上输送移动 +4。
- 运搬：输送移动 +5。
- 车轴强化：提高攻城兵器移动。
- `[PK]` 木牛流马：提高输送移动。
- 难所行军：允许/改善特殊地形通行并处理栈道伤害。

## 5. ZOC

- 敌部队形成控制区域。
- 飞将、遁走等可忽略陆上 ZOC。
- 混乱部队 ZOC 消失。
- ZOC 的路径搜索应直接作用于六角格寻路，不应在城市邻接图层简化。

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
