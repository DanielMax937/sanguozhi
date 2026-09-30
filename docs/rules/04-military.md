# 征兵、兵装、编成、训练、补给与技巧

## 1. 征兵

### PC-PK 1.1 精确公式（代码逆向确认）

`[PC-PK1.1][confirmed-by-disassembly]`

311MemoryResearch 对 `San11PK.exe` 的 `005C3610`（计算征兵数量）和 `005C3A50`（执行征兵）做了逐指令逆向，因此这一项不再需要 provisional 公式。

定义：

- `C` = 最多 3 名执行武将的**魅力和**
- `O` = 当前城市治安
- `F` = 名声倍率：无名声 `1.0`；任一执行武将有“名声”则 `1.5`
- `B` = 本次使用兵舍等级倍率：Lv1=`1.0`，Lv2=`1.2`，Lv3=`1.5`

原始征兵量：

```
A = 1000 + floor((O + 20) * C / 20)
A = floor(A * F)
R = floor(A * B)
```

随后按顺序修正：

1. 超级难度的 **AI 城市**：`R *= 2`
2. 兵临城下：`R = floor(R / 2)`。官方 PK 说明书写作“城市周围 2 格”；逆向资料对其通用判定函数注释为“城市 3 格、港关 2 格”，因此**减半已确认，距离边界暂按官方 2 格实现并保留 distance=2/3 的回归测试**
3. 城市兵力上限：`R = min(R, maxTroops - currentTroops)`

因此当前治安不是只影响“能不能征兵”，而是直接线性进入基础公式。

逆向来源：
- https://github.com/sjn4048/311MemoryResearch/blob/master/内存资料/整理/Func-内政01-计算征兵数量.txt

### 征兵导致的治安下降

`[PC-PK1.1][confirmed-by-disassembly]`

执行征兵后，先取**实际增加进城市的兵力**（已经经过超级AI、兵临城下和城市兵力上限裁剪）：

```
orderLoss = floor(actualRecruited / (C + 100))
```

然后：

`治安 -= orderLoss`

这也解释了“名声会让治安下降约多 50%”：原版代码没有单独再乘一次治安惩罚，而是因为名声先把实际征兵量 ×1.5，治安损失再按实际征兵量计算。

逆向来源：
- https://github.com/sjn4048/311MemoryResearch/blob/master/内存资料/整理/Func-内政02-执行征兵.txt

### 可复算锚点

治安100、3名魅力100、无名声、Lv3兵舍：

```
C = 300
A = 1000 + (120*300/20) = 2800
R = 2800 * 1.5 = 4200
orderLoss = floor(4200 / 400) = 10
```

这与老 2ch/日文 Wiki 实战记录“魅力100三人、Lv3兵舍一次约4200”完全吻合。

若同条件任一人有名声：

```
R = 2800 * 1.5 * 1.5 = 6300
orderLoss = floor(6300 / 400) = 15
```

也与日文 Wiki 对“Lv3 + 名声征兵会掉约15治安”的经验记录吻合。

交叉证据：
- https://w.atwiki.jp/sangokushi11/pages/1937.html
- https://w.atwiki.jp/sangokushi11/pages/1190.html
- https://w.atwiki.jp/sangokushi11/pages/13.html

### 其他精确副作用

`[PC-PK1.1][confirmed-by-disassembly]`

- 征兵费用：300 金
- 行动力：20
- 最多 3 名执行武将
- 每名执行武将：魅力经验 +2、功绩 +50
- 新征士兵气力 = `floor(征兵前治安 / 2)`
- 与原驻军气力按人数加权混合；最终城市气力最低为 20
- 每次执行消耗 1 次可用兵舍征兵次数

### Vanilla 版本边界

`[VANILLA][empirical-high]`

无印没有 Lv2/Lv3 兵舍，因此 `B=1.0`。魅力、治安、名声、300金、20行动力、最多3人等机制在无印资料中一致存在。

但目前拿到的**逐指令反汇编是 PC-PK 1.1**，尚未对 Vanilla 可执行文件做二进制逐字节对比。因此引擎中应：

