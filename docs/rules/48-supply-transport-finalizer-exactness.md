# P0-13 野外补给 / 输送抵达 finalizer / 气力加权 exactness

更新：2026-10-03。

## 1. 本轮结论

P0-13 继续拆开两条原本容易混在一起的路径：

```text
A. 输送队 → 野外己方战斗部队补给
B. 输送队 → 城市/港/关抵达并解散
```

本轮可收紧为：

```text
transport-arrival-function-range-resolved
transport-arrival-merit-200-pc-exact
transport-arrival-overflow-loss-empirical-high
wild-supply-manual-auto-separation-high
wild-supply-target-capacity-high
wild-supply-matching-equipment-high
morale-weighted-mean-core-high
morale-rounding-open
wild-supply-finalizer-open
transport-arrival-field-order-open
```

## 2. 004BF522 不再是孤立地址：它位于 sub_4BF1F0

311MemoryResearch 已标：

```text
004BF522
输送队抵达据点
功绩 +200
```

311resource 的原 IDB functions.csv 进一步确认：

```text
004BF1F0 sub_4bf1f0
...
004BF522
...
004BF6F0 next function
```

因此可以确定 004BF522 ∈ sub_4BF1F0。也就是“输送队抵达据点 +200 功绩”属于一个约 0x500 byte 的到达/据点交互处理函数。

当前最安全命名是：

```text
sub_4BF1F0
= contains transport-arrival completion path
```

不要直接把整个函数改名成 TransportArrivalFinalizer，因为完整 body / 其他 branch 尚未公开。

相较旧状态，可以把“输送抵达 finalizer 地址完全未知”收窄为：

```text
arrival finalizer family / containing function known
exact field-write body open
```

## 3. 到达据点 +200 功绩：PC-PK1.1 地址级 exact

原地址 004BF522 明确为输送队抵达据点功绩 +200。日文 Wiki 功绩表也独立记录“輸送 到着 200”。

因此 onTransportArriveAtSP() 的奖励量可以标 PC-PK1.1 exact/high。

它与野外补给的 +100功绩 / +2统率经验 是不同动作，不能一次同时发两套奖励。

## 4. 输送抵达据点的容量溢出：超出部分会消失

2009 PC 玩家直接报告：输送到据点时出现“金钱和士兵会消失”的系统提示，原因是目标据点已经达到容量上限。长期玩家也记录 COM 即使目标已经满仓仍会继续输送，造成大量物资损失。

所以 transport arrival 的容量行为可以升级为：

```text
destination cap applies
overflow is discarded
warning is shown
```

兼容语义：

```ts
accepted = min(incoming, max(0, limit-current))
overflow = incoming - accepted
destination += accepted
discard(overflow)
```

证据等级：PC empirical-high。

仍 open：兵、金、粮、12类兵装的处理顺序；某一类 overflow 是否影响后续类型；件数型兵装满仓时的 UI/分支；平台差异。

## 5. transport arrival 不应把剩余货物留在输送队

因为抵达动作完成后输送队结束当前运输，且满仓时明确提示超出资源消失，所以第一版 fidelity 不应实现成“据点收不下→剩余继续留在原输送队”。

## 6. 野外手动补给与自动补给是两种 UI 入口

PC 历史资料稳定确认：

手动补给：输送队停到目标战斗部队旁边，使用补给命令，打开 slider，玩家自行选择补给量。

自动补给：直接把目标己方部队设成输送队移动目标，到达后自动补给，并向目标最大兵数 / 最大物资方向补。

所以 manualSupplyUI != autoSupplyMission；但二者应共享 target eligibility、target capacity、matching equipment、resource conservation 和 morale merge。是否最终调用同一 finalizer body 仍 open。

## 7. 自动补给受 target cap，不是无限倒空 supplier

目标兵力最多补到指挥上限，金/粮最多补到 troop cap。supplier 超过目标剩余容量时，未转移部分在野外补给路径应继续留给 supplier；这与“运输抵达据点 overflow 直接丢弃”必须分开建模。

## 8. 补兵必须匹配当前数量型陆战兵装

目标为枪/戟/弩/马时，补 N 兵要求 supplier 同时有 N 件对应兵装。剑兵不需要匹配剑库存。

```ts
if (targetLandEquipment in [1,2,3,4]) {
  addTroops = min(
    requestedTroops,
    supplierTroops,
    supplierMatchingEquipment,
    targetStrengthRoom
  )
}
```

## 9. 目标输送队不能作为普通补给目标

日文 Wiki 评论与旧 PC 玩家资料均明确“補給隊に補給は出来ない”。所以普通补给 target gate 应排除 target.TroopType == TRANSPORT。证据等级 PC empirical-high，opcode 仍 open。

## 10. 气力合并核心：按新旧兵数加权平均

日文 Wiki 的明确示例：旧 2500兵/气力0，补入 2500兵/气力100，结果 5000兵/气力50。

对应：

```ts
mixedMoraleRaw = (
  oldTroops * oldMorale
  + addedTroops * incomingMorale
) / (oldTroops + addedTroops)
```

原代码体系中还存在 004B9840 GetBuildingCombinedStrength / GetFacilityCombinedStrength，SIRE 对它的说明正是根据原建筑兵力气力和新增兵力气力计算混合后的气力。其参数直接包括原兵力、原气力、新增兵力、新增兵气力。

