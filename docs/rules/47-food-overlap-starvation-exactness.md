# P0-12 阵 / 砦 / 城塞重叠耗粮与粮尽逃兵 exactness

更新：2026-10-03。

## 1. 本轮结论

P0-12 处理 E5 最后两个核心缺口：

```text
A. 多个阵 / 砦 / 城塞效果范围重叠时，耗粮倍率如何进入公式
B. 兵粮为0后的部队掉兵机制
```

本轮可以明确：

```text
food-defense-multiplier-single-selector-exact
food-defense-multiplier-bit-patterns-exact
food-defense-multiplier-no-stacking-exact
overlap-winner-inside-0049D180-open
zero-food-scheduler-separation-exact
starvation-desertion-exact-function-open
legacy-0.76-provenance-rejected
```

最重要的两个纠错：

1. 阵/砦/城塞**不会在耗粮公式层叠乘**；`0049D180` 先返回一个设施类型ID，`0049D2E0` 只选择一个 multiplier。
2. 旧 `A*0.76^N` 没有找到可验证的原作实验来源，不能继续标 `empirical-high`；严格 fidelity 层应视为 **unknown**。

## 2. 0049D2E0 只消费一个防御设施类型

战斗部队耗粮：

```asm
0049D30E push esi
0049D30F mov  ecx,edi
0049D311 call 0049D180
0049D316 sub  eax,03
0049D319 je   阵
0049D31B dec  eax
0049D31C je   砦
0049D31E dec  eax
0049D31F je   城塞
```

所以 `0049D180` 的接口语义已经非常明确：

```text
troop
→ one defensive-series facility type id
→ 3 / 4 / 5 / other
```

随后 `0049D2E0` 只进入一个分支。因此阵+砦、砦+城塞等重叠**不会做倍率相乘**。这条“不叠乘”已经是 PC-PK1.1 source-level exact。

仍 open 的只有：`0049D180` 面对多个不同等级的同势力防御设施同时覆盖时，究竟返回哪一个 type。

## 3. 浮点常量已经可以 bit-exact 保存

| 环境 | bits | float32 multiplier |
|---|---|---:|
| 无设施 | `0x40000000` | 2.0 |
| 阵 | `0x3FD55555` | 1.6666666269302368 |
| 砦 | `0x3FAAAAAB` | 1.3333333730697632 |
| 城塞 | `0x3F800000` | 1.0 |

公共耗粮系数：

```text
00763648
0x3D4CCCCD
= 0.05000000074505806f
```

所以战斗部队正常耗粮 raw：

```ts
raw =
  strength
  * selectedDefenseMultiplier
  * float32_0_05
```

最终 `0049D3B0 call 00707A74`。P0-10 已确认 `00707A74 = MSVC _ftol2`，即向0截断；这里 raw 为正，所以等于 `floor`。

## 4. 18000兵的“阵=1499”边界

若误写成数学分数 5/3，会得到1500。但原 float32：

```text
18000
× 1.6666666269302368
× 0.05000000074505806
≈ 1499.9999865889545
```

最后 `_ftol2` 得到 **1499**。这与旧实机 18000兵的 1800/1499/1200/900 观察吻合，因此 fidelity 不应把原 float32 重写成“漂亮的”5/3、4/3。

## 5. 标准测试向量

10000兵：

| 环境 | 耗粮 |
|---|---:|
| 无 | 1000 |
| 阵 | 833 |
| 砦 | 666 |
| 城塞 | 500 |

18000兵：

| 环境 | 耗粮 |
|---|---:|
| 无 | 1800 |
| 阵 | **1499** |
| 砦 | 1200 |
| 城塞 | 900 |

## 6. 重叠设施：只剩“谁赢”未知

已经 exact：`0049D180 → 单一 type → 0049D2E0 单一 multiplier`。所以不能做倍率相乘、节粮百分比相加或同级重复增强。

但 `0049D180` body 未公开，因此不能把“最高等级/最近/最大ID/最先遍历”中的任何一种写成原作。

如果引擎必须先闭环，兼容 fallback 建议采用：

```text
城塞 > 砦 > 阵
```

即 highest-tier-wins。它只能标 `provisional-engine-rule`，不能反写进 fidelity 结论。

## 7. 0059BF40 对“已经0粮”的对象直接跳过

据点：

```asm
0059BFAF GetSPFood
0059BFB6 test eax,eax
0059BFB8 jle  next
```

部队：

```asm
0059C06A cmp [troop+20],0
0059C06D jna next
```

所以进入本旬时 food==0 时，`0059BF40` 不调用耗粮函数，也不在这个函数内扣兵。

如果本旬从正粮扣到0，`0059C088` 之后只是把玩家对象加入“粮尽”消息列表；函数后段直到 `0059C297` 主要是列表/消息处理。