- Vanilla：采用同一核心公式，固定 `B=1.0`
- PK：使用完整公式和 Lv1/2/3 倍率
- 标记 `formulaEvidence.vanilla = empirical-high`
- 标记 `formulaEvidence.pk11 = confirmed-by-disassembly`

### 重要纠错

旧 provisional：

`征兵 = 1000 + 政治×15`

完全错误，已删除。征兵核心是**执行武将魅力和 + 当前治安 + 兵舍等级 + 名声**。

## 2. 枪/戟/弩/马生产量

`[COMMON][empirical-high]`

公式：

`生产量 = ((最高智力 + 100) + (其余两人智力之和)/2) × 10 × 生产设施补正 × 特技补正`

结果四舍五入。

- 最低约 1010。
- 上限 9000。
- 能吏：枪/戟/弩最终生产量 ×2。
- 繁殖：军马最终生产量 ×2。
- 生产设施 Lv 会提供对应设施补正。

来源：https://w.atwiki.jp/sangokushi11/pages/74.html

## 3. 兵器与舰船开发时间

`[COMMON][empirical-high]`

综合智力：

`最高智力 + (其余两人智力之和)/2`

四舍五入。

| 开发日数 | 最低综合智力 |
|---:|---:|
| 10 | 208 |
| 20 | 196 |
| 30 | 184 |
| 40 | 172 |
| 50 | 160 |
| 60 | 148 |
| 70 | 136 |
| 80 | 124 |
| 90 | <124 |

正常能力上限下最高综合智力为 200，因此通常最短为 20 日。

- 发明 / 造船：对应开发日数减半。
- `[PK][PC-PK1.1 reverse-engineered]` 练兵所**只作用舰船（兵装 ID 9～11）**，不作用攻城兵器。原 `005C6CA0` 的内部旬数不是“最后统一 -20 日”，而是把舰船耗时分支从 `10-q` 改成 `max(2, 8-q)`，随后若有“造船”特技再对结果减半。
- 因此常见表现确实约缩短 20 日，但 fidelity 实现必须保留上述顺序；完整 `q` 计算见后续 E2。

来源：https://w.atwiki.jp/sangokushi11/pages/74.html

## 4. 部队编成

`[PC-PK1.1][reverse-engineered structure + sortie UI limits + confirmed gameplay]`

E1 只处理“这支部队由谁、带多少兵、带哪些装备与资源组成”。部队五维/适性/攻防如何合成留 E2。

### 4.1 Runtime 部队不是一个“兵种ID”，而是一组独立字段

PC-PK1.1 的 `struct_troop` 大小为 `0xF4`，关键字段：

```text
+08 TroopType        // 0=战斗部队, 1=输送队
+0C MainGeneralID
+10 SubGeneral1ID
+14 SubGeneral2ID
+18 TroopStrength
+1C Money
+20 Food
+44 FactionID
+48 EquipmentStatus  // 12个栏位，每栏保存兵装类型+数量
+A8 CurrentUnitType
```

因此：

- 一支部队固定 **1 主将 + 最多 2 副将**，总共最多3名武将；
- 战斗部队与输送队是 `TroopType` 的两种运行时类型，不是同一个“兵种”；
- 兵力、金、粮、兵装槽都是独立状态；
- 陆上兵装与水上兵装可以同时存在，`CurrentUnitType` 只是当前位置实际使用的 profile。水陆切换细节沿用 B7。

对应 helper 已定位：

```text
00495310 IsTroopLeader
00495340 IsTroopFollower
00495390 IsPersonInTroop
00495A40 GetTroopLeaderPtr
004954E0 GetTroopEquipmentNum
00495480 GetLandMobilityEquipID
00495490 GetNavalMobilityEquipID
00496160 GetTroopMobilityEquipID
```

### 4.2 战斗部队出征兵力上限：主将、据点兵力、数量型兵装三重取最小

PC-PK1.1 出征界面 `00647250` 已逐指令展开。

选定主将后：

```ts
commandCap = GetMaxSoldiersForPerson(mainGeneral) // 0048A4F0 -> 0049D540

maxTroops = min(
  commandCap,
  sourceBuilding.troopStrength
)

if (unitType >= 1 && unitType <= 4) {
  // 枪 / 戟 / 弩 / 马
  maxTroops = min(
    maxTroops,
    sourceBuilding.equipment[unitType]
  )
}
```