因此“兵力加权气力”是原程序的通用资源合并模型，而不是攻略作者自行发明。

## 11. 非整除 rounding 仍不能借 P0-10 强行关闭

P0-10 已确认 00707A74 = MSVC _ftol2，但当前没有公开 xref 证明野外补给 morale merge 会调用 00707A74，也没有 004B9840 的完整 body。

所以正确状态是：

```text
weighted mean formula: confirmed/high
non-divisible rounding: open
```

第一版兼容 profile 可采用整数向下取整，但必须标 compatibility-rounding，不是 PC opcode exact。

需要一个非整除最小存档才能关闭，例如：旧1000兵气力0 + 新500兵气力100，raw=33.333...，观察最终33还是34。

## 12. building merge helper 与 troop merge 不应混用

004B9840 明确是 building combined strength helper。它能证明据点吸收新增兵时也按兵数混气力，但不能据此宣称野外 troop→troop 补兵一定直接 call 004B9840。

正确边界：building merge helper known；troop merge behavior known；troop merge exact helper/caller open。

## 13. sub_4BF1F0 的 exactness 边界

现在已知：function start=004BF1F0，next function=004BF6F0，且包含 004BF522 transport-arrival merit +200。

所以 E6 旧 open“输送抵达据点完整 finalizer 完全未知”应改成：containing function range resolved；resource-write internals open。

仍需恢复 destination building 的兵/金/粮 setter/adjust 调用、兵装循环、capacity clipping、overflow warning、transport troop cleanup、武将位置处理，以及 +200 merit 相对这些步骤的顺序。

## 14. 运输队消灭与正常抵达必须分开

输送队因粮尽或栈道等环境伤害消灭时货物全部消失；被敌军攻击击破时货物可能被敌方掠夺。这些属于 death/loot finalizer，不是 sub_4BF1F0 的正常到达容量逻辑。

## 15. 005DB840 仍只闭合到 AP helper 角色

SIRE 将 005DB840 标为 GetExpeditionActionPointCost。军事府另有输送/出征 AP 减半地址，但完整 body 未公开；P0-13 不重新发明基础 AP 常量。

## 16. 推荐运行时接口

```ts
manualSupply(supplierTransport, targetCombatTroop, requestedTransfer, ruleset)
autoSupply(supplierTransport, targetCombatTroop, ruleset)
resolveTransportArrival(transport, destinationSP, ruleset)
```

野外 supply：按目标剩余容量转移，supplier 保留未转移货物，补兵时更新 target morale weighted mean，奖励 +100 merit / +2 leadership exp。

transport arrival：按 destination cap 接收，overflow 丢失，奖励 +200 merit，然后完成 transport arrival/cleanup。

## 17. 当前剩余 exactness gap

已闭合 / 收紧：
- 004BF522 所属函数范围锁到 sub_4BF1F0；
- transport arrival +200 merit PC地址级确认；
- 到达据点 overflow discard + warning 为 PC empirical-high；
- 手动 slider / 自动 target 两种补给入口分离；
- 自动补给受 target cap；
- 数量型兵装与补兵等量；
- 输送队不能作为普通补给目标；
- 补兵气力按兵数加权；
- 004B9840 提供原程序兵力+气力加权合并结构证据；
- building morale merge 与 troop morale merge 不再混为同一函数。

仍 open：
1. sub_4BF1F0 完整 body；
2. 输送抵达资源逐字段写入顺序；
3. 输送抵达12类兵装循环和件数型边界；
4. overflow warning/discard opcode；
5. 野外手动补给 finalizer；
6. 野外自动补给 finalizer及是否共享核心；
7. target=transport 的PC hard gate地址；
8. troop→troop 气力 merge helper；
9. 非整除气力平均 exact rounding；
10. 野外补给 +100 merit / +2 leadership exp PC地址；
11. 自动补给多资源具体优先级；
12. transport death/loot finalizer和掠夺比例；
13. Vanilla / PS2 / Wii差异。

状态：

```text
P0-13-audit-complete
transport-arrival-containing-function-resolved
transport-arrival-merit-exact
transport-arrival-overflow-high
manual-auto-supply-separated-high
supply-capacity-and-equipment-high
morale-weighted-core-high
morale-rounding-open
wild-supply-finalizer-open
```

## 18. 来源

逆向：
- https://github.com/sjn4048/311MemoryResearch/blob/master/内存资料/地址资料.txt
- https://github.com/sean2077/311SireCustomizedPackageDev/blob/dev/material/内存地址汇总.md
- https://github.com/fudanglp/311resource/blob/master/extractor/ida/data/python_idb/san11pk_dump.exe_functions.csv

日文 Wiki / 历史实测：
- https://w.atwiki.jp/sangokushi11/pages/85.html
- https://w.atwiki.jp/sangokushi11/pages/91.html
- https://w.atwiki.jp/sangokushi11/pages/113.html
- https://w.atwiki.jp/sangokushi11/pages/1950.html
- https://w.atwiki.jp/sangokushi11/pages/1862.html
- https://w.atwiki.jp/sangokushi11/pages/1992.html
- https://w.atwiki.jp/sangokushi11/pages/1471.html
