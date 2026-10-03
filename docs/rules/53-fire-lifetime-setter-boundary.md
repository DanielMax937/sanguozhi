# P0-18 火焰寿命 setter / 重复点火刷新边界

更新：2026-10-03。主目标版本：PC-PK1.1。

## 1. 本轮结论

P0-18 继续追踪：

- 点火时谁写 fire lifetime；
- 已着火对象再次被点火时，是覆盖、取最大、累加还是重抽；
- 会心 +1 与 base lifetime 的先后顺序。

本轮没有恢复出原 setter body，但把结构边界进一步收紧：

```text
00486320 IsBuildingOnFire
00495CA0 IsTroopOnFire
```

公开 SIRE / 311 资料只确认了“是否着火”的查询入口，没有公开：

```text
SetFireLifetime
GetFireLifetime
DecrementFireLifetime
RefreshFireLifetime
```

这样的原函数或字段。

因此当前状态：

```text
P0-18-audit-complete
fire-state-query-functions-resolved
fire-lifetime-setter-still-open
reignite-refresh-semantics-open
generic-counter-reuse-not-supported
critical-plus1-remains-empirical-high
```

## 2. 着火查询与寿命管理必须分层

已知：

```text
00486320 IsBuildingOnFire
  判断建筑是否着火
  城市会判断7格

00495CA0 IsTroopOnFire
  判断部队是否着火
```

这两个函数证明原程序有独立的“当前是否处于火状态”查询层。

但它们并不能证明：

```text
fireLifetime 存在于 troop/building 普通状态字段
```

更不能证明它复用：

```text
混乱/伪报 remaining counter
技巧研究 remaining turns
任务回合数
```

当前公开结构资料没有给出这样的映射。

## 3. 00599CF0 继续排除

此前 P0-4 已检查：

```text
00599CF0 generic periodic counter routine
```

公开 body 主要处理：

- 技巧研究；
- 能力研究；
- 若干势力/设施临时计数。

没有发现地表火焰寿命的递减/清除链。

P0-18 再次确认：没有新证据支持把火焰寿命塞回 `00599CF0`。

因此：

```text
fire lifetime decrement
!= known 00599CF0 generic counter path
```

至少在当前已恢复证据层成立。

## 4. 重复点火语义仍不能猜

现在仍无法确认：

```text
already burning
+ new ignition
```

时原程序究竟是：

```text
A. overwrite(new)
B. max(old,new)
C. old + new
D. reroll and overwrite
E. only extend when new > old
F. ignore new ignition lifetime
```

因此 fidelity 层禁止写死任何一种。

尤其不能仅凭现代复刻项目的 `SetFire` 行为反推原版。

## 5. 会心 +1 的安全表达

已有原作实测继续支持：

```ts
criticalVisibleDuration
= baseVisibleDuration + 1
```

证据等级仍是：

```text
empirical-high
```

但由于 setter/body 未恢复，当前不能进一步断言机器码顺序一定是：

```text
base = RNG()
if critical:
  base += 1
store(base)
```

也可能存在其他等价实现。

因此引擎接口应表达行为关系，而不是伪造 opcode：

```ts
duration = lifetimeProfile.roll(source)
duration = applyCriticalDurationBonus(duration, +1)
```

## 6. 建议运行时分层

```ts
interface FireState {
  burning: boolean
  lifetimeToken: unknown
}

interface FireLifetimePolicy {
  ignite(source, critical): FireLifetimeToken
  reignite(oldState, source, critical): FireLifetimeToken
  tick(oldState): FireLifetimeToken | Extinguished
}
```

其中：

```text
ignite base distribution = open
reignite semantics = open
tick phase = open
critical +1 = empirical-high
```

这样以后恢复原 setter 时，只替换 policy，不污染战斗/地图接口。

## 7. 当前不能做的推断

不能从：

```text
IsTroopOnFire
IsBuildingOnFire
```

推出：

- 部队本体保存完整 fire lifetime；
- 建筑本体保存完整 fire lifetime；
- 地格、部队、建筑共用同一 counter；
- 火计、火矢、火罠、落雷共用完全相同寿命 RNG；
- 重复点火一定刷新。

这些都继续保持 open。

## 8. 本轮关闭 / 仍 open

### 已关闭 / 收紧

- 原程序存在独立 fire-state query：
  `00486320 / 00495CA0`。
- 不能把“是否着火查询”当成“寿命 setter”。
- 当前没有证据支持复用 `00599CF0` 作为火焰寿命递减器。
- 工程实现应把 fire-state 与 fire-lifetime policy 分层。

### 仍 open

1. PC-PK1.1 点火寿命 setter；
2. base lifetime RNG；
3. lifetime decrement / extinguish caller；
4. internal counter 与可见回合的 phase 映射；
5. 已着火后重复点火的 overwrite/max/add/ignore 语义；
6. 火计/火矢/火罠/落雷是否共用 setter；
7. 会心 +1 的 exact opcode 顺序；
8. Vanilla / PS2 / Wii 等价性。

## 9. 来源

逆向：
- sean2077/311SireCustomizedPackageDev
  - `material/内存地址汇总.md`
  - `00486320 IsBuildingOnFire`
  - `00495CA0 IsTroopOnFire`
- sjn4048/311MemoryResearch
  - `整理/Func-自动02-计数器处理【未】.txt`
  - 火系地址与伤害处理资料

关联：
- `39-fire-lifetime-spread-exactness.md`
- `docs/sources/fire-lifetime-spread-exactness.json`