即普通势力战斗部队：

```text
剑：
  min(主将可指挥兵数, 据点现有兵力)

枪/戟/弩/骑：
  min(主将可指挥兵数, 据点现有兵力, 对应兵装库存)
```

如果 UI 尚未选主将，界面会临时调用 `00646E60` 取据点中最高可指挥兵数作为预览上限；**最终选定主将后仍以主将自身上限为准**。

副将官职不会把带兵上限相加。

### 4.3 玩家出征下限精确为1兵

同一函数直接写死：

```text
006472FB  mov ebx, 1
```

因此，只要最终上限至少为1：

```text
战斗部队最少可出兵 = 1
```

这不是“最低500/1000兵”的隐藏规则。

输送队同样允许极少兵力出征；日文实机资料明确存在用1兵输送队携3名武将撤离据点的用法。

### 4.4 兵装 ID 与“数量型 / 件数型”必须分开

原兵装编号：

| ID | 兵装 |
|---:|---|
| 0 | 剑 |
| 1 | 枪 |
| 2 | 戟 |
| 3 | 弩 |
| 4 | 马 |
| 5 | 冲车 |
| 6 | 井栏 |
| 7 | 投石 |
| 8 | 木兽 |
| 9 | 走舸 / 小船 |
| 10 | 楼船 |
| 11 | 斗舰 |

#### 枪 / 戟 / 弩 / 马：数量型

`00647250` 对 ID 1～4 明确把“据点兵装数量”纳入出兵兵力上限。

所以：

```text
10000 枪兵
-> 至少需要10000枪库存
```

实机资料同时确认，这四类部队损兵时会以相同数量消耗对应兵装。

#### 剑：不需要库存与兵力一一对应

ID0 不进入上述“兵装库存限制兵力”分支，所以剑兵不是“1兵=1把剑库存”的资源模型。

#### 攻城兵器：按件选择，不按士兵数消耗

ID5～8 也不进入数量型兵装上限分支。

因此：

- 5000冲车部队不是需要5000辆冲车；
- 出征时选中一件攻具作为该战斗部队的陆上兵装；
- 部队损兵不会按损兵数同步消耗攻具。

原出征最终提交函数如何精确扣除/归还这1件攻具，目前尚未公开完整反汇编；“按一支装备部队占一件”的游戏行为已稳定确认。

### 4.5 舰船也是部队级装备，不按士兵数准备

楼船/斗舰不是“10000水军需要10000艘船”。

游戏资料明确要求：

```text
需要多少支装备高级舰船的部队
-> 准备多少艘楼船 / 斗舰
```

也就是按**部队件数**准备。

更重要的是，部队同时保存陆上与水上装备：

```text
00495480 GetLandMobilityEquipID
00495490 GetNavalMobilityEquipID
00496160 GetTroopMobilityEquipID(troop, coord)
```

所以进入河/海后不是把原枪/戟/兵器永久“改成船”；离开水面后仍恢复陆上 profile。完整地形切换规则见 B7。

### 4.6 普通战斗部队资源上限

PC-PK1.1 原地址资料锁定：

| 资源 | 普通战斗部队 |
|---|---:|
| 兵力 | 主将可指挥上限，再受据点/兵装库存限制 |
| 金 | **10,000** |
| 粮 | **50,000** |

原 helper：

```text
004957B0 GetTroopStrengthLimit
004957F0 GetTroopMoneyLimit
00495810 GetTroopFoodLimit
```

地址常量：

```text
战斗部队金上限  0x2710  = 10,000
战斗部队粮上限  0xC350  = 50,000
```

因此旧“携金上限10000、但没有出处”已升级为源码支持；50,000粮也不是按兵力动态变化的上限。

### 4.7 输送队有自己独立的超大容量

`TroopType=1` 的输送队不是“拿剑兵换个图标”。

已确认：

| 资源 | 输送队 |
|---|---:|
| 武将 | 1主将 + 最多2副将 |
| 兵力 | **60,000** |
| 金 | **100,000** |
| 粮 | **500,000** |