因此可以正式确认：**粮尽掉兵不是 `0059BF40` 的一部分。**

## 8. 粮尽逃兵必定存在另一条每回合处理链

官方手册明确说明：没有兵粮时士兵会减少；Wiki和长期实战也稳定记录 food=0 后兵力每回合大幅下降并可最终消灭部队。

结合 `0059BF40` 对0粮直接跳过，可以确认架构：

```text
0059BF40 food consumption
  positive food -> deduct
  reaches zero  -> message

separate starvation/desertion handler
  food == 0
  -> reduce troops
```

这条**分离架构**已经确认，但第二条函数地址/闭式仍 open。

## 9. 00599AA0 不是野外粮尽逃兵函数

SIRE 地址表命名 `00599AA0 ReducePopForStarvedBesiegedSP`，作用是“兵临城下 + 据点断粮 → 据点人口衰减”。它不能拿来解释野外 troop food==0 后的 strength 下降。

## 10. 旧 0.76 必须降级

旧仓库把：

```text
remaining ≈ A × 0.76^N
```

标成 `empirical-high`。

P0-12 回查后没有找到可靠样本表、受控实验、原地址或公式支持精确0.76。官方只确认会掉兵，Wiki只确认“大幅减少”。因此现在改为：

```text
0.76
= legacy compatibility constant
= provenance unresolved
= NOT empirical-high
= NOT strict fidelity
```

严格 fidelity：

```text
starvationDesertionProfile = unresolved-original
```

只有为了兼容旧模拟结果时才允许 `legacyRetentionPerTurn=0.76`。

## 11. 不再反推一个新的固定百分比

当前无法判断原函数是固定比例、随机比例、按兵力/气力/武将政治，还是战斗队/输送队分支。因此本轮不再提供新的“合理猜测公式”。

正确接口：

```ts
reduceTroopsForStarvation(
  troop,
  ruleset.starvationProfile,
  rng
)
```

## 12. 运输队粮尽消灭与货物

长期实战确认运输队因粮尽/地形等自身损耗消灭时货物消失；这属于 E6 destroy/finalizer 路径，不能反推粮尽每旬掉兵比例。

## 13. 当前实现建议

防御设施 multiplier 应保存原 bit pattern：

```ts
const DEFENSE_FOOD_MULTIPLIER_BITS = {
  none: 0x40000000,
  camp: 0x3fd55555,
  fort: 0x3faaaaab,
  fortress: 0x3f800000,
}
const FOOD_SCALE_BITS = 0x3d4ccccd
```

overlap 通过可替换 selector；starvation 通过可替换 profile。严格 fidelity 不启用0.76。

## 14. 当前剩余 exactness gap

已闭合 / 收紧：
- 防御设施减粮只选择一个设施类型，不叠加；
- `0049D180` 是 single-selector；
- 无/阵/砦/城塞 multiplier float32 bit pattern；
- 公共 `0.05f` bit pattern；
- `_ftol2` 最终 trunc；
- 10000/18000兵测试向量；
- `0059BF40` 对进入旬时0粮对象直接跳过；
- `0059BF40` 只负责扣粮和粮尽提示，不负责粮尽扣兵；
- `00599AA0` 是断粮围城据点人口损失，不是野外部队逃兵；
- 0.76 从 empirical-high 降级为 provenance-unresolved legacy fallback。

仍 open：
1. `0049D180` 完整 body；
2. 不同等级阵/砦/城塞重叠时 winner priority；
3. 野外粮尽掉兵函数地址；
4. 粮尽掉兵闭式 / RNG；
5. 战斗队与输送队是否同公式；
6. 首旬断粮与持续断粮是否不同；
7. 粮尽时气力/武将属性是否参与；
8. Vanilla / PS2 / Wii 差异。

状态：

```text
P0-12-audit-complete
defense-food-single-selector-exact
defense-food-float32-bits-exact
defense-food-nonstacking-exact
defense-overlap-winner-open
food-scheduler-starvation-separation-exact
starvation-function-open
legacy-retention-0.76-downgraded
```

## 15. 来源

- https://github.com/sjn4048/311MemoryResearch/blob/master/内存资料/整理/Func-收支02-每旬耗粮.txt
- https://github.com/sjn4048/311MemoryResearch/blob/master/内存资料/整理/Func-收支10-计算部队兵粮支出.txt
- https://github.com/sjn4048/311MemoryResearch/blob/master/内存资料/整理/Func-自动04-兵临城下逃兵处理.txt
- https://github.com/sean2077/311SireCustomizedPackageDev/blob/dev/material/内存地址汇总.md
- https://github.com/fudanglp/311resource/blob/master/extractor/ida/data/python_idb/san11pk_dump.exe_functions.csv
- KOEI《三國志11 with パワーアップキット》说明书
- https://w.atwiki.jp/sangokushi11/pages/85.html
