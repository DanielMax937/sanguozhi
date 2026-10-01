# P0-9 部队编成最终资源事务 exactness

更新：2026-10-01。

## 1. 本轮目标与结论

E1 已经解决“玩家在出征界面最多能选多少兵/钱/粮”。P0-9 继续追：草稿是否合法 → 点击“决定” → 据点资源减少 → runtime troop 写入 → 部队移动/补给 → 回到据点 → 资源返还。

本轮必须分三层：

~~~text
A. draft capacity / legality：PC-PK1.1 reverse-engineered
B. resource-transfer semantics：official + structure + old empirical-high
C. exact commit / return caller and instruction order：still open
~~~

状态：

~~~text
P0-9-audit-complete
sortie-draft-limits-resolved
transport-cargo-caps-resolved-high
resource-mutation-primitives-resolved
combat-resource-transfer-semantics-high
commit-finalizer-caller-open
return-finalizer-caller-open
return-overflow-order-open
~~~

最重要的原则：不再把 UI slider 函数 00647250 / 00647AC0 / 00615790... 冒充成资源提交 finalizer。

## 2. 原作把 draft 与 runtime troop 分开

PC-PK1.1 的 struct_troop 已确认独立保存：

~~~text
+08 TroopType
+18 TroopStrength
+1C Money
+20 Food
+48 EquipmentStatus[12]
+A8 CurrentUnitType
~~~

而出征 UI 使用另一块临时状态计算选将、陆战兵种、水战兵种、兵力、金、粮和输送货物。311MemoryResearch 还保留了“出兵部队结构内存，用来定位写这个结构的代码.png”，说明原研究者也明确把界面草稿结构和实际 troop 写入函数分成两个阶段。

因此实现层至少拆为 validateSortieDraft() / commitSortieResources() / createRuntimeTroop()；不能在拖动 slider 时直接修改城市库存。

来源：
- https://github.com/sjn4048/311MemoryResearch/blob/master/内存资料/出征窗口部分界面代码.txt
- https://github.com/sjn4048/311MemoryResearch/blob/master/内存资料/出兵部队结构内存，用来定位写这个结构的代码.png
- https://github.com/sean2077/311SireCustomizedPackageDev/blob/dev/material/结构体汇总.md

## 3. 战斗部队兵力 draft：PC-PK1.1 exact

00647250 可整理为：

~~~text
maxTroops = min(leaderCommandCap, sourceBuildingTroops)

if landEquipmentId in 1..4:
  maxTroops = min(maxTroops, sourceEquipment[landEquipmentId])

minTroops = min(1, maxTroops)
~~~

ID 1～4 为枪/戟/弩/马。所以 selectedTroops <= 对应据点兵装库存，且玩家战斗部队最小出兵为 1，均为源码级 exact。

## 4. 战斗部队钱粮 slider 与 runtime cap 是同一组常量

金：出征界面 00647E2A / 00647E3A；runtime helper 004957F0 GetTroopMoneyLimit；原常量 0x2710 = 10000；资源变化后 00496260 再调用 004957F0 封顶。

粮：出征界面 00647D8E / 00647D9E；runtime helper 00495810 GetTroopFoodLimit；原常量 0xC350 = 50000；资源变化后 00496290 再调用 00495810 封顶。

因此 battleTroop.money <= 10000、battleTroop.food <= 50000 不是 UI 建议值，而是 troop runtime 容量。

来源：
- https://github.com/sjn4048/311MemoryResearch/blob/master/内存资料/地址资料.txt
- https://github.com/sean2077/311SireCustomizedPackageDev/blob/dev/material/内存地址汇总.md

## 5. 输送队兵 / 金 / 粮容量：地址级闭合

输送队 TroopType=1：
- 兵力 60000 = 0xEA60；地址 004957E3、00496224、0061584F/65、00615B6F/83。
- 金 100000 = 0x186A0；UI 地址 006158C3/D9、00615C6B/7F。
- 粮 500000 = 0x7A120；UI 地址 00615937/4D、00615D67/7B。

AI 输送同样直接出现 005F1E23..2B=60000、005F1E5E..66=100000、005F1E3C..43=500000。原研究另注明 troop strength 底层存在 65535 hard boundary，因此输送上限 60000 安全低于存储极限。

## 6. 输送兵装容量：100000 可以从 open 升级

旧 E1 已定位 006157C1/006157D8、004962CF/004962D6、00496306/0D/28/2F，但没有写数值。

SIRE 的早期逆向/修复记录明确写：运输队兵装上限设定超过 100000 后，补给过后会变回 100000。结合上述 runtime / resupply cap 地址，可以把普通 transport equipment quantity hard cap 升级为 100000，证据等级 reverse-history-high。

但还不能声称 12 种兵装所有路径逐指令完全一致：攻具/舰船是件数型；历史上又单独修过运输高级舰船边界。因此件数型货物的 exact per-type handling 继续 open。