逆向常量：

```text
60,000  = 0xEA60
100,000 = 0x186A0
500,000 = 0x7A120
```

AI 输送代码也直接用同一组 60000 / 100000 / 500000 封顶，形成独立交叉验证。

输送队还能携带兵装，但这不会把 `TroopType` 从1改成战斗部队；运输中的枪、马、攻具、舰船都是**货物**。

运输兵装的每种精确容量已经能定位到：

```text
006157C1 / 006157D8
004962CF / 004962D6
00496306 / 0D / 28 / 2F
```

但这些分支的数值语义尚未完整展开，因此本轮不伪造“每种兵装最多多少”。

### 4.8 出征面板规则与 Runtime 写入要分层

当前已经恢复的是玩家出征界面的**兵力合法范围计算**：

```text
00647250
```

它精确解决：

- 主将上限；
- 据点剩余兵力；
- 枪戟弩马库存；
- 最低1兵。

但最终按下“确定”以后：

- 具体如何从据点扣金/粮；
- 攻具/舰船那1件如何扣除；
- 部队回城时如何归还件数型兵装；
- 输送队各兵装货物的逐类型封顶；

对应 finalizer 尚未得到同等完整的逐指令文本。

因此实现时应拆为：

```text
validateSortieDraft()
commitSortieResources()
createRuntimeTroop()
```

不要把 UI 上限函数误当成完整资源事务函数。

### 4.9 E1 当前结论

已经锁定：

- 战斗/输送为独立 `TroopType`；
- 固定1主将+最多2副将；
- 战斗部队最小出兵1；
- 战斗部队最大兵力 = 主将上限与据点兵力取小，枪戟弩马还要与对应库存取小；
- 剑不要求按士兵数准备库存；
- 枪戟弩马为数量型兵装；
- 攻具与楼船/斗舰为部队级件数型装备；
- 普通战斗部队金10000、粮50000；
- 输送队兵60000、金100000、粮500000；
- 输送队可带最多3名武将；
- 陆/水装备同时保存，地形只切换 active profile，不永久改兵种。

仍 open：

- 玩家出征最终资源提交函数的完整逐指令文本；
- 攻具/高级舰船出征与回城时的精确扣除/归还 caller；
- 输送队各兵装货物的逐类型最大容量；
- 玩家/COM/主机版在输送货物 UI 上的版本差异；
- 出征可选武将列表的完整资格过滤函数（现役/任务/已行动等全部顺序）。

来源：

- 311MemoryResearch：`内存资料/出征窗口部分界面代码.txt`；
- 311MemoryResearch：`内存资料/地址资料.txt`；
- 311SireCustomizedPackageDev：`struct_troop` 与 troop helper；
- 日文 Wiki《戦争》：1兵部队、输送3武将、50000粮、输送60000兵及兵装损耗；
- 日文 Wiki《技巧研究》《内政》：高级舰船按出征部队数准备。

## 5. 部队能力合成

`[PC-PK1.1][reverse-engineered GetTroopCapabilities + relation helper partial + cross-platform exact relation tests]`

E2 现在以 PC-PK1.1 原函数：

```text
00496570 GetTroopCapabilities
```

为主链。这个函数一次计算：

- 部队五维；
- 六兵科适性；
- 攻击；
- 防御；
- 建设力；
- 后续移动力。

本节只写到建设力；移动力继续沿用 B4/E3。

### 5.1 输入的武将能力层：是否计算伤病由参数决定

原函数有一个 `useActualAttr` 类参数。

若需要计算伤病等当前实际状态：

```text
00489030 GetPersonActualAttr
```

若不计算伤病：

```text
00489050 GetPersonBasicAttr
```

因此部队合成不是直接读取人物最原始“素质”，而是读取 D3 已经经过年龄、经验、官职等人物属性链后的 **Basic / Actual display attr 层**。

也就是说：

```text
人物成长/经验/官职...
-> person Basic/Actual Attr
-> E2 主副将合成
-> 部队五维
```

### 5.2 单将部队：五维直接等于主将对应属性

若没有副将，原函数对统/武/智/政/魅逐项读取主将：

