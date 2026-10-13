# P0-35 阵系 overlap winner / starvation original function 边界

更新：2026-10-12（00599AA0 来源命名纠错）。主目标版本：PC-PK1.1；本次固定 listing 不等于 clean-stock 认证。

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

SIRE 地址表的原标签继续保留：

```text
00599AA0 ReducePopForStarvedBesiegedSP
```

旧文把该标签解释为“断粮据点人口衰减”是误译 / 无依据外推。固定 `311MemoryResearch@66e167e40c3440929ec016f3872aefc3486434c1` 的 `Func-自动04-兵临城下逃兵处理.txt` 完整 listing 给出的对象与操作是：

```text
设施 ID 0..86
 -> 00490D00 解析、0047A630 校验
 -> virtual+0x40：所属势力 0..46
 -> virtual+0x50：设施兵力 signed > 0
 -> 004B99B0 返回非零
 -> 00599B4A call 004AE3C0：增减设施兵力
 -> 再读 virtual+0x50；兵力 <=0 时调用 004875C0 清气力
```

因此名称改为**设施围城兵力减员 caller**，不再称为独立人口字段衰减。该完整 caller 没有显式兵粮 getter、food 字段读取或 `food==0` 比较。`004B99B0` 被源注释解释为城市3格 / 港关2格内有敌部队，但完整 helper 原体不在本文件，内部是否另含粮食等条件仍 open；不得反向宣称 helper 内或所有版本均无断粮条件。

它不能拿来实现：

```text
field troop food == 0 -> troop strength loss
```

该误认继续明确排除。本次只纠正文档与结构化命名，不改变耗粮或减兵算术行为。

固定完整 caller 为 `[00599AA0,00599B8A)`，85 条 / 234 bytes，body SHA256 `6fba1cdb6ac06777a6057f35a6863840fc82370a96af69710a6169c93fbde31e`。原文 GBK 5773 bytes，Git blob `3b6c61f221951851d7125aa4b3ca19f910e864aa`；所列 bytes 的静态 objdump 与 85 条边界逐条吻合。原文 `00599B1D sar dl,05` 为助记符笔误，`c1 fa 05` 解码为 `sar edx,5`；inline 修改建议不替换原始分支 bytes。

证据级别仅为 `source-listing-reconstruction`，不是独立 EXE / IDB、实机或 clean-stock / 跨版本认证。`0084B0A0` 原始常量 bytes、同源 x87 和 `00707A74` 转换合同、RNG、`004B99B0` 与实际 writer 完整语义仍 open；别处 `_ftol2` 身份旁证不能升级为此 listing 的完整认证。原文快照和身份锁存在 `../sources/food-overlap-starvation-exactness.json`，两份 food-overlap checker 离线复核共享证据。

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
- `00599AA0` 固定 listing 是设施围城兵力减员 caller，没有显式粮0门槛；`004B99B0` 内部仍 open，不是野外部队 starvation handler；
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
- [固定 `Func-自动04-兵临城下逃兵处理.txt`](https://github.com/sjn4048/311MemoryResearch/blob/66e167e40c3440929ec016f3872aefc3486434c1/内存资料/整理/Func-自动04-兵临城下逃兵处理.txt)
- sean2077/311SireCustomizedPackageDev `material/内存地址汇总.md`
- fudanglp/311resource `san11pk_dump.exe_functions.csv`
- 关联：`47-food-overlap-starvation-exactness.md`、`20-food-consumption.md`