来源：
- https://www.xycq.org.cn/forum/viewthread.php?action=printable&tid=209820
- https://github.com/sjn4048/311MemoryResearch/blob/master/内存资料/地址资料.txt

## 7. 原版资源修改 primitive 已经齐全

据点读取：00486B10 troops、00486C80 money、00486DF0 food、00486950 equipment。
据点 setter：00487230 troops、00487310 money、004873F0 food、004874D0 equipment。
据点增减：004AE2A0 money、004AE300 food、004AE3C0 troops、004AE430 equipment。

部队侧：00496010 GetTroopStrength、004954E0 GetTroopEquipmentNum、00496280 SetTroopFood、004AE4A0 AdjustTroopStrength、004AE510 AdjustTroopMoney、004AE570 AdjustTroopFood。

这说明原版具备 building → troop 与 troop → building 对称资源事务所需的底层 primitive；但 primitive 已知不等于 finalizer caller 已知，不能凭 helper 自行发明调用顺序。

## 8. 各类兵装的资源语义

ID0 剑：不进入 00647250 库存限制，不按士兵数扣剑库存。

ID1～4 枪/戟/弩/马：数量型。UI 已明确 selectedTroops <= matchingEquipmentStock，官方说明和长期实测也确认出 10000 枪兵需要 10000 枪，损兵时相应兵装按人数消耗。因此 equipmentCost[1..4] = selectedTroops 可作为 fidelity semantic invariant；具体 finalizer 是否调用 004AE430 仍 open。

ID5～8 冲车/井栏/投石/木兽：件数型。一支兵器部队占用一件对应攻具，而不是 5000 兵需要 5000 台。pieceCost=1 标 documented/empirical-high；原 EXE 扣 1 caller 未展开。

ID9 走舸：默认水上 profile，不按士兵数准备库存。

ID10/11 楼船/斗舰：按部队件数准备，一支高级舰船部队对应一艘；精确扣 1 caller 仍 open。

## 9. commit 的资源守恒语义可以固定，但指令顺序不能

用户按“决定”后，最低限度必须满足 source building 减去所选兵/金/粮/兵装，runtime troop 得到同一批兵/金/粮/兵装，否则 troop 的 +18/+1C/+20/+48 与官方运输语义无法成立。

所以 resource conservation invariant 可以固定；但目前不能宣称原作一定按“先兵→金→粮→兵装→建 troop”或相反顺序执行，也不能宣称 rollback 语义已恢复。

状态：transfer semantics high confidence；exact opcode order / rollback semantics open。

## 10. 现代 sango_infinity 不能当原版 finalizer

现代复刻的战斗出征会先 Cost 陆/水兵装，再直接 city.troops/food/gold 扣减；运输则扣 city 兵/粮/金并 Remove(itemStore)；回城会 AddGold/AddFood/AddTroops 并返还陆水 costItems 与运输 itemStore。

这是一套合理的 reconstruction，但不是 San11PK.exe 的逐指令翻译。特别是 woundedTroops 如何返还兵装、rollback 与 overflow 都可能是现代工程决定，所以只能作 architecture contrast，不能反向标成 PC-PK exact。

## 11. 回城 / 进入友方据点：资源会入库

长期原作实战与官方输送语义一致：部队进入己方据点后，持有兵力/金/粮/可返还兵装并入据点，runtime troop 结束。高级攻具/舰船只要部队存活并成功回城，可以再次作为库存使用，不是一出征就永久消耗。

因此 piece equipment 的高置信语义是 sortie 占用/扣一件，成功回城恢复存活件；但 enter-building caller、普通数量型兵装返还量、伤兵与兵装顺序等仍未公开文本化。

## 12. 据点容量溢出不能忽略

2006 年原作实机记录指出：部队进入据点时若资源超过据点容量，界面会提示超出部分损失。因此 returnToBuilding() 不能无限相加。

兼容模型可先用 accepted=min(incoming, capacity-current)，overflow=incoming-accepted，并将 overflow lost / warning 标为 empirical-high。多资源同时溢出、港关扩张科技、件数型攻具/舰船满仓等精确顺序仍需原 return finalizer。

来源：
- https://forum.gamer.com.tw/Co.php?bsn=6331&sn=41312

## 13. 已知 UI / draft 函数边界

IDB functions.csv 将地址归入：
- 00647250 = sub_647250：battle troop-count draft。
- 00647D8E / 00647E2A 位于 sub_647AC0（00647AC0..0064863F）：battle money/food resource draft。
- 006157C1 / 006158C3 位于 sub_615790：transport cargo draft。
- 00615C6B 位于 sub_615A10：transport cargo draft 后段。

所以可以明确：这些函数属于 UI/draft 层，不是 finalizer。

来源：
- https://github.com/fudanglp/311resource/blob/master/extractor/ida/data/python_idb/san11pk_dump.exe_functions.csv

## 14. 为什么 finalizer 继续 open