```ts
troopAttr[i] = useActualAttr
  ? main.actualAttr[i]
  : main.basicAttr[i]
```

没有额外“单将补正”。

### 5.3 多将部队第一步：先检查三组嫌恶 pair

有副将时，`00496570` 在真正合成前先调用：

```text
00495B90 ArePersonsMutuallyHateful
```

检查三组可能的 pair：

```text
主将 ↔ 副将1
主将 ↔ 副将2
副将1 ↔ 副将2
```

这个 helper 是**双向嫌恶**：

```text
A厌恶B 或 B厌恶A
-> true
```

只要任意一组返回 true，函数立即跳到：

```text
00496865
```

并把**五维全部改为只读取主将**。

所以 D4 旧的：

> “两名副将互相嫌恶也会让整队副将能力补正归零”

现在已经升级为 **PC-PK1.1 原函数确认**。

但要注意一个非常重要的边界：

**嫌恶只把五维副将补正清掉，不会清掉副将提供的兵科适性。**

因为跳到主将五维分支后，程序仍继续进入 `0049688D` 的三人适性取最大循环。

### 5.4 统率 / 武力与智力 / 政治 / 魅力不是同一种合成算法

这是本轮最重要的纠错。

原函数对五维分成两组处理。

#### 统率、武力：调用主副将关系 helper

对每一名副将，统率和武力调用：

```text
00495AB0 GetHighestAttrOfMgAndDg
```

然后两名副将的候选结果再取较高值。

因此结构是：

```ts
leadership = max(
  combineMainDeputy(main, sub1, LEADERSHIP),
  combineMainDeputy(main, sub2, LEADERSHIP)
)

war = max(
  combineMainDeputy(main, sub1, WAR),
  combineMainDeputy(main, sub2, WAR)
)
```

不存在“直接把队内最高统率/武力拿来用”的普通规则。

#### 智力、政治、魅力：直接取队内最大值

原 `00496738～004967D5` 对索引2～4不调用关系 helper，而是直接比较主将与当前副将，再在两名副将结果间取最大值。

所以：

```ts
intelligence = max(main.int, sub1.int, sub2.int)
politics     = max(main.pol, sub1.pol, sub2.pol)
charisma     = max(main.cha, sub1.cha, sub2.cha)
```

前提仍是**队内没有任何嫌恶 pair**；如果有嫌恶，五维整体退回主将。

旧资料把“智力/政治/魅力也统一套1/2、1/3、1/4关系除数”写成通用公式，是错误的。

### 5.5 统武关系 helper：当前证据边界

PC 地址资料已经直接确认：

```text
普通关系：
  副将高于主将的差值 × 1/4
  地址 00495B65

亲爱关系：
  差值 × 1/2
  地址 00495B79
```

PS2PK 的逐值实测进一步锁定完整关系表：

| 副将→主将关系 | 统/武补正 |
|---|---|
| 夫妻 / 义兄弟 | 直接取更高值，相当于差值×1 |
| 亲爱 | 差值×1/2 |
| 血缘 | 差值×1/3 |
| 普通 | 差值×1/4 |

且副将低于主将时**不会拉低**主将。

因此当前实现：

```ts
candidate = mainStat

if (subStat > mainStat) {
  candidate =
    mainStat
    + floor((subStat - mainStat) / divisor)
}
```

其中：

```text
夫妻/义兄弟 divisor=1
亲爱       divisor=2
血缘       divisor=3
普通       divisor=4
```

证据等级应分开：

- 普通1/4、亲爱1/2：PC-PK1.1 地址级逆向确认；
- 血缘1/3、夫妻/义兄弟1：PS2PK empirical-exact + PC关系分支结构一致；
- `00495AB0` 完整逐指令文本仍未公开，因此后两项保留跨平台回归标记。

### 5.6 六兵科适性：完全无视上述关系，三人直接取最高

`0049688D～004968CD` 对6个兵科逐一循环3名武将：

```ts
for each category:
  troopProficiency[category] =
    max(
      main.proficiency[category],
      sub1.proficiency[category],
      sub2.proficiency[category]
    )
```

因此：

