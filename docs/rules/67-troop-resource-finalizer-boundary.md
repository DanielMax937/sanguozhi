# P0-32 部队资源事务 finalizer / commit-return 边界

更新：2026-10-03。主目标版本：PC-PK1.1。

## 1. 本轮结论

当前公开逆向仍没有恢复 battle sortie / transport sortie 的实际 commit finalizer，也没有恢复 enter-building / disband 的 return finalizer。

但可以进一步明确：

```text
004AE2A0 IncreaseSPMoney
004AE300 AdjustSPFood
004AE3C0 AdjustSPSoldier
004AE430 AdjustSPEquipment

004AE4A0 AdjustTroopStrength
004AE510 AdjustTroopMoney
004AE570 AdjustTroopFood
```

这些只是底层资源 mutation primitives，不是 finalizer 本身。

状态：

```text
P0-32-audit-complete
resource-primitives-role-exact
draft-vs-commit-separation-exact
commit-finalizer-address-open
return-finalizer-address-open
commit-order-open
rollback-open
```

## 2. 为什么 primitives 不能冒充 finalizer

SIRE 地址表只说明这些函数做单一资源增减：

```text
building money / food / troops / equipment
troop strength / money / food
```

并没有说明：

```text
某个“出征决定”函数
依次调用它们
然后创建 troop
最后提交事务
```

因此：

```text
resource mutation primitive
!=
sortie commit finalizer
```

必须继续分层。

## 3. draft/UI 与 commit 已明确是两套函数

已知 draft/UI：

```text
00647250 battle troop-count draft
00647AC0 battle money/food draft
00615790 transport cargo draft
00615A10 transport cargo draft continuation
```

这些只负责界面草稿、容量与合法性。

真正的 source deduction / troop writeback 必须发生在后续执行层。

公开资料仍未给出该执行层地址。

## 4. commit 最低不变量可以固定，但 opcode 顺序不能

从 runtime troop 结构和资源语义可固定：

```text
source building loses selected resources
runtime troop receives corresponding resources
```

但当前不能声称原作顺序是：

```text
扣兵 -> 扣钱 -> 扣粮 -> 扣兵装 -> 创建 troop
```

也不能声称是反过来。

同样不能声称：

- 失败时统一 rollback；
- 创建 troop 失败后如何恢复资源；
- 各资源是 setter 还是 adjust primitive；
- 兵装扣减与 troop EquipmentStatus 写入的先后。

## 5. return finalizer 仍是独立缺口

回城/进入己方据点高置信语义：

```text
troop resources merge into destination building
surviving piece equipment becomes reusable
destination capacity applies
overflow may be lost
```

但仍缺：

```text
enter-building/disband finalizer
```

的地址与 body。

因此 return path 不能直接用 sortie commit 的逆过程冒充原作。

## 6. 当前安全 architecture

```ts
validateSortieDraft(draft)
commitSortieTransaction(draft)
createRuntimeTroop(draft)

returnTroopToBuilding(troop, destination)
```

其中：

```text
validateSortieDraft:
  reverse-exact / high

commitSortieTransaction:
  semantics high
  opcode order open

returnTroopToBuilding:
  semantics high
  finalizer open
```

## 7. 本轮关闭 / 仍 open

### 已关闭 / 收紧

- building/troop resource primitives 的角色只到“单项增减”；
- draft/UI 函数与 commit 执行层明确分离；
- 不允许把 `004AE2A0/300/3C0/430` 等直接命名为出征 finalizer；
- commit 与 return 必须视为两套独立事务层。

### 仍 open

1. battle sortie commit finalizer address/body；
2. transport sortie commit finalizer address/body；
3. source deduction vs troop creation exact order；
4. building resource mutation exact call order；
5. equipment writeback exact order；
6. commit failure / cancellation rollback；
7. enter-building/disband return finalizer；
8. regular equipment return quantity；
9. wounded/equipment return order；
10. multi-resource overflow clipping order；
11. Vanilla / PS2 / Wii 差异。

## 8. 来源

- sean2077/311SireCustomizedPackageDev `material/内存地址汇总.md`
- sjn4048/311MemoryResearch 出征界面与地址资料
- 关联：`44-troop-resource-transaction-exactness.md`
