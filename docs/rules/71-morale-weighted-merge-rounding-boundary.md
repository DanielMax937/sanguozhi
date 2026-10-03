# P0-36 补给/输送 finalizer 气力非整除 rounding 边界

更新：2026-10-03。主目标版本：PC-PK1.1。

## 1. 本轮结论

补兵后的气力按兵数加权平均这一核心语义继续成立；本轮把原程序中已知的 building merge helper 边界进一步锁定：

```text
004B9840 GetFacilityCombinedStrength
004B98A0 next function
length ≈ 0x60 bytes
```

该 helper 明确接收：

```text
原兵力
原气力
新增兵力
新增兵气力
```

并返回合并后的气力。

但由于公开资料仍没有 `004B9840` body，也没有 troop→troop 补给 helper/xref，因此非整除 rounding 仍不能升级为 PC exact。

状态：

```text
P0-36-audit-complete
weighted-morale-core-high
building-merge-helper-boundary-exact
troop-merge-helper-open
nondivisible-rounding-open
ftol2-assumption-rejected-without-xref
```

## 2. `004B9840` 边界 exact

`311resource`：

```text
004B9840 GetFacilityCombinedStrength
004B98A0 next function
```

所以函数约 `0x60` 字节。

SIRE 对其说明：

```text
根据原建筑中兵力气力和新增加的兵力气力
计算混合后的气力
```

因此这不是一个泛化的“最高兵力”函数，而是专门的 weighted morale merge helper。

## 3. 加权核心可以固定

当前高置信语义：

```text
(oldTroops * oldMorale
 + addedTroops * incomingMorale)
/ (oldTroops + addedTroops)
```

已知整除样例：

```text
2500兵 气力0
+2500兵 气力100
=5000兵 气力50
```

这只能证明 weighted mean 核心，不证明非整除时的取整。

## 4. 为什么不能借 `_ftol2` 强行关闭

P0-10 已确认：

```text
00707A74 = MSVC _ftol2
```

但目前没有：

```text
004B9840 -> 00707A74
```

的公开 xref 或 body。

因此不能直接写：

```text
morale = floor(weightedRaw)
```

并标 PC exact。

原函数也可能使用：

- 整数 `idiv`；
- 加偏置后除法；
- 查表；
- 其他整数实现。

## 5. building merge 与 troop→troop 仍不能混同

`004B9840` 是 building/facility merge helper。

野外补给目标是 troop。

目前没有公开证据证明：

```text
troop supply finalizer
直接 call 004B9840
```

所以正确边界是：

```text
building merge helper known
troop merge behavior high-confidence
troop merge exact helper open
```

## 6. 非整除 rounding 仍需要最小实测或 body

最有价值的样例仍是：

```text
old = 1000兵, morale 0
added = 500兵, morale 100
raw = 33.333...
```

最终如果是：

```text
33 -> floor/trunc candidate
34 -> round-nearest/biased candidate
```

就能先把行为层收紧。

但在没有受控样本或 body 之前，strict fidelity 继续标 open。

## 7. compatibility fallback

第一版兼容实现仍可用：

```ts
mixedMorale = Math.floor(
  (oldTroops * oldMorale + addedTroops * incomingMorale)
  / (oldTroops + addedTroops)
)
```

但必须标：

```text
compatibility-rounding-only
```

## 8. 本轮关闭 / 仍 open

### 已关闭 / 收紧

- `004B9840..004B989F` helper 边界；
- helper 职责是兵力+气力混合；
- weighted mean 核心继续 high-confidence；
- 没有 xref 时不得借 `_ftol2` 关闭 rounding。

### 仍 open

1. `004B9840` 完整 body；
2. building merge 非整除 exact rounding；
3. troop→troop morale merge helper；
4. troop supply finalizer 是否复用同一 helper；
5. field supply 非整除 exact rounding；
6. Vanilla / PS2 / Wii 差异。

## 9. 来源

- sean2077/311SireCustomizedPackageDev `material/内存地址汇总.md`
- fudanglp/311resource `san11pk_dump.exe_functions.csv`
- 日文 Wiki 补兵气力加权实测
- 关联：`48-supply-transport-finalizer-exactness.md`、`21-supply-transport.md`