- 适性不做1/2、1/3、1/4折算；
- 副将即使统武很差，只要目标兵科适性高，就能直接把该兵科适性抬高；
- 即使队内存在嫌恶，副将的最高适性仍然会被使用。

这一点与日文/中文长期实机结论完全一致。

### 5.7 适性倍率：C/B/A/S = 0.7/0.8/0.9/1.0

原函数：

```text
aptitudeLevel + 7
× 0.1
```

内部：

```text
C=0 -> 0.7
B=1 -> 0.8
A=2 -> 0.9
S=3 -> 1.0
```

两个特例：

```text
剑兵：
  固定0.6

输送队使用走舸：
  固定0.6
```

普通战斗水军不是固定0.6；会正常读取部队最高水军适性。

### 5.8 混乱状态：攻、防、建设力统一 ×0.8

`struct_troop.Status` 已确认：

```text
0 = 正常
1 = 混乱
2 = 伪报
```

`00496911` 读取状态：

```ts
statusMultiplier =
  troop.status === CONFUSED
    ? 0.8
    : 1.0
```

这个倍率后面同时进入：

- 攻击；
- 防御；
- 建设力。

所以原作 PC-PK1.1 的精确行为是：

```text
混乱 -> 攻击×0.8、防御×0.8、建设力×0.8
伪报 -> 本函数不走这条0.8
```

这也意味着旧文档里“混乱防御不下降”的描述需要撤回。

### 5.9 输送队面板衰减

原参数：

```text
00496932  输送攻击倍率 0.4
004969F2  输送防御/建设倍率 1/3
```

因此：

```text
输送队攻击     × 0.4
输送队防御     × 1/3
输送队建设力   × 1/3
```

再与状态倍率相乘。

### 5.10 精锐枪/戟/弩/骑：先给兵种基础攻防各 +10

原函数先读取兵装基础：

```text
equipment.baseAttack
equipment.baseDefense
```

若是枪/戟/弩/骑且所属势力拥有对应精锐技巧：

```text
baseAttack  += 10
baseDefense += 10
```

然后才进入武力/统率、适性、输送、状态乘算。

因此：

**精锐 +10 是加在兵装基础攻防，不是最后面板统一 +10。**

### 5.11 PC-PK1.1 原攻击 / 防御 / 建设力链

不考虑 SIRE 修改代码时，原函数结构为：

#### 攻击

```ts
attackRaw =
  troopWar
  * effectiveBaseAttack
  * aptitudeMultiplier
  * 0.01
  * troopTypeAttackMultiplier
  * statusMultiplier

attack = max(1, ConvertFloatToInteger(attackRaw))
```

其中：

```text
troopTypeAttackMultiplier:
  战斗 = 1
  输送 = 0.4
```

#### 防御

```ts
defenseRaw =
  troopLeadership
  * effectiveBaseDefense
  * aptitudeMultiplier
  * 0.01
  * troopTypeDefenseMultiplier
  * statusMultiplier

defense = max(1, ConvertFloatToInteger(defenseRaw))
```

其中：

```text
troopTypeDefenseMultiplier:
  战斗 = 1
  输送 = 1/3
```

#### 建设力

原地址直接锁定：

```text
00496A47  × 2/3
00496A4D  + 50
```

所以：

```ts
constructionRaw =
  (troopPolitics * (2/3) + 50)
  * troopTypeDefenseMultiplier
  * statusMultiplier

construction =
  max(1, ConvertFloatToInteger(constructionRaw))
```

注意这里使用的是 E2 已合成的**部队政治**。无嫌恶时实际上就是三将政治最高值；有任意嫌恶 pair 时退回主将政治。

### 5.12 整数取整仍沿用统一 helper gap

攻击、防御最终调用：

```text
00707A74 ConvertFloatToInteger
```

建设力也调用同 helper。

我们已经知道很多官方面板值能与“整数化”吻合，但 `00707A74` 对所有正数边界究竟是 floor / trunc / 特定FPU rounding 尚未完全单独恢复。

所以 E2 的运算顺序现在已精确，**极端小数边界的最后一步整数模式继续沿用项目统一 exactness gap**，不要在此自行宣称 floor。

### 5.13 E2 当前结论

已经锁定：