公开 IDB 导出目前只有 functions / names / structs / struct members。311resource 自己也明确说明，如果继续追函数内部，需要额外导出 xref / disassembly / decompiler context。

当前公开数据没有对 004AE2A0/300/3C0/430 的 caller xref、troop write xref、sub_647AC0 完整反编译或 enter-city finalizer 的完整反编译。因此继续标 open 是证据边界，而不是把未找到的函数猜出来。

来源：
- https://github.com/fudanglp/311resource/blob/master/docs/analysis/ida_resource_hints.md

## 15. 当前推荐 architecture

至少分为 SortieDraft、validateSortieDraft、commitSortieTransactionAtomically、createRuntimeTroopFromCommittedDraft。

commit 前再次 revalidate 是工程安全策略，用于避免 UI 打开后资源发生变化导致负库存；不能标成“原 EXE 已确认二次校验”。

## 16. compatibility fallback

战斗出征：source 扣 draft troops/money/food；ID1～4 扣 selectedTroops；ID5～8 扣 1；ID0 不扣；ID10/11 扣 1；ID9 不扣。

输送：source 扣 draft troops/money/food，并逐类扣 cargo equipment。

回城：按 destination remaining capacity 接收资源，超出部分按 empirical-high 的 clip-and-discard-with-warning 兼容策略处理。

这些事务顺序属于 engineering fallback；piece cost=1 为 documented/empirical-high；数量型 1～4 等量为 official/gameplay-high，均不能冒充 finalizer opcode exact。

## 17. 当前剩余 exactness gap

已闭合 / 收紧：
- battle troop-count draft 与 battle resource draft 已分离定位；
- battle money=10000、food=50000；
- transport troops=60000、money=100000、food=500000；
- transport ordinary equipment quantity cap=100000 从 open 升级为 reverse-history-high；
- troop strength 65535 hard boundary；
- 据点/troop 两侧 resource mutation helpers；
- ID1～4 数量型等量语义；
- ID5～8/10～11 件数型与 troop count 解耦；
- 回城资源入库与存活件数型装备可回收；
- 据点容量 overflow 会损失的老实机行为；
- sub_647250 / sub_647AC0 / sub_615790 / sub_615A10 明确属于 draft/UI；
- 现代 reconstruction 的事务顺序已隔离。

仍 open：
1. battle sortie actual commit finalizer 地址/body；
2. transport sortie actual commit finalizer 地址/body；
3. commit 据点兵/金/粮/兵装精确调用顺序；
4. runtime troop 创建与 source deduction 先后；
5. commit 失败/中断 rollback；
6. ID5～8/10～11 原 EXE 扣1 caller；
7. transport 12种兵装是否完全共享100000路径；
8. transport 高级舰船/攻具特殊边界；
9. enter-building/disband finalizer；
10. 普通数量型兵装回城精确返还量；
11. 伤兵与兵装返还顺序；
12. 多资源同时超据点容量的裁剪顺序；
13. 出征候选武将完整资格过滤；
14. Vanilla / PS2 / Wii finalizer 差异。

最终状态：

~~~text
P0-9-audit-complete
draft-function-boundaries-resolved
battle-resource-caps-exact
transport-basic-caps-exact
transport-equipment-100000-high
resource-mutation-primitives-resolved
commit-semantics-high
commit-opcode-order-open
return-semantics-high
return-finalizer-open
~~~

## 18. 来源

逆向：
- https://github.com/sjn4048/311MemoryResearch/blob/master/内存资料/出征窗口部分界面代码.txt
- https://github.com/sjn4048/311MemoryResearch/blob/master/内存资料/地址资料.txt
- https://github.com/sean2077/311SireCustomizedPackageDev/blob/dev/material/内存地址汇总.md
- https://github.com/sean2077/311SireCustomizedPackageDev/blob/dev/material/结构体汇总.md
- https://github.com/fudanglp/311resource/blob/master/extractor/ida/data/python_idb/san11pk_dump.exe_functions.csv
- https://github.com/fudanglp/311resource/blob/master/docs/analysis/ida_resource_hints.md

官方 / 原作资料：
- https://cdn.akamai.steamstatic.com/steam/apps/628070/manuals/32sangokushi11wpk_manual.pdf
- https://w.atwiki.jp/sangokushi11/pages/85.html

SIRE reverse-history：
- https://www.xycq.org.cn/forum/viewthread.php?action=printable&tid=209820

容量溢出实测：
- https://forum.gamer.com.tw/Co.php?bsn=6331&sn=41312

现代 reconstruction（只作架构对照）：
- https://github.com/tankyc/sango_infinity/blob/main/Project/Assets/Sango/Scripts/Game/System/City/CityExpedition.cs
- https://github.com/tankyc/sango_infinity/blob/main/Project/Assets/Sango/Scripts/Game/System/City/CityTransport.cs
- https://github.com/tankyc/sango_infinity/blob/main/Project/Assets/Sango/Scripts/Game/Object/Troop/Troop.cs
