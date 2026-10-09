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

`[source-listing-reconstruction][resolved-input-only]`

[生产数量显式binary32限定核](production-quantity.md)依据固定公开 `005C63D0..005C64CD` 原88条/254字节；两套MOD隔离，不认证完整stock命令或跨版本。

- native signed32类型<0或>11返回0，5..11返回1，不读取后续helper；0..4扫描精确三槽，至少一槽有效即可，首槽可null
- 有效槽智力getter只取AL（0..255），技能helper以完整EAX非零判断；type0查询-1、1..3查询80、4查询81，不能靠业务名跳过type0 helper
- 基础量 `(最高AL+AL总和+200)*5`，技能存在先×2，再乘调用者已确认的设施ST0，向零转换后才按difficultyWord==2且cityVirtualEax==0翻倍
- 本API只接受显式bitword 3F800000/3F99999A/3FC00000，不从设施Lv自动推导；完整设施选择和常量bytes仍缺
- 原体没有9000上限或1010最低值：有效AL0可返回1000，AL全100加技能/1.5/超级可返回18000，AL全255同条件可到36600；返回量不等于后续库存writer实际入库量

旧[日文Wiki](https://w.atwiki.jp/sangokushi11/pages/74.html)观察公式 `((M+100)+(S-M)/2)*10` 在不提前取整时与新基础式代数等价；旧“结果四舍五入、最低约1010、上限9000”不再作为本源规则。全无效槽的原生INT32_MIN哨兵路径本API不支持，不伪造成原生0。名声、政治和MOD2直接特产倍率都不进入本原体；getter/skill/validator/设施/virtual/完整命令与实际库存裁剪仍缺。

### 2.1 生产价格的独立限定核

[生产价格捕获输入整数核](production-price.md)采用005C6350..005C63C0公开原体：原45条/113字节与另列MOD6条/14字节隔离。两层validator已通过，类型+0x98的uint16原价先保存，再观察特产helper raw EAX；仅AL非零时floor(8p/10)。EAX256不折、257折；1金折后0合法，没有最低1。源C1FA02为SAR EDX,2。不是按“锻冶700/厩舍800”硬码费用，也不决定上一节产量、完整生产命令、实际扣钱/库存writer或耗时。表/ID/helper原体与stock/跨版本仍缺，证据限定为source-listing-reconstruction。

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

### 4.8 出征面板规则与 Runtime 写入要分层（P0-9 更新）

专项见 [44-troop-resource-transaction-exactness.md](44-troop-resource-transaction-exactness.md)。

当前已经恢复的函数层级应明确分开：

~~~text
00647250 / sub_647250
  战斗部队兵力 draft

00647AC0 / sub_647ac0
  战斗部队钱粮等 resource draft
  其中 00647D8E/9E = 粮上限
       00647E2A/3A = 金上限

00615790 / sub_615790
00615A10 / sub_615a10
  输送 cargo draft

未知函数
  实际 commit finalizer

未知函数
  进入据点 / 解散后的 return finalizer
~~~

因此实现必须继续拆成：

~~~text
validateSortieDraft()
commitSortieResources()
createRuntimeTroop()
~~~

不能把 slider 上限函数直接当资源扣除函数。

### 4.9 战斗/输送 runtime 容量边界

战斗部队：

| 资源 | 上限 |
|---|---:|
| 金 | 10000 |
| 粮 | 50000 |

输送队：

| 资源 | 上限 |
|---|---:|
| 兵 | 60000 |
| 金 | 100000 |
| 粮 | 500000 |
| 普通兵装数量 | **100000（reverse-history-high）** |

其中输送兵装 100000 的关键证据来自早期 SIRE 修复记录：

~~~text
“运输队兵装上限设定超过100000后，
补给过后会变回100000”
~~~

与原地址表：

~~~text
006157C1 / 006157D8   出阵兵装上限
004962CF / 004962D6   runtime兵装上限
00496306/0D/28/2F    补给后兵装上限
~~~

相互吻合。

所以旧“运输兵装每种最大容量完全未知”需要收窄为：

~~~text
普通数量型 cargo 上限 100000：高置信
攻具 / 高级舰船件数型逐路径：仍 open
~~~

原研究还明确注明部队兵力底层无法突破 65535；输送设计上限 60000 低于该 hard boundary。

### 4.10 commit 时资源语义：守恒确定，指令顺序 open

原作 resource mutation primitives 已定位。

据点侧：

~~~text
00486B10 GetSPTroopStrength
00486C80 GetSPMoney
00486DF0 GetSPFood
00486950 GetSPEquipment

00487230 SetSPTroopStrength
00487310 SetSPMoney
004873F0 SetSPFood
004874D0 SetSPEquipment

004AE2A0 IncreaseSPMoney
004AE300 AdjustSPFood
004AE3C0 AdjustSPSoldier
004AE430 AdjustSPEquipment
~~~

部队侧：

~~~text
00496010 GetTroopStrength
004954E0 GetTroopEquipmentNum
00496280 SetTroopFood

004AE4A0 AdjustTroopStrength
004AE510 AdjustTroopMoney
004AE570 AdjustTroopFood
~~~

因此“据点资源转入 runtime troop”这一守恒语义可以固定：

~~~text
source building:
  - selected troops
  - selected money
  - selected food
  - selected equipment

runtime troop:
  + same selected resources
~~~

但还不能写死原 EXE 的具体调用顺序或 rollback。

### 4.11 兵装扣除模型必须按数量型 / 件数型分开

~~~text
ID0 剑：
  默认装备，不按兵数扣库存

ID1～4 枪/戟/弩/马：
  数量型
  selected equipment = selected troops

ID5～8 冲车/井栏/投石/木兽：
  件数型
  1 支对应部队占 1 件（documented/empirical-high）

ID9 走舸：
  默认水上 profile

ID10～11 楼船/斗舰：
  件数型
  1 支高级舰船部队占 1 艘（documented/empirical-high）
~~~

ID1～4 的“等量”同时有 UI 代码和官方/实机行为支持。

件数型“扣1”的业务行为很稳定，但原 EXE decrement caller 尚未公开，因此仍不能标 opcode-exact。

### 4.12 回城资源入库与容量溢出

原作长期实机行为确认：

- 部队进入己方据点后，持有兵、金、粮会并入据点；
- 存活的攻具/高级舰船可重新进入库存，不是一出征就永久消耗；
- 若入库后超过据点容量，会提示超出部分损失。

因此第一版兼容接口至少要有：

~~~text
accepted = min(incoming, capacity-current)
overflow = incoming-accepted
~~~

并保留：

~~~text
overflow lost / warning
= empirical-high
~~~

但以下仍 open：

- 普通枪戟弩马回城到底按 current troops、独立 equipment quantity 还是伤兵链返还；
- wounded troops 与兵装先后；
- 多种资源同时满仓的逐类处理顺序；
- 攻具/舰船满仓的 exact behavior；
- enter-building finalizer 地址与完整 body。

### 4.13 现代重制实现只作架构对照

当前 sango_infinity 在玩家出征时直接：

~~~text
扣陆/水 costItems
扣 city troops / food / gold
EnsureTroop
~~~

输送则：

~~~text
扣 city troops / food / gold
Remove transport itemStore
EnsureTroop
~~~

回城再将 troop 资源加回据点。

这是一套合理 reconstruction，但不是原版 San11PK.exe 逐指令证据；尤其 woundedTroops 的兵装返还、rollback、overflow 不可反向写成 fidelity。

### 4.14 E1 当前结论（P0-9 更新）

已经锁定：

- 战斗/输送为独立 TroopType；
- 1主将+最多2副将；
- 战斗部队最小1兵；
- 战斗部队最大兵数的主将/据点/数量型兵装三重约束；
- 剑不按士兵库存；
- 枪戟弩马数量型；
- 攻具与高级舰船件数型；
- 战斗金10000、粮50000；
- 输送兵60000、金100000、粮500000；
- 输送普通兵装 quantity cap 100000（reverse-history-high）；
- troop strength 底层 65535 hard boundary；
- 据点/部队两侧资源 mutation primitive 已恢复；
- UI/draft 函数边界与 finalizer 分层；
- commit 的资源守恒语义；
- 回城资源入库与容量 overflow 损失行为；
- 现代重制 commit/return 顺序已隔离为非 fidelity。

仍 open：

- 玩家战斗出征 commit finalizer；
- 玩家输送出征 commit finalizer；
- 原 EXE 各资源扣除顺序与 rollback；
- 件数型攻具/高级舰船扣1的逐指令 caller；
- transport 12种兵装是否完全共用100000路径；
- return/disband finalizer；
- 数量型兵装回城精确返还量；
- 伤兵与兵装返还顺序；
- 满仓逐资源裁剪顺序；
- 出征武将完整资格过滤；
- Vanilla / PS2 / Wii 差异。

来源：
- 311MemoryResearch 出征窗口、地址资料；
- 311SireCustomizedPackageDev struct_troop / resource helpers；
- 311resource IDB functions.csv；
- 官方 PK 手册；
- 日文 Wiki《戦争》；
- SIRE 原作者早期 reverse-history；
- 2006 原作容量溢出实测。

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

### 5.5 统武关系 helper：P0-10 收紧后的证据边界

专项见 [45-deputy-rounding-exactness.md](45-deputy-rounding-exactness.md)。

PC 地址资料已经直接给出两个原指令级 divisor：

```text
00495B65  C1 F8 02  -> sar eax,2
普通关系：正差值 /4，向下截断

00495B79  D1 F8     -> sar eax,1
亲爱关系：正差值 /2，向下截断
```

所以对副将高于主将的情况：

```ts
normal =
  main + floor((sub-main)/4)

love =
  main + floor((sub-main)/2)
```

副将不高于主将时不会拉低主将。

夫妻 / 义兄弟此前主要依赖 PS2PK 精确实测；P0-10 又加入 PC SIRE 原作者基于原版代码的规则说明：原版普通副将只得到部分统/武加成，而义兄弟和夫妻是“最高统武值”的例外。因此这一项升级为：

```text
夫妻 / 义兄弟：
  combined = max(main,sub)
  PC reverse-author documented-high
  + PS2 empirical-exact
```

血缘仍保持：

```text
main + floor((sub-main)/3)
```

但其 PC /3 指令尚未公开，所以证据等级是：

```text
PS2 empirical-exact
+ cross-platform-high
+ PC opcode open
```

当前关系表：

| 副将→主将关系 | 统/武补正 | PC证据 |
|---|---|---|
| 夫妻 / 义兄弟 | 直接取更高值 | PC原版规则说明高置信；逐指令仍open |
| 亲爱 | 差值×1/2 | **PC opcode exact** |
| 血缘 | 差值×1/3 | PC opcode open |
| 普通 | 差值×1/4 | **PC opcode exact** |

两名副将的 bonus **不会相加**：

```ts
result =
  max(
    combine(main, sub1),
    combine(main, sub2)
  )
```

`00495AB0` 完整 PC body 仍值得继续恢复，主要剩血缘、夫妻/义兄弟和关系方向性分支。

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

### 5.12 最终浮点取整：P0-10 已闭合为 toward-zero truncation

攻击、防御、建设力最终都调用：

```text
00707A74 ConvertFloatToIntegerAndStoreInEAX
```

P0-10 对原 IDB 的内部 label 与 Microsoft CRT 源码交叉后确认，该函数就是 MSVC `_ftol2`：

```text
ftol2.asm - truncate TOS to 32-bit integer
```

所以精确语义是：

```ts
san11FloatToInt(x) = truncTowardZero(x)
```

对 E2 的正常正 raw 值：

```text
truncate toward zero
==
floor
```

因此：

```ts
attack =
  max(1, floor(attackRaw))

defense =
  max(1, floor(defenseRaw))

construction =
  max(1, floor(constructionRaw))
```

现在是 **PC-PK1.1 exact final conversion**，不再只是兼容模型。

仍 open 的是“浮点转换之前”的 bit-level 边界，例如 x87 extended intermediate precision / 原常量精确 bit pattern；不要把它与已经闭合的最终转换混为一项。

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

- `00495AB0` 完整逐指令文本，主要剩血缘1/3、夫妻/义兄弟full-share及关系方向性分支；
- x87中间 extended precision / 浮点常量 bit-exact 极端边界；
- Vanilla / 主机版是否在关系 helper、混乱0.8、输送0.4/1/3与转换helper上完全同值。

来源：

- 311MemoryResearch：`内存资料/函数[计算部队属性].txt`；
- 311MemoryResearch：`内存资料/地址资料.txt`；
- 311SireCustomizedPackageDev：`00496570 GetTroopCapabilities`、`00495AB0`、`00495B90` 及人物属性 helper；
- 日文 Wiki《検証》：副将关系1/2、1/3、1/4与适性实测；
- 日文 Wiki FAQ / 中文早期实测：义兄弟/夫妻取最高、智力取最高。

## 6. 训练与气力

`[PC-PK1.1][reverse-engineered training formula + morale caps + command side effects]`

E4 完整专项见 `19-training-morale.md`。

### 6.1 据点气力上限

城市、港、关：

```text
无熟练兵：100
有熟练兵：120
```

`00487010 GetSPMoraleLimit` 与 `00488010 IncreaseSPMorale` 都按同一上限处理。熟练兵只提高上限，不会把现有气力自动抬高。

### 6.2 单次训练效果

`005C3F50` 对最多3名执行武将只读取**武力**。

定义：

```ts
S = sum(executors.map(x => x.war))
M = max(executors.map(x => x.war))
D = min(100, 20 + floor(garrisonTroops / 2000))

gain = floor((S + M) / D) + 3
```

最高武力者等价于被计算两次。

PK 城市若有练兵所：

```ts
gain = floor(gain * 3 / 2)
```

最终实际增加量：

```ts
actualGain = min(gain, moraleCap - currentMorale)
```

因此旧 provisional `5 + floor(统率*0.15)` 撤回：变量和结构都不对。

### 6.3 训练命令副作用

`005C4220` 已确认：

- 最多3名执行武将；
- 每名执行武将武力经验 +2；
- 每名执行武将功绩 +50；
- 执行者设为已行动；
- 据点设为已训练；
- 普通行动力 20；
- PK 城市有军事府时 10；
- 当前执行函数没有固定金钱支出。

训练获得技巧点取决于**实际增加气力**：

```ts
techniquePoints = floor(actualGain / 2) + 5
```

所以旧“训练固定+7～10技巧P”不是完整规则。

### 6.4 部队气力上限与野外恢复

部队气力同样：

```text
无熟练兵：100
有熟练兵：120
```

每旬通用恢复：

```ts
if (inFriendlyMusicPlatformRange) {
  moraleGain = hasPoetry ? 20 : 10
} else if (hasMusic) {
  moraleGain = 5
} else {
  moraleGain = 0
}
```

- 军乐台：范围2，+10；
- 诗想：在军乐台范围内额外+10，即合计+20；
- 奏乐：不在军乐台恢复时+5，不与军乐台叠加。

此前“城内驻军每旬自然+5”未找到原EXE依据，撤回；普通野外部队也不自行补一个自然恢复值。

### 6.5 主要气力特技

- 扫荡：攻击命中后敌军 -5；
- 威风：攻击命中后敌军 -20；与扫荡同队时威风优先，不叠成 -25；
- 昂扬：击破敌部队，自身 +10；
- 怒发：受到敌方战法后，自身 +5。

最终仍受0与100/120边界控制。

单挑胜/负对应地图部队气力 +15/-15；单挑被拒绝时提议方+10、拒绝方-5。单挑内部斗志是另一套属性。

### 6.6 补兵时气力

补兵时按新旧兵力人数做气力加权平均；不能实现成“补兵后气力不变”。精确资源提交 caller 仍属于 E1 补给事务缺口。

### 6.7 E4 尚存缺口

- 已交付：[82-training-lifecycle-source-profile.md](82-training-lifecycle-source-profile.md)已恢复 `005C4100` gate、参数/武将helper、`0059C423→00598630` 全局建筑/武将reset及非连续direct-clear尾块，并恢复 `0059C330→0059C2A0→0059A230` 野外气力tail-jump链；不再把这些整体列为未知
- 仍缺：clean-stock PK独立hash/bytes、完整任务资格与属性合成、AP恢复在完整scheduler中的位置、其余旬处理与Vanilla/主机逐版本等价。两份IDB均MOD关联，局部调用序不证明完整EndTurn；reset后任务处理还可能重新置acted
- 下一证据：独立原作样本与完整caller/任务/属性函数链。Train/限定EndTurn只适配当前合成状态域，不能据此替代原作全局重置或调度认证

## 7. 兵粮消耗

`[PC-PK1.1][reverse-engineered旬级dispatcher + building/troop food formulas]`

E5 完整专项见 `20-food-consumption.md`。

### 7.1 旬级调度

`0059BF40` 每旬先遍历城市/港/关，再遍历地图部队。只有当前兵粮>0的对象才进入耗粮函数；本旬扣到0时会记录粮尽对象用于提示。

### 7.2 城市 / 港 / 关驻屯

`0049D200`：

```text
驻屯基础耗粮 = 兵力 × 0.025
≈ 兵力 / 40 / 旬
```

最终调用 `00707A74` 整数化；若兵力>0而结果<=0，最低耗粮1。

港/关内存在“屯田”武将时，旬级 caller 直接跳过整个耗粮函数：

```text
港/关 + 屯田 => 0耗粮
```

城市不吃这条屯田免粮。

### 7.3 野外战斗部队（P0-12 bit-exact）

`0049D2E0` 对战斗部队调用 `0049D180`，后者返回**一个**防御系列设施 type；因此耗粮只选一个 multiplier，重叠设施不叠乘。

原 float32：

| 环境 | bits | multiplier | 10000兵 |
|---|---|---:|---:|
| 无 | `0x40000000` | 2.0 | 1000 |
| 阵 | `0x3FD55555` | 1.6666666269302368 | 833 |
| 砦 | `0x3FAAAAAB` | 1.3333333730697632 | 666 |
| 城塞 | `0x3F800000` | 1.0 | 500 |

再乘原 `0.05f = 0x3D4CCCCD`，最后由 `_ftol2` 截断。

所以18000兵的精确参考：

```text
无 1800 / 阵 1499 / 砦 1200 / 城塞 900
```

`0049D180` 在不同等级设施重叠时究竟选谁仍 open；兼容 fallback 可暂用最高级优先，但不得标 original exact。

### 7.4 输送队

`TroopType=1`：

```text
兵力 × 1.0 × 0.05
= 兵力 / 20 / 旬
```

源码在运输队分支直接跳过阵/砦/城塞判定，因此：

**运输队不获得阵、砦、城塞的减粮效果。**

### 7.5 着火额外烧粮

野外部队：

```ts
fireFood =
  currentFood
  * (6 - troopPolitics * 0.05)
  * 0.01
```

据点：

```ts
fireFood =
  currentFood
  * (6 - prefectPolitics * 0.05)
  * 0.01
```

然后与正常兵力耗粮相加。

正常政治0～100时：

```text
政治0   -> 当前存粮额外约6%
政治100 -> 当前存粮额外约1%
```

无太守据点按政治0处理。运输队着火也会进入这条附加耗粮路径。

### 7.6 粮尽逃兵：原公式仍open，旧0.76降级

`0059BF40` 对进入旬时已经0粮的部队直接跳过；如果本旬扣到0，也只加入粮尽消息列表，没有在本函数扣兵。

所以：

```text
food consumption/message
!=
starvation troop loss
```

粮尽掉兵必定走另一条每回合处理链。

官方/实机确认：

```text
food=0 → 士兵下降，持续可导致部队消灭
```

但原 PC-PK1.1 函数/公式尚未找到。

旧：

```text
A × 0.76^N
```

经 P0-12 回查缺乏可验证来源，现降级为 `legacy-compatibility-only`；严格 fidelity 不使用。

`00599AA0` 是“围城+断粮的据点人口衰减”，不是野外部队 starvation。

### 7.7 E5 当前剩余缺口

- `0049D180` 多个不同等级防御设施重叠时的 winner priority；
- 粮尽逃兵的原函数、闭式与RNG；
- Vanilla / 主机版阵砦城塞减粮常量是否逐项一致。

## 8. 补给与输送

`[PC-PK1.1][reverse-engineered capacity/reward addresses + confirmed PC/CS gameplay]`

E6 完整专项见 `21-supply-transport.md`。

### 8.1 输送到据点与野外补给是两个动作

```text
输送队到达城市/港/关：
  功绩 +200
  PC地址 004BF522

输送队给野外己方战斗部队补给：
  功绩 +100
  率领者统率经验 +2
```

不要把两套奖励同时结算。

### 8.2 输送队容量

沿用 E1：

```text
兵力 60,000
金   100,000
粮   500,000
武将 1主将+最多2副将
```

兵装仍保存在12组 EquipmentStatus 中。逐类型兵装容量地址已定位：

```text
006157C1 / 006157D8   出阵UI
004962CF / 004962D6   运行时
00496306 / 0D / 28 / 2F  补给后封顶
```

但这些地址的具体兵装ID→数值语义还未完整展开，所以不能伪造逐类容量。

### 8.3 给战斗部队补兵

目标仍受：

```text
GetTroopStrengthLimit
GetTroopMoneyLimit
GetTroopFoodLimit
```

约束。

枪/戟/弩/马补兵还要求输送队同时提供等量当前兵科兵装：

```ts
addTroops = min(
  targetStrengthLimit - targetStrength,
  supplierStrength,
  supplierMatchingEquipment
)
```

剑兵没有“一兵一剑库存”约束；攻具/舰船仍是部队级件数装备，不按补兵人数消耗。

### 8.4 补兵后的气力

核心语义为兵数加权平均：

```text
newMorale =
(oldStrength*oldMorale + addedStrength*addedMorale)
/
(oldStrength+addedStrength)
```

日文Wiki实测：

```text
2500兵 气力0
+2500兵 气力100
=> 5000兵 气力50
```

`004B9840 GetBuildingCombinedStrength` 也证明原程序对据点增兵采用“原兵力/气力 + 新兵力/气力”混合模型。

野外补给的小数整数化 helper 尚未恢复，所以非整除边界继续 open。

### 8.5 PC手动补给 vs 自动补给

PC：

- 与目标相邻后主动选择“补给” → 可用滑块自行调节补给量；
- 直接把己方部队作为输送移动目标 → 到达后自动按目标剩余容量尽量补给。

CS/主机版不能自由调量，长期实测是固定规则；该套数字不得覆盖 PC-PK1.1。

### 8.6 主机版固定补给只作版本资料

`[CS][empirical-high]`

长期实测：

```text
兵：最多3000
金：最多1000
粮：通常按补入兵数，并考虑给输送队留下行军粮
```

如果运输方士兵、金或对应兵装不足，则按实际可提供量。

### 8.7 输送目标限制和损失边界

长期实测：

- 普通补给目标必须是战斗部队；输送队不能再被另一输送队补给；
- 输送队因粮尽/地形损耗而消灭时货物消失；
- 被敌军击破时货物可被敌军掠夺。

这些目前没有对应的完整 PC finalizer，因此标 empirical-high，不自行写掠夺比例。

### 8.8 到达据点的资源事务仍 open

据点有完整的兵/金/粮/兵装 getter、limit、setter/adjust helper，因此输送到达必须服从据点容量体系。

但完整 arrival finalizer 未恢复，所以这些仍不能写死：

- 兵/金/粮/兵装的写入顺序；
- 超上限货物怎么处理；
- 攻具/舰船超限时处理；
- 运输部队解散/武将返回与资源写入的精确顺序。

### 8.9 行动力

已定位：

```text
005DB840 GetExpeditionActionPointCost
005DB107 军事府：输送AP减半
005DB86E 军事府：出征AP减半
```

所以 PK 城市有军事府时输送 AP 减半是源码级确认。

本轮没有恢复 `005DB840` 完整函数体，不在这里伪造基础 AP 数值。

### 8.10 E6 当前 open

- PC-PK1.1 野外补给完整 finalizer；
- 输送抵达据点完整 finalizer；
- 12类运输兵装逐类型容量；
- 补兵气力非整除时的取整；
- 自动补给的逐资源优先级；
- 超限剩余货物的处理；
- “输送队不可被补给”的 PC hard-gate 地址；
- 被击破时货物掠夺原函数与比例；
- `005DB840` 完整基础AP函数；
- Vanilla/CS除已确认UI差异之外的内部差异。

## 9. 技巧系统

`[PC-PK1.1][36-technique ID map + reverse-engineered constants + source-graded effects]`

E7 完整专项见 `22-techniques.md`，结构化数据见 `docs/sources/techniques.json`。

### 9.1 树结构

无印8系×4级，PK追加第9系内政：

```text
0..3   枪兵
4..7   戟兵
8..11  弩兵
12..15 骑兵
16..19 练兵
20..23 发明
24..27 防卫
28..31 火攻
32..35 内政（PK）
```

每系必须按级顺序研究。

### 9.2 研究成本

| Lv | 技巧P | 金 |
|---:|---:|---:|
| 1 | 1000 | 1000 |
| 2 | 2000 | 2000 |
| 3 | 3000 | 5000 |
| 4 | 5000 | 10000 |

研究使用3名武将，消耗50AP；“指导”使研究金减半。技巧P硬上限10000。

研究完成对应能力经验：

```text
消费技巧P / 100
=> +10 / +20 / +30 / +50
```

枪戟弩骑看统率，练兵看武力，发明/火攻看智力，防卫/内政看政治。

研究时间**不是固定30/60/90/120日**。超级难度当前只恢复了70/140/210/280能力和分档的部分实测矩阵；完整函数和其他难度仍open。

### 9.3 兵科锻炼与精锐必须分两层

枪/戟/弩/骑Lv1：

```text
普攻/战法/支援伤害 ×1.10
```

Lv4精锐：

```text
伤害层 ×1.15
并覆盖Lv1的1.10
```

不是：

```text
1.10 × 1.15
```

同时 E3 面板层另有：

```text
精锐四兵科基础攻/防 +10
枪/戟/弩移动 +6
骑移动 +2
```

因此“面板强化”和“实际伤害倍率”是两条不同链。

### 9.4 主要源码级技巧常量

- 矢盾：30%，原版默认不挡战法；
- 大盾：30%，原版默认不挡战法；
- 强弩：射程+1；
- 良马产出：骑兵移动+4；
- 骑射：普通射程+1；
- 熟练兵：气力上限100→120；
- 军制改革：带兵+3000；
- 云梯：普通陆军对建筑×1.4，兵器/舰船×1.2；
- 车轴强化：兵器移动+4；
- 城壁强化：据点最大耐久+3000；
- 防御强化：据点反击伤害×2；
- 神火计：火计距离+2，即1→3；
- 木牛流马：输送移动+3；
- 政令整备：50%免除季初自然治安下降；
- 人心掌握：caller的AX>=1跳过已核，2/3依赖均匀0..2随机约定；RNG/stock边界见[忠诚静态证据](natural-loyalty-candidate-boundary.md)。

投石开发解锁投石/斗舰/投石台；石造建筑解锁石墙/石兵八阵；设施强化解锁砦/连弩楼；火药/爆药炼成解锁对应高级火陷阱。

爆药炼成原PC代码存在已知判定对象BUG，实际版本差异留 E8，不在 E7 把“设计效果”强行当作所有PC补丁的实机行为。

### 9.5 E7 当前 open

- 技巧研究时间完整函数；
- 超级70/140档与非超级完整矩阵；
- 兵粮袭击随机闭式；
- 应射完整PC caller、attack-type数值、水上profile与连战链序；
- 技巧研究完成功绩的PC逐地址；

## 10. 技巧补丁版本差异

`[version-scoped][official patch history + retrospective guides + PC-PK reverse]`

E8 完整专项见 `23-technique-patch-differences.md`，结构化版本差异见 `docs/sources/technique-version-deltas.json`。

### 10.1 不能只有 vanilla / pk 两个开关

技巧效果至少需要：

```text
rulesetVersion
patchVersion
fixProfile
```

原因：

- Vanilla Windows 1.0 与后期补丁存在明确技巧数值差异；
- PK 有独立的官方更新链；
- 逆向资料中的 SIRE/社区修复不能冒充官方补丁。

### 10.2 Vanilla Ver1.0 → 后期资料的明确差异

| 技巧 | Ver1.0 | 后期资料 |
|---|---:|---:|
| 枪兵锻炼 | 伤害 +20% | +10% |
| 精锐枪兵移动 | +2 | +6 |
| 精锐戟兵移动 | +2 | +6 |
| 精锐弩兵移动 | +2 | +6 |
| 云梯 | 攻城 +20% | 后期约140% |
| 工兵育成 | 恢复 400% | 后期概括250% |
| 防御强化 | 反击 120% | 200% |

注意：官方 Ver1.2 说明确实写“伤害平衡调整”，但没有逐技巧常量表。**不能把上述每一条都擅自标成“1.2才改”**；精确 transition patch 继续 open。

也不能因为戟/弩/骑 Lv1 后期资料写“同枪兵锻炼”，就自动推断它们在 Vanilla 1.0 全部也是 1.20。当前明确的 1.0=1.20 只锁枪兵锻炼。

### 10.3 PK reverse 基准独立

本项目 PC-PK reverse 基准继续使用：

```text
锻炼伤害 = 1.10
精锐伤害 = 1.15，覆盖1.10

精锐基础攻防 +10
精锐枪/戟/弩移动 +6
精锐骑移动 +2

良马 +4
军制改革 +3000
云梯：普通陆军建筑伤害1.4，兵器/舰船1.2
车轴 +4
防御强化反击 ×2
木牛流马 +3
```

Vanilla 1.0 差异不得覆盖这一 profile。

### 10.4 工兵育成 PK1.1 已闭合

`00599710` 原函数现已恢复出两条相对倍率：

```text
内政设施：
  有工兵育成 ×0.30
  无工兵育成 ×0.15
  => 相对 ×2

城市/港/关：
  无工兵育成路径额外 ×0.4
  有工兵育成跳过该衰减
  => 相对 ×2.5
```

所以后期攻略“250%”只准确概括固定据点；内政设施是精确 ×2。

### 10.5 爆药炼成：原BUG和社区修复必须分profile

研究目标 PC-PK 二进制的原逻辑存在判定对象错误：

```text
原BUG：
  被烧的一方拥有爆药炼成
  -> 火伤加成

设计/社区修复：
  点火的一方拥有爆药炼成
  -> 火伤加成
```

社区修复地址：

```text
005B1227
005B1239
```

因此：

```text
pk-pc-reverse
  保留原BUG

pk-pc-community-fixed
  显式启用修复
```

官方 PK 更新说明目前没有列出这项修复，所以不能把社区修复默认为官方 fidelity。

### 10.6 矢盾 / 大盾挡战法也是社区可选修改

逆向资料直接给出：

```text
矢盾对战法有效：修改005AE01B
大盾对战法有效：修改005AE083
```

反向证明原版默认不挡战法。

### 10.7 E8 当前 open

- Vanilla 1.0 / 1.1 / 1.2 EXE 技巧地址二进制 diff；
- 戟/弩/骑 Lv1 在 Vanilla 1.0 是否也为1.20；
- Vanilla 1.0 工兵育成400%的内部双支路；
- 爆药炼成BUG是否被某地区官方发行版静默修复；
- 主机版逐项技巧常量差异。

## 11. 兵粮袭击

`[PC-PK1.1 reverse trigger path + documented/empirical quantity + compatibility fallback]`

E9 完整专项见 `24-food-raid.md`，结构化证据见 `docs/sources/food-raid.json`。

### 11.1 原调用路径

PC主攻击函数：

```text
005B03F5 target troop
005B03F7 attacker troop
005B03F9 call 005ADB20
```

`005ADB55` 锁定 techId=1。

该调用只在“目标是部队”的分支，因此不对设施触发。

普通攻击和战法共享这段附加效果；**反击支路明确跳过兵粮袭击**。

### 11.2 数量主模型

长期攻略与后续实测一致：

```ts
raw = attacker.attack * R
R ∈ [1, 2]

raid = min(
  raw,
  floor(attacker.troops / 2)
)
```

这里的 `attack` 是当前部队攻击面板，不是本次实际伤害。

参考：

```text
攻击84，兵10000 -> 约84..168
攻击105，兵10000 -> 最大210
攻击100，兵200   -> 被兵数/2封顶为100
```

### 11.3 原 RNG 尚未恢复

`005ADB20` 函数体尚未公开，所以不能声称原EXE一定是0.1一档、连续浮点或其他分布。

兼容 fallback 采用：

```ts
k = uniformInteger(10, 20)
raw = floor(attack * k / 10)
raid = min(floor(troops/2), raw)
```

这是 `compatibility-reconstruction`，不是 reverse-engineered。

### 11.4 资源转移边界

正常情况下攻略明确为敌方减N、己方加N。

但目标粮不足或攻击方已接近50000粮上限时，原helper如何裁剪仍open。

非fidelity安全fallback：

```ts
actual = min(
  raid,
  target.food,
  attacker.foodLimit - attacker.food
)
```

确保不凭空造粮；未来恢复 `005ADB20` 后由原行为替换。

### 11.5 其他边界

已确认：

- 目标必须是部队；
- 普攻与战法进入；
- 反击不进入。

empirical-high：

- 连击两次攻击可造成两次抢粮。

仍 open：

- 支援攻击；
- 水上active舰船profile；
- 战法失败；
- 大盾/矢盾等把伤害置0时是否仍抢；
- 原RNG粒度；
- 满粮/缺粮原作裁剪。



## 12. 应射

`[PC-PK1.1 address-level + documented/empirical-high behavior]`

E10 完整专项见 `25-response-fire.md`，结构化证据见 `docs/sources/response-fire.json`。

### 12.1 技巧ID与入口

```text
00584DC8 = 应射 / 还射
techniqueId = 9
```

当前没有完整 caller 逐指令，因此不能把下面所有边界都标成 PC disassembly。

### 12.2 核心条件

当前兼容判断结构：

```ts
defender.force.hasTechnique(9)
&& defender.currentProfile === CROSSBOW
&& incomingAttack.isArrowFamily
&& incomingAttack.kind !== SUPPORT
&& !defender.isConfused
&& !defender.isFalseReport
&& canLegallyAttack(defender, attacker.position)
```

这意味着：

- 应射不是“所有远程攻击都反击”；
- 防守主体是弩兵；
- 必须满足正常射程/地形攻击合法性；
- 支援攻击不触发；
- 混乱/伪报不能正常应射。

### 12.3 可触发攻击

高置信包括：

- 弩兵间接普通射击；
- 骑射；
- 舰船箭类普通攻击；
- 弩战法：火矢 / 贯矢 / 乱射；
- 井阑/舰船等火矢类战法。

火矢通常不会被反击，但应射弩兵是明确例外。

### 12.4 射程与地形

应射不能无视正常攻击范围：

```text
攻击者在3格
防守方弩射程只有2
=> 不能应射
```

防守方拥有强弩时，当前合法射程扩大，对应可应射距离也扩大。

攻击者站在森林、而防守弩兵没有合法攻击森林的能力时，也会因为无法攻击源格而不能应射。

### 12.5 回应形式与互动

应射更接近“获得一次合法反击机会”，不保证固定弩射动画；邻接的贯矢/乱射卷入目标，历史实测可出现近身回应。

PCPK“急袭”可50%避免应射反击伤害，说明应射伤害走反击伤害语义。

PS2PK 历史实测存在双方同时“应射+连战”形成长链，但 PC 的精确链顺序/深度尚未恢复。

### 12.6 E10 open

- `00584DC8` 周边完整PC caller；
- 精确 attack-type / unit-type 数值比较；
- 水上 active profile 是否保留陆上弩兵应射；
- PC 双方应射+连战的精确链；
- 各战法 primary/collateral 的逐路径差异；
- Vanilla / PS2 / Wii 的逐项等价性。