- 单将直接取主将五维；
- 多将时先检查三组双向嫌恶，任意命中则五维只取主将；
- 嫌恶不会取消副将提供的最高兵科适性；
- 统率/武力走主副关系 helper；
- 智力/政治/魅力直接取三人最高；
- 普通1/4、亲爱1/2为PC地址级确认，血缘1/3、夫妻/义兄弟1为PS2精确实测并与PC结构一致；
- 六兵科适性直接取三人最高；
- C/B/A/S倍率精确0.7/0.8/0.9/1.0；
- 剑兵固定0.6；输送走舸固定0.6；
- 混乱使攻击/防御/建设力×0.8；
- 输送攻击×0.4、防御/建设×1/3；
- 精锐枪戟弩骑在基础攻防上各+10；
- 原攻击看部队武力，原防御看部队统率；
- 建设力核心为 `政治×2/3+50`。

仍 open：

- `00495AB0` 完整逐指令文本，用于把血缘1/3、夫妻/义兄弟1从跨平台 empirical-exact 再升级成PC逐指令；
- `00707A74` 最终浮点转整数的精确边界模式；
- Vanilla / 主机版是否在混乱0.8、输送0.4/1/3上完全同值。

来源：

- 311MemoryResearch：`内存资料/函数[计算部队属性].txt`；
- 311MemoryResearch：`内存资料/地址资料.txt`；
- 311SireCustomizedPackageDev：`00496570 GetTroopCapabilities`、`00495AB0`、`00495B90` 及人物属性 helper；
- 日文 Wiki《検証》：副将关系1/2、1/3、1/4与适性实测；
- 日文 Wiki FAQ / 中文早期实测：义兄弟/夫妻取最高、智力取最高。

## 6. 训练与气力

- 气力通常上限 100；熟练兵后 120。
- `[PK][PC-PK1.1 reverse-engineered]` 练兵所让基础训练结果 `floor(value × 3 / 2)`，随后才受据点气力上限截断。原地址：`005C402B-005C404B`。
- 军乐台范围内每旬 +10；奏乐每旬 +5，通常不与军乐台叠加取更强效果。

单次训练基础增量的完整内部公式仍未确认。

## 7. 兵粮消耗

每旬：

- 行军：士兵 / 10
- 输送：士兵 / 20
- 驻屯：士兵 / 40
- 港/关驻屯且有屯田：0

### 粮尽逃兵

`[COMMON][empirical-high]`

若粮尽时初始兵力为 A，连续 N 旬粮尽，则实测剩余兵力：

`A × 0.76^N`

即每个粮尽旬约保留上旬兵力的 76%。

来源：https://w.atwiki.jp/sangokushi11/pages/92.html

## 8. 补给与输送

- 输送队是地图单位。
- 可运送兵、金、粮、兵装。
- 补兵后气力按旧兵与新兵人数加权平均。
- `[PK]` 木牛流马提高输送移动。

## 9. 技巧系统

无印已有 8 系：枪、戟、弩、骑、练兵、发明、防御、火攻。PK 继承并新增第九系“内政”。

火攻系不是 PK 新增。

## 10. 技巧补丁版本差异

`[VANILLA-PC]` 少数技巧在 Ver1.0 与后续补丁的数值不同，规则数据必须允许 `patchVersion`。

游民星空整理明确记录：

- 枪兵锻炼：后续版战法伤害 **110%**；Ver1.0 为 **120%**。
- 戟兵锻炼等同类一级强化，后续资料按 110%。
- 精锐枪兵：后续基础攻防各 +10，移动 22→28（+6）；Ver1.0 资料记录移动只 +2。
- 精锐戟兵同样存在早期移动加成差异。

来源：https://www.gamersky.com/handbook/200806/114545.shtml

### 兵粮袭击

`[COMMON/后期PC][empirical-high]`

枪兵技巧“兵粮袭击”：

`抢粮 = 攻击力 × R`，其中 `R` 为 1–2 的随机值。

同时受“每 2 名士兵最多抢 1 粮”的上限约束；若兵力不足则按 `士兵/2` 封顶。敌方扣粮与己方获得粮对应。

来源：https://www.gamersky.com/handbook/200806/114545.shtml
