# P0-45 内政设施保留 selector / retained-facility RNG 边界

> 历史审计记录：当前结论以 [P0-46来源限定审计](81-capture-selector-source-profile.md) 为准。公开IDB已恢复 containing body、city-only selector/RNG与晚期耐久下限，但输入路径含MOD目录，stock PC-PK1.1等价性仍open。以下保留当轮证据状态，不作为当前“body尚未找到”的进度指针。

更新：2026-10-04。主目标版本：PC-PK1.1。

## 1. 本轮结论

攻陷城市后保留内政设施的数量档位继续保持：

```text
魅力 >=100 -> 最多5座
80..99     -> 4座
60..79     -> 3座
40..59     -> 2座
<=39       -> 1座
```

证据等级仍是：

```text
documented / empirical-high
```

本轮仍未找到 PC-PK1.1 中负责：

```text
从 existing domestic facilities
选择具体 retained facilities
```

的 selector / RNG / sort body。

同时明确排除两个易混函数：

```text
004BA610
  = 单个内政设施被破坏时资源掉落计算

004B329B
  = 破城后金/粮/兵/12类兵装保留比例
```

二者都不是 retained-facility selector。

状态：

```text
P0-45-audit-complete
retained-count-bins-empirical-high
single-facility-loot-function-excluded
captured-resource-retention-function-excluded
retained-facility-selector-open
rng-vs-ordering-open
```

## 2. 数量档位与 selector 必须分层

当前可靠的是：

```text
keepCount = f(capturingCommanderCharisma)
```

而不是：

```text
which facilities survive = known
```

所以实现必须分：

```ts
keepCount = resolveRetainedFacilityCount(charisma)
retained = selectRetainedFacilities(existing, keepCount, selectorProfile)
```

其中前者高置信，后者 open。

## 3. `004BA610` 不是 selector

`函数[破坏内政设施和破城获取资源].txt` 中的函数1：

```text
004BA610 ...
```

处理的是：

- 某一座内政设施被破坏；
- 根据设施类型；
- 攻击方政治/魅力；
- 原城市太守政治/魅力；
- 科技；

计算：

```text
掉钱 / 掉粮 / 掉兵 / 掉兵装 / 掉攻城器 / 掉船
```

它的输入语义是“被破坏的单个设施”，不是“破城后城市内政设施候选集合”。

因此不能拿它来解释攻陷后的保留 selector。

## 4. `004B329B` 也不是 selector

`004B329B` 已 exact 解决：

```text
retainPct = max(5, floor(commanderCharisma/10))
```

然后统一作用于：

- money；
- food；
- troops；
- equipment[0..11]。

这条路径与“保留哪几座内政设施”是另一套机制。

## 5. 当前不知道 selector 是随机还是顺序

仍可能存在：

- 随机无放回抽取；
- facility ID ascending/descending；
- 建造时间顺序；
- 地块顺序；
- 设施类型优先级；
- 等级优先；
- 特殊设施保护；
- 混合规则。

目前没有 xref / body 能支持其中任一项。

## 6. 玩家不能手选，不等于一定纯随机

旧玩家资料确认：

```text
攻陷时玩家不能自己指定保留哪几座
```

但这只能排除：

```text
user choice selector
```

不能推出：

```text
uniform random sample
```

因此 `seededSampleWithoutReplacement()` 仍只能是工程 fallback。

## 7. 当前安全 fallback

```ts
const keepCount = min(
  existingFacilities.length,
  charisma >= 100 ? 5 :
  charisma >= 80  ? 4 :
  charisma >= 60  ? 3 :
  charisma >= 40  ? 2 : 1
)

const retained = seededSampleWithoutReplacement(
  existingFacilities,
  keepCount,
  replayableSeed
)
```

必须标：

```text
selectorEvidence = provisional-engine-rule
```

## 8. 本轮关闭 / 仍 open

### 已关闭 / 收紧

- 保留数量档位继续 empirical-high；
- 数量档位与具体 selector 分层；
- `004BA610` 排除为 retained-facility selector；
- `004B329B` 排除为 retained-facility selector；
- “玩家不能手选”不能推出“均匀随机”。

### 仍 open

1. retained-facility selector 地址；
2. candidate list 构造顺序；
3. random vs deterministic ordering；
4. RNG helper/xref；
5. 是否有设施类型/等级优先级；
6. 特殊设施是否另有保护；
7. Vanilla / PS2 / Wii 差异。

## 9. 来源

- sjn4048/311MemoryResearch `函数[破坏内政设施和破城获取资源].txt`
- 日文 Wiki 攻陷后内政设施保留实测
- 关联：`05-combat.md`、`16-unresolved-rules-fallbacks.md`
