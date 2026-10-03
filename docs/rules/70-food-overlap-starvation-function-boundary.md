# P0-35 阵系 overlap winner / starvation original function 边界

更新：2026-10-03。主目标版本：PC-PK1.1。

## 1. 本轮结论

阵/砦/城塞耗粮重叠与粮尽逃兵继续保持两条独立 exactness gap。

新确认：

```text
0049D180 .. 0049D1FF
next = 0049D200 GetSPFoodExpend
length ≈ 0x80 bytes
```

所以 `0049D180` 确实是一个紧凑的 defensive-facility single-selector。

同时，本轮在公开 311MemoryResearch / SIRE / 311resource 中仍没有找到野外 troop starvation/desertion 的命名函数、地址或 xref。

状态：

```text
P0-35-audit-complete
defense-selector-boundary-exact
single-selector-semantics-exact
overlap-winner-open
starvation-handler-address-open
starvation-formula-open
00599AA0-misidentification-rejected
```

## 2. `0049D180` 边界进一步闭合

`311resource` 函数表：

```text
0049D180 sub_49d180
0049D200 GetSPFoodExpend
```

因此函数大小约 `0x80`。

结合 `0049D2E0` caller：

```text
troop
 -> 0049D180
 -> 返回单一 facility type
 -> 只选 阵 / 砦 / 城塞 / none 之一
```

所以：

```text
multiple overlap effects do not stack
```

仍是 source-level exact。

## 3. overlap winner 仍不能从函数大小反推

函数只有约0x80字节，并不意味着一定：

- highest-tier wins；
- nearest wins；
- first matching facility wins；
- lowest/highest facility ID wins。

缺 body / xref / iteration dump 时，这些都不能升级。

严格 fidelity：

```text
overlapWinner = open
```

兼容 fallback 仍可用：

```text
fortress > fort > camp
```

但只标 provisional。

## 4. starvation 与 food-consumption scheduler 继续分离

`0059BF40` 已明确：

```text
food > 0:
  calculate/deduct food

food == 0 at entry:
  skip

deduction reaches 0:
  add starvation message/list
```

它没有 troop-strength reduction。

因此：

```text
food consumption
!=
starvation troop loss
```

两者必须是独立处理链。

## 5. `00599AA0` 不是野外 troop starvation handler

SIRE 明确命名：

```text
00599AA0 ReducePopForStarvedBesiegedSP
```

作用是：

```text
被围据点 + 断粮 -> population decline
```

所以不能把它拿来实现：

```text
field troop food == 0 -> troop strength loss
```

该误认继续明确排除。

## 6. 本轮公开检索仍未找到野外粮尽 handler

对以下关键词/地址族进行公开仓库检索：

```text
starvation
desertion
粮尽
断粮
逃兵
兵粮为0
部队兵力减少
```

没有找到能可靠绑定到：

```text
field troop food == 0
-> AdjustTroopStrength
```

的原函数。

因此不能从 `00599AA0`、`0059BF40` 邻近函数或地址顺序猜 starvation handler。

## 7. 0.76 继续保持 legacy-only

当前仍没有找到：

- 原地址；
- 受控样本表；
- 可靠实验来源；

支持：

```text
remaining = floor(old * 0.76)
```

所以：

```text
legacyRetentionPerTurn = 0.76
```

只能用于历史兼容 profile，不能进入 strict fidelity。

## 8. 当前安全实现

```ts
const facilityType = selectDefenseFacilityForFood(troop)
const multiplier = multiplierFor(facilityType)

if (troop.food === 0) {
  starvationProfile.apply(troop, rng)
}
```

其中：

```text
selectDefenseFacilityForFood:
  function address exact
  overlap winner open

starvationProfile:
  original unresolved
```

## 9. 本轮关闭 / 仍 open

### 已关闭 / 收紧

- `0049D180` 函数边界 `0049D180..0049D1FF`；
- 其 single-selector 角色继续 exact；
- overlap 不叠加继续 exact；
- `0059BF40` 与 starvation 分离；
- `00599AA0` 明确不是野外部队 starvation handler；
- 邻近函数不能据此猜 starvation 地址。

### 仍 open

1. `0049D180` 完整 body；
2. overlap winner priority；
3. 野外 starvation/desertion handler 地址；
4. starvation loss formula / RNG；
5. combat vs transport 是否同公式；
6. 首旬断粮 vs 持续断粮；
7. morale/person-stat influence；
8. Vanilla / PS2 / Wii 差异。

## 10. 来源

- sjn4048/311MemoryResearch `Func-收支02-每旬耗粮.txt` / `Func-收支10-计算部队兵粮支出.txt`
- sean2077/311SireCustomizedPackageDev `material/内存地址汇总.md`
- fudanglp/311resource `san11pk_dump.exe_functions.csv`
- 关联：`47-food-overlap-starvation-exactness.md`、`20-food-consumption.md`
